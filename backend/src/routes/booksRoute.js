/**
 * Biblioteca e Leituras
 * 
 * Responsável por gerenciar os livros da Esfera Pessoal ou Educacional.
 * Interage com a Inteligência Artificial para calcular o peso e XP de cada livro adicionado.
 */
import express from 'express';
import database from '../../database.js';
import { calculateBookXp } from '../services/aiService.js';
import { getStatsResponse, recalculateStats, applyXpDelta } from '../services/statsService.js';
import { decryptKey } from '../utils/crypto.js';

const router = express.Router();

/**
 * GET /
 * Lista todos os livros cadastrados na biblioteca local.
 */
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

/**
 * POST /
 * Insere um novo livro. Durante a inserção, invoca a IA para julgar
 * o XP adequado baseado no tema, profundidade e tamanho do material.
 */
router.post('/', async (req, res) => {
  const { title, author, sphere, pages, goal, depth } = req.body;
  if (!title || !sphere) {
    return res.status(400).json({ error: "Falta título ou esfera do livro" });
  }

  try {
    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    const dbApiKey = config.apiKey || config.apikey;
    if (!config || (!dbApiKey && config.provider !== 'ollama')) {
      return res.status(400).json({ error: "Configuração de IA incompleta. Por favor, adicione sua Chave de API nas Configurações." });
    }
    config.apiKey = decryptKey(dbApiKey);

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

/**
 * POST /toggle
 * Alterna o status de conclusão do livro. Ao marcar como concluído,
 * aplica o ganho de XP e salva no histórico geral. Reverte o XP se desmarcado.
 */
router.post('/toggle', async (req, res) => {
  const { id, completed } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Falta o ID do livro" });
  }

  try {
    const book = await database.get("SELECT sphere, xp, title, author FROM books WHERE id = ?", [id]);
    if (!book) {
      return res.status(404).json({ error: "Livro não encontrado" });
    }

    const doneAt = completed ? new Date().toISOString() : null;
    await database.run(
      "UPDATE books SET completed = ?, doneAt = ? WHERE id = ?",
      [completed ? 1 : 0, doneAt, id]
    );

    if (completed) {
      await applyXpDelta(book.sphere, book.xp, {
        action: 'insert',
        item: {
          date: doneAt.split('T')[0],
          taskId: `book-${id}`,
          title: `📖 [Livro] ${book.title}`,
          sphere: book.sphere,
          xp: book.xp,
          description: `Leitura concluída: ${book.title} por ${book.author || 'Autor desconhecido'}.`,
          timestamp: doneAt
        }
      });
    } else {
      await applyXpDelta(book.sphere, -book.xp, { action: 'delete', taskId: `book-${id}` });
    }

    const [updatedBook, stats] = await Promise.all([
      database.get("SELECT * FROM books WHERE id = ?", [id]),
      getStatsResponse()
    ]);

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

/**
 * DELETE /:id
 * Exclui permanentemente um livro e remove o XP correspondente caso
 * ele já estivesse concluído.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const book = await database.get("SELECT completed, sphere, xp FROM books WHERE id = ?", [id]);
    await database.run("DELETE FROM books WHERE id = ?", [id]);

    if (book?.completed) {
      await applyXpDelta(book.sphere, -book.xp, { action: 'delete', taskId: `book-${id}` });
    }

    const stats = await getStatsResponse();
    res.json({ success: true, message: "Livro removido com sucesso.", stats });
  } catch (err) {
    console.error("Error in DELETE /api/books/:id:", err);
    res.status(500).json({ error: "Erro interno ao excluir livro." });
  }
});

export default router;
