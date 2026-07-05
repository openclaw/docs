---
read_when:
    - 受信メッセージが返信になる仕組みを説明する
    - セッション、キューイングモード、ストリーミング動作の明確化
    - 推論の可視性と使用上の影響を文書化する
summary: メッセージフロー、セッション、キューイング、推論の可視性
title: メッセージ
x-i18n:
    generated_at: "2026-07-05T11:17:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92146d8fe08aedfea3ae01b653a303da626651b33b39d6beb22ef867e13eef2f
    source_path: concepts/messages.md
    workflow: 16
---

インバウンドメッセージは、ルーティング、重複排除/デバウンス、エージェント実行、アウトバウンド配信を通って移動します。

```text
Inbound message
  -> routing/bindings -> session key
  -> dedupe + debounce
  -> queue (if a run is already active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

主要な設定サーフェス:

- プレフィックス、キューイング、インバウンドデバウンス、グループ動作用の `messages.*`。
- ブロックストリーミング、チャンク化、サイレント返信のデフォルト用の `agents.defaults.*`。
- チャンネルごとの上限とストリーミング切り替え用のチャンネルオーバーライド (`channels.telegram.*`、`channels.whatsapp.*` など)。

完全なスキーマは [設定](/ja-JP/gateway/configuration) を参照してください。

## インバウンド重複排除

チャンネルは再接続後に同じメッセージを再配信することがあります。OpenClaw は、エージェントスコープ、チャンネルルート (チャンネル + ピア + アカウント + スレッド)、メッセージ ID をキーにしたインメモリキャッシュを保持するため、再配信されたメッセージが 2 回目のエージェント実行をトリガーすることはありません。キャッシュエントリは 20 分後、または 5000 件のエントリが追跡された時点のどちらか早い方で期限切れになります。

## インバウンドデバウンス

同じ送信者からの短時間に連続したテキストメッセージは、`messages.inbound` によって 1 つのエージェントターンにバッチ化できます。デバウンスはチャンネル + 会話ごとにスコープされ、返信のスレッド化/ID には最新のメッセージを使用します。

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- デバウンスはテキストのみのメッセージに適用されます。メディア/添付ファイルは即座にフラッシュされます。
- 制御コマンド (stop/abort/status など) はデバウンスをバイパスし、即座にディスパッチされます。
- デフォルトでは無効です。`messages.inbound.debounceMs` には組み込みのデフォルトがないため、デバウンスは (グローバルまたはチャンネルごとに) 設定した場合にのみ有効になります。
- iMessage の `coalesceSameSenderDms` オプトインが唯一の例外です。これは Apple の command+URL 分割送信が 1 つのターンとして到着するのに十分な時間、同じ送信者の DM テキスト (コマンドを含む) をすべて保持します。グループチャットはこの設定に関係なく常に即座にディスパッチされます。

## セッションとデバイス

セッションはクライアントではなく Gateway が所有します。

- ダイレクトチャットはエージェントのメインセッションキーにまとめられます。
- グループ/チャンネルはそれぞれ独自のセッションキーを取得します。
- セッションストアとトランスクリプトは Gateway ホスト上に存在します。

複数のデバイス/チャンネルを同じセッションにマップできますが、履歴がすべてのクライアントへ完全に同期されるわけではありません。コンテキストの分岐を避けるため、長い会話には 1 つの主要デバイスを使用してください。Control UI と TUI は常に Gateway に裏付けられたセッショントランスクリプトを表示するため、これらが信頼できる情報源です。

詳細: [セッション管理](/ja-JP/concepts/session)。

## プロンプト本文と履歴コンテキスト

チャンネル Plugin は、インバウンドコンテキスト上の複数のテキストフィールドを、推奨度の高い順に設定します。

| フィールド        | 目的                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 現在のターン向けのモデル対面テキスト。未設定の場合は `CommandBody` / `RawBody` / `Body` にフォールバックします。 |
| `BodyForCommands` | ディレクティブ/コマンド解析に使用されるクリーンなテキスト。未設定の場合は `CommandBody` / `RawBody` / `Body` にフォールバックします。 |
| `CommandBody`     | レガシーの中間本文。`BodyForCommands` を優先してください。                                                  |
| `RawBody`         | `CommandBody` の非推奨エイリアス。                                                                         |
| `Body`            | レガシーのプロンプト本文。チャンネルのエンベロープや履歴ラッパーを含む場合があります。                    |

チャンネルが履歴を提供する場合、次のようにラップします。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

非ダイレクトチャット (グループ/チャンネル/ルーム) では、現在のメッセージ本文に送信者ラベルがプレフィックスされ、履歴エントリで使われるスタイルと一致します。ディレクティブの除去は現在のメッセージセクションにのみ適用されるため、履歴はそのまま残ります。履歴をラップするチャンネルは、`BodyForCommands` (またはレガシーの `CommandBody` / `RawBody`) を元のメッセージテキストに設定し、`Body` は結合済みプロンプトとして保持する必要があります。

履歴バッファは保留中のものだけです。つまり、実行をトリガーしなかったグループメッセージ (たとえば、メンションでゲートされたメッセージ) を含み、すでにセッショントランスクリプトにあるメッセージは除外します。構造化履歴、返信、転送、チャンネルメタデータは、プロンプト組み立て時に信頼されないユーザーロールのコンテキストブロックとしてレンダリングされます。

履歴サイズは `messages.groupChat.historyLimit` (グローバルデフォルト) または `channels.slack.historyLimit` や `channels.telegram.accounts.<id>.historyLimit` などのチャンネルごとのオーバーライドで設定します (`0` に設定すると無効化)。

## ツール結果メタデータ

ツール結果の `content` はモデルに見える結果です。`details` は UI レンダリング、診断、メディア配信、Plugin 用のランタイムメタデータです。

- `toolResult.details` はプロバイダー再生前と Compaction 入力前に取り除かれます。
- 永続化されたセッショントランスクリプトは、境界付けられた `details` のみを保持します。大きすぎるメタデータは `persistedDetailsTruncated: true` が付いたコンパクトな要約に置き換えられます。
- Plugin とツールは、モデルが読む必要のあるテキストを `details` だけでなく `content` に入れる必要があります。

## キューイングとフォローアップ

実行がすでにアクティブな場合、インバウンドメッセージはデフォルトでその実行に向けられます。`messages.queue` がモードを制御します。

| モード            | 動作                                                |
| ----------------- | --------------------------------------------------- |
| `steer` (デフォルト) | 新しいプロンプトをアクティブな実行に注入します。 |
| `followup`        | アクティブな実行が終了した後にメッセージを実行します。 |
| `collect`         | 互換性のあるメッセージを後続の 1 ターンにバッチ化します。 |
| `interrupt`       | アクティブな実行を中止し、その後で最新のプロンプトを開始します。 |

デフォルト: `messages.queue.debounceMs` は 500ms (steer、followup、collect のバッチ化に同様に適用)、`messages.queue.cap` は 20 件のキュー済みメッセージ、`messages.queue.drop` は `summarize` です (`old` と `new` も利用可能)。チャンネルごとのオーバーライドは `messages.queue.byChannel` と `messages.queue.debounceMsByChannel` で設定します。

詳細: [コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering)。

## チャンネル実行の所有権

チャンネル Plugin は、メッセージがセッションキューに入る前に順序を保持し、入力をデバウンスし、トランスポートのバックプレッシャーを適用できます。エージェントターン自体を囲む別個のタイムアウトを課すべきではありません。メッセージがセッションにルーティングされると、セッション、ツール、ランタイムのライフサイクルが長時間実行される作業を管理するため、すべてのチャンネルが遅いターンを一貫して報告し、回復できます。

## ストリーミング、チャンク化、バッチ化

ブロックストリーミングは、モデルがテキストブロックを生成するにつれて部分的な返信を送信します。チャンク化はチャンネルのテキスト制限を尊重し、フェンス付きコードの分割を避けます。

- `agents.defaults.blockStreamingDefault` (`on|off`、デフォルト `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (アイドルベースのバッチ化)
- `agents.defaults.humanDelay` (ブロック返信間の人間らしい間)
- チャンネルオーバーライド: `*.blockStreaming` と `*.blockStreamingCoalesce` (Telegram を含むすべてのチャンネルで、`*.blockStreaming` が明示的に `true` に設定されていない限り、ブロックストリーミングはオフです)。

