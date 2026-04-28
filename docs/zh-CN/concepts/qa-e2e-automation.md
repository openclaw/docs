---
read_when:
    - 了解 QA 堆栈如何协同工作
    - 扩展 qa-lab、qa-channel 或传输适配器
    - 添加基于仓库的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: QA 栈概览：qa-lab、qa-channel、由仓库支持的场景、实时传输通道、传输适配器和报告。
title: QA overview
x-i18n:
    generated_at: "2026-04-28T11:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

这个私有 QA 栈旨在以比单个单元测试更真实、更接近渠道形态的方式测试 OpenClaw。

当前组件：

- `extensions/qa-channel`：模拟消息渠道，包含私信、渠道、线程、回应、编辑和删除表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察文字记录、注入入站消息并导出 Markdown 报告。
- `extensions/qa-matrix`、未来的运行器插件：实时传输适配器，在子 QA Gateway 网关内驱动真实渠道。
- `qa/`：由仓库支持的启动任务和基线 QA 场景种子资产。

## 命令表面

每个 QA 流程都在 `pnpm openclaw qa <subcommand>` 下运行。许多命令有 `pnpm qa:*` 脚本别名；两种形式都受支持。

| 命令                                                | 用途                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 内置 QA 自检；写入 Markdown 报告。                                                                                                                                        |
| `qa suite`                                          | 针对 QA Gateway 网关线路运行由仓库支持的场景。别名：`pnpm openclaw qa suite --runner multipass`，用于一次性 Linux VM。                                                     |
| `qa coverage`                                       | 打印 markdown 场景覆盖清单（`--json` 用于机器输出）。                                                                                                                     |
| `qa parity-report`                                  | 比较两个 `qa-suite-summary.json` 文件，并写入智能体式一致性门禁报告。                                                                                                      |
| `qa character-eval`                                 | 跨多个实时模型运行角色 QA 场景，并生成带评判的报告。参见[报告](#reporting)。                                                                                              |
| `qa manual`                                         | 针对所选提供商/模型线路运行一次性 prompt。                                                                                                                                |
| `qa ui`                                             | 启动 QA 调试器 UI 和本地 QA 总线（别名：`pnpm qa:lab:ui`）。                                                                                                               |
| `qa docker-build-image`                             | 构建预烘焙的 QA Docker 镜像。                                                                                                                                             |
| `qa docker-scaffold`                                | 为 QA 仪表板 + Gateway 网关线路写入 docker-compose 脚手架。                                                                                                                |
| `qa up`                                             | 构建 QA 站点，启动由 Docker 支持的栈，并打印 URL（别名：`pnpm qa:lab:up`；`:fast` 变体会添加 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                    |
| `qa aimock`                                         | 仅启动 AIMock provider 服务器。                                                                                                                                           |
| `qa mock-openai`                                    | 仅启动具备场景感知能力的 `mock-openai` provider 服务器。                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享 Convex 凭据池。                                                                                                                                                  |
| `qa matrix`                                         | 针对一次性 Tuwunel homeserver 的实时传输线路。参见 [Matrix QA](/zh-CN/concepts/qa-matrix)。                                                                                      |
| `qa telegram`                                       | 针对真实私有 Telegram 群组的实时传输线路。                                                                                                                                |
| `qa discord`                                        | 针对真实私有 Discord guild 渠道的实时传输线路。                                                                                                                           |

## 操作员流程

当前 QA 操作员流程是一个双栏 QA 站点：

- 左侧：带智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的文字记录和场景计划。

运行方式：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关线路，并公开 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍被阻塞。

为了更快迭代 QA Lab UI，而不必每次都重建 Docker 镜像，可以用 bind-mounted QA Lab bundle 启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务使用预构建镜像，并将 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资产哈希变化时浏览器会自动重新加载。

对于本地 OpenTelemetry trace 冒烟测试，请运行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动本地 OTLP/HTTP trace 接收器，启用 `diagnostics-otel` 插件运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf spans 并断言发布关键形态：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功回合中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性必须留在 trace 之外。它会在 QA suite 产物旁写入 `otel-smoke-summary.json`。

可观测性 QA 仅适用于源码检出。npm tarball 会有意省略 QA Lab，因此 package Docker 发布线路不会运行 `qa` 命令。更改诊断插桩时，请从已构建的源码检出运行 `pnpm qa:otel:smoke`。

对于使用真实传输的 Matrix 冒烟测试线路，请运行：

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

此线路的完整 CLI 参考、profile/场景目录、环境变量和产物布局位于 [Matrix QA](/zh-CN/concepts/qa-matrix)。简要来说：它会在 Docker 中配置一次性 Tuwunel homeserver，注册临时 driver/SUT/observer 用户，在限定到该传输的子 QA Gateway 网关中运行真实 Matrix 插件（无 `qa-channel`），然后在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下写入 Markdown 报告、JSON 摘要、observed-events 产物和合并输出日志。

对于使用真实传输的 Telegram 和 Discord 冒烟测试线路：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

两者都面向带两个 bot（driver + SUT）的预先存在真实渠道。所需环境变量、场景列表、输出产物和 Convex 凭据池记录在下方的 [Telegram 和 Discord QA 参考](#telegram-and-discord-qa-reference)中。

使用池化实时凭据前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境、验证 endpoint 设置，并在维护者密钥存在时验证 admin/list 可达性。它只报告密钥的已设置/缺失状态。

## 实时传输覆盖范围

实时传输线路共享一个契约，而不是各自发明自己的场景列表形态。`qa-channel` 是广泛的模拟产品行为 suite，不属于实时传输覆盖矩阵。

| 线路     | 金丝雀 | 提及门控 | Bot 到 bot | 允许列表阻止 | 顶层回复 | 重启恢复 | 线程后续回复 | 线程隔离 | 回应观察 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------- | ---------- | ------------ | -------- | -------- | ------------ | -------- | -------- | -------- | ------------ |
| Matrix   | x      | x        | x          | x            | x        | x        | x            | x        | x        |          |              |
| Telegram | x      | x        | x          |              |          |          |              |          |          | x        |              |
| Discord  | x      | x        | x          |              |          |          |              |          |          |          | x            |

这会将 `qa-channel` 保持为广泛的产品行为 suite，同时让 Matrix、Telegram 和未来的实时传输共享一个明确的传输契约检查清单。

对于不把 Docker 带入 QA 路径的一次性 Linux VM 线路，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass suite 运行默认会使用隔离的 Gateway 网关 worker 并行执行多个所选场景。`qa-channel` 默认并发数为 4，并受所选场景数限制。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 串行执行。
当任何场景失败时，该命令会以非零状态退出。当你想要产物但不想让退出码失败时，请使用 `--allow-failures`。
实时运行会转发对 guest 来说可行的受支持 QA 认证输入：基于环境的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，这样 guest 才能通过挂载的工作区写回。

## Telegram 和 Discord QA 参考

Matrix 有一个[专用页面](/zh-CN/concepts/qa-matrix)，因为它的场景数量和由 Docker 支持的 homeserver 配置更多。Telegram 和 Discord 更小，每个只有少量场景、没有 profile 系统，并且针对预先存在的真实渠道，因此它们的参考放在这里。

### 共享 CLI 标志

两条线路都通过 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 注册，并接受相同标志：

| 标志                                  | 默认值                                                    | 描述                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | 仅运行此场景。可重复指定。                                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | 写入报告、摘要、观测消息和输出日志的位置。相对路径会基于 `--repo-root` 解析。                                        |
| `--repo-root <path>`                  | `process.cwd()`                                           | 从中立 cwd 调用时的仓库根目录。                                                                                       |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 网关配置中的临时账户 id。                                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` 或 `live-frontier`（旧版 `live-openai` 仍可使用）。                                                     |
| `--model <ref>` / `--alt-model <ref>` | 提供商默认值                                              | 主模型/备用模型引用。                                                                                                 |
| `--fast`                              | 关闭                                                      | 提供商支持时启用快速模式。                                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                     | 请参阅 [Convex 凭证池](#convex-credential-pool)。                                                                     |
| `--credential-role <maintainer\|ci>`  | CI 中为 `ci`，否则为 `maintainer`                         | 使用 `--credential-source convex` 时采用的角色。                                                                      |

任何场景失败时，两者都会以非零状态退出。`--allow-failures` 会写入工件，但不会设置失败退出码。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目标是一个真实的私有 Telegram 群组，其中包含两个不同的机器人（驱动端 + SUT）。SUT 机器人必须有 Telegram 用户名；当两个机器人都在 `@BotFather` 中启用**机器人到机器人通信模式**时，机器人到机器人观测效果最佳。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数字聊天 id（字符串）。
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
- `telegram-qa-summary.json` — 包含从 canary 开始的逐回复 RTT（驱动端发送 → 观测到 SUT 回复）。
- `telegram-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`，否则正文会被脱敏。

### Discord QA

```bash
pnpm openclaw qa discord
```

目标是一个真实的私有 Discord 服务器频道，其中包含两个机器人：一个由 harness 控制的驱动机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。验证频道提及处理，并验证 SUT 机器人已向 Discord 注册原生 `/help` 命令。

使用 `--credential-source env` 时所需的环境变量：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — 必须与 Discord 返回的 SUT 机器人用户 id 匹配（否则该 lane 会快速失败）。

可选：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 会在观测消息工件中保留消息正文。

场景（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

输出工件：

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — 除非设置 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否则正文会被脱敏。

### Convex 凭证池

Telegram 和 Discord 两条 lane 都可以从共享 Convex 池租用凭证，而不是读取上述环境变量。传入 `--credential-source convex`（或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 会获取独占租约，在运行期间发送心跳，并在关闭时释放租约。池类型为 `"telegram"` 和 `"discord"`。

broker 在 `admin/add` 上验证的载荷形状：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` — `groupId` 必须是数字聊天 id 字符串。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

运维环境变量和 Convex broker 端点契约位于[测试 → 通过 Convex 共享 Telegram 凭证](/zh-CN/help/testing#shared-telegram-credentials-via-convex-v1)（该章节名称早于 Discord 支持；两种类型的 broker 语义相同）。

## 仓库支持的种子

种子资产位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意放在 git 中，因此 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为通用 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、lane 和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支持 `qa-flow` 的可复用运行时表面可以保持通用且横切。例如，Markdown 场景可以组合传输侧辅助函数和浏览器侧辅助函数，通过 Gateway 网关 `browser.request` seam 驱动嵌入式 Control UI，而不需要添加特殊情况运行器。

场景文件应按产品能力分组，而不是按源码树文件夹分组。文件移动时保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 实现实现可追溯性。

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

## 提供商模拟 lane

`qa suite` 有两个本地提供商模拟 lane：

- `mock-openai` 是具备场景感知能力的 OpenClaw 模拟。它仍然是仓库支持 QA 和一致性门禁的默认确定性模拟 lane。
- `aimock` 会启动一个由 AIMock 支持的提供商服务器，用于实验性协议、fixture、录制/回放和混沌覆盖。它是增量功能，不会取代 `mock-openai` 场景分发器。

提供商 lane 实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求，以及 live/mock 能力标志。共享 suite 和 Gateway 网关代码应通过提供商注册表路由，而不是基于提供商名称分支。

## 传输适配器

`qa-lab` 为 Markdown QA 场景拥有一个通用传输 seam。`qa-channel` 是该 seam 上的第一个适配器，但设计目标更广：未来真实或合成的渠道应接入同一个 suite 运行器，而不是添加特定传输的 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 负责通用场景执行、worker 并发、工件写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪状态、入站和出站观测、传输操作以及规范化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些文件的可复用运行时表面。

### 添加渠道

向 Markdown QA 系统添加渠道只需要两件事：

1. 该渠道的传输适配器。
2. 覆盖该渠道契约的场景包。

当共享 `qa-lab` 宿主可以拥有该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 拥有共享宿主机制：

- `openclaw qa` 命令根
- suite 启动和拆除
- worker 并发
- 工件写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

运行器插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根之下
- Gateway 网关如何为该传输配置
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露 transcript 和规范化传输状态
- 如何执行传输支持的操作
- 如何处理特定传输的重置或清理

新渠道的最低采用门槛：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享 `qa-lab` 宿主 seam 上实现传输运行器。
3. 将特定传输机制保留在运行器插件或渠道 harness 内。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册竞争性的根命令。运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应留在单独入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或调整 Markdown 场景。
6. 对新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名可用。

决策规则很严格：

- 如果行为可以在 `qa-lab` 中表达一次，就放在 `qa-lab` 中。
- 如果行为依赖某个渠道传输，就保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，就添加通用辅助函数，而不是在 `suite.ts` 中添加特定渠道分支。
- 如果某个行为只对一种传输有意义，就保持场景特定于传输，并在场景契约中明确说明。

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

兼容别名仍可用于现有场景 — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — 但新场景编写应使用通用名称。这些别名用于避免一次性迁移，而不是未来采用的模型。

## 报告

`qa-lab` 会从观测到的总线时间线导出 Markdown 协议报告。
报告应回答：

- 哪些工作正常
- 哪些失败了
- 哪些仍然被阻塞
- 哪些后续场景值得添加

如需查看可用场景清单（在评估后续工作量或接入新传输协议时很有用），请运行 `pnpm openclaw qa coverage`（添加 `--json` 可获得机器可读输出）。

如需进行角色与风格检查，请在多个实时模型 ref 上运行同一个场景，并写出经过评判的 Markdown 报告：

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

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小文件任务。不应告知候选模型它正在接受评估。该命令会保留每份完整转录，记录基本运行统计信息，然后在支持的情况下以 fast 模式和 `xhigh` 推理请求评判模型按自然度、气质和幽默感对运行结果排序。比较提供商时使用 `--blind-judge-models`：评判提示仍会获得每份转录和运行状态，但候选 ref 会被替换为中性标签，例如 `candidate-01`；报告会在解析后将排名映射回真实 ref。
候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持的较旧 OpenAI 评估 ref 使用 `xhigh`。可用 `--model provider/model,thinking=<level>` 内联覆盖特定候选。`--thinking <level>` 仍会设置全局 fallback，较旧的 `--model-thinking <provider/model=level>` 形式会为兼容性保留。
OpenAI 候选 ref 默认使用 fast 模式，以便在提供商支持时使用优先处理。当某个候选或评判需要覆盖时，内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想强制每个候选模型都开启 fast 模式时，才传入 `--fast`。候选和评判耗时会记录在报告中用于基准分析，但评判提示会明确说明不要按速度排名。
候选和评判模型运行都默认使用并发数 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，降低 `--concurrency` 或 `--judge-concurrency`。
未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
未传入 `--judge-model` 时，评判默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [Matrix QA](/zh-CN/concepts/qa-matrix)
- [QA Channel](/zh-CN/channels/qa-channel)
- [测试](/zh-CN/help/testing)
- [仪表板](/zh-CN/web/dashboard)
