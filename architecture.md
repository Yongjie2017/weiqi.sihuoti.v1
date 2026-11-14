# 围棋死活题 — 总体架构设计

## 1. 项目概述

本项目是一个"围棋死活题"应用，面向围棋爱好者提供交互式死活题训练。用户可以在围棋棋盘的局部（一角）上研究题目，通过点击落子来探索最优解法。

### 1.1 核心目标

| 目标 | 说明 |
|------|------|
| 交互式棋盘 | 图形化围棋棋盘，支持用户点击落子 |
| 双模式 | "对弈模式"（AI 对手）与"研究模式"（自由探索） |
| 本地优先 | 先做 Node.js 本地版本，便于开发调试 |
| 小程序就绪 | 架构设计兼顾微信小程序部署 |
| 标准棋谱 | 题目以标准围棋棋谱格式（SGF）存储，便于维护与切换 |
| 多解支持 | 每道题支持一个或多个正确解，解题正确即结束 |

### 1.2 术语表

| 术语 | 含义 |
|------|------|
| 死活题 | 围棋中判断局部棋形死活的问题 |
| SGF | Smart Game Format，标准围棋棋谱文件格式 |
| KataGo | 开源围棋 AI 引擎，用于对弈模式 |
| GTP | Go Text Protocol，围棋引擎通信协议 |
| 正确解 | 题目预设的最优落子序列，用于判定用户是否解题正确 |

---

## 2. 系统总体架构

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面层                          │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  本地 Web 前端       │  │  微信小程序前端 (规划中)  │  │
│  │  (Canvas 棋盘渲染)   │  │  (Canvas 棋盘渲染)       │  │
│  └────────┬────────────┘  └───────────┬──────────────┘  │
└───────────┼───────────────────────────┼─────────────────┘
            │                           │
            │  统一 API 层 (REST/WS)     │
            │                           │
┌───────────┼───────────────────────────┼─────────────────┐
│           ▼                           ▼                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │              业务逻辑层 (Node.js)                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │ │
│  │  │ 题目管理  │ │ 棋局引擎  │ │ 解题判定引擎       │ │ │
│  │  │ (SGF)    │ │ (规则)    │ │ (正解树匹配)       │ │ │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │           AI 对弈服务                         │ │ │
│  │  │  ┌──────────────┐  ┌───────────────────────┐ │ │ │
│  │  │  │ GTP 适配器    │  │ KataGo 引擎进程管理   │ │ │ │
│  │  │  └──────────────┘  └───────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   数据层                            │ │
│  │  题目库 (SGF 文件) │ 配置文件 │ 运行时状态 (内存)   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 设计原则

1. **前后端分离**：棋盘渲染在前端，业务逻辑在后端，通过统一 API 通信。
2. **平台无关的渲染层**：棋盘渲染基于 Canvas API，逻辑与微信小程序 Canvas 兼容。
3. **共享核心逻辑**：围棋规则引擎、SGF 解析器、正解判定等核心逻辑用纯 JavaScript 实现，不依赖 Node.js 专属 API，可直接迁移到小程序运行环境。
4. **可插拔 AI**：AI 引擎通过 GTP 协议适配，可替换为任意 GTP 兼容引擎（KataGo、GNU Go 等）。

---

## 3. 技术选型

### 3.1 本地开发版本

| 层次 | 技术方案 | 说明 |
|------|----------|------|
| 前端 | HTML5 Canvas + 原生 JS | 棋盘渲染与交互，不依赖框架，便于迁移 |
| 后端 | Node.js + Express | 提供 REST API 与 WebSocket |
| WebSocket | `ws` 库 | 实时推送 AI 落子、棋盘状态同步 |
| AI 引擎 | KataGo (GTP 模式) | 通过子进程 + GTP 协议通信 |
| 题目格式 | SGF (`.sgf`) | 标准围棋棋谱格式 |
| 数据存储 | 文件系统 | 题目以 SGF 文件组织，配置用 JSON |

### 3.2 微信小程序版本（规划）

| 层次 | 技术方案 | 说明 |
|------|----------|------|
| 前端 | 小程序 Canvas 2D | 与 Web Canvas API 基本兼容 |
| 后端 | 云开发 (云函数 + 云数据库) | 或自建 Node.js 服务端 |
| AI 引擎 | 服务端 KataGo | 小程序无法本地运行引擎，AI 逻辑在服务端 |
| 题目存储 | 云数据库 | SGF 内容存入数据库，便于动态更新 |

