---
read_when:
    - OpenClaw を IRC チャンネルまたは DM に接続したい場合
    - IRC の許可リスト、グループポリシー、またはメンションゲーティングを設定している場合
summary: IRC plugin のセットアップ、アクセス制御、トラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-04-23T13:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

OpenClaw を従来のチャンネル（`#room`）やダイレクトメッセージで使いたい場合は IRC を使用します。
IRC はバンドルされた plugin として提供されますが、設定はメイン設定の `channels.irc` で行います。

## クイックスタート

1. `~/.openclaw/openclaw.json` で IRC 設定を有効にします。
2. 少なくとも以下を設定します:

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

bot の連携にはプライベートな IRC サーバーを推奨します。意図的に公開 IRC ネットワークを使う場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。bot や swarm のバックチャネル通信に、予測しやすい公開チャンネルを使うのは避けてください。

3. Gateway を開始または再起動します:

```bash
openclaw gateway run
```

## セキュリティのデフォルト

- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` の場合は、許可するチャンネルを定義するために `channels.irc.groups` を設定します。
- 意図的に平文の通信を受け入れる場合を除き、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRC チャンネルには、2 つの別々の「ゲート」があります。

1. **チャンネルアクセス**（`groupPolicy` + `groups`）: bot がそのチャンネルからのメッセージをそもそも受け付けるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャンネルごとの `groups["#channel"].allowFrom`）: そのチャンネル内で bot をトリガーできるのが誰か。

設定キー:

- DM 許可リスト（DM 送信者アクセス）: `channels.irc.allowFrom`
- グループ送信者許可リスト（チャンネル送信者アクセス）: `channels.irc.groupAllowFrom`
- チャンネルごとの制御（チャンネル + 送信者 + メンションルール）: `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` を使うと未設定のチャンネルも許可されます（**それでもデフォルトではメンションゲーティングが適用されます**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使用してください。
ニックネームのみのマッチングは変更可能であり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効です。

### よくある落とし穴: `allowFrom` は DM 用であり、チャンネル用ではありません

次のようなログが表示される場合:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

これは、**グループ/チャンネル** メッセージに対してその送信者が許可されていなかったことを意味します。次のいずれかで修正してください:

- `channels.irc.groupAllowFrom` を設定する（すべてのチャンネルに対するグローバル設定）、または
- チャンネルごとの送信者許可リストを設定する: `channels.irc.groups["#channel"].allowFrom`

例（`#tuirc-dev` の誰でも bot に話しかけられるようにする）:

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

## 返信トリガー（メンション）

チャンネルが許可されており（`groupPolicy` + `groups`）、かつ送信者も許可されている場合でも、OpenClaw はグループコンテキストではデフォルトで **メンションゲーティング** を使います。

そのため、メッセージに bot と一致するメンションパターンが含まれていないと、`drop channel … (missing-mention)` のようなログが出ることがあります。

メンションなしで IRC チャンネル内で bot に返信させたい場合は、そのチャンネルのメンションゲーティングを無効にしてください:

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

または、**すべての** IRC チャンネルを許可し（チャンネルごとの許可リストなし）、かつメンションなしで返信させたい場合:

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

## セキュリティに関する注意（公開チャンネルでは推奨）

公開チャンネルで `allowFrom: ["*"]` を許可すると、誰でも bot にプロンプトを送れるようになります。
リスクを減らすため、そのチャンネルでは tools を制限してください。

### チャンネル内の全員に同じ tools を適用する

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

### 送信者ごとに異なる tools を適用する（owner はより強い権限を持つ）

`toolsBySender` を使うと、`"*"` にはより厳しいポリシーを、自分のニックにはより緩いポリシーを適用できます:

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

注意:

- `toolsBySender` のキーには IRC 送信者 ID 値に対して `id:` を使用してください:
  `id:eigen`、またはより強く一致させるには `id:eigen!~eigen@174.127.248.171` を使います。
- 従来の接頭辞なしキーも引き続き受け付けられますが、`id:` としてのみ照合されます。
- 最初に一致した送信者ポリシーが優先され、`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンションゲーティング（およびそれらがどう相互作用するか）の詳細は、[/channels/groups](/ja-JP/channels/groups) を参照してください。

## NickServ

接続後に NickServ で認証するには:

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

接続時に一度だけ登録を行うオプション:

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

ニックの登録後は、`REGISTER` の繰り返し試行を避けるために `register` を無効にしてください。

## 環境変数

デフォルトアカウントでは次をサポートします:

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

`IRC_HOST` はワークスペースの `.env` から設定できません。詳しくは [Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## トラブルシューティング

- bot は接続するがチャンネルでまったく返信しない場合は、`channels.irc.groups` **と** メンションゲーティングによってメッセージが破棄されていないか（`missing-mention`）を確認してください。ping なしで返信させたい場合は、そのチャンネルに `requireMention:false` を設定してください。
- ログインに失敗する場合は、ニックが利用可能かどうかとサーバーパスワードを確認してください。
- カスタムネットワークで TLS に失敗する場合は、host/port と証明書の設定を確認してください。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
