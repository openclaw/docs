---
read_when:
    - 你想要一份适合初学者的终端 UI（TUI）使用指南
    - 你需要终端 UI（TUI）功能、命令和快捷键的完整列表
summary: 终端 UI（TUI）：连接到 Gateway 网关，或以嵌入模式在本地运行
title: 终端 UI（TUI）
x-i18n:
    generated_at: "2026-04-25T10:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## 快速开始

### Gateway 网关模式

1. 启动 Gateway 网关。

```bash
openclaw gateway
```

2. 打开终端 UI（TUI）。

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

不通过 Gateway 网关运行终端 UI（TUI）：

```bash
openclaw chat
# 或
openclaw tui --local
```

说明：

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 一起使用。
- 本地模式直接使用嵌入式智能体运行时。大多数本地工具都可以使用，但仅限 Gateway 网关的功能不可用。
- `openclaw` 和 `openclaw crestodian` 也使用这个终端 UI（TUI）shell，其中 Crestodian 作为本地设置和修复聊天后端。

## 界面内容

- 标题栏：连接 URL、当前智能体、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接 / 运行状态（正在连接、正在运行、流式传输中、空闲、错误）。
- 页脚：连接状态 + 智能体 + 会话 + 模型 + think/fast/verbose/trace/reasoning + token 计数 + deliver。
- 输入区：带自动补全的文本编辑器。

## 心智模型：智能体 + 会话

- 智能体是唯一的 slug（例如 `main`、`research`）。Gateway 网关会提供这个列表。
- 会话属于当前智能体。
- 会话键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果你输入 `/session main`，终端 UI（TUI）会将其展开为 `agent:<currentAgent>:main`。
  - 如果你输入 `/session agent:other:main`，你会显式切换到那个智能体会话。
- 会话作用域：
  - `per-sender`（默认）：每个智能体有多个会话。
  - `global`：终端 UI（TUI）始终使用 `global` 会话（选择器可能为空）。
- 当前智能体 + 会话始终显示在页脚中。

## 发送 + 投递

- 消息会发送到 Gateway 网关；默认不会投递给提供商。
- 开启投递：
  - `/deliver on`
  - 或在“设置”面板中开启
  - 或通过 `openclaw tui --deliver` 启动

## 选择器 + 覆盖层

- 模型选择器：列出可用模型并设置会话覆盖项。
- 智能体选择器：选择另一个智能体。
- 会话选择器：仅显示当前智能体的会话。
- 设置：切换投递、工具输出展开，以及思考内容可见性。

## 键盘快捷键

- Enter：发送消息
- Esc：中止当前运行
- Ctrl+C：清空输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：智能体选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开状态
- Ctrl+T：切换思考内容可见性（会重新加载历史记录）

## 斜杠命令

核心命令：

- `/help`
- `/status`
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

会话控制：

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期：

- `/new` 或 `/reset`（重置会话）
- `/abort`（中止当前运行）
- `/settings`
- `/exit`

仅本地模式：

- `/auth [provider]` 在终端 UI（TUI）内打开提供商认证 / 登录流程。

其他 Gateway 网关斜杠命令（例如 `/context`）会转发到 Gateway 网关，并显示为系统输出。参见 [Slash commands](/zh-CN/tools/slash-commands)。

## 本地 shell 命令

- 在一行前加上 `!` 可在终端 UI（TUI）主机上运行本地 shell 命令。
- 终端 UI（TUI）会在每个会话中提示一次，以允许本地执行；如果拒绝，该会话中的 `!` 将保持禁用。
- 命令会在终端 UI（TUI）工作目录中的一个全新、非交互式 shell 中运行（`cd` / 环境变量不会持久保留）。
- 本地 shell 命令在其环境中会收到 `OPENCLAW_SHELL=tui-local`。
- 单独一个 `!` 会作为普通消息发送；前导空格不会触发本地执行。

