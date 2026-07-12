---
read_when:
    - 設定 Slack 或偵錯 Slack Socket、HTTP 或轉送模式
summary: Slack 設定與執行階段行為（Socket Mode、HTTP Request URLs 與中繼模式）
title: Slack
x-i18n:
    generated_at: "2026-07-12T14:20:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
    source_path: channels/slack.md
    workflow: 16
---

Slack 支援透過 Slack 應用程式整合來處理私訊與頻道。預設傳輸方式為 Socket Mode；也支援 HTTP Request URLs。轉送模式適用於由受信任路由器負責 Slack 輸入流量的受管理部署。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Slack 私訊預設使用配對模式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
</CardGroup>

## 選擇傳輸方式

Socket Mode 與 HTTP Request URLs 在訊息、斜線命令、App Home 和互動功能方面具有相同的功能。請依部署架構選擇，而非依功能選擇。

| 考量                         | Socket Mode（預設）                                                                                                                                  | HTTP Request URLs                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 公開閘道 URL                 | 不需要                                                                                                                                               | 需要（DNS、TLS、反向 Proxy 或通道）                                                                             |
| 對外網路                     | 必須能連線至 `wss-primary.slack.com` 的對外 WSS                                                                                                      | 不需對外 WS；僅需連入 HTTPS                                                                                     |
| 所需權杖                     | Bot 權杖 + 具有 `connections:write` 的 App-Level Token                                                                                               | Bot 權杖 + Signing Secret                                                                                       |
| 開發用筆電／位於防火牆後方   | 可直接運作                                                                                                                                           | 需要公開通道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或預備環境閘道                                        |
| 水平擴充                     | 每個主機上的每個應用程式各有一個 Socket Mode 工作階段；多個閘道需要各自獨立的 Slack 應用程式                                                         | 無狀態 POST 處理常式；多個閘道複本可在負載平衡器後方共用一個應用程式                                           |
| 單一閘道上的多帳號           | 支援；每個帳號會開啟自己的 WS                                                                                                                        | 支援；每個帳號都需要唯一的 `webhookPath`（預設為 `/slack/events`），以免註冊發生衝突                            |
| 斜線命令傳輸                 | 透過 WS 連線傳送；會忽略 `slash_commands[].url`                                                                                                      | Slack 會向 `slash_commands[].url` 傳送 POST；此欄位為分派命令的必要條件                                        |
| 請求簽章                     | 不使用（驗證方式為 App-Level Token）                                                                                                                 | Slack 會簽署每個請求；OpenClaw 使用 `signingSecret` 驗證                                                       |
| 連線中斷後的復原             | 已啟用 Slack SDK 自動重新連線；OpenClaw 也會以有上限的退避重試重新啟動失敗的 Socket Mode 工作階段。適用 Pong 逾時傳輸調校。                           | 沒有可能中斷的持續連線；Slack 會針對各個請求重試                                                               |

<Note>
  對於單一閘道主機、開發用筆電，以及可以對外連線至 `*.slack.com` 但無法接受連入 HTTPS 的內部部署網路，請**選擇 Socket Mode**。

當你在負載平衡器後方執行多個閘道複本、對外 WSS 遭封鎖但允許連入 HTTPS，或已在反向 Proxy 終止 Slack 網路鉤子時，請**選擇 HTTP Request URLs**。
</Note>

<Warning>
  Slack 可為單一應用程式維持多個 Socket Mode 連線，並可能將每個承載內容傳送至任一連線。因此，共用 Slack 應用程式的不同 OpenClaw 閘道必須具備等效的路由與授權設定。否則，請為每個閘道使用獨立的 Slack 應用程式、使用單一轉送輸入點，或在負載平衡器後方使用 HTTP Request URLs。請參閱[使用 Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)。
</Warning>

### 轉送模式

轉送模式會將 Slack 輸入流量與 OpenClaw 閘道分離。受信任路由器負責唯一的 Slack Socket Mode 連線、選擇目的地閘道，並透過經驗證的 WebSocket 轉送具型別的事件。閘道仍會使用自己的 Bot 權杖進行對外 Slack Web API 呼叫。

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

除非轉送 URL 指向 localhost，否則必須使用 `wss://`。請將持有人權杖與路由器路由表視為 Slack 授權邊界的一部分：路由事件會以已授權啟用事件的身分進入一般 Slack 訊息處理常式。路由器在 WebSocket `hello` 框架中提供的 `slack_identity` 可設定預設的對外使用者名稱與圖示；呼叫端明確提供的身分仍具有優先權。轉送連線會使用與 Socket Mode 相同的有上限退避重試時序重新連線，並在每次中斷連線時清除路由器提供的身分。

### Enterprise Grid 全組織安裝

一個 Slack 帳號可以接收 Enterprise Grid 全組織安裝所涵蓋之每個工作區的訊息。請選擇直接 Socket Mode 或 HTTP Request URLs；企業帳號不支援轉送模式。下方兩份最小權限資訊清單都只啟用 V1 `message` 與 `app_mention` 事件路徑、即時回覆，以及由接聽器擁有的狀態反應。

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

請由 Enterprise Grid Org Admin 或 Org Owner 核准應用程式、在組織層級安裝，並選擇此安裝涵蓋的工作區。啟動 OpenClaw 前，請確認此應用程式在每個預定工作區中皆可使用。為 Socket Mode 產生具有 `connections:write` 的應用程式層級權杖，然後從組織安裝複製 Bot 權杖。設定使用組織安裝 Bot 權杖的帳號：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

當閘道具有公開 HTTPS 端點且不開啟 Socket Mode 連線時，請使用 HTTP 模式。將範例 URL 替換為閘道的公開 `webhookPath` URL（預設為 `/slack/events`）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

請由 Enterprise Grid Org Admin 或 Org Owner 核准應用程式、在組織層級安裝，並選擇此安裝涵蓋的工作區。Slack 驗證 Request URL 後，請複製組織安裝的 Bot 權杖，以及應用程式的 **Basic Information -> App Credentials -> Signing Secret**。使用相同的 Request URL 路徑設定企業帳號：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

啟動時，OpenClaw 會使用 Slack `auth.test` 驗證 `enterpriseOrgInstall`。若組織安裝的權杖未設定此旗標，或工作區權杖設定了此旗標，啟動都會失敗。哪些工作區已授予此安裝仍以 Slack 為真實資料來源；接著 OpenClaw 會將設定的頻道、使用者、私訊與提及政策套用至每個傳送的事件。無論 `allowBots` 為何，Enterprise V1 都會在分派前拒絕所有由 Bot 撰寫的 `message` 與 `app_mention` 事件，因為組織安裝不提供穩定且含工作區限定資訊的 Bot 身分來防止迴圈。

企業支援刻意限制為直接 Socket Mode 或 HTTP 的 `message` 與 `app_mention` 事件及其即時回覆。企業帳號無法使用轉送模式、斜線命令、互動功能、App Home、反應事件接聽器、釘選、Slack 動作工具、Slack 原生核准、繫結、佇列或排程傳送，以及主動傳送。透過接聽器擁有的 Slack 用戶端支援對外確認、輸入中與狀態反應，且需要 `reactions:write`；連入反應通知與反應動作工具仍無法使用。

