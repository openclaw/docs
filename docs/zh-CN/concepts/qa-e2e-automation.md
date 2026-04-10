---
read_when:
    - 扩展 qa-lab 或 qa-channel
    - 添加仓库支持的 QA 场景
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化
summary: qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-10T13:50:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e416ffd285a05339a88eb749e37c4ed9448f232ca67dc0c85eba772029b5b306
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 堆栈旨在以比单个单元测试更贴近真实渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，支持私信、渠道、线程、表情回应、编辑和删除等交互面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息，以及导出 Markdown 报告。
- `qa/`：用于启动任务和基础 QA 场景的仓库支持种子资源。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 风格的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动基于 Docker 的 Gateway 网关运行通道，并暴露 QA Lab 页面，供操作员或自动化循环向智能体下达 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍然受阻。

如果你想更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，请使用带有绑定挂载 QA Lab bundle 的方式启动堆栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重新构建该 bundle，当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

如果你想使用一次性的 Linux VM 运行通道，而不将 Docker 引入 QA 路径，请运行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

这会启动一个全新的 Multipass guest，安装依赖，在 guest 内构建 OpenClaw，运行 `qa suite`，然后将常规 QA 报告和摘要复制回宿主机上的 `.artifacts/qa-e2e/...`。
它会复用与宿主机上 `qa suite` 相同的场景选择行为。
宿主机和 Multipass 的 suite 运行默认都会并行执行多个已选场景，并使用隔离的 Gateway 网关 worker，最多为 64 个 worker 或所选场景数量。使用 `--concurrency <count>` 可调整 worker 数量，或使用 `--concurrency 1` 进行串行执行。
实时运行会转发适合 guest 使用的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。请将 `--output-dir` 保持在仓库根目录下，以便 guest 能通过挂载的工作区写回结果。

## 仓库支持的种子数据

种子资源位于 `qa/`：

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

这些内容有意保存在 git 中，以便人类和智能体都能看到 QA 计划。基础列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
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

- 哪些有效
- 哪些失败
- 哪些仍然受阻
- 值得添加哪些后续场景

对于角色和风格检查，请在多个实时模型引用上运行同一场景，并写出一份经评审的 Markdown 报告：

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

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户回合，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每一份完整对话记录，记录基础运行统计信息，然后以快速模式和 `xhigh` 推理要求评审模型按照自然度、氛围感和幽默感对这些运行结果进行排序。
在比较不同提供商时，使用 `--blind-judge-models`：评审提示仍会获取每份对话记录和运行状态，但候选引用会被替换为中性标签，例如 `candidate-01`；报告会在解析后将排序结果映射回真实引用。
候选运行默认使用 `high` thinking，而支持该能力的 OpenAI 模型则默认使用 `xhigh`。你可以通过 `--model provider/model,thinking=<level>` 为特定候选项内联覆盖。`--thinking <level>` 仍可设置全局回退值，较旧的 `--model-thinking <provider/model=level>` 形式也会出于兼容性保留。
OpenAI 候选引用默认启用快速模式，以便在提供商支持时使用优先处理。若单个候选项或评审项需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想为每个候选模型都强制开启快速模式时，才传入 `--fast`。报告中会记录候选和评审的耗时，以便进行基准分析，但评审提示会明确说明不要按速度进行排序。
候选和评审模型运行的默认并发数均为 16。当提供商限制或本地 Gateway 网关压力使运行噪声过大时，请调低 `--concurrency` 或 `--judge-concurrency`。
当未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和
`google/gemini-3.1-pro-preview`。
当未传入 `--judge-model` 时，评审默认使用
`openai/gpt-5.4,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表板](/web/dashboard)
