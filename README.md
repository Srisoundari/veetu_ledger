# VeetuLedger

**வீட்டு Ledger** — A household finance PWA for Indian families.

Track daily expenses, organise them into categories (renovation, construction, events), bulk-import WhatsApp-style expense reports, and share a shopping list — all from your phone, with your household. Everything flows through a single **✦ assistant** bubble.

---

## Features

| Section | What it does |
|---|---|
| **✦ Floating Assistant** | Global bubble (bottom-right on every screen). Type naturally in English or Tamil, or paste a full WhatsApp-style expense report. LLM parses → preview → save. Auto-attaches new items to the first active category (tap **None** to save as standalone). |
| **Dashboard (Home)** | Single-round-trip monthly overview: total spent, outstanding balance across active categories, pending list items, active categories. Donut/bar breakdown **by category** (not free-form strings). Recent expenses grouped by description with a `×N` badge and summed amounts. Month picker + category filter chips. |
| **Categories** | Formerly "Groups" — buckets like Renovation, Event, Construction. Each card shows `Total / Paid / Due` + progress, all derived from the DB-generated `balance` column so totals never drift. Complete/archive, rename, delete (cascades to line-items). |
| **Category detail** | Compact header (title + back + `%` badge on one row, inline totals, slim progress). Line-items split into **Paid** and **Yet to Pay**. Inline edit per row. Add via the ✦ bubble or the + FAB. |
| **Expenses (unified)** | One `expenses` table covers both standalone items *and* category line-items via a nullable `project_id`. `balance` is a Postgres generated column — `amount − coalesce(paid_amount, amount)`. |
| **Shopping List** | Household-scoped pending items. Add via the bubble (`add rice 2kg to list`) or inline form. Mark done / clear. |
| **Household** | Auto-created silently on first login — no setup screen. Invite code to add members, rotate / leave / rename, per-member profile (name + language). |
| **UX polish** | Currency always shows 2 decimals (`₹1,234.50`). Percentages to 2 decimals. Per-tab ErrorBoundary so a bad render shows an error card instead of a blank screen. Safe bottom padding so FAB + ✦ bubble never overlap the last card or its edit form. |
| **Dark mode** | Full dark mode, respects system preference, toggleable from the top bar. |

---

## Tech Stack

**Frontend**
- React 18 + Vite (PWA)
- Tailwind CSS v3 (`darkMode: "class"`)
- Inter font (Google Fonts)
- `react-i18next` for English / Tamil localisation
- Deployed on **Vercel**

**Backend**
- Python 3.13, FastAPI, `uv` package manager
- Supabase Python client for all DB operations
- Anthropic Claude + Google Gemini for NLP parsing (pluggable via `llm.py`)
- Deployed on **Railway** (or any Docker host)

**Database**
- Supabase (PostgreSQL)
- Row Level Security — every query scoped to the user's household
- Schema: `households`, `profiles`, `expenses` (unified), `projects`, `list_items`

---

## Project Structure

```
veetu_ledger/
├── backend/
│   ├── main.py               # FastAPI app, CORS config
│   ├── routers/
│   │   ├── dashboard.py      # aggregated /dashboard?month=YYYY-MM (one round-trip)
│   │   ├── expenses.py       # list / create / update / delete / summary
│   │   ├── projects.py       # categories + per-category summary
│   │   ├── shared_list.py
│   │   ├── households.py
│   │   └── nlp.py            # /parse + /save (tolerant of legacy field names)
│   ├── household_utils.py    # get_or_create_household_id (auto-create, None-safe)
│   ├── database.py           # Supabase client
│   ├── dependencies.py       # JWT auth dependency
│   ├── schemas.py
│   ├── llm.py                # Claude / Gemini wrapper
│   └── pyproject.toml        # uv dependencies
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Dashboard/    # Home — single hook, donut/bar, grouped recents
│   │   │   ├── Projects/     # Categories list + detail
│   │   │   ├── List/         # Shopping list
│   │   │   └── Settings/
│   │   ├── components/
│   │   │   ├── FloatingAssistant.jsx  # global ✦ bubble
│   │   │   ├── ErrorBoundary          # per-tab crash guard
│   │   │   ├── TopBar, BottomNav, PageInfo, …
│   │   ├── hooks/
│   │   │   ├── useDashboard.js
│   │   │   ├── useProjects.js  # useProjects + useProjectEntries
│   │   │   └── useAuth, useTheme, …
│   │   ├── api/
│   │   │   ├── client.js     # fetch wrapper, friendly network errors
│   │   │   ├── dashboard.api.js
│   │   │   ├── expenses.api.js
│   │   │   ├── projects.api.js
│   │   │   └── nlp.api.js
│   │   └── utils/
│   │       ├── format.js     # formatCurrency (₹, 2 decimals), formatDate
│   │       └── localStore.js # guest-mode local persistence
│   └── package.json
├── supabase/
│   └── schema.sql            # Full DB schema + RLS policies
├── docker-compose.yml
├── docker-compose.dev.yml
└── Makefile
```

