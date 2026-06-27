---
read_when:
    - OpenClaw のランタイムデータ、キャッシュ、トランスクリプト、タスク状態、またはスクラッチファイルを SQLite に移行する
    - レガシー JSON または JSONL ファイルからの doctor 移行の設計
    - バックアップ、復元、VFS、またはワーカーストレージの挙動を変更する
    - セッションロック、プルーニング、切り詰め、または JSON 互換性パスの削除
summary: config はファイルベースのまま、SQLite を主要な永続状態およびキャッシュ層にするための移行計画
title: Database-first ステートリファクタリング
x-i18n:
    generated_at: "2026-06-27T12:53:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# データベースファーストの状態リファクタリング

## 決定

2 レベルの SQLite レイアウトを使用する:

- グローバルデータベース: `~/.openclaw/state/openclaw.sqlite`
- エージェントデータベース: エージェント所有のワークスペース、
  トランスクリプト、VFS、アーティファクト、およびエージェント単位の大きなランタイム状態ごとに、エージェントごとに 1 つの SQLite データベース
- 設定はファイルベースのままにする: `openclaw.json` は引き続き
  データベースの外部に置く。ランタイム認証プロファイルは SQLite に移行し、外部プロバイダーまたは CLI
  の認証情報ファイルは OpenClaw のデータベース外で所有者が管理する。

グローバルデータベースはコントロールプレーンのデータベースである。これはエージェント検出、
共有 Gateway 状態、ペアリング、デバイス/ノード状態、タスクとフローの台帳、Plugin
状態、スケジューラーのランタイム状態、バックアップメタデータ、マイグレーション状態を所有する。

エージェントデータベースはデータプレーンのデータベースである。これはエージェントのセッション
メタデータ、トランスクリプトイベントストリーム、VFS ワークスペースまたはスクラッチ名前空間、ツール
アーティファクト、実行アーティファクト、検索/インデックス化可能なエージェントローカルのキャッシュデータを所有する。

これにより、大きなエージェントワークスペース、
トランスクリプト、バイナリスクラッチデータを共有 Gateway の書き込みレーンに押し込まずに、耐久性のある 1 つのグローバルビューを得られる。

## 厳格な契約

このマイグレーションには、正規のランタイム形状が 1 つだけある:

- セッション行はセッションメタデータのみを永続化する。`transcriptLocator`、トランスクリプトファイルパス、兄弟 JSONL パス、ロックパス、
  プルーニングメタデータ、またはファイル時代の互換性ポインターを永続化してはならない。
- トランスクリプト ID は常に SQLite ID である: `{agentId, sessionId}` に、
  プロトコルが必要とする場合の任意のトピックメタデータを加えたもの。
- `sqlite-transcript://...` はランタイムまたはプロトコルの ID ではない。新しいコードは
  トランスクリプトロケーターを導出、永続化、渡す、解析、またはマイグレーションしてはならない。ランタイムと
  テストには擬似ロケーターを一切含めるべきではない。ドキュメントでは、この文字列を禁止する目的でのみ言及してよい。
- レガシーの `sessions.json`、トランスクリプト JSONL、`.jsonl.lock`、プルーニング、切り詰め、
  および古いセッションパスロジックは、doctor のマイグレーション/インポートパスのみに属する。
- レガシーのセッション設定エイリアスは doctor マイグレーションのみに属する。ランタイムは
  `session.idleMinutes`、`session.resetByType.dm`、または
  別の設定済みエージェント向けのエージェント横断 `agent:main:*` メインセッションエイリアスを解釈しない。
- セッションルーティング ID は型付きリレーショナル状態である。ホットランタイムと UI パスは
  `sessions.session_scope`、`sessions.account_id`、
  `sessions.primary_conversation_id`、`conversations`、および
  `session_conversations` を読むべきである。古い呼び出し箇所が削除されるまでの互換性シャドウを除き、プロバイダー ID のために `session_key` を解析したり、
  `session_entries.entry_json` を掘り起こしたりしてはならない。
- `dm` と `direct` のようなチャネルレベルのダイレクトメッセージマーカーはルーティング
  語彙であり、トランスクリプトロケーターでもファイルストア互換性ハンドルでもない。
- レガシーフックハンドラー設定は、doctor の警告/マイグレーション面のみに属する。
  ランタイムは `hooks.internal.handlers` をロードしてはならない。フックは検出された
  フックディレクトリと `HOOK.md` メタデータのみを通じて実行される。
- ランタイム起動、ホット返信パス、Compaction、リセット、リカバリー、診断、
  TTS、メモリフック、サブエージェント、Plugin コマンドルーティング、プロトコル境界、および
  フックは、ランタイム内で `{agentId, sessionId}` を渡さなければならない。
- テストは `{agentId, sessionId}` を通じて SQLite トランスクリプト行をシードし、アサートするべきである。JSONL パス転送、
  呼び出し元指定ロケーターの保持、またはトランスクリプトファイル互換性だけを証明するテストは、
  doctor インポート、非セッションのサポート/デバッグ用マテリアライズ、またはプロトコル形状をカバーしない限り削除するべきである。
- `runEmbeddedPiAgent(...)`、準備済みワーカー実行、および内部の埋め込み
  試行は、トランスクリプトロケーターを受け入れてはならない。これらは `{agentId, sessionId}` で SQLite トランスクリプト
  マネージャーを開き、そのマネージャーを内部化された
  PI 互換エージェントセッションに渡す。これにより、古い呼び出し元がランナーに
  JSON/JSONL トランスクリプトを書かせることはできない。
- ランナー診断はランタイム/キャッシュ/ペイロードのトレースレコードを SQLite に保存しなければならない。
  ランタイム診断は JSONL ファイル上書きノブや汎用
  トランスクリプト JSONL エクスポートヘルパーを公開してはならない。ユーザー向けエクスポートは、ファイル名をランタイムへ戻さずに、データベース行から明示的な
  アーティファクトをマテリアライズできる。
- 生ストリームロギングは `OPENCLAW_RAW_STREAM=1` と SQLite 診断行を使用する。
  古い pi-mono の `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH`、および
  `raw-openai-completions.jsonl` ファイルロガー契約は、OpenClaw
  ランタイムまたはテストの一部ではない。
- QMD メモリインデックス化は SQLite トランスクリプトを Markdown ファイルにエクスポートしてはならない。
  QMD は設定済みメモリファイルのみをインデックス化する。セッショントランスクリプト検索は
  SQLite ベースのままにする。
- QMD SDK サブパスは新しいコードでは QMD 専用である。SQLite セッショントランスクリプト
  インデックス化ヘルパーは `memory-core-host-engine-session-transcripts` に置く。QMD
  の再エクスポートは互換性のみであり、ランタイムコードで使用してはならない。
- 組み込みメモリインデックスは所有元のエージェントデータベースに置く。ランタイム設定と
  解決済みランタイム契約は `memorySearch.store.path` を公開してはならない。doctor
  はそのレガシー設定キーを削除し、現在のコードはエージェントの
  `databasePath` を内部的に渡す。

実装作業では、doctor/インポート/エクスポート/デバッグ境界の外で例外なくこれらのステートメントが真になるまで、コードを削除し続けるべきである。

## 目標状態と進捗

### 厳格な目標

- 1 つのグローバル SQLite データベースがコントロールプレーン状態を所有する:
  `state/openclaw.sqlite`。
- エージェントごとの 1 つの SQLite データベースがデータプレーン状態を所有する:
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定はファイルベースのままにする。`openclaw.json` はこのデータベース
  リファクタリングの一部ではない。
- レガシーファイルは doctor マイグレーション入力のみである。
- ランタイムはアクティブ状態としてセッションまたはトランスクリプト JSONL を書き込みも読み取りもしない。

### 目標状態

- `not-started`: ファイル時代のランタイムコードがまだアクティブ状態を書き込んでいる。
- `migrating`: doctor/インポートコードがファイルデータを SQLite に移動できる。
- `dual-read`: 一時的なブリッジが SQLite とレガシーファイルの両方を読む。この状態は、
  doctor 専用として明示的に文書化されていない限り、このリファクタリングでは禁止される。
- `sqlite-runtime`: ランタイムが SQLite のみを読み書きする。
- `clean`: レガシーランタイム API とテストが削除され、ガードが
  回帰を防ぐ。
- `done`: ドキュメント、テスト、バックアップ、doctor マイグレーション、および変更チェックが
  clean 状態を証明する。

### 現在の状態

- セッション: ランタイムでは `clean`。セッション行はエージェントごとのデータベースにあり、
  ランタイム API は `{agentId, sessionId}` または `{agentId, sessionKey}` を使用し、
  `sessions.json` は doctor 専用のレガシー入力である。
- トランスクリプト: ランタイムでは `clean`。トランスクリプトイベント、ID、スナップショット、
  およびトラジェクトリーのランタイムイベントはエージェントごとのデータベースにある。ランタイムは
  トランスクリプトロケーターまたは JSONL トランスクリプトパスを受け入れなくなった。
- PI 埋め込みランナー: `clean`。埋め込み PI 実行、準備済みワーカー、Compaction、
  およびリトライループは SQLite セッションスコープを使用し、古いトランスクリプトハンドルを拒否する。
- Cron: ランタイムでは `clean`。ランタイムは `cron_jobs` と `cron_run_logs` を使用する。
  ランタイムテストは SQLite の `storeKey` 命名を使用し、ファイル時代の Cron パスは
  doctor レガシーマイグレーションテストのみに残る。
- タスクレジストリ: `clean`。タスクと Task Flow ランタイム行は
  `state/openclaw.sqlite` にある。未出荷のサイドカー SQLite インポーターは削除された。
- Plugin 状態: `clean`。Plugin の状態/blob 行は共有グローバル
  データベースにある。古い Plugin 状態のサイドカー SQLite ヘルパーはガードされている。
- メモリ: 組み込みメモリとセッショントランスクリプトインデックス化では `sqlite-runtime`。
  メモリインデックステーブルはエージェントごとのデータベースにあり、Plugin メモリ状態は
  共有 Plugin 状態行を使用し、レガシーメモリファイルは doctor マイグレーション入力
  またはユーザーワークスペースコンテンツである。
- バックアップ: `sqlite-runtime`。バックアップ段階は SQLite スナップショットをコンパクト化し、ライブ
  WAL/SHM サイドカーを省略し、SQLite 整合性を検証し、バックアップ実行を
  グローバルデータベースに記録する。
- doctor マイグレーション: 意図的に `migrating`。doctor はレガシー JSON、
  JSONL、および廃止されたサイドカーストアを SQLite にインポートし、マイグレーション実行/ソースを記録し、
  成功したソースを削除する。
- E2E スクリプト: ランタイムカバレッジでは `clean`。Docker MCP シードは SQLite
  行を書き込む。runtime-context Docker スクリプトは doctor マイグレーションシード内でのみ
  レガシー JSONL を作成し、レガシーセッションインデックスパスを明示的に命名する。

### 残作業

- [x] cron ランタイムテストのストア変数を、doctor レガシー入力でない限り
      `storePath` からリネームする。
      ファイル: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`。
      証明: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`。
- [x] 廃止されたファイル時代のエクスポートテストモックを削除またはリネームする。
      ファイル: `src/auto-reply/reply/commands-export-test-mocks.ts`。
      証明: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`。
- [x] Docker runtime-context のレガシー JSONL シードを明確に doctor 専用にする。
      ファイル: `scripts/e2e/session-runtime-context-docker-client.ts`。
      証明: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` は
      `seedBrokenLegacySessionForDoctorMigration` のみを示す。
- [x] スキーマ変更後は Kysely 生成型を整合させる。
      ファイル: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`。
      証明: このパスではスキーマ変更なし。`pnpm db:kysely:check`;
      `pnpm lint:kysely`。
- [x] 変更したストア、コマンド、スクリプトの焦点を絞ったテストを再実行する。
      証明: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`。
- [x] `done` を宣言する前に、変更ゲートまたはリモートの広範な証明を実行する。
      証明: `pnpm check:changed --timed -- <changed extension paths>` は
      一時的な Node 24/pnpm セットアップと、同期された `.git` なしワークスペース向けの
      明示的なパスルーティングの後、Hetzner Crabbox 実行 `run_3f1cabf6b25c` で成功した。

### 回帰させないこと

- トランスクリプトロケーターなし。
- アクティブなセッションファイルなし。
- doctor レガシーマイグレーションテストを除き、偽の JSONL テストフィクスチャなし。
- Kysely が期待される場所で生の SQLite アクセスなし。
- 新しいレガシー DB マイグレーションなし。このレイアウトはまだ出荷されていないため、強い理由がない限りスキーマバージョンは
  `1` のままにする。

## コード読解上の前提

この計画をブロックしている追加のプロダクト判断はない。実装は
これらの前提で進めるべきである:

- このストレージパスでは `node:sqlite` を直接使用し、Node 22+ ランタイムを必須にする。
- 通常の設定ファイルは正確に 1 つだけ維持する。このリファクタでは、設定、Plugin
  マニフェスト、Git ワークスペースを SQLite に移動しない。
- ランタイム互換ファイルは不要。レガシー JSON と JSONL ファイルは
  移行入力としてのみ扱う。ブランチローカルの SQLite サイドカーは一度も出荷されていないため、
  インポートせずに削除する。
- `openclaw doctor --fix` がレガシーファイルからデータベースへの移行ステップを所有する。
  ランタイム起動と `openclaw migrate` は、レガシー OpenClaw
  データベースアップグレードパスを持つべきではない。
- 認証情報の互換性も同じルールに従う。ランタイム認証情報は
  SQLite に存在する。古い `auth-profiles.json`、エージェントごとの `auth.json`、共有
  `credentials/oauth.json` ファイルは doctor の移行入力であり、インポート後に削除する。
- 生成されたモデルカタログ状態はデータベースで管理する。ランタイムコードは
  `agents/<agentId>/agent/models.json` を書き込んではならない。既存の `models.json` ファイルはレガシーの
  doctor 入力であり、`agent_model_catalogs` へのインポート後に削除する。
- ランタイムはトランスクリプトロケータを移行、正規化、またはブリッジしてはならない。アクティブな
  トランスクリプト ID は SQLite 内の `{agentId, sessionId}`。ファイルパスは
  レガシーの doctor 入力のみであり、`sqlite-transcript://...` は境界ハンドルとして扱うのではなく、
  ランタイム、プロトコル、フック、Plugin サーフェスから消えなければならない。
- ランタイムの SQLite トランスクリプト読み取りでは、古い JSONL エントリ形状の移行を実行したり、
  互換性のためにトランスクリプト全体を書き換えたりしない。レガシーエントリの正規化は
  明示的な doctor/インポートユーティリティに残す。doctor は SQLite 行を挿入する前にレガシー JSONL トランスクリプト
  ファイルを正規化する。現在のランタイム行は
  すでに現在のトランスクリプトスキーマで書き込まれている。Trajectory/セッションのエクスポートは
  それらの行をそのまま読み取り、エクスポート時のレガシー移行を実行してはならない。
- レガシートランスクリプト JSONL の解析/移行ヘルパーは doctor 専用。ランタイムの
  トランスクリプト形式コードは現在の SQLite トランスクリプトコンテキストのみを構築する。doctor が
  行を挿入する前に古い JSONL エントリのアップグレードを所有する。
- 古いランタイム所有の JSONL トランスクリプトストリーミングヘルパーは削除された。doctor
  インポートコードが明示的なレガシーファイル読み取りを所有し、ランタイムのセッション履歴は
  SQLite 行を読み取る。
- Codex app-server バインディングは、OpenClaw の `sessionId` を Codex Plugin-state 名前空間の正規
  キーとして使用する。`sessionKey` は
  ルーティング/表示用のメタデータであり、永続的なセッション ID を置き換えたり、
  トランスクリプトファイル ID を復活させたりしてはならない。
- コンテキストエンジンは現在のランタイム契約を直接受け取る。レジストリは、
  `sessionKey`、`transcriptScope`、または `prompt` を削除するリトライシムでエンジンをラップしてはならない。
  現在のデータベース優先パラメータを受け入れられないエンジンは、
  ブリッジされるのではなく明確に失敗すべきである。
- バックアップ出力は 1 つのアーカイブファイルのままにする。データベース内容は、
  生のライブ WAL サイドカーではなく、コンパクトな SQLite スナップショットとしてそのアーカイブに入れるべきである。
- トランスクリプト検索は有用だが、最初のデータベース優先の区切りでは必須ではない。
  後から FTS を追加できるようにスキーマを設計する。
- Worker 実行は、データベース境界が安定するまで設定の背後で実験的なままにするべきである。

## コード読解で見つかった点

現在のブランチはすでに概念実証段階を過ぎている。共有
データベースが存在し、Node の `node:sqlite` は小さなランタイムヘルパーを通じて接続されており、
以前のストアは現在 `state/openclaw.sqlite` または所有元の
`openclaw-agent.sqlite` データベースに書き込む。

残っている作業は SQLite を選ぶことではない。新しい境界をクリーンに保ち、
古いファイル世界に見える互換性寄りのインターフェイスを削除することだ。

- セッションの `storePath` は、もはやランタイム ID、テストフィクスチャ形状、または
  ステータスペイロードフィールドではない。ランタイムとブリッジのテストには
  `storePath` 契約名はもう含まれていない。doctor/移行コードがそのレガシー語彙を所有する。
- セッション書き込みは、古いインプロセス `store-writer.ts`
  キューを経由しなくなった。代わりに SQLite パッチ書き込みは競合検出と有界リトライを使用する。
- レガシーパス検出にはまだ有効な移行用途があるが、ランタイムコードは
  `sessions.json` とトランスクリプト JSONL ファイルを可能な書き込みターゲットとして扱うのをやめるべきである。
- エージェント所有のテーブルはエージェントごとの SQLite データベースに存在する。グローバル DB は
  レジストリ/コントロールプレーン行を保持する。トランスクリプト ID は、エージェントごとのトランスクリプト行にある `{agentId, sessionId}`。
  ランタイムコードはトランスクリプトファイルパスを永続化したり、トランスクリプトロケータを移行したりしてはならない。
- doctor はすでにいくつかのレガシーファイルをインポートしている。クリーンアップは、それを
  doctor が呼び出す単一の明示的な移行実装にし、永続的な移行レポートを持たせること。

実装をブロックする追加のプロダクト上の質問はない。

## 現在のコード形状

このブランチにはすでに実際の共有 SQLite ベースがある。

- ランタイムの下限は Node 22+ になりました: `package.json`、CLI ランタイムガード、
  インストーラーのデフォルト、macOS ランタイムロケーター、CI、公開インストールドキュメントがすべて
  一致しています。古い Node 22 互換性レーンは削除されました。
- `src/state/openclaw-state-db.ts` は `openclaw.sqlite` を開き、WAL、
  `synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON` を設定し、
  `src/state/openclaw-state-schema.sql` から派生した生成済みスキーマモジュールを適用します。
