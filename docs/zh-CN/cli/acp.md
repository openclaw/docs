---
read_when:
    - 设置基于 ACP 的 IDE 集成
    - 调试 ACP 会话到 Gateway 网关的路由
summary: 运行用于 IDE 集成的 ACP 桥接器
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

运行与 OpenClaw Gateway 网关通信的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) bridge。

此命令通过 stdio 为 IDE 提供 ACP，并通过 WebSocket 将提示转发到 Gateway 网关。它会保持 ACP 会话与 Gateway 网关会话键之间的映射。

`openclaw acp` 是一个由 Gateway 网关支持的 ACP bridge，而不是完整的 ACP 原生编辑器运行时。它专注于会话路由、提示投递和基础流式传输更新。

如果你希望外部 MCP 客户端直接与 OpenClaw 渠道对话通信，而不是托管 ACP harness 会话，请改用 [`openclaw mcp serve`](/zh-CN/cli/mcp)。

## 这不是什么

本页面经常会与 ACP harness 会话混淆。

`openclaw acp` 表示：

- OpenClaw 充当 ACP 服务器
- IDE 或 ACP 客户端连接到 OpenClaw
- OpenClaw 将该工作转发到 Gateway 网关会话中

这不同于 [ACP Agents](/zh-CN/tools/acp-agents)，后者是 OpenClaw 通过 `acpx` 运行 Codex 或 Claude Code 等外部 harness。

快速规则：

- 编辑器/客户端想通过 ACP 与 OpenClaw 通信：使用 `openclaw acp`
- OpenClaw 应作为 ACP harness 启动 Codex/Claude/Gemini：使用 `/acp spawn` 和 [ACP Agents](/zh-CN/tools/acp-agents)

## 兼容性矩阵

| ACP 范围                                                              | Status      | 备注                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已实现 | 通过 stdio 到 Gateway 网关 chat/send + abort 的核心 bridge 流程。                                                                                                                                                                                        |
| `listSessions`, slash commands                                        | 已实现 | 会话列表基于 Gateway 网关会话状态工作，支持有界游标分页；当 Gateway 网关会话行带有工作区元数据时支持 `cwd` 过滤；命令通过 `available_commands_update` 公告。                                |
| 会话谱系元数据                                              | 已实现 | 会话列表和会话信息快照会在 `_meta` 中包含 OpenClaw 父级和子级谱系，使 ACP 客户端无需私有 Gateway 网关旁路通道即可渲染子智能体图。                                                                |
| `resumeSession`, `closeSession`                                       | 已实现 | Resume 会将 ACP 会话重新绑定到现有 Gateway 网关会话，而不重放历史。Close 会取消活动 bridge 工作，将挂起提示解析为已取消，并释放 bridge 会话状态。                                              |
| `loadSession`                                                         | 部分支持     | 将 ACP 会话重新绑定到 Gateway 网关键，并为 bridge 创建的会话重放 ACP 事件账本历史。较旧/无账本会话会回退到已存储的用户/助手文本。                                                             |
| 提示内容（`text`、嵌入式 `resource`、图像）                  | 部分支持     | 文本/资源会被展平为聊天输入；图像会成为 Gateway 网关附件。                                                                                                                                                                 |
| 会话模式                                                         | 部分支持     | 支持 `session/set_mode`，并且 bridge 会公开初始 Gateway 网关支持的会话控件，包括思考级别、工具详细程度、推理、用量详情和提权操作。更广泛的 ACP 原生模式/配置界面仍不在范围内。 |
| 会话信息和用量更新                                        | 部分支持     | bridge 会从缓存的 Gateway 网关会话快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。用量为近似值，并且仅在 Gateway 网关令牌总数被标记为新鲜时发送。                                        |
| 工具流式传输                                                        | 部分支持     | 当 Gateway 网关工具参数/结果公开相关信息时，`tool_call` / `tool_call_update` 事件会包含原始 I/O、文本内容和尽力而为的文件位置。嵌入式终端和更丰富的 diff 原生输出仍未公开。                        |
| Exec 审批                                                        | 部分支持     | 活动 ACP 提示轮次期间的 Gateway 网关 exec 审批提示会通过 `session/request_permission` 转发给 ACP 客户端。                                                                                                                    |
| 每会话 MCP 服务器（`mcpServers`）                                | 不支持 | Bridge 模式会拒绝每会话 MCP 服务器请求。请改为在 OpenClaw gateway 或智能体上配置 MCP。                                                                                                                                     |
| 客户端文件系统方法（`fs/read_text_file`, `fs/write_text_file`） | 不支持 | bridge 不会调用 ACP 客户端文件系统方法。                                                                                                                                                                                          |
| 客户端终端方法（`terminal/*`）                                | 不支持 | bridge 不会创建 ACP 客户端终端，也不会通过工具调用流式传输终端 ID。                                                                                                                                                       |
| 会话计划 / 思考流式传输                                     | 不支持 | bridge 当前会发出输出文本和工具状态，而不是 ACP 计划或思考更新。                                                                                                                                                         |

