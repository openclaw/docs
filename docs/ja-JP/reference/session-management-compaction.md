---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json フィールドをデバッグする必要がある
    - 自動Compactionの動作を変更している、または「事前Compaction」の整理処理を追加している
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、(自動)Compaction 内部仕様'
title: セッション管理の詳細
x-i18n:
    generated_at: "2026-06-27T13:01:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、次の領域にわたってセッションをエンドツーエンドで管理します。

- **セッションルーティング**（受信メッセージを `sessionKey` に対応付ける方法）
- **セッションストア**（`sessions.json`）と、それが追跡する内容
- **トランスクリプト永続化**（`*.jsonl`）とその構造
- **トランスクリプト衛生**（実行前のプロバイダー固有の修正）
- **コンテキスト上限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と、Compaction 前処理をフックする場所
- **サイレントなハウスキーピング**（ユーザーに見える出力を生成すべきでないメモリ書き込み）

先に上位レベルの概要を確認したい場合は、次から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッション剪定](/ja-JP/concepts/session-pruning)
- [トランスクリプト衛生](/ja-JP/reference/transcript-hygiene)

---

## 真実のソース: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス** を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせる必要があります。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカルの Mac ファイルを確認する」ことでは、Gateway が使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーに永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集（またはエントリ削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど）を追跡します

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用トランスクリプト（エントリは `id` + `parentId` を持ちます）
   - 実際の会話、ツール呼び出し、Compaction サマリーを保存します
   - 将来のターンでモデルコンテキストを再構築するために使用されます
   - Compaction チェックポイントは、Compaction 済みの後続トランスクリプトに対するメタデータです。新しい Compaction は 2 つ目の `.checkpoint.*.jsonl` コピーを書き込みません。

Gateway の履歴リーダーは、画面が任意の履歴アクセスを明示的に必要とする場合を除き、トランスクリプト全体の実体化を避ける必要があります。最初のページの履歴、埋め込みチャット履歴、再起動リカバリー、トークン/使用量チェックは、境界付きの末尾読み取りを使用します。完全なトランスクリプトスキャンは非同期トランスクリプトインデックスを経由し、これはファイルパスと `mtimeMs`/`size` によってキャッシュされ、同時リーダー間で共有されます。

---

## ディスク上の場所

エージェントごとに、Gateway ホスト上で:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` 経由で解決します。

---

## ストア保守とディスク制御

セッション永続化には、`sessions.json`、トランスクリプト成果物、トラジェクトリサイドカー向けの自動保守制御（`session.maintenance`）があります。

- `mode`: `enforce`（デフォルト）または `warn`
- `pruneAfter`: 古いエントリの年齢カットオフ（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- 短命の Gateway モデル実行プローブ保持は `24h` に固定されていますが、これは圧力制御されます。セッションエントリの保守/上限圧力に達した場合にのみ、古い厳密プローブ行を削除します。これは `agent:*:explicit:model-run-<uuid>` に一致する厳密な明示的プローブキーにのみ適用され、実行時にはグローバルな古いエントリのクリーンアップ/上限制御より前に実行されます。
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップを無効化）
- `maxDiskBytes`: 任意のセッションディレクトリ予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みは、ランタイムファイルロックを取らずにプロセス内の変更を直列化する、ストアごとのセッションライターを通ります。ホットパスのパッチヘルパーは、そのライタースロットを保持している間、検証済みの変更可能キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新ごとに複製または再読み取りされることはありません。ランタイムコードでは `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。ストア全体の直接保存は、互換性およびオフライン保守用ツールです。Gateway に到達可能な場合、ドライランではない `openclaw sessions cleanup` と `openclaw agents delete` はストア変更を Gateway に委譲するため、クリーンアップは同じライターキューに参加します。`--store <path>` は、直接ファイル保守のための明示的なオフライン修復パスです。`maxEntries` クリーンアップは本番規模の上限向けに引き続きバッチ化されるため、次の高水位クリーンアップで書き戻されるまで、ストアが設定済み上限を一時的に超える場合があります。セッションストア読み取りは、Gateway 起動中にエントリの剪定や上限制御を行いません。クリーンアップには書き込み、または `openclaw sessions cleanup --enforce` を使用してください。`openclaw sessions cleanup --enforce` は、ディスク予算が設定されていない場合でも、設定済み上限を即座に適用し、古い未参照のトランスクリプト、チェックポイント、トラジェクトリ成果物を剪定します。

