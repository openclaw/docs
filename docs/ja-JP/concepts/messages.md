---
read_when:
    - 受信メッセージがどのように返信になるかの説明
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響の文書化
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-21T13:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# メッセージ

このページでは、OpenClaw が受信メッセージ、セッション、キューイング、
ストリーミング、推論の可視性をどのように扱うかをまとめています。

## メッセージフロー（概要）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主な調整項目は設定にあります。

- プレフィックス、キューイング、グループ動作には `messages.*`。
- ブロックストリーミングとチャンク化のデフォルトには `agents.defaults.*`。
- 上限やストリーミング切り替えにはチャネルごとのオーバーライド（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマは [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャネルは、再接続後に同じメッセージを再配信することがあります。OpenClaw は
channel/account/peer/session/message id をキーにした短時間保持のキャッシュを維持し、重複した
配信が別のエージェント実行を引き起こさないようにします。

## 受信デバウンス

**同じ送信者** からの連続した高速メッセージは、`messages.inbound` によって単一の
エージェントターンにまとめられます。デバウンスはチャネルごと + 会話ごとに適用され、
返信のスレッド化/ID には最新のメッセージが使われます。

設定（グローバルデフォルト + チャネルごとのオーバーライド）:

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

- デバウンスは **テキストのみ** のメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- コントロールコマンドは、単独のままにするためデバウンスをバイパスします。ただし、チャネルが同一送信者の DM の結合に明示的にオプトインしている場合は例外です（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）。この場合、分割送信ペイロードが同じエージェントターンに参加できるよう、DM コマンドはデバウンスウィンドウ内で待機します。

## セッションとデバイス

セッションはクライアントではなく Gateway によって所有されます。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ/チャネルはそれぞれ独自のセッションキーを持ちます。
- セッションストアとトランスクリプトは Gateway ホスト上に保存されます。

複数のデバイス/チャネルが同じセッションに対応付けられることはありますが、履歴はすべての
クライアントに完全には同期されません。推奨: コンテキストの分岐を避けるため、長い会話では
主要なデバイスを 1 つ使用してください。Control UI と TUI は常に Gateway を基盤とした
セッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [Session management](/ja-JP/concepts/session)。

## 受信本文と履歴コンテキスト

OpenClaw は **プロンプト本文** と **コマンド本文** を分離します。

- `Body`: エージェントに送られるプロンプトテキスト。これにはチャネルのエンベロープと
  任意の履歴ラッパーが含まれることがあります。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシー別名（互換性のために維持）。

チャネルが履歴を提供する場合は、共有ラッパーを使います。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャネル/ルーム）では、**現在のメッセージ本文** の先頭に
送信者ラベルが付与されます（履歴エントリで使うのと同じ形式）。これにより、リアルタイムの
メッセージとキュー/履歴メッセージがエージェントプロンプト内で一貫します。

履歴バッファは **保留中のみ** です。これには実行をトリガーしなかったグループメッセージ
（たとえばメンション制御されたメッセージ）が含まれ、セッショントランスクリプトにすでに
入っているメッセージは **除外** されます。

ディレクティブ除去は **現在のメッセージ** セクションにのみ適用されるため、履歴はそのまま
保持されます。履歴をラップするチャネルは、`CommandBody`（または `RawBody`）に元の
メッセージテキストを設定し、`Body` は結合済みプロンプトのままにする必要があります。
履歴バッファは `messages.groupChat.historyLimit`（グローバルデフォルト）と、
`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のような
チャネルごとのオーバーライドで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

すでに実行がアクティブな場合、受信メッセージはキューに入れたり、現在の実行に誘導したり、
フォローアップターン用に収集したりできます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- モード: `interrupt`、`steer`、`followup`、`collect`、および backlog バリアント。

詳細: [Queueing](/ja-JP/concepts/queue)。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分返信を送信します。
チャンク化はチャネルのテキスト上限を尊重し、フェンス付きコードの分割を避けます。

主な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトは off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドル時間ベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい間）
- チャネルごとのオーバーライド: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [Streaming + chunking](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` で可視性を制御します。
- 推論コンテンツは、モデルが生成した場合、トークン使用量に引き続き含まれます。
- Telegram は下書きバブルへの推論ストリームをサポートしています。

詳細: [Thinking + reasoning directives](/ja-JP/tools/thinking) と [Token use](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

送信メッセージの整形は `messages` に一元化されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp の受信プレフィックス）
- `replyToMode` とチャネルごとのデフォルトによる返信スレッド化

詳細: [Configuration](/ja-JP/gateway/configuration-reference#messages) と各チャネルのドキュメントを参照してください。

## サイレント返信

厳密なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに見える返信を配信しない」を意味します。
OpenClaw はその動作を会話タイプごとに解決します。

- ダイレクト会話では、デフォルトで無応答は許可されず、サイレント返信のみの場合は短い可視フォールバックに書き換えられます。
- グループ/チャネルでは、デフォルトで無応答が許可されます。
- 内部オーケストレーションでは、デフォルトで無応答が許可されます。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` にあり、
`surfaces.<id>.silentReply` と `surfaces.<id>.silentReplyRewrite` で
surface ごとにオーバーライドできます。

## 関連

- [Streaming](/ja-JP/concepts/streaming) — リアルタイムのメッセージ配信
- [Retry](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [Queue](/ja-JP/concepts/queue) — メッセージ処理キュー
- [Channels](/ja-JP/channels) — メッセージングプラットフォーム統合
