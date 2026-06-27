---
read_when:
    - 受信メッセージが返信になる仕組みを説明する
    - セッション、キューイングモード、またはストリーミング動作の明確化
    - 推論の可視性と使用上の影響を文書化する
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-06-27T11:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw は、セッション解決、キューイング、ストリーミング、ツール実行、推論の可視性のパイプラインを通じて受信メッセージを処理します。このページでは、受信メッセージから返信までの経路を示します。

## メッセージフロー（高レベル）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な調整項目は設定にあります。

- `messages.*`: プレフィックス、キューイング、グループの挙動。
- `agents.defaults.*`: ブロックストリーミングとチャンク化のデフォルト。
- チャネル上書き（`channels.whatsapp.*`、`channels.telegram.*` など）: 上限とストリーミング切り替え。

完全なスキーマについては、[設定](/ja-JP/gateway/configuration)を参照してください。

## 受信重複排除

チャネルは、再接続後に同じメッセージを再配信することがあります。OpenClaw は、チャネル/アカウント/ピア/セッション/メッセージ ID をキーにした短命のキャッシュを保持し、重複配信が別のエージェント実行を引き起こさないようにします。

## 受信デバウンス

**同じ送信者**からの連続した高速なメッセージは、`messages.inbound` によって 1 つのエージェントターンにまとめられます。デバウンスはチャネル + 会話ごとにスコープされ、返信のスレッド化/ID には最新のメッセージを使用します。

設定（グローバルデフォルト + チャネル別上書き）:

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
- 制御コマンドはデバウンスをバイパスするため、単独のまま扱われます。同一送信者の DM 結合に明示的にオプトインしているチャネルでは、DM コマンドをデバウンスウィンドウ内に保持できるため、分割送信されたペイロードを同じエージェントターンに参加させられます。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- 直接チャットはエージェントのメインセッションキーに集約されます。
- グループ/チャネルは独自のセッションキーを持ちます。
- セッションストアとトランスクリプトは Gateway ホスト上にあります。

複数のデバイス/チャネルを同じセッションにマップできますが、履歴がすべてのクライアントへ完全に同期されるわけではありません。推奨: コンテキストの分岐を避けるため、長い会話では 1 つの主要デバイスを使用してください。Control UI と TUI は常に Gateway に裏付けられたセッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## ツール結果メタデータ

ツール結果の `content` はモデルに見える結果です。ツール結果の `details` は、UI レンダリング、診断、メディア配信、Plugin のためのランタイムメタデータです。

OpenClaw はその境界を明示的に保ちます。

