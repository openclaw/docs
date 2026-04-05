---
read_when:
    - 设置无需针对每个任务单独提示的自主智能体工作流时
    - 定义智能体可以独立执行的内容与需要人工批准的内容时
    - 构建具有清晰边界和升级规则的多程序智能体时
summary: 为自主运行且无需逐项提示的智能体程序定义永久操作权限
title: 常设指令
x-i18n:
    generated_at: "2026-04-05T08:13:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81347d7a51a6ce20e6493277afee92073770f69a91a2e6b3bf87b99bb586d038
    source_path: automation/standing-orders.md
    workflow: 15
---

# 常设指令

常设指令会为你的智能体授予已定义程序的**永久操作权限**。你不必每次都单独下达任务指令，而是可以定义具有明确范围、触发条件和升级规则的程序——智能体会在这些边界内自主执行。

这就像每周五都告诉你的助手“发送每周报告”，与授予常设权限之间的区别：“每周报告由你负责。每周五完成汇总并发送，只有在发现异常时才升级处理。”

## 为什么要使用常设指令？

**没有常设指令时：**

- 你必须为每个任务都提示智能体
- 智能体会在请求之间处于空闲状态
- 常规工作会被遗忘或延迟
- 你会成为瓶颈

**使用常设指令时：**

- 智能体会在定义好的边界内自主执行
- 常规工作会按计划进行，无需提示
- 你只需介入异常情况和审批事项
- 智能体会高效利用空闲时间

## 工作方式

常设指令定义在你的[智能体工作区](/concepts/agent-workspace)文件中。推荐做法是将它们直接写入 `AGENTS.md`（每个会话都会自动注入），这样智能体始终能在上下文中获取这些信息。对于更大的配置，你也可以将它们放在专门的文件中，例如 `standing-orders.md`，然后从 `AGENTS.md` 中引用。

每个程序应指定：

1. **范围**——智能体被授权执行的内容
2. **触发条件**——何时执行（计划、事件或条件）
3. **审批关卡**——执行前哪些事项需要人工签字确认
4. **升级规则**——何时停止并寻求帮助

智能体会通过工作区引导文件在每个会话中加载这些说明（自动注入文件的完整列表见[智能体工作区](/concepts/agent-workspace)），并结合 [cron jobs](/automation/cron-jobs) 来执行基于时间的约束。

<Tip>
将常设指令放在 `AGENTS.md` 中，以确保它们在每个会话中都会被加载。工作区引导流程会自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，但不会自动注入子目录中的任意文件。
</Tip>

## 常设指令的结构

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

## 常设指令 + Cron Jobs

常设指令定义智能体被授权执行**什么**。[Cron jobs](/automation/cron-jobs) 定义它**何时**发生。二者协同工作：

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron job 提示应引用常设指令，而不是重复其内容：

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

常设指令在与严格的执行纪律结合时效果最佳。常设指令中的每项任务都应遵循以下循环：

1. **执行**——完成实际工作（不要只是确认收到指令）
2. **验证**——确认结果正确（文件存在、消息已送达、数据已解析）
3. **汇报**——告诉所有者已完成什么，以及验证了什么

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

这种模式可以防止最常见的智能体失效方式：口头确认任务，却没有真正完成它。

## 多程序架构

对于需要管理多个领域的智能体，应将常设指令组织为边界清晰的独立程序：

```markdown
# Standing Orders

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

- 各自的**触发节奏**（每周、每月、事件驱动、持续运行）
- 各自的**审批关卡**（有些程序比其他程序需要更多监督）
- 清晰的**边界**（智能体应知道一个程序在哪里结束、另一个程序从哪里开始）

## 最佳实践

### 建议这样做

- 从较窄的授权范围开始，随着信任建立逐步扩展
- 为高风险操作定义明确的审批关卡
- 加入“不要做什么”部分——边界与权限同样重要
- 结合 cron jobs，实现可靠的基于时间的执行
- 每周查看智能体日志，以验证常设指令是否得到遵循
- 随着你的需求变化更新常设指令——它们是持续演进的文档

### 避免这样做

- 第一天就授予过宽权限（“做你认为最好的任何事”）
- 跳过升级规则——每个程序都需要“什么时候停止并提问”的条款
- 假设智能体会记住口头指令——把所有内容都写进文件
- 将多个事项混在同一个程序中——不同领域应拆分为不同程序
- 忘记用 cron jobs 强制执行——没有触发器的常设指令只会变成建议

## 相关内容

- [自动化与任务](/automation)——一览所有自动化机制
- [Cron Jobs](/automation/cron-jobs)——常设指令的计划执行机制
- [Hooks](/automation/hooks)——用于智能体生命周期事件的事件驱动脚本
- [Webhooks](/automation/cron-jobs#webhooks)——入站 HTTP 事件触发器
- [智能体工作区](/concepts/agent-workspace)——常设指令的存放位置，包括自动注入的完整引导文件列表（AGENTS.md、SOUL.md 等）
