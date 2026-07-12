---
read_when:
    - OpenClaw を LINE に接続したい場合
    - LINE Webhook と認証情報の設定が必要です
    - LINE 固有のメッセージオプションを使用したい場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-07-11T22:00:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API を介して OpenClaw に接続します。Plugin は Gateway 上で Webhook
レシーバーとして動作し、チャンネルアクセストークンとチャンネルシークレットを
認証に使用します。

ステータス: 公式 Plugin、別途インストールが必要です。ダイレクトメッセージ、グループチャット、メディア、
位置情報、Flex メッセージ、テンプレートメッセージ、クイックリプライに対応しています。
リアクションとスレッドには対応していません。

## インストール

チャンネルを設定する前に LINE をインストールします。

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
2. Provider を作成（または選択）し、**Messaging API** チャンネルを追加します。
3. チャンネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway のエンドポイントに設定します（HTTPS が必要です）。

```text
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証（GET）に応答し、署名とペイロードの検証直後に署名済みの
受信イベント（POST）を受領確認します。エージェントによる処理は非同期で続行されます。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新します。

セキュリティ上の注意:

- LINE の署名検証は本文に依存するため（生の本文に対する HMAC）、OpenClaw は検証前に厳格な認証前本文サイズ制限（64 KB）と読み取りタイムアウトを適用します。
- OpenClaw は検証済みの生リクエストバイトから Webhook イベントを処理します。署名の完全性を保つため、上流ミドルウェアによって変換された `req.body` の値は無視されます。

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

`tokenFile` と `secretFile` は通常ファイルを指している必要があります。シンボリックリンクは拒否されます。
インライン設定値はファイルより優先されます。環境変数はデフォルトアカウントに対する最後のフォールバックです。

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
- `channels.line.allowFrom`: DM で許可する LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`（デフォルトは `allowlist`）
- `channels.line.groupAllowFrom`: グループで許可する LINE ユーザー ID
- グループごとの上書き: `channels.line.groups.<groupId>.allowFrom`（加えて `enabled`、`requireMention`、`systemPrompt`、`skills`）
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、グループごとの `allowFrom` から `accessGroup:<name>` で参照できます。[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。
- ランタイム上の注意: `channels.line` が完全に存在しない場合、グループチェックではランタイムが `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

LINE ID では大文字と小文字が区別されます。有効な ID は次の形式です。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージの動作

- テキストは 5000 文字ごとに分割されます。
- Markdown 書式は除去されます。コードブロックとテーブルは、可能な場合は Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの処理中は読み込み
  アニメーションが表示され、LINE には完全なチャンクが送信されます。
- メディアのダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で上限が設定されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` に保存され、
  他のチャンネル Plugin が使用する共有メディアストアと同じ場所を使用します。

## チャンネルデータ（リッチメッセージ）

クイックリプライ、位置情報、Flex カード、テンプレート
メッセージを送信するには `channelData.line` を使用します。

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
        contents: {/* Flex payload */},
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

LINE Plugin には Flex メッセージのプリセット用 `/card` コマンドも含まれています。

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP 対応

LINE は ACP（エージェント通信プロトコル）の会話バインディングに対応しています。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、会話にバインドされたアクティブな ACP セッションは、他の会話チャンネルと同様に LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

## 送信メディア

LINE Plugin はエージェントのメッセージツールを介して画像、動画、音声を送信します。

- **画像**: LINE の画像メッセージとして送信されます。プレビュー画像のデフォルトはメディア URL です。
- **動画**: プレビュー画像が必要です。`channelData.line.previewImageUrl` に画像 URL を設定します。
- **音声**: LINE の音声メッセージとして送信されます。`channelData.line.durationMs` が設定されていない場合、再生時間のデフォルトは 60 秒です。

メディア種別は、設定されている場合は `channelData.line.mediaKind` から取得されます。それ以外の場合は
他の LINE オプションまたは URL のファイル拡張子から推測され、フォールバックとして画像が使用されます。

送信メディア URL は、2000 文字以内の公開 HTTPS URL である必要があります。OpenClaw は
URL を LINE に渡す前に対象ホスト名を検証し、ループバック、リンクローカル、
プライベートネットワークの対象を拒否します。

LINE 固有のオプションを指定しない汎用メディア送信では、画像の経路が使用されます。

## トラブルシューティング

- **Webhook の検証に失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE Console と一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、
  Gateway に LINE から到達できることを確認してください。
- **メディアのダウンロードエラー:** メディアがデフォルト上限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連項目

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
