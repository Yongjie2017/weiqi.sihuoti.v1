/**
 * SgfWriter.js - SGF 文件生成器
 * 纯 JS 实现，无平台依赖。
 */

const { coordToSgf } = require('./SgfParser');

/**
 * 将内部游戏树结构序列化为 SGF 文本
 */
function writeGame(tree) {
  const lines = [];

  // 根节点属性
  const rootProps = [];
  rootProps.push('GM[1]');
  rootProps.push('FF[4]');
  rootProps.push('CA[UTF-8]');
  rootProps.push(`SZ[${tree.metadata.boardSize}]`);
  rootProps.push(`PL[${tree.setup.firstPlayer}]`);

  // 初始棋子
  if (tree.setup.blackStones && tree.setup.blackStones.length > 0) {
    const coords = tree.setup.blackStones.map(s => coordToSgf(s.x, s.y)).join('][');
    rootProps.push(`AB[${coords}]`);
  }
  if (tree.setup.whiteStones && tree.setup.whiteStones.length > 0) {
    const coords = tree.setup.whiteStones.map(s => coordToSgf(s.x, s.y)).join('][');
    rootProps.push(`AW[${coords}]`);
  }

  // 题目描述
  if (tree.comment) {
    rootProps.push(`C[${escapeText(tree.comment)}]`);
  }

  // 标注
  if (tree.labels && tree.labels.length > 0) {
    const labels = tree.labels.map(l => `${coordToSgf(l.x, l.y)}:${l.label}`).join('][');
    rootProps.push(`LB[${labels}]`);
  }

  lines.push(`(;${rootProps.join('')}`);

  // 移动节点（简化：只写主路径）
  for (const node of tree.moveNodes || []) {
    lines.push(writeNode(node));
  }

  lines.push(')');

  return lines.join('\n');
}

function writeNode(node) {
  const parts = [';'];

  if (node.move) {
    if (node.move.pass) {
      parts.push(`${node.move.color}[]`);
    } else {
      parts.push(`${node.move.color}[${coordToSgf(node.move.x, node.move.y)}]`);
    }
  }

  if (node.name) {
    parts.push(`N[${escapeText(node.name)}]`);
  }

  if (node.comment) {
    parts.push(`C[${escapeText(node.comment)}]`);
  }

  if (node.result) {
    parts.push(`RE[${node.result}]`);
  }

  return parts.join('');
}

function escapeText(text) {
  return text.replace(/[\]\\]/g, '\\$&');
}

module.exports = { writeGame, writeNode, escapeText };
