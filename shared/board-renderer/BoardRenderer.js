/**
 * BoardRenderer.js - Canvas 棋盘渲染器
 * 平台无关：通过传入 Canvas 2D Context 来渲染。
 */

const { EMPTY, BLACK, WHITE } = require('../board/Stone');
const { getStarPoints, createConfig } = require('./BoardConfig');

class BoardRenderer {
  constructor(ctx, configOverrides = {}) {
    this.ctx = ctx;
    this.config = createConfig(configOverrides);
    this._boardSize = 19;
    this._region = null;
  }

  render(board, options = {}) {
    const { lastMove = null, labels = [], region = null } = options;
    const cfg = this.config;
    this._boardSize = board.size;
    const viewRegion = region || this._computeRegion(board);
    this._region = viewRegion;
    const cols = viewRegion.maxX - viewRegion.minX + 1;
    const rows = viewRegion.maxY - viewRegion.minY + 1;
    const totalWidth = cfg.padding * 2 + (cols - 1) * cfg.cellSize;
    const totalHeight = cfg.padding * 2 + (rows - 1) * cfg.cellSize;

    this.ctx.fillStyle = cfg.boardColor;
    this.ctx.fillRect(0, 0, totalWidth, totalHeight);
    if (cfg.showCoordinates) this._drawCoordinates(viewRegion, cols, rows);
    this._drawGrid(viewRegion, cols, rows);
    this._drawStarPoints(board.size, viewRegion);
    this._drawStones(board, viewRegion, lastMove);
    if (labels.length > 0) this._drawLabels(labels, viewRegion);
  }

  _computeRegion(board) {
    const bbox = board.getBoundingBox();
    if (!bbox) return { minX: 0, minY: 0, maxX: 8, maxY: 8 };
    const margin = 2;
    return {
      minX: Math.max(0, bbox.minX - margin),
      minY: Math.max(0, bbox.minY - margin),
      maxX: Math.min(board.size - 1, bbox.maxX + margin),
      maxY: Math.min(board.size - 1, bbox.maxY + margin),
    };
  }

  _drawGrid(region, cols, rows) {
    const cfg = this.config;
    const ctx = this.ctx;
    ctx.strokeStyle = cfg.lineColor;
    ctx.lineWidth = cfg.lineWidth;
    ctx.beginPath();
    for (let i = 0; i < rows; i++) {
      const y = cfg.padding + i * cfg.cellSize;
      ctx.moveTo(cfg.padding, y);
      ctx.lineTo(cfg.padding + (cols - 1) * cfg.cellSize, y);
    }
    for (let i = 0; i < cols; i++) {
      const x = cfg.padding + i * cfg.cellSize;
      ctx.moveTo(x, cfg.padding);
      ctx.lineTo(x, cfg.padding + (rows - 1) * cfg.cellSize);
    }
    ctx.stroke();

    ctx.lineWidth = cfg.borderWidth;
    ctx.beginPath();
    if (region.minY === 0) { ctx.moveTo(cfg.padding, cfg.padding); ctx.lineTo(cfg.padding + (cols - 1) * cfg.cellSize, cfg.padding); }
    if (region.maxY === this._boardSize - 1) { ctx.moveTo(cfg.padding, cfg.padding + (rows - 1) * cfg.cellSize); ctx.lineTo(cfg.padding + (cols - 1) * cfg.cellSize, cfg.padding + (rows - 1) * cfg.cellSize); }
    if (region.minX === 0) { ctx.moveTo(cfg.padding, cfg.padding); ctx.lineTo(cfg.padding, cfg.padding + (rows - 1) * cfg.cellSize); }
    if (region.maxX === this._boardSize - 1) { ctx.moveTo(cfg.padding + (cols - 1) * cfg.cellSize, cfg.padding); ctx.lineTo(cfg.padding + (cols - 1) * cfg.cellSize, cfg.padding + (rows - 1) * cfg.cellSize); }
    ctx.stroke();
  }

