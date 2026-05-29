import express from 'express';
import database from '../../database.js';
import { calculateBookXp } from '../services/aiService.js';
import { getStatsResponse, recalculateStats } from '../services/statsService.js';

const router = express.Router();

// Get all books in the library
router.get('/', async (req, res) => {
  try {
    const books = await database.all("SELECT * FROM books ORDER BY title ASC");
    res.json(books.map(b => ({
      ...b,
      completed: !!b.completed
    })));
  } catch (err) {
    console.error("Error in GET /api/books:", err);
    res.status(500).json({ error: "Erro interno ao carregar livros da biblioteca." });
  }
});

// Add a book and calculate XP via AI
router.post('/', async (req, res) => {
  const { title, author, sphere, pages, goal, depth } = req.body;
  if (!title || !sphere) {
    return res.status(400).json({ error: "Falta título ou esfera do livro" });
  }

  try {
    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    if (!config || (!config.apiKey && config.provider !== 'ollama')) {
      return res.status(400).json({ error: "Configuração de IA incompleta. Por favor, adicione sua Chave de API nas Configurações." });
    }

    let xp = 50;
    let reasoning = "Cálculo padrão de XP.";
    try {
      const aiResult = await calculateBookXp(config, title, author, sphere, pages, goal, depth);
      if (typeof aiResult.xp === 'number') {
        xp = aiResult.xp;
      } else if (aiResult.xp) {
        xp = parseInt(aiResult.xp, 10) || 50;
      }
      reasoning = aiResult.reasoning || reasoning;
    } catch (parseErr) {
      console.warn("Could not calculate AI XP for book, using fallback:", parseErr);
    }

    const id = `book-${Date.now()}`;
    await database.run(
      "INSERT INTO books (id, title, author, sphere, pages, goal, depth, xp, xp_reason, completed, doneAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, null)",
      [id, title, author || '', sphere, pages ? Number(pages) : null, goal || '', depth || '', xp, reasoning]
    );

    const book = await database.get("SELECT * FROM books WHERE id = ?", [id]);
    res.json({
      success: true,
      book: {
        ...book,
        completed: !!book.completed
      }
    });
  } catch (err) {
    console.error("Error in POST /api/books:", err);
    res.status(500).json({ error: `Erro ao adicionar livro: ${err.message}` });
  }
});

// Toggle read/unread status
router.post('/toggle', async (req, res) => {
  const { id, completed } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Falta o ID do livro" });
  }

  try {
    const doneAt = completed ? new Date().toISOString() : null;
    await database.run(
      "UPDATE books SET completed = ?, doneAt = ? WHERE id = ?",
      [completed ? 1 : 0, doneAt, id]
    );

    // Recalculate stats and level
    await recalculateStats();

    const updatedBook = await database.get("SELECT * FROM books WHERE id = ?", [id]);
    const stats = await getStatsResponse();

    res.json({
      success: true,
      book: {
        ...updatedBook,
        completed: !!updatedBook.completed
      },
      stats
    });
  } catch (err) {
    console.error("Error in POST /api/books/toggle:", err);
    res.status(500).json({ error: "Erro interno ao atualizar status do livro." });
  }
});

// Delete a book
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    await database.run("DELETE FROM books WHERE id = ?", [id]);
    await recalculateStats();

    const stats = await getStatsResponse();
    res.json({ success: true, message: "Livro removido com sucesso.", stats });
  } catch (err) {
    console.error("Error in DELETE /api/books/:id:", err);
    res.status(500).json({ error: "Erro interno ao excluir livro." });
  }
});

export default router;
