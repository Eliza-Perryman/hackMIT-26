from pathlib import Path
import hashlib
import re
import secrets

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = FastAPI(title="Frontend Backend Template", version="0.1.0")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


class SignUpRequest(BaseModel):
    email: str
    password: str


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def password_matches(password: str, stored_password: str) -> bool:
    salt_hex, digest_hex = stored_password.split(":")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
    return secrets.compare_digest(digest.hex(), digest_hex)


users: dict[str, str] = {"debug@test.com": hash_password("test")}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth")
def authenticate(payload: SignUpRequest) -> dict[str, str]:
    email = payload.email.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if email in users:
        if not password_matches(payload.password, users[email]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        return {"message": "Logged in."}

    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="New passwords must be at least 8 characters.")
    users[email] = hash_password(payload.password)
    return {"message": "Account created."}


@app.get("/", include_in_schema=False)
def serve_frontend() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")
