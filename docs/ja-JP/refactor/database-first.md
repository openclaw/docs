---
read_when:
    - OpenClaw のランタイムデータ、キャッシュ、トランスクリプト、タスク状態、スクラッチファイルを SQLite に移行する
    - レガシー JSON または JSONL ファイルから doctor マイグレーションを設計する
    - バックアップ、復元、VFS、またはワーカー ストレージの動作の変更
    - セッションロックの削除、プルーニング、切り詰め、または JSON 互換性パス
summary: SQLite を主要な永続状態およびキャッシュレイヤーにしつつ、設定ファイルによるバックアップを維持するための移行計画
title: データベース優先の状態リファクタリング
x-i18n:
    generated_at: "2026-07-01T20:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# データベース優先の状態リファクタリング

## 決定

2レベルの SQLite レイアウトを使う:

- グローバルデータベース: `~/.openclaw/state/openclaw.sqlite`
- エージェントデータベース: エージェント所有のワークスペース、
  トランスクリプト、VFS、アーティファクト、大きなエージェント単位のランタイム状態ごとに、エージェントあたり1つの SQLite データベース
- 設定はファイルバックのままにする: `openclaw.json` は
  データベースの外に残す。ランタイム認証プロファイルは SQLite に移す。外部プロバイダーまたは CLI
  資格情報ファイルは、OpenClaw のデータベース外で所有者管理のままにする。

グローバルデータベースはコントロールプレーンデータベースである。これはエージェント検出、
共有 Gateway 状態、ペアリング、デバイス/ノード状態、タスクとフローの台帳、Plugin
状態、スケジューラーランタイム状態、バックアップメタデータ、移行状態を所有する。

エージェントデータベースはデータプレーンデータベースである。これはエージェントのセッション
メタデータ、トランスクリプトイベントストリーム、VFS ワークスペースまたはスクラッチ名前空間、ツール
アーティファクト、実行アーティファクト、検索/インデックス可能なエージェントローカルキャッシュデータを所有する。

これにより、大きなエージェントワークスペース、
トランスクリプト、バイナリスクラッチデータを共有 Gateway 書き込みレーンに押し込むことなく、永続的なグローバルビューを1つ得られる。

## 厳格な契約

この移行には、正準ランタイム形状が1つだけある:

- セッション行はセッションメタデータのみを永続化する。これらは
  `transcriptLocator`、トランスクリプトファイルパス、兄弟 JSONL パス、ロックパス、
  pruning メタデータ、ファイル時代の互換性ポインターを永続化してはならない。
- トランスクリプト識別子は常に SQLite 識別子である: `{agentId, sessionId}` に加え、
  プロトコルが必要とする場合は任意のトピックメタデータ。
- `sqlite-transcript://...` はランタイムまたはプロトコルの識別子ではない。新しいコードは
  トランスクリプトロケーターを派生、永続化、渡し、解析、移行してはならない。ランタイムと
  テストには疑似ロケーターを一切含めるべきではない。ドキュメントでは、その文字列を禁止する目的でのみ言及してよい。
- レガシーの `sessions.json`、トランスクリプト JSONL、`.jsonl.lock`、pruning、切り詰め、
  古いセッションパスロジックは doctor の移行/インポートパスにのみ属する。
- レガシーのセッション設定エイリアスは doctor 移行にのみ属する。ランタイムは
  `session.idleMinutes`、`session.resetByType.dm`、または
  別の設定済みエージェント向けのエージェント横断 `agent:main:*` メインセッションエイリアスを解釈しない。
- セッションルーティング識別子は型付きリレーショナル状態である。ホットランタイムと UI パスは
  `sessions.session_scope`、`sessions.account_id`、
  `sessions.primary_conversation_id`、`conversations`、および
  `session_conversations` を読むべきである。古い呼び出し箇所が削除されている間の互換性シャドウを除き、
  プロバイダー識別子のために `session_key` を解析したり
  `session_entries.entry_json` を掘ったりしてはならない。
- `dm` と `direct` のようなチャンネルレベルのダイレクトメッセージマーカーはルーティング
  語彙であり、トランスクリプトロケーターやファイルストア互換ハンドルではない。
- レガシーフックハンドラー設定は doctor の警告/移行サーフェスにのみ属する。
  ランタイムは `hooks.internal.handlers` を読み込んではならない。フックは検出された
  フックディレクトリと `HOOK.md` メタデータのみを通じて実行される。
- ランタイム起動、ホット返信パス、Compaction、リセット、リカバリー、診断、
  TTS、メモリフック、サブエージェント、Plugin コマンドルーティング、プロトコル境界、フックは
  ランタイムを通じて `{agentId, sessionId}` を渡さなければならない。
- テストは `{agentId, sessionId}` を通じて SQLite トランスクリプト行を seed し、アサートするべきである。JSONL パス転送、
  呼び出し元提供ロケーターの保持、またはトランスクリプトファイル互換性だけを証明するテストは、
  doctor インポート、非セッションのサポート/デバッグ materialization、またはプロトコル形状を対象にしない限り削除するべきである。
- `runEmbeddedPiAgent(...)`、準備済みワーカー実行、内側の埋め込み
  試行は、トランスクリプトロケーターを受け取ってはならない。これらは `{agentId, sessionId}` で SQLite トランスクリプト
  マネージャーを開き、そのマネージャーを内部化された
  PI 互換エージェントセッションに渡す。これにより、古い呼び出し元が runner に
  JSON/JSONL トランスクリプトを書かせることはできない。
- Runner 診断はランタイム/キャッシュ/ペイロードのトレースレコードを SQLite に保存しなければならない。
  ランタイム診断は JSONL ファイル上書きノブや汎用
  トランスクリプト JSONL エクスポートヘルパーを公開してはならない。ユーザー向けエクスポートは、
  ファイル名をランタイムに戻さずに、データベース行から明示的な
  アーティファクトを materialize できる。
- 生ストリームロギングは `OPENCLAW_RAW_STREAM=1` と SQLite 診断行を使う。
  古い pi-mono の `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH`、および
  `raw-openai-completions.jsonl` ファイルロガー契約は、OpenClaw
  ランタイムまたはテストの一部ではない。
- QMD メモリインデックス化は SQLite トランスクリプトを markdown ファイルにエクスポートしてはならない。
  QMD は設定済みメモリファイルのみをインデックス化する。セッショントランスクリプト検索は
  SQLite バックのままにする。
- QMD SDK サブパスは、新しいコードでは QMD 専用である。SQLite セッショントランスクリプト
  インデックス化ヘルパーは `memory-core-host-engine-session-transcripts` に置く。QMD
  の再エクスポートは互換性のみであり、ランタイムコードから使ってはならない。
- 組み込みメモリインデックスは、所有するエージェントデータベースに置く。ランタイム設定と
  解決済みランタイム契約は `memorySearch.store.path` を公開してはならない。doctor
  はそのレガシー設定キーを削除し、現在のコードはエージェント
  `databasePath` を内部的に渡す。

実装作業では、doctor/import/export/debug 境界の外に例外なくこれらの文が真になるまで、コードを削除し続けるべきである。

## 目標状態と進捗

### 厳格な目標

- 1つのグローバル SQLite データベースがコントロールプレーン状態を所有する:
  `state/openclaw.sqlite`。
- エージェントごとに1つの SQLite データベースがデータプレーン状態を所有する:
  `agents/<agentId>/agent/openclaw-agent.sqlite`。
- 設定はファイルバックのままにする。`openclaw.json` はこのデータベース
  リファクタリングの一部ではない。
- レガシーファイルは doctor 移行入力のみである。
- ランタイムは、アクティブ状態としてセッションまたはトランスクリプト JSONL を書き込みも読み込みもしない。

### 目標状態

- `not-started`: ファイル時代のランタイムコードがまだアクティブ状態を書き込んでいる。
- `migrating`: doctor/import コードがファイルデータを SQLite に移せる。
- `dual-read`: 一時的なブリッジが SQLite とレガシーファイルの両方を読む。この状態は、
  doctor 専用として明示的に文書化されていない限り、このリファクタリングでは禁止される。
- `sqlite-runtime`: ランタイムは SQLite のみを読み書きする。
- `clean`: レガシーランタイム API とテストが削除され、ガードが
  回帰を防ぐ。
- `done`: ドキュメント、テスト、バックアップ、doctor 移行、changed チェックが
  clean 状態を証明する。

### 現在の状態

- セッション: ランタイムは `clean`。セッション行はエージェント単位のデータベースに置かれ、
  ランタイム API は `{agentId, sessionId}` または `{agentId, sessionKey}` を使い、
  `sessions.json` は doctor 専用のレガシー入力である。
- トランスクリプト: ランタイムは `clean`。トランスクリプトイベント、識別子、スナップショット、
  軌跡ランタイムイベントはエージェント単位のデータベースに置かれる。ランタイムは
  トランスクリプトロケーターや JSONL トランスクリプトパスをもう受け取らない。
- PI 埋め込み runner: `clean`。埋め込み PI 実行、準備済みワーカー、Compaction、
  再試行ループは SQLite セッションスコープを使い、古いトランスクリプトハンドルを拒否する。
- Cron: ランタイムは `clean`。ランタイムは `cron_jobs` と `cron_run_logs` を使う。
  ランタイムテストは SQLite `storeKey` 命名を使い、ファイル時代の cron パスは
  doctor レガシー移行テストにのみ残る。
- タスクレジストリ: `clean`。タスクと Task Flow のランタイム行は
  `state/openclaw.sqlite` に置かれる。未出荷のサイドカー SQLite インポーターは削除済みである。
- Plugin 状態: `clean`。Plugin 状態/blob 行は共有グローバル
  データベースに置かれる。古い plugin-state サイドカー SQLite ヘルパーはガードされている。
- メモリ: 組み込みメモリとセッショントランスクリプトインデックス化は `sqlite-runtime`。
  メモリインデックステーブルはエージェント単位のデータベースに置かれ、Plugin メモリ状態は
  共有 plugin-state 行を使い、レガシーメモリファイルは doctor 移行入力
  またはユーザーワークスペースコンテンツである。
- バックアップ: `sqlite-runtime`。バックアップステージは SQLite スナップショットを圧縮し、ライブ
  WAL/SHM サイドカーを省略し、SQLite 整合性を検証し、バックアップ実行を
  グローバルデータベースに記録する。
- Doctor 移行: 意図的に `migrating`。Doctor はレガシー JSON、
  JSONL、廃止済みサイドカーストアを SQLite にインポートし、移行実行/ソースを記録し、
  成功したソースを削除する。
- E2E スクリプト: ランタイムカバレッジは `clean`。Docker MCP seeding は SQLite
  行を書き込む。runtime-context Docker スクリプトは、doctor 移行 seed の内側でのみ
  レガシー JSONL を作成し、レガシーセッションインデックスパスを明示的に命名する。

### 残作業

- [x] doctor レガシー入力でない限り、cron ランタイムテストのストア変数を `storePath` からリネームする。
      ファイル: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      証明: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] 廃止されたファイル時代のエクスポートテストモックを削除またはリネームする。
      ファイル: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      証明: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context レガシー JSONL seed が doctor 専用であることを明確にする。
      ファイル: `scripts/e2e/session-runtime-context-docker-client.ts`.
      証明: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` は
      `seedBrokenLegacySessionForDoctorMigration` のみを示す。
- [x] スキーマ変更後は Kysely 生成型を整合させる。
      ファイル: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      証明: このパスではスキーマ変更なし。`pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] 触れたストア、コマンド、スクリプトのフォーカステストを再実行する。
      証明: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done` と宣言する前に、changed ゲートまたはリモートの広範な証明を実行する。
      証明: `pnpm check:changed --timed -- <changed extension paths>` は
      一時的な Node 24/pnpm セットアップと、同期された `.git` なしワークスペースに対する
      明示的なパスルーティングの後、Hetzner Crabbox 実行 `run_3f1cabf6b25c` で通過した。

### 回帰させないこと

- トランスクリプトロケーターなし。
- アクティブなセッションファイルなし。
- doctor レガシー移行テストを除き、偽の JSONL テストフィクスチャなし。
- Kysely が期待される場所で生の SQLite アクセスなし。
- 新しいレガシー DB 移行なし。このレイアウトはまだ出荷されていないため、強い理由がない限り
  スキーマバージョンを `1` のままにする。

## コード読解上の前提

この計画を妨げるフォローアップのプロダクト判断はない。実装は
次の前提で進めるべきである:

- このストレージパスでは `node:sqlite` を直接使用し、Node 22+ ランタイムを必須にする。
- 通常の設定ファイルは厳密に 1 つだけ維持する。このリファクタでは、設定、Plugin マニフェスト、Git ワークスペースを SQLite に移動しない。
- ランタイム互換性ファイルは不要。レガシー JSON と JSONL ファイルは移行入力のみ。ブランチローカルの SQLite サイドカーは一度も出荷されていないため、インポートせずに削除する。
- `openclaw doctor --fix` がレガシーファイルからデータベースへの移行ステップを所有する。ランタイム起動と `openclaw migrate` は、レガシー OpenClaw データベースアップグレードパスを持つべきではない。
- 認証情報の互換性も同じルールに従う。ランタイム認証情報は SQLite に置く。古い `auth-profiles.json`、エージェントごとの `auth.json`、共有 `credentials/oauth.json` ファイルは診断移行の入力であり、インポート後に削除する。
- 生成されたモデルカタログ状態はデータベースで保持する。ランタイムコードは `agents/<agentId>/agent/models.json` を書き込んではならない。既存の `models.json` ファイルはレガシー診断入力であり、`agent_model_catalogs` へインポートした後に削除する。
- ランタイムはトランスクリプトロケータを移行、正規化、または橋渡ししてはならない。アクティブなトランスクリプト識別子は SQLite 内の `{agentId, sessionId}`。ファイルパスはレガシー診断入力のみであり、`sqlite-transcript://...` は境界ハンドルとして扱うのではなく、ランタイム、プロトコル、フック、Plugin サーフェスから消える必要がある。
- ランタイムの SQLite トランスクリプト読み取りは、古い JSONL エントリ形状の移行を実行したり、互換性のためにトランスクリプト全体を書き換えたりしない。レガシーエントリの正規化は明示的な診断/インポートユーティリティにとどめる。診断機能はレガシー JSONL トランスクリプトファイルを正規化してから SQLite 行を挿入する。現在のランタイム行は、すでに現在のトランスクリプトスキーマで書き込まれている。軌跡/セッションエクスポートはそれらの行をそのまま読み取り、エクスポート時にレガシー移行を実行してはならない。
- レガシートランスクリプト JSONL の解析/移行ヘルパーは診断専用。ランタイムのトランスクリプト形式コードは、現在の SQLite トランスクリプトコンテキストのみを構築する。診断機能が、行を挿入する前に古い JSONL エントリアップグレードを所有する。
- 以前のランタイム所有の JSONL トランスクリプトストリーミングヘルパーは削除された。診断インポートコードが明示的なレガシーファイル読み取りを所有し、ランタイムのセッション履歴は SQLite 行を読み取る。
- Codex app-server バインディングは、Codex Plugin 状態名前空間の正規キーとして OpenClaw の `sessionId` を使用する。`sessionKey` はルーティング/表示用のメタデータであり、永続的なセッション ID を置き換えたり、トランスクリプトファイル識別子を復活させたりしてはならない。
- コンテキストエンジンは、現在のランタイム契約を直接受け取る。レジストリは、`sessionKey`、`transcriptScope`、または `prompt` を削除するリトライシムでエンジンをラップしてはならない。現在のデータベース優先パラメータを受け入れられないエンジンは、橋渡しされるのではなく明示的に失敗するべきである。
- バックアップ出力は 1 つのアーカイブファイルのままにするべきである。データベース内容は、生のライブ WAL サイドカーではなく、コンパクトな SQLite スナップショットとしてそのアーカイブに入れるべきである。
- トランスクリプト検索は有用だが、最初のデータベース優先版には必須ではない。後で FTS を追加できるようにスキーマを設計する。
- ワーカー実行は、データベース境界が安定するまで設定の背後で実験的なままにするべきである。

## コード読解での所見

現在のブランチは、すでに概念実証段階を過ぎている。共有データベースは存在し、Node `node:sqlite` は小さなランタイムヘルパーを通じて接続されており、以前のストアは現在 `state/openclaw.sqlite` または所有元の `openclaw-agent.sqlite` データベースに書き込む。

残っている作業は SQLite を選ぶことではない。新しい境界をクリーンに保ち、古いファイル世界のように見える互換性形状のインターフェイスを削除することである。

- セッション `storePath` は、もはやランタイム識別子、テストフィクスチャ形状、またはステータスペイロードフィールドではない。ランタイムとブリッジのテストには、もはや `storePath` 契約名は含まれていない。診断/移行コードがそのレガシー語彙を所有する。
- セッション書き込みは、以前のプロセス内 `store-writer.ts` キューを経由しなくなった。代わりに SQLite パッチ書き込みは競合検出と制限付きリトライを使用する。
- レガシーパス検出にはまだ有効な移行用途があるが、ランタイムコードは `sessions.json` とトランスクリプト JSONL ファイルを可能な書き込み先として扱うのをやめるべきである。
- エージェント所有のテーブルは、エージェントごとの SQLite データベースに置く。グローバル DB はレジストリ/コントロールプレーン行を保持する。トランスクリプト識別子は、エージェントごとのトランスクリプト行にある `{agentId, sessionId}`。ランタイムコードはトランスクリプトファイルパスを永続化したり、トランスクリプトロケータを移行したりしてはならない。
- 診断機能はすでに複数のレガシーファイルをインポートしている。クリーンアップは、それを診断機能が呼び出す単一の明示的な移行実装にし、永続的な移行レポートを持たせることである。

実装をブロックしている追加のプロダクト上の質問はない。

## 現在のコード形状

このブランチには、すでに実際の共有 SQLite 基盤がある。

- ランタイムの下限は Node 22+ になりました。`package.json`、CLI ランタイムガード、
  インストーラーのデフォルト、macOS ランタイムロケーター、CI、公開インストールドキュメントがすべて
  一致しています。古い Node 22 互換性レーンは削除されました。
- `src/state/openclaw-state-db.ts` は `openclaw.sqlite` を開き、WAL、
  `synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON` を設定し、
  `src/state/openclaw-state-schema.sql` から派生した
  生成済みスキーマモジュールを適用します。
- Kysely テーブル型とランタイムスキーマモジュールは、コミット済みの `.sql` ファイルから作成した使い捨ての
  SQLite データベースから生成されます。ランタイムコードは、グローバル、エージェント単位、プロキシ
  キャプチャデータベース向けにコピー&ペーストしたスキーマ文字列を保持しなくなりました。
