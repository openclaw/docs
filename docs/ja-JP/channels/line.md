---
read_when:
    - OpenClaw を LINE に接続する
    - LINE Webhook と認証情報の設定が必要です
    - LINE 固有のメッセージオプションが必要な場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-06-27T10:37:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API 経由で OpenClaw に接続します。Plugin は Gateway 上の Webhook
レシーバーとして動作し、認証にはチャンネルアクセストークン + チャンネルシークレットを使用します。

ステータス: ダウンロード可能な Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
メッセージ、テンプレートメッセージ、クイックリプライに対応しています。リアクションとスレッドには
対応していません。

## インストール

チャンネルを設定する前に LINE をインストールします。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト (git リポジトリから実行している場合):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers アカウントを作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成 (または選択) し、**Messaging API** チャンネルを追加します。
3. チャンネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway エンドポイントに設定します (HTTPS 必須):

```
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証 (GET) に応答し、署名とペイロードの検証直後に署名済みの
受信イベント (POST) を確認応答します。エージェントの処理は非同期で継続します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに合わせて URL を更新します。

セキュリティ上の注意:

- LINE の署名検証は本文に依存するため (raw body に対する HMAC)、OpenClaw は検証前に厳格な事前認証本文サイズ制限とタイムアウトを適用します。
- OpenClaw は検証済みの raw リクエストバイト列から Webhook イベントを処理します。上流ミドルウェアで変換された `req.body` の値は、署名の完全性を保つために無視されます。

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

ダイレクトメッセージのデフォルトはペアリングです。不明な送信者にはペアリングコードが発行され、承認されるまで
そのメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM 用に許可リスト登録された LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用に許可リスト登録された LINE ユーザー ID
- グループごとの上書き: `channels.line.groups.<groupId>.allowFrom`
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、グループごとの `allowFrom` から `accessGroup:<name>` で参照できます。
- ランタイム上の注意: `channels.line` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

LINE ID は大文字と小文字が区別されます。有効な ID は次の形式です:

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージの挙動

- テキストは 5000 文字で分割されます。
- Markdown 書式は除去されます。コードブロックと表は、可能な場合 Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントの作業中、LINE は読み込み
  アニメーション付きで完全なチャンクを受信します。
- メディアのダウンロードは `channels.line.mediaMaxMb` (デフォルト 10) で制限されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` 配下に保存され、
  他のバンドル済みチャンネル Plugin が使用する共有メディアストアと一致します。

## チャンネルデータ (リッチメッセージ)

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

LINE Plugin には Flex メッセージプリセット用の `/card` コマンドも同梱されています:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 対応

LINE は ACP (Agent Communication Protocol) の会話バインディングに対応しています。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングと、アクティブな会話バインド ACP セッションは、他の会話チャンネルと同様に LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントメッセージツールを通じた画像、動画、音声ファイルの送信に対応しています。メディアは、適切なプレビューとトラッキング処理を伴う LINE 固有の配信パスで送信されます。

- **画像**: 自動プレビュー生成付きの LINE 画像メッセージとして送信されます。
- **動画**: 明示的なプレビューとコンテンツタイプ処理付きで送信されます。
- **音声**: LINE 音声メッセージとして送信されます。

送信メディア URL は公開 HTTPS URL である必要があります。OpenClaw は URL を LINE に渡す前に対象ホスト名を検証し、loopback、link-local、private-network のターゲットを拒否します。

汎用メディア送信は、LINE 固有のパスが利用できない場合、既存の画像専用ルートにフォールバックします。

## トラブルシューティング

- **Webhook 検証に失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE Console と一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、
  Gateway が LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト上限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
