const { WebSocketServer } = require('ws');
const gameService = require('../services/GameService');
const problemService = require('../services/ProblemService');
const aiService = require('../services/AiService');

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch (e) { return; }

      if (msg.type === 'move') {
        const result = gameService.makeMove(msg.gameId, msg.x, msg.y);
        if (result.error) { ws.send(JSON.stringify({ type: 'error', message: result.error })); return; }
        ws.send(JSON.stringify({ type: 'move_result', ...result }));

        if (!result.solved && result.currentTurn !== undefined) {
          const game = gameService.getGame(msg.gameId);
          if (game && game.mode === 'play') {
            const aiResult = await gameService.makeAiMove(msg.gameId, (bs, c) => aiService.playMove(bs, c));
            if (aiResult.valid) {
              ws.send(JSON.stringify({ type: 'ai_move', ...aiResult }));
            } else if (aiResult.pass) {
              ws.send(JSON.stringify({ type: 'ai_pass' }));
            }
          }
        }
      } else if (msg.type === 'undo') {
        const result = gameService.undo(msg.gameId);
        ws.send(JSON.stringify({ type: 'undo_result', ...result }));
      } else if (msg.type === 'reset') {
        const result = gameService.reset(msg.gameId);
        ws.send(JSON.stringify({ type: 'reset_result', ...result }));
      }
    });

    ws.on('close', () => { console.log('WebSocket client disconnected'); });
  });

  return wss;
}

module.exports = { setupWebSocket };
