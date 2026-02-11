from pathlib import Path
from typing import Any
import logging
import re

from app.services.llm_client import llm_client

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "profile_dramatize_system.txt"
SYSTEM_PROMPT = PROMPT_PATH.read_text(encoding="utf-8")
logger = logging.getLogger(__name__)
BLACKWORDS = ["赋能", "抓手", "闭环", "颗粒度", "底层逻辑", "对齐", "组合拳", "心智", "赛道", "复盘"]


def _compact_shades(shades_data: dict[str, Any] | None) -> list[dict[str, str]]:
    if not shades_data:
        return []
    shades = shades_data.get("shades")
    if not isinstance(shades, list):
        return []

    result: list[dict[str, str]] = []
    for shade in shades[:5]:
        if not isinstance(shade, dict):
            continue
        result.append(
            {
                "name": str(shade.get("shadeNamePublic") or shade.get("shadeName") or "").strip(),
                "desc": str(shade.get("shadeDescriptionPublic") or shade.get("shadeDescription") or "").strip(),
                "content": str(shade.get("shadeContentPublic") or shade.get("shadeContent") or "").strip(),
            }
        )
    return result


async def dramatize_initial_trait(user_info: dict[str, Any], shades_data: dict[str, Any] | None) -> str | None:
    name = str(user_info.get("name") or "匿名牛马")
    payload = {
        "name": name,
        "bio": user_info.get("bio") or "",
        "selfIntroduction": user_info.get("selfIntroduction") or "",
        "shades": _compact_shades(shades_data),
    }

    user_prompt = (
        "请根据以下用户资料生成一条初始生存逻辑：\n"
        f"{payload}\n"
        "只输出一句最终文案。"
    )

    try:
        text = await llm_client.chat_completion(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.9,
            max_tokens=160,
        )
        first = _normalize(text)
        logger.warning("Gemini dramatize raw output: %s", first)
        if _is_valid(first, name):
            return first

        repair_prompt = (
            f"你上一条输出不合格：{first}\n"
            f"请严格重写，要求：必须以“我是{name}”开头；25-60字；至少包含2个黑话词；仅输出一句。"
        )
        repaired = await llm_client.chat_completion(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=repair_prompt,
            temperature=0.7,
            max_tokens=180,
        )
        repaired = _normalize(repaired)
        logger.warning("Gemini dramatize repaired output: %s", repaired)
        if _is_valid(repaired, name):
            return repaired
        return None
    except Exception:  # noqa: BLE001
        logger.exception("Gemini dramatize failed")
        return None


def _normalize(text: str) -> str:
    line = (text or "").strip().splitlines()[0].strip()
    line = re.sub(r"\s+", "", line)
    return line


def _is_valid(text: str, name: str) -> bool:
    if not text.startswith(f"我是{name}"):
        return False
    length = len(text)
    if length < 25 or length > 60:
        return False
    hit = sum(1 for w in BLACKWORDS if w in text)
    return hit >= 2
