import httpx

from app.core.config import get_settings

settings = get_settings()


class LLMClient:
    async def chat_completion(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        max_tokens: int | None = None,
    ) -> str:
        if not settings.llm_api_key:
            raise RuntimeError("LLM_API_KEY is missing")

        url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": settings.llm_model,
            "temperature": temperature,
            "max_tokens": max_tokens or settings.llm_max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        headers = {
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError(f"LLM empty response: {data}")

        content = (choices[0].get("message") or {}).get("content")
        if not content:
            raise RuntimeError(f"LLM missing content: {data}")

        return str(content).strip()


llm_client = LLMClient()
