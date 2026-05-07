---
read_when:
    - 你希望在 API 提供商发生故障时有一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP 环回桥接
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退
title: CLI 后端
x-i18n:
    generated_at: "2026-05-07T13:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

当 API 提供商宕机、受到速率限制或暂时行为异常时，OpenClaw 可以运行 **本地 AI CLI** 作为**纯文本回退**。这是刻意保守的设计：

- **OpenClaw 工具不会被直接注入**，但带有 `bundleMcp: true`
  的后端可以通过 local loopback MCP 桥接接收 Gateway 网关工具。
- 对支持它的 CLI 使用 **JSONL 流式传输**。
- **支持会话**（因此后续轮次会保持连贯）。
- 如果 CLI 接受图片路径，**可以传递图片**。

它被设计为**安全网**，而不是主要路径。当你希望获得“不依赖外部 API 也始终可用”的文本响应时使用它。

如果你想要带有 ACP 会话控制、后台任务、线程/对话绑定和持久外部编码会话的完整 harness 运行时，请改用
[ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

<Tip>
  正在构建新的后端插件？请使用
  [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。本页面面向正在配置和操作已注册后端的用户。
</Tip>

## 适合初学者的快速开始

你可以**不使用任何配置**就使用 Codex CLI（内置的 OpenAI 插件会注册默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 Gateway 网关在 launchd/systemd 下运行且 PATH 很小，只需添加命令路径：

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

就这样。除了 CLI 本身之外，不需要密钥，也不需要额外的认证配置。

如果你在 Gateway 网关主机上将内置 CLI 后端用作**主消息提供商**，当你的配置在模型引用中或
`agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载拥有它的内置插件。

## 将它用作回退

将 CLI 后端添加到你的回退列表中，让它仅在主要模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

注意：

- 如果你使用 `agents.defaults.models`（允许列表），也必须在其中包含你的 CLI 后端模型。
- 如果主要提供商失败（认证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以一个**提供商 ID**（例如 `codex-cli`、`my-cli`）作为键。
提供商 ID 会成为你的模型引用左侧：

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
          // 对于带有专用 prompt-file 标志的 CLI：
          // systemPromptFileArg: "--system-file",
          // Codex 风格的 CLI 可以改为指向提示文件：
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

## 工作方式

1. 根据提供商前缀（`codex-cli/...`）**选择后端**。
2. 使用相同的 OpenClaw 提示 + 工作区上下文**构建系统提示**。
3. 使用会话 ID（如果支持）**执行 CLI**，以便历史保持一致。
   内置的 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 ID**，因此后续轮次会复用相同的 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端再次受支持。Anthropic 员工告知我们，OpenClaw 风格的 Claude CLI 使用方式再次被允许，因此除非 Anthropic 发布新政策，否则 OpenClaw 会将此集成中的 `claude -p` 使用视为已获准。
</Note>

内置的 OpenAI `codex-cli` 后端通过 Codex 的 `model_instructions_file` 配置覆盖（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示。Codex 未暴露 Claude 风格的 `--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话将组装好的提示写入临时文件。

内置的 Anthropic `claude-cli` 后端会以两种方式接收 OpenClaw skills 快照：追加系统提示中的紧凑 OpenClaw skills 目录，以及通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件仅包含该智能体/会话符合条件的 skills，因此 Claude Code 的原生 skill 解析器看到的过滤后集合，与 OpenClaw 原本会在提示中公告的集合相同。Skill 环境变量/API 密钥覆盖仍由 OpenClaw 应用于本次运行的子进程环境。

Claude CLI 也有自己的非交互权限模式。OpenClaw 会将它映射到现有的 exec 策略，而不是添加 Claude 专用配置：当有效请求的 exec 策略是 YOLO（`tools.exec.security: "full"` 且
`tools.exec.ask: "off"`）时，OpenClaw 会添加 `--permission-mode bypassPermissions`。
每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。要强制使用不同的 Claude 模式，请在
`agents.defaults.cliBackends.claude-cli.args` 以及匹配的 `resumeArgs` 下设置显式原始后端参数，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

内置的 Anthropic `claude-cli` 后端还会将 OpenClaw `/think` 级别映射到 Claude Code 的原生 `--effort` 标志，用于非 off 级别。`minimal` 和
`low` 映射到 `low`，`adaptive` 和 `medium` 映射到 `medium`，而 `high`、
`xhigh` 和 `max` 会直接映射。其他 CLI 后端需要由其所属插件声明等效的 argv 映射器后，`/think` 才能影响生成的 CLI。

在 OpenClaw 可以使用内置的 `claude-cli` 后端之前，Claude Code 本身必须已经在同一主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

仅当 `claude` 二进制文件尚未在 `PATH` 上时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`），或在 ID 需要插入多个标志时设置
  `sessionArgs`（占位符 `{sessionId}`）。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置
  `resumeArgs`（恢复时替换 `args`）以及可选的 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 ID（如果未存储则新建 UUID）。
  - `existing`：仅当之前已存储会话 ID 时发送。
  - `none`：从不发送会话 ID。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和
  `input: "stdin"`，这样后续轮次会在实时 Claude 进程处于活动状态时复用它。Warm stdio 现在是默认值，包括省略传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会从已存储的 Claude 会话 ID 恢复。恢复前会根据现有可读项目 transcript 验证已存储的会话 ID，因此虚假绑定会以 `reason=transcript-missing` 清除，而不是在 `--resume` 下静默启动新的 Claude CLI 会话。
- Claude 实时会话会保留有界 JSONL 输出保护。默认每轮最多允许 8 MiB 和 20,000 行原始 JSONL。工具密集的 Claude 轮次可以按后端通过
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 提高它们；OpenClaw 会将这些设置限制在 64 MiB 和 100,000 行以内。
- 已存储的 CLI 会话是由提供商拥有的连续性。隐式每日会话重置不会切断它们；`/reset` 和显式 `session.reset` 策略仍然会切断。

序列化注意事项：

- `serialize: true` 会保持同一通道上的运行有序。
- 大多数 CLI 会在一个提供商通道上序列化。
- 当所选认证身份发生变化时，OpenClaw 会丢弃已存储的 CLI 会话复用，包括认证配置文件 ID、静态 API 密钥、静态令牌，或在 CLI 暴露 OAuth 账户身份时变化的该身份。OAuth 访问令牌和刷新令牌轮换不会切断已存储的 CLI 会话。如果某个 CLI 未暴露稳定的 OAuth 账户 ID，OpenClaw 会让该 CLI 自行执行恢复权限。

## 来自 claude-cli 会话的回退前导内容

当 `claude-cli` 尝试故障转移到
[`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会使用从 `~/.claude/projects/` 下 Claude Code 本地 JSONL transcript 中采集的上下文前导内容为下一次尝试播种。没有这个种子，回退提供商会冷启动，因为 OpenClaw 自己的会话 transcript 对 `claude-cli` 运行来说是空的。

- 前导内容优先使用最新的 `/compact` 摘要或 `compact_boundary`
  标记，然后在字符预算内追加边界之后最近的轮次。边界前的轮次会被丢弃，因为摘要已经表示了它们。
- 工具块会合并为紧凑的 `(tool call: name)` 和
  `(tool result: …)` 提示，以如实控制提示预算。如果摘要溢出，会标记为
  `(truncated)`。
- 同提供商的 `claude-cli` 到 `claude-cli` 回退依赖 Claude 自己的
  `--resume`，并跳过前导内容。
- 该种子会复用现有的 Claude 会话文件路径验证，因此无法读取任意路径。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传入。如果缺少 `imageArg`，OpenClaw 会将文件路径追加到提示中（路径注入），这对于会从普通路径自动加载本地文件的 CLI 来说已经足够。

## 输入/输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本 + 会话 ID。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从
  `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及存在的会话标识符。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示。
- 如果提示很长且设置了 `maxPromptArgChars`，则会使用 stdin。

## 默认值（插件拥有）

内置的 OpenAI 插件还会为 `codex-cli` 注册默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置的 Google 插件还会为 `google-gemini-cli` 注册默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可在 `PATH` 上作为
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 注意事项：

- 回复文本从 JSON `response` 字段读取。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`。
- `stats.cached` 会规范化为 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。

仅在需要时覆盖（常见情况：绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在属于插件接口面：

- 插件使用 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端特定的配置清理仍由插件通过可选的
  `normalizeConfig` 钩子拥有。

需要小型提示词/消息兼容性 shim 的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

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

`input` 会重写传递给 CLI 的系统提示词和用户提示词。`output`
会在 OpenClaw 处理自己的控制标记和渠道投递之前，重写流式传输的助手增量和解析后的最终文本。

对于发出与 Claude Code stream-json 兼容的 JSONL 的 CLI，请在该后端的配置中设置
`jsonlDialect: "claude-stream-json"`。

## 内置 MCP 叠加层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过
`bundleMcp: true` 选择加入生成的 MCP 配置叠加层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：针对 `mcp_servers` 的内联配置覆盖；生成的
  OpenClaw loopback 服务器会标记 Codex 的按服务器工具审批模式，
  因此 MCP 调用不会因本地审批提示而停滞
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用内置 MCP 后，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程
- 使用按会话 token（`OPENCLAW_MCP_TOKEN`）对桥接进行身份验证
- 将工具访问范围限定在当前会话、账号和渠道上下文中
- 为当前工作区加载已启用的内置 MCP 服务器
- 将它们与任何现有后端 MCP 配置/设置形态合并
- 使用拥有该后端的插件提供的后端所属集成模式重写启动配置

如果没有启用 MCP 服务器，当后端选择加入内置 MCP 时，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

会话作用域的内置 MCP 运行时会在会话内缓存以便复用，然后在空闲
`mcp.sessionIdleTtlMs` 毫秒后回收（默认 10 分钟；设置为 `0` 可禁用）。一次性嵌入运行（例如认证探测、
slug 生成和主动记忆召回）会在运行结束时请求清理，因此 stdio
子进程和 Streamable HTTP/SSE 流不会比该次运行存活更久。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会把工具调用注入到
  CLI 后端协议中。后端只有在选择加入 `bundleMcp: true` 时才会看到
  Gateway 网关工具。
- **流式传输因后端而异。** 某些后端流式传输 JSONL；其他后端会缓冲到退出。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话**通过文本输出恢复（无 JSONL），其结构化程度低于初始
  `--json` 运行。OpenClaw 会话仍会正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，且 `sessionMode` 不是
  `none`（Codex CLI 目前无法使用 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并验证 CLI 支持文件路径）。

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
