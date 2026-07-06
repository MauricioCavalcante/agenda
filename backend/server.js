/**
 * Motor principal da Agenda Local (Backend)
 * 
 * Responsável por:
 * - Inicializar e gerenciar o banco de dados local (SQLite)
 * - Conectar a interface do usuário com as lógicas da agenda e da Inteligência Artificial
 * - Iniciar a interface gráfica (servindo o Frontend no navegador)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import database from './database.js';
import { authMiddleware } from './src/middleware/authMiddleware.js';
import { createClient } from '@supabase/supabase-js';

import statsRoute from './src/routes/statsRoute.js';
import scheduleRoute from './src/routes/scheduleRoute.js';
import goalsRoute from './src/routes/goalsRoute.js';
import physicalRoute from './src/routes/physicalRoute.js';
import financialRoute from './src/routes/financialRoute.js';
import booksRoute from './src/routes/booksRoute.js';
import configRoute from './src/routes/configRoute.js';
import todosRoute from './src/routes/todosRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  database.runInContext(next);
});

try {
  await database.initPool();
  // Aplicar migração do user_id
  try {
    const { exec } = await import('child_process');
    exec('node scripts/apply_defaults.js', (err, stdout, stderr) => {
      if (err) console.error("Erro ao aplicar defaults:", err);
      else console.log("Defaults aplicados com sucesso.");
    });
  } catch (e) {}

  // Criar usuário Maurício temporário caso não exista para facilitar login local
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const tempSupabase = createClient(supabaseUrl, supabaseKey);
      tempSupabase.auth.signUp({
        email: 'mauricio@agenda.com',
        password: 'senha_secreta_123',
        options: {
          data: {
            full_name: 'Maurício Cavalcante'
          }
        }
      }).then(({ data, error }) => {
        if (error) {
          // Se o erro for de usuário já cadastrado, é o fluxo normal
          if (error.message.includes('already registered') || error.message.includes('already exists') || error.status === 422) {
            console.log("Usuário Maurício já cadastrado no banco.");
          } else {
            console.error("Erro ao tentar cadastrar usuário Maurício:", error.message);
          }
        } else if (data?.user) {
          console.log("Usuário Maurício cadastrado com sucesso! E-mail: mauricio@agenda.com");
        }
      });
    }
  } catch (e) {
    console.error("Erro na rotina de cadastro automático:", e);
  }

} catch (e) {
  console.error("Database connection failed at startup:", e);
}

// Protege todas as rotas da API
app.use('/api', authMiddleware);

app.use('/api/stats', statsRoute);
app.use('/api/schedule', scheduleRoute);
app.use('/api/user-goals', goalsRoute);
app.use('/api/physical-setup', physicalRoute);
app.use('/api/financial-setup', financialRoute);
app.use('/api/books', booksRoute);
app.use('/api/todos', todosRoute);
app.use('/api', configRoute);

const publicDir = path.resolve(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`Backend server running securely on http://${HOST}:${PORT}`);
});
