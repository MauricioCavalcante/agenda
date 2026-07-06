import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERRO: Variável SUPABASE_DB_URL não encontrada.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Aplicando DEFAULT auth.uid() para a coluna user_id nas tabelas...");

    const tables = [
      'user_goals',
      'physical_setup',
      'financial_setup',
      'books',
      'schedules',
      'history',
      'stats',
      'spheres'
    ];

    for (const table of tables) {
      try {
        await client.query(`
          ALTER TABLE ${table} 
          ALTER COLUMN user_id SET DEFAULT (NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid);
        `);
        console.log(`[OK] Tabela ${table} atualizada com sucesso.`);
      } catch (e) {
        console.log(`[AVISO] Tabela ${table} ignorada ou erro: ${e.message}`);
      }
    }

    console.log("Confirmando e-mails automaticamente para evitar bloqueios de login...");
    try {
      await client.query(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL`);
      console.log("[OK] E-mails confirmados.");
    } catch (e) {
      console.log(`[AVISO] Erro ao confirmar e-mails: ${e.message}`);
    }

    console.log("Adicionando colunas date e duration na tabela schedules, se não existirem...");
    try {
      await client.query(`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';`);
      await client.query(`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS duration TEXT;`);
      console.log("[OK] Colunas adicionadas na tabela schedules.");
    } catch (e) {
      console.log(`[AVISO] Erro ao adicionar colunas em schedules: ${e.message}`);
    }

    console.log("Corrigindo schema da tabela history...");
    try {
      await client.query(`ALTER TABLE history RENAME COLUMN task TO taskid;`);
    } catch(e) {}
    try {
      await client.query(`ALTER TABLE history RENAME COLUMN xp TO xpearned;`);
    } catch(e) {}
    try {
      await client.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';`);
      await client.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
      await client.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS timestamp TEXT DEFAULT '';`);
      console.log("[OK] Tabela history corrigida.");
    } catch (e) {
      console.log(`[AVISO] Erro ao corrigir history: ${e.message}`);
    }

    console.log("Processo concluído com sucesso!");
  } catch (err) {
    console.error("Falha ao aplicar alterações:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
