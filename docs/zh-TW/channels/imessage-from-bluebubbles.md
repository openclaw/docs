---
read_when:
    - 規劃從 BlueBubbles 遷移到內建的 iMessage 外掛
    - 將 BlueBubbles 設定鍵翻譯為 iMessage 對應項
    - 啟用 iMessage 外掛前驗證 imsg
summary: 將舊版 BlueBubbles 設定轉換為內建 iMessage 外掛：金鑰對應、群組允許清單門檻，以及切換驗證。
title: 來自 BlueBubbles
x-i18n:
    generated_at: "2026-07-05T17:39:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93d4a6adb1ad0548368ce840f419339fdfe294ea19eca2e94f665c3b4613af4c
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles 支援已移除。OpenClaw 僅透過內建的 `imessage` 外掛支援 iMessage，該外掛透過 JSON-RPC 驅動 [`steipete/imsg`](https://github.com/steipete/imsg)，並觸及與 BlueBubbles 相同的私有 API 介面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、原生投票、群組管理、附件）。單一命令列介面二進位檔會取代 BlueBubbles 伺服器 + 用戶端應用程式 + 網路鉤子管線：沒有 REST 端點，也沒有網路鉤子驗證。

本指南會將舊的 `channels.bluebubbles` 設定遷移至 `channels.imessage`。沒有其他受支援的遷移路徑。在目前的 OpenClaw 中，殘留的 `channels.bluebubbles` 區塊是無效的，沒有任何執行階段會讀取它。

<Note>
如需簡短公告與操作員摘要，請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)。
</Note>

## 遷移檢查清單

當你已經知道舊 BlueBubbles 設定時，最短且安全的路徑如下：

1. 直接在執行 Messages.app 的 Mac 上驗證 `imsg`（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 將行為鍵從 `channels.bluebubbles` 複製到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 移除已不存在的傳輸鍵：`serverUrl`、`password`、網路鉤子 URL，以及 BlueBubbles 伺服器設定。
4. 如果閘道不是在 Messages Mac 上執行，請將 `channels.imessage.cliPath` 設為 SSH 包裝器，並設定 `remoteHost` 以進行遠端附件擷取。
5. 啟用 `channels.imessage`，重新啟動閘道，然後執行 `openclaw channels status --probe --channel imessage`。
6. 測試一則私訊、一個允許的群組、已啟用時的附件，以及你預期代理程式會使用的每個私有 API 動作。
7. 在 iMessage 路徑驗證完成後，刪除 BlueBubbles 伺服器與舊的 `channels.bluebubbles` 設定。

## imsg 的功能

`imsg` 是用於 Messages 的本機 macOS 命令列介面。OpenClaw 會以子程序啟動 `imsg rpc`，並透過 stdin/stdout 使用 JSON-RPC 通訊。沒有 HTTP 伺服器、網路鉤子 URL、背景守護程式、啟動代理程式，也沒有需要公開的連接埠。

- 讀取會透過唯讀 SQLite 控制代碼從 `~/Library/Messages/chat.db` 取得。
- 即時傳入訊息來自 `imsg watch` / `watch.subscribe`，它會追蹤 `chat.db` 檔案系統事件，並有輪詢備援。
- 傳送會使用 Messages.app 自動化來傳送一般文字與檔案。
- 進階動作會使用 `imsg launch` 將 `imsg` 輔助程式注入 Messages.app。這會解鎖已讀回條、輸入指示器、富文字傳送、編輯、收回、串接回覆、tapback、投票和群組管理。
- Linux 建置可以檢查複製的 `chat.db`，但無法傳送、監看即時 Mac 資料庫，或驅動 Messages.app。對於 OpenClaw iMessage，請在已登入的 Mac 上執行 `imsg`，或透過連到該 Mac 的 SSH 包裝器執行。

## 開始之前

1. 在執行 Messages.app 的 Mac 上安裝 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 因 `unable to open database file`、空輸出或 `authorization denied` 而失敗，請將完整磁碟存取權授予啟動 `imsg` 的終端機、編輯器、節點程序、閘道服務或 SSH 父程序，然後重新開啟該父程序。

