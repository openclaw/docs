---
read_when:
    - グループチャットの動作またはメンションゲーティングを変更する
summary: 各サーフェスにおけるグループチャットの動作（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）
title: グループ
x-i18n:
    generated_at: "2026-04-24T04:46:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClawは、Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zaloといった各サーフェスで、グループチャットを一貫して扱います。

## 初心者向けイントロ（2分）

OpenClawは、あなた自身のメッセージングアカウント上で「動作」します。専用のWhatsAppボットユーザーは存在しません。
**あなた**がグループに参加していれば、OpenClawはそのグループを確認し、そこで応答できます。

デフォルトの動作:

- グループは制限されています（`groupPolicy: "allowlist"`）。
- 明示的にメンションゲーティングを無効にしない限り、返信にはメンションが必要です。

つまり、allowlistに登録された送信者は、OpenClawにメンションすることで起動できます。

> 要点
>
> - **DMアクセス** は `*.allowFrom` によって制御されます。
> - **グループアクセス** は `*.groupPolicy` + allowlist（`*.groups`、`*.groupAllowFrom`）によって制御されます。
> - **返信のトリガー** はメンションゲーティング（`requireMention`、`/activation`）によって制御されます。

クイックフロー（グループメッセージで何が起こるか）:

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> context用にのみ保存
otherwise -> reply
```

## コンテキスト可視性とallowlist

グループの安全性には、2つの異なる制御が関係します。

- **トリガー認可**: 誰がエージェントを起動できるか（`groupPolicy`、`groups`、`groupAllowFrom`、チャネル固有のallowlist）。
- **コンテキスト可視性**: どの補足コンテキストがモデルに注入されるか（返信テキスト、引用、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClawは通常のチャット動作を優先し、コンテキストを受信した状態にできるだけ近い形で保持します。これは、allowlistが主に「誰がアクションを起動できるか」を決めるのであって、引用や履歴のあらゆる断片に対する普遍的なマスキング境界ではないことを意味します。

現在の動作はチャネル固有です。

- 一部のチャネルでは、特定の経路ですでに送信者ベースの補足コンテキストフィルタリングが適用されています（たとえば、Slackのスレッド初期化、Matrixの返信/スレッド参照）。
- 他のチャネルでは、引用/返信/転送コンテキストが受信したまま渡されます。

強化の方向性（予定）:

- `contextVisibility: "all"`（デフォルト）は、現在の受信時そのままの動作を維持します。
- `contextVisibility: "allowlist"` は、補足コンテキストをallowlistに登録された送信者に限定します。
- `contextVisibility: "allowlist_quote"` は、`allowlist` に加えて、明示的な1件の引用/返信例外を許可します。

この強化モデルが各チャネルで一貫して実装されるまでは、サーフェスごとの差異があることを前提にしてください。

![グループメッセージフロー](/images/groups-flow.svg)

もし次のようにしたい場合...

| 目的 | 設定するもの |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可するが、`@mention` のときだけ返信する | `groups: { "*": { requireMention: true } }` |
| すべてのグループ返信を無効にする | `groupPolicy: "disabled"` |
| 特定のグループだけにする | `groups: { "<group-id>": { ... } }`（`"*"` キーなし） |
| グループで起動できるのを自分だけにする | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## SessionKey

- グループセッションは `agent:<agentId>:<channel>:group:<id>` のSessionKeyを使います（ルーム/チャネルは `agent:<agentId>:<channel>:channel:<id>` を使います）。
- TelegramのフォーラムトピックはグループIDに `:topic:<threadId>` を追加するため、各トピックが独自のセッションを持ちます。
- ダイレクトチャットはmainセッションを使います（または設定されていれば送信者ごと）。
- グループセッションではHeartbeatはスキップされます。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン: 個人DM + 公開グループ（単一エージェント）

はい — 「個人」トラフィックが**DM**で、「公開」トラフィックが**グループ**であれば、これはうまく機能します。

理由: 単一エージェントモードでは、DMは通常 **main** SessionKey（`agent:main:main`）に入り、一方でグループは常に **non-main** SessionKey（`agent:main:<channel>:group:<id>`）を使います。`mode: "non-main"` でサンドボックスを有効にすると、それらのグループセッションは設定されたサンドボックスバックエンドで実行され、main DMセッションはホスト上に残ります。バックエンドを選択しない場合、Dockerがデフォルトです。

これにより、1つのエージェント「brain」（共有ワークスペース + メモリ）を持ちながら、2つの実行姿勢を取れます。

- **DM**: フルツール（ホスト）
- **グループ**: サンドボックス + 制限付きツール

> 本当に別々のワークスペース/ペルソナ（「個人」と「公開」を決して混在させてはならない）が必要なら、2つ目のエージェント + bindingsを使ってください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。

例（DMはホスト、グループはサンドボックス化 + メッセージング専用ツール）:

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

「ホストアクセスなし」ではなく「グループはフォルダXだけ見える」にしたい場合は、`workspaceAccess: "none"` を維持し、allowlistに登録したパスだけをサンドボックスにマウントします。

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

- 設定キーとデフォルト: [Gateway設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- なぜツールがブロックされるのかをデバッグする: [Sandbox と Tool Policy と Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mountの詳細: [サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UIラベルは、利用可能な場合は `displayName` を使い、`<channel>:<token>` の形式で表示されます。
- `#room` はルーム/チャネル用に予約されています。グループチャットは `g-<slug>` を使います（小文字、空白は `-` に変換、`#@+._-` は保持）。

