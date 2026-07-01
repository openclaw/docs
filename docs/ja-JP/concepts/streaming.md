---
read_when:
    - チャネルでストリーミングまたはチャンク化がどのように機能するかを説明する
    - ブロックストリーミングまたはチャンネルのチャンク化動作の変更
    - 重複または早すぎるブロック返信、またはチャンネルプレビューのストリーミングをデバッグする
summary: ストリーミング + チャンク分割の動作（ブロック返信、チャンネルプレビューのストリーミング、モードマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-07-01T02:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw には、2 つの別個のストリーミング層があります。

- **ブロックストリーミング（チャネル）:** アシスタントが書き込むにつれて、完了した **ブロック** を送信します。これらは通常のチャネルメッセージです（トークン差分ではありません）。
- **プレビューストリーミング（Telegram/Discord/Slack）:** 生成中に一時的な **プレビューメッセージ** を更新します。

現在、チャネルメッセージへの **真のトークン差分ストリーミング** はありません。プレビューストリーミングはメッセージベースです（送信 + 編集/追記）。

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

- `text_delta/events`: モデルストリームイベント（非ストリーミングモデルではまばらになる場合があります）。
- `chunker`: min/max 境界 + 分割設定を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際のアウトバウンドメッセージ（ブロック返信）。

**制御:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`（デフォルトは off）。
- チャネル上書き: チャネルごとに `"on"`/`"off"` を強制する `*.blockStreaming`（およびアカウントごとのバリアント）。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`（送信前にストリーミングされたブロックをマージ）。
- チャネルのハード上限: `*.textChunkLimit`（例: `channels.whatsapp.textChunkLimit`）。
- チャネルのチャンクモード: `*.chunkMode`（デフォルトは `length`、`newline` は長さによるチャンク化の前に空行（段落境界）で分割）。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage`（デフォルト 17）は、UI の切り詰めを避けるために縦に長い返信を分割します。

**境界のセマンティクス:**

- `text_end`: チャンクャーが送出したらすぐにブロックをストリーミングし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ってから、バッファされた出力をフラッシュします。

`message_end` でも、バッファされたテキストが `maxChars` を超える場合はチャンクャーを使用するため、最後に複数のチャンクを送出できます。

### ブロックストリーミングでのメディア配信

ストリーミングメディアは、`mediaUrl` や
`mediaUrls` などの構造化ペイロードフィールドを使用する必要があります。ストリーミングされたテキストは添付コマンドとして解析されません。ブロック
ストリーミングがメディアを早期に送信すると、OpenClaw はそのターンの配信を記憶します。最終
アシスタントペイロードが同じメディア URL を繰り返す場合、最終配信では添付を再送信せず、重複メディアを
取り除きます。

完全に重複する最終ペイロードは抑制されます。最終ペイロードが、すでにストリーミングされた
メディアの周囲に別個のテキストを追加する場合、OpenClaw はメディアを一度だけ配信しつつ、
新しいテキストは送信します。これにより、Telegram などのチャネルでボイス
メモやファイルが重複するのを防ぎます。

## チャンク化アルゴリズム（低/高境界）

ブロックチャンク化は `EmbeddedBlockChunker` によって実装されています。

- **低境界:** 強制されない限り、バッファ >= `minChars` になるまで送出しません。
- **高境界:** `maxChars` より前での分割を優先し、強制時は `maxChars` で分割します。
- **分割設定:** `paragraph` → `newline` → `sentence` → `whitespace` → 強制分割。
- **コードフェンス:** フェンス内では分割しません。`maxChars` で強制分割する場合は、Markdown の妥当性を保つためにフェンスを閉じて再度開きます。

`maxChars` はチャネルの `textChunkLimit` に丸められるため、チャネルごとの上限を超えることはできません。

## コアレッシング（ストリーミングされたブロックのマージ）

ブロックストリーミングが有効な場合、OpenClaw は送信前に **連続するブロックチャンクをマージ**
できます。これにより、漸進的な出力を提供しながら「1 行スパム」を減らせます。

- コアレッシングは、フラッシュ前に **アイドル間隔**（`idleMs`）を待ちます。
- バッファは `maxChars` で上限設定され、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストが蓄積するまで小さな断片が送信されるのを防ぎます
  （最終フラッシュでは残りのテキストが常に送信されます）。
- 結合文字列は `blockStreamingChunk.breakPreference` から導出されます
  （`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → スペース）。
- チャネル上書きは `*.blockStreamingCoalesce` で利用できます（アカウントごとの設定を含む）。
- デフォルトのコアレッシング `minChars` は、上書きされない限り Signal/Slack/Discord では 1500 に引き上げられます。

## ブロック間の人間らしい間隔

