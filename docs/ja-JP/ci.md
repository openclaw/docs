---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更する場合
summary: CI ジョブグラフ、スコープゲート、リリースアンブレラ、対応するローカルコマンド
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-11T20:22:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは diff を分類し、関係のない領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` によってオプトインのままです。リリース専用の Plugin カバレッジは別個の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプラインの概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更されたスコープ、変更された extensions を検出し、CI マニフェストを構築する                   | 非ドラフトの push と PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | 非ドラフトの push と PR では常に |
| `security-dependency-audit`      | npm アドバイザリに対する、依存関係不要の本番 lockfile 監査                                          | 非ドラフトの push と PR では常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | 非ドラフトの push と PR では常に |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み成果物チェック、再利用可能な下流成果物をビルド                       | Node 関連の変更              |
| `checks-fast-core`               | バンドル済み/Plugin コントラクト/プロトコルチェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャンネルコントラクトチェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | チャンネル、バンドル済み、コントラクト、extension レーンを除く Core Node テストシャード                          | Node 関連の変更              |
| `check`                          | シャード化されたメインローカルゲート相当: 本番型、lint、ガード、テスト型、厳格な smoke                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、シャード化された境界/プロンプトドリフト、extension ガード、パッケージ境界、Gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                                            | Node 関連の変更              |
| `checks`                         | ビルド済み成果物チャンネルテストの検証器                                                                 | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                | リリース向けの手動 CI ディスパッチ    |
| `check-docs`                     | docs のフォーマット、lint、リンク切れチェック                                                             | docs が変更された場合                       |
| `skills-python`                  | Python ベースの Skills 向け Ruff + pytest                                                                    | Python Skill 関連の変更      |
| `checks-windows`                 | Windows 固有のプロセス/パステストと共有ランタイム import 指定子の回帰                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済み成果物を使用する macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリ向けの Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方のフレーバーの Android unit テストと 1 つの debug APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                 | メイン CI 成功時または手動ディスパッチ |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む日次/オンデマンドの Kova ランタイム性能レポート | スケジュール実行と手動ディスパッチ      |

## フェイルファスト順序

1. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォームマトリックスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームレーンとランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、それは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI の concurrency キーはバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

`ci-timings-summary` ジョブは、各非ドラフト CI 実行についてコンパクトな `ci-timings-summary` 成果物をアップロードします。現在の実行のウォール時間、キュー時間、最も遅いジョブ、失敗したジョブを記録するため、CI 健全性チェックが Actions ペイロード全体を繰り返しスクレイピングする必要はありません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit テストでカバーされています。手動ディスパッチは changed-scope 検出をスキップし、すべてのスコープ付き領域が変更されたかのように preflight マニフェストを動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それ自体では Windows、Android、macOS ネイティブビルドを強制しません。これらのプラットフォームレーンはプラットフォームソース変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された安価な Core テスト fixture 編集、狭い Plugin コントラクトヘルパー/テストルーティング編集** は、高速な Node のみのマニフェストパスを使用します: `preflight`、セキュリティ、単一の `checks-fast-core` タスクです。このパスは、変更が高速タスクが直接実行するルーティングまたはヘルパー表面に限定されている場合、ビルド成果物、Node 22 互換性、チャンネルコントラクト、完全な Core シャード、バンドル済み Plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI runner ヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフロー表面にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに留まります。

最も遅い Node テストファミリーは、各ジョブが runner を過剰に予約せず小さく保たれるように分割またはバランスされています。チャンネルコントラクトは標準 GitHub runner フォールバック付きの 3 つの重み付き Blacksmith バックアップシャードとして実行され、Core unit fast/support レーンは別々に実行され、Core ランタイム基盤は state、process/config、Cron、shared シャードに分割され、auto-reply はバランスされた worker として実行されます (reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割)。また、agentic Gateway/server 設定は、ビルド成果物を待つのではなく chat/auth/model/http-plugin/runtime/startup レーンに分割されます。広範なブラウザー、QA、media、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest 設定を使用します。include-pattern シャードは CI シャード名を使用してタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology アーキテクチャを Gateway watch カバレッジから分離します。boundary guard リストは 4 つのマトリックスシャードに分割され、それぞれが選択された独立ガードを並行実行し、チェックごとのタイミングを出力します。高コストな Codex happy-path プロンプトスナップショットドリフトチェックは、手動 CI とプロンプトに影響する変更のみで独自の追加ジョブとして実行されるため、通常の無関係な Node 変更がコールドプロンプトスナップショット生成の後ろで待つことはなく、boundary シャードはバランスを保ちながら、プロンプトドリフトはそれを発生させた PR に引き続き固定されます。同じフラグは、ビルド済み成果物の Core support-boundary シャード内のプロンプトスナップショット Vitest 生成もスキップします。Gateway watch、チャンネルテスト、Core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play debug APK をビルドします。third-party フレーバーには別個のソースセットやマニフェストはありません。その unit-test レーンは、SMS/call-log BuildConfig フラグ付きでそのフレーバーを引き続きコンパイルしつつ、Android 関連の各 push で重複した debug APK パッケージングジョブを回避します。

`check-dependencies` シャードは `pnpm deadcode:dependencies` (最新の Knip バージョンに固定され、`dlx` インストールで pnpm の minimum release age を無効化した、本番 Knip の依存関係のみのパス) と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な dynamic Plugin、生成物、ビルド、live-test、package bridge 表面は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper へ送るターゲット側ブリッジです。信頼されていない pull request コードを checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、その後コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` へディスパッチします。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request レビュー要求のための `clawsweeper_item`;
- issue コメント内の明示的な ClawSweeper コマンドのための `clawsweeper_comment`;
- `main` push 上のコミットレベルレビュー要求のための `clawsweeper_commit_review`;
- ClawSweeper エージェントが検査する可能性がある一般的な GitHub アクティビティのための `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します: event type、action、actor、repository、item number、URL、title、state、および存在する場合は comment または review の短い抜粋です。Webhook 本文全体の転送は意図的に避けます。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` であり、正規化されたイベントを ClawSweeper エージェント向けの OpenClaw Gateway hook に投稿します。

