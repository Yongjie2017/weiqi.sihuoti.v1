/**
 * GameService.js - 棋局状态管理
 */

const { opponent } = require('../../shared/board/Stone');
const { applyMove, undoMove } = require('../../shared/go-rules/Rules');
const { sgfToBoard } = require('../../shared/sgf/SgfConverter');
const { SolutionTree } = require('../../shared/solver/SolutionTree');
const { SolutionChecker, CheckResult } = require('../../shared/solver/SolutionChecker');

let nextGameId = 1;

class GameService {
  constructor() {
    this.games = new Map();
  }

  createGame(problem, mode = 'study') {
    const { board, gameTree, firstPlayer } = sgfToBoard(problem.sgf);
    const solutionTree = SolutionTree.fromGameTree(gameTree);
    const checker = new SolutionChecker(solutionTree);
    const gameId = `game-${nextGameId++}`;
    const gameState = {
      id: gameId, problemId: problem.id, problemTitle: problem.title,
      mode, board, initialBoardSnapshot: board.clone(),
      gameTree, solutionTree, checker, firstPlayer,
      currentTurn: firstPlayer, moveHistory: [], lastMove: null,
      solved: false, status: 'active', createdAt: Date.now(),
    };
    this.games.set(gameId, gameState);
    return gameState;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  makeMove(gameId, x, y) {
    const game = this.games.get(gameId);
    if (!game) return { error: '对局不存在' };
    if (game.solved) return { error: '已解题完成' };
    const color = game.currentTurn;
    const moveResult = applyMove(game.board, x, y, color);
    if (!moveResult.valid) return { error: moveResult.reason };
    game.lastMove = { x, y, color };
    game.moveHistory.push({ x, y, color });
    const checkResult = game.checker.checkMove(x, y, color, game.mode === 'study');
    if (checkResult.result === CheckResult.CORRECT) {
      game.solved = true;
      game.status = 'solved';
    }
    game.currentTurn = opponent(game.currentTurn);
    return {
      valid: true, board: game.board.toJSON(), lastMove: game.lastMove,
      capturedStones: moveResult.capturedStones, checkResult: checkResult.result,
      comment: checkResult.comment, solved: game.solved, currentTurn: game.currentTurn,
    };
  }

  async makeAiMove(gameId, aiPlayMoveFn) {
    const game = this.games.get(gameId);
    if (!game) return { error: '对局不存在' };
    if (game.solved) return { error: '已解题完成' };
    const color = game.currentTurn;
    try {
      const aiMove = await aiPlayMoveFn(game.board.toJSON(), color);
      if (!aiMove || aiMove.pass) {
        game.currentTurn = opponent(game.currentTurn);
        return { pass: true, currentTurn: game.currentTurn };
      }
      const moveResult = applyMove(game.board, aiMove.x, aiMove.y, color);
      if (!moveResult.valid) {
        game.currentTurn = opponent(game.currentTurn);
        return { pass: true, currentTurn: game.currentTurn };
      }
      game.lastMove = { x: aiMove.x, y: aiMove.y, color };
      game.moveHistory.push({ x: aiMove.x, y: aiMove.y, color });
      const checkResult = game.checker.checkMove(aiMove.x, aiMove.y, color, game.mode === 'study');
      game.currentTurn = opponent(game.currentTurn);
      return {
        valid: true, aiMove: { x: aiMove.x, y: aiMove.y, color },
        board: game.board.toJSON(), lastMove: game.lastMove,
        capturedStones: moveResult.capturedStones, checkResult: checkResult.result,
        comment: checkResult.comment, currentTurn: game.currentTurn,
      };
    } catch (e) {
      console.error('AI 落子失败:', e.message);
      return { error: 'AI 计算失败: ' + e.message };
    }
  }

  undo(gameId) {
    const game = this.games.get(gameId);
    if (!game) return { error: '对局不存在' };
    if (game.moveHistory.length === 0) return { error: '没有可悔的棋' };
    const stepsToUndo = game.mode === 'play' ? Math.min(2, game.moveHistory.length) : 1;
    for (let i = 0; i < stepsToUndo; i++) {
      undoMove(game.board);
      game.moveHistory.pop();
    }
    game.checker.reset();
    for (const move of game.moveHistory) {
      game.checker.checkMove(move.x, move.y, move.color, game.mode === 'study');
    }
    game.solved = false;
    game.status = 'active';
    game.lastMove = game.moveHistory.length > 0 ? game.moveHistory[game.moveHistory.length - 1] : null;
    game.currentTurn = game.moveHistory.length > 0
      ? opponent(game.moveHistory[game.moveHistory.length - 1].color) : game.firstPlayer;
    return {
      valid: true, board: game.board.toJSON(),
      lastMove: game.lastMove, currentTurn: game.currentTurn,
    };
  }

  reset(gameId) {
    const game = this.games.get(gameId);
    if (!game) return { error: '对局不存在' };
    game.board = game.initialBoardSnapshot.clone();
    game.moveHistory = [];
    game.lastMove = null;
    game.currentTurn = game.firstPlayer;
    game.solved = false;
    game.status = 'active';
    game.checker.reset();
    return {
      valid: true, board: game.board.toJSON(),
      lastMove: null, currentTurn: game.currentTurn,
    };
  }

  setMode(gameId, mode) {
    const game = this.games.get(gameId);
    if (!game) return { error: '对局不存在' };
    game.mode = mode;
    return { valid: true, mode: game.mode };
  }

  getHint(gameId) {
    const game = this.games.get(gameId);
    if (!game) return { error: '对局不存在' };
    const hints = game.checker.getHintMoves();
    if (hints.length === 0) return { hints: [] };
    return {
      hints: hints.map(h => ({
        move: h.move, comment: h.comment,
        isCorrect: h.isCorrect, name: h.name,
      })),
    };
  }

  toPublicState(game) {
    return {
      id: game.id,
      problemId: game.problemId,
      problemTitle: game.problemTitle,
      mode: game.mode,
      board: game.board.toJSON(),
      lastMove: game.lastMove,
      currentTurn: game.currentTurn,
      firstPlayer: game.firstPlayer,
      solved: game.solved,
      status: game.status,
      moveCount: game.moveHistory.length,
      comment: game.gameTree.comment,
      labels: game.gameTree.labels,
    };
  }
}

module.exports = new GameService();
