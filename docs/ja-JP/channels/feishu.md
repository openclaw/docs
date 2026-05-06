---
read_when:
    - Feishu/Lark ボットを接続したい
    - Feishu チャネルを設定しています
summary: Feishuボットの概要、機能、設定
title: Feishu
x-i18n:
    generated_at: "2026-05-06T04:57:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea5bba9a15140fcd67a5095806086d167d2252a262438367ce1ed9e818dc97a4
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark は、チームがチャット、ドキュメント共有、カレンダー管理を行い、共同で仕事を進められるオールインワンのコラボレーションプラットフォームです。

**状態:** ボットの DM とグループチャット向けに本番対応済み。WebSocket がデフォルトモードで、Webhook モードは任意です。

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
  Feishu/Lark モバイルアプリで QR コードをスキャンすると、Feishu/Lark ボットが自動的に作成されます。
  </Step>
  
  <Step title="設定が完了したら、変更を適用するために Gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## アクセス制御

### ダイレクトメッセージ

ボットに DM できるユーザーを制御するには `dmPolicy` を設定します。

- `"pairing"` - 不明なユーザーにはペアリングコードが送信されます。CLI で承認します
- `"allowlist"` - `allowFrom` に記載されたユーザーのみチャットできます（デフォルト: ボット所有者のみ）
- `"open"` - `allowFrom` に `"*"` が含まれる場合のみ公開 DM を許可します。制限付きエントリがある場合は、一致するユーザーのみチャットできます
- `"disabled"` - すべての DM を無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### グループチャット

**グループポリシー**（`channels.feishu.groupPolicy`）:

| 値            | 動作                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `"open"`      | グループ内のすべてのメッセージに応答します                                                             |
| `"allowlist"` | `groupAllowFrom` 内、または `groups.<chat_id>` 配下で明示的に設定されたグループにのみ応答します |
| `"disabled"`  | すべてのグループメッセージを無効にします。明示的な `groups.<chat_id>` エントリでもこれは上書きされません |

デフォルト: `allowlist`

**メンション要件**（`channels.feishu.requireMention`）:

- `true` - @mention を必須にします（デフォルト）
- `false` - @mention なしで応答します
- グループごとの上書き: `channels.feishu.groups.<chat_id>.requireMention`
- ブロードキャスト専用の `@all` と `@_all` はボットへのメンションとして扱われません。`@all` とボットへの直接メンションの両方を含むメッセージは、引き続きボットメンションとして扱われます。

---

## グループ設定の例

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

`allowlist` モードでは、明示的な `groups.<chat_id>` エントリを追加してグループを許可することもできます。明示的なエントリは `groupPolicy: "disabled"` を上書きしません。`groups.*` 配下のワイルドカードデフォルトは一致するグループを設定しますが、それだけでグループを許可することはありません。

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

### グループ ID（`chat_id`、形式: `oc_xxx`）

Feishu/Lark でグループを開き、右上のメニューアイコンをクリックして **設定** に移動します。グループ ID（`chat_id`）は設定ページに表示されます。

![グループ ID を取得](/images/feishu-get-group-id.png)

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

## 一般的なコマンド

| コマンド  | 説明                          |
| --------- | ----------------------------- |
| `/status` | ボットの状態を表示します      |
| `/reset`  | 現在のセッションをリセットします |
| `/model`  | AI モデルを表示または切り替えます |

<Note>
Feishu/Lark はネイティブのスラッシュコマンドメニューをサポートしていないため、これらはプレーンテキストメッセージとして送信してください。
</Note>

---

## トラブルシューティング

### ボットがグループチャットで応答しない

1. ボットがグループに追加されていることを確認します
2. ボットを @mention していることを確認します（デフォルトで必須）
3. `groupPolicy` が `"disabled"` でないことを確認します
4. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. Feishu Open Platform / Lark Developer でボットが公開および承認されていることを確認します
2. イベントサブスクリプションに `im.message.receive_v1` が含まれていることを確認します
3. **持続接続**（WebSocket）が選択されていることを確認します
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
`accounts.<id>.tts` は `messages.tts` と同じ形状を使用し、グローバル TTS 設定にディープマージされるため、複数ボットの Feishu 構成では、共有プロバイダー認証情報をグローバルに保持しつつ、アカウントごとに音声、モデル、ペルソナ、自動モードのみを上書きできます。

### メッセージ制限

- `textChunkLimit` - 送信テキストチャンクサイズ（デフォルト: `2000` 文字）
- `mediaMaxMb` - メディアのアップロード/ダウンロード制限（デフォルト: `30` MB）

### ストリーミング

Feishu/Lark はインタラクティブカードによるストリーミング返信をサポートしています。有効にすると、ボットはテキスト生成中にカードをリアルタイムで更新します。

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

完全な返信を 1 件のメッセージで送信するには `streaming: false` を設定します。`blockStreaming` はデフォルトでオフです。完了済みのアシスタントブロックを最終返信の前にフラッシュしたい場合にのみ有効にしてください。

### クォータ最適化

2 つの任意フラグで Feishu/Lark API 呼び出しの数を減らします。

- `typingIndicator`（デフォルト `true`）: 入力中リアクション呼び出しをスキップするには `false` に設定します
- `resolveSenderNames`（デフォルト `true`）: 送信者プロフィール検索をスキップするには `false` に設定します

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

