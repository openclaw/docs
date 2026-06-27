---
read_when:
    - OpenClaw を IRC チャンネルまたは DM に接続したい場合
    - IRC の許可リスト、グループポリシー、またはメンションゲートを設定している
summary: IRC plugin のセットアップ、アクセス制御、トラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-06-27T10:37:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

IRC は、OpenClaw をクラシックなチャンネル（`#room`）とダイレクトメッセージで使いたい場合に使用します。
公式 IRC Plugin をインストールし、`channels.irc` で設定します。

## クイックスタート

1. Plugin をインストールします。

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json` で IRC 設定を有効にします。
3. 少なくとも次を設定します。

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

ボットの連携には、プライベート IRC サーバーを優先してください。意図的に公開 IRC ネットワークを使う場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。ボットやスウォームのバックチャンネル通信には、予測しやすい公開チャンネルを避けてください。

4. Gateway を起動または再起動します。

```bash
openclaw gateway run
```

## セキュリティのデフォルト

- IRC は、OpenClaw のオペレーター管理フォワードプロキシルーティングの外側で、生の TCP/TLS ソケットを使用します。すべての送信トラフィックをそのフォワードプロキシ経由にする必要があるデプロイでは、直接 IRC 送信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` では、許可するチャンネルを定義するために `channels.irc.groups` を設定します。
- 平文トランスポートを意図的に受け入れる場合を除き、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRC チャンネルには 2 つの独立した「ゲート」があります。

1. **チャンネルアクセス**（`groupPolicy` + `groups`）：ボットがそのチャンネルからのメッセージをそもそも受け付けるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャンネルごとの `groups["#channel"].allowFrom`）：そのチャンネル内でボットをトリガーできるユーザー。

設定キー:

- DM 許可リスト（DM 送信者アクセス）: `channels.irc.allowFrom`
- グループ送信者許可リスト（チャンネル送信者アクセス）: `channels.irc.groupAllowFrom`
- チャンネルごとの制御（チャンネル + 送信者 + メンションルール）: `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` は未設定のチャンネルを許可します（**それでもデフォルトではメンションゲートがあります**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使用してください。
ベアな nick マッチングは変更可能であり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。

### よくある落とし穴: `allowFrom` は DM 用であり、チャンネル用ではありません

次のようなログが表示される場合:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...これは、送信者が **グループ/チャンネル** メッセージで許可されていないことを意味します。次のいずれかで修正します。

- `channels.irc.groupAllowFrom`（すべてのチャンネルに対するグローバル設定）を設定する、または
- チャンネルごとの送信者許可リスト `channels.irc.groups["#channel"].allowFrom` を設定する

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

## 応答のトリガー（メンション）

チャンネルが許可され（`groupPolicy` + `groups` 経由）、送信者も許可されていても、OpenClaw はグループコンテキストでデフォルトで **メンションゲート** を使用します。

つまり、メッセージにボットに一致するメンションパターンが含まれていない限り、`drop channel … (missing-mention)` のようなログが表示されることがあります。

IRC チャンネルで、**メンションを必要とせずに** ボットに応答させるには、そのチャンネルのメンションゲートを無効にします。

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

または、**すべての** IRC チャンネルを許可し（チャンネルごとの許可リストなし）、それでもメンションなしで応答するには:

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

### 送信者ごとに異なるツール（所有者はより強い権限を持つ）

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

注:

- `toolsBySender` のキーでは、IRC 送信者 ID 値に `id:` を使用してください。
  より強いマッチングには `id:eigen` または `id:eigen!~eigen@174.127.248.171` を使用します。
- レガシーな接頭辞なしのキーも引き続き受け付けられ、`id:` としてのみマッチします。
- 最初に一致した送信者ポリシーが適用されます。`"*"` はワイルドカードのフォールバックです。

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

デフォルトアカウントは次をサポートします。

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

`IRC_HOST` はワークスペース `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security) を参照してください。

## トラブルシューティング

- ボットが接続しているのにチャンネルでまったく応答しない場合は、`channels.irc.groups` **および** メンションゲートがメッセージをドロップしているかどうか（`missing-mention`）を確認してください。ping なしで応答させたい場合は、そのチャンネルに `requireMention:false` を設定します。
- ログインに失敗する場合は、nick の空き状況とサーバーパスワードを確認してください。
- カスタムネットワークで TLS が失敗する場合は、ホスト/ポートと証明書の設定を確認してください。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
