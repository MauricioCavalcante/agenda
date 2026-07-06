/**
 * Serviço de Gamificação e Estatísticas
 * 
 * Responsável por gerenciar o progresso do usuário, níveis das Esferas da Vida
 * (Profissional, Pessoal, Físico, etc.) e o Nível Geral do Personagem (Usuário).
 */
import database from '../../database.js';

export function getTitleForLevel(level) {
  if (level >= 96) return "Supremo";
  if (level >= 81) return "Lenda";
  if (level >= 66) return "Mestre";
  if (level >= 46) return "Perito";
  if (level >= 26) return "Iniciado";
  if (level >= 11) return "Aprendiz";
  return "Iniciante";
}

export async function getStatsResponse() {
  const [statsRow, spheresRows] = await Promise.all([
    database.get("SELECT character_level FROM stats"),
    database.all("SELECT name, level, xp FROM spheres")
  ]);

  const spheres = {};
  spheresRows.forEach(s => {
    spheres[s.name] = {
      level: s.level,
      xp: s.xp,
      title: getTitleForLevel(s.level)
    };
  });

  const charLevel = statsRow?.character_level || 1;

  return {
    level: charLevel,
    spheres,
    characterLevel: charLevel,
    title: getTitleForLevel(charLevel)
  };
}

/**
 * Aplica ganho ou perda de XP em uma Esfera específica.
 * Calcula automaticamente "Level Up" e "Level Down" da Esfera e atualiza
 * o histórico de atividades em paralelo para otimizar performance.
 */
export async function applyXpDelta(sphereName, xpDelta, historyOp = null) {
  const sphere = await database.get("SELECT level, xp FROM spheres WHERE name = ?", [sphereName]);

  let newXp = (Number(sphere?.xp) || 0) + xpDelta;
  let newLevel = sphere?.level || 1;

  if (xpDelta > 0) {
    // Level up logic
    while (newLevel < 100 && newXp >= newLevel * 100) {
      newXp -= newLevel * 100;
      newLevel++;
    }
  } else {
    // Level down logic: unwind level by level until XP >= 0
    while (newLevel > 1 && newXp < 0) {
      newLevel--;
      newXp += newLevel * 100;
    }
    newXp = Math.max(0, newXp);
  }

  // 2. Persist sphere + character level + optional history change in parallel
  const [spheresForCharLevel] = await Promise.all([
    database.run("UPDATE spheres SET level = ?, xp = ? WHERE name = ?", [newLevel, newXp, sphereName])
      .then(() => database.all("SELECT level FROM spheres")),
    historyOp?.action === 'insert'
      ? database.run(
          "INSERT INTO history (date, taskId, title, sphere, xpEarned, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [historyOp.item.date, historyOp.item.taskId, historyOp.item.title, historyOp.item.sphere, historyOp.item.xp, historyOp.item.description, historyOp.item.timestamp]
        )
      : historyOp?.action === 'delete'
        ? database.run("DELETE FROM history WHERE taskId = ?", [historyOp.taskId])
        : Promise.resolve()
  ]);

  // 3. Compute and persist character level
  const charLevel = Math.floor(
    spheresForCharLevel.reduce((sum, s) => sum + s.level, 0) / (spheresForCharLevel.length || 1)
  );
  await database.run("UPDATE stats SET character_level = ?", [charLevel]);

  return { newLevel, newXp, charLevel };
}

/**
 * Recalcula todas as estatísticas a partir do zero baseado no histórico de tarefas e livros.
 * Utilizado apenas como reparo ou migração, pois recria todo o log de evolução de forma custosa.
 */
export async function recalculateStats() {
  try {
    const [initialSpheres, completedTasks, completedBooks] = await Promise.all([
      database.all("SELECT name, level, xp FROM spheres"),
      database.all("SELECT id, date, title, sphere, xp, description, doneAt FROM schedules WHERE completed = 1"),
      database.all("SELECT id, title, author, sphere, xp, doneAt FROM books WHERE completed = 1")
    ]);

    const sphereMap = {};
    for (const s of initialSpheres) {
      sphereMap[s.name] = { level: 1, xp: 0 };
    }

    const allItems = [
      ...completedTasks.map(t => ({
        id: t.id,
        date: t.date,
        title: t.title,
        sphere: t.sphere,
        xp: Number(t.xp) || 0,
        description: t.description || '',
        doneAt: t.doneAt || new Date().toISOString(),
      })),
      ...completedBooks.map(b => ({
        id: `book-${b.id}`,
        date: b.doneAt ? b.doneAt.split('T')[0] : new Date().toISOString().split('T')[0],
        title: `📖 [Livro] ${b.title}`,
        sphere: b.sphere,
        xp: Number(b.xp) || 0,
        description: `Leitura concluída: ${b.title} por ${b.author || 'Autor desconhecido'}.`,
        doneAt: b.doneAt || new Date().toISOString(),
      }))
    ];

    allItems.sort((a, b) => new Date(a.doneAt) - new Date(b.doneAt));

    for (const item of allItems) {
      if (!sphereMap[item.sphere]) {
        sphereMap[item.sphere] = { level: 1, xp: 0 };
      }
      const s = sphereMap[item.sphere];
      s.xp += item.xp;
      while (s.level < 100 && s.xp >= s.level * 100) {
        s.xp -= s.level * 100;
        s.level++;
      }
    }

    const totalLevel = Object.values(sphereMap).reduce((sum, s) => sum + s.level, 0);
    const charLevel = Math.floor(totalLevel / (Object.keys(sphereMap).length || 1));

    await database.run("BEGIN TRANSACTION");
    try {
      await database.run("UPDATE stats SET character_level = 1");
      await database.run("UPDATE spheres SET level = 1, xp = 0");
      await database.run("DELETE FROM history");

      for (const [name, val] of Object.entries(sphereMap)) {
        await database.run("UPDATE spheres SET level = ?, xp = ? WHERE name = ?", [val.level, val.xp, name]);
      }

      if (allItems.length > 0) {
        const placeholders = allItems.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
        const values = allItems.flatMap(item => [
          item.date, item.id, item.title, item.sphere, item.xp, item.description, item.doneAt
        ]);
        await database.run(
          `INSERT INTO history (date, taskId, title, sphere, xpEarned, description, timestamp) VALUES ${placeholders}`,
          values
        );
      }

      await database.run("UPDATE stats SET character_level = ?", [charLevel]);
      await database.run("COMMIT");
    } catch (err) {
      await database.run("ROLLBACK");
      throw err;
    }
  } catch (err) {
    console.error("Recalculate stats failed:", err);
    throw err;
  }
}
