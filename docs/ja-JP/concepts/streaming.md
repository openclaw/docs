---
read_when:
    - チャネルでストリーミングやチャンク分割がどのように機能するかの説明
    - ブロックストリーミングまたはチャネルのチャンク化動作の変更
    - 重複/早期ブロック返信またはチャンネルプレビューのストリーミングをデバッグする
summary: ストリーミング + チャンク化の挙動（ブロック返信、チャンネルプレビューのストリーミング、モードマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-06-27T11:17:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw には 2 つの別々のストリーミング層があります。

- **ブロックストリーミング（チャンネル）:** アシスタントの書き込み中に完了した**ブロック**を送信します。これは通常のチャンネルメッセージです（トークンデルタではありません）。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な**プレビューメッセージ**を更新します。

現時点では、チャンネルメッセージへの**真のトークンデルタストリーミング**はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（チャンネルメッセージ）

ブロックストリーミングは、アシスタント出力が利用可能になった時点で粗いチャンクとして送信します。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

凡例:

- `text_delta/events`: モデルストリームイベント（非ストリーミングモデルではまばらな場合があります）。
- `chunker`: 最小/最大境界 + 区切りの優先設定を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトはオフ）。
- チャンネル上書き: チャンネルごとに `"on"`/`"off"` を強制する `*.blockStreaming`（およびアカウント別の派生設定）。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリーミングされたブロックをマージ）。
- チャンネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャンネルのチャンクモード: `*.chunkMode`（デフォルトは `length`、`newline` は長さによるチャンク化の前に空行（段落境界）で分割）。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage`（デフォルト 17）は、UI でのクリッピングを避けるために縦に長い返信を分割します。

**境界の意味:**

- `text_end`: chunker が送出したらすぐにブロックをストリームし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ち、その後バッファされた出力をフラッシュします。

`message_end` でも、バッファされたテキストが `maxChars` を超える場合は chunker を使用するため、最後に複数のチャンクを送出できます。

### ブロックストリーミングでのメディア配信

ストリーミングメディアは、`mediaUrl` や
`mediaUrls` などの構造化されたペイロードフィールドを使用する必要があります。ストリーミングされたテキストは添付コマンドとして解析されません。ブロック
ストリーミングがメディアを早期に送信すると、OpenClaw はそのターンでの配信を記憶します。
最終アシスタントペイロードが同じメディア URL を繰り返す場合、最終配信では添付を再送する代わりに重複メディアを取り除きます。

完全に重複する最終ペイロードは抑制されます。最終ペイロードが、すでにストリーミング済みのメディアの前後に
別のテキストを追加する場合、OpenClaw はメディアを 1 回だけ配信したまま
新しいテキストを送信します。これにより、Telegram などのチャンネルで音声
メモやファイルが重複することを防ぎます。

## チャンク化アルゴリズム（下限/上限）

ブロックチャンク化は `EmbeddedBlockChunker` によって実装されています。

- **下限:** バッファ >= `minChars` になるまで送出しません（強制時を除く）。
- **上限:** `maxChars` より前での分割を優先します。強制時は `maxChars` で分割します。
- **区切りの優先順位:** `paragraph` → `newline` → `sentence` → `whitespace` → ハード区切り。
- **コードフェンス:** フェンス内では決して分割しません。`maxChars` で強制分割する場合は、Markdown を有効に保つためにフェンスを閉じて再度開きます。

`maxChars` はチャンネルの `textChunkLimit` にクランプされるため、チャンネルごとの上限を超えることはできません。

## 結合（ストリーミングされたブロックのマージ）

ブロックストリーミングが有効な場合、OpenClaw は送信前に**連続するブロックチャンクをマージ**できます。これにより、段階的な出力を維持しながら「1 行だけのスパム」を減らします。

- 結合はフラッシュ前に**アイドル間隔**（`idleMs`）を待ちます。
- バッファは `maxChars` で上限が設定され、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストが蓄積されるまで小さな断片を送信しないようにします
  （最終フラッシュでは残りのテキストを必ず送信します）。
- 結合文字は `blockStreamingChunk.breakPreference` から導出されます
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → スペース）。
- チャンネル上書きは `*.blockStreamingCoalesce` で利用できます（アカウント別設定を含む）。
- 上書きされない限り、デフォルトの結合 `minChars` は Signal/Slack/Discord で 1500 に引き上げられます。

## ブロック間の人間らしいペース配分

ブロックストリーミングが有効な場合、ブロック返信の間（最初のブロックの後）に**ランダム化された一時停止**を追加できます。これにより、複数バブルの応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay`（`agents.list[].humanDelay` でエージェントごとに上書き）。
- モード: `off`（デフォルト）、`natural`（800-2500ms）、`custom`（`minMs`/`maxMs`）。
- **ブロック返信**にのみ適用され、最終返信やツール要約には適用されません。

## 「チャンクをストリームするか、すべてを送るか」

