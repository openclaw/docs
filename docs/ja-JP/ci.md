---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリースアンブレラ、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-02T22:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは差分を分類し、無関係な領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は意図的にスマートスコープを迂回し、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは別の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                             | 実行タイミング                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions を検出し、CI マニフェストをビルドする                             | 非 draft の push と PR で常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                               | 非 draft の push と PR で常に |
| `security-dependency-audit`      | npm advisory に対する、依存関係なしの production lockfile 監査                                                    | 非 draft の push と PR で常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                                       | 非 draft の push と PR で常に |
| `check-dependencies`             | production Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                           | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み成果物チェック、再利用可能な下流成果物をビルドする                                 | Node 関連の変更              |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                                        | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化された channel contract チェック                                                | Node 関連の変更              |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テストシャード                                    | Node 関連の変更              |
| `check`                          | production 型、lint、ガード、テスト型、strict smoke を含む、シャード化された main ローカルゲート相当                          | Node 関連の変更              |
| `check-additional`               | architecture、boundary、prompt snapshot drift、extension-surface ガード、package-boundary、gateway-watch シャード | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと startup-memory smoke                                                                      | Node 関連の変更              |
| `checks`                         | ビルド済み成果物 channel テストの検証                                                                           | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                          | リリース用の手動 CI dispatch    |
| `check-docs`                     | docs のフォーマット、lint、リンク切れチェック                                                                       | Docs が変更された場合                       |
| `skills-python`                  | Python バックの skills 用 Ruff + pytest                                                                              | Python skill 関連の変更      |
| `checks-windows`                 | Windows 固有の process/path テストと共有 runtime import specifier 回帰                                | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済み成果物を使用する macOS TypeScript テストレーン                                                         | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリ用の Swift lint、ビルド、テスト                                                                      | macOS 関連の変更             |
| `android`                        | 両方の flavor の Android unit test と 1 つの debug APK ビルド                                                        | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex slow-test 最適化                                                           | Main CI 成功または手動 dispatch |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む、日次/オンデマンドの Kova runtime performance レポート           | スケジュール実行と手動 dispatch      |

## fail-fast の順序

1. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォーム matrix ジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、共有ビルドの準備ができ次第、下流の利用側を開始できます。
4. その後、より重いプラットフォームおよび runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗しているのでない限り、それは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は報告しつつ、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI concurrency key は versioned (`CI-v7-*`) なので、古い queue group 内の GitHub 側 zombie が新しい main 実行を無期限にブロックすることはありません。手動の full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動 dispatch は changed-scope 検出をスキップし、すべてのスコープ対象領域が変更されたかのように preflight マニフェストを動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それ単独では Windows、Android、macOS native build を強制しません。これらのプラットフォームレーンは、プラットフォームソース変更にスコープされたままです。
- **CI routing-only 編集、選択された低コストな core-test fixture 編集、狭い plugin contract helper/test-routing 編集** は、高速な Node のみのマニフェストパスを使用します: `preflight`、security、単一の `checks-fast-core` タスクです。そのパスは、変更が高速タスクが直接実行する routing または helper surface に限定される場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、追加ガード matrix をスキップします。
- **Windows Node チェック** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、そのレーンを実行する CI workflow surface にスコープされます。無関係な source、Plugin、install-smoke、test-only の変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブが runner を過剰予約せず小さく保たれるように分割またはバランス調整されています。channel contract は 3 つの weighted shard として実行され、小さな core unit lane はペア化され、auto-reply は 4 つの balanced worker として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing shard に分割されます）。agentic gateway/plugin config は、ビルド済み成果物を待つ代わりに既存の source-only agentic Node job 全体に分散されます。広範な browser、QA、media、miscellaneous plugin テストは、共有 plugin catch-all ではなく専用の Vitest config を使用します。Include-pattern shard は CI shard name を使用して timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary work をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard shard は、`pnpm prompt:snapshots:check` を含む小さな独立ガードを 1 つのジョブ内で並行実行するため、Codex happy-path prompt drift は、それを引き起こした PR に固定されます。Gateway watch、channel test、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には個別の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig flag 付きで flavor をコンパイルしつつ、Android 関連の push ごとに重複した debug APK packaging job が走ることを避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install では pnpm の minimum release age が無効化された production Knip dependency-only pass）と `pnpm deadcode:unused-files` を実行します。後者は Knip の production unused-file findings を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR がレビューされていない新しい未使用ファイルを追加した場合や stale allowlist entry を残した場合に失敗しつつ、Knip が静的に解決できない意図的な dynamic Plugin、generated、build、live-test、package bridge surface を保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティから ClawSweeper への target-side bridge です。信頼されていない pull request コードを checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、compact な `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- `clawsweeper_item` は正確な issue と pull request review request 用です。
- `clawsweeper_comment` は issue comment 内の明示的な ClawSweeper コマンド用です。
- `clawsweeper_commit_review` は `main` push 上の commit-level review request 用です。
- `github_activity` は ClawSweeper agent が調査できる一般的な GitHub アクティビティ用です。

`github_activity` レーンは、正規化された metadata のみを転送します: event type、action、actor、repository、item number、URL、title、state、そして comment または review が存在する場合の短い excerpt です。意図的に完全な webhook body は転送しません。`openclaw/clawsweeper` 内の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的なアクティビティは観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が意外、actionable、risky、または operationally useful な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約と triage の入力であり、workflow や agent runtime への指示ではありません。

## 手動 dispatch

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは `include_android=true` で Android のみを実行します。完全リリースのアンブレラは `include_android=true` を渡すことで Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張機能一括スイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合のみ実行されます。

手動実行は一意の同時実行グループを使用するため、リリース候補のフルスイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使用しながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャード化されたチャンネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、ドキュメントチェック、Python skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使用するため、Blacksmith マトリックスをより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低負荷の拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU への感度が十分高く、8 vCPU は節約分よりコストが大きかった）。install-smoke Docker ビルド（32-vCPU のキュー時間コストが節約分より大きかった）                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。フォークでは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。フォークでは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                             |

## ローカルでの同等コマンド

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

## OpenClaw Performance

`OpenClaw Performance` はプロダクト/ランタイム性能ワークフローです。`main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力から Kova をインストールし、その後 3 つのレーンを実行します:

