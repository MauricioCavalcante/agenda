import express from 'express';
import database from '../../database.js';
import { applyXpDelta, getStatsResponse } from '../services/statsService.js';

const router = express.Router();

const normalizeTodo = (t) => ({
  ...t,
  completed: !!t.completed,
  parentId: t.parent_id || t.parentid || null,
  description: t.description || '',
  createdAt: t.created_at || t.createdat || null,
  doneAt: t.done_at || t.doneat || null
});

// GET /
router.get('/', async (req, res) => {
  try {
    const todos = await database.all("SELECT * FROM todos ORDER BY created_at DESC");
    res.json(todos.map(normalizeTodo));
  } catch (err) {
    console.error("Error in GET /api/todos:", err);
    res.status(500).json({ error: "Erro interno ao carregar tarefas." });
  }
});

// POST /
router.post('/', async (req, res) => {
  const { title, label, sphere, xp, parentId, description } = req.body;
  if (!title || !label || !sphere) {
    return res.status(400).json({ error: "Parâmetros título, etiqueta e esfera são obrigatórios." });
  }

  try {
    const todoId = `todo-${Date.now()}`;
    const todoXp = parseInt(xp, 10) || 10;
    const createdAt = new Date().toISOString();
    const finalParentId = parentId || null;
    const finalDesc = description || '';
    
    await database.run(
      "INSERT INTO todos (id, title, label, sphere, xp, completed, parent_id, description, created_at, done_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, NULL)",
      [todoId, title, label, sphere, todoXp, finalParentId, finalDesc, createdAt]
    );

    const todos = await database.all("SELECT * FROM todos ORDER BY created_at DESC");
    res.json({ success: true, todos: todos.map(normalizeTodo) });
  } catch (err) {
    console.error("Error in POST /api/todos:", err);
    res.status(500).json({ error: "Erro interno ao adicionar tarefa." });
  }
});

// POST /toggle-complete
router.post('/toggle-complete', async (req, res) => {
  const { todoId } = req.body;
  if (!todoId) {
    return res.status(400).json({ error: "todoId é obrigatório." });
  }

  try {
    const todo = await database.get("SELECT * FROM todos WHERE id = ?", [todoId]);
    if (!todo) {
      return res.status(404).json({ error: "Tarefa não encontrada." });
    }

    const newCompletedStatus = todo.completed ? 0 : 1;
    const doneAt = newCompletedStatus ? new Date().toISOString() : null;
    const dateToday = new Date().toISOString().split('T')[0];

    // 1. Update completed state in DB
    await database.run(
      "UPDATE todos SET completed = ?, done_at = ? WHERE id = ?",
      [newCompletedStatus, doneAt, todoId]
    );

    // 2. Add or remove XP and update history
    if (newCompletedStatus) {
      await applyXpDelta(todo.sphere, todo.xp, {
        action: 'insert',
        item: {
          date: dateToday,
          taskId: todoId,
          title: todo.title,
          sphere: todo.sphere,
          xp: todo.xp,
          description: `Tarefa concluída: [${todo.label}] ${todo.title}`,
          timestamp: doneAt
        }
      });
    } else {
      await applyXpDelta(todo.sphere, -todo.xp, {
        action: 'delete',
        taskId: todoId
      });
    }

    const [stats, todosList] = await Promise.all([
      getStatsResponse(),
      database.all("SELECT * FROM todos ORDER BY created_at DESC")
    ]);

    res.json({
      success: true,
      todos: todosList.map(normalizeTodo),
      stats
    });
  } catch (err) {
    console.error("Error in POST /api/todos/toggle-complete:", err);
    res.status(500).json({ error: "Erro interno ao alternar conclusão da tarefa." });
  }
});

// POST /update
router.post('/update', async (req, res) => {
  const { todoId, title, label, sphere, xp, parentId, description } = req.body;
  if (!todoId) {
    return res.status(400).json({ error: "todoId é obrigatório." });
  }

  try {
    const todo = await database.get("SELECT * FROM todos WHERE id = ?", [todoId]);
    if (!todo) {
      return res.status(404).json({ error: "Tarefa não encontrada." });
    }

    const finalTitle = title !== undefined ? title : todo.title;
    const finalLabel = label !== undefined ? label : todo.label;
    const finalSphere = sphere !== undefined ? sphere : todo.sphere;
    const finalXp = xp !== undefined ? parseInt(xp, 10) : todo.xp;
    const finalParent = parentId !== undefined ? parentId : (todo.parent_id || todo.parentid || null);
    const finalDesc = description !== undefined ? description : (todo.description || '');

    await database.run(
      "UPDATE todos SET title = ?, label = ?, sphere = ?, xp = ?, parent_id = ?, description = ? WHERE id = ?",
      [finalTitle, finalLabel, finalSphere, finalXp, finalParent, finalDesc, todoId]
    );

    const todosList = await database.all("SELECT * FROM todos ORDER BY created_at DESC");
    res.json({
      success: true,
      todos: todosList.map(normalizeTodo)
    });
  } catch (err) {
    console.error("Error in POST /api/todos/update:", err);
    res.status(500).json({ error: "Erro interno ao atualizar tarefa." });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id é obrigatório." });
  }

  try {
    const todo = await database.get("SELECT * FROM todos WHERE id = ?", [id]);
    if (!todo) {
      return res.status(404).json({ error: "Tarefa não encontrada." });
    }

    await database.run("DELETE FROM todos WHERE id = ?", [id]);

    if (todo.completed) {
      // Se estava concluída, remove o XP correspondente
      await applyXpDelta(todo.sphere, -todo.xp, { action: 'delete', taskId: id });
    }

    const [stats, todosList] = await Promise.all([
      getStatsResponse(),
      database.all("SELECT * FROM todos ORDER BY created_at DESC")
    ]);

    res.json({
      success: true,
      todos: todosList.map(normalizeTodo),
      stats
    });
  } catch (err) {
    console.error("Error in DELETE /api/todos:", err);
    res.status(500).json({ error: "Erro interno ao excluir tarefa." });
  }
});

export default router;
