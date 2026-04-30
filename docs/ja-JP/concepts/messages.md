---
read_when:
    - 受信メッセージが返信になる仕組みを説明する
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と利用上の影響を文書化
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-04-30T16:28:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw は、セッション解決、キューイング、ストリーミング、ツール実行、推論の可視性というパイプラインを通じて受信メッセージを処理します。このページでは、受信メッセージから返信までの経路を示します。

## メッセージフロー (高レベル)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定内にあります。

- `messages.*`: プレフィックス、キューイング、グループ動作。
- `agents.defaults.*`: ブロックストリーミングとチャンク化のデフォルト。
- チャネルの上書き (`channels.whatsapp.*`、`channels.telegram.*` など): 上限とストリーミングの切り替え。

完全なスキーマについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャネルは再接続後に同じメッセージを再配信することがあります。OpenClaw は、チャネル/アカウント/ピア/セッション/メッセージ ID をキーにした短命のキャッシュを保持し、重複配信によって別のエージェント実行が起動しないようにします。

## 受信デバウンス

**同じ送信者**からの連続した短時間のメッセージは、`messages.inbound` によって単一のエージェントターンにまとめることができます。デバウンスはチャネル + 会話ごとにスコープされ、返信スレッド/ID には最新のメッセージを使用します。

設定 (グローバルデフォルト + チャネルごとの上書き):

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

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- 制御コマンドは単独のままになるようデバウンスをバイパスします。ただし、チャネルが同一送信者の DM 結合を明示的に有効にしている場合は**例外**です (例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition))。この場合、分割送信ペイロードが同じエージェントターンに合流できるよう、DM コマンドはデバウンス期間内で待機します。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットはエージェントのメインセッションキーにまとめられます。
- グループ/チャネルには固有のセッションキーが割り当てられます。
- セッションストアとトランスクリプトは Gateway ホスト上に存在します。

複数のデバイス/チャネルを同じセッションに対応付けることはできますが、履歴がすべてのクライアントへ完全に同期されるわけではありません。推奨: 長い会話では文脈の分岐を避けるため、主デバイスを 1 つ使用してください。Control UI と TUI は常に Gateway に裏付けられたセッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## ツール結果メタデータ

ツール結果の `content` はモデルに見える結果です。ツール結果の `details` は、UI レンダリング、診断、メディア配信、Plugin 用のランタイムメタデータです。

OpenClaw はその境界を明示的に保ちます。

- `toolResult.details` はプロバイダー再生と Compaction 入力の前に取り除かれます。
- 永続化されたセッショントランスクリプトには、境界内の `details` のみが保持されます。過大なメタデータは、`persistedDetailsTruncated: true` とマークされたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` だけでなく `content` に入れる必要があります。

## 受信本文と履歴コンテキスト

OpenClaw は**プロンプト本文**と**コマンド本文**を分離します。

- `BodyForAgent`: 現在のメッセージについて、主にモデル向けとなるテキスト。チャネル Plugin は、送信者の現在のプロンプトを含むテキストにこれを集中させる必要があります。
- `Body`: レガシーのプロンプトフォールバック。これにはチャネルエンベロープや任意の履歴ラッパーが含まれる場合がありますが、現在のチャネルは `BodyForAgent` が利用可能な場合、主要なモデル入力としてこれに依存するべきではありません。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス (互換性のために保持)。

チャネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット** (グループ/チャネル/ルーム) では、**現在のメッセージ本文**の先頭に送信者ラベルが付きます (履歴エントリに使われるものと同じスタイル)。これにより、エージェントプロンプト内でリアルタイムメッセージとキュー/履歴メッセージの一貫性が保たれます。

履歴バッファは**保留中のみ**です。実行をトリガーしなかったグループメッセージ (たとえばメンションゲートされたメッセージ) を含み、セッショントランスクリプトにすでにあるメッセージは**除外**します。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま残ります。履歴をラップするチャネルは、`CommandBody` (または `RawBody`) を元のメッセージテキストに設定し、`Body` は結合済みプロンプトとして保持する必要があります。構造化された履歴、返信、転送、チャネルメタデータは、プロンプト組み立て時にユーザーロールの信頼されないコンテキストブロックとしてレンダリングされます。
履歴バッファは、`messages.groupChat.historyLimit` (グローバルデフォルト) と、`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のようなチャネルごとの上書きで設定できます (無効化するには `0` を設定)。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れる、現在の実行へ誘導する、またはフォローアップターン用に収集することができます。

