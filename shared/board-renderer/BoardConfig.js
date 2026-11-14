/**
 * BoardConfig.js - 棋盘样式配置
 * 纯 JS 实现，无平台依赖。
 */

const DEFAULT_CONFIG = {
  cellSize: 30,
  padding: 30,
  boardColor: '#DCB35C',
  lineColor: '#3D2B1F',
  starColor: '#1A1A1A',
  blackStoneColor: '#1A1A1A',
  whiteStoneColor: '#F5F5F0',
  lastMoveColor: '#E74C3C',
  coordTextColor: '#666666',
  stoneRadiusRatio: 0.46,
  lineWidth: 1,
  borderWidth: 2,
  showCoordinates: true,
  starPoints: {
    19: [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]],
    13: [[3,3],[3,9],[6,6],[9,3],[9,9]],
    9: [[2,2],[2,6],[4,4],[6,2],[6,6]],
  },
};

function getStarPoints(boardSize) {
  return DEFAULT_CONFIG.starPoints[boardSize] || [];
}

function createConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}

module.exports = { DEFAULT_CONFIG, getStarPoints, createConfig };
