---
read_when:
    - OpenClawをIRCチャンネルまたはDMに接続する場合
    - IRC の許可リスト、グループポリシー、またはメンション制御を設定している場合
summary: IRC Plugin のセットアップ、アクセス制御、トラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-07-11T21:57:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

クラシックなチャンネル（`#room`）やダイレクトメッセージで OpenClaw を利用したい場合は、IRC を使用します。
公式の IRC Plugin をインストールし、`channels.irc` 配下で設定します。

## クイックスタート

1. Plugin をインストールします。

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json` で、少なくともホスト、ニックネーム、参加するチャンネルを設定します。

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

3. Gateway を起動または再起動します。

```bash
openclaw gateway run
```

ボット間の連携には、プライベート IRC サーバーを推奨します。意図的に公開 IRC ネットワークを使用する場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。ボットやスウォームのバックチャネル通信には、推測されやすい公開チャンネルを避けてください。

## 接続設定

| キー                          | デフォルト                    | 備考                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | なし（必須）                  | IRC サーバーのホスト名                                      |
| `port`                        | TLS では `6697`、平文では `6667` | 1～65535                                                  |
| `tls`                         | `true`                        | 意図的に平文を使用する場合のみ `false` に設定                |
| `nick`                        | なし（必須）                  | ボットのニックネーム                                        |
| `username`                    | ニックネーム、それもなければ `openclaw` | IRC ユーザー名                                  |
| `realname`                    | `OpenClaw`                    | Realname/GECOS フィールド                                   |
| `password` / `passwordFile`   | なし                          | サーバーパスワード。ファイルは通常ファイルである必要があります |
| `channels`                    | なし                          | 参加するチャンネル（`["#openclaw"]`）                       |
| `accounts` / `defaultAccount` | なし                          | 複数アカウント設定。環境変数が設定されるのはデフォルトアカウントのみ |

## セキュリティのデフォルト設定

- IRC は、OpenClaw の運用者が管理するフォワードプロキシルーティングの外部で、生の TCP/TLS ソケットを使用します。すべての外向き通信をそのフォワードプロキシ経由にする必要がある環境では、IRC への直接通信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。不明な DM 送信者にはペアリングコードが送られ、`openclaw pairing approve irc <code>` で承認します。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` の場合、許可するチャンネルを定義するために `channels.irc.groups` を設定します。
- 意図的に平文転送を許容する場合を除き、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRC チャンネルには、個別の 2 つの「ゲート」があります。

1. **チャンネルアクセス**（`groupPolicy` + `groups`）：ボットがそのチャンネルからのメッセージを受け付けるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャンネルごとの `groups["#channel"].allowFrom`）：そのチャンネル内で誰がボットを起動できるか。

設定キー：

- DM 許可リスト（DM 送信者アクセス）：`channels.irc.allowFrom`
- グループ送信者許可リスト（チャンネル送信者アクセス）：`channels.irc.groupAllowFrom`
- チャンネルごとの制御（チャンネル、送信者、メンションのルール）：`channels.irc.groups["#channel"]` で `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills`、`systemPrompt` を設定
- `channels.irc.groupPolicy="open"` は未設定のチャンネルを許可します（**デフォルトでは引き続きメンションが必要です**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使用してください。
ニックネームのみの照合は変更される可能性があり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。

### よくある注意点：`allowFrom` はチャンネルではなく DM 用

次のようなログが表示される場合：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

これは、その送信者が**グループ／チャンネル**メッセージで許可されていないことを意味します。次のいずれかで修正してください。

- `channels.irc.groupAllowFrom` を設定する（すべてのチャンネルに適用）、または
- チャンネルごとの送信者許可リストを設定する：`channels.irc.groups["#channel"].allowFrom`

例（`#openclaw` 内の全員がボットと会話できるようにする）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 応答のトリガー（メンション）

チャンネルが（`groupPolicy` + `groups` によって）許可され、送信者も許可されている場合でも、OpenClaw はデフォルトでグループコンテキストに**メンションゲート**を適用します。メッセージに接続中のボットのニックネームが含まれているか、設定済みのメンションパターンに一致すると、ボットがメンションされたものと見なされます。

つまり、メッセージにボットと一致するメンションパターンが含まれていない場合、`drop channel … (missing-mention)` のようなログが表示されることがあります。

IRC チャンネルで**メンションを必要とせずに**ボットを応答させるには、そのチャンネルのメンションゲートを無効にします。

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

または、**すべての** IRC チャンネルを許可し（チャンネルごとの許可リストなし）、メンションなしで応答させるには、次のように設定します。

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

## セキュリティ上の注意（公開チャンネルで推奨）

公開チャンネルで `allowFrom: ["*"]` を許可すると、誰でもボットにプロンプトを送信できます。
リスクを軽減するには、そのチャンネルで使用できるツールを制限してください。

### チャンネル内の全員に同じツールを適用

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
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

### 送信者ごとに異なるツールを適用（所有者にはより強い権限）

`toolsBySender` を使用して、`"*"` にはより厳格なポリシーを、自分のニックネームにはより緩いポリシーを適用します。

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

備考：

- `toolsBySender` のキーには明示的なプレフィックス（`channel:`、`id:`、`e164:`、`username:`、`name:`）を使用してください。IRC では、送信者 ID の値とともに `id:` を使用します。たとえば `id:alice`、またはより厳密に照合する場合は `id:alice!~alice@203.0.113.7` です。
- プレフィックスのない旧形式のキーも引き続き受け付けますが、`id:` としてのみ照合され、非推奨警告が出力されます。
- 最初に一致した送信者ポリシーが優先されます。`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンションゲートの詳細、および両者の相互作用については、[/channels/groups](/ja-JP/channels/groups) を参照してください。

## NickServ

接続後に NickServ で識別するには、次のように設定します。

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

パスワードが設定されている場合、NickServ の識別はデフォルトで毎回実行されます（オプトアウトする場合のみ `enabled` を `false` にする必要があります）。`service` のデフォルトは `NickServ` です。インラインの `password` の代わりに `passwordFile` も使用できます。

接続時に一度だけ登録するオプション（`register: true` には `registerEmail` が必要です）：

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

ニックネームの登録後は、REGISTER の試行が繰り返されないように `register` を無効にしてください。

## 環境変数

デフォルトアカウントでは、次の環境変数を使用できます。

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

`IRC_HOST` はワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## トラブルシューティング

- ボットが接続してもチャンネル内で応答しない場合は、`channels.irc.groups` **と**、メンションゲートによってメッセージが破棄されていないか（`missing-mention`）を確認してください。メンションなしで応答させる場合は、そのチャンネルに `requireMention:false` を設定します。
- ログインに失敗する場合は、ニックネームが使用可能かどうかと、サーバーパスワードを確認してください。
- カスタムネットワークで TLS に失敗する場合は、ホスト、ポート、証明書の設定を確認してください。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
