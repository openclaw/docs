---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输协议适配器
    - 添加基于仓库的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、仓库支撑的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-07T13:15:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈用于以比单个单元测试更真实、更贴近渠道形态的方式演练 OpenClaw。

当前组成：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、表态、编辑和删除表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录记录、注入入站消息并导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，用于在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库提供支持的种子资产，用于启动任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：用于需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug 的前后实时验证。

## 命令表面

每个 QA 流都在 `pnpm openclaw qa <subcommand>` 下运行。许多流有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                                                                                                                        |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行由仓库提供支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                                                                               |
| `qa coverage`                                       | 打印 Markdown 场景覆盖率清单（`--json` 用于机器输出）。                                                                                                                                                                                                                   |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入智能体一致性报告。                                                                                                                                                                                                             |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成经过评审的报告。参见[报告](#reporting)。                                                                                                                                                                                           |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示。                                                                                                                                                                                                                                   |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                              |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | 为 QA 仪表盘 + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                                                                                                                               |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                       |
| `qa aimock`                                         | 仅启动 AIMock provider 服务器。                                                                                                                                                                                                                                           |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` provider 服务器。                                                                                                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭证池。                                                                                                                                                                                                                                                  |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                                                                                     |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                                                                                                                                |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输通道。                                                                                                                                                                                                                           |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输通道。                                                                                                                                                                                                                                   |
| `qa mantis`                                         | 用于实时传输 bug 的前后验证运行器，带有 Discord 状态表态证据、Crabbox 桌面/浏览器 smoke，以及 Slack-in-VNC smoke。参见 [Mantis](/zh-CN/concepts/mantis) 和 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。 |

## 操作员流程

当前 QA 操作员流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表盘（控制 UI）。
- 右侧：QA Lab，显示类 Slack 的转录记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可以在此向智能体下发 QA 任务、观察真实渠道行为，并记录哪些已工作、失败或仍被阻塞。

为了在不每次都重建 Docker 镜像的情况下更快迭代 QA Lab UI，请使用绑定挂载的 QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，并且当 QA Lab 资产哈希变化时，浏览器会自动重新加载。

对于本地 OpenTelemetry trace smoke，请运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf span，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须留在 trace 之外。它会在 QA suite 工件旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅适用于源码 checkout。npm tarball 会有意省略 QA Lab，因此 package Docker 发布通道不会运行 `qa` 命令。更改诊断插桩时，请从已构建的源码 checkout 运行 `pnpm qa:otel:smoke`。

对于传输真实的 Matrix smoke 通道，请运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

该通道的完整 CLI 参考、profile/场景目录、环境变量和工件布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要来说：它会在 Docker 中配置一个一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输的子 QA Gateway 网关内运行真实 Matrix 插件（无 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 工件和合并输出日志。

这些场景覆盖单元测试无法端到端证明的传输行为：提及门控、allow-bot 策略、允许列表、顶级回复和线程回复、私信路由、表态处理、入站编辑抑制、重启重放去重、homeserver 中断恢复、审批元数据投递、媒体处理，以及 Matrix E2EE bootstrap/recovery/verification 流。E2EE CLI profile 还会通过同一个一次性 homeserver 驱动 `openclaw matrix encryption setup` 和验证命令，然后再检查 Gateway 网关回复。

Discord 也有仅限 Mantis、需要选择启用的 bug 复现场景。使用 `--scenario discord-status-reactions-tool-only` 获取明确的状态表态时间线，或使用 `--scenario discord-thread-reply-filepath-attachment` 创建真实 Discord 线程，并验证 `message.thread-reply` 保留 `filePath` 附件。这些场景不在默认实时 Discord 通道中，因为它们是前后复现探针，而不是广泛的 smoke 覆盖。线程附件 Mantis 工作流也可以在 QA 环境中配置 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 时添加已登录的 Discord Web 见证视频。该 viewer profile 仅用于视觉捕获；通过/失败决策仍来自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同命令表面。定时和默认手动运行会使用实时 frontier 凭证、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 执行快速 Matrix profile。手动 `matrix_profile=all` 会扇出到五个 profile 分片，使详尽目录可以并行运行，同时保持每个分片一个工件目录。

对于传输真实的 Telegram、Discord 和 Slack smoke 通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们以预先存在的真实渠道为目标，并使用两个 bot（driver + SUT）。必需环境变量、场景列表、输出工件以及 Convex 凭证池记录在下方的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

对于带 VNC 救援的完整 Slack 桌面 VM 运行，执行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack live lane，在 VNC 浏览器中打开 Slack Web，捕获桌面，并在视频捕获可用时将 `slack-qa/`、`slack-desktop-smoke.png` 和 `slack-desktop-smoke.mp4` 复制回 Mantis 制品目录。Crabbox 桌面/浏览器租约会预先提供捕获工具和浏览器/原生构建辅助包，因此该场景只应在较旧的租约上安装回退项。Mantis 会在 `mantis-slack-desktop-smoke-report.md` 中报告总耗时和各阶段耗时，因此慢速运行可以看出时间花在了租约预热、凭证获取、远程设置还是制品复制上。通过 VNC 手动登录 Slack Web 后，使用 `--lease-id <cbx_...>` 复用租约；复用租约也会保持 Crabbox 的 pnpm store 缓存处于预热状态。默认的 `--hydrate-mode source` 会从源码 checkout 验证，并在 VM 内运行安装/构建。仅当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`；该模式会跳过昂贵的安装/构建步骤，并在工作区未就绪时失败关闭。使用 `--gateway-setup` 时，Mantis 会在 VM 内留下一个持久运行的 OpenClaw Slack 网关，端口为 `38973`；不使用该选项时，该命令会运行常规的 bot-to-bot Slack QA lane，并在制品捕获后退出。

操作员检查清单、GitHub 工作流派发命令、证据评论契约、hydrate-mode 决策表、耗时解释和故障处理步骤位于 [Mantis Slack 桌面运行手册](/zh-CN/concepts/mantis-slack-desktop-runbook)。

对于智能体/CV 风格的桌面任务，执行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` 会租用或复用一台 Crabbox 桌面/浏览器机器，启动 `crabbox record --while`，通过嵌套的 `visual-driver` 驱动可见浏览器，捕获 `visual-task.png`，在选择 `--vision-mode image-describe` 时对截图运行 `openclaw infer image describe`，并写入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 和 `mantis-visual-task-report.md`。设置 `--expect-text` 时，视觉提示会请求结构化 JSON 判定，并且只有当模型报告正向可见证据时才通过；如果负向响应只是引用了目标文本，则断言失败。使用 `--vision-mode metadata` 可进行无模型 smoke，证明桌面、浏览器、截图和视频管线，而不调用图像理解提供商。录制是 `visual-task` 的必需制品；如果 Crabbox 未录制到非空的 `visual-task.mp4`，即使视觉驱动已通过，任务也会失败。失败时，Mantis 会保留租约以供 VNC 使用，除非任务已经通过且未设置 `--keep-lease`。

在使用池化 live 凭证之前，执行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量，验证端点设置，并在维护者 secret 存在时验证 admin/list 可达性。它只报告 secret 的已设置/缺失状态。

## Live 传输覆盖范围

Live 传输 lane 共享一个契约，而不是各自发明自己的场景列表形状。`qa-channel` 是广泛的合成产品行为套件，不属于 live 传输覆盖矩阵。

| Lane     | Canary | 提及门控 | Bot-to-bot | Allowlist 阻止 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

这会让 `qa-channel` 保持为广泛的产品行为套件，同时 Matrix、Telegram 和未来的 live 传输共享一个明确的传输契约检查清单。

对于不将 Docker 带入 QA 路径的一次性 Linux VM lane，执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上 `qa suite` 相同的场景选择行为。
默认情况下，主机和 Multipass 套件运行会使用隔离的 Gateway 网关 worker 并行执行多个已选择场景。`qa-channel` 默认并发数为 4，并受已选择场景数量限制。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
当任何场景失败时，该命令会以非零状态退出。需要制品但不希望失败退出码时，使用 `--allow-failures`。
Live 运行会转发适合 guest 的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。保持 `--output-dir` 位于仓库根目录下，这样 guest 就能通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量较多，并且使用 Docker 支撑的 homeserver 预配。Telegram、Discord 和 Slack 更小，每个只有少量场景，没有 profile 系统，并且针对预先存在的真实渠道，因此它们的参考内容放在这里。

### 共享 CLI 标志

这些 lane 通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                                         | 描述                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | 只运行此场景。可重复。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告/摘要/观察到的消息和输出日志的位置。相对路径按 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时的仓库根目录。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置中的临时账户 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                                | 主/备用模型引用。                                                                                         |
| `--fast`                              | 关闭                                                             | 支持时启用提供商快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 请参阅 [Convex 凭证池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                              | 使用 `--credential-source convex` 时使用的角色。                                                                          |

任何场景失败时，每个 lane 都会以非零状态退出。`--allow-failures` 会写入制品，但不设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，包含两个不同的 bot（driver + SUT）。SUT bot 必须有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，bot-to-bot 观察效果最好。

使用 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在 observed-message 制品中保留消息正文（默认会脱敏）。

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
- `telegram-qa-summary.json` - 包含从 canary 开始的每次回复 RTT（driver 发送 → 观察到 SUT 回复）。
- `telegram-qa-observed-messages.json` - 正文会脱敏，除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 渠道，包含两个 bot：由 harness 控制的 driver bot，以及由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT bot。验证渠道提及处理、SUT bot 是否已向 Discord 注册原生 `/help` 命令，以及选择加入的 Mantis 证据场景。

使用 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必须匹配 Discord 返回的 SUT bot 用户 id（否则 lane 会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在 observed-message 制品中保留消息正文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 会为 `discord-voice-autojoin` 选择语音/stage 渠道；没有它时，该场景会为 SUT bot 选择第一个可见的语音/stage 渠道。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 选择启用的语音场景。单独运行，启用 `channels.discord.voice.autoJoin`，并验证 SUT 机器人当前的 Discord 语音状态是否为目标语音/舞台频道。Convex Discord 凭证可以包含可选的 `voiceChannelId`；否则运行器会发现服务器中第一个可见的语音/舞台频道。
- `discord-status-reactions-tool-only` - 选择启用的 Mantis 场景。因为它会将 SUT 切换为始终在线、仅工具的服务器回复，并设置 `messages.statusReactions.enabled=true`，所以会单独运行；随后捕获 REST reaction 时间线以及 HTML/PNG 可视化产物。Mantis 前后对比报告还会将场景提供的 MP4 产物保留为 `baseline.mp4` 和 `candidate.mp4`。

显式运行 Discord 语音自动加入场景：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

显式运行 Mantis 状态 reaction 场景：

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
- `discord-qa-observed-messages.json` - 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被遮盖。
- 状态 reaction 场景运行时会生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的 Slack 私有频道，其中有两个不同的机器人：一个由测试框架控制的驱动机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT 机器人。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在已观察消息产物中保留消息正文。

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
- `slack-qa-observed-messages.json` - 除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被遮盖。

#### 设置 Slack 工作区

该通道需要同一个工作区中的两个不同 Slack 应用，以及一个两个机器人都已加入的频道：

- `channelId` - 两个机器人都已被邀请加入的频道的 `Cxxxxxxxxxx` ID。请使用专用频道；该通道每次运行都会发帖。
- `driverBotToken` - **Driver** 应用的机器人令牌（`xoxb-...`）。
- `sutBotToken` - **SUT** 应用的机器人令牌（`xoxb-...`），它必须是不同于驱动机器人的独立 Slack 应用，这样它的机器人用户 ID 才会不同。
- `sutAppToken` - SUT 应用带有 `connections:write` 的应用级令牌（`xapp-...`），供 Socket Mode 使用，以便 SUT 应用能够接收事件。

优先使用专用于 QA 的 Slack 工作区，而不是复用生产工作区。

下面的 SUT 清单有意将内置 Slack 插件的生产安装（`extensions/slack/src/setup-shared.ts:10`）收窄到实时 Slack QA 套件覆盖的权限和事件。关于用户看到的生产频道设置，请参见 [Slack 频道快速设置](/zh-CN/channels/slack#quick-setup)；QA Driver/SUT 对有意保持独立，因为该通道需要同一个工作区中的两个不同机器人用户 ID。

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

在同一工作区中重复 _Create New App → From a manifest_。此 QA 应用有意使用内置 Slack 插件生产清单的较窄版本（`extensions/slack/src/setup-shared.ts:10`）：reaction 作用域和事件被省略，因为实时 Slack QA 套件尚未覆盖 reaction 处理。

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

Slack 创建应用后，在其设置页面执行两件事：

- _Install to Workspace_ → 复制 _Bot User OAuth Token_ → 它会成为 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 添加作用域 `connections:write` → 保存 → 复制 `xapp-...` 值 → 它会成为 `sutAppToken`。

分别对每个令牌调用 `auth.test`，验证两个机器人具有不同的用户 ID。运行时通过用户 ID 区分驱动机器人和 SUT；两者复用同一个应用会导致 mention-gating 立即失败。

**3. 创建频道**

在 QA 工作区中创建一个频道（例如 `#openclaw-qa`），并在频道内邀请两个机器人：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

从 _channel info → About → Channel ID_ 复制 `Cxxxxxxxxxx` ID - 它会成为 `channelId`。公共频道可以使用；如果你使用私有频道，两个应用已经拥有 `groups:history`，因此测试框架的历史记录读取仍会成功。

**4. 注册凭证**

有两个选项。可以使用环境变量进行单机调试（设置四个 `OPENCLAW_QA_SLACK_*` 变量并传递 `--credential-source env`），也可以播种共享 Convex 池，以便 CI 和其他维护者租用它们。

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

在本地运行该通道，确认两个机器人可以通过代理服务相互通信：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

绿色运行会在远少于 30 秒内完成，并且 `slack-qa-report.md` 会显示 `slack-canary` 和 `slack-mention-gating` 的状态均为 `pass`。如果该通道挂起约 90 秒并以 `Convex credential pool exhausted for kind "slack"` 退出，要么池为空，要么每一行都已被租用 - `qa credentials list --kind slack --status all --json` 会告诉你具体情况。

### Convex 凭证池

Telegram、Discord 和 Slack 通道可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传递 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间为其发送 Heartbeat，并在关闭时释放它。池类型为 `"telegram"`、`"discord"` 和 `"slack"`。

代理服务会在 `admin/add` 上验证的载荷形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必须是数字聊天 ID 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）：`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` 必须匹配 `^[A-Z][A-Z0-9]+$`（类似 `Cxxxxxxxxxx` 的 Slack ID）。有关应用和作用域配置，请参见[设置 Slack 工作区](#setting-up-the-slack-workspace)。

操作环境变量和 Convex 代理服务端点契约位于[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；两种类型的代理服务语义相同）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

它们有意保存在 git 中，因此 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、通道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时表面可以保持通用且跨领域。例如，Markdown 场景可以将传输端辅助函数与浏览器端辅助函数组合使用，后者通过 Gateway 网关 `browser.request` seam 驱动嵌入式 Control UI，而无需添加特殊情况运行器。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来实现实现可追溯性。

基线列表应保持足够宽，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体移交
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 有两个本地提供商 mock 通道：

- `mock-openai` 是可感知场景的 OpenClaw mock。它仍然是仓库支持的 QA 和 parity gate 的默认确定性 mock 通道。
- `aimock` 会启动由 AIMock 支持的提供商服务器，用于实验性协议、fixture、录制/回放和混沌覆盖。它是增量能力，不会替代 `mock-openai` 场景分发器。

提供商通道实现在 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、认证配置文件暂存需求，以及实时/mock 能力标志。共享套件和 Gateway 网关代码应通过提供商注册表路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 拥有用于 markdown QA 场景的通用传输抽象接入面。`qa-channel` 是该接入面上的第一个适配器，但设计目标更宽：未来的真实或合成渠道应接入同一个套件运行器，而不是新增特定传输协议的 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 拥有通用场景执行、工作器并发、产物写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪状态、入站和出站观测、传输操作，以及规范化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖渠道契约的场景包。

当共享的 `qa-lab` 宿主可以拥有该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享宿主机制：

- `openclaw qa` 命令根
- 套件启动和拆卸
- 工作器并发
- 产物写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

运行器插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根下
- 如何为该传输协议配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露记录文本和规范化的传输状态
- 如何执行由传输协议支撑的操作
- 如何处理特定传输协议的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` 宿主接入面上实现传输运行器。
3. 将特定传输协议的机制保留在运行器插件或渠道 harness 中。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应保留在独立入口点之后。
5. 在主题化的 `qa/scenarios/` 目录下编写或改编 Markdown 场景。
6. 对新场景使用通用场景 helper。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就把它放在 `qa-lab` 中。
- 如果行为依赖某一个渠道传输协议，就把它保留在对应的运行器插件或插件 harness 中。
- 如果某个场景需要一项可供多个渠道使用的新能力，就添加通用 helper，而不是在 `suite.ts` 中添加特定渠道的分支。
- 如果某个行为只对一种传输协议有意义，就保持该场景为特定传输协议场景，并在场景契约中明确说明。

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

兼容别名仍可用于现有场景 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新场景编写应使用通用名称。这些别名的存在是为了避免一次性迁移，而不是未来的模型。

## 报告

`qa-lab` 从观测到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单（在评估后续工作规模或接入新传输协议时很有用），运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

对于角色和风格检查，使用多个实时模型 ref 运行同一场景，
并写入经过评审的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估
场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，
例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在接受评估。该命令会保留每份完整
记录文本，记录基本运行统计信息，然后要求评审模型在快速模式下使用
受支持的 `xhigh` 推理，按自然度、感觉和幽默感对运行结果排序。
比较提供商时使用 `--blind-judge-models`：评审提示仍会获得
每份记录文本和运行状态，但候选 ref 会替换为中性
标签，例如 `candidate-01`；报告会在解析后把排名映射回真实 ref。
候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持它的
旧版 OpenAI 评估 ref 使用 `xhigh`。使用
`--model provider/model,thinking=<level>` 内联覆盖某个候选。`--thinking <level>` 仍会设置
全局回退，而旧的 `--model-thinking <provider/model=level>` 形式会
为了兼容性保留。
OpenAI 候选 ref 默认使用快速模式，以便在
提供商支持时使用优先处理。单个候选或评审需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想要
强制所有候选模型启用快速模式时，才传入 `--fast`。候选和评审耗时会
记录在报告中用于基准分析，但评审提示会明确要求
不要按速度排名。
候选和评审模型运行都默认并发为 16。当提供商限制或本地 Gateway 网关
压力使运行结果噪声过大时，降低 `--concurrency` 或 `--judge-concurrency`。
未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
未传入 `--judge-model` 时，评审模型默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表盘](/zh-CN/web/dashboard)
