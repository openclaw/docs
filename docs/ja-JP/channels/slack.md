---
read_when:
    - Slack の設定または Slack ソケット/HTTP モードのデバッグ
summary: Slack のセットアップと実行時の動作（ソケットモード + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Slack アプリ連携により、DM とチャンネルで本番運用可能です。デフォルトのモードは Socket Mode です。HTTP Request URL もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## Socket Mode または HTTP Request URL の選択

どちらのトランスポートも本番運用可能で、メッセージング、スラッシュコマンド、App Home、インタラクティブ機能について機能同等です。機能ではなく、デプロイ形態で選択してください。

| 懸念事項                     | Socket Mode (デフォルト)                                                            | HTTP Request URL                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不要                                                                                 | 必須 (DNS、TLS、リバースプロキシまたはトンネル)                                                               |
| アウトバウンドネットワーク   | `wss-primary.slack.com` へのアウトバウンド WSS に到達できる必要があります            | アウトバウンド WS なし。インバウンド HTTPS のみ                                                               |
| 必要なトークン               | Bot token (`xoxb-...`) + `connections:write` 付き App-Level Token (`xapp-...`)        | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| 開発用ノートPC / ファイアウォール背後 | そのまま動作します                                                                    | 公開トンネル (ngrok、Cloudflare Tunnel、Tailscale Funnel) またはステージング Gateway が必要                   |
| 水平スケーリング             | アプリ、ホストごとに Socket Mode セッションは 1 つ。複数の Gateway には個別の Slack アプリが必要 | ステートレスな POST ハンドラー。複数の Gateway レプリカがロードバランサー背後で 1 つのアプリを共有できます |
| 1 つの Gateway で複数アカウント | サポートされています。各アカウントが自身の WS を開きます                            | サポートされています。登録が衝突しないよう、各アカウントに一意の `webhookPath` (デフォルトは `/slack/events`) が必要 |
| スラッシュコマンドのトランスポート | WS 接続経由で配信されます。`slash_commands[].url` は無視されます                    | Slack が `slash_commands[].url` に POST します。コマンドをディスパッチするにはこのフィールドが必須です        |
| リクエスト署名               | 使用されません (認証は App-Level Token)                                             | Slack がすべてのリクエストに署名します。OpenClaw は `signingSecret` で検証します                             |
| 接続切断時の復旧             | Slack SDK が自動再接続します。gateway の pong タイムアウトのトランスポート調整が適用されます | 切断される永続接続はありません。リトライは Slack からのリクエストごとに行われます                           |

<Note>
  単一 Gateway ホスト、開発用ノートPC、`*.slack.com` へのアウトバウンド到達はできるがインバウンド HTTPS を受けられないオンプレミスネットワークでは、**Socket Mode を選択**してください。

ロードバランサー背後で複数の Gateway レプリカを実行する場合、アウトバウンド WSS がブロックされているがインバウンド HTTPS が許可されている場合、または既にリバースプロキシで Slack Webhook を終端している場合は、**HTTP Request URL を選択**してください。
</Note>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode (デフォルト)">
    <Steps>
      <Step title="新しい Slack アプリを作成">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開き、**Create New App** → **From a manifest** → ワークスペースを選択 → 以下のマニフェストのいずれかを貼り付け → **Next** → **Create** の順に進みます。

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
          **推奨** は、同梱されている Slack plugin の全機能セットに対応します: App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループ DM、絵文字/ユーザーグループの読み取り。ワークスペースポリシーでスコープが制限される場合は、**最小構成** を選択してください。DM、チャンネル/グループ履歴、メンション、スラッシュコマンドは対象ですが、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` は含まれません。スコープごとの根拠と、追加のスラッシュコマンドなどの追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        Slack がアプリを作成したら:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` を追加し、保存して、`xapp-...` の値をコピーします。
        - **Install App → Install to Workspace**: `xoxb-...` Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を設定">

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

      <Step title="gateway を起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URL">
    <Steps>
      <Step title="新しい Slack アプリを作成">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開き、**Create New App** → **From a manifest** → ワークスペースを選択 → 以下のマニフェストのいずれかを貼り付け → `https://gateway-host.example.com/slack/events` を公開 Gateway URL に置き換え → **Next** → **Create** の順に進みます。

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
          **推奨** は同梱 Slack plugin の全機能セットに一致します。**最小構成** は制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` を除外します。スコープごとの根拠は [マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド (`slash_commands[].url`、`event_subscriptions.request_url`、`interactivity.request_url` / `message_menu_options_url`) はすべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマではそれぞれ別名が必要ですが、OpenClaw はペイロード種別でルーティングするため、単一の `webhookPath` (デフォルトは `/slack/events`) で十分です。`slash_commands[].url` のないスラッシュコマンドは、HTTP モードでは通知なく no-op になります。
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

        登録が衝突しないように、各アカウントに個別の `webhookPath` (デフォルトは `/slack/events`) を指定します。
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

## Socket Mode トランスポートのチューニング

OpenClaw は、Socket Mode ではデフォルトで Slack SDK クライアントの pong タイムアウトを 15 秒に設定します。ワークスペースまたはホスト固有のチューニングが必要な場合にのみ、トランスポート設定を上書きしてください:

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

これは、Slack websocket の pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、またはイベントループの枯渇が既知のホストで実行する場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態であり、トランスポートの生存性シグナルではありません。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、Socket Mode と HTTP Request URLs で同じです。異なるのは `settings` ブロック (およびスラッシュコマンドの `url`) のみです。

基本マニフェスト (Socket Mode デフォルト):

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

**HTTP Request URLs モード** では、`settings` を HTTP 版に置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です:

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

上記のデフォルトを拡張する別の機能を公開します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブを有効にし、`app_home_opened` をサブスクライブします。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードやプライベート設定は含まれません。**Messages** タブは Slack DM 用に引き続き有効です。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の [ネイティブスラッシュコマンド](#commands-and-slash-behavior) を細かな違いを踏まえて使用できます:

    - `/status` コマンドは予約済みのため、`/status` の代わりに `/agentstatus` を使用します。
    - 一度に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) のサブセットに置き換えます:

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
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` ボットスコープを追加します。

    絵文字アイコンを使う場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

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
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- 設定内のトークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定専用（env フォールバックなし）で、デフォルトでは読み取り専用の動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` と `*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef
  または別の非インラインのシークレットソースを通じて設定されているものの、現在のコマンド/ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、
  必須の組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、ボットトークンが引き続き優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用できるアクショングループ:

