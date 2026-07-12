---
read_when:
    - 複数のメッセージチャネルで同じ許可リストを設定する
    - DM とグループの送信者アクセスルールの共有
    - メッセージチャネルのアクセス制御を確認する
summary: メッセージチャネル向けの再利用可能な送信者許可リスト
title: アクセスグループ
x-i18n:
    generated_at: "2026-07-11T21:59:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

アクセスグループは、`accessGroups` で一度定義し、チャネルの許可リストから `accessGroup:<name>` で参照する、名前付きの送信者リストです。

複数のメッセージチャネルで同じユーザーを許可する場合や、1つの信頼済みグループを DM とグループ送信者の認可の両方に適用する場合に使用します。

グループ自体は何も許可しません。許可リストフィールドから参照された場合にのみ効果を持ちます。

## 静的メッセージ送信者グループ

静的送信者グループでは `type: "message.senders"` を使用します。`members` はメッセージチャネル ID をキーとし、すべてのチャネルで共有するエントリには `"*"` を使用します。

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

| キー                       | 意味                                                                             |
| -------------------------- | -------------------------------------------------------------------------------- |
| `"*"`                      | グループを参照するすべてのメッセージチャネルで確認される共有エントリ。           |
| `discord`, `telegram`, ... | そのチャネルの許可リスト照合でのみ確認されるエントリ。                           |

エントリは、対象チャネルの通常の `allowFrom` ルールで照合されます。OpenClaw はチャネル間で送信者 ID を変換しません。Alice が Telegram ID と Discord ID を持つ場合は、両方の ID を対応するチャネルキーに記載してください。

## 許可リストからグループを参照する

メッセージチャネルのパスが送信者許可リストに対応している任意の場所で、`accessGroup:<name>` を使用してグループを参照します。

DM 許可リストの例：

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

グループ送信者許可リストの例：

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

グループと直接指定のエントリを併用できます。

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

## 対応するメッセージチャネルパス

アクセスグループは、共有メッセージチャネル認可パスで機能します。

- `channels.<channel>.allowFrom` などの DM 送信者許可リスト
- `channels.<channel>.groupAllowFrom` などのグループ送信者許可リスト
- 同じ送信者照合ルールを使用する、チャネル固有のルーム別送信者許可リスト（例：Google Chat の `groups.<space>.users`）
- メッセージチャネルの送信者許可リストを再利用するコマンド認可パス

チャネルが対応するかどうかは、そのチャネルが共有 OpenClaw 送信者認可ヘルパーを経由するよう実装されているかによって決まります。現在バンドルされている対応チャネルには、ClickClack、Discord、Feishu、Google Chat、iMessage、IRC、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Signal、Slack、SMS、Telegram、WhatsApp、Zalo、Zalo Personal があります。静的な `message.senders` グループはチャネルに依存しないため、新しいメッセージチャネルでも、独自の許可リスト展開ではなく共有 Plugin SDK の受信ヘルパーを使用することで利用できます。

## Discord チャネルの対象者

Discord は動的なアクセスグループ型にも対応しています。

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

`discord.channelAudience` は、「現在このギルドチャネルを閲覧できる Discord DM 送信者を許可する」という意味です。OpenClaw は認可時に Discord を通じて送信者を解決し、Discord の `ViewChannel` 権限ルールを適用します。`membership` は任意で、デフォルトは `canViewChannel` です。

`#maintainers` や `#on-call` など、Discord チャネルがすでにチームの信頼できる情報源になっている場合に使用します。

要件と失敗時の動作：

- ボットはギルドとチャネルにアクセスできる必要があります。
- ボットには Discord Developer Portal の **Server Members Intent** が必要です。
- Discord が `Missing Access` を返した場合、送信者をギルドメンバーとして解決できない場合、またはチャネルが別のギルドに属する場合、アクセスグループは許可せずに失敗します。

Discord 固有のその他の例：[Discord のアクセス制御](/ja-JP/channels/discord#access-control-and-routing)

## Plugin の診断

Plugin 作成者は、構造化されたアクセスグループの状態をフラットな許可リストに再展開せずに調査できます。

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

結果には、参照されたグループ、一致したグループ、存在しないグループ、未対応のグループ、失敗したグループが示されます。診断または適合性テストに使用してください。フラットな `allowFrom` 配列を引き続き必要とする互換性パスでのみ、`expandAllowFromWithAccessGroups(...)` を使用してください。

## セキュリティ上の注意

- アクセスグループは許可リストの別名であり、ロールではありません。それ自体では所有者を作成したり、ペアリング要求を承認したり、ツール権限を付与したりしません。
- `dmPolicy: "open"` でも、有効な DM 許可リストに `"*"` が必要です。アクセスグループの参照は、公開アクセスと同じではありません。
- 存在しないグループ名は許可せずに失敗します。`allowFrom` に `accessGroup:operators` が含まれ、`accessGroups.operators` が存在しない場合、そのエントリは誰も認可しません。
- チャネル ID は安定したものを使用してください。チャネルが数値 ID／ユーザー ID と表示名の両方に対応している場合は、表示名より数値 ID／ユーザー ID を優先してください。

## トラブルシューティング

送信者が一致するはずなのにブロックされる場合：

1. 許可リストフィールドに正確な `accessGroup:<name>` 参照が含まれていることを確認します。
2. `accessGroups.<name>.type` が正しいことを確認します。
3. 送信者 ID が対応するチャネルキーまたは `"*"` に記載されていることを確認します。
4. エントリがそのチャネルの通常の許可リスト構文を使用していることを確認します。
5. Discord チャネルの対象者については、ボットがギルドチャネルを閲覧でき、Server Members Intent が有効になっていることを確認します。

アクセス制御設定を編集した後は、`openclaw doctor` を実行してください。実行時に至る前に、無効な許可リストとポリシーの組み合わせを多数検出できます。
