from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Corporate Asylum API"
    app_env: str = "dev"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    database_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/corporate_asylum")

    secondme_client_id: str = ""
    secondme_client_secret: str = ""
    secondme_oauth_authorize_url: str = "https://go.second.me/oauth/"
    secondme_oauth_token_url: str = "https://app.mindos.com/gate/lab/api/oauth/token/code"
    secondme_oauth_refresh_url: str = "https://app.mindos.com/gate/lab/api/oauth/token/refresh"
    secondme_api_base_url: str = "https://app.mindos.com/gate/lab"
    secondme_redirect_uri: str = "http://localhost:8000/api/auth/secondme/callback"
    secondme_scopes: str = "user.info user.info.shades chat"
    secondme_debug_log: bool = True
    secondme_refresh_initial_trait_on_login: bool = False
    secondme_use_shades_on_bootstrap: bool = False

    llm_base_url: str = "https://api.ohmygpt.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gemini-2.0-flash-exp"
    llm_timeout_seconds: int = 25
    llm_max_tokens: int = 140

    director_enabled: bool = True
    director_interval_seconds: int = 8
    director_opening_delay_seconds: float = 5.0
    director_round_think_seconds: float = 1.0
    director_max_active_battles: int = 2
    director_stuck_timeout_seconds: int = 120
    director_enable_npc_only: bool = True
    director_agent_line_timeout_seconds: float = 10.0
    director_judge_timeout_seconds: float = 8.0
    director_use_npc: bool = True
    director_cooldown_seconds: int = 5  # 战后自动回池时间，不再等待前端 manual ack

    frontend_auth_success_url: str = "http://localhost:5173/?auth=success"
    frontend_auth_error_url: str = "http://localhost:5173/?auth=error"


@lru_cache
def get_settings() -> Settings:
    return Settings()