即時回覆會沿用標準 Slack 傳送行為來處理分段、媒體、中繼資料、身分備援、連結展開與收據，但僅限經驗證且由接聽器擁有的用戶端仍處於作用中事件輪次時。記憶體內傳送佇列與討論串參與記錄會依該事件的工作區分割；用戶端本身絕不會序列化或持久保存。

頻道政策鍵與 `dm.groupChannels` 項目必須使用原始且穩定的 Slack 頻道 ID，或
`channel:<id>` 格式。OpenClaw 會將任一格式正規化為原始頻道 ID，
以供執行階段比對；使用 `slack:`、`group:` 和 `mpim:` 前綴會導致啟動失敗。
使用者政策項目必須使用穩定的 Slack 使用者 ID；名稱、slug、顯示名稱
和電子郵件地址都會導致啟動失敗。ID 必須使用 Slack 的標準大寫
前綴與主體（例如 `C0123456789` 或 `U0123456789`）；小寫形式與
較短的相似 ID 會導致啟動失敗。企業帳號無法啟用
`dangerouslyAllowNameMatching`。企業帳號可以設定全域
`mentionPatterns.mode`，但設定 `mentionPatterns.allowIn` 和
`mentionPatterns.denyIn` 會導致啟動失敗，因為單獨的 Slack 頻道 ID 並未
限定工作區，且可能在不同工作區中重複使用。工作區安裝
會保留現有的限定範圍提及模式行為。每個接受的工作區
都會取得各自獨立的路由、工作階段、逐字稿、去重、歷史記錄和快取身分，
即使 Slack ID 重疊也一樣。在 `message` 串流中，支援一般使用者訊息
以及由使用者建立的 `file_share` 事件；其他訊息子類型會在
授權或系統事件處理前遭到拒絕。

企業私訊必須停用（`dm.enabled=false` 或
`dmPolicy="disabled"`），或使用 `dmPolicy="open"` 明確開放，且
有效帳號的 `allowFrom` 必須包含常值 `"*"`。空白
允許清單或未包含 `"*"` 的特定使用者 ID 會導致啟動失敗。配對與
個別使用者的私訊允許清單會遭到拒絕，因為這些授權儲存區中的 Slack 使用者 ID
並未限定工作區。頻道與傳送者政策
仍會套用至頻道訊息。

## 安裝

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 會註冊並啟用此外掛。在你設定下方的 Slack 應用程式與頻道設定之前，它不會執行任何操作。一般外掛安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 快速設定

本節中的資訊清單會建立工作區範圍的安裝。若要進行
Enterprise Grid 組織安裝，請改用專用的
[全組織資訊清單與工作流程](#enterprise-grid-org-wide-installs)。

<Tabs>
  <Tab title="Socket 模式（預設）">
    <Steps>
      <Step title="建立新的 Slack 應用程式">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選取你的工作區 → 貼上下方其中一份資訊清單 → **Next** → **Create**。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "適用於 OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 會將 Slack 助理對話串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道近期的活動。"
        },
        { "title": "起草回覆", "message": "協助我起草回覆。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "傳送訊息給 OpenClaw",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "適用於 OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 會將 Slack 助理對話串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道近期的活動。"
        },
        { "title": "起草回覆", "message": "協助我起草回覆。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "傳送訊息給 OpenClaw",
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **建議**符合 Slack 外掛的完整功能集：App Home、斜線命令、檔案、回應、釘選、群組私訊，以及 emoji／使用者群組讀取。當工作區政策限制範圍時，請選擇**最小化**——它涵蓋私訊、頻道／群組歷史記錄、提及和斜線命令，但不包含檔案、回應、釘選、群組私訊（`mpim:*`）、`emoji:read` 和 `usergroups:read`。各範圍的理由，以及額外斜線命令等可附加選項，請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)。
        </Note>

        Slack 建立應用程式後：

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**：新增 `connections:write`，儲存後複製應用程式層級權杖。
        - **Install App -> Install to Workspace**：複製機器人使用者 OAuth 權杖。

      </Step>

      <Step title="設定 OpenClaw">

        建議的 SecretRef 設定：

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        環境變數備援（僅限預設帳號）：

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="啟動閘道">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP 請求 URL">
    <Steps>
      <Step title="建立新的 Slack 應用程式">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選取你的工作區 → 貼上下方其中一份資訊清單 → 將 `https://gateway-host.example.com/slack/events` 替換為你的公開閘道 URL → **Next** → **Create**。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "適用於 OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 會將 Slack 助理對話串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道近期的活動。"
        },
        { "title": "起草回覆", "message": "協助我起草回覆。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "傳送訊息給 OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 會將 Slack 助理討論串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道近期的活動。"
        },
        { "title": "草擬回覆", "message": "協助我草擬回覆。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "傳送訊息給 OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **建議設定**符合 Slack 外掛的完整功能集；**最小設定**會移除檔案、表情回應、釘選、群組私訊（`mpim:*`）、`emoji:read` 與 `usergroups:read`，適用於限制較嚴格的工作區。各範圍的理由請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)。
        </Note>

        <Info>
          這三個 URL 欄位（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）全都指向同一個 OpenClaw 端點。Slack 的資訊清單結構描述要求分別命名這些欄位，但 OpenClaw 會依承載資料類型進行路由，因此單一 `webhookPath`（預設為 `/slack/events`）就已足夠。在 HTTP 模式下，未設定 `slash_commands[].url` 的斜線命令會直接無聲地不執行任何操作。
        </Info>

        Slack 建立應用程式後：

        - **Basic Information → App Credentials**：複製 **Signing Secret**，以供要求驗證使用。
        - **Install App -> Install to Workspace**：複製 Bot User OAuth Token。

      </Step>

      <Step title="設定 OpenClaw">

        建議的 SecretRef 設定：

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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
        多帳號 HTTP 請使用唯一的網路鉤子路徑

        為每個帳號指定不同的 `webhookPath`（預設為 `/slack/events`），避免註冊發生衝突。
        </Note>

      </Step>

      <Step title="啟動閘道">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 傳輸調校

OpenClaw 預設會將 Socket Mode 的 Slack SDK 用戶端 pong 逾時設為 15 秒。只有需要針對工作區或主機進行特定調校時，才覆寫傳輸設定：

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

只有在 Socket Mode 工作區記錄到 Slack websocket pong／伺服器 ping 逾時，或執行所在主機已知會發生事件迴圈飢餓時，才使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息與事件仍屬於應用程式狀態，而不是傳輸存活訊號。

注意事項：

- 在 HTTP Request URL 模式中，`socketMode` 會被忽略。
- 除非另有覆寫，基礎 `channels.slack.socketMode` 設定會套用至所有 Slack 帳號。各帳號的覆寫使用 `channels.slack.accounts.<accountId>.socketMode`；由於這是物件覆寫，因此請納入該帳號所需的每個 socket 調校欄位。
- 只有 `clientPingTimeout` 具有 OpenClaw 預設值（`15000`）。只有在設定後，`serverPingTimeout` 與 `pingPongLoggingEnabled` 才會傳遞給 Slack SDK。
- Socket Mode 重新啟動的退避時間從約 2 秒開始，上限約為 30 秒。可復原的啟動、等待啟動與中斷連線失敗會持續重試，直到頻道停止。無效驗證、已撤銷權杖或缺少範圍等永久性帳號與認證資訊錯誤會立即失敗，而不會無限重試。

