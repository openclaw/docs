---
read_when:
    - 设置无需逐任务提示即可运行的自主智能体工作流
    - 定义智能体可以独立执行什么，以及什么需要人工批准
    - 用清晰的边界和升级规则构建多程序智能体结构
summary: 为自主智能体程序定义永久操作权限
title: 常设指令
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

常设指令授予你的智能体对已定义程序的**永久操作权限**。你不用每次都给出单独的任务指令，而是定义范围、触发条件和升级规则明确的程序，智能体会在这些边界内自主执行。

这就像每周五告诉助手“发送周报”，与授予常设权限之间的区别：“周报由你负责。每周五汇总并发送，只有在看起来有问题时才升级。”

## 为什么需要常设指令

**没有常设指令：**

- 你必须为每个任务提示智能体
- 智能体在请求之间处于空闲状态
- 例行工作会被遗忘或延迟
- 你会成为瓶颈

**有了常设指令：**

- 智能体会在定义好的边界内自主执行
- 例行工作无需提示即可按计划发生
- 你只需要参与异常和审批
- 智能体会高效利用空闲时间

## 它们如何工作

常设指令定义在你的 [Agent 工作区](/zh-CN/concepts/agent-workspace)文件中。推荐做法是直接将它们包含在 `AGENTS.md` 中（它会在每个会话中自动注入），这样智能体始终能在上下文中获得这些指令。对于较大的配置，你也可以将它们放在专用文件中，例如 `standing-orders.md`，并从 `AGENTS.md` 引用它。

每个程序都指定：

1. **范围** - 智能体被授权做什么
2. **触发条件** - 何时执行（计划、事件或条件）
3. **审批卡点** - 行动前哪些事项需要人工确认
4. **升级规则** - 何时停止并请求帮助

智能体会通过工作区引导文件在每个会话中加载这些指令（完整的自动注入文件列表见 [Agent 工作区](/zh-CN/concepts/agent-workspace)），并结合用于基于时间强制执行的 [cron 任务](/zh-CN/automation/cron-jobs) 来按指令执行。

<Tip>
将常设指令放在 `AGENTS.md` 中，以保证每个会话都会加载它们。工作区引导会自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，但不会注入子目录中的任意文件。
</Tip>

## 常设指令的组成

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## 常设指令加 cron 任务

常设指令定义智能体被授权做**什么**。[Cron 任务](/zh-CN/automation/cron-jobs)定义它**何时**发生。它们协同工作：

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

cron 任务提示应引用常设指令，而不是重复它：

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## 示例

### 示例 1：内容与社交媒体（每周周期）

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

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

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 示例 3：监控与告警（持续）

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

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## 执行-验证-报告模式

常设指令与严格的执行纪律结合时效果最佳。常设指令中的每个任务都应遵循这个循环：

1. **执行** - 完成实际工作（不要只是确认指令）
2. **验证** - 确认结果正确（文件存在、消息已送达、数据已解析）
3. **报告** - 告诉所有者完成了什么，以及验证了什么

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

这种模式可以避免最常见的智能体失败模式：确认任务却没有完成任务。

## 多程序架构

对于管理多个关注点的智能体，请将常设指令组织成边界清晰的独立程序：

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

- 自己的**触发节奏**（每周、每月、事件驱动、持续）
- 自己的**审批卡点**（有些程序需要比其他程序更多的监督）
- 清晰的**边界**（智能体应知道一个程序在哪里结束，另一个程序从哪里开始）

## 最佳实践

### 应该做

- 从较窄的权限开始，并随着信任建立逐步扩展
- 为高风险操作定义明确的审批卡点
- 包含“不要做什么”部分，边界和权限同样重要
- 结合 cron 任务实现可靠的基于时间的执行
- 每周查看智能体日志，验证常设指令是否被遵循
- 随着你的需求演变更新常设指令，它们是活文档

### 避免

- 第一天就授予宽泛权限（“做你认为最好的事”）
- 跳过升级规则，每个程序都需要“何时停止并询问”的条款
- 假设智能体会记住口头指令，请把所有内容写进文件
- 将多个关注点混在一个程序中，不同领域使用不同程序
- 忘记用 cron 任务强制执行，没有触发条件的常设指令会变成建议

## 相关

- [自动化和任务](/zh-CN/automation)：所有自动化机制一览。
- [Cron 任务](/zh-CN/automation/cron-jobs)：常设指令的计划强制执行。
- [钩子](/zh-CN/automation/hooks)：用于智能体生命周期事件的事件驱动脚本。
- [Webhook](/zh-CN/automation/cron-jobs#webhooks)：入站 HTTP 事件触发器。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：常设指令的存放位置，包括完整的自动注入引导文件列表（`AGENTS.md`、`SOUL.md` 等）。
