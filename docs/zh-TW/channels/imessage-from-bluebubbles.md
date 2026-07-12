---
read_when:
    - 規劃從 BlueBubbles 遷移至內建的 iMessage 外掛
    - 將 BlueBubbles 設定鍵轉換為對應的 iMessage 設定鍵
    - 在啟用 iMessage 外掛前驗證 imsg
summary: 將舊版 BlueBubbles 設定轉換至內建的 iMessage 外掛：鍵值對應、群組允許清單閘門與切換驗證。
title: 從 BlueBubbles 遷移而來
x-i18n:
    generated_at: "2026-07-11T21:05:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

BlueBubbles 支援已移除。OpenClaw 僅透過內建的 `imessage` 外掛支援 iMessage；此外掛透過 JSON-RPC 驅動 [`steipete/imsg`](https://github.com/steipete/imsg)，並可存取與 BlueBubbles 相同的私有 API 功能範圍（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、原生投票、群組管理、附件）。單一命令列介面執行檔取代了 BlueBubbles 伺服器、用戶端應用程式及網路鉤子串接：不需要 REST 端點，也不需要網路鉤子驗證。

本指南說明如何將舊的 `channels.bluebubbles` 設定遷移至 `channels.imessage`。目前沒有其他受支援的遷移途徑。在現行 OpenClaw 中，殘留的 `channels.bluebubbles` 區塊不會產生任何作用，執行階段不會讀取它。

<Note>
如需簡短公告與操作人員摘要，請參閱 [BlueBubbles 移除及 imsg iMessage 途徑](/zh-TW/announcements/bluebubbles-imessage)。
</Note>

## 遷移檢查清單

如果你已熟悉舊的 BlueBubbles 設定，最簡短且安全的做法如下：

1. 直接在執行 Messages.app 的 Mac 上驗證 `imsg`（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. 將行為設定鍵從 `channels.bluebubbles` 複製到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 及 `actions`。
3. 移除已不存在的傳輸設定鍵：`serverUrl`、`password`、網路鉤子 URL，以及 BlueBubbles 伺服器設定。
4. 如果閘道不是在 Messages Mac 上執行，請將 `channels.imessage.cliPath` 設為 SSH 包裝器，並設定 `remoteHost` 以便從遠端擷取附件。
5. 啟用 `channels.imessage`、重新啟動閘道，然後執行 `openclaw channels status --probe --channel imessage`。
6. 測試一則私人訊息、一個允許的群組、附件（若已啟用），以及你預期代理程式會使用的每項私有 API 動作。
7. 驗證 iMessage 途徑後，刪除 BlueBubbles 伺服器及舊的 `channels.bluebubbles` 設定。

## imsg 的功能

`imsg` 是 Messages 的本機 macOS 命令列介面。OpenClaw 會以子程序形式啟動 `imsg rpc`，並透過 stdin/stdout 使用 JSON-RPC 通訊。不需要 HTTP 伺服器、網路鉤子 URL、背景常駐程式、啟動代理程式，也不需要公開任何連接埠。

- 讀取作業會使用唯讀 SQLite 控制代碼存取 `~/Library/Messages/chat.db`。
- 即時傳入訊息來自 `imsg watch`／`watch.subscribe`；它會追蹤 `chat.db` 的檔案系統事件，並以輪詢作為後備機制。
- 一般文字與檔案傳送會使用 Messages.app 自動化。
- 進階動作會使用 `imsg launch`，將 `imsg` 輔助程式注入 Messages.app。這可啟用已讀回條、輸入指示器、豐富內容傳送、編輯、收回、討論串回覆、點按回應、投票及群組管理。
- Linux 組建可以檢查複製的 `chat.db`，但無法傳送訊息、監看 Mac 上的即時資料庫，或驅動 Messages.app。若要使用 OpenClaw iMessage，請在已登入的 Mac 上執行 `imsg`，或透過 SSH 包裝器連線到該 Mac。

## 開始之前

1. 在執行 Messages.app 的 Mac 上安裝 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   對於一般本機設定，OpenClaw 設定流程可在已登入 Messages 的 Mac 上提供經使用者確認的 Homebrew `imsg` 安裝或更新。手動設定及 SSH 包裝器拓撲仍由操作人員管理：請在將執行 `imsg` 的同一本機或遠端使用者環境中重複執行 Homebrew 更新。如果 `imsg chats` 失敗並顯示 `unable to open database file`、沒有輸出或 `authorization denied`，請將「完整磁碟存取權」授予啟動 `imsg` 的終端機、編輯器、節點程序、閘道服務或 SSH 父程序，然後重新開啟該父程序。

2. 在變更 OpenClaw 設定前，先驗證讀取、監看、傳送及 RPC 功能：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   請將 `42` 替換為 `imsg chats` 中的實際聊天 ID。傳送訊息需要 Messages.app 的「自動化」權限。如果 OpenClaw 將透過 SSH 執行，請透過 OpenClaw 將使用的相同 SSH 包裝器或使用者環境執行這些命令。如果讀取正常，但傳送因 AppleEvents `-1743` 而失敗，請檢查「自動化」權限是否授予了 `/usr/libexec/sshd-keygen-wrapper`；請參閱 [SSH 包裝器傳送因 AppleEvents -1743 而失敗](/zh-TW/channels/imessage#requirements-and-permissions-macos)。

3. 啟用私有 API 橋接。強烈建議為 OpenClaw iMessage 啟用此功能，因為回覆、點按回應、特效、投票、附件回覆及群組動作都依賴它：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要停用 SIP（在現代 macOS 上還需要放寬程式庫驗證，請參閱 [啟用 imsg 私有 API](/zh-TW/channels/imessage#enabling-the-imsg-private-api)）。基本傳送、歷史記錄及監看功能無須 `imsg launch` 即可運作，但完整的 OpenClaw iMessage 動作功能則無法運作。

4. 啟用 `channels.imessage` 並啟動閘道後，透過 OpenClaw 驗證橋接：

   ```bash
   openclaw channels status --probe
   ```

   iMessage 帳號應回報 `works`；使用 `--json` 時，探測承載資料會包含 `privateApi.available: true`。如果回報 `false`，請先修正此問題，詳見 [功能偵測](/zh-TW/channels/imessage#private-api-actions)。探測需要可連線的閘道（否則命令列介面只會回退至僅輸出設定），且只會探測已設定並啟用的帳號。

5. 建立設定快照：

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## 設定轉換

iMessage 與 BlueBubbles 共用大多數頻道層級的行為設定鍵。不同之處在於傳輸方式（REST 伺服器與本機命令列介面）及群組登錄設定鍵的格式。

| BlueBubbles                                                | 內建 iMessage                             | 備註                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 語意相同（區塊存在後預設為 `true`）。                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                              | 不使用 REST 伺服器——此外掛會透過 stdio 啟動 `imsg rpc`。                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _（已移除）_                              | 不需要網路鉤子驗證。                                                                                                                                                                                                                                                                                                  |
| _（隱含）_                                                 | `channels.imessage.cliPath`               | `imsg` 的路徑（預設為 `imsg`）；若使用 SSH，請使用包裝指令碼。                                                                                                                                                                                                                                                       |
| _（隱含）_                                                 | `channels.imessage.dbPath`                | 可選擇覆寫 Messages.app 的 `chat.db`；省略時會自動偵測。                                                                                                                                                                                                                                                             |
| _（隱含）_                                                 | `channels.imessage.remoteHost`            | `host` 或 `user@host`——僅當 `cliPath` 是 SSH 包裝指令碼，且需要透過 SCP 擷取附件時才需要。                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）；預設為 `pairing`。                                                                                                                                                                                                                                           |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 控制代碼格式相同（`+15555550123`、`user@example.com`）。配對儲存區中的核准不會轉移——請參閱下文。                                                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）；預設為 `allowlist`。                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。未設定時，iMessage 會回退至 `allowFrom`；明確設為空的 `groupAllowFrom: []` 會在 `groupPolicy: "allowlist"` 下封鎖所有群組。                                                                                                                                                                                       |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | 逐字複製 `"*"` 萬用字元項目；依數字 iMessage `chat_id` 重新設定各群組項目的鍵——請參閱「群組登錄陷阱」。`requireMention`、`tools`、`toolsBySender`、`systemPrompt` 可直接沿用。                                                                                                                                             |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 預設為 `true`。使用內建外掛時，僅在私有 API 探測可用時才會觸發。                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 結構相同，也同樣預設停用。若 BlueBubbles 原本會傳送附件，請明確設定此項——在設定之前，傳入的照片／媒體會被靜默捨棄（不會出現 `Inbound message` 記錄行）。                                                                                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本機根目錄；萬用字元規則相同。                                                                                                                                                                                                                                                                                        |
| _（不適用）_                                               | `channels.imessage.remoteAttachmentRoots` | 僅在設定 `remoteHost` 以透過 SCP 擷取附件時使用。                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 預設為 16 MB（BlueBubbles 預設為 8 MB）。若要維持較低上限，請明確設定。                                                                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 兩者預設均為 4000。                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同樣為選用功能。僅適用於私訊——群組仍會逐則分派訊息。除非設定了 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs`，否則會將預設的傳入防抖時間延長至 7000 毫秒。請參閱[合併分次傳送的私訊](/zh-TW/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不適用）_                              | `imsg` 已會從 `chat.db` 提供傳送者顯示名稱。                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每項動作的切換設定相同（`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`），並新增 `polls`。全部預設啟用；私有 API 動作仍需要橋接器。                                                                         |

多帳號設定（`channels.bluebubbles.accounts.*`）可一對一轉換為 `channels.imessage.accounts.*`。

## 群組登錄陷阱

內建 iMessage 外掛會連續執行兩道群組閘門。群組訊息必須通過兩者才能抵達代理程式：

1. **傳送者／聊天目標允許清單**（`channels.imessage.groupAllowFrom`）——比對傳送者控制代碼或聊天目標（`chat_id:`、`chat_guid:`、`chat_identifier:` 項目）。未設定 `groupAllowFrom` 時，此閘門會回退至 `allowFrom`；明確設定 `groupAllowFrom: []` 會停用該回退機制，並在 `groupPolicy: "allowlist"` 下捨棄所有群組訊息。
2. **群組登錄**（`channels.imessage.groups`）——以數字 iMessage `chat_id` 作為鍵：
   - 沒有 `groups` 區塊（或區塊為空）：只要閘門 1 的有效傳送者允許清單非空，群組就能通過此閘門；存取權由傳送者篩選控制，且啟動時不會觸發全部捨棄警告。
   - `groups` 有項目但沒有 `"*"`：只有列出的 `chat_id` 鍵能通過。即使 `groupPolicy: "open"`，只要列出任何群組，登錄就會成為允許清單。
   - `groups: { "*": { ... } }`：所有群組都能通過此閘門。

遷移陷阱：BlueBubbles 的 `groups` 項目以聊天 GUID／聊天識別碼作為鍵，而 iMessage 登錄則以數字 `chat_id` 作為鍵。逐字複製各群組項目會建立非空登錄，但其鍵永遠無法相符，因此所有群組訊息都會在閘門 2 被捨棄。請逐字複製 `"*"` 萬用字元；使用 `imsg chats` 取得的 `chat_id` 值，重新設定特定群組項目的鍵。

兩種捨棄路徑都會透過 `warn` 記錄行顯示於預設記錄層級：

- 啟動時每個帳號一次：當設定了 `groupPolicy: "allowlist"`，但有效的群組傳送者允許清單為空時：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`。請設定 `groupAllowFrom`（或 `allowFrom`）以允許傳送者；僅新增 `groups` 無法滿足傳送者閘門。
- 執行階段每個 `chat_id` 一次：當登錄捨棄群組時：`imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`，其中會指出需要新增的確切鍵。

無論哪種情況，私訊都能繼續運作——私訊採用不同的程式碼路徑，因此私訊成功不代表群組路由正常。

使用 `groupPolicy: "allowlist"` 時，最低限度且限定傳送者範圍的設定如下：

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

這會允許已設定的傳送者在任何群組中傳送訊息。若要限制允許的聊天，或設定 `requireMention` 等各聊天選項，請新增 `groups` 項目；逐字複製 BlueBubbles 的 `"*"` 項目，但特定項目必須改用數字 iMessage `chat_id` 值作為鍵。

## 逐步操作

1. 轉換設定。在編輯期間保持新區塊停用；目前的 OpenClaw 會忽略舊的 `channels.bluebubbles` 區塊，因此可將其保留在旁作為參考：

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // 準備好切換時改為 true
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // 從 bluebubbles.allowFrom 複製
         groupPolicy: "allowlist",
         groupAllowFrom: [], // 從 bluebubbles.groupAllowFrom 複製
         groups: { "*": { requireMention: true } }, // 萬用字元原樣複製；依 chat_id 重新設定各聊天項目的鍵值
         // 動作預設啟用；將個別開關設為 false 即可停用
       },
     },
   }
   ```

2. **切換並探測。** 將 `channels.imessage.enabled: true` 設定完成，重新啟動閘道，並確認頻道回報為健康狀態：

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # 預期顯示 "works"；--json 會顯示 privateApi.available: true
   ```

   探測需要可連線的閘道，且只會探測已設定並啟用的帳號。請使用[開始之前](#before-you-start)中的直接 `imsg` 命令驗證 Mac 本身。

3. **驗證私訊。** 傳送私訊給代理程式；確認收到回覆。

4. **另外驗證群組。** 私訊與群組採用不同的程式碼路徑——私訊成功不代表群組路由正常。在允許的群組聊天中傳送訊息，並確認收到回覆。如果群組沒有任何回應（代理程式未回覆，也沒有錯誤），請檢查閘道記錄中是否出現上方「群組登錄常見陷阱」的兩行 `warn`。啟動警告表示實際生效的傳送者允許清單為空；個別 `chat_id` 警告表示已有內容的 `groups` 登錄中不包含該聊天。

5. **驗證動作介面。** 從已配對的私訊中，要求代理程式加入回應、編輯、收回、回覆、傳送照片，以及（在群組中）重新命名群組或新增／移除參與者。每項動作都應在 Messages.app 中以原生方式呈現。若任何動作擲回 `iMessage <action> requires the imsg private API bridge`，請再次執行 `imsg launch`，再以 `openclaw channels status --probe` 重新整理狀態。

6. 驗證 iMessage 私訊、群組和動作後，**移除 BlueBubbles 伺服器與 `channels.bluebubbles` 區塊**。OpenClaw 不會讀取 `channels.bluebubbles`。

## 動作支援概覽

| 動作                                                | 舊版 BlueBubbles    | 內建 iMessage                                                                 |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| 傳送文字／SMS 備援                                  | ✅                 | ✅                                                                            |
| 傳送媒體（照片、影片、檔案、語音）                  | ✅                 | ✅                                                                            |
| 討論串回覆（`reply_to_guid`）                       | ✅                 | ✅（解決 [#51892](https://github.com/openclaw/openclaw/issues/51892)）         |
| Tapback（`react`）                                  | ✅                 | ✅                                                                            |
| 編輯／收回（macOS 13+ 收件者）                      | ✅                 | ✅                                                                            |
| 使用螢幕特效傳送                                    | ✅                 | ✅（解決 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分）  |
| 富文字粗體／斜體／底線／刪除線                     | ✅                 | ✅（透過 attributedBody 進行具型別的文字片段格式化）                          |
| 原生 Messages 投票（建立與投票）                   | ❌                 | ✅（`actions.polls`；收件者需使用 iOS/macOS 26+ 才能原生呈現）                |
| 重新命名群組／設定群組圖示                          | ✅                 | ✅                                                                            |
| 新增／移除參與者、離開群組                         | ✅                 | ✅                                                                            |
| 已讀回條與輸入指示器                                | ✅                 | ✅（受私有 API 探測結果限制）                                                 |
| 合併相同傳送者的私訊                                | ✅                 | ✅（僅限私訊；透過 `channels.imessage.coalesceSameSenderDms` 選擇啟用）       |
| 重新啟動後復原入站訊息                              | ✅                 | ✅（自動：`since_rowid` 重播 + GUID 去重；本機使用更寬的時間範圍）            |

iMessage 會復原閘道停機期間遺漏的訊息：啟動時，會透過 `imsg watch.subscribe` 的 `since_rowid`，從最後已分派的 rowid 開始重播，依 GUID 去重，並以過期積壓訊息的時間防線抑制推送清空時的「積壓炸彈」。此流程透過 `imsg` RPC 連線執行，因此也適用於遠端 SSH `cliPath` 設定；本機設定因可讀取 `chat.db`，所以使用更寬的復原時間範圍。請參閱[橋接器或閘道重新啟動後的入站復原](/zh-TW/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配對、工作階段與 ACP 繫結

- **允許清單會依識別碼沿用。** `channels.imessage.allowFrom` 可識別 BlueBubbles 所使用的相同 `+15555550123`／`user@example.com` 字串——請原樣複製。
- **配對儲存區的核准不會轉移。** 配對儲存區依頻道區分，且不會遷移舊的 BlueBubbles 儲存區。僅透過配對獲准的傳送者，必須在 iMessage 下重新配對一次，或者將其識別碼加入 `allowFrom`。
- **工作階段**仍依代理程式與聊天劃分範圍。在預設 `session.dmScope=main` 下，私訊會合併至代理程式的主要工作階段；群組工作階段則依各個 `chat_id` 隔離（`agent:<agentId>:imessage:group:<chat_id>`）。BlueBubbles 工作階段鍵下的舊對話記錄不會轉移到 iMessage 工作階段。
- 參照 `match.channel: "bluebubbles"` 的 **ACP 繫結**必須改為 `"imessage"`。`match.peer.id` 的格式（`chat_id:`、`chat_guid:`、`chat_identifier:`、單獨的識別碼）完全相同。

## 無回復頻道

沒有可供切換回去的受支援 BlueBubbles 執行階段。若 iMessage 驗證失敗，請設定 `channels.imessage.enabled: false`、重新啟動閘道、修正 `imsg` 阻礙因素，然後重試切換。

回覆快取儲存在 SQLite 外掛狀態中。若舊的 `imessage/reply-cache.jsonl` 附屬檔案存在，`openclaw doctor --fix` 會將其匯入並封存。

## 相關內容

- [移除 BlueBubbles 與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)——簡短公告與操作人員摘要。
- [iMessage](/zh-TW/channels/imessage)——完整的 iMessage 頻道參考資料，包括 `imsg launch` 設定與功能偵測。
- `/channels/bluebubbles`——會重新導向至此遷移指南的舊版網址。
- [配對](/zh-TW/channels/pairing)——私訊驗證與配對流程。
- [頻道路由](/zh-TW/channels/channel-routing)——閘道如何為外寄回覆選擇頻道。
