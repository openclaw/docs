---
read_when:
    - 複数のメッセージチャネルで同じ許可リストを設定する
    - DM とグループの送信者アクセスルールの共有
    - メッセージチャネルのアクセス制御のレビュー
summary: メッセージチャネル用の再利用可能な送信者許可リスト
title: アクセスグループ
x-i18n:
    generated_at: "2026-05-02T04:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

アクセスグループは、一度定義してチャネルの許可リストから `accessGroup:<name>` で参照する、名前付きの送信者リストです。

同じ人たちを複数のメッセージチャネルで許可する必要がある場合や、信頼済みの 1 つの集合を DM とグループ送信者認可の両方に適用する必要がある場合に使用します。

アクセスグループは、それ自体ではアクセスを付与しません。グループが意味を持つのは、許可リストフィールドがそれを参照している場合だけです。

## 静的メッセージ送信者グループ

静的送信者グループは `type: "message.senders"` を使用します。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

メンバーリストはメッセージチャネル ID をキーにします。

| キー        | 意味                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | グループを参照するすべてのメッセージチャネルで確認される共有エントリ。 |
| `discord`  | Discord の許可リスト照合でのみ確認されるエントリ。                    |
| `telegram` | Telegram の許可リスト照合でのみ確認されるエントリ。                   |
| `whatsapp` | WhatsApp の許可リスト照合でのみ確認されるエントリ。                   |

エントリは、宛先チャネルの通常の `allowFrom` ルールで照合されます。OpenClaw はチャネル間で送信者 ID を変換しません。Alice が Telegram ID と Discord ID を持っている場合は、両方の ID を適切なキーの下に列挙してください。

## 許可リストからグループを参照する

メッセージチャネルのパスが送信者許可リストをサポートしている場所ならどこでも、`accessGroup:<name>` でグループを参照できます。

DM 許可リストの例:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

グループ送信者許可リストの例:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

グループと直接エントリを混在させることもできます。

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## サポートされるメッセージチャネルパス

アクセスグループは、共有メッセージチャネル認可パスで利用できます。以下を含みます。

- `channels.<channel>.allowFrom` などの DM 送信者許可リスト
- `channels.<channel>.groupAllowFrom` などのグループ送信者許可リスト
- 同じ送信者照合ルールを使用する、チャネル固有のルーム単位送信者許可リスト
- メッセージチャネル送信者許可リストを再利用するコマンド認可パス

チャネルのサポートは、そのチャネルが共有 OpenClaw 送信者認可ヘルパーを通じて接続されているかどうかに依存します。現在バンドルされているサポートには Discord、Google Chat、Nostr、WhatsApp、Zalo、Zalo Personal が含まれます。静的 `message.senders` グループはチャネル非依存になるよう設計されているため、新しいメッセージチャネルは、カスタムの許可リスト展開ではなく共有 Plugin SDK ヘルパーを使用してそれらをサポートする必要があります。

## Discord チャネルオーディエンス

Discord は動的アクセスグループタイプもサポートしています。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` は「このギルドチャネルを現在表示できる Discord DM 送信者を許可する」という意味です。OpenClaw は認可時に Discord 経由で送信者を解決し、Discord の `ViewChannel` 権限ルールを適用します。

`#maintainers` や `#on-call` など、Discord チャネルがすでにチームの信頼できる情報源になっている場合に使用します。

要件と失敗時の動作:

- bot はギルドとチャネルにアクセスできる必要があります。
- bot には Discord Developer Portal の **Server Members Intent** が必要です。
- Discord が `Missing Access` を返す場合、送信者をギルドメンバーとして解決できない場合、またはチャネルが別のギルドに属している場合、アクセスグループは閉じた状態で失敗します。

Discord 固有のその他の例: [Discord アクセス制御](/ja-JP/channels/discord#access-control-and-routing)

## セキュリティノート

- アクセスグループは許可リストのエイリアスであり、ロールではありません。それ自体では owner を作成したり、ペアリングリクエストを承認したり、ツール権限を付与したりしません。
- `dmPolicy: "open"` でも、有効な DM 許可リストに `"*"` が必要です。アクセスグループを参照することは、公開アクセスと同じではありません。
- 見つからないグループ名は閉じた状態で失敗します。`allowFrom` に `accessGroup:operators` が含まれていて `accessGroups.operators` が存在しない場合、そのエントリは誰も認可しません。
- チャネル ID は安定させてください。チャネルが表示名と数値 ID/ユーザー ID の両方をサポートしている場合は、表示名よりも数値 ID/ユーザー ID を優先してください。

## トラブルシューティング

送信者が一致するはずなのにブロックされる場合:

1. 許可リストフィールドに正確な `accessGroup:<name>` 参照が含まれていることを確認します。
2. `accessGroups.<name>.type` が正しいことを確認します。
3. 送信者 ID が一致するチャネルキーの下、または `"*"` の下に列挙されていることを確認します。
4. エントリがそのチャネルの通常の許可リスト構文を使用していることを確認します。
5. Discord チャネルオーディエンスの場合、bot がギルドチャネルを表示でき、Server Members Intent が有効になっていることを確認します。

アクセス制御設定を編集した後は、`openclaw doctor` を実行してください。実行時より前に、多くの無効な許可リストとポリシーの組み合わせを検出します。
