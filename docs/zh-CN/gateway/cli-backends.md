---
read_when:
    - 当 API 提供商失败时，你想要一个可靠的回退方案
    - 你正在运行 Claude CLI 或其他本地 AI CLI，并且想要复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback bridge
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退
title: CLI 后端
x-i18n:
    generated_at: "2026-04-05T10:05:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、受到速率限制或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退**。这是刻意采取的保守设计：

- **OpenClaw 工具不会被直接注入**，但设置了 `bundleMcp: true` 的后端（Claude CLI 的默认行为）可以通过 loopback MCP bridge 接收 Gateway 网关工具。
- **JSONL 流式传输**（Claude CLI 使用 `--output-format stream-json` 和 `--include-partial-messages`；提示词通过 stdin 发送）。
- **支持会话**（因此后续轮次可以保持连贯）。
- 如果 CLI 接受图像路径，**图像可以透传**。

这被设计为一个**安全兜底机制**，而不是主要路径。当你想要“不管怎样都能工作”的文本回复，而不依赖外部 API 时，可以使用它。

如果你需要具备 ACP 会话控制、后台任务、线程/对话绑定以及持久化外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**就使用 Claude CLI（内置的 Anthropic 插件会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI 也可以开箱即用（通过内置的 OpenAI 插件）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果你的 Gateway 网关在 launchd/systemd 下运行且 PATH 很精简，只需添加命令路径：

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

就是这样。除了 CLI 自身之外，不需要密钥，也不需要额外的认证配置。

如果你在 Gateway 网关主机上将内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用或 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载其所属的内置插件。

## 将其用作回退

将一个 CLI 后端添加到你的回退列表中，这样它只会在主要模型失败时运行：

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

注意：

- 如果你使用 `agents.defaults.models`（允许列表），则必须包含 `claude-cli/...`。
- 如果主要提供商失败（认证、速率限制、超时），OpenClaw 将继续尝试 CLI 后端。
- 内置的 Claude CLI 后端仍然接受更短的别名，例如 `claude-cli/opus`、`claude-cli/opus-4.6` 或 `claude-cli/sonnet`，但文档和配置示例使用规范的 `claude-cli/claude-*` 引用。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以**提供商 id** 为键（例如 `claude-cli`、`my-cli`）。
提供商 id 会成为你的模型引用左侧部分：

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
2. 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示词**。
3. 如果支持，则使用会话 id **执行 CLI**，以保持历史记录一致。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 id**，以便后续轮次复用同一个 CLI 会话。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或 `sessionArgs`（占位符 `{sessionId}`），用于需要将该 ID 插入多个标志位的情况。
- 如果 CLI 使用带有不同标志位的**恢复子命令**，请设置 `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`（用于非 JSON 的恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果没有已存储值则生成新的 UUID）。
  - `existing`：仅当之前存储过会话 id 时才发送。
  - `none`：从不发送会话 id。

串行化说明：

- `serialize: true` 会保持同一执行通道中的运行按顺序进行。
- 大多数 CLI 会在同一个提供商通道上串行执行。
- `claude-cli` 的范围更窄：恢复运行会按 Claude 会话 id 串行化，而新运行会按工作区路径串行化。彼此独立的工作区可以并行运行。
- 当后端认证状态发生变化时，包括重新登录、令牌轮换或认证配置文件凭据变更，OpenClaw 会丢弃已存储的 CLI 会话复用。

## 图像（透传）

如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图像写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将文件路径附加到提示词中（路径注入），这对于会从普通路径自动加载本地文件的 CLI 已经足够（Claude CLI 的行为）。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本和会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Claude CLI 的 `stream-json` 和 Codex CLI 的 `--json`），并提取最终智能体消息以及存在时的会话标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 会通过 stdin 发送提示词。
- 如果提示词非常长并且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（插件拥有）

内置的 Anthropic 插件为 `claude-cli` 注册了一个默认值：

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

内置的 OpenAI 插件也为 `codex-cli` 注册了一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置的 Google 插件也为 `google-gemini-cli` 注册了一个默认值：

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且能以
`gemini` 的名字在 `PATH` 中使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 缺失或为空时，用量会回退读取 `stats`。
- `stats.cached` 会被规范化为 OpenClaw 的 `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会根据
  `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖（常见情况：使用绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在属于插件接口的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍然会覆盖插件默认值。
- 后端特定的配置清理仍通过可选的 `normalizeConfig` hook 由插件负责。

## Bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过设置 `bundleMcp: true` 选择启用一个生成的 MCP 配置覆盖层。

当前的内置行为：

- `claude-cli`：`bundleMcp: true`（默认）
- `codex-cli`：无 bundle MCP 覆盖层
- `google-gemini-cli`：无 bundle MCP 覆盖层

启用 bundle MCP 后，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程
- 使用每会话令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限制在当前会话、账户和渠道上下文内
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与任何现有的后端 `--mcp-config` 合并
- 重写 CLI 参数以传递 `--strict-mcp-config --mcp-config <generated-file>`

`--strict-mcp-config` 标志可防止 Claude CLI 继承环境中的用户级或全局 MCP 服务器。如果没有启用任何 MCP 服务器，OpenClaw 仍会注入一个严格的空配置，以便后台运行保持隔离。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会将工具调用注入到 CLI 后端协议中。不过，设置了 `bundleMcp: true` 的后端（Claude CLI 的默认行为）会通过 loopback MCP bridge 接收 Gateway 网关工具，因此 Claude CLI 可以通过其原生 MCP 支持调用 OpenClaw 工具。
- **流式传输是后端特定的。** Claude CLI 使用 JSONL 流式传输（`stream-json` 配合 `--include-partial-messages`）；其他 CLI 后端可能仍然会缓冲到退出时才输出。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话**通过文本输出恢复（不是 JSONL），其结构化程度低于初始的 `--json` 运行。不过 OpenClaw 会话仍然可以正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是
  `none`（Codex CLI 当前无法使用 JSON 输出恢复）。
- **图像被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
