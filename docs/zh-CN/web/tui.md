---
read_when:
    - 你想要一份适合初学者的 TUI 操作指南
    - 你需要 TUI 功能、命令和快捷键的完整列表
summary: 终端用户界面（TUI）：连接到 Gateway 网关，或以嵌入模式在本地运行
title: 终端用户界面
x-i18n:
    generated_at: "2026-07-11T21:04:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

如果你的 Gateway 网关使用密码身份验证，请使用 `--password`。

### 本地模式

在不使用 Gateway 网关的情况下运行 TUI：

```bash
openclaw chat
# or
openclaw tui --local
```

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 结合使用。
- 本地模式直接使用嵌入式智能体运行时。大多数本地工具均可使用，但仅限 Gateway 网关的功能不可用。
- 不带子命令的 `openclaw` 会自动选择目标：未配置的安装会运行推理新手引导；无效配置会打开经典 Doctor 指引；如果已配置的 Gateway 网关可访问，则会以 Gateway 网关模式打开此 TUI shell；否则，如果已配置本地模型，则会以本地模式打开。

## 你会看到什么

- 页眉：连接 URL、当前智能体、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（正在连接、正在运行、正在流式传输、空闲、错误）。
- 页脚：智能体 + 会话 + 模型 + 目标状态 + 思考/快速/详细/跟踪/推理 + token 数量 + 投递。当启用 `tui.footer.showRemoteHost` 时，远程 Gateway 网关连接还会显示连接主机。
- 输入区：带自动补全功能的文本编辑器。

## 心智模型：智能体 + 会话

- 智能体使用唯一的 slug（例如 `main`、`research`）。Gateway 网关会公开该列表。
- 会话属于当前智能体。
- 会话键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果输入 `/session main`，TUI 会将其展开为 `agent:<currentAgent>:main`。
  - 如果输入 `/session agent:other:main`，则会明确切换到该智能体会话。
- 会话作用域：
  - `per-sender`（默认）：每个智能体拥有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前智能体和会话始终显示在页脚中。
- 若要为非本地、基于 URL 的连接显示 Gateway 网关主机，请使用以下命令启用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  默认值为 `false`。回环连接和嵌入式本地连接永远不会显示主机标签。

- 如果会话包含[目标](/zh-CN/tools/goal)，页脚会显示其紧凑状态：
  `正在追求目标`、`目标已暂停（/goal resume）`、`目标受阻（/goal resume）` 或 `目标已达成`。
- 在未指定 `--session` 的情况下启动时，如果同一 Gateway 网关、智能体和会话作用域中上次选择的会话仍然存在，Gateway 网关模式的 TUI 会恢复该会话。传入 `--session` 或使用 `/session`、`/new`、`/reset` 仍属于明确操作。

## 发送和投递

- 消息始终发送到 Gateway 网关（本地模式下则发送到嵌入式运行时）；将助手回复投递回聊天提供商是一个独立步骤，默认关闭。
- TUI 是类似 WebChat 的内部来源界面，并非通用出站渠道。要求使用 `tools.message` 发送可见回复的 harness，可通过不指定目标的 `message.send` 完成当前 TUI 轮次；明确的提供商投递仍使用正常配置的渠道，且绝不会回退到 `lastChannel`。
- 投递设置在启动时即固定，并在整个 TUI 会话中保持不变：使用 `openclaw tui --deliver` 启动即可开启投递。没有可在会话中途切换投递的 `/deliver` 斜杠命令或设置开关；如需更改，请重新启动 TUI。

## 选择器和浮层

- 模型选择器：列出可用模型并设置会话覆盖值。
- 智能体选择器：选择其他智能体。
- 会话选择器：最多显示当前智能体在最近 7 天内更新的 50 个会话。使用 `/session <key>` 可跳转到更早的已知会话。
- 设置（`/settings`）：切换工具输出展开状态和思考过程可见性。此面板不控制投递。

## 键盘快捷键

- Enter：发送消息
- Esc：中止当前运行
- Ctrl+C：清除输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：智能体选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开状态
- Ctrl+T：切换思考过程可见性（重新加载历史记录）

## 斜杠命令

核心命令：

- `/help`
- `/status`（转发至 Gateway 网关；显示会话/模型摘要）
- `/gateway-status`（别名 `/gwstatus`；直接显示 Gateway 网关连接状态）
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

会话控制：

