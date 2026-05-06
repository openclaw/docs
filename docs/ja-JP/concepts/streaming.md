---
read_when:
    - チャンネルでストリーミングまたはチャンク化がどのように機能するかを説明する
    - ブロックストリーミングまたはチャンネルチャンク化の動作を変更する
    - 重複/早期のブロック応答またはチャネルプレビューのストリーミングのデバッグ
summary: ストリーミング + チャンク化の動作（ブロック返信、チャンネルプレビューのストリーミング、モードマッピング）
title: ストリーミングとチャンク化
x-i18n:
    generated_at: "2026-05-06T17:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw には、2つの独立したストリーミング層があります:

- **ブロックストリーミング (チャンネル):** アシスタントが書き込むにつれて、完成した **ブロック** を送出します。これらは通常のチャンネルメッセージです (トークン差分ではありません)。
- **プレビューストリーミング (Telegram/Discord/Slack):** 生成中に一時的な **プレビューメッセージ** を更新します。

現在、チャンネルメッセージへの **真のトークン差分ストリーミング** はありません。プレビューストリーミングはメッセージベースです (送信 + 編集/追記)。

## ブロックストリーミング (チャンネルメッセージ)

ブロックストリーミングは、利用可能になったアシスタント出力を粗いチャンク単位で送信します。

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
- `chunker`: min/max 境界 + 区切りの優先設定を適用する `EmbeddedBlockChunker`。
- `channel send`: 実際の送信メッセージ (ブロック返信)。

**制御:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (デフォルトは off)。
- チャンネルの上書き: チャンネルごとに `"on"`/`"off"` を強制する `*.blockStreaming` (およびアカウントごとのバリアント)。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (送信前にストリーミングされたブロックを結合)。
- チャンネルのハード上限: `*.textChunkLimit` (例: `channels.whatsapp.textChunkLimit`)。
- チャンネルのチャンクモード: `*.chunkMode` (`length` がデフォルト、`newline` は長さによるチャンク化の前に空行 (段落境界) で分割)。
- Discord のソフト上限: `channels.discord.maxLinesPerMessage` (デフォルト 17) は、UI での切り詰めを避けるために縦に長い返信を分割します。

**境界の意味:**

- `text_end`: chunker が送出したらすぐにブロックをストリーミングし、各 `text_end` でフラッシュします。
- `message_end`: アシスタントメッセージが完了するまで待ってから、バッファ済み出力をフラッシュします。

`message_end` でも、バッファ済みテキストが `maxChars` を超える場合は chunker を使用するため、最後に複数のチャンクを送出することがあります。

### ブロックストリーミングでのメディア配信

`MEDIA:` ディレクティブは通常の配信メタデータです。ブロックストリーミングがメディアブロックを早期に送信すると、OpenClaw はそのターンでその配信を記憶します。最終的なアシスタントペイロードが同じメディア URL を繰り返す場合、最終配信では添付ファイルを再送信する代わりに重複メディアを取り除きます。

完全に重複する最終ペイロードは抑制されます。最終ペイロードが、すでにストリーミングされたメディアの周囲に別個のテキストを追加する場合、OpenClaw はメディアを単一配信のままにしながら、新しいテキストを送信します。これにより、エージェントがストリーミング中に `MEDIA:` を送出し、プロバイダーも完了済み返信にそれを含める場合に、Telegram などのチャンネルで音声メモやファイルが重複するのを防ぎます。

## チャンク化アルゴリズム (下限/上限)

ブロックチャンク化は `EmbeddedBlockChunker` によって実装されています:

- **下限:** バッファ >= `minChars` になるまで送出しません (強制時を除く)。
- **上限:** `maxChars` の前での分割を優先します。強制時は `maxChars` で分割します。
- **区切りの優先順位:** `paragraph` → `newline` → `sentence` → `whitespace` → ハード区切り。
- **コードフェンス:** フェンス内では決して分割しません。`maxChars` で強制分割する場合は、Markdown を有効に保つためにフェンスを閉じてから再度開きます。

`maxChars` はチャンネルの `textChunkLimit` にクランプされるため、チャンネルごとの上限を超えることはできません。

## 結合 (ストリーミングされたブロックを結合)

ブロックストリーミングが有効な場合、OpenClaw は送信前に **連続するブロックチャンクを結合** できます。これにより、段階的な出力を維持しながら「1行スパム」を減らします。

