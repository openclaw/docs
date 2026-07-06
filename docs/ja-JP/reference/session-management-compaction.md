---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json フィールドをデバッグする必要がある
    - 自動Compactionの動作を変更する、または「事前Compaction」のハウスキーピングを追加する
    - メモリのフラッシュまたはサイレントなシステムターンを実装したい場合
summary: '詳細解説: セッションストア + トランスクリプト、ライフサイクル、(自動)Compaction 内部処理'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-07-06T10:52:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb7ac88649e24472bdb00e0f6739dc7885cd713c1497b8be966d2b9dfe1cf1e
    source_path: reference/session-management-compaction.md
    workflow: 16
---

単一の **Gateway プロセス** がセッション状態をエンドツーエンドで所有します。UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせます。リモートモードでは、セッションファイルはリモートホスト上にあるため、ローカル Mac のファイルを確認しても Gateway が使用している内容は反映されません。

まず概要ドキュメント: [セッション管理](/ja-JP/concepts/session)、[Compaction](/ja-JP/concepts/compaction)、[メモリ概要](/ja-JP/concepts/memory)、[メモリ検索](/ja-JP/concepts/memory-search)、[セッションの pruning](/ja-JP/concepts/session-pruning)、[トランスクリプト衛生管理](/ja-JP/reference/transcript-hygiene)、完全な設定リファレンスは [エージェント設定](/ja-JP/gateway/config-agents)。

## 2 つの永続化レイヤー

1. **セッションストア (`sessions.json`)** - キー/値マップ `sessionKey -> SessionEntry`。小さく、可変で、エントリの編集や削除が安全です。現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなどのメタデータを追跡します。
2. **トランスクリプト (`<sessionId>.jsonl`)** - 追記専用でツリー構造（エントリは `id` + `parentId` を持つ）。会話、ツール呼び出し、Compaction サマリーを保存し、将来のターンのモデルコンテキストを再構築します。Compaction チェックポイントは、圧縮後の後続トランスクリプト上のメタデータです。新しい Compaction は 2 つ目の `.checkpoint.*.jsonl` コピーを書き込みません。

Gateway の履歴リーダーは、そのサーフェスが任意の過去アクセスを必要としない限り、トランスクリプト全体の実体化を避けます。最初のページの履歴、埋め込みチャット履歴、再起動リカバリ、トークン/使用量チェックは、境界付きの末尾読み取りを使います。完全なトランスクリプトスキャンは非同期トランスクリプトインデックスを経由し、ファイルパスと `mtimeMs`/`size` でキャッシュされ、同時リーダー間で共有されます。

## ディスク上の場所

エージェントごとに、Gateway ホスト上（`src/config/sessions.ts` で解決）:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

## ストアメンテナンスとディスク制御

`session.maintenance` は、`sessions.json`、トランスクリプト成果物、trajectory サイドカーの自動メンテナンスを制御します。

| キー                    | デフォルト          | 注記                                                                              |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`         | または `"warn"`（報告のみ、変更なし）                                             |
| `pruneAfter`            | `"30d"`             | 古いエントリの年齢カットオフ                                                      |
| `maxEntries`            | `500`               | `sessions.json` 内のエントリ上限                                                  |
| `resetArchiveRetention` | `pruneAfter` と同じ | `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。`false` は削除を無効化 |
| `maxDiskBytes`          | 未設定              | 任意のセッションディレクトリ予算                                                  |
| `highWaterBytes`        | `maxDiskBytes` の 80% | 予算クリーンアップ後の目標                                                       |

Gateway モデル実行プローブセッション（`agent:*:explicit:model-run-<uuid>` に一致するキー）は、個別の固定 `24h` 保持期間を持ちます。この pruning は負荷でゲートされます。セッションエントリのメンテナンス/上限の圧力に達したときだけ、かつグローバルな古いエントリのクリーンアップ/上限ステップの前にだけ実行されます。他の明示的セッションはこの保持期間を使いません。

