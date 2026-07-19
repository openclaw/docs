---
read_when:
    - 設定 Slack 或偵錯 Slack Socket、HTTP 或中繼模式
summary: Slack 設定與執行階段行為（Socket Mode、HTTP Request URLs 與轉送模式）
title: Slack
x-i18n:
    generated_at: "2026-07-19T14:26:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99fa9375bba29f3f333bc626b58db945c2f2bcd8b7f8c3365fabd3089415adc2
    source_path: channels/slack.md
    workflow: 16
---

Slack 支援透過 Slack 應用程式整合使用私訊與頻道。預設傳輸方式為 Socket Mode；也支援 HTTP Request URLs。轉送模式適用於由受信任路由器負責 Slack 輸入流量的受管理部署。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Slack 私訊預設使用配對模式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復作業手冊。
  </Card>
</CardGroup>

## 選擇傳輸方式

Socket Mode 與 HTTP Request URLs 在訊息、斜線命令、App Home 和互動功能方面具有相同的功能。請依部署架構而非功能來選擇。

| 考量事項                     | Socket Mode（預設）                                                                                                                                  | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開閘道 URL                 | 不需要                                                                                                                                               | 需要（DNS、TLS、反向代理或通道）                                                                               |
| 對外網路                     | 必須能連線至 `wss-primary.slack.com` 的對外 WSS                                                                                                           | 不使用對外 WS；僅使用傳入 HTTPS                                                                                |
| 所需權杖                     | 機器人身分：機器人權杖 + 具有 `connections:write` 的 App-Level Token；使用者身分：使用者權杖 + App-Level Token                                         | 機器人身分：機器人權杖 + Signing Secret；使用者身分：使用者權杖 + Signing Secret                              |
| 開發用筆電／位於防火牆後方   | 可直接運作                                                                                                                                           | 需要公開通道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或預備環境閘道                                      |
| 水平擴充                     | 每個主機上的每個應用程式各有一個 Socket Mode 工作階段；多個閘道需要個別的 Slack 應用程式                                                             | 無狀態 POST 處理常式；多個閘道複本可在負載平衡器後方共用一個應用程式                                         |
| 單一閘道上的多個帳號         | 支援；每個帳號會開啟自己的 WS                                                                                                                        | 支援；每個帳號都需要唯一的 `webhookPath`（預設為 `/slack/events`），以免註冊發生衝突                  |
| 斜線命令傳輸                 | 透過 WS 連線傳送；會忽略 `slash_commands[].url`                                                                                                          | Slack 會將 POST 傳送至 `slash_commands[].url`；命令要分派時必須提供此欄位                                        |
| 要求簽署                     | 不使用（驗證方式為 App-Level Token）                                                                                                                 | Slack 會簽署每個要求；OpenClaw 使用 `signingSecret` 驗證                                                  |
| 連線中斷後的復原             | 已啟用 Slack SDK 自動重新連線；OpenClaw 也會以有上限的退避機制重新啟動失敗的 Socket Mode 工作階段。會套用 Pong 逾時傳輸調校。                         | 沒有可能中斷的持續連線；由 Slack 逐一重試要求                                                                  |

<Note>
  **選擇 Socket Mode**：適用於單一閘道主機、開發用筆電，以及可對外連線至 `*.slack.com` 但無法接受傳入 HTTPS 的內部部署網路。

**選擇 HTTP Request URLs**：適用於在負載平衡器後方執行多個閘道複本、對外 WSS 遭封鎖但允許傳入 HTTPS，或已在反向代理終止 Slack 網路鉤子的情況。
</Note>

<Warning>
  Slack 可為一個應用程式維持多個 Socket Mode 連線，並可能將每個承載資料傳送至任一連線。因此，共用同一個 Slack 應用程式的個別 OpenClaw 閘道必須具有相同的路由與授權設定。否則，請為每個閘道使用個別的 Slack 應用程式、單一轉送輸入端，或在負載平衡器後方使用 HTTP Request URLs。請參閱[使用 Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)。
</Warning>

### 轉送模式

轉送模式會將 Slack 輸入流量與 OpenClaw 閘道分離。受信任路由器負責單一 Slack Socket Mode 連線、選擇目的地閘道，並透過已驗證的 WebSocket 轉送具型別的事件。閘道仍會使用自己的機器人權杖來進行對外 Slack Web API 呼叫。

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

除非轉送 URL 的目標是 localhost，否則必須使用 `wss://`。請將持有人權杖與路由器路由表視為 Slack 授權邊界的一部分：路由事件會以已授權啟用項目的形式進入一般 Slack 訊息處理常式。WebSocket `hello` 框架中由路由器提供的 `slack_identity` 可設定預設的對外使用者名稱與圖示；呼叫端明確提供的身分仍具有優先權。轉送連線會使用與 Socket Mode 相同的有上限退避計時重新連線，並在每次中斷連線時清除路由器提供的身分。

### Enterprise Grid 全組織安裝

一個 Slack 帳號可接收 Enterprise Grid 全組織安裝涵蓋之每個工作區的訊息。請選擇直接使用 Socket Mode 或 HTTP Request URLs；企業帳號不支援轉送模式。下列兩份最低權限資訊清單只會啟用 V1 `message` 與 `app_mention` 事件路徑、立即回覆，以及由接聽器管理的狀態反應。

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

請讓 Enterprise Grid Org Admin 或 Org Owner 核准應用程式、在組織層級安裝，並選擇安裝所涵蓋的工作區。啟動 OpenClaw 前，請確認每個預定工作區都可使用此應用程式。為 Socket Mode 產生具有 `connections:write` 的應用程式層級權杖，然後從組織安裝複製機器人權杖。設定使用組織所安裝機器人權杖的帳號：

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

當閘道具有公開 HTTPS 端點且不開啟 Socket Mode 連線時，請使用 HTTP 模式。請將範例 URL 替換為閘道的公開 `webhookPath` URL（預設為 `/slack/events`）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

請讓 Enterprise Grid Org Admin 或 Org Owner 核准應用程式、在組織層級安裝，並選擇安裝所涵蓋的工作區。Slack 驗證 Request URL 後，請複製組織安裝的機器人權杖，以及應用程式的 **Basic Information -> App Credentials -> Signing Secret**。使用相同的 Request URL 路徑設定企業帳號：

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

啟動時，OpenClaw 會使用 Slack `auth.test` 驗證 `enterpriseOrgInstall`。沒有此旗標的組織安裝權杖，或具有此旗標的工作區權杖，都會導致啟動失敗。對於哪些工作區已授予安裝權限，Slack 仍是唯一真實來源；接著，OpenClaw 會將已設定的頻道、使用者、私訊與提及政策套用至每個已傳送事件。無論 `allowBots` 為何，Enterprise V1 都會在分派前拒絕所有由機器人建立的 `message` 與 `app_mention` 事件，因為組織安裝不會提供可用於防止迴圈、且穩定並具工作區限定的機器人身分。

企業支援刻意限制為直接使用 Socket Mode 或 HTTP 的 `message` 與 `app_mention` 事件及其立即回覆。企業帳號無法使用轉送模式、斜線命令、互動功能、App Home、反應事件接聽器、釘選、Slack 動作工具、Slack 原生核准、繫結、佇列或排程傳送，以及主動傳送。透過由接聽器管理的 Slack 用戶端可支援對外確認、輸入中與狀態反應，且需要 `reactions:write`；傳入反應通知與反應動作工具仍無法使用。

