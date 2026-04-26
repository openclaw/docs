---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: qa-lab、qa-channel、预置场景和协议报告的私有 QA 自动化形态
title: QA E2E 自动化
x-i18n:
    generated_at: "2026-04-26T23:47:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 654d8333149d98a85373652ce483ab29f3e524df298493d2d3101564f3e01799
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈的目标是以比单个单元测试更贴近真实、更加符合渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具备私信、渠道、线程、表情反应、编辑和删除等交互表面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息以及导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基线 QA 场景。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点、启动基于 Docker 的 gateway 通道，并暴露 QA Lab 页面，操作人员或自动化循环可以在其中为智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容成功、失败或仍然受阻。

如果你想更快地迭代 QA Lab UI，而不需要每次都重新构建 Docker 镜像，请使用绑定挂载的 QA Lab bundle 启动整套环境：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在发生更改时重建该 bundle，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

如需运行本地 OpenTelemetry 跟踪冒烟测试，请执行：

```bash
pnpm qa:otel:smoke
```

该脚本会启动一个本地 OTLP/HTTP 跟踪接收器，在启用 `diagnostics-otel` 插件的情况下运行 `otel-trace-smoke` QA 场景，然后解码导出的 protobuf span，并断言发布关键的结构：必须存在 `openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、`openclaw.context.assembled` 和 `openclaw.message.delivery`；成功轮次中的模型调用不得导出 `StreamAbandoned`；原始诊断 ID 和 `openclaw.content.*` 属性不得出现在跟踪中。它会在 QA 套件产物旁写入 `otel-smoke-summary.json`。

常规的 Docker 聚合运行也会执行一个可观测性通道。它会构建或复用一个基于源码的 Docker 可观测性镜像，在容器内运行 OTEL 跟踪冒烟测试，然后在启用 `diagnostics-prometheus` 插件的情况下运行 `docker-prometheus-smoke` QA 场景。设置 `OPENCLAW_DOCKER_OBSERVABILITY_LOOPS=<count>` 可在一次 Docker 运行中重复执行这两项检查，并将每轮产物保存在 `.artifacts/docker-observability/...` 下。

如需运行基于真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中部署一个一次性的 Tuwunel homeserver，注册临时的驱动器、SUT 和观察者用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix 插件。实时传输通道会将子配置限定在被测传输范围内，因此 Matrix 会在子配置中不包含 `qa-channel` 的情况下运行。它会将结构化报告产物和合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。如需同时捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库内本地日志文件。默认会打印 Matrix 进度。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 用于限制整个运行时长，`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 用于限制清理时长，以便在 Docker 拆除卡住时报告准确的恢复命令，而不是一直挂起。

如需运行基于真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会针对一个真实的私有 Telegram 群组，而不是部署一次性服务器。它要求设置 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具备 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人之间的观察效果最佳。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不让退出码失败，请使用 `--allow-failures`。
Telegram 报告和摘要中包含每条回复的 RTT，计算范围从驱动器消息发送请求到观察到的 SUT 回复，并从金丝雀检查开始。

在使用共享的实时凭证之前，请执行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量、验证端点设置，并在存在维护者密钥时验证 admin/list 可达性。对于密钥，它只会报告“已设置/缺失”状态。

如需运行基于真实传输的 Discord 冒烟通道，请执行：

```bash
pnpm openclaw qa discord
```

该通道会针对一个真实的私有 Discord guild 渠道，并使用两个机器人：一个由 harness 控制的驱动器机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。使用环境变量凭证时，它要求设置 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该通道会验证渠道提及处理，并检查 SUT 机器人是否已向 Discord 注册原生 `/help` 命令。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不让退出码失败，请使用 `--allow-failures`。

实时传输通道现在共享同一个更小的契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是广覆盖的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | 金丝雀 | 提及门控 | 允许名单拦截 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 表情反应观察 | 帮助命令 | 原生命令注册 |
| ---- | ------ | -------- | ------------ | -------- | -------- | -------- | -------- | ------------ | -------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

