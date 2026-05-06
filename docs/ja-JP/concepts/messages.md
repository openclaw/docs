---
read_when:
    - 受信メッセージが返信になる仕組みを説明する
    - セッション、キュー処理モード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響を文書化
summary: メッセージフロー、セッション、キュー処理、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-05-06T05:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw は、セッション解決、キューイング、ストリーミング、ツール実行、推論可視性のパイプラインを通じて受信メッセージを処理します。このページでは、受信メッセージから返信までの経路を示します。

## メッセージフロー（概要）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定にあります。

- プレフィックス、キューイング、グループ動作には `messages.*`。
- ブロックストリーミングとチャンク化のデフォルトには `agents.defaults.*`。
- 上限とストリーミング切り替えにはチャンネル上書き（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマは [設定](/ja-JP/gateway/configuration) を参照してください。

## 受信重複排除

チャンネルは再接続後に同じメッセージを再配信することがあります。OpenClaw は、チャンネル/アカウント/ピア/セッション/メッセージ ID をキーにした短命のキャッシュを保持し、重複配信が別のエージェント実行をトリガーしないようにします。

## 受信デバウンス

**同じ送信者**からの短時間の連続メッセージは、`messages.inbound` により 1 回のエージェントターンにまとめられます。デバウンスはチャンネル + 会話ごとにスコープされ、返信スレッド/ID には最新のメッセージを使用します。

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

- デバウンスは**テキストのみ**のメッセージに適用されます。メディア/添付は即座にフラッシュされます。
- 制御コマンドは単独で扱われるようにデバウンスをバイパスします。ただし、チャンネルが同一送信者の DM 結合に明示的にオプトインしている場合は**例外**です（例: [BlueBubbles `coalesceSameSenderDms`](/ja-JP/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)）。この場合、DM コマンドはデバウンスウィンドウ内で待機し、分割送信されたペイロードが同じエージェントターンに合流できるようにします。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットはエージェントのメインセッションキーに集約されます。
- グループ/チャンネルにはそれぞれ独自のセッションキーが割り当てられます。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャンネルを同じセッションにマッピングできますが、履歴がすべてのクライアントへ完全に同期されるわけではありません。推奨: 長い会話では、コンテキストの分岐を避けるため、主要デバイスを 1 つ使用してください。Control UI と TUI は常に Gateway に裏付けられたセッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## ツール結果メタデータ

ツール結果の `content` はモデルから見える結果です。ツール結果の `details` は、UI レンダリング、診断、メディア配信、Plugin 用のランタイムメタデータです。

OpenClaw はこの境界を明示的に保ちます。

- `toolResult.details` は、プロバイダー再生と Compaction 入力の前に取り除かれます。
- 永続化されたセッショントランスクリプトは、制限内の `details` のみを保持します。大きすぎるメタデータは、`persistedDetailsTruncated: true` とマークされたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` だけでなく `content` に入れる必要があります。

## 受信本文と履歴コンテキスト

OpenClaw は**プロンプト本文**と**コマンド本文**を分離します。

- `BodyForAgent`: 現在のメッセージについて、主にモデルへ渡されるテキストです。チャンネル Plugin は、送信者の現在のプロンプトを含むテキストに集中させる必要があります。
- `Body`: レガシーのプロンプトフォールバックです。チャンネルエンベロープや任意の履歴ラッパーを含む場合がありますが、現在のチャンネルは `BodyForAgent` が利用可能なとき、これを主要なモデル入力として頼るべきではありません。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキストです。
- `RawBody`: `CommandBody` のレガシーエイリアスです（互換性のために保持）。

チャンネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャンネル/ルーム）では、**現在のメッセージ本文**の先頭に送信者ラベルが付与されます（履歴エントリと同じスタイル）。これにより、リアルタイムメッセージとキュー/履歴メッセージがエージェントプロンプト内で一貫します。

履歴バッファは**保留中のみ**です。これには、実行をトリガーしなかったグループメッセージ（たとえば、メンションでゲートされたメッセージ）が含まれ、セッショントランスクリプトにすでにあるメッセージは**除外**されます。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま保持されます。履歴をラップするチャンネルは、`CommandBody`（または `RawBody`）を元のメッセージテキストに設定し、`Body` を結合済みプロンプトとして保持する必要があります。構造化履歴、返信、転送、チャンネルメタデータは、プロンプト組み立て時にユーザー役割の信頼されていないコンテキストブロックとしてレンダリングされます。
履歴バッファは、`messages.groupChat.historyLimit`（グローバルデフォルト）と、`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のようなチャンネルごとの上書きで設定できます（無効にするには `0` を設定）。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れる、現在の実行へ誘導する、またはフォローアップターン用に収集できます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- デフォルトモードは `steer` で、誘導がキュー済みフォローアップ配信へフォールバックするときは 500ms のフォローアップデバウンスがあります。
- モード: `steer`、`followup`、`collect`、`steer-backlog`、`interrupt`、およびレガシーの一度に 1 件ずつ処理する `queue` モード。

