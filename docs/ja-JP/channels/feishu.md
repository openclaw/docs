---
read_when:
    - Feishu/Lark botを接続したい場合
    - Feishuチャネルを設定しています
summary: Feishu botの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-04-23T13:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11bf136cecb26dc939c5e78e020c0e6aa3312d9f143af0cab7568743c728cf13
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Larkは、チームがチャットし、ドキュメントを共有し、カレンダーを管理し、一緒に仕事を進められるオールインワンのコラボレーションプラットフォームです。

**ステータス:** botのDMとグループチャット向けに本番利用可能です。WebSocketがデフォルトのモードで、Webhookモードは任意です。

---

## クイックスタート

> **OpenClaw 2026.4.10以降が必要です。** 確認するには `openclaw --version` を実行してください。アップグレードは `openclaw update` で行えます。

<Steps>
  <Step title="チャネル設定ウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/LarkモバイルアプリでQRコードをスキャンすると、Feishu/Lark botが自動的に作成されます。
  </Step>
  
  <Step title="セットアップ完了後、変更を反映するためにGatewayを再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## アクセス制御

### ダイレクトメッセージ

botにDMできるユーザーを制御するには、`dmPolicy` を設定します。

- `"pairing"` — 不明なユーザーにはペアリングコードが送られます。CLIで承認してください
- `"allowlist"` — `allowFrom` に記載されたユーザーのみチャットできます（デフォルト: botオーナーのみ）
- `"open"` — すべてのユーザーを許可します
- `"disabled"` — すべてのDMを無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー** (`channels.feishu.groupPolicy`):

| Value         | 動作 |
| ------------- | ---- |
| `"open"`      | グループ内のすべてのメッセージに応答します |
| `"allowlist"` | `groupAllowFrom` 内のグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします |

デフォルト: `allowlist`

**メンション要件** (`channels.feishu.requireMention`):

- `true` — @メンションを必須にします（デフォルト）
- `false` — @メンションなしで応答します
- グループごとの上書き: `channels.feishu.groups.<chat_id>.requireMention`

---

## グループ設定の例

### すべてのグループを許可し、@メンション不要

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### すべてのグループを許可しつつ、@メンションは必須

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

### 特定のグループのみ許可

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // グループIDの形式: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### グループ内の送信者を制限

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_idの形式: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## グループ/ユーザーIDを取得する

### グループID (`chat_id`, 形式: `oc_xxx`)

Feishu/Larkでグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。グループID (`chat_id`) は設定ページに表示されます。

![グループIDを取得](/images/feishu-get-group-id.png)

### ユーザーID (`open_id`, 形式: `ou_xxx`)

Gatewayを起動し、botにDMを送信してから、ログを確認します。

```bash
openclaw logs --follow
```

ログ出力内の `open_id` を探してください。保留中のペアリングリクエストを確認することもできます。

```bash
openclaw pairing list feishu
```

---

## よく使うコマンド

| Command   | 説明 |
| --------- | ---- |
| `/status` | botのステータスを表示します |
| `/reset`  | 現在のセッションをリセットします |
| `/model`  | AIモデルを表示または切り替えます |

> Feishu/Larkはネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。

---

## トラブルシューティング

### botがグループチャットで応答しない

1. botがグループに追加されていることを確認します
2. botに@メンションしていることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` ではないことを確認します
4. ログを確認します: `openclaw logs --follow`

### botがメッセージを受信しない

1. botがFeishu Open Platform / Lark Developerで公開され、承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection**（WebSocket）が選択されていることを確認します
4. 必要なすべての権限スコープが付与されていることを確認します
5. Gatewayが実行中であることを確認します: `openclaw gateway status`
6. ログを確認します: `openclaw logs --follow`

### App Secretが漏洩した

1. Feishu Open Platform / Lark DeveloperでApp Secretをリセットします
2. 設定内の値を更新します
3. Gatewayを再起動します: `openclaw gateway restart`

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

`defaultAccount` は、送信APIで `accountId` が指定されていない場合にどのアカウントを使うかを制御します。

### メッセージ制限

- `textChunkLimit` — 送信テキストのチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` — メディアのアップロード/ダウンロード上限（デフォルト: `30` MB）

