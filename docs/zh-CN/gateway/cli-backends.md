---
read_when:
    - 你希望在 API 提供商失败时有一个可靠的后备方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并想复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP 回环桥接
summary: CLI 后端：本地 AI CLI 回退，带可选的 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-05-10T19:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供商宕机、受到速率限制或临时异常时，将 **本地 AI CLI** 作为 **纯文本后备** 运行。这是有意采用的保守设计：

- **OpenClaw 工具不会被直接注入**，但带有 `bundleMcp: true`
  的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 对支持的 CLI 使用 **JSONL 流式传输**。
- **支持会话**（因此后续轮次能保持连贯）。
- 如果 CLI 接受图片路径，**可以传递图片**。

它被设计为 **安全网**，而不是主要路径。当你想要不依赖外部 API 的“始终可用”文本响应时使用它。

如果你需要带 ACP 会话控制、后台任务、线程/对话绑定和持久外部编码会话的完整 harness 运行时，请改用
[ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

<Tip>
  正在构建新的后端插件？请使用
  [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。本页面面向配置和操作已注册后端的用户。
</Tip>

## 适合初学者的快速开始

你可以 **不使用任何配置** 直接使用 Codex CLI（内置 OpenAI 插件会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 Gateway 网关在 launchd/systemd 下运行且 PATH 很精简，只需添加命令路径：

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

就是这样。除了 CLI 本身之外，不需要密钥，也不需要额外的认证配置。

如果你在 Gateway 网关主机上将内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用或
`agents.defaults.cliBackends`
下显式引用该后端时，OpenClaw 现在会自动加载拥有它的内置插件。

## 作为后备使用

将 CLI 后端添加到你的后备列表中，让它只在主要模型失败时运行：

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

- 如果你使用 `agents.defaults.models`（允许列表），也必须在那里包含你的 CLI 后端模型。
- 如果主要提供商失败（认证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以 **提供商 ID** 为键（例如 `codex-cli`、`my-cli`）。
提供商 ID 会成为你的模型引用左侧：

```
<provider>/<model>
```

### 示例配置

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

## 工作原理

1. 根据提供商前缀（`codex-cli/...`）**选择后端**。
2. 使用相同的 OpenClaw 提示词 + 工作区上下文**构建系统提示词**。
3. 使用会话 ID（如果支持）**执行 CLI**，以便历史保持一致。
   内置 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 ID**，让后续轮次复用同一个 CLI 会话。

<Note>
再次支持内置 Anthropic `claude-cli` 后端。Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此除非 Anthropic 发布新政策，否则 OpenClaw 会将 `claude -p` 用法视为此集成的受认可用法。
</Note>

内置 OpenAI `codex-cli` 后端通过 Codex 的 `model_instructions_file` 配置覆盖（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 没有公开 Claude 风格的
`--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话把组装后的提示词写入临时文件。

内置 Anthropic `claude-cli` 后端通过两种方式接收 OpenClaw Skills 快照：附加系统提示词中的紧凑 OpenClaw Skills 目录，以及通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件只包含该智能体/会话符合条件的 Skills，因此 Claude Code 的原生 Skills 解析器会看到与 OpenClaw 原本会在提示词中公布的相同过滤集合。Skills 环境变量/API key 覆盖仍由 OpenClaw 应用到本次运行的子进程环境中。

Claude CLI 也有自己的非交互式权限模式。OpenClaw 会将其映射到现有 exec 策略，而不是添加 Claude 专用配置：当有效请求的 exec 策略是 YOLO（`tools.exec.security: "full"` 且
`tools.exec.ask: "off"`）时，OpenClaw 会添加 `--permission-mode bypassPermissions`。
每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。要强制使用不同的 Claude 模式，请在
`agents.defaults.cliBackends.claude-cli.args` 和匹配的 `resumeArgs`
下设置显式原始后端参数，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

内置 Anthropic `claude-cli` 后端还会将 OpenClaw `/think` 等级映射到 Claude Code 原生的 `--effort` 标志，用于非 off 级别。`minimal` 和
`low` 映射为 `low`，`adaptive` 和 `medium` 映射为 `medium`，而 `high`、
`xhigh` 和 `max` 直接映射。其他 CLI 后端需要由其所属插件声明等效的 argv 映射器，`/think` 才能影响生成的 CLI。

在 OpenClaw 可以使用内置 `claude-cli` 后端之前，Claude Code 本身必须已在同一主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

仅当 `claude` 二进制文件尚未在 `PATH` 上时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`），或者当 ID 需要插入多个标志时设置
  `sessionArgs`（占位符 `{sessionId}`）。
- 如果 CLI 使用带有不同标志的 **resume 子命令**，请设置
  `resumeArgs`（恢复时替代 `args`），并可选择设置 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 ID（如果没有已存储 ID，则使用新的 UUID）。
  - `existing`：仅在之前已存储会话 ID 时发送。
  - `none`：永不发送会话 ID。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"`、
  和 `input: "stdin"`，因此后续轮次会在活动期间复用实时 Claude 进程。现在 warm stdio 是默认行为，包括省略传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会从已存储的 Claude 会话 ID 恢复。恢复前会根据现有可读项目 transcript 验证已存储会话 ID，因此幻影绑定会以 `reason=transcript-missing` 清除，而不是在 `--resume` 下静默启动新的 Claude CLI 会话。
- Claude 实时会话保留有界 JSONL 输出保护。默认每轮最多允许 8 MiB 和 20,000 行原始 JSONL。工具密集型 Claude 轮次可以通过
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 按后端提高限制；OpenClaw 会将这些设置限制到 64 MiB 和 100,000 行。
- 已存储的 CLI 会话是提供商拥有的连续性。隐式每日会话重置不会切断它们；`/reset` 和显式 `session.reset` 策略仍会切断。
- 新的 CLI 会话通常只从 OpenClaw 的压缩摘要加压缩后的尾部重新播种。为了恢复在压缩前失效的短会话，后端可以通过
  `reseedFromRawTranscriptWhenUncompacted: true` 选择加入。OpenClaw 仍会保持原始 transcript 重新播种有界，并且仅限于安全失效，例如缺失 CLI transcript、系统提示词/MCP 变更或会话过期重试；认证配置文件或凭据纪元变更绝不会重新播种原始 transcript 历史。

序列化说明：

- `serialize: true` 会保持同一通道运行有序。
- 大多数 CLI 在一个提供商通道上序列化。
- 当选定的认证身份发生变化时，OpenClaw 会放弃复用已存储的 CLI 会话，包括认证配置文件 ID、静态 API key、静态令牌，或 CLI 暴露的 OAuth 账户身份发生变化。OAuth 访问令牌和刷新令牌轮换不会切断已存储的 CLI 会话。如果 CLI 未暴露稳定的 OAuth 账户 ID，OpenClaw 会让该 CLI 强制执行恢复权限。

## 来自 claude-cli 会话的后备前导内容

当 `claude-cli` 尝试故障转移到
[`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会使用从 `~/.claude/projects/` 下 Claude Code 本地 JSONL transcript 收集到的上下文前导内容为下一次尝试播种。如果没有这个播种，后备提供商会冷启动，因为 OpenClaw 自己的会话 transcript 对 `claude-cli` 运行是空的。

- 前导内容优先使用最新的 `/compact` 摘要或 `compact_boundary`
  标记，然后在字符预算内追加最近的边界后轮次。边界前轮次会被丢弃，因为摘要已经代表了它们。
- 工具块会被合并为紧凑的 `(tool call: name)` 和
  `(tool result: …)` 提示，以保持提示词预算准确。如果摘要溢出，会标记为
  `(truncated)`。
- 同提供商的 `claude-cli` 到 `claude-cli` 后备依赖 Claude 自己的
  `--resume`，并跳过前导内容。
- 播种会复用现有 Claude 会话文件路径验证，因此无法读取任意路径。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将文件路径附加到提示词中（路径注入），这对于会从普通路径自动加载本地文件的 CLI 来说已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本 + 会话 ID。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从
  `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及存在的会话标识符。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，会使用 stdin。

## 默认值（插件拥有）

内置 OpenAI 插件还会为 `codex-cli` 注册默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置的 Google 插件也会为 `google-gemini-cli` 注册默认配置：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且能作为 `PATH` 上的
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 注意事项：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 缺失或为空时，Usage 会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw 的 `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 会根据
  `stats.input_tokens - stats.cached` 推导输入 token。

仅在需要时覆盖（常见情况：绝对 `command` 路径）。

## 插件拥有的默认配置

CLI 后端默认配置现在属于插件公开接口：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认配置。
- 后端特定的配置清理由可选的 `normalizeConfig` 钩子保持插件拥有。

需要很小的提示词/消息兼容性 shim 的插件，可以声明双向文本转换，而不必替换提供商或 CLI 后端：

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

`input` 会重写传给 CLI 的系统提示词和用户提示词。`output`
会在 OpenClaw 处理自身控制标记和渠道投递之前，重写流式 assistant 增量和解析后的最终文本。

对于会发出兼容 Claude Code stream-json 的 JSONL 的 CLI，请在该后端的配置上设置
`jsonlDialect: "claude-stream-json"`。

## 捆绑 MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true`
选择启用生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：为 `mcp_servers` 提供内联配置覆盖；生成的 OpenClaw loopback 服务器会标记 Codex 的按服务器工具审批模式，这样 MCP 调用不会因本地审批提示而停滞
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用捆绑 MCP 后，OpenClaw 会：

- 生成一个 loopback HTTP MCP 服务器，向 CLI 进程暴露 Gateway 网关工具
- 使用每会话 token（`OPENCLAW_MCP_TOKEN`）对桥接进行身份验证
- 将工具访问限定在当前会话、账号和渠道上下文内
- 为当前工作区加载已启用的捆绑 MCP 服务器
- 将它们与任何现有后端 MCP 配置/设置结构合并
- 使用拥有该后端的插件提供的集成模式重写启动配置

如果没有启用 MCP 服务器，当后端选择启用捆绑 MCP 时，OpenClaw 仍会注入严格配置，以保持后台运行隔离。

会话范围的捆绑 MCP 运行时会被缓存以便在会话内复用，然后在空闲
`mcp.sessionIdleTtlMs` 毫秒后回收（默认 10
分钟；设为 `0` 可禁用）。一次性嵌入式运行，例如身份验证探测、
slug 生成和主动记忆回忆，会在运行结束时请求清理，确保 stdio
子进程和 Streamable HTTP/SSE 流不会比本次运行存活更久。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会把工具调用注入到
  CLI 后端协议中。后端只有在选择启用 `bundleMcp: true` 时才会看到
  Gateway 网关工具。
- **流式传输是后端特定的。** 有些后端会流式传输 JSONL；其他后端会缓冲到退出。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话**通过文本输出恢复（不是 JSONL），其结构化程度低于初始的 `--json` 运行。OpenClaw 会话仍会正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，且 `sessionMode` 不是
  `none`（Codex CLI 目前无法使用 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并验证 CLI 支持文件路径）。

## 相关

- [Gateway runbook](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
