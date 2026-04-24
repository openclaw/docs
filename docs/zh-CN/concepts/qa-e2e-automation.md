---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-24T01:50:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6924a05faebdd22ac5222db6b9579b57d9c7f3dfac71df6c5f2ee7d2bf0a5f8
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

私有 QA 栈的目标，是以比单个单元测试更贴近真实、更加符合渠道形态的方式来演练 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具备私信、渠道、线程、表情反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息，并导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基线 QA 场景。

当前 QA 操作流程是一个双栏 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点、启动基于 Docker 的 Gateway 网关通道，并暴露 QA Lab 页面，供操作员或自动化循环向智能体下达 QA 任务、观察真实渠道行为，并记录哪些有效、哪些失败、哪些仍然受阻。

如果你想更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，请使用绑定挂载的 QA Lab bundle 启动该栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，并在 QA Lab 资源哈希发生变化时让浏览器自动重新加载。

如果要运行一个使用真实传输的 Matrix 冒烟通道，请执行：

```bash
pnpm openclaw qa matrix
```

该通道会在 Docker 中预配一个一次性的 Tuwunel homeserver，注册临时的驱动、SUT 和观察者用户，创建一个私有房间，然后在 QA Gateway 网关子进程中运行真实的 Matrix 插件。这个实时传输通道会将子配置限定在被测传输范围内，因此 Matrix 会在子配置中不带 `qa-channel` 运行。它会把结构化报告产物和合并后的 stdout/stderr 日志写入所选的 Matrix QA 输出目录。若要同时捕获外层 `scripts/run-node.mjs` 的构建/启动器输出，请将 `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` 设置为仓库内本地日志文件路径。

如果要运行一个使用真实传输的 Telegram 冒烟通道，请执行：

```bash
pnpm openclaw qa telegram
```

该通道会针对一个真实的私有 Telegram 群组，而不是预配一次性服务器。它要求设置 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用 Bot-to-Bot Communication Mode 时，机器人之间的观察效果最佳。  
当任一场景失败时，该命令会以非零状态退出。如果你想保留产物但不希望退出码失败，请使用 `--allow-failures`。  
Telegram 报告和摘要包含每次回复的 RTT，从驱动消息发送请求开始，到观察到 SUT 回复结束，金丝雀场景也包含在内。

实时传输通道现在共享一个更小的契约，而不是各自发明自己的场景列表结构：

`qa-channel` 仍然是覆盖范围广泛的合成产品行为测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | 金丝雀 | 提及门控 | Allowlist 拦截 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | 表情反应观察 | 帮助命令 |
| ---- | ------ | -------- | -------------- | -------- | -------- | -------- | -------- | ------------ | -------- |
| Matrix | x | x | x | x | x | x | x | x | |
| Telegram | x | | | | | | | | x |

这使 `qa-channel` 保持为覆盖广泛产品行为的测试套件，而 Matrix、Telegram 以及未来的实时传输则共享一份明确的传输契约检查清单。

如果要运行一个一次性的 Linux VM 通道，而不把 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

该命令会启动一个全新的 Multipass 来宾系统、安装依赖、在来宾系统内构建 OpenClaw、运行 `qa suite`，然后把标准 QA 报告和摘要复制回主机上的 `.artifacts/qa-e2e/...`。  
它复用了与主机上 `qa suite` 相同的场景选择行为。  
主机和 Multipass 套件运行默认都会并行执行多个已选场景，并使用隔离的 Gateway 网关工作进程。`qa-channel` 默认并发数为 4，但不会超过所选场景数量。使用 `--concurrency <count>` 可调节工作进程数量，或使用 `--concurrency 1` 进行串行执行。  
当任一场景失败时，该命令会以非零状态退出。如果你想保留产物但不希望退出码失败，请使用 `--allow-failures`。  
实时运行会转发那些对来宾系统来说可行的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便来宾系统能通过挂载的工作区回写内容。

## 由仓库支持的种子

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

这些内容有意保存在 git 中，以便 QA 计划对人类和智能体都可见。

`qa-lab` 应保持为一个通用的 Markdown 运行器。每个场景 Markdown 文件都是一次测试运行的事实来源，并应定义：

