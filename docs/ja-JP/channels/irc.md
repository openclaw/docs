---
read_when:
    - OpenClaw を IRC チャネルまたは DM に接続したい場合
    - IRC の許可リスト、グループポリシー、またはメンションゲーティングを設定している場合
summary: IRC Plugin のセットアップ、アクセス制御、およびトラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-04-24T04:46:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

OpenClaw を IRC チャネルまたは DM に接続したい場合は IRC を使います。
IRC は同梱 Plugin として提供されますが、設定はメイン設定の `channels.irc` で行います。

## クイックスタート

1. `~/.openclaw/openclaw.json` で IRC 設定を有効にします。
2. 少なくとも次を設定します:

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

ボット連携にはプライベートな IRC サーバーを推奨します。意図的にパブリック IRC ネットワークを使う場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。ボットや swarm のバックチャネル通信には、予測しやすい公開チャネルを避けてください。

3. Gateway を起動または再起動します:

```bash
openclaw gateway run
```

## デフォルトのセキュリティ設定

- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` の場合、許可するチャネルを定義するために `channels.irc.groups` を設定してください。
- 意図的に平文トランスポートを受け入れる場合を除き、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRC チャネルには、別々の「ゲート」が 2 つあります。

1. **チャネルアクセス**（`groupPolicy` + `groups`）: ボットがそのチャネルからのメッセージをそもそも受け付けるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャネルごとの `groups["#channel"].allowFrom`）: そのチャネル内で誰がボットをトリガーできるか。

設定キー:

- DM 許可リスト（DM 送信者アクセス）: `channels.irc.allowFrom`
- グループ送信者許可リスト（チャネル送信者アクセス）: `channels.irc.groupAllowFrom`
- チャネルごとの制御（チャネル + 送信者 + メンションルール）: `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` は未設定のチャネルを許可します（**それでもデフォルトではメンションゲートあり**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使ってください。
ニックネームのみのマッチングは変更可能であり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効です。

### よくある落とし穴: `allowFrom` は DM 用であり、チャネル用ではない

次のようなログが表示される場合:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

これは、その送信者が**グループ/チャネル**メッセージで許可されていないことを意味します。次のいずれかで修正してください。

- `channels.irc.groupAllowFrom` を設定する（全チャネル共通のグローバル設定）、または
- チャネルごとの送信者許可リストを設定する: `channels.irc.groups["#channel"].allowFrom`

例（`#tuirc-dev` では誰でもボットに話しかけられるようにする）:

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

チャネルが許可されていて（`groupPolicy` + `groups`）、送信者も許可されていても、OpenClaw はグループコンテキストではデフォルトで**メンションゲート**を使います。

つまり、メッセージにボットに一致するメンションパターンが含まれていない限り、`drop channel … (missing-mention)` のようなログが表示されることがあります。

メンションを必要とせずに IRC チャネルでボットを返信させるには、そのチャネルのメンションゲートを無効にします:

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

または、**すべての** IRC チャネルを許可し（チャネルごとの許可リストなし）、なおかつメンションなしで返信させるには:

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

## セキュリティ上の注意（公開チャネルでは推奨）

公開チャネルで `allowFrom: ["*"]` を許可すると、誰でもボットにプロンプトを送れるようになります。
リスクを減らすには、そのチャネルで使えるツールを制限してください。

### チャネル内の全員に同じツールを適用する

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

### 送信者ごとに異なるツールを適用する（所有者はより強い権限を持つ）

`toolsBySender` を使うと、`"*"` にはより厳しいポリシーを、あなたのニックにはより緩いポリシーを適用できます:

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

注記:

- `toolsBySender` のキーには、IRC 送信者 ID 値のために `id:` を使う必要があります:
  より強い一致には `id:eigen` または `id:eigen!~eigen@174.127.248.171` を使います。
- 従来のプレフィックスなしキーも引き続き受け付けられ、`id:` としてのみ一致します。
- 最初に一致した送信者ポリシーが優先されます。`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンションゲートの違い（およびその相互作用）について詳しくは、[/channels/groups](/ja-JP/channels/groups) を参照してください。

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

接続時に任意の 1 回限り登録を行うには:

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

ニックネームの登録後は、繰り返し REGISTER が試行されるのを避けるために `register` を無効にしてください。

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

`IRC_HOST` はワークスペースの `.env` からは設定できません。[Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## トラブルシューティング

- ボットが接続してもチャネルでまったく返信しない場合は、`channels.irc.groups` **と** メンションゲートによってメッセージが落とされていないか（`missing-mention`）を確認してください。ping なしで返信させたい場合は、そのチャネルに `requireMention:false` を設定してください。
- ログインに失敗する場合は、ニックネームの可用性とサーバーパスワードを確認してください。
- カスタムネットワークで TLS に失敗する場合は、host/port と証明書設定を確認してください。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
