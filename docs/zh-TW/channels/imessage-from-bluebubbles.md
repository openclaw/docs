---
read_when:
    - 規劃從 BlueBubbles 遷移到隨附的 iMessage Plugin
    - 將 BlueBubbles 設定鍵轉換為 iMessage 對應項
    - 在啟用 iMessage Plugin 前驗證 imsg
summary: 將舊有 BlueBubbles 設定遷移到隨附的 iMessage Plugin，而不會遺失配對、允許清單或群組繫結。
title: 從 BlueBubbles 轉移而來
x-i18n:
    generated_at: "2026-05-11T20:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

隨附的 `imessage` Plugin 現在透過 JSON-RPC 驅動 [`steipete/imsg`](https://github.com/steipete/imsg)，可觸及與 BlueBubbles 相同的私有 API 介面（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群組管理、附件）。如果你已經在安裝了 `imsg` 的 Mac 上執行，就可以移除 BlueBubbles 伺服器，讓 Plugin 直接與 Messages.app 通訊。

BlueBubbles 支援已移除。OpenClaw 只透過 `imsg` 支援 iMessage。本指南用於將舊的 `channels.bluebubbles` 設定遷移至 `channels.imessage`；沒有其他受支援的遷移路徑。

<Note>
如需簡短公告與操作員摘要，請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)。
</Note>

## 遷移檢查清單

當你已經知道舊的 BlueBubbles 設定，並想採用最短且安全的路徑時，請使用此檢查清單：

1. 直接在執行 Messages.app 的 Mac 上驗證 `imsg`（`imsg chats`、`imsg history`、`imsg send` 和 `imsg rpc --help`）。
2. 將行為鍵從 `channels.bluebubbles` 複製到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 移除不再存在的傳輸鍵：`serverUrl`、`password`、Webhook URL，以及 BlueBubbles 伺服器設定。
4. 如果 Gateway 並未在 Messages Mac 上執行，請將 `channels.imessage.cliPath` 設為 SSH 包裝程式，並為遠端附件擷取設定 `remoteHost`。
5. 在 Gateway 停止的狀態下，啟用 `channels.imessage`，然後執行 `openclaw channels status --probe --channel imessage`。
6. 測試一則私訊、一個允許的群組、附件（若已啟用），以及你預期代理會使用的每個私有 API 動作。
7. 在 iMessage 路徑驗證完成後，刪除 BlueBubbles 伺服器和舊的 `channels.bluebubbles` 設定。

## 何時適合此遷移