## 資訊清單與範圍檢查清單

Socket Mode 與 HTTP Request URL 使用相同的基礎 Slack 應用程式資訊清單。只有 `settings` 區塊（以及斜線命令的 `url`）不同。

基礎資訊清單（Socket Mode 預設）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 的 Slack 連接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 會將 Slack 助理討論串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道近期的活動。"
        },
        { "title": "草擬回覆", "message": "協助我草擬回覆。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "傳送訊息給 OpenClaw",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

針對 **HTTP Request URL 模式**，請將 `settings` 替換為 HTTP 變體，並在每個斜線命令中加入 `url`。需要公開 URL：

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "傳送訊息給 OpenClaw",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

### 其他資訊清單設定

提供不同功能，以擴充上述預設值。

預設資訊清單會啟用 Slack App Home 的 **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會透過 `views.publish` 發布安全的預設 Home 檢視；其中不包含任何對話承載資料或私人設定。啟用單一斜線命令模式時，命令提示會使用 `channels.slack.slashCommand.name`；使用原生命令或未使用斜線命令的安裝則會省略該提示。**Messages** 分頁會維持啟用，以供 Slack 私訊使用。資訊清單也會透過 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 與 `assistant_thread_context_changed` 啟用 Slack 助理討論串；助理討論串會路由至各自的 OpenClaw 討論串工作階段，並讓代理程式可以使用 Slack 提供的討論串內容。

<AccordionGroup>
  <Accordion title="選用的原生斜線命令">

    可使用多個[原生斜線命令](#commands-and-slash-behavior)，取代單一已設定的命令，但須注意以下細節：

    - 請使用 `/agentstatus`，而非 `/status`，因為 `/status` 命令是保留命令。
    - 一個 Slack 應用程式最多只能同時註冊 25 個斜線命令（Slack 平台限制）。

    將現有的 `features.slash_commands` 區段替換為[可用命令](/zh-TW/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode（預設）">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "開始新工作階段",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "重設目前的工作階段"
    },
    {
      "command": "/compact",
      "description": "壓縮工作階段的情境",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "停止目前的執行"
    },
    {
      "command": "/session",
      "description": "管理討論串繫結的到期時間",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "設定思考層級",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "切換詳細輸出",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "顯示或設定快速模式",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "切換推理內容的可見性",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "切換提升權限模式",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "顯示或設定執行預設值",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "核准或拒絕待處理的核准要求",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "顯示或設定模型",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "列出供應商／模型",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "顯示簡短的說明摘要"
    },
    {
      "command": "/commands",
      "description": "顯示產生的命令目錄"
    },
    {
      "command": "/tools",
      "description": "顯示目前代理程式現在可以使用的項目",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "顯示執行階段狀態，包括可用時的供應商用量／配額"
    },
    {
      "command": "/tasks",
      "description": "列出目前工作階段中作用中／最近的背景工作"
    },
    {
      "command": "/context",
      "description": "說明情境的組合方式",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "顯示你的傳送者身分"
    },
    {
      "command": "/skill",
      "description": "依名稱執行 Skill",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "提出附帶問題而不變更工作階段情境",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "提出附帶問題而不變更工作階段情境",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "控制用量頁尾或顯示費用摘要",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP 要求 URL">
        使用與上述 Socket Mode 相同的 `slash_commands` 清單，並在每個項目加入 `"url": "https://gateway-host.example.com/slack/events"`。範例：

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "開始新工作階段",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "顯示簡短的說明摘要",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        在清單中的每個命令重複使用該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用的作者身分範圍（寫入操作）">
    如果你希望外送訊息使用作用中代理程式的身分（自訂使用者名稱與圖示），而非預設的 Slack 應用程式身分，請加入 `chat:write.customize` 機器人範圍。

    如果使用表情符號圖示，Slack 預期採用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用的使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，常見的讀取範圍為：

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你仰賴 Slack 搜尋讀取功能）

  </Accordion>
</AccordionGroup>

## 權杖模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- 轉送模式需要 `botToken`，以及 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用應用程式權杖或簽署密鑰。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定中的權杖會覆寫環境變數備援值。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN` 和 `SLACK_USER_TOKEN` 的環境變數備援值都只套用於預設帳號。
- `userToken` 預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳號檢查會追蹤各項認證資訊的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳號是透過 SecretRef
  或其他非內嵌的密鑰來源設定，但目前的命令／執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要的組合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
進行動作／目錄讀取時，若已設定使用者權杖，可以優先使用它。進行寫入時，仍會優先使用機器人權杖；只有在 `userTokenReadOnly: false` 且機器人權杖不可用時，才允許使用使用者權杖寫入。
</Tip>

## 動作與閘門

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組       | 預設值 |
| ---------- | ------- |
| messages   | 已啟用 |
| reactions  | 已啟用 |
| pins       | 已啟用 |
| memberInfo | 已啟用 |
| emojiList  | 已啟用 |

目前的 Slack 訊息動作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受傳入檔案預留位置中顯示的 Slack 檔案 ID，並針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="私人訊息原則">
    `channels.slack.dmPolicy` 控制私人訊息存取。`channels.slack.allowFrom` 是標準的私人訊息允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私人訊息旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組私人訊息預設為 false）
    - `dm.groupChannels`（選用的 MPIM 允許清單）

    多帳號優先順序：

    - `channels.slack.accounts.default.allowFrom` 只套用於 `default` 帳號。
    - 已命名帳號若未設定自己的 `allowFrom`，會繼承 `channels.slack.allowFrom`。
    - 已命名帳號不會繼承 `channels.slack.accounts.default.allowFrom`。

    為了相容性，仍會讀取舊版的 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom`。當 `openclaw doctor --fix` 能在不變更存取權限的情況下進行遷移時，會將它們遷移至 `dmPolicy` 和 `allowFrom`。

    私人訊息中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道原則">
    `channels.slack.groupPolicy` 控制頻道處理方式：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 下，且**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）作為設定鍵。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅使用環境變數的設定），執行階段會退回使用 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱／ID 解析：

    - 當權杖存取權限允許時，頻道允許清單項目和私人訊息允許清單項目會在啟動時解析
    - 未解析的頻道名稱項目會依設定保留，但預設會在路由時忽略
    - 傳入授權和頻道路由預設都以 ID 為優先；直接比對使用者名稱／slug 需要設定 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    在 `groupPolicy: "allowlist"` 下，以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）**不會**相符。頻道查詢預設以 ID 為優先，因此以名稱為基礎的鍵永遠無法成功路由，而該頻道中的所有訊息都會被無聲封鎖。這與 `groupPolicy: "open"` 不同；在後者中，路由不要求頻道鍵，因此以名稱為基礎的鍵看似可以運作。

    一律使用 Slack 頻道 ID 作為鍵。若要尋找 ID：在 Slack 中以滑鼠右鍵按一下頻道 → **Copy link** — ID（`C...`）會出現在 URL 結尾。

    正確：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    錯誤（在 `groupPolicy: "allowlist"` 下會被無聲封鎖）：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="提及與頻道使用者">
    頻道訊息預設受提及閘門限制。

    提及來源：

    - 明確提及應用程式（`<@botId>`）
    - 當機器人使用者是該使用者群組的成員時，Slack 使用者群組提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及的規則運算式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆機器人討論串行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    各頻道控制項（`channels.slack.channels.<id>`；名稱只能透過啟動時解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`；覆寫此頻道的帳號／聊天類型回覆模式）
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 鍵格式：`channel:`、`id:`、`e164:`、`username:`、`name:` 或 `"*"` 萬用字元
      （舊版無前綴鍵仍只會對應至 `id:`）

    `ignoreOtherMentions`（預設為 `false`）會捨棄提及其他使用者或使用者群組、但未提及此機器人的頻道訊息。私人訊息和群組私人訊息（MPIM）不受影響。此篩選器需要從 `auth.test` 解析出機器人使用者 ID；如果無法取得該身分（例如僅有使用者權杖的身分），閘門會採開放策略，讓訊息不經變更直接通過。

    對頻道和私人頻道而言，`allowBots` 採保守策略：只有在傳送訊息的機器人明確列於該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少有一個明確的 Slack 擁有者 ID 目前是聊天室成員時，才會接受機器人撰寫的聊天室訊息。萬用字元和顯示名稱形式的擁有者項目無法滿足擁有者在場條件。擁有者在場狀態使用 Slack `conversations.members`；請確認應用程式具有與聊天室類型相符的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查詢失敗，OpenClaw 會捨棄機器人撰寫的聊天室訊息。

    已接受的機器人所撰寫 Slack 訊息會使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。使用 `channels.defaults.botLoopProtection` 設定預設額度，然後在工作區或頻道需要不同限制時，以 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆寫。

  </Tab>
</Tabs>

## 討論串、工作階段與回覆標籤

- 私訊路由為 `direct`；頻道路由為 `channel`；MPIM 路由為 `group`。
- Slack 路由綁定接受原始對端 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目標格式。
- 使用預設的 `session.dmScope=main` 時，Slack 私訊會合併至代理程式的主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 一般的頂層頻道訊息會留在各頻道的工作階段中，即使 `replyToMode` 不是 `off` 也一樣。
- Slack 討論串回覆會使用父 Slack `thread_ts` 作為工作階段後綴（`:thread:<threadTs>`），即使透過 `replyToMode="off"` 停用傳出回覆的討論串功能也一樣。
- 當符合條件的頂層頻道根訊息預期會開始可見的 Slack 討論串時，OpenClaw 會將該根訊息植入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，讓根訊息與後續討論串回覆共用同一個 OpenClaw 工作階段。這適用於 `app_mention` 事件、明確提及機器人或符合已設定提及模式的情況，以及 `requireMention: false` 且 `replyToMode` 不是 `off` 的頻道。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新討論串工作階段開始時要擷取多少則現有討論串訊息（預設為 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設為 `false`）：設為 `true` 時，抑制隱含的討論串提及，讓機器人只回應討論串內明確的 `@bot` 提及，即使機器人已參與該討論串也一樣。若未啟用此設定，機器人已參與之討論串中的回覆會略過 `requireMention` 閘控。

回覆討論串控制項：

- `channels.slack.channels.<id>.replyToMode`：針對 Slack 頻道／私人頻道訊息的各頻道覆寫
- `channels.slack.replyToMode`：`off|first|all|batched`（預設為 `off`）
- `channels.slack.replyToModeByChatType`：針對每個 `direct|group|channel`
- 私聊的舊版備援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

若要從 `message` 工具明確回覆 Slack 討論串，請搭配 `action: "send"` 與 `threadId` 或 `replyTo` 設定 `replyBroadcast: true`，要求 Slack 同時將討論串回覆廣播至父頻道。這會對應至 Slack `chat.postMessage` 的 `reply_broadcast` 旗標，且僅支援文字或 Block Kit 傳送，不支援媒體上傳。

當 `message` 工具呼叫在 Slack 討論串內執行並以相同頻道為目標時，OpenClaw 通常會依據有效的帳號、聊天類型或各頻道 `replyToMode`，沿用目前的 Slack 討論串。自動回覆以及相同頻道的 `send` 或 `upload-file` 呼叫會使用相同的各頻道覆寫。請在 `action: "send"` 或 `action: "upload-file"` 上設定 `topLevel: true`，以強制建立新的父頻道訊息。也接受 `threadId: null` 作為相同的頂層退出設定。

<Note>
`replyToMode="off"` 會停用傳出的 Slack 回覆討論串功能，包括明確的 `[[reply_to_*]]` 標籤。它不會將傳入的 Slack 討論串工作階段扁平化：已發佈於 Slack 討論串內的訊息仍會路由至 `:thread:<threadTs>` 工作階段。這與 Telegram 不同；Telegram 在 `"off"` 模式下仍會遵循明確標籤。Slack 討論串會從頻道中隱藏訊息，而 Telegram 回覆則會保持內嵌可見。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`ackReactionScope` 決定該表情符號實際傳送的時機。

預設情況下，確認反應會保持不變，而 Slack 原生助理討論串狀態則會使用輪替的載入訊息顯示進度。設定 `messages.statusReactions.enabled: true` 可選擇使用排入佇列／思考／工具／完成／錯誤的反應生命週期。

### 表情符號（`ackReaction`）

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理程式身分表情符號備援（`agents.list[].identity.emoji`，否則為 `"eyes"` / 👀）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可針對 Slack 帳號或全域停用此反應。

### 範圍（`messages.ackReactionScope`）

Slack 提供者會從 `messages.ackReactionScope` 讀取範圍（預設為 `"group-mentions"`）。目前沒有 Slack 帳號層級或 Slack 頻道層級的覆寫；此值對閘道全域生效。

值：

- `"all"`：在私訊與群組中加入反應，包括環境房間事件。
- `"direct"`：僅在私訊中加入反應。
- `"group-all"`：對每則群組訊息加入反應，但環境房間事件除外（不含私訊）。
- `"group-mentions"`（預設）：在群組中加入反應，但僅限機器人被提及時（或在已選擇啟用的群組可提及項目中）。**不包含私訊。**
- `"off"` / `"none"`：永不加入反應。

<Note>
預設範圍（`"group-mentions"`）不會在直接訊息或環境房間事件中觸發確認反應。若要在傳入的 Slack 私訊與安靜房間事件中看到已設定的 `ackReaction`（例如 `"eyes"`），請將 `messages.ackReactionScope` 設為 `"all"`。Slack 提供者會在啟動時讀取 `messages.ackReactionScope`，因此必須重新啟動閘道，變更才會生效。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // 在私訊與群組中加入反應
  },
}
```

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊的預覽更新。
- `progress`：生成時顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：草稿預覽啟用時，將工具／進度更新路由至同一則經編輯的預覽訊息（預設為 `true`）。設為 `false` 可保留獨立的工具／進度訊息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：設為 `status` 可在隱藏原始命令／執行文字的同時，保留精簡的工具進度行（預設為 `raw`）。

隱藏原始命令／執行文字，同時保留精簡進度行：

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

當 `channels.slack.streaming.mode` 為 `partial` 時，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文字串流（預設為 `true`）。

Slack 原生進度工作卡片需在進度模式中選擇啟用。將 `channels.slack.streaming.progress.nativeTaskCards` 設為 `true`，並搭配 `channels.slack.streaming.mode="progress"`，即可在工作執行期間傳送 Slack 原生計畫／工作卡片，並在完成時更新同一張工作卡片。若未設定此旗標，進度模式會保留可攜式草稿預覽行為。

- 必須有可用的回覆討論串，原生文字串流與 Slack 助理討論串狀態才會顯示。討論串選擇仍遵循 `replyToMode`。
- 當原生串流無法使用或不存在回覆討論串時，頻道、群組聊天及頂層私訊根訊息仍可使用一般草稿預覽。
- 頂層 Slack 私訊預設不使用討論串，因此不會顯示 Slack 討論串樣式的原生串流／狀態預覽；OpenClaw 會改為在私訊中發佈並編輯草稿預覽。
- 媒體與非文字承載內容會退回一般傳遞方式。
- 媒體／錯誤最終結果會取消待處理的預覽編輯；符合條件的文字／區塊最終結果僅在可就地編輯預覽時才會送出。
- 若串流在回覆途中失敗，OpenClaw 會對剩餘承載內容退回一般傳遞方式。

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

選擇啟用 Slack 原生進度工作卡片：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

舊版鍵：

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的舊版別名。
- 布林值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 與 `channels.slack.streaming.nativeTransport` 的舊版別名。
- 頂層 `channels.slack.chunkMode` 與 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.chunkMode` 與 `channels.slack.streaming.nativeTransport` 的舊版別名。
- 執行階段不會讀取舊版別名；請執行 `openclaw doctor --fix`，將已保存的 Slack 串流設定重寫為標準鍵。

## 輸入中反應備援

`typingReaction` 會在 OpenClaw 處理回覆時，為傳入的 Slack 訊息加入暫時反應，並在執行結束時移除。這在討論串回覆之外最實用，因為討論串回覆會使用預設的「正在輸入……」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 此反應採盡力而為方式，並會在回覆或失敗路徑完成後自動嘗試清理。

## 語音輸入

目前若要在 Slack 中對 OpenClaw 說話，請將 Slack 音訊剪輯傳送至 OpenClaw 應用程式。Slackbot 的聽寫麥克風是 Slack 自有的獨立功能，並非應用程式 API。

- **[Slackbot 語音聽寫](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** 位於使用者私人的 Slackbot 對話中。Slack 會將錄音轉為 Slackbot 提示，但不會透過 Events API 向第三方 Slack 應用程式發出音訊檔案、聽寫事件、提示或輸入來源標記。OpenClaw Slack 外掛無法啟用或接收該功能。
- **[Slack 音訊剪輯](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** 是儲存於 Slack 的檔案，可發佈至 OpenClaw 私訊、頻道或討論串。OpenClaw 會使用機器人權杖下載可存取的剪輯、正規化 Slack 的剪輯 MIME 中繼資料，並透過共用的[音訊轉錄管線](/zh-TW/nodes/audio)傳送。建議的應用程式資訊清單包含必要的 `files:read` 範圍。

音訊剪輯與 Slackbot 聽寫具有不同的隱私語意：剪輯會遵循 Slack 檔案保留政策，且 OpenClaw 會下載剪輯以進行轉錄；Slack 則表示不會儲存聽寫音訊。

在 `requireMention: true` 的頻道中，沒有說明文字的音訊剪輯可藉由說出已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，若無則退回 `messages.groupChat.mentionPatterns`）來通過閘控。OpenClaw 會在下載或轉錄剪輯前授權傳送者，然後僅在逐字稿相符時才允許其進入。失敗或不相符的推測性逐字稿會與已下載的剪輯一併捨棄；不會保留在頻道歷史記錄中。無法從語音推斷原生 Slack `@bot` 身分，因此請設定口述名稱模式，或加入輸入的提及。若已啟用逐字稿回顯，回顯只會在允許進入後傳送。

## 媒體、分塊與傳遞

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 代管的私人 URL 下載（經權杖驗證的請求流程），並在擷取成功且大小限制允許時寫入媒體儲存區。檔案預留位置包含 Slack `fileId`，讓代理程式可使用 `download-file` 擷取原始檔案。

    下載會使用有界的閒置與總逾時。若 Slack 檔案擷取停滯或失敗，OpenClaw 仍會繼續處理訊息，並退回使用檔案預留位置。

    執行階段的輸入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="輸出文字與檔案">
    - 文字區塊使用 `channels.slack.textChunkLimit`（預設為 `8000`，上限為 Slack 本身的訊息長度限制）
    - `channels.slack.streaming.chunkMode="newline"` 會啟用段落優先分割
    - 傳送檔案時會使用 Slack 上傳 API，且可包含討論串回覆（`thread_ts`）
    - 較長的檔案說明會使用第一個符合 Slack 限制的文字區塊作為上傳留言，並將其餘區塊作為後續訊息傳送
    - 設定 `channels.slack.mediaMaxMb` 時，輸出媒體上限會依循該設定；否則頻道傳送會使用媒體管線依 MIME 類型設定的預設值

  </Accordion>

  <Accordion title="傳遞目標">
    建議使用明確的目標：

    - `user:<id>` 用於私人訊息
    - `channel:<id>` 用於頻道

    僅含文字／區塊的 Slack 私人訊息可直接傳送至使用者 ID；檔案上傳與討論串傳送則會先透過 Slack 對話 API 開啟私人訊息，因為這些路徑需要具體的對話 ID。

  </Accordion>
</AccordionGroup>

## 指令與斜線指令行為

斜線指令在 Slack 中會顯示為單一已設定指令或多個原生指令。設定 `channels.slack.slashCommand` 可變更指令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生指令需要在你的 Slack 應用程式中設定[額外的資訊清單設定](#additional-manifest-settings)，並改用 `channels.slack.commands.native: true` 啟用，或在全域設定中使用 `commands.native: true`。

- Slack 的原生指令自動模式為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生指令。

```txt
/help
```

原生引數選單會依下列優先順序呈現為其中一種形式：

- 3–5 個長度足夠短的選項：溢位（「...」）選單
- 超過 100 個選項，且可使用非同步選項篩選：外部選取器
- 1–2 個選項，或任一選項的編碼值過長而無法放入選取器：按鈕區塊
- 其他情況（6–100 個選項，或超過 100 個但沒有非同步篩選）：靜態選取選單，每個選單分成最多 100 個選項

```txt
/think
```

斜線指令工作階段使用類似 `agent:<agentId>:slack:slash:<userId>` 的隔離鍵，並仍透過 `CommandTargetSessionKey` 將指令執行路由至目標對話工作階段。

## 原生圖表

Slack 的公開 [`data_visualization` Block Kit 區塊](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
可在訊息中呈現折線圖、長條圖、面積圖與圓餅圖。OpenClaw 會將可攜式
`presentation` `chart` 區塊對應至該原生格式；除了正常的
`chat:write` 訊息存取權限外，不需要額外的 OAuth 範圍、
檔案上傳、影像算繪器或 Slack 設定。

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "季度營收",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "營收", "values": [120, 145] }],
      "xLabel": "季度"
    }
  ]
}
```

原生呈現前會強制套用 Slack 的限制：

- 標題與選用的座標軸標籤：50 個字元
- 圓餅圖：1–12 個正值區段
- 折線圖／長條圖／面積圖：1–12 個名稱不重複的數列，以及 1–20 個共用類別
- 區段、類別與數列標籤：20 個字元
- 每個數列都必須為每個類別包含一個有限數值；非圓餅圖的值
  可以是負數

每個原生圖表也會附帶頂層文字表示，供螢幕閱讀器、
通知、工作階段鏡像，以及無法呈現該區塊的用戶端使用。傳送至其他
OpenClaw 頻道的標準簡報會以文字接收相同的確定性圖表資料，除非
該頻道宣告支援原生圖表。如果 Slack 在分階段推出期間以
`invalid_blocks` 拒絕圖表，OpenClaw 會移除遭拒的原生資料區塊、
保留任何同層控制項，並將完整的圖表表示作為可見文字傳送。

Slack 目前每則訊息最多接受兩個 `data_visualization` 區塊。當
簡報包含超過兩個有效圖表時，OpenClaw 會保留其順序，
並在後續訊息中繼續原生呈現，每則訊息不超過兩個
圖表。

Slack 的[開發者發布公告](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
將此區塊記載為面向應用程式的 Block Kit 功能，且未公布任何付費
方案限制。Business+/Enterprise 的資格說明適用於
Slackbot 的自動 AI 圖表產生功能，這與應用程式傳送
已具結構的 Block Kit 圖表是不同的功能。圖表僅可用於訊息區塊，不能用於 App
Home、互動視窗或 Canvas 內容。

## 原生表格

Slack 目前的 [`data_table` Block Kit 區塊](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
可在訊息中呈現結構化的資料列與資料欄。OpenClaw 會將明確的
可攜式 `presentation` `table` 區塊對應至 `data_table`；它不會使用 Slack 的
舊版 [`table` 區塊](https://docs.slack.dev/reference/block-kit/blocks/table-block/)。
除了正常的 `chat:write` 訊息存取權限外，不需要額外的 OAuth 範圍或 Slack
設定。

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "進行中的銷售管線",
      "headers": ["客戶", "階段", "ARR"],
      "rows": [
        ["Acme", "成交", 125000],
        ["Globex", "審查", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw 會將標頭與字串儲存格對應至 Slack `raw_text` 儲存格。數值儲存格
會對應至 `raw_number`，並保留有限數值以供原生排序
與篩選。當 `rowHeaderColumnIndex` 存在時，會將該以零為起始索引的
資料欄標記為 Slack 資料列標頭。

原生呈現前會強制套用 Slack 公布的 `data_table` 限制：

- 1–20 個資料欄
- 1–100 個資料列，另加標頭列
- 每個資料列的儲存格數量相同
- 單一訊息中所有表格儲存格合計最多 10,000 個字元

只要訊息仍在字元總數限制內，多個有效的表格區塊即可原生
呈現。無法在原生限制範圍內呈現的表格會轉為完整且確定性的文字，
而不會遺失資料列或儲存格。如果該文字超出一則 Slack 訊息的容量，
傳送與斜線指令回應會使用有序的文字區塊。表格編輯若超出大小限制，
會以明確的大小錯誤失敗，而不會在既有訊息中
無聲截斷資料列。

每個由可攜式簡報產生的原生表格也會附帶頂層
文字表示，供螢幕閱讀器、通知、工作階段鏡像，以及
無法呈現該區塊的用戶端使用。原始圖表與表格值在備援表示中會維持原樣，
因此 `<@U123>` 等儲存格資料不會變成 Slack 提及。
如果 Slack 以 `invalid_blocks` 拒絕原生圖表或表格區塊，OpenClaw
會在一次有界的復原步驟中移除所有原生資料區塊，保留有效的
同層區塊（例如按鈕與選取器），並在停用 Slack 格式設定的情況下，
傳送完整且可見的圖表與表格文字。斜線指令傳遞會在整個指令執行期間
追蹤 Slack 的五次 `response_url` 呼叫預算。每批回覆前，
它會選擇可配合剩餘呼叫次數的完整方案，否則在發布
該批回覆前失敗。

只有明確的 `presentation` 表格區塊會提升為原生表格。
Markdown 管線表格會維持撰寫時的文字格式；OpenClaw 不會猜測表格
結構或儲存格類型。既有且受信任的 Slack 原生產生器仍可繼續
透過 `channelData.slack.blocks` 傳入原始區塊；OpenClaw 會從有效的原始
`data_table` 儲存格衍生備援文字，而格式錯誤的自訂區塊可能
降級為其說明文字或一般 Block Kit 備援表示。可攜式代理程式、命令列介面
與外掛輸出應使用 `presentation`。

## 互動式回覆

Slack 可以呈現由代理程式撰寫的互動式回覆控制項，但此功能預設停用。
新的代理程式、命令列介面與外掛輸出應優先使用共用的
`presentation` 按鈕或選取區塊。它們使用相同的 Slack 互動
路徑，也能在其他頻道上降級呈現。

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

或僅為一個 Slack 帳號啟用：

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

啟用後，代理程式仍可發出已淘汰的 Slack 專用回覆指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指令會編譯成 Slack Block Kit，並將點擊或選取操作
透過既有的 Slack 互動事件路徑傳回。請保留它們以支援舊版
提示詞與 Slack 專用的逃生機制；新的可攜式控制項請使用共用簡報。

指令編譯器 API 也已不建議用於新的產生器程式碼：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新的 Slack 呈現控制項請使用 `presentation` 承載資料與
`buildSlackPresentationBlocks(...)`。

注意：

- 這是 Slack 專用的舊版 UI。其他頻道不會將 Slack Block
  Kit 指令轉換為其自身的按鈕系統。
- 互動回呼值是由 OpenClaw 產生的不透明權杖，而非代理程式撰寫的原始值。
- 如果產生的互動區塊會超出 Slack Block Kit 限制，OpenClaw 會改用原始文字回覆，而不是傳送無效的區塊承載資料。

### 外掛擁有的互動視窗提交

註冊互動處理常式的 Slack 外掛也能接收互動視窗
`view_submission` 與 `view_closed` 生命週期事件，之後 OpenClaw 才會壓縮
供代理程式查看的系統事件承載資料。開啟 Slack 互動視窗時，請使用下列其中一種路由
模式：

- 將 `callback_id` 設為 `openclaw:<namespace>:<payload>`。
- 或保留既有的 `callback_id`，並在互動視窗的 `private_metadata` 中放入 `pluginInteractiveData:
"<namespace>:<payload>"`。

處理常式會接收值為 `view_submission` 或
`view_closed` 的 `ctx.interaction.kind`、正規化的 `inputs`，以及來自
Slack 的完整原始 `stateValues` 物件。僅使用回呼 ID 路由便足以叫用外掛處理常式；當
互動視窗還應產生供代理程式查看的系統事件時，請包含
既有互動視窗 `private_metadata` 中的使用者／工作階段路由欄位。代理程式會收到
精簡且經遮蔽的 `Slack interaction: ...` 系統事件。如果處理常式回傳
`systemEvent.summary`、`systemEvent.reference` 或 `systemEvent.data`，這些
欄位會包含在該精簡事件中，讓代理程式能參照
外掛擁有的儲存空間，而不會看到完整的表單承載資料。

## Slack 中的原生核准

Slack 可作為具有互動按鈕與互動功能的原生核准用戶端，而不必改用 Web UI 或終端機。

- 執行與外掛核准可呈現為 Slack 原生 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是原生執行核准用戶端的啟用與私人訊息／頻道路由設定。
- 執行核准私人訊息使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 當 Slack 已針對原始工作階段啟用為原生核准用戶端，或 `approvals.plugin` 路由至原始 Slack 工作階段或 Slack 目標時，外掛核准會使用 Slack 原生按鈕。
- 外掛核准私人訊息使用來自 `channels.slack.allowFrom`、具名帳號 `allowFrom` 或帳號預設路由的 Slack 外掛核准者。
- 仍會強制執行核准者授權：僅有執行核准權限的核准者無法核准外掛要求，除非他們同時也是外掛核准者。

這會使用與其他頻道相同的共用核准按鈕介面。當你在 Slack 應用程式設定中啟用 `interactivity` 時，核准提示會直接在對話中顯示為 Block Kit 按鈕。
當這些按鈕存在時，它們就是主要的核准使用者體驗；只有在工具結果指出無法使用聊天核准，或手動核准是唯一途徑時，OpenClaw
才應包含手動 `/approve` 命令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時會回退至 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`、`sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少可解析出一位
執行核准者時，Slack 會自動啟用原生執行核准。當可解析出 Slack 外掛核准者，且請求符合原生用戶端篩選條件時，Slack 也可以透過這個原生用戶端
路徑處理原生外掛核准。設定
`enabled: false` 可明確停用 Slack 的原生核准用戶端功能。設定 `enabled: true` 可在解析出核准者時
強制啟用原生核准。停用 Slack 執行核准不會停用
透過 `approvals.plugin` 啟用的原生 Slack 外掛核准傳送；外掛核准
傳送改用 Slack 外掛核准者。

未明確設定 Slack 執行核准時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有當你想覆寫核准者、新增篩選條件，或
選擇啟用來源聊天傳送時，才需要明確的 Slack 原生設定：

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

共用 `approvals.exec` 轉送是獨立的。只有當執行核准提示也必須
路由至其他聊天或明確的頻外目標時才使用它。共用 `approvals.plugin` 轉送也是
獨立的；只有當 Slack 能以原生方式處理外掛
核准請求時，Slack 原生傳送才會抑制該回退路徑。

同一聊天中的 `/approve` 也可用於已支援命令的 Slack 頻道和私訊。完整的核准轉送模型請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯／刪除會對應為系統事件。
- 討論串廣播（「Also send to channel」討論串回覆）會被當作一般使用者訊息處理。
- 新增／移除回應事件會對應為系統事件。
- 成員加入／離開、頻道建立／重新命名，以及新增／移除釘選事件會對應為系統事件。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定鍵。
- 頻道主題／用途中繼資料會被視為不受信任的情境，並可注入路由情境。
- 適用時，討論串起始訊息和初始討論串歷史情境植入會依據已設定的傳送者允許清單進行篩選。
- 區塊動作、捷徑和互動視窗互動會發出結構化的 `Slack interaction: ...` 系統事件，並包含豐富的酬載欄位：
  - 區塊動作：已選值、標籤、選擇器值及 `workflow_*` 中繼資料
  - 全域捷徑：回呼和操作者中繼資料，路由至操作者的直接工作階段
  - 訊息捷徑：回呼、操作者、頻道、討論串和所選訊息情境
  - 互動視窗 `view_submission` 和 `view_closed` 事件，包含已路由的頻道中繼資料和表單輸入

在 Slack 應用程式設定中定義全域或訊息捷徑，並使用任意非空白回呼 ID。OpenClaw 會確認相符的捷徑酬載、套用與其他 Slack 互動相同的私訊／頻道傳送者政策，並將經過淨化的事件排入已路由代理程式工作階段的佇列。觸發 ID 和回應 URL 會從代理程式情境中遮蔽。

## 設定參考

主要參考資料：[設定參考資料 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="重要的 Slack 欄位">

- 模式／驗證：`mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私訊存取：`dm.enabled`、`dmPolicy`、`allowFrom`（舊版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（緊急使用；除非必要，否則保持關閉）
- 頻道存取：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 討論串／歷史記錄：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳送：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展開預覽：`unfurlLinks`（預設：`false`）、用於控制 `chat.postMessage` 連結／媒體預覽的 `unfurlMedia`；設定 `unfurlLinks: true` 可重新選擇啟用連結預覽
- 操作／功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **鍵必須是頻道 ID**（`C12345678`），而不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，以名稱為基礎的鍵會悄然失敗，因為頻道路由預設以 ID 優先。若要尋找 ID：在 Slack 中以滑鼠右鍵按一下頻道 → **Copy link** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 各頻道的 `users` 允許清單
    - `messages.groupChat.visibleReplies`：一般群組／頻道請求預設為 `"automatic"`。如果你選擇啟用 `"message_tool"`，且記錄顯示助理文字但沒有 `message(action=send)` 呼叫，表示模型遺漏了可見的訊息工具路徑。在此模式下，最終文字會保持私密；請檢查閘道詳細記錄中的受抑制酬載中繼資料，或者，如果你希望每個一般助理最終回覆都透過舊版路徑發布，請將其設為 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果其值為 `"room_event"`，未提及但允許的頻道對話會作為周邊情境，且除非代理程式呼叫 `message` 工具，否則會保持靜默。請參閱[周邊聊天室事件](/zh-TW/channels/ambient-room-events)。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    實用命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="私訊訊息遭忽略">
    檢查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或舊版 `channels.slack.dm.policy`）
    - 配對核准／允許清單項目（`dmPolicy: "open"` 仍需要 `channels.slack.allowFrom: ["*"]`）
    - 群組私訊使用 MPIM 處理；請啟用 `channels.slack.dm.groupEnabled`，並在已有相關設定時，將 MPIM 納入 `channels.slack.dm.groupChannels`
    - Slack Assistant 私訊事件：詳細記錄中提及 `drop message_changed`
      通常表示 Slack 傳送了已編輯的 Assistant 討論串事件，但訊息中繼資料中
      沒有可復原的人類傳送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未連線">
    驗證 Slack 應用程式設定中的 Bot + App 權杖以及 Socket Mode 是否啟用。
    App-Level Token 需要 `connections:write`，且 Bot User OAuth Token
    機器人權杖必須與應用程式權杖屬於同一個 Slack 應用程式／工作區。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳號已
    設定，但目前執行環境無法解析由 SecretRef 支援的
    值。

    `slack socket mode failed to start; retry ...` 之類的記錄表示可復原的
    啟動失敗。缺少範圍、已撤銷的權杖和無效驗證則會
    立即失敗。`slack token mismatch ...` 記錄表示機器人權杖和應用程式權杖
    似乎屬於不同的 Slack 應用程式；請修正 Slack 應用程式認證資訊。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    驗證：

    - 簽署密鑰
    - 網路鉤子路徑
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳號都有唯一的 `webhookPath`
    - 公開 URL 會終止 TLS，並將請求轉送至閘道路徑
    - Slack 應用程式的 `request_url` 路徑與 `channels.slack.webhookPath` 完全相符（預設為 `/slack/events`）

    如果帳號快照中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳號已設定，但目前執行環境無法
    解析由 SecretRef 支援的簽署密鑰。

    重複出現的 `slack: webhook path ... already registered` 記錄表示兩個 HTTP
    帳號正在使用相同的 `webhookPath`；請為每個帳號指定不同的路徑。

  </Accordion>

  <Accordion title="原生／斜線命令未觸發">
    確認你原本要使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），並已在 Slack 中註冊相符的斜線命令
    - 或單一斜線命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不會自動建立或移除斜線命令。`commands.native: "auto"` 不會啟用 Slack 原生命令；請使用 `true`，並在 Slack 應用程式中建立相符的命令。在 HTTP 模式下，每個 Slack 斜線命令都必須包含閘道 URL。在 Socket Mode 中，命令酬載會透過 websocket 到達，且 Slack 會忽略 `slash_commands[].url`。

    另請檢查 `commands.useAccessGroups`、私訊授權、頻道允許清單
    和各頻道的 `users` 允許清單。Slack 會向遭封鎖的
    斜線命令傳送者傳回暫時性錯誤，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件媒體參考資料

