import fs from 'fs';

export function parseCronograma(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Cronograma file not found at ${filePath}. Using empty defaults.`);
      return { monday_thursday: [], tuesday: [], wednesday_friday: [], saturday: [] };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const defaultSchedule = {
      monday_thursday: [],
      tuesday: [],
      wednesday_friday: [],
      saturday: []
    };

    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.includes('Segunda e Quinta-Feira')) {
        currentSection = 'monday_thursday';
        continue;
      } else if (line.includes('Terça-Feira')) {
        currentSection = 'tuesday';
        continue;
      } else if (line.includes('Quarta e Sexta-Feira')) {
        currentSection = 'wednesday_friday';
        continue;
      } else if (line.includes('Sábado')) {
        currentSection = 'saturday';
        continue;
      } else if (line.includes('Resumo da sua Carga Semanal') || line.includes('Carga Semanal')) {
        currentSection = null;
        continue;
      }

      if (!currentSection) continue;

      const timeMatch = line.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*(?:\(([^)]+)\))?:\s*(.*)$/);
      if (timeMatch) {
        const [_, startTime, endTime, duration, rawTitle] = timeMatch;
        let title = rawTitle.trim();
        let sphere = 'Pessoal';
        let xp = 10;

        const titleLower = title.toLowerCase();
        if (titleLower.includes('clt') || titleLower.includes('hitss')) {
          sphere = 'Profissional';
          xp = 10;
        } else if (titleLower.includes('projeto') || titleLower.includes('iapostlab')) {
          sphere = 'Profissional';
          xp = 15;
        } else if (titleLower.includes('estudo') || titleLower.includes('graduação') || titleLower.includes('pós') || titleLower.includes('pos-') || titleLower.includes('mentoria')) {
          sphere = 'Educacional';
          xp = 15;
        } else if (titleLower.includes('leitura')) {
          sphere = 'Pessoal';
          xp = 10;
        } else if (titleLower.includes('exercício') || titleLower.includes('atividade física') || titleLower.includes('treino')) {
          sphere = 'Físico';
          xp = 15;
        } else if (titleLower.includes('livre') || titleLower.includes('buffer')) {
          sphere = 'Social';
          xp = 5;
        } else if (titleLower.includes('finança') || titleLower.includes('financeiro') || titleLower.includes('investimento') || titleLower.includes('orçamento')) {
          sphere = 'Financeiro';
          xp = 15;
        } else if (titleLower.includes('almoço') || titleLower.includes('almoco') || titleLower.includes('descanso')) {
          sphere = 'Pessoal';
          xp = 0;
        }

        if (duration) {
          let hours = 1.0;
          if (duration.includes('h') && duration.includes('m')) {
            const parts = duration.match(/(\d+)h\s*(\d+)m/);
            if (parts) hours = parseInt(parts[1]) + parseInt(parts[2]) / 60;
          } else if (duration.includes('h')) {
            const parts = duration.match(/(\d+(?:\.\d+)?)h/);
            if (parts) hours = parseFloat(parts[1]);
          } else if (duration.includes('m')) {
            const parts = duration.match(/(\d+)m/);
            if (parts) hours = parseInt(parts[1]) / 60;
          }
          xp = Math.max(5, Math.round(xp * hours));
          if (titleLower.includes('almoço') || titleLower.includes('almoco') || titleLower.includes('descanso')) {
            xp = 0;
          }
        }

        defaultSchedule[currentSection].push({
          startTime,
          endTime,
          duration: duration || '',
          title,
          sphere,
          xp
        });
      }
    }

    return defaultSchedule;
  } catch (error) {
    console.error("Error parsing cronograma.txt:", error);
    return { monday_thursday: [], tuesday: [], wednesday_friday: [], saturday: [] };
  }
}
