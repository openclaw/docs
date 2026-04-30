---
read_when:
    - 變更自動回覆執行或並行性
    - 說明 /queue 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與逐工作階段覆寫
title: 命令佇列
x-i18n:
    generated_at: "2026-04-30T18:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

我們透過極小型的處理序內佇列序列化傳入的自動回覆執行作業（所有通道），以防止多個代理程式執行作業互相衝突，同時仍允許跨工作階段的安全平行處理。

## 原因

- 自動回覆執行作業可能成本很高（LLM 呼叫），而且當多則傳入訊息在短時間內抵達時可能會互相衝突。
- 序列化可避免競爭共用資源（工作階段檔案、記錄、CLI stdin），並降低觸發上游速率限制的機率。

## 運作方式

- 具備通道感知能力的 FIFO 佇列會以可設定的並行上限清空每個通道（未設定通道預設為 1；main 預設為 4，subagent 為 8）。
- `runEmbeddedPiAgent` 會依 **工作階段鍵**（通道 `session:<key>`）入列，以保證每個工作階段一次只有一個作用中的執行作業。
- 接著，每個工作階段執行作業會被排入 **全域通道**（預設為 `main`），因此整體平行度會由 `agents.defaults.maxConcurrent` 設定上限。
- 啟用詳細記錄時，如果已入列的執行作業在開始前等待超過約 2 秒，會發出簡短通知。
- 輸入中指示器仍會在入列時立即觸發（若通道支援），因此在等待輪到我們處理時，使用者體驗不會改變。

## 預設值

未設定時，所有傳入通道介面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是預設值，因為它能讓作用中的模型回合保持回應性，而不會
啟動第二個工作階段執行作業。它會清空所有在下一個模型邊界之前抵達的引導訊息。
如果目前的執行作業無法接受引導，OpenClaw 會退回到後續佇列項目。

## 佇列模式

傳入訊息可以引導目前的執行作業、等待後續回合，或兩者都做：

- `steer`：將引導訊息排入作用中執行階段。Pi 會在**目前助理回合完成其工具呼叫的執行之後**、下一次 LLM 呼叫之前，遞送所有待處理的引導訊息；Codex app-server 會收到一個批次化的 `turn/steer`。如果執行作業沒有正在主動串流，或無法使用引導，OpenClaw 會退回到後續佇列項目。
- `queue`（舊版）：舊的一次一則引導。Pi 會在每個模型邊界遞送一則已入列的引導訊息；Codex app-server 會收到個別的 `turn/steer` 要求。除非你需要先前的序列化行為，否則建議使用 `steer`。
- `followup`：將每則訊息排入佇列，在目前執行作業結束後供稍後的代理程式回合使用。
- `collect`：在靜默視窗之後，將已入列的訊息合併成**單一**後續回合。如果訊息指向不同通道/執行緒，會個別清空以保留路由。
- `steer-backlog`（又稱 `steer+backlog`）：立即引導，**並且**保留同一則訊息供後續回合使用。
- `interrupt`（舊版）：中止該工作階段的作用中執行作業，然後執行最新訊息。

Steer-backlog 代表你可能會在已引導的執行作業之後取得後續回應，因此
串流介面看起來可能像重複。若你希望每則傳入訊息只產生一個回應，
請優先使用 `collect`/`steer`。

如需執行階段特定的時序與依賴行為，請參閱
[引導佇列](/zh-TW/concepts/queue-steering)。

透過 `messages.queue` 進行全域或每個通道設定：

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

選項適用於 `followup`、`collect` 和 `steer-backlog`（以及當引導退回到後續時的 `steer` 或舊版 `queue`）：

- `debounceMs`：清空已入列後續項目前的靜默視窗。純數字代表毫秒；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段最多可入列的訊息數。低於 `1` 的值會被忽略。
- `drop: "summarize"`：預設值。視需要丟棄最舊的已入列項目，保留精簡摘要，並將其注入為合成的後續提示。
- `drop: "old"`：視需要丟棄最舊的已入列項目，不保留摘要。
- `drop: "new"`：佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 優先順序

在模式選擇上，OpenClaw 會依序解析：

1. 行內或已儲存的每工作階段 `/queue` 覆寫。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

對於選項，行內或已儲存的 `/queue` 選項優先於設定。接著會套用
通道特定的 debounce（`messages.queue.debounceMsByChannel`）、Plugin
debounce 預設值、全域 `messages.queue` 選項，以及內建預設值。
`cap` 和 `drop` 是全域/工作階段選項，不是每通道設定鍵。

## 每工作階段覆寫

- 將 `/queue <mode>` 作為獨立命令傳送，以儲存目前工作階段的模式。
- 選項可以合併：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫。

## 範圍與保證

- 適用於所有使用 Gateway 回覆管線的傳入通道上的自動回覆代理程式執行作業（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 預設通道（`main`）在處理序範圍內供傳入訊息 + 主要 Heartbeat 共用；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此背景工作可以平行執行，而不會阻塞傳入回覆。隔離的 Cron 代理程式回合會在其內部代理程式執行使用 `cron-nested` 時持有一個 `cron` 槽位；兩者都使用 `cron.maxConcurrentRuns`。共用的非 Cron `nested` 流程會保留自身的通道行為。這些分離的執行作業會被追蹤為[背景工作](/zh-TW/automation/tasks)。
- 每工作階段通道保證一次只有一個代理程式執行作業會觸及指定工作階段。
- 沒有外部依賴或背景工作執行緒；純 TypeScript + promises。

## 疑難排解

- 如果命令看似卡住，請啟用詳細記錄，並尋找「queued for …ms」行以確認佇列正在清空。
- 如果你需要佇列深度，請啟用詳細記錄並觀察佇列時序行。
- 接受一個回合後停止發出進度的 Codex app-server 執行作業，會由 Codex 配接器中斷，因此作用中的工作階段通道可以釋放，而不是等待外層執行作業逾時。
- 啟用診斷時，在超過 `diagnostics.stuckSessionWarnMs` 後仍維持在 `processing` 的工作階段會記錄卡住工作階段警告。作用中的嵌入式執行作業、作用中的回覆操作，以及作用中的通道工作預設仍只會警告；沒有作用中工作階段工作的過時啟動帳務記錄，可以釋放受影響的工作階段通道，使已入列工作得以清空。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [引導佇列](/zh-TW/concepts/queue-steering)
- [重試政策](/zh-TW/concepts/retry)