- `/think <off|minimal|low|medium|high>`（根据模型的不同，更高层级可能包含 `xhigh`/`max` 等级别）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 会清除会话覆盖值）
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`

会话生命周期：

- `/new`（使用新键创建全新且隔离的会话；不会影响旧会话中的其他 TUI 客户端）
- `/reset`（原地重置当前会话键）
- `/abort`（中止当前运行）
- `/settings`
- `/exit`（或 `/quit`）

仅限本地模式：

- `/auth [provider]` 在 TUI 中打开提供商身份验证/登录流程。

Crestodian：

- `/crestodian [request]` 从普通智能体 TUI 返回 [Crestodian](#crestodian-setup-and-repair-helper) 设置/修复聊天，并可选择转发一个请求。

其他 Gateway 网关斜杠命令（例如 `/context`）会转发至 Gateway 网关，并显示为系统输出。请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

## 本地 shell 命令

- 在行首添加 `!`，即可在 TUI 主机上运行本地 shell 命令。
- TUI 会在每个会话中提示一次是否允许本地执行；拒绝后，该会话中的 `!` 将保持禁用。
- 命令会在 TUI 工作目录中的全新非交互式 shell 内运行（不会保留 `cd`/环境变量）。
- 本地 shell 命令的环境中会包含 `OPENCLAW_SHELL=tui-local`。
- 单独的 `!` 会作为普通消息发送；前导空格不会触发本地执行。

## Crestodian 设置和修复助手

Crestodian 是 ring-zero 设置/修复助手。当配置的默认模型通过实时推理检查后，可通过 `openclaw crestodian` 使用。如果推理不可用，交互式调用会返回推理新手引导，自动化调用则会失败并显示修复指引。它与 `openclaw tui --local` 在同一个本地 TUI shell 中运行，由一个仅能执行 Crestodian 类型化且需审批操作的 AI 智能体提供支持：

```bash
openclaw crestodian                       # start interactively
openclaw crestodian -m "status"           # run one request and exit
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # apply a config write
```

- 持久配置写入需要审批：可以在交互过程中确认，也可以传入 `--yes`。
- `--json` 会以 JSON 格式输出启动概览，而不是启动聊天。
- 在 Crestodian 中发出 `open-tui` 请求（例如要求与普通智能体对话）会退出 Crestodian 并打开常规智能体 TUI；在那里使用 `/crestodian` 即可返回。

如果当前配置已经通过验证，并且你希望嵌入式智能体在同一台计算机上检查配置、将其与文档对比，并在不依赖运行中 Gateway 网关的情况下协助修复偏差，请使用本地模式。

如果 `openclaw config validate` 已经失败，请先运行 `openclaw configure` 或 `openclaw doctor --fix`；`openclaw chat` 仍需要可加载的配置才能启动。

典型流程：

1. 启动本地模式：

```bash
openclaw chat
```

2. 告诉智能体你希望检查的内容，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本地 shell 命令获取准确证据并进行验证：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 应用小范围更改，然后重新运行 `!openclaw config validate`。
5. 如果 Doctor 建议执行自动迁移或修复，请先检查建议，然后运行 `!openclaw doctor --fix`。

提示：

- 优先使用 `openclaw config set` 或 `openclaw configure`，而不是手动编辑 `openclaw.json`。
- `openclaw docs "<query>"` 会从同一台计算机搜索实时文档索引。
- 如果你需要结构化的 schema 以及 SecretRef/可解析性错误，`openclaw config validate --json` 会很有用。

## 工具输出

- 工具调用以卡片形式显示，其中包含参数和结果。
- Ctrl+O 可在折叠视图和展开视图之间切换。
- 工具运行期间，部分更新会流式显示在同一张卡片中。

## 终端颜色

- TUI 使用终端的默认前景色显示助手正文，以确保深色和浅色终端均保持可读。
- 如果终端使用浅色背景，但自动检测结果有误，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 如需强制使用原始深色配色，请改为设置 `OPENCLAW_THEME=dark`。

## 历史记录和流式传输

- 连接后，TUI 会加载最新的历史记录（默认 200 条消息）。
- 流式响应会原地更新，直到最终完成。
- TUI 还会监听智能体工具事件，以显示信息更丰富的工具卡片。

## 连接详情

- TUI 使用客户端 ID `openclaw-tui`，并采用粗粒度的 `ui` 客户端模式进行连接（Control UI 和 WebChat 也使用相同模式来应用 Gateway 网关策略）。
- 重新连接时会显示系统消息；事件缺口会在日志中呈现。

## 选项

- `--local`：使用本地嵌入式智能体运行时
- `--url <url>`：Gateway 网关 WebSocket URL（默认为配置中的 `gateway.remote.url`，或回环地址上的 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 网关 token（如果需要）
- `--password <password>`：Gateway 网关密码（如果需要）
- `--tls-fingerprint <sha256>`：使用证书固定的 `wss://` Gateway 网关所需的预期 TLS 证书指纹
- `--session <key>`：会话键（默认为 `main`；当作用域为全局时则为 `global`）
- `--deliver`：将助手回复投递至提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的思考级别
- `--message <text>`：连接后发送初始消息
- `--timeout-ms <ms>`：智能体超时时间，以毫秒为单位（默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史记录条目数（默认 `200`）

<Warning>
设置 `--url` 后，TUI 不会回退使用配置或环境中的凭据。请明确传入 `--token` 或 `--password`；如果目标使用固定证书，还需传入 `--tls-fingerprint`。缺少明确凭据会导致错误。在本地模式下，请勿传入 `--url`、`--token`、`--password` 或 `--tls-fingerprint`。
</Warning>

## 故障排查

发送消息后没有输出：

- 在 TUI 中运行 `/status`，确认 Gateway 网关已连接且处于空闲/忙碌状态。
- 检查 Gateway 网关日志：`openclaw logs --follow`。
- 确认智能体可以运行：`openclaw status` 和 `openclaw models status`。
- 如果你希望消息出现在聊天渠道中，请确认 TUI 启动时使用了 `--deliver`（如果未使用，则必须重新启动才能开启）。

## 连接故障排查

- `disconnected`：确保 Gateway 网关正在运行，并且你的 `--url/--token/--password` 正确。
- 选择器中没有智能体：检查 `openclaw agents list` 和你的路由配置。
- 会话选择器为空：你可能处于全局作用域，或尚无任何会话。

## 相关内容

- [Control UI](/zh-CN/web/control-ui) — 基于 Web 的控制界面
- [配置](/zh-CN/cli/config) — 检查、验证和编辑 `openclaw.json`
- [Doctor](/zh-CN/cli/doctor) — 引导式修复和迁移检查
- [CLI 参考](/zh-CN/cli) — 完整的 CLI 命令参考
