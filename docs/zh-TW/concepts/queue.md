---
read_when:
    - 變更自動回覆執行方式或並行處理設定
    - 說明 `/queue` 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與個別工作階段覆寫設定
title: 命令佇列
x-i18n:
    generated_at: "2026-07-20T00:47:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 69b40f67146226b0315492b27fc9d2218cace8bbd1eaff6514f7efb33b69d763
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw 透過一個小型的程序內佇列，將傳入的自動回覆執行（所有頻道）序列化，以防止多個代理程式執行互相衝突，同時仍允許工作階段之間安全地平行執行。

## 原因

- 自動回覆執行可能耗費大量資源（LLM 呼叫），且多則傳入訊息在短時間內抵達時可能互相衝突。
- 序列化可避免競爭共用資源（工作階段檔案、日誌、命令列介面標準輸入），並降低觸發上游速率限制的機率。

## 運作方式

- 可感知通道的 FIFO 佇列會依可設定的並行上限清空每個通道（未設定的通道預設為 1；`main` 預設為 4，`subagent` 預設為 8）。
- `runEmbeddedAgent` 依**工作階段金鑰**（通道 `session:<key>`）排入佇列，以確保每個工作階段同時只有一個作用中的執行。
- 接著，每個工作階段執行會排入**全域通道**（預設為 `main`），使整體並行數受 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細記錄時，排入佇列的執行若在開始前等待超過約 2 秒，便會發出簡短通知。
- 輸入中指示器仍會在排入佇列時立即觸發（若頻道支援），因此執行等待輪到自己時，使用者體驗不會改變。

## 預設值

若未設定，所有傳入頻道介面會使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

預設採用同輪引導。執行途中抵達的提示詞，若該執行可接受引導，便會注入作用中的執行階段，因此不會啟動第二個工作階段執行。若作用中的執行無法接受引導，OpenClaw 會等待其完成後再開始處理提示詞。

## 佇列模式

`/queue` 控制工作階段已有作用中的執行時，一般傳入訊息的處理方式：

- `steer`：將訊息注入作用中的執行階段。OpenClaw 會在**目前的助理輪次執行完工具呼叫後**、下一次 LLM 呼叫前，傳遞所有待處理的引導訊息；Codex app-server 會收到一個批次的 `turn/steer`。若執行並未主動串流，或無法使用引導，OpenClaw 會等待作用中的執行結束後再開始處理提示詞。
- `followup`：不進行引導。將每則訊息排入佇列，待目前執行結束後於後續代理程式輪次處理。
- `collect`：不進行引導。在靜默時間窗後，將排入佇列的訊息合併為**單一**後續輪次。若訊息以不同頻道／討論串為目標，則會個別清空以保留路由。
- `interrupt`：中止該工作階段的作用中執行，然後執行最新訊息。

如需執行階段特定的時序與相依性行為，請參閱[引導佇列](/zh-TW/concepts/queue-steering)。如需明確的 `/steer <message>` 命令，請參閱[引導](/zh-TW/tools/steer)。

透過 `messages.queue` 進行全域或依頻道設定：

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

選項適用於排入佇列的傳遞。在 `steer` 模式中，`debounceMs` 也會設定 Codex 引導的靜默時間窗：

- `debounceMs`：清空排入佇列的後續訊息或收集批次前的靜默時間窗；在 Codex `steer` 模式中，為傳送批次 `turn/steer` 前的靜默時間窗。未加單位的數字以毫秒為單位；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段可排入佇列的訊息上限。低於 `1` 的值會被忽略。
- `drop: "summarize"`（預設）：視需要捨棄最舊的佇列項目、保留精簡摘要，並將其作為合成的後續提示詞注入。
- `drop: "old"`：視需要捨棄最舊的佇列項目，不保留摘要。
- `drop: "new"`：佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 引導與串流

當頻道串流為 `partial` 或 `block` 時，在作用中的執行到達執行階段邊界期間，引導看起來可能像是數則簡短且可見的回覆：

- `partial`：預覽可能提早定稿，接著在引導獲接受後開始新的預覽。
- `block`：草稿大小的區塊可能產生相同的依序顯示效果。
- 若未使用串流，且執行階段無法接受同輪引導，引導會退回成作用中的執行結束後的後續訊息。

`steer` 不會中止正在執行的工具。若最新訊息應中止目前的執行，請使用 `/queue interrupt`。

## 優先順序

選取模式時，OpenClaw 會依序解析：

1. 行內或已儲存的每工作階段 `/queue` 覆寫值。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

對於選項，行內或已儲存的 `/queue` 選項優先於設定。接著依序套用頻道特定的防彈跳設定（`messages.queue.debounceMsByChannel`）、外掛的防彈跳預設值、全域 `messages.queue` 選項，以及內建預設值。`cap` 和 `drop` 是全域／工作階段選項，不是每頻道設定鍵。