## 已知限制

- `loadSession` 仅能为 bridge 创建的会话重放完整 ACP 事件账本历史。较旧/无账本会话仍使用转录回退，不会重建历史工具调用或系统通知。
- 如果多个 ACP 客户端共享同一个 Gateway 网关键，事件和取消路由将是尽力而为，而不是按客户端严格隔离。需要干净的编辑器本地轮次时，优先使用默认隔离的 `acp:<uuid>` 会话。
- Gateway 网关停止状态会被转换为 ACP 停止原因，但该映射的表达能力弱于完全 ACP 原生的运行时。
- 初始会话控件当前仅暴露 Gateway 网关旋钮的一个聚焦子集：思考级别、工具详细程度、推理、用量详情和提权操作。模型选择和 exec 主机控件尚未作为 ACP 配置选项公开。
- `session_info_update` 和 `usage_update` 派生自 Gateway 网关会话快照，而不是实时 ACP 原生运行时计量。用量是近似值，不包含成本数据，并且仅在 Gateway 网关将总令牌数据标记为新鲜时发出。
- 工具跟随数据是尽力而为。bridge 可以展示出现在已知工具参数/结果中的文件路径，但尚未发出 ACP 终端或结构化文件 diff。
- Exec 审批转发仅限于活动 ACP 提示轮次；来自其他 Gateway 网关会话的审批会被忽略。

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

使用内置 ACP 客户端在不依赖 IDE 的情况下对 bridge 做完整性检查。
它会生成 ACP bridge，并允许你交互式输入提示。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型（客户端调试模式）：

- 自动审批基于允许列表，并且仅适用于受信任的核心工具 ID。
- `read` 自动审批仅限当前工作目录（设置时为 `--cwd`）。
- ACP 仅自动审批狭窄的只读类别：活动 cwd 下有范围限制的 `read` 调用，以及只读搜索工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、范围外读取、具备 exec 能力的工具、控制平面工具、会修改状态的工具和交互式流程始终需要显式提示审批。
- 服务器提供的 `toolCall.kind` 会被视为不可信元数据（不是授权来源）。
- 此 ACP bridge 策略独立于 ACPX harness 权限。如果你通过 `acpx` 后端运行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是该 harness 会话的应急 “yolo” 开关。

## 协议冒烟测试

对于协议级调试，请使用隔离状态启动 Gateway 网关，并使用 ACP JSON-RPC 客户端通过 stdio 驱动 `openclaw acp`。覆盖 `initialize`、`session/new`、带绝对 `cwd` 的 `session/list`、`session/resume`、`session/close`、重复关闭和缺失恢复。

证明应包括公告的生命周期能力、Gateway 网关支持的会话行、更新通知和 Gateway 网关 `sessions.list` 日志：

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

避免将 `openclaw gateway call sessions.list` 作为唯一 ACP 证明。该 CLI 路径可能会请求 fresh-token 操作员范围升级；ACP bridge 正确性应通过 ACP stdio 帧加 Gateway 网关 `sessions.list` 日志来证明。

## 如何使用

当 IDE（或其他客户端）使用 Agent Client Protocol，并且你希望它驱动 OpenClaw Gateway 网关会话时，请使用 ACP。

1. 确保 Gateway 网关正在运行（本地或远程）。
2. 配置 Gateway 网关目标（配置或标志）。
3. 将你的 IDE 指向通过 stdio 运行的 `openclaw acp`。

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

ACP 不会直接选择智能体。它按 Gateway 网关会话键进行路由。

使用限定智能体范围的会话键来指定特定智能体：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP 会话都会映射到单个 Gateway 网关会话键。一个智能体可以有多个
会话；除非你覆盖该键或标签，否则 ACP 默认使用隔离的 `acp:<uuid>` 会话。

