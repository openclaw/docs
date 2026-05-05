---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加基于仓库的 QA 场景
    - 围绕 Gateway 网关仪表板构建更贴近真实场景的 QA 自动化
summary: QA 技术栈概览：qa-lab、qa-channel、仓库支撑的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-05T22:53:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 243940e8ddb54d22b1e787de34cd17d6f5f7d1beb8e1a7985c99fc9b0520742a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈用于以比单个单元测试更真实、更贴近渠道形态的方式演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、表情回应、编辑和删除功能面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察会话记录、注入入站消息并导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：仓库支持的种子资产，用于启动任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输协议、浏览器截图、VM 状态和 PR 证据的 bug，进行修复前后的实时验证。

## 命令界面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多流程有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                                                                                                                        |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                                                                                     |
| `qa coverage`                                       | 打印 Markdown 场景覆盖率清单（`--json` 用于机器输出）。                                                                                                                                                                                                                   |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入 agentic 对等报告。                                                                                                                                                                                                            |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成评审报告。参见[报告](#reporting)。                                                                                                                                                                                                  |
| `qa manual`                                         | 针对所选 provider/模型通道运行一次性提示。                                                                                                                                                                                                                                |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                              |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | 为 QA 仪表板 + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                               |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                       |
| `qa aimock`                                         | 仅启动 AIMock provider 服务器。                                                                                                                                                                                                                                           |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` provider 服务器。                                                                                                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭证池。                                                                                                                                                                                                                                                  |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                     |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                                |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输通道。                                                                                                                                                                                                                           |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输通道。                                                                                                                                                                                                                                   |
| `qa mantis`                                         | 用于实时传输 bug 的修复前后验证运行器，带有 Discord 状态反应证据、Crabbox 桌面/浏览器冒烟测试，以及 VNC 中的 Slack 冒烟测试。参见 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

## 操作员流程

当前的 QA 操作员流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的会话记录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面，供操作员或自动化循环向智能体分配 QA 任务、观察真实渠道行为，并记录哪些有效、失败或仍被阻塞。

为了更快迭代 QA Lab UI 且无需每次重建 Docker 镜像，可以用绑定挂载的 QA Lab 包启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该包，并且当 QA Lab 资产哈希发生变化时，浏览器会自动重新加载。

要运行本地 OpenTelemetry 跟踪冒烟测试，请运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP 跟踪接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf span，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须保持在跟踪之外。它会在 QA suite 产物旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅保留在源码检出中。npm tarball 会有意省略 QA Lab，因此包 Docker 发布通道不会运行 `qa` 命令。更改诊断埋点时，请从已构建的源码检出运行 `pnpm qa:otel:smoke`。

要运行真实传输的 Matrix 冒烟通道，请运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

该通道的完整 CLI 参考、profile/场景目录、环境变量和产物布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要来说：它会在 Docker 中预配一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输协议的子 QA Gateway 网关内运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 产物和合并输出日志。

对于真实传输的 Telegram、Discord 和 Slack 冒烟通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们面向一个预先存在的真实渠道，并使用两个 bot（driver + SUT）。所需环境变量、场景列表、输出产物和 Convex 凭证池记录在下方的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

要运行带 VNC 救援的完整 Slack 桌面 VM，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack 实时通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并在视频捕获可用时将 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 复制回 Mantis 产物目录。Crabbox 桌面/浏览器租约会预先提供捕获工具以及浏览器/原生构建辅助包，因此该场景只应在较旧租约上安装后备项。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和各阶段耗时，因此慢速运行可以看出时间是花在租约预热、凭证获取、远程设置还是产物复制上。在通过 VNC 手动登录 Slack Web 后，使用 `--lease-id <cbx_...>` 复用租约；复用的租约还会保持 Crabbox 的 pnpm store 缓存温热。默认的 `--hydrate-mode source` 会从源码检出进行验证，并在 VM 内运行安装/构建。只有当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；该模式会跳过昂贵的安装/构建步骤，并在工作区未就绪时封闭失败。使用 `--gateway-setup` 时，Mantis 会在 VM 内的端口 `38973` 上保留一个持久运行的 OpenClaw Slack Gateway 网关；如果不使用该选项，命令会运行常规的 bot 到 bot Slack QA 通道，并在产物捕获后退出。

操作员检查清单、GitHub workflow dispatch 命令、证据评论契约、hydrate-mode 决策表、耗时解读和失败处理步骤位于 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于智能体/CV 风格的桌面任务，运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 会租用或复用一台 Crabbox 桌面/浏览器机器，启动
`crabbox record --while`，通过嵌套的 `visual-driver` 驱动可见浏览器，
捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时针对截图运行
`openclaw infer image describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。
设置 `--expect-text` 时，视觉提示会请求结构化 JSON
判定，并且只有当模型报告有正向可见证据时才通过；仅引用目标文本的
否定响应会使断言失败。使用 `--vision-mode metadata` 可进行不调用模型的冒烟测试，
证明桌面、浏览器、截图和视频管线正常，而不会调用图像理解
提供商。录制是 `visual-task` 的必需制品；如果 Crabbox 没有录制到
非空的 `visual-task.mp4`，即使视觉驱动器通过，任务也会失败。失败时，Mantis 会保留用于 VNC 的租约，除非任务已经
通过且未设置 `--keep-lease`。

使用池化实时凭证前，运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex 代理环境变量，验证端点设置，并在存在维护者密钥时验证管理员/列表可达性。它只报告密钥的已设置/缺失状态。

## 实时传输协议覆盖范围

实时传输协议路径共享一个契约，而不是各自发明自己的场景列表形状。`qa-channel` 是广泛的合成产品行为套件，不属于实时传输协议覆盖矩阵。

| 路径     | 金丝雀 | 提及门控 | 机器人到机器人 | 允许列表阻止 | 顶层回复 | 重启恢复 | 线程后续回复 | 线程隔离 | 表情回应观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

这样会让 `qa-channel` 保持为广泛的产品行为套件，同时 Matrix、
Telegram 和未来的实时传输协议共享一个明确的传输协议契约
清单。

如需运行一次性 Linux VM 路径，并且不把 Docker 带入 QA 路径，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，
运行 `qa suite`，然后把常规 QA 报告和摘要复制回主机上的
`.artifacts/qa-e2e/...`。
它复用与主机上的 `qa suite` 相同的场景选择行为。
主机和 Multipass 套件运行默认会使用隔离的 Gateway 网关工作进程并行执行多个选定场景。`qa-channel` 默认并发数为
4，并受所选场景数量限制。使用 `--concurrency <count>` 调整
工作进程数量，或使用 `--concurrency 1` 串行执行。
任一场景失败时，该命令会以非零状态退出。当你希望保留制品但不让退出码失败时，
使用 `--allow-failures`。
实时运行会转发对 guest 可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及
存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest
可以通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量较多，并且需要基于 Docker 的 homeserver 预配。Telegram、Discord 和 Slack 更小，每个只有少量场景，没有配置文件系统，针对预先存在的真实渠道，因此它们的参考内容放在这里。

### 共享 CLI 标志

这些路径通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                                         | 描述                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 仅运行此场景。可重复。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告、摘要、观察到的消息和输出日志的位置。相对路径会基于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时的仓库根目录。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置内的临时账号 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                                | 主/备用模型引用。                                                                                         |
| `--fast`                              | 关闭                                                             | 提供商支持时使用快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 请参阅 [Convex 凭证池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                              | 当 `--credential-source convex` 时使用的角色。                                                                          |

任一场景失败时，每个路径都会以非零状态退出。`--allow-failures` 会写入制品，但不设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中有两个不同的机器人（驱动机器人 + SUT）。SUT 机器人必须有 Telegram 用户名；当两个机器人都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，机器人到机器人观察效果最好。

使用 `--credential-source env` 时所需环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观察消息制品中保留消息正文（默认会脱敏）。

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

输出制品：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 从金丝雀开始，包含每次回复的 RTT（驱动发送 → 观察到 SUT 回复）。
- `telegram-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会脱敏。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 渠道，其中有两个机器人：由测试框架控制的驱动机器人，以及由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。验证渠道提及处理、SUT 机器人是否已向 Discord 注册原生 `/help` 命令，以及可选的 Mantis 证据场景。

使用 `--credential-source env` 时所需环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必须与 Discord 返回的 SUT 机器人用户 id 匹配（否则该路径会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观察消息制品中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 可选 Mantis 场景。它会单独运行，因为它会把 SUT 切换为始终开启、仅工具的 guild 回复，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST 表情回应时间线以及 HTML/PNG 视觉制品。Mantis 前后报告还会将场景提供的 MP4 制品保留为 `baseline.mp4` 和 `candidate.mp4`。

显式运行 Mantis 状态表情回应场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

输出制品：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会脱敏。
- 运行状态表情回应场景时的 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 渠道，其中有两个不同的机器人：由测试框架控制的驱动机器人，以及由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT 机器人。

使用 `--credential-source env` 时所需环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在观察消息制品中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`

输出制品：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会脱敏。

#### 设置 Slack 工作区

该路径需要在一个工作区中有两个不同的 Slack 应用，并且两个机器人都是某个渠道的成员：

- `channelId` — 两个 bot 都已受邀加入的渠道的 `Cxxxxxxxxxx` id。使用专用渠道；该 lane 每次运行都会发帖。
- `driverBotToken` — **Driver** 应用的 bot token（`xoxb-...`）。
- `sutBotToken` — **SUT** 应用的 bot token（`xoxb-...`），它必须是与 driver 分开的 Slack 应用，这样它的 bot 用户 id 才不同。
- `sutAppToken` — SUT 应用的应用级 token（`xapp-...`），带有 `connections:write`，供 Socket Mode 使用，使 SUT 应用可以接收事件。

优先使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT 清单与内置 Slack 插件的生产安装保持一致（`extensions/slack/src/setup-shared.ts:10`）。关于用户看到的生产渠道设置，请参阅 [Slack 渠道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 组合有意分开，因为该 lane 需要在一个工作区中使用两个不同的 bot 用户 id。

**1. 创建 Driver 应用**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 选择 QA 工作区，粘贴以下清单，然后 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

复制 _Bot User OAuth Token_（`xoxb-...`）— 它会成为 `driverBotToken`。driver 只需要发布消息并识别自身；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一个工作区中重复 _Create New App → From a manifest_。scope 集合与内置 Slack 插件的生产安装保持一致（`extensions/slack/src/setup-shared.ts:10`）：

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Slack 创建应用后，在其设置页面上执行两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它会成为 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加 scope `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为 `sutAppToken`。

通过在每个 token 上调用 `auth.test`，验证两个 bot 具有不同的用户 id。运行时通过用户 id 区分 driver 和 SUT；复用同一个应用会让 mention-gating 立即失败。

**3. 创建渠道**

在 QA 工作区中创建一个渠道（例如 `#openclaw-qa`），并在渠道内邀请两个 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` id — 它会成为 `channelId`。公共渠道可以使用；如果使用私有渠道，两个应用已经拥有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭证**

有两个选项。单机调试使用环境变量（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或者填充共享 Convex 池，让 CI 和其他维护者可以租用它们。

对于 Convex 池，将这四个字段写入一个 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在你的 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 后，注册并验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

预期为 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 端到端验证**

在本地运行该 lane，确认两个 bot 可以通过 broker 彼此通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

绿色运行会在远少于 30 秒内完成，并且 `slack-qa-report.md` 会显示 `slack-canary` 和 `slack-mention-gating` 的 Status 都是 `pass`。如果该 lane 挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，则说明池为空，或者每一行都已被租用 — `qa credentials list --kind slack --status all --json` 会告诉你是哪一种。

### Convex 凭证池

Telegram、Discord 和 Slack lane 可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间对其发送 Heartbeat，并在关闭时释放它。池类型为 `"telegram"`、`"discord"` 和 `"slack"`。

broker 在 `admin/add` 上验证的 payload 形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必须是数字 chat-id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` 必须匹配 `^[A-Z][A-Z0-9]+$`（类似 `Cxxxxxxxxxx` 的 Slack id）。请参阅[设置 Slack 工作区](#setting-up-the-slack-workspace)了解应用和 scope 预配。

操作环境变量和 Convex broker endpoint 合同位于[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；两种类型的 broker 语义相同）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意放在 git 中，这样 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 markdown runner。每个场景 markdown 文件都是一次测试运行的真实来源，并应定义：

- 场景元数据
- 可选的类别、能力、lane 和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面允许保持通用且跨领域。例如，markdown 场景可以将传输侧 helper 与浏览器侧 helper 组合起来，通过 Gateway 网关 `browser.request` seam 驱动嵌入式 Control UI，而无需添加特殊 runner。

场景文件应按产品能力分组，而不是按源码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 进行实现可追溯性跟踪。

baseline 列表应保持足够宽，以覆盖：

- 私信和渠道聊天
- thread 行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- subagent 移交
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock lane

`qa suite` 有两个本地提供商 mock lane：

- `mock-openai` 是感知场景的 OpenClaw mock。它仍然是仓库支持的 QA 和 parity gate 的默认确定性 mock lane。
- `aimock` 会启动一个由 AIMock 支撑的提供商服务器，用于实验性协议、fixture、record/replay 和 chaos 覆盖。它是增量补充，并不替代 `mock-openai` 场景 dispatcher。

提供商 lane 实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile staging 需求，以及 live/mock 能力标志。共享 suite 和 Gateway 网关代码应通过提供商 registry 路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 为 markdown QA 场景拥有一个通用传输 seam。`qa-channel` 是该 seam 上的第一个适配器，但设计目标更宽：未来真实或合成渠道都应接入同一个 suite runner，而不是添加特定于传输的 QA runner。

在架构层面，拆分如下：

- `qa-lab` 拥有通用场景执行、worker 并发、artifact 写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪检查、入站和出站观察、传输操作，以及规范化传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖渠道合同的场景包。

当共享 `qa-lab` host 可以拥有流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享 host 机制：

- `openclaw qa` 命令根
- suite 启动和拆卸
- worker 并发
- artifact 写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输合同：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和规范化传输状态
- 如何执行传输支持的操作
- 如何处理特定于传输的重置或清理

新渠道的最低采用门槛：

1. 让 `qa-lab` 继续作为共享 `qa` 根的 owner。
2. 在共享 `qa-lab` host seam 上实现传输 runner。
3. 将特定于传输的机制保留在 runner 插件或渠道 harness 内部。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；lazy CLI 和 runner 执行应放在独立入口点之后。
5. 在带主题的 `qa/scenarios/` 目录下编写或调整 markdown 场景。
6. 对新场景使用通用场景 helper。
7. 保持现有兼容别名可用，除非仓库正在进行有意迁移。

决策规则是严格的：

- 如果行为可以在 `qa-lab` 中表达一次，就放在 `qa-lab` 中。
- 如果行为依赖某一个渠道传输协议，就把它保留在对应的运行器插件或插件测试框架中。
- 如果某个场景需要多个渠道都能使用的新能力，请添加通用辅助函数，而不是在 `suite.ts` 中添加特定于渠道的分支。
- 如果某个行为只对一种传输协议有意义，请保持该场景特定于传输协议，并在场景契约中明确说明。

### 场景辅助函数名称

新场景首选的通用辅助函数：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

现有场景仍可使用兼容别名 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但新场景编写应使用通用名称。这些别名存在是为了避免一次性迁移，而不是作为未来的模式。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些内容正常工作
- 哪些内容失败
- 哪些内容仍被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单（在估算后续工作或接入新传输协议时很有用），请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

如需进行角色和风格检查，请在多个实时模型
引用上运行同一个场景，并编写一份经过评判的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令会运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估
场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，
例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在接受评估。该命令会保留每份完整
transcript，记录基本运行统计信息，然后以快速模式请求评审模型，并在支持的情况下使用
`xhigh` 推理，按自然度、气质和幽默感对运行结果进行排名。
在比较提供商时使用 `--blind-judge-models`：评审提示仍会获得
每份 transcript 和运行状态，但候选引用会替换为中性
标签，例如 `candidate-01`；报告会在解析后将排名映射回真实引用。
候选运行默认使用 `high` thinking；GPT-5.5 使用 `medium`，支持该级别的旧版 OpenAI 评估引用使用 `xhigh`。可通过
`--model provider/model,thinking=<level>` 内联覆盖某个特定候选。`--thinking <level>` 仍会设置
全局回退值，旧的 `--model-thinking <provider/model=level>` 形式会保留用于兼容。
OpenAI 候选引用默认使用快速模式，以便在
提供商支持时使用优先处理。当单个候选或评审需要覆盖时，可内联添加
`,fast`、`,no-fast` 或 `,fast=false`。仅当你想为每个候选模型
强制开启快速模式时，才传入 `--fast`。候选和评审耗时会
记录在报告中用于基准分析，但评审提示会明确要求
不要按速度排名。
候选和评审模型运行默认并发数均为 16。当提供商限制或本地 Gateway 网关
压力使运行噪声过大时，降低
`--concurrency` 或 `--judge-concurrency`。
如果未传入候选 `--model`，角色评估默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
如果未传入 `--judge-model`，评审默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [Dashboard](/zh-CN/web/dashboard)
