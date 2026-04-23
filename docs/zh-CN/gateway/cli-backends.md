---
read_when:
    - 当 API 提供商失败时，你希望有一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback 桥接机制
summary: CLI 后端：本地 AI CLI 回退机制，可选 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-04-23T14:54:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、触发速率限制或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI**作为**纯文本回退**。这项设计刻意保持保守：

- **OpenClaw 工具不会被直接注入**，但带有 `bundleMcp: true` 的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 对支持该能力的 CLI 提供 **JSONL 流式传输**。
- **支持会话**（因此后续轮次可以保持连贯）。
- 如果 CLI 接受图片路径，**图片也可以透传**。

这被设计为一种**安全兜底机制**，而不是主路径。当你想要“不依赖外部 API 也始终可用”的文本响应时，可以使用它。

如果你需要具备 ACP 会话控制、后台任务、线程/对话绑定以及持久化外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**使用 Codex CLI（内置的 OpenAI 插件会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果你的 Gateway 网关运行在 launchd/systemd 下且 `PATH` 很精简，只需添加命令路径：

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

就是这样。除了 CLI 自身之外，不需要密钥，也不需要额外的认证配置。

如果你在 Gateway 网关主机上把某个内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用中或在 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载其所属的内置插件。

## 将它用作回退

将 CLI 后端加入你的回退列表，这样它只会在主模型失败时运行：

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

- 如果你使用 `agents.defaults.models`（允许列表），也必须把你的 CLI 后端模型包含进去。
- 如果主提供商失败（认证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

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
          // 对于 Codex 风格的 CLI，也可以改为指向一个提示文件：
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

1. 根据提供商前缀（`codex-cli/...`）**选择后端**。
2. 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示词**。
3. 使用会话 id（如果支持）**执行 CLI**，以保持历史一致。
   内置的 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 id**，以便后续轮次复用同一个 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端现已再次受支持。Anthropic 员工告诉我们，再次允许 OpenClaw 风格的 Claude CLI 用法，因此除非 Anthropic 发布新的策略，否则 OpenClaw 会将这种用于该集成的 `claude -p` 用法视为已获认可。
</Note>

内置的 OpenAI `codex-cli` 后端会通过 Codex 的 `model_instructions_file` 配置覆盖项（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 并未提供 Claude 风格的 `--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话将组装后的提示词写入临时文件。

内置的 Anthropic `claude-cli` 后端以两种方式接收 OpenClaw Skills 快照：一种是追加系统提示词中的精简 OpenClaw Skills 目录，另一种是通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件只包含对当前智能体/会话有资格使用的 Skills，因此 Claude Code 的原生 skill 解析器看到的过滤后集合，与 OpenClaw 原本会在提示词中公布的集合相同。Skills 的 env/API 密钥覆盖仍然由 OpenClaw 应用于本次运行的子进程环境。

在 OpenClaw 能使用内置 `claude-cli` 后端之前，Claude Code 本身必须已经在同一主机上完成登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有当 `claude` 二进制文件不在 `PATH` 上时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`），用于需要将该 id 插入多个标志的情况。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置
  `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果未存储则生成新的 UUID）。
  - `existing`：只有先前已存储时才发送会话 id。
  - `none`：永不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此只要进程仍然活跃，后续轮次就会复用这个活动中的 Claude 进程。现在默认就是 warm stdio，包括那些省略传输字段的自定义配置。如果 Gateway 网关重启，或空闲进程退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。在恢复前，已存储的会话 id 会先与现有且可读的项目转录记录进行校验，因此虚假的绑定会以 `reason=transcript-missing` 被清除，而不是在 `--resume` 下悄悄启动一个新的 Claude CLI 会话。
- 已存储的 CLI 会话属于提供商拥有的连续性。隐式的每日会话重置不会切断它们；`/reset` 和显式的 `session.reset` 策略仍然会切断。

序列化说明：

- `serialize: true` 会保持同一 lane 中的运行顺序。
- 大多数 CLI 会在一个提供商 lane 上串行化。
- 当所选认证身份发生变化时，OpenClaw 会放弃复用已存储的 CLI 会话，包括认证配置文件 id 变化、静态 API 密钥变化、静态令牌变化，或当 CLI 暴露该信息时 OAuth 账户身份变化。OAuth 访问令牌和刷新令牌轮换不会切断已存储的 CLI 会话。如果某个 CLI 没有暴露稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自行决定恢复权限。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传入。如果缺少 `imageArg`，OpenClaw 会把文件路径追加到提示词中（路径注入）；对于那些能从普通路径自动加载本地文件的 CLI，这已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本与会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及存在时的会话标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 会通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（插件拥有）

内置的 OpenAI 插件也为 `codex-cli` 注册了一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置的 Google 插件也为 `google-gemini-cli` 注册了一个默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可通过 `PATH` 中的
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会通过
  `stats.input_tokens - stats.cached` 推导输入 token 数。

只有在需要时才覆盖这些默认值（常见情况：使用绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在属于插件表面的一部分：

- 插件使用 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- 用户在 `agents.defaults.cliBackends.<id>` 中的配置仍然会覆盖插件默认值。
- 后端特定的配置清理仍由插件通过可选的 `normalizeConfig` hook 负责。

需要微小提示词/消息兼容性 shim 的插件，可以声明双向文本转换，而无需替换某个提供商或 CLI 后端：

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` 会重写传给 CLI 的系统提示词和用户提示词。`output` 会在 OpenClaw 处理其自身控制标记和渠道投递之前，重写流式传输的 assistant 增量以及解析后的最终文本。

对于输出 Claude Code stream-json 兼容 JSONL 的 CLI，请在该后端配置上设置
`jsonlDialect: "claude-stream-json"`。

## Bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过设置 `bundleMcp: true` 选择加入一个生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：为 `mcp_servers` 提供内联配置覆盖
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用 bundle MCP 后，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，向 CLI 进程暴露 Gateway 网关工具
- 使用每会话令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限定在当前会话、账户和渠道上下文中
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与现有的后端 MCP 配置/设置结构合并
- 使用所属扩展中由后端拥有的集成模式重写启动配置

如果没有启用任何 MCP 服务器，当某个后端选择加入 bundle MCP 时，OpenClaw 仍会注入严格配置，以确保后台运行保持隔离。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会将工具调用注入到 CLI 后端协议中。后端只有在选择加入 `bundleMcp: true` 时，才会看到 Gateway 网关工具。
- **流式传输是后端特定的。** 有些后端会流式输出 JSONL；另一些则会缓冲到退出时才输出。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（不是 JSONL），其结构化程度低于初始的 `--json` 运行。不过 OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是
  `none`（Codex CLI 当前无法使用 JSON 输出进行恢复）。
- **图片被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
