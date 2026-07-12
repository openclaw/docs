---
read_when:
    - 你希望在 API 提供商发生故障时有可靠的回退方案
    - 你正在运行本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback 桥接机制
summary: CLI 后端：本地 AI CLI 回退方案，可选配 MCP 工具桥接器
title: CLI 后端
x-i18n:
    generated_at: "2026-07-11T20:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供商宕机、受到速率限制或行为异常时，运行本地 AI CLI 作为纯文本后备方案。此功能有意采取保守策略：

- 不会直接注入 OpenClaw 工具，但设置了 `bundleMcp: true` 的后端可以通过环回 MCP 桥接接收 Gateway 网关工具。
- 对支持 JSONL 流式传输的 CLI 使用该格式。
- 支持会话，因此后续轮次可以保持上下文连贯。
- 如果 CLI 接受图片路径，图片会被传递给它。

请将其用作“始终可用”的文本响应安全保障，而不是主要路径。如需具备 ACP 会话控制、后台任务、线程/对话绑定和持久化外部编码会话的完整 harness 运行时，请改用 [ACP 智能体](/zh-CN/tools/acp-agents)；CLI 后端并不是 ACP。

<Tip>
  正在构建新的后端插件？请参阅 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。本页介绍如何配置和运行已注册的后端。
</Tip>

## 快速开始

内置 Anthropic 插件会注册默认的 `claude-cli` 后端，因此只要安装 Claude Code 并完成登录，无需其他配置即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

如果未配置明确的智能体列表，`main` 是默认智能体 ID；否则请替换为你自己的智能体 ID。

如果 Gateway 网关在仅有最小化 `PATH` 的 launchd/systemd 环境下运行，请明确指定二进制文件：

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

如果你在 Gateway 网关主机上使用内置 CLI 后端作为主要消息提供商，并且配置中的模型引用或 `agents.defaults.cliBackends` 引用了该后端，OpenClaw 会自动加载拥有该后端的内置插件。

## 用作后备方案

将 CLI 后端添加到后备列表，使其仅在主要模型失败时运行：

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

如果你将 `agents.defaults.models` 用作允许列表，也要在其中加入 CLI 后端模型。当主要提供商失败时（身份验证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置

所有 CLI 后端均位于 `agents.defaults.cliBackends` 下，并以提供商 ID（例如 `claude-cli`、`my-cli`）作为键。提供商 ID 将成为模型引用的左侧部分：`<provider>/<model>`。

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
          // 或改用 Codex 风格的配置覆盖标志：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 仅当此后端可以在压缩前使用有界的原始 OpenClaw
          // 记录历史重新填充已失效会话时，才选择启用。
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
3. 使用会话 ID（如果支持）执行 CLI，以保持历史记录一致。内置 `claude-cli` 后端会为每个 OpenClaw 会话维持一个 Claude stdio 进程，并通过 stream-json 标准输入发送后续轮次。
4. 解析输出（JSON 或纯文本）并返回最终文本。
5. 按后端持久化会话 ID，使后续轮次可以复用同一个 CLI 会话。

### Claude CLI 具体说明

内置 `claude-cli` 后端优先使用 Claude Code 的原生技能解析器。当当前技能快照中至少有一个选定技能具有已实体化路径时，OpenClaw 会通过 `--plugin-dir` 传入临时 Claude Code 插件，并从追加的系统提示词中省略重复的 OpenClaw 技能目录。如果没有已实体化的插件技能，OpenClaw 会保留提示词目录作为后备。运行期间，技能的环境变量/API 密钥覆盖仍会应用于子进程环境。

Claude CLI 有自己的非交互式权限模式；OpenClaw 会将其映射到现有 Exec 策略，而不是添加 Claude 专用配置。对于由 OpenClaw 管理的 Claude 实时会话，实际生效的 Exec 策略具有最终决定权：YOLO（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）会使用 `--permission-mode bypassPermissions` 启动 Claude，而限制性策略会使用 `--permission-mode default` 启动。每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。原始后端参数仍可包含 `--permission-mode`，但实时 Claude 启动会将该标志规范化，使其与实际生效的策略一致。

该后端还会将 OpenClaw 的 `/think` 级别映射到 Claude Code 的原生 `--effort` 标志：`minimal`/`low` -> `low`，`medium` -> `medium`，而 `high`/`xhigh`/`max` 则直接传递。`adaptive` 会移除已配置的 `--effort` 标志且不提供替代值，因此 Claude Code 会根据自身的环境、设置和模型默认值确定实际生效的强度。其他 CLI 后端需要由其所属插件声明等效的 argv 映射器，`/think` 才会影响生成的 CLI 进程。

OpenClaw 必须先在同一主机上登录 Claude Code，才能使用 `claude-cli`：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安装需要在持久化的容器主目录内安装并登录 Claude Code，而不能只在主机上完成；请参阅 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。

