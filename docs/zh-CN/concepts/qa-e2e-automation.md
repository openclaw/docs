---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、由仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-10T19:32:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈用于以比单个单元测试更真实、更贴近渠道形态的方式演练 OpenClaw。

当前组件：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、回应、编辑和删除表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录、注入入站消息，并导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库支持的种子资产，用于启动任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug，进行修复前和修复后的实时验证。

## 命令表面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多命令有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                                                                                                                       |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行由仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                                                                                   |
| `qa coverage`                                       | 打印 Markdown 场景覆盖率清单（`--json` 用于机器输出）。                                                                                                                                                                                                                  |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件，并写入智能体式一致性报告。                                                                                                                                                                                                        |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成经过评判的报告。请参阅[报告](#reporting)。                                                                                                                                                                                        |
| `qa manual`                                         | 针对选定的提供商/模型通道运行一次性提示词。                                                                                                                                                                                                                             |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                             |
| `qa docker-build-image`                             | 构建预烘焙的 QA Docker 镜像。                                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | 为 QA 仪表板 + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                              |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                     |
| `qa aimock`                                         | 只启动 AIMock 提供商服务器。                                                                                                                                                                                                                                             |
| `qa mock-openai`                                    | 只启动感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 凭证池。                                                                                                                                                                                                                                               |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。请参阅 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                  |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                               |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输通道。                                                                                                                                                                                                                          |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输通道。                                                                                                                                                                                                                                  |
| `qa mantis`                                         | 用于实时传输 bug 的修复前和修复后验证运行器，提供 Discord 状态回应证据、Crabbox 桌面/浏览器烟雾测试，以及 Slack-in-VNC 烟雾测试。请参阅 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

## 操作员流程

当前 QA 操作员流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面；操作员或自动化循环可以在该页面给智能体分配 QA 任务，观察真实渠道行为，并记录哪些可用、哪些失败或哪些仍被阻塞。

为了更快迭代 QA Lab UI，而不是每次都重新构建 Docker 镜像，请使用绑定挂载的 QA Lab 包启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并把 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该包，并且当 QA Lab 资产哈希变化时，浏览器会自动重新加载。

对于本地 OpenTelemetry 跟踪烟雾测试，运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP 跟踪接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf span，并断言发布关键形状：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须留在跟踪之外。它会在 QA 套件工件旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅保留在源码检出中。npm tarball 会有意省略 QA Lab，因此包 Docker 发布通道不会运行 `qa` 命令。更改诊断插桩时，请从已构建的源码检出运行 `pnpm qa:otel:smoke`。

对于真实传输的 Matrix 烟雾测试通道，运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

该通道的完整 CLI 参考、配置文件/场景目录、环境变量和工件布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要来说：它会在 Docker 中预置一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输的子 QA Gateway 网关中运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 工件和合并输出日志。

这些场景覆盖单元测试无法端到端证明的传输行为：提及门控、allow-bot 策略、allowlist、顶层回复和线程回复、私信路由、回应处理、入站编辑抑制、重启重放去重、homeserver 中断恢复、审批元数据递送、媒体处理，以及 Matrix E2EE 引导/恢复/验证流程。E2EE CLI 配置文件还会通过同一个一次性 homeserver 驱动 `openclaw matrix encryption setup` 和验证命令，然后再检查 Gateway 网关回复。

Discord 也有仅限 Mantis、需要选择启用的 bug 复现场景。使用 `--scenario discord-status-reactions-tool-only` 获取明确的状态回应时间线，或使用 `--scenario discord-thread-reply-filepath-attachment` 创建真实 Discord 线程，并验证 `message.thread-reply` 保留 `filePath` 附件。这些场景不在默认实时 Discord 通道中，因为它们是修复前/修复后复现探针，而不是广泛烟雾覆盖。线程附件 Mantis 工作流还可以在 QA 环境中配置了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 时，添加已登录 Discord Web 的见证视频。该查看器配置文件仅用于视觉捕获；通过/失败判断仍来自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用同一命令表面。定时运行和默认手动运行会使用实时前沿凭证、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 执行 fast Matrix 配置文件。手动 `matrix_profile=all` 会分散到五个配置文件分片，使完整目录可以并行运行，同时每个分片保留一个工件目录。

对于真实传输的 Telegram、Discord 和 Slack 烟雾测试通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们以一个预先存在的真实渠道为目标，并使用两个机器人（driver + SUT）。所需环境变量、场景列表、输出工件和 Convex 凭证池记录在下面的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

如需运行带 VNC 救援的完整 Slack 桌面 VM，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack 实时通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并在视频捕获可用时，将 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 复制回 Mantis 构件目录。Crabbox 桌面/浏览器租约会预先提供捕获工具和浏览器/原生构建辅助包，因此该场景只应在较旧租约上安装回退项。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和各阶段耗时，因此运行缓慢时可以看出时间是花在租约预热、凭证获取、远程设置还是构件复制上。通过 VNC 手动登录 Slack Web 后，使用 `--lease-id <cbx_...>` 复用租约；复用的租约也会保持 Crabbox 的 pnpm store 缓存为热状态。默认的 `--hydrate-mode source` 会从源码 checkout 验证，并在 VM 内运行安装/构建。仅当复用的远程工作区已经有 `node_modules` 和构建好的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；该模式会跳过昂贵的安装/构建步骤，并在工作区未就绪时封闭失败。使用 `--gateway-setup` 时，Mantis 会在 VM 内留下一个持久运行的 OpenClaw Slack Gateway 网关，端口为 `38973`；不使用它时，该命令会运行常规的机器人到机器人 Slack QA 通道，并在捕获构件后退出。

操作员检查清单、GitHub workflow 派发命令、证据评论契约、hydrate-mode 决策表、耗时解读和失败处理步骤位于 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。

如需运行智能体/CV 风格的桌面任务，请运行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 会租用或复用一台 Crabbox 桌面/浏览器机器，启动 `crabbox record --while`，通过嵌套的 `visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时针对截图运行 `openclaw infer image describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。设置 `--expect-text` 后，视觉提示会要求返回结构化 JSON 判定，并且只有当模型报告有正向可见证据时才通过；仅仅引用目标文本的负向响应会使断言失败。使用 `--vision-mode metadata` 可进行不调用图像理解提供商的无模型冒烟测试，以证明桌面、浏览器、截图和视频管线可用。录制是 `visual-task` 的必需构件；如果 Crabbox 未录制出非空的 `visual-task.mp4`，即使视觉驱动器已通过，任务也会失败。失败时，除非任务已经通过且未设置 `--keep-lease`，否则 Mantis 会保留租约以供 VNC 使用。

在使用池化实时凭证之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量，验证端点设置，并在存在维护者 secret 时验证 admin/list 可达性。它只报告 secret 的已设置/缺失状态。

## 实时传输覆盖范围

实时传输通道共享同一个契约，而不是各自发明自己的场景列表形状。`qa-channel` 是广泛的合成产品行为套件，不属于实时传输覆盖矩阵。

| 通道     | 金丝雀 | 提及门控 | 机器人到机器人 | allowlist 拦截 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | reaction 观察 | help 命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

这会让 `qa-channel` 继续作为广泛的产品行为套件，同时让 Matrix、Telegram 和未来的实时传输共享一个明确的传输契约检查清单。

如需运行一次不把 Docker 带入 QA 路径的一次性 Linux VM 通道，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，运行 `qa suite`，然后把常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它会复用主机上 `qa suite` 的同一套场景选择行为。
主机和 Multipass 套件运行默认会用隔离的 Gateway 网关 worker 并行执行多个选定场景。`qa-channel` 默认并发数为 4，受所选场景数量限制。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
只要任何场景失败，该命令就会以非零状态退出。如果你希望获取构件但不让退出码失败，请使用 `--allow-failures`。
实时运行会转发 guest 可实际使用的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 可以通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量较多，并且需要 Docker 支持的 homeserver 预配。Telegram、Discord 和 Slack 更小，每个只有少量场景，没有 profile 系统，并且针对预先存在的真实渠道，因此它们的参考内容放在这里。

### 共享 CLI 标志

这些通道通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                                         | 描述                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | 只运行此场景。可重复指定。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告、摘要、观察到的消息和输出日志的位置。相对路径会相对于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时的仓库根目录。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置中的临时账号 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可使用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider 默认值                                                | 主/备用模型 ref。                                                                                         |
| `--fast`                              | 关闭                                                             | 提供商支持时的快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 参见 [Convex 凭证池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                              | `--credential-source convex` 时使用的角色。                                                                          |

只要任一场景失败，每个通道都会以非零状态退出。`--allow-failures` 会写入构件，但不会设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中有两个不同的机器人（driver + SUT）。SUT 机器人必须有 Telegram 用户名；当两个机器人都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，机器人到机器人的观察效果最好。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数字 chat id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观察消息构件中保留消息正文（默认会遮蔽）。

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隐式默认集合始终覆盖金丝雀、提及门控、原生命令回复、命令寻址和机器人到机器人群组回复。`mock-openai` 默认值还包括确定性的回复链和最终消息流式传输检查。`telegram-current-session-status-tool` 仍然是选择加入项，因为它只在紧接金丝雀之后直接串联时稳定，而不是在任意原生命令回复之后稳定。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` 可打印带回归 ref 的当前默认/可选拆分。

输出构件：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - 从金丝雀开始，包含每条回复的 RTT（driver 发送 → 观察到 SUT 回复）。
- `telegram-qa-observed-messages.json` - 除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被遮蔽。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild channel，其中有两个机器人：一个由 harness 控制的 driver 机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。验证频道提及处理、SUT 机器人是否已向 Discord 注册原生 `/help` 命令，以及选择加入的 Mantis 证据场景。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须匹配 Discord 返回的 SUT 机器人用户 ID（否则该通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观测消息产物中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 为 `discord-voice-autojoin` 选择语音/舞台频道；如果未设置，场景会为 SUT 机器人选择第一个可见的语音/舞台频道。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 需要显式启用的语音场景。单独运行，启用 `channels.discord.voice.autoJoin`，并验证 SUT 机器人当前的 Discord 语音状态是目标语音/舞台频道。Convex Discord 凭证可以包含可选的 `voiceChannelId`；否则运行器会发现服务器中第一个可见的语音/舞台频道。
- `discord-status-reactions-tool-only` - 需要显式启用的 Mantis 场景。它会单独运行，因为它会把 SUT 切换为始终在线、仅工具的服务器回复模式，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST 反应时间线以及 HTML/PNG 可视产物。Mantis 前后对比报告还会把场景提供的 MP4 产物保留为 `baseline.mp4` 和 `candidate.mp4`。

显式运行 Discord 语音自动加入场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

显式运行 Mantis 状态反应场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

输出产物：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - 正文会被遮盖，除非设置了 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- 运行状态反应场景时会生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 渠道，其中有两个不同的机器人：由 harness 控制的驱动机器人，以及由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT 机器人。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在观测消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

输出产物：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - 正文会被遮盖，除非设置了 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。

#### 设置 Slack 工作区

该通道需要在一个工作区中有两个不同的 Slack 应用，以及一个两个机器人都加入的渠道：

- `channelId` - 两个机器人都已受邀加入的渠道的 `Cxxxxxxxxxx` ID。请使用专用渠道；该通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的机器人令牌（`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的机器人令牌（`xoxb-...`），它必须是与驱动机器人不同的独立 Slack 应用，这样它的机器人用户 ID 才不同。
- `sutAppToken` - SUT 应用的应用级令牌（`xapp-...`），带有 `connections:write`，供 Socket Mode 使用，以便 SUT 应用可以接收事件。

优先使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT 清单有意将内置 Slack 插件的生产安装（`extensions/slack/src/setup-shared.ts:10`）收窄到实时 Slack QA 套件覆盖的权限和事件。对于用户看到的生产渠道设置，请参阅 [Slack 渠道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 组合有意分离，因为该通道需要在一个工作区中有两个不同的机器人用户 ID。

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

复制 _Bot User OAuth Token_（`xoxb-...`）- 它会成为 `driverBotToken`。驱动机器人只需要发送消息并识别自身；不需要事件，也不需要 Socket Mode。

**2. 创建 SUT 应用**

在同一工作区中重复 _Create New App → From a manifest_。这个 QA 应用有意使用内置 Slack 插件生产清单（`extensions/slack/src/setup-shared.ts:10`）的更窄版本：反应作用域和事件被省略，因为实时 Slack QA 套件尚未覆盖反应处理。

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

Slack 创建应用后，在它的设置页面上完成两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它会成为 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加作用域 `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为 `sutAppToken`。

通过分别对每个令牌调用 `auth.test` 来验证两个机器人具有不同的用户 ID。运行时通过用户 ID 区分驱动机器人和 SUT；为两者复用同一个应用会让提及门控立即失败。

**3. 创建渠道**

在 QA 工作区中创建一个渠道（例如 `#openclaw-qa`），并在渠道内邀请两个机器人：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` ID - 它会成为 `channelId`。公共渠道可以使用；如果使用私有渠道，两个应用已经拥有 `groups:history`，因此 harness 的历史读取仍会成功。

**4. 注册凭证**

有两种选择。对单机调试使用环境变量（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传入 `--credential-source env`），或写入共享 Convex 池，让 CI 和其他维护者可以租用它们。

对于 Convex 池，将四个字段写入 JSON 文件：

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

在本地运行该通道，确认两个机器人可以通过代理彼此对话：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

一次绿色运行会在远少于 30 秒内完成，且 `slack-qa-report.md` 显示 `slack-canary` 和 `slack-mention-gating` 的状态都是 `pass`。如果该通道挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，要么池为空，要么每一行都已被租用 - `qa credentials list --kind slack --status all --json` 会告诉你是哪一种情况。

### Convex 凭证池

Telegram、Discord、Slack 和 WhatsApp 通道可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取一个独占租约，在运行期间为其发送 Heartbeat，并在关闭时释放。池类型为 `"telegram"`、`"discord"`、`"slack"` 和 `"whatsapp"`。

代理在 `admin/add` 上验证的载荷形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必须是数字聊天 ID 字符串。
- Telegram 真实用户（`kind: "telegram-user"`）：`{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - 一个独占的一次性账号租约，同时供 TDLib CLI 驱动和 Telegram Desktop 可视见证使用。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 电话号码必须是不同的 E.164 字符串。

对于可视化真实用户 Telegram 证明，优先使用保持的 Crabbox 会话：

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` 会持有一个独占 Convex `telegram-user` 租约，供 TDLib CLI
驱动和 Telegram Desktop 见证同时使用，启动桌面录制，并保持
Crabbox 存活，以便执行任意由智能体驱动的复现步骤。智能体可以使用 `send`、
`run`、`screenshot` 和 `status`，直到满意为止，然后 `finish`
会在释放凭证前收集截图、视频、运动裁剪后的视频/GIF、TDLib 探测输出
和日志。`publish --session <file> --pr
<number>` 默认只评论运动 GIF；`--full-artifacts` 是对日志和 JSON 输出的
显式选择加入。默认的 `probe` 命令仍是用于快速 `/status` 冒烟检查的
单命令简写。

当 PR 需要确定性的视觉 diff 时，使用 `--mock-response-file <path>`：
在 Telegram 格式化器或投递层发生变化时，可以在 `main` 和 PR head 上运行同一份 mock 模型回复。捕获默认值针对 PR 评论做了调优：标准 Crabbox 类、24fps 桌面录制、24fps 动态 GIF，以及 1920px 预览宽度。前后对比评论应发布一个干净的 bundle，其中只包含预期的 GIF。

Slack lane 也可以使用该池。Slack payload 形状检查目前位于 Slack QA runner 中，而不是 broker 中；请使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，并使用类似 `Cxxxxxxxxxx` 的 Slack 渠道 id。请参阅 [设置 Slack workspace](#setting-up-the-slack-workspace)，了解 app 和 scope 配置。

操作环境变量和 Convex broker 端点契约位于 [测试 → 通过 Convex 共享 Telegram 凭据](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该小节名称早于多渠道池；lease 语义在各类型之间共享）。

## repo 支持的 seeds

Seed 资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些文件有意提交到 git 中，以便 QA plan 对人类和智能体都可见。

`qa-lab` 应保持为通用 markdown runner。每个场景 markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置 patch
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时 surface 可以保持通用且跨领域。例如，markdown 场景可以将传输侧 helper 与浏览器侧 helper 组合起来，通过 Gateway 网关 `browser.request` seam 驱动嵌入式 Control UI，而无需添加特例 runner。

场景文件应按产品能力分组，而不是按源码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 实现实现可追踪性。

baseline 列表应保持足够宽，以覆盖：

- 私信和渠道聊天
- thread 行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- subagent handoff
- repo 阅读和文档阅读
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock lane

`qa suite` 有两个本地提供商 mock lane：

- `mock-openai` 是场景感知的 OpenClaw mock。它仍然是 repo 支持的 QA 和 parity gate 的默认确定性 mock lane。
- `aimock` 会启动一个由 AIMock 支持的提供商服务器，用于实验性协议、fixture、录制/重放和 chaos 覆盖。它是增量补充，不会取代 `mock-openai` 场景 dispatcher。

provider lane 实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile staging 需求，以及 live/mock capability 标志。共享 suite 和 Gateway 网关代码应通过提供商 registry 路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 拥有一个面向 markdown QA 场景的通用传输 seam。`qa-channel` 是该 seam 上的第一个适配器，但设计目标更宽：未来真实或合成的渠道应接入同一 suite runner，而不是新增传输专用 QA runner。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、worker 并发、artifact 写入和报告。
- 传输适配器负责 Gateway 网关配置、readiness、入站和出站观测、传输操作，以及标准化传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时 surface。

### 添加一个渠道

向 markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖该渠道契约的场景包。

当共享 `qa-lab` host 可以拥有该 flow 时，不要添加新的顶层 QA command root。

`qa-lab` 拥有共享 host 机制：

- `openclaw qa` command root
- suite 启动和 teardown
- worker 并发
- artifact 写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` root 下
- 如何为该传输配置 Gateway 网关
- 如何检查 readiness
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露 transcript 和标准化传输状态
- 如何执行传输支持的操作
- 如何处理传输专用 reset 或 cleanup

新渠道的最低采用门槛：

1. 让 `qa-lab` 继续作为共享 `qa` root 的 owner。
2. 在共享 `qa-lab` host seam 上实现传输 runner。
3. 将传输专用机制保留在 runner 插件或渠道 harness 内。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的 root command。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和 runner 执行应留在独立入口点后面。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改造 markdown 场景。
6. 为新场景使用通用场景 helper。
7. 除非 repo 正在进行有意迁移，否则保持现有兼容别名可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就放到 `qa-lab` 中。
- 如果行为依赖某一个渠道传输，就保留在该 runner 插件或插件 harness 中。
- 如果一个场景需要多个渠道都能使用的新能力，请添加通用 helper，而不是在 `suite.ts` 中添加渠道专用分支。
- 如果某个行为只对一个传输有意义，请让场景保持传输专用，并在场景契约中明确说明。

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

现有场景仍可使用兼容别名 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新场景编写应使用通用名称。这些别名存在是为了避免一次性迁移，而不是作为未来模型。

## 报告

`qa-lab` 会从观测到的 bus timeline 导出 Markdown protocol 报告。
该报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单 - 在估算后续工作量或接入新传输时很有用 - 请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

如需进行 character 和 style 检查，请在多个 live 模型 ref 上运行同一场景，并编写经过评审的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。Character eval 场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、workspace 帮助和小文件任务。不应告知候选模型正在接受评估。该命令会保留每个完整 transcript，记录基本运行统计信息，然后以 fast 模式询问 judge 模型，并在支持时使用 `xhigh` reasoning，按自然度、vibe 和幽默感对运行进行排名。
在比较提供商时使用 `--blind-judge-models`：judge prompt 仍会获得每个 transcript 和运行状态，但候选 ref 会替换为中性标签，例如 `candidate-01`；报告会在解析后将排名映射回真实 ref。
候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持它的旧版 OpenAI eval ref 使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍会设置全局 fallback，较旧的 `--model-thinking <provider/model=level>` 形式会为兼容性保留。
OpenAI 候选 ref 默认使用 fast 模式，以便在提供商支持的地方使用 priority processing。当单个候选或 judge 需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想强制每个候选模型都启用 fast 模式时，才传入 `--fast`。候选和 judge 的 duration 会记录在报告中，用于 benchmark 分析，但 judge prompt 会明确说明不要按速度排名。
候选和 judge 模型运行都默认使用并发 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，降低 `--concurrency` 或 `--judge-concurrency`。
未传入候选 `--model` 时，character eval 默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
未传入 `--judge-model` 时，judge 默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
