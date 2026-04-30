---
read_when:
    - Yuanbao ボットを接続したい場合
    - Yuanbao チャネルを設定しています
summary: Yuanbao ボットの概要、機能、設定
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T05:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao は Tencent の AI アシスタントプラットフォームです。OpenClaw チャネル Plugin は Yuanbao ボットを WebSocket 経由で OpenClaw に接続し、ダイレクトメッセージやグループチャットを通じてユーザーとやり取りできるようにします。

**ステータス:** ボット DM とグループチャットで本番利用可能。WebSocket が唯一サポートされる接続モードです。

---

## クイックスタート

> **OpenClaw 2026.4.10 以上が必要です。** 確認するには `openclaw --version` を実行してください。`openclaw update` でアップグレードできます。

<Steps>
  <Step title="認証情報を使って Yuanbao チャネルを追加する">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` の値はコロン区切りの `appKey:appSecret` 形式を使用します。これらは Yuanbao アプリでアプリケーション設定内にロボットを作成することで取得できます。
  </Step>

  <Step title="セットアップ完了後、変更を適用するために Gateway を再起動する">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 対話型セットアップ（代替）

対話型ウィザードも使用できます。

```bash
openclaw channels login --channel yuanbao
```

プロンプトに従って App ID と App Secret を入力します。

---

## アクセス制御

### ダイレクトメッセージ

ボットに DM できるユーザーを制御するには `dmPolicy` を設定します。

- `"pairing"` — 不明なユーザーはペアリングコードを受け取り、CLI で承認します
- `"allowlist"` — `allowFrom` に listed されているユーザーのみチャットできます
- `"open"` — すべてのユーザーを許可します（デフォルト）
- `"disabled"` — すべての DM を無効にします

**ペアリングリクエストを承認する:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### グループチャット

**メンション要件**（`channels.yuanbao.requireMention`）:

- `true` — @mention を必須にします（デフォルト）
- `false` — @mention なしで応答します

グループチャットでボットのメッセージに返信すると、暗黙のメンションとして扱われます。

---

## 設定例

### オープン DM ポリシーの基本セットアップ

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

### DM を特定のユーザーに制限する

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

### グループで @mention 要件を無効にする

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### 送信メッセージ配信を最適化する

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### merge-text 戦略を調整する

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## よく使うコマンド

| コマンド   | 説明                         |
| ---------- | ---------------------------- |
| `/help`    | 利用可能なコマンドを表示します |
| `/status`  | ボットのステータスを表示します |
| `/new`     | 新しいセッションを開始します   |
| `/stop`    | 現在の実行を停止します         |
| `/restart` | OpenClaw を再起動します        |
| `/compact` | セッションコンテキストを圧縮します |

> Yuanbao はネイティブのスラッシュコマンドメニューをサポートしています。コマンドは Gateway 起動時にプラットフォームへ自動的に同期されます。

---

## トラブルシューティング

### ボットがグループチャットで応答しない

1. ボットがグループに追加されていることを確認します
2. ボットを @mention していることを確認します（デフォルトで必須）
3. ログを確認します: `openclaw logs --follow`

### ボットがメッセージを受信しない

1. ボットが Yuanbao アプリで作成され、承認されていることを確認します
2. `appKey` と `appSecret` が正しく設定されていることを確認します
3. Gateway が実行中であることを確認します: `openclaw gateway status`
4. ログを確認します: `openclaw logs --follow`

### ボットが空の返信またはフォールバック返信を送信する

1. AI モデルが有効な内容を返しているか確認します
2. デフォルトのフォールバック返信は次のとおりです: "暂时无法解答，你可以换个问题问问我哦"
3. `channels.yuanbao.fallbackReply` でカスタマイズします

### App Secret が漏えいした

1. YuanBao APP で App Secret をリセットします
2. 設定内の値を更新します
3. Gateway を再起動します: `openclaw gateway restart`

---

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

- `maxChars` — 1 件のメッセージの最大文字数（デフォルト: `3000` 文字）
- `mediaMaxMb` — メディアのアップロード/ダウンロード制限（デフォルト: `20` MB）
- `overflowPolicy` — メッセージが制限を超えた場合の動作: `"split"`（デフォルト）または `"stop"`

### ストリーミング

Yuanbao はブロックレベルのストリーミング出力をサポートしています。有効にすると、ボットは生成中のテキストをチャンク単位で送信します。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

完全な返信を 1 件のメッセージで送信するには `disableBlockStreaming: true` を設定します。

### グループチャット履歴コンテキスト

グループチャットで AI コンテキストに含める履歴メッセージ数を制御します。

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### 返信先モード

グループチャットで返信時にボットがメッセージを引用する方法を制御します。

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| 値        | 動作                                                   |
| --------- | ------------------------------------------------------ |
| `"off"`   | 引用返信しません                                       |
| `"first"` | 受信メッセージごとに最初の返信のみ引用します（デフォルト） |
| `"all"`   | すべての返信を引用します                               |

### Markdown ヒント注入

デフォルトでは、AI モデルが返信全体を markdown コードブロックで囲まないように、ボットがシステムプロンプトへ指示を注入します。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### デバッグモード

特定のボット ID に対してサニタイズされていないログ出力を有効にします。

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### マルチエージェントルーティング

`bindings` を使用して Yuanbao の DM またはグループを別々のエージェントへルーティングします。

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

ルーティングフィールド:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"`（DM）または `"group"`（グループチャット）
- `match.peer.id`: ユーザー ID またはグループコード

