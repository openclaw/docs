---
read_when:
    - 设置基于 ACP 的 IDE 集成
    - 调试 ACP 会话到 Gateway 网关的路由
summary: 运行用于 IDE 集成的 ACP 桥接器
title: ACP
x-i18n:
    generated_at: "2026-07-05T11:08:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

运行与 OpenClaw Gateway 网关通信的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 桥接器。

`openclaw acp` 通过 stdio 为 IDE 提供 ACP，并通过 WebSocket 将提示转发到 Gateway 网关，同时保持 ACP 会话映射到 Gateway 网关会话键。它是由 Gateway 网关支持的 ACP 桥接器，而不是完整的 ACP 原生编辑器运行时：它专注于会话路由、提示投递和流式更新。

如果你希望外部 MCP 客户端直接与 OpenClaw 渠道对话通信，而不是托管 ACP harness 会话，请改用 [`openclaw mcp serve`](/zh-CN/cli/mcp)。

## 这不是什么

`openclaw acp` 表示 OpenClaw 充当 ACP 服务器：IDE 或 ACP 客户端连接到 OpenClaw，然后 OpenClaw 将该工作转发到 Gateway 网关会话中。

这不同于 [ACP 智能体](/zh-CN/tools/acp-agents)，后者由 OpenClaw 通过 `acpx` 运行外部 harness，例如 Codex 或 Claude Code。

快速规则：

- 编辑器/客户端想通过 ACP 与 OpenClaw 通信：使用 `openclaw acp`
- OpenClaw 应该将 Codex/Claude/Gemini 作为 ACP harness 启动：使用 `/acp spawn` 和 [ACP 智能体](/zh-CN/tools/acp-agents)

## 兼容性矩阵

| ACP 区域                                                              | 状态      | 说明                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已实现 | 通过 stdio 到 Gateway 网关 chat/send + abort 的核心桥接流程。                                                                                                                                                                             |
| `listSessions`, slash 命令                                        | 已实现 | 会话列表基于 Gateway 网关会话状态工作，支持有界游标分页；当 Gateway 网关会话行携带工作区元数据时支持 `cwd` 过滤；命令通过 `available_commands_update` 宣告。                     |
| 会话血缘元数据                                              | 已实现 | 会话列表和会话信息快照在 `_meta` 中包含 OpenClaw 父子血缘，以便 ACP 客户端无需私有 Gateway 网关旁路通道即可渲染子智能体图。                                                     |
| `resumeSession`, `closeSession`                                       | 已实现 | Resume 会将 ACP 会话重新绑定到现有 Gateway 网关会话，而不重放历史。Close 会取消活动桥接工作，将待处理提示解析为已取消，并释放桥接会话状态。                                   |
| `loadSession`                                                         | 部分支持     | 将 ACP 会话重新绑定到 Gateway 网关会话键，并为桥接器创建的会话重放 ACP 事件账本历史。较旧/无账本会话会回退到存储的用户/助手文本。                                                  |
| 提示内容（`text`、嵌入的 `resource`、图像）                  | 部分支持     | 文本/资源会展平成聊天输入；图像会变成 Gateway 网关附件。                                                                                                                                                            |
| 会话模式                                                         | 部分支持     | 支持 `session/set_mode`；桥接器公开由 Gateway 网关支持的会话控制，用于思考级别、工具详细程度、推理、用量详情和提升权限操作。更广泛的 ACP 原生模式/配置界面仍不在范围内。 |
| 思考流式传输                                                     | 已实现 | 模型思考内容作为 `agent_thought_chunk` 会话更新流式传输。不会发出 ACP 原生会话计划。                                                                                                                    |
| 会话信息和用量更新                                        | 部分支持     | 桥接器会从缓存的 Gateway 网关会话快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。用量是近似值，并且仅在 Gateway 网关令牌总数标记为新鲜时发送。                             |
| 工具流式传输                                                        | 部分支持     | 当 Gateway 网关工具参数/结果暴露它们时，`tool_call`/`tool_call_update` 事件会包含原始 I/O、文本内容和尽力而为的文件位置。不会暴露嵌入式终端和更丰富的 diff 原生输出。                     |
| Exec 审批                                                        | 部分支持     | 活动 ACP 提示轮次期间的 Gateway 网关 exec 审批提示会通过 `session/request_permission` 中继到 ACP 客户端。                                                                                                               |
| 每会话 MCP 服务器（`mcpServers`）                                | 不支持 | 桥接模式会拒绝每会话 MCP 服务器请求。请改为在 OpenClaw Gateway 网关或智能体上配置 MCP。                                                                                                                          |
| 客户端文件系统方法（`fs/read_text_file`, `fs/write_text_file`） | 不支持 | 桥接器不会调用 ACP 客户端文件系统方法。                                                                                                                                                                               |
| 客户端终端方法（`terminal/*`）                                | 不支持 | 桥接器不会创建 ACP 客户端终端，也不会通过工具调用流式传输终端 ID。                                                                                                                                            |