ブロックストリーミングが有効な場合、ブロック返信の間（最初のブロックの後）に **ランダム化された一時停止**
を追加できます。これにより、複数バブルの応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay`（エージェントごとに `agents.list[].humanDelay` で上書き）。
- モード: `off`（デフォルト）、`natural`（800-2500ms）、`custom`（`minMs`/`maxMs`）。
- **ブロック返信** にのみ適用され、最終返信やツール要約には適用されません。

## 「チャンクをストリーミングするか、すべてをストリーミングするか」

これは以下に対応します。

- **チャンクをストリーミング:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（進行に応じて送出）。Telegram 以外のチャネルでは `*.blockStreaming: true` も必要です。
- **最後にすべてをストリーミング:** `blockStreamingBreak: "message_end"`（一度フラッシュし、非常に長い場合は複数チャンクになる可能性があります）。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"`（最終返信のみ）。

**チャネル注記:** `*.blockStreaming` が明示的に `true` に設定されていない限り、
ブロックストリーミングは **オフ** です。チャネルはブロック返信なしでライブプレビュー
（`channels.<channel>.streaming`）をストリーミングできます。

設定場所の注意: `blockStreaming*` のデフォルトはルート設定ではなく
`agents.defaults` 配下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効にします。
- `partial`: 最新テキストに置き換えられる単一プレビュー。
- `block`: チャンク化/追記ステップでプレビューを更新します。
- `progress`: 生成中の進行/ステータスプレビュー、完了時の最終回答。

`streaming.mode: "block"` は、Discord や Telegram など編集可能なチャネル向けの
プレビューストリーミングモードです。そこでのチャネルブロック配信は有効にしません。
通常のブロック返信が必要な場合は、`streaming.block.enabled` または従来の `blockStreaming` チャネルキーを使用します。
Microsoft Teams は例外です。下書きプレビューのブロックトランスポートがないため、
`streaming.mode: "block"` はネイティブの partial/progress ストリーミングではなく Teams のブロック
配信にマップされます。

### チャネルマッピング

| チャネル    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 編集可能な進行下書き |
| Discord    | ✅    | ✅        | ✅      | 編集可能な進行下書き |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | ネイティブ進行ストリーム  |

Slack のみ:

- `channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode="partial"` のとき Slack ネイティブストリーミング API 呼び出しを切り替えます（デフォルト: `true`）。
- Slack ネイティブストリーミングと Slack アシスタントスレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM ではそのスレッド形式のプレビューは表示されませんが、Slack の下書きプレビュー投稿と編集は引き続き使用できます。

従来キーの移行:

- Telegram: 従来の `streamMode` とスカラー/ブール値の `streaming` 値は、doctor/config 互換パスによって検出され、`streaming.mode` に移行されます。
- Discord: `streamMode` + ブール値 `streaming` は、`streaming` enum のランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行します。
- Slack: `streamMode` は `streaming.mode` のランタイムエイリアスとして残ります。ブール値 `streaming` は `streaming.mode` と `streaming.nativeTransport` のランタイムエイリアスとして残ります。従来の `nativeStreaming` は `streaming.nativeTransport` のランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行します。

### ランタイム動作

Telegram:

- DM とグループ/トピック全体で、`sendMessage` + `editMessageText` のプレビュー更新を使用します。
- 短い初期プレビューはプッシュ通知 UX のために引き続きデバウンスされますが、Telegram は現在、アクティブな実行が視覚的に無音のままにならないよう、境界付き遅延後にそれらを実体化します。
- 最終テキストはアクティブなプレビューをその場で編集します。長い最終テキストでは、そのメッセージを最初のチャンクに再利用し、残りのチャンクだけを送信します。
- `block` モードは `streaming.preview.chunk.maxChars`（デフォルト 800、Telegram の 4096 編集制限で上限）でプレビューを新しいメッセージにローテーションします。他のモードは 1 つのプレビューを最大 4096 文字まで伸ばします。
- `progress` モードは、ツール進行を編集可能なステータス下書きに保持し、回答ストリーミングがアクティブだがツール行がまだ利用できない場合にステータスラベルを実体化し、完了時にその下書きをクリアし、通常の配信で最終回答を送信します。
- 完了テキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします。
- Telegram のブロックストリーミングが明示的に有効になっている場合、二重ストリーミングを避けるためプレビューストリーミングはスキップされます。
- `/reasoning stream` は、最終配信後に削除される一時的なプレビューへ推論を書き込むことができます。

Discord:

- 送信 + 編集のプレビューメッセージを使用します。
- `block` モードは下書きチャンク化（`draftChunk`）を使用します。
- Discord のブロックストリーミングが明示的に有効になっている場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信ペイロードは、新しい下書きをフラッシュせずに保留中のプレビューをキャンセルし、その後通常の配信を使用します。

Slack:

- `partial` は、利用可能な場合 Slack ネイティブストリーミング（`chat.startStream`/`append`/`stop`）を使用できます。
- `block` は追記形式の下書きプレビューを使用します。
- `progress` はステータスプレビューテキストを使用し、その後に最終回答を送信します。
- 返信スレッドのないトップレベル DM は、Slack ネイティブストリーミングではなく下書きプレビュー投稿と編集を使用します。
- ネイティブおよび下書きプレビューストリーミングは、そのターンのブロック返信を抑制するため、Slack の返信は 1 つの配信パスだけでストリーミングされます。
- 最終メディア/エラーペイロードと進行の最終ペイロードは、使い捨ての下書きメッセージを作成しません。プレビューを編集できるテキスト/ブロックの最終ペイロードだけが、保留中の下書きテキストをフラッシュします。

