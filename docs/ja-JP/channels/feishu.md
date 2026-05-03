---
read_when:
    - Feishu/Lark ボットを接続したい
    - Feishu チャンネルを設定しています
summary: Feishu ボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-05-03T21:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark は、チームがチャット、ドキュメント共有、カレンダー管理、共同作業をまとめて行えるオールインワンのコラボレーションプラットフォームです。

**ステータス:** ボットの DM とグループチャットで本番利用可能です。WebSocket がデフォルトモードで、Webhook モードは任意です。

---

## クイックスタート

<Note>
OpenClaw 2026.4.25 以上が必要です。確認するには `openclaw --version` を実行します。アップグレードは `openclaw update` で行います。
</Note>

<Steps>
  <Step title="チャンネル設定ウィザードを実行する">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/Lark モバイルアプリで QR コードをスキャンし、Feishu/Lark ボットを自動的に作成します。
  </Step>
  
  <Step title="設定が完了したら、変更を適用するために gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## アクセス制御

### ダイレクトメッセージ

ボットに DM できるユーザーを制御するには、`dmPolicy` を設定します。

- `"pairing"` — 不明なユーザーはペアリングコードを受け取り、CLI で承認します
- `"allowlist"` — `allowFrom` に記載されたユーザーのみがチャットできます（デフォルト: ボット所有者のみ）
- `"open"` — `allowFrom` に `"*"` が含まれる場合のみ公開 DM を許可します。制限付きの項目では、一致するユーザーのみがチャットできます
- `"disabled"` — すべての DM を無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー**（`channels.feishu.groupPolicy`）:

| 値            | 動作                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します                                                        |
| `"allowlist"` | `groupAllowFrom` 内のグループ、または `groups.<chat_id>` で明示的に設定されたグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします。明示的な `groups.<chat_id>` 項目でもこれは上書きされません |

デフォルト: `allowlist`

**メンション要件**（`channels.feishu.requireMention`）:

- `true` — @mention を必須にします（デフォルト）
- `false` — @mention なしで応答します
- グループごとの上書き: `channels.feishu.groups.<chat_id>.requireMention`
- ブロードキャスト専用の `@all` と `@_all` はボットへのメンションとして扱われません。`@all` とボットの両方を直接メンションするメッセージは、引き続きボットへのメンションとして扱われます。

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

### すべてのグループを許可しつつ、@mention は引き続き必須にする

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

`allowlist` モードでは、明示的な `groups.<chat_id>` 項目を追加してグループを許可することもできます。明示的な項目は `groupPolicy: "disabled"` を上書きしません。`groups.*` 配下のワイルドカードデフォルトは一致するグループを設定しますが、それだけでグループを許可することはありません。

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

## グループ ID / ユーザー ID を取得する

### グループ ID（`chat_id`、形式: `oc_xxx`）

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **Settings** に移動します。グループ ID（`chat_id`）は設定ページに表示されます。

![グループ ID を取得する](/images/feishu-get-group-id.png)

### ユーザー ID（`open_id`、形式: `ou_xxx`）

Gateway を起動し、ボットに DM を送信してからログを確認します。

```bash
openclaw logs --follow
```

ログ出力で `open_id` を探します。保留中のペアリングリクエストを確認することもできます。

```bash
openclaw pairing list feishu
```

---

## よく使うコマンド

| コマンド  | 説明                    |
| --------- | ----------------------- |
| `/status` | ボットのステータスを表示します |
| `/reset`  | 現在のセッションをリセットします |
| `/model`  | AI モデルを表示または切り替えます |

<Note>
Feishu/Lark はネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。
</Note>

---

## トラブルシューティング

### ボットがグループチャットで応答しない

1. ボットがグループに追加されていることを確認します
2. ボットに @mention していることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` でないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットが Feishu Open Platform / Lark Developer で公開および承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **persistent connection**（WebSocket）が選択されていることを確認します
4. 必要な権限スコープがすべて付与されていることを確認します
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

`defaultAccount` は、送信 API が `accountId` を指定しない場合にどのアカウントを使用するかを制御します。
`accounts.<id>.tts` は `messages.tts` と同じ形状を使用し、グローバル TTS 設定にディープマージされるため、複数ボットの Feishu 設定では、共有プロバイダー認証情報をグローバルに保持しながら、アカウントごとに voice、model、persona、auto mode のみを上書きできます。

### メッセージ制限

- `textChunkLimit` — 送信テキストチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` — メディアのアップロード/ダウンロード制限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark はインタラクティブカード経由のストリーミング返信をサポートしています。有効にすると、ボットはテキスト生成中にカードをリアルタイムで更新します。

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

完全な返信を 1 つのメッセージで送信するには、`streaming: false` を設定します。`blockStreaming` はデフォルトでオフです。最終返信の前に完了済みのアシスタントブロックをフラッシュしたい場合にのみ有効にしてください。

### クォータ最適化

2 つの任意フラグで Feishu/Lark API 呼び出し数を減らします。