---

## 設定リファレンス

完全な設定: [Gateway 設定](/ja-JP/gateway/configuration)

| 設定                                       | 説明                                                | デフォルト                             |
| ------------------------------------------ | --------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | チャネルを有効/無効にします                         | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 送信ルーティング用のデフォルトアカウント             | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（署名とチケット生成に使用）                 | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（署名に使用）                            | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | 事前署名済みトークン（自動チケット署名をスキップ）   | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | アカウント表示名                                    | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 特定のアカウントを有効/無効にします                  | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM ポリシー                                         | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM allowlist（ユーザー ID リスト）                  | —                                      |
| `channels.yuanbao.requireMention`          | グループで @mention を必須にします                   | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 長いメッセージの処理（`split` または `stop`）        | `split`                                |
| `channels.yuanbao.replyToMode`             | グループの返信先戦略（`off`、`first`、`all`）        | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 送信戦略（`merge-text` または `immediate`）          | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: 送信をトリガーする最小文字数             | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: メッセージあたりの最大文字数             | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: 自動フラッシュ前のアイドルタイムアウト（ms） | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | メディアサイズ制限（MB）                            | `20`                                   |
| `channels.yuanbao.historyLimit`            | グループチャット履歴コンテキストのエントリ数         | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | ブロックレベルのストリーミング出力を無効にします     | `false`                                |
| `channels.yuanbao.fallbackReply`           | AI が内容を返さない場合のフォールバック返信          | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | markdown の囲み防止指示を注入します                 | `true`                                 |
| `channels.yuanbao.debugBotIds`             | デバッグ許可リストのボット ID（サニタイズなしログ）  | `[]`                                   |

---

## サポートされるメッセージタイプ

### 受信

- ✅ テキスト
- ✅ 画像
- ✅ ファイル
- ✅ 音声 / ボイス
- ✅ 動画
- ✅ ステッカー / カスタム絵文字
- ✅ カスタム要素（リンクカードなど）

### 送信

- ✅ テキスト（markdown サポートあり）
- ✅ 画像
- ✅ ファイル
- ✅ 音声
- ✅ 動画
- ✅ ステッカー

### スレッドと返信

- ✅ 引用返信（`replyToMode` で設定可能）
- ❌ スレッド返信（プラットフォームでサポートされていません）

---

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
