---
read_when:
    - Slack のセットアップ、または Slack のソケット、HTTP、リレーモードのデバッグ
summary: Slack のセットアップと実行時の挙動（Socket Mode、HTTP Request URL、リレーモード）
title: Slack
x-i18n:
    generated_at: "2026-06-27T10:41:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Slack アプリ統合により、DM とチャンネルで本番対応です。デフォルトモードは Socket Mode です。HTTP Request URLs もサポートされています。リレーモードは、信頼されたルーターが Slack の入口を所有するマネージドデプロイ向けです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順。
  </Card>
</CardGroup>

## Socket Mode または HTTP Request URLs の選択

どちらのトランスポートも本番対応で、メッセージング、スラッシュコマンド、App Home、インタラクティビティについて機能は同等です。機能ではなくデプロイ形態で選択してください。

| 観点                         | Socket Mode (デフォルト)                                                                                                                             | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不要                                                                                                                                                 | 必要 (DNS、TLS、リバースプロキシまたはトンネル)                                                               |
| アウトバウンドネットワーク   | `wss-primary.slack.com` へのアウトバウンド WSS に到達できる必要があります                                                                            | アウトバウンド WS なし。インバウンド HTTPS のみ                                                               |
| 必要なトークン               | Bot token + `connections:write` 付き App-Level Token                                                                                                 | Bot token + Signing Secret                                                                                     |
| 開発用ノートPC / ファイアウォール配下 | そのまま動作します                                                                                                                               | 公開トンネル (ngrok、Cloudflare Tunnel、Tailscale Funnel) またはステージング Gateway が必要                    |
| 水平スケーリング             | アプリごと、ホストごとに Socket Mode セッションは 1 つ。複数の Gateway には別々の Slack アプリが必要です                                             | ステートレスな POST ハンドラー。複数の Gateway レプリカで、ロードバランサー背後の 1 つのアプリを共有できます |
| 1 つの Gateway 上の複数アカウント | サポートされています。各アカウントが独自の WS を開きます                                                                                         | サポートされています。登録が衝突しないように、各アカウントには一意の `webhookPath` (デフォルト `/slack/events`) が必要です |
| スラッシュコマンドのトランスポート | WS 接続経由で配信されます。`slash_commands[].url` は無視されます                                                                                 | Slack が `slash_commands[].url` に POST します。コマンドをディスパッチするにはこのフィールドが必要です         |
| リクエスト署名               | 使用されません (認証は App-Level Token です)                                                                                                        | Slack がすべてのリクエストに署名します。OpenClaw は `signingSecret` で検証します                              |
| 接続断からの復旧             | Slack SDK の自動再接続が有効です。OpenClaw も、失敗した Socket Mode セッションを上限付きバックオフで再起動します。Pong タイムアウトのトランスポート調整が適用されます。 | 切断される永続接続はありません。再試行は Slack からリクエスト単位で行われます                                |

<Note>
  **Socket Mode を選択**するのは、単一 Gateway ホスト、開発用ノートPC、`*.slack.com` へのアウトバウンドには到達できるがインバウンド HTTPS を受け付けられないオンプレミスネットワークの場合です。

**HTTP Request URLs を選択**するのは、ロードバランサー背後で複数の Gateway レプリカを実行する場合、アウトバウンド WSS がブロックされているがインバウンド HTTPS は許可されている場合、または Slack Webhook をすでにリバースプロキシで終端している場合です。
</Note>

### リレーモード

リレーモードは Slack の入口を OpenClaw gateway から分離します。信頼されたルーターが
単一の Slack Socket Mode 接続を所有し、宛先 gateway を選択して、型付き
イベントを認証済み websocket 経由で転送します。gateway は引き続き、アウトバウンドの
Slack Web API 呼び出しに bot token を使用します。

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

リレー URL は、localhost を対象にする場合を除き `wss://` を使用する必要があります。bearer token と
ルーターのルートテーブルは Slack 認可境界の一部として扱ってください。ルーティングされたイベントは、
認可済みアクティベーションとして通常の Slack メッセージハンドラーに入ります。websocket の `hello` フレーム内で
ルーターが提供する `slack_identity` は、デフォルトのアウトバウンドユーザー名とアイコンを設定できます。ただし、呼び出し元が明示的に
指定した identity がある場合はそちらが優先されます。リレー接続は Socket Mode と同じ
上限付きバックオフタイミングで再接続し、切断されるたびにルーター提供の identity をクリアします。

## インストール

