---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: 面向 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-23T19:23:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: baecad15e244cb927cac6489eb9f59531a8f56dd0ea7d47bd4dad463984cc9f3
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 栈旨在以比单个单元测试更贴近真实、更加符合渠道形态的方式来验证 OpenClaw。

当前包含的组成部分：

- `extensions/qa-channel`：合成消息渠道，提供私信、渠道、线程、反应、编辑和删除等表面能力。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察转录内容、注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的启动任务种子资源和基线 QA 场景。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的转录内容和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可以在其中给智能体分配一个 QA 任务、观察真实渠道行为，并记录哪些内容有效、哪些失败了，或哪些仍然受阻。

如果你想在不每次都重建 Docker 镜像的情况下更快迭代 QA Lab UI，请使用绑定挂载的 QA Lab bundle 启动此栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务保持在一个预构建镜像上，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

若要运行一个传输层真实的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的 driver、SUT 和 observer 用户，创建一个私有房间，然后在一个 QA Gateway 网关子进程中运行真实的 Matrix 插件。实时传输通道会将子进程配置限制在被测传输协议范围内，因此 Matrix 会在子进程配置中不包含 `qa-channel` 的情况下运行。它会将结构化报告产物以及合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若还要捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为一个位于仓库内的日志文件。

若要运行一个传输层真实的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会面向一个真实的私有 Telegram 群组，而不是配置一个一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并且要求同一个私有群组中有两个不同的机器人。SUT 机器人必须具有一个 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用了 Bot-to-Bot Communication Mode 时，机器人之间的观察效果最佳。
当任一场景失败时，该命令会以非零状态退出。如果你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
Telegram 报告和摘要包含每次回复的 RTT，从 driver 消息发送请求到观测到的 SUT 回复进行计时，从 canary 开始。

实时传输通道现在共享一个更小的统一契约，而不是各自发明自己的场景列表形态：

`qa-channel` 仍然是覆盖面广泛的合成产品行为套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | 允许列表阻止 | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | 反应观察 | 帮助命令 |
| ---- | ------ | -------- | ------------ | -------- | -------- | ------------ | -------- | -------- | -------- |
| Matrix | x | x | x | x | x | x | x | x |  |
| Telegram | x |  |  |  |  |  |  |  | x |

这使 `qa-channel` 继续作为覆盖面广泛的产品行为套件，而 Matrix、Telegram 以及未来的实时传输协议则共享一份明确的传输契约检查清单。

若要运行一个无需将 Docker 引入 QA 路径的一次性 Linux VM 通道，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，在 guest 中安装依赖、构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它会复用与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 套件运行默认都会以多个隔离的 Gateway 网关工作进程并行执行多个被选中的场景。`qa-channel` 默认并发数为 4，并受所选场景数量限制。使用 `--concurrency <count>` 可调整工作进程数量，或使用 `--concurrency 1` 进行串行执行。
当任一场景失败时，该命令会以非零状态退出。如果你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
实时运行会转发适合 guest 使用的受支持 QA 凭证输入：基于 env 的提供商密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区回写内容。

## 由仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容特意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为一个通用的 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并且应定义以下内容：

- 场景元数据
- 可选的 category、capability、lane 和 risk 元数据
- docs 和 code 引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时表面允许保持通用和跨领域。例如，Markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具结合起来，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特殊情况运行器。

场景文件应按产品能力分组，而不是按源代码树文件夹分组。文件移动时请保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 进行实现可追溯性标注。

基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 仓库读取和文档读取
- 一个小型构建任务，例如 Lobster Invaders

## provider 模拟通道

`qa suite` 有两个本地 provider 模拟通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw 模拟器。它仍然是由仓库支持的 QA 和一致性门禁的默认确定性模拟通道。
- `aimock` 会启动一个由 AIMock 支持的 provider 服务器，用于实验性协议、夹具、录制/回放和混沌覆盖。它是附加能力，不会替代 `mock-openai` 场景分发器。

provider 通道实现位于 `extensions/qa-lab/src/providers/` 下。
每个 provider 负责自己的默认值、本地服务器启动、Gateway 网关模型配置、auth profile 暂存需求，以及实时/模拟能力标记。共享的 suite 和 Gateway 网关代码应通过 provider 注册表进行路由，而不是根据 provider 名称分支。

## 传输适配器

`qa-lab` 拥有一个用于 Markdown QA 场景的通用传输接缝。
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个 suite 运行器，而不是添加一个特定于传输协议的 QA 运行器。

从架构层面看，拆分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、产物写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪状态、入站和出站观察、传输动作以及标准化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行这些场景的可复用运行时表面。

面向维护者的新渠道适配器接入指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会基于观测到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍然受阻
- 值得添加哪些后续场景

对于角色和风格检查，请在多个实时模型引用上运行同一个场景，并写出一份经评审的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=xhigh \
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

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在接受评估。该命令会保留每一份完整转录，记录基本运行统计信息，然后以快速模式和 `xhigh` 推理让评审模型按自然度、氛围和幽默感对这些运行进行排序。
在比较不同 provider 时，请使用 `--blind-judge-models`：评审提示仍会获得每份转录和运行状态，但候选引用会被替换为诸如 `candidate-01` 之类的中性标签；报告会在解析后将排名映射回真实引用。
候选运行默认使用 `high` thinking，对于支持它的 OpenAI 模型则使用 `xhigh`。可通过 `--model provider/model,thinking=<level>` 内联覆盖某个特定候选项。`--thinking <level>` 仍会设置全局后备值，而较旧的 `--model-thinking <provider/model=level>` 形式也会为兼容性保留。
OpenAI 候选引用默认使用快速模式，以便在 provider 支持时使用优先处理。若单个候选项或评审项需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你希望对每个候选模型都强制启用快速模式时，才传入 `--fast`。候选和评审时长都会记录在报告中用于基准分析，但评审提示会明确说明不要按速度排序。
候选模型和评审模型运行的默认并发数都是 16。当 provider 限制或本地 Gateway 网关压力使运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。
当未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
当未传入 `--judge-model` 时，评审默认使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
