---
read_when:
    - OpenClaw を LINE に接続したい場合
    - LINE Webhook と認証情報の設定が必要です
    - LINE 固有のメッセージオプションを使用したい場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: 行
x-i18n:
    generated_at: "2026-04-30T04:59:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。Plugin は Gateway 上で Webhook
レシーバーとして動作し、認証にはチャネルアクセストークン + チャネルシークレットを使用します。

ステータス: 同梱Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
メッセージ、テンプレートメッセージ、クイック返信に対応しています。リアクションとスレッドには
対応していません。

## 同梱Plugin

LINE は現在の OpenClaw リリースでは同梱Pluginとして提供されているため、通常の
パッケージ版ビルドでは個別のインストールは不要です。

古いビルド、または LINE を除外したカスタムインストールを使用している場合は、
公開されている現在の npm パッケージをインストールしてください。

```bash
openclaw plugins install @openclaw/line
```

npm が OpenClaw 所有のパッケージを非推奨または見つからないものとして報告する場合は、
npm パッケージの提供が追いつくまで、現在のパッケージ版 OpenClaw ビルドまたはローカルチェックアウトを使用してください。

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers アカウントを作成し、Console を開きます。
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway エンドポイントに設定します（HTTPS 必須）。

```
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証（GET）と受信イベント（POST）に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに合わせて URL を更新してください。

セキュリティに関する注意:

- LINE の署名検証は本文に依存するため（raw body に対する HMAC）、OpenClaw は検証前に厳格な事前認証本文制限とタイムアウトを適用します。
- OpenClaw は、検証済みの raw リクエストバイトから Webhook イベントを処理します。上流ミドルウェアで変換された `req.body` 値は、署名の完全性を保つため無視されます。

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

ダイレクトメッセージのデフォルトはペアリングです。不明な送信者にはペアリングコードが送られ、
承認されるまでメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM で許可リストに登録された LINE ユーザー ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループで許可リストに登録された LINE ユーザー ID
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- ランタイムに関する注意: `channels.line` が完全に存在しない場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

LINE ID は大文字と小文字が区別されます。有効な ID は次の形式です。

- ユーザー: `U` + 32 個の 16 進文字
- グループ: `C` + 32 個の 16 進文字
- ルーム: `R` + 32 個の 16 進文字

## メッセージの動作

- テキストは 5000 文字で分割されます。
- Markdown 書式は除去されます。コードブロックとテーブルは、可能な場合 Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの処理中、LINE は読み込み
  アニメーション付きで完全なチャンクを受信します。
- メディアダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で上限が設定されます。
- 受信メディアは、エージェントに渡される前に `~/.openclaw/media/inbound/` に保存され、
  他の同梱チャネルPluginで使用される共有メディアストアと一致します。

## チャネルデータ（リッチメッセージ）

`channelData.line` を使用して、クイック返信、位置情報、Flex カード、テンプレート
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

LINE Plugin には、Flex メッセージプリセット用の `/card` コマンドも同梱されています。

```
/card info "Welcome" "Thanks for joining!"
```

## ACP サポート

LINE は ACP（Agent Communication Protocol）会話バインディングに対応しています。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングとアクティブな会話バインド ACP セッションは、他の会話チャネルと同様に LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントメッセージツールを通じた画像、動画、音声ファイルの送信に対応しています。メディアは、適切なプレビューと追跡処理を備えた LINE 固有の配信パスを介して送信されます。

- **画像**: 自動プレビュー生成付きの LINE 画像メッセージとして送信されます。
- **動画**: 明示的なプレビューと content-type 処理付きで送信されます。
- **音声**: LINE 音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前に対象ホスト名を検証し、loopback、link-local、private-network の対象を拒否します。

汎用メディア送信は、LINE 固有のパスが利用できない場合、既存の画像専用ルートにフォールバックします。

## トラブルシューティング

- **Webhook 検証が失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE Console と一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致しており、
  Gateway が LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト上限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [チャネル概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化対策