一般アクティビティは観測であり、デフォルト配送ではありません。ClawSweeper エージェントは prompt 内で Discord ターゲットを受け取り、そのイベントが意外、対応可能、リスクあり、または運用上有用な場合にのみ `#clawsweeper` へ投稿するべきです。通常の open、edit、bot churn、重複 Webhook ノイズ、通常の review トラフィックでは `NO_REPLY` になるべきです。

GitHub のタイトル、コメント、本文、レビュー文、ブランチ名、コミットメッセージは、このパス全体で信頼できないデータとして扱う。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではない。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行するが、Android 以外のすべてのスコープ付きレーンを強制的に有効にする: Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行する。完全なリリース包括ワークフローは `include_android=true` を渡して Android を有効にする。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張機能バッチスイープ、Plugin プレリリース Docker レーンは CI から除外される。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行される。

手動実行では一意の同時実行グループを使うため、リリース候補のフルスイートが同じ ref 上の別のプッシュまたは PR 実行によってキャンセルされない。任意の `target_ref` 入力により、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できる。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約 (`security-scm-fast`、`security-dependency-audit`、`security-fast`)、高速プロトコル/契約/バンドルチェック、シャード化されたチャンネル契約チェック、lint を除く `check` シャード、`check-additional` 集約、Node テスト集約検証、ドキュメントチェック、Python skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリクスはより早くキューに入れる |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`check-additional` シャード、`android`                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`、`check-lint` (8 vCPU は節約できた分よりもコストが高くなるほど CPU 依存が強い)。install-smoke Docker ビルド (32 vCPU のキュー時間は節約できた分よりもコストが高かった)                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。フォークでは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。フォークでは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                     |

正規リポジトリの CI は、Blacksmith をデフォルトのランナーパスとして維持する。`preflight` 中に、`scripts/ci-runner-labels.mjs` は最近キュー済みおよび進行中の Actions 実行を確認し、キュー済みの Blacksmith ジョブを探す。特定の Blacksmith ラベルに既にキュー済みジョブがある場合、その正確なラベルを使う後続ジョブは、その実行に限り対応する GitHub ホストランナー (`ubuntu-24.04`、`windows-2025`、または `macos-latest`) にフォールバックする。同じ OS ファミリー内の他の Blacksmith サイズは、引き続き主要ラベルを使う。API プローブが失敗した場合、フォールバックは適用されない。

## ローカル相当

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw パフォーマンス

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローである。`main` で毎日実行され、手動でディスパッチすることもできる。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークする。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定する。公開されるレポートパスと最新ポインターは、テスト対象 ref をキーとし、各 `index.md` にはテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターが記録される。

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行する。

- `mock-provider`: 決定的な偽 OpenAI 互換認証を持つローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポット向け CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされる。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行する。デフォルト、hook、50-Plugin 起動ケースでの Gateway 起動時間とメモリ、繰り返し mock-OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンドである。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生 JSON がその隣に置かれる。

すべてのレーンは GitHub アーティファクトをアップロードする。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、このワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下の `openclaw/clawgrit-reports` にコミットする。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれる。

## フルリリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動包括ワークフローである。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動の `CI` ワークフローをディスパッチし、リリース専用 Plugin/パッケージ/静的/Docker の証明用に `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチする。安定版/デフォルト実行では、網羅的な live/E2E と Docker リリースパスカバレッジを `run_release_soak=true` の背後に置く。`release_profile=full` はその soak カバレッジを強制的に有効にし、広範なアドバイザリ検証が広範なままになるようにする。`rerun_group=all` と `release_profile=full` を指定すると、リリースチェックの `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行する。公開後は、`release_package_spec` を渡すことで、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、再ビルドせずに出荷済み npm パッケージを再利用できる。Telegram が別のパッケージを証明する必要がある場合にのみ、`npm_telegram_package_spec` を使う。

ステージマトリクス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、
およびフォーカスされた再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローである。リリースタグが存在し、OpenClaw npm preflight が成功した後、`release/YYYY.M.D` または `main` からディスパッチする。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にのみ保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチする。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

変化の速いブランチでピン留めされたコミット証明が必要な場合は、
`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。このヘルパーは、対象 SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、そのピン留めされた ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証し、実行が完了したら一時ブランチを削除します。統括検証も、いずれかの子ワークフローが異なる SHA で実行された場合に失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な助言的プロバイダー/メディア行列を意図的に必要とする場合にのみ `full` を使用します。`run_release_soak` は、stable/デフォルトのリリースチェックが網羅的なライブ/E2E と Docker リリースパスの soak を実行するかどうかを制御します。`full` は soak を強制的に有効にします。

