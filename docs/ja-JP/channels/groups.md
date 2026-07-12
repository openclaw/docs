---
read_when:
    - グループチャットの動作またはメンション制御の変更
    - mentionPatterns の適用範囲を特定のグループ会話に限定する
sidebarTitle: Groups
summary: 各サービス（Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo）におけるグループチャットの動作
title: グループ
x-i18n:
    generated_at: "2026-07-11T22:00:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw は、Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo など、グループに対応するすべてのチャネルに同じグループルールを適用します。

エージェントが明示的に可視メッセージを送信しない限り、静かなコンテキストを提供する常時稼働ルームについては、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

## 初心者向け概要（2 分）

OpenClaw は、自分のメッセージングアカウント上で「動作」します。独立した WhatsApp ボットユーザーは存在しません。**あなた**がグループに参加していれば、OpenClaw はそのグループを認識し、そこで応答できます。

デフォルトの動作：

- グループは制限されます（`groupPolicy: "allowlist"`）。グループの送信者は許可リストに追加されるまでブロックされます。
- グループでメンションゲートを無効にしない限り、返信にはメンションが必要です。
- 最終返信テキストは自動的にルームへ投稿されます（`visibleReplies: "automatic"`）。

つまり、許可リストに登録された送信者は、OpenClaw をメンションすることで起動できます。

<Note>
**要約**

- **DM へのアクセス**は `*.allowFrom` で制御されます。
- **グループへのアクセス**は `*.groupPolicy` と許可リスト（`*.groups`、`*.groupAllowFrom`）で制御されます。
- **返信のトリガー**はメンションゲート（`requireMention`、`/activation`）で制御されます。

</Note>

簡単なフロー（グループメッセージの処理）：

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 可視返信

通常のグループ／チャネルリクエストでは、OpenClaw のデフォルトは `messages.groupChat.visibleReplies: "automatic"` です。アシスタントの最終テキストが可視返信としてルームに投稿されます。

共有ルームで、エージェントが `message(action=send)` を呼び出して発言するタイミングを判断できるようにする場合は、`messages.groupChat.visibleReplies: "message_tool"` を使用します。これは、ツールを確実に使用できるモデル（GPT-5.6 Sol など）で最適に動作します。モデルがツールを使用せず、内容のある最終テキストを返した場合、OpenClaw はそのテキストをルームへ投稿せず、非公開のまま保持します。

ツールのみの配信に確実には従わないモデルやランタイムでは、`"automatic"` を使用します。通常の最終テキストはルームへ直接投稿され、最終テキストに添付できないファイル、画像、その他の添付ファイルについては、エージェントが引き続き `message(action=send)` を呼び出せます。

有効なツールポリシーでメッセージツールを使用できない場合、OpenClaw は応答を黙って抑制するのではなく、自動可視返信へフォールバックします。`openclaw doctor` はこの不一致について警告します。

ダイレクトチャットやその他の送信元イベントでは、`messages.visibleReplies: "message_tool"` によって、同じツールのみの動作がグローバルに適用されます。グループ／チャネルルームには、より具体的なオーバーライドである `messages.groupChat.visibleReplies` が引き続き適用されます。内部 WebChat のダイレクトターンでは、Pi と Codex が同じ可視返信契約を受け取れるよう、デフォルトで最終返信が自動配信されます。

ツールのみモードは、潜伏モードの大半のターンでモデルに `NO_REPLY` と回答させていた従来のパターンを置き換えます。ツールのみモードでは、プロンプトに `NO_REPLY` 契約は定義されません。可視出力を何も行わないとは、単にメッセージツールを呼び出さないことを意味します。

Plugin が所有する会話バインディングは例外です。Plugin がスレッドをバインドし、受信ターンを引き受けた後は、Plugin が返す返信が可視のバインディング応答になります。`message(action=send)` は必要ありません。その返信は Plugin ランタイムの出力であり、非公開のモデル最終テキストではありません。

