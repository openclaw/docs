---
read_when:
    - 扩展 qa-lab 或 qa-channel 时
    - 添加基于仓库的 QA 场景时
    - 围绕 Gateway 网关仪表盘构建更高真实性的 QA 自动化时
summary: 用于 qa-lab、qa-channel、种子场景和协议报告的私有 QA 自动化形态
title: QA 端到端自动化
x-i18n:
    generated_at: "2026-04-06T16:49:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 113e89d8d3ee8ef3058d95b9aea9a1c2335b07794446be2d231c0faeb044b23b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA 端到端自动化

私有 QA 技术栈旨在以比单个单元测试更贴近真实渠道形态的方式来验证 OpenClaw。

当前组成部分：

- `extensions/qa-channel`：合成消息渠道，具有私信、渠道、线程、反应、编辑和删除等功能界面。
- `extensions/qa-lab`：调试器 UI 和 QA 总线，用于观察对话记录、注入入站消息，以及导出 Markdown 报告。
- `qa/`：用于启动任务和基线 QA 场景的基于仓库的种子资源。

当前 QA 操作流程是一个双窗格 QA 站点：

- 左侧：带有智能体的 Gateway 网关仪表盘（Control UI）。
- 右侧：QA Lab，显示类似 Slack 的对话记录和场景计划。

使用以下命令运行：

```bash
pnpm qa:lab:up
```

这会构建 QA 站点，启动由 Docker 支持的 Gateway 网关通道，并公开 QA Lab 页面，供操作员或自动化循环向智能体下达 QA 任务、观察真实渠道行为，并记录哪些内容有效、失败或仍然受阻。

## 基于仓库的种子资源

种子资源位于 `qa/` 中：

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

这些内容有意保存在 git 中，以便 QA 计划对人类和智能体都可见。基线列表应保持足够广泛，以覆盖：

- 私信和渠道聊天
- 线程行为
- 消息操作生命周期
- cron 回调
- 记忆召回
- 模型切换
- 子智能体移交
- 读取仓库和读取文档
- 一个小型构建任务，例如 Lobster Invaders

## 报告

`qa-lab` 从观察到的总线时间线导出 Markdown 协议报告。
该报告应回答：

- 哪些内容有效
- 哪些内容失败
- 哪些内容仍然受阻
- 值得添加哪些后续场景

## 相关文档

- [测试](/zh-CN/help/testing)
- [QA 渠道](/zh-CN/channels/qa-channel)
- [仪表盘](/web/dashboard)