仅当 `claude` 二进制文件尚未位于 `PATH` 中时，才设置 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）；当 ID 需要出现在多个标志中时，则设置 `sessionArgs`（使用占位符 `{sessionId}`）。
- 如果 CLI 使用带有不同标志的恢复子命令，请设置 `resumeArgs`（恢复时替换 `args`），并可选择为非 JSON 恢复设置 `resumeOutput`。
- `sessionMode`：
  - `always`：始终发送会话 ID（如果没有已存储的 ID，则使用新的 UUID）。
  - `existing`：仅在之前存储过会话 ID 时发送。
  - `none`：从不发送会话 ID。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此在实时 Claude 进程处于活动状态时，后续轮次会复用该进程，包括省略传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会根据存储的 Claude 会话 ID 恢复。恢复前会根据可读取的项目记录验证存储的会话 ID；如果记录缺失，则清除绑定（日志记为 `reason=transcript-missing`），而不是在 `--resume` 下静默启动新会话。
- Claude 实时会话会保留有界 JSONL 输出防护：默认每轮最多 8 MiB 和 20,000 行原始 JSONL。可以通过每个后端的 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 提高限制；OpenClaw 会将这些设置限制在 64 MiB 和 100,000 行以内。
- 存储的 CLI 会话是由提供商拥有的连续上下文。隐式的每日会话重置不会中断它们；`/reset` 和明确的 `session.reset` 策略仍会中断。
- 新的 CLI 会话通常只会根据 OpenClaw 的压缩摘要和压缩后的尾部内容重新填充。为了恢复在压缩前失效的短会话，后端可以通过 `reseedFromRawTranscriptWhenUncompacted: true` 选择启用该功能。原始记录重新填充始终有界，并且仅限于安全的失效情况，例如 CLI 记录缺失、孤立的工具使用尾部、消息策略/系统提示词/cwd/MCP 发生变化，或会话过期重试；身份验证配置文件或凭据纪元发生变化时，绝不会重新填充原始记录历史。

序列化：`serialize: true` 会使同一通道中的运行保持有序（大多数 CLI 会在一个提供商通道上串行执行）。当选定的身份验证身份发生变化时，OpenClaw 也会停止复用已存储的 CLI 会话，包括身份验证配置文件 ID、静态 API 密钥、静态令牌或 OAuth 账户身份发生变化（当 CLI 可以提供该身份时）；仅轮换 OAuth 访问令牌/刷新令牌不会中断会话。如果 CLI 没有稳定的 OAuth 账户 ID，OpenClaw 会让该 CLI 自行实施其恢复权限。

## 来自 claude-cli 会话的后备前置信息