- `messages.queue` (および `messages.queue.byChannel`) で設定します。
- デフォルトモードは `steer` で、誘導がキュー済みフォローアップ配信へフォールバックする場合は 500ms のフォローアップデバウンスがあります。
- モード: `steer`、`followup`、`collect`、`steer-backlog`、`interrupt`、およびレガシーの 1 回に 1 つずつ処理する `queue` モード。

詳細: [コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering)。

## チャネル実行の所有権

チャネル Plugin は、メッセージがセッションキューに入る前に、順序の保持、入力のデバウンス、トランスポートのバックプレッシャー適用を行うことができます。エージェントターン自体に別個のタイムアウトを課すべきではありません。メッセージがセッションにルーティングされると、長時間実行される作業はセッション、ツール、ランタイムのライフサイクルによって管理され、すべてのチャネルが遅いターンを一貫して報告し復旧できるようになります。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するにつれて部分返信を送信します。チャンク化はチャネルのテキスト上限を尊重し、フェンス付きコードの分割を避けます。

主要な設定:

- `agents.defaults.blockStreamingDefault` (`on|off`、デフォルトは off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (アイドルベースのバッチ化)
- `agents.defaults.humanDelay` (ブロック返信間の人間らしい一時停止)
- チャネルの上書き: `*.blockStreaming` と `*.blockStreamingCoalesce` (Telegram 以外のチャネルでは明示的な `*.blockStreaming: true` が必要)

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` は可視性を制御します。
- 推論コンテンツは、モデルによって生成された場合、トークン使用量に引き続きカウントされます。
- Telegram はドラフトバブルへの推論ストリームをサポートします。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用量](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

送信メッセージの形式は `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix` (送信プレフィックスのカスケード)、および `channels.whatsapp.messagePrefix` (WhatsApp 受信プレフィックス)
- `replyToMode` とチャネルごとのデフォルトによる返信スレッド化

詳細: [設定](/ja-JP/gateway/config-agents#messages) とチャネルドキュメント。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに見える返信を配信しない」ことを意味します。
ターンに生成された TTS 音声などの保留中ツールメディアもある場合、OpenClaw はサイレントテキストを取り除きますが、メディア添付ファイルは引き続き配信します。
OpenClaw はその動作を会話タイプごとに解決します。

- ダイレクト会話ではデフォルトで沈黙を許可せず、裸のサイレント返信を短い可視フォールバックに書き換えます。
- グループ/チャネルではデフォルトで沈黙を許可します。
- 内部オーケストレーションではデフォルトで沈黙を許可します。

OpenClaw は、非ダイレクトチャットでアシスタント返信の前に発生した内部ランナー障害にもサイレント返信を使用するため、グループ/チャネルには Gateway エラーの定型文が表示されません。ダイレクトチャットではデフォルトで簡潔な失敗文が表示されます。生のランナー詳細は `/verbose` が `on` または `full` の場合にのみ表示されます。

デフォルトは `agents.defaults.silentReply` と `agents.defaults.silentReplyRewrite` の下にあります。`surfaces.<id>.silentReply` と `surfaces.<id>.silentReplyRewrite` はサーフェスごとにこれらを上書きできます。

親セッションに保留中の生成済みサブエージェント実行が 1 つ以上ある場合、裸のサイレント返信は書き換えられる代わりにすべてのサーフェスで破棄されるため、子の完了イベントが実際の返信を配信するまで親は静かなままになります。

## 関連

- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [リトライ](/ja-JP/concepts/retry) — メッセージ配信のリトライ動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャネル](/ja-JP/channels) — メッセージングプラットフォーム連携
