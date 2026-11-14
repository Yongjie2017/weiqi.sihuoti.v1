/**
 * GtpEngine.js - GTP (Go Text Protocol) 适配器
 * 通过子进程与 GTP 兼容引擎（如 KataGo）通信
 */

const { spawn } = require('child_process');
const { BLACK, WHITE } = require('../../shared/board/Stone');

class GtpEngine {
  constructor(executablePath, args = [], options = {}) {
    this.executablePath = executablePath;
    this.args = args;
    this.options = options;
    this.process = null;
    this.buffer = '';
    this.pendingResolvers = [];
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.process = spawn(this.executablePath, this.args, { stdio: ['pipe', 'pipe', 'pipe'], ...this.options });
    this.started = true;
    this.process.stdout.on('data', (data) => { this.buffer += data.toString(); this._processBuffer(); });
    this.process.stderr.on('data', (data) => { if (process.env.DEBUG_GTP) process.stderr.write(`[GTP] ${data}`); });
    this.process.on('error', (err) => { this.started = false; this._rejectAll(err); });
    this.process.on('close', () => { this.started = false; this._rejectAll(new Error('引擎已退出')); });
  }

  _rejectAll(err) {
    for (const { reject } of this.pendingResolvers) reject(err);
    this.pendingResolvers = [];
  }

  _processBuffer() {
    while (true) {
      let idx = this.buffer.indexOf('\n\n');
      let block;
      if (idx !== -1) {
        block = this.buffer.substring(0, idx).trim();
        this.buffer = this.buffer.substring(idx + 2);
      } else {
        idx = this.buffer.indexOf('\n');
        if (idx === -1) break;
        const line = this.buffer.substring(0, idx).trim();
        if (!line.startsWith('=') && !line.startsWith('?')) break;
        block = line;
        this.buffer = this.buffer.substring(idx + 1);
      }
      const firstChar = block[0];
      const response = block.substring(1).trim();
      const resolver = this.pendingResolvers.shift();
      if (resolver) {
        if (firstChar === '=') resolver.resolve(response);
        else resolver.reject(new Error(response));
      }
    }
  }

  async sendCommand(command) {
    if (!this.started) throw new Error('引擎未启动');
    return new Promise((resolve, reject) => {
      this.pendingResolvers.push({ resolve, reject });
      this.process.stdin.write(command + '\n');
    });
  }

  async boardsize(n) { return this.sendCommand(`boardsize ${n}`); }
  async clearBoard() { return this.sendCommand('clear_board'); }
  async komi(k) { return this.sendCommand(`komi ${k}`); }
  async play(color, vertex) { return this.sendCommand(`play ${color} ${vertex}`); }
  async undo() { return this.sendCommand('undo'); }

  async genmove(color) {
    const response = await this.sendCommand(`genmove ${color}`);
    return this._parseVertex(response);
  }

  async quit() {
    if (!this.started) return;
    try { await this.sendCommand('quit'); } catch (e) { /* ignore */ }
    this.process.kill();
    this.started = false;
  }

  async syncBoard(boardState) {
    const { size, stones } = boardState;
    await this.boardsize(size);
    await this.clearBoard();
    for (let i = 0; i < size * size; i++) {
      const x = i % size, y = Math.floor(i / size);
      if (stones[i] === BLACK) await this.play('B', this._toVertex(x, y));
      else if (stones[i] === WHITE) await this.play('W', this._toVertex(x, y));
    }
  }

  _toVertex(x, y) {
    const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
    const col = x < 25 ? letters[x] : letters[Math.floor(x / 25) - 1] + letters[x % 25];
    return col + (y + 1);
  }

  _parseVertex(vertex) {
    vertex = vertex.trim().toLowerCase();
    if (vertex === 'pass' || vertex === 'resign') return { pass: true, resign: vertex === 'resign' };
    const letters = 'abcdefghjklmnopqrstuvwxyz';
    const colChar = vertex.charAt(0);
    const x = letters.indexOf(colChar);
    const rowStr = vertex.replace(/^[a-z]+/, '');
    const y = parseInt(rowStr) - 1;
    if (x < 0 || y < 0 || isNaN(y)) return { pass: true };
    return { x, y };
  }
}

module.exports = GtpEngine;
