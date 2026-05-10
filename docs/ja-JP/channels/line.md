---
read_when:
    - OpenClaw を LINE に接続したい
    - LINE Webhook + 認証情報の設定が必要です
    - LINE固有のメッセージオプションが必要な場合
summary: LINE Messaging API プラグインのセットアップ、設定、使用方法
title: 行
x-i18n:
    generated_at: "2026-05-10T19:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。この Plugin は Gateway 上で Webhook
受信側として実行され、認証にはチャネルアクセストークンとチャネルシークレットを使用します。

ステータス: ダウンロード可能な Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
メッセージ、テンプレートメッセージ、クイックリプライに対応しています。リアクションとスレッドには
対応していません。

## インストール

チャネルを設定する前に LINE をインストールします。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers アカウントを作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成 (または選択) し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway エンドポイントに設定します (HTTPS が必要です):

```
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証 (GET) と受信イベント (POST) に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新します。

セキュリティ上の注意:

- LINE の署名検証は本文に依存します (raw body に対する HMAC) 。そのため、OpenClaw は検証前に厳格な認証前本文サイズ制限とタイムアウトを適用します。
- OpenClaw は、検証済みの raw request バイトから Webhook イベントを処理します。上流ミドルウェアで変換された `req.body` 値は、署名の完全性を守るために無視されます。

## 設定

最小設定:

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

公開 DM 設定:

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

ダイレクトメッセージはデフォルトでペアリングになります。不明な送信者にはペアリングコードが発行され、その
メッセージは承認されるまで無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM 用に許可リスト登録された LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用に許可リスト登録された LINE ユーザー ID
- グループ単位のオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、およびグループ単位の `allowFrom` から `accessGroup:<name>` で参照できます。
- ランタイム注記: `channels.line` が完全に存在しない場合、ランタイムはグループチェック時に `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

LINE ID は大文字と小文字が区別されます。有効な ID は次の形式です:

- ユーザー: `U` + 32 個の 16 進文字
- グループ: `C` + 32 個の 16 進文字
- ルーム: `R` + 32 個の 16 進文字

## メッセージの動作

- テキストは 5000 文字で分割されます。
- Markdown 書式は取り除かれます。コードブロックとテーブルは、可能な場合 Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの作業中、LINE はローディング
  アニメーション付きで完全なチャンクを受信します。
- メディアのダウンロードは `channels.line.mediaMaxMb` (デフォルト 10) で上限が設定されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` 配下に保存され、
  他の同梱チャネル Plugin が使用する共有メディアストアと一致します。

## チャネルデータ (リッチメッセージ)

`channelData.line` を使用して、クイックリプライ、位置情報、Flex カード、またはテンプレート
メッセージを送信します。

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

LINE Plugin には、Flex メッセージのプリセット用に `/card` コマンドも同梱されています:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 対応

LINE は ACP (Agent Communication Protocol) の会話バインディングに対応しています:

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、有効な会話バインド ACP セッションは、他の会話チャネルと同様に LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントメッセージツールを通じた画像、動画、音声ファイルの送信に対応しています。メディアは LINE 固有の配信パスを通じて送信され、適切なプレビューと追跡処理が行われます:

- **画像**: 自動プレビュー生成付きの LINE 画像メッセージとして送信されます。
- **動画**: 明示的なプレビューと content-type 処理付きで送信されます。
- **音声**: LINE 音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前に対象ホスト名を検証し、local loopback、リンクローカル、プライベートネットワークの宛先を拒否します。

汎用メディア送信は、LINE 固有のパスが利用できない場合、既存の画像専用ルートにフォールバックします。

## トラブルシューティング

- **Webhook 検証に失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE コンソールと一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致しており、
  Gateway が LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト制限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [チャネル概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
