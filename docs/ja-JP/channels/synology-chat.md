---
read_when:
    - OpenClaw で Synology Chat をセットアップする
    - Synology Chat の Webhook ルーティングをデバッグする
summary: Synology Chat の Webhook セットアップと OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T04:47:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

ステータス: Synology Chat Webhook を使う、同梱 Plugin のダイレクトメッセージチャネルです。
この Plugin は Synology Chat の送信 Webhook から受信メッセージを受け取り、
Synology Chat の受信 Webhook を通じて返信を送信します。

## 同梱 Plugin

Synology Chat は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常の
パッケージ済みビルドでは別途インストールは不要です。

古いビルド、または Synology Chat を除外したカスタムインストールを使っている場合は、
手動でインストールしてください。

ローカルチェックアウトからインストールするには:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. Synology Chat Plugin が利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースには、すでに同梱されています。
   - 古い/カスタムインストールでは、上記コマンドを使ってソースチェックアウトから手動追加できます。
   - `openclaw onboard` では、`openclaw channels add` と同じチャネル設定一覧に Synology Chat が表示されるようになりました。
   - 非対話型セットアップ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat の統合設定で:
   - 受信 Webhook を作成し、その URL をコピーします。
   - 送信 Webhook をあなたのシークレットトークンで作成します。
3. 送信 Webhook URL を OpenClaw Gateway に向けます:
   - デフォルトでは `https://gateway-host/webhook/synology`
   - またはカスタムの `channels.synology-chat.webhookPath`
4. OpenClaw でセットアップを完了します。
   - ガイド付き: `openclaw onboard`
   - 直接: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway を再起動して、Synology Chat ボットに DM を送信します。

Webhook 認証の詳細:

- OpenClaw は送信 Webhook トークンを、最初に `body.token`、次に
  `?token=...`、その次にヘッダーから受け入れます。
- 受け入れられるヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空または欠落したトークンは fail-closed になります。

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

デフォルトアカウントでは、環境変数を使えます。

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（カンマ区切り）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定値は環境変数を上書きします。

`SYNOLOGY_CHAT_INCOMING_URL` はワークスペースの `.env` からは設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## DM ポリシーとアクセス制御

- `dmPolicy: "allowlist"` が推奨されるデフォルトです。
- `allowedUserIds` は、Synology ユーザー ID のリスト（またはカンマ区切り文字列）を受け取ります。
- `allowlist` モードでは、`allowedUserIds` リストが空だと設定ミスとして扱われ、Webhook ルートは起動しません（全許可にするには `dmPolicy: "open"` を使ってください）。
- `dmPolicy: "open"` はすべての送信者を許可します。
- `dmPolicy: "disabled"` は DM をブロックします。
- 返信先バインディングは、デフォルトでは安定した数値の `user_id` に固定されます。`channels.synology-chat.dangerouslyAllowNameMatching: true` は緊急用の互換モードであり、返信配信のための可変な username/nickname 検索を再有効化します。
- ペアリング承認は次で動作します:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 送信配信

送信先には数値の Synology Chat ユーザー ID を使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

メディア送信は URL ベースのファイル配信をサポートしています。
送信ファイル URL は `http` または `https` を使う必要があり、プライベートまたはその他の理由でブロックされるネットワーク宛先は、OpenClaw がその URL を NAS Webhook に転送する前に拒否されます。

## マルチアカウント

複数の Synology Chat アカウントは `channels.synology-chat.accounts` 配下でサポートされます。
各アカウントは token、受信 URL、Webhook パス、DM ポリシー、制限を上書きできます。
ダイレクトメッセージセッションはアカウントごと・ユーザーごとに分離されるため、2 つの異なる Synology アカウントで同じ数値の `user_id`
を使っていても、トランスクリプト状態は共有されません。
有効な各アカウントには、異なる `webhookPath` を指定してください。OpenClaw は現在、完全に同一のパスを拒否し、
マルチアカウント構成で共有された Webhook パスだけを継承する名前付きアカウントの起動を拒否します。
意図的に名前付きアカウントで旧来の継承が必要な場合は、
そのアカウントまたは `channels.synology-chat` に `dangerouslyAllowInheritedWebhookPath: true` を設定してください。
ただし、完全に同一のパスは引き続き fail-closed で拒否されます。アカウントごとの明示的なパスを推奨します。

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
- 自己署名のローカル NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` のままにしてください。
- 受信 Webhook リクエストは、トークン検証され、送信者ごとにレート制限されます。
- 無効トークンの確認には定数時間のシークレット比較が使われ、fail-closed になります。
- 本番環境では `dmPolicy: "allowlist"` を推奨します。
- 旧来の username ベース返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching` はオフのままにしてください。
- マルチアカウント構成で共有パスルーティングのリスクを明示的に受け入れる場合を除き、`dangerouslyAllowInheritedWebhookPath` はオフのままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - 送信 Webhook ペイロードに必要なフィールドのいずれかがありません
  - Synology がヘッダーでトークンを送る場合は、Gateway/プロキシがそれらのヘッダーを保持していることを確認してください
- `Invalid token`:
  - 送信 Webhook シークレットが `channels.synology-chat.token` と一致していません
  - リクエストが誤ったアカウント/Webhook パスに到達しています
  - リバースプロキシが、リクエストが OpenClaw に到達する前にトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元からの無効トークン試行が多すぎると、その送信元は一時的にロックアウトされることがあります
  - 認証済み送信者にも、別途ユーザーごとのメッセージレート制限があります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` が有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値 `user_id` が `allowedUserIds` に含まれていません

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
