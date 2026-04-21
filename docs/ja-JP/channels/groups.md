---
read_when:
    - グループチャットの挙動またはメンションのゲートの変更
summary: 各サーフェスにまたがるグループチャットの挙動（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: グループ
x-i18n:
    generated_at: "2026-04-21T04:43:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# グループ

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo といった各サーフェスで、グループチャットを一貫して扱います。

## 初心者向けイントロ（2分）

OpenClaw は、あなた自身のメッセージングアカウント上で「動作」します。別個の WhatsApp bot ユーザーは存在しません。
**あなた** がグループに参加していれば、OpenClaw はそのグループを参照でき、そこで応答できます。

デフォルトの動作:

- グループは制限されます（`groupPolicy: "allowlist"`）。
- 明示的にメンションのゲートを無効にしない限り、返信にはメンションが必要です。

つまり、allowlist に登録された送信者は、OpenClaw にメンションすることでトリガーできます。

> 要点
>
> - **DM アクセス** は `*.allowFrom` で制御されます。
> - **グループアクセス** は `*.groupPolicy` + allowlist（`*.groups`, `*.groupAllowFrom`）で制御されます。
> - **返信トリガー** はメンションのゲート（`requireMention`, `/activation`）で制御されます。

クイックフロー（グループメッセージで何が起きるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## コンテキストの可視性と allowlist

グループの安全性には、2 つの異なる制御が関係します。

- **トリガー認可**: 誰がエージェントをトリガーできるか（`groupPolicy`, `groups`, `groupAllowFrom`, チャネル固有の allowlist）。
- **コンテキストの可視性**: どの補足コンテキストがモデルに注入されるか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は通常のチャット動作を優先し、コンテキストをほぼ受信したまま保持します。これは、allowlist が主に誰がアクションをトリガーできるかを決めるものであり、すべての引用や履歴スニペットに対する普遍的なマスキング境界ではないことを意味します。

現在の挙動はチャネルごとに異なります。

- 一部のチャネルでは、特定の経路で補足コンテキストに対して送信者ベースのフィルタリングがすでに適用されています（たとえば Slack のスレッドシード、Matrix の返信／スレッド参照）。
- 他のチャネルでは、引用／返信／転送コンテキストが受信したまま渡されます。

強化の方向性（予定）:

- `contextVisibility: "all"`（デフォルト）は、現在の受信したままの挙動を維持します。
- `contextVisibility: "allowlist"` は、補足コンテキストを allowlist に登録された送信者に絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` に加えて、明示的な 1 件の引用／返信例外を含みます。

この強化モデルが各チャネルで一貫して実装されるまでは、サーフェスごとの差異があるものと考えてください。

![グループメッセージフロー](/images/groups-flow.svg)

次のようにしたい場合…

| 目的 | 設定するもの |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可しつつ、`@mention` のときだけ返信する | `groups: { "*": { requireMention: true } }` |
| すべてのグループ返信を無効にする | `groupPolicy: "disabled"` |
| 特定のグループのみ | `groups: { "<group-id>": { ... } }`（`"*"` キーなし） |
| グループ内でトリガーできるのを自分だけにする | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` のセッションキーを使用します（room/channel は `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram の forum topic では、各 topic が独自のセッションを持つように、グループ id に `:topic:<threadId>` が追加されます。
- ダイレクトチャットはメインセッションを使用します（または設定されていれば送信者ごと）。
- グループセッションでは Heartbeat はスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人 DM + 公開グループ（単一エージェント）

はい、これは「個人」トラフィックが **DM** で、「公開」トラフィックが **グループ** である場合にうまく機能します。

理由: 単一エージェントモードでは、DM は通常 **main** セッションキー（`agent:main:main`）に入り、一方でグループは常に **非 main** セッションキー（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンド上で実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、Docker がデフォルトです。

これにより、1 つのエージェント「brain」（共有ワークスペース + メモリ）を維持しつつ、2 つの実行態勢を持てます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

> 本当に別々のワークスペース／ペルソナ（「個人」と「公開」を絶対に混在させたくない）が必要なら、2 つ目のエージェント + binding を使ってください。[Multi-Agent Routing](/ja-JP/concepts/multi-agent) を参照してください。

例（DM はホスト上、グループはサンドボックス化 + メッセージング専用ツール）:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

「ホストアクセスなし」ではなく「グループがフォルダ X だけ見られる」ようにしたい場合は、`workspaceAccess: "none"` を維持しつつ、allowlist に登録したパスだけをサンドボックスへマウントします。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

関連:

- 設定キーとデフォルト: [Gateway configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)
- なぜツールがブロックされているかをデバッグする: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mount の詳細: [Sandboxing](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合は `displayName` を使い、`<channel>:<token>` の形式で表示されます。
- `#room` は room/channel 用に予約されており、グループチャットには `g-<slug>` を使います（小文字、スペースは `-`、`#@+._-` は維持）。

## グループポリシー

チャネルごとに、グループ／room メッセージの扱い方を制御します。

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Policy | 挙動 |
| ------------- | ------------------------------------------------------------ |
| `"open"` | グループは allowlist をバイパスします。メンションのゲートは引き続き適用されます。 |
| `"disabled"` | すべてのグループメッセージを完全にブロックします。 |
| `"allowlist"` | 設定された allowlist に一致するグループ／room のみ許可します。 |

注:

