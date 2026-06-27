---
read_when:
    - 規劃從 BlueBubbles 遷移到內建 iMessage 外掛
    - 將 BlueBubbles 設定鍵轉換為 iMessage 對應項
    - 啟用 iMessage 外掛前驗證 imsg
summary: 將舊版 BlueBubbles 設定遷移到內建的 iMessage 外掛，且不遺失配對、允許清單或群組繫結。
title: 來自 BlueBubbles
x-i18n:
    generated_at: "2026-06-27T18:55:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

內建的 `imessage` 外掛現在透過 JSON-RPC 驅動 [`steipete/imsg`](https://github.com/steipete/imsg)，可存取與 BlueBubbles 相同的私有 API 介面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群組管理、附件）。如果你已經在 Mac 上安裝並執行 `imsg`，可以移除 BlueBubbles 伺服器，讓外掛直接與 Messages.app 通訊。

BlueBubbles 支援已移除。OpenClaw 只透過 `imsg` 支援 iMessage。本指南用於將舊的 `channels.bluebubbles` 設定遷移至 `channels.imessage`；沒有其他受支援的遷移路徑。

<Note>
如需簡短公告與操作員摘要，請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)。
</Note>

## 遷移檢查清單

當你已經知道舊的 BlueBubbles 設定，並想採取最短且安全的路徑時，請使用此檢查清單：

1. 直接在執行 Messages.app 的 Mac 上驗證 `imsg`（`imsg chats`、`imsg history`、`imsg send` 與 `imsg rpc --help`）。
2. 將行為鍵從 `channels.bluebubbles` 複製到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 與 `actions`。
3. 移除不再存在的傳輸鍵：`serverUrl`、`password`、網路鉤子 URL，以及 BlueBubbles 伺服器設定。
4. 如果閘道不是在 Messages Mac 上執行，請將 `channels.imessage.cliPath` 設為 SSH 包裝器，並設定 `remoteHost` 以便遠端擷取附件。
5. 在閘道停止時，啟用 `channels.imessage`，然後執行 `openclaw channels status --probe --channel imessage`。
6. 測試一則 DM、一個允許的群組、附件（若已啟用），以及你預期代理程式會使用的每個私有 API 動作。
7. 在 iMessage 路徑通過驗證後，刪除 BlueBubbles 伺服器與舊的 `channels.bluebubbles` 設定。

## 何時適合此遷移

