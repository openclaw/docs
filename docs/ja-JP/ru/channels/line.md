---
read_when:
    - OpenClaw を LINE に接続したい場合
    - LINE Webhook と認証情報を設定する必要があります
    - LINE 固有のメッセージパラメータが必要です
summary: Plugin LINE Messaging API のセットアップ、構成、使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を通じて OpenClaw に接続します。Plugin は Gateway 上の Webhook
受信側として動作し、認証には channel access token + channel secret を使用します。

ステータス: 読み込み可能な Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
messages、template messages、クイック返信をサポートします。リアクションとスレッドは
サポートされません。

## インストール

チャネルを設定する前に LINE をインストールします。

```bash
openclaw plugins install @openclaw/line
```

ローカル作業コピー（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. LINE Developers アカウントを作成し、Console を開きます。
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Gateway エンドポイントの Webhook URL を設定します（HTTPS が必要です）。

```
https://gateway-host/line/webhook
```

Gateway は LINE からの Webhook 検証（GET）に応答し、署名とペイロードの検証直後に署名済みの
受信イベント（POST）を確認します。エージェントによる処理は非同期で続行されます。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに合わせて URL を更新してください。

セキュリティ上の注意:

- LINE の署名検証はリクエスト本文に依存するため（未加工の本文に対する HMAC）、OpenClaw は検証前の認証時に厳格な本文サイズ制限とタイムアウトを適用します。
- OpenClaw は検証済みの未加工リクエストバイトから Webhook イベントを処理します。上流のミドルウェアで変換された `req.body` の値は、署名の整合性を保つために無視されます。

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

オープンなダイレクトメッセージの構成:

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

環境変数（デフォルトアカウントのみ）:

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

`tokenFile` と `secretFile` は通常ファイルを指している必要があります。シンボリックリンクは拒否されます。

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

ダイレクトメッセージはデフォルトでペアリングが必要です。不明な送信者にはペアリングコードが渡され、その
メッセージは承認されるまで無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ダイレクトメッセージを許可する LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループで許可する LINE ユーザー ID
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、グループの `allowFrom` から `accessGroup:<name>` で参照できます。
- runtime に関する注意: `channels.line` が完全に存在しない場合、runtime はグループチェックで `groupPolicy="allowlist"` に戻ります（`channels.defaults.groupPolicy` が設定されている場合でも）。

LINE ID は大文字と小文字を区別します。有効な ID は次の形式です。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージの動作

- テキストは 5000 文字ごとに分割されます。
- Markdown の書式は削除されます。コードブロックとテーブルは可能な場合 Flex
  cards に変換されます。
- ストリーミング応答はバッファされます。エージェントの動作中、LINE は読み込みアニメーションとともに完全な断片を受け取ります。
- メディアのダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で制限されます。
- 受信メディアは、エージェントへ渡される前に `~/.openclaw/media/inbound/` に保存されます。これは他の組み込みチャネル Plugin
  が使用する共通メディアストレージと同じです。

## チャネルデータ（拡張メッセージ）

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

LINE Plugin には Flex messages のプリセット用 `/card` コマンドも含まれています。

```
/card info "Welcome" "Thanks for joining!"
```

## ACP サポート

LINE は ACP（Agent Communication Protocol）の会話バインディングをサポートします。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションへバインドします。
- 構成済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャネルと同じように LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントのメッセージツールを通じて画像、動画、音声ファイルの送信をサポートします。メディアは LINE 固有の配信パスを通じて送信され、適切なプレビュー処理と追跡が行われます。

- **画像**: プレビューを自動生成して LINE の画像メッセージとして送信されます。
- **動画**: 明示的なプレビュー処理とコンテンツタイプ処理付きで送信されます。
- **音声**: LINE の音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前に宛先ホスト名を検証し、local loopback、link-local、プライベートネットワーク内の宛先を拒否します。

LINE 固有のパスが利用できない場合、共通のメディア送信は画像のみ既存のルートにフォールバックします。

## トラブルシューティング

- **Webhook 検証に失敗する:** Webhook URL が HTTPS を使用していること、および
  `channelSecret` が LINE console と一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致していること、
  かつ Gateway が LINE から到達可能であることを確認してください。
- **メディアのダウンロードエラー:** メディアがデフォルトの上限を超える場合は、
  `channels.line.mediaMaxMb` を増やしてください。

## 関連項目

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — ダイレクトメッセージの認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制限
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと防御強化