ディスク予算クリーンアップ（`mode: "enforce"`）の適用順序:

1. 最初に最も古いアーカイブ済み、孤立トランスクリプト、または孤立 trajectory 成果物を削除します。
2. まだ目標を超えている場合は、最も古いセッションエントリとそのトランスクリプト/trajectory ファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで繰り返します。

`mode: "warn"` は、ストアやファイルを変更せずに、発生し得る退避を報告します。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

メンテナンスは、グループセッションやスレッドスコープのチャットセッションのような永続的な外部会話ポインターを保持しますが、合成ランタイムエントリ（cron、hooks、heartbeat、ACP、サブエージェント）は、設定された年齢、数、またはディスク予算を超えると削除されることがあります。分離された cron 実行は、モデル実行プローブ保持とは独立した別の `cron.sessionRetention` 制御を使います。

通常の Gateway 書き込みは、ランタイムのファイルロックを取得せずにプロセス内変更を直列化する、ストアごとのセッションライターを経由します。ホットパスのパッチヘルパーは、そのライタースロットを保持している間、検証済みの可変キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新ごとに複製または再読み取りされることはありません。ランタイムコードでは `updateSessionStore(...)` / `updateSessionStoreEntry(...)` を優先してください。ストア全体の直接保存は、互換性とオフラインメンテナンスツール向けです。Gateway に到達できる場合、非 dry-run の `openclaw sessions cleanup` と `openclaw agents delete` は、クリーンアップが同じライターキューに参加するように、ストア変更を Gateway に委譲します。`--store <path>` は直接ファイルメンテナンス用の明示的なオフライン修復パスで、常にローカルのままです（`--dry-run` も同様）。`maxEntries` クリーンアップは本番サイズのストア向けにバッチ処理されるため、次の high-water クリーンアップで書き下げられるまで、ストアが設定上限を一時的に超えることがあります。読み取りは Gateway 起動中にエントリを pruning したり上限適用したりしません。それを行うのは書き込みまたは `openclaw sessions cleanup --enforce` だけで、後者は上限も即時適用し、ディスク予算が未設定でも古い未参照のトランスクリプト、チェックポイント、trajectory 成果物を pruning します。

OpenClaw は、Gateway 書き込み中に自動の `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` は古い設定からそれを削除します。

トランスクリプトの変更は、トランスクリプトファイル上のセッション書き込みロックを使います。

| 設定                                 | デフォルト | Env オーバーライド                              |
| ------------------------------------ | ---------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`    | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`  | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`   | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` は、ロック待機が諦める前に busy-session エラーとして表面化するまでの時間です。遅いマシンで、正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー作業の競合がより長く続く場合にのみ引き上げてください。`staleMs` は既存のロックを stale として回収できるタイミングです。`maxHoldMs` はプロセス内ウォッチドッグの解放しきい値です。

## Cron セッションと実行ログ

分離された cron 実行は、専用の保持設定を持つ独自のセッションエントリ/トランスクリプトを作成します。

- `cron.sessionRetention`（デフォルト `"24h"`）は、古い分離 cron 実行セッションをストアから pruning します。`false` は無効化します。
- `cron.runLog.keepLines` は、cron ジョブごとに保持される SQLite 実行履歴行を pruning します（デフォルト `2000`）。`cron.runLog.maxBytes` は、古いファイルベースの実行ログとの互換性のためだけに受け入れられます。

cron が新しい分離実行セッションを強制作成するとき、新しい行を書き込む前に以前の `cron:<jobId>` セッションエントリをサニタイズします。安全なプリファレンス（thinking/fast/verbose/reasoning 設定、ラベル、表示名）と、明示的にユーザーが選択したモデル/auth オーバーライドは引き継ぎますが、周辺の会話コンテキスト（channel/group ルーティング、send/queue ポリシー、elevation、origin、ACP ランタイムバインディング）は削除するため、新しい分離実行が古い実行から stale な配信権限やランタイム権限を継承することはありません。

