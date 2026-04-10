---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加由仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实度的 QA 自动化
summary: qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化结构
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-10T23:36:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

这个私有 QA 栈旨在以比单个单元测试更贴近真实、渠道化的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具备私信、频道、线程、反应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息以及导出 Markdown 报告。
- `qa/`：用于启动任务和基线 QA 场景的、由仓库支持的种子资源。

当前 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点、启动基于 Docker 的 Gateway 网关测试通道，并暴露 QA Lab 页面，供操作员或自动化循环为智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍然受阻。

如果你想更快地迭代 QA Lab UI，而无需每次都重建 Docker 镜像，可以使用挂载 QA Lab bundle 的方式启动整个栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在发生更改时重建该 bundle，而当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

若要运行一个基于真实传输的 Matrix 冒烟测试通道，请执行：

```bash
pnpm openclaw qa matrix
```

这个通道会在 Docker 中配置一个一次性的 Tuwunel homeserver，注册临时的驱动、SUT 和观察者用户，创建一个私有房间，然后在 QA Gateway 网关子进程中运行真实的 Matrix 插件。这个实时传输通道会将子进程配置限定在被测试的传输协议范围内，因此 Matrix 会在子进程配置中不包含 `qa-channel` 的情况下运行。

若要运行一个基于真实传输的 Telegram 冒烟测试通道，请执行：

```bash
pnpm openclaw qa telegram
```

这个通道会针对一个真实的私有 Telegram 群组，而不是配置一次性服务器。它需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`，并且要求两个不同的机器人位于同一个私有群组中。SUT 机器人必须具有 Telegram 用户名，并且当两个机器人都在 `@BotFather` 中启用 Bot-to-Bot Communication Mode 时，机器人对机器人的观察效果最佳。

实时传输通道现在共享一个更小的契约，而不是各自设计自己的场景列表结构：

`qa-channel` 仍然是覆盖面广的合成产品行为测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 阻止 | 顶级回复 | 重启后恢复 | 线程后续跟进 | 线程隔离 | 反应观察 | Help 命令 |
| ---- | ------ | -------- | -------------- | -------- | ---------- | ------------ | -------- | -------- | --------- |
| Matrix | x | x | x | x | x | x | x | x | |
| Telegram | x | | | | | | | | x |

这使得 `qa-channel` 继续作为覆盖面广的产品行为测试套件，而 Matrix、Telegram 以及未来的实时传输协议则共享一个明确的传输协议契约检查清单。

若要运行一个一次性的 Linux VM 通道，并且不将 Docker 引入 QA 路径，请执行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass 来宾机、安装依赖、在来宾机内构建 OpenClaw、运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它会复用与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 的套件运行默认都会并行执行多个已选场景，并使用隔离的 Gateway 网关工作进程，最多支持 64 个工作进程或所选场景数量。使用 `--concurrency <count>` 可以调整工作进程数量，或使用 `--concurrency 1` 进行串行执行。
实时运行会转发适合来宾机使用的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及在存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便来宾机可以通过挂载的工作区回写内容。

## 由仓库支持的种子资源

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

这些内容特意保存在 git 中，以便人类和智能体都能看到 QA 计划。基线列表应保持足够广泛，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息动作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 会根据观察到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍然受阻
- 值得补充哪些后续场景

对于角色和风格检查，可在多个实时模型引用上运行相同场景，并写出一份经过评判的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。候选模型不应被告知自己正在被评估。该命令会保留每份完整对话记录、记录基本运行统计信息，然后以快速模式并使用 `xhigh` 推理调用评审模型，根据自然度、氛围和幽默感对这些运行进行排序。
在比较不同提供商时，使用 `--blind-judge-models`：评审提示词仍会获得每份对话记录和运行状态，但候选引用会被替换为中性标签，例如 `candidate-01`；报告会在解析后将排名映射回真实引用。
候选运行默认使用 `high` thinking，而支持该能力的 OpenAI 模型则默认使用 `xhigh`。你可以通过 `--model provider/model,thinking=<level>` 为特定候选模型单独覆盖。`--thinking <level>` 仍然用于设置全局回退值，而旧的 `--model-thinking <provider/model=level>` 形式则继续保留以兼容旧用法。
OpenAI 候选引用默认启用快速模式，以便在提供商支持时使用优先处理。若某个单独候选或评审需要覆盖，可在行内添加 `,fast`、`,no-fast` 或 `,fast=false`。只有在你希望为每个候选模型都强制开启快速模式时，才传入 `--fast`。报告中会记录候选和评审的持续时间，用于基准分析，但评审提示词会明确说明不要按速度排序。
候选和评审模型运行的默认并发度均为 16。当提供商限制或本地 Gateway 网关压力导致运行过于嘈杂时，可降低 `--concurrency` 或 `--judge-concurrency`。
当未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
当未传入 `--judge-model` 时，评审默认使用
`openai/gpt-5.4,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA Channel](/zh-CN/channels/qa-channel)
- [仪表板](/web/dashboard)
