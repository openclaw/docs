---
read_when:
    - チャネルでストリーミングやチャンク化がどのように動作するかを説明するとき
    - ブロックストリーミングやチャネルのチャンク化動作を変更するとき
    - 重複した早期ブロック返信やチャネルのプレビューストリーミングをデバッグするとき
summary: ストリーミング + チャンク化の動作（ブロック返信、チャネルのプレビューストリーミング、モードのマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-04-08T06:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8e847bb7da890818cd79dec7777f6ae488e6d6c0468e948e56b6b6c598e0000
    source_path: concepts/streaming.md
    workflow: 15
---

# ストリーミング + チャンク化

OpenClaw には、分離された 2 つのストリーミングレイヤーがあります。

- **ブロックストリーミング（チャネル）:** アシスタントが書き込む間に、完了した**ブロック**を送出します。これらは通常のチャネルメッセージであり、トークンデルタではありません。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に、一時的な**プレビューメッセージ**を更新します。

現在、チャネルメッセージに対する**真のトークンデルタストリーミング**はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（チャネルメッセージ）

ブロックストリーミングは、利用可能になったアシスタント出力を粗いチャンクで送信します。

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
- `chunker`: 最小/最大境界 + 優先ブレークを適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御項目:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトは off）。
- チャネル上書き: `*.blockStreaming`（およびアカウントごとのバリアント）で、チャネルごとに `"on"`/`"off"` を強制。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリームされたブロックをマージ）。
- チャネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャネルのチャンクモード: `*.chunkMode`（デフォルトは `length`、`newline` は長さベースのチャンク化の前に空行で分割します（段落境界））。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage`（デフォルト 17）は、UI での切り詰めを避けるために縦長の返信を分割します。

**境界の意味:**

- `text_end`: chunker が送出するとすぐにブロックをストリームし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待機し、その後でバッファされた出力をフラッシュします。

`message_end` は、バッファされたテキストが `maxChars` を超える場合でも chunker を使用するため、最後に複数のチャンクを送出することがあります。

## チャンク化アルゴリズム（低/高境界）

ブロックのチャンク化は `EmbeddedBlockChunker` によって実装されます。

- **低境界:** バッファが `minChars` 以上になるまで送出しません（強制時を除く）。
- **高境界:** `maxChars` より前での分割を優先し、強制時は `maxChars` で分割します。
- **優先ブレーク:** `paragraph` → `newline` → `sentence` → `whitespace` → 強制ブレーク。
- **コードフェンス:** フェンス内では決して分割しません。`maxChars` で強制分割する場合は、Markdown を有効に保つためにフェンスを閉じて再度開きます。

`maxChars` はチャネルの `textChunkLimit` にクランプされるため、チャネルごとの上限を超えることはできません。

## コアレスシング（ストリームされたブロックのマージ）

ブロックストリーミングが有効な場合、OpenClaw は送信前に**連続するブロックチャンクをマージ**できます。  
これにより、段階的な出力を維持しつつ「1 行ずつのスパム」を減らせます。

- コアレスシングは、フラッシュ前に**アイドルギャップ**（`idleMs`）を待機します。
- バッファは `maxChars` で上限設定されており、それを超えるとフラッシュされます。
- `minChars` により、十分なテキストが蓄積されるまで小さな断片の送信を防ぎます（最終フラッシュでは残りのテキストを常に送信します）。
- Joiner は `blockStreamingChunk.breakPreference` から導出されます（`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → space）。
- チャネル上書きは `*.blockStreamingCoalesce` で利用できます（アカウントごとの設定を含む）。
- デフォルトのコアレス `minChars` は、上書きされていない限り Signal/Slack/Discord では 1500 に引き上げられます。

## ブロック間の人間らしい間隔

ブロックストリーミングが有効な場合、ブロック返信の間（最初のブロックの後）に**ランダム化された待機**を追加できます。これにより、複数の吹き出しによる応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay`（エージェントごとの上書きは `agents.list[].humanDelay`）。
- モード: `off`（デフォルト）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 適用対象は**ブロック返信**のみで、最終返信やツール要約には適用されません。

## 「チャンクをストリームする」または「すべてまとめて送る」

これは次のように対応します。

- **チャンクをストリームする:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（生成しながら送出）。Telegram 以外のチャネルでは、さらに `*.blockStreaming: true` も必要です。
- **最後にすべてをストリームする:** `blockStreamingBreak: "message_end"`（1 回でフラッシュ。ただし非常に長い場合は複数チャンクになる可能性があります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャネルに関する注意:** ブロックストリーミングは、`*.blockStreaming` が明示的に `true` に設定されない限り**off**です。チャネルは、ブロック返信なしでライブプレビュー（`channels.<channel>.streaming`）をストリームできます。

設定場所の注意: `blockStreaming*` のデフォルトはルート設定ではなく、`agents.defaults` の下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化します。
- `partial`: 最新テキストで置き換えられる単一のプレビュー。
- `block`: チャンク化/追記の段階でプレビューを更新します。
- `progress`: 生成中は進行状況/ステータスのプレビューを表示し、完了時に最終回答を表示します。

### チャネルマッピング

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | `partial` にマップ |
| Discord  | ✅    | ✅        | ✅      | `partial` にマップ |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Slack 専用:

- `channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode="partial"` のときに Slack ネイティブストリーミング API 呼び出しを切り替えます（デフォルト: `true`）。
- Slack ネイティブストリーミングと Slack アシスタントのスレッドステータスには返信スレッドの対象が必要です。トップレベル DM では、そのスレッド形式のプレビューは表示されません。

レガシーキーの移行:

- Telegram: `streamMode` と真偽値の `streaming` は、自動的に `streaming` enum に移行されます。
- Discord: `streamMode` と真偽値の `streaming` は、自動的に `streaming` enum に移行されます。
- Slack: `streamMode` は自動的に `streaming.mode` に移行され、真偽値の `streaming` は自動的に `streaming.mode` と `streaming.nativeTransport` に移行されます。レガシーの `nativeStreaming` は自動的に `streaming.nativeTransport` に移行されます。

### ランタイム動作

Telegram:

- DM とグループ/トピックの両方で、`sendMessage` + `editMessageText` によるプレビュー更新を使用します。
- Telegram のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます（重複ストリーミングを避けるため）。
- `/reasoning stream` は推論内容をプレビューに書き込めます。

Discord:

- 送信 + 編集によるプレビューメッセージを使用します。
- `block` モードはドラフトのチャンク化（`draftChunk`）を使用します。
- Discord のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。

Slack:

- `partial` は、利用可能な場合に Slack ネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使用できます。
- `block` は追記形式のドラフトプレビューを使用します。
- `progress` はステータスプレビューテキストを使用し、その後に最終回答を表示します。

## 関連

- [メッセージ](/ja-JP/concepts/messages) — メッセージのライフサイクルと配信
- [再試行](/ja-JP/concepts/retry) — 配信失敗時の再試行動作
- [チャネル](/ja-JP/channels) — チャネルごとのストリーミング対応
