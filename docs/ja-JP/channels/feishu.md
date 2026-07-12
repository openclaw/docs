---
read_when:
    - Feishu/Lark ボットに接続する場合
    - Feishu チャンネルを設定しています
summary: Feishu Botの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-07-12T14:17:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54f4d8a73fb1e7c2af970fa7dc71f953074aa49c4bc4aed0d24671c74a84ebe9
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw は、公式の `@openclaw/feishu` Plugin を通じて Feishu/Lark（オールインワンのコラボレーションプラットフォーム）に接続します。ボットとの DM、グループチャット、ストリーミングカード返信、および Feishu のドキュメント/wiki/ドライブ/Bitable ツールに対応しています。

**ステータス:** ボットとの DM とグループチャットで本番利用可能です。デフォルトのイベント転送方式は WebSocket（公開 URL は不要）で、Webhook モードも任意で使用できます。

## クイックスタート

<Note>
OpenClaw 2026.5.29 以降が必要です。`openclaw --version` を実行して確認してください。`openclaw update` でアップグレードできます。
</Note>

<Steps>
  <Step title="チャンネル設定ウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  `@openclaw/feishu` Plugin がない場合はインストールされ、その後、設定が順に案内されます。

- **手動設定**: Feishu Open Platform（`https://open.feishu.cn`）または Lark Developer（`https://open.larksuite.com`）から App ID と App Secret を貼り付けます。
- **QR 設定**: Feishu アプリで QR コードをスキャンし、ボットを自動的に作成します。このフローでは、DM が自分のアカウントのみに制限されます（自分の `open_id` を指定した `dmPolicy: "allowlist"`）。

ウィザードでは、API ドメイン（Feishu または Lark）とグループポリシーについても確認されます。中国国内版の Feishu モバイルアプリで QR コードに反応しない場合は、設定を再実行して手動設定を選択してください。
</Step>

  <Step title="設定完了後、変更を適用するために Gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## アクセス制御

### ダイレクトメッセージ

ボットに DM を送信できるユーザーを制御するには、`channels.feishu.dmPolicy`（デフォルト: `pairing`）を設定します。

| 値            | 動作                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | 不明なユーザーにはペアリングコードが送信され、CLI で承認します                                                        |
| `"allowlist"` | `allowFrom` に登録されているユーザーのみチャットできます                                                               |
| `"open"`      | DM を一般公開します。設定の検証には、`allowFrom` に `"*"` を含める必要があります。ワイルドカード以外の項目は引き続きアクセスを制限します |

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー**（`channels.feishu.groupPolicy`、デフォルト: `allowlist`）:

| 値            | 動作                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します                                                                    |
| `"allowlist"` | `groupAllowFrom` に含まれるか、`groups.<chat_id>` で明示的に設定されたグループのみに応答します                 |
| `"disabled"`  | すべてのグループメッセージを無効にします。明示的な `groups.<chat_id>` の項目でも、この設定は上書きされません |

**メンション要件**（`channels.feishu.requireMention`）:

- デフォルトでは @メンションが必要です。ただし、有効なグループポリシーが `"open"` の場合はデフォルトが `false` になり、メンションを付けられないメッセージ（画像など）もエージェントに届きます。
- 明示的に上書きするには `true` または `false` を設定します。グループごとの上書きは `channels.feishu.groups.<chat_id>.requireMention` です。
- ブロードキャスト専用の `@all` と `@_all` は、ボットへのメンションとして扱われません。`@all` とボットの両方を直接メンションしたメッセージは、ボットへのメンションとして扱われます。

## グループ設定の例

### すべてのグループを許可し、@メンションを不要にする

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // "open" では requireMention のデフォルトは false
    },
  },
}
```

### すべてのグループを許可し、引き続き @メンションを必須にする

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 特定のグループのみを許可する

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // グループ ID の形式: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` モードでは、明示的な `groups.<chat_id>` の項目を追加することでもグループを許可できます。明示的な項目で `groupPolicy: "disabled"` を上書きすることはできません。`groups.*` のワイルドカードデフォルトは一致するグループを設定しますが、それ自体ではグループを許可しません。

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### グループ内の送信者を制限する

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // ユーザーの open_id の形式: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` は、すべてのグループに同じ送信者許可リストを設定します。グループごとの `allowFrom` が優先されます。