- Kysely テーブル型とランタイムスキーマモジュールは、コミット済みの `.sql` ファイルから作成された使い捨ての
  SQLite データベースから生成されます。ランタイムコードは、グローバル、エージェント単位、またはプロキシ
  キャプチャデータベース用にコピー&ペーストされたスキーマ文字列を保持しなくなりました。
- ランタイムストアは、SQLite 行形状を手作業でシャドーイングする代わりに、生成済みの
  Kysely `DB` インターフェースから選択行型と挿入行型を派生します。Raw SQL は引き続き、
  スキーマ適用、プラグマ、移行専用 DDL に限定されます。
- このデータベースレイアウトはまだ出荷されていないため、SQLite スキーマは `user_version = 1` に統合されています。
  ランタイムオープナーは現在のスキーマのみを作成します。ファイルからデータベースへのインポートは doctor コードに残り、
  ブランチローカルのデータベースアップグレードヘルパーは削除されました。
- 所有権境界が正規である場所では、リレーショナルな所有権が強制されます:
  ソース移行行は `migration_runs` からカスケードし、タスク配信状態は `task_runs` からカスケードし、
  トランスクリプト ID 行はトランスクリプトイベントからカスケードします。
- 現在の共有テーブルには、`agent_databases`、
  `auth_profile_stores`、`auth_profile_state`、
  `plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、
  `skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、
  `sandbox_registry_entries`、`cron_run_logs`、`cron_jobs`、`commitments`、
  `delivery_queue_entries`、`model_capability_cache`、
  `workspace_setup_state`、`native_hook_relay_bridges`、
  `current_conversation_bindings`、`plugin_binding_approvals`、
  `tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、
  `acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、
  `subagent_runs`、`migration_runs`、`backup_runs` が含まれます。
- 任意の Plugin 所有状態に、ホスト所有の型付きテーブルは与えられません。
  インストール済み Plugin は、バージョン付き JSON ペイロードに `plugin_state_entries` を使い、
  バイトには `plugin_blob_entries` を使います。名前空間/キーの所有権、TTL クリーンアップ、
  バックアップ、Plugin 移行レコードを備えています。ホストがクエリ契約を所有する場合、
  たとえば `plugin_binding_approvals` のようなホスト所有の Plugin オーケストレーション状態には、
  引き続き型付きテーブルを持たせることができます。
- Plugin 移行は、ホストスキーマ移行ではなく、Plugin 所有名前空間上のデータ移行です。
  Plugin は移行プロバイダーを通じて、自身のバージョン付き状態/blob エントリを移行できます。
  ホストは通常の移行台帳にソース/実行ステータスを記録します。新しい Plugin のインストールでは、
  ホスト自体が新しいクロス Plugin 契約の所有権を引き受ける場合を除き、
  `openclaw-state-schema.sql` を変更する必要はありません。
- `src/state/openclaw-agent-db.ts` は
  `agents/<agentId>/agent/openclaw-agent.sqlite` を開き、グローバル DB にデータベースを登録し、
  エージェントローカルのセッション、トランスクリプト、VFS、アーティファクト、キャッシュ、
  メモリーインデックステーブルを所有します。共有ランタイム検出は、各呼び出し箇所でそのクエリを再実装する代わりに、
  生成型付きの `agent_databases` レジストリを読み取るようになりました。
- グローバルデータベースとエージェント単位データベースは、データベースロール、スキーマバージョン、
  タイムスタンプ、エージェントデータベース用のエージェント ID を含む `schema_meta` 行を記録します。
  この SQLite スキーマはまだ出荷されていないため、レイアウトは引き続き `user_version = 1` のままです。
- エージェント単位のセッション ID には、`session_id` をキーとする正規の `sessions` ルートテーブルができました。
  `session_key`、`session_scope`、`account_id`、`primary_conversation_id`、
  タイムスタンプ、表示フィールド、モデルメタデータ、ハーネス ID、親/スポーンのリンクが、
  クエリ可能な列として含まれます。`session_routes` は `session_key` から現在の
  `session_id` への一意のアクティブルートインデックスであり、重複する `sessions.session_key` 行の間でホット読み取りに選択させることなく、
  ルートキーを新しい永続セッションに移動できます。古い `session_entries.entry_json` の互換性形状ペイロードは、
  外部キーで永続 `session_id` ルートにぶら下がります。これはセッションの唯一のスキーマレベル表現ではなくなりました。
- エージェント単位の外部会話 ID もリレーショナルです:
  `conversations` は正規化されたプロバイダー/アカウント/会話 ID を保存し、
  `session_conversations` は 1 つの OpenClaw セッションを 1 つ以上の外部会話にリンクします。
  これにより、複数のピアを意図的に 1 つのセッションへマップできる共有メイン DM セッションを、
  `session_key` に虚偽を入れずに扱えます。SQLite は自然なプロバイダー ID の一意性も強制するため、
  同じチャネル/アカウント/種類/ピア/スレッドのタプルが会話 ID 間で分岐することはありません。
  共有メインの直接ピアは `participant` ロールでリンクされるため、1 つの
  OpenClaw セッションが、古いピアを曖昧な関連行へ格下げすることなく複数の外部 DM ピアを表現できます。
  `sessions.primary_conversation_id` は引き続き現在の型付き配信ターゲットを指します。
  閉じたルーティング/ステータス列は、TypeScript ユニオンだけに頼るのではなく、SQLite `CHECK` 制約で強制されます。
  ランタイムセッション投影は、型付きセッション/会話列を適用する前に
  `session_entries.entry_json` から互換性ルーティングシャドウを消去するため、古い JSON ペイロードが配信ターゲットを復活させることはありません。
  サブエージェントの告知ルーティングも、型付き SQLite 配信コンテキストを要求します。
  互換性 `SessionEntry` ルートフィールドへフォールバックしなくなりました。
  Gateway `chat.send` の明示的な配信継承は、`origin`/`last*` 互換性フィールドではなく、型付き SQLite 配信コンテキストを読み取ります。
  `tools.effective` も同様に、古い `last*` セッションエントリシャドウではなく、型付き SQLite 配信/ルーティング行からプロバイダー/アカウント/スレッドコンテキストを派生します。
  システムイベントのプロンプトコンテキストは、`origin` シャドウではなく、型付き配信フィールドからチャネル/to/アカウント/スレッドフィールドを再構築します。
  共有 `deliveryContextFromSession` ヘルパーとセッションから会話へのマッパーは、
  `SessionEntry.origin` を完全に無視するようになりました。型付き配信フィールドとリレーショナルな会話行だけが、ホットルート ID を作成できます。
  ランタイムセッションエントリ正規化は、`entry_json` の永続化または投影の前に `origin` を取り除き、
  インバウンドメタデータは新しい origin シャドウを作成する代わりに、型付きチャネル/chat フィールドとリレーショナルな会話行を書き込みます。
- トランスクリプトイベント、トランスクリプトスナップショット、軌跡ランタイムイベントは、正規のエージェント単位 `sessions` ルートを参照し、
  セッション削除時にカスケードするようになりました。トランスクリプト ID/冪等性行は引き続き、
  正確なトランスクリプトイベント行からカスケードします。
- メモリーコアインデックスは、明示的なエージェントデータベーステーブル
  `memory_index_meta`、`memory_index_sources`、`memory_index_chunks`、`memory_embedding_cache` を使うようになり、
  `memory_index_state` がリビジョン変更を追跡します。
  任意の FTS/vector サイドインデックスは、汎用的な `meta`、`files`、`chunks`、
  `chunks_fts`、`chunks_vec` テーブルではなく、`memory_index_chunks_fts` と
  `memory_index_chunks_vec` という名前になります。正規名は現在のパス/ソース行形状と、
  シリアライズ済み埋め込み互換性を保持します。これらのテーブルは派生/検索キャッシュであり、
  正規のトランスクリプトストレージではありません。メモリーワークスペースファイルと設定済みソースから削除して再構築できます。
  出荷済みの汎用名メモリーインデックスを開くと、そのメタデータ、ソース、チャンク、埋め込みキャッシュが正規テーブルへ移行されます。
  派生 FTS/vector テーブルは正規名で再構築されます。
- サブエージェント実行回復状態は、子、要求元、コントローラーのセッションキーにインデックスがある、型付き共有 `subagent_runs` 行に保存されるようになりました。
  古い `subagents/runs.json` ファイルは doctor 移行入力のみです。
- 現在の会話バインディングは、正規化された会話 ID をキーとする型付き共有
  `current_conversation_bindings` 行に保存されるようになり、ターゲットエージェント/セッション列、
  会話種類、ステータス、有効期限、メタデータが、重複した不透明なバインディングレコードではなくリレーショナル列として保存されます。
  永続バインディングキーには正規化された会話種類が含まれるため、direct/group/channel 参照が衝突することはなく、
  SQLite は無効なバインディング種類/ステータス値を拒否します。古い
  `bindings/current-conversations.json` ファイルは doctor 移行入力のみです。
- 配信キュー回復は、リプレイ JSON に対して、チャネル、ターゲット、アカウント、セッション、再試行、
  エラー、プラットフォーム送信、回復状態の型付きキュー列を重ねるようになりました。
  `entry_json` はリプレイペイロード、フック、フォーマット用ペイロードを保持しますが、
  ホットキュールーティング/状態では型付き列が権威です。
- TUI の最終セッション復元ポインターは、ハッシュ化された TUI 接続/セッションスコープをキーとする型付き共有
  `tui_last_sessions` 行に保存されるようになりました。古い TUI JSON ファイルは doctor 移行入力のみです。
- デフォルトの TTS 設定は、`speech-core` Plugin の下でキー付けされた共有 Plugin 状態 SQLite 行に保存されるようになりました。
  古い `settings/tts.json` ファイルは doctor 移行入力のみです。ランタイムは TTS 設定 JSON ファイルを読み書きしなくなり、
  レガシーパスリゾルバーは doctor 移行モジュール内にあります。
- シークレットターゲットメタデータは、すべての認証情報ターゲットが設定ファイルであるかのように扱うのではなく、ストアについて語るようになりました。
  `openclaw.json` は引き続き設定ストアです。auth-profile ターゲットは、プロバイダー形状の認証情報を
  JSON ペイロードとして保持する型付き SQLite `auth_profile_stores` 行を使います。
- シークレット監査は、廃止されたエージェント単位の `auth.json` ファイルをスキャンしなくなりました。
  doctor がそのレガシーファイルに関する警告、インポート、削除を所有します。
- レガシー認証プロファイルパスヘルパーは、doctor レガシーコードに移動しました。
  コア認証プロファイルパスヘルパーは、`auth-profiles.json` や `auth-state.json` のランタイムパスではなく、
  SQLite auth-store ID と表示場所を公開します。
- サブエージェント実行回復と OpenRouter モデル能力キャッシュのランタイムモジュールは、
  SQLite スナップショットリーダー/ライターを doctor 専用レガシー JSON インポートヘルパーから分離するようになりました。
  OpenRouter 能力は、1 つの不透明なキャッシュ blob やプロバイダー固有のホストテーブルではなく、
  `provider_id = "openrouter"` の下の型付き汎用 `model_capability_cache` 行を使います。
  サブエージェント実行の `taskName` は型付き `subagent_runs.task_name` 列に保存されます。
  `payload_json` コピーはリプレイ/デバッグデータであり、ホット表示や検索フィールドのソースではありません。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` は、エージェントデータベースの `vfs_entries` テーブル上に SQLite VFS を実装します。
  ディレクトリ読み取り、再帰的エクスポート、削除、名前変更は、名前空間全体をスキャンしたり `LIKE` パスマッチングに頼ったりする代わりに、
  インデックス付き `(namespace, path)` プレフィックス範囲を使います。
- `src/agents/runtime-worker.entry.ts` は、ワーカー用に実行単位の SQLite VFS、ツールアーティファクト、
  実行アーティファクト、スコープ付きキャッシュストアを作成します。
- ワークスペースブートストラップ完了マーカーは、`.openclaw/workspace-state.json` ではなく、
  解決済みワークスペースパスをキーとする型付き共有 `workspace_setup_state` 行に保存されるようになりました。
  ランタイムはレガシーワークスペースマーカーを読み取りまたは再書き込みしなくなり、
  ヘルパー API はストレージ ID を派生するためだけに偽の `.openclaw/setup-state` パスを受け渡ししなくなりました。
- Exec 承認は、型付き共有 SQLite `exec_approvals_config` シングルトン行に保存されるようになりました。
  doctor はレガシー `~/.openclaw/exec-approvals.json` をインポートします。
  ランタイム書き込みは、そのファイルをアクティブなストア場所として作成、再書き込み、報告しなくなりました。
  macOS コンパニオンは同じ `state/openclaw.sqlite` テーブル行を読み書きします。ディスク上には Unix プロンプトソケットだけを保持します。
  それは IPC であり、永続ランタイム状態ではないためです。
- デバイス ID、デバイス認証、ブートストラップのランタイムモジュールは、
  SQLite スナップショットリーダー/ライターを doctor 専用レガシー JSON インポートヘルパーから分離するようになりました。
  デバイス ID は型付き `device_identities` 行を使い、デバイス認証トークンは型付き `device_auth_tokens` 行を使います。
  デバイス認証書き込みは、トークンテーブルを切り詰める代わりにデバイス/ロールごとに行を調整し、
  ランタイムは単一トークン更新を古いストア全体アダプター経由でルーティングしなくなりました。レガシー
  version-1 JSON ペイロードは doctor のインポート/エクスポート形状としてのみ存在します。
- GitHub Copilot トークン交換キャッシュは、共有 SQLite Plugin 状態テーブルを
  `github-copilot/token-cache/default` の下で使用します。これはプロバイダー所有のキャッシュ状態であるため、
  意図的にホストのスキーマテーブルを追加しません。
- GitHub Copilot の圧縮は、`openclaw-compaction-*.json`
  ワークスペースサイドカーをもう書き込みません。ハーネスは追跡対象の SDK セッションに対して SDK 履歴圧縮 RPC を呼び出し、
  OpenClaw は互換性マーカーファイルではなく SQLite に永続的なセッション/トランスクリプト状態を保持します。
- 共有 Swift ランタイム（`OpenClawKit`）は、デバイス ID とデバイス認証に同じ
  `state/openclaw.sqlite` 行を使用します。macOS アプリヘルパーは、2 つ目の JSON または
  SQLite パスを所有する代わりに、共有 SQLite ヘルパーをインポートします。残存するレガシー `identity/device.json` は、
  doctor がそれを SQLite にインポートするまで ID 作成をブロックし、TypeScript と Android の
  起動ゲートと一致します。
- Android デバイス ID は、型付きの `state/openclaw.sqlite#table/device_identities` 行に保存された、
  同じ TypeScript 互換の鍵素材を使用します。`openclaw/identity/device.json` は読み書きしません。
  残存するレガシーファイルは、doctor がそれを SQLite にインポートするまで起動をブロックします。
- Android のキャッシュ済みデバイス認証トークンも、型付きの
  `state/openclaw.sqlite#table/device_auth_tokens` 行を使用し、TypeScript と Swift と同じ
  version-1 トークンセマンティクスを共有します。ランタイムは `SecurePrefs`
  `gateway.deviceToken*` 互換キーをもう読みません。これらは移行/doctor
  ロジック専用です。
- Android 通知の最近のパッケージ履歴は、型付きの
  `android_notification_recent_packages` 行を使用します。ランタイムは古い SharedPreferences CSV キーをもう移行または
  読み込みません。
- デバイス ID 作成は、レガシー `identity/device.json`
  が存在する場合、SQLite ID 行が無効な場合、または SQLite ID
  ストアを開けない場合にフェイルクローズします。doctor がまずそのファイルをインポートして削除するため、ランタイム
  起動時に移行前のペアリング ID が黙ってローテーションされることはありません。
- デバイス ID 選択は SQLite 行キーであり、JSON ファイルロケーターではありません。テスト
  と Gateway ヘルパーは明示的な ID キーを渡します。廃止済みの `identity/device.json` ファイル名を知っているのは、
  doctor 移行とフェイルクローズ起動ゲートだけです。
- セッションリセット互換性は、現在 doctor 設定移行にあります。
  `session.idleMinutes` は `session.reset.idleMinutes` に移動され、
  `session.resetByType.dm` は `session.resetByType.direct` に移動され、ランタイムのリセットポリシーは
  正規のリセットキーだけを読み込みます。
- レガシー設定互換性は、現在 `src/commands/doctor/` の下にあります。通常の
  `readConfigFileSnapshot()` 検証は、doctor のレガシー検出器をインポートせず、
  レガシー問題に注釈を付けません。`runDoctorConfigPreflight()` が doctor の修復/レポート用にそれらの問題を追加します。
  doctor 設定フローは
  `src/commands/doctor/legacy-config.ts` をインポートし、古い OAuth プロファイル ID 修復は
  `src/commands/doctor/legacy/oauth-profile-ids.ts`
  の下にあります。
- doctor 以外のコマンドは、レガシー設定修復を自動実行しません。たとえば、
  `openclaw update --channel` は、無効なレガシー設定で失敗し、doctor 移行コードを黙ってインポートするのではなく、
  ユーザーに doctor の実行を求めます。
- Web push、APNs、Voice Wake、更新チェック、設定ヘルスは、サブスクリプション、VAPID キー、Node 登録、トリガー行、
  ルーティング行、更新通知状態、設定ヘルスエントリに、全体が不透明な JSON blob ではなく型付き共有 SQLite
  テーブルを使用するようになりました。Web push と APNs のスナップショット書き込みは、テーブルをクリアするのではなく、
  主キーでサブスクリプション/登録を照合するようになりました。設定ヘルスも設定パスごとに同じことを行います。
  これらのランタイムモジュールは、SQLite スナップショットリーダー/ライターを
  doctor 専用のレガシー JSON インポートヘルパーから分離したままにします。
- Node ホスト設定は、共有 SQLite データベース内の型付きシングルトン行を使用するようになりました。
  doctor は通常のランタイム使用前に古い `node.json` ファイルをインポートします。
- デバイス/Node ペアリング、チャンネルペアリング、チャンネル許可リスト、ブートストラップ状態は、
  全体が不透明な JSON blob ではなく型付き SQLite 行を使用するようになりました。Plugin バインディング承認と cron ジョブ状態も同じ分割に従います。
  ランタイムモジュールは SQLite バックの操作と中立的なスナップショットヘルパーを公開し、ペアリング/ブートストラップ
  と Plugin バインディング承認のスナップショット書き込みは、テーブルを切り詰めるのではなく主キーで行を照合します。一方で doctor は
  `src/commands/doctor/legacy/*` モジュールを通じて古い JSON ファイルをインポート/削除します。
- インストール済み Plugin レコードは、現在 SQLite インストール済み Plugin インデックスにあります。
  ランタイム設定の読み書きは、古い
  `plugins.installs` 作成済み設定データをもう移行または保持しません。doctor は通常のランタイム使用前に、そのレガシー設定
  形状を SQLite にインポートします。
