---
read_when:
    - 設定 Slack 或偵錯 Slack 通訊端/HTTP 模式
summary: Slack 設定與執行階段行為（Socket 模式 + HTTP 請求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

可透過 Slack app 整合在 DM 和頻道中用於生產環境。預設模式為 Socket Mode；也支援 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Slack DM 預設使用配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復教戰手冊。
  </Card>
</CardGroup>

## 快速設定

<Tabs>
  <Tab title="Socket Mode（預設）">
    <Steps>
      <Step title="建立新的 Slack app">
        在 Slack app 設定中按下 **[Create New App](https://api.slack.com/apps/new)** 按鈕：

        - 選擇 **from a manifest**，並為你的 app 選取工作區
        - 貼上下面的[範例 manifest](#manifest-and-scope-checklist)，並繼續建立
        - 產生具有 `connections:write` 的 **App-Level Token**（`xapp-...`）
        - 安裝 app，並複製顯示的 **Bot Token**（`xoxb-...`）

      </Step>

      <Step title="設定 OpenClaw">

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

        環境變數備援（僅預設帳號）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="啟動 Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="建立新的 Slack app">
        在 Slack app 設定中按下 **[Create New App](https://api.slack.com/apps/new)** 按鈕：

        - 選擇 **from a manifest**，並為你的 app 選取工作區
        - 貼上[範例 manifest](#manifest-and-scope-checklist)，並在建立前更新 URL
        - 儲存用於請求驗證的 **Signing Secret**
        - 安裝 app，並複製顯示的 **Bot Token**（`xoxb-...`）

      </Step>

      <Step title="設定 OpenClaw">

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
        為多帳號 HTTP 使用唯一的 webhook 路徑

        為每個帳號指定不同的 `webhookPath`（預設為 `/slack/events`），避免註冊發生衝突。
        </Note>

      </Step>

      <Step title="啟動 Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 傳輸調校

OpenClaw 預設會將 Socket Mode 的 Slack SDK 用戶端 pong 逾時設為 15 秒。只有在需要針對工作區或主機進行特定調校時，才覆寫傳輸設定：

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

僅在記錄 Slack websocket pong/server-ping 逾時，或執行於已知有事件迴圈飢餓問題主機的 Socket Mode 工作區使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。App 訊息和事件仍是應用程式狀態，而不是傳輸存活性訊號。

## Manifest 與 scope 檢查清單

Socket Mode 和 HTTP Request URLs 使用相同的基礎 Slack app manifest。只有 `settings` 區塊（以及斜線指令的 `url`）不同。

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
        "usergroups:read",
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

若使用 **HTTP Request URLs 模式**，請將 `settings` 替換為 HTTP 版本，並在每個斜線指令新增 `url`。需要公開 URL：

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

顯示可擴充上述預設值的不同功能。

預設 manifest 會啟用 Slack App Home 的 **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會使用 `views.publish` 發布安全的預設 Home 檢視；其中不包含對話承載資料或私人設定。Slack DM 仍會啟用 **Messages** 分頁。

<AccordionGroup>
  <Accordion title="選用的原生斜線指令">

    可使用多個[原生斜線指令](#commands-and-slash-behavior)取代單一設定命令，但需注意細節：

    - 使用 `/agentstatus` 而不是 `/status`，因為 `/status` 命令已被保留。
    - 一次最多可提供 25 個斜線指令。

    將現有的 `features.slash_commands` 區段替換為[可用命令](/zh-TW/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode（預設）">

```json
{
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用上方與 Socket Mode 相同的 `slash_commands` 清單，並在每個項目新增 `"url": "https://gateway-host.example.com/slack/events"`。範例：

```json
{
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
  ]
}
```

        在清單中的每個命令重複使用該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用作者身分範圍（寫入操作）">
    如果你希望傳出訊息使用作用中的代理身分（自訂使用者名稱和圖示），而不是預設的 Slack 應用程式身分，請新增 `chat:write.customize` 機器人範圍。

    如果使用表情符號圖示，Slack 會要求使用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，典型的讀取範圍為：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依賴 Slack 搜尋讀取）

  </Accordion>
</AccordionGroup>

## 權杖模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定權杖會覆寫 env 備援。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env 備援只套用於預設帳戶。
- `userToken` (`xoxp-...`) 僅能透過設定提供（沒有 env 備援），並預設為唯讀行為 (`userTokenReadOnly: true`)。

狀態快照行為：

- Slack 帳戶檢查會追蹤每個憑證的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳戶是透過 SecretRef
  或另一個非內嵌祕密來源設定，但目前的命令/執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要配對是 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作/目錄讀取，設定後可以優先使用使用者權杖。對於寫入，仍會優先使用機器人權杖；只有在 `userTokenReadOnly: false` 且機器人權杖不可用時，才允許使用者權杖寫入。
</Tip>

## 動作與閘門

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組       | 預設 |
| ---------- | ---- |
| messages   | 啟用 |
| reactions  | 啟用 |
| pins       | 啟用 |
| memberInfo | 啟用 |
| emojiList  | 啟用 |

目前 Slack 訊息動作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受傳入檔案預留位置中顯示的 Slack 檔案 ID，並會對圖片傳回圖片預覽，或對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.slack.dmPolicy` 控制 DM 存取。`channels.slack.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    DM 旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組 DM 預設為 false）
    - `dm.groupChannels`（選用 MPIM 允許清單）

    多帳戶優先順序：

    - `channels.slack.accounts.default.allowFrom` 只套用於 `default` 帳戶。
    - 具名帳戶在自己的 `allowFrom` 未設定時，會繼承 `channels.slack.allowFrom`。
    - 具名帳戶不會繼承 `channels.slack.accounts.default.allowFrom`。

    舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍會讀取以維持相容性。`openclaw doctor --fix` 會在不變更存取權的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    DM 中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 底下，且**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）作為設定鍵。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅 env 設定），執行階段會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱/ID 解析：

    - 當權杖存取允許時，會在啟動時解析頻道允許清單項目和 DM 允許清單項目
    - 未解析的頻道名稱項目會保留原設定，但預設會在路由時忽略
    - 傳入授權和頻道路由預設以 ID 優先；直接使用者名稱/slug 比對需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不會**符合。頻道查找預設以 ID 優先，因此以名稱為基礎的鍵永遠無法成功路由，該頻道中的所有訊息都會被靜默封鎖。這與 `groupPolicy: "open"` 不同，後者不需要頻道鍵即可路由，因此以名稱為基礎的鍵看起來會生效。

    請一律使用 Slack 頻道 ID 作為鍵。查找方式：在 Slack 中以滑鼠右鍵點選頻道 → **複製連結** — ID (`C...`) 會出現在 URL 末尾。

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
    頻道訊息預設會受到提及門檻控管。

    提及來源：

    - 明確的應用程式提及（`<@botId>`）
    - Slack 使用者群組提及（`<!subteam^S...>`），當 Bot 使用者是該使用者群組成員時適用；需要 `usergroups:read`
    - 提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆 Bot 執行緒行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    各頻道控制項（`channels.slack.channels.<id>`；名稱只能透過啟動時解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 鍵格式：`id:`, `e164:`, `username:`, `name:` 或 `"*"` 萬用字元
      （舊版無前綴鍵仍只會對應至 `id:`）

    `allowBots` 對頻道和私人頻道採保守策略：Bot 撰寫的聊天室訊息只有在傳送該訊息的 Bot 明確列在該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少有一個明確 Slack 擁有者 ID 目前是聊天室成員時，才會被接受。萬用字元和顯示名稱擁有者項目不符合擁有者存在條件。擁有者存在檢查使用 Slack `conversations.members`；請確認應用程式具有該聊天室類型對應的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查詢失敗，OpenClaw 會丟棄 Bot 撰寫的聊天室訊息。

  </Tab>
</Tabs>

## 執行緒、工作階段與回覆標籤

- DM 路由為 `direct`；頻道為 `channel`；MPIM 為 `group`。
- Slack 路由繫結接受原始對等 ID，以及 Slack 目標形式，例如 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>`。
- 使用預設 `session.dmScope=main` 時，Slack DM 會收斂到代理的主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 適用時，執行緒回覆可以建立執行緒工作階段後綴（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新執行緒工作階段啟動時要擷取多少則既有執行緒訊息（預設 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設 `false`）：當為 `true` 時，抑制隱含執行緒提及，因此 Bot 只會回應執行緒內明確的 `@bot` 提及，即使 Bot 已經參與該執行緒也是如此。若未啟用此設定，在 Bot 已參與的執行緒中的回覆會略過 `requireMention` 門檻控管。

回覆執行緒控制項：

- `channels.slack.replyToMode`: `off|first|all|batched`（預設 `off`）
- `channels.slack.replyToModeByChatType`：依 `direct|group|channel` 設定
- 直接聊天的舊版後援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 會停用 Slack 中的**所有**回覆執行緒，包括明確的 `[[reply_to_*]]` 標籤。這與 Telegram 不同；在 Telegram 中，即使處於 `"off"` 模式，明確標籤仍會被遵循。Slack 執行緒會將訊息隱藏於頻道之外，而 Telegram 回覆則維持行內可見。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理身分 emoji 後援（`agents.list[].identity.emoji`，否則為 "👀"）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可針對 Slack 帳號或全域停用反應。

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：用最新的部分輸出取代預覽文字。
- `block`：附加分塊預覽更新。
- `progress`：產生時顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：當草稿預覽啟用時，將工具/進度更新路由到同一則已編輯的預覽訊息（預設：`true`）。設為 `false` 可保留獨立的工具/進度訊息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：設為 `status` 可在隱藏原始 command/exec 文字時保留精簡的工具進度行（預設：`raw`）。

隱藏原始 command/exec 文字，同時保留精簡進度行：

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` 會在 `channels.slack.streaming.mode` 為 `partial` 時控制 Slack 原生文字串流（預設：`true`）。

- 必須有可用的回覆執行緒，原生文字串流和 Slack 助理執行緒狀態才會出現。執行緒選取仍遵循 `replyToMode`。
- 當原生串流無法使用或沒有回覆執行緒時，頻道、群組聊天和頂層 DM 根訊息仍可使用一般草稿預覽。
- 頂層 Slack DM 預設不進入執行緒，因此不會顯示 Slack 執行緒樣式的原生串流/狀態預覽；OpenClaw 會改在 DM 中發布並編輯草稿預覽。
- 媒體和非文字承載會後援為一般傳遞。
- 媒體/錯誤最終訊息會取消待處理的預覽編輯；符合條件的文字/block 最終訊息只有在能就地編輯預覽時才會清空送出。
- 如果串流在回覆中途失敗，OpenClaw 會對剩餘承載後援為一般傳遞。

使用草稿預覽而非 Slack 原生文字串流：

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

## 輸入反應後援

`typingReaction` 會在 OpenClaw 處理回覆期間，為傳入的 Slack 訊息加上暫時反應，並在執行完成時移除。這在 thread 回覆以外最有用，因為 thread 回覆會使用預設的「is typing...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 反應會盡力處理，並在回覆或失敗路徑完成後自動嘗試清理。

## 媒體、分塊與傳遞

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私有 URL 下載（token 驗證請求流程），並在擷取成功且大小限制允許時寫入媒體儲存區。檔案預留位置包含 Slack `fileId`，讓 agent 可用 `download-file` 擷取原始檔案。

    下載使用有界限的閒置與總逾時。如果 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並回退到檔案預留位置。

    執行階段的傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字與檔案">
    - 文字分塊使用 `channels.slack.textChunkLimit`（預設 4000）
    - `channels.slack.chunkMode="newline"` 會啟用段落優先分割
    - 檔案傳送使用 Slack 上傳 API，並可包含 thread 回覆（`thread_ts`）
    - 傳出媒體上限在設定時遵循 `channels.slack.mediaMaxMb`；否則 channel 傳送會使用媒體管線中的 MIME 種類預設值

  </Accordion>

  <Accordion title="傳遞目標">
    建議使用明確目標：

    - `user:<id>` 用於 DM
    - `channel:<id>` 用於 channel

    僅文字/區塊的 Slack DM 可直接發佈到使用者 ID；檔案上傳與 thread 傳送會先透過 Slack conversation API 開啟 DM，因為這些路徑需要具體的 conversation ID。

  </Accordion>
</AccordionGroup>

## 指令與 slash 行為

Slash commands 在 Slack 中可顯示為單一已設定指令或多個原生指令。設定 `channels.slack.slashCommand` 以變更指令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生指令需要在你的 Slack app 中設定[其他 manifest 設定](#additional-manifest-settings)，並改用 `channels.slack.commands.native: true` 啟用，或在全域設定中使用 `commands.native: true`。

- Slack 的原生指令自動模式為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生指令。

```txt
/help
```

原生引數選單使用自適應呈現策略，會在分派所選選項值前顯示確認 modal：

- 最多 5 個選項：button blocks
- 6-100 個選項：static select menu
- 超過 100 個選項：在 interactivity options handlers 可用時，使用 external select 搭配非同步選項篩選
- 超過 Slack 限制：已編碼的選項值會回退為按鈕

```txt
/think
```

Slash sessions 使用像 `agent:<agentId>:slack:slash:<userId>` 這樣的隔離 key，且仍會使用 `CommandTargetSessionKey` 將指令執行路由到目標 conversation session。

## 互動式回覆

Slack 可以呈現 agent 撰寫的互動式回覆控制項，但此功能預設停用。

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

啟用後，agent 可以發出僅限 Slack 的回覆指示：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指示會編譯為 Slack Block Kit，並透過既有 Slack interaction event 路徑把點擊或選取路由回來。

注意事項：

- 這是 Slack 專用 UI。其他 channel 不會將 Slack Block Kit 指示轉譯為自己的按鈕系統。
- 互動式 callback 值是 OpenClaw 產生的不透明 token，不是 agent 撰寫的原始值。
- 如果產生的互動式 blocks 會超過 Slack Block Kit 限制，OpenClaw 會回退為原始文字回覆，而不是傳送無效的 blocks payload。

## Slack 中的 Exec 核准

Slack 可作為具有互動式按鈕與互動的原生核准用戶端，而不是回退到 Web UI 或 terminal。

- Exec 核准使用 `channels.slack.execApprovals.*` 進行原生 DM/channel 路由。
- 當請求已落在 Slack 中且核准 id 種類為 `plugin:` 時，Plugin 核准仍可透過相同的 Slack 原生按鈕介面解析。
- 核准者授權仍會強制執行：只有識別為核准者的使用者可透過 Slack 核准或拒絕請求。

這會使用與其他 channel 相同的共用核准按鈕介面。當你的 Slack app 設定中啟用 `interactivity` 時，核准提示會在 conversation 中直接呈現為 Block Kit 按鈕。
當這些按鈕存在時，它們就是主要核准 UX；OpenClaw
只有在工具結果表示聊天核准不可用，或手動核准是唯一路徑時，
才應包含手動 `/approve` 指令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`、`sessionFilter`

當 `enabled` 未設定或為 `"auto"` 且至少解析出一位
核准者時，Slack 會自動啟用原生 exec 核准。設定 `enabled: false` 可明確停用 Slack 作為原生核准用戶端。
設定 `enabled: true` 可在解析出核准者時強制啟用原生核准。

沒有明確 Slack exec 核准設定時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆寫核准者、新增篩選器，或
選擇加入來源聊天傳遞時，才需要明確的 Slack 原生設定：

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

共用 `approvals.exec` 轉送是分開的。只有當 exec 核准提示也必須
路由到其他聊天或明確的頻外目標時才使用它。共用 `approvals.plugin` 轉送也
是分開的；當這些請求已落在 Slack 中時，Slack 原生按鈕仍可解析 Plugin 核准。

同一聊天中的 `/approve` 也可在已支援指令的 Slack channel 與 DM 中運作。完整核准轉送模型請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯/刪除會映射為 system events。
- Thread broadcasts（「Also send to channel」thread 回覆）會作為一般使用者訊息處理。
- Reaction add/remove events 會映射為 system events。
- Member join/leave、channel created/renamed，以及 pin add/remove events 會映射為 system events。
- 啟用 `configWrites` 時，`channel_id_changed` 可遷移 channel config keys。
- Channel topic/purpose metadata 會被視為不受信任的上下文，且可注入 routing context。
- 適用時，thread starter 與初始 thread-history context seeding 會依設定的 sender allowlists 篩選。
- Block actions 與 modal interactions 會發出結構化的 `Slack interaction: ...` system events，並帶有豐富的 payload fields：
  - block actions：selected values、labels、picker values，以及 `workflow_*` metadata
  - modal `view_submission` 與 `view_closed` events，包含已路由的 channel metadata 與 form inputs

## 設定參考

主要參考：[Configuration reference - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- mode/auth：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM access：`dm.enabled`、`dmPolicy`、`allowFrom`（舊版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- compatibility toggle：`dangerouslyAllowNameMatching`（break-glass；除非需要，否則保持關閉）
- channel access：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- threading/history：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- delivery：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- ops/features：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="Channel 中沒有回覆">
    依序檢查：

    - `groupPolicy`
    - channel allowlist（`channels.slack.channels`）— **key 必須是 channel ID**（`C12345678`），不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，以名稱為基礎的 key 會靜默失敗，因為 channel 路由預設是 ID 優先。若要尋找 ID：在 Slack 中以右鍵點選 channel → **Copy link** — URL 結尾的 `C...` 值就是 channel ID。
    - `requireMention`
    - 每個 channel 的 `users` allowlist

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
    - pairing approvals / allowlist entries
    - Slack Assistant DM events：提到 `drop message_changed` 的 verbose logs
      通常表示 Slack 傳送了已編輯的 Assistant-thread event，但 message metadata 中沒有
      可復原的人類 sender

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode 未連線">
    在 Slack app 設定中驗證 bot + app tokens 與 Socket Mode 啟用狀態。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳戶已設定，
    但目前 runtime 無法解析 SecretRef 支援的
    值。

  </Accordion>

  <Accordion title="HTTP mode 未收到事件">
    驗證：

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳戶唯一的 `webhookPath`

    如果 account snapshots 中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳戶已設定，但目前 runtime 無法
    解析 SecretRef 支援的 signing secret。

  </Accordion>

  <Accordion title="原生/slash 指令未觸發">
    確認你的意圖是：

    - 原生指令模式（`channels.slack.commands.native: true`），且 Slack 中已註冊相符的 slash commands
    - 或單一 slash command 模式（`channels.slack.slashCommand.enabled: true`）

    也請檢查 `commands.useAccessGroups` 與 channel/user allowlists。

  </Accordion>
</AccordionGroup>

## 附件 vision 參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可將下載的媒體附加到 agent turn。影像檔案可以透過媒體理解路徑傳遞，或直接傳給具 vision 能力的回覆模型；其他檔案會保留為可下載檔案上下文，而不是視為影像輸入。

### 支援的媒體類型

| 媒體類型                     | 來源               | 目前行為                                                                  | 備註                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 圖片 | Slack 檔案 URL       | 已下載並附加到該輪對話，以供具備視覺能力的處理使用                   | 每檔上限：`channels.slack.mediaMaxMb`（預設 20 MB）                 |
| PDF 檔案                      | Slack 檔案 URL       | 已下載並作為檔案內容提供給 `download-file` 或 `pdf` 等工具 | Slack 入站不會自動將 PDF 轉換為圖片視覺輸入 |
| 其他檔案                    | Slack 檔案 URL       | 可行時下載，並作為檔案內容提供                              | 二進位檔案不會被視為圖片輸入                               |
| 執行緒回覆                 | 執行緒起始訊息檔案 | 當回覆沒有直接媒體時，根訊息檔案可作為內容補足  | 僅含檔案的起始訊息會使用附件佔位符                          |
| 多圖片訊息           | 多個 Slack 檔案 | 每個檔案都會獨立評估                                              | Slack 處理上限為每則訊息八個檔案                     |

### 入站管線

當含有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 會使用機器人 Token（`xoxb-...`）從 Slack 的私人 URL 下載檔案。
2. 下載成功後，檔案會寫入媒體儲存區。
3. 已下載媒體的路徑與內容類型會加入入站內容。
4. 具備圖片能力的模型/工具路徑可以使用該內容中的圖片附件。
5. 非圖片檔案仍會以檔案中繼資料或媒體參照的形式，提供給能處理它們的工具。

### 執行緒根附件繼承

當訊息抵達某個執行緒時（具有 `thread_ts` 父項）：

- 如果回覆本身沒有直接媒體，而包含的根訊息有檔案，Slack 可以將根檔案補足為執行緒起始內容。
- 直接回覆附件優先於根訊息附件。
- 只有檔案且沒有文字的根訊息會以附件佔位符表示，使備援仍可包含其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體管線獨立處理。
- 已下載的媒體參照會彙總到訊息內容中。
- 處理順序會依照事件酬載中的 Slack 檔案順序。
- 某個附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：預設每個檔案 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、超過大小限制的檔案，以及 Slack 驗證/登入 HTML 回應會被略過，而不是回報為不支援的格式。
- **視覺模型**：圖片分析會在作用中的回覆模型支援視覺時使用該模型，否則使用 `agents.defaults.imageModel` 設定的圖片模型。

### 已知限制

| 情境                               | 目前行為                                                             | 因應方式                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 過期的 Slack 檔案 URL                 | 檔案被略過；不會顯示錯誤                                                 | 在 Slack 重新上傳檔案                                                |
| 未設定視覺模型            | 圖片附件會儲存為媒體參照，但不會作為圖片分析 | 設定 `agents.defaults.imageModel`，或使用具備視覺能力的回覆模型 |
| 非常大的圖片（預設 > 20 MB） | 依大小上限略過                                                         | 若 Slack 允許，增加 `channels.slack.mediaMaxMb`                       |
| 轉寄/共享附件           | 文字與 Slack 託管的圖片/檔案媒體會盡力處理                       | 直接在 OpenClaw 執行緒中重新分享                                   |
| PDF 附件                        | 儲存為檔案/媒體內容，不會自動路由至圖片視覺  | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具分析 PDF   |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [PDF 工具](/zh-TW/tools/pdf)
- Epic：[ #51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件視覺啟用
- 迴歸測試：[ #51353](https://github.com/openclaw/openclaw/issues/51353)
- 即時驗證：[ #51354](https://github.com/openclaw/openclaw/issues/51354)

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Slack 使用者與 Gateway 配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    頻道與群組 DM 行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將入站訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    設定版面配置與優先順序。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    命令目錄與行為。
  </Card>
</CardGroup>
