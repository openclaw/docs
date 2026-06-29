---
read_when:
    - OpenClaw を LINE に接続したい場合
    - LINE Webhook + 認証情報のセットアップが必要です
    - LINE 固有のメッセージオプションが必要な場合
summary: LINE Messaging API Plugin のセットアップ、設定、使用方法
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE は、LINE Messaging API を介して OpenClaw に接続します。Plugin は Gateway 上で Webhook
レシーバーとして動作し、認証には channel access token + channel secret を使用します。

状態: ダウンロード可能な Plugin。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex
messages、テンプレートメッセージ、クイック返信に対応しています。リアクションとスレッドには
対応していません。

## インストール

チャネルを構成する前に LINE をインストールします。

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト（git repo から実行している場合）:

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## セットアップ

1. LINE Developers account を作成し、Console を開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider を作成（または選択）し、**Messaging API** channel を追加します。
3. channel settings から **Channel access token** と **Channel secret** をコピーします。
4. Messaging API settings で **Use webhook** を有効にします。
5. Webhook URL を Gateway endpoint に設定します（HTTPS が必要です）:

```
https://gateway-host/line/webhook
```

Gateway は LINE の Webhook verification (GET) に応答し、signature と payload validation の直後に signed
inbound events (POST) を受け付けます。agent
processing は非同期で継続します。
custom path が必要な場合は、`channels.line.webhookPath` または
`channels.line.accounts.<id>.webhookPath` を設定し、それに合わせて URL を更新します。

セキュリティメモ:

- LINE signature verification は body-dependent です（raw body に対する HMAC）。そのため OpenClaw は verification の前に厳格な pre-auth body limits と timeout を適用します。
- OpenClaw は verified raw request bytes から Webhook events を処理します。signature-integrity safety のため、upstream middleware-transformed `req.body` values は無視されます。

## 構成

最小 config:

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

公開 DM config:

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

環境変数（default account のみ）:

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files:

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

`tokenFile` と `secretFile` は regular files を指している必要があります。Symlinks は拒否されます。

複数の accounts:

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

ダイレクトメッセージは default で pairing になります。不明な senders には pairing code が渡され、その
messages は approved されるまで無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM 用の allowlisted LINE user IDs。`dmPolicy: "open"` には `["*"]` が必要です
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: groups 用の allowlisted LINE user IDs
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups は、`allowFrom`、`groupAllowFrom`、グループごとの `allowFrom` から `accessGroup:<name>` で参照できます。
- Runtime note: `channels.line` が完全に missing の場合、runtime は group checks に対して `groupPolicy="allowlist"` に fallback します（`channels.defaults.groupPolicy` が設定されている場合でも）。

LINE IDs は case-sensitive です。有効な IDs は次のようになります。

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## メッセージ動作

- Text は 5000 characters ごとに chunks に分割されます。
- Markdown formatting は削除されます。code blocks と tables は可能な場合 Flex
  cards に変換されます。
- Streaming responses は buffered されます。agent の作業中、LINE には loading
  animation とともに完全な chunks が届きます。
- Media downloads は `channels.line.mediaMaxMb`（default 10）で capped されます。
- Inbound media は agent に渡される前に `~/.openclaw/media/inbound/` 配下に save されます。
  これは他の bundled channel
  plugins が使用する shared media store と一致します。

## Channel data（リッチメッセージ）

クイック返信、位置情報、Flex cards、またはテンプレート
メッセージを送るには `channelData.line` を使用します。

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

LINE Plugin は Flex message presets 用に `/card` command も ship します。

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 対応

LINE は ACP（Agent Communication Protocol）conversation bindings をサポートします。

- `/acp spawn <agent> --bind here` は child thread を作成せずに current LINE chat を ACP session に bind します。
- Configured ACP bindings と active conversation-bound ACP sessions は、LINE 上で他の conversation channels と同様に動作します。

詳細は [ACP agents](/ja-JP/tools/acp-agents) を参照してください。

## 送信メディア

LINE Plugin は agent message tool を介した images、videos、audio files の送信をサポートします。Media は appropriate preview と tracking handling を伴って LINE-specific delivery path 経由で送信されます。

- **Images**: automatic preview generation を伴って LINE image messages として送信されます。
- **Videos**: explicit preview と content-type handling を伴って送信されます。
- **Audio**: LINE audio messages として送信されます。

Outbound media URLs は public HTTPS URLs である必要があります。OpenClaw は URL を LINE に渡す前に target hostname を validate し、loopback、link-local、private-network targets を拒否します。

Generic media sends は、LINE-specific path が利用できない場合、existing image-only route に fallback します。

## トラブルシューティング

- **Webhook verification fails:** Webhook URL が HTTPS であり、
  `channelSecret` が LINE console と一致していることを確認してください。
- **No inbound events:** Webhook path が `channels.line.webhookPath` と一致しており、
  Gateway が LINE から到達可能であることを確認してください。
- **Media download errors:** media が default limit を超える場合は、`channels.line.mediaMaxMb` を増やしてください。

## 関連

- [Channels Overview](/ja-JP/channels) — 対応しているすべての channels
- [Pairing](/ja-JP/channels/pairing) — DM authentication と pairing flow
- [Groups](/ja-JP/channels/groups) — group chat behavior と mention gating
- [Channel Routing](/ja-JP/channels/channel-routing) — messages の session routing
- [Security](/ja-JP/gateway/security) — access model と hardening
