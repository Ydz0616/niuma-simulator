from pydantic import BaseModel


class OAuthStartResponse(BaseModel):
    authorize_url: str


class OAuthCallbackResult(BaseModel):
    success: bool
    user_id: str | None = None
    message: str | None = None
