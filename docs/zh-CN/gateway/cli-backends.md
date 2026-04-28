---
read_when:
    - 你需要在 API 提供商失败时有一个可靠的备用方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并想复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback 桥接
summary: CLI 后端：本地 AI CLI 回退，并可选启用 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-04-28T11:50:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供商宕机、受速率限制或暂时异常时，将 **local AI CLIs** 作为**纯文本回退**运行。这是有意采用的保守设计：

- **OpenClaw 工具不会被直接注入**，但带有 `bundleMcp: true` 的后端可以通过 loopback MCP bridge 接收 Gateway 网关工具。
- 对支持的 CLI 提供 **JSONL 流式传输**。
- **支持会话**（因此后续轮次能保持连贯）。
- 如果 CLI 接受图片路径，**可以传递图片**。

这被设计为**安全网**，而不是主要路径。当你希望获得“不依赖外部 API 也总能工作”的文本响应时使用它。

如果你想要带有 ACP 会话控制、后台任务、线程/对话绑定以及持久外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**使用 Codex CLI（内置 OpenAI 插件会注册一个默认后端）：

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

就这样。除了 CLI 本身之外，不需要密钥，也不需要额外的认证配置。

如果你在 Gateway 网关主机上将内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用中或 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载拥有该后端的内置插件。

## 将它用作回退

将 CLI 后端添加到你的回退列表中，这样它只会在主要模型失败时运行：

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

每个条目都以**提供商 id** 为键（例如 `codex-cli`、`my-cli`）。
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
          serialize: true,
        },
      },
    },
  },
}
```

## 工作方式

1. 根据提供商前缀（`codex-cli/...`）**选择后端**。
2. 使用同一个 OpenClaw 提示词 + 工作区上下文**构建系统提示词**。
3. **执行 CLI**，并在支持时带上会话 id，以保持历史一致。内置 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 id**，因此后续轮次会复用同一个 CLI 会话。

<Note>
内置 Anthropic `claude-cli` 后端已重新受支持。Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此除非 Anthropic 发布新策略，否则 OpenClaw 会将此集成中的 `claude -p` 用法视为获准。
</Note>

内置 OpenAI `codex-cli` 后端会通过 Codex 的 `model_instructions_file` 配置覆盖（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 没有暴露 Claude 风格的 `--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话将组装好的提示词写入临时文件。

内置 Anthropic `claude-cli` 后端通过两种方式接收 OpenClaw skills 快照：追加系统提示词中的紧凑 OpenClaw skills 目录，以及通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件只包含该智能体/会话符合条件的 Skills，因此 Claude Code 的原生 skill 解析器会看到与 OpenClaw 原本会在提示词中通告的相同过滤集合。Skill 环境/API key 覆盖仍由 OpenClaw 应用到本次运行的子进程环境。

Claude CLI 还有自己的非交互式权限模式。OpenClaw 会将其映射到现有执行策略，而不是添加 Claude 专用配置：当实际请求的执行策略为 YOLO（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）时，OpenClaw 会添加 `--permission-mode bypassPermissions`。每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。若要强制使用不同的 Claude 模式，请在 `agents.defaults.cliBackends.claude-cli.args` 及匹配的 `resumeArgs` 下设置显式原始后端参数，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

在 OpenClaw 能使用内置 `claude-cli` 后端之前，Claude Code 本身必须已在同一主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

仅当 `claude` 二进制文件尚未位于 `PATH` 上时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`），或在需要将 ID 插入多个标志时设置 `sessionArgs`（占位符 `{sessionId}`）。
- 如果 CLI 使用带有不同标志的 **resume 子命令**，请设置 `resumeArgs`（恢复时替代 `args`），并可选设置 `resumeOutput`（用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果没有存储则使用新的 UUID）。
  - `existing`：仅在之前已存储会话 id 时发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此在活动期间，后续轮次会复用存活的 Claude 进程。温热 stdio 现在是默认值，包括省略传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。恢复前会根据现有可读项目转录验证已存储的会话 id，因此虚假绑定会以 `reason=transcript-missing` 被清除，而不是在 `--resume` 下悄悄启动新的 Claude CLI 会话。
- 已存储的 CLI 会话是提供商拥有的连续性。隐式每日会话重置不会切断它们；`/reset` 和显式 `session.reset` 策略仍然会切断。

序列化说明：

- `serialize: true` 会保持同一通道的运行有序。
- 大多数 CLI 会在一个提供商通道上序列化。
- 当所选认证身份发生变化时，OpenClaw 会放弃复用已存储的 CLI 会话，包括认证配置文件 id、静态 API key、静态 token 或 CLI 暴露的 OAuth 账户身份发生变化。OAuth access token 和 refresh token 轮换不会切断已存储的 CLI 会话。如果 CLI 未暴露稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自行执行恢复权限。

## claude-cli 会话的回退前导内容

当 `claude-cli` 尝试故障转移到 [`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会从 Claude Code 位于 `~/.claude/projects/` 的本地 JSONL 转录中提取上下文前导内容，作为下一次尝试的种子。如果没有这个种子，回退提供商会冷启动，因为 OpenClaw 自己的会话转录对 `claude-cli` 运行而言是空的。

