/**
 * SgfConverter.js - SGF 与内部棋局互转
 * 纯 JS 实现，无平台依赖。
 */

const Board = require('../board/Board');
const { BLACK, WHITE, fromString } = require('../board/Stone');
const { SgfParser } = require('./SgfParser');

/**
 * 从 SGF 文本创建棋盘（仅初始局面）
 * @param {string} sgfText
 * @returns {{ board: Board, gameTree: object, firstPlayer: number }}
 */
function sgfToBoard(sgfText) {
  const parser = new SgfParser();
  const gameTree = parser.parseGame(sgfText);

  const boardSize = gameTree.metadata.boardSize || 19;
  const board = new Board(boardSize);
  board.setupPosition(gameTree.setup.blackStones, gameTree.setup.whiteStones);

  const firstPlayer = fromString(gameTree.setup.firstPlayer);

  return { board, gameTree, firstPlayer };
}

/**
 * 将正解树中的移动序列应用到棋盘（返回新棋盘）
 * @param {Board} initialBoard - 初始棋盘
 * @param {Array} moveNodes - 移动节点列表
 * @returns {Board}
 */
function applyMovesToBoard(initialBoard, moveNodes) {
  const { applyMove } = require('../go-rules/Rules');
  const board = initialBoard.clone();
  for (const node of moveNodes) {
    if (node.move && !node.move.pass) {
      const color = fromString(node.move.color);
      applyMove(board, node.move.x, node.move.y, color);
    }
  }
  return board;
}

module.exports = { sgfToBoard, applyMovesToBoard };
