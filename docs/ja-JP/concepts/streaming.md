---
read_when:
    - チャネルでのストリーミングやチャンク分割の仕組みを説明する
    - ブロックストリーミングまたはチャンネルのチャンク分割動作を変更する
    - 重複/早期のブロック返信またはチャネルプレビューのストリーミングのデバッグ
summary: ストリーミング + チャンク化の挙動（ブロック返信、チャネルプレビューのストリーミング、モードマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-05-06T05:03:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw には 2 つの別々のストリーミング層があります。

- **ブロックストリーミング (チャネル):** アシスタントが書き込むにつれて、完了した **ブロック** を出力します。これらは通常のチャネルメッセージです (トークンデルタではありません)。
- **プレビューストリーミング (Telegram/Discord/Slack):** 生成中に一時的な **プレビューメッセージ** を更新します。

現時点では、チャネルメッセージへの **真のトークンデルタストリーミング** はありません。プレビューストリーミングはメッセージベースです (送信 + 編集/追記)。

## ブロックストリーミング (チャネルメッセージ)

ブロックストリーミングは、アシスタント出力が利用可能になるにつれて大まかなチャンクで送信します。

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

- `text_delta/events`: モデルストリームイベント (非ストリーミングモデルではまばらな場合があります)。
- `chunker`: 最小/最大境界 + 改行設定を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ (ブロック返信)。

**制御:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (デフォルトは off)。
- チャネル上書き: チャネルごとに `"on"`/`"off"` を強制する `*.blockStreaming` (およびアカウント別バリアント)。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (送信前にストリーミングされたブロックを結合)。
- チャネルのハード上限: `*.textChunkLimit` (例: `channels.whatsapp.textChunkLimit`)。
- チャネルチャンクモード: `*.chunkMode` (デフォルトは `length`、`newline` は長さによるチャンク化の前に空行 (段落境界) で分割)。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage` (デフォルトは 17)。UI でのクリッピングを避けるため、縦に長い返信を分割します。

**境界セマンティクス:**

- `text_end`: chunker が出力したらすぐにブロックをストリーミングし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ち、その後バッファ済み出力をフラッシュします。

`message_end` でも、バッファ済みテキストが `maxChars` を超える場合は chunker を使用するため、最後に複数のチャンクを出力できます。

### ブロックストリーミングでのメディア配信

`MEDIA:` ディレクティブは通常の配信メタデータです。ブロックストリーミングがメディアブロックを早期に送信した場合、OpenClaw はそのターンの配信を記憶します。最終的なアシスタントペイロードが同じメディア URL を繰り返す場合、最終配信では添付を再送せず、重複メディアを取り除きます。

完全に重複する最終ペイロードは抑制されます。最終ペイロードがすでにストリーミング済みのメディアの周囲に別のテキストを追加する場合、OpenClaw はメディアを一度だけ配信したまま新しいテキストを送信します。これにより、エージェントがストリーミング中に `MEDIA:` を出力し、プロバイダーも完了済み返信にそれを含める場合に、Telegram などのチャネルでボイスメモやファイルが重複することを防ぎます。

## チャンク化アルゴリズム (下限/上限)

ブロックチャンク化は `EmbeddedBlockChunker` によって実装されています。

- **下限:** バッファ >= `minChars` になるまで出力しません (強制時を除く)。
- **上限:** `maxChars` より前での分割を優先します。強制時は `maxChars` で分割します。
- **改行設定:** `paragraph` → `newline` → `sentence` → `whitespace` → 強制分割。
- **コードフェンス:** フェンス内では分割しません。`maxChars` で強制される場合は、Markdown を有効に保つためにフェンスを閉じて再度開きます。

`maxChars` はチャネルの `textChunkLimit` にクランプされるため、チャネルごとの上限を超えることはできません。

## 結合 (ストリーミングされたブロックのマージ)

ブロックストリーミングが有効な場合、OpenClaw は送信前に **連続するブロックチャンクを結合** できます。これにより、段階的な出力を維持しながら「1 行スパム」を減らします。

- 結合は、フラッシュ前に **アイドル間隔** (`idleMs`) を待ちます。
- バッファは `maxChars` で制限され、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストが蓄積するまで小さすぎる断片の送信を防ぎます (最終フラッシュでは残りのテキストを常に送信します)。
- 結合文字列は `blockStreamingChunk.breakPreference` から派生します
  (`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → スペース)。
- チャネル上書きは `*.blockStreamingCoalesce` 経由で利用できます (アカウント別設定を含む)。
- デフォルトの結合 `minChars` は、上書きされない限り Signal/Slack/Discord では 1500 に引き上げられます。

