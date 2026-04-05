---
read_when:
    - 你需要一个适合初学者的 TUI 操作指南
    - 你需要 TUI 功能、命令和快捷键的完整列表
summary: 终端 UI（TUI）：从任意机器连接到 Gateway 网关
title: TUI
x-i18n:
    generated_at: "2026-04-05T10:13:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI（终端 UI）

## 快速开始

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

## 你会看到什么

- 页眉：连接 URL、当前智能体、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（connecting、running、streaming、idle、error）。
- 页脚：连接状态 + 智能体 + 会话 + 模型 + think/fast/verbose/reasoning + token 计数 + deliver。
- 输入区：带自动补全的文本编辑器。

## 心智模型：智能体 + 会话

- 智能体是唯一 slug（例如 `main`、`research`）。Gateway 网关会暴露其列表。
- 会话属于当前智能体。
- 会话键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果你输入 `/session main`，TUI 会将其展开为 `agent:<currentAgent>:main`。
  - 如果你输入 `/session agent:other:main`，你会显式切换到该智能体会话。
- 会话范围：
  - `per-sender`（默认）：每个智能体有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前智能体 + 会话始终显示在页脚中。

## 发送 + 投递

- 消息会发送到 Gateway 网关；默认关闭向提供商的投递。
- 开启投递：
  - `/deliver on`
  - 或在 Settings 面板中开启
  - 或通过 `openclaw tui --deliver` 启动

## 选择器 + 叠层界面

- 模型选择器：列出可用模型并设置会话覆盖值。
- 智能体选择器：选择不同的智能体。
- 会话选择器：仅显示当前智能体的会话。
- Settings：切换 deliver、工具输出展开和 thinking 可见性。

## 键盘快捷键

- Enter：发送消息
- Esc：中止当前活动运行
- Ctrl+C：清空输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：智能体选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开状态
- Ctrl+T：切换 thinking 可见性（会重新加载历史记录）

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
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期：

- `/new` 或 `/reset`（重置会话）
- `/abort`（中止当前活动运行）
- `/settings`
- `/exit`

其他 Gateway 网关斜杠命令（例如 `/context`）会被转发到 Gateway 网关，并显示为系统输出。参见 [斜杠命令](/zh-CN/tools/slash-commands)。

## 本地 shell 命令

- 以 `!` 开头输入一行，可在 TUI 宿主机上运行本地 shell 命令。
- TUI 会在每个会话中提示一次，询问是否允许本地执行；如果拒绝，该会话中的 `!` 将保持禁用状态。
- 命令会在 TUI 工作目录中的一个全新非交互式 shell 中运行（不会持久保留 `cd`/环境变量）。
- 本地 shell 命令会在其环境中收到 `OPENCLAW_SHELL=tui-local`。
- 单独一个 `!` 会作为普通消息发送；前导空格不会触发本地 exec。

## 工具输出

- 工具调用会显示为带有参数 + 结果的卡片。
- Ctrl+O 可在折叠/展开视图之间切换。
- 工具运行时，部分更新会流式写入同一张卡片。

## 终端颜色

- TUI 会将助手正文文本保持为你终端的默认前景色，以便深色和浅色终端都能保持可读。
- 如果你的终端使用浅色背景且自动检测错误，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 如果你想强制使用原始深色调色板，请改为设置 `OPENCLAW_THEME=dark`。

## 历史记录 + 流式传输

- 连接时，TUI 会加载最新历史记录（默认 200 条消息）。
- 流式响应会原地更新，直到最终完成。
- TUI 还会监听智能体工具事件，以显示更丰富的工具卡片。

## 连接细节

- TUI 以 `mode: "tui"` 向 Gateway 网关注册。
- 重连时会显示一条系统消息；事件间隙也会显示在日志中。

## 选项

- `--url <url>`：Gateway 网关 WebSocket URL（默认为配置中的值，或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 网关令牌（如果需要）
- `--password <password>`：Gateway 网关密码（如果需要）
- `--session <key>`：会话键（默认为 `main`，如果范围为 global 则默认为 `global`）
- `--deliver`：将助手回复投递到提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的 thinking 级别
- `--message <text>`：连接后发送一条初始消息
- `--timeout-ms <ms>`：智能体超时（毫秒，默认值来自 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史记录条目数（默认 `200`）

注意：设置 `--url` 时，TUI 不会回退到配置或环境凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

## 故障排除

发送消息后没有输出：

- 在 TUI 中运行 `/status`，确认 Gateway 网关已连接且处于 idle/busy 状态。
- 检查 Gateway 网关日志：`openclaw logs --follow`。
- 确认智能体可以运行：`openclaw status` 和 `openclaw models status`。
- 如果你希望消息出现在某个聊天渠道中，请启用投递（`/deliver on` 或 `--deliver`）。

## 连接故障排除

- `disconnected`：请确认 Gateway 网关正在运行，并且你的 `--url/--token/--password` 正确。
- 选择器中没有智能体：请检查 `openclaw agents list` 和你的路由配置。
- 会话选择器为空：你可能处于 global 范围，或者还没有任何会话。

## 相关内容

- [控制 UI](/web/control-ui) — 基于 Web 的控制界面
- [CLI 参考](/cli) — 完整的 CLI 命令参考
