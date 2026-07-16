---
read_when:
    - グループチャットの動作またはメンション制限の変更
    - mentionPatterns の適用範囲を特定のグループ会話に限定する
sidebarTitle: Groups
summary: 各サーフェス（Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo）におけるグループチャットの動作
title: グループ
x-i18n:
    generated_at: "2026-07-16T11:21:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo など、グループに対応するすべてのチャンネルに同じグループルールを適用します。

エージェントが明示的に表示メッセージを送信しない限り、静かなコンテキストを提供する常時稼働ルームについては、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

## 初心者向け概要（2 分）

OpenClaw は自身のメッセージングアカウント上で「動作」します。独立した WhatsApp ボットユーザーは存在しません。**自分**がグループに参加していれば、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作：

- グループは制限されます（`groupPolicy: "allowlist"`）。グループの送信者は、許可リストに追加されるまでブロックされます。
- グループのメンションゲートを無効にしない限り、返信にはメンションが必要です。
- 最終返信テキストはルームに自動的に投稿されます（`visibleReplies: "automatic"`）。

つまり、許可リストに登録された送信者は、OpenClaw にメンションすることで起動できます。

<Note>
**要約**

- **DM アクセス**は `*.allowFrom` で制御されます。
- **グループアクセス**は `*.groupPolicy` と許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**はメンションゲート（`requireMention`、`/activation`）で制御されます。

</Note>

簡単なフロー（グループメッセージの処理）：

```text
groupPolicy? disabled -> 破棄
groupPolicy? allowlist -> グループは許可済み？ いいえ -> 破棄
requireMention? yes -> メンションされた？ いいえ -> コンテキストとしてのみ保存
メンション/返信/コマンド/DM -> ユーザーリクエスト
常時稼働グループの会話 -> ユーザーリクエスト、または設定されている場合はルームイベント
```

## 表示される返信

通常のグループ/チャンネルリクエストでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "automatic"` です。最終的なアシスタントテキストが表示返信としてルームに投稿されます。

共有ルームで、`message(action=send)` を呼び出すことによりエージェント自身に発言のタイミングを判断させる場合は、`messages.groupChat.visibleReplies: "message_tool"` を使用します。これは、ツールを確実に使用できるモデル（たとえば GPT-5.6 Sol）で最も効果的です。モデルがツールを使用せず、実質的な最終テキストを返した場合、OpenClaw はそのテキストをルームに投稿せず非公開のままにします。

ツールのみの配信指示に確実には従わないモデルまたはランタイムには、`"automatic"` を使用します。通常の最終テキストはルームに直接投稿され、最終テキストと一緒に送れないファイル、画像、その他の添付ファイルについては、エージェントが引き続き `message(action=send)` を呼び出せます。

有効なツールポリシーでメッセージツールを使用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動表示返信にフォールバックします。`openclaw doctor` は、この不一致について警告します。

ダイレクトチャットおよびその他のすべてのソースイベントでは、`messages.visibleReplies: "message_tool"` が同じツールのみの動作をグローバルに適用します。`messages.groupChat.visibleReplies` は引き続き、グループ/チャンネルルーム向けのより具体的なオーバーライドです。内部 WebChat のダイレクトターンでは、Pi と Codex が同じ表示返信契約を受け取れるよう、デフォルトで最終返信を自動配信します。

ツールのみモードは、ほとんどの傍観モードのターンでモデルに `NO_REPLY` と応答させる従来のパターンに代わるものです。ツールのみモードでは、プロンプトは `NO_REPLY` 契約を定義しません。何も表示しない場合は、単にメッセージツールを呼び出さないことを意味します。

Plugin が所有する会話バインディングは例外です。Plugin がスレッドをバインドして受信ターンを引き受けると、Plugin が返す返信が表示されるバインディング応答となり、`message(action=send)` は不要です。この返信は Plugin ランタイムの出力であり、非公開のモデル最終テキストではありません。

ダイレクトなグループリクエストでは、入力中インジケーターも引き続き送信されます。アンビエントな常時稼働ルームイベントは、有効な場合でも、エージェントがメッセージツールを呼び出さない限り、厳格に何も表示しません。

セッションでは、詳細なツール/進行状況の要約がデフォルトで抑制されます。デバッグ中に現在のセッションで表示するには `/verbose on`（または `/verbose full`）を使用し、最終返信のみの動作に戻すには `/verbose off` を使用します。詳細表示の状態はセッション単位であり、ダイレクトチャット、グループ、チャンネル、フォーラムトピックで同様に機能します。

メンションされていない常時稼働グループの会話を、ユーザーリクエストではなく静かなルームコンテキストとして送信するには、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使用します：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

デフォルトは `unmentionedInbound: "user_request"` です。メンションされたメッセージ、コマンド、中止リクエスト、DM は引き続きユーザーリクエストとして扱われます。

グループ/チャンネルリクエストの表示出力をメッセージツール経由に限定するには：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

すべてのソースチャットで必須にするには：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ファイルを保存すると、Gateway は再起動せずに `messages` の設定変更を反映します。設定の再読み込みが無効（`gateway.reload.mode: "off"`）の場合にのみ再起動してください。

コマンドターンは `visibleReplies: "message_tool"` を迂回し、常に表示返信を行います。ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンドをサポートするその他のサーフェス）と、認可されたテキスト `/...` コマンドは、どちらも応答をソースチャットに投稿します。グループ内の認可されていないテキスト `/...` ターンは、メッセージツールのみのままです。通常のチャットターンは設定されたデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関係します：

- **トリガー認可**：エージェントを起動できるユーザー（`groupPolicy`、`groups`、`groupAllowFrom`、チャンネル固有の許可リスト）。
- **コンテキストの可視性**：モデルに注入される補助コンテキスト（返信/引用テキスト、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は受信したコンテキストをそのまま維持します。許可リストはアクションを起動できるユーザーを決定するものであり、モデルに表示される引用や履歴の断片を決定するものではありません。補助コンテキストもフィルタリングするには、`contextVisibility` を設定します：

| モード                | 動作                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"`（デフォルト）   | 補助コンテキストを受信したまま維持します。                                           |
| `"allowlist"`       | 許可リストに登録された送信者の履歴/スレッド/引用/転送コンテキストのみを注入します。     |
| `"allowlist_quote"` | `allowlist` に加え、送信者を問わず、明示的に引用されたメッセージまたは返信先のメッセージを維持します。 |