## セッションキー (`sessionKey`)

`sessionKey` は、どの会話バケットにいるか（ルーティング + 分離）を識別します。正規ルール: [/concepts/session](/ja-JP/concepts/session)。

| パターン                   | 例                                                          |
| -------------------------- | ----------------------------------------------------------- |
| メイン/ダイレクトチャット（エージェントごと） | `agent:<agentId>:<mainKey>`（デフォルト `main`）            |
| グループ                   | `agent:<agentId>:<channel>:group:<id>`                      |
| ルーム/チャンネル（Discord/Slack） | `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>` |
| Cron                       | `cron:<job.id>`                                             |
| Webhook                    | `hook:<uuid>`（オーバーライドされない限り）                 |

## セッション ID (`sessionId`)

各 `sessionKey` は現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。判断ロジックは `src/auto-reply/reply/session.ts` の `initSessionState()` にあります。

- **リセット**（`/new`、`/reset`）は、その `sessionKey` の新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes`、またはレガシーの `session.idleMinutes`）は、アイドルウィンドウ後にメッセージが届いたときに新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Control UI 再接続レジューム** は、Gateway がオペレーター UI クライアントから一致する `sessionId` を受け取ったとき、1 回の再接続送信について現在表示中のセッションを保持します。これは一度限りのシグナルです。通常の stale な送信は引き続き新しい `sessionId` を作成します。
- **システムイベント**（heartbeat、cron wakeup、exec 通知、gateway の帳簿処理）はセッション行を変更することがありますが、日次/アイドルリセットの freshness を延長することはありません。リセットロールオーバーは、新しいプロンプトが構築される前に、以前のセッション向けにキューされたシステムイベント通知を破棄します。
- **親 fork ポリシー** は、スレッドまたはサブエージェント fork を作成するときに OpenClaw のアクティブブランチを使います。そのブランチが大きすぎる場合（固定の内部上限、現在は 100K トークンを超える場合）、OpenClaw は失敗したり利用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ判定は自動で、設定できません。レガシーの `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

## セッションストアスキーマ (`sessions.json`)

値の型は `src/config/sessions.ts` の `SessionEntry` です。主なフィールド（網羅ではありません）:

- `sessionId`: 現在のトランスクリプト ID（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの鮮度判定ではこれを使用します。レガシー行では JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実際のユーザー/チャンネル操作タイムスタンプ。アイドルリセットの鮮度判定ではこれを使用するため、heartbeat、cron、exec イベントによってセッションが維持されることはありません。このフィールドがないレガシー行は、復元されたセッション開始時刻にフォールバックします。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示、整理、記録管理に使用されます。日次/アイドル鮮度の権威ではありません。
- `archivedAt`: 任意のアーカイブタイムスタンプ。アーカイブ済みセッションはトランスクリプトを保持したままストアに残り、通常のアクティブ一覧からは除外されます。
- `pinnedAt`: 任意のピン留めタイムスタンプ。アクティブなピン留めセッションは、ピン留めされていないセッションより前に並びます。セッションをアーカイブするとピン留めは解除されます。
- Codex スレッド相互運用: 両フィールドは Codex のスレッド管理形状に従います。ワイヤ上の `archived`/`pinned` 真偽値は常にタイムスタンプから派生し、Codex の `threads.archived_at` セマンティクスと camelCase シリアライズに合わせてサーバー側で刻印されます。OpenClaw のタイムスタンプはエポックミリ秒ですが、Codex はエポック秒を使用するため、ブリッジは codex plugin 境界で変換します。Codex にはまだピン留め API がありません（`thread/archive`/`thread/unarchive` のみ）。ピン留め状態は API が存在するまで OpenClaw 側に保持され、その時点で一致する形状により、バインド済みセッションはピン留め状態を機械的に往復できます。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネルのラベル付けメタデータ
- トグル: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy`（セッションごとの上書き）
- モデル選択: `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート/プロバイダー依存）: `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt` / `memoryFlushCompactionCount`: 最後の Compaction 前メモリフラッシュのタイムスタンプと Compaction 回数