即時回覆會重用標準 Slack 傳遞行為來處理分段、
媒體、中繼資料、身分識別備援、連結展開與回條，但僅限於
經驗證且由監聽器擁有的用戶端仍處於作用中事件回合期間。記憶體內的
傳送佇列與討論串參與記錄會依該事件的工作區分區；
用戶端本身絕不會被序列化或持久保存。

頻道政策鍵與 `dm.groupChannels` 項目必須使用原始且穩定的 Slack 頻道 ID，或
`channel:<id>` 格式。OpenClaw 會將任一格式正規化為原始頻道 ID，
以供執行階段比對；`slack:`、`group:` 和 `mpim:` 前綴會導致啟動失敗。
使用者政策項目必須使用穩定的 Slack 使用者 ID；名稱、slug、顯示名稱
和電子郵件地址會導致啟動失敗。ID 必須使用 Slack 的標準大寫
前綴與主體（例如 `C0123456789` 或 `U0123456789`）；小寫形式和
相似的短格式會導致啟動失敗。企業帳戶無法啟用
`dangerouslyAllowNameMatching`。企業帳戶可以設定全域
`mentionPatterns.mode`，但 `mentionPatterns.allowIn` 和
`mentionPatterns.denyIn` 會導致啟動失敗，因為單獨的 Slack 頻道 ID 並未
限定工作區，且可能在不同工作區間重複使用。工作區安裝
會保留現有的作用域提及模式行為。每個獲接受的工作區
都會取得獨立的路由、工作階段、逐字稿、去重、歷史記錄和快取身分，
即使 Slack ID 重疊亦然。在 `message` 串流中，支援一般使用者訊息
以及由使用者產生的 `file_share` 事件；其他訊息子類型會在
授權或系統事件處理之前遭到拒絕。

企業私訊必須停用（`dm.enabled=false` 或
`dmPolicy="disabled"`），或使用 `dmPolicy="open"` 明確開放，且
有效帳戶 `allowFrom` 必須包含字面值 `"*"`。空白的
允許清單，或不含 `"*"` 的特定使用者 ID，會導致啟動失敗。配對和
個別使用者私訊允許清單會遭到拒絕，因為這些授權儲存區中的 Slack 使用者 ID
並未限定工作區。頻道與傳送者政策仍會套用至頻道訊息。

## 安裝

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 會註冊並啟用此外掛。在你設定下方的 Slack 應用程式與頻道設定之前，它不會執行任何操作。一般外掛安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 快速設定