- `toolResult.details` は、プロバイダー再生と Compaction 入力の前に取り除かれます。
- 永続化されたセッショントランスクリプトは、制限内の `details` のみを保持します。過大なメタデータは、`persistedDetailsTruncated: true` とマークされたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` だけではなく `content` に入れる必要があります。

## 受信本文と履歴コンテキスト

OpenClaw は**プロンプト本文**と**コマンド本文**を分離します。

- `BodyForAgent`: 現在のメッセージの主要なモデル向けテキスト。チャネル Plugin は、送信者の現在のプロンプトを含むテキストに集中させる必要があります。
- `Body`: レガシーなプロンプトフォールバック。これにはチャネルエンベロープや任意の履歴ラッパーが含まれる場合がありますが、現在のチャネルは `BodyForAgent` が利用可能な場合、主要なモデル入力としてこれに依存すべきではありません。
- `CommandBody`: ディレクティブ/コマンド解析のための生のユーザーテキスト。
- `RawBody`: `CommandBody` のレガシーエイリアス（互換性のために保持）。

チャネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非直接チャット**（グループ/チャネル/ルーム）では、**現在のメッセージ本文**に送信者ラベルがプレフィックスとして付与されます（履歴エントリで使用されるものと同じスタイル）。これにより、リアルタイムメッセージとキュー済み/履歴メッセージがエージェントプロンプト内で一貫します。

履歴バッファは**保留中のみ**です。実行をトリガーしなかったグループメッセージ（例: メンションゲートされたメッセージ）を含み、セッショントランスクリプトにすでに存在するメッセージは**除外**します。

ディレクティブの除去は**現在のメッセージ**セクションにのみ適用されるため、履歴はそのまま残ります。履歴をラップするチャネルは、`CommandBody`（または `RawBody`）を元のメッセージテキストに設定し、`Body` を結合済みプロンプトとして保持する必要があります。構造化された履歴、返信、転送、チャネルメタデータは、プロンプト組み立て中にユーザーロールの信頼されていないコンテキストブロックとしてレンダリングされます。
履歴バッファは、`messages.groupChat.historyLimit`（グローバルデフォルト）と、`channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` のようなチャネル別上書きで設定できます（無効化するには `0` を設定）。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはデフォルトで現在の実行に誘導されます。`messages.queue` は、アクティブ実行中のメッセージを誘導するか、後で処理するためにキューに入れるか、1 つの後続ターンに集約するか、アクティブな実行を中断するかを選択します。

- `messages.queue`（および `messages.queue.byChannel`）で設定します。
- デフォルトモードは `steer` で、Codex の誘導バッチとフォローアップ/集約キューには 500ms のデバウンスがあります。
- モード: `steer`、`followup`、`collect`、`interrupt`。

詳細: [コマンドキュー](/ja-JP/concepts/queue)と[誘導キュー](/ja-JP/concepts/queue-steering)。

## チャネル実行の所有権

チャネル Plugin は、メッセージがセッションキューに入る前に、順序を保持し、入力をデバウンスし、トランスポートのバックプレッシャーを適用できます。エージェントターン自体に別個のタイムアウトを課すべきではありません。メッセージがセッションにルーティングされると、長時間実行される作業はセッション、ツール、ランタイムのライフサイクルによって管理されるため、すべてのチャネルが遅いターンを一貫して報告し、回復できます。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するにつれて部分返信を送信します。
チャンク化はチャネルのテキスト制限を尊重し、フェンス付きコードの分割を避けます。

主要な設定:

- `agents.defaults.blockStreamingDefault` (`on|off`、デフォルトはオフ)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (アイドルベースのバッチ化)
- `agents.defaults.humanDelay` (ブロック返信間の人間らしい一時停止)
- チャネル上書き: `*.blockStreaming` と `*.blockStreamingCoalesce`（Telegram 以外のチャネルでは明示的な `*.blockStreaming: true` が必要）

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

OpenClaw はモデル推論を表示または非表示にできます。

- `/reasoning on|off|stream` は可視性を制御します。
- 推論コンテンツは、モデルによって生成された場合、引き続きトークン使用量にカウントされます。
- Telegram は、一時的な下書きバブルへの推論ストリームをサポートし、最終配信後に削除されます。永続的な推論出力には `/reasoning on` を使用してください。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking)と[トークン使用量](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

送信メッセージのフォーマットは `messages` に集約されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`（送信プレフィックスのカスケード）、および `channels.whatsapp.messagePrefix`（WhatsApp 受信プレフィックス）
- `replyToMode` とチャネル別デフォルトによる返信スレッド化

詳細: [設定](/ja-JP/gateway/config-agents#messages)とチャネルドキュメント。

## サイレント返信

正確なサイレントトークン `NO_REPLY` / `no_reply` は「ユーザーに見える返信を配信しない」ことを意味します。
ターンに生成された TTS 音声などの保留中のツールメディアもある場合、OpenClaw はサイレントテキストを取り除きますが、メディア添付は引き続き配信します。
OpenClaw はその挙動を会話タイプごとに解決します。

- 直接会話は `NO_REPLY` プロンプトガイダンスを受け取りません。直接実行が誤って裸のサイレントトークンを返した場合、OpenClaw はそれを書き換えたり配信したりせずに抑制します。
- グループ/チャネルでは、デフォルトで自動グループ返信の場合のみ沈黙を許可します。`message_tool` の表示返信モードでは、沈黙はモデルが `message(action=send)` を呼び出さないことを意味します。
- 内部オーケストレーションでは、デフォルトで沈黙が許可されます。

OpenClaw は、非直接チャットでの汎用的な内部ランナー障害にもサイレント返信を使用するため、グループ/チャネルには Gateway エラーの定型文が表示されません。
認証不足、レート制限、過負荷通知など、ユーザー向けの回復コピーを持つ分類済み障害は引き続き配信できます。直接チャットではデフォルトでコンパクトな障害コピーが表示されます。生のランナー詳細は、`/verbose full` が有効な場合にのみ表示されます。

デフォルトは `agents.defaults.silentReply` 配下にあります。`surfaces.<id>.silentReply` は、サーフェスごとにグループ/内部ポリシーを上書きできます。

裸のサイレント返信はすべてのサーフェスでドロップされるため、親セッションはセンチネルテキストをフォールバックのおしゃべりに書き換える代わりに静かなままになります。

## 関連

- [メッセージライフサイクルのリファクタリング](/ja-JP/concepts/message-lifecycle-refactor) - 耐久性のある送受信設計の目標
- [ストリーミング](/ja-JP/concepts/streaming) — リアルタイムメッセージ配信
- [再試行](/ja-JP/concepts/retry) — メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) — メッセージ処理キュー
- [チャネル](/ja-JP/channels) — メッセージングプラットフォーム連携