當 Slack 檔案下載成功且大小限制允許時，Slack 可以將下載的媒體附加至代理程式回合。音訊片段可以轉錄，影像檔案可以透過媒體理解路徑，或直接傳送至支援視覺的回覆模型，而其他檔案仍可作為可下載的檔案情境使用。

### 支援的媒體類型

| 媒體類型                       | 來源                 | 目前行為                                                                          | 備註                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音訊片段                 | Slack 檔案 URL       | 下載並透過共用音訊轉錄進行路由                                                    | 需要 `files:read` 及可運作的 `tools.media.audio` 模型或命令列介面         |
| JPEG / PNG / GIF / WebP 影像   | Slack 檔案 URL       | 下載並附加至回合，以供支援視覺的處理                                              | 每個檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                    |
| PDF 檔案                       | Slack 檔案 URL       | 下載並公開為檔案情境，供 `download-file` 或 `pdf` 等工具使用                      | Slack 輸入不會自動將 PDF 轉換為影像視覺輸入                               |
| 其他檔案                       | Slack 檔案 URL       | 可行時下載並公開為檔案情境                                                        | 二進位檔案不會被視為影像輸入                                              |
| 討論串回覆                     | 討論串起始訊息檔案   | 當回覆沒有直接媒體時，可將根訊息檔案載入為情境                                    | 僅含檔案的起始訊息會使用附件預留位置                                      |
| 多檔案訊息                     | 多個 Slack 檔案      | 個別評估每個檔案                                                                  | Slack 每則訊息的處理上限為八個檔案                                        |