Mattermost:

- 思考、ツールアクティビティ、部分返信テキストを 1 つの下書きプレビュー投稿にストリーミングし、最終回答を安全に送信できるときにその場で確定します。
- 確定時にプレビュー投稿が削除されているか、その他の理由で利用できない場合は、新しい最終投稿の送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビュー投稿をフラッシュするのではなく、通常配信の前に保留中のプレビュー更新をキャンセルします。

Matrix:

- 最終テキストがプレビューイベントを再利用できる場合、下書きプレビューはその場で確定されます。
- メディアのみ、エラー、返信ターゲット不一致の最終ペイロードは、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに表示されている古いプレビューは取り消されます。

### ツール進行プレビュー更新

プレビューストリーミングには、**ツール進行** の更新も含めることができます。これは「Web を検索中」「ファイルを読み込み中」「ツールを呼び出し中」のような短いステータス行で、ツールの実行中、最終返信より前に同じプレビューメッセージ内に表示されます。Codex app-server モードでは、Codex の前置き/コメンタリーメッセージがこの同じプレビューパスを使用するため、「確認しています...」のような短い進行メモを、最終回答の一部にせず編集可能な下書きへストリーミングできます。これにより、複数ステップのツールターンが、最初の思考プレビューと最終回答の間で無音になるのではなく、視覚的に動き続けます。

長時間実行されるツールは、戻る前に型付き進行を送出する場合があります。たとえば、
`web_fetch` は開始時に 5 秒タイマーをセットします。フェッチがまだ
保留中なら、プレビューに `Fetching page content...` を表示できます。フェッチがそれまでに完了するか
キャンセルされた場合、進行行は送出されません。後続の最終ツール
結果は、通常どおりモデルに配信されます。

サポートされるサーフェス:

- **Discord**、**Slack**、**Telegram**、**Matrix** は、プレビューストリーミングが有効な場合、デフォルトでツール進行状況と Codex プリアンブルの更新をライブプレビュー編集にストリーミングします。Microsoft Teams は個人チャットでネイティブの進行状況ストリームを使用します。
- Telegram は `v2026.4.22` 以降、ツール進行状況プレビュー更新を有効にして出荷されており、有効のままにすることでそのリリース済み動作を維持します。
- **Mattermost** は、すでにツールアクティビティを単一の下書きプレビュー投稿に折り込んでいます（上記を参照）。
- ツール進行状況の編集は、アクティブなプレビューストリーミングモードに従います。プレビューストリーミングが `off` の場合、またはブロックストリーミングがメッセージを引き継いだ場合はスキップされます。Telegram では、`streaming.mode: "off"` は最終応答のみです。一般的な進行状況の雑多な通知も、単独のステータスメッセージとして配信されるのではなく抑制されますが、承認プロンプト、メディアペイロード、エラーは通常どおりルーティングされます。
- プレビューストリーミングを維持しつつツール進行状況の行を非表示にするには、そのチャンネルの `streaming.preview.toolProgress` を `false` に設定します。コマンド/実行テキストを非表示にしつつツール進行状況の行を表示したままにするには、`streaming.preview.commandText` を `"status"` に設定するか、`streaming.progress.commandText` を `"status"` に設定します。デフォルトは、リリース済み動作を維持するために `"raw"` です。このポリシーは、Discord、Matrix、Microsoft Teams、Mattermost、Slack の下書きプレビュー、Telegram など、OpenClaw のコンパクト進行状況レンダラーを使用する下書き/進行状況チャンネルで共有されます。プレビュー編集を完全に無効にするには、`streaming.mode` を `off` に設定します。
- Telegram の選択引用返信は例外です。`replyToMode` が `"off"` ではなく、選択された引用テキストが存在する場合、OpenClaw はそのターンの回答プレビューストリームをスキップするため、ツール進行状況プレビュー行はレンダリングされません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。詳細は [Telegram チャンネルドキュメント](/ja-JP/channels/telegram) を参照してください。

### コメンタリー進行状況レーン

ツール進行状況に加えて、コンパクト進行状況レンダラーは下書きにもう 1 つのレーンを表示できます。

- **`streaming.progress.commentary`** — モデルのツール実行前の **コメンタリー**（💬）— 短い「確認して…それから…」という説明 — を、進行状況下書き内でツール行に挟み込んでレンダリングします。

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

進行状況の行は表示したまま、生のコマンド/実行テキストを非表示にします。

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

同じ形を別のコンパクト進行状況チャンネルキーの下で使用します。たとえば、`channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`、または Slack の下書きプレビューです。進行状況下書きモードでは、同じポリシーを `streaming.progress` の下に置きます。

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
- [進行状況下書き](/ja-JP/concepts/progress-drafts) - 長いターン中に更新される、表示可能な作業中メッセージ
- [メッセージ](/ja-JP/concepts/messages) - メッセージのライフサイクルと配信
- [再試行](/ja-JP/concepts/retry) - 配信失敗時の再試行動作
- [チャンネル](/ja-JP/channels) - チャンネルごとのストリーミングサポート
