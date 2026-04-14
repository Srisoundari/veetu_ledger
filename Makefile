.PHONY: dev prod build down logs backend frontend install

# ── Development (hot reload) ───────────────────────────────────────
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# ── Production ────────────────────────────────────────────────────
prod:
	docker compose up --build -d

# ── Build images only ─────────────────────────────────────────────
build:
	docker compose build

# ── Stop everything ───────────────────────────────────────────────
down:
	docker compose down

# ── Logs ──────────────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

# ── uv shortcuts (run outside Docker) ────────────────────────────
install:
	cd backend && uv sync

run-backend:
	cd backend && uv run uvicorn main:app --reload --port 8000

run-frontend:
	cd frontend && npm install && npm run dev