## グループポリシー

チャネルごとに、グループ/ルームメッセージの扱い方を制御します。

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

| ポリシー | 動作 |
| ------------- | ------------------------------------------------------------ |
| `"open"` | グループはallowlistをバイパスします。メンションゲーティングは引き続き適用されます。 |
| `"disabled"` | すべてのグループメッセージを完全にブロックします。 |
| `"allowlist"` | 設定されたallowlistに一致するグループ/ルームのみ許可します。 |

注記:

- `groupPolicy` はメンションゲーティング（`@mention` を必要とするもの）とは別です。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使います（フォールバック: 明示的な `allowFrom`）。
- DMペアリング承認（`*-allowFrom` ストアエントリ）はDMアクセスにのみ適用されます。グループ送信者の認可は、引き続きグループallowlistで明示的に行われます。
- Discord: allowlistは `channels.discord.guilds.<id>.channels` を使います。
- Slack: allowlistは `channels.slack.channels` を使います。
- Matrix: allowlistは `channels.matrix.groups` を使います。ルームIDまたはエイリアスの使用を推奨します。参加済みルーム名の参照はベストエフォートであり、解決できない名前は実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使ってください。ルームごとの `users` allowlistもサポートされています。
- グループDMは別個に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegramのallowlistは、ユーザーID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）またはユーザー名（`"@alice"` または `"alice"`）に一致できます。プレフィックスは大文字小文字を区別しません。
- デフォルトは `groupPolicy: "allowlist"` です。グループallowlistが空の場合、グループメッセージはブロックされます。
- 実行時の安全性: プロバイダブロック全体が完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェイルクローズドモード（通常は `allowlist`）にフォールバックします。

クイックな考え方（グループメッセージの評価順序）:

1. `groupPolicy`（open/disabled/allowlist）
2. グループallowlist（`*.groups`、`*.groupAllowFrom`、チャネル固有のallowlist）
3. メンションゲーティング（`requireMention`、`/activation`）

## メンションゲーティング（デフォルト）

グループメッセージは、グループごとに上書きされない限りメンションが必要です。デフォルトはサブシステムごとに `*.groups."*"` の下にあります。

チャネルが返信メタデータをサポートしている場合、ボットメッセージへの返信は暗黙のメンションとして扱われます。引用メタデータを公開しているチャネルでは、ボットメッセージの引用も暗黙のメンションとして扱われることがあります。現在の組み込み対象には、Telegram、WhatsApp、Slack、Discord、Microsoft Teams、ZaloUserが含まれます。

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

注記:

- `mentionPatterns` は大文字小文字を区別しない安全な正規表現パターンです。無効なパターンや、安全でないネスト反復形式は無視されます。
- 明示的なメンションを提供するサーフェスでは、それらが引き続き渡されます。パターンはフォールバックです。
- エージェントごとの上書き: `agents.list[].groupChat.mentionPatterns`（複数のエージェントが1つのグループを共有する場合に有用）。
- メンションゲーティングは、メンション検出が可能な場合にのみ適用されます（ネイティブメンションがあるか、`mentionPatterns` が設定されている場合）。
- Discordのデフォルトは `channels.discord.guilds."*"` にあります（guild/チャネルごとに上書き可能）。
- グループ履歴コンテキストはチャネル間で統一的にラップされ、**保留中のみ**です（メンションゲーティングによってスキップされたメッセージ）。グローバルデフォルトには `messages.groupChat.historyLimit` を使い、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使います。無効化するには `0` を設定します。

## グループ/チャネルのツール制限（任意）

一部のチャネル設定では、**特定のグループ/ルーム/チャネル内で**利用できるツールを制限できます。

- `tools`: グループ全体に対するツールの許可/拒否。
- `toolsBySender`: グループ内での送信者ごとの上書き。
  明示的なキープレフィックスを使用します:
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。
  従来のプレフィックスなしキーも引き続き受け付けられ、`id:` のみとして一致されます。

解決順序（最も具体的なものが優先）:

1. グループ/チャネルの `toolsBySender` 一致
2. グループ/チャネルの `tools`
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

注記:

- グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（denyが引き続き優先されます）。
- 一部のチャネルでは、ルーム/チャネルに異なるネストを使用します（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## グループallowlist

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループallowlistとして機能します。すべてのグループを許可しつつデフォルトのメンション動作も設定したい場合は、`"*"` を使います。

よくある混乱として、DMペアリング承認はグループ認可と同じではありません。
DMペアリングをサポートするチャネルでは、ペアリングストアで解除されるのはDMのみです。グループコマンドには、引き続き `groupAllowFrom` や、そのチャネルで文書化されている設定フォールバックなど、設定allowlistからの明示的なグループ送信者認可が必要です。

よくある意図（コピー&ペースト）:

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

4. グループで起動できるのをオーナーのみにする（WhatsApp）

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

## アクティベーション（オーナーのみ）

グループオーナーは、グループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom` によって決まります（未設定時はボット自身のE.164）。コマンドは単独のメッセージとして送信してください。現在、他のサーフェスでは `/activation` は無視されます。

## コンテキストフィールド

グループ受信ペイロードでは次が設定されます。

- `ChatType=group`
- `GroupSubject`（わかっている場合）
- `GroupMembers`（わかっている場合）
- `WasMentioned`（メンションゲーティング結果）
- Telegramのフォーラムトピックには、さらに `MessageThreadId` と `IsForum` が含まれます。

チャネル固有の注記:

- BlueBubblesは、`GroupMembers` を設定する前に、名前のないmacOSグループ参加者をローカルの連絡先データベースから任意で補完できます。これはデフォルトでは無効で、通常のグループゲーティングを通過した後にのみ実行されます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターンでグループ向けイントロが含まれます。これは、モデルに対して人間のように応答すること、Markdownテーブルを避けること、空行を最小限にすること、通常のチャットの間隔に従うこと、そして文字通りの `\n` シーケンスを入力しないことを促します。チャネル由来のグループ名と参加者ラベルは、インラインのシステム命令ではなく、フェンス付きの信頼されていないメタデータとしてレンダリングされます。

## iMessage固有事項

- ルーティングやallowlistには `chat_id:<id>` を推奨します。
- チャット一覧: `imsg chats --limit 20`
- グループ返信は常に同じ `chat_id` に返されます。

## WhatsAppシステムプロンプト

グループおよびダイレクトのプロンプト解決、ワイルドカードの動作、アカウント上書きのセマンティクスを含む、正式なWhatsAppシステムプロンプトルールについては、[WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp固有事項

WhatsApp専用の動作（履歴注入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages) を参照してください。

## 関連

- [グループメッセージ](/ja-JP/channels/group-messages)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ペアリング](/ja-JP/channels/pairing)
