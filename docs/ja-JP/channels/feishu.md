---
read_when:
    - Feishu/Lark ボットを接続したい
    - Feishu チャンネルを設定しています
summary: Feishu bot の概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-06-30T13:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark は、チームがチャット、ドキュメント共有、カレンダー管理、共同作業をまとめて行えるオールインワンのコラボレーションプラットフォームです。

**ステータス:** bot の DM とグループチャットで本番運用可能です。WebSocket がデフォルトモードで、webhook モードは任意です。

---

## クイックスタート

<Note>
OpenClaw 2026.5.29 以降が必要です。確認するには `openclaw --version` を実行します。アップグレードは `openclaw update` で行います。
</Note>

<Steps>
  <Step title="チャンネルセットアップウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu Open Platform から App ID と App Secret を貼り付けるには手動セットアップを選択し、bot を自動作成するには QR セットアップを選択します。中国国内版の Feishu モバイルアプリが QR コードに反応しない場合は、セットアップを再実行して手動セットアップを選択します。
  </Step>
  
  <Step title="セットアップ完了後、変更を適用するために gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## アクセス制御

### ダイレクトメッセージ

bot に DM できるユーザーを制御するには `dmPolicy` を設定します。

- `"pairing"` - 不明なユーザーはペアリングコードを受け取り、CLI で承認します
- `"allowlist"` - `allowFrom` に列挙されたユーザーのみがチャットできます
- `"open"` - `allowFrom` に `"*"` が含まれる場合のみ公開 DM を許可します。制限的なエントリがある場合は、一致するユーザーのみがチャットできます

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー** (`channels.feishu.groupPolicy`):

| 値            | 動作                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します                                                   |
| `"allowlist"` | `groupAllowFrom` 内、または `groups.<chat_id>` 配下で明示的に設定されたグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします。明示的な `groups.<chat_id>` エントリでも上書きされません |

デフォルト: `allowlist`

**メンション要件** (`channels.feishu.requireMention`):

- `true` - @mention を必須にします（デフォルト）
- `false` - @mention なしで応答します
- グループ単位の上書き: `channels.feishu.groups.<chat_id>.requireMention`
- ブロードキャスト専用の `@all` と `@_all` は bot メンションとして扱われません。`@all` と bot への直接メンションの両方を含むメッセージは、引き続き bot メンションとして扱われます。

---

## グループ設定例

### すべてのグループを許可し、@mention を不要にする

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### すべてのグループを許可し、引き続き @mention を必須にする

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` モードでは、明示的な `groups.<chat_id>` エントリを追加してグループを許可することもできます。明示的なエントリは `groupPolicy: "disabled"` を上書きしません。`groups.*` 配下のワイルドカードデフォルトは一致するグループを設定しますが、それだけではグループを許可しません。

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

---

<a id="get-groupuser-ids"></a>

## グループ/ユーザー ID を取得する

### グループ ID (`chat_id`、形式: `oc_xxx`)

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **設定** に移動します。グループ ID (`chat_id`) は設定ページに表示されます。

![グループ ID を取得](/images/feishu-get-group-id.png)

### ユーザー ID (`open_id`、形式: `ou_xxx`)

gateway を起動し、bot に DM を送信してからログを確認します。

```bash
openclaw logs --follow
```

ログ出力で `open_id` を探します。保留中のペアリングリクエストも確認できます。

```bash
openclaw pairing list feishu
```

---

## よく使うコマンド

| コマンド  | 説明                         |
| --------- | ---------------------------- |
| `/status` | bot のステータスを表示します |
| `/reset`  | 現在のセッションをリセットします |
| `/model`  | AI モデルを表示または切り替えます |

<Note>
Feishu/Lark はネイティブのスラッシュコマンドメニューに対応していないため、これらはプレーンテキストメッセージとして送信してください。
</Note>

---

## トラブルシューティング

### bot がグループチャットで応答しない

1. bot がグループに追加されていることを確認します
2. bot に @mention していることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` でないことを確認します
4. ログを確認します: `openclaw logs --follow`

### bot がメッセージを受信しない