2. 在變更 OpenClaw 設定之前，驗證讀取、監看、傳送和 RPC 介面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   將 `42` 替換為來自 `imsg chats` 的真實聊天 ID。傳送需要 Messages.app 的自動化權限。如果 OpenClaw 將透過 SSH 執行，請透過 OpenClaw 將使用的相同 SSH 包裝器或使用者情境執行這些命令。如果讀取可用但傳送因 AppleEvents `-1743` 失敗，請檢查自動化權限是否落在 `/usr/libexec/sshd-keygen-wrapper`；請參閱 [SSH 包裝器傳送因 AppleEvents -1743 失敗](/zh-TW/channels/imessage#requirements-and-permissions-macos)。

3. 當你需要進階動作時，啟用私有 API 橋接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要停用 SIP（在現代 macOS 上，還需要放寬函式庫驗證，請參閱 [啟用 imsg 私有 API](/zh-TW/channels/imessage#enabling-the-imsg-private-api)）。基本傳送、歷史紀錄與監看不需要 `imsg launch`；進階動作則需要。

4. 啟用 `channels.imessage` 並啟動閘道後，透過 OpenClaw 驗證橋接：

   ```bash
   openclaw channels status --probe
   ```

   iMessage 帳戶應回報 `works`；搭配 `--json` 時，探測承載會包含 `privateApi.available: true`。如果回報 `false`，請先修正該問題，請參閱 [功能偵測](/zh-TW/channels/imessage#private-api-actions)。探測需要可連線的閘道（否則命令列介面會退回僅設定輸出），且只會探測已設定並啟用的帳戶。

5. 建立設定快照：

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 設定轉換

iMessage 和 BlueBubbles 共用大多數通道層級行為鍵。變更的是傳輸（REST 伺服器 vs 本機命令列介面）以及群組登錄鍵格式。

| BlueBubbles                                                | 隨附 iMessage                            | 備註                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`              | 相同語意（區塊存在後預設為 `true`）。                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(已移除)_                               | 沒有 REST 伺服器 — 外掛會透過 stdio 產生 `imsg rpc`。                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.password`                            | _(已移除)_                               | 不需要網路鉤子驗證。                                                                                                                                                                                                                                                                                                |
| _(隱含)_                                                   | `channels.imessage.cliPath`              | `imsg` 的路徑（預設 `imsg`）；SSH 請使用包裝指令碼。                                                                                                                                                                                                                                                                 |
| _(隱含)_                                                   | `channels.imessage.dbPath`               | 選用的 Messages.app `chat.db` 覆寫；省略時會自動偵測。                                                                                                                                                                                                                                                               |
| _(隱含)_                                                   | `channels.imessage.remoteHost`           | `host` 或 `user@host` — 只有在 `cliPath` 是 SSH 包裝指令碼，且你想要用 SCP 擷取附件時才需要。                                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`             | 相同值（`pairing` / `allowlist` / `open` / `disabled`）；預設為 `pairing`。                                                                                                                                                                                                                                           |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`            | 相同控制代碼格式（`+15555550123`、`user@example.com`）。配對儲存中的核准不會轉移 — 見下方。                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`          | 相同值（`allowlist` / `open` / `disabled`）；預設為 `allowlist`。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`       | 相同。未設定時，iMessage 會退回使用 `allowFrom`；明確空值的 `groupAllowFrom: []` 會在 `groupPolicy: "allowlist"` 下封鎖所有群組。                                                                                                                                                                                     |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`               | 逐字複製 `"*"` 萬用字元項目；依數值型 iMessage `chat_id` 重新設定每個群組項目的鍵 — 見「群組登錄陷阱」。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` 會沿用。                                                                                                                                           |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`     | 預設 `true`。使用隨附外掛時，這只會在私有 API 探測已啟動時觸發。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`   | 相同形狀，同樣預設關閉。如果 BlueBubbles 上有附件流入，請明確設定此項 — 在設定前，傳入的照片/媒體會被默默丟棄（沒有 `Inbound message` 記錄行）。                                                                                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`      | 本機根目錄；相同萬用字元規則。                                                                                                                                                                                                                                                                                      |
| _(不適用)_                                                 | `channels.imessage.remoteAttachmentRoots` | 只在設定 `remoteHost` 進行 SCP 擷取時使用。                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`           | iMessage 預設為 16 MB（BlueBubbles 預設是 8 MB）。若要保留下限，請明確設定。                                                                                                                                                                                                                                         |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`       | 兩者皆預設為 4000。                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的選擇加入。僅限私訊 — 群組會保留逐訊息分派。除非已設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs`，否則會將預設傳入防彈跳時間加寬到 7000 毫秒。見[合併分段傳送的私訊](/zh-TW/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(不適用)_                               | `imsg` 已經會從 `chat.db` 顯示寄件者顯示名稱。                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`            | 相同的逐動作切換（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`），另新增 `polls`。全部預設啟用；私有 API 動作仍需要橋接。                                                                            |

多帳號設定（`channels.bluebubbles.accounts.*`）會一對一轉換為 `channels.imessage.accounts.*`。

## 群組登錄陷阱

隨附的 iMessage 外掛會連續執行兩個群組閘門。群組訊息必須同時通過兩者才會到達代理程式：

1. **寄件者 / 聊天目標允許清單**（`channels.imessage.groupAllowFrom`）— 比對寄件者控制代碼或聊天目標（`chat_id:`、`chat_guid:`、`chat_identifier:` 項目）。未設定 `groupAllowFrom` 時，此閘門會退回使用 `allowFrom`；明確的 `groupAllowFrom: []` 會停用該退回機制，並在 `groupPolicy: "allowlist"` 下丟棄每個群組訊息。
2. **群組登錄**（`channels.imessage.groups`）— 以數值型 iMessage `chat_id` 為鍵：
   - 沒有 `groups` 區塊（或區塊為空）：只要閘門 1 具有非空的有效寄件者允許清單，群組就會通過此閘門；寄件者篩選會控管存取，且不會觸發全部丟棄的啟動警告。
   - `groups` 有項目但沒有 `"*"`：只有列出的 `chat_id` 鍵會通過。列出任何群組都會讓登錄變成允許清單，即使在 `groupPolicy: "open"` 下也是如此。
   - `groups: { "*": { ... } }`：每個群組都會通過此閘門。

遷移陷阱：BlueBubbles 以聊天 GUID / 聊天識別碼作為 `groups` 項目的鍵，而 iMessage 登錄則以數值型 `chat_id` 為鍵。逐字複製的逐群組項目會建立非空登錄，但其鍵永遠不會相符，因此每個群組訊息都會在閘門 2 被丟棄。逐字複製 `"*"` 萬用字元；使用來自 `imsg chats` 的 `chat_id` 值重新設定特定群組項目的鍵。

兩種丟棄路徑都會以預設記錄層級透過 `warn` 行顯示：

- 啟動時每個帳號一次，當設定 `groupPolicy: "allowlist"` 且有效群組寄件者允許清單為空時：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。設定 `groupAllowFrom`（或 `allowFrom`）以允許寄件者；只新增 `groups` 並不會滿足寄件者閘門。
- 執行階段每個 `chat_id` 一次，當登錄丟棄群組時：`imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`，並指出要新增的確切鍵。

私訊無論如何都會繼續運作 — 它們採用不同的程式碼路徑，因此私訊成功並不能證明群組路由正常。

使用 `groupPolicy: "allowlist"` 的最小寄件者範圍設定：

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

這會允許已設定的寄件者進入任何群組。新增 `groups` 項目以限定允許的聊天，或設定逐聊天選項，例如 `requireMention`；逐字複製 BlueBubbles 的 `"*"` 項目，但用數值型 iMessage `chat_id` 值重新設定特定項目的鍵。

## 逐步操作

1. 翻譯設定。編輯時保持新區塊停用；舊的 `channels.bluebubbles` 區塊目前會被 OpenClaw 忽略，可並列保留作為參考：

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **切換並探測。** 設定 `channels.imessage.enabled: true`，重新啟動閘道，並確認通道回報為健康：

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   探測需要可連線的閘道，且只會探測已設定並啟用的帳號。使用 [開始之前](#before-you-start) 中的直接 `imsg` 命令來驗證 Mac 本身。

3. **驗證私訊。** 傳送直接訊息給代理程式；確認回覆送達。

4. **分開驗證群組。** 私訊和群組採用不同程式碼路徑，私訊成功並不能證明群組已正確路由。在允許的群組聊天中傳送訊息，並確認回覆送達。如果群組沒有回應（沒有代理程式回覆，也沒有錯誤），請檢查閘道日誌中上方「群組登錄表陷阱」的兩行 `warn`。啟動警告表示有效的寄件者允許清單是空的；每個 `chat_id` 的警告表示已填入的 `groups` 登錄表不包含該聊天。

5. **驗證動作介面。** 從已配對的私訊中，請代理程式做出反應、編輯、收回、回覆、傳送照片，並且（在群組中）重新命名群組或新增/移除參與者。每個動作都應以原生方式送達 Messages.app。如果任何動作拋出 `iMessage <action> requires the imsg private API bridge`，請再次執行 `imsg launch`，並使用 `openclaw channels status --probe` 重新整理。

6. 一旦 iMessage 私訊、群組和動作都已驗證，**移除 BlueBubbles 伺服器和 `channels.bluebubbles` 區塊**。OpenClaw 不會讀取 `channels.bluebubbles`。

## 動作一致性概覽

| 動作                                                | 舊版 BlueBubbles | 內建 iMessage                                                                 |
| --------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| 傳送文字 / SMS 備援                                 | ✅               | ✅                                                                            |
| 傳送媒體（照片、影片、檔案、語音）                  | ✅               | ✅                                                                            |
| 串接回覆（`reply_to_guid`）                         | ✅               | ✅（關閉 [#51892](https://github.com/openclaw/openclaw/issues/51892)）        |
| Tapback（`react`）                                  | ✅               | ✅                                                                            |
| 編輯 / 收回（macOS 13+ 收件者）                     | ✅               | ✅                                                                            |
| 傳送螢幕效果                                        | ✅               | ✅（關閉 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分） |
| 富文字粗體 / 斜體 / 底線 / 刪除線                   | ✅               | ✅（透過 attributedBody 進行 typed-run 格式化）                               |
| 原生 Messages 投票（建立和投票）                    | ❌               | ✅（`actions.polls`；收件者需要 iOS/macOS 26+ 才能原生呈現）                  |
| 重新命名群組 / 設定群組圖示                         | ✅               | ✅                                                                            |
| 新增 / 移除參與者、離開群組                         | ✅               | ✅                                                                            |
| 已讀回條和正在輸入指示器                            | ✅               | ✅（由私有 API 探測控管）                                                     |
| 相同寄件者私訊合併                                  | ✅               | ✅（僅限私訊；透過 `channels.imessage.coalesceSameSenderDms` 選擇啟用）       |
| 重新啟動後的傳入復原                                | ✅               | ✅（自動：`since_rowid` 重播 + GUID 去重；本機視窗更寬）                      |

iMessage 會復原閘道停機期間錯過的訊息：啟動時，它會透過 `imsg watch.subscribe` 的 `since_rowid` 從最後已派送的 rowid 重播、依 GUID 去重，並以陳舊待處理佇列年齡柵欄抑制 Push-flush「待處理佇列炸彈」。這會透過 `imsg` RPC 連線執行，因此也適用於遠端 SSH `cliPath` 設定；本機設定可讀取 `chat.db`，因此有更寬的復原視窗。請參閱[橋接器或閘道重新啟動後的傳入復原](/zh-TW/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配對、工作階段和 ACP 繫結

- **允許清單會依控制代碼沿用。** `channels.imessage.allowFrom` 會辨識 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字串，請原樣複製。
- **配對儲存的核准不會轉移。** 配對儲存是每個通道各自獨立，且不會遷移舊的 BlueBubbles 儲存。只透過配對核准的寄件者必須在 iMessage 下重新配對一次，或由你將其控制代碼新增至 `allowFrom`。
- **工作階段** 仍以每個代理程式 + 聊天為範圍。私訊會在預設 `session.dmScope=main` 下摺疊到代理程式主工作階段；群組工作階段則會依每個 `chat_id` 隔離（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles 工作階段鍵下的舊對話歷史不會帶入 iMessage 工作階段。
- 參照 `match.channel: "bluebubbles"` 的 **ACP 繫結** 必須改為 `"imessage"`。`match.peer.id` 形狀（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸控制代碼）相同。

## 沒有回復通道

沒有受支援的 BlueBubbles 執行階段可切回。如果 iMessage 驗證失敗，請設定 `channels.imessage.enabled: false`、重新啟動閘道、修正 `imsg` 阻塞問題，然後重試切換。

回覆快取位於 SQLite 外掛狀態中。`openclaw doctor --fix` 會在舊的 `imessage/reply-cache.jsonl` sidecar 存在時匯入並封存它。

## 相關

- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 簡短公告與操作員摘要。
- [iMessage](/zh-TW/channels/imessage) — 完整 iMessage 通道參考，包含 `imsg launch` 設定和能力偵測。
- `/channels/bluebubbles` — 會重新導向至本遷移指南的舊版 URL。
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程。
- [通道路由](/zh-TW/channels/channel-routing) — 閘道如何為傳出回覆選擇通道。