保守は、グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターを保持しますが、cron、フック、Heartbeat、ACP、サブエージェント向けの合成ランタイムエントリは、設定済みの年齢、件数、またはディスク予算を超えると削除される場合があります。Gateway モデル実行プローブセッションは、キーが `agent:*:explicit:model-run-<uuid>` に完全一致する場合にのみ、別個の `24h` モデル実行保持を使用します。他の明示的セッションはその保持の対象ではありません。モデル実行クリーンアップは、セッションエントリ上限の圧力下でのみ適用されます。分離 cron 実行は、モデル実行プローブ保持とは独立した独自の `cron.sessionRetention` 制御を保持します。

OpenClaw は、Gateway 書き込み中に自動的な `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` が古い設定から削除します。

トランスクリプト変更は、トランスクリプトファイル上のセッション書き込みロックを使用します。ロック取得は、ビジーセッションエラーを表面化する前に最大 `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー処理が低速なマシンでより長く競合する場合にのみ、この値を上げてください。`session.writeLock.staleMs` は、既存ロックを古いものとして再取得できるタイミングを制御します。デフォルトは `1800000` ms です。`session.writeLock.maxHoldMs` は、プロセス内ウォッチドッグの解放しきい値を制御します。デフォルトは `300000` ms です。緊急用の環境変数オーバーライドは、`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`、`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`、`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS` です。

ディスク予算クリーンアップの適用順序（`mode: "enforce"`）:

1. 最も古いアーカイブ、孤立トランスクリプト、または孤立トラジェクトリ成果物を最初に削除します。
2. まだ目標を上回っている場合は、最も古いセッションエントリとそのトランスクリプト/トラジェクトリファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで続行します。

`mode: "warn"` では、OpenClaw は退避の可能性を報告しますが、ストア/ファイルは変更しません。

必要に応じて保守を実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離 cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御を持ちます。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから剪定します（`false` で無効化）。
- `cron.runLog.keepLines` は、cron ジョブごとの保持済み SQLite 実行履歴行を剪定します（デフォルト: `2000`）。`cron.runLog.maxBytes` は、古いファイルベースの実行ログ向けに引き続き受け付けられます。

cron が新しい分離実行セッションを強制作成すると、新しい行を書き込む前に、以前の `cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、明示的なユーザー選択のモデル/認証オーバーライドなど、安全な設定を引き継ぎます。チャネル/グループルーティング、送信またはキューポリシー、昇格、オリジン、ACP ランタイムバインディングなどの周辺会話コンテキストは削除されるため、新しい分離実行が古い実行から古い配信やランタイム権限を継承することはありません。

---

## セッションキー（`sessionKey`）

`sessionKey` は、自分がいる _会話バケット_（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/直接チャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされない限り）

正規のルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

