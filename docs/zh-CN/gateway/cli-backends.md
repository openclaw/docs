---
read_when:
    - 你需要在 API 提供商失败时有可靠的后备方案
    - 你正在运行本地 AI CLI，并想复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback 桥接器
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退
title: CLI 后端
x-i18n:
    generated_at: "2026-07-05T11:17:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3fb55bcb6e6e5aeb1176dea1ce81df394940841f324b5c93ce8a807b134945
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供商不可用、被限速或行为异常时，运行本地 AI CLI 作为纯文本回退。它有意保持保守：

- OpenClaw 工具不会被直接注入，但带有 `bundleMcp: true` 的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 支持它的 CLI 可使用 JSONL 流式传输。
- 支持会话，因此后续轮次能保持连贯。
- 如果 CLI 接受图片路径，图片会透传。

将它用作“始终可用”的文本响应安全网，而不是主要路径。若需要带 ACP 会话控制、后台任务、线程/对话绑定和持久外部编码会话的完整 harness 运行时，请改用 [ACP 智能体](/zh-CN/tools/acp-agents)；CLI 后端不是 ACP。

<Tip>
  正在构建新的后端插件？请参阅 [CLI 后端插件](/zh-CN/plugins/cli-backend-plugins)。本页介绍如何配置和运行已经注册的后端。
</Tip>

## 快速开始

内置 Anthropic 插件会注册默认的 `claude-cli` 后端，因此只要已安装 Claude Code 并完成登录，无需额外配置即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未配置显式智能体列表时，`main` 是默认智能体 id；否则请换成你自己的智能体 id。

如果 Gateway 网关在 launchd/systemd 下运行且 `PATH` 很精简，请显式指向二进制文件：

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

如果你在 Gateway 网关主机上将内置 CLI 后端用作主要消息提供商，当你的配置在模型引用中或 `agents.defaults.cliBackends` 下引用该后端时，OpenClaw 会自动加载所属的内置插件。

## 将其用作回退

将 CLI 后端添加到你的回退列表中，让它只在主要模型失败时运行：

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

如果你将 `agents.defaults.models` 用作允许列表，也要把你的 CLI 后端模型包含进去。当主要提供商失败时（凭证、限速、超时），OpenClaw 会接着尝试 CLI 后端。

## 配置

所有 CLI 后端都位于 `agents.defaults.cliBackends` 下，并按提供商 id 作为键（例如 `claude-cli`、`my-cli`）。提供商 id 会成为模型引用左侧：`<provider>/<model>`。

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
          // Dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style config-override flag instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed invalidated sessions from
          // bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 工作方式

1. 通过提供商前缀（`claude-cli/...`）选择后端。
2. 使用相同的 OpenClaw 提示词和工作区上下文构建系统提示词。
3. 使用会话 id（如果支持）执行 CLI，以保持历史一致。内置 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. 解析输出（JSON 或纯文本）并返回最终文本。
5. 按后端持久化会话 id，让后续轮次复用同一个 CLI 会话。

### Claude CLI 细节

内置 `claude-cli` 后端优先使用 Claude Code 的原生 skill 解析器。当当前 skills 快照中至少有一个已选择且带物化路径的 skill 时，OpenClaw 会通过 `--plugin-dir` 传递一个临时 Claude Code 插件，并从附加的系统提示词中省略重复的 OpenClaw skills 目录。没有物化插件 skill 时，OpenClaw 会保留提示词目录作为回退。Skill 环境/API key 覆盖仍会应用到本次运行的子进程环境中。

Claude CLI 有自己的非交互式权限模式；OpenClaw 会将其映射到现有 exec 策略，而不是添加 Claude 专用配置。对于 OpenClaw 管理的 Claude 实时会话，生效的 exec 策略具有权威性：YOLO（`tools.exec.security: "full"` 和 `tools.exec.ask: "off"`）会用 `--permission-mode bypassPermissions` 启动 Claude，而限制性策略会用 `--permission-mode default` 启动它。按智能体配置的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。原始后端参数仍可包含 `--permission-mode`，但实时 Claude 启动会将该标志规范化为匹配生效策略。

该后端还会将 OpenClaw `/think` 级别映射到 Claude Code 的原生 `--effort` 标志：`minimal`/`low` -> `low`，`adaptive`/`medium` -> `medium`，而 `high`/`xhigh`/`max` 会直接透传。其他 CLI 后端需要其所属插件声明等效的 argv 映射器后，`/think` 才会影响生成的 CLI。

