---
read_when:
    - Feishu/Lark ボットに接続する場合
    - Feishu チャンネルを設定しています
summary: Feishu ボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-07-16T11:21:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw は公式 `@openclaw/feishu` Plugin を通じて Feishu/Lark（オールインワンのコラボレーションプラットフォーム）に接続します。ボットへの DM、グループチャット、ストリーミングカードによる返信、Feishu のドキュメント／Wiki／ドライブ／Bitable ツールに対応しています。

**ステータス:** ボットへの DM とグループチャットは本番環境で使用できます。デフォルトのイベント転送方式は WebSocket です（公開 URL は不要）。Webhook モードもオプションで利用できます。

## クイックスタート

<Note>
OpenClaw 2026.5.29 以降が必要です。`openclaw --version` を実行して確認してください。`openclaw update` でアップグレードできます。
</Note>

<Steps>
  <Step title="チャンネル設定ウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  `@openclaw/feishu` Plugin がない場合はインストールされ、その後、設定手順が案内されます。

- **手動設定**: Feishu Open Platform（`https://open.feishu.cn`）または Lark Developer（`https://open.larksuite.com`）から App ID と App Secret を貼り付けます。
- **QR 設定**: Feishu アプリで QR コードをスキャンし、ボットを自動的に作成します。このフローでは、DM が自分のアカウントに限定されます（自分の `open_id` を指定した `dmPolicy: "allowlist"`）。

ウィザードでは、API ドメイン（Feishu または Lark）とグループポリシーも確認されます。中国国内版の Feishu モバイルアプリが QR コードに反応しない場合は、設定を再実行して手動設定を選択してください。
</Step>

  <Step title="設定が完了したら、変更を適用するために Gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## アクセス制御

### ダイレクトメッセージ

ボットに DM を送信できるユーザーを制御するには、`channels.feishu.dmPolicy`（デフォルト: `pairing`）を設定します。

| 値         | 動作                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | 不明なユーザーにはペアリングコードが送信されます。CLI で承認します                                                         |
| `"allowlist"` | `allowFrom` に記載されたユーザーのみチャットできます                                                                     |
| `"open"`      | 公開 DM。設定検証では、`allowFrom` に `"*"` が含まれている必要があります。ワイルドカード以外のエントリを指定すると、アクセスは引き続きその範囲に制限されます |

**ペアリング要求を承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー**（`channels.feishu.groupPolicy`、デフォルト: `allowlist`）:

| 値         | 動作                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します                                                            |
| `"allowlist"` | `groupAllowFrom` に含まれるグループ、または `groups.<chat_id>` で明示的に設定されたグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします。明示的な `groups.<chat_id>` エントリでもこの設定は上書きされません         |

**メンション要件**（`channels.feishu.requireMention`）:

- デフォルトでは @メンションが必要です。ただし、有効なグループポリシーが `"open"` の場合は例外で、デフォルトが `false` になります。これにより、メンションを含められないメッセージ（画像など）もエージェントに届きます。
- 上書きするには `true` または `false` を明示的に設定します。グループごとの上書きは `channels.feishu.groups.<chat_id>.requireMention` で指定します。
- ブロードキャスト専用の `@all` と `@_all` は、ボットへのメンションとして扱われません。`@all` とボットの両方を直接メンションしたメッセージは、引き続きボットへのメンションとして扱われます。

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

### 特定のグループのみ許可する

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

`allowlist` モードでは、明示的な `groups.<chat_id>` エントリを追加してグループを許可することもできます。明示的なエントリで `groupPolicy: "disabled"` を上書きすることはできません。`groups.*` のワイルドカードデフォルトでは、一致するグループを設定できますが、それだけでグループが許可されるわけではありません。

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

## グループ／ユーザー ID を取得する

### グループ ID（`chat_id`、形式: `oc_xxx`）

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。設定ページにグループ ID（`chat_id`）が表示されます。

![グループ ID を取得する](/images/feishu-get-group-id.png)

### ユーザー ID（`open_id`、形式: `ou_xxx`）

Gateway を起動してボットに DM を送信し、ログを確認します。

```bash
openclaw logs --follow
```

ログ出力内の `open_id` を探します。保留中のペアリング要求を確認することもできます。

```bash
openclaw pairing list feishu
```

## よく使うコマンド

| コマンド   | 説明                 |
| --------- | --------------------------- |
| `/status` | ボットのステータスを表示します             |
| `/reset`  | 現在のセッションをリセットします   |
| `/model`  | AI モデルを表示または切り替えます |

