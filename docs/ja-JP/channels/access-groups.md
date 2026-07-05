---
read_when:
    - 複数のメッセージチャネルで同じ許可リストを設定する
    - DM とグループの送信者アクセスルール
    - メッセージチャネルのアクセス制御をレビューする
summary: メッセージチャネル用の再利用可能な送信者許可リスト
title: アクセスグループ
x-i18n:
    generated_at: "2026-07-05T11:01:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

アクセスグループは、`accessGroups` の下で一度定義し、チャネル許可リストから `accessGroup:<name>` で参照する、名前付き送信者リストです。

同じ人たちを複数のメッセージチャネルで許可する必要がある場合や、信頼済みの 1 セットを DM とグループ送信者認可の両方に適用する必要がある場合に使用します。

グループ自体は何も許可しません。許可リストフィールドがそのグループを参照している場所でのみ意味を持ちます。

## 静的メッセージ送信者グループ

静的送信者グループは `type: "message.senders"` を使用します。`members` はメッセージチャネル ID をキーとし、さらにすべてのチャネルで共有されるエントリ用に `"*"` を使用します。

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

| キー                       | 意味                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `"*"`                      | グループを参照するすべてのメッセージチャネルでチェックされる共有エントリ。 |
| `discord`, `telegram`, ... | そのチャネルの許可リスト照合でのみチェックされるエントリ。                  |

エントリは、宛先チャネルの通常の `allowFrom` ルールで照合されます。OpenClaw はチャネル間で送信者 ID を変換しません。Alice が Telegram ID と Discord ID を持っている場合は、対応するチャネルキーの下に両方の ID を列挙してください。

## 許可リストからグループを参照する

メッセージチャネルパスが送信者許可リストをサポートする任意の場所で、`accessGroup:<name>` を使ってグループを参照します。

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
      groups: {
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

アクセスグループは、共有メッセージチャネル認可パスで機能します。

- `channels.<channel>.allowFrom` などの DM 送信者許可リスト
- `channels.<channel>.groupAllowFrom` などのグループ送信者許可リスト
- 同じ送信者照合ルールを使用する、チャネル固有の部屋ごとの送信者許可リスト（例: Google Chat `groups.<space>.users`）
- メッセージチャネル送信者許可リストを再利用するコマンド認可パス

チャネル対応は、そのチャネルが共有の OpenClaw 送信者認可ヘルパーを通るように接続されているかどうかに依存します。現在の同梱サポートには、ClickClack、Discord、Feishu、Google Chat、iMessage、IRC、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Signal、Slack、SMS、Telegram、WhatsApp、Zalo、Zalo Personal が含まれます。静的な `message.senders` グループはチャネル非依存なので、新しいメッセージチャネルはカスタム許可リスト展開ではなく共有 Plugin SDK の ingress ヘルパーを使うことで、それらを利用できます。

## Discord チャネルのオーディエンス

Discord は動的アクセスグループ型もサポートします。

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

`discord.channelAudience` は「現在このギルドチャネルを表示できる Discord DM 送信者を許可する」という意味です。OpenClaw は認可時に Discord を通じて送信者を解決し、Discord の `ViewChannel` 権限ルールを適用します。`membership` は任意で、デフォルトは `canViewChannel` です。

Discord チャネルが `#maintainers` や `#on-call` のように、すでにチームの信頼できる情報源になっている場合に使います。

要件と失敗時の動作:

- ボットはギルドとチャネルにアクセスできる必要があります。
- ボットには Discord Developer Portal の **Server Members Intent** が必要です。
- Discord が `Missing Access` を返した場合、送信者をギルドメンバーとして解決できない場合、またはチャネルが別のギルドに属している場合、アクセスグループは fail closed します。

Discord 固有の例について詳しくは、[Discord アクセス制御](/ja-JP/channels/discord#access-control-and-routing) を参照してください。

## Plugin 診断

Plugin 作者は、構造化されたアクセスグループ状態をフラットな許可リストへ展開し直さずに検査できます。

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

結果には、参照されたグループ、一致したグループ、欠落したグループ、未サポートのグループ、失敗したグループが報告されます。診断または適合性テストに使います。まだフラットな `allowFrom` 配列を想定している互換パスでのみ、`expandAllowFromWithAccessGroups(...)` を使ってください。

## セキュリティ上の注意

- アクセスグループは許可リストのエイリアスであり、ロールではありません。それ自体で所有者を作成したり、ペアリング要求を承認したり、ツール権限を付与したりすることはありません。
- `dmPolicy: "open"` でも、有効な DM 許可リスト内に `"*"` が必要です。アクセスグループを参照することは、公開アクセスと同じではありません。
- 存在しないグループ名は fail closed します。`allowFrom` に `accessGroup:operators` が含まれていて、`accessGroups.operators` が存在しない場合、そのエントリは誰も認可しません。
- チャネル ID は安定させてください。チャネルが両方をサポートしている場合は、表示名よりも数値 ID やユーザー ID を優先してください。

## トラブルシューティング

送信者が一致するはずなのにブロックされる場合:

1. 許可リストフィールドに正確な `accessGroup:<name>` 参照が含まれていることを確認します。
2. `accessGroups.<name>.type` が正しいことを確認します。
3. 送信者 ID が一致するチャネルキーの下、または `"*"` の下に記載されていることを確認します。
4. そのエントリがそのチャネルの通常の許可リスト構文を使っていることを確認します。
5. Discord チャネルオーディエンスの場合、ボットがギルドチャネルを表示でき、Server Members Intent が有効になっていることを確認します。

アクセス制御設定を編集した後は `openclaw doctor` を実行してください。ランタイム前に、多くの無効な許可リストとポリシーの組み合わせを検出できます。
