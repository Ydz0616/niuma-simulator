## Backend (FastAPI + PostgreSQL)

### 1) Install

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Configure

Copy `/Users/yuandong/Documents/New project/corporate_asylum/.env.example` to `.env` at project root.

### 3) Run

```bash
cd /Users/yuandong/Documents/New project/corporate_asylum/backend
python run.py
```

API default: `http://localhost:8000`

### Current endpoints

- `GET /health`
- `GET /api/auth/secondme/start`
- `GET /api/auth/secondme/callback`
- `GET /api/me/card?user_id=<uuid>`