<Note>
Feishu/Lark はネイティブのスラッシュコマンドメニューに対応していないため、これらはプレーンテキストメッセージとして送信してください。
</Note>

## トラブルシューティング

### グループチャットでボットが応答しない

1. ボットがグループに追加されていることを確認します
2. ボットを @メンションしていることを確認します（デフォルトでは必須です）
3. `groupPolicy` が `"disabled"` ではないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットが Feishu Open Platform / Lark Developer で公開および承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection**（WebSocket）が選択されていることを確認します
4. 必要なすべての権限スコープが付与されていることを確認します
5. Gateway が実行中であることを確認します: `openclaw gateway status`
6. ログを確認します: `openclaw logs --follow`

### Feishu モバイルアプリが QR 設定に反応しない

1. 設定を再実行します: `openclaw channels login --channel feishu`
2. 手動設定を選択します
3. Feishu Open Platform で自社開発アプリを作成し、その App ID と App Secret をコピーします
4. その認証情報を設定ウィザードに貼り付けます

### App Secret が漏洩した

1. Feishu Open Platform / Lark Developer で App Secret をリセットします
2. 設定内の値を更新します
3. Gateway を再起動します: `openclaw gateway restart`

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

送信 API で `accountId` が指定されていない場合に使用するアカウントは、`defaultAccount` で制御します。アカウントエントリは最上位の設定を継承します。最上位のほとんどのキーは、アカウントごとに上書きできます。
`accounts.<id>.tts` は `messages.tts` と同じ形式を使用し、グローバル TTS 設定にディープマージされます。そのため、複数ボットの Feishu 設定では、共有プロバイダーの認証情報をグローバルに保持しながら、音声、モデル、ペルソナ、自動モードのみをアカウントごとに上書きできます。

### メッセージ制限

- `textChunkLimit` - 送信テキストのチャンクサイズ（デフォルト: `4000` 文字）
- `streaming.chunkMode` - `"length"`（デフォルト）は上限で分割し、`"newline"` は改行位置を優先します
- `mediaMaxMb` - メディアのアップロード／ダウンロード上限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark は、インタラクティブカード（Card Kit ストリーミング API）によるストリーミング返信に対応しています。有効にすると、ボットはテキストの生成中にカードをリアルタイムで更新します。

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // ストリーミングカード出力（デフォルト: "partial"）
        block: { enabled: true }, // 完了ブロックのストリーミングを有効化
      },
    },
  },
}
```

完全な返信を 1 件のメッセージで送信するには、`streaming.mode: "off"` を設定します。`renderMode: "raw"`（カードではなくプレーンテキスト）でもストリーミングカードが無効になります。`streaming.block.enabled` はデフォルトで無効です。最終返信の前に完了済みのアシスタントブロックを送信したい場合にのみ有効にしてください。従来のブール値 `streaming` とフラットな `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` キーは、`openclaw doctor --fix` によってこのネスト形式へ移行されます。

### クォータの最適化

次の 2 つのオプションフラグを使用すると、Feishu/Lark API の呼び出し回数を削減できます。

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

`channels.feishu.groupSessionScope`（最上位、アカウントごと、またはグループごと）は、グループメッセージをエージェントセッションにマッピングする方法を制御します。

| 値                  | セッション                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"`（デフォルト）    | グループチャットごとに 1 セッション                                       |
| `"group_sender"`       | （グループ + 送信者）ごとに 1 セッション                                 |
| `"group_topic"`        | トピックスレッドごとに 1 セッション。グループセッションにフォールバックします    |
| `"group_topic_sender"` | （トピック + 送信者）ごとに 1 セッション。（グループ + 送信者）にフォールバックします |

トピックスコープでは、Feishu/Lark のネイティブトピックグループは、イベント `thread_id`（`omt_*`）を正規のトピックセッションキーとして使用します。ネイティブトピックの開始イベントに `thread_id` がない場合、OpenClaw はターンをルーティングする前に Feishu からその値を取得して補完します。OpenClaw がスレッドに変換する通常のグループ返信では、引き続き返信元のルートメッセージ ID（`om_*`）が使用されるため、最初のターンと後続のターンは同じセッションに保持されます。

ボットの返信をインライン返信ではなく Feishu のトピックスレッドの作成または継続として処理するには、`replyInThread: "enabled"`（最上位またはグループごと）を設定します。`topicSessionMode` は `groupSessionScope` の非推奨の前身です。`groupSessionScope` を使用してください。

