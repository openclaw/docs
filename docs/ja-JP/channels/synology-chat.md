---
read_when:
    - OpenClaw で Synology Chat を設定する
    - Synology Chat Webhook ルーティングのデバッグ
summary: Synology Chat Webhook のセットアップと OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T05:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

ステータス: Synology Chat Webhook を使用する同梱Pluginのダイレクトメッセージチャネル。
このPluginは Synology Chat outgoing Webhook からの受信メッセージを受け付け、Synology Chat incoming Webhook を通じて返信を送信します。

## 同梱Plugin

Synology Chat は現在の OpenClaw リリースに同梱Pluginとして含まれているため、通常のパッケージ化されたビルドでは個別のインストールは不要です。

古いビルドを使用している場合、または Synology Chat を除外したカスタムインストールの場合は、手動でインストールしてください。

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

1. Synology Chat Plugin が利用可能であることを確認します。
   - 現在のパッケージ化された OpenClaw リリースにはすでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドを使ってソースチェックアウトから手動で追加できます。
   - `openclaw onboard` は、`openclaw channels add` と同じチャネル設定リストに Synology Chat を表示するようになりました。
   - 非対話型セットアップ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat の統合で:
   - incoming Webhook を作成し、その URL をコピーします。
   - シークレットトークンを使って outgoing Webhook を作成します。
3. outgoing Webhook URL を OpenClaw Gateway に向けます。
   - 既定では `https://gateway-host/webhook/synology` です。
   - またはカスタムの `channels.synology-chat.webhookPath` です。
4. OpenClaw でセットアップを完了します。
   - ガイド付き: `openclaw onboard`
   - 直接: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway を再起動し、Synology Chat ボットに DM を送信します。

Webhook 認証の詳細:

- OpenClaw は outgoing Webhook トークンを `body.token`、次に
  `?token=...`、次にヘッダーから受け付けます。
- 受け付けるヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空または欠落したトークンは fail closed します。

最小構成:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 環境変数

既定のアカウントでは、環境変数を使用できます。

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (カンマ区切り)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定値は環境変数を上書きします。

`SYNOLOGY_CHAT_INCOMING_URL` はワークスペースの `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## DM ポリシーとアクセス制御

- `dmPolicy: "allowlist"` は推奨される既定値です。
- `allowedUserIds` は Synology ユーザー ID のリスト (またはカンマ区切り文字列) を受け付けます。
- `allowlist` モードでは、空の `allowedUserIds` リストは設定ミスとして扱われ、Webhook ルートは開始されません (全許可には `allowedUserIds: ["*"]` とともに `dmPolicy: "open"` を使用します)。
- `dmPolicy: "open"` は、`allowedUserIds` に `"*"` が含まれている場合にのみ公開 DM を許可します。制限付きのエントリがある場合は、一致するユーザーのみがチャットできます。
- `dmPolicy: "disabled"` は DM をブロックします。
- 返信先の紐付けは、既定で安定した数値の `user_id` に維持されます。`channels.synology-chat.dangerouslyAllowNameMatching: true` は、返信配信のために変更可能なユーザー名/ニックネーム検索を再度有効化する break-glass 互換モードです。
- ペアリング承認は次で動作します。
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 送信配信

ターゲットには数値の Synology Chat ユーザー ID を使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

メディア送信は URL ベースのファイル配信でサポートされます。
送信ファイル URL は `http` または `https` を使用する必要があり、プライベートまたはその他のブロック対象ネットワークのターゲットは、OpenClaw が URL を NAS Webhook に転送する前に拒否されます。

## マルチアカウント

複数の Synology Chat アカウントは `channels.synology-chat.accounts` の下でサポートされます。
各アカウントは、トークン、incoming URL、Webhook パス、DM ポリシー、制限を上書きできます。
ダイレクトメッセージセッションはアカウントとユーザーごとに分離されるため、2 つの異なる Synology アカウントで同じ数値の `user_id` が使われても、トランスクリプト状態は共有されません。
有効化された各アカウントには個別の `webhookPath` を指定してください。OpenClaw は重複する完全一致パスを拒否し、マルチアカウント設定で共有 Webhook パスを継承するだけの名前付きアカウントの開始を拒否するようになりました。
名前付きアカウントで意図的に従来の継承が必要な場合は、そのアカウントまたは `channels.synology-chat` に
`dangerouslyAllowInheritedWebhookPath: true` を設定します。ただし、重複する完全一致パスは引き続き fail-closed で拒否されます。アカウントごとに明示的なパスを指定することを優先してください。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## セキュリティ上の注意

- `token` は秘密に保ち、漏えいした場合はローテーションしてください。
- 自己署名のローカル NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` のままにしてください。
- 受信 Webhook リクエストはトークンで検証され、送信者ごとにレート制限されます。
- 無効なトークンチェックは定数時間のシークレット比較を使用し、fail closed します。
- 本番環境では `dmPolicy: "allowlist"` を推奨します。
- 従来のユーザー名ベースの返信配信が明示的に必要でない限り、`dangerouslyAllowNameMatching` はオフのままにしてください。
- マルチアカウント設定で共有パスルーティングのリスクを明示的に受け入れる場合を除き、`dangerouslyAllowInheritedWebhookPath` はオフのままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - outgoing Webhook ペイロードに必須フィールドのいずれかがありません
  - Synology がヘッダーでトークンを送信する場合は、Gateway/プロキシがそれらのヘッダーを保持していることを確認してください
- `Invalid token`:
  - outgoing Webhook シークレットが `channels.synology-chat.token` と一致していません
  - リクエストが誤ったアカウント/Webhook パスに到達しています
  - リクエストが OpenClaw に到達する前に、リバースプロキシがトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じソースから無効なトークン試行が多すぎると、そのソースが一時的にロックアウトされることがあります
  - 認証済み送信者にも、ユーザーごとの別のメッセージレート制限があります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` は有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値 `user_id` が `allowedUserIds` にありません

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
