---
read_when:
    - 设置基于 ACP 的 IDE 集成
    - 调试 ACP 会话到 Gateway 网关的路由
summary: 运行用于 IDE 集成的 ACP 桥接器
title: acp
x-i18n:
    generated_at: "2026-04-23T06:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

运行与 OpenClaw Gateway 网关通信的 [智能体客户端协议（ACP）](https://agentclientprotocol.com/) 桥接器。

此命令会为 IDE 通过 stdio 使用 ACP，并通过 WebSocket 将提示转发到 Gateway 网关。
它会让 ACP 会话持续映射到 Gateway 网关会话键。

`openclaw acp` 是一个由 Gateway 网关支持的 ACP 桥接器，而不是一个完整的 ACP 原生编辑器
运行时。它专注于会话路由、提示传递和基础流式更新。

如果你希望外部 MCP 客户端直接与 OpenClaw 渠道会话通信，而不是托管 ACP harness 会话，请改用
[`openclaw mcp serve`](/zh-CN/cli/mcp)。

## 这不是什么

此页面经常与 ACP harness 会话混淆。

`openclaw acp` 的含义是：

- OpenClaw 充当 ACP 服务器
- IDE 或 ACP 客户端连接到 OpenClaw
- OpenClaw 将这些工作转发到一个 Gateway 网关会话中

这与 [ACP Agents](/zh-CN/tools/acp-agents) 不同，后者是 OpenClaw 通过 `acpx` 运行
外部 harness，例如 Codex 或 Claude Code。

快速规则：

- 编辑器/客户端想通过 ACP 与 OpenClaw 通信：使用 `openclaw acp`
- OpenClaw 应启动 Codex/Claude/Gemini 作为 ACP harness：使用 `/acp spawn` 和 [ACP Agents](/zh-CN/tools/acp-agents)

## 兼容性矩阵

| ACP 区域                                                              | 状态 | 说明                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已实现 | 核心桥接流程，基于 stdio 到 Gateway 网关 `chat/send` + 中止。                                                                                                                                                                              |
| `listSessions`, 斜杠命令                                               | 已实现 | 会话列表可对接 Gateway 网关会话状态；命令通过 `available_commands_update` 进行公布。                                                                                                                                                       |
| `loadSession`                                                         | 部分支持 | 将 ACP 会话重新绑定到某个 Gateway 网关会话键，并重放已存储的用户/助手文本历史。工具/系统历史目前尚未重建。                                                                                                                                |
| 提示内容（`text`、嵌入式 `resource`、图像）                           | 部分支持 | 文本/资源会被展平成聊天输入；图像会变成 Gateway 网关附件。                                                                                                                                                                                 |
| 会话模式                                                               | 部分支持 | 支持 `session/set_mode`，桥接器还会公开初始的 Gateway 网关支持型会话控制项，包括思考级别、工具详细程度、推理、用量细节和提升权限操作。更广泛的 ACP 原生模式/配置界面仍不在当前范围内。                                                    |
| 会话信息和用量更新                                                     | 部分支持 | 桥接器会根据缓存的 Gateway 网关会话快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。用量是近似值，且仅当 Gateway 网关将令牌总数标记为最新时才会发送。                                                                      |
| 工具流式传输                                                           | 部分支持 | `tool_call` / `tool_call_update` 事件会包含原始 I/O、文本内容，以及当 Gateway 网关工具参数/结果暴露这些信息时的尽力而为文件位置。嵌入式终端和更丰富的原生 Diffs 输出目前仍未暴露。                                                          |
| 每会话 MCP 服务器（`mcpServers`）                                      | 不支持 | 桥接模式会拒绝每会话 MCP 服务器请求。请改为在 OpenClaw Gateway 网关或智能体上配置 MCP。                                                                                                                                                    |
| 客户端文件系统方法（`fs/read_text_file`, `fs/write_text_file`）       | 不支持 | 桥接器不会调用 ACP 客户端文件系统方法。                                                                                                                                                                                                    |
| 客户端终端方法（`terminal/*`）                                         | 不支持 | 桥接器不会创建 ACP 客户端终端，也不会通过工具调用流式传输终端 id。                                                                                                                                                                         |
| 会话计划 / 思维流式传输                                                | 不支持 | 桥接器当前会输出文本和工具状态，而不会发送 ACP 计划或思维更新。                                                                                                                                                                            |

## 已知限制

- `loadSession` 会重放已存储的用户和助手文本历史，但不会
  重建历史工具调用、系统通知或更丰富的 ACP 原生事件
  类型。
- 如果多个 ACP 客户端共享同一个 Gateway 网关会话键，事件和取消
  路由是尽力而为，而不是按客户端严格隔离。若你需要干净的编辑器本地
  轮次，建议使用默认隔离的 `acp:<uuid>` 会话。
- Gateway 网关停止状态会被转换为 ACP 停止原因，但这种映射
  不如完整 ACP 原生运行时那样具有表现力。
- 初始会话控制目前只公开 Gateway 网关参数中的一个聚焦子集：
  思考级别、工具详细程度、推理、用量细节和提升权限
  操作。模型选择和 exec-host 控制目前尚未作为 ACP
  配置选项公开。
- `session_info_update` 和 `usage_update` 来源于 Gateway 网关会话
  快照，而不是实时 ACP 原生运行时统计。用量是近似值，
  不包含成本数据，并且只有当 Gateway 网关将总令牌
  数据标记为最新时才会发出。
- 工具跟随数据是尽力而为的。桥接器可以公开出现在
  已知工具参数/结果中的文件路径，但它目前还不会发出 ACP 终端或
  结构化文件 Diffs。

## 用法

```bash
openclaw acp

# 远程 Gateway 网关
openclaw acp --url wss://gateway-host:18789 --token <token>

# 远程 Gateway 网关（从文件读取 token）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 连接到现有会话键
openclaw acp --session agent:main:main

# 按标签连接（必须已存在）
openclaw acp --session-label "support inbox"

# 在第一条提示前重置会话键
openclaw acp --session agent:main:main --reset-session
```

## ACP 客户端（调试）

使用内置 ACP 客户端可以在没有 IDE 的情况下对桥接器做安装完整性检查。
它会启动 ACP 桥接器，并让你以交互方式输入提示。

```bash
openclaw acp client

# 让所启动的桥接器指向远程 Gateway 网关
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 覆盖服务器命令（默认：openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型（客户端调试模式）：

- 自动批准基于 allowlist，并且仅适用于受信任的核心工具 id。
- `read` 自动批准的范围仅限当前工作目录（设置了 `--cwd` 时）。
- ACP 只会自动批准狭义的只读类别：活动 cwd 下受范围限制的 `read` 调用，以及只读搜索工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、超出范围的读取、可执行工具、控制平面工具、可变更工具以及交互式流程始终需要显式提示批准。
- 服务器提供的 `toolCall.kind` 会被视为不可信元数据（而不是授权来源）。
- 此 ACP 桥接器策略与 ACPX harness 权限相互独立。如果你通过 `acpx` 后端运行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是该 harness 会话的紧急放行 “yolo” 开关。

## 如何使用

当某个 IDE（或其他客户端）支持智能体客户端协议，并且你希望它
驱动一个 OpenClaw Gateway 网关会话时，请使用 ACP。

1. 确保 Gateway 网关已在运行（本地或远程）。
2. 配置 Gateway 网关目标（通过配置或标志）。
3. 将你的 IDE 指向通过 stdio 运行 `openclaw acp`。

示例配置（持久化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

示例直接运行（不写入配置）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 本地进程安全场景下的首选方式
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 选择智能体

ACP 不会直接选择智能体。它通过 Gateway 网关会话键进行路由。

使用带智能体作用域的会话键来定位特定智能体：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP 会话都映射到单个 Gateway 网关会话键。一个智能体可以拥有多个
会话；ACP 默认使用隔离的 `acp:<uuid>` 会话，除非你覆盖
该键或标签。

桥接模式不支持每会话 `mcpServers`。如果 ACP 客户端
在 `newSession` 或 `loadSession` 期间发送它们，桥接器会返回明确的
错误，而不是静默忽略。

如果你希望基于 ACPX 的会话能看到 OpenClaw 插件工具或选定的
内置工具（例如 `cron`），请启用 Gateway 网关侧的 ACPX MCP 桥接，
而不是尝试传入每会话 `mcpServers`。参见
[ACP Agents](/zh-CN/tools/acp-agents#plugin-tools-mcp-bridge) 和
[OpenClaw tools MCP bridge](/zh-CN/tools/acp-agents#openclaw-tools-mcp-bridge)。

## 从 `acpx` 使用（Codex、Claude、其他 ACP 客户端）

如果你希望像 Codex 或 Claude Code 这样的编码智能体通过 ACP 与你的
OpenClaw 机器人通信，请使用带内置 `openclaw` 目标的 `acpx`。

典型流程：

1. 运行 Gateway 网关，并确保 ACP 桥接器可以连接到它。
2. 将 `acpx openclaw` 指向 `openclaw acp`。
3. 指定你希望编码智能体使用的 OpenClaw 会话键。

示例：

```bash
# 向你的默认 OpenClaw ACP 会话发起一次性请求
acpx openclaw exec "Summarize the active OpenClaw session state."

# 用于后续轮次的持久化命名会话
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你希望 `acpx openclaw` 每次都指向特定的 Gateway 网关和会话键，
可以在 `~/.acpx/config.json` 中覆盖 `openclaw` 智能体命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于仓库本地的 OpenClaw 检出副本，请使用直接 CLI 入口点，而不是
开发运行器，这样 ACP 流才能保持干净。例如：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端
从 OpenClaw 智能体提取上下文信息，而无需抓取终端内容的最简单方式。

## Zed 编辑器设置

在 `~/.config/zed/settings.json` 中添加一个自定义 ACP 智能体（或使用 Zed 的设置 UI）：

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

要指向特定的 Gateway 网关或智能体：

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

在 Zed 中，打开智能体面板并选择 “OpenClaw ACP” 以启动一个线程。

## 会话映射

默认情况下，ACP 会话会获得一个带有 `acp:` 前缀的隔离 Gateway 网关会话键。
若要复用已知会话，请传入会话键或标签：

- `--session <key>`：使用特定的 Gateway 网关会话键。
- `--session-label <label>`：按标签解析现有会话。
- `--reset-session`：为该键生成一个新的会话 id（同一个键，新的对话记录）。

如果你的 ACP 客户端支持元数据，你可以按会话覆盖：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/zh-CN/concepts/session) 了解有关会话键的更多信息。