### Feishu ワークスペースツール

この Plugin には、Feishu のドキュメント、チャット、ナレッジベース、クラウドストレージ、権限、Bitable 用のエージェントツールと、対応する Skills（`feishu-doc`、`feishu-drive`、`feishu-perm`、`feishu-wiki`）が含まれています。ツールファミリーは `channels.feishu.tools` によって制限されます。

| キー             | ツール                                         | デフォルト             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` ドキュメント操作              | `true`              |
| `tools.chat`    | `feishu_chat` チャット情報とメンバーのクエリ      | `true`              |
| `tools.wiki`    | `feishu_wiki` ナレッジベース（`doc` が必要） | `true`              |
| `tools.drive`   | `feishu_drive` クラウドストレージ                  | `true`              |
| `tools.perm`    | `feishu_perm` 権限管理           | `false`（機密） |
| `tools.scopes`  | `feishu_app_scopes` アプリスコープ診断     | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base 操作    | `true`              |

`tools.base` は `tools.bitable` のエイリアスです。両方が設定されている場合は、明示的な `bitable` の値が優先されます。アカウントごとのゲートは `accounts.<id>.tools` の下にあります。

アプリに完全な `drive:drive` スコープがすでにない場合、ルート
ディレクトリ外で `feishu_drive info` を直接検索するには、`drive:drive.metadata:readonly` を付与します。どちらのスコープもない場合、`info` により
`drive:drive:readonly` を介した従来のルートディレクトリ検索を引き続き利用できます。

### ACP セッション

Feishu/Lark は、DM およびグループスレッドメッセージで ACP をサポートします。Feishu/Lark の ACP はテキストコマンド方式です。ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

#### 永続的な ACP バインディング

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

#### チャットから ACP を生成

Feishu/Lark の DM またはスレッドで次を実行します。

```text
/acp spawn codex --thread here
```

`--thread here` は、DM および Feishu/Lark のスレッドメッセージで機能します。バインドされた会話内の後続メッセージは、その ACP セッションに直接ルーティングされます。

### マルチエージェントルーティング

Feishu/Lark の DM またはグループを別々のエージェントにルーティングするには、`bindings` を使用します。

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

ルーティングフィールド：

- `match.channel`：`"feishu"`
- `match.peer.kind`：`"direct"`（DM）または `"group"`（グループチャット）
- `match.peer.id`：ユーザー Open ID（`ou_xxx`）またはグループ ID（`oc_xxx`）

検索のヒントについては、[グループ／ユーザー ID の取得](#get-groupuser-ids)を参照してください。

## ユーザーごとのエージェント分離（動的エージェント作成）

各 DM ユーザーに対して**分離されたエージェントインスタンス**を自動的に作成するには、`dynamicAgentCreation` を有効にします。各ユーザーには、次の専用環境が割り当てられます。

- 独立したワークスペースディレクトリ
- 個別の `USER.md` / `SOUL.md` / `MEMORY.md`
- 非公開の会話履歴
- 分離された Skills と状態

これは、各ユーザーに専用の非公開 AI アシスタント体験を提供する必要がある公開ボットに不可欠です。

<Note>
動的バインディングには正規化された Feishu `accountId` が含まれるため、デフォルトアカウントと名前付きアカウントのどちらでも、各送信者が正しい動的エージェントにルーティングされます。

以前のリリースで名前付きアカウントがスコープなしの動的エージェントを作成した場合、その従来のエージェントも引き続き `maxAgents` にカウントされます。削除する前にデフォルトアカウントで使用されていないことを確認するか、`maxAgents` を一時的に増やしてください。OpenClaw は、曖昧な従来の状態をどのアカウントが所有しているかを安全に推測できません。
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
    // 重要：各ユーザーの DM をそのユーザーの「メインセッション」にする
    // USER.md / SOUL.md / MEMORY.md を自動的に読み込む
    // より強固な分離には、代わりに "per-channel-peer" を使用する
    dmScope: "main",
  },
}
```

### 仕組み

新しいユーザーが初めて DM を送信すると、次の処理が行われます。

