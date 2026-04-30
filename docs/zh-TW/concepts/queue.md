---
read_when:
    - 變更自動回覆的執行或並行處理
    - 說明 /queue 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與各工作階段覆寫設定
title: 命令佇列
x-i18n:
    generated_at: "2026-04-30T03:02:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

我們會透過一個小型的程序內佇列，序列化入站自動回覆執行（所有頻道），以避免多個代理執行互相碰撞，同時仍允許跨工作階段的安全平行處理。

## 原因

- 自動回覆執行可能成本高昂（LLM 呼叫），且當多個入站訊息接近同時抵達時可能會互相碰撞。
- 序列化可避免競爭共享資源（工作階段檔案、記錄、CLI stdin），並降低觸發上游速率限制的機率。

## 運作方式

- 具執行線感知能力的 FIFO 佇列，會以可設定的並行上限排空每個執行線（未設定執行線預設為 1；main 預設為 4，subagent 為 8）。
- `runEmbeddedPiAgent` 會依 **工作階段鍵**（執行線 `session:<key>`）排入佇列，以保證每個工作階段同時只有一個作用中的執行。
- 接著每個工作階段執行會再排入 **全域執行線**（預設為 `main`），因此整體平行度會受 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細記錄時，排隊的執行若在啟動前等待超過約 2 秒，會輸出簡短通知。
- 輸入指示器仍會在排入佇列時立即觸發（若該頻道支援），因此在等待輪到我們執行時，使用者體驗不會改變。

## 預設值

未設定時，所有入站頻道介面都會使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是預設值，因為它能讓作用中的模型回合保持回應性，而不會
啟動第二個工作階段執行。它會排空在下一個模型邊界前抵達的所有 steering 訊息。
如果目前執行無法接受 steering，
OpenClaw 會退回到一個 followup 佇列項目。

## 佇列模式

入站訊息可以 steering 目前執行、等待後續回合，或兩者並行：

- `steer`：將 steering 訊息排入作用中的執行階段。Pi 會在**目前助理回合完成工具呼叫執行後**、下一次 LLM 呼叫前，傳遞所有待處理的 steering 訊息；Codex app-server 會接收一個批次的 `turn/steer`。如果執行未處於作用中串流狀態，或 steering 不可用，OpenClaw 會退回到一個 followup 佇列項目。
- `queue`（舊版）：舊的一次一則 steering。Pi 會在每個模型邊界傳遞一則已排隊的 steering 訊息；Codex app-server 會接收個別的 `turn/steer` 請求。除非你需要先前的序列化行為，否則請優先使用 `steer`。
- `followup`：在目前執行結束後，將每則訊息排入稍後的代理回合。
- `collect`：在靜默視窗後，將已排隊訊息合併成**單一**後續回合。如果訊息指向不同頻道/執行緒，會個別排空以保留路由。
- `steer-backlog`（又稱 `steer+backlog`）：立即 steering，**並且**保留同一則訊息供後續回合使用。
- `interrupt`（舊版）：中止該工作階段的作用中執行，然後執行最新訊息。

Steer-backlog 表示你可能會在被 steered 的執行後收到後續回應，因此
串流介面看起來可能像重複回應。如果你想要
每則入站訊息只產生一個回應，請優先使用 `collect`/`steer`。

如需執行階段特定的時序與相依性行為，請參閱
[Steering 佇列](/zh-TW/concepts/queue-steering)。

透過 `messages.queue` 進行全域或每個頻道設定：

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 佇列選項

選項會套用到 `followup`、`collect` 和 `steer-backlog`（以及 steering 退回到 followup 時的 `steer` 或舊版 `queue`）：

- `debounceMs`：排空已排隊 followups 前的靜默視窗。單純數字代表毫秒；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段可排隊的訊息上限。低於 `1` 的值會被忽略。
- `drop: "summarize"`：預設值。視需要丟棄最舊的佇列項目，保留精簡摘要，並將其注入為合成的 followup 提示。
- `drop: "old"`：視需要丟棄最舊的佇列項目，不保留摘要。
- `drop: "new"`：當佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 優先順序

針對模式選擇，OpenClaw 會依序解析：

1. 內嵌或已儲存的每工作階段 `/queue` 覆寫。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

針對選項，內嵌或已儲存的 `/queue` 選項優先於設定。接著會套用
頻道特定 debounce（`messages.queue.debounceMsByChannel`）、Plugin
debounce 預設值、全域 `messages.queue` 選項，以及內建預設值。
`cap` 和 `drop` 是全域/工作階段選項，不是每頻道設定
鍵。

## 每工作階段覆寫

- 以獨立命令傳送 `/queue <mode>`，即可儲存目前工作階段的模式。
- 選項可以合併使用：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫。

## 範圍與保證

- 適用於所有使用 Gateway 回覆管線的入站頻道上的自動回覆代理執行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 預設執行線（`main`）在程序範圍內供入站 + main heartbeats 使用；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他執行線（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此背景工作可以平行執行，而不會阻塞入站回覆。隔離的 cron 代理回合會持有一個 `cron` 槽位，而其內部代理執行會使用 `cron-nested`；兩者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流程會保留自己的執行線行為。這些分離執行會被追蹤為[背景任務](/zh-TW/automation/tasks)。
- 每工作階段執行線保證同一時間只有一個代理執行會觸碰指定工作階段。
- 沒有外部相依性或背景工作執行緒；純 TypeScript + promises。

## 疑難排解

- 如果命令看似卡住，請啟用詳細記錄，並尋找「queued for …ms」這類行，以確認佇列正在排空。
- 如果你需要佇列深度，請啟用詳細記錄並觀察佇列時序行。
- 啟用診斷時，工作階段若在超過 `diagnostics.stuckSessionWarnMs` 後仍停留在 `processing`，會記錄卡住工作階段警告。作用中的嵌入式執行、作用中的回覆操作，以及作用中的執行線任務，預設仍只會警告；若啟動時的陳舊簿記沒有作用中的工作階段工作，則可釋放受影響的工作階段執行線，讓已排隊工作繼續排空。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [Steering 佇列](/zh-TW/concepts/queue-steering)
- [重試政策](/zh-TW/concepts/retry)