チャンネル単位（`channels.<channel>.contextVisibility`）、アカウント単位（`channels.<channel>.accounts.<accountId>.contextVisibility`）、またはグローバル（`channels.defaults.contextVisibility`）で設定します。補助コンテキストを取得するチャンネル（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）は、受信コンテキストの構築時にこのポリシーを適用します。不明なポリシーの組み合わせはフェイルクローズとなり、コンテキストを省略します。

![グループメッセージのフロー](/images/groups-flow.svg)

目的別の設定：

| 目的                                         | 設定                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可し、@メンションにのみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする                    | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                                 | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）         |
| グループで自分だけが起動できる                       | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| チャンネル間で信頼済み送信者セットを再利用する        | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム/チャンネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram のフォーラムトピックでは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` を追加します。
- ダイレクトチャットはメインセッションを使用します（`session.dmScope` が設定されている場合は送信者ごとのセッション）。
- Heartbeat は設定された Heartbeat セッション（デフォルト：エージェントのメインセッション）で実行されます。グループセッションは独自の Heartbeat を実行しません。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン：個人 DM + 公開グループ（単一エージェント）

はい。「個人」トラフィックが **DM** で「公開」トラフィックが **グループ** なら、適切に機能します。

理由：単一エージェントモードでは、DM は通常 **メイン** セッションキー（`agent:main:main`）に入り、グループは常に **非メイン** セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、これらのグループセッションは設定されたサンドボックスバックエンドで実行される一方、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、デフォルトは Docker です。

これにより、1 つのエージェントの「頭脳」（共有ワークスペース + メモリ）を維持しながら、2 つの実行形態を利用できます：

- **DM**：すべてのツール（ホスト）
- **グループ**：サンドボックス + 制限されたツール

<Note>
完全に分離されたワークスペース/ペルソナが必要な場合（「個人」と「公開」が決して混在してはならない場合）は、2 つ目のエージェントとバインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="DM はホスト上、グループはサンドボックス化">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // グループ/チャンネルは非メイン -> サンドボックス化
            scope: "session", // 最も強い分離（グループ/チャンネルごとに 1 つのコンテナ）
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // allow が空でない場合、それ以外はすべてブロックされます（deny が引き続き優先されます）。
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="グループには許可リストに登録されたフォルダーのみを表示">
    「ホストへのアクセスなし」ではなく「グループはフォルダー X のみ表示可能」にする場合は、`workspaceAccess: "none"` を維持し、許可リストに登録したパスだけをサンドボックスにマウントします：

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

  </Tab>
</Tabs>

関連項目：

- 設定キーとデフォルト：[Gateway の設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ：[サンドボックスとツールポリシーと昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細：[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルは、利用可能な場合は `displayName` を使用し、`<channel>:<token>` の形式で表示されます。
- `#room` はルーム/チャンネル用に予約されています。グループチャットでは `g-<slug>` を使用します（小文字、空白 -> `-`、`#@+._-` は維持）。非常に長い不透明な ID は、完全なルート ID が UI に漏れるのを避けるため、安定したトークンに短縮されます。