- `typingIndicator`（デフォルト `true`）: タイピングリアクション呼び出しをスキップするには `false` を設定します
- `resolveSenderNames`（デフォルト `true`）: 送信者プロファイルの検索をスキップするには `false` を設定します

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

Feishu/Lark は DM とグループスレッドメッセージで ACP をサポートしています。Feishu/Lark の ACP はテキストコマンド駆動です。ネイティブのスラッシュコマンドメニューはないため、会話内で `/acp ...` メッセージを直接使用します。

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

`--thread here` は DM と Feishu/Lark のスレッドメッセージで機能します。バインドされた会話内の後続メッセージは、その ACP セッションに直接ルーティングされます。

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

ルーティングフィールド:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"`（DM）または `"group"`（グループチャット）
- `match.peer.id`: ユーザー Open ID（`ou_xxx`）またはグループ ID（`oc_xxx`）

検索のヒントについては、[グループ ID / ユーザー ID を取得する](#get-groupuser-ids)を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定                                              | 説明                                                                             | デフォルト       |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | チャンネルを有効化/無効化                                                       | `true`           |
| `channels.feishu.domain`                          | APIドメイン（`feishu` または `lark`）                                            | `feishu`         |
| `channels.feishu.connectionMode`                  | イベント転送（`websocket` または `webhook`）                                     | `websocket`      |
| `channels.feishu.defaultAccount`                  | アウトバウンドルーティングのデフォルトアカウント                                 | `default`        |
| `channels.feishu.verificationToken`               | Webhookモードで必須                                                              | —                |
| `channels.feishu.encryptKey`                      | Webhookモードで必須                                                              | —                |
| `channels.feishu.webhookPath`                     | Webhookルートパス                                                                | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhookバインドホスト                                                            | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhookバインドポート                                                            | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | アプリID                                                                         | —                |
| `channels.feishu.accounts.<id>.appSecret`         | アプリシークレット                                                               | —                |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのドメイン上書き                                                   | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | アカウントごとのTTS上書き                                                        | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DMポリシー                                                                       | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM許可リスト（open_idリスト）                                                    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | グループポリシー                                                                 | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト                                                               | —                |
| `channels.feishu.requireMention`                  | グループで@メンションを必須にする                                                | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの@メンション上書き。明示的なIDは許可リストモードでもグループを許可します | 継承             |
| `channels.feishu.groups.<chat_id>.enabled`        | 特定のグループを有効化/無効化                                                    | `true`           |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ                                                         | `2000`           |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ上限                                                               | `30`             |
| `channels.feishu.streaming`                       | ストリーミングカード出力                                                         | `true`           |
| `channels.feishu.blockStreaming`                  | 完了済みブロックの返信ストリーミング                                             | `false`          |
| `channels.feishu.typingIndicator`                 | 入力中リアクションを送信                                                         | `true`           |
| `channels.feishu.resolveSenderNames`              | 送信者表示名を解決                                                               | `true`           |

---

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ リッチテキスト（post）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ スタンプ

受信したFeishu/Larkの音声メッセージは、生の`file_key` JSONではなくメディアプレースホルダーとして正規化されます。`tools.media.audio`が構成されている場合、OpenClawは音声メモリソースをダウンロードし、エージェントターンの前に共有音声文字起こしを実行するため、エージェントは発話の文字起こしを受け取ります。Feishuが音声ペイロードに文字起こしテキストを直接含めている場合、そのテキストが追加のASR呼び出しなしで使用されます。音声文字起こしプロバイダーがない場合でも、エージェントは生のFeishuリソースペイロードではなく、`<media:audio>`プレースホルダーと保存済み添付ファイルを受け取ります。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（post形式の書式。Feishu/Larkの完全な作成機能には対応しません）

ネイティブのFeishu/Lark音声バブルはFeishuの`audio`メッセージタイプを使用し、Ogg/Opusアップロードメディア（`file_type: "opus"`）が必要です。既存の`.opus`および`.ogg`メディアは、ネイティブ音声として直接送信されます。MP3/WAV/M4Aおよびその他の音声らしい形式は、返信が音声配信を要求する場合（`audioAsVoice` / メッセージツールの`asVoice`、TTS音声メモ返信を含む）のみ、`ffmpeg`で48kHz Ogg/Opusにトランスコードされます。通常のMP3添付ファイルは通常のファイルのままです。`ffmpeg`がない場合や変換に失敗した場合、OpenClawはファイル添付にフォールバックし、その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージに返信する場合、メディア返信はスレッドを認識したままになります

`groupSessionScope: "group_topic"`および`"group_topic_sender"`では、ネイティブのFeishu/Larkトピックグループはイベントの`thread_id`（`omt_*`）を正規のトピックセッションキーとして使用します。OpenClawがスレッドに変換する通常のグループ返信では、返信ルートメッセージID（`om_*`）を引き続き使用するため、最初のターンと後続ターンは同じセッションに留まります。

---

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