チャンネルを設定する前に Slack をインストールします。

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` は plugin を登録して有効化します。ただし、以下の Slack アプリとチャンネル設定を構成するまでは、plugin は何もしません。一般的な plugin の動作とインストール規則については [Plugin](/ja-JP/tools/plugin) を参照してください。

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode (デフォルト)">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開き、**Create New App** → **From a manifest** → ワークスペースを選択 → 下記いずれかのマニフェストを貼り付け → **Next** → **Create** を選択します。

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
          **Recommended** は Slack plugin の全機能セットに一致します: App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループ DM、絵文字/ユーザーグループの読み取りです。ワークスペースポリシーでスコープが制限されている場合は **Minimal** を選択してください。DM、チャンネル/グループ履歴、メンション、スラッシュコマンドをカバーしますが、ファイル、リアクション、ピン、グループ DM (`mpim:*`)、`emoji:read`、`usergroups:read` は含まれません。スコープごとの理由と、追加のスラッシュコマンドなどの追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        Slack がアプリを作成した後:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` を追加し、保存して App-Level Token をコピーします。
        - **Install App -> Install to Workspace**: Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を構成する">

        推奨される SecretRef セットアップ:

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

        env フォールバック (デフォルトアカウントのみ):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **新しいアプリを作成** → **マニフェストから** → ワークスペースを選択 → 下のいずれかのマニフェストを貼り付け → `https://gateway-host.example.com/slack/events` を公開 Gateway URL に置き換え → **次へ** → **作成**。

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
          **推奨** は Slack Plugin の全機能セットに一致します。**最小** は、制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループ DM（`mpim:*`）、`emoji:read`、`usergroups:read` を省きます。スコープごとの根拠については、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist) を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド（`slash_commands[].url`、`event_subscriptions.request_url`、`interactivity.request_url` / `message_menu_options_url`）はすべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマではこれらを別々の名前にする必要がありますが、OpenClaw はペイロード種別でルーティングするため、単一の `webhookPath`（デフォルトは `/slack/events`）で十分です。`slash_commands[].url` がないスラッシュコマンドは、HTTP モードでは通知なしで何もしません。
        </Info>

        Slack がアプリを作成したら、次を行います。

        - **基本情報 → アプリ認証情報**: リクエスト検証用の **署名シークレット** をコピーします。
        - **アプリをインストール -> ワークスペースにインストール**: Bot User OAuth Token をコピーします。

      </Step>

      <Step title="Configure OpenClaw">

        推奨の SecretRef セットアップ:

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
        複数アカウントの HTTP では一意の Webhook パスを使用する

        登録が衝突しないように、各アカウントに別個の `webhookPath`（デフォルトは `/slack/events`）を指定します。
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

## Socket Mode トランスポート調整

OpenClaw は、Socket Mode の Slack SDK クライアント pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack websocket pong/server-ping タイムアウトをログに記録する Socket Mode ワークスペース、または既知のイベントループ枯渇があるホストで実行している場合にのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後の pong 待機時間です。`serverPingTimeout` は Slack サーバー ping の待機時間です。アプリメッセージとイベントはアプリケーション状態のままであり、トランスポートの生存性シグナルではありません。

注:

- `socketMode` は HTTP Request URL モードでは無視されます。
- ベースの `channels.slack.socketMode` 設定は、上書きされない限りすべての Slack アカウントに適用されます。アカウントごとの上書きには `channels.slack.accounts.<accountId>.socketMode` を使用します。これはオブジェクト上書きであるため、そのアカウントで必要なすべてのソケット調整フィールドを含めてください。
- OpenClaw のデフォルトがあるのは `clientPingTimeout`（`15000`）だけです。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ Slack SDK に渡されます。
- Socket Mode の再起動バックオフは約 2 秒から始まり、約 30 秒で上限に達します。回復可能な開始、開始待機、切断の失敗は、チャンネルが停止するまで再試行されます。無効な認証、取り消されたトークン、スコープ不足などの永続的なアカウントおよび認証情報エラーは、永久に再試行せずに即座に失敗します。

## マニフェストとスコープのチェックリスト

ベースの Slack アプリマニフェストは、Socket Mode と HTTP Request URLs で同じです。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

ベースマニフェスト（Socket Mode デフォルト）:

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

**HTTP Request URLs モード**では、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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

