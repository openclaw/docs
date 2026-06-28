---
read_when:
    - OpenClaw を LINE に接続したい場合
    - LINE Webhook と認証情報を設定する必要があります
    - LINE 固有のメッセージパラメーターが必要です
summary: Plugin LINE Messaging API のセットアップ、構成、使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。Plugin は Gateway 上の Webhook
受信側として動作し、認証には channel access token + channel secret を使用します。

ステータス: 読み込み可能な Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
messages、template messages、クイック返信をサポートします。リアクションとスレッドは
サポートされません。

## インストール

チャンネルを設定する前に LINE をインストールします。

```bash
openclaw plugins install @openclaw/line
```

ローカルの作業コピー (git リポジトリから実行する場合):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. LINE Developers アカウントを作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成 (または選択) し、**Messaging API** チャンネルを追加します。
3. チャンネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Gateway エンドポイントの Webhook URL を設定します (HTTPS が必要です):

```
https://gateway-host/line/webhook
```

Gateway は LINE からの Webhook 検証 (GET) に応答し、署名付きの
受信イベント (POST) は署名とペイロードの検証後すぐに確認応答します。エージェントによる処理は
非同期で継続します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、URL もそれに合わせて更新します。

セキュリティ上の注意:

- LINE の署名検証はリクエスト本文に依存するため (未加工の本文に対する HMAC)、OpenClaw は検証前の認証段階で厳格な本文サイズ制限とタイムアウトを適用します。
- OpenClaw は、検証済みの未加工リクエストバイトから Webhook イベントを処理します。上流のミドルウェアによって変換された `req.body` の値は、署名の完全性を保つため無視されます。

## 構成

最小構成:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

オープンなダイレクトメッセージ構成:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

環境変数 (デフォルトアカウントのみ):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

トークン/シークレットファイル:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` と `secretFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます。

複数アカウント:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## アクセス制御

ダイレクトメッセージはデフォルトでペアリングが必要です。不明な送信者にはペアリングコードが送信され、その
メッセージは承認されるまで無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ダイレクトメッセージに許可された LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループに許可された LINE ユーザー ID
- グループごとの上書き: `channels.line.groups.<groupId>.allowFrom`
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、グループの `allowFrom` から `accessGroup:<name>` で参照できます。
- runtime に関する注意: `channels.line` が完全に存在しない場合、runtime はグループチェックで `groupPolicy="allowlist"` に戻ります (`channels.defaults.groupPolicy` が設定されていても同様です)。

LINE ID は大文字と小文字を区別します。有効な ID は次の形式です。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージ動作

- テキストは 5000 文字ごとに分割されます。
- Markdown の書式は削除されます。コードブロックと表は可能な場合 Flex
  cards に変換されます。
- ストリーミング応答はバッファリングされます。エージェントが動作している間、LINE は読み込みアニメーション付きの完全な断片を受信します。
- メディアのダウンロードは `channels.line.mediaMaxMb` (デフォルト 10) に制限されます。
- 受信メディアはエージェントへ渡される前に `~/.openclaw/media/inbound/` に保存されます。これは他の組み込みチャンネル Plugin が使用する共通メディアストレージと一致します。

## チャンネルデータ (拡張メッセージ)

クイック返信、位置情報、Flex cards、template
messages を送信するには `channelData.line` を使用します。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin には、Flex messages のプリセット用の `/card` コマンドも含まれています。

```
/card info "Welcome" "Thanks for joining!"
```

## ACP サポート

LINE は ACP (Agent Communication Protocol) の会話バインディングをサポートします。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャンネルと同じように LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントのメッセージツールを介した画像、動画、音声ファイルの送信をサポートします。メディアは、適切なプレビュー処理とトラッキングを備えた LINE 固有の配信パスで送信されます。

- **画像**: プレビューを自動生成して LINE の画像メッセージとして送信されます。
- **動画**: プレビューとコンテンツタイプを明示的に処理して送信されます。
- **音声**: LINE の音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前にターゲットのホスト名を検証し、local loopback、link-local、プライベートネットワークの宛先を拒否します。

汎用メディア送信は、LINE 固有のパスが利用できない場合にのみ、画像向けの既存ルートへフォールバックします。

## トラブルシューティング

- **Webhook 検証が失敗する:** Webhook URL が HTTPS を使用しており、`channelSecret` が LINE console と一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、Gateway が LINE から到達可能であることを確認してください。
- **メディアのダウンロードエラー:** メディアがデフォルトの制限を超える場合は、`channels.line.mediaMaxMb` を増やしてください。

## 関連項目

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — ダイレクトメッセージ認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制限
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと保護強化
