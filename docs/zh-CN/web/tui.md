---
read_when:
    - 你想要一份适合初学者的 TUI 演练指南
    - 你需要完整的 TUI 功能、命令和快捷键列表
summary: 终端界面（TUI）：连接到 Gateway 网关，或在嵌入模式下本地运行
title: 终端用户界面
x-i18n:
    generated_at: "2026-07-05T11:50:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8950c282ec9cab35c6ca35b35184f75a54902cd16d1b48140e1753cd79eb06a3
    source_path: web/tui.md
    workflow: 16
---

## 快速开始

### Gateway 网关模式

1. 启动 Gateway 网关。

```bash
openclaw gateway
```

2. 打开 TUI。

```bash
openclaw tui
```

3. 输入一条消息并按 Enter。

远程 Gateway 网关：

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

如果你的 Gateway 网关使用密码认证，请使用 `--password`。

### 本地模式

不通过 Gateway 网关运行 TUI：

```bash
openclaw chat
# or
openclaw tui --local
```

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- 本地模式会直接使用嵌入式 agent 运行时。大多数本地工具可用，但仅 Gateway 网关支持的功能不可用。
- 裸 `openclaw`（无子命令）会自动选择目标：未配置的安装会运行新手引导；无效配置会打开 [Crestodian](#crestodian-setup-and-repair-helper)；有效配置在 Gateway 网关可达时会以 Gateway 网关模式打开此 TUI shell，否则以本地模式打开。

## 你会看到什么

- 标题栏：连接 URL、当前 agent、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（连接中、运行中、流式传输中、空闲、错误）。
- 页脚：agent + 会话 + 模型 + 目标状态 + think/fast/verbose/trace/reasoning + token 计数 + 送达。当启用 `tui.footer.showRemoteHost` 时，远程 Gateway 网关连接还会显示连接主机。
- 输入区：带自动补全的文本编辑器。

## 心智模型：agent + 会话

- Agent 是唯一 slug（例如 `main`、`research`）。Gateway 网关会暴露这个列表。
- 会话属于当前 agent。
- 会话键按 `agent:<agentId>:<sessionKey>` 存储。
  - 如果你输入 `/session main`，TUI 会将它展开为 `agent:<currentAgent>:main`。
  - 如果你输入 `/session agent:other:main`，你会显式切换到该 agent 会话。
- 会话范围：
  - `per-sender`（默认）：每个 agent 有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前 agent + 会话始终会显示在页脚中。
- 要为非本地、URL 支持的连接显示 Gateway 网关主机，请选择启用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  默认值为 `false`。Loopback 和嵌入式本地连接永远不会显示主机标签。

- 如果会话有一个[目标](/zh-CN/tools/goal)，页脚会显示其紧凑状态：
  `Pursuing goal`、`Goal paused (/goal resume)`、`Goal blocked (/goal resume)` 或 `Goal achieved`。
- 在未使用 `--session` 启动时，如果同一 Gateway 网关、agent 和会话范围下上次选择的会话仍然存在，Gateway 网关模式 TUI 会恢复它。传入 `--session`、`/session`、`/new` 或 `/reset` 仍然是显式操作。

## 发送 + 送达

- 消息始终会发往 Gateway 网关（或本地模式中的嵌入式运行时）；将助手回复再送回聊天提供商是一个单独的步骤，默认关闭。
- TUI 是类似 WebChat 的内部来源界面，不是通用出站渠道。需要 `tools.message` 来产生可见回复的 harness 可以通过无目标的 `message.send` 满足当前 TUI 轮次；显式提供商送达仍使用正常配置的渠道，并且永远不会回退到 `lastChannel`。
- 送达设置在启动时会固定于整个 TUI 会话：使用 `openclaw tui --deliver` 启动即可开启。没有 `/deliver` 斜杠命令或 Settings 开关可在会话中途切换；要更改它，请重启 TUI。

## 选择器 + 覆盖层

- 模型选择器：列出可用模型并设置会话覆盖值。
- Agent 选择器：选择另一个 agent。
- 会话选择器：显示当前 agent 在过去 7 天内更新的最多 50 个会话。使用 `/session <key>` 跳转到较早的已知会话。
- Settings（`/settings`）：切换工具输出展开和思考可见性。此面板不控制送达。

## 键盘快捷键

- Enter：发送消息
- Esc：中止活跃运行
- Ctrl+C：清空输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：agent 选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开
- Ctrl+T：切换思考可见性（重新加载历史）

## 斜杠命令

核心：

- `/help`
- `/status`（由 Gateway 网关转发；显示会话/模型摘要）
- `/gateway-status`（别名 `/gwstatus`；直接显示 Gateway 网关连接状态）
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

会话控制：

- `/think <off|minimal|low|medium|high>`（更高级别可能会根据模型添加 `xhigh`/`max` 等级）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 会清除会话覆盖值）
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`

会话生命周期：

- `/new`（在新键下生成一个全新的隔离会话；不会影响旧会话上的其他 TUI 客户端）
- `/reset`（就地重置当前会话键）
- `/abort`（中止活跃运行）
- `/settings`
- `/exit`（或 `/quit`）

仅本地模式：

- `/auth [provider]` 会在 TUI 内打开提供商认证/登录流程。

Crestodian：

- `/crestodian [request]` 会从普通 agent TUI 返回到 [Crestodian](#crestodian-setup-and-repair-helper) 设置/修复聊天，并可选择转发一个请求。

其他 Gateway 网关斜杠命令（例如 `/context`）会被转发到 Gateway 网关，并显示为系统输出。请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

## 本地 shell 命令

- 在一行前加上 `!`，即可在 TUI 主机上运行本地 shell 命令。
- TUI 每个会话只会提示一次，以允许本地执行；拒绝后会在该会话中保持禁用 `!`。
- 命令会在 TUI 工作目录中的一个全新的非交互式 shell 中运行（没有持久的 `cd`/env）。
- 本地 shell 命令会在环境中收到 `OPENCLAW_SHELL=tui-local`。
- 单独一个 `!` 会作为普通消息发送；前导空格不会触发本地 exec。

## Crestodian 设置和修复助手

Crestodian 是 ring-zero 设置/修复助手，以 `openclaw crestodian` 暴露（或在裸 `openclaw` 发现无效配置时自动启动）。它运行在与 `openclaw tui --local` 相同的本地 TUI shell 中，背后使用专用的对话/操作层，而不是实时模型+工具会话：

```bash
openclaw crestodian                       # start interactively
openclaw crestodian -m "status"           # run one request and exit
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # apply a config write
```

- 持久配置写入需要审批：可以交互式确认，或传入 `--yes`。
- `--json` 会以 JSON 打印启动概览，而不是启动聊天。
- 在 Crestodian 内部，`open-tui` 请求（例如，要求与普通 agent 对话）会退出 Crestodian 并打开常规 agent TUI；在那里使用 `/crestodian` 可返回。

当当前配置已经验证通过，并且你希望嵌入式 agent 在同一台机器上检查配置、与文档对比，并在不依赖正在运行的 Gateway 网关的情况下帮助修复漂移时，请使用本地模式。

如果 `openclaw config validate` 已经失败，请先从 `openclaw configure` 或 `openclaw doctor --fix` 开始；`openclaw chat` 仍需要可加载的配置才能启动。

典型循环：

1. 启动本地模式：

```bash
openclaw chat
```

2. 询问 agent 你想检查的内容，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本地 shell 命令获取准确证据和验证：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 应用小范围更改，然后重新运行 `!openclaw config validate`。
5. 如果 Doctor 建议自动迁移或修复，请先查看它，然后运行 `!openclaw doctor --fix`。

提示：

- 优先使用 `openclaw config set` 或 `openclaw configure`，而不是手动编辑 `openclaw.json`。
- `openclaw docs "<query>"` 会从同一台机器搜索实时文档索引。
- 当你需要结构化 schema 以及 SecretRef/可解析性错误时，`openclaw config validate --json` 很有用。

## 工具输出

- 工具调用会显示为带有参数 + 结果的卡片。
- Ctrl+O 会在折叠/展开视图之间切换。
- 工具运行时，部分更新会流式传输到同一张卡片中。

## 终端颜色

- TUI 会将助手正文文本保持为你的终端默认前景色，因此深色和浅色终端都能保持可读。
- 如果你的终端使用浅色背景且自动检测错误，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 如需强制使用原始深色调色板，请改为设置 `OPENCLAW_THEME=dark`。

## 历史 + 流式传输

- 连接时，TUI 会加载最新历史（默认 200 条消息）。
- 流式传输响应会原地更新，直到最终完成。
- TUI 还会监听 agent 工具事件，以提供更丰富的工具卡片。

## 连接详情

- TUI 会以客户端 id `openclaw-tui` 在粗粒度 `ui` 客户端模式下连接（与 Control UI 和 WebChat 用于 Gateway 网关策略的模式相同）。
- 重连会显示一条系统消息；事件缺口会显示在日志中。

## 选项

- `--local`：针对本地嵌入式 agent 运行时运行
- `--url <url>`：Gateway 网关 WebSocket URL（默认为配置中的 `gateway.remote.url`，或 loopback 上的 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 网关令牌（如果需要）
- `--password <password>`：Gateway 网关密码（如果需要）
- `--session <key>`：会话键（默认：`main`，或范围为全局时的 `global`）
- `--deliver`：将助手回复送达到提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的思考级别
- `--message <text>`：连接后发送初始消息
- `--timeout-ms <ms>`：Agent 超时时间，单位 ms（默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史条目数（默认 `200`）

<Warning>
设置 `--url` 时，TUI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据会导致错误。在本地模式中，不要传入 `--url`、`--token` 或 `--password`。
</Warning>

## 故障排查

发送消息后没有输出：

- 在 TUI 中运行 `/status`，确认 Gateway 网关已连接且处于空闲/忙碌状态。
- 检查 Gateway 网关日志：`openclaw logs --follow`。
- 确认 agent 可以运行：`openclaw status` 和 `openclaw models status`。
- 如果你期望消息出现在聊天渠道中，请确认 TUI 是使用 `--deliver` 启动的（不重启则无法稍后开启）。

## 连接故障排查

- `disconnected`：确保 Gateway 网关正在运行，并且你的 `--url/--token/--password` 正确。
- 选择器中没有 agent：检查 `openclaw agents list` 和你的路由配置。
- 会话选择器为空：你可能处于全局范围，或还没有任何会话。

## 相关内容

- [Control UI](/zh-CN/web/control-ui) — 基于 Web 的控制界面
- [配置](/zh-CN/cli/config) — 检查、验证和编辑 `openclaw.json`
- [Doctor](/zh-CN/cli/doctor) — 引导式修复和迁移检查
- [CLI 参考](/zh-CN/cli) — 完整 CLI 命令参考
