/**
 * Configurações Gerais do Sistema
 * 
 * Responsável por:
 * - Gerenciar as chaves de API da Inteligência Artificial
 * - Gerenciar a conexão do Banco de Dados Dinâmico (Local SQLite / Remoto PostgreSQL)
 * - Retornar o histórico consolidado de pontos do usuário para exibição de calendários
 */
import express from 'express';
import database from '../../database.js';
import { encryptKey } from '../utils/crypto.js';

const router = express.Router();

/** GET /ai-config - Retorna a configuração do provedor de IA atual. */
router.get('/ai-config', async (req, res) => {
  try {
    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    const dbApiKey = config?.apiKey || config?.apikey;
    const maskedConfig = {
      provider: config?.provider || 'openai',
      apiKey: dbApiKey ? '*****' : '',
      model: config?.model || 'gpt-4o-mini',
      apiEndpoint: config?.endpoint || config?.apiEndpoint || 'https://api.openai.com/v1'
    };
    res.json(maskedConfig);
  } catch (err) {
    console.error("Error in GET /api/ai-config:", err);
    res.status(500).json({ error: "Erro interno ao carregar configuração de IA." });
  }
});

/** POST /ai-config - Atualiza o provedor, modelo e chave de API de Inteligência Artificial. */
router.post('/ai-config', async (req, res) => {
  const { provider, apiKey, model, apiEndpoint } = req.body;
  if (!provider || !model) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const current = await database.get("SELECT * FROM ai_config LIMIT 1");
    let keyToSave = apiKey;
    if (apiKey === '*****') {
      const dbApiKey = current ? (current.apiKey || current.apikey) : '';
      keyToSave = dbApiKey;
    } else if (apiKey === '') {
      keyToSave = '';
    }

    const encryptedKey = encryptKey(keyToSave);

    const result = await database.run(
      "UPDATE ai_config SET provider = ?, apiKey = ?, model = ?, endpoint = ?",
      [provider, encryptedKey || '', model, apiEndpoint || '']
    );

    // If no row was updated (e.g. trigger didn't run or legacy account), insert a new row
    if (result.changes === 0) {
      await database.run(
        "INSERT INTO ai_config (provider, apiKey, model, endpoint) VALUES (?, ?, ?, ?)",
        [provider, encryptedKey || '', model, apiEndpoint || '']
      );
    }

    res.json({ success: true, message: "AI Configuration updated successfully" });
  } catch (err) {
    console.error("Error in POST /api/ai-config:", err);
    res.status(500).json({ error: "Erro interno ao salvar configurações de IA." });
  }
});

/** GET /calendar-xp - Agrega o ganho de XP por dia para renderizar os mapas de calor. */
router.get('/calendar-xp', async (req, res) => {
  try {
    const rows = await database.all("SELECT date, SUM(xpEarned) as totalXp FROM history GROUP BY date");
    const xpMap = {};
    rows.forEach(item => {
      if (item.date) {
        xpMap[item.date] = item.totalXp;
      }
    });
    res.json(xpMap);
  } catch (err) {
    console.error("Error in GET /api/calendar-xp:", err);
    res.status(500).json({ error: "Erro interno ao carregar evolução do calendário." });
  }
});

/** GET /history - Retorna o histórico sequencial de atividades concluídas. */
router.get('/history', async (req, res) => {
  try {
    const list = await database.all("SELECT * FROM history ORDER BY timestamp DESC");
    res.json(list.map(h => ({
      ...h,
      xpEarned: Number(h.xpEarned)
    })));
  } catch (err) {
    console.error("Error in GET /api/history:", err);
    res.status(500).json({ error: "Erro interno ao carregar o histórico." });
  }
});

/** GET /db-config - Retorna as credenciais e o provedor atual do banco de dados local/remoto. */
router.get('/db-config', async (req, res) => {
  try {
    const config = await database.getSqlite("SELECT * FROM db_config WHERE id = 1");
    const activeProvider = database.getActiveProvider();
    const maskedConfig = {
      provider: config?.provider || 'sqlite',
      connection_string: config?.connection_string || '',
      host: config?.host || '',
      port: config?.port || 5432,
      database: config?.database || '',
      username: config?.username || '',
      password: config?.password ? '*****' : '',
      ssl: config?.ssl === undefined ? 1 : !!config.ssl,
      active: activeProvider === 'postgres'
    };
    res.json(maskedConfig);
  } catch (err) {
    console.error("Error in GET /api/db-config:", err);
    res.status(500).json({ error: "Erro interno ao carregar configurações de banco." });
  }
});

