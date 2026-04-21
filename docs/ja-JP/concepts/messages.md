---
read_when:
    - 受信メッセージがどのように返信になるかの説明
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響の文書化
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-21T04:44:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
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

主要な設定項目は構成内にあります。

- プレフィックス、キューイング、グループ動作は `messages.*`
- ブロックストリーミングとチャンク化のデフォルトは `agents.defaults.*`
- 上限やストリーミング切り替え用のチャネル上書きは `channels.whatsapp.*`、`channels.telegram.*` など

完全な schema については [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャネルは再接続後に同じメッセージを再配信することがあります。OpenClaw は
channel/account/peer/session/message id をキーにした短時間のキャッシュを保持し、
重複配信で別のエージェント実行が起きないようにします。

## 受信デバウンス

**同じ送信者** からの短時間に連続したメッセージは、`messages.inbound` により単一の
エージェントターンにまとめられます。デバウンスはチャネル + 会話ごとのスコープで動作し、
返信のスレッド化／ID には最新のメッセージを使います。

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

注:

- デバウンスは **テキストのみ** のメッセージに適用されます。メディア／添付は即座にフラッシュされます。
- コントロールコマンドはデバウンスをバイパスし、単独のまま維持されます。

## セッションとデバイス

セッションはクライアントではなく Gateway によって所有されます。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ／channel は独自のセッションキーを持ちます。
- セッションストアと transcript は Gateway ホスト上に存在します。

複数のデバイス／チャネルが同じセッションにマップされることはありますが、履歴は
すべてのクライアントへ完全には同期されません。推奨: コンテキストの分岐を避けるため、
長い会話では 1 台の主要デバイスを使ってください。Control UI と TUI は常に
Gateway が保持するセッション transcript を表示するため、それらが信頼できる情報源です。

詳細: [Session management](/ja-JP/concepts/session)。

## 受信本文と履歴コンテキスト

OpenClaw は **prompt body** と **command body** を分離します。

- `Body`: エージェントに送られる prompt テキスト。これにはチャネル envelope や
  任意の履歴ラッパーが含まれることがあります。
- `CommandBody`: directive/command 解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシー alias（互換性のため保持）。

チャネルが履歴を提供する場合、共通ラッパーを使います。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ／channel／room）では、**現在のメッセージ本文** の先頭に
送信者ラベルが付きます（履歴エントリと同じ形式）。これにより、リアルタイムメッセージと
キュー済み／履歴メッセージがエージェント prompt 内で一貫します。

履歴バッファは **保留中のみ** です。つまり、実行をトリガーしなかったグループメッセージ
（たとえばメンションのゲートでスキップされたメッセージ）は含み、すでにセッション transcript に
入っているメッセージは **除外** されます。

directive の除去は **現在のメッセージ** セクションにのみ適用されるため、履歴はそのまま維持されます。
履歴をラップするチャネルは、`CommandBody`（または `RawBody`）を元のメッセージテキストに設定し、
`Body` は結合済み prompt のままにする必要があります。
履歴バッファは `messages.groupChat.historyLimit`（グローバルデフォルト）と、
`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のような
チャネルごとの上書きで設定できます（無効化するには `0` を設定）。

## キューイングと followup

すでに実行中の run がある場合、受信メッセージはキューに入れる、現在の run に誘導する、
または followup ターン用に収集することができます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- モード: `interrupt`、`steer`、`followup`、`collect`、および backlog バリアント。

詳細: [Queueing](/ja-JP/concepts/queue)。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分返信を送信します。
チャンク化はチャネルのテキスト上限を守り、フェンス付きコードを分割しないようにします。

主要な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトは off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい間隔）
- チャネルごとの上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [Streaming + chunking](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` で可視性を制御します。
- 推論内容は、モデルによって生成された場合、引き続きトークン使用量にカウントされます。
- Telegram は下書きバブルへの推論ストリームをサポートします。

詳細: [Thinking + reasoning directives](/ja-JP/tools/thinking) と [Token use](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

送信メッセージの形式は `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp の受信プレフィックス）
- `replyToMode` とチャネルごとのデフォルトによる返信スレッド化

詳細: [Configuration](/ja-JP/gateway/configuration-reference#messages) と各チャネルのドキュメント。

## サイレント返信

厳密なサイレントトークン `NO_REPLY` / `no_reply` は、「ユーザーに見える返信を配信しない」ことを意味します。
OpenClaw は会話タイプごとにこの挙動を解決します。

- ダイレクト会話では、デフォルトでサイレンスは許可されず、サイレント返信のみの場合は
  短い可視フォールバックに書き換えられます。
- グループ／channel では、デフォルトでサイレンスが許可されます。
- 内部オーケストレーションでは、デフォルトでサイレンスが許可されます。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` にあり、
`surfaces.<id>.silentReply` と `surfaces.<id>.silentReplyRewrite` で
サーフェスごとに上書きできます。

## 関連

- [Streaming](/ja-JP/concepts/streaming) — リアルタイムのメッセージ配信
- [Retry](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [Queue](/ja-JP/concepts/queue) — メッセージ処理キュー
- [Channels](/ja-JP/channels) — メッセージングプラットフォーム統合
