---
read_when:
    - 理解 QA 栈如何协同工作
    - 扩展 qa-lab、QA channel 或传输适配器
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高拟真度的 QA 自动化
summary: QA 栈概览：qa-lab、QA channel、仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-04-27T17:44:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c47dc9a430d54c2a701a70efbe098a3ddecef74afe91c4e594f5eea9e57bbb
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈旨在以比单个单元测试更真实、更贴近渠道形态的方式来演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，提供私信、渠道、线程、表情回应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息以及导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：为启动任务和基线 QA 场景提供仓库支持的种子资源。

## 命令界面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多命令也有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| Command                                             | Purpose                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；会写入一份 Markdown 报告。                                                                                                                               |
| `qa suite`                                          | 针对 QA Gateway 网关通道运行仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass` 用于一次性 Linux VM。                                                  |
| `qa coverage`                                       | 打印 Markdown 场景覆盖清单（使用 `--json` 可获得机器可读输出）。                                                                                                       |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件并写入 agentic parity-gate 报告。                                                                                                 |
| `qa character-eval`                                 | 在多个实时模型上运行角色 QA 场景，并生成带评判结果的报告。参见[报告](#reporting)。                                                                                     |
| `qa manual`                                         | 针对所选提供商/模型通道运行一次性提示词。                                                                                                                              |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                           |
| `qa docker-build-image`                             | 构建预烘焙的 QA Docker 镜像。                                                                                                                                          |
| `qa docker-scaffold`                                | 为 QA 仪表板 + Gateway 网关通道写入 docker-compose 脚手架。                                                                                                            |
| `qa up`                                             | 构建 QA 站点，启动基于 Docker 的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                |
| `qa aimock`                                         | 仅启动 AIMock provider 服务器。                                                                                                                                         |
| `qa mock-openai`                                    | 仅启动支持场景感知的 `mock-openai` provider 服务器。                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 凭证池。                                                                                                                                              |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输通道。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                  |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输通道。                                                                                                                             |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输通道。                                                                                                                        |

## 操作流程

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录内容和场景计划。

运行方式如下：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容正常、失败或仍被阻塞。

如果你希望更快地迭代 QA Lab UI，而不必每次都重新构建 Docker 镜像，请使用带有绑定挂载 QA Lab bundle 的方式启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 让 Docker 服务保持在预构建镜像上运行，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重新构建该 bundle，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

若要运行本地 OpenTelemetry trace 冒烟测试，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，启用 `diagnostics-otel` 插件运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans，并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性不得出现在 trace 中。它会在 QA suite 产物旁边写入 `otel-smoke-summary.json`。

可观测性 QA 仅支持源码检出环境。npm tarball 会刻意省略 QA Lab，因此软件包 Docker 发布通道不会运行 `qa` 命令。修改诊断埋点时，请在已构建的源码检出环境中使用 `pnpm qa:otel:smoke`。

若要运行一个真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此通道的完整 CLI 参考、配置文件/场景目录、环境变量和产物布局见 [Matrix QA](/zh-CN/concepts/qa-matrix)。简而言之：它会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定于该传输协议的子 QA Gateway 网关内运行真实 Matrix 插件（不使用 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 产物和组合输出日志。

若要运行一个真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会以一个真实私有 Telegram 群组为目标，而不是配置一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用 Bot-to-Bot Communication Mode 时，机器人到机器人的观察效果最佳。设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` 可以在 observed-message 产物中保留消息正文（默认会脱敏）。
当任一场景失败时，该命令会以非零状态退出。若你希望在不触发失败退出码的情况下保留产物，请使用 `--allow-failures`。
Telegram 报告和摘要包含每条回复的 RTT，计算范围从 driver 消息发送请求到观察到的 SUT 回复，从金丝雀场景开始。

在使用池化的实时凭证前，请执行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量、验证端点设置，并在存在维护者密钥时验证 admin/list 可达性。它只会报告密钥是已设置还是缺失，不会显示具体内容。

若要运行一个真实传输的 Discord 冒烟通道，请执行：

```bash
pnpm openclaw qa discord
```

该通道会以一个真实私有 Discord guild 渠道为目标，并使用两个机器人：一个由 harness 控制的 driver 机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。使用环境变量凭证时，它需要 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 可以在 observed-message 产物中保留消息正文（默认会脱敏）。
该通道会验证渠道提及处理，并检查 SUT 机器人是否已向 Discord 注册原生 `/help` 命令。
当任一场景失败时，该命令会以非零状态退出。若你希望在不触发失败退出码的情况下保留产物，请使用 `--allow-failures`。

## 实时传输覆盖范围

实时传输通道共享同一套契约，而不是各自发明自己的场景列表结构。`qa-channel` 是覆盖面更广的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

