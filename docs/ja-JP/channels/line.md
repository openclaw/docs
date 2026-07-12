---
read_when:
    - OpenClawをLINEに接続する場合
    - LINE Webhook と認証情報の設定が必要です
    - LINE 固有のメッセージオプションを使用したい場合
summary: LINE Messaging API Pluginのセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-07-12T14:18:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。Plugin は Gateway 上で Webhook
レシーバーとして動作し、認証にチャネルアクセストークンとチャネルシークレットを
使用します。

ステータス: 公式 Plugin、個別にインストール。ダイレクトメッセージ、グループチャット、メディア、
位置情報、Flex メッセージ、テンプレートメッセージ、クイックリプライに対応しています。
リアクションとスレッドには対応していません。

## インストール

チャネルを設定する前に LINE をインストールします。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers アカウントを作成し、Console を開きます。
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway のエンドポイントに設定します（HTTPS 必須）。

```text
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証（GET）に応答し、署名とペイロードを検証した直後に
署名付き受信イベント（POST）を確認応答します。エージェントによる処理は
非同期で継続します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新します。

セキュリティ上の注意:

- LINE の署名検証はボディに依存する（raw ボディに対する HMAC）ため、OpenClaw は検証前に厳格な認証前ボディ制限（64 KB）と読み取りタイムアウトを適用します。
- OpenClaw は、検証済みの raw リクエストバイトから Webhook イベントを処理します。上流ミドルウェアによって変換された `req.body` の値は、署名の完全性を保つため無視されます。

## 設定

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

公開 DM 構成:

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

トークン／シークレットファイル:

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
インライン構成値がファイルより優先されます。環境変数はデフォルトアカウントで最後に使用されるフォールバックです。

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

ダイレクトメッセージのデフォルトはペアリングです。不明な送信者にはペアリングコードが送られ、
承認されるまでそのメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルトは `pairing`）
- `channels.line.allowFrom`: DM で許可される LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要
- `channels.line.groupPolicy`: `allowlist | open | disabled`（デフォルトは `allowlist`）
- `channels.line.groupAllowFrom`: グループで許可される LINE ユーザー ID
- グループ単位の上書き: `channels.line.groups.<groupId>.allowFrom`（加えて `enabled`、`requireMention`、`systemPrompt`、`skills`）
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、およびグループ単位の `allowFrom` から `accessGroup:<name>` で参照できます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- ランタイム上の注意: `channels.line` が完全に存在しない場合、グループチェックではランタイムが `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

LINE ID では大文字と小文字が区別されます。有効な ID の形式は次のとおりです。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージの動作

- テキストは 5000 文字ごとに分割されます。
- Markdown の書式は除去されます。可能な場合、コードブロックと表は Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの処理中は読み込み
  アニメーションが表示され、LINE には完全なチャンクが送信されます。
- メディアのダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で制限されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` 以下に
  保存され、他のチャネル Plugin が使用する共有メディアストアと一致します。

## チャネルデータ（リッチメッセージ）

クイックリプライ、位置情報、Flex カード、テンプレートメッセージを送信するには
`channelData.line` を使用します。

```json5
{
  text: "こちらです",
  channelData: {
    line: {
      quickReplies: ["ステータス", "ヘルプ"],
      location: {
        title: "オフィス",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "ステータスカード",
        contents: {/* Flex ペイロード */},
      },
      templateMessage: {
        type: "confirm",
        text: "続行しますか？",
        confirmLabel: "はい",
        confirmData: "yes",
        cancelLabel: "いいえ",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin には、Flex メッセージのプリセット用 `/card` コマンドも含まれています。

```text
/card info "ようこそ" "ご参加ありがとうございます！"
```

## ACP 対応

LINE は ACP（Agent Communication Protocol）の会話バインディングに対応しています。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 構成済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャネルと同様に LINE でも動作します。

詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

## 送信メディア

LINE Plugin は、エージェントのメッセージツールを介して画像、動画、音声を送信します。

- **画像**: LINE の画像メッセージとして送信されます。プレビュー画像のデフォルトはメディア URL です。
- **動画**: プレビュー画像が必要です。`channelData.line.previewImageUrl` に画像 URL を設定します。
- **音声**: LINE の音声メッセージとして送信されます。`channelData.line.durationMs` が設定されていない場合、再生時間のデフォルトは 60 秒です。

メディア種別は、設定されている場合は `channelData.line.mediaKind` から取得されます。それ以外の場合は
他の LINE オプションまたは URL のファイル拡張子から推測され、画像がフォールバックになります。

送信メディア URL は、最大 2000 文字の公開 HTTPS URL である必要があります。OpenClaw は
URL を LINE に渡す前に対象ホスト名を検証し、ループバック、リンクローカル、
プライベートネットワークの対象を拒否します。

LINE 固有のオプションを指定しない汎用メディア送信では、画像ルートが使用されます。

## トラブルシューティング

- **Webhook の検証に失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE Console と一致することを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、
  LINE から Gateway に到達できることを確認してください。
- **メディアのダウンロードエラー:** メディアがデフォルト制限を超える場合は、
  `channels.line.mediaMaxMb` を増やしてください。

## 関連項目

- [チャネルの概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによる制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