- 场景元数据
- 可选的类别、能力、通道和风险元数据
- 文档和代码引用
- 可选的插件要求
- 可选的 Gateway 网关配置补丁
- 可执行的 `qa-flow`

支撑 `qa-flow` 的可复用运行时能力面可以保持通用且跨领域。例如，Markdown 场景可以将传输侧辅助工具与浏览器侧辅助工具结合起来，通过 Gateway 网关 `browser.request` 接缝驱动嵌入式 Control UI，而无需添加特例运行器。

场景文件应按产品能力而非源码树目录来分组。即使文件移动，也要保持场景 ID 稳定；使用 `docsRefs` 和 `codeRefs` 来提供实现可追踪性。

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

`qa suite` 有两个本地提供商 mock 通道：

- `mock-openai` 是具备场景感知能力的 OpenClaw mock。它仍然是用于仓库支持 QA 和一致性门禁的默认确定性 mock 通道。
- `aimock` 会启动一个基于 AIMock 的提供商服务器，用于实验性的协议、夹具、录制/回放和混沌覆盖。它是补充性的，不会替代 `mock-openai` 场景分发器。

提供商通道实现位于 `extensions/qa-lab/src/providers/` 下。每个提供商都负责其默认值、本地服务器启动、Gateway 网关模型配置、auth-profile 暂存需求，以及实时/mock 能力标志。共享的套件和 Gateway 网关代码应通过提供商注册表进行路由，而不是根据提供商名称做分支。

## 传输适配器

`qa-lab` 拥有一个用于 Markdown QA 场景的通用传输接缝。  
`qa-channel` 是该接缝上的第一个适配器，但设计目标更广：未来的真实或合成渠道应接入同一个 suite 运行器，而不是增加一个特定于传输的 QA 运行器。

在架构层面，划分如下：

- `qa-lab` 负责通用场景执行、工作进程并发、产物写入和报告。
- 传输适配器负责 Gateway 网关配置、就绪检测、入站和出站观察、传输动作以及标准化的传输状态。
- `qa/scenarios/` 下的 Markdown 场景文件定义测试运行；`qa-lab` 提供执行它们的可复用运行时能力面。

面向维护者的新渠道适配器采用指南位于
[测试](/zh-CN/help/testing#adding-a-channel-to-qa)。

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。  
报告应回答：

- 哪些有效
- 哪些失败
- 哪些仍然受阻
- 值得补充哪些后续场景

对于角色和风格检查，请在多个实时模型引用上运行同一场景，并写出一份经评审的 Markdown 报告：

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

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置人格，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在被评估。  
该命令会保留每一份完整对话记录、记录基本运行统计信息，然后要求评审模型在快速模式下、在支持时使用 `xhigh` 推理，按自然度、氛围和幽默感对运行结果进行排序。  
在比较不同提供商时，请使用 `--blind-judge-models`：评审提示词仍会拿到每份对话记录和运行状态，但候选引用会被替换为诸如 `candidate-01` 这样的中性标签；报告会在解析后将排名映射回真实引用。  
候选运行默认使用 `high` thinking，而 GPT-5.4 使用 `medium`，支持该能力的旧版 OpenAI 评估引用使用 `xhigh`。可通过 `--model provider/model,thinking=<level>` 为特定候选单独覆盖。`--thinking <level>` 仍然设置全局回退值，旧的 `--model-thinking <provider/model=level>` 形式也会保留以兼容。  
OpenAI 候选引用默认启用 fast 模式，因此在提供商支持时会使用优先处理。若某个单独候选或评审需要覆盖，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。只有当你希望为每个候选模型都强制启用 fast 模式时，才使用 `--fast`。  
候选和评审运行时长都会记录在报告中，用于基准分析，但评审提示词会明确说明不要按速度排名。  
候选模型运行和评审模型运行默认并发数均为 16。当提供商限制或本地 Gateway 网关压力导致运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。  
当未传入候选 `--model` 时，角色评估默认使用 `openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。  
当未传入 `--judge-model` 时，评审默认使用 `openai/gpt-5.4,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/zh-CN/web/dashboard)