- 你已經在 Messages.app 已登入的同一台 Mac（或可透過 SSH 連線的 Mac）上執行 `imsg`。
- 你想減少一個移動部件 — 不需要獨立的 BlueBubbles 伺服器、不需要驗證 REST 端點、不需要 Webhook 管線。以單一 CLI 二進位檔取代伺服器 + 用戶端應用程式 + 輔助程式。
- 你位於[受支援的 macOS / `imsg` 組建](/zh-TW/channels/imessage#requirements-and-permissions-macos)，且私有 API 探測回報 `available: true`。

## imsg 的作用

`imsg` 是 Messages 的本機 macOS CLI。OpenClaw 會將 `imsg rpc` 作為子處理序啟動，並透過 stdin/stdout 使用 JSON-RPC 通訊。沒有 HTTP 伺服器、Webhook URL、背景守護程式、啟動代理程式，也沒有需要公開的連接埠。

- 讀取會使用唯讀 SQLite 控制代碼從 `~/Library/Messages/chat.db` 取得。
- 即時傳入訊息來自 `imsg watch` / `watch.subscribe`，其會追蹤 `chat.db` 檔案系統事件，並具備輪詢備援。
- 傳送會使用 Messages.app 自動化來進行一般文字與檔案傳送。
- 進階動作會使用 `imsg launch` 將 `imsg` 輔助程式注入 Messages.app。這會解鎖已讀回條、輸入指示器、豐富傳送、編輯、取消傳送、串接回覆、點按回應和群組管理。
- Linux 組建可以檢查複製的 `chat.db`，但無法傳送、監看即時 Mac 資料庫，或驅動 Messages.app。對於 OpenClaw iMessage，請在已登入的 Mac 上執行 `imsg`，或透過指向該 Mac 的 SSH 包裝程式執行。

## 開始之前

1. 在執行 Messages.app 的 Mac 上安裝 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 因 `unable to open database file`、空輸出或 `authorization denied` 而失敗，請授予啟動 `imsg` 的終端機、編輯器、Node 處理序、Gateway 服務或 SSH 父處理序完整磁碟存取權限，然後重新開啟該父處理序。

2. 在變更 OpenClaw 設定前，驗證讀取、監看、傳送與 RPC 介面：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   將 `42` 替換為來自 `imsg chats` 的真實聊天室 ID。傳送需要 Messages.app 的自動化權限。如果 OpenClaw 將透過 SSH 執行，請透過 OpenClaw 將使用的相同 SSH 包裝程式或使用者情境執行這些命令。

3. 當你需要進階動作時，啟用私有 API 橋接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要停用 SIP。基本傳送、歷史記錄與監看不需要 `imsg launch` 即可運作；進階動作則不行。

4. 加入已啟用的 `channels.imessage` 設定後，透過 OpenClaw 驗證橋接：

   ```bash
   openclaw channels status --probe
   ```

   你需要 `imessage.privateApi.available: true`。如果回報 `false`，請先修復該問題 — 請參閱[能力偵測](/zh-TW/channels/imessage#private-api-actions)。`channels status --probe` 只會探測已設定且已啟用的帳號。

5. 建立設定快照：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 設定轉換

iMessage 和 BlueBubbles 共用許多通道層級設定。會變更的鍵大多是傳輸相關（REST 伺服器對本機 CLI）。行為鍵（`dmPolicy`、`groupPolicy`、`allowFrom` 等）會保留相同意義。

| BlueBubbles                                                | bundled iMessage                          | 備註                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 語意相同。                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(已移除)_                               | 沒有 REST 伺服器 — Plugin 會透過 stdio 產生 `imsg rpc`。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(已移除)_                               | 不需要 Webhook 驗證。                                                                                                                                                                                                                                                                                                            |
| _(隱含)_                                               | `channels.imessage.cliPath`               | `imsg` 的路徑（預設為 `imsg`）；若使用 SSH，請使用包裝指令碼。                                                                                                                                                                                                                                                                               |
| _(隱含)_                                               | `channels.imessage.dbPath`                | 可選的 Messages.app `chat.db` 覆寫；省略時會自動偵測。                                                                                                                                                                                                                                                                        |
| _(隱含)_                                               | `channels.imessage.remoteHost`            | `host` 或 `user@host` — 只有在 `cliPath` 是 SSH 包裝指令碼，且你想要透過 SCP 擷取附件時才需要。                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 相同值（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配對核准會依 handle 繼承，而不是依 token。                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 相同值（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **請逐字複製此項，包括任何 `groups: { "*": { ... } }` 萬用字元項目。** 每個群組的 `requireMention`、`tools`、`toolsBySender` 都會繼承。使用 `groupPolicy: "allowlist"` 時，空白或缺少的 `groups` 區塊會靜默丟棄每則群組訊息 — 請參閱下方「群組登錄表陷阱」。                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 預設為 `true`。使用 bundled Plugin 時，這只有在私有 API 探測啟動後才會觸發。                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 形狀相同，**同樣預設關閉**。如果你在 BlueBubbles 上已有附件流入，必須在 iMessage 區塊明確重新設定此項 — 它不會隱含繼承，而且在你設定之前，傳入照片/媒體會被靜默丟棄，且不會有 `Inbound message` 記錄行。                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本機根目錄；萬用字元規則相同。                                                                                                                                                                                                                                                                                                            |
| _(不適用)_                                                    | `channels.imessage.remoteAttachmentRoots` | 只有在為 SCP 擷取設定 `remoteHost` 時才會使用。                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 預設為 16 MB（BlueBubbles 預設為 8 MB）。如果你想保留較低上限，請明確設定。                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 兩者預設都是 4000。                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的選擇加入項。僅限 DM — 兩個頻道的群組聊天都會維持每則訊息即時派送。啟用時如果沒有明確的 `messages.inbound.byChannel.imessage`，會將預設傳入 debounce 擴大為 2500 ms。請參閱 [iMessage 文件 § 合併分段傳送的 DM](/zh-TW/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(不適用)_                                   | iMessage 已經會從 `chat.db` 讀取寄件者顯示名稱。                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每個動作的切換項：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                          |

多帳號設定（`channels.bluebubbles.accounts.*`）會一對一轉換為 `channels.imessage.accounts.*`。

## 群組登錄表陷阱

bundled iMessage Plugin 會連續執行**兩個**獨立的群組 allowlist 閘門。兩者都必須通過，群組訊息才會到達代理程式：

1. **寄件者 / 聊天目標 allowlist**（`channels.imessage.groupAllowFrom`）— 由 `isAllowedIMessageSender` 檢查。依寄件者 handle、`chat_guid`、`chat_identifier` 或 `chat_id` 比對傳入訊息。形狀與 BlueBubbles 相同。
2. **群組登錄表**（`channels.imessage.groups`）— 由 `inbound-processing.ts:199` 的 `resolveChannelGroupPolicy` 檢查。使用 `groupPolicy: "allowlist"` 時，此閘門要求下列其中一項：
   - `groups: { "*": { ... } }` 萬用字元項目（設定 `allowAll = true`），或
   - `groups` 底下明確的每個 `chat_id` 項目。

如果閘門 1 通過但閘門 2 失敗，訊息會被丟棄。Plugin 會發出兩個 `warn` 等級訊號，因此在預設記錄層級不再是靜默狀態：

- 當設定了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 為空（沒有 `"*"` 萬用字元，也沒有每個 `chat_id` 項目）時，每個帳號會在啟動時發出一次性的 `warn` — 在任何訊息抵達前觸發。
- 第一次在執行階段丟棄特定群組時，每個 `chat_id` 會發出一次性的 `warn`，其中會指出 chat_id，以及要加入 `groups` 才能允許它的確切鍵。

DM 會繼續運作，因為它們走不同的程式碼路徑。

這是最常見的 BlueBubbles → bundled-iMessage 遷移失敗模式：操作員複製了 `groupAllowFrom` 和 `groupPolicy`，卻略過 `groups` 區塊，因為 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起來像無關的提及設定。它其實是登錄表閘門的關鍵必要項。

在 `groupPolicy: "allowlist"` 後，讓群組訊息保持流通的最低設定如下：

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

`requireMention: true` 位於 `*` 底下時，若未設定提及模式則無害：執行階段會設定 `canDetectMention = false`，並在 `inbound-processing.ts:512` 提早跳過提及丟棄流程。設定提及模式後（`agents.list[].groupChat.mentionPatterns`），它會如預期運作。

如果 gateway 記錄 `imessage: dropping group message from chat_id=<id>`，或啟動列顯示 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，代表第 2 道閘門正在丟棄訊息 — 請加入 `groups` 區塊。

## 逐步操作

1. 在現有 BlueBubbles 區塊旁加入 iMessage 區塊。當 Gateway 仍在路由 BlueBubbles 流量時，先保持停用：

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

2. **在流量變重要前先探測** — 停止 Gateway，暫時啟用 iMessage 區塊，並確認 iMessage 從 CLI 回報為健康：

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` 只會探測已設定且已啟用的帳號。除非你有意同時執行兩個頻道監視器，否則不要在 BlueBubbles 與 iMessage 都啟用的狀態下重新啟動 Gateway。如果你不是要立即切換，請在重新啟動 Gateway 前將 `channels.imessage.enabled` 設回 `false`。在啟用 OpenClaw 流量前，請使用 [開始之前](#before-you-start) 中的直接 `imsg` 指令驗證 Mac。

3. **切換。** 一旦啟用的 iMessage 帳號回報為健康，移除 BlueBubbles 設定並保持 iMessage 啟用：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重新啟動 gateway。傳入的 iMessage 流量現在會透過內建 Plugin 流動。

4. **驗證 DM。** 傳送直接訊息給代理程式；確認回覆有送達。

5. **分別驗證群組。** DM 與群組會走不同程式碼路徑 — DM 成功不代表群組已正確路由。請在已配對的群組聊天中傳送訊息給代理程式，並確認回覆有送達。如果群組變得無聲（沒有代理程式回覆，也沒有錯誤），請檢查 gateway 記錄是否有 `imessage: dropping group message from chat_id=<id>`，或啟動時的 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 這一列 — 兩者都會在預設記錄層級觸發。如果出現任一項，代表你的 `groups` 區塊遺失或為空 — 請參閱上方的「群組登錄陷阱」。

6. **驗證動作表面** — 從已配對的 DM 中，請代理程式進行回應、編輯、取消傳送、回覆、傳送照片，並（在群組中）重新命名群組 / 新增或移除參與者。每個動作都應該原生送達 Messages.app。如果有任何動作拋出「iMessage `<action>` 需要 imsg 私有 API 橋接器」，請再次執行 `imsg launch` 並重新整理 `channels status --probe`。

7. 在確認 iMessage DM、群組與動作後，**移除 BlueBubbles 伺服器與設定**。OpenClaw 不會使用 `channels.bluebubbles`。

## 動作對等速覽

| 動作                                                       | 舊版 BlueBubbles                    | 內建 iMessage                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 傳送文字 / SMS 後援                                        | ✅                                  | ✅                                                                                                                      |
| 傳送媒體（照片、影片、檔案、語音）                         | ✅                                  | ✅                                                                                                                      |
| 執行緒回覆（`reply_to_guid`）                              | ✅                                  | ✅（關閉 [#51892](https://github.com/openclaw/openclaw/issues/51892)）                                                  |
| Tapback（`react`）                                         | ✅                                  | ✅                                                                                                                      |
| 編輯 / 取消傳送（macOS 13+ 收件者）                        | ✅                                  | ✅                                                                                                                      |
| 使用螢幕效果傳送                                           | ✅                                  | ✅（關閉 [#9394](https://github.com/openclaw/openclaw/issues/9394) 的一部分）                                           |
| 富文字粗體 / 斜體 / 底線 / 刪除線                          | ✅                                  | ✅（透過 attributedBody 進行 typed-run 格式化）                                                                         |
| 重新命名群組 / 設定群組圖示                                | ✅                                  | ✅                                                                                                                      |
| 新增 / 移除參與者、離開群組                                | ✅                                  | ✅                                                                                                                      |
| 已讀回條與輸入指示器                                       | ✅                                  | ✅（受私有 API 探測控管）                                                                                              |
| 同一寄件者 DM 合併                                         | ✅                                  | ✅（僅限 DM；透過 `channels.imessage.coalesceSameSenderDms` 選擇加入）                                                  |
| Gateway 關閉期間收到的傳入訊息補取                         | ✅（Webhook 重播 + 歷史擷取）       | ✅（透過 `channels.imessage.catchup.enabled` 選擇加入；關閉 [#78649](https://github.com/openclaw/openclaw/issues/78649)） |

iMessage 補取現在可作為內建 Plugin 的選擇加入功能使用。在 gateway 啟動時，如果 `channels.imessage.catchup.enabled` 為 `true`，gateway 會對 `imsg watch` 使用的同一個 JSON-RPC 用戶端執行一次 `chats.list` + 每個聊天的 `messages.history`，透過即時分派路徑（允許清單、群組政策、防抖器、回音快取）重播每一筆漏掉的傳入列，並持久保存每個帳號的游標，讓後續啟動能從上次停止的位置繼續。調整方式請參閱 [Gateway 停機後補取](/zh-TW/channels/imessage#catching-up-after-gateway-downtime)。

## 配對、工作階段與 ACP 綁定

- **配對核准**會依 handle 延續。你不需要重新核准已知寄件者 — `channels.imessage.allowFrom` 會辨識 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字串。
- **工作階段**會依每個代理程式 + 聊天設定範圍。在預設 `session.dmScope=main` 下，DM 會收斂到代理程式主工作階段；群組工作階段會依每個 `chat_id` 隔離。工作階段鍵不同（`agent:<id>:imessage:group:<chat_id>` 與 BlueBubbles 對應項相比）— BlueBubbles 工作階段鍵底下的舊對話歷史不會帶入 iMessage 工作階段。
- 參照 `match.channel: "bluebubbles"` 的 **ACP 綁定**需要更新為 `"imessage"`。`match.peer.id` 形狀（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸 handle）相同。

## 沒有回復通道

沒有受支援的 BlueBubbles 執行階段可供切換回去。如果 iMessage 驗證失敗，請設定 `channels.imessage.enabled: false`、重新啟動 Gateway、修正 `imsg` 阻礙，然後重試切換。

回覆快取位於 `~/.openclaw/state/imessage/reply-cache.jsonl`（模式 `0600`，父目錄 `0700`）。如果你想要乾淨狀態，可以安全刪除。

## 相關

- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 簡短公告與操作員摘要。
- [iMessage](/zh-TW/channels/imessage) — 完整 iMessage 頻道參考，包含 `imsg launch` 設定與能力偵測。
- `/channels/bluebubbles` — 重新導向到此遷移指南的舊版 URL。
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程。
- [頻道路由](/zh-TW/channels/channel-routing) — gateway 如何為輸出回覆選擇頻道。
