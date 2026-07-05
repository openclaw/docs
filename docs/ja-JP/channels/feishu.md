---
read_when:
    - Feishu/Lark ボットに接続したい
    - Feishu チャネルを設定しています
summary: Feishu ボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-07-05T11:02:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 677884d299ab56a16926d73a29a48e862a12e89ed04c1134c1154e98fb56342d
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw は、公式の `@openclaw/feishu` plugin を通じて Feishu/Lark（オールインワンのコラボレーションプラットフォーム）に接続します。bot DM、グループチャット、ストリーミングカード返信、Feishu の doc/wiki/drive/Bitable ツールに対応しています。

**ステータス:** bot DM + グループチャットは本番利用可能です。WebSocket がデフォルトのイベントトランスポートです（公開 URL は不要）。webhook モードは任意です。

## クイックスタート

<Note>
OpenClaw 2026.5.29 以上が必要です。確認するには `openclaw --version` を実行してください。アップグレードするには `openclaw update` を使用します。
</Note>

<Steps>
  <Step title="チャネルセットアップウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  これにより、`@openclaw/feishu` plugin がない場合はインストールされ、その後セットアップを案内します。

- **手動セットアップ**: Feishu Open Platform（`https://open.feishu.cn`）または Lark Developer（`https://open.larksuite.com`）から App ID と App Secret を貼り付けます。
- **QR セットアップ**: Feishu アプリで QR コードをスキャンして bot を自動作成します。このフローでは DM が自分のアカウントに固定されます（自分の `open_id` を使った `dmPolicy: "allowlist"`）。

ウィザードでは API ドメイン（Feishu か Lark）とグループポリシーも確認されます。中国国内版の Feishu モバイルアプリが QR コードに反応しない場合は、セットアップを再実行して手動セットアップを選択してください。
</Step>

  <Step title="セットアップ完了後、変更を適用するために gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## アクセス制御

### ダイレクトメッセージ

bot に DM できるユーザーを制御するには、`channels.feishu.dmPolicy`（デフォルト: `pairing`）を設定します。

| 値            | 動作                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | 不明なユーザーはペアリングコードを受け取ります。CLI で承認します                                                       |
| `"allowlist"` | `allowFrom` に列挙されたユーザーのみがチャットできます                                                                 |
| `"open"`      | 公開 DM。config 検証では `allowFrom` に `"*"` を含める必要があります。ワイルドカード以外のエントリはアクセスを絞ります |

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー**（`channels.feishu.groupPolicy`、デフォルト: `allowlist`）:

| 値            | 動作                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します                                                        |
| `"allowlist"` | `groupAllowFrom` 内、または `groups.<chat_id>` 配下で明示的に設定されたグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします。明示的な `groups.<chat_id>` エントリでも上書きできません |

**メンション要件**（`channels.feishu.requireMention`）:

- デフォルト: 有効なグループポリシーが `"open"` の場合を除き、@メンションが必要です。`"open"` ではデフォルトが `false` になるため、メンションを含められないメッセージ（例: 画像）も agent に届きます。
- 上書きするには `true` または `false` を明示的に設定します。グループごとの上書き: `channels.feishu.groups.<chat_id>.requireMention`。
- ブロードキャスト専用の `@all` と `@_all` は bot メンションとして扱われません。`@all` と bot の直接メンションの両方を含むメッセージは、引き続き bot メンションとしてカウントされます。

## グループ設定例

### すべてのグループを許可し、@メンションを不要にする

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` モードでは、明示的な `groups.<chat_id>` エントリを追加してグループを許可することもできます。明示的なエントリは `groupPolicy: "disabled"` を上書きしません。`groups.*` 配下のワイルドカードデフォルトは一致するグループを設定しますが、それ自体でグループを許可するわけではありません。

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
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` は、すべてのグループに同じ送信者 allowlist を設定します。グループごとの `allowFrom` が優先されます。

<a id="get-groupuser-ids"></a>

## グループ/ユーザー ID を取得する

### グループ ID（`chat_id`、形式: `oc_xxx`）

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **設定** に移動します。グループ ID（`chat_id`）は設定ページに表示されます。

![グループ ID を取得する](/images/feishu-get-group-id.png)

### ユーザー ID（`open_id`、形式: `ou_xxx`）

gateway を起動し、bot に DM を送信してからログを確認します。

```bash
openclaw logs --follow
```

ログ出力で `open_id` を探します。保留中のペアリングリクエストも確認できます。