- `minimum` は最速の OpenAI/コアのリリース必須レーンを維持します。
- `stable` は stable プロバイダー/バックエンドセットを追加します。
- `full` は広範な助言的プロバイダー/メディア行列を実行します。

統括はディスパッチされた子実行 ID を記録し、最終の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行について最も遅いジョブの表を追加します。子ワークフローを再実行してグリーンになった場合は、統括結果とタイミング概要を更新するために、親検証ジョブだけを再実行します。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常のフル CI 子だけには `ci`、Pluginプレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、または統括上のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正後に失敗したリリースボックスの再実行範囲を限定できます。1つの失敗したクロス OS レーンについては、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade の概要にはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは助言的なものなので、QA のみの失敗は警告しますが、リリースチェック検証はブロックしません。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。また soak カバレッジが実行される場合は、ライブ/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再パッケージすることを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古い統括を置き換えます。親モニターは、親がキャンセルされたとき、すでにディスパッチ済みの子ワークフローをキャンセルするため、新しい main 検証が古い2時間のリリースチェック実行の後ろで待機し続けることはありません。リリースブランチ/タグ検証と焦点を絞った再実行グループでは、`cancel-in-progress: false` を維持します。

## ライブおよび E2E シャード

リリースのライブ/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、単一の直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- プロバイダーでフィルターされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声/動画シャードと、プロバイダーでフィルターされた音楽シャード

