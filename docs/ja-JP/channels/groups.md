---
read_when:
    - グループチャットの動作またはメンションゲートの変更
    - mentionPatterns の適用範囲を特定のグループ会話に限定する
sidebarTitle: Groups
summary: 各サーフェス（Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo）におけるグループチャットの動作
title: グループ
x-i18n:
    generated_at: "2026-07-12T14:18:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo など、グループに対応するすべてのチャネルで同じグループルールを適用します。

エージェントが明示的に表示メッセージを送信しない限り、静かなコンテキストを提供する常時稼働ルームについては、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

## 初心者向け概要（2 分）

OpenClaw は、自分のメッセージングアカウント上に「常駐」します。WhatsApp 用に別のボットユーザーが存在するわけではありません。**あなた**がグループに参加していれば、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作：

- グループは制限されます（`groupPolicy: "allowlist"`）。グループの送信者は許可リストに追加されるまでブロックされます。
- グループのメンション制限を無効にしない限り、返信にはメンションが必要です。
- 最終返信テキストは自動的にルームへ投稿されます（`visibleReplies: "automatic"`）。

つまり、許可リストに登録された送信者は、OpenClaw をメンションすることで起動できます。

<Note>
**要約**

- **DM へのアクセス**は `*.allowFrom` で制御します。
- **グループへのアクセス**は `*.groupPolicy` と許可リスト（`*.groups`、`*.groupAllowFrom`）で制御します。
- **返信のトリガー**はメンション制限（`requireMention`、`/activation`）で制御します。

</Note>

簡単なフロー（グループメッセージの処理）：

```text
groupPolicy? disabled -> 破棄
groupPolicy? allowlist -> グループは許可済み？ いいえ -> 破棄
requireMention? yes -> メンションされた？ いいえ -> コンテキスト用としてのみ保存
メンション／返信／コマンド／DM -> ユーザーリクエスト
常時稼働グループの会話 -> ユーザーリクエスト、または設定されている場合はルームイベント
```

## 表示される返信

通常のグループ／チャネルリクエストでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "automatic"` です。アシスタントの最終テキストが、表示される返信としてルームに投稿されます。

共有ルームで、エージェントが `message(action=send)` を呼び出して発言するタイミングを決められるようにする場合は、`messages.groupChat.visibleReplies: "message_tool"` を使用します。これは、ツールを確実に使用できるモデル（たとえば GPT-5.6 Sol）で最も効果的です。モデルがツールを使用せず、内容のある最終テキストを返した場合、OpenClaw はそのテキストをルームへ投稿せず、非公開のまま保持します。

ツールのみの配信に確実に従わないモデルやランタイムでは、`"automatic"` を使用します。通常の最終テキストはルームへ直接投稿されますが、最終テキストに添付できないファイル、画像、その他の添付ファイルについては、エージェントが引き続き `message(action=send)` を呼び出せます。

有効なツールポリシーでメッセージツールが利用できない場合、OpenClaw は応答を暗黙に抑制せず、表示される自動返信にフォールバックします。`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットやその他のソースイベントでは、`messages.visibleReplies: "message_tool"` により、同じツールのみの動作がグローバルに適用されます。グループ／チャネルルームについては、`messages.groupChat.visibleReplies` が引き続き、より具体的なオーバーライドになります。内部 WebChat のダイレクトターンでは、Pi と Codex が同じ表示返信契約を受け取るように、デフォルトで最終返信が自動配信されます。

ツールのみモードは、潜伏モードのほとんどのターンでモデルに `NO_REPLY` と回答させる従来のパターンを置き換えます。ツールのみモードでは、プロンプトに `NO_REPLY` 契約は定義されません。表示上何もしないとは、単にメッセージツールを呼び出さないことを意味します。

Plugin が所有する会話バインディングは例外です。Plugin がスレッドをバインドして受信ターンを引き受けると、Plugin が返す返信が表示されるバインディング応答になります。`message(action=send)` は不要です。その返信は Plugin ランタイムの出力であり、非公開のモデル最終テキストではありません。

ダイレクトなグループリクエストでは、入力中インジケーターも引き続き送信されます。アンビエントな常時稼働ルームイベントは、有効な場合でも厳格かつ静かなままで、エージェントがメッセージツールを呼び出さない限り表示されません。

