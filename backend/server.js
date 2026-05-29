import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAndMigrate } from './migrate.js';

// Import routers
import statsRoute from './src/routes/statsRoute.js';
import scheduleRoute from './src/routes/scheduleRoute.js';
import goalsRoute from './src/routes/goalsRoute.js';
import physicalRoute from './src/routes/physicalRoute.js';
import financialRoute from './src/routes/financialRoute.js';
import booksRoute from './src/routes/booksRoute.js';
import configRoute from './src/routes/configRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

// Run database schema check and migrations on startup
try {
  await checkAndMigrate();
} catch (e) {
  console.error("Migration failed at startup:", e);
}

// Register modular Express routers
app.use('/api/stats', statsRoute);
app.use('/api/schedule', scheduleRoute);
app.use('/api/user-goals', goalsRoute);
app.use('/api/physical-setup', physicalRoute);
app.use('/api/financial-setup', financialRoute);
app.use('/api/books', booksRoute);
app.use('/api', configRoute); // Mounts /api/ai-config, /api/calendar-xp, /api/history

// Serve frontend static assets from public folder
const publicDir = path.resolve(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Start Server
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`Backend server running securely on http://${HOST}:${PORT}`);
});
