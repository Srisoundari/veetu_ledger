# VeetuLedger

**வீட்டு Ledger** — A household finance PWA for Indian families.

Track daily expenses, manage renovation/construction projects, and share a shopping list — all from your phone, with your household.

---

## Features

| Section | What it does |
|---|---|
| **Dashboard** | Monthly spending overview with donut/bar chart breakdown by category, outstanding project balance, pending list items |
| **Expenses** | Log daily expenses with amount, category, and note; browse history by month; date-grouped rows with emoji badges |
| **Projects** | Track construction or renovation jobs — day-wise entries with total billed, amount paid, and outstanding balance |
| **Shopping List** | Shared list for the household; mark items done, edit, or clear completed |
| **Household** | Create or join a household via invite code; manage members |
| **✦ Assistant** | Type naturally ("spent ₹450 on groceries today") — the AI parses it and saves to the right section |
| **Dark mode** | Full dark mode, respects system preference, toggleable from the top bar |

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS v3 (`darkMode: "class"`)
- Inter font (Google Fonts)
- `react-i18next` for English / Tamil localisation
- Deployed on **Vercel**

**Backend**
- Python 3.13, FastAPI, `uv` package manager
- Supabase client for all DB operations
- Anthropic Claude + Google Gemini for NLP parsing
- Deployed on **Railway** (or any Docker host)

**Database**
- Supabase (PostgreSQL)
- Row Level Security — every query is scoped to the user's household
- Schema: `households`, `profiles`, `expenses`, `projects`, `project_entries`, `list_items`

---

## Project Structure

```
veetu_ledger/
├── backend/
│   ├── main.py               # FastAPI app, CORS config
│   ├── routers/
│   │   ├── expenses.py
│   │   ├── projects.py
│   │   ├── shared_list.py
│   │   ├── households.py
│   │   └── nlp.py            # LLM parse + save endpoints
│   ├── database.py           # Supabase client
│   ├── dependencies.py       # JWT auth dependency
│   ├── schemas.py
│   ├── llm.py                # Claude / Gemini wrapper
│   └── pyproject.toml        # uv dependencies
├── frontend/
│   ├── src/
│   │   ├── screens/          # Dashboard, Expenses, Projects, SharedList, …
│   │   ├── components/       # TopBar, BottomNav, FloatingAssistant, PageInfo, …
│   │   ├── hooks/            # useAuth, useExpenses, useProjects, useTheme, …
│   │   ├── api/              # Typed API clients
│   │   └── utils/format.js   # formatCurrency, formatDate, …
│   └── package.json
├── supabase/
│   └── schema.sql            # Full DB schema + RLS policies
├── docker-compose.yml
├── docker-compose.dev.yml
└── Makefile
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.13+, [`uv`](https://github.com/astral-sh/uv)
- A [Supabase](https://supabase.com) project (free tier works)
- An Anthropic or Google Gemini API key (for the NLP assistant)

### 1. Database

Run `supabase/schema.sql` in the Supabase SQL editor. This creates all tables and RLS policies.

Enable **Email auth** in your Supabase project (Authentication → Providers → Email).

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in your keys (see below)
uv sync
uv run uvicorn main:app --reload --port 8000
```

**`backend/.env`**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...          # or leave blank to use Gemini
GOOGLE_API_KEY=AIza...                # optional fallback
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # fill in your keys (see below)
npm install
npm run dev
```

**`frontend/.env`**
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

Open [http://localhost:5173](http://localhost:5173).

---

## Docker (full stack)

```bash
# Development — hot reload on both services
make dev

# Production
make prod

# Stop
make down

# Tail logs
make logs
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub, import the repo in Vercel
2. Set **Root Directory** to `frontend`
3. Add the three `VITE_*` environment variables in Vercel project settings

### Backend → Railway / Render / Fly.io

1. Point the service at the `backend/` directory
2. Add the four environment variables
3. Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Update `CORS` origins in `backend/main.py` to include your Vercel URL

---

## NLP Assistant

The **✦ assistant** accepts free-form text in English or Tamil and maps it to one of three types:

| Input example | Saved as |
|---|---|
| `spent ₹450 on groceries today` | Expense |
| `add milk and eggs to list` | Shopping list item |
| `tiling done, charged 5000 paid 2000` | Project entry (inside a project) |

The backend calls Claude (primary) or Gemini (fallback), returns a JSON array, and previews it in the UI before saving. Nothing is written until the user taps **Save**.

---

## Key Design Decisions

- **Household-scoped data** — all tables carry a `household_id` and Supabase RLS enforces it. The backend uses the service-role key but manually scopes every insert/select to the authenticated user's household.
- **No global state library** — data lives in per-screen hooks (`useExpenses`, `useProjects`, etc.) that call the API directly. Keeping it simple.
- **Dark mode via CSS class** — `document.documentElement.classList.toggle("dark", ...)` driven by `useTheme`, so Tailwind's `dark:` variants work everywhere without a context provider.
- **Pure SVG donut chart** — no charting library; a small `DonutChart` component uses `stroke-dasharray` and per-segment rotation.

---

## License

MIT
