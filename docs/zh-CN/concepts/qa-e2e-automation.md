---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加基于仓库的 QA 场景
    - 围绕 Gateway 网关仪表盘构建更高真实度的 QA 自动化
summary: QA stack 概览：qa-lab、qa-channel、由仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-04T02:52:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈旨在以比单个单元测试更贴近真实、类似渠道形态的方式来测试 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、反应、编辑和删除界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录记录、注入入站消息，并导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，用于在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库托管的种子资源，用于启动任务和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug，进行修复前后实时验证。

## 命令界面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多流程都有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                                                             |
| `qa suite`                                          | 针对 QA Gateway 网关运行通道运行仓库托管的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                                                       |
| `qa coverage`                                       | 打印 Markdown 场景覆盖清单（使用 `--json` 输出机器可读内容）。                                                                                                                                                 |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入智能体一致性报告。                                                                                                                                                  |
| `qa character-eval`                                 | 在多个实时模型上运行角色 QA 场景，并生成带评审的报告。参见[报告](#reporting)。                                                                                                                                 |
| `qa manual`                                         | 针对所选提供商/模型运行通道运行一次性提示。                                                                                                                                                                   |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                                                                   |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                                                      |
| `qa docker-scaffold`                                | 写入 QA 仪表板 + Gateway 网关运行通道的 docker-compose 脚手架。                                                                                                                                               |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支撑的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                           |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                                                                   |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` 提供商服务器。                                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭据池。                                                                                                                                                                                       |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输运行通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                                                       |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输运行通道。                                                                                                                                                                 |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输运行通道。                                                                                                                                                            |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输运行通道。                                                                                                                                                                    |
| `qa mantis`                                         | 面向实时传输 bug 的修复前后验证运行器，包含 Discord 状态反应证据、Crabbox 桌面/浏览器冒烟测试，以及 Slack-in-VNC 冒烟测试。参见 [Mantis](/zh-CN/concepts/mantis)。 |

## 操作员流程

当前 QA 操作员流程是一个双面板 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录记录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动 Docker 支撑的 Gateway 网关运行通道，并公开 QA Lab 页面，操作员或自动化循环可以在其中给智能体下发 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍被阻塞。

若要更快地迭代 QA Lab UI，而无需每次重建 Docker 镜像，请使用绑定挂载的 QA Lab 包启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预制镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该包，并且浏览器会在 QA Lab 资源哈希变更时自动重新加载。

如需进行本地 OpenTelemetry 跟踪冒烟测试，请运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP 跟踪接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf span，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须保留在跟踪之外。它会在 QA suite 产物旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅保留在源码检出中。npm tarball 会有意省略 QA Lab，因此包 Docker 发布运行通道不会运行 `qa` 命令。更改诊断插桩时，请从已构建的源码检出运行 `pnpm qa:otel:smoke`。

对于真实传输的 Matrix 冒烟测试运行通道，请运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此运行通道的完整 CLI 参考、profile/场景目录、环境变量和产物布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。概览：它会在 Docker 中预配一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输的子 QA Gateway 网关内运行真实 Matrix 插件（无 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 产物和合并输出日志。

对于真实传输的 Telegram、Discord 和 Slack 冒烟测试运行通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们面向一个预先存在的真实渠道，使用两个机器人（driver + SUT）。所需环境变量、场景列表、输出产物和 Convex 凭据池记录在下方的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

如需运行带 VNC 救援的完整 Slack 桌面 VM，请运行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

该命令会租用一台 Crabbox 桌面/浏览器机器，在 VM 内运行 Slack 实时运行通道，在 VNC 浏览器中打开 Slack Web，捕获桌面，并将 `slack-qa/` 以及 `slack-desktop-smoke.png` 复制回 Mantis 产物目录。通过 VNC 手动登录 Slack Web 后，可复用 `--lease-id <cbx_...>`。使用 `--gateway-setup` 时，Mantis 会在 VM 内保留一个持久的 OpenClaw Slack Gateway 网关，在端口 `38973` 上运行；若不使用该选项，命令会运行普通的 bot-to-bot Slack QA 运行通道，并在产物捕获后退出。

使用池化实时凭据之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境，验证端点设置，并在维护者密钥存在时验证 admin/list 可达性。它只报告密钥的已设置/缺失状态。

## 实时传输覆盖范围

实时传输运行通道共享同一个契约，而不是各自发明自己的场景列表形态。`qa-channel` 是覆盖面广的合成产品行为 suite，并不是实时传输覆盖矩阵的一部分。

| 运行通道 | 金丝雀 | 提及门控 | Bot-to-bot | 允许列表阻止 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------- | ---------- | ------------ | -------- | -------- | -------- | -------- | -------- | -------- | ------------ |
| Matrix   | x      | x        | x          | x            | x        | x        | x        | x        | x        |          |              |
| Telegram | x      | x        | x          |              |          |          |          |          |          | x        |              |
| Discord  | x      | x        | x          |              |          |          |          |          |          |          | x            |
| Slack    | x      | x        | x          |              |          |          |          |          |          |          |              |

这会让 `qa-channel` 保持为覆盖面广的产品行为 suite，同时让 Matrix、Telegram 和未来的实时传输共享一份明确的传输契约检查清单。

如需运行不把 Docker 带入 QA 路径的一次性 Linux VM 运行通道，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个新的 Multipass 虚拟机，安装依赖，在虚拟机内构建 OpenClaw，运行 `qa suite`，然后把常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass suite 运行默认会使用隔离的 Gateway 网关工作进程并行执行多个已选场景。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 进行串行执行。
当任何场景失败时，该命令会以非零状态退出。如果你想要产物但不想产生失败退出码，请使用 `--allow-failures`。
实时运行会转发对虚拟机而言可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便虚拟机可以通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量较多，并且需要基于 Docker 的 homeserver 配置。Telegram、Discord 和 Slack 规模较小——每个只有少量场景，没有配置档案系统，面向预先存在的真实渠道——因此它们的参考内容放在这里。

### 共享 CLI 标志

这些通道通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                                         | 描述                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 仅运行此场景。可重复。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告、摘要、观察到的消息和输出日志的位置。相对路径会相对于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时的仓库根目录。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置内的临时账号 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍然可用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                                | 主模型/备用模型引用。                                                                                         |
| `--fast`                              | 关闭                                                             | 在受支持位置启用提供商快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 参见 [Convex 凭证池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                              | 使用 `--credential-source convex` 时使用的角色。                                                                          |

每个通道在任何场景失败时都会以非零状态退出。`--allow-failures` 会写入产物，但不会设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，使用两个不同的 bot（driver + SUT）。SUT bot 必须拥有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，bot 到 bot 的观察效果最佳。

当 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观察消息产物中保留消息正文（默认会编辑隐藏）。

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

输出产物：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — 从 canary 开始包含每条回复的 RTT（driver 发送 → 观察到 SUT 回复）。
- `telegram-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被编辑隐藏。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 渠道，使用两个 bot：一个由 harness 控制的 driver bot，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT bot。验证渠道提及处理、SUT bot 已向 Discord 注册原生 `/help` 命令，以及选择加入的 Mantis 证据场景。

当 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必须与 Discord 返回的 SUT bot 用户 id 匹配（否则该通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观察消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 选择加入的 Mantis 场景。它会单独运行，因为它会将 SUT 切换为始终开启、仅工具的 guild 回复，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST reaction 时间线以及 HTML/PNG 可视产物。

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
- `discord-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被编辑隐藏。
- 运行状态 reaction 场景时会生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 渠道，使用两个不同的 bot：一个由 harness 控制的 driver bot，以及一个由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT bot。

当 `--credential-source env` 时需要的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在观察消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`

输出产物：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否则正文会被编辑隐藏。

### Convex 凭证池

Telegram、Discord 和 Slack 通道可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间对其发送 Heartbeat，并在关闭时释放它。池类型为 `"telegram"`、`"discord"` 和 `"slack"`。

broker 会在 `admin/add` 上校验的 payload 形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必须是数字聊天 id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作环境变量和 Convex broker 端点契约位于[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；broker 语义对两种类型都相同）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意放在 git 中，这样 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 markdown runner。每个场景 markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、通道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时表面允许保持通用且跨领域。例如，markdown 场景可以组合传输侧 helper 和浏览器侧 helper，后者通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊情况 runner。

场景文件应按产品能力而不是源码树文件夹分组。文件移动时请保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 进行实现可追溯。

基线列表应保持足够广，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- subagent handoff
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 有两个本地提供商 mock 通道：

- `mock-openai` 是可感知场景的 OpenClaw mock。它仍然是仓库支持 QA 和 parity gate 的默认确定性 mock 通道。
- `aimock` 会启动一个 AIMock 支持的提供商服务器，用于实验性协议、fixture、record/replay 和 chaos 覆盖。它是增量能力，不会替代 `mock-openai` 场景分派器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、认证档案 staging 需求，以及实时/mock 能力标志。共享 suite 和 Gateway 网关代码应通过提供商注册表路由，而不是基于提供商名称分支。

## 传输适配器

`qa-lab` 拥有面向 markdown QA 场景的通用传输接缝。`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个 suite runner，而不是添加特定传输的 QA runner。

在架构层面，拆分为：

- `qa-lab` 拥有通用场景执行、工作进程并发、产物写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪状态、入站和出站观察、传输操作，以及规范化的传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖该渠道契约的场景包。

当共享 `qa-lab` 主机可以拥有流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享主机机制：

- `openclaw qa` 命令根
- 套件启动和清理
- worker 并发
- artifact 写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容性别名

运行器插件拥有传输协议契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根下
- 如何为该传输协议配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和规范化后的传输协议状态
- 如何执行由传输协议支持的操作
- 如何处理传输协议专属的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享 `qa-lab` 主机 seam 上实现传输协议运行器。
3. 将传输协议专属机制保留在运行器插件或渠道 harness 内。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册竞争性的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟 CLI 和运行器执行应保留在单独入口点之后。
5. 在主题化的 `qa/scenarios/` 目录下编写或改编 Markdown 场景。
6. 对新场景使用通用场景 helper。
7. 除非仓库正在进行有意的迁移，否则保持现有兼容性别名可用。

决策规则是严格的：

- 如果行为可以在 `qa-lab` 中只表达一次，就把它放在 `qa-lab` 中。
- 如果行为依赖某一个渠道传输协议，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一个多个渠道都能使用的新能力，就添加通用 helper，而不是在 `suite.ts` 中添加渠道专属分支。
- 如果某个行为只对一种传输协议有意义，就保持该场景为传输协议专属，并在场景契约中明确说明。

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

现有场景仍可使用兼容性别名：`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`，但新场景编写应使用通用名称。这些别名存在是为了避免一次性迁移，而不是未来的模型。

## 报告

`qa-lab` 会从观察到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单（在评估后续工作规模或接入新传输协议时很有用），运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

对于角色和风格检查，请跨多个实时模型 refs 运行同一场景，并编写一个经过评判的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每个完整 transcript，记录基础运行统计，然后以 fast mode 请求评审模型，并在受支持时使用 `xhigh` reasoning，按自然度、氛围和幽默感对运行结果排序。比较提供商时使用 `--blind-judge-models`：评审提示仍会获得每个 transcript 和运行状态，但候选 refs 会被替换为中性标签，例如 `candidate-01`；报告在解析后会将排名映射回真实 refs。
候选运行默认使用 `high` thinking；GPT-5.5 使用 `medium`，支持该级别的旧版 OpenAI 评估 refs 使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍会设置全局 fallback，旧版 `--model-thinking <provider/model=level>` 形式保留用于兼容。
OpenAI 候选 refs 默认使用 fast mode，以便在提供商支持时使用 priority processing。当单个候选或评审需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想为每个候选模型强制开启 fast mode 时，才传递 `--fast`。候选和评审耗时会记录在报告中以供基准分析，但评审提示会明确说明不要按速度排序。
候选和评审模型运行都默认并发数为 16。当提供商限制或本地 Gateway 网关压力导致运行过于嘈杂时，降低 `--concurrency` 或 `--judge-concurrency`。
未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未传入 `--judge-model` 时，评审默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
