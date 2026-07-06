---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json フィールドをデバッグする必要がある
    - 自動Compactionの動作を変更する、または「pre-compaction」のハウスキーピングを追加する
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、(自動)Compaction の内部'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-07-06T21:51:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84b374402af261ed6d479dac85d44656cb83e52bba04d66153f3d66a608232ec
    source_path: reference/session-management-compaction.md
    workflow: 16
---

単一の **Gateway プロセス**がセッション状態をエンドツーエンドで所有します。UI（macOS アプリ、Web Control UI、TUI）は Gateway にセッション一覧とトークン数を問い合わせます。リモートモードでは、セッションファイルはリモートホスト上にあるため、ローカル Mac のファイルを確認しても Gateway が使用している内容は反映されません。

まず概要ドキュメント: [セッション管理](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[メモリ概要](/ja-JP/concepts/memory)、[メモリ検索](/ja-JP/concepts/memory-search)、[セッションのプルーニング](/ja-JP/concepts/session-pruning)、[トランスクリプト衛生](/ja-JP/reference/transcript-hygiene)、完全な設定リファレンスは [エージェント設定](/ja-JP/gateway/config-agents)。

## 2つの永続化レイヤー

1. **セッションストア (`sessions.json`)** - キー/値マップ `sessionKey -> SessionEntry`。小さく、変更可能で、エントリの編集や削除が安全です。現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなどのメタデータを追跡します。
2. **トランスクリプト (`<sessionId>.jsonl`)** - 追記専用でツリー構造（エントリは `id` + `parentId` を持つ）。会話、ツール呼び出し、Compaction サマリーを保存し、将来のターンのモデルコンテキストを再構築します。Compaction チェックポイントは、圧縮後の後続トランスクリプト上のメタデータです。新しい Compaction は、2つ目の `.checkpoint.*.jsonl` コピーを書き込みません。

Gateway の履歴リーダーは、画面が任意の過去アクセスを必要とする場合を除き、トランスクリプト全体の実体化を避けます。最初のページの履歴、埋め込みチャット履歴、再起動リカバリ、トークン/使用量チェックは、境界付きの末尾読み取りを使用します。完全なトランスクリプトスキャンは非同期トランスクリプトインデックスを通り、ファイルパスに加えて `mtimeMs`/`size` でキャッシュされ、同時リーダー間で共有されます。

## ディスク上の場所

エージェントごとに、Gateway ホスト上（`src/config/sessions.ts` により解決）:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

## ストアメンテナンスとディスク制御

`session.maintenance` は、`sessions.json`、トランスクリプト成果物、trajectory サイドカーの自動メンテナンスを制御します。

| キー                    | デフォルト            | 注記                                                                                     |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | または `"warn"`（レポートのみ、変更なし）                                                |
| `pruneAfter`            | `"30d"`               | 古いエントリの経過時間しきい値                                                           |
| `maxEntries`            | `500`                 | `sessions.json` 内のエントリ上限                                                         |
| `resetArchiveRetention` | `pruneAfter` と同じ   | `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。`false` はクリーンアップを無効化 |
| `maxDiskBytes`          | 未設定                | 任意のセッションディレクトリ予算                                                         |
| `highWaterBytes`        | `maxDiskBytes` の 80% | 予算クリーンアップ後の目標                                                               |

Gateway モデル実行プローブセッション（`agent:*:explicit:model-run-<uuid>` に一致するキー）には、独立した固定の `24h` 保持期間があります。このプルーニングは圧力ゲート付きです。セッションエントリのメンテナンス/上限圧力に達した場合にのみ実行され、グローバルな古いエントリのクリーンアップ/上限ステップの前にのみ実行されます。他の明示的セッションはこの保持期間を使用しません。

ディスク予算クリーンアップ（`mode: "enforce"`）の適用順序:

1. 最も古いアーカイブ、孤立トランスクリプト、または孤立 trajectory 成果物を最初に削除します。
2. それでも目標を超えている場合は、最も古いセッションエントリとそのトランスクリプト/trajectory ファイルを削除します。
3. 使用量が `highWaterBytes` 以下になるまで繰り返します。

`mode: "warn"` は、ストアやファイルを変更せずに、潜在的な削除を報告します。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

メンテナンスは、グループセッションやスレッドスコープのチャットセッションなど、耐久性のある外部会話ポインターを保持しますが、合成ランタイムエントリ（cron、hooks、heartbeat、ACP、サブエージェント）は、設定された経過時間、件数、またはディスク予算を超えると削除される場合があります。分離された cron 実行は、モデル実行プローブ保持とは独立した、別の `cron.sessionRetention` 制御を使用します。

通常の Gateway 書き込みは、ランタイムファイルロックを取得せずにプロセス内の変更を直列化する、ストアごとのセッションライターを通ります。ホットパスのパッチヘルパーは、そのライタースロットを保持しながら検証済みの可変キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新ごとに複製または再読み込みされることはありません。ランタイムコードでは `updateSessionStore(...)` / `updateSessionStoreEntry(...)` を優先してください。ストア全体の直接保存は、互換性とオフラインメンテナンスツール向けです。Gateway に到達できる場合、非ドライランの `openclaw sessions cleanup` と `openclaw agents delete` はストア変更を Gateway に委譲し、クリーンアップが同じライターキューに参加するようにします。`--store <path>` は直接ファイルメンテナンスのための明示的なオフライン修復パスで、常にローカルに留まります（`--dry-run` も同様）。`maxEntries` クリーンアップは本番規模のストア向けにバッチ化されているため、次の高水位クリーンアップで書き戻されるまで、ストアが設定された上限を短時間超える場合があります。読み取りは Gateway 起動中にエントリをプルーニングしたり上限適用したりしません。これを行うのは書き込み、または `openclaw sessions cleanup --enforce` のみです。後者は上限も即座に適用し、ディスク予算が設定されていない場合でも、参照されていない古いトランスクリプト、チェックポイント、trajectory 成果物をプルーニングします。

OpenClaw は、Gateway 書き込み中に自動の `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` が古い設定から削除します。

トランスクリプトの変更は、トランスクリプトファイル上のセッション書き込みロックを使用します。

| 設定                                 | デフォルト | 環境変数による上書き                             |
| ------------------------------------ | ---------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`    | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`  | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`   | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` は、ロック待機が諦める前にビジーセッションエラーとして表面化するまでの時間です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー作業が遅いマシン上でより長く競合する場合にのみ増やしてください。`staleMs` は、既存のロックを stale として再取得できるようになる時間です。`maxHoldMs` は、プロセス内 watchdog の解放しきい値です。

## Cron セッションと実行ログ

分離された cron 実行は、専用の保持期間を持つ独自のセッションエントリ/トランスクリプトを作成します。

- `cron.sessionRetention`（デフォルト `"24h"`）は、古い分離 cron 実行セッションをストアからプルーニングします。`false` は無効化します。
- `cron.runLog.keepLines` は、cron ジョブごとに保持される SQLite 実行履歴行をプルーニングします（デフォルト `2000`）。`cron.runLog.maxBytes` は、古いファイルベースの実行ログとの互換性のためにのみ受け付けられます。

cron が新しい分離実行セッションを強制作成する場合、新しい行を書き込む前に以前の `cron:<jobId>` セッションエントリをサニタイズします。安全な設定（thinking/fast/verbose/reasoning 設定、ラベル、表示名）と、明示的にユーザーが選択したモデル/auth 上書きを引き継ぎますが、周囲の会話コンテキスト（channel/group ルーティング、送信/キューポリシー、権限昇格、origin、ACP ランタイムバインディング）は削除するため、新しい分離実行が古い実行から古い配信権限やランタイム権限を継承することはありません。

## セッションキー (`sessionKey`)

`sessionKey` は、どの会話バケットにいるか（ルーティング + 分離）を識別します。正規ルール: [/concepts/session](/ja-JP/concepts/session)。

| パターン                     | 例                                                          |
| ---------------------------- | ----------------------------------------------------------- |
| メイン/直接チャット（エージェントごと） | `agent:<agentId>:<mainKey>`（デフォルト `main`）            |
| グループ                     | `agent:<agentId>:<channel>:group:<id>`                      |
| ルーム/チャンネル（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>`（上書きされない限り）                         |

## セッション ID (`sessionId`)

各 `sessionKey` は現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。判断ロジックは `src/auto-reply/reply/session.ts` の `initSessionState()` にあります。

- **リセット**（`/new`、`/reset`）は、その `sessionKey` の新しい `sessionId` を作成します。
- **日次リセット**（デフォルトは Gateway ホストのローカル時間で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes`、またはレガシーの `session.idleMinutes`）は、アイドルウィンドウ後にメッセージが到着したときに新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Control UI 再接続再開**は、Gateway がオペレーター UI クライアントから一致する `sessionId` を受け取った場合、1回の再接続送信について現在表示中のセッションを保持します。これは一度限りのシグナルです。通常の古い送信は引き続き新しい `sessionId` を作成します。
- **システムイベント**（heartbeat、cron wakeup、exec 通知、gateway bookkeeping）はセッション行を変更する場合がありますが、日次/アイドルリセットの鮮度を延長することはありません。リセットのロールオーバーは、新しいプロンプトが構築される前に、以前のセッションに対するキュー済みシステムイベント通知を破棄します。
- **親フォークポリシー**は、スレッドまたはサブエージェントフォークを作成する際に OpenClaw のアクティブブランチを使用します。そのブランチが大きすぎる場合（固定の内部上限を超える場合。現在は 100K トークン）、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ判定は自動で、設定できません。レガシーの `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。
- **オペレーターフォーク**: `sessions.create { parentSessionKey, fork: true }` は、親の現在の状態からトランスクリプトが分岐する新しいセッションを作成します（上記のサイズ上限を含む、サブエージェント spawn と同じフォーク機構）。親にアクティブな実行がある間はフォークが拒否され、明示的に渡されない限り親のモデル選択を継承し、子を新しいトークンカウンター付きの `forkedFromParent` としてマークします。

## セッションストアスキーマ (`sessions.json`)

値の型は `src/config/sessions.ts` の `SessionEntry` です。主なフィールド（網羅ではありません）:

- `sessionId`: 現在のトランスクリプト id（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度判定にはこれを使用します。レガシー行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャネル操作タイムスタンプ。アイドルリセットの鮮度判定にはこれを使用するため、Heartbeat、cron、exec イベントによってセッションが生存状態に保たれることはありません。このフィールドがないレガシー行では、復元されたセッション開始時刻にフォールバックします。
- `updatedAt`: 最後のストア行ミューテーションのタイムスタンプ。一覧表示/枝刈り/帳簿管理に使用されます。日次/アイドル鮮度判定の権威ではありません。
- `archivedAt`: 任意のアーカイブタイムスタンプ。アーカイブ済みセッションはトランスクリプトを保持したままストアに残り、通常のアクティブ一覧からは除外されます。
- `pinnedAt`: 任意のピン留めタイムスタンプ。アクティブなピン留め済みセッションは、ピン留めされていないセッションより前にソートされます。セッションをアーカイブすると、そのピン留めは解除されます。
- Codex スレッド相互運用: 両フィールドは Codex のスレッド管理形状に従います。ワイヤ上の `archived`/`pinned` ブール値は常にタイムスタンプから派生し、サーバー側でスタンプされます。これは Codex `threads.archived_at` セマンティクスと camelCase シリアライズに一致します。OpenClaw のタイムスタンプはエポックミリ秒ですが、Codex はエポック秒を使用するため、ブリッジは codex plugin 境界で変換します。Codex にはまだピン留め API がありません（`thread/archive`/`thread/unarchive` のみ）。そのため、ピン留め状態は API が存在するまで OpenClaw 側に留まり、存在した時点で、一致する形状によりバインド済みセッションがピン留め状態を機械的にラウンドトリップできるようになります。
- `lastReadAt` / `markedUnreadAt`: `sessions.patch { unread }` によってサーバー側でスタンプされる既読状態タイムスタンプ。`unread: false` は既読を記録します（`lastReadAt` を設定し、`markedUnreadAt` をクリアします）。`unread: true` は次の既読までセッションを未読としてマークします。セッション行は派生 `unread` ブール値を公開します。明示的に未読としてマークされている、または最新アクティビティより前に既読にされた場合です。一度も既読マークされていないセッションは `unread: false` のままなので、既存インストールがアップグレード時に点灯することはありません。
- `lastActivityAt`: 未読に値するアクティビティとしてカウントされる最後の完了済みエージェント実行（ユーザー、チャネル、cron 実行）のタイムスタンプ。Heartbeat と内部イベントターン、およびメタデータパッチでは更新されません。`updatedAt` はアクティビティ信号ではありません。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャネルのラベル付けメタデータ
- トグル: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy`（セッション単位の上書き）
- モデル選択: `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート/プロバイダー依存）: `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt` / `memoryFlushCompactionCount`: 最後の Compaction 前メモリフラッシュのタイムスタンプと Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッションの実行に伴い、エントリを書き換えたり再ハイドレートしたりする場合があります。

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）によって管理されます。ファイルは JSONL です。

- 先頭行: セッションヘッダー - `type: "session"`, `id`, `cwd`, `timestamp`, 任意の `parentSession`。
- 以降: `id` + `parentId`（ツリー構造）を持つエントリ。

主なエントリタイプ:

- `message`: ユーザー/アシスタント/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る拡張注入メッセージ（`display: true` の場合は TUI に表示され、`display: false` の場合は完全に非表示）
- `custom`: モデルコンテキストに入らない拡張状態（リロードをまたいで拡張状態を永続化するため）
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction サマリー
- `branch_summary`: ツリーブランチを移動するときの永続化されたサマリー

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用して読み書きします。

## コンテキストウィンドウと追跡トークン

2 つの異なる概念があります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルに見えるトークン）。モデルカタログから取得され、設定で上書きできます。
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（`/status` とダッシュボードで使用）。`contextTokens` はランタイムの推定/レポート値です。厳密な保証として扱わないでください。

制限の詳細: [/reference/token-use](/ja-JP/reference/token-use)。

## Compaction: それは何か

Compaction は、古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。Compaction 後、以降のターンには Compaction サマリーと `firstKeptEntryId` より後のメッセージが見えます。Compaction は、セッション枝刈りとは異なり **永続的** です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

Compaction 後の AGENTS.md セクション再注入は、`agents.defaults.compaction.postCompactionSections` によるオプトインです。未設定または `[]` の場合、OpenClaw は Compaction サマリーの上に AGENTS.md 抜粋を追加しません。

### チャンク境界とツールのペアリング

長いトランスクリプトを Compaction チャンクに分割するとき、OpenClaw はアシスタントのツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。

- トークン比率による分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離する代わりに、境界をアシスタントのツール呼び出しメッセージに移動します。
- 末尾のツール結果ブロックによってチャンクが目標を超える場合、OpenClaw はその保留中ツールブロックを保持し、未要約の末尾をそのまま保ちます。
- 中止/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにはしません。

## 自動 Compaction が発生するタイミング

組み込み OpenClaw エージェントには 2 つのトリガーがあります。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`、およびその他のプロバイダー形状のバリアント）を返した場合、Compaction してから再試行します。プロバイダーが試行されたトークン数を報告する場合、OpenClaw はその観測値をオーバーフロー回復 Compaction に転送します。プロバイダーがオーバーフローを確認したものの解析可能な数値を公開しない場合、OpenClaw は Compaction エンジンと診断に、最小限に予算超過した合成カウントを渡します。オーバーフロー回復がそれでも失敗した場合、OpenClaw は明示的なガイダンスを表示し、新しいセッション id に暗黙的にローテーションする代わりに現在のセッションマッピングを保持します。メッセージを再試行するか、`/compact` を実行するか、`/new` を実行してください。
2. **しきい値メンテナンス**: 成功したターンの後、`contextTokens > contextWindow - reserveTokens` の場合。ここで `contextWindow` はモデルのコンテキストウィンドウで、`reserveTokens` はプロンプトと次のモデル出力のために予約された余裕です。

これら 2 つのトリガーの外側で、さらに 2 つのガードが実行されます。

- **プリフライトローカル Compaction**: `agents.defaults.compaction.maxActiveTranscriptBytes`（バイト、または `"20mb"` のような文字列）を設定すると、アクティブなトランスクリプトファイルがそのサイズに達した後、次の実行を開く前にローカル Compaction をトリガーします。これはローカル再オープンコストのためのファイルサイズガードであり、生のアーカイブではありません。通常の意味的 Compaction は引き続き実行され、Compaction 済みサマリーが新しい後続トランスクリプトになるよう `truncateAfterCompaction` が必要です。
- **ターン中プリチェック**: `agents.defaults.compaction.midTurnPrecheck.enabled: true`（デフォルトは `false`）を設定すると、ツールループガードを追加します。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使用するものと同じプリフライト予算ロジックでプロンプト圧力を推定します。コンテキストが収まらなくなった場合、このガードはインラインで Compaction しません。構造化されたターン中プリチェック信号を発生させ、現在のプロンプト送信を停止し、外側の実行ループに既存の回復パスを使用させます（それで十分な場合は過大なツール結果を切り詰める、または設定された Compaction モードをトリガーして再試行する）。プロバイダー支援 safeguard Compaction を含め、`default` と `safeguard` の両 Compaction モードで動作します。`maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンを開く前に実行され、ターン中プリチェックは後で、新しいツール結果が追加された後に実行されます。

## Compaction 設定

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw は組み込み実行に対して安全下限も適用します。`compaction.reserveTokens` が `reserveTokensFloor`（デフォルト `20000`）を下回る場合、OpenClaw はそれを引き上げます。下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。アクティブモデルのコンテキストウィンドウが既知の場合、下限と最終的な有効予約の両方が上限設定され、予約がプロンプト予算全体を消費しないようにします。これにより、小さなコンテキストのモデル（たとえば 16K トークンのローカルモデル）が最初のトークンから Compaction に入ることを防ぎます。既知のコンテキストウィンドウがない場合、設定済みおよび現在の予約予算は上限設定されません。そもそも下限がある理由: Compaction が避けられなくなる前に、複数ターンの「ハウスキーピング」（下記のメモリフラッシュなど）のために十分な余裕を残すためです。実装: `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()`。組み込みランナーのターンおよび Compaction セットアップパスから呼び出されます。

手動 `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、ランタイムの最近末尾カットポイントを保持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントとなり、再構築されたコンテキストは新しいサマリーから開始します。

`truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブトランスクリプトを Compaction 済みの後続 JSONL にローテーションします。ブランチ/復元チェックポイントアクションは、その Compaction 済み後続を使用します。レガシーの Compaction 前チェックポイントファイルは、参照されている間は読み取り可能なままです。

## プラグ可能な Compaction プロバイダー

Plugins は plugin API 上の `registerCompactionProvider()` を介して Compaction プロバイダーを登録します。`agents.defaults.compaction.provider` が登録済みプロバイダー id に設定されている場合、safeguard 拡張は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー plugin の id。デフォルトの LLM 要約を使う場合は未設定のままにします。`provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、safeguard はプロバイダー出力後も最近ターンと分割ターンの接尾コンテキストを保持します。
- 組み込み safeguard 要約は、以前のサマリー全体を逐語的に保持するのではなく、新しいメッセージとともに以前のサマリーを再蒸留します。
- safeguard モードでは、サマリー品質監査がデフォルトで有効になります。形式不正出力時の再試行動作をスキップするには `qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックします。呼び出し元が明示的にトリガーした中止/タイムアウト信号は握りつぶされず再スローされるため、キャンセルは常に尊重されます。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`。

## ユーザーに見えるサーフェス

- 任意のチャットセッション内の `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- 詳細モード: `🧹 Auto-compaction complete` と Compaction 回数

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を表示すべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートします。

- アシスタントは出力の先頭に正確なサイレントトークン `NO_REPLY` / `no_reply` を付けることで、「ユーザーに返信を配信しない」ことを意味します。OpenClaw は配信レイヤーでこれを除去/抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しません。ペイロード全体がサイレントトークンだけの場合、`NO_REPLY` と `no_reply` はどちらも該当します。
- `2026.1.10` 以降、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、下書き/入力中ストリーミングも抑制するため、サイレント操作がターン途中で部分出力を漏らしません。
- これは真のバックグラウンド/非配信ターン専用です - 通常の対応可能なユーザーリクエストの近道ではありません。

## Compaction 前のメモリフラッシュ

自動 Compaction が発生する前に、OpenClaw は永続状態をディスクへ書き込むサイレントなエージェントターンを実行できます（たとえばエージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction が重要なコンテキストを消去できなくなります。セッションのコンテキスト使用量を監視し、Compaction しきい値より低いソフトしきい値を超えると、正確なサイレントトークン `NO_REPLY` / `no_reply` を使ってサイレントな「今すぐメモリを書き込む」指示を送信するため、ユーザーには何も表示されません。

設定（`agents.defaults.compaction.memoryFlush`）、完全なリファレンスは [/gateway/config-agents](/ja-JP/gateway/config-agents#agentsdefaultscompaction):

| キー                        | デフォルト       | 注記                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | フラッシュターンだけに対する正確なプロバイダー/モデルの上書き。例: `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | フラッシュをトリガーする、Compaction しきい値より下の差分                                                                               |
| `forceFlushTranscriptBytes` | 未設定（無効）   | トークンカウンターが古い場合でも、トランスクリプトファイルがこのバイトサイズ（または `"2mb"` のような文字列）に達したらフラッシュを強制します。`0` は無効化します |
| `prompt`                    | 組み込み         | フラッシュターン用のユーザーメッセージ                                                                                                  |
| `systemPrompt`              | 組み込み         | フラッシュターン用に追加される追加のシステムプロンプト                                                                                  |

注記:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれています。
- `model` が設定されている場合、フラッシュターンはアクティブなセッションのフォールバックチェーンを継承せずにそのモデルを使用します。そのため、ローカル専用のハウスキーピングが失敗時に有料の会話モデルへ暗黙にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに1回実行されます（`sessions.json` で追跡）。
- フラッシュは埋め込み OpenClaw セッションでのみ実行されます。CLI バックエンドと Heartbeat ターンではスキップされます。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[メモリ](/ja-JP/concepts/memory) を参照してください。

OpenClaw は拡張 API で `session_before_compact` フックを公開していますが、上記のフラッシュロジックはそのフック上ではなく、Gateway 側（`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`）にあります。

## トラブルシューティングチェックリスト

- **セッションキーが間違っていますか？** [/concepts/session](/ja-JP/concepts/session) から始め、`/status` の `sessionKey` を確認してください。
- **ストアとトランスクリプトが一致しませんか？** `openclaw status` で Gateway ホストとストアパスを確認してください。
- **Compaction が頻発しますか？** モデルのコンテキストウィンドウ（小さすぎると頻繁な Compaction が発生します）、`reserveTokens`（モデルウィンドウに対して高すぎると早期の Compaction が発生します）、ツール結果の肥大化（セッション pruning を調整）を確認してください。
- **小さなローカルモデルですべてのプロンプトがオーバーフローするように見えますか？** プロバイダーが正しいモデルコンテキストウィンドウを報告していることを確認してください。OpenClaw は、そのウィンドウが既知の場合にのみ有効な予約量を上限設定できます。
- **サイレントターンが漏れていますか？** 返信が正確なサイレントトークン `NO_REPLY`（大文字小文字を区別しない）で始まっていること、およびストリーミング抑制修正（`2026.1.10` 以降）を含むビルドを使用していることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
- [エージェント設定リファレンス](/ja-JP/gateway/config-agents)
