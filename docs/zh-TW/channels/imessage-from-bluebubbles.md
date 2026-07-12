---
read_when:
    - 規劃從 BlueBubbles 遷移至內建的 iMessage 外掛
    - 將 BlueBubbles 設定鍵轉換為對應的 iMessage 設定鍵
    - 啟用 iMessage 外掛前驗證 imsg
summary: 將舊版 BlueBubbles 設定轉換至內建的 iMessage 外掛：鍵值對應、群組允許清單閘門，以及切換驗證。
title: 來自 BlueBubbles
x-i18n:
    generated_at: "2026-07-12T14:18:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles 支援已移除。OpenClaw 僅透過內建的 `imessage` 外掛支援 iMessage；此外掛透過 JSON-RPC 驅動 [`steipete/imsg`](https://github.com/steipete/imsg)，並可存取與 BlueBubbles 相同的私有 API 功能介面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、原生投票、群組管理、附件）。單一命令列介面執行檔取代了 BlueBubbles 伺服器、用戶端應用程式與網路鉤子管線：不需要 REST 端點，也不需要網路鉤子驗證。

本指南說明如何將舊的 `channels.bluebubbles` 設定遷移至 `channels.imessage`。沒有其他受支援的遷移路徑。在目前的 OpenClaw 中，殘留的 `channels.bluebubbles` 區塊不會生效，因為執行階段不會讀取它。

<Note>
如需簡短公告與維運人員摘要，請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)。
</Note>

## 遷移檢查清單

如果你已經熟悉舊的 BlueBubbles 設定，最簡短且安全的做法如下：

1. 直接在執行 Messages.app 的 Mac 上驗證 `imsg`（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 將行為設定鍵從 `channels.bluebubbles` 複製至 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 移除已不存在的傳輸設定鍵：`serverUrl`、`password`、網路鉤子 URL，以及 BlueBubbles 伺服器設定。
4. 如果閘道並非在 Messages 所在的 Mac 上執行，請將 `channels.imessage.cliPath` 設為 SSH 包裝器，並設定 `remoteHost` 以便從遠端擷取附件。
5. 啟用 `channels.imessage`、重新啟動閘道，然後執行 `openclaw channels status --probe --channel imessage`。
6. 測試一則私訊、一個允許的群組、附件（若已啟用），以及你預期代理程式會使用的每項私有 API 動作。
7. 驗證 iMessage 路徑後，刪除 BlueBubbles 伺服器與舊的 `channels.bluebubbles` 設定。

## imsg 的功能

`imsg` 是 Messages 的本機 macOS 命令列介面。OpenClaw 會以子程序啟動 `imsg rpc`，並透過 stdin/stdout 使用 JSON-RPC 通訊。不需要 HTTP 伺服器、網路鉤子 URL、背景常駐程式、啟動代理程式，也不需要開放任何連接埠。

- 使用唯讀 SQLite 控制代碼從 `~/Library/Messages/chat.db` 讀取資料。
- 即時傳入訊息來自 `imsg watch` / `watch.subscribe`；它會追蹤 `chat.db` 的檔案系統事件，並以輪詢作為備援。
- 一般文字和檔案傳送會使用 Messages.app 自動化。
- 進階動作會使用 `imsg launch`，將 `imsg` 輔助程式注入 Messages.app。這會啟用已讀回條、輸入中指示器、豐富內容傳送、編輯、收回、討論串回覆、表情回應、投票與群組管理。
- Linux 組建可以檢查複製的 `chat.db`，但無法傳送訊息、監看 Mac 上的即時資料庫，或控制 Messages.app。若要使用 OpenClaw iMessage，請在已登入的 Mac 上執行 `imsg`，或透過指向該 Mac 的 SSH 包裝器執行。

## 開始之前

1. 在執行 Messages.app 的 Mac 上安裝 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   對於一般的本機設定，OpenClaw 設定流程可以在使用者確認後，於已登入 Messages 的 Mac 上安裝或更新 Homebrew 版的 `imsg`。手動設定與 SSH 包裝器拓撲仍由維運人員管理：請在將執行 `imsg` 的相同本機或遠端使用者環境中重複執行 Homebrew 更新。如果 `imsg chats` 因 `unable to open database file`、輸出為空或 `authorization denied` 而失敗，請將「完整磁碟存取權」授予啟動 `imsg` 的終端機、編輯器、Node 程序、閘道服務或 SSH 父程序，然後重新開啟該父程序。

