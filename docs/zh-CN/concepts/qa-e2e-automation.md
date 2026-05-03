---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、由仓库支撑的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-05-03T22:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7553094890e20eb760df149ac8bd598048c023dc072743ffe2a8dd60d17382de
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 栈用于以更真实、更贴近渠道形态的方式演练 OpenClaw，这是单个单元测试做不到的。

当前组成：

- `extensions/qa-channel`：合成消息渠道，包含私信、渠道、线程、表情回应、编辑和删除表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察会话记录、注入入站消息，以及导出 Markdown 报告。
- `extensions/qa-matrix`、未来的 runner 插件：实时传输适配器，用于在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库支持的启动任务种子资产和基线 QA 场景。
- [Mantis](/zh-CN/concepts/mantis)：针对需要真实传输、浏览器截图、VM 状态和 PR 证据的 bug，进行修复前后的实时验证。

## 命令表面

每个 QA 流都在 `pnpm openclaw qa <subcommand>` 下运行。许多命令都有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                         |
| `qa suite`                                          | 针对 QA Gateway 网关 lane 运行由仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                   |
| `qa coverage`                                       | 打印 markdown 场景覆盖率清单（`--json` 用于机器输出）。                                                                                                                    |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入智能体 parity 报告。                                                                                                            |
| `qa character-eval`                                 | 在多个实时模型上运行角色 QA 场景，并生成带评判的报告。参见[报告](#reporting)。                                                                                             |
| `qa manual`                                         | 针对选定的提供商/模型 lane 运行一次性提示词。                                                                                                                             |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                               |
| `qa docker-build-image`                             | 构建预制 QA Docker 镜像。                                                                                                                                                  |
| `qa docker-scaffold`                                | 为 QA 仪表板 + Gateway 网关 lane 写入 docker-compose 脚手架。                                                                                                             |
| `qa up`                                             | 构建 QA 站点，启动 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                       |
| `qa aimock`                                         | 仅启动 AIMock 提供商服务器。                                                                                                                                               |
| `qa mock-openai`                                    | 仅启动感知场景的 `mock-openai` 提供商服务器。                                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭证池。                                                                                                                                                   |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输 lane。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                     |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输 lane。                                                                                                                               |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输 lane。                                                                                                                          |
| `qa slack`                                          | 针对真实私有 Slack 渠道的实时传输 lane。                                                                                                                                  |
| `qa mantis`                                         | 用于实时传输 bug 的修复前后验证 runner，包含第一个 Discord 状态回应场景。参见 [Mantis](/zh-CN/concepts/mantis)。                                                                |

## 操作者流程

当前 QA 操作者流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的会话记录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动 Docker 支持的 Gateway 网关 lane，并公开 QA Lab 页面，操作者或自动化循环可以在这里给智能体分配 QA 任务、观察真实渠道行为，并记录哪些成功、失败或仍然阻塞。

为了更快迭代 QA Lab UI，而不必每次都重建 Docker 镜像，可以使用 bind-mounted 的 QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资产哈希变化时浏览器会自动重新加载。

要进行本地 OpenTelemetry trace smoke，请运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace receiver，启用 `diagnostics-otel` 插件运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须留在 trace 之外。它会在 QA suite artifacts 旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅适用于源码 checkout。npm tarball 有意省略 QA Lab，因此 package Docker release lane 不会运行 `qa` 命令。修改诊断 instrumentation 时，请从已构建的源码 checkout 运行 `pnpm qa:otel:smoke`。

要运行真实传输的 Matrix smoke lane，请运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此 lane 的完整 CLI 参考、profile/场景目录、环境变量和 artifact 布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要来说：它会在 Docker 中配置一个一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输的子 QA Gateway 网关内运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events artifact 和合并输出日志。

对于真实传输的 Telegram、Discord 和 Slack smoke lane：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

它们以一个预先存在的真实渠道为目标，并使用两个 bot（driver + SUT）。必需环境变量、场景列表、输出 artifacts 和 Convex 凭证池记录在下面的 [Telegram、Discord 和 Slack QA 参考](#telegram-discord-and-slack-qa-reference)中。

使用池化实时凭证之前，运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境、验证 endpoint 设置，并在存在 maintainer secret 时验证 admin/list 可达性。它只报告 secret 的已设置/缺失状态。

## 实时传输覆盖范围

实时传输 lane 共享一份契约，而不是各自发明自己的场景列表形态。`qa-channel` 是宽泛的合成产品行为 suite，不属于实时传输覆盖矩阵。

| Lane     | Canary | 提及门控 | Bot-to-bot | allowlist 阻止 | 顶层回复 | 重启恢复 | 线程后续消息 | 线程隔离 | 表情回应观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------- | ---------- | -------------- | -------- | -------- | ------------ | -------- | ------------ | --------- | ------------ |
| Matrix   | x      | x        | x          | x              | x        | x        | x            | x        | x            |           |              |
| Telegram | x      | x        | x          |                |          |          |              |          |              | x         |              |
| Discord  | x      | x        | x          |                |          |          |              |          |              |           | x            |
| Slack    | x      | x        | x          |                |          |          |              |          |              |           |              |

这会保留 `qa-channel` 作为宽泛的产品行为 suite，同时让 Matrix、Telegram 和未来实时传输共享一份明确的传输契约 checklist。

要在不把 Docker 带入 QA 路径的情况下运行一次性 Linux VM lane，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest、安装依赖、在 guest 内构建 OpenClaw、运行 `qa suite`，然后把普通 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上的 `qa suite` 相同的场景选择行为。
主机和 Multipass suite 运行默认会使用隔离的 Gateway 网关 worker 并行执行多个已选场景。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 串行执行。
任何场景失败时，该命令都会以非零状态退出。当你想获取 artifacts 但不想要失败退出码时，请使用 `--allow-failures`。
实时运行会转发对 guest 实用的受支持 QA auth 输入：基于环境的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，这样 guest 才能通过挂载的工作区写回。

## Telegram、Discord 和 Slack QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量更多，并且需要 Docker 支持的 homeserver 配置。Telegram、Discord 和 Slack 更小，每个只有少量场景、没有 profile 系统，并针对预先存在的真实渠道，因此它们的参考放在这里。

### 共享 CLI 标志

这些 lane 通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志                                  | 默认值                                                         | 描述                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | 仅运行此场景。可重复。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | 写入报告、摘要、观察到的消息和输出日志的位置。相对路径基于 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 从中立 cwd 调用时的仓库根目录。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 网关配置内的临时账号 id。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可用）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | 主/备用模型引用。                                                                                         |
| `--fast`                              | off                                                             | 支持时启用提供商快速模式。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | 参见 [Convex 凭证池](#convex-credential-pool)。                                                                |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                              | `--credential-source convex` 时使用的角色。                                                                          |

任何场景失败时，每条 lane 都会以非零状态退出。`--allow-failures` 会写入产物，但不会设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中有两个不同的 bot（driver + SUT）。SUT bot 必须有 Telegram 用户名；当两个 bot 都在 `@BotFather` 中启用 **Bot-to-Bot Communication Mode** 时，bot 到 bot 观察效果最好。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数字聊天 id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观察到的消息产物中保留消息正文（默认会脱敏）。

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
- `telegram-qa-summary.json` — 包含从 canary 开始的每条回复 RTT（driver 发送 → 观察到 SUT 回复）。
- `telegram-qa-observed-messages.json` — 正文会脱敏，除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 频道，其中有两个 bot：由 harness 控制的 driver bot，以及由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT bot。验证频道提及处理、SUT bot 是否已向 Discord 注册原生 `/help` 命令，以及选择加入的 Mantis 证据场景。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必须匹配 Discord 返回的 SUT bot 用户 id（否则该 lane 会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观察到的消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — 选择加入的 Mantis 场景。它会单独运行，因为它会将 SUT 切换为始终开启、仅工具的 guild 回复模式，并设置 `messages.statusReactions.enabled=true`，然后捕获 REST reaction 时间线以及一个 HTML/PNG 视觉产物。

显式运行 Mantis status-reaction 场景：

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
- `discord-qa-observed-messages.json` — 正文会脱敏，除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- 运行 status-reaction 场景时会生成 `discord-qa-reaction-timelines.json` 和 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目标是一个真实的私有 Slack 频道，其中有两个不同的 bot：由 harness 控制的 driver bot，以及由子 OpenClaw Gateway 网关通过内置 Slack 插件启动的 SUT bot。

使用 `--credential-source env` 时必需的环境变量：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

可选：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 会在观察到的消息产物中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）：

- `slack-canary`
- `slack-mention-gating`

输出产物：

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — 正文会脱敏，除非设置 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。

### Convex 凭证池

Telegram、Discord 和 Slack lane 可以从共享 Convex 池租用凭证，而不是读取上面的环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取一个独占租约，在运行期间发送 Heartbeat，并在关闭时释放。池类型为 `"telegram"`、`"discord"` 和 `"slack"`。

broker 在 `admin/add` 上验证的 payload 形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必须是数字 chat-id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作用环境变量和 Convex broker 端点契约位于 [测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该小节名称早于 Discord 支持；两种类型的 broker 语义相同）。

## 仓库支持的 seeds

seed 资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意纳入 git，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 Markdown runner。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、lane 和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面允许保持通用且跨领域。例如，Markdown 场景可以组合传输侧 helper 和浏览器侧 helper，后者通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊情况 runner。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 做实现可追溯性。

基线列表应保持足够宽，以覆盖：

- 私信和频道聊天
- thread 行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- subagent handoff
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock lanes

`qa suite` 有两个本地提供商 mock lanes：

- `mock-openai` 是感知场景的 OpenClaw mock。它仍是仓库支持 QA 和 parity gate 的默认确定性 mock lane。
- `aimock` 会启动一个由 AIMock 支撑的提供商服务器，用于实验性协议、fixture、record/replay 和 chaos 覆盖。它是增量能力，不会取代 `mock-openai` 场景调度器。

provider-lane 实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile staging 需求，以及 live/mock 能力标志。共享 suite 和 Gateway 网关代码应通过提供商 registry 路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景拥有一个通用传输接缝。`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来真实或合成的渠道应接入同一个 suite runner，而不是添加特定于传输的 QA runner。

在架构层面，拆分如下：

- `qa-lab` 拥有通用场景执行、worker 并发、产物写入和报告。
- 传输适配器拥有 Gateway 网关配置、就绪性、入站和出站观察、传输动作，以及标准化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时表面。

### 添加渠道

向 Markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖该渠道契约的场景包。

当共享 `qa-lab` host 可以拥有该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享 host 机制：

- `openclaw qa` 命令根
- suite 启动和 teardown
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

Runner 插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪性
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和标准化传输状态
- 如何执行传输支持的动作
- 如何处理特定于传输的重置或清理

新渠道的最低采纳标准：

1. 保持 `qa-lab` 作为共享 `qa` 根的 owner。
2. 在共享的 `qa-lab` host seam 上实现传输 runner。
3. 将特定于传输协议的机制保留在 runner 插件或渠道 harness 中。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟 CLI 和 runner 执行应放在单独的入口点之后。
5. 在主题化的 `qa/scenarios/` 目录下编写或改写 Markdown 场景。
6. 对新场景使用通用场景 helper。
7. 除非仓库正在进行有意的迁移，否则保持现有兼容性别名可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中一次性表达，就放在 `qa-lab` 中。
- 如果行为依赖某一个渠道传输协议，就保留在对应的 runner 插件或插件 harness 中。
- 如果某个场景需要一种不止一个渠道能使用的新能力，请添加通用 helper，而不是在 `suite.ts` 中添加特定于渠道的分支。
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

兼容性别名仍可用于现有场景 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但新场景编写应使用通用名称。这些别名的存在是为了避免一次性迁移，而不是未来的模式。

## 报告

`qa-lab` 会根据观测到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍被阻塞
- 哪些后续场景值得添加

要查看可用场景清单 — 在评估后续工作规模或接入新传输协议时很有用 — 运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

对于角色和风格检查，请跨多个实时模型 ref 运行同一个场景，
并编写一份经过评审的 Markdown 报告：

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

该命令运行本地 QA 网关子进程，而不是 Docker。角色评估
场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，
例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每份完整
转录，记录基本运行统计信息，然后让 judge 模型以快速模式并在支持时使用
`xhigh` reasoning，按自然度、风格感和幽默感对运行结果排名。
比较提供商时使用 `--blind-judge-models`：judge prompt 仍会获得
每份转录和运行状态，但候选 ref 会替换为中性
标签，例如 `candidate-01`；报告会在解析后将排名映射回真实 ref。
候选运行默认使用 `high` thinking；GPT-5.5 使用 `medium`，
支持 `xhigh` 的旧版 OpenAI 评估 ref 使用 `xhigh`。使用
`--model provider/model,thinking=<level>` 内联覆盖特定候选项。`--thinking <level>` 仍会设置
全局 fallback，旧的 `--model-thinking <provider/model=level>` 形式
会保留用于兼容。
OpenAI 候选 ref 默认使用快速模式，以便在
提供商支持时使用优先处理。当单个候选项或 judge 需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你想
强制每个候选模型都启用快速模式时，才传入 `--fast`。候选项和 judge 的持续时间会
记录在报告中用于基准分析，但 judge prompt 会明确要求
不要按速度排名。
候选模型和 judge 模型运行都默认并发 16。当提供商限制或本地网关
压力使运行噪声过大时，降低
`--concurrency` 或 `--judge-concurrency`。
未传入候选 `--model` 时，角色评估默认使用
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
- [Dashboard](/zh-CN/web/dashboard)
