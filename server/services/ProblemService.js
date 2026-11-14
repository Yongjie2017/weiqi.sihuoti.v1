/**
 * ProblemService.js - 题目管理服务
 */

const fs = require('fs');
const path = require('path');
const { SgfParser } = require('../../shared/sgf/SgfParser');

const PROBLEMS_DIR = path.join(__dirname, '../../problems');

class ProblemService {
  constructor() {
    this.problemsDir = PROBLEMS_DIR;
    this.cache = null;
  }

  buildIndex() {
    const problems = [];
    const difficulties = this._listDirs(this.problemsDir);
    for (const difficulty of difficulties) {
      const dir = path.join(this.problemsDir, difficulty);
      const files = this._listSgfFiles(dir);
      for (const file of files) {
        const id = `${difficulty}-${path.basename(file, '.sgf')}`;
        const info = this._extractProblemInfo(path.join(dir, file), id, difficulty);
        if (info) problems.push(info);
      }
    }
    const index = { problems };
    const indexPath = path.join(this.problemsDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    this.cache = index;
    return index;
  }

  getIndex() {
    if (this.cache) return this.cache;
    const indexPath = path.join(this.problemsDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      this.cache = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      return this.cache;
    }
    return this.buildIndex();
  }

  listProblems(difficulty = null) {
    const index = this.getIndex();
    let problems = index.problems;
    if (difficulty) problems = problems.filter(p => p.difficulty === difficulty);
    return problems;
  }

  getProblem(id) {
    const index = this.getIndex();
    const info = index.problems.find(p => p.id === id);
    if (!info) return null;
    const filePath = path.join(this.problemsDir, info.file);
    if (!fs.existsSync(filePath)) return null;
    const sgfText = fs.readFileSync(filePath, 'utf-8');
    const parser = new SgfParser();
    const gameTree = parser.parseGame(sgfText);
    return {
      ...info, sgf: sgfText, gameTree,
      boardSize: gameTree.metadata.boardSize,
      setup: gameTree.setup,
      comment: gameTree.comment,
      labels: gameTree.labels,
    };
  }

  _extractProblemInfo(filePath, id, difficulty) {
    try {
      const sgfText = fs.readFileSync(filePath, 'utf-8');
      const parser = new SgfParser();
      const gameTree = parser.parseGame(sgfText);
      const fileName = path.basename(filePath, '.sgf');
      const title = gameTree.comment
        ? gameTree.comment.split('\n')[0].substring(0, 30) : fileName;
      const tags = [];
      if (gameTree.comment) {
        if (gameTree.comment.includes('做活')) tags.push('做活');
        if (gameTree.comment.includes('杀棋')) tags.push('杀棋');
        if (gameTree.comment.includes('劫')) tags.push('劫');
        if (gameTree.comment.includes('对杀')) tags.push('对杀');
        if (gameTree.comment.includes('手筋')) tags.push('手筋');
      }
      return {
        id, title, difficulty,
        firstPlayer: gameTree.setup.firstPlayer,
        boardSize: gameTree.metadata.boardSize,
        tags: tags.length > 0 ? tags : ['综合'],
        file: path.relative(this.problemsDir, filePath).replace(/\\/g, '/'),
      };
    } catch (e) {
      console.error(`解析题目失败: ${filePath}`, e.message);
      return null;
    }
  }

  _listDirs(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
  }

  _listSgfFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.sgf')).sort();
  }
}

module.exports = new ProblemService();