- ランタイムストアは、SQLite 行の形を手作業で二重定義する代わりに、生成された Kysely
  `DB` インターフェイスから選択行型と挿入行型を導出します。生 SQL は引き続き、スキーマ適用、
  pragma、移行専用 DDL に限定されます。
- SQLite スキーマは `user_version = 1` に統合されています。このデータベースレイアウトはまだ出荷されていないためです。
  ランタイムオープナーは現在のスキーマのみを作成します。ファイルからデータベースへのインポートは引き続き doctor コードにあり、
  ブランチローカルのデータベースアップグレードヘルパーは削除されました。
- 所有権境界が正規である場所では、リレーショナルな所有権が強制されます。
  ソース移行行は `migration_runs` からカスケードし、タスク配信状態は
  `task_runs` からカスケードし、トランスクリプト ID 行はトランスクリプトイベントからカスケードします。
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
- 任意の Plugin 所有状態には、ホスト所有の型付きテーブルは割り当てられません。
  インストール済み Plugin は、バージョン付き JSON ペイロードには `plugin_state_entries` を、
  バイト列には `plugin_blob_entries` を使用し、namespace/key の所有権、TTL クリーンアップ、
  バックアップ、Plugin 移行レコードを伴います。ホストがクエリ契約を所有する場合、たとえば
  `plugin_binding_approvals` のようなホスト所有の Plugin オーケストレーション状態には、
  引き続き型付きテーブルを持たせることができます。
- Plugin 移行は、ホストスキーマ移行ではなく、Plugin 所有 namespace 上のデータ移行です。
  Plugin は移行プロバイダーを通じて、自身のバージョン付き state/blob エントリを移行でき、
  ホストは通常の移行台帳にソース/実行ステータスを記録します。新しい Plugin のインストールでは、
  ホスト自身が新しいクロス Plugin 契約の所有権を持つ場合を除き、
  `openclaw-state-schema.sql` を変更する必要はありません。
- `src/state/openclaw-agent-db.ts` は
  `agents/<agentId>/agent/openclaw-agent.sqlite` を開き、データベースを
  グローバル DB に登録し、エージェントローカルのセッション、トランスクリプト、VFS、アーティファクト、キャッシュ、
  メモリインデックステーブルを所有します。共有ランタイムの検出は、呼び出し箇所ごとにそのクエリを再実装する代わりに、
  生成型付きの `agent_databases` レジストリを読み取るようになりました。
- グローバルデータベースとエージェント単位のデータベースは、データベースロール、スキーマバージョン、タイムスタンプ、
  エージェントデータベース用のエージェント ID を含む `schema_meta` 行を記録します。この SQLite スキーマはまだ出荷されていないため、
  レイアウトは引き続き `user_version = 1` のままです。
- エージェント単位のセッション ID には、`session_id` をキーとする正規の `sessions` ルートテーブルができました。
  `session_key`、`session_scope`、`account_id`、
  `primary_conversation_id`、タイムスタンプ、表示フィールド、モデルメタデータ、
  ハーネス ID、親/スポーン連携が、クエリ可能な列として含まれます。`session_routes`
  は `session_key` から現在の `session_id` への一意なアクティブルートインデックスであり、
  ホットリードが重複した `sessions.session_key` 行のどちらかを選ぶことなく、ルートキーを新しい永続セッションへ移動できます。古い
  `session_entries.entry_json` 互換形状ペイロードは、外部キーで永続
  `session_id` ルートにぶら下がります。これはもはや、セッションの唯一のスキーマレベル表現ではありません。
- エージェント単位の外部会話 ID もリレーショナルです。
  `conversations` は正規化されたプロバイダー/アカウント/会話 ID を保存し、
  `session_conversations` は 1 つの OpenClaw セッションを 1 つ以上の外部会話にリンクします。
  これにより、複数の相手を意図的に 1 つのセッションへマッピングできる shared-main DM セッションを、
  `session_key` で偽ることなく扱えます。SQLite は自然なプロバイダー ID の一意性も強制するため、
  同じ channel/account/kind/peer/thread タプルが複数の会話 ID に分岐することはありません。
  shared-main の直接相手は `participant` ロールでリンクされるため、
  1 つの OpenClaw セッションで複数の外部 DM 相手を表現でき、古い相手を曖昧な関連行に格下げしません。
  `sessions.primary_conversation_id` は引き続き、現在の型付き配信ターゲットを指します。
  閉じた routing/status 列は、TypeScript union のみに頼るのではなく SQLite `CHECK` 制約で強制されます。
  ランタイムセッション投影は、型付き session/conversation 列を適用する前に、
  `session_entries.entry_json` から互換ルーティングシャドウをクリアするため、
  古い JSON ペイロードが配信ターゲットを復活させることはできません。
  サブエージェントの告知ルーティングも、型付き SQLite 配信コンテキストを必要とするようになり、
  互換 `SessionEntry` ルートフィールドへフォールバックしなくなりました。
  Gateway `chat.send` の明示的な配信継承は、`origin`/`last*` 互換フィールドではなく、型付き SQLite
  配信コンテキストを読み取ります。
  `tools.effective` も同様に、古い `last*` session-entry シャドウではなく、型付き SQLite
  delivery/routing 行から provider/account/thread コンテキストを導出します。
  システムイベントのプロンプトコンテキストは、`origin` シャドウではなく、型付き配信フィールドから
  channel/to/account/thread フィールドを再構築します。
  共有 `deliveryContextFromSession` ヘルパーと session-to-conversation
  マッパーは、`SessionEntry.origin` を完全に無視するようになりました。ホットルート ID を作成できるのは、
  型付き配信フィールドとリレーショナル会話行のみです。
  ランタイムセッションエントリ正規化は、`entry_json` を永続化または投影する前に `origin` を取り除き、
  インバウンドメタデータは新しい origin シャドウを作る代わりに、型付き channel/chat フィールドと
  リレーショナル会話行を書き込みます。
- トランスクリプトイベント、トランスクリプトスナップショット、軌跡ランタイムイベントは、
  正規のエージェント単位 `sessions` ルートを参照し、セッション削除時にカスケードするようになりました。
  トランスクリプト ID/冪等性行は、引き続き正確なトランスクリプトイベント行からカスケードします。
- memory-core インデックスは、明示的なエージェントデータベーステーブル
  `memory_index_meta`、`memory_index_sources`、`memory_index_chunks`、`memory_embedding_cache`
  を使用するようになり、`memory_index_state` がリビジョン変更を追跡します。
  任意の FTS/vector サイドインデックスは、汎用的な `meta`、`files`、`chunks`、
  `chunks_fts`、`chunks_vec` テーブルではなく、`memory_index_chunks_fts` と
  `memory_index_chunks_vec` という名前になります。正規名は、現在の path/source 行形状と
  シリアライズ済み embedding 互換性を保持します。これらのテーブルは派生/検索キャッシュであり、
  正規のトランスクリプトストレージではありません。メモリワークスペースファイルと設定済みソースから削除して再構築できます。
  出荷済みの汎用名 memory index を開くと、そのメタデータ、ソース、チャンク、embedding キャッシュが
  正規テーブルに移行されます。派生 FTS/vector テーブルは正規名で再構築されます。
- サブエージェント実行のリカバリ状態は、子、リクエスター、コントローラーのセッションキーにインデックスを持つ、
  型付き共有 `subagent_runs` 行に保存されるようになりました。古い
  `subagents/runs.json` ファイルは doctor 移行入力専用です。
- 現在の会話バインディングは、正規化された会話 ID をキーとする型付き共有
  `current_conversation_bindings` 行に保存されるようになり、ターゲット agent/session 列、会話 kind、
  status、有効期限、メタデータが、重複した不透明なバインディングレコードではなくリレーショナル列として保存されます。
  永続バインディングキーには正規化済み会話 kind が含まれるため、direct/group/channel ref は衝突せず、
  SQLite は無効な binding kind/status 値を拒否します。古い
  `bindings/current-conversations.json` ファイルは doctor 移行入力専用です。
- 配信キューのリカバリは、channel、target、account、session、retry、error、platform-send、
  recovery state の型付きキュー列を replay JSON に重ねるようになりました。`entry_json` は
  replay ペイロード、hook、フォーマット用ペイロードを保持しますが、ホットキューの routing/state では型付き列が authoritative です。
- TUI 最終セッション復元ポインターは、ハッシュ化された TUI connection/session scope をキーとする
  型付き共有 `tui_last_sessions` 行に保存されるようになりました。古い TUI JSON ファイルは doctor 移行入力専用です。
- デフォルト TTS 設定は、`speech-core` Plugin 配下をキーとする共有 plugin-state SQLite 行に保存されるようになりました。
  古い `settings/tts.json` ファイルは doctor 移行入力専用です。ランタイムは TTS 設定 JSON ファイルを読み書きしなくなり、
  レガシーパスリゾルバーは doctor 移行モジュールにあります。
- シークレットターゲットメタデータは、すべての認証情報ターゲットを設定ファイルであるかのように扱うのではなく、
  store について述べるようになりました。`openclaw.json` は引き続き config store です。
  auth-profile ターゲットは、プロバイダー形状の認証情報を JSON ペイロードとして保持する型付き SQLite
  `auth_profile_stores` 行を使用します。
- シークレット監査は、廃止されたエージェント単位の `auth.json` ファイルをスキャンしなくなりました。
  doctor が、そのレガシーファイルに関する警告、インポート、削除を所有します。
- レガシー auth profile パスヘルパーは、doctor レガシーコードに移動しました。Core auth
  profile パスヘルパーは、`auth-profiles.json` や `auth-state.json` ランタイムパスではなく、
  SQLite auth-store ID と表示場所を公開します。
- サブエージェント実行リカバリと OpenRouter モデル能力キャッシュのランタイムモジュールは、
  SQLite スナップショットリーダー/ライターを、doctor 専用のレガシー JSON インポートヘルパーから分離するようになりました。
  OpenRouter 能力は、不透明なキャッシュ blob 1 つやプロバイダー固有のホストテーブルではなく、
  `provider_id = "openrouter"` 配下の型付き汎用 `model_capability_cache` 行を使用します。
  サブエージェント実行の `taskName` は、型付き `subagent_runs.task_name` 列に保存されます。
  `payload_json` のコピーは replay/debug データであり、ホット表示や検索フィールドのソースではありません。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` は、エージェントデータベースの
  `vfs_entries` テーブル上に SQLite VFS を実装します。ディレクトリ読み取り、再帰的エクスポート、削除、リネームは、
  namespace 全体をスキャンしたり `LIKE` パスマッチングに頼ったりする代わりに、
  インデックス付き `(namespace, path)` プレフィックス範囲を使用します。
- `src/agents/runtime-worker.entry.ts` は、ワーカー向けに実行単位の SQLite VFS、ツールアーティファクト、
  実行アーティファクト、スコープ付きキャッシュストアを作成します。
- ワークスペースブートストラップ完了マーカーは、`.openclaw/workspace-state.json` ではなく、
  解決済みワークスペースパスをキーとする型付き共有 `workspace_setup_state` 行に保存されるようになりました。
  ランタイムはレガシーワークスペースマーカーを読み取りも再書き込みもしなくなり、ヘルパー API はストレージ ID を導出するためだけに
  偽の `.openclaw/setup-state` パスを渡し回さなくなりました。
- exec 承認は、型付き共有 SQLite `exec_approvals_config` singleton 行に保存されるようになりました。
  doctor はレガシー `~/.openclaw/exec-approvals.json` をインポートします。
  ランタイム書き込みは、そのファイルを作成、再書き込み、またはアクティブな store location として報告しなくなりました。
  macOS コンパニオンは同じ `state/openclaw.sqlite` テーブル行を読み書きします。ディスク上には Unix
  prompt socket のみを保持します。これは IPC であり、永続ランタイム状態ではないためです。
- デバイス ID、デバイス認証、ブートストラップのランタイムモジュールは、
  SQLite スナップショットリーダー/ライターを doctor 専用のレガシー JSON インポートヘルパーから分離するようになりました。
  デバイス ID は型付き `device_identities` 行を使用し、デバイス認証トークンは型付き
  `device_auth_tokens` 行を使用します。デバイス認証の書き込みは、トークンテーブルを切り詰める代わりに
  device/role ごとに行を突き合わせ、ランタイムは単一トークン更新を古い全体 store アダプター経由でルーティングしなくなりました。レガシー
  version-1 JSON ペイロードは doctor の import/export 形状としてのみ存在します。
- GitHub Copilot トークン交換キャッシュは、`github-copilot/token-cache/default` 配下の共有 SQLite plugin-state テーブルを使用します。これはプロバイダー所有のキャッシュ状態であるため、ホストスキーマテーブルは意図的に追加しません。
- GitHub Copilot compaction は、`openclaw-compaction-*.json` ワークスペースサイドカーをもう書き込みません。ハーネスは追跡対象の SDK セッションに対して SDK 履歴 compaction RPC を呼び出し、OpenClaw は互換性マーカーファイルではなく SQLite に永続的なセッション/トランスクリプト状態を保持します。
- 共有 Swift ランタイム（`OpenClawKit`）は、デバイス ID とデバイス認証に同じ `state/openclaw.sqlite` 行を使用します。macOS アプリヘルパーは、2 つ目の JSON または SQLite パスを所有せず、共有 SQLite ヘルパーをインポートします。残存するレガシー `identity/device.json` は、doctor が SQLite にインポートするまで ID 作成をブロックし、TypeScript と Android の起動ゲートと一致します。
- Android デバイス ID は、型付きの `state/openclaw.sqlite#table/device_identities` 行に保存された、同じ TypeScript 互換のキーマテリアルを使用します。`openclaw/identity/device.json` を読み書きすることはありません。残存するレガシーファイルは、doctor が SQLite にインポートするまで起動をブロックします。
- Android のキャッシュ済みデバイス認証トークンも、型付きの `state/openclaw.sqlite#table/device_auth_tokens` 行を使用し、TypeScript と Swift と同じ version-1 トークンセマンティクスを共有します。ランタイムは `SecurePrefs` の `gateway.deviceToken*` 互換キーをもう読みません。これらは migration/doctor ロジック専用です。
- Android 通知の最近のパッケージ履歴は、型付きの `android_notification_recent_packages` 行を使用します。ランタイムは古い SharedPreferences CSV キーの移行や読み取りをもう行いません。
- レガシー `identity/device.json` が存在する場合、SQLite ID 行が無効な場合、または SQLite ID ストアを開けない場合、デバイス ID 作成はフェイルクローズします。doctor が先にそのファイルをインポートして削除するため、ランタイム起動が移行前にペアリング ID を黙ってローテーションすることはありません。
- デバイス ID の選択は SQLite 行キーであり、JSON ファイルロケーターではありません。テストと Gateway ヘルパーは明示的な ID キーを渡します。廃止された `identity/device.json` ファイル名を知っているのは、doctor 移行とフェイルクローズ起動ゲートだけです。
- セッションリセット互換性は、現在 doctor 設定移行にあります。`session.idleMinutes` は `session.reset.idleMinutes` に移動され、`session.resetByType.dm` は `session.resetByType.direct` に移動され、ランタイムのリセットポリシーは正規のリセットキーのみを読みます。
- レガシー設定互換性は、現在 `src/commands/doctor/` 配下にあります。通常の `readConfigFileSnapshot()` 検証は doctor のレガシー検出器をインポートせず、レガシー問題に注釈を付けません。`runDoctorConfigPreflight()` は doctor の修復/報告用にそれらの問題を追加します。doctor 設定フローは `src/commands/doctor/legacy-config.ts` をインポートし、古い OAuth プロファイル ID 修復は `src/commands/doctor/legacy/oauth-profile-ids.ts` 配下にあります。
- doctor 以外のコマンドは、レガシー設定修復を自動実行しません。たとえば、`openclaw update --channel` は無効なレガシー設定で失敗し、doctor 移行コードを黙ってインポートするのではなく、ユーザーに doctor の実行を求めます。
- Web push、APNs、Voice Wake、更新チェック、設定ヘルスは、サブスクリプション、VAPID キー、Node 登録、トリガー行、ルーティング行、更新通知状態、設定ヘルスエントリに対して、不透明な JSON blob 全体ではなく型付き共有 SQLite テーブルを使用するようになりました。Web push と APNs のスナップショット書き込みは、テーブルをクリアするのではなく、主キーでサブスクリプション/登録を調整するようになりました。設定ヘルスも設定パスで同じ処理を行います。それらのランタイムモジュールは、SQLite スナップショットのリーダー/ライターを doctor 専用のレガシー JSON インポートヘルパーから分離したままにします。
- Node ホスト設定は、現在共有 SQLite データベースの型付きシングルトン行を使用します。doctor は通常のランタイム使用前に古い `node.json` ファイルをインポートします。
- デバイス/Node ペアリング、チャネルペアリング、チャネル allowlist、bootstrap 状態は、不透明な JSON blob 全体ではなく型付き SQLite 行を使用するようになりました。Plugin バインディング承認と Cron ジョブ状態も同じ分離に従います。ランタイムモジュールは SQLite バックエンドの操作と中立的なスナップショットヘルパーを公開し、ペアリング/bootstrap と Plugin バインディング承認のスナップショット書き込みは、テーブルを切り詰めるのではなく主キーで行を調整します。一方、doctor は `src/commands/doctor/legacy/*` モジュールを通じて古い JSON ファイルをインポート/削除します。
- インストール済み Plugin レコードは、現在 SQLite のインストール済み Plugin インデックスにあります。ランタイム設定の読み書きは、古い `plugins.installs` authored-config データをもう移行または保持しません。doctor は通常のランタイム使用前に、そのレガシー設定形状を SQLite にインポートします。
- QQBot 資格情報復旧スナップショットは、現在 `qqbot/credential-backups` 配下の SQLite Plugin 状態にあります。ランタイムは `qqbot/data/credential-backup*.json` をもう書き込みません。QQBot doctor コントラクトは、アクティブな状態ディレクトリからそれらのレガシーバックアップファイルをインポートしてアーカイブします。
- Gateway リロード計画は、内部 `installedPluginIndex.installRecords.*` diff 名前空間配下の SQLite インストール済み Plugin インデックススナップショットを比較します。ランタイムのリロード判断は、それらの行を偽の `plugins.installs` 設定オブジェクトでラップしなくなりました。
- Matrix 名前付きアカウント資格情報のアップグレードは、ランタイム読み取り中にはもう行われません。単一/デフォルトの Matrix アカウントを解決できる場合、doctor が古いトップレベルの `credentials/matrix/credentials.json` のリネームを所有します。
- コアのペアリングおよび Cron ランタイムモジュールは、レガシー JSON パスビルダーをもうエクスポートしません。doctor 所有のレガシーモジュールは、インポートテストと移行専用に `pending.json`、`paired.json`、`bootstrap.json`、`cron/jobs.json` のソースパスを構築します。レガシー Cron ジョブ形状の正規化と Cron 実行ログのインポートは、`src/commands/doctor/legacy/cron*.ts` 配下にあります。
- `src/commands/doctor/legacy/runtime-state.ts` は、Node ホスト設定を含むレガシー JSON 状態ファイルを doctor から SQLite にインポートします。新しいレガシーファイルインポーターは `src/commands/doctor/legacy/` 配下に置かれます。
- `src/commands/doctor/state-migrations.ts` は、レガシー `sessions.json` と `*.jsonl` トランスクリプトを SQLite に直接インポートし、成功したソースを削除します。ルートのレガシートランスクリプトを `agents/<agentId>/sessions/*.jsonl` 経由でステージングしたり、インポート前に正規 JSONL ターゲットを作成したりすることはもうありません。
- 状態整合性 doctor チェックは、レガシーセッションディレクトリをスキャンしたり、孤立 JSONL 削除を提案したりしなくなりました。レガシートランスクリプトファイルは移行入力のみであり、移行ステップがインポートとソース削除を所有します。
- レガシーサンドボックスレジストリのインポートは `src/commands/doctor/legacy/sandbox-registry.ts` 配下にあります。アクティブなサンドボックスレジストリの読み書きは SQLite のみのままです。
- レガシーセッショントランスクリプトのヘルス/インポート修復は `src/commands/doctor/legacy/session-transcript-health.ts` 配下にあります。ランタイムコマンドモジュールは JSONL トランスクリプト解析やアクティブブランチ修復コードをもう持ちません。