这样可以让 `qa-channel` 保持为覆盖面广泛的产品行为套件，同时让 Matrix、Telegram 和未来的实时传输协议共享一份明确的传输契约检查清单。

若要在不将 Docker 引入 QA 路径的情况下运行一次性 Linux VM 通道，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它复用了与宿主机上 `qa suite` 相同的场景选择行为。
默认情况下，宿主机和 Multipass suite 运行都会并行执行多个已选场景，并使用隔离的 Gateway 网关工作进程。`qa-channel` 默认并发度为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整工作进程数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。若你希望在不触发失败退出码的情况下保留产物，请使用 `--allow-failures`。
实时运行会转发适合 guest 使用的受支持 QA 认证输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区回写结果。

## 仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容被有意保存在 git 中，这样人类和智能体都能看到 QA 计划。

`qa-lab` 应保持为通用 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并且应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件需求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时界面可以继续保持通用和跨领域。例如，Markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具组合起来，通过 Gateway 网关 `browser.request` 接口驱动嵌入式 Control UI，而无需新增一个特殊用途的运行器。

场景文件应按产品能力分组，而不是按源码树目录分组。文件移动时请保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来追踪实现对应关系。

基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- Memory Wiki 召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 通道

`qa suite` 有两个本地提供商 mock 通道：

- `mock-openai` 是支持场景感知的 OpenClaw mock。它仍然是仓库支持的 QA 和 parity gate 的默认确定性 mock 通道。
- `aimock` 会启动一个基于 AIMock 的 provider 服务器，用于实验性协议、夹具、录制/回放和混沌覆盖。它是补充性的，不会替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商负责自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求以及实时/mock 能力标记。共享的 suite 和 Gateway 网关代码应通过 provider 注册表进行路由，而不是根据 provider 名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景提供了一个通用传输接口。`qa-channel` 是该接口上的第一个适配器，但设计目标更广：未来真实或合成的渠道都应接入同一个 suite 运行器，而不是新增一个特定于传输的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、产物写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪性、入站和出站观测、传输操作以及标准化传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时界面。

### 添加一个渠道

将一个渠道添加到 Markdown QA 系统中只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于演练该渠道契约的场景包。

当共享的 `qa-lab` 主机可以承载流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- suite 启动和拆除
- 工作进程并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根命令之下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪性
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录内容和标准化传输状态
- 如何执行由传输支持的操作
- 如何处理特定于传输的重置或清理

新渠道的最低接入门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` 主机接口上实现传输运行器。
3. 将特定于传输的机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应继续放在单独的入口点之后。
5. 在按主题划分的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖单一渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一个可供多个渠道使用的新能力，应添加一个通用辅助工具，而不是在 `suite.ts` 中加入特定于渠道的分支。
- 如果某个行为仅对一种传输有意义，就让该场景保持传输专用，并在场景契约中明确说明。

### 场景辅助工具名称

新场景推荐使用的通用辅助工具：

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

现有场景仍可使用兼容别名——`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`——但新场景编写应使用这些通用名称。这些别名的存在是为了避免一次性迁移日，而不是未来的模式。

## 报告

`qa-lab` 会基于观察到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些内容正常工作
- 哪些内容失败了
- 哪些内容仍然受阻
- 值得补充哪些后续场景

若要查看可用场景清单——这在评估后续工作规模或接入新传输时很有用——请运行 `pnpm openclaw qa coverage`（加上 `--json` 可获得机器可读输出）。

对于角色和风格检查，可在多个实时模型引用上运行同一场景，并写入带评判结果的 Markdown 报告：

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

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每份完整转录、记录基本运行统计，然后请求评审模型在快速模式下、在支持时使用 `xhigh` 推理，按自然度、氛围和幽默感对各次运行进行排序。
在比较不同提供商时，请使用 `--blind-judge-models`：评判提示词仍会获取每份转录和运行状态，但候选引用会被替换为诸如 `candidate-01` 之类的中性标签；报告会在解析后再将排名映射回真实引用。
候选运行默认使用 `high` thinking；GPT-5.5 使用 `medium`，支持的较旧 OpenAI 评估引用则使用 `xhigh`。可以使用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍可设置全局后备值，较旧的 `--model-thinking <provider/model=level>` 形式也会为兼容性保留。
OpenAI 候选引用默认启用快速模式，以便在提供商支持时使用优先处理。若单个候选或评审需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想为每个候选模型都强制启用快速模式时，才传入 `--fast`。报告中会记录候选和评审的耗时，以供基准分析，但评审提示词会明确说明不要按速度进行排名。
候选和评审模型运行的默认并发度都是 16。当提供商限制或本地 Gateway 网关压力导致运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。
当未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
当未传入 `--judge-model` 时，评审默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA Channel](/zh-CN/channels/qa-channel)
- [Testing](/zh-CN/help/testing)
- [Dashboard](/zh-CN/web/dashboard)