### 輸入管線

當帶有檔案附件的 Slack 訊息送達時：

1. OpenClaw 使用機器人權杖，從 Slack 的私人 URL 下載檔案。
2. 成功後，檔案會寫入媒體儲存區。
3. 下載的媒體路徑和內容類型會新增至傳入內容脈絡。
4. 音訊片段會路由至共用的轉錄管線；支援影像的模型／工具路徑可使用相同內容脈絡中的影像附件。
5. 其他檔案仍會以檔案中繼資料或媒體參照的形式提供給能夠處理它們的工具。

### 繼承討論串根訊息的附件

當訊息出現在討論串中（具有 `thread_ts` 父項）：

- 如果回覆本身沒有直接附加的媒體，而納入的根訊息含有檔案，Slack 可載入根訊息的檔案，作為討論串起始內容脈絡。
- 只有在建立新的討論串工作階段或重設討論串工作階段時，才會載入根訊息的檔案。後續純文字回覆會重用現有的工作階段內容脈絡，不會將根訊息的檔案重新附加為新媒體。
- 直接附加至回覆的附件優先於根訊息的附件。
- 如果根訊息只有檔案而沒有文字，系統會以附件預留位置表示，讓後備機制仍可納入其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體管線個別處理。
- 下載的媒體參照會彙整至訊息內容脈絡。
- 處理順序會依照事件承載資料中的 Slack 檔案順序。
- 單一附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：每個檔案預設為 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **音訊轉錄上限**：將下載的檔案傳送至轉錄提供者或命令列介面時，也會套用 `tools.media.audio.maxBytes`。
- **下載失敗**：Slack 無法提供的檔案、已過期的 URL、無法存取的檔案、超過大小上限的檔案，以及 Slack 驗證／登入 HTML 回應都會略過，而不會回報為不支援的格式。
- **視覺模型**：當目前使用的回覆模型支援視覺時，影像分析會使用該模型；否則會使用在 `agents.defaults.imageModel` 設定的影像模型。

