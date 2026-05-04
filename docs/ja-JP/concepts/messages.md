---
read_when:
    - 受信メッセージが返信になる仕組みを説明する
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響の文書化
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-05-04T07:03:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw は、セッション解決、キューイング、ストリーミング、ツール実行、推論の可視性からなるパイプラインで受信メッセージを処理します。このページでは、受信メッセージから返信までの経路を示します。

## メッセージフロー（高レベル）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定内にあります。

- 接頭辞、キューイング、グループ動作には `messages.*`。
- ブロックストリーミングとチャンク化のデフォルトには `agents.defaults.*`。
- 上限とストリーミングの切り替えには、チャンネルごとの上書き（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマについては [設定](/ja-JP/gateway/configuration) を参照してください。

## 受信の重複排除

チャンネルは、再接続後に同じメッセージを再配信することがあります。OpenClaw は、チャンネル/アカウント/ピア/セッション/メッセージ ID をキーとする短期間のキャッシュを保持し、重複配信が別のエージェント実行を起動しないようにします。

## 受信のデバウンス

**同じ送信者**からの短時間の連続メッセージは、`messages.inbound` によって単一のエージェントターンにまとめられます。デバウンスはチャンネル + 会話単位でスコープされ、返信スレッド/ID には最新のメッセージが使用されます。

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

注:

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- 制御コマンドはデバウンスをバイパスするため単独のままです。ただし、チャンネルが同一送信者 DM の結合を明示的に有効にしている場合（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）は**例外**で、DM コマンドは分割送信されたペイロードが同じエージェントターンに合流できるように、デバウンス期間内で待機します。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ/チャンネルは独自のセッションキーを持ちます。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャンネルを同じセッションにマッピングできますが、履歴はすべてのクライアントに完全には同期されません。推奨事項: 長い会話では、コンテキストの分岐を避けるために 1 つの主要デバイスを使用してください。Control UI と TUI は常に Gateway が保持するセッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## ツール結果メタデータ

ツール結果の `content` はモデルに見える結果です。ツール結果の `details` は、UI レンダリング、診断、メディア配信、Plugin のためのランタイムメタデータです。

OpenClaw はこの境界を明示的に保ちます。

- `toolResult.details` は、プロバイダーの再生と Compaction 入力の前に取り除かれます。
- 永続化されたセッショントランスクリプトは、制限された `details` のみを保持します。過大なメタデータは、`persistedDetailsTruncated: true` とマークされたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` のみに入れるのではなく、`content` に入れるべきです。

## 受信本文と履歴コンテキスト

OpenClaw は**プロンプト本文**と**コマンド本文**を分離します。

- `BodyForAgent`: 現在のメッセージに対する、主なモデル向けテキスト。チャンネル Plugin は、これを送信者の現在のプロンプトを含むテキストに集中させるべきです。
- `Body`: レガシーのプロンプトフォールバック。チャンネルのエンベロープや任意の履歴ラッパーを含む場合がありますが、現在のチャンネルは `BodyForAgent` が利用可能な場合、これを主要なモデル入力として扱うべきではありません。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス（互換性のために保持）。

チャンネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャンネル/ルーム）では、**現在のメッセージ本文**の前に送信者ラベルが付加されます（履歴エントリと同じスタイル）。これにより、リアルタイムメッセージとキュー/履歴メッセージがエージェントプロンプト内で一貫します。

履歴バッファは**保留中のみ**です。これには、実行をトリガーしなかったグループメッセージ（たとえば、メンションでゲートされたメッセージ）が含まれ、すでにセッショントランスクリプト内にあるメッセージは**除外**されます。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま保持されます。履歴をラップするチャンネルは、`CommandBody`（または `RawBody`）を元のメッセージテキストに設定し、`Body` を結合済みプロンプトとして保持するべきです。構造化された履歴、返信、転送、チャンネルメタデータは、プロンプト組み立て時にユーザー役割の信頼されないコンテキストブロックとしてレンダリングされます。
履歴バッファは、`messages.groupChat.historyLimit`（グローバルデフォルト）と、`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` などのチャンネルごとの上書きで設定できます（無効にするには `0` を設定）。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れる、現在の実行に誘導する、またはフォローアップターン用に収集することができます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- デフォルトモードは `steer` で、誘導がキュー済みフォローアップ配信にフォールバックする場合は 500ms のフォローアップデバウンスがあります。
- モード: `steer`、`followup`、`collect`、`steer-backlog`、`interrupt`、およびレガシーの 1 回に 1 件ずつ処理する `queue` モード。

詳細: [コマンドキュー](/ja-JP/concepts/queue) と [Steering キュー](/ja-JP/concepts/queue-steering)。

## チャンネルの実行所有権

チャンネル Plugin は、メッセージがセッションキューに入る前に順序を保持し、入力をデバウンスし、トランスポートのバックプレッシャーを適用できます。エージェントターン自体に別個のタイムアウトを課すべきではありません。メッセージがセッションにルーティングされると、長時間実行される作業はセッション、ツール、ランタイムのライフサイクルによって管理されるため、すべてのチャンネルが遅いターンを一貫して報告し、回復できます。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するにつれて部分返信を送信します。チャンク化はチャンネルのテキスト制限を尊重し、フェンス付きコードの分割を避けます。

主要設定:

- `agents.defaults.blockStreamingDefault` (`on|off`、デフォルトは off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい一時停止）
- チャンネルごとの上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャンネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` は可視性を制御します。
- 推論コンテンツは、モデルによって生成された場合、トークン使用量に含まれます。
- Telegram は、一時的な下書きバブルへの推論ストリームをサポートしており、これは最終配信後に削除されます。永続的な推論出力には `/reasoning on` を使用してください。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用量](/ja-JP/reference/token-use)。

## 接頭辞、スレッド化、返信

送信メッセージのフォーマットは `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信接頭辞のカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp 受信接頭辞）
- `replyToMode` とチャンネルごとのデフォルトによる返信スレッド化

詳細: [設定](/ja-JP/gateway/config-agents#messages) とチャンネルドキュメント。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに見える返信を配信しない」ことを意味します。
ターンに生成された TTS 音声などの保留中のツールメディアもある場合、OpenClaw はサイレントテキストを取り除きますが、メディア添付ファイルは引き続き配信します。
OpenClaw はこの動作を会話タイプ別に解決します。

- ダイレクト会話では、デフォルトでサイレンスを許可せず、サイレント返信のみの場合は短い可視フォールバックに書き換えます。
- グループ/チャンネルでは、デフォルトでサイレンスを許可します。
- 内部オーケストレーションでは、デフォルトでサイレンスを許可します。

OpenClaw は、非ダイレクトチャットでアシスタント返信の前に発生した内部ランナー障害にもサイレント返信を使用するため、グループ/チャンネルには Gateway エラーの定型文が表示されません。ダイレクトチャットでは、デフォルトで簡潔な失敗文が表示されます。生のランナー詳細は、`/verbose` が `on` または `full` の場合にのみ表示されます。

デフォルトは `agents.defaults.silentReply` と `agents.defaults.silentReplyRewrite` の下にあり、`surfaces.<id>.silentReply` と `surfaces.<id>.silentReplyRewrite` でサーフェスごとに上書きできます。

親セッションに保留中の生成済みサブエージェント実行が 1 つ以上ある場合、サイレント返信のみの返信は書き換えられるのではなくすべてのサーフェスで破棄されるため、子の完了イベントが実際の返信を配信するまで親は静かなままになります。

## 関連

- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [再試行](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャンネル](/ja-JP/channels) — メッセージングプラットフォーム連携