### 3.3 可共享代码（跨平台复用）

以下模块使用纯 JavaScript 实现，**无 Node.js / 浏览器 / 小程序专属依赖**，可在本地版本和小程序版本之间直接复用：

```
shared/
├── go-rules/      # 围棋规则引擎（提子、禁入点、劫）
├── board/         # 棋盘数据结构
├── sgf/           # SGF 解析与生成
├── solver/        # 正解树与解题判定
└── board-renderer/ # Canvas 渲染逻辑（平台无关）
```

---

## 4. 目录结构

```
weiqi.sihuoti.v1/
├── README.md
├── package.json
├── architecture.md              # 本文档
│
├── shared/                      # 跨平台共享核心逻辑 (纯 JS)
│   ├── board/
│   │   ├── Board.js             # 棋盘数据结构
│   │   └── Stone.js             # 棋子定义 (黑/白/空)
│   ├── go-rules/
│   │   ├── Rules.js             # 围棋规则核心：提子、禁入点、劫
│   │   └── Capture.js           # 提子逻辑
│   ├── sgf/
│   │   ├── SgfParser.js         # SGF 文件解析
│   │   ├── SgfWriter.js         # SGF 文件生成
│   │   └── SgfConverter.js      # SGF <-> 内部棋局互转
│   ├── solver/
│   │   ├── SolutionTree.js      # 正解树数据结构
│   │   └── SolutionChecker.js   # 用户落子序列 vs 正解树匹配
│   └── board-renderer/
│       ├── BoardRenderer.js     # Canvas 棋盘渲染（平台无关）
│       └── BoardConfig.js       # 棋盘样式配置（线宽、星位、坐标）
│
├── problems/                    # 题目库 (SGF 文件)
│   ├── beginner/
│   │   ├── 001-corner-capture.sgf
│   │   └── ...
│   ├── intermediate/
│   └── advanced/
│
├── server/                      # Node.js 后端
│   ├── index.js                 # 服务入口
│   ├── routes/
│   │   ├── problemRoutes.js     # 题目相关 API
│   │   └── gameRoutes.js        # 对局相关 API
│   ├── services/
│   │   ├── ProblemService.js    # 题目加载、列表、筛选
│   │   ├── GameService.js       # 棋局状态管理
│   │   ├── SolverService.js     # 解题判定
│   │   └── AiService.js         # AI 对弈服务
│   ├── ai/
│   │   ├── GtpEngine.js         # GTP 协议适配器
│   │   ├── KataGoManager.js     # KataGo 进程管理
│   │   └── KataGoController.js  # AI 操作控制
│   ├── ws/
│   │   └── GameSocket.js        # WebSocket 实时通信
│   └── config/
│       └── engine.json          # KataGo 引擎配置
│
├── web/                         # 本地 Web 前端
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── app.js               # 前端主逻辑
│       ├── board-canvas.js      # 棋盘 Canvas 适配（调用 shared/board-renderer）
│       ├── interaction.js       # 点击交互处理
│       └── api.js               # 后端 API 调用封装
│
├── miniprogram/                 # 微信小程序前端 (规划)
│   ├── app.js
│   ├── app.json
│   ├── pages/
│   │   ├── index/               # 题目列表
│   │   └── board/               # 棋盘页面
│   └── components/
│       └── go-board/            # 围棋棋盘组件
│
└── tests/                       # 测试
    ├── shared/
    │   ├── go-rules.test.js
    │   ├── sgf-parser.test.js
    │   └── solution-checker.test.js
    └── server/
        └── ai-service.test.js
```

---

## 5. 核心模块设计

### 5.1 棋盘数据结构 (`shared/board/Board.js`)

```
Board
├── size: number            # 棋盘尺寸（局部题目通常 9~19，但只使用一角）
├── stones: Int8Array       # 棋盘状态，0=空，1=黑，2=白（扁平数组）
├── history: Move[]         # 落子历史
├── captures: {black, white} # 提子计数
├── koPoint: Point | null   # 当前劫禁入点
└── methods:
    ├── place(x, y, color) → Result   # 落子，返回成功/失败及原因
    ├── remove(x, y)                  # 移除棋子（研究模式回退用）
    ├── get(x, y) → Stone             # 获取某点状态
    ├── clone() → Board               # 深拷贝
    ├── toArray() → number[][]        # 转二维数组（AI 输入用）
    └── fromArray(data) → void        # 从二维数组加载（SGF 初始局面）
```