これにより同じファイルカバレッジを維持しつつ、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約名である `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも引き続き有効です。

ネイティブのライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリを検証するだけです。Docker バックエンドのライブスイートは通常の Blacksmith ランナー上に維持します。コンテナジョブはネストされた Docker テストを起動する場所として適していません。

Docker バックエンドのライブモデル/バックエンドシャードは、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー分割 Gateway、CLI バックエンド、ACP バインド、Codex ハーネスのシャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップ経路が停止した場合にリリースチェック予算全体を消費するのではなく、素早く失敗します。これらのシャードが完全なソース Docker ターゲットを独立して再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか?」という問いには `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、Package Acceptance は、ユーザーがインストールまたはアップデート後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、ソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを GitHub ステップ概要に出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` ではない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのプレリリース/stable acceptance に使用します。
- `source=ref` は、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、デタッチされた worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から1つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証がライブ ClawHub の可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、スタンドアロンディスパッチ用に公開済み npm spec パスを維持します。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージを含む、専用のアップデートおよびPluginテストポリシーについては、[アップデートとPluginのテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みのリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub skill インストール、古い plugin 依存関係のクリーンアップ、構成済み plugin のインストール修復、オフライン plugin、plugin-update、Telegram の証明を、同じ解決済みパッケージ tarball 上に保ちます。ベータ公開後に同じマトリックスを、再ビルドせずに出荷済み npm パッケージに対して実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance がリリース検証の残りとは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム動作も引き続きカバーします。パッケージ/更新のプロダクト検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで、実行ごとに公開済みパッケージのベースラインを 1 つ検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` がフォールバックの公開済みベースラインを選択し、既定では `openclaw@latest` になります。失敗レーンの再実行コマンドは、そのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加えて、plugin 互換性境界の固定リリースと、Feishu 構成、保持された bootstrap/persona ファイル、構成済み OpenClaw plugin インストール、チルダログパス、古いレガシー plugin 依存関係ルート向けの issue 形状フィクスチャへ展開します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに個別のターゲット Docker runner ジョブへシャーディングされます。別個の `Update Migration` ワークフローは、通常の Full Release CI の幅ではなく、公開済み更新クリーンアップを網羅的に確認する場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定して `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ仕様を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを保つか、シナリオマトリックス向けに `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを構成し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みレーンとインストーラーのフレッシュレーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドをインポートできることも検証します。OpenAI クロス OS agent-turn smoke は、`OPENCLAW_CROSS_OS_OPENAI_MODEL` が設定されている場合はそれを既定値にし、それ以外の場合は `openai/gpt-5.4` を使用するため、インストールと Gateway 証明は GPT-4.x の既定値を避けつつ、GPT-5 テストモデル上に留まります。

### レガシー互換性ウィンドウ

Package Acceptance には、公開済みパッケージ向けの境界付きレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指している場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball 由来の fake git フィクスチャから欠落している pnpm `patchedDependencies` を取り除くことができ、永続化された `update.channel` の欠落をログに記録できます。
- plugin smoke は、レガシーのインストール記録の場所を読み取るか、マーケットプレイスのインストール記録永続化の欠落を許容できます。
- `plugin-update` は、インストール記録と再インストールなしの動作が変わらないことを引き続き要求しつつ、構成メタデータ移行を許容できます。

公開済みの `2026.4.26` パッケージは、すでに出荷済みだったローカルビルドメタデータスタンプファイルについても警告する場合があります。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

### 例

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

失敗した Package Acceptance 実行をデバッグする場合は、まず `resolve_package` サマリーで、パッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを推奨します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージサーフェス、バンドル済み plugin パッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコア plugin/channel/Gateway/Plugin SDK サーフェスに触れる pull request で実行されます。ソースのみのバンドル済み plugin 変更、テストのみの編集、docs のみの編集は Docker worker を予約しません。高速パスは root Dockerfile イメージを 1 回ビルドし、CLI を確認し、agents delete shared-workspace CLI smoke を実行し、コンテナー gateway-network e2e を実行し、バンドル済み extension build arg を検証し、240 秒の集約コマンドタイムアウト内で境界付きバンドル済み plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限が設定されます）。
- **フルパス**は、夜間スケジュール実行、手動 dispatch、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker サーフェスに本当に触れる pull request 向けに、QR パッケージインストールとインストーラー Docker/更新カバレッジを保持します。フルモードでは、install-smoke は 1 つの target-SHA GHCR root Dockerfile smoke イメージを準備または再利用し、その後 QR パッケージインストール、root Dockerfile/Gateway smoke、インストーラー/更新 smoke、高速バンドル済み plugin Docker E2E を個別のジョブとして実行するため、インストーラー作業が root イメージ smoke の後ろで待つことはありません。

