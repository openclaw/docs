---
read_when:
    - Slack の設定または Slack ソケット/HTTP モードのデバッグ
summary: Slack の設定と実行時の動作（ソケットモード + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

DM とチャンネル向けに、Slack アプリ連携経由で本番利用可能です。デフォルトモードは Socket Mode です。HTTP Request URLs もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブのコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## Socket Mode または HTTP Request URLs の選択

どちらのトランスポートも本番利用可能で、メッセージング、スラッシュコマンド、App Home、インタラクティブ機能について機能は同等です。機能ではなくデプロイ形態で選択してください。

| 関心事                       | Socket Mode (デフォルト)                                                            | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不要                                                                                 | 必須 (DNS、TLS、リバースプロキシまたはトンネル)                                                               |
| アウトバウンドネットワーク   | `wss-primary.slack.com` へのアウトバウンド WSS に到達できる必要があります            | アウトバウンド WS は不要。インバウンド HTTPS のみ                                                             |
| 必要なトークン               | Bot token (`xoxb-...`) + `connections:write` 付きの App-Level Token (`xapp-...`)      | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| 開発用ノート PC / ファイアウォール内 | そのまま動作します                                                                   | 公開トンネル (ngrok、Cloudflare Tunnel、Tailscale Funnel) またはステージング Gateway が必要です               |
| 水平スケーリング             | アプリごと、ホストごとに 1 つの Socket Mode セッション。複数の Gateway には別々の Slack アプリが必要です | ステートレスな POST ハンドラー。複数の Gateway レプリカがロードバランサー配下で 1 つのアプリを共有できます |
| 1 つの Gateway 上の複数アカウント | サポートされています。各アカウントが独自の WS を開きます                            | サポートされています。登録が衝突しないよう、各アカウントに一意の `webhookPath` (デフォルト `/slack/events`) が必要です |
| スラッシュコマンドのトランスポート | WS 接続経由で配信されます。`slash_commands[].url` は無視されます                     | Slack が `slash_commands[].url` に POST します。コマンドをディスパッチするにはこのフィールドが必須です       |
| リクエスト署名               | 使用されません (認証は App-Level Token です)                                        | Slack がすべてのリクエストに署名します。OpenClaw は `signingSecret` で検証します                              |
| 接続切断時の復旧             | Slack SDK が自動再接続します。Gateway の pong タイムアウトのトランスポート調整が適用されます | 切断される永続接続はありません。再試行は Slack からのリクエスト単位です                                      |

<Note>
  **Socket Mode を選択**するのは、単一 Gateway ホスト、開発用ノート PC、`*.slack.com` へのアウトバウンドには到達できるがインバウンド HTTPS を受けられないオンプレミスネットワークの場合です。

