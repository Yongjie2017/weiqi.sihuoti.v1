/**
 * SolutionChecker.js - 解题判定引擎
 * 纯 JS 实现，无平台依赖。
 */

const { SolutionTree, SolutionTreeNode } = require('./SolutionTree');

const CheckResult = {
  CORRECT: 'correct',
  CONTINUE: 'continue',
  WRONG: 'wrong',
  IGNORE: 'ignore',
};

class SolutionChecker {
  /**
   * @param {SolutionTree} solutionTree
   */
  constructor(solutionTree) {
    this.tree = solutionTree;
    this.currentNode = solutionTree.root;
    this.solved = false;
    this.failed = false;
  }

  /**
   * 检查用户的落子是否匹配正解树
   * @param {number} x
   * @param {number} y
   * @param {number} color - BLACK 或 WHITE
   * @param {boolean} studyMode - 是否研究模式
   * @returns {{ result: string, comment: string, node: SolutionTreeNode|null }}
   */
  checkMove(x, y, color, studyMode = false) {
    if (studyMode) {
      return { result: CheckResult.IGNORE, comment: '', node: null };
    }

    const matchedChild = this.currentNode.children.find(child => {
      if (child.isPass) return false;
      const coord = child.coord;
      if (!coord) return false;
      return coord.x === x && coord.y === y && child.colorNum === color;
    });

    if (!matchedChild) {
      this.failed = true;
      return { result: CheckResult.WRONG, comment: '此步不在正解中', node: null };
    }

    this.currentNode = matchedChild;

    if (matchedChild.isCorrect) {
      this.solved = true;
      return {
        result: CheckResult.CORRECT,
        comment: matchedChild.comment || '解题成功！',
        node: matchedChild,
      };
    }

    if (matchedChild.isWrong) {
      this.failed = true;
      return {
        result: CheckResult.WRONG,
        comment: matchedChild.comment || '此路不通',
        node: matchedChild,
      };
    }

    return {
      result: CheckResult.CONTINUE,
      comment: matchedChild.comment || '',
      node: matchedChild,
    };
  }

  getCurrentNode() {
    return this.currentNode;
  }

  isSolved() {
    return this.solved;
  }

  isFailed() {
    return this.failed;
  }

  reset() {
    this.currentNode = this.tree.root;
    this.solved = false;
    this.failed = false;
  }

  getHintMoves() {
    return this.currentNode.children.filter(c => !c.isWrong);
  }

  getCorrectPathsFromCurrent() {
    const paths = [];
    this._collectPaths(this.currentNode, [], paths);
    return paths;
  }

  _collectPaths(node, currentPath, paths) {
    if (node.children.length === 0) {
      if (node.isCorrect) {
        paths.push([...currentPath]);
      }
      return;
    }
    for (const child of node.children) {
      currentPath.push(child);
      this._collectPaths(child, currentPath, paths);
      currentPath.pop();
    }
  }
}

module.exports = { SolutionChecker, CheckResult };