`main` への push（merge commit を含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合、ワークフローは高速 Docker smoke を維持し、フルインストール smoke は夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` dispatch では opt in できますが、pull request と `main` push では実行されません。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回 pack し、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/plugin 依存関係レーン向けの素の Node/Git runner。
- 通常の機能レーン向けに、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、runner は選択された plan のみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | 既定値 | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーン向けのメインプールスロット数。                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider センシティブな tail-pool スロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | provider がスロットルしないようにする同時ライブレーン上限。                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時マルチサービスレーン上限。                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon の create storm を避けるためのレーン開始間隔。間隔なしにするには `0` を設定。   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` はレーンを実行せずにスケジューラー plan を出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | カンマ区切りの正確なレーンリスト。cleanup smoke をスキップし、agent が失敗した 1 レーンを再現できるようにします。 |

有効な上限より重いレーンでも、空のプールから開始でき、その後 capacity を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナーを削除し、アクティブレーンステータスを出力し、longest-first 順序付けのためにレーンタイミングを永続化し、既定では最初の失敗後に新しい pooled レーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、どのパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。`scripts/docker-e2e.mjs` は、その plan を GitHub outputs と summaries に変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を pack するか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証します。plan がパッケージインストール済みレーンを必要とする場合、Blacksmith の Docker layer cache を通じて、パッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。また、再ビルドする代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに境界付きの 180 秒タイムアウトで再試行されるため、registry/cache ストリームが詰まっても CI クリティカルパスの大半を消費せず、すばやく再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を指定した小さめのチャンクジョブを実行するため、各チャンクは必要なイメージ種別だけを pull し、同じ weighted scheduler を通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フルリリースパスのカバレッジが要求する場合に `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチに限ってスタンドアロンの `openwebui` チャンクを維持します。バンドル済みチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択したレーンを実行します。これにより、失敗したレーンのデバッグは対象を絞った 1 つの Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択したレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、これらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済みのライブ/E2E ワークフローは、フルリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、よりコストの高いプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる独立したワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。これは、バンドル済み Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、同時に最大 2 つの Plugin 設定グループを、各グループ 1 つの Vitest ワーカーとより大きな Node ヒープで実行するため、インポートが多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1〜3 分のジョブに多数のランナーを予約しないよう、対象 Docker レーンを小さなグループでバッチ処理します。このワークフローは、`@openclaw/plugin-inspector` からの情報用 `plugin-inspector-advisory` アーティファクトもアップロードします。インスペクターの検出結果はトリアージ入力であり、ブロッキングの Plugin プレリリースゲートは変更しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外側に専用 CI レーンがあります。エージェント的パリティは、スタンドアロンの PR ワークフローではなく、広範な QA およびリリースハーネスの下にネストされています。パリティを広範な検証実行に含める必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` 上で毎晩、および手動ディスパッチで実行されます。これは、モックパリティレーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定論的モックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブトランスポートレーンを実行するため、チャンネル契約はライブモデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway はメモリ検索を無効にします。QA パリティがメモリ動作を別にカバーしているためです。プロバイダー接続性は、別のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートによってカバーされます。

Matrix は、スケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に Matrix のフルカバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較用の小さなレポートジョブに両方のアーティファクトをダウンロードします。

通常の PR では、パリティを必須ステータスとして扱う代わりに、スコープされた CI/チェックの証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に狭い初回パスのセキュリティスキャナーです。毎日、手動、およびドラフトでないプルリクエストのガード実行では、Actions ワークフローコードに加えて、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルターされた高信頼度セキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュール済みワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は PR デフォルトには含まれません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加えて、チャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済み Android セキュリティシャード。ワークフローサニティが受け入れる最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動 macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係ビルド結果をアップロード済み SARIF からフィルター除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次デフォルトの外に保たれています。

### 重要品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。これは、小さな Blacksmith Linux ランナー上で、狭い高価値サーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。そのプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくなっています。ドラフトでない PR は、エージェントコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルとバンドル済みチャンネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更は、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gatewayのセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gatewayプロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドルされたチャネルPluginの実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーのディスパッチ、自動返信のディスパッチとキュー、ACP制御プレーンのランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCPサーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホストSDK、メモリランタイムファサード、メモリPlugin SDKエイリアス、メモリランタイム有効化グルー、メモリdoctorコマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッションdoctor CLI契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDKのインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドのバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーのデフォルト/カタログ、web/search/fetch/embeddingレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | 制御UIブートストラップ、ローカル永続化、Gateway制御フロー、タスク制御プレーンのランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コアWeb fetch/search、メディアIO、メディア理解、画像生成、メディア生成のランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDKエントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側のPlugin SDKソースとPluginパッケージ契約ヘルパー                                                                                      |