/** POST /db-config - Salva os dados de configuração de banco, sem ativá-lo imediatamente. */
router.post('/db-config', async (req, res) => {
  const { provider, connection_string, host, port, database: dbName, username, password, ssl } = req.body;
  try {
    const current = await database.getSqlite("SELECT password FROM db_config WHERE id = 1");
    let passwordToSave = password;
    if (password === '*****') {
      passwordToSave = current ? current.password : '';
    } else if (!password) {
      passwordToSave = '';
    }

    await database.runSqlite(
      `INSERT OR REPLACE INTO db_config 
       (id, provider, connection_string, host, port, database, username, password, ssl, active) 
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        provider || 'sqlite',
        connection_string || '',
        host || '',
        parseInt(port, 10) || 5432,
        dbName || '',
        username || '',
        passwordToSave || '',
        ssl ? 1 : 0,
        database.getActiveProvider() === 'postgres' ? 1 : 0
      ]
    );
    res.json({ success: true, message: "Configurações de banco salvas." });
  } catch (err) {
    console.error("Error in POST /api/db-config:", err);
    res.status(500).json({ error: "Erro interno ao salvar configurações de banco." });
  }
});

/** POST /db-test - Realiza um ping na URL do banco de dados remoto para checar a conectividade. */
router.post('/db-test', async (req, res) => {
  const { connection_string, host, port, database: dbName, username, password, ssl } = req.body;
  try {
    const current = await database.getSqlite("SELECT password FROM db_config WHERE id = 1");
    let passwordToTest = password;
    if (password === '*****') {
      passwordToTest = current ? current.password : '';
    }

    const testConfig = {
      connection_string,
      host,
      port,
      database: dbName,
      username,
      password: passwordToTest,
      ssl
    };

    const result = await database.testPostgresConnection(testConfig);
    if (result.success) {
      res.json({ success: true, message: "Conectado com sucesso!" });
    } else {
      res.status(400).json({ error: `Falha na conexão: ${result.error}` });
    }
  } catch (err) {
    console.error("Error in POST /api/db-config/test:", err);
    res.status(500).json({ error: `Erro ao testar conexão: ${err.message}` });
  }
});

/** POST /db-activate - Valida a conexão remota, realiza o switch no backend e orquestra a migração de dados do SQLite -> PostgreSQL. */
router.post('/db-activate', async (req, res) => {
  const { connection_string, host, port, database: dbName, username, password, ssl, migrateData } = req.body;
  try {
    const current = await database.getSqlite("SELECT password FROM db_config WHERE id = 1");
    let passwordToSave = password;
    if (password === '*****') {
      passwordToSave = current ? current.password : '';
    }

    const configToSave = {
      provider: 'postgres',
      connection_string: connection_string || '',
      host: host || '',
      port: parseInt(port, 10) || 5432,
      database: dbName || '',
      username: username || '',
      password: passwordToSave || '',
      ssl: ssl ? 1 : 0,
      active: 1
    };

    // 1. Setup Postgres Connection pool
    const poolSuccess = await database.setupPostgresPool(configToSave);
    if (!poolSuccess) {
      return res.status(400).json({ error: "Não foi possível conectar ao banco externo. Verifique as configurações." });
    }

    // 2. Temp set provider to Postgres to run schema initialization
    database.setActiveProvider('postgres');

    const sqliteSchema = `
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_level INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS spheres (
        name TEXT PRIMARY KEY,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        taskId TEXT NOT NULL,
        title TEXT NOT NULL,
        sphere TEXT NOT NULL,
        xpEarned INTEGER NOT NULL,
        description TEXT,
        timestamp TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        duration TEXT,
        title TEXT NOT NULL,
        sphere TEXT NOT NULL,
        xp INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        description TEXT,
        doneAt TEXT,
        isMeeting INTEGER DEFAULT 0,
        parentId TEXT
      );
      CREATE TABLE IF NOT EXISTS ai_config (
        provider TEXT PRIMARY KEY,
        apiKey TEXT,
        model TEXT,
        apiEndpoint TEXT
      );
      CREATE TABLE IF NOT EXISTS user_goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        durationMins INTEGER NOT NULL,
        sphere TEXT NOT NULL,
        frequency TEXT NOT NULL,
        active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS physical_setup (
        id INTEGER PRIMARY KEY DEFAULT 1,
        desired_exercises TEXT,
        ai_plan TEXT
      );
      CREATE TABLE IF NOT EXISTS financial_setup (
        id INTEGER PRIMARY KEY DEFAULT 1,
        financial_goals TEXT,
        monthly_income REAL DEFAULT 0,
        savings_target_percent REAL DEFAULT 20,
        ai_plan TEXT
      );
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        sphere TEXT NOT NULL,
        pages INTEGER,
        goal TEXT,
        depth TEXT,
        xp INTEGER DEFAULT 0,
        xp_reason TEXT,
        completed INTEGER DEFAULT 0,
        doneAt TEXT
      );
    `;
    
    try {
      await database.exec(sqliteSchema);
      
      // Alter column types to DOUBLE PRECISION if they already existed as INTEGER
      try {
        await database.run("ALTER TABLE history ALTER COLUMN xpearned TYPE DOUBLE PRECISION");
        await database.run("ALTER TABLE schedules ALTER COLUMN xp TYPE DOUBLE PRECISION");
        await database.run("ALTER TABLE spheres ALTER COLUMN xp TYPE DOUBLE PRECISION");
        await database.run("ALTER TABLE books ALTER COLUMN xp TYPE DOUBLE PRECISION");
        console.log("PostgreSQL column types altered to DOUBLE PRECISION successfully.");
      } catch (alterErr) {
        console.warn("Could not alter columns to DOUBLE PRECISION (they may already be correctly typed):", alterErr.message);
      }

      // Repair sequences on PostgreSQL if tables already existed without AUTOINCREMENT/SERIAL
      try {
        await database.run("CREATE SEQUENCE IF NOT EXISTS history_id_seq");
        await database.run("ALTER TABLE history ALTER COLUMN id SET DEFAULT nextval('history_id_seq')");
        await database.run("ALTER SEQUENCE history_id_seq OWNED BY history.id");
        console.log("PostgreSQL sequence for history table verified/created.");
      } catch (seqErr) {
        console.warn("Could not setup sequence for history table:", seqErr.message);
      }

      try {
        await database.run("CREATE SEQUENCE IF NOT EXISTS stats_id_seq");
        await database.run("ALTER TABLE stats ALTER COLUMN id SET DEFAULT nextval('stats_id_seq')");
        await database.run("ALTER SEQUENCE stats_id_seq OWNED BY stats.id");
        console.log("PostgreSQL sequence for stats table verified/created.");
      } catch (seqErr) {
        console.warn("Could not setup sequence for stats table:", seqErr.message);
      }
    } catch (schemaErr) {
      console.error("Schema creation failed on PostgreSQL:", schemaErr);
      database.setActiveProvider('sqlite');
      return res.status(500).json({ error: `Falha ao criar tabelas no banco de dados externo: ${schemaErr.message}` });
    }

    // 3. Migrate data if requested
    if (migrateData) {
      try {
        await database.migrateLocalToRemote(configToSave);
      } catch (migErr) {
        console.error("Data migration failed:", migErr);
        database.setActiveProvider('sqlite');
        return res.status(500).json({ error: `Conectado com sucesso, mas a migração de dados falhou: ${migErr.message}` });
      }
    }

    // 4. Save the configuration to SQLite as active
    await database.runSqlite(
      `INSERT OR REPLACE INTO db_config 
       (id, provider, connection_string, host, port, database, username, password, ssl, active) 
       VALUES (1, 'postgres', ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        configToSave.connection_string,
        configToSave.host,
        configToSave.port,
        configToSave.database,
        configToSave.username,
        configToSave.password,
        configToSave.ssl
      ]
    );

    res.json({ success: true, message: "Banco de dados PostgreSQL/Supabase conectado e ativado!" });
  } catch (err) {
    console.error("Error in POST /api/db-config/activate:", err);
    database.setActiveProvider('sqlite');
    res.status(500).json({ error: `Erro ao ativar banco de dados: ${err.message}` });
  }
});

/** POST /db-deactivate - Reverte o provedor de banco de dados ativo para a instância local SQLite padrão. */
router.post('/db-deactivate', async (req, res) => {
  try {
    database.setActiveProvider('sqlite');
    await database.runSqlite("UPDATE db_config SET active = 0, provider = 'sqlite' WHERE id = 1");
    res.json({ success: true, message: "Banco de dados externo desativado. Retornando ao SQLite local." });
  } catch (err) {
    console.error("Error in POST /api/db-config/deactivate:", err);
    res.status(500).json({ error: `Erro ao desativar banco remoto: ${err.message}` });
  }
});

export default router;
