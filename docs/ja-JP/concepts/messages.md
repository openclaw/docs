---
read_when:
    - 受信メッセージがどのように返信になるかの説明
    - セッション、キューモード、またはストリーミング動作の説明 clarification
    - reasoning の可視性と使用量への影響を文書化しています
summary: メッセージフロー、セッション、キューイング、reasoning の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-24T04:53:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

このページでは、OpenClaw が受信メッセージ、セッション、キューイング、
ストリーミング、reasoning の可視性をどのように扱うかをまとめて説明します。

## メッセージフロー（高レベル）

```
受信メッセージ
  -> ルーティング/バインディング -> セッションキー
  -> キュー（実行がアクティブな場合）
  -> エージェント実行（ストリーミング + ツール）
  -> 送信返信（チャンネル制限 + チャンキング）
```

主な設定ノブは configuration にあります。

- プレフィックス、キューイング、グループ動作は `messages.*`
- ブロックストリーミングとチャンキングのデフォルトは `agents.defaults.*`
- 上限とストリーミング切り替えはチャンネル上書き（`channels.whatsapp.*`、`channels.telegram.*` など）

完全なスキーマについては、[Configuration](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャンネルは、再接続後に同じメッセージを再配信することがあります。OpenClaw は、
channel/account/peer/session/message id をキーにした短命キャッシュを保持し、重複
配信が別のエージェント実行をトリガーしないようにします。

## 受信デバウンス

**同じ送信者**からの連続する高速メッセージは、`messages.inbound` により 1 回の
エージェントターンにまとめられます。デバウンスはチャンネル + 会話単位でスコープされ、
返信スレッディング/ID には最新メッセージが使われます。

設定（グローバルデフォルト + チャンネルごとの上書き）:

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

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付ファイルは即時にフラッシュされます。
- コントロールコマンドはデバウンスをバイパスするため、単独のまま維持されます。ただし、チャンネルが同一送信者 DM の結合に明示的にオプトインしている場合は例外です（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）。その場合、DM コマンドはデバウンスウィンドウ内で待機し、分割送信されたペイロードが同じエージェントターンに結合できます。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ/チャンネルはそれぞれ独自のセッションキーを持ちます。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャンネルが同じセッションにマップされることがありますが、履歴はすべてのクライアントへ完全には
同期されません。推奨: コンテキストの分岐を避けるため、長い会話では 1 台の主デバイスを使ってください。Control UI と TUI は常に
Gateway バックのセッショントランスクリプトを表示するため、それらが信頼できる情報源です。

詳細: [Session management](/ja-JP/concepts/session)。

## 受信本文と履歴コンテキスト

OpenClaw は **prompt body** と **command body** を分離しています。

- `Body`: エージェントに送られるプロンプトテキスト。これにはチャンネルエンベロープと
  任意の履歴ラッパーが含まれることがあります。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス（互換性のため保持）。

チャンネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャンネル/ルーム）では、**現在のメッセージ本文**の先頭に
送信者ラベルが付きます（履歴エントリーと同じスタイル）。これにより、リアルタイムメッセージと
キュー/履歴メッセージがエージェントプロンプト内で一貫します。

履歴バッファは **pending-only** です。つまり、実行をトリガーしなかったグループメッセージ
（たとえばメンションゲート対象メッセージ）は含みますが、セッショントランスクリプトにすでにある
メッセージは含みません。

ディレクティブ除去は **現在のメッセージ** セクションにのみ適用されるため、履歴は
そのまま維持されます。履歴をラップするチャンネルは、`CommandBody`（または
`RawBody`）に元のメッセージテキストを設定し、`Body` は結合済みプロンプトのままにする必要があります。
履歴バッファは `messages.groupChat.historyLimit`（グローバル
デフォルト）と、`channels.slack.historyLimit` や
`channels.telegram.accounts.<id>.historyLimit` のようなチャンネルごとの上書きで設定できます（無効化は `0`）。

## キューイングと followup

実行がすでにアクティブな場合、受信メッセージはキューに入れるか、現在の
実行へ steer するか、followup ターン用に collect できます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- モード: `interrupt`、`steer`、`followup`、`collect`、および backlog バリアント。

詳細: [Queueing](/ja-JP/concepts/queue)。

## ストリーミング、チャンキング、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分返信を送信します。
チャンキングはチャンネルのテキスト上限を尊重し、フェンス付きコードを分割しません。

主な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルト off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい待機）
- チャンネル上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャンネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [Streaming + chunking](/ja-JP/concepts/streaming)。

## reasoning の可視性とトークン

OpenClaw はモデルの reasoning を表示または非表示にできます。

- `/reasoning on|off|stream` で可視性を制御します。
- reasoning 内容は、モデルが生成した場合、引き続きトークン使用量にカウントされます。
- Telegram はドラフトバブルへの reasoning ストリームをサポートします。

詳細: [Thinking + reasoning directives](/ja-JP/tools/thinking) と [Token use](/ja-JP/reference/token-use)。

## プレフィックス、スレッディング、返信

送信メッセージのフォーマットは `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp 受信プレフィックス）
- `replyToMode` とチャンネルごとのデフォルトによる返信スレッディング

詳細: [Configuration](/ja-JP/gateway/config-agents#messages) と各チャンネルのドキュメントを参照してください。

## 無音返信

完全一致の無音トークン `NO_REPLY` / `no_reply` は「ユーザー可視の返信を配信しない」ことを意味します。
OpenClaw は会話種別ごとにこの動作を解決します。

- ダイレクト会話では、デフォルトで無音は許可されず、単独の無音
  返信は短い可視フォールバックに書き換えられます。
- グループ/チャンネルでは、デフォルトで無音が許可されます。
- 内部オーケストレーションでは、デフォルトで無音が許可されます。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` にあり、`surfaces.<id>.silentReply` と
`surfaces.<id>.silentReplyRewrite` でサーフェスごとに上書きできます。

親セッションに保留中の生成済み subagent 実行が 1 つ以上ある場合、単独の
無音返信は、書き換えられる代わりにすべてのサーフェスで破棄されるため、
子の完了イベントが実際の返信を配信するまで親は静かなままです。

## 関連

- [Streaming](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [Retry](/ja-JP/concepts/retry) — メッセージ配信リトライ動作
- [Queue](/ja-JP/concepts/queue) — メッセージ処理キュー
- [Channels](/ja-JP/channels) — メッセージングプラットフォーム統合