ストアは編集しても安全ですが、権威は Gateway です。セッション実行中にエントリを書き換えたり再ハイドレートしたりする場合があります。

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）によって管理されます。ファイルは JSONL です。

- 先頭行: セッションヘッダー - `type: "session"`, `id`, `cwd`, `timestamp`, 任意の `parentSession`。
- 以降: `id` + `parentId` を持つエントリ（ツリー構造）。

主なエントリタイプ:

- `message`: ユーザー/アシスタント/ツール結果メッセージ
- `custom_message`: モデルコンテキストに入る拡張機能注入メッセージ（`display: true` の場合は TUI に表示され、`display: false` の場合は完全に非表示）
- `custom`: モデルコンテキストに入らない拡張機能状態（再読み込みをまたいで拡張機能状態を永続化するため）
- `compaction`: `firstKeptEntryId` と `tokensBefore` を含む永続化された Compaction 要約
- `branch_summary`: ツリーブランチを移動するときの永続化された要約

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用して読み書きします。

## コンテキストウィンドウと追跡トークン

2 つの異なる概念があります。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルから見えるトークン）。モデルカタログから取得され、設定で上書きできます。
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（`/status` とダッシュボードで使用）。`contextTokens` はランタイムの推定/レポート値です。厳密な保証として扱わないでください。

制限の詳細: [/reference/token-use](/ja-JP/reference/token-use)。

## Compaction: それは何か

Compaction は古い会話をトランスクリプト内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。Compaction 後、以降のターンでは Compaction 要約と `firstKeptEntryId` 以降のメッセージが見えます。Compaction は、セッション整理とは異なり **永続的** です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

Compaction 後の AGENTS.md セクション再注入は `agents.defaults.compaction.postCompactionSections` によるオプトインです。未設定または `[]` の場合、OpenClaw は Compaction 要約の上に AGENTS.md 抜粋を追加しません。

### チャンク境界とツールのペアリング

長いトランスクリプトを Compaction チャンクに分割するとき、OpenClaw はアシスタントのツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。

- トークン比率による分割がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離せず、境界をアシスタントのツール呼び出しメッセージに移動します。
- 末尾のツール結果ブロックによってチャンクが目標を超える場合、OpenClaw はその保留中のツールブロックを保持し、要約されていない末尾をそのまま維持します。
- 中断/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにしません。

## 自動 Compaction が発生するタイミング

埋め込み OpenClaw エージェントには 2 つのトリガーがあります。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー（`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded`、およびその他のプロバイダー形状のバリアント）を返した場合、Compaction してから再試行します。プロバイダーが試行されたトークン数を報告する場合、OpenClaw はその観測値をオーバーフロー回復 Compaction に転送します。プロバイダーがオーバーフローを確認しても解析可能な数値を公開しない場合、OpenClaw は予算を最小限超過する合成カウントを Compaction エンジンと診断に渡します。オーバーフロー回復がそれでも失敗した場合、OpenClaw は明示的なガイダンスを表示し、無言で新しいセッション ID に切り替えるのではなく、現在のセッションマッピングを保持します。メッセージを再試行するか、`/compact` を実行するか、`/new` を実行してください。
2. **しきい値メンテナンス**: 成功したターンの後、`contextTokens > contextWindow - reserveTokens` の場合。ここで `contextWindow` はモデルのコンテキストウィンドウ、`reserveTokens` はプロンプトと次のモデル出力のために予約された余裕です。

これら 2 つのトリガーの外側で、さらに 2 つのガードが実行されます。