### 5.2 围棋规则引擎 (`shared/go-rules/Rules.js`)

```
Rules
├── static:
│   ├── tryMove(board, x, y, color) → MoveResult
│   │     # 判定落子合法性：
│   │     #  - 该点必须为空
│   │     #  - 落子后判断己方棋串气数
│   │     #  - 提对方无气棋串
│   │     #  - 禁入点（自杀禁止）
│   │     #  - 劫禁入点
│   │     # 返回 { valid, reason, capturedStones, newKoPoint }
│   │
│   ├── findGroup(board, x, y) → Group
│   │     # Flood-fill 找到相连的同色棋串
│   │
│   ├── countLiberties(board, group) → number
│   │     # 计算棋串气数
│   │
│   └── checkKo(board, x, y, color) → boolean
│         # 劫的判定
```

### 5.3 SGF 解析器 (`shared/sgf/SgfParser.js`)

SGF 格式示例（死活题）：

```
(;GM[1]FF[4]CA[UTF-8]
SZ[19]                ; 棋盘尺寸
PL[B]                 ; 先手方：黑
AB[ab][bc][cd]        ; Add Black：预设黑子
AW[bb][cc][dd]        ; Add White：预设白子
C[黑先，如何做活？]   ; 题目描述
;-- 正解分支 --
(;B[ac]C[正解：扳]
  (;W[bd]C[白挡]
   (;B[be]C[接]C[正解完成]))
)
;-- 失败分支 --
(;B[ba]C[失败：立]
  (;W[bc]C[白扳] (;B[]C[失败]))
)
)
```

解析器职责：

```
SgfParser
├── parse(sgfText) → SgfGameTree
│     # 解析 SGF 文本为游戏树
│
├── SgfGameTree
│   ├── metadata: { gameType, boardSize, charset, ... }
│   ├── setup: { blackStones[], whiteStones[], firstPlayer }
│   ├── comment: string                    # 题目描述
│   └── moves: SgfNode[]                   # 正解树/变化树
│
└── SgfNode
    ├── move: { color, x, y } | null       # 落子（研究节点可无落子）
    ├── comment: string                    # 该节点注释
    ├── correct: boolean                   # 是否正解终点
    ├── children: SgfNode[]                # 后续变化
    └── addedStones / removedStones        # 节点上的增删子（用于分支）
```

**关键设计**：利用 SGF 的树结构天然表示"正解"与"失败"分支。正解树的每条路径就是一个正确解序列。

### 5.4 解题判定引擎 (`shared/solver/SolutionChecker.js`)

```
SolutionChecker
├── constructor(solutionTree: SgfNode)
│
├── checkMove(userMove) → CheckResult
│     # 将用户的每一步与正解树匹配
│     # 返回:
│     #  - CORRECT:  此步在正解路径上
│     #  - CONTINUE: 此步在正解路径上，但未到终点，继续
│     #  - WRONG:    此步不在任何正解分支中
│     #  - IGNORE:   研究模式下的自由探索，不做判定
│
├── getCurrentNode() → SgfNode
│     # 当前在正解树中的位置
│
├── reset() → void
│     # 重置到题目起始状态
│
└── isSolved() → boolean
      # 是否到达正解终点
```

**多解支持**：正解树可以有多个分支（`children` 数组），每个分支都是一条可行解。用户的落子只要匹配任意一条正解路径即视为正确。

### 5.5 AI 对弈服务 (`server/ai/AiService.js`)

```
AiService
├── constructor(engine: GtpEngine)
│
├── async playMove(boardState, colorToMove) → Point
│     # 1. 将棋盘转为 GTP 格式
│     # 2. 调用 engine.genmove(color)
│     # 3. 返回 AI 落子坐标
│
├── async analyzePosition(boardState) → AnalysisResult
│     # 调用 KataGo 分析，返回最佳着法及胜率
│
└── async setDifficulty(level) → void
      # 调整 AI 强度（通过限制思考时间/搜索深度）
```

