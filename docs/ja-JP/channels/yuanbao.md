---
read_when:
    - Yuanbao ボットを接続したい
    - Yuanbao チャンネルを設定しています
summary: Yuanbaoボットの概要、機能、設定
title: Yuanbao
x-i18n:
    generated_at: "2026-07-05T11:07:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao は Tencent の AI アシスタントプラットフォームです。コミュニティがメンテナンスする `openclaw-plugin-yuanbao` Plugin は、Yuanbao ボットを WebSocket 経由で OpenClaw に接続し、ダイレクトメッセージとグループチャットに対応します。

**ステータス:** ボットの DM とグループチャットで本番利用可能です。WebSocket が唯一サポートされる接続モードです。この Plugin は Tencent Yuanbao チームが外部カタログエントリとしてメンテナンスしており、OpenClaw コアによるメンテナンスではありません。以下の設定/動作の詳細（インストールと汎用 CLI サーフェスを除く）は Plugin 独自のドキュメントに基づくもので、OpenClaw コアソースに対して検証されていません。

## クイックスタート

OpenClaw 2026.4.10 以降が必要です。`openclaw --version` で確認し、`openclaw update` でアップグレードします。

<Steps>
  <Step title="認証情報を使って Yuanbao チャネルを追加する">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` はコロン区切りの `appKey:appSecret` を使用します。アプリケーション設定でボットを作成し、Yuanbao アプリからこれらを取得します。
  </Step>

  <Step title="変更を適用するために Gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 対話形式のセットアップ（代替）

```bash
openclaw channels login --channel yuanbao
```

プロンプトに従って App ID と App Secret を入力します。

## アクセス制御

### ダイレクトメッセージ

`channels.yuanbao.dm.policy`:

| 値               | 動作                                                   |
| ---------------- | ------------------------------------------------------ |
| `open`（デフォルト） | すべてのユーザーを許可                                 |
| `pairing`        | 不明なユーザーにはペアリングコードを返し、CLI で承認する |
| `allowlist`      | `allowFrom` に含まれるユーザーだけがチャット可能       |
| `disabled`       | すべての DM を無効化                                  |

ペアリングリクエストを承認します。

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### グループチャット

`channels.yuanbao.requireMention`（デフォルト `true`）: グループ内でボットが応答する前に @メンションを必須にします。ボット自身のメッセージへの返信は暗黙のメンションとして扱われます。

## 設定例

基本セットアップ、オープンな DM ポリシー:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

DM を特定のユーザーに制限する:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

グループで @メンション要件を無効化する:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

送信配信のチューニング:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // この文字数になるまでバッファする
      maxChars: 3000, // この上限を超えると強制的に分割する
      idleMs: 5000, // アイドルタイムアウト後に自動フラッシュする（ms）
    },
  },
}
```

各チャンクをバッファせず送信するには、`outboundQueueStrategy: "immediate"` を設定します。

## よく使うコマンド

| コマンド   | 説明                         |
| ---------- | ---------------------------- |
| `/help`    | 利用可能なコマンドを表示     |
| `/status`  | ボットのステータスを表示     |
| `/new`     | 新しいセッションを開始       |
| `/stop`    | 現在の実行を停止             |
| `/restart` | OpenClaw を再起動            |
| `/compact` | セッションコンテキストを圧縮 |

Yuanbao はネイティブのスラッシュコマンドメニューをサポートします。Gateway の起動時に、コマンドはプラットフォームへ自動的に同期されます。

## トラブルシューティング

**ボットがグループチャットで応答しない場合:**

1. ボットがグループに追加されていることを確認します
2. ボットを @メンションしていることを確認します（デフォルトで必須）
3. ログを確認します: `openclaw logs --follow`

**ボットがメッセージを受信しない場合:**

1. Yuanbao アプリでボットが作成され、承認されていることを確認します
2. `appKey` と `appSecret` が正しく設定されていることを確認します
3. Gateway が実行中であることを確認します: `openclaw gateway status`
4. ログを確認します: `openclaw logs --follow`

**ボットが空の返信またはフォールバック返信を送信する場合:**

1. AI モデルが有効なコンテンツを返しているか確認します
2. デフォルトのフォールバック返信: "暂时无法解答，你可以换个问题问问我哦"
3. `channels.yuanbao.fallbackReply` でカスタマイズします