```bash
openclaw pairing list feishu
```

## よく使うコマンド

| コマンド  | 説明                         |
| --------- | ---------------------------- |
| `/status` | bot のステータスを表示します |
| `/reset`  | 現在のセッションをリセットします |
| `/model`  | AI モデルを表示または切り替えます |

<Note>
Feishu/Lark はネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。
</Note>

## トラブルシューティング

### bot がグループチャットで応答しない

1. bot がグループに追加されていることを確認します
2. bot を @メンションしていることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` ではないことを確認します
4. ログを確認します: `openclaw logs --follow`

### bot がメッセージを受信しない

1. bot が Feishu Open Platform / Lark Developer で公開および承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection**（WebSocket）が選択されていることを確認します
4. 必要なすべての権限スコープが付与されていることを確認します
5. gateway が実行中であることを確認します: `openclaw gateway status`
6. ログを確認します: `openclaw logs --follow`

### QR セットアップが Feishu モバイルアプリで反応しない

1. セットアップを再実行します: `openclaw channels login --channel feishu`
2. 手動セットアップを選択します
3. Feishu Open Platform で自社開発アプリを作成し、その App ID と App Secret をコピーします
4. その認証情報をセットアップウィザードに貼り付けます

### App Secret が漏えいした

1. Feishu Open Platform / Lark Developer で App Secret をリセットします
2. config 内の値を更新します
3. gateway を再起動します: `openclaw gateway restart`

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

`defaultAccount` は、送信 API が `accountId` を指定しない場合に使用されるアカウントを制御します。アカウントエントリはトップレベル設定を継承します。ほとんどのトップレベルキーはアカウントごとに上書きできます。
`accounts.<id>.tts` は `messages.tts` と同じ形状を使用し、グローバル TTS config の上にディープマージされます。そのため、複数 bot の Feishu セットアップでは、共有プロバイダー認証情報をグローバルに保持しつつ、アカウントごとに音声、モデル、ペルソナ、自動モードだけを上書きできます。

### メッセージ制限

- `textChunkLimit` - 送信テキストチャンクサイズ（デフォルト: `4000` 文字）
- `chunkMode` - `"length"`（デフォルト）は上限で分割します。`"newline"` は改行境界を優先します
- `mediaMaxMb` - メディアのアップロード/ダウンロード上限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark はインタラクティブカード（Card Kit streaming API）経由のストリーミング返信をサポートしています。有効にすると、bot はテキスト生成中にカードをリアルタイムで更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

`streaming: false` を設定すると、完全な返信を 1 つのメッセージで送信します。`renderMode: "raw"`（カードではなくプレーンテキスト）もストリーミングカードを無効にします。`blockStreaming` はデフォルトでオフです。最終返信の前に完了済み assistant ブロックをフラッシュしたい場合にのみ有効にしてください。

### クォータ最適化

2 つの任意フラグで Feishu/Lark API 呼び出し数を減らします。

- `typingIndicator`（デフォルト `true`）: タイピングリアクション呼び出しをスキップするには `false` を設定します
- `resolveSenderNames`（デフォルト `true`）: 送信者プロフィール検索をスキップするには `false` を設定します

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

### グループセッションスコープとトピックスレッド

`channels.feishu.groupSessionScope`（トップレベル、アカウントごと、またはグループごと）は、グループメッセージを agent セッションにどう対応付けるかを制御します。

| 値                       | セッション                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| `"group"`（デフォルト）  | グループチャットごとに 1 セッション                                 |
| `"group_sender"`         | （グループ + 送信者）ごとに 1 セッション                            |
| `"group_topic"`          | トピックスレッドごとに 1 セッション。グループセッションにフォールバックします |
| `"group_topic_sender"`   | （トピック + 送信者）ごとに 1 セッション。（グループ + 送信者）にフォールバックします |

トピックスコープでは、ネイティブの Feishu/Lark トピックグループはイベントの `thread_id`（`omt_*`）を正規のトピックセッションキーとして使用します。ネイティブトピックの開始イベントで `thread_id` が省略されている場合、OpenClaw は turn をルーティングする前に Feishu からそれを取得します。OpenClaw がスレッド化する通常のグループ返信は、返信ルートメッセージ ID（`om_*`）を引き続き使用するため、最初の turn と後続の turn は同じセッションに留まります。

bot の返信をインライン返信ではなく Feishu トピックスレッドの作成または継続にするには、`replyInThread: "enabled"`（トップレベルまたはグループごと）を設定します。`topicSessionMode` は `groupSessionScope` の非推奨の前身です。`groupSessionScope` を優先してください。

### Feishu ワークスペースツール

この plugin には、Feishu のドキュメント、チャット、ナレッジベース、クラウドストレージ、権限、Bitable 用の agent ツールに加え、対応する Skills（`feishu-doc`、`feishu-drive`、`feishu-perm`、`feishu-wiki`）が含まれています。ツールファミリーは `channels.feishu.tools` で制御されます。

| キー            | ツール                                       | デフォルト          |
| --------------- | -------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` ドキュメント操作                | `true`              |
| `tools.chat`    | `feishu_chat` チャット情報 + メンバークエリ  | `true`              |
| `tools.wiki`    | `feishu_wiki` ナレッジベース（`doc` が必要） | `true`              |
| `tools.drive`   | `feishu_drive` クラウドストレージ            | `true`              |
| `tools.perm`    | `feishu_perm` 権限管理                       | `false`（機密）     |
| `tools.scopes`  | `feishu_app_scopes` アプリスコープ診断       | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base 操作         | `true`              |

