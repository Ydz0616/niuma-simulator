from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Agent, BattleLog, Ticket, TicketParticipant
from app.schemas.battle import ActiveBattleOut, BattleDetailOut, BattleLogOut

router = APIRouter()


@router.get("/active", response_model=list[ActiveBattleOut])
def list_active_battles(
    db: Session = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: UUID | None = Query(default=None),
) -> list[ActiveBattleOut]:
    stmt = select(Ticket).where(Ticket.status == "LOCKED")
    if user_id is not None:
        stmt = (
            stmt.join(TicketParticipant, TicketParticipant.ticket_id == Ticket.id)
            .join(Agent, Agent.id == TicketParticipant.agent_id)
            .where(Agent.user_id == user_id)
        )
    rows = db.scalars(stmt.order_by(Ticket.created_at.desc()).limit(limit)).all()
    return [
        ActiveBattleOut(
            ticket_id=str(t.id),
            title=t.title,
            budget=t.budget,
            status=t.status,
            created_at=t.created_at,
            started_at=t.started_at,
        )
        for t in rows
    ]


@router.get("/{ticket_id}", response_model=BattleDetailOut)
def get_battle_detail(ticket_id: UUID, db: Session = Depends(get_db)) -> BattleDetailOut:
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id))
    if ticket is None:
        raise HTTPException(status_code=404, detail="ticket not found")

    return BattleDetailOut(
        ticket_id=str(ticket.id),
        title=ticket.title,
        description=ticket.description,
        budget=ticket.budget,
        status=ticket.status,
        winner_agent_id=str(ticket.winner_agent_id) if ticket.winner_agent_id else None,
        created_at=ticket.created_at,
        started_at=ticket.started_at,
        ended_at=ticket.ended_at,
    )


@router.get("/{ticket_id}/logs", response_model=list[BattleLogOut])
def get_battle_logs(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    after_id: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=300),
) -> list[BattleLogOut]:
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id))
    if ticket is None:
        raise HTTPException(status_code=404, detail="ticket not found")

    rows = db.scalars(
        select(BattleLog)
        .where(BattleLog.ticket_id == ticket_id, BattleLog.id > after_id)
        .order_by(BattleLog.id.asc())
        .limit(limit)
    ).all()
    return [
        BattleLogOut(
            id=log.id,
            ticket_id=str(log.ticket_id),
            round=log.round,
            speaker_type=log.speaker_type,
            speaker_agent_id=str(log.speaker_agent_id) if log.speaker_agent_id else None,
            speaker_name=log.speaker_name,
            content=log.content,
            created_at=log.created_at,
        )
        for log in rows
    ]
