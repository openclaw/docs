---
read_when:
    - 你希望在 API 提供商发生故障时有可靠的回退方案
    - 你正在运行本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP 回环桥接机制
summary: CLI 后端：本地 AI CLI 回退方案，可选配 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-07-12T14:26:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供商不可用、受到速率限制或行为异常时，运行本地 AI CLI 作为纯文本回退方案。其设计有意保持保守：

- 不会直接注入 OpenClaw 工具，但设置了 `bundleMcp: true` 的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 对支持 JSONL 流式传输的 CLI 使用 JSONL 流式传输。
- 支持会话，因此后续轮次能够保持连贯。
- 如果 CLI 接受图像路径，则会传递图像。

请将其用作确保文本响应“始终可用”的安全网，而不是主要路径。若需要具备 ACP 会话控制、后台任务、线程/对话绑定和持久外部编码会话的完整 harness 运行时，请改用 [ACP 智能体](/zh-CN/tools/acp-agents)；CLI 后端不属于 ACP。

<Tip>
  正在构建新的后端插件？请参阅 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。本页介绍如何配置和运行已注册的后端。
</Tip>

## 快速开始

内置 Anthropic 插件注册了默认的 `claude-cli` 后端，因此只需安装 Claude Code 并完成登录，无需其他配置即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未配置显式智能体列表时，`main` 是默认智能体 ID；否则请替换为你自己的智能体 ID。

如果 Gateway 网关在 launchd/systemd 下以精简的 `PATH` 运行，请显式指定二进制文件：

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

如果你在 Gateway 网关主机上使用内置 CLI 后端作为主要消息提供商，当配置中的模型引用或 `agents.defaults.cliBackends` 下引用该后端时，OpenClaw 会自动加载拥有该后端的内置插件。

## 将其用作回退方案

将 CLI 后端添加到回退列表中，使其仅在主要模型失败时运行：

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

如果你将 `agents.defaults.models` 用作允许列表，也要将 CLI 后端模型包含在其中。当主要提供商失败（身份验证、速率限制、超时）时，OpenClaw 会接着尝试 CLI 后端。

## 配置

所有 CLI 后端都位于 `agents.defaults.cliBackends` 下，并以提供商 ID（例如 `claude-cli`、`my-cli`）作为键。提供商 ID 会成为模型引用的左侧部分：`<provider>/<model>`。

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
          // 专用提示词文件标志：
          // systemPromptFileArg: "--system-file",
          // 或者改用 Codex 风格的配置覆盖标志：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 仅当此后端可以在压缩前使用有界的原始 OpenClaw
          // 对话记录历史重新设定已失效会话的上下文时，才选择启用。
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 工作原理

1. 根据提供商前缀（`claude-cli/...`）选择后端。
2. 使用相同的 OpenClaw 提示词和工作区上下文构建系统提示词。
3. 使用会话 ID（如果支持）执行 CLI，以保持历史记录一致。内置 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程运行，并通过 stream-json stdin 发送后续轮次。
4. 解析输出（JSON 或纯文本）并返回最终文本。
5. 按后端持久化会话 ID，使后续交互复用同一个 CLI 会话。

### Claude CLI 具体说明

内置 `claude-cli` 后端优先使用 Claude Code 的原生技能解析器。当当前技能快照中至少包含一个具有实体化路径的已选技能时，OpenClaw 会通过 `--plugin-dir` 传入一个临时 Claude Code 插件，并从追加的系统提示词中省略重复的 OpenClaw 技能目录。没有实体化的插件技能时，OpenClaw 会保留提示词目录作为回退方案。技能环境变量/API key 覆盖仍会应用于此次运行的子进程环境。

Claude CLI 有自己的非交互式权限模式；OpenClaw 会将其映射到现有的 Exec 策略，而不是添加 Claude 专用配置。对于由 OpenClaw 管理的 Claude 实时会话，实际生效的 Exec 策略具有最终决定权：YOLO（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）会使用 `--permission-mode bypassPermissions` 启动 Claude，而限制性策略会使用 `--permission-mode default` 启动。每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。原始后端参数仍可包含 `--permission-mode`，但 Claude 实时启动时会规范化该标志，使其与实际生效的策略一致。

该后端还会将 OpenClaw `/think` 级别映射到 Claude Code 的原生 `--effort` 标志：`minimal`/`low` -> `low`，`medium` -> `medium`，而 `high`/`xhigh`/`max` 则直接传递。`adaptive` 会移除已配置的 `--effort` 标志且不提供替代值，因此 Claude Code 会根据自己的环境、设置和模型默认值确定实际生效的 effort。其他 CLI 后端需要由其所属插件声明等效的 argv 映射器，之后 `/think` 才会影响生成的 CLI 进程。

OpenClaw 要使用 `claude-cli`，必须先在同一主机上登录 Claude Code：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安装需要在持久化的容器主目录内安装并登录 Claude Code，而不能只在主机上操作；请参阅 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。

