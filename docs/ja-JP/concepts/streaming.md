---
read_when:
    - チャンネルでストリーミングまたはチャンク化がどのように機能するかを説明する
    - ブロックストリーミングまたはチャネルのチャンク化動作の変更
    - 重複または早期のブロック返信やチャンネルプレビューのストリーミングをデバッグする
summary: ストリーミング + チャンク化の動作 (ブロック返信、チャンネルプレビューストリーミング、モードマッピング)
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-05-04T07:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw には、2 つの別々のストリーミングレイヤーがあります。

- **ブロックストリーミング（チャンネル）:** アシスタントが書き込み中に、完了した**ブロック**を送信します。これらは通常のチャンネルメッセージです（トークン差分ではありません）。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な**プレビューメッセージ**を更新します。

現在、チャンネルメッセージへの**真のトークン差分ストリーミング**はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（チャンネルメッセージ）

ブロックストリーミングは、利用可能になったアシスタント出力を大きめのチャンクで送信します。

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

- `text_delta/events`: モデルのストリームイベント（非ストリーミングモデルではまばらな場合があります）。
- `chunker`: 最小/最大境界 + 区切り優先度を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトはオフ）。
- チャンネル上書き: チャンネルごとに `"on"`/`"off"` を強制する `*.blockStreaming`（およびアカウントごとのバリアント）。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリーミングされたブロックを結合）。
- チャンネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャンネルのチャンクモード: `*.chunkMode`（デフォルトは `length`、`newline` は長さによるチャンク化の前に空行（段落境界）で分割します）。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage`（デフォルトは 17）は、UI の切り詰めを避けるために縦に長い返信を分割します。

**境界の意味:**

- `text_end`: chunker が送信したらすぐにブロックをストリーミングし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ち、その後バッファされた出力をフラッシュします。

バッファされたテキストが `maxChars` を超える場合、`message_end` でも chunker が使われるため、最後に複数のチャンクを送信することがあります。

### ブロックストリーミングでのメディア配信

`MEDIA:` ディレクティブは通常の配信メタデータです。ブロックストリーミングがメディアブロックを早期に送信すると、OpenClaw はそのターンの配信を記憶します。最終的なアシスタントペイロードが同じメディア URL を繰り返す場合、最終配信では添付ファイルを再送信する代わりに重複メディアを取り除きます。

完全に重複する最終ペイロードは抑制されます。最終ペイロードが、すでにストリーミングされたメディアの周囲に別個のテキストを追加している場合、OpenClaw はメディアを 1 回だけ配信したまま、新しいテキストを送信します。これにより、エージェントがストリーミング中に `MEDIA:` を送信し、プロバイダーも完了した返信にそれを含める場合に、Telegram などのチャンネルで音声メモやファイルが重複するのを防ぎます。

## チャンク化アルゴリズム（低/高境界）

ブロックチャンク化は `EmbeddedBlockChunker` によって実装されています。

- **低境界:** バッファ >= `minChars` になるまで送信しません（強制時を除く）。
- **高境界:** `maxChars` より前での分割を優先します。強制時は `maxChars` で分割します。
- **区切り優先度:** `paragraph` → `newline` → `sentence` → `whitespace` → ハード区切り。
- **コードフェンス:** フェンス内部では決して分割しません。`maxChars` で強制される場合は、Markdown の有効性を保つためにフェンスを閉じて再オープンします。

`maxChars` はチャンネルの `textChunkLimit` にクランプされるため、チャンネルごとの上限を超えることはできません。

## 結合（ストリーミングされたブロックのマージ）

ブロックストリーミングが有効な場合、OpenClaw は送信前に**連続するブロックチャンクを結合**できます。これにより、段階的な出力を提供しながら「1 行だけの大量送信」を減らせます。

- 結合は、フラッシュ前に**アイドル間隔**（`idleMs`）を待ちます。
- バッファは `maxChars` で制限され、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストが蓄積されるまで小さな断片の送信を防ぎます（最終フラッシュでは常に残りのテキストを送信します）。
- 結合文字列は `blockStreamingChunk.breakPreference` から導出されます（`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → スペース）。
- チャンネル上書きは `*.blockStreamingCoalesce` で利用できます（アカウントごとの設定を含む）。
- デフォルトの結合 `minChars` は、上書きされない限り Signal/Slack/Discord では 1500 に引き上げられます。

## ブロック間の人間らしいペーシング

