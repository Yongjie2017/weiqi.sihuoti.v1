/**
 * Board.js - 棋盘数据结构
 * 纯 JS 实现，无平台依赖。
 * 内部使用扁平 Int8Array 存储棋盘状态。
 */

const { EMPTY, BLACK, WHITE, opponent } = require('./Stone');

class Board {
  /**
   * @param {number} size - 棋盘尺寸（标准 19）
   */
  constructor(size = 19) {
    this.size = size;
    this.stones = new Int8Array(size * size); // 0=空, 1=黑, 2=白
    this.history = []; // [{x, y, color, captured: [{x,y}]}]
    this.captures = { [BLACK]: 0, [WHITE]: 0 }; // 各方提子数
    this.koPoint = null; // {x, y} 或 null
  }

  /**
   * 二维坐标转一维索引
   */
  index(x, y) {
    return y * this.size + x;
  }

  /**
   * 获取某点状态
   */
  get(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return -1;
    return this.stones[this.index(x, y)];
  }

  /**
   * 设置某点状态（不经过规则检查，用于初始化局面）
   */
  set(x, y, color) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return;
    this.stones[this.index(x, y)] = color;
  }

  /**
   * 检查坐标是否在棋盘内
   */
  inBounds(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  /**
   * 获取某点的邻居坐标列表
   */
  neighbors(x, y) {
    const result = [];
    if (x > 0) result.push({ x: x - 1, y });
    if (x < this.size - 1) result.push({ x: x + 1, y });
    if (y > 0) result.push({ x, y: y - 1 });
    if (y < this.size - 1) result.push({ x, y: y + 1 });
    return result;
  }

  /**
   * 放置棋子（不检查规则，仅供内部 Rules 模块使用）
   * @private
   */
  _placeRaw(x, y, color) {
    this.stones[this.index(x, y)] = color;
  }

  /**
   * 移除棋子（不检查规则）
   * @private
   */
  _removeRaw(x, y) {
    this.stones[this.index(x, y)] = EMPTY;
  }

  /**
   * 克隆棋盘
   */
  clone() {
    const b = new Board(this.size);
    b.stones = new Int8Array(this.stones);
    b.history = this.history.map(h => ({ ...h, captured: h.captured ? h.captured.map(c => ({ ...c })) : [] }));
    b.captures = { [BLACK]: this.captures[BLACK], [WHITE]: this.captures[WHITE] };
    b.koPoint = this.koPoint ? { ...this.koPoint } : null;
    return b;
  }

  /**
   * 转二维数组
   */
  toArray() {
    const arr = [];
    for (let y = 0; y < this.size; y++) {
      const row = [];
      for (let x = 0; x < this.size; x++) {
        row.push(this.stones[this.index(x, y)]);
      }
      arr.push(row);
    }
    return arr;
  }

  /**
   * 从二维数组加载棋盘状态
   */
  fromArray(data) {
    this.size = data.length;
    this.stones = new Int8Array(this.size * this.size);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.stones[this.index(x, y)] = data[y][x] || EMPTY;
      }
    }
    this.history = [];
    this.captures = { [BLACK]: 0, [WHITE]: 0 };
    this.koPoint = null;
  }

  /**
   * 从预设棋子列表设置初始局面（用于 SGF 加载）
   * @param {Array} blackStones - [{x, y}, ...]
   * @param {Array} whiteStones - [{x, y}, ...]
   */
  setupPosition(blackStones = [], whiteStones = []) {
    this.stones.fill(EMPTY);
    for (const s of blackStones) this.set(s.x, s.y, BLACK);
    for (const s of whiteStones) this.set(s.x, s.y, WHITE);
    this.history = [];
    this.captures = { [BLACK]: 0, [WHITE]: 0 };
    this.koPoint = null;
  }

  /**
   * 获取有棋子的区域的边界框（用于局部渲染）
   * @returns {{minX, minY, maxX, maxY} | null}
   */
  getBoundingBox() {
    let minX = this.size, minY = this.size, maxX = -1, maxY = -1;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.stones[this.index(x, y)] !== EMPTY) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    return { minX, minY, maxX, maxY };
  }

  /**
   * 序列化为简洁对象（用于 JSON 传输）
   */
  toJSON() {
    return {
      size: this.size,
      stones: Array.from(this.stones),
      captures: this.captures,
      koPoint: this.koPoint,
      moveCount: this.history.length,
    };
  }
}

module.exports = Board;