詳細: [コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering)。

## チャンネル実行の所有権

チャンネル Plugin は、メッセージがセッションキューに入る前に、順序の保持、入力のデバウンス、トランスポートのバックプレッシャー適用を行えます。エージェントターン自体の周囲に別のタイムアウトを課すべきではありません。メッセージがセッションへルーティングされると、長時間実行される作業はセッション、ツール、ランタイムのライフサイクルによって管理されるため、すべてのチャンネルが遅いターンを一貫して報告し、回復できます。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するにつれて部分返信を送信します。チャンク化はチャンネルのテキスト上限を尊重し、フェンス付きコードの分割を避けます。

主要設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトはオフ）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ化）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい一時停止）
- チャンネル上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャンネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を表示または非表示にできます。

- `/reasoning on|off|stream` が可視性を制御します。
- 推論コンテンツは、モデルによって生成された場合はトークン使用量に引き続きカウントされます。
- Telegram は、一時的な下書きバブルへの推論ストリームをサポートし、最終配信後に削除されます。永続的な推論出力には `/reasoning on` を使用してください。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用](/ja-JP/reference/token-use)。

## プレフィックス、スレッド、返信

送信メッセージのフォーマットは `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）に加えて、`channels.whatsapp.messagePrefix`（WhatsApp 受信プレフィックス）
- `replyToMode` とチャンネルごとのデフォルトによる返信スレッド

詳細: [設定](/ja-JP/gateway/config-agents#messages) とチャンネルドキュメント。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は、「ユーザーに見える返信を配信しない」ことを意味します。
ターンに生成された TTS 音声などの保留中のツールメディアもある場合、OpenClaw はサイレントテキストを取り除きますが、メディア添付は引き続き配信します。
OpenClaw は、その動作を会話タイプごとに解決します。

- ダイレクト会話ではデフォルトでサイレンスを許可せず、単独のサイレント返信を短い表示フォールバックに書き換えます。
- グループ/チャンネルではデフォルトでサイレンスを許可します。
- 内部オーケストレーションではデフォルトでサイレンスを許可します。

OpenClaw は、非ダイレクトチャットでアシスタント返信前に発生した内部ランナー失敗にもサイレント返信を使用するため、グループ/チャンネルには Gateway エラーの定型文が表示されません。ダイレクトチャットではデフォルトで簡潔な失敗文が表示されます。生のランナー詳細は `/verbose` が `on` または `full` の場合にのみ表示されます。

デフォルトは `agents.defaults.silentReply` と `agents.defaults.silentReplyRewrite` の下にあり、`surfaces.<id>.silentReply` と `surfaces.<id>.silentReplyRewrite` はサーフェスごとにそれらを上書きできます。

親セッションに保留中のスポーン済みサブエージェント実行が 1 つ以上ある場合、単独のサイレント返信は書き換えられず、すべてのサーフェスで破棄されます。これにより、子の完了イベントが実際の返信を配信するまで、親は静かなままになります。

## 関連

- [メッセージライフサイクルのリファクタリング](/ja-JP/concepts/message-lifecycle-refactor) - 永続的な送受信設計の目標
- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [再試行](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャンネル](/ja-JP/channels) — メッセージングプラットフォーム連携