目安:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシーの `session.idleMinutes`）は、アイドル期間後にメッセージが到着したとき、新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Control UI 再接続再開**は、Gateway がオペレーター UI クライアントから一致する `sessionId` を受け取った場合、1 回の再接続送信に対して現在表示中のセッションを保持できます。通常の古い送信は、引き続き新しい `sessionId` を作成します。
- **システムイベント**（Heartbeat、cron ウェイクアップ、exec 通知、Gateway ブックキーピング）はセッション行を変更する場合がありますが、日次/アイドルリセットの鮮度は延長しません。リセットロールオーバーは、新しいプロンプトが構築される前に、前セッション向けにキューされたシステムイベント通知を破棄します。
- **親フォークポリシー**は、スレッドまたはサブエージェントフォークを作成するときに、OpenClaw のアクティブブランチを使用します。そのブランチが大きすぎる場合、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ判定ポリシーは自動です。レガシーの `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

実装詳細: この判断は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度はこれを使用します。レガシー行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャネルインタラクションのタイムスタンプ。アイドルリセットの鮮度はこれを使用するため、Heartbeat、cron、exec イベントはセッションを維持しません。このフィールドがないレガシー行は、復元されたセッション開始時刻をアイドル鮮度のフォールバックとして使用します。
- `updatedAt`: 最後のストア行変更タイムスタンプで、一覧表示、剪定、ブックキーピングに使用されます。日次/アイドルリセット鮮度の権威ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーを補助）
- `provider`、`subject`、`room`、`space`、`displayName`: グループ/チャネルのラベル付け用メタデータ
- トグル:
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュ実行時の Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッションの実行中にエントリを書き換えたり再ハイドレートしたりする場合があります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `openclaw/plugin-sdk/agent-sessions` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 先頭行: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- 以降: `id` + `parentId` を持つセッションエントリ（ツリー）

注目すべきエントリタイプ:

- `message`: user/assistant/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る、拡張機能から注入されたメッセージ（UI から非表示にできる）
- `custom`: モデルコンテキストに入らない拡張機能の状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を含む永続化された Compaction サマリー
- `branch_summary`: ツリーブランチを移動するときの永続化されたサマリー

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使ってそれらを読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルに見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整している場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書き可能）。
- ストア内の `contextTokens` はランタイムの推定値/レポート値です。厳密な保証として扱わないでください。

詳しくは [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: 概要

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。

Compaction 後、以後のターンで見えるもの:

- Compaction サマリー
- `firstKeptEntryId` 以降のメッセージ

Compaction 後の AGENTS.md セクション再注入は、
`agents.defaults.compaction.postCompactionSections` によるオプトインです。未設定または `[]` の場合、
OpenClaw は Compaction サマリーの上に AGENTS.md 抜粋を追加しません。

Compaction は（セッション剪定とは異なり）**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールのペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクに分割するとき、assistant のツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。

- トークン比率による分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離するのではなく、境界を assistant のツール呼び出しメッセージへ移動します。
- 末尾のツール結果ブロックによってチャンクがターゲットを超えてしまう場合、OpenClaw はその保留中のツールブロックを保持し、要約されていない末尾をそのまま残します。
- 中止/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにはしません。

---

## 自動 Compaction が発生するタイミング（OpenClaw ランタイム）

組み込み OpenClaw エージェントでは、自動 Compaction は 2 つの場合にトリガーされます。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`、および類似するプロバイダー形式のバリアント) を返す → Compaction → 再試行。
   プロバイダーが試行されたトークン数を報告する場合、OpenClaw はその観測値をオーバーフロー回復 Compaction に転送します。プロバイダーがオーバーフローを確認しても解析可能な数値を公開しない場合、OpenClaw は予算を最小限超過した合成カウントを Compaction エンジンと診断へ渡します。
   オーバーフロー回復がそれでも失敗した場合、OpenClaw はユーザーに明示的なガイダンスを表示し、セッションキーを新しいセッション ID に黙ってローテーションするのではなく、現在のセッションマッピングを保持します。次の手順はオペレーター制御です:
   メッセージを再試行する、`/compact` を実行する、または新しいセッションを希望する場合は `/new` を実行します。
2. **しきい値メンテナンス**: 成功したターンの後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力用に予約された余裕

これらは OpenClaw ランタイムのセマンティクスです。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、アクティブなトランスクリプトファイルがそのサイズに達したとき、次の実行を開く前にプリフライトのローカル Compaction をトリガーすることもできます。これはローカル再オープンコストのためのファイルサイズガードであり、生のアーカイブではありません。OpenClaw は通常のセマンティック Compaction を引き続き実行し、圧縮済みサマリーが新しい後続トランスクリプトになれるよう `truncateAfterCompaction` を必要とします。

組み込み OpenClaw 実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` によってオプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使うものと同じプリフライト予算ロジックでプロンプト圧力を推定します。コンテキストが収まらなくなった場合、このガードは OpenClaw ランタイムの `transformContext` フック内では Compaction しません。構造化されたターン中プリチェックシグナルを発生させ、現在のプロンプト送信を停止し、外側の実行ループに既存の回復パスを使わせます。十分な場合はサイズ超過のツール結果を切り詰めるか、設定済みの Compaction モードをトリガーして再試行します。このオプションはデフォルトで無効で、プロバイダー支援の safeguard Compaction を含む `default` と `safeguard` の両方の Compaction モードで動作します。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンが開く前に実行され、ターン中プリチェックは新しいツール結果が追加された後、組み込み OpenClaw ツールループ内で後から実行されます。

---

## Compaction 設定（`reserveTokens`, `keepRecentTokens`）

OpenClaw ランタイムの Compaction 設定はエージェント設定にあります。

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は組み込み実行に対して安全フロアも強制します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はそれを引き上げます。
- デフォルトのフロアは `20000` トークンです。
- フロアを無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動の `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、OpenClaw ランタイムの最近末尾の切断点を保持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントのままで、再構築されたコンテキストは新しいサマリーから開始します。
- 新しいツール結果の後、次のモデル呼び出しの前に任意のツールループプリチェックを実行するには、`agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。これはトリガーのみです。サマリー生成は引き続き設定済みの Compaction パスを使います。これはターン開始時のアクティブトランスクリプトのバイトサイズガードである `maxActiveTranscriptBytes` とは独立しています。
- アクティブなトランスクリプトが大きくなったとき、ターンの前にローカル Compaction を実行するには、`agents.defaults.compaction.maxActiveTranscriptBytes` にバイト値または `"20mb"` のような文字列を設定します。このガードは `truncateAfterCompaction` も有効な場合にのみ有効です。無効にするには未設定のままにするか `0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを圧縮済みの後続 JSONL にローテーションします。ブランチ/復元チェックポイントアクションはその圧縮済み後続を使用します。参照されている間、レガシーの Compaction 前チェックポイントファイルは読み取り可能なままです。

