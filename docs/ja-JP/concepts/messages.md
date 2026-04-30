---
read_when:
    - 受信メッセージがどのように返信になるかを説明する
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用量への影響を文書化
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-30T05:08:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw は、受信メッセージをセッション解決、キューイング、ストリーミング、ツール実行、推論の可視化のパイプラインで処理します。このページでは、受信メッセージから返信までの経路を整理します。

## メッセージフロー（高レベル）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定にあります。

- `messages.*`: プレフィックス、キューイング、グループ動作。
- `agents.defaults.*`: ブロックストリーミングとチャンク化のデフォルト。
- チャンネル別オーバーライド（`channels.whatsapp.*`、`channels.telegram.*` など）: 上限とストリーミングの切り替え。

完全なスキーマは [設定](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャンネルは、再接続後に同じメッセージを再配信することがあります。OpenClaw は、チャンネル/アカウント/ピア/セッション/メッセージ ID をキーにした短命のキャッシュを保持し、重複配信が別のエージェント実行を起動しないようにします。

## 受信デバウンス

**同じ送信者**からの連続した高速なメッセージは、`messages.inbound` によって 1 回のエージェントターンにまとめられます。デバウンスはチャンネル + 会話ごとにスコープされ、返信のスレッド化/ID には最新のメッセージを使います。

設定（グローバルデフォルト + チャンネル別オーバーライド）:

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

注記:

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- 制御コマンドはデバウンスを迂回するため単独のままです。ただし、チャンネルが同一送信者 DM の結合を明示的に有効にしている場合（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）は例外で、その場合 DM コマンドはデバウンスウィンドウ内で待機し、分割送信されたペイロードが同じエージェントターンに合流できるようにします。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットは、エージェントのメインセッションキーに集約されます。
- グループ/チャンネルは、それぞれ独自のセッションキーを持ちます。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャンネルを同じセッションに対応付けることはできますが、履歴がすべてのクライアントへ完全に同期されるわけではありません。長い会話では、コンテキストの分岐を避けるため、主デバイスを 1 つ使うことを推奨します。Control UI と TUI は常に Gateway によって裏付けられたセッショントランスクリプトを表示するため、それらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## ツール結果メタデータ

ツール結果の `content` は、モデルから見える結果です。ツール結果の `details` は、UI レンダリング、診断、メディア配信、Plugin のためのランタイムメタデータです。

OpenClaw はその境界を明示的に保ちます。

- `toolResult.details` は、プロバイダーへの再生と Compaction 入力の前に取り除かれます。
- 永続化されたセッショントランスクリプトには、範囲を制限した `details` のみが保持されます。過大なメタデータは、`persistedDetailsTruncated: true` とマークされたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` だけでなく `content` に入れるべきです。

## 受信本文と履歴コンテキスト

OpenClaw は**プロンプト本文**と**コマンド本文**を分離します。

- `Body`: エージェントに送信されるプロンプトテキスト。これにはチャンネルエンベロープや任意の履歴ラッパーが含まれる場合があります。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス（互換性のために維持）。

チャンネルが履歴を提供する場合、共有ラッパーを使います。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャンネル/ルーム）では、**現在のメッセージ本文**の先頭に送信者ラベルが付与されます（履歴エントリと同じスタイル）。これにより、リアルタイムのメッセージとキュー/履歴のメッセージがエージェントプロンプト内で一貫します。

履歴バッファは**保留中のみ**です。実行をトリガーしなかったグループメッセージ（たとえば、メンションでゲートされたメッセージ）を含み、セッショントランスクリプトにすでにあるメッセージは**除外**します。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま残ります。履歴をラップするチャンネルは、`CommandBody`（または `RawBody`）を元のメッセージテキストに設定し、`Body` は結合後のプロンプトとして保持するべきです。履歴バッファは、`messages.groupChat.historyLimit`（グローバルデフォルト）と、`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` などのチャンネル別オーバーライドで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れる、現在の実行に誘導する、またはフォローアップターン用に収集することができます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- デフォルトモードは `steer` で、ステアリングがキュー化されたフォローアップ配信にフォールバックする場合は 500ms のフォローアップデバウンスがあります。
- モード: `steer`、`followup`、`collect`、`steer-backlog`、`interrupt`、およびレガシーの 1 件ずつ処理する `queue` モード。

詳細: [コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering)。

## チャンネル実行の所有権

チャンネル Plugin は、メッセージがセッションキューに入る前に、順序を保持し、入力をデバウンスし、トランスポートのバックプレッシャーを適用できます。エージェントターン自体に別個のタイムアウトを課すべきではありません。メッセージがセッションにルーティングされると、長時間実行される作業はセッション、ツール、ランタイムのライフサイクルによって管理されるため、すべてのチャンネルが遅いターンを一貫して報告し、復旧できます。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するたびに部分返信を送信します。チャンク化はチャンネルのテキスト上限を尊重し、フェンス付きコードの分割を避けます。

主な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトは off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい一時停止）
- チャンネル別オーバーライド: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャンネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデル推論を表示または非表示にできます。

- `/reasoning on|off|stream` は可視性を制御します。
- 推論内容は、モデルによって生成された場合、引き続きトークン使用量にカウントされます。
- Telegram は、下書きバブルへの推論ストリームをサポートします。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用量](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

送信メッセージの整形は `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp 受信プレフィックス）
- `replyToMode` とチャンネル別デフォルトによる返信スレッド化

詳細: [設定](/ja-JP/gateway/config-agents#messages) とチャンネルドキュメント。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は、「ユーザーに見える返信を配信しない」ことを意味します。ターンに生成された TTS 音声などの保留中のツールメディアもある場合、OpenClaw はサイレントテキストを取り除きつつ、メディア添付は配信します。OpenClaw は、その動作を会話種別ごとに解決します。

- ダイレクト会話はデフォルトで沈黙を許可せず、サイレント返信だけの場合は短い可視フォールバックに書き換えます。
- グループ/チャンネルはデフォルトで沈黙を許可します。
- 内部オーケストレーションはデフォルトで沈黙を許可します。

OpenClaw は、非ダイレクトチャットでアシスタント返信の前に発生した内部ランナー障害にもサイレント返信を使うため、グループ/チャンネルには Gateway エラーの定型文が表示されません。ダイレクトチャットでは、デフォルトでコンパクトな失敗文が表示されます。生のランナー詳細は、`/verbose` が `on` または `full` の場合にのみ表示されます。

デフォルトは `agents.defaults.silentReply` と `agents.defaults.silentReplyRewrite` にあり、`surfaces.<id>.silentReply` と `surfaces.<id>.silentReplyRewrite` はサーフェスごとにそれらをオーバーライドできます。

親セッションに保留中の生成済みサブエージェント実行が 1 つ以上ある場合、サイレント返信だけのものは書き換えられる代わりにすべてのサーフェスで破棄されるため、子の完了イベントが実際の返信を配信するまで親は静かなままになります。

## 関連

- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムのメッセージ配信
- [再試行](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャンネル](/ja-JP/channels) — メッセージングプラットフォーム統合