これは次に対応します。

- **チャンクをストリーム:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（進行に合わせて送出）。Telegram 以外のチャンネルでは `*.blockStreaming: true` も必要です。
- **最後にすべてをストリーム:** `blockStreamingBreak: "message_end"`（1 回フラッシュし、非常に長い場合は複数チャンクになることがあります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャンネル注記:** `*.blockStreaming` が明示的に `true` に設定されていない限り、ブロックストリーミングは**オフ**です。チャンネルはブロック返信なしでライブプレビュー（`channels.<channel>.streaming`）をストリームできます。

設定場所の注意: `blockStreaming*` のデフォルトはルート設定ではなく
`agents.defaults` の下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化します。
- `partial`: 最新テキストで置き換えられる単一プレビュー。
- `block`: チャンク化/追記の段階でプレビューを更新します。
- `progress`: 生成中は進捗/ステータスプレビュー、完了時に最終回答。

`streaming.mode: "block"` は、Discord や Telegram などの編集可能なチャンネル向けのプレビューストリーミングモードです。そこでチャンネルブロック配信を有効にするものではありません。
通常のブロック返信が必要な場合は、`streaming.block.enabled` または従来の `blockStreaming` チャンネルキーを使用してください。Microsoft Teams は例外です。下書きプレビューブロック転送を持たないため、`streaming.mode: "block"` はネイティブの partial/progress ストリーミングではなく、Teams のブロック配信に対応します。

### チャンネル対応

| チャンネル | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 編集可能な進捗下書き |
| Discord    | ✅    | ✅        | ✅      | 編集可能な進捗下書き |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | ネイティブ進捗ストリーム  |

Slack のみ:

- `channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode="partial"` の場合に Slack ネイティブストリーミング API 呼び出しを切り替えます（デフォルト: `true`）。
- Slack ネイティブストリーミングと Slack アシスタントのスレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM ではそのスレッド形式のプレビューは表示されませんが、Slack の下書きプレビュー投稿と編集は引き続き使用できます。

従来キーの移行:

- Telegram: 従来の `streamMode` とスカラー/ブール値の `streaming` 値は検出され、doctor/config 互換パスによって `streaming.mode` に移行されます。
- Discord: `streamMode` + ブール値の `streaming` は、`streaming` enum のランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- Slack: `streamMode` は `streaming.mode` のランタイムエイリアスとして残ります。ブール値の `streaming` は `streaming.mode` と `streaming.nativeTransport` のランタイムエイリアスとして残ります。従来の `nativeStreaming` は `streaming.nativeTransport` のランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。

### ランタイム動作

Telegram:

- DM とグループ/トピック全体で、`sendMessage` + `editMessageText` のプレビュー更新を使用します。
- 短い初期プレビューはプッシュ通知 UX のために引き続きデバウンスされますが、Telegram は現在、アクティブな実行が視覚的に無音のままにならないよう、境界付きの遅延後にそれらを実体化します。
- 最終テキストはアクティブなプレビューをその場で編集します。長い最終出力は、そのメッセージを最初のチャンクに再利用し、残りのチャンクのみを送信します。
- `block` モードは `streaming.preview.chunk.maxChars`（デフォルト 800、Telegram の 4096 編集制限で上限）でプレビューを新しいメッセージにローテートします。他のモードでは 1 つのプレビューを最大 4096 文字まで拡張します。
- `progress` モードはツール進行状況を編集可能なステータス下書きに保持し、回答ストリーミングがアクティブだがツール行がまだない場合にステータスラベルを実体化し、完了時にその下書きをクリアして、通常の配信で最終回答を送信します。
- 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします。
- Telegram ブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます（二重ストリーミングを避けるため）。
- `/reasoning stream` は、一時的なプレビューに reasoning を書き込み、最終配信後に削除できます。

Discord:

- 送信 + 編集のプレビューメッセージを使用します。
- `block` モードは下書きチャンク化（`draftChunk`）を使用します。
- Discord ブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信ペイロードは、新しい下書きをフラッシュせずに保留中のプレビューをキャンセルし、その後通常の配信を使用します。

Slack:

- `partial` は利用可能な場合、Slack ネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使用できます。
- `block` は追記形式の下書きプレビューを使用します。
- `progress` はステータスプレビューテキストを使用し、その後に最終回答を送信します。
- 返信スレッドのないトップレベル DM は、Slack ネイティブストリーミングの代わりに下書きプレビュー投稿と編集を使用します。
- ネイティブおよび下書きプレビューストリーミングはそのターンのブロック返信を抑制するため、Slack の返信は 1 つの配信パスだけでストリームされます。
- 最終メディア/エラーペイロードと progress の最終出力は、使い捨ての下書きメッセージを作成しません。プレビューを編集できるテキスト/ブロックの最終出力だけが、保留中の下書きテキストをフラッシュします。

Mattermost:

- thinking、ツールアクティビティ、部分的な返信テキストを単一の下書きプレビュー投稿にストリームし、最終回答を安全に送信できる時点でその場で確定します。
- 確定時にプレビュー投稿が削除されているか、その他の理由で利用できない場合は、新しい最終投稿の送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビュー投稿をフラッシュする代わりに、通常配信の前に保留中のプレビュー更新をキャンセルします。

Matrix:

- 最終テキストがプレビューイベントを再利用できる場合、下書きプレビューはその場で確定されます。
- メディアのみ、エラー、返信ターゲット不一致の最終出力は、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに表示されている古いプレビューは redacted されます。

### ツール進行状況のプレビュー更新

プレビューストリーミングには、最終返信に先立って、ツール実行中に同じプレビューメッセージ内に表示される「Web を検索中」「ファイルを読み込み中」「ツールを呼び出し中」のような短いステータス行である**ツール進行状況**更新も含めることができます。Codex app-server モードでは、Codex の preamble/commentary メッセージが同じプレビューパスを使用するため、「確認しています...」のような短い進捗メモを、最終回答の一部にすることなく編集可能な下書きにストリームできます。これにより、複数ステップのツールターンは、最初の thinking プレビューと最終回答の間で無音になるのではなく、視覚的に動き続けます。

長時間実行されるツールは、戻る前に型付きの進行状況を送出する場合があります。たとえば、
`web_fetch` は開始時に 5 秒タイマーをセットします。fetch がまだ
保留中の場合、プレビューは `Fetching page content...` を表示できます。fetch がそれ以前に完了またはキャンセルされた場合、進行状況行は送出されません。その後の最終ツール
結果は、通常どおりモデルに配信されます。

サポートされるサーフェス:

- **Discord**、**Slack**、**Telegram**、**Matrix** は、プレビューストリーミングが有効な場合、デフォルトでツール進行状況と Codex プリアンブル更新をライブプレビュー編集にストリーミングします。Microsoft Teams は個人チャットでネイティブの進行状況ストリームを使用します。
- Telegram は `v2026.4.22` 以降、ツール進行状況のプレビュー更新を有効にして出荷されています。有効のままにすることで、そのリリース済み動作を維持できます。
- **Mattermost** はすでにツールアクティビティを単一のドラフトプレビュー投稿に折りたたみます（上記参照）。
- ツール進行状況の編集は、アクティブなプレビューストリーミングモードに従います。プレビューストリーミングが `off` の場合、またはブロックストリーミングがメッセージを引き継いだ場合はスキップされます。Telegram では、`streaming.mode: "off"` は最終のみです。承認プロンプト、メディアペイロード、エラーは通常どおりルーティングされますが、汎用的な進行状況の雑多な通知も、スタンドアロンのステータスメッセージとして配信される代わりに抑制されます。
- プレビューストリーミングは維持しつつツール進行状況行を非表示にするには、そのチャネルの `streaming.preview.toolProgress` を `false` に設定します。コマンド/実行テキストを非表示にしつつツール進行状況行を表示したままにするには、`streaming.preview.commandText` を `"status"` に、または `streaming.progress.commandText` を `"status"` に設定します。デフォルトはリリース済み動作を維持するために `"raw"` です。このポリシーは、Discord、Matrix、Microsoft Teams、Mattermost、Slack ドラフトプレビュー、Telegram など、OpenClaw のコンパクトな進行状況レンダラーを使用するドラフト/進行状況チャネルで共有されます。プレビュー編集を完全に無効にするには、`streaming.mode` を `off` に設定します。
- Telegram の選択引用返信は例外です。`replyToMode` が `"off"` ではなく、選択引用テキストが存在する場合、OpenClaw はそのターンの回答プレビューストリームをスキップするため、ツール進行状況のプレビュー行はレンダリングできません。選択引用テキストがない現在メッセージへの返信では、プレビューストリーミングは引き続き維持されます。詳細は [Telegram チャネルドキュメント](/ja-JP/channels/telegram) を参照してください。

進行状況行は表示したまま、生のコマンド/実行テキストを非表示にします。

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

同じ形を別のコンパクト進行状況チャネルキーの下で使用します。たとえば `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`、または Slack ドラフトプレビューです。進行状況ドラフトモードでは、同じポリシーを `streaming.progress` の下に置きます。

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## 関連

- [メッセージライフサイクルのリファクタリング](/ja-JP/concepts/message-lifecycle-refactor) - 共有プレビュー、編集、ストリーム、最終化設計の対象
- [進行状況ドラフト](/ja-JP/concepts/progress-drafts) - 長いターンの間に更新される、表示可能な作業中メッセージ
- [メッセージ](/ja-JP/concepts/messages) - メッセージライフサイクルと配信
- [再試行](/ja-JP/concepts/retry) - 配信失敗時の再試行動作
- [チャネル](/ja-JP/channels) - チャネルごとのストリーミング対応