- `mock-provider`: 決定的な偽の OpenAI 互換認証を備えたローカルビルドのランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、agent-turn のホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` agent turn。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します: デフォルト、hook、50-Plugin 起動ケースでの Gateway 起動時間とメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生 JSON がその横にあります。

すべてのレーンが GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、このワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 配下の `openclaw/clawgrit-reports` にコミットします。現在のブランチポインターは `openclaw-performance/<ref>/latest-<lane>.json` として書き込まれます。

## Full Release Validation

`Full Release Validation` は「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker release-path スイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。`rerun_group=all` と `release_profile=full` を指定すると、リリースチェックの `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡して、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行します。

ステージマトリックス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、重点的な再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後、`release/YYYY.M.D` または `main` からディスパッチします。`pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後でのみ、保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットの証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーは、ターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが別の SHA で実行された場合に失敗します。

`release_profile` は、リリースチェックに渡される live/provider の幅を制御します。手動リリースワークフローのデフォルトは `stable` です。広範なアドバイザリ provider/media マトリックスを意図的に実行したい場合にのみ `full` を使用してください。

- `minimum` は最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は安定版の provider/backend セットを追加します。
- `full` は広範なアドバイザリ provider/media マトリックスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブが現在の子実行の結論を再確認し、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行してグリーンになった場合は、親の検証ジョブのみを再実行して、アンブレラの結果とタイミングサマリーを更新してください。

復旧では、`Full Release Validation` と `OpenClaw Release Checks` のどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の full CI 子のみには `ci`、Plugin プレリリース子のみには `plugin-prerelease`、すべてのリリース子には `release-checks`、または umbrella 上でより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正後に、失敗したリリースボックスの再実行範囲を限定できます。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使用して選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトを live/E2E リリースパス Docker ワークフローと Package Acceptance shard の両方に渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再パックすることを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古い umbrella を置き換えます。親モニターは、親がキャンセルされたときに、すでに dispatch した子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間の release-check 実行の後ろで待機することはありません。リリースブランチ/タグ検証と焦点を絞った再実行グループでは、`cancel-in-progress: false` を維持します。

## Live と E2E shards

リリース live/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つのシリアルジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- split media audio/video shards and provider-filtered music shards

これにより、同じファイルカバレッジを維持しながら、遅い live provider の失敗を再実行および診断しやすくなります。集約 shard 名 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` は、手動の一回限りの再実行でも引き続き有効です。

ネイティブ live media shards は、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされており、media ジョブはセットアップ前にバイナリを検証するだけです。Docker-backed live suites は通常の Blacksmith runner に置いてください。container jobs はネストされた Docker テストを起動する場所として適していません。

