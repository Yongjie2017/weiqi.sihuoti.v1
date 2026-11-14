const kataGoManager = require('../ai/KataGoManager');
const { toString } = require('../../shared/board/Stone');

class AiService {
  async playMove(boardState, color) {
    const engine = kataGoManager.getEngine();
    if (!engine) return { pass: true, reason: 'AI 引擎不可用' };
    try {
      await engine.syncBoard(boardState);
      const move = await engine.genmove(toString(color));
      if (move.pass) return { pass: true };
      return { x: move.x, y: move.y };
    } catch (e) {
      console.error('AI 计算失败:', e.message);
      return { pass: true, reason: e.message };
    }
  }
  isAvailable() { return kataGoManager.isAvailable(); }
  async shutdown() { await kataGoManager.shutdown(); }
}

module.exports = new AiService();