- QQBot 資格情報リカバリースナップショットは、現在 SQLite Plugin 状態の
  `qqbot/credential-backups` の下にあります。ランタイムはもう
  `qqbot/data/credential-backup*.json` を書き込みません。doctor は他の QQBot 状態入力とともに、
  それらのレガシーバックアップファイルをインポートして削除します。
- Gateway リロード計画は、内部の `installedPluginIndex.installRecords.*` 差分名前空間の下で
  SQLite インストール済み Plugin インデックススナップショットを比較します。ランタイムのリロード判断は、
  それらの行を偽の `plugins.installs` 設定オブジェクトでラップしなくなりました。
- Matrix 名前付きアカウント資格情報アップグレードは、ランタイム
  読み込み中にはもう実行されません。単一/デフォルトの Matrix アカウントを解決できる場合、古いトップレベルの
  `credentials/matrix/credentials.json`
  リネームは doctor が所有します。
- コアのペアリングおよび cron ランタイムモジュールは、レガシー JSON パス
  ビルダーをもうエクスポートしません。doctor 所有のレガシーモジュールが、インポートテストと
  移行専用に `pending.json`、`paired.json`、
  `bootstrap.json`、`cron/jobs.json` ソースパスを構築します。レガシー cron ジョブ形状の正規化と cron 実行ログインポートは、
  `src/commands/doctor/legacy/cron*.ts` の下にあります。
- `src/commands/doctor/legacy/runtime-state.ts` は、Node ホスト設定を含むレガシー JSON 状態
  ファイルを doctor から SQLite にインポートします。新しいレガシーファイル
  インポーターは `src/commands/doctor/legacy/` の下に置かれます。
- `src/commands/doctor/state-migrations.ts` は、レガシー `sessions.json` と
  `*.jsonl` トランスクリプトを直接 SQLite にインポートし、成功したソースを削除します。
  ルートのレガシートランスクリプトを
  `agents/<agentId>/sessions/*.jsonl` 経由でステージングしたり、インポート前に正規の JSONL ターゲットを作成したりすることはもうありません。
- 状態整合性 doctor チェックは、レガシーセッションディレクトリをもうスキャンせず、
  孤立 JSONL 削除も提示しません。レガシートランスクリプトファイルは移行入力
  専用であり、移行ステップがインポートとソース削除を所有します。
- レガシーサンドボックスレジストリインポートは
  `src/commands/doctor/legacy/sandbox-registry.ts` の下にあります。アクティブなサンドボックスレジストリの
  読み書きは SQLite 専用のままです。
- レガシーセッショントランスクリプトのヘルス/インポート修復は
  `src/commands/doctor/legacy/session-transcript-health.ts` の下にあります。ランタイムコマンド
  モジュールは、JSONL トランスクリプト解析やアクティブブランチ修復コードをもう保持しません。

統合/削除の完了ハイライト:

- Plugin状態は共有の `state/openclaw.sqlite` データベースを使用するようになりました。古い
  ブランチローカルの `plugin-state/state.sqlite` サイドカーインポーターは、その
  SQLiteレイアウトが一度も出荷されなかったため削除されました。プローブ/テストヘルパーは、Plugin状態専用のSQLiteパスを公開する代わりに、共有の
  `databasePath` を報告します。
- タスクとタスクフローのランタイムテーブルは、`tasks/runs.sqlite` と
  `tasks/flows/registry.sqlite` ではなく、共有の
  `state/openclaw.sqlite` データベースに置かれるようになりました。古いサイドカーインポーターは、同じく未出荷レイアウトであるため削除されました。
- `src/config/sessions/store.ts` は、受信メタデータ、ルート更新、updated-at読み取りに
  `storePath` を必要としなくなりました。コマンド永続化、CLIセッションクリーンアップ、サブエージェント深度、認証オーバーライド、トランスクリプトセッションIDは、エージェント/セッション行APIを使用します。書き込みは、楽観的競合リトライ付きのSQLite行パッチとして適用されます。
- セッションターゲット解決は、レガシーの
  `sessions.json` パスではなく、エージェントごとのデータベースターゲットを公開するようになりました。共有Gateway、ACPメタデータ、doctorルート修復、`openclaw sessions` は、`agent_databases` と設定済みエージェントを列挙します。
- Gatewayセッションルーティングは `resolveGatewaySessionDatabaseTarget` を使用するようになりました。返されるターゲットは、レガシーセッションストアファイルパスではなく、`databasePath` と候補SQLite行キーを保持します。
- チャンネルセッションのランタイム型は、updated-at読み取り、受信メタデータ、最終ルート更新向けに `{agentId, sessionKey}` を公開するようになりました。古い
  `saveSessionStore(storePath, store)` 互換型はなくなりました。
- Pluginランタイム、拡張API、`config/sessions` バレルサーフェスは、PluginコードをSQLiteバックのセッション行ヘルパーへ誘導するようになりました。ルートライブラリ互換エクスポート（`loadSessionStore`, `saveSessionStore`, `resolveStorePath`）は、既存コンシューマー向けの非推奨shimとして残ります。古い
  `resolveLegacySessionStorePath` ヘルパーはなくなりました。レガシー
  `sessions.json` パス構築は、移行とテストフィクスチャ内のローカル処理になりました。
- `src/config/sessions/session-entries.sqlite.ts` は、正規のセッションエントリーをエージェントごとのデータベースに保存し、行単位の読み取り/upsert/deleteパッチをサポートするようになりました。ランタイムupsert/patch/deleteは、大文字小文字違いをスキャンしたりレガシー別名キーを整理したりしなくなりました。正規化はdoctorが所有します。スタンドアロンのJSONインポートヘルパーはなくなり、移行はセッションテーブル全体を置き換える代わりに、より新しい行をマージupsertします。公開read/list/loadヘルパーは、型付きの `sessions` 行と `conversations` 行からホットセッションメタデータを投影します。`entry_json` は互換性/デバッグ用のシャドウであり、古くなったり無効になったりしても、型付きセッションIDや配信コンテキストは失われません。
- `src/config/sessions/delivery-info.ts` は、型付きのエージェントごとの `sessions` + `conversations` + `session_conversations` 行から配信コンテキストを解決するようになりました。
  `session_entries.entry_json` からランタイム配信IDを再構築しなくなりました。型付きconversation行がないことはdoctor移行/修復の問題であり、ランタイムfallbackではありません。
- 保存済みセッションのリセット判断は、型付きの `sessions.session_scope`,
  `sessions.chat_type`, `sessions.channel` メタデータを優先するようになりました。`sessionKey` 解析は、コマンドターゲット上の明示的なスレッド/トピックサフィックスにのみ残ります。グループ対ダイレクトのリセット分類は、キー形状からは取得されなくなりました。
- セッション一覧/ステータス表示の分類は、型付きチャットメタデータとGatewayセッション種別を使用するようになりました。`session_key` 内の `:group:` または `:channel:` サブ文字列を、永続的なグループ/ダイレクトの真実として扱わなくなりました。
- サイレント返信ポリシー選択は、明示的なconversation種別またはサーフェスメタデータのみを使用するようになりました。
  `session_key` サブ文字列からダイレクト/グループポリシーを推測しなくなりました。
- セッション表示モデル解決は、SQLiteセッションデータベースターゲットからエージェントIDを受け取るようになり、`session_key` から分割して取り出さなくなりました。
- エージェント間announceターゲットのハイドレーションは、型付きの `sessions.list`
  `deliveryContext` のみを使用するようになりました。レガシーの `origin`、ミラーされた `last*` フィールド、または `session_key` 形状から、チャンネル/アカウント/スレッドルーティングを復元しなくなりました。
- `sessions_send` のスレッドターゲット拒否は、型付きSQLiteルーティングメタデータを読むようになりました。ターゲットキーからスレッドサフィックスを解析してターゲットを拒否または受理することはなくなりました。
- グループスコープのツールポリシー検証は、現在またはspawnされたセッションの型付きSQLite conversationルーティングを読むようになりました。`sessionKey` のデコードでグループ/チャンネルIDを信用しなくなりました。呼び出し元提供のグループIDは、それを保証する型付きセッション行がない場合は破棄されます。
- チャンネルモデルオーバーライド照合は、明示的なグループおよび親conversationメタデータを使用するようになりました。`parentSessionKey` から親conversation IDをデコードしなくなりました。
- 保存済みモデルオーバーライド継承は、型付きセッションコンテキストからの明示的な親セッションキーを必要とするようになりました。`sessionKey` 内の `:thread:` または `:topic:` サフィックスから親オーバーライドを導出しなくなりました。
- 古いセッションスレッド情報ラッパーとロード済みPluginスレッドパーサーはなくなりました。ランタイムコードは `config/sessions/thread-info` をインポートしません。
- チャンネルconversationヘルパーは、完全セッションキー解析ブリッジを公開しなくなりました。コアは引き続き、プロバイダー所有の生conversation IDを `resolveSessionConversation(...)` を通じて正規化しますが、`sessionKey` からルート情報を再構築しません。
- 完了配信、送信ポリシー、タスク保守は、`session_key` 形状からチャット種別を導出しなくなりました。古いチャット種別キーパーサーは削除されました。これらの経路では、型付きセッションメタデータ、型付き配信コンテキスト、または明示的な配信ターゲット語彙が必要です。
- セッション一覧/ステータス、診断、承認アカウントバインディング、TUI Heartbeatフィルタリング、使用状況サマリーは、プロバイダー/アカウント/スレッド/表示ルーティングのために `SessionEntry.origin` を掘り出さなくなりました。残っているランタイムの
  `origin` 読み取りは、非セッション概念または現在ターンの配信オブジェクトのみです。
- 承認リクエストのネイティブconversation検索は、型付きのエージェントごとのセッションルーティング行を読むようになりました。`sessionKey` からチャンネル/グループ/スレッドconversation IDを解析しなくなりました。型付きメタデータがないことは移行/修復の問題です。
- Gatewayのsession changed/chat/sessionイベントペイロードは、`SessionEntry.origin` や `last*` ルートシャドウをエコーしなくなりました。クライアントは型付きの
  `channel`, `chatType`, `deliveryContext` を受け取ります。
- Heartbeat配信解決は、型付きSQLite
  `deliveryContext` を直接受け取れるようになり、Heartbeatランタイムは現在のルーティングについて互換性用の `session_entries` シャドウに依存する代わりに、エージェントごとのセッション配信行を渡します。
- Cron分離エージェントの配信ターゲット解決も、互換性エントリーペイロードへfallbackする前に、型付きのエージェントごとのセッション配信行から現在のルートをハイドレートします。
- サブエージェントannounce origin解決は、型付きのリクエスターセッション配信コンテキストを `loadRequesterSessionEntry` に通し、その行を互換性用の `last*`/`deliveryContext` シャドウより優先します。
- 受信セッションメタデータ更新は、まず型付きのエージェントごとの配信行に対してマージするようになりました。古い `SessionEntry` 配信フィールドは、型付きconversation行が存在しない場合のみfallbackです。
- 再起動/更新配信抽出では、`sessionKey` から解析されたトピック/スレッド断片よりも、型付きSQLite配信
  `threadId` が優先されるようになりました。解析はレガシーのスレッド形状キーに対するfallbackのみです。
- フックエージェントコンテキストのチャンネルIDは、型付きSQLite conversation IDを優先し、次に明示的なメッセージメタデータを使用するようになりました。`sessionKey` からプロバイダー/グループ/チャンネル断片を解析しなくなりました。
- Gateway `chat.send` の外部ルート継承は、`sessionKey` 断片からチャンネル/ダイレクト/グループスコープを推測する代わりに、型付きSQLiteセッションルーティングメタデータを読むようになりました。チャンネルスコープのセッションは、型付きセッションチャンネルとチャット種別が保存済み配信コンテキストと一致する場合にのみ継承します。共有mainセッションは、より厳格なCLI/クライアントメタデータなしルールを維持します。
- 再起動センチネルのウェイクと継続ルーティングは、Heartbeatウェイクまたはルーティング済みエージェントターン継続をキューに入れる前に、型付きSQLite配信/ルーティング行を読むようになりました。セッションエントリーJSONシャドウから配信コンテキストを再構築しなくなりました。
- Gateway `tools.effective` コンテキスト解決は、プロバイダー、アカウント、ターゲット、スレッド、返信モード入力について、型付きSQLite配信/ルーティング行を読むようになりました。これらのホットルーティングフィールドを、古くなった
  `session_entries.entry_json` originシャドウから復元しなくなりました。
- リアルタイム音声コンサルトルーティングは、型付きのエージェントごとのSQLiteセッション行から親/通話配信を解決するようになりました。埋め込みエージェントメッセージルートを選択するときに、互換性用の
  `SessionEntry.deliveryContext` シャドウへfallbackしなくなりました。
- ACP spawn Heartbeatリレーと親ストリームルーティングは、型付きSQLiteセッション行から親配信を読むようになりました。互換性セッションエントリーシャドウから親配信コンテキストを再構築しなくなりました。
- セッション配信ルート保持は、型付きチャットメタデータと永続化された配信列に従うようになりました。`sessionKey` からチャンネルヒント、ダイレクト/mainマーカー、またはスレッド形状を抽出しなくなりました。内部Webチャットルートは、そのセッションについてSQLiteに型付き/永続化済み配信IDがすでにある場合にのみ、外部ターゲットを継承します。
- 汎用セッション配信抽出は、厳密に一致する型付きSQLiteセッション配信行のみを読むようになりました。スレッド/トピックサフィックスを解析したり、スレッド形状キーからベースセッションキーへfallbackしたりしなくなりました。
- 返信ディスパッチ、再起動センチネル復旧、リアルタイム音声コンサルトルーティングは、スレッドルーティングに厳密に一致する型付きSQLiteセッション/conversation行を使用するようになりました。スレッド形状セッションキーを解析して、スレッドIDやベースセッション配信コンテキストを復元しなくなりました。
- 埋め込みPI履歴制限は、プロバイダー、チャット種別、ピアIDについて、型付きSQLiteセッションルーティング投影（`sessions` + プライマリ `conversations`）を使用するようになりました。`sessionKey` からプロバイダー、DM、グループ、スレッド形状を解析しなくなりました。
- Cronツール配信推論は、明示的な配信または現在の型付き配信コンテキストのみを使用するようになりました。`agentSessionKey` からチャンネル、ピア、アカウント、スレッドターゲットをデコードしなくなりました。
- ランタイムセッション行は、古い `lastProvider` ルート別名を持たなくなりました。ヘルパーとテストは、型付きの `lastChannel` と `deliveryContext` フィールドを使用します。古いルート別名や永続化された `origin` シャドウを変換すべき場所は、doctor移行のみです。
- トランスクリプトイベント、VFS行、ツール成果物行は、エージェントごとのデータベースへ書き込まれるようになりました。未出荷のグローバルトランスクリプトファイルマッピングテーブルはなくなりました。doctorは代わりに、レガシーソースパスを永続的な移行行に記録します。
- ランタイムトランスクリプト検索は、JSONLバイトオフセットをスキャンしたり、レガシートランスクリプトファイルをプローブしたりしなくなりました。Gatewayのchat/media/history経路はSQLiteからトランスクリプト行を読みます。セッションJSONLは、ランタイム状態やエクスポート形式ではなく、レガシーdoctor入力のみになりました。
- トランスクリプトの親およびブランチ関係は、パスのような `agent-db:...transcript_events...` ロケーター文字列ではなく、SQLiteトランスクリプトヘッダー内の構造化された
  `parentTranscriptScope: {agentId, sessionId}` メタデータを使用します。
- トランスクリプトマネージャー契約は、暗黙の永続化
  `create(cwd)` または `continueRecent(cwd)` コンストラクターを公開しなくなりました。永続化トランスクリプトマネージャーは、明示的な `{agentId, sessionId}` スコープで開かれます。スコープなしで残るのは、テストおよび純粋なトランスクリプト変換向けのインメモリマネージャーのみです。
- ランタイムトランスクリプトストアAPIは、ファイルシステムパスではなくSQLiteスコープを解決します。古い `resolve...ForPath` ヘルパーと未使用の `transcriptPath` 書き込みオプションは、ランタイム呼び出し元からなくなりました。
- ランタイムセッション解決は `{agentId, sessionId}` を使用するようになり、外部境界向けに
  `sqlite-transcript://<agent>/<session>` 文字列を導出してはなりません。レガシーの絶対JSONLパスはdoctor移行入力のみです。
- ネイティブフックリレーのダイレクトブリッジレコードは、リレーIDをキーとする型付き共有
  `native_hook_relay_bridges` 行に置かれるようになりました。ランタイムは、これらの短命なブリッジレコードについて `/tmp` JSONレジストリや不透明な汎用レコードを書き込まなくなりました。
- `runEmbeddedPiAgent(...)` は、トランスクリプトロケーターパラメーターを持たなくなりました。
  準備済みワーカー記述子もトランスクリプトロケータを省略します。ランタイムセッション
  状態とキュー済みの後続実行は、派生トランスクリプトハンドルの代わりに
  `{agentId, sessionId}` を保持します。
- 埋め込み Compaction は、`agentId` と `sessionId` から SQLite スコープを取得するようになりました。
  Compaction フック、コンテキストエンジン呼び出し、CLI 委譲、プロトコル応答は、
  派生 `sqlite-transcript://...` ハンドルを受け取ってはなりません。エクスポート/デバッグコードは
  行から明示的なユーザー成果物を実体化できますが、汎用のセッション JSONL エクスポートパスを提供したり、
  ファイル名をランタイム
  アイデンティティへ戻したりはしません。
- `/export-session` は SQLite からトランスクリプト行を読み取り、要求された
  スタンドアロン HTML ビューだけを書き込みます。埋め込みビューアは、それらの行からセッション JSONL を
  再構築したりダウンロードしたりしなくなりました。
- コンテキストエンジン委譲は、エージェントアイデンティティを復元するために
  トランスクリプトロケータを解析しなくなりました。準備済みランタイムコンテキストは、解決済みの `agentId` を
  組み込み Compaction アダプタへ渡します。
- トランスクリプト書き換えとライブツール結果の切り詰めは、`{agentId, sessionId}` によって
  トランスクリプト状態を読み取り永続化するようになり、トランスクリプト更新イベントペイロード用の
  一時ロケータを派生しません。
- トランスクリプト状態ヘルパーサーフェスには、ロケータベースの
  `readTranscriptState`、`replaceTranscriptStateEvents`、または
  `persistTranscriptStateMutation` バリアントがなくなりました。ランタイム呼び出し元は
  `{agentId, sessionId}` API を使用する必要があります。doctor インポートは明示的なファイル
  パスでレガシーファイルを読み取り、SQLite 行を書き込みます。ロケータ文字列は移行しません。
