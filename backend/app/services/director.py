import asyncio
import json
import logging
import random
import re
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from pathlib import Path

from sqlalchemy import func, select, text

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models import Agent, AgentPromptLayer, BattleLog, FeedEvent, OAuthToken, Ticket, TicketParticipant, User
from app.services.llm_client import llm_client
from app.services.secondme_client import secondme_client

settings = get_settings()

# #region agent log
# 与 Cursor debug 会话一致：写入项目根 .cursor/debug.log
DEBUG_LOG_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".cursor" / "debug.log"


def _debug_log(location: str, message: str, data: dict | None = None, hypothesis_id: str | None = None) -> None:
    try:
        payload = {"id": f"log_{id(datetime.now(UTC))}", "timestamp": int(datetime.now(UTC).timestamp() * 1000), "location": location, "message": message}
        if data:
            payload["data"] = data
        if hypothesis_id:
            payload["hypothesisId"] = hypothesis_id
        DEBUG_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(DEBUG_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:  # noqa: BLE001
        pass
# #endregion
logger = logging.getLogger(__name__)
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

DIRECTOR_LOCK_KEY = 2026021101

FALLBACK_TICKETS = [
    ("跨部门甩锅复盘", "研发与产品关于需求理解发生认知偏差，请给出闭环方案。", 42),
    ("老板临时加会", "今晚十点紧急对齐，要求拿出可落地抓手。", 36),
    ("周报颗粒度革命", "把周报细化到小时颗粒度，并形成可追踪看板。", 32),
    ("需求池清淤行动", "历史遗留任务堆积，要求一周内全部闭环。", 50),
]


@dataclass
class Participant:
    agent_id: uuid.UUID
    user_id: uuid.UUID
    nickname: str
    persona_stack: list[str]
    is_npc: bool
    secondme_access_token: str | None
    secondme_user_id: str


@dataclass
class TicketSpec:
    title: str
    description: str
    budget: int
    opening_line: str


class DirectorWorker:
    def __init__(self) -> None:
        self._stopped = False
        self._battle_tasks: set[asyncio.Task] = set()

    async def run_forever(self) -> None:
        logger.info("Director started")
        while not self._stopped:
            try:
                self._cleanup_tasks()
                await self._tick()
            except Exception:  # noqa: BLE001
                logger.exception("Director tick failed")
            await asyncio.sleep(settings.director_interval_seconds)

    async def stop(self) -> None:
        self._stopped = True
        for task in list(self._battle_tasks):
            task.cancel()
        if self._battle_tasks:
            await asyncio.gather(*self._battle_tasks, return_exceptions=True)
        self._battle_tasks.clear()

    def _cleanup_tasks(self) -> None:
        finished = {task for task in self._battle_tasks if task.done()}
        for task in finished:
            try:
                task.result()
            except Exception:  # noqa: BLE001
                logger.exception("Director battle task failed")
        self._battle_tasks -= finished

    async def _tick(self) -> None:
        spawned: list[tuple[uuid.UUID, list[Participant], TicketSpec]] = []
        spec_pool_size = max(0, int(settings.director_max_active_battles))
        spec_pool: list[TicketSpec] = []
        if spec_pool_size > 0:
            # Never await external model calls while holding DB advisory lock.
            spec_pool = list(
                await asyncio.gather(*[self._generate_ticket_spec() for _ in range(spec_pool_size)])
            )
        spec_idx = 0
        with SessionLocal() as db:
            acquired = db.scalar(text("SELECT pg_try_advisory_lock(:k)"), {"k": DIRECTOR_LOCK_KEY})
            if not acquired:
                _debug_log("director.py:_tick", "skip_tick_lock_not_acquired", {"lock_key": DIRECTOR_LOCK_KEY}, "H3")
                return
            try:
                # 实时监控：工单数、agent 状态分布，便于和 UI 对照 debug
                try:
                    ticket_rows = db.execute(text("SELECT status, count(*) FROM tickets GROUP BY status")).fetchall()
                    agent_rows = db.execute(text("SELECT status, count(*) FROM agents GROUP BY status")).fetchall()
                    idle_with_token = db.scalar(
                        text("""
                            SELECT count(DISTINCT a.id) FROM agents a
                            JOIN users u ON u.id = a.user_id
                            JOIN oauth_tokens ot ON ot.user_id = u.id AND ot.provider = 'secondme' AND ot.access_token IS NOT NULL
                            WHERE a.status = 'IDLE' AND a.is_paused = false
                        """)
                    ) or 0
                    logger.info(
                        "director_tick_stats tickets=%s agents=%s idle_with_token=%s",
                        dict(ticket_rows),
                        dict(agent_rows),
                        idle_with_token,
                    )
                except Exception:  # noqa: BLE001
                    pass

                self._recover_stuck_locked(db, timeout_seconds=settings.director_stuck_timeout_seconds)
                self._repair_orphaned_agents(db)
                self._release_cooldowns(db)

                active_locked = db.scalar(
                    select(func.count()).select_from(Ticket).where(Ticket.status == "LOCKED")
                ) or 0
                slots = max(0, settings.director_max_active_battles - int(active_locked))
                for _ in range(slots):
                    participants = self._pick_participants(db)
                    if len(participants) < 2:
                        break

                    if spec_idx >= len(spec_pool):
                        break
                    ticket_spec = spec_pool[spec_idx]
                    spec_idx += 1
                    ticket_id = self._create_locked_ticket(db, participants, ticket_spec)
                    if ticket_id is None:
                        break
                    spawned.append((ticket_id, participants, ticket_spec))

                db.commit()
            finally:
                db.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": DIRECTOR_LOCK_KEY})
                db.commit()

        for ticket_id, participants, ticket_spec in spawned:
            task = asyncio.create_task(self._run_battle(ticket_id, participants, ticket_spec))
            self._battle_tasks.add(task)

    def _release_cooldowns(self, db) -> None:
        now = datetime.now(UTC)
        rows = db.scalars(select(Agent).where(Agent.status == "COOLDOWN")).all()
        # #region agent log
        skipped_none = sum(1 for a in rows if a.cooldown_until is None)
        released = 0
        # #endregion
        for agent in rows:
            # cooldown_until=None 已改为自动设过期时间，此处仅兼容历史脏数据
            if agent.cooldown_until is None:
                continue
            if agent.cooldown_until > now:
                continue
            if agent.is_paused:
                agent.status = "PAUSED"
            else:
                agent.status = "IDLE"
            agent.cooldown_until = None
            # #region agent log
            released += 1
            # #endregion
        # #region agent log
        if skipped_none or released:
            _debug_log("director.py:_release_cooldowns", "cooldown release", {"skipped_none": skipped_none, "released": released, "total_cooldown": len(rows)}, "H1")
        # #endregion

    def _repair_orphaned_agents(self, db) -> None:
        """Fix agents stuck in IN_MEETING with no active LOCKED ticket."""
        stuck_agents = db.scalars(
            select(Agent).where(Agent.status == "IN_MEETING")
        ).all()
        for agent in stuck_agents:
            has_active = db.scalar(
                select(func.count())
                .select_from(TicketParticipant)
                .join(Ticket, Ticket.id == TicketParticipant.ticket_id)
                .where(
                    TicketParticipant.agent_id == agent.id,
                    Ticket.status == "LOCKED",
                )
            )
            if not has_active:
                logger.warning("Repairing orphaned agent %s (%s)", agent.nickname, agent.id)
                agent.status = "PAUSED" if agent.is_paused else "IDLE"
                agent.cooldown_until = None

    def _recover_stuck_locked(self, db, timeout_seconds: int) -> None:
        now = datetime.now(UTC)
        cutoff = now - timedelta(seconds=timeout_seconds)
        stuck_tickets = db.scalars(
            select(Ticket).where(
                Ticket.status == "LOCKED",
                Ticket.started_at.is_not(None),
                Ticket.started_at <= cutoff,
            )
        ).all()

        for ticket in stuck_tickets:
            self._release_ticket_participants(db, ticket.id)
            ticket.status = "CLOSED"
            ticket.ended_at = now
            db.add(
                BattleLog(
                    ticket_id=ticket.id,
                    round=99,
                    speaker_type="SYSTEM",
                    speaker_agent_id=None,
                    speaker_name="System",
                    content="会议超时未闭环，系统已强制散会并回收状态。",
                )
            )
            db.add(
                FeedEvent(
                    event_type="battle_abort",
                    content=f"《{ticket.title}》超时未闭环，系统已回收会议室。",
                    ref_ticket_id=ticket.id,
                )
            )
            logger.warning("Director recovered stuck ticket %s", str(ticket.id))

    def _pick_participants(self, db) -> list[Participant]:
        # 匹配逻辑（纯真人）：从 IDLE、未暂停、且不在任意 LOCKED 工单的 agent 中，
        # 优先有 secondme access_token 的真人；不足时用无 token 真人补位（发言时自动走 LLM fallback）。
        # 排除已在任意 LOCKED 工单中的 agent，防止同一人同时出现在两场
        in_locked = select(TicketParticipant.agent_id).join(Ticket, Ticket.id == TicketParticipant.ticket_id).where(Ticket.status == "LOCKED")
        idle_agents = db.scalars(
            select(Agent)
            .where(Agent.status == "IDLE", Agent.is_paused.is_(False), ~Agent.id.in_(in_locked))
            .order_by(func.random())
            .limit(32)
        ).all()

        if not idle_agents:
            logger.info("pick_participants: no idle agents available")
            return []

        user_ids = list({agent.user_id for agent in idle_agents})
        users = db.scalars(select(User).where(User.id.in_(user_ids))).all()
        user_by_id: dict[uuid.UUID, User] = {u.id: u for u in users}

        # 真人：非 NPC（secondme_user_id 不以 npc_ 开头）
        real_agents = [
            agent
            for agent in idle_agents
            if (user := user_by_id.get(agent.user_id)) is not None and not (user.secondme_user_id or "").startswith("npc_")
        ]
        if len(real_agents) < 2:
            logger.info("pick_participants: idle=%d real=%d -> insufficient real agents", len(idle_agents), len(real_agents))
            return []

        picked_agents: list[Agent] = []
        token_rows = db.scalars(
            select(OAuthToken)
            .where(
                OAuthToken.user_id.in_([a.user_id for a in real_agents]),
                OAuthToken.provider == "secondme",
                OAuthToken.access_token.is_not(None),
            )
            .order_by(OAuthToken.user_id.asc(), OAuthToken.updated_at.desc())
        ).all()
        token_by_user_id: dict[uuid.UUID, str] = {}
        for token_row in token_rows:
            token_by_user_id.setdefault(token_row.user_id, token_row.access_token)

        real_agents_with_token = [a for a in real_agents if bool(token_by_user_id.get(a.user_id))]

        logger.info(
            "pick_participants: idle=%d real=%d real_with_token=%d",
            len(idle_agents), len(real_agents), len(real_agents_with_token),
        )

        # 优先 token 真人，token 不足则用真人补位，确保池子有 2 人就能开局。
        if len(real_agents_with_token) >= 2:
            picked_agents.extend(random.sample(real_agents_with_token, 2))
        else:
            picked_agents.extend(real_agents_with_token)
            remain = [a for a in real_agents if a.id not in {x.id for x in picked_agents}]
            need = 2 - len(picked_agents)
            if len(remain) < need:
                _debug_log(
                    "director.py:_pick_participants",
                    "match_fail_real_pool_unstable",
                    {"idle": len(idle_agents), "real": len(real_agents), "real_with_token": len(real_agents_with_token)},
                    "H1",
                )
                return []
            picked_agents.extend(random.sample(remain, need))
        _debug_log(
            "director.py:_pick_participants",
            "match_ok",
            {
                "picked_ids": [str(a.id) for a in picked_agents],
                "real_pool": len(real_agents),
                "token_pool": len(real_agents_with_token),
            },
            "H2",
        )

        participants: list[Participant] = []
        for agent in picked_agents:
            user = user_by_id.get(agent.user_id)
            if user is None:
                continue

            layers = db.scalars(
                select(AgentPromptLayer)
                .where(AgentPromptLayer.agent_id == agent.id)
                .order_by(AgentPromptLayer.layer_no.asc())
            ).all()
            persona_stack = [layer.trait for layer in layers] or ["擅长赋能、抓手和闭环。"]
            token = token_by_user_id.get(user.id)

            participants.append(
                Participant(
                    agent_id=agent.id,
                    user_id=user.id,
                    nickname=agent.nickname,
                    persona_stack=persona_stack,
                    is_npc=False,
                    secondme_access_token=token,
                    secondme_user_id=user.secondme_user_id or "",
                )
            )
        return participants

    # SecondMe Act API 的 actionControl（20-8000 字，含 JSON 示例+规则+fallback）
    _ACT_TICKET_SPEC = (
        'Output only a valid JSON object, no explanation.\n'
        'Structure: {"title": string, "description": string, "budget": number, "opening_line": string}.\n'
        'title: 8-16 Chinese chars, 中国互联网职场黑话风. description: 20-50 chars. budget: integer 25-120. opening_line: max 200 chars.\n'
        'When unclear or invalid, use: {"title": "跨部门甩锅复盘", "description": "研发与产品关于需求理解发生认知偏差，请给出闭环方案。", "budget": 42, "opening_line": "需求《跨部门甩锅复盘》已进会，谁给我一个可落地抓手？"}.'
    )
    _ACT_JUDGE_WINNER = (
        'Output only a valid JSON object, no explanation.\n'
        'Structure: {"winner_id": string, "reason": string}.\n'
        'winner_id must be exactly one of the participant UUID or nickname from the roster. reason: max 50 Chinese chars.\n'
        'When unclear or tie, set winner_id to the first participant id in the roster and reason to "ROI更高，执行闭环更稳。".'
    )

    async def _generate_ticket_spec(self) -> TicketSpec:
        fallback_title, fallback_desc, fallback_budget = random.choice(FALLBACK_TICKETS)
        fallback_opening = f"需求《{fallback_title}》已进会，谁给我一个可落地抓手？"

        user_prompt = "生成一个新的职场冲突工单。仅输出JSON。"
        system_prompt_ticket = (
            "你是《牛马模拟器》的AI导演。"
            "输出必须是JSON对象，字段: title(string), description(string), budget(int), opening_line(string)。"
            "title 8-16字，description 20-50字，budget在25到120之间。"
            "主题必须是中国互联网职场黑话风。"
        )
        spec_source: str = "gemini"

        try:
            if settings.director_use_secondme and settings.secondme_director_token:
                try:
                    data = await secondme_client.act_stream(
                        access_token=settings.secondme_director_token,
                        message=user_prompt,
                        action_control=self._ACT_TICKET_SPEC,
                    )
                    spec_source = "secondme"
                except Exception as e:  # noqa: BLE001
                    # #region director debug
                    _debug_log("director.py:_generate_ticket_spec", "secondme_act_failed", {"error": e.__class__.__name__, "message": str(e)[:200]})
                    # #endregion
                    raw = await llm_client.chat_completion(
                        system_prompt=system_prompt_ticket,
                        user_prompt=user_prompt,
                        temperature=0.9,
                        max_tokens=200,
                    )
                    data = self._extract_json_object(raw)
                    spec_source = "gemini_fallback"
            else:
                raw = await llm_client.chat_completion(
                    system_prompt=system_prompt_ticket,
                    user_prompt=user_prompt,
                    temperature=0.9,
                    max_tokens=200,
                )
                data = self._extract_json_object(raw)
            title = str(data.get("title", "")).strip()[:40] or fallback_title
            desc = str(data.get("description", "")).strip()[:200] or fallback_desc
            opening = str(data.get("opening_line", "")).strip()[:200] or fallback_opening
            budget = int(data.get("budget", fallback_budget))
            budget = max(25, min(120, budget))
            # #region director debug
            _debug_log("director.py:_generate_ticket_spec", "director_ticket_spec", {"source": spec_source, "title": title})
            # #endregion
            return TicketSpec(title=title, description=desc, budget=budget, opening_line=opening)
        except Exception:  # noqa: BLE001
            return TicketSpec(
                title=fallback_title,
                description=fallback_desc,
                budget=fallback_budget,
                opening_line=fallback_opening,
            )

    def _create_locked_ticket(self, db, participants: list[Participant], spec: TicketSpec) -> uuid.UUID | None:
        t = Ticket(
            title=spec.title,
            description=spec.description,
            budget=spec.budget,
            status="LOCKED",
            started_at=datetime.now(UTC),
        )
        db.add(t)
        db.flush()

        for idx, p in enumerate(participants, start=1):
            db.add(TicketParticipant(ticket_id=t.id, agent_id=p.agent_id, seat_no=idx))
            agent = db.get(Agent, p.agent_id)
            if agent is not None:
                agent.status = "IN_MEETING"
        db.flush()  # 确保下一轮 _pick_participants 在同一 tick 内能看到 IN_MEETING，避免同一人进两场

        db.add(
            BattleLog(
                ticket_id=t.id,
                round=0,
                speaker_type="SYSTEM",
                speaker_agent_id=None,
                speaker_name="System",
                content=f"会议室已锁定：{spec.title}",
            )
        )
        db.add(
            BattleLog(
                ticket_id=t.id,
                round=0,
                speaker_type="HR",
                speaker_agent_id=None,
                speaker_name="AI Director",
                content=spec.opening_line,
            )
        )
        db.add(
            FeedEvent(
                event_type="battle_start",
                content=f"新工单《{spec.title}》开战，{len(participants)} 位牛马已入场。",
                ref_ticket_id=t.id,
            )
        )
        logger.info("Director spawned ticket %s with %s participants", str(t.id), len(participants))
        return t.id

    async def _run_battle(self, ticket_id: uuid.UUID, participants: list[Participant], spec: TicketSpec) -> None:
        chat_sessions: dict[uuid.UUID, str | None] = {}
        transcript: list[tuple[int, uuid.UUID | None, str, str]] = []
        try:
            await asyncio.sleep(settings.director_opening_delay_seconds)
            if not self._is_ticket_locked(ticket_id):
                return

            for round_no in (1, 2, 3):
                for participant in participants:
                    if not self._is_ticket_locked(ticket_id):
                        return

                    try:
                        line, session_id = await asyncio.wait_for(
                            self._generate_agent_line(
                                participant=participant,
                                spec=spec,
                                round_no=round_no,
                                transcript=transcript,
                                session_id=chat_sessions.get(participant.agent_id),
                            ),
                            timeout=settings.director_agent_line_timeout_seconds,
                        )
                    except asyncio.TimeoutError:
                        logger.warning("agent line timeout ticket=%s agent=%s", str(ticket_id), participant.nickname)
                        line = self._fallback_agent_line(round_no=round_no)
                        session_id = chat_sessions.get(participant.agent_id)
                    chat_sessions[participant.agent_id] = session_id
                    # #region agent log
                    t0 = datetime.now(UTC).timestamp()
                    # #endregion
                    await asyncio.to_thread(
                        self._append_log,
                        ticket_id=ticket_id,
                        round_no=round_no,
                        speaker_type="AGENT",
                        speaker_agent_id=participant.agent_id,
                        speaker_name=participant.nickname,
                        content=line,
                    )
                    # #region agent log
                    _debug_log("director.py:_run_battle", "append_log duration", {"ticket_id": str(ticket_id), "round": round_no, "duration_ms": int((datetime.now(UTC).timestamp() - t0) * 1000)}, "H2")
                    # #endregion
                    transcript.append((round_no, participant.agent_id, participant.nickname, line))
                    await asyncio.sleep(settings.director_round_think_seconds)

            if not self._is_ticket_locked(ticket_id):
                return
            try:
                winner_id, reason = await asyncio.wait_for(
                    self._judge_winner(spec, participants, transcript),
                    timeout=settings.director_judge_timeout_seconds,
                )
            except asyncio.TimeoutError:
                logger.warning("judge timeout ticket=%s", str(ticket_id))
                fallback = random.choice(participants)
                winner_id, reason = fallback.agent_id, "系统兜底裁决：执行稳定性更高。"
            # #region agent log
            t_settle0 = datetime.now(UTC).timestamp()
            # #endregion
            await asyncio.to_thread(
                self._settle_battle,
                ticket_id=ticket_id,
                participants=participants,
                winner_id=winner_id,
                reason=reason,
            )
            # #region agent log
            _debug_log("director.py:_run_battle", "settle_battle duration", {"ticket_id": str(ticket_id), "duration_ms": int((datetime.now(UTC).timestamp() - t_settle0) * 1000)}, "H2")
            # #endregion
        except Exception as exc:  # noqa: BLE001
            logger.exception("battle run failed ticket=%s", str(ticket_id))
            await asyncio.to_thread(self._abort_ticket, ticket_id, f"导演异常回收：{exc.__class__.__name__}")

    async def _generate_agent_line(
        self,
        *,
        participant: Participant,
        spec: TicketSpec,
        round_no: int,
        transcript: list[tuple[int, uuid.UUID | None, str, str]],
        session_id: str | None,
    ) -> tuple[str, str | None]:
        others = [t for t in transcript if t[1] != participant.agent_id]
        recent_others = others[-6:]
        others_text = "\n".join([f"{name}: {content}" for _, _, name, content in recent_others]) or "暂无"

        system_prompt = self._build_agent_system_prompt(participant)
        user_prompt = (
            f"工单：{spec.title}\n"
            f"描述：{spec.description}\n"
            f"第{round_no}轮发言。\n"
            "如果有对手发言，请针对性回应。\n"
            f"对手最近发言：\n{others_text}\n"
            "请给出你的一句发言。"
        )

        try:
            if participant.secondme_access_token:
                text_out, new_session = await secondme_client.chat_stream(
                    access_token=participant.secondme_access_token,
                    message=user_prompt,
                    system_prompt=system_prompt if session_id is None else None,
                    session_id=session_id,
                )
                final_text = self._clean_line(text_out)
                if final_text:
                    return final_text, new_session

            text_out = await llm_client.chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.95,
                max_tokens=120,
            )
            return self._clean_line(text_out), session_id
        except Exception:  # noqa: BLE001
            fallback = random.choice(
                [
                    "我先用抓手对齐颗粒度，今晚给你闭环复盘。",
                    "这个需求底层逻辑我已拆完，直接上组合拳推进闭环。",
                    "给我半天，我把风险前置并赋能执行链路。",
                ]
            )
            return fallback, session_id

    def _build_agent_system_prompt(self, participant: Participant) -> str:
        persona_stack_json = json.dumps(participant.persona_stack, ensure_ascii=False)
        template = self._load_prompt_template("player_agent_system.txt")
        return template.format(
            persona_stack_json=persona_stack_json,
            nickname=participant.nickname,
        )

    @staticmethod
    def _fallback_agent_line(round_no: int) -> str:
        if round_no == 1:
            return random.choice(
                [
                    "我先把需求拆成可执行抓手，风险前置后今晚闭环。",
                    "这单我可以用短链路推进，对齐目标后直接落地。",
                    "先把颗粒度压实再推进执行，复盘口径我来扛。",
                ]
            )
        return random.choice(
            [
                "你这套说辞很热闹但不落地，我这边执行链路更短。",
                "先别画饼，咱们对齐边界再推进闭环。",
                "我给的是可执行路径，不是情绪化汇报。",
            ]
        )

    async def _judge_winner(
        self,
        spec: TicketSpec,
        participants: list[Participant],
        transcript: list[tuple[int, uuid.UUID | None, str, str]],
    ) -> tuple[uuid.UUID, str]:
        roster = "\n".join([f"- {p.nickname}: {p.agent_id}" for p in participants])
        convo = "\n".join([f"[R{r}] {name}: {content}" for r, _, name, content in transcript[-40:]])
        user_prompt = (
            f"工单：{spec.title}\n预算：{spec.budget}\n参会者：\n{roster}\n"
            f"对话记录：\n{convo}\n"
            "选出最能卷或最有性价比的人。仅输出JSON。"
        )
        system_prompt_judge = (
            "你是AI Director中的冷酷HR，只看ROI。"
            "输出必须是JSON对象：{\"winner_id\":\"uuid or nickname\",\"reason\":\"...\"}。"
            "reason不超过50字。"
        )
        judge_source: str = "gemini"
        try:
            if settings.director_use_secondme and settings.secondme_director_token:
                try:
                    data = await secondme_client.act_stream(
                        access_token=settings.secondme_director_token,
                        message=user_prompt,
                        action_control=self._ACT_JUDGE_WINNER,
                    )
                    judge_source = "secondme"
                except Exception as e:  # noqa: BLE001
                    # #region director debug
                    _debug_log("director.py:_judge_winner", "secondme_act_failed", {"error": e.__class__.__name__, "message": str(e)[:200]})
                    # #endregion
                    raw = await llm_client.chat_completion(
                        system_prompt=system_prompt_judge,
                        user_prompt=user_prompt,
                        temperature=0.3,
                        max_tokens=180,
                    )
                    data = self._extract_json_object(raw)
                    judge_source = "gemini_fallback"
            else:
                raw = await llm_client.chat_completion(
                    system_prompt=system_prompt_judge,
                    user_prompt=user_prompt,
                    temperature=0.3,
                    max_tokens=180,
                )
                data = self._extract_json_object(raw)
            winner_hint = str(data.get("winner_id", "")).strip()
            reason = str(data.get("reason", "")).strip()[:120] or "ROI更高，执行闭环更稳。"
            resolved = self._resolve_winner_id(winner_hint, participants)
            if resolved:
                # #region director debug
                _debug_log("director.py:_judge_winner", "director_judge", {"source": judge_source, "winner_id": str(resolved), "reason": reason[:50]})
                # #endregion
                return resolved, reason
        except Exception:  # noqa: BLE001
            pass

        fallback = random.choice(participants)
        return fallback.agent_id, "在高压局里闭环速度更快，性价比更高。"

    def _resolve_winner_id(self, hint: str, participants: list[Participant]) -> uuid.UUID | None:
        if not hint:
            return None
        for p in participants:
            if hint == str(p.agent_id) or hint == p.nickname:
                return p.agent_id
        # relaxed match on nickname substring
        for p in participants:
            if hint in p.nickname or p.nickname in hint:
                return p.agent_id
        return None

    def _settle_battle(
        self,
        *,
        ticket_id: uuid.UUID,
        participants: list[Participant],
        winner_id: uuid.UUID,
        reason: str,
    ) -> None:
        # #region agent log
        lock_order = sorted(p.agent_id for p in participants)
        _debug_log("director.py:_settle_battle", "settle_start", {"ticket_id": str(ticket_id), "lock_order": [str(a) for a in lock_order]}, "H4")
        # #endregion
        with SessionLocal() as db:
            ticket = db.get(Ticket, ticket_id)
            if ticket is None or ticket.status != "LOCKED":
                return

            winner = db.get(Agent, winner_id)
            winner_name = winner.nickname if winner else "匿名牛马"
            db.add(
                BattleLog(
                    ticket_id=ticket_id,
                    round=4,
                    speaker_type="HR",
                    speaker_agent_id=None,
                    speaker_name="AI Director",
                    content=f"{winner_name} 胜出：{reason}",
                )
            )

            ticket.status = "CLOSED"
            ticket.winner_agent_id = winner_id
            ticket.ended_at = datetime.now(UTC)

            participant_rows = db.scalars(
                select(TicketParticipant).where(TicketParticipant.ticket_id == ticket_id)
            ).all()
            for row in participant_rows:
                row.is_winner = row.agent_id == winner_id
                row.score = random.randint(65, 100) if row.agent_id == winner_id else random.randint(30, 78)

            # 按 agent_id 排序后更新，避免多场同时结算时锁顺序不一致导致死锁（H4）
            ordered = sorted(participants, key=lambda p: p.agent_id)
            for p in ordered:
                agent = db.scalar(
                    select(Agent).where(Agent.id == p.agent_id).with_for_update()
                )
                if agent is None:
                    continue
                is_winner = p.agent_id == winner_id
                gain = ticket.budget if is_winner else max(8, ticket.budget // 3)
                agent.kpi_score += gain
                agent.level = max(1, agent.kpi_score // 100 + 1)
                agent.involution = min(100, agent.involution + random.randint(6, 14))
                agent.resistance += random.randint(1, 2)
                agent.slacking += random.randint(1, 2)
                if agent.is_paused:
                    agent.status = "PAUSED"
                else:
                    agent.status = "COOLDOWN"
                    # 5 秒（或配置）后自动回池，不再等待前端 manual ack，避免池子被抽干
                    agent.cooldown_until = datetime.now(UTC) + timedelta(seconds=settings.director_cooldown_seconds)
                # #region agent log
                _debug_log("director.py:_settle_battle", "agent cooldown set", {"agent_id": str(p.agent_id), "cooldown_seconds": settings.director_cooldown_seconds}, "H1")
                # #endregion
                if is_winner:
                    agent.win_count += 1
                else:
                    agent.loss_count += 1

            db.add(
                FeedEvent(
                    event_type="battle_end",
                    content=f"《{ticket.title}》已结算：{winner_name} 拿下工单，ROI 直接拉满。",
                    ref_ticket_id=ticket_id,
                )
            )
            db.commit()

    def _abort_ticket(self, ticket_id: uuid.UUID, reason: str) -> None:
        with SessionLocal() as db:
            ticket = db.get(Ticket, ticket_id)
            if ticket is None or ticket.status != "LOCKED":
                return

            self._release_ticket_participants(db, ticket_id)
            ticket.status = "CLOSED"
            ticket.ended_at = datetime.now(UTC)
            db.add(
                BattleLog(
                    ticket_id=ticket_id,
                    round=99,
                    speaker_type="SYSTEM",
                    speaker_agent_id=None,
                    speaker_name="System",
                    content=reason,
                )
            )
            db.add(
                FeedEvent(
                    event_type="battle_abort",
                    content=f"《{ticket.title}》异常中断，系统已强制回收。",
                    ref_ticket_id=ticket_id,
                )
            )
            db.commit()

    def _release_ticket_participants(self, db, ticket_id: uuid.UUID) -> None:
        participants = db.scalars(select(TicketParticipant).where(TicketParticipant.ticket_id == ticket_id)).all()
        for part in sorted(participants, key=lambda p: p.agent_id):
            agent = db.scalar(
                select(Agent).where(Agent.id == part.agent_id).with_for_update()
            )
            if agent is None:
                continue
            if agent.is_paused:
                agent.status = "PAUSED"
            else:
                agent.status = "IDLE"
            agent.cooldown_until = None

    def _append_log(
        self,
        *,
        ticket_id: uuid.UUID,
        round_no: int,
        speaker_type: str,
        speaker_agent_id: uuid.UUID | None,
        speaker_name: str,
        content: str,
    ) -> None:
        with SessionLocal() as db:
            ticket = db.get(Ticket, ticket_id)
            if ticket is None or ticket.status != "LOCKED":
                return
            db.add(
                BattleLog(
                    ticket_id=ticket_id,
                    round=round_no,
                    speaker_type=speaker_type,
                    speaker_agent_id=speaker_agent_id,
                    speaker_name=speaker_name,
                    content=content,
                )
            )
            db.commit()

    def _is_ticket_locked(self, ticket_id: uuid.UUID) -> bool:
        with SessionLocal() as db:
            ticket = db.get(Ticket, ticket_id)
            return ticket is not None and ticket.status == "LOCKED"

    @staticmethod
    def _clean_line(text_out: str) -> str:
        text_out = text_out or ""
        # Strip common markdown markers to keep battle bubbles clean.
        text_out = re.sub(r"(\*\*|__|`|~~)", "", text_out)
        text_out = re.sub(r"^#{1,6}\s*", "", text_out, flags=re.M)
        text_out = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", text_out)
        text_out = re.sub(r"\s+", " ", text_out).strip()
        return text_out[:140] if text_out else "先对齐颗粒度，再闭环执行。"

    @staticmethod
    def _extract_json_object(raw: str) -> dict:
        raw = raw.strip()
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                return data
        except Exception:  # noqa: BLE001
            pass
        match = re.search(r"\{.*\}", raw, flags=re.S)
        if not match:
            raise ValueError(f"no json object found: {raw}")
        data = json.loads(match.group(0))
        if not isinstance(data, dict):
            raise ValueError(f"json is not object: {data}")
        return data

    @staticmethod
    @lru_cache(maxsize=16)
    def _load_prompt_template(name: str) -> str:
        path = PROMPTS_DIR / name
        if not path.exists():
            raise FileNotFoundError(f"prompt template not found: {path}")
        return path.read_text(encoding="utf-8")