2. 在變更 OpenClaw 設定之前，驗證讀取、監看、傳送與 RPC 功能介面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   請將 `42` 替換為 `imsg chats` 中的實際聊天 ID。傳送訊息需要 Messages.app 的「自動化」權限。如果 OpenClaw 將透過 SSH 執行，請透過 OpenClaw 將使用的相同 SSH 包裝器或使用者環境執行這些命令。如果讀取正常，但傳送因 AppleEvents `-1743` 而失敗，請檢查「自動化」權限是否授予 `/usr/libexec/sshd-keygen-wrapper`；請參閱 [SSH 包裝器傳送因 AppleEvents -1743 而失敗](/zh-TW/channels/imessage#requirements-and-permissions-macos)。

3. 啟用私有 API 橋接器。強烈建議為 OpenClaw iMessage 啟用此功能，因為回覆、表情回應、效果、投票、附件回覆與群組動作都依賴它：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 要求停用 SIP（在新版本 macOS 上，也必須放寬程式庫驗證，請參閱 [啟用 imsg 私有 API](/zh-TW/channels/imessage#enabling-the-imsg-private-api)）。即使未執行 `imsg launch`，基本傳送、歷史記錄與監看功能仍可運作；但無法使用完整的 OpenClaw iMessage 動作功能介面。

4. 啟用 `channels.imessage` 並啟動閘道後，透過 OpenClaw 驗證橋接器：

   ```bash
   openclaw channels status --probe
   ```

   iMessage 帳號應回報 `works`；使用 `--json` 時，探測承載資料會包含 `privateApi.available: true`。如果回報 `false`，請先修正此問題，詳情請參閱 [功能偵測](/zh-TW/channels/imessage#private-api-actions)。探測需要可連線的閘道（否則命令列介面會退回僅輸出設定資訊），且只會探測已設定並啟用的帳號。

5. 建立設定快照：

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 設定轉換

iMessage 與 BlueBubbles 共用大多數頻道層級的行為設定鍵。改變的是傳輸方式（REST 伺服器與本機命令列介面之別），以及群組登錄設定鍵的格式。

| BlueBubbles                                                | 內建 iMessage                             | 備註                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 語意相同（區塊存在後預設為 `true`）。                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                              | 沒有 REST 伺服器——此外掛會透過 stdio 啟動 `imsg rpc`。                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.password`                            | _（已移除）_                              | 不需要網路鉤子驗證。                                                                                                                                                                                                                                                                                                  |
| _（隱含）_                                                 | `channels.imessage.cliPath`               | `imsg` 的路徑（預設為 `imsg`）；若使用 SSH，請使用包裝指令碼。                                                                                                                                                                                                                                                        |
| _（隱含）_                                                 | `channels.imessage.dbPath`                | 可選的 Messages.app `chat.db` 覆寫；省略時會自動偵測。                                                                                                                                                                                                                                                                |
| _（隱含）_                                                 | `channels.imessage.remoteHost`            | `host` 或 `user@host`——僅當 `cliPath` 是 SSH 包裝程式，且你想透過 SCP 擷取附件時才需要。                                                                                                                                                                                                                               |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）；預設為 `pairing`。                                                                                                                                                                                                                                           |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 控制代碼格式相同（`+15555550123`、`user@example.com`）。配對儲存區中的核准不會轉移——請見下文。                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）；預設為 `allowlist`。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。未設定時，iMessage 會回退至 `allowFrom`；明確設為空的 `groupAllowFrom: []` 會在 `groupPolicy: "allowlist"` 下封鎖所有群組。                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | 逐字複製 `"*"` 萬用字元項目；依數字型 iMessage `chat_id` 重新設定各群組項目的鍵——請參閱「群組登錄陷阱」。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` 可直接沿用。                                                                                                                                             |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 預設為 `true`。使用內建外掛時，僅在私有 API 探測可用時才會觸發。                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 結構相同，且同樣預設關閉。如果 BlueBubbles 原本會傳遞附件，請明確設定此項——在設定前，傳入的照片／媒體會被靜默捨棄（不會出現 `Inbound message` 記錄行）。                                                                                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本機根目錄；萬用字元規則相同。                                                                                                                                                                                                                                                                                        |
| _（不適用）_                                               | `channels.imessage.remoteAttachmentRoots` | 僅在設定 `remoteHost` 以透過 SCP 擷取時使用。                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 預設為 16 MB（BlueBubbles 預設為 8 MB）。若要保留較低上限，請明確設定。                                                                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 兩者預設皆為 4000。                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同樣需選擇啟用。僅適用於私訊——群組維持逐則訊息分派。除非已設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs`，否則會將預設的傳入防彈跳時間延長至 7000 ms。請參閱[合併分段傳送的私訊](/zh-TW/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不適用）_                              | `imsg` 已會從 `chat.db` 提供傳送者顯示名稱。                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每個動作的切換項目相同（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`），並新增 `polls`。全部預設啟用；私有 API 動作仍需要橋接器。                                                                         |

多帳號設定（`channels.bluebubbles.accounts.*`）可一對一轉換為 `channels.imessage.accounts.*`。

## 群組登錄陷阱

內建 iMessage 外掛會依序執行兩道群組閘門。群組訊息必須同時通過兩者，才能送達代理程式：

1. **傳送者／聊天目標允許清單**（`channels.imessage.groupAllowFrom`）——比對傳送者控制代碼或聊天目標（`chat_id:`、`chat_guid:`、`chat_identifier:` 項目）。未設定 `groupAllowFrom` 時，此閘門會回退至 `allowFrom`；明確設定 `groupAllowFrom: []` 會停用該回退，並在 `groupPolicy: "allowlist"` 下捨棄所有群組訊息。
2. **群組登錄**（`channels.imessage.groups`）——以數字型 iMessage `chat_id` 作為鍵：
   - 沒有 `groups` 區塊（或區塊為空）：只要閘門 1 的有效傳送者允許清單非空，群組便可通過此閘門；存取權由傳送者篩選控管，且啟動時不會發出全部捨棄警告。
   - `groups` 有項目但沒有 `"*"`：只有列出的 `chat_id` 鍵可通過。即使 `groupPolicy: "open"`，只要列出任何群組，登錄就會成為允許清單。
   - `groups: { "*": { ... } }`：所有群組都可通過此閘門。

遷移陷阱：BlueBubbles 的 `groups` 項目以聊天 GUID／聊天識別碼為鍵，而 iMessage 登錄則以數字型 `chat_id` 為鍵。逐字複製各群組項目會建立非空的登錄，但其中的鍵永遠無法匹配，因此所有群組訊息都會在閘門 2 被捨棄。請逐字複製 `"*"` 萬用字元；特定群組項目則使用 `imsg chats` 中的 `chat_id` 值重新設定鍵。

兩種捨棄路徑都會透過預設記錄層級的 `warn` 行顯示：

- 啟動時每個帳號一次：當設定 `groupPolicy: "allowlist"`，但有效的群組傳送者允許清單為空時：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。請設定 `groupAllowFrom`（或 `allowFrom`）以允許傳送者；僅新增 `groups` 無法滿足傳送者閘門。
- 執行階段每個 `chat_id` 一次：當登錄捨棄群組時：`imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`，其中會指出要新增的確切鍵。

無論哪種情況，私訊都仍可運作——私訊採用不同的程式碼路徑，因此私訊成功不代表群組路由正常。

搭配 `groupPolicy: "allowlist"` 的最小傳送者範圍設定：

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

這會允許已設定的傳送者進入任何群組。新增 `groups` 項目可限制允許的聊天，或設定各聊天的選項，例如 `requireMention`；請逐字複製 BlueBubbles 的 `"*"` 項目，但特定項目必須使用數字型 iMessage `chat_id` 值重新設定鍵。

## 逐步操作

1. 轉換設定。編輯時先讓新的區塊保持停用；目前的 OpenClaw 會忽略舊的 `channels.bluebubbles` 區塊，因此可以將它保留在旁邊作為參考：

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

2. **切換並探測。** 將 `channels.imessage.enabled: true` 設定好、重新啟動閘道，並確認頻道回報健康狀態：

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   探測需要可連線的閘道，而且只會探測已設定且啟用的帳號。使用[開始之前](#before-you-start)中的直接 `imsg` 命令來驗證 Mac 本身。

3. **驗證私訊。** 傳送私訊給代理程式，確認回覆成功送達。

4. **分別驗證群組。** 私訊與群組使用不同的程式碼路徑——私訊成功不代表群組路由正常。請在允許的群組聊天中傳送訊息，並確認回覆成功送達。如果群組沒有任何回應（代理程式未回覆，也沒有錯誤），請檢查閘道日誌中上述「Group registry footgun」的兩行 `warn`。啟動警告表示實際生效的傳送者允許清單是空的；個別 `chat_id` 警告表示已有內容的 `groups` 登錄中不包含該聊天。

5. **驗證動作介面。** 從已配對的私訊中，要求代理程式加入回應、編輯、收回、回覆、傳送照片，以及（在群組中）重新命名群組或新增／移除參與者。每個動作都應在 Messages.app 中以原生方式完成。如果任何動作擲回 `iMessage <action> requires the imsg private API bridge`，請再次執行 `imsg launch`，並使用 `openclaw channels status --probe` 重新整理。

6. 驗證 iMessage 私訊、群組和動作後，**移除 BlueBubbles 伺服器與 `channels.bluebubbles` 區塊**。OpenClaw 不會讀取 `channels.bluebubbles`。

## 動作功能對照一覽

| 動作                                                | 舊版 BlueBubbles    | 內建 iMessage                                                                 |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| 傳送文字／SMS 備援                                  | ✅                 | ✅                                                                            |
| 傳送媒體（照片、影片、檔案、語音）                  | ✅                 | ✅                                                                            |
| 討論串回覆（`reply_to_guid`）                       | ✅                 | ✅（解決 [#51892](https://github.com/openclaw/openclaw/issues/51892)）        |
| Tapback（`react`）                                  | ✅                 | ✅                                                                            |
| 編輯／收回（macOS 13+ 收件者）                      | ✅                 | ✅                                                                            |
| 使用螢幕效果傳送                                    | ✅                 | ✅（解決 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分） |
| 富文字粗體／斜體／底線／刪除線                     | ✅                 | ✅（透過 attributedBody 進行型別化範圍格式設定）                              |
| 原生 Messages 投票（建立與投票）                    | ❌                 | ✅（`actions.polls`；收件者需要 iOS/macOS 26+ 才能原生呈現）                  |
| 重新命名群組／設定群組圖示                          | ✅                 | ✅                                                                            |
| 新增／移除參與者、離開群組                          | ✅                 | ✅                                                                            |
| 已讀回條與輸入指示器                                | ✅                 | ✅（受私有 API 探測結果限制）                                                 |
| 合併相同傳送者的私訊                                | ✅                 | ✅（僅限私訊；透過 `channels.imessage.coalesceSameSenderDms` 選擇啟用）       |
| 重新啟動後的輸入訊息復原                            | ✅                 | ✅（自動：`since_rowid` 重播 + GUID 去重；本機使用較寬的時間範圍）            |

iMessage 會復原閘道停機期間遺漏的訊息：啟動時，它會透過 `imsg watch.subscribe` 的 `since_rowid`，從最後派送的 rowid 開始重播、依 GUID 去重，並使用過期積壓訊息的年齡界線，避免 Push 清空時發生「積壓訊息炸彈」。此流程透過 `imsg` RPC 連線執行，因此也適用於遠端 SSH `cliPath` 設定；本機設定可以讀取 `chat.db`，因此具有較寬的復原時間範圍。請參閱[橋接器或閘道重新啟動後的輸入訊息復原](/zh-TW/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配對、工作階段與 ACP 繫結

- **允許清單會依控制代碼沿用。** `channels.imessage.allowFrom` 可辨識 BlueBubbles 使用的相同 `+15555550123`／`user@example.com` 字串——請原樣複製。
- **配對儲存區的核准不會轉移。** 配對儲存區依頻道區分，且不會遷移舊的 BlueBubbles 儲存區。僅透過配對核准的傳送者，必須在 iMessage 下再次配對，或由你將其控制代碼加入 `allowFrom`。
- **工作階段**仍依代理程式 + 聊天劃分範圍。使用預設的 `session.dmScope=main` 時，私訊會合併至代理程式的主要工作階段；群組工作階段則會依 `chat_id` 保持隔離（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles 工作階段鍵下的舊對話記錄不會帶入 iMessage 工作階段。
- **ACP 繫結**中參照 `match.channel: "bluebubbles"` 的部分必須改為 `"imessage"`。`match.peer.id` 的格式（`chat_id:`、`chat_guid:`、`chat_identifier:`、單獨的控制代碼）完全相同。

## 沒有可回復的頻道

沒有受支援的 BlueBubbles 執行階段可供切回。如果 iMessage 驗證失敗，請設定 `channels.imessage.enabled: false`、重新啟動閘道、修正 `imsg` 阻礙因素，然後重試切換。

回覆快取位於 SQLite 外掛狀態中。如果舊的 `imessage/reply-cache.jsonl` 附屬檔案存在，`openclaw doctor --fix` 會將其匯入並封存。

## 相關內容

- [移除 BlueBubbles 與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)——簡短公告與操作人員摘要。
- [iMessage](/zh-TW/channels/imessage)——完整的 iMessage 頻道參考資料，包括 `imsg launch` 設定與功能偵測。
- `/channels/bluebubbles`——會重新導向至此遷移指南的舊版 URL。
- [配對](/zh-TW/channels/pairing)——私訊驗證與配對流程。
- [頻道路由](/zh-TW/channels/channel-routing)——閘道如何選擇用於傳出回覆的頻道。
