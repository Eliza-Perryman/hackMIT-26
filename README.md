# Frontend + Backend Template

This project contains a FastAPI backend and a lightweight static frontend. Python scripts now live under `backend/`.

## Install

Use `python3` on this machine:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Run the web app

```bash
python3 -m uvicorn backend.main:app --reload
```

Open http://127.0.0.1:8000. Submit the form to call `POST /api/auth`.

## Walkthrough

1. `backend/main.py` serves the frontend and defines the signup/login API.
2. `frontend/index.html` contains the email and password form.
3. `frontend/app.js` sends the form to the backend and displays the response.
4. `backend/main.py` validates the email and password, hashes new passwords, and stores accounts in memory.

The built-in debug login is `debug@test.com` with password `test`.

This is a draft system: accounts disappear when the server restarts. Add a database, sessions, email verification, and rate limiting before production use.

## Run the original demo

```bash
python3 backend/app.py
```