- 前导内容优先使用最新的 `/compact` 摘要或 `compact_boundary` 标记，然后在字符预算内追加边界之后最近的轮次。边界之前的轮次会被丢弃，因为摘要已经代表了它们。
- 工具块会合并为紧凑的 `(tool call: name)` 和 `(tool result: …)` 提示，以合理控制提示词预算。如果摘要溢出，会标记为 `(truncated)`。
- 同提供商的 `claude-cli` 到 `claude-cli` 回退依赖 Claude 自己的 `--resume`，并跳过前导内容。
- 该种子复用现有 Claude 会话文件路径验证，因此无法读取任意路径。

## 图片（传递）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将文件路径追加到提示词中（路径注入），这对会从纯路径自动加载本地文件的 CLI 已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON，并提取文本 + 会话 id。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并在存在时提取最终智能体消息以及会话标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则会使用 stdin。

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

内置 Google 插件还会为 `google-gemini-cli` 注册默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并可作为 `PATH` 上的 `gemini` 使用（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON `response` 字段读取。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会从 `stats.input_tokens - stats.cached` 推导输入 token。

仅在需要时覆盖（常见情况：绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在是插件表面的一部分：

- 插件使用 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端专用的配置清理通过可选 `normalizeConfig` 钩子保持由插件拥有。

需要少量提示词/消息兼容性填补的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

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

`input` 会改写传给 CLI 的系统提示词和用户提示词。`output`
会在 OpenClaw 处理自己的控制标记和渠道投递之前，改写流式传输的助手增量和解析后的最终文本。

对于发出与 Claude Code stream-json 兼容的 JSONL 的 CLI，请在该后端的配置中设置
`jsonlDialect: "claude-stream-json"`。

## 打包 MCP 覆盖层

CLI 后端不会直接接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true`
选择启用生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：为 `mcp_servers` 提供内联配置覆盖；生成的
  OpenClaw loopback 服务器会标记 Codex 的逐服务器工具批准模式，
  因此 MCP 调用不会因本地批准提示而停滞
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用打包 MCP 后，OpenClaw 会：

- 生成一个 loopback HTTP MCP 服务器，将 gateway 工具暴露给 CLI 进程
- 使用每个会话的令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行身份验证
- 将工具访问范围限定到当前会话、账号和渠道上下文
- 为当前工作区加载已启用的打包 MCP 服务器
- 将它们与任何现有后端 MCP 配置/设置形态合并
- 使用所属插件中后端拥有的集成模式改写启动配置

如果未启用任何 MCP 服务器，当后端选择启用打包 MCP 时，OpenClaw 仍会注入严格配置，
以便后台运行保持隔离。

会话范围的打包 MCP 运行时会在会话内缓存以便复用，然后在空闲
`mcp.sessionIdleTtlMs` 毫秒后回收（默认 10 分钟；设置为 `0`
可禁用）。一次性嵌入式运行（例如身份验证探测、slug 生成和 active-memory 召回请求）会在运行结束时清理，
这样 stdio 子进程和 Streamable HTTP/SSE 流就不会在运行结束后继续存在。

## 限制

- **没有直接 OpenClaw 工具调用。** OpenClaw 不会向
  CLI 后端协议注入工具调用。后端只有在选择启用 `bundleMcp: true`
  时才会看到 gateway 工具。
- **流式传输因后端而异。** 一些后端流式传输 JSONL；另一些会缓冲到退出。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话**通过文本输出恢复（无 JSONL），其结构化程度低于初始
  `--json` 运行。OpenClaw 会话仍会正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是
  `none`（Codex CLI 目前无法使用 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并验证 CLI 支持文件路径）。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
