/**
 * Capture.js - 提子逻辑
 * 纯 JS 实现，无平台依赖。
 */

const { EMPTY, BLACK, WHITE } = require('../board/Stone');

/**
 * 使用 Flood-Fill 找到与 (x,y) 同色相连的棋串
 * @param {Board} board
 * @param {number} x
 * @param {number} y
 * @returns {{ stones: [{x,y}], liberties: Set<string> }}
 */
function findGroup(board, x, y) {
  const color = board.get(x, y);
  if (color === EMPTY || color === -1) return { stones: [], liberties: new Set() };

  const visited = new Set();
  const stones = [];
  const liberties = new Set();
  const queue = [{ x, y }];

  while (queue.length > 0) {
    const pos = queue.shift();
    const key = `${pos.x},${pos.y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (board.get(pos.x, pos.y) === color) {
      stones.push(pos);
      for (const n of board.neighbors(pos.x, pos.y)) {
        const nKey = `${n.x},${n.y}`;
        const nColor = board.get(n.x, n.y);
        if (nColor === EMPTY) {
          liberties.add(nKey);
        } else if (nColor === color && !visited.has(nKey)) {
          queue.push(n);
        }
      }
    }
  }

  return { stones, liberties };
}

/**
 * 计算棋串的气数
 * @param {Board} board
 * @param {{ stones: [{x,y}] }} group
 * @returns {number}
 */
function countLiberties(board, group) {
  const liberties = new Set();
  for (const s of group.stones) {
    for (const n of board.neighbors(s.x, s.y)) {
      if (board.get(n.x, n.y) === EMPTY) {
        liberties.add(`${n.x},${n.y}`);
      }
    }
  }
  return liberties.size;
}

/**
 * 找到落子后需要提除的对方棋串
 * @param {Board} board - 已临时放上棋子的棋盘
 * @param {number} x - 落子 x
 * @param {number} y - 落子 y
 * @param {number} color - 落子颜色
 * @returns {Array<{x,y}>} 需要提除的棋子列表
 */
function findCapturedStones(board, x, y, color) {
  const opponentColor = color === BLACK ? WHITE : BLACK;
  const captured = [];
  const checked = new Set();

  for (const n of board.neighbors(x, y)) {
    const key = `${n.x},${n.y}`;
    if (checked.has(key)) continue;
    if (board.get(n.x, n.y) !== opponentColor) continue;

    const group = findGroup(board, n.x, n.y);
    for (const s of group.stones) checked.add(`${s.x},${s.y}`);

    if (group.liberties.size === 0) {
      for (const s of group.stones) {
        captured.push({ x: s.x, y: s.y });
      }
    }
  }

  return captured;
}

module.exports = { findGroup, countLiberties, findCapturedStones };