这样可以让 `qa-channel` 保持为广覆盖的产品行为套件，同时让 Matrix、Telegram 以及未来的实时传输共享一份明确的传输契约检查清单。

如需运行一个一次性的 Linux VM 通道，而不将 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 来宾系统、安装依赖项、在来宾系统中构建 OpenClaw、运行 `qa suite`，然后将标准 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它复用了与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 套件运行默认都会使用隔离的 gateway worker 并行执行多个选中的场景。`qa-channel` 默认并发度为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可以调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不让退出码失败，请使用 `--allow-failures`。
实时运行会转发那些对来宾系统可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便来宾系统能够通过挂载的工作区写回结果。

## 由仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些文件有意保存在 git 中，以便人类和智能体都能看到 QA 计划。

`qa-lab` 应保持为一个通用的 markdown 运行器。每个场景 markdown 文件都是一次测试运行的事实来源，并且应定义：

- 场景元数据
- 可选的类别、能力、通道和风险元数据
- 文档和代码引用
- 可选的插件需求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用和跨领域。例如，markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具组合起来，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而不需要添加专用的特殊运行器。

场景文件应按产品能力分组，而不是按源码树文件夹分组。文件移动时请保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 提供实现可追踪性。

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

- `mock-openai` 是具备场景感知能力的 OpenClaw mock。它仍然是由仓库支持的 QA 和一致性门控的默认确定性 mock 通道。
- `aimock` 会启动一个由 AIMock 支持的提供商服务器，用于实验性的协议、夹具、录制/回放和混沌覆盖。它是附加能力，并不替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。
每个提供商负责其自身的默认值、本地服务器启动、gateway 模型配置、auth-profile 暂存需求，以及实时/mock 能力标志。共享套件和 gateway 代码应通过提供商注册表进行路由，而不是根据提供商名称分支。

## 传输适配器

`qa-lab` 拥有一个用于 markdown QA 场景的通用传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个套件运行器，而不是新增一个传输专用的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、worker 并发、产物写入和报告。
- 传输适配器负责 gateway 配置、就绪状态、入站和出站观察、传输动作以及标准化传输状态。
- `qa/scenarios/` 下的 markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时表面。

面向维护者的新渠道适配器采用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些内容成功了
- 哪些内容失败了
- 哪些内容仍然受阻
- 值得添加哪些后续场景

如需进行角色和风格检查，请在多个实时模型引用上运行同一场景，并写入一份经过评判的 Markdown 报告：

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

该命令运行的是本地 QA gateway 子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每份完整对话记录、记录基本运行统计信息，然后在支持的情况下使用启用快速模式且带有 `xhigh` 推理的评审模型，按自然度、氛围和幽默感对这些运行结果进行排序。

在比较不同提供商时，请使用 `--blind-judge-models`：评审提示仍会获得每份对话记录和运行状态，但候选引用会被替换为中性标签，例如 `candidate-01`；报告会在解析后将排序结果映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，支持该能力的较旧 OpenAI 评估引用则使用 `xhigh`。你可以通过 `--model provider/model,thinking=<level>` 内联覆盖某个特定候选。`--thinking <level>` 仍可设置全局回退值，而较旧的 `--model-thinking <provider/model=level>` 形式会继续保留以兼容旧用法。

OpenAI 候选引用默认启用快速模式，这样在提供商支持时会使用优先处理。若需要为单个候选或评审覆盖该行为，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你希望为所有候选模型强制启用快速模式时，才传递 `--fast`。报告会记录候选和评审的运行时长以供基准分析，但评审提示会明确说明不要按速度进行排序。

候选和评审模型运行的默认并发度均为 16。当提供商限制或本地 gateway 压力导致运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。

当未传递任何候选 `--model` 时，角色评估默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
当未传递 `--judge-model` 时，评审默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
