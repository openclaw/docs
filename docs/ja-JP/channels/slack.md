---
read_when:
    - Slack の設定または Slack ソケット、HTTP、リレーモードのデバッグ
summary: Slack のセットアップと実行時の動作（Socket Mode、HTTP Request URLs、およびリレーモード）
title: Slack
x-i18n:
    generated_at: "2026-07-05T11:05:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6425cd21adfb5f799c1b2706fa79bae511cd13d2e5f7db50117a1c9b71fa4d16
    source_path: channels/slack.md
    workflow: 16
---

Slack サポートは、Slack アプリ連携を介して DM とチャンネルを扱います。デフォルトのトランスポートは Socket Mode です。HTTP Request URLs もサポートされています。リレーモードは、信頼済みルーターが Slack の入口を所有するマネージドデプロイ向けです。

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

## トランスポートの選択

Socket Mode と HTTP Request URLs は、メッセージング、スラッシュコマンド、App Home、インタラクティビティについて機能同等です。機能ではなく、デプロイ形態で選んでください。

| 観点                         | Socket Mode (デフォルト)                                                                                                                            | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不要                                                                                                                                                 | 必須 (DNS、TLS、リバースプロキシまたはトンネル)                                                               |
| アウトバウンドネットワーク   | `wss-primary.slack.com` へのアウトバウンド WSS に到達できる必要があります                                                                            | アウトバウンド WS なし。インバウンド HTTPS のみ                                                               |
| 必要なトークン               | ボットトークン + `connections:write` を持つ App-Level Token                                                                                          | ボットトークン + Signing Secret                                                                                |
| 開発用ノート PC / ファイアウォール内 | そのまま動作します                                                                                                                                   | 公開トンネル (ngrok、Cloudflare Tunnel、Tailscale Funnel) またはステージング Gateway が必要                    |
| 水平スケーリング             | アプリごと、ホストごとに 1 つの Socket Mode セッション。複数の Gateway には個別の Slack アプリが必要                                                 | ステートレスな POST ハンドラー。複数の Gateway レプリカがロードバランサーの背後で 1 つのアプリを共有できます |
| 1 つの Gateway 上の複数アカウント | サポートされています。各アカウントが独自の WS を開きます                                                                                            | サポートされています。登録が衝突しないよう、各アカウントには一意の `webhookPath` (デフォルト `/slack/events`) が必要 |
| スラッシュコマンドのトランスポート | WS 接続経由で配信されます。`slash_commands[].url` は無視されます                                                                                     | Slack が `slash_commands[].url` に POST します。コマンドをディスパッチするにはこのフィールドが必須です         |
| リクエスト署名               | 使用しません (認証は App-Level Token)                                                                                                                | Slack がすべてのリクエストに署名します。OpenClaw は `signingSecret` で検証します                               |
| 接続切断時の復旧             | Slack SDK の自動再接続が有効です。OpenClaw も失敗した Socket Mode セッションを制限付きバックオフで再起動します。Pong タイムアウトのトランスポート調整が適用されます。 | 切断される永続接続はありません。再試行は Slack からのリクエスト単位です                                       |

<Note>
  **Socket Mode を選ぶ**: 単一 Gateway ホスト、開発用ノート PC、`*.slack.com` へのアウトバウンド到達は可能だがインバウンド HTTPS を受けられないオンプレミスネットワークに適しています。

**HTTP Request URLs を選ぶ**: ロードバランサーの背後で複数の Gateway レプリカを実行する場合、アウトバウンド WSS がブロックされているがインバウンド HTTPS は許可されている場合、またはすでにリバースプロキシで Slack Webhook を終端している場合に適しています。
</Note>

<Warning>
  Slack は 1 つのアプリに対して複数の Socket Mode 接続を維持でき、各ペイロードを任意の接続へ配信することがあります。そのため、Slack アプリを共有する個別の OpenClaw Gateway には、同等のルーティング設定と認可設定が必要です。そうでない場合は、Gateway ごとに個別の Slack アプリを使うか、単一のリレー入口を使うか、ロードバランサーの背後で HTTP Request URLs を使ってください。[Using Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections) を参照してください。
</Warning>

### リレーモード

リレーモードは Slack の入口を OpenClaw Gateway から分離します。信頼済みルーターが単一の Slack Socket Mode 接続を所有し、宛先 Gateway を選び、認証済み websocket で型付きイベントを転送します。Gateway は引き続き、アウトバウンドの Slack Web API 呼び出しに自身のボットトークンを使います。

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