セッションでは、詳細なツール／進捗の要約がデフォルトで抑制されます。デバッグ中に現在のセッションで表示するには `/verbose on`（または `/verbose full`）を使用し、最終返信のみの動作に戻すには `/verbose off` を使用します。詳細表示の状態はセッション単位で、ダイレクトチャット、グループ、チャネル、フォーラムトピックで同様に機能します。

メンションされていない常時稼働グループの会話を、ユーザーリクエストではなく静かなルームコンテキストとして送信するには、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使用します。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

デフォルトは `unmentionedInbound: "user_request"` です。メンションされたメッセージ、コマンド、中止リクエスト、DM は引き続きユーザーリクエストになります。

グループ／チャネルリクエストの表示出力をメッセージツール経由に限定するには、次のように設定します。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

すべてのソースチャットで必須にするには、次のように設定します。

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ファイルの保存後、Gateway は再起動なしで `messages` の設定変更を反映します。設定の再読み込みが無効な場合（`gateway.reload.mode: "off"`）にのみ再起動してください。

コマンドターンは `visibleReplies: "message_tool"` を迂回し、常に表示される形で返信します。ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンド対応のその他のサーフェス）と、承認済みのテキスト `/...` コマンドは、どちらも応答をソースチャットへ投稿します。グループ内の未承認テキスト `/...` ターンはメッセージツールのみのままです。通常のチャットターンは設定されたデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関係します。

- **トリガーの承認**：エージェントを起動できるユーザー（`groupPolicy`、`groups`、`groupAllowFrom`、チャネル固有の許可リスト）。
- **コンテキストの可視性**：モデルに注入される補足コンテキスト（返信／引用テキスト、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は受信したコンテキストをそのまま保持します。許可リストは、誰がアクションを起動できるかを決定するものであり、モデルが参照する引用または履歴の断片を決定するものではありません。補足コンテキストもフィルタリングするには、`contextVisibility` を設定します。

| モード              | 動作                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| `"all"`（デフォルト） | 補足コンテキストを受信したまま保持します。                                             |
| `"allowlist"`       | 許可リストに登録された送信者の履歴／スレッド／引用／転送コンテキストのみを注入します。 |
| `"allowlist_quote"` | `allowlist` に加えて、任意の送信者から明示的に引用／返信されたメッセージを保持します。  |

チャネル単位（`channels.<channel>.contextVisibility`）、アカウント単位（`channels.<channel>.accounts.<accountId>.contextVisibility`）、またはグローバル（`channels.defaults.contextVisibility`）で設定します。補足コンテキストを取得するチャネル（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）は、受信コンテキストの構築時にこのポリシーを適用します。不明なポリシーの組み合わせはフェイルクローズし、コンテキストを省略します。

![グループメッセージのフロー](/images/groups-flow.svg)

目的別の設定：

| 目的                                           | 設定内容                                                   |
| ---------------------------------------------- | ---------------------------------------------------------- |
| すべてのグループを許可し、@メンション時のみ返信 | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効化                   | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                             | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）      |
| グループ内で自分だけが起動可能                 | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |
| 1 つの信頼済み送信者セットをチャネル間で再利用 | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム／チャネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram のフォーラムトピックでは、各トピックが独自のセッションを持つように、グループ ID に `:topic:<threadId>` が追加されます。
- ダイレクトチャットはメインセッションを使用します（`session.dmScope` が設定されている場合は送信者単位のセッション）。
- Heartbeat は設定された Heartbeat セッション（デフォルト：エージェントのメインセッション）で実行されます。グループセッションは独自の Heartbeat を実行しません。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン：個人用 DM + 公開グループ（単一エージェント）

はい。「個人用」トラフィックが **DM**、「公開」トラフィックが **グループ**であれば、これは適切に機能します。

理由：単一エージェントモードでは通常、DM は**メイン**セッションキー（`agent:main:main`）に入り、グループは常に**非メイン**セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、これらのグループセッションは設定されたサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しない場合、デフォルトは Docker です。

これにより、1 つのエージェントの「頭脳」（共有ワークスペース + メモリ）で、2 つの実行形態を利用できます。

- **DM**：すべてのツール（ホスト）
- **グループ**：サンドボックス + 制限されたツール

