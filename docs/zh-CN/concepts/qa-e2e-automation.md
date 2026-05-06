---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、由代码仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-06T00:25:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5556e440063386f3c6c54d986648bcebc0a49ce152815f3bc262b701526c4537
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈旨在以比单个单元测试更真实、更贴近渠道形态的方式测试 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，提供私信、渠道、线程、反应、编辑和删除表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察 transcript、注入入站消息，并导出 Markdown 报告。
- `extensions/qa-matrix`、未来的 runner 插件：实时传输适配器，在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库支持的种子资产，用于启动任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：用于需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug 的前后实时验证。

## 命令表面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多命令有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                                                                                                                       |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行由仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                                                                                  |
| `qa coverage`                                       | 打印 Markdown 场景覆盖率清单（`--json` 用于机器输出）。                                                                                                                                                                                                                  |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入智能体 parity 报告。                                                                                                                                                                                                          |
| `qa character-eval`                                 | 使用评判报告，在多个实时模型上运行角色 QA 场景。请参阅[报告](#reporting)。                                                                                                                                                                                              |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示。                                                                                                                                                                                                                                  |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                             |
| `qa docker-build-image`                             | 构建预烘焙 QA Docker 镜像。                                                                                                                                                                                                                                             |
| `qa docker-scaffold`                                | 为 QA 仪表板 + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                              |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                       |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                                                                             |
| `qa mock-openai`                                    | 仅启动场景感知的 `mock-openai` 提供商服务器。                                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭据池。                                                                                                                                                                                                                                                 |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。请参阅 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                  |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                               |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输通道。                                                                                                                                                                                                                          |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输通道。                                                                                                                                                                                                                                  |
| `qa mantis`                                         | 用于实时传输 bug 的前后验证 runner，包含 Discord 状态反应证据、Crabbox 桌面/浏览器 smoke，以及 Slack-in-VNC smoke。请参阅 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack Desktop Runbook](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

## 操作员流程

当前 QA 操作员流程是一个双窗格 QA 站点：

- 左侧：包含智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的 transcript 和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务、观察真实渠道行为，并记录哪些成功、失败或仍被阻塞。

如果要更快迭代 QA Lab UI，而不在每次都重建 Docker 镜像，请使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务保持在预构建镜像上，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资产哈希变化时，浏览器会自动重新加载。

要运行本地 OpenTelemetry trace smoke，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功回合中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须保持在 trace 之外。它会在 QA suite artifacts 旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅限源码 checkout。npm tarball 会有意省略 QA Lab，因此包 Docker 发布通道不会运行 `qa` 命令。变更诊断 instrumentation 时，请在已构建的源码 checkout 中使用 `pnpm qa:otel:smoke`。

要运行真实传输的 Matrix smoke 通道，请执行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此通道的完整 CLI 参考、profile/场景目录、环境变量和 artifact 布局见 [Matrix QA](/zh-CN/concepts/qa-matrix)。概览：它会在 Docker 中预配一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定于该传输的子 QA Gateway 网关内运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events artifact 和组合输出日志。

这些场景覆盖单元测试无法端到端证明的传输行为：mention gating、allow-bot 策略、allowlists、顶层和线程回复、私信路由、反应处理、入站编辑抑制、重启重放去重、homeserver 中断恢复、审批元数据交付、媒体处理，以及 Matrix E2EE 引导/恢复/验证流程。E2EE CLI profile 还会通过同一个一次性 homeserver 驱动 `openclaw matrix encryption setup` 和验证命令，然后检查 Gateway 网关回复。

Discord 也有仅限 Mantis 的选择加入场景，用于 bug 复现。使用 `--scenario discord-status-reactions-tool-only` 获取显式状态反应时间线，或使用 `--scenario discord-thread-reply-filepath-attachment` 创建真实 Discord 线程，并验证 `message.thread-reply` 会保留 `filePath` 附件。这些场景不包含在默认实时 Discord 通道中，因为它们是前后复现探针，而不是广泛的 smoke 覆盖。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同命令表面。定时运行和默认手动运行会使用实时前沿凭据、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 执行快速 Matrix profile。手动 `matrix_profile=all` 会展开为五个 profile 分片，让详尽目录可以并行运行，同时每个分片保留一个 artifact 目录。

对于真实传输的 Telegram、Discord 和 Slack smoke 通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们面向已有的真实渠道，并使用两个 bot（driver + SUT）。所需环境变量、场景列表、输出 artifacts 和 Convex 凭据池记录在下面的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

要运行带 VNC 救援的完整 Slack 桌面 VM，请执行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在虚拟机内运行 Slack 实时 lane，在 VNC 浏览器中打开 Slack Web，捕获桌面，并在可用视频捕获时把 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 复制回 Mantis artifact 目录。Crabbox 桌面/浏览器租约会预先提供捕获工具和浏览器/原生构建辅助包，所以该场景只应在较旧租约上安装备用依赖。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和各阶段耗时，因此运行缓慢时可以看出时间花在了租约预热、凭据获取、远程设置还是 artifact 复制上。通过 VNC 手动登录 Slack Web 后，使用 `--lease-id <cbx_...>` 复用租约；复用的租约也会保持 Crabbox 的 pnpm store 缓存处于预热状态。默认的 `--hydrate-mode source` 会从源码 checkout 验证，并在虚拟机内运行安装/构建。仅当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；该模式会跳过昂贵的安装/构建步骤，并在工作区未就绪时失败关闭。带 `--gateway-setup` 时，Mantis 会在虚拟机内的端口 `38973` 上留下一个持续运行的 OpenClaw Slack Gateway 网关；不带它时，该命令会运行常规的机器人到机器人 Slack QA lane，并在 artifact 捕获后退出。

操作员检查清单、GitHub 工作流分发命令、证据评论契约、hydrate-mode 决策表、耗时解读和失败处理步骤位于 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于智能体/CV 风格的桌面任务，运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 会租用或复用一台 Crabbox 桌面/浏览器机器，启动 `crabbox record --while`，通过嵌套的 `visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时针对截图运行 `openclaw infer image describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。设置 `--expect-text` 时，视觉提示会要求结构化 JSON 判定，并且只有在模型报告可见的正向证据时才通过；仅引用目标文本的否定响应会使断言失败。使用 `--vision-mode metadata` 可以进行无模型 smoke，证明桌面、浏览器、截图和视频管线正常，而不调用图像理解提供商。录制是 `visual-task` 的必需 artifact；如果 Crabbox 没有录制出非空的 `visual-task.mp4`，即使视觉驱动已通过，任务也会失败。失败时，Mantis 会保留租约用于 VNC，除非任务已经通过且未设置 `--keep-lease`。

在使用池化实时凭据之前，运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境，验证端点设置，并在存在 maintainer secret 时验证 admin/list 可达性。它只报告 secret 的已设置/缺失状态。

## 实时传输覆盖范围

实时传输 lane 共享一个契约，而不是各自发明自己的场景列表形状。`qa-channel` 是广泛的合成产品行为套件，不属于实时传输覆盖矩阵。

| Lane     | Canary | 提及门控 | 机器人到机器人 | Allowlist 阻断 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------- | -------------- | -------------- | -------- | -------- | -------- | -------- | ------------- | --------- | ------------ |
| Matrix   | x      | x        | x              | x              | x        | x        | x        | x        | x             |           |              |
| Telegram | x      | x        | x              |                |          |          |          |          |               | x         |              |
| Discord  | x      | x        | x              |                |          |          |          |          |               |           | x            |
| Slack    | x      | x        | x              | x              | x        | x        | x        | x        |               |           |              |

这会保留 `qa-channel` 作为广泛的产品行为套件，同时让 Matrix、Telegram 和未来的实时传输共享一个明确的传输契约检查清单。

对于不把 Docker 带入 QA 路径的一次性 Linux 虚拟机 lane，运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，运行 `qa suite`，然后把常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它会复用主机上 `qa suite` 的相同场景选择行为。
主机和 Multipass 套件运行默认会使用隔离的 Gateway 网关 worker 并行执行多个选中的场景。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
当任何场景失败时，该命令会以非零状态退出。如果你想在不产生失败退出码的情况下获取 artifact，请使用 `--allow-failures`。
实时运行会转发 guest 可实际使用的受支持 QA auth 输入：基于环境的 provider key、QA live provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 放在仓库根目录下，这样 guest 可以通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

由于 Matrix 的场景数量以及基于 Docker 的 homeserver 预置，它有一个[专用页面](/zh-CN/concepts/qa-matrix)。Telegram、Discord 和 Slack 规模更小，各自只有少量场景，没有 profile 系统，并且针对预先存在的真实渠道，因此它们的参考内容放在这里。

### 共享 CLI 标志

这些 lane 通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同标志：

| 标志                                  | 默认值                                                          | 描述                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 仅运行此场景。可重复。                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告/摘要/观测消息和输出日志的位置。相对路径会按 `--repo-root` 解析。                                             |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时的仓库根目录。                                                                                       |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置内的临时账号 id。                                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可使用）。                                                     |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | 主/备用模型 ref。                                                                                                     |
| `--fast`                              | off                                                             | provider 支持时启用快速模式。                                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                           | 请参阅 [Convex 凭据池](#convex-credential-pool)。                                                                     |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，其他情况下为 `maintainer`                         | 使用 `--credential-source convex` 时采用的角色。                                                                      |

任何场景失败时，每个 lane 都会以非零状态退出。`--allow-failures` 会写入 artifact，但不设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中有两个不同的机器人（driver + SUT）。SUT 机器人必须有 Telegram 用户名；当两个机器人都在 `@BotFather` 中启用**机器人到机器人通信模式**时，机器人到机器人的观察效果最好。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观测消息 artifact 中保留消息正文（默认会脱敏）。

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

输出 artifact：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 包含每次回复的 RTT（driver 发送 → 观测到 SUT 回复），从 canary 开始。
- `telegram-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被脱敏。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 渠道，包含两个机器人：由 harness 控制的 driver 机器人，以及由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。验证渠道提及处理、SUT 机器人已向 Discord 注册原生 `/help` 命令，以及可选择启用的 Mantis 证据场景。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必须匹配 Discord 返回的 SUT 机器人用户 id（否则该 lane 会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观测消息 artifact 中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 可选择启用的 Mantis 场景。它会单独运行，因为它会把 SUT 切换为始终开启、仅工具的 guild 回复，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST reaction 时间线以及 HTML/PNG 视觉 artifact。Mantis 前后对比报告还会将场景提供的 MP4 artifact 保留为 `baseline.mp4` 和 `candidate.mp4`。

显式运行 Mantis status-reaction 场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

输出工件：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被遮盖。
- 当状态表情回应场景运行时，会生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 频道，其中有两个不同的 bot：一个由 harness 控制的驱动 bot，以及一个由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT bot。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在 observed-message 工件中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

输出工件：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被遮盖。

#### 设置 Slack 工作区

该测试通道需要在一个工作区中有两个不同的 Slack 应用，以及一个两个 bot 都是成员的频道：

- `channelId` — 两个 bot 都已受邀加入的频道的 `Cxxxxxxxxxx` id。使用专用频道；该测试通道每次运行都会发帖。
- `driverBotToken` — **Driver** 应用的 bot token（`xoxb-...`）。
- `sutBotToken` — **SUT** 应用的 bot token（`xoxb-...`），它必须是与 driver 分开的 Slack 应用，这样它的 bot 用户 id 才不同。
- `sutAppToken` — SUT 应用的应用级 token（`xapp-...`），带有 `connections:write`，由 Socket Mode 使用，使 SUT 应用能够接收事件。

优先使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT 清单有意将内置 Slack 插件的生产安装（`extensions/slack/src/setup-shared.ts:10`）缩小到实时 Slack QA 套件覆盖的权限和事件范围。对于用户看到的生产频道设置，请参阅 [Slack 频道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 组合是有意分开的，因为该测试通道需要在一个工作区中有两个不同的 bot 用户 id。

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

在同一个工作区中重复 _Create New App → From a manifest_。这个 QA 应用有意使用内置 Slack 插件生产清单（`extensions/slack/src/setup-shared.ts:10`）的更窄版本：省略了表情回应作用域和事件，因为实时 Slack QA 套件尚未覆盖表情回应处理。

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
        "pin_removed"
      ]
    }
  }
}
```

Slack 创建应用后，在它的设置页执行两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它会成为 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加作用域 `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为 `sutAppToken`。

通过对每个 token 调用 `auth.test` 来验证两个 bot 具有不同的用户 id。运行时通过用户 id 区分 driver 和 SUT；两者复用一个应用会立即导致提及门控失败。

**3. 创建频道**

在 QA 工作区中创建一个频道（例如 `#openclaw-qa`），并从频道内邀请两个 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` id — 它会成为 `channelId`。公共频道可以使用；如果使用私有频道，两个应用已经拥有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭证**

有两个选项。单机调试时使用环境变量（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或者为共享 Convex 池写入种子，这样 CI 和其他维护者可以租用它们。

对于 Convex 池，将四个字段写入 JSON 文件：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中导出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 后，注册并验证：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

预期看到 `count: 1`、`status: "active"`，且没有 `lease` 字段。

**5. 端到端验证**

在本地运行该测试通道，确认两个 bot 可以通过代理服务相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

绿色运行会在远低于 30 秒内完成，并且 `slack-qa-report.md` 显示 `slack-canary` 和 `slack-mention-gating` 的状态都是 `pass`。如果该测试通道挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，要么池为空，要么每一行都已被租用 — `qa credentials list --kind slack --status all --json` 会告诉你是哪一种。

### Convex 凭证池

Telegram、Discord 和 Slack 测试通道可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间对其发送心跳，并在关闭时释放它。池类型为 `"telegram"`、`"discord"` 和 `"slack"`。

代理服务会在 `admin/add` 上验证的载荷形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必须是数字聊天 id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` 必须匹配 `^[A-Z][A-Z0-9]+$`（例如 `Cxxxxxxxxxx` 这样的 Slack id）。参阅[设置 Slack 工作区](#setting-up-the-slack-workspace)了解应用和作用域配置。

操作环境变量和 Convex 代理服务端点契约位于[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；两种类型的代理服务语义相同）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些文件有意提交到 git 中，这样 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、测试通道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用和跨领域。例如，Markdown 场景可以把传输侧 helper 与浏览器侧 helper 结合起来，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊情况运行器。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 做实现可追溯性。

基线列表应保持足够广，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商模拟测试通道

`qa suite` 有两个本地提供商模拟测试通道：

- `mock-openai` 是感知场景的 OpenClaw 模拟。它仍然是仓库支持的 QA 和一致性门禁的默认确定性模拟测试通道。
- `aimock` 会启动一个基于 AIMock 的提供商服务器，用于实验性协议、fixture、录制/回放和混沌覆盖。它是增量补充，不会取代 `mock-openai` 场景调度器。

提供商测试通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求，以及实时/模拟能力标志。共享套件和 Gateway 网关代码应通过提供商注册表路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 拥有用于 Markdown QA 场景的通用传输接缝。`qa-channel` 是该接缝上的第一个适配器，但设计目标更宽：未来真实或合成的渠道应接入同一个套件运行器，而不是添加特定于传输的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 拥有通用场景执行、worker 并发、工件写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪状态、入站和出站观测、传输操作，以及规范化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 Markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 演练渠道契约的场景包。

当共享 `qa-lab` 宿主可以拥有流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享宿主机制：

- `openclaw qa` 命令根
- 套件启动和拆卸
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载在共享的 `qa` 根命令之下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何公开转录记录和规范化的传输状态
- 如何执行由传输支撑的操作
- 如何处理特定传输的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根命令的所有者。
2. 在共享的 `qa-lab` host seam 上实现传输 runner。
3. 将特定传输的机制保留在 runner 插件或渠道 harness 内部。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和 runner 执行应留在单独的入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改写 Markdown 场景。
6. 为新场景使用通用场景 helper。
7. 除非仓库正在执行有意的迁移，否则保持现有兼容性别名继续可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就放在 `qa-lab` 中。
- 如果行为依赖某一个渠道传输，就将其保留在该 runner 插件或插件 harness 中。
- 如果某个场景需要一项可供多个渠道使用的新能力，请添加通用 helper，而不是在 `suite.ts` 中添加特定渠道分支。
- 如果某个行为只对一种传输有意义，请保持场景特定于该传输，并在场景契约中明确说明。

### 场景 helper 名称

新场景首选的通用 helper：

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

现有场景仍可使用兼容性别名 —— `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` —— 但新场景编写应使用通用名称。这些别名的存在是为了避免一次性迁移，而不是作为今后的模型。

## 报告

`qa-lab` 会从观察到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 什么正常工作了
- 什么失败了
- 什么仍然被阻塞
- 哪些后续场景值得添加

要查看可用场景清单（在估算后续工作或接入新传输时很有用），运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

要进行角色和风格检查，请跨多个实时模型 ref 运行同一场景，并编写一份经过评审的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不要告诉候选模型它正在被评估。该命令会保留每份完整转录记录，记录基本运行统计信息，然后在支持的情况下以 fast 模式和 `xhigh` 推理请求评审模型，按自然程度、氛围和幽默感对运行进行排名。比较提供商时使用 `--blind-judge-models`：评审提示仍会获得每份转录记录和运行状态，但候选 ref 会替换为中性标签，例如 `candidate-01`；报告会在解析后将排名映射回真实 ref。
候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持它的较旧 OpenAI 评估 ref 使用 `xhigh`。用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍会设置全局后备值，较旧的 `--model-thinking <provider/model=level>` 形式保留用于兼容。
OpenAI 候选 ref 默认使用 fast 模式，以便在提供商支持时使用优先处理。单个候选或评审需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有在你想为每个候选模型强制开启 fast 模式时，才传递 `--fast`。候选和评审时长会记录在报告中用于基准分析，但评审提示会明确说明不要按速度排名。
候选和评审模型运行都默认并发 16。当提供商限制或本地 Gateway 网关压力让运行过于嘈杂时，降低 `--concurrency` 或 `--judge-concurrency`。
未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未传入 `--judge-model` 时，评审默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
