const express = require('express');
const problemService = require('../services/ProblemService');
const gameService = require('../services/GameService');
const aiService = require('../services/AiService');
const router = express.Router();

router.post('/', (req, res) => {
  const { problemId, mode } = req.body;
  const problem = problemService.getProblem(problemId);
  if (!problem) return res.status(404).json({ error: 'not found' });
  const game = gameService.createGame(problem, mode || 'study');
  res.json(gameService.toPublicState(game));
});

router.get('/:id', (req, res) => {
  const game = gameService.getGame(req.params.id);
  if (!game) return res.status(404).json({ error: 'not found' });
  res.json(gameService.toPublicState(game));
});

router.post('/:id/move', async (req, res) => {
  const { x, y } = req.body;
  const result = gameService.makeMove(req.params.id, x, y);
  if (result.error) return res.status(400).json(result);
  if (!result.solved) {
    const game = gameService.getGame(req.params.id);
    if (game && game.mode === 'play') {
      const aiResult = await gameService.makeAiMove(req.params.id, (bs, c) => aiService.playMove(bs, c));
      if (aiResult.valid) {
        result.aiMove = aiResult.aiMove;
        result.board = aiResult.board;
        result.lastMove = aiResult.lastMove;
        result.checkResult = aiResult.checkResult;
        result.comment = aiResult.comment;
        result.currentTurn = aiResult.currentTurn;
      }
    }
  }
  res.json(result);
});

router.post('/:id/undo', (req, res) => {
  const result = gameService.undo(req.params.id);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

router.post('/:id/reset', (req, res) => {
  const result = gameService.reset(req.params.id);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

router.patch('/:id/mode', (req, res) => {
  const { mode } = req.body;
  const result = gameService.setMode(req.params.id, mode);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

router.get('/:id/hint', (req, res) => {
  const result = gameService.getHint(req.params.id);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

module.exports = router;
