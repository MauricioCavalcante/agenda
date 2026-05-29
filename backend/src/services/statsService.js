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
  const statsRow = await database.get("SELECT character_level FROM stats WHERE id = 1");
  const spheresRows = await database.all("SELECT name, level, xp FROM spheres");
  
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

export async function recalculateStats() {
  await database.run("BEGIN TRANSACTION");
  try {
    // Reset stats & spheres
    await database.run("UPDATE stats SET character_level = 1 WHERE id = 1");
    await database.run("UPDATE spheres SET level = 1, xp = 0");

    // Clear history table
    await database.run("DELETE FROM history");

    // Fetch completed tasks and completed books
    const completedTasks = await database.all("SELECT * FROM schedules WHERE completed = 1");
    const completedBooks = await database.all("SELECT * FROM books WHERE completed = 1");

    const allItems = [
      ...completedTasks.map(t => ({
        id: t.id,
        date: t.date,
        title: t.title,
        sphere: t.sphere,
        xp: t.xp,
        description: t.description || '',
        doneAt: t.doneAt || new Date().toISOString(),
        isBook: false
      })),
      ...completedBooks.map(b => ({
        id: `book-${b.id}`,
        date: b.doneAt ? b.doneAt.split('T')[0] : new Date().toISOString().split('T')[0],
        title: `📖 [Livro] ${b.title}`,
        sphere: b.sphere,
        xp: b.xp || 0,
        description: `Leitura concluída: ${b.title} por ${b.author || 'Autor desconhecido'}.`,
        doneAt: b.doneAt || new Date().toISOString(),
        isBook: true
      }))
    ];

    // Sort chronologically by doneAt
    allItems.sort((a, b) => new Date(a.doneAt) - new Date(b.doneAt));

    for (const item of allItems) {
      // Apply XP to sphere
      const sphere = await database.get("SELECT * FROM spheres WHERE name = ?", [item.sphere]);
      if (sphere) {
        let newXp = sphere.xp + item.xp;
        let newLevel = sphere.level;
        while (newLevel < 100 && newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
        }
        await database.run("UPDATE spheres SET level = ?, xp = ? WHERE name = ?", [newLevel, newXp, item.sphere]);
      }
      
      // Insert to history
      await database.run("INSERT INTO history (date, taskId, title, sphere, xpEarned, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)", [
        item.date, item.id, item.title, item.sphere, item.xp, item.description, item.doneAt
      ]);
    }

    // Re-calculate character level
    const spheres = await database.all("SELECT level FROM spheres");
    const totalSpheresLevel = spheres.reduce((sum, s) => sum + s.level, 0);
    const charLevel = Math.floor(totalSpheresLevel / (spheres.length || 1));
    await database.run("UPDATE stats SET character_level = ? WHERE id = 1", [charLevel]);

    await database.run("COMMIT");
  } catch (err) {
    await database.run("ROLLBACK");
    console.error("Recalculate stats failed:", err);
    throw err;
  }
}
