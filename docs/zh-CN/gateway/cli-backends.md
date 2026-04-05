---
read_when:
    - 当 API 提供商失败时，你想要一个可靠的回退方案
    - 你正在运行 Claude CLI 或其他本地 AI CLI，并希望复用它们
    - 你需要一条纯文本、无工具的路径，但仍支持会话和图像
summary: CLI 后端：通过本地 AI CLI 提供纯文本回退
title: CLI 后端
x-i18n:
    generated_at: "2026-04-05T08:23:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bb5f4481c48e989d7dda0205c102b08943d4bedf69fa4679830e32cedba36dd
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、被限流或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退**。这条路径刻意保持保守：

- **工具已禁用**（不会发生工具调用）。
- **文本输入 → 文本输出**（可靠；启用时支持 Claude CLI 的部分文本流式传输）。
- **支持会话**（这样后续轮次能保持连贯）。
- 如果 CLI 接受图像路径，**图像也可以透传**。

这被设计为一种**安全网**，而不是主要路径。当你想要“不依赖外部 API 也始终可用”的文本响应时，就使用它。

如果你需要完整的 harness 运行时，包括 ACP 会话控制、后台任务、线程 / 对话绑定以及持久化的外部编码会话，请改用
[ACP Agents](/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**就使用 Claude CLI（内置 Anthropic 插件会注册默认后端）：

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI 也开箱即用（通过内置 OpenAI 插件）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果你的 Gateway 网关运行在 launchd / systemd 下，而 PATH 很精简，只需添加命令路径：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

就是这样。除了 CLI 本身之外，不需要 key，也不需要额外认证配置。

如果你在 Gateway 网关主机上将某个内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用或
`agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载对应的内置插件。

## 将其用作回退

将某个 CLI 后端加入你的回退列表，这样它只会在主要模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

说明：

- 如果你使用 `agents.defaults.models`（允许列表），则必须包含 `claude-cli/...`。
- 如果主要提供商失败（认证、限流、超时），OpenClaw 就会
  接着尝试 CLI 后端。
- 内置的 Claude CLI 后端仍接受更短的别名，例如
  `claude-cli/opus`、`claude-cli/opus-4.6` 或 `claude-cli/sonnet`，但文档
  和配置示例使用规范的 `claude-cli/claude-*` 引用。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以一个**提供商 id** 为键（例如 `claude-cli`、`my-cli`）。
这个提供商 id 会成为你的模型引用左侧部分：

```
<provider>/<model>
```

### 配置示例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 工作原理

1. 根据提供商前缀（`claude-cli/...`）**选择后端**。
2. 使用相同的 OpenClaw 提示词 + 工作区上下文**构建系统提示词**。
3. 使用会话 id（如果支持）**执行 CLI**，以便保持历史一致。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 为每个后端**持久化会话 id**，以便后续轮次复用同一个 CLI 会话。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（当需要将 `{sessionId}` 插入到多个 flag 时使用）。
- 如果 CLI 使用带有不同 flag 的**resume 子命令**，请设置
  `resumeArgs`（恢复时会替换 `args`），并可选设置 `resumeOutput`
  （适用于非 JSON 的恢复输出）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果没有已存储值，则生成新的 UUID）。
  - `existing`：仅在之前已存储会话 id 时才发送。
  - `none`：永不发送会话 id。

串行化说明：

- `serialize: true` 会让同一条 lane 上的运行保持有序。
- 大多数 CLI 会在一个提供商 lane 上串行化。
- `claude-cli` 更窄：恢复运行会按 Claude 会话 id 串行化，而全新运行会按工作区路径串行化。独立工作区可以并行运行。
- 当后端认证状态发生变化时，包括重新登录、token 轮换或认证配置文件中的凭证发生变化，OpenClaw 会丢弃已存储的 CLI 会话复用。

## 图像（透传）

如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图像写入临时文件。如果设置了 `imageArg`，这些路径
会作为 CLI 参数传入。如果缺少 `imageArg`，OpenClaw 会将
文件路径附加到提示词中（路径注入），这对于会从普通路径自动加载本地文件的 CLI 来说已经足够
（Claude CLI 的行为就是如此）。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本 + 会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Claude CLI 的 `stream-json`
  和 Codex CLI 的 `--json`），并提取最终智能体消息以及存在时的会话
  标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 会通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（由插件拥有）

内置 Anthropic 插件会为 `claude-cli` 注册一个默认值：

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

内置 OpenAI 插件也会为 `codex-cli` 注册一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置 Google 插件也会为 `google-gemini-cli` 注册一个默认值：

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可通过
`PATH` 中的 `gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`。
- `stats.cached` 会被标准化为 OpenClaw 的 `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。

仅在需要时覆盖（常见情况：使用绝对 `command` 路径）。

## 由插件拥有的默认值

CLI 后端默认值现在是插件表面的一部分：

- 插件使用 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- 用户在 `agents.defaults.cliBackends.<id>` 中的配置仍会覆盖插件默认值。
- 后端特定的配置清理仍通过可选的
  `normalizeConfig` hook 由插件拥有。

## 内置 MCP overlay

CLI 后端仍然**不会**接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true` 选择加入生成的 MCP 配置 overlay。

当前的内置行为：

- `claude-cli`：`bundleMcp: true`
- `codex-cli`：无内置 MCP overlay
- `google-gemini-cli`：无内置 MCP overlay

启用内置 MCP 时，OpenClaw 会：

- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与现有后端的 `--mcp-config` 合并
- 重写 CLI 参数以传入 `--strict-mcp-config --mcp-config <generated-file>`

如果没有启用任何 MCP 服务器，OpenClaw 仍会注入一个严格的空配置。
这可以防止后台 Claude CLI 运行意外继承环境中的用户 / 全局 MCP
服务器。

## 限制

- **没有 OpenClaw 工具**（CLI 后端永远不会收到工具调用）。某些 CLI
  仍可能运行它们自己的智能体工具。带有 `bundleMcp: true`
  的后端仍可以接收生成的 MCP 配置 overlay，以供其自身 CLI 原生 MCP
  支持使用。
- **流式传输是后端特定的**。Claude CLI 会从
  `stream-json` 转发部分文本；其他 CLI 后端仍可能要等到退出后才输出。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（没有 JSONL），其结构性
  不如初始的 `--json` 运行。但 OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保设置了 `sessionArg`，且 `sessionMode` 不为
  `none`（Codex CLI 当前无法用 JSON 输出进行恢复）。
- **图像被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
