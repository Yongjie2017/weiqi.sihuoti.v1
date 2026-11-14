/**
 * SolutionTree.js - 正解树数据结构
 * 纯 JS 实现，无平台依赖。
 */

const { fromString } = require('../board/Stone');

class SolutionTreeNode {
  /**
   * @param {object} move - {color: 'B'|'W', x, y} 或 {color, pass: true} 或 null（根节点）
   * @param {string} comment
   * @param {boolean} isCorrect
   * @param {boolean} isWrong
   * @param {string} name
   */
  constructor(move, comment = '', isCorrect = false, isWrong = false, name = '') {
    this.move = move;
    this.comment = comment;
    this.isCorrect = isCorrect;
    this.isWrong = isWrong;
    this.name = name;
    this.children = [];
    this.parent = null;
  }

  get colorNum() {
    if (!this.move) return 0;
    return fromString(this.move.color);
  }

  get isPass() {
    return this.move && this.move.pass;
  }

  get coord() {
    if (!this.move || this.move.pass) return null;
    return { x: this.move.x, y: this.move.y };
  }
}

class SolutionTree {
  constructor() {
    this.root = new SolutionTreeNode(null);
  }

  /**
   * 从 SGF 游戏树构建正解树
   * SGF 的 moveNodes 是主路径，variations 是分支
   */
  static fromGameTree(gameTree) {
    const tree = new SolutionTree();
    tree._buildFromNodes(tree.root, gameTree.moveNodes || [], gameTree.variations || []);
    return tree;
  }

  /**
   * 递归构建正解树
   * @param {SolutionTreeNode} parent
   * @param {Array} moveNodes - 移动节点列表
   * @param {Array} variations - 子变体列表
   */
  _buildFromNodes(parent, moveNodes, variations = []) {
    if (!moveNodes || moveNodes.length === 0) {
      // 没有 moveNodes，变体直接挂在 parent 上
      for (const v of variations) {
        this._buildFromNodes(parent, v.moveNodes || [], v.variations || []);
      }
      return;
    }

    // 创建第一个移动节点，挂在 parent 下
    const firstMove = moveNodes[0];
    const node = new SolutionTreeNode(
      firstMove.move,
      firstMove.comment,
      firstMove.isCorrect,
      firstMove.isWrong,
      firstMove.name
    );
    node.parent = parent;
    parent.children.push(node);

    // 如果有更多 moveNodes，继续链式构建
    if (moveNodes.length > 1) {
      this._buildFromNodes(node, moveNodes.slice(1), []);
    }

    // 子变体挂在最后一个 moveNode 节点下
    let lastNode = node;
    while (lastNode.children.length > 0) {
      lastNode = lastNode.children[lastNode.children.length - 1];
    }
    for (const v of variations) {
      this._buildFromNodes(lastNode, v.moveNodes || [], v.variations || []);
    }
  }

  /**
   * 获取所有从根到正解终点的路径
   * @returns {Array<Array<SolutionTreeNode>>}
   */
  getAllCorrectPaths() {
    const paths = [];
    this._collectCorrectPaths(this.root, [], paths);
    return paths;
  }

  _collectCorrectPaths(node, currentPath, paths) {
    if (node !== this.root) {
      currentPath.push(node);
    }

    if (node.children.length === 0) {
      if (node.isCorrect) {
        paths.push([...currentPath]);
      }
    } else {
      for (const child of node.children) {
        this._collectCorrectPaths(child, currentPath, paths);
      }
    }

    if (node !== this.root) {
      currentPath.pop();
    }
  }

  /**
   * 调试打印树结构
   */
  debugPrint() {
    this._printNode(this.root, 0);
  }

  _printNode(node, depth) {
    const indent = '  '.repeat(depth);
    let info = indent;
    if (node === this.root) {
      info += '[root]';
    } else {
      const coord = node.coord;
      info += `${node.move.color} ${coord ? `(${coord.x},${coord.y})` : 'pass'}`;
      if (node.isCorrect) info += ' [正解]';
      if (node.isWrong) info += ' [失败]';
      if (node.name) info += ` "${node.name}"`;
    }
    console.log(info);
    for (const child of node.children) {
      this._printNode(child, depth + 1);
    }
  }
}

module.exports = { SolutionTree, SolutionTreeNode };
