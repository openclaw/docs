---
read_when:
    - 你想要一份适合初学者的 TUI 使用演练
    - 你需要 TUI 功能、命令和快捷键的完整列表
summary: 终端界面 (TUI)：连接到 Gateway 网关，或在本地以嵌入模式运行
title: 终端用户界面
x-i18n:
    generated_at: "2026-05-05T08:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
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

不通过 Gateway 网关运行 TUI：

```bash
openclaw chat
# or
openclaw tui --local
```

注意：

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- 本地模式会直接使用嵌入式智能体运行时。大多数本地工具可以工作，但仅 Gateway 网关可用的功能不可用。
- `openclaw` 和 `openclaw crestodian` 也使用这个 TUI shell，其中 Crestodian 作为本地设置和修复聊天后端。

## 你会看到什么

- 标头：连接 URL、当前智能体、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- Status 行：连接/运行状态（正在连接、运行中、流式传输中、空闲、错误）。
- 页脚：连接状态 + 智能体 + 会话 + 模型 + 思考/快速/详细/跟踪/推理 + token 计数 + 交付。
- 输入区：带自动补全的文本编辑器。

## 心智模型：智能体 + 会话

- 智能体是唯一 slug（例如 `main`、`research`）。Gateway 网关会公开该列表。
- 会话属于当前智能体。
- 会话键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果你输入 `/session main`，TUI 会将其展开为 `agent:<currentAgent>:main`。
  - 如果你输入 `/session agent:other:main`，你会显式切换到该智能体会话。
- 会话范围：
  - `per-sender`（默认）：每个智能体有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前智能体 + 会话始终显示在页脚中。
- 在没有 `--session` 的情况下启动时，Gateway 网关模式 TUI 会恢复同一 Gateway 网关、智能体和会话范围的上次所选会话，前提是该会话仍然存在。传入 `--session`、`/session`、`/new` 或 `/reset` 仍然是显式操作。

## 发送 + 交付

- 消息会发送到 Gateway 网关；默认关闭向提供商交付。
- 开启交付：
  - `/deliver on`
  - 或使用设置面板
  - 或以 `openclaw tui --deliver` 启动

## 选择器 + 叠加层

- 模型选择器：列出可用模型并设置会话覆盖项。
- 智能体选择器：选择不同的智能体。
- 会话选择器：显示当前智能体在过去 7 天内更新的最多 50 个会话。使用 `/session <key>` 跳转到较旧的已知会话。
- 设置：切换交付、工具输出展开和思考可见性。

## 键盘快捷键

- Enter：发送消息
- Esc：中止正在运行的任务
- Ctrl+C：清空输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：智能体选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开
- Ctrl+T：切换思考可见性（重新加载历史）

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
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期：

- `/new` 或 `/reset`（重置会话）
- `/abort`（中止正在运行的任务）
- `/settings`
- `/exit`

仅本地模式：

- `/auth [provider]` 会在 TUI 内打开提供商认证/登录流程。

其他 Gateway 网关斜杠命令（例如 `/context`）会转发到 Gateway 网关，并显示为系统输出。请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

## 本地 shell 命令

- 在一行前加上 `!`，即可在 TUI 主机上运行本地 shell 命令。
- TUI 会在每个会话中提示一次，以允许本地执行；拒绝后，`!` 在该会话中保持禁用。
- 命令会在 TUI 工作目录中的全新非交互式 shell 内运行（没有持久的 `cd`/环境变量）。
- 本地 shell 命令会在其环境中收到 `OPENCLAW_SHELL=tui-local`。
- 单独的 `!` 会作为普通消息发送；前导空格不会触发本地执行。

## 从本地 TUI 修复配置

当当前配置已经通过验证，并且你希望嵌入式智能体在同一台机器上检查它、与文档对比并帮助修复漂移，而不依赖正在运行的 Gateway 网关时，请使用本地模式。

如果 `openclaw config validate` 已经失败，请先从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置保护。

典型循环：

1. 启动本地模式：

```bash
openclaw chat
```

2. 询问智能体你希望检查的内容，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本地 shell 命令获取精确证据并验证：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 应用小范围更改，然后重新运行 `!openclaw config validate`。
5. 如果 Doctor 建议自动迁移或修复，请先审查它，然后运行 `!openclaw doctor --fix`。

提示：

- 优先使用 `openclaw config set` 或 `openclaw configure`，而不是手动编辑 `openclaw.json`。
- `openclaw docs "<query>"` 会从同一台机器搜索实时文档索引。
- 当你需要结构化 schema 和 SecretRef/可解析性错误时，`openclaw config validate --json` 很有用。

## 工具输出

- 工具调用会显示为带有参数 + 结果的卡片。
- Ctrl+O 在折叠/展开视图之间切换。
- 工具运行时，部分更新会流式传输到同一张卡片中。

## 终端颜色

- TUI 会让助手正文文本保持为你的终端默认前景色，以便深色和浅色终端都保持可读。
- 如果你的终端使用浅色背景且自动检测错误，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 若要改为强制使用原始深色调色板，请设置 `OPENCLAW_THEME=dark`。

## 历史 + 流式传输

- 连接时，TUI 会加载最新历史（默认 200 条消息）。
- 流式传输响应会就地更新，直到最终完成。
- TUI 还会监听智能体工具事件，以提供更丰富的工具卡片。

## 连接详情

- TUI 会以 `mode: "tui"` 注册到 Gateway 网关。
- 重新连接会显示一条系统消息；事件缺口会在日志中显示。

## 选项

- `--local`：针对本地嵌入式智能体运行时运行
- `--url <url>`：Gateway 网关 WebSocket URL（默认为配置或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 网关 token（如需要）
- `--password <password>`：Gateway 网关密码（如需要）
- `--session <key>`：会话键（默认：`main`，当范围为 global 时则为 `global`）
- `--deliver`：将助手回复交付给提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的思考级别
- `--message <text>`：连接后发送初始消息
- `--timeout-ms <ms>`：智能体超时时间，单位为 ms（默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史条目数（默认 `200`）

<Warning>
设置 `--url` 时，TUI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据会报错。在本地模式下，不要传入 `--url`、`--token` 或 `--password`。
</Warning>

## 故障排除

发送消息后没有输出：

- 在 TUI 中运行 `/status`，确认 Gateway 网关已连接且处于空闲/忙碌状态。
- 检查 Gateway 网关日志：`openclaw logs --follow`。
- 确认智能体可以运行：`openclaw status` 和 `openclaw models status`。
- 如果你期望消息出现在聊天渠道中，请启用交付（`/deliver on` 或 `--deliver`）。

## 连接故障排除

- `disconnected`：确保 Gateway 网关正在运行，并且你的 `--url/--token/--password` 正确。
- 选择器中没有智能体：检查 `openclaw agents list` 和你的路由配置。
- 会话选择器为空：你可能处于 global 范围，或者还没有任何会话。

## 相关

- [控制界面](/zh-CN/web/control-ui) — 基于 Web 的控制界面
- [配置](/zh-CN/cli/config) — 检查、验证和编辑 `openclaw.json`
- [Doctor](/zh-CN/cli/doctor) — 引导式修复和迁移检查
- [CLI 参考](/zh-CN/cli) — 完整 CLI 命令参考
