---
read_when:
    - Slack のセットアップまたは Slack のソケット/HTTP モードのデバッグ
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

Slackアプリ連携により、DMとチャンネルで本番利用可能です。デフォルトのモードは Socket Mode です。HTTPリクエストURLもサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    SlackのDMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブなコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## Socket Mode と HTTPリクエストURLの選択

どちらのトランスポートも本番利用可能で、メッセージング、スラッシュコマンド、アプリホーム、インタラクティブ機能について機能は同等です。機能ではなく、デプロイ形態に基づいて選択してください。

| 観点                         | Socket Mode（デフォルト）                                                             | HTTPリクエストURL                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不要                                                                                 | 必須（DNS、TLS、リバースプロキシまたはトンネル）                                                              |
| アウトバウンドネットワーク   | `wss-primary.slack.com` へのアウトバウンドWSSに到達できる必要があります              | アウトバウンドWSなし。インバウンドHTTPSのみ                                                                   |
| 必要なトークン               | Bot token（`xoxb-...`）+ `connections:write` を持つ App-Level Token（`xapp-...`）     | Bot token（`xoxb-...`）+ Signing Secret                                                                        |
| 開発用ノートPC / ファイアウォール内 | そのまま動作します                                                                  | 公開トンネル（ngrok、Cloudflare Tunnel、Tailscale Funnel）またはステージングGatewayが必要です                 |
| 水平スケーリング             | アプリごと、ホストごとに1つの Socket Mode セッション。複数のGatewayには別々のSlackアプリが必要です | ステートレスなPOSTハンドラー。複数のGatewayレプリカがロードバランサーの背後で1つのアプリを共有できます       |
| 1つのGateway上の複数アカウント | サポートされています。各アカウントが独自のWSを開きます                              | サポートされています。登録が衝突しないよう、各アカウントには一意の `webhookPath`（デフォルトは `/slack/events`）が必要です |
| スラッシュコマンドのトランスポート | WS接続経由で配信されます。`slash_commands[].url` は無視されます                      | Slackが `slash_commands[].url` にPOSTします。コマンドをディスパッチするにはこのフィールドが必須です           |
| リクエスト署名               | 使用しません（認証は App-Level Token です）                                          | Slackがすべてのリクエストに署名します。OpenClawは `signingSecret` で検証します                                |
| 接続切断時の復旧             | Slack SDKが自動再接続します。Gatewayのpongタイムアウト用トランスポート調整が適用されます | 切断される永続接続はありません。再試行はSlackからのリクエストごとに行われます                               |

<Note>
  **Socket Mode を選択**するのは、単一Gatewayホスト、開発用ノートPC、`*.slack.com` へのアウトバウンドには到達できるがインバウンドHTTPSを受け付けられないオンプレミスネットワークの場合です。

**HTTPリクエストURLを選択**するのは、ロードバランサーの背後で複数のGatewayレプリカを実行する場合、アウトバウンドWSSはブロックされているがインバウンドHTTPSは許可されている場合、またはSlackのWebhookをすでにリバースプロキシで終端している場合です。
</Note>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しいSlackアプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のマニフェストのいずれかを貼り付ける → **Next** → **Create**。

        <CodeGroup>

```json 推奨
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

```json 最小構成
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
          **推奨** は、同梱Slack Pluginのフル機能セットに一致します。アプリホーム、スラッシュコマンド、ファイル、リアクション、ピン、グループDM、絵文字/ユーザーグループの読み取りが含まれます。ワークスペースポリシーでスコープが制限されている場合は **最小構成** を選択してください。DM、チャンネル/グループ履歴、メンション、スラッシュコマンドは対象ですが、ファイル、リアクション、ピン、グループDM（`mpim:*`）、`emoji:read`、`usergroups:read` は除外されます。スコープごとの根拠や、追加のスラッシュコマンドのような追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        Slackがアプリを作成した後:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` を追加して保存し、`xapp-...` の値をコピーします。
        - **Install App → Install to Workspace**: `xoxb-...` の Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClawを設定する">

        推奨されるSecretRef設定:

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

        envフォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTPリクエストURL">
    <Steps>
      <Step title="新しいSlackアプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のマニフェストのいずれかを貼り付ける → `https://gateway-host.example.com/slack/events` を公開Gateway URLに置き換える → **Next** → **Create**。

        <CodeGroup>

