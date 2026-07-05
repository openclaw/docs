---
read_when:
    - OpenClaw で Synology Chat を設定する
    - Synology Chat の Webhook ルーティングのデバッグ
summary: Synology Chat Webhook のセットアップと OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-07-05T11:04:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat は Webhook ペアを通じて OpenClaw に接続します。Synology Chat の送信 Webhook が受信したダイレクトメッセージを Gateway に投稿し、返信は Synology Chat の受信 Webhook 経由で戻ります。

ステータス: 公式Plugin、別途インストール。ダイレクトメッセージのみ。テキストと URL ベースのファイル送信に対応しています。

## インストール

```bash
openclaw plugins install @openclaw/synology-chat
```

ローカルチェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

1. Plugin をインストールします（上記）。
2. Synology Chat の連携で:
   - 受信 Webhook を作成し、その URL をコピーします。
   - シークレットトークン付きの送信 Webhook を作成します。
3. 送信 Webhook URL を OpenClaw Gateway に向けます:
   - 既定では `https://gateway-host/webhook/synology`。
   - またはカスタムの `channels.synology-chat.webhookPath`。
4. OpenClaw でセットアップを完了します。Synology Chat は、両方のフローで同じチャンネルセットアップ一覧に表示されます:
   - ガイド付き: `openclaw onboard` または `openclaw channels add`
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
- 空または欠落したトークンは fail closed します。
- ペイロードは `application/x-www-form-urlencoded` または `application/json` にできます。`token`、`user_id`、`text` が必須です。

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

既定のアカウントでは、環境変数を使用できます:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（カンマ区切り）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

構成値は環境変数を上書きします。

`SYNOLOGY_CHAT_INCOMING_URL` と `SYNOLOGY_NAS_HOST` はワークスペースの `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security#workspace-env-files)を参照してください。

## DM ポリシーとアクセス制御

- 対応する `dmPolicy` 値: `allowlist`（既定）、`open`、`disabled`。Synology Chat にはペアリングフローがありません。送信者を承認するには、数値の Synology ユーザー ID を `allowedUserIds` に追加します。
- `allowedUserIds` は Synology ユーザー ID のリスト（またはカンマ区切り文字列）を受け付けます。
- `allowlist` モードでは、空の `allowedUserIds` リストは構成ミスとして扱われ、Webhook ルートは開始されません。
- `dmPolicy: "open"` は、`allowedUserIds` に `"*"` が含まれている場合にのみ公開 DM を許可します。制限付きのエントリがある場合は、一致するユーザーだけがチャットできます。空の `allowedUserIds` リストでの `open` も、ルートの開始を拒否します。
- `dmPolicy: "disabled"` は DM をブロックします。
- 返信先のバインドは、既定で安定した数値の `user_id` に留まります。`channels.synology-chat.dangerouslyAllowNameMatching: true` は break-glass 互換モードで、返信配信のために変更可能なユーザー名/ニックネーム検索を再度有効にします。

## 送信配信

数値の Synology Chat ユーザー ID をターゲットとして使用します。`synology-chat:`、`synology_chat:`、`synology:` のプレフィックスが受け付けられます。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

送信テキストは 2000 文字で分割されます。メディア送信は URL ベースのファイル配信で対応しています。NAS がファイルをダウンロードして添付します（最大 32 MB）。送信ファイル URL は `http` または `https` を使用する必要があります。プライベートまたはその他のブロックされたネットワークターゲットは、OpenClaw が URL を NAS Webhook に転送する前に拒否されます。

## マルチアカウント

複数の Synology Chat アカウントは `channels.synology-chat.accounts` 配下で対応しています。
各アカウントは、トークン、受信 URL、Webhook パス、DM ポリシー、制限を上書きできます。
ダイレクトメッセージセッションはアカウントとユーザーごとに分離されるため、2 つの異なる Synology アカウント上の同じ数値 `user_id`
がトランスクリプト状態を共有することはありません。
有効な各アカウントには個別の `webhookPath` を指定してください。OpenClaw は完全に重複するパスを拒否し、
マルチアカウントセットアップで共有 Webhook パスだけを継承する名前付きアカウントの開始を拒否します。
名前付きアカウントで意図的にレガシー継承が必要な場合は、そのアカウントまたは `channels.synology-chat` に
`dangerouslyAllowInheritedWebhookPath: true` を設定します。ただし、完全に重複するパスは引き続き fail closed で拒否されます。アカウントごとの明示的なパスを優先してください。

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
- 自己署名されたローカル NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` のままにしてください。
- 受信 Webhook リクエストはトークン検証され、送信者ごとにレート制限されます（`rateLimitPerMinute`、既定 30）。
- 無効なトークンチェックは定数時間のシークレット比較を使用し、fail closed します。無効なトークン試行が繰り返されると、送信元 IP が一時的にロックアウトされます。
- 受信メッセージテキストは、既知のプロンプトインジェクションパターンに対してサニタイズされ、4000 文字で切り捨てられます。
- 本番環境では `dmPolicy: "allowlist"` を優先してください。
- レガシーのユーザー名ベース返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching` はオフのままにしてください。
- マルチアカウントセットアップで共有パスルーティングのリスクを明示的に受け入れる場合を除き、`dangerouslyAllowInheritedWebhookPath` はオフのままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - 送信 Webhook ペイロードに必須フィールドのいずれかが欠けています
  - Synology がヘッダーでトークンを送信する場合は、Gateway/プロキシがそれらのヘッダーを保持していることを確認してください
- `Invalid token`:
  - 送信 Webhook シークレットが `channels.synology-chat.token` と一致しません
  - リクエストが誤ったアカウント/Webhook パスに到達しています
  - リクエストが OpenClaw に到達する前に、リバースプロキシがトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元からの無効なトークン試行が多すぎると、その送信元が一時的にロックアウトされることがあります
  - 認証済み送信者にも、ユーザーごとの別のメッセージレート制限があります
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` が有効ですが、ユーザーが構成されていません
- `User not authorized`:
  - 送信者の数値 `user_id` が `allowedUserIds` に含まれていません

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
