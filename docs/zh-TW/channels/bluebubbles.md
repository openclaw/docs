---
read_when:
    - 設定 BlueBubbles 通道
    - Webhook 配對疑難排解
    - 在 macOS 上設定 iMessage
sidebarTitle: BlueBubbles
summary: 透過 BlueBubbles macOS 伺服器使用 iMessage（REST 傳送/接收、輸入狀態、表情回應、配對、進階動作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

狀態：會透過 HTTP 與 BlueBubbles macOS 伺服器通訊的隨附 Plugin。由於其 API 較完整且設定比舊版 imsg 通道更簡單，**建議用於 iMessage 整合**。

<Note>
目前的 OpenClaw 發行版本隨附 BlueBubbles，因此一般封裝建置不需要另外執行 `openclaw plugins install` 步驟。
</Note>

## 概覽

- 透過 BlueBubbles 輔助 App 在 macOS 上執行（[bluebubbles.app](https://bluebubbles.app)）。
- 建議/已測試：macOS Sequoia (15)。macOS Tahoe (26) 可運作；編輯功能目前在 Tahoe 上無法使用，群組圖示更新可能會回報成功但不會同步。
- OpenClaw 會透過其 REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）與其通訊。
- 傳入訊息會透過 Webhook 抵達；傳出回覆、輸入中指示器、已讀回條和 tapback 都是 REST 呼叫。
- 附件和貼圖會作為傳入媒體擷取（可行時也會呈現給 agent）。
- 會合成 MP3 或 CAF 音訊的自動 TTS 回覆，會以 iMessage 語音備忘錄泡泡傳送，而不是一般檔案附件。
- 配對/允許清單的運作方式與其他通道相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配對碼。
- 回應會像 Slack/Telegram 一樣呈現為系統事件，讓 agent 可以在回覆前「提及」它們。
- 進階功能：編輯、取消傳送、回覆串接、訊息效果、群組管理。

## 快速開始

<Steps>
  <Step title="Install BlueBubbles">
    在你的 Mac 上安裝 BlueBubbles 伺服器（依照 [bluebubbles.app/install](https://bluebubbles.app/install) 的指示操作）。
  </Step>
  <Step title="Enable the web API">
    在 BlueBubbles 設定中啟用 Web API 並設定密碼。
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
- 一律需要 Webhook 驗證。除非 BlueBubbles Webhook 請求包含符合 `channels.bluebubbles.password` 的密碼/guid（例如 `?password=<password>` 或 `x-password`），否則 OpenClaw 會拒絕該請求，無論 loopback/proxy 拓撲為何。
- 在讀取/剖析完整 Webhook 內文之前，會先檢查密碼驗證。

</Warning>

## 讓 Messages.app 保持運作（VM / 無頭設定）

某些 macOS VM / 常駐設定可能會讓 Messages.app 進入「閒置」狀態（傳入事件會停止，直到 App 開啟/切到前景）。一個簡單的因應方式是使用 AppleScript + LaunchAgent **每 5 分鐘觸發 Messages 一次**。

<Steps>
  <Step title="Save the AppleScript">
    將此儲存為 `~/Scripts/poke-messages.scpt`：

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
    將此儲存為 `~/Library/LaunchAgents/com.user.poke-messages.plist`：

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

    這會**每 300 秒**以及**登入時**執行。第一次執行可能會觸發 macOS **自動化**提示（`osascript` → Messages）。請在執行 LaunchAgent 的同一個使用者工作階段中核准。

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## 初始設定

BlueBubbles 可在互動式初始設定中使用：

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
    - 未知寄件者會收到配對碼；在核准之前訊息會被忽略（代碼會在 1 小時後過期）。
    - 透過以下方式核准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配對是預設的權杖交換。詳細資訊：[配對](/zh-TW/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（預設：`allowlist`）。
    - 設定 `allowlist` 時，`channels.bluebubbles.groupAllowFrom` 會控制誰可以在群組中觸發。

  </Tab>
</Tabs>

### 聯絡人名稱補充（macOS，選用）

BlueBubbles 群組 Webhook 通常只包含原始參與者位址。如果你想讓 `GroupMembers` 情境改為顯示本機聯絡人名稱，可以在 macOS 上選擇啟用本機「聯絡人」增強：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 啟用查詢。預設值：`false`。
- 查詢只會在群組存取、指令授權與提及閘控允許訊息通過後執行。
- 只會增強未命名的電話參與者。
- 找不到本機相符項目時，原始電話號碼會保留為備用值。

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
- 當群組啟用 `requireMention` 時，代理程式只會在被提及時回應。
- 授權寄件者的控制指令會略過提及閘控。

各群組設定：

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

### 指令閘控

- 控制指令（例如 `/config`、`/model`）需要授權。
- 使用 `allowFrom` 和 `groupAllowFrom` 判斷指令授權。
- 授權寄件者即使在群組中未提及，也可以執行控制指令。

### 各群組系統提示

`channels.bluebubbles.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串。此值會在處理該群組訊息的每一輪中注入代理程式的系統提示，因此你可以設定各群組的人設或行為規則，而不必編輯代理程式提示：

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

此鍵會比對 BlueBubbles 回報給群組的 `chatGuid` / `chatIdentifier` / 數字 `chatId`，而 `"*"` 萬用字元項目會為每個沒有精確相符項目的群組提供預設值（與 `requireMention` 和各群組工具政策使用相同模式）。精確相符一律優先於萬用字元。DM 會忽略此欄位；請改用代理程式層級或帳號層級的提示自訂。

#### 實作範例：串接回覆與 tapback 反應（Private API）

啟用 BlueBubbles Private API 後，傳入訊息會帶有短訊息 ID（例如 `[[reply_to:5]]`），代理程式可以呼叫 `action=reply` 以串接到特定訊息，或呼叫 `action=react` 送出 tapback。各群組的 `systemPrompt` 是讓代理程式選擇正確工具的可靠方式：

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

Tapback 反應與串接回覆都需要 BlueBubbles Private API；請參閱[進階動作](#advanced-actions)和[訊息 ID](#message-ids-short-vs-full)了解底層機制。

## ACP 對話繫結

BlueBubbles 聊天可以轉換成持久的 ACP 工作區，而不必變更傳輸層。

快速操作流程：

- 在 DM 或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 BlueBubbles 對話中的後續訊息會路由到產生的 ACP 工作階段。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

也支援透過最上層 `bindings[]` 項目設定持久繫結，並使用 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何支援的 BlueBubbles 目標形式：

- 正規化的 DM 控制代碼，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

對於穩定的群組繫結，偏好使用 `chat_id:*` 或 `chat_identifier:*`。

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

請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)了解共用的 ACP 繫結行為。

## 輸入中 + 已讀回條

- **輸入中指示器**：在回應產生前與產生期間自動傳送。
- **已讀回條**：由 `channels.bluebubbles.sendReadReceipts` 控制（預設值：`true`）。
- **輸入中指示器**：OpenClaw 會傳送輸入開始事件；BlueBubbles 會在傳送或逾時時自動清除輸入狀態（透過 DELETE 手動停止並不可靠）。

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

BlueBubbles 在設定中啟用時支援進階訊息動作：

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
  <Accordion title="Available actions">
    - **react**：新增/移除 tapback 反應（`messageId`、`emoji`、`remove`）。iMessage 的原生 tapback 集合是 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。當 agent 選擇該集合以外的 emoji（例如 `👀`）時，反應工具會退回使用 `love`，讓 tapback 仍能呈現，而不是讓整個請求失敗。已設定的 ack 反應仍會嚴格驗證，且會對未知值報錯。
    - **edit**：編輯已傳送的訊息（`messageId`、`text`）。
    - **unsend**：收回訊息（`messageId`）。
    - **reply**：回覆特定訊息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：使用 iMessage 效果傳送（`text`、`to`、`effectId`）。
    - **renameGroup**：重新命名群組聊天（`chatGuid`、`displayName`）。
    - **setGroupIcon**：設定群組聊天的圖示/照片（`chatGuid`、`media`）— 在 macOS 26 Tahoe 上不穩定（API 可能回傳成功，但圖示不會同步）。
    - **addParticipant**：將某人加入群組（`chatGuid`、`address`）。
    - **removeParticipant**：將某人從群組移除（`chatGuid`、`address`）。
    - **leaveGroup**：離開群組聊天（`chatGuid`）。
    - **upload-file**：傳送媒體/檔案（`to`、`buffer`、`filename`、`asVoice`）。
      - 語音備忘錄：設定 `asVoice: true` 並搭配 **MP3** 或 **CAF** 音訊，即可作為 iMessage 語音訊息傳送。BlueBubbles 在傳送語音備忘錄時會將 MP3 → CAF。
    - 舊版別名：`sendAttachment` 仍可運作，但 `upload-file` 是標準動作名稱。

  </Accordion>
</AccordionGroup>

### 訊息 ID（短版與完整）

OpenClaw 可能會顯示_短版_訊息 ID（例如 `1`、`2`）以節省 token。

- `MessageSid` / `ReplyToId` 可以是短版 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供者的完整 ID。
- 短版 ID 只存在於記憶體中；重新啟動或快取淘汰後可能會失效。
- 動作接受短版或完整 `messageId`，但如果短版 ID 已無法使用，將會報錯。

針對需要持久化的自動化和儲存，請使用完整 ID：

- 範本：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：傳入 payload 中的 `MessageSidFull` / `ReplyToIdFull`

範本變數請參閱[設定](/zh-TW/gateway/configuration)。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合併分拆傳送的 DM（同一次撰寫中的命令 + URL）

當使用者在 iMessage 中同時輸入命令和 URL，例如 `Dump https://example.com/article`，Apple 會將傳送分拆為**兩次獨立的 Webhook 遞送**：

1. 一則文字訊息（`"Dump"`）。
2. 一個 URL 預覽氣泡（`"https://..."`），其中包含作為附件的 OG 預覽圖片。

在多數設定中，這兩個 Webhook 抵達 OpenClaw 的時間約相差 0.8-2.0 秒。若沒有合併，agent 會在第 1 輪只收到命令、回覆（通常是「請把 URL 傳給我」），然後在第 2 輪才看到 URL，而此時命令上下文已經遺失。

`channels.bluebubbles.coalesceSameSenderDms` 會讓 DM 選擇將同一寄件者連續的 Webhook 合併為單一 agent 輪次。群組聊天仍會依每則訊息建立鍵值，因此可保留多使用者的輪次結構。

<Tabs>
  <Tab title="When to enable">
    在以下情況啟用：

    - 你提供預期 `command + payload` 會在同一則訊息中的 Skills（dump、paste、save、queue 等）。
    - 你的使用者會在命令旁貼上 URL、圖片或長內容。
    - 你可以接受額外的 DM 輪次延遲（見下方）。

    在以下情況保持停用：

    - 你需要單字 DM 觸發器具備最低命令延遲。
    - 你的所有流程都是沒有後續 payload 的一次性命令。

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    啟用此旗標且未明確設定 `messages.inbound.byChannel.bluebubbles` 時，debounce 視窗會加寬至 **2500 ms**（非合併時的預設值是 500 ms）。需要較寬的視窗，因為 Apple 分拆傳送的節奏為 0.8-2.0 秒，無法符合較窄的預設值。

    如要自行調整視窗：

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
  <Tab title="Trade-offs">
    - **DM 控制命令會增加延遲。** 啟用此旗標後，DM 控制命令訊息（如 `Dump`、`Save` 等）現在會在派送前最多等待 debounce 視窗時間，以防有 payload Webhook 即將到來。群組聊天命令仍會立即派送。
    - **合併輸出有上限** — 合併文字最多 4000 個字元，並有明確的 `…[truncated]` 標記；附件最多 20 個；來源項目最多 10 個（超過後保留第一個加最新項目）。每個來源 `messageId` 仍會進入 inbound-dedupe，因此之後 MessagePoller 重播任何個別事件時都會被辨識為重複。
    - **選擇加入、按頻道設定。** 其他頻道（Telegram、WhatsApp、Slack、…）不受影響。

  </Tab>
</Tabs>

### 情境與 agent 看到的內容

| 使用者撰寫                                                       | Apple 遞送                | 關閉旗標（預設）                        | 開啟旗標 + 2500 ms 視窗                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 2 個 Webhook，約相差 1 秒 | 兩個 agent 輪次：「Dump」單獨出現，接著是 URL | 一個輪次：合併文字 `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`（附件 + 文字）                | 2 個 Webhook              | 兩個輪次                               | 一個輪次：文字 + 圖片                                                  |
| `/status`（獨立命令）                                     | 1 個 Webhook              | 立即派送                        | **最多等待視窗時間，然後派送**                                    |
| 單獨貼上的 URL                                                   | 1 個 Webhook              | 立即派送                        | 立即派送（bucket 中只有一個項目）                             |
| 文字 + URL 作為兩則刻意分開的訊息傳送，相隔數分鐘 | 2 個 Webhook，在視窗外 | 兩個輪次                               | 兩個輪次（視窗在兩者之間到期）                                 |
| 快速大量湧入（視窗內 >10 則小型 DM）                          | N 個 Webhook              | N 個輪次                                 | 一個輪次，輸出有上限（套用第一個 + 最新項目、文字/附件上限） |

### 分拆傳送合併疑難排解

如果旗標已啟用，但分拆傳送仍以兩個輪次抵達，請檢查每一層：

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然後執行 `openclaw gateway restart` — 此旗標會在建立 debouncer-registry 時讀取。

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    查看 `~/Library/Logs/bluebubbles-server/main.log` 中的 BlueBubbles 伺服器記錄：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    測量 `"Dump"` 這類文字派送與後續 `"https://..."; Attachments:` 派送之間的間隔。將 `messages.inbound.byChannel.bluebubbles` 調高到能充裕涵蓋該間隔。

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    工作階段事件時間戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 將訊息交給 agent 的時間，**不是** Webhook 抵達時間。標記為 `[Queued messages while agent was busy]` 的排隊第二則訊息，表示第二個 Webhook 抵達時第一輪仍在執行，合併 bucket 已經 flush。請根據 BB 伺服器記錄調整視窗，而不是工作階段記錄。
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    在較小型的機器（8 GB）上，agent 輪次可能耗時很久，導致合併 bucket 在回覆完成前就 flush，而 URL 會作為排隊的第二輪落入。檢查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 超過約 500 MB RSS 且 compressor 正在作用，請關閉其他負載較重的處理程序，或改用更大的主機。
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    如果使用者將 `Dump` 作為對現有 URL 氣泡的**回覆**點按（iMessage 會在 Dump 氣泡上顯示「1 Reply」徽章），URL 會位於 `replyToBody`，而不是第二個 Webhook 中。合併不適用，這是 skill/prompt 的問題，而不是 debouncer 的問題。
  </Accordion>
</AccordionGroup>

## 區塊串流

控制回應要作為單一訊息傳送，或以區塊串流方式傳送：

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

- 傳入附件會被下載並儲存在媒體快取中。
- 透過 `channels.bluebubbles.mediaMaxMb` 為傳入與傳出媒體設定媒體上限（預設：8 MB）。
- 傳出文字會依 `channels.bluebubbles.textChunkLimit` 分段（預設：4000 個字元）。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`：啟用/停用此頻道。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基礎 URL。
    - `channels.bluebubbles.password`：API 密碼。
    - `channels.bluebubbles.webhookPath`：Webhook 端點路徑（預設：`/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（預設：`pairing`）。
    - `channels.bluebubbles.allowFrom`：DM 允許清單（handles、emails、E.164 numbers、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（預設：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群組寄件者允許清單。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可選擇在通過 gating 後，從本機 Contacts 補充未命名的群組參與者資訊。預設：`false`。
    - `channels.bluebubbles.groups`：每個群組的設定（`requireMention` 等）。

  </Accordion>
  <Accordion title="傳送與分塊">
    - `channels.bluebubbles.sendReadReceipts`: 傳送已讀回條（預設：`true`）。
    - `channels.bluebubbles.blockStreaming`: 啟用區塊串流（預設：`false`；串流回覆需要）。
    - `channels.bluebubbles.textChunkLimit`: 傳出分塊大小，以字元計（預設：4000）。
    - `channels.bluebubbles.sendTimeoutMs`: 透過 `/api/v1/message/text` 傳送傳出文字時，每個請求的逾時時間（毫秒）（預設：30000）。在 macOS 26 設定中，如果 Private API iMessage 傳送可能在 iMessage 框架內停滯 60 秒以上，請提高此值；例如 `45000` 或 `60000`。探測、聊天查詢、回應、編輯與健康檢查目前仍保留較短的 10 秒預設值；後續計畫將涵蓋範圍擴大到回應與編輯。每個帳號覆寫：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length`（預設）只會在超過 `textChunkLimit` 時分割；`newline` 會先依空白行（段落邊界）分割，再依長度分塊。

  </Accordion>
  <Accordion title="媒體與歷史記錄">
    - `channels.bluebubbles.mediaMaxMb`: 傳入/傳出媒體大小上限，以 MB 計（預設：8）。
    - `channels.bluebubbles.mediaLocalRoots`: 明確允許清單，列出允許用於傳出本機媒體路徑的絕對本機目錄。除非設定此項，否則預設拒絕本機路徑傳送。每個帳號覆寫：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 將連續同一寄件者的私訊 Webhook 合併成一個代理回合，讓 Apple 的文字+URL 分開傳送能以單一訊息抵達（預設：`false`）。請參閱[合併分開傳送的私訊](#coalescing-split-send-dms-command--url-in-one-composition)，了解情境、視窗調整與取捨。啟用且未明確設定 `messages.inbound.byChannel.bluebubbles` 時，會將預設傳入防抖視窗從 500 毫秒放寬到 2500 毫秒。
    - `channels.bluebubbles.historyLimit`: 作為上下文的群組訊息數上限（0 表示停用）。
    - `channels.bluebubbles.dmHistoryLimit`: 私訊歷史記錄上限。
    - `channels.bluebubbles.replyContextApiFallback`: 當傳入回覆沒有 `replyToBody`/`replyToSender`，且記憶體中的回覆上下文快取未命中時，從 BlueBubbles HTTP API 盡力擷取原始訊息作為備援（預設：`false`）。適用於共用同一個 BlueBubbles 帳號的多執行個體部署、程序重新啟動後，或長生命週期 TTL/LRU 快取逐出後。此擷取會依照與所有其他 BlueBubbles 用戶端請求相同的政策進行 SSRF 防護，絕不擲出錯誤，並會填入快取，讓後續回覆分攤成本。每個帳號覆寫：`channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。通道層級設定會傳播到未指定此旗標的帳號。

  </Accordion>
  <Accordion title="動作與帳號">
    - `channels.bluebubbles.actions`: 啟用/停用特定動作。
    - `channels.bluebubbles.accounts`: 多帳號設定。

  </Accordion>
</AccordionGroup>

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 定址 / 傳送目標

建議使用 `chat_guid` 以取得穩定路由：

- `chat_guid:iMessage;-;+15555550123`（群組建議使用）
- `chat_id:123`
- `chat_identifier:...`
- 直接控制代碼：`+15555550123`、`user@example.com`
  - 如果直接控制代碼沒有現有的私訊聊天，OpenClaw 會透過 `POST /api/v1/chat/new` 建立一個。這需要啟用 BlueBubbles Private API。

### iMessage 與 SMS 路由

當同一個控制代碼在 Mac 上同時有 iMessage 與 SMS 聊天時（例如某個電話號碼已註冊 iMessage，但也收到過綠色泡泡備援訊息），OpenClaw 會優先使用 iMessage 聊天，且絕不會默默降級為 SMS。若要強制使用 SMS 聊天，請使用明確的 `sms:` 目標前置詞（例如 `sms:+15555550123`）。沒有相符 iMessage 聊天的控制代碼，仍會透過 BlueBubbles 回報的任何聊天傳送。

## 安全性

- Webhook 請求會透過比較 `guid`/`password` 查詢參數或標頭與 `channels.bluebubbles.password` 進行驗證。
- 請將 API 密碼與 Webhook 端點保持機密（像憑證一樣處理）。
- BlueBubbles Webhook 驗證沒有 localhost 繞過。如果你代理 Webhook 流量，請在請求端到端保留 BlueBubbles 密碼。`gateway.trustedProxies` 在此不會取代 `channels.bluebubbles.password`。請參閱 [Gateway 安全性](/zh-TW/gateway/security#reverse-proxy-configuration)。
- 如果將 BlueBubbles 伺服器公開到你的 LAN 之外，請啟用 HTTPS 與防火牆規則。

## 疑難排解

- 如果輸入/已讀事件停止運作，請檢查 BlueBubbles Webhook 記錄，並確認 Gateway 路徑符合 `channels.bluebubbles.webhookPath`。
- 配對碼會在一小時後過期；請使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回應需要 BlueBubbles private API（`POST /api/v1/message/react`）；請確認伺服器版本有公開該 API。
- 編輯/取消傳送需要 macOS 13+ 和相容的 BlueBubbles 伺服器版本。在 macOS 26（Tahoe）上，由於 private API 變更，編輯目前無法運作。
- 群組圖示更新在 macOS 26（Tahoe）上可能不穩定：API 可能回傳成功，但新圖示沒有同步。
- OpenClaw 會根據 BlueBubbles 伺服器的 macOS 版本自動隱藏已知損壞的動作。如果編輯仍出現在 macOS 26（Tahoe）上，請使用 `channels.bluebubbles.actions.edit=false` 手動停用。
- 已啟用 `coalesceSameSenderDms`，但分開傳送（例如 `Dump` + URL）仍以兩個回合抵達：請參閱[分開傳送合併疑難排解](#split-send-coalescing-troubleshooting)檢查清單 — 常見原因包括防抖視窗太短、將工作階段記錄時間戳誤讀為 Webhook 抵達時間，或回覆引用傳送（使用 `replyToBody`，不是第二個 Webhook）。
- 狀態/健康資訊：`openclaw status --all` 或 `openclaw status --deep`。

如需一般通道路程參考，請參閱[通道](/zh-TW/channels)與 [Plugins](/zh-TW/tools/plugin) 指南。

## 相關

- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [通道概觀](/zh-TW/channels) — 所有支援的通道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