- **プリフライトローカル Compaction**: `agents.defaults.compaction.maxActiveTranscriptBytes`（バイト数または `"20mb"` のような文字列）を設定すると、アクティブなトランスクリプトファイルがそのサイズに達した時点で、次の実行を開く前にローカル Compaction をトリガーします。これはローカル再オープンコストのためのファイルサイズガードであり、生のアーカイブではありません。通常のセマンティック Compaction は引き続き実行され、圧縮された要約を新しい後継トランスクリプトにするために `truncateAfterCompaction` が必要です。
- **ターン途中プリチェック**: `agents.defaults.compaction.midTurnPrecheck.enabled: true`（デフォルトは `false`）を設定すると、ツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、OpenClaw はターン開始時に使用されるものと同じプリフライト予算ロジックを使用してプロンプト圧力を推定します。コンテキストが収まらなくなった場合、ガードはインラインで Compaction しません。構造化されたターン途中プリチェックシグナルを発行し、現在のプロンプト送信を停止し、外側の実行ループに既存の回復パスを使用させます（それで十分な場合は大きすぎるツール結果を切り詰めるか、設定された Compaction モードをトリガーして再試行します）。プロバイダー backed safeguard Compaction を含め、`default` と `safeguard` の両方の Compaction モードで機能します。`maxActiveTranscriptBytes` からは独立しています。バイトサイズガードはターンが開く前に実行され、ターン途中プリチェックは後で、新しいツール結果が追加された後に実行されます。

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

OpenClaw は埋め込み実行に対して安全下限も適用します。`compaction.reserveTokens` が `reserveTokensFloor`（デフォルト `20000`）を下回る場合、OpenClaw はそれを引き上げます。下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。アクティブなモデルコンテキストウィンドウが既知の場合、下限と最終的な有効予約の両方が上限設定され、予約がプロンプト予算全体を消費できないようになります。これにより、小さなコンテキストのモデル（たとえば 16K トークンのローカルモデル）が最初のトークンから Compaction に入ることを防ぎます。既知のコンテキストウィンドウがない場合、設定済みおよび現在の予約予算は上限設定されません。そもそも下限がある理由: Compaction が不可避になる前に、複数ターンの「ハウスキーピング」（以下のメモリフラッシュなど）のための十分な余裕を残すためです。実装: `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()`。埋め込みランナーのターンおよび Compaction セットアップパスから呼び出されます。

手動の `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、ランタイムの最近末尾の切断点を保持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントになり、再構築されたコンテキストは新しい要約から開始します。

`truncateAfterCompaction` が有効な場合、OpenClaw は Compaction 後にアクティブなトランスクリプトを圧縮済み後継 JSONL にローテーションします。ブランチ/復元チェックポイントアクションはその圧縮済み後継を使用します。レガシーの Compaction 前チェックポイントファイルは、参照されている間は読み取り可能なままです。

## プラガブル Compaction プロバイダー

Plugin は Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録します。`agents.defaults.compaction.provider` が登録済みプロバイダー ID に設定されている場合、safeguard 拡張機能は組み込みの `summarizeInStages` パイプラインの代わりに、そのプロバイダーへ要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー Plugin の ID。デフォルトの LLM 要約を使用する場合は未設定のままにします。`provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、safeguard はプロバイダー出力後も直近ターンおよび分割ターンのサフィックスコンテキストを保持します。
- 組み込みの safeguard 要約は、以前の要約全体をそのまま保持するのではなく、以前の要約を新しいメッセージとともに再蒸留します。
- safeguard モードでは、デフォルトで要約品質監査が有効になります。不正な形式の出力に対する再試行動作をスキップするには、`qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約にフォールバックします。呼び出し元が明示的にトリガーした中止/タイムアウトシグナルは握りつぶされず、再スローされるため、キャンセルは常に尊重されます。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`。

## ユーザーに見えるサーフェス

