---
read_when:
    - OpenClawをLINEに接続したい
    - LINE Webhook + 認証情報の設定が必要です
    - LINE 固有のメッセージオプションが必要な場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-05-02T20:41:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。この Plugin は Gateway 上で Webhook
受信側として動作し、認証にチャネルアクセストークン + チャネルシークレットを使用します。

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
5. Webhook URL を Gateway エンドポイントに設定します (HTTPS 必須):

```
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証 (GET) と受信イベント (POST) に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新します。

セキュリティ上の注意:

- LINE の署名検証は本文に依存します (生の本文に対する HMAC) ため、OpenClaw は検証前に厳格な事前認証本文サイズ制限とタイムアウトを適用します。
- OpenClaw は検証済みの生リクエストバイトから Webhook イベントを処理します。署名の整合性を保つため、上流ミドルウェアによって変換された `req.body` の値は無視されます。

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

ダイレクトメッセージのデフォルトはペアリングです。不明な送信者にはペアリングコードが送られ、
承認されるまでそのメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM 用に許可リスト登録された LINE ユーザー ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用に許可リスト登録された LINE ユーザー ID
- グループごとの上書き: `channels.line.groups.<groupId>.allowFrom`
- ランタイムの注意: `channels.line` が完全に存在しない場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されていても同様です)。

LINE ID は大文字と小文字が区別されます。有効な ID は次の形式です:

- ユーザー: `U` + 32 文字の 16 進数
- グループ: `C` + 32 文字の 16 進数
- ルーム: `R` + 32 文字の 16 進数

## メッセージの動作

- テキストは 5000 文字で分割されます。
- Markdown 書式は削除されます。コードブロックと表は、可能な場合は Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの作業中、LINE は読み込み
  アニメーション付きで完全なチャンクを受け取ります。
- メディアのダウンロードは `channels.line.mediaMaxMb` (デフォルト 10) で上限設定されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` 配下に保存され、
  他のバンドル済みチャネル Plugin が使用する共有メディアストアと一致します。

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

LINE Plugin には Flex メッセージプリセット用の `/card` コマンドも含まれています:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 対応

LINE は ACP (Agent Communication Protocol) 会話バインディングに対応しています:

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャネルと同様に LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントメッセージツールを通じた画像、動画、音声ファイルの送信に対応しています。メディアは、適切なプレビューと追跡処理を伴う LINE 固有の配信パスで送信されます:

- **画像**: 自動プレビュー生成付きの LINE 画像メッセージとして送信されます。
- **動画**: 明示的なプレビューとコンテンツタイプ処理付きで送信されます。
- **音声**: LINE 音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前にターゲットホスト名を検証し、ループバック、リンクローカル、プライベートネットワークのターゲットを拒否します。

LINE 固有のパスが利用できない場合、汎用メディア送信は既存の画像専用ルートにフォールバックします。

## トラブルシューティング

- **Webhook 検証が失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE Console と一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、
  Gateway が LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト上限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [チャネル概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化対策