1. bot が Feishu Open Platform / Lark Developer で公開および承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **永続接続**（WebSocket）が選択されていることを確認します
4. 必要なすべての権限スコープが付与されていることを確認します
5. gateway が実行中であることを確認します: `openclaw gateway status`
6. ログを確認します: `openclaw logs --follow`

### QR セットアップが Feishu モバイルアプリで反応しない

1. セットアップを再実行します: `openclaw channels login --channel feishu`
2. 手動セットアップを選択します
3. Feishu Open Platform で自社開発アプリを作成し、その App ID と App Secret をコピーします
4. それらの認証情報をセットアップウィザードに貼り付けます

### App Secret が漏えいした

1. Feishu Open Platform / Lark Developer で App Secret をリセットします
2. config 内の値を更新します
3. gateway を再起動します: `openclaw gateway restart`

---

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

`defaultAccount` は、送信 API が `accountId` を指定しない場合に使用されるアカウントを制御します。
`accounts.<id>.tts` は `messages.tts` と同じ形状を使用し、グローバル TTS config に対してディープマージされます。そのため、複数 bot の Feishu セットアップでは、共有プロバイダー認証情報をグローバルに保持しながら、アカウントごとに voice、model、persona、auto mode のみを上書きできます。

### メッセージ制限

- `textChunkLimit` - 送信テキストチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` - メディアのアップロード/ダウンロード制限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark はインタラクティブカードによるストリーミング返信に対応しています。有効にすると、bot はテキスト生成中にカードをリアルタイムで更新します。

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

返信全体を 1 つのメッセージで送信するには `streaming: false` を設定します。`blockStreaming` はデフォルトでオフです。最終返信の前に完了済み assistant ブロックをフラッシュしたい場合のみ有効にします。

### クォータ最適化

2 つの任意フラグで Feishu/Lark API 呼び出し回数を減らします。

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

### ACP セッション

Feishu/Lark は DM とグループスレッドメッセージで ACP に対応しています。Feishu/Lark ACP はテキストコマンド駆動です。ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用します。

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

#### チャットから ACP を起動する

Feishu/Lark の DM またはスレッドで:

```text
/acp spawn codex --thread here
```

`--thread here` は DM と Feishu/Lark スレッドメッセージで機能します。バインドされた会話内の後続メッセージは、その ACP セッションに直接ルーティングされます。

### マルチエージェントルーティング

Feishu/Lark の DM またはグループを別々のエージェントへルーティングするには `bindings` を使用します。

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
- `match.peer.id`: ユーザー Open ID (`ou_xxx`) またはグループ ID (`oc_xxx`)

検索のヒントは [グループ/ユーザー ID を取得する](#get-groupuser-ids) を参照してください。

---

## ユーザーごとのエージェント分離（動的エージェント作成）

各 DM ユーザーに対して **分離されたエージェントインスタンス** を自動作成するには、`dynamicAgentCreation` を有効にします。各ユーザーには次が割り当てられます。

- 独立したワークスペースディレクトリ
- 個別の `USER.md` / `SOUL.md` / `MEMORY.md`
- プライベートな会話履歴
- 分離された Skills と状態

これは、各ユーザーに自分専用のプライベート AI アシスタント体験を提供したい公開 bot では不可欠です。

<Note>
動的バインディングには正規化された Feishu `accountId` が含まれるため、デフォルトアカウントと名前付きアカウントは、それぞれの送信者を正しい動的エージェントへルーティングします。

古いリリースで名前付きアカウントがスコープなしの動的エージェントを作成していた場合、そのレガシーエージェントは引き続き `maxAgents` にカウントされます。削除する前にデフォルトアカウントで使用されていないことを確認するか、一時的に `maxAgents` を増やしてください。OpenClaw は曖昧なレガシー状態をどのアカウントが所有しているかを安全に推測できません。
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

新しいユーザーが最初の DM を送信すると:

1. チャンネルが一意の `agentId` を生成します。デフォルトアカウントでは `feishu-{user_open_id}`、名前付きアカウントでは境界付きのアカウント接頭辞付き ID ダイジェストになります
2. `workspaceTemplate` パスに新しいワークスペースを作成します
3. エージェントを登録し、このユーザー向けのバインディングを作成します
4. ワークスペースヘルパーが初回アクセス時にブートストラップファイル（`AGENTS.md`、`SOUL.md`、`USER.md` など）を確保します
5. このユーザーからの今後すべてのメッセージを専用エージェントへルーティングします

### 設定オプション

| 設定                                                     | 説明                                           | デフォルト                           |
| -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効化     | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントのワークスペースのパステンプレート | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数               | 無制限                               |

テンプレート変数:

- `{agentId}` - 生成されたエージェント ID（例: `feishu-ou_xxxxxx` または `feishu-support-<identity_digest>`）
- `{userId}` - 送信者の Feishu open_id（例: `ou_xxxxxx`）

### セッションスコープ

`session.dmScope` は、ダイレクトメッセージをエージェントセッションにどう対応付けるかを制御します。これはすべてのチャンネルに影響する**グローバル設定**です。

| 値                           | 動作                                                                  | 最適な用途                                                           |
| ---------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `"main"`                     | 各ユーザーの DM が、そのエージェントのメインセッションに対応付けられる | `USER.md` / `SOUL.md` を自動読み込みしたい単一ユーザーのボット       |
| `"per-channel-peer"`         | 各（チャンネル + ユーザー）の組み合わせが個別セッションを持つ          | より強い分離が必要な公開マルチユーザーボット                         |
| `"per-account-channel-peer"` | 各（アカウント + チャンネル + ユーザー）の組み合わせが個別セッションを持つ | アカウントレベルのセッション分離が必要なマルチアカウントボット       |

**トレードオフ**: `"main"` を使うとブートストラップファイル（`USER.md`、`SOUL.md`、`MEMORY.md`）の自動読み込みが有効になりますが、すべてのチャンネルのすべての DM が同じセッションキーのパターンを共有します。ブートストラップの自動読み込みよりも分離が重要な公開マルチユーザーボットでは、`"per-channel-peer"` を検討し、ブートストラップファイルを手動で管理してください。

<Note>
同じ送信者に対して、名前付き Feishu アカウントが個別のセッションを保持すべき場合は `"per-account-channel-peer"` を使います。動的バインディングはアカウントスコープを保持します。
</Note>

```json5
{
  session: {
    // 単一ユーザーの個人用ボット向け: 自動ブートストラップ読み込みを有効化
    dmScope: "main",

    // 公開マルチユーザーボット向け: より強い分離
    // dmScope: "per-channel-peer",
  },
}
```

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
    // 分離要件に応じて dmScope を選択:
    // ブートストラップ自動読み込みには "main"、より強い分離には "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // 空 - 動的エージェントが自動バインドされる
}
```

