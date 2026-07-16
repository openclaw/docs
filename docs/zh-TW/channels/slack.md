---
read_when:
    - 設定 Slack 或偵錯 Slack Socket、HTTP 或中繼模式
summary: Slack 設定與執行階段行為（Socket Mode、HTTP Request URLs 與轉送模式）
title: Slack
x-i18n:
    generated_at: "2026-07-16T11:27:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack 支援透過 Slack 應用程式整合處理私訊和頻道。預設傳輸方式為 Socket Mode；也支援 HTTP Request URLs。Relay 模式適用於由受信任路由器管理 Slack 輸入流量的受管部署。

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

Socket Mode 和 HTTP Request URLs 在訊息、斜線命令、App Home 與互動功能方面具有同等功能。請依部署架構而非功能選擇。

| 考量事項                     | Socket Mode（預設）                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開閘道 URL                 | 不需要                                                                                                                                               | 需要（DNS、TLS、反向 Proxy 或通道）                                                                            |
| 輸出網路                     | 必須能連線至 `wss-primary.slack.com` 的輸出 WSS                                                                                                          | 無輸出 WS；僅限輸入 HTTPS                                                                                      |
| 所需權杖                     | Bot 權杖 + 具有 `connections:write` 的 App-Level Token                                                                                               | Bot 權杖 + Signing Secret                                                                                      |
| 開發用筆電／位於防火牆後方  | 可直接運作                                                                                                                                           | 需要公開通道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或測試環境閘道                                       |
| 水平擴充                     | 每部主機上的每個應用程式各有一個 Socket Mode 工作階段；多個閘道需要各自獨立的 Slack 應用程式                                                         | 無狀態 POST 處理常式；多個閘道複本可在負載平衡器後方共用一個應用程式                                           |
| 一個閘道上的多帳號           | 支援；每個帳號會開啟自己的 WS                                                                                                                       | 支援；每個帳號需要唯一的 `webhookPath`（預設為 `/slack/events`），以免註冊發生衝突                     |
| 斜線命令傳輸                 | 透過 WS 連線傳送；會忽略 `slash_commands[].url`                                                                                                        | Slack 會 POST 至 `slash_commands[].url`；命令必須有此欄位才能分派                                                 |
| 請求簽署                     | 不使用（驗證使用 App-Level Token）                                                                                                                  | Slack 會簽署每個請求；OpenClaw 使用 `signingSecret` 進行驗證                                               |
| 連線中斷時的復原             | 已啟用 Slack SDK 自動重新連線；OpenClaw 也會以有限退避重新啟動失敗的 Socket Mode 工作階段。會套用 Pong 逾時傳輸調校。                                | 沒有會中斷的持續連線；由 Slack 逐一重試各項請求                                                                |

<Note>
  **單一閘道主機、開發用筆電，以及可向外連線至 `*.slack.com`、但無法接受輸入 HTTPS 的內部部署網路，請選擇 Socket Mode**。

**在負載平衡器後方執行多個閘道複本、輸出 WSS 遭封鎖但允許輸入 HTTPS，或已在反向 Proxy 終止 Slack 網路鉤子時，請選擇 HTTP Request URLs**。
</Note>

<Warning>
  Slack 可為一個應用程式維持多個 Socket Mode 連線，且可能將每個承載資料傳送至任何連線。因此，共用同一個 Slack 應用程式的不同 OpenClaw 閘道需要等效的路由與授權設定。否則，請為每個閘道使用獨立的 Slack 應用程式、單一 Relay 輸入端點，或負載平衡器後方的 HTTP Request URLs。請參閱[使用 Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)。
</Warning>

### Relay 模式

Relay 模式會將 Slack 輸入流量與 OpenClaw 閘道分離。受信任的路由器管理唯一的 Slack Socket Mode 連線、選擇目的地閘道，並透過已驗證的 WebSocket 轉送具型別的事件。閘道仍會使用自己的 Bot 權杖呼叫輸出的 Slack Web API。

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

除非 Relay URL 指向 localhost，否則必須使用 `wss://`。將 Bearer 權杖和路由器路由表視為 Slack 授權邊界的一部分：經路由的事件會以已授權啟用事件的身分進入一般 Slack 訊息處理常式。路由器在 WebSocket `hello` 框架中提供的 `slack_identity` 可設定預設的輸出使用者名稱與圖示；呼叫端明確提供的身分仍具有優先權。Relay 連線會使用與 Socket Mode 相同的有限退避時序重新連線，並在每次中斷連線時清除路由器提供的身分。

### Enterprise Grid 全組織安裝

一個 Slack 帳號可以接收 Enterprise Grid 全組織安裝所涵蓋之每個工作區的訊息。請選擇直接 Socket Mode 或 HTTP Request URLs；企業帳號不支援 Relay 模式。下方兩份最小權限資訊清單僅啟用 V1 `message` 和 `app_mention` 事件路徑、即時回覆，以及由接聽程式管理的狀態表情符號回應。

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

請讓 Enterprise Grid Org Admin 或 Org Owner 核准應用程式、在組織層級安裝，並選擇此安裝涵蓋的工作區。啟動 OpenClaw 前，請確認應用程式已可在所有預定工作區中使用。為 Socket Mode 產生具有 `connections:write` 的 App-Level Token，然後從組織安裝複製 Bot 權杖。設定使用組織安裝 Bot 權杖的帳號：

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

當閘道具有公開 HTTPS 端點且不會開啟 Socket Mode 連線時，請使用 HTTP 模式。將範例 URL 替換為閘道的公開 `webhookPath` URL（預設為 `/slack/events`）：

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

請讓 Enterprise Grid Org Admin 或 Org Owner 核准應用程式、在組織層級安裝，並選擇此安裝涵蓋的工作區。Slack 驗證 Request URL 後，請複製組織安裝的 Bot 權杖，以及應用程式的 **Basic Information -> App Credentials -> Signing Secret**。使用相同的 Request URL 路徑設定企業帳號：

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

啟動時，OpenClaw 會使用 Slack `auth.test` 驗證 `enterpriseOrgInstall`。未設旗標的組織安裝權杖，或設有旗標的工作區權杖，都會導致啟動失敗。哪些工作區已授予此安裝的事實依據仍以 Slack 為準；OpenClaw 接著會將設定的頻道、使用者、私訊與提及政策套用至每個傳送的事件。Enterprise V1 會在分派前拒絕所有由 Bot 建立的 `message` 和 `app_mention` 事件，無論 `allowBots` 為何，因為組織安裝不會提供穩定且包含工作區限定資訊的 Bot 身分，以防止迴圈。