詳細: [ストリーミング + チャンク化](/ja-JP/concepts/streaming)。

## 推論の可視性とトークン

- `/reasoning on|off|stream` は可視性を制御します。
- モデルが推論内容を生成する場合、その内容もトークン使用量にカウントされます。
- Telegram は、一時的な下書きバブルへの推論ストリーミングをサポートしており、最終配信後に削除されます。永続的な推論出力には `/reasoning on` を使用してください。

詳細: [思考 + 推論ディレクティブ](/ja-JP/tools/thinking) と [トークン使用量](/ja-JP/reference/token-use)。

## プレフィックス、スレッド化、返信

- アウトバウンドプレフィックスのカスケード: `messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp にはインバウンドプレフィックス用の `channels.whatsapp.messagePrefix` もあります。
- `replyToMode` とチャンネルごとのデフォルトによる返信スレッド化。

詳細: [設定](/ja-JP/gateway/config-agents#messages) とチャンネルドキュメント。

## サイレント返信

サイレントトークン `NO_REPLY` (大文字小文字を区別しないため `no_reply` も一致) は、「ユーザーに見える返信を配信しない」ことを意味します。ターンに生成された TTS 音声などの保留中のツールメディアもある場合、OpenClaw はサイレントテキストを取り除きますが、メディア添付ファイルは引き続き配信します。

サイレンスポリシーは会話タイプによって解決されます。

- ダイレクト会話は `NO_REPLY` プロンプトガイダンスを受け取りません。ダイレクト実行が誤って素のサイレントトークンを返した場合、OpenClaw はそれを書き換えたり配信したりせずに抑制します。
- グループ/チャンネルはデフォルトでサイレンスを許可します。`message_tool` の可視返信モードでは、サイレンスはモデルが `message(action=send)` を呼び出さないことを意味します。
- 内部オーケストレーションはデフォルトでサイレンスを許可します。

デフォルトは `agents.defaults.silentReply` 配下にあります。`surfaces.<id>.silentReply` はサーフェスごとにグループ/内部ポリシーをオーバーライドできます。

OpenClaw は非ダイレクトチャットでの汎用的な内部ランナー失敗にもサイレント返信を使用するため、グループ/チャンネルには Gateway のエラー定型文が表示されません。認証不足、レート制限、過負荷通知など、ユーザー向けの回復文がある分類済みの失敗は引き続き配信できます。ダイレクトチャットはデフォルトでコンパクトな失敗文を表示します。生のランナー詳細は `/verbose full` が有効な場合にのみ表示されます。

素のサイレント返信はすべてのサーフェスでドロップされるため、親セッションはセンチネルテキストをフォールバックの雑談に書き換えることなく静かなままです。

## 関連

- [メッセージライフサイクルのリファクター](/ja-JP/concepts/message-lifecycle-refactor) - 耐久性のある送受信設計のターゲット
- [ストリーミング](/ja-JP/concepts/streaming) - リアルタイムメッセージ配信
- [再試行](/ja-JP/concepts/retry) - メッセージ配信の再試行動作
- [キュー](/ja-JP/concepts/queue) - メッセージ処理キュー
- [チャンネル](/ja-JP/channels) - メッセージングプラットフォーム連携