ダイレクトなグループリクエストでは、入力中インジケーターが引き続き送信されます。有効化されたアンビエント常時稼働ルームイベントは、エージェントがメッセージツールを呼び出さない限り、厳格かつ静かな状態を維持します。

セッションでは、デフォルトで詳細なツール／進捗概要が抑制されます。デバッグ中に現在のセッションで表示するには `/verbose on`（または `/verbose full`）を使用し、最終返信のみの動作へ戻すには `/verbose off` を使用します。詳細表示の状態はセッション単位であり、ダイレクトチャット、グループ、チャネル、フォーラムトピックで同じように機能します。

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

デフォルトは `unmentionedInbound: "user_request"` です。メンションされたメッセージ、コマンド、中止リクエスト、DM はユーザーリクエストのままです。

グループ／チャネルリクエストの可視出力にメッセージツールの使用を必須とするには、次のように設定します。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

すべての送信元チャットで必須とするには、次のように設定します。

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

ファイルの保存後、Gateway は再起動なしで `messages` の設定変更を反映します。設定の再読み込みが無効な場合（`gateway.reload.mode: "off"`）のみ再起動してください。

コマンドターンは `visibleReplies: "message_tool"` を迂回し、常に可視状態で返信します。ネイティブスラッシュコマンド（Discord、Telegram、およびネイティブコマンドに対応するその他のインターフェース）と、認可されたテキスト形式の `/...` コマンドは、どちらも送信元チャットへ応答を投稿します。グループ内の認可されていないテキスト形式の `/...` ターンは、メッセージツールのみのままです。通常のチャットターンは、設定されたデフォルトに従います。

## コンテキストの可視性と許可リスト

グループの安全性には、2 つの異なる制御が関係します。

- **トリガーの認可**：エージェントを起動できるユーザー（`groupPolicy`、`groups`、`groupAllowFrom`、チャネル固有の許可リスト）。
- **コンテキストの可視性**：モデルへ注入される補足コンテキスト（返信／引用テキスト、スレッド履歴、転送メタデータ）。

デフォルトでは、OpenClaw は受信したコンテキストをそのまま保持します。許可リストが決定するのは、アクションを起動できるユーザーであり、モデルが参照できる引用や履歴の断片ではありません。補足コンテキストもフィルタリングするには、`contextVisibility` を設定します。

| モード              | 動作                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| `"all"`（デフォルト） | 補足コンテキストを受信したまま保持します。                                           |
| `"allowlist"`       | 許可リストに登録された送信者の履歴／スレッド／引用／転送コンテキストのみ注入します。 |
| `"allowlist_quote"` | `allowlist` に加え、任意の送信者から明示的に引用または返信されたメッセージを保持します。 |

チャネル単位（`channels.<channel>.contextVisibility`）、アカウント単位（`channels.<channel>.accounts.<accountId>.contextVisibility`）、またはグローバル（`channels.defaults.contextVisibility`）で設定します。補足コンテキストを取得するチャネル（Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp）は、受信コンテキストの構築時にこのポリシーを適用します。不明なポリシーの組み合わせは安全側に閉じ、コンテキストを省略します。

![グループメッセージのフロー](/images/groups-flow.svg)

目的別の設定：

| 目的                                             | 設定内容                                                   |
| ------------------------------------------------ | ---------------------------------------------------------- |
| すべてのグループを許可し、@メンション時のみ返信する | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする                 | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ許可する                       | `groups: { "<group-id>": { ... } }`（`"*"` キーなし）      |
| グループ内で自分だけが起動できるようにする       | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 複数チャネルで信頼済み送信者のセットを再利用する | `groupAllowFrom: ["accessGroup:operators"]`                |

再利用可能な送信者許可リストについては、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

## セッションキー