<a id="get-groupuser-ids"></a>

## グループ/ユーザー ID を取得する

### グループ ID（`chat_id`、形式: `oc_xxx`）

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。グループ ID（`chat_id`）は設定ページに表示されます。

![グループ ID を取得する](/images/feishu-get-group-id.png)

### ユーザー ID（`open_id`、形式: `ou_xxx`）

Gateway を起動し、ボットに DM を送信してから、ログを確認します。

```bash
openclaw logs --follow
```

ログ出力で `open_id` を探します。保留中のペアリングリクエストを確認することもできます。

```bash
openclaw pairing list feishu
```

## 一般的なコマンド

| コマンド  | 説明                         |
| --------- | ---------------------------- |
| `/status` | ボットのステータスを表示する |
| `/reset`  | 現在のセッションをリセットする |
| `/model`  | AI モデルを表示または切り替える |

<Note>
Feishu/Lark はネイティブのスラッシュコマンドメニューに対応していないため、これらをプレーンテキストメッセージとして送信してください。
</Note>

## トラブルシューティング

### ボットがグループチャットで応答しない

1. ボットがグループに追加されていることを確認する
2. ボットを @メンションしていることを確認する（デフォルトで必須）
3. `groupPolicy` が `"disabled"` ではないことを確認する
4. ログを確認する: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットが Feishu Open Platform / Lark Developer で公開および承認されていることを確認する
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認する
3. **persistent connection**（WebSocket）が選択されていることを確認する
4. 必要なすべての権限スコープが付与されていることを確認する
5. Gateway が稼働していることを確認する: `openclaw gateway status`
6. ログを確認する: `openclaw logs --follow`

### Feishu モバイルアプリで QR 設定に反応しない

1. 設定を再実行する: `openclaw channels login --channel feishu`
2. 手動設定を選択する
3. Feishu Open Platform で自社開発アプリを作成し、その App ID と App Secret をコピーする
4. それらの認証情報を設定ウィザードに貼り付ける

### App Secret が漏洩した

1. Feishu Open Platform / Lark Developer で App Secret をリセットする
2. 設定内の値を更新する
3. Gateway を再起動する: `openclaw gateway restart`

## 高度な設定

### 複数アカウント

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "プライマリボット",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "バックアップボット",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` は、送信 API で `accountId` が指定されていない場合に使用するアカウントを制御します。アカウントの項目はトップレベルの設定を継承し、ほとんどのトップレベルキーはアカウントごとに上書きできます。
`accounts.<id>.tts` は `messages.tts` と同じ構造を使用し、グローバル TTS 設定に対してディープマージされます。そのため、複数ボットを使用する Feishu の設定では、プロバイダーの共有認証情報をグローバルに保持しながら、アカウントごとに音声、モデル、ペルソナ、または自動モードだけを上書きできます。

### メッセージの制限

- `textChunkLimit` - 送信テキストのチャンクサイズ（デフォルト: `4000` 文字）
- `chunkMode` - `"length"`（デフォルト）は上限位置で分割し、`"newline"` は改行位置を優先します
- `mediaMaxMb` - メディアのアップロード/ダウンロード上限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark は、インタラクティブカード（Card Kit ストリーミング API）によるストリーミング返信に対応しています。有効にすると、ボットはテキストの生成中にカードをリアルタイムで更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // ストリーミングカード出力を有効化（デフォルト: true）
      blockStreaming: true, // 完了したブロックのストリーミングを有効化
    },
  },
}
```

返信全体を 1 つのメッセージとして送信するには、`streaming: false` を設定します。`renderMode: "raw"`（カードではなくプレーンテキスト）でもストリーミングカードは無効になります。`blockStreaming` はデフォルトでオフです。最終返信の前に、完了したアシスタントブロックを送信したい場合にのみ有効にしてください。

### クォータの最適化

次の 2 つのオプションフラグを使用して、Feishu/Lark API の呼び出し回数を減らせます。

