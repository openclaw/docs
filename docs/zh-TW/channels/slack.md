---
read_when:
    - 設定 Slack 或偵錯 Slack 通訊端/HTTP 模式
summary: Slack 設定與執行階段行為（Socket 模式 + HTTP 請求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-02T02:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2b065eab0e80dc223d33d0e0c8210e1ff05ff24426f7a335885540c9eb42ae9
    source_path: channels/slack.md
    workflow: 16
---

Production-ready for DMs and channels via Slack app integrations. Default mode is Socket Mode; HTTP Request URLs are also supported.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Slack DMs 預設為配對模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為與指令目錄。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復手冊。
  </Card>
</CardGroup>

## 快速設定

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        在 Slack 應用程式設定中按下 **[Create New App](https://api.slack.com/apps/new)** 按鈕：

        - 選擇 **from a manifest**，並為你的應用程式選取工作區
        - 貼上下方的[範例 manifest](#manifest-and-scope-checklist)，並繼續建立
        - 使用 `connections:write` 產生 **App-Level Token** (`xapp-...`)
        - 安裝應用程式並複製顯示的 **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

        建議的 SecretRef 設定：

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Env 備援（僅限預設帳戶）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        在 Slack 應用程式設定中按下 **[Create New App](https://api.slack.com/apps/new)** 按鈕：

        - 選擇 **from a manifest**，並為你的應用程式選取工作區
        - 貼上[範例 manifest](#manifest-and-scope-checklist)，並在建立前更新 URL
        - 儲存用於請求驗證的 **Signing Secret**
        - 安裝應用程式並複製顯示的 **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

        建議的 SecretRef 設定：

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        多帳戶 HTTP 請使用唯一的 webhook 路徑

        為每個帳戶指定不同的 `webhookPath`（預設為 `/slack/events`），讓註冊不會衝突。
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 傳輸調整

OpenClaw 預設會將 Socket Mode 的 Slack SDK 用戶端 pong 逾時設為 15 秒。只有在需要針對工作區或主機進行特定調整時，才覆寫傳輸設定：

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

僅在 Socket Mode 工作區記錄 Slack websocket pong/server-ping 逾時，或執行於已知事件迴圈飢餓的主機上時使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息與事件仍是應用程式狀態，不是傳輸活性訊號。

## Manifest 與 scope 檢查清單

基礎 Slack 應用程式 manifest 對 Socket Mode 和 HTTP Request URLs 相同。只有 `settings` 區塊（以及 slash command 的 `url`）不同。

基礎 manifest（Socket Mode 預設）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

若使用 **HTTP Request URLs 模式**，請將 `settings` 替換為 HTTP 版本，並將 `url` 加到每個 slash command。需要公開 URL：

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### 其他 manifest 設定

呈現可擴充上述預設值的不同功能。

預設 manifest 會啟用 Slack App Home 的 **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會使用 `views.publish` 發布安全的預設 Home 視圖；不會包含對話 payload 或私人設定。**Messages** 分頁仍會為 Slack DMs 啟用。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    可以使用多個[原生 slash commands](#commands-and-slash-behavior)，取代單一已設定的指令，並具備細緻差異：

    - 使用 `/agentstatus` 而不是 `/status`，因為 `/status` 指令已保留。
    - 一次最多可提供 25 個 slash commands。

    將你現有的 `features.slash_commands` 區段替換為[可用指令](/zh-TW/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用與上方 Socket Mode 相同的 `slash_commands` 清單，並在每個項目加入 `"url": "https://gateway-host.example.com/slack/events"`。範例：

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    如果你想讓傳出訊息使用作用中代理程式身分（自訂使用者名稱和圖示），而不是預設 Slack 應用程式身分，請加入 `chat:write.customize` bot scope。

    如果使用 emoji 圖示，Slack 預期使用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    如果你設定 `channels.slack.userToken`，典型的讀取 scope 為：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依賴 Slack 搜尋讀取）

  </Accordion>
</AccordionGroup>

## Token 模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 可接受純文字
  字串或 SecretRef 物件。
- 設定 Token 會覆寫 env fallback。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env fallback 只套用到預設帳號。
- `userToken` (`xoxp-...`) 僅能透過設定提供（沒有 env fallback），且預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳號檢查會追蹤每個憑證的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳號是透過 SecretRef
  或其他非行內 Secret 來源設定，但目前的命令／執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要配對是 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作／目錄讀取，設定使用者 Token 時可優先使用它。對於寫入，仍優先使用機器人 Token；只有在 `userTokenReadOnly: false` 且機器人 Token 無法使用時，才允許使用者 Token 寫入。
</Tip>

## 動作與 gate

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中的可用動作群組：

| 群組       | 預設 |
| ---------- | ---- |
| messages   | 啟用 |
| reactions  | 啟用 |
| pins       | 啟用 |
| memberInfo | 啟用 |
| emojiList  | 啟用 |

目前的 Slack 訊息動作包含 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受傳入檔案佔位符中顯示的 Slack 檔案 ID，並針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` 控制 DM 存取。`channels.slack.allowFrom` 是標準 DM allowlist。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    DM 旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組 DM 預設為 false）
    - `dm.groupChannels`（選用的 MPIM allowlist）

    多帳號優先順序：

    - `channels.slack.accounts.default.allowFrom` 只套用到 `default` 帳號。
    - 具名帳號在自己的 `allowFrom` 未設定時，會繼承 `channels.slack.allowFrom`。
    - 具名帳號不會繼承 `channels.slack.accounts.default.allowFrom`。

    舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍會為了相容性讀取。`openclaw doctor --fix` 會在不變更存取權限的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    DM 中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道 allowlist 位於 `channels.slack.channels` 底下，且設定鍵**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅 env 設定），執行階段會 fallback 到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱／ID 解析：

    - Token 存取允許時，頻道 allowlist 項目和 DM allowlist 項目會在啟動時解析
    - 未解析的頻道名稱項目會依設定保留，但預設會在路由時忽略
    - 傳入授權和頻道路由預設以 ID 優先；直接使用使用者名稱／slug 比對需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不會**符合。頻道查詢預設以 ID 優先，因此以名稱為基礎的鍵永遠無法成功路由，該頻道中的所有訊息都會被靜默封鎖。這不同於 `groupPolicy: "open"`；在該模式下，路由不需要頻道鍵，而以名稱為基礎的鍵看起來會正常運作。

    一律使用 Slack 頻道 ID 作為鍵。尋找方式：在 Slack 中右鍵點選頻道 → **Copy link** — ID（`C...`）會出現在 URL 結尾。

    正確：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    不正確（在 `groupPolicy: "allowlist"` 下會被靜默封鎖）：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    頻道訊息預設受提及 gate 控制。

    提及來源：  

    - 明確的 app 提及（`<@botId>`）
    - 提及正則表達式模式（`agents.list[].groupChat.mentionPatterns`，後備為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆給機器人討論串行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    每頻道控制項（`channels.slack.channels.<id>`；名稱只能透過啟動時解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 鍵格式：`id:`、`e164:`、`username:`、`name:`，或 `"*"` 萬用字元
      （舊版未加前綴的鍵仍只會對應到 `id:`）

    `allowBots` 對頻道和私人頻道採保守處理：只有在傳送機器人已明確列在該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少有一個明確的 Slack 擁有者 ID 目前是聊天室成員時，才會接受由機器人撰寫的聊天室訊息。萬用字元和顯示名稱擁有者項目不符合擁有者在場條件。擁有者在場狀態使用 Slack `conversations.members`；請確認 app 具備該聊天室類型對應的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查詢失敗，OpenClaw 會捨棄由機器人撰寫的聊天室訊息。

  </Tab>
</Tabs>

## 討論串、工作階段與回覆標籤

- 私訊會路由為 `direct`；頻道為 `channel`；MPIM 為 `group`。
- 使用預設 `session.dmScope=main` 時，Slack 私訊會摺疊到代理程式的主工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 討論串回覆可在適用時建立討論串工作階段尾碼（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新討論串工作階段啟動時擷取多少既有討論串訊息（預設 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設 `false`）：當為 `true` 時，會抑制隱含的討論串提及，因此即使機器人已參與該討論串，機器人也只會回應討論串內明確的 `@bot` 提及。若未啟用此設定，機器人已參與討論串中的回覆會略過 `requireMention` 閘控。

回覆討論串控制項：

- `channels.slack.replyToMode`：`off|first|all|batched`（預設 `off`）
- `channels.slack.replyToModeByChatType`：依 `direct|group|channel` 設定
- 直接聊天的舊版後備：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 會停用 Slack 中的**所有**回覆討論串，包括明確的 `[[reply_to_*]]` 標籤。這與 Telegram 不同，Telegram 在 `"off"` 模式下仍會遵循明確標籤。Slack 討論串會將訊息從頻道中隱藏，而 Telegram 回覆仍會以內嵌方式顯示。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理程式身分 emoji 後備（`agents.list[].identity.emoji`，否則為 "👀"）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可停用該 Slack 帳戶或全域的反應。

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊預覽更新。
- `progress`：產生時顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：當草稿預覽啟用時，將工具/進度更新路由到同一個已編輯的預覽訊息（預設：`true`）。設為 `false` 可保留獨立的工具/進度訊息。

當 `channels.slack.streaming.mode` 為 `partial` 時，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文字串流（預設：`true`）。

- 必須有可用的回覆討論串，才會顯示原生文字串流和 Slack 助理討論串狀態。討論串選擇仍會遵循 `replyToMode`。
- 當原生串流不可用時，頻道和群組聊天根訊息仍可使用一般草稿預覽。
- 頂層 Slack 私訊預設不在討論串中，因此不會顯示討論串樣式的預覽；若想在該處顯示可見進度，請使用討論串回覆或 `typingReaction`。
- 媒體和非文字酬載會後備為一般傳送。
- 媒體/錯誤最終訊息會取消待處理的預覽編輯；符合資格的文字/區塊最終訊息只有在可就地編輯預覽時才會刷新。
- 如果串流在回覆途中失敗，OpenClaw 會對剩餘酬載後備為一般傳送。

使用草稿預覽，而不是 Slack 原生文字串流：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

舊版鍵：

- `channels.slack.streamMode`（`replace | status_final | append`）會自動遷移到 `channels.slack.streaming.mode`。
- 布林值 `channels.slack.streaming` 會自動遷移到 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport`。
- 舊版 `channels.slack.nativeStreaming` 會自動遷移到 `channels.slack.streaming.nativeTransport`。

## 輸入中反應後備

`typingReaction` 會在 OpenClaw 處理回覆時，將暫時反應加入傳入的 Slack 訊息，並在執行完成時移除。這在討論串回覆之外最有用，因為討論串回覆會使用預設的「正在輸入...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 反應採盡力而為，且會在回覆或失敗路徑完成後自動嘗試清理。

## 媒體、分塊與傳送

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私人 URL 下載（經權杖驗證的請求流程），並在擷取成功且大小限制允許時寫入媒體儲存區。檔案預留位置會包含 Slack `fileId`，因此代理程式可使用 `download-file` 擷取原始檔案。

    下載會使用有界限的閒置與總逾時。如果 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並後備為檔案預留位置。

    執行階段的傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字與檔案">
    - 文字片段使用 `channels.slack.textChunkLimit`（預設 4000）
    - `channels.slack.chunkMode="newline"` 啟用段落優先分割
    - 檔案傳送使用 Slack 上傳 API，並可包含討論串回覆（`thread_ts`）
    - 傳出媒體上限在已設定時遵循 `channels.slack.mediaMaxMb`；否則，頻道傳送會使用媒體管線中的 MIME 種類預設值

  </Accordion>

  <Accordion title="傳送目標">
    建議使用明確目標：

    - `user:<id>` 用於 DM
    - `channel:<id>` 用於頻道

    傳送至使用者目標時，Slack DM 會透過 Slack conversation API 開啟。

  </Accordion>
</AccordionGroup>

## 指令與斜線行為

斜線指令在 Slack 中會顯示為單一已設定指令或多個原生指令。設定 `channels.slack.slashCommand` 以變更指令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生指令需要在你的 Slack app 中加入[額外 manifest 設定](#additional-manifest-settings)，並改由 `channels.slack.commands.native: true` 啟用，或在全域設定中使用 `commands.native: true` 啟用。

- Slack 的原生指令自動模式為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生指令。

```txt
/help
```

原生引數選單使用自適應轉譯策略，會在分派所選選項值之前顯示確認 modal：

- 最多 5 個選項：按鈕區塊
- 6-100 個選項：靜態選取選單
- 超過 100 個選項：當 interactivity options handler 可用時，使用具備非同步選項篩選的外部選取
- 超過 Slack 限制：編碼後的選項值會退回使用按鈕

```txt
/think
```

斜線 session 使用像 `agent:<agentId>:slack:slash:<userId>` 這樣的隔離 key，並仍透過 `CommandTargetSessionKey` 將指令執行路由至目標對話 session。

## 互動式回覆

Slack 可以轉譯由代理程式撰寫的互動式回覆控制項，但此功能預設停用。

全域啟用：

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

或只為一個 Slack 帳戶啟用：

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

啟用後，代理程式可以發出僅適用於 Slack 的回覆指示：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指示會編譯為 Slack Block Kit，並透過現有的 Slack 互動事件路徑路由點擊或選取。

注意事項：

- 這是 Slack 專屬 UI。其他頻道不會將 Slack Block Kit 指示轉譯為自己的按鈕系統。
- 互動式 callback 值是 OpenClaw 產生的不透明 token，而不是代理程式撰寫的原始值。
- 如果產生的互動式區塊會超過 Slack Block Kit 限制，OpenClaw 會退回原始文字回覆，而不是傳送無效的 blocks payload。

## Slack 中的 exec 核准

Slack 可以作為具備互動式按鈕與互動的原生核准用戶端，而不是退回 Web UI 或終端機。

- Exec 核准使用 `channels.slack.execApprovals.*` 進行原生 DM/頻道路由。
- 當請求已經送達 Slack 且核准 id kind 為 `plugin:` 時，Plugin 核准仍可透過同一個 Slack 原生按鈕介面解析。
- 核准者授權仍會強制執行：只有被識別為核准者的使用者可以透過 Slack 核准或拒絕請求。

這會使用與其他頻道相同的共用核准按鈕介面。當你的 Slack app 設定中啟用 `interactivity` 時，核准提示會在對話中直接轉譯為 Block Kit 按鈕。
當這些按鈕存在時，它們就是主要的核准 UX；OpenClaw
只有在工具結果表示聊天核准不可用，或手動核准是唯一路徑時，
才應包含手動 `/approve` 指令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時退回 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`, `sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少解析出一位
核准者時，Slack 會自動啟用原生 exec 核准。設定 `enabled: false` 可明確停用 Slack 作為原生核准用戶端。
設定 `enabled: true` 可在核准者解析成功時強制開啟原生核准。

未明確設定 Slack exec 核准時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想要覆寫核准者、加入篩選器，或
選擇使用來源聊天傳送時，才需要明確的 Slack 原生設定：

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

共用的 `approvals.exec` 轉送是分開的。只有當 exec 核准提示也必須
路由到其他聊天或明確的頻外目標時才使用它。共用的 `approvals.plugin` 轉送也是
分開的；當這些請求已經送達 Slack 時，Slack 原生按鈕仍可解析 Plugin 核准。

同一聊天中的 `/approve` 也可在已支援指令的 Slack 頻道與 DM 中使用。完整核准轉送模型請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯/刪除會對應為系統事件。
- 討論串廣播（「同時傳送到頻道」的討論串回覆）會作為一般使用者訊息處理。
- reaction 新增/移除事件會對應為系統事件。
- 成員加入/離開、頻道建立/重新命名，以及釘選新增/移除事件會對應為系統事件。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定 key。
- 頻道 topic/purpose metadata 會被視為不受信任的 context，並可注入路由 context。
- 討論串起始訊息與初始討論串歷史 context seed 會在適用時依設定的 sender allowlist 篩選。
- 區塊動作與 modal 互動會發出結構化的 `Slack interaction: ...` 系統事件，並包含豐富的 payload 欄位：
  - 區塊動作：選取值、標籤、picker 值，以及 `workflow_*` metadata
  - modal `view_submission` 與 `view_closed` 事件，包含已路由的頻道 metadata 與表單輸入

## 設定參考

主要參考：[設定參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM access: `dm.enabled`, `dmPolicy`, `allowFrom`（舊版：`dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- compatibility toggle: `dangerouslyAllowNameMatching`（break-glass；除非需要，否則保持關閉）
- channel access: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    依序檢查：

    - `groupPolicy`
    - 頻道 allowlist（`channels.slack.channels`）— **key 必須是頻道 ID**（`C12345678`），不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，名稱式 key 會靜默失敗，因為頻道路由預設以 ID 優先。若要尋找 ID：在 Slack 中對頻道按右鍵 → **Copy link** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 每個頻道的 `users` allowlist

    實用指令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM 訊息被忽略">
    檢查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或舊版 `channels.slack.dm.policy`）
    - pairing 核准 / allowlist 項目
    - Slack Assistant DM 事件：提到 `drop message_changed` 的詳細記錄
      通常表示 Slack 傳送了一個已編輯的 Assistant-thread 事件，但訊息 metadata 中
      沒有可復原的人類傳送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode 未連線">
    在 Slack app 設定中驗證 bot + app token 與 Socket Mode 啟用狀態。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳戶已設定，
    但目前執行階段無法解析由 SecretRef 支援的
    值。

  </Accordion>

  <Accordion title="HTTP mode 未接收事件">
    驗證：

    - signing secret
    - webhook path
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳戶使用唯一的 `webhookPath`

    如果帳戶 snapshot 中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳戶已設定，但目前執行階段無法
    解析由 SecretRef 支援的 signing secret。

  </Accordion>

  <Accordion title="原生/斜線指令未觸發">
    確認你原本想使用的是：

    - 原生指令模式（`channels.slack.commands.native: true`），並在 Slack 中註冊相符的斜線指令
    - 或單一斜線指令模式（`channels.slack.slashCommand.enabled: true`）

    同時檢查 `commands.useAccessGroups` 與頻道/使用者 allowlist。

  </Accordion>
</AccordionGroup>

## 附件視覺參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可以將下載的媒體附加到代理程式 turn。圖片檔可以透過媒體理解路徑傳遞，或直接傳給支援視覺的回覆模型；其他檔案會保留為可下載的檔案 context，而不是被視為圖片輸入。

### 支援的媒體類型

| 媒體類型                       | 來源                 | 目前行為                                                                          | 注意事項                                                                  |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 圖片   | Slack file URL       | 下載並附加到 turn，以便支援視覺的處理                                             | 每檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                    |
| PDF 檔案                       | Slack file URL       | 下載並公開為工具（例如 `download-file` 或 `pdf`）可用的檔案 context               | Slack 傳入不會自動將 PDF 轉換為圖片視覺輸入                              |
| 其他檔案                       | Slack file URL       | 可行時下載並公開為檔案 context                                                    | 二進位檔案不會被視為圖片輸入                                              |
| 討論串回覆                     | 討論串起始檔案       | 當回覆沒有直接媒體時，根訊息檔案可 hydrated 為 context                            | 只有檔案的起始訊息會使用附件 placeholder                                  |
| 多圖片訊息                     | 多個 Slack 檔案      | 每個檔案會獨立評估                                                                | Slack 處理每則訊息最多八個檔案                                            |

### 傳入管線

當含有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 會使用機器人權杖（`xoxb-...`）從 Slack 的私人 URL 下載檔案。
2. 成功後，檔案會寫入媒體儲存區。
3. 下載的媒體路徑與內容類型會加入傳入內容脈絡。
4. 支援影像的模型/工具路徑可以使用該內容脈絡中的影像附件。
5. 非影像檔案仍會以檔案中繼資料或媒體參照的形式提供給能處理它們的工具。

### 執行緒根附件繼承

當訊息抵達執行緒中（具有 `thread_ts` 父層）時：

- 如果回覆本身沒有直接媒體，而包含的根訊息有檔案，Slack 可以將根檔案補齊為執行緒起始內容脈絡。
- 直接回覆附件優先於根訊息附件。
- 只有檔案而沒有文字的根訊息會以附件佔位符表示，因此備援仍可包含其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體管線獨立處理。
- 下載的媒體參照會彙整到訊息內容脈絡中。
- 處理順序會遵循事件承載中的 Slack 檔案順序。
- 單一附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：預設每個檔案 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、超大檔案，以及 Slack 驗證/登入 HTML 回應都會被略過，而不是回報為不支援的格式。
- **視覺模型**：影像分析會在作用中的回覆模型支援視覺時使用該模型，或使用在 `agents.defaults.imageModel` 設定的影像模型。

### 已知限制

| 情境                                   | 目前行為                                                               | 替代做法                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 過期的 Slack 檔案 URL                  | 檔案被略過；不顯示錯誤                                                 | 在 Slack 重新上傳檔案                                                      |
| 未設定視覺模型                         | 影像附件會儲存為媒體參照，但不會作為影像分析                           | 設定 `agents.defaults.imageModel`，或使用支援視覺的回覆模型                |
| 非常大的影像（預設 > 20 MB）           | 依大小上限略過                                                         | 如果 Slack 允許，增加 `channels.slack.mediaMaxMb`                          |
| 轉寄/分享的附件                        | 文字與 Slack 代管的影像/檔案媒體會盡力處理                             | 直接在 OpenClaw 執行緒中重新分享                                           |
| PDF 附件                               | 儲存為檔案/媒體內容脈絡，不會自動透過影像視覺路由處理                  | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具進行 PDF 分析      |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [PDF 工具](/zh-TW/tools/pdf)
- Epic：[#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件視覺啟用
- 迴歸測試：[#51353](https://github.com/openclaw/openclaw/issues/51353)
- 即時驗證：[#51354](https://github.com/openclaw/openclaw/issues/51354)

## 相關

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    將 Slack 使用者配對到 Gateway。
  </Card>
  <Card title="Groups" icon="users" href="/zh-TW/channels/groups">
    頻道與群組私訊行為。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理。
  </Card>
  <Card title="Security" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="Configuration" icon="sliders" href="/zh-TW/gateway/configuration">
    設定版面配置與優先順序。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    指令目錄與行為。
  </Card>
</CardGroup>