- 你已經在 Messages.app 已登入的同一台 Mac（或可透過 SSH 連線的 Mac）上執行 `imsg`。
- 你想減少一個移動零件：沒有獨立的 BlueBubbles 伺服器、沒有需要驗證的 REST 端點、沒有網路鉤子管線。以單一命令列介面二進位檔取代伺服器 + 用戶端應用程式 + 輔助程式。
- 你使用的是[受支援的 macOS / `imsg` 建置版本](/zh-TW/channels/imessage#requirements-and-permissions-macos)，且私有 API 探測回報 `available: true`。

## imsg 的作用

`imsg` 是 Messages 的本機 macOS 命令列介面。OpenClaw 會將 `imsg rpc` 作為子行程啟動，並透過 stdin/stdout 使用 JSON-RPC 通訊。沒有 HTTP 伺服器、網路鉤子 URL、背景常駐程式、launch agent，或需要公開的連接埠。

- 讀取來自 `~/Library/Messages/chat.db`，使用唯讀 SQLite 控制代碼。
- 即時傳入訊息來自 `imsg watch` / `watch.subscribe`，它會追蹤 `chat.db` 檔案系統事件，並具有輪詢備援。
- 傳送會使用 Messages.app 自動化來傳送一般文字與檔案。
- 進階動作會使用 `imsg launch` 將 `imsg` 輔助程式注入 Messages.app。這會解鎖已讀回條、輸入指示器、豐富傳送、編輯、收回、串接回覆、tapback，以及群組管理。
- Linux 建置可以檢查複製的 `chat.db`，但不能傳送、監看即時 Mac 資料庫，或驅動 Messages.app。若要在 OpenClaw 使用 iMessage，請在已登入的 Mac 上執行 `imsg`，或透過連到該 Mac 的 SSH 包裝器執行。

## 開始之前

1. 在執行 Messages.app 的 Mac 上安裝 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 因 `unable to open database file`、空輸出或 `authorization denied` 而失敗，請將完整磁碟存取權授予啟動 `imsg` 的終端機、編輯器、節點行程、閘道服務或 SSH 父行程，然後重新開啟該父行程。

2. 在變更 OpenClaw 設定前，驗證讀取、監看、傳送與 RPC 介面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   將 `42` 替換為 `imsg chats` 中的真實聊天 ID。傳送需要 Messages.app 的自動化權限。如果 OpenClaw 將透過 SSH 執行，請透過 OpenClaw 將使用的相同 SSH 包裝器或使用者內容執行這些命令。如果讀取/探測可運作但傳送因 AppleEvents `-1743` 失敗，請檢查自動化權限是否落在 `/usr/libexec/sshd-keygen-wrapper`；請參閱 [SSH 包裝器傳送因 AppleEvents -1743 失敗](/zh-TW/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)。

3. 當你需要進階動作時，啟用私有 API 橋接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要停用 SIP。基本傳送、歷史記錄與監看不需要 `imsg launch` 也能運作；進階動作則不行。

4. 加入已啟用的 `channels.imessage` 設定後，透過 OpenClaw 驗證橋接：

   ```bash
   openclaw channels status --probe
   ```

   你需要看到 `imessage.privateApi.available: true`。如果回報 `false`，請先修正該問題，請參閱[功能偵測](/zh-TW/channels/imessage#private-api-actions)。`channels status --probe` 只會探測已設定且已啟用的帳號。

5. 建立設定快照：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 設定轉換

iMessage 與 BlueBubbles 共用許多頻道層級設定。會變更的鍵主要是傳輸相關（REST 伺服器 vs 本機命令列介面）。行為鍵（`dmPolicy`、`groupPolicy`、`allowFrom` 等）維持相同含義。

| BlueBubbles                                                | 內建 iMessage                            | 備註                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 語意相同。                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(已移除)_                               | 沒有 REST 伺服器 — 外掛會透過 stdio 產生 `imsg rpc`。                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(已移除)_                               | 不需要網路鉤子驗證。                                                                                                                                                                                                                                                                                                                                                    |
| _(隱含)_                                               | `channels.imessage.cliPath`               | `imsg` 的路徑（預設為 `imsg`）；若要使用 SSH，請使用包裝指令碼。                                                                                                                                                                                                                                                                                                                       |
| _(隱含)_                                               | `channels.imessage.dbPath`                | 選用的 Messages.app `chat.db` 覆寫；省略時會自動偵測。                                                                                                                                                                                                                                                                                                                |
| _(隱含)_                                               | `channels.imessage.remoteHost`            | `host` 或 `user@host` — 只有在 `cliPath` 是 SSH 包裝器，且你想要透過 SCP 擷取附件時才需要。                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 值相同（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配對核准會依 handle 帶入，而不是依 token。                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 值相同（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字複製這個項目，包括任何 `groups: { "*": { ... } }` 萬用字元項目。** 每個群組的 `requireMention`、`tools`、`toolsBySender` 都會帶入。使用 `groupPolicy: "allowlist"` 時，空白或缺漏的 `groups` 區塊會靜默丟棄每則群組訊息 — 請參閱下方的「群組登錄表陷阱」。                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 預設為 `true`。使用內建外掛時，這只會在私有 API 探測啟動時觸發。                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形狀相同，**同樣預設關閉**。如果你先前在 BlueBubbles 上有附件流入，必須在 iMessage 區塊上明確重新設定此項 — 它不會隱含帶入；在你這麼做之前，傳入的照片/媒體會被靜默丟棄，且不會有 `Inbound message` 記錄行。                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本機根目錄；萬用字元規則相同。                                                                                                                                                                                                                                                                                                                                                    |
| _(不適用)_                                                    | `channels.imessage.remoteAttachmentRoots` | 只有在設定 `remoteHost` 以進行 SCP 擷取時才會使用。                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 上預設為 16 MB（BlueBubbles 預設為 8 MB）。如果你想保留較低上限，請明確設定。                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 兩者預設皆為 4000。                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的選擇加入。僅限 DM — 兩個通道的群組聊天都會保持每則訊息即時分派。啟用後若未明確設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs`，會將預設傳入防抖延長為 7000 ms。請參閱 [iMessage 文件 § 合併分段傳送的 DM](/zh-TW/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(不適用)_                                   | iMessage 已經會從 `chat.db` 讀取傳送者顯示名稱。                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每個動作的切換：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                                                                  |

多帳號設定（`channels.bluebubbles.accounts.*`）會一對一轉換為 `channels.imessage.accounts.*`。

## 群組登錄表陷阱

內建 iMessage 外掛會連續執行**兩個**獨立的群組允許清單閘門。兩者都必須通過，群組訊息才會到達代理程式：

1. **傳送者 / 聊天目標允許清單**（`channels.imessage.groupAllowFrom`）— 由 `isAllowedIMessageSender` 檢查。依傳送者 handle、`chat_guid`、`chat_identifier` 或 `chat_id` 比對傳入訊息。形狀與 BlueBubbles 相同。
2. **群組登錄表**（`channels.imessage.groups`）— 由 `inbound-processing.ts:199` 的 `resolveChannelGroupPolicy` 檢查。使用 `groupPolicy: "allowlist"` 時，此閘門需要以下其中一項：
   - `groups: { "*": { ... } }` 萬用字元項目（設定 `allowAll = true`），或
   - `groups` 底下明確的每個 `chat_id` 項目。

如果閘門 1 通過但閘門 2 失敗，訊息會被丟棄。外掛會發出兩個 `warn` 等級訊號，因此在預設記錄等級下不再是靜默行為：

- 當設定 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 為空（沒有 `"*"` 萬用字元，也沒有每個 `chat_id` 的項目）時，每個帳號會在啟動時發出一次 `warn` — 在任何訊息抵達前觸發。
- 執行階段第一次丟棄特定群組時，會針對每個 `chat_id` 發出一次 `warn`，指出 chat_id 以及要加入 `groups` 才能允許它的確切鍵。

私訊會繼續運作，因為它們走的是不同的程式碼路徑。

這是最常見的 BlueBubbles → 內建 iMessage 遷移失敗模式：操作者複製了 `groupAllowFrom` 和 `groupPolicy`，卻略過 `groups` 區塊，因為 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起來像是不相關的提及設定。它其實是註冊表閘門的關鍵承載設定。

在 `groupPolicy: "allowlist"` 之後，讓群組訊息維持流通所需的最小設定：

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

當未設定提及模式時，`*` 底下的 `requireMention: true` 是無害的：執行階段會設定 `canDetectMention = false`，並在 `inbound-processing.ts:512` 短路略過提及丟棄邏輯。設定提及模式（`agents.list[].groupChat.mentionPatterns`）時，它會如預期運作。

如果閘道記錄 `imessage: dropping group message from chat_id=<id>`，或啟動列出現 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，代表第 2 道閘門正在丟棄訊息 — 加上 `groups` 區塊。

## 逐步操作

1. 在現有 BlueBubbles 區塊旁新增 iMessage 區塊。在閘道仍在路由 BlueBubbles 流量時，保持它停用：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **在流量變得重要前先探測** — 停止閘道，暫時啟用 iMessage 區塊，並確認 iMessage 從命令列介面回報為健康：

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` 只會探測已設定且已啟用的帳號。除非你有意讓兩個頻道監視器同時執行，否則不要在 BlueBubbles 和 iMessage 都啟用時重新啟動閘道。如果你不會立即切換，請在重新啟動閘道前，將 `channels.imessage.enabled` 設回 `false`。在啟用 OpenClaw 流量前，請使用[開始之前](#before-you-start)中的直接 `imsg` 命令驗證 Mac。

3. **切換。** 一旦已啟用的 iMessage 帳號回報為健康，移除 BlueBubbles 設定並保持 iMessage 啟用：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重新啟動閘道。傳入的 iMessage 流量現在會經由內建外掛流動。

4. **驗證私訊。** 傳送直接訊息給代理，確認回覆送達。

5. **分開驗證群組。** 私訊和群組走不同的程式碼路徑 — 私訊成功不代表群組正在路由。請在已配對的群組聊天中傳送訊息給代理，並確認回覆送達。如果群組變得無聲（沒有代理回覆、沒有錯誤），請檢查閘道記錄是否有 `imessage: dropping group message from chat_id=<id>`，或啟動時的 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行 — 兩者都會在預設記錄層級觸發。如果任一出現，表示你的 `groups` 區塊遺失或為空 — 請參閱上方的「群組註冊表陷阱」。

6. **驗證操作介面** — 從已配對的私訊中，要求代理進行反應、編輯、收回、回覆、傳送照片，以及（在群組中）重新命名群組 / 新增或移除參與者。每個操作都應該原生送達 Messages.app。如果任何操作擲出「iMessage `<action>` requires the imsg private API bridge」，請再次執行 `imsg launch`，並重新整理 `channels status --probe`。

7. 在確認 iMessage 私訊、群組和操作後，**移除 BlueBubbles 伺服器與設定**。OpenClaw 不會使用 `channels.bluebubbles`。

## 操作對等一覽

| 操作                                                | 舊版 BlueBubbles                      | 內建 iMessage                                                                  |
| --------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| 傳送文字 / SMS 備援                                | ✅                                    | ✅                                                                              |
| 傳送媒體（照片、影片、檔案、語音）                | ✅                                    | ✅                                                                              |
| 串接回覆（`reply_to_guid`）                        | ✅                                    | ✅（關閉 [#51892](https://github.com/openclaw/openclaw/issues/51892)）         |
| Tapback（`react`）                                 | ✅                                    | ✅                                                                              |
| 編輯 / 收回（macOS 13+ 收件者）                    | ✅                                    | ✅                                                                              |
| 搭配螢幕效果傳送                                  | ✅                                    | ✅（關閉 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分） |
| 富文字粗體 / 斜體 / 底線 / 刪除線                 | ✅                                    | ✅（透過 attributedBody 進行型別化執行格式化）                                 |
| 重新命名群組 / 設定群組圖示                       | ✅                                    | ✅                                                                              |
| 新增 / 移除參與者、離開群組                       | ✅                                    | ✅                                                                              |
| 已讀回條與輸入指示器                              | ✅                                    | ✅（受私有 API 探測控管）                                                       |
| 同一寄件者私訊合併                                | ✅                                    | ✅（僅限私訊；透過 `channels.imessage.coalesceSameSenderDms` 選擇啟用）        |
| 重新啟動後的傳入復原                              | ✅（網路鉤子重播 + 歷史擷取）        | ✅（自動：透過 since_rowid 重播遺漏內容 + 去重；本機有較寬的時間窗）          |

iMessage 會復原閘道停機期間遺漏的訊息：啟動時，它會透過 `imsg watch.subscribe` 的 `since_rowid` 從最後已派送的 rowid 開始重播，並依 GUID 去重，同時由陳舊積壓年齡柵欄抑制 Push-flush「積壓炸彈」。這會透過 `imsg` RPC 連線執行，因此也適用於遠端 SSH `cliPath` 設定；本機設定會取得較寬的復原時間窗，因為它們可以讀取 `chat.db`。請參閱[橋接器或閘道重新啟動後的傳入復原](/zh-TW/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart)。

## 配對、工作階段與 ACP 綁定

- **配對核准**會依控制代碼沿用。你不需要重新核准已知寄件者 — `channels.imessage.allowFrom` 會辨識 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字串。
- **工作階段**會以每個代理 + 聊天為範圍。私訊會在預設 `session.dmScope=main` 下收斂到代理主工作階段；群組工作階段會依每個 `chat_id` 隔離。工作階段鍵不同（`agent:<id>:imessage:group:<chat_id>` 與 BlueBubbles 對應項不同）— BlueBubbles 工作階段鍵底下的舊對話歷史不會帶入 iMessage 工作階段。
- 參照 `match.channel: "bluebubbles"` 的 **ACP 綁定**需要更新為 `"imessage"`。`match.peer.id` 形狀（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸控制代碼）完全相同。

## 沒有回復頻道

沒有支援的 BlueBubbles 執行階段可切回。如果 iMessage 驗證失敗，請設定 `channels.imessage.enabled: false`，重新啟動閘道，修正 `imsg` 阻礙因素，然後重試切換。

回覆快取位於 SQLite 外掛狀態中。`openclaw doctor --fix` 會在舊的 `imessage/reply-cache.jsonl` sidecar 存在時匯入並封存它。

## 相關內容

- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 簡短公告與操作者摘要。
- [iMessage](/zh-TW/channels/imessage) — 完整的 iMessage 頻道參考，包括 `imsg launch` 設定與能力偵測。
- `/channels/bluebubbles` — 重新導向至此遷移指南的舊版 URL。
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程。
- [頻道路由](/zh-TW/channels/channel-routing) — 閘道如何為外寄回覆選擇頻道。
