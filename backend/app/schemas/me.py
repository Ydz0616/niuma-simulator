from datetime import datetime
from pydantic import BaseModel


class PromptLayerOut(BaseModel):
    layer_no: int
    trait: str
    source: str
    created_at: datetime


class MeCardOut(BaseModel):
    user_id: str
    secondme_user_id: str
    display_name: str
    avatar_url: str | None
    email: str | None
    route: str | None
    agent_id: str
    nickname: str
    level: int
    title: str
    kpi_score: int
    win_count: int
    loss_count: int
    status: str
    cooldown_until: datetime | None
    is_paused: bool
    prompt_layers: list[PromptLayerOut]
