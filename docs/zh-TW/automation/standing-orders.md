---
read_when:
    - 設定無需逐項任務提示即可執行的自主代理工作流程
    - 定義代理可獨立執行的事項與需要人工核准的事項
    - 以清楚的邊界與升級處理規則建構多程式代理
summary: 為自主代理程式定義永久運作權限
title: 常設指令
x-i18n:
    generated_at: "2026-05-12T00:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
    postprocess_version: locale-links-v1
---

長期指令會授予你的代理程式針對已定義方案的**永久操作權限**。你不必每次都給出個別任務指示，而是以明確範圍、觸發條件與升級規則來定義方案，代理程式便會在這些邊界內自主執行。

這就像是每週五都告訴助理「寄出週報」，與授予長期權限之間的差別：「週報由你負責。每週五彙整、寄出，只有在看起來有問題時才升級處理。」

## 為什麼需要長期指令

**沒有長期指令時：**

- 你必須為每個任務提示代理程式
- 代理程式會在請求之間閒置
- 例行工作會被遺忘或延誤
- 你會成為瓶頸

**有長期指令時：**

- 代理程式會在已定義邊界內自主執行
- 例行工作會按排程自動完成，無需提示
- 你只需介入例外狀況與核准
- 代理程式會有效利用閒置時間

## 運作方式

長期指令會定義在你的[代理程式工作區](/zh-TW/concepts/agent-workspace)檔案中。建議做法是直接放在 `AGENTS.md`（每個工作階段都會自動注入）中，讓代理程式永遠能在脈絡中取得這些指令。對於較大型的設定，你也可以將它們放在專用檔案中，例如 `standing-orders.md`，並從 `AGENTS.md` 參照。

每個方案會指定：

1. **範圍** - 代理程式被授權執行的事項
2. **觸發條件** - 何時執行（排程、事件或條件）
3. **核准關卡** - 行動前需要人工簽核的事項
4. **升級規則** - 何時停止並尋求協助

代理程式會透過工作區啟動檔案在每個工作階段載入這些指令（自動注入檔案的完整清單請參閱[代理程式工作區](/zh-TW/concepts/agent-workspace)），並結合 [cron jobs](/zh-TW/automation/cron-jobs) 進行時間型執行。

<Tip>
將長期指令放在 `AGENTS.md` 中，以保證每個工作階段都會載入。工作區啟動程序會自動注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 與 `MEMORY.md`，但不會注入子目錄中的任意檔案。
</Tip>

## 長期指令的結構

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

## 長期指令加上 cron jobs

長期指令定義代理程式被授權做**什麼**。[Cron jobs](/zh-TW/automation/cron-jobs) 定義事情在**何時**發生。兩者會一起運作：

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron job 提示應參照長期指令，而不是重複其內容：

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

## 執行、驗證、回報模式

長期指令搭配嚴格的執行紀律時效果最好。長期指令中的每個任務都應遵循此迴圈：

1. **執行** - 完成實際工作（不要只是確認收到指示）
2. **驗證** - 確認結果正確（檔案存在、訊息已送達、資料已解析）
3. **回報** - 告訴擁有者完成了什麼，以及驗證了什麼

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

這個模式能防止最常見的代理程式失敗模式：確認收到任務，卻沒有完成。

## 多方案架構

對於管理多個關注領域的代理程式，請將長期指令組織成邊界清楚的獨立方案：

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

- 自己的**觸發節奏**（每週、每月、事件驅動、持續）
- 自己的**核准關卡**（某些方案比其他方案需要更多監督）
- 清楚的**邊界**（代理程式應知道一個方案在哪裡結束，另一個方案從哪裡開始）

## 最佳實務

### 建議

- 從狹窄權限開始，隨著信任建立再擴大
- 為高風險行動定義明確的核准關卡
- 包含「不要做什麼」區段，邊界與權限同樣重要
- 搭配 cron jobs，以可靠執行時間型任務
- 每週檢閱代理程式記錄，確認長期指令正在被遵循
- 隨著需求演進更新長期指令，它們是活文件

### 避免

- 第一天就授予寬泛權限（「做你認為最好的事」）
- 省略升級規則，每個方案都需要「何時停止並詢問」條款
- 假設代理程式會記得口頭指示，請把所有內容寫進檔案
- 在單一方案中混合多種關注事項，不同領域應使用不同方案
- 忘記使用 cron jobs 強制執行，沒有觸發條件的長期指令只會變成建議

## 相關

- [自動化](/zh-TW/automation)：所有自動化機制一覽。
- [Cron jobs](/zh-TW/automation/cron-jobs)：長期指令的排程執行。
- [Hooks](/zh-TW/automation/hooks)：用於代理程式生命週期事件的事件驅動指令碼。
- [Webhooks](/zh-TW/automation/cron-jobs#webhooks)：傳入 HTTP 事件觸發器。
- [代理程式工作區](/zh-TW/concepts/agent-workspace)：長期指令存放的位置，包括自動注入啟動檔案的完整清單（`AGENTS.md`、`SOUL.md` 等）。