在 OpenClaw 可以使用 `claude-cli` 之前，Claude Code 本身必须在同一主机上完成登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安装需要在持久化的容器 home 中安装并登录 Claude Code，而不只是主机上；请参阅 [Docker 中的 Claude CLI 后端](/zh-CN/install/docker#claude-cli-backend-in-docker)。

只有当 `claude` 二进制文件尚未在 `PATH` 上时，才设置 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`），或者在 id 需要落入多个标志时设置 `sessionArgs`（占位符 `{sessionId}`）。
- 如果 CLI 使用带有不同标志的 resume 子命令，请设置 `resumeArgs`（恢复时替代 `args`），并可选择为非 JSON 恢复设置 `resumeOutput`。
- `sessionMode`：
  - `always`：始终发送会话 id（如果未存储则使用新的 UUID）。
  - `existing`：只有之前存储过会话 id 时才发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此在实时 Claude 进程仍活跃时，后续轮次会复用该进程，包括省略传输字段的自定义配置。如果 Gateway 网关重启或空闲进程退出，OpenClaw 会从存储的 Claude 会话 id 恢复。恢复前会根据可读的项目 transcript 验证已存储的会话 id；缺少 transcript 会清除绑定（记录为 `reason=transcript-missing`），而不是在 `--resume` 下静默启动新会话。
- Claude 实时会话保留有界 JSONL 输出保护：默认每轮 8 MiB 和 20,000 行原始 JSONL。可按后端使用 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 提高限制；OpenClaw 会将这些设置钳制到 64 MiB 和 100,000 行。
- 已存储的 CLI 会话是提供商拥有的连续性。隐式每日会话重置不会截断它们；`/reset` 和显式 `session.reset` 策略仍会截断。
- 新的 CLI 会话通常只会从 OpenClaw 的压缩摘要加上压缩后尾部重新播种。要恢复压缩前失效的短会话，后端可以用 `reseedFromRawTranscriptWhenUncompacted: true` 选择启用。原始 transcript 重新播种保持有界，并且仅限于安全失效场景，例如缺少 CLI transcript、孤立的工具使用尾部、消息策略/系统提示词/cwd/MCP 变更，或会话过期重试；凭证配置文件或凭证 epoch 变更绝不会重新播种原始 transcript 历史。

序列化：`serialize: true` 会让同一通道的运行保持有序（大多数 CLI 会在一个提供商通道上序列化）。当所选凭证身份变化时，OpenClaw 也会丢弃已存储的 CLI 会话复用，包括凭证配置文件 id、静态 API key、静态令牌，或 CLI 暴露 OAuth 账户身份时的 OAuth 账户身份变化；仅 OAuth access/refresh token 轮换不会截断会话。如果 CLI 没有稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自行强制其恢复权限。

## 来自 claude-cli 会话的回退前导上下文

当一次 `claude-cli` 尝试失败并切换到 [`agents.defaults.model.fallbacks`](/zh-CN/concepts/model-failover) 中的非 CLI 候选项时，OpenClaw 会用从 Claude Code 本地 JSONL transcript（位于 `~/.claude/projects/` 下，按工作区作为键）中提取的上下文前导来播种下一次尝试。没有这个种子时，回退提供商会冷启动，因为 OpenClaw 自己的会话 transcript 对 `claude-cli` 运行来说是空的。

- 前导上下文优先使用最新的 `/compact` 摘要或 `compact_boundary` 标记，然后在字符预算内追加最近的边界后轮次。边界前轮次会被丢弃，因为摘要已经表示了它们。
- 工具块会被合并成紧凑的 `(tool call: name)` 和 `(tool result: …)` 提示，以保持提示词预算真实；过大的摘要会被截断并标记为 `(truncated)`。
- 同提供商 `claude-cli` 到 `claude-cli` 的回退依赖 Claude 自己的 `--resume`，并跳过前导上下文。
- 该种子复用现有的 Claude 会话文件路径验证，因此无法读取任意路径。

## 图片

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传递；如果没有设置，OpenClaw 会把文件路径追加到提示词中（路径注入），这适用于会从纯路径自动加载本地文件的 CLI。

## 输入和输出

- `output: "text"`（默认）将 stdout 视为最终响应。
- `output: "json"` 会尝试解析 JSON，并提取文本和会话 id。
- `output: "jsonl"` 会解析 JSONL 流，并在存在时提取最终智能体消息和会话标识符。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。内置 Gemini CLI 默认使用 `stream-json`；旧的 `--output-format json` 覆盖仍会使用 JSON 解析器。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则改用 stdin。

## 插件拥有的默认值

CLI 后端默认值是插件表面的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端特定的配置清理由可选的 `normalizeConfig` 钩子继续由插件拥有。

Anthropic 拥有 `claude-cli`，Google 拥有 `google-gemini-cli`。OpenAI Codex 智能体运行通过 `openai/*` 使用 Codex app-server harness；OpenClaw 不再注册内置 `codex-cli` 后端。

内置 Anthropic 插件为 `claude-cli` 注册：

| 键                   | 值                                                                                                                                                                                                            |
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

内置 Google 插件会注册 `google-gemini-cli`：

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

前提条件：本地 Gemini CLI 必须已安装，并且作为 `gemini` 位于 `PATH` 上（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI 输出说明：

- 默认 `stream-json` 解析器会读取助手 `message` 事件、工具事件、最终 `result` 用量以及致命 Gemini 错误事件。
- 如果你将 Gemini 参数覆盖为 `--output-format json`，OpenClaw 会把该后端规范化回 `output: "json"`，并从 JSON `response` 字段读取回复文本。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`；`stats.cached` 会规范化为 OpenClaw `cacheRead`，并且如果缺少 `stats.input`，输入 token 会从 `stats.input_tokens - stats.cached` 推导。

仅在需要时覆盖默认值（最常见的是绝对 `command` 路径）。

## 文本转换覆盖层

需要小型提示词/消息兼容性垫片的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 会重写传递给 CLI 的系统提示词和用户提示词。`output` 会在 OpenClaw 处理自己的控制标记和渠道投递之前，重写流式助手文本和解析后的最终文本；对于由提供商支持的模型调用，它还会在流修复之后、工具执行之前，还原结构化工具调用参数中的字符串值。原始提供商 JSON 片段保持不变；消费者应使用结构化的 partial、end 或 result 载荷。

对于会发出提供商特定 JSONL 事件的 CLI，请在该后端的配置上设置 `jsonlDialect`：Claude Code 兼容流使用 `claude-stream-json`，Gemini CLI `stream-json` 事件使用 `gemini-stream-json`。

## 原生压缩所有权

某些 CLI 后端会运行一个自行压缩自身转录记录的智能体，因此 OpenClaw 不能对它们运行保障性摘要器，否则会与后端自身的压缩冲突，并可能导致该轮次硬失败。

`claude-cli` 没有 harness 端点（Claude Code 会在内部压缩），因此它声明 `ownsNativeCompaction: true`，OpenClaw 的压缩路径会原样返回会话条目。Codex 等原生 harness 会话则继续路由到其 harness 压缩端点。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

仅对真正拥有压缩能力的后端声明 `ownsNativeCompaction`：它必须能够可靠地将自己的转录记录限制在上下文窗口附近，并持久化一个可恢复的会话（例如 `--resume` / `--session-id`），否则延迟会话可能会持续超出预算。

## 内置 MCP 覆盖层

CLI 后端不会直接接收 OpenClaw 工具调用，但后端可以通过 `bundleMcp: true` 选择启用生成的 MCP 配置覆盖层。当前内置行为：

- `claude-cli`：生成严格 MCP 配置文件。
- `google-gemini-cli`：生成 Gemini 系统设置文件。

启用内置 MCP 后，OpenClaw 会：

- 启动一个 local loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程，并使用每会话 token（`OPENCLAW_MCP_TOKEN`）进行认证；
- 将工具访问范围限定到当前会话、账号和渠道上下文；
- 加载当前工作区启用的内置 MCP 服务器，并将其与任何现有后端 MCP 配置/设置形状合并；
- 使用所属插件提供的后端自有集成模式重写启动配置。

如果没有启用任何 MCP 服务器，当后端选择启用内置 MCP 时，OpenClaw 仍会注入严格配置，以确保后台运行保持隔离。

会话范围的内置 MCP 运行时会在会话内缓存以供复用，然后在空闲 `mcp.sessionIdleTtlMs` 毫秒后回收（默认 10 分钟；设置为 `0` 可禁用）。身份验证探测、slug 生成和主动记忆召回等一次性嵌入式运行会在运行结束时请求清理，以免 stdio 子进程和 Streamable HTTP/SSE 流比本次运行存活更久。

## 重新播种历史上限

当新的 CLI 会话从先前的 OpenClaw 转录记录播种时（例如在 `session_expired` 重试之后），渲染出的 `<conversation_history>` 块会被设定上限，以防重新播种提示词膨胀。默认值为 12,288 个字符（约 3,000 个 token）。

Claude CLI 后端会改为根据解析出的 Claude 上下文窗口缩放此上限：更大的上下文窗口会获得更大的先前历史切片，最高到固定上限；其他 CLI 后端保持保守默认值。此上限只控制重新播种提示词中的先前历史块，实时会话输出限制会在 `reliability.outputLimits` 下单独调优（参见 [会话](#sessions)）。

## 限制

- 无直接 OpenClaw 工具调用：OpenClaw 不会将工具调用注入 CLI 后端协议。只有当后端选择启用 `bundleMcp: true` 时，后端才会看到 Gateway 网关工具。
- 流式传输因后端而异：一些后端会流式传输 JSONL，另一些会缓冲到退出时。
- 结构化输出取决于 CLI 自身的 JSON 格式。

## 故障排查

| 症状             | 修复方式                                                        |
| ---------------- | --------------------------------------------------------------- |
| 找不到 CLI       | 将 `command` 设置为完整路径。                                   |
| 模型名称错误     | 使用 `modelAliases` 将 `provider/model` 映射到 CLI 的模型 ID。  |
| 无会话连续性     | 确保已设置 `sessionArg`，并且 `sessionMode` 不是 `none`。        |
| 图片被忽略       | 设置 `imageArg` 并确认 CLI 支持文件路径。                       |

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [本地模型](/zh-CN/gateway/local-models)
