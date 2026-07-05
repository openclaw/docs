---
read_when:
    - 設定無需逐項任務提示即可執行的自主代理工作流程
    - 定義代理可以獨立執行的事項，以及需要人類核准的事項
    - 以清楚的邊界與升級規則建構多程式代理
summary: 定義自主代理程式的永久操作權限
title: 常設指令
x-i18n:
    generated_at: "2026-07-05T11:01:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

常駐指令會授予你的代理針對已定義計畫的**永久操作授權**。你不是針對每個任務提示代理，而是定義具有明確範圍、觸發條件與升級規則的計畫，代理會在這些邊界內自主執行：「你負責每週報告。每週五彙整、送出，只有在看起來不對勁時才升級處理。」

## 為什麼需要常駐指令

**沒有常駐指令：**你要為每個任務提示代理，例行工作會被遺忘或延誤，而你會成為瓶頸。

**有常駐指令：**代理會在已定義的邊界內自主執行，例行工作會依排程發生，而你只需介入例外狀況與核准事項。

## 運作方式

常駐指令是在你的[代理工作區](/zh-TW/concepts/agent-workspace)檔案中定義。建議做法是直接放在 `AGENTS.md` 中（每個工作階段都會自動注入），讓代理永遠能在脈絡中取得它們。對於較大型的設定，你也可以把它們放在專用檔案中，例如 `standing-orders.md`，再從 `AGENTS.md` 參照它。

每個計畫會指定：

1. **範圍** - 代理被授權執行的事項
2. **觸發條件** - 何時執行（排程、事件或條件）
3. **核准關卡** - 哪些事項在行動前需要人工簽核
4. **升級規則** - 何時停止並尋求協助

代理會透過工作區啟動檔案在每個工作階段載入這些指令（請參閱[代理工作區](/zh-TW/concepts/agent-workspace)取得完整的自動注入檔案清單），並依據它們執行，同時結合[排程工作](/zh-TW/automation/cron-jobs)進行時間型強制執行。

<Tip>
把常駐指令放在 `AGENTS.md` 中，以確保它們每個工作階段都會載入。工作區啟動程序會自動注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，但不會注入子目錄中的任意檔案。
</Tip>

## 常駐指令的剖析

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

## 常駐指令加上排程工作

常駐指令定義代理被授權執行的**內容**。[排程工作](/zh-TW/automation/cron-jobs)定義它發生的**時間**。兩者會一起運作：

```text
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

排程工作提示應參照常駐指令，而不是重複其內容：

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

## 範例

### 範例 1：內容與社群媒體（每週週期）

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

### 範例 2：財務作業（事件觸發）

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

### 範例 3：監控與警示（持續）

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

## 執行-驗證-回報模式

常駐指令搭配嚴格的執行紀律時效果最好。常駐指令中的每個任務都應遵循這個循環：

1. **執行** - 進行實際工作（不要只是確認收到指令）
2. **驗證** - 確認結果正確（檔案存在、訊息已送達、資料已解析）
3. **回報** - 告知擁有者完成了什麼，以及驗證了什麼

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

這個模式能防止最常見的代理失敗模式：確認任務但沒有完成它。

## 多計畫架構

對於管理多個關注事項的代理，將常駐指令整理成邊界清楚的獨立計畫：

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

每個計畫都應具備：

- 自己的**觸發節奏**（每週、每月、事件驅動、持續）
- 自己的**核准關卡**（有些計畫需要比其他計畫更多監督）
- 明確的**邊界**（代理應該知道一個計畫在哪裡結束，另一個從哪裡開始）

## 最佳做法

### 建議

- 從較窄的授權開始，隨信任建立再擴大
- 為高風險動作定義明確的核准關卡
- 納入「不要做什麼」章節，邊界和權限一樣重要
- 搭配排程工作，確保可靠的時間型執行
- 每週檢閱代理記錄，確認常駐指令正在被遵循
- 隨著需求演進更新常駐指令，它們是持續演進的文件

### 避免

- 第一天就授予廣泛權限（「做你認為最好的事」）
- 略過升級規則，每個計畫都需要「何時停止並詢問」條款
- 假設代理會記得口頭指示，請把所有內容放進檔案
- 在單一計畫中混合多種關注事項，為不同領域分開建立計畫
- 忘記用排程工作強制執行，沒有觸發條件的常駐指令會變成建議

## 相關

- [自動化](/zh-TW/automation)：所有自動化機制一覽。
- [排程工作](/zh-TW/automation/cron-jobs)：常駐指令的排程強制執行。
- [鉤子](/zh-TW/automation/hooks)：用於代理生命週期事件的事件驅動指令碼。
- [網路鉤子](/zh-TW/automation/cron-jobs#webhooks)：入站 HTTP 事件觸發條件。
- [代理工作區](/zh-TW/concepts/agent-workspace)：常駐指令存放的位置，包含完整的自動注入啟動檔案清單（`AGENTS.md`、`SOUL.md` 等）。
