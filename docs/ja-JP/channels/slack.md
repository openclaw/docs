---
read_when:
    - Slackのセットアップ、またはSlackソケット、HTTP、リレーモードのデバッグ
summary: Slack のセットアップと実行時の動作（Socket Mode、HTTP Request URL、リレーモード）
title: Slack
x-i18n:
    generated_at: "2026-07-05T01:53:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b8011f0fce235aa3995ab93c5716ed2112a847cf3dc7a6f9589048d9575bafc
    source_path: channels/slack.md
    workflow: 16
---

本番運用に対応し、Slack アプリ統合経由でDMとチャンネルを利用できます。デフォルトモードはSocket Modeです。HTTP Request URLもサポートされています。リレーモードは、信頼済みルーターがSlackの入口を所有するマネージドデプロイメント向けです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## Socket ModeまたはHTTP Request URLの選択

どちらのトランスポートも本番運用に対応しており、メッセージング、スラッシュコマンド、App Home、インタラクティブ機能で機能は同等です。機能ではなくデプロイ形態に基づいて選択してください。

| 懸念事項                     | Socket Mode（デフォルト）                                                                                                                           | HTTP Request URL                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開Gateway URL              | 不要                                                                                                                                                 | 必須（DNS、TLS、リバースプロキシまたはトンネル）                                                              |
| アウトバウンドネットワーク   | `wss-primary.slack.com`へのアウトバウンドWSSに到達できる必要があります                                                                               | アウトバウンドWSなし。インバウンドHTTPSのみ                                                                   |
| 必要なトークン               | Bot token + `connections:write`付きApp-Level Token                                                                                                   | Bot token + Signing Secret                                                                                     |
| 開発用ノートPC / ファイアウォール配下 | そのまま動作します                                                                                                                                   | 公開トンネル（ngrok、Cloudflare Tunnel、Tailscale Funnel）またはステージングGatewayが必要                      |
| 水平スケーリング             | ホストごと、アプリごとにSocket Modeセッションは1つです。複数のGatewayには個別のSlackアプリが必要です                                                | ステートレスなPOSTハンドラーです。複数のGatewayレプリカがロードバランサー配下で1つのアプリを共有できます     |
| 1つのGateway上の複数アカウント | サポートされています。各アカウントが独自のWSを開きます                                                                                              | サポートされています。登録が衝突しないよう、各アカウントには一意の`webhookPath`（デフォルトは`/slack/events`）が必要です |
| スラッシュコマンドのトランスポート | WS接続経由で配信されます。`slash_commands[].url`は無視されます                                                                                       | Slackが`slash_commands[].url`へPOSTします。コマンドをディスパッチするにはこのフィールドが必須です              |
| リクエスト署名               | 使用されません（認証はApp-Level Tokenです）                                                                                                         | Slackがすべてのリクエストに署名します。OpenClawは`signingSecret`で検証します                                  |
| 接続切断時の復旧             | Slack SDKの自動再接続が有効です。OpenClawも失敗したSocket Modeセッションを制限付きバックオフで再起動します。Pongタイムアウトのトランスポート調整が適用されます。 | ドロップする永続接続はありません。再試行はSlackからのリクエスト単位です                                      |

<Note>
  **Socket Modeを選択**するのは、単一Gatewayホスト、開発用ノートPC、`*.slack.com`へのアウトバウンドには到達できるがインバウンドHTTPSは受け付けられないオンプレミスネットワークの場合です。

**HTTP Request URLを選択**するのは、ロードバランサー配下で複数のGatewayレプリカを実行する場合、アウトバウンドWSSはブロックされているがインバウンドHTTPSは許可されている場合、またはすでにリバースプロキシでSlack Webhookを終端している場合です。
</Note>

### リレーモード

リレーモードはSlackの入口をOpenClaw Gatewayから分離します。信頼済みルーターが
単一のSlack Socket Mode接続を所有し、宛先Gatewayを選択し、認証済みwebsocket経由で型付き
イベントを転送します。GatewayはアウトバウンドSlack Web API呼び出しに引き続きbot tokenを使用します。

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

リレーURLはlocalhostを対象にする場合を除き、`wss://`を使用する必要があります。bearer tokenと
ルーターのルートテーブルはSlack認可境界の一部として扱ってください。ルーティングされたイベントは
認可済みアクティベーションとして通常のSlackメッセージハンドラーに入ります。websocketの`hello`フレーム内でルーターが提供する`slack_identity`
はデフォルトのアウトバウンドユーザー名とアイコンを設定できますが、呼び出し元が明示的に指定した
identityがある場合はそちらが優先されます。リレー接続はSocket Modeと同じ制限付きバックオフタイミングで再接続し、
切断時にはルーター提供のidentityをクリアします。

## インストール

