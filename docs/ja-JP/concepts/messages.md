---
read_when:
    - 受信メッセージが返信になる仕組みの説明
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響を文書化する
summary: メッセージフロー、セッション、キュー処理、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-05-10T19:31:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw は、セッション解決、キューイング、ストリーミング、ツール実行、推論の可視性というパイプラインを通じて受信メッセージを処理します。このページでは、受信メッセージから返信までの経路を示します。

## メッセージフロー（高レベル）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定にあります。

- プレフィックス、キューイング、グループの動作には `messages.*`。
- ブロックストリーミングとチャンク化のデフォルトには `agents.defaults.*`。
- 上限とストリーミング切り替えにはチャネルオーバーライド（`channels.whatsapp.*`、`channels.telegram.*` など）。

完全なスキーマは [設定](/ja-JP/gateway/configuration) を参照してください。

## 受信の重複排除

チャネルは再接続後に同じメッセージを再配信することがあります。OpenClaw は、
チャネル/アカウント/ピア/セッション/メッセージ ID をキーにした短命のキャッシュを保持し、
重複配信によって別のエージェント実行が起動しないようにします。

## 受信のデバウンス

**同じ送信者**からの連続した短時間のメッセージは、`messages.inbound` によって単一の
エージェントターンにまとめられます。デバウンスはチャネル + 会話ごとにスコープされ、
返信のスレッド化/ID には最新のメッセージが使われます。

設定（グローバルデフォルト + チャネル別オーバーライド）:

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
- 制御コマンドはデバウンスを迂回するため、単独のまま維持されます。同じ送信者の DM 結合に明示的にオプトインしたチャネルは、DM コマンドをデバウンスウィンドウ内に保持できるため、分割送信されたペイロードを同じエージェントターンに結合できます。

## セッションとデバイス

セッションは Gateway が所有し、クライアントは所有しません。

- ダイレクトチャットは、エージェントのメインセッションキーに統合されます。
- グループ/チャネルには独自のセッションキーがあります。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャネルを同じセッションにマッピングできますが、履歴がすべてのクライアントへ完全に
同期されるわけではありません。推奨事項: 長い会話では、コンテキストの分岐を避けるために
1 つの主要デバイスを使用してください。Control UI と TUI は常に
Gateway に基づくセッショントランスクリプトを表示するため、それらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## ツール結果メタデータ

ツール結果の `content` はモデルから見える結果です。ツール結果の `details` は、
UI レンダリング、診断、メディア配信、Plugin のためのランタイムメタデータです。

OpenClaw はその境界を明示的に保ちます。

