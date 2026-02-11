from datetime import UTC, datetime, timedelta


class OAuthStateStore:
    def __init__(self) -> None:
        self._data: dict[str, datetime] = {}

    def issue(self, state: str, ttl_minutes: int = 10) -> None:
        self._data[state] = datetime.now(UTC) + timedelta(minutes=ttl_minutes)

    def consume(self, state: str) -> bool:
        expiry = self._data.pop(state, None)
        if expiry is None:
            return False
        return datetime.now(UTC) <= expiry


oauth_state_store = OAuthStateStore()