1. チャネルが一意の `agentId` を生成します。デフォルトアカウントの場合は `feishu-{user_open_id}`、名前付きアカウントの場合は長さが制限されたアカウント接頭辞付きの ID ダイジェストです
2. `workspaceTemplate` パスに新しいワークスペースを作成します
3. エージェントを登録し、このユーザー用のバインディングを作成します
4. ワークスペースヘルパーが初回アクセス時にブートストラップファイル（`AGENTS.md`、`SOUL.md`、`USER.md` など）を確実に用意します
5. このユーザーからの今後すべてのメッセージを専用エージェントにルーティングします

### 設定オプション

| 設定                                                  | 説明                                | デフォルト                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効にする   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントのワークスペース用パステンプレート | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数 | 無制限                            |

テンプレート変数：

- `{agentId}` - 生成されたエージェント ID（例：`feishu-ou_xxxxxx` または `feishu-support-<identity_digest>`）
- `{userId}` - 送信者の Feishu open_id（例：`ou_xxxxxx`）

### セッションスコープ

`session.dmScope` は、ダイレクトメッセージをエージェントセッションにマッピングする方法を制御します。これはすべてのチャネルに影響する**グローバル設定**です。

| 値                        | 動作                                                            | 最適な用途                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | 各ユーザーの DM をそのエージェントのメインセッションにマッピングする                   | `USER.md` / `SOUL.md` を自動読み込みしたい単一ユーザー向けボット |
| `"per-peer"`                 | 各ピアに個別のセッションを割り当てる（チャネルに関係なく）           | 送信者 ID のみをキーとする分離                            |
| `"per-channel-peer"`         | （チャネル + ユーザー）の組み合わせごとに個別のセッションを割り当てる           | より強固な分離が必要な公開マルチユーザーボット                  |
| `"per-account-channel-peer"` | （アカウント + チャネル + ユーザー）の組み合わせごとに個別のセッションを割り当てる | アカウントレベルのセッション分離が必要なマルチアカウントボット         |

**トレードオフ**：`"main"` を使用すると、ブートストラップファイル（`USER.md`、`SOUL.md`、`MEMORY.md`）が自動的に読み込まれますが、すべてのチャネルの全 DM で同じセッションキーパターンが共有されます。ブートストラップの自動読み込みよりも分離が重要な公開マルチユーザーボットでは、`"per-channel-peer"` を検討し、ブートストラップファイルを手動で管理してください。