## グループポリシー

チャンネルごとにグループ/ルームメッセージの処理方法を制御します：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 数値の Telegram ユーザー ID（セットアップ時に @username を解決）
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| ポリシー        | 動作                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは許可リストを迂回しますが、メンションゲートは引き続き適用されます。      |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。                           |
| `"allowlist"` | 設定された許可リストに一致するグループ／ルームのみ許可します。 |

<AccordionGroup>
  <Accordion title="チャンネル別の注意事項">
    - `groupPolicy` はメンションゲート（@メンションを必須にする機能）とは別です。
    - WhatsApp／Telegram／Signal／iMessage／Microsoft Teams／Zalo：`groupAllowFrom` を使用します（フォールバック：明示的な `allowFrom`）。
    - Signal：`groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号／UUID のいずれにも一致できます。
    - DM ペアリングの承認（`*-allowFrom` ストアのエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可は、引き続きグループ許可リストで明示的に指定します。
    - Discord：許可リストには `channels.discord.guilds.<id>.channels` を使用します。
    - Slack：許可リストには `channels.slack.channels` を使用します。
    - Matrix：許可リストには `channels.matrix.groups` を使用します。ルーム ID（`!room:server`）またはエイリアス（`#alias:server`）を使用してください。ルーム名のキーは `channels.matrix.dangerouslyAllowNameMatching: true` がある場合にのみ一致し、解決できないエントリは実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は個別に制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：送信者許可リストでは数値のユーザー ID のみ使用できます（`"123456789"`。`telegram:`／`tg:` プレフィックスは大文字と小文字を区別せずに除去されます）。`@username` エントリは実行時には一致せず、警告がログに記録されます。セットアップでは `@username` を ID に解決します。負のチャット ID は送信者許可リストではなく、`channels.telegram.groups` に指定します。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性：プロバイダーブロックが完全に欠落している場合（`channels.<provider>` が存在しない場合）、グループポリシーは `channels.defaults.groupPolicy` を継承せず、安全側に倒して `allowlist` になります。また、Gateway はアカウントごとにフォールバックを一度ログに記録します。

  </Accordion>
</AccordionGroup>