リレー URL は localhost を対象にする場合を除き、`wss://` を使用する必要があります。ベアラートークンとルーターのルートテーブルは Slack 認可境界の一部として扱ってください。ルーティングされたイベントは、認可済みアクティベーションとして通常の Slack メッセージハンドラーに入ります。websocket の `hello` フレーム内でルーターが提供する `slack_identity` は、デフォルトのアウトバウンドユーザー名とアイコンを設定できます。ただし、呼び出し元が明示的に指定した ID が優先されます。リレー接続は Socket Mode と同じ制限付きバックオフタイミングで再接続し、切断時にはルーター提供の ID をクリアします。

## インストール

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` は Plugin を登録して有効化します。以下の Slack アプリとチャンネル設定を構成するまでは何もしません。一般的な Plugin インストール規則については [Plugins](/ja-JP/tools/plugin) を参照してください。

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode (デフォルト)">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のいずれかのマニフェストを貼り付ける → **Next** → **Create**。

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
          **Recommended** は Slack Plugin の全機能セットに一致します: App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループ DM、絵文字/ユーザーグループの読み取りです。ワークスペースポリシーでスコープが制限されている場合は **Minimal** を選んでください。これは DM、チャンネル/グループ履歴、メンション、スラッシュコマンドをカバーしますが、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` は除外します。スコープごとの理由と、追加のスラッシュコマンドなどの加算的なオプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        Slack がアプリを作成したら:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` を追加し、保存して App-Level Token をコピーします。
        - **Install App -> Install to Workspace**: Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を構成する">

        推奨 SecretRef 設定:

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

        環境変数フォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP リクエスト URL">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のいずれかのマニフェストを貼り付ける → `https://gateway-host.example.com/slack/events` を公開 Gateway URL に置き換える → **Next** → **Create**。

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
          **推奨** は Slack plugin の全機能セットに一致します。**最小構成** は、制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループ DM（`mpim:*`）、`emoji:read`、`usergroups:read` を除外します。スコープごとの理由については、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド（`slash_commands[].url`、`event_subscriptions.request_url`、`interactivity.request_url` / `message_menu_options_url`）はすべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマではそれぞれ別名にする必要がありますが、OpenClaw はペイロード種別でルーティングするため、単一の `webhookPath`（デフォルトは `/slack/events`）で十分です。`slash_commands[].url` のないスラッシュコマンドは、HTTP モードでは何もせずに失敗します。
        </Info>

        Slack がアプリを作成した後:

        - **Basic Information → App Credentials**: リクエスト検証用の **Signing Secret** をコピーします。
        - **Install App -> Install to Workspace**: Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を設定する">

        推奨される SecretRef 設定:

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
        複数アカウントの HTTP には一意の Webhook パスを使用する

        登録が衝突しないように、各アカウントに個別の `webhookPath`（デフォルトは `/slack/events`）を指定します。
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

OpenClaw は、Socket Mode ではデフォルトで Slack SDK クライアントの pong タイムアウトを 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください:

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

これは、Slack websocket の pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、またはイベントループの枯渇が知られているホストでのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存確認シグナルではありません。

注記:

- `socketMode` は HTTP リクエスト URL モードでは無視されます。
- ベースの `channels.slack.socketMode` 設定は、上書きされない限りすべての Slack アカウントに適用されます。アカウントごとの上書きには `channels.slack.accounts.<accountId>.socketMode` を使用します。これはオブジェクト上書きであるため、そのアカウントで必要なすべてのソケット調整フィールドを含めてください。
- OpenClaw のデフォルトがあるのは `clientPingTimeout`（`15000`）のみです。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ Slack SDK に渡されます。
- Socket Mode の再起動バックオフは約 2 秒から始まり、約 30 秒で上限に達します。回復可能な開始、開始待機、切断の失敗は、チャンネルが停止するまで再試行されます。無効な認証、取り消されたトークン、スコープ不足などの永続的なアカウントエラーと認証情報エラーは、永遠に再試行せずに即座に失敗します。

## マニフェストとスコープのチェックリスト

ベースの Slack アプリマニフェストは、Socket Mode と HTTP リクエスト URL で同じです。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）のみです。

ベースマニフェスト（Socket Mode のデフォルト）:

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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

**HTTP リクエスト URL モード**では、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw にメッセージを送信",
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

### 追加のマニフェスト設定