<Note>
名前付き Feishu アカウントで同じ送信者のセッションを分ける必要がある場合は、`"per-account-channel-peer"` を使用してください。動的バインディングではアカウントスコープが維持されます。
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
    // 分離の要件に基づいて dmScope を選択する：
    // ブートストラップの自動読み込みには "main"、より強固な分離には "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // 空 - 動的エージェントが自動的にバインドされる
}
```

### 検証

動的作成が機能していることを確認するには、Gateway のログを確認します。

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

- **ワークスペースの分離**：各ユーザーには専用のワークスペースディレクトリとエージェントインスタンスが割り当てられます。通常のメッセージングフローでは、ユーザーが互いの会話履歴やファイルを見ることはできません。
- **セキュリティ境界**：これはメッセージングコンテキストの分離メカニズムであり、敵対的な共同テナントに対するセキュリティ境界ではありません。エージェントプロセスとホスト環境は共有されます。
- **設定への書き込みを有効なままにする必要があります**：動的エージェント作成ではエージェントとバインディングを設定に書き込みます。`channels.feishu.configWrites` が `false` の場合、この処理はスキップされます（デフォルト：有効）。
- **`bindings` は空にする必要があります**：動的エージェントは独自のバインディングを自動登録します
- **アップグレードパス**：既存の手動バインディングは、動的エージェントと併用して引き続き機能します
- **`session.dmScope` はグローバルです**：これは Feishu だけでなく、すべてのチャネルに影響します

## 設定リファレンス

完全な設定：[Gateway の設定](/ja-JP/gateway/configuration)

| 設定                                                  | 説明                                                                          | デフォルト                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | チャンネルを有効化または無効化                                                           | `true`                               |
| `channels.feishu.domain`                                 | API ドメイン（`feishu`、`lark`、または `https://` ベース URL）                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | イベント転送方式（`websocket` または `webhook`）                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | アウトバウンドルーティングのデフォルトアカウント                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook モードでは必須                                                            | -                                    |
| `channels.feishu.encryptKey`                             | Webhook モードでは必須                                                            | -                                    |
| `channels.feishu.webhookPath`                            | Webhook のルートパス                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook のバインドホスト                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook のバインドポート                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | アプリ ID                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | アプリシークレット                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | アカウントごとのドメイン上書き                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | アカウントごとの TTS 上書き                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM ポリシー（`pairing`、`allowlist`、`open`）                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM 許可リスト（open_id リスト）                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | グループポリシー（`open`、`allowlist`、`disabled`）                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | グループ許可リスト                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | すべてのグループに適用される送信者許可リスト                                               | -                                    |
| `channels.feishu.requireMention`                         | グループ内で @メンションを必須にする                                                           | `true`（ポリシーが `open` の場合は `false`）  |
| `channels.feishu.groups.<chat_id>.requireMention`        | グループごとの @メンション設定の上書き。明示的な ID は、許可リストモードでそのグループを許可する役割も持つ     | 継承                            |
| `channels.feishu.groups.<chat_id>.enabled`               | 特定のグループを有効化または無効化                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | グループごとの送信者許可リスト（`groupSenderAllowFrom` を上書き）                        | -                                    |
| `channels.feishu.groupSessionScope`                      | グループセッションのマッピング（`group`、`group_sender`、`group_topic`、`group_topic_sender`） | `group`                              |
| `channels.feishu.replyInThread`                          | ボットの返信でトピックスレッドを作成または継続する（`disabled`、`enabled`）                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | 受信リアクションイベント（`off`、`own`、`all`）                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効化                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントのワークスペース用パステンプレート                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数                                           | 無制限                            |
| `channels.feishu.textChunkLimit`                         | メッセージのチャンクサイズ                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | チャンク分割（`length` または `newline`）                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | メディアサイズの上限                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | 返信のレンダリング（`auto`、`raw`、`card`）                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | ストリーミングカード出力（`partial` または `off`）                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | 完了済みブロック単位の返信ストリーミング                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | 入力中リアクションを送信                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 送信者の表示名を解決                                                         | `true`                               |
| `channels.feishu.configWrites`                           | チャンネルから開始される設定書き込みを許可（動的エージェントに必要）                     | `true`                               |
| `channels.feishu.tools.doc`                              | ドキュメントツールを有効化                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | チャット情報ツールを有効化                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | ナレッジベースツールを有効化（`doc` が必要）                                         | `true`                               |
| `channels.feishu.tools.drive`                            | クラウドストレージツールを有効化                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | 権限管理ツールを有効化                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | アプリスコープ診断ツールを有効化                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base ツールを有効化                                                            | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` のエイリアス。両方が設定されている場合は、明示的な `bitable` が優先される     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | アカウントごとの Bitable/Base ツールゲート                                                   | 継承                            |
| `channels.feishu.accounts.<id>.tools.base`               | アカウントごとの `tools.bitable` のエイリアス                                                | 継承                            |

## 対応メッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（投稿）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画／メディア
- ✅ ステッカー

受信した Feishu/Lark の音声メッセージは、生の `file_key` JSON ではなく、
メディアプレースホルダーとして正規化されます。`tools.media.audio` が設定されている場合、
OpenClaw は音声メモのリソースをダウンロードし、エージェントターンの前に共通の音声文字起こしを
実行するため、エージェントは発話の文字起こしを受け取ります。Feishu が音声ペイロードに
文字起こしテキストを直接含めている場合、そのテキストが追加の ASR 呼び出しなしで使用されます。
音声文字起こしプロバイダーがない場合でも、エージェントは生の Feishu リソースペイロードではなく、
`<media:audio>` プレースホルダーと保存済みの添付ファイルを受け取ります。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画／メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（投稿形式の書式設定。Feishu/Lark の完全なオーサリング機能には対応していません）

ネイティブの Feishu/Lark 音声バブルは、Feishu の `audio` メッセージタイプを使用し、
Ogg/Opus のアップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` および
`.ogg` メディアは、ネイティブ音声として直接送信されます。MP3/WAV/M4A などの
音声と見なされる形式は、返信で音声配信が要求された場合（`audioAsVoice`／メッセージツールの
`asVoice`。TTS 音声メモの返信を含む）に限り、`ffmpeg` を使用して
48kHz Ogg/Opus にトランスコードされます。通常の MP3 添付ファイルは通常のファイルのままです。
`ffmpeg` がない場合や変換に失敗した場合、OpenClaw はファイル添付にフォールバックし、
その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージへの返信時も、メディア返信はスレッドとの関連付けを維持

トピックグループのセッションルーティングについては、
[グループセッションのスコープとトピックスレッド](#group-session-scope-and-topic-threads)を参照してください。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - 対応するすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