チャンネルを設定する前にSlackをインストールします。

```bash
openclaw plugins install @openclaw/slack
```

`plugins install`はPluginを登録して有効化します。以下のSlackアプリとチャンネル設定を構成するまで、Pluginはまだ何もしません。一般的なPluginの動作とインストール規則については[Plugins](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しいSlackアプリを作成">
        [api.slack.com/apps](https://api.slack.com/apps/new)を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 下記いずれかのマニフェストを貼り付け → **Next** → **Create**。

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
          **Recommended**はSlack Pluginの全機能セットに一致します。App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループDM、emoji/usergroupの読み取りです。ワークスペースポリシーでスコープが制限される場合は**Minimal**を選択してください。これはDM、チャンネル/グループ履歴、メンション、スラッシュコマンドをカバーしますが、ファイル、リアクション、ピン、グループDM（`mpim:*`）、`emoji:read`、`usergroups:read`は除外されます。スコープごとの理由と追加のスラッシュコマンドなどの追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        Slackがアプリを作成した後:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write`を追加し、保存して、App-Level Tokenをコピーします。
        - **Install App -> Install to Workspace**: Bot User OAuth Tokenをコピーします。

      </Step>

      <Step title="OpenClawを設定">

        推奨SecretRefセットアップ:

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

        envフォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gatewayを起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **新しいアプリを作成** → **マニフェストから** → ワークスペースを選択 → 以下のいずれかのマニフェストを貼り付け → `https://gateway-host.example.com/slack/events` を公開 Gateway URL に置き換え → **次へ** → **作成**。

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
          **推奨** は Slack Plugin の全機能セットに対応します。**最小構成** は、制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` を外します。スコープごとの根拠については、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド (`slash_commands[].url`、`event_subscriptions.request_url`、`interactivity.request_url` / `message_menu_options_url`) は、すべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマでは個別の名前が必要ですが、OpenClaw はペイロード種別でルーティングするため、単一の `webhookPath` (デフォルト `/slack/events`) で十分です。`slash_commands[].url` のないスラッシュコマンドは、HTTP モードでは通知なしに何もしません。
        </Info>

        Slack がアプリを作成した後:

        - **基本情報 → アプリ認証情報**: リクエスト検証用の **署名シークレット** をコピーします。
        - **アプリをインストール -> ワークスペースにインストール**: Bot User OAuth Token をコピーします。

      </Step>

      <Step title="Configure OpenClaw">

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
        複数アカウントの HTTP には一意の webhook パスを使用する

        登録が衝突しないように、各アカウントに個別の `webhookPath` (デフォルト `/slack/events`) を指定します。
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

## Socket Mode トランスポートの調整

OpenClaw は、Socket Mode ではデフォルトで Slack SDK クライアントの pong タイムアウトを 15 秒に設定します。ワークスペース固有またはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください:

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

これは、Slack WebSocket の pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、またはイベントループの枯渇が既知のホストで実行する場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存シグナルではありません。

注:

- `socketMode` は HTTP Request URL モードでは無視されます。
- ベースの `channels.slack.socketMode` 設定は、上書きされない限りすべての Slack アカウントに適用されます。アカウントごとの上書きには `channels.slack.accounts.<accountId>.socketMode` を使用します。これはオブジェクト上書きであるため、そのアカウントに必要なすべての socket 調整フィールドを含めてください。
- OpenClaw のデフォルトがあるのは `clientPingTimeout` (`15000`) のみです。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ Slack SDK に渡されます。
- Socket Mode の再起動バックオフは約 2 秒から始まり、約 30 秒で上限に達します。復旧可能な起動、起動待機、切断の失敗は、チャネルが停止するまで再試行されます。無効な認証、取り消されたトークン、スコープ不足などの永続的なアカウントおよび認証情報エラーは、無限に再試行するのではなく、即座に失敗します。

## マニフェストとスコープのチェックリスト

ベースの Slack アプリマニフェストは、Socket Mode と HTTP Request URLs で同じです。異なるのは `settings` ブロック (およびスラッシュコマンドの `url`) のみです。

ベースマニフェスト (Socket Mode のデフォルト):

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

上記のデフォルトを拡張する各種機能を公開します。

デフォルトのマニフェストは、Slack App Home の **Home** タブを有効にし、`app_home_opened` を購読します。ワークスペースのメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードや非公開設定は含まれません。**Messages** タブは Slack DM 用に有効なままです。マニフェストは `features.assistant_view`、`assistant:write`、`assistant_thread_started`、`assistant_thread_context_changed` による Slack assistant スレッドも有効にします。assistant スレッドは専用の OpenClaw スレッドセッションにルーティングされ、Slack から提供されるスレッドコンテキストをエージェントで利用可能な状態に保ちます。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を細かな違いに応じて使用できます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 一度に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)のサブセットに置き換えます。

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
      <Tab title="HTTP リクエスト URL">
        上記の Socket Mode と同じ `slash_commands` リストを使用し、各エントリに `"url": "https://gateway-host.example.com/slack/events"` を追加します。例:

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

        リスト内のすべてのコマンドでその `url` 値を繰り返します。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の作成者スコープ (書き込み操作)">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID (カスタムユーザー名とアイコン) を使用したい場合は、`chat:write.customize` bot スコープを追加します。

    絵文字アイコンを使用する場合、Slack は `:emoji_name:` 構文を想定します。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ (読み取り操作)">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack 検索の読み取りに依存する場合)

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- リレーモードには `botToken` に加えて `relay.url`、`relay.authToken`、`relay.gatewayId` が必要です。アプリトークンや署名シークレットは使用しません。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken`、`userToken` は、プレーンテキスト
  文字列または SecretRef オブジェクトを受け付けます。
- 設定トークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の env フォールバックは、デフォルトアカウントにのみ適用されます。
- `userToken` は設定専用 (env フォールバックなし) で、デフォルトでは読み取り専用動作 (`userTokenReadOnly: true`) になります。

ステータススナップショットの動作:

- Slack アカウント検査は、認証情報ごとの `*Source` フィールドと `*Status`
  フィールド (`botToken`、`appToken`、`signingSecret`、`userToken`) を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、アカウントが SecretRef
  または別の非インラインシークレットソース経由で設定されているものの、現在のコマンド/ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、
  必須ペアは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合ユーザートークンを優先できます。書き込みでは、bot トークンが引き続き優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつ bot トークンが利用できない場合にのみ許可されます。
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

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` は受信ファイルプレースホルダーに表示される Slack ファイル ID を受け付け、画像の場合は画像プレビューを、その他のファイルタイプの場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正規の DM 許可リストです。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    DM フラグ:

    - `dm.enabled` (デフォルト true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (レガシー)
    - `dm.groupEnabled` (グループ DM のデフォルトは false)
    - `dm.groupChannels` (任意の MPIM 許可リスト)

    複数アカウントの優先順位:

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

    チャンネル許可リストは `channels.slack.channels` 配下にあり、設定キーとして**安定した Slack チャンネル ID** (例: `C12345678`) を使用する必要があります。

    ランタイムメモ: `channels.slack` が完全に存在しない場合 (env のみのセットアップ)、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します (`channels.defaults.groupPolicy` が設定されている場合でも)。

    名前/ID 解決:

    - チャンネル許可リストエントリと DM 許可リストエントリは、トークンアクセスで許可される場合、起動時に解決されます
    - 解決できないチャンネル名エントリは設定どおり保持されますが、デフォルトではルーティング時に無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/スラッグ照合には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー (`#channel-name` または `channel-name`) は `groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーは正常にルーティングされることがなく、そのチャンネル内のすべてのメッセージはサイレントにブロックされます。これは、チャンネルキーがルーティングに不要で、名前ベースのキーが機能しているように見える `groupPolicy: "open"` とは異なります。

    常に Slack チャンネル ID をキーとして使用してください。確認方法: Slack でチャンネルを右クリック → **リンクをコピー** — ID (`C...`) は URL の末尾に表示されます。

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

    誤った例 (`groupPolicy: "allowlist"` ではサイレントにブロックされます):

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
    チャンネルメッセージはデフォルトでメンションゲート付きです。

    メンションのソース:

    - 明示的なアプリメンション (`<@botId>`)
    - bot ユーザーがそのユーザーグループのメンバーである場合の Slack ユーザーグループメンション (`<!subteam^S...>`)。`usergroups:read` が必要です
    - メンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - bot への暗黙的な返信スレッド動作 (`thread.requireExplicitMention` が `true` の場合は無効)

    チャンネルごとの制御 (`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ):

    - `requireMention`
    - `ignoreOtherMentions`
    - `users` (許可リスト)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `channel:`, `id:`, `e164:`, `username:`, `name:`, または `"*"` ワイルドカード
      (従来の接頭辞なしキーは引き続き `id:` のみにマッピングされます)

    `ignoreOtherMentions` のデフォルトは `false` です。`true` の場合、別のユーザーまたはユーザーグループにメンションしているがこの bot にはメンションしていないチャンネルメッセージは、保留中のコンテキストとして保存され、処理されません。DM とグループ DM には影響しません。このフィルターには `auth.test` からの bot ユーザー ID が必要です。その ID が利用できない場合、メッセージは変更されずに通過します。

    `allowBots` はチャンネルとプライベートチャンネルでは保守的です。bot が作成したルームメッセージは、送信元 bot がそのルームの `users` 許可リストに明示的に含まれている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID の少なくとも 1 つが現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードと表示名のオーナーエントリは、オーナーの存在条件を満たしません。オーナーの存在確認には Slack `conversations.members` を使用します。アプリにルーム種別に対応する読み取りスコープがあることを確認してください (パブリックチャンネルは `channels:read`、プライベートチャンネルは `groups:read`)。メンバー検索が失敗した場合、OpenClaw は bot が作成したルームメッセージを破棄します。

    受け入れられた bot 作成の Slack メッセージは、共有の [bot ループ保護](/ja-JP/channels/bot-loop-protection)を使用します。デフォルトの上限には `channels.defaults.botLoopProtection` を設定し、ワークスペースまたはチャンネルに別の制限が必要な場合は `channels.slack.botLoopProtection` または `channels.slack.channels.<id>.botLoopProtection` で上書きします。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` としてルーティングされ、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて `channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け付けます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションにまとめられます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- 通常のトップレベルチャンネルメッセージは、`replyToMode` が非 `off` の場合でも、チャンネルごとのセッションに残ります。
- Slack スレッド返信は、送信返信スレッド化が `replyToMode="off"` で無効化されている場合でも、親 Slack `thread_ts` をセッションサフィックス (`:thread:<threadTs>`) に使用します。
- OpenClaw は、対象のトップレベルチャンネルルートが表示される Slack スレッドを開始すると見込まれる場合、そのルートを `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` にシードします。これにより、ルートと後続のスレッド返信が 1 つの OpenClaw セッションを共有します。これは `app_mention` イベント、明示的な bot または設定済みメンションパターン一致、非 `off` の `replyToMode` を持つ `requireMention: false` チャンネルに適用されます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションの開始時に取得する既存スレッドメッセージの数を制御します (デフォルト `20`、無効化するには `0` を設定)。
- `channels.slack.thread.requireExplicitMention` (デフォルト `false`): `true` の場合、暗黙的なスレッドメンションを抑制し、bot がすでにそのスレッドに参加している場合でも、スレッド内の明示的な `@bot` メンションにのみ bot が応答します。これがない場合、bot が参加済みのスレッド内の返信は `requireMention` ゲートを迂回します。

返信スレッド化の制御:

- `channels.slack.replyToMode`: `off|first|all|batched` (デフォルト `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット向けの従来フォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` ツールから明示的な Slack スレッド返信を行うには、`action: "send"` と `threadId` または `replyTo` とともに `replyBroadcast: true` を設定して、Slack にスレッド返信を親チャンネルにもブロードキャストするよう要求します。これは Slack の `chat.postMessage` `reply_broadcast` フラグに対応し、テキストまたは Block Kit 送信でのみサポートされます。メディアアップロードではサポートされません。

`message` ツール呼び出しが Slack スレッド内で実行され、同じチャンネルを対象にしている場合、OpenClaw は通常 `replyToMode` に従って現在の Slack スレッドを継承します。代わりに新しい親チャンネルメッセージを強制するには、`action: "send"` または `action: "upload-file"` に `topLevel: true` を設定します。`threadId: null` も同じトップレベルのオプトアウトとして受け付けられます。

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む送信 Slack 返信スレッド化を無効にします。これは受信 Slack スレッドセッションをフラット化しません。Slack スレッド内にすでに投稿されたメッセージは、引き続き `:thread:<threadTs>` セッションにルーティングされます。これは Telegram とは異なります。Telegram では、`"off"` モードでも明示的なタグが引き続き尊重されます。Slack スレッドはチャンネルからメッセージを隠しますが、Telegram の返信はインラインで表示されたままです。
</Note>

## Ack リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。`ackReactionScope` は、その絵文字が実際に送信される_タイミング_を決定します。

### 絵文字 (`ackReaction`)

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ `"eyes"` / 👀)

注記:

- Slack はショートコードを期待します (例: `"eyes"`)。
- Slack アカウントまたはグローバルでリアクションを無効化するには `""` を使用します。

### スコープ (`messages.ackReactionScope`)

Slack プロバイダーは `messages.ackReactionScope` (デフォルト `"group-mentions"`) からスコープを読み取ります。現在、Slack アカウント単位または Slack チャンネル単位の上書きはありません。この値は Gateway 全体でグローバルです。

値:

- `"all"`: DM とグループでリアクションします。
- `"direct"`: DM でのみリアクションします。
- `"group-all"`: すべてのグループメッセージでリアクションします (DM なし)。
- `"group-mentions"` (デフォルト): グループでリアクションしますが、bot がメンションされた場合のみです (またはオプトインしたグループメンション対象内)。**DM は除外されます。**
- `"off"` / `"none"`: リアクションしません。

<Note>
デフォルトスコープ (`"group-mentions"`) は、ダイレクトメッセージでは ack リアクションを発火しません。受信 Slack DM で設定済みの `ackReaction` (例: `"eyes"`) を表示するには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定します。`messages.ackReactionScope` は Slack プロバイダー起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
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

`channels.slack.streaming` はライブプレビューの動作を制御します:

- `off`: ライブプレビューストリーミングを無効化します。
- `partial` (デフォルト): プレビューテキストを最新の部分出力で置き換えます。
- `block`: 分割されたプレビュー更新を追加します。
- `progress`: 生成中に進捗ステータステキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール/進捗更新を同じ編集済みプレビューメッセージにルーティングします (デフォルト: `true`)。個別のツール/進捗メッセージを維持するには `false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生のコマンド/実行テキストを隠しながら、コンパクトなツール進捗行を維持するには `status` に設定します (デフォルト: `raw`)。

コンパクトな進捗行を維持しながら生のコマンド/実行テキストを隠します:

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

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合に Slack ネイティブテキストストリーミングを制御します (デフォルト: `true`)。

Slack ネイティブ進捗タスクカードは、進捗モードでオプトインです。作業中に Slack ネイティブの計画/タスクカードを送信し、完了時に同じタスクカードを更新するには、`channels.slack.streaming.mode="progress"` とともに `channels.slack.streaming.progress.nativeTaskCards` を `true` に設定します。このフラグがない場合、進捗モードはポータブルな下書きプレビュー動作を維持します。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネル、グループチャット、トップレベル DM ルートでは、ネイティブストリーミングが利用できない場合や返信スレッドが存在しない場合でも、通常の下書きプレビューを使用できます。
- トップレベル Slack DM はデフォルトでスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw が DM 内に下書きプレビューを投稿して編集します。
- メディアと非テキストペイロードは通常配信にフォールバックします。
- メディア/エラーの最終結果は保留中のプレビュー編集をキャンセルします。対象のテキスト/ブロックの最終結果は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信の途中で失敗した場合、OpenClaw は残りのペイロードを通常配信にフォールバックします。

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

Slack ネイティブ進捗タスクカードにオプトインします:

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

従来キー:

- `channels.slack.streamMode` (`replace | status_final | append`) は `channels.slack.streaming.mode` の従来ランタイムエイリアスです。
- 真偽値の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` の従来ランタイムエイリアスです。
- 従来の `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` のランタイムエイリアスです。
- 永続化済みの Slack ストリーミング設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

## タイピングリアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信 Slack メッセージに一時的なリアクションを追加し、実行が完了すると削除します。これは、デフォルトの「is typing...」ステータスインジケーターを使用するスレッド返信の外で最も有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slack はショートコードを期待します (例: `"hourglass_flowing_sand"`)。
- リアクションはベストエフォートで、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack ファイル添付は、Slack ホストのプライベート URL (トークン認証リクエストフロー) からダウンロードされ、取得が成功しサイズ制限が許す場合にメディアストアへ書き込まれます。ファイルプレースホルダーには Slack `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使用されます。Slack ファイル取得が停止または失敗した場合、OpenClaw はメッセージの処理を続行し、ファイルプレースホルダーにフォールバックします。

    ランタイム受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使用します (デフォルト 4000)
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信 (`thread_ts`) を含めることができます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。設定されていない場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトを使用します

  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的ターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキスト/ブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信は具体的な会話 ID を必要とするため、まず Slack 会話 API 経由で DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、Slack では単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには、`channels.slack.slashCommand` を設定します:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには Slack アプリで [追加のマニフェスト設定](#additional-manifest-settings) が必要で、代わりにグローバル設定の `channels.slack.commands.native: true` または `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは **オフ** のため、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応型レンダリング戦略を使用します。

- 最大 5 個のオプション: ボタンブロック
- 6〜100 個のオプション: 静的セレクトメニュー
- 100 個を超えるオプション: インタラクティビティのオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部セレクト
- Slack の制限超過: エンコード済みオプション値はボタンにフォールバックします

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離されたキーを使用し、コマンド実行は引き続き `CommandTargetSessionKey` を使って対象の会話セッションにルーティングされます。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。
新しいエージェント、CLI、Plugin の出力では、共有の
`presentation` ボタンまたはセレクトブロックを優先してください。これらは同じ Slack インタラクション
パスを使用しつつ、他のチャンネルでも劣化表示されます。

グローバルに有効にします。

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

または、1 つの Slack アカウントだけで有効にします。

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

有効にすると、エージェントは非推奨の Slack 専用返信ディレクティブも引き続き出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択は
既存の Slack インタラクションイベントパス経由で戻されます。古い
プロンプトや Slack 固有のエスケープハッチのために残し、新しい
ポータブルコントロールには共有 presentation を使用してください。

ディレクティブコンパイラー API も、新しいプロデューサーコードでは非推奨です。

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新しい Slack レンダリングのコントロールには、`presentation` ペイロードと
`buildSlackPresentationBlocks(...)` を使用してください。

注:

- これは Slack 固有のレガシー UI です。他のチャンネルは Slack Block
  Kit ディレクティブを独自のボタンシステムへ変換しません。
- インタラクティブコールバック値は OpenClaw が生成した不透明なトークンであり、エージェントが作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効なブロックペイロードを送信する代わりに、元のテキスト返信へフォールバックします。

### Plugin 所有のモーダル送信

インタラクティブハンドラーを登録する Slack Plugin は、OpenClaw が
エージェント可視のシステムイベント用にペイロードを圧縮する前に、モーダルの
`view_submission` および `view_closed` ライフサイクルイベントも受信できます。Slack モーダルを開くときは、次のルーティング
パターンのいずれかを使用してください。

- `callback_id` を `openclaw:<namespace>:<payload>` に設定します。
- または既存の `callback_id` を維持し、モーダルの `private_metadata` に `pluginInteractiveData:
"<namespace>:<payload>"` を入れます。

ハンドラーは、`view_submission` または
`view_closed` としての `ctx.interaction.kind`、正規化された `inputs`、および Slack からの完全な生の `stateValues` オブジェクトを受け取ります。
コールバック ID のみのルーティングで Plugin ハンドラーを呼び出すには十分です。モーダルがエージェント可視のシステムイベントも生成する必要がある場合は、既存のモーダル `private_metadata` のユーザー/セッションルーティングフィールドを含めてください。エージェントは
コンパクトで編集済みの `Slack interaction: ...` システムイベントを受け取ります。ハンドラーが
`systemEvent.summary`、`systemEvent.reference`、または `systemEvent.data` を返す場合、それらの
フィールドはそのコンパクトなイベントに含まれるため、エージェントは
フォームペイロード全体を見ることなく Plugin 所有のストレージを参照できます。

## Slack のネイティブ承認

Slack は Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- 実行および Plugin 承認は Slack ネイティブの Block Kit プロンプトとしてレンダリングできます。
- `channels.slack.execApprovals.*` は、ネイティブ実行承認クライアントの有効化と DM/チャンネルルーティング設定のままです。
- 実行承認 DM は `channels.slack.execApprovals.approvers` または `commands.ownerAllowFrom` を使用します。
- Plugin 承認は、発生元セッションのネイティブ承認クライアントとして Slack が有効な場合、または `approvals.plugin` が発生元 Slack セッションまたは Slack ターゲットにルーティングする場合に、Slack ネイティブボタンを使用します。
- Plugin 承認 DM は、`channels.slack.allowFrom`、名前付きアカウントの `allowFrom`、またはアカウントのデフォルトルートからの Slack Plugin 承認者を使用します。
- 承認者の認可は引き続き強制されます。実行専用の承認者は、Plugin 承認者でもない限り、Plugin リクエストを承認できません。

これは他のチャンネルと同じ共有承認ボタン面を使用します。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとしてレンダリングされます。
それらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット
承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバックします)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の
実行承認者が解決される場合、ネイティブ実行承認を自動的に有効にします。Slack Plugin 承認者が解決され、リクエストがネイティブクライアントフィルターに一致する場合、Slack はこのネイティブクライアント
パス経由でネイティブ Plugin 承認も処理できます。Slack をネイティブ承認クライアントとして明示的に無効にするには
`enabled: false` を設定します。承認者が解決される場合にネイティブ承認を強制的に有効にするには、`enabled: true` を設定します。Slack 実行承認を無効にしても、
`approvals.plugin` 経由で有効化されたネイティブ Slack Plugin 承認配信は無効になりません。Plugin 承認
配信は代わりに Slack Plugin 承認者を使用します。

明示的な Slack 実行承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者を上書きする、フィルターを追加する、または
発生元チャット配信にオプトインする場合だけです。

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

共有の `approvals.exec` 転送は別物です。実行承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにも
ルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も
別物です。Slack ネイティブ配信は、Slack が Plugin
承認リクエストをネイティブに処理できる場合にのみ、そのフォールバックを抑制します。

同じチャットでの `/approve` は、すでにコマンドをサポートしている Slack チャンネルと DM でも機能します。承認転送モデル全体については、[実行承認](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用動作

- メッセージの編集/削除はシステムイベントにマッピングされます。
- スレッドブロードキャスト (「チャンネルにも送信」スレッド返信) は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントにマッピングされます。
- メンバーの参加/退出、チャンネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャンネル設定キーを移行できます。
- チャンネルのトピック/目的メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入される可能性があります。
- スレッド開始者および初期スレッド履歴コンテキストのシードは、該当する場合、設定された送信者許可リストによってフィルタリングされます。
- ブロックアクション、ショートカット、モーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択値、ラベル、ピッカー値、`workflow_*` メタデータ
  - グローバルショートカット: コールバックとアクターのメタデータ。アクターの直接セッションへルーティングされます
  - メッセージショートカット: コールバック、アクター、チャンネル、スレッド、選択されたメッセージのコンテキスト
  - モーダルの `view_submission` および `view_closed` イベント。ルーティングされたチャンネルメタデータとフォーム入力を含みます

Slack アプリ設定でグローバルショートカットまたはメッセージショートカットを定義し、空でない任意のコールバック ID を使用してください。OpenClaw は一致するショートカットペイロードを確認応答し、他の Slack インタラクションと同じ DM/チャンネル送信者ポリシーを適用し、サニタイズされたイベントをルーティング先のエージェントセッションにキューイングします。トリガー ID とレスポンス URL はエージェントコンテキストから編集されます。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom` (レガシー: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching` (緊急回避用。必要な場合を除きオフのままにしてください)
- チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- アンファール: `chat.postMessage` のリンク/メディアプレビュー制御用の `unfurlLinks` (デフォルト: `false`) と `unfurlMedia`。リンクプレビューに再度オプトインするには `unfurlLinks: true` を設定します
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順序で確認してください。

    - `groupPolicy`
    - チャンネル許可リスト (`channels.slack.channels`) — **キーはチャンネル ID でなければなりません** (`C12345678`)。名前 (`#channel-name`) ではありません。名前ベースのキーは、チャンネルルーティングがデフォルトで ID 優先のため、`groupPolicy: "allowlist"` では静かに失敗します。ID を見つけるには、Slack でチャンネルを右クリック → **リンクをコピー** — URL 末尾の `C...` 値がチャンネル ID です。
    - `requireMention`
    - チャンネルごとの `users` 許可リスト
    - `messages.groupChat.visibleReplies`: 通常のグループ/チャンネルリクエストのデフォルトは `"automatic"` です。`"message_tool"` にオプトインし、ログに `message(action=send)` 呼び出しのないアシスタントテキストが表示される場合、モデルが可視メッセージツールの経路を見逃しています。このモードでは最終テキストは非公開のままです。抑制されたペイロードメタデータについては Gateway の詳細ログを確認するか、通常のアシスタント最終返信をすべてレガシー経路で投稿したい場合は `"automatic"` に設定してください。
    - `messages.groupChat.unmentionedInbound`: `"room_event"` の場合、メンションされていない許可済みチャンネル会話は環境コンテキストであり、エージェントが `message` ツールを呼び出さない限りサイレントのままです。[環境ルームイベント](/ja-JP/channels/ambient-room-events) を参照してください。

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
    - `channels.slack.dmPolicy` (またはレガシーの `channels.slack.dm.policy`)
    - ペアリング承認 / 許可リストエントリ (`dmPolicy: "open"` でも `channels.slack.allowFrom: ["*"]` が必要です)
    - グループ DM は MPIM 処理を使用します。`channels.slack.dm.groupEnabled` を有効にし、設定している場合は `channels.slack.dm.groupChannels` に MPIM を含めてください
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、
      通常、Slack がメッセージメタデータ内に復元可能な人間の送信者がない
      編集済み Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    Slack アプリ設定で、bot + app トークンと Socket Mode の有効化を検証します。
    App-Level Token には `connections:write` が必要で、Bot User OAuth Token
    の bot トークンは app トークンと同じ Slack アプリ/ワークスペースに属している必要があります。

    `openclaw channels status --probe --json` に `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    構成済みですが、現在のランタイムが SecretRef に裏付けられた値を解決できませんでした。

    `slack socket mode failed to start; retry ...` のようなログは、復旧可能な
    起動失敗です。スコープ不足、取り消されたトークン、無効な認証は、代わりに即時失敗します。
    `slack token mismatch ...` ログは、bot トークンと app トークンが
    異なる Slack アプリに属しているように見えることを意味します。Slack アプリの認証情報を修正してください。

  </Accordion>

  <Accordion title="HTTP mode がイベントを受信しない">
    検証項目:

    - 署名シークレット
    - Webhook パス
    - Slack リクエスト URL（イベント + インタラクティビティ + スラッシュコマンド）
    - HTTP アカウントごとに一意の `webhookPath`
    - 公開 URL が TLS を終端し、リクエストを Gateway パスへ転送していること
    - Slack アプリの `request_url` パスが `channels.slack.webhookPath`（デフォルト `/slack/events`）と正確に一致していること

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは構成済みですが、現在のランタイムが SecretRef に裏付けられた署名シークレットを解決できませんでした。

    `slack: webhook path ... already registered` ログが繰り返し出る場合、2 つの HTTP
    アカウントが同じ `webhookPath` を使用しています。各アカウントに別々のパスを指定してください。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    意図していたものを確認してください:

    - Slack に登録された一致するスラッシュコマンドを使うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    Slack はスラッシュコマンドを自動で作成または削除しません。`commands.native: "auto"` は Slack ネイティブコマンドを有効にしません。`true` を使用し、Slack アプリで一致するコマンドを作成してください。HTTP mode では、すべての Slack スラッシュコマンドに Gateway URL を含める必要があります。Socket Mode では、コマンドペイロードは WebSocket 経由で到着し、Slack は `slash_commands[].url` を無視します。

    `commands.useAccessGroups`、DM 認可、チャンネル許可リスト、
    およびチャンネルごとの `users` 許可リストも確認してください。Slack は
    ブロックされたスラッシュコマンド送信者に対して、次のようなエフェメラルエラーを返します:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 添付ファイル vision リファレンス

Slack ファイルのダウンロードが成功し、サイズ制限が許す場合、Slack はダウンロードしたメディアをエージェントターンに添付できます。画像ファイルはメディア理解パスを通すか、vision 対応の返信モデルへ直接渡せます。その他のファイルは、画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### 対応メディアタイプ

| メディアタイプ                     | ソース               | 現在の動作                                                                  | 注記                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack ファイル URL       | ダウンロードされ、vision 対応処理のためにターンへ添付されます                   | ファイルごとの上限: `channels.slack.mediaMaxMb`（デフォルト 20 MB）                 |
| PDF ファイル                      | Slack ファイル URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けファイルコンテキストとして公開されます | Slack の受信処理は PDF を画像 vision 入力へ自動変換しません |
| その他のファイル                    | Slack ファイル URL       | 可能な場合にダウンロードされ、ファイルコンテキストとして公開されます                              | バイナリファイルは画像入力として扱われません                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接メディアがない場合、ルートメッセージのファイルをコンテキストとしてハイドレートできます  | ファイルのみの開始メッセージでは添付ファイルプレースホルダーが使用されます                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは独立して評価されます                                              | Slack 処理はメッセージあたり 8 ファイルに制限されています                     |

### 受信パイプライン

ファイル添付付きの Slack メッセージが到着した場合:

1. OpenClaw は bot トークンを使用して、Slack のプライベート URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロードされたメディアパスとコンテンツタイプが受信コンテキストに追加されます。
4. 画像対応のモデル/ツールパスは、そのコンテキストの画像添付を使用できます。
5. 画像以外のファイルは、それらを扱えるツール向けに、ファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付ファイルの継承

メッセージがスレッド内に到着した場合（`thread_ts` 親を持つ場合）:

- 返信自体に直接メディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとしてハイドレートできます。
- 直接の返信添付ファイルは、ルートメッセージ添付ファイルより優先されます。
- ファイルのみでテキストのないルートメッセージは、フォールバックがそのファイルを引き続き含められるように、添付ファイルプレースホルダーで表されます。

### 複数添付ファイルの処理

単一の Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付ファイルはメディアパイプラインを通じて独立して処理されます。
- ダウンロードされたメディア参照はメッセージコンテキストへ集約されます。
- 処理順序はイベントペイロード内の Slack ファイル順に従います。
- 1 つの添付ファイルのダウンロード失敗は、他の添付ファイルをブロックしません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルごとに 20 MB。`channels.slack.mediaMaxMb` で構成できます。
- **ダウンロード失敗**: Slack が提供できないファイル、期限切れ URL、アクセス不能なファイル、サイズ超過のファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **Vision モデル**: 画像分析は、vision をサポートしている場合はアクティブな返信モデルを使用し、そうでない場合は `agents.defaults.imageModel` で構成された画像モデルを使用します。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                 | ファイルはスキップされ、エラーは表示されません                                                 | Slack でファイルを再アップロードします                                                |
| Vision モデルが構成されていない            | 画像添付はメディア参照として保存されますが、画像として分析されません | `agents.defaults.imageModel` を構成するか、vision 対応の返信モデルを使用します |
| 非常に大きい画像（デフォルトで 20 MB 超） | サイズ上限によりスキップされます                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やします                       |
| 転送/共有された添付ファイル           | テキストと Slack ホストの画像/ファイルメディアはベストエフォートです                       | OpenClaw スレッドで直接再共有します                                   |
| PDF 添付ファイル                        | ファイル/メディアコンテキストとして保存され、画像 vision には自動ルーティングされません  | ファイルメタデータには `download-file` を、PDF 分析には `pdf` ツールを使用します   |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [PDF ツール](/ja-JP/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 添付ファイル vision の有効化
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
  <Card title="構成" icon="sliders" href="/ja-JP/gateway/configuration">
    構成レイアウトと優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