`tools.base` は `tools.bitable` のエイリアスです。両方が設定されている場合は、明示的な `bitable` の値が優先されます。アカウントごとのゲートは `accounts.<id>.tools` 配下にあります。

### ACP セッション

Feishu/Lark は DM とグループスレッドメッセージで ACP をサポートしています。Feishu/Lark の ACP はテキストコマンド駆動です。ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

#### 永続 ACP バインディング

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

Feishu/Lark の DM またはスレッドで:

```text
/acp spawn codex --thread here
```

`--thread here` は DM と Feishu/Lark のスレッドメッセージで機能します。バインドされた会話内の後続メッセージは、その ACP セッションに直接ルーティングされます。

### マルチエージェントルーティング

`bindings` を使用して、Feishu/Lark の DM またはグループを別々のエージェントにルーティングします。

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
- `match.peer.kind`: `"direct"` (DM) または `"group"` (グループチャット)
- `match.peer.id`: ユーザー Open ID (`ou_xxx`) またはグループ ID (`oc_xxx`)

検索のヒントについては、[グループ/ユーザー ID を取得](#get-groupuser-ids) を参照してください。

## ユーザーごとのエージェント分離 (動的エージェント作成)

`dynamicAgentCreation` を有効にすると、各 DM ユーザーに対して**分離されたエージェントインスタンス**が自動的に作成されます。各ユーザーにはそれぞれ次のものが用意されます。

- 独立したワークスペースディレクトリ
- 個別の `USER.md` / `SOUL.md` / `MEMORY.md`
- プライベートな会話履歴
- 分離された Skills と状態

これは、各ユーザーに自分専用のプライベート AI アシスタント体験を提供したい公開ボットに不可欠です。

<Note>
動的バインディングには正規化された Feishu `accountId` が含まれるため、デフォルトアカウントと名前付きアカウントは各送信者を正しい動的エージェントにルーティングします。

古いリリースで名前付きアカウントがスコープなしの動的エージェントを作成していた場合、そのレガシーエージェントも `maxAgents` にカウントされます。削除する前にデフォルトアカウントで使用されていないことを確認するか、一時的に `maxAgents` を増やしてください。OpenClaw は曖昧なレガシー状態をどのアカウントが所有しているか安全に推測できません。
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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### 仕組み

新しいユーザーが初めて DM を送信すると、次の処理が行われます。

1. チャンネルが一意の `agentId` を生成します。デフォルトアカウントでは `feishu-{user_open_id}`、名前付きアカウントでは制限付きのアカウント接頭辞付き ID ダイジェストです
2. `workspaceTemplate` パスに新しいワークスペースを作成します
3. エージェントを登録し、このユーザー用のバインディングを作成します
4. ワークスペースヘルパーが、初回アクセス時にブートストラップファイル (`AGENTS.md`、`SOUL.md`、`USER.md` など) を確保します
5. このユーザーからの今後すべてのメッセージを専用エージェントにルーティングします

### 設定オプション

| 設定                                                     | 説明                                           | デフォルト                           |
| -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効にする | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントワークスペースのパステンプレート | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数               | 無制限                               |

テンプレート変数:

- `{agentId}` - 生成されたエージェント ID (例: `feishu-ou_xxxxxx` または `feishu-support-<identity_digest>`)
- `{userId}` - 送信者の Feishu open_id (例: `ou_xxxxxx`)

### セッションスコープ

`session.dmScope` は、ダイレクトメッセージをエージェントセッションにどのようにマッピングするかを制御します。これはすべてのチャンネルに影響する**グローバル設定**です。

| 値                           | 動作                                                                 | 最適な用途                                                           |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `"main"`                     | 各ユーザーの DM を、そのエージェントのメインセッションにマッピングします | `USER.md` / `SOUL.md` を自動読み込みしたい単一ユーザーボット          |
| `"per-peer"`                 | 各ピアに個別のセッションを割り当てます (チャンネルに関係なく)        | 送信者 ID のみをキーにした分離                                       |
| `"per-channel-peer"`         | 各 (チャンネル + ユーザー) の組み合わせに個別のセッションを割り当てます | より強い分離が必要な公開マルチユーザーボット                         |
| `"per-account-channel-peer"` | 各 (アカウント + チャンネル + ユーザー) の組み合わせに個別のセッションを割り当てます | アカウントレベルのセッション分離が必要なマルチアカウントボット       |

**トレードオフ**: `"main"` を使用すると、ブートストラップファイル (`USER.md`、`SOUL.md`、`MEMORY.md`) の自動読み込みが有効になりますが、すべてのチャンネルのすべての DM が同じセッションキーパターンを共有します。ブートストラップの自動読み込みよりも分離が重要な公開マルチユーザーボットでは、`"per-channel-peer"` を検討し、ブートストラップファイルを手動で管理してください。

<Note>
名前付き Feishu アカウントで同じ送信者に対してセッションを分ける必要がある場合は、`"per-account-channel-peer"` を使用してください。動的バインディングはアカウントスコープを保持します。
</Note>

### 一般的なマルチユーザーデプロイ

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### 検証

動的作成が機能していることを確認するには、Gateway ログを確認します。

```text
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
  workspace: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

作成されたすべてのワークスペースを一覧表示します。

```bash
ls -la ~/.openclaw/workspace-*
```

### 注記

- **ワークスペース分離**: 各ユーザーには、それぞれ専用のワークスペースディレクトリとエージェントインスタンスが割り当てられます。通常のメッセージングフロー内では、ユーザーは互いの会話履歴やファイルを見ることはできません。
- **セキュリティ境界**: これはメッセージングコンテキストの分離メカニズムであり、敵対的な共同テナントに対するセキュリティ境界ではありません。エージェントプロセスとホスト環境は共有されます。
- **設定書き込みは有効のままにする必要があります**: 動的エージェント作成は設定にエージェントとバインディングを書き込みます。`channels.feishu.configWrites` が `false` の場合はスキップされます (デフォルト: 有効)。
- **`bindings` は空にする必要があります**: 動的エージェントは自身のバインディングを自動登録します
- **アップグレードパス**: 既存の手動バインディングは、動的エージェントと並行して引き続き機能します
- **`session.dmScope` はグローバルです**: これは Feishu だけでなく、すべてのチャンネルに影響します

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定                                                     | 説明                                                                                 | デフォルト                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | チャンネルを有効化/無効化                                                           | `true`                               |
| `channels.feishu.domain`                                 | API ドメイン（`feishu`、`lark`、または `https://` ベース URL）                       | `feishu`                             |
| `channels.feishu.connectionMode`                         | イベント転送（`websocket` または `webhook`）                                         | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 送信ルーティング用のデフォルトアカウント                                            | `default`                            |
| `channels.feishu.verificationToken`                      | webhook モードで必須                                                                 | -                                    |
| `channels.feishu.encryptKey`                             | webhook モードで必須                                                                 | -                                    |
| `channels.feishu.webhookPath`                            | Webhook ルートパス                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook バインドホスト                                                               | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook バインドポート                                                               | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | アプリ ID                                                                            | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | アプリシークレット                                                                   | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | アカウントごとのドメイン上書き                                                      | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | アカウントごとの TTS 上書き                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM ポリシー（`pairing`、`allowlist`、`open`）                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM 許可リスト（open_id リスト）                                                     | -                                    |
| `channels.feishu.groupPolicy`                            | グループポリシー（`open`、`allowlist`、`disabled`）                                  | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | グループ許可リスト                                                                   | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | すべてのグループに適用される送信者許可リスト                                        | -                                    |
| `channels.feishu.requireMention`                         | グループで @メンションを必須にする                                                  | `true`（ポリシーが `open` の場合は `false`） |
| `channels.feishu.groups.<chat_id>.requireMention`        | グループごとの @メンション上書き。明示的な ID は許可リストモードでもグループを許可します | 継承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 特定のグループを有効化/無効化                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | グループごとの送信者許可リスト（`groupSenderAllowFrom` を上書き）                   | -                                    |
| `channels.feishu.groupSessionScope`                      | グループセッションマッピング（`group`、`group_sender`、`group_topic`、`group_topic_sender`） | `group`                              |
| `channels.feishu.replyInThread`                          | Bot の返信がトピックスレッドを作成/継続する（`disabled`、`enabled`）                | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | 受信リアクションイベント（`off`、`own`、`all`）                                     | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効化                                          | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントワークスペースのパステンプレート                                    | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名テンプレート                                              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数                                                    | 無制限                               |
| `channels.feishu.textChunkLimit`                         | メッセージチャンクサイズ                                                            | `4000`                               |
| `channels.feishu.chunkMode`                              | チャンク分割（`length` または `newline`）                                           | `length`                             |
| `channels.feishu.mediaMaxMb`                             | メディアサイズ上限                                                                   | `30`                                 |
| `channels.feishu.renderMode`                             | 返信レンダリング（`auto`、`raw`、`card`）                                           | `auto`                               |
| `channels.feishu.streaming`                              | ストリーミングカード出力                                                            | `true`                               |
| `channels.feishu.blockStreaming`                         | 完了済みブロック返信ストリーミング                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | 入力中リアクションを送信                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 送信者表示名を解決                                                                  | `true`                               |
| `channels.feishu.configWrites`                           | チャンネル起点の設定書き込みを許可（動的エージェントで必要）                       | `true`                               |
| `channels.feishu.tools.doc`                              | ドキュメントツールを有効化                                                          | `true`                               |
| `channels.feishu.tools.chat`                             | チャット情報ツールを有効化                                                          | `true`                               |
| `channels.feishu.tools.wiki`                             | ナレッジベースツールを有効化（`doc` が必要）                                        | `true`                               |
| `channels.feishu.tools.drive`                            | クラウドストレージツールを有効化                                                    | `true`                               |
| `channels.feishu.tools.perm`                             | 権限管理ツールを有効化                                                              | `false`                              |
| `channels.feishu.tools.scopes`                           | アプリスコープ診断ツールを有効化                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base ツールを有効化                                                         | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` のエイリアス。両方が設定されている場合は明示的な `bitable` が優先 | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | アカウントごとの Bitable/Base ツールゲート                                          | 継承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | アカウントごとの `tools.bitable` のエイリアス                                       | 継承                                 |

## 対応メッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（post）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ ステッカー

受信した Feishu/Lark 音声メッセージは、生の `file_key` JSON ではなくメディアプレースホルダーとして正規化されます。`tools.media.audio` が設定されている場合、OpenClaw はボイスメモリソースをダウンロードし、エージェントターンの前に共有音声文字起こしを実行するため、エージェントは発話の文字起こしを受け取ります。Feishu が音声ペイロードに文字起こしテキストを直接含めている場合、そのテキストが追加の ASR 呼び出しなしで使用されます。音声文字起こしプロバイダーがない場合でも、エージェントは生の Feishu リソースペイロードではなく、`<media:audio>` プレースホルダーと保存済み添付ファイルを受け取ります。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（post スタイルの書式設定。Feishu/Lark の完全なオーサリング機能には対応していません）

ネイティブ Feishu/Lark 音声バブルは Feishu の `audio` メッセージタイプを使用し、Ogg/Opus アップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` および `.ogg` メディアはネイティブ音声として直接送信されます。MP3/WAV/M4A などの音声形式と思われるものは、返信が音声配信を要求する場合（`audioAsVoice` / メッセージツール `asVoice`、TTS ボイスメモ返信を含む）にのみ、`ffmpeg` で 48kHz Ogg/Opus にトランスコードされます。通常の MP3 添付ファイルは通常のファイルのままです。`ffmpeg` がない、または変換に失敗した場合、OpenClaw はファイル添付にフォールバックし、理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージに返信する場合、メディア返信はスレッドを認識したままになります

トピックグループのセッションルーティングは
[グループセッションスコープとトピックスレッド](#group-session-scope-and-topic-threads)で説明しています。

## 関連

- [チャンネル概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
