from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import db
from app.auth import get_current_user, router as auth_router
from app.poller import poll_once


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db.open_pool()
    yield
    db.close_pool()


app = FastAPI(title="AI customer support", lifespan=lifespan)

api = APIRouter(prefix="/api")
api.include_router(auth_router)


@api.get("/events")
def events(current_user: dict = Depends(get_current_user)) -> list[dict]:
    return db.list_events()


@api.get("/tickets")
def tickets(current_user: dict = Depends(get_current_user)) -> list[dict]:
    return db.list_tickets()


@api.get("/tickets/{ticket_id}/messages")
def ticket_messages(ticket_id: int, current_user: dict = Depends(get_current_user)) -> list[dict]:
    return db.list_messages(ticket_id)


@api.get("/knowledge-base")
def knowledge_base(current_user: dict = Depends(get_current_user)) -> list[dict]:
    return db.list_knowledge_base()


class EntryUpdate(BaseModel):
    title: str
    content: str


@api.put("/knowledge-base/{entry_id}")
def update_entry(
    entry_id: int,
    update: EntryUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    entry = db.update_knowledge_base_entry(entry_id, update.title, update.content)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@api.post("/poll")
def poll(current_user: dict = Depends(get_current_user)) -> dict:
    return {"messages": poll_once()}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(api)

# The built dashboard. Mounted last, so the API routes above take precedence.
dashboard = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dashboard.exists():
    app.mount("/", StaticFiles(directory=dashboard, html=True), name="dashboard")
