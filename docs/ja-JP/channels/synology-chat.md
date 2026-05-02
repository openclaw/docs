---
read_when:
    - OpenClaw で Synology Chat を設定する
    - Synology Chat Webhook ルーティングのデバッグ
summary: Synology Chat Webhook のセットアップと OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T04:50:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

ステータス: Synology Chat Webhook を使用する、バンドルされたPluginのダイレクトメッセージチャンネルです。
このPluginは、Synology Chat の送信 Webhook から受信メッセージを受け取り、Synology Chat の受信 Webhook 経由で返信を送信します。

## バンドルされたPlugin

Synology Chat は現在の OpenClaw リリースではバンドルされたPluginとして提供されるため、通常のパッケージビルドでは別途インストールする必要はありません。

古いビルドを使用している場合、または Synology Chat を除外したカスタムインストールの場合は、手動でインストールしてください。

ローカルチェックアウトからインストールします。

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. Synology Chat Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドでソースチェックアウトから手動で追加できます。
   - `openclaw onboard` では、`openclaw channels add` と同じチャンネル設定リストに Synology Chat が表示されるようになりました。
   - 非対話型セットアップ: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat 連携で:
   - 受信 Webhook を作成し、その URL をコピーします。
   - 秘密トークンを使って送信 Webhook を作成します。
3. 送信 Webhook URL を OpenClaw Gateway に向けます。
   - デフォルトでは `https://gateway-host/webhook/synology` です。
   - または、カスタムの `channels.synology-chat.webhookPath` を使用します。
4. OpenClaw でセットアップを完了します。
   - ガイド付き: `openclaw onboard`
   - 直接: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway を再起動し、Synology Chat ボットに DM を送信します。

Webhook 認証の詳細:

- OpenClaw は送信 Webhook トークンを `body.token`、次に
  `?token=...`、次にヘッダーから受け付けます。
- 受け付けるヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空または欠落しているトークンは fail closed になります。

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

デフォルトアカウントでは、環境変数を使用できます。

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (カンマ区切り)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定値は環境変数を上書きします。

`SYNOLOGY_CHAT_INCOMING_URL` はワークスペースの `.env` からは設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## DM ポリシーとアクセス制御

- `dmPolicy: "allowlist"` が推奨されるデフォルトです。
- `allowedUserIds` は Synology ユーザー ID のリスト、またはカンマ区切り文字列を受け付けます。
- `allowlist` モードでは、空の `allowedUserIds` リストは設定ミスとして扱われ、Webhook ルートは起動しません。全許可には `dmPolicy: "open"` と `allowedUserIds: ["*"]` を使用してください。
- `dmPolicy: "open"` は、`allowedUserIds` に `"*"` が含まれる場合にのみ公開 DM を許可します。制限付きのエントリがある場合は、一致するユーザーだけがチャットできます。
- `dmPolicy: "disabled"` は DM をブロックします。
- 返信先のバインドは、デフォルトでは安定した数値の `user_id` に維持されます。`channels.synology-chat.dangerouslyAllowNameMatching: true` は、返信配信のために変更可能なユーザー名/ニックネーム検索を再び有効化する、緊急時の互換モードです。
- ペアリング承認は次で動作します。
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## アウトバウンド配信

ターゲットには数値の Synology Chat ユーザー ID を使用します。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

メディア送信は URL ベースのファイル配信でサポートされています。
アウトバウンドファイル URL は `http` または `https` を使用する必要があり、プライベートまたはその他のブロックされたネットワークターゲットは、OpenClaw が URL を NAS Webhook に転送する前に拒否されます。

## マルチアカウント

複数の Synology Chat アカウントは `channels.synology-chat.accounts` 配下でサポートされています。
各アカウントは、トークン、受信 URL、Webhook パス、DM ポリシー、制限を上書きできます。
ダイレクトメッセージセッションはアカウントとユーザーごとに分離されるため、2 つの異なる Synology アカウント上の同じ数値 `user_id` はトランスクリプト状態を共有しません。
有効化された各アカウントには個別の `webhookPath` を指定してください。OpenClaw は重複する完全一致パスを拒否するようになり、マルチアカウント設定で共有 Webhook パスを継承するだけの名前付きアカウントは起動を拒否します。
名前付きアカウントでレガシー継承が意図的に必要な場合は、そのアカウントまたは `channels.synology-chat` に
`dangerouslyAllowInheritedWebhookPath: true` を設定してください。ただし、重複する完全一致パスは引き続き fail closed で拒否されます。アカウントごとに明示的なパスを指定することを推奨します。

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

## セキュリティメモ

- `token` は秘密に保ち、漏えいした場合はローテーションしてください。
- 自己署名のローカル NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` のままにしてください。
- 受信 Webhook リクエストはトークン検証され、送信者ごとにレート制限されます。
- 無効なトークンのチェックでは定数時間の秘密比較を使用し、fail closed になります。
- 本番環境では `dmPolicy: "allowlist"` を推奨します。
- レガシーのユーザー名ベースの返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching` はオフのままにしてください。
- マルチアカウント設定で共有パスのルーティングリスクを明示的に受け入れる場合を除き、`dangerouslyAllowInheritedWebhookPath` はオフのままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - 送信 Webhook ペイロードに必須フィールドのいずれかがありません
  - Synology がヘッダーでトークンを送信する場合は、Gateway/プロキシがそれらのヘッダーを保持していることを確認してください
- `Invalid token`:
  - 送信 Webhook の秘密が `channels.synology-chat.token` と一致しません
  - リクエストが誤ったアカウント/Webhook パスに届いています
  - リクエストが OpenClaw に到達する前に、リバースプロキシがトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元から無効なトークン試行が多すぎると、その送信元が一時的にロックアウトされることがあります
  - 認証済み送信者にも、ユーザーごとの別個のメッセージレート制限があります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` が有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値 `user_id` が `allowedUserIds` に含まれていません

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