- 任意のチャットセッション内の `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- 詳細モード: `🧹 Auto-compaction complete` と Compaction 回数

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を見せるべきではないバックグラウンドタスクのために「サイレント」ターンをサポートします。

- アシスタントは「ユーザーに返信を配信しない」ことを意味する正確なサイレントトークン `NO_REPLY` / `no_reply` で出力を開始します。OpenClaw は配信レイヤーでこれを取り除く/抑制します。
- 正確なサイレントトークン抑制では大文字小文字を区別しません。ペイロード全体がサイレントトークンだけである場合、`NO_REPLY` と `no_reply` はどちらも対象になります。
- `2026.1.10` 以降、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、ドラフト/タイピングのストリーミングも抑制するため、サイレント操作がターン途中で部分出力を漏らすことはありません。
- これは真のバックグラウンド/非配信ターン専用です。通常の実行可能なユーザー要求のショートカットではありません。

## Compaction 前メモリフラッシュ

自動 Compaction が発生する前に、OpenClaw は耐久状態をディスクへ書き込むサイレントなエージェント的ターンを実行できます（たとえばエージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction が重要なコンテキストを消去できなくなります。セッションのコンテキスト使用量を監視し、Compaction しきい値より低いソフトしきい値を超えると、正確なサイレントトークン `NO_REPLY` / `no_reply` を使用してサイレントな「今すぐメモリを書き込む」指示を送信するため、ユーザーには何も表示されません。

設定（`agents.defaults.compaction.memoryFlush`）。完全なリファレンスは [/gateway/config-agents](/ja-JP/gateway/config-agents#agentsdefaultscompaction) にあります。

| キー                        | 既定値           | 注記                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未設定           | フラッシュターンだけに適用する正確なプロバイダー/モデルの上書き。例: `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | フラッシュをトリガーする、Compactionしきい値を下回る差分                                                                               |
| `forceFlushTranscriptBytes` | 未設定（無効）   | トークンカウンターが古い場合でも、トランスクリプトファイルがこのバイトサイズ（または `"2mb"` のような文字列）に達したらフラッシュを強制する。`0` で無効化 |
| `prompt`                    | 組み込み         | フラッシュターン用のユーザーメッセージ                                                                                                        |
| `systemPrompt`              | 組み込み         | フラッシュターン用に追加される追加のシステムプロンプト                                                                                        |

注記:

- 既定のプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用するため、ローカル専用の管理処理が失敗時に有料の会話モデルへ暗黙にフォールバックすることはありません。
- フラッシュはCompactionサイクルごとに1回実行されます（`sessions.json` で追跡）。
- フラッシュは埋め込みOpenClawセッションでのみ実行されます。CLIバックエンドとHeartbeatターンではスキップされます。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[Memory](/ja-JP/concepts/memory) を参照してください。

OpenClaw は拡張APIで `session_before_compact` フックを公開していますが、上記のフラッシュロジックはそのフック上ではなく、Gateway 側（`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`）にあります。

## トラブルシューティングチェックリスト

- **セッションキーが間違っていますか？** [/concepts/session](/ja-JP/concepts/session) から始めて、`/status` の `sessionKey` を確認してください。
- **ストアとトランスクリプトが一致しませんか？** `openclaw status` から Gateway ホストとストアパスを確認してください。
- **Compactionが多発していますか？** モデルのコンテキストウィンドウ（小さすぎると頻繁なCompactionが発生します）、`reserveTokens`（モデルウィンドウに対して高すぎると早めのCompactionが発生します）、ツール結果の肥大化（セッションプルーニングを調整）を確認してください。
- **小さなローカルモデルですべてのプロンプトがオーバーフローしているように見えますか？** プロバイダーが正しいモデルコンテキストウィンドウを報告していることを確認してください。OpenClaw は、そのウィンドウが判明している場合にのみ有効な予約量を上限設定できます。
- **サイレントターンが漏れていますか？** 返信が正確なサイレントトークン `NO_REPLY`（大文字小文字を区別しない）で始まっていること、およびストリーミング抑制修正（`2026.1.10` 以降）を含むビルドを使用していることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
- [エージェント設定リファレンス](/ja-JP/gateway/config-agents)