上記のデフォルトを拡張するさまざまな機能を公開します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブが有効になり、`app_home_opened` をサブスクライブします。ワークスペースメンバーが Home タブを開くと、OpenClaw は `views.publish` で安全なデフォルトの Home ビューを公開します。会話ペイロードや非公開設定は含まれません。Slack DM 用には **Messages** タブが引き続き有効です。マニフェストでは、`features.assistant_view`、`assistant:write`、`assistant_thread_started`、`assistant_thread_context_changed` による Slack アシスタントスレッドも有効になります。アシスタントスレッドは専用の OpenClaw スレッドセッションにルーティングされ、Slack から提供されるスレッドコンテキストをエージェントで利用できる状態に保ちます。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    1 つの設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を細かい違いに応じて使用できます。

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
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使用したい場合は、`chat:write.customize` ボットスコープを追加します。

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
    - `search:read`（Slack 検索読み取りに依存している場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- リレーモードには `botToken` に加えて `relay.url`、`relay.authToken`、`relay.gatewayId` が必要です。アプリトークンや署名シークレットは使用しません。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken`、`userToken` は、プレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- 設定内のトークンは env フォールバックを上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken` は設定専用（env フォールバックなし）で、デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査では、資格情報ごとの `*Source` フィールドと `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、`missing` です。
- `configured_unavailable` は、アカウントが SecretRef または別の非インラインシークレットソースを通じて設定されているものの、現在のコマンドまたはランタイムパスで実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、必須の組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリ読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、ボットトークンが引き続き優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` で、かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| グループ   | デフォルト |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。`download-file` は、受信ファイルプレースホルダーに表示される Slack ファイル ID を受け付け、画像の場合は画像プレビューを返し、その他のファイル種別の場合はローカルファイルメタデータを返します。

