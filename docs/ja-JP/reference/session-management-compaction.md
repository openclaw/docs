---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json のフィールドをデバッグする必要がある
    - 自動 Compaction の動作を変更しているか、「pre-compaction」のハウスキーピングを追加しています
    - メモリフラッシュまたはサイレントシステムターンを実装したい
summary: '詳細解説: セッションストアとトランスクリプト、ライフサイクル、(自動)Compaction の内部処理'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-07-04T20:25:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw は、これらの領域全体でセッションをエンドツーエンドに管理します。

- **セッションルーティング**（受信メッセージを `sessionKey` に対応付ける方法）
- **セッションストア**（`sessions.json`）と、それが追跡する内容
- **トランスクリプト永続化**（`*.jsonl`）とその構造
- **トランスクリプト衛生管理**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン）
- **Compaction**（手動および自動 Compaction）と、Compaction 前の処理をフックする場所
- **サイレントな保守処理**（ユーザーに見える出力を生成すべきではないメモリ書き込み）

先に高レベルな概要を確認したい場合は、次から始めてください。

- [セッション管理](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [セッション pruning](/ja-JP/concepts/session-pruning)
- [トランスクリプト衛生管理](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる唯一の情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス**を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせる必要があります。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカル Mac のファイルを確認する」ことでは、Gateway が使用している内容は反映されません。

---

## 2つの永続化レイヤー

OpenClaw はセッションを2つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集（またはエントリの削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど）を追跡します

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用トランスクリプト（エントリは `id` + `parentId` を持つ）
   - 実際の会話、ツール呼び出し、Compaction サマリーを保存します
   - 以後のターンでモデルコンテキストを再構築するために使用されます
   - Compaction チェックポイントは、Compaction 済み後継トランスクリプト上のメタデータです。新しい Compaction は、2つ目の `.checkpoint.*.jsonl` コピーを書き込みません。

Gateway の履歴リーダーは、その画面が任意の過去アクセスを明示的に必要とする場合を除き、トランスクリプト全体を実体化しないようにする必要があります。最初のページの履歴、埋め込みチャット履歴、再起動リカバリー、トークン/使用量チェックでは、範囲を制限した末尾読み取りを使用します。トランスクリプト全体のスキャンは非同期トランスクリプトインデックスを通り、これはファイルパスに `mtimeMs`/`size` を加えたものをキーにキャッシュされ、同時実行リーダー間で共有されます。

---

## ディスク上の場所

Gateway ホスト上で、エージェントごとに:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` 経由で解決します。

---

## ストア保守とディスク制御

セッション永続化には、`sessions.json`、トランスクリプト成果物、trajectory サイドカー向けの自動保守制御（`session.maintenance`）があります。

- `mode`: `enforce`（デフォルト）または `warn`
- `pruneAfter`: 古いエントリの経過時間カットオフ（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- 短命の Gateway モデル実行プローブ保持期間は `24h` に固定されていますが、これは圧力ゲート付きです。セッションエントリの保守/上限圧力に達した場合にのみ、古い厳密プローブ行を削除します。これは `agent:*:explicit:model-run-<uuid>` に一致する厳密な明示的プローブキーのみに適用され、実行時にはグローバルな古いエントリのクリーンアップ/上限制御の前に実行されます。
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップを無効化）
- `maxDiskBytes`: 任意のセッションディレクトリ容量
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

通常の Gateway 書き込みは、ランタイムファイルロックを取得せず、プロセス内ミューテーションを直列化するストア単位のセッションライターを通ります。ホットパスのパッチヘルパーは、そのライタースロットを保持している間、検証済みの変更可能キャッシュを借用するため、大きな `sessions.json` ファイルがメタデータ更新ごとにクローンまたは再読み取りされることはありません。ランタイムコードでは `updateSessionStore(...)` または `updateSessionStoreEntry(...)` を優先してください。ストア全体の直接保存は、互換性およびオフライン保守用のツールです。Gateway に到達可能な場合、dry-run ではない `openclaw sessions cleanup` と `openclaw agents delete` はストアミューテーションを Gateway に委譲し、クリーンアップが同じライターキューに参加するようにします。`--store <path>` は、直接ファイル保守用の明示的なオフライン修復パスです。`maxEntries` クリーンアップは本番規模の上限向けに引き続きバッチ処理されるため、次の高水位クリーンアップで書き戻されるまで、ストアが設定済み上限を短時間超える場合があります。セッションストアの読み取りは、Gateway 起動中にエントリを prune したり上限制御したりしません。クリーンアップには書き込み、または `openclaw sessions cleanup --enforce` を使用してください。`openclaw sessions cleanup --enforce` は、ディスク容量が設定されていない場合でも、設定済み上限を即座に適用し、古い未参照のトランスクリプト、チェックポイント、trajectory 成果物を prune します。

保守処理は、グループセッションやスレッドスコープのチャットセッションなど、耐久性のある外部会話ポインターを保持します。ただし、cron、フック、heartbeat、ACP、サブエージェント用の合成ランタイムエントリは、設定された経過時間、件数、またはディスク容量を超えると削除される場合があります。Gateway モデル実行プローブセッションは、キーが `agent:*:explicit:model-run-<uuid>` に正確に一致する場合にのみ、個別の `24h` モデル実行保持を使用します。それ以外の明示的セッションは、その保持の対象ではありません。モデル実行クリーンアップは、セッションエントリの上限圧力下でのみ適用されます。分離された cron 実行は、モデル実行プローブ保持とは独立した独自の `cron.sessionRetention` 制御を保持します。

OpenClaw は、Gateway 書き込み中に自動の `sessions.json.bak.*` ローテーションバックアップを作成しなくなりました。レガシーの `session.maintenance.rotateBytes` キーは無視され、`openclaw doctor --fix` が古い設定から削除します。

トランスクリプトミューテーションは、トランスクリプトファイル上のセッション書き込みロックを使用します。ロック取得は、busy-session エラーを表示する前に `session.writeLock.acquireTimeoutMs` まで待機します。デフォルトは `60000` ms です。これを上げるのは、正当な準備、クリーンアップ、Compaction、またはトランスクリプトミラー作業が遅いマシン上でより長く競合する場合のみにしてください。`session.writeLock.staleMs` は、既存ロックを stale として回収できるタイミングを制御します。デフォルトは `1800000` ms です。`session.writeLock.maxHoldMs` は、プロセス内 watchdog の解放しきい値を制御します。デフォルトは `300000` ms です。緊急用 env オーバーライドは、`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`、`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`、`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS` です。

ディスク容量クリーンアップ（`mode: "enforce"`）の適用順序:

1. 最初に、最も古いアーカイブ済み、孤立トランスクリプト、または孤立 trajectory 成果物を削除します。
2. それでも目標を超えている場合は、最も古いセッションエントリとそのトランスクリプト/trajectory ファイルを退避します。
3. 使用量が `highWaterBytes` 以下になるまで継続します。

`mode: "warn"` では、OpenClaw は潜在的な退避を報告しますが、ストア/ファイルは変更しません。

必要に応じて保守を実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/トランスクリプトを作成し、専用の保持制御を持ちます。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから prune します（`false` で無効化）。
- `cron.runLog.keepLines` は、cron ジョブごとに保持される SQLite 実行履歴行を prune します（デフォルト: `2000`）。`cron.runLog.maxBytes` は、古いファイルベースの実行ログ向けに引き続き受け入れられます。

cron が新しい分離実行セッションを強制作成するとき、新しい行を書き込む前に以前の `cron:<jobId>` セッションエントリをサニタイズします。thinking/fast/verbose 設定、ラベル、明示的にユーザー選択されたモデル/auth オーバーライドなどの安全な設定は引き継ぎます。チャネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングなどの周辺会話コンテキストは削除されるため、新しい分離実行が古い実行から stale な配信権限やランタイム権限を継承することはありません。

---

## セッションキー（`sessionKey`）

`sessionKey` は、現在いる_会話バケット_（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（オーバーライドされない限り）

正規ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は、現在の `sessionId`（会話を継続するトランスクリプトファイル）を指します。

目安:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシーの `session.idleMinutes`）は、アイドルウィンドウ後にメッセージが到着した場合に新しい `sessionId` を作成します。日次とアイドルの両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Control UI 再接続レジューム**は、Gateway がオペレーター UI クライアントから一致する `sessionId` を受信した場合、1回の再接続送信について現在表示中のセッションを保持できます。通常の stale な送信は引き続き新しい `sessionId` を作成します。
- **システムイベント**（heartbeat、cron wakeup、exec 通知、Gateway bookkeeping）はセッション行を変更する場合がありますが、日次/アイドルリセットの鮮度は延長しません。リセットロールオーバーでは、新しいプロンプトを構築する前に、前のセッションのキュー済みシステムイベント通知を破棄します。
- **親フォークポリシー**は、スレッドまたはサブエージェントフォークを作成するときに OpenClaw のアクティブブランチを使用します。そのブランチが大きすぎる場合、OpenClaw は失敗したり使用不能な履歴を継承したりする代わりに、分離コンテキストで子を開始します。サイズ判定ポリシーは自動です。レガシーの `session.parentForkMaxTokens` 設定は `openclaw doctor --fix` によって削除されます。

実装詳細: この判断は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在のトランスクリプト id（`sessionFile` が設定されていない限り、ファイル名はこれから派生します）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。日次リセットの
  鮮度判定ではこれを使用します。レガシー行では JSONL セッションヘッダーから派生する場合があります。
- `lastInteractionAt`: 最後の実際のユーザー/チャンネル操作のタイムスタンプ。アイドルリセットの
  鮮度判定ではこれを使用するため、Heartbeat、Cron、exec イベントによってセッションが
  維持されることはありません。このフィールドがないレガシー行は、アイドル鮮度判定のために
  復元されたセッション開始時刻へフォールバックします。
- `updatedAt`: 最後のストア行変更タイムスタンプ。一覧表示、刈り込み、管理処理に使用されます。
  日次/アイドルリセット鮮度判定の権威ではありません。
- `archivedAt`: 任意のアーカイブタイムスタンプ。アーカイブ済みセッションはトランスクリプトを
  保持したままストアに残り、通常のアクティブ一覧からは除外されます。
- `pinnedAt`: 任意のピン留めタイムスタンプ。アクティブなピン留め済みセッションは
  ピン留めされていないセッションより前に並びます。セッションをアーカイブするとピン留めは解除されます。
- Codex スレッド相互運用: 両方のフィールドは Codex のスレッド管理形状に従います —
  通信上の `archived`/`pinned` 真偽値は常にタイムスタンプから派生し、
  Codex の `threads.archived_at` セマンティクスと camelCase シリアライズに合わせて
  サーバー側で刻印されます。OpenClaw のタイムスタンプはエポックミリ秒で、
  Codex はエポック秒を使用するため、ブリッジは codex Plugin 境界で変換します。
  Codex にはまだピン留め API がありません（`thread/archive`/`thread/unarchive` のみ）。
  そのため、対応するものが存在するまではピン留め状態は OpenClaw 側に残り、
  存在した時点で一致する形状により、バインドされたセッションのピン留め状態を機械的に
  往復できます。
- `sessionFile`: 任意の明示的なトランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーに役立ちます）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネルラベル付け用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の Compaction 前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュが実行された時点の Compaction 回数

ストアは編集しても安全ですが、Gateway が権威です。セッション実行中にエントリーを書き換えたり再ハイドレートしたりする場合があります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `openclaw/plugin-sdk/agent-sessions` の `SessionManager` によって管理されます。

ファイルは JSONL です:

- 最初の行: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- その後: `id` + `parentId`（ツリー）を持つセッションエントリー

主なエントリータイプ:

- `message`: ユーザー/アシスタント/toolResult メッセージ
- `custom_message`: モデルコンテキストに入る拡張注入メッセージ（UI から非表示にできます）
- `custom`: モデルコンテキストに入らない拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction 要約
- `branch_summary`: ツリーブランチを移動するときの永続化された要約

OpenClaw は意図的にトランスクリプトを「修正」しません。Gateway は `SessionManager` を使用して読み書きします。

---

## コンテキストウィンドウと追跡トークン

重要な概念は 2 つあります:

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルから見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（/status とダッシュボードで使用）

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書き可能）。
- ストア内の `contextTokens` は実行時の見積もり/レポート値です。厳密な保証として扱わないでください。

詳しくは [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: その内容

Compaction は古い会話をトランスクリプト内の永続化された `compaction` エントリーに要約し、最近のメッセージをそのまま保持します。

Compaction 後、以降のターンから見えるもの:

- Compaction 要約
- `firstKeptEntryId` より後のメッセージ

Compaction 後の AGENTS.md セクション再注入は
`agents.defaults.compaction.postCompactionSections` によるオプトインです。未設定または `[]` の場合、
OpenClaw は Compaction 要約の上に AGENTS.md 抜粋を追加しません。

Compaction は（セッション刈り込みと異なり）**永続的**です。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界とツールペアリング

OpenClaw が長いトランスクリプトを Compaction チャンクへ分割するとき、
アシスタントのツール呼び出しを対応する `toolResult` エントリーとペアのまま保持します。

- トークン比率による分割位置がツール呼び出しとその結果の間に来た場合、OpenClaw は
  ペアを分離せず、境界をアシスタントのツール呼び出しメッセージへ移動します。
- 末尾の tool-result ブロックが通常ならチャンクを目標超過にしてしまう場合、OpenClaw は
  その保留中ツールブロックを保持し、未要約の末尾をそのまま保ちます。
- 中断/エラーになったツール呼び出しブロックは、保留中の分割を開いたままにしません。

---

## 自動 Compaction が発生するタイミング（OpenClaw ランタイム）

埋め込み OpenClaw エージェントでは、自動 Compaction は 2 つの場合にトリガーされます:

1. **オーバーフロー復旧**: モデルがコンテキストオーバーフローエラー
   （`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` および類似のプロバイダー形状の変種）を返す → compact → 再試行。
   プロバイダーが試行されたトークン数を報告する場合、OpenClaw はその観測値を
   オーバーフロー復旧 Compaction へ転送します。プロバイダーがオーバーフローを確認しても
   解析可能な数値を公開しない場合、OpenClaw は最小限に予算超過した合成カウントを
   Compaction エンジンと診断に渡します。
   オーバーフロー復旧がなお失敗した場合、OpenClaw はユーザーに明示的なガイダンスを表示し、
   セッションキーを新しいセッション id へ静かにローテーションするのではなく、現在の
   セッションマッピングを保持します。次のステップはオペレーター制御です:
   メッセージを再試行する、`/compact` を実行する、または新しいセッションを優先する場合は
   `/new` を実行します。
2. **しきい値メンテナンス**: ターンが成功した後、次の場合:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力用に予約される余裕

これらは OpenClaw ランタイムのセマンティクスです。

OpenClaw は、`agents.defaults.compaction.maxActiveTranscriptBytes` が設定され、
アクティブなトランスクリプトファイルがそのサイズに達した場合、次の実行を開く前に
プリフライトのローカル Compaction もトリガーできます。これはローカル再オープンコストのための
ファイルサイズガードであり、生のアーカイブではありません。OpenClaw は引き続き通常の
セマンティック Compaction を実行し、Compaction 済み要約を新しい後続トランスクリプトに
できるよう `truncateAfterCompaction` を要求します。

埋め込み OpenClaw 実行では、`agents.defaults.compaction.midTurnPrecheck.enabled: true` により
オプトインのツールループガードが追加されます。ツール結果が追加された後、次のモデル呼び出しの前に、
OpenClaw はターン開始時に使用するものと同じプリフライト予算ロジックでプロンプト圧力を見積もります。
コンテキストが収まらなくなった場合、ガードは OpenClaw ランタイムの `transformContext` フック内で
compact しません。構造化されたターン途中プリチェックシグナルを発生させ、現在のプロンプト送信を停止し、
外側の実行ループに既存の復旧パスを使わせます。十分な場合は過大なツール結果を切り詰めるか、
設定済みの Compaction モードをトリガーして再試行します。このオプションはデフォルトで無効で、
プロバイダーバックの safeguard Compaction を含め、`default` と `safeguard` の両方の
Compaction モードで動作します。
これは `maxActiveTranscriptBytes` とは独立しています。バイトサイズガードはターンを開く前に実行され、
ターン途中プリチェックは新しいツール結果が追加された後、埋め込み OpenClaw ツールループ内で後から実行されます。

---

## Compaction 設定（`reserveTokens`, `keepRecentTokens`）

OpenClaw ランタイムの Compaction 設定はエージェント設定にあります:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は埋め込み実行に対して安全下限も適用します:

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw は引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動 `/compact` は明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、
  OpenClaw ランタイムの最近末尾の切断点を保持します。明示的な保持予算がない場合、
  手動 Compaction はハードチェックポイントのままで、再構築されたコンテキストは
  新しい要約から開始されます。
- 新しいツール結果の後、次のモデル呼び出しの前に任意のツールループプリチェックを実行するには
  `agents.defaults.compaction.midTurnPrecheck.enabled: true` を設定します。これはトリガーのみです。
  要約生成は引き続き設定済みの Compaction パスを使用します。これはターン開始時の
  アクティブトランスクリプトのバイトサイズガードである `maxActiveTranscriptBytes` とは独立しています。
- アクティブなトランスクリプトが大きくなったとき、ターン前にローカル Compaction を実行するには
  `agents.defaults.compaction.maxActiveTranscriptBytes` にバイト値または `"20mb"` のような文字列を
  設定します。このガードは `truncateAfterCompaction` も有効な場合にのみアクティブです。
  無効にするには未設定のままにするか `0` を設定します。
- `agents.defaults.compaction.truncateAfterCompaction` が有効な場合、
  OpenClaw は Compaction 後、アクティブなトランスクリプトを Compaction 済み後続 JSONL へ
  ローテーションします。ブランチ/復元チェックポイント操作はその Compaction 済み後続を使用します。
  レガシーの Compaction 前チェックポイントファイルは、参照されている間は引き続き読み取り可能です。

理由: Compaction が避けられなくなる前に、複数ターンの「ハウスキーピング」（メモリ書き込みなど）に十分な余裕を残すためです。

実装: `src/agents/agent-settings.ts` の `applyAgentCompactionSettingsFromConfig()`
（埋め込みランナーのターンおよび Compaction セットアップパスから呼び出されます）。

---

## プラグ可能な Compaction プロバイダー

Plugin は Plugin API の `registerCompactionProvider()` を介して Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー id に設定されている場合、safeguard 拡張は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーへ要約を委任します。

- `provider`: 登録済み Compaction プロバイダー Plugin の id。デフォルトの LLM 要約では未設定のままにします。
- `provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取ります。
- safeguard は、プロバイダー出力後も最近ターンおよび分割ターンのサフィックスコンテキストを保持します。
- 組み込みの safeguard 要約は、前回の完全な要約をそのまま保持するのではなく、
  以前の要約を新しいメッセージとともに再蒸留します。
- safeguard モードでは、デフォルトで要約品質監査が有効になります。
  不正な形式の出力時の再試行動作をスキップするには `qualityGuard.enabled: false` を設定します。
- プロバイダーが失敗するか空の結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックします。
- 中断/タイムアウトシグナルは、呼び出し元のキャンセルを尊重するため再スローされます（握りつぶされません）。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## ユーザーに見えるサーフェス

Compaction とセッション状態は次の方法で確認できます:

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Gateway ログ（`pnpm gateway:watch` または `openclaw logs --follow`）: `embedded run auto-compaction start` + `complete`
- 詳細モード: `🧹 Auto-compaction complete` + Compaction 回数

---

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を表示すべきでないバックグラウンドタスク用の「サイレント」ターンをサポートします。

規約:

- アシスタントは、正確なサイレントトークン `NO_REPLY` /
  `no_reply` で出力を開始し、「ユーザーに返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを除去/抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけの場合、`NO_REPLY` と
  `no_reply` はどちらも該当します。
- これは真のバックグラウンド/非配信ターン専用です。通常の実行可能なユーザーリクエストのショートカットではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**下書き/入力中ストリーミング**も抑制するため、サイレント操作がターン途中で部分出力を漏らすことはありません。

---

## Compaction 前の「メモリフラッシュ」（実装済み）

目的: 自動 Compaction が発生する前に、永続的な状態をディスク（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）へ書き込むサイレントなエージェントターンを実行し、Compaction が重要なコンテキストを消去できないようにします。

OpenClaw は **事前しきい値フラッシュ** アプローチを使用します。

1. セッションコンテキスト使用量を監視します。
2. 使用量が「ソフトしきい値」（OpenClaw ランタイムの Compaction しきい値より低い値）を超えたら、エージェントにサイレントな
   「今すぐメモリを書き込む」指示を実行します。
3. 正確なサイレントトークン `NO_REPLY` / `no_reply` を使用し、ユーザーには
   何も表示されないようにします。

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled`（デフォルト: `true`）
- `model`（フラッシュターン用の任意の正確なプロバイダー/モデル上書き。例: `ollama/qwen3:8b`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

Notes:

- デフォルトのプロンプト/システムプロンプトには、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- `model` が設定されている場合、フラッシュターンはアクティブセッションのフォールバックチェーンを継承せずにそのモデルを使用するため、ローカル専用のハウスキーピングが有料の会話モデルへ黙ってフォールバックすることはありません。
- フラッシュは Compaction サイクルごとに1回実行されます（`sessions.json` で追跡されます）。
- フラッシュは埋め込み OpenClaw セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては、[Memory](/ja-JP/concepts/memory) を参照してください。

OpenClaw は拡張 API で `session_before_compact` フックも公開していますが、現在 OpenClaw のフラッシュロジックは Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っていますか？[/concepts/session](/ja-JP/concepts/session) から始め、`/status` の `sessionKey` を確認してください。
- ストアとトランスクリプトが一致しませんか？`openclaw status` から Gateway ホストとストアパスを確認してください。
- Compaction が頻発しますか？次を確認してください:
  - モデルコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（`reserveTokens` がモデルウィンドウに対して高すぎると、より早い Compaction が発生する可能性があります）
  - ツール結果の肥大化: セッションプルーニングを有効化/調整してください
- サイレントターンが漏れていますか？返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、およびストリーミング抑制修正を含むビルドを使用していることを確認してください。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
