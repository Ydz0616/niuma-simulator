from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Agent, AgentPromptLayer, User
from app.schemas.me import (
    AgentStatusOut,
    AgentStatusRequest,
    EvolveRequest,
    MeCardOut,
    PromptLayerOut,
    RebuildInitialTraitResponse,
)
from app.models.oauth import OAuthToken
from app.services.profile_dramatizer import dramatize_initial_trait
from app.services.secondme_client import secondme_client
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/card", response_model=MeCardOut)
def get_me_card(user_id: UUID = Query(...), db: Session = Depends(get_db)) -> MeCardOut:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")

    agent = db.scalar(select(Agent).where(Agent.user_id == user.id))
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")

    layers = [
        PromptLayerOut(
            layer_no=layer.layer_no,
            trait=layer.trait,
            source=layer.source,
            created_at=layer.created_at,
        )
        for layer in agent.prompt_layers
    ]

    return MeCardOut(
        user_id=str(user.id),
        secondme_user_id=user.secondme_user_id,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        email=user.email,
        route=user.route,
        agent_id=str(agent.id),
        nickname=agent.nickname,
        level=agent.level,
        title=agent.title,
        kpi_score=agent.kpi_score,
        win_count=agent.win_count,
        loss_count=agent.loss_count,
        status=agent.status,
        cooldown_until=agent.cooldown_until,
        is_paused=agent.is_paused,
        prompt_layers=layers,
    )


@router.post("/evolve", response_model=MeCardOut)
def evolve_agent(req: EvolveRequest, db: Session = Depends(get_db)) -> MeCardOut:
    trait = req.new_trait.strip()
    if not trait:
        raise HTTPException(status_code=400, detail="new_trait cannot be empty")

    try:
        user_uuid = UUID(req.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="invalid user_id") from exc

    user = db.scalar(select(User).where(User.id == user_uuid))
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")

    agent = db.scalar(select(Agent).where(Agent.user_id == user.id))
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")

    if agent.status in {"IN_MEETING"}:
        raise HTTPException(status_code=409, detail="agent is in meeting")

    max_layer_no = db.scalar(
        select(func.max(AgentPromptLayer.layer_no)).where(AgentPromptLayer.agent_id == agent.id)
    )
    next_layer_no = (max_layer_no or 0) + 1
    db.add(AgentPromptLayer(agent_id=agent.id, layer_no=next_layer_no, trait=trait, source="user"))
    db.commit()

    return get_me_card(user_id=user.id, db=db)


@router.post("/agent/pause", response_model=AgentStatusOut)
def pause_agent(req: AgentStatusRequest, db: Session = Depends(get_db)) -> AgentStatusOut:
    try:
        user_uuid = UUID(req.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="invalid user_id") from exc

    agent = db.scalar(select(Agent).where(Agent.user_id == user_uuid))
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")

    if agent.status == "IN_MEETING":
        raise HTTPException(status_code=409, detail="cannot pause during meeting")

    agent.status = "PAUSED"
    agent.is_paused = True
    db.commit()

    return AgentStatusOut(
        user_id=str(user_uuid),
        status=agent.status,
        is_paused=agent.is_paused,
        cooldown_until=agent.cooldown_until,
    )


@router.post("/agent/resume", response_model=AgentStatusOut)
def resume_agent(req: AgentStatusRequest, db: Session = Depends(get_db)) -> AgentStatusOut:
    try:
        user_uuid = UUID(req.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="invalid user_id") from exc

    agent = db.scalar(select(Agent).where(Agent.user_id == user_uuid))
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")

    if agent.status == "IN_MEETING":
        raise HTTPException(status_code=409, detail="cannot resume during meeting")

    if agent.cooldown_until is not None:
        agent.status = "COOLDOWN"
        agent.is_paused = False
    else:
        agent.status = "IDLE"
        agent.is_paused = False
    db.commit()

    return AgentStatusOut(
        user_id=str(user_uuid),
        status=agent.status,
        is_paused=agent.is_paused,
        cooldown_until=agent.cooldown_until,
    )


@router.post("/rebuild-initial-trait", response_model=RebuildInitialTraitResponse)
async def rebuild_initial_trait(req: AgentStatusRequest, db: Session = Depends(get_db)) -> RebuildInitialTraitResponse:
    try:
        user_uuid = UUID(req.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="invalid user_id") from exc

    user = db.scalar(select(User).where(User.id == user_uuid))
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")

    agent = db.scalar(select(Agent).where(Agent.user_id == user_uuid))
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")

    first_layer = db.scalar(
        select(AgentPromptLayer).where(AgentPromptLayer.agent_id == agent.id, AgentPromptLayer.layer_no == 1)
    )
    if first_layer is None:
        raise HTTPException(status_code=404, detail="initial layer not found")

    token = db.scalar(select(OAuthToken).where(OAuthToken.user_id == user_uuid, OAuthToken.provider == "secondme"))
    if token is None:
        raise HTTPException(status_code=404, detail="secondme token not found")

    user_info = await secondme_client.get_user_info(token.access_token)
    shades_data = None
    if settings.secondme_use_shades_on_bootstrap:
        try:
            shades_data = await secondme_client.get_user_shades(token.access_token)
        except Exception:  # noqa: BLE001
            shades_data = None

    generated = await dramatize_initial_trait(user_info, shades_data)
    if not generated:
        raise HTTPException(status_code=502, detail="AI trait generation failed")

    first_layer.trait = generated
    db.commit()

    return RebuildInitialTraitResponse(
        user_id=str(user_uuid),
        updated=True,
        generated_trait=generated,
    )