## 选项

- `--url <url>`：Gateway 网关 WebSocket URL（若已配置，则默认使用 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关认证 token。
- `--token-file <path>`：从文件读取 Gateway 网关认证 token。
- `--password <password>`：Gateway 网关认证密码。
- `--password-file <path>`：从文件读取 Gateway 网关认证密码。
- `--session <key>`：默认会话键。
- `--session-label <label>`：要解析的默认会话标签。
- `--require-existing`：如果会话键/标签不存在则失败。
- `--reset-session`：在首次使用前重置会话键。
- `--no-prefix-cwd`：不要在提示前加上工作目录前缀。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 来源元数据或回执。
- `--verbose, -v`：将详细日志输出到 stderr。

安全说明：

- 在某些系统上，`--token` 和 `--password` 可能会出现在本地进程列表中。
- 建议使用 `--token-file`/`--password-file` 或环境变量（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 网关认证解析遵循其他 Gateway 网关客户端所使用的共享约定：
  - 本地模式：环境变量（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> 仅当 `gateway.auth.*` 未设置时才回退到 `gateway.remote.*`（已配置但无法解析的本地 `SecretRefs` 会以失败关闭方式处理）
  - 远程模式：使用 `gateway.remote.*`，并按远程优先级规则从环境变量/配置回退
  - `--url` 是可安全覆盖的，不会复用隐式配置/环境变量凭据；请传入显式的 `--token`/`--password`（或文件变体）
- ACP 运行时后端子进程会收到 `OPENCLAW_SHELL=acp`，可用于特定上下文的 shell/profile 规则。
- `openclaw acp client` 会在启动的桥接进程上设置 `OPENCLAW_SHELL=acp-client`。

### `acp client` 选项

- `--cwd <dir>`：ACP 会话的工作目录。
- `--server <command>`：ACP 服务器命令（默认：`openclaw`）。
- `--server-args <args...>`：传递给 ACP 服务器的额外参数。
- `--server-verbose`：在 ACP 服务器上启用详细日志。
- `--verbose, -v`：详细客户端日志。