本節中的資訊清單會建立限定於工作區的安裝。若要進行
Enterprise Grid 組織安裝，請改用專用的
[全組織資訊清單與工作流程](#enterprise-grid-org-wide-installs)。

<Tabs>
  <Tab title="Socket Mode（預設）">
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
          **Recommended** 符合 Slack 外掛的完整功能集：App Home、斜線命令、檔案、回應、釘選、群組私訊，以及表情符號／使用者群組讀取。當工作區政策限制作用域時，請選擇 **Minimal** — 它涵蓋私訊、頻道／群組歷史記錄、提及和斜線命令，但不包含檔案、回應、釘選、群組私訊（`mpim:*`）、`emoji:read` 和 `usergroups:read`。各作用域的理由及額外斜線命令等增補選項，請參閱[資訊清單與作用域檢查清單](#manifest-and-scope-checklist)。
        </Note>

        Slack 建立應用程式後：

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**：新增 `connections:write`、儲存，然後複製 App-Level Token。
        - **Install App -> Install to Workspace**：複製 Bot User OAuth Token。

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

        環境變數備援（僅限預設帳戶）：

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
        { "title": "你能做什麼？", "message": "你可以協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道最近的活動。"
        },
        { "title": "撰寫回覆草稿", "message": "協助我撰寫回覆草稿。" }
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
          **建議**符合 Slack 外掛的完整功能集；**最小化**則移除檔案、回應、釘選、群組私訊 (`mpim:*`)、`emoji:read` 和 `usergroups:read`，適用於限制嚴格的工作區。各範圍的理由請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)。
        </Note>

        <Info>
          這三個 URL 欄位（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）全都指向同一個 OpenClaw 端點。Slack 的資訊清單結構描述要求分別命名這些欄位，但 OpenClaw 會依承載資料類型進行路由，因此只需要一個 `webhookPath`（預設為 `/slack/events`）即可。在 HTTP 模式下，未設定 `slash_commands[].url` 的斜線指令會無提示地不執行任何操作。
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

        為每個帳號提供不同的 `webhookPath`（預設為 `/slack/events`），避免註冊發生衝突。
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

## 使用者身分（以真人身分發文）

使用者身分可讓 OpenClaw 以授權 Slack 應用程式的人員身分讀取及發文。`userToken` 是實際操作身分；搭配的 Slack 應用程式會透過 Socket Mode 或 HTTP Request URL 傳輸 Events API 流量。搭配的應用程式不需要機器人使用者或機器人權杖。

請依下列方式設定搭配的應用程式：

1. 在 **OAuth & Permissions -> User Token Scopes** 下，新增下列使用者範圍權限：

   - 歷史記錄：`channels:history`、`groups:history`、`im:history`、`mpim:history`
   - 對話查詢：`channels:read`、`groups:read`、`im:read`、`mpim:read`
   - 人員：`users:read`
   - 發文：`chat:write`（訊息會以授權使用者的身分發佈）
   - 開啟私訊：`im:write`、`mpim:write`

2. 在 **Event Subscriptions -> Subscribe to events on behalf of users** 下，新增下列使用者事件。請勿只將它們新增至機器人事件清單：

   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`

3. 選擇一種事件傳輸方式：

   - **Socket Mode：**啟用 Socket Mode，並使用 `connections:write` 建立應用程式層級權杖。將其設定為 `appToken`。
   - **HTTP Request URL：**將 Event Subscriptions 指向公開的 OpenClaw Slack 端點，並複製 **Basic Information -> App Credentials -> Signing Secret**。將其設定為 `signingSecret`。

4. 安裝或重新安裝應用程式，以預定使用的人員身分授權，並將產生的使用者 OAuth 權杖複製到 `userToken`。

Socket Mode 設定：

```json5
{
  channels: {
    slack: {
      identity: "user",
      userToken: "<xoxp>",
      appToken: "<xapp>",
    },
  },
}
```

HTTP 請求 URL 設定：

```json5
{
  channels: {
    slack: {
      identity: "user",
      mode: "http",
      userToken: "<xoxp>",
      signingSecret: "<signing-secret>",
      webhookPath: "/slack/events",
    },
  },
}
```

<Warning>
  私訊和群組私訊只能透過上述使用者範圍的事件訂閱運作。機器人無法加入人與人之間的 1:1 私訊，也無法插入現有的群組私訊。伴隨應用程式是不可見的底層管線：其他 Slack 成員看到的訊息來自授權的人類使用者，而非 OpenClaw 機器人。
</Warning>

OpenClaw 會自動捨棄由已解析之真人身分所發出的使用者範圍訊息事件，因此它傳送的訊息不會觸發自我回覆。

## Socket Mode 傳輸調校

OpenClaw 預設將 Socket Mode 的 Slack SDK 用戶端 pong 逾時設為 15 秒。只有在需要針對工作區或主機進行特定調校時，才覆寫傳輸設定：

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

僅將此設定用於會記錄 Slack websocket pong／伺服器 ping 逾時的 Socket Mode 工作區，或在已知會發生事件迴圈資源匱乏的主機上使用。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息與事件仍屬於應用程式狀態，而非傳輸存活訊號。

注意事項：

- `socketMode` 在 HTTP Request URL 模式下會被忽略。
- 除非遭覆寫，基礎 `channels.slack.socketMode` 設定會套用至所有 Slack 帳號。每個帳號的覆寫使用 `channels.slack.accounts.<accountId>.socketMode`；由於這是物件覆寫，請納入該帳號所需的每個 socket 調校欄位。
- 只有 `clientPingTimeout` 具有 OpenClaw 預設值（`15000`）。僅在已設定時，才會將 `serverPingTimeout` 與 `pingPongLoggingEnabled` 傳遞給 Slack SDK。
- Socket Mode 重新啟動的退避時間從約 2 秒開始，上限約為 30 秒。可復原的啟動、等待啟動及中斷連線失敗會持續重試，直到頻道停止。無效驗證、已撤銷權杖或缺少範圍等永久性帳號與認證資訊錯誤會快速失敗，而非無限期重試。

## Manifest 與範圍檢查清單

Socket Mode 與 HTTP Request URLs 使用相同的基礎 Slack 應用程式 Manifest。只有 `settings` 區塊（以及斜線命令 `url`）不同。

基礎 Manifest（Socket Mode 預設值）：

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

對於 **HTTP Request URLs 模式**，請以 HTTP 變體取代 `settings`，並在每個斜線命令中加入 `url`。需要公開 URL：

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

### 其他 Manifest 設定

呈現擴充上述預設值的不同功能。

預設資訊清單會啟用 Slack App Home 的 **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會使用 `views.publish` 發布安全的預設 Home 檢視；其中不包含任何對話承載資料或私人設定。啟用單一斜線命令模式時，命令提示會使用 `channels.slack.slashCommand.name`；使用原生命令或未使用斜線命令的安裝不會顯示該提示。**Messages** 分頁仍會為 Slack 私訊保持啟用。資訊清單也會透過 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 和 `assistant_thread_context_changed` 啟用 Slack 助理討論串；助理討論串會路由至各自的 OpenClaw 討論串工作階段，並保留 Slack 提供的討論串上下文供代理程式使用。

<AccordionGroup>
  <Accordion title="選用的原生斜線命令">

    可以使用多個[原生斜線命令](#commands-and-slash-behavior)來取代單一已設定命令，但有以下細節：

    - 請使用 `/agentstatus`，而非 `/status`，因為 `/status` 命令已保留。
    - 一個 Slack 應用程式一次最多只能註冊 25 個斜線命令（Slack 平台限制）。

    OpenClaw 會為已啟用的原生命令註冊處理常式，但 Slack 資訊清單項目仍由管理員管理，不會在執行階段同步。請手動將 `/login` 新增至資訊清單；下方範例納入此命令，而非選用的 `/side` 別名，以維持 25 個命令。`/login` 可顯示於任何位置，但只會在私人聊天或 Web UI 中產生配對碼。

    請使用[可用命令](/zh-TW/tools/slash-commands#command-list)的子集取代現有的 `features.slash_commands` 區段：

    <Tabs>
      <Tab title="Socket Mode（預設）">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "開始新的工作階段",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "重設目前的工作階段"
    },
    {
      "command": "/compact",
      "description": "壓縮工作階段上下文",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "停止目前的執行"
    },
    {
      "command": "/session",
      "description": "管理討論串繫結到期時間",
      "usage_hint": "閒置 <duration|off> 或最長存續期 <duration|off>"
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
      "description": "切換推理可見性",
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
      "description": "列出提供者／模型",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "顯示簡短說明摘要"
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
      "description": "顯示執行階段狀態，包括可用時的提供者用量／配額"
    },
    {
      "command": "/tasks",
      "description": "列出目前工作階段中進行中／最近的背景工作"
    },
    {
      "command": "/context",
      "description": "說明上下文的組合方式",
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
      "description": "在不變更工作階段上下文的情況下詢問附帶問題",
      "usage_hint": "<question>"
    },
    {
      "command": "/login",
      "description": "配對 Codex 登入",
      "usage_hint": "[codex|openai]"
    },
    {
      "command": "/usage",
      "description": "控制用量頁尾或顯示成本摘要",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用與上述 Socket Mode 相同的 `slash_commands` 清單，並在每個項目中新增 `"url": "https://gateway-host.example.com/slack/events"`。範例：

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "開始新的工作階段",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "顯示簡短說明摘要",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        請在清單中的每個命令上重複該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用的作者身分範圍（寫入操作）">
    如果你希望外送訊息使用目前啟用的代理程式身分（自訂使用者名稱和圖示），而非預設的 Slack 應用程式身分，請新增 `chat:write.customize` 機器人範圍。

    如果使用表情符號圖示，Slack 預期採用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用的使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，常見的讀取範圍如下：

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依賴 Slack 搜尋讀取）

  </Accordion>
</AccordionGroup>

## 權杖模型

- 機器人身分（預設）在 Socket Mode 中需要 `botToken` + `appToken`，在 HTTP 模式中則需要 `botToken` + `signingSecret`。
- 使用者身分在 Socket Mode 中需要 `userToken` + `appToken`，在 HTTP 模式中則需要 `userToken` + `signingSecret`。它不使用機器人權杖。
- 轉送模式需要 `botToken`，以及 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用應用程式權杖或簽署密鑰。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定中的權杖會覆寫環境變數備援值。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN` 和 `SLACK_USER_TOKEN` 的環境變數備援值都只適用於預設帳號。
- `userToken` 預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳號檢查會追蹤各認證資訊的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳號是透過 SecretRef
  或其他非行內祕密來源設定，但目前的命令／執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中，會包含 `signingSecretStatus`。Socket Mode 對機器人身分使用
  `botTokenStatus` + `appTokenStatus`，對使用者身分則使用
  `userTokenStatus` + `appTokenStatus`。

<Tip>
對於機器人身分，動作和目錄讀取可優先使用選用的使用者權杖；除非 `userTokenReadOnly: false` 允許備援，否則寫入仍會使用機器人權杖。對於 `identity: "user"`，讀取和寫入一律使用 `userToken`。
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

目前的 Slack 訊息動作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受輸入檔案預留位置中顯示的 Slack 檔案 ID，並針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.slack.dmPolicy` 控制私訊存取。`channels.slack.allowFrom` 是標準私訊允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私訊旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組私訊預設為 false）
    - `dm.groupChannels`（選用的 MPIM 允許清單）

    多帳號優先順序：

    - `channels.slack.accounts.default.allowFrom` 僅適用於 `default` 帳號。
    - 具名帳號自身未設定 `allowFrom` 時，會繼承 `channels.slack.allowFrom`。
    - 具名帳號不會繼承 `channels.slack.accounts.default.allowFrom`。

    為了相容性，仍會讀取舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom`。若能在不變更存取權的情況下進行，`openclaw doctor --fix` 會將它們遷移至 `dmPolicy` 和 `allowFrom`。

    私訊中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 下方，且設定鍵**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅使用環境變數的設定），執行階段會備援至 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱／ID 解析：

    - 當權杖存取允許時，會在啟動時解析頻道允許清單項目和私訊允許清單項目
    - 未解析的頻道名稱項目會依設定保留，但預設會在路由時忽略
    - 輸入授權和頻道路由預設以 ID 優先；直接比對使用者名稱／短代稱需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    在 `groupPolicy: "allowlist"` 下，以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）**不會**相符。頻道查詢預設以 ID 優先，因此以名稱為基礎的鍵永遠無法成功路由，且該頻道中的所有訊息都會遭到靜默封鎖。這與 `groupPolicy: "open"` 不同；在後者中，路由不需要頻道鍵，因此以名稱為基礎的鍵看似可以運作。

    一律使用 Slack 頻道 ID 作為鍵值。若要尋找該 ID：在 Slack 中以滑鼠右鍵按一下頻道 → **Copy link** — ID（`C...`）會顯示在 URL 末尾。

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

    錯誤（在 `groupPolicy: "allowlist"` 下會被靜默封鎖）：

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
    頻道訊息預設須提及才會處理。

    提及來源：

    - 明確提及應用程式（`<@botId>`）
    - Slack 使用者群組提及（`<!subteam^S...>`），前提是機器人使用者為該使用者群組的成員；需要 `usergroups:read`
    - 提及正規表示式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 回覆機器人自己的 Slack 訊息（`implicitMentions.replyToBot`）
    - 在機器人參與過的討論串中接續回覆（`implicitMentions.threadParticipation`）

    各頻道控制項（`channels.slack.channels.<id>`；名稱只能透過啟動時解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`；覆寫此頻道的帳號／聊天類型回覆模式）
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 鍵值格式：`channel:`、`id:`、`e164:`、`username:`、`name:`，或 `"*"` 萬用字元
      （舊版無前綴鍵值仍只會對應至 `id:`）

    `ignoreOtherMentions`（預設為 `false`）會捨棄提及其他使用者或使用者群組、但未提及此機器人的頻道訊息。私訊和群組私訊（MPIM）不受影響。此篩選器需要從 `auth.test` 取得已解析的機器人使用者 ID；如果無法取得該身分（例如只有使用者權杖的身分），此閘門會採開放式失敗，訊息將原樣通過。

    對於頻道和私人頻道，`allowBots` 採取保守策略：只有當傳送訊息的機器人明確列於該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少一個明確的 Slack 擁有者 ID 目前是聊天室成員時，才會接受機器人撰寫的聊天室訊息。萬用字元和顯示名稱形式的擁有者項目不符合擁有者在場條件。擁有者在場狀態使用 Slack `conversations.members`；請確認應用程式具備與聊天室類型相符的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查詢失敗，OpenClaw 會捨棄機器人撰寫的聊天室訊息。

    已接受的機器人撰寫 Slack 訊息會使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。設定 `channels.defaults.botLoopProtection` 作為預設額度，然後在工作區或頻道需要不同限制時，以 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆寫。

  </Tab>
</Tabs>

## 討論串、工作階段與回覆標籤

- 私訊路由為 `direct`；頻道路由為 `channel`；MPIM 路由為 `group`。
- Slack 路由繫結接受原始對等端 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目標格式。
- 使用預設的 `session.dmScope=main` 時，Slack 私訊會合併至代理程式的主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 一般的頂層頻道訊息會保留在各頻道工作階段中，即使 `replyToMode` 不是 `off` 亦然。
- Slack 討論串回覆會使用父層 Slack `thread_ts` 作為工作階段後綴（`:thread:<threadTs>`），即使已透過 `replyToMode="off"` 停用對外回覆討論串功能亦然。
- 當符合資格的頂層頻道根訊息預期會開始可見的 Slack 討論串時，OpenClaw 會將該根訊息植入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，使根訊息和之後的討論串回覆共用同一個 OpenClaw 工作階段。這適用於 `app_mention` 事件、明確的機器人提及或已設定的提及模式比對，以及具有非 `off` `replyToMode` 的 `requireMention: false` 頻道。
- `channels.slack.thread.historyScope` 的預設值為 `thread`；`thread.inheritParent` 的預設值為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新討論串工作階段開始時要擷取多少則既有討論串訊息（預設為 `20`；設為 `0` 可停用）。
- `channels.slack.implicitMentions.replyToBot` 控制回覆機器人自己的訊息時是否略過提及閘門（預設為 `true`）。
- `channels.slack.implicitMentions.threadParticipation` 控制在機器人曾回覆的討論串中接續回覆時，是否略過提及閘門（預設為 `true`）。將其設為 `false`，即可要求這些接續回覆必須再次明確提及。`openclaw doctor --fix` 會將先前的 `channels.slack.thread.requireExplicitMention` 鍵值遷移至此正向的標準旗標。
- 帳號覆寫位於 `channels.slack.accounts.<id>.implicitMentions`；共用預設值位於 `channels.defaults.implicitMentions`。

回覆討論串控制項：

- `channels.slack.channels.<id>.replyToMode`：Slack 頻道／私人頻道訊息的各頻道覆寫
- `channels.slack.replyToMode`：`off|first|all|batched`（預設為 `off`）
- `channels.slack.replyToModeByChatType`：每個 `direct|group|channel`
- 直接聊天的舊版備援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

若要透過 `message` 工具明確回覆 Slack 討論串，請設定 `replyBroadcast: true`，並搭配 `action: "send"` 與 `threadId` 或 `replyTo`，要求 Slack 同時將討論串回覆廣播至父頻道。這會對應至 Slack 的 `chat.postMessage` `reply_broadcast` 旗標，且只支援文字或 Block Kit 傳送，不支援媒體上傳。

當 `message` 工具呼叫在 Slack 討論串中執行並以同一頻道為目標時，OpenClaw 通常會依據有效的帳號、聊天類型或各頻道 `replyToMode`，沿用目前的 Slack 討論串。自動回覆和同頻道的 `send` 或 `upload-file` 呼叫會使用相同的各頻道覆寫。若要強制建立新的父頻道訊息，請在 `action: "send"` 或 `action: "upload-file"` 上設定 `topLevel: true`。`threadId: null` 也可作為相同的頂層退出選項。

<Note>
`replyToMode="off"` 會停用對外 Slack 回覆討論串功能，包括明確的 `[[reply_to_*]]` 標籤。這不會攤平傳入的 Slack 討論串工作階段：已發布在 Slack 討論串內的訊息仍會路由至 `:thread:<threadTs>` 工作階段。這與 Telegram 不同；在 Telegram 中，即使處於 `"off"` 模式，明確標籤仍會生效。Slack 討論串會在頻道中隱藏訊息，而 Telegram 回覆則會保持行內可見。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`ackReactionScope` 決定該表情符號實際傳送的時機。

預設情況下，確認反應會維持靜態，而 Slack 原生助理討論串狀態則以輪替的載入訊息顯示進度。設定 `messages.statusReactions.enabled: true`，即可選擇使用排隊／思考／工具／完成／錯誤的反應生命週期。

### 表情符號（`ackReaction`）

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理程式身分表情符號備援（`agents.list[].identity.emoji`，否則為 `"eyes"`／👀）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可停用 Slack 帳號或全域的反應。

### 範圍（`messages.ackReactionScope`）

Slack 提供者會從 `messages.ackReactionScope` 讀取範圍（預設為 `"group-mentions"`）。目前沒有 Slack 帳號或 Slack 頻道層級的覆寫；此值對整個閘道全域生效。

值：

- `"all"`：在私訊和群組中做出反應，包括環境聊天室事件。
- `"direct"`：僅在私訊中做出反應。
- `"group-all"`：對每則群組訊息做出反應，但不包括環境聊天室事件（不包括私訊）。
- `"group-mentions"`（預設）：在群組中做出反應，但僅限機器人被提及時（或在已選擇加入的群組可提及項目中）。**不包括私訊。**
- `"off"`／`"none"`：永不做出反應。

<Note>
預設範圍（`"group-mentions"`）不會在直接訊息或環境聊天室事件中觸發確認反應。若要在傳入的 Slack 私訊和安靜的聊天室事件中看到已設定的 `ackReaction`（例如 `"eyes"`），請將 `messages.ackReactionScope` 設為 `"all"`。Slack 提供者會在啟動時讀取 `messages.ackReactionScope`，因此需要重新啟動閘道，變更才會生效。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // 在私訊和群組中做出反應
  },
}
```

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊預覽更新。
- `progress`：產生期間顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：啟用草稿預覽時，將工具／進度更新路由至同一則已編輯的預覽訊息（預設：`true`）。設定 `false` 可保留獨立的工具／進度訊息。
- `streaming.preview.commandText`／`streaming.progress.commandText`：設為 `status`，即可保留精簡的工具進度行，同時隱藏原始命令／執行文字（預設：`raw`）。

隱藏原始命令／執行文字，同時保留精簡的進度行：

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

當 `channels.slack.streaming.mode` 為 `partial` 時，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文字串流（預設：`true`）。

Slack 原生進度任務卡可選擇在進度模式中啟用。將 `channels.slack.streaming.progress.nativeTaskCards` 設為 `true` 並搭配 `channels.slack.streaming.mode="progress"`，即可在工作執行期間傳送 Slack 原生計畫／任務卡，並在完成時更新同一張任務卡。若未設定此旗標，進度模式會維持可攜式草稿預覽行為。

- 必須有可用的回覆討論串，才會顯示原生文字串流和 Slack 助理討論串狀態。討論串選擇仍遵循 `replyToMode`。
- 當原生串流無法使用或不存在回覆討論串時，頻道、群組聊天和頂層私訊根訊息仍可使用一般草稿預覽。
- 頂層 Slack 私訊預設不使用討論串，因此不會顯示 Slack 的討論串式原生串流／狀態預覽；OpenClaw 會改為在私訊中發布並編輯草稿預覽。
- 媒體和非文字承載內容會改用一般傳遞方式。
- 媒體／錯誤最終結果會取消待處理的預覽編輯；符合資格的文字／區塊最終結果只有在能夠就地編輯預覽時才會送出。
- 如果串流在回覆途中失敗，OpenClaw 會對剩餘承載內容改用一般傳遞方式。

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

選擇啟用 Slack 原生進度任務卡片：

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
- 布林值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的舊版別名。
- 頂層的 `channels.slack.chunkMode` 和 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.chunkMode` 和 `channels.slack.streaming.nativeTransport` 的舊版別名。
- 執行階段不會讀取舊版別名；請執行 `openclaw doctor --fix`，將持久化的 Slack 串流設定改寫為標準鍵。

## 輸入中反應的備援機制

`typingReaction` 會在 OpenClaw 處理回覆期間，暫時為傳入的 Slack 訊息新增反應，並在執行完成時移除。這在討論串回覆以外的情況最實用，因為討論串回覆會使用預設的「正在輸入……」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 反應採盡力而為方式處理，並會在回覆或失敗路徑完成後自動嘗試清理。

## 語音輸入

目前若要在 Slack 中對 OpenClaw 說話，請將 Slack 音訊片段傳送給 OpenClaw 應用程式。Slackbot 的聽寫麥克風是 Slack 自有的獨立功能，並非應用程式 API。

- **[Slackbot 語音聽寫](https://slack.com/help/articles/202026038-How-to-use-Slackbot)**位於使用者與 Slackbot 的私人對話中。Slack 會將錄音轉換為 Slackbot 提示詞，但不會透過 Events API 向第三方 Slack 應用程式發出音訊檔案、聽寫事件、提示詞或輸入來源標記。OpenClaw Slack 外掛無法啟用或接收此功能。
- **[Slack 音訊片段](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)**是儲存於 Slack 的檔案，可發布至 OpenClaw 私訊、頻道或討論串。OpenClaw 會使用機器人權杖下載可存取的片段、正規化 Slack 的片段 MIME 中繼資料，並透過共用的[音訊轉錄流水線](/zh-TW/nodes/audio)傳送。建議的應用程式資訊清單包含必要的 `files:read` 範圍。

音訊片段與 Slackbot 聽寫具有不同的隱私語意：片段遵循 Slack 的檔案保留政策，且 OpenClaw 會下載片段以進行轉錄；Slack 則表示不會儲存聽寫音訊。

在具有 `requireMention: true` 的頻道中，沒有字幕的音訊片段可藉由說出已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，若未設定則使用 `messages.groupChat.mentionPatterns`）來通過閘門。OpenClaw 會先授權傳送者，再下載或轉錄片段，且僅在逐字稿相符時才接納該片段。失敗或不相符的推測性逐字稿會連同下載的片段一起捨棄，不會保留在頻道歷史記錄中。無法從語音推斷原生 Slack `@bot` 身分，因此請設定口述名稱模式，或加入文字提及。如果已啟用逐字稿回顯，回顯只會在接納後傳送。

## 媒體、分塊與傳遞

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私人 URL 下載（使用權杖驗證的要求流程）；當擷取成功且大小限制允許時，會寫入媒體儲存區。檔案預留位置包含 Slack `fileId`，讓代理程式能以 `download-file` 擷取原始檔案。

    下載會使用有界的閒置逾時與總逾時。若 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並改用檔案預留位置。

    執行階段的傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字與檔案">
    - 文字區塊使用 `channels.slack.textChunkLimit`（預設為 `8000`，上限受 Slack 本身的訊息長度限制約束）
    - `channels.slack.streaming.chunkMode="newline"` 會啟用段落優先分割
    - 檔案傳送使用 Slack 上傳 API，且可包含討論串回覆（`thread_ts`）
    - 較長的檔案說明文字會使用第一個符合 Slack 安全限制的文字區塊作為上傳留言，並將其餘區塊作為後續訊息傳送
    - 設定後，傳出媒體上限會遵循 `channels.slack.mediaMaxMb`；否則頻道傳送會使用媒體流水線中依 MIME 類型設定的預設值

  </Accordion>

  <Accordion title="傳遞目標">
    建議使用明確目標：

    - `user:<id>` 用於私訊
    - `channel:<id>` 用於頻道

    僅含文字／區塊的 Slack 私訊可直接發布至使用者 ID；檔案上傳和討論串傳送則會先透過 Slack 對話 API 開啟私訊，因為這些路徑需要具體的對話 ID。

  </Accordion>
</AccordionGroup>

## 命令與斜線行為

斜線命令會在 Slack 中顯示為單一已設定命令或多個原生命令。設定 `channels.slack.slashCommand` 以變更命令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在 Slack 應用程式中設定[額外的資訊清單設定](#additional-manifest-settings)，並改由全域設定中的 `channels.slack.commands.native: true` 或 `commands.native: true` 啟用。

- Slack 的原生命令自動模式預設為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生命令。

```txt
/help
```

原生引數選單會依優先順序呈現為下列其中一種形式：

- 3-5 個足夠簡短的選項：溢位（「...」）選單
- 超過 100 個選項，且可使用非同步選項篩選：外部選取器
- 1-2 個選項，或任何編碼值過長而無法用於選取器的選項：按鈕區塊
- 其他情況（6-100 個選項，或超過 100 個但無非同步篩選）：靜態選取選單，每個選單以 100 個選項分塊

```txt
/think
```

斜線工作階段使用 `agent:<agentId>:slack:slash:<userId>` 這類隔離鍵，並仍透過 `CommandTargetSessionKey` 將命令執行路由至目標對話工作階段。

## 原生圖表

Slack 的公開 [`data_visualization` Block Kit 區塊](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
可在訊息中呈現折線圖、長條圖、面積圖和圓餅圖。OpenClaw 會將可攜式
`presentation` `chart` 區塊對應至該原生形狀；除了正常的
`chat:write` 訊息存取權限外，不需要額外的 OAuth 範圍、
檔案上傳、影像轉譯器或 Slack 設定。

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Quarterly revenue",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Revenue", "values": [120, 145] }],
      "xLabel": "Quarter"
    }
  ]
}
```

在原生呈現之前，會強制執行 Slack 的限制：

- 標題與選用的座標軸標籤：50 個字元
- 圓餅圖：1-12 個正值區段
- 折線圖／長條圖／面積圖：1-12 個名稱不重複的資料系列，以及 1-20 個共用類別
- 區段、類別和資料系列標籤：20 個字元
- 每個資料系列都必須針對每個類別包含一個有限值；非圓餅圖的值
  可以為負數

每個原生圖表也會包含頂層文字表示，供螢幕閱讀器、
通知、工作階段鏡像，以及無法呈現該區塊的用戶端使用。傳送至其他 OpenClaw
頻道的標準呈現內容也會以文字接收相同的確定性圖表資料，除非這些頻道宣告支援
原生圖表。如果 Slack 在分階段推出期間以 `invalid_blocks` 拒絕圖表，OpenClaw
會移除遭拒的原生資料區塊、保留任何同層控制項，並將完整的圖表表示
以可見文字傳送。

Slack 目前每則訊息最多接受兩個 `data_visualization` 區塊。當
一個呈現內容包含超過兩個有效圖表時，OpenClaw 會維持其順序，
並在後續訊息中繼續進行原生呈現，每則訊息最多包含兩個
圖表。

Slack 的[開發者發布公告](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
將該區塊記載為面向應用程式的 Block Kit 功能，且未公布任何付費
方案限制。Business+/Enterprise 的資格說明適用於
Slackbot 的自動 AI 圖表產生功能，這與應用程式傳送
已結構化的 Block Kit 圖表不同。圖表是僅限訊息使用的區塊，不適用於 App
Home、互動視窗或 Canvas 內容。

## 原生表格

Slack 目前的 [`data_table` Block Kit 區塊](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
可在訊息中呈現結構化的列與欄。OpenClaw 會將明確的
可攜式 `presentation` `table` 區塊對應至 `data_table`；不會使用 Slack 的
舊版 [`table` 區塊](https://docs.slack.dev/reference/block-kit/blocks/table-block/)。
除了正常的 `chat:write` 訊息存取權限外，不需要額外的 OAuth 範圍或
Slack 設定。

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Open pipeline",
      "headers": ["Account", "Stage", "ARR"],
      "rows": [
        ["Acme", "Won", 125000],
        ["Globex", "Review", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw 會將標頭和字串儲存格對應至 Slack `raw_text` 儲存格。數值儲存格
會對應至 `raw_number`，並保留有限數值，以供原生排序
和篩選使用。若有 `rowHeaderColumnIndex`，則會將該從零起算的
欄標記為 Slack 列標頭。

在原生呈現之前，會強制執行 Slack 公布的 `data_table` 限制：

- 1-20 欄
- 1-100 個資料列，另加標頭列
- 每一列的儲存格數量相同
- 一則訊息中所有表格儲存格合計最多 10,000 個字元

只要訊息仍在合計字元限制內，多個有效的表格區塊即可使用原生方式
呈現。無法在原生範圍內呈現的表格會改為完整的確定性文字，
而不會遺失列或儲存格。如果該文字超過一則 Slack 訊息，
傳送和斜線回應會使用有序文字區塊。表格編輯會以明確的大小錯誤
失敗，而不是默默截斷現有訊息中的列。

每個從可攜式呈現內容產生的原生表格也會包含頂層
文字表示，供螢幕閱讀器、通知、工作階段鏡像，以及
無法呈現該區塊的用戶端使用。原始圖表和表格值會在備援內容中維持
字面值，因此 `<@U123>` 這類儲存格資料不會變成 Slack 提及。
如果 Slack 以 `invalid_blocks` 拒絕原生圖表或表格區塊，OpenClaw
會在一次有界復原步驟中移除所有原生資料區塊、保留有效的
同層區塊（例如按鈕和選取器），並在停用 Slack 格式設定的情況下傳送完整可見的
圖表和表格文字。斜線命令傳遞會在整個命令期間
追蹤 Slack 的五次呼叫 `response_url` 預算。在每個
回覆批次之前，它會選取符合剩餘呼叫次數的完整計畫，否則會在發布
該批次前失敗。

只有明確的 `presentation` 表格區塊會提升為原生表格。
Markdown 管線表格仍維持為編寫的文字；OpenClaw 不會猜測表格
結構或儲存格類型。現有受信任的 Slack 原生產生器可繼續
透過 `channelData.slack.blocks` 傳遞原始區塊；OpenClaw 會從有效的原始 `data_table`
儲存格衍生備援文字，而格式錯誤的自訂區塊可能會降級為其說明文字
或一般 Block Kit 備援內容。可攜式代理程式、命令列介面和外掛輸出應使用
`presentation`。

## 互動式回覆

Slack 可以呈現由代理撰寫的互動式回覆控制項，但此功能預設為停用。
對於新的代理、命令列介面和外掛輸出，建議使用共用的
`presentation` 按鈕或選取區塊。它們使用相同的 Slack 互動
路徑，同時也能在其他頻道中降級運作。

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

啟用後，代理仍可發出已棄用、僅限 Slack 的回覆指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指令會編譯成 Slack Block Kit，並透過現有的 Slack 互動事件路徑
路由點擊或選取動作。保留它們以支援舊提示詞和 Slack 專用的備援方式；新的
可攜式控制項請使用共用呈現方式。

對於新的產生端程式碼，指令編譯器 API 也已棄用：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新的 Slack 呈現控制項請使用 `presentation` 承載資料和 `buildSlackPresentationBlocks(...)`。

注意事項：

- 這是 Slack 專用的舊式 UI。其他頻道不會將 Slack Block
  Kit 指令轉換成各自的按鈕系統。
- 互動式回呼值是由 OpenClaw 產生的不透明權杖，而非代理撰寫的原始值。
- 如果產生的互動式區塊會超過 Slack Block Kit 限制，OpenClaw 會改回原始文字回覆，而不會傳送無效的區塊承載資料。

### 外掛所擁有的互動視窗提交

註冊互動處理常式的 Slack 外掛，也可以在 OpenClaw 為代理可見的系統事件
壓縮承載資料之前，接收互動視窗的 `view_submission` 和 `view_closed` 生命週期事件。
開啟 Slack 互動視窗時，請使用下列其中一種路由模式：

- 將 `callback_id` 設為 `openclaw:<namespace>:<payload>`。
- 或保留現有的 `callback_id`，並將 `pluginInteractiveData:
"<namespace>:<payload>"` 放入互動視窗的 `private_metadata`。

處理常式會以 `view_submission` 或
`view_closed` 的形式接收 `ctx.interaction.kind`、正規化後的 `inputs`，以及來自
Slack 的完整原始 `stateValues` 物件。僅使用回呼 ID 路由即可叫用外掛處理常式；若
互動視窗也應產生代理可見的系統事件，請包含現有互動視窗的 `private_metadata`
使用者／工作階段路由欄位。代理會收到精簡且經遮蔽處理的 `Slack interaction: ...`
系統事件。如果處理常式傳回 `systemEvent.summary`、`systemEvent.reference` 或
`systemEvent.data`，這些欄位會包含在該精簡事件中，讓代理能參照
外掛所擁有的儲存空間，而不會看到完整的表單承載資料。

## Slack 中的原生核准

Slack 可以透過互動式按鈕和互動操作作為原生核准用戶端，而不必改用 Web UI 或終端機。

- 執行和外掛核准可呈現為 Slack 原生 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是啟用原生執行核准用戶端及設定 DM／頻道路由的組態。
- 執行核准 DM 使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 當 Slack 已針對來源工作階段啟用為原生核准用戶端，或 `approvals.plugin` 路由至來源 Slack 工作階段或 Slack 目標時，外掛核准會使用 Slack 原生按鈕。
- 外掛核准 DM 使用來自 `channels.slack.allowFrom` 的 Slack 外掛核准者、具名帳號的 `allowFrom`，或帳號預設路由。
- 仍會強制執行核准者授權：僅限執行的核准者無法核准外掛要求，除非他們同時也是外掛核准者。

這會使用與其他頻道相同的共用核准按鈕介面。當你的 Slack 應用程式設定中啟用 `interactivity` 時，核准提示會直接在對話中呈現為 Block Kit 按鈕。
當這些按鈕存在時，它們是主要的核准使用者體驗；只有在工具結果指出聊天
核准不可用，或手動核准是唯一途徑時，OpenClaw 才應包含手動 `/approve` 命令。

組態路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時會改用 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`、`sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少能解析出一位
執行核准者時，Slack 會自動啟用原生執行核准。當能解析出 Slack 外掛核准者，且要求符合原生用戶端篩選條件時，Slack 也可以透過此原生用戶端
路徑處理原生外掛核准。將 `enabled: false` 設為明確停用 Slack 作為原生核准用戶端。將 `enabled: true` 設為
在能解析出核准者時強制啟用原生核准。停用 Slack 執行核准並不會停用
透過 `approvals.plugin` 啟用的原生 Slack 外掛核准傳遞；外掛核准
傳遞會改用 Slack 外掛核准者。

未明確設定 Slack 執行核准組態時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆寫核准者、新增篩選條件，或選擇啟用來源聊天傳遞時，才需要明確的 Slack 原生組態：

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

共用 `approvals.exec` 轉送是獨立功能。僅在執行核准提示也必須
路由至其他聊天或明確的頻外目標時使用。共用 `approvals.plugin` 轉送也是
獨立功能；只有當 Slack 能原生處理外掛核准要求時，Slack 原生傳遞才會抑制該備援方式。

同一聊天中的 `/approve` 也適用於已支援命令的 Slack 頻道和 DM。完整的核准轉送模型請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯／刪除會對應為系統事件。
- 討論串廣播（使用 "Also send to channel" 的討論串回覆）會作為一般使用者訊息處理。
- 新增／移除表情回應事件會對應為系統事件。
- 成員加入／離開、頻道建立／重新命名，以及新增／移除釘選事件會對應為系統事件。
- 選用的上線狀態輪詢可將觀察到的人類參與者從 `away` 到 `active` 的轉換，對應至該參與者最近使用且符合資格的 Slack 工作階段。預設為關閉。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道組態鍵。
- 頻道主題／用途中繼資料會被視為不受信任的內容，並可注入路由內容中。
- 適用時，討論串起始訊息和初始討論串歷程內容植入會依設定的傳送者允許清單篩選。
- 區塊動作、捷徑和互動視窗互動會發出具有豐富承載資料欄位的結構化 `Slack interaction: ...` 系統事件：
  - 區塊動作：選取值、標籤、選擇器值和 `workflow_*` 中繼資料
  - 全域捷徑：回呼和操作者中繼資料，路由至操作者的直接工作階段
  - 訊息捷徑：回呼、操作者、頻道、討論串和所選訊息內容
  - 互動視窗 `view_submission` 和 `view_closed` 事件，包含已路由的頻道中繼資料和表單輸入

在 Slack 應用程式組態中定義全域或訊息捷徑，並使用任何非空白的回呼 ID。OpenClaw 會確認相符的捷徑承載資料、套用與其他 Slack 互動相同的 DM／頻道傳送者政策，並將經清理的事件排入已路由代理工作階段的佇列。觸發 ID 和回應 URL 會從代理內容中遮蔽。

### 上線狀態事件

Slack 不會透過 Events API 或 Socket Mode 傳送上線狀態變更。OpenClaw 可改為針對訊息已通過一般 Slack 存取和路由檢查的人類參與者，輪詢 [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/)。

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off`（預設）：不使用上線狀態計時器，也不呼叫 Slack API。
- `auto`：監控最近 24 小時內活躍的 DM、MPIM 和 Slack 討論串，最多觀察 8 位人類參與者。不包含最上層頻道工作階段。
- `on`：監控相同對話，但不限制參與者人數，並包含最上層頻道工作階段。使用各頻道覆寫來強制啟用或停用某個頻道。

每個 Slack 帳號每分鐘最多輪詢 45 位不重複的使用者；OpenClaw 會使用第一次結果作為初始狀態，而不喚醒代理，並且只會在觀察到從 `away` 到 `active` 的轉換時喚醒。每個 Slack 帳號和使用者均有持久的 8 小時冷卻期，即使該使用者參與多個討論串亦同。事件只會路由至該使用者最近使用且符合資格的對話，並告知代理先查閱記憶／Wiki 和已知時區內容，再決定是否傳送一句簡短問候。代理也可以保持沉默。

機器人權杖需要 `users:read`，建議的資訊清單中已包含此項。Enterprise Grid 全組織安裝無法使用上線狀態事件。

## 組態參考

主要參考資料：[組態參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="重要的 Slack 欄位">

- 模式／驗證：`identity`、`mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`userToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM 存取：`dm.enabled`、`dmPolicy`、`allowFrom`（舊版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（緊急備援；除非需要，否則保持關閉）
- 頻道存取：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`、`implicitMentions.*`
- 討論串／歷程：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 上線狀態喚醒：`presenceEvents.mode`、`channels.*.presenceEvents.mode`（`off|auto|on`；預設 `off`）
- 傳遞：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展開預覽：`unfurlLinks`（預設：`false`）、用於 `chat.postMessage` 連結／媒體預覽控制的 `unfurlMedia`；設定 `unfurlLinks: true` 可重新選擇啟用連結預覽
- 操作／功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **鍵必須是頻道 ID**（`C12345678`），而非名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，使用名稱作為鍵會無聲失敗，因為頻道路由預設以 ID 優先。若要尋找 ID：在 Slack 中以滑鼠右鍵按一下頻道 → **Copy link** — URL 結尾的 `C...` 值即為頻道 ID。
    - `requireMention`
    - 各頻道的 `users` 允許清單
    - `messages.groupChat.visibleReplies`：一般群組／頻道請求預設為 `"automatic"`。如果你選擇啟用 `"message_tool"`，且日誌顯示助理文字但沒有 `message(action=send)` 呼叫，表示模型遺漏了可見的訊息工具路徑。在此模式下，最終文字會維持私密；請檢查閘道詳細日誌中的已抑制承載資料中繼資料，或者，如果你希望每個一般助理最終回覆都透過舊版路徑發布，請將其設為 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果其值為 `"room_event"`，允許頻道中未提及機器人的交談會作為環境脈絡，並保持靜默，除非代理程式呼叫 `message` 工具。請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

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

  <Accordion title="忽略私訊訊息">
    檢查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或舊版 `channels.slack.dm.policy`）
    - 配對核准／允許清單項目（`dmPolicy: "open"` 仍需要 `channels.slack.allowFrom: ["*"]`）
    - 群組私訊使用 MPIM 處理；請啟用 `channels.slack.dm.groupEnabled`，若已設定，請將 MPIM 納入 `channels.slack.dm.groupChannels`
    - Slack Assistant 私訊事件：詳細日誌中提及 `drop message_changed`
      通常表示 Slack 傳送了已編輯的 Assistant 討論串事件，但訊息中繼資料中
      沒有可復原的人類傳送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode 無法連線">
    請在 Slack 應用程式設定中驗證機器人與應用程式權杖，以及是否已啟用 Socket Mode。
    App-Level Token 需要 `connections:write`，且 Bot User OAuth Token
    機器人權杖必須與應用程式權杖屬於相同的 Slack 應用程式／工作區。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳號已設定，
    但目前執行階段無法解析由 SecretRef 支援的值。

    `slack socket mode failed to start; retry ...` 之類的日誌表示可復原的
    啟動失敗。缺少範圍、權杖遭撤銷和無效驗證則會快速失敗。
    `slack token mismatch ...` 日誌表示機器人權杖與應用程式權杖
    似乎屬於不同的 Slack 應用程式；請修正 Slack 應用程式認證資訊。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    驗證：

    - 簽署密鑰
    - 網路鉤子路徑
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳號具有唯一的 `webhookPath`
    - 公開 URL 會終止 TLS 並將請求轉送至閘道路徑
    - Slack 應用程式的 `request_url` 路徑與 `channels.slack.webhookPath` 完全相符（預設為 `/slack/events`）

    如果帳號快照中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳號已設定，但目前執行階段無法
    解析由 SecretRef 支援的簽署密鑰。

    重複出現 `slack: webhook path ... already registered` 日誌表示兩個 HTTP
    帳號正在使用相同的 `webhookPath`；請為每個帳號指定不同的路徑。

  </Accordion>

  <Accordion title="原生命令／斜線命令未觸發">
    確認你預期使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），並已在 Slack 中註冊相符的斜線命令
    - 或單一斜線命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不會自動建立或移除斜線命令。`commands.native: "auto"` 不會啟用 Slack 原生命令；請使用 `true`，並在 Slack 應用程式中建立相符的命令。在 HTTP 模式下，每個 Slack 斜線命令都必須包含閘道 URL。在 Socket Mode 下，命令承載資料透過 WebSocket 傳入，而 Slack 會忽略 `slash_commands[].url`。

    另請檢查 `commands.useAccessGroups`、私訊授權、頻道允許清單，
    以及各頻道的 `users` 允許清單。對於遭封鎖的斜線命令傳送者，Slack 會傳回暫時性錯誤，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件媒體參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可將下載的媒體附加至代理程式回合。音訊片段可進行轉錄，圖片檔案可通過媒體理解路徑或直接傳送至具備視覺能力的回覆模型，其他檔案則仍可作為可下載的檔案脈絡使用。

### 支援的媒體類型

| 媒體類型                       | 來源                 | 目前行為                                                                          | 備註                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音訊片段                 | Slack 檔案 URL       | 下載並透過共用音訊轉錄路由                                                        | 需要 `files:read` 以及可運作的 `tools.media.audio` 模型或命令列介面      |
| JPEG / PNG / GIF / WebP 圖片   | Slack 檔案 URL       | 下載並附加至回合，以供具備視覺能力的處理使用                                      | 每個檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                 |
| PDF 檔案                       | Slack 檔案 URL       | 下載並公開為檔案脈絡，供 `download-file` 或 `pdf` 等工具使用 | Slack 輸入不會自動將 PDF 轉換為圖片視覺輸入                               |
| 其他檔案                       | Slack 檔案 URL       | 在可能的情況下下載，並公開為檔案脈絡                                              | 二進位檔案不會視為圖片輸入                                                |
| 討論串回覆                     | 討論串起始訊息檔案   | 當回覆沒有直接媒體時，可載入根訊息檔案作為脈絡                                    | 僅含檔案的起始訊息使用附件預留位置                                        |
| 多檔案訊息                     | 多個 Slack 檔案      | 分別評估每個檔案                                                                  | Slack 處理上限為每則訊息八個檔案                                          |

### 輸入管線

當含有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 使用機器人權杖，從 Slack 的私有 URL 下載檔案。
2. 下載成功後，檔案會寫入媒體儲存區。
3. 已下載媒體的路徑與內容類型會加入輸入脈絡。
4. 音訊片段會路由至共用轉錄管線；具備圖片能力的模型／工具路徑可使用相同脈絡中的圖片附件。
5. 其他檔案仍可作為檔案中繼資料或媒體參考，供能夠處理它們的工具使用。

### 討論串根附件繼承

當訊息抵達討論串時（具有 `thread_ts` 父項）：

- 如果回覆本身沒有直接媒體，且所含的根訊息具有檔案，Slack 可載入根檔案作為討論串起始脈絡。
- 只有在建立新的討論串工作階段或重設工作階段時，才會載入根檔案。後續僅含文字的回覆會重用既有工作階段脈絡，不會將根檔案重新附加為新的媒體。
- 直接附加於回覆的附件優先於根訊息附件。
- 僅含檔案而沒有文字的根訊息會以附件預留位置表示，讓後援處理仍可納入其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件會分別透過媒體管線處理。
- 已下載的媒體參考會彙整至訊息脈絡中。
- 處理順序遵循事件承載資料中的 Slack 檔案順序。
- 其中一個附件下載失敗不會阻擋其他附件。

### 大小、下載及模型限制

- **大小上限**：預設每個檔案 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **音訊轉錄上限**：將下載的檔案傳送至轉錄提供者或命令列介面時，`tools.media.audio.maxBytes` 也適用。
- **下載失敗**：Slack 無法提供的檔案、已過期的 URL、無法存取的檔案、超過大小限制的檔案，以及 Slack 驗證／登入 HTML 回應，都會被略過，而不會回報為不支援的格式。
- **視覺模型**：當使用中的回覆模型支援視覺時，圖片分析會使用該模型；否則使用在 `agents.defaults.imageModel` 設定的圖片模型。

### 已知限制

| 情境                                          | 目前行為                                                                           | 因應措施                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Slack 檔案 URL 已過期                         | 略過檔案；不顯示錯誤                                                               | 在 Slack 中重新上傳檔案                                                       |
| 音訊轉錄無法使用                              | 片段仍保持附加，但不會產生文字稿                                                   | 設定 `tools.media.audio` 或安裝支援的本機轉錄命令列介面  |
| 無說明文字的片段未通過提及閘門                | 私下推測性轉錄後捨棄；文字稿與下載內容均會丟棄                                     | 設定口述名稱提及模式、加入輸入的機器人提及，或使用私訊                        |
| 未設定視覺模型                                | 圖片附件會儲存為媒體參考，但不會作為圖片進行分析                                   | 設定 `agents.defaults.imageModel` 或使用具備視覺能力的回覆模型    |
| 非常大的圖片（預設 > 20 MB）                  | 依大小上限略過                                                                     | 若 Slack 允許，請提高 `channels.slack.mediaMaxMb`                          |
| 轉寄／分享的附件                              | 文字及由 Slack 託管的圖片／檔案媒體會以盡力而為的方式處理                          | 直接在 OpenClaw 討論串中重新分享                                              |
| PDF 附件                                      | 儲存為檔案／媒體脈絡，不會自動透過圖片視覺路由                                     | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具分析 PDF      |

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
    頻道與群組私訊行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    設定配置與優先順序。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    指令目錄與行為。
  </Card>
</CardGroup>
