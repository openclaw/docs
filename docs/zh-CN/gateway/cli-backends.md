---
read_when:
    - 你需要在 API 提供商失败时有可靠的后备方案
    - 你正在运行本地 AI CLI，并想复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP 回环桥接
summary: CLI 后端：本地 AI CLI 回退，并可选 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-06-27T01:57:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供商宕机、受速率限制或暂时异常时，将 **local AI CLIs** 作为**纯文本后备**运行。这是有意设计得较为保守：

- **不会直接注入 OpenClaw 工具**，但带有 `bundleMcp: true`
  的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 对支持的 CLI 使用 **JSONL 流式传输**。
- **支持会话**（因此后续轮次会保持连贯）。
- 如果 CLI 接受图片路径，**可以透传图片**。

这被设计为**安全网**，而不是主要路径。当你想要“不依赖外部 API 也始终可用”的文本响应时使用它。

如果你想要带有 ACP 会话控制、后台任务、线程/对话绑定和持久外部编码会话的完整 harness 运行时，请改用
[ACP 智能体](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

<Tip>
  正在构建新的后端插件？请使用
  [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。本页面面向正在配置和操作已注册后端的用户。
</Tip>

## 适合初学者的快速开始

你可以**无需任何配置**使用 Claude Code CLI（内置的 Anthropic 插件会注册默认后端）：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

当未配置显式智能体列表时，`main` 是默认智能体 id。如果你使用多个智能体，请将其替换为你想运行的智能体 id。

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

就是这样。除了 CLI 本身之外，不需要密钥，也不需要额外的鉴权配置。

如果你在 Gateway 网关主机上将内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用中或
`agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载所属的内置插件。

## 将其用作后备

将 CLI 后端添加到你的后备列表中，这样它只会在主要模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

说明：

- 如果你使用 `agents.defaults.models`（允许列表），也必须在其中包含你的 CLI 后端模型。
- 如果主要提供商失败（鉴权、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以**提供商 id** 为键（例如 `claude-cli`、`my-cli`）。
提供商 id 会成为你的模型引用左侧：

```
<provider>/<model>
```

### 配置示例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 工作方式

1. 根据提供商前缀（`claude-cli/...`）**选择后端**。
2. 使用相同的 OpenClaw 提示词 + 工作区上下文**构建系统提示词**。
3. 使用会话 id（如果支持）**执行 CLI**，这样历史记录会保持一致。
   内置的 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 id**，因此后续轮次会复用同一个 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端已重新支持。Anthropic 员工告知我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此 OpenClaw 将
`claude -p` 用法视为此集成的许可用法，除非 Anthropic 发布新政策。
</Note>

内置的 Anthropic `claude-cli` 后端优先使用 Claude Code 的原生 skill 解析器来处理 OpenClaw skills。当当前 skills 快照包含至少一个带有实体化路径的已选 skill 时，OpenClaw 会通过 `--plugin-dir` 传入一个临时 Claude Code 插件，并从附加的系统提示词中省略重复的 OpenClaw skills 目录。如果快照没有实体化的插件 skill，OpenClaw 会保留提示词目录作为后备。Skill 环境/API 密钥覆盖仍由 OpenClaw 应用于本次运行的子进程环境。

Claude CLI 也有自己的非交互式权限模式。OpenClaw 会将其映射到现有 exec 策略，而不是添加 Claude 专用策略配置。
对于 OpenClaw 管理的 Claude live 会话，有效的 OpenClaw exec 策略具有权威性：YOLO（`tools.exec.security: "full"` 和
`tools.exec.ask: "off"`）会使用
`--permission-mode bypassPermissions` 启动 Claude，而限制性的有效 exec 策略会使用 `--permission-mode default` 启动 Claude。按智能体的
`agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。原始 Claude 后端参数仍可包含 `--permission-mode`，但 live Claude 启动会规范化该标志，使其匹配有效的 OpenClaw exec 策略。

内置的 Anthropic `claude-cli` 后端还会将 OpenClaw `/think` 级别映射到 Claude Code 的原生 `--effort` 标志（适用于非 off 级别）。`minimal` 和
`low` 映射到 `low`，`adaptive` 和 `medium` 映射到 `medium`，而 `high`、`xhigh` 和 `max` 直接映射。其他 CLI 后端需要由其所属插件声明等价的 argv 映射器，`/think` 才能影响生成的 CLI。

在 OpenClaw 可以使用内置的 `claude-cli` 后端之前，Claude Code 本身必须已经在同一主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安装需要在持久化的容器 home 中安装并登录 Claude Code，而不只是主机上。请参阅
[Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。

仅当 `claude` 二进制文件尚未位于 `PATH` 上时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请在 ID 需要插入到多个标志中时设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`）。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置
  `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果未存储，则使用新的 UUID）。
  - `existing`：仅在以前存储过会话 id 时发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"`，
  和 `input: "stdin"`，因此在 live Claude 进程处于活跃状态时，后续轮次会复用它。现在 warm stdio 是默认值，包括省略传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。在恢复前，已存储的会话 id 会根据现有可读项目 transcript 进行验证，因此幻影绑定会以 `reason=transcript-missing`
  清除，而不是在 `--resume` 下静默启动新的 Claude CLI 会话。
- Claude live 会话会保留有界 JSONL 输出保护。默认每轮最多允许 8 MiB 和 20,000 行原始 JSONL。工具密集型 Claude 轮次可以通过每后端的
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 提高限制；OpenClaw 会将这些设置限制在 64 MiB 和 100,000 行以内。
- 已存储的 CLI 会话是提供商拥有的连续性。隐式的每日会话重置不会切断它们；`/reset` 和显式 `session.reset` 策略仍会切断。
- 新 CLI 会话通常只会从 OpenClaw 的压缩摘要加压缩后尾部重新植入。为恢复在压缩前被失效的短会话，后端可以通过
  `reseedFromRawTranscriptWhenUncompacted: true` 选择启用。OpenClaw 仍会对原始 transcript 重新植入保持有界，并将其限制为安全失效场景，例如缺失 CLI transcript、系统提示词/MCP 变更或会话过期重试；鉴权配置文件或凭据 epoch 变更绝不会重新植入原始 transcript 历史。

序列化说明：

- `serialize: true` 会保持同一 lane 上的运行有序。
- 大多数 CLI 会在一个提供商 lane 上序列化。
- 当所选鉴权身份变化时，OpenClaw 会丢弃已存储的 CLI 会话复用，包括鉴权配置文件 id、静态 API 密钥、静态令牌或 CLI 暴露的 OAuth 账号身份发生变化。OAuth 访问令牌和刷新令牌轮换不会切断已存储的 CLI 会话。如果 CLI 不暴露稳定的 OAuth 账号 id，OpenClaw 会让该 CLI 强制执行恢复权限。

## 来自 claude-cli 会话的后备前置上下文

当 `claude-cli` 尝试故障转移到
[`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会用从 Claude Code 本地
JSONL transcript（位于 `~/.claude/projects/`）采集的上下文前置内容来植入下一次尝试。如果没有这个植入，后备提供商会冷启动，因为 OpenClaw 自身的会话 transcript 对 `claude-cli` 运行是空的。

- 前置内容优先使用最新的 `/compact` 摘要或 `compact_boundary`
  标记，然后在字符预算内追加边界后最近的轮次。边界前轮次会被丢弃，因为摘要已经表示了它们。
- 工具块会合并为紧凑的 `(tool call: name)` 和
  `(tool result: …)` 提示，以诚实控制提示词预算。如果摘要溢出，会标记为 `(truncated)`。
- 同提供商的 `claude-cli` 到 `claude-cli` 后备依赖 Claude 自己的
  `--resume`，并跳过前置内容。
- 该植入会复用现有 Claude 会话文件路径验证，因此不能读取任意路径。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将文件路径追加到提示词中（路径注入），这对于会从纯路径自动加载本地文件的 CLI 已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON，并提取文本 + 会话 id。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。内置 Gemini CLI 默认使用
  `stream-json`，但旧的 `--output-format json` 覆盖仍使用 JSON 解析器。
- `output: "jsonl"` 会解析 JSONL 流，并在存在时提取最终智能体消息和会话标识符。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会将提示作为最后一个 CLI 参数传入。
- `input: "stdin"` 会通过 stdin 发送提示。
- 如果提示很长且设置了 `maxPromptArgChars`，则会使用 stdin。

## 默认值（插件所有）

内置 CLI 后端默认值与其所属插件放在一起。例如，
Anthropic 拥有 `claude-cli`，Google 拥有 `google-gemini-cli`。OpenAI Codex
agent 运行通过 `openai/*` 使用 Codex app-server harness；OpenClaw 不再注册内置的
`codex-cli` 后端。

内置 Anthropic 插件会为 `claude-cli` 注册默认值：

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

内置 Google 插件也会为 `google-gemini-cli` 注册默认值：

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并能在 `PATH` 上以
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI 输出说明：

- 默认的 `stream-json` 解析器会读取 assistant `message` 事件、工具事件、
  最终 `result` 用量，以及致命 Gemini 错误事件。
- 如果你将 Gemini 参数覆盖为 `--output-format json`，OpenClaw 会把该
  后端规范化回 `output: "json"`，并从 JSON `response`
  字段读取回复文本。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token。

仅在需要时覆盖（常见情况：绝对 `command` 路径）。

## 插件所有的默认值

CLI 后端默认值现在属于插件表面的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 特定后端的配置清理通过可选的
  `normalizeConfig` 钩子继续归插件所有。

需要很小的提示/消息兼容性 shim 的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

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

`input` 会重写传给 CLI 的系统提示和用户提示。`output`
会在 OpenClaw 处理自己的控制标记和渠道投递之前，重写流式 assistant 增量和解析后的最终文本。

对于发出提供商特定 JSONL 事件的 CLI，请在该后端配置上设置 `jsonlDialect`。
支持的方言包括用于 Claude Code 兼容流的 `claude-stream-json`，以及用于 Gemini CLI `stream-json`
事件的 `gemini-stream-json`。

## 原生压缩所有权

某些 CLI 后端会运行一个压缩其**自身**转录的 agent，因此 OpenClaw 不能
对它们运行保障性摘要器，否则会与后端自己的压缩冲突，并可能使该轮次硬失败。

`claude-cli` 没有 harness 端点；Claude Code 会在内部压缩，因此它声明
`ownsNativeCompaction: true`，OpenClaw 会从压缩路径返回空操作。
Codex 等原生 harness 会话则继续路由到它们的 harness 压缩端点。

由于后端拥有压缩，过去纯粹为了防止 OpenClaw 的保障机制在
claude-cli 会话上触发而设置
`contextTokens: 1_000_000` 的临时方案**不再需要**；现在由该选择退出机制取代。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

仅为真正拥有自身压缩的后端声明 `ownsNativeCompaction`：它必须能在接近上下文窗口时可靠地限制自己的转录，并持久化可恢复会话（例如 `--resume` / `--session-id`）；否则延后的会话可能仍会超出预算。匹配 `agentHarnessId` 的会话仍会路由到 harness 端点。

## Bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true`
选择加入生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用 bundle MCP 时，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，向 CLI 进程暴露 Gateway 网关工具
- 使用每会话 token（`OPENCLAW_MCP_TOKEN`）认证桥接
- 将工具访问范围限定到当前会话、账号和渠道上下文
- 加载当前工作区已启用的 bundle-MCP 服务器
- 将它们与任何现有后端 MCP 配置/设置形状合并
- 使用所属扩展提供的后端所有集成模式重写启动配置

如果没有启用 MCP 服务器，当后端选择加入 bundle MCP 时，OpenClaw 仍会注入严格配置，以保持后台运行隔离。

会话作用域的内置 MCP 运行时会在会话内缓存复用，然后在空闲
`mcp.sessionIdleTtlMs` 毫秒后回收（默认 10
分钟；设为 `0` 可禁用）。认证探测、
slug 生成、主动记忆召回请求等一次性嵌入式运行会在运行结束时清理，避免 stdio
子进程和 Streamable HTTP/SSE 流在运行结束后仍然存活。

## 重新播种历史上限

当新的 CLI 会话从先前的 OpenClaw 转录播种时（例如在
`session_expired` 重试之后），渲染出的
`<conversation_history>` 块会被限制，避免重新播种提示膨胀。
默认值为 `12288` 个字符（约 3000 个 token）。

Claude CLI 后端会自动使用更大的上限，该上限根据解析出的
Claude 上下文层级派生。标准 200K token Claude 运行会保留更大的转录切片，
1M token Claude 运行会再次保留更大的切片，而其他 CLI
后端保持保守默认值。

- 该上限只控制重新播种提示中的先前历史块。实时会话
  输出限制在 `reliability.outputLimits` 下单独调优
  （参见 [会话](#sessions)）。

## 限制

- **没有直接 OpenClaw 工具调用。** OpenClaw 不会把工具调用注入
  CLI 后端协议。后端只有在选择加入
  `bundleMcp: true` 时才会看到 Gateway 网关工具。
- **流式传输是后端特定的。** 有些后端流式输出 JSONL；其他后端会缓冲
  到退出为止。
- **结构化输出**取决于 CLI 的 JSON 格式。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保设置了 `sessionArg`，且 `sessionMode` 不是
  `none`。
- **图片被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。

## 相关

- [Gateway 运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