```json 推奨
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
          **Recommended** はバンドルされた Slack plugin の全機能セットと一致します。**Minimal** は、制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` を除外します。スコープごとの根拠については、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド (`slash_commands[].url`、`event_subscriptions.request_url`、`interactivity.request_url` / `message_menu_options_url`) はすべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマでは個別の名前が必要ですが、OpenClaw はペイロード種別でルーティングするため、単一の `webhookPath` (デフォルトは `/slack/events`) で十分です。`slash_commands[].url` のないスラッシュコマンドは、HTTP モードでは警告なしに no-op になります。
        </Info>

        Slack がアプリを作成した後:

        - **Basic Information → App Credentials**: リクエスト検証用の **Signing Secret** をコピーします。
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token をコピーします。

      </Step>

      <Step title="Configure OpenClaw">

        推奨される SecretRef セットアップ:

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
        複数アカウントの HTTP には一意の Webhook パスを使用する

        登録が衝突しないように、各アカウントに異なる `webhookPath` (デフォルトは `/slack/events`) を指定します。
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

## Socket Mode トランスポートのチューニング

OpenClaw は、Socket Mode では Slack SDK クライアントの pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有のチューニングが必要な場合にのみ、トランスポート設定を上書きしてください:

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

これは、Slack websocket の pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、またはイベントループの枯渇が判明しているホストで実行する場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリのメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存性シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、Socket Mode と HTTP Request URLs で同じです。異なるのは `settings` ブロック (およびスラッシュコマンドの `url`) だけです。

基本マニフェスト (Socket Mode のデフォルト):

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

**HTTP Request URLs モード**では、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です:

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

### 追加のマニフェスト設定

