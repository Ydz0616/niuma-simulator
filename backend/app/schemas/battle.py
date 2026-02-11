from datetime import datetime
from pydantic import BaseModel


class ActiveBattleOut(BaseModel):
    ticket_id: str
    title: str
    budget: int
    status: str
    created_at: datetime
    started_at: datetime | None


class BattleDetailOut(BaseModel):
    ticket_id: str
    title: str
    description: str | None
    budget: int
    status: str
    winner_agent_id: str | None
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None


class BattleLogOut(BaseModel):
    id: int
    ticket_id: str
    round: int
    speaker_type: str
    speaker_agent_id: str | None
    speaker_name: str
    content: str
    created_at: datetime


class LobbyFeedOut(BaseModel):
    id: int
    event_type: str
    content: str
    ref_ticket_id: str | None
    created_at: datetime


class LeaderboardItemOut(BaseModel):
    agent_id: str
    nickname: str
    level: int
    title: str
    kpi_score: int
    win_count: int
