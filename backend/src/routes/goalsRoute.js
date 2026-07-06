/**
 * Metas Recorrentes (Rotinas Fixas)
 * 
 * Responsável pelo CRUD de blocos de tempo que o usuário deseja inserir 
 * automaticamente em seus dias vazios ao longo da semana.
 */
import express from 'express';
import database from '../../database.js';

const router = express.Router();

/**
 * GET /
 * Retorna a lista de metas ativas.
 */
router.get('/', async (req, res) => {
  try {
    const goals = await database.all("SELECT * FROM user_goals");
    res.json(goals.map(g => ({
      ...g,
      durationMins: g.durationMins || g.durationmins, // Handle SQLite camelCase or Postgres lowercase
      active: !!g.active
    })));
  } catch (err) {
    console.error("Error in GET /api/user-goals:", err);
    res.status(500).json({ error: "Erro interno ao carregar metas recorrentes." });
  }
});

/**
 * POST /
 * Insere uma nova meta recorrente na base.
 */
router.post('/', async (req, res) => {
  const { title, durationMins, sphere, frequency } = req.body;
  if (!title || !durationMins || !sphere || !frequency) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const id = `goal-${Date.now()}`;
    await database.run(
      "INSERT INTO user_goals (id, title, durationMins, sphere, frequency, active) VALUES (?, ?, ?, ?, ?, 1)",
      [id, title, Number(durationMins), sphere, frequency]
    );

    const goals = await database.all("SELECT * FROM user_goals");
    res.json(goals.map(g => ({
      ...g,
      durationMins: g.durationMins || g.durationmins,
      active: !!g.active
    })));
  } catch (err) {
    console.error("Error in POST /api/user-goals:", err);
    res.status(500).json({ error: "Erro interno ao criar meta recorrente." });
  }
});

/**
 * POST /delete
 * Exclui permanentemente uma meta recorrente.
 */
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing goal ID" });
  }

  try {
    await database.run("DELETE FROM user_goals WHERE id = ?", [id]);

    const goals = await database.all("SELECT * FROM user_goals");
    res.json(goals.map(g => ({
      ...g,
      durationMins: g.durationMins || g.durationmins,
      active: !!g.active
    })));
  } catch (err) {
    console.error("Error in POST /api/user-goals/delete:", err);
    res.status(500).json({ error: "Erro interno ao excluir meta recorrente." });
  }
});

/**
 * POST /update
 * Atualiza propriedades (duração, esfera, título) de uma meta existente.
 */
router.post('/update', async (req, res) => {
  const { id, title, durationMins, sphere, frequency } = req.body;
  if (!id || !title || !durationMins || !sphere || !frequency) {
    return res.status(400).json({ error: "Parâmetros incompletos" });
  }

  try {
    await database.run(
      "UPDATE user_goals SET title = ?, durationMins = ?, sphere = ?, frequency = ? WHERE id = ?",
      [title, Number(durationMins), sphere, frequency, id]
    );

    const goals = await database.all("SELECT * FROM user_goals");
    res.json(goals.map(g => ({
      ...g,
      durationMins: g.durationMins || g.durationmins,
      active: !!g.active
    })));
  } catch (err) {
    console.error("Error in POST /api/user-goals/update:", err);
    res.status(500).json({ error: "Erro interno ao atualizar meta recorrente." });
  }
});

export default router;