完了した統合/削除のハイライト:

- Plugin 状態は、共有 `state/openclaw.sqlite` データベースを使うようになりました。古い
  ブランチローカルの `plugin-state/state.sqlite` サイドカーインポーターは、
  その SQLite レイアウトが一度も出荷されなかったため削除されました。プローブ/テストヘルパーは、Plugin 状態専用の SQLite パスを公開する代わりに、共有
  `databasePath` を報告します。
- タスクおよびタスクフローのランタイムテーブルは、`tasks/runs.sqlite` と
  `tasks/flows/registry.sqlite` ではなく、共有
  `state/openclaw.sqlite` データベースに配置されるようになりました。古いサイドカーインポーターは、同じく未出荷レイアウトであるため削除されました。
- `src/config/sessions/store.ts` は、受信メタデータ、ルート更新、updated-at 読み取りに
  `storePath` を必要としなくなりました。コマンド永続化、CLI
  セッションクリーンアップ、サブエージェント深度、認証オーバーライド、トランスクリプトセッション
  ID は、エージェント/セッション行 API を使います。書き込みは、楽観的競合リトライ付きの SQLite 行パッチとして適用されます。
- セッションターゲット解決は、従来の
  `sessions.json` パスではなく、エージェントごとのデータベースターゲットを公開するようになりました。共有 Gateway、ACP メタデータ、診断ルート修復、
  `openclaw sessions` は、`agent_databases` と設定済みエージェントを列挙します。
- Gateway セッションルーティングは `resolveGatewaySessionDatabaseTarget` を使うようになりました。返されるターゲットは、従来のセッションストアファイルパスの代わりに、
  `databasePath` と候補 SQLite 行キーを持ちます。
- チャネルセッションランタイム型は、updated-at 読み取り、受信メタデータ、最終ルート更新用に
  `{agentId, sessionKey}` を公開するようになりました。古い
  `saveSessionStore(storePath, store)` 互換型はなくなりました。
- Plugin ランタイム、拡張 API、`config/sessions` バレルサーフェスは、Plugin コードを SQLite バックのセッション行ヘルパーへ誘導するようになりました。ルートライブラリ互換エクスポート（`loadSessionStore`、`saveSessionStore`、`resolveStorePath`）は、既存利用者向けの非推奨シムとして残ります。古い
  `resolveLegacySessionStorePath` ヘルパーはなくなりました。従来の `sessions.json` パス構築は、移行とテストフィクスチャ内だけにあります。
- `src/config/sessions/session-entries.sqlite.ts` は、正規セッションエントリをエージェントごとのデータベースに保存し、行レベルの読み取り/アップサート/削除パッチをサポートするようになりました。ランタイムのアップサート/パッチ/削除は、大文字小文字のバリアントをスキャンしたり、従来のエイリアスキーを刈り込んだりしなくなりました。正規化は診断が担います。単体 JSON インポートヘルパーはなくなり、移行マージはセッションテーブル全体を置き換えるのではなく、より新しい行をアップサートします。公開読み取り/一覧/読み込みヘルパーは、型付きの `sessions` 行と `conversations` 行からホットセッションメタデータを投影します。
  `entry_json` は互換/デバッグ用のシャドウであり、型付きセッション ID や配信コンテキストを失うことなく、古くなったり無効になったりする場合があります。
- `src/config/sessions/delivery-info.ts` は、型付きのエージェント別
  `sessions` + `conversations` + `session_conversations` 行から配信コンテキストを解決するようになりました。
  `session_entries.entry_json` からランタイム配信 ID を再構築しなくなりました。型付き会話行がない場合は、ランタイムのフォールバックではなく、診断の移行/修復問題です。
- 保存済みセッションのリセット判断は、型付きの `sessions.session_scope`、
  `sessions.chat_type`、`sessions.channel` メタデータを優先するようになりました。`sessionKey` 解析は、コマンドターゲット上の明示的なスレッド/トピックサフィックスにのみ残ります。グループ対直接のリセット分類は、キー形状から得られなくなりました。
- セッション一覧/ステータス表示の分類は、型付きチャットメタデータと
  Gateway セッション種別を使うようになりました。`session_key` 内の `:group:` または `:channel:` 部分文字列を、永続的なグループ/直接の真実として扱わなくなりました。
- サイレント返信ポリシーの選択は、明示的な会話タイプまたはサーフェスメタデータのみを使うようになりました。
  `session_key` 部分文字列から直接/グループポリシーを推測しなくなりました。
- セッション表示モデル解決は、`session_key` から分割して取り出すのではなく、SQLite セッションデータベースターゲットからエージェント ID を受け取るようになりました。
- エージェント間アナウンスターゲットのハイドレーションは、型付き `sessions.list`
  `deliveryContext` のみを使うようになりました。従来の `origin`、ミラーされた `last*` フィールド、または `session_key` 形状から、チャネル/アカウント/スレッドルーティングを復元しなくなりました。
- `sessions_send` のスレッドターゲット拒否は、型付き SQLite ルーティングメタデータを読むようになりました。ターゲットキーからスレッドサフィックスを解析して、ターゲットを拒否または受け入れることはなくなりました。
- グループスコープのツールポリシー検証は、現在または生成されたセッションの型付き SQLite 会話ルーティングを読むようになりました。`sessionKey` のデコードによるグループ/チャネル ID を信頼しなくなりました。呼び出し元提供のグループ ID は、それを保証する型付きセッション行がない場合に破棄されます。
- チャネルモデルオーバーライドの照合は、明示的なグループおよび親会話メタデータを使うようになりました。
  `parentSessionKey` から親会話 ID をデコードしなくなりました。
- 保存済みモデルオーバーライドの継承は、型付きセッションコンテキストからの明示的な親セッションキーを必要とするようになりました。
  `sessionKey` 内の `:thread:` または `:topic:` サフィックスから親オーバーライドを導出しなくなりました。
- 古いセッションスレッド情報ラッパーと読み込み済み Plugin スレッドパーサーはなくなりました。ランタイムコードは
  `config/sessions/thread-info` をインポートしません。
- チャネル会話ヘルパーは、フルセッションキー解析ブリッジを公開しなくなりました。コアは引き続き
  `resolveSessionConversation(...)` を通じてプロバイダー所有の生の会話 ID を正規化しますが、
  `sessionKey` からルート事実を再構築しません。
- 完了配信、送信ポリシー、タスクメンテナンスは、`session_key` 形状からチャットタイプを導出しなくなりました。古いチャットタイプキーパーサーは削除されました。これらのパスには、型付きセッションメタデータ、型付き配信コンテキスト、または明示的な配信ターゲット語彙が必要です。
- セッション一覧/ステータス、診断、承認アカウントバインド、TUI Heartbeat
  フィルタリング、使用量サマリーは、プロバイダー/アカウント/スレッド/表示ルーティングのために
  `SessionEntry.origin` を探索しなくなりました。残っているランタイムの
  `origin` 読み取りは、セッションではない概念または現在ターンの配信オブジェクトだけです。
- 承認リクエストのネイティブ会話ルックアップは、型付きのエージェント別セッションルーティング行を読むようになりました。
  `sessionKey` からチャネル/グループ/スレッド会話 ID を解析しなくなりました。型付きメタデータがない場合は、移行/修復問題です。
- Gateway の session changed/chat/session イベントペイロードは、
  `SessionEntry.origin` または `last*` ルートシャドウをエコーしなくなりました。クライアントは型付きの
  `channel`、`chatType`、`deliveryContext` を受け取ります。
- Heartbeat 配信解決は、型付き SQLite
  `deliveryContext` を直接受け取れるようになりました。Heartbeat ランタイムは、現在のルーティングのために互換
  `session_entries` シャドウに依存する代わりに、エージェント別セッション配信行を渡します。
- Cron 分離エージェント配信ターゲット解決も、互換エントリペイロードへフォールバックする前に、型付きのエージェント別セッション配信行から現在のルートをハイドレートします。
- サブエージェントアナウンス origin 解決は、型付きの要求元セッション配信コンテキストを
  `loadRequesterSessionEntry` に通し、互換 `last*`/`deliveryContext` シャドウよりもその行を優先するようになりました。
- 受信セッションメタデータ更新は、まず型付きのエージェント別配信行に対してマージするようになりました。古い
  `SessionEntry` 配信フィールドは、型付き会話行が存在しない場合のみフォールバックです。
- 再起動/更新配信抽出は、`sessionKey` から解析されたトピック/スレッド断片よりも、型付き SQLite 配信
  `threadId` を優先するようになりました。解析は、従来のスレッド形状キー向けのフォールバックに限られます。
- フックエージェントコンテキストのチャネル ID は、型付き SQLite 会話 ID を優先し、その次に明示的なメッセージメタデータを使うようになりました。
  `sessionKey` からプロバイダー/グループ/チャネル断片を解析しなくなりました。
- Gateway `chat.send` の外部ルート継承は、
  `sessionKey` の断片からチャネル/直接/グループスコープを推測する代わりに、型付き SQLite セッションルーティングメタデータを読むようになりました。チャネルスコープのセッションは、型付きセッションチャネルとチャットタイプが保存済み配信コンテキストと一致する場合にのみ継承します。共有メインセッションは、より厳格な CLI/クライアントメタデータなしルールを維持します。
- 再起動センチネルのウェイクおよび継続ルーティングは、Heartbeat ウェイクまたはルーティング済みエージェントターン継続をキューに入れる前に、型付き SQLite 配信/ルーティング行を読むようになりました。セッションエントリ JSON シャドウから配信コンテキストを再構築しなくなりました。
- Gateway `tools.effective` コンテキスト解決は、プロバイダー、アカウント、ターゲット、スレッド、返信モード入力のために、型付き SQLite 配信/ルーティング行を読むようになりました。古い
  `session_entries.entry_json` origin シャドウからこれらのホットルーティングフィールドを復元しなくなりました。
- リアルタイム音声コンサルトルーティングは、型付きのエージェント別 SQLite セッション行から親/通話配信を解決するようになりました。埋め込みエージェントメッセージルートを選ぶ際に、互換
  `SessionEntry.deliveryContext` シャドウへフォールバックしなくなりました。
- ACP 生成 Heartbeat リレーと親ストリームルーティングは、型付き SQLite セッション行から親配信を読むようになりました。互換セッションエントリシャドウから親配信コンテキストを再構築しなくなりました。
- セッション配信ルート保持は、型付きチャットメタデータと永続化済み配信列に従うようになりました。
  `sessionKey` からチャネルヒント、直接/メインマーカー、スレッド形状を抽出しなくなりました。内部ウェブチャットルートは、SQLite にそのセッションの型付き/永続化済み配信 ID がすでにある場合にのみ、外部ターゲットを継承します。
- 汎用セッション配信抽出は、正確な型付き SQLite セッション配信行だけを読むようになりました。スレッド/トピックサフィックスを解析したり、スレッド形状キーからベースセッションキーへフォールバックしたりしなくなりました。
- 返信ディスパッチ、再起動センチネル復旧、リアルタイム音声コンサルトルーティングは、スレッドルーティングに正確な型付き SQLite セッション/会話行を使うようになりました。スレッド形状のセッションキーを解析して、スレッド ID やベースセッション配信コンテキストを復元しなくなりました。
- 埋め込み PI 履歴制限は、プロバイダー、チャットタイプ、ピア ID に、型付き SQLite セッションルーティング投影（`sessions` + 主
  `conversations`）を使うようになりました。`sessionKey` からプロバイダー、DM、グループ、スレッド形状を解析しなくなりました。
- Cron ツール配信推論は、明示的な配信または現在の型付き配信コンテキストのみを使うようになりました。
  `agentSessionKey` からチャネル、ピア、アカウント、スレッドターゲットをデコードしなくなりました。
- ランタイムセッション行は、古い `lastProvider` ルートエイリアスを持たなくなりました。
  ヘルパーとテストは型付きの `lastChannel` と `deliveryContext` フィールドを使います。古いルートエイリアスや永続化済み `origin` シャドウを変換すべき場所は、診断移行だけです。
- トランスクリプトイベント、VFS 行、ツール成果物行は、エージェント別データベースへ書き込むようになりました。未出荷のグローバルトランスクリプトファイルマッピングテーブルはなくなりました。診断は、従来のソースパスを永続的な移行行に記録します。
- ランタイムトランスクリプト検索は、JSONL バイトオフセットをスキャンしたり、従来のトランスクリプトファイルをプローブしたりしなくなりました。Gateway チャット/メディア/履歴パスは、SQLite からトランスクリプト行を読みます。セッション JSONL は、ランタイム状態やエクスポート形式ではなく、従来の診断入力にすぎません。
- トランスクリプトの親関係とブランチ関係は、パス風の
  `agent-db:...transcript_events...` ロケーター文字列ではなく、SQLite トランスクリプトヘッダー内の構造化
  `parentTranscriptScope: {agentId, sessionId}` メタデータを使います。
- トランスクリプトマネージャー契約は、暗黙的に永続化される
  `create(cwd)` または `continueRecent(cwd)` コンストラクターを公開しなくなりました。永続化済みトランスクリプトマネージャーは、明示的な `{agentId, sessionId}` スコープで開かれます。スコープなしのまま残るのは、テストおよび純粋なトランスクリプト変換用のインメモリマネージャーだけです。
- ランタイムトランスクリプトストア API は、ファイルシステムパスではなく SQLite スコープを解決します。古い
  `resolve...ForPath` ヘルパーと未使用の `transcriptPath` 書き込みオプションは、ランタイム呼び出し元からなくなりました。
- ランタイムセッション解決は `{agentId, sessionId}` を使うようになり、外部境界向けに
  `sqlite-transcript://<agent>/<session>` 文字列を導出してはなりません。従来の絶対 JSONL パスは、診断移行入力に限られます。
- ネイティブフックリレーの直接ブリッジレコードは、リレー ID をキーとする型付き共有
  `native_hook_relay_bridges` 行に配置されるようになりました。ランタイムは、これらの短命なブリッジレコードのために
  `/tmp` JSON レジストリや不透明な汎用レコードを書き込まなくなりました。
- `runEmbeddedPiAgent(...)` は、トランスクリプトロケーターパラメーターを持たなくなりました。
  準備済みワーカーディスクリプターも transcript ロケーターを省略するようになりました。ランタイムセッション
  状態とキュー済みフォローアップ実行は、派生 transcript ハンドルではなく `{agentId, sessionId}` を保持します。
- 埋め込み Compaction は `agentId` と `sessionId` から SQLite スコープを取得するようになりました。
  Compaction フック、context-engine 呼び出し、CLI 委譲、プロトコル応答は、派生した `sqlite-transcript://...` ハンドルを受け取ってはなりません。エクスポート/デバッグコードは
  行から明示的なユーザー成果物を具体化できますが、汎用的なセッション JSONL エクスポートパスを提供したり、ファイル名をランタイム
  アイデンティティへ戻したりはしません。
- `/export-session` は SQLite から transcript 行を読み取り、要求された
  スタンドアロン HTML ビューのみを書き込みます。埋め込みビューアーは、それらの行からセッション JSONL を再構築したり
  ダウンロードしたりしなくなりました。
- context-engine 委譲は、エージェントアイデンティティを復元するために transcript ロケーターを解析しなくなりました。準備済みランタイムコンテキストは、解決済みの `agentId`
  を組み込み Compaction アダプターへ渡します。
- transcript 書き換えとライブ tool-result 切り詰めは、`{agentId, sessionId}` によって
  transcript 状態を読み取り永続化するようになり、transcript-update イベントペイロード用の一時
  ロケーターを派生しません。
- transcript-state ヘルパーサーフェスには、ロケーターベースの
  `readTranscriptState`、`replaceTranscriptStateEvents`、`persistTranscriptStateMutation` バリアントがなくなりました。ランタイム呼び出し元は
  `{agentId, sessionId}` API を使用する必要があります。Doctor インポートは明示的なファイル
  パスでレガシーファイルを読み取り、SQLite 行を書き込みます。ロケーター文字列は移行しません。
- ランタイム session-manager コントラクトは `open(locator)`、
  `forkFrom(locator)`、`setTranscriptLocator(...)` を公開しなくなりました。永続化セッション
  マネージャーは `{agentId, sessionId}` のみで開きます。list/fork ヘルパーは transcript manager
  ファサードではなく、行指向のセッション API とチェックポイント API にあります。
- Gateway transcript reader API はスコープ優先です。これらは
  `{agentId, sessionId}` を受け取り、誤ってランタイムアイデンティティになり得る位置引数の transcript ロケーターを
  受け付けません。アクティブ transcript ロケーター解析はなくなりました。レガシーソースパスは doctor インポートコードによってのみ読み取られます。
- transcript update イベントもスコープ優先です。`emitSessionTranscriptUpdate`
  は裸のロケーター文字列を受け付けなくなり、リスナーはハンドルを解析せずに
  `{agentId, sessionId}` でルーティングします。
- Gateway session-message ブロードキャストは、transcript ロケーターではなく、エージェント/セッション
  スコープからセッションキーを解決します。古い transcript-locator-to-session
  キー resolver/cache はなくなりました。