仅当 `claude` 二进制文件不在 `PATH` 中时，才设置 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）；如果 ID 需要出现在多个标志中，则设置 `sessionArgs`（占位符 `{sessionId}`）。
- 如果 CLI 使用具有不同标志的恢复子命令，请设置 `resumeArgs`（恢复时替换 `args`），并可选择为非 JSON 恢复设置 `resumeOutput`。
- `sessionMode`：
  - `always`：始终发送会话 ID（如果未存储，则使用新的 UUID）。
  - `existing`：仅在此前已存储会话 ID 时发送。
  - `none`：从不发送会话 ID。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此只要实时 Claude 进程仍处于活动状态，后续轮次就会复用该进程，包括省略了传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会通过已存储的 Claude 会话 ID 恢复。恢复前，会根据可读取的项目对话记录验证已存储的会话 ID；如果对话记录缺失，则会清除绑定（记录为 `reason=transcript-missing`），而不是在 `--resume` 下静默启动新会话。
- Claude 实时会话保留有界的 JSONL 输出保护：默认每轮最多 8 MiB 和 20,000 行原始 JSONL。可通过每个后端的 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 提高限制；OpenClaw 会将这些设置限制在 64 MiB 和 100,000 行以内。
- 已存储的 CLI 会话是由提供商拥有的连续性状态。隐式每日会话重置不会中断它们；`/reset` 和显式 `session.reset` 策略仍会中断。
- 新 CLI 会话通常仅从 OpenClaw 的压缩摘要以及压缩后的尾部内容重新设定上下文。为恢复在压缩前失效的短会话，后端可通过 `reseedFromRawTranscriptWhenUncompacted: true` 选择启用。原始对话记录重新设定始终受限，并且仅限于安全的失效情况，例如 CLI 对话记录缺失、孤立的工具使用尾部、消息策略/系统提示词/cwd/MCP 变更，或会话过期后的重试；身份验证配置文件或凭据版本发生变更时，绝不会使用原始对话记录历史重新设定上下文。

串行化：`serialize: true` 会保持同一通道中的运行有序（大多数 CLI 在单个提供商通道上串行运行）。当所选身份验证身份发生变化时，OpenClaw 也会放弃复用已存储的 CLI 会话，包括身份验证配置文件 ID、静态 API key、静态令牌发生变化，或 CLI 能够公开 OAuth 账户身份时该身份发生变化；仅 OAuth 访问令牌/刷新令牌轮换不会中断会话。如果 CLI 没有稳定的 OAuth 账户 ID，OpenClaw 会让该 CLI 自行执行其恢复权限。

## 来自 claude-cli 会话的回退前导上下文