上記のデフォルトを拡張するさまざまな機能を公開します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブが有効になり、`app_home_opened` を購読します。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードや非公開設定は含まれません。**Messages** タブは Slack DM 用に有効なままです。マニフェストでは、`features.assistant_view`、`assistant:write`、`assistant_thread_started`、`assistant_thread_context_changed` による Slack アシスタントスレッドも有効になります。アシスタントスレッドは専用の OpenClaw スレッドセッションにルーティングされ、Slack から提供されるスレッドコンテキストをエージェントが利用できる状態に保ちます。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    1 つの設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を細かく使い分けられます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 1 つの Slack アプリに一度に登録できるスラッシュコマンドは 25 個までです（Slack プラットフォームの制限）。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)のサブセットに置き換えます。

    <Tabs>
      <Tab title="Socket Mode（デフォルト）">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "新しいセッションを開始",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "現在のセッションをリセット"
    },
    {
      "command": "/compact",
      "description": "セッションコンテキストを圧縮",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "現在の実行を停止"
    },
    {
      "command": "/session",
      "description": "スレッドバインディングの有効期限を管理",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "思考レベルを設定",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "詳細出力を切り替え",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "高速モードを表示または設定",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "推論の表示を切り替え",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "昇格モードを切り替え",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "exec のデフォルトを表示または設定",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "保留中の承認リクエストを承認または拒否",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "モデルを表示または設定",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "プロバイダー/モデルを一覧表示",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "短いヘルプ要約を表示"
    },
    {
      "command": "/commands",
      "description": "生成されたコマンドカタログを表示"
    },
    {
      "command": "/tools",
      "description": "現在のエージェントが今使えるものを表示",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "利用可能な場合はプロバイダーの使用量/クォータを含むランタイムステータスを表示"
    },
    {
      "command": "/tasks",
      "description": "現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示"
    },
    {
      "command": "/context",
      "description": "コンテキストの組み立て方法を説明",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "送信者 ID を表示"
    },
    {
      "command": "/skill",
      "description": "名前でスキルを実行",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "セッションコンテキストを変更せずに補足質問をする",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "セッションコンテキストを変更せずに補足質問をする",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "使用量フッターを制御するか、コスト要約を表示",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP リクエスト URL">
        上記の Socket Mode と同じ `slash_commands` リストを使用し、すべてのエントリに `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "新しいセッションを開始",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "短いヘルプ要約を表示",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        リスト内のすべてのコマンドでその `url` 値を繰り返します。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使用したい場合は、`chat:write.customize` bot スコープを追加します。

    絵文字アイコンを使用する場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ（読み取り操作）">
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
- リレーモードには `botToken` に加えて、`relay.url`、`relay.authToken`、`relay.gatewayId` が必要です。アプリトークンや署名シークレットは使用しません。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken`、`userToken` は、平文の
  文字列または SecretRef オブジェクトを受け入れます。
- 設定トークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN`、`SLACK_USER_TOKEN` の env フォールバックは、それぞれデフォルトアカウントにのみ適用されます。
- `userToken` は読み取り専用動作（`userTokenReadOnly: true`）がデフォルトです。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` フィールドと `*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef
  または別の非インラインシークレットソース経由で設定されているものの、現在のコマンド/ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、
  必須ペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、bot トークンが引き続き優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつ bot トークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| グループ      | デフォルト |
| ---------- | ------- |
| messages   | 有効 |
| reactions  | 有効 |
| pins       | 有効 |
| memberInfo | 有効 |
| emojiList  | 有効 |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け入れ、画像の場合は画像プレビューを、その他のファイルタイプの場合はローカルファイルメタデータを返します。

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

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は、互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングは `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` の下にあり、設定キーとして **安定した Slack チャンネル ID**（例: `C12345678`）を使用する必要があります。

    ランタイムノート: `channels.slack` が完全に欠落している場合（env のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログ出力します（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

    名前/ID 解決:

    - チャンネル許可リストエントリと DM 許可リストエントリは、トークンアクセスが許可する場合に起動時に解決されます
    - 未解決のチャンネル名エントリは設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。ユーザー名/スラッグの直接照合には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー（`#channel-name` または `channel-name`）は、`groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーでは正常にルーティングされることはなく、そのチャンネル内のすべてのメッセージが黙ってブロックされます。これは、ルーティングにチャンネルキーが不要で、名前ベースのキーが機能しているように見える `groupPolicy: "open"` とは異なります。

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

    誤った例（`groupPolicy: "allowlist"` では黙ってブロックされます）:

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
    チャンネルメッセージはデフォルトでメンションによって制御されます。

    メンション元:

    - 明示的なアプリメンション（`<@botId>`）
    - ボットユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read` が必要
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - ボットへの返信スレッドの暗黙動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`。このチャンネルのアカウント/チャットタイプ返信モードを上書き）
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` キー形式: `channel:`、`id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （レガシーのプレフィックスなしキーは現在も `id:` のみにマップされます）

    `ignoreOtherMentions`（デフォルト `false`）は、このボットではなく別のユーザーまたはユーザーグループにメンションしているチャンネルメッセージを破棄します。DM とグループ DM（MPIM）には影響しません。このフィルターには `auth.test` から解決されたボットユーザー ID が必要です。その ID が利用できない場合（たとえばユーザートークンのみの ID）、ゲートはフェイルオープンし、メッセージは変更されずに通過します。

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。ボットが作成したルームメッセージは、送信元ボットがそのルームの `users` 許可リストに明示的に含まれている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID の少なくとも 1 つが現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードと表示名のオーナーエントリは、オーナーの存在を満たしません。オーナーの存在確認には Slack `conversations.members` を使用します。アプリがルームタイプに対応する読み取りスコープ（パブリックチャンネルは `channels:read`、プライベートチャンネルは `groups:read`）を持っていることを確認してください。メンバー検索に失敗した場合、OpenClaw はボットが作成したルームメッセージを破棄します。

    受け入れられたボット作成の Slack メッセージは、共有の [ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用します。デフォルトの予算には `channels.defaults.botLoopProtection` を設定し、ワークスペースまたはチャンネルで別の制限が必要な場合は `channels.slack.botLoopProtection` または `channels.slack.channels.<id>.botLoopProtection` で上書きします。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` としてルーティングされます。チャンネルは `channel`、MPIM は `group` です。
- Slack ルートバインディングは、生のピア ID に加えて `channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け入れます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- 通常のトップレベルチャンネルメッセージは、`replyToMode` が非 `off` の場合でもチャンネルごとのセッションに残ります。
- Slack スレッド返信は、`replyToMode="off"` で送信返信スレッド化が無効化されている場合でも、親 Slack `thread_ts` をセッション接尾辞（`:thread:<threadTs>`）に使用します。
- OpenClaw は、対象のトップレベルチャンネルルートが表示される Slack スレッドを開始すると予想される場合、そのルートを `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` にシードします。これにより、ルートと後続のスレッド返信が 1 つの OpenClaw セッションを共有します。これは `app_mention` イベント、明示的なボットまたは設定済みメンションパターンの一致、非 `off` の `replyToMode` を持つ `requireMention: false` チャンネルに適用されます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、ボットがそのスレッドにすでに参加していても、スレッド内の明示的な `@bot` メンションにのみ応答します。これがない場合、ボットが参加済みのスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド化の制御:

- `channels.slack.channels.<id>.replyToMode`: Slack チャンネル/プライベートチャンネルメッセージのチャンネルごとの上書き
- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- 直接チャットのレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` ツールから明示的な Slack スレッド返信を行うには、`action: "send"` と `threadId` または `replyTo` に加えて `replyBroadcast: true` を設定し、Slack にスレッド返信を親チャンネルにもブロードキャストするよう依頼します。これは Slack の `chat.postMessage` `reply_broadcast` フラグにマップされ、テキストまたは Block Kit 送信でのみサポートされます。メディアアップロードではサポートされません。

`message` ツール呼び出しが Slack スレッド内で実行され、同じチャンネルを対象にする場合、OpenClaw は通常、有効なアカウント、チャットタイプ、またはチャンネルごとの `replyToMode` に従って現在の Slack スレッドを継承します。自動返信と同一チャンネルの `send` または `upload-file` 呼び出しは、同じチャンネルごとの上書きを使用します。代わりに新しい親チャンネルメッセージを強制するには、`action: "send"` または `action: "upload-file"` に `topLevel: true` を設定します。`threadId: null` も同じトップレベルのオプトアウトとして受け入れられます。

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む送信 Slack 返信スレッド化を無効にします。受信 Slack スレッドセッションをフラット化するわけではありません。Slack スレッド内にすでに投稿されたメッセージは、引き続き `:thread:<threadTs>` セッションにルーティングされます。これは Telegram と異なります。Telegram では `"off"` モードでも明示的なタグが引き続き尊重されます。Slack スレッドはチャンネルからメッセージを隠しますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用絵文字を送信します。`ackReactionScope` は、その絵文字が実際に送信される_タイミング_を決定します。

### 絵文字（`ackReaction`）

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は `"eyes"` / 👀）

注:

- Slack はショートコードを想定します（例: `"eyes"`）。
- Slack アカウントまたはグローバルでリアクションを無効化するには `""` を使用します。

### スコープ（`messages.ackReactionScope`）

Slack プロバイダーは `messages.ackReactionScope` からスコープを読み取ります（デフォルト `"group-mentions"`）。現在、Slack アカウントまたは Slack チャンネルレベルの上書きはありません。この値は Gateway 全体でグローバルです。

値:

- `"all"`: DM とグループでリアクションします。
- `"direct"`: DM でのみリアクションします。
- `"group-all"`: すべてのグループメッセージでリアクションします（DM なし）。
- `"group-mentions"`（デフォルト）: グループでリアクションしますが、ボットがメンションされた場合（またはオプトインしたグループメンション可能対象内）のみです。**DM は除外されます。**
- `"off"` / `"none"`: リアクションしません。

<Note>
デフォルトスコープ（`"group-mentions"`）では、ダイレクトメッセージで ack リアクションは発火しません。受信 Slack DM で設定済みの `ackReaction`（例: `"eyes"`）を表示するには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定します。`messages.ackReactionScope` は Slack プロバイダー起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します:

- `off`: ライブプレビューストリーミングを無効化します。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力に置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中は進行状況テキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール/進行状況更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。個別のツール/進行状況メッセージを維持するには `false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生の command/exec テキストを隠しながらコンパクトなツール進行状況行を維持するには `status` に設定します（デフォルト: `raw`）。

コンパクトな進行状況行を維持しながら、生の command/exec テキストを非表示にします:

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

Slack ネイティブ進行状況タスクカードは、progress モードでオプトインです。作業中に Slack ネイティブの計画/タスクカードを送信し、完了時に同じタスクカードを更新するには、`channels.slack.streaming.mode="progress"` とともに `channels.slack.streaming.progress.nativeTaskCards` を `true` に設定します。このフラグがない場合、progress モードはポータブルな下書きプレビュー動作を維持します。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネル、グループチャット、トップレベル DM ルートでは、ネイティブストリーミングが利用できない場合や返信スレッドが存在しない場合でも、通常の下書きプレビューを使用できます。
- トップレベル Slack DM はデフォルトでスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw は DM 内に下書きプレビューを投稿して編集します。
- メディアと非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終結果は保留中のプレビュー編集をキャンセルします。対象となるテキスト/block の最終結果は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信途中で失敗した場合、OpenClaw は残りのペイロードを通常の配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使用します:

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

Slack ネイティブ進行状況タスクカードにオプトインします:

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

レガシーキー:

- `channels.slack.streamMode`（`replace | status_final | append`）は、`channels.slack.streaming.mode` のレガシーランタイムエイリアスです。
- boolean `channels.slack.streaming` は、`channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` のレガシーランタイムエイリアスです。
- トップレベルの `channels.slack.chunkMode` と `channels.slack.nativeStreaming` は、`channels.slack.streaming.chunkMode` と `channels.slack.streaming.nativeTransport` のレガシーランタイムエイリアスです。
- 永続化された Slack ストリーミング設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

## タイピングリアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信 Slack メッセージに一時的なリアクションを追加し、実行完了時に削除します。これは、デフォルトの「is typing...」ステータスインジケーターを使用するスレッド返信の外で最も有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注:

- Slack はショートコードを想定します（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートであり、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack ファイル添付は、Slack がホストするプライベート URL（トークン認証リクエストフロー）からダウンロードされ、取得が成功しサイズ制限が許可する場合にメディアストアへ書き込まれます。ファイルプレースホルダーには Slack `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使われます。Slack ファイル取得が停止または失敗した場合、OpenClaw はメッセージ処理を続行し、ファイルプレースホルダーにフォールバックします。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使います（デフォルト `8000`、Slack 自身のメッセージ長制限で上限あり）
    - `channels.slack.streaming.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使い、スレッド返信（`thread_ts`）を含められます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトを使います

  </Accordion>

  <Accordion title="配信先">
    推奨される明示的な宛先:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキスト/ブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信では、具体的な会話 ID が必要なため、まず Slack conversation API 経由で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュの挙動

スラッシュコマンドは、Slack では単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要です。代わりに、`channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは**オフ**のため、`commands.native: "auto"` は Slack ネイティブコマンドを有効にしません。

```txt
/help
```

ネイティブ引数メニューは、優先順位に従って次のいずれかとしてレンダリングされます。

- 3〜5 個の十分短いオプション: オーバーフロー（"..."）メニュー
- 100 個を超えるオプションで、非同期オプションフィルタリングが利用可能: 外部 select
- 1〜2 個のオプション、または select にはエンコード値が長すぎる任意のオプション: ボタンブロック
- それ以外（6〜100 個のオプション、または非同期フィルタリングなしで 100 個超）: 静的 select メニュー。メニューごとに 100 オプションで分割

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、コマンド実行は引き続き `CommandTargetSessionKey` を使って対象の会話セッションにルーティングします。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトでは無効です。
新しいエージェント、CLI、Plugin 出力では、共有の
`presentation` ボタンまたは select ブロックを優先してください。これらは同じ Slack インタラクション
パスを使いながら、他のチャンネルでも段階的に劣化します。

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

有効化されている場合でも、エージェントは非推奨の Slack 専用返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択を
既存の Slack インタラクションイベントパスに戻します。古い
プロンプトや Slack 固有のエスケープハッチでは維持し、新しい
ポータブルコントロールには共有 presentation を使ってください。

ディレクティブコンパイラ API も、新しい producer コードでは非推奨です。

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新しい Slack レンダリングのコントロールには、`presentation` ペイロードと `buildSlackPresentationBlocks(...)` を使ってください。

注:

- これは Slack 固有のレガシー UI です。他のチャンネルは Slack Block
  Kit ディレクティブを独自のボタンシステムへ変換しません。
- インタラクティブ callback 値は OpenClaw が生成した不透明なトークンであり、エージェントが作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信せず、元のテキスト返信にフォールバックします。

### Plugin 所有のモーダル送信

インタラクティブハンドラーを登録する Slack Plugin は、OpenClaw が
エージェント可視のシステムイベント用にペイロードを圧縮する前に、モーダルの
`view_submission` と `view_closed` ライフサイクルイベントも受け取れます。Slack モーダルを開くときは、次のルーティング
パターンのいずれかを使ってください。

- `callback_id` を `openclaw:<namespace>:<payload>` に設定します。
- または、既存の `callback_id` を維持し、モーダルの `private_metadata` に `pluginInteractiveData:
"<namespace>:<payload>"` を入れます。

ハンドラーは `ctx.interaction.kind` を `view_submission` または
`view_closed` として受け取り、正規化済みの `inputs` と Slack からの完全な生の `stateValues` オブジェクトを受け取ります。
callback-id のみのルーティングで Plugin ハンドラーを呼び出すには十分です。モーダルが
エージェント可視のシステムイベントも生成すべき場合は、既存のモーダル `private_metadata` のユーザー/セッションルーティングフィールドを含めてください。エージェントは
コンパクトで編集済みの `Slack interaction: ...` システムイベントを受け取ります。ハンドラーが
`systemEvent.summary`、`systemEvent.reference`、または `systemEvent.data` を返す場合、それらの
フィールドはそのコンパクトなイベントに含まれるため、エージェントは完全なフォームペイロードを見ることなく
Plugin 所有のストレージを参照できます。

## Slack のネイティブ承認

Slack は Web UI またはターミナルにフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec と Plugin の承認は、Slack ネイティブの Block Kit プロンプトとしてレンダリングできます。
- `channels.slack.execApprovals.*` は、ネイティブ exec 承認クライアントの有効化と DM/チャンネルルーティング設定のままです。
- Exec 承認 DM は `channels.slack.execApprovals.approvers` または `commands.ownerAllowFrom` を使います。
- Plugin 承認は、発信元セッションのネイティブ承認クライアントとして Slack が有効な場合、または `approvals.plugin` が発信元 Slack セッションまたは Slack ターゲットにルーティングする場合に、Slack ネイティブボタンを使います。
- Plugin 承認 DM は、`channels.slack.allowFrom`、名前付きアカウントの `allowFrom`、またはアカウントのデフォルトルートから Slack Plugin 承認者を使います。
- 承認者の認可は引き続き適用されます。exec 専用の承認者は、Plugin 承認者でもない限り Plugin リクエストを承認できません。

これは他のチャンネルと同じ共有承認ボタン面を使います。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に Block Kit ボタンとして直接レンダリングされます。
これらのボタンがある場合、それらが主要な承認 UX です。OpenClaw は、
ツール結果がチャット承認を利用できない、または手動承認が唯一のパスであると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

`enabled` が未設定または `"auto"` で、少なくとも 1 つの
exec 承認者が解決される場合、Slack はネイティブ exec 承認を自動有効化します。Slack は、Slack Plugin 承認者が解決され、リクエストがネイティブクライアントフィルターに一致する場合、このネイティブクライアント
パスを通じてネイティブ Plugin 承認も処理できます。Slack をネイティブ承認クライアントとして明示的に無効化するには
`enabled: false` を設定します。承認者が解決される場合にネイティブ承認を強制的に有効にするには `enabled: true` を設定します。Slack exec 承認を無効化しても、
`approvals.plugin` 経由で有効化されるネイティブ Slack Plugin 承認配信は無効化されません。Plugin 承認
配信は代わりに Slack Plugin 承認者を使います。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または
発信元チャット配信にオプトインする場合だけです。

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

共有 `approvals.exec` 転送は別物です。exec 承認プロンプトも
他のチャットまたは明示的な帯域外ターゲットへルーティングする必要がある場合にのみ使ってください。共有 `approvals.plugin` 転送も
別物です。Slack ネイティブ配信は、Slack が Plugin
承認リクエストをネイティブに処理できる場合にのみ、そのフォールバックを抑制します。

同一チャットの `/approve` も、すでにコマンドをサポートしている Slack チャンネルと DM で動作します。承認転送モデル全体については、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用上の挙動

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト（「Also send to channel」スレッド返信）は通常のユーザーメッセージとして処理されます。
- リアクション追加/削除イベントはシステムイベントにマッピングされます。
- メンバー参加/退出、チャンネル作成/名前変更、ピン追加/削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャンネル設定キーを移行できます。
- チャンネルトピック/目的メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストへ注入される場合があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定済み送信者許可リストでフィルタリングされます。
- ブロックアクション、ショートカット、モーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択された値、ラベル、ピッカー値、`workflow_*` メタデータ
  - グローバルショートカット: callback とアクターのメタデータ。アクターの直接セッションへルーティング
  - メッセージショートカット: callback、アクター、チャンネル、スレッド、選択されたメッセージのコンテキスト
  - モーダル `view_submission` と `view_closed` イベント。ルーティング済みチャンネルメタデータとフォーム入力を含む

Slack アプリ設定でグローバルショートカットまたはメッセージショートカットを定義し、空でない任意の callback ID を使ってください。OpenClaw は一致するショートカットペイロードを確認応答し、他の Slack インタラクションと同じ DM/チャンネル送信者ポリシーを適用し、サニタイズ済みイベントをルーティング先のエージェントセッションにキューイングします。トリガー ID と応答 URL はエージェントコンテキストから編集されます。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急時用。必要でない限りオフのままにする）
- チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- アンフurl: `chat.postMessage` のリンク/メディアプレビュー制御用の `unfurlLinks`（デフォルト: `false`）、`unfurlMedia`。リンクプレビューに戻すには `unfurlLinks: true` を設定します
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    順番に確認してください:

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`）— **キーはチャンネル名**（`#channel-name`）ではなく、**チャンネル ID**（`C12345678`）である必要があります。チャンネルルーティングはデフォルトで ID 優先のため、`groupPolicy: "allowlist"` では名前ベースのキーは黙って失敗します。ID を見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL 末尾の `C...` の値がチャンネル ID です。
    - `requireMention`
    - チャンネルごとの `users` 許可リスト
    - `messages.groupChat.visibleReplies`: 通常のグループ/チャンネルリクエストのデフォルトは `"automatic"` です。`"message_tool"` を選択していて、ログに `message(action=send)` 呼び出しのないアシスタントテキストが表示される場合、モデルが可視メッセージツールのパスを見逃しています。このモードでは最終テキストは非公開のままです。抑制されたペイロードメタデータは gateway の詳細ログで確認するか、通常のアシスタント最終返信をすべてレガシーパス経由で投稿したい場合は `"automatic"` に設定してください。
    - `messages.groupChat.unmentionedInbound`: これが `"room_event"` の場合、メンションされていない許可済みチャンネルの会話は環境コンテキストとなり、エージェントが `message` ツールを呼び出さない限り沈黙したままです。[環境ルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リスト項目（`dmPolicy: "open"` でも `channels.slack.allowFrom: ["*"]` が必要です）
    - グループ DM は MPIM 処理を使用します。`channels.slack.dm.groupEnabled` を有効にし、設定している場合は `channels.slack.dm.groupChannels` に MPIM を含めます
    - Slack Assistant の DM イベント: `drop message_changed` に言及する詳細ログは、通常、Slack がメッセージメタデータ内に復元可能な人間の送信者を持たない、編集済みの Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket モードが接続されない">
    Slack アプリ設定で、Bot + アプリトークンと Socket Mode の有効化を検証します。
    App-Level Token には `connections:write` が必要で、Bot User OAuth Token
    の Bot トークンはアプリトークンと同じ Slack アプリ/ワークスペースに属している必要があります。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    設定されていますが、現在のランタイムが SecretRef に基づく値を解決できませんでした。

    `slack socket mode failed to start; retry ...` のようなログは復旧可能な
    起動失敗です。スコープ不足、取り消されたトークン、無効な認証は代わりに即時失敗します。
    `slack token mismatch ...` ログは、Bot トークンとアプリトークンが別々の Slack アプリに
    属しているように見えることを意味します。Slack アプリの認証情報を修正してください。

  </Accordion>

  <Accordion title="HTTP モードがイベントを受信しない">
    検証項目:

    - 署名シークレット
    - Webhook パス
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`
    - 公開 URL が TLS を終端し、リクエストを Gateway パスへ転送している
    - Slack アプリの `request_url` パスが `channels.slack.webhookPath`（デフォルト `/slack/events`）と完全に一致している

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは設定されていますが、現在のランタイムが SecretRef に基づく署名シークレットを解決できませんでした。

    `slack: webhook path ... already registered` ログが繰り返される場合、2 つの HTTP
    アカウントが同じ `webhookPath` を使用していることを意味します。各アカウントに別々のパスを指定してください。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    意図していたものを確認してください:

    - Slack に登録された一致するスラッシュコマンドを使うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    Slack はスラッシュコマンドを自動で作成または削除しません。`commands.native: "auto"` は Slack ネイティブコマンドを有効にしません。`true` を使用し、Slack アプリで一致するコマンドを作成してください。HTTP モードでは、すべての Slack スラッシュコマンドに Gateway URL を含める必要があります。Socket Mode では、コマンドペイロードは websocket 経由で到着し、Slack は `slash_commands[].url` を無視します。

    `commands.useAccessGroups`、DM 認可、チャンネル許可リスト、
    チャンネルごとの `users` 許可リストも確認してください。Slack は
    ブロックされたスラッシュコマンド送信者に対して、次のようなエフェメラルエラーを返します:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 添付ファイルの vision リファレンス

Slack のファイルダウンロードが成功し、サイズ制限が許す場合、Slack はダウンロードしたメディアをエージェントターンに添付できます。画像ファイルはメディア理解パス経由、または vision 対応の返信モデルへ直接渡すことができます。その他のファイルは画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディアタイプ                 | ソース               | 現在の動作                                                                        | 注記                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | vision 対応処理のためにダウンロードされ、ターンへ添付される                   | ファイルごとの上限: `channels.slack.mediaMaxMb`（デフォルト 20 MB）       |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けファイルコンテキストとして公開される | Slack インバウンドは PDF を画像 vision 入力へ自動変換しない |
| その他のファイル                    | Slack ファイル URL       | 可能な場合にダウンロードされ、ファイルコンテキストとして公開される                              | バイナリファイルは画像入力として扱われない                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接メディアがない場合、ルートメッセージのファイルをコンテキストとしてハイドレートできる | ファイルのみの開始メッセージは添付ファイルプレースホルダーを使用する      |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは個別に評価される                                              | Slack 処理はメッセージあたり 8 ファイルに制限される                     |

### インバウンドパイプライン

ファイル添付を含む Slack メッセージが到着した場合:

1. OpenClaw は Bot トークンを使用して Slack のプライベート URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロードされたメディアのパスとコンテンツタイプがインバウンドコンテキストに追加されます。
4. 画像対応のモデル/ツールパスは、そのコンテキストの画像添付を使用できます。
5. 画像以外のファイルは、それらを処理できるツール向けのファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付の継承

メッセージがスレッド内に到着した場合（`thread_ts` 親を持つ場合）:

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとしてハイドレートできます。
- 直接の返信添付は、ルートメッセージ添付より優先されます。
- ファイルのみでテキストがないルートメッセージは、フォールバックがそのファイルを引き続き含められるように、添付ファイルプレースホルダーで表現されます。

### 複数添付の処理

単一の Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて個別に処理されます。
- ダウンロードされたメディア参照はメッセージコンテキストに集約されます。
- 処理順序はイベントペイロード内の Slack のファイル順に従います。
- ある添付のダウンロード失敗が他の添付をブロックすることはありません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルごとに 20 MB。`channels.slack.mediaMaxMb` で設定できます。
- **ダウンロード失敗**: Slack が提供できないファイル、期限切れ URL、アクセスできないファイル、サイズ超過ファイル、Slack 認証/ログイン HTML レスポンスは、未対応フォーマットとして報告されるのではなくスキップされます。
- **Vision モデル**: 画像分析は、vision をサポートしている場合はアクティブな返信モデルを使用し、そうでない場合は `agents.defaults.imageModel` で設定された画像モデルを使用します。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れ Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されない                                                 | Slack にファイルを再アップロードする                                                |
| Vision モデルが設定されていない            | 画像添付はメディア参照として保存されるが、画像として分析されない | `agents.defaults.imageModel` を設定するか、vision 対応の返信モデルを使用する |
| 非常に大きい画像（デフォルトで > 20 MB） | サイズ上限によりスキップされる                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                       |
| 転送/共有された添付           | テキストと Slack ホストの画像/ファイルメディアはベストエフォート                       | OpenClaw スレッドで直接再共有する                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像 vision 経由では自動的にルーティングされない  | ファイルメタデータには `download-file` を、PDF 分析には `pdf` ツールを使用する   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)

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
    脅威モデルとハードニング。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    設定のレイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
