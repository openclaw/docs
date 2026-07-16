---
read_when:
    - Slack のセットアップ、または Slack のソケット、HTTP、リレーモードのデバッグ
summary: Slack のセットアップとランタイム動作（Socket Mode、HTTP Request URL、リレーモード）
title: Slack
x-i18n:
    generated_at: "2026-07-16T11:23:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack サポートは、Slack アプリ統合を介した DM とチャンネルに対応しています。デフォルトのトランスポートは Socket Mode です。HTTP Request URLs もサポートされています。リレーモードは、信頼されたルーターが Slack のイングレスを管理するマネージドデプロイメント向けです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM のデフォルトはペアリングモードです。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順。
  </Card>
</CardGroup>

## トランスポートの選択

Socket Mode と HTTP Request URLs は、メッセージング、スラッシュコマンド、App Home、インタラクティブ機能について同等の機能を提供します。機能ではなくデプロイメント構成に基づいて選択してください。

| 検討事項                      | Socket Mode（デフォルト）                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL           | 不要                                                                                                                                         | 必須（DNS、TLS、リバースプロキシまたはトンネル）                                                                   |
| 送信ネットワーク             | `wss-primary.slack.com` への送信 WSS に到達できる必要があります                                                                                            | 送信 WS は不要。受信 HTTPS のみ                                                                             |
| 必要なトークン                | Bot token + `connections:write` を持つ App-Level Token                                                                                                 | Bot token + Signing Secret                                                                                     |
| 開発用ノート PC / ファイアウォール内 | そのまま動作します                                                                                                                                          | 公開トンネル（ngrok、Cloudflare Tunnel、Tailscale Funnel）またはステージング Gateway が必要です                          |
| 水平スケーリング           | ホストごと、アプリごとに 1 つの Socket Mode セッション。複数の Gateway には個別の Slack アプリが必要です                                                                 | ステートレスな POST ハンドラー。複数の Gateway レプリカがロードバランサーの背後で 1 つのアプリを共有できます                     |
| 1 つの Gateway での複数アカウント | サポートされています。各アカウントが独自の WS を開きます                                                                                                             | サポートされています。登録が衝突しないよう、各アカウントに一意の `webhookPath`（デフォルト `/slack/events`）が必要です |
| スラッシュコマンドのトランスポート      | WS 接続経由で配信されます。`slash_commands[].url` は無視されます                                                                                  | Slack が `slash_commands[].url` に POST します。コマンドをディスパッチするにはこのフィールドが必要です                           |
| リクエスト署名              | 使用されません（認証には App-Level Token を使用）                                                                                                               | Slack がすべてのリクエストに署名し、OpenClaw が `signingSecret` で検証します                                              |
| 接続切断時の復旧  | Slack SDK の自動再接続が有効です。OpenClaw も、失敗した Socket Mode セッションを上限付きバックオフで再起動します。Pong タイムアウトのトランスポート調整が適用されます。 | 切断される永続接続はありません。再試行は Slack がリクエストごとに行います                                           |

<Note>
  受信 HTTPS を受け付けられないものの、`*.slack.com` への送信接続が可能な単一 Gateway ホスト、開発用ノート PC、オンプレミスネットワークでは、**Socket Mode を選択してください**。

複数の Gateway レプリカをロードバランサーの背後で実行する場合、送信 WSS がブロックされている一方で受信 HTTPS が許可されている場合、またはリバースプロキシですでに Slack Webhook を終端している場合は、**HTTP Request URLs を選択してください**。
</Note>

<Warning>
  Slack は 1 つのアプリに対して複数の Socket Mode 接続を維持でき、各ペイロードを任意の接続に配信する可能性があります。そのため、Slack アプリを共有する個別の OpenClaw Gateway には、同等のルーティングと認可設定が必要です。それ以外の場合は、Gateway ごとに個別の Slack アプリ、単一のリレーイングレス、またはロードバランサーの背後にある HTTP Request URLs を使用してください。[Socket Mode の使用](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)を参照してください。
</Warning>

### リレーモード

リレーモードは、Slack のイングレスを OpenClaw Gateway から分離します。信頼されたルーターが単一の Slack Socket Mode 接続を管理し、送信先 Gateway を選択して、認証済み WebSocket 経由で型付きイベントを転送します。Gateway は、送信 Slack Web API 呼び出しに引き続き独自の Bot token を使用します。

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

リレー URL は、localhost を対象とする場合を除き、`wss://` を使用する必要があります。Bearer token とルーターのルートテーブルを Slack の認可境界の一部として扱ってください。ルーティングされたイベントは、認可済みのアクティベーションとして通常の Slack メッセージハンドラーに入ります。WebSocket の `hello` フレームでルーターから提供される `slack_identity` は、デフォルトの送信ユーザー名とアイコンを設定できます。ただし、呼び出し元から明示的に指定された ID が引き続き優先されます。リレー接続は Socket Mode と同じ上限付きバックオフタイミングで再接続し、切断するたびにルーターから提供された ID を消去します。

### Enterprise Grid の組織全体インストール

1 つの Slack アカウントで、Enterprise Grid の組織全体インストールの対象となるすべてのワークスペースからメッセージを受信できます。直接接続の Socket Mode または HTTP Request URLs を選択してください。エンタープライズアカウントではリレーモードはサポートされていません。以下の 2 つの最小権限マニフェストは、V1 の `message` と `app_mention` のイベントパス、即時返信、リスナーが管理するステータスリアクションのみを有効にします。

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用 Slack コネクター"
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

Enterprise Grid Org Admin または Org Owner にアプリを承認してもらい、組織レベルでインストールして、そのインストールの対象となるワークスペースを選択してください。OpenClaw を起動する前に、対象とするすべてのワークスペースでアプリが利用可能であることを確認してください。Socket Mode 用に `connections:write` を持つ App-Level Token を生成し、組織インストールから Bot token をコピーします。組織にインストールされた Bot token を使用するアカウントを設定します。

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

Gateway に公開 HTTPS エンドポイントがあり、Socket Mode 接続を開かない場合は、HTTP モードを使用します。サンプル URL を Gateway の公開 `webhookPath` URL（デフォルト `/slack/events`）に置き換えてください。

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用 Slack コネクター"
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

Enterprise Grid Org Admin または Org Owner にアプリを承認してもらい、組織レベルでインストールして、そのインストールの対象となるワークスペースを選択してください。Slack が Request URL を検証した後、組織インストールの Bot token とアプリの **Basic Information -> App Credentials -> Signing Secret** をコピーします。同じ Request URL パスを使用してエンタープライズアカウントを設定します。

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

起動時に、OpenClaw は Slack の `auth.test` を使用して `enterpriseOrgInstall` を検証します。フラグのない組織インストール済みトークン、またはフラグのあるワークスペーストークンでは、起動に失敗します。どのワークスペースがインストールを許可したかについては、引き続き Slack が信頼できる情報源です。その後、OpenClaw は配信された各イベントに、設定済みのチャンネル、ユーザー、DM、メンションのポリシーを適用します。Enterprise V1 は、`allowBots` に関係なく、Bot が生成したすべての `message` および `app_mention` イベントをディスパッチ前に拒否します。これは、組織インストールではループ防止に使用できる安定したワークスペース修飾済み Bot ID が提供されないためです。

Enterprise サポートは、直接接続の Socket Mode または HTTP の `message` および `app_mention` イベントと、それらへの即時返信に意図的に限定されています。エンタープライズアカウントでは、リレーモード、スラッシュコマンド、インタラクション、App Home、リアクションイベントリスナー、ピン、Slack アクションツール、Slack ネイティブ承認、バインディング、キューまたはスケジュールされた配信、プロアクティブ送信は利用できません。送信確認、入力中、ステータスのリアクションは、リスナーが管理する Slack クライアントを介してサポートされ、`reactions:write` が必要です。受信リアクション通知とリアクションアクションツールは引き続き利用できません。