## 已知限制

- `loadSession` 仅对桥接器创建的会话重放完整 ACP 事件账本历史。较旧/无账本会话使用转录回退，不会重建历史工具调用或系统通知。
- 如果多个 ACP 客户端共享同一个 Gateway 网关会话键，事件和取消路由是尽力而为，而不是严格按客户端隔离。当你需要干净的编辑器本地轮次时，优先使用默认隔离的 `acp-bridge:<uuid>` 会话。
- Gateway 网关停止状态会转换为 ACP 停止原因，但该映射不如完整 ACP 原生运行时那样有表达力。
- 会话控制公开 Gateway 网关旋钮的聚焦子集：思考级别、工具详细程度、推理、用量详情和提升权限操作。模型选择和 exec 主机控制不会作为 ACP 配置选项暴露。
- `session_info_update` 和 `usage_update` 派生自 Gateway 网关会话快照，而不是实时 ACP 原生运行时计量。用量是近似值，不携带成本数据，并且仅在 Gateway 网关将总令牌数据标记为新鲜时发出。
- 工具跟随数据是尽力而为：桥接器会暴露出现在已知工具参数/结果中的文件路径，但不会发出 ACP 终端或结构化文件 diff。
- Exec 审批中继仅限于活动 ACP 提示轮次；来自其他 Gateway 网关会话的审批会被忽略。

## 用法

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP 客户端（调试）

使用内置 ACP 客户端在没有 IDE 的情况下对桥接器做完整性检查。它会生成 ACP 桥接器，并允许你以交互方式输入提示。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型（客户端调试模式）：

- 自动审批基于允许列表，并且仅适用于受信任的核心工具 ID。
- `read` 自动审批限定在当前工作目录范围内（设置时为 `--cwd`）。
- ACP 仅自动审批狭窄的只读类别：活动 cwd 下的限定范围 `read` 调用，以及只读搜索工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、范围外读取、具备 exec 能力的工具、控制平面工具、变更型工具和交互式流程始终需要显式提示审批。
- 服务器提供的 `toolCall.kind` 会被视为不受信任的元数据，而不是授权来源。
- 此 ACP 桥接策略独立于 ACPX harness 权限。如果你通过 `acpx` 后端运行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是该 harness 会话的破窗式 “yolo” 开关。

## 协议冒烟测试

对于协议级调试，请使用隔离状态启动 Gateway 网关，并用 ACP JSON-RPC 客户端通过 stdio 驱动 `openclaw acp`。覆盖 `initialize`、`session/new`、带绝对 `cwd` 的 `session/list`、`session/resume`、`session/close`、重复 close 和缺失 resume。

证明应包含宣告的生命周期能力、由 Gateway 网关支持的会话行、更新通知以及 Gateway 网关 `sessions.list` 日志：

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

避免将 `openclaw gateway call sessions.list` 用作唯一 ACP 证明。该 CLI 路径可能请求新鲜令牌操作员权限范围升级；ACP 桥接正确性由 ACP stdio 帧加 Gateway 网关 `sessions.list` 日志证明。

## 如何使用它

当 IDE（或其他客户端）使用 Agent Client Protocol，并且你希望它驱动 OpenClaw Gateway 网关会话时，请使用 ACP。

1. 确保 Gateway 网关正在运行（本地或远程）。
2. 配置 Gateway 网关目标（配置或标志）。
3. 将你的 IDE 指向通过 stdio 运行 `openclaw acp`。

示例配置（持久化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

示例直接运行（不写入配置）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 选择智能体

ACP 不会直接选择智能体。它按 Gateway 网关会话键进行路由。使用智能体范围的会话键来定位特定智能体：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP 会话映射到单个 Gateway 网关会话键。一个智能体可以有许多会话；除非你覆盖键或标签，否则 ACP 默认使用隔离的 `acp-bridge:<uuid>` 会话。

每会话 `mcpServers` 在桥接模式下不受支持。如果 ACP 客户端在 `newSession` 或 `loadSession` 期间发送它们，桥接会返回明确错误，而不是静默忽略。

