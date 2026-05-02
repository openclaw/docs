---
read_when:
    - 設定 BlueBubbles 頻道
    - 疑難排解 Webhook 配對
    - 在 macOS 上設定 iMessage
sidebarTitle: BlueBubbles
summary: 透過 BlueBubbles macOS 伺服器使用 iMessage（REST 傳送/接收、輸入中狀態、反應、配對、進階動作）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-02T02:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

狀態：會透過 HTTP 與 BlueBubbles macOS 伺服器通訊的內建 Plugin。由於相較於舊版 imsg channel，其 API 更豐富且設定更簡單，**建議用於 iMessage 整合**。

<Note>
目前的 OpenClaw 版本已內建 BlueBubbles，因此一般封裝建置不需要額外執行 `openclaw plugins install` 步驟。
</Note>

## 概觀

- 透過 BlueBubbles 輔助 app（[bluebubbles.app](https://bluebubbles.app)）在 macOS 上執行。
- 建議/已測試：macOS Sequoia (15)。macOS Tahoe (26) 可運作；目前 Tahoe 上的編輯功能已損壞，群組圖示更新可能會回報成功但不會同步。
- OpenClaw 透過其 REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）與它通訊。
- 傳入訊息透過 Webhook 抵達；傳出回覆、輸入指示器、已讀回條和 tapback 都是 REST 呼叫。
- 附件和貼圖會作為傳入媒體擷取（並在可行時呈現給 agent）。
- 合成 MP3 或 CAF 音訊的自動 TTS 回覆會以 iMessage 語音備忘錄泡泡傳送，而不是一般檔案附件。
- 配對/允許清單的運作方式與其他 channel 相同（`/channels/pairing` 等），搭配 `channels.bluebubbles.allowFrom` + 配對碼。
- 反應會像 Slack/Telegram 一樣呈現為系統事件，讓 agents 能在回覆前「提及」它們。
- 進階功能：編輯、取消傳送、回覆串接、訊息效果、群組管理。

## 快速開始

<Steps>
  <Step title="Install BlueBubbles">
    在你的 Mac 上安裝 BlueBubbles 伺服器（依照 [bluebubbles.app/install](https://bluebubbles.app/install) 的說明操作）。
  </Step>
  <Step title="Enable the web API">
    在 BlueBubbles 設定中，啟用 Web API 並設定密碼。
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
    將 BlueBubbles Webhook 指向你的 gateway（範例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Start the gateway">
    啟動 gateway；它會註冊 Webhook handler 並開始配對。
  </Step>
</Steps>

<Warning>
**安全性**

- 一律設定 Webhook 密碼。
- Webhook 驗證一律為必填。除非 BlueBubbles Webhook 請求包含與 `channels.bluebubbles.password` 相符的密碼/guid（例如 `?password=<password>` 或 `x-password`），否則 OpenClaw 會拒絕該請求，無論 loopback/proxy 拓撲為何。
- 密碼驗證會在讀取/剖析完整 Webhook body 之前檢查。

</Warning>

## 讓 Messages.app 保持執行（VM / 無頭設定）

某些 macOS VM / 常駐設定可能會讓 Messages.app 進入「閒置」狀態（傳入事件會停止，直到 app 被開啟/置於前景）。一個簡單的因應方式是使用 AppleScript + LaunchAgent **每 5 分鐘 poke Messages 一次**。

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

    這會**每 300 秒**以及**登入時**執行。第一次執行可能會觸發 macOS **自動化**提示（`osascript` → Messages）。請在執行 LaunchAgent 的同一個使用者工作階段中核准它們。

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles 可用於互動式 onboarding：

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
  Webhook endpoint path。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`、`allowlist`、`open` 或 `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  電話號碼、電子郵件或 chat targets。
</ParamField>

你也可以透過 CLI 加入 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 存取控制（DMs + 群組）

<Tabs>
  <Tab title="DMs">
    - 預設值：`channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知傳送者會收到配對碼；在核准前訊息會被忽略（代碼 1 小時後到期）。
    - 透過以下方式核准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配對是預設的 token exchange。詳細資訊：[配對](/zh-TW/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（預設值：`allowlist`）。
    - 設定 `allowlist` 時，`channels.bluebubbles.groupAllowFrom` 控制誰能在群組中觸發。

  </Tab>
</Tabs>

### 聯絡人名稱補強（macOS，選用）

BlueBubbles 群組 Webhook 通常只包含原始參與者位址。如果你希望 `GroupMembers` context 改為顯示本機聯絡人名稱，可以在 macOS 上選擇加入本機 Contacts 補強：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 會啟用查詢。預設值：`false`。
- 查詢只會在群組存取、命令授權和 mention gating 都允許訊息通過後執行。
- 只會補強未命名的電話參與者。
- 找不到本機符合項目時，原始電話號碼仍會作為 fallback。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention gating（群組）

BlueBubbles 支援群組聊天的 mention gating，符合 iMessage/WhatsApp 行為：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）偵測 mentions。
- 群組啟用 `requireMention` 時，agent 只有在被提及時才會回應。
- 來自已授權傳送者的控制命令會略過 mention gating。

每個群組設定：

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
- 已授權傳送者即使在群組中沒有提及，也可以執行控制命令。

### 每個群組的 system prompt

`channels.bluebubbles.groups.*` 底下的每個項目都接受選用的 `systemPrompt` 字串。此值會在處理該群組訊息的每一輪中注入 agent 的 system prompt，因此你可以設定每個群組的人格或行為規則，而不必編輯 agent prompts：

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

該 key 會比對 BlueBubbles 為群組回報的任何 `chatGuid` / `chatIdentifier` / numeric `chatId`，而 `"*"` wildcard 項目會為沒有精確符合的每個群組提供預設值（與 `requireMention` 和每個群組工具政策使用相同模式）。精確符合一律優先於 wildcard。DMs 會忽略此欄位；請改用 agent 層級或 account 層級的 prompt 自訂。

#### 實作範例：threaded replies 和 tapback reactions（Private API）

啟用 BlueBubbles Private API 後，傳入訊息會帶有短訊息 ID（例如 `[[reply_to:5]]`），agent 可以呼叫 `action=reply` 以 thread 到特定訊息，或呼叫 `action=react` 來放置 tapback。每個群組的 `systemPrompt` 是讓 agent 選擇正確工具的可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback reactions 和 threaded replies 都需要 BlueBubbles Private API；底層機制請參閱[進階動作](#advanced-actions)和[訊息 ID](#message-ids-short-vs-full)。

## ACP 對話綁定

BlueBubbles chats 可以轉換成持久的 ACP workspaces，而不需變更 transport layer。

快速操作流程：

- 在 DM 或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 之後同一個 BlueBubbles conversation 中的訊息會路由到產生的 ACP session。
- `/new` 和 `/reset` 會就地重設同一個已綁定的 ACP session。
- `/acp close` 會關閉 ACP session 並移除綁定。

也支援透過頂層 `bindings[]` 項目設定持久綁定，其中包含 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何支援的 BlueBubbles target form：

- 正規化的 DM handle，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

若要穩定的群組綁定，建議使用 `chat_id:*` 或 `chat_identifier:*`。

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

共享的 ACP 綁定行為請參閱 [ACP Agents](/zh-TW/tools/acp-agents)。

## 輸入中 + 已讀回條

- **輸入指示器**：在回應產生前與產生期間自動傳送。
- **已讀回條**：由 `channels.bluebubbles.sendReadReceipts` 控制（預設值：`true`）。
- **輸入指示器**：OpenClaw 會傳送開始輸入事件；BlueBubbles 會在傳送或逾時時自動清除輸入狀態（透過 DELETE 手動停止並不可靠）。

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
    - **react**：新增/移除 tapback 反應（`messageId`、`emoji`、`remove`）。iMessage 的原生 tapback 集合為 `love`、`like`、`dislike`、`laugh`、`emphasize` 與 `question`。當代理選擇該集合外的表情符號（例如 `👀`）時，反應工具會退回使用 `love`，讓 tapback 仍能顯示，而不是讓整個請求失敗。已設定的 ack 反應仍會嚴格驗證，未知值會報錯。
    - **edit**：編輯已傳送的訊息（`messageId`、`text`）。
    - **unsend**：收回訊息（`messageId`）。
    - **reply**：回覆特定訊息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：使用 iMessage 效果傳送（`text`、`to`、`effectId`）。
    - **renameGroup**：重新命名群組聊天（`chatGuid`、`displayName`）。
    - **setGroupIcon**：設定群組聊天的圖示/照片（`chatGuid`、`media`）— 在 macOS 26 Tahoe 上不穩定（API 可能回傳成功，但圖示不會同步）。
    - **addParticipant**：將某人加入群組（`chatGuid`、`address`）。
    - **removeParticipant**：從群組移除某人（`chatGuid`、`address`）。
    - **leaveGroup**：離開群組聊天（`chatGuid`）。
    - **upload-file**：傳送媒體/檔案（`to`、`buffer`、`filename`、`asVoice`）。
      - 語音備忘錄：設定 `asVoice: true`，並搭配 **MP3** 或 **CAF** 音訊，即可作為 iMessage 語音訊息傳送。BlueBubbles 會在傳送語音備忘錄時將 MP3 → CAF。
    - 舊版別名：`sendAttachment` 仍可使用，但 `upload-file` 是標準動作名稱。

  </Accordion>
</AccordionGroup>

### 訊息 ID（短 ID 與完整 ID）

OpenClaw 可能會顯示_短_訊息 ID（例如 `1`、`2`）以節省權杖。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供者的完整 ID。
- 短 ID 儲存在記憶體中；重新啟動或快取清除時可能會過期。
- 動作接受短或完整 `messageId`，但如果短 ID 不再可用，就會報錯。

對於持久性自動化與儲存，請使用完整 ID：

- 範本：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 情境：傳入承載中的 `MessageSidFull` / `ReplyToIdFull`

範本變數請參閱[設定](/zh-TW/gateway/configuration)。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合併分割傳送的 DM（指令 + URL 在同一段輸入中）

當使用者在 iMessage 中一起輸入指令與 URL，例如 `Dump https://example.com/article`，Apple 會把傳送拆成**兩個獨立的 Webhook 傳遞**：

1. 文字訊息（`"Dump"`）。
2. URL 預覽泡泡（`"https://..."`），並以 OG 預覽圖片作為附件。

在大多數設定中，兩個 Webhook 會相隔約 0.8-2.0 秒抵達 OpenClaw。若未合併，代理會在第 1 輪只收到指令並回覆（通常是「把 URL 傳給我」），直到第 2 輪才看到 URL，而此時指令情境已經遺失。

`channels.bluebubbles.coalesceSameSenderDms` 會讓 DM 選擇加入，將同一寄件者連續的 Webhook 合併為單一代理輪次。群組聊天仍會依每則訊息建立鍵值，因此會保留多使用者輪次結構。

<Tabs>
  <Tab title="When to enable">
    在以下情況啟用：

    - 你發布的 Skills 預期 `command + payload` 會在同一則訊息中（dump、paste、save、queue 等）。
    - 你的使用者會在指令旁貼上 URL、圖片或長內容。
    - 你可以接受增加的 DM 輪次延遲（見下方）。

    在以下情況保持停用：

    - 你需要單字 DM 觸發器具備最低指令延遲。
    - 你的所有流程都是沒有後續承載的一次性指令。

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

    開啟此旗標且沒有明確設定 `messages.inbound.byChannel.bluebubbles` 時，防抖視窗會加寬至 **2500 ms**（未合併時的預設值為 500 ms）。較寬的視窗是必要的，因為 Apple 分割傳送的 0.8-2.0 秒節奏無法符合較短的預設值。

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
  <Tab title="Trade-offs">
    - **DM 控制指令會增加延遲。** 開啟此旗標後，DM 控制指令訊息（例如 `Dump`、`Save` 等）現在會等到防抖視窗結束才派送，以防承載 Webhook 即將到來。群組聊天指令仍會立即派送。
    - **合併輸出有界限** — 合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20；來源項目上限為 10（超出時保留第一個與最新項目）。每個來源 `messageId` 仍會進入傳入去重，因此稍後 MessagePoller 重播任何個別事件時，都會被辨識為重複。
    - **選擇加入，依通道設定。** 其他通道（Telegram、WhatsApp、Slack、…）不受影響。

  </Tab>
</Tabs>

### 情境與代理看到的內容

| 使用者輸入                                                         | Apple 傳遞                | 關閉旗標（預設）                        | 開啟旗標 + 2500 ms 視窗                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 2 個 Webhook，相隔約 1 秒 | 兩個代理輪次：「Dump」單獨出現，接著是 URL | 一個輪次：合併文字 `Dump https://example.com`                           |
| `Save this 📎image.jpg caption`（附件 + 文字）                      | 2 個 Webhook              | 兩個輪次                                | 一個輪次：文字 + 圖片                                                  |
| `/status`（獨立指令）                                              | 1 個 Webhook              | 立即派送                                | **最多等待視窗時間，然後派送**                                         |
| 單獨貼上的 URL                                                     | 1 個 Webhook              | 立即派送                                | 立即派送（儲存桶中只有一個項目）                                       |
| 文字 + URL 作為兩則刻意分開的訊息傳送，相隔數分鐘                  | 2 個 Webhook，超出視窗    | 兩個輪次                                | 兩個輪次（視窗在其間過期）                                             |
| 快速湧入（視窗內超過 10 則小型 DM）                                | N 個 Webhook              | N 個輪次                                | 一個輪次，有界限輸出（保留第一個 + 最新，套用文字/附件上限）           |

### 分割傳送合併疑難排解

如果旗標已開啟，但分割傳送仍以兩個輪次抵達，請檢查每一層：

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然後執行 `openclaw gateway restart` — 此旗標會在建立防抖登錄時讀取。

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    查看 `~/Library/Logs/bluebubbles-server/main.log` 下的 BlueBubbles 伺服器記錄：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    測量 `"Dump"` 這類文字派送與後續 `"https://..."; Attachments:` 派送之間的間隔。將 `messages.inbound.byChannel.bluebubbles` 提高到足以涵蓋該間隔。

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    工作階段事件時間戳記（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 將訊息交給代理的時間，**不是** Webhook 抵達的時間。若第二則排隊訊息標記為 `[Queued messages while agent was busy]`，代表第一輪在第二個 Webhook 抵達時仍在執行，而合併儲存桶已經清空。請根據 BB 伺服器記錄調整視窗，而不是根據工作階段記錄。
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    在較小的機器（8 GB）上，代理輪次可能耗時夠久，導致合併儲存桶在回覆完成前就清空，而 URL 會以排隊的第二輪落入。檢查 `memory_pressure` 與 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 超過約 500 MB RSS 且壓縮器正在作用，請關閉其他耗資源的程序，或改用更大的主機。
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    如果使用者是將 `Dump` 作為現有 URL 泡泡的**回覆**點選（iMessage 會在 Dump 泡泡上顯示「1 Reply」徽章），URL 會位於 `replyToBody`，而不是第二個 Webhook 中。合併不適用；那是 Skills/提示詞層面的問題，不是防抖器問題。
  </Accordion>
</AccordionGroup>

## 區塊串流

控制回應是以單一訊息傳送，或以區塊串流傳送：

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
- 透過 `channels.bluebubbles.mediaMaxMb` 設定傳入與傳出媒體的媒體上限（預設值：8 MB）。
- 傳出文字會依 `channels.bluebubbles.textChunkLimit` 分段（預設值：4000 個字元）。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`：啟用/停用通道。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基底 URL。
    - `channels.bluebubbles.password`：API 密碼。
    - `channels.bluebubbles.webhookPath`：Webhook 端點路徑（預設值：`/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（預設值：`pairing`）。
    - `channels.bluebubbles.allowFrom`：DM 允許清單（控制代碼、電子郵件、E.164 號碼、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（預設值：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群組寄件者允許清單。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，通過門控後可選擇從本機 Contacts 補充未命名群組參與者資訊。預設值：`false`。
    - `channels.bluebubbles.groups`：個別群組設定（`requireMention` 等）。

  </Accordion>
  <Accordion title="傳遞與分段">
    - `channels.bluebubbles.sendReadReceipts`: 傳送已讀回條（預設：`true`）。
    - `channels.bluebubbles.blockStreaming`: 啟用區塊串流（預設：`false`；串流回覆需要）。
    - `channels.bluebubbles.textChunkLimit`: 傳出分段大小，以字元計（預設：4000）。
    - `channels.bluebubbles.sendTimeoutMs`: 透過 `/api/v1/message/text` 傳送傳出文字時，每個請求的逾時時間，以毫秒計（預設：30000）。在 macOS 26 設定中，Private API iMessage 傳送可能會在 iMessage framework 內停滯 60 秒以上，請提高此值；例如 `45000` 或 `60000`。探測、聊天查詢、回應、編輯和健康檢查目前仍保留較短的 10 秒預設值；後續計畫將涵蓋範圍擴大到回應和編輯。每帳號覆寫：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length`（預設）只在超過 `textChunkLimit` 時分割；`newline` 會先依空白行（段落邊界）分割，再依長度分段。

  </Accordion>
  <Accordion title="媒體與歷史記錄">
    - `channels.bluebubbles.mediaMaxMb`: 傳入/傳出媒體上限，以 MB 計（預設：8）。
    - `channels.bluebubbles.mediaLocalRoots`: 明確允許的絕對本機目錄清單，允許用於傳出本機媒體路徑。除非設定此項，否則預設拒絕傳送本機路徑。每帳號覆寫：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 將連續的同一傳送者 DM Webhook 合併為一個 agent 回合，讓 Apple 的文字+URL 分開傳送能以單一訊息抵達（預設：`false`）。請參閱[合併分開傳送的 DM](#coalescing-split-send-dms-command--url-in-one-composition)，了解情境、視窗調整與取捨。啟用且未明確設定 `messages.inbound.byChannel.bluebubbles` 時，會將預設傳入 debounce 視窗從 500 ms 擴大到 2500 ms。
    - `channels.bluebubbles.historyLimit`: 內容脈絡的群組訊息最大數量（0 會停用）。
    - `channels.bluebubbles.dmHistoryLimit`: DM 歷史記錄限制。
    - `channels.bluebubbles.replyContextApiFallback`: 當傳入回覆沒有 `replyToBody`/`replyToSender`，且記憶體內回覆內容脈絡快取未命中時，會從 BlueBubbles HTTP API 擷取原始訊息，作為盡力而為的後援（預設：`false`）。這對共用同一個 BlueBubbles 帳號的多執行個體部署、程序重新啟動後，或長期 TTL/LRU 快取淘汰後很有用。擷取會受到與其他所有 BlueBubbles 用戶端請求相同的 SSRF 防護政策保護，絕不丟出例外，並會填入快取，讓後續回覆分攤成本。每帳號覆寫：`channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。通道層級設定會傳播到未設定此旗標的帳號。

  </Accordion>
  <Accordion title="動作與帳號">
    - `channels.bluebubbles.actions`: 啟用/停用特定動作。
    - `channels.bluebubbles.accounts`: 多帳號設定。

  </Accordion>
</AccordionGroup>

相關全域選項：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 定址 / 傳遞目標

偏好使用 `chat_guid` 以取得穩定路由：

- `chat_guid:iMessage;-;+15555550123`（群組偏好使用）
- `chat_id:123`
- `chat_identifier:...`
- 直接 handle：`+15555550123`、`user@example.com`
  - 如果直接 handle 沒有既有 DM 聊天，OpenClaw 會透過 `POST /api/v1/chat/new` 建立一個。這需要啟用 BlueBubbles Private API。

### iMessage 與 SMS 路由

當同一個 handle 在 Mac 上同時有 iMessage 和 SMS 聊天時（例如某個電話號碼已註冊 iMessage，但也收到過綠色泡泡後援），OpenClaw 會偏好 iMessage 聊天，且絕不會無聲降級到 SMS。若要強制使用 SMS 聊天，請使用明確的 `sms:` 目標前綴（例如 `sms:+15555550123`）。沒有相符 iMessage 聊天的 handle 仍會透過 BlueBubbles 回報的任何聊天傳送。

## 安全性

- Webhook 請求會透過比對 `guid`/`password` 查詢參數或標頭與 `channels.bluebubbles.password` 進行驗證。
- 請將 API 密碼和 Webhook 端點保密（像認證資料一樣處理）。
- BlueBubbles Webhook 驗證沒有 localhost 繞過。如果你代理 Webhook 流量，請讓請求端到端保留 BlueBubbles 密碼。`gateway.trustedProxies` 在此不會取代 `channels.bluebubbles.password`。請參閱 [Gateway 安全性](/zh-TW/gateway/security#reverse-proxy-configuration)。
- 如果要將 BlueBubbles 伺服器暴露到 LAN 之外，請啟用 HTTPS + 防火牆規則。

## 疑難排解

- 如果輸入/已讀事件停止運作，請檢查 BlueBubbles Webhook 記錄，並確認 gateway 路徑符合 `channels.bluebubbles.webhookPath`。
- 配對碼會在一小時後過期；請使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 回應需要 BlueBubbles private API（`POST /api/v1/message/react`）；請確認伺服器版本有提供它。
- 編輯/取消傳送需要 macOS 13+ 與相容的 BlueBubbles 伺服器版本。在 macOS 26（Tahoe）上，因 private API 變更，編輯目前無法運作。
- 群組圖示更新在 macOS 26（Tahoe）上可能不穩定：API 可能回傳成功，但新圖示不會同步。
- OpenClaw 會根據 BlueBubbles 伺服器的 macOS 版本自動隱藏已知故障的動作。如果編輯在 macOS 26（Tahoe）上仍然出現，請使用 `channels.bluebubbles.actions.edit=false` 手動停用它。
- 已啟用 `coalesceSameSenderDms`，但分開傳送（例如 `Dump` + URL）仍以兩個回合抵達：請參閱[分開傳送合併疑難排解](#split-send-coalescing-troubleshooting)檢查清單——常見原因包括 debounce 視窗太短、工作階段記錄時間戳被誤讀為 Webhook 抵達時間，或回覆引用傳送（使用 `replyToBody`，而非第二個 Webhook）。
- 狀態/健康資訊：`openclaw status --all` 或 `openclaw status --deep`。

如需一般通道工作流程參考，請參閱[通道](/zh-TW/channels)與 [Plugins](/zh-TW/tools/plugin) 指南。

## 相關

- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [通道概覽](/zh-TW/channels) — 所有支援的通道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
