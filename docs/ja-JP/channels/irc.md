---
read_when:
    - OpenClaw を IRC チャンネルまたはダイレクトメッセージに接続したい場合
    - IRC 許可リスト、グループポリシー、またはメンション制御を設定している
summary: IRC Plugin のセットアップ、アクセス制御、トラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-05-06T09:02:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7de49784dec1b6a21a5a65b298552c66ce82543e3f0a7075abedb442b4ebff7e
    source_path: channels/irc.md
    workflow: 16
---

IRC は、クラシックなチャンネル（`#room`）とダイレクトメッセージで OpenClaw を使いたい場合に使用します。
IRC はバンドルされた Plugin として同梱されていますが、メイン設定の `channels.irc` で構成します。

## クイックスタート

1. `~/.openclaw/openclaw.json` で IRC 設定を有効にします。
2. 少なくとも次を設定します。

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

ボットの調整には、プライベート IRC サーバーを推奨します。意図的に公開 IRC ネットワークを使う場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。ボットまたはスウォームのバックチャンネル通信には、推測しやすい公開チャンネルを避けてください。

3. Gateway を起動/再起動します。

```bash
openclaw gateway run
```

## セキュリティのデフォルト

- IRC は、OpenClaw のオペレーター管理フォワードプロキシルーティングの外側で raw TCP/TLS ソケットを使用します。すべての送信通信でそのフォワードプロキシを必須とするデプロイでは、直接の IRC 送信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` では、許可するチャンネルを定義するために `channels.irc.groups` を設定します。
- 平文トランスポートを意図的に受け入れる場合を除き、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRC チャンネルには 2 つの別々の「ゲート」があります。

1. **チャンネルアクセス**（`groupPolicy` + `groups`）: ボットがチャンネルからのメッセージをそもそも受け付けるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャンネルごとの `groups["#channel"].allowFrom`）: そのチャンネル内で誰がボットをトリガーできるか。

設定キー:

- DM 許可リスト（DM 送信者アクセス）: `channels.irc.allowFrom`
- グループ送信者許可リスト（チャンネル送信者アクセス）: `channels.irc.groupAllowFrom`
- チャンネルごとの制御（チャンネル + 送信者 + メンションルール）: `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` は未設定のチャンネルを許可します（**ただしデフォルトでは引き続きメンションでゲートされます**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使用してください。
bare nick の照合は変更可能であり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。

### よくある落とし穴: `allowFrom` は DM 用であり、チャンネル用ではありません

次のようなログが表示される場合:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...これは、送信者が **グループ/チャンネル** メッセージで許可されていなかったことを意味します。次のいずれかで修正してください。

- `channels.irc.groupAllowFrom` を設定する（すべてのチャンネルに対してグローバル）、または
- チャンネルごとの送信者許可リストを設定する: `channels.irc.groups["#channel"].allowFrom`

例（`#tuirc-dev` の誰でもボットに話しかけられるようにする）:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 返信のトリガー（メンション）

チャンネルが（`groupPolicy` + `groups` によって）許可され、送信者も許可されている場合でも、OpenClaw はグループコンテキストではデフォルトで **メンションゲート** を使用します。

つまり、メッセージにボットと一致するメンションパターンが含まれていない限り、`drop channel … (missing-mention)` のようなログが表示されることがあります。

IRC チャンネルで **メンションを必要とせずに** ボットに返信させるには、そのチャンネルのメンションゲートを無効にします。

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

または、**すべての** IRC チャンネルを許可し（チャンネルごとの許可リストなし）、それでもメンションなしで返信するには:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## セキュリティメモ（公開チャンネルで推奨）

公開チャンネルで `allowFrom: ["*"]` を許可すると、誰でもボットにプロンプトを送信できます。
リスクを減らすには、そのチャンネルのツールを制限してください。

### チャンネル内の全員に同じツール

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 送信者ごとに異なるツール（所有者にはより強い権限）

`toolsBySender` を使用して、`"*"` にはより厳しいポリシーを、自分の nick にはより緩いポリシーを適用します。

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

メモ:

- `toolsBySender` キーでは、IRC 送信者 ID 値に `id:` を使用してください。
  より強い照合には `id:eigen` または `id:eigen!~eigen@174.127.248.171` を使用します。
- 従来のプレフィックスなしキーも引き続き受け入れられ、`id:` としてのみ照合されます。
- 最初に一致した送信者ポリシーが優先されます。`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンションゲートの詳細（およびそれらがどう相互作用するか）については、[/channels/groups](/ja-JP/channels/groups) を参照してください。

## NickServ

接続後に NickServ で識別するには:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

接続時の任意の一回限りの登録:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

nick が登録された後は、REGISTER の試行が繰り返されないように `register` を無効にしてください。

## 環境変数

デフォルトアカウントは次に対応しています。

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（カンマ区切り）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` はワークスペースの `.env` からは設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## トラブルシューティング

- ボットが接続しているのにチャンネルでまったく返信しない場合は、`channels.irc.groups` **および** メンションゲートがメッセージをドロップしていないか（`missing-mention`）を確認してください。ping なしで返信させたい場合は、そのチャンネルに `requireMention:false` を設定します。
- ログインに失敗する場合は、nick の利用可否とサーバーパスワードを確認してください。
- カスタムネットワークで TLS が失敗する場合は、ホスト/ポートと証明書設定を確認してください。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
