CREATE TABLE IF NOT EXISTS organismes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'FCFA'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  screen_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  organisme_id TEXT REFERENCES organismes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  organisme_id TEXT NOT NULL REFERENCES organismes(id),
  title TEXT NOT NULL DEFAULT '',
  company_email TEXT NOT NULL DEFAULT '',
  company_phone TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'facturation'
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  organisme_id TEXT NOT NULL REFERENCES organismes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organisme_id);

CREATE TABLE IF NOT EXISTS custom_templates (
  id TEXT PRIMARY KEY,
  organisme_id TEXT NOT NULL REFERENCES organismes(id) ON DELETE CASCADE,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_org ON custom_templates(organisme_id);

CREATE TABLE IF NOT EXISTS expense_months (
  id TEXT PRIMARY KEY,
  organisme_id TEXT NOT NULL REFERENCES organismes(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,
  sealed BOOLEAN NOT NULL DEFAULT FALSE,
  sealed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (organisme_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON expense_months(organisme_id);

CREATE TABLE IF NOT EXISTS rental_months (
  id TEXT PRIMARY KEY,
  organisme_id TEXT NOT NULL REFERENCES organismes(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,
  sealed BOOLEAN NOT NULL DEFAULT FALSE,
  sealed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (organisme_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_rentals_org ON rental_months(organisme_id);