簡単な概念モデル（グループメッセージの評価順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`、`*.groupAllowFrom`、チャンネル固有の許可リスト）。
  </Step>
  <Step title="メンションゲート">
    メンションゲート（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲート（デフォルト）

グループメッセージでは、グループごとに上書きされていない限りメンションが必要です。デフォルトはサブシステムごとの `*.groups."*"` にあります。

チャンネルが返信メタデータを公開している場合、ボットのメッセージへの返信は暗黙的なメンションとして扱われます。引用メタデータを公開しているチャンネルでは、ボットのメッセージの引用もメンションとして扱われる場合があります。現在の組み込み対象：Discord、Microsoft Teams、QQBot、Slack、Telegram、WhatsApp、Zalo personal。

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

## 設定済みメンションパターンのスコープ

設定済みの `mentionPatterns` は、正規表現によるフォールバックトリガーです。プラットフォームがネイティブなボットメンションを公開しない場合や、`openclaw:` のようなプレーンテキストをメンションとして扱いたい場合に使用します。ネイティブなプラットフォームメンションは別に扱われます。Discord、Slack、Telegram、Matrix、Signal、または別のチャンネルが、メッセージ内でボットが明示的にメンションされたことを確認できる場合、設定済みの正規表現パターンが拒否されていても、そのネイティブメンションは引き続きトリガーになります。

デフォルトでは、設定済みのメンションパターンは、チャンネルがプロバイダーおよび会話の情報をメンション検出に渡すすべての場所に適用されます。広範なパターンによってすべてのグループでエージェントが起動しないようにするには、`channels.<channel>.mentionPatterns` を使用してチャンネルごとにスコープを設定します。

正規表現メンションパターンをチャンネルでデフォルト無効にし、`allowIn` を使用して特定のルームでのみ有効にする場合は、`mode: "deny"` を使用します：

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

正規表現メンションパターンを広範に適用し、`denyIn` を使用してノイズの多いルームで無効にする場合は、デフォルトの `mode: "allow"` を使用します（または `mode` を省略します）：

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

ポリシーの解決：

| フィールド           | 効果                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 会話 ID が `denyIn` に含まれていない限り、正規表現メンションパターンが有効になります。これがデフォルトです。                    |
| `mode: "deny"`  | 会話 ID が `allowIn` に含まれていない限り、正規表現メンションパターンが無効になります。                                       |
| `allowIn`       | deny モードで正規表現メンションパターンを有効にする会話 ID。                                               |
| `denyIn`        | 正規表現メンションパターンを無効にする会話 ID。両方に同じ ID が含まれる場合、`denyIn` が `allowIn` より優先されます。 |

現在サポートされているスコープ付き正規表現ポリシー：

| チャンネル  | `allowIn` / `denyIn` で使用する ID                             |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord チャンネル ID。                                         |
| Matrix   | Matrix ルーム ID。                                             |
| Slack    | Slack チャンネル ID。                                           |
| Telegram | グループチャット ID、またはフォーラムトピックの場合は `chatId:topic:threadId`。 |
| WhatsApp | `123@g.us` などの WhatsApp 会話 ID。                |

チャンネルが複数アカウントをサポートしている場合、アカウントレベルのチャンネル設定では、`channels.<channel>.accounts.<accountId>.mentionPatterns` に同じポリシーを設定できます。そのアカウントでは、アカウントポリシーがトップレベルのチャンネルポリシーより優先されます。

<AccordionGroup>
  <Accordion title="メンションゲートの注意事項">
    - `mentionPatterns` は、大文字と小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でないネストされた繰り返し形式は、警告付きで無視されます。
    - パターンの優先順位：`agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に有用）が `messages.groupChat.mentionPatterns` より優先されます。どちらも設定されていない場合、パターンはエージェントのアイデンティティ名／絵文字から生成されます。
    - メンションゲートは、メンション検出が可能な場合（ネイティブメンション、または `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループまたは送信者を許可リストに追加しても、メンションゲートは無効になりません。すべてのメッセージをトリガーにする場合は、そのグループの `requireMention` を `false` に設定します。
    - 自動グループチャットのプロンプトコンテキストには、解決済みのサイレント返信指示が毎ターン含まれます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させないでください。
    - 自動サイレント返信が許可されているグループでは、空のまま正常終了したモデルターンや推論のみのモデルターンを、`NO_REPLY` と同等のサイレントとして扱います。ダイレクトチャットには `NO_REPLY` のガイダンスが提供されません。また、メッセージツールのみを使用するグループ返信は、`message(action=send)` を呼び出さないことで通知を発生させません。
    - 常時稼働するアンビエントなグループ会話では、デフォルトでユーザーリクエストのセマンティクスを使用します。静かなコンテキストとして送信するには、`messages.groupChat.unmentionedInbound: "room_event"` を設定します。セットアップ例については、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。
    - ルームイベントは偽のユーザーリクエストとして保存されません。また、メッセージツールを使用しないルームイベントの非公開アシスタントテキストは、チャット履歴として再生されません。
    - Discord のデフォルトは `channels.discord.guilds."*"` にあります（ギルド／チャンネルごとに上書き可能）。
    - グループ履歴コンテキストは、すべてのチャンネルで統一的にラップされます。メンションゲート付きグループは、保留中のスキップされたメッセージを保持します。常時稼働グループでは、チャンネルが対応している場合、最近処理されたルームメッセージも保持できます。グローバルデフォルトには `messages.groupChat.historyLimit` を、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ／チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ／ルーム／チャンネル内**で利用可能なツールを制限できます。

- `tools`：グループ全体でツールを許可／拒否します（`allow`、`alsoAllow`、`deny`。拒否が優先されます）。
- `toolsBySender`：グループ内で送信者ごとに上書きします。明示的なキープレフィックスを使用してください：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。チャンネル ID には OpenClaw の正規チャンネル ID を使用します。`teams` などのエイリアスは `msteams` に正規化されます。プレフィックスのないレガシーキーも引き続き受け付けられますが、`id:` としてのみ照合され、非推奨警告がログに記録されます。

解決順序（最も具体的なものが優先）：

<Steps>
  <Step title="グループの toolsBySender">
    グループ／チャンネルの `toolsBySender` の一致。
  </Step>
  <Step title="グループの tools">
    グループ／チャンネルの `tools`。
  </Step>
  <Step title="デフォルトの toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` の一致。
  </Step>
  <Step title="デフォルトの tools">
    デフォルト（`"*"`）の `tools`。
  </Step>