<Note>
完全に分離されたワークスペース／ペルソナが必要な場合（「個人用」と「公開用」を決して混在させてはならない場合）は、2 つ目のエージェントとバインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="DM はホスト上、グループはサンドボックス内">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // グループ／チャネルは非メイン -> サンドボックス化
            scope: "session", // 最も強力な分離（グループ／チャネルごとに 1 つのコンテナ）
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
    「ホストへのアクセス不可」ではなく、「グループはフォルダー X のみを参照可能」にする場合は、`workspaceAccess: "none"` のまま、許可リストに登録されたパスだけをサンドボックスへマウントします。

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
- ツールがブロックされる理由のデバッグ：[サンドボックス、ツールポリシー、昇格の違い](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細：[サンドボックス化](/ja-JP/gateway/sandboxing#custom-bind-mounts)

## 表示ラベル

- UI ラベルでは、利用可能な場合は `displayName` を使用し、`<channel>:<token>` の形式にします。
- `#room` はルーム／チャネル用に予約されています。グループチャットでは `g-<slug>` を使用します（小文字、空白 -> `-`、`#@+._-` は維持）。非常に長い不透明な ID は、完全なルート ID が UI に露出しないよう、安定したトークンに短縮されます。

## グループポリシー

チャネルごとにグループ／ルームメッセージの処理方法を制御します。

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // Telegram の数値ユーザー ID（セットアップ時に @username を解決）
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

| ポリシー      | 動作                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは許可リストを迂回します。メンションゲートは引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。           |
| `"allowlist"` | 設定された許可リストに一致するグループ／ルームのみ許可します。 |

<AccordionGroup>
  <Accordion title="チャンネルごとの注意事項">
    - `groupPolicy` はメンションゲート（@メンションを要求）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：`groupAllowFrom` を使用します（フォールバック：明示的な `allowFrom`）。
    - Signal：`groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号／UUID のいずれにも一致できます。
    - DM ペアリングの承認（`*-allowFrom` ストアエントリ）は DM アクセスのみに適用されます。グループ送信者の認可は、グループの許可リストで明示的に指定する必要があります。
    - Discord：許可リストには `channels.discord.guilds.<id>.channels` を使用します。
    - Slack：許可リストには `channels.slack.channels` を使用します。
    - Matrix：許可リストには `channels.matrix.groups` を使用します。ルーム ID（`!room:server`）またはエイリアス（`#alias:server`）を使用してください。ルーム名のキーが一致するのは `channels.matrix.dangerouslyAllowNameMatching: true` の場合のみで、解決できないエントリは実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は別途制御されます（`channels.discord.dm.*`、`channels.slack.dm.*`：`groupEnabled`、`groupChannels`）。
    - Telegram：送信者の許可リストには数値ユーザー ID のみ指定できます（`"123456789"`。`telegram:`／`tg:` プレフィックスは大文字と小文字を区別せずに除去されます）。`@username` エントリは実行時には一致せず、警告がログに記録されます。セットアップ時に `@username` が ID に解決されます。負のチャット ID は送信者の許可リストではなく、`channels.telegram.groups` に指定します。
    - デフォルトは `groupPolicy: "allowlist"` です。グループの許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性：プロバイダーブロックが完全に存在しない場合（`channels.<provider>` が未指定）、グループポリシーは `channels.defaults.groupPolicy` を継承せず、安全側の `allowlist` に設定され、Gateway はアカウントごとにフォールバックを一度ログに記録します。

  </Accordion>
</AccordionGroup>

簡単な概念モデル（グループメッセージの評価順序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループの許可リスト">
    グループの許可リスト（`*.groups`、`*.groupAllowFrom`、チャンネル固有の許可リスト）。
  </Step>
  <Step title="メンションゲート">
    メンションゲート（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンションゲート（デフォルト）

グループメッセージには、グループごとに上書きされていない限り、メンションが必要です。デフォルトは各サブシステムの `*.groups."*"` に設定します。

チャンネルが返信メタデータを公開している場合、ボットメッセージへの返信は暗黙的なメンションとして扱われます。引用メタデータを公開しているチャンネルでは、ボットメッセージの引用もメンションとして扱われる場合があります。現在の組み込み対象は、Discord、Microsoft Teams、QQBot、Slack、Telegram、WhatsApp、および Zalo personal です。

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

設定済みの `mentionPatterns` は、フォールバックトリガーとなる正規表現です。プラットフォームがネイティブのボットメンションを公開しない場合や、`openclaw:` のようなプレーンテキストをメンションとして扱う場合に使用します。ネイティブのプラットフォームメンションは別物です。Discord、Slack、Telegram、Matrix、またはその他のチャンネルで、メッセージが明示的にボットをメンションしたことを確認できる場合、設定済みの正規表現パターンが拒否される場所でも、そのネイティブメンションは引き続きトリガーになります。

デフォルトでは、設定済みのメンションパターンは、チャンネルがプロバイダーと会話の情報をメンション検出に渡すすべての場所に適用されます。広範なパターンによってすべてのグループでエージェントが起動しないようにするには、`channels.<channel>.mentionPatterns` を使用してチャンネルごとにスコープを設定します。

正規表現のメンションパターンをチャンネルでデフォルト無効にし、`allowIn` で特定のルームのみオプトインする場合は、`mode: "deny"` を使用します。

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

正規表現のメンションパターンを広範に適用し、`denyIn` でノイズの多いルームのみ無効にする場合は、デフォルトの `mode: "allow"` を使用（または `mode` を省略）します。

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

| フィールド      | 効果                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 会話 ID が `denyIn` に含まれていない限り、正規表現のメンションパターンが有効になります。これがデフォルトです。         |
| `mode: "deny"`  | 会話 ID が `allowIn` に含まれていない限り、正規表現のメンションパターンが無効になります。                              |
| `allowIn`       | deny モードで正規表現のメンションパターンを有効にする会話 ID。                                                        |
| `denyIn`        | 正規表現のメンションパターンを無効にする会話 ID。同じ ID が両方に含まれる場合、`denyIn` が `allowIn` より優先されます。 |

現在サポートされているスコープ付き正規表現ポリシー：

| チャンネル | `allowIn`／`denyIn` で使用する ID                             |
| ---------- | ------------------------------------------------------------ |
| Discord    | Discord チャンネル ID。                                      |
| Matrix     | Matrix ルーム ID。                                           |
| Slack      | Slack チャンネル ID。                                        |
| Telegram   | グループチャット ID、またはフォーラムトピックの `chatId:topic:threadId`。 |
| WhatsApp   | `123@g.us` などの WhatsApp 会話 ID。                         |

チャンネルが複数アカウントをサポートする場合、アカウントレベルのチャンネル設定では、`channels.<channel>.accounts.<accountId>.mentionPatterns` に同じポリシーを設定できます。そのアカウントでは、アカウントポリシーがトップレベルのチャンネルポリシーより優先されます。

<AccordionGroup>
  <Accordion title="メンションゲートの注意事項">
    - `mentionPatterns` は大文字と小文字を区別しない安全な正規表現パターンです。無効なパターンや、安全でないネストされた繰り返し形式は無視されます（警告が表示されます）。
    - パターンの優先順位：`agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に有用）は `messages.groupChat.mentionPatterns` を上書きします。どちらも設定されていない場合、パターンはエージェントのアイデンティティ名／絵文字から生成されます。
    - メンションゲートが適用されるのは、メンション検出が可能な場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）のみです。
    - グループまたは送信者を許可リストに追加しても、メンションゲートは無効になりません。すべてのメッセージをトリガーにする場合は、そのグループの `requireMention` を `false` に設定します。
    - 自動グループチャットのプロンプトコンテキストには、解決済みのサイレント返信指示が毎ターン含まれます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させないでください。
    - 自動サイレント返信が許可されているグループでは、完全に空のモデルターンまたは推論のみのモデルターンを、`NO_REPLY` と同等のサイレントとして扱います。ダイレクトチャットには `NO_REPLY` のガイダンスは一切送られず、メッセージツールのみを使用するグループ返信は `message(action=send)` を呼び出さないことでサイレントになります。
    - 常時有効な周辺グループ会話では、デフォルトでユーザーリクエストのセマンティクスを使用します。代わりに静かなコンテキストとして送信するには、`messages.groupChat.unmentionedInbound: "room_event"` を設定します。セットアップ例については、[周辺ルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。
    - ルームイベントは偽のユーザーリクエストとして保存されず、メッセージツールを使用しないルームイベントの非公開アシスタントテキストはチャット履歴として再生されません。
    - Discord のデフォルトは `channels.discord.guilds."*"` に設定します（ギルド／チャンネルごとに上書き可能）。
    - グループ履歴のコンテキストは、すべてのチャンネルで統一された形式でラップされます。メンションゲート付きグループでは保留中のスキップされたメッセージが保持されます。常時有効なグループでは、チャンネルが対応している場合、最近処理されたルームメッセージも保持されることがあります。グローバルデフォルトには `messages.groupChat.historyLimit`、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ／チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ／ルーム／チャンネル内**で使用可能なツールを制限できます。

- `tools`：グループ全体のツールを許可／拒否します（`allow`、`alsoAllow`、`deny`。拒否が優先されます）。
- `toolsBySender`：グループ内で送信者ごとに上書きします。明示的なキープレフィックス `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカードを使用します。チャンネル ID には正規化された OpenClaw チャンネル ID を使用します。`teams` などのエイリアスは `msteams` に正規化されます。プレフィックスのない従来のキーも引き続き受け付けられますが、`id:` としてのみ照合され、非推奨警告がログに記録されます。

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
グループ／チャンネルのツール制限は、グローバル／エージェントのツールポリシーに加えて適用されます（拒否は引き続き優先されます）。一部のチャンネルでは、ルーム／チャンネルに異なるネスト構造を使用します（例：Discord の `guilds.*.channels.*`、Slack の `channels.*`、Microsoft Teams の `teams.*.channels.*`）。
</Note>

## グループの許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーがグループの許可リストとして機能します。デフォルトのメンション動作を設定したまますべてのグループを許可するには、`"*"` を使用します。

<Warning>
よくある混同: DM ペアリングの承認は、グループの認可とは異なります。DM ペアリングをサポートするチャンネルでは、ペアリングストアによって利用可能になるのは DM だけです。グループコマンドには、引き続き `groupAllowFrom` などの設定許可リスト、またはそのチャンネルで文書化されている設定フォールバックによる、グループ送信者の明示的な認可が必要です。
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
  <Tab title="特定のグループのみ許可する（WhatsApp）">
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
  <Tab title="所有者のみがトリガー可能（WhatsApp）">
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

## アクティベーション（所有者のみ）

グループ所有者は、単独のメッセージでグループごとのアクティベーションを切り替えられます:

- `/activation mention`
- `/activation always`

`/activation` はコアの所有者限定コマンドで、グループチャットにのみ適用されます。所有者とは、送信者がチャンネルの `allowFrom` / `commands.ownerAllowFrom` と一致することを意味します（許可リストが設定されていない場合は、アカウント自身の ID が所有者として扱われます）。保存されたモードは、それを参照するチャンネル（Google Chat、QQBot、Telegram、WhatsApp）で、そのグループの `requireMention` を上書きします。また、グループのシステムプロンプトの導入部には、すべてのチャンネルで有効なモードが反映されます。

## コンテキストフィールド

グループの受信ペイロードには、次の値が設定されます:

- `ChatType=group`
- `GroupSubject`（判明している場合）
- `GroupMembers`（判明している場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram フォーラムトピックには、`MessageThreadId` と `IsForum` も含まれます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターン（および `/activation` の変更後）にグループ向けの導入部が含まれます。これは、人間らしく応答し、空行を最小限にして通常のチャットの間隔に従い、リテラルの `\n` シーケンスを入力しないようモデルに促します。Telegram 以外のグループでは Markdown テーブルの使用も控えるよう促します。Telegram のリッチテキストに関するガイダンスは、Telegram チャンネルのプロンプトから提供されます。チャンネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンスで囲まれた信頼できないメタデータとしてレンダリングされます。

## iMessage 固有の事項

- ルーティングまたは許可リストへの登録には、`chat_id:<id>` を優先します。
- チャットを一覧表示する: `imsg chats --limit 20`。
- グループへの返信は常に同じ `chat_id` に返されます。

## WhatsApp のシステムプロンプト

グループおよびダイレクトプロンプトの解決、ワイルドカードの動作、アカウントによる上書きのセマンティクスを含む、WhatsApp の正式なシステムプロンプトルールについては、[WhatsApp](/ja-JP/channels/whatsapp#system-prompts)を参照してください。

## WhatsApp 固有の事項

WhatsApp 固有の動作（履歴の注入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。

## 関連項目

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