### 已知限制

| 情境                                          | 目前行為                                                                           | 因應方式                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Slack 檔案 URL 已過期                         | 略過檔案；不顯示錯誤                                                               | 在 Slack 中重新上傳檔案                                                       |
| 無法使用音訊轉錄                              | 片段仍保持附加，但不會產生轉錄文字                                                 | 設定 `tools.media.audio` 或安裝支援的本機轉錄命令列介面                       |
| 沒有說明文字的片段未通過提及閘門              | 私下推測性轉錄後捨棄；轉錄文字與下載內容均會刪除                                   | 設定口述名稱提及模式、新增輸入的機器人提及，或使用私訊                       |
| 未設定視覺模型                                | 影像附件會儲存為媒體參照，但不會以影像方式分析                                     | 設定 `agents.defaults.imageModel` 或使用支援視覺的回覆模型                    |
| 非常大的影像（預設 > 20 MB）                  | 依大小上限略過                                                                     | 若 Slack 允許，請提高 `channels.slack.mediaMaxMb`                             |
| 轉寄／分享的附件                              | 以最大努力處理文字及 Slack 託管的影像／檔案媒體                                    | 直接在 OpenClaw 討論串中重新分享                                              |
| PDF 附件                                      | 儲存為檔案／媒體內容脈絡，不會自動路由至影像視覺處理                               | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具分析 PDF              |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [音訊與語音備忘錄](/zh-TW/nodes/audio)
- [PDF 工具](/zh-TW/tools/pdf)

## 相關內容

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Slack 使用者與閘道配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    頻道和群組私訊的行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化措施。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    設定配置與優先順序。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    命令目錄與行為。
  </Card>
</CardGroup>
