from datetime import datetime, timedelta, timezone
from pathlib import Path
import re

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = FastAPI(title="Anonymous Leaderboard", version="0.1.0")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


''' Useless thing that was never implemented, but I don't want to delete it because it might be useful later.
class LeaderboardEntryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=24)
    time: float = Field(..., gt=0)


leaderboard_entries: list[dict[str, object]] = []


def normalize_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Name is required.")
    if len(cleaned) > 24:
        raise HTTPException(status_code=400, detail="Name must be 24 characters or fewer.")
    if not re.fullmatch(r"[A-Za-z0-9 _-]+", cleaned):
        raise HTTPException(status_code=400, detail="Name can only contain letters, numbers, spaces, underscores, and hyphens.")
    return cleaned


def time_window_for(range_name: str) -> datetime | None:
    now = datetime.now(timezone.utc)
    if range_name == "daily":
        return now - timedelta(days=1)
    if range_name == "weekly":
        return now - timedelta(days=7)
    if range_name == "monthly":
        return now - timedelta(days=30)
    if range_name == "all_time":
        return None
    raise HTTPException(status_code=400, detail="Leaderboard range must be daily, weekly, monthly, or all_time.")


def leaderboard_payload(range_name: str) -> list[dict[str, object]]:
    cutoff = time_window_for(range_name)
    entries = leaderboard_entries
    if cutoff is not None:
        entries = [entry for entry in leaderboard_entries if entry["created_at"] >= cutoff]

    ranked = sorted(entries, key=lambda entry: (float(entry["time"]), entry["created_at"]))
    return [
        {
            "name": entry["name"],
            "time": round(float(entry["time"]), 3),
            "created_at": entry["created_at"].isoformat(),
        }
        for entry in ranked[:10]
    ]


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/leaderboard")
def get_leaderboard(range: str = "daily") -> dict[str, object]:
    range_name = range.lower()
    return {
        "range": range_name,
        "entries": leaderboard_payload(range_name),
    }


@app.post("/api/leaderboard")
def submit_leaderboard_entry(payload: LeaderboardEntryRequest) -> dict[str, object]:
    safe_name = normalize_name(payload.name)
    observed_time = round(float(payload.time), 3)
    entry = {
        "name": safe_name,
        "time": observed_time,
        "created_at": datetime.now(timezone.utc),
    }
    leaderboard_entries.append(entry)
    return {
        "message": "Score added to leaderboard.",
        "entry": {"name": safe_name, "time": observed_time},
    }
'''

@app.get("/", include_in_schema=False)
def serve_frontend() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")
