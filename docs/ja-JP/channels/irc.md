---
read_when:
    - OpenClaw を IRC チャンネルまたはダイレクトメッセージに接続したい
    - IRC の許可リスト、グループポリシー、またはメンションゲートを構成している
summary: IRC plugin のセットアップ、アクセス制御、トラブルシューティング
title: IRC
x-i18n:
    generated_at: "2026-07-05T11:02:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

従来型のチャネル（`#room`）やダイレクトメッセージで OpenClaw を使いたい場合は IRC を使用します。
公式 IRC Plugin をインストールしてから、`channels.irc` で設定します。

## クイックスタート

1. Plugin をインストールします。

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json` に、少なくともホスト、ニックネーム、参加するチャネルを設定します。

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

3. Gateway を開始または再起動します。

```bash
openclaw gateway run
```

ボットの調整にはプライベート IRC サーバーを推奨します。意図して公開 IRC ネットワークを使う場合、一般的な選択肢には Libera.Chat、OFTC、Snoonet があります。ボットやスウォームのバックチャネル通信には、予測しやすい公開チャネルを避けてください。

## 接続設定

| Key                           | Default                       | Notes                                                       |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | なし（必須）                  | IRC サーバーのホスト名                                      |
| `port`                        | TLS では `6697`、平文では `6667` | 1-65535                                                     |
| `tls`                         | `true`                        | 意図して平文を使う場合のみ `false` に設定します             |
| `nick`                        | なし（必須）                  | ボットのニックネーム                                        |
| `username`                    | nick、それ以外は `openclaw`   | IRC ユーザー名                                              |
| `realname`                    | `OpenClaw`                    | Realname/GECOS フィールド                                   |
| `password` / `passwordFile`   | なし                          | サーバーパスワード。ファイルは通常ファイルである必要があります |
| `channels`                    | なし                          | 参加するチャネル（`["#openclaw"]`）                         |
| `accounts` / `defaultAccount` | なし                          | 複数アカウント設定。環境変数はデフォルトアカウントのみを埋めます |

## セキュリティのデフォルト

- IRC は、OpenClaw のオペレーター管理フォワードプロキシルーティングの外側で raw TCP/TLS ソケットを使用します。すべての外向き通信をそのフォワードプロキシ経由にする必要があるデプロイでは、直接の IRC 外向き通信が明示的に承認されていない限り、`channels.irc.enabled=false` を設定してください。
- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。不明な DM 送信者にはペアリングコードが送られ、`openclaw pairing approve irc <code>` で承認します。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` では、許可するチャネルを定義するために `channels.irc.groups` を設定します。
- 意図して平文トランスポートを受け入れる場合を除き、TLS（`channels.irc.tls=true`）を使用します。

## アクセス制御

IRC チャネルには 2 つの独立した「ゲート」があります。

1. **チャネルアクセス**（`groupPolicy` + `groups`）：ボットがそのチャネルからのメッセージを受け入れるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャネルごとの `groups["#channel"].allowFrom`）：そのチャネル内で誰がボットをトリガーできるか。

設定キー:

- DM 許可リスト（DM 送信者アクセス）: `channels.irc.allowFrom`
- グループ送信者許可リスト（チャネル送信者アクセス）: `channels.irc.groupAllowFrom`
- チャネルごとの制御（チャネル + 送信者 + メンションルール）: `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills`、`systemPrompt` を持つ `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` は未設定のチャネルを許可します（**それでもデフォルトではメンションでゲートされます**）

許可リストのエントリには、安定した送信者 ID（`nick!user@host`）を使用してください。
単独のニックネーム一致は変更可能であり、`channels.irc.dangerouslyAllowNameMatching: true` の場合にのみ有効になります。

### よくある落とし穴: `allowFrom` は DM 用であり、チャネル用ではありません

次のようなログが表示される場合:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…これは、送信者が**グループ/チャネル**メッセージで許可されていないことを意味します。次のいずれかで修正します。

- `channels.irc.groupAllowFrom`（すべてのチャネルに対するグローバル設定）を設定する、または
- チャネルごとの送信者許可リスト `channels.irc.groups["#channel"].allowFrom` を設定する

例（`#openclaw` 内の誰でもボットに話しかけられるようにする）:

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

## 返信のトリガー（メンション）

チャネルが許可されていても（`groupPolicy` + `groups` による）、かつ送信者が許可されていても、OpenClaw はグループコンテキストではデフォルトで**メンションゲート**を使います。接続中のボットのニックネームがメッセージに含まれるか、設定済みのメンションパターンに一致すると、ボットはメンションされたとみなします。

つまり、メッセージにボットと一致するメンションパターンが含まれていない限り、`drop channel … (missing-mention)` のようなログが表示されることがあります。

IRC チャネルで**メンションなしで**ボットに返信させるには、そのチャネルのメンションゲートを無効にします。

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

または、**すべての** IRC チャネルを許可し（チャネルごとの許可リストなし）、それでもメンションなしで返信するには:

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

## セキュリティメモ（公開チャネルで推奨）

公開チャネルで `allowFrom: ["*"]` を許可すると、誰でもボットにプロンプトを送れます。
リスクを減らすには、そのチャネルのツールを制限してください。

### チャネル内の全員に同じツールを適用する

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

### 送信者ごとに異なるツールを適用する（所有者にはより強い権限を付与）

`toolsBySender` を使って、`"*"` にはより厳しいポリシーを、自分のニックネームにはより緩いポリシーを適用します。

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

注:

- `toolsBySender` キーには明示的なプレフィックス（`channel:`、`id:`、`e164:`、`username:`、`name:`）を使用してください。IRC では、送信者 ID 値とともに `id:` を使用します。例: より強い一致には `id:alice` または `id:alice!~alice@203.0.113.7`。
- レガシーなプレフィックスなしキーも引き続き受け入れられますが、`id:` としてのみ一致し、非推奨警告が出力されます。
- 最初に一致した送信者ポリシーが優先されます。`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンションゲートの詳細（およびその相互作用）については、[/channels/groups](/ja-JP/channels/groups) を参照してください。

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

NickServ の認証は、パスワードが設定されている場合はデフォルトで実行されます（オプトアウトする場合のみ `enabled` を `false` にする必要があります）。`service` のデフォルトは `NickServ` です。`passwordFile` はインラインの `password` の代替です。

接続時の任意の一回限りの登録（`register: true` には `registerEmail` が必要）:

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

ニックネームが登録されたら、REGISTER 試行の繰り返しを避けるために `register` を無効にしてください。

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

`IRC_HOST` はワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## トラブルシューティング

- ボットは接続するがチャネルでまったく返信しない場合は、`channels.irc.groups` **および**メンションゲートがメッセージをドロップしているかどうか（`missing-mention`）を確認してください。ping なしで返信させたい場合は、そのチャネルに `requireMention:false` を設定します。
- ログインに失敗する場合は、ニックネームの利用可否とサーバーパスワードを確認してください。
- カスタムネットワークで TLS が失敗する場合は、ホスト/ポートと証明書設定を確認してください。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされるすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
