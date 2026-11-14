/**
 * Rules.js - 围棋规则核心引擎
 * 纯 JS 实现，无平台依赖。
 * 功能：落子合法性检查、提子、禁入点（自杀）、劫
 */

const { EMPTY, BLACK, WHITE, opponent } = require('../board/Stone');
const { findGroup, countLiberties, findCapturedStones } = require('./Capture');

// 落子结果状态
const MoveResult = {
  VALID: 'valid',
  INVALID: 'invalid',
};

/**
 * 尝试在棋盘上落子，检查所有规则
 * @param {Board} board - 当前棋盘
 * @param {number} x
 * @param {number} y
 * @param {number} color - BLACK 或 WHITE
 * @returns {{ valid: boolean, reason: string, capturedStones: Array, newKoPoint: {x,y}|null }}
 *   返回结果包含是否合法、原因、被提子列表、新的劫禁入点
 *   注意：本函数不修改棋盘，仅做检查。调用方根据结果决定是否应用。
 */
function tryMove(board, x, y, color) {
  // 1. 边界检查
  if (!board.inBounds(x, y)) {
    return { valid: false, reason: '坐标超出棋盘范围', capturedStones: [], newKoPoint: null };
  }

  // 2. 该点必须为空
  if (board.get(x, y) !== EMPTY) {
    return { valid: false, reason: '该点已有棋子', capturedStones: [], newKoPoint: null };
  }

  // 3. 劫禁入点检查
  if (board.koPoint && board.koPoint.x === x && board.koPoint.y === y) {
    return { valid: false, reason: '劫禁入点', capturedStones: [], newKoPoint: null };
  }

  // 4. 临时放置棋子，检查提子和自杀
  const tempBoard = board.clone();
  tempBoard._placeRaw(x, y, color);

  // 5. 查找并提除对方无气棋串
  const capturedStones = findCapturedStones(tempBoard, x, y, color);
  for (const s of capturedStones) {
    tempBoard._removeRaw(s.x, s.y);
  }

  // 6. 自杀检查：落子后己方棋串必须有气
  const selfGroup = findGroup(tempBoard, x, y);
  if (selfGroup.liberties.size === 0) {
    return { valid: false, reason: '禁入点（自杀）', capturedStones: [], newKoPoint: null };
  }

  // 7. 劫的判定：如果只提了一颗子，且新落的子只有一口气，且这颗子本身是单独一颗
  let newKoPoint = null;
  if (capturedStones.length === 1 && selfGroup.stones.length === 1 && selfGroup.liberties.size === 1) {
    // 被提的子位置就是新的劫禁入点
    newKoPoint = { x: capturedStones[0].x, y: capturedStones[0].y };
  }

  return {
    valid: true,
    reason: 'ok',
    capturedStones,
    newKoPoint,
  };
}

/**
 * 在棋盘上应用落子（修改棋盘状态）
 * 先调用 tryMove 检查合法性，合法则实际执行
 * @param {Board} board
 * @param {number} x
 * @param {number} y
 * @param {number} color
 * @returns {{ valid: boolean, reason: string, capturedStones: Array }}
 */
function applyMove(board, x, y, color) {
  const result = tryMove(board, x, y, color);
  if (!result.valid) return result;

  board._placeRaw(x, y, color);
  for (const s of result.capturedStones) {
    board._removeRaw(s.x, s.y);
  }
  board.captures[color] += result.capturedStones.length;
  board.koPoint = result.newKoPoint;

  board.history.push({
    x, y, color,
    captured: result.capturedStones.map(s => ({ ...s })),
  });

  return result;
}

/**
 * 悔棋：撤销最后一步
 * @param {Board} board
 * @returns {boolean} 是否成功
 */
function undoMove(board) {
  if (board.history.length === 0) return false;

  const last = board.history.pop();
  board._removeRaw(last.x, last.y);

  // 恢复被提的棋子
  const opponentColor = opponent(last.color);
  for (const s of last.captured) {
    board._placeRaw(s.x, s.y, opponentColor);
  }
  board.captures[last.color] -= last.captured.length;

  // 劫点恢复：简化处理，设为 null
  board.koPoint = null;

  return true;
}

/**
 * 检查某点是否为合法落子点（不实际落子）
 * @param {Board} board
 * @param {number} x
 * @param {number} y
 * @param {number} color
 * @returns {boolean}
 */
function isLegal(board, x, y, color) {
  return tryMove(board, x, y, color).valid;
}

module.exports = { tryMove, applyMove, undoMove, isLegal, MoveResult };