## 每工作階段覆寫

- 將 `/queue <steer|followup|collect|interrupt>` 作為獨立命令傳送，以儲存目前工作階段的佇列模式。
- 選項可以合併：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫值。

## 排隊輪次取消

當提示詞位於後續／收集佇列中時（例如另一個輪次作用中時抵達的終端介面或
網頁聊天 `chat.send`），閘道會為該用戶端 `runId` 保留
**由閘道擁有的取消識別資訊**，直到排入佇列的內容開始執行或被捨棄。
此識別資訊會隨併入溢位摘要的內容一起保留。

- 具有特定 `runId` 的 `chat.abort` 可在該輪次仍
  位於佇列中時取消它，前提是要求者已獲授權（使用與作用中執行相同的擁有權規則）。
- 對未指定 `runId` 的工作階段執行 `chat.abort`，會**先取消已授權的排隊輪次**，
  再中止已授權的作用中執行。此順序可防止佇列清空作業將工作提升至
  半停止的工作階段中。
- 在未逐一檢查要求者的情況下清除整個工作階段佇列，並不是
  多擁有者工作階段的停止路徑。
- 對 `sessions.list` 而言，佇列等待不會投影為作用中的代理程式執行，
  也不具備作用中執行的逾時語意；只有作用中階段具備此語意。

由閘道支援的用戶端（包括 `openclaw tui`）會轉送執行途中的提示詞，並
讓閘道套用佇列模式。Esc／`/stop` 使用工作階段範圍的中止，
因此即使本機控制代碼遺失，也不會留下仍在佇列中的提示詞繼續執行。

`openclaw chat` 和 `openclaw tui --local` 會在
內嵌執行階段套用相同的四種模式。當該執行階段接受引導時，本機 `steer` 會注入作用中的內嵌執行，
否則會成為後續訊息；`followup` 和
`collect` 仍為本機待處理工作；`interrupt` 會在開始最新訊息前
中止作用中的本機執行。明確的 `/steer <message>` 命令
並非本機模式命令。

## 範圍與保證

- 適用於所有使用閘道回覆管線的傳入頻道之自動回覆代理程式執行（WhatsApp 網頁版、Telegram、Slack、Discord、Signal、iMessage、網頁聊天等）。
- 預設通道（`main`）在整個程序中由傳入工作與主要心跳偵測共用；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），讓背景工作可平行執行而不阻塞傳入回覆。隔離的排程代理程式輪次會佔用一個 `cron` 名額，而其內部代理程式執行則使用 `cron-nested`。共用的非排程 `nested` 流程會維持各自的通道行為。這些分離的執行會作為[背景工作](/zh-TW/automation/tasks)受到追蹤。
- 每工作階段通道可確保同一時間只有一個代理程式執行會操作指定的工作階段。
- 沒有外部相依項目或背景工作執行緒；僅使用 TypeScript 與 Promise。

## 疑難排解

- 若命令似乎卡住，請啟用詳細日誌並尋找 "queued for ...ms" 行，以確認佇列正在清空。
- 若 Codex app-server 執行接受某個輪次後停止發出進度，Codex 介接器會將其中斷，使作用中的工作階段通道得以釋放，而不是等待外層執行逾時。
- 啟用診斷後，若工作階段停留在 `processing` 的時間超過內建警告閾值，且未觀察到任何回覆、工具、狀態、區塊或 ACP 進度，便會依目前活動分類：
  - 近期有進度的作用中工作會記錄為 `session.long_running`。由擁有者控制的靜默模型呼叫也會維持 `session.long_running`，直到達到內建中止閾值，避免過早將緩慢或非串流提供者回報為停滯。
  - 近期無進度的作用中工作會記錄為 `session.stalled`；由擁有者控制的模型呼叫、受阻的工具呼叫及停滯的內嵌執行，在達到或超過中止閾值時會切換為 `session.stalled`。沒有擁有者的過時模型／工具活動不會被隱藏為長時間執行。
  - `session.stuck` 保留給可復原的過時工作階段簿記，包括具有過時且無擁有者之模型／工具活動的閒置排隊工作階段。
  - `session.stuck` 一律會觸發可釋放受影響工作階段通道的復原。在超過中止閾值後，`session.stalled` 分類（受阻的工具呼叫、停滯的模型呼叫或停滯的內嵌執行）也可觸發主動中止復原，因此兩種分類都能解除佇列卡住的狀態，而不僅是 `session.stuck`。
  - 當工作階段維持不變時，重複的 `session.stuck` 與 `session.long_running` 警告日誌行會以指數方式延長間隔；無論此延遲如何，每次心跳偵測週期仍會執行復原嘗試。

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [引導佇列](/zh-TW/concepts/queue-steering)
- [引導](/zh-TW/tools/steer)
- [重試原則](/zh-TW/concepts/retry)