上記のデフォルトを拡張する別の機能を表示します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブを有効にし、`app_home_opened` をサブスクライブします。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードや非公開設定は含まれません。**Messages** タブは Slack DM 用に有効なままです。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を、注意点つきで使用できます:

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 一度に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)のサブセットに置き換えます:

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        上記の Socket Mode と同じ `slash_commands` リストを使用し、すべての項目に `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

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

        リスト内のすべてのコマンドで、その `url` 値を繰り返します。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の著者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使用したい場合は、`chat:write.customize` ボットスコープを追加します。

    絵文字アイコンを使う場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ（読み取り操作）">
    `channels.slack.userToken` を構成する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack 検索の読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は、プレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- 構成トークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は構成専用（env フォールバックなし）で、デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` フィールドと `*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef
  または別の非インライン secret ソースを通じて構成されているものの、現在のコマンド/ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、
  必須ペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、構成されている場合にユーザートークンが優先されることがあります。書き込みでは、ボットトークンが引き続き優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用できるアクショングループ:

| グループ   | デフォルト |
| ---------- | ------- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け取り、画像の場合は画像プレビュー、それ以外のファイルタイプの場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルトは true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` 配下にあり、構成キーとして **安定した Slack チャンネル ID**（例: `C12345678`）を使用する必要があります。

    ランタイムの注記: `channels.slack` が完全にない場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、（`channels.defaults.groupPolicy` が設定されていても）警告をログに出力します。

    名前/ID 解決:

    - チャンネル許可リストエントリと DM 許可リストエントリは、トークンアクセスで可能な場合、起動時に解決されます
    - 未解決のチャンネル名エントリは構成どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/スラッグ照合には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は `groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーは正常にルーティングされず、そのチャンネル内のすべてのメッセージは暗黙的にブロックされます。これは、チャンネルキーがルーティングに不要で、名前ベースのキーが機能しているように見える `groupPolicy: "open"` とは異なります。

    常に Slack チャンネル ID をキーとして使用してください。見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL の末尾に ID（`C...`）が表示されます。

    正しい例:

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

    誤った例（`groupPolicy: "allowlist"` では暗黙的にブロックされます）:

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

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - ボットユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read` が必要です
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙的なボットへの返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （レガシーのプレフィックスなしキーは引き続き `id:` のみに対応します）

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。ボットが作成したルームメッセージは、送信ボットがそのルームの `users` 許可リストに明示的に含まれている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID のうち少なくとも 1 つが現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードと表示名のオーナーエントリは、オーナーの存在条件を満たしません。オーナーの存在確認には Slack `conversations.members` を使用します。アプリにルームタイプに対応する読み取りスコープ（パブリックチャンネルは `channels:read`、プライベートチャンネルは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw はボット作成のルームメッセージを破棄します。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct`、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け付けます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに統合されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信では、該当する場合にスレッドセッションサフィックス（`:thread:<threadTs>`）を作成できます。
- OpenClaw が明示的なメンションを要求せずにトップレベルメッセージを処理するチャンネルでは、`off` 以外の `replyToMode` により、処理された各ルートが `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` にルーティングされるため、表示される Slack スレッドは最初のターンから 1 つの OpenClaw セッションに対応します。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションの開始時に取得する既存スレッドメッセージ数を制御します（デフォルトは `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルトは `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、ボットがすでにそのスレッドに参加していても、スレッド内の明示的な `@bot` メンションにのみボットが応答します。これがない場合、ボット参加済みスレッドでの返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルトは `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- 直接チャットのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` ツールから明示的な Slack スレッド返信を行う場合、`action: "send"` と `threadId` または `replyTo` とともに `replyBroadcast: true` を設定すると、Slack にスレッド返信を親チャンネルにもブロードキャストするよう要求できます。これは Slack の `chat.postMessage` の `reply_broadcast` フラグに対応し、テキストまたは Block Kit 送信でのみサポートされ、メディアアップロードではサポートされません。

`message` ツール呼び出しが Slack スレッド内で実行され、同じチャンネルを対象にする場合、OpenClaw は通常、`replyToMode` に従って現在の Slack スレッドを継承します。代わりに新しい親チャンネルメッセージを強制するには、`action: "send"` または `action: "upload-file"` に `topLevel: true` を設定します。`threadId: null` も同じトップレベルのオプトアウトとして受け付けられます。

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む Slack の **すべての** 返信スレッドを無効にします。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドはチャンネルからメッセージを隠しますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

注記:

- Slack はショートコード（例: `"eyes"`）を想定します。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力に置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中は進行状況テキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューが有効な場合、ツール/進行状況の更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。個別のツール/進行状況メッセージを維持するには `false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生のコマンド/exec テキストを隠しつつ、コンパクトなツール進行状況行を維持するには `status` に設定します（デフォルト: `raw`）。

生のコマンド/exec テキストを隠しつつ、コンパクトな進行状況行を維持する:

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

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合の Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack アシスタントのスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッドの選択は引き続き `replyToMode` に従います。
- チャンネル、グループチャット、トップレベル DM のルートでは、ネイティブストリーミングが利用できない場合や返信スレッドが存在しない場合でも、通常の下書きプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw が DM 内で下書きプレビューを投稿および編集します。
- メディアと非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終応答は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終応答は、プレビューをその場で編集できる場合にのみフラッシュされます。
- 返信の途中でストリーミングが失敗した場合、OpenClaw は残りのペイロードを通常の配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使用します。

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

レガシーキー:

- `channels.slack.streamMode` (`replace | status_final | append`) は `channels.slack.streaming.mode` のレガシーランタイムエイリアスです。
- boolean `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` のレガシーランタイムエイリアスです。
- レガシー `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` のランタイムエイリアスです。
- `openclaw doctor --fix` を実行して、永続化された Slack ストリーミング設定を正規キーに書き換えます。

