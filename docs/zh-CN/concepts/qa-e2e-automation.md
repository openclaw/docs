---
read_when:
    - 扩展 qa-lab 或 qa-channel 时
    - 添加由仓库支持的 QA 场景时
    - 围绕 Gateway 网关仪表板构建更高真实性的 QA 自动化时
summary: 用于 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化结构
title: QA E2E 自动化
x-i18n:
    generated_at: "2026-04-08T16:07:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e248009148c4dcd1c3e7f9dab768b272b743ba1d406f79c89cb71074e2b76a4a
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 自动化

私有 QA 技术栈旨在以比单个单元测试更贴近真实渠道形态的方式来测试 OpenClaw。

当前组件包括：

- `extensions/qa-channel`：合成消息渠道，提供私信、频道、线程、
  反应、编辑和删除等交互界面。
- `extensions/qa-lab`：调试 UI 和 QA 总线，用于观察对话记录、
  注入入站消息，以及导出 Markdown 报告。
- `qa/`：由仓库支持的种子资源，用于启动任务和基线 QA
  场景。

当前的 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表板（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

运行方式如下：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点、启动由 Docker 支持的 Gateway 网关通道，并公开
QA Lab 页面。操作员或自动化循环可以在这里给智能体分配 QA
任务、观察真实渠道行为，并记录哪些内容有效、失败，或仍然处于
阻塞状态。

如果你想更快地迭代 QA Lab UI，而不必每次都重新构建 Docker 镜像，
可以使用绑定挂载的 QA Lab bundle 启动该技术栈：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 会让 Docker 服务继续使用预构建镜像，并将
`extensions/qa-lab/web/dist` 绑定挂载到 `qa-lab` 容器中。`qa:lab:watch`
会在变更时重建该 bundle，而当 QA Lab 资源哈希变化时，浏览器会自动重新加载。

## 由仓库支持的种子资源

种子资源位于 `qa/` 中：

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

这些内容有意保存在 git 中，以便人类和智能体都能看到 QA 计划。
基线列表应保持足够广泛，以覆盖：

- 私信和频道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- memory 召回
- 模型切换
- subagent 交接
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 会根据观察到的总线时间线导出一份 Markdown 协议报告。
该报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍然受阻
- 值得添加哪些后续场景

对于角色风格和文风检查，请在多个实时模型引用上运行同一场景，
并编写一份经过评判的 Markdown 报告：

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
  --judge-model anthropic/claude-opus-4-6,thinking=high
```

该命令运行的是本地 QA Gateway 网关子进程，而不是 Docker。角色评估
场景应通过 `SOUL.md` 设置 persona，然后运行普通用户轮次，
例如聊天、工作区帮助和小型文件任务。不应告知候选模型它正在接受评估。
该命令会保留每份完整对话记录、记录基本运行统计信息，然后要求评审模型以快速模式并使用
`xhigh` 推理，按照自然度、氛围和幽默感对各次运行进行排序。
候选运行默认使用 `high` thinking，而支持该级别的 OpenAI 模型则使用 `xhigh`。
你可以通过
`--model provider/model,thinking=<level>` 内联覆盖特定候选项。`--thinking <level>` 仍可设置全局回退值，
而较旧的 `--model-thinking <provider/model=level>` 形式也会保留以确保兼容性。
OpenAI 候选引用默认使用快速模式，因此在提供商支持的情况下会使用优先处理。
当某个单独候选项或评审项需要覆盖时，可内联添加 `,fast`、`,no-fast` 或 `,fast=false`。
仅当你希望为每个候选模型都强制启用快速模式时，才传递 `--fast`。
报告中会记录候选项和评审项的持续时间，用于基准分析，但评审提示会明确说明
不要按速度进行排名。
当未传递候选 `--model` 时，角色评估默认使用
`openai/gpt-5.4`、`openai/gpt-5.2`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`minimax/MiniMax-M2.7`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、`qwen/qwen3.6-plus`、`xiaomi/mimo-v2-pro` 和
`google/gemini-3.1-pro-preview`。
当未传递 `--judge-model` 时，评审模型默认使用
`openai/gpt-5.4,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-6,thinking=high`。

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表板](/web/dashboard)