- `toolResult.details` は、プロバイダーのリプレイと Compaction 入力の前に取り除かれます。
- 永続化されたセッショントランスクリプトは、制限された `details` のみを保持します。大きすぎるメタデータは、
  `persistedDetailsTruncated: true` が付いたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` だけでなく `content` に入れる必要があります。

## 受信本文と履歴コンテキスト

OpenClaw は **プロンプト本文**と**コマンド本文**を分離します。

- `BodyForAgent`: 現在のメッセージに対する、主なモデル向けテキスト。チャネル
  Plugin は、これを送信者の現在のプロンプトを含むテキストに集中させる必要があります。
- `Body`: レガシーのプロンプトフォールバック。これにはチャネルのエンベロープや
  任意の履歴ラッパーが含まれる場合がありますが、現在のチャネルは `BodyForAgent` が利用可能な場合、
  主要なモデル入力としてこれに依存すべきではありません。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシー別名（互換性のために維持）。

チャネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非ダイレクトチャット**（グループ/チャネル/ルーム）では、**現在のメッセージ本文**の先頭に
送信者ラベル（履歴エントリで使われるものと同じスタイル）が付けられます。これにより、リアルタイムのメッセージとキュー済み/履歴
メッセージがエージェントプロンプト内で一貫します。

履歴バッファは**保留中のみ**です。実行をトリガーしなかったグループメッセージ（たとえば、
メンションで制御されたメッセージ）を含み、セッショントランスクリプトにすでにあるメッセージは**除外**します。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴は
そのまま保たれます。履歴をラップするチャネルは、`CommandBody`（または
`RawBody`）を元のメッセージテキストに設定し、`Body` を結合されたプロンプトとして保持する必要があります。
構造化された履歴、返信、転送、チャネルメタデータは、プロンプト組み立て時に
ユーザーロールの信頼されないコンテキストブロックとしてレンダリングされます。
履歴バッファは `messages.groupChat.historyLimit`（グローバル
デフォルト）と、`channels.slack.historyLimit` や
`channels.telegram.accounts.<id>.historyLimit` のようなチャネル別オーバーライドで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れる、現在の実行へ誘導する、
またはフォローアップターン用に収集できます。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- デフォルトモードは `steer` で、ステアリングがキュー済みフォローアップ配信に
  フォールバックする場合は 500ms のフォローアップデバウンスがあります。
- モード: `steer`、`followup`、`collect`、`steer-backlog`、`interrupt`、および
  レガシーの 1 回 1 件処理の `queue` モード。

詳細: [コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering)。

## チャネル実行の所有権

チャネル Plugin は、メッセージがセッションキューに入る前に、順序を保持し、入力をデバウンスし、
トランスポートのバックプレッシャーを適用できます。エージェントターン自体の周囲に
別個のタイムアウトを課すべきではありません。メッセージがセッションにルーティングされると、
長時間実行される作業はセッション、ツール、ランタイムのライフサイクルによって管理されるため、
すべてのチャネルが遅いターンを一貫して報告し、復旧できます。

## ストリーミング、チャンク化、バッチ処理

ブロックストリーミングは、モデルがテキストブロックを生成するのに合わせて部分返信を送信します。
チャンク化はチャネルのテキスト制限を尊重し、フェンス付きコードの分割を避けます。

主要な設定:

- `agents.defaults.blockStreamingDefault`（`on|off`、デフォルトはオフ）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（アイドルベースのバッチ処理）
- `agents.defaults.humanDelay`（ブロック返信間の人間らしい一時停止）
- チャネルオーバーライド: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデルの推論を公開または非表示にできます。

- `/reasoning on|off|stream` は可視性を制御します。
- 推論コンテンツは、モデルによって生成された場合、トークン使用量に引き続きカウントされます。
- Telegram は、一時的な下書きバブルへの推論ストリームに対応しており、最終配信後に削除されます。永続的な推論出力には `/reasoning on` を使用します。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用量](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

送信メッセージの書式設定は `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp 受信プレフィックス）
- `replyToMode` とチャネル別デフォルトによる返信スレッド化

詳細: [設定](/ja-JP/gateway/config-agents#messages) とチャネルドキュメント。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに表示される返信を配信しない」ことを意味します。
ターンに生成された TTS 音声などの保留中のツールメディアもある場合、OpenClaw は
サイレントテキストを取り除きますが、メディア添付ファイルは引き続き配信します。
OpenClaw はその動作を会話タイプによって解決します。

- ダイレクト会話では、デフォルトでサイレンスを許可せず、単独のサイレント
  返信を短い可視フォールバックに書き換えます。
- グループ/チャネルでは、デフォルトでサイレンスを許可します。
- 内部オーケストレーションでは、デフォルトでサイレンスを許可します。

OpenClaw は、非ダイレクトチャットでアシスタントの返信前に発生する内部ランナー障害にも
サイレント返信を使用するため、グループ/チャネルには Gateway のエラー定型文が表示されません。
ダイレクトチャットでは、デフォルトで簡潔な失敗文が表示されます。
生のランナー詳細は、`/verbose` が `on` または `full` の場合にのみ表示されます。

デフォルトは `agents.defaults.silentReply` と
`agents.defaults.silentReplyRewrite` の下にあり、`surfaces.<id>.silentReply` と
`surfaces.<id>.silentReplyRewrite` はサーフェスごとにそれらをオーバーライドできます。

親セッションに保留中の生成済みサブエージェント実行が 1 つ以上ある場合、単独の
サイレント返信は書き換えられず、すべてのサーフェスで破棄されます。そのため、
親は子の完了イベントが実際の返信を配信するまで静かなままです。

## 関連

- [メッセージライフサイクルのリファクタリング](/ja-JP/concepts/message-lifecycle-refactor) - 永続的な送受信設計の目標
- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [再試行](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャネル](/ja-JP/channels) — メッセージングプラットフォーム連携
