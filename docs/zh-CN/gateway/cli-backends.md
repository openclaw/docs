---
read_when:
    - 当 API 提供商失败时，你需要一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback bridge
summary: CLI 后端：本地 AI CLI 回退，支持可选的 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-04-10T12:46:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e122831eec29a5df302a7a72e57882c566398d29d6a79be924f601ce2f7a2291
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、触发速率限制或暂时行为异常时，OpenClaw 可以将**本地 AI CLI** 作为**纯文本回退**来运行。这一设计有意保持保守：

- **不会直接注入 OpenClaw 工具**，但设置了 `bundleMcp: true` 的后端可以通过 loopback MCP bridge 接收 Gateway 网关工具。
- 对支持的 CLI 提供 **JSONL 流式传输**。
- **支持会话**（因此后续轮次能够保持连贯）。
- 如果 CLI 接受图片路径，**图片可以透传**。

这被设计为一个**安全网**，而不是主要路径。当你希望获得“不管怎样都能工作”的文本响应，而不依赖外部 API 时，可以使用它。

如果你需要带有 ACP 会话控制、后台任务、线程/对话绑定以及持久化外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以在**无需任何配置**的情况下使用 Codex CLI（内置 OpenAI 插件会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果你的 Gateway 网关运行在 launchd/systemd 下，且 PATH 很精简，只需添加命令路径：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

就是这样。除 CLI 本身之外，不需要密钥，也不需要额外的凭证配置。

如果你在 Gateway 网关主机上将某个内置 CLI 后端作为**主要消息提供商**使用，那么当你的配置在模型引用或 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载其所属的内置插件。

## 将其用作回退

将一个 CLI 后端添加到你的回退列表中，这样它只会在主模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

说明：

- 如果你使用 `agents.defaults.models`（allowlist），你也必须把 CLI 后端模型包含进去。
- 如果主提供商失败（凭证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以一个**提供商 id** 为键（例如 `codex-cli`、`my-cli`）。
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
          // 对于 Codex 风格的 CLI，也可以改为指向一个提示词文件：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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

1. 根据提供商前缀（`codex-cli/...`）**选择一个后端**。
2. 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示词**。
3. 如果支持，则使用会话 id **执行 CLI**，以便历史保持一致。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 id**，以便后续轮次复用相同的 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端现已再次受支持。Anthropic 工作人员告诉我们，允许以 OpenClaw 风格使用 Claude CLI，因此除非 Anthropic 发布新的政策，否则 OpenClaw 会将 `claude -p` 用法视为此集成场景下被认可的方式。
</Note>

内置的 OpenAI `codex-cli` 后端会通过 Codex 的 `model_instructions_file` 配置覆盖项（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 不提供类似 Claude 的 `--append-system-prompt` 标志，因此对于每个新的 Codex CLI 会话，OpenClaw 都会将组装后的提示词写入一个临时文件。

内置的 Anthropic `claude-cli` 后端会通过两种方式接收 OpenClaw Skills 快照：一种是附加到系统提示词中的精简版 OpenClaw Skills 目录，另一种是通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件仅包含对该智能体/会话符合条件的 Skills，因此 Claude Code 原生的技能解析器看到的过滤集合，与 OpenClaw 否则会在提示词中公布的集合相同。对于本次运行，Skill 环境/API 密钥覆盖仍会由 OpenClaw 应用到子进程环境中。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`），用于在需要将该 ID 插入多个标志时使用。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置
  `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果没有已存储的就生成一个新的 UUID）。
  - `existing`：仅当之前已存储会话 id 时才发送。
  - `none`：从不发送会话 id。

串行化说明：

- `serialize: true` 会让同一通道上的运行保持顺序。
- 大多数 CLI 会在同一提供商通道上串行执行。
- 当后端凭证状态发生变化时，包括重新登录、令牌轮换或凭证配置文件发生变化，OpenClaw 会丢弃已存储的 CLI 会话复用状态。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将文件路径附加到提示词中（路径注入）；这对于那些可以从普通路径自动加载本地文件的 CLI 来说已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON，并提取文本与会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及存在时的会话标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（插件自有）

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
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可以通过 `PATH` 中的
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 不存在或为空时，用量会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会根据
  `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖（常见情况：使用绝对 `command` 路径）。

## 插件自有默认值

CLI 后端默认值现在是插件接口的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端的 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端特定的配置清理由可选的 `normalizeConfig` hook 继续保持为插件自有。

## Bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过设置 `bundleMcp: true` 选择接收一个生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：对 `mcp_servers` 的内联配置覆盖
- `google-gemini-cli`：生成 Gemini system settings 文件

启用 bundle MCP 时，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程
- 使用每会话令牌（`OPENCLAW_MCP_TOKEN`）对 bridge 进行认证
- 将工具访问范围限制在当前会话、账户和渠道上下文中
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与任何现有的后端 MCP 配置/设置结构合并
- 使用所属扩展中由后端自有的集成模式重写启动配置

如果没有启用任何 MCP 服务器，只要某个后端选择启用 bundle MCP，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会将工具调用注入到
  CLI 后端协议中。后端只有在选择启用 `bundleMcp: true` 时才会看到 Gateway 网关工具。
- **流式传输取决于后端。** 某些后端会流式输出 JSONL；其他后端则会缓冲直到退出。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（没有 JSONL），其结构性不如初始的 `--json` 运行。OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是
  `none`（Codex CLI 当前无法通过 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