当一次 `claude-cli` 尝试故障转移到 [`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会使用从 Claude Code 本地 JSONL 对话记录（位于 `~/.claude/projects/` 下，按工作区区分）中提取的上下文前导内容，为下一次尝试设定初始上下文。如果没有这些初始内容，回退提供商会从空上下文开始，因为对于 `claude-cli` 运行，OpenClaw 自己的会话对话记录为空。

- 前导上下文优先使用最新的 `/compact` 摘要或 `compact_boundary` 标记，然后在字符预算范围内追加边界之后最近的轮次。边界之前的轮次会被丢弃，因为摘要已经代表了这些内容。
- 工具块会合并为精简的 `(tool call: name)` 和 `(tool result: …)` 提示，以如实控制提示词预算；过大的摘要会被截断并标记为 `(truncated)`。
- 同一提供商内从 `claude-cli` 到 `claude-cli` 的回退依赖 Claude 自身的 `--resume`，并跳过前导上下文。
- 初始内容复用现有的 Claude 会话文件路径验证，因此无法读取任意路径。

## 图像

如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图像写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传入；否则，OpenClaw 会将文件路径追加到提示词中（路径注入），这适用于能够从纯路径自动加载本地文件的 CLI。

## 输入和输出

- `output: "text"`（默认）将 stdout 视为最终响应。
- `output: "json"` 尝试解析 JSON，并提取文本和会话 ID。
- `output: "jsonl"` 解析 JSONL 流，并在存在时提取最终智能体消息和会话标识符。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。内置 Gemini CLI 默认值使用 `stream-json`；旧的 `--output-format json` 覆盖仍使用 JSON 解析器。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传入。
- `input: "stdin"` 通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则改用 stdin。

## 插件拥有的默认值

CLI 后端默认值属于插件接口的一部分：

- 插件使用 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端专用配置清理由插件通过可选的 `normalizeConfig` 钩子负责。

Anthropic 拥有 `claude-cli`，Google 拥有 `google-gemini-cli`。OpenAI Codex 智能体运行通过 `openai/*` 使用 Codex app-server harness；OpenClaw 不再注册内置 `codex-cli` 后端。

内置 Anthropic 插件为 `claude-cli` 注册以下内容：

| 键                    | 值                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

内置 Google 插件注册到 `google-gemini-cli`：

| 键                        | 值                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 相同，并带有 `--resume {sessionId}`                                                    |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

前提条件：必须安装本地 Gemini CLI，并使其以 `gemini` 名称位于 `PATH` 中（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI 输出说明：

- 默认的 `stream-json` 解析器会读取助手 `message` 事件、工具事件、最终 `result` 用量，以及致命的 Gemini 错误事件。
- 如果你将 Gemini 参数覆盖为 `--output-format json`，OpenClaw 会将该后端重新规范化为 `output: "json"`，并从 JSON 的 `response` 字段中读取回复文本。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`；`stats.cached` 会规范化为 OpenClaw 的 `cacheRead`，如果 `stats.input` 缺失，则输入 token 数由 `stats.input_tokens - stats.cached` 得出。

仅在需要时覆盖默认值（最常见的是使用绝对 `command` 路径）。

## 文本转换叠加层

需要小型提示词/消息兼容性适配的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 会重写传递给 CLI 的系统提示词和用户提示词。`output` 会在 OpenClaw 处理自己的控制标记和渠道投递之前，重写流式助手文本和解析后的最终文本；对于由提供商支持的模型调用，它还会在流修复之后、工具执行之前，恢复结构化工具调用参数中的字符串值。原始提供商 JSON 片段保持不变；使用方应使用结构化的 partial、end 或 result 载荷。

对于发出提供商特定 JSONL 事件的 CLI，请在该后端的配置中设置 `jsonlDialect`：Claude Code 兼容流使用 `claude-stream-json`，Gemini CLI `stream-json` 事件使用 `gemini-stream-json`。

## 原生压缩所有权

某些 CLI 后端运行的智能体会自行压缩其会话记录，因此 OpenClaw 不得对它们运行安全保障摘要器——这样做会与后端自身的压缩发生冲突，并可能导致该轮次严重失败。

`claude-cli` 没有 harness 端点（Claude Code 在内部进行压缩），因此它声明 `ownsNativeCompaction: true`，OpenClaw 的压缩路径会原样返回会话条目。Codex 等原生 harness 会话仍会路由到其 harness 压缩端点。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

仅应为真正拥有压缩能力的后端声明 `ownsNativeCompaction`：它必须能可靠地将自己的会话记录限制在上下文窗口附近，并持久化可恢复的会话（例如 `--resume` / `--session-id`），否则延迟的会话可能持续超出预算。

## 内置 MCP 叠加层

CLI 后端不会直接接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true` 选择使用生成的 MCP 配置叠加层。当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件。
- `google-gemini-cli`：生成 Gemini 系统设置文件。

启用内置 MCP 后，OpenClaw 会：

- 启动一个 local loopback HTTP MCP 服务器，向 CLI 进程公开 Gateway 网关工具，并使用仅在当前执行尝试期间有效的每次运行上下文授权（`OPENCLAW_MCP_TOKEN`）进行身份验证；
- 将工具访问绑定到 Gateway 网关所选的会话、账户和渠道上下文，而不是信任子进程标头；
- 加载当前工作区中已启用的内置 MCP 服务器，并将其与任何现有后端 MCP 配置/设置结构合并；
- 使用所属插件提供的后端专属集成模式重写启动配置。

如果未启用任何 MCP 服务器，当后端选择使用内置 MCP 时，OpenClaw 仍会注入严格配置，以确保后台运行保持隔离。

会话范围的内置 MCP 运行时会在会话内缓存以供复用，然后在空闲 `mcp.sessionIdleTtlMs` 毫秒后回收（默认 10 分钟；设置为 `0` 可禁用）。身份验证探测、slug 生成和主动记忆召回等一次性嵌入式运行会请求在运行结束时清理，以免 stdio 子进程和 Streamable HTTP/SSE 流在运行结束后继续存在。

## 重建种子历史记录上限

当新的 CLI 会话使用先前的 OpenClaw 会话记录作为种子时（例如在 `session_expired` 重试之后），渲染的 `<conversation_history>` 块会受到长度限制，以防重建种子的提示词急剧膨胀。默认值为 12,288 个字符（约 3,000 个 token）。

Claude CLI 后端会改为根据解析后的 Claude 上下文窗口缩放此上限：更大的上下文窗口会获得更大的先前历史记录片段，直至固定上限；其他 CLI 后端则保留较为保守的默认值。此上限仅控制重建种子提示词中的先前历史记录块——实时会话输出限制在 `reliability.outputLimits` 下单独调整（参见[会话](#sessions)）。

## 限制

- 无法直接调用 OpenClaw 工具：OpenClaw 不会将工具调用注入 CLI 后端协议。仅当后端选择使用 `bundleMcp: true` 时，才会看到 Gateway 网关工具。
- 流式传输因后端而异：某些后端流式传输 JSONL，其他后端则缓冲至退出。
- 结构化输出取决于 CLI 自身的 JSON 格式。

## 故障排查

| 症状              | 修复方法                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| 找不到 CLI        | 将 `command` 设置为完整路径。                                           |
| 模型名称错误      | 使用 `modelAliases` 将 `provider/model` 映射到 CLI 的模型 ID。          |
| 会话无法保持连续  | 确保已设置 `sessionArg`，并且 `sessionMode` 不是 `none`。                |
| 图像被忽略        | 设置 `imageArg`，并确认 CLI 支持文件路径。                               |

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
