from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import FeedEvent
from app.schemas.battle import LobbyFeedOut

router = APIRouter()


@router.get("/feed", response_model=list[LobbyFeedOut])
def get_lobby_feed(
    db: Session = Depends(get_db),
    after_id: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[LobbyFeedOut]:
    rows = db.scalars(
        select(FeedEvent).where(FeedEvent.id > after_id).order_by(FeedEvent.id.desc()).limit(limit)
    ).all()
    return [
        LobbyFeedOut(
            id=ev.id,
            event_type=ev.event_type,
            content=ev.content,
            ref_ticket_id=str(ev.ref_ticket_id) if ev.ref_ticket_id else None,
            created_at=ev.created_at,
        )
        for ev in rows
    ]