- ランタイムセッションマネージャー契約は、`open(locator)`、
  `forkFrom(locator)`、または `setTranscriptLocator(...)` を公開しなくなりました。
  永続化されたセッションマネージャーは `{agentId, sessionId}` のみで開きます。list/fork ヘルパーは
  トランスクリプトマネージャーファサードではなく、行指向のセッション API とチェックポイント API にあります。
- Gateway トランスクリプトリーダー API はスコープ優先です。
  `{agentId, sessionId}` を受け取り、誤ってランタイムアイデンティティになり得る
  位置引数のトランスクリプトロケータは受け付けません。アクティブなトランスクリプトロケータ解析はなくなりました。
  レガシーソースパスは doctor インポートコードだけが読み取ります。
- トランスクリプト更新イベントもスコープ優先です。`emitSessionTranscriptUpdate`
  は裸のロケータ文字列を受け付けなくなり、リスナーはハンドルを解析せずに
  `{agentId, sessionId}` でルーティングします。
- Gateway セッションメッセージブロードキャストは、トランスクリプトロケータではなく
  エージェント/セッションスコープからセッションキーを解決します。古いトランスクリプトロケータからセッション
  キーへのリゾルバ/キャッシュはなくなりました。
- Gateway セッション履歴 SSE は、エージェント/セッションスコープでライブ更新をフィルタリングします。ストリームが更新を受け取るべきかを判断するために、
  トランスクリプトロケータ候補、realpath、またはファイル形状の
  トランスクリプトアイデンティティを正規化しなくなりました。
- セッションライフサイクルフックは、`session_end` でトランスクリプトロケータを
  派生または公開しなくなりました。フック利用者は `sessionId`、`sessionKey`、次セッション
  ID、エージェントコンテキストを受け取ります。トランスクリプトファイルはライフサイクル
  契約の一部ではありません。
- リセットフックもトランスクリプトロケータを派生または公開しなくなりました。
  `before_reset` ペイロードは復元された SQLite メッセージとリセット
  理由を保持し、セッションアイデンティティはフックコンテキストに残ります。
- エージェントハーネスリセットはトランスクリプトロケータを受け付けなくなりました。リセットディスパッチは、
  `sessionId`/`sessionKey` と理由によってスコープ設定されます。
- エージェント拡張セッション型は `transcriptLocator` を公開しなくなりました。拡張は
  ファイル形状のトランスクリプトアイデンティティを参照するのではなく、セッションコンテキストとランタイム API を
  使用する必要があります。
- Plugin Compaction フックはトランスクリプトロケータを公開しなくなりました。フックコンテキストは
  すでにセッションアイデンティティを保持しており、トランスクリプト読み取りはファイル形状ハンドルではなく、
  SQLite のスコープ対応 API を通す必要があります。
- `before_agent_finalize` フックは、ネイティブフックリレーペイロードを含め、
  `transcriptPath` を公開しなくなりました。ファイナライズフックはセッションコンテキストのみを使用します。
- Gateway リセット応答は、返されるエントリ上でトランスクリプトロケータを
  合成しなくなりました。リセットは SQLite トランスクリプト行を作成し、クリーンな
  セッションエントリを返し、トランスクリプトアクセスはスコープ対応リーダーに委ねます。
- 埋め込み実行と Compaction 結果は、セッション会計用のトランスクリプトロケータを
  表面化しなくなりました。自動 Compaction は、アクティブな `sessionId`、
  Compaction カウンター、トークンメタデータだけを更新します。
- 埋め込み試行結果は `transcriptLocatorUsed` を返さなくなり、
  コンテキストエンジンの `compact()` 結果もトランスクリプトロケータを返さなくなりました。
  ランタイム再試行ループは後継の `sessionId` のみを受け付けます。
- 配信ミラーのトランスクリプト追記結果は、トランスクリプトロケータを返さなくなりました。
  呼び出し元は追記された `messageId` を受け取ります。トランスクリプト更新シグナルは
  SQLite スコープを使用します。
- 親セッションの fork ヘルパーは、fork された `sessionId` のみを返します。サブエージェント
  準備は子エージェント/セッションスコープをエンジンへ渡します。
- CLI ランナーパラメータと履歴再シードは、トランスクリプトロケータを受け付けなくなりました。
  CLI 履歴読み取りは、`{agentId,
sessionId}` とセッションキーコンテキストから SQLite トランスクリプトスコープを解決します。
- CLI と埋め込みランナーのテストフィクスチャは、アクティブセッションを `*.jsonl` ファイルであるかのように扱ったり、
  `sqlite-transcript://...` 文字列をランタイムパラメータへ渡したりするのではなく、
  セッション ID で SQLite トランスクリプト行をシードして読み取るようになりました。
- セッションツール結果ガードイベントは、インメモリマネージャーに派生ロケータがない場合でも、
  既知のセッションスコープから発行されます。そのテストは、アクティブな
  `/tmp/*.jsonl` トランスクリプトファイルを偽装しなくなりました。
- BTW と Compaction チェックポイントヘルパーは、SQLite スコープで
  トランスクリプト行を読み取り fork するようになりました。チェックポイントメタデータは、セッション ID とリーフ/エントリ ID
  のみを保存します。派生ロケータはチェックポイントペイロードへ書き込まれなくなりました。
- Gateway トランスクリプトキー検索は、プロトコル境界で SQLite トランスクリプトスコープを使用し、
  トランスクリプトファイル名の realpath や stat を行わなくなりました。
- 自動 Compaction のトランスクリプトローテーションは、SQLite トランスクリプトストアを通じて
  後継トランスクリプト行を直接書き込みます。セッション行は、永続的な JSONL パスや永続化ロケータではなく、
  後継セッションアイデンティティだけを保持します。
- 埋め込みコンテキストエンジン Compaction は、SQLite 名付きのトランスクリプトローテーション
  ヘルパーを使用します。ローテーションテストは JSONL 後継パスを構築したり、
  アクティブセッションをファイルとしてモデル化したりしなくなりました。
- 管理対象の送信画像保持は、ファイルシステムの stat 呼び出しではなく、
  SQLite トランスクリプト統計からトランスクリプトメッセージキャッシュのキーを設定します。
- ランタイムセッションロックと、スタンドアロンのレガシー `.jsonl.lock` doctor
  レーンは削除されました。
- Microsoft Teams ランタイムバレルと公開 Plugin SDK は、古いファイルロックヘルパーを
  再エクスポートしなくなりました。永続的な Plugin 状態パスは SQLite バックです。
- セッション年齢/件数の剪定と明示的なセッションクリーンアップは削除されました。
  レガシーインポートは doctor が所有します。古いセッションは明示的にリセットまたは削除されます。
- doctor 整合性チェックは、レガシー JSONL ファイルを SQLite セッション行の有効なアクティブ
  トランスクリプトとして数えなくなりました。アクティブトランスクリプトの健全性は SQLite のみです。
  レガシー JSONL ファイルは、移行/孤立クリーンアップ入力として報告されます。
- doctor は `agents/<agent>/sessions/` を必須ランタイム
  状態として扱わなくなりました。そのディレクトリは、すでに存在する場合に限り、レガシーインポート
  または孤立クリーンアップ入力としてスキャンします。
- Gateway `sessions.resolve`、セッション patch/reset/compact パス、サブエージェント
  生成、高速中止、ACP メタデータ、Heartbeat 分離セッション、TUI
  パッチ適用は、通常のランタイム作業の副作用としてレガシーセッションキーを移行または剪定しなくなりました。
- CLI コマンドのセッション解決は、`storePath` ではなく所有する `agentId` を返すようになり、
  通常の `--to` または `--session-id` 解決中にレガシーメインセッション行をコピーしなくなりました。
  レガシーメイン行の正規化は doctor のみが担当します。
- ランタイムサブエージェント深度解決は、`sessions.json` や JSON5
  セッションストアを読み取らなくなりました。エージェント ID ごとに SQLite `session_entries` を読み取り、
  レガシーの深度/セッションメタデータは doctor インポートパスからのみ入ることができます。
- 認証プロファイルのセッション上書きは、ファイル形状のセッションストアランタイムを遅延ロードするのではなく、
  直接の `{agentId, sessionKey}` 行 upsert を通じて永続化されます。
- 自動返信の詳細出力ゲートとセッション更新ヘルパーは、セッションアイデンティティで
  SQLite セッション行を読み取り/upsert するようになり、永続化された行状態に触れる前に
  レガシーストアパスを必要としなくなりました。
- コマンド実行セッションメタデータヘルパーは、エントリ指向の名前とモジュール
  パスを使用するようになりました。古い `session-store` コマンドヘルパーサーフェスは削除されました。
- ブートストラップヘッダーシードと手動 Compaction 境界の強化は、
  SQLite トランスクリプト行を直接変更するようになりました。ランタイム呼び出し元は、書き込み可能な
  `.jsonl` パスではなくセッションアイデンティティを渡します。
- サイレントセッションローテーションの再生は、SQLite トランスクリプト行から
  `{agentId, sessionId}` によって最近のユーザー/アシスタントターンをコピーします。ソースまたはターゲットの
  トランスクリプトロケータは受け付けなくなりました。
- 新規ランタイムセッション行は、トランスクリプトロケータを保存しなくなりました。呼び出し元は
  `{agentId, sessionId}` を直接使用します。エクスポート/デバッグコマンドは、行を実体化するときに
  出力ファイル名を選択できます。
- 新しい永続化トランスクリプトセッションの開始は、常にスコープで SQLite 行を開くようになりました。
  セッションマネージャーは、新しいセッションのアイデンティティとして、以前のファイル時代のトランスクリプト
  パスやロケータを再利用しなくなりました。
- 永続化トランスクリプトセッションは、明示的な
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API を使用します。古い
  静的 `SessionManager.create/openForSession/list/forkFromSession` ファサードは
  なくなったため、テストとランタイムコードが誤ってファイル時代のセッション
  検出を再作成することはありません。
- Plugin ランタイムは `api.runtime.agent.session.resolveTranscriptLocatorPath` を公開しなくなりました。
  Plugin コードは SQLite 行ヘルパーとスコープ値を使用します。
- 公開 `session-store-runtime` SDK サーフェスは、セッション行
  とトランスクリプト行ヘルパーのみをエクスポートするようになりました。焦点を絞った SQLite スキーマ/パス/トランザクションヘルパーは
  `sqlite-runtime` にあり、生の open/close/reset ヘルパーはファーストパーティテスト専用のままです。
- レガシー `.jsonl` 軌跡/チェックポイントファイル名分類器は、doctor レガシーセッションファイル
  モジュールに移動しました。コアセッション検証は、通常の SQLite セッション ID を決定するために
  ファイル成果物ヘルパーをインポートしなくなりました。
- Active Memory のブロッキングサブエージェント実行は、Plugin 状態の下に
  一時または永続化された `session.jsonl` ファイルを作成するのではなく、
  SQLite トランスクリプト行を使用します。古い `transcriptDir` オプションは削除されました。
- 一回限りのスラッグ生成と Crestodian プランナー実行は、一時的な
  `session.jsonl` ファイルを作成するのではなく、SQLite トランスクリプト行を使用します。
- `llm-task` ヘルパー実行と非表示コミットメント抽出も SQLite
  トランスクリプト行を使用するため、これらのモデル専用ヘルパーセッションは
  一時的な JSON/JSONL トランスクリプトファイルを作成しなくなりました。
- `TranscriptSessionManager` は、現在は開かれた SQLite トランスクリプトスコープのみです。
  ランタイムコードは `openTranscriptSessionManagerForSession({agentId,
sessionId})` でそれを開きます。create、branch、continue、list、fork フローは、
  静的マネージャーファサードではなく、それぞれを所有する SQLite 行ヘルパーにあります。
  doctor/import/debug コードは、ランタイムセッションマネージャーの外側で
  明示的なレガシーソースファイルを扱います。
- 古い `SessionManager.newSession()` と
  `SessionManager.createBranchedSession()` ファサードメソッドは削除されました。新しい
  セッションとトランスクリプト子孫は、開かれたマネージャーを別の
  永続化セッションへ変更するのではなく、それらを所有する SQLite
  ワークフローによって作成されます。
- 親トランスクリプトの fork 判断と fork 作成は、`storePath` または `sessionsDir` を
  受け付けなくなりました。保持されたファイルシステムパスメタデータではなく、
  `{agentId, sessionId}` SQLite トランスクリプトスコープを使用します。
- メモリホストは、no-op のセッションディレクトリトランスクリプト
  分類ヘルパーをエクスポートしなくなりました。トランスクリプトフィルタリングは、
  エントリ構築中に SQLite 行メタデータから派生するようになりました。
- メモリホストと QMD セッションエクスポートテストは、SQLite トランスクリプトスコープを使用します。古い
  `agents/<agentId>/sessions/*.jsonl` パスは、doctor/import/export 互換性を意図的に証明するテストでのみ
  カバーされます。
- QA ラボの生セッション検査は、Gateway 経由で `sessions.list` を使用するようになりました
  `agents/qa/sessions/sessions.json` を読む代わりに行います。MSteams フィードバックは、JSONL パスを捏造せず SQLite トランスクリプトへ直接追記します。
