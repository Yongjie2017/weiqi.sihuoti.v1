const express = require('express');
const path = require('path');
const http = require('http');
const problemRoutes = require('./routes/problemRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { setupWebSocket } = require('./ws/GameSocket');
const aiService = require('./services/AiService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../web')));

app.use('/api/problems', problemRoutes);
app.use('/api/games', gameRoutes);

app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    aiAvailable: aiService.isAvailable(),
  });
});

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`AI engine available: ${aiService.isAvailable()}`);
});

process.on('SIGINT', async () => {
  await aiService.shutdown();
  process.exit(0);
});
