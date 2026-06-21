import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, status

from app.middleware.auth import get_current_user
from app.models.user import User

# per-user request times for a sliding-window limiter (in-memory, single instance)
_hits: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(max_requests: int = 10, window_seconds: int = 60):
    """Throttle a route per user. Returns the user, so it replaces get_current_user."""

    async def _dependency(current_user: User = Depends(get_current_user)) -> User:
        now = time.monotonic()
        recent = _hits[current_user.id]

        while recent and now - recent[0] > window_seconds:
            recent.popleft()

        if len(recent) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment and try again.",
            )

        recent.append(now)
        return current_user

    return _dependency
