---
read_when:
    - 變更自動回覆執行方式或並行性
    - 說明 /queue 模式或訊息導向行為
summary: 自動回覆佇列模式、預設值與每個工作階段覆寫
title: 命令佇列
x-i18n:
    generated_at: "2026-07-05T11:15:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw 會透過一個極小的同處理程序佇列序列化入站自動回覆執行（所有頻道），以避免多個代理執行互相衝突，同時仍允許跨工作階段的安全平行處理。

## 原因

- 自動回覆執行可能成本很高（LLM 呼叫），且多則入站訊息相近抵達時可能互相衝突。
- 序列化可避免競爭共用資源（工作階段檔案、記錄、命令列介面 stdin），並降低觸發上游速率限制的機率。

## 運作方式

- 具備通道意識的 FIFO 佇列會以可設定的並行上限清空每個通道（未設定通道預設為 1；`main` 預設為 4，`subagent` 預設為 8）。
- `runEmbeddedAgent` 會依 **工作階段金鑰**（通道 `session:<key>`）入列，以保證每個工作階段只有一個作用中的執行。
- 接著每個工作階段執行會排入 **全域通道**（預設為 `main`），因此整體平行度會受 `agents.defaults.maxConcurrent` 限制。
- 啟用詳細記錄時，若入列的執行在開始前等待超過約 2 秒，會送出一則簡短通知。
- 輸入指示器仍會在入列時立即觸發（若頻道支援），因此執行等待輪到自己時，使用者體驗不會改變。

## 預設值

未設定時，所有入站頻道介面都會使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

同回合導引是預設值。若提示在執行中抵達，且該執行可接受導引，提示會被注入作用中的執行階段，因此不會啟動第二個工作階段執行。若作用中的執行無法接受導引，OpenClaw 會等待作用中的執行完成後再開始該提示。

## 佇列模式

`/queue` 控制當工作階段已有作用中執行時，一般入站訊息的處理方式：

- `steer`：將訊息注入作用中的執行階段。OpenClaw 會在目前助理回合完成工具呼叫執行後、下一次 LLM 呼叫前，傳遞所有待處理的導引訊息；Codex app-server 會收到一個批次 `turn/steer`。若執行未主動串流，或導引不可用，OpenClaw 會等到作用中的執行結束後再開始該提示。
- `followup`：不導引。將每則訊息排入佇列，在目前執行結束後作為後續代理回合處理。
- `collect`：不導引。在安靜視窗後，將入列訊息合併成 **單一** 後續回合。若訊息目標為不同頻道/執行緒，會個別清空以保留路由。
- `interrupt`：中止該工作階段的作用中執行，然後執行最新訊息。

如需執行階段特定的時序與相依行為，請參閱[導引佇列](/zh-TW/concepts/queue-steering)。如需明確的 `/steer <message>` 命令，請參閱[導引](/zh-TW/tools/steer)。

透過 `messages.queue` 進行全域或各頻道設定：

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

選項會套用於入列傳遞。`debounceMs` 也會在 `steer` 模式中設定 Codex 導引安靜視窗：

- `debounceMs`：清空入列後續訊息或收集批次前的安靜視窗；在 Codex `steer` 模式中，則是傳送批次 `turn/steer` 前的安靜視窗。裸數字代表毫秒；`/queue` 選項接受單位 `ms`、`s`、`m`、`h` 和 `d`。
- `cap`：每個工作階段的最大入列訊息數。低於 `1` 的值會被忽略。
- `drop: "summarize"`（預設）：視需要丟棄最舊的入列項目，保留精簡摘要，並將它們作為合成後續提示注入。
- `drop: "old"`：視需要丟棄最舊的入列項目，不保留摘要。
- `drop: "new"`：當佇列已滿時拒絕最新訊息。

預設值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 導引與串流

當頻道串流為 `partial` 或 `block` 時，在作用中執行抵達執行階段邊界時，導引可能看起來像數個短的可見回覆：

- `partial`：預覽可能提早完成，然後在導引被接受後開始新的預覽。
- `block`：草稿大小的區塊可能產生相同的連續外觀。
- 若沒有串流，當執行階段無法接受同回合導引時，導引會退回為作用中執行結束後的後續回合。

`steer` 不會中止進行中的工具。當最新訊息應中止目前執行時，請使用 `/queue interrupt`。

## 優先順序

對於模式選擇，OpenClaw 依序解析：

1. 內嵌或已儲存的每工作階段 `/queue` 覆寫。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 預設 `steer`。

