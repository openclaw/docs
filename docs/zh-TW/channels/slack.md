---
read_when:
    - 設定 Slack 或偵錯 Slack socket/HTTP 模式
summary: Slack 設定與執行階段行為（Socket Mode + HTTP 請求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-03T02:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

Production-ready for DMs and channels via Slack app integrations. Default mode is Socket Mode; HTTP Request URLs are also supported.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Slack DMs default to pairing mode.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    Native command behavior and command catalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    Cross-channel diagnostics and repair playbooks.
  </Card>
</CardGroup>

## Quick setup

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        In Slack app settings press the **[Create New App](https://api.slack.com/apps/new)** button:

        - choose **from a manifest** and select a workspace for your app
        - paste the [example manifest](#manifest-and-scope-checklist) from below and continue to create
        - generate an **App-Level Token** (`xapp-...`) with `connections:write`
        - install app and copy the **Bot Token** (`xoxb-...`) shown

      </Step>

      <Step title="Configure OpenClaw">

        Recommended SecretRef setup:

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

        Env fallback (default account only):

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
        In Slack app settings press the **[Create New App](https://api.slack.com/apps/new)** button:

        - choose **from a manifest** and select a workspace for your app
        - paste the [example manifest](#manifest-and-scope-checklist) and update the URLs before create
        - save the **Signing Secret** for request verification
        - install app and copy the **Bot Token** (`xoxb-...`) shown

      </Step>

      <Step title="Configure OpenClaw">

        Recommended SecretRef setup:

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
        Use unique webhook paths for multi-account HTTP

        Give each account a distinct `webhookPath` (default `/slack/events`) so registrations do not collide.
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

## Socket Mode transport tuning

OpenClaw sets the Slack SDK client pong timeout to 15 seconds by default for Socket Mode. Override the transport settings only when you need workspace- or host-specific tuning:

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

Use this only for Socket Mode workspaces that log Slack websocket pong/server-ping timeouts or run on hosts with known event-loop starvation. `clientPingTimeout` is the pong wait after the SDK sends a client ping; `serverPingTimeout` is the wait for Slack server pings. App messages and events remain application state, not transport liveness signals.

## Manifest and scope checklist

The base Slack app manifest is the same for Socket Mode and HTTP Request URLs. Only the `settings` block (and the slash command `url`) differs.

Base manifest (Socket Mode default):

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

For **HTTP Request URLs mode**, replace `settings` with the HTTP variant and add `url` to each slash command. Public URL required:

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

### Additional manifest settings

Surface different features that extend the above defaults.

The default manifest enables the Slack App Home **Home** tab and subscribes to `app_home_opened`. When a workspace member opens the Home tab, OpenClaw publishes a safe default Home view with `views.publish`; no conversation payload or private configuration is included. The **Messages** tab remains enabled for Slack DMs.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Multiple [native slash commands](#commands-and-slash-behavior) can be used instead of a single configured command with nuance:

    - Use `/agentstatus` instead of `/status` because the `/status` command is reserved.
    - No more than 25 slash commands can be made available at once.

    Replace your existing `features.slash_commands` section with a subset of [available commands](/zh-TW/tools/slash-commands#command-list):

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
        Use the same `slash_commands` list as Socket Mode above, and add `"url": "https://gateway-host.example.com/slack/events"` to every entry. Example:

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
    Add the `chat:write.customize` bot scope if you want outgoing messages to use the active agent identity (custom username and icon) instead of the default Slack app identity.

    If you use an emoji icon, Slack expects `:emoji_name:` syntax.

  </Accordion>
  <Accordion title="選用的 user-token 範圍（讀取操作）">
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
- `botToken`、`appToken`、`signingSecret` 與 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定中的權杖會覆寫 env 後備值。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env 後備值只適用於預設帳號。
- `userToken` (`xoxp-...`) 只能透過設定提供（沒有 env 後備值），且預設為唯讀行為 (`userTokenReadOnly: true`)。

狀態快照行為：

- Slack 帳號檢查會追蹤每個憑證的 `*Source` 與 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳號是透過 SecretRef
  或另一個非內嵌秘密來源設定，但目前的命令/執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要配對是 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作/目錄讀取，設定後可以優先使用使用者權杖。對於寫入，仍優先使用機器人權杖；只有在 `userTokenReadOnly: false` 且機器人權杖不可用時，才允許使用使用者權杖寫入。
</Tip>

## 動作與管控

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組       | 預設 |
| ---------- | ------- |
| messages   | 啟用 |
| reactions  | 啟用 |
| pins       | 啟用 |
| memberInfo | 啟用 |
| emojiList  | 啟用 |

目前的 Slack 訊息動作包含 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 與 `emoji-list`。`download-file` 接受入站檔案佔位符中顯示的 Slack 檔案 ID，並對圖片回傳圖片預覽，或對其他檔案類型回傳本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.slack.dmPolicy` 控制 DM 存取。`channels.slack.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    DM 旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組 DM 預設為 false）
    - `dm.groupChannels`（選用 MPIM 允許清單）

    多帳號優先順序：

    - `channels.slack.accounts.default.allowFrom` 只適用於 `default` 帳號。
    - 具名帳號在本身未設定 `allowFrom` 時，會繼承 `channels.slack.allowFrom`。
    - 具名帳號不會繼承 `channels.slack.accounts.default.allowFrom`。

    舊版 `channels.slack.dm.policy` 與 `channels.slack.dm.allowFrom` 仍會為相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的情況下，盡可能將它們遷移到 `dmPolicy` 與 `allowFrom`。

    DM 中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理方式：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 底下，且**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）作為設定鍵。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅使用 env 的設定），執行階段會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱/ID 解析：

    - 頻道允許清單項目與 DM 允許清單項目會在啟動時於權杖存取允許的情況下解析
    - 未解析的頻道名稱項目會維持原設定，但預設會在路由時忽略
    - 入站授權與頻道路由預設以 ID 優先；直接使用者名稱/slug 比對需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不會**比對。頻道查找預設以 ID 優先，因此以名稱為基礎的鍵永遠無法成功路由，該頻道中的所有訊息都會被靜默封鎖。這不同於 `groupPolicy: "open"`，後者不需要頻道鍵即可路由，而以名稱為基礎的鍵看起來會正常運作。

    一律使用 Slack 頻道 ID 作為鍵。尋找方式：在 Slack 中以滑鼠右鍵按一下頻道 → **複製連結** — ID (`C...`) 會出現在 URL 末尾。

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

    錯誤（在 `groupPolicy: "allowlist"` 下會被靜默封鎖）：

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

  <Tab title="提及與頻道使用者">
    頻道訊息預設受提及管控。

    提及來源：

    - 明確的應用程式提及 (`<@botId>`)
    - Slack 使用者群組提及 (`<!subteam^S...>`)，當機器人使用者是該使用者群組成員時適用；需要 `usergroups:read`
    - 提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，後備為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆機器人討論串行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    每個頻道的控制項（`channels.slack.channels.<id>`；名稱只能透過啟動解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 鍵格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 萬用字元
      （舊版未加前綴的鍵仍只會對應到 `id:`）

    `allowBots` 對頻道與私人頻道採保守策略：只有當傳送訊息的機器人明確列在該聊天室的 `users` 允許清單中，或當 `channels.slack.allowFrom` 中至少一個明確的 Slack 擁有者 ID 目前是聊天室成員時，才會接受機器人撰寫的聊天室訊息。萬用字元與顯示名稱擁有者項目不符合擁有者存在條件。擁有者存在狀態使用 Slack `conversations.members`；請確保應用程式具備符合該聊天室類型的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查找失敗，OpenClaw 會捨棄機器人撰寫的聊天室訊息。

  </Tab>
</Tabs>

## 討論串、工作階段與回覆標籤

- DM 會路由為 `direct`；頻道為 `channel`；MPIM 為 `group`。
- Slack 路由繫結接受原始對等 ID，以及 Slack 目標形式，例如 `channel:C12345678`、`user:U12345678` 與 `<@U12345678>`。
- 使用預設 `session.dmScope=main` 時，Slack DM 會收斂到代理程式主工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 適用時，討論串回覆可建立討論串工作階段後綴（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新討論串工作階段啟動時擷取多少現有討論串訊息（預設 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設 `false`）：當為 `true` 時，會抑制隱含討論串提及，因此即使機器人已參與該討論串，機器人也只會回應討論串內明確的 `@bot` 提及。若沒有此設定，機器人已參與討論串中的回覆會略過 `requireMention` 管控。

回覆討論串控制：

- `channels.slack.replyToMode`: `off|first|all|batched`（預設 `off`）
- `channels.slack.replyToModeByChatType`：依 `direct|group|channel` 設定
- 直接聊天的舊版後備值：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 會停用 Slack 中**所有**回覆討論串，包括明確的 `[[reply_to_*]]` 標籤。這不同於 Telegram，後者在 `"off"` 模式下仍會遵循明確標籤。Slack 討論串會將訊息從頻道中隱藏，而 Telegram 回覆會保持行內可見。
</Note>

## 確認表情反應

`ackReaction` 會在 OpenClaw 處理入站訊息時傳送確認 emoji。

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理程式身分 emoji 後備值（`agents.list[].identity.emoji`，否則為 "👀"）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可停用 Slack 帳號或全域的反應。

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊預覽更新。
- `progress`：產生期間顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：當草稿預覽啟用時，將工具/進度更新路由到同一則已編輯的預覽訊息中（預設：`true`）。設為 `false` 可保留獨立的工具/進度訊息。

當 `channels.slack.streaming.mode` 為 `partial` 時，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文字串流（預設：`true`）。

- 必須有可用的回覆討論串，才會顯示原生文字串流與 Slack 助理討論串狀態。討論串選擇仍遵循 `replyToMode`。
- 當原生串流不可用或沒有回覆討論串時，頻道、群組聊天與頂層 DM 根仍可使用一般草稿預覽。
- 頂層 Slack DM 預設保持在討論串外，因此不會顯示 Slack 討論串樣式的原生串流/狀態預覽；OpenClaw 會改為在 DM 中發布並編輯草稿預覽。
- 媒體與非文字 payload 會退回到一般傳遞。
- 媒體/錯誤最終訊息會取消待處理的預覽編輯；符合條件的文字/區塊最終訊息只有在能就地編輯預覽時才會清空待處理更新。
- 如果串流在回覆中途失敗，OpenClaw 會針對剩餘 payload 退回到一般傳遞。

使用草稿預覽，而非 Slack 原生文字串流：

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

- `channels.slack.streamMode` (`replace | status_final | append`) 會自動遷移到 `channels.slack.streaming.mode`。
- 布林值 `channels.slack.streaming` 會自動遷移到 `channels.slack.streaming.mode` 與 `channels.slack.streaming.nativeTransport`。
- 舊版 `channels.slack.nativeStreaming` 會自動遷移到 `channels.slack.streaming.nativeTransport`。

## 輸入中反應後備機制

`typingReaction` 會在 OpenClaw 處理回覆時，對入站 Slack 訊息新增暫時反應，並在執行完成時移除。這在討論串回覆之外最有用，因為討論串回覆會使用預設的「正在輸入...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 反應會盡力送出，且在回覆或失敗路徑完成後會自動嘗試清理。

## 媒體、分塊與傳遞

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私有 URL 下載（權杖驗證的請求流程），並在擷取成功且大小限制允許時寫入媒體儲存區。檔案預留位置包含 Slack `fileId`，因此代理可以使用 `download-file` 擷取原始檔案。

    下載會使用有界限的閒置與總逾時。如果 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並退回使用檔案預留位置。

    執行階段傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字和檔案">
    - 文字區塊使用 `channels.slack.textChunkLimit`（預設 4000）
    - `channels.slack.chunkMode="newline"` 啟用段落優先分割
    - 檔案傳送使用 Slack 上傳 API，且可包含討論串回覆（`thread_ts`）
    - 傳出媒體上限在已設定時遵循 `channels.slack.mediaMaxMb`；否則頻道傳送會使用媒體管線中的 MIME 種類預設值

  </Accordion>

  <Accordion title="傳遞目標">
    建議使用明確目標：

    - `user:<id>` 用於 DM
    - `channel:<id>` 用於頻道

    僅文字/區塊的 Slack DM 可以直接發佈到使用者 ID；檔案上傳和討論串傳送會先透過 Slack 對話 API 開啟 DM，因為這些路徑需要具體的對話 ID。

  </Accordion>
</AccordionGroup>

## 命令和斜線行為

斜線命令會在 Slack 中顯示為單一已設定命令或多個原生命令。設定 `channels.slack.slashCommand` 以變更命令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack 應用程式中設定[其他 manifest 設定](#additional-manifest-settings)，並改用 `channels.slack.commands.native: true` 啟用，或在全域設定中使用 `commands.native: true` 啟用。

- Slack 的原生命令自動模式為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生命令。

```txt
/help
```

原生引數選單使用自適應轉譯策略，會在派送所選選項值前顯示確認 modal：

- 最多 5 個選項：按鈕區塊
- 6-100 個選項：靜態選取選單
- 超過 100 個選項：當互動選項處理常式可用時，使用具非同步選項篩選的外部選取
- 超出 Slack 限制：已編碼的選項值退回使用按鈕

```txt
/think
```

斜線工作階段使用像 `agent:<agentId>:slack:slash:<userId>` 這樣的隔離金鑰，並仍會使用 `CommandTargetSessionKey` 將命令執行路由到目標對話工作階段。

## 互動式回覆

Slack 可以轉譯代理撰寫的互動式回覆控制項，但此功能預設停用。

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

啟用後，代理可以發出僅限 Slack 的回覆指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指令會編譯成 Slack Block Kit，並透過現有 Slack 互動事件路徑將點擊或選取路由回來。

注意事項：

- 這是 Slack 專屬 UI。其他頻道不會將 Slack Block Kit 指令轉譯為自身的按鈕系統。
- 互動 callback 值是 OpenClaw 產生的不透明權杖，而不是代理撰寫的原始值。
- 如果產生的互動區塊會超出 Slack Block Kit 限制，OpenClaw 會退回傳送原始文字回覆，而不是傳送無效的 blocks payload。

## Slack 中的 exec 核准

Slack 可以作為具備互動按鈕與互動的原生核准用戶端，而不是退回使用 Web UI 或終端機。

- Exec 核准使用 `channels.slack.execApprovals.*` 進行原生 DM/頻道路由。
- 當請求已經落在 Slack 中，且核准 ID 類型是 `plugin:` 時，Plugin 核准仍可透過相同的 Slack 原生按鈕介面解析。
- 仍會強制執行核准者授權：只有被識別為核准者的使用者可以透過 Slack 核准或拒絕請求。

這會使用與其他頻道相同的共用核准按鈕介面。在你的 Slack 應用程式設定中啟用 `interactivity` 時，核准提示會直接在對話中轉譯為 Block Kit 按鈕。
當這些按鈕存在時，它們是主要核准 UX；OpenClaw
只有在工具結果表示聊天核准不可用或手動核准是唯一途徑時，
才應包含手動 `/approve` 命令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時退回使用 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`, `sessionFilter`

當 `enabled` 未設定或為 `"auto"` 且至少解析出一位核准者時，Slack 會自動啟用原生 exec 核准。設定 `enabled: false` 可明確停用 Slack 作為原生核准用戶端。
設定 `enabled: true` 可在解析出核准者時強制開啟原生核准。

沒有明確 Slack exec 核准設定時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆寫核准者、加入篩選器，或選擇加入來源聊天傳遞時，才需要明確 Slack 原生設定：

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

共用 `approvals.exec` 轉送是獨立的。只有在 exec 核准提示也必須
路由到其他聊天或明確的頻外目標時才使用。共用 `approvals.plugin` 轉送也
是獨立的；當那些請求已經落在 Slack 中時，Slack 原生按鈕仍可解析 Plugin 核准。

同聊天 `/approve` 也適用於已支援命令的 Slack 頻道和 DM。完整核准轉送模型請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯/刪除會對應為系統事件。
- 討論串廣播（「同時傳送到頻道」的討論串回覆）會作為一般使用者訊息處理。
- 反應新增/移除事件會對應為系統事件。
- 成員加入/離開、頻道建立/重新命名，以及釘選新增/移除事件會對應為系統事件。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定金鑰。
- 頻道主題/用途中繼資料會被視為不受信任的情境，並可注入路由情境。
- 在適用時，討論串起始者與初始討論串歷史情境植入會依設定的傳送者允許清單篩選。
- 區塊動作和 modal 互動會發出結構化的 `Slack interaction: ...` 系統事件，並帶有豐富的 payload 欄位：
  - 區塊動作：所選值、標籤、選擇器值，以及 `workflow_*` 中繼資料
  - modal `view_submission` 和 `view_closed` 事件，包含已路由的頻道中繼資料和表單輸入

## 設定參考

主要參考：[設定參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- 模式/驗證：`mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 存取：`dm.enabled`, `dmPolicy`, `allowFrom`（舊版：`dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（緊急例外；除非需要，否則保持關閉）
- 頻道存取：`groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 討論串/歷史：`replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 傳遞：`textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 操作/功能：`configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **金鑰必須是頻道 ID**（`C12345678`），不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基於名稱的金鑰會靜默失敗，因為頻道路由預設以 ID 優先。若要尋找 ID：在 Slack 中以滑鼠右鍵按一下頻道 → **複製連結** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 每頻道 `users` 允許清單

    實用命令：

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
    - 配對核准 / 允許清單項目
    - Slack Assistant DM 事件：提到 `drop message_changed` 的詳細記錄
      通常表示 Slack 傳送了已編輯的 Assistant-thread 事件，但訊息中繼資料中
      沒有可復原的人類傳送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode 未連線">
    在 Slack 應用程式設定中驗證機器人 + 應用程式權杖，以及 Socket Mode 是否已啟用。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳戶已設定，
    但目前執行階段無法解析由 SecretRef 支援的值。

  </Accordion>

  <Accordion title="HTTP mode 未接收事件">
    驗證：

    - 簽署密鑰
    - Webhook 路徑
    - Slack 請求 URL（事件 + 互動 + 斜線命令）
    - 每個 HTTP 帳戶都有唯一的 `webhookPath`

    如果帳戶快照中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳戶已設定，但目前執行階段無法解析由 SecretRef 支援的簽署密鑰。

  </Accordion>

  <Accordion title="原生/斜線命令未觸發">
    確認你原本意圖使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），並在 Slack 中註冊相符的斜線命令
    - 或單一斜線命令模式（`channels.slack.slashCommand.enabled: true`）

    也請檢查 `commands.useAccessGroups` 和頻道/使用者允許清單。

  </Accordion>
</AccordionGroup>

## 附件視覺參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可以將下載的媒體附加到代理回合。影像檔案可以透過媒體理解路徑傳遞，或直接傳遞給具備視覺能力的回覆模型；其他檔案會保留為可下載檔案情境，而不是被視為影像輸入。

### 支援的媒體類型

| 媒體類型                       | 來源                 | 目前行為                                                                    | 備註                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 圖片 | Slack 檔案 URL       | 下載並附加到該回合，以供具備視覺能力的處理使用                             | 每個檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                  |
| PDF 檔案                       | Slack 檔案 URL       | 下載並作為檔案內容提供給 `download-file` 或 `pdf` 等工具使用               | Slack 入站不會自動將 PDF 轉換成圖片視覺輸入                              |
| 其他檔案                       | Slack 檔案 URL       | 可行時下載並作為檔案內容提供                                               | 二進位檔案不會被視為圖片輸入                                             |
| 執行緒回覆                     | 執行緒起始訊息檔案   | 當回覆沒有直接媒體時，根訊息檔案可被載入作為內容                           | 只有檔案的起始訊息會使用附件佔位符                                       |
| 多圖片訊息                     | 多個 Slack 檔案      | 每個檔案都會獨立評估                                                       | Slack 處理每則訊息最多八個檔案                                           |

### 入站管線

當帶有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 會使用 Bot 權杖（`xoxb-...`）從 Slack 的私人 URL 下載檔案。
2. 下載成功後，檔案會寫入媒體儲存區。
3. 已下載媒體路徑與內容類型會加入入站內容。
4. 具備圖片能力的模型/工具路徑可以使用該內容中的圖片附件。
5. 非圖片檔案仍會以檔案中繼資料或媒體參照的形式，供能處理它們的工具使用。

### 執行緒根附件繼承

當訊息抵達執行緒中（具有 `thread_ts` 父項）時：

- 如果回覆本身沒有直接媒體，而包含的根訊息有檔案，Slack 可以將根檔案載入為執行緒起始內容。
- 直接回覆附件優先於根訊息附件。
- 只有檔案且沒有文字的根訊息會以附件佔位符表示，讓備援仍可包含其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體管線獨立處理。
- 已下載的媒體參照會彙整到訊息內容中。
- 處理順序會依照事件酬載中的 Slack 檔案順序。
- 一個附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：預設每個檔案 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、超出大小限制的檔案，以及 Slack 驗證/登入 HTML 回應會被略過，而不是回報為不支援的格式。
- **視覺模型**：圖片分析會使用支援視覺的作用中回覆模型，或使用在 `agents.defaults.imageModel` 設定的圖片模型。

### 已知限制

| 情境                                   | 目前行為                                                                 | 因應方式                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 過期的 Slack 檔案 URL                  | 檔案會被略過；不顯示錯誤                                                | 在 Slack 中重新上傳檔案                                                    |
| 未設定視覺模型                         | 圖片附件會儲存為媒體參照，但不會作為圖片進行分析                        | 設定 `agents.defaults.imageModel`，或使用具備視覺能力的回覆模型            |
| 非常大的圖片（預設 > 20 MB）           | 依大小上限略過                                                          | 如果 Slack 允許，請提高 `channels.slack.mediaMaxMb`                        |
| 轉寄/共享的附件                        | 文字與 Slack 託管的圖片/檔案媒體會盡力處理                              | 直接在 OpenClaw 執行緒中重新共享                                          |
| PDF 附件                               | 儲存為檔案/媒體內容，不會自動透過圖片視覺路由                            | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具分析 PDF          |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [PDF 工具](/zh-TW/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件視覺啟用
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
    將入站訊息路由到代理。
  </Card>
  <Card title="Security" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="Configuration" icon="sliders" href="/zh-TW/gateway/configuration">
    設定版面配置與優先順序。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    命令目錄與行為。
  </Card>
</CardGroup>
