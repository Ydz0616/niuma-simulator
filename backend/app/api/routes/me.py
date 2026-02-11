from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Agent, User
from app.schemas.me import MeCardOut, PromptLayerOut

router = APIRouter()


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