如果你希望 ACPX 支持的会话能看到 OpenClaw 插件工具，或 `cron` 等选定的内置工具，请启用 Gateway 网关侧的 ACPX MCP 桥接，而不是尝试传递每会话 `mcpServers`。参见 [ACP 智能体](/zh-CN/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和 [OpenClaw 工具 MCP 桥接](/zh-CN/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 从 `acpx` 使用（Codex、Claude、其他 ACP 客户端）

如果你希望 Codex 或 Claude Code 等编码智能体通过 ACP 与你的 OpenClaw bot 通信，请使用带有内置 `openclaw` 目标的 `acpx`。

典型流程：

1. 运行 Gateway 网关，并确保 ACP 桥接可以访问它。
2. 将 `acpx openclaw` 指向 `openclaw acp`。
3. 指定你希望编码智能体使用的 OpenClaw 会话键。

示例：

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你希望 `acpx openclaw` 每次都指向特定的 Gateway 网关和会话键，请在 `~/.acpx/config.json` 中覆盖 `openclaw` 智能体命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于仓库本地的 OpenClaw checkout，请使用直接 CLI 入口点，而不是开发运行器，这样 ACP 流可以保持干净：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端从 OpenClaw 智能体拉取上下文信息而无需抓取终端的最简单方式。

## Zed 编辑器设置

在 `~/.config/zed/settings.json` 中添加自定义 ACP 智能体（或使用 Zed 的设置 UI）：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

要指向特定 Gateway 网关或智能体：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

在 Zed 中，打开 Agent 面板并选择 “OpenClaw ACP” 以启动线程。

## 会话映射

默认情况下，ACP 桥接会话会获得一个带有 `acp-bridge:` 前缀的隔离 Gateway 网关会话键。这些普通模型桥接会话是合成且可丢弃的：它们会受到陈旧条目清理影响，并且不会被视为受保护的人类对话界面。要复用已知会话，请传递会话键或标签：

- `--session <key>`：使用特定 Gateway 网关会话键。
- `--session-label <label>`：按标签解析现有会话。
- `--reset-session`：为该键铸造新的会话 ID（相同键，新的 transcript）。

如果你的 ACP 客户端支持元数据，可以按会话覆盖：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/zh-CN/concepts/session) 了解更多会话键信息。

## 选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认为 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关认证 token。
- `--token-file <path>`：从文件读取 Gateway 网关认证 token。
- `--password <password>`：Gateway 网关认证密码。
- `--password-file <path>`：从文件读取 Gateway 网关认证密码。
- `--session <key>`：默认会话键。
- `--session-label <label>`：要解析的默认会话标签。
- `--require-existing`：如果会话键/标签不存在则失败。
- `--reset-session`：首次使用前重置会话键。
- `--no-prefix-cwd`：不要在 prompt 前加上工作目录。
- `--provenance <off|meta|meta+receipt>`：包含 ACP provenance 元数据或 receipt。
- `--verbose, -v`：向 stderr 输出详细日志。

安全说明：

- `--token` 和 `--password` 在某些系统上的本地进程列表中可能可见。优先使用 `--token-file`/`--password-file` 或环境变量（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 网关认证解析遵循其他 Gateway 网关客户端使用的共享契约：
  - 本地模式：env（`OPENCLAW_GATEWAY_*`）然后是 `gateway.auth.*`，仅在未设置 `gateway.auth.*` 时回退到 `gateway.remote.*`（已配置但未解析的本地 SecretRef 会失败关闭，而不是静默回退）
  - 远程模式：`gateway.remote.*`，并按远程优先级规则使用 env/config 回退
  - `--url` 可安全覆盖，并且不会复用隐式 config/env 凭据；请传递显式 `--token`/`--password`（或文件变体）

### `acp client` 选项

- `--cwd <dir>`：ACP 会话的工作目录。
- `--server <command>`：ACP 服务器命令（默认：`openclaw`）。
- `--server-args <args...>`：传递给 ACP 服务器的额外参数。
- `--server-verbose`：启用 ACP 服务器上的详细日志。
- `--verbose, -v`：详细客户端日志。
- `openclaw acp client` 会在派生的桥接进程上设置 `OPENCLAW_SHELL=acp-client`，可用于特定上下文的 shell/profile 规则。

## 相关

- [CLI 参考](/zh-CN/cli)
- [ACP 智能体](/zh-CN/tools/acp-agents)