## アクセス制御とルーティング

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` は DM アクセスを制御します。`channels.slack.allowFrom` は正規の DM 許可リストです。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` に `"*"` が含まれている必要があります)
    - `disabled`

    DM フラグ:

    - `dm.enabled` (デフォルトは true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (レガシー)
    - `dm.groupEnabled` (グループ DM はデフォルトで false)
    - `dm.groupChannels` (任意の MPIM 許可リスト)

    複数アカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.slack.dm.policy` と `channels.slack.dm.allowFrom` は、互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは `channels.slack.channels` の下にあり、設定キーとして**安定した Slack チャンネル ID** (例: `C12345678`) を使用する必要があります。

    ランタイムの注記: `channels.slack` が完全に存在しない場合 (env のみのセットアップ)、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します (`channels.defaults.groupPolicy` が設定されている場合でも同様です)。

    名前/ID 解決:

    - チャンネル許可リストのエントリと DM 許可リストのエントリは、トークンアクセスで許可されている場合、起動時に解決されます
    - 未解決のチャンネル名エントリは設定どおり保持されますが、デフォルトではルーティングでは無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。ユーザー名/スラッグの直接一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

    <Warning>
    名前ベースのキー (`#channel-name` または `channel-name`) は `groupPolicy: "allowlist"` では一致しません。チャンネル検索はデフォルトで ID 優先のため、名前ベースのキーではルーティングが成功せず、そのチャンネル内のすべてのメッセージが黙ってブロックされます。これは、ルーティングにチャンネルキーが不要で、名前ベースのキーが動作しているように見える `groupPolicy: "open"` とは異なります。

    キーには常に Slack チャンネル ID を使用してください。確認方法: Slack でチャンネルを右クリック → **リンクをコピー** — ID (`C...`) が URL の末尾に表示されます。

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

    誤った例 (`groupPolicy: "allowlist"` では黙ってブロックされます):

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
    チャンネルメッセージはデフォルトでメンション制御されます。

    メンションのソース:

    - 明示的なアプリメンション (`<@botId>`)
    - Slack ユーザーグループメンション (`<!subteam^S...>`)。bot ユーザーがそのユーザーグループのメンバーである場合。`usergroups:read` が必要です
    - メンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - bot への暗黙的な返信スレッド動作 (`thread.requireExplicitMention` が `true` の場合は無効)

    チャンネルごとの制御 (`channels.slack.channels.<id>`、名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ):

    - `requireMention`
    - `users` (許可リスト)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` キー形式: `channel:`, `id:`, `e164:`, `username:`, `name:`, または `"*"` ワイルドカード
      (レガシーのプレフィックスなしキーは引き続き `id:` のみにマップされます)

    `allowBots` はチャンネルとプライベートチャンネルに対して保守的です。bot が作成したルームメッセージは、送信元 bot がそのルームの `users` 許可リストに明示的に含まれている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID が少なくとも 1 つ現在ルームメンバーである場合にのみ受け入れられます。ワイルドカードと表示名のオーナー項目は、オーナーの存在を満たしません。オーナーの存在確認には Slack `conversations.members` を使います。アプリにルーム種別に対応する読み取りスコープ（パブリックチャンネルは `channels:read`、プライベートチャンネルは `groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClaw は bot が作成したルームメッセージを破棄します。

    受け入れられた bot 作成の Slack メッセージには、共有の [bot ループ保護](/ja-JP/channels/bot-loop-protection) が使われます。デフォルトの予算には `channels.defaults.botLoopProtection` を設定し、ワークスペースまたはチャンネルで別の制限が必要な場合は `channels.slack.botLoopProtection` または `channels.slack.channels.<id>.botLoopProtection` で上書きします。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack ルートバインディングは、生のピア ID に加えて、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け入れます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- 通常のトップレベルのチャンネルメッセージは、`replyToMode` が `off` 以外でも、チャンネルごとのセッションに留まります。
- Slack スレッド返信では、送信返信スレッド化が `replyToMode="off"` で無効化されている場合でも、セッション接尾辞（`:thread:<threadTs>`）に親 Slack `thread_ts` を使います。
- OpenClaw は、対象のトップレベルチャンネルルートが表示される Slack スレッドを開始すると見込まれる場合、そのルートを `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` にシードします。これにより、ルートと後続のスレッド返信が 1 つの OpenClaw セッションを共有します。これは `app_mention` イベント、明示的な bot または設定済みのメンションパターン一致、非 `off` の `replyToMode` を持つ `requireMention: false` チャンネルに適用されます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションが開始するときに取得する既存スレッドメッセージ数を制御します（デフォルトは `20`、無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルトは `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、bot がすでにスレッドに参加している場合でも、スレッド内の明示的な `@bot` メンションにのみ bot が応答します。これがない場合、bot が参加済みのスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド化の制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルトは `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット用のレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` ツールから明示的な Slack スレッド返信を行う場合、Slack にスレッド返信を親チャンネルにもブロードキャストするよう求めるには、`action: "send"` と `threadId` または `replyTo` とともに `replyBroadcast: true` を設定します。これは Slack の `chat.postMessage` の `reply_broadcast` フラグに対応し、テキストまたは Block Kit 送信でのみサポートされます。メディアアップロードではサポートされません。

`message` ツール呼び出しが Slack スレッド内で実行され、同じチャンネルを対象にする場合、OpenClaw は通常 `replyToMode` に従って現在の Slack スレッドを継承します。代わりに新しい親チャンネルメッセージを強制するには、`action: "send"` または `action: "upload-file"` に `topLevel: true` を設定します。`threadId: null` も同じトップレベルのオプトアウトとして受け入れられます。

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む送信 Slack 返信スレッド化を無効にします。これは受信 Slack スレッドセッションをフラット化しません。Slack スレッド内にすでに投稿されたメッセージは、引き続き `:thread:<threadTs>` セッションにルーティングされます。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドはメッセージをチャンネルから隠しますが、Telegram 返信はインラインで表示されたままです。
</Note>

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用絵文字を送信します。`ackReactionScope` は、その絵文字が実際に送信される _タイミング_ を決定します。

### 絵文字（`ackReaction`）

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"eyes"` / 👀）

注記:

- Slack はショートコード（例: `"eyes"`）を想定します。
- Slack アカウントまたはグローバルでリアクションを無効にするには `""` を使います。

### スコープ（`messages.ackReactionScope`）

Slack プロバイダーは `messages.ackReactionScope`（デフォルトは `"group-mentions"`）からスコープを読み取ります。現時点では Slack アカウントまたは Slack チャンネルレベルの上書きはありません。この値は Gateway 全体にグローバルです。

値:

- `"all"`: DM とグループでリアクションします。
- `"direct"`: DM のみでリアクションします。
- `"group-all"`: すべてのグループメッセージでリアクションします（DM なし）。
- `"group-mentions"`（デフォルト）: グループでリアクションしますが、bot がメンションされた場合（またはオプトインしたグループメンション可能対象内）のみです。**DM は除外されます。**
- `"off"` / `"none"`: リアクションしません。

<Note>
デフォルトスコープ（`"group-mentions"`）は、ダイレクトメッセージで確認リアクションを発火しません。受信 Slack DM で設定済みの `ackReaction`（例: `"eyes"`）を表示するには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定します。`messages.ackReactionScope` は Slack プロバイダー起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
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

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力に置き換えます。
- `block`: 分割されたプレビュー更新を追加します。
- `progress`: 生成中は進行状況テキストを表示し、その後最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール/進行状況の更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。個別のツール/進行状況メッセージを維持するには `false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生のコマンド/exec テキストを隠しながら、コンパクトなツール進行状況行を維持するには `status` に設定します（デフォルト: `raw`）。

コンパクトな進行状況行を維持しながら、生のコマンド/exec テキストを隠します:

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

Slack ネイティブ進行状況タスクカードは、進行状況モードでオプトインです。作業の実行中に Slack ネイティブの計画/タスクカードを送信し、完了時に同じタスクカードを更新するには、`channels.slack.streaming.mode="progress"` とともに `channels.slack.streaming.progress.nativeTaskCards` を `true` に設定します。このフラグがない場合、進行状況モードはポータブルな下書きプレビュー動作を維持します。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合、または返信スレッドが存在しない場合でも、チャンネル、グループチャット、トップレベル DM ルートは通常の下書きプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外のままなので、Slack のスレッド形式のネイティブストリーム/ステータスプレビューは表示されません。代わりに OpenClaw は DM 内で下書きプレビューを投稿して編集します。
- メディアと非テキストペイロードは通常配信にフォールバックします。
- メディア/エラー最終応答は保留中のプレビュー編集をキャンセルします。対象のテキスト/block 最終応答は、プレビューをその場で編集できる場合にのみフラッシュされます。
- ストリーミングが返信途中で失敗した場合、OpenClaw は残りのペイロードを通常配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使います:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` のレガシーランタイムエイリアスです。
- ブール値の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` のレガシーランタイムエイリアスです。
- レガシー `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` のランタイムエイリアスです。
- 永続化された Slack ストリーミング設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

## 入力中リアクションフォールバック

`typingReaction` は、OpenClaw が返信を処理している間に受信 Slack メッセージへ一時的なリアクションを追加し、実行が完了すると削除します。これは、デフォルトの「is typing...」ステータスインジケーターを使うスレッド返信以外で最も便利です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slack はショートコード（例: `"hourglass_flowing_sand"`）を想定します。
- リアクションはベストエフォートであり、返信または失敗パスの完了後にクリーンアップが自動的に試行されます。

## メディア、分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack ファイル添付は、Slack がホストするプライベート URL（トークン認証リクエストフロー）からダウンロードされ、取得に成功しサイズ制限が許す場合にメディアストアへ書き込まれます。ファイルプレースホルダーには Slack `fileId` が含まれるため、エージェントは `download-file` で元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと総タイムアウトが使われます。Slack ファイルの取得が停止または失敗した場合、OpenClaw はメッセージの処理を続け、ファイルプレースホルダーにフォールバックします。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使います（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使い、スレッド返信（`thread_ts`）を含められます
    - 送信メディア上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。そうでない場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトを使います

  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキスト/block のみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信では具体的な会話 ID が必要なため、まず Slack conversation API 経由で DM を開きます。

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

ネイティブコマンドには Slack アプリで [追加のマニフェスト設定](#additional-manifest-settings) が必要であり、代わりにグローバル設定の `channels.slack.commands.native: true` または `commands.native: true` で有効化します。

- Slack ではネイティブコマンド自動モードが **off** であるため、`commands.native: "auto"` は Slack ネイティブコマンドを有効化しません。

```txt
/help
```

ネイティブ引数メニューは、選択されたオプション値をディスパッチする前に確認モーダルを表示する適応レンダリング戦略を使います:

- 最大 5 オプション: ボタンブロック
- 6〜100 オプション: 静的選択メニュー
- 100 を超えるオプション: インタラクティビティオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部選択
- Slack 制限超過: エンコードされたオプション値はボタンにフォールバックします。

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離されたキーを使用し、コマンド実行は引き続き `CommandTargetSessionKey` を使って対象の会話セッションへルーティングされます。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールを表示できますが、この機能はデフォルトでは無効です。
新しいエージェント、CLI、Plugin の出力では、共有の
`presentation` ボタンまたは select ブロックを優先してください。これらは同じ Slack インタラクション
パスを使用しつつ、他のチャネルでも劣化表示されます。

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

または、1つの Slack アカウントだけで有効化します。

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

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択は
既存の Slack インタラクションイベントパスを通じて戻されます。古い
プロンプトや Slack 固有の退避手段として残し、新しい
移植可能なコントロールには共有 presentation を使用してください。

ディレクティブコンパイラ API も、新しい producer コードでは非推奨です。

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新しい Slack 表示コントロールには `presentation` ペイロードと `buildSlackPresentationBlocks(...)` を使用してください。

注:

- これは Slack 固有のレガシー UI です。他のチャネルは Slack Block
  Kit ディレクティブを独自のボタンシステムへ変換しません。
- インタラクティブコールバック値は、エージェントが作成した生の値ではなく、OpenClaw が生成した不透明トークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信せず、元のテキスト返信へフォールバックします。

### Plugin 所有のモーダル送信

インタラクティブハンドラを登録する Slack Plugin は、OpenClaw がペイロードを
エージェントに見えるシステムイベントへ圧縮する前に、モーダルの
`view_submission` および `view_closed` ライフサイクルイベントも受け取れます。Slack モーダルを開くときは、次のルーティング
パターンのいずれかを使用してください。

- `callback_id` を `openclaw:<namespace>:<payload>` に設定します。
- または、既存の `callback_id` を維持し、モーダルの `private_metadata` に `pluginInteractiveData:
"<namespace>:<payload>"` を入れます。

ハンドラは `ctx.interaction.kind` を `view_submission` または
`view_closed` として受け取り、正規化された `inputs` と、Slack からの完全な生の `stateValues` オブジェクトを受け取ります。
callback-id のみのルーティングで Plugin ハンドラを呼び出すには十分です。
モーダルがエージェントに見えるシステムイベントも生成する必要がある場合は、既存のモーダル `private_metadata` のユーザー/セッションルーティングフィールドを含めてください。エージェントは
コンパクトで編集済みの `Slack interaction: ...` システムイベントを受け取ります。ハンドラが
`systemEvent.summary`、`systemEvent.reference`、または `systemEvent.data` を返す場合、それらの
フィールドはそのコンパクトイベントに含まれるため、エージェントは完全なフォームペイロードを見ずに
Plugin 所有のストレージを参照できます。

## Slack のネイティブ承認

Slack は Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして機能できます。

- exec 承認と Plugin 承認は、Slack ネイティブの Block Kit プロンプトとして表示できます。
- `channels.slack.execApprovals.*` は、ネイティブ exec 承認クライアントの有効化と DM/チャネルルーティング設定のままです。
- exec 承認 DM は `channels.slack.execApprovals.approvers` または `commands.ownerAllowFrom` を使用します。
- Plugin 承認は、発信元セッションのネイティブ承認クライアントとして Slack が有効化されている場合、または `approvals.plugin` が発信元 Slack セッションか Slack ターゲットへルーティングされる場合に、Slack ネイティブボタンを使用します。
- Plugin 承認 DM は、`channels.slack.allowFrom`、名前付きアカウントの `allowFrom`、またはアカウントのデフォルトルートから Slack Plugin approver を使用します。
- approver の認可は引き続き強制されます。exec 専用 approver は、Plugin approver でもない限り Plugin リクエストを承認できません。

これは他のチャネルと同じ共有承認ボタン面を使用します。Slack アプリ設定で `interactivity` が有効化されている場合、承認プロンプトは会話内に直接 Block Kit ボタンとして表示されます。
これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット
承認を利用できない、または手動承認が唯一のパスであると示す場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (任意。可能な場合は `commands.ownerAllowFrom` にフォールバック)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
- `agentFilter`, `sessionFilter`

`enabled` が未設定または `"auto"` で、少なくとも1つの
exec approver が解決される場合、Slack はネイティブ exec 承認を自動有効化します。Slack は、Slack Plugin approver が解決され、リクエストがネイティブクライアントフィルタに一致する場合、このネイティブクライアント
パスを通じてネイティブ Plugin 承認も処理できます。Slack をネイティブ承認クライアントとして明示的に無効化するには
`enabled: false` を設定します。approver が解決される場合にネイティブ承認を強制的に有効にするには `enabled: true` を設定します。Slack exec 承認を無効化しても、
`approvals.plugin` を通じて有効化されたネイティブ Slack Plugin 承認配信は無効化されません。Plugin 承認
配信は代わりに Slack Plugin approver を使用します。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、approver を上書きする、フィルタを追加する、または
発信元チャット配信へオプトインする場合だけです。

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

共有 `approvals.exec` 転送は別物です。exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにも
ルーティングする必要がある場合にのみ使用してください。共有 `approvals.plugin` 転送も
別物です。Slack ネイティブ配信は、Slack が Plugin
承認リクエストをネイティブに処理できる場合にのみ、そのフォールバックを抑制します。

同じチャット内の `/approve` も、すでにコマンドをサポートする Slack チャネルと DM で機能します。承認転送モデル全体については、[exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用動作

- メッセージの編集/削除はシステムイベントへマップされます。
- スレッドブロードキャスト (「Also send to channel」のスレッド返信) は通常のユーザーメッセージとして処理されます。
- リアクションの追加/削除イベントはシステムイベントへマップされます。
- メンバーの参加/退出、チャネルの作成/名前変更、ピンの追加/削除イベントはシステムイベントへマップされます。
- `configWrites` が有効な場合、`channel_id_changed` はチャネル設定キーを移行できます。
- チャネルの topic/purpose メタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストへ注入される可能性があります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、該当する場合、設定された送信者 allowlist によってフィルタされます。
- ブロックアクション、ショートカット、モーダルインタラクションは、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - ブロックアクション: 選択された値、ラベル、ピッカー値、`workflow_*` メタデータ
  - グローバルショートカット: コールバックとアクターメタデータ。アクターの直接セッションへルーティング
  - メッセージショートカット: コールバック、アクター、チャネル、スレッド、選択されたメッセージのコンテキスト
  - ルーティングされたチャネルメタデータとフォーム入力を含むモーダル `view_submission` および `view_closed` イベント

Slack アプリ設定でグローバルショートカットまたはメッセージショートカットを定義し、空でない任意の callback ID を使用してください。OpenClaw は一致するショートカットペイロードを確認応答し、他の Slack インタラクションと同じ DM/チャネル送信者ポリシーを適用し、サニタイズされたイベントをルーティング済みエージェントセッションへキューイングします。トリガー ID とレスポンス URL はエージェントコンテキストから編集されます。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom` (レガシー: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching` (緊急時用。必要な場合を除きオフのままにする)
- チャネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 展開プレビュー: `unfurlLinks` (デフォルト: `false`)、`chat.postMessage` のリンク/メディアプレビュー制御用 `unfurlMedia`。リンクプレビューへ再度オプトインするには `unfurlLinks: true` を設定
- 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    次の順序で確認してください。

    - `groupPolicy`
    - チャネル allowlist (`channels.slack.channels`) — **キーはチャネル ID である必要があります** (`C12345678`)。名前 (`#channel-name`) ではありません。チャネルルーティングはデフォルトで ID 優先のため、名前ベースのキーは `groupPolicy: "allowlist"` の下で静かに失敗します。ID を見つけるには、Slack でチャネルを右クリック → **Copy link** — URL 末尾の `C...` 値がチャネル ID です。
    - `requireMention`
    - チャネルごとの `users` allowlist
    - `messages.groupChat.visibleReplies`: 通常のグループ/チャネルリクエストはデフォルトで `"automatic"` です。`"message_tool"` へオプトインしており、ログに assistant テキストが表示されるのに `message(action=send)` 呼び出しがない場合、モデルが表示可能な message-tool パスを取り逃しています。このモードでは最終テキストは非公開のままです。抑制されたペイロードメタデータについては gateway の詳細ログを調べるか、通常の assistant 最終返信をすべてレガシーパス経由で投稿したい場合は `"automatic"` に設定してください。
    - `messages.groupChat.unmentionedInbound`: これが `"room_event"` の場合、メンションされていない許可済みチャネルの会話は周辺コンテキストとなり、エージェントが `message` ツールを呼び出さない限り沈黙したままです。[周辺ルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

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
    - ペアリング承認 / allowlist エントリ (`dmPolicy: "open"` でも `channels.slack.allowFrom: ["*"]` が必要)
    - グループ DM は MPIM 処理を使用します。`channels.slack.dm.groupEnabled` を有効化し、設定している場合は `channels.slack.dm.groupChannels` に MPIM を含めます。
    - Slack Assistant DM イベント: `drop message_changed` に言及する詳細ログは、通常、Slack がメッセージメタデータ内に
      復元可能な人間の送信者を持たない編集済み Assistant スレッドイベントを送信したことを意味します。

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続されない">
    Slack アプリ設定で bot + app トークンと Socket Mode の有効化を検証してください。
    App-Level Token には `connections:write` が必要で、Bot User OAuth Token
    の bot トークンは app トークンと同じ Slack アプリ/ワークスペースに属している必要があります。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    設定されていますが、現在のランタイムが SecretRef に裏付けられた
    値を解決できませんでした。

    `slack socket mode failed to start; retry ...` などのログは、復旧可能な
    起動失敗です。スコープ不足、取り消されたトークン、無効な認証は代わりに
    即座に失敗します。`slack token mismatch ...` ログは、bot トークンと app トークンが
    異なる Slack アプリに属しているように見えることを意味します。Slack アプリの認証情報を修正してください。

  </Accordion>

  <Accordion title="HTTP モードでイベントを受信しない">
    次を検証します。

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`
    - 公開 URL が TLS を終端し、リクエストを Gateway パスへ転送していること
    - Slack アプリの `request_url` パスが `channels.slack.webhookPath`（デフォルト `/slack/events`）と完全に一致すること

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは構成されていますが、現在のランタイムが SecretRef ベースの signing secret を解決できませんでした。

    `slack: webhook path ... already registered` ログが繰り返し出る場合、2 つの HTTP
    アカウントが同じ `webhookPath` を使用しています。各アカウントに別々のパスを指定してください。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    意図していたのが次のどちらかを確認してください。

    - Slack に登録された一致するスラッシュコマンドを使うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    Slack はスラッシュコマンドを自動的に作成または削除しません。`commands.native: "auto"` は Slack ネイティブコマンドを有効にしません。`true` を使用し、Slack アプリに一致するコマンドを作成してください。HTTP モードでは、すべての Slack スラッシュコマンドに Gateway URL を含める必要があります。Socket Mode では、コマンドペイロードは websocket 経由で到着し、Slack は `slash_commands[].url` を無視します。

    `commands.useAccessGroups`、DM 認可、チャンネル allowlist、
    チャンネルごとの `users` allowlist も確認してください。Slack は、
    ブロックされたスラッシュコマンド送信者に対して、次のような一時的なエラーを返します。

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 添付ファイル vision リファレンス

Slack ファイルのダウンロードが成功し、サイズ制限で許可される場合、Slack はダウンロードしたメディアを agent turn に添付できます。画像ファイルは media understanding パス経由で渡すことも、vision 対応の返信モデルへ直接渡すこともできます。他のファイルは、画像入力として扱われるのではなく、ダウンロード可能なファイルコンテキストとして保持されます。

### サポートされるメディアタイプ

| メディアタイプ               | ソース               | 現在の動作                                                                      | 注記                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 画像 | Slack file URL       | ダウンロードされ、vision 対応処理のために turn に添付される                   | ファイルごとの上限: `channels.slack.mediaMaxMb`（デフォルト 20 MB）                 |
| PDF ファイル                      | Slack file URL       | ダウンロードされ、`download-file` や `pdf` などのツール向けファイルコンテキストとして公開される | Slack のインバウンドは PDF を画像 vision 入力へ自動変換しない |
| その他のファイル                    | Slack file URL       | 可能な場合にダウンロードされ、ファイルコンテキストとして公開される                              | バイナリファイルは画像入力として扱われない                               |
| スレッド返信                 | スレッド開始メッセージのファイル | 返信に直接のメディアがない場合、ルートメッセージのファイルをコンテキストとして補完できる  | ファイルのみの開始メッセージは添付ファイルプレースホルダーを使用する                          |
| 複数画像メッセージ           | 複数の Slack ファイル | 各ファイルは個別に評価される                                              | Slack 処理はメッセージごとに 8 ファイルまでに制限される                     |

### インバウンドパイプライン

ファイル添付を含む Slack メッセージが到着すると、次の処理が行われます。

1. OpenClaw は bot トークンを使用して Slack の private URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロードされたメディアパスとコンテンツタイプがインバウンドコンテキストに追加されます。
4. 画像対応のモデル/ツールパスは、そのコンテキスト内の画像添付を使用できます。
5. 画像以外のファイルは、それを扱えるツール向けのファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルート添付の継承

メッセージがスレッド内に到着した場合（`thread_ts` 親を持つ場合）:

- 返信自体に直接のメディアがなく、含まれるルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始コンテキストとして補完できます。
- 直接の返信添付は、ルートメッセージ添付より優先されます。
- ファイルだけでテキストがないルートメッセージは、fallback がそのファイルを引き続き含められるように、添付ファイルプレースホルダーで表されます。

### 複数添付の処理

単一の Slack メッセージに複数のファイル添付が含まれる場合:

- 各添付はメディアパイプラインを通じて個別に処理されます。
- ダウンロードされたメディア参照はメッセージコンテキストに集約されます。
- 処理順序は、イベントペイロード内の Slack のファイル順に従います。
- 1 つの添付のダウンロードに失敗しても、他の添付はブロックされません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**: デフォルトはファイルごとに 20 MB。`channels.slack.mediaMaxMb` で構成できます。
- **ダウンロード失敗**: Slack が配信できないファイル、期限切れ URL、アクセスできないファイル、サイズ超過ファイル、Slack 認証/ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **Vision モデル**: 画像解析は、vision をサポートする場合はアクティブな返信モデルを使用し、それ以外の場合は `agents.defaults.imageModel` で構成された画像モデルを使用します。

### 既知の制限

| シナリオ                               | 現在の動作                                                             | 回避策                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 期限切れの Slack file URL                 | ファイルはスキップされ、エラーは表示されない                                                 | Slack でファイルを再アップロードする                                                |
| Vision モデルが構成されていない            | 画像添付はメディア参照として保存されるが、画像として解析されない | `agents.defaults.imageModel` を構成するか、vision 対応の返信モデルを使用する |
| 非常に大きな画像（デフォルトで > 20 MB） | サイズ上限によりスキップされる                                                         | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                       |
| 転送/共有された添付           | テキストと Slack ホストの画像/ファイルメディアはベストエフォート                       | OpenClaw スレッドで直接再共有する                                   |
| PDF 添付                        | ファイル/メディアコンテキストとして保存され、画像 vision 経由では自動的にルーティングされない  | ファイルメタデータには `download-file` を使用し、PDF 解析には `pdf` ツールを使用する   |

### 関連ドキュメント

- [Media understanding パイプライン](/ja-JP/nodes/media-understanding)
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
    インバウンドメッセージをエージェントへルーティングします。
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