對於選項，內嵌或已儲存的 `/queue` 選項優先於設定。接著會依序套用頻道特定 debounce（`messages.queue.debounceMsByChannel`）、外掛 debounce 預設值、全域 `messages.queue` 選項，以及內建預設值。`cap` 和 `drop` 是全域/工作階段選項，不是各頻道設定鍵。

## 每工作階段覆寫

- 將 `/queue <steer|followup|collect|interrupt>` 作為獨立命令傳送，以儲存目前工作階段的佇列模式。
- 選項可以組合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 會清除工作階段覆寫。

## 入列回合取消

當提示停留在後續/收集佇列中時（例如終端介面或
webchat `chat.send` 在另一個回合作用中時抵達），閘道會為該用戶端 `runId`
保留一個 **閘道擁有的取消身分**，直到入列內容執行或被丟棄。
該身分會跟隨被摺入溢位摘要的內容。

- 帶有特定 `runId` 的 `chat.abort` 會在該回合仍處於入列狀態時取消該回合，
  前提是請求者已獲授權（與作用中執行相同的擁有權規則）。
- 對沒有 `runId` 的工作階段使用 `chat.abort` 會 **先取消已授權的入列回合**，
  然後中止已授權的作用中執行。此順序可避免佇列清空將工作提升到半停止的工作階段中。
- 未進行逐請求者檢查就清除整個工作階段佇列，並不是多擁有者工作階段的停止路徑。
- 入列等待不會在 `sessions.list` 中被投射為作用中代理執行，
  也不擁有作用中執行逾時語意；只有作用中階段才有。

用戶端（包括終端介面）會轉送執行中的提示，並讓閘道套用佇列模式。
Esc/`/stop` 使用工作階段範圍的中止，因此遺失的本機控制代碼
不會留下仍在入列的提示繼續執行。

## 範圍與保證

- 套用於所有使用閘道回覆管線的入站頻道自動回覆代理執行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 預設通道（`main`）在處理程序範圍內涵蓋入站 + 主要心跳偵測；設定 `agents.defaults.maxConcurrent` 可允許多個工作階段平行執行。
- 可能存在其他通道（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此背景作業可以平行執行，而不會阻塞入站回覆。隔離的排程代理回合會在其內部代理執行使用 `cron-nested` 時持有一個 `cron` 槽位；兩者都使用 `cron.maxConcurrentRuns`。共用的非排程 `nested` 流程會保留自己的通道行為。這些分離的執行會被追蹤為[背景任務](/zh-TW/automation/tasks)。
- 每工作階段通道保證同一時間只有一個代理執行會觸碰指定工作階段。
- 沒有外部相依項或背景工作執行緒；純 TypeScript + promises。

## 疑難排解

- 如果命令看似卡住，請啟用詳細記錄，並尋找 "queued for ...ms" 行，以確認佇列正在清空。
- 接受回合後停止輸出進度的 Codex app-server 執行會被 Codex 轉接器中斷，因此作用中工作階段通道可以釋放，而不是等待外層執行逾時。
- 啟用診斷時，若工作階段在超過 `diagnostics.stuckSessionWarnMs` 後仍維持 `processing`，且沒有觀察到回覆、工具、狀態、區塊或 ACP 進度，會依目前活動分類：
  - 有最近進度記錄的作用中工作會分類為 `session.long_running`。擁有者明確的靜默模型呼叫也會維持 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，因此緩慢或非串流提供者不會太早被回報為停滯。
  - 沒有最近進度記錄的作用中工作會分類為 `session.stalled`；擁有者明確的模型呼叫、被阻塞的工具呼叫，以及停滯的嵌入式執行，會在中止閾值當下或之後切換為 `session.stalled`。沒有擁有者的過期模型/工具活動不會被隱藏為長時間執行。
  - `session.stuck` 保留給可復原的過期工作階段簿記，包括具有過期無擁有者模型/工具活動的閒置入列工作階段。
  - `session.stuck` 一律會觸發可釋放受影響工作階段通道的復原。超過 `diagnostics.stuckSessionAbortMs` 的 `session.stalled` 分類（被阻塞的工具呼叫、停滯的模型呼叫，或停滯的嵌入式執行）也可以觸發作用中中止復原，因此兩種分類都可以解除佇列卡住，不只有 `session.stuck`。
  - 重複的 `session.stuck` 和 `session.long_running` 警告記錄行會在工作階段維持不變時以指數退避；無論該退避如何，復原嘗試仍會在每次心跳偵測 tick 上執行。

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [導引佇列](/zh-TW/concepts/queue-steering)
- [導引](/zh-TW/tools/steer)
- [重試政策](/zh-TW/concepts/retry)