理由: Compaction が避けられなくなる前に、メモリ書き込みのような複数ターンの「ハウスキーピング」に十分な余裕を残すためです。

実装: `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()`
（組み込みランナーのターンと Compaction セットアップパスから呼び出されます）。

---

## プラグ可能な Compaction プロバイダー

Plugin は Plugin API 上の `registerCompactionProvider()` で Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、safeguard 拡張機能は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーへ要約を委任します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使う場合は未設定にします。
- `provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示と識別子保持ポリシーを受け取ります。
- safeguard は、プロバイダー出力の後でも最近ターンと分割ターンのサフィックスコンテキストを保持します。
- 組み込み safeguard 要約は、以前のサマリー全体をそのまま保持するのではなく、以前のサマリーを新しいメッセージと合わせて再蒸留します。
- safeguard モードでは、サマリー品質監査がデフォルトで有効になります。形式不正出力時の再試行動作をスキップするには `qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックします。
- 中止/タイムアウトシグナルは、呼び出し元のキャンセルを尊重するため、（握りつぶされずに）再スローされます。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`。

---

## ユーザーに見えるサーフェス

Compaction とセッション状態は次の方法で観測できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- 詳細モード: `🧹 Auto-compaction complete` + Compaction 回数

---

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

規約:

- assistant は出力を正確なサイレントトークン `NO_REPLY` / `no_reply` で開始し、「ユーザーへ返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを取り除く/抑制します。
- 正確なサイレントトークン抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけである場合、`NO_REPLY` と `no_reply` はどちらも該当します。
- これは真のバックグラウンド/非配信ターン専用です。通常の対応可能なユーザーリクエストのショートカットではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**下書き/入力中ストリーミング** も抑制するため、サイレント操作がターン中に部分出力を漏らしません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目標: 自動 Compaction が発生する前に、永続的な状態をディスク（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）へ書き込むサイレントなエージェントターンを実行し、Compaction が重要なコンテキストを消せないようにします。

OpenClaw は **事前しきい値フラッシュ** アプローチを使います。

1. セッションコンテキスト使用量を監視します。
2. （OpenClaw ランタイムの Compaction しきい値より下の）「ソフトしきい値」を超えたら、エージェントにサイレントな「今すぐメモリを書き込む」指示を実行します。
3. 正確なサイレントトークン `NO_REPLY` / `no_reply` を使い、ユーザーには何も見せません。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `model`（フラッシュターン用の任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注記:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用するため、ローカル専用のハウスキーピングが有料の会話モデルへ黙ってフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡）。
- フラッシュは組み込み OpenClaw セッションでのみ実行されます（CLI バックエンドはスキップします）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースファイルレイアウトと書き込みパターンについては [Memory](/ja-JP/concepts/memory) を参照してください。

OpenClaw は拡張機能 API で `session_before_compact` フックも公開していますが、OpenClaw のフラッシュロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っている場合は、[/concepts/session](/ja-JP/concepts/session) から始め、`/status` の `sessionKey` を確認します。
- ストアとトランスクリプトが一致しない場合は、`openclaw status` から Gateway ホストとストアパスを確認します。
- Compaction が頻発する場合は、次を確認します:
  - モデルコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、Compaction が早く発生する可能性があります）
  - ツール結果の肥大化: セッション剪定を有効化/調整します
- サイレントターンが漏れる場合は、返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使用していることを確認します。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション剪定](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