当一次 `claude-cli` 尝试故障转移到 [`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会使用从 Claude Code 本地 JSONL 记录中提取的上下文前置信息为下一次尝试提供初始上下文（位于 `~/.claude/projects/` 下，按工作区确定键）。如果没有该初始上下文，后备提供商会从空白状态开始，因为 OpenClaw 自身的会话记录对于 `claude-cli` 运行是空的。

- 前置信息优先使用最新的 `/compact` 摘要或 `compact_boundary` 标记，然后在字符预算范围内追加边界之后最近的轮次。边界之前的轮次会被丢弃，因为摘要已表示这些内容。
- 工具块会合并成精简的 `(tool call: name)` 和 `(tool result: …)` 提示，以如实控制提示词预算；过大的摘要会被截断并标记为 `(truncated)`。
- 从 `claude-cli` 到 `claude-cli` 的同提供商后备方案依赖 Claude 自身的 `--resume`，并会跳过前置信息。
- 初始上下文会复用现有的 Claude 会话文件路径验证，因此无法读取任意路径。

## 图片

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递；否则，OpenClaw 会将文件路径追加到提示词中（路径注入），这适用于能够根据纯路径自动加载本地文件的 CLI。

## 输入和输出

- `output: "text"`（默认）将标准输出视为最终响应。
- `output: "json"` 会尝试解析 JSON，并提取文本和会话 ID。
- `output: "jsonl"` 会解析 JSONL 流，并提取最终智能体消息以及存在的会话标识符。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。内置 Gemini CLI 默认值使用 `stream-json`；旧的 `--output-format json` 覆盖仍使用 JSON 解析器。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过标准输入发送提示词。
- 如果提示词很长并设置了 `maxPromptArgChars`，则改用标准输入。

## 插件所属的默认值

CLI 后端默认值属于插件接口的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端专用的配置清理通过可选的 `normalizeConfig` 钩子继续由插件负责。

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

内置的 Google 插件为 `google-gemini-cli` 注册：

| 键                        | 值                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 相同，但包含 `--resume {sessionId}`                                                    |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

先决条件：必须安装本地 Gemini CLI，并确保它以 `gemini` 的名称位于 `PATH` 中（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI 输出说明：

- 默认的 `stream-json` 解析器会读取助手 `message` 事件、工具事件、最终 `result` 用量以及致命的 Gemini 错误事件。
- 如果你将 Gemini 参数覆盖为 `--output-format json`，OpenClaw 会将该后端重新规范化为 `output: "json"`，并从 JSON 的 `response` 字段读取回复文本。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`；`stats.cached` 会规范化为 OpenClaw 的 `cacheRead`，如果缺少 `stats.input`，则根据 `stats.input_tokens - stats.cached` 推导输入令牌数。

仅在需要时覆盖默认值（最常见的是使用绝对 `command` 路径）。

## 文本转换叠加层

需要少量提示词/消息兼容性适配的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 会重写传递给 CLI 的系统提示词和用户提示词。`output` 会在 OpenClaw 处理自身的控制标记和渠道投递之前，重写流式助手文本和解析后的最终文本；对于由提供商支持的模型调用，它还会在流修复之后、工具执行之前，恢复结构化工具调用参数中的字符串值。原始提供商 JSON 片段保持不变；使用方应使用结构化的部分、结束或结果载荷。

对于发出提供商特定 JSONL 事件的 CLI，请在该后端的配置中设置 `jsonlDialect`：Claude Code 兼容流使用 `claude-stream-json`，Gemini CLI `stream-json` 事件使用 `gemini-stream-json`。

## 原生压缩所有权

某些 CLI 后端会运行自行压缩其对话记录的智能体，因此 OpenClaw 不得对它们运行保护性摘要器——否则会与后端自身的压缩机制冲突，并可能导致该轮次彻底失败。

`claude-cli` 没有 harness 端点（Claude Code 在内部进行压缩），因此它声明 `ownsNativeCompaction: true`，OpenClaw 的压缩路径会原样返回会话条目。Codex 等原生 harness 会话则会继续路由到其 harness 压缩端点。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

仅应为真正拥有压缩能力的后端声明 `ownsNativeCompaction`：它必须能够可靠地将自身对话记录限制在上下文窗口附近，并持久化可恢复的会话（例如 `--resume` / `--session-id`），否则延迟处理的会话可能持续超出预算。

## 内置 MCP 叠加层

CLI 后端不会直接接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true` 选择启用生成的 MCP 配置叠加层。当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件。
- `google-gemini-cli`：生成 Gemini 系统设置文件。

启用内置 MCP 后，OpenClaw 会：

- 启动一个 local loopback HTTP MCP 服务器，向 CLI 进程公开 Gateway 网关工具，并使用仅在当前执行尝试期间有效的单次运行上下文授权（`OPENCLAW_MCP_TOKEN`）进行身份验证；
- 将工具访问绑定到 Gateway 网关所选的会话、账户和渠道上下文，而不是信任子进程标头；
- 加载当前工作区中已启用的内置 MCP 服务器，并将其与任何现有后端 MCP 配置/设置结构合并；
- 使用所属插件提供的后端自有集成模式重写启动配置。

如果没有启用任何 MCP 服务器，只要后端选择启用内置 MCP，OpenClaw 仍会注入严格配置，以确保后台运行保持隔离。

会话范围的内置 MCP 运行时会缓存在会话中以供复用，随后在空闲 `mcp.sessionIdleTtlMs` 毫秒后回收（默认 10 分钟；设置为 `0` 可禁用）。身份验证探测、标识符生成和主动记忆召回等一次性嵌入式运行会请求在运行结束时清理，确保 stdio 子进程和可流式传输的 HTTP/SSE 流不会在运行结束后继续存在。

## 重新注入历史记录上限

使用先前的 OpenClaw 对话记录初始化新的 CLI 会话时（例如在 `session_expired` 重试后），渲染的 `<conversation_history>` 块会受到上限限制，以避免重新注入提示词过度膨胀。默认上限为 12,288 个字符（约 3,000 个令牌）。

Claude CLI 后端会根据解析出的 Claude 上下文窗口调整此上限：更大的上下文窗口可获得更大的先前历史记录片段，直至达到固定上限；其他 CLI 后端则保留较为保守的默认值。此上限仅控制重新注入提示词中的先前历史记录块——实时会话输出限制则在 `reliability.outputLimits` 下单独调节（参见[会话](#sessions)）。

## 限制

- 不支持直接调用 OpenClaw 工具：OpenClaw 不会将工具调用注入 CLI 后端协议。后端仅在选择启用 `bundleMcp: true` 时才能看到 Gateway 网关工具。
- 流式传输因后端而异：某些后端以流式方式传输 JSONL，其他后端则缓冲至退出时再输出。
- 结构化输出取决于 CLI 自身的 JSON 格式。

## 故障排除

| 症状            | 修复方法                                                       |
| --------------- | -------------------------------------------------------------- |
| 找不到 CLI      | 将 `command` 设置为完整路径。                                  |
| 模型名称错误    | 使用 `modelAliases` 将 `provider/model` 映射到 CLI 的模型 ID。 |
| 会话无法保持连续 | 确保已设置 `sessionArg`，且 `sessionMode` 不是 `none`。        |
| 图像被忽略      | 设置 `imageArg`，并确认 CLI 支持文件路径。                     |

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
