---
read_when:
    - 變更自動回覆的執行方式或並行處理設定
    - 說明 `/queue` 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與各工作階段覆寫設定
title: 命令佇列
x-i18n:
    generated_at: "2026-07-11T21:16:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw 會透過一個小型的處理程序內佇列，將所有通道的傳入自動回覆執行序列化，以防止多個代理程式執行互相衝突，同時仍允許跨工作階段安全地平行處理。

## 原因

- 自動回覆執行的成本可能很高（LLM 呼叫），而且當多則傳入訊息在短時間內抵達時，可能會互相衝突。
- 序列化可避免爭用共用資源（工作階段檔案、日誌、命令列介面標準輸入），並降低觸發上游速率限制的機率。

## 運作方式

- 可感知通道的 FIFO 佇列會依照可設定的並行上限排空各通道（未設定的通道預設為 1；`main` 預設為 4，`subagent` 預設為 8）。
- `runEmbeddedAgent` 會依照**工作階段鍵值**（通道 `session:<key>`）排入佇列，以確保每個工作階段同時只有一個執行中的作業。
- 接著，每個工作階段執行會排入**全域通道**（預設為 `main`），因此整體平行處理數會受 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細日誌時，若排入佇列的執行在開始前等待超過約 2 秒，便會輸出簡短通知。
- 排入佇列時，輸入中指示器仍會立即觸發（如果通道支援），因此執行等待輪到自己時，使用者體驗不會改變。

## 預設值

未設定時，所有傳入通道介面都會使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

預設會在同一輪中引導。若提示在執行期間抵達，且目前執行可接受引導，該提示便會注入執行中的執行階段，因此不會啟動第二個工作階段執行。若執行中的作業無法接受引導，OpenClaw 會等待其完成後才開始處理該提示。

## 佇列模式

`/queue` 控制工作階段已有執行中作業時，一般傳入訊息的處理方式：

- `steer`：將訊息注入執行中的執行階段。OpenClaw 會在**目前助理輪次完成其工具呼叫之後**、下一次 LLM 呼叫之前，傳遞所有待處理的引導訊息；Codex app-server 會收到一個批次的 `turn/steer`。若執行未在主動串流，或無法使用引導，OpenClaw 會等到執行中的作業結束後才開始處理該提示。
- `followup`：不進行引導。將每則訊息排入佇列，待目前執行結束後，在後續代理程式輪次中處理。
- `collect`：不進行引導。在靜默時間窗後，將排入佇列的訊息合併為**單一**後續輪次。若訊息以不同通道或討論串為目標，則會分別排出，以保留路由資訊。
- `interrupt`：中止該工作階段目前執行中的作業，然後執行最新訊息。

如需特定執行階段的時序與相依項目行為，請參閱[引導佇列](/zh-TW/concepts/queue-steering)。如需明確的 `/steer <message>` 命令，請參閱[引導](/zh-TW/tools/steer)。

可透過 `messages.queue` 進行全域或個別通道設定：

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

選項適用於排入佇列後的傳遞。在 `steer` 模式中，`debounceMs` 也會設定 Codex 引導的靜默時間窗：

- `debounceMs`：排出佇列中的後續訊息或收集批次之前的靜默時間窗；在 Codex `steer` 模式中，則為傳送批次 `turn/steer` 前的靜默時間窗。未附單位的數字以毫秒為單位；`/queue` 選項接受 `ms`、`s`、`m`、`h` 與 `d` 單位。
- `cap`：每個工作階段排入佇列的訊息數量上限。小於 `1` 的值會被忽略。
- `drop: "summarize"`（預設）：視需要捨棄佇列中最舊的項目、保留精簡摘要，並將摘要以合成的後續提示形式注入。
- `drop: "old"`：視需要捨棄佇列中最舊的項目，但不保留摘要。
- `drop: "new"`：佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 引導與串流

當通道串流為 `partial` 或 `block` 時，在執行中的作業到達執行階段邊界期間，引導可能看起來像數則簡短且可見的回覆：

- `partial`：預覽可能提早定稿，接受引導後再開始新的預覽。
- `block`：草稿大小的區塊可能產生相同的依序顯示效果。
- 未使用串流時，若執行階段無法接受同一輪引導，則會改為在執行中的作業結束後進行後續處理。

`steer` 不會中止執行中的工具。若最新訊息應中止目前執行，請使用 `/queue interrupt`。

## 優先順序

選擇模式時，OpenClaw 會依下列順序解析：

1. 內嵌或已儲存的個別工作階段 `/queue` 覆寫設定。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設的 `steer`。