品質はセキュリティとは分離されたままにするため、品質の検出結果は、セキュリティシグナルを不明瞭にせずに、スケジュール、測定、無効化、拡張できる。Swift、Python、バンドルPluginのCodeQL拡張は、狭いプロファイルのランタイムとシグナルが安定した後にのみ、スコープを絞った、またはシャード化されたフォローアップ作業として戻すべきである。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent`ワークフローは、最近マージされた変更に既存のドキュメントを合わせ続けるためのイベント駆動のCodexメンテナンスレーンである。純粋なスケジュールはない。`main`への非bot push CI実行が成功するとトリガーされることがあり、手動ディスパッチでも直接実行できる。ワークフロー実行の呼び出しは、`main`が先へ進んでいる場合、またはスキップされていない別のDocs Agent実行が直近1時間以内に作成されている場合はスキップする。実行時は、前回スキップされなかったDocs AgentソースSHAから現在の`main`までのコミット範囲をレビューするため、1時間ごとの1回の実行で、前回のドキュメント確認以降に蓄積されたすべてのmain変更をカバーできる。

### Test Performance Agent

`Test Performance Agent`ワークフローは、遅いテストのためのイベント駆動のCodexメンテナンスレーンである。純粋なスケジュールはない。`main`への非bot push CI実行が成功するとトリガーされることがあるが、同じUTC日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップする。手動ディスパッチは、その日次アクティビティゲートをバイパスする。このレーンは、フルスイートのグループ化されたVitestパフォーマンスレポートを作成し、Codexに広範なリファクタではなくカバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行し、通過ベースラインテスト数を減らす変更を拒否する。ベースラインに失敗テストがある場合、Codexは明らかな失敗のみ修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に通過する必要がある。bot pushが着地する前に`main`が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed`を再実行してpushを再試行する。競合する古いパッチはスキップされる。Codexアクションがdocs agentと同じdrop-sudo安全姿勢を維持できるように、GitHubホストのUbuntuを使用する。

### マージ後の重複PR

`Duplicate PRs After Merge`ワークフローは、マージ後の重複クリーンアップのための手動メンテナーワークフローである。デフォルトはdry-runで、`apply=true`の場合にのみ明示的に列挙されたPRを閉じる。GitHubを変更する前に、マージ済みPRがマージされていること、および各重複が共有された参照Issueまたは重複する変更ハンクのいずれかを持つことを検証する。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは`scripts/changed-lanes.mjs`にあり、`scripts/check-changed.mjs`によって実行される。このローカルチェックゲートは、広範なCIプラットフォームスコープよりもアーキテクチャ境界に厳格である。

- コア本番変更は、コア本番とコアテストの型チェックに加えて、コアlint/ガードを実行する。
- コアのテストのみの変更は、コアテストの型チェックに加えて、コアlintのみを実行する。
- extension本番変更は、extension本番とextensionテストの型チェックに加えて、extension lintを実行する。
- extensionのテストのみの変更は、extensionテストの型チェックに加えて、extension lintを実行する。
- 公開Plugin SDKまたはPlugin契約の変更は、extensionがそれらのコア契約に依存するため、extension型チェックへ拡張される（Vitest extensionスイープは明示的なテスト作業のままにする）。
- releaseメタデータのみのバージョンバンプは、対象を絞ったバージョン/設定/root依存関係チェックを実行する。
- 不明なroot/設定変更は、安全側に倒してすべてのチェックレーンにする。