ブロックストリーミングが有効な場合、ブロック返信の間（最初のブロックの後）に**ランダム化された一時停止**を追加できます。これにより、複数の吹き出しからなる応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay`（エージェントごとに `agents.list[].humanDelay` で上書き）。
- モード: `off`（デフォルト）、`natural`（800〜2500ms）、`custom`（`minMs`/`maxMs`）。
- **ブロック返信**にのみ適用され、最終返信やツール要約には適用されません。

## 「チャンクをストリーミングするか、すべてを送るか」

これは次に対応します。

- **チャンクをストリーミング:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（進行に合わせて送信）。Telegram 以外のチャンネルでは `*.blockStreaming: true` も必要です。
- **最後にすべてをストリーミング:** `blockStreamingBreak: "message_end"`（1 回フラッシュ。非常に長い場合は複数チャンクになる可能性があります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャンネルの注記:** `*.blockStreaming` が明示的に `true` に設定されていない限り、ブロックストリーミングは**オフ**です。チャンネルは、ブロック返信なしでライブプレビュー（`channels.<channel>.streaming`）をストリーミングできます。

設定場所のリマインダー: `blockStreaming*` のデフォルトはルート設定ではなく、`agents.defaults` の下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化します。
- `partial`: 最新テキストで置き換えられる単一のプレビュー。
- `block`: チャンク化/追記ステップでプレビューを更新します。
- `progress`: 生成中の進捗/ステータスプレビュー、完了時の最終回答。

`streaming.mode: "block"` は、Discord や Telegram などの編集可能なチャンネル向けのプレビューストリーミングモードです。これは、そのチャンネルでチャンネルブロック配信を有効にするものではありません。通常のブロック返信が必要な場合は、`streaming.block.enabled` またはレガシーの `blockStreaming` チャンネルキーを使います。Microsoft Teams は例外です。下書きプレビューのブロック転送がないため、`streaming.mode: "block"` はネイティブの部分/進捗ストリーミングではなく Teams のブロック配信にマップされます。

### チャンネルマッピング

| チャンネル | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ---------- |
| Telegram   | ✅    | ✅        | ✅      | 編集可能な進捗下書き |
| Discord    | ✅    | ✅        | ✅      | 編集可能な進捗下書き |
| Slack      | ✅    | ✅        | ✅      | ✅         |
| Mattermost | ✅    | ✅        | ✅      | ✅         |
| MS Teams   | ✅    | ✅        | ✅      | ネイティブ進捗ストリーム |

Slack のみ:

- `channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode="partial"` のときに Slack ネイティブストリーミング API 呼び出しを切り替えます（デフォルト: `true`）。
- Slack ネイティブストリーミングと Slack アシスタントスレッドステータスには、返信スレッドのターゲットが必要です。トップレベルの DM ではそのスレッド形式のプレビューは表示されませんが、Slack の下書きプレビュー投稿と編集は引き続き使用できます。

レガシーキーの移行:

- Telegram: レガシーの `streamMode` とスカラー/ブール値の `streaming` は、doctor/設定互換パスによって検出され、`streaming.mode` に移行されます。
- Discord: `streamMode` + ブール値の `streaming` は `streaming` 列挙型へ自動移行されます。
- Slack: `streamMode` は `streaming.mode` へ自動移行されます。ブール値の `streaming` は `streaming.mode` と `streaming.nativeTransport` へ自動移行されます。レガシーの `nativeStreaming` は `streaming.nativeTransport` へ自動移行されます。

### ランタイム動作

Telegram:

- DM とグループ/トピック全体で、`sendMessage` + `editMessageText` のプレビュー更新を使います。
- プレビューが約 1 分間表示されていた場合、インプレース編集ではなく新しい最終メッセージを送信し、その後プレビューをクリーンアップして Telegram のタイムスタンプが返信完了を反映するようにします。
- Telegram のブロックストリーミングが明示的に有効な場合、二重ストリーミングを避けるためにプレビューストリーミングはスキップされます。
- `/reasoning stream` は、一時的なプレビューに推論を書き込み、最終配信後に削除できます。

Discord:

- 送信 + 編集のプレビューメッセージを使います。
- `block` モードは下書きチャンク化（`draftChunk`）を使います。
- Discord のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信ペイロードは、新しい下書きをフラッシュせずに保留中のプレビューをキャンセルし、その後通常配信を使います。

Slack:

- `partial` は、利用可能な場合に Slack ネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使えます。
- `block` は追記形式の下書きプレビューを使います。
- `progress` はステータスプレビューテキストを使い、その後に最終回答を送信します。
- 返信スレッドのないトップレベル DM は、Slack ネイティブストリーミングの代わりに下書きプレビュー投稿と編集を使います。
- ネイティブおよび下書きプレビューストリーミングは、そのターンのブロック返信を抑制するため、Slack の返信は 1 つの配信パスだけでストリーミングされます。
- 最終メディア/エラーペイロードと進捗の最終送信は、使い捨ての下書きメッセージを作成しません。プレビューを編集できるテキスト/ブロックの最終送信のみが、保留中の下書きテキストをフラッシュします。

Mattermost:

- 思考、ツールアクティビティ、部分返信テキストを単一の下書きプレビュー投稿にストリーミングし、最終回答を安全に送信できるときにインプレースで確定します。
- プレビュー投稿が削除された、または確定時に利用できない場合は、新しい最終投稿の送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビュー投稿をフラッシュする代わりに、通常配信の前に保留中のプレビュー更新をキャンセルします。

Matrix:

- 下書きプレビューは、最終テキストがプレビューイベントを再利用できる場合にインプレースで確定します。
- メディアのみ、エラー、返信ターゲット不一致の最終送信は、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに表示されている古いプレビューは削除されます。

### ツール進捗プレビュー更新

プレビューストリーミングには、**ツール進捗**更新も含められます。これは「Web を検索中」「ファイルを読み取り中」「ツールを呼び出し中」のような短いステータス行で、ツールの実行中、最終返信の前に同じプレビューメッセージ内に表示されます。これにより、複数ステップのツールターンが、最初の思考プレビューと最終回答の間で沈黙するのではなく、視覚的に進行中であることを示せます。

対応サーフェス:

- **Discord**、**Slack**、**Telegram**、**Matrix** は、プレビューストリーミングがアクティブな場合、デフォルトでツール進捗をライブプレビュー編集へストリーミングします。Microsoft Teams は個人チャットでネイティブ進捗ストリームを使います。
- Telegram は `v2026.4.22` 以降、ツール進捗プレビュー更新を有効にした状態でリリースされています。有効のままにすることで、そのリリース済み動作が維持されます。
- **Mattermost** は、すでにツールアクティビティを単一の下書きプレビュー投稿に取り込みます（上記参照）。
- ツール進捗編集は、アクティブなプレビューストリーミングモードに従います。プレビューストリーミングが `off` の場合、またはブロックストリーミングがメッセージを引き継いだ場合はスキップされます。Telegram では、`streaming.mode: "off"` は最終送信のみです。承認プロンプト、メディアペイロード、エラーは引き続き通常どおりルーティングされますが、一般的な進捗チャットも単独のステータスメッセージとして配信されずに抑制されます。
- プレビューストリーミングは維持しつつツール進捗行を非表示にするには、そのチャンネルの `streaming.preview.toolProgress` を `false` に設定します。コマンド/実行テキストを非表示にしつつツール進捗行を表示し続けるには、`streaming.preview.commandText` を `"status"` に設定するか、`streaming.progress.commandText` を `"status"` に設定します。デフォルトはリリース済み動作を維持するため `"raw"` です。このポリシーは、OpenClaw のコンパクトな進捗レンダラーを使う下書き/進捗チャンネルで共有されます。これには Discord、Matrix、Microsoft Teams、Mattermost、Slack 下書きプレビュー、Telegram が含まれます。プレビュー編集を完全に無効にするには、`streaming.mode` を `off` に設定します。
- Telegram の選択引用返信は例外です。`replyToMode` が `"off"` ではなく、選択された引用テキストが存在する場合、OpenClaw はそのターンの回答プレビューストリームをスキップするため、ツール進捗プレビュー行は表示されません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。詳細は [Telegram チャンネルドキュメント](/ja-JP/channels/telegram) を参照してください。

進行状況行は表示したまま、未加工のコマンド/exec テキストは非表示にします。

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

同じ形を別のコンパクトな進行状況チャンネルキーの下で使用します。たとえば、`channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`、または Slack ドラフトプレビューです。進行状況ドラフトモードでは、同じポリシーを `streaming.progress` の下に置きます。

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

- [進行状況ドラフト](/ja-JP/concepts/progress-drafts) — 長いターン中に更新される、表示可能な作業中メッセージ
- [メッセージ](/ja-JP/concepts/messages) — メッセージのライフサイクルと配信
- [再試行](/ja-JP/concepts/retry) — 配信失敗時の再試行動作
- [チャンネル](/ja-JP/channels) — チャンネルごとのストリーミング対応
