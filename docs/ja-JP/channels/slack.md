---
read_when:
    - Slack のセットアップ、または Slack のソケット、HTTP、リレーモードのデバッグ
summary: Slack のセットアップと実行時の動作（Socket Mode、HTTP Request URLs、リレーモード）
title: Slack
x-i18n:
    generated_at: "2026-07-12T14:21:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
    source_path: channels/slack.md
    workflow: 16
---

Slack サポートは、Slack アプリ統合を介した DM とチャンネルに対応しています。デフォルトのトランスポートは Socket Mode です。HTTP Request URLs もサポートされています。リレーモードは、信頼できるルーターが Slack の受信を管理するマネージドデプロイ向けです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack の DM はデフォルトでペアリングモードを使用します。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順。
  </Card>
</CardGroup>

## トランスポートの選択

Socket Mode と HTTP Request URLs は、メッセージング、スラッシュコマンド、App Home、インタラクティブ機能において同等の機能を提供します。機能ではなく、デプロイ構成に基づいて選択してください。

| 検討事項                     | Socket Mode（デフォルト）                                                                                                                            | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不要                                                                                                                                                 | 必須（DNS、TLS、リバースプロキシまたはトンネル）                                                               |
| アウトバウンドネットワーク   | `wss-primary.slack.com` へのアウトバウンド WSS に到達できる必要があります                                                                            | アウトバウンド WS は不要。インバウンド HTTPS のみ                                                             |
| 必要なトークン               | Bot トークン + `connections:write` を持つ App-Level Token                                                                                            | Bot トークン + Signing Secret                                                                                  |
| 開発用ノート PC / ファイアウォール内 | そのまま動作します                                                                                                                            | 公開トンネル（ngrok、Cloudflare Tunnel、Tailscale Funnel）またはステージング Gateway が必要です                |
| 水平スケーリング             | ホスト上でアプリごとに 1 つの Socket Mode セッション。複数の Gateway には個別の Slack アプリが必要です                                               | ステートレスな POST ハンドラー。複数の Gateway レプリカがロードバランサーの背後で 1 つのアプリを共有できます |
| 1 つの Gateway での複数アカウント | サポートされています。各アカウントが独自の WS を開きます                                                                                       | サポートされています。登録の衝突を避けるため、各アカウントに一意の `webhookPath`（デフォルトは `/slack/events`）が必要です |
| スラッシュコマンドのトランスポート | WS 接続経由で配信され、`slash_commands[].url` は無視されます                                                                                    | Slack が `slash_commands[].url` に POST します。コマンドをディスパッチするにはこのフィールドが必要です         |
| リクエスト署名               | 使用しません（認証には App-Level Token を使用します）                                                                                               | Slack がすべてのリクエストに署名し、OpenClaw が `signingSecret` で検証します                                   |
| 接続切断時の復旧             | Slack SDK の自動再接続が有効です。OpenClaw も失敗した Socket Mode セッションを上限付きバックオフで再起動します。Pong タイムアウトのトランスポート調整が適用されます。 | 切断される永続接続はありません。再試行は Slack からのリクエストごとに行われます                                |

<Note>
  単一 Gateway ホスト、開発用ノート PC、およびアウトバウンドで `*.slack.com` に到達できる一方、インバウンド HTTPS を受け入れられないオンプレミスネットワークでは、**Socket Mode を選択してください**。

ロードバランサーの背後で複数の Gateway レプリカを実行する場合、アウトバウンド WSS がブロックされている一方でインバウンド HTTPS が許可されている場合、またはすでにリバースプロキシで Slack Webhook を終端している場合は、**HTTP Request URLs を選択してください**。
</Note>

<Warning>
  Slack は 1 つのアプリに対して複数の Socket Mode 接続を維持でき、各ペイロードをいずれかの接続に配信する場合があります。そのため、Slack アプリを共有する個別の OpenClaw Gateway には、同等のルーティングおよび認可設定が必要です。そうでない場合は、Gateway ごとに個別の Slack アプリ、単一のリレー受信口、またはロードバランサーの背後にある HTTP Request URLs を使用してください。[Socket Mode の使用](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)を参照してください。
</Warning>

### リレーモード

リレーモードは、Slack の受信処理を OpenClaw Gateway から分離します。信頼できるルーターが単一の Slack Socket Mode 接続を管理し、宛先 Gateway を選択して、認証済み WebSocket 経由で型付きイベントを転送します。Gateway は、アウトバウンドの Slack Web API 呼び出しに引き続き独自の Bot トークンを使用します。

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

リレー URL は、localhost を対象とする場合を除き、`wss://` を使用する必要があります。Bearer トークンとルーターのルートテーブルを Slack の認可境界の一部として扱ってください。ルーティングされたイベントは、認可済みのアクティベーションとして通常の Slack メッセージハンドラーに入ります。WebSocket の `hello` フレーム内でルーターから提供される `slack_identity` は、デフォルトのアウトバウンドユーザー名とアイコンを設定できます。ただし、呼び出し元が明示的に指定した ID が引き続き優先されます。リレー接続は Socket Mode と同じ上限付きバックオフタイミングで再接続し、切断時にはルーターから提供された ID を消去します。

### Enterprise Grid の組織全体へのインストール

1 つの Slack アカウントで、Enterprise Grid の組織全体へのインストールの対象となるすべてのワークスペースからメッセージを受信できます。直接の Socket Mode または HTTP Request URLs を選択してください。リレーモードは Enterprise アカウントではサポートされません。以下の最小権限マニフェストはいずれも、V1 の `message` および `app_mention` イベントパス、即時返信、リスナーが所有するステータスリアクションのみを有効にします。

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

Enterprise Grid Org Admin または Org Owner にアプリの承認を依頼し、組織レベルでインストールして、そのインストールの対象となるワークスペースを選択してください。OpenClaw を起動する前に、対象となるすべてのワークスペースでアプリを利用できることを確認してください。Socket Mode 用に `connections:write` を持つアプリレベルトークンを生成し、組織インストールから Bot トークンをコピーします。組織にインストールされた Bot トークンを使用するアカウントを設定します。

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

Gateway に公開 HTTPS エンドポイントがあり、Socket Mode 接続を開かない場合は HTTP モードを使用します。例の URL を Gateway の公開 `webhookPath` URL（デフォルトは `/slack/events`）に置き換えてください。

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

Enterprise Grid Org Admin または Org Owner にアプリの承認を依頼し、組織レベルでインストールして、そのインストールの対象となるワークスペースを選択してください。Slack が Request URL を検証した後、組織インストールの Bot トークンと、アプリの **Basic Information -> App Credentials -> Signing Secret** をコピーします。同じ Request URL パスを使用して Enterprise アカウントを設定します。

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

起動時に、OpenClaw は Slack の `auth.test` を使用して `enterpriseOrgInstall` を検証します。フラグのない組織インストール済みトークン、またはフラグ付きのワークスペーストークンでは、起動に失敗します。どのワークスペースがインストールを許可したかについては、Slack が引き続き信頼できる情報源です。OpenClaw はその後、配信された各イベントに設定済みのチャンネル、ユーザー、DM、メンションのポリシーを適用します。Enterprise V1 は、`allowBots` の設定にかかわらず、Bot が作成したすべての `message` および `app_mention` イベントをディスパッチ前に拒否します。これは、組織インストールではループ防止に使用できる、ワークスペースで修飾された安定した Bot ID が提供されないためです。

Enterprise サポートは意図的に、直接の Socket Mode または HTTP による `message` および `app_mention` イベントと、それらへの即時返信に限定されています。リレーモード、スラッシュコマンド、インタラクション、App Home、リアクションイベントリスナー、ピン、Slack アクションツール、Slack ネイティブ承認、バインディング、キューイングまたはスケジュールされた配信、プロアクティブ送信は、Enterprise アカウントでは利用できません。アウトバウンドの確認応答、入力中表示、ステータスリアクションは、リスナーが所有する Slack クライアントを介してサポートされ、`reactions:write` が必要です。インバウンドのリアクション通知とリアクションアクションツールは引き続き利用できません。