**HTTP Request URLs を選択**するのは、ロードバランサー配下で複数の Gateway レプリカを実行する場合、アウトバウンド WSS がブロックされているがインバウンド HTTPS は許可されている場合、またはすでにリバースプロキシで Slack Webhook を終端している場合です。
</Note>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode (デフォルト)">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 下のマニフェストのいずれかを貼り付ける → **Next** → **Create**。

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
          **推奨**は、バンドルされた Slack plugin の完全な機能セットに一致します: App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループ DM、絵文字/ユーザーグループの読み取り。ワークスペースポリシーでスコープが制限されている場合は **最小構成**を選択してください。DM、チャンネル/グループ履歴、メンション、スラッシュコマンドをカバーしますが、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` は除外されます。スコープごとの根拠や、追加のスラッシュコマンドなどの追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        Slack がアプリを作成した後:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` を追加し、保存して、`xapp-...` の値をコピーします。
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を設定する">

        推奨される SecretRef 設定:

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

        環境変数フォールバック (デフォルトアカウントのみ):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 下のマニフェストのいずれかを貼り付ける → `https://gateway-host.example.com/slack/events` を公開 Gateway URL に置き換える → **Next** → **Create**。

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
          **推奨** はバンドルされた Slack plugin の全機能セットと一致します。**最小** は制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` を省きます。スコープごとの根拠は [マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド (`slash_commands[].url`、`event_subscriptions.request_url`、`interactivity.request_url` / `message_menu_options_url`) はすべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマでは別々の名前が必要ですが、OpenClaw はペイロードタイプでルーティングするため、単一の `webhookPath` (デフォルト `/slack/events`) で十分です。`slash_commands[].url` のないスラッシュコマンドは、HTTP モードでは通知なしに何もしません。
        </Info>

        Slack がアプリを作成した後:

        - **Basic Information → App Credentials**: リクエスト検証用の **Signing Secret** をコピーします。
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を設定する">

        推奨される SecretRef 設定:

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

        登録が衝突しないように、各アカウントに個別の `webhookPath` (デフォルト `/slack/events`) を指定します。
        </Note>

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode トランスポートの調整

OpenClaw は Socket Mode で、デフォルトで Slack SDK クライアントの pong タイムアウトを 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack websocket pong/server-ping タイムアウトがログに記録される Socket Mode ワークスペース、または既知のイベントループ枯渇があるホストで実行する場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態であり、トランスポートの生存性シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは Socket Mode と HTTP Request URLs で同じです。異なるのは `settings` ブロック (およびスラッシュコマンドの `url`) だけです。

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

**HTTP Request URLs モード** の場合は、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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

上記のデフォルトを拡張するさまざまな機能を公開します。

デフォルトのマニフェストは Slack App Home の **Home** タブを有効にし、`app_home_opened` を購読します。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードやプライベート設定は含まれません。**Messages** タブは Slack DM 用に有効なままです。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    1 つの設定済みコマンドの代わりに、複数の [ネイティブスラッシュコマンド](#commands-and-slash-behavior) を使えますが、いくつか注意点があります。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 一度に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) のサブセットに置き換えます。

    <Tabs>
      <Tab title="Socket Mode (デフォルト)">

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
        上記の Socket Mode と同じ `slash_commands` リストを使用し、すべてのエントリに `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

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
  <Accordion title="任意の authorship スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` bot スコープを追加します。

    絵文字アイコンを使う場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意の user-token スコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack 検索読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`, `appToken`, `signingSecret`, `userToken` はプレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- 設定内のトークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定専用（env フォールバックなし）で、デフォルトでは読み取り専用の動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` と `*Status`
  フィールド（`botToken`, `appToken`, `signingSecret`, `userToken`）を追跡します。
- ステータスは `available`, `configured_unavailable`, `missing` のいずれかです。
- `configured_unavailable` は、アカウントが SecretRef
  または別の非インライン Secret ソースを通じて設定されているものの、現在のコマンド/ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、
  必須のペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合 user token が優先されることがあります。書き込みでは bot token が引き続き優先されます。user-token 書き込みは `userTokenReadOnly: false` かつ bot token が利用できない場合にのみ許可されます。
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