桥接模式不支持按会话设置 `mcpServers`。如果 ACP 客户端在 `newSession` 或 `loadSession`
期间发送它们，桥接会返回明确错误，而不是静默忽略。

如果你希望 ACPX 支持的会话能够看到 OpenClaw 插件工具或所选内置工具（例如 `cron`），请启用
Gateway 网关侧的 ACPX MCP 桥接，而不是尝试传入按会话设置的 `mcpServers`。请参阅
[ACP 智能体](/zh-CN/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和
[OpenClaw 工具 MCP 桥接](/zh-CN/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 从 `acpx` 使用（Codex、Claude、其他 ACP 客户端）

如果你希望 Codex 或 Claude Code 这样的编码智能体通过 ACP 与你的
OpenClaw bot 通信，请使用 `acpx` 及其内置的 `openclaw` 目标。

典型流程：

1. 运行 Gateway 网关，并确保 ACP 桥接可以访问它。
2. 将 `acpx openclaw` 指向 `openclaw acp`。
3. 定位你希望编码智能体使用的 OpenClaw 会话键。

示例：

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你希望 `acpx openclaw` 每次都定位到特定的 Gateway 网关和会话键，请在 `~/.acpx/config.json`
中覆盖 `openclaw` 智能体命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于仓库本地的 OpenClaw checkout，请使用直接 CLI 入口点，而不是开发运行器，这样 ACP 流才能保持干净。例如：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端从 OpenClaw 智能体拉取上下文信息的最简单方式，无需抓取终端内容。

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

要定位特定的 Gateway 网关或智能体：

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

在 Zed 中，打开 Agent 面板并选择 “OpenClaw ACP” 以启动一个线程。

## 会话映射

默认情况下，ACP 会话会获得一个带有 `acp:` 前缀的隔离 Gateway 网关会话键。
要复用已知会话，请传入会话键或标签：

- `--session <key>`：使用特定的 Gateway 网关会话键。
- `--session-label <label>`：按标签解析现有会话。
- `--reset-session`：为该键生成新的会话 ID（相同键，新的转录记录）。

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

在 [/concepts/session](/zh-CN/concepts/session) 了解更多关于会话键的信息。

## 选项

- `--url <url>`：Gateway 网关 WebSocket URL（配置后默认使用 gateway.remote.url）。
- `--token <token>`：Gateway 网关认证令牌。
- `--token-file <path>`：从文件读取 Gateway 网关认证令牌。
- `--password <password>`：Gateway 网关认证密码。
- `--password-file <path>`：从文件读取 Gateway 网关认证密码。
- `--session <key>`：默认会话键。
- `--session-label <label>`：要解析的默认会话标签。
- `--require-existing`：如果会话键/标签不存在，则失败。
- `--reset-session`：首次使用前重置会话键。
- `--no-prefix-cwd`：不要在提示前加上工作目录。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 溯源元数据或回执。
- `--verbose, -v`：将详细日志输出到 stderr。

安全注意事项：

- 在某些系统上，`--token` 和 `--password` 可能会出现在本地进程列表中。
- 优先使用 `--token-file`/`--password-file` 或环境变量（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 网关认证解析遵循其他 Gateway 网关客户端使用的共享契约：
  - 本地模式：env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> 仅当 `gateway.auth.*` 未设置时回退到 `gateway.remote.*`（已配置但未解析的本地 SecretRefs 会失败关闭）
  - 远程模式：`gateway.remote.*`，并按远程优先级规则使用 env/config 回退
  - `--url` 是覆盖安全的，不会复用隐式 config/env 凭证；请传入显式 `--token`/`--password`（或文件变体）
- ACP 运行时后端子进程会接收 `OPENCLAW_SHELL=acp`，可用于特定上下文的 shell/profile 规则。
- `openclaw acp client` 会在生成的桥接进程上设置 `OPENCLAW_SHELL=acp-client`。

### `acp client` 选项

- `--cwd <dir>`：ACP 会话的工作目录。
- `--server <command>`：ACP 服务器命令（默认：`openclaw`）。
- `--server-args <args...>`：传递给 ACP 服务器的额外参数。
- `--server-verbose`：在 ACP 服务器上启用详细日志。
- `--verbose, -v`：详细客户端日志。

## 相关

- [CLI 参考](/zh-CN/cli)
- [ACP 智能体](/zh-CN/tools/acp-agents)