### 検証

Gateway ログを確認して、動的作成が機能していることを確認します:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

作成されたすべてのワークスペースを一覧表示します:

```bash
ls -la ~/.openclaw/workspace-*
```

### 注記

- **ワークスペース分離**: 各ユーザーは自身のワークスペースディレクトリとエージェントインスタンスを持ちます。通常のメッセージングフロー内では、ユーザーは互いの会話履歴やファイルを見ることはできません。
- **セキュリティ境界**: これはメッセージングコンテキストの分離メカニズムであり、敵対的な同居テナントに対するセキュリティ境界ではありません。エージェントプロセスとホスト環境は共有されます。
- **`bindings` は空にする必要があります**: 動的エージェントは自身のバインディングを自動登録します
- **アップグレードパス**: 既存の手動バインディングは動的エージェントと並行して引き続き機能します
- **`session.dmScope` はグローバルです**: これは Feishu だけでなく、すべてのチャンネルに影響します

---

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定                                                     | 説明                                                                                  | デフォルト                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | チャンネルを有効化/無効化                                                             | `true`                               |
| `channels.feishu.domain`                                 | API ドメイン（`feishu` または `lark`）                                                 | `feishu`                             |
| `channels.feishu.connectionMode`                         | イベントトランスポート（`websocket` または `webhook`）                                 | `websocket`                          |
| `channels.feishu.defaultAccount`                         | アウトバウンドルーティング用のデフォルトアカウント                                     | `default`                            |
| `channels.feishu.verificationToken`                      | webhook モードに必須                                                                   | -                                    |
| `channels.feishu.encryptKey`                             | webhook モードに必須                                                                   | -                                    |
| `channels.feishu.webhookPath`                            | Webhook ルートパス                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook バインドホスト                                                                 | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook バインドポート                                                                 | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | アプリ ID                                                                              | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | アプリシークレット                                                                     | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | アカウントごとのドメイン上書き                                                         | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | アカウントごとの TTS 上書き                                                            | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM ポリシー                                                                            | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM 許可リスト（open_id リスト）                                                        | -                                    |
| `channels.feishu.groupPolicy`                            | グループポリシー                                                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | グループ許可リスト                                                                     | -                                    |
| `channels.feishu.requireMention`                         | グループ内で @mention を必須にする                                                     | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | グループごとの @mention 上書き。明示的な ID は許可リストモードでもグループを許可します | inherited                            |
| `channels.feishu.groups.<chat_id>.enabled`               | 特定のグループを有効化/無効化                                                          | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | ユーザーごとのエージェント自動作成を有効化                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動的エージェントのワークスペースのパステンプレート                                     | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | エージェントディレクトリ名のテンプレート                                               | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 作成する動的エージェントの最大数                                                       | 無制限                               |
| `channels.feishu.textChunkLimit`                         | メッセージチャンクサイズ                                                               | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | メディアサイズ制限                                                                     | `30`                                 |
| `channels.feishu.streaming`                              | ストリーミングカード出力                                                               | `true`                               |
| `channels.feishu.blockStreaming`                         | 完了済みブロック返信のストリーミング                                                   | `false`                              |
| `channels.feishu.typingIndicator`                        | 入力中リアクションを送信                                                               | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 送信者表示名を解決                                                                     | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base ツールを有効化                                                            | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` のエイリアス。両方設定された場合は明示的な `bitable` が優先 | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | アカウントごとの Bitable/Base ツールゲート                                             | inherited                            |
| `channels.feishu.accounts.<id>.tools.base`               | アカウントごとの `tools.bitable` のエイリアス                                           | inherited                            |

---

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（投稿）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ ステッカー

受信した Feishu/Lark の音声メッセージは、生の `file_key` JSON ではなく、メディアプレースホルダーとして正規化されます。`tools.media.audio` が設定されている場合、OpenClaw はボイスメモリソースをダウンロードし、エージェントターンの前に共有音声文字起こしを実行するため、エージェントは発話の文字起こしを受け取ります。Feishu が音声ペイロードに文字起こしテキストを直接含めている場合、そのテキストが追加の ASR 呼び出しなしで使用されます。音声文字起こしプロバイダーがない場合でも、エージェントは生の Feishu リソースペイロードではなく、`<media:audio>` プレースホルダーと保存済み添付ファイルを受け取ります。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ ビデオ/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（投稿形式のフォーマット。Feishu/Lark の完全な作成機能には対応していません）

ネイティブの Feishu/Lark 音声バブルは Feishu の `audio` メッセージタイプを使用し、
Ogg/Opus アップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` と `.ogg` メディアは、
ネイティブ音声として直接送信されます。MP3/WAV/M4A とその他の音声と思われる形式は、
返信が音声配信（`audioAsVoice` / メッセージツール `asVoice`、TTS 音声メモ返信を含む）を要求した場合にのみ、
`ffmpeg` で 48kHz Ogg/Opus にトランスコードされます。通常の MP3 添付ファイルは通常のファイルのままです。`ffmpeg` がない場合、または
変換に失敗した場合、OpenClaw はファイル添付にフォールバックし、その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージに返信する場合、メディア返信はスレッドを認識したままになります

`groupSessionScope: "group_topic"` と `"group_topic_sender"` では、ネイティブの
Feishu/Lark トピックグループはイベントの `thread_id`（`omt_*`）を標準の
トピックセッションキーとして使用します。ネイティブトピックの開始イベントで `thread_id` が省略されている場合、OpenClaw は
ターンをルーティングする前に Feishu からそれを補完します。OpenClaw がスレッドに変換する通常のグループ返信では、
返信ルートメッセージ ID（`om_*`）を引き続き使用するため、
最初のターンと後続ターンは同じセッションに残ります。

---

## 関連

- [チャンネル概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