## ブロック間の人間らしいペーシング

ブロックストリーミングが有効な場合、ブロック返信の間 (最初のブロックの後) に **ランダム化された一時停止** を追加できます。これにより、複数バブルの応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay` (`agents.list[].humanDelay` でエージェントごとに上書き)。
- モード: `off` (デフォルト)、`natural` (800-2500ms)、`custom` (`minMs`/`maxMs`)。
- **ブロック返信** のみに適用され、最終返信やツール要約には適用されません。

## 「チャンクをストリーミングするか、すべてをストリーミングするか」

これは次に対応します。

- **チャンクをストリーミング:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (逐次出力)。Telegram 以外のチャネルでは `*.blockStreaming: true` も必要です。
- **最後にすべてをストリーミング:** `blockStreamingBreak: "message_end"` (一度フラッシュし、非常に長い場合は複数チャンクになることがあります)。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"` (最終返信のみ)。

**チャネルの注記:** `*.blockStreaming` が明示的に `true` に設定されていない限り、ブロックストリーミングは **off** です。チャネルはブロック返信なしでライブプレビュー (`channels.<channel>.streaming`) をストリーミングできます。

設定場所のリマインダー: `blockStreaming*` のデフォルトはルート設定ではなく `agents.defaults` 配下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効化します。
- `partial`: 最新テキストで置き換えられる単一プレビュー。
- `block`: チャンク化/追記されたステップでプレビューを更新します。
- `progress`: 生成中の進捗/ステータスプレビュー、完了時に最終回答。

`streaming.mode: "block"` は、Discord や Telegram などの編集可能なチャネル向けのプレビューストリーミングモードです。そこでのチャネルブロック配信は有効にしません。通常のブロック返信が必要な場合は、`streaming.block.enabled` またはレガシーの `blockStreaming` チャネルキーを使用してください。Microsoft Teams は例外です。下書きプレビューのブロック転送がないため、`streaming.mode: "block"` はネイティブの部分/進捗ストリーミングではなく Teams のブロック配信に対応します。

### チャネルマッピング

| チャネル   | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 編集可能な進捗下書き |
| Discord    | ✅    | ✅        | ✅      | 編集可能な進捗下書き |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | ネイティブ進捗ストリーム  |

Slack のみ:

- `channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode="partial"` の場合に Slack ネイティブストリーミング API 呼び出しを切り替えます (デフォルト: `true`)。
- Slack ネイティブストリーミングと Slack アシスタントスレッドステータスには、返信スレッドターゲットが必要です。トップレベル DM ではそのスレッド形式のプレビューは表示されませんが、Slack の下書きプレビュー投稿と編集は引き続き使用できます。

レガシーキーの移行:

- Telegram: レガシーの `streamMode` とスカラー/ブールの `streaming` 値は、doctor/config 互換パスによって検出され、`streaming.mode` に移行されます。
- Discord: `streamMode` + ブールの `streaming` は `streaming` enum に自動移行されます。
- Slack: `streamMode` は `streaming.mode` に自動移行されます。ブールの `streaming` は `streaming.mode` と `streaming.nativeTransport` に自動移行されます。レガシーの `nativeStreaming` は `streaming.nativeTransport` に自動移行されます。

### 実行時の挙動

Telegram:

- DM とグループ/トピック全体で、`sendMessage` + `editMessageText` によるプレビュー更新を使用します。
- 最終テキストはアクティブなプレビューをその場で編集します。長い最終回答では最初のチャンクにそのメッセージを再利用し、残りのチャンクのみを送信します。
- `progress` モードは、ツール進捗を編集可能なステータス下書きに保持し、完了時にその下書きをクリアして、通常配信で最終回答を送信します。
- 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします。
- Telegram のブロックストリーミングが明示的に有効な場合、二重ストリーミングを避けるためにプレビューストリーミングはスキップされます。
- `/reasoning stream` は、一時的なプレビューに推論を書き込むことができ、そのプレビューは最終配信後に削除されます。

Discord:

- 送信 + 編集のプレビューメッセージを使用します。
- `block` モードは下書きチャンク化 (`draftChunk`) を使用します。
- Discord のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信ペイロードは、新しい下書きをフラッシュせずに保留中のプレビューをキャンセルし、その後通常配信を使用します。

Slack:

- `partial` は、利用可能な場合に Slack ネイティブストリーミング (`chat.startStream`/`append`/`stop`) を使用できます。
- `block` は追記形式の下書きプレビューを使用します。
- `progress` はステータスプレビューテキストを使用し、その後に最終回答を送信します。
- 返信スレッドのないトップレベル DM では、Slack ネイティブストリーミングの代わりに下書きプレビュー投稿と編集を使用します。
- ネイティブおよび下書きプレビューストリーミングは、そのターンのブロック返信を抑制するため、Slack の返信は 1 つの配信パスのみでストリーミングされます。
- 最終メディア/エラーペイロードと進捗最終回答は、使い捨ての下書きメッセージを作成しません。プレビューを編集できるテキスト/ブロック最終回答のみが保留中の下書きテキストをフラッシュします。

Mattermost:

- 思考、ツールアクティビティ、部分返信テキストを単一の下書きプレビュー投稿にストリーミングし、最終回答を安全に送信できるときにその場で確定します。
- プレビュー投稿が削除されている、または確定時に利用できない場合は、新しい最終投稿の送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビュー投稿をフラッシュする代わりに、通常配信の前に保留中のプレビュー更新をキャンセルします。

Matrix:

- 最終テキストがプレビューイベントを再利用できる場合、下書きプレビューはその場で確定します。
- メディアのみ、エラー、返信ターゲット不一致の最終回答は、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに表示されている古いプレビューは削除されます。

### ツール進捗プレビュー更新

プレビューストリーミングには、**ツール進捗** 更新も含めることができます。これは「Web を検索中」、「ファイルを読み取り中」、「ツールを呼び出し中」のような短いステータス行で、ツールの実行中、最終返信の前に同じプレビューメッセージ内に表示されます。これにより、複数ステップのツールターンが、最初の思考プレビューと最終回答の間で沈黙するのではなく、視覚的に動き続けます。

対応サーフェス:

- **Discord**、**Slack**、**Telegram**、**Matrix** は、プレビューストリーミングが有効な場合、デフォルトでツール進捗をライブプレビュー編集へストリーミングします。Microsoft Teams は個人チャットでネイティブの進捗ストリームを使用します。
- Telegram は `v2026.4.22` 以降、ツール進捗のプレビュー更新を有効にした状態で出荷されています。有効のままにすると、そのリリース済みの動作が維持されます。
- **Mattermost** はすでに、ツールアクティビティを単一のドラフトプレビュー投稿に折り込んでいます（上記を参照）。
- ツール進捗の編集は、アクティブなプレビューストリーミングモードに従います。プレビューストリーミングが `off` の場合、またはブロックストリーミングがメッセージを引き継いだ場合はスキップされます。Telegram では、`streaming.mode: "off"` は最終メッセージのみです。汎用の進捗チャットも、独立したステータスメッセージとして配信されるのではなく抑制されますが、承認プロンプト、メディアペイロード、エラーは通常どおりルーティングされます。
- プレビューストリーミングを維持しつつツール進捗行を非表示にするには、そのチャネルの `streaming.preview.toolProgress` を `false` に設定します。ツール進捗行を表示したままコマンド/exec テキストを非表示にするには、`streaming.preview.commandText` を `"status"` に設定するか、`streaming.progress.commandText` を `"status"` に設定します。デフォルトは、リリース済みの動作を維持するため `"raw"` です。このポリシーは、Discord、Matrix、Microsoft Teams、Mattermost、Slack のドラフトプレビュー、Telegram など、OpenClaw のコンパクトな進捗レンダラーを使用するドラフト/進捗チャネルで共有されます。プレビュー編集を完全に無効にするには、`streaming.mode` を `off` に設定します。
- Telegram の選択引用返信は例外です。`replyToMode` が `"off"` ではなく、選択された引用テキストが存在する場合、OpenClaw はそのターンの回答プレビューストリームをスキップするため、ツール進捗のプレビュー行はレンダリングできません。選択引用テキストのない現在メッセージへの返信では、プレビューストリーミングは引き続き維持されます。詳細は [Telegram チャネルドキュメント](/ja-JP/channels/telegram) を参照してください。

進捗行は表示したまま、生のコマンド/exec テキストを非表示にします。

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

別のコンパクト進捗チャネルキーの下でも同じ形式を使用します。たとえば `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`、または Slack のドラフトプレビューです。進捗ドラフトモードでは、同じポリシーを `streaming.progress` の下に置きます。

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

- [メッセージライフサイクルのリファクタリング](/ja-JP/concepts/message-lifecycle-refactor) - 共有プレビュー、編集、ストリーム、最終化設計の目標
- [進捗ドラフト](/ja-JP/concepts/progress-drafts) - 長いターン中に更新される、表示可能な作業中メッセージ
- [メッセージ](/ja-JP/concepts/messages) - メッセージのライフサイクルと配信
- [再試行](/ja-JP/concepts/retry) - 配信失敗時の再試行動作
- [チャネル](/ja-JP/channels) - チャネルごとのストリーミング対応
