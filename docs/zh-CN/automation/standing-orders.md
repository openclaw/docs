---
read_when:
    - 设置无需针对每项任务单独提示即可运行的自主智能体工作流
    - 定义智能体可以独立执行的内容与需要人工批准的内容
    - 为多程序智能体构建具有清晰边界和升级规则的结构
summary: 为自主智能体程序定义永久运行权限
title: 常设命令
x-i18n:
    generated_at: "2026-04-27T07:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 15
---

常设命令会为你定义的程序授予智能体**永久运行权限**。你无需每次都单独下达任务指令，而是通过清晰的范围、触发条件和升级规则来定义程序——智能体将在这些边界内自主执行。

这就像每周五都告诉你的助手“发送每周报告”，与授予常设权限之间的区别：“每周报告由你负责。每周五完成汇总并发送，只有在发现异常时才升级给我处理。”

## 为什么需要常设命令

**没有常设命令时：**

- 你必须为每项任务都提示智能体
- 智能体会在请求之间处于空闲状态
- 例行工作容易被遗忘或延误
- 你会成为整个流程的瓶颈

**有常设命令时：**

- 智能体会在定义好的边界内自主执行
- 例行工作会按计划进行，无需提示
- 你只需处理例外情况和审批事项
- 智能体会高效利用空闲时间

## 它们如何工作

常设命令定义在你的[智能体工作区](/zh-CN/concepts/agent-workspace)文件中。推荐做法是将其直接写入 `AGENTS.md`（每个会话都会自动注入），这样智能体始终能在上下文中看到这些命令。对于更大的配置，你也可以把它们放在专门的文件中，例如 `standing-orders.md`，然后在 `AGENTS.md` 中引用它。

每个程序都应指定：

1. **范围**——智能体被授权执行什么
2. **触发条件**——何时执行（按计划、事件或条件）
3. **审批关卡**——哪些操作在执行前需要人工签字确认
4. **升级规则**——何时停止并请求帮助

智能体会在每个会话中通过工作区引导文件加载这些指令（完整的自动注入文件列表见[智能体工作区](/zh-CN/concepts/agent-workspace)），并结合 [cron jobs](/zh-CN/automation/cron-jobs) 来执行基于时间的强制调度。

<Tip>
将常设命令放在 `AGENTS.md` 中，以确保它们在每个会话中都会被加载。工作区引导流程会自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`——但不会注入子目录中的任意文件。
</Tip>

## 常设命令的结构

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
- Do not skip delivery if metrics look bad — report accurately
```

## 常设命令与 cron jobs

常设命令定义智能体**被授权做什么**。[Cron jobs](/zh-CN/automation/cron-jobs) 定义**何时发生**。两者配合使用：

```text
常设命令：“你负责每日收件箱分拣”
    ↓
Cron Job（每日上午 8 点）：“按照常设命令执行收件箱分拣”
    ↓
智能体：读取常设命令 → 执行步骤 → 报告结果
```

Cron job 提示应当引用常设命令，而不是重复写一遍：

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

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
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

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## 执行—验证—报告模式

常设命令与严格的执行纪律结合时效果最佳。常设命令中的每项任务都应遵循这个循环：

1. **执行**——完成实际工作（不要只是确认收到指令）
2. **验证**——确认结果正确（文件已存在、消息已送达、数据已解析）
3. **报告**——告诉所有者完成了什么，以及验证了什么

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

这种模式可以避免最常见的智能体失误：口头确认任务，却没有真正完成。

## 多程序架构

对于需要管理多个事项的智能体，应将常设命令组织为边界清晰的独立程序：

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
- 清晰的**边界**（智能体应知道一个程序何时结束、另一个程序何时开始）

## 最佳实践

### 建议这样做

- 从狭窄权限开始，随着信任建立逐步扩展
- 为高风险操作定义明确的审批关卡
- 加入“不要做什么”部分——边界和权限同样重要
- 结合 cron jobs 实现可靠的定时执行
- 每周检查一次智能体日志，确认常设命令被正确遵循
- 随着需求变化更新常设命令——它们是持续演进的文档

### 避免这样做

- 第一天就授予宽泛权限（“做你认为最好的任何事”）
- 跳过升级规则——每个程序都需要“何时停止并询问”的条款
- 假设智能体会记住口头说明——把所有内容都写进文件
- 在同一个程序中混合多个事项——不同领域应拆分成不同程序
- 忘记用 cron jobs 强制执行——没有触发条件的常设命令只会变成建议

## 相关内容

- [自动化与任务](/zh-CN/automation)：快速了解所有自动化机制。
- [Cron jobs](/zh-CN/automation/cron-jobs)：为常设命令提供计划调度。
- [Hooks](/zh-CN/automation/hooks)：用于智能体生命周期事件的事件驱动脚本。
- [Webhooks](/zh-CN/automation/cron-jobs#webhooks)：入站 HTTP 事件触发器。
- [智能体工作区](/zh-CN/concepts/agent-workspace)：常设命令的存放位置，以及完整的自动注入引导文件列表（`AGENTS.md`、`SOUL.md` 等）。
