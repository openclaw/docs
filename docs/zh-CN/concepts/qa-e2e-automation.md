---
read_when:
    - 了解 QA 栈如何协同工作
    - 扩展 qa-lab、QA channel 或传输适配器
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: QA 栈概览：qa-lab、QA channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-04-27T17:53:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59d5f32e674cd32a08094b475ba72a70233437d2f8be26a53205628d9770fd6d
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈旨在以比单个单元测试更贴近真实、更加符合渠道形态的方式来演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，提供私信、渠道、线程、反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息以及导出 Markdown 报告。
- `extensions/qa-matrix`、未来的 runner 插件：实时传输适配器，在子 QA Gateway 网关中驱动真实渠道。
- `qa/`：为启动任务和基线 QA 场景提供仓库支持的种子资源。

## 命令界面

所有 QA 流程都运行在 `pnpm openclaw qa <subcommand>` 下。许多流程也提供 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令 | 用途 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run` | 内置 QA 自检；会写入一份 Markdown 报告。 |
| `qa suite` | 针对 QA Gateway 网关通道运行仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass` 用于一次性 Linux VM。 |
| `qa coverage` | 打印 Markdown 场景覆盖率清单（使用 `--json` 可输出机器可读结果）。 |
| `qa parity-report` | 比较两个 `qa-suite-summary.json` 文件，并写入 agentic parity-gate 报告。 |
| `qa character-eval` | 在多个实时模型上运行 character QA 场景，并生成带评判结果的报告。参见[报告](#reporting)。 |
| `qa manual` | 针对所选提供商 / 模型通道运行一次性提示词。 |
| `qa ui` | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。 |
| `qa docker-build-image` | 构建预烘焙的 QA Docker 镜像。 |
| `qa docker-scaffold` | 为 QA 仪表板 + Gateway 网关通道写入 docker-compose 脚手架。 |
| `qa up` | 构建 QA 站点、启动基于 Docker 的栈并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。 |
| `qa aimock` | 仅启动 AIMock 提供商服务器。 |
| `qa mock-openai` | 仅启动支持场景感知的 `mock-openai` 提供商服务器。 |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 凭证池。 |
| `qa matrix` | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。 |
| `qa telegram` | 针对真实私有 Telegram 群组的实时传输通道。 |
| `qa discord` | 针对真实私有 Discord guild 渠道的实时传输通道。 |

## 操作流程

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录内容和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并公开 QA Lab 页面，供操作员或自动化循环向智能体下达 QA 任务、观察真实渠道行为，并记录哪些内容成功、失败或仍然受阻。

如果你想更快地迭代 QA Lab UI，而不是每次都重新构建 Docker 镜像，可使用带绑定挂载 QA Lab bundle 的方式启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

若要运行本地 OpenTelemetry trace 冒烟检查，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans，并断言发布关键的结构是否存在：必须包含 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；模型调用在成功轮次中不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性不得出现在 trace 中。它会在 QA suite 工件旁边写入 `otel-smoke-summary.json`。

可观测性 QA 仍仅限源码检出环境。npm tarball 会有意省略 QA Lab，因此软件包 Docker 发布通道不会运行 `qa` 命令。修改诊断埋点时，请从已构建的源码检出目录中使用 `pnpm qa:otel:smoke`。

若要运行一个真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此通道的完整 CLI 参考、配置文件 / 场景目录、环境变量和工件布局见 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要来说：它会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver / SUT / observer 用户，在限定于该传输的子 QA Gateway 网关中运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 工件以及组合输出日志。

对于真实传输的 Telegram 和 Discord 冒烟通道：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

两者都面向一个预先存在的真实渠道，并使用两个机器人（driver + SUT）。所需环境变量、场景列表、输出工件以及 Convex 凭证池，记录在下方的[Telegram 和 Discord QA 参考](#telegram-and-discord-qa-reference)中。

在使用池化的实时凭证之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量、验证端点设置，并在存在维护者密钥时校验 admin / list 可达性。对于密钥，它只会报告“已设置 / 缺失”状态。

## 实时传输覆盖范围

实时传输通道共享同一份契约，而不是让每个通道各自设计自己的场景列表结构。`qa-channel` 是覆盖面广泛的合成产品行为 suite，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix | x | x | x | x | x | x | x | x |  |  |
| Telegram | x | x |  |  |  |  |  |  | x |  |
| Discord | x | x |  |  |  |  |  |  |  | x |

这使 `qa-channel` 保持为覆盖面广泛的产品行为 suite，同时让 Matrix、Telegram 和未来的实时传输共享同一份明确的传输契约检查清单。

若要在不将 Docker 引入 QA 路径的情况下运行一次性 Linux VM 通道，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...` 中。  
它复用了与主机上 `qa suite` 相同的场景选择行为。  
默认情况下，主机和 Multipass 的 suite 运行都会并行执行多个选定场景，并使用隔离的 Gateway 网关 worker。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调节 worker 数量，或使用 `--concurrency 1` 进行串行执行。  
当任一场景失败时，该命令会以非零状态退出。如果你希望保留工件但不以失败退出码结束，可使用 `--allow-failures`。  
实时运行会转发对 guest 来说可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区写回结果。

## Telegram 和 Discord QA 参考

由于 Matrix 拥有更多场景数量，并且需要基于 Docker 的 homeserver 配置，因此它有一个[专门页面](/zh-CN/concepts/qa-matrix)。Telegram 和 Discord 则更小——每个只有少量场景、没有配置文件系统、面向预先存在的真实渠道——因此它们的参考内容放在这里。

### 共享 CLI 标志

两个通道都通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同的标志：

| 标志 | 默认值 | 描述 |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>` | — | 仅运行此场景。可重复使用。 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 报告 / 摘要 / 观测消息以及输出日志的写入位置。相对路径会基于 `--repo-root` 解析。 |
| `--repo-root <path>` | `process.cwd()` | 当你从中立 cwd 调用时使用的仓库根目录。 |
| `--sut-account <id>` | `sut` | QA Gateway 网关配置中的临时账户 id。 |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍然可用）。 |
| `--model <ref>` / `--alt-model <ref>` | provider 默认值 | 主 / 备用模型引用。 |
| `--fast` | 关闭 | 在支持时启用提供商快速模式。 |
| `--credential-source <env\|convex>` | `env` | 参见 [Convex 凭证池](#convex-credential-pool)。 |
| `--credential-role <maintainer\|ci>` | 在 CI 中为 `ci`，否则为 `maintainer` | 当使用 `--credential-source convex` 时所用的角色。 |

两者在任一场景失败时都会以非零状态退出。`--allow-failures` 会写入工件，但不会设置失败的退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中有两个不同的机器人（driver + SUT）。SUT 机器人必须具有 Telegram 用户名；当两个机器人都在 `@BotFather` 中启用了 **Bot-to-Bot Communication Mode** 时，机器人之间的观测效果最佳。

当使用 `--credential-source env` 时，必需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` —— 数字 chat id（字符串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

可选：

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 会在观测消息工件中保留消息正文（默认会脱敏）。

场景（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

输出工件：

- `telegram-qa-report.md`
- `telegram-qa-summary.json` —— 包含每次回复的 RTT（driver 发送 → 观测到的 SUT 回复），从 canary 开始统计。
- `telegram-qa-observed-messages.json` —— 除非设置了 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被脱敏。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord guild 渠道，其中包含两个机器人：一个由 harness 控制的 driver 机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。它会验证渠道 mention 处理，并验证 SUT 机器人已向 Discord 注册原生 `/help` 命令。

当使用 `--credential-source env` 时，必需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` —— 必须与 Discord 返回的 SUT 机器人用户 id 一致（否则该通道会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观测消息工件中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

输出工件：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` —— 除非设置了 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被脱敏。

### Convex 凭证池

Telegram 和 Discord 通道都可以从共享的 Convex 池中租用凭证，而不是读取上述环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间持续发送心跳，并在关闭时释放租约。池类型为 `"telegram"` 和 `"discord"`。

broker 在 `admin/add` 上验证的负载结构：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` —— `groupId` 必须是数字 chat-id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

操作环境变量和 Convex broker 端点契约见[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；两种类型的 broker 语义完全一致）。

## 仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容特意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为一个通用的 Markdown runner。每个场景 Markdown 文件都是一次测试运行的事实来源，应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时界面可以保持通用和横切。例如，Markdown 场景可以把传输侧辅助函数与浏览器侧辅助函数结合起来，通过 Gateway 网关 `browser.request` 接口驱动嵌入式 Control UI，而无需添加一个特殊用途的 runner。

场景文件应按产品能力分组，而不是按源码树文件夹分组。文件移动时保持场景 id 稳定；使用 `docsRefs` 和 `codeRefs` 来实现实现层面的可追踪性。

基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 具有两个本地提供商 mock 通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw mock。它仍然是仓库支持 QA 和 parity gate 的默认确定性 mock 通道。
- `aimock` 会启动一个基于 AIMock 的提供商服务器，用于实验性协议、fixture、录制 / 回放和混沌覆盖。它是增量补充，不替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商负责其默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求，以及实时 / mock 能力标记。共享的 suite 和 Gateway 网关代码应通过提供商注册表进行路由，而不是按提供商名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景提供了一个通用传输接口。`qa-channel` 是该接口上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个 suite runner，而不是添加一个传输专用 QA runner。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、worker 并发、工件写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪检查、入站和出站观测、传输动作以及标准化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时界面。

### 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的一个传输适配器。
2. 一组用于演练该渠道契约的场景包。

当共享的 `qa-lab` host 能承载流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享的 host 机制：

- `openclaw qa` 命令根
- suite 启动和拆除
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

Runner 插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何公开转录内容和标准化传输状态
- 如何执行由传输支持的动作
- 如何处理传输专属的重置或清理

新渠道的最低采纳门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` host 接口上实现该传输 runner。
3. 将传输专属机制保留在 runner 插件或渠道 harness 内部。
4. 将 runner 挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。Runner 插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和 runner 执行应放在单独的入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或调整 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则是严格的：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放在 `qa-lab` 中。
- 如果某个行为依赖某一个渠道传输，就把它保留在对应的 runner 插件或插件 harness 中。
- 如果某个场景需要一个多个渠道都能使用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中添加渠道专属分支。
- 如果某个行为只对某一种传输有意义，就让该场景保持传输专属，并在场景契约中明确说明。

### 场景辅助函数名称

新场景优先使用的通用辅助函数：

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

现有场景仍可使用兼容别名——`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`——但新的场景编写应使用通用名称。这些别名的存在是为了避免一次性强制迁移，而不是未来的模型。

## 报告

`qa-lab` 会基于观测到的总线时间线导出一份 Markdown 协议报告。  
该报告应回答：

- 哪些内容成功了
- 哪些内容失败了
- 哪些内容仍然受阻
- 值得添加哪些后续场景

如需查看可用场景清单——这在评估后续工作规模或接入新传输时很有用——请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

对于 character 和风格检查，可在多个实时模型引用上运行同一个场景，并写出一份带评判结果的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。character eval 场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每份完整转录内容、记录基本运行统计信息，然后要求 judge 模型在支持时使用快速模式和 `xhigh` 推理，按自然度、氛围和幽默感对这些运行结果进行排序。

在比较不同提供商时，请使用 `--blind-judge-models`：judge 提示词仍会获取每份转录内容和运行状态，但候选引用会被替换为诸如 `candidate-01` 之类的中性标签；报告会在解析后将排序结果映射回真实引用。

候选运行默认使用 `high` thinking；GPT-5.5 使用 `medium`，而支持该设置的旧版 OpenAI eval 引用则使用 `xhigh`。你可以通过 `--model provider/model,thinking=<level>` 为特定候选项内联覆盖。`--thinking <level>` 仍可设置全局回退值，而较旧的 `--model-thinking <provider/model=level>` 形式则保留用于兼容性。

OpenAI 候选引用默认启用快速模式，以便在提供商支持时使用优先处理。若单个候选项或 judge 需要覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有在你希望为每个候选模型都强制启用快速模式时，才传入 `--fast`。报告中会记录候选项和 judge 的持续时间，用于基准分析，但 judge 提示词会明确说明不要按速度排序。

候选项和 judge 模型运行默认都使用 16 的并发度。当提供商限制或本地 Gateway 网关压力使运行过于嘈杂时，请降低 `--concurrency` 或 `--judge-concurrency`。

当未传入候选 `--model` 时，character eval 默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。

当未传入 `--judge-model` 时，judge 默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
