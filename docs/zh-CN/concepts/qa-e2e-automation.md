---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: 用于 qa-lab、qa-channel、预置场景和协议报告的私有 QA 自动化结构
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-24T19:56:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈旨在以比单个单元测试更贴近真实、更加符合渠道形态的方式来检验 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具备私信、渠道、线程、反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基础 QA 场景。

当前的 QA 操作流是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类 Slack 的转录内容和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点、启动由 Docker 支持的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可以在此向智能体下达 QA 任务、观察真实渠道行为，并记录哪些内容成功了、失败了，或仍然受阻。

如果你想在不每次都重建 Docker 镜像的情况下，更快地迭代 QA Lab UI，可以使用绑定挂载的 QA Lab bundle 来启动栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务保持在预构建镜像上，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，而当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

若要运行一个基于真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的驱动、SUT 和观察者用户，创建一个私有房间，然后在 QA Gateway 网关子进程中运行真实的 Matrix 插件。实时传输通道会将子配置范围限定在被测传输上，因此 Matrix 会在子配置中不带 `qa-channel` 运行。它会将结构化报告产物和合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若要同时捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，可将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库本地日志文件。
默认会打印 Matrix 进度。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 用于限制整个运行时长，`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 用于限制清理时长，这样在 Docker 拆除卡住时，会报告精确的恢复命令，而不是一直挂起。

若要运行一个基于真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会以一个真实的私有 Telegram 群组为目标，而不是配置一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，此外还要求同一私有群组中有两个不同的机器人。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人之间的观察效果最佳。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不使用失败退出码，请使用 `--allow-failures`。
Telegram 报告和摘要会包含每条回复的 RTT，从驱动消息发送请求开始，到观察到 SUT 回复为止，canary 也包含在内。

在使用池化的实时凭证之前，请先运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量、验证端点设置，并在存在维护者密钥时验证 admin/list 可达性。对于密钥，它只会报告已设置/缺失状态。

若要运行一个基于真实传输的 Discord 冒烟通道，请执行：

```bash
pnpm openclaw qa discord
```

该通道会以一个真实的私有 Discord guild 渠道为目标，并使用两个机器人：一个由 harness 控制的驱动机器人，以及一个由子 OpenClaw Gateway 网关通过内置 Discord 插件启动的 SUT 机器人。使用环境变量凭证时，它需要 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该通道会验证渠道提及处理，并检查 SUT 机器人是否已向 Discord 注册原生 `/help` 命令。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不使用失败退出码，请使用 `--allow-failures`。

实时传输通道现在共享一个更小的统一契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是覆盖面广泛的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 阻止 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观察 | Help 命令 | 原生命令注册 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

这样可以让 `qa-channel` 保持为覆盖广泛的产品行为套件，同时让 Matrix、Telegram 以及未来的实时传输共享一份显式的传输契约检查清单。

若要运行一个一次性的 Linux VM 通道，并且不让 Docker 进入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 来宾机，在来宾机中安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它会复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 的套件运行默认都会并行执行多个所选场景，并使用隔离的 Gateway 网关工作进程。`qa-channel` 默认并发度为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整工作进程数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。如果你希望保留产物但不使用失败退出码，请使用 `--allow-failures`。
实时运行会转发对来宾机来说可行的受支持 QA 认证输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及在存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，这样来宾机才能通过挂载的工作区写回结果。

## 由仓库支持的种子

种子资源位于 `qa/` 中：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意保存在 git 中，这样无论是人还是智能体，都能看到 QA 计划。

`qa-lab` 应保持为一个通用的 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并且应定义：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- 文档和代码引用
- 可选的插件需求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面可以保持通用且跨领域。例如，Markdown 场景可以将传输侧辅助函数与浏览器侧辅助函数结合起来，通过 Gateway 网关 `browser.request` 接口驱动嵌入式 Control UI，而无需添加特例运行器。

场景文件应按产品能力分组，而不是按源码树文件夹分组。即使文件移动，也应保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来实现实现级可追溯性。

基础列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- memory 召回
- 模型切换
- subagent 交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## provider 模拟通道

`qa suite` 有两个本地 provider 模拟通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw 模拟器。它仍然是由仓库支持的 QA 和 parity gate 的默认确定性模拟通道。
- `aimock` 会启动一个由 AIMock 支持的 provider 服务器，用于实验性的协议、夹具、录制/回放和混沌测试覆盖。它是增量补充，不会取代 `mock-openai` 场景分发器。

provider 通道实现位于 `extensions/qa-lab/src/providers/` 下。每个 provider 都拥有自己的默认值、本地服务器启动、Gateway 网关模型配置、auth profile 暂存需求，以及实时/模拟能力标志。共享套件和 Gateway 网关代码应通过 provider 注册表进行路由，而不是根据 provider 名称分支。

## 传输适配器

`qa-lab` 拥有一个面向 Markdown QA 场景的通用传输接口。
`qa-channel` 是该接口上的第一个适配器，但设计目标更广：未来无论是真实渠道还是合成渠道，都应接入同一个 suite 运行器，而不是新增一个传输专用的 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、产物写入和报告生成。
- 传输适配器负责 Gateway 网关配置、就绪状态、入站和出站观察、传输动作，以及标准化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时表面。

面向维护者的新渠道适配器采用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些内容成功了
- 哪些内容失败了
- 哪些内容仍然受阻
- 值得补充哪些后续场景

对于角色和风格检查，可在多个实时模型引用上运行同一个场景，并写出一份经过裁判评估的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

该命令运行本地 QA Gateway 网关子进程，而不是 Docker。character eval 场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每份完整转录、记录基本运行统计信息，然后让裁判模型在快速模式下，并在支持时使用 `xhigh` 推理，按自然度、氛围和幽默感对运行结果进行排序。
在比较 provider 时使用 `--blind-judge-models`：裁判提示仍会获得每份转录和运行状态，但候选引用会被替换为中性标签，例如 `candidate-01`；报告会在解析后将排序结果映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.4 使用 `medium`，而支持该能力的旧版 OpenAI eval 引用则使用 `xhigh`。可通过 `--model provider/model,thinking=<level>` 内联覆盖特定候选项。`--thinking <level>` 仍可设置全局后备值，而旧的 `--model-thinking <provider/model=level>` 形式则保留用于兼容。

OpenAI 候选引用默认启用快速模式，以便在 provider 支持时使用优先处理。若单个候选项或裁判需要覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你想为每个候选模型都强制开启快速模式时，才传递 `--fast`。报告中会记录候选项和裁判的运行时长，用于基准分析，但裁判提示会明确说明不要按速度排序。

候选模型和裁判模型运行默认都使用并发度 16。当 provider 限制或本地 Gateway 网关压力使运行噪声过大时，可降低 `--concurrency` 或 `--judge-concurrency`。

当未传递候选 `--model` 时，character eval 默认使用
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。

当未传递 `--judge-model` 时，裁判默认使用
`openai/gpt-5.4,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
