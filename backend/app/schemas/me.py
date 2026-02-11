from datetime import datetime
from pydantic import BaseModel


class EvolveRequest(BaseModel):
    user_id: str
    new_trait: str
    title: str | None = None


class AgentStatusRequest(BaseModel):
    user_id: str


class AgentStatusOut(BaseModel):
    user_id: str
    status: str
    is_paused: bool
    cooldown_until: datetime | None


class RebuildInitialTraitResponse(BaseModel):
    user_id: str
    updated: bool
    generated_trait: str


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
    involution: int
    resistance: int
    slacking: int
    win_count: int
    loss_count: int
    status: str
    rank: int
    cooldown_until: datetime | None
    is_paused: bool
    prompt_layers: list[PromptLayerOut]
