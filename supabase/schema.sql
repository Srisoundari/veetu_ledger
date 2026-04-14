-- ============================================================
-- VeetuLedger - Supabase Schema
-- Safe to re-run on existing database (idempotent)
-- ============================================================

-- Households (wife + husband share one)
CREATE TABLE IF NOT EXISTS households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID REFERENCES auth.users PRIMARY KEY,
  phone        TEXT,
  name         TEXT,
  language     TEXT DEFAULT 'en',
  household_id UUID REFERENCES households(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Daily expenses
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) NOT NULL,
  added_by     UUID REFERENCES profiles(id) NOT NULL,
  date         DATE DEFAULT CURRENT_DATE,
  amount       NUMERIC(10,2) NOT NULL,
  note         TEXT,
  category     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (e.g. "Kitchen Renovation")
CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Project daily entries (day-wise work log)
CREATE TABLE IF NOT EXISTS project_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES projects(id) NOT NULL,
  entry_date       DATE DEFAULT CURRENT_DATE,
  day_number       INTEGER,
  work_description TEXT,
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance          NUMERIC(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Shared shopping list
CREATE TABLE IF NOT EXISTS list_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) NOT NULL,
  added_by     UUID REFERENCES profiles(id) NOT NULL,
  item_name    TEXT NOT NULL,
  quantity     TEXT,
  is_done      BOOLEAN DEFAULT FALSE,
  done_by      UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE households       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items       ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Households: members only
DROP POLICY IF EXISTS "households_member" ON households;
CREATE POLICY "households_member" ON households
  FOR ALL USING (
    id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Expenses: same household
DROP POLICY IF EXISTS "expenses_household" ON expenses;
CREATE POLICY "expenses_household" ON expenses
  FOR ALL USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Projects: same household
DROP POLICY IF EXISTS "projects_household" ON projects;
CREATE POLICY "projects_household" ON projects
  FOR ALL USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Project entries: via project's household
DROP POLICY IF EXISTS "project_entries_household" ON project_entries;
CREATE POLICY "project_entries_household" ON project_entries
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.household_id = p.household_id
      WHERE pr.id = auth.uid()
    )
  );

-- List items: same household
DROP POLICY IF EXISTS "list_items_household" ON list_items;
CREATE POLICY "list_items_household" ON list_items
  FOR ALL USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );
