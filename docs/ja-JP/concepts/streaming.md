---
read_when:
    - チャネル上でストリーミングやチャンク化がどのように動作するかを説明する場合
    - ブロックストリーミングまたはチャネルチャンク化の動作を変更する場合
    - 重複/早期ブロック返信またはチャネルプレビュー ストリーミングをデバッグしている場合
summary: ストリーミング + チャンク化の動作（ブロック返信、チャネルプレビュー ストリーミング、モードマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-04-24T04:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# ストリーミング + チャンク化

OpenClawには、別々の2つのストリーミング層があります。

- **ブロックストリーミング（チャネル）:** アシスタントが書き込むにつれて、完了した**ブロック**を送出します。これらは通常のチャネルメッセージであり、トークン差分ではありません。
- **プレビュー ストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な**プレビューメッセージ**を更新します。

現時点では、チャネルメッセージへの**真のトークン差分ストリーミング**はありません。プレビュー ストリーミングはメッセージベースです（送信 + 編集/追記）。

## ブロックストリーミング（チャネルメッセージ）

ブロックストリーミングは、アシスタント出力を利用可能になり次第、粗いチャンクで送信します。

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

- `text_delta/events`: モデルストリームイベント（非ストリーミングモデルでは疎になることがあります）。
- `chunker`: `EmbeddedBlockChunker`がmin/max境界 + 優先区切りを適用します。
- `channel send`: 実際の送信メッセージ（ブロック返信）。

**制御項目:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトはoff）。
- チャネル上書き: `*.blockStreaming`（およびアカウントごとのバリアント）で、チャネルごとに`"on"`/`"off"`を強制。
- `agents.defaults.blockStreamingBreak`: `"text_end"`または`"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリームされたブロックを結合）。
- チャネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャネルチャンクモード: `*.chunkMode`（デフォルトは`length`、`newline`は長さによるチャンク化前に空行（段落境界）で分割）。
- Discordソフト上限: `channels.discord.maxLinesPerMessage`（デフォルト17）は、UIで切れるのを避けるために縦長の返信を分割します。

**境界セマンティクス:**

- `text_end`: chunkerが送出したらすぐにブロックをストリームし、各`text_end`でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ち、その後バッファ済み出力をフラッシュします。

`message_end`でも、バッファ済みテキストが`maxChars`を超える場合はchunkerを使用するため、最後に複数チャンクを送出することがあります。

## チャンク化アルゴリズム（低/高境界）

ブロックチャンク化は`EmbeddedBlockChunker`で実装されています。

- **低境界:** バッファが`minChars`以上になるまで送出しません（強制時を除く）。
- **高境界:** `maxChars`未満での分割を優先します。強制時は`maxChars`で分割します。
- **区切り優先:** `paragraph` → `newline` → `sentence` → `whitespace` → ハードブレーク。
- **コードフェンス:** フェンス内では決して分割しません。`maxChars`で強制分割するときは、Markdownを有効なまま保つためにフェンスを閉じて再度開きます。

`maxChars`はチャネルの`textChunkLimit`にクランプされるため、チャネルごとの上限を超えることはできません。

## Coalescing（ストリームされたブロックの結合）

ブロックストリーミングが有効な場合、OpenClawは送信前に**連続するブロックチャンクを結合**できます。これにより、「1行ずつのスパム」を減らしつつ、段階的な出力を維持できます。

- Coalescingは、フラッシュ前に**アイドルギャップ**（`idleMs`）を待ちます。
- バッファは`maxChars`で上限管理され、それを超えるとフラッシュされます。
- `minChars`は、十分なテキストがたまるまで小さな断片の送信を防ぎます（最終フラッシュでは常に残りのテキストを送信します）。
- Joinerは`blockStreamingChunk.breakPreference`から導出されます
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → 半角スペース）。
- チャネル上書きは`*.blockStreamingCoalesce`で利用できます（アカウントごとの設定も含む）。
- デフォルトのcoalesce `minChars`は、Signal/Slack/Discordでは上書きされない限り1500まで引き上げられます。

## ブロック間の人間らしい間隔

ブロックストリーミングが有効な場合、ブロック返信の間に**ランダム化された待機**を追加できます
（最初のブロックの後）。これにより、複数バブルの応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay`（エージェントごとの上書きは`agents.list[].humanDelay`）。
- モード: `off`（デフォルト）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 適用対象は**ブロック返信**のみで、最終返信やツール要約には適用されません。

## 「チャンクをストリームする」か「最後にまとめて送る」か

これは次のように対応します。

