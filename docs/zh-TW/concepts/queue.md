---
read_when:
    - 變更自動回覆執行或並行
    - 說明 /queue 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與個別工作階段覆寫
title: 命令佇列
x-i18n:
    generated_at: "2026-06-27T19:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

我們透過一個極小的程序內佇列，序列化所有通道的傳入自動回覆執行，以防止多個代理執行互相衝突，同時仍允許跨工作階段的安全平行處理。

## 為什麼

- 自動回覆執行可能成本高昂（LLM 呼叫），且當多則傳入訊息接近同時抵達時可能互相衝突。
- 序列化可避免競爭共享資源（工作階段檔案、記錄、命令列介面 stdin），並降低觸發上游速率限制的機率。

## 運作方式

- 具備執行線感知的 FIFO 佇列，會以可設定的並行上限排空每個執行線（未設定執行線預設為 1；main 預設為 4，subagent 預設為 8）。
- `runEmbeddedAgent` 依 **工作階段金鑰**（執行線 `session:<key>`）入列，以保證每個工作階段同一時間只有一個作用中的執行。
- 接著每個工作階段執行會排入 **全域執行線**（預設為 `main`），因此整體平行度會受 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細記錄時，如果已入列的執行在開始前等待超過約 2 秒，會發出一則短通知。
- 輸入中指示器仍會在入列時立即觸發（通道支援時），因此使用者體驗在等待輪到我們時不會改變。

## 預設值

未設定時，所有傳入通道介面都使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

同輪導引是預設值。若提示在執行中途抵達，且該執行可接受導引，提示會被注入作用中的執行階段，因此不會啟動第二個工作階段執行。若作用中的執行無法接受導引，OpenClaw 會等待作用中的執行完成後再啟動該提示。

## 佇列模式

`/queue` 控制當工作階段已有作用中執行時，一般傳入訊息要如何處理：

- `steer`：將訊息注入作用中的執行階段。OpenClaw 會在目前助理回合完成其工具呼叫後、下一次 LLM 呼叫之前，送出所有待處理的導引訊息；Codex app-server 會收到一個批次的 `turn/steer`。若執行未在主動串流，或導引不可用，OpenClaw 會等到作用中的執行結束後再啟動該提示。
- `followup`：不導引。將每則訊息排入佇列，在目前執行結束後作為稍後的代理回合。
- `collect`：不導引。將已入列訊息合併為安靜視窗後的 **單一** 後續回合。若訊息目標是不同通道/討論串，則會個別排空以保留路由。
- `interrupt`：中止該工作階段的作用中執行，然後執行最新訊息。

如需執行階段特定的時序與相依行為，請參閱
[導引佇列](/zh-TW/concepts/queue-steering)。如需明確的 `/steer <message>`
命令，請參閱 [導引](/zh-TW/tools/steer)。

透過 `messages.queue` 進行全域或個別通道設定：

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

選項會套用於已入列的遞送。`debounceMs` 也會在 `steer` 模式中設定 Codex 導引安靜視窗：

- `debounceMs`：排空已入列後續訊息或 collect 批次前的安靜視窗；在 Codex `steer` 模式中，則是傳送批次 `turn/steer` 前的安靜視窗。裸數字代表毫秒；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段的最大已入列訊息數。低於 `1` 的值會被忽略。
- `drop: "summarize"`：預設值。視需要丟棄最舊的已入列項目，保留精簡摘要，並將它們作為合成的後續提示注入。
- `drop: "old"`：視需要丟棄最舊的已入列項目，不保留摘要。
- `drop: "new"`：當佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 導引與串流

當通道串流為 `partial` 或 `block` 時，導引在作用中的執行抵達執行階段邊界時，可能看起來像多則短的可見回覆：

- `partial`：預覽可能提早完成，接著在導引被接受後啟動新的預覽。
- `block`：草稿大小的區塊可能產生相同的連續外觀。
- 沒有串流時，若執行階段無法接受同輪導引，導引會退回為作用中執行之後的後續回合。

`steer` 不會中止執行中的工具。當最新訊息應中止目前執行時，請使用 `/queue interrupt`。

## 優先順序

對於模式選擇，OpenClaw 會依序解析：

1. 行內或已儲存的個別工作階段 `/queue` 覆寫。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

對於選項，行內或已儲存的 `/queue` 選項優先於設定。接著套用通道特定 debounce（`messages.queue.debounceMsByChannel`）、外掛 debounce 預設值、全域 `messages.queue` 選項，以及內建預設值。`cap` 和 `drop` 是全域/工作階段選項，不是個別通道設定鍵。

## 個別工作階段覆寫

- 將 `/queue <steer|followup|collect|interrupt>` 作為獨立命令傳送，以儲存目前工作階段的佇列模式。
- 選項可以組合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫。

## 範圍與保證

- 套用於所有使用閘道回覆管線的傳入通道之自動回覆代理執行（WhatsApp 網頁版、Telegram、Slack、Discord、Signal、iMessage、網頁聊天等）。
- 預設執行線（`main`）在程序內對傳入訊息與主要心跳偵測皆為全域；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他執行線（例如 `cron`、`cron-nested`、`nested`、`subagent`），讓背景作業可平行執行而不阻塞傳入回覆。隔離的排程代理回合會在其內部代理執行使用 `cron-nested` 時持有一個 `cron` 槽位；兩者都使用 `cron.maxConcurrentRuns`。共享的非排程 `nested` 流程會保留自己的執行線行為。這些分離的執行會被追蹤為[背景任務](/zh-TW/automation/tasks)。
- 個別工作階段執行線保證同一時間只有一個代理執行會觸碰指定工作階段。
- 無外部相依項或背景工作執行緒；純 TypeScript + promises。

## 疑難排解

- 如果命令看似卡住，請啟用詳細記錄並尋找「queued for ...ms」行，以確認佇列正在排空。
- 如果需要佇列深度，請啟用詳細記錄並觀察佇列時序行。
- 接受某個回合後停止發出進度的 Codex app-server 執行，會由 Codex 轉接器中斷，讓作用中的工作階段執行線可以釋放，而不是等待外層執行逾時。
- 啟用診斷時，若工作階段在超過 `diagnostics.stuckSessionWarnMs` 後仍停留於 `processing`，且未觀察到回覆、工具、狀態、區塊或 ACP 進度，會依目前活動分類。作用中工作會記錄為 `session.long_running`；由擁有者持有的靜默模型呼叫也會維持為 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，因此緩慢或非串流提供者不會過早被回報為停滯。沒有近期進度的作用中工作會記錄為 `session.stalled`；由擁有者持有的模型呼叫會在達到或超過中止閾值時切換為 `session.stalled`，而無擁有者的過時模型/工具活動不會被隱藏為長時間執行。`session.stuck` 保留給可復原的過時工作階段簿記，包括具有過時無擁有者模型/工具活動的閒置已入列工作階段，且只有該路徑可以釋放受影響的工作階段執行線，讓已入列工作排空。重複的 `session.stuck` 診斷會在工作階段維持不變時退避。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [導引佇列](/zh-TW/concepts/queue-steering)
- [導引](/zh-TW/tools/steer)
- [重試政策](/zh-TW/concepts/retry)
