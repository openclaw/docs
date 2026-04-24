---
read_when:
    - 当 API 提供商失败时，你希望有一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP local loopback 桥接机制
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退机制
title: CLI 后端
x-i18n:
    generated_at: "2026-04-24T04:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、受到速率限制，或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退**。这是有意保持保守的设计：

- **不会直接注入 OpenClaw 工具**，但设置了 `bundleMcp: true` 的后端可以通过 local loopback MCP 桥接接收 Gateway 网关工具。
- 对支持的 CLI 提供 **JSONL 流式传输**。
- **支持会话**（因此后续轮次能保持连贯）。
- 如果 CLI 接受图片路径，**可以透传图片**。

这被设计为一种**安全兜底机制**，而不是主路径。当你希望获得“始终可用”的文本响应，而不依赖外部 API 时，可以使用它。

如果你需要完整的 harness 运行时，包含 ACP 会话控制、后台任务、线程/对话绑定，以及持久化的外部编码会话，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以在**无需任何配置**的情况下使用 Codex CLI（内置 OpenAI plugin 会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 Gateway 网关在 launchd/systemd 下运行，且 PATH 很精简，只需添加命令路径：

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

如果你在 Gateway 网关主机上将内置 CLI 后端用作**主要消息提供商**，当你的配置在 model ref 中或在 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载拥有该后端的内置 plugin。

## 将其用作回退

将 CLI 后端加入你的回退列表，这样它只会在主模型失败时运行：

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

说明：

- 如果你使用 `agents.defaults.models`（allowlist），你也必须在其中包含 CLI 后端模型。
- 如果主提供商失败（认证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以一个**provider id** 为键（例如 `codex-cli`、`my-cli`）。
provider id 会成为你的 model ref 左侧部分：

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
          // Codex 风格的 CLI 也可以改为指向提示文件：
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

1. 根据 provider 前缀（`codex-cli/...`）**选择后端**。
2. 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示词**。
3. **执行 CLI**，并在支持时附带会话 id，这样历史记录就能保持一致。  
   内置的 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本），并返回最终文本。
5. 为每个后端**持久化会话 id**，这样后续轮次可以复用相同的 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端现已再次受支持。Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此除非 Anthropic 发布新的政策，否则 OpenClaw 会将用于此集成的 `claude -p` 用法视为已获认可。
</Note>

内置的 OpenAI `codex-cli` 后端会通过 Codex 的 `model_instructions_file` 配置覆盖（`-c model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 没有提供像 Claude 那样的 `--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话将组装后的提示词写入临时文件。

内置的 Anthropic `claude-cli` 后端会通过两种方式接收 OpenClaw Skills 快照：一是附加系统提示词中的精简 OpenClaw Skills 目录，二是通过 `--plugin-dir` 传入的临时 Claude Code plugin。该 plugin 仅包含对该智能体/会话有效的 Skills，因此 Claude Code 的原生 skill resolver 看到的过滤后集合，与 OpenClaw 原本会在提示词中公布的集合一致。Skill 环境变量/API key 覆盖仍然由 OpenClaw 应用于该次运行的子进程环境。

Claude CLI 也有自己的非交互权限模式。OpenClaw 会将其映射到现有 exec 策略，而不是新增 Claude 专用配置：当生效的请求 exec 策略为 YOLO（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）时，OpenClaw 会添加 `--permission-mode bypassPermissions`。每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。若要强制使用其他 Claude 模式，请在 `agents.defaults.cliBackends.claude-cli.args` 以及匹配的 `resumeArgs` 下设置显式原始后端参数，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

在 OpenClaw 使用内置 `claude-cli` 后端之前，Claude Code 本身必须已经在同一主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有在 `claude` 二进制文件不在 `PATH` 中时，才需要使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或 `sessionArgs`（占位符 `{sessionId}`），以便在需要将 ID 插入多个标志时使用。
- 如果 CLI 使用带有不同标志的**resume 子命令**，请设置 `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`（用于非 JSON 的恢复场景）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果未存储，则生成新的 UUID）。
  - `existing`：仅在之前已存储会话 id 时发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，这样在其活动期间，后续轮次会复用存活的 Claude 进程。预热后的 stdio 现已成为默认行为，包括那些省略传输字段的自定义配置也是如此。如果 Gateway 网关重启，或者空闲进程退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。已存储的会话 id 会先针对现有可读的项目转录进行验证，再决定是否恢复，因此虚假的绑定会以 `reason=transcript-missing` 被清除，而不是在 `--resume` 下悄悄启动一个新的 Claude CLI 会话。