- 結合はフラッシュ前に **アイドル間隔** (`idleMs`) を待ちます。
- バッファは `maxChars` で上限が設定され、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストが蓄積するまで小さな断片の送信を防ぎます (最終フラッシュでは残りのテキストを常に送信します)。
- 結合文字列は `blockStreamingChunk.breakPreference` から派生します (`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → スペース)。
- チャンネルの上書きは `*.blockStreamingCoalesce` (アカウントごとの設定を含む) で利用できます。
- デフォルトの結合 `minChars` は、上書きされない限り Signal/Slack/Discord では 1500 に引き上げられます。

## ブロック間の人間らしい間隔

ブロックストリーミングが有効な場合、ブロック返信の間 (最初のブロックの後) に **ランダム化された一時停止** を追加できます。これにより、複数バブルの応答がより自然に感じられます。

- 設定: `agents.defaults.humanDelay` (`agents.list[].humanDelay` でエージェントごとに上書き)。
- モード: `off` (デフォルト)、`natural` (800-2500ms)、`custom` (`minMs`/`maxMs`)。
- **ブロック返信** にのみ適用され、最終返信やツール要約には適用されません。

## 「チャンクをストリーミングするか、すべてを送るか」

これは次に対応します:

- **チャンクをストリーミング:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (進行に応じて送出)。Telegram 以外のチャンネルでは `*.blockStreaming: true` も必要です。
- **最後にすべてをストリーミング:** `blockStreamingBreak: "message_end"` (一度フラッシュし、非常に長い場合は複数チャンクになる可能性があります)。
- **ブロックストリーミングなし:** `blockStreamingDefault: "off"` (最終返信のみ)。

**チャンネル注記:** `*.blockStreaming` が明示的に `true` に設定されていない限り、ブロックストリーミングは **オフ** です。チャンネルはブロック返信なしでライブプレビュー (`channels.<channel>.streaming`) をストリーミングできます。

設定場所の注意: `blockStreaming*` のデフォルトはルート設定ではなく、`agents.defaults` の下にあります。

## プレビューストリーミングモード

正規キー: `channels.<channel>.streaming`

モード:

- `off`: プレビューストリーミングを無効にします。
- `partial`: 最新テキストで置き換えられる単一プレビュー。
- `block`: チャンク化/追記された段階でプレビューを更新します。
- `progress`: 生成中の進捗/ステータスプレビュー、完了時に最終回答。

`streaming.mode: "block"` は、Discord や Telegram などの編集可能なチャンネル向けのプレビューストリーミングモードです。そこでチャンネルのブロック配信を有効にするものではありません。通常のブロック返信が必要な場合は `streaming.block.enabled` またはレガシーの `blockStreaming` チャンネルキーを使用してください。Microsoft Teams は例外です。下書きプレビューのブロックトランスポートがないため、`streaming.mode: "block"` はネイティブの partial/progress ストリーミングではなく Teams のブロック配信に対応します。

### チャンネル対応

| チャンネル | `off` | `partial` | `block` | `progress` |
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
- Discord: `streamMode` + ブールの `streaming` は、`streaming` enum のランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。
- Slack: `streamMode` は `streaming.mode` のランタイムエイリアスとして残ります。ブールの `streaming` は `streaming.mode` と `streaming.nativeTransport` のランタイムエイリアスとして残ります。レガシーの `nativeStreaming` は `streaming.nativeTransport` のランタイムエイリアスとして残ります。永続化された設定を書き換えるには `openclaw doctor --fix` を実行してください。

### ランタイム動作

Telegram:

- DM とグループ/トピック全体で `sendMessage` + `editMessageText` のプレビュー更新を使用します。
- 最終テキストはアクティブなプレビューをその場で編集します。長い最終回答ではそのメッセージを最初のチャンクとして再利用し、残りのチャンクだけを送信します。
- `progress` モードはツール進捗を編集可能なステータス下書きに保持し、完了時にその下書きを消去して、通常の配信で最終回答を送信します。
- 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします。
- Telegram のブロックストリーミングが明示的に有効な場合、二重ストリーミングを避けるためにプレビューストリーミングはスキップされます。
- `/reasoning stream` は、最終配信後に削除される一時プレビューに推論を書き込むことができます。

Discord:

- 送信 + 編集のプレビューメッセージを使用します。
- `block` モードは下書きチャンク化 (`draftChunk`) を使用します。
- Discord のブロックストリーミングが明示的に有効な場合、プレビューストリーミングはスキップされます。
- 最終メディア、エラー、明示的返信ペイロードは、新しい下書きをフラッシュせずに保留中のプレビューをキャンセルし、その後通常の配信を使用します。

Slack:

- `partial` は利用可能な場合、Slack ネイティブストリーミング (`chat.startStream`/`append`/`stop`) を使用できます。
- `block` は追記形式の下書きプレビューを使用します。
- `progress` はステータスプレビューテキストを使用し、その後最終回答を送ります。
- 返信スレッドのないトップレベル DM は、Slack ネイティブストリーミングの代わりに下書きプレビュー投稿と編集を使用します。
- ネイティブおよび下書きプレビューストリーミングはそのターンのブロック返信を抑制するため、Slack の返信は1つの配信パスだけでストリーミングされます。
- 最終メディア/エラーペイロードと進捗最終は、使い捨ての下書きメッセージを作成しません。プレビューを編集できるテキスト/ブロックの最終だけが、保留中の下書きテキストをフラッシュします。

Mattermost:

- 思考、ツール活動、部分的な返信テキストを単一の下書きプレビュー投稿にストリーミングし、最終回答を安全に送信できる時点でその場で確定します。
- プレビュー投稿が削除された、または確定時に利用できない場合は、新しい最終投稿の送信にフォールバックします。
- 最終メディア/エラーペイロードは、一時的なプレビュー投稿をフラッシュする代わりに、通常配信の前に保留中のプレビュー更新をキャンセルします。

Matrix:

- 最終テキストがプレビューイベントを再利用できる場合、下書きプレビューはその場で確定します。
- メディアのみ、エラー、返信ターゲット不一致の最終は、通常配信の前に保留中のプレビュー更新をキャンセルします。すでに表示されている古いプレビューは削除されます。

### ツール進捗プレビュー更新

プレビューストリーミングには **ツール進捗** 更新も含められます。これは「Web を検索中」「ファイルを読み取り中」「ツールを呼び出し中」のような短いステータス行で、ツールの実行中に最終返信に先立って同じプレビューメッセージ内に表示されます。これにより、複数ステップのツールターンは、最初の思考プレビューと最終回答の間で無音になるのではなく、視覚的に動き続けます。

対応サーフェス:

- **Discord**、**Slack**、**Telegram**、**Matrix** は、プレビューストリーミングが有効な場合、デフォルトでツール進行状況をライブプレビュー編集にストリーミングします。Microsoft Teams は、個人チャットでネイティブの進行状況ストリームを使用します。
- Telegram は `v2026.4.22` 以降、ツール進行状況のプレビュー更新を有効にした状態で出荷されています。有効なままにしておくことで、そのリリース済みの挙動を維持できます。
- **Mattermost** は、すでにツールアクティビティを単一のドラフトプレビュー投稿に折りたたんでいます（上記参照）。
- ツール進行状況の編集は、アクティブなプレビューストリーミングモードに従います。プレビューストリーミングが `off` の場合、またはブロックストリーミングがメッセージを引き継いだ場合はスキップされます。Telegram では、`streaming.mode: "off"` は最終応答のみです。汎用的な進行状況の通知も、単独のステータスメッセージとして配信されるのではなく抑制されますが、承認プロンプト、メディアペイロード、エラーは引き続き通常どおりルーティングされます。
- プレビューストリーミングを維持しつつツール進行状況の行を非表示にするには、そのチャンネルの `streaming.preview.toolProgress` を `false` に設定します。ツール進行状況の行を表示したまま command/exec テキストを非表示にするには、`streaming.preview.commandText` を `"status"` に設定するか、`streaming.progress.commandText` を `"status"` に設定します。デフォルトは、リリース済みの挙動を維持するため `"raw"` です。このポリシーは、Discord、Matrix、Microsoft Teams、Mattermost、Slack のドラフトプレビュー、Telegram など、OpenClaw のコンパクトな進行状況レンダラーを使用するドラフト/進行状況チャンネルで共有されます。プレビュー編集を完全に無効にするには、`streaming.mode` を `off` に設定します。
- Telegram の選択引用返信は例外です。`replyToMode` が `"off"` ではなく、選択された引用テキストが存在する場合、OpenClaw はそのターンの回答プレビューストリームをスキップするため、ツール進行状況のプレビュー行はレンダーされません。選択引用テキストのない現在のメッセージへの返信では、引き続きプレビューストリーミングが維持されます。詳細は [Telegram チャンネルドキュメント](/ja-JP/channels/telegram) を参照してください。

進行状況の行を表示したまま、生の command/exec テキストを非表示にします。

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

別のコンパクト進行状況チャンネルキーでも同じ形を使用します。たとえば `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`、または Slack のドラフトプレビューです。進行状況ドラフトモードでは、同じポリシーを `streaming.progress` の下に配置します。

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
- [進行状況ドラフト](/ja-JP/concepts/progress-drafts) - 長いターン中に更新される、表示可能な作業中メッセージ
- [メッセージ](/ja-JP/concepts/messages) - メッセージライフサイクルと配信
- [再試行](/ja-JP/concepts/retry) - 配信失敗時の再試行動作
- [チャンネル](/ja-JP/channels) - チャンネルごとのストリーミングサポート
