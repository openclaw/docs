---
read_when:
    - 扩展 qa-lab 或 qa-channel 时
    - 添加仓库支持的 QA 场景时
    - 围绕 Gateway 网关仪表盘构建更高拟真度的 QA 自动化时
summary: qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-08T19:11:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89889f3d2ed06029f2c6b023f7207c007615d5dca5468f7a1a84d3b195fcf36f
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 技术栈旨在以比单个单元测试更贴近真实渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，支持私信、渠道、线程、表情回应、编辑和删除等表面能力。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息，以及导出 Markdown 报告。
- `qa/`：为启动任务和基线 QA 场景提供的仓库支持种子资源。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表盘（Control UI）。
- 右侧：QA Lab，显示类 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

该命令会构建 QA 站点，启动基于 Docker 的 Gateway 网关通道，并暴露 QA Lab 页面，操作员或自动化循环可以在其中向智能体分配 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍被阻塞。

如果你想更快地迭代 QA Lab UI，而不必每次都重建 Docker 镜像，请使用绑定挂载的 QA Lab bundle 启动技术栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务保持在预构建镜像上运行，并将 `extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch` 会在变更时重建该 bundle，而当 QA Lab 资源哈希发生变化时，浏览器会自动重新加载。

## 仓库支持的种子

种子资源位于 `qa/` 中：

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

这些内容有意保存在 git 中，这样 QA 计划对人类和智能体都可见。基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 会根据观察到的总线时间线导出 Markdown 协议报告。
报告应回答以下问题：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍被阻塞
- 值得添加哪些后续场景

对于角色和风格检查，可在多个实时模型引用上运行同一场景，并编写一份经评判的 Markdown 报告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model minimax/MiniMax-M2.7,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model qwen/qwen3.6-plus,thinking=high \
  --model xiaomi/mimo-v2-pro,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --concurrency 8 \
  --judge-concurrency 8
```

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在被评估。该命令会保留每次运行的完整对话记录，记录基本运行统计信息，然后要求评审模型在快速模式下使用 `xhigh` 推理，按自然度、氛围和幽默感对这些运行进行排序。候选运行默认使用 `high` thinking，对于支持的 OpenAI 模型则使用 `xhigh`。可使用 `--model provider/model,thinking=<level>` 为特定候选项内联覆盖。`--thinking <level>` 仍会设置全局回退值，旧版 `--model-thinking <provider/model=level>` 形式也会出于兼容性继续保留。
OpenAI 候选引用默认启用快速模式，以便在提供商支持时使用优先处理。若单个候选项或评审需要覆盖，请内联添加 `,fast`、`,no-fast` 或 `,fast=false`。仅当你想对每个候选模型都强制启用快速模式时，才传入 `--fast`。报告中会记录候选和评审的持续时间，以便进行基准分析，但评审提示会明确说明不要按速度进行排序。
候选和评审模型运行默认都使用并发度 8。当提供商限制或本地 Gateway 网关压力导致运行噪声过大时，请降低 `--concurrency` 或 `--judge-concurrency`。
当未传入候选 `--model` 时，角色评估默认使用
`openai/gpt-5.4`、`openai/gpt-5.2`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`minimax/MiniMax-M2.7`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、`qwen/qwen3.6-plus`、`xiaomi/mimo-v2-pro` 和
`google/gemini-3.1-pro-preview`。
当未传入 `--judge-model` 时，评审默认使用
`openai/gpt-5.4,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表盘](/web/dashboard)
