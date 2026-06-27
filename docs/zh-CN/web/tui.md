---
read_when:
    - 你想要一份适合初学者的 TUI 演练
    - 你需要完整的 TUI 功能、命令和快捷键列表
summary: 终端 UI（TUI）：连接到 Gateway 网关，或在嵌入模式下本地运行
title: 终端用户界面
x-i18n:
    generated_at: "2026-06-27T03:37:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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

3. 输入消息并按 Enter。

远程 Gateway 网关：

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

如果你的 Gateway 网关使用密码认证，请使用 `--password`。

### 本地模式

在不使用 Gateway 网关的情况下运行 TUI：

```bash
openclaw chat
# or
openclaw tui --local
```

说明：

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- 本地模式会直接使用嵌入式智能体运行时。大多数本地工具都可用，但仅 Gateway 网关支持的功能不可用。
- 配置文件已有已编写的设置后，`openclaw` 和 `openclaw crestodian` 也会使用这个 TUI shell，其中 Crestodian 作为本地设置和修复聊天后端。

## 你会看到什么

- 标头：连接 URL、当前智能体、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（正在连接、正在运行、正在流式传输、空闲、错误）。
- 页脚：智能体 + 会话 + 模型 + 目标状态 + think/fast/verbose/trace/reasoning + token 计数 + deliver。启用 `tui.footer.showRemoteHost` 时，远程 Gateway 网关连接也会显示连接主机。
- 输入区：带自动补全的文本编辑器。

## 心智模型：智能体 + 会话

- 智能体是唯一 slug（例如 `main`、`research`）。Gateway 网关会公开这个列表。
- 会话属于当前智能体。
- 会话键以 `agent:<agentId>:<sessionKey>` 形式存储。
  - 如果你输入 `/session main`，TUI 会将其展开为 `agent:<currentAgent>:main`。
  - 如果你输入 `/session agent:other:main`，你会明确切换到那个智能体会话。
- 会话作用域：
  - `per-sender`（默认）：每个智能体有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前智能体 + 会话始终显示在页脚中。
- 如需为非本地、由 URL 支持的连接显示 Gateway 网关主机，请选择启用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Loopback 和嵌入式本地连接永远不会显示主机标签。

- 如果会话有一个[目标](/zh-CN/tools/goal)，页脚会显示它的紧凑状态，例如 `Pursuing goal`、`Goal paused (/goal resume)` 或 `Goal achieved`。
- 在未使用 `--session` 启动时，如果同一 Gateway 网关、智能体和会话作用域下上次选择的会话仍然存在，Gateway 网关模式的 TUI 会恢复该会话。传入 `--session`、`/session`、`/new` 或 `/reset` 仍然是显式操作。

## 发送 + 递送

- 消息会发送到 Gateway 网关；默认关闭向提供商递送。
- TUI 是类似 WebChat 的内部来源表面，不是通用出站渠道。对于需要 `tools.message` 才能产生可见回复的 harness，可通过无目标的 `message.send` 满足当前 TUI 轮次；显式提供商递送仍使用正常配置的渠道，且永远不会回退到 `lastChannel`。
- 开启轮次递送：
  - `/deliver on`
  - 或使用设置面板
  - 或使用 `openclaw tui --deliver` 启动

## 选择器 + 覆盖层

- 模型选择器：列出可用模型并设置会话覆盖项。
- 智能体选择器：选择不同的智能体。
- 会话选择器：显示当前智能体在过去 7 天内更新的最多 50 个会话。使用 `/session <key>` 可跳转到更早的已知会话。
- 设置：切换递送、工具输出展开以及 thinking 可见性。

## 键盘快捷键

- Enter：发送消息
- Esc：中止活动运行
- Ctrl+C：清空输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：智能体选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开
- Ctrl+T：切换 thinking 可见性（重新加载历史）

## 斜杠命令

核心：

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
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 会清除会话覆盖项）
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期：

- `/new` 或 `/reset`（重置会话）
- `/abort`（中止活动运行）
- `/settings`
- `/exit`

仅本地模式：

- `/auth [provider]` 会在 TUI 内打开提供商认证/登录流程。

其他 Gateway 网关斜杠命令（例如 `/context`）会转发到 Gateway 网关，并显示为系统输出。参见[斜杠命令](/zh-CN/tools/slash-commands)。

