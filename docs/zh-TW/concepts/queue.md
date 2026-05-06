---
read_when:
    - 變更自動回覆的執行或並行性
    - 說明 /queue 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與每個工作階段的覆寫
title: 命令佇列
x-i18n:
    generated_at: "2026-05-06T09:07:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

我們會透過一個小型的程序內佇列，序列化傳入的自動回覆執行（所有通道），以防止多個代理執行互相碰撞，同時仍允許跨工作階段的安全並行。

## 原因

- 自動回覆執行可能很昂貴（LLM 呼叫），且當多則傳入訊息密集抵達時可能互相碰撞。
- 序列化可避免競用共用資源（工作階段檔案、記錄、CLI stdin），並降低觸發上游速率限制的機率。

## 運作方式

- 一個具備執行通道感知能力的 FIFO 佇列，會以可設定的並行上限排空每個執行通道（未設定執行通道預設為 1；main 預設為 4，subagent 預設為 8）。
- `runEmbeddedPiAgent` 會依 **工作階段鍵**（執行通道 `session:<key>`）入列，以保證每個工作階段同一時間只有一個作用中的執行。
- 接著每個工作階段執行會被排入 **全域執行通道**（預設為 `main`），因此整體並行度會受到 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細記錄時，如果排入佇列的執行在開始前等待超過約 2 秒，會發出一則短通知。
- 輸入指示器仍會在入列時立即觸發（若通道支援），因此使用者體驗在等待輪到自己時不會改變。

## 預設值

未設定時，所有傳入通道介面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是預設值，因為它能讓作用中的模型回合保持回應性，而不需要
啟動第二個工作階段執行。它會排空下一個模型邊界前抵達的所有轉向訊息。
如果目前執行無法接受轉向，OpenClaw 會退回到後續佇列項目。

## 佇列模式

傳入訊息可以轉向目前執行、等待後續回合，或兩者都做：

- `steer`：將轉向訊息排入作用中的執行階段。Pi 會在 **目前助理回合完成工具呼叫執行後**、下一次 LLM 呼叫前，傳遞所有待處理的轉向訊息；Codex app-server 會收到一個批次的 `turn/steer`。如果執行並非作用中串流，或無法使用轉向，OpenClaw 會退回到後續佇列項目。
- `queue`（舊版）：舊的一次一則轉向。Pi 會在每個模型邊界傳遞一則已排入佇列的轉向訊息；Codex app-server 會收到個別的 `turn/steer` 請求。除非你需要先前的序列化行為，否則請優先使用 `steer`。
- `followup`：將每則訊息排入目前執行結束後的後續代理回合。
- `collect`：在安靜視窗後，將已排入佇列的訊息合併成 **單一** 後續回合。如果訊息目標是不同通道/執行緒，則會個別排空以保留路由。
- `steer-backlog`（又稱 `steer+backlog`）：現在轉向，**並且**保留同一則訊息供後續回合使用。
- `interrupt`（舊版）：中止該工作階段的作用中執行，然後執行最新訊息。

Steer-backlog 表示你可能會在已轉向的執行之後得到後續回應，因此
串流介面可能看起來像重複。若你想要每則傳入訊息只有一個回應，請優先使用
`collect`/`steer`。

如需執行階段特定的時序與相依性行為，請參閱
[轉向佇列](/zh-TW/concepts/queue-steering)。如需明確的 `/steer <message>`
命令，請參閱 [Steer](/zh-TW/tools/steer)。

透過 `messages.queue` 進行全域或逐通道設定：

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

選項適用於 `followup`、`collect` 和 `steer-backlog`（以及當轉向退回到後續時的 `steer` 或舊版 `queue`）：

- `debounceMs`：排空已排入佇列的後續項目前的安靜視窗。裸數字代表毫秒；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段最多排入佇列的訊息數。低於 `1` 的值會被忽略。
- `drop: "summarize"`：預設值。視需要丟棄最舊的佇列項目，保留精簡摘要，並將其作為合成後續提示注入。
- `drop: "old"`：視需要丟棄最舊的佇列項目，不保留摘要。
- `drop: "new"`：當佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 優先順序

對於模式選擇，OpenClaw 會依序解析：

1. 行內或已儲存的逐工作階段 `/queue` 覆寫。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

對於選項，行內或已儲存的 `/queue` 選項優先於設定。接著會套用
通道特定 debounce（`messages.queue.debounceMsByChannel`）、Plugin
debounce 預設值、全域 `messages.queue` 選項，以及內建預設值。
`cap` 和 `drop` 是全域/工作階段選項，不是逐通道設定鍵。

## 逐工作階段覆寫

- 傳送 `/queue <mode>` 作為獨立命令，以儲存目前工作階段的模式。
- 選項可以合併：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫。

## 範圍與保證

- 適用於所有使用 Gateway 回覆管線的傳入通道自動回覆代理執行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 預設執行通道（`main`）對傳入 + 主要 Heartbeat 來說是程序範圍；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段並行。
- 可能存在其他執行通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），讓背景工作可並行執行而不阻塞傳入回覆。隔離的 cron 代理回合會持有一個 `cron` 槽位，而其內部代理執行會使用 `cron-nested`；兩者都使用 `cron.maxConcurrentRuns`。共用的非 cron `nested` 流程會保留自己的執行通道行為。這些分離的執行會被追蹤為[背景任務](/zh-TW/automation/tasks)。
- 逐工作階段執行通道保證同一時間只有一個代理執行會觸碰指定工作階段。
- 沒有外部相依性或背景工作執行緒；純 TypeScript + promises。

## 疑難排解

- 如果命令看起來卡住，請啟用詳細記錄並尋找 "queued for ...ms" 行，以確認佇列正在排空。
- 如果你需要佇列深度，請啟用詳細記錄並觀察佇列時序行。
- 接受回合後停止發出進度的 Codex app-server 執行，會由 Codex adapter 中斷，讓作用中的工作階段執行通道可以釋放，而不是等待外層執行逾時。
- 啟用診斷時，若工作階段在超過 `diagnostics.stuckSessionWarnMs` 後仍停留在 `processing`，且沒有觀察到回覆、工具、狀態、區塊或 ACP 進度，會依目前活動分類。作用中工作會記錄為 `session.long_running`；沒有近期進度的作用中工作會記錄為 `session.stalled`；`session.stuck` 保留給沒有作用中工作的過期工作階段簿記，且只有該路徑可以釋放受影響的工作階段執行通道，讓已排入佇列的工作排空。重複的 `session.stuck` 診斷會在工作階段維持不變時退避。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [轉向佇列](/zh-TW/concepts/queue-steering)
- [Steer](/zh-TW/tools/steer)
- [重試政策](/zh-TW/concepts/retry)
