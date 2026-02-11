from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Agent
from app.schemas.battle import LeaderboardItemOut

router = APIRouter()


@router.get("", response_model=list[LeaderboardItemOut])
def get_leaderboard(db: Session = Depends(get_db), limit: int = Query(default=10, ge=1, le=100)) -> list[LeaderboardItemOut]:
    rows = db.scalars(
        select(Agent).order_by(desc(Agent.kpi_score), desc(Agent.win_count), Agent.created_at.asc()).limit(limit)
    ).all()
    return [
        LeaderboardItemOut(
            agent_id=str(a.id),
            nickname=a.nickname,
            level=a.level,
            title=a.title,
            kpi_score=a.kpi_score,
            win_count=a.win_count,
        )
        for a in rows
    ]