- グループセッションは `agent:<agentId>:<channel>:group:<id>` セッションキーを使用します（ルーム／チャネルは `agent:<agentId>:<channel>:channel:<id>` を使用します）。
- Telegram のフォーラムトピックではグループ ID に `:topic:<threadId>` が追加されるため、各トピックが独自のセッションを持ちます。
- ダイレクトチャットはメインセッションを使用します（`session.dmScope` が設定されている場合は送信者ごとのセッション）。
- Heartbeat は設定された Heartbeat セッション（デフォルトではエージェントのメインセッション）で実行されます。グループセッションは独自の Heartbeat を実行しません。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## パターン：個人用 DM + 公開グループ（単一エージェント）

はい。「個人用」トラフィックが **DM** で、「公開」トラフィックが**グループ**であれば、適切に機能します。

理由：単一エージェントモードでは、DM は通常**メイン**セッションキー（`agent:main:main`）に入りますが、グループは常に**非メイン**セッションキー（`agent:main:<channel>:group:<id>`）を使用します。`mode: "non-main"` でサンドボックス化を有効にすると、それらのグループセッションは設定されたサンドボックスバックエンドで実行され、メインの DM セッションはホスト上に残ります。バックエンドを選択しなかった場合、デフォルトは Docker です。

これにより、1 つのエージェントの「頭脳」（共有ワークスペース + メモリ）を維持しながら、2 つの実行形態を使用できます。

- **DM**：すべてのツール（ホスト）
- **グループ**：サンドボックス + 制限されたツール

