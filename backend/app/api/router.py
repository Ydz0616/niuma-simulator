from fastapi import APIRouter

from app.api.routes import auth, health, me

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/api/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/api/me", tags=["me"])
