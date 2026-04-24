---
read_when:
    - 设置无需逐任务提示即可运行的自治智能体工作流
    - 定义智能体可以独立完成的事项，以及哪些事项需要人工批准
    - 构建多程序智能体，并明确边界和升级规则
summary: 为自治智能体程序定义永久运行权限
title: 长期指令
x-i18n:
    generated_at: "2026-04-24T16:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

长期指令会为你的智能体授予针对已定义程序的**永久运行权限**。你不必每次都单独下达任务指令，而是通过明确范围、触发条件和升级规则来定义程序——然后智能体会在这些边界内自主执行。

这相当于：不是每周五都对助手说“发送每周报告”，而是授予长期权限：“每周报告由你负责。每周五完成汇总并发送，只有在发现异常时才升级给我处理。”

## 为什么要使用长期指令？

**没有长期指令时：**

- 你必须为每个任务都提示智能体
- 智能体会在请求之间处于空闲状态
- 例行工作容易被遗忘或延迟
- 你会成为整个流程的瓶颈

**有了长期指令后：**

- 智能体会在已定义边界内自主执行
- 例行工作会按计划完成，无需提示
- 你只需要参与异常情况和审批事项
- 智能体会高效利用空闲时间

## 它们如何工作

长期指令定义在你的[智能体工作区](/zh-CN/concepts/agent-workspace)文件中。推荐做法是将它们直接写入 `AGENTS.md`（该文件会在每次会话中自动注入），这样智能体始终会在上下文中看到这些指令。对于更大的配置，你也可以将其放在专用文件中，例如 `standing-orders.md`，然后在 `AGENTS.md` 中引用它。

每个程序都应指定：

1. **范围** —— 智能体被授权执行哪些内容
2. **触发条件** —— 何时执行（按计划、事件触发或条件触发）
3. **审批关卡** —— 哪些操作需要先获得人工签字确认
4. **升级规则** —— 何时停止并请求帮助

智能体会在每次会话中通过工作区引导文件加载这些指令（完整自动注入文件列表参见[智能体工作区](/zh-CN/concepts/agent-workspace)），并结合 [cron jobs](/zh-CN/automation/cron-jobs) 来执行基于时间的强制调度。

<Tip>
把长期指令放在 `AGENTS.md` 中，以确保它们会在每次会话中加载。工作区引导流程会自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`——但不会自动注入子目录中的任意文件。
</Tip>

## 长期指令的结构

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## 长期指令 + Cron Jobs

长期指令定义智能体被授权做**什么**。[Cron Jobs](/zh-CN/automation/cron-jobs) 定义事情在**什么时候**发生。两者协同工作：

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

`cron job` 提示应当引用长期指令，而不是重复书写其内容：

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## 示例

### 示例 1：内容与社交媒体（每周循环）

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### 示例 2：财务运营（事件触发）

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 示例 3：监控与告警（持续运行）

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## 执行-验证-汇报模式

长期指令在与严格的执行纪律结合时效果最好。长期指令中的每个任务都应遵循以下循环：

1. **执行** —— 完成实际工作（不要只是确认收到指令）
2. **验证** —— 确认结果正确无误（文件存在、消息已送达、数据已解析）
3. **汇报** —— 告诉所有者你做了什么，以及验证了什么

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

这种模式可以防止智能体最常见的失败方式：只确认任务，却没有真正完成任务。

## 多程序架构

对于需要管理多个事项的智能体，应将长期指令组织为多个独立程序，并明确它们之间的边界：

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

每个程序都应具备：

- 自己的**触发节奏**（每周、每月、事件驱动、持续运行）
- 自己的**审批关卡**（有些程序比其他程序需要更多监督）
- 清晰的**边界**（智能体应当知道一个程序在哪里结束，另一个程序从哪里开始）

## 最佳实践

### 建议这样做

- 一开始只授予较窄的权限，并随着信任建立逐步扩大
- 为高风险操作定义明确的审批关卡
- 加入“不要做什么”部分——边界和权限同样重要
- 结合 Cron Jobs 使用，以实现可靠的定时执行
- 每周检查智能体日志，确认长期指令正在被正确遵循
- 随着需求演变更新长期指令——它们是动态文档

### 避免这样做

- 第一天就授予过宽权限（“你觉得怎么最好就怎么做”）
- 跳过升级规则——每个程序都需要“什么时候停止并询问”的条款
- 假设智能体会记住口头指令——把所有内容都写进文件里
- 在同一个程序中混合多个事项——不同领域应拆分为不同程序
- 忘记通过 `cron jobs` 强制执行——没有触发器的长期指令只会变成建议

## 相关内容

- [Automation & Tasks](/zh-CN/automation) —— 各类自动化机制总览
- [Cron Jobs](/zh-CN/automation/cron-jobs) —— 长期指令的调度执行机制
- [Hooks](/zh-CN/automation/hooks) —— 用于智能体生命周期事件的事件驱动脚本
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks) —— 入站 HTTP 事件触发器
- [Agent Workspace](/zh-CN/concepts/agent-workspace) —— 长期指令的存放位置，包括完整的自动注入引导文件列表（AGENTS.md、SOUL.md 等）