即時返信では、チャンク、メディア、メタデータ、ID のフォールバック、リンク展開、受信確認について、標準の Slack 配信動作を再利用しますが、検証済みのリスナー所有クライアントがアクティブなイベントターン内にある間に限られます。メモリ内の送信キューとスレッド参加レコードは、そのイベントのワークスペースごとに分割されます。クライアント自体がシリアライズまたは永続化されることはありません。

チャンネルポリシーのキーと`dm.groupChannels`のエントリには、未加工の安定したSlackチャンネルIDまたは
`channel:<id>`形式を使用する必要があります。OpenClawは、実行時の照合のためにどちらの形式も
未加工のチャンネルIDへ正規化します。`slack:`、`group:`、`mpim:`プレフィックスを使用すると起動に失敗します。
ユーザーポリシーのエントリには、安定したSlackユーザーIDを使用する必要があります。名前、スラッグ、表示名、
メールアドレスを使用すると起動に失敗します。IDには、Slackの正規の大文字プレフィックスと
本体を使用する必要があります（例: `C0123456789`または`U0123456789`）。小文字や
短い類似形式を使用すると起動に失敗します。Enterpriseアカウントでは
`dangerouslyAllowNameMatching`を有効にできません。Enterpriseアカウントではグローバルな
`mentionPatterns.mode`を設定できますが、`mentionPatterns.allowIn`と
`mentionPatterns.denyIn`を設定すると起動に失敗します。これは、単独のSlackチャンネルIDには
ワークスペースの修飾がなく、複数のワークスペースで再利用される可能性があるためです。ワークスペースへのインストールでは、
既存のスコープ付きメンションパターンの動作が維持されます。受け入れられた各ワークスペースには、
Slack IDが重複している場合でも、ルーティング、セッション、トランスクリプト、重複排除、履歴、キャッシュの各IDが
個別に割り当てられます。`message`ストリームでは、通常のユーザーメッセージと
ユーザーが投稿した`file_share`イベントがサポートされます。その他のメッセージサブタイプは、
認可またはシステムイベント処理の前に拒否されます。

EnterpriseのDMは、無効化する（`dm.enabled=false`または
`dmPolicy="disabled"`）か、`dmPolicy="open"`を指定して明示的に開放し、
有効なアカウントの`allowFrom`にリテラル値`"*"`を含める必要があります。空の
許可リスト、または`"*"`を含まないユーザー固有IDを指定すると起動に失敗します。SlackユーザーIDは
これらの認可ストア内でワークスペース修飾されないため、ペアリングと
ユーザーごとのDM許可リストは拒否されます。チャンネルメッセージには、
引き続きチャンネルポリシーと送信者ポリシーが適用されます。

## インストール

```bash
openclaw plugins install @openclaw/slack
```

