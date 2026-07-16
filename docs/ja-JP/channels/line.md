---
read_when:
    - OpenClawをLINEに接続する場合
    - LINE Webhook と認証情報の設定が必要です
    - LINE 固有のメッセージオプションが必要な場合
summary: LINE Messaging API Pluginのセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-07-16T11:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。Plugin は Gateway 上で Webhook
受信側として動作し、チャネルアクセストークンとチャネルシークレットを
認証に使用します。

ステータス: 公式 Plugin。別途インストールが必要です。ダイレクトメッセージ、グループチャット、メディア、
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

1. LINE Developers アカウントを作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway エンドポイントに設定します（HTTPS が必須です）:

```text
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証（GET）に応答し、署名とペイロードの検証直後に
署名済みの受信イベント（POST）を確認応答します。エージェントによる
処理は非同期で続行されます。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新します。

セキュリティに関する注意:

- LINE の署名検証は本文に依存するため（生の本文に対する HMAC）、OpenClaw は検証前に厳格な認証前本文サイズ上限（64 KB）と読み取りタイムアウトを適用します。
- OpenClaw は、検証済みの生のリクエストバイトから Webhook イベントを処理します。上流ミドルウェアによって変換された `req.body` 値は、署名の完全性を保護するため無視されます。

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

公開 DM の設定:

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

`tokenFile` と `secretFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます。
インライン設定値はファイルより優先されます。環境変数はデフォルトアカウントの最後のフォールバックです。

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

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト `pairing`）
- `channels.line.allowFrom`: DM で許可する LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`（デフォルト `allowlist`）
- `channels.line.groupAllowFrom`: グループで許可する LINE ユーザー ID。DM の `allowFrom` エントリによってグループ送信者が許可されることはありません
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`（さらに `enabled`、`requireMention`、`systemPrompt`、`skills`）。`groupPolicy: "allowlist"` を使用する場合は、
  `groupAllowFrom` またはグループごとの `allowFrom` を設定します。グループ許可リストが空の場合、DM が公開されていてもグループメッセージはブロックされます。
- 静的な送信者アクセスグループは、`accessGroup:<name>` を使用して `allowFrom`、`groupAllowFrom`、およびグループごとの `allowFrom` から参照できます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- 実行時の注意: `channels.line` が完全に存在しない場合、実行時はグループの確認に `groupPolicy="allowlist"` をフォールバックとして使用します（`channels.defaults.groupPolicy` が設定されている場合でも）。

LINE ID は大文字と小文字を区別します。有効な ID は次の形式です:

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージの動作

- テキストは 5000 文字ごとに分割されます。
- Markdown の書式は除去されます。コードブロックと表は、可能な場合は Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの処理中は読み込み
  アニメーションが表示され、LINE は完全なチャンクを受信します。
- メディアのダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で上限が設定されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` 以下に保存され、
  他のチャネル Plugin が使用する共有メディアストアと同じ動作になります。

## チャネルデータ（リッチメッセージ）

クイックリプライ、位置情報、Flex カード、またはテンプレート
メッセージを送信するには `channelData.line` を使用します。

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

LINE Plugin には、Flex メッセージのプリセット用の `/card` コマンドも含まれています:

```text
/card info "ようこそ" "ご参加ありがとうございます！"
```

## ACP 対応

LINE は ACP（Agent Communication Protocol）の会話バインディングに対応しています:

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャネルと同様に LINE でも動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

## 送信メディア

LINE Plugin は、エージェントのメッセージツールを通じて画像、動画、音声を送信します:

- **画像**: LINE の画像メッセージとして送信されます。プレビュー画像のデフォルトはメディア URL です。
- **動画**: プレビュー画像が必要です。`channelData.line.previewImageUrl` に画像 URL を設定します。
- **音声**: LINE の音声メッセージとして送信されます。`channelData.line.durationMs` が設定されていない場合、再生時間のデフォルトは 60 秒です。

メディアの種類は、設定されている場合は `channelData.line.mediaKind` から取得されます。それ以外の場合は
他の LINE オプションまたは URL のファイル拡張子から推測され、フォールバックは画像です。

送信メディア URL は、2000 文字以内の公開 HTTPS URL である必要があります。OpenClaw は
URL を LINE に渡す前に対象ホスト名を検証し、ループバック、
リンクローカル、およびプライベートネットワークの宛先を拒否します。

LINE 固有のオプションを指定しない汎用メディア送信では、画像ルートが使用されます。

## トラブルシューティング

- **Webhook の検証に失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE Console と一致していることを確認します。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、
  Gateway に LINE から到達できることを確認します。
- **メディアのダウンロードエラー:** メディアがデフォルト上限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げます。

## 関連項目

- [チャネルの概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化策
