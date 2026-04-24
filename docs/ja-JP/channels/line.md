---
read_when:
    - OpenClaw を LINE に接続したい場合
    - LINE の Webhook と認証情報の設定が必要な場合
    - LINE 固有のメッセージオプションが必要な場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-04-24T04:46:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE は LINE Messaging API を介して OpenClaw に接続します。この Plugin は Gateway 上で Webhook レシーバーとして動作し、認証にはチャネルアクセストークンとチャネルシークレットを使用します。

ステータス: バンドル済み Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex メッセージ、テンプレートメッセージ、クイックリプライをサポートします。リアクションとスレッドはサポートされていません。

## バンドル済み Plugin

LINE は現在の OpenClaw リリースではバンドル済み Plugin として提供されるため、通常のパッケージ済みビルドでは別途インストールは不要です。

古いビルドまたは LINE を含まないカスタムインストールを使用している場合は、手動でインストールしてください。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers アカウントを作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** チャネルを追加します。
3. チャネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway エンドポイントに設定します（HTTPS 必須）:

```
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証（GET）と受信イベント（POST）に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新してください。

セキュリティに関する注意:

- LINE の署名検証はボディ依存です（生のボディに対する HMAC）そのため、OpenClaw は検証前に厳格な事前認証ボディ制限とタイムアウトを適用します。
- OpenClaw は、検証済みの生リクエストバイト列から Webhook イベントを処理します。上流ミドルウェアで変換された `req.body` の値は、署名整合性の安全性のため無視されます。

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

ダイレクトメッセージはデフォルトでペアリングです。未知の送信者にはペアリングコードが送られ、
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
- ランタイムに関する注意: `channels.line` が完全に存在しない場合、ランタイムはグループチェックに対して `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されていても）。

LINE ID は大文字小文字を区別します。有効な ID は次の形式です。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージの動作

- テキストは 5000 文字ごとに分割されます。
- Markdown 書式は削除されます。コードブロックとテーブルは、可能な場合は Flex カードに変換されます。
- ストリーミング応答はバッファされます。エージェントの処理中、LINE にはローディングアニメーション付きで完全なチャンクが送信されます。
- メディアダウンロードは `channels.line.mediaMaxMb`（デフォルト 10）で上限が設定されます。

## チャネルデータ（リッチメッセージ）

クイックリプライ、位置情報、Flex カード、テンプレートメッセージを送信するには `channelData.line` を使用します。

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

LINE Plugin には、Flex メッセージのプリセット用 `/card` コマンドも含まれています。

```
/card info "Welcome" "Thanks for joining!"
```

## ACP サポート

LINE は ACP（Agent Communication Protocol）の会話バインディングをサポートします。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、アクティブな会話バインド ACP セッションは、他の会話チャネルと同様に LINE 上で動作します。

詳細は [ACP agents](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントメッセージツールを通じた画像、動画、音声ファイルの送信をサポートします。メディアは適切なプレビューおよび追跡処理とともに、LINE 固有の配信経路で送信されます。

- **画像**: 自動プレビュー生成付きの LINE 画像メッセージとして送信されます。
- **動画**: 明示的なプレビューおよび content-type 処理付きで送信されます。
- **音声**: LINE 音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前に対象ホスト名を検証し、loopback、link-local、プライベートネットワークの対象を拒否します。

汎用メディア送信は、LINE 固有の経路が利用できない場合、既存の画像専用経路にフォールバックします。

## トラブルシューティング

- **Webhook 検証に失敗する:** Webhook URL が HTTPS であること、および `channelSecret` が LINE Console のものと一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致していること、および Gateway に LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルトの上限を超えている場合は、`channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