- `typingIndicator`（デフォルト `true`）: 入力中リアクションの呼び出しを省略するには `false` を設定します
- `resolveSenderNames`（デフォルト `true`）: 送信者プロフィールの検索を省略するには `false` を設定します

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### グループセッションのスコープとトピックスレッド

`channels.feishu.groupSessionScope`（トップレベル、アカウントごと、またはグループごと）は、グループメッセージをエージェントセッションに対応付ける方法を制御します。

| 値                       | セッション                                                             |
| ------------------------ | ---------------------------------------------------------------------- |
| `"group"`（デフォルト）  | グループチャットごとに 1 つのセッション                               |
| `"group_sender"`         | （グループ + 送信者）ごとに 1 つのセッション                           |
| `"group_topic"`          | トピックスレッドごとに 1 つのセッション。グループセッションにフォールバックします |
| `"group_topic_sender"`   | （トピック + 送信者）ごとに 1 つのセッション。（グループ + 送信者）にフォールバックします |

トピックスコープでは、ネイティブの Feishu/Lark トピックグループは、イベントの `thread_id`（`omt_*`）を正規のトピックセッションキーとして使用します。ネイティブのトピック開始イベントに `thread_id` がない場合、OpenClaw はターンをルーティングする前に Feishu から取得して補完します。OpenClaw がスレッドに変換する通常のグループ返信では、引き続き返信元のルートメッセージ ID（`om_*`）を使用するため、最初のターンと後続のターンが同じセッションに維持されます。

ボットの返信をインライン返信ではなく Feishu トピックスレッドの作成または継続として扱うには、`replyInThread: "enabled"`（トップレベルまたはグループごと）を設定します。`topicSessionMode` は `groupSessionScope` の非推奨の前身です。`groupSessionScope` を使用してください。

### Feishu ワークスペースツール

この Plugin には、Feishu のドキュメント、チャット、ナレッジベース、クラウドストレージ、権限、Bitable 用のエージェントツールと、対応する Skills（`feishu-doc`、`feishu-drive`、`feishu-perm`、`feishu-wiki`）が含まれています。ツールファミリーは `channels.feishu.tools` で制御されます。

| キー            | ツール                                                   | デフォルト         |
| --------------- | -------------------------------------------------------- | ------------------ |
| `tools.doc`     | `feishu_doc` ドキュメント操作                            | `true`             |
| `tools.chat`    | `feishu_chat` チャット情報 + メンバー照会                | `true`             |
| `tools.wiki`    | `feishu_wiki` ナレッジベース（`doc` が必要）             | `true`             |
| `tools.drive`   | `feishu_drive` クラウドストレージ                        | `true`             |
| `tools.perm`    | `feishu_perm` 権限管理                                    | `false`（機密性が高い） |
| `tools.scopes`  | `feishu_app_scopes` アプリスコープ診断                   | `true`             |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base 操作                      | `true`             |

`tools.base` は `tools.bitable` のエイリアスです。両方が設定されている場合は、明示的な `bitable` の値が優先されます。アカウントごとの制御は `accounts.<id>.tools` の下に設定します。

ルートディレクトリ外で `feishu_drive info` を直接検索するには、アプリに完全な `drive:drive` スコープがすでに付与されている場合を除き、`drive:drive.metadata:readonly` を付与します。どちらのスコープもない場合、`info` では `drive:drive:readonly` を通じた従来のルートディレクトリ検索を引き続き利用できます。

### ACP セッション

Feishu/Lark は、DM とグループスレッドメッセージで ACP をサポートします。Feishu/Lark の ACP はテキストコマンドで操作します。ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

#### ACP の永続バインディング

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### チャットから ACP を起動

Feishu/Lark の DM またはスレッドで、次のように入力します。

```text
/acp spawn codex --thread here
```

`--thread here` は、DM と Feishu/Lark のスレッドメッセージで使用できます。バインドされた会話内の後続メッセージは、その ACP セッションに直接ルーティングされます。

### マルチエージェントルーティング

`bindings` を使用して、Feishu/Lark の DM またはグループを異なるエージェントにルーティングします。

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