#### チャットから ACP を起動する

Feishu/Lark の DM またはスレッド内で:

```text
/acp spawn codex --thread here
```

`--thread here` は DM と Feishu/Lark スレッドメッセージで機能します。バインドされた会話内の後続メッセージは、その ACP セッションに直接ルーティングされます。

### マルチエージェントルーティング

Feishu/Lark の DM またはグループを別のエージェントにルーティングするには `bindings` を使用します。

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

検索のヒントについては [グループ/ユーザー ID を取得する](#get-groupuser-ids) を参照してください。

---

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定                                              | 説明                                                                             | デフォルト       |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | チャネルを有効化/無効化                                                         | `true`           |
| `channels.feishu.domain`                          | API ドメイン（`feishu` または `lark`）                                           | `feishu`         |
| `channels.feishu.connectionMode`                  | イベント転送（`websocket` または `webhook`）                                     | `websocket`      |
| `channels.feishu.defaultAccount`                  | 送信ルーティング用のデフォルトアカウント                                        | `default`        |
| `channels.feishu.verificationToken`               | Webhook モードで必須                                                             | -                |
| `channels.feishu.encryptKey`                      | Webhook モードで必須                                                             | -                |
| `channels.feishu.webhookPath`                     | Webhook ルートパス                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook バインドホスト                                                           | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook バインドポート                                                           | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | アプリ ID                                                                        | -                |
| `channels.feishu.accounts.<id>.appSecret`         | アプリシークレット                                                               | -                |
| `channels.feishu.accounts.<id>.domain`            | アカウントごとのドメイン上書き                                                   | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | アカウントごとの TTS 上書き                                                      | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM ポリシー                                                                      | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM 許可リスト（open_id リスト）                                                  | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | グループポリシー                                                                 | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | グループ許可リスト                                                               | -                |
| `channels.feishu.requireMention`                  | グループで @mention を必須にする                                                 | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | グループごとの @mention 上書き。明示的な ID は許可リストモードでもグループを許可 | 継承             |
| `channels.feishu.groups.<chat_id>.enabled`        | 特定のグループを有効化/無効化                                                    | `true`           |
| `channels.feishu.textChunkLimit`                  | メッセージチャンクサイズ                                                         | `2000`           |
| `channels.feishu.mediaMaxMb`                      | メディアサイズ上限                                                               | `30`             |
| `channels.feishu.streaming`                       | ストリーミングカード出力                                                         | `true`           |
| `channels.feishu.blockStreaming`                  | 完了済みブロック返信のストリーミング                                             | `false`          |
| `channels.feishu.typingIndicator`                 | 入力中リアクションを送信                                                         | `true`           |
| `channels.feishu.resolveSenderNames`              | 送信者の表示名を解決                                                             | `true`           |

---

## 対応しているメッセージ種別

### 受信

- ✅ テキスト
- ✅ リッチテキスト（投稿）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ ステッカー

受信した Feishu/Lark の音声メッセージは、生の `file_key` JSON ではなく、メディアプレースホルダーとして正規化されます。`tools.media.audio` が設定されている場合、OpenClaw はボイスメモリソースをダウンロードし、エージェントのターンの前に共有の音声文字起こしを実行するため、エージェントは発話の文字起こしを受け取ります。Feishu が音声ペイロードに文字起こしテキストを直接含めている場合、そのテキストが別の ASR 呼び出しなしで使用されます。音声文字起こしプロバイダーがない場合でも、エージェントは生の Feishu リソースペイロードではなく、`<media:audio>` プレースホルダーと保存された添付ファイルを受け取ります。

### 送信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画/メディア
- ✅ インタラクティブカード（ストリーミング更新を含む）
- ⚠️ リッチテキスト（投稿スタイルの書式設定。Feishu/Lark の完全なオーサリング機能には対応していません）

ネイティブの Feishu/Lark 音声バブルは Feishu の `audio` メッセージ種別を使用し、Ogg/Opus アップロードメディア（`file_type: "opus"`）が必要です。既存の `.opus` および `.ogg` メディアは、ネイティブ音声として直接送信されます。MP3/WAV/M4A とその他の音声と思われる形式は、返信が音声配信を要求する場合（`audioAsVoice` / メッセージツールの `asVoice`、TTS ボイスメモ返信を含む）にのみ、`ffmpeg` で 48kHz Ogg/Opus にトランスコードされます。通常の MP3 添付ファイルは通常のファイルのままです。`ffmpeg` がない場合や変換に失敗した場合、OpenClaw はファイル添付にフォールバックし、その理由をログに記録します。

### スレッドと返信

- ✅ インライン返信
- ✅ スレッド返信
- ✅ スレッドメッセージに返信する場合、メディア返信はスレッド対応を維持

`groupSessionScope: "group_topic"` と `"group_topic_sender"` では、ネイティブの Feishu/Lark トピックグループはイベントの `thread_id`（`omt_*`）を正規のトピックセッションキーとして使用します。OpenClaw がスレッドに変換する通常のグループ返信は、引き続き返信ルートメッセージ ID（`om_*`）を使用するため、最初のターンと後続のターンは同じセッションに留まります。

---

## 関連

- [チャネル概要](/ja-JP/channels) - 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
