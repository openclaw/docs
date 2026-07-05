---
read_when:
    - OpenClaw を LINE に接続したい
    - LINE Webhook と認証情報のセットアップが必要です
    - LINE固有のメッセージオプションを使用したい場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-07-05T11:02:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abad928180a8b5590ab32a28688531214b78eaee104e6b82f068ae48e2e930f0
    source_path: channels/line.md
    workflow: 16
---

LINE は LINE Messaging API 経由で OpenClaw に接続します。この Plugin は Gateway 上の Webhook
レシーバーとして動作し、認証にチャンネルアクセストークン + チャンネルシークレットを使用します。

状態: 公式 Plugin、別途インストール。ダイレクトメッセージ、グループチャット、メディア、
位置情報、Flex メッセージ、テンプレートメッセージ、クイックリプライに対応しています。
リアクションとスレッドには対応していません。

## インストール

チャンネルを設定する前に LINE をインストールします。

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
2. Provider を作成 (または選択) し、**Messaging API** チャンネルを追加します。
3. チャンネル設定から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API 設定で **Use webhook** を有効にします。
5. Webhook URL を Gateway エンドポイントに設定します (HTTPS 必須):

```text
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook 検証 (GET) に応答し、署名とペイロードの検証直後に署名済みの
受信イベント (POST) を確認応答します。エージェント処理は非同期で継続します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新します。

セキュリティメモ:

- LINE の署名検証は本文に依存します (raw body に対する HMAC)。そのため OpenClaw は検証前に厳格な事前認証本文制限 (64 KB) と読み取りタイムアウトを適用します。
- OpenClaw は、検証済みの raw リクエストバイトから Webhook イベントを処理します。署名整合性の安全性のため、上流ミドルウェアで変換された `req.body` 値は無視されます。

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

ダイレクトメッセージはデフォルトでペアリングになります。不明な送信者にはペアリングコードが発行され、
承認されるまでそのメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト `pairing`)
- `channels.line.allowFrom`: DM の許可リストに含める LINE ユーザー ID。`dmPolicy: "open"` には `["*"]` が必要
- `channels.line.groupPolicy`: `allowlist | open | disabled` (デフォルト `allowlist`)
- `channels.line.groupAllowFrom`: グループの許可リストに含める LINE ユーザー ID
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom` (加えて `enabled`, `requireMention`, `systemPrompt`, `skills`)
- 静的な送信者アクセスグループは、`allowFrom`、`groupAllowFrom`、グループごとの `allowFrom` から `accessGroup:<name>` で参照できます。[アクセスグループ](/ja-JP/channels/access-groups) を参照してください。
- ランタイムメモ: `channels.line` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

LINE ID は大文字と小文字を区別します。有効な ID は次の形式です。

- ユーザー: `U` + 32 桁の 16 進文字
- グループ: `C` + 32 桁の 16 進文字
- ルーム: `R` + 32 桁の 16 進文字

## メッセージ動作

- テキストは 5000 文字で分割されます。
- Markdown 書式は取り除かれます。コードブロックとテーブルは可能な場合 Flex
  カードに変換されます。
- ストリーミング応答はバッファリングされます。エージェントが動作している間、LINE はローディング
  アニメーション付きで完全なチャンクを受信します。
- メディアダウンロードは `channels.line.mediaMaxMb` (デフォルト 10) によって上限が設定されます。
- 受信メディアはエージェントに渡される前に `~/.openclaw/media/inbound/` に保存され、
  他のチャンネル Plugin が使用する共有メディアストアと一致します。

## チャンネルデータ (リッチメッセージ)

`channelData.line` を使用して、クイックリプライ、位置情報、Flex カード、テンプレート
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

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP サポート

LINE は ACP (Agent Communication Protocol) 会話バインディングに対応しています。

- `/acp spawn <agent> --bind here` は、子スレッドを作成せずに現在の LINE チャットを ACP セッションにバインドします。
- 設定済みの ACP バインディングとアクティブな会話バインド ACP セッションは、他の会話チャンネルと同様に LINE で動作します。

詳細は [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は、エージェントメッセージツールを通じて画像、動画、音声を送信します。

- **画像**: LINE 画像メッセージとして送信されます。プレビュー画像はデフォルトでメディア URL になります。
- **動画**: プレビュー画像が必要です。`channelData.line.previewImageUrl` を画像 URL に設定します。
- **音声**: LINE 音声メッセージとして送信されます。`channelData.line.durationMs` が設定されていない限り、時間はデフォルトで 60 秒です。

メディア種別は、設定されている場合は `channelData.line.mediaKind` から取得されます。それ以外の場合は、
他の LINE オプションまたは URL ファイル接尾辞から推測され、フォールバックは画像になります。

送信メディア URL は、最大 2000 文字の公開 HTTPS URL である必要があります。OpenClaw は
URL を LINE に渡す前にターゲットホスト名を検証し、loopback、link-local、private-network ターゲットを拒否します。

LINE 固有のオプションなしの汎用メディア送信では、画像ルートが使用されます。

## トラブルシューティング

- **Webhook 検証に失敗する:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE コンソールと一致していることを確認してください。
- **受信イベントがない:** Webhook パスが `channels.line.webhookPath` と一致し、
  Gateway が LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト制限を超える場合は、
  `channels.line.mediaMaxMb` を引き上げてください。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
