# Director 匹配逻辑 Code Review 与重构方案

## 一、当前代码审阅（director.py）

### 1.1 已叠加的修改（容易显乱）

| 位置 | 内容 | 用途 | 问题 |
|------|------|------|------|
| L21–37 | `DEBUG_LOG_PATH` + `_debug_log()` | 写 NDJSON 到 `.cursor/debug.log` | 调试用，与业务混在一起，应移除或抽到独立 debug 模块 |
| L115–116 | `if not acquired: return` | 拿不到 advisory lock 直接跳过 tick | 无日志，死锁时难以排查 |
| L151–172 | `_release_cooldowns` 内 H1 打点 | 统计 skipped_none / released | 每 tick 可能打多条，噪音大 |
| L280–286 | `_pick_participants` 子查询 `~Agent.id.in_(in_locked)` | 防止同一 agent 进两场 | 逻辑正确，应保留 |
| L289–295 | 遍历全部 agent 打 `agent_status` 日志 | 调试 | 每 tick 打很多行，生产不宜 |
| L345–346, L355–356 | 匹配失败时 H3 打点 | 无 NPC/其他原因匹配失败 | 可保留为少量结构化日志 |
| L439 | `db.flush()` 在 `_create_locked_ticket` 内 | 同 tick 内下一轮 pick 能读到 IN_MEETING | 正确，保留 |
| L506–520, L535–546 | `_run_battle` 里 H2 打点 + `asyncio.to_thread` | 避免同步 DB 卡事件循环 + 观测耗时 | to_thread 保留，H2 打点可删 |
| L696–698 | 战后 5 秒自动 cooldown | 不等前端 manual ack | 正确，保留 |
| L739–741 | `_settle_battle` 内 H1 打点 | 每个 participant 打一条 | 噪音大，可删 |

结论：**互斥与业务逻辑是对的（cooldown 自动回池、排除 in_locked、flush、to_thread），但调试打点太多、锁内混了 await，结构不清晰。**

---

### 1.2 核心设计问题（导致“又 lock 了”）

**问题：在持锁期间 await。**

```text
_tick():
  with SessionLocal() as db:
    acquired = pg_try_advisory_lock()
    if not acquired: return
    try:
      for _ in range(slots):
        participants = _pick_participants(db)   # 纯 DB，快
        ticket_spec = await _generate_ticket_spec()  # ← LLM 调用，可能数秒
        ticket_id = _create_locked_ticket(db, ...)
      db.commit()
    finally:
      pg_advisory_unlock()
```

- Advisory lock 在「整个 with + try/finally」期间被持有。
- `await _generate_ticket_spec()` 会挂起当前协程，锁仍被该连接占用。
- 若本进程每 `director_interval_seconds` 再跑一次 `_tick`，新 tick 会 `pg_try_advisory_lock` 失败（因为上一 tick 的锁还没放），直接 return → 表现为“死锁、不派单”。
- 若 LLM 慢或 slots 多，单次持锁时间可能很长，加剧问题。

**正确做法：锁只包「纯 DB」的读写，所有 I/O（LLM、HTTP）都在锁外。**

---

### 1.3 其他零散问题

- **日志噪音**：`_pick_participants` 里对每个非 IDLE agent 打 `logger.info`，生产会刷屏。
- **职责混杂**：tick 里既有“状态维护”（cooldown、orphan、stuck）又有“匹配 + 创单”，还有“生成 spec”（I/O），读起来负担大。
- **无锁失败观测**：拿不到锁时没有日志，线上难以确认是锁导致的不派单。

---

## 二、重构目标

1. **互斥清晰**：advisory lock 只包「读 DB → 选人 → 写 DB → commit」，持锁时间控制在几十毫秒级。
2. **I/O 与锁分离**：工单 spec 在锁外预生成（或使用 fallback），锁内只做匹配 + 创建工单。
3. **代码分层**：tick 流程一目了然；匹配、创单、战斗执行职责分离。
4. **可观测**：拿锁失败、匹配失败用少量结构化日志（或现有 logger）即可，去掉所有临时 debug 打点。

---

## 三、重构方案（匹配 + 互斥）

### 3.1 Tick 流程（建议）

```text
async def _tick():
  # 1) 锁外：预生成本轮要用的 N 个 TicketSpec（N = director_max_active_battles）
  specs = []
  for _ in range(settings.director_max_active_battles):
    spec = await _generate_ticket_spec()
    specs.append(spec)

  # 2) 锁内：仅做 DB
  spawned = []
  with SessionLocal() as db:
    if not pg_try_advisory_lock(db): 
      logger.warning("Director tick skipped: lock not acquired")
      return
    try:
      _recover_stuck_locked(db)
      _repair_orphaned_agents(db)
      _release_cooldowns(db)
      if director_use_npc: _ensure_npc_agents(db)

      active_locked = count(LOCKED tickets)
      slots = min(len(specs), max(0, director_max_active_battles - active_locked))

      for i in range(slots):
        participants = _pick_participants(db)
        if len(participants) < 2: break
        ticket_id = _create_locked_ticket(db, participants, specs[i])
        if ticket_id is None: break
        spawned.append((ticket_id, participants, specs[i]))

      db.commit()
    finally:
      pg_advisory_unlock(db)
      db.commit()

  # 3) 锁外：派发战斗任务
  for ticket_id, participants, spec in spawned:
    asyncio.create_task(_run_battle(ticket_id, participants, spec))
```

