import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import get_settings
from app.core.db import Base, engine
from app.services.director import DirectorWorker

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        # Lightweight schema patch for existing dev DBs.
        conn.execute(text("ALTER TABLE agents ADD COLUMN IF NOT EXISTS involution INTEGER NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE agents ADD COLUMN IF NOT EXISTS resistance INTEGER NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE agents ADD COLUMN IF NOT EXISTS slacking INTEGER NOT NULL DEFAULT 0"))

    if settings.director_enabled:
        app.state.director = DirectorWorker()
        app.state.director_task = asyncio.create_task(app.state.director.run_forever())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    task = getattr(app.state, "director_task", None)
    worker = getattr(app.state, "director", None)
    if worker is not None:
        await worker.stop()
    if task is not None:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app.include_router(api_router)