### 5.6 GTP 适配器 (`server/ai/GtpEngine.js`)

```
GtpEngine
├── constructor(executablePath, args)
│     # 启动引擎子进程
│
├── async sendCommand(cmd) → string
│     # 发送 GTP 命令，等待响应
│
├── async genmove(color) → string
│     # GTP: genmove B / genmove W
│
├── async play(color, vertex) → void
│     # GTP: play B D4 / play W Q16
│
├── async boardsize(n) → void
├── async clearBoard() → void
├── async setStones(stones) → void    # 设置初始局面
├── async undo() → void
└── async quit() → void
```

---

## 6. 两种模式详解

### 6.1 研究模式 (Study Mode)

```
用户行为                    系统行为
─────────                  ─────────
点击棋盘坐标     ──→  Rules.tryMove() 检查合法性
                        │
                   ┌────┴─────────────────┐
                   │ 合法                 │ 非法（禁入点等）
                   ▼                      ▼
              放置棋子              提示原因，不放子
              更新棋盘
              更新提子
                   │
                   ▼
           SolutionChecker.checkMove()
           （研究模式下 → IGNORE，不判定对错）
                   │
                   ▼
              等待用户下一步
                   │
           用户可随时：悔棋 / 重置 / 切换模式
```

**特点**：用户完全自由控制黑白双方落子，仅受基本围棋规则约束（禁入点、劫）。适合探索性研究。

### 6.2 对弈模式 (Play Mode)

```
用户行为                    系统行为
─────────                  ─────────
用户点击落黑子    ──→  Rules.tryMove() 检查合法性
                        │
                   ┌────┴──────┐
                   │ 合法       │ 非法
                   ▼            ▼
              放置黑棋子     提示，不放子
                   │
                   ▼
           SolutionChecker.checkMove()
                   │
              ┌────┴──────────────┐
              │ CORRECT/CONTINUE   │ WRONG
              ▼                    ▼
         判定是否到终点       （对弈模式：继续对弈，AI 会惩罚）
              │                  │
         ┌────┴────┐             │
         │ 到终点   │ 未到终点     │
         ▼          ▼            ▼
      解题成功    等待 AI 落子 ◄──┘
                   │
                   ▼
           AiService.playMove()
           KataGo 计算白方最佳应手
                   │
                   ▼
           Rules.tryMove(白子)
           放置白棋子，更新棋盘
                   │
                   ▼
           SolutionChecker.checkMove(白子)
           （AI 的落子也走正解树匹配，
             因为正解树已包含白方应手）
                   │
                   ▼
              等待用户下一步
```

**特点**：用户执题目的先手方，AI 执对手方。AI 的落子也会与正解树匹配——如果 AI 走了正解树中预设的白方应手，用户的下一步继续按正解树判定。

---

## 7. SGF 题目格式规范

### 7.1 扩展约定

标准 SGF 已能表达棋谱树，但死活题需要额外语义。本项目在 SGF 标准属性基础上使用以下约定：

| 属性 | 含义 | 示例 |
|------|------|------|
| `PL[]` | 先手方 | `PL[B]` = 黑先 |
| `AB[]` | 初始黑子 | `AB[ab][bc]` |
| `AW[]` | 初始白子 | `AW[bb][cc]` |
| `C[]` | 注释/题目描述 | `C[黑先做活]` |
| `LB[]` | 标注（可选，教学用） | `LB[ab:A]` |
| `RE[]` | 结果标识（正解终点） | `RE[+B]` = 黑胜/正解 |
| `N[]` | 节点名称 | `N[正解]` / `N[失败]` |

### 7.2 正解/失败标记约定

- **正解分支**：节点 `N[]` 为 `正解` 或 `RE[]` 为 `+B`/`+W`，标记为正确解终点。
- **失败分支**：节点 `N[]` 为 `失败` 或 `RE[]` 为 `-B`/`-W`，标记为错误。
- **未标记节点**：视为变化分支，不影响判定。

---

## 8. API 设计