- Gateway session-history SSE は、エージェント/セッションスコープでライブ更新をフィルタリングします。ストリームが更新を受け取るべきかを判断するために、
  transcript ロケーター候補、realpath、ファイル形状の
  transcript アイデンティティを canonicalize しなくなりました。
- セッションライフサイクルフックは、`session_end` で transcript ロケーターを派生または公開しなくなりました。フック利用者は `sessionId`、`sessionKey`、次セッション
  ID、エージェントコンテキストを受け取ります。transcript ファイルはライフサイクル
  コントラクトの一部ではありません。
- リセットフックも transcript ロケーターを派生または公開しなくなりました。
  `before_reset` ペイロードは復元済み SQLite メッセージとリセット
  理由を保持し、セッションアイデンティティはフックコンテキスト内に留まります。
- エージェントハーネスリセットは transcript ロケーターを受け付けなくなりました。リセットディスパッチは
  `sessionId`/`sessionKey` と理由でスコープされます。
- エージェント拡張セッション型は `transcriptLocator` を公開しなくなりました。拡張は、ファイル形状の transcript アイデンティティに手を伸ばすのではなく、
  セッションコンテキストとランタイム API を使用する必要があります。
- Plugin Compaction フックは transcript ロケーターを公開しなくなりました。フックコンテキストには
  すでにセッションアイデンティティが含まれており、transcript 読み取りはファイル形状のハンドルではなく SQLite
  スコープ対応 API を通す必要があります。
- `before_agent_finalize` フックは、ネイティブフックリレーペイロードを含め、
  `transcriptPath` を公開しなくなりました。finalization フックはセッションコンテキストのみを使用します。
- Gateway リセット応答は、返されるエントリ上に transcript ロケーターを合成しなくなりました。
  リセットは SQLite transcript 行を作成し、クリーンな
  セッションエントリを返し、transcript アクセスはスコープ対応 reader に委ねます。
- 埋め込み実行と Compaction 結果は、セッション会計用の transcript ロケーターを公開しなくなりました。自動 Compaction は、アクティブな `sessionId`、
  Compaction カウンター、トークンメタデータのみを更新します。
- 埋め込み試行結果は `transcriptLocatorUsed` を返さなくなり、
  context-engine `compact()` 結果も transcript ロケーターを返さなくなりました。
  ランタイム再試行ループは後続の `sessionId` のみを受け付けます。
- delivery-mirror transcript append 結果は transcript
  ロケーターを返さなくなりました。呼び出し元は追加された `messageId` を取得し、transcript update シグナルは
  SQLite スコープを使用します。
- 親セッション fork ヘルパーは fork された `sessionId` のみを返します。サブエージェント
  準備は、子エージェント/セッションスコープをエンジンへ渡します。
- CLI runner パラメーターと履歴 reseeding は transcript ロケーターを受け付けなくなりました。
  CLI 履歴読み取りは、`{agentId,
sessionId}` とセッションキーコンテキストから SQLite transcript スコープを解決します。
- CLI と embedded-runner テストフィクスチャは、アクティブセッションを `*.jsonl` ファイルのように見せかけたり、
  `sqlite-transcript://...` 文字列をランタイムパラメーター経由で渡したりする代わりに、セッション ID で SQLite transcript 行を seed および read するようになりました。
- セッション tool-result guard イベントは、インメモリマネージャーに派生ロケーターがない場合でも、既知のセッションスコープから emit します。そのテストはアクティブな
  `/tmp/*.jsonl` transcript ファイルを偽装しなくなりました。
- BTW と compaction-checkpoint ヘルパーは、SQLite スコープで
  transcript 行を読み取り fork するようになりました。チェックポイントメタデータはセッション ID と leaf/entry ID
  のみを保存するようになり、派生ロケーターはチェックポイントペイロードに書き込まれなくなりました。
- Gateway transcript-key lookup はプロトコル
  境界で SQLite transcript スコープを使用し、transcript ファイル名を realpath または stat しなくなりました。
- 自動 Compaction transcript rotation は、SQLite transcript store を通じて後続 transcript 行を直接書き込みます。セッション行は
  後続セッションアイデンティティのみを保持し、永続 JSONL パスや永続ロケーターは保持しません。
- 埋め込み context-engine Compaction は SQLite 命名の transcript rotation
  ヘルパーを使用します。rotation テストは JSONL 後続パスを構築したり、
  アクティブセッションをファイルとしてモデル化したりしなくなりました。
- 管理対象の送信画像保持は、ファイルシステム stat 呼び出しではなく、
  SQLite transcript stats から transcript-message キャッシュにキーを付けます。
- ランタイムセッションロックとスタンドアロンのレガシー `.jsonl.lock` doctor
  レーンは削除されました。
- Microsoft Teams ランタイム barrel と公開 plugin SDK は、古い file-lock ヘルパーを再エクスポートしなくなりました。永続 Plugin 状態パスは SQLite-backed です。
- セッション age/count pruning と明示的セッションクリーンアップは削除されました。
  Doctor がレガシーインポートを所有します。古いセッションは明示的にリセットまたは削除されます。
- Doctor 整合性チェックは、レガシー JSONL ファイルを SQLite セッション行の有効なアクティブ
  transcript として数えなくなりました。アクティブ transcript ヘルスは SQLite のみです。
  レガシー JSONL ファイルは migration/orphan-cleanup 入力として報告されます。
- Doctor は `agents/<agent>/sessions/` を必須ランタイム
  状態として扱わなくなりました。そのディレクトリがすでに存在する場合にのみ、レガシーインポート
  または orphan-cleanup 入力としてスキャンします。
- Gateway `sessions.resolve`、セッション patch/reset/compact パス、サブエージェント
  spawning、fast abort、ACP メタデータ、heartbeat-isolated セッション、TUI
  patching は、通常のランタイム作業の副作用としてレガシーセッションキーを移行または pruning しなくなりました。
- CLI コマンドセッション解決は、`storePath` ではなく所有する `agentId` を返すようになり、通常の
  `--to` または `--session-id` 解決中にレガシー main-session 行をコピーしなくなりました。レガシー main-row canonicalization は
  doctor のみの責務です。
- ランタイムサブエージェント depth 解決は `sessions.json` または JSON5
  セッションストアを読み取らなくなりました。エージェント ID で SQLite `session_entries` を読み取り、レガシー
  depth/session メタデータは doctor インポートパスを通じてのみ入ります。
- 認証プロファイルセッション overrides は、ファイル形状の session-store ランタイムを lazy-load するのではなく、直接の `{agentId, sessionKey}`
  行 upsert を通じて永続化されます。
- auto-reply verbose gating とセッション update ヘルパーは、セッションアイデンティティで SQLite
  セッション行を read/upsert するようになり、永続行状態に触れる前にレガシー store path を
  必要としなくなりました。
- command-run session metadata ヘルパーは、entry-oriented な名前とモジュール
  パスを使用するようになりました。古い `session-store` コマンドヘルパーサーフェスは削除されました。
- bootstrap header seeding と manual Compaction boundary hardening は、SQLite transcript 行を直接 mutate するようになりました。ランタイム呼び出し元は、書き込み可能な `.jsonl` パスではなく
  セッションアイデンティティを渡します。
- silent session-rotation replay は、SQLite transcript 行から
  `{agentId, sessionId}` によって最近の user/assistant turn をコピーします。source または target transcript ロケーターを受け付けなくなりました。
- 新規ランタイムセッション行は transcript ロケーターを保存しなくなりました。呼び出し元は
  `{agentId, sessionId}` を直接使用します。export/debug コマンドは、行を具体化するときに出力ファイル
  名を選択できます。
- 新しい永続 transcript セッションの開始は、常にスコープで SQLite 行を開くようになりました。セッションマネージャーは、新しいセッションのアイデンティティとして、以前のファイル時代の transcript
  パスやロケーターを再利用しなくなりました。
- 永続 transcript セッションは、明示的な
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API を使用します。古い
  static `SessionManager.create/openForSession/list/forkFromSession` ファサードは
  廃止され、テストやランタイムコードが誤ってファイル時代のセッション
  discovery を再作成できないようになりました。
- Plugin ランタイムは `api.runtime.agent.session.resolveTranscriptLocatorPath` を公開しなくなりました。
  Plugin コードは SQLite 行ヘルパーとスコープ値を使用します。
- 公開 `session-store-runtime` SDK サーフェスは、セッション行
  と transcript 行ヘルパーのみをエクスポートするようになりました。Focused SQLite schema/path/transaction ヘルパーは
  `sqlite-runtime` にあります。raw open/close/reset ヘルパーは、ファーストパーティテスト専用としてローカルのままです。
- レガシー `.jsonl` trajectory/checkpoint ファイル名 classifiers は、doctor legacy session-file モジュールに移動しました。Core セッション検証は、通常の SQLite セッション ID を決定するために
  file-artifact ヘルパーをインポートしなくなりました。
- Active Memory blocking サブエージェント実行は、Plugin 状態下に一時または永続 `session.jsonl` ファイルを作成する代わりに、
  SQLite transcript 行を使用します。古い `transcriptDir` オプションは削除されました。
- one-off slug 生成と Crestodian planner 実行は、一時 `session.jsonl` ファイルを作成する代わりに
  SQLite transcript 行を使用します。
- `llm-task` ヘルパー実行と hidden commitment extraction も SQLite
  transcript 行を使用するため、これらの model-only ヘルパーセッションは一時 JSON/JSONL transcript ファイルを作成しなくなりました。
- `TranscriptSessionManager` は、現在は開かれた SQLite transcript スコープにすぎません。
  ランタイムコードは `openTranscriptSessionManagerForSession({agentId,
sessionId})` で開きます。create、branch、continue、list、fork フローは、static manager ファサードではなく、それぞれを所有する
  SQLite 行ヘルパーにあります。
  Doctor/import/debug コードは、ランタイムセッションマネージャーの外側で明示的なレガシーソースファイルを処理します。
- 古い `SessionManager.newSession()` と
  `SessionManager.createBranchedSession()` ファサードメソッドは削除されました。新しい
  セッションと transcript 子孫は、すでに開かれているマネージャーを別の
  永続セッションに mutate するのではなく、それぞれを所有する SQLite
  ワークフローによって作成されます。
- 親 transcript fork の判断と fork 作成は、`storePath` または `sessionsDir` を受け付けなくなりました。保持されたファイルシステムパスメタデータではなく、`{agentId, sessionId}` SQLite
  transcript スコープを使用します。
- memory-host は、no-op session-directory transcript
  classification ヘルパーをエクスポートしなくなりました。transcript フィルタリングは、entry 構築中に SQLite 行
  メタデータから派生するようになりました。
- memory-host と QMD session-export テストは SQLite transcript スコープを使用します。古い
  `agents/<agentId>/sessions/*.jsonl` パスは、テストが意図的に doctor/import/export 互換性を証明する場所でのみ
  カバーされます。
- QA-lab raw session inspection は Gateway 経由で `sessions.list` を使用するようになりました
  `agents/qa/sessions/sessions.json` を読み取る代わりに行う。MSteams フィードバックは
  JSONL パスを捏造せず、SQLite トランスクリプトへ直接追記する。
- 共有インバウンドチャネルターンは、レガシーの `storePath` ではなく
  `{agentId, sessionKey}` を運ぶようになった。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、
  iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、
  Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、
  Twitch、QQBot の記録パスは、更新時刻メタデータを読み取り、
  SQLite アイデンティティ経由でインバウンドセッション行を記録するようになった。
- トランスクリプトロケータの永続化はアクティブセッション行から削除された。
  `resolveSessionTranscriptTarget` は `agentId`、`sessionId`、任意の
  トピックメタデータを返す。レガシートランスクリプトファイル名をインポートするコードは doctor のみ。
- ランタイムトランスクリプトヘッダーは SQLite バージョン `1` から始まる。古い JSONL V1/V2/V3
  形状のアップグレードは doctor インポートにのみ存在し、行が保存される前にインポート済みヘッダーを
  現在の SQLite トランスクリプトバージョンへ正規化する。
- データベース優先ガードは `SessionManager.listAll` と
  `SessionManager.forkFromSession` を禁止するようになった。セッション一覧とフォーク/復元ワークフローは
  行/スコープ付き SQLite API に留まる必要がある。
- このガードは、doctor/インポートコード外でレガシートランスクリプト JSONL 解析/アクティブブランチ修復ヘルパー名も禁止するため、
  ランタイムが 2 つ目のレガシートランスクリプト移行パスを増やせない。
- 埋め込み PI 実行は、受信トランスクリプトハンドルを拒否する。ワーカー起動前と、
  試行がトランスクリプト状態に触れる前に SQLite の `{agentId, sessionId}` アイデンティティを使用する。
  古い `/tmp/*.jsonl` 入力ではランタイム書き込み先を選択できない。
- キャッシュトレース、Anthropic ペイロード、未加工ストリーム、診断タイムラインのレコードは、
  型付き SQLite `diagnostic_events` 行へ書き込まれるようになった。Gateway 安定性バンドルは、
  型付き SQLite `diagnostic_stability_bundles` 行へ書き込まれるようになった。古い
  `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`
  JSONL 上書きパスは削除され、通常の安定性キャプチャは `logs/stability/*.json` ファイルを書き込まなくなった。
- Cron 永続化は、保存のたびにジョブテーブル全体を削除/再挿入するのではなく、
  SQLite `cron_jobs` 行を照合するようになった。Plugin ターゲットの書き戻しは、
  一致する cron 行を直接更新し、ランタイム cron 状態を同じ状態データベーストランザクション内に保つ。
- Cron ランタイム呼び出し元は、安定した SQLite cron ストアキーを使用するようになった。レガシー
  `cron.store` パスは doctor インポート入力のみ。production gateway、タスクメンテナンス、ステータス、実行ログ、Telegram ターゲット書き戻しパスは
  `resolveCronStoreKey` を使用し、キーのパス正規化を行わなくなった。Cron ステータスは、
  古いファイル形状の `storePath` フィールドではなく `storeKey` を報告するようになった。
- Cron ランタイム読み込みとスケジューリングは、`jobId`、`schedule.cron`、数値の `atMs`、
  文字列ブール値、欠落した `sessionTarget` など、レガシーな永続化済みジョブ形状を正規化しなくなった。
  これらの修復は、行が SQLite に挿入される前に doctor レガシーインポートが所有する。
- ACP spawn は、トランスクリプト JSONL ファイルパスを解決または永続化しなくなった。Spawn とスレッドバインド設定は、
  SQLite セッション行を直接永続化し、セッション ID を保持されるトランスクリプトアイデンティティとして保つ。
- ACP セッションメタデータ API は、`agentId` によって SQLite 行を読み取り/一覧/UPSERT するようになり、
  ACP セッションエントリ契約の一部として `storePath` を公開しなくなった。
- セッション使用量会計と Gateway 使用量集計は、`{agentId, sessionId}` のみでトランスクリプトを解決するようになった。
  コスト/使用量キャッシュと検出済みセッションサマリーは、トランスクリプトロケータ文字列を合成または返さなくなった。
- Gateway チャット追記、中止部分の永続化、`/sessions.send`、webchat メディアトランスクリプト書き込みは、
  SQLite トランスクリプトスコープ経由で直接追記する。Gateway トランスクリプト注入ヘルパーは、
  `transcriptLocator` パラメータを受け付けなくなった。
- SQLite トランスクリプト検出は、トランスクリプトスコープと統計のみを一覧するようになった:
  `{agentId, sessionId, updatedAt, eventCount}`。使われなくなった
  `listSqliteSessionTranscriptLocators` 互換ヘルパーと行ごとの
  `locator` フィールドはなくなった。