要点：

- **锁内不再 await**：所有 `_generate_ticket_spec()` 在进入 `with SessionLocal()` 之前完成。
- **锁只包**：recover / repair / release_cooldowns / ensure_npc / pick / create_ticket / commit。
- 若希望“按需生成 spec”（避免浪费 LLM 调用），可改为：先算 `slots` 再只生成 `slots` 个 spec，但 `slots` 依赖 `active_locked`，必须在锁内读。因此更稳妥的做法是：**锁内先读 active_locked 和 slots，然后 unlock，再在锁外生成 slots 个 spec，再重新拿锁只做 pick + create**。这样锁被拆成两小段，每段都很短。下面给出「两段锁」的写法。

### 3.2 两段锁（更省 LLM 调用）

```text
async def _tick():
  # 第一段锁：只读状态 + 决定 slots
  with SessionLocal() as db:
    if not pg_try_advisory_lock(db): 
      logger.warning("Director tick skipped: lock not acquired")
      return
    try:
      _recover_stuck_locked(db)
      _repair_orphaned_agents(db)
      _release_cooldowns(db)
      if director_use_npc: _ensure_npc_agents(db)
      active_locked = count(LOCKED)
      slots = max(0, director_max_active_battles - active_locked)
      db.commit()
    finally:
      pg_advisory_unlock(db)
      db.commit()

  if slots <= 0:
    return

  # 锁外：生成 specs（可能多轮 LLM）
  specs = [await _generate_ticket_spec() for _ in range(slots)]

  # 第二段锁：只做匹配 + 创单
  spawned = []
  with SessionLocal() as db:
    if not pg_try_advisory_lock(db):
      logger.warning("Director tick: lock not acquired for create")
      return
    try:
      for i in range(slots):
        participants = _pick_participants(db)
        if len(participants) < 2: break
        ticket_id = _create_locked_ticket(db, participants, specs[i])
        if ticket_id is None: break
        spawned.append((ticket_id, participants, specs[i]))
      db.commit()
    finally:
      pg_advisory_unlock(db)
      db.commit()

  for ticket_id, participants, spec in spawned:
    asyncio.create_task(_run_battle(...))
```

这样：

- 第一段锁：只做状态维护 + 算 slots，很快。
- 中间：锁外生成 `slots` 个 spec。
- 第二段锁：只做 pick + create，也很快。
- 即使多进程/多实例，拿不到锁的 tick 只会 skip 并打一条 warning，不会长时间占锁。

### 3.3 匹配逻辑（保持不动）

- **保留**：`_pick_participants` 里 `~Agent.id.in_(in_locked)`（排除已在 LOCKED 工单中的 agent）。
- **保留**：`_create_locked_ticket` 里对 participants 设 `IN_MEETING` 后的 `db.flush()`。
- **保留**：无 NPC 时 `real_agents_with_token >= 2` 才开战；有 NPC 时的现有分支。
- **可选**：把“匹配失败”的 H3 改为一次 `logger.info` 带结构化字段（idle/real_with_token/npc），去掉逐 agent 的 `agent_status` 刷屏。

### 3.4 战斗与 DB（保持现状）

- **保留**：`_run_battle` 里 `_append_log` / `_settle_battle` / `_abort_ticket` 用 `asyncio.to_thread` 包住，避免阻塞事件循环。
- **保留**：战后 5 秒自动 cooldown（`director_cooldown_seconds`），不再依赖前端 manual ack。

---

## 四、清理项（重构时一并做）

1. **移除所有 #region agent log 与 _debug_log 调用**（以及 `DEBUG_LOG_PATH` / `_debug_log` 定义），恢复为仅用 `logger` 的少量关键日志（拿锁失败、匹配失败、创单成功）。
2. **拿锁失败**：至少 `logger.warning("Director tick skipped: lock not acquired")`（或带 `lock_key`）。
3. **匹配失败**：用一条 `logger.info` 带 idle/real_with_token/npc 即可，删除“遍历所有 agent 打 status”的日志。
4. **删除**：H1/H2 的 duration、per-participant 的 cooldown 打点。

---

## 五、实施顺序建议

1. **先做互斥重构**：按 3.2 把 `_tick` 拆成「第一段锁 → 锁外生成 spec → 第二段锁 → 派发 battle」，保证锁内无 await。
2. **再删调试代码**：去掉 `_debug_log`、所有 #region agent log、以及过量的 `logger.info`。
3. **验证**：单进程跑一段时间，确认能持续派单且无“又 lock 了”；若有需要再补一条“lock not acquired”的监控或告警。

---

## 六、总结

| 问题 | 根因 | 方案 |
|------|------|------|
| 又 lock 了 / 不派单 | 持锁期间 await LLM，锁占时过长，下个 tick 拿不到锁 | 锁只包 DB，spec 在锁外生成；可拆成两段锁 |
| 同一人进两场 | 同 tick 内第二次 pick 未看到第一次的 IN_MEETING | 已通过 in_locked + flush 解决，保留 |
| 代码乱 | 调试打点多、锁与 I/O 混在一起 | 移除 debug 打点，按 3.2 拆分 tick |

按上述方案重构后，匹配逻辑和互斥会清晰、稳定，便于后续扩展（如多 region、多导演等）。
