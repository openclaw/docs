---
read_when:
    - 你想运行或编写 .prose 工作流文件
    - 你想启用 OpenProse 插件
    - 你需要了解 OpenProse 如何映射到 OpenClaw 原语
sidebarTitle: OpenProse
summary: OpenProse 是一种 Markdown 优先的工作流格式，用于多智能体 AI 会话。在 OpenClaw 中，它作为插件提供，包含 /prose 斜杠命令和 Skills 包。
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T03:00:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse 是一种可移植、Markdown 优先的工作流格式，用于编排 AI
会话。在 OpenClaw 中，它作为插件提供，会安装 OpenProse skill
包和 `/prose` 斜杠命令。程序位于 `.prose` 文件中，并且可以
通过显式控制流生成多个子智能体。

<CardGroup cols={3}>
  <Card title="安装" icon="download" href="#install">
    启用 OpenProse 插件并重启 Gateway 网关。
  </Card>
  <Card title="运行程序" icon="play" href="#slash-command">
    使用 `/prose run` 执行 `.prose` 文件或远程程序。
  </Card>
  <Card title="编写程序" icon="pencil" href="#example">
    使用并行和顺序步骤编写多 Agent 工作流。
  </Card>
</CardGroup>

## 安装

<Steps>
  <Step title="启用插件">
    内置插件默认禁用。启用 OpenProse：

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="验证">
    ```bash
    openclaw plugins list | grep prose
    ```

    你应该会看到 `open-prose` 已启用。`/prose` skill 命令现在
    可在聊天中使用。

  </Step>
</Steps>

对于本地检出：`openclaw plugins install ./path/to/local/open-prose-plugin`

## 斜杠命令

OpenProse 将 `/prose` 注册为用户可调用的 skill 命令：

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` 会解析为 `https://p.prose.md/<handle>/<slug>`。
直接 URL 会按原样使用 `web_fetch` 工具获取。

顶层远程运行是显式的。`.prose` 程序中的远程导入是
传递性代码依赖：在 OpenProse 获取任何远程 `use` 目标之前，
它会显示已解析的导入列表，并要求操作者在该次运行中精确回复
`approve remote prose imports`。

## 它能做什么

- 通过显式并行实现多 Agent 研究和综合。
- 可重复、审批安全的工作流（代码审查、事件分诊、内容流水线）。
- 可复用的 `.prose` 程序，可在支持的 Agent Runtimes 中运行。

## 示例：并行研究和综合

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

## OpenClaw 运行时映射

OpenProse 程序会映射到 OpenClaw 基元：

| OpenProse 概念         | OpenClaw 工具    |
| ------------------------- | ---------------- |
| 生成会话 / 任务工具 | `sessions_spawn` |
| 文件读取 / 写入         | `read` / `write` |
| Web 获取                 | `web_fetch`      |

<Warning>
  如果你的工具允许列表阻止 `sessions_spawn`、`read`、`write` 或
  `web_fetch`，OpenProse 程序将失败。请检查你的
  [工具允许列表配置](/zh-CN/gateway/config-tools)。
</Warning>

## 文件位置

OpenProse 会将状态保存在你的工作区中的 `.prose/` 下：

```text
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

用户级持久 Agent 位于：

```text
~/.prose/agents/
```

## 状态后端

<AccordionGroup>
  <Accordion title="filesystem（默认）">
    状态会写入工作区中的 `.prose/runs/...`。不需要额外
    依赖。
  </Accordion>
  <Accordion title="上下文内">
    暂态状态保留在上下文窗口中。适用于小型、短生命周期的
    程序。
  </Accordion>
  <Accordion title="sqlite（实验性）">
    要求 `sqlite3` 二进制文件位于 `PATH` 上。
  </Accordion>
  <Accordion title="postgres（实验性）">
    要求 `psql` 和连接字符串。

    <Warning>
      Postgres 凭据会流入子智能体日志。请使用专用的、
      最小权限数据库。
    </Warning>

  </Accordion>
</AccordionGroup>

## 安全

像对待代码一样对待 `.prose` 文件。运行前请审查它们，包括远程
`use` 导入。顶层 `/prose run https://...` 请求是显式的，但
传递性远程导入在获取或执行之前需要按次运行审批。使用 OpenClaw 工具
允许列表和审批门来控制副作用。对于确定性的、带审批门的工作流，请与
[Lobster](/zh-CN/tools/lobster) 对比。

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills 参考" href="/zh-CN/tools/skills" icon="puzzle-piece">
    OpenProse 的 skill 包如何加载以及适用哪些门控。
  </Card>
  <Card title="子智能体" href="/zh-CN/tools/subagents" icon="users">
    OpenClaw 的原生多 Agent 协调层。
  </Card>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="volume-high">
    为你的工作流添加音频输出。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    所有可用聊天命令，包括 /prose。
  </Card>
</CardGroup>

官方网站：[https://www.prose.md](https://www.prose.md)