Docker-backed live model/backend shards は、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。live release ワークフローはそのイメージを一度だけビルドして push し、その後 Docker live model、provider-sharded gateway、CLI backend、ACP bind、Codex harness shards は `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker shards には、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップパスが停止した場合に、release-check 予算全体を消費するのではなく早く失敗します。これらの shard が full source Docker target を個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか?」が問われる場合は `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証する一方、Package Acceptance は、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E harness を通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub step summary に source、workflow ref、package ref、version、SHA-256、profile を出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能なワークフローはそのアーティファクトをダウンロードし、tarball inventory を検証し、必要に応じて package-digest Docker イメージを準備し、ワークフロー checkout をパックする代わりに、そのパッケージに対して選択された Docker lanes を実行します。profile が複数の targeted `docker_lanes` を選択する場合、再利用可能なワークフローはパッケージと共有イメージを一度だけ準備し、その後それらの lanes をユニークなアーティファクトを持つ並列 targeted Docker jobs として fan out します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` ではない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロン Telegram dispatch では、引き続き公開済み npm spec をインストールできます。
4. `summary` は、package resolution、Docker acceptance、または任意の Telegram lane が失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@alpha`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのプレリリース/安定版 acceptance に使用します。
- `source=ref` は、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。resolver は OpenClaw のブランチ/タグを fetch し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、detached worktree に deps をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼されたワークフロー/harness コードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテスト harness は、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む full Docker release-path chunks
- `custom` — 正確な `docker_lanes`; `suite_profile=custom` の場合は必須

`package` profile は offline plugin カバレッジを使用するため、公開パッケージ検証は live ClawHub availability に依存しません。任意の Telegram lane は `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec path はスタンドアロン dispatch 用に維持されます。

ローカルコマンド、Docker lanes、Package Acceptance inputs、release defaults、failure triage を含む、専用の update と plugin testing policy については、[Testing updates and plugins](/ja-JP/help/testing-updates-plugins) を参照してください。

Release checks は、`source=artifact`、準備済み release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、package migration、update、stale-plugin-dependency cleanup、configured-plugin install repair、offline plugin、plugin-update、Telegram proof が同じ解決済み package tarball 上に維持されます。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA からビルドされたアーティファクトの代わりに、出荷済み npm package に対して同じ matrix を実行できます。Cross-OS release checks は、OS 固有のオンボーディング、installer、platform behavior を引き続きカバーします。package/update product validation は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker lane は、実行ごとに 1 つの published package baseline を検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` は fallback published baseline を選択し、デフォルトは `openclaw@latest` です。failed-lane rerun commands はその baseline を保持します。`published_upgrade_survivor_baselines=all-since-2026.4.23` を設定すると、Full Release CI が `2026.4.23` から `latest` までのすべての安定版 npm release に広がります。より古い pre-date anchor を使った手動の広範なサンプリングには、`release-history` が引き続き利用できます。`published_upgrade_survivor_scenarios=reported-issues` を設定すると、Feishu config、保持された bootstrap/persona files、configured OpenClaw plugin installs、tilde log paths、stale legacy plugin dependency roots の issue-shaped fixtures に対して、同じ baselines が展開されます。別個の `Update Migration` ワークフローは、通常の Full Release CI breadth ではなく、徹底的な published update cleanup が問われる場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` で `update-migration` Docker lane を使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確な package specs を渡すことも、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一 lane を維持することも、scenario matrix に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定することもできます。published lane は、組み込みの `openclaw config set` command recipe で baseline を設定し、recipe steps を `summary.json` に記録し、Gateway start 後に `/healthz`、`/readyz`、さらに RPC status を probe します。Windows packaged と installer fresh lanes は、インストール済みパッケージが raw absolute Windows path から browser-control override を import できることも検証します。OpenAI cross-OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトにし、それ以外の場合は `openai/gpt-5.4` を使用します。そのため、GPT-4.x defaults を避けながら、install と gateway proof は GPT-5 test model 上に保たれます。

### Legacy compatibility windows

Package Acceptance には、すでに公開済みのパッケージ向けに限定された legacy-compatibility windows があります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、compatibility path を使用できます。

- `dist/postinstall-inventory.json` 内の既知の private QA entries は、tarball に含まれないファイルを指している場合があります。
- `doctor-switch` は、パッケージがその flag を公開していない場合、`gateway install --wrapper` persistence subcase をスキップする場合があります。
- `update-channel-switch` は、tarball-derived fake git fixture から欠落している `pnpm.patchedDependencies` を prune する場合があり、欠落している persisted `update.channel` を log する場合があります。
- plugin smokes は、legacy install-record locations を読み取る場合や、欠落している marketplace install-record persistence を許容する場合があります。
- `plugin-update` は、install record と no-reinstall behavior が変更されないことを引き続き要求しつつ、config metadata migration を許可する場合があります。

公開済みの `2026.4.26` パッケージでも、すでに出荷された local build metadata stamp files について warn する場合があります。それ以降のパッケージは最新の contracts を満たす必要があります。同じ条件は warn または skip ではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` の子実行と、その Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。リリース検証全体を再実行する代わりに、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージサーフェス、バンドル Plugin のパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャネル/Gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを確保しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete shared-workspace CLI スモークを実行し、container gateway-network e2e を実行し、バンドル拡張機能のビルド引数を検証し、各シナリオの Docker 実行を個別に上限設定したうえで、240 秒の集約コマンドタイムアウト内で境界付きバンドル Plugin Docker プロファイルを実行します。
- **完全パス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そして実際にインストーラー/パッケージ/Docker サーフェスに触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/更新カバレッジを維持します。完全モードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージのスモークの後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）は完全パスを強制しません。変更スコープロジックがプッシュ上で完全カバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、完全インストールスモークは夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは選択して有効化できますが、プルリクエストと `main` プッシュでは実行されません。QR とインストーラー Docker テストは、それぞれインストールに特化した Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は 1 つの共有ライブテストイメージを事前ビルドし、OpenClaw を npm tarball として一度パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- インストーラー/更新/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整可能項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットルしないようにするための同時ライブレーン上限。                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm インストールレーン上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの作成ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ/テールレーンはより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーン一覧。クリーンアップスモークをスキップし、エージェントが失敗した 1 レーンを再現できるようにします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナーを削除し、アクティブレーンのステータスを出力し、最長優先の順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能なライブ/E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードし、tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドの代わりに提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに 180 秒の境界付きタイムアウトで再試行されるため、停止したレジストリ/キャッシュストリームが CI のクリティカルパスの大半を消費する代わりに素早く再試行されます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使った小さなチャンク化ジョブとして実行されるため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