| グループ      | デフォルト |
| ---------- | ------- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け付け、画像の場合は画像プレビューを返し、その他のファイルタイプの場合はローカルファイルメタデータを返します。

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

    複数アカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` 配下にあり、設定キーとして**安定した Slack チャンネル ID**（例: `C12345678`）を使う必要があります。

    ランタイム上の注意: `channels.slack` が完全に存在しない場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

    名前/ID 解決:

    - チャンネル許可リスト項目と DM 許可リスト項目は、トークンアクセスで許可される場合、起動時に解決されます
    - 解決されなかったチャンネル名の項目は設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/slug マッチングには `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は `groupPolicy: "allowlist"` では**一致しません**。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーでは正常にルーティングされることはなく、そのチャンネル内のすべてのメッセージが暗黙にブロックされます。これは `groupPolicy: "open"` とは異なります。`groupPolicy: "open"` ではルーティングにチャンネルキーは不要で、名前ベースのキーが動作しているように見えます。

    キーには常に Slack チャンネル ID を使ってください。見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL の末尾に ID（`C...`）が表示されます。

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

    誤り（`groupPolicy: "allowlist"` では黙ってブロックされる）:

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
    チャンネルメッセージはデフォルトでメンションゲートされます。

    メンション元:

    - 明示的なアプリメンション（`<@botId>`）
    - ボットユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read` が必要
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙的なボットへの返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時の解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `id:`, `e164:`, `username:`, `name:`, または `"*"` ワイルドカード
      （レガシーの接頭辞なしキーは引き続き `id:` のみにマップされる）

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。ボットが作成したルームメッセージは、送信元ボットがそのルームの `users` 許可リストに明示的に列挙されている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID が少なくとも 1 つ現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードと表示名のオーナーエントリは、オーナー存在を満たしません。オーナー存在には Slack `conversations.members` が使われます。アプリにルーム種別に対応する読み取りスコープ（公開チャンネルは `channels:read`、プライベートチャンネルは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw はボットが作成したルームメッセージを破棄します。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` としてルーティングされ、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け入れます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- 該当する場合、スレッド返信はスレッドセッションサフィックス（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションの開始時に取得する既存スレッドメッセージ数を制御します（デフォルトは `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、ボットがすでにスレッドに参加していても、スレッド内の明示的な `@bot` メンションにのみ応答します。これがない場合、ボットが参加したスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット向けのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む Slack の**すべて**の返信スレッド化を無効にします。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドはメッセージをチャンネルから隠しますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

メモ:

- Slack はショートコード（例: `"eyes"`）を想定します。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使います。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します:

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力に置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中に進捗ステータステキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューがアクティブな場合、ツール/進捗更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。個別のツール/進捗メッセージを維持するには `false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生のコマンド/exec テキストを隠しながらコンパクトなツール進捗行を維持するには `status` に設定します（デフォルト: `raw`）。