</Steps>

例（Telegram）：

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

<Note>
グループ/チャネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（拒否が常に優先されます）。一部のチャネルでは、ルーム/チャネルのネスト構造が異なります（例: Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーはグループ許可リストとして機能します。デフォルトのメンション動作を設定したまま、すべてのグループを許可するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリングの承認は、グループの認可と同じではありません。DM ペアリングをサポートするチャネルでは、ペアリングストアによってロック解除されるのは DM のみです。グループコマンドには、`groupAllowFrom` などの設定許可リスト、またはそのチャネルについて文書化された設定フォールバックによる、グループ送信者の明示的な認可が引き続き必要です。
</Warning>

一般的な設定例（コピー＆ペースト）:

<Tabs>
  <Tab title="すべてのグループ返信を無効にする">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="特定のグループのみを許可する（WhatsApp）">
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
  </Tab>
  <Tab title="すべてのグループを許可するがメンションを必須にする">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="オーナーのみがトリガー可能（WhatsApp）">
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
  </Tab>
</Tabs>

## 有効化（オーナーのみ）

グループオーナーは、単独のメッセージを使用してグループごとの有効化を切り替えられます:

- `/activation mention`
- `/activation always`

`/activation` は、コアのオーナー制限付きコマンドであり、グループチャットにのみ適用されます。オーナーとは、送信者が `commands.ownerAllowFrom` と一致することを意味します。チャネルの `allowFrom` リストは、通常のチャネルおよびコマンドへのアクセスのみを制御します。保存されたモードは、それを参照するチャネル（Google Chat、QQBot、Telegram、WhatsApp）で、そのグループの `requireMention` を上書きします。また、グループのシステムプロンプトの導入部には、すべての場所で有効なモードが反映されます。

## コンテキストフィールド

グループの受信ペイロードでは、次の値が設定されます:

- `ChatType=group`
- `GroupSubject`（判明している場合）
- `GroupMembers`（判明している場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram のフォーラムトピックには、`MessageThreadId` と `IsForum` も含まれます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターン（および `/activation` の変更後）にグループの導入部が含まれます。この導入部は、人間らしく応答し、空行を最小限に抑えて通常のチャットの間隔に従い、リテラルの `\n` シーケンスを入力しないようモデルに促します。宣言されたテーブルモードがネイティブまたは未加工のテーブルを保持しないチャネルでは、Markdown テーブルの使用も控えるよう促します。チャネル由来のグループ名と参加者ラベルは、インラインのシステム命令ではなく、フェンスで囲まれた信頼できないメタデータとしてレンダリングされます。

## iMessage 固有の事項

- ルーティングまたは許可リストへの登録には、`chat_id:<id>` を推奨します。
- チャットの一覧表示: `imsg chats --limit 20`。
- グループへの返信は、常に同じ `chat_id` に返されます。

## WhatsApp のシステムプロンプト

グループおよびダイレクトプロンプトの解決、ワイルドカードの動作、アカウント上書きのセマンティクスを含む、正規の WhatsApp システムプロンプトのルールについては、[WhatsApp](/ja-JP/channels/whatsapp#system-prompts) を参照してください。

## WhatsApp 固有の事項

WhatsApp 固有の動作（履歴の注入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。

## 関連項目

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