### 8.1 REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/problems` | 获取题目列表（支持难度筛选） |
| `GET` | `/api/problems/:id` | 获取单个题目详情（含初始局面、正解树元数据） |
| `POST` | `/api/games` | 创建新对局（指定题目、模式） |
| `GET` | `/api/games/:id` | 获取对局当前状态 |
| `POST` | `/api/games/:id/move` | 用户落子 |
| `POST` | `/api/games/:id/undo` | 悔棋 |
| `POST` | `/api/games/:id/reset` | 重置到初始局面 |
| `PATCH` | `/api/games/:id/mode` | 切换模式（研究/对弈） |

### 8.2 WebSocket 事件

对弈模式下使用 WebSocket 实时通信：

| 事件方向 | 事件名 | 数据 | 说明 |
|----------|--------|------|------|
| 客户端→服务端 | `move` | `{x, y, color}` | 用户落子 |
| 服务端→客户端 | `move_result` | `{valid, board, captures, solved}` | 落子结果 |
| 服务端→客户端 | `ai_move` | `{x, y, color}` | AI 落子 |
| 服务端→客户端 | `solved` | `{correct}` | 解题成功通知 |
| 客户端→服务端 | `undo` | — | 悔棋 |
| 服务端→客户端 | `board_sync` | `{board}` | 棋盘状态同步 |

---

## 9. 棋盘渲染设计

### 9.1 渲染策略

棋盘渲染完全基于 Canvas 2D API，核心逻辑在 `shared/board-renderer/BoardRenderer.js` 中实现，**不引用 DOM 或 `document` 对象**。通过传入 Canvas Context 来实现平台无关：

```
BoardRenderer
├── constructor(ctx: CanvasRenderingContext2D, config: BoardConfig)
│
├── render(board: Board, options: RenderOptions)
│     # 绘制完整棋盘：
│     #  1. 棋盘背景（木纹色）
│     #  2. 棋盘线、星位
│     #  3. 坐标标注（可选）
│     #  4. 棋子（黑/白，含阴影）
│     #  5. 最后一手标记
│     #  6. 标注（如解题提示 A/B/C）
│
├── pixelToBoard(px, py) → {x, y}
│     # 屏幕像素坐标 → 棋盘坐标（用于点击交互）
│
└── boardToPixel(x, y) → {px, py}
      # 棋盘坐标 → 屏幕像素坐标
```

### 9.2 局部棋盘（一角）

死活题通常只涉及棋盘一角。处理方式：

- 内部棋盘仍为标准尺寸（如 19×19），但只渲染有棋子的局部区域。
- 渲染时自动计算棋子的边界框，加边距后确定可视区域。
- 坐标映射基于可视区域而非全盘。
- 边角标识：自动识别并渲染边界线（表示这是棋盘的角/边）。

---

## 10. 数据流与时序

### 10.1 典型对弈流程时序

```
用户          前端           后端           AI引擎
 │             │              │              │
 │  打开题目    │              │              │
 │────────────►│ GET /problem │              │
 │             │─────────────►│              │
 │             │  SGF解析      │              │
 │             │◄─────────────│              │
 │  渲染棋盘    │              │              │
 │◄────────────│              │              │
 │             │              │              │
 │  点击落子    │              │              │
 │────────────►│ WS: move     │              │
 │             │─────────────►│              │
 │             │              │ Rules.check  │
 │             │              │ Solver.check │
 │             │              │──── 若对弈 ──►│ genmove
 │             │              │◄─────────────│ AI着法
 │             │              │ Rules.check  │
 │             │              │ Solver.check │
 │             │◄─────────────│              │
 │  更新棋盘    │ move_result  │              │
 │  + AI落子    │ + ai_move    │              │
 │◄────────────│              │              │
 │             │              │              │
 │  ...        │              │              │
 │             │              │              │
 │  解题成功    │              │              │
 │◄────────────│ solved       │              │
```

---

## 11. 题目管理

### 11.1 题目组织

```
problems/
├── index.json              # 题目索引（自动生成）
├── beginner/
│   ├── 001-*.sgf
│   └── ...
├── intermediate/
└── advanced/
```

`index.json` 示例：

```json
{
  "problems": [
    {
      "id": "beginner-001",
      "title": "角上做活",
      "difficulty": "beginner",
      "firstPlayer": "B",
      "tags": ["做活", "角部"],
      "file": "beginner/001-corner-capture.sgf"
    }
  ]
}
```

### 11.2 题目生命周期