- 已存储的 CLI 会话属于 provider 所拥有的连续性。隐式的每日会话重置不会切断它们；`/reset` 和显式的 `session.reset` 策略仍然会。

序列化说明：

- `serialize: true` 会保持同一通道上的运行按顺序执行。
- 大多数 CLI 会在单个 provider 通道上串行执行。
- 当所选认证身份发生变化时，OpenClaw 会放弃复用已存储的 CLI 会话，包括 auth profile id、静态 API key、静态 token 发生变化，或当 CLI 暴露该信息时 OAuth 账户身份发生变化。OAuth access 和 refresh token 的轮换不会切断已存储的 CLI 会话。如果某个 CLI 不暴露稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自己执行恢复权限检查。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传入。如果缺少 `imageArg`，OpenClaw 会将文件路径附加到提示词中（路径注入）；对于能从普通路径自动加载本地文件的 CLI，这已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本 + 会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 中读取回复文本，并从 `stats` 中读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并在存在时提取最终的智能体消息和会话标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 会通过 stdin 发送提示词。
- 如果提示词非常长，并且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（plugin 所有）

内置 OpenAI plugin 还会为 `codex-cli` 注册一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置 Google plugin 还会为 `google-gemini-cli` 注册一个默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可通过 `PATH` 中的 `gemini` 使用（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段中读取。
- 当 `usage` 缺失或为空时，用量会回退为读取 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会根据 `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖（常见情况：使用绝对 `command` 路径）。

## plugin 所有的默认值

CLI 后端默认值现在属于 plugin 表面的一部分：

- Plugins 通过 `api.registerCliBackend(...)` 注册它们。
- 后端的 `id` 会成为 model ref 中的 provider 前缀。
- 位于 `agents.defaults.cliBackends.<id>` 的用户配置仍然会覆盖 plugin 默认值。
- 后端特定的配置清理仍由 plugin 通过可选的 `normalizeConfig` hook 拥有。

需要微小提示词/消息兼容性 shim 的 Plugins，可以声明双向文本转换，而无需替换 provider 或 CLI 后端：

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

`input` 会重写传递给 CLI 的系统提示词和用户提示词。`output` 会在 OpenClaw 处理自己的控制标记和渠道投递之前，重写流式传输的 assistant 增量内容以及解析后的最终文本。

对于输出 Claude Code stream-json 兼容 JSONL 的 CLI，请在该后端配置上设置 `jsonlDialect: "claude-stream-json"`。

## 内置 MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过设置 `bundleMcp: true` 选择加入自动生成的 MCP 配置覆盖层。

当前的内置行为：

- `claude-cli`：生成的严格 MCP 配置文件
- `codex-cli`：针对 `mcp_servers` 的内联配置覆盖；生成的 OpenClaw local loopback 服务器会标记为 Codex 的按服务器工具批准模式，因此 MCP 调用不会因本地批准提示而卡住
- `google-gemini-cli`：生成的 Gemini 系统设置文件

启用内置 MCP 时，OpenClaw 会：

- 启动一个 local loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程
- 使用每会话 token（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限定在当前会话、账户和渠道上下文内
- 为当前工作区加载已启用的内置 MCP 服务器
- 将它们与任何现有的后端 MCP 配置/设置结构合并
- 使用拥有该后端的扩展中由后端拥有的集成模式重写启动配置

如果没有启用任何 MCP 服务器，只要后端选择加入内置 MCP，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会将工具调用直接注入 CLI 后端协议。只有当后端选择加入 `bundleMcp: true` 时，后端才能看到 Gateway 网关工具。
- **流式传输取决于后端。** 一些后端会流式传输 JSONL；另一些则会缓冲到退出时。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（不是 JSONL），其结构性不如初始的 `--json` 运行。OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是 `none`（Codex CLI 当前无法使用 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