現在の Slack メッセージアクションには、`send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, `emoji-list` が含まれます。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け付け、画像では画像プレビューを、その他のファイル種別ではローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（任意の MPIM 許可リスト）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合、`channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は、互換性のため引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに可能な場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` の下にあり、設定キーとして**安定した Slack チャンネル ID**（例: `C12345678`）を使用する必要があります。

    ランタイムメモ: `channels.slack` が完全に欠落している場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

    名前/ID 解決:

    - チャンネル許可リスト項目と DM 許可リスト項目は、トークンアクセスが許可する場合、起動時に解決されます
    - 未解決のチャンネル名項目は設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信承認とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/スラッグ一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は `groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーは正常にルーティングされず、そのチャンネルのすべてのメッセージはサイレントにブロックされます。これは、ルーティングにチャンネルキーが不要で、名前ベースのキーが動作しているように見える `groupPolicy: "open"` とは異なります。

    キーには常に Slack チャンネル ID を使用してください。見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — ID（`C...`）は URL の末尾に表示されます。

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

    誤った例（`groupPolicy: "allowlist"` ではサイレントにブロックされます）:

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
    - bot ユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read` が必要です
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`, フォールバック `messages.groupChat.mentionPatterns`）
    - 暗黙的な bot への返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`, `e164:`, `username:`, `name:`, または `"*"` ワイルドカード
      （レガシーのプレフィックスなしキーは引き続き `id:` のみにマップされます）

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。bot 作成のルームメッセージは、送信 bot がそのルームの `users` 許可リストに明示的に含まれている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID が少なくとも 1 つ現在ルームメンバーである場合にのみ受け付けられます。ワイルドカードと表示名のオーナー項目は、オーナーの存在条件を満たしません。オーナーの存在確認には Slack `conversations.members` を使用します。アプリにルーム種別に対応する読み取りスコープ（パブリックチャンネルでは `channels:read`、プライベートチャンネルでは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw は bot 作成のルームメッセージを破棄します。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて、`channel:C12345678`, `user:U12345678`, `<@U12345678>` などの Slack ターゲット形式を受け付けます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに折りたたまれます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションが開始されるときに取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、bot がすでにスレッドに参加している場合でも、スレッド内の明示的な `@bot` メンションにのみ応答します。これがない場合、bot が参加したスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット向けレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack の**すべて**の返信スレッド化を無効にします。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドはメッセージをチャンネルから非表示にしますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

メモ:

- Slack は shortcode を想定します（例: `"eyes"`）。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中に進捗ステータステキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューがアクティブな場合、ツール/進捗更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。個別のツール/進捗メッセージを維持するには `false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生のコマンド/exec テキストを非表示にしつつ、コンパクトなツール進捗行を維持するには `status` に設定します（デフォルト: `raw`）。

コンパクトな進捗行を維持しながら、生のコマンド/exec テキストを非表示にします。

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

- ネイティブテキストストリーミングと Slack アシスタントのスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合、または返信スレッドが存在しない場合でも、チャンネル、グループチャット、トップレベル DM ルートは通常の下書きプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw は DM 内で下書きプレビューを投稿して編集します。
- メディアおよび非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終応答は保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終応答は、その場でプレビューを編集できる場合にのみフラッシュされます。
- 返信の途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードを通常の配信にフォールバックします。

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

- `channels.slack.streamMode` (`replace | status_final | append`) は `channels.slack.streaming.mode` のレガシー実行時エイリアスです。
- boolean `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` のレガシー実行時エイリアスです。
- レガシー `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` の実行時エイリアスです。
- 永続化された Slack ストリーミング設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

## 入力中リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信 Slack メッセージに一時的なリアクションを追加し、実行が完了したら削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使用するスレッド返信以外で特に役立ちます。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack はショートコードを想定しています (例: `"hourglass_flowing_sand"`)。
- リアクションはベストエフォートであり、返信または失敗パスの完了後に自動でクリーンアップが試行されます。

