---
read_when:
    - 變更自動回覆的執行或並行處理
    - 說明 /queue 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與各工作階段覆寫
title: 命令佇列
x-i18n:
    generated_at: "2026-05-02T02:48:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

我們會透過一個小型的處理序內佇列序列化入站自動回覆執行（所有頻道），以防止多個代理執行互相衝突，同時仍允許跨工作階段的安全平行處理。

## 原因

- 自動回覆執行可能成本高昂（LLM 呼叫），且當多個入站訊息在相近時間抵達時可能互相衝突。
- 序列化可避免競爭共用資源（工作階段檔案、日誌、CLI stdin），並降低觸發上游速率限制的機率。

## 運作方式

- 可感知通道的 FIFO 佇列會以可設定的並行上限排空每個通道（未設定通道預設為 1；main 預設為 4，subagent 預設為 8）。
- `runEmbeddedPiAgent` 會依 **工作階段金鑰**（通道 `session:<key>`）入列，以保證每個工作階段同時只有一個作用中的執行。
- 接著每個工作階段執行會被排入 **全域通道**（預設為 `main`），因此整體平行度會受 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細記錄時，若入列執行在開始前等待超過約 2 秒，會發出簡短通知。
- 輸入中指示器仍會在入列時立即觸發（若頻道支援），因此使用者體驗在等待輪到我們時不會改變。

## 預設值

未設定時，所有入站頻道介面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是預設值，因為它能讓作用中的模型回合保持回應性，而不會啟動第二個工作階段執行。它會排空在下一個模型邊界之前抵達的所有導向訊息。如果目前執行無法接受導向，OpenClaw 會退回到後續佇列項目。

## 佇列模式

入站訊息可以導向目前執行、等待後續回合，或兩者皆做：

- `steer`：將導向訊息排入作用中的執行環境。Pi 會在 **目前助理回合完成執行其工具呼叫之後**、下一次 LLM 呼叫之前，傳遞所有待處理的導向訊息；Codex app-server 會收到一個批次化的 `turn/steer`。如果執行並非正在主動串流，或導向不可用，OpenClaw 會退回到後續佇列項目。
- `queue`（舊版）：舊的一次一則導向。Pi 會在每個模型邊界傳遞一則已排入佇列的導向訊息；Codex app-server 會收到個別的 `turn/steer` 請求。除非你需要先前的序列化行為，否則請優先使用 `steer`。
- `followup`：在目前執行結束後，將每則訊息排入稍後的代理回合。
- `collect`：在安靜視窗後，將已排入佇列的訊息合併成 **單一** 後續回合。如果訊息目標是不同頻道/執行緒，它們會個別排空以保留路由。
- `steer-backlog`（也稱為 `steer+backlog`）：現在導向，**並且**保留相同訊息用於後續回合。
- `interrupt`（舊版）：中止該工作階段的作用中執行，然後執行最新訊息。

Steer-backlog 表示你可能會在已導向執行之後收到後續回應，因此串流介面可能看起來像重複。若你想要每則入站訊息只產生一個回應，請優先使用 `collect`/`steer`。

如需執行環境特定的時序與相依性行為，請參閱
[導向佇列](/zh-TW/concepts/queue-steering)。

透過 `messages.queue` 進行全域或按頻道設定：

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

選項適用於 `followup`、`collect` 和 `steer-backlog`（也適用於導向退回到後續項目時的 `steer` 或舊版 `queue`）：

- `debounceMs`：排空已排入佇列的後續項目前的安靜視窗。裸數字為毫秒；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段的最大已排入佇列訊息數。低於 `1` 的值會被忽略。
- `drop: "summarize"`：預設值。視需要捨棄最舊的已排入佇列項目，保留精簡摘要，並將它們注入為合成的後續提示。
- `drop: "old"`：視需要捨棄最舊的已排入佇列項目，不保留摘要。
- `drop: "new"`：當佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 優先順序

對於模式選擇，OpenClaw 會解析：

1. 行內或已儲存的每工作階段 `/queue` 覆寫。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

對於選項，行內或已儲存的 `/queue` 選項優先於設定。接著會套用頻道特定的防抖（`messages.queue.debounceMsByChannel`）、Plugin 防抖預設值、全域 `messages.queue` 選項，以及內建預設值。`cap` 和 `drop` 是全域/工作階段選項，不是按頻道的設定鍵。

## 每工作階段覆寫

- 將 `/queue <mode>` 作為獨立命令傳送，以儲存目前工作階段的模式。
- 選項可以合併：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫。

## 範圍與保證

- 適用於所有使用 Gateway 回覆管線的入站頻道上的自動回覆代理執行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 預設通道（`main`）對入站 + 主要 Heartbeat 是處理序範圍；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此背景工作可以平行執行，而不會阻塞入站回覆。隔離的 Cron 代理回合會在其內部代理執行使用 `cron-nested` 時持有一個 `cron` 槽位；兩者都使用 `cron.maxConcurrentRuns`。共用的非 Cron `nested` 流程會保留自己的通道行為。這些分離的執行會被追蹤為[背景工作](/zh-TW/automation/tasks)。
- 每工作階段通道保證同一時間只有一個代理執行會觸碰指定工作階段。
- 無外部相依性或背景工作執行緒；純 TypeScript + promise。

## 疑難排解

- 如果命令看似卡住，請啟用詳細日誌，並尋找「queued for …ms」行，以確認佇列正在排空。
- 如果你需要佇列深度，請啟用詳細日誌並觀察佇列時序行。
- Codex app-server 執行在接受一個回合後若停止發出進度，會由 Codex adapter 中斷，讓作用中的工作階段通道可以釋放，而不是等待外部執行逾時。
- 啟用診斷時，若工作階段在超過 `diagnostics.stuckSessionWarnMs` 後仍停留在 `processing`，且未觀察到回覆、工具、狀態、區塊或 ACP 進度，會依目前活動進行分類。作用中工作會記錄為 `session.long_running`；沒有近期進度的作用中工作會記錄為 `session.stalled`；`session.stuck` 保留給沒有作用中工作的過期工作階段簿記，且只有該路徑能釋放受影響的工作階段通道，讓已排入佇列的工作排空。重複的 `session.stuck` 診斷會在工作階段維持不變時退避。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [導向佇列](/zh-TW/concepts/queue-steering)
- [重試政策](/zh-TW/concepts/retry)
