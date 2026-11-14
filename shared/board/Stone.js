/**
 * Stone.js - 棋子定义
 * 纯 JS 实现，无平台依赖。
 */

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

/**
 * 颜色名称与数值互转
 */
function toString(color) {
  switch (color) {
    case BLACK: return 'B';
    case WHITE: return 'W';
    default: return 'E';
  }
}

function fromString(str) {
  switch (str) {
    case 'B': return BLACK;
    case 'W': return WHITE;
    default: return EMPTY;
  }
}

/**
 * 返回对手颜色
 */
function opponent(color) {
  if (color === BLACK) return WHITE;
  if (color === WHITE) return BLACK;
  return EMPTY;
}

module.exports = { EMPTY, BLACK, WHITE, toString, fromString, opponent };