即時返信では、チャンク、メディア、メタデータ、アイデンティティのフォールバック、アンファール、受領確認について、標準の Slack 配信動作を再利用します。ただし、検証済みのリスナー所有クライアントがアクティブなイベントターン内にある間に限ります。メモリ内の送信キューとスレッド参加記録は、そのイベントのワークスペースごとに分割されます。クライアント自体がシリアル化または永続化されることはありません。

チャンネルポリシーキーと `dm.groupChannels` エントリには、未加工の安定した Slack チャンネル ID または
`channel:<id>` 形式を使用する必要があります。OpenClaw は、どちらの形式もランタイム照合用の未加工チャンネル ID に正規化します。
`slack:`、`group:`、`mpim:` のプレフィックスを使用すると起動に失敗します。
ユーザーポリシーエントリには、安定した Slack ユーザー ID を使用する必要があります。名前、スラッグ、表示名、
メールアドレスを使用すると起動に失敗します。ID には、Slack の標準的な大文字の
プレフィックスと本体（例: `C0123456789` または `U0123456789`）を使用する必要があります。小文字や
短い類似形式を使用すると起動に失敗します。Enterprise アカウントでは
`dangerouslyAllowNameMatching` を有効にできません。Enterprise アカウントではグローバルな
`mentionPatterns.mode` を設定できますが、`mentionPatterns.allowIn` と
`mentionPatterns.denyIn` を設定すると起動に失敗します。これは、単独の Slack チャンネル ID は
ワークスペースで修飾されておらず、複数のワークスペースで再利用される可能性があるためです。ワークスペースインストールでは、
既存のスコープ付きメンションパターン動作が維持されます。受け入れられた各ワークスペースには、
Slack ID が重複している場合でも、個別のルーティング、セッション、トランスクリプト、重複排除、履歴、キャッシュのアイデンティティが
割り当てられます。`message` ストリーム内では、通常のユーザーメッセージと
ユーザーが作成した `file_share` イベントがサポートされます。それ以外のメッセージサブタイプは、
認可またはシステムイベント処理の前に拒否されます。

Enterprise DM は無効にする（`dm.enabled=false` または
`dmPolicy="disabled"`）か、`dmPolicy="open"` を指定し、
リテラル `"*"` を含む有効なアカウント `allowFrom` によって明示的に開放する必要があります。空の
許可リスト、または `"*"` を含まないユーザー固有 ID を指定すると起動に失敗します。ペアリングと
ユーザーごとの DM 許可リストは拒否されます。これは、それらの認可ストアでは Slack ユーザー ID が
ワークスペースで修飾されていないためです。チャンネルメッセージには引き続きチャンネルポリシーと送信者ポリシーが
適用されます。