- トランスクリプト修復ランタイムは、
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` のみを公開するようになった。古い
  ロケータベースの修復ヘルパーは削除された。doctor/debug コードは明示的な
  ソースファイルパスを読み取り、ロケータ文字列を移行することはない。
- ACP replay ledger ランタイムは、`acp/event-ledger.json` ではなく共有
  SQLite 状態データベースにセッションごとのリプレイ行を保存するようになった。doctor はレガシーファイルをインポートして削除する。
- Gateway トランスクリプトリーダーヘルパーは、古い
  `session-utils.fs` モジュール名ではなく
  `src/gateway/session-transcript-readers.ts` に存在するようになった。フォールバックリトライ履歴チェックは、
  古いファイルヘルパー面ではなく SQLite トランスクリプト内容に基づく名前になった。
- Gateway injected-chat と compaction ヘルパーは、値をトランスクリプトパスや
  ソースファイルと名付ける代わりに、内部ヘルパー API 経由で SQLite トランスクリプトスコープを渡すようになった。
- ブートストラップ継続検出は、`hasCompletedBootstrapTranscriptTurn` 経由で SQLite トランスクリプト行を確認するようになった。
  ファイル形状のヘルパー名は公開しなくなった。
- embedded-runner テストは SQLite トランスクリプトアイデンティティを使用するようになり、新しい
  トランスクリプトマネージャを開くには常に明示的な `sessionId` が必要になった。
- メモリインデックスヘルパーは、端から端まで SQLite トランスクリプト用語を使用するようになった:
  ホストは `listSessionTranscriptScopesForAgent` と
  `sessionTranscriptKeyForScope` をエクスポートし、ターゲット指定同期キューは `sessionTranscripts`、
  公開セッション検索ヒットは不透明な `transcript:<agent>:<session>` パス、
  内部 DB ソースキーは偽のファイルパスではなく
  `source_kind='sessions'` の下の `session:<session>` になる。
- 汎用 Plugin SDK 永続 dedupe ヘルパーは、ファイル形状のオプションを公開しなくなった。
  呼び出し元は SQLite スコープキーを提供し、永続 dedupe 行は共有 Plugin 状態に存在する。
- Microsoft Teams SSO トークンは、ロックされた JSON ファイルから SQLite Plugin
  状態へ移動した。doctor は `msteams-sso-tokens.json` をインポートし、ペイロードから正規の SSO トークンキーを再構築して、
  ソースファイルを削除する。委任 OAuth トークンは、既存の非公開認証情報ファイル境界に留まる。
- Matrix 同期キャッシュ状態は、`bot-storage.json` から SQLite Plugin
  状態へ移動した。doctor はレガシーの未加工またはラップ済み同期ペイロードをインポートし、
  ソースファイルを削除する。アクティブな Matrix クライアントと QA Matrix クライアントは、偽の `sync-store.json` や
  `bot-storage.json` パスではなく SQLite 同期ストアのルートディレクトリを渡す。
- Matrix レガシー暗号移行ステータスは、
  `legacy-crypto-migration.json` から SQLite Plugin 状態へ移動した。doctor は
  古いステータスファイルをインポートする。Matrix SDK IndexedDB スナップショットは、
  `crypto-idb-snapshot.json` から SQLite Plugin blob へ移動した。Matrix リカバリキーと
  認証情報は SQLite Plugin 状態行であり、古い JSON ファイルは doctor
  移行入力のみ。
- Memory Wiki アクティビティログは、
  `.openclaw-wiki/log.jsonl` ではなく SQLite Plugin 状態を使用するようになった。Memory Wiki 移行プロバイダーは古い
  JSONL ログをインポートする。wiki Markdown とユーザーボールト内容は
  ワークスペース内容としてファイルバックのまま。
- Memory Wiki は `.openclaw-wiki/state.json` や未使用の
  `.openclaw-wiki/locks` ディレクトリを作成しなくなった。移行プロバイダーは、古いボールトにまだ存在する場合、
  それらの廃止済み Plugin メタデータファイルを削除する。
- Crestodian 監査エントリは、
  `audit/crestodian.jsonl` ではなく core SQLite Plugin 状態を使用するようになった。doctor はレガシー JSONL 監査ログをインポートし、
  インポート成功後に削除する。
- config 書き込み/監視の監査エントリは、
  `logs/config-audit.jsonl` ではなく core SQLite Plugin 状態を使用するようになった。doctor はレガシー JSONL 監査ログをインポートし、
  インポート成功後に削除する。
- macOS companion は、`openclaw.json` の編集中に app-local の `logs/config-audit.jsonl` や
  `logs/config-health.json` サイドカーを書き込まなくなった。config ファイルはファイルバックのままで、
  リカバリスナップショットは config ファイルの隣に残り、永続 config 監査/health 状態は Gateway SQLite ストアに属する。
- Crestodian rescue 保留中の承認は、
  `crestodian/rescue-pending/*.json` ではなく core SQLite Plugin 状態を使用するようになった。doctor はレガシー保留承認ファイルをインポートし、
  インポート成功後に削除する。
- Phone Control 一時 arm 状態は、
  `plugins/phone-control/armed.json` ではなく SQLite Plugin 状態を使用するようになった。doctor はレガシー arm-state
  ファイルを `phone-control/arm-state` 名前空間にインポートし、ファイルを削除する。
- doctor は JSONL トランスクリプトをその場で修復したり、バックアップ JSONL
  ファイルを作成したりしなくなった。アクティブブランチを SQLite にインポートし、レガシーソースを削除する。
- session-memory フックのトランスクリプト検索は、`{agentId, sessionId}` スコープのみの
  SQLite 読み取りを使用する。そのヘルパーは、トランスクリプトロケータ、レガシーファイル読み取り、ファイル書き換えオプションを
  受け付けたり導出したりしなくなった。
- Codex app-server 会話バインディングは、OpenClaw セッションキーまたは明示的な
  `{agentId, sessionId}` スコープによって SQLite Plugin 状態をキー化するようになった。トランスクリプトパスのフォールバックバインディングを
  保持してはならない。
- Codex app-server mirrored-history 読み取りは、SQLite トランスクリプトスコープのみを使用する。
  トランスクリプトファイルパスからアイデンティティを復元してはならない。
- ロール順序付けと compaction リセットパスは、古いトランスクリプト
  ファイルを unlink しなくなった。リセットは SQLite セッション行とトランスクリプトアイデンティティのみをローテートする。
- Gateway リセットとチェックポイントレスポンスは、クリーンなセッション行とセッション
  ID を返す。クライアント向けに SQLite トランスクリプトロケータを合成しなくなった。
- memory-core dreaming は、欠落した
  JSONL ファイルをプローブしてセッション行を prune しなくなった。サブエージェント cleanup は
  ファイルシステム存在チェックではなくセッションランタイム API 経由で行われる。そのトランスクリプト取り込みテストは、
  `agents/<id>/sessions` fixture やロケータプレースホルダーを作成する代わりに、SQLite 行を直接 seed する。
- メモリトランスクリプトインデックスは、引用/読み取りヘルパー向けの仮想検索ヒットパスとして
  `transcript:<agentId>:<sessionId>` を公開する場合がある。永続インデックスソースは
  リレーショナル（`source_kind='sessions'`、`source_key='session:<sessionId>'`,
  `session_id=<sessionId>`）であるため、この値はランタイムトランスクリプトロケータではなく、
  ファイルシステムパスでもなく、セッションランタイム API に渡し戻してはならない。
- Gateway doctor メモリステータスは、`memory/.dreams/*.json` ではなく SQLite Plugin 状態行から
  短期 recall と phase-signal カウントを読み取る。CLI と
  doctor 出力は、そのストレージをパスではなく SQLite ストアとしてラベル付けするようになった。
- Memory-core ランタイム、CLI ステータス、Gateway doctor メソッド、Plugin SDK
  facade は、レガシー `.dreams/session-corpus` ファイルを監査またはアーカイブしなくなった。
  これらのファイルは移行入力のみ。doctor はそれらを SQLite にインポートし、検証後にソースを削除する。アクティブな session-ingestion 証拠行は、
  仮想 SQLite パス `memory/session-ingestion/<day>.txt` を使用するようになった。ランタイムは
  `.dreams/session-corpus` から状態を書き込んだり導出したりしない。
- Memory-core 公開アーティファクトは、SQLite ホストイベントを仮想 JSON
  アーティファクト `memory/events/memory-host-events.json` として公開する。レガシー
  `.dreams/events.jsonl` ソースパスを再利用しなくなった。
- サンドボックスコンテナ/ブラウザレジストリは、型付きのセッション、イメージ、タイムスタンプ、
  backend/config、ブラウザポート列を持つ共有
  `sandbox_registry_entries` SQLite テーブルを使用するようになった。doctor はレガシーのモノリシックおよび
  shard された JSON レジストリファイルをインポートし、成功したソースを削除する。ランタイム読み取りは
  型付き行列を信頼できるソースとして使用する。`entry_json` はリプレイ/debug コピーのみ。
- commitments は、ストア全体の JSON blob ではなく、型付き共有 `commitments`
  テーブルを使用するようになった。スナップショット保存は commitment ID で UPSERT し、
  テーブルをクリアして再挿入する代わりに欠落した行のみを削除する。ランタイムは、型付き scope、delivery-window、status、attempt、text
  列から commitments を読み込む。`record_json` はリプレイ/debug コピーのみ。doctor はレガシー
  `commitments.json` をインポートし、インポート成功後に削除する。
- Cron ジョブ定義、スケジュール状態、実行履歴には、ランタイム JSON ライターまたはリーダーがなくなった。
  ランタイムは、型付き schedule を持つ `cron_jobs` 行を使用する。
  ペイロード、配信、失敗アラート、セッション、ステータス、ランタイム状態の列に加え、ステータス、診断概要、配信ステータス/エラー、
  セッション/実行、モデル、トークン合計のための型付き
  `cron_run_logs` メタデータを追加しました。`job_json` はリプレイ/デバッグ用コピーにすぎません。`state_json` は、まだホットクエリフィールドを持たないネストされた
  ランタイム診断を保持し、ランタイムは型付き列からホット状態フィールドを
  再ハイドレートします。doctor は従来の
  `jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルをインポートし、
  インポート済みのソースを削除します。Plugin ターゲットのライトバックは、cron ストア全体を読み込んで置き換えるのではなく、一致する `cron_jobs`
  行を更新します。
- Gateway 起動は、ランタイム
  プロジェクション内の従来の `notify: true` マーカーを無視します。doctor は、
  `cron.webhook` が有効な場合はそれらを明示的な SQLite 配信へ変換し、
  未設定の場合は不活性なマーカーを削除し、設定された Webhook が無効な場合は警告付きで保持します。
- アウトバウンド配信キューとセッション配信キューは、キューステータス、エントリ種別、
  セッションキー、チャンネル、ターゲット、アカウント ID、リトライ回数、最終試行/エラー、
  リカバリ状態、プラットフォーム送信マーカーを、共有
  `delivery_queue_entries` テーブル内の型付き列として保存するようになりました。ランタイムリカバリは
  それらのホットフィールドを型付き列から読み取り、リトライ/リカバリの変更は
  リプレイ JSON を書き直さずにそれらの列を直接更新します。完全な JSON ペイロードは、
  メッセージ本文やその他のコールドリプレイデータのためのリプレイ/デバッグ BLOB としてのみ残ります。
- 管理対象の送信画像レコードは、メディアバイトを引き続き
  `media_blobs` に保存したまま、型付き共有
  `managed_outgoing_image_records` 行を使用するようになりました。JSON レコードはリプレイ/デバッグ用コピーとしてのみ残ります。
- Discord のモデル選択設定、コマンドデプロイハッシュ、スレッドバインディングは、
  共有 SQLite Plugin 状態を使用するようになりました。それらの従来の JSON インポート計画は、
  コア移行コードではなく、Discord Plugin のセットアップ/doctor 移行サーフェスにあります。
- Plugin のレガシーインポート検出器は、
  `doctor-legacy-state.ts` や `doctor-state-imports.ts` など doctor 名のモジュールを使用します。通常のチャンネルランタイム
  モジュールは、レガシー JSON 検出器をインポートしてはいけません。
- BlueBubbles の catchup カーソルとインバウンド重複排除マーカーは、共有 SQLite
  Plugin 状態を使用するようになりました。それらの従来の JSON インポート計画は、
  コア移行コードではなく、BlueBubbles Plugin のセットアップ/doctor 移行サーフェスにあります。
- Telegram の更新オフセット、ステッカーキャッシュ行、送信メッセージキャッシュ行、
  トピック名キャッシュ行、スレッドバインディングは、共有 SQLite Plugin
  状態を使用するようになりました。それらの従来の JSON インポート計画は、
  コア移行コードではなく、Telegram Plugin のセットアップ/doctor 移行サーフェスにあります。
- iMessage の catchup カーソル、返信ショート ID マッピング、送信エコー重複排除行は、
  共有 SQLite Plugin 状態を使用するようになりました。古い `imessage/catchup/*.json`、
  `imessage/reply-cache.jsonl`、`imessage/sent-echoes.jsonl` ファイルは
  doctor 入力にすぎません。
- Feishu のメッセージ重複排除行は、
  `feishu/dedup/*.json` ファイルの代わりに共有 SQLite Plugin 状態を使用するようになりました。その従来の JSON インポート計画は、
  コア移行コードではなく、Feishu
  Plugin のセットアップ/doctor 移行サーフェスにあります。
- Microsoft Teams の会話、投票、保留中アップロードバッファ、フィードバック
  学習は、共有 SQLite Plugin 状態/BLOB テーブルを使用するようになりました。保留中アップロード
  パスは `plugin_blob_entries` を使用するため、メディアバッファは
  base64 JSON ではなく SQLite BLOB として保存されます。ランタイムヘルパー名は、
  `*-fs` ファイルストア命名ではなく SQLite/状態の命名を使用するようになり、古い `storePath` シムは
  これらのストアから削除されました。その従来の JSON インポート計画は、Microsoft Teams
  Plugin のセットアップ/doctor 移行サーフェスにあります。
- Zalo のホストされたアウトバウンドメディアは、
  `openclaw-zalo-outbound-media` JSON/bin 一時サイドカーの代わりに共有 SQLite `plugin_blob_entries`
  を使用するようになりました。
- Diffs ビューアー HTML とメタデータは、
  `meta.json`/`viewer.html` 一時ファイルの代わりに共有 SQLite `plugin_blob_entries`
  を使用するようになりました。レンダリング済み PNG/PDF 出力は、チャンネル配信がまだファイルパスを必要とするため、
  一時マテリアライズのままです。
- Canvas の管理対象ドキュメントは、既定の `state/canvas/documents` ディレクトリの代わりに
  共有 SQLite `plugin_blob_entries` を使用するようになりました。Canvas ホストはそれらの
  BLOB を直接提供します。ローカルファイルは、明示的な `host.root`
  オペレーターコンテンツ、または下流のメディアリーダーがパスを必要とする場合の一時マテリアライズでのみ作成されます。
- File Transfer の監査判断は、無制限の `audit/file-transfer.jsonl` ランタイムログの代わりに
  共有 SQLite `plugin_state_entries`
  を使用するようになりました。doctor は従来の JSONL 監査ファイルを Plugin 状態へインポートし、正常にインポートした後にソースを削除します。
- ACPX プロセスリースと Gateway インスタンス ID は、共有 SQLite Plugin
  状態を使用するようになりました。doctor は従来の `gateway-instance-id` ファイルを Plugin 状態へインポートし、
  ソースを削除します。
- ACPX 生成ラッパースクリプトと分離された Codex ホームは、永続的な OpenClaw 状態ではなく、
  OpenClaw 一時ルート配下の一時マテリアライズです。
  永続的な ACPX ランタイムレコードは SQLite リース行と Gateway インスタンス行です。
  古い ACPX `stateDir` 設定サーフェスは、ランタイム状態がそこに書き込まれなくなったため削除されました。
- Gateway メディア添付は、正規のバイトストアとして共有 `media_blobs` SQLite テーブルを使用するようになりました。
  チャンネルおよびサンドボックス
  互換サーフェスに返されるローカルパスは、永続的なメディアストアではなく、データベース行の一時マテリアライズです。ランタイムメディア許可リストは、従来の
  `$OPENCLAW_STATE_DIR/media` や設定ディレクトリの `media` ルートを含まなくなりました。これらのディレクトリは
  doctor インポートソースにすぎません。
- シェル補完は、`$OPENCLAW_STATE_DIR/completions/*` キャッシュ
  ファイルを書き込まなくなりました。インストール、doctor、更新、リリーススモークの各パスは、永続的な補完キャッシュ
  ファイルではなく、生成された補完出力またはプロファイルの source を使用します。
- Gateway の Skills アップロードステージングは、共有 `skill_uploads` 行を使用するようになりました。アップロード
  メタデータ、冪等性キー、アーカイブバイトは SQLite にあり、インストーラーは
  インストール実行中に一時的にマテリアライズされたアーカイブパスだけを受け取ります。
- サブエージェントのインライン添付は、ワークスペース
  `.openclaw/attachments/*` 配下にマテリアライズされなくなりました。spawn パスは SQLite VFS シードエントリを準備し、
  インライン実行はそれらのエントリをエージェントごとのランタイムスクラッチ名前空間へシードし、
  ディスクバックエンドツールは添付パス用にその SQLite スクラッチをオーバーレイします。古いサブエージェント実行の添付ディレクトリレジストリ列とクリーンアップフックは削除されました。
- CLI 画像ハイドレーションは、安定した `openclaw-cli-images` キャッシュ
  ファイルを維持しなくなりました。外部 CLI バックエンドは引き続きファイルパスを受け取りますが、それらのパスは
  クリーンアップ付きの実行ごとの一時マテリアライズです。
- キャッシュトレース診断、Anthropic ペイロード診断、生モデルストリーム
  診断、診断タイムラインイベント、Gateway 安定性バンドルは、
  `logs/*.jsonl` や
  `logs/stability/*.json` ファイルではなく SQLite 行を書き込むようになりました。
  ランタイムパス上書きフラグと環境変数は削除されました。エクスポート/デバッグ
  コマンドは、データベース行から明示的にファイルをマテリアライズできます。
- macOS コンパニオンには、ローリング `diagnostics.jsonl` ライターがなくなりました。アプリ
  ログは unified logging へ送られ、永続的な Gateway 診断は SQLite バックエンドのままです。
- macOS ポートガーディアンのレコードリストは、Application Support JSON ファイルや不透明なシングルトン BLOB の代わりに、
  型付き共有 SQLite
  `macos_port_guardian_records` 行を使用するようになりました。
- Gateway シングルトンロックは、一時ディレクトリのロックファイルの代わりに、
  `gateway_locks` スコープ配下の型付き共有 SQLite `state_leases` 行を使用するようになりました。Fly と OAuth
  のトラブルシューティングドキュメントは、古いファイルロックのクリーンアップではなく、
  SQLite リース/auth 更新ロックを指すようになりました。
- Gateway 再起動センチネル状態は、`restart-sentinel.json` の代わりに型付き共有 SQLite
  `gateway_restart_sentinel` 行を使用するようになりました。ランタイムは、
  センチネル種別、ステータス、ルーティング、メッセージ、継続、統計を
  型付き列から読み取ります。`payload_json` はリプレイ/デバッグ用コピーにすぎません。ランタイムコードは
  SQLite 行を直接クリアし、ファイルクリーンアップの配管を保持しなくなりました。
- Gateway 再起動意図とスーパーバイザーハンドオフ状態は、
  `gateway-restart-intent.json` および
  `gateway-supervisor-restart-handoff.json` サイドカーの代わりに、型付き共有
  SQLite `gateway_restart_intent` および `gateway_restart_handoff` 行を使用するようになりました。
- Gateway シングルトン調整は、
  `gateway.<hash>.lock` ファイルを書き込む代わりに、`gateway_locks` 配下の型付き `state_leases` 行を使用するようになりました。リース行が
  ロック所有者、有効期限、Heartbeat、デバッグペイロードを所有します。SQLite が
  アトミックな取得/解放境界を所有します。廃止されたファイルロックディレクトリオプションは
  削除されました。テストは SQLite 行 ID を直接使用します。
- `cron/runs/*.jsonl`
  ファイルをスキャンしていた、古い未参照の cron 使用状況レポートヘルパーは削除されました。Cron 実行履歴レポートは、型付き
  `cron_run_logs` SQLite 行を読み取る必要があります。
- メインセッションの再起動リカバリは、
  `agents/*/sessions`
  ディレクトリをスキャンする代わりに、SQLite `agent_databases` レジストリを通じて候補エージェントを検出するようになりました。
- Gemini セッション破損リカバリは、SQLite セッション行だけを削除するようになりました。
  従来の `storePath` ゲートは不要になり、派生した
  transcript JSONL パスを unlink しようとしなくなりました。
- パス上書き処理は、リテラルの `undefined`/`null` 環境
  値を未設定として扱うようになり、テストやシェルハンドオフ中に誤ってリポジトリルートの `undefined/state/*.sqlite`
  データベースが作成されるのを防ぎます。
- 設定ヘルスフィンガープリントは、`logs/config-health.json` の代わりに型付き共有 SQLite `config_health_entries`
  行を使用するようになり、通常の設定ファイルを唯一の非認証情報設定ドキュメントとして維持します。macOS コンパニオンは
  プロセスローカルのヘルス状態だけを保持し、古い JSON サイドカーを再作成しません。
- 認証プロファイルランタイムは、認証情報 JSON ファイルをインポートしたり書き込んだりしなくなりました。
  正規の認証情報ストアは SQLite です。`auth-profiles.json`、エージェントごとの
  `auth.json`、共有 `credentials/oauth.json` は doctor 移行入力であり、
  インポート後に削除されます。
- 認証プロファイルの保存/状態テストは、型付き SQLite 認証テーブルを直接アサートするようになり、
  従来の認証プロファイルファイル名は doctor 移行入力にのみ使用します。
- `openclaw secrets apply` は、設定ファイル、env ファイル、SQLite
  認証プロファイルストアだけをスクラブします。廃止されたエージェントごとの `auth.json` を編集する
  互換性ロジックは保持しなくなりました。doctor がそのファイルのインポートと削除を所有します。
- Hermes シークレット移行計画と適用は、インポートされた API キープロファイルを
  SQLite 認証プロファイルストアへ直接入れます。中間ターゲットとして
  `auth-profiles.json` を書き込んだり検証したりしなくなりました。
- ユーザー向け認証ドキュメントは、
  ユーザーに `auth-profiles.json` を調査またはコピーするよう伝える代わりに、
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` を説明するようになりました。従来の OAuth/auth JSON
  名は、doctor インポート入力としてのみ文書化されたままです。
- コア状態パスヘルパーは、廃止された `credentials/oauth.json`
  ファイルを公開しなくなりました。従来のファイル名は doctor 認証インポートパスのローカルにあります。
- インストール、セキュリティ、オンボーディング、モデル認証、SecretRef ドキュメントは、
  エージェントごとの認証プロファイル JSON ファイルではなく、SQLite 認証プロファイル行と状態全体のバックアップ/移行を説明するようになりました。
- PI モデル検出は、正規の認証情報をメモリ内の
  `pi-coding-agent` 認証ストレージへ渡すようになりました。検出中にエージェントごとの `auth.json` を
  作成、スクラブ、書き込みしなくなりました。
- Voice Wake トリガーとルーティング設定は、
  `settings/voicewake.json`、`settings/voicewake-routing.json`、または
  不透明な汎用行の代わりに、型付き共有 SQLite テーブルを使用するようになりました。doctor は従来の JSON ファイルをインポートし、
  移行に成功した後に削除します。
- 更新チェック状態は、`update-check.json` や不透明な汎用 BLOB の代わりに、
  型付き共有 `update_check_state` 行を使用するようになりました。doctor は
  従来の JSON ファイルをインポートし、移行に成功した後に削除します。
- 設定ヘルス状態は、`logs/config-health.json` や不透明な汎用 BLOB の代わりに、
  型付き共有 `config_health_entries` 行を使用するようになりました。doctor は
  従来の JSON ファイルをインポートし、移行に成功した後に削除します。
- Plugin 会話バインディング承認は、不透明な共有 SQLite 状態や
  の代わりに、型付き
  `plugin_binding_approvals` 行を使用するようになりました。
  `plugin-binding-approvals.json`。レガシーファイルは doctor マイグレーション入力です。
- 汎用の現在の会話バインディングは、`bindings/current-conversations.json` を書き換える代わりに、型付きの
  `current_conversation_bindings` 行を保存するようになりました。doctor はレガシー JSON ファイルをインポートし、
  マイグレーション成功後にそれを削除します。
- Memory Wiki のインポート済みソース同期台帳は、`.openclaw-wiki/source-sync.json` を書き換える代わりに、
  vault/source キーごとに SQLite plugin-state 行を 1 つ保存するようになりました。
  マイグレーションプロバイダーはレガシー JSON 台帳をインポートして削除します。
- Memory Wiki の ChatGPT インポート実行レコードは、`.openclaw-wiki/import-runs/*.json` に書き込む代わりに、
  vault/run id ごとに SQLite plugin-state 行を 1 つ保存するようになりました。
  ロールバックスナップショットは、インポート実行スナップショットのアーカイブが blob storage に移されるまで、
  明示的な vault ファイルのままです。
- Memory Wiki のコンパイル済みダイジェストは、`.openclaw-wiki/cache/agent-digest.json` と
  `.openclaw-wiki/cache/claims.jsonl` に書き込む代わりに、SQLite plugin blob 行を保存するようになりました。
  マイグレーションプロバイダーは古いキャッシュファイルをインポートし、空になった時点でキャッシュディレクトリを削除します。
- ClawHub の skill インストール追跡は、ランタイムで `.clawhub/lock.json` と
  `.clawhub/origin.json` サイドカーを書き込みまたは読み取る代わりに、workspace/skill ごとに SQLite plugin-state 行を 1 つ保存するようになりました。
  ランタイムコードは、ファイル形状の lockfile/origin 抽象化ではなく、追跡済みインストール状態オブジェクトを使用します。
  Doctor は設定済みのエージェントワークスペースからレガシーサイドカーをインポートし、クリーンなインポート後に削除します。
- インストール済み Plugin インデックスは、`plugins/installs.json` の代わりに、型付きの共有 SQLite
  `installed_plugin_index` singleton 行を読み書きするようになりました。レガシー JSON ファイルは doctor マイグレーション入力に限定され、インポート後に削除されます。
- レガシー `plugins/installs.json` パスヘルパーは、doctor レガシーコード内に移動しました。
  ランタイム plugin-index モジュールは、JSON ファイルパスではなく、SQLite バックの永続化オプションのみを公開します。
- Gateway の再起動 sentinel、再起動 intent、supervisor handoff 状態は、汎用の不透明 blob の代わりに、
  型付き共有 SQLite 行（`gateway_restart_sentinel`、`gateway_restart_intent`、`gateway_restart_handoff`）を使用するようになりました。
  ランタイムの再起動コードには、ファイル形状の sentinel/intent/handoff 契約はありません。
- Matrix 同期キャッシュ、ストレージメタデータ、スレッドバインディング、インバウンド重複排除マーカー、
  起動検証 cooldown 状態、SDK IndexedDB 暗号スナップショット、認証情報、リカバリキーは、
  共有 SQLite plugin state/blob テーブルを使用するようになりました。ランタイムパス構造体は
  `storage-meta.json` メタデータパスを公開しなくなりました。このファイル名はレガシーマイグレーション入力に限定されます。
  それらのレガシー JSON インポート計画は、Matrix Plugin setup/doctor マイグレーション面にあります。
- Matrix 起動は、レガシー Matrix ファイル状態をスキャン、レポート、または完了しなくなりました。
  Matrix ファイル検出、レガシー暗号スナップショット作成、room-key 復元マイグレーション状態、インポート、ソース削除はすべて doctor が所有します。
- Matrix ランタイムマイグレーション barrel は削除されました。レガシー状態/暗号の検出および変更ヘルパーは、
  ランタイム API surface の一部ではなく、Matrix doctor から直接インポートされます。
- Matrix マイグレーションスナップショット再利用マーカーは、`matrix/migration-snapshot.json` の代わりに SQLite plugin state に置かれるようになりました。
  doctor は、サイドカー状態ファイルを書き込まずに、同じ検証済みのマイグレーション前アーカイブを引き続き再利用できます。
- Nostr bus cursor と profile publish 状態は、共有 SQLite plugin state を使用するようになりました。
  それらのレガシー JSON インポート計画は、Nostr Plugin setup/doctor マイグレーション面にあります。
- Active Memory のセッショントグルは、`session-toggles.json` の代わりに共有 SQLite plugin state を使用するようになりました。
  メモリを再びオンにすると、JSON オブジェクトを書き換える代わりに行を削除します。
- Skill Workshop の提案とレビューカウンターは、workspace ごとの `skill-workshop/<workspace>.json` store の代わりに、共有 SQLite plugin state を使用するようになりました。
  各提案は `skill-workshop/proposals` 配下の個別行であり、レビューカウンターは `skill-workshop/reviews` 配下の個別行です。
- Skill Workshop reviewer subagent 実行は、`skill-workshop/<sessionId>.json` サイドカーセッションパスを作成する代わりに、
  ランタイムセッショントランスクリプト resolver を使用するようになりました。
- ACPX process lease は、全体ファイルの `process-leases.json` registry の代わりに、
  `acpx/process-leases` 配下の共有 SQLite plugin state を使用するようになりました。
  各 lease は独自の行として保存され、ランタイム JSON 書き換えパスなしで起動時の stale-process 回収を維持します。
- ACPX wrapper script と分離された Codex home は、OpenClaw temp root に生成されます。
  必要に応じて再作成され、バックアップまたはマイグレーション入力ではありません。
- Subagent 実行 registry 永続化は、型付き共有 `subagent_runs` 行を使用します。
  古い `subagents/runs.json` パスは doctor マイグレーション入力に限定され、ランタイムヘルパー名は状態レイヤーを disk-backed と表現しなくなりました。
  ランタイムテストは registry behavior を証明するために無効または空の `runs.json` fixture を作成しなくなり、SQLite 行を直接 seed/read します。
- バックアップはアーカイブ前に state ディレクトリをステージングし、非データベースファイルをコピーし、
  `VACUUM INTO` で `*.sqlite` データベースのスナップショットを取り、ライブ WAL/SHM サイドカーを省略し、
  アーカイブ manifest にスナップショットメタデータを記録し、完了したバックアップ実行をアーカイブ manifest とともに SQLite に記録します。
  `openclaw backup create` はデフォルトで書き込まれたアーカイブを検証します。`--no-verify` は明示的な高速パスです。
- `openclaw backup restore` は展開前にアーカイブを検証し、verifier の正規化済み manifest を再利用し、
  検証済み manifest asset を記録されたソースパスへ復元します。書き込みには `--yes` が必要で、復元計画用に `--dry-run` をサポートします。
- 古いバックアップ volatile-path filter は削除されました。SQLite スナップショットがアーカイブ作成前にステージングされるため、
  バックアップにはレガシーセッションまたは cron JSON/JSONL ファイル用の live-tar skip list が不要になりました。
- プレーン setup と onboarding のワークスペース準備は、`agents/<agentId>/sessions/` ディレクトリを作成しなくなりました。
  config/workspace のみを作成します。SQLite session 行と transcript 行は、per-agent データベース内でオンデマンドに作成されます。
- セキュリティ権限修復は、`sessions.json` と transcript JSONL ファイルの代わりに、
  global および per-agent SQLite データベースと WAL/SHM サイドカーを対象にするようになりました。
- Sandbox registry のランタイム名は、アクティブ store にレガシー JSON registry 用語を引き継ぐ代わりに、
  SQLite registry kind を直接表すようになりました。
- `openclaw reset --scope config+creds+sessions` は、レガシー `sessions/` ディレクトリだけでなく、
  per-agent `openclaw-agent.sqlite` データベースと WAL/SHM サイドカーを削除します。
- Gateway aggregate session helper は、entry-oriented な名前を使用するようになりました。
  `loadCombinedSessionEntriesForGateway` は `{ databasePath, entries }` を返します。
  古い combined-store naming はランタイム caller から削除されました。
- Docker MCP channel seeding は、`sessions.json` と JSONL transcript を作成する代わりに、
  main session 行と transcript event を per-agent SQLite データベースへ書き込むようになりました。
- バンドルされた session-memory hook は、`{agentId, sessionId}` によって SQLite から previous-session context を解決するようになりました。
  transcript パスまたは `workspace/sessions` ディレクトリをスキャン、保存、または合成しなくなりました。
- バンドルされた command-logger hook は、`logs/commands.log` に追記する代わりに、
  共有 SQLite `command_log_entries` テーブルへ command audit 行を書き込むようになりました。
- Channel pairing allowlist は、ランタイムと Plugin SDK で SQLite バックの read/write helper のみを公開するようになりました。
  古い `*-allowFrom.json` パス resolver とファイル reader は、doctor legacy import code 配下にのみ存在します。
- `migration_runs` は、status、timestamp、JSON report とともに legacy-state マイグレーション実行を記録します。
- `migration_sources` は、インポートされた各レガシーファイルソースを、hash、size、record count、target table、run id、status、source-removal state とともに記録します。
- `backup_runs` は、バックアップアーカイブパス、status、JSON manifest を記録します。
- global schema は、未使用の `agents` registry テーブルを保持しません。
  ランタイムに実際の agent-record owner ができるまで、エージェントデータベース discovery は正規の `agent_databases` registry です。
- 生成された model catalog config は、エージェントディレクトリをキーとする型付き global SQLite
  `agent_model_catalogs` 行に保存されます。ランタイム caller は `ensureOpenClawModelCatalog` を使用します。
  ランタイムコードに `models.json` 互換 API はありません。実装は SQLite に書き込み、埋め込み PI registry は、`models.json` ファイルを作成せずに、その保存済み payload から hydrate されます。
- QMD session transcript markdown export と `memory.qmd.sessions` config は削除されました。
  QMD transcript collection、`qmd/sessions*` ランタイムパス、file-backed session memory bridge は存在しません。
- memory-core ランタイムは、QMD SDK subpath ではなく、
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` から SQLite transcript indexing helper をインポートします。
  QMD subpath は、major SDK cleanup で削除できるまで、外部 caller 向けの互換 re-export のみを保持します。
- QMD 独自の `index.sqlite` は、main SQLite `plugin_blob_entries` テーブルをバックエンドとする temp runtime materialization になりました。
  ランタイムは durable な `~/.openclaw/agents/<agentId>/qmd` サイドカーを作成しなくなりました。
- 任意の `memory-lancedb` Plugin は、暗黙の OpenClaw-managed store として
  `~/.openclaw/memory/lancedb` を作成しなくなりました。これは外部 LanceDB backend であり、operator が明示的な `dbPath` を設定するまで無効のままです。
- `check:database-first-legacy-stores` は、レガシー store 名と write-style filesystem API を組み合わせる新しいランタイムソースを失敗させます。
  また、廃止済み transcript bridge marker である `transcriptLocator` または `sqlite-transcript://...` を再導入するランタイムソースも失敗させます。
  migration、doctor、import、明示的な non-session export code は引き続き許可されます。
  `sessionFile`、`storePath`、古い `SessionManager` file-era facade などのより広いレガシー契約名にはまだ現在の owner があり、
  必須 preflight check にできるようになる前に、別途 migration guard 作業が必要です。
  この guard は、runtime `cache/*.json` store、汎用
  `thread-bindings.json` サイドカー、cron state/run-log JSON、config health JSON、
  restart および lock サイドカー、Voice Wake settings、plugin binding approvals、
  installed plugin index JSON、File Transfer audit JSONL、Memory Wiki activity log、
  古いバンドル `command-logger` テキストログ、pi-mono raw-stream JSONL diagnostics knob も対象にするようになりました。
  互換コードが `src/commands/doctor/` 配下に留まるように、古い root-level doctor legacy module 名も禁止します。
  Android debug handler も、`camera_debug.log` または `debug_logs.txt` cache file をステージングする代わりに、
  logcat/in-memory output を使用します。

## ターゲットスキーマ形状

スキーマは明示的に保つ。ホスト所有のランタイム状態は型付きテーブルを使う。Plugin所有の
不透明な状態は `plugin_state_entries` / `plugin_blob_entries` を使う。汎用的な
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

将来の検索では、正規イベントテーブルを変更せずにFTSテーブルを追加できる:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大きな値にはJSON文字列エンコードではなく `blob` カラムを使う。プレーンな
SQLiteツールで検査可能なままにする必要がある小さな構造化データには
`value_json` を保つ。

このブランチでは `agent_databases` が正規レジストリである。実際のエージェントレコード所有者が存在するまで
`agents` テーブルを追加しない。エージェント設定は
`openclaw.json` に残す。

## Doctor移行形状

Doctorは、報告可能で安全に再実行できる明示的な移行ステップを1つ呼び出すべきである:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` は、通常の設定事前チェックの後に状態移行実装を呼び出し、
インポート前に検証済みバックアップを作成する。ランタイム起動と `openclaw migrate` は、
レガシーのOpenClaw状態ファイルをインポートしてはならない。

移行の特性:

- 1回の移行パスで、すべてのレガシーファイルソースを検出し、何かを変更する前に計画を生成する。
- Doctorは、レガシーファイルをインポートする前に、検証済みの移行前バックアップアーカイブを作成する。
- インポートは冪等であり、ソースパス、mtime、サイズ、ハッシュ、ターゲット
  テーブルによってキー付けされる。
- 成功したソースファイルは、ターゲットデータベースがコミットした後に削除またはアーカイブされる。
- 失敗したインポートはソースを変更せず、`migration_runs` に警告を記録する。
- ランタイムコードは、移行が存在した後はSQLiteのみを読み取る。
- ダウングレードまたはランタイムファイルへのエクスポート経路は不要である。

## 移行インベントリ

これらをグローバルデータベースへ移動する:

- タスクレジストリのランタイム書き込みは共有データベースを使用するようになりました。未出荷の
  `tasks/runs.sqlite` サイドカーインポーターは削除されました。スナップショット保存はタスク
  id で upsert し、不足しているタスク/配信行のみを削除します。
- Task Flow ランタイム書き込みは共有データベースを使用するようになりました。未出荷の
  `tasks/flows/registry.sqlite` サイドカーインポーターは削除されました。スナップショット保存は
  flow id で upsert し、不足している flow 行のみを削除します。
- Plugin 状態のランタイム書き込みは共有データベースを使用するようになりました。未出荷の
  `plugin-state/state.sqlite` サイドカーインポーターは削除されました。
- 組み込みメモリ検索は `memory/<agentId>.sqlite` をデフォルトにしなくなりました。その
  インデックステーブルは所有元のエージェントデータベース内に置かれ、明示的な
  `memorySearch.store.path` サイドカー opt-in は doctor config
  migration に移され廃止されました。
- 組み込みメモリの再インデックスは、エージェントデータベース内のメモリ所有テーブルのみをリセットします。
  同じデータベースが
  セッション、トランスクリプト、VFS 行、アーティファクト、ランタイムキャッシュを所有するため、SQLite ファイル全体を置き換えてはいけません。
- モノリシックおよびシャード化 JSON 由来のサンドボックスコンテナ/ブラウザレジストリ。ランタイム
  書き込みは共有データベースを使用するようになりました。レガシー JSON インポートは残ります。
- Cron ジョブ定義、スケジュール状態、実行履歴は共有 SQLite を使用するようになりました。
  doctor はレガシー `jobs.json`、`jobs-state.json`、および
  `cron/runs/*.jsonl` ファイルをインポート/削除します
- デバイス ID/認証、push、更新チェック、commitments、OpenRouter モデル
  キャッシュ、インストール済み Plugin インデックス、app-server バインディング
- デバイス/Node ペアリングとブートストラップレコードは型付き SQLite テーブルを使用するようになりました
- device-pair 通知サブスクライバーと配信済みリクエストマーカーは、`device-pair-notify.json` の代わりに
  共有 SQLite plugin-state テーブルを使用するようになりました。
- voice-call の通話レコードは、`calls.jsonl` の代わりに
  `voice-call` / `calls` 名前空間配下の共有 SQLite plugin-state テーブルを使用するようになりました。Plugin CLI は
  SQLite-backed の通話履歴を tail して要約します。
- QQBot Gateway セッション、既知ユーザーレコード、ref-index 引用キャッシュは、
  `session-*.json`、`known-users.json`、
  `ref-index.jsonl` の代わりに、`qqbot` 名前空間（`gateway-sessions`,
  `known-users`, `ref-index`）配下の SQLite Plugin 状態を使用するようになりました。これらのレガシーファイルはキャッシュであり、移行されません。
- Discord model-picker 設定、command-deploy ハッシュ、thread bindings は、
  `model-picker-preferences.json`、`command-deploy-cache.json`、および
  `thread-bindings.json` の代わりに、`discord` 名前空間
  （`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`）配下の SQLite Plugin 状態を使用するようになりました。
  Discord doctor/setup migration はレガシーファイルをインポートして
  削除します。
- BlueBubbles catchup cursors と inbound dedupe マーカーは、
  `bluebubbles/catchup/*.json` と
  `bluebubbles/inbound-dedupe/*.json` の代わりに、`bluebubbles` 名前空間（`catchup-cursors`, `inbound-dedupe`）配下の SQLite Plugin
  状態を使用するようになりました。BlueBubbles doctor/setup migration は
  レガシーファイルをインポートして削除します。
- Telegram update offsets、sticker cache entries、reply-chain message cache
  entries、sent-message cache entries、topic-name cache entries、thread
  bindings は、`update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, および
  `thread-bindings-*.json` の代わりに、`telegram` 名前空間
  （`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`）配下の SQLite Plugin 状態を使用するようになりました。Telegram doctor/setup migration は
  レガシーファイルをインポートして削除します。
- iMessage catchup cursors、reply short-id mappings、sent-echo dedupe rows は、
  `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`、および `imessage/sent-echoes.jsonl` の代わりに、`imessage` 名前空間（`catchup-cursors`,
  `reply-cache`, `sent-echoes`）配下の SQLite Plugin 状態を使用するようになりました。iMessage
  doctor/setup migration はレガシーファイルをインポートして削除します。
- Microsoft Teams conversations、polls、SSO tokens、feedback learnings は、
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, および `*.learnings.json` の代わりに、SQLite Plugin 状態名前空間（`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`）を使用するようになりました。Microsoft Teams doctor/setup migration はレガシーファイルをインポートしてアーカイブします。
  保留中のアップロードは短命の SQLite キャッシュであり、古い JSON キャッシュファイルは
  移行されません。
- Matrix sync cache、storage metadata、thread bindings、inbound dedupe markers、
  startup verification cooldown state、credentials、recovery keys、SDK
  IndexedDB crypto snapshots は、`bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, および `crypto-idb-snapshot.json` の代わりに、`matrix` 配下の SQLite Plugin state/blob 名前空間
  （`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`）
  を使用するようになりました。Matrix doctor/setup migration は
  account-scoped Matrix storage roots からこれらのレガシーファイルをインポートして削除します。
- Nostr bus cursors と profile publish state は、
  `bus-state-*.json` と `profile-state-*.json` の代わりに
  `nostr` 名前空間（`bus-state`, `profile-state`）配下の SQLite Plugin 状態を使用するようになりました。Nostr doctor/setup
  migration はレガシーファイルをインポートして削除します。
- Active Memory セッショントグルは、`session-toggles.json` の代わりに
  `active-memory/session-toggles` 配下の SQLite Plugin 状態を使用するようになりました。
- Skill Workshop proposal queues と review counters は、
  per-workspace の `skill-workshop/<workspace>.json` ファイルの代わりに
  `skill-workshop/proposals` と `skill-workshop/reviews` 配下の SQLite Plugin 状態を使用するようになりました。
- Outbound delivery と session delivery queues は、永続的な
  `delivery-queue/*.json`、`delivery-queue/failed/*.json`、および
  `session-delivery-queue/*.json` ファイルの代わりに、別々のキュー名
  （`outbound-delivery`, `session-delivery`）配下でグローバル SQLite
  `delivery_queue_entries` テーブルを共有するようになりました。doctor legacy-state step は
  pending と failed rows をインポートし、古い delivered markers を削除し、インポート後に古い
  JSON ファイルを削除します。ホットルーティングとリトライフィールドは型付きカラムです。
  JSON payload は replay/debug のためにのみ保持されます。
- ACPX process leases は、`process-leases.json` の代わりに `acpx/process-leases` 配下の SQLite Plugin 状態を使用するようになりました。
- バックアップと migration run メタデータ

これらをエージェントデータベースへ移動します。

- エージェントセッションルートと compatibility-shaped session-entry payloads。ランタイム
  書き込みは完了済みです。ホットセッションメタデータは `sessions` でクエリ可能であり、レガシー形状の完全な
  `SessionEntry` payload は `session_entries` に残ります。
- エージェントのトランスクリプトイベント。ランタイム書き込みは完了済みです。
- Compaction checkpoints と transcript snapshots。ランタイム書き込みは完了済みです。
  checkpoint transcript copies は SQLite transcript rows であり、checkpoint
  metadata は `transcript_snapshots` に記録されます。Gateway checkpoint helpers は
  これらの値を source files ではなく transcript snapshots と呼ぶようになりました。
- Agent VFS scratch/workspace namespaces。ランタイム VFS 書き込みは完了済みです。
- Subagent attachment payloads。ランタイム書き込みは完了済みです。これらは SQLite VFS
  seed entries であり、永続的な workspace files ではありません。
- Tool artifacts。ランタイム書き込みは完了済みです。
- Run artifacts。per-agent
  `run_artifacts` テーブルを通じた worker runtime writes は完了済みです。
- Agent-local runtime caches。per-agent `cache_entries` テーブルを通じた worker runtime scoped cache writes は完了済みです。Gateway-wide model caches は、agent-specific になるまでは
  global database に残ります。
- ACP parent stream logs。ランタイム書き込みは完了済みです。
- ACP replay ledger sessions。`acp_replay_sessions` と `acp_replay_events` 経由のランタイム書き込みは完了済みです。レガシー `acp/event-ledger.json`
  は doctor input としてのみ残ります。
- ACP session metadata。`acp_sessions` 経由のランタイム書き込みは完了済みです。`sessions.json` 内のレガシー
  `entry.acp` blocks は doctor migration input のみです。
- 明示的なエクスポートファイルでない場合の trajectory sidecars。ランタイム
  書き込みは完了済みです。trajectory capture は agent-database `trajectory_runtime_events`
  行を書き込み、run-scoped artifacts を SQLite にミラーします。レガシー sidecars は doctor
  import inputs のみです。export は新しい JSONL support-bundle outputs を実体化できますが、
  ランタイムで古い trajectory/transcript sidecars を読み取りまたは移行しません。
  Runtime trajectory capture は SQLite scope を公開します。JSONL path helpers は
  export/debug support に分離され、runtime module から再エクスポートされません。
  Embedded-runner trajectory metadata は transcript locator を永続化する代わりに `{agentId, sessionId, sessionKey}`
  identity を記録します。

これらは当面ファイルバックのままにします。

- `openclaw.json`
- provider または CLI credential files
- plugin/package manifests
- disk mode が選択された場合の user workspaces と Git repositories
- 特定の log surface が移動されない限り、operator tailing を目的とする logs

## Migration Plan

### Phase 0: 境界を固定する

さらに行を移動する前に、durable-state boundary を明示します。

- グローバルデータベースに `migration_runs` テーブルを追加します。
  legacy-state migration execution reports について完了済みです。
- file-to-database import 用に doctor-owned state migration service を 1 つ追加します。
  完了済みです。`openclaw doctor --fix` は legacy-state migration implementation を使用します。
- `plan` を read-only にし、`apply` がバックアップを作成し、インポートし、検証してから
  古いファイルを削除または隔離するようにします。
  完了済みです。doctor は検証済み pre-migration backup を作成し、backup path を
  `migration_runs` に渡し、importer/removal paths を再利用します。
- 新しいランタイムコードが legacy state files を書き込めないように static bans を追加しつつ、
  migration code と tests は引き続きそれらを seed/read できるようにします。
  現在移行済みの legacy stores について完了済みです。このガードは、禁止された runtime transcript locator contracts について
  nested tests もスキャンします。

### Phase 1: グローバルコントロールプレーンを完成させる

共有 coordination state は `state/openclaw.sqlite` に保持します。

- Agents と agent database registry
- Task と Task Flow ledgers
- Plugin 状態
- Sandbox container/browser registry
- Cron/scheduler run history
- Pairing、device、push、update-check、TUI、OpenRouter/model caches、およびその他の
  小さな gateway-scoped runtime state
- Backup と migration metadata
- Gateway media attachment bytes。ランタイム書き込みは完了済みです。直接 file paths は
  channel senders と sandbox staging との互換性のための一時 materializations です。Runtime allowlists は legacy
  state/config media roots ではなく SQLite materialization paths を受け入れます。Doctor は legacy media files を
  `media_blobs` にインポートし、正常に行を書き込んだ後に source files を削除します。
- Debug proxy capture sessions、events、payload blobs。完了済みです。captures は
  shared state DB に存在し、shared state DB bootstrap、schema、
  WAL、busy-timeout settings を通じて開きます。Payload bytes は
  `capture_blobs.data` で gzip-compressed されます。debug proxy runtime sidecar DB override、
  blob directory、proxy-capture-only generated schema/codegen target はありません。
  Doctor/startup migration は、active legacy DB/blob environment
  overrides を含め、出荷済みの `debug-proxy/capture.sqlite` rows
  と参照される payload blobs をインポートし、CA certificates はそのまま残してそれらのソースをアーカイブします。

このフェーズでは、これらのサブシステムから duplicate sidecar openers、permission helpers、WAL
setup、filesystem pruning、compatibility writers も削除します。

### Phase 2: Per-Agent Databases を導入する

エージェントごとに 1 つのデータベースを作成し、global DB から登録します。

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

グローバルの `agent_databases` 行は、path、schema version、last-seen
timestamp、基本的な size/integrity metadata を保存します。ランタイムコードは
file paths を直接派生する代わりに、registry に agent DB を問い合わせます。

agent DB は以下を所有します。

- 正規のセッションルートとしての `sessions`。そのルートに紐づく互換形状のペイロードテーブルとしての `session_entries`、および一意のアクティブな `session_key` ルックアップとしての `session_routes`
- セッションに紐づく正規化されたプロバイダーのルーティング ID としての `conversations` と `session_conversations`
- `transcript_events`
- トランスクリプトスナップショットと Compaction チェックポイント。ランタイム書き込みは完了。
- `vfs_entries`
- `tool_artifacts` と実行アーティファクト
- エージェントローカルのランタイム/キャッシュ行。ワーカーのスコープ付きキャッシュは完了。
- ACP 親ストリームイベント
- 明示的なエクスポートアーティファクトではない場合の軌跡ランタイムイベント

### フェーズ 3: セッションストア API を置き換える

ランタイムは完了。ファイル形状のセッションストアサーフェスは、アクティブなランタイム契約ではない:

- ランタイムは `loadSessionStore(storePath)` を呼ばなくなり、`storePath` をセッション ID として扱わなくなった。
- ランタイムの行操作は `getSessionEntry`、`upsertSessionEntry`、`patchSessionEntry`、`deleteSessionEntry`、`listSessionEntries`。
- ストア全体の再書き込みヘルパー、ファイルライター、キューテスト、エイリアス剪定、レガシーキー削除パラメーターはランタイムから削除済み。
- 非推奨のルートパッケージ互換エクスポートは、正規の `sessions.json` パスを SQLite 行 API にまだ適合させる。
- `sessions.json` の解析は doctor の移行/インポートコードと doctor テストにのみ残る。
- ランタイムライフサイクルのフォールバックは、JSONL の先頭行ではなく SQLite トランスクリプトヘッダーを読む。

ファイルロックパラメーター、ファイルメンテナンスとしての剪定/切り詰め語彙、ストアパス ID、または JSON 永続化だけを検証するテストを再導入するものは削除し続ける。

### フェーズ 4: トランスクリプト、ACP ストリーム、軌跡、VFS を移動する

すべてのエージェントデータストリームをデータベースネイティブにする:

- トランスクリプト追記書き込みは、セッションヘッダーを保証し、メッセージの冪等性を確認し、親の末尾を選択し、`transcript_events` に挿入し、クエリ可能な ID メタデータを `transcript_event_identities` に記録する 1 つの SQLite トランザクションを通る。直接のトランスクリプトメッセージ追記と通常の永続化された `TranscriptSessionManager` 追記は完了。明示的なブランチ操作は明示的な親の選択を保持し、ファイルロケーターを導出せずに SQLite 行を書き込む。
- ACP 親ストリームログは `.acp-stream.jsonl` ファイルではなく行になる。完了。
- ACP スポーン設定はトランスクリプト JSONL パスを永続化しなくなった。完了。
- ランタイムの軌跡キャプチャはイベント行/アーティファクトを直接書き込む。明示的なサポート/エクスポートコマンドは、エクスポート形式としてサポートバンドル JSONL アーティファクトをまだ生成できるが、セッションエクスポートはセッション JSONL を再作成しない。完了。
- ディスクワークスペースは、ディスクモードとして設定されている場合はディスク上に残る。
- VFS スクラッチと実験的な VFS 専用ワークスペースモードはエージェント DB を使う。

移行は古い JSONL ファイルを一度インポートし、`migration_runs` に件数/ハッシュを記録し、整合性チェック後にインポート済みファイルを削除する。

### フェーズ 5: バックアップ、復元、Vacuum、検証

バックアップは 1 つのアーカイブファイルのままにする:

- すべてのグローバルデータベースとエージェントデータベースをチェックポイントする。
- SQLite バックアップセマンティクスまたは `VACUUM INTO` で各 DB をスナップショットする。
- コンパクトな DB スナップショット、設定、外部認証情報、要求されたワークスペースエクスポートをアーカイブする。
- 生のライブ `*.sqlite-wal` と `*.sqlite-shm` ファイルは省略する。
- すべての DB スナップショットを開き、`PRAGMA integrity_check` を実行して検証する。
  `openclaw backup create` はデフォルトでこのアーカイブ検証を行う。
  `--no-verify` は書き込み後のアーカイブパスだけをスキップし、スナップショット作成時の整合性チェックはスキップしない。
- 復元はスナップショットを対象パスへコピーし戻す。このブランチは、未出荷の SQLite レイアウトを `user_version = 1` にリセットする。将来の出荷済みスキーマ変更は、必要になった時点で明示的な移行を追加できる。

### フェーズ 6: ワーカーランタイム

データベース分割が入る間、ワーカーモードは実験的なままにする:

- ワーカーはエージェント ID、実行 ID、ファイルシステムモード、DB レジストリ ID を受け取る。
- 各ワーカーは自身の SQLite 接続を開く。
- 親はチャネル配信、承認、設定、キャンセル権限を保持する。
- アクティブな実行ごとに 1 ワーカーから始める。プーリングは、ライフサイクルと DB 接続の所有権が安定してから追加する。

### フェーズ 7: 古い世界を削除する

ランタイムセッション管理は完了。古い世界は、明示的な doctor 入力またはサポート/エクスポート出力としてのみ許可される:

- ランタイムの `sessions.json`、トランスクリプト JSONL、サンドボックスレジストリ JSON、タスクサイドカー SQLite、Plugin 状態サイドカー SQLite 書き込みは禁止。
- JSON/セッションファイルの剪定、ファイルトランスクリプト切り詰め、セッションファイルロック、ロック形状のセッションテストは禁止。
- 古いセッションファイルを最新に保つことを目的とするランタイム互換エクスポートは禁止。
- 明示的なサポートエクスポートは、ユーザー要求のアーカイブ/マテリアライズ形式として残り、ファイル名をランタイム ID に戻してはならない。

## バックアップと復元

バックアップは 1 つのアーカイブファイルにすべきだが、データベースキャプチャは SQLite ネイティブにすべき:

1. 長時間実行される書き込み活動を停止するか、短いバックアップバリアに入る。
2. すべてのグローバルデータベースとエージェントデータベースで、チェックポイントを実行する。
3. SQLite バックアップセマンティクスまたは `VACUUM INTO` を使い、各データベースを一時バックアップディレクトリへスナップショットする。
4. 圧縮済みデータベーススナップショット、設定ファイル、認証情報ディレクトリ、選択したワークスペース、マニフェストをアーカイブする。
5. 含まれるすべての SQLite スナップショットを開き、`PRAGMA integrity_check` を実行してアーカイブを検証する。
   `openclaw backup create` はデフォルトでこれを行う。`--no-verify` は、意図的に書き込み後のアーカイブパスをスキップする場合にのみ使う。

主要なバックアップ形式として、生のライブ `*.sqlite`、`*.sqlite-wal`、`*.sqlite-shm` コピーに依存しない。アーカイブマニフェストには、データベースの役割、エージェント ID、スキーマバージョン、ソースパス、スナップショットパス、バイトサイズ、整合性ステータスを記録すべき。

復元は、アーカイブスナップショットからグローバルデータベースとエージェントデータベースファイルを再構築すべき。SQLite レイアウトはまだ出荷されていないため、このリファクターではバージョン 1 スキーマと doctor のファイルからデータベースへのインポートのみを保持する。復元コマンドはまずアーカイブを検証し、その後、検証済みの展開ペイロードから各マニフェストアセットを置き換える。

## ランタイムリファクタープラン

1. データベースレジストリ API を追加する。
   - グローバル DB とエージェントごとの DB パスを解決する。
   - 未出荷のスキーマは `user_version = 1` のままにする。出荷済みスキーマで必要になるまで、スキーマ移行ランナーコードは追加しない。
   - テスト、バックアップ、doctor で使う close/checkpoint/integrity ヘルパーを追加する。

2. サイドカー SQLite ストアを畳み込む。
   - Plugin 状態テーブルをグローバルデータベースへ移動する。ランタイム書き込みは完了。未出荷のレガシーサイドカーインポーターは削除済み。
   - タスクレジストリテーブルをグローバルデータベースへ移動する。ランタイム書き込みは完了。未出荷のレガシーサイドカーインポーターは削除済み。
   - Task Flow テーブルをグローバルデータベースへ移動する。ランタイム書き込みは完了。未出荷のレガシーサイドカーインポーターは削除済み。
   - 組み込みメモリ検索テーブルを各エージェントデータベースへ移動する。完了。明示的なカスタム `memorySearch.store.path` は doctor 設定移行で削除されるようになった。
     フル再インデックスはメモリテーブルだけを対象にその場で実行される。古いファイル全体のスワップパスとサイドカーインデックススワップヘルパーは削除済み。
   - これらのサブシステムから、重複するデータベースオープナー、WAL 設定、権限ヘルパー、クローズパスを削除する。

3. エージェント所有テーブルをエージェントごとのデータベースへ移動する。
   - グローバルデータベースレジストリを通じて、必要時にエージェント DB を作成する。完了。
   - ランタイムセッションエントリ、トランスクリプトイベント、VFS 行、ツールアーティファクトをエージェント DB へ移動する。完了。
   - ブランチローカルの共有 DB セッションエントリ、トランスクリプトイベント、VFS 行、ツールアーティファクトは移行しない。そのレイアウトは一度も出荷されていない。doctor にはレガシーファイルからデータベースへのインポートのみを残す。

4. セッションストア API を置き換える。
   - ランタイム ID としての `storePath` を削除する。ランタイムでは完了し、`check:database-first-legacy-stores` でガード済み。セッションメタデータ、ルート更新、コマンド永続化、CLI セッションクリーンアップ、Feishu 推論プレビュー、トランスクリプト状態永続化、サブエージェント深度、認証プロファイルのセッション上書き、親フォークロジック、QA ラボ検査は、正規のエージェント/セッションキーからデータベースを解決するようになった。
     Gateway/TUI/UI/macOS のセッション一覧レスポンスは、レガシーの `path` ではなく `databasePath` を公開するようになった。macOS デバッグサーフェスは、`session.store` 設定を書き込む代わりに、エージェントごとのデータベースを読み取り専用状態として表示する。
     `/status`、チャット駆動の軌跡エクスポート、CLI 依存プロキシは、レガシーストアパスを伝播しなくなった。トランスクリプト使用量フォールバックは、エージェント/セッション ID によって SQLite を読む。ランタイムとブリッジのテストは `storePath` を公開しなくなった。doctor/移行入力がそのレガシーフィールド名を所有する。
     Gateway の結合セッション読み込みには、テンプレート化されていない `session.store` 値のための特別なランタイムブランチがなくなった。エージェントごとの SQLite 行を集約する。
     レガシーのセッションロック doctor レーンとその `.jsonl.lock` クリーンアップヘルパーは削除済み。現在は SQLite がセッション同時実行境界。
     ホットなランタイム呼び出し箇所は `resolveSessionRowEntry` などの行指向ヘルパー名を使う。古い `resolveSessionStoreEntry` 互換エイリアスは、ランタイムと Plugin SDK エクスポートから削除済み。

- `{ agentId, sessionKey }` 行操作を使う。
  完了: `getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、`patchSessionEntry`、`listSessionEntries` は、セッションストアパスを必要としない SQLite ファースト API。ステータスサマリー、ローカルエージェントステータス、ヘルス、`openclaw sessions` 一覧コマンドは、エージェントごとの行を直接読み取り、`sessions.json` パスではなくエージェントごとの SQLite データベースパスを表示するようになった。
- ストア全体の delete/insert を、`upsertSessionEntry`、`deleteSessionEntry`、`listSessionEntries`、SQL クリーンアップクエリに置き換える。
  ランタイムは完了。ホットパスは行 API と競合時に再試行される行パッチを使うようになった。残るストア全体のインポート/置換ヘルパーは、移行インポートコードと SQLite バックエンドテストに限定される。
  - `store-writer.ts` とライターキューテストを削除する。完了。
  - セッション行 upsert/patch から、ランタイムのレガシーキー剪定とエイリアス削除パラメーターを削除する。完了。

5. ランタイム JSON レジストリ動作を削除する。
   - サンドボックスレジストリの読み書きを SQLite のみにする。完了。
   - モノリシック JSON とシャード化 JSON は移行ステップからのみインポートする。完了。
   - シャード化レジストリロックと JSON 書き込みを削除する。完了。

- 形状がホットパス運用状態のままである場合、レジストリ行を汎用の不透明 JSON として保存するのではなく、型付きレジストリテーブルを 1 つ保持する。完了。

6. ファイルロック形状のセッション変更を削除する。
   - ランタイムロック作成とランタイムロック API は完了。
   - スタンドアロンのレガシー `.jsonl.lock` doctor クリーンアップレーンは削除済み。
   - `session.writeLock` は doctor で移行されるレガシー設定であり、型付きランタイム設定ではない。
   - 状態整合性には、孤立トランスクリプトファイルを剪定する別パスがなくなった。doctor 移行はレガシー JSONL ソースのインポート/削除を 1 箇所で行う。
   - Gateway シングルトン協調は、`gateway_locks` 配下の型付き SQLite `state_leases` 行を使い、ファイルロックディレクトリサーフェスを公開しなくなった。
   - 汎用 Plugin SDK 重複排除永続化はファイルロックや JSON ファイルを使わなくなった。共有 SQLite Plugin 状態行を書き込む。完了。
   - QMD 埋め込み協調は、`qmd/embed.lock` の代わりに SQLite 状態リースを使う。完了。

7. ワーカーをデータベース対応にする。
   - ワーカーは自身の SQLite 接続を開く。
   - 親は配信、チャネルコールバック、設定を所有する。
   - ワーカーはライブハンドルではなく、エージェント ID、実行 ID、ファイルシステムモード、DB レジストリ ID を受け取る。
   - `vfs-only` は実験的なままで、エージェントデータベースをストレージルートとして使う。
   - まずアクティブな実行ごとに 1 ワーカーを維持する。プーリングは、DB 接続の寿命とキャンセル動作が単純になるまで待てる。

8. バックアップ統合。
   - バックアップに、SQLite バックアップまたは `VACUUM INTO` でグローバルおよびエージェントのデータベースをスナップショットする方法を教える。状態アセット配下で検出された `*.sqlite` ファイルについて完了。
   - SQLite の整合性とスキーマバージョンに対するバックアップ検証を追加する。バックアップ作成とデフォルトアーカイブ検証の整合性チェックについて完了。
   - バックアップ実行メタデータを SQLite に記録する。アーカイブパス、ステータス、マニフェスト JSON を持つ共有 `backup_runs` テーブルで完了。
   - 検証済みアーカイブスナップショットからの復元を追加する。完了: `openclaw backup
restore` は展開前に検証し、検証器の正規化済みマニフェストを使用し、`--dry-run` をサポートし、記録されたソースパスを置き換える前に `--yes` を要求する。
   - 要求された場合のみ VFS/ワークスペースのエクスポートを含める。セッション内部を JSON または JSONL としてエクスポートしない。

9. 廃止されたテストとコードを削除する。既知のランタイムセッションサーフェスについて完了。

- `sessions.json` またはトランスクリプト JSONL ファイルのランタイム作成をアサートするテストを削除する。コアセッションストア、チャット、Gateway トランスクリプトイベント、プレビュー、ライフサイクル、コマンドのセッションエントリ更新、自動返信のリセット/トレース、memory-core Dreaming フィクスチャ、承認ターゲットルーティング、セッショントランスクリプト修復、セキュリティ権限修復、軌跡エクスポート、セッションエクスポートについて完了。
  Active Memory のトランスクリプトテストは、現在 SQLite スコープと、一時的または永続化された JSONL ファイルが作成されないことをアサートする。
  古い Heartbeat のトランスクリプト刈り込みリグレッションは、ランタイムが JSONL トランスクリプトを切り詰めなくなったため削除された。
  エージェントのセッション一覧ツールテストは、Gateway レスポンス形状としてレガシー `sessions.json` パスをモデル化しなくなった。アプリ/UI/macOS テストは `databasePath` を使用する。
  `/status` のトランスクリプト使用量テストは、JSONL ファイルを書き込む代わりに SQLite トランスクリプト行を直接シードするようになった。
  Gateway セッションライフサイクルテストは、SQLite トランスクリプトシードヘルパーを直接使用するようになった。古い単一行のセッションファイルフィクスチャ形状は、リセットと削除のカバレッジからなくなった。
  `sessions.delete` はファイル時代の `archived: []` フィールドを返さなくなった。削除は行の変更結果のみを報告する。古い `deleteTranscript` オプションもなくなった。セッションを削除すると正規の `sessions` ルートが削除され、SQLite がセッション所有のトランスクリプト、スナップショット、軌跡行をカスケードするため、どの呼び出し元もトランスクリプトの孤児を残したりクリーンアップ分岐を忘れたりできない。
  コンテキストエンジンの軌跡キャプチャテストは、`session.trajectory.jsonl` を読む代わりに、分離されたエージェントデータベースから `trajectory_runtime_events` 行を読むようになった。
  Docker MCP チャネルのシードスクリプトは、SQLite 行を直接シードするようになった。直接の `sessions.json` 書き込みは doctor フィクスチャに限定される。
  Tool Search Gateway E2E は、`agents/<agentId>/sessions/*.jsonl` ファイルをスキャンする代わりに、SQLite トランスクリプト行からツール呼び出し証拠を読む。
  Memory-core のホストイベントと session-corpus スクラッチ行は、現在共有 SQLite Plugin 状態に存在する。`events.jsonl` と `session-corpus/*.txt` はレガシー doctor 移行入力専用である。アクティブ行は `.dreams/session-corpus` ではなく、`memory/session-ingestion/` 仮想パスを使用する。古い memory-core Dreaming 修復モジュールとその CLI/Gateway テストは、ランタイムがそのコーパスのファイルアーカイブ修復を所有しなくなったため削除された。Memory-core のブリッジ/公開アーティファクトテストは `.dreams/events.jsonl` を露出しなくなり、SQLite バックの仮想 JSON アーティファクト名を使用する。
  公開 SDK/Codex テストドキュメントは、セッションファイルではなく SQLite セッション状態と記述するようになり、チャネルターン例は `storePath` 引数を公開しなくなった。
  Matrix 同期状態は、SQLite Plugin 状態ストアを直接使用するようになった。アクティブなクライアント/ランタイム契約は `bot-storage.json` パスではなくアカウントストレージルートを渡し、doctor はレガシー `bot-storage.json` を SQLite にインポートしてからソースを削除する。QA Matrix の再起動/破壊的シナリオは、偽の `bot-storage.json` ファイルを作成または削除する代わりに、SQLite 同期行を直接変更するようになり、E2EE 基盤は偽の `sync-store.json` パスではなく同期ストアルートを渡す。
  Matrix ストレージルート選択は、レガシー同期/スレッド JSON ファイルでルートをスコアリングしなくなった。耐久的なルートメタデータと実際の暗号状態を使用する。
  ランタイム SQLite セッションバックエンドテストスイートは、`sessions.json` を捏造しなくなった。レガシーソースフィクスチャは、それらをインポートする doctor テストに存在するようになった。
  Gateway セッションテストは、`createSessionStoreDir` ヘルパーや未使用の一時セッションストアパス設定を公開しなくなった。フィクスチャディレクトリは明示的で、直接の行設定は SQLite セッション行の命名を使用する。
  doctor 専用 JSON5 セッションストアパーサーカバレッジは、インフラテストから doctor 移行テストへ移動したため、ランタイムテストスイートはレガシーセッションファイル解析を所有しなくなった。
  Microsoft Teams ランタイム SSO/保留中アップロードテストは、JSON サイドカーフィクスチャやパーサーを持たなくなった。レガシー SSO トークン解析は Plugin 移行モジュール内にのみ存在する。Telegram テストは偽の `/tmp/*.json` ストアパスをシードしなくなり、SQLite バックのメッセージキャッシュを直接リセットする。汎用 OpenClaw テスト状態ヘルパーは、レガシー `auth-profiles.json` ライターを公開しなくなった。doctor 認証移行テストがそのフィクスチャをローカルに所有する。
  TUI 最終セッションポインター、exec 承認、Active Memory トグル、Matrix 重複排除/起動検証、Memory Wiki ソース同期、現在の会話バインディング、オンボーディング認証、Hermes シークレットインポートのランタイムテストは、古いサイドカーファイルを作成したり、古いファイル名が存在しないことをアサートしたりしなくなった。SQLite 行と公開ストア API を通じて動作を証明する。レガシーソースファイル名が属するのは doctor/移行テストだけである。
  デバイス/Node ペアリング、チャネル allowFrom、再起動インテント、再起動ハンドオフ、セッション配信キューエントリ、設定ヘルス、iMessage キャッシュ、Cron ジョブ、PI トランスクリプトヘッダー、サブエージェントレジストリ、管理対象画像添付のランタイムテストも、無視または不在を証明するためだけに廃止済み JSON/JSONL ファイルを作成しなくなった。
  PI オーバーフローリカバリには、SessionManager の再書き込み/切り詰めフォールバックがなくなった。ツール結果の切り詰めとコンテキストエンジンのトランスクリプト再書き込みは SQLite トランスクリプト行を変更し、その後データベースからアクティブなプロンプト状態を更新する。
  永続化された SessionManager メッセージ追加は、親選択と冪等性のためにアトミックな SQLite トランスクリプト追加ヘルパーへ委譲する。通常のメタデータ/カスタムエントリ追加も SQLite 内で現在の親を選択するため、古いマネージャーインスタンスが SQLite 以前の親チェーン競合を復活させない。
  ターン途中の事前チェックと `sessions_yield` 用の合成 PI テールクリーンアップは、SQLite トランスクリプト状態を直接トリムするようになった。古い SessionManager テール削除ブリッジとそのテストは削除された。
  Compaction チェックポイントキャプチャも SQLite からのみスナップショットする。呼び出し元は代替トランスクリプトソースとしてライブ SessionManager を渡さなくなった。
- 移行専用にレガシーファイルをシードするテストは保持する。
- アクティブなランタイムサーフェスでは、JSON ファイル証拠が SQL 行証拠に置き換えられた。

- レガシーセッション/キャッシュ JSON パスへのランタイム書き込みに対する静的禁止を追加する。リポジトリガードについて完了。

10. 移行レポートを監査可能にする。
    - 移行実行を SQLite に、開始/終了タイムスタンプ、ソースパス、ソースハッシュ、件数、警告、バックアップパスとともに記録する。
      完了: レガシー状態移行の実行は、ソースパス/テーブルインベントリ、ソースファイル SHA-256、サイズ、レコード件数、警告、バックアップパスを持つ `migration_runs` レポートを永続化するようになった。
      完了: レガシー状態移行の実行は、ソースレベルの監査と将来のスキップ/バックフィル判断のために `migration_sources` 行も永続化する。
    - apply を冪等にする。部分インポート後に再実行した場合、すでにインポート済みのソースをスキップするか、安定キーでマージする必要がある。
      完了: セッションインデックス、トランスクリプト、配信キュー、Plugin 状態、タスク台帳、エージェント所有のグローバル SQLite 行は、安定キーまたは upsert/replace セマンティクスを通じてインポートされるため、再実行しても耐久行を重複させずにマージされる。
    - 失敗したインポートでは、元のソースファイルをそのまま残す必要がある。
      完了: 失敗したトランスクリプトインポートは、元の JSONL ソースを検出されたパスに残すようになり、`migration_sources` は次回の doctor 実行用に、そのソースを `removed_source=0` の `warning` として記録する。

## パフォーマンスルール

- スレッド/プロセスごとに 1 つの接続でよい。ワーカー間でハンドルを共有しない。
- WAL、`foreign_keys=ON`、30 秒の busy タイムアウト、短い `BEGIN IMMEDIATE` 書き込みトランザクションを使用する。
- 明示的なミューテックス/バックプレッシャーセマンティクスを持つ非同期トランザクション API が追加されるまでは、書き込みトランザクションヘルパーを同期のままにする。
- 親配信書き込みは小さく、トランザクション内に保つ。
- ストア全体の再書き込みを避ける。行レベルの upsert/delete を使用する。
- ホットコードを移動する前に、エージェント別一覧、セッション別一覧、updated-at、実行 ID、有効期限パス用のインデックスを追加する。
- 大きなアーティファクト、メディア、ベクトルは、base64 や数値配列 JSON ではなく、BLOB またはチャンク化された BLOB 行として保存する。
- 不透明な Plugin 状態エントリは小さく、スコープを限定する。
- ファイルシステム刈り込みの代わりに、TTL/有効期限用の SQL クリーンアップを追加する。
  データベース所有のランタイムストアについて完了: メディア、Plugin 状態、Plugin blob、永続的重複排除、エージェントキャッシュはすべて SQLite 行を通じて期限切れになる。残るファイルシステムクリーンアップは、一時的な具現化または明示的な削除コマンドに限定される。

## 静的禁止事項

レガシー状態パスへの新しいランタイム書き込みを失敗させるリポジトリチェックを追加する:

- `sessions.json`
- マテリアライズされたサポートバンドル出力を除く `*.trajectory.jsonl`
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
- サンドボックスレジストリシャードの JSON ファイル
- ネイティブフックリレー `/tmp` ブリッジ JSON ファイル
- `plugin-state/state.sqlite`
- アドホックな `openclaw-state.sqlite` ランタイムサイドカー
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
- ブラウザプロファイル装飾 `.openclaw-profile-decorated`
- `SessionManager.open(...)` ファイルバックのセッションオープナー
- `SessionManager.listAll(...)` と `TranscriptSessionManager.listAll(...)`
  トランスクリプト一覧ファサード
- `SessionManager.forkFromSession(...)` と
  `TranscriptSessionManager.forkFromSession(...)` トランスクリプトフォークファサード
- `SessionManager.newSession(...)` と `TranscriptSessionManager.newSession(...)`
  ミュータブルセッション置換ファサード
- `SessionManager.createBranchedSession(...)` と
  `TranscriptSessionManager.createBranchedSession(...)` ブランチセッションファサード

この禁止では、テストがレガシーフィクスチャを作成することと、移行コードが
レガシーファイルソースを読み取り、インポートし、削除することを許可する必要があります。未出荷の SQLite サイドカーは禁止のままで、
doctor インポート許可の対象にはなりません。

## 完了基準

- ランタイムデータとキャッシュの書き込みは、グローバルまたはエージェントの SQLite データベースに送られる。
- ランタイムは、セッションインデックス、トランスクリプト JSONL、サンドボックスレジストリ
  JSON、タスクサイドカー SQLite、または plugin-state サイドカー SQLite を書き込まなくなる。未出荷のタスク
  および plugin-state サイドカー SQLite インポーターは削除される。
- レガシーファイルのインポートは doctor 専用。
- バックアップは、コンパクトな SQLite スナップショットと整合性証明を含む 1 つのアーカイブを生成する。
- エージェントワーカーは、ディスク、VFS スクラッチ、または実験的な VFS のみの
  ストレージで実行できる。
- 設定と明示的な認証情報ファイルだけが、想定される永続的な
  非データベース制御ファイルとして残る。
- リポジトリチェックは、レガシーランタイムファイルストアの再導入を防ぐ。
