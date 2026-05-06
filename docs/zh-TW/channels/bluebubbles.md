---
read_when:
    - 設定 BlueBubbles 頻道
    - Webhook 配對疑難排解
    - 在 macOS 上設定 iMessage
sidebarTitle: BlueBubbles
summary: 透過 BlueBubbles macOS 伺服器使用 iMessage（REST 傳送/接收、正在輸入狀態、反應、配對、進階動作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T09:02:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

狀態：隨附的 Plugin，透過 HTTP 與 BlueBubbles macOS 伺服器通訊。由於相較於舊版 imsg channel 具有更豐富的 API 且設定更容易，因此**建議用於 iMessage 整合**。

<Note>
目前的 OpenClaw 版本隨附 BlueBubbles，因此一般封裝建置不需要額外執行 `openclaw plugins install` 步驟。
</Note>

## 概覽

- 透過 BlueBubbles 輔助程式在 macOS 上執行（[bluebubbles.app](https://bluebubbles.app)）。
- 建議/已測試：macOS Sequoia (15)。macOS Tahoe (26) 可運作；目前 Tahoe 上的編輯功能故障，群組圖示更新可能回報成功但未同步。
- OpenClaw 透過其 REST API 與它通訊（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 傳入訊息透過 Webhook 到達；傳出回覆、輸入狀態、已讀回條與 tapback 都是 REST 呼叫。
- 附件與貼圖會作為傳入媒體擷取（並在可行時呈現給代理）。
- 自動 TTS 回覆若合成 MP3 或 CAF 音訊，會以 iMessage 語音備忘錄泡泡傳送，而不是一般檔案附件。
- 配對/允許清單的運作方式與其他 channel 相同（`/channels/pairing` 等），搭配 `channels.bluebubbles.allowFrom` + 配對碼。
- 反應會像 Slack/Telegram 一樣呈現為系統事件，讓代理可以在回覆前「提及」它們。
- 進階功能：編輯、收回、回覆串接、訊息效果、群組管理。

## 快速開始

<Steps>
  <Step title="Install BlueBubbles">
    在你的 Mac 上安裝 BlueBubbles 伺服器（請依照 [bluebubbles.app/install](https://bluebubbles.app/install) 的指示）。
  </Step>
  <Step title="Enable the web API">
    在 BlueBubbles 設定中啟用 web API 並設定密碼。
  </Step>
  <Step title="Configure OpenClaw">
    執行 `openclaw onboard` 並選取 BlueBubbles，或手動設定：

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Point webhooks at the gateway">
    將 BlueBubbles Webhook 指向你的 Gateway（範例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Start the gateway">
    啟動 Gateway；它會註冊 Webhook 處理器並開始配對。
  </Step>
</Steps>

<Warning>
**安全性**

- 一律設定 Webhook 密碼。
- Webhook 驗證一律為必要。除非 BlueBubbles Webhook 要求包含符合 `channels.bluebubbles.password` 的密碼/guid（例如 `?password=<password>` 或 `x-password`），否則 OpenClaw 會拒絕該要求，無論 loopback/proxy 拓撲為何。
- 在讀取/剖析完整 Webhook 內文之前，會先檢查密碼驗證。

</Warning>

## 讓 Messages.app 保持運作（VM / 無頭設定）

某些 macOS VM / 常駐設定可能會讓 Messages.app 進入「閒置」狀態（傳入事件會停止，直到 App 被開啟/移到前景）。簡單的因應方式是使用 AppleScript + LaunchAgent **每 5 分鐘喚醒 Messages 一次**。

<Steps>
  <Step title="Save the AppleScript">
    將以下內容儲存為 `~/Scripts/poke-messages.scpt`：

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    將以下內容儲存為 `~/Library/LaunchAgents/com.user.poke-messages.plist`：

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    這會**每 300 秒**以及**登入時**執行。第一次執行可能會觸發 macOS **Automation** 提示（`osascript` → Messages）。請在執行 LaunchAgent 的同一個使用者工作階段中核准它們。

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles 可在互動式 Onboarding 中使用：

```
openclaw onboard
```

精靈會提示輸入：

<ParamField path="Server URL" type="string" required>
  BlueBubbles 伺服器位址（例如 `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  來自 BlueBubbles Server 設定的 API 密碼。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook 端點路徑。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`、`allowlist`、`open` 或 `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  電話號碼、電子郵件或聊天目標。
</ParamField>

你也可以透過 CLI 新增 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 存取控制（DM + 群組）

<Tabs>
  <Tab title="DMs">
    - 預設：`channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知傳送者會收到配對碼；訊息會被忽略，直到核准為止（代碼會在 1 小時後到期）。
    - 透過以下方式核准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配對是預設的 token 交換。詳細資訊：[Pairing](/zh-TW/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（預設：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` 控制在設定 `allowlist` 時，誰可以在群組中觸發。

  </Tab>
</Tabs>

### 聯絡人名稱補強（macOS，選用）

BlueBubbles 群組 Webhook 通常只包含原始參與者地址。如果你希望 `GroupMembers` context 改為顯示本機聯絡人名稱，可以選擇在 macOS 上啟用本機 Contacts 補強：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 會啟用查詢。預設：`false`。
- 查詢只會在群組存取、命令授權與提及閘控都允許訊息通過後執行。
- 只有未命名的電話參與者會被補強。
- 找不到本機相符項目時，原始電話號碼會保留作為備援。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### 提及閘控（群組）

BlueBubbles 支援群組聊天的提及閘控，符合 iMessage/WhatsApp 行為：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）偵測提及。
- 當群組啟用 `requireMention` 時，代理只會在被提及時回應。
- 來自已授權傳送者的控制命令會略過提及閘控。

個別群組設定：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### 命令閘控

- 控制命令（例如 `/config`、`/model`）需要授權。
- 使用 `allowFrom` 和 `groupAllowFrom` 判斷命令授權。
- 已授權的傳送者即使未在群組中提及，也能執行控制命令。

### 個別群組系統提示

`channels.bluebubbles.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串。處理該群組中訊息的每一輪，該值都會注入代理的系統提示，因此你可以設定個別群組的人格或行為規則，而不必編輯代理提示：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

這個 key 會符合 BlueBubbles 對該群組回報的 `chatGuid` / `chatIdentifier` / 數字 `chatId`，而 `"*"` 萬用字元項目會為每個沒有精確符合的群組提供預設值（與 `requireMention` 和個別群組工具政策使用相同模式）。精確符合一律優先於萬用字元。DM 會忽略此欄位；請改用代理層級或帳戶層級的提示自訂。

#### 實作範例：串接回覆與 tapback 反應（Private API）

啟用 BlueBubbles Private API 後，傳入訊息會帶有短訊息 ID（例如 `[[reply_to:5]]`），且代理可以呼叫 `action=reply` 來串接到特定訊息，或呼叫 `action=react` 來送出 tapback。個別群組 `systemPrompt` 是讓代理選擇正確工具的可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tapback 反應和串接回覆都需要 BlueBubbles Private API；底層機制請參閱[進階動作](#advanced-actions)與[訊息 ID](#message-ids-short-vs-full)。

## ACP 對話繫結

BlueBubbles 聊天可以轉換成持久的 ACP 工作區，而不需要變更傳輸層。

快速操作流程：

- 在 DM 或已允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 之後同一個 BlueBubbles 對話中的訊息會路由到產生的 ACP 工作階段。
- `/new` 和 `/reset` 會在原處重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

也支援透過頂層 `bindings[]` 項目設定持久繫結，並使用 `type: "acp"` 與 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何支援的 BlueBubbles 目標形式：

- 正規化 DM handle，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

若要穩定的群組繫結，建議使用 `chat_id:*` 或 `chat_identifier:*`。

範例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

請參閱 [ACP 代理](/zh-TW/tools/acp-agents) 了解共用 ACP 繫結行為。

## 輸入狀態 + 已讀回條

- **輸入狀態**：在回應產生前與產生期間自動送出。
- **已讀回條**：由 `channels.bluebubbles.sendReadReceipts` 控制（預設：`true`）。
- **輸入狀態**：OpenClaw 會送出開始輸入事件；BlueBubbles 會在傳送或逾時時自動清除輸入狀態（透過 DELETE 手動停止並不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## 進階動作

BlueBubbles 在設定啟用時支援進階訊息動作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可用動作">
    - **react**：新增/移除 Tapback 回應（`messageId`、`emoji`、`remove`）。iMessage 的原生 Tapback 集合是 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。當代理選擇該集合以外的 emoji（例如 `👀`）時，回應工具會退回使用 `love`，讓 Tapback 仍能顯示，而不是讓整個請求失敗。已設定的確認回應仍會嚴格驗證，並在未知值上報錯。
    - **edit**：編輯已傳送的訊息（`messageId`、`text`）。
    - **unsend**：收回訊息（`messageId`）。
    - **reply**：回覆特定訊息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：使用 iMessage 效果傳送（`text`、`to`、`effectId`）。
    - **renameGroup**：重新命名群組聊天（`chatGuid`、`displayName`）。
    - **setGroupIcon**：設定群組聊天的圖示/照片（`chatGuid`、`media`）- 在 macOS 26 Tahoe 上不穩定（API 可能回傳成功，但圖示不會同步）。
    - **addParticipant**：將某人加入群組（`chatGuid`、`address`）。
    - **removeParticipant**：從群組移除某人（`chatGuid`、`address`）。
    - **leaveGroup**：離開群組聊天（`chatGuid`）。
    - **upload-file**：傳送媒體/檔案（`to`、`buffer`、`filename`、`asVoice`）。
      - 語音備忘錄：設定 `asVoice: true` 並搭配 **MP3** 或 **CAF** 音訊，即可以 iMessage 語音訊息傳送。BlueBubbles 在傳送語音備忘錄時會將 MP3 → CAF。
    - 舊版別名：`sendAttachment` 仍可運作，但 `upload-file` 是正式動作名稱。

  </Accordion>
</AccordionGroup>

### 訊息 ID（短 ID 與完整 ID）

OpenClaw 可能會顯示_短_訊息 ID（例如 `1`、`2`）以節省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供者的完整 ID。
- 短 ID 位於記憶體中；它們可能在重新啟動或快取淘汰後過期。
- 動作接受短或完整 `messageId`，但如果短 ID 已無法取得，則會報錯。

對於持久的自動化和儲存，請使用完整 ID：

- 範本：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 內容：入站 payload 中的 `MessageSidFull` / `ReplyToIdFull`

請參閱[設定](/zh-TW/gateway/configuration)以了解範本變數。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合併拆分傳送的 DM（同一次編寫中的命令 + URL）

當使用者在 iMessage 中一併輸入命令和 URL，例如 `Dump https://example.com/article`，Apple 會將傳送拆分成**兩次獨立的 Webhook 傳遞**：

1. 文字訊息（`"Dump"`）。
2. URL 預覽氣泡（`"https://..."`），並附帶 OG 預覽圖片作為附件。

在大多數設定中，這兩個 Webhook 會相隔約 0.8-2.0 秒抵達 OpenClaw。若未合併，代理會在第 1 輪只收到命令並回覆（通常是「把 URL 傳給我」），到第 2 輪才看到 URL，而此時命令內容脈絡已經遺失。

`channels.bluebubbles.coalesceSameSenderDms` 會讓 DM 將連續的同一寄件者 Webhook 合併為單一代理回合。群組聊天會繼續依每則訊息作為鍵，以保留多使用者回合結構。

<Tabs>
  <Tab title="何時啟用">
    在以下情況啟用：

    - 你提供的 Skills 預期在一則訊息中取得 `command + payload`（dump、paste、save、queue 等）。
    - 你的使用者會將 URL、圖片或長內容與命令一起貼上。
    - 你可以接受額外的 DM 回合延遲（見下文）。

    在以下情況保持停用：

    - 你需要單字 DM 觸發器的最低命令延遲。
    - 你的所有流程都是沒有 payload 後續內容的一次性命令。

  </Tab>
  <Tab title="啟用方式">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    開啟此旗標且未明確設定 `messages.inbound.byChannel.bluebubbles` 時，debounce 視窗會擴大為 **2500 ms**（非合併預設值為 500 ms）。較寬的視窗是必要的，因為 Apple 拆分傳送的 0.8-2.0 秒節奏無法符合較緊的預設值。

    若要自行調整視窗：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="取捨">
    - **DM 控制命令的延遲會增加。** 開啟此旗標後，DM 控制命令訊息（例如 `Dump`、`Save` 等）現在會在派送前最多等待 debounce 視窗，以防 payload Webhook 即將抵達。群組聊天命令仍會立即派送。
    - **合併輸出有界限** - 合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20 個；來源項目上限為 10 個（超過時保留第一個和最新項目）。每個來源 `messageId` 仍會進入入站去重，因此後續 MessagePoller 重播任何單一事件時，會被辨識為重複。
    - **選擇啟用、依頻道設定。** 其他頻道（Telegram、WhatsApp、Slack、…）不受影響。

  </Tab>
</Tabs>

### 情境與代理看到的內容

| 使用者編寫內容                                                     | Apple 傳遞內容            | 關閉旗標（預設）                        | 開啟旗標 + 2500 ms 視窗                                               |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 2 個 Webhook，相隔約 1 秒 | 兩個代理回合：「Dump」單獨一輪，接著 URL | 一個回合：合併文字 `Dump https://example.com`                          |
| `Save this 📎image.jpg caption`（附件 + 文字）                     | 2 個 Webhook              | 兩個回合                                | 一個回合：文字 + 圖片                                                  |
| `/status`（獨立命令）                                              | 1 個 Webhook              | 立即派送                                | **最多等待視窗時間，然後派送**                                         |
| 單獨貼上 URL                                                       | 1 個 Webhook              | 立即派送                                | 立即派送（bucket 中只有一個項目）                                      |
| 文字 + URL 作為兩則刻意分開的訊息送出，中間相隔數分鐘             | 視窗外的 2 個 Webhook     | 兩個回合                                | 兩個回合（它們之間的視窗已過期）                                      |
| 快速大量湧入（視窗內 >10 則小型 DM）                              | N 個 Webhook              | N 個回合                                | 一個回合，有界輸出（保留第一個 + 最新，套用文字/附件上限）            |

### 拆分傳送合併疑難排解

如果旗標已開啟，但拆分傳送仍以兩個回合抵達，請檢查每一層：

<AccordionGroup>
  <Accordion title="設定實際已載入">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然後執行 `openclaw gateway restart` - 此旗標會在 debouncer-registry 建立時讀取。

  </Accordion>
  <Accordion title="Debounce 視窗對你的設定足夠寬">
    查看 `~/Library/Logs/bluebubbles-server/main.log` 下的 BlueBubbles 伺服器記錄：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    測量 `"Dump"` 這類文字派送與隨後 `"https://..."; Attachments:` 派送之間的間隔。將 `messages.inbound.byChannel.bluebubbles` 提高到能舒適涵蓋該間隔的值。

  </Accordion>
  <Accordion title="Session JSONL 時間戳 ≠ Webhook 抵達時間">
    Session 事件時間戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 將訊息交給代理的時間，**不是** Webhook 抵達時間。標記為 `[Queued messages while agent was busy]` 的已佇列第二則訊息，表示第一個回合仍在執行時第二個 Webhook 已抵達，而合併 bucket 已經 flush。請根據 BB 伺服器記錄調整視窗，而不是 Session 記錄。
  </Accordion>
  <Accordion title="記憶體壓力拖慢回覆派送">
    在較小的機器（8 GB）上，代理回合可能花得夠久，使合併 bucket 在回覆完成前就 flush，URL 因而成為佇列中的第二個回合。檢查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 超過約 500 MB RSS 且壓縮器處於作用中，請關閉其他高負載程序或改用較大的主機。
  </Accordion>
  <Accordion title="回覆引用傳送是不同路徑">
    如果使用者將 `Dump` 作為對既有 URL 氣泡的**回覆**點按送出（iMessage 在 Dump 氣泡上顯示「1 Reply」徽章），URL 會存在於 `replyToBody`，而不是第二個 Webhook。合併不適用，這是 Skill/prompt 層面的考量，不是 debouncer 層面的考量。
  </Accordion>
</AccordionGroup>

## 區塊串流

控制回應要作為單一訊息傳送，或以區塊串流傳送：

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## 媒體 + 限制

- 入站附件會下載並儲存在媒體快取中。
- 透過 `channels.bluebubbles.mediaMaxMb` 設定入站與出站媒體的媒體上限（預設：8 MB）。
- 出站文字會依 `channels.bluebubbles.textChunkLimit` 分段（預設：4000 個字元）。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

<AccordionGroup>
  <Accordion title="連線與 Webhook">
    - `channels.bluebubbles.enabled`：啟用/停用此頻道。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基底 URL。
    - `channels.bluebubbles.password`：API 密碼。
    - `channels.bluebubbles.webhookPath`：Webhook 端點路徑（預設：`/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="存取政策">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（預設：`pairing`）。
    - `channels.bluebubbles.allowFrom`：DM 允許清單（handles、emails、E.164 numbers、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（預設：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群組寄件者允許清單。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，通過閘門檢查後，可選擇從本機 Contacts 補充未命名群組參與者資訊。預設：`false`。
    - `channels.bluebubbles.groups`：每個群組的設定（`requireMention` 等）。

  </Accordion>
  <Accordion title="傳送與分塊">
    - `channels.bluebubbles.sendReadReceipts`：傳送已讀回執（預設值：`true`）。
    - `channels.bluebubbles.blockStreaming`：啟用區塊串流（預設值：`false`；串流回覆必須啟用）。
    - `channels.bluebubbles.textChunkLimit`：外寄分塊大小，以字元數計（預設值：4000）。
    - `channels.bluebubbles.sendTimeoutMs`：透過 `/api/v1/message/text` 傳送外寄文字時，每個請求的逾時時間，以毫秒計（預設值：30000）。在 macOS 26 設定中，如果 Private API iMessage 傳送可能在 iMessage 框架內停滯超過 60 秒，請提高此值；例如 `45000` 或 `60000`。探測、聊天查詢、回應、編輯與健康狀態檢查目前保留較短的 10 秒預設值；後續計畫將涵蓋範圍擴大到回應與編輯。每個帳號的覆寫設定：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`：`length`（預設值）只在超過 `textChunkLimit` 時分割；`newline` 會先依空白行（段落邊界）分割，再依長度分塊。

  </Accordion>
  <Accordion title="媒體與歷史記錄">
    - `channels.bluebubbles.mediaMaxMb`：傳入/傳出媒體上限，以 MB 計（預設值：8）。
    - `channels.bluebubbles.mediaLocalRoots`：明確允許用於外寄本機媒體路徑的絕對本機目錄允許清單。除非已設定此項，否則預設拒絕傳送本機路徑。每個帳號的覆寫設定：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`：將連續的同一寄件者 DM Webhook 合併成單一代理回合，讓 Apple 的文字+URL 分開傳送能以單一訊息送達（預設值：`false`）。請參閱[合併分開傳送的 DM](#coalescing-split-send-dms-command--url-in-one-composition)，了解情境、視窗調校與取捨。啟用且未明確設定 `messages.inbound.byChannel.bluebubbles` 時，會將預設傳入防抖視窗從 500 ms 擴大到 2500 ms。
    - `channels.bluebubbles.historyLimit`：作為上下文的群組訊息最大數量（0 表示停用）。
    - `channels.bluebubbles.dmHistoryLimit`：DM 歷史記錄限制。
    - `channels.bluebubbles.replyContextApiFallback`：當傳入回覆沒有 `replyToBody`/`replyToSender`，且記憶體中的回覆上下文快取未命中時，從 BlueBubbles HTTP API 擷取原始訊息，作為盡力而為的備援（預設值：`false`）。適用於共用同一個 BlueBubbles 帳號的多執行個體部署、程序重新啟動後，或長生命週期 TTL/LRU 快取淘汰後。擷取會受到與所有其他 BlueBubbles 用戶端請求相同政策的 SSRF 防護，絕不拋出錯誤，並會填入快取，讓後續回覆分攤成本。每個帳號的覆寫設定：`channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。頻道層級設定會傳播到省略此旗標的帳號。

  </Accordion>
  <Accordion title="動作與帳號">
    - `channels.bluebubbles.actions`：啟用/停用特定動作。
    - `channels.bluebubbles.accounts`：多帳號設定。

  </Accordion>
</AccordionGroup>

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 位址指定 / 傳送目標

偏好使用 `chat_guid` 以取得穩定路由：

- `chat_guid:iMessage;-;+15555550123`（群組偏好使用）
- `chat_id:123`
- `chat_identifier:...`
- 直接 handle：`+15555550123`、`user@example.com`
  - 如果直接 handle 沒有既有的 DM 聊天，OpenClaw 會透過 `POST /api/v1/chat/new` 建立一個。這需要啟用 BlueBubbles Private API。

### iMessage 與 SMS 路由

當同一個 handle 在 Mac 上同時有 iMessage 與 SMS 聊天時（例如某個電話號碼已註冊 iMessage，但也曾收到綠色泡泡備援），OpenClaw 會偏好 iMessage 聊天，且絕不會默默降級為 SMS。若要強制使用 SMS 聊天，請使用明確的 `sms:` 目標前綴（例如 `sms:+15555550123`）。沒有相符 iMessage 聊天的 handle 仍會透過 BlueBubbles 回報的任何聊天傳送。

## 安全性

- Webhook 請求會透過比較 `guid`/`password` 查詢參數或標頭與 `channels.bluebubbles.password` 來驗證。
- 請將 API 密碼與 Webhook 端點保持機密（像認證資料一樣處理）。
- BlueBubbles Webhook 驗證沒有 localhost 旁路。如果你代理 Webhook 流量，請在整個請求端到端保留 BlueBubbles 密碼。`gateway.trustedProxies` 在此不會取代 `channels.bluebubbles.password`。請參閱 [Gateway 安全性](/zh-TW/gateway/security#reverse-proxy-configuration)。
- 如果將 BlueBubbles 伺服器公開到 LAN 之外，請啟用 HTTPS 與防火牆規則。

## 疑難排解

- 如果輸入/已讀事件停止運作，請檢查 BlueBubbles Webhook 記錄，並確認 Gateway 路徑符合 `channels.bluebubbles.webhookPath`。
- 配對碼會在一小時後過期；請使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回應需要 BlueBubbles private API（`POST /api/v1/message/react`）；請確認伺服器版本有公開此功能。
- 編輯/取消傳送需要 macOS 13+ 與相容的 BlueBubbles 伺服器版本。在 macOS 26（Tahoe）上，由於 private API 變更，編輯目前無法運作。
- 在 macOS 26（Tahoe）上，群組圖示更新可能不穩定：API 可能回傳成功，但新圖示不會同步。
- OpenClaw 會根據 BlueBubbles 伺服器的 macOS 版本自動隱藏已知故障的動作。如果編輯仍出現在 macOS 26（Tahoe）上，請使用 `channels.bluebubbles.actions.edit=false` 手動停用。
- 已啟用 `coalesceSameSenderDms`，但分開傳送（例如 `Dump` + URL）仍以兩個回合送達：請參閱[分開傳送合併疑難排解](#split-send-coalescing-troubleshooting)檢查清單 - 常見原因包括防抖視窗過短、將工作階段記錄時間戳誤讀為 Webhook 到達時間，或傳送回覆引用（使用 `replyToBody`，而不是第二個 Webhook）。
- 如需狀態/健康狀態資訊：`openclaw status --all` 或 `openclaw status --deep`。

如需一般頻道工作流程參考，請參閱[頻道](/zh-TW/channels)與 [Plugins](/zh-TW/tools/plugin) 指南。

## 相關

- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [頻道概觀](/zh-TW/channels) - 所有支援的頻道
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