## インストール

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` は Plugin を登録して有効にします。以下の Slack アプリとチャンネル設定を構成するまでは何も実行しません。Plugin の一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

このセクションのマニフェストでは、ワークスペーススコープのインストールを作成します。
Enterprise Grid の組織インストールでは、代わりに専用の
[組織全体のマニフェストとワークフロー](#enterprise-grid-org-wide-installs)を使用してください。

<Tabs>
  <Tab title="ソケットモード（デフォルト）">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new) を開く → **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のいずれかのマニフェストを貼り付ける → **Next** → **Create**。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用 Slack コネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw は Slack のアシスタントスレッドを OpenClaw エージェントに接続します。",
      "suggested_prompts": [
        { "title": "何ができますか？", "message": "どのようなことを手伝えますか？" },
        {
          "title": "このチャンネルを要約",
          "message": "このチャンネルの最近のアクティビティを要約してください。"
        },
        { "title": "返信の下書きを作成", "message": "返信の下書き作成を手伝ってください。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw にメッセージを送信",
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
    "description": "OpenClaw 用 Slack コネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw は Slack のアシスタントスレッドを OpenClaw エージェントに接続します。",
      "suggested_prompts": [
        { "title": "何ができますか？", "message": "どのようなことを手伝えますか？" },
        {
          "title": "このチャンネルを要約",
          "message": "このチャンネルの最近のアクティビティを要約してください。"
        },
        { "title": "返信の下書きを作成", "message": "返信の下書き作成を手伝ってください。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw にメッセージを送信",
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
          **Recommended** は、App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループ DM、絵文字／ユーザーグループの読み取りなど、Slack Plugin の全機能に対応します。ワークスペースポリシーによってスコープが制限される場合は **Minimal** を選択してください。DM、チャンネル／グループ履歴、メンション、スラッシュコマンドには対応しますが、ファイル、リアクション、ピン、グループ DM（`mpim:*`）、`emoji:read`、`usergroups:read` は含まれません。各スコープの根拠と、追加のスラッシュコマンドなどの追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        Slack がアプリを作成した後:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` を追加して保存し、App-Level Token をコピーします。
        - **Install App -> Install to Workspace**: Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を構成する">

        推奨される SecretRef 設定:

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

        環境変数によるフォールバック（デフォルトアカウントのみ）:

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

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用 Slack コネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw は Slack のアシスタントスレッドを OpenClaw エージェントに接続します。",
      "suggested_prompts": [
        { "title": "何ができますか？", "message": "どのようなことを手伝えますか？" },
        {
          "title": "このチャンネルを要約",
          "message": "このチャンネルの最近のアクティビティを要約してください。"
        },
        { "title": "返信の下書きを作成", "message": "返信の下書き作成を手伝ってください。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw にメッセージを送信",
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
    "description": "OpenClaw 用 Slack コネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw は Slack のアシスタントスレッドを OpenClaw エージェントに接続します。",
      "suggested_prompts": [
        { "title": "何ができますか？", "message": "何を手伝ってもらえますか？" },
        {
          "title": "このチャンネルを要約",
          "message": "このチャンネルの最近のアクティビティを要約してください。"
        },
        { "title": "返信を作成", "message": "返信の作成を手伝ってください。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw にメッセージを送信",
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
          **推奨**は Slack Plugin の全機能に対応します。**最小構成**では、制限の厳しいワークスペース向けにファイル、リアクション、ピン、グループ DM（`mpim:*`）、`emoji:read`、および `usergroups:read` を省きます。各スコープの根拠については、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        <Info>
          3 つの URL フィールド（`slash_commands[].url`、`event_subscriptions.request_url`、および `interactivity.request_url` / `message_menu_options_url`）は、すべて同じ OpenClaw エンドポイントを指します。Slack のマニフェストスキーマではそれぞれ別の名前が必要ですが、OpenClaw はペイロード種別に基づいてルーティングするため、単一の `webhookPath`（デフォルトは `/slack/events`）で十分です。`slash_commands[].url` のないスラッシュコマンドは、HTTP モードでは通知なしに何も実行しません。
        </Info>

        Slack がアプリを作成したら、次の操作を行います。

        - **Basic Information → App Credentials**：リクエスト検証用の **Signing Secret** をコピーします。
        - **Install App -> Install to Workspace**：Bot User OAuth Token をコピーします。

      </Step>

      <Step title="OpenClaw を設定">

        推奨される SecretRef 設定：

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

        登録が衝突しないように、各アカウントに異なる `webhookPath`（デフォルトは `/slack/events`）を指定します。
        </Note>

      </Step>

      <Step title="Gateway を起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode のトランスポート調整

OpenClaw は、Socket Mode の Slack SDK クライアントの pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack WebSocket の pong またはサーバー ping のタイムアウトが記録される Socket Mode ワークスペースや、イベントループの枯渇が既知のホストでのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後に pong を待つ時間で、`serverPingTimeout` は Slack サーバーの ping を待つ時間です。アプリのメッセージとイベントはアプリケーションの状態であり、トランスポートの生存確認シグナルではありません。

注意事項：

- `socketMode` は HTTP Request URL モードでは無視されます。
- アカウントごとに上書きしない限り、基本の `channels.slack.socketMode` 設定がすべての Slack アカウントに適用されます。アカウントごとの上書きには `channels.slack.accounts.<accountId>.socketMode` を使用します。これはオブジェクトの上書きであるため、そのアカウントに適用するソケット調整フィールドをすべて含めてください。
- OpenClaw のデフォルト値（`15000`）があるのは `clientPingTimeout` だけです。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ Slack SDK に渡されます。
- Socket Mode の再起動バックオフは約 2 秒から始まり、約 30 秒が上限です。復旧可能な起動、起動待機、および切断の失敗は、チャンネルが停止するまで再試行されます。無効な認証、取り消されたトークン、スコープ不足などの恒久的なアカウントおよび認証情報のエラーは、無期限に再試行せず、即座に失敗します。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、Socket Mode と HTTP Request URL で共通です。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）だけです。

基本マニフェスト（Socket Mode がデフォルト）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用 Slack コネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw は Slack のアシスタントスレッドを OpenClaw エージェントに接続します。",
      "suggested_prompts": [
        { "title": "何ができますか？", "message": "何を手伝ってもらえますか？" },
        {
          "title": "このチャンネルを要約",
          "message": "このチャンネルの最近のアクティビティを要約してください。"
        },
        { "title": "返信を作成", "message": "返信の作成を手伝ってください。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw にメッセージを送信",
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

**HTTP Request URL モード**では、`settings` を HTTP 用のバリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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

### その他のマニフェスト設定

上記のデフォルトを拡張する各種機能を提供します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブを有効にし、`app_home_opened` をサブスクライブします。ワークスペースのメンバーが Home タブを開くと、OpenClaw は `views.publish` を含む安全なデフォルトの Home ビューを公開します。会話のペイロードや非公開の設定は含まれません。単一スラッシュコマンドモードが有効な場合、コマンドのヒントには `channels.slack.slashCommand.name` が使用されます。ネイティブコマンドを使用するインストールや、スラッシュコマンドを使用しないインストールでは、このヒントは省略されます。Slack DM 用の **Messages** タブは引き続き有効です。また、マニフェストは `features.assistant_view`、`assistant:write`、`assistant_thread_started`、および `assistant_thread_context_changed` を使用して Slack のアシスタントスレッドを有効にします。アシスタントスレッドはそれぞれ専用の OpenClaw スレッドセッションにルーティングされ、Slack が提供するスレッドコンテキストをエージェントが利用できる状態に保ちます。

<AccordionGroup>
  <Accordion title="オプションのネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を使用できますが、次の点に注意してください。

    - `/status` コマンドは予約されているため、`/status` ではなく `/agentstatus` を使用してください。
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
      "description": "スレッド紐付けの有効期限を管理",
      "usage_hint": "アイドル <duration|off> または最大経過時間 <duration|off>"
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
      "description": "プロバイダー／モデルを一覧表示",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "短いヘルプの概要を表示"
    },
    {
      "command": "/commands",
      "description": "生成されたコマンドカタログを表示"
    },
    {
      "command": "/tools",
      "description": "現在のエージェントが今すぐ使用できるものを表示",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "利用可能な場合はプロバイダーの使用量／クォータを含むランタイム状態を表示"
    },
    {
      "command": "/tasks",
      "description": "現在のセッションの実行中／最近のバックグラウンドタスクを一覧表示"
    },
    {
      "command": "/context",
      "description": "コンテキストがどのように構成されるかを説明",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "送信者IDを表示"
    },
    {
      "command": "/skill",
      "description": "名前を指定してスキルを実行",
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
      "description": "使用量フッターを制御するか、コスト概要を表示",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTPリクエストURL">
        上記のSocket Modeと同じ`slash_commands`リストを使用し、すべてのエントリに`"url": "https://gateway-host.example.com/slack/events"`を追加します。例：

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
      "description": "短いヘルプの概要を表示",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        リスト内のすべてのコマンドで、その`url`値を繰り返し指定します。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトのSlackアプリIDではなく、アクティブなエージェントID（カスタムユーザー名とアイコン）を使用する場合は、`chat:write.customize`ボットスコープを追加します。

    絵文字アイコンを使用する場合、Slackでは`:emoji_name:`構文が必要です。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ（読み取り操作）">
    `channels.slack.userToken`を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack検索の読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Modeには`botToken` + `appToken`が必要です。
- HTTPモードには`botToken` + `signingSecret`が必要です。
- リレーモードには`botToken`に加えて、`relay.url`、`relay.authToken`、`relay.gatewayId`が必要です。アプリトークンや署名シークレットは使用しません。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken`、`userToken`では、プレーンテキスト
  文字列またはSecretRefオブジェクトを使用できます。
- 設定のトークンは環境変数のフォールバックより優先されます。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN`、`SLACK_USER_TOKEN`の環境変数フォールバックは、それぞれデフォルトアカウントにのみ適用されます。
- `userToken`のデフォルトは読み取り専用の動作（`userTokenReadOnly: true`）です。

状態スナップショットの動作：

- Slackアカウントの検査では、認証情報ごとの`*Source`フィールドと`*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- 状態は`available`、`configured_unavailable`、または`missing`です。
- `configured_unavailable`は、アカウントがSecretRef
  または別の非インラインシークレットソースを介して設定されているものの、現在のコマンド／ランタイムパスでは
  実際の値を解決できなかったことを意味します。
- HTTPモードでは`signingSecretStatus`が含まれます。Socket Modeでは、
  必須の組み合わせは`botTokenStatus` + `appTokenStatus`です。

<Tip>
アクション／ディレクトリの読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは、引き続きボットトークンが優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false`であり、ボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slackアクションは`channels.slack.actions.*`によって制御されます。

現在のSlackツールで利用可能なアクショングループ：

| グループ   | デフォルト |
| ---------- | ---------- |
| messages   | 有効       |
| reactions  | 有効       |
| pins       | 有効       |
| memberInfo | 有効       |
| emojiList  | 有効       |

現在のSlackメッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list`があります。`download-file`は、受信ファイルのプレースホルダーに表示されるSlackファイルIDを受け取り、画像の場合は画像プレビューを、それ以外のファイル形式の場合はローカルファイルのメタデータを返します。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.slack.dmPolicy`はDMアクセスを制御します。`channels.slack.allowFrom`は正規のDM許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom`に`"*"`を含める必要があります）
    - `disabled`

    DMフラグ：

    - `dm.enabled`（デフォルトはtrue）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループDMのデフォルトはfalse）
    - `dm.groupChannels`（任意のMPIM許可リスト）

    複数アカウントでの優先順位：

    - `channels.slack.accounts.default.allowFrom`は`default`アカウントにのみ適用されます。
    - 名前付きアカウントでは、独自の`allowFrom`が未設定の場合、`channels.slack.allowFrom`を継承します。
    - 名前付きアカウントは`channels.slack.accounts.default.allowFrom`を継承しません。

    レガシーの`channels.slack.dm.policy`と`channels.slack.dm.allowFrom`は、互換性のため引き続き読み取られます。`openclaw doctor --fix`は、アクセスを変更せずに実行できる場合、それらを`dmPolicy`と`allowFrom`に移行します。

    DMでのペアリングには`openclaw pairing approve slack <code>`を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy`はチャンネルの処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは`channels.slack.channels`以下に配置し、設定キーには**安定したSlackチャンネルIDを使用する必要があります**（例：`C12345678`）。

    ランタイムに関する注意：`channels.slack`が完全に欠落している場合（環境変数のみのセットアップ）、ランタイムは`groupPolicy="allowlist"`へフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy`が設定されている場合も同様です）。

    名前／IDの解決：

    - トークンによるアクセスが許可されている場合、チャンネル許可リストとDM許可リストのエントリは起動時に解決されます
    - 解決できないチャンネル名のエントリは設定されたまま保持されますが、デフォルトではルーティング時に無視されます
    - 受信認可とチャンネルルーティングはデフォルトでID優先です。ユーザー名／スラッグの直接照合には`channels.slack.dangerouslyAllowNameMatching: true`が必要です

    <Warning>
    名前ベースのキー（`#channel-name`または`channel-name`）は、`groupPolicy: "allowlist"`では**一致しません**。チャンネル検索はデフォルトでID優先のため、名前ベースのキーではルーティングが決して成功せず、そのチャンネル内のすべてのメッセージが通知なくブロックされます。これは、ルーティングにチャンネルキーが必須ではなく、名前ベースのキーが機能しているように見える`groupPolicy: "open"`とは異なります。

    キーには必ずSlackチャンネルIDを使用します。IDを確認するには、Slackでチャンネルを右クリック → **Copy link** — URLの末尾にID（`C...`）が表示されます。

    正しい例：

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

    誤った例（`groupPolicy: "allowlist"`では通知なくブロック）：

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

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションによって制限されます。

    メンション元：

    - 明示的なアプリメンション（`<@botId>`）
    - ボットユーザーが対象ユーザーグループのメンバーである場合のSlackユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read`が必要です
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - ボットへの暗黙的な返信スレッド動作（`thread.requireExplicitMention`が`true`の場合は無効）

    チャンネル単位の制御（`channels.slack.channels.<id>`。名前は起動時の解決または`dangerouslyAllowNameMatching`を介する場合のみ）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`。このチャンネルではアカウント／チャットタイプの返信モードを上書きします）
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender`のキー形式：`channel:`、`id:`、`e164:`、`username:`、`name:`、または`"*"`ワイルドカード
      （プレフィックスのないレガシーキーは、引き続き`id:`にのみマッピングされます）

    `ignoreOtherMentions`（デフォルトは `false`）は、別のユーザーまたはユーザーグループにメンションしているものの、このボットにはメンションしていないチャンネルメッセージを破棄します。DM とグループ DM（MPIM）は影響を受けません。このフィルターには、`auth.test` から解決されたボットユーザー ID が必要です。そのアイデンティティを取得できない場合（たとえば、ユーザートークンのみのアイデンティティ）、ゲートはフェイルオープンとなり、メッセージは変更されずに通過します。

    `allowBots` は、チャンネルとプライベートチャンネルに対して保守的に動作します。ボットが作成したルームメッセージは、送信元ボットがそのルームの `users` 許可リストに明示的に記載されている場合、または `channels.slack.allowFrom` の明示的な Slack オーナー ID のうち少なくとも 1 つが現在ルームのメンバーである場合にのみ受け入れられます。ワイルドカードおよび表示名によるオーナーエントリは、オーナーの在室条件を満たしません。オーナーの在室確認には Slack `conversations.members` を使用します。アプリにルーム種別に対応する読み取りスコープ（パブリックチャンネルでは `channels:read`、プライベートチャンネルでは `groups:read`）があることを確認してください。メンバーの検索に失敗した場合、OpenClaw はボットが作成したルームメッセージを破棄します。

    受け入れられたボット作成の Slack メッセージには、共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)が適用されます。デフォルトの上限を `channels.defaults.botLoopProtection` で設定し、ワークスペースまたはチャンネルに異なる上限が必要な場合は `channels.slack.botLoopProtection` または `channels.slack.channels.<id>.botLoopProtection` で上書きします。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` として、チャンネルは `channel` として、MPIM は `group` としてルーティングされます。
- Slack のルートバインディングは、生のピア ID に加えて、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を受け入れます。
- デフォルトの `session.dmScope=main` では、Slack の DM はエージェントのメインセッションに統合されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- 通常のトップレベルのチャンネルメッセージは、`replyToMode` が非 `off` であっても、チャンネルごとのセッションに留まります。
- Slack のスレッド返信では、`replyToMode="off"` により送信返信のスレッド化が無効になっていても、セッションサフィックス（`:thread:<threadTs>`）に親 Slack `thread_ts` を使用します。
- トップレベルのチャンネルルートから表示可能な Slack スレッドが開始されると予想される場合、OpenClaw は対象となるルートを `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` にシードし、ルートと後続のスレッド返信が同じ OpenClaw セッションを共有するようにします。これは、`app_mention` イベント、明示的なボットメンションまたは設定済みのメンションパターンとの一致、および非 `off` の `replyToMode` を持つ `requireMention: false` チャンネルに適用されます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションの開始時に取得する既存のスレッドメッセージ数を制御します（デフォルトは `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルトは `false`）: `true` の場合、暗黙のスレッドメンションを抑制し、ボットがそのスレッドにすでに参加していても、スレッド内で明示的に `@bot` メンションされた場合にのみ応答するようにします。これを設定しない場合、ボットが参加しているスレッド内の返信は `requireMention` のゲートを迂回します。

返信のスレッド化の制御:

- `channels.slack.channels.<id>.replyToMode`: Slack のチャンネル／プライベートチャンネルメッセージに対するチャンネルごとの上書き
- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルトは `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット用のレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` ツールから明示的に Slack スレッドへ返信する場合、`action: "send"` と `threadId` または `replyTo` とともに `replyBroadcast: true` を設定すると、Slack にスレッド返信を親チャンネルにもブロードキャストするよう要求できます。これは Slack の `chat.postMessage` `reply_broadcast` フラグに対応し、テキストまたは Block Kit の送信でのみサポートされ、メディアのアップロードではサポートされません。

`message` ツール呼び出しが Slack スレッド内で実行され、同じチャンネルを対象とする場合、OpenClaw は通常、有効なアカウント、チャット種別、またはチャンネルごとの `replyToMode` に従って現在の Slack スレッドを継承します。自動返信および同じチャンネルへの `send` または `upload-file` 呼び出しにも、同じチャンネルごとの上書きが適用されます。代わりに新しい親チャンネルメッセージを強制するには、`action: "send"` または `action: "upload-file"` に `topLevel: true` を設定します。`threadId: null` も同じトップレベルのオプトアウトとして受け入れられます。

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む、送信 Slack 返信のスレッド化を無効にします。受信 Slack スレッドのセッションはフラット化されません。Slack スレッド内にすでに投稿されたメッセージは、引き続き `:thread:<threadTs>` セッションにルーティングされます。これは Telegram とは異なります。Telegram では、`"off"` モードでも明示的なタグが引き続き適用されます。Slack のスレッドではメッセージがチャンネル上で非表示になりますが、Telegram の返信はインラインで表示され続けます。
</Note>

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。`ackReactionScope` は、その絵文字を実際に送信するタイミングを決定します。

デフォルトでは、Slack のネイティブなアシスタントスレッドステータスが切り替わる読み込みメッセージで進行状況を表示している間、確認リアクションは固定されたままです。代わりにキュー待ち／思考中／ツール／完了／エラーのリアクションライフサイクルを有効にするには、`messages.statusReactions.enabled: true` を設定します。

### 絵文字（`ackReaction`）

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェントアイデンティティの絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"eyes"` / 👀）

注意:

- Slack ではショートコード（例: `"eyes"`）が必要です。
- Slack アカウントまたはグローバルでリアクションを無効にするには、`""` を使用します。

### スコープ（`messages.ackReactionScope`）

Slack プロバイダーは `messages.ackReactionScope`（デフォルトは `"group-mentions"`）からスコープを読み取ります。現在、Slack アカウント単位または Slack チャンネル単位の上書きはありません。この値は Gateway 全体に適用されます。

値:

- `"all"`: アンビエントなルームイベントを含む、DM とグループでリアクションします。
- `"direct"`: DM でのみリアクションします。
- `"group-all"`: アンビエントなルームイベントを除く、すべてのグループメッセージでリアクションします（DM は対象外）。
- `"group-mentions"`（デフォルト）: グループ内で、ボットがメンションされた場合（またはオプトインしたグループメンション可能対象に含まれる場合）にのみリアクションします。**DM は対象外です。**
- `"off"` / `"none"`: リアクションしません。

<Note>
デフォルトのスコープ（`"group-mentions"`）では、ダイレクトメッセージまたはアンビエントなルームイベントで確認リアクションは実行されません。受信した Slack DM と発言のないルームイベントで、設定済みの `ackReaction`（例: `"eyes"`）を表示するには、`messages.ackReactionScope` を `"all"` に設定します。`messages.ackReactionScope` は Slack プロバイダーの起動時に読み取られるため、変更を反映するには Gateway の再起動が必要です。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // DM とグループでリアクション
  },
}
```

## テキストストリーミング

`channels.slack.streaming` はライブプレビューの動作を制御します:

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: 分割されたプレビュー更新を追記します。
- `progress`: 生成中は進行状況のステータステキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効な場合、ツール／進行状況の更新を同じ編集済みプレビューメッセージにルーティングします（デフォルト: `true`）。ツール／進行状況メッセージを分離したままにするには、`false` を設定します。
- `streaming.preview.commandText` / `streaming.progress.commandText`: 生のコマンド／実行テキストを非表示にしながら簡潔なツール進行状況行を維持するには、`status` に設定します（デフォルト: `raw`）。

簡潔な進行状況行を維持しながら、生のコマンド／実行テキストを非表示にする:

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

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合に Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

Slack ネイティブの進行状況タスクカードは、進行状況モードでオプトインして使用します。作業中に Slack ネイティブの計画／タスクカードを送信し、完了時に同じタスクカードを更新するには、`channels.slack.streaming.mode="progress"` とともに `channels.slack.streaming.progress.nativeTaskCards` を `true` に設定します。このフラグを設定しない場合、進行状況モードではポータブルな下書きプレビューの動作が維持されます。

- ネイティブテキストストリーミングと Slack アシスタントスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッドの選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングを利用できない場合や返信スレッドが存在しない場合でも、チャンネル、グループチャット、トップレベルの DM ルートでは通常の下書きプレビューを使用できます。
- トップレベルの Slack DM はデフォルトではスレッド外に留まるため、Slack のスレッド形式のネイティブストリーム／ステータスプレビューは表示されません。代わりに、OpenClaw が DM に下書きプレビューを投稿して編集します。
- メディアおよびテキスト以外のペイロードは通常の配信にフォールバックします。
- メディア／エラーの最終結果は保留中のプレビュー編集をキャンセルします。対象となるテキスト／ブロックの最終結果は、その場でプレビューを編集できる場合にのみフラッシュされます。
- 返信の途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードを通常の配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使用する:

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

Slack ネイティブの進行状況タスクカードを有効にする:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` のレガシーエイリアスです。
- ブール値の `channels.slack.streaming` は、`channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` のレガシーエイリアスです。
- トップレベルの `channels.slack.chunkMode` と `channels.slack.nativeStreaming` は、`channels.slack.streaming.chunkMode` と `channels.slack.streaming.nativeTransport` のレガシーエイリアスです。
- レガシーエイリアスは実行時に読み取られません。永続化された Slack ストリーミング設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

## 入力中リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行の完了時に削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使用するスレッド返信以外で特に役立ちます。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack ではショートコード（例: `"hourglass_flowing_sand"`）が必要です。
- リアクションはベストエフォートで行われ、返信または失敗経路の完了後に自動的にクリーンアップが試行されます。

## 音声入力

現在 Slack で OpenClaw に話しかけるには、OpenClaw アプリに Slack のオーディオクリップを送信します。Slackbot のディクテーション用マイクは Slack が所有する別機能であり、アプリ API ではありません。

- **[Slackbot 音声ディクテーション](https://slack.com/help/articles/202026038-How-to-use-Slackbot)**は、ユーザーの非公開 Slackbot 会話内で動作します。Slack は録音を Slackbot プロンプトに変換しますが、Events API を介してサードパーティの Slack アプリに音声ファイル、ディクテーションイベント、プロンプト、入力ソースマーカーを送信しません。OpenClaw Slack plugin では、これを有効化したり受信したりできません。
- **[Slack オーディオクリップ](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)**は、OpenClaw の DM、チャンネル、またはスレッドに投稿できる、Slack に保存されたファイルです。OpenClaw はアクセス可能なクリップをボットトークンでダウンロードし、Slack のクリップ MIME メタデータを正規化して、共有の[音声文字起こしパイプライン](/ja-JP/nodes/audio)に送信します。推奨アプリマニフェストには、必要な `files:read` スコープが含まれています。

オーディオクリップと Slackbot ディクテーションでは、プライバシー上の意味が異なります。クリップには Slack のファイル保持ポリシーが適用され、OpenClaw が文字起こしのためにダウンロードします。一方、Slack によると、ディクテーション音声は保存されません。

`requireMention: true` が設定されたチャンネルでは、キャプションのないオーディオクリップでも、設定済みのメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）を発話することでゲートを満たせます。OpenClaw はクリップをダウンロードまたは文字起こしする前に送信者を認可し、その後、文字起こしが一致した場合にのみ受け入れます。失敗した、または一致しなかった推測的な文字起こしは、ダウンロードしたクリップとともに破棄され、チャンネル履歴には保持されません。ネイティブ Slack の `@bot` ID は音声から推測できないため、発話名パターンを設定するか、入力したメンションを含めてください。文字起こしのエコーが有効な場合、エコーは受け入れ後にのみ送信されます。

## メディア、チャンク分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack ファイルの添付は、Slack がホストする非公開 URL（トークン認証済みリクエストフロー）からダウンロードされ、取得に成功し、サイズ制限内であればメディアストアに書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` を使用して元のファイルを取得できます。

    ダウンロードでは、アイドルタイムアウトと合計タイムアウトに上限が設定されています。Slack ファイルの取得が停止または失敗した場合でも、OpenClaw はメッセージの処理を続行し、ファイルプレースホルダーにフォールバックします。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きしない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使用します（デフォルトは `8000`、Slack 自体のメッセージ長制限を上限とします）
    - `channels.slack.streaming.chunkMode="newline"` は段落優先の分割を有効にします
    - ファイル送信は Slack アップロード API を使用し、スレッド返信（`thread_ts`）を含められます
    - 長いファイルキャプションでは、Slack で安全な最初のテキストチャンクをアップロードコメントとして使用し、残りのチャンクを後続メッセージとして送信します
    - 送信メディアの上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信にはメディアパイプラインの MIME 種別デフォルトが使用されます

  </Accordion>

  <Accordion title="配信先">
    推奨される明示的な送信先：

    - DM の場合は `user:<id>`
    - チャンネルの場合は `channel:<id>`

    テキストまたはブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルアップロードとスレッド送信では具体的な会話 ID が必要なため、まず Slack 会話 API を使用して DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュの動作

スラッシュコマンドは、Slack では単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには、`channels.slack.slashCommand` を設定します：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要です。代わりにグローバル設定で `channels.slack.commands.native: true` または `commands.native: true` を使用して有効にします。

- Slack ではネイティブコマンドの自動モードは**オフ**であるため、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、優先順位に従って次のいずれかとしてレンダリングされます：

- 十分に短い選択肢が 3～5 個：オーバーフロー（「...」）メニュー
- 選択肢が 100 個を超え、非同期の選択肢フィルタリングを利用可能：外部選択
- 選択肢が 1～2 個、またはエンコードされた値が選択項目には長すぎる選択肢がある場合：ボタンブロック
- それ以外（選択肢が 6～100 個、または非同期フィルタリングなしで 100 個を超える場合）：静的選択メニュー。メニューごとに 100 個の選択肢でチャンク分割されます

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離されたキーを使用しつつ、`CommandTargetSessionKey` を使用してコマンド実行を対象の会話セッションに引き続きルーティングします。

## ネイティブチャート

Slack の公開 [`data_visualization` Block Kit ブロック](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
は、メッセージ内に折れ線、棒、面、円グラフをレンダリングします。OpenClaw はポータブルな
`presentation` `chart` ブロックをそのネイティブ形式にマッピングします。通常の
`chat:write` メッセージアクセス以外に、追加の OAuth スコープ、
ファイルアップロード、画像レンダラー、Slack 設定は必要ありません。

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

ネイティブレンダリングの前に、Slack の制限が適用されます：

- タイトルと任意の軸ラベル：50 文字
- 円グラフ：1～12 個の正のセグメント
- 折れ線／棒／面：一意の名前を持つ 1～12 個の系列と、共有される 1～20 個のカテゴリ
- セグメント、カテゴリ、系列のラベル：20 文字
- すべての系列には、各カテゴリに対して有限値が 1 つ必要です。円グラフ以外の値は
  負でもかまいません

各ネイティブチャートには、スクリーンリーダー、通知、セッションミラーリング、およびブロックをレンダリングできない
クライアント向けのトップレベルテキスト表現も含まれます。他の OpenClaw チャンネルへの標準プレゼンテーション送信では、
ネイティブチャート対応を明示していない限り、同じ決定的なチャートデータをテキストとして受信します。
段階的ロールアウト中に Slack が `invalid_blocks` でチャートを拒否した場合、OpenClaw は
拒否されたネイティブデータブロックを削除し、同列のコントロールを保持したまま、
完全なチャート表現を表示テキストとして送信します。

現在、Slack はメッセージごとに最大 2 個の `data_visualization` ブロックを受け付けます。
プレゼンテーションに有効なチャートが 2 個を超えて含まれる場合、OpenClaw は順序を維持し、
各メッセージのチャートを 2 個以内にして、後続メッセージでネイティブレンダリングを続行します。

Slack の[開発者向けリリース](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
では、このブロックをアプリ向けの Block Kit 機能として説明しており、有料プランの制限は公開されていません。
Business+/Enterprise の利用資格に関する記述は、Slackbot による自動 AI チャート生成に適用されます。
これは、アプリが構造化済みの Block Kit チャートを送信することとは別です。
チャートはメッセージ専用ブロックであり、App Home、モーダル、Canvas のコンテンツではありません。

## ネイティブテーブル

Slack の現在の [`data_table` Block Kit ブロック](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
は、構造化された行と列をメッセージ内にレンダリングします。OpenClaw は明示的なポータブル
`presentation` `table` ブロックを `data_table` にマッピングします。Slack の
従来の [`table` ブロック](https://docs.slack.dev/reference/block-kit/blocks/table-block/)は使用しません。
通常の `chat:write` メッセージアクセス以外に、追加の OAuth スコープや Slack 設定は必要ありません。

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

OpenClaw はヘッダーセルと文字列セルを Slack の `raw_text` セルにマッピングします。数値セルは
`raw_number` にマッピングされ、ネイティブの並べ替えとフィルタリング用に有限数値が保持されます。
`rowHeaderColumnIndex` が存在する場合、ゼロから始まるその列を Slack の行ヘッダーとして指定します。

公開されている Slack の `data_table` 制限は、ネイティブレンダリングの前に適用されます：

- 1～20 列
- 1～100 データ行と、ヘッダー行
- すべての行で同じセル数
- 1 メッセージ内の全テーブルセルを合計して最大 10,000 文字

メッセージが合計文字数制限内であれば、複数の有効なテーブルブロックをネイティブにレンダリングできます。
ネイティブの範囲内でレンダリングできないテーブルは、行やセルを失う代わりに、完全で決定的なテキストになります。
そのテキストが Slack メッセージ 1 件分を超える場合、送信とスラッシュ応答では順序付けられたテキストチャンクを使用します。
テーブルの編集では、既存メッセージから行を暗黙に切り捨てる代わりに、明示的なサイズエラーが発生します。

ポータブルプレゼンテーションから生成される各ネイティブテーブルには、スクリーンリーダー、通知、セッションミラーリング、
およびブロックをレンダリングできないクライアント向けのトップレベルテキスト表現も含まれます。
フォールバックではチャートとテーブルの生の値がリテラルのまま維持されるため、`<@U123>` のようなセルデータが Slack メンションになることはありません。
Slack がネイティブのチャートまたはテーブルブロックを `invalid_blocks` で拒否した場合、OpenClaw は
上限付きの 1 回の復旧処理ですべてのネイティブデータブロックを削除し、ボタンや選択項目などの有効な同列ブロックを保持して、
Slack の書式設定を無効にした完全な表示用チャートおよびテーブルテキストを送信します。スラッシュコマンド配信では、
コマンド全体で Slack の 5 回の `response_url` 予算を追跡します。各返信バッチの前に、
残りの呼び出し回数内に収まる完全なプランを選択するか、そのバッチを投稿する前に失敗します。

明示的な `presentation` テーブルブロックのみがネイティブテーブルに昇格されます。
Markdown のパイプテーブルは作成されたテキストのままです。OpenClaw はテーブル構造やセル型を推測しません。
既存の信頼済み Slack ネイティブ生成元は、`channelData.slack.blocks` を介して生のブロックを引き続き渡せます。
OpenClaw は有効な生の `data_table` セルからフォールバックテキストを生成しますが、
不正なカスタムブロックはキャプションまたは一般的な Block Kit フォールバックに縮退することがあります。
ポータブルなエージェント、CLI、plugin の出力では `presentation` を使用してください。

## インタラクティブ返信

Slack はエージェントが作成したインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトで無効です。
新しいエージェント、CLI、plugin の出力では、共有の
`presentation` ボタンまたは選択ブロックを使用することを推奨します。これらは同じ Slack インタラクション
パスを使用し、他のチャンネルでも適切に縮退します。

グローバルに有効化するには：

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

または、1 つの Slack アカウントだけで有効化するには：

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

有効にすると、エージェントは非推奨の Slack 専用返信ディレクティブも引き続き出力できます：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択を
既存の Slack インタラクションイベントパス経由で返します。古いプロンプトと
Slack 固有のエスケープハッチ用に維持し、新しいポータブルコントロールには共有プレゼンテーションを使用してください。

ディレクティブコンパイラ API も、新しい生成コードでは非推奨です：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新しい Slack レンダリングコントロールには、`presentation` ペイロードと `buildSlackPresentationBlocks(...)` を使用してください。

注：

- これは Slack 固有のレガシー UI です。他のチャンネルでは Slack Block
  Kit ディレクティブを独自のボタンシステムに変換しません。
- インタラクティブコールバック値は OpenClaw が生成する不透明なトークンであり、エージェントが作成した生の値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks ペイロードを送信せず、元のテキスト応答にフォールバックします。

### Plugin が所有するモーダル送信

インタラクティブハンドラーを登録する Slack Plugin は、OpenClaw がペイロードを
エージェントに表示されるシステムイベント用に圧縮する前に、モーダルの
`view_submission` および `view_closed` ライフサイクルイベントも受信できます。
Slack モーダルを開くときは、次のいずれかのルーティングパターンを使用します。

- `callback_id` を `openclaw:<namespace>:<payload>` に設定します。
- または、既存の `callback_id` を維持し、`pluginInteractiveData:
"<namespace>:<payload>"` をモーダルの `private_metadata` に配置します。

ハンドラーは `ctx.interaction.kind` を `view_submission` または
`view_closed` として受信し、正規化された `inputs` と、Slack からの完全な生の
`stateValues` オブジェクトも受信します。Plugin ハンドラーを呼び出すにはコールバック ID のみのルーティングで十分です。モーダルからエージェントに表示されるシステムイベントも生成する必要がある場合は、既存のモーダルの
`private_metadata` ユーザー／セッションルーティングフィールドを含めます。エージェントは、圧縮され編集済みの
`Slack interaction: ...` システムイベントを受信します。ハンドラーが
`systemEvent.summary`、`systemEvent.reference`、または `systemEvent.data` を返す場合、これらの
フィールドがその圧縮イベントに含まれるため、エージェントはフォームの完全なペイロードを確認することなく
Plugin が所有するストレージを参照できます。

## Slack でのネイティブ承認

Slack は、Web UI やターミナルにフォールバックする代わりに、インタラクティブなボタンと操作を備えたネイティブ承認クライアントとして機能できます。

- 実行および Plugin の承認は、Slack ネイティブの Block Kit プロンプトとして表示できます。
- `channels.slack.execApprovals.*` は引き続き、ネイティブ実行承認クライアントの有効化および DM／チャンネルルーティング設定です。
- 実行承認 DM は `channels.slack.execApprovals.approvers` または `commands.ownerAllowFrom` を使用します。
- Slack が発生元セッションのネイティブ承認クライアントとして有効な場合、または `approvals.plugin` が発生元の Slack セッションか Slack ターゲットにルーティングされる場合、Plugin の承認には Slack ネイティブボタンが使用されます。
- Plugin 承認 DM は、`channels.slack.allowFrom` の Slack Plugin 承認者、名前付きアカウントの `allowFrom`、またはアカウントのデフォルトルートを使用します。
- 承認者の認可は引き続き適用されます。実行専用の承認者は、Plugin 承認者でもない限り、Plugin リクエストを承認できません。

これは、他のチャンネルと同じ共有承認ボタンのサーフェスを使用します。Slack アプリ設定で `interactivity` が有効になっている場合、承認プロンプトは会話内に Block Kit ボタンとして直接表示されます。
これらのボタンがある場合、それらが主要な承認 UX です。ツール結果がチャット承認を利用できない、または手動承認が唯一の経路であると示す場合にのみ、OpenClaw は手動の `/approve` コマンドを含める必要があります。

設定パス：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト：`dm`）
- `agentFilter`、`sessionFilter`

`enabled` が未設定または `"auto"` で、少なくとも 1 人の実行承認者が解決される場合、Slack はネイティブ実行承認を自動的に有効にします。Slack Plugin の承認者が解決され、リクエストがネイティブクライアントのフィルターに一致する場合、Slack はこのネイティブクライアント経路を通じてネイティブ Plugin 承認も処理できます。Slack をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。承認者が解決される場合にネイティブ承認を強制的に有効にするには、`enabled: true` を設定します。Slack の実行承認を無効にしても、`approvals.plugin` を通じて有効になっているネイティブ Slack Plugin 承認の配信は無効になりません。Plugin 承認の配信では、代わりに Slack Plugin 承認者が使用されます。

Slack の実行承認を明示的に設定していない場合のデフォルト動作：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者の上書き、フィルターの追加、または発生元チャットへの配信を有効にする場合のみです。

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

共有 `approvals.exec` 転送は別の機能です。実行承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用します。共有 `approvals.plugin` 転送も別の機能です。Slack が Plugin 承認リクエストをネイティブに処理できる場合にのみ、Slack ネイティブ配信はそのフォールバックを抑制します。

同じチャットでの `/approve` は、すでにコマンドをサポートしている Slack チャンネルと DM でも機能します。承認転送モデル全体については、[実行承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用動作

- メッセージの編集／削除はシステムイベントにマッピングされます。
- スレッドのブロードキャスト（「Also send to channel」を使用したスレッド返信）は、通常のユーザーメッセージとして処理されます。
- リアクションの追加／削除イベントはシステムイベントにマッピングされます。
- メンバーの参加／退出、チャンネルの作成／名前変更、ピンの追加／削除イベントはシステムイベントにマッピングされます。
- 任意のプレゼンスポーリングにより、観測された人間の参加者の `away` から `active` への遷移を、その参加者が最も最近アクティブだった適格な Slack セッションにマッピングできます。デフォルトでは無効です。
- `configWrites` が有効な場合、`channel_id_changed` はチャンネル設定キーを移行できます。
- チャンネルのトピック／目的メタデータは信頼されていないコンテキストとして扱われ、ルーティングコンテキストに注入される場合があります。
- 該当する場合、スレッド開始メッセージと初期スレッド履歴コンテキストのシードは、設定済みの送信者許可リストでフィルタリングされます。
- ブロックアクション、ショートカット、モーダル操作は、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを発行します。
  - ブロックアクション：選択された値、ラベル、ピッカー値、`workflow_*` メタデータ
  - グローバルショートカット：コールバックおよびアクターのメタデータ。アクターの直接セッションにルーティング
  - メッセージショートカット：コールバック、アクター、チャンネル、スレッド、選択されたメッセージのコンテキスト
  - モーダルの `view_submission` および `view_closed` イベント。ルーティングされたチャンネルメタデータとフォーム入力を含む

Slack アプリ設定でグローバルショートカットまたはメッセージショートカットを定義し、空でない任意のコールバック ID を使用します。OpenClaw は一致するショートカットペイロードを確認応答し、他の Slack 操作と同じ DM／チャンネル送信者ポリシーを適用して、サニタイズされたイベントをルーティング先のエージェントセッションのキューに追加します。トリガー ID と応答 URL はエージェントコンテキストから編集されます。

### プレゼンスイベント

Slack は Events API または Socket Mode を通じてプレゼンスの変更を送信しません。代わりに OpenClaw は、通常の Slack アクセスチェックとルーティングチェックに合格したメッセージを送信した人間の参加者について、[`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) をポーリングできます。

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

- `off`（デフォルト）：プレゼンスタイマーも Slack API 呼び出しも使用しません。
- `auto`：過去 24 時間にアクティブだった DM、MPIM、Slack スレッドを、観測対象の人間の参加者を最大 8 人として監視します。トップレベルのチャンネルセッションは除外されます。
- `on`：参加者数の上限なしで同じ会話を監視し、トップレベルのチャンネルセッションも含めます。チャンネルごとの上書きを使用して、特定のチャンネルを強制的に対象または除外します。

OpenClaw は Slack アカウントごとに 1 分あたり最大 45 人の一意のユーザーをポーリングし、最初の結果ではエージェントを起動せずに初期状態を設定し、観測された `away` から `active` への遷移時にのみエージェントを起動します。同じ人物が複数のスレッドに参加している場合でも、Slack アカウントおよびユーザーごとに永続的な 8 時間のクールダウンが適用されます。イベントは、その人物が最も最近アクティブだった適格な会話にのみルーティングされ、短い挨拶を 1 件送信するか判断する前に、メモリ／Wiki と既知のタイムゾーンコンテキストを参照するようエージェントに指示します。エージェントは何も送信しないこともできます。

ボットトークンには `users:read` が必要です。これは推奨マニフェストにすでに含まれています。Enterprise Grid の組織全体へのインストールでは、プレゼンスイベントを利用できません。

## 設定リファレンス

主要なリファレンス：[設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード／認証：`mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM アクセス：`dm.enabled`、`dmPolicy`、`allowFrom`（レガシー：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 互換性切り替え：`dangerouslyAllowNameMatching`（緊急時用。必要な場合を除き無効のままにしてください）
- チャンネルアクセス：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- スレッド／履歴：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- プレゼンスによる起動：`presenceEvents.mode`、`channels.*.presenceEvents.mode`（`off|auto|on`、デフォルト `off`）
- 配信：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展開表示：`unfurlLinks`（デフォルト：`false`）、`chat.postMessage` のリンク／メディアプレビュー制御用の `unfurlMedia`。リンクプレビューを再び有効にするには `unfurlLinks: true` を設定します
- 運用／機能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順序で確認します。

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`）— **キーはチャンネル ID である必要があります**（`C12345678`）。名前（`#channel-name`）ではありません。チャンネルルーティングはデフォルトで ID 優先のため、名前ベースのキーは `groupPolicy: "allowlist"` では通知なく失敗します。ID を確認するには、Slack でチャンネルを右クリック → **Copy link** — URL 末尾の `C...` 値がチャンネル ID です。
    - `requireMention`
    - チャンネルごとの `users` 許可リスト
    - `messages.groupChat.visibleReplies`：通常のグループ／チャンネルリクエストのデフォルトは `"automatic"` です。`"message_tool"` を有効にしており、ログにアシスタントのテキストが表示されているのに `message(action=send)` 呼び出しがない場合、モデルが表示可能なメッセージツール経路を使用しませんでした。このモードでは最終テキストは非公開のままです。抑制されたペイロードのメタデータについて Gateway の詳細ログを確認するか、通常のアシスタントの最終返信をすべてレガシー経路で投稿する場合は `"automatic"` に設定します。
    - `messages.groupChat.unmentionedInbound`：`"room_event"` の場合、メンションされていない許可済みチャンネルの会話は周辺コンテキストとなり、エージェントが `message` ツールを呼び出さない限り応答しません。[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    便利なコマンド：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    確認事項：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（または従来の `channels.slack.dm.policy`）
    - ペアリング承認／許可リストエントリ（`dmPolicy: "open"` には引き続き `channels.slack.allowFrom: ["*"]` が必要）
    - グループ DM は MPIM 処理を使用します。`channels.slack.dm.groupEnabled` を有効にし、設定されている場合は MPIM を `channels.slack.dm.groupChannels` に含めます
    - Slack Assistant の DM イベント：`drop message_changed` に言及する詳細ログは、
      通常、Slack が編集済みの Assistant スレッドイベントを送信したものの、
      メッセージメタデータから人間の送信者を復元できなかったことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode が接続しない">
    Slack アプリ設定で、ボットトークンとアプリトークン、および Socket Mode が有効になっていることを確認します。
    App-Level Token には `connections:write` が必要であり、Bot User OAuth Token
    のボットトークンは、アプリトークンと同じ Slack アプリ／ワークスペースに属している必要があります。

    `openclaw channels status --probe --json` に `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    設定されていますが、現在のランタイムは SecretRef が参照する
    値を解決できていません。

    `slack socket mode failed to start; retry ...` のようなログは、復旧可能な
    起動失敗です。一方、スコープ不足、失効したトークン、無効な認証では即座に失敗します。
    `slack token mismatch ...` ログは、ボットトークンとアプリトークンが
    異なる Slack アプリに属していると思われることを意味します。Slack アプリの認証情報を修正してください。

  </Accordion>

  <Accordion title="HTTP モードでイベントを受信しない">
    次を確認します：

    - 署名シークレット
    - Webhook パス
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`
    - 公開 URL が TLS を終端し、リクエストを Gateway パスに転送していること
    - Slack アプリの `request_url` パスが `channels.slack.webhookPath`（デフォルトは `/slack/events`）と完全に一致していること

    アカウントのスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、
    HTTP アカウントは設定されていますが、現在のランタイムは
    SecretRef が参照する署名シークレットを解決できていません。

    `slack: webhook path ... already registered` ログが繰り返し表示される場合、2 つの HTTP
    アカウントが同じ `webhookPath` を使用しています。アカウントごとに異なるパスを指定してください。

  </Accordion>

  <Accordion title="ネイティブコマンド／スラッシュコマンドが実行されない">
    どちらを意図しているか確認します：

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）と、Slack に登録された対応するスラッシュコマンド
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    Slack はスラッシュコマンドを自動的に作成または削除しません。`commands.native: "auto"` では Slack のネイティブコマンドは有効になりません。`true` を使用し、対応するコマンドを Slack アプリで作成してください。HTTP モードでは、すべての Slack スラッシュコマンドに Gateway URL を含める必要があります。Socket Mode では、コマンドペイロードは WebSocket 経由で届き、Slack は `slash_commands[].url` を無視します。

    また、`commands.useAccessGroups`、DM の認可、チャンネルの許可リスト、
    およびチャンネルごとの `users` 許可リストも確認してください。Slack は、
    ブロックされたスラッシュコマンド送信者に対して、次のような一時的エラーを返します：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 添付メディアのリファレンス

Slack ファイルのダウンロードに成功し、サイズ制限内であれば、Slack はダウンロードしたメディアをエージェントターンに添付できます。音声クリップは文字起こしでき、画像ファイルはメディア理解パスを通すか、視覚対応の応答モデルに直接渡すことができます。その他のファイルは、ダウンロード可能なファイルコンテキストとして引き続き利用できます。

### 対応メディア形式

| メディア形式                   | ソース               | 現在の動作                                                                        | 備考                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音声クリップ             | Slack ファイル URL   | ダウンロードされ、共有音声文字起こしを通じてルーティングされる                    | `files:read` と、動作する `tools.media.audio` モデルまたは CLI が必要      |
| JPEG / PNG / GIF / WebP 画像   | Slack ファイル URL   | ダウンロードされ、視覚対応の処理用にターンへ添付される                            | ファイルごとの上限：`channels.slack.mediaMaxMb`（デフォルト 20 MB）                 |
| PDF ファイル                   | Slack ファイル URL   | ダウンロードされ、`download-file` や `pdf` などのツール向けファイルコンテキストとして公開される | Slack の受信処理では PDF を画像視覚入力へ自動変換しない                    |
| その他のファイル               | Slack ファイル URL   | 可能な場合はダウンロードされ、ファイルコンテキストとして公開される                | バイナリファイルは画像入力として扱われない                                |
| スレッド返信                   | スレッド開始メッセージのファイル | 返信に直接のメディアがない場合、ルートメッセージのファイルをコンテキストとして取り込める | ファイルのみの開始メッセージでは添付プレースホルダーを使用する            |
| 複数ファイルのメッセージ       | 複数の Slack ファイル | 各ファイルが個別に評価される                                                       | Slack の処理はメッセージあたり 8 ファイルまで                             |

### 受信パイプライン

ファイル添付のある Slack メッセージを受信した場合：

1. OpenClaw はボットトークンを使用して、Slack の非公開 URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロードしたメディアのパスとコンテンツタイプが受信コンテキストに追加されます。
4. 音声クリップは共有文字起こしパイプラインにルーティングされます。同じコンテキストの画像添付は、画像対応のモデル／ツールパスで使用できます。
5. その他のファイルは、処理可能なツール向けのファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドルートの添付継承

メッセージがスレッド内に届いた場合（`thread_ts` 親を持つ場合）：

- 返信自体に直接のメディアがなく、含まれているルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始時のコンテキストとして取り込めます。
- ルートファイルは、新規またはリセットされたスレッドセッションの初期化時にのみ取り込まれます。後続のテキストのみの返信では既存のセッションコンテキストが再利用され、ルートファイルが新しいメディアとして再添付されることはありません。
- 返信に直接添付されたファイルが、ルートメッセージの添付より優先されます。
- テキストがなくファイルのみのルートメッセージは、フォールバックでもファイルを含められるよう、添付プレースホルダーで表現されます。

### 複数添付の処理

1 件の Slack メッセージに複数のファイル添付が含まれる場合：

- 各添付はメディアパイプラインで個別に処理されます。
- ダウンロードしたメディア参照はメッセージコンテキストに集約されます。
- 処理順序は、イベントペイロード内の Slack ファイル順に従います。
- 1 つの添付のダウンロードに失敗しても、他の添付の処理は妨げられません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**：デフォルトはファイルごとに 20 MB。`channels.slack.mediaMaxMb` で設定できます。
- **音声文字起こしの上限**：ダウンロードしたファイルを文字起こしプロバイダーまたは CLI に送信する場合も、`tools.media.audio.maxBytes` が適用されます。
- **ダウンロード失敗**：Slack が配信できないファイル、期限切れ URL、アクセス不能なファイル、サイズ上限を超えたファイル、Slack の認証／ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **視覚モデル**：画像分析では、視覚に対応している場合はアクティブな応答モデルを使用し、それ以外の場合は `agents.defaults.imageModel` に設定された画像モデルを使用します。

### 既知の制限

| シナリオ                                    | 現在の動作                                                                         | 回避策                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL               | ファイルはスキップされ、エラーは表示されない                                       | Slack でファイルを再アップロードする                                         |
| 音声文字起こしを利用できない                | クリップは添付されたままだが、文字起こしは生成されない                             | `tools.media.audio` を設定するか、対応するローカル文字起こし CLI をインストールする |
| キャプションのないクリップがメンションゲートを通過しない | 非公開の試行的文字起こし後に破棄され、文字起こしとダウンロードも破棄される         | 発話名のメンションパターンを設定する、入力したボットメンションを追加する、または DM を使用する |
| 視覚モデルが設定されていない                | 画像添付はメディア参照として保存されるが、画像として分析されない                   | `agents.defaults.imageModel` を設定するか、視覚対応の応答モデルを使用する    |
| 非常に大きな画像（デフォルトでは > 20 MB）  | サイズ上限に従ってスキップされる                                                   | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                          |
| 転送／共有された添付                        | テキストおよび Slack がホストする画像／ファイルメディアはベストエフォートで処理される | OpenClaw スレッド内で直接再共有する                                          |
| PDF 添付                                    | ファイル／メディアコンテキストとして保存され、画像視覚処理には自動ルーティングされない | ファイルメタデータには `download-file`、PDF 分析には `pdf` ツールを使用する      |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [PDF ツール](/ja-JP/tools/pdf)

## 関連項目

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    チャンネルおよびグループ DM の動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    設定の構成と優先順位。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    コマンドカタログと動作。
  </Card>
</CardGroup>
