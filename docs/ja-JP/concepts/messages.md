---
read_when:
    - 受信メッセージがどのように返信になるかの説明
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響の文書化
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-25T18:16:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

このページでは、OpenClawが受信メッセージ、セッション、キューイング、
ストリーミング、推論の可視性をどのように扱うかをまとめて説明します。

## メッセージフロー（概要）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主な調整項目は設定にあります。

- プレフィックス、キューイング、グループ動作用の `messages.*`。
- ブロックストリーミングとチャンク化のデフォルト用の `agents.defaults.*`。
- 上限やストリーミング切り替え用のチャネル上書き（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 受信重複排除

チャネルは再接続後に同じメッセージを再配信することがあります。OpenClawは
channel/account/peer/session/message id をキーとする短期間保持のキャッシュを維持し、重複配信が別のagent実行を引き起こさないようにしています。

## 受信デバウンス

**同じ送信者**から連続して急速に送られたメッセージは、`messages.inbound` によって
1つのagentターンにまとめることができます。デバウンスはチャネルごと + 会話ごとにスコープされ、
返信のスレッド/IDには最新のメッセージが使われます。

設定（グローバルデフォルト + チャネルごとの上書き）:

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

注意:

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付は即座にフラッシュされます。
- 制御コマンドはデバウンスをバイパスするため、単独のまま維持されます。ただし、チャネルが同一送信者DMの結合を明示的に有効にしている場合は例外です（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）。この場合、DMコマンドはデバウンスウィンドウ内で待機し、分割送信されたペイロードが同じagentターンに加われるようになります。

## セッションとデバイス

セッションはクライアントではなくGatewayが所有します。

- ダイレクトチャットはagentのメインセッションキーに集約されます。
- グループ/チャネルは独自のセッションキーを持ちます。
- セッションストアとトランスクリプトはGatewayホスト上にあります。

複数のデバイス/チャネルが同じセッションにマッピングされることはありますが、履歴はすべてのクライアントに完全には同期されません。推奨事項: コンテキストの分岐を避けるため、長い会話では1つの主要デバイスを使用してください。Control UIとTUIは常にGatewayを基盤とするセッショントランスクリプトを表示するため、これらが信頼できる唯一の情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## 受信ボディと履歴コンテキスト

OpenClawは**プロンプトボディ**と**コマンドボディ**を分離しています。

- `Body`: agentに送られるプロンプトテキスト。これにはチャネルエンベロープと
  任意の履歴ラッパーが含まれる場合があります。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` の従来の別名（互換性のため維持）。

チャネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャネル/ルーム）では、**現在のメッセージ本文**の先頭に送信者ラベルが付加されます（履歴エントリに使われるものと同じ形式）。これにより、リアルタイムのメッセージとキュー済み/履歴メッセージがagentプロンプト内で一貫したものになります。

履歴バッファは**保留中のみ**です。つまり、実行を引き起こさなかったグループメッセージ（たとえば、メンションゲートされたメッセージ）を含み、セッショントランスクリプトにすでにあるメッセージは**除外**されます。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま保たれます。履歴をラップするチャネルは、`CommandBody`（または `RawBody`）を元のメッセージテキストに設定し、`Body` は結合済みプロンプトとして維持する必要があります。履歴バッファは `messages.groupChat.historyLimit`（グローバルデフォルト）および `channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のようなチャネルごとの上書きで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れたり、現在の実行に誘導したり、フォローアップターン用に収集したりできます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- モード: `interrupt`、`steer`、`followup`、`collect`、およびバックログ派生モード。

詳細: [キューイング](/ja-JP/concepts/queue)。

## ストリーミング、チャンク化、バッチ処理

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分返信を送信します。
チャンク化はチャネルのテキスト上限を尊重し、フェンス付きコードの分割を避けます。

主な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトは off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ処理）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい待機）
- チャネル上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram以外のチャネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClawはモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` で可視性を制御します。
- 推論内容は、モデルが生成した場合、トークン使用量に引き続きカウントされます。
- Telegramは下書きバブルへの推論ストリームをサポートしています。

詳細: [Thinking + reasoning directives](/ja-JP/tools/thinking) および [トークン使用量](/ja-JP/reference/token-use)。

## プレフィックス、スレッド、返信

送信メッセージの書式は `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp受信プレフィックス）
- `replyToMode` とチャネルごとのデフォルトによる返信スレッド

詳細: [設定](/ja-JP/gateway/config-agents#messages) および各チャネルのドキュメントを参照してください。

## サイレント返信

厳密なサイレントトークン `NO_REPLY` / `no_reply` は、「ユーザーに見える返信を配信しない」ことを意味します。
ターンに生成されたTTS音声などの保留中ツールメディアもある場合、OpenClawは
サイレントテキストを取り除きつつ、メディア添付は引き続き配信します。
OpenClawは会話タイプごとにその動作を解決します。

- ダイレクト会話では、デフォルトでサイレンスは許可されず、単独のサイレント返信は短い可視フォールバックに書き換えられます。
- グループ/チャネルでは、デフォルトでサイレンスが許可されます。
- 内部オーケストレーションでは、デフォルトでサイレンスが許可されます。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` にあり、
`surfaces.<id>.silentReply` と
`surfaces.<id>.silentReplyRewrite` でサーフェスごとに上書きできます。

親セッションに保留中の生成済みsubagent実行が1つ以上ある場合、親が実際の返信を子の完了イベントで受け取るまで静かなままでいられるよう、単独のサイレント返信は書き換えられず、すべてのサーフェスで破棄されます。

## 関連

- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムのメッセージ配信
- [リトライ](/ja-JP/concepts/retry) — メッセージ配信のリトライ動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャネル](/ja-JP/channels) — メッセージングプラットフォーム統合
