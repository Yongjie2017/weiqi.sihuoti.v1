const fs = require('fs');
const path = require('path');

const collectionsDir = path.join(__dirname, 'tmp_collections');
const outputDir = path.join(__dirname, 'problems', 'to_be_classified');

function splitCollection(filePath) {
  const basename = path.basename(filePath, '.sgf');
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  // 移除注释中的换行干扰：SGF 属性值在 [ ] 内，括号外的内容不影响解析
  // 策略：逐字符扫描，跟踪 [] 和 () 的嵌套
  const problems = [];
  let i = 0;
  const len = text.length;

  // 跳过外层 ( 和根节点的 ;
  // 找到根节点结束后，内部每个 (...) 就是一道题

  // 先找到根节点的内容：第一个 (; 后面的属性
  // 根节点格式: (;FF[4]GM[1]SZ[19] C[...] (...)(...)(...))
  // 我们需要提取根节点的元数据，然后每个子 (...) 是一道题

  // 方法：扫描找到根节点的直接子变体
  let depth = 0;
  let inProp = false; // 在 [ ] 内
  let propBracketDepth = 0;
  let rootNodeEnd = -1; // 根节点 ; ... 的属性结束位置

  // 先找到第一个 (;（根节点开始）
  // 跳过到第一个 ;
  while (i < len && text[i] !== ';') i++;
  // i 指向根节点的 ;
  i++; // 跳过 ;

  // 扫描根节点的属性，直到遇到 ( 或 )（根节点结束）
  while (i < len) {
    const ch = text[i];
    if (ch === '[') { propBracketDepth++; inProp = true; }
    else if (ch === ']') { propBracketDepth--; if (propBracketDepth === 0) inProp = false; }
    else if (!inProp && ch === '(') { rootNodeEnd = i; break; }
    else if (!inProp && ch === ')') { rootNodeEnd = i; break; }
    i++;
  }

  if (rootNodeEnd < 0) {
    console.log(`  No sub-problems found in ${basename}`);
    return;
  }

  // 提取根节点属性文本
  const rootProps = text.substring(0, rootNodeEnd).trim();

  // 现在从 rootNodeEnd 开始，逐个提取子变体 (...)
  i = rootNodeEnd;
  let problemCount = 0;

  while (i < len) {
    // 跳过空白
    while (i < len && /\s/.test(text[i])) i++;
    if (i >= len) break;

    if (text[i] === ')') {
      // 根节点结束
      break;
    }

    if (text[i] !== '(') {
      i++;
      continue;
    }

    // 找到一个子变体的开始 (
    const start = i;
    depth = 0;
    inProp = false;
    propBracketDepth = 0;

    while (i < len) {
      const ch = text[i];
      if (ch === '[') { propBracketDepth++; inProp = true; }
      else if (ch === ']') { propBracketDepth--; if (propBracketDepth === 0) inProp = false; }
      else if (!inProp) {
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) {
            // 子变体结束
            const problemText = text.substring(start, i + 1);
            problems.push(problemText);
            problemCount++;
            break;
          }
        }
      }
      i++;
    }
    i++; // 跳过 )
  }

  console.log(`  ${basename}: ${problemCount} problems found`);

  // 写入每个题目为单独的 SGF 文件
  // rootProps 已包含开头的 (; ，子变体已包含自身的 ( )
  // 完整 SGF = rootProps + 子变体 + )（闭合根节点）
  for (let idx = 0; idx < problems.length; idx++) {
    const fullSgf = rootProps + '\n' + problems[idx] + ')';
    const num = String(idx + 1).padStart(4, '0');
    const outName = `${basename}-${num}.sgf`;
    fs.writeFileSync(path.join(outputDir, outName), fullSgf, 'utf8');
  }

  return problemCount;
}

// 处理所有集合文件
const files = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.sgf'));
let total = 0;

for (const file of files) {
  console.log(`Processing ${file}...`);
  const count = splitCollection(path.join(collectionsDir, file));
  if (count) total += count;
}

console.log(`\nDone! Total ${total} problems written to ${outputDir}`);
