---
read_when:
    - OpenClaw で Synology Chat をセットアップする
    - Synology Chat Webhook ルーティングのデバッグ
summary: Synology Chat Webhook のセットアップと OpenClaw の設定
title: Synology Chat
x-i18n:
    generated_at: "2026-07-11T21:58:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat は Webhook のペアを通じて OpenClaw に接続します。Synology Chat の送信 Webhook が受信したダイレクトメッセージを Gateway に送信し、返信は Synology Chat の受信 Webhook を通じて送り返されます。

ステータス: 公式 Plugin。別途インストールが必要です。ダイレクトメッセージのみ対応し、テキストおよび URL ベースのファイル送信をサポートします。

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

1. Plugin をインストールします（上記参照）。
2. Synology Chat の連携設定で:
   - 受信 Webhook を作成し、その URL をコピーします。
   - シークレットトークンを使用して送信 Webhook を作成します。
3. 送信 Webhook の URL を OpenClaw Gateway に設定します:
   - デフォルトでは `https://gateway-host/webhook/synology`。
   - または、カスタムの `channels.synology-chat.webhookPath`。
4. OpenClaw でセットアップを完了します。どちらのフローでも、Synology Chat は同じチャンネルセットアップ一覧に表示されます:
   - ガイド付き: `openclaw onboard` または `openclaw channels add`
   - 直接指定: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway を再起動し、Synology Chat ボットにダイレクトメッセージを送信します。

Webhook 認証の詳細:

- OpenClaw は送信 Webhook のトークンを、まず `body.token`、次に
  `?token=...`、最後にヘッダーから受け取ります。
- 使用可能なヘッダー形式:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- トークンが空または欠落している場合は、拒否する側に倒します。
- ペイロードには `application/x-www-form-urlencoded` または `application/json` を使用できます。`token`、`user_id`、`text` は必須です。

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

デフォルトアカウントには環境変数を使用できます:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（カンマ区切り）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定値は環境変数を上書きします。

`SYNOLOGY_CHAT_INCOMING_URL` と `SYNOLOGY_NAS_HOST` はワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security#workspace-env-files)を参照してください。

## ダイレクトメッセージポリシーとアクセス制御

- サポートされる `dmPolicy` の値は `allowlist`（デフォルト）、`open`、`disabled` です。Synology Chat にはペアリングフローがないため、送信者を承認するには、その数値形式の Synology ユーザー ID を `allowedUserIds` に追加します。
- `allowedUserIds` には Synology ユーザー ID のリスト（またはカンマ区切りの文字列）を指定できます。
- `allowlist` モードでは、空の `allowedUserIds` リストは設定ミスとして扱われ、Webhook ルートは起動しません。
- `dmPolicy: "open"` で公開ダイレクトメッセージを許可するには、`allowedUserIds` に `"*"` が含まれている必要があります。制限付きのエントリがある場合、該当するユーザーのみがチャットできます。`allowedUserIds` リストが空の状態で `open` を指定した場合も、ルートの起動を拒否します。
- `dmPolicy: "disabled"` はダイレクトメッセージをブロックします。
- 返信先の紐付けには、デフォルトで安定した数値形式の `user_id` が引き続き使用されます。`channels.synology-chat.dangerouslyAllowNameMatching: true` は、返信配信のために変更可能なユーザー名やニックネームによる検索を再び有効にする、緊急時専用の互換モードです。

## 送信配信

送信先には数値形式の Synology Chat ユーザー ID を使用します。`synology-chat:`、`synology_chat:`、`synology:` の各プレフィックスを使用できます。

例:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

送信テキストは 2000 文字ごとに分割されます。メディア送信では URL ベースのファイル配信をサポートします。NAS がファイルをダウンロードして添付します（最大 32 MB）。送信ファイルの URL には `http` または `https` を使用する必要があります。プライベートネットワークの送信先や、その他の理由でブロックされているネットワークの送信先は、OpenClaw が URL を NAS の Webhook に転送する前に拒否されます。

## 複数アカウント

`channels.synology-chat.accounts` で複数の Synology Chat アカウントをサポートします。
各アカウントでトークン、受信 URL、Webhook パス、ダイレクトメッセージポリシー、制限を上書きできます。
ダイレクトメッセージのセッションはアカウントとユーザーごとに分離されるため、2 つの異なる Synology アカウントで同じ数値形式の `user_id`
を使用しても、会話履歴の状態は共有されません。
有効化する各アカウントには、それぞれ異なる `webhookPath` を指定してください。OpenClaw は完全に重複するパスを拒否し、
複数アカウント構成で共有 Webhook パスを継承するだけの名前付きアカウントについては、起動を拒否します。
名前付きアカウントで従来の継承が意図的に必要な場合は、そのアカウントまたは `channels.synology-chat` に
`dangerouslyAllowInheritedWebhookPath: true` を設定します。ただし、完全に重複するパスは引き続き拒否する側に倒します。アカウントごとにパスを明示することを推奨します。

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

- `token` は秘密に保ち、漏洩した場合はローテーションしてください。
- 自己署名されたローカル NAS 証明書を明示的に信頼する場合を除き、`allowInsecureSsl: false` を維持してください。
- 受信 Webhook リクエストはトークン検証され、送信者ごとにレート制限されます（`rateLimitPerMinute`、デフォルトは 30）。
- 無効なトークンの検証では定時間のシークレット比較を使用し、拒否する側に倒します。無効なトークンによる試行が繰り返されると、送信元 IP が一時的にロックアウトされます。
- 受信メッセージのテキストは、既知のプロンプトインジェクションパターンに対してサニタイズされ、4000 文字で切り詰められます。
- 本番環境では `dmPolicy: "allowlist"` を推奨します。
- 従来のユーザー名ベースの返信配信が明示的に必要な場合を除き、`dangerouslyAllowNameMatching` は無効のままにしてください。
- 複数アカウント構成で共有パスによるルーティングのリスクを明示的に許容する場合を除き、`dangerouslyAllowInheritedWebhookPath` は無効のままにしてください。

## トラブルシューティング

- `Missing required fields (token, user_id, text)`:
  - 送信 Webhook のペイロードに必須フィールドのいずれかがありません
  - Synology がトークンをヘッダーで送信する場合は、Gateway またはプロキシがそれらのヘッダーを保持していることを確認してください
- `Invalid token`:
  - 送信 Webhook のシークレットが `channels.synology-chat.token` と一致していません
  - リクエストが誤ったアカウントまたは Webhook パスに到達しています
  - リクエストが OpenClaw に到達する前に、リバースプロキシがトークンヘッダーを削除しました
- `Rate limit exceeded`:
  - 同じ送信元から無効なトークンによる試行が多すぎると、その送信元が一時的にロックアウトされる場合があります
  - 認証済みの送信者には、ユーザーごとのメッセージレート制限も別途適用されます
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` が有効ですが、ユーザーが設定されていません
- `User not authorized`:
  - 送信者の数値形式の `user_id` が `allowedUserIds` に含まれていません

## 関連項目

- [チャンネルの概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによる制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