1. **录入**：将死活题用 SGF 编辑器（或本项目的前端编辑功能）编写为 `.sgf` 文件。
2. **验证**：加载时解析验证格式正确性、正解树完整性。
3. **索引**：启动时扫描 `problems/` 目录，生成 `index.json`。
4. **使用**：前端从索引中选取题目，加载 SGF，渲染初始局面。

---

## 12. 部署架构

### 12.1 本地开发版本

```
┌─────────────────────────────────┐
│         本地机器                 │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │ 浏览器     │  │ KataGo     │  │
│  │ (前端)     │  │ (子进程)    │  │
│  └─────┬─────┘  └─────┬──────┘  │
│        │              │         │
│        │ HTTP/WS      │ GTP     │
│        │              │ (stdio) │
│  ┌─────┴──────────────┴──────┐  │
│  │   Node.js Server (:3000)  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   problems/ (SGF 文件)    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 12.2 微信小程序版本（规划）

```
┌──────────────┐     HTTPS/WS      ┌───────────────────┐
│  微信小程序   │ ◄──────────────► │  云服务器           │
│              │                   │                   │
│ ┌──────────┐ │                   │ ┌───────────────┐ │
│ │棋盘渲染   │ │                   │ │ Node.js 服务  │ │
│ │(Canvas)  │ │                   │ │ (API + WS)    │ │
 │ └──────────┘ │                   │ └───────┬───────┘ │
│ ┌──────────┐ │                   │         │         │
│ │共享核心   │ │                   │ ┌───────┴───────┐ │
│ │(shared/) │ │                   │ │ KataGo 引擎   │ │
│ └──────────┘ │                   │ └───────────────┘ │
│              │                   │ ┌───────────────┐ │
│              │                   │ │ 题目库(SGF/DB)│ │
│              │                   │ └───────────────┘ │
└──────────────┘                   └───────────────────┘
```

**迁移要点**：
- `shared/` 目录代码可直接复制到小程序项目。
- 棋盘 Canvas 渲染逻辑不变，只需将 Web Canvas Context 替换为小程序 Canvas Context。
- 后端逻辑整体迁移至云服务器，小程序前端通过 HTTPS/WSS 调用。
- AI 引擎只能在服务端运行。

---

## 13. 开发计划

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| **P0** | 围棋规则引擎 + 棋盘渲染 + SGF 解析 | 高 |
| **P0** | 研究模式（自由落子、禁入点、悔棋） | 高 |
| **P1** | 正解树判定引擎 + 解题成功逻辑 | 高 |
| **P1** | 题目库初始化（3~5 道示例题） | 高 |
| **P2** | 对弈模式 + KataGo GTP 集成 | 中 |
| **P2** | WebSocket 实时通信 | 中 |
| **P3** | 题目编辑器（前端可视化创建题目） | 低 |
| **P3** | 难度分级、进度记录 | 低 |
| **P4** | 微信小程序适配 | 低 |

---

## 14. 关键技术风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| KataGo 安装配置复杂 | 阻塞对弈模式开发 | 研究模式先行；AI 用 GNU Go 作为简易替代 |
| 小程序 Canvas API 与 Web 有差异 | 迁移成本 | 渲染层抽象为接口，差异隔离在适配层 |
| SGF 正解树语义不够精确 | 解题判定不准 | 通过 `N[]`/`RE[]` 约定 + 验证器保证格式 |
| 局部棋盘坐标映射 | 渲染错误 | 自动边界检测算法，单元测试覆盖 |
| AI 落子偏离正解树 | 对弈模式判定异常 | 对弈模式下 AI 落子也走 Solver 匹配；若 AI 偏离正解，判定逻辑降级为仅检查用户着法 |

---

## 15. 总结

本架构以 **"共享核心 + 平台适配"** 为核心策略：

1. **纯 JS 共享层**（`shared/`）承载围棋规则、SGF 解析、正解判定、棋盘渲染——这些是业务核心，与运行平台无关。
2. **Node.js 后端**承载 API、WebSocket、AI 引擎管理——本地开发时一体化运行，部署小程序时整体迁移至服务端。
3. **前端渲染层**基于 Canvas，Web 与小程序共用同一套渲染逻辑。
4. **SGF 格式**作为题目的单一数据源，利用其树结构天然表达多解/失败分支。

这一设计确保了本地开发的高效性，同时为微信小程序部署预留了清晰的迁移路径。
