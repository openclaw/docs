---
read_when:
    - 規劃從 BlueBubbles 遷移到內建的 iMessage Plugin
    - 將 BlueBubbles 設定鍵轉換為 iMessage 對應項
    - 啟用 iMessage Plugin 前驗證 imsg
summary: 將舊版 BlueBubbles 設定遷移到內建的 iMessage Plugin，而不會遺失配對、允許清單或群組綁定。
title: 從 BlueBubbles 轉移過來
x-i18n:
    generated_at: "2026-05-10T19:21:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

內建的 `imessage` Plugin 現在會透過 JSON-RPC 驅動 [`steipete/imsg`](https://github.com/steipete/imsg)，存取與 BlueBubbles 相同的私有 API 介面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群組管理、附件）。如果你已經在安裝了 `imsg` 的 Mac 上執行，便可以移除 BlueBubbles 伺服器，讓 Plugin 直接與 Messages.app 通訊。

BlueBubbles 支援已移除。OpenClaw 僅透過 `imsg` 支援 iMessage。本指南用於將舊的 `channels.bluebubbles` 設定遷移到 `channels.imessage`；沒有其他受支援的遷移路徑。

## 何時適合進行此遷移

- 你已經在 Messages.app 已登入的同一台 Mac（或可透過 SSH 存取的 Mac）上執行 `imsg`。
- 你想減少一個移動部件 — 不需要獨立的 BlueBubbles 伺服器、不需要要驗證的 REST 端點，也不需要 Webhook 管線。使用單一 CLI 二進位檔，取代伺服器 + 用戶端應用程式 + 輔助程式。
- 你使用的是[受支援的 macOS / `imsg` 建置版本](/zh-TW/channels/imessage#requirements-and-permissions-macos)，且私有 API 探測回報 `available: true`。

## imsg 的功能

`imsg` 是 Messages 的本機 macOS CLI。OpenClaw 會將 `imsg rpc` 作為子程序啟動，並透過 stdin/stdout 使用 JSON-RPC 通訊。沒有 HTTP 伺服器、Webhook URL、背景 daemon、launch agent，或需要公開的連接埠。

- 讀取會使用唯讀 SQLite handle 從 `~/Library/Messages/chat.db` 取得。
- 即時傳入訊息來自 `imsg watch` / `watch.subscribe`，它會追蹤 `chat.db` 檔案系統事件，並以輪詢作為後備。
- 傳送一般文字與檔案時，會使用 Messages.app 自動化。
- 進階動作會使用 `imsg launch` 將 `imsg` 輔助程式注入 Messages.app。這會解鎖讀取回條、輸入指示器、豐富傳送、編輯、收回、對話串回覆、tapbacks，以及群組管理。
- Linux 建置可以檢查複製的 `chat.db`，但無法傳送、監看即時 Mac 資料庫，或驅動 Messages.app。若要使用 OpenClaw iMessage，請在已登入的 Mac 上執行 `imsg`，或透過指向該 Mac 的 SSH wrapper 執行。

## 開始之前

1. 在執行 Messages.app 的 Mac 上安裝 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 因 `unable to open database file`、空白輸出或 `authorization denied` 而失敗，請授予啟動 `imsg` 的終端機、編輯器、Node 程序、Gateway 服務，或 SSH 父程序完整磁碟存取權，然後重新開啟該父程序。

2. 在變更 OpenClaw 設定之前，先驗證讀取、監看、傳送與 RPC 介面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   將 `42` 替換為 `imsg chats` 中的真實 chat id。傳送需要 Messages.app 的自動化權限。如果 OpenClaw 會透過 SSH 執行，請透過 OpenClaw 將使用的相同 SSH wrapper 或使用者情境來執行這些指令。

3. 需要進階動作時，啟用私有 API 橋接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要停用 SIP。基本傳送、歷史記錄與監看可在沒有 `imsg launch` 的情況下運作；進階動作則不行。

4. 透過 OpenClaw 驗證橋接：

   ```bash
   openclaw channels status --probe
   ```

   你需要看到 `imessage.privateApi.available: true`。如果它回報 `false`，請先修正該問題 — 參閱[功能偵測](/zh-TW/channels/imessage#private-api-actions)。

5. 建立設定快照：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 設定轉換

iMessage 和 BlueBubbles 共用許多 channel 層級設定。會變更的 key 主要是傳輸方式（REST 伺服器 vs 本機 CLI）。行為 key（`dmPolicy`、`groupPolicy`、`allowFrom` 等）維持相同含義。

| BlueBubbles                                                | 隨附的 iMessage                          | 備註                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 語意相同。                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(已移除)_                               | 沒有 REST 伺服器，Plugin 會透過 stdio 產生 `imsg rpc`。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(已移除)_                               | 不需要 Webhook 驗證。                                                                                                                                                                                                                                                                                                            |
| _(隱含)_                                               | `channels.imessage.cliPath`               | `imsg` 的路徑（預設為 `imsg`）；若使用 SSH，請使用包裝指令碼。                                                                                                                                                                                                                                                                               |
| _(隱含)_                                               | `channels.imessage.dbPath`                | 可選的 Messages.app `chat.db` 覆寫；省略時會自動偵測。                                                                                                                                                                                                                                                                        |
| _(隱含)_                                               | `channels.imessage.remoteHost`            | `host` 或 `user@host`，只有在 `cliPath` 是 SSH 包裝指令碼，且你想要透過 SCP 擷取附件時才需要。                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配對核准會依控制代碼沿用，而不是依權杖。                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字複製此項，包括任何 `groups: { "*": { ... } }` 萬用字元項目。** 每個群組的 `requireMention`、`tools`、`toolsBySender` 都會沿用。使用 `groupPolicy: "allowlist"` 時，空白或缺少的 `groups` 區塊會靜默丟棄每則群組訊息，請參閱下方的「群組登錄陷阱」。                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 預設為 `true`。使用隨附的 Plugin 時，這只會在私有 API 探測啟動時觸發。                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形狀相同，**同樣預設關閉**。如果你在 BlueBubbles 上已有附件流入，必須在 iMessage 區塊上明確重新設定此項，它不會隱含沿用；在你這麼做之前，傳入的照片/媒體會被靜默丟棄，且不會出現 `Inbound message` 記錄行。                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本機根目錄；萬用字元規則相同。                                                                                                                                                                                                                                                                                                            |
| _(不適用)_                                                    | `channels.imessage.remoteAttachmentRoots` | 只有在為 SCP 擷取設定 `remoteHost` 時才會使用。                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 預設為 16 MB（BlueBubbles 預設為 8 MB）。如果你想保留較低上限，請明確設定。                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 兩者皆預設為 4000。                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的選擇啟用項。僅限私訊，群組聊天在兩個頻道上都會保留即時逐則訊息派送。在啟用且未明確設定 `messages.inbound.byChannel.imessage` 時，會將預設傳入防抖延長為 2500 ms。請參閱 [iMessage 文件 § 合併分段傳送的私訊](/zh-TW/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(不適用)_                                   | iMessage 已經會從 `chat.db` 讀取寄件者顯示名稱。                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每個動作的切換項：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                          |

多帳號設定（`channels.bluebubbles.accounts.*`）會一對一轉換為 `channels.imessage.accounts.*`。

## 群組登錄陷阱

隨附的 iMessage Plugin 會連續執行**兩個**獨立的群組允許清單閘門。兩者都必須通過，群組訊息才會到達代理程式：

1. **寄件者 / 聊天目標允許清單**（`channels.imessage.groupAllowFrom`）- 由 `isAllowedIMessageSender` 檢查。會依寄件者控制代碼、`chat_guid`、`chat_identifier` 或 `chat_id` 比對傳入訊息。形狀與 BlueBubbles 相同。
2. **群組登錄**（`channels.imessage.groups`）- 由 `inbound-processing.ts:199` 中的 `resolveChannelGroupPolicy` 檢查。使用 `groupPolicy: "allowlist"` 時，此閘門需要以下其中一項：
   - `groups: { "*": { ... } }` 萬用字元項目（設定 `allowAll = true`），或
   - `groups` 下明確的個別 `chat_id` 項目。

如果閘門 1 通過但閘門 2 失敗，訊息會被丟棄。Plugin 會發出兩個 `warn` 等級訊號，因此在預設記錄等級下不再是靜默狀態：

- 當設定了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 為空（沒有 `"*"` 萬用字元，也沒有個別 `chat_id` 項目）時，每個帳號會在啟動時發出一次性 `warn`，且會在任何訊息抵達前觸發。
- 當特定群組在執行期間首次被丟棄時，會依每個 `chat_id` 發出一次性 `warn`，指出該 chat_id，以及要新增到 `groups` 才能允許它的確切鍵。

私訊會繼續運作，因為它們走的是不同的程式碼路徑。

這是最常見的 BlueBubbles → 隨附 iMessage 遷移失敗模式：操作者複製了 `groupAllowFrom` 和 `groupPolicy`，但略過 `groups` 區塊，因為 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起來像是不相關的提及設定。實際上，它是登錄閘門的必要設定。

在 `groupPolicy: "allowlist"` 之後，讓群組訊息持續流動的最低設定如下：

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` 位於 `*` 底下時，如果未設定提及模式，並不會造成問題：執行階段會設定 `canDetectMention = false`，並在 `inbound-processing.ts:512` 短路略過提及丟棄流程。設定提及模式後（`agents.list[].groupChat.mentionPatterns`），它會如預期運作。

如果 Gateway 記錄 `imessage: dropping group message from chat_id=<id>`，或啟動時出現 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，表示第 2 道閘門正在丟棄訊息——請新增 `groups` 區塊。

## 逐步操作

1. 在既有 BlueBubbles 區塊旁新增 iMessage 區塊。在新路徑驗證完成前，僅保留舊區塊作為複製來源：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **乾跑探測**——啟動 Gateway，並確認 iMessage 回報為健康：

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   因為 `imessage.enabled` 仍為 `false`，尚未路由任何傳入的 iMessage 流量——但 `--probe` 會測試橋接，因此你可以在切換前發現權限或安裝問題。

3. **切換。** 移除 BlueBubbles 設定，並在同一次設定編輯中啟用 iMessage：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重新啟動 Gateway。傳入的 iMessage 流量現在會透過內建 Plugin 流動。

4. **驗證 DM。** 傳送一則直接訊息給 agent；確認回覆已送達。

5. **分別驗證群組。** DM 和群組會走不同的程式碼路徑——DM 成功不代表群組正在路由。在已配對的群組聊天中傳送訊息給 agent，並確認回覆已送達。如果群組變得無聲（沒有 agent 回覆，也沒有錯誤），請檢查 Gateway 記錄是否有 `imessage: dropping group message from chat_id=<id>`，或啟動時是否出現 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 這行——兩者都會在預設記錄層級觸發。如果出現任一訊息，表示你的 `groups` 區塊缺失或為空——請參閱上方的「群組登錄陷阱」。

6. **驗證動作介面**——從已配對的 DM 中，要求 agent 做出反應、編輯、收回、回覆、傳送照片，並且（在群組中）重新命名群組／新增或移除參與者。每個動作都應該原生送達 Messages.app。如果任何動作拋出「iMessage `<action>` requires the imsg private API bridge」，請再次執行 `imsg launch`，並重新整理 `channels status --probe`。

7. 驗證 iMessage DM、群組和動作後，**移除 BlueBubbles 伺服器與設定**。OpenClaw 不會使用 `channels.bluebubbles`。

## 動作對等一覽

| 動作                                                       | 舊版 BlueBubbles                    | 內建 iMessage                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 傳送文字／SMS 備援                                        | ✅                                  | ✅                                                                                                                      |
| 傳送媒體（照片、影片、檔案、語音）                       | ✅                                  | ✅                                                                                                                      |
| 串接回覆（`reply_to_guid`）                               | ✅                                  | ✅（關閉 [#51892](https://github.com/openclaw/openclaw/issues/51892)）                                                  |
| Tapback（`react`）                                        | ✅                                  | ✅                                                                                                                      |
| 編輯／收回（macOS 13+ 收件者）                            | ✅                                  | ✅                                                                                                                      |
| 使用螢幕效果傳送                                          | ✅                                  | ✅（關閉 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分）                                           |
| 富文字粗體／斜體／底線／刪除線                            | ✅                                  | ✅（透過 attributedBody 進行 typed-run 格式化）                                                                         |
| 重新命名群組／設定群組圖示                                | ✅                                  | ✅                                                                                                                      |
| 新增／移除參與者、離開群組                                | ✅                                  | ✅                                                                                                                      |
| 已讀回執與輸入中指示器                                    | ✅                                  | ✅（受 private API 探測管控）                                                                                          |
| 同一寄件者 DM 合併                                        | ✅                                  | ✅（僅限 DM；透過 `channels.imessage.coalesceSameSenderDms` 選擇啟用）                                                  |
| 補抓 Gateway 停機期間收到的傳入訊息                       | ✅（Webhook 重播 + 歷史擷取）       | ✅（透過 `channels.imessage.catchup.enabled` 選擇啟用；關閉 [#78649](https://github.com/openclaw/openclaw/issues/78649)） |

iMessage 補抓現在可作為內建 Plugin 的選擇啟用功能使用。Gateway 啟動時，如果 `channels.imessage.catchup.enabled` 為 `true`，Gateway 會針對 `imsg watch` 使用的同一個 JSON-RPC 用戶端執行一次 `chats.list` + 每個聊天的 `messages.history` 流程，將每筆遺漏的傳入列透過即時分派路徑（允許清單、群組政策、防抖器、回音快取）重播，並保存每個帳號的游標，讓後續啟動能從上次停止的位置繼續。請參閱[在 Gateway 停機後補抓](/zh-TW/channels/imessage#catching-up-after-gateway-downtime)以進行調整。

## 配對、工作階段與 ACP 綁定

- **配對核准**會依 handle 延續。你不需要重新核准已知寄件者——`channels.imessage.allowFrom` 會辨識 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字串。
- **工作階段**仍以每個 agent + 聊天為範圍。DM 會在預設 `session.dmScope=main` 下收斂到 agent 主要工作階段；群組工作階段則依每個 `chat_id` 保持隔離。工作階段鍵不同（`agent:<id>:imessage:group:<chat_id>` 與 BlueBubbles 對應項不同）——BlueBubbles 工作階段鍵下的舊對話歷史不會帶入 iMessage 工作階段。
- 參照 `match.channel: "bluebubbles"` 的 **ACP 綁定**需要更新為 `"imessage"`。`match.peer.id` 形狀（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸 handle）完全相同。

## 無回復通道

沒有支援的 BlueBubbles 執行階段可供切回。如果 iMessage 驗證失敗，請設定 `channels.imessage.enabled: false`、重新啟動 Gateway、修復 `imsg` 阻礙因素，然後重試切換。

回覆快取位於 `~/.openclaw/state/imessage/reply-cache.jsonl`（模式 `0600`，父目錄 `0700`）。如果你想要乾淨重新開始，可以安全刪除它。

## 相關

- [iMessage](/zh-TW/channels/imessage)——完整 iMessage channel 參考，包括 `imsg launch` 設定與能力偵測。
- `/channels/bluebubbles`——重新導向至本遷移指南的舊版 URL。
- [配對](/zh-TW/channels/pairing)——DM 驗證與配對流程。
- [Channel Routing](/zh-TW/channels/channel-routing)——Gateway 如何為傳出回覆選擇 channel。