- `groupPolicy` は、メンションのゲート（`@mention` を要求する）とは別です。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
- DM のペアリング承認（`*-allowFrom` の保存エントリ）は DM アクセスにのみ適用され、グループ送信者の認可は引き続きグループ allowlist に対して明示的に行われます。
- Discord: allowlist には `channels.discord.guilds.<id>.channels` を使用します。
- Slack: allowlist には `channels.slack.channels` を使用します。
- Matrix: allowlist には `channels.matrix.groups` を使用します。room ID または alias の使用を推奨します。参加済み room 名の参照はベストエフォートで、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用してください。room ごとの `users` allowlist もサポートされます。
- グループ DM は別途制御されます（`channels.discord.dm.*`, `channels.slack.dm.*`）。
- Telegram の allowlist は、ユーザー ID（`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致させられます。プレフィックスは大文字小文字を区別しません。
- デフォルトは `groupPolicy: "allowlist"` です。グループ allowlist が空の場合、グループメッセージはブロックされます。
- 実行時の安全性: provider ブロックが完全に欠けている場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズドモード（通常は `allowlist`）にフォールバックします。

クイックな考え方（グループメッセージの評価順序）:

1. `groupPolicy`（open/disabled/allowlist）
2. グループ allowlist（`*.groups`, `*.groupAllowFrom`, チャネル固有の allowlist）
3. メンションのゲート（`requireMention`, `/activation`）

## メンションのゲート（デフォルト）

グループメッセージは、グループごとに上書きしない限りメンションが必要です。デフォルトは各サブシステム配下の `*.groups."*"` にあります。

チャネルが返信メタデータをサポートしている場合、bot メッセージへの返信は暗黙のメンションとして扱われます。
チャネルが引用メタデータを公開している場合、bot メッセージの引用も暗黙のメンションとして扱われることがあります。現在の組み込み対象には、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUser が含まれます。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

注:

- `mentionPatterns` は大文字小文字を区別しない安全な regex パターンです。無効なパターンや、安全でないネストされた繰り返し形式は無視されます。
- 明示的なメンションを提供するサーフェスでは、それらが引き続き通ります。pattern はフォールバックです。
- エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントが 1 つのグループを共有する場合に有用）。
- メンションのゲートは、メンション検出が可能な場合にのみ適用されます（ネイティブメンションがあるか、`mentionPatterns` が設定されている場合）。
- Discord のデフォルトは `channels.discord.guilds."*"` にあります（guild/channel ごとに上書き可能）。
- グループ履歴コンテキストは、全チャネルで一貫した形でラップされ、**保留中のみ** です（メンションのゲートによりスキップされたメッセージ）。グローバルデフォルトには `messages.groupChat.historyLimit` を、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

## グループ／チャネルのツール制限（任意）

一部のチャネル設定では、**特定のグループ／room／channel 内で** 利用可能なツールを制限できます。

- `tools`: グループ全体に対するツールの許可／拒否。
- `toolsBySender`: グループ内での送信者ごとの上書き。
  明示的なキープレフィックスを使用します:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, および `"*"` ワイルドカード。
  旧来のプレフィックスなしキーも引き続き受け付けられ、`id:` のみとして一致します。

解決順序（最も具体的なものが優先）:

1. グループ／channel の `toolsBySender` 一致
2. グループ／channel の `tools`
3. デフォルト（`"*"`）の `toolsBySender` 一致
4. デフォルト（`"*"`）の `tools`

例（Telegram）:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

注:

- グループ／channel のツール制限は、グローバル／エージェントのツールポリシーに追加で適用されます（`deny` が引き続き優先されます）。
- 一部のチャネルでは、room/channel のネスト構造が異なります（例: Discord の `guilds.*.channels.*`、Slack の `channels.*`、Microsoft Teams の `teams.*.channels.*`）。

## グループ allowlist

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ allowlist として機能します。すべてのグループを許可しつつ、デフォルトのメンション動作も設定したい場合は、`"*"` を使用します。

よくある混乱: DM のペアリング承認は、グループ認可と同じではありません。
DM のペアリングをサポートするチャネルでは、ペアリングストアが解除するのは DM のみです。グループコマンドには、引き続き `groupAllowFrom` や、そのチャネルで文書化されている設定フォールバックなど、設定 allowlist による明示的なグループ送信者認可が必要です。

一般的な意図（コピー＆ペースト用）:

1. すべてのグループ返信を無効にする

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 特定のグループのみ許可する（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. すべてのグループを許可するが、メンションを必須にする（明示的）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. グループ内でトリガーできるのをオーナーだけにする（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation（オーナーのみ）

グループオーナーは、グループごとの activation を切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom` によって判定されます（未設定時は bot 自身の E.164）。コマンドは単独のメッセージとして送信してください。現在のところ、他のサーフェスでは `/activation` は無視されます。

## コンテキストフィールド

グループの受信 payload では、以下が設定されます。

- `ChatType=group`
- `GroupSubject`（わかっている場合）
- `GroupMembers`（わかっている場合）
- `WasMentioned`（メンションのゲート結果）
- Telegram の forum topic には、さらに `MessageThreadId` と `IsForum` も含まれます。

チャネル固有の注記:

- BlueBubbles は、`GroupMembers` を設定する前に、名前のない macOS グループ参加者をローカルの Contacts データベースから補完するオプションがあります。これはデフォルトではオフで、通常のグループゲートを通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ向けイントロが含まれます。これによりモデルに対して、人間のように応答すること、Markdown テーブルを避けること、空行を最小限にし通常のチャットの間隔に従うこと、文字どおりの `\n` シーケンスを打たないことが促されます。

## iMessage 固有事項

- ルーティングや allowlist には `chat_id:<id>` を優先して使用してください。
- チャット一覧: `imsg chats --limit 20`
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsApp 固有事項

WhatsApp 専用の挙動（履歴注入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages) を参照してください。
