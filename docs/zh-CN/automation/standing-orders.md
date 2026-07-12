---
read_when:
    - 设置无需针对每个任务进行提示即可运行的自主智能体工作流
    - 定义智能体可以独立执行的操作，以及需要人工审批的操作
    - 通过清晰的边界和升级规则构建多程序智能体架构
summary: 为自主智能体程序定义永久操作权限
title: 常设指令
x-i18n:
    generated_at: "2026-07-11T20:18:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

常设指令为你的智能体授予针对已定义程序的**永久操作权限**。你无需针对每项任务提示智能体，而是定义具有明确范围、触发条件和升级规则的程序，由智能体在这些边界内自主执行：“每周报告由你负责。每周五汇总并发送，仅在发现异常时升级处理。”

## 为什么使用常设指令

**没有常设指令时：**你需要针对每项任务提示智能体，例行工作容易被遗忘或延误，而你会成为瓶颈。

**使用常设指令后：**智能体会在定义的边界内自主执行，例行工作按计划完成，而你只需介入异常情况和审批事项。

## 工作原理

常设指令定义在你的 [Agent 工作区](/zh-CN/concepts/agent-workspace)文件中。推荐直接将其写入 `AGENTS.md`（每个会话都会自动注入），确保智能体始终能在上下文中获得这些指令。对于规模较大的配置，也可以将其放在 `standing-orders.md` 等专用文件中，并从 `AGENTS.md` 引用。

每个程序需指定：

1. **范围**——智能体获准执行哪些操作
2. **触发条件**——何时执行（计划、事件或条件）
3. **审批关卡**——哪些操作必须先获得人工批准
4. **升级规则**——何时停止并请求帮助

智能体会在每个会话中通过工作区引导文件加载这些指令（有关自动注入文件的完整列表，请参阅 [Agent 工作区](/zh-CN/concepts/agent-workspace)），并依照这些指令执行，同时结合 [cron 作业](/zh-CN/automation/cron-jobs)强制落实基于时间的执行要求。

<Tip>
将常设指令放入 `AGENTS.md`，以确保每个会话都会加载它们。工作区引导机制会自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，但不会注入子目录中的任意文件。
</Tip>

## 常设指令的结构

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

## 常设指令与 cron 作业

常设指令定义智能体获准执行**什么**。[Cron 作业](/zh-CN/automation/cron-jobs)定义任务在**何时**发生。两者协同工作：

```text
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

cron 作业提示应引用常设指令，而不是重复其内容：

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

### 示例 3：监控与警报（持续运行）

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

## 执行—验证—报告模式

常设指令与严格的执行纪律结合使用时效果最佳。常设指令中的每项任务都应遵循以下循环：

1. **执行**——完成实际工作（不要只是确认收到指令）
2. **验证**——确认结果正确（文件存在、消息已送达、数据已解析）
3. **报告**——告知所有者完成了什么以及验证了什么

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

此模式可防止智能体最常见的失败方式：确认收到任务，却没有完成任务。

## 多程序架构

对于需要管理多个事项的智能体，应将常设指令组织成边界清晰的独立程序：

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

- 自己的**触发频率**（每周、每月、事件驱动或持续运行）
- 自己的**审批关卡**（某些程序需要比其他程序更严格的监督）
- 清晰的**边界**（智能体应知道一个程序在哪里结束，另一个程序从哪里开始）

## 最佳实践

### 建议

- 从较窄的权限范围开始，并随着信任建立逐步扩大
- 为高风险操作定义明确的审批关卡
- 加入“禁止执行的操作”部分——边界与权限同样重要
- 与 cron 作业结合，确保基于时间的任务可靠执行
- 每周查看智能体日志，验证常设指令是否得到遵循
- 随着需求变化更新常设指令——它们是持续演进的文档

### 避免

- 第一天就授予宽泛权限（“执行你认为最合适的任何操作”）
- 省略升级规则——每个程序都需要说明“何时停止并询问”
- 假设智能体会记住口头指令——将所有内容写入文件
- 在单个程序中混合多个事项——不同领域应使用不同程序
- 忘记使用 cron 作业强制执行——没有触发条件的常设指令只会成为建议

## 相关内容

- [自动化](/zh-CN/automation)：快速了解所有自动化机制。
- [Cron 作业](/zh-CN/automation/cron-jobs)：为常设指令强制执行计划。
- [Hooks](/zh-CN/automation/hooks)：用于智能体生命周期事件的事件驱动脚本。
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)：入站 HTTP 事件触发器。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：常设指令的存放位置，包括自动注入的完整引导文件列表（`AGENTS.md`、`SOUL.md` 等）。