完全なリリースパスカバレッジが要求する場合、OpenWebUI は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチ向けにだけ単独の `openwebui` チャンクを維持します。バンドルチャネル更新レーンは、一時的な npm ネットワーク失敗に対して一度だけ再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグを 1 つのターゲット Docker ジョブに限定し、その実行のためにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、ターゲットジョブはその再実行用のライブテストイメージをローカルでビルドします。生成されたレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2E ワークフローは、完全なリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` プッシュ、単独の手動 CI ディスパッチでは、このスイートを無効のままにします。これはバンドル Plugin テストを 8 つの拡張機能ワーカー間で分散します。これらの拡張機能シャードジョブは、グループごとに 1 つの Vitest ワーカーとより大きな Node ヒープを使い、最大 2 つの Plugin 設定グループを同時に実行するため、インポートの重い Plugin バッチが余分な CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、数十のランナーを 1〜3 分のジョブのために確保しないように、ターゲット Docker レーンを小さなグループでバッチ処理します。

## QA Lab

QA Lab には、メインのスマートスコープワークフロー外に専用の CI レーンがあります。エージェント型パリティは、単独の PR ワークフローではなく、広範な QA およびリリースハーネスの下にネストされます。広範な検証実行にパリティを含めるべき場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間実行され、手動ディスパッチでも実行されます。これはモックパリティレーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` および `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram のライブトランスポートレーンを実行するため、チャネル契約はライブモデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway は、QA パリティがメモリ動作を別途カバーするため、メモリ検索を無効化します。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI がサポートしている場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA パリティゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後最終的なパリティ比較のために両方のアーティファクトを小さなレポートジョブにダウンロードします。

通常の PR では、パリティを必須ステータスとして扱う代わりに、スコープされた CI/チェック証拠に従います。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリスイープではなく、意図的に範囲を絞った初回パスのセキュリティスキャナーです。日次、手動、およびドラフトではないプルリクエストのガード実行では、Actions ワークフローコードに加え、高/重大の `security-severity` にフィルタされた高信頼度のセキュリティクエリで、最もリスクの高い JavaScript/TypeScript サーフェスをスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュールされたワークフローと同じ高信頼度のセキュリティマトリクスを実行します。Android と macOS の CodeQL は PR のデフォルトから除外されます。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装コントラクトに加え、チャンネル Plugin ランタイム、gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、および Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、および Plugin SDK パッケージコントラクトの信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー健全性チェックで許容される最小の Blacksmith Linux runner 上で、CodeQL のために Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL のために macOS アプリを手動ビルドし、依存関係ビルド結果をアップロードされる SARIF から除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次デフォルトの外に置かれています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。小さい Blacksmith Linux runner 上で、範囲を絞った高価値サーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリだけを実行します。そのプルリクエストガードは、スケジュールされたプロファイルより意図的に小さくなっています。ドラフトではない PR は、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルとバンドルチャンネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージコントラクト、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、および `plugin-sdk-reply-runtime` シャードだけを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動 dispatch は次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

範囲の狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、および gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、マイグレーション、正規化、および IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルとバンドルチャンネル Plugin 実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダー dispatch、自動返信 dispatch とキュー、および ACP コントロールプレーンランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監督ヘルパー、およびアウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、およびセッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信 dispatch、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、およびセッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、および web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、gateway コントロールフロー、およびタスクコントロールプレーンランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、およびメディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、および Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側 Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離されています。これにより、品質の検出結果を、セキュリティシグナルを不明瞭にすることなく、スケジュール、測定、無効化、または拡張できます。Swift、Python、およびバンドル Plugin の CodeQL 拡張は、範囲を絞ったプロファイルの実行時間とシグナルが安定してから、範囲指定またはシャード化されたフォローアップ作業としてのみ戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近 land された変更と既存ドキュメントの整合を保つための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動 dispatch でも直接実行できます。workflow-run 呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行時には、前回スキップされなかった Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーできますが、同じ UTC 日に別の workflow-run 呼び出しがすでに実行済み、または実行中の場合はスキップします。手動 dispatch はその日次アクティビティゲートをバイパスします。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行して、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明白な失敗のみを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格している必要があります。bot の push が land する前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo 安全姿勢を維持できるよう、GitHub-hosted Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、land 後の重複クリーンアップのための手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を close します。GitHub を変更する前に、land された PR がマージ済みであること、および各重複に共有された参照 issue または重複する変更 hunk があることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に対して厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加えて、コア lint/guard を実行します。
- コアのテストのみの変更は、コアテストの型チェックに加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの型チェックに加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの型チェックに加えて、extension lint を実行します。
- 公開 Plugin SDK または Plugin コントラクトの変更は、extension がそれらのコアコントラクトに依存するため、extension 型チェックに拡張されます（Vitest extension スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/設定/root 依存関係チェックを実行します。
- 不明な root/設定変更は、安全側に倒してすべてのチェックレーンを実行します。

ローカルの changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそのテスト自身を実行し、ソース編集は明示的なマッピングを優先し、その後 sibling テストと import-graph 依存先を選びます。共有 group-room 配信設定は明示的なマッピングの 1 つです。group visible-reply 設定、source reply delivery mode、または message-tool system prompt の変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR push 前に失敗します。変更がハーネス全体に及ぶため、低コストのマップ済みセットが信頼できる proxy ではない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

リポジトリルートから Testbox を実行し、広範な検証には新しくウォームアップしたボックスを優先してください。再利用された、期限切れになった、または予期せず大規模な同期を報告したばかりのボックスで時間のかかるゲートを実行する前に、まずボックス内で `pnpm testbox:sanity` を実行してください。

sanity チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合や、`git status --short` が 200 件以上の追跡対象削除を示した場合に即座に失敗します。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、そのボックスを停止して新しいボックスをウォームアップしてください。意図的な大規模削除 PR の場合は、その sanity 実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカルの Blacksmith CLI 呼び出しも終了します。このガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きなローカル差分にはより大きいミリ秒値を使用してください。

Crabbox は、Blacksmith が利用できない場合や、所有しているクラウド容量を使うほうが望ましい場合の Linux 検証向けに、リポジトリが所有する第 2 のリモートボックス経路です。ボックスをウォームアップし、プロジェクトワークフローを通じてハイドレートしてから、Crabbox CLI でコマンドを実行します。

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` は、プロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを管理します。これはローカルの `.git` を除外するため、ハイドレートされた Actions checkout は、メンテナーローカルのリモートやオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持します。また、転送されるべきではないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、checkout、Node/pnpm セットアップ、`origin/main` の fetch、および後続の `crabbox run --id <cbx_id>` コマンドが source する非シークレット環境の引き渡しを管理します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