---

## Data model

```sql
households   (id, name, invite_code, created_at)
profiles     (id = auth.users.id, household_id, name, language)
projects     (id, household_id, name, description, status, created_at)   -- "categories" in the UI
expenses     (id, household_id, added_by,
              project_id NULL,                                           -- null = standalone
              date, amount,
              paid_amount NULL,                                          -- null = fully paid
              description, category,
              balance GENERATED ALWAYS AS
                (amount - coalesce(paid_amount, amount)) STORED)
list_items   (id, household_id, added_by, item_name, quantity, is_done)
```

Semantic rules:
- `project_id IS NULL` → standalone expense
- `project_id IS NOT NULL` → category line-item
- `paid_amount IS NULL` → fully paid
- Delete a category → its expenses cascade-delete via FK.

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

The **✦ assistant** accepts free-form text in English or Tamil and maps it to one of two types:

| Input example | Saved as |
|---|---|
| `spent ₹450 on groceries today` | Expense (standalone or attached to the currently-selected category) |
| `add milk and eggs to list` | Shopping list item |
| WhatsApp-style report with date headers + `Item :- 1234` lines + `Yet to Pay` section | Multiple expense rows, each with `paid_amount` inferred from the `Yet to Pay` / `Balance` / `Pending` separator |

The backend calls Claude (primary) or Gemini (fallback), returns a JSON array, and previews it in the UI before saving. Nothing is written until the user taps **Save**. Legacy field names from older LLM prompts (`project_entry`, `entry_date`, `total_amount`, `work_description`) are still accepted server-side, so older parses keep saving correctly.

---

## Key Design Decisions

- **Single-table expenses** — collapsed the old `project_entries` table into `expenses` with a nullable `project_id`. Simpler queries, one summary endpoint, cascade-delete per category.
- **Generated `balance` column** — `amount − coalesce(paid_amount, amount)` computed at the DB level, so Paid/Due figures never drift from paid_amount updates. Frontend totals are derived from per-row `balance` to stay consistent even if backend summary aggregation lags.
- **Household-scoped data** — all tables carry a `household_id`; Supabase RLS enforces it. Backend uses the service-role key but every insert/select is manually scoped to the authenticated user's household.
- **Household auto-create** — no setup screen; `get_or_create_household_id()` silently creates a household + profile on first API call.
- **Single dashboard endpoint** — `/dashboard?month=YYYY-MM` returns total, categories breakdown, recent expenses, active category count, outstanding balance, and pending list items in one round-trip.
- **✦-first input** — the bubble is the primary way to add data. Pull-out forms still exist for precision edits, but the expectation is you'll type naturally.
- **No global state library** — data lives in per-screen hooks (`useDashboard`, `useProjects`, `useProjectEntries`, etc.) that call the API directly.
- **Guest mode** — unauthenticated users get a fully-functional app backed by `localStorage` (`utils/localStore.js`). Sign-in later migrates to Supabase.
- **Dark mode via CSS class** — `document.documentElement.classList.toggle("dark", ...)` driven by `useTheme`, so Tailwind's `dark:` variants work everywhere without a context provider.
- **Pure SVG donut chart** — no charting library; a small `DonutChart` uses `stroke-dasharray` and per-segment rotation.
- **ErrorBoundary per tab** — `key={tab}` remounts the boundary on navigation, so one broken screen doesn't blank out the whole app.

---

## License

MIT