ルーティングフィールド:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"`（DM）または `"group"`（グループチャット）
- `match.peer.id`: ユーザー Open ID（`ou_xxx`）またはグループ ID（`oc_xxx`）

検索のヒントについては、[グループ／ユーザー ID の取得](#get-groupuser-ids)を参照してください。

## ユーザーごとのエージェント分離（動的エージェント作成）

`dynamicAgentCreation` を有効にすると、DM ユーザーごとに**分離されたエージェントインスタンス**が自動的に作成されます。各ユーザーには、それぞれ次のものが割り当てられます。

- 独立したワークスペースディレクトリ
- 個別の `USER.md` / `SOUL.md` / `MEMORY.md`
- 非公開の会話履歴
- 分離された Skills と状態

これは、各ユーザーに専用の非公開 AI アシスタント体験を提供したい公開ボットに不可欠です。

<Note>
動的バインディングには正規化された Feishu の `accountId` が含まれるため、デフォルトアカウントと名前付きアカウントは、各送信者を正しい動的エージェントにルーティングします。

以前のリリースで名前付きアカウントがスコープなしの動的エージェントを作成した場合、その従来のエージェントも引き続き `maxAgents` の上限に含まれます。削除する前にデフォルトアカウントで使用されていないことを確認するか、一時的に `maxAgents` を増やしてください。OpenClaw は、所有アカウントが曖昧な従来の状態から、どのアカウントが所有者かを安全に推測できません。
</Note>

### クイックセットアップ

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 重要: 各ユーザーの DM をそのユーザーの「メインセッション」にします
    // USER.md / SOUL.md / MEMORY.md を自動的に読み込みます
    // より強力に分離するには、代わりに "per-channel-peer" を使用します
    dmScope: "main",
  },
}
```

### 仕組み

新しいユーザーが最初の DM を送信すると、次の処理が行われます。

1. チャンネルが一意の `agentId` を生成します。デフォルトアカウントでは `feishu-{user_open_id}`、名前付きアカウントでは長さが制限されたアカウント接頭辞付きの ID ダイジェストになります
2. `workspaceTemplate` のパスに新しいワークスペースを作成します
3. エージェントを登録し、このユーザー用のバインディングを作成します
4. ワークスペースヘルパーが、初回アクセス時にブートストラップファイル（`AGENTS.md`、`SOUL.md`、`USER.md` など）を確実に用意します
5. このユーザーからの以降のすべてのメッセージを専用エージェントにルーティングします

### 設定オプション

| 設定                                                     | 説明                                           | デフォルト                           |
| -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効にする | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントのワークスペース用パステンプレート | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数               | 無制限                               |

テンプレート変数:

- `{agentId}` - 生成されたエージェント ID（例: `feishu-ou_xxxxxx` または `feishu-support-<identity_digest>`）
- `{userId}` - 送信者の Feishu open_id（例: `ou_xxxxxx`）

### セッションスコープ

`session.dmScope` は、ダイレクトメッセージをエージェントセッションにマッピングする方法を制御します。これは、すべてのチャンネルに影響する**グローバル設定**です。

| 値                           | 動作                                                                    | 最適な用途                                                                |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `"main"`                     | 各ユーザーの DM を、そのユーザーのエージェントのメインセッションにマッピングします | `USER.md` / `SOUL.md` を自動読み込みしたい単一ユーザー向けボット           |
| `"per-peer"`                 | チャンネルに関係なく、ピアごとに個別のセッションを割り当てます          | 送信者 ID のみをキーとする分離                                             |
| `"per-channel-peer"`         | （チャンネル + ユーザー）の組み合わせごとに個別のセッションを割り当てます | より強力な分離が必要な公開マルチユーザーボット                             |
| `"per-account-channel-peer"` | （アカウント + チャンネル + ユーザー）の組み合わせごとに個別のセッションを割り当てます | アカウント単位のセッション分離が必要なマルチアカウントボット               |

**トレードオフ**: `"main"` を使用すると、ブートストラップファイル（`USER.md`、`SOUL.md`、`MEMORY.md`）を自動的に読み込めますが、すべてのチャンネルにわたるすべての DM で同じセッションキーパターンが共有されます。ブートストラップの自動読み込みよりも分離が重要な公開マルチユーザーボットでは、`"per-channel-peer"` を使用し、ブートストラップファイルを手動で管理することを検討してください。

<Note>
名前付き Feishu アカウントで、同じ送信者に対して個別のセッションを維持する必要がある場合は、`"per-account-channel-peer"` を使用してください。動的バインディングではアカウントスコープが維持されます。
</Note>

### 一般的なマルチユーザー構成

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 分離要件に応じて dmScope を選択します:
    // ブートストラップの自動読み込みには "main"、より強力な分離には "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // 空 - 動的エージェントが自動的にバインドされます
}
```

