/**
 * SgfParser.js - SGF (Smart Game Format) 解析器
 * 纯 JS 实现，无平台依赖。
 * 将 SGF 文本解析为游戏树结构。
 */

/**
 * SGF 坐标转换：字母坐标 "ab" -> {x:0, y:1}
 * SGF 使用小写字母，a=0, b=1, ...
 */
function sgfToCoord(sgfCoord) {
  if (!sgfCoord || sgfCoord.length < 2) return null;
  const x = sgfCoord.charCodeAt(0) - 97;
  const y = sgfCoord.charCodeAt(1) - 97;
  return { x, y };
}

/**
 * 坐标转 SGF 格式：{x:0, y:1} -> "ab"
 */
function coordToSgf(x, y) {
  return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
}

class SgfParser {
  /**
   * 解析 SGF 文本为内部游戏树结构
   * @param {string} text - SGF 文本
   * @returns {object} SgfGameTree
   */
  parseGame(text) {
    text = text.replace(/^\uFEFF/, '');
    this.text = text;
    this.pos = 0;
    const raw = this._parseTree();
    return this._buildGameTree(raw);
  }

  // ===== 词法/语法解析 =====

  _skipWhitespace() {
    while (this.pos < this.text.length) {
      const c = this.text[this.pos];
      if (c === ' ' || c === '\n' || c === '\r' || c === '\t') {
        this.pos++;
      } else {
        break;
      }
    }
  }

  _parseTree() {
    this._skipWhitespace();
    if (this.text[this.pos] !== '(') {
      throw new Error(`SGF 解析错误：期望 '('，位置 ${this.pos}`);
    }
    this.pos++; // 消费 '('

    const nodes = [];
    const variations = [];

    this._skipWhitespace();
    while (this.pos < this.text.length && this.text[this.pos] !== ')') {
      if (this.text[this.pos] === ';') {
        nodes.push(this._parseNode());
      } else if (this.text[this.pos] === '(') {
        variations.push(this._parseTree());
      } else {
        this.pos++;
      }
      this._skipWhitespace();
    }

    if (this.text[this.pos] !== ')') {
      throw new Error(`SGF 解析错误：期望 ')'，位置 ${this.pos}`);
    }
    this.pos++; // 消费 ')'

    return { nodes, variations };
  }

  _parseNode() {
    if (this.text[this.pos] !== ';') {
      throw new Error(`SGF 解析错误：期望 ';'，位置 ${this.pos}`);
    }
    this.pos++; // 消费 ';'

    const properties = {};

    while (this.pos < this.text.length) {
      this._skipWhitespace();
      const c = this.text[this.pos];
      if (!c || c === ';' || c === ')' || c === '(') break;

      // 解析属性名（大写字母）
      if (!/[A-Z]/.test(c)) {
        this.pos++;
        continue;
      }

      let name = '';
      while (this.pos < this.text.length && /[A-Z]/.test(this.text[this.pos])) {
        name += this.text[this.pos];
        this.pos++;
      }

      // 解析属性值 [value]
      const values = [];
      this._skipWhitespace();
      while (this.text[this.pos] === '[') {
        this.pos++; // 消费 '['
        let value = '';
        while (this.pos < this.text.length && this.text[this.pos] !== ']') {
          if (this.text[this.pos] === '\\') {
            this.pos++;
            if (this.pos < this.text.length) {
              value += this.text[this.pos];
              this.pos++;
            }
          } else {
            value += this.text[this.pos];
            this.pos++;
          }
        }
        this.pos++; // 消费 ']'
        values.push(value);
        this._skipWhitespace();
      }

      properties[name] = values;
    }

    return { properties };
  }

  // ===== 构建内部游戏树 =====

  _buildGameTree(raw) {
    const firstNode = raw.nodes[0] || { properties: {} };
    const props = firstNode.properties;

    const metadata = {
      gameType: props.GM ? parseInt(props.GM[0]) : 1,
      format: props.FF ? parseInt(props.FF[0]) : 4,
      charset: props.CA ? props.CA[0] : 'UTF-8',
      boardSize: props.SZ ? parseInt(props.SZ[0]) : 19,
      application: props.AP ? props.AP[0] : '',
    };

    const firstPlayer = props.PL ? (props.PL[0] === 'W' ? 'W' : 'B') : 'B';

    const blackStones = [];
    const whiteStones = [];
    if (props.AB) {
      for (const v of props.AB) {
        const coord = sgfToCoord(v);
        if (coord) blackStones.push(coord);
      }
    }
    if (props.AW) {
      for (const v of props.AW) {
        const coord = sgfToCoord(v);
        if (coord) whiteStones.push(coord);
      }
    }

    const comment = props.C ? props.C[0] : '';

    const labels = [];
    if (props.LB) {
      for (const v of props.LB) {
        const parts = v.split(':');
        if (parts.length >= 2) {
          const coord = sgfToCoord(parts[0]);
          if (coord) labels.push({ ...coord, label: parts[1] });
        }
      }
    }

    // 构建移动节点列表（第一个节点之后的节点）
    const moveNodes = raw.nodes.slice(1).map(n => this._buildMoveNode(n));

    // 子变体：变体的所有节点都是落子节点，不跳过第一个
    const variations = raw.variations.map(v => this._buildVariation(v));

    return {
      metadata,
      setup: { blackStones, whiteStones, firstPlayer },
      comment,
      labels,
      moveNodes,
      variations,
    };
  }

  /**
   * 构建变体（与 _buildGameTree 类似，但不跳过第一个节点）
   * 变体中的所有节点都是落子节点
   */
  _buildVariation(raw) {
    const moveNodes = raw.nodes.map(n => this._buildMoveNode(n));
    const variations = raw.variations.map(v => this._buildVariation(v));
    return { moveNodes, variations };
  }

  _buildMoveNode(rawNode) {
    const props = rawNode.properties;

    let move = null;
    if (props.B) {
      const coord = sgfToCoord(props.B[0]);
      if (coord) move = { color: 'B', x: coord.x, y: coord.y };
      else move = { color: 'B', pass: true };
    } else if (props.W) {
      const coord = sgfToCoord(props.W[0]);
      if (coord) move = { color: 'W', x: coord.x, y: coord.y };
      else move = { color: 'W', pass: true };
    }

    const comment = props.C ? props.C[0] : '';
    const name = props.N ? props.N[0] : '';
    const result = props.RE ? props.RE[0] : '';

    const isCorrect = name.includes('正解') || result === '+B' || result === '+W';
    const isWrong = name.includes('失败') || name.includes('错误') || result === '-B' || result === '-W';

    // 子变体也转为移动节点（如果有的话）
    const childNodes = [];
    if (rawNode.variations) {
      for (const v of rawNode.variations) {
        childNodes.push(...v.nodes.slice(0).map(n => this._buildMoveNode(n)));
      }
    }

    return {
      move,
      comment,
      name,
      result,
      isCorrect,
      isWrong,
      properties: props,
    };
  }
}

module.exports = { SgfParser, sgfToCoord, coordToSgf };
