import secrets
from urllib.parse import urlencode
from urllib.parse import quote_plus
import json
import logging

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models import Agent, AgentPromptLayer, OAuthToken, User
from app.schemas.auth import OAuthStartResponse
from app.services.profile_dramatizer import dramatize_initial_trait
from app.services.secondme_client import secondme_client
from app.services.state_store import oauth_state_store

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/secondme/start", response_model=OAuthStartResponse)
def start_oauth() -> OAuthStartResponse:
    if not settings.secondme_client_id:
        raise HTTPException(status_code=500, detail="SECONDME_CLIENT_ID missing")

    state = secrets.token_urlsafe(24)
    oauth_state_store.issue(state)

    params = {
        "client_id": settings.secondme_client_id,
        "redirect_uri": settings.secondme_redirect_uri,
        "response_type": "code",
        "state": state,
    }
    if settings.secondme_scopes:
        params["scope"] = settings.secondme_scopes

    authorize_url = f"{settings.secondme_oauth_authorize_url}?{urlencode(params)}"
    return OAuthStartResponse(authorize_url=authorize_url)


@router.get("/secondme/callback")
async def oauth_callback(code: str = Query(...), state: str = Query(...)) -> RedirectResponse:
    if not oauth_state_store.consume(state):
        return RedirectResponse(url=f"{settings.frontend_auth_error_url}&reason=invalid_state", status_code=302)

    try:
        token_data = await secondme_client.exchange_code_for_token(code)
        access_token = token_data["accessToken"]
        user_info = await secondme_client.get_user_info(access_token)
        shades_data = None
        if settings.secondme_use_shades_on_bootstrap:
            try:
                shades_data = await secondme_client.get_user_shades(access_token)
            except Exception:  # noqa: BLE001
                shades_data = None
        expires_at = secondme_client.compute_expires_at(token_data.get("expiresIn"))

        if settings.secondme_debug_log:
            logger.warning("SecondMe user/info callback: %s", json.dumps(user_info, ensure_ascii=False))
            if shades_data is not None:
                logger.warning("SecondMe user/shades callback: %s", json.dumps(shades_data, ensure_ascii=False))

        with SessionLocal() as db:
            user = await _upsert_user_and_agent(db, user_info, shades_data)
            _upsert_token(db, user.id, token_data, expires_at)
            db.commit()
            user_id = str(user.id)

        return RedirectResponse(url=f"{settings.frontend_auth_success_url}&user_id={user_id}", status_code=302)
    except Exception as exc:  # noqa: BLE001
        reason = quote_plus(str(exc))
        return RedirectResponse(url=f"{settings.frontend_auth_error_url}&reason={reason}", status_code=302)


async def _build_initial_trait(user_info: dict, shades_data: dict | None = None) -> str:
    ai_trait = await dramatize_initial_trait(user_info, shades_data)
    if not ai_trait or not ai_trait.strip():
        raise RuntimeError("AI trait generation failed")
    return ai_trait.strip()


async def _upsert_user_and_agent(db: Session, user_info: dict, shades_data: dict | None = None) -> User:
    secondme_user_id = str(user_info.get("userId"))
    display_name = user_info.get("name") or f"牛马_{secondme_user_id[-4:]}"

    user = db.scalar(select(User).where(User.secondme_user_id == secondme_user_id))
    if user is None:
        user = User(
            secondme_user_id=secondme_user_id,
            display_name=display_name,
            avatar_url=user_info.get("avatar"),
            email=user_info.get("email"),
            route=user_info.get("route"),
        )
        db.add(user)
        db.flush()

        agent = Agent(user_id=user.id, nickname=display_name)
        db.add(agent)
        db.flush()

        init_trait = await _build_initial_trait(user_info, shades_data)
        db.add(AgentPromptLayer(agent_id=agent.id, layer_no=1, trait=init_trait, source="secondme"))
        logger.warning("Initial trait created (AI): %s", init_trait)
    else:
        user.display_name = display_name
        user.avatar_url = user_info.get("avatar")
        user.email = user_info.get("email")
        user.route = user_info.get("route")

    return user


def _upsert_token(db: Session, user_id, token_data: dict, expires_at) -> None:
    token = db.scalar(select(OAuthToken).where(OAuthToken.user_id == user_id, OAuthToken.provider == "secondme"))
    scope = " ".join(token_data.get("scope", [])) if isinstance(token_data.get("scope"), list) else token_data.get("scope")

    if token is None:
        token = OAuthToken(
            user_id=user_id,
            provider="secondme",
            access_token=token_data["accessToken"],
            refresh_token=token_data.get("refreshToken"),
            scope=scope,
            expires_at=expires_at,
        )
        db.add(token)
    else:
        token.access_token = token_data["accessToken"]
        token.refresh_token = token_data.get("refreshToken")
        token.scope = scope
        token.expires_at = expires_at