企業支援刻意限制於直接 Socket Mode 或 HTTP `message` 和 `app_mention` 事件及其即時回覆。企業帳號無法使用 Relay 模式、斜線命令、互動功能、App Home、表情符號回應事件接聽程式、釘選、Slack 動作工具、Slack 原生核准、繫結、佇列或排程傳送，以及主動傳送。透過由接聽程式管理的 Slack 用戶端可支援輸出確認、輸入中狀態和狀態表情符號回應，且需要 `reactions:write`；輸入表情符號回應通知與表情符號回應動作工具仍無法使用。

即時回覆會沿用標準 Slack 傳送行為來處理分段、
媒體、中繼資料、身分備援、連結預覽和回條，但僅限於
經驗證且由接聽器擁有的用戶端仍處於作用中事件回合期間。
記憶體內的傳送佇列與討論串參與記錄會依該事件的工作區分隔；
用戶端本身絕不會被序列化或持久化。

頻道政策鍵與 `dm.groupChannels` 項目必須使用原始且穩定的 Slack 頻道 ID，或
`channel:<id>` 格式。OpenClaw 會將這兩種格式正規化為原始頻道 ID，
以供執行階段比對；`slack:`、`group:` 和 `mpim:` 前綴會導致啟動失敗。
使用者政策項目必須使用穩定的 Slack 使用者 ID；名稱、slug、顯示名稱
和電子郵件地址會導致啟動失敗。ID 必須使用 Slack 的標準大寫
前綴與主體（例如 `C0123456789` 或 `U0123456789`）；小寫及
外觀相似的短格式會導致啟動失敗。Enterprise 帳號無法啟用
`dangerouslyAllowNameMatching`。Enterprise 帳號可以設定全域
`mentionPatterns.mode`，但 `mentionPatterns.allowIn` 和
`mentionPatterns.denyIn` 會導致啟動失敗，因為未限定工作區的 Slack 頻道 ID
可能在不同工作區中重複使用。工作區安裝會保留現有的
限定範圍提及模式行為。每個獲接受的工作區都會取得獨立的路由、
工作階段、對話記錄、去重、歷史記錄和快取身分，
即使 Slack ID 重疊亦然。在 `message` 串流中，支援一般使用者訊息
及由使用者建立的 `file_share` 事件；其他訊息子類型會在
授權或系統事件處理前遭到拒絕。

Enterprise 私訊必須停用（`dm.enabled=false` 或
`dmPolicy="disabled"`），或透過 `dmPolicy="open"` 明確開放，且
有效帳號 `allowFrom` 必須包含字面值 `"*"`。空白
允許清單或未包含 `"*"` 的使用者特定 ID 會導致啟動失敗。配對及
每位使用者的私訊允許清單會遭到拒絕，因為這些授權儲存區中的 Slack 使用者 ID
未限定工作區。頻道與傳送者政策仍會套用至頻道訊息。

## 安裝

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 會註冊並啟用此外掛。在你設定下方的 Slack 應用程式和頻道設定前，它不會執行任何操作。如需一般外掛安裝規則，請參閱[外掛](/zh-TW/tools/plugin)。

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
          **Recommended** 符合 Slack 外掛的完整功能集：App Home、斜線命令、檔案、回應、釘選、群組私訊，以及表情符號／使用者群組讀取。當工作區政策限制範圍時，請選擇 **Minimal**——它涵蓋私訊、頻道／群組歷史記錄、提及和斜線命令，但不包含檔案、回應、釘選、群組私訊（`mpim:*`）、`emoji:read` 和 `usergroups:read`。如需各範圍的理由及額外斜線命令等附加選項，請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)。
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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="建立新的 Slack 應用程式">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選取你的工作區 → 貼上下方其中一份資訊清單 → 將 `https://gateway-host.example.com/slack/events` 替換為你的公開閘道 URL → **Next** → **Create**。

        <CodeGroup>

```json Recommended
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

```json 最小
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
      "assistant_description": "OpenClaw 將 Slack 助理討論串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道最近的活動。"
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
          **建議**符合 Slack 外掛的完整功能集；**最小**則會針對限制較嚴格的工作區移除檔案、回應、釘選、群組私訊（`mpim:*`）、`emoji:read` 及 `usergroups:read`。如需各範圍的理由，請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)。
        </Note>

        <Info>
          這三個 URL 欄位（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）全都指向同一個 OpenClaw 端點。Slack 的資訊清單結構描述要求分別命名這些欄位，但 OpenClaw 會依承載資料類型進行路由，因此只需單一 `webhookPath`（預設為 `/slack/events`）即可。在 HTTP 模式下，沒有 `slash_commands[].url` 的斜線命令會在不顯示任何訊息的情況下不執行任何動作。
        </Info>

        Slack 建立應用程式後：

        - **Basic Information → App Credentials**：複製 **Signing Secret**，用於驗證要求。
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
        多帳號 HTTP 請使用不重複的網路鉤子路徑

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

在 Socket Mode 中，OpenClaw 預設會將 Slack SDK 用戶端的 pong 逾時設為 15 秒。只有在需要針對工作區或主機進行特定調校時，才覆寫傳輸設定：

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

只有當 Socket Mode 工作區記錄了 Slack WebSocket pong／伺服器 ping 逾時，或執行於已知會發生事件迴圈飢餓的主機時，才使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息與事件仍屬於應用程式狀態，而非傳輸存活訊號。

注意事項：