  _drawStarPoints(boardSize, region) {
    const stars = getStarPoints(boardSize);
    const ctx = this.ctx;
    ctx.fillStyle = this.config.starColor;
    for (const [sx, sy] of stars) {
      if (sx >= region.minX && sx <= region.maxX && sy >= region.minY && sy <= region.maxY) {
        const px = this._boardToPixelX(sx, region);
        const py = this._boardToPixelY(sy, region);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawCoordinates(region, cols, rows) {
    const cfg = this.config;
    const ctx = this.ctx;
    ctx.fillStyle = cfg.coordTextColor;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < cols; i++) {
      const x = cfg.padding + i * cfg.cellSize;
      ctx.fillText(this._colLabel(region.minX + i), x, cfg.padding / 2);
    }
    for (let i = 0; i < rows; i++) {
      const y = cfg.padding + i * cfg.cellSize;
      ctx.fillText(String(region.minY + i + 1), cfg.padding / 2, y);
    }
  }

  _colLabel(colIndex) {
    const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
    if (colIndex < 25) return letters[colIndex];
    return letters[Math.floor(colIndex / 25) - 1] + letters[colIndex % 25];
  }

  _drawStones(board, region, lastMove) {
    const cfg = this.config;
    const ctx = this.ctx;
    const radius = cfg.cellSize * cfg.stoneRadiusRatio;
    for (let y = region.minY; y <= region.maxY; y++) {
      for (let x = region.minX; x <= region.maxX; x++) {
        const stone = board.get(x, y);
        if (stone === EMPTY) continue;
        const px = this._boardToPixelX(x, region);
        const py = this._boardToPixelY(y, region);
        this._drawStone(px, py, radius, stone);
        if (lastMove && lastMove.x === x && lastMove.y === y) {
          ctx.strokeStyle = cfg.lastMoveColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  _drawStone(px, py, radius, color) {
    const ctx = this.ctx;
    const cfg = this.config;
    ctx.beginPath();
    ctx.arc(px + 1, py + 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();

    if (color === BLACK) {
      const grad = ctx.createRadialGradient(px - radius * 0.3, py - radius * 0.3, radius * 0.1, px, py, radius);
      grad.addColorStop(0, '#555555');
      grad.addColorStop(1, cfg.blackStoneColor);
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(px - radius * 0.3, py - radius * 0.3, radius * 0.1, px, py, radius);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, cfg.whiteStoneColor);
      ctx.fillStyle = grad;
    }
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
    if (color === WHITE) {
      ctx.strokeStyle = '#BBBBBB';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  _drawLabels(labels, region) {
    const ctx = this.ctx;
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const label of labels) {
      if (label.x >= region.minX && label.x <= region.maxX && label.y >= region.minY && label.y <= region.maxY) {
        const px = this._boardToPixelX(label.x, region);
        const py = this._boardToPixelY(label.y, region);
        ctx.fillText(label.label, px, py);
      }
    }
  }

  _boardToPixelX(boardX, region) {
    return this.config.padding + (boardX - region.minX) * this.config.cellSize;
  }

  _boardToPixelY(boardY, region) {
    return this.config.padding + (boardY - region.minY) * this.config.cellSize;
  }

  pixelToBoard(px, py) {
    const cfg = this.config;
    if (!this._region) return null;
    const x = Math.round((px - cfg.padding) / cfg.cellSize) + this._region.minX;
    const y = Math.round((py - cfg.padding) / cfg.cellSize) + this._region.minY;
    if (x < this._region.minX || x > this._region.maxX || y < this._region.minY || y > this._region.maxY) return null;
    return { x, y };
  }

  getCanvasSize(board, region = null) {
    const viewRegion = region || this._computeRegion(board);
    const cols = viewRegion.maxX - viewRegion.minX + 1;
    const rows = viewRegion.maxY - viewRegion.minY + 1;
    return {
      width: this.config.padding * 2 + (cols - 1) * this.config.cellSize,
      height: this.config.padding * 2 + (rows - 1) * this.config.cellSize,
      region: viewRegion,
    };
  }
}

module.exports = BoardRenderer;