- 共有インバウンドチャネルのターンは、従来の `storePath` ではなく `{agentId, sessionKey}` を運ぶようになりました。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、Twitch、QQBot の記録パスは、updated-at メタデータを読み、SQLite アイデンティティを通じてインバウンドセッション行を記録するようになりました。
- トランスクリプトロケータの永続化はアクティブセッション行から削除されました。`resolveSessionTranscriptTarget` は `agentId`、`sessionId`、任意のトピックメタデータを返します。従来のトランスクリプトファイル名をインポートするコードは doctor のみです。
- ランタイムトランスクリプトヘッダーは SQLite バージョン `1` から始まります。古い JSONL V1/V2/V3 形状のアップグレードは doctor インポートのみにあり、インポートされたヘッダーは行が保存される前に現在の SQLite トランスクリプトバージョンへ正規化されます。
- database-first ガードは、`SessionManager.listAll` と `SessionManager.forkFromSession` を禁止するようになりました。セッション一覧と fork/restore ワークフローは、行単位およびスコープ付きの SQLite API に留める必要があります。
- このガードは、doctor/import コードの外で従来のトランスクリプト JSONL 解析やアクティブブランチ修復ヘルパー名も禁止するため、ランタイムが2つ目の従来トランスクリプト移行パスを増やせなくなりました。
- 埋め込み PI 実行は、入力されたトランスクリプトハンドルを拒否します。worker 起動前と、試行がトランスクリプト状態に触れる前に、SQLite の `{agentId, sessionId}` アイデンティティを使用します。古い `/tmp/*.jsonl` 入力でランタイム書き込み先を選択することはできません。
- キャッシュトレース、Anthropic ペイロード、生ストリーム、診断タイムラインのレコードは、型付き SQLite `diagnostic_events` 行へ書き込まれるようになりました。Gateway 安定性バンドルは、型付き SQLite `diagnostic_stability_bundles` 行へ書き込まれるようになりました。古い `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、`OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`、`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL オーバーライドパスは削除され、通常の安定性キャプチャは `logs/stability/*.json` ファイルを書き込まなくなりました。
- Cron 永続化は、保存ごとにジョブテーブル全体を削除して再挿入するのではなく、SQLite `cron_jobs` 行を照合するようになりました。Plugin ターゲットの書き戻しは一致する cron 行を直接更新し、ランタイム cron 状態を同じ状態データベーストランザクション内に保持します。
- Cron ランタイム呼び出し元は、安定した SQLite cron ストアキーを使用するようになりました。従来の `cron.store` パスは doctor インポート入力のみです。本番 Gateway、タスク保守、ステータス、実行ログ、Telegram ターゲット書き戻しパスは `resolveCronStoreKey` を使用し、キーのパス正規化を行わなくなりました。Cron ステータスは、古いファイル形状の `storePath` フィールドではなく `storeKey` を報告するようになりました。
- Cron ランタイムの読み込みとスケジューリングは、`jobId`、`schedule.cron`、数値の `atMs`、文字列ブール値、欠落した `sessionTarget` など、従来の永続化ジョブ形状を正規化しなくなりました。SQLite に行が挿入される前の修復は、doctor のレガシーインポートが担います。
- ACP spawn は、トランスクリプト JSONL ファイルパスを解決または永続化しなくなりました。spawn と thread-bind のセットアップは SQLite セッション行を直接永続化し、保持されるトランスクリプトアイデンティティとしてセッション ID を維持します。
- ACP セッションメタデータ API は、`agentId` によって SQLite 行を読み取り、一覧し、upsert するようになり、ACP セッションエントリ契約の一部として `storePath` を公開しなくなりました。
- セッション使用量の集計と Gateway 使用量集計は、`{agentId, sessionId}` のみでトランスクリプトを解決するようになりました。コスト/使用量キャッシュと検出済みセッション概要は、トランスクリプトロケータ文字列を合成または返さなくなりました。
- Gateway チャット追記、abort-partial 永続化、`/sessions.send`、webchat メディアトランスクリプト書き込みは、SQLite トランスクリプトスコープを通じて直接追記します。Gateway トランスクリプト注入ヘルパーは `transcriptLocator` パラメータを受け付けなくなりました。
- SQLite トランスクリプト検出は、トランスクリプトスコープと統計のみを一覧するようになりました: `{agentId, sessionId, updatedAt, eventCount}`。不要になった `listSqliteSessionTranscriptLocators` 互換ヘルパーと行単位の `locator` フィールドは削除されました。
- トランスクリプト修復ランタイムは、`repairTranscriptSessionStateIfNeeded({agentId, sessionId})` のみを公開するようになりました。古いロケータベースの修復ヘルパーは削除されました。doctor/debug コードは明示的なソースファイルパスを読み、ロケータ文字列を移行することはありません。
- ACP リプレイ台帳ランタイムは、`acp/event-ledger.json` ではなく共有 SQLite 状態データベースにセッション単位のリプレイ行を保存するようになりました。doctor は従来のファイルをインポートして削除します。
- Gateway トランスクリプトリーダーヘルパーは、古い `session-utils.fs` モジュール名ではなく `src/gateway/session-transcript-readers.ts` に配置されるようになりました。フォールバック再試行履歴チェックは、古いファイルヘルパーサーフェスではなく SQLite トランスクリプト内容に基づく名前になりました。
- Gateway injected-chat と compaction ヘルパーは、値をトランスクリプトパスやソースファイルと呼ぶのではなく、内部ヘルパー API を通じて SQLite トランスクリプトスコープを渡すようになりました。
- ブートストラップ継続検出は、`hasCompletedBootstrapTranscriptTurn` を通じて SQLite トランスクリプト行をチェックするようになり、ファイル形状のヘルパー名を公開しなくなりました。
- embedded-runner テストは SQLite トランスクリプトアイデンティティを使用するようになり、新しいトランスクリプトマネージャーを開くには常に明示的な `sessionId` が必要です。
- メモリインデックスヘルパーは、端から端まで SQLite トランスクリプト用語を使用するようになりました。ホストは `listSessionTranscriptScopesForAgent` と `sessionTranscriptKeyForScope` をエクスポートし、対象同期キューは `sessionTranscripts`、公開セッション検索ヒットは不透明な `transcript:<agent>:<session>` パス、内部 DB ソースキーは偽のファイルパスではなく `source_kind='sessions'` 配下の `session:<session>` を公開します。
- 汎用 Plugin SDK の永続 dedupe ヘルパーは、ファイル形状のオプションを公開しなくなりました。呼び出し元は SQLite スコープキーを提供し、永続 dedupe 行は共有 Plugin 状態に保存されます。
- Microsoft Teams SSO トークンは、ロックされた JSON ファイルから SQLite Plugin 状態へ移動しました。doctor は `msteams-sso-tokens.json` をインポートし、ペイロードから正規 SSO トークンキーを再構築して、ソースファイルを削除します。委任 OAuth トークンは、既存のプライベート認証情報ファイル境界に留まります。
- Matrix 同期キャッシュ状態は、`bot-storage.json` から SQLite Plugin 状態へ移動しました。doctor は従来の生またはラップ済み同期ペイロードをインポートし、ソースファイルを削除します。アクティブな Matrix クライアントと QA Matrix クライアントは、偽の `sync-store.json` または `bot-storage.json` パスではなく、SQLite 同期ストアルートディレクトリを渡します。
- Matrix 従来暗号移行ステータスは、`legacy-crypto-migration.json` から SQLite Plugin 状態へ移動しました。doctor は古いステータスファイルをインポートします。Matrix SDK IndexedDB スナップショットは、`crypto-idb-snapshot.json` から SQLite Plugin blob へ移動しました。Matrix リカバリキーと認証情報は SQLite Plugin 状態行です。古い JSON ファイルは doctor 移行入力のみです。
- Memory Wiki アクティビティログは、`.openclaw-wiki/log.jsonl` ではなく SQLite Plugin 状態を使用するようになりました。Memory Wiki 移行プロバイダーは古い JSONL ログをインポートします。wiki Markdown とユーザー vault コンテンツは、workspace コンテンツとしてファイルベースのままです。
- Memory Wiki は、`.openclaw-wiki/state.json` や未使用の `.openclaw-wiki/locks` ディレクトリを作成しなくなりました。古い vault にそれらが残っている場合、移行プロバイダーが廃止済み Plugin メタデータファイルを削除します。
- Crestodian 監査エントリは、`audit/crestodian.jsonl` ではなく core SQLite Plugin 状態を使用するようになりました。doctor は従来の JSONL 監査ログをインポートし、インポート成功後に削除します。
- Config 書き込み/監視監査エントリは、`logs/config-audit.jsonl` ではなく core SQLite Plugin 状態を使用するようになりました。doctor は従来の JSONL 監査ログをインポートし、インポート成功後に削除します。
- macOS companion は、`openclaw.json` の編集中にアプリローカルの `logs/config-audit.jsonl` や `logs/config-health.json` サイドカーを書き込まなくなりました。config ファイルはファイルベースのままで、リカバリスナップショットは config ファイルの隣に保持され、永続的な config 監査/health 状態は Gateway SQLite ストアに属します。
- Crestodian rescue の保留中承認は、`crestodian/rescue-pending/*.json` ではなく core SQLite Plugin 状態を使用するようになりました。doctor は従来の保留中承認ファイルをインポートし、インポート成功後に削除します。
- Phone Control の一時 arm 状態は、`plugins/phone-control/armed.json` ではなく SQLite Plugin 状態を使用するようになりました。doctor は従来の arm 状態ファイルを `phone-control/arm-state` 名前空間へインポートし、ファイルを削除します。
- doctor は JSONL トランスクリプトをその場で修復したり、バックアップ JSONL ファイルを作成したりしなくなりました。アクティブブランチを SQLite にインポートし、従来のソースを削除します。
- session-memory hook のトランスクリプト検索は、`{agentId, sessionId}` スコープのみの SQLite 読み取りを使用します。そのヘルパーは、トランスクリプトロケータ、従来のファイル読み取り、ファイル再書き込みオプションを受け付けたり導出したりしなくなりました。
- Codex app-server 会話バインディングは、OpenClaw セッションキーまたは明示的な `{agentId, sessionId}` スコープで SQLite Plugin 状態をキーにするようになりました。トランスクリプトパスのフォールバックバインディングを保持してはいけません。
- Codex app-server mirrored-history 読み取りは SQLite トランスクリプトスコープのみを使用します。トランスクリプトファイルパスからアイデンティティを復元してはいけません。
- role-ordering と Compaction リセットパスは、古いトランスクリプトファイルを unlink しなくなりました。リセットは SQLite セッション行とトランスクリプトアイデンティティのみをローテートします。
- Gateway リセットとチェックポイントレスポンスは、クリーンなセッション行とセッション ID を返します。クライアント向けに SQLite トランスクリプトロケータを合成しなくなりました。
- Memory-core dreaming は、欠落した JSONL ファイルを調べてセッション行を prune しなくなりました。サブエージェントのクリーンアップは、ファイルシステム存在チェックではなくセッションランタイム API を通じて行われます。そのトランスクリプト取り込みテストは、`agents/<id>/sessions` fixture やロケータプレースホルダーを作成するのではなく、SQLite 行を直接 seed します。
- メモリトランスクリプトインデックスは、citation/read ヘルパー向けの仮想検索ヒットパスとして `transcript:<agentId>:<sessionId>` を公開する場合があります。永続インデックスソースはリレーショナルです（`source_kind='sessions'`、`source_key='session:<sessionId>'`、`session_id=<sessionId>`）。そのため、この値はランタイムトランスクリプトロケータではなく、ファイルシステムパスでもなく、セッションランタイム API に渡し戻してはなりません。
- Gateway doctor メモリステータスは、`memory/.dreams/*.json` ではなく SQLite Plugin 状態行から短期 recall と phase-signal count を読み取ります。CLI と doctor の出力は、そのストレージをパスではなく SQLite ストアとしてラベル付けするようになりました。
- Memory-core ランタイム、CLI ステータス、Gateway doctor メソッド、Plugin SDK facade は、従来の `.dreams/session-corpus` ファイルを監査またはアーカイブしなくなりました。これらのファイルは移行入力のみです。doctor はそれらを SQLite にインポートし、検証後にソースを削除します。アクティブなセッション取り込み証拠行は、仮想 SQLite パス `memory/session-ingestion/<day>.txt` を使用するようになりました。ランタイムが `.dreams/session-corpus` に状態を書き込んだり、そこから状態を導出したりすることはありません。
- Memory-core 公開アーティファクトは、SQLite ホストイベントを仮想 JSON アーティファクト `memory/events/memory-host-events.json` として公開します。従来の `.dreams/events.jsonl` ソースパスを再利用しなくなりました。
- sandbox container/browser レジストリは、型付きのセッション、イメージ、タイムスタンプ、backend/config、browser port 列を持つ共有 `sandbox_registry_entries` SQLite テーブルを使用するようになりました。doctor は従来のモノリシックおよび shard された JSON レジストリファイルをインポートし、成功したソースを削除します。ランタイム読み取りは型付き行列を信頼できる情報源として使用します。`entry_json` は replay/debug コピーのみです。
- commitments は、ストア全体の JSON blob ではなく、型付き共有 `commitments` テーブルを使用するようになりました。スナップショット保存は commitment ID で upsert し、テーブルをクリアして再挿入するのではなく、欠落した行のみを削除します。ランタイムは型付きの scope、delivery-window、status、attempt、text 列から commitments を読み込みます。`record_json` は replay/debug コピーのみです。doctor は従来の `commitments.json` をインポートし、インポート成功後に削除します。
- Cron ジョブ定義、スケジュール状態、実行履歴には、ランタイム JSON writer または reader がなくなりました。ランタイムは、型付きスケジュールを持つ `cron_jobs` 行を使用します。
  payload、delivery、failure-alert、session、status、runtime-state の各列に加え、status、診断サマリー、delivery の status/error、session/run、model、token 合計用の型付き
  `cron_run_logs` メタデータ。`job_json` はリプレイ/デバッグ用コピーにすぎません。`state_json` は、まだホットクエリ用フィールドを持たないネストされた
  ランタイム診断を保持し、一方でランタイムは型付き列からホット状態フィールドを再ハイドレートします。Doctor は
  レガシーの `jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルをインポートし、インポート済みの
  ソースを削除します。Plugin ターゲットの書き戻しは、cron ストア全体を読み込んで置き換えるのではなく、一致する `cron_jobs`
  行を更新します。
- Gateway 起動は、ランタイム
  プロジェクション内のレガシーな `notify: true` マーカーを無視します。Doctor は、`cron.webhook` が有効な場合はそれらを明示的な SQLite delivery に変換し、
  未設定の場合は機能しないマーカーを削除し、構成された Webhook が無効な場合は
  警告付きで保持します。
- アウトバウンドおよび session delivery キューは、キューの status、entry kind、
  session key、channel、target、account id、retry count、last attempt/error、
  recovery state、platform-send マーカーを、共有
  `delivery_queue_entries` テーブルの型付き列として保存するようになりました。ランタイム復旧は
  それらのホットフィールドを型付き列から読み取り、retry/recovery の変更は
  replay JSON を書き換えずにそれらの列を直接更新します。完全な JSON payload は、メッセージ本文とその他のコールドリプレイデータの
  リプレイ/デバッグ blob としてのみ残ります。
- 管理対象の送信画像レコードは、型付き共有
  `managed_outgoing_image_records` 行を使用するようになり、media bytes は引き続き
  `media_blobs` に保存されます。JSON レコードはリプレイ/デバッグ用コピーとしてのみ残ります。
- Discord の model-picker 設定、command-deploy ハッシュ、thread bindings は
  共有 SQLite プラグイン状態を使用するようになりました。それらのレガシー JSON インポート計画は、コア移行コードではなく
  Discord プラグインの setup/doctor migration サーフェスにあります。
- プラグインのレガシーインポート検出器は、
  `doctor-legacy-state.ts` や `doctor-state-imports.ts` などの doctor 名付きモジュールを使用します。通常の channel runtime
  モジュールはレガシー JSON 検出器を import してはいけません。
- BlueBubbles の catchup cursor と inbound dedupe マーカーは、共有 SQLite
  プラグイン状態を使用するようになりました。それらのレガシー JSON インポート計画は、コア移行コードではなく BlueBubbles プラグインの
  setup/doctor migration サーフェスにあります。
- Telegram update offset、sticker cache 行、sent-message cache 行、
  topic-name cache 行、thread bindings は、共有 SQLite プラグイン
  状態を使用するようになりました。それらのレガシー JSON インポート計画は、コア移行コードではなく Telegram プラグインの
  setup/doctor migration サーフェスにあります。
- iMessage catchup cursor、reply short-id mapping、sent-echo dedupe 行は
  共有 SQLite プラグイン状態を使用するようになりました。古い `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl`、`imessage/sent-echoes.jsonl` ファイルは
  doctor 入力専用です。
- Feishu message dedupe 行は、
  `feishu/dedup/*.json` ファイルの代わりに共有 SQLite プラグイン状態を使用するようになりました。そのレガシー JSON インポート計画は、コア移行コードではなく Feishu
  プラグインの setup/doctor migration サーフェスにあります。
- Microsoft Teams の conversations、polls、pending upload buffers、feedback
  learnings は、共有 SQLite プラグイン state/blob テーブルを使用するようになりました。pending upload
  パスは `plugin_blob_entries` を使用するため、media buffers は base64 JSON ではなく SQLite BLOB として保存されます。ランタイムヘルパー名は
  `*-fs` ファイルストア命名ではなく SQLite/state 命名を使用するようになり、古い `storePath` shim は
  これらのストアからなくなりました。そのレガシー JSON インポート計画は Microsoft Teams
  プラグインの setup/doctor migration サーフェスにあります。
- Zalo hosted outbound media は、
  `openclaw-zalo-outbound-media` JSON/bin 一時 sidecar の代わりに共有 SQLite `plugin_blob_entries` を使用するようになりました。
- Diffs viewer HTML とメタデータは、`meta.json`/`viewer.html` 一時ファイルの代わりに
  共有 SQLite `plugin_blob_entries` を使用するようになりました。レンダリング済みの PNG/PDF 出力は、channel delivery がまだファイルパスを必要とするため
  一時 materialization のままです。
- Canvas 管理ドキュメントは、デフォルトの `state/canvas/documents` ディレクトリの代わりに
  共有 SQLite `plugin_blob_entries` を使用するようになりました。Canvas host はそれらの
  blob を直接提供します。ローカルファイルは、明示的な `host.root`
  operator content または下流の media reader がパスを要求する場合の一時 materialization のためにのみ作成されます。
- File Transfer audit decisions は、無制限の `audit/file-transfer.jsonl` ランタイムログの代わりに
  共有 SQLite `plugin_state_entries` を使用するようになりました。Doctor は
  レガシー JSONL audit ファイルをプラグイン状態にインポートし、クリーンなインポート後にソースを削除します。
- ACPX process lease と gateway instance identity は、共有 SQLite プラグイン
  状態を使用するようになりました。Doctor はレガシーの `gateway-instance-id` ファイルをプラグイン状態にインポートし、
  ソースを削除します。
- ACPX 生成 wrapper scripts と分離された Codex home は、OpenClaw temp root 配下の一時
  materialization であり、永続的な OpenClaw 状態ではありません。
  永続的な ACPX ランタイムレコードは SQLite lease と gateway-instance 行です。
  もうランタイム状態がそこへ書き込まれないため、古い ACPX `stateDir` config サーフェスは削除されました。
- Gateway media attachments は、正規の byte store として共有 `media_blobs` SQLite テーブルを使用するようになりました。
  channel と sandbox
  compatibility サーフェスへ返されるローカルパスは、database row の一時 materialization であり、永続的な media store ではありません。ランタイム media allowlists には、レガシーの
  `$OPENCLAW_STATE_DIR/media` や config-dir `media` roots は含まれなくなりました。それらのディレクトリは
  doctor インポートソース専用です。
- Shell completion は `$OPENCLAW_STATE_DIR/completions/*` cache
  files を書き込まなくなりました。Install、doctor、update、release smoke パスは、永続的な completion cache
  files の代わりに、生成された completion output または profile sourcing を使用します。
- Gateway skill-upload staging は、共有 `skill_uploads` 行を使用するようになりました。Upload
  metadata、idempotency keys、archive bytes は SQLite にあり、installer は
  install 実行中にのみ一時的に materialized archive path を受け取ります。
- Subagent inline attachments は、workspace
  `.openclaw/attachments/*` 配下に materialize されなくなりました。spawn path は SQLite VFS seed entries を準備し、
  inline runs はそれらの entries を per-agent runtime scratch namespace に seed し、
  disk-backed tools は attachment paths 用にその SQLite scratch を overlay します。古い subagent-run attachment-dir registry columns と cleanup hooks は削除されました。
- CLI image hydration は、安定した `openclaw-cli-images` cache
  files を維持しなくなりました。External CLI backends は引き続き file paths を受け取りますが、それらの paths は
  cleanup 付きの per-run temp materializations です。
- Cache-trace diagnostics、Anthropic payload diagnostics、raw model stream
  diagnostics、diagnostics timeline events、Gateway stability bundles は、
  `logs/*.jsonl` や
  `logs/stability/*.json` ファイルの代わりに SQLite 行を書き込むようになりました。
  Runtime path override flags と env vars は削除されました。export/debug
  commands は database rows から files を明示的に materialize できます。
- macOS companion には、rolling `diagnostics.jsonl` writer がなくなりました。App
  logs は unified logging に送られ、永続的な Gateway diagnostics は SQLite-backed のままです。
- macOS port-guardian record list は、Application Support JSON file
  や opaque singleton blob の代わりに、型付き共有 SQLite
  `macos_port_guardian_records` 行を使用するようになりました。
- Gateway singleton locks は、temp-dir lock files の代わりに、
  `gateway_locks` scope 配下の型付き共有 SQLite `state_leases` 行を使用するようになりました。Fly と OAuth
  troubleshooting docs は、古い file-lock cleanup ではなく SQLite lease/auth refresh lock を指すようになりました。
- Gateway restart sentinel state は、`restart-sentinel.json` の代わりに型付き共有 SQLite
  `gateway_restart_sentinel` 行を使用するようになりました。ランタイムは
  sentinel kind、status、routing、message、continuation、stats を
  型付き列から読み取ります。`payload_json` はリプレイ/デバッグ用コピーにすぎません。ランタイムコードは
  SQLite 行を直接クリアし、file cleanup plumbing を保持しなくなりました。
- Gateway restart intent と supervisor handoff state は、
  `gateway-restart-intent.json` と
  `gateway-supervisor-restart-handoff.json` sidecar の代わりに、型付き共有
  SQLite `gateway_restart_intent` および `gateway_restart_handoff` 行を使用するようになりました。
- Gateway singleton coordination は、
  `gateway.<hash>.lock` ファイルを書き込む代わりに、`gateway_locks` 配下の型付き `state_leases` 行を使用するようになりました。lease row は
  lock owner、expiry、heartbeat、debug payload を所有します。SQLite は
  atomic acquire/release boundary を所有します。廃止された file-lock directory option は
  なくなり、tests は SQLite row identity を直接使用します。
- `cron/runs/*.jsonl`
  ファイルをスキャンしていた古い未参照の cron usage-report helper は削除されました。Cron run history reports は、型付き
  `cron_run_logs` SQLite 行を読み取るべきです。
- Main-session restart recovery は、`agents/*/sessions`
  ディレクトリをスキャンする代わりに、SQLite `agent_databases` registry を通じて candidate agents を検出するようになりました。
- Gemini session-corruption recovery は、SQLite session row のみを削除するようになりました。
  レガシー `storePath` gate は不要になり、派生した
  transcript JSONL path の unlink も試みなくなりました。
- Path override handling は、literal `undefined`/`null` environment
  values を未設定として扱うようになり、tests や shell handoffs 中に誤って repo-root `undefined/state/*.sqlite`
  databases が作成されるのを防ぎます。
- Config health fingerprints は、`logs/config-health.json` の代わりに型付き共有 SQLite `config_health_entries`
  行を使用するようになり、通常の config file を唯一の非 credential configuration document として維持します。macOS companion は process-local health state のみを保持し、
  古い JSON sidecar を再作成しません。
- Auth profile runtime は credential JSON files をインポートまたは書き込みしなくなりました。
  正規の credential store は SQLite です。`auth-profiles.json`、per-agent
  `auth.json`、shared `credentials/oauth.json` は doctor migration inputs であり、
  インポート後に削除されます。
- Auth profile save/state tests は、型付き SQLite auth tables を直接
  assert するようになり、レガシー auth-profile filenames は doctor migration inputs にのみ使用します。
- `openclaw secrets apply` は config file、env file、SQLite
  auth-profile store のみを scrub します。廃止された per-agent `auth.json` を編集する
  compatibility logic は保持しなくなりました。doctor がそのファイルの import と deletion を所有します。
- Hermes secret migration plans と applies は、インポートされた API-key profiles を SQLite auth-profile store へ直接
  取り込みます。中間 target として
  `auth-profiles.json` を書き込みまたは検証しなくなりました。
- User-facing auth docs は、
  `auth-profiles.json` を inspect または copy するようユーザーに伝える代わりに、
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` を説明するようになりました。レガシー OAuth/auth JSON
  names は doctor-import inputs としてのみ文書化されたままです。
- Core state-path helpers は、廃止された `credentials/oauth.json`
  ファイルを公開しなくなりました。レガシーファイル名は doctor auth import path に限定されます。
- Install、security、onboarding、model-auth、SecretRef docs は、
  per-agent auth-profile JSON files の代わりに SQLite auth-profile rows と whole-state backup/migration を説明するようになりました。
- PI model discovery は、正規の credentials を in-memory
  `pi-coding-agent` auth storage に渡すようになりました。discovery 中に per-agent `auth.json` を
  作成、scrub、書き込みしなくなりました。
- Voice Wake trigger と routing settings は、
  `settings/voicewake.json`、`settings/voicewake-routing.json`、opaque generic rows の代わりに、型付き共有 SQLite tables を使用するようになりました。doctor はレガシー JSON files をインポートし、成功した
  migration 後にそれらを削除します。
- Update-check state は、`update-check.json` や opaque generic blob の代わりに、
  型付き共有 `update_check_state` 行を使用するようになりました。doctor は
  レガシー JSON file をインポートし、成功した migration 後にそれを削除します。
- Config health state は、`logs/config-health.json` や opaque generic blob の代わりに
  型付き共有 `config_health_entries` 行を使用するようになりました。doctor は
  レガシー JSON file をインポートし、成功した migration 後にそれを削除します。
- Plugin conversation binding approvals は、opaque shared SQLite state または
  `plugin-binding-approvals.json`。レガシーファイルは doctor マイグレーション入力です。
- 汎用の現在の会話バインディングは、`bindings/current-conversations.json` を書き換える代わりに、型付きの
  `current_conversation_bindings` 行を保存するようになりました。doctor はレガシー JSON ファイルをインポートし、
  マイグレーションが成功した後に削除します。
- Memory Wiki のインポート済みソース同期台帳は、`.openclaw-wiki/source-sync.json` を書き換える代わりに、
  vault/source キーごとに SQLite plugin-state 行を 1 つ保存するようになりました。
  マイグレーションプロバイダーはレガシー JSON 台帳をインポートして削除します。
- Memory Wiki ChatGPT インポート実行レコードは、`.openclaw-wiki/import-runs/*.json` に書き込む代わりに、
  vault/run id ごとに SQLite plugin-state 行を 1 つ保存するようになりました。
  ロールバックスナップショットは、インポート実行スナップショットのアーカイブが blob ストレージへ移されるまで、
  明示的な vault ファイルのままです。
- Memory Wiki のコンパイル済みダイジェストは、
  `.openclaw-wiki/cache/agent-digest.json` と
  `.openclaw-wiki/cache/claims.jsonl` に書き込む代わりに、SQLite plugin blob 行を保存するようになりました。
  マイグレーションプロバイダーは古いキャッシュファイルをインポートし、
  空になった時点でキャッシュディレクトリを削除します。
- ClawHub の Skill インストール追跡は、実行時に `.clawhub/lock.json` と
  `.clawhub/origin.json` サイドカーを書き込む、または読み取る代わりに、workspace/skill ごとに
  SQLite plugin-state 行を 1 つ保存するようになりました。ランタイムコードは、ファイル形状の lockfile/origin
  抽象ではなく、追跡済みインストール状態オブジェクトを使用します。doctor は、構成済みのエージェントワークスペースから
  レガシーサイドカーをインポートし、クリーンなインポート後に削除します。
- インストール済み Plugin インデックスは、`plugins/installs.json` ではなく、型付きの共有 SQLite
  `installed_plugin_index` シングルトン行を読み書きするようになりました。レガシー JSON ファイルは doctor
  マイグレーション入力に限られ、インポート後に削除されます。
- レガシーの `plugins/installs.json` パスヘルパーは、doctor レガシーコードに移動しました。
  ランタイム Plugin インデックスモジュールは、JSON ファイルパスではなく、SQLite ベースの永続化オプションのみを公開します。
- Gateway 再起動センチネル、再起動意図、スーパーバイザー引き渡し状態は、汎用の不透明 blob ではなく、
  型付き共有 SQLite 行（`gateway_restart_sentinel`、
  `gateway_restart_intent`、`gateway_restart_handoff`）を使用するようになりました。
  ランタイム再起動コードには、ファイル形状のセンチネル/意図/引き渡し契約はありません。
- Matrix 同期キャッシュ、ストレージメタデータ、スレッドバインディング、受信 dedupe マーカー、
  起動時検証クールダウン状態、SDK IndexedDB 暗号スナップショット、認証情報、リカバリーキーは、
  共有 SQLite plugin state/blob テーブルを使用するようになりました。ランタイムパス構造体は
  `storage-meta.json` メタデータパスを公開しなくなりました。このファイル名はレガシーマイグレーション入力に限られます。
  それらのレガシー JSON インポート計画は、Matrix Plugin のセットアップ/doctor マイグレーション面にあります。
- Matrix 起動は、レガシー Matrix ファイル状態をスキャン、報告、完了しなくなりました。
  Matrix ファイル検出、レガシー暗号スナップショット作成、room-key 復元マイグレーション状態、インポート、
  ソース削除はすべて doctor が所有します。
- Matrix ランタイムマイグレーション barrel は削除されました。レガシー状態/暗号検出および変更ヘルパーは、
  ランタイム API 面の一部ではなく、Matrix doctor から直接インポートされます。
- Matrix マイグレーションスナップショット再利用マーカーは、`matrix/migration-snapshot.json` ではなく
  SQLite plugin state に存在するようになりました。doctor は、サイドカー状態ファイルを書き込まずに、
  同じ検証済みマイグレーション前アーカイブを引き続き再利用できます。
- Nostr bus カーソルと profile 公開状態は、共有 SQLite plugin state を使用するようになりました。
  それらのレガシー JSON インポート計画は、Nostr Plugin のセットアップ/doctor マイグレーション面にあります。
- Active Memory セッショントグルは、`session-toggles.json` ではなく共有 SQLite plugin state を使用するようになりました。
  memory を再度オンにすると、JSON オブジェクトを書き換える代わりに行を削除します。
- Skill Workshop の提案とレビューカウンターは、workspace ごとの `skill-workshop/<workspace>.json` ストアではなく、
  共有 SQLite plugin state を使用するようになりました。各提案は `skill-workshop/proposals` 配下の別個の行であり、
  レビューカウンターは `skill-workshop/reviews` 配下の別個の行です。
- Skill Workshop レビュー担当サブエージェント実行は、`skill-workshop/<sessionId>.json` サイドカーセッションパスを
  作成する代わりに、ランタイムセッショントランスクリプトリゾルバーを使用するようになりました。
- ACPX プロセスリースは、ファイル全体の `process-leases.json` レジストリではなく、
  `acpx/process-leases` 配下の共有 SQLite plugin state を使用するようになりました。
  各リースは独自の行として保存され、ランタイム JSON 書き換えパスなしで起動時の stale-process 刈り取りを維持します。
- ACPX ラッパースクリプトと分離された Codex home は、OpenClaw temp ルートに生成されます。
  必要に応じて再作成され、バックアップ入力やマイグレーション入力ではありません。
- サブエージェント実行レジストリの永続化は、型付き共有 `subagent_runs` 行を使用します。
  古い `subagents/runs.json` パスは doctor マイグレーション入力に限られ、ランタイムヘルパー名は状態レイヤーを
  disk-backed と表現しなくなりました。ランタイムテストは、レジストリ動作を証明するために無効または空の
  `runs.json` fixture を作成しなくなり、SQLite 行を直接 seed/read します。
- Backup はアーカイブ前に状態ディレクトリを staging し、非データベースファイルをコピーし、
  `VACUUM INTO` で `*.sqlite` データベースのスナップショットを作成し、ライブ WAL/SHM
  サイドカーを省略し、アーカイブマニフェストにスナップショットメタデータを記録し、
  完了したバックアップ実行をアーカイブマニフェストとともに SQLite に記録します。`openclaw backup
create` はデフォルトで書き込まれたアーカイブを検証します。`--no-verify` は明示的な高速パスです。
- `openclaw backup restore` は抽出前にアーカイブを検証し、検証器の正規化済みマニフェストを再利用し、
  検証済みマニフェストアセットを記録されたソースパスへ復元します。書き込みには `--yes` が必要で、
  復元計画用に `--dry-run` をサポートします。
- 古いバックアップ volatile-path フィルターは削除されました。Backup は、アーカイブ作成前に SQLite
  スナップショットが staging されるため、レガシーセッションまたは cron JSON/JSONL ファイル用の
  live-tar スキップリストを必要としなくなりました。
- プレーンなセットアップとオンボーディングのワークスペース準備は、`agents/<agentId>/sessions/`
  ディレクトリを作成しなくなりました。config/workspace のみを作成します。SQLite セッション行とトランスクリプト行は、
  エージェントごとのデータベースでオンデマンドに作成されます。
- セキュリティ権限修復は、`sessions.json` とトランスクリプト JSONL ファイルではなく、
  グローバルおよびエージェントごとの SQLite データベースと WAL/SHM サイドカーを対象にするようになりました。
- サンドボックスレジストリのランタイム名は、アクティブストアにレガシー JSON レジストリ用語を持ち込む代わりに、
  SQLite レジストリ種別を直接表すようになりました。
- `openclaw reset --scope config+creds+sessions` は、レガシーの `sessions/` ディレクトリだけでなく、
  エージェントごとの `openclaw-agent.sqlite` データベースと WAL/SHM サイドカーを削除します。
- Gateway 集約セッションヘルパーは、エントリ指向の名前を使用するようになりました。
  `loadCombinedSessionEntriesForGateway` は `{ databasePath, entries }` を返します。
  古い combined-store 命名はランタイム呼び出し元から削除されました。
- Docker MCP チャネル seed は、`sessions.json` と JSONL トランスクリプトを作成する代わりに、
  メインセッション行とトランスクリプトイベントをエージェントごとの SQLite データベースに書き込むようになりました。
- バンドルされた session-memory hook は、`{agentId, sessionId}` によって SQLite から previous-session コンテキストを
  解決するようになりました。トランスクリプトパスや `workspace/sessions` ディレクトリをスキャン、保存、
  合成しなくなりました。
- バンドルされた command-logger hook は、`logs/commands.log` に追記する代わりに、
  共有 SQLite `command_log_entries` テーブルへコマンド監査行を書き込むようになりました。
- チャネル pairing allowlist は、ランタイムと Plugin SDK で SQLite ベースの read/write ヘルパーのみを
  公開するようになりました。古い `*-allowFrom.json` パスリゾルバーとファイルリーダーは、
  doctor レガシーインポートコード配下にのみ存在します。
- `migration_runs` は、レガシー状態マイグレーション実行をステータス、タイムスタンプ、JSON レポートとともに記録します。
- `migration_sources` は、インポートされた各レガシーファイルソースを、ハッシュ、サイズ、レコード数、
  ターゲットテーブル、run id、ステータス、ソース削除状態とともに記録します。
- `backup_runs` は、バックアップアーカイブパス、ステータス、JSON マニフェストを記録します。
- グローバルスキーマは、未使用の `agents` レジストリテーブルを保持しません。エージェントデータベース検出は、
  ランタイムに実際のエージェントレコード所有者ができるまで、正規の `agent_databases` レジストリです。
- 生成されたモデルカタログ config は、エージェントディレクトリをキーにした型付きグローバル SQLite
  `agent_model_catalogs` 行に保存されます。ランタイム呼び出し元は `ensureOpenClawModelCatalog` を使用します。
  ランタイムコードには `models.json` 互換 API はありません。実装は SQLite に書き込み、埋め込み PI レジストリは
  `models.json` ファイルを作成せずに、その保存済み payload から hydration されます。
- QMD セッショントランスクリプト Markdown エクスポートと `memory.qmd.sessions` config は削除されました。
  QMD トランスクリプトコレクション、`qmd/sessions*` ランタイムパス、ファイルベースのセッション memory bridge はありません。
- memory-core ランタイムは、QMD SDK サブパスではなく、
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` から SQLite トランスクリプトインデックスヘルパーを
  インポートします。QMD サブパスは、メジャー SDK クリーンアップで削除できるまで、外部呼び出し元向けの互換 re-export
  のみを保持します。
- QMD 自身の `index.sqlite` は、メイン SQLite `plugin_blob_entries` テーブルに裏付けられた一時ランタイム実体化になりました。
  ランタイムは永続的な `~/.openclaw/agents/<agentId>/qmd` サイドカーを作成しなくなりました。
- 任意の `memory-lancedb` Plugin は、暗黙の OpenClaw 管理ストアとして
  `~/.openclaw/memory/lancedb` を作成しなくなりました。これは外部 LanceDB backend であり、
  operator が明示的な `dbPath` を構成するまで無効のままです。
- `check:database-first-legacy-stores` は、レガシーストア名と write-style ファイルシステム API を組み合わせる新しいランタイムソースを失敗させます。
  また、廃止されたトランスクリプト bridge マーカー
  `transcriptLocator` または `sqlite-transcript://...` を再導入するランタイムソースも失敗させます。
  マイグレーション、doctor、インポート、明示的な非セッションエクスポートコードは引き続き許可されます。
  `sessionFile`、`storePath`、古い `SessionManager` ファイル時代 facade などのより広いレガシー契約名は、
  現在の所有者がまだ存在し、必須の事前チェックにできるようになる前に別個のマイグレーションガード作業が必要です。
  このガードは、ランタイム `cache/*.json` ストア、汎用
  `thread-bindings.json` サイドカー、cron 状態/run-log JSON、config health JSON、
  restart と lock サイドカー、Voice Wake 設定、Plugin binding approvals、
  installed plugin index JSON、File Transfer 監査 JSONL、Memory Wiki activity
  logs、古いバンドル `command-logger` テキストログ、pi-mono raw-stream JSONL
  diagnostics knobs も対象にするようになりました。また、互換コードが
  `src/commands/doctor/` 配下に留まるように、古い root-level doctor レガシーモジュール名も禁止します。
  Android debug handler も、`camera_debug.log` または `debug_logs.txt` キャッシュファイルを staging する代わりに、
  logcat/in-memory 出力を使用します。

## 目標スキーマ形状

スキーマは明示的に保つ。ホスト所有のランタイム状態は型付きテーブルを使う。Plugin 所有の
不透明な状態は `plugin_state_entries` / `plugin_blob_entries` を使う。汎用の
ホスト `kv` テーブルは存在しない。

グローバルデータベース:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

エージェントデータベース:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

将来の検索では、正規イベントテーブルを変更せずに FTS テーブルを追加できる:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大きな値には、JSON 文字列エンコードではなく `blob` カラムを使う。通常の
SQLite ツールで検査可能なままにする必要がある小さな構造化データには
`value_json` を残す。

`agent_databases` はこのブランチの正規レジストリである。実際のエージェントレコード所有者が存在するまでは、
`agents` テーブルを追加しない。エージェント設定は
`openclaw.json` に残す。

## Doctor 移行形状

Doctor は、報告可能で再実行しても安全な 1 つの明示的な移行ステップを呼び出す必要がある:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` は通常の設定事前チェックの後に状態移行実装を呼び出し、
インポート前に検証済みバックアップを作成する。ランタイム起動と `openclaw migrate` は
レガシー OpenClaw 状態ファイルをインポートしてはならない。

移行プロパティ:

- 1 回の移行パスですべてのレガシーファイルソースを検出し、何かを変更する前に計画を生成する。
- Doctor はレガシーファイルをインポートする前に、検証済みの移行前バックアップアーカイブを作成する。
- インポートは冪等であり、ソースパス、mtime、サイズ、ハッシュ、ターゲット
  テーブルをキーにする。
- 成功したソースファイルは、ターゲットデータベースのコミット後に削除またはアーカイブする。
- 失敗したインポートはソースを変更せず、`migration_runs` に警告を記録する。
- ランタイムコードは、移行が存在した後は SQLite のみを読み取る。
- ダウングレードまたはランタイムファイルへのエクスポート経路は不要。

## 移行インベントリ

これらをグローバルデータベースへ移動する:

- タスクレジストリのランタイム書き込みは共有データベースを使うようになりました。未出荷の
  `tasks/runs.sqlite` サイドカーインポーターは削除されました。スナップショット保存はタスク
  id で upsert し、不足しているタスク/配信行のみを削除します。
- Task Flow ランタイム書き込みは共有データベースを使うようになりました。未出荷の
  `tasks/flows/registry.sqlite` サイドカーインポーターは削除されました。スナップショット保存は
  flow id で upsert し、不足している flow 行のみを削除します。
- Plugin 状態のランタイム書き込みは共有データベースを使うようになりました。未出荷の
  `plugin-state/state.sqlite` サイドカーインポーターは削除されました。
- 組み込みメモリ検索は `memory/<agentId>.sqlite` をデフォルトにしなくなりました。その
  インデックステーブルは所有元エージェントデータベース内に置かれ、明示的な
  `memorySearch.store.path` サイドカーのオプトインは doctor config
  migration に移されて廃止されました。
- 組み込みメモリの再インデックスは、エージェントデータベース内のメモリ所有テーブルのみをリセットします。
  同じデータベースが
  sessions、transcripts、VFS 行、artifacts、ランタイムキャッシュを所有するため、SQLite ファイル全体を置き換えてはいけません。
- モノリシックおよびシャード化 JSON 由来のサンドボックスコンテナ/ブラウザレジストリ。ランタイム
  書き込みは共有データベースを使うようになりました。レガシー JSON インポートは残ります。
- Cron ジョブ定義、スケジュール状態、実行履歴は共有 SQLite を使うようになりました。
  doctor はレガシーの `jobs.json`、`jobs-state.json`、および
  `cron/runs/*.jsonl` ファイルをインポート/削除します
- デバイス ID/認証、プッシュ、更新チェック、commitments、OpenRouter モデル
  キャッシュ、インストール済み Plugin インデックス、app-server bindings
- デバイス/Node ペアリングおよびブートストラップレコードは型付き SQLite テーブルを使うようになりました
- device-pair 通知サブスクライバーと配信済みリクエストマーカーは、
  `device-pair-notify.json` の代わりに共有 SQLite plugin-state テーブルを使うようになりました。
- Voice-call の通話レコードは `calls.jsonl` の代わりに
  `voice-call` / `calls` namespace の共有 SQLite plugin-state テーブルを使うようになりました。Plugin CLI は
  SQLite ベースの通話履歴を tail して要約します。
- QQBot Gateway セッション、既知ユーザーレコード、ref-index 引用キャッシュは
  `session-*.json`、`known-users.json`、および
  `ref-index.jsonl` の代わりに `qqbot` namespaces（`sessions`、`known-users`、
  `ref-index`）配下の SQLite plugin state を使うようになりました。QQBot doctor/setup migration はレガシーファイルをインポートして削除します。
- Discord model-picker 設定、command-deploy ハッシュ、thread bindings は
  `model-picker-preferences.json`、`command-deploy-cache.json`、および
  `thread-bindings.json` の代わりに `discord` namespaces
  （`model-picker-preferences`、`command-deploy-hashes`、`thread-bindings`）
  配下の SQLite plugin state を使うようになりました。Discord doctor/setup migration はレガシーファイルをインポートして削除します。
- BlueBubbles catchup cursors と inbound dedupe markers は
  `bluebubbles/catchup/*.json` および
  `bluebubbles/inbound-dedupe/*.json` の代わりに `bluebubbles` namespaces（`catchup-cursors`、`inbound-dedupe`）
  配下の SQLite plugin
  state を使うようになりました。BlueBubbles doctor/setup migration は
  レガシーファイルをインポートして削除します。
- Telegram update offsets、sticker cache entries、reply-chain message cache
  entries、sent-message cache entries、topic-name cache entries、thread
  bindings は `update-offset-*.json`、
  `sticker-cache.json`、`*.telegram-messages.json`、
  `*.telegram-sent-messages.json`、`*.telegram-topic-names.json`、および
  `thread-bindings-*.json` の代わりに `telegram` namespaces
  （`update-offsets`、`sticker-cache`、`message-cache`、`sent-messages`、
  `topic-names`、`thread-bindings`）配下の SQLite plugin state を使うようになりました。Telegram doctor/setup migration はインポートしてレガシーファイルを削除します。
- iMessage catchup cursors、reply short-id mappings、sent-echo dedupe rows は
  `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl`、および `imessage/sent-echoes.jsonl` の代わりに `imessage` namespaces（`catchup-cursors`、
  `reply-cache`、`sent-echoes`）配下の SQLite plugin state を使うようになりました。iMessage
  doctor/setup migration はレガシーファイルをインポートして削除します。
- Microsoft Teams conversations、polls、SSO tokens、feedback learnings は
  `msteams-conversations.json`、
  `msteams-polls.json`、`msteams-sso-tokens.json`、および `*.learnings.json` の代わりに SQLite plugin state namespaces（`conversations`、`polls`、`sso-tokens`、
  `feedback-learnings`）を使うようになりました。Microsoft Teams doctor/setup migration はレガシーファイルをインポートしてアーカイブします。
  保留中のアップロードは短命の SQLite キャッシュであり、古い JSON キャッシュファイルは
  移行されません。
- Matrix sync cache、storage metadata、thread bindings、inbound dedupe markers、
  startup verification cooldown state、credentials、recovery keys、SDK
  IndexedDB crypto snapshots は `matrix` 配下の SQLite plugin state/blob namespaces
  （`sync-store`、`storage-meta`、`thread-bindings`、`inbound-dedupe`、
  `startup-verification`、`credentials`、`recovery-key`、`idb-snapshots`）を使うようになりました。
  `bot-storage.json`、`storage-meta.json`、`thread-bindings.json`、
  `inbound-dedupe.json`、`startup-verification.json`、`credentials.json`、
  `recovery-key.json`、および `crypto-idb-snapshot.json` は使われません。Matrix doctor/setup
  migration は、アカウントスコープの Matrix ストレージルートからこれらのレガシーファイルをインポートして削除します。
- Nostr bus cursors と profile publish state は
  `bus-state-*.json` および `profile-state-*.json` の代わりに
  `nostr` namespaces（`bus-state`、`profile-state`）配下の SQLite plugin state を使うようになりました。Nostr doctor/setup
  migration はレガシーファイルをインポートして削除します。
- Active Memory セッショントグルは `session-toggles.json` の代わりに
  `active-memory/session-toggles` 配下の SQLite plugin state を使うようになりました。
- Skill Workshop 提案キューとレビューカウンターは、ワークスペースごとの
  `skill-workshop/<workspace>.json` ファイルの代わりに
  `skill-workshop/proposals` および `skill-workshop/reviews` 配下の SQLite plugin state を使うようになりました。
- アウトバウンド配信キューとセッション配信キューは、永続的な
  `delivery-queue/*.json`、`delivery-queue/failed/*.json`、および
  `session-delivery-queue/*.json` ファイルの代わりに、
  別々のキュー名（`outbound-delivery`、`session-delivery`）でグローバル SQLite
  `delivery_queue_entries` テーブルを共有するようになりました。doctor legacy-state ステップは
  保留中および失敗した行をインポートし、古い配信済みマーカーを削除し、インポート後に古い
  JSON ファイルを削除します。ホットルーティングとリトライフィールドは型付きカラムです。JSON ペイロードはリプレイ/デバッグ用にのみ保持されます。
- ACPX プロセスリースは `process-leases.json` の代わりに
  `acpx/process-leases` 配下の SQLite plugin state を使うようになりました。
- バックアップおよび migration 実行メタデータ

これらをエージェントデータベースへ移動します。

- エージェントセッションルートと互換形状の session-entry ペイロード。ランタイム書き込みは完了済みです。
  ホットセッションメタデータは `sessions` でクエリ可能であり、レガシー形状の完全な
  `SessionEntry` ペイロードは `session_entries` に残ります。
- エージェント transcript events。ランタイム書き込みは完了済みです。
- Compaction checkpoints と transcript snapshots。ランタイム書き込みは完了済みです。
  checkpoint transcript copies は SQLite transcript rows であり、checkpoint
  metadata は `transcript_snapshots` に記録されます。Gateway checkpoint helpers は
  これらの値をソースファイルではなく transcript snapshots と呼ぶようになりました。
- エージェント VFS scratch/workspace namespaces。ランタイム VFS 書き込みは完了済みです。
- サブエージェント attachment payloads。ランタイム書き込みは完了済みです。これらは SQLite VFS
  seed entries であり、永続的な workspace files にはなりません。
- Tool artifacts。ランタイム書き込みは完了済みです。
- Run artifacts。エージェントごとの
  `run_artifacts` テーブルを通じた worker ランタイム書き込みは完了済みです。
- エージェントローカルのランタイムキャッシュ。エージェントごとの `cache_entries` テーブルを通じた worker runtime scoped cache writes は完了済みです。Gateway-wide model caches は、agent-specific にならない限りグローバルデータベースに残ります。
- ACP parent stream logs。ランタイム書き込みは完了済みです。
- ACP replay ledger sessions。`acp_replay_sessions` および `acp_replay_events` を通じたランタイム書き込みは完了済みです。レガシーの `acp/event-ledger.json`
  は doctor 入力としてのみ残ります。
- ACP session metadata。`acp_sessions` を通じたランタイム書き込みは完了済みです。`sessions.json` 内のレガシー
  `entry.acp` blocks は doctor migration 入力のみです。
- 明示的な export files ではない trajectory sidecars。ランタイム
  書き込みは完了済みです。trajectory capture は agent-database `trajectory_runtime_events`
  行を書き込み、run-scoped artifacts を SQLite にミラーします。レガシー sidecars は doctor
  import inputs のみです。export は新しい JSONL support-bundle outputs を具体化できますが、
  ランタイムで古い trajectory/transcript sidecars を読み取ったり移行したりしません。
  Runtime trajectory capture は SQLite scope を公開します。JSONL path helpers は
  export/debug support に隔離され、runtime module から再エクスポートされません。
  Embedded-runner trajectory metadata は transcript locator を永続化する代わりに `{agentId, sessionId, sessionKey}`
  identity を記録します。

これらは当面ファイルベースのままにします。

- `openclaw.json`
- provider または CLI credential files
- plugin/package manifests
- disk mode が選択された場合の user workspaces と Git repositories
- 特定のログ surface が移動されない限り、operator tailing を意図した logs

## Migration Plan

### Phase 0: 境界を凍結する

さらに多くの行を移動する前に、durable-state boundary を明示します。

- グローバルデータベースに `migration_runs` テーブルを追加します。
  レガシー状態 migration 実行レポートについて完了済みです。
- file-to-database import 用に、doctor が所有する単一の state migration service を追加します。
  完了済み: `openclaw doctor --fix` は legacy-state migration implementation を使います。
- `plan` を read-only にし、`apply` が backup を作成し、import、verify を行い、
  その後に古い files を削除または quarantine するようにします。
  完了済み: doctor は検証済みの pre-migration backup を作成し、backup path を
  `migration_runs` に渡し、importer/removal paths を再利用します。
- 新しい runtime code が legacy state files を書き込めないように static bans を追加し、
  migration code と tests は引き続きそれらを seed/read できるようにします。
  現在移行済みの legacy stores について完了済みです。この guard は、禁止された runtime transcript locator contracts について nested
  tests もスキャンします。

### Phase 1: グローバルコントロールプレーンを完了する

共有 coordination state を `state/openclaw.sqlite` に保持します。

- Agents と agent database registry
- Task と Task Flow ledgers
- Plugin state
- Sandbox container/browser registry
- Cron/scheduler run history
- Pairing、device、push、update-check、TUI、OpenRouter/model caches、およびその他の
  小さな gateway-scoped runtime state
- Backup と migration metadata
- Gateway media attachment bytes。ランタイム書き込みは完了済みです。直接の file paths
  は channel senders と sandbox
  staging との互換性のための一時的な materializations です。Runtime allowlists は legacy
  state/config media roots ではなく SQLite materialization paths を受け入れます。Doctor はレガシー media files を
  `media_blobs` にインポートし、row writes が成功した後に source files を削除します。
- Debug proxy capture sessions、events、payload blobs。完了済み: captures は
  shared state DB に存在し、shared state DB bootstrap、schema、
  WAL、および busy-timeout settings を通じて開きます。Payload bytes は
  `capture_blobs.data` で gzip 圧縮されます。debug proxy runtime sidecar DB override、
  blob directory、proxy-capture-only generated schema/codegen target はありません。
  Doctor/startup migration は、出荷済みの `debug-proxy/capture.sqlite` rows
  と参照される payload blobs を、active legacy DB/blob environment
  overrides を含めてインポートし、CA certificates はそのままにしてこれらの source をアーカイブします。

この phase では、これらのサブシステムから duplicate sidecar openers、permission helpers、WAL
setup、filesystem pruning、compatibility writers も削除します。

### Phase 2: エージェントごとのデータベースを導入する

エージェントごとに 1 つのデータベースを作成し、グローバル DB から登録します。

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

グローバルの `agent_databases` 行は、path、schema version、last-seen
timestamp、および基本的な size/integrity metadata を保存します。ランタイムコードは、file paths を直接導出する代わりに
registry に agent DB を要求します。

agent DB が所有するもの:

- 正規のセッションルートとしての `sessions`。そのルートに接続される互換形状のペイロードテーブルとしての `session_entries`、一意のアクティブな `session_key` ルックアップとしての
  `session_routes`
- セッションに接続される正規化済みプロバイダールーティング ID としての `conversations` と `session_conversations`
- `transcript_events`
- トランスクリプトスナップショットと Compaction チェックポイント。ランタイム書き込みでは完了。
- `vfs_entries`
- `tool_artifacts` と実行アーティファクト
- エージェントローカルのランタイム/キャッシュ行。ワーカースコープのキャッシュでは完了。
- ACP 親ストリームイベント
- 明示的なエクスポートアーティファクトではない場合の軌跡ランタイムイベント

### フェーズ 3: セッションストア API を置き換える

ランタイムでは完了。ファイル形状のセッションストアサーフェスはアクティブなランタイム契約ではない:

- ランタイムは `loadSessionStore(storePath)` を呼び出さず、`storePath` をセッション ID として扱わなくなった。
- ランタイム行操作は `getSessionEntry`、`upsertSessionEntry`、
  `patchSessionEntry`、`deleteSessionEntry`、`listSessionEntries`。
- ストア全体の再書き込みヘルパー、ファイルライター、キューテスト、エイリアス枝刈り、レガシーキー削除パラメーターはランタイムから削除済み。
- 非推奨のルートパッケージ互換エクスポートは、正規の
  `sessions.json` パスを SQLite 行 API にまだ適応している。
- `sessions.json` の解析は doctor の移行/インポートコードと
  doctor テストにのみ残っている。
- ランタイムライフサイクルのフォールバックは、JSONL の先頭行ではなく SQLite トランスクリプトヘッダーを読む。

ファイルロックパラメーター、ファイルメンテナンスとしての枝刈り/切り詰め語彙、ストアパス ID、または JSON 永続化だけをアサートするテストを再導入するものは削除し続ける。

### フェーズ 4: トランスクリプト、ACP ストリーム、軌跡、VFS を移動する

すべてのエージェントデータストリームをデータベースネイティブにする:

- トランスクリプト追記書き込みは、セッションヘッダーを確保し、メッセージの冪等性を確認し、親テールを選択し、`transcript_events` に挿入し、クエリ可能な ID メタデータを
  `transcript_event_identities` に記録する 1 つの SQLite トランザクションを通る。直接のトランスクリプトメッセージ追記と通常の永続化された `TranscriptSessionManager` 追記では完了。明示的なブランチ操作は明示的な親選択を維持し、ファイルロケーターを導出せずに SQLite 行を書き込む。
- ACP 親ストリームログは `.acp-stream.jsonl` ファイルではなく行になる。完了。
- ACP spawn セットアップはトランスクリプト JSONL パスを永続化しなくなった。完了。
- ランタイム軌跡キャプチャはイベント行/アーティファクトを直接書き込む。明示的なサポート/エクスポートコマンドは、エクスポート形式としてサポートバンドル JSONL アーティファクトをまだ生成できるが、セッションエクスポートはセッション JSONL を再作成しない。完了。
- ディスクワークスペースは、ディスクモードとして設定されている場合はディスク上に残る。
- VFS スクラッチと実験的な VFS 限定ワークスペースモードはエージェント DB を使う。

移行は古い JSONL ファイルを一度だけインポートし、`migration_runs` に件数/ハッシュを記録し、整合性チェック後にインポート済みファイルを削除する。

### フェーズ 5: バックアップ、復元、Vacuum、検証

バックアップは 1 つのアーカイブファイルのままにする:

- すべてのグローバルデータベースとエージェントデータベースをチェックポイントする。
- SQLite バックアップセマンティクスまたは `VACUUM INTO` で各 DB をスナップショットする。
- コンパクトな DB スナップショット、設定、外部認証情報、要求されたワークスペースエクスポートをアーカイブする。
- 生のライブ `*.sqlite-wal` と `*.sqlite-shm` ファイルは省く。
- すべての DB スナップショットを開いて `PRAGMA integrity_check` を実行して検証する。
  `openclaw backup create` はデフォルトでこのアーカイブ検証を行う。
  `--no-verify` はスナップショット作成の整合性チェックではなく、書き込み後のアーカイブパスだけをスキップする。
- 復元はスナップショットをターゲットパスにコピーし戻す。このブランチは未出荷の SQLite レイアウトを `user_version = 1` にリセットする。将来出荷済みスキーマ変更が必要になったときは、明示的な移行を追加できる。

### フェーズ 6: ワーカーランタイム

データベース分割が着地する間、ワーカーモードは実験的なままにする:

- ワーカーはエージェント ID、実行 ID、ファイルシステムモード、DB レジストリ ID を受け取る。
- 各ワーカーは独自の SQLite 接続を開く。
- 親はチャンネル配信、承認、設定、キャンセル権限を保持する。
- アクティブな実行ごとに 1 ワーカーから始める。プーリングはライフサイクルと DB 接続所有権が安定してから追加する。

### フェーズ 7: 古い世界を削除する

ランタイムセッション管理では完了。古い世界は明示的な doctor 入力またはサポート/エクスポート出力としてのみ許可される:

- ランタイムの `sessions.json`、トランスクリプト JSONL、サンドボックスレジストリ JSON、タスクサイドカー SQLite、Plugin 状態サイドカー SQLite 書き込みはない。
- JSON/セッションファイル枝刈り、ファイルトランスクリプト切り詰め、セッションファイルロック、またはロック形状のセッションテストはない。
- 古いセッションファイルを最新に保つことを目的とするランタイム互換エクスポートはない。
- 明示的なサポートエクスポートはユーザー要求のアーカイブ/具現化形式として残り、ファイル名をランタイム ID に戻してはならない。

## バックアップと復元

バックアップは 1 つのアーカイブファイルにするべきだが、データベースキャプチャは SQLite ネイティブにするべき:

1. 長時間実行される書き込みアクティビティを停止するか、短いバックアップバリアに入る。
2. すべてのグローバルデータベースとエージェントデータベースについて、チェックポイントを実行する。
3. SQLite バックアップセマンティクスまたは `VACUUM INTO` を使い、一時バックアップディレクトリに各データベースをスナップショットする。
4. 圧縮されたデータベーススナップショット、設定ファイル、認証情報ディレクトリ、選択したワークスペース、マニフェストをアーカイブする。
5. 含まれるすべての SQLite スナップショットを開いて
   `PRAGMA integrity_check` を実行し、アーカイブを検証する。
   `openclaw backup create` はデフォルトでこれを行う。`--no-verify` は、書き込み後のアーカイブパスを意図的にスキップする場合にのみ使う。

生のライブ `*.sqlite`、`*.sqlite-wal`、`*.sqlite-shm` コピーを主要なバックアップ形式として頼らない。アーカイブマニフェストには、データベースロール、エージェント ID、スキーマバージョン、ソースパス、スナップショットパス、バイトサイズ、整合性ステータスを記録するべき。

復元は、アーカイブスナップショットからグローバルデータベースとエージェントデータベースファイルを再構築するべき。SQLite レイアウトはまだ出荷されていないため、このリファクターではバージョン 1 スキーマと doctor のファイルからデータベースへのインポートだけを保持する。復元コマンドはまずアーカイブを検証し、その後、検証済みの展開ペイロードから各マニフェスト資産を置き換える。

## ランタイムリファクタープラン

1. データベースレジストリ API を追加する。
   - グローバル DB とエージェントごとの DB パスを解決する。
   - 未出荷スキーマは `user_version = 1` のままにする。出荷済みスキーマが必要になるまで、スキーマ移行ランナーコードは追加しない。
   - テスト、バックアップ、doctor で使う close/checkpoint/integrity ヘルパーを追加する。

2. サイドカー SQLite ストアを統合する。
   - Plugin 状態テーブルをグローバルデータベースに移動する。ランタイム書き込みでは完了。未出荷のレガシーサイドカーインポーターは削除済み。
   - タスクレジストリテーブルをグローバルデータベースに移動する。ランタイム書き込みでは完了。未出荷のレガシーサイドカーインポーターは削除済み。
   - Task Flow テーブルをグローバルデータベースに移動する。ランタイム書き込みでは完了。未出荷のレガシーサイドカーインポーターは削除済み。
   - 組み込み memory-search テーブルを各エージェントデータベースに移動する。完了。明示的なカスタム `memorySearch.store.path` は doctor 設定移行で削除されるようになった。
     フル再インデックスはメモリテーブルに対してのみその場で実行される。古いファイル全体のスワップパスとサイドカーインデックススワップヘルパーは削除済み。
   - これらのサブシステムから重複したデータベースオープナー、WAL セットアップ、権限ヘルパー、クローズパスを削除する。

3. エージェント所有テーブルをエージェントごとのデータベースに移動する。
   - グローバルデータベースレジストリを通じてオンデマンドでエージェント DB を作成する。完了。
   - ランタイムセッションエントリ、トランスクリプトイベント、VFS 行、ツールアーティファクトをエージェント DB に移動する。完了。
   - ブランチローカルの共有 DB セッションエントリ、トランスクリプトイベント、VFS 行、ツールアーティファクトは移行しない。そのレイアウトは一度も出荷されていない。doctor にはレガシーファイルからデータベースへのインポートだけを残す。

4. セッションストア API を置き換える。
   - `storePath` をランタイム ID として削除する。ランタイムでは完了し、
     `check:database-first-legacy-stores` によりガードされている。セッションメタデータ、ルート更新、コマンド永続化、CLI セッションクリーンアップ、Feishu 推論プレビュー、トランスクリプト状態永続化、サブエージェント深度、認証プロファイルセッション上書き、親フォークロジック、QA-lab インスペクションは、正規のエージェント/セッションキーからデータベースを解決するようになった。
     Gateway/TUI/UI/macOS のセッションリスト応答はレガシー `path` ではなく `databasePath` を公開するようになった。macOS デバッグサーフェスは `session.store` 設定を書き込む代わりに、エージェントごとのデータベースを読み取り専用状態として表示する。
     `/status`、チャット駆動の軌跡エクスポート、CLI 依存関係プロキシはレガシーストアパスを伝播しなくなった。トランスクリプト使用量フォールバックはエージェント/セッション ID で SQLite を読む。ランタイムとブリッジテストは `storePath` を公開しなくなった。doctor/移行入力がそのレガシーフィールド名を所有する。
     Gateway の結合セッション読み込みは、テンプレート化されていない `session.store` 値用の特別なランタイム分岐を持たなくなった。エージェントごとの SQLite 行を集約する。
     レガシーセッションロック doctor レーンとその `.jsonl.lock` クリーンアップヘルパーは削除済み。現在は SQLite がセッション同時実行境界。
     ホットなランタイム呼び出し箇所は `resolveSessionRowEntry` のような行指向のヘルパー名を使う。古い `resolveSessionStoreEntry` 互換エイリアスはランタイムと Plugin SDK エクスポートから削除済み。

- `{ agentId, sessionKey }` 行操作を使う。
  完了: `getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、
  `patchSessionEntry`、`listSessionEntries` はセッションストアパスを必要としない SQLite 優先 API。ステータスサマリー、ローカルエージェントステータス、ヘルス、
  `openclaw sessions` 一覧コマンドはエージェントごとの行を直接読み、`sessions.json` パスではなくエージェントごとの SQLite データベースパスを表示するようになった。
- ストア全体の delete/insert を `upsertSessionEntry`、
  `deleteSessionEntry`、`listSessionEntries`、SQL クリーンアップクエリで置き換える。
  ランタイムでは完了。ホットパスは行 API と競合時に再試行される行パッチを使うようになった。残るストア全体の import/replace ヘルパーは移行インポートコードと SQLite バックエンドテストに限定されている。
  - `store-writer.ts` と writer-queue テストを削除する。完了。
  - セッション行 upsert/patch からランタイムのレガシーキー枝刈りと alias-delete パラメーターを削除する。完了。

5. ランタイム JSON レジストリ動作を削除する。
   - サンドボックスレジストリの読み書きを SQLite のみにする。完了。
   - モノリシック JSON とシャード化 JSON は移行ステップからのみインポートする。完了。
   - シャード化レジストリロックと JSON 書き込みを削除する。完了。

- 形状がホットパスの運用状態であり続ける場合は、レジストリ行を汎用の不透明 JSON として保存する代わりに、型付きレジストリテーブルを 1 つ保持する。完了。

6. ファイルロック形状のセッション変更を削除する。
   - ランタイムロック作成とランタイムロック API では完了。
   - スタンドアロンのレガシー `.jsonl.lock` doctor クリーンアップレーンは削除済み。
   - `session.writeLock` は doctor によって移行されるレガシー設定であり、型付きランタイム設定ではない。
   - 状態整合性には、孤立したトランスクリプトファイル枝刈り用の別パスがなくなった。doctor 移行がレガシー JSONL ソースのインポート/削除を 1 箇所で行う。
   - Gateway シングルトン調整は `gateway_locks` の下で型付き SQLite `state_leases` 行を使い、ファイルロックディレクトリの継ぎ目を公開しなくなった。
   - 汎用 Plugin SDK 重複排除永続化はファイルロックや JSON ファイルを使わなくなった。共有 SQLite Plugin 状態行を書き込む。完了。
   - QMD 埋め込み調整は `qmd/embed.lock` の代わりに SQLite 状態リースを使う。完了。

7. ワーカーをデータベース対応にする。
   - ワーカーは独自の SQLite 接続を開く。
   - 親は配信、チャンネルコールバック、設定を所有する。
   - ワーカーはライブハンドルではなく、エージェント ID、実行 ID、ファイルシステムモード、DB レジストリ ID を受け取る。
   - `vfs-only` は実験的なままとし、エージェントデータベースをストレージルートとして使う。
   - まずアクティブな実行ごとに 1 ワーカーを維持する。プーリングは DB 接続の存続期間とキャンセル動作が安定するまで待てる。

8. バックアップ統合。
   - SQLite バックアップまたは `VACUUM INTO` により、グローバルデータベースとエージェントデータベースのスナップショットを取得するようバックアップに教える。状態アセット配下で検出された `*.sqlite` ファイルについて完了。
   - SQLite の整合性とスキーマバージョンのバックアップ検証を追加する。バックアップ作成とデフォルトアーカイブ検証の整合性チェックについて完了。
   - バックアップ実行メタデータを SQLite に記録する。アーカイブパス、ステータス、マニフェスト JSON を含む共有 `backup_runs` テーブルで完了。
   - 検証済みアーカイブスナップショットからの復元を追加する。完了: `openclaw backup
restore` は展開前に検証し、検証器の正規化済みマニフェストを使用し、`--dry-run` をサポートし、記録済みソースパスを置き換える前に `--yes` を要求する。
   - 要求された場合のみ VFS/workspace エクスポートを含める。セッション内部情報を JSON または JSONL としてエクスポートしない。

9. 廃止されたテストとコードを削除する。既知のランタイムセッション表面について完了。

- `sessions.json` またはトランスクリプト JSONL ファイルのランタイム作成をアサートするテストを削除する。コアセッションストア、チャット、Gateway トランスクリプトイベント、プレビュー、ライフサイクル、コマンドセッションエントリ更新、自動返信リセット/トレース、および memory-core dreaming フィクスチャ、承認ターゲットルーティング、セッショントランスクリプト修復、セキュリティ権限修復、軌跡エクスポート、セッションエクスポートについて完了。
  Active-memory トランスクリプトテストは現在、SQLite スコープと、一時または永続 JSONL ファイルが作成されないことをアサートする。
  ランタイムが JSONL トランスクリプトを切り詰めなくなったため、古い Heartbeat トランスクリプト枝刈り回帰は削除された。
  エージェントセッション一覧ツールのテストは、Gateway レスポンス形状としてレガシー `sessions.json` パスをモデル化しなくなった。アプリ/UI/macOS テストは `databasePath` を使用する。
  `/status` トランスクリプト使用量テストは、JSONL ファイルを書き込む代わりに SQLite トランスクリプト行を直接シードするようになった。
  Gateway セッションライフサイクルテストは SQLite トランスクリプトシードヘルパーを直接使用するようになった。古い単一行セッションファイルフィクスチャ形状は、リセットと削除のカバレッジからなくなった。
  `sessions.delete` はファイル時代の `archived: []` フィールドを返さなくなった。削除は行の変更結果のみを報告する。古い `deleteTranscript` オプションもなくなった。セッションの削除は正規の `sessions` ルートを削除し、SQLite にセッション所有のトランスクリプト、スナップショット、軌跡行をカスケードさせるため、呼び出し元がトランスクリプトの孤児を残したり、クリーンアップ分岐を忘れたりすることはできない。
  コンテキストエンジン軌跡キャプチャテストは、`session.trajectory.jsonl` を読む代わりに、隔離されたエージェントデータベースから `trajectory_runtime_events` 行を読むようになった。
  Docker MCP チャネルシードスクリプトは SQLite 行を直接シードするようになった。直接の `sessions.json` 書き込みは doctor フィクスチャに限定される。
  ツール検索 Gateway E2E は、`agents/<agentId>/sessions/*.jsonl` ファイルをスキャンする代わりに、SQLite トランスクリプト行からツール呼び出しの証拠を読む。
  Memory-core ホストイベントとセッションコーパスのスクラッチ行は、共有 SQLite Plugin 状態に存在するようになった。`events.jsonl` と `session-corpus/*.txt` はレガシー doctor 移行入力のみである。アクティブ行は `.dreams/session-corpus` ではなく、`memory/session-ingestion/` 仮想パスを使用する。ランタイムがそのコーパスのファイルアーカイブ修復を所有しなくなったため、古い memory-core dreaming 修復モジュールとその CLI/Gateway テストは削除された。Memory-core ブリッジ/公開アーティファクトテストは `.dreams/events.jsonl` を表面化しなくなった。SQLite バックの仮想 JSON アーティファクト名を使用する。
  公開 SDK/Codex テストドキュメントは、セッションファイルではなく SQLite セッション状態と記述するようになり、チャネルターン例は `storePath` 引数を公開しなくなった。
  Matrix 同期状態は SQLite Plugin 状態ストアを直接使用するようになった。アクティブなクライアント/ランタイム契約は `bot-storage.json` パスではなくアカウントストレージルートを渡し、doctor はソースを削除する前にレガシー `bot-storage.json` を SQLite にインポートする。QA Matrix 再起動/破壊的シナリオは、偽の `bot-storage.json` ファイルを作成または削除する代わりに SQLite 同期行を直接変更するようになり、E2EE 基盤は偽の `sync-store.json` パスではなく同期ストアルートを渡す。
  Matrix ストレージルート選択は、レガシー同期/スレッド JSON ファイルでルートをスコアリングしなくなった。永続ルートメタデータと実際の暗号状態を使用する。
  ランタイム SQLite セッションバックエンドテストスイートは `sessions.json` を捏造しなくなった。レガシーソースフィクスチャは、それらをインポートする doctor テストに存在するようになった。
  Gateway セッションテストは `createSessionStoreDir` ヘルパーや未使用の一時セッションストアパス設定を公開しなくなった。フィクスチャディレクトリは明示的で、直接の行設定は SQLite セッション行命名を使用する。
  doctor 専用 JSON5 セッションストアパーサーカバレッジは infra テストから doctor 移行テストへ移動したため、ランタイムテストスイートはレガシーセッションファイル解析を所有しなくなった。
  Microsoft Teams ランタイム SSO/保留中アップロードテストは JSON サイドカーフィクスチャやパーサーを持たなくなった。レガシー SSO トークン解析は Plugin 移行モジュール内にのみ存在する。Telegram テストは偽の `/tmp/*.json` ストアパスをシードしなくなった。SQLite バックのメッセージキャッシュを直接リセットする。汎用 OpenClaw テスト状態ヘルパーはレガシー `auth-profiles.json` ライターを公開しなくなった。doctor 認証移行テストがそのフィクスチャをローカルで所有する。
  TUI 最終セッションポインター、exec 承認、active-memory トグル、Matrix 重複排除/起動検証、Memory Wiki ソース同期、現在の会話バインディング、オンボーディング認証、Hermes シークレットインポートのランタイムテストは、古いサイドカーファイルを生成したり、古いファイル名が存在しないことをアサートしたりしなくなった。それらは SQLite 行と公開ストア API を通じて動作を証明する。doctor/移行テストだけがレガシーソースファイル名の属する場所である。
  デバイス/Node ペアリング、チャネル allowFrom、再起動インテント、再起動ハンドオフ、セッション配信キューエントリ、設定ヘルス、iMessage キャッシュ、cron ジョブ、PI トランスクリプトヘッダー、サブエージェントレジストリ、管理対象画像添付のランタイムテストも、無視または不在を証明するためだけに廃止済み JSON/JSONL ファイルを作成しなくなった。
  PI オーバーフロー回復には、SessionManager 書き換え/切り詰めフォールバックがなくなった。ツール結果の切り詰めとコンテキストエンジントランスクリプトの書き換えは SQLite トランスクリプト行を変更し、その後データベースからアクティブプロンプト状態を更新する。
  永続化された SessionManager メッセージ追加は、親選択と冪等性のためにアトミックな SQLite トランスクリプト追加ヘルパーへ委譲する。通常のメタデータ/カスタムエントリ追加も SQLite 内で現在の親を選択するため、古いマネージャーインスタンスが SQLite 以前の親チェーン競合を復活させることはない。
  ターン中 precheck と `sessions_yield` の合成 PI テールクリーンアップは、SQLite トランスクリプト状態を直接トリムするようになった。古い SessionManager テール削除ブリッジとそのテストは削除された。
  Compaction チェックポイントキャプチャも SQLite からのみスナップショットを取得する。呼び出し元は代替トランスクリプトソースとしてライブ SessionManager を渡さなくなった。
- 移行専用にレガシーファイルをシードするテストは保持する。
- アクティブなランタイム表面では、JSON ファイルによる証明は SQL 行による証明に置き換えられた。

- レガシーセッション/キャッシュ JSON パスへのランタイム書き込みに対する静的禁止を追加する。
  リポジトリガードについて完了。

10. 移行レポートを監査可能にする。
    - 開始/終了タイムスタンプ、ソースパス、ソースハッシュ、件数、警告、バックアップパスを含む移行実行を SQLite に記録する。
      完了: レガシー状態移行の実行は、ソースパス/テーブルインベントリ、ソースファイル SHA-256、サイズ、レコード件数、警告、バックアップパスを含む `migration_runs` レポートを永続化するようになった。
      完了: レガシー状態移行の実行は、ソースレベル監査と将来のスキップ/バックフィル判断のために `migration_sources` 行も永続化する。
    - apply を冪等にする。部分インポート後に再実行した場合、インポート済みソースをスキップするか、安定キーでマージする必要がある。
      完了: セッションインデックス、トランスクリプト、配信キュー、Plugin 状態、タスク台帳、エージェント所有のグローバル SQLite 行は、安定キーまたは upsert/replace セマンティクスを通じてインポートされるため、再実行しても永続行を重複させずにマージされる。
    - 失敗したインポートは元のソースファイルをその場に保持しなければならない。
      完了: 失敗したトランスクリプトインポートは、検出されたパスに元の JSONL ソースを残すようになり、`migration_sources` は次回の doctor 実行のために、そのソースを `removed_source=0` の `warning` として記録する。

## パフォーマンスルール

- スレッド/プロセスごとに 1 つの接続で問題ない。ワーカー間でハンドルを共有しない。
- WAL、`foreign_keys=ON`、30 秒の busy タイムアウト、短い `BEGIN IMMEDIATE` 書き込みトランザクションを使用する。
- 明示的な mutex/backpressure セマンティクスを持つ非同期トランザクション API が追加されるまで、書き込みトランザクションヘルパーは同期のままにする。
- 親配信書き込みは小さく、トランザクション内に保つ。
- ストア全体の書き換えを避ける。行レベルの upsert/delete を使用する。
- ホットコードを移動する前に、list-by-agent、list-by-session、updated-at、run id、有効期限パスのインデックスを追加する。
- 大きなアーティファクト、メディア、ベクトルは、base64 や数値配列 JSON ではなく、BLOB またはチャンク化された BLOB 行として保存する。
- 不透明な Plugin 状態エントリは小さく、スコープ化して保つ。
- ファイルシステムの枝刈りではなく、TTL/有効期限の SQL クリーンアップを追加する。
  データベース所有のランタイムストアについて完了: メディア、Plugin 状態、Plugin BLOB、永続的重複排除、エージェントキャッシュはすべて SQLite 行を通じて期限切れになる。残るファイルシステムクリーンアップは、一時的な materialization または明示的な削除コマンドに限定される。

## 静的禁止

レガシー状態パスへの新しいランタイム書き込みに失敗するリポジトリチェックを追加する:

- `sessions.json`
- materialized support-bundle 出力を除く `*.trajectory.jsonl`
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` ランタイムキャッシュファイル
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` と `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- sandbox registry shard JSON ファイル
- native hook relay `/tmp` ブリッジ JSON ファイル
- `plugin-state/state.sqlite`
- ad-hoc `openclaw-state.sqlite` ランタイムサイドカー
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Browser profile decoration `.openclaw-profile-decorated`
- `SessionManager.open(...)` ファイルバックのセッションオープナー
- `SessionManager.listAll(...)` と `TranscriptSessionManager.listAll(...)`
  トランスクリプト一覧ファサード
- `SessionManager.forkFromSession(...)` と
  `TranscriptSessionManager.forkFromSession(...)` トランスクリプトフォークファサード
- `SessionManager.newSession(...)` と `TranscriptSessionManager.newSession(...)`
  ミュータブルセッション置換ファサード
- `SessionManager.createBranchedSession(...)` と
  `TranscriptSessionManager.createBranchedSession(...)` ブランチセッションファサード

この禁止は、テストがレガシーフィクスチャを作成すること、および移行コードが
レガシーファイルソースを読み取り、インポートし、削除することを許可する必要がある。未出荷の SQLite サイドカーは禁止されたままで、
doctor インポートの許可対象にはしない。

## 完了条件

- ランタイムデータとキャッシュの書き込みは、グローバルまたはエージェントの SQLite データベースに送られる。
- ランタイムは、セッションインデックス、トランスクリプト JSONL、sandbox registry
  JSON、タスクサイドカー SQLite、または plugin-state サイドカー SQLite を書き込まなくなる。未出荷のタスク
  および plugin-state サイドカー SQLite インポーターは削除される。
- レガシーファイルのインポートは doctor のみで行う。
- バックアップは、コンパクトな SQLite スナップショットと整合性証明を含む 1 つのアーカイブを生成する。
- エージェントワーカーは、ディスク、VFS スクラッチ、または実験的な VFS-only
  ストレージで実行できる。
- 設定と明示的な認証情報ファイルは、唯一の想定される永続的な
  非データベース制御ファイルのままである。
- リポジトリチェックにより、レガシーなランタイムファイルストアの再導入を防ぐ。