**App Secret が漏えいした場合:**

1. Yuanbao アプリで App Secret をリセットします
2. 設定内の値を更新します
3. Gateway を再起動します: `openclaw gateway restart`

## 高度な設定

### 複数アカウント

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` は、送信 API が `accountId` を指定しない場合に使用されるアカウントを制御します。

### メッセージ制限

- `maxChars`: 単一メッセージの最大文字数（デフォルト `3000`）
- `mediaMaxMb`: メディアのアップロード/ダウンロード制限（デフォルト `20` MB）
- `overflowPolicy`: メッセージが制限を超えた場合の動作、`"split"`（デフォルト）または `"stop"`

### ストリーミング

Yuanbao はブロックレベルのストリーミング出力をサポートします。ボットは生成中にテキストをチャンク単位で送信します。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // ブロックストリーミングが有効（デフォルト）
    },
  },
}
```

完全な返信を 1 件のメッセージで送信するには、`disableBlockStreaming: true` を設定します。

### グループチャット履歴コンテキスト

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // デフォルト: 100、無効化するには 0 を設定
    },
  },
}
```

グループチャットの AI コンテキストに含める過去メッセージ数を制御します。

### Reply-to モード

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all"（デフォルト: "first"）
    },
  },
}
```

| 値      | 動作                                                       |
| ------- | ---------------------------------------------------------- |
| `off`   | 引用返信しない                                             |
| `first` | 受信メッセージごとに最初の返信だけを引用する（デフォルト） |
| `all`   | すべての返信を引用する                                     |

### Markdown ヒント注入

デフォルトでは、ボットはモデルが返信全体を Markdown コードブロックで囲まないようにする system-prompt 指示を注入します。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // デフォルト: true
    },
  },
}
```

### デバッグモード

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

一覧に含まれるボット ID に対して、サニタイズされていないログ出力を有効にします。

### マルチエージェントルーティング

Yuanbao の DM またはグループを別々のエージェントにルーティングするには、`bindings` を使用します。

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"`（DM）または `"group"`（グループチャット）
- `match.peer.id`: ユーザー ID またはグループコード

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定                                       | 説明                                                 | デフォルト                             |
| ------------------------------------------ | ---------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | チャネルを有効化/無効化                              | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 送信ルーティング用のデフォルトアカウント             | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（署名 + チケット生成）                       | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（署名）                                   | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 事前署名済みトークン（自動チケット署名をスキップ）   | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | アカウント表示名                                     | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 特定のアカウントを有効化/無効化                      | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM ポリシー                                          | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM 許可リスト（ユーザー ID リスト）                  | -                                      |
| `channels.yuanbao.requireMention`          | グループで @メンションを必須にする                   | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 長いメッセージの処理（`split` または `stop`）        | `split`                                |
| `channels.yuanbao.replyToMode`             | グループの reply-to 戦略（`off`、`first`、`all`）    | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 送信戦略（`merge-text` または `immediate`）          | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: 送信をトリガーする最小文字数             | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: メッセージあたりの最大文字数             | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: 自動フラッシュ前のアイドルタイムアウト（ms） | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | メディアサイズ制限（MB）                             | `20`                                   |
| `channels.yuanbao.historyLimit`            | グループチャット履歴コンテキストのエントリ数         | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | ブロックレベルのストリーミング出力を無効化           | `false`                                |
| `channels.yuanbao.fallbackReply`           | モデルがコンテンツを返さない場合のフォールバック返信 | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Markdown の折り返し防止指示を注入                    | `true`                                 |
| `channels.yuanbao.debugBotIds`             | デバッグ許可リストのボット ID（サニタイズなしログ）  | `[]`                                   |

## サポートされるメッセージ種別

**受信:** テキスト、画像、ファイル、音声/ボイス、動画、スタンプ/カスタム絵文字、カスタム要素（リンクカード）。

**送信:** テキスト（Markdown）、画像、ファイル、音声、動画、スタンプ。

**スレッドと返信:** 引用返信（`replyToMode` で設定可能）。スレッド返信はプラットフォームでサポートされていません。

## 関連

- [チャネル概要](/ja-JP/channels) - サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
