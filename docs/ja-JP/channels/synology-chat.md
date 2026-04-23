---
read_when:
    - OpenClaw で Synology Chat を設定する
    - Synology Chat の Webhook ルーティングのデバッグ
summary: Synology Chat の Webhook セットアップと OpenClaw の設定
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:59:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

ステータス: Synology Chat の Webhook を使用する、同梱 Plugin のダイレクトメッセージチャネル。
この Plugin は Synology Chat の outgoing Webhook から受信メッセージを受け取り、
Synology Chat の incoming Webhook を通じて返信を送信します。

## 同梱 Plugin

Synology Chat は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常の
パッケージ済みビルドでは別途インストールは不要です。

古いビルドまたは Synology Chat を含まないカスタムインストールを使用している場合は、
手動でインストールしてください:

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックスタート

1. Synology Chat Plugin が利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースには、すでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドでソースチェックアウトから手動追加できます。
   - `openclaw onboard` では、`openclaw channels add` と同じチャネル設定リストに Synology Chat が表示されるようになりました。
   - 非対話セットアップ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat の integrations で:
   - incoming Webhook を作成し、その URL をコピーします。
   - secret token を使って outgoing Webhook を作成します。
3. outgoing Webhook URL を OpenClaw Gateway に向けます:
   - デフォルトでは `https://gateway-host/webhook/synology`。
   - または、カスタムの `channels.synology-chat.webhookPath`。
4. OpenClaw でセットアップを完了します。
   - ガイド付き: `openclaw onboard`
   - 直接指定: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway を再起動し、Synology Chat bot に DM を送信します。

Webhook 認証の詳細:

- OpenClaw は outgoing Webhook token を、`body.token`、次に
  `?token=...`、その次にヘッダーの順で受け付けます。
- 受け付けるヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空の token または token なしは fail closed になります。

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

デフォルトアカウントでは、env vars を使用できます:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（カンマ区切り）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

config 値は env vars を上書きします。

`SYNOLOGY_CHAT_INCOMING_URL` はワークスペースの `.env` からは設定できません。[Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## DM ポリシーとアクセス制御

- `dmPolicy: "allowlist"` が推奨デフォルトです。
- `allowedUserIds` は Synology の user ID のリスト（またはカンマ区切り文字列）を受け付けます。
- `allowlist` モードでは、空の `allowedUserIds` リストは設定ミスとして扱われ、Webhook ルートは起動しません（全許可にするには `dmPolicy: "open"` を使用してください）。
- `dmPolicy: "open"` は任意の送信者を許可します。
- `dmPolicy: "disabled"` は DM をブロックします。
- 返信先の受信者バインディングは、デフォルトで安定した数値の `user_id` に固定されます。`channels.synology-chat.dangerouslyAllowNameMatching: true` は緊急用の互換モードで、返信配信のために変更可能な username/nickname 検索を再有効化します。
- ペアリング承認は次で動作します:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 送信配信

送信先には数値の Synology Chat user ID を使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

メディア送信は URL ベースのファイル配信に対応しています。
送信ファイル URL は `http` または `https` を使用する必要があり、プライベートまたはその他のブロック対象ネットワークは、OpenClaw が URL を NAS Webhook に転送する前に拒否されます。

## マルチアカウント

複数の Synology Chat アカウントは `channels.synology-chat.accounts` の下でサポートされます。
各アカウントでは token、incoming URL、Webhook path、DM ポリシー、および制限を上書きできます。
ダイレクトメッセージセッションはアカウントごと・ユーザーごとに分離されるため、異なる 2 つの Synology アカウントで同じ数値の `user_id` を使っても transcript 状態は共有されません。
有効な各アカウントには、それぞれ異なる `webhookPath` を設定してください。OpenClaw は現在、完全一致する重複 path を拒否し、
マルチアカウント構成で共有 Webhook path だけを継承する名前付きアカウントの起動も拒否します。
意図的に名前付きアカウントで従来の継承が必要な場合は、
そのアカウント上または `channels.synology-chat` に `dangerouslyAllowInheritedWebhookPath: true` を設定してください。
ただし、完全一致する重複 path は依然として fail-closed で拒否されます。明示的なアカウントごとの path を推奨します。

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

## セキュリティに関する注意

- `token` は秘密に保ち、漏えいした場合はローテーションしてください。
- 自己署名のローカル NAS 証明書を明示的に信頼している場合を除き、`allowInsecureSsl: false` を維持してください。
- 受信 Webhook リクエストは token 検証され、送信者ごとにレート制限されます。
- 無効な token のチェックには定数時間の secret 比較が使用され、fail closed になります。
- 本番環境では `dmPolicy: "allowlist"` を推奨します。
- 従来の username ベースの返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching` はオフのままにしてください。
- マルチアカウント構成で共有 path ルーティングのリスクを明示的に受け入れる場合を除き、`dangerouslyAllowInheritedWebhookPath` はオフのままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - outgoing Webhook payload に必要フィールドのいずれかがありません
  - Synology が token をヘッダーで送信している場合は、gateway/proxy がそのヘッダーを保持していることを確認してください
- `Invalid token`:
  - outgoing Webhook secret が `channels.synology-chat.token` と一致していません
  - リクエストが誤ったアカウント/Webhook path に到達しています
  - reverse proxy が、リクエストが OpenClaw に到達する前に token ヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元からの無効な token 試行が多すぎると、その送信元は一時的にロックアウトされることがあります
  - 認証済み送信者には、別個のユーザーごとのメッセージレート制限もあります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` が有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値 `user_id` が `allowedUserIds` に含まれていません

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