- `socketMode` 在 HTTP Request URL 模式下會被忽略。
- 除非遭到覆寫，基礎 `channels.slack.socketMode` 設定會套用至所有 Slack 帳號。每個帳號的覆寫使用 `channels.slack.accounts.<accountId>.socketMode`；由於這是物件覆寫，因此請納入該帳號所需的每個 Socket 調校欄位。
- 只有 `clientPingTimeout` 具有 OpenClaw 預設值（`15000`）。只有在設定後，`serverPingTimeout` 與 `pingPongLoggingEnabled` 才會傳遞給 Slack SDK。
- Socket Mode 的重新啟動退避時間約從 2 秒開始，最高約為 30 秒。可復原的啟動、等待啟動及中斷連線失敗會持續重試，直到頻道停止為止。無效驗證、已撤銷權杖或缺少範圍等永久性帳號及認證資訊錯誤會快速失敗，而不會無限重試。

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
      "assistant_description": "OpenClaw 將 Slack 助理討論串連接至 OpenClaw 代理程式。",
      "suggested_prompts": [
        { "title": "你能做什麼？", "message": "你能協助我處理什麼？" },
        {
          "title": "摘要此頻道",
          "message": "摘要此頻道最近的活動。"
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

若使用 **HTTP Request URL 模式**，請將 `settings` 替換為 HTTP 變體，並在每個斜線命令中新增 `url`。需要公開 URL：

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

啟用擴充上述預設值的不同功能。

預設資訊清單會啟用 Slack App Home 的 **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會使用 `views.publish` 發布安全的預設 Home 檢視；其中不包含對話承載資料或私人設定。啟用單一斜線命令模式時，命令提示會使用 `channels.slack.slashCommand.name`；使用原生命令或不使用斜線命令的安裝則會省略該提示。**Messages** 分頁仍會為 Slack 私訊保持啟用。資訊清單也會透過 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 及 `assistant_thread_context_changed` 啟用 Slack 助理討論串；助理討論串會路由至各自的 OpenClaw 討論串工作階段，並讓代理程式持續存取 Slack 提供的討論串內容。

<AccordionGroup>
  <Accordion title="選用的原生斜線命令">

    可使用多個[原生斜線命令](#commands-and-slash-behavior)取代單一設定命令，但需注意以下細節：

    - 請使用 `/agentstatus`，而非 `/status`，因為 `/status` 命令為保留命令。
    - 一個 Slack 應用程式一次最多只能註冊 25 個斜線命令（Slack 平台限制）。

    請使用[可用命令](/zh-TW/tools/slash-commands#command-list)的子集，替換現有的 `features.slash_commands` 區段：

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
      "description": "壓縮工作階段的上下文",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "停止目前的執行"
    },
    {
      "command": "/session",
      "description": "管理討論串綁定的到期時間",
      "usage_hint": "閒置 <duration|off> 或最長期限 <duration|off>"
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
      "description": "切換推理內容的顯示狀態",
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
      "description": "顯示目前代理程式現在可使用的項目",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "顯示執行階段狀態，包括可用時的供應商用量／配額"
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
      "description": "提出旁支問題而不變更工作階段上下文",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "提出旁支問題而不變更工作階段上下文",
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
      <Tab title="HTTP 請求 URL">
        使用與上方 Socket Mode 相同的 `slash_commands` 清單，並在每個項目中加入 `"url": "https://gateway-host.example.com/slack/events"`。例如：

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
      "description": "顯示簡短的說明摘要",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        在清單中的每個命令上重複該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用的作者身分範圍（寫入操作）">
    如果你希望傳出訊息使用作用中的代理程式身分（自訂使用者名稱和圖示），而非預設的 Slack 應用程式身分，請新增 `chat:write.customize` 機器人範圍。

    如果你使用表情符號圖示，Slack 預期採用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用的使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，常見的讀取範圍為：

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
- 轉送模式需要 `botToken`，以及 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用應用程式權杖或簽署密鑰。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定中的權杖會覆寫環境變數備援值。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN` 和 `SLACK_USER_TOKEN` 的環境變數備援值各自僅適用於預設帳號。
- `userToken` 預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳號檢查會追蹤每組認證資訊的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳號透過 SecretRef
  或其他非內嵌密鑰來源進行設定，但目前的命令／執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要的組合為 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作／目錄讀取，設定使用者權杖後可優先使用。對於寫入，仍優先使用機器人權杖；僅當 `userTokenReadOnly: false` 且機器人權杖不可用時，才允許使用使用者權杖寫入。
</Tip>

## 動作與閘門

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組       | 預設值 |
| ---------- | ------- |
| messages   | 啟用 |
| reactions  | 啟用 |
| pins       | 啟用 |
| memberInfo | 啟用 |
| emojiList  | 啟用 |

目前的 Slack 訊息動作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受傳入檔案預留位置中顯示的 Slack 檔案 ID，並針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.slack.dmPolicy` 控制 DM 存取。`channels.slack.allowFrom` 是標準的 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    DM 旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組 DM 預設為 false）
    - `dm.groupChannels`（選用的 MPIM 允許清單）

    多帳號優先順序：

    - `channels.slack.accounts.default.allowFrom` 僅適用於 `default` 帳號。
    - 具名帳號在自身的 `allowFrom` 未設定時，會繼承 `channels.slack.allowFrom`。
    - 具名帳號不會繼承 `channels.slack.accounts.default.allowFrom`。

    為了相容性，仍會讀取舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom`。當可在不變更存取權的情況下進行時，`openclaw doctor --fix` 會將它們移轉至 `dmPolicy` 和 `allowFrom`。

    DM 中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 下方，且設定鍵**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅使用環境變數的設定），執行階段會退回使用 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱／ID 解析：

    - 當權杖存取權允許時，頻道允許清單項目與 DM 允許清單項目會在啟動時解析
    - 無法解析的頻道名稱項目會依設定保留，但預設會在路由時忽略
    - 傳入授權和頻道路由預設以 ID 優先；直接比對使用者名稱／slug 需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    使用名稱的鍵（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不會**比對成功。頻道查詢預設以 ID 優先，因此使用名稱的鍵永遠無法成功路由，且該頻道中的所有訊息都會遭到無聲封鎖。這與 `groupPolicy: "open"` 不同；在後者中，路由不需要頻道鍵，因此使用名稱的鍵看似可以運作。

    一律使用 Slack 頻道 ID 作為鍵。尋找方式：在 Slack 中以滑鼠右鍵按一下頻道 → **Copy link** — ID（`C...`）會顯示在 URL 末尾。

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

    錯誤（在 `groupPolicy: "allowlist"` 下會遭到無聲封鎖）：

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
    頻道訊息預設需要提及才會觸發。

    提及來源：

    - 明確提及應用程式（`<@botId>`）
    - 當機器人使用者是該使用者群組的成員時，Slack 使用者群組提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及的規則運算式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆機器人討論串行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    各頻道控制項（`channels.slack.channels.<id>`；名稱僅能透過啟動時解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`；覆寫此頻道的帳號／聊天類型回覆模式）
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 鍵格式：`channel:`、`id:`、`e164:`、`username:`、`name:` 或 `"*"` 萬用字元
      （舊版無前綴鍵仍僅會對應至 `id:`）

    `ignoreOtherMentions`（預設為 `false`）會捨棄提及其他使用者或使用者群組、但未提及此機器人的頻道訊息。DM 和群組 DM（MPIM）不受影響。此篩選器需要從 `auth.test` 取得已解析的機器人使用者 ID；如果無法取得該身分（例如只有使用者權杖的身分），此閘門會以開放方式失敗，訊息將不經變更直接通過。

    `allowBots` 對頻道和私人頻道採取保守策略：只有在傳送訊息的機器人明確列於該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少有一個明確的 Slack 擁有者 ID 目前是聊天室成員時，才會接受機器人撰寫的聊天室訊息。萬用字元和以顯示名稱指定的擁有者項目不符合擁有者在場條件。擁有者在場狀態使用 Slack `conversations.members`；請確認應用程式具備與聊天室類型相符的讀取範圍（公開頻道使用 `channels:read`，私人頻道使用 `groups:read`）。如果成員查詢失敗，OpenClaw 會捨棄機器人撰寫的聊天室訊息。

    已接受的機器人撰寫 Slack 訊息會使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。使用 `channels.defaults.botLoopProtection` 設定預設額度，若工作區或頻道需要不同限制，再以 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆寫。

  </Tab>
</Tabs>

## 討論串、工作階段與回覆標籤

- DM 會路由為 `direct`；頻道會路由為 `channel`；MPIM 會路由為 `group`。
- Slack 路由繫結接受原始對等端 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目標格式。
- 使用預設的 `session.dmScope=main` 時，Slack DM 會合併至代理程式的主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 一般的頂層頻道訊息會留在各頻道的工作階段，即使 `replyToMode` 並非 `off`。
- Slack 討論串回覆會使用父層 Slack `thread_ts` 作為工作階段後綴（`:thread:<threadTs>`），即使已使用 `replyToMode="off"` 停用外送回覆的討論串功能。
- 當符合資格的頂層頻道根訊息預期會開啟可見的 Slack 討論串時，OpenClaw 會將其植入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，讓根訊息與後續討論串回覆共用同一個 OpenClaw 工作階段。這適用於 `app_mention` 事件、明確提及機器人或符合已設定提及模式的情況，以及 `requireMention: false` 頻道中具有非 `off` `replyToMode` 的情況。
- `channels.slack.thread.historyScope` 的預設值為 `thread`；`thread.inheritParent` 的預設值為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新討論串工作階段啟動時要擷取多少則既有討論串訊息（預設為 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設為 `false`）：當設為 `true` 時，抑制隱含的討論串提及，讓機器人只回應討論串內明確的 `@bot` 提及，即使機器人已參與該討論串亦同。若未啟用此設定，機器人已參與的討論串中的回覆會略過 `requireMention` 閘門。

回覆討論串控制項：

- `channels.slack.channels.<id>.replyToMode`：針對 Slack 頻道／私人頻道訊息的各頻道覆寫
- `channels.slack.replyToMode`：`off|first|all|batched`（預設為 `off`）
- `channels.slack.replyToModeByChatType`：每個 `direct|group|channel`
- 直接聊天的舊版備援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

若要從 `message` 工具明確回覆 Slack 討論串，請設定 `replyBroadcast: true`，並搭配 `action: "send"` 和 `threadId` 或 `replyTo`，要求 Slack 同時將討論串回覆廣播至父層頻道。這會對應至 Slack 的 `chat.postMessage` `reply_broadcast` 旗標，且僅支援文字或 Block Kit 傳送，不支援媒體上傳。

當 `message` 工具呼叫在 Slack 討論串內執行且目標為同一頻道時，OpenClaw 通常會依據有效帳號、聊天類型或各頻道的 `replyToMode`，沿用目前的 Slack 討論串。自動回覆以及同頻道的 `send` 或 `upload-file` 呼叫也會使用相同的各頻道覆寫。請在 `action: "send"` 或 `action: "upload-file"` 上設定 `topLevel: true`，以強制建立新的父層頻道訊息。`threadId: null` 也會被視為相同的頂層退出設定。

<Note>
`replyToMode="off"` 會停用外送 Slack 回覆的討論串功能，包括明確的 `[[reply_to_*]]` 標籤。它不會將傳入的 Slack 討論串工作階段扁平化：已張貼於 Slack 討論串內的訊息仍會路由至 `:thread:<threadTs>` 工作階段。這與 Telegram 不同；在 Telegram 中，即使處於 `"off"` 模式，明確標籤仍會生效。Slack 討論串會將訊息隱藏於頻道之外，而 Telegram 回覆則會保持顯示於內文中。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`ackReactionScope` 決定該表情符號實際傳送的_時機_。

依預設，確認表情符號會維持不變，而 Slack 原生助理討論串狀態會透過輪替的載入訊息顯示進度。設定 `messages.statusReactions.enabled: true` 可選擇啟用佇列中／思考中／工具／完成／錯誤的反應生命週期。

### 表情符號（`ackReaction`）

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理程式身分表情符號備援（`agents.list[].identity.emoji`，否則為 `"eyes"` / 👀）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可針對 Slack 帳號或全域停用反應。

### 範圍（`messages.ackReactionScope`）

Slack 提供者會從 `messages.ackReactionScope` 讀取範圍（預設為 `"group-mentions"`）。目前沒有 Slack 帳號層級或 Slack 頻道層級的覆寫；此值對閘道全域生效。

值：

- `"all"`：在 DM 和群組中加入反應，包括環境聊天室事件。
- `"direct"`：僅在 DM 中加入反應。
- `"group-all"`：對每則群組訊息加入反應，但環境聊天室事件除外（不含 DM）。
- `"group-mentions"`（預設）：在群組中加入反應，但僅限機器人被提及時（或在已選擇加入的群組可提及項目中）。**不包含 DM。**
- `"off"` / `"none"`：永不加入反應。

<Note>
預設範圍（`"group-mentions"`）不會在直接訊息或環境聊天室事件中觸發確認反應。若要在傳入的 Slack DM 和安靜聊天室事件中看到已設定的 `ackReaction`（例如 `"eyes"`），請將 `messages.ackReactionScope` 設為 `"all"`。Slack 提供者會在啟動時讀取 `messages.ackReactionScope`，因此需要重新啟動閘道，變更才會生效。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // 在 DM 和群組中加入反應
  },
}
```

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊預覽更新。
- `progress`：產生期間顯示進度狀態文字，之後再傳送最終文字。
- `streaming.preview.toolProgress`：草稿預覽啟用時，將工具／進度更新路由至同一則經編輯的預覽訊息（預設：`true`）。設定 `false` 可保留個別的工具／進度訊息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：設為 `status`，可在隱藏原始命令／執行文字的同時保留精簡的工具進度行（預設：`raw`）。

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

當 `channels.slack.streaming.mode` 為 `partial` 時，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文字串流（預設：`true`）。

進度模式中的 Slack 原生進度工作卡片須選擇啟用。將 `channels.slack.streaming.progress.nativeTaskCards` 設為 `true` 並搭配 `channels.slack.streaming.mode="progress"`，可在工作執行期間傳送 Slack 原生計畫／工作卡片，並在完成時更新同一張工作卡片。若未設定此旗標，進度模式會維持可攜式草稿預覽行為。

- 必須有可用的回覆討論串，原生文字串流和 Slack 助理討論串狀態才會顯示。討論串選擇仍遵循 `replyToMode`。
- 當原生串流無法使用或不存在回覆討論串時，頻道、群組聊天和頂層 DM 根訊息仍可使用一般草稿預覽。
- 頂層 Slack DM 預設不使用討論串，因此不會顯示 Slack 討論串樣式的原生串流／狀態預覽；OpenClaw 會改為在 DM 中張貼並編輯草稿預覽。
- 媒體和非文字承載內容會退回一般傳送方式。
- 媒體／錯誤最終結果會取消待處理的預覽編輯；符合資格的文字／區塊最終結果只有在能夠就地編輯預覽時才會送出。
- 如果串流在回覆途中失敗，OpenClaw 會針對其餘承載內容退回一般傳送方式。

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
- 布林值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的舊版別名。
- 頂層 `channels.slack.chunkMode` 和 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.chunkMode` 和 `channels.slack.streaming.nativeTransport` 的舊版別名。
- 執行階段不會讀取舊版別名；請執行 `openclaw doctor --fix`，將持久化的 Slack 串流設定重寫為標準鍵。

## 輸入中反應備援

`typingReaction` 會在 OpenClaw 處理回覆期間，暫時對傳入的 Slack 訊息加入反應，並在執行完成時移除。這在討論串回覆以外的情況最有用，因為討論串回覆會使用預設的「正在輸入...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 此反應採盡力而為方式，並會在回覆或失敗路徑完成後自動嘗試清理。

## 語音輸入

目前若要在 Slack 中對 OpenClaw 說話，請將 Slack 音訊剪輯傳送至 OpenClaw 應用程式。Slackbot 的聽寫麥克風是 Slack 擁有的獨立功能，並非應用程式 API。

- **[Slackbot 語音聽寫](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** 位於使用者與 Slackbot 的私人對話中。Slack 會將錄音轉換為 Slackbot 提示，但不會透過 Events API 向第三方 Slack 應用程式發出音訊檔案、聽寫事件、提示或輸入來源標記。OpenClaw Slack 外掛無法啟用或接收此功能。
- **[Slack 音訊剪輯](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** 是儲存於 Slack 的檔案，可張貼至 OpenClaw 私訊、頻道或討論串。OpenClaw 使用機器人權杖下載可存取的剪輯、正規化 Slack 的剪輯 MIME 中繼資料，並將其傳送至共用的[音訊轉錄管線](/zh-TW/nodes/audio)。建議的應用程式資訊清單包含必要的 `files:read` 範圍。

音訊剪輯與 Slackbot 聽寫具有不同的隱私語意：剪輯遵循 Slack 檔案保留政策，且 OpenClaw 會下載剪輯以進行轉錄；Slack 則表示聽寫音訊不會儲存。

在具有 `requireMention: true` 的頻道中，沒有字幕的音訊剪輯可透過說出已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）來通過閘門。OpenClaw 會先授權傳送者，再下載或轉錄剪輯，且只有在轉錄文字相符時才允許其通過。失敗或不相符的推測性轉錄文字會連同下載的剪輯一起捨棄；不會保留在頻道歷程記錄中。無法從語音推斷原生 Slack `@bot` 身分，因此請設定口述名稱模式或加入輸入的提及。若已啟用轉錄文字回顯，只有在允許通過後才會傳送回顯。

## 媒體、分塊與傳遞

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私人 URL 下載（使用權杖驗證的請求流程），並在擷取成功且大小限制允許時寫入媒體儲存區。檔案預留位置包含 Slack `fileId`，讓代理程式可使用 `download-file` 擷取原始檔案。

    下載採用有界的閒置逾時與總逾時。若 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並後援至檔案預留位置。

    執行階段的傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字與檔案">
    - 文字區塊使用 `channels.slack.textChunkLimit`（預設為 `8000`，上限為 Slack 本身的訊息長度限制）
    - `channels.slack.streaming.chunkMode="newline"` 啟用段落優先分割
    - 檔案傳送使用 Slack 上傳 API，並可包含討論串回覆（`thread_ts`）
    - 較長的檔案說明文字會使用第一個符合 Slack 安全限制的文字區塊作為上傳留言，並將其餘區塊作為後續訊息傳送
    - 設定時，傳出媒體上限遵循 `channels.slack.mediaMaxMb`；否則頻道傳送會使用媒體管線依 MIME 類型設定的預設值

  </Accordion>

  <Accordion title="傳遞目標">
    建議使用的明確目標：

    - `user:<id>` 用於私訊
    - `channel:<id>` 用於頻道

    僅含文字／區塊的 Slack 私訊可直接張貼至使用者 ID；檔案上傳與討論串傳送則會先透過 Slack 對話 API 開啟私訊，因為這些路徑需要具體的對話 ID。

  </Accordion>
</AccordionGroup>

## 命令與斜線行為

斜線命令會在 Slack 中顯示為單一已設定命令或多個原生命令。設定 `channels.slack.slashCommand` 可變更命令預設值：

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

原生引數選單會依下列優先順序呈現：

- 3–5 個長度足夠短的選項：溢位（"..."）選單
- 超過 100 個選項，且可使用非同步選項篩選：外部選取器
- 1–2 個選項，或任何編碼值過長而無法放入選取器的選項：按鈕區塊
- 其他情況（6–100 個選項，或超過 100 個選項但無非同步篩選）：靜態選取選單，每個選單以 100 個選項分塊

```txt
/think
```

斜線工作階段使用如 `agent:<agentId>:slack:slash:<userId>` 的隔離金鑰，且仍會使用 `CommandTargetSessionKey` 將命令執行路由至目標對話工作階段。

## 原生圖表

Slack 的公開 [`data_visualization` Block Kit 區塊](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
可在訊息中呈現折線圖、長條圖、面積圖和圓餅圖。OpenClaw 會將可攜式
`presentation` `chart` 區塊對應至該原生結構；除了一般
`chat:write` 訊息存取權限外，不需要額外的 OAuth 範圍、
檔案上傳、影像轉譯器或 Slack 設定。

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "季度營收",
      "categories": ["第 1 季", "第 2 季"],
      "series": [{ "name": "營收", "values": [120, 145] }],
      "xLabel": "季度"
    }
  ]
}
```

原生呈現前會強制執行 Slack 的限制：

- 標題與選用的座標軸標籤：50 個字元
- 圓餅圖：1–12 個正值區段
- 折線圖／長條圖／面積圖：1–12 個名稱唯一的數列，以及 1–20 個共用類別
- 區段、類別與數列標籤：20 個字元
- 每個數列都必須針對每個類別包含一個有限值；非圓餅圖的值
  可以是負數

每個原生圖表也會帶有頂層文字表示，供螢幕閱讀器、
通知、工作階段鏡像，以及無法呈現該區塊的用戶端使用。傳送至其他
OpenClaw 頻道的標準簡報會以文字接收相同的確定性圖表資料，除非
頻道宣告支援原生圖表。若 Slack 在分階段推出期間以
`invalid_blocks` 拒絕圖表，OpenClaw 會移除遭拒絕的原生資料區塊、
保留任何同層控制項，並以可見文字傳送完整的圖表表示。

Slack 目前每則訊息最多接受兩個 `data_visualization` 區塊。當
簡報包含超過兩個有效圖表時，OpenClaw 會維持其順序，
並在後續訊息中繼續原生呈現，每則訊息最多包含兩個
圖表。

Slack 的[開發者發布公告](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
將此區塊記載為面向應用程式的 Block Kit 功能，且未公布付費
方案限制。Business+/Enterprise 的適用資格說明是針對
Slackbot 的自動 AI 圖表產生功能，這與應用程式傳送
已結構化的 Block Kit 圖表不同。圖表是僅供訊息使用的區塊，不適用於 App
Home、互動視窗或 Canvas 內容。

## 原生表格

Slack 目前的 [`data_table` Block Kit 區塊](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
可在訊息中呈現結構化的資料列與資料欄。OpenClaw 會將明確的
可攜式 `presentation` `table` 區塊對應至 `data_table`；不會使用 Slack 的
舊版 [`table` 區塊](https://docs.slack.dev/reference/block-kit/blocks/table-block/)。
除了一般 `chat:write` 訊息存取權限外，不需要額外的 OAuth 範圍或
Slack 設定。

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
與篩選。若存在 `rowHeaderColumnIndex`，會將該以零為起點的
資料欄標記為 Slack 資料列標頭。

原生呈現前會強制執行 Slack 公布的 `data_table` 限制：

- 1–20 個資料欄
- 1–100 個資料列，另加標頭列
- 每個資料列的儲存格數量必須相同
- 一則訊息中所有表格儲存格合計最多 10,000 個字元

只要訊息仍在合計字元限制內，多個有效的表格區塊便可
以原生方式呈現。無法在原生範圍內呈現的表格會轉換為完整且
確定性的文字，而不會遺失資料列或儲存格。若該文字超過一則 Slack 訊息，
傳送與斜線回應會使用依序排列的文字區塊。表格編輯會以明確的大小錯誤失敗，
而不會默默截斷現有訊息中的資料列。

每個從可攜式簡報產生的原生表格也會帶有頂層
文字表示，供螢幕閱讀器、通知、工作階段鏡像，以及
無法呈現該區塊的用戶端使用。原始圖表與表格值會在後援內容中保持字面值，
因此 `<@U123>` 之類的儲存格資料不會變成 Slack 提及。
若 Slack 以 `invalid_blocks` 拒絕原生圖表或表格區塊，OpenClaw
會在單一有界復原步驟中移除所有原生資料區塊，保留
按鈕和選取器等有效的同層區塊，並在停用 Slack 格式設定的情況下，
傳送完整且可見的圖表與表格文字。斜線命令傳遞
會在整個命令期間追蹤 Slack 的五次呼叫 `response_url` 預算。每批
回覆前，它會選取符合剩餘呼叫次數的完整計畫，否則會在張貼
該批次前失敗。

只有明確的 `presentation` 表格區塊會升級為原生表格。
Markdown 管線表格會維持原本編寫的文字；OpenClaw 不會猜測表格
結構或儲存格類型。現有受信任的 Slack 原生產生器可繼續
透過 `channelData.slack.blocks` 傳遞原始區塊；OpenClaw 會從有效的原始
`data_table` 儲存格衍生後援文字，而格式錯誤的自訂區塊可能
降級為其說明文字或一般 Block Kit 後援。可攜式代理程式、命令列介面
及外掛輸出應使用 `presentation`。

## 互動式回覆

Slack 可呈現由代理程式編寫的互動式回覆控制項，但此功能預設為停用。
新的代理程式、命令列介面與外掛輸出應優先使用共用的
`presentation` 按鈕或選取區塊。它們使用相同的 Slack 互動
路徑，也能在其他頻道上降級運作。

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

或只為一個 Slack 帳號啟用：

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

啟用後，代理程式仍可發出已棄用、僅供 Slack 使用的回覆指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指令會編譯成 Slack Block Kit，並透過現有的 Slack 互動事件
路徑將點擊或選取操作傳回。保留這些指令以支援舊提示和 Slack 專用的
逃生路徑；新的可攜式控制項應使用共用簡報。

指令編譯器 API 也已不建議用於新的產生器程式碼：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新的 Slack 呈現控制項請使用 `presentation` 承載內容與
`buildSlackPresentationBlocks(...)`。

注意事項：

- 這是 Slack 專用的舊版 UI。其他頻道不會將 Slack Block
  Kit 指令轉換成各自的按鈕系統。
- 互動回呼值是由 OpenClaw 產生的不透明權杖，而非代理程式撰寫的原始值。
- 如果產生的互動區塊會超過 Slack Block Kit 限制，OpenClaw 會改用原始文字回覆，而不會傳送無效的區塊承載資料。

### 外掛擁有的互動視窗提交

註冊互動處理常式的 Slack 外掛，也能在 OpenClaw 為代理程式可見的系統事件壓縮
承載資料之前，接收互動視窗的 `view_submission` 和 `view_closed` 生命週期事件。
開啟 Slack 互動視窗時，請使用下列其中一種路由模式：

- 將 `callback_id` 設為 `openclaw:<namespace>:<payload>`。
- 或者保留現有的 `callback_id`，並將 `pluginInteractiveData:
"<namespace>:<payload>"` 放入互動視窗的 `private_metadata`。

處理常式會接收值為 `view_submission` 或
`view_closed` 的 `ctx.interaction.kind`、正規化的 `inputs`，以及來自
Slack 的完整原始 `stateValues` 物件。僅使用回呼 ID 路由就足以叫用外掛處理常式；如果
互動視窗還應產生代理程式可見的系統事件，請包含現有互動視窗的 `private_metadata`
使用者／工作階段路由欄位。代理程式會接收經壓縮及遮蔽的 `Slack interaction: ...`
系統事件。如果處理常式傳回 `systemEvent.summary`、`systemEvent.reference` 或
`systemEvent.data`，這些欄位會包含在該壓縮事件中，讓代理程式能參照
外掛擁有的儲存空間，而不會看到完整的表單承載資料。

## Slack 中的原生核准

Slack 可以透過互動按鈕和互動操作，作為原生核准用戶端，而不必退回使用 Web UI 或終端機。

- 執行與外掛核准可呈現為 Slack 原生的 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是原生執行核准用戶端的啟用及私訊／頻道路由設定。
- 執行核准私訊使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 當 Slack 已啟用為來源工作階段的原生核准用戶端，或 `approvals.plugin` 路由至來源 Slack 工作階段或 Slack 目標時，外掛核准會使用 Slack 原生按鈕。
- 外掛核准私訊會使用來自 `channels.slack.allowFrom` 的 Slack 外掛核准者、具名帳號的 `allowFrom`，或帳號的預設路由。
- 仍會強制執行核准者授權：僅限執行的核准者無法核准外掛要求，除非他們同時也是外掛核准者。

這使用與其他頻道相同的共用核准按鈕介面。當 Slack 應用程式設定中的 `interactivity` 已啟用時，核准提示會直接在對話中呈現為 Block Kit 按鈕。
這些按鈕存在時，就是主要的核准使用者體驗；只有當工具結果指出聊天核准
無法使用，或手動核准是唯一途徑時，OpenClaw 才應包含手動 `/approve`
命令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`、`sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少能解析出一位
執行核准者時，Slack 會自動啟用原生執行核准。當能解析出 Slack 外掛核准者，且要求符合原生用戶端篩選條件時，Slack 也能透過此原生用戶端
路徑處理原生外掛核准。將
`enabled: false` 設為明確停用 Slack 作為原生核准用戶端。將 `enabled: true` 設為
在能解析出核准者時強制開啟原生核准。停用 Slack 執行核准不會停用
透過 `approvals.plugin` 啟用的原生 Slack 外掛核准傳遞；外掛核准
傳遞會改用 Slack 外掛核准者。

沒有明確 Slack 執行核准設定時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆寫核准者、新增篩選條件，或選擇使用來源聊天傳遞時，才需要明確的 Slack 原生設定：

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

共用的 `approvals.exec` 轉送是另一項功能。只有當執行核准提示也必須
路由至其他聊天或明確的頻外目標時才使用它。共用的 `approvals.plugin` 轉送也是
另一項功能；只有當 Slack 能以原生方式處理外掛核准要求時，Slack 原生傳遞才會抑制該備援機制。

同一聊天中的 `/approve` 也適用於已支援命令的 Slack 頻道和私訊。完整的核准轉送模型請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯／刪除會對應為系統事件。
- 討論串廣播（「Also send to channel」討論串回覆）會視為一般使用者訊息處理。
- 新增／移除表情回應事件會對應為系統事件。
- 成員加入／離開、頻道建立／重新命名，以及新增／移除釘選事件會對應為系統事件。
- 選用的在線狀態輪詢，可以將觀察到的人類參與者從 `away` 到 `active` 的轉換，對應至該參與者最近使用且符合資格的 Slack 工作階段。預設為關閉。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定鍵。
- 頻道主題／用途中繼資料會被視為不受信任的內容，並可注入路由內容中。
- 適用時，討論串起始訊息與初始討論串歷史內容植入會依設定的傳送者允許清單進行篩選。
- 區塊動作、捷徑和互動視窗互動會發出包含豐富承載資料欄位的結構化 `Slack interaction: ...` 系統事件：
  - 區塊動作：所選值、標籤、選擇器值，以及 `workflow_*` 中繼資料
  - 全域捷徑：回呼與操作者中繼資料，路由至操作者的直接工作階段
  - 訊息捷徑：回呼、操作者、頻道、討論串，以及所選訊息內容
  - 互動視窗 `view_submission` 和 `view_closed` 事件，包含已路由的頻道中繼資料與表單輸入

在 Slack 應用程式設定中定義全域或訊息捷徑，並使用任何非空白的回呼 ID。OpenClaw 會確認符合的捷徑承載資料、套用與其他 Slack 互動相同的私訊／頻道傳送者政策，並將經過清理的事件排入已路由代理程式工作階段的佇列。觸發程序 ID 和回應 URL 會從代理程式內容中遮蔽。

### 在線狀態事件

Slack 不會透過 Events API 或 Socket Mode 傳送在線狀態變更。OpenClaw 可以改為針對訊息已通過一般 Slack 存取與路由檢查的人類參與者，輪詢 [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/)。

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

- `off`（預設）：沒有在線狀態計時器或 Slack API 呼叫。
- `auto`：監控過去 24 小時內活躍且最多有 8 位已觀察人類參與者的私訊、MPIM 和 Slack 討論串。不包含頂層頻道工作階段。
- `on`：監控相同的對話，但不限制參與者人數，並包含頂層頻道工作階段。使用個別頻道覆寫來強制監控或排除某個頻道。

每個 Slack 帳號每分鐘最多輪詢 45 位不重複的使用者；第一次結果只用於植入初始狀態，不會喚醒代理程式，而且僅在觀察到從 `away` 到 `active` 的轉換時才會喚醒。即使該人員參與多個討論串，每個 Slack 帳號和使用者仍會套用持久的 8 小時冷卻時間。事件只會路由至該人員最近使用且符合資格的對話，並指示代理程式在決定是否傳送一句簡短問候之前，先查閱記憶／Wiki 和已知時區內容。代理程式可以保持沉默。

機器人權杖需要 `users:read`，建議的資訊清單中已包含此項。Enterprise Grid 全組織安裝無法使用在線狀態事件。

## 設定參考

主要參考資料：[設定參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- 模式／驗證：`mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私訊存取：`dm.enabled`、`dmPolicy`、`allowFrom`（舊版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（緊急備用；除非需要，否則請保持關閉）
- 頻道存取：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 討論串／歷史記錄：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 在線狀態喚醒：`presenceEvents.mode`、`channels.*.presenceEvents.mode`（`off|auto|on`；預設 `off`）
- 傳遞：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展開預覽：`unfurlLinks`（預設：`false`）、用於控制 `chat.postMessage` 連結／媒體預覽的 `unfurlMedia`；設定 `unfurlLinks: true` 可重新選擇啟用連結預覽
- 操作／功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **鍵必須是頻道 ID**（`C12345678`），不能是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，使用名稱的鍵會無聲失敗，因為頻道路由預設會優先使用 ID。若要尋找 ID：在 Slack 中以滑鼠右鍵按一下頻道 → **Copy link** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 個別頻道的 `users` 允許清單
    - `messages.groupChat.visibleReplies`：一般群組／頻道要求預設為 `"automatic"`。如果你選擇啟用 `"message_tool"`，且記錄顯示有助理文字但沒有 `message(action=send)` 呼叫，表示模型遺漏了可見的訊息工具路徑。在此模式下，最終文字會保持私密；請檢查閘道詳細記錄中遭抑制的承載資料中繼資料，或是如果你希望每個一般助理最終回覆都透過舊版路徑發布，請將其設為 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果是 `"room_event"`，未提及機器人的允許頻道閒聊會作為環境內容，並保持靜默，除非代理程式呼叫 `message` 工具。請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

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
    請檢查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或舊版 `channels.slack.dm.policy`）
    - 配對核准 / 允許清單項目（`dmPolicy: "open"` 仍需要 `channels.slack.allowFrom: ["*"]`）
    - 群組私訊使用 MPIM 處理；啟用 `channels.slack.dm.groupEnabled`，若已設定，請將 MPIM 納入 `channels.slack.dm.groupChannels`
    - Slack Assistant 私訊事件：提及 `drop message_changed` 的詳細記錄
      通常表示 Slack 傳送了已編輯的 Assistant 討論串事件，但訊息中繼資料中
      沒有可復原的人類傳送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式無法連線">
    請在 Slack 應用程式設定中驗證機器人與應用程式權杖，以及是否已啟用 Socket Mode。
    App-Level Token 需要 `connections:write`，而作為機器人權杖的 Bot User OAuth Token
    必須與應用程式權杖屬於同一個 Slack 應用程式 / 工作區。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳號已設定，
    但目前執行階段無法解析由 SecretRef 支援的值。

    `slack socket mode failed to start; retry ...` 之類的記錄表示可復原的
    啟動失敗。缺少範圍、權杖遭撤銷及驗證無效則會立即失敗。
    `slack token mismatch ...` 記錄表示機器人權杖與應用程式權杖
    似乎屬於不同的 Slack 應用程式；請修正 Slack 應用程式的認證資訊。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    請驗證：

    - 簽署密鑰
    - 網路鉤子路徑
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳號使用唯一的 `webhookPath`
    - 公開 URL 會終止 TLS 並將要求轉送至閘道路徑
    - Slack 應用程式的 `request_url` 路徑與 `channels.slack.webhookPath` 完全相符（預設為 `/slack/events`）

    如果帳號快照中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳號已設定，但目前執行階段無法解析
    由 SecretRef 支援的簽署密鑰。

    重複出現 `slack: webhook path ... already registered` 記錄表示兩個 HTTP
    帳號使用相同的 `webhookPath`；請為每個帳號指定不同的路徑。

  </Accordion>

  <Accordion title="原生命令 / 斜線命令未觸發">
    請確認原本要使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），且已在 Slack 中註冊相符的斜線命令
    - 或單一斜線命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不會自動建立或移除斜線命令。`commands.native: "auto"` 不會啟用 Slack 原生命令；請使用 `true`，並在 Slack 應用程式中建立相符的命令。在 HTTP 模式下，每個 Slack 斜線命令都必須包含閘道 URL。在 Socket Mode 下，命令承載資料會透過 websocket 傳入，而 Slack 會忽略 `slash_commands[].url`。

    另請檢查 `commands.useAccessGroups`、私訊授權、頻道允許清單，
    以及各頻道的 `users` 允許清單。對於遭封鎖的斜線命令傳送者，Slack 會傳回僅對使用者可見的錯誤，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件媒體參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可將下載的媒體附加至代理程式回合。音訊片段可轉錄，影像檔可透過媒體理解路徑或直接傳給具備視覺能力的回覆模型，其他檔案則仍可作為可下載的檔案內容使用。

### 支援的媒體類型

| 媒體類型                       | 來源                 | 目前行為                                                                          | 注意事項                                                                  |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音訊片段                 | Slack 檔案 URL       | 下載後透過共用音訊轉錄處理                                                        | 需要 `files:read` 及可運作的 `tools.media.audio` 模型或命令列介面     |
| JPEG / PNG / GIF / WebP 影像   | Slack 檔案 URL       | 下載並附加至回合，以供具備視覺能力的處理                                          | 每個檔案的上限：`channels.slack.mediaMaxMb`（預設 20 MB）                           |
| PDF 檔案                       | Slack 檔案 URL       | 下載並公開為檔案內容，供 `download-file` 或 `pdf` 等工具使用       | Slack 輸入不會自動將 PDF 轉換為影像視覺輸入                               |
| 其他檔案                       | Slack 檔案 URL       | 可行時下載並公開為檔案內容                                                        | 二進位檔案不會視為影像輸入                                                |
| 討論串回覆                     | 討論串起始訊息檔案   | 當回覆沒有直接媒體時，可將根訊息檔案載入為內容                                    | 僅含檔案的起始訊息會使用附件預留位置                                      |
| 多檔案訊息                     | 多個 Slack 檔案      | 個別評估每個檔案                                                                  | Slack 處理限制為每則訊息最多八個檔案                                      |

### 輸入處理流程

當含有檔案附件的 Slack 訊息送達時：

1. OpenClaw 使用機器人權杖，從 Slack 的私人 URL 下載檔案。
2. 成功後，檔案會寫入媒體儲存區。
3. 下載媒體的路徑與內容類型會加入輸入內容。
4. 音訊片段會路由至共用轉錄處理流程；支援影像的模型 / 工具路徑可使用相同內容中的影像附件。
5. 其他檔案仍可供能處理這些檔案的工具以檔案中繼資料或媒體參考形式使用。

### 繼承討論串根訊息附件

當訊息抵達討論串（具有 `thread_ts` 父項）時：

- 如果回覆本身沒有直接媒體，且納入的根訊息含有檔案，Slack 可將根訊息檔案載入為討論串起始內容。
- 只有在初始化新的或已重設的討論串工作階段時，才會載入根訊息檔案。之後僅含文字的回覆會重複使用現有工作階段內容，而不會將根訊息檔案重新附加為新媒體。
- 直接附加於回覆的附件優先於根訊息附件。
- 若根訊息僅含檔案而沒有文字，會以附件預留位置表示，使後備處理仍可納入其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體處理流程個別處理。
- 下載的媒體參考會彙整至訊息內容中。
- 處理順序依循事件承載資料中的 Slack 檔案順序。
- 單一附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：每個檔案預設為 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **音訊轉錄上限**：將下載的檔案傳送至轉錄提供者或命令列介面時，`tools.media.audio.maxBytes` 也適用。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、超過大小上限的檔案，以及 Slack 驗證 / 登入 HTML 回應，都會略過，而不會回報為不支援的格式。
- **視覺模型**：當使用中的回覆模型支援視覺時，影像分析會使用該模型；否則使用在 `agents.defaults.imageModel` 設定的影像模型。

### 已知限制

| 情境                                          | 目前行為                                                                           | 因應方式                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Slack 檔案 URL 已過期                         | 略過檔案；不顯示錯誤                                                               | 在 Slack 中重新上傳檔案                                                     |
| 無法使用音訊轉錄                              | 片段維持附加狀態，但不會產生轉錄文字                                               | 設定 `tools.media.audio` 或安裝支援的本機轉錄命令列介面                      |
| 沒有字幕的片段未通過提及閘門                  | 私下推測性轉錄後捨棄；轉錄文字與下載內容一併移除                                   | 設定語音名稱提及模式、加入輸入的機器人提及，或使用私訊                      |
| 未設定視覺模型                                | 影像附件會儲存為媒體參考，但不會作為影像進行分析                                   | 設定 `agents.defaults.imageModel` 或使用具備視覺能力的回覆模型                        |
| 非常大的影像（預設 > 20 MB）                  | 依大小上限略過                                                                     | 若 Slack 允許，請提高 `channels.slack.mediaMaxMb`                                    |
| 轉寄 / 分享的附件                             | 文字及由 Slack 託管的影像 / 檔案媒體會盡力處理                                    | 直接在 OpenClaw 討論串中重新分享                                            |
| PDF 附件                                      | 儲存為檔案 / 媒體內容，不會自動透過影像視覺路徑處理                                | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具分析 PDF |

### 相關文件

- [媒體理解處理流程](/zh-TW/nodes/media-understanding)
- [音訊與語音留言](/zh-TW/nodes/audio)
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
    將輸入訊息路由至代理程式。
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