針對選項，內嵌或已儲存的 `/queue` 選項優先於設定。接著依序套用通道特定的防彈跳設定（`messages.queue.debounceMsByChannel`）、外掛的防彈跳預設值、全域 `messages.queue` 選項，以及內建預設值。`cap` 與 `drop` 是全域／工作階段選項，不是個別通道設定鍵。

## 個別工作階段覆寫設定

- 將 `/queue <steer|followup|collect|interrupt>` 作為獨立命令傳送，以儲存目前工作階段的佇列模式。
- 選項可以合併使用：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫設定。

## 佇列輪次取消

當提示位於 followup/collect 佇列中時（例如另一個輪次執行期間，終端介面或
網頁聊天送來 `chat.send`），閘道會保留該用戶端 `runId` 的
**閘道所擁有的取消識別資訊**，直到排入佇列的
內容執行或被捨棄為止。該識別資訊會跟隨被合併至
溢位摘要中的內容。

- 指定特定 `runId` 的 `chat.abort` 可在該輪次仍位於
  佇列中時將其取消，前提是要求者已獲授權（與執行中作業採用相同的所有權規則）。
- 對工作階段使用未指定 `runId` 的 `chat.abort` 時，會**先取消已獲授權且排入佇列的輪次**，
  再中止已獲授權且執行中的作業。此順序可防止佇列排出作業，
  將工作提升至僅停止一半的工作階段。
- 對於有多個擁有者的工作階段，在未逐一檢查要求者的情況下清除整個工作階段佇列，
  並不是停止流程。
- 佇列中的等待不會在 `sessions.list` 中呈現為執行中的代理程式作業，
  也不具備執行中作業的逾時語意；只有執行中階段才具備。

用戶端（包括終端介面）會轉送執行期間送達的提示，並由閘道套用
佇列模式。Esc/`/stop` 使用工作階段範圍的中止操作，因此即使遺失本機控制代碼，
也不會讓仍在佇列中的提示繼續執行。

## 適用範圍與保證

- 適用於所有使用閘道回覆管線之傳入通道的自動回覆代理程式執行（WhatsApp 網頁版、Telegram、Slack、Discord、Signal、iMessage、網頁聊天等）。
- 預設通道（`main`）在處理程序範圍內由傳入作業與主要心跳偵測共用；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），讓背景工作可以平行執行而不阻塞傳入回覆。獨立的排程代理程式輪次會占用一個 `cron` 槽位，而其內部代理程式執行使用 `cron-nested`；兩者皆使用 `cron.maxConcurrentRuns`。共用的非排程 `nested` 流程會保留自己的通道行為。這些分離的執行會以[背景任務](/zh-TW/automation/tasks)進行追蹤。
- 個別工作階段通道可確保在任何時間，只有一個代理程式執行會存取特定工作階段。
- 無外部相依項目或背景工作執行緒；僅使用 TypeScript 與 Promise。

## 疑難排解

- 如果命令看似卡住，請啟用詳細日誌並尋找「queued for ...ms」行，以確認佇列正在排出。
- 若 Codex app-server 執行接受某一輪次後停止輸出進度，Codex 轉接器會將其中斷，讓執行中的工作階段通道得以釋放，而不是等到外層執行逾時。
- 啟用診斷時，若工作階段在超過 `diagnostics.stuckSessionWarnMs` 後仍處於 `processing`，且未觀察到回覆、工具、狀態、區塊或 ACP 進度，則會依目前活動進行分類：
  - 有近期進度的執行中工作會記錄為 `session.long_running`。由擁有者控制且無輸出的模型呼叫也會維持 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，避免過早將緩慢或非串流供應商回報為停滯。
  - 沒有近期進度的執行中工作會記錄為 `session.stalled`；由擁有者控制的模型呼叫、受阻的工具呼叫，以及停滯的內嵌執行，會在達到或超過中止門檻時切換為 `session.stalled`。沒有擁有者的過時模型／工具活動不會被隱藏為長時間執行。
  - `session.stuck` 僅保留給可復原的過時工作階段簿記狀態，包括具有過時且無擁有者之模型／工具活動的閒置佇列工作階段。
  - `session.stuck` 一律會觸發復原，以釋放受影響的工作階段通道。超過 `diagnostics.stuckSessionAbortMs` 的 `session.stalled` 分類（受阻的工具呼叫、停滯的模型呼叫或停滯的內嵌執行）也可能觸發主動中止復原，因此兩種分類都可以解除佇列卡住的狀態，而非只有 `session.stuck`。
  - 當工作階段保持不變時，重複的 `session.stuck` 與 `session.long_running` 警告日誌行會以指數方式降低頻率；無論此退避機制如何，復原嘗試仍會在每次心跳偵測週期執行。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [引導佇列](/zh-TW/concepts/queue-steering)
- [引導](/zh-TW/tools/steer)
- [重試原則](/zh-TW/concepts/retry)