<Note>
完全に分離されたワークスペース／ペルソナが必要な場合（「個人用」と「公開」を絶対に混在させてはならない場合）は、2 つ目のエージェントとバインディングを使用してください。[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照してください。
</Note>

<Tabs>
  <Tab title="DM はホスト上、グループはサンドボックス内">
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
  </Tab>
  <Tab title="グループには許可リスト内のフォルダーのみ表示">
    「ホストへのアクセスなし」ではなく「グループはフォルダー X のみ参照可能」にする場合は、`workspaceAccess: "none"` を維持し、許可リストに登録したパスのみをサンドボックスへマウントします。

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

- UI ラベルでは、使用可能な場合は `displayName` を使用し、`<channel>:<token>` の形式にします。
- `#room` はルーム／チャネル用に予約されています。グループチャットは `g-<slug>` を使用します（小文字、スペースは `-` に変換、`#@+._-` は維持）。非常に長い不透明な ID は、完全なルート ID を UI に露出させる代わりに、安定したトークンへ短縮されます。

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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
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

| ポリシー      | 動作                                                               |
| ------------- | ------------------------------------------------------------------ |
| `"open"`      | グループは許可リストを迂回しますが、メンション制限は引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全にブロックします。                 |
| `"allowlist"` | 設定された許可リストに一致するグループまたはルームのみ許可します。 |

<AccordionGroup>
  <Accordion title="チャンネル別の注意事項">
    - `groupPolicy` はメンション制限（@メンションを必要とする設定）とは別です。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します（フォールバック: 明示的な `allowFrom`）。
    - Signal: `groupAllowFrom` は、受信した Signal グループ ID または送信者の電話番号/UUID のいずれにも一致できます。
    - DM ペアリングの承認（`*-allowFrom` ストアエントリ）は DM アクセスにのみ適用されます。グループ送信者の認可は、グループ許可リストで明示的に指定する必要があります。
    - Discord: 許可リストには `channels.discord.guilds.<id>.channels` を使用します。
    - Slack: 許可リストには `channels.slack.channels` を使用します。
    - Matrix: 許可リストには `channels.matrix.groups` を使用します。ルーム ID（`!room:server`）またはエイリアス（`#alias:server`）を使用してください。ルーム名のキーは `channels.matrix.dangerouslyAllowNameMatching: true` の場合にのみ一致し、解決できないエントリは実行時に無視されます。送信者を制限するには `channels.matrix.groupAllowFrom` を使用します。ルームごとの `users` 許可リストもサポートされています。
    - グループ DM は別に制御します（`channels.discord.dm.*`、`channels.slack.dm.*`: `groupEnabled`、`groupChannels`）。
    - Telegram: 送信者許可リストでは数値のユーザー ID のみ使用できます（`"123456789"`。`telegram:`/`tg:` プレフィックスは大文字と小文字を区別せずに削除されます）。`@username` エントリは実行時には一致せず、警告がログに記録されます。セットアップでは `@username` が ID に解決されます。負のチャット ID は送信者許可リストではなく、`channels.telegram.groups` に指定します。
    - デフォルトは `groupPolicy: "allowlist"` です。グループ許可リストが空の場合、グループメッセージはブロックされます。
    - 実行時の安全性: プロバイダーブロックが完全に存在しない場合（`channels.<provider>` が未指定）、グループポリシーは `channels.defaults.groupPolicy` を継承せず、安全側に倒して `allowlist` になります。また、Gateway はアカウントごとにこのフォールバックを一度だけログに記録します。

  </Accordion>
</AccordionGroup>

簡単な考え方（グループメッセージの評価順序）:

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="グループ許可リスト">
    グループ許可リスト（`*.groups`、`*.groupAllowFrom`、チャンネル固有の許可リスト）。
  </Step>
  <Step title="メンション制限">
    メンション制限（`requireMention`、`/activation`）。
  </Step>
</Steps>

## メンション制限（デフォルト）

グループごとに上書きされていない限り、グループメッセージにはメンションが必要です。デフォルトは各サブシステムの `*.groups."*"` に設定します。

チャンネルが返信メタデータを公開している場合、ボットメッセージへの返信は暗黙的なメンションとして扱われます。引用メタデータを公開しているチャンネルでは、ボットメッセージの引用もメンションとして扱われることがあります。現在の組み込み対象は Discord、Microsoft Teams、QQBot、Slack、Telegram、WhatsApp、Zalo personal です。

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

設定済みの `mentionPatterns` は、正規表現によるフォールバックトリガーです。プラットフォームがネイティブのボットメンションを公開しない場合や、`openclaw:` のようなプレーンテキストをメンションとして扱う場合に使用します。プラットフォームのネイティブメンションは別扱いです。Discord、Slack、Telegram、Matrix、またはその他のチャンネルでメッセージが明示的にボットをメンションしたことを確認できる場合、設定済みの正規表現パターンが拒否される場所でも、そのネイティブメンションは引き続きトリガーになります。

デフォルトでは、チャンネルがプロバイダーと会話の情報をメンション検出へ渡すすべての場所で、設定済みのメンションパターンが適用されます。広範なパターンによってすべてのグループでエージェントが起動しないようにするには、`channels.<channel>.mentionPatterns` を使用してチャンネルごとにスコープを限定します。

正規表現メンションパターンをチャンネルでデフォルト無効にし、`allowIn` で特定のルームのみ有効にする場合は、`mode: "deny"` を使用します。

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

正規表現メンションパターンを広範に適用し、`denyIn` でノイズの多いルームのみ無効にする場合は、デフォルトの `mode: "allow"` を使用します（または `mode` を省略します）。

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

ポリシーの解決:

| フィールド      | 効果                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 会話 ID が `denyIn` に含まれていない限り、正規表現メンションパターンを有効にします。これがデフォルトです。                    |
| `mode: "deny"`  | 会話 ID が `allowIn` に含まれている場合にのみ、正規表現メンションパターンを有効にします。                                     |
| `allowIn`       | deny モードで正規表現メンションパターンを有効にする会話 ID。                                                                 |
| `denyIn`        | 正規表現メンションパターンを無効にする会話 ID。同じ ID が両方に含まれる場合、`denyIn` が `allowIn` より優先されます。          |

現在サポートされているスコープ付き正規表現ポリシー:

| チャンネル | `allowIn` / `denyIn` で使用する ID                              |
| ---------- | -------------------------------------------------------------- |
| Discord    | Discord チャンネル ID。                                        |
| Matrix     | Matrix ルーム ID。                                             |
| Slack      | Slack チャンネル ID。                                          |
| Telegram   | グループチャット ID、またはフォーラムトピックの `chatId:topic:threadId`。 |
| WhatsApp   | `123@g.us` などの WhatsApp 会話 ID。                            |

チャンネルが複数のアカウントをサポートしている場合、アカウントレベルのチャンネル設定では `channels.<channel>.accounts.<accountId>.mentionPatterns` に同じポリシーを設定できます。そのアカウントでは、アカウントポリシーがチャンネルのトップレベルポリシーより優先されます。

<AccordionGroup>
  <Accordion title="メンション制限に関する注意事項">
    - `mentionPatterns` は大文字と小文字を区別しない安全な正規表現パターンです。無効なパターンや安全でない入れ子の繰り返し形式は、警告付きで無視されます。
    - パターンの優先順位: `agents.list[].groupChat.mentionPatterns`（複数のエージェントがグループを共有する場合に便利）が `messages.groupChat.mentionPatterns` より優先されます。どちらも設定されていない場合、パターンはエージェントのアイデンティティ名/絵文字から生成されます。
    - メンション制限は、メンションを検出できる場合（ネイティブメンションまたは `mentionPatterns` が設定されている場合）にのみ適用されます。
    - グループまたは送信者を許可リストに追加しても、メンション制限は無効になりません。すべてのメッセージをトリガーにする場合は、そのグループの `requireMention` を `false` に設定します。
    - 自動グループチャットのプロンプトコンテキストには、解決済みのサイレント返信指示が毎ターン一貫して含まれます。ワークスペースファイルで `NO_REPLY` の仕組みを重複させないでください。
    - 自動サイレント返信が許可されているグループでは、内容が完全に空のモデルターンや推論のみのモデルターンを、`NO_REPLY` と同等のサイレント応答として扱います。ダイレクトチャットには `NO_REPLY` のガイダンスは一切渡されません。また、メッセージツールのみを使用するグループ返信は、`message(action=send)` を呼び出さないことでサイレントになります。
    - 常時稼働する周辺的なグループ会話では、デフォルトでユーザーリクエストのセマンティクスを使用します。代わりに静かなコンテキストとして送信するには、`messages.groupChat.unmentionedInbound: "room_event"` を設定します。設定例については、[周辺的なルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。
    - ルームイベントは偽のユーザーリクエストとして保存されません。また、メッセージツールを使用しないルームイベントの非公開アシスタントテキストは、チャット履歴として再生されません。
    - Discord のデフォルトは `channels.discord.guilds."*"` に設定します（ギルド/チャンネルごとに上書き可能）。
    - グループ履歴コンテキストは、すべてのチャンネルで統一的にラップされます。メンション制限付きグループでは、保留中のスキップされたメッセージを保持します。常時稼働グループでも、チャンネルがサポートしている場合は、最近処理されたルームメッセージを保持できます。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、上書きには `channels.<channel>.historyLimit`（または `channels.<channel>.accounts.*.historyLimit`）を使用します。無効にするには `0` を設定します。

  </Accordion>
</AccordionGroup>

## グループ/チャンネルのツール制限（任意）

一部のチャンネル設定では、**特定のグループ/ルーム/チャンネル内**で使用可能なツールを制限できます。

- `tools`: グループ全体でツールを許可/拒否します（`allow`、`alsoAllow`、`deny`。拒否が優先されます）。
- `toolsBySender`: グループ内で送信者ごとに上書きします。明示的なキープレフィックスを使用してください: `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、およびワイルドカード `"*"`。チャンネル ID には正規の OpenClaw チャンネル ID を使用します。`teams` などのエイリアスは `msteams` に正規化されます。プレフィックスのない従来のキーも引き続き受け付けますが、`id:` としてのみ照合され、非推奨警告がログに記録されます。

解決順序（最も具体的なものが優先）:

<Steps>
  <Step title="グループの toolsBySender">
    グループ/チャンネルの `toolsBySender` の一致。
  </Step>
  <Step title="グループの tools">
    グループ/チャンネルの `tools`。
  </Step>
  <Step title="デフォルトの toolsBySender">
    デフォルト（`"*"`）の `toolsBySender` の一致。
  </Step>
  <Step title="デフォルトの tools">
    デフォルト（`"*"`）の `tools`。
  </Step>
</Steps>

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

<Note>
グループ/チャンネルのツール制限は、グローバル/エージェントのツールポリシーに加えて適用されます（拒否が引き続き優先されます）。一部のチャンネルでは、ルーム/チャンネルに異なる入れ子構造を使用します（例: Discord の `guilds.*.channels.*`、Slack の `channels.*`、Microsoft Teams の `teams.*.channels.*`）。
</Note>

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が設定されている場合、そのキーがグループ許可リストとして機能します。デフォルトのメンション動作を設定したまま、すべてのグループを許可するには `"*"` を使用します。

<Warning>
よくある混同: DM ペアリングの承認は、グループの認可とは異なります。DM ペアリングをサポートするチャネルでは、ペアリングストアによって利用可能になるのは DM のみです。グループコマンドには、`groupAllowFrom` などの設定許可リスト、またはそのチャネル向けに文書化された設定フォールバックによる、グループ送信者の明示的な認可が引き続き必要です。
</Warning>

一般的な目的（コピー＆ペースト）:

<Tabs>
  <Tab title="グループへのすべての返信を無効化">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="特定のグループのみを許可（WhatsApp）">
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

## アクティベーション（オーナーのみ）

グループオーナーは、単独のメッセージでグループごとのアクティベーションを切り替えられます。

- `/activation mention`
- `/activation always`

`/activation` はコアのオーナー制限付きコマンドで、グループチャットにのみ適用されます。オーナーとは、送信者がチャネルの `allowFrom` / `commands.ownerAllowFrom` と一致することを意味します（許可リストが設定されていない場合は、アカウント自身の ID がオーナーとして扱われます）。保存されたモードは、それを参照するチャネル（Google Chat、QQBot、Telegram、WhatsApp）で、そのグループの `requireMention` を上書きします。また、グループのシステムプロンプトの導入部には、すべてのチャネルで有効なモードが反映されます。

## コンテキストフィールド

グループの受信ペイロードでは、次の値が設定されます。

- `ChatType=group`
- `GroupSubject`（判明している場合）
- `GroupMembers`（判明している場合）
- `WasMentioned`（メンションゲーティングの結果）
- Telegram のフォーラムトピックには、`MessageThreadId` と `IsForum` も含まれます。

エージェントのシステムプロンプトには、新しいグループセッションの最初のターン（および `/activation` の変更後）に、グループ向けの導入文が含まれます。これはモデルに対し、人間らしく応答すること、空行を最小限にして通常のチャットの間隔に従うこと、リテラルの `\n` シーケンスを入力しないことを促します。Telegram 以外のグループでは Markdown テーブルの使用も避けるよう促します。Telegram のリッチテキストに関するガイダンスは、Telegram チャネルのプロンプトから提供されます。チャネル由来のグループ名と参加者ラベルは、インラインのシステム指示ではなく、フェンスで囲まれた信頼されていないメタデータとしてレンダリングされます。

## iMessage 固有の事項

- ルーティングまたは許可リストへの登録には、`chat_id:<id>` の使用を推奨します。
- チャット一覧の表示: `imsg chats --limit 20`。
- グループへの返信は、常に同じ `chat_id` に返送されます。

## WhatsApp のシステムプロンプト

グループおよびダイレクトプロンプトの解決、ワイルドカードの動作、アカウントによる上書きのセマンティクスを含む、WhatsApp の正規のシステムプロンプト規則については、[WhatsApp](/ja-JP/channels/whatsapp#system-prompts)を参照してください。

## WhatsApp 固有の事項

WhatsApp 固有の動作（履歴の挿入、メンション処理の詳細）については、[グループメッセージ](/ja-JP/channels/group-messages)を参照してください。

## 関連項目

- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループメッセージ](/ja-JP/channels/group-messages)
- [ペアリング](/ja-JP/channels/pairing)
