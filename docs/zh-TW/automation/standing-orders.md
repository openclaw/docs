---
read_when:
    - 設定無需針對每項任務提示即可執行的自主代理工作流程
    - 定義代理可以獨立執行的事項，以及需要人工核准的事項
    - 使用清楚的邊界與升級規則來建構多程式代理程式
summary: 定義自主代理程式的永久操作權限
title: 常設指令
x-i18n:
    generated_at: "2026-04-30T02:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

常設指令會授予你的代理程式針對定義好方案的**永久操作權限**。你不必每次都提供個別任務指示，而是定義具備明確範圍、觸發條件與升級規則的方案，代理程式會在這些邊界內自主執行。

這就像是每週五告訴你的助理「寄送週報」，與授予常設權限之間的差異：「週報由你負責。每週五彙整、寄出，只有在看起來有問題時才升級處理。」

## 為什麼需要常設指令

**沒有常設指令時：**

- 你必須為每個任務提示代理程式
- 代理程式會在請求之間閒置
- 例行工作會被忘記或延誤
- 你會變成瓶頸

**有常設指令時：**

- 代理程式會在定義好的邊界內自主執行
- 例行工作會按時發生，無需提示
- 你只需介入例外與核准事項
- 代理程式能有效利用閒置時間

## 運作方式

常設指令定義在你的[代理程式工作區](/zh-TW/concepts/agent-workspace)檔案中。建議做法是直接放在 `AGENTS.md` 中（每個工作階段會自動注入），讓代理程式永遠能在脈絡中取得它們。對於較大型的設定，你也可以把它們放在像 `standing-orders.md` 這樣的專用檔案中，並從 `AGENTS.md` 參照它。

每個方案都會指定：

1. **範圍** — 代理程式被授權執行的事項
2. **觸發條件** — 何時執行（排程、事件或條件）
3. **核准關卡** — 採取行動前哪些事項需要人工簽核
4. **升級規則** — 何時停止並請求協助

代理程式會透過工作區啟動檔案在每個工作階段載入這些指示（完整的自動注入檔案清單請見[代理程式工作區](/zh-TW/concepts/agent-workspace)），並結合[Cron 工作](/zh-TW/automation/cron-jobs)執行，以便進行以時間為基礎的強制執行。

<Tip>
把常設指令放在 `AGENTS.md` 中，以確保每個工作階段都會載入。工作區啟動程序會自動注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 與 `MEMORY.md`，但不會注入子目錄中的任意檔案。
</Tip>

## 常設指令的結構

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

## 常設指令加上 Cron 工作

常設指令定義代理程式被授權執行的**事項**。[Cron 工作](/zh-TW/automation/cron-jobs)定義它發生的**時間**。兩者會一起運作：

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron 工作提示應該參照常設指令，而不是重複其內容：

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

## 範例

### 範例 1：內容與社群媒體（每週週期）

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

### 範例 3：監控與警示（連續）

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

## 執行、驗證、回報模式

常設指令搭配嚴格的執行紀律時效果最好。常設指令中的每個任務都應遵循這個循環：

1. **執行** — 完成實際工作（不要只是確認收到指示）
2. **驗證** — 確認結果正確（檔案存在、訊息已送達、資料已解析）
3. **回報** — 告訴擁有者已完成哪些事項，以及已驗證哪些事項

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

這個模式能避免最常見的代理程式失敗模式：確認任務但沒有完成它。

## 多方案架構

對於管理多個關注領域的代理程式，請將常設指令組織成邊界清楚的獨立方案：

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

每個方案都應具備：

- 自己的**觸發節奏**（每週、每月、事件驅動、連續）
- 自己的**核准關卡**（有些方案需要比其他方案更多監督）
- 清楚的**邊界**（代理程式應知道一個方案在哪裡結束，另一個方案在哪裡開始）

## 最佳實務

### 應該做

- 從狹窄權限開始，隨著信任建立再擴大
- 為高風險動作定義明確的核准關卡
- 包含「不該做什麼」區段，邊界和權限一樣重要
- 結合 Cron 工作，以可靠地執行以時間為基礎的任務
- 每週檢閱代理程式日誌，確認常設指令有被遵循
- 隨著需求演進更新常設指令；它們是持續變動的文件

### 避免

- 第一天就授予廣泛權限（「做你認為最好的事」）
- 省略升級規則；每個方案都需要「何時停止並詢問」條款
- 假設代理程式會記得口頭指示；把所有內容都放進檔案
- 在單一方案中混合不同關注領域；為不同領域分開建立方案
- 忘記用 Cron 工作強制執行；沒有觸發條件的常設指令會變成建議

## 相關

- [自動化與任務](/zh-TW/automation)：所有自動化機制一覽。
- [Cron 工作](/zh-TW/automation/cron-jobs)：常設指令的排程強制執行。
- [Hook](/zh-TW/automation/hooks)：用於代理程式生命週期事件的事件驅動指令碼。
- [Webhook](/zh-TW/automation/cron-jobs#webhooks)：傳入的 HTTP 事件觸發條件。
- [代理程式工作區](/zh-TW/concepts/agent-workspace)：常設指令所在的位置，包括完整的自動注入啟動檔案清單（`AGENTS.md`、`SOUL.md` 等）。
