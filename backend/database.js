/**
 * Camada de Acesso a Dados (Data Access Layer) - Supabase Edition
 * 
 * Responsável por:
 * - Gerenciar a conexão principal via PostgreSQL (Supabase)
 * - Injetar o contexto de segurança RLS (Row Level Security) usando o userId
 */
import pg from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

const { Pool } = pg;

export const dbContext = new AsyncLocalStorage();

export function runInContext(fn) {
  return dbContext.run(new Map(), fn);
}

let pgPool = null;

export async function initPool() {
  if (pgPool) return true;
  
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERRO CRÍTICO: Variável SUPABASE_DB_URL não encontrada no .env");
    return false;
  }

  pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pgPool.connect();
    
    // Criar a tabela todos se ela não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT,
        user_id UUID DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid) REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        label TEXT NOT NULL,
        sphere TEXT NOT NULL,
        xp INTEGER DEFAULT 10,
        completed INTEGER DEFAULT 0,
        parent_id TEXT,
        description TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        done_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (id, user_id)
      );
    `);

    // Garantir colunas adicionais para subtarefas e descrição se a tabela já existia
    await client.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS parent_id TEXT;`);
    await client.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);

    // Habilitar RLS
    await client.query(`ALTER TABLE todos ENABLE ROW LEVEL SECURITY;`);

    // Criar política de RLS se não existir
    try {
      await client.query(`
        CREATE POLICY "Users can manage own todos" ON todos
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      `);
    } catch (e) {
      // A política já pode existir, o que é esperado nas inicializações subsequentes
    }

    client.release();
    console.log("Conectado com sucesso ao Supabase PostgreSQL e tabela 'todos' verificada.");
    return true;
  } catch (err) {
    console.error('Falha ao conectar no Supabase PostgreSQL:', err);
    return false;
  }
}

/**
 * Helper para executar queries com contexto RLS do Supabase.
 * Injeta o user_id atual na variável de sessão do Postgres para que as políticas RLS funcionem.
 */
async function executeWithRls(sql, params = []) {
  if (!pgPool) await initPool();

  const store = dbContext.getStore();
  const userId = store ? store.get('userId') : null;
  const client = await pgPool.connect();

  try {
    // Se o usuário estiver autenticado, aplica o RLS localmente usando uma transação
    if (userId) {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
      await client.query(`SET LOCAL ROLE authenticated`);
      // Convert SQLite ? syntax to PG $1 syntax if needed
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await client.query(pgSql, params);
      await client.query('COMMIT');
      return res;
    } else {
      // Sem usuário autenticado (bypass / admin ou rota não protegida)
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      return await client.query(pgSql, params);
    }
  } catch (err) {
    if (userId) await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function run(sql, params = []) {
  return executeWithRls(sql, params).then(res => ({ changes: res.rowCount }));
}

export function get(sql, params = []) {
  return executeWithRls(sql, params).then(res => res.rows[0]);
}

export function all(sql, params = []) {
  return executeWithRls(sql, params).then(res => res.rows || []);
}

export function exec(sql) {
  return executeWithRls(sql, []);
}

export function close() {
  if (pgPool) return pgPool.end();
  return Promise.resolve();
}

export default {
  run,
  get,
  all,
  exec,
  close,
  runInContext,
  initPool
};