## 入力中リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信 Slack メッセージに一時的なリアクションを追加し、実行が完了するとそれを削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使用するスレッド返信の外で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slack はショートコードを想定しています（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートで行われ、返信または失敗パスが完了した後に自動的にクリーンアップが試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストするプライベート URL（トークン認証付きリクエストフロー）からダウンロードされ、取得に成功しサイズ制限が許す場合はメディアストアに書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使用されます。Slack ファイルの取得が停止または失敗した場合でも、OpenClaw はメッセージ処理を継続し、ファイルプレースホルダーにフォールバックします。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit`（デフォルト 4000）を使用します
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信（`thread_ts`）を含められます
    - 送信メディアの上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトを使用します

  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキスト/ブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信では具体的な会話 ID が必要なため、先に Slack 会話 API 経由で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、Slack 内で単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで [追加のマニフェスト設定](#additional-manifest-settings) が必要で、代わりに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効化します。

- Slack ではネイティブコマンドの自動モードは **オフ** なので、`commands.native: "auto"` では Slack ネイティブコマンドは有効化されません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応的なレンダリング戦略を使用します。

- 最大 5 個のオプション: ボタンブロック
- 6〜100 個のオプション: 静的セレクトメニュー
- 100 個を超えるオプション: インタラクティブオプションハンドラーが利用可能な場合は非同期オプションフィルタリング付きの外部セレクト
- Slack の制限超過: エンコードされたオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使用し、引き続き `CommandTargetSessionKey` を使ってコマンド実行をターゲット会話セッションにルーティングします。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効化します。

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

または、1 つの Slack アカウントだけで有効化します。

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

有効にすると、エージェントは Slack 専用の返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択を既存の Slack インタラクションイベントパス経由で戻します。

注記:

- これは Slack 固有の UI です。他のチャンネルは Slack Block Kit ディレクティブをそれぞれのボタンシステムに変換しません。
- インタラクティブコールバック値は、エージェントが作成した生の値ではなく、OpenClaw が生成した不透明なトークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信する代わりに元のテキスト返信にフォールバックします。

## Slack での実行承認

Slack は Web UI や端末にフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして機能できます。

- 実行承認は、ネイティブ DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使用します。
- プラグイン承認は、リクエストがすでに Slack に届いており、承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブボタン面を通じて引き続き解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack 経由でリクエストを承認または拒否できます。

これは他のチャンネルと同じ共有承認ボタン面を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバックします）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者が解決される場合、ネイティブ実行承認を自動的に有効化します。Slack をネイティブ承認クライアントとして明示的に無効化するには `enabled: false` を設定します。
承認者が解決される場合にネイティブ承認を強制的にオンにするには、`enabled: true` を設定します。

明示的な Slack 実行承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きしたい、フィルターを追加したい、または送信元チャット配信にオプトインしたい場合だけです。

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

共有 `approvals.exec` 転送は別物です。実行承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有 `approvals.plugin` 転送も別物です。これらのリクエストがすでに Slack に届いている場合、Slack ネイティブボタンは引き続きプラグイン承認を解決できます。

同一チャットの `/approve` は、すでにコマンドをサポートしている Slack チャンネルと DM でも動作します。完全な承認転送モデルについては [実行承認](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用動作

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト（「チャンネルにも送信」スレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントにマッピングされます。
- メンバーの参加/退出、チャンネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントにマッピングされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャンネル設定キーを移行できます。
- チャンネルトピック/目的メタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入される可能性があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定済みの送信者許可リストでフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - ルーティング済みチャンネルメタデータとフォーム入力を含むモーダル `view_submission` および `view_closed` イベント

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="高シグナルな Slack フィールド">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急時用。必要な場合を除きオフのままにします）
- チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- アンファール: `chat.postMessage` のリンク/メディアプレビュー制御用の `unfurlLinks`, `unfurlMedia`
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順に確認します。

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`） — **キーはチャンネル ID**（`C12345678`）である必要があり、名前（`#channel-name`）ではありません。デフォルトでチャンネルルーティングは ID 優先のため、名前ベースのキーは `groupPolicy: "allowlist"` で暗黙に失敗します。ID を見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャンネル ID です。
    - `requireMention`
    - チャンネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    確認事項:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（またはレガシー `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リストエントリ
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、通常、Slack がメッセージメタデータ内で復元可能な人間の送信者を含まない、編集済みの Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    Slack アプリ設定で bot + app トークンと Socket Mode の有効化を検証します。

    `openclaw channels status --probe --json` が `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` を表示する場合、Slack アカウントは
    設定されていますが、現在のランタイムは SecretRef ベースの値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP モードでイベントを受信しない">
    検証項目:

    - 署名シークレット
    - webhook パス
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは設定されていますが、現在のランタイムが SecretRef による署名シークレットを解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    意図していた内容を確認してください:

    - Slack に登録された一致するスラッシュコマンドを使うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    `commands.useAccessGroups` とチャンネル/ユーザーの許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付ファイルのビジョンリファレンス

Slack のファイルダウンロードが成功し、サイズ制限が許す場合、Slack はダウンロード済みメディアをエージェントターンに添付できます。画像ファイルはメディア理解パスを通すか、ビジョン対応の返信モデルに直接渡せます。他のファイルは、画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### 対応メディアタイプ

| メディアタイプ                     | ソース               | 現在の動作                                                                  | 注記                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | ダウンロードされ、ビジョン対応処理のためにターンへ添付されます                   | ファイルごとの上限: `channels.slack.mediaMaxMb`（既定 20 MB）                 |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けのファイルコンテキストとして公開されます | Slack 受信処理は PDF を画像ビジョン入力へ自動変換しません |
| その他のファイル                    | Slack ファイル URL       | 可能な場合にダウンロードされ、ファイルコンテキストとして公開されます                              | バイナリファイルは画像入力として扱われません                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接のメディアがない場合、ルートメッセージのファイルをコンテキストとしてハイドレートできます  | ファイルのみの開始メッセージでは添付ファイルプレースホルダーを使用します                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは個別に評価されます                                              | Slack の処理は 1 メッセージあたり 8 ファイルまでに制限されます                     |

### 受信パイプライン

ファイル添付付きの Slack メッセージが到着した場合:

1. OpenClaw は bot トークン（`xoxb-...`）を使用して、Slack のプライベート URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロード済みメディアのパスとコンテンツタイプが受信コンテキストに追加されます。
4. 画像対応のモデル/ツールパスは、そのコンテキストの画像添付を使用できます。
5. 画像以外のファイルは、それを処理できるツール向けのファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付ファイルの継承

メッセージがスレッド内に到着した場合（`thread_ts` 親を持つ場合）:

- 返信自体に直接のメディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとしてハイドレートできます。
- 直接返信の添付ファイルは、ルートメッセージの添付ファイルより優先されます。
- ファイルのみでテキストがないルートメッセージは、フォールバックがそのファイルを引き続き含められるよう、添付ファイルプレースホルダーで表現されます。

### 複数添付ファイルの処理

1 つの Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付ファイルはメディアパイプラインを通じて個別に処理されます。
- ダウンロード済みメディア参照はメッセージコンテキストに集約されます。
- 処理順序はイベントペイロード内の Slack のファイル順に従います。
- 1 つの添付ファイルのダウンロード失敗は、他の添付ファイルをブロックしません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: 既定はファイルあたり 20 MB です。`channels.slack.mediaMaxMb` で設定できます。
- **ダウンロード失敗**: Slack が配信できないファイル、期限切れ URL、アクセス不能なファイル、サイズ超過ファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **ビジョンモデル**: 画像分析は、ビジョンに対応している場合はアクティブな返信モデルを使用し、または `agents.defaults.imageModel` に設定された画像モデルを使用します。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されません                                                 | Slack でファイルを再アップロードしてください                                                |
| ビジョンモデルが設定されていない            | 画像添付はメディア参照として保存されますが、画像として分析されません | `agents.defaults.imageModel` を設定するか、ビジョン対応の返信モデルを使用してください |
| 非常に大きな画像（既定では 20 MB 超） | サイズ上限によりスキップされます                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やしてください                       |
| 転送/共有された添付ファイル           | テキストと Slack ホストの画像/ファイルメディアはベストエフォートです                       | OpenClaw スレッドで直接再共有してください                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像ビジョンには自動ルーティングされません  | ファイルメタデータには `download-file` を、PDF 分析には `pdf` ツールを使用してください   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- エピック: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付ファイルビジョンの有効化
- 回帰テスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- ライブ検証: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    チャンネルとグループ DM の動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    設定のレイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
