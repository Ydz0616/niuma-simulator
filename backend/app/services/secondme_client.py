from datetime import UTC, datetime, timedelta
import json
import httpx

from app.core.config import get_settings

settings = get_settings()


class SecondMeClient:
    async def exchange_code_for_token(self, code: str) -> dict:
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.secondme_redirect_uri,
            "client_id": settings.secondme_client_id,
            "client_secret": settings.secondme_client_secret,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                settings.secondme_oauth_token_url,
                data=payload,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            body = resp.json()

        if body.get("code") != 0:
            raise RuntimeError(f"SecondMe token exchange failed: {body}")

        return body["data"]

    async def get_user_info(self, access_token: str) -> dict:
        url = f"{settings.secondme_api_base_url}/api/secondme/user/info"
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
            resp.raise_for_status()
            body = resp.json()

        if body.get("code") != 0:
            raise RuntimeError(f"SecondMe user info failed: {body}")

        return body["data"]

    async def get_user_shades(self, access_token: str) -> dict:
        url = f"{settings.secondme_api_base_url}/api/secondme/user/shades"
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
            resp.raise_for_status()
            body = resp.json()

        if body.get("code") != 0:
            raise RuntimeError(f"SecondMe user shades failed: {body}")

        return body["data"]

    async def chat_stream(
        self,
        *,
        access_token: str,
        message: str,
        system_prompt: str | None = None,
        session_id: str | None = None,
        app_id: str = "general",
    ) -> tuple[str, str | None]:
        url = f"{settings.secondme_api_base_url}/api/secondme/chat/stream"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload: dict = {
            "message": message,
            "appId": app_id,
        }
        if session_id:
            payload["sessionId"] = session_id
        if system_prompt:
            payload["systemPrompt"] = system_prompt

        content_parts: list[str] = []
        resolved_session_id = session_id
        current_event: str | None = None

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for raw_line in resp.aiter_lines():
                    if not raw_line:
                        continue
                    if raw_line.startswith("event: "):
                        current_event = raw_line[7:].strip()
                        continue
                    if not raw_line.startswith("data: "):
                        continue

                    data_line = raw_line[6:]
                    if data_line == "[DONE]":
                        break

                    parsed = json.loads(data_line)
                    if current_event == "session":
                        resolved_session_id = parsed.get("sessionId", resolved_session_id)
                    elif current_event == "error":
                        raise RuntimeError(f"SecondMe stream error: {parsed}")
                    else:
                        delta = (((parsed.get("choices") or [{}])[0]).get("delta") or {})
                        text = delta.get("content")
                        if text:
                            content_parts.append(str(text))
                    current_event = None

        return "".join(content_parts).strip(), resolved_session_id

    async def chat_completion(
        self,
        *,
        access_token: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        max_tokens: int = 200,
        app_id: str = "general",
    ) -> str:
        """非流式一次请求，供 director 生成工单/裁决等。内部用 chat_stream 收集完整回复。"""
        content, _ = await self.chat_stream(
            access_token=access_token,
            message=user_prompt,
            system_prompt=system_prompt,
            session_id=None,
            app_id=app_id,
        )
        return content

    async def act_stream(
        self,
        *,
        access_token: str,
        message: str,
        action_control: str,
        system_prompt: str | None = None,
        session_id: str | None = None,
        app_id: str = "general",
    ) -> dict:
        """
        SecondMe Streaming Action (Act) API：约束模型只输出符合 actionControl 的 JSON。
        文档: https://develop-docs.second.me/en/docs/api-reference/secondme#streaming-action-act
        - 端点: POST /api/secondme/act/stream
        - 必填: message, actionControl（20-8000 字，含 JSON 结构示例、判定规则、fallback）
        - 返回: SSE 流，与 chat 同格式，content 为 JSON 片段，拼成后解析为 dict。
        """
        url = f"{settings.secondme_api_base_url}/api/secondme/act/stream"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload: dict = {
            "message": message,
            "actionControl": action_control,
            "appId": app_id,
        }
        if session_id:
            payload["sessionId"] = session_id
        if system_prompt:
            payload["systemPrompt"] = system_prompt

        content_parts: list[str] = []
        current_event: str | None = None

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                if resp.status_code >= 400:
                    body = await resp.aread()
                    try:
                        err_obj = json.loads(body.decode("utf-8", errors="replace"))
                        msg = err_obj.get("message", err_obj.get("subCode", str(body[:300])))
                    except Exception:  # noqa: BLE001
                        msg = body.decode("utf-8", errors="replace")[:300]
                    raise RuntimeError(f"SecondMe act/stream HTTP {resp.status_code}: {msg}")
                async for raw_line in resp.aiter_lines():
                    if not raw_line:
                        continue
                    if raw_line.startswith("event: "):
                        current_event = raw_line[7:].strip()
                        continue
                    if not raw_line.startswith("data: "):
                        continue

                    data_line = raw_line[6:]
                    if data_line == "[DONE]":
                        break

                    parsed = json.loads(data_line)
                    if current_event == "session":
                        pass  # 可选保存 session_id
                    elif current_event == "error":
                        raise RuntimeError(f"SecondMe act stream error: {parsed}")
                    else:
                        delta = (((parsed.get("choices") or [{}])[0]).get("delta") or {})
                        text = delta.get("content")
                        if text:
                            content_parts.append(str(text))
                    current_event = None

        raw_json = "".join(content_parts).strip()
        if not raw_json:
            raise RuntimeError("SecondMe act stream returned empty content")
        return json.loads(raw_json)

    @staticmethod
    def compute_expires_at(expires_in: int | None) -> datetime | None:
        if not expires_in:
            return None
        return datetime.now(UTC) + timedelta(seconds=expires_in)


secondme_client = SecondMeClient()
