from fastapi import APIRouter

from app.api.routes import auth, battles, health, leaderboard, lobby, me

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/api/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/api/me", tags=["me"])
api_router.include_router(battles.router, prefix="/api/battles", tags=["battles"])
api_router.include_router(lobby.router, prefix="/api/lobby", tags=["lobby"])
api_router.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