コンパクトな進捗行を維持しながら、生のコマンド/exec テキストを隠す:

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

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネル、グループチャット、トップレベル DM ルートは、ネイティブストリーミングが利用できない場合や返信スレッドが存在しない場合でも、通常のドラフトプレビューを引き続き使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままになるため、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw が DM にドラフトプレビューを投稿して編集します。
- メディアと非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終出力は保留中のプレビュー編集をキャンセルします。対象となるテキスト/block の最終出力は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信の途中で失敗した場合、OpenClaw は残りのペイロードについて通常の配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりにドラフトプレビューを使う:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- boolean `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- レガシー `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## 入力中リアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行が完了すると削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使うスレッド返信以外で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack はショートコードを想定しています（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートで、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack ファイル添付は、Slack がホストするプライベート URL（トークン認証済みリクエストフロー）からダウンロードされ、取得に成功しサイズ制限が許す場合にメディアストアへ書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使われます。Slack ファイルの取得が停止または失敗した場合でも、OpenClaw はメッセージ処理を続行し、ファイルプレースホルダーへフォールバックします。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="Outbound text and files">
    - テキストチャンクは `channels.slack.textChunkLimit` を使います（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使い、スレッド返信（`thread_ts`）を含めることができます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャネル送信はメディアパイプラインの MIME 種別デフォルトを使います

  </Accordion>

  <Accordion title="Delivery targets">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャネルには `channel:<id>`

    テキスト/ブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信では具体的な会話 ID が必要なため、まず Slack conversation API で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、単一の設定済みコマンドまたは複数のネイティブコマンドとして Slack に表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要で、代わりに `channels.slack.commands.native: true`、またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは**オフ**のため、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応的なレンダリング戦略を使います:

- 最大 5 個のオプション: ボタンブロック
- 6〜100 個のオプション: 静的選択メニュー
- 100 個を超えるオプション: インタラクティビティのオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部選択
- Slack の制限超過: エンコードされたオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、`CommandTargetSessionKey` を使ってコマンド実行を対象の会話セッションへ引き続きルーティングします。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。

グローバルに有効化します:

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

または、1 つの Slack アカウントに対してのみ有効化します:

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

有効な場合、エージェントは Slack 専用の返信ディレクティブを出力できます:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択を既存の Slack インタラクションイベントパス経由で戻します。

注意:

- これは Slack 固有の UI です。他のチャネルは Slack Block Kit ディレクティブを独自のボタンシステムに変換しません。
- インタラクティブコールバック値は、エージェントが作成した生の値ではなく、OpenClaw が生成した不透明トークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効なブロックペイロードを送信する代わりに、元のテキスト返信へフォールバックします。

## Slack での Exec 承認

Slack は Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec 承認はネイティブ DM/チャネルルーティングに `channels.slack.execApprovals.*` を使います。
- Plugin 承認は、リクエストがすでに Slack に届いており承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブボタン面から解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが、Slack 経由でリクエストを承認または拒否できます。

これは他のチャネルと同じ共有承認ボタン面を使います。Slack アプリ設定で `interactivity` が有効になっている場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できない、または手動承認が唯一のパスであると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者が解決される場合、ネイティブ Exec 承認を自動的に有効化します。Slack をネイティブ承認クライアントとして明示的に無効化するには `enabled: false` を設定します。
承認者が解決される場合にネイティブ承認を強制的にオンにするには `enabled: true` を設定します。

明示的な Slack Exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または発信元チャット配信にオプトインする場合だけです:

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

共有 `approvals.exec` 転送は別物です。Exec 承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使ってください。共有 `approvals.plugin` 転送も別物です。これらのリクエストがすでに Slack に届いている場合、Slack ネイティブボタンは引き続き Plugin 承認を解決できます。