`plugins install`はPluginを登録して有効化します。以下のSlackアプリとチャンネル設定を構成するまでは何も動作しません。Pluginの一般的なインストールルールについては、[Plugin](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

このセクションのマニフェストは、ワークスペーススコープのインストールを作成します。
Enterprise Gridの組織インストールには、代わりに専用の
[組織全体のマニフェストとワークフロー](#enterprise-grid-org-wide-installs)を使用してください。

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しいSlackアプリを作成する">
        [api.slack.com/apps](https://api.slack.com/apps/new)を開き、→ **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のいずれかのマニフェストを貼り付け → **Next** → **Create** の順に進みます。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw用Slackコネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClawはSlackのアシスタントスレッドをOpenClawエージェントに接続します。",
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
        "description": "OpenClawにメッセージを送信",
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
    "description": "OpenClaw用Slackコネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClawはSlackのアシスタントスレッドをOpenClawエージェントに接続します。",
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
        "description": "OpenClawにメッセージを送信",
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
          **Recommended**はSlack Pluginの全機能セットに対応します。App Home、スラッシュコマンド、ファイル、リアクション、ピン、グループDM、絵文字およびユーザーグループの読み取りが含まれます。ワークスペースポリシーによってスコープが制限されている場合は**Minimal**を選択してください。これはDM、チャンネルおよびグループの履歴、メンション、スラッシュコマンドに対応しますが、ファイル、リアクション、ピン、グループDM（`mpim:*`）、`emoji:read`、`usergroups:read`は含まれません。各スコープの理由と追加のスラッシュコマンドなどの追加オプションについては、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        Slackがアプリを作成した後:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write`を追加して保存し、App-Level Tokenをコピーします。
        - **Install App -> Install to Workspace**: Bot User OAuth Tokenをコピーします。

      </Step>

      <Step title="OpenClawを構成する">

        推奨されるSecretRef設定:

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
        [api.slack.com/apps](https://api.slack.com/apps/new)を開き、→ **Create New App** → **From a manifest** → ワークスペースを選択 → 以下のいずれかのマニフェストを貼り付け → `https://gateway-host.example.com/slack/events`を公開Gateway URLに置き換え → **Next** → **Create** の順に進みます。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw用Slackコネクター"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClawはSlackのアシスタントスレッドをOpenClawエージェントに接続します。",
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
        "description": "OpenClawにメッセージを送信",
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
    "description": "OpenClaw用Slackコネクタ"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClawはSlackのアシスタントスレッドをOpenClawエージェントに接続します。",
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
        "description": "OpenClawにメッセージを送信",
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
          **推奨**はSlack Pluginの全機能に対応しています。**最小構成**では、制限の厳しいワークスペース向けに、ファイル、リアクション、ピン、グループDM（`mpim:*`）、`emoji:read`、`usergroups:read`を除外します。各スコープの理由については、[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)を参照してください。
        </Note>

        <Info>
          3つのURLフィールド（`slash_commands[].url`、`event_subscriptions.request_url`、および`interactivity.request_url` / `message_menu_options_url`）は、すべて同じOpenClawエンドポイントを指します。Slackのマニフェストスキーマではそれぞれ別の名前で指定する必要がありますが、OpenClawはペイロードの種類に基づいてルーティングするため、単一の`webhookPath`（デフォルトは`/slack/events`）で十分です。`slash_commands[].url`がないスラッシュコマンドは、HTTPモードでは通知なしに何も実行しません。
        </Info>

        Slackがアプリを作成した後：

        - **Basic Information → App Credentials**：リクエスト検証用の**Signing Secret**をコピーします。
        - **Install App -> Install to Workspace**：Bot User OAuth Tokenをコピーします。

      </Step>

      <Step title="OpenClawを設定">

        推奨されるSecretRef設定：

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
        複数アカウントのHTTPでは一意のWebhookパスを使用する

        登録が競合しないように、各アカウントに異なる`webhookPath`（デフォルトは`/slack/events`）を指定してください。
        </Note>

      </Step>

      <Step title="Gatewayを起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Modeトランスポートのチューニング

OpenClaw は、Socket Mode における Slack SDK クライアントの pong タイムアウトをデフォルトで 15 秒に設定します。ワークスペースまたはホスト固有の調整が必要な場合にのみ、トランスポート設定を上書きしてください。

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

これは、Slack WebSocket の pong/server-ping タイムアウトがログに記録される Socket Mode ワークスペース、またはイベントループの枯渇が既知のホストでのみ使用してください。`clientPingTimeout` は SDK がクライアント ping を送信した後に pong を待機する時間で、`serverPingTimeout` は Slack サーバーからの ping を待機する時間です。アプリのメッセージとイベントは引き続きアプリケーション状態であり、トランスポートの稼働性シグナルではありません。

注:

- HTTP Request URL モードでは `socketMode` は無視されます。
- 基本の `channels.slack.socketMode` 設定は、上書きされない限りすべての Slack アカウントに適用されます。アカウントごとの上書きには `channels.slack.accounts.<accountId>.socketMode` を使用します。これはオブジェクトによる上書きであるため、そのアカウントに適用するすべてのソケット調整フィールドを含めてください。
- OpenClaw のデフォルト値（`15000`）があるのは `clientPingTimeout` のみです。`serverPingTimeout` と `pingPongLoggingEnabled` は、設定されている場合にのみ Slack SDK に渡されます。
- Socket Mode の再起動バックオフは約 2 秒から始まり、約 30 秒が上限です。回復可能な起動、起動待機、切断の失敗は、チャンネルが停止するまで再試行されます。無効な認証、取り消されたトークン、スコープ不足など、永続的なアカウントおよび認証情報のエラーは、無限に再試行せず即座に失敗します。

## マニフェストとスコープのチェックリスト

基本の Slack アプリマニフェストは、Socket Mode と HTTP Request URL で共通です。異なるのは `settings` ブロック（およびスラッシュコマンドの `url`）のみです。

基本マニフェスト（Socket Mode がデフォルト）:

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
      "assistant_description": "OpenClaw は Slack アシスタントスレッドを OpenClaw エージェントに接続します。",
      "suggested_prompts": [
        { "title": "何ができますか？", "message": "どのようなことを手伝えますか？" },
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

**HTTP Request URL モード**では、`settings` を HTTP バリアントに置き換え、各スラッシュコマンドに `url` を追加します。公開 URL が必要です。

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

上記のデフォルトを拡張する各種機能を表示します。

デフォルトのマニフェストでは、Slack App Home の **Home** タブが有効化され、`app_home_opened` がサブスクライブされます。ワークスペースのメンバーが Home タブを開くと、OpenClaw は `views.publish` を使用して安全なデフォルトの Home ビューを公開します。会話ペイロードや非公開設定は含まれません。単一スラッシュコマンドモードが有効な場合、コマンドのヒントには `channels.slack.slashCommand.name` が使用されます。ネイティブコマンドを使用するインストール、またはスラッシュコマンドを使用しないインストールでは、このヒントは省略されます。Slack DM 用の **Messages** タブは引き続き有効です。また、マニフェストでは `features.assistant_view`、`assistant:write`、`assistant_thread_started`、`assistant_thread_context_changed` を使用して Slack アシスタントスレッドも有効化されます。アシスタントスレッドは、それぞれ専用の OpenClaw スレッドセッションにルーティングされ、Slack から提供されたスレッドコンテキストをエージェントが引き続き利用できます。

<AccordionGroup>
  <Accordion title="オプションのネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を使用できますが、次の点に注意してください。

    - `/status` コマンドは予約されているため、`/status` ではなく `/agentstatus` を使用してください。
    - 1 つの Slack アプリに同時に登録できるスラッシュコマンドは最大 25 個です（Slack プラットフォームの制限）。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)のサブセットに置き換えてください。

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
      "usage_hint": "idle <duration|off> または max-age <duration|off>"
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
      "description": "実行のデフォルト設定を表示または設定",
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
      "description": "プロバイダーとモデルを一覧表示",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "短いヘルプ概要を表示"
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
      "description": "利用可能な場合はプロバイダーの使用量やクォータを含む、ランタイムの状態を表示"
    },
    {
      "command": "/tasks",
      "description": "現在のセッションのアクティブなタスクと最近のバックグラウンドタスクを一覧表示"
    },
    {
      "command": "/context",
      "description": "コンテキストがどのように構成されるかを説明",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "送信者としての自分の識別情報を表示"
    },
    {
      "command": "/skill",
      "description": "名前を指定してスキルを実行",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "セッションコンテキストを変更せずに補足的な質問をする",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "セッションコンテキストを変更せずに補足的な質問をする",
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
        上記のSocket Modeと同じ`slash_commands`リストを使用し、すべてのエントリに`"url": "https://gateway-host.example.com/slack/events"`を追加します。例:

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
      "description": "短いヘルプ概要を表示",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        リスト内のすべてのコマンドで、その`url`値を繰り返します。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="オプションの作成者スコープ（書き込み操作）">
    送信メッセージでデフォルトのSlackアプリの識別情報ではなく、アクティブなエージェントの識別情報（カスタムユーザー名とアイコン）を使用する場合は、`chat:write.customize`ボットスコープを追加します。

    絵文字アイコンを使用する場合、Slackでは`:emoji_name:`構文が必要です。

  </Accordion>
  <Accordion title="オプションのユーザートークンスコープ（読み取り操作）">
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
- リレーモードには`botToken`に加えて`relay.url`、`relay.authToken`、`relay.gatewayId`が必要です。アプリトークンや署名シークレットは使用しません。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken`、`userToken`にはプレーンテキスト
  文字列またはSecretRefオブジェクトを指定できます。
- 設定内のトークンは、環境変数のフォールバックより優先されます。
- 環境変数のフォールバック`SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN`、`SLACK_USER_TOKEN`は、それぞれデフォルトアカウントにのみ適用されます。
- `userToken`のデフォルトは読み取り専用の動作です（`userTokenReadOnly: true`）。

ステータススナップショットの動作:

- Slackアカウントの検査では、認証情報ごとに`*Source`フィールドと`*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは`available`、`configured_unavailable`、`missing`のいずれかです。
- `configured_unavailable`は、SecretRef
  または別の非インラインシークレットソースを介してアカウントが設定されているものの、現在のコマンドまたはランタイムの経路では
  実際の値を解決できなかったことを意味します。
- HTTPモードでは`signingSecretStatus`が含まれます。Socket Modeでは、
  必須の組み合わせは`botTokenStatus` + `appTokenStatus`です。

<Tip>
アクションやディレクトリの読み取りでは、設定されている場合にユーザートークンを優先できます。書き込みでは引き続きボットトークンが優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false`であり、かつボットトークンを利用できない場合にのみ許可されます。
</Tip>

## アクションとゲート

Slackアクションは`channels.slack.actions.*`によって制御されます。

現在のSlackツールで利用可能なアクショングループ:

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
    `channels.slack.dmPolicy`はDMアクセスを制御します。`channels.slack.allowFrom`は標準のDM許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom`に`"*"`を含める必要があります）
    - `disabled`

    DMフラグ:

    - `dm.enabled`（デフォルトはtrue）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループDMのデフォルトはfalse）
    - `dm.groupChannels`（オプションのMPIM許可リスト）

    複数アカウントでの優先順位:

    - `channels.slack.accounts.default.allowFrom`は`default`アカウントにのみ適用されます。
    - 名前付きアカウントは、独自の`allowFrom`が未設定の場合、`channels.slack.allowFrom`を継承します。
    - 名前付きアカウントは`channels.slack.accounts.default.allowFrom`を継承しません。

    レガシーの`channels.slack.dm.policy`と`channels.slack.dm.allowFrom`も互換性のため引き続き読み取られます。`openclaw doctor --fix`は、アクセスを変更せずに実行できる場合、それらを`dmPolicy`と`allowFrom`に移行します。

    DMでのペアリングには`openclaw pairing approve slack <code>`を使用します。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy`はチャンネルの処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル許可リストは`channels.slack.channels`の下に配置し、設定キーには**安定したSlackチャンネルID**（例: `C12345678`）を使用する必要があります。

    ランタイムに関する注意: `channels.slack`が完全に存在しない場合（環境変数のみのセットアップ）、ランタイムは`groupPolicy="allowlist"`にフォールバックし、警告を記録します（`channels.defaults.groupPolicy`が設定されている場合でも同様です）。

    名前/IDの解決:

    - チャンネル許可リストとDM許可リストのエントリは、トークンアクセスで可能な場合、起動時に解決されます
    - 解決できないチャンネル名のエントリは設定どおりに保持されますが、デフォルトではルーティング時に無視されます
    - 受信時の認可とチャンネルルーティングは、デフォルトではID優先です。ユーザー名やスラッグを直接照合するには`channels.slack.dangerouslyAllowNameMatching: true`が必要です

    <Warning>
    名前ベースのキー（`#channel-name`または`channel-name`）は、`groupPolicy: "allowlist"`では照合され**ません**。チャンネル検索はデフォルトでID優先であるため、名前ベースのキーではルーティングが成功することはなく、そのチャンネル内のすべてのメッセージが通知なくブロックされます。これは`groupPolicy: "open"`とは異なります。この場合、ルーティングにチャンネルキーは必要ないため、名前ベースのキーでも機能しているように見えます。

    キーには常にSlackチャンネルIDを使用してください。確認するには、Slackでチャンネルを右クリック → **Copy link** — URLの末尾にID（`C...`）が表示されます。

    正しい例:

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

    誤った例（`groupPolicy: "allowlist"`では通知なくブロックされます）:

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
    チャンネルメッセージでは、デフォルトでメンションが必須です。

    メンション元:

    - 明示的なアプリメンション（`<@botId>`）
    - ボットユーザーがそのユーザーグループのメンバーである場合のSlackユーザーグループメンション（`<!subteam^S...>`）。`usergroups:read`が必要です
    - メンションの正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - ボットへの暗黙的な返信スレッド動作（`thread.requireExplicitMention`が`true`の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時の解決または`dangerouslyAllowNameMatching`を介する場合のみ）:

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`。このチャンネルのアカウント/チャット種別の返信モードを上書きします）
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender`のキー形式: `channel:`、`id:`、`e164:`、`username:`、`name:`、またはワイルドカード`"*"`
      （レガシーのプレフィックスなしキーは、引き続き`id:`のみにマッピングされます）

    `ignoreOtherMentions`（デフォルトは`false`）は、別のユーザーまたはユーザーグループをメンションしているが、このボットをメンションしていないチャンネルメッセージを破棄します。DMとグループDM（MPIM）には影響しません。このフィルターには、`auth.test`から解決されたボットユーザーIDが必要です。その識別情報を利用できない場合（たとえばユーザートークンのみの識別情報）、ゲートはフェイルオープンとなり、メッセージは変更されずに通過します。

    `allowBots`は、チャンネルとプライベートチャンネルに対して保守的に動作します。ボットが送信したルームメッセージは、送信元ボットがそのルームの`users`許可リストに明示的に記載されている場合、または`channels.slack.allowFrom`の明示的なSlack所有者IDのうち少なくとも1つが現在そのルームのメンバーである場合にのみ受け入れられます。ワイルドカードや表示名による所有者エントリは、所有者の在室条件を満たしません。所有者の在室確認にはSlackの`conversations.members`を使用します。アプリにルーム種別に対応する読み取りスコープ（公開チャンネルでは`channels:read`、プライベートチャンネルでは`groups:read`）があることを確認してください。メンバー検索に失敗した場合、OpenClawはボットが送信したルームメッセージを破棄します。

    受け入れられたボット作成の Slack メッセージには、共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)が適用されます。デフォルトの上限は `channels.defaults.botLoopProtection` で設定し、ワークスペースまたはチャンネルに異なる上限が必要な場合は、`channels.slack.botLoopProtection` または `channels.slack.channels.<id>.botLoopProtection` で上書きします。

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct`、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- Slack のルートバインディングでは、生のピア ID に加え、`channel:C12345678`、`user:U12345678`、`<@U12345678>` などの Slack ターゲット形式を使用できます。
- デフォルトの `session.dmScope=main` では、Slack の DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- `replyToMode` が `off` 以外でも、通常のトップレベルのチャンネルメッセージはチャンネルごとのセッションに留まります。
- Slack のスレッド返信では、`replyToMode="off"` により送信返信のスレッド化が無効な場合でも、親 Slack の `thread_ts` がセッションのサフィックス（`:thread:<threadTs>`）に使用されます。
- 対象となるトップレベルのチャンネルルートが表示可能な Slack スレッドを開始すると予想される場合、OpenClaw はそのルートを `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` にシードし、ルートと以降のスレッド返信で同じ OpenClaw セッションを共有します。これは、`app_mention` イベント、明示的なボットメンションまたは設定済みメンションパターンへの一致、および `replyToMode` が `off` 以外で `requireMention: false` のチャンネルに適用されます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッションの開始時に取得する既存のスレッドメッセージ数を制御します（デフォルトは `20`。無効にするには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルトは `false`）: `true` の場合、暗黙的なスレッドメンションを抑制し、ボットがすでにスレッドに参加していても、スレッド内で明示的に `@bot` がメンションされた場合にのみ応答します。これを設定しない場合、ボットが参加しているスレッド内の返信は `requireMention` のゲートを迂回します。

返信のスレッド化の制御:

- `channels.slack.channels.<id>.replyToMode`: Slack のチャンネル／プライベートチャンネルメッセージに対するチャンネル別の上書き
- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルトは `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごとの設定
- ダイレクトチャット用のレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` ツールから明示的に Slack スレッドへ返信する場合は、`action: "send"` と `threadId` または `replyTo` に加えて `replyBroadcast: true` を設定すると、Slack にスレッド返信を親チャンネルにもブロードキャストするよう要求できます。これは Slack の `chat.postMessage` の `reply_broadcast` フラグに対応し、テキストまたは Block Kit の送信でのみサポートされ、メディアアップロードではサポートされません。

`message` ツール呼び出しが Slack スレッド内で実行され、同じチャンネルを対象とする場合、OpenClaw は通常、有効なアカウント、チャット種別、またはチャンネル別の `replyToMode` に従って現在の Slack スレッドを継承します。自動返信、および同じチャンネルへの `send` または `upload-file` 呼び出しには、同じチャンネル別の上書きが使用されます。代わりに新しい親チャンネルメッセージを強制するには、`action: "send"` または `action: "upload-file"` に `topLevel: true` を設定します。`threadId: null` も、同じトップレベルへのオプトアウトとして受け入れられます。

<Note>
`replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む、Slack への送信返信のスレッド化を無効にします。受信した Slack スレッドのセッションはフラット化されません。Slack スレッド内にすでに投稿されたメッセージは、引き続き `:thread:<threadTs>` セッションにルーティングされます。これは、`"off"` モードでも明示的なタグが引き続き尊重される Telegram とは異なります。Slack スレッドではメッセージがチャンネルから非表示になりますが、Telegram の返信はインラインで表示されたままです。
</Note>

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。`ackReactionScope` は、その絵文字を実際に送信する_タイミング_を決定します。

デフォルトでは、Slack ネイティブのアシスタントスレッドステータスがローテーションする読み込みメッセージで進行状況を表示する間、確認リアクションは静的なままです。キュー待機／思考中／ツール／完了／エラーのリアクションライフサイクルを有効にするには、`messages.statusReactions.enabled: true` を設定します。

### 絵文字（`ackReaction`）

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ `"eyes"` / 👀）

注:

- Slack ではショートコード（例: `"eyes"`）が必要です。
- Slack アカウントまたは全体でリアクションを無効にするには、`""` を使用します。

### スコープ（`messages.ackReactionScope`）

Slack プロバイダーは `messages.ackReactionScope`（デフォルトは `"group-mentions"`）からスコープを読み取ります。現在、Slack アカウント単位または Slack チャンネル単位の上書きはありません。この値は Gateway 全体でグローバルです。

値:

- `"all"`: 周辺的なルームイベントを含め、DM とグループでリアクションします。
- `"direct"`: DM でのみリアクションします。
- `"group-all"`: 周辺的なルームイベントを除く、すべてのグループメッセージでリアクションします（DM は除外）。
- `"group-mentions"`（デフォルト）: グループで、ボットがメンションされた場合（またはオプトインしたグループ内のメンション可能な対象の場合）にのみリアクションします。**DM は除外されます。**
- `"off"` / `"none"`: リアクションしません。

<Note>
デフォルトのスコープ（`"group-mentions"`）では、ダイレクトメッセージや周辺的なルームイベントで確認リアクションは実行されません。受信した Slack DM や静かなルームイベントで、設定済みの `ackReaction`（例: `"eyes"`）を表示するには、`messages.ackReactionScope` を `"all"` に設定します。`messages.ackReactionScope` は Slack プロバイダーの起動時に読み取られるため、変更を反映するには Gateway の再起動が必要です。
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
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中は進行状況テキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューが有効な場合、ツール／進行状況の更新を、編集対象となっている同じプレビューメッセージにルーティングします（デフォルト: `true`）。ツール／進行状況メッセージを個別に保つには `false` を設定します。
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

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` の場合に Slack ネイティブのテキストストリーミングを制御します（デフォルト: `true`）。

Slack ネイティブの進行状況タスクカードは、進行状況モードでオプトインできます。`channels.slack.streaming.mode="progress"` とともに `channels.slack.streaming.progress.nativeTaskCards` を `true` に設定すると、処理中に Slack ネイティブの計画／タスクカードを送信し、完了時に同じタスクカードを更新します。このフラグがない場合、進行状況モードでは移植可能なドラフトプレビューの動作が維持されます。

- ネイティブテキストストリーミングと Slack アシスタントのスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッドの選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合や返信スレッドが存在しない場合でも、チャンネル、グループチャット、およびトップレベルの DM ルートでは通常のドラフトプレビューを使用できます。
- トップレベルの Slack DM はデフォルトでスレッド外に留まるため、Slack のスレッド形式のネイティブストリーム／ステータスプレビューは表示されません。代わりに OpenClaw が DM 内にドラフトプレビューを投稿して編集します。
- メディアとテキスト以外のペイロードは、通常の配信にフォールバックします。
- メディア／エラーの最終結果は保留中のプレビュー編集をキャンセルします。対象となるテキスト／ブロックの最終結果は、プレビューをその場で編集できる場合にのみ反映されます。
- 返信の途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードを通常の配信にフォールバックします。

Slack ネイティブのテキストストリーミングの代わりにドラフトプレビューを使用する:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は、`channels.slack.streaming.mode` のレガシーエイリアスです。
- ブール値の `channels.slack.streaming` は、`channels.slack.streaming.mode` および `channels.slack.streaming.nativeTransport` のレガシーエイリアスです。
- トップレベルの `channels.slack.chunkMode` および `channels.slack.nativeStreaming` は、`channels.slack.streaming.chunkMode` および `channels.slack.streaming.nativeTransport` のレガシーエイリアスです。
- レガシーエイリアスは実行時には読み取られません。永続化された Slack ストリーミング設定を正規キーに書き換えるには、`openclaw doctor --fix` を実行します。

## 入力中リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行が終了すると削除します。これは、デフォルトの「is typing...」ステータスインジケーターを使用するスレッド返信以外で特に役立ちます。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注:

- Slack ではショートコード（例: `"hourglass_flowing_sand"`）が必要です。
- リアクションはベストエフォートで行われ、返信または失敗パスの完了後に自動的にクリーンアップが試行されます。

## 音声入力

現在 Slack で OpenClaw に話しかけるには、Slack の音声クリップを OpenClaw アプリに送信します。Slackbot のディクテーション用マイクは Slack が所有する別機能であり、アプリ API ではありません。

- **[Slackbot 音声ディクテーション](https://slack.com/help/articles/202026038-How-to-use-Slackbot)**は、ユーザーの非公開 Slackbot 会話内にあります。Slack は録音を Slackbot のプロンプトに変換しますが、Events API を通じてサードパーティーの Slack アプリに音声ファイル、ディクテーションイベント、プロンプト、入力ソースマーカーを送信することはありません。OpenClaw Slack Plugin でこれを有効化または受信することはできません。
- **[Slack 音声クリップ](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)**は、OpenClaw の DM、チャンネル、またはスレッドに投稿できる、Slack に保存されたファイルです。OpenClaw はアクセス可能なクリップをボットトークンでダウンロードし、Slack のクリップ MIME メタデータを正規化して、共有の[音声文字起こしパイプライン](/ja-JP/nodes/audio)に送信します。推奨されるアプリマニフェストには、必要な `files:read` スコープが含まれています。

音声クリップと Slackbot のディクテーションでは、プライバシー上の意味合いが異なります。クリップには Slack のファイル保持ポリシーが適用され、OpenClaw が文字起こしのためにダウンロードします。一方、Slack によると、ディクテーション音声は保存されません。

`requireMention: true` のチャンネルでは、キャプションのない音声クリップでも、設定済みのメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバック先は `messages.groupChat.mentionPatterns`）を発話することでゲートを満たせます。OpenClaw はクリップをダウンロードまたは文字起こしする前に送信者を認可し、その後、文字起こしが一致した場合にのみ受け入れます。失敗した、または一致しない投機的な文字起こしは、ダウンロードしたクリップとともに破棄され、チャンネル履歴には保持されません。Slack ネイティブの `@bot` ID は音声から推測できないため、発話名のパターンを設定するか、入力したメンションを含めてください。文字起こしのエコーが有効な場合、エコーは受け入れ後にのみ送信されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストする非公開 URL（トークン認証されたリクエストフロー）からダウンロードされ、取得に成功し、サイズ制限内であればメディアストアに書き込まれます。ファイルプレースホルダーには Slack の `fileId` が含まれるため、エージェントは `download-file` を使用して元のファイルを取得できます。

    ダウンロードには、制限付きのアイドルタイムアウトと合計タイムアウトが使用されます。Slack のファイル取得が停止または失敗した場合でも、OpenClaw はメッセージの処理を継続し、ファイルプレースホルダーにフォールバックします。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きされない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクには `channels.slack.textChunkLimit` を使用します（デフォルトは `8000`、Slack 自体のメッセージ長制限が上限）
    - `channels.slack.streaming.chunkMode="newline"` で段落優先の分割を有効にします
    - ファイル送信には Slack アップロード API を使用し、スレッド返信（`thread_ts`）を含めることができます
    - 長いファイルキャプションでは、Slack で安全に扱える最初のテキストチャンクをアップロードコメントとして使用し、残りのチャンクを後続メッセージとして送信します
    - 送信メディアの上限は、設定されている場合は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信ではメディアパイプラインの MIME 種別ごとのデフォルト値を使用します

  </Accordion>

  <Accordion title="配信先">
    推奨される明示的な送信先：

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    テキストまたはブロックのみの Slack DM はユーザー ID に直接投稿できます。ファイルのアップロードとスレッド送信では具体的な会話 ID が必要なため、まず Slack の会話 API を介して DM を開きます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、単一の設定済みコマンドまたは複数のネイティブコマンドとして Slack に表示されます。コマンドのデフォルトを変更するには、`channels.slack.slashCommand` を設定します：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要です。代わりに、`channels.slack.commands.native: true`、またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは**オフ**であるため、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、優先順位に従って次のいずれかとして表示されます：

- 十分に短い選択肢が 3～5 個：オーバーフロー（「...」）メニュー
- 選択肢が 100 個を超え、非同期の選択肢フィルタリングが利用可能：外部選択
- 選択肢が 1～2 個、またはエンコードされた値が選択メニューには長すぎる選択肢がある場合：ボタンブロック
- それ以外（選択肢が 6～100 個、または非同期フィルタリングなしで 100 個を超える場合）：静的選択メニュー（メニューごとに 100 個の選択肢に分割）

```txt
/think
```

スラッシュセッションでは `agent:<agentId>:slack:slash:<userId>` のような分離されたキーを使用し、コマンド実行は引き続き `CommandTargetSessionKey` を使用して対象の会話セッションにルーティングされます。

## ネイティブチャート

Slack の公開 [`data_visualization` Block Kit ブロック](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
は、メッセージ内に折れ線、棒、面、円グラフを表示します。OpenClaw は移植可能な
`presentation` の `chart` ブロックをそのネイティブ形式にマッピングします。通常の
`chat:write` メッセージアクセス権以外に、追加の OAuth スコープ、
ファイルアップロード、画像レンダラー、Slack 設定は必要ありません。

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "四半期収益",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "収益", "values": [120, 145] }],
      "xLabel": "四半期"
    }
  ]
}
```

ネイティブ表示の前に Slack の制限が適用されます：

- タイトルと任意の軸ラベル：50 文字
- 円グラフ：1～12 個の正のセグメント
- 折れ線／棒／面グラフ：一意の名前を持つ系列が 1～12 個、共有カテゴリが 1～20 個
- セグメント、カテゴリ、系列のラベル：20 文字
- 各系列には、すべてのカテゴリに対応する有限値を 1 つずつ含める必要があります。円グラフ以外の値は
  負でもかまいません

すべてのネイティブチャートには、スクリーンリーダー、通知、セッションミラーリング、および
ブロックを表示できないクライアント向けに、トップレベルのテキスト表現も含まれます。ほかの OpenClaw
チャンネルへの標準的なプレゼンテーション送信では、ネイティブチャート対応を通知していない限り、同じ
決定論的なチャートデータをテキストとして受信します。段階的なロールアウト中に Slack が
`invalid_blocks` でチャートを拒否した場合、OpenClaw は拒否されたネイティブデータブロックを
削除し、同階層のコントロールを維持したまま、完全なチャート表現を可視テキストとして送信します。

Slack は現在、メッセージごとに最大 2 個の `data_visualization` ブロックを受け付けます。
プレゼンテーションに有効なチャートが 2 個を超えて含まれる場合、OpenClaw はその順序を維持し、
各メッセージに含めるチャートを 2 個以下にして、後続メッセージでネイティブ表示を継続します。

Slack の[開発者向けリリース情報](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
では、このブロックをアプリ向けの Block Kit 機能として説明しており、有料
プランの制限は公開されていません。Business+/Enterprise の利用条件に関する記述は、
Slackbot による自動 AI チャート生成に適用されるものであり、構造化済みの Block Kit チャートをアプリが
送信する場合とは別です。チャートはメッセージ専用ブロックであり、App
Home、モーダル、Canvas のコンテンツではありません。

## ネイティブテーブル

Slack の現在の [`data_table` Block Kit ブロック](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
は、メッセージ内に構造化された行と列をレンダリングします。OpenClaw は、明示的な
ポータブル `presentation` `table` ブロックを `data_table` にマッピングします。Slack の
レガシー [`table` ブロック](https://docs.slack.dev/reference/block-kit/blocks/table-block/) は使用しません。
通常の `chat:write` メッセージアクセス以外に、追加の OAuth スコープや Slack の設定は
必要ありません。

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "オープンパイプライン",
      "headers": ["アカウント", "ステージ", "ARR"],
      "rows": [
        ["Acme", "成約", 125000],
        ["Globex", "レビュー", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw は、ヘッダーセルと文字列セルを Slack の `raw_text` セルにマッピングします。数値セルは
`raw_number` にマッピングされ、ネイティブの並べ替えとフィルタリングのために有限の数値が
維持されます。`rowHeaderColumnIndex` が指定されている場合、そのゼロ始まりの
列を Slack の行ヘッダーとしてマークします。

ネイティブレンダリングの前に、Slack が公開している `data_table` の制限が適用されます。

- 1～20 列
- 1～100 データ行、およびヘッダー行
- すべての行で同じセル数
- 1 件のメッセージ内のすべてのテーブルセルを合計して最大 10,000 文字

メッセージが合計文字数の制限内に収まる限り、複数の有効なテーブルブロックを
ネイティブにレンダリングできます。ネイティブの制約内でレンダリングできないテーブルは、
行やセルを失う代わりに、完全かつ決定論的なテキストになります。そのテキストが Slack の
1 件のメッセージを超える場合、送信とスラッシュ応答では順序付きのテキストチャンクを使用します。
テーブルの編集では、既存メッセージの行を暗黙に切り捨てる代わりに、
明示的なサイズエラーが発生します。

ポータブルプレゼンテーションから生成されるすべてのネイティブテーブルには、スクリーンリーダー、
通知、セッションミラーリング、およびブロックをレンダリングできないクライアント向けに、
トップレベルのテキスト表現も含まれます。フォールバックではチャートとテーブルの生の値が
リテラルのまま維持されるため、`<@U123>` のようなセルデータが Slack メンションになることはありません。
Slack がネイティブのチャートまたはテーブルブロックを `invalid_blocks` で拒否した場合、OpenClaw は
1 回の制限された復旧ステップですべてのネイティブデータブロックを削除し、ボタンや選択メニューなどの
有効な兄弟ブロックを保持したうえで、Slack の書式設定を無効にして完全に表示可能なチャートと
テーブルのテキストを送信します。スラッシュコマンドの配信では、コマンド全体を通じて Slack の
5 回の `response_url` 呼び出し予算を追跡します。各応答バッチの前に、
残りの呼び出し回数に収まる完全なプランを選択するか、そのバッチを投稿する前に失敗します。

明示的な `presentation` テーブルブロックのみがネイティブテーブルに昇格されます。
Markdown のパイプテーブルは記述されたテキストのままです。OpenClaw はテーブル構造や
セル型を推測しません。既存の信頼された Slack ネイティブプロデューサーは、引き続き
`channelData.slack.blocks` を介して生のブロックを渡せます。OpenClaw は有効な生の
`data_table` セルからフォールバックテキストを生成しますが、不正なカスタムブロックは
キャプションまたは一般的な Block Kit フォールバックに縮退する場合があります。ポータブルな
エージェント、CLI、および Plugin の出力では `presentation` を使用してください。

## インタラクティブ応答

Slack はエージェントが作成したインタラクティブな応答コントロールをレンダリングできますが、この機能はデフォルトで無効です。
新しいエージェント、CLI、および Plugin の出力では、共有の
`presentation` ボタンまたは選択ブロックを優先してください。これらは同じ Slack インタラクション
経路を使用しながら、他のチャネルでも縮退できます。

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

または、1 つの Slack アカウントに対してのみ有効化します。

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

有効にすると、エージェントは引き続き非推奨の Slack 専用応答ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックまたは選択を
既存の Slack インタラクションイベント経路に戻します。古いプロンプトや
Slack 固有のエスケープハッチ向けに維持してください。新しいポータブルコントロールには
共有プレゼンテーションを使用してください。

ディレクティブコンパイラ API も、新しいプロデューサーコードでは非推奨です。

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新しい Slack レンダリングコントロールには、`presentation` ペイロードと
`buildSlackPresentationBlocks(...)` を使用してください。

注意事項:

- これは Slack 固有のレガシー UI です。他のチャネルでは Slack Block
  Kit ディレクティブを各チャネル独自のボタンシステムに変換しません。
- インタラクティブコールバックの値は、エージェントが作成した生の値ではなく、OpenClaw が生成した不透明なトークンです。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効なブロックペイロードを送信する代わりに、元のテキスト応答へフォールバックします。

### Plugin が所有するモーダル送信

インタラクティブハンドラーを登録する Slack Plugin は、OpenClaw がペイロードを
エージェントに表示されるシステムイベント用に圧縮する前に、モーダルの
`view_submission` および `view_closed` ライフサイクルイベントも受信できます。
Slack モーダルを開く際は、次のいずれかのルーティングパターンを使用してください。

- `callback_id` を `openclaw:<namespace>:<payload>` に設定します。
- または、既存の `callback_id` を維持し、モーダルの `private_metadata` に `pluginInteractiveData:
"<namespace>:<payload>"` を配置します。

ハンドラーは、`view_submission` または `view_closed` としての
`ctx.interaction.kind`、正規化された `inputs`、および Slack からの完全な生の
`stateValues` オブジェクトを受け取ります。コールバック ID のみによるルーティングで
Plugin ハンドラーを呼び出すには十分です。モーダルからエージェントに表示されるシステムイベントも
生成する必要がある場合は、既存のモーダルの `private_metadata` にあるユーザー／セッションの
ルーティングフィールドを含めてください。エージェントは、圧縮され秘匿化された
`Slack interaction: ...` システムイベントを受け取ります。ハンドラーが
`systemEvent.summary`、`systemEvent.reference`、または `systemEvent.data` を返した場合、
それらのフィールドは圧縮イベントに含まれるため、エージェントは完全なフォームペイロードを
見ることなく、Plugin が所有するストレージを参照できます。

## Slack でのネイティブ承認

Slack は、Web UI やターミナルにフォールバックする代わりに、インタラクティブなボタンとインタラクションを備えたネイティブ承認クライアントとして機能できます。

- Exec と Plugin の承認は、Slack ネイティブの Block Kit プロンプトとしてレンダリングできます。
- `channels.slack.execApprovals.*` は、引き続きネイティブ Exec 承認クライアントの有効化および DM／チャネルルーティング設定です。
- Exec 承認 DM では、`channels.slack.execApprovals.approvers` または `commands.ownerAllowFrom` を使用します。
- Plugin 承認では、発信元セッションのネイティブ承認クライアントとして Slack が有効な場合、または `approvals.plugin` が発信元の Slack セッションか Slack ターゲットにルーティングされている場合に、Slack ネイティブボタンを使用します。
- Plugin 承認 DM では、`channels.slack.allowFrom`、名前付きアカウントの `allowFrom`、またはアカウントのデフォルトルートにある Slack Plugin 承認者を使用します。
- 承認者の認可は引き続き適用されます。Exec 専用の承認者は、Plugin 承認者でもない限り、Plugin リクエストを承認できません。

これは、他のチャンネルと同じ共有承認ボタンのサーフェスを使用します。Slack アプリ設定で `interactivity` が有効になっている場合、承認プロンプトは会話内に直接 Block Kit ボタンとして表示されます。
これらのボタンが表示されている場合、それが主要な承認 UX です。OpenClaw が手動の `/approve` コマンドを含めるのは、ツール結果でチャット承認が利用できないと示された場合、または手動承認が唯一の手段である場合に限られます。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（省略可。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`、`sessionFilter`

`enabled` が未設定または `"auto"` で、少なくとも 1 人の実行承認者を解決できる場合、Slack はネイティブ実行承認を自動的に有効にします。Slack Plugin の承認者を解決でき、リクエストがネイティブクライアントのフィルターに一致する場合、Slack はこのネイティブクライアントパスを通じてネイティブ Plugin 承認も処理できます。Slack をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。承認者を解決できる場合にネイティブ承認を強制的に有効にするには、`enabled: true` を設定します。Slack の実行承認を無効にしても、`approvals.plugin` を通じて有効化されたネイティブ Slack Plugin 承認の配信は無効になりません。Plugin 承認の配信には、代わりに Slack Plugin の承認者が使用されます。

Slack 実行承認を明示的に設定していない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ設定が必要なのは、承認者の上書き、フィルターの追加、または発信元チャットへの配信の有効化を行う場合のみです:

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

共有の `approvals.exec` 転送は別機能です。実行承認プロンプトを他のチャットまたは明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別機能です。Slack が Plugin 承認リクエストをネイティブに処理できる場合に限り、Slack のネイティブ配信によってそのフォールバックが抑制されます。

同一チャットでの `/approve` は、コマンドをすでにサポートしている Slack チャンネルと DM でも機能します。承認転送モデル全体については、[実行承認](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用時の動作

- メッセージの編集と削除はシステムイベントにマッピングされます。
- スレッドのブロードキャスト（「Also send to channel」を使用したスレッド返信）は、通常のユーザーメッセージとして処理されます。
- リアクションの追加と削除イベントはシステムイベントにマッピングされます。
- メンバーの参加と退出、チャンネルの作成と名前変更、ピンの追加と削除イベントはシステムイベントにマッピングされます。
- `configWrites` が有効な場合、`channel_id_changed` によってチャンネル設定キーを移行できます。
- チャンネルのトピックと目的のメタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入される可能性があります。
- スレッド開始メッセージと初期スレッド履歴のコンテキストシードは、該当する場合、設定済みの送信者許可リストによってフィルタリングされます。
- ブロックアクション、ショートカット、モーダル操作は、豊富なペイロードフィールドを含む構造化された `Slack interaction: ...` システムイベントを発行します:
  - ブロックアクション: 選択された値、ラベル、ピッカー値、`workflow_*` メタデータ
  - グローバルショートカット: コールバックとアクターのメタデータ。アクターのダイレクトセッションにルーティング
  - メッセージショートカット: コールバック、アクター、チャンネル、スレッド、選択されたメッセージのコンテキスト
  - ルーティングされたチャンネルメタデータとフォーム入力を含むモーダルの `view_submission` および `view_closed` イベント

Slack アプリ設定でグローバルショートカットまたはメッセージショートカットを定義し、空でない任意のコールバック ID を使用します。OpenClaw は一致するショートカットペイロードを確認応答し、他の Slack 操作と同じ DM/チャンネル送信者ポリシーを適用して、サニタイズ済みイベントをルーティング先のエージェントセッションにキューイングします。トリガー ID とレスポンス URL はエージェントコンテキストから秘匿化されます。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Slack](/ja-JP/gateway/config-channels#slack)。

<Accordion title="重要度の高い Slack フィールド">

- モード/認証: `mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- DM アクセス: `dm.enabled`、`dmPolicy`、`allowFrom`（レガシー: `dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 互換性トグル: `dangerouslyAllowNameMatching`（緊急時用。必要な場合を除き無効のままにしてください）
- チャンネルアクセス: `groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- スレッド/履歴: `replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展開プレビュー: `chat.postMessage` のリンク/メディアプレビューを制御する `unfurlLinks`（デフォルト: `false`）と `unfurlMedia`。リンクプレビューを再び有効にするには `unfurlLinks: true` を設定
- 運用/機能: `configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順序で確認してください:

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`）— **キーは名前（`#channel-name`）ではなく、チャンネル ID（`C12345678`）でなければなりません**。チャンネルルーティングはデフォルトで ID 優先であるため、名前ベースのキーは `groupPolicy: "allowlist"` では通知なく失敗します。ID を確認するには、Slack でチャンネルを右クリック → **Copy link** — URL 末尾の `C...` の値がチャンネル ID です。
    - `requireMention`
    - チャンネルごとの `users` 許可リスト
    - `messages.groupChat.visibleReplies`: 通常のグループ/チャンネルリクエストのデフォルトは `"automatic"` です。`"message_tool"` を有効にしていて、ログにアシスタントのテキストが表示されているにもかかわらず `message(action=send)` 呼び出しがない場合、モデルが表示メッセージツールのパスを使用しませんでした。このモードでは最終テキストは非公開のままです。抑制されたペイロードのメタデータを Gateway の詳細ログで確認するか、通常のアシスタントの最終返信をすべてレガシーパス経由で投稿する場合は `"automatic"` に設定してください。
    - `messages.groupChat.unmentionedInbound`: `"room_event"` の場合、メンションのない許可済みチャンネル内の会話は周辺コンテキストとして扱われ、エージェントが `message` ツールを呼び出さない限り応答しません。[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

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
    次を確認してください:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認/許可リストのエントリ（`dmPolicy: "open"` でも `channels.slack.allowFrom: ["*"]` が必要です）
    - グループ DM は MPIM 処理を使用します。`channels.slack.dm.groupEnabled` を有効にし、`channels.slack.dm.groupChannels` が設定されている場合は MPIM を含めてください
    - Slack Assistant の DM イベント: `drop message_changed` に言及する詳細ログは通常、Slack がメッセージメタデータから復元可能な人間の送信者を含まない、編集済みの Assistant スレッドイベントを送信したことを意味します

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode が接続されない">
    Slack アプリ設定で bot トークンと app トークン、および Socket Mode の有効化を検証してください。
    App-Level Token には `connections:write` が必要です。また、Bot User OAuth Token の
    bot トークンは、app トークンと同じ Slack アプリ/ワークスペースに属している必要があります。

    `openclaw channels status --probe --json` に `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、Slack アカウントは
    設定されていますが、現在のランタイムは SecretRef によって参照される値を解決できませんでした。

    `slack socket mode failed to start; retry ...` のようなログは、回復可能な
    起動失敗です。一方、スコープの不足、失効したトークン、無効な認証は即座に
    失敗します。`slack token mismatch ...` ログは、bot トークンと app トークンが
    異なる Slack アプリに属しているように見えることを意味します。Slack アプリの認証情報を修正してください。

  </Accordion>

  <Accordion title="HTTP モードでイベントを受信しない">
    次を検証してください:

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`
    - 公開 URL が TLS を終端し、Gateway パスにリクエストを転送している
    - Slack アプリの `request_url` パスが `channels.slack.webhookPath`（デフォルト `/slack/events`）と完全に一致している

    アカウントのスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、HTTP アカウントは設定されていますが、現在のランタイムは
    SecretRef によって参照される signing secret を解決できませんでした。

    `slack: webhook path ... already registered` ログが繰り返し出力される場合、2 つの HTTP
    アカウントが同じ `webhookPath` を使用しています。各アカウントに異なるパスを指定してください。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが実行されない">
    意図した設定が次のどちらであるかを確認してください:

    - Slack に登録された対応するスラッシュコマンドを使用するネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    Slack はスラッシュコマンドを自動的に作成または削除しません。`commands.native: "auto"` では Slack のネイティブコマンドは有効になりません。`true` を使用して、Slack アプリに対応するコマンドを作成してください。HTTP モードでは、すべての Slack スラッシュコマンドに Gateway URL を含める必要があります。Socket Mode では、コマンドペイロードは websocket 経由で到着し、Slack は `slash_commands[].url` を無視します。

    `commands.useAccessGroups`、DM 認可、チャンネル許可リスト、
    チャンネルごとの `users` 許可リストも確認してください。Slack はブロックされた
    スラッシュコマンド送信者に対して、次のような一時的なエラーを返します:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 添付メディアのリファレンス

Slack ファイルのダウンロードが成功し、サイズ制限内である場合、Slack はダウンロードしたメディアをエージェントターンに添付できます。音声クリップは文字起こしでき、画像ファイルはメディア理解パスを通すか、ビジョン対応の返信モデルに直接渡すことができます。その他のファイルは、ダウンロード可能なファイルコンテキストとして引き続き利用できます。

### サポートされるメディアタイプ

| メディアタイプ                 | ソース               | 現在の動作                                                                        | 注記                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音声クリップ             | Slack ファイル URL   | ダウンロードされ、共有音声文字起こしを通じてルーティングされる                   | `files:read` と、動作する `tools.media.audio` モデルまたは CLI が必要     |
| JPEG / PNG / GIF / WebP 画像   | Slack ファイル URL   | ダウンロードされ、ビジョン対応処理のためにターンへ添付される                     | ファイルごとの上限: `channels.slack.mediaMaxMb`（デフォルト 20 MB）       |
| PDF ファイル                   | Slack ファイル URL   | ダウンロードされ、`download-file` や `pdf` などのツール用ファイルコンテキストとして公開される | Slack の受信処理では、PDF を画像ビジョン入力へ自動変換しない              |
| その他のファイル               | Slack ファイル URL   | 可能な場合はダウンロードされ、ファイルコンテキストとして公開される               | バイナリファイルは画像入力として扱われない                                |
| スレッド返信                   | スレッド開始メッセージのファイル | 返信に直接のメディアがない場合、ルートメッセージのファイルをコンテキストとして読み込める | ファイルのみの開始メッセージでは添付プレースホルダーを使用                |
| 複数ファイルのメッセージ       | 複数の Slack ファイル | 各ファイルが個別に評価される                                                      | Slack の処理はメッセージあたり 8 ファイルが上限                           |

### 受信パイプライン

ファイル添付付きの Slack メッセージを受信すると:

1. OpenClaw はボットトークンを使用して、Slack の非公開 URL からファイルをダウンロードします。
2. 成功すると、ファイルはメディアストアに書き込まれます。
3. ダウンロードしたメディアのパスとコンテンツタイプが受信コンテキストに追加されます。
4. 音声クリップは共有文字起こしパイプラインにルーティングされます。画像対応のモデル／ツールパスは、同じコンテキストの画像添付ファイルを使用できます。
5. その他のファイルは、それらを処理できるツール向けに、ファイルメタデータまたはメディア参照として引き続き利用できます。

### スレッドのルート添付ファイルの継承

メッセージがスレッド内に届いた場合（親の `thread_ts` がある場合）：

- 返信自体に直接添付されたメディアがなく、含まれているルートメッセージにファイルがある場合、Slack はルートファイルをスレッド開始時のコンテキストとして取り込めます。
- ルートファイルは、新規またはリセットされたスレッドセッションの初期化時にのみ取り込まれます。以降のテキストのみの返信では既存のセッションコンテキストが再利用され、ルートファイルが新しいメディアとして再添付されることはありません。
- 返信に直接添付されたファイルは、ルートメッセージの添付ファイルより優先されます。
- ファイルのみがありテキストがないルートメッセージは、フォールバックにそのファイルを含められるよう、添付ファイルのプレースホルダーで表されます。

### 複数添付ファイルの処理

1 件の Slack メッセージに複数のファイルが添付されている場合：

- 各添付ファイルは、メディアパイプラインで個別に処理されます。
- ダウンロードしたメディア参照は、メッセージコンテキストに集約されます。
- 処理順序は、イベントペイロード内の Slack のファイル順に従います。
- 1 件の添付ファイルのダウンロードに失敗しても、他の添付ファイルの処理は妨げられません。

### サイズ、ダウンロード、モデルの制限

- **サイズ上限**：デフォルトではファイルごとに 20 MB。`channels.slack.mediaMaxMb` で設定できます。
- **音声文字起こしの上限**：ダウンロードしたファイルを文字起こしプロバイダーまたは CLI に送信する場合、`tools.media.audio.maxBytes` も適用されます。
- **ダウンロード失敗**：Slack が配信できないファイル、期限切れの URL、アクセス不能なファイル、サイズ超過のファイル、Slack の認証／ログイン HTML レスポンスは、未対応形式として報告されるのではなくスキップされます。
- **ビジョンモデル**：画像分析には、ビジョンに対応している場合はアクティブな返信モデルが使用され、それ以外の場合は `agents.defaults.imageModel` で設定された画像モデルが使用されます。

### 既知の制限

| シナリオ                                      | 現在の動作                                                                   | 回避策                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 期限切れの Slack ファイル URL                        | ファイルはスキップされ、エラーは表示されない                                                       | Slack でファイルを再アップロードする                                                   |
| 音声文字起こしを利用できない               | クリップは添付されたままだが、文字起こしは生成されない                                | `tools.media.audio` を設定するか、対応するローカル文字起こし CLI をインストールする  |
| キャプションのないクリップがメンションゲートを通過しない | 非公開の推測的文字起こし後に破棄され、文字起こしとダウンロードも削除される | 発話名のメンションパターンを設定するか、入力したボットメンションを追加するか、DM を使用する |
| ビジョンモデルが設定されていない                   | 画像添付ファイルはメディア参照として保存されるが、画像としては分析されない       | `agents.defaults.imageModel` を設定するか、ビジョン対応の返信モデルを使用する    |
| 非常に大きな画像（デフォルトでは > 20 MB）        | サイズ上限に従ってスキップされる                                                               | Slack が許可する場合は `channels.slack.mediaMaxMb` を増やす                          |
| 転送／共有された添付ファイル                  | テキストと Slack がホストする画像／ファイルメディアはベストエフォートで処理される                             | OpenClaw スレッドで直接再共有する                                      |
| PDF 添付ファイル                               | ファイル／メディアコンテキストとして保存され、画像ビジョンには自動的にルーティングされない        | ファイルメタデータには `download-file`、PDF 分析には `pdf` ツールを使用する      |

### 関連ドキュメント

- [メディア理解パイプライン](/ja-JP/nodes/media-understanding)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [PDF ツール](/ja-JP/tools/pdf)

## 関連項目

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack ユーザーを Gateway とペアリングします。
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
    コマンドの一覧と動作。
  </Card>
</CardGroup>
