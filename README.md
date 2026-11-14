# 围棋死活题

交互式围棋死活题训练应用。

## 快速开始

`ash
npm install
npm start
`

打开浏览器访问 http://localhost:3000

## 功能

- 交互式围棋棋盘（Canvas 渲染，局部显示）
- 研究模式：自由落子，仅受基本规则约束（禁入点、劫）
- 对弈模式：KataGo AI 对手（需配置引擎）
- SGF 格式题目，支持多解/失败分支
- 解题判定：正解树匹配，到达正解终点即成功
- 悔棋、重置、提示功能

## 题目格式

题目以标准 SGF 格式存储在 problems/ 目录下，按难度分类。

正解终点用 N[正解] 或 RE[+B] 标记。
失败终点用 N[失败] 或 RE[-B] 标记。

## 配置 AI 引擎

编辑 server/config/engine.json，设置 enabled 为 true 并配置 KataGo 路径。

## 架构

详见 architecture.md

- shared/ — 跨平台核心逻辑（规则引擎、SGF 解析、正解判定、渲染）
- server/ — Node.js 后端（API、WebSocket、AI 服务）
- web/ — 浏览器前端
- problems/ — SGF 题目库
