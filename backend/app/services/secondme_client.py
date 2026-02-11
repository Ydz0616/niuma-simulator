from datetime import UTC, datetime, timedelta
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

    @staticmethod
    def compute_expires_at(expires_in: int | None) -> datetime | None:
        if not expires_in:
            return None
        return datetime.now(UTC) + timedelta(seconds=expires_in)


secondme_client = SecondMeClient()
