---
read_when:
    - セッション ID、トランスクリプト JSONL、または `sessions.json` フィールドをデバッグする必要がある
    - 自動 Compaction の動作を変更している、または「pre-compaction」のハウスキーピングを追加している
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストアとトランスクリプト、ライフサイクル、(自動)Compaction の内部処理'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-07-05T11:45:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ec602a2d21f32a058500fe6d25f91c06e53582c4e028042d331a6c96355fcb
    source_path: reference/session-management-compaction.md
    workflow: 16
---

単一の **Gatewayプロセス** がセッション状態をエンドツーエンドで所有します。UI（macOS アプリ、Web Control UI、TUI）は Gateway にセッション一覧とトークン数を問い合わせます。リモートモードでは、セッションファイルはリモートホスト上にあるため、ローカル Mac のファイルを確認しても Gateway が使用している内容は反映されません。

まず概要ドキュメント: [セッション管理](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[メモリ概要](/ja-JP/concepts/memory)、[メモリ検索](/ja-JP/concepts/memory-search)、[セッションの刈り込み](/ja-JP/concepts/session-pruning)、[トランスクリプト衛生](/ja-JP/reference/transcript-hygiene)、完全な設定リファレンスは [エージェント設定](/ja-JP/gateway/config-agents) を参照してください。

## 2つの永続化レイヤー

1. **セッションストア（`sessions.json`）** - キー/値マップ `sessionKey -> SessionEntry`。小さく、変更可能で、エントリの編集や削除が安全です。現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなどのメタデータを追跡します。
2. **トランスクリプト（`<sessionId>.jsonl`）** - 追記専用で、ツリー構造（エントリは `id` + `parentId` を持つ）。会話、ツール呼び出し、Compaction サマリーを保存し、将来のターンのモデルコンテキストを再構築します。Compaction チェックポイントは、圧縮された後続トランスクリプト上のメタデータです。新しい Compaction が2つ目の `.checkpoint.*.jsonl` コピーを書き込むことはありません。

Gateway の履歴リーダーは、サーフェスが任意の履歴アクセスを必要としない限り、トランスクリプト全体の実体化を避けます。最初のページの履歴、埋め込みチャット履歴、再起動復旧、トークン/使用量チェックは、境界付きの末尾読み取りを使用します。完全なトランスクリプトスキャンは非同期トランスクリプトインデックスを経由し、ファイルパスに `mtimeMs`/`size` を加えたキーでキャッシュされ、同時実行リーダー間で共有されます。

## ディスク上の場所

エージェントごとに、Gateway ホスト上（`src/config/sessions.ts` によって解決）:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

## ストアメンテナンスとディスク制御

`session.maintenance` は、`sessions.json`、トランスクリプト成果物、トラジェクトリサイドカーの自動メンテナンスを制御します。

| キー                    | デフォルト          | 注記                                                                                  |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`         | または `"warn"`（報告のみ、変更なし）                                                 |
| `pruneAfter`            | `"30d"`             | 古いエントリの年齢カットオフ                                                          |
| `maxEntries`            | `500`               | `sessions.json` 内のエントリ上限                                                      |
| `resetArchiveRetention` | `pruneAfter` と同じ | `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。`false` でクリーンアップ無効 |
| `maxDiskBytes`          | 未設定              | 任意のセッションディレクトリ予算                                                      |
| `highWaterBytes`        | `maxDiskBytes` の80% | 予算クリーンアップ後の目標                                                            |

Gateway のモデル実行プローブセッション（`agent:*:explicit:model-run-<uuid>` に一致するキー）は、別個の固定 `24h` 保持期間を持ちます。この刈り込みは負荷に応じてゲートされます。つまり、セッションエントリのメンテナンス/上限圧力に達した場合にのみ実行され、グローバルな古いエントリのクリーンアップ/上限ステップの前にのみ実行されます。他の明示的セッションはこの保持期間を使用しません。

ディスク予算クリーンアップの適用順序（`mode: "enforce"`）:

1. 最も古いアーカイブ済み、孤立トランスクリプト、または孤立トラジェクトリ成果物を最初に削除します。
2. まだ目標を上回る場合、最も古いセッションエントリとそのトランスクリプト/トラジェクトリファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで繰り返します。

`mode: "warn"` は、ストアやファイルを変更せずに、退避候補を報告します。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

メンテナンスは、グループセッションやスレッドスコープのチャットセッションなど、永続的な外部会話ポインターを保持しますが、合成ランタイムエントリ（cron、フック、heartbeat、ACP、サブエージェント）は、設定された年齢、件数、またはディスク予算を超えると削除されることがあります。分離された cron 実行は、モデル実行プローブ保持とは独立した別個の `cron.sessionRetention` 制御を使用します。

通常の Gateway 書き込みは、プロセス内の変更をランタイムファイルロックなしで直列化する、ストアごとのセッションライターを経由します。ホットパスのパッチヘルパーは、そのライタースロットを保持しながら検証済みの可変キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新のたびに複製されたり再読み取りされたりすることはありません。ランタイムコードでは `updateSessionStore(...)` / `updateSessionStoreEntry(...)` を優先してください。ストア全体の直接保存は、互換性とオフラインメンテナンスツール用です。Gateway に到達できる場合、ドライランでない `openclaw sessions cleanup` と `openclaw agents delete` は、ストア変更を Gateway に委譲し、クリーンアップが同じライターキューに参加するようにします。`--store <path>` は直接ファイルメンテナンス用の明示的なオフライン修復パスであり、常にローカルに留まります（`--dry-run` も同様）。`maxEntries` クリーンアップは本番サイズのストア向けにバッチ化されるため、次の高水位クリーンアップで上限まで書き戻されるまで、ストアが設定上限を一時的に超える場合があります。読み取りは Gateway 起動中にエントリの刈り込みや上限適用を行いません。これを行うのは書き込みまたは `openclaw sessions cleanup --enforce` のみで、後者は上限も即時適用し、ディスク予算が設定されていなくても古い未参照のトランスクリプト、チェックポイント、トラジェクトリ成果物を刈り込みます。

OpenClaw は、Gateway 書き込み中に自動の `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーな `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からこれを削除します。

トランスクリプト変更は、トランスクリプトファイル上のセッション書き込みロックを使用します。

| 設定                                 | デフォルト | 環境変数オーバーライド                           |
| ------------------------------------ | ---------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`    | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`  | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`   | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` は、ロック待機が諦める前にビジーセッションエラーとして表面化するまでの時間です。正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー作業が遅いマシン上でより長く競合する場合にのみ増やしてください。`staleMs` は、既存のロックを古いものとして回収できるタイミングです。`maxHoldMs` は、プロセス内ウォッチドッグの解放しきい値です。

## Cron セッションと実行ログ

分離された cron 実行は、専用の保持期間を持つ独自のセッションエントリ/トランスクリプトを作成します。

- `cron.sessionRetention`（デフォルト `"24h"`）は、古い分離 cron 実行セッションをストアから刈り込みます。`false` で無効化します。
- `cron.runLog.keepLines` は、cron ジョブごとに保持される SQLite 実行履歴行を刈り込みます（デフォルト `2000`）。`cron.runLog.maxBytes` は、古いファイルベースの実行ログとの互換性のためだけに受け入れられます。

cron が新しい分離実行セッションを強制作成する場合、新しい行を書き込む前に前回の `cron:<jobId>` セッションエントリをサニタイズします。安全なプリファレンス（thinking/fast/verbose/reasoning 設定、ラベル、表示名）と、明示的にユーザーが選択したモデル/認証オーバーライドは引き継ぎますが、周辺の会話コンテキスト（チャンネル/グループルーティング、送信/キューポリシー、昇格、origin、ACP ランタイムバインディング）は削除します。これにより、新しい分離実行が古い実行から古い配信権限やランタイム権限を継承できないようにします。

## セッションキー（`sessionKey`）

`sessionKey` は、自分がどの会話バケットにいるか（ルーティング + 分離）を識別します。正規ルール: [/concepts/session](/ja-JP/concepts/session)。

| パターン                    | 例                                                          |
| --------------------------- | ----------------------------------------------------------- |
| メイン/ダイレクトチャット（エージェントごと） | `agent:<agentId>:<mainKey>`（デフォルト `main`）            |
| グループ                    | `agent:<agentId>:<channel>:group:<id>`                      |
| ルーム/チャンネル（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>` |
| Cron                        | `cron:<job.id>`                                             |
| Webhook                     | `hook:<uuid>`（上書きされない限り）                         |

## セッション ID（`sessionId`）

各 `sessionKey` は現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。判定ロジックは `src/auto-reply/reply/session.ts` の `initSessionState()` にあります。

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻午前4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes`、またはレガシーな `session.idleMinutes`）は、アイドルウィンドウ後にメッセージが到着したときに新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合、先に期限切れになった方が優先されます。
- **Control UI 再接続の再開** は、Gateway がオペレーター UI クライアントから一致する `sessionId` を受信した場合、1回の再接続送信について現在表示中のセッションを保持します。これは一度だけのシグナルです。通常の古い送信では引き続き新しい `sessionId` が作成されます。
- **システムイベント**（heartbeat、cron ウェイクアップ、exec 通知、Gateway ブックキーピング）はセッション行を変更する場合がありますが、日次/アイドルリセットの鮮度を延長することはありません。リセットロールオーバーは、新しいプロンプトが構築される前に、前のセッション向けにキューされたシステムイベント通知を破棄します。
- **親フォークポリシー** は、スレッドまたはサブエージェントフォークを作成するときに OpenClaw のアクティブブランチを使用します。そのブランチが大きすぎる場合（固定の内部上限を超える場合。現在は 100K トークン）、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ判定は自動であり、設定できません。レガシーな `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

## セッションストアスキーマ（`sessions.json`）

値の型は `src/config/sessions.ts` の `SessionEntry` です。主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度判定ではこれを使用します。レガシー行では、JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実ユーザー/チャンネル操作タイムスタンプ。アイドルリセットの鮮度判定ではこれを使用するため、Heartbeat、Cron、exec イベントがセッションを存続させることはありません。このフィールドがないレガシー行は、復元されたセッション開始時刻にフォールバックします。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示/刈り込み/帳簿管理に使用されます - 日次/アイドル鮮度の根拠ではありません。
- `archivedAt`: 任意のアーカイブタイムスタンプ。アーカイブ済みセッションはトランスクリプトを保持したままストアに残り、通常のアクティブ一覧からは除外されます。
- `pinnedAt`: 任意のピン留めタイムスタンプ。アクティブなピン留めセッションは、ピン留めされていないセッションより前に並びます。セッションをアーカイブすると、そのピン留めは解除されます。
- Codex スレッド相互運用: 両フィールドは Codex のスレッド管理形状に従います - ワイヤ上の `archived`/`pinned` ブール値は常にタイムスタンプから派生し、サーバー側で刻印されます。これは Codex の `threads.archived_at` セマンティクスと camelCase シリアライズに一致します。OpenClaw のタイムスタンプはエポックミリ秒で、Codex はエポック秒を使用するため、ブリッジは codex plugin 境界で変換します。Codex にはまだピン留め API がないため（`thread/archive`/`thread/unarchive` のみ）、ピン留め状態は存在するまで OpenClaw 側に残ります。その時点で、一致する形状により、バインド済みセッションは機械的にピン留め状態を往復できます。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネルのラベル付けメタデータ
- トグル: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy`（セッションごとの上書き）
- モデル選択: `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート/プロバイダー依存）: `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt` / `memoryFlushCompactionCount`: 最後の Compaction 前メモリフラッシュのタイムスタンプと Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッション実行中にエントリを書き換えたり再水和したりする場合があります。

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）によって管理されます。ファイルは JSONL です。

- 1 行目: セッションヘッダー - `type: "session"`, `id`, `cwd`, `timestamp`, 任意の `parentSession`。
- 以降: `id` + `parentId`（ツリー構造）を持つエントリ。

主なエントリタイプ:

- `message`: ユーザー/アシスタント/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る拡張機能注入メッセージ（`display: true` の場合は TUI に表示され、`display: false` の場合は完全に非表示）
- `custom`: モデルコンテキストに入らない拡張機能状態（リロードをまたいで拡張機能状態を永続化するため）
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction 要約
- `branch_summary`: ツリーブランチを移動するときの永続化された要約

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使ってそれらを読み書きします。

## コンテキストウィンドウと追跡トークン

2 つの異なる概念があります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルに見えるトークン）。モデルカタログから取得され、設定で上書きできます。
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（`/status` とダッシュボードで使用）。`contextTokens` はランタイムの推定/報告値です - 厳密な保証として扱わないでください。

制限の詳細: [/reference/token-use](/ja-JP/reference/token-use)。

## Compaction: 概要

Compaction は古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。Compaction 後、以降のターンでは Compaction 要約と `firstKeptEntryId` 以降のメッセージが見えます。Compaction は、セッション刈り込みとは異なり **永続的** です - [/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

Compaction 後の AGENTS.md セクション再注入は `agents.defaults.compaction.postCompactionSections` によるオプトインです。未設定または `[]` の場合、OpenClaw は Compaction 要約の上に AGENTS.md 抜粋を追加しません。

### チャンク境界とツールのペアリング

長いトランスクリプトを Compaction チャンクに分割するとき、OpenClaw はアシスタントのツール呼び出しと対応する `toolResult` エントリをペアのまま保持します。

- トークン比率による分割がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離する代わりに、境界をアシスタントのツール呼び出しメッセージへずらします。
- 末尾のツール結果ブロックによってチャンクが目標を超えてしまう場合、OpenClaw はその保留中のツールブロックを保持し、未要約の末尾をそのまま維持します。
- 中止/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにしません。

## 自動 Compaction が発生するタイミング

埋め込み OpenClaw エージェントには 2 つのトリガーがあります。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`、およびその他のプロバイダー形状のバリアント）を返した場合 - compact してから再試行します。プロバイダーが試行されたトークン数を報告した場合、OpenClaw はその観測値をオーバーフロー回復 Compaction に転送します。プロバイダーがオーバーフローを確認したものの解析可能な数値を公開しない場合、OpenClaw は最小限だけ予算超過した合成カウントを Compaction エンジンと診断に渡します。オーバーフロー回復がそれでも失敗した場合、OpenClaw は明示的なガイダンスを表示し、暗黙に新しいセッション ID へローテーションするのではなく現在のセッションマッピングを保持します - メッセージを再試行するか、`/compact` を実行するか、`/new` を実行してください。
2. **しきい値メンテナンス**: 成功したターンの後、`contextTokens > contextWindow - reserveTokens` になった場合。ここで `contextWindow` はモデルのコンテキストウィンドウ、`reserveTokens` はプロンプトと次のモデル出力のために予約されたヘッドルームです。

これら 2 つのトリガーの外側で、さらに 2 つのガードが実行されます。

- **プリフライトローカル Compaction**: `agents.defaults.compaction.maxActiveTranscriptBytes`（バイト数、または `"20mb"` のような文字列）を設定すると、アクティブなトランスクリプトファイルがそのサイズに達した時点で、次の実行を開く前にローカル Compaction をトリガーします。これはローカル再オープンコストに対するファイルサイズガードであり、生のアーカイブではありません - 通常のセマンティック Compaction は引き続き実行され、compact された要約が新しい後続トランスクリプトになるよう `truncateAfterCompaction` が必要です。
- **ターン中プリチェック**: `agents.defaults.compaction.midTurnPrecheck.enabled: true`（デフォルト `false`）を設定すると、ツールループガードを追加します。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使うものと同じプリフライト予算ロジックを使ってプロンプト圧力を推定します。コンテキストがもう収まらない場合、ガードはインラインで compact しません - 構造化されたターン中プリチェックシグナルを発生させ、現在のプロンプト送信を停止し、外側の実行ループに既存の回復パスを使わせます（それで十分な場合は過大なツール結果を切り詰めるか、設定済みの Compaction モードをトリガーして再試行します）。プロバイダー支援の safeguard Compaction を含め、`default` と `safeguard` の両方の Compaction モードで動作します。`maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンが開く前に実行され、ターン中プリチェックは後で、新しいツール結果が追加された後に実行されます。

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

OpenClaw は埋め込み実行に対して安全フロアも適用します。`compaction.reserveTokens` が `reserveTokensFloor`（デフォルト `20000`）を下回る場合、OpenClaw はそれを引き上げます。すでに高い場合はそのままにします。フロアを無効化するには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。フロア自体はモデルのコンテキストウィンドウの安全な割合に自動的に上限設定されるため、小さなコンテキストのモデル（たとえば 16K トークンのローカルモデル）がプロンプト予算を奪われることはありません - その上限がないと、デフォルトの 20000 トークンフロアがウィンドウ全体を超え、すべてのプロンプトがオーバーフロー Compaction ループに入る可能性があります。そもそもフロアがある理由: Compaction が避けられなくなる前に、複数ターンの「ハウスキーピング」（下記のメモリフラッシュなど）のための十分なヘッドルームを残すためです。実装: `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()`。埋め込みランナーのターンと Compaction セットアップパスから呼び出されます。

手動 `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` に従い、ランタイムの最近末尾の切断点を保持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントになり、再構築されたコンテキストは新しい要約から開始します。

`truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを compact 済みの後続 JSONL へローテーションします。ブランチ/復元チェックポイントアクションは、その compact 済み後続を使用します。レガシーの Compaction 前チェックポイントファイルは、参照されている間は読み取り可能なままです。

## プラグ可能な Compaction プロバイダー

Plugins は Plugin API 上の `registerCompactionProvider()` を通じて Compaction プロバイダーを登録します。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、safeguard 拡張機能は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーへ要約を委任します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約では未設定のままにします。`provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、safeguard はプロバイダー出力後も最近ターンと分割ターンの接尾コンテキストを保持します。
- 組み込み safeguard 要約は、以前の要約全体をそのまま保持するのではなく、新しいメッセージとともに以前の要約を再蒸留します。
- safeguard モードでは、要約品質監査がデフォルトで有効になります。`qualityGuard.enabled: false` を設定すると、不正形式出力時の再試行動作をスキップします。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックします。呼び出し元が明示的にトリガーした中止/タイムアウトシグナルは飲み込まれず再スローされるため、キャンセルは常に尊重されます。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`。

## ユーザーに見えるサーフェス

- 任意のチャットセッション内の `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- verbose モード: `🧹 Auto-compaction complete` と Compaction 回数

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスク用の「サイレント」ターンをサポートします。

- アシスタントは出力を正確なサイレントトークン `NO_REPLY` / `no_reply` で開始し、「ユーザーへ返信を配信しない」ことを意味します。OpenClaw は配信レイヤーでこれを取り除く/抑制します。
- 正確なサイレントトークン抑制は大文字小文字を区別しません。ペイロード全体がサイレントトークンだけの場合、`NO_REPLY` と `no_reply` はどちらも対象になります。
- `2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、下書き/入力中ストリーミングも抑制するため、サイレント操作がターン中に部分出力を漏らすことはありません。
- これは真のバックグラウンド/非配信ターン専用です - 通常の実行可能なユーザー要求のショートカットではありません。

## Compaction 前メモリフラッシュ

自動 Compaction が発生する前に、OpenClaw は永続状態をディスクに書き込むサイレントなエージェント的ターンを実行できます（たとえばエージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction が重要なコンテキストを消去できなくなります。これはセッションコンテキスト使用量を監視し、Compaction しきい値より低いソフトしきい値を超えると、正確なサイレントトークン `NO_REPLY` / `no_reply` を使ってサイレントな「今すぐメモリを書き込む」指示を送信するため、ユーザーには何も表示されません。

設定 (`agents.defaults.compaction.memoryFlush`)、完全なリファレンスは [/gateway/config-agents](/ja-JP/gateway/config-agents#agentsdefaultscompaction) を参照:

| キー                        | デフォルト       | 注記                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | フラッシュターン専用の正確なプロバイダー/モデルのオーバーライド。例: `ollama/qwen3:8b`                                                  |
| `softThresholdTokens`       | `4000`           | フラッシュをトリガーする Compaction しきい値未満の差分                                                                                 |
| `forceFlushTranscriptBytes` | 未設定 (無効)    | トランスクリプトファイルがこのバイトサイズ (または `"2mb"` のような文字列) に達したら、トークンカウンターが古くてもフラッシュを強制する。`0` で無効 |
| `prompt`                    | 組み込み         | フラッシュターン用のユーザーメッセージ                                                                                                 |
| `systemPrompt`              | 組み込み         | フラッシュターン用に追加される追加システムプロンプト                                                                                   |

注記:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用します。そのため、ローカル専用のハウスキーピングが失敗時に有料の会話モデルへ暗黙にフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに 1 回実行されます (`sessions.json` で追跡)。
- フラッシュは埋め込み OpenClaw セッションでのみ実行されます。CLI バックエンドと Heartbeat ターンではスキップされます。
- セッションワークスペースが読み取り専用 (`workspaceAccess: "ro"` または `"none"`) の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[Memory](/ja-JP/concepts/memory) を参照してください。

OpenClaw は拡張 API で `session_before_compact` フックを公開していますが、上記のフラッシュロジックはそのフック上ではなく、Gateway 側 (`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`) にあります。

## トラブルシューティングチェックリスト

- **セッションキーが間違っている?** [/concepts/session](/ja-JP/concepts/session) から始め、`/status` の `sessionKey` を確認してください。
- **ストアとトランスクリプトが一致しない?** `openclaw status` で Gateway ホストとストアパスを確認してください。
- **Compaction が多すぎる?** モデルのコンテキストウィンドウ (小さすぎると頻繁な Compaction が強制されます)、`reserveTokens` (モデルウィンドウに対して高すぎると Compaction が早まります)、およびツール結果の肥大化 (セッション pruning を調整) を確認してください。
- **小さなローカルモデルではすべてのプロンプトがオーバーフローするように見える?** `reserveTokensFloor` のデフォルト (20000) はコンテキストウィンドウの安全な割合に自動で上限設定されますが、明示的な `reserveTokens` がウィンドウ自体より高く設定されている場合は上限設定されません。値を下げるか、未設定にしてください。
- **サイレントターンが漏れている?** 返信が正確なサイレントトークン `NO_REPLY` (大文字小文字を区別しない) で始まっていること、およびストリーミング抑制修正 (`2026.1.10`+) を含むビルドを使用していることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
- [Agent 設定リファレンス](/ja-JP/gateway/config-agents)