## 本地 shell 命令

- 在一行前加上 `!`，即可在 TUI 主机上运行本地 shell 命令。
- TUI 每个会话只提示一次是否允许本地执行；拒绝后，本会话会保持禁用 `!`。
- 命令会在 TUI 工作目录中的全新非交互式 shell 中运行（没有持久的 `cd`/env）。
- 本地 shell 命令会在其环境中收到 `OPENCLAW_SHELL=tui-local`。
- 单独的 `!` 会作为普通消息发送；前导空格不会触发本地 exec。

## 从本地 TUI 修复配置

当当前配置已经通过校验，并且你希望嵌入式智能体在同一台机器上检查它、将它与文档对比，并在不依赖运行中 Gateway 网关的情况下帮助修复漂移时，请使用本地模式。

如果 `openclaw config validate` 已经失败，请先从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置保护。

典型循环：

1. 启动本地模式：

```bash
openclaw chat
```

2. 询问智能体你想检查的内容，例如：

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
5. 如果 Doctor 建议自动迁移或修复，请先审查它，再运行 `!openclaw doctor --fix`。

提示：

- 优先使用 `openclaw config set` 或 `openclaw configure`，而不是手动编辑 `openclaw.json`。
- `openclaw docs "<query>"` 会从同一台机器搜索实时文档索引。
- 当你需要结构化 schema 和 SecretRef/可解析性错误时，`openclaw config validate --json` 很有用。

## 工具输出

- 工具调用会以包含参数 + 结果的卡片显示。
- Ctrl+O 可在折叠/展开视图之间切换。
- 工具运行时，部分更新会流式传输到同一张卡片中。

## 终端颜色

- TUI 会让助手正文使用你的终端默认前景色，这样深色和浅色终端都能保持可读。
- 如果你的终端使用浅色背景且自动检测错误，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 如需改为强制使用原始深色调色板，请设置 `OPENCLAW_THEME=dark`。

## 历史 + 流式传输

- 连接时，TUI 会加载最新历史（默认 200 条消息）。
- 流式传输响应会原地更新，直到最终完成。
- TUI 还会监听智能体工具事件，以显示更丰富的工具卡片。

## 连接详细信息

- TUI 会以 `mode: "tui"` 注册到 Gateway 网关。
- 重新连接会显示系统消息；事件间隙会在日志中呈现。

## 选项

- `--local`：针对本地嵌入式智能体运行时运行
- `--url <url>`：Gateway 网关 WebSocket URL（默认来自配置，或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 网关 token（如果需要）
- `--password <password>`：Gateway 网关密码（如果需要）
- `--session <key>`：会话键（默认：`main`；当作用域为 global 时为 `global`）
- `--deliver`：将助手回复递送给提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的 thinking 级别
- `--message <text>`：连接后发送初始消息
- `--timeout-ms <ms>`：智能体超时时间，单位为 ms（默认来自 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史条目数（默认 `200`）

<Warning>
设置 `--url` 时，TUI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据会导致错误。在本地模式下，不要传入 `--url`、`--token` 或 `--password`。
</Warning>

## 故障排除

发送消息后没有输出：

- 在 TUI 中运行 `/status`，确认 Gateway 网关已连接并处于空闲/忙碌状态。
- 检查 Gateway 网关日志：`openclaw logs --follow`。
- 确认智能体可以运行：`openclaw status` 和 `openclaw models status`。
- 如果你期望在聊天渠道中收到消息，请启用递送（`/deliver on` 或 `--deliver`）。

## 连接故障排除

- `disconnected`：确保 Gateway 网关正在运行，并且你的 `--url/--token/--password` 正确。
- 选择器中没有智能体：检查 `openclaw agents list` 和你的路由配置。
- 会话选择器为空：你可能处于 global 作用域，或者还没有任何会话。

## 相关

- [Control UI](/zh-CN/web/control-ui) — 基于 Web 的控制界面
- [配置](/zh-CN/cli/config) — 检查、验证和编辑 `openclaw.json`
- [Doctor](/zh-CN/cli/doctor) — 引导式修复和迁移检查
- [CLI 参考](/zh-CN/cli) — 完整 CLI 命令参考
