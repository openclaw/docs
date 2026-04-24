---
read_when:
    - Feishu/Lark ボットを接続したい場合
    - Feishu チャンネルを設定しています
summary: Feishu ボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-04-24T04:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark は、チームでチャット、ドキュメント共有、カレンダー管理を行い、共同で作業を進められるオールインワンのコラボレーションプラットフォームです。

**ステータス:** ボットの DM とグループチャットに本番対応しています。WebSocket がデフォルトモードで、Webhook モードは任意です。

---

## クイックスタート

> **OpenClaw 2026.4.24 以降が必要です。** 確認するには `openclaw --version` を実行してください。アップグレードするには `openclaw update` を実行します。

<Steps>
  <Step title="チャンネル設定ウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/Lark モバイルアプリで QR コードをスキャンすると、Feishu/Lark ボットが自動的に作成されます。
  </Step>
  
  <Step title="セットアップ完了後、変更を適用するために Gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## アクセス制御

### ダイレクトメッセージ

`dmPolicy` を設定して、誰がボットに DM できるかを制御します。

- `"pairing"` — 不明なユーザーにはペアリングコードが送られ、CLI で承認します
- `"allowlist"` — `allowFrom` に列挙されたユーザーのみチャットできます（デフォルト: ボット所有者のみ）
- `"open"` — すべてのユーザーを許可します
- `"disabled"` — すべての DM を無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー** (`channels.feishu.groupPolicy`):

| 値 | 動作 |
| ------------- | ------------------------------------------ |
| `"open"`      | グループ内のすべてのメッセージに応答します |
| `"allowlist"` | `groupAllowFrom` 内のグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします |

デフォルト: `allowlist`

**メンション必須** (`channels.feishu.requireMention`):

- `true` — @メンションを必須にします（デフォルト）
- `false` — @メンションなしで応答します
- グループごとの上書き: `channels.feishu.groups.<chat_id>.requireMention`

---

## グループ設定例

### すべてのグループを許可し、@メンションは不要

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
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

### 特定のグループのみを許可

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

### グループ ID (`chat_id`, 形式: `oc_xxx`)

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。グループ ID (`chat_id`) は設定ページに表示されます。

![Get Group ID](/images/feishu-get-group-id.png)

### ユーザー ID (`open_id`, 形式: `ou_xxx`)

Gateway を起動し、ボットに DM を送信してから、ログを確認します。

```bash
openclaw logs --follow
```

ログ出力で `open_id` を探してください。保留中のペアリングリクエストを確認することもできます。

```bash
openclaw pairing list feishu
```

---

## よく使うコマンド

| コマンド | 説明 |
| --------- | --------------------------- |
| `/status` | ボットのステータスを表示します |
| `/reset`  | 現在のセッションをリセットします |
| `/model`  | AI モデルを表示または切り替えます |

> Feishu/Lark はネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。

---

## トラブルシューティング

### ボットがグループチャットで応答しない

1. ボットがグループに追加されていることを確認します
2. ボットに @メンションしていることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` になっていないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットが Feishu Open Platform / Lark Developer で公開・承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection**（WebSocket）が選択されていることを確認します
4. 必要なすべての権限スコープが付与されていることを確認します
5. Gateway が実行中であることを確認します: `openclaw gateway status`
6. ログを確認します: `openclaw logs --follow`

### App Secret が漏えいした

1. Feishu Open Platform / Lark Developer で App Secret をリセットします
2. 設定内の値を更新します
3. Gateway を再起動します: `openclaw gateway restart`

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

`defaultAccount` は、送信 API で `accountId` が指定されていない場合にどのアカウントを使用するかを制御します。

### メッセージ制限

- `textChunkLimit` — 送信テキストのチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` — メディアのアップロード/ダウンロード制限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark は、インタラクティブカードを通じたストリーミング返信をサポートしています。有効にすると、ボットはテキスト生成中にカードをリアルタイムで更新します。

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

`streaming: false` を設定すると、完全な返信を 1 つのメッセージとして送信します。

### クォータ最適化

2 つの任意フラグを使用して、Feishu/Lark API 呼び出しの回数を減らせます。

- `typingIndicator`（デフォルト `true`）: `false` に設定すると、入力中リアクションの呼び出しをスキップします
- `resolveSenderNames`（デフォルト `true`）: `false` に設定すると、送信者プロフィールの参照をスキップします

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

Feishu/Lark は DM とグループスレッドメッセージで ACP をサポートしています。Feishu/Lark の ACP はテキストコマンド駆動で、ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用してください。

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

#### チャットから ACP を起動する

Feishu/Lark の DM またはスレッドで:

```text
/acp spawn codex --thread here
```

`--thread here` は DM と Feishu/Lark のスレッドメッセージで機能します。バインドされた会話での後続メッセージは、その ACP セッションに直接ルーティングされます。

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

検索のヒントについては、[グループ/ユーザー ID を取得する](#get-groupuser-ids) を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定 | 説明 | デフォルト |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | チャンネルを有効/無効にする | `true` |
| `channels.feishu.domain`                          | API ドメイン（`feishu` または `lark`） | `feishu` |
| `channels.feishu.connectionMode`                  | イベント転送方式（`websocket` または `webhook`） | `websocket` |
| `channels.feishu.defaultAccount`                  | 送信ルーティング用のデフォルトアカウント | `default` |
| `channels.feishu.verificationToken`               | webhook モードで必須 | — |
| `channels.feishu.encryptKey`                      | webhook モードで必須 | — |
| `channels.feishu.webhookPath`                     | Webhook ルートパス | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook バインドホスト | `127.0.0.1` |
| `channels.feishu.webhookPort`                     | Webhook バインドポート | `3000` |
| `channels.feishu.accounts.<id>.appId`             | App ID | — |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret | — |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのドメイン上書き | `feishu` |
| `channels.feishu.dmPolicy`                        | DM ポリシー | `allowlist` |
| `channels.feishu.allowFrom`                       | DM 許可リスト（open_id の一覧） | [BotOwnerId] |
| `channels.feishu.groupPolicy`                     | グループポリシー | `allowlist` |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト | — |
| `channels.feishu.requireMention`                  | グループで @メンションを必須にする | `true` |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの @メンション上書き | 継承 |
| `channels.feishu.groups.<chat_id>.enabled`        | 特定のグループを有効/無効にする | `true` |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ | `2000` |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ制限 | `30` |
| `channels.feishu.streaming`                       | ストリーミングカード出力 | `true` |
| `channels.feishu.blockStreaming`                  | ブロック単位のストリーミング | `true` |
| `channels.feishu.typingIndicator`                 | 入力中リアクションを送信する | `true` |
| `channels.feishu.resolveSenderNames`              | 送信者表示名を解決する | `true` |

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
- ⚠️ リッチテキスト（post スタイルの書式設定。Feishu/Lark の完全な作成機能には対応していません）

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ メディア返信は、スレッドメッセージへの返信時にもスレッド認識を維持します

---

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化策
