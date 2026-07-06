import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const schema = `
  -- 1. Create Tables
  DROP TABLE IF EXISTS stats CASCADE;
  DROP TABLE IF EXISTS spheres CASCADE;
  DROP TABLE IF EXISTS history CASCADE;
  DROP TABLE IF EXISTS schedules CASCADE;
  DROP TABLE IF EXISTS ai_config CASCADE;
  DROP TABLE IF EXISTS user_goals CASCADE;
  DROP TABLE IF EXISTS physical_setup CASCADE;
  DROP TABLE IF EXISTS financial_setup CASCADE;
  DROP TABLE IF EXISTS books CASCADE;

  CREATE TABLE IF NOT EXISTS stats (
    id SERIAL,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    character_level INTEGER DEFAULT 1,
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS spheres (
    id SERIAL,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id SERIAL,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    task TEXT NOT NULL,
    sphere TEXT NOT NULL,
    xp INTEGER NOT NULL,
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL DEFAULT '',
    duration TEXT,
    title TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    sphere TEXT NOT NULL,
    xp INTEGER DEFAULT 10,
    isMeeting INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    description TEXT,
    doneAt TEXT,
    parentId TEXT,
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS ai_config (
    id SERIAL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'openai',
    apiKey TEXT DEFAULT '',
    model TEXT DEFAULT 'gpt-4o-mini',
    endpoint TEXT DEFAULT 'https://api.openai.com/v1',
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    durationMins INTEGER NOT NULL,
    sphere TEXT NOT NULL,
    frequency TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS physical_setup (
    id SERIAL,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    desired_exercises TEXT DEFAULT '',
    ai_plan TEXT DEFAULT '',
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS financial_setup (
    id SERIAL,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    financial_goals TEXT DEFAULT '',
    monthly_income REAL DEFAULT 0,
    savings_target_percent REAL DEFAULT 20,
    ai_plan TEXT DEFAULT '',
    PRIMARY KEY (id, user_id)
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT,
    user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    sphere TEXT NOT NULL,
    totalPages INTEGER,
    pagesPerDay INTEGER,
    targetDate TEXT,
    depth TEXT,
    completed INTEGER DEFAULT 0,
    doneAt TEXT,
    PRIMARY KEY (id, user_id)
  );

  -- 2. Enable RLS
  ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
  ALTER TABLE spheres ENABLE ROW LEVEL SECURITY;
  ALTER TABLE history ENABLE ROW LEVEL SECURITY;
  ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE physical_setup ENABLE ROW LEVEL SECURITY;
  ALTER TABLE financial_setup ENABLE ROW LEVEL SECURITY;
  ALTER TABLE books ENABLE ROW LEVEL SECURITY;

  -- 3. Create RLS Policies
  CREATE OR REPLACE FUNCTION setup_rls(table_name text) RETURNS void AS $$
  BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage own data" ON %I;', table_name);
    EXECUTE format('CREATE POLICY "Users can manage own data" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', table_name);
  END;
  $$ LANGUAGE plpgsql;

  SELECT setup_rls('stats');
  SELECT setup_rls('spheres');
  SELECT setup_rls('history');
  SELECT setup_rls('schedules');
  SELECT setup_rls('ai_config');
  SELECT setup_rls('user_goals');
  SELECT setup_rls('physical_setup');
  SELECT setup_rls('financial_setup');
  SELECT setup_rls('books');

  -- 4. Setup Auth Trigger for new Users
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.stats (user_id, character_level) VALUES (new.id, 1);
    INSERT INTO public.physical_setup (user_id, desired_exercises, ai_plan) VALUES (new.id, '', '');
    INSERT INTO public.financial_setup (user_id, financial_goals, monthly_income, savings_target_percent, ai_plan) VALUES (new.id, '', 0, 20, '');
    INSERT INTO public.ai_config (user_id) VALUES (new.id);
    INSERT INTO public.spheres (name, user_id, level, xp) VALUES 
      ('Profissional', new.id, 1, 0),
      ('Educacional', new.id, 1, 0),
      ('Pessoal', new.id, 1, 0),
      ('Físico', new.id, 1, 0),
      ('Financeiro', new.id, 1, 0),
      ('Social', new.id, 1, 0);
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

async function setup() {
  console.log("Setting up Supabase Schema and RLS...");
  try {
    await pool.query(schema);
    console.log("Schema, RLS and triggers successfully configured!");
  } catch (e) {
    console.error("Error setting up Supabase:", e);
  } finally {
    await pool.end();
  }
}

setup();
