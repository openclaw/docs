---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: 用于 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-25T17:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 自动化栈的目标是以比单个单元测试更贴近真实、更加符合渠道形态的方式来演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，支持私信、渠道、线程、反应、编辑和删除等界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基线 QA 场景。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录内容和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动由 Docker 支持的 gateway 车道，并暴露 QA Lab 页面；在这里，操作员或自动化循环可以为智能体分配 QA 任务，观察真实渠道行为，并记录哪些成功了、哪些失败了，或者哪些仍然受阻。

为了在不每次都重建 Docker 镜像的情况下更快地迭代 QA Lab UI，可使用绑定挂载的 QA Lab bundle 启动整套系统：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

如需运行一个使用真实传输层的 Matrix 冒烟车道，请执行：

```bash
pnpm openclaw qa matrix
```

该车道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在 QA gateway 子进程中运行真实的 Matrix 插件。这个实时传输车道会将子进程配置限定在被测传输层上，因此 Matrix 会在子配置中不带 `qa-channel` 运行。它会将结构化报告产物以及合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若还想捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，可将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库本地日志文件。
默认会打印 Matrix 进度。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` 用于限制完整运行时长，`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 用于限制清理时长，这样在 Docker 拆除卡住时，会报告精确的恢复命令，而不是一直挂起。

如需运行一个使用真实传输层的 Telegram 冒烟车道，请执行：

```bash
pnpm openclaw qa telegram
```

该车道会以一个真实的私有 Telegram 群组为目标，而不是配置一个一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并且要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人之间的观测效果最佳。
只要任一场景失败，该命令就会以非零状态退出。如果你想获取产物但不希望退出码失败，请使用 `--allow-failures`。
Telegram 报告和摘要包含每条回复的 RTT，时间范围从 driver 消息发送请求开始，到观测到 SUT 回复为止，从 canary 开始统计。

在使用池化的实时凭证之前，请运行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 会检查 Convex broker 环境变量，验证端点设置，并在存在维护者密钥时验证 admin/list 的可达性。对于密钥，它只会报告已设置/缺失状态。

如需运行一个使用真实传输层的 Discord 冒烟车道，请执行：

```bash
pnpm openclaw qa discord
```

该车道会以一个真实的私有 Discord guild 渠道为目标，并使用两个机器人：一个由 harness 控制的 driver 机器人，以及一个由子 OpenClaw gateway 通过内置 Discord 插件启动的 SUT 机器人。使用环境变量凭证时，它需要 `OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` 和 `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`。
该车道会验证渠道提及处理，并检查 SUT 机器人是否已向 Discord 注册原生 `/help` 命令。
只要任一场景失败，该命令就会以非零状态退出。如果你想获取产物但不希望退出码失败，请使用 `--allow-failures`。

实时传输车道现在共享一个更小的统一契约，而不是各自发明自己的场景列表形状：

`qa-channel` 仍然是覆盖面广泛的合成产品行为测试套件，不属于实时传输覆盖矩阵的一部分。

| 车道 | Canary | 提及门控 | Allowlist 阻止 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 反应观测 | 帮助命令 | 原生命令注册 |
| ---- | ------ | -------- | -------------- | -------- | -------- | -------- | -------- | -------- | -------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

这样可以让 `qa-channel` 继续作为覆盖面广泛的产品行为测试套件，而 Matrix、Telegram 以及未来的实时传输层则共享一份明确的传输契约检查清单。

如需运行一个一次性的 Linux VM 车道，并且不将 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 内安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。
它会复用与主机上 `qa suite` 相同的场景选择行为。
主机和 Multipass 套件运行默认都会并行执行多个已选场景，并为每个场景使用隔离的 gateway worker。`qa-channel` 默认并发数为 4，并受所选场景总数限制。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
只要任一场景失败，该命令就会以非零状态退出。如果你想获取产物但不希望退出码失败，请使用 `--allow-failures`。
实时运行会转发对 guest 来说实用且受支持的 QA 身份验证输入：基于环境变量的 provider 密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区回写。

## 由仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意存放在 git 中，以便人类和智能体都能看到 QA 计划。

`qa-lab` 应保持为一个通用的 Markdown 运行器。每个场景 Markdown 文件都是单次测试运行的真实来源，应定义：

- 场景元数据
- 可选的类别、能力、车道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 gateway 配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时界面可以保持通用且跨领域。例如，Markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具结合起来，通过 Gateway 网关的 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特例运行器。

场景文件应按产品能力而不是源码树文件夹进行分组。即使文件移动，也应保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来追踪实现。

基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- memory recall
- 模型切换
- subagent 交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 提供商 mock 车道

`qa suite` 有两个本地 provider mock 车道：

- `mock-openai` 是场景感知的 OpenClaw mock。它仍然是由仓库支持的 QA 和一致性门控的默认确定性 mock 车道。
- `aimock` 会启动一个由 AIMock 支持的 provider 服务器，用于实验性的协议、夹具、录制/回放和混沌覆盖。它是增量补充，不替代 `mock-openai` 场景分发器。

provider 车道的实现位于 `extensions/qa-lab/src/providers/` 下。
每个 provider 都拥有自己的默认值、本地服务器启动逻辑、gateway 模型配置、auth-profile 暂存需求，以及 live/mock 能力标志。共享的 suite 和 gateway 代码应通过 provider 注册表进行路由，而不是根据 provider 名称分支。

## 传输适配器

`qa-lab` 拥有一条用于 Markdown QA 场景的通用传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道应插入同一个 suite 运行器，而不是添加一个传输专用 QA 运行器。

在架构层面，拆分如下：

- `qa-lab` 负责通用场景执行、worker 并发、产物写入和报告。
- 传输适配器负责 gateway 配置、就绪状态、入站和出站观测、传输动作以及标准化后的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时界面。

面向维护者的新渠道适配器采用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观测到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍然受阻
- 值得补充哪些后续场景

如需进行角色和风格检查，请在多个实时模型引用上运行相同场景，并写出经评审的 Markdown 报告：

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

该命令运行的是本地 QA gateway 子进程，而不是 Docker。character eval 场景应通过 `SOUL.md` 设置 persona，然后运行普通的用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每份完整转录，记录基础运行统计信息，然后在支持的情况下使用开启快速模式且带 `xhigh` 推理的 judge 模型，按自然度、氛围和幽默感对各次运行进行排序。比较不同 provider 时，请使用 `--blind-judge-models`：judge 提示仍会获得每份转录和运行状态，但候选引用会被替换为诸如 `candidate-01` 之类的中性标签；报告会在解析后将排序结果映射回真实引用。

候选运行默认使用 `high` thinking，GPT-5.5 使用 `medium`，而支持的较旧 OpenAI 评估引用则使用 `xhigh`。可使用 `--model provider/model,thinking=<level>` 内联覆盖某个特定候选模型。`--thinking <level>` 仍可设置全局回退值，较旧的 `--model-thinking <provider/model=level>` 形式也会保留以兼容旧用法。

OpenAI 候选引用默认启用快速模式，因此在 provider 支持时会使用优先处理。若某个单独候选或 judge 需要覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有在你想为每个候选模型都强制开启快速模式时，才传递 `--fast`。报告会记录候选和 judge 的耗时，供基准分析使用，但 judge 提示会明确说明不要按速度进行排序。

候选和 judge 模型运行的默认并发度都是 16。当 provider 限制或本地 gateway 压力导致运行噪声过大时，可调低 `--concurrency` 或 `--judge-concurrency`。

当未传递候选 `--model` 时，character eval 默认使用 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。

当未传递 `--judge-model` 时，judge 默认使用 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