- **チャンクをストリームする:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（進行しながら送出）。Telegram以外のチャネルでは、さらに`*.blockStreaming: true`も必要です。
- **最後にすべてをストリームする:** `blockStreamingBreak: "message_end"`（一度だけフラッシュ。非常に長い場合は複数チャンクになることがあります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャネルに関する注意:** ブロックストリーミングは、`*.blockStreaming`が明示的に`true`に設定されていない限り**off**です。チャネルは、ブロック返信なしでライブプレビュー
（`channels.<channel>.streaming`）をストリームできます。

設定場所の注意: `blockStreaming*`のデフォルトは、ルート設定ではなく`agents.defaults`配下にあります。

## プレビュー ストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビュー ストリーミングを無効化。
- `partial`: 単一のプレビューを最新テキストで置き換える。
- `block`: チャンク化/追記された段階でプレビューを更新する。
- `progress`: 生成中は進捗/ステータスのプレビューを表示し、完了時に最終回答を表示する。

### チャネルマッピング

| チャネル | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial`にマップ |
| Discord    | ✅    | ✅        | ✅      | `partial`にマップ |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Slack専用:

- `channels.slack.streaming.nativeTransport`は、`channels.slack.streaming.mode="partial"`時にSlackネイティブ ストリーミングAPI呼び出しを切り替えます（デフォルト: `true`）。
- Slackネイティブ ストリーミングとSlackアシスタントスレッドステータスには返信スレッド対象が必要です。トップレベルDMではそのスレッド形式プレビューは表示されません。

レガシーキー移行:

- Telegram: `streamMode` + boolean `streaming`は`streaming` enumへ自動移行。
- Discord: `streamMode` + boolean `streaming`は`streaming` enumへ自動移行。
- Slack: `streamMode`は`streaming.mode`へ自動移行。boolean `streaming`は`streaming.mode` + `streaming.nativeTransport`へ自動移行。レガシーの`nativeStreaming`は`streaming.nativeTransport`へ自動移行。

### 実行時動作

Telegram:

- DMとグループ/トピック全体で、`sendMessage` + `editMessageText`プレビュー更新を使用します。
- Telegramのブロックストリーミングが明示的に有効な場合、プレビュー ストリーミングはスキップされます（ダブルストリーミング回避のため）。
- `/reasoning stream`はreasoningをプレビューへ書き込めます。

Discord:

- 送信 + 編集によるプレビューメッセージを使用します。
- `block`モードはドラフトチャンク化（`draftChunk`）を使用します。
- Discordのブロックストリーミングが明示的に有効な場合、プレビュー ストリーミングはスキップされます。
- 最終メディア、エラー、および明示返信ペイロードは、保留中のプレビューを新しいドラフトをフラッシュせずにキャンセルし、その後通常配信を使用します。

Slack:

- `partial`は、利用可能な場合、Slackネイティブ ストリーミング（`chat.startStream`/`append`/`stop`）を使えます。
- `block`は追記スタイルのドラフトプレビューを使用します。
- `progress`はステータスプレビューテキストを使用し、その後に最終回答を表示します。
- 最終メディア/エラーペイロードとprogress finalは使い捨てドラフトメッセージを作成しません。プレビューを編集できるテキスト/ブロックのfinalだけが保留中のドラフトテキストをフラッシュします。

Mattermost:

- thinking、ツールアクティビティ、および部分返信テキストを単一のドラフトプレビューポストにストリームし、最終回答を安全に送れる時点でその場で確定します。
- プレビューポストが削除されている、または確定時に利用不可の場合は、新しい最終ポスト送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビューポストをフラッシュする代わりに、通常配信前に保留中のプレビュー更新をキャンセルします。

Matrix:

- ドラフトプレビューは、最終テキストがプレビューイベントを再利用できる場合、その場で確定します。
- メディアのみ、エラー、および返信対象不一致のfinalは、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに見えている古いプレビューはredactされます。

### ツール進捗プレビュー更新

プレビュー ストリーミングには**ツール進捗**更新も含められます。これは「searching the web」「reading file」「calling tool」のような短いステータス行で、ツール実行中に最終返信に先立って同じプレビューメッセージに表示されます。これにより、複数ステップのツールターンが、最初のthinkingプレビューと最終回答の間で無言になるのではなく、視覚的に動き続けます。

対応しているインターフェース:

- **Discord**、**Slack**、**Telegram**は、ツール進捗をライブプレビュー編集へストリームします。
- **Mattermost**は、すでにツールアクティビティを単一ドラフトプレビューポストへ統合しています（上記参照）。
- ツール進捗編集は有効なプレビュー ストリーミングモードに従います。プレビュー ストリーミングが`off`の場合や、ブロックストリーミングがメッセージ処理を引き継いだ場合はスキップされます。

## 関連

- [Messages](/ja-JP/concepts/messages) — メッセージライフサイクルと配信
- [Retry](/ja-JP/concepts/retry) — 配信失敗時の再試行動作
- [Channels](/ja-JP/channels) — チャネルごとのストリーミングサポート