ローカルの変更テストルーティングは`scripts/test-projects.test-support.mjs`にあり、意図的に`check:changed`より低コストである。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとimport graphの依存側を使う。共有group-room配信設定は明示的なマッピングの1つである。groupの可視返信設定、ソース返信配信モード、またはmessage-toolシステムプロンプトへの変更は、コア返信テストに加えてDiscordとSlack配信リグレッションを通るため、共有デフォルトの変更は最初のPR push前に失敗する。変更がハーネス全体に及ぶため低コストのマッピング済みセットを信頼できる代理と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`を使用する。

## Testbox検証

Crabboxは、メンテナーのLinux証明用のリポジトリ所有リモートボックスラッパーである。チェックがローカル編集ループには広すぎる場合、CI同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能なボックス、リモートログが必要な場合に、リポジトリルートから使用する。通常のOpenClawバックエンドは`blacksmith-testbox`である。所有するAWS/Hetznerキャパシティは、Blacksmithの障害、クォータ問題、または所有キャパシティでの明示的なテストのためのフォールバックである。

Crabbox-backed Blacksmithの実行は、ワンショットTestboxをwarm、claim、sync、run、report、cleanupする。組み込みの同期サニティチェックは、`pnpm-lock.yaml`などの必須rootファイルが消えた場合、または`git status --short`が追跡済み削除を少なくとも200件示した場合に早期失敗する。意図的な大規模削除PRでは、リモートコマンドに`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`を設定する。

Crabboxは、同期後の出力がないままsyncフェーズに5分を超えて留まるローカルBlacksmith CLI呼び出しも終了する。そのガードを無効にするには`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`を設定し、通常より大きなローカル差分にはより大きいミリ秒値を使用する。

初回実行の前に、リポジトリルートからラッパーを確認する。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox`を通知しない古いCrabboxバイナリを拒否する。`.crabbox.yaml`に所有クラウドのデフォルトがある場合でも、プロバイダーは明示的に渡す。

変更ゲート:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

絞り込んだテスト再実行:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

フルスイート:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

最後のJSONサマリーを読む。有用なフィールドは`provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs`である。ワンショットのBlacksmith-backed Crabbox実行はTestboxを自動的に停止するはずである。実行が中断された場合、またはcleanupが不明瞭な場合は、稼働中のボックスを調べ、自分が作成したボックスだけを停止する。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じhydrated boxで複数のコマンドが意図的に必要な場合にのみ、再利用を使用する。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabboxが壊れている層で、Blacksmith自体は動作する場合は、`list`、`status`、cleanupなどの診断にのみ直接Blacksmithを使用する。直接Blacksmith実行をメンテナー証明として扱う前に、Crabbox経路を修正する。

`blacksmith testbox list --all`と`blacksmith testbox status`は動作するが、新しいwarmupが数分後もIPやActions実行URLなしで`queued`のままの場合は、Blacksmithプロバイダー、キュー、請求、またはorg制限の圧迫として扱う。自分が作成したqueued idを停止し、追加のTestbox起動を避け、誰かがBlacksmithダッシュボード、請求、org制限を確認している間、証明を下記の所有Crabboxキャパシティ経路に移す。

Blacksmithがダウンしている、クォータ制限がある、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有Crabboxキャパシティへエスカレーションする。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS のキャパシティが逼迫している場合は、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` は避ける。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法である。リポジトリ所有の `.crabbox.yaml` はデフォルトで `standard`、複数のキャパシティリージョン、`capacity.hints: true` を使用するため、仲介された AWS リースでは、選択されたリージョン/マーケット、クォータ逼迫、Spot フォールバック、高負荷クラスの警告が出力される。より重い広範なチェックには `fast` を使い、standard/fast では足りない場合にのみ `large` を使い、`beast` はフルスイートや全 Plugin の Docker マトリクス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドのレーンに限って使う。`pnpm check:changed`、集中テスト、docs のみの作業、通常の lint/typecheck、小規模な E2E 再現、Blacksmith 障害トリアージには `beast` を使わない。キャパシティ診断には `--market on-demand` を使い、Spot マーケットの変動がシグナルに混ざらないようにする。

`.crabbox.yaml` は、所有クラウドレーン向けの provider、sync、GitHub Actions ハイドレーションのデフォルトを管理する。ローカルの `.git` を除外するため、ハイドレートされた Actions checkout は、メンテナーのローカル remote やオブジェクトストアを同期する代わりに、自身の remote Git メタデータを保持する。また、転送してはならないローカル runtime/build アーティファクトも除外する。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けに、checkout、Node/pnpm セットアップ、`origin/main` fetch、非 secret 環境の引き渡しを管理する。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