### ストリーミング

Feishu/Larkはインタラクティブカードによるストリーミング返信をサポートしています。有効にすると、botはテキスト生成中にカードをリアルタイムで更新します。

```json5
{
  channels: {
    feishu: {
      streaming: true, // ストリーミングカード出力を有効化（デフォルト: true）
      blockStreaming: true, // ブロック単位のストリーミングを有効化（デフォルト: true）
    },
  },
}
```

`streaming: false` に設定すると、完全な返信を1つのメッセージで送信します。

### クォータ最適化

2つの任意フラグでFeishu/Lark API呼び出し回数を減らせます。

- `typingIndicator`（デフォルト `true`）: `false` にすると入力中リアクションの呼び出しを省略します
- `resolveSenderNames`（デフォルト `true`）: `false` にすると送信者プロフィールの参照を省略します

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

### ACPセッション

Feishu/LarkはDMとグループスレッドメッセージでACPをサポートします。Feishu/Lark ACPはテキストコマンド駆動です。ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

#### 永続的なACPバインド

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

#### チャットからACPを起動

Feishu/LarkのDMまたはスレッド内で:

```text
/acp spawn codex --thread here
```

`--thread here` はDMとFeishu/Larkのスレッドメッセージで動作します。バインドされた会話内の後続メッセージは、そのACPセッションに直接ルーティングされます。

### マルチエージェントルーティング

`bindings` を使うと、Feishu/LarkのDMまたはグループを異なるエージェントにルーティングできます。

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
- `match.peer.id`: ユーザーOpen ID（`ou_xxx`）またはグループID（`oc_xxx`）

確認方法のヒントについては、[グループ/ユーザーIDを取得する](#get-groupuser-ids) を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway configuration](/ja-JP/gateway/configuration)

| Setting                                           | 説明 | Default          |
| ------------------------------------------------- | ---- | ---------------- |
| `channels.feishu.enabled`                         | チャネルを有効/無効にする | `true`           |
| `channels.feishu.domain`                          | APIドメイン（`feishu` または `lark`） | `feishu`         |
| `channels.feishu.connectionMode`                  | イベント転送方式（`websocket` または `webhook`） | `websocket`      |
| `channels.feishu.defaultAccount`                  | 送信ルーティング用のデフォルトアカウント | `default`        |
| `channels.feishu.verificationToken`               | webhookモードで必須 | —                |
| `channels.feishu.encryptKey`                      | webhookモードで必須 | —                |
| `channels.feishu.webhookPath`                     | Webhookルートパス | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhookバインドホスト | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhookバインドポート | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret | —                |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのドメイン上書き | `feishu`         |
| `channels.feishu.dmPolicy`                        | DMポリシー | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM許可リスト（open_id一覧） | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | グループポリシー | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト | —                |
| `channels.feishu.requireMention`                  | グループで@メンションを必須にする | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの@メンション上書き | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | 特定グループを有効/無効にする | `true`           |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ | `2000`           |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ上限 | `30`             |
| `channels.feishu.streaming`                       | ストリーミングカード出力 | `true`           |
| `channels.feishu.blockStreaming`                  | ブロック単位ストリーミング | `true`           |
| `channels.feishu.typingIndicator`                 | 入力中リアクションを送信する | `true`           |
| `channels.feishu.resolveSenderNames`              | 送信者表示名を解決する | `true`           |

---

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（post）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ ステッカー

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（post形式の書式設定。Feishu/Larkの完全な作成機能には対応していません）

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ メディア返信はスレッドメッセージへの返信時にスレッド対応を維持します

---

## 関連項目

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