## メディア、チャンク分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack ファイル添付は、Slack がホストするプライベート URL (トークン認証リクエストフロー) からダウンロードされ、取得が成功してサイズ制限が許す場合にメディアストアへ書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと総タイムアウトが使われます。Slack ファイル取得が停止または失敗した場合、OpenClaw はメッセージ処理を継続し、ファイルプレースホルダーにフォールバックします。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` (デフォルト 4000) を使用します
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信 (`thread_ts`) を含められます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャネル送信はメディアパイプラインの MIME 種別デフォルトを使用します

  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示ターゲット:

    - DM の場合は `user:<id>`
    - チャネルの場合は `channel:<id>`

    テキスト/ブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信は具体的な会話 ID が必要なため、まず Slack 会話 API で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、Slack では単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで [追加のマニフェスト設定](#additional-manifest-settings) が必要で、代わりに `channels.slack.commands.native: true`、またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードが **オフ** のため、`commands.native: "auto"` で Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応レンダリング戦略を使用します:

- 最大 5 オプション: ボタンブロック
- 6〜100 オプション: 静的選択メニュー
- 100 を超えるオプション: インタラクティビティのオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部選択
- Slack 制限の超過: エンコードされたオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使用し、コマンド実行は引き続き `CommandTargetSessionKey` を使用してターゲット会話セッションへルーティングされます。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効にする:

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

または、1 つの Slack アカウントだけで有効にする:

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

有効にすると、エージェントは Slack 専用の返信ディレクティブを出力できます:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択は既存の Slack インタラクションイベントパスを通じて戻されます。

注意:

- これは Slack 固有の UI です。他のチャネルは Slack Block Kit ディレクティブを独自のボタンシステムへ変換しません。
- インタラクティブコールバック値は、エージェントが作成した生の値ではなく、OpenClaw が生成した不透明トークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信する代わりに、元のテキスト返信にフォールバックします。

## Slack での Exec 承認

Slack は Web UI やターミナルへのフォールバックではなく、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec 承認は、ネイティブの DM/チャネルルーティングに `channels.slack.execApprovals.*` を使用します。
- Plugin 承認は、リクエストがすでに Slack に届いていて承認 id 種別が `plugin:` の場合、同じ Slack ネイティブボタン画面で引き続き解決できます。
- 承認者認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack 経由でリクエストを承認または拒否できます。

これは、他のチャネルと同じ共有承認ボタン画面を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認は利用不可、または手動承認が唯一のパスであると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
- `agentFilter`, `sessionFilter`

`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者が解決される場合、Slack はネイティブ Exec 承認を自動で有効にします。Slack をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。
承認者が解決される場合にネイティブ承認を強制的に有効にするには、`enabled: true` を設定します。

明示的な Slack Exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または発信元チャット配信を有効にする場合だけです:

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

共有 `approvals.exec` 転送は別物です。Exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有 `approvals.plugin` 転送も別物です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に届いている場合、Plugin 承認を引き続き解決できます。

同じチャットでの `/approve` は、すでにコマンドをサポートしている Slack チャネルと DM でも機能します。承認転送モデル全体については、[Exec 承認](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用動作

- メッセージの編集/削除はシステムイベントにマップされます。
- スレッドブロードキャスト (「Also send to channel」のスレッド返信) は通常のユーザーメッセージとして処理されます。
- リアクション追加/削除イベントはシステムイベントにマップされます。
- メンバーの参加/退出、チャネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントにマップされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャネル設定キーを移行できます。
- チャネルのトピック/目的メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストへ注入される場合があります。
- スレッド開始者と初期スレッド履歴コンテキストのシードは、該当する場合、設定された送信者許可リストによってフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します:
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - ルーティングされたチャネルメタデータとフォーム入力を含むモーダル `view_submission` および `view_closed` イベント

## 設定リファレンス

主なリファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM access: `dm.enabled`, `dmPolicy`, `allowFrom` (レガシー: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibility toggle: `dangerouslyAllowNameMatching` (緊急時用。必要な場合以外はオフのままにしてください)
- channel access: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    次の順序で確認します:

    - `groupPolicy`
    - チャネル許可リスト (`channels.slack.channels`) — **キーはチャネル ID** (`C12345678`) である必要があり、名前 (`#channel-name`) ではありません。`groupPolicy: "allowlist"` では、名前ベースのキーは暗黙に失敗します。これは、チャネルルーティングがデフォルトで ID 優先だからです。ID を見つけるには、Slack でチャネルを右クリック → **リンクをコピー** — URL の末尾にある `C...` 値がチャネル ID です。
    - `requireMention`
    - チャネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    確認項目:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (またはレガシー `channels.slack.dm.policy`)
    - ペアリング承認 / 許可リストエントリー
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、通常、Slack がメッセージメタデータ内で復元可能な人間の送信者を含まない、編集済み Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode が接続しない">
    Slack アプリ設定で、bot + app トークンと Socket Mode の有効化を検証します。

    `openclaw channels status --probe --json` が `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` を表示する場合、Slack アカウントは
    設定されていますが、現在の実行時は SecretRef によって裏付けられた
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP モードがイベントを受信しない">
    検証項目:

    - signing secret
    - Webhook パス
    - Slack Request URL (Events + Interactivity + Slash Commands)
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、HTTP アカウントは設定されていますが、現在の実行時は SecretRef によって裏付けられた signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが実行されない">
    意図していたものを確認します:

    - Slack に登録された一致するスラッシュコマンドを使用するネイティブコマンドモード (`channels.slack.commands.native: true`)
    - または単一スラッシュコマンドモード (`channels.slack.slashCommand.enabled: true`)

    `commands.useAccessGroups` とチャネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付ファイルのビジョンリファレンス

Slack は、Slack ファイルのダウンロードが成功し、サイズ制限が許す場合、ダウンロードしたメディアをエージェントターンに添付できます。画像ファイルは、メディア理解パス経由で渡すことも、ビジョン対応の返信モデルへ直接渡すこともできます。その他のファイルは、画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディアタイプ               | ソース               | 現在の動作                                                                       | 注記                                                                           |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL   | ダウンロードされ、ビジョン対応の処理用にターンへ添付されます                    | ファイルごとの上限: `channels.slack.mediaMaxMb` (デフォルト 20 MB)            |
| PDF ファイル                 | Slack ファイル URL   | ダウンロードされ、`download-file` や `pdf` などのツール向けファイルコンテキストとして公開されます | Slack の受信処理は PDF を画像ビジョン入力へ自動変換しません                  |
| その他のファイル             | Slack ファイル URL   | 可能な場合はダウンロードされ、ファイルコンテキストとして公開されます             | バイナリファイルは画像入力として扱われません                                  |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接メディアがない場合、ルートメッセージのファイルをコンテキストとして取り込めます | ファイルのみの開始メッセージには添付プレースホルダーが使用されます           |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは個別に評価されます                                                   | Slack の処理はメッセージあたり 8 ファイルに制限されています                  |

### 受信パイプライン

ファイル添付を含む Slack メッセージが到着した場合:

1. OpenClaw は bot トークン (`xoxb-...`) を使用して、Slack のプライベート URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロードされたメディアパスとコンテンツタイプが受信コンテキストに追加されます。
4. 画像対応のモデル/ツールパスは、そのコンテキストの画像添付を使用できます。
5. 非画像ファイルは、それらを処理できるツール向けに、ファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付の継承

メッセージがスレッド内に到着した場合 (`thread_ts` 親を持つ場合):

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとして取り込めます。
- 直接の返信添付は、ルートメッセージ添付より優先されます。
- ファイルのみでテキストがないルートメッセージは、フォールバックがそのファイルを引き続き含められるように、添付プレースホルダーで表現されます。

### 複数添付の処理

単一の Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて個別に処理されます。
- ダウンロードされたメディア参照はメッセージコンテキストに集約されます。
- 処理順序はイベントペイロード内の Slack のファイル順に従います。
- 1 つの添付のダウンロード失敗が、他の添付をブロックすることはありません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルごとに 20 MB。`channels.slack.mediaMaxMb` で設定できます。
- **ダウンロード失敗**: Slack が提供できないファイル、期限切れ URL、アクセス不能なファイル、サイズ超過のファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **ビジョンモデル**: 画像分析は、ビジョンをサポートしている場合はアクティブな返信モデルを使用し、そうでない場合は `agents.defaults.imageModel` で設定された画像モデルを使用します。

### 既知の制限

| シナリオ                                | 現在の動作                                                                      | 回避策                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL           | ファイルはスキップされ、エラーは表示されません                                  | Slack でファイルを再アップロードします                                      |
| ビジョンモデルが設定されていない        | 画像添付はメディア参照として保存されますが、画像として分析されません            | `agents.defaults.imageModel` を設定するか、ビジョン対応の返信モデルを使用します |
| 非常に大きい画像 (デフォルトで > 20 MB) | サイズ上限によりスキップされます                                                | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やします             |
| 転送/共有された添付                     | テキストと Slack ホストの画像/ファイルメディアはベストエフォートで処理されます | OpenClaw スレッド内で直接再共有します                                       |
| PDF 添付                                | ファイル/メディアコンテキストとして保存され、画像ビジョン経由では自動的にルーティングされません | ファイルメタデータには `download-file` を、PDF 分析には `pdf` ツールを使用します |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付のビジョン有効化
- 回帰テスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- ライブ検証: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    チャンネルとグループ DM の動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="Configuration" icon="sliders" href="/ja-JP/gateway/configuration">
    設定レイアウトと優先順位。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