### 検証

Gateway のログを確認し、動的作成が機能していることを確認します。

```text
feishu: ユーザー ou_xxxxxx 用の動的エージェント "feishu-ou_xxxxxx" を作成しています
  ワークスペース: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  エージェントディレクトリ: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

作成されたすべてのワークスペースを一覧表示します。

```bash
ls -la ~/.openclaw/workspace-*
```

### 注意事項

- **ワークスペースの分離**: 各ユーザーには、専用のワークスペースディレクトリとエージェントインスタンスが割り当てられます。通常のメッセージングフロー内では、ユーザーが他のユーザーの会話履歴やファイルを参照することはできません。
- **セキュリティ境界**: これはメッセージングコンテキストの分離メカニズムであり、敵対的な共同テナントに対するセキュリティ境界ではありません。エージェントプロセスとホスト環境は共有されます。
- **設定への書き込みを有効にしておく必要があります**: 動的エージェントの作成では、エージェントとバインディングが設定に書き込まれます。`channels.feishu.configWrites` が `false` の場合はスキップされます（デフォルト: 有効）。
- **`bindings` は空にする必要があります**: 動的エージェントは独自のバインディングを自動登録します
- **アップグレードパス**: 既存の手動バインディングは、動的エージェントと併用して引き続き機能します
- **`session.dmScope` はグローバルです**: Feishu だけでなく、すべてのチャンネルに影響します

## 設定リファレンス

完全な設定: [Gateway の設定](/ja-JP/gateway/configuration)

| 設定                                                     | 説明                                                                                       | デフォルト                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | チャネルを有効化/無効化                                                                    | `true`                               |
| `channels.feishu.domain`                                 | API ドメイン（`feishu`、`lark`、または `https://` ベース URL）                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | イベント転送方式（`websocket` または `webhook`）                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 送信ルーティングのデフォルトアカウント                                                     | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook モードでは必須                                                                     | -                                    |
| `channels.feishu.encryptKey`                             | Webhook モードでは必須                                                                     | -                                    |
| `channels.feishu.webhookPath`                            | Webhook ルートパス                                                                          | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook バインドホスト                                                                      | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook バインドポート                                                                      | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | アプリ ID                                                                                  | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | アプリシークレット                                                                         | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | アカウントごとのドメイン上書き                                                             | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | アカウントごとの TTS 上書き                                                                | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM ポリシー（`pairing`、`allowlist`、`open`）                                               | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM 許可リスト（open_id のリスト）                                                           | -                                    |
| `channels.feishu.groupPolicy`                            | グループポリシー（`open`、`allowlist`、`disabled`）                                         | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | グループ許可リスト                                                                         | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | すべてのグループに適用される送信者許可リスト                                               | -                                    |
| `channels.feishu.requireMention`                         | グループ内で @メンションを必須にする                                                       | `true`（ポリシーが `open` の場合は `false`） |
| `channels.feishu.groups.<chat_id>.requireMention`        | グループごとの @メンション設定の上書き。明示的な ID は許可リストモードでもグループを許可する | 継承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 特定のグループを有効化/無効化                                                              | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | グループごとの送信者許可リスト（`groupSenderAllowFrom` を上書き）                          | -                                    |
| `channels.feishu.groupSessionScope`                      | グループセッションのマッピング（`group`、`group_sender`、`group_topic`、`group_topic_sender`） | `group`                              |
| `channels.feishu.replyInThread`                          | ボットの返信でトピックスレッドを作成/継続する（`disabled`、`enabled`）                     | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | 受信リアクションイベント（`off`、`own`、`all`）                                            | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェントの自動作成を有効化                                               | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントワークスペースのパステンプレート                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート                                                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数                                                           | 無制限                               |
| `channels.feishu.textChunkLimit`                         | メッセージのチャンクサイズ                                                                 | `4000`                               |
| `channels.feishu.chunkMode`                              | チャンク分割方式（`length` または `newline`）                                               | `length`                             |
| `channels.feishu.mediaMaxMb`                             | メディアのサイズ上限                                                                       | `30`                                 |
| `channels.feishu.renderMode`                             | 返信のレンダリング方式（`auto`、`raw`、`card`）                                             | `auto`                               |
| `channels.feishu.streaming`                              | ストリーミングカード出力                                                                   | `true`                               |
| `channels.feishu.blockStreaming`                         | 完了ブロック単位の返信ストリーミング                                                       | `false`                              |
| `channels.feishu.typingIndicator`                        | 入力中リアクションを送信                                                                   | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 送信者の表示名を解決                                                                       | `true`                               |
| `channels.feishu.configWrites`                           | チャネルからの設定書き込みを許可（動的エージェントで必要）                                 | `true`                               |
| `channels.feishu.tools.doc`                              | ドキュメントツールを有効化                                                                 | `true`                               |
| `channels.feishu.tools.chat`                             | チャット情報ツールを有効化                                                                 | `true`                               |
| `channels.feishu.tools.wiki`                             | ナレッジベースツールを有効化（`doc` が必要）                                                | `true`                               |
| `channels.feishu.tools.drive`                            | クラウドストレージツールを有効化                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | 権限管理ツールを有効化                                                                     | `false`                              |
| `channels.feishu.tools.scopes`                           | アプリスコープ診断ツールを有効化                                                           | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base ツールを有効化                                                                | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` のエイリアス。両方が設定されている場合は明示的な `bitable` が優先される | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | アカウントごとの Bitable/Base ツールゲート                                                 | 継承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | アカウントごとの `tools.bitable` のエイリアス                                               | 継承                                 |

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（投稿）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ スタンプ

受信した Feishu/Lark の音声メッセージは、生の `file_key` JSON ではなく、メディアプレースホルダーとして正規化されます。`tools.media.audio` が設定されている場合、OpenClaw はエージェントターンの前にボイスノートのリソースをダウンロードし、共有の音声文字起こしを実行するため、エージェントは発話内容の文字起こしを受け取ります。Feishu が音声ペイロードに文字起こしテキストを直接含めている場合、そのテキストが使用され、追加の ASR 呼び出しは行われません。音声文字起こしプロバイダーがない場合でも、エージェントは生の Feishu リソースペイロードではなく、`<media:audio>` プレースホルダーと保存された添付ファイルを受け取ります。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（投稿形式の書式設定。Feishu/Lark のすべてのオーサリング機能には対応していません）

Feishu/Lark ネイティブの音声バブルは Feishu の `audio` メッセージタイプを使用し、Ogg/Opus 形式のアップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` および `.ogg` メディアは、ネイティブ音声として直接送信されます。MP3/WAV/M4A およびその他の音声と考えられる形式は、返信で音声配信が要求された場合（`audioAsVoice` / メッセージツールの `asVoice`。TTS ボイスノート返信を含む）に限り、`ffmpeg` を使用して 48kHz Ogg/Opus にトランスコードされます。通常の MP3 添付ファイルは通常のファイルのままです。`ffmpeg` が見つからない場合や変換に失敗した場合、OpenClaw はファイル添付にフォールバックし、その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージへの返信時、メディア返信でもスレッド情報を維持

トピックグループのセッションルーティングについては、[グループセッションのスコープとトピックスレッド](#group-session-scope-and-topic-threads)を参照してください。

## 関連項目

- [チャネルの概要](/ja-JP/channels) - サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化策