同じチャットの `/approve` も、すでにコマンドをサポートしている Slack チャネルと DM で機能します。承認転送モデル全体については、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用動作

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト（「チャネルにも送信」スレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクション追加/削除イベントはシステムイベントにマッピングされます。
- メンバー参加/退出、チャネル作成/名前変更、ピン追加/削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャネル設定キーを移行できます。
- チャネルのトピック/目的メタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定済み送信者許可リストでフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します:
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - モーダル `view_submission` と `view_closed` イベント。ルーティング済みチャネルメタデータとフォーム入力を含みます

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="High-signal Slack fields">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急時用。必要な場合を除きオフのままにしてください）
- チャネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="No replies in channels">
    次の順に確認してください:

    - `groupPolicy`
    - チャネル許可リスト（`channels.slack.channels`）— **キーはチャネル ID である必要があります**（`C12345678`）。名前（`#channel-name`）ではありません。チャネルルーティングはデフォルトで ID 優先のため、名前ベースのキーは `groupPolicy: "allowlist"` で静かに失敗します。ID を見つけるには、Slack でチャネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャネル ID です。
    - `requireMention`
    - チャネルごとの `users` 許可リスト

    有用なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    確認してください:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（またはレガシー `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リストエントリ
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、通常、Slack がメッセージメタデータ内に復元可能な人間の送信者がない編集済み Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Slack アプリ設定で bot + app トークンと Socket Mode の有効化を検証してください。

    `openclaw channels status --probe --json` が `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` を表示する場合、その Slack アカウントは
    設定されていますが、現在のランタイムは SecretRef に裏付けられた値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    検証してください:

    - 署名シークレット
    - Webhook パス
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムは SecretRef に裏付けられた署名シークレットを解決できませんでした。

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    どちらを意図していたか確認してください:

    - Slack に登録された一致するスラッシュコマンドを伴うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    `commands.useAccessGroups` とチャネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 添付ファイルのビジョンリファレンス

Slack ファイルのダウンロードに成功し、サイズ制限が許す場合、Slack はダウンロード済みメディアをエージェントターンに添付できます。画像ファイルはメディア理解パスを通じて渡すことも、ビジョン対応の返信モデルに直接渡すこともできます。その他のファイルは画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディア種別                   | ソース                 | 現在の動作                                                                 | 注記                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | ダウンロードされ、vision 対応の処理のためにターンに添付されます                   | ファイルごとの上限: `channels.slack.mediaMaxMb` (デフォルト 20 MB)                 |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けにファイルコンテキストとして公開されます | Slack のインバウンドは PDF を画像 vision 入力へ自動変換しません |
| その他のファイル                    | Slack ファイル URL       | 可能な場合はダウンロードされ、ファイルコンテキストとして公開されます                              | バイナリファイルは画像入力として扱われません                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接メディアがない場合、ルートメッセージのファイルをコンテキストとして取り込めます  | ファイルのみの開始メッセージは添付プレースホルダーを使用します                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは個別に評価されます                                              | Slack の処理はメッセージごとに最大 8 ファイルに制限されます                     |

### インバウンドパイプライン

ファイル添付付きの Slack メッセージが到着した場合:

1. OpenClaw は bot トークン (`xoxb-...`) を使用して Slack のプライベート URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロード済みメディアのパスとコンテンツタイプがインバウンドコンテキストに追加されます。
4. 画像対応モデル/ツールのパスは、そのコンテキストから画像添付を使用できます。
5. 画像以外のファイルは、それらを扱えるツール向けのファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付の継承

メッセージがスレッド内に到着した場合 (`thread_ts` の親を持つ場合):

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始メッセージのコンテキストとして取り込めます。
- 直接の返信添付は、ルートメッセージの添付より優先されます。
- ファイルのみでテキストがないルートメッセージは添付プレースホルダーで表されるため、フォールバックでもそのファイルを含められます。

### 複数添付の処理

1 つの Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて個別に処理されます。
- ダウンロード済みメディア参照はメッセージコンテキストに集約されます。
- 処理順序はイベントペイロード内の Slack のファイル順に従います。
- 1 つの添付のダウンロードに失敗しても、他の添付はブロックされません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルごとに 20 MB です。`channels.slack.mediaMaxMb` で設定できます。
- **ダウンロード失敗**: Slack が配信できないファイル、期限切れ URL、アクセスできないファイル、サイズ超過ファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **Vision モデル**: 画像分析は、vision をサポートしている場合はアクティブな返信モデルを使用し、そうでない場合は `agents.defaults.imageModel` で設定された画像モデルを使用します。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されません                                                 | Slack でファイルを再アップロードします                                                |
| Vision モデルが設定されていない            | 画像添付はメディア参照として保存されますが、画像として分析されません | `agents.defaults.imageModel` を設定するか、vision 対応の返信モデルを使用します |
| 非常に大きい画像 (デフォルトでは 20 MB 超) | サイズ上限によりスキップされます                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やします                       |
| 転送/共有された添付           | テキストおよび Slack ホストの画像/ファイルメディアはベストエフォートです                       | OpenClaw スレッドで直接再共有します                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像 vision 経由に自動ルーティングされません  | ファイルメタデータには `download-file` を使用し、PDF 分析には `pdf` ツールを使用します   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付の vision 有効化
- リグレッションテスト: [#51353](https://github.com/openclaw/openclaw/issues/51353)
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
    インバウンドメッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="構成" icon="sliders" href="/ja-JP/gateway/configuration">
    構成レイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
