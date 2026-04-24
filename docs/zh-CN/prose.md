---
read_when:
    - 你想运行或编写 `.prose` 工作流
    - 你想启用 OpenProse 插件
    - 你需要了解状态存储
summary: OpenProse：OpenClaw 中的 `.prose` 工作流、斜杠命令和状态
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T04:06:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse 是一种可移植、以 Markdown 为先的工作流格式，用于编排 AI 会话。在 OpenClaw 中，它以插件形式提供，会安装一个 OpenProse Skills 包以及一个 `/prose` 斜杠命令。程序存放在 `.prose` 文件中，并且可以通过显式控制流生成多个子智能体。

官方网站：[https://www.prose.md](https://www.prose.md)

## 它可以做什么

- 通过显式并行机制执行多智能体研究 + 综合。
- 可重复、审批安全的工作流（代码审查、事件分诊、内容流水线）。
- 可复用的 `.prose` 程序，可在受支持的智能体运行时之间运行。

## 安装 + 启用

内置插件默认处于禁用状态。启用 OpenProse：

```bash
openclaw plugins enable open-prose
```

启用插件后，重启 Gateway 网关。

开发 / 本地检出：`openclaw plugins install ./path/to/local/open-prose-plugin`

相关文档：[插件](/zh-CN/tools/plugin)、[插件清单](/zh-CN/plugins/manifest)、[Skills](/zh-CN/tools/skills)。

## 斜杠命令

OpenProse 将 `/prose` 注册为一个可由用户调用的 skill 命令。它会路由到 OpenProse VM 指令，并在底层使用 OpenClaw 工具。

常用命令：

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 示例：一个简单的 `.prose` 文件

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## 文件位置

OpenProse 将状态保存在你的工作区下的 `.prose/` 中：

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

用户级持久智能体位于：

```
~/.prose/agents/
```

## 状态模式

OpenProse 支持多种状态后端：

- **filesystem**（默认）：`.prose/runs/...`
- **in-context**：瞬态，用于小型程序
- **sqlite**（实验性）：需要 `sqlite3` 二进制文件
- **postgres**（实验性）：需要 `psql` 和连接字符串

说明：

- sqlite / postgres 为选择启用且属于实验性功能。
- postgres 凭证会流入子智能体日志；请使用专用且最小权限的数据库。

## 远程程序

`/prose run <handle/slug>` 会解析为 `https://p.prose.md/<handle>/<slug>`。
直接 URL 会按原样抓取。这会使用 `web_fetch` 工具（或针对 POST 使用 `exec`）。

## OpenClaw 运行时映射

OpenProse 程序会映射到 OpenClaw 原语：

| OpenProse 概念 | OpenClaw 工具 |
| ------------------------- | ---------------- |
| 生成会话 / Task 工具 | `sessions_spawn` |
| 文件读取 / 写入 | `read` / `write` |
| Web 抓取 | `web_fetch` |

如果你的工具允许列表阻止了这些工具，OpenProse 程序将无法运行。参见 [Skills 配置](/zh-CN/tools/skills-config)。

## 安全 + 审批

请像对待代码一样对待 `.prose` 文件。运行前先审查。使用 OpenClaw 工具允许列表和审批门控来控制副作用。

对于确定性、带审批门控的工作流，可与 [Lobster](/zh-CN/tools/lobster) 对比。

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [Markdown 格式化](/zh-CN/concepts/markdown-formatting)
