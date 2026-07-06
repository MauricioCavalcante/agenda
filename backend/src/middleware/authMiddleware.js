import { createClient } from '@supabase/supabase-js';
import { dbContext } from '../../database.js';

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
  }
  return supabaseClient;
}

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabase();

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase não está configurado no backend' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }

  // Inject userId into the AsyncLocalStorage context so database.js can pick it up for RLS
  const store = dbContext.getStore();
  if (store) {
    store.set('userId', user.id);
  }
  
  req.user = user;
  next();
};