## 从本地终端 UI（TUI）修复配置

当当前配置已经通过验证，并且你希望嵌入式智能体在同一台机器上检查配置、将其与文档对比，并在不依赖运行中的 Gateway 网关的情况下帮助修复漂移时，请使用本地模式。

如果 `openclaw config validate` 已经失败，请先从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置保护。

典型流程：

1. 启动本地模式：

```bash
openclaw chat
```

2. 告诉智能体你想检查什么，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本地 shell 命令获取精确证据并进行验证：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 应用小范围更改，然后重新运行 `!openclaw config validate`。
5. 如果 Doctor 建议执行自动迁移或修复，请先审查，再运行 `!openclaw doctor --fix`。

提示：

- 优先使用 `openclaw config set` 或 `openclaw configure`，而不是手动编辑 `openclaw.json`。
- `openclaw docs "<query>"` 会在同一台机器上搜索实时文档索引。
- 当你需要结构化的 schema 和 SecretRef / 可解析性错误时，`openclaw config validate --json` 很有用。

## 工具输出

- 工具调用会显示为带参数 + 结果的卡片。
- Ctrl+O 可在折叠 / 展开视图之间切换。
- 工具运行期间，部分更新会流式写入同一张卡片。

## 终端颜色

- 终端 UI（TUI）会将助手正文文本保持为你终端的默认前景色，因此深色和浅色终端都能保持可读。
- 如果你的终端使用浅色背景而自动检测不正确，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 如果要改为强制使用原始深色配色，请设置 `OPENCLAW_THEME=dark`。

## 历史记录 + 流式传输

- 连接时，终端 UI（TUI）会加载最新历史记录（默认 200 条消息）。
- 流式响应会就地更新，直到最终完成。
- 终端 UI（TUI）还会监听智能体工具事件，以显示更丰富的工具卡片。

## 连接详情

- 终端 UI（TUI）会以 `mode: "tui"` 的形式向 Gateway 网关注册。
- 重连时会显示系统消息；事件缺口会在日志中提示。

## 选项

- `--local`：针对本地嵌入式智能体运行时运行
- `--url <url>`：Gateway 网关 WebSocket URL（默认为配置中的值或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 网关 token（如果需要）
- `--password <password>`：Gateway 网关密码（如果需要）
- `--session <key>`：会话键（默认：`main`，若作用域为 global，则为 `global`）
- `--deliver`：将助手回复投递给提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的思考级别
- `--message <text>`：连接后发送一条初始消息
- `--timeout-ms <ms>`：智能体超时时间（毫秒）（默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史记录条目数（默认 `200`）

注意：设置 `--url` 后，终端 UI（TUI）不会回退使用配置或环境变量中的凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。
在本地模式下，不要传入 `--url`、`--token` 或 `--password`。

## 故障排除

发送消息后没有输出：

- 在终端 UI（TUI）中运行 `/status`，确认 Gateway 网关已连接且处于空闲 / 忙碌状态。
- 检查 Gateway 网关日志：`openclaw logs --follow`。
- 确认智能体可以运行：`openclaw status` 和 `openclaw models status`。
- 如果你希望消息出现在聊天渠道中，请启用投递（`/deliver on` 或 `--deliver`）。

## 连接故障排除

- `disconnected`：确认 Gateway 网关正在运行，并且你的 `--url/--token/--password` 正确。
- 选择器中没有智能体：检查 `openclaw agents list` 和你的路由配置。
- 会话选择器为空：你可能处于 global 作用域，或者还没有任何会话。

## 相关内容

- [Control UI](/zh-CN/web/control-ui) —— 基于 Web 的控制界面
- [Config](/zh-CN/cli/config) —— 检查、验证并编辑 `openclaw.json`
- [Doctor](/zh-CN/cli/doctor) —— 引导式修复与迁移检查
- [CLI Reference](/zh-CN/cli) —— 完整 CLI 命令参考
