---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - GitHub Actions チェックの失敗をデバッグしている
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CIジョブグラフ、スコープゲート、リリース包括、およびローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-10T19:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべてのプルリクエストで実行されます。`preflight` ジョブは差分を分類し、関連しない領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のために、意図的にスマートスコープをバイパスして完全なグラフへ展開します。Android レーンは `include_android` を通じてオプトインのままです。リリース専用の Plugin カバレッジは別の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions を検出し、CI マニフェストをビルドする                   | draft ではない push と PR で常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | draft ではない push と PR で常に |
| `security-dependency-audit`      | npm advisory に対する、依存関係不要の production lockfile 監査                                          | draft ではない push と PR で常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | draft ではない push と PR で常に |
| `check-dependencies`             | production Knip の依存関係専用パスと未使用ファイル allowlist ガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド成果物チェック、再利用可能な downstream 成果物をビルドする                       | Node 関連の変更              |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を伴う、シャード化された channel contract チェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除外した Core Node テストシャード                          | Node 関連の変更              |
| `check`                          | シャード化されたメイン local gate 相当: prod 型、lint、ガード、test 型、strict smoke                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、シャード化された boundary/prompt drift、extension ガード、package boundary、gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと startup-memory smoke                                                            | Node 関連の変更              |
| `checks`                         | ビルド成果物 channel テストの検証                                                                 | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                | リリース用の手動 CI dispatch    |
| `check-docs`                     | docs の formatting、lint、broken-link チェック                                                             | docs が変更された場合                       |
| `skills-python`                  | Python backed Skills 用の Ruff + pytest                                                                    | Python skill 関連の変更      |
| `checks-windows`                 | Windows 固有の process/path テストと共有 runtime import specifier のリグレッション                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド成果物を使用する macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリの Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方の flavor の Android unit test と 1 つの debug APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex slow-test 最適化                                                 | メイン CI 成功時または手動 dispatch |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む、日次/オンデマンド Kova runtime performance レポート | スケジュールおよび手動 dispatch      |

## Fail-fast の順序

1. `preflight` はどのレーンが存在するかをそもそも決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い artifact と platform matrix のジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第 downstream consumer を開始できます。
4. その後、より重い platform と runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後はキューに入りません。自動 CI concurrency key は versioned (`CI-v7-*`) なので、古い queue group にある GitHub 側の zombie が新しい main 実行を無期限にブロックすることはありません。手動の full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

`ci-timings-summary` ジョブは、draft ではない各 CI 実行ごとにコンパクトな `ci-timings-summary` artifact をアップロードします。現在の実行の wall time、queue time、最も遅いジョブ、失敗したジョブを記録するため、CI ヘルスチェックが Actions payload 全体を繰り返し scrape する必要はありません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight マニフェストをすべての scoped area が変更されたかのように動作させます。

- **CI workflow の編集** は Node CI グラフと workflow linting を検証しますが、それだけで Windows、Android、macOS native build を強制することはありません。これらの platform レーンは platform source の変更に scoped されたままです。
- **CI routing-only の編集、選択された低コストの core-test fixture 編集、狭い plugin contract helper/test-routing 編集** は、高速な Node のみの manifest path を使用します: `preflight`、security、単一の `checks-fast-core` タスク。この path は、変更が routing または helper surface に限定され、高速タスクが直接それらを実行する場合に、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、そのレーンを実行する CI workflow surface に scoped されます。関連しない source、plugin、install-smoke、test-only の変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブが runner を過剰に予約せず小さく保たれるように分割またはバランス調整されています。channel contracts は標準 GitHub runner fallback を持つ 3 つの weighted Blacksmith backed shard として実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state、process/config、cron、shared shard に分割され、auto-reply は balanced workers として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing shard に分割）。また、agentic gateway/server configs は built artifacts を待たず、chat/auth/model/http-plugin/runtime/startup レーンに分割されています。広範な browser、QA、media、miscellaneous plugin テストは共有 plugin catch-all ではなく専用の Vitest config を使用します。Include-pattern shard は CI shard name を使用して timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard list は 4 つの matrix shard にストライプされ、各 shard は選択された独立ガードを並行実行し、check ごとの timing を出力します。高コストな Codex happy-path prompt snapshot drift チェックは、手動 CI と prompt に影響する変更のみで独立した additional job として実行されます。そのため通常の関連しない Node 変更は cold prompt snapshot generation の後ろで待たず、prompt drift はそれを引き起こした PR に固定されたまま boundary shard のバランスが保たれます。同じ flag は built-artifact core support-boundary shard 内の prompt snapshot Vitest generation もスキップします。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別の source set や manifest はありません。その unit-test レーンは、Android 関連の各 push で重複した debug APK packaging job を避けながら、SMS/call-log BuildConfig flag を持つ flavor を引き続きコンパイルします。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install では pnpm の minimum release age を無効化した production Knip dependency-only pass）と `pnpm deadcode:unused-files` を実行します。後者は Knip の production unused-file findings を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの未使用ファイルを追加した場合や stale allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw repository activity を ClawSweeper に渡す target-side bridge です。信頼できない pull request code を checkout したり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

この workflow には 4 つのレーンがあります。

- 正確な issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper command 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が調査する可能性がある一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは正規化された metadata のみを転送します: event type、action、actor、repository、item number、URL、title、state、そして存在する場合は comment または review の短い抜粋です。意図的に webhook body 全体の転送を避けています。`openclaw/clawsweeper` 側の受信 workflow は `.github/workflows/github-activity.yml` で、正規化イベントを ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的な activity は observation であり、default delivery ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、イベントが意外で、actionable で、risky で、または operationally useful な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook noise、通常の review traffic は `NO_REPLY` になるべきです。

このパス全体を通じて、GitHub のタイトル、コメント、本文、レビュー文、ブランチ名、コミットメッセージは信頼できないデータとして扱います。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n。単独の手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。完全リリースのアンブレラは `include_android=true` を渡して Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合のみ実行されます。

手動実行では一意の同時実行グループを使うため、リリース候補の完全スイートが、同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使いながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャード化されたチャンネル契約チェック、lint 以外の `check` シャード、`check-additional` 集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使い、Blacksmith マトリクスがより早くキューに入れるようにします |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な拡張シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`check-additional` シャード、`android`                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`、`check-lint`（8 vCPU は節約分よりコストが大きいほど CPU 依存度が高い）。install-smoke Docker ビルド（32 vCPU は節約分よりキュー時間コストが大きい）                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                    |

正規リポジトリの CI では、Blacksmith をデフォルトのランナーパスとして維持します。`preflight` 中に、`scripts/ci-runner-labels.mjs` が最近キュー済みおよび進行中の Actions 実行を確認し、キュー済みの Blacksmith ジョブを探します。特定の Blacksmith ラベルにすでにキュー済みジョブがある場合、その正確なラベルを使う下流ジョブは、その実行に限り、対応する GitHub ホストランナー（`ubuntu-24.04`、`windows-2025`、または `macos-latest`）にフォールバックします。同じ OS ファミリー内の他の Blacksmith サイズは、主ラベルのままです。API プローブが失敗した場合、フォールバックは適用されません。

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

## OpenClaw Performance

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと最新ポインターは、テスト対象 ref をキーにします。各 `index.md` には、テスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

ワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を備えたローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します: デフォルト、hook、50 Plugin 起動ケースにわたる Gateway 起動時間とメモリ、mock-OpenAI の `channel-chat-baseline` hello ループの反復実行、起動済み Gateway に対する CLI 起動コマンド。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生 JSON がその隣にあります。

すべてのレーンは GitHub artifact をアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブ artifact も `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable/default 実行では、網羅的な live/E2E と Docker リリースパスのカバレッジを `run_release_soak=true` の背後に維持します。`release_profile=full` は、その soak カバレッジを強制的に有効にし、広範な advisory 検証を広範なままにします。`rerun_group=all` かつ `release_profile=full` の場合、release checks の `release-package-under-test` artifact に対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡して、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、artifact、フォーカスした再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後でのみ、保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

変化の速いブランチで固定コミットの証明を行うには、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの参照はブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーは、対象 SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、その固定参照から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが異なる SHA で実行された場合に失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な助言的プロバイダー/メディア行列を意図的に使う場合にのみ `full` を使用してください。`run_release_soak` は、stable/デフォルトのリリースチェックで網羅的なライブ/E2E および Docker リリースパスのソークを実行するかどうかを制御します。`full` はソークを強制的に有効にします。

- `minimum` は最速の OpenAI/コアのリリース重要レーンを維持します。
- `stable` は安定版のプロバイダー/バックエンドセットを追加します。
- `full` は広範な助言的プロバイダー/メディア行列を実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功に変わった場合は、アンブレラ結果とタイミング要約を更新するために、親検証ジョブだけを再実行してください。

復旧では、`Full Release Validation` と `OpenClaw Release Checks` の両方が `rerun_group` を受け付けます。リリース候補には `all`、通常のフル CI 子だけには `ci`、Plugin プレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはアンブレラ上のより狭いグループである `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正の後に失敗したリリースボックスの再実行範囲を限定できます。1 つの失敗したクロス OS レーンには、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長時間のクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade の要約にはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは助言的なので、QA のみの失敗は警告になりますが、リリースチェック検証はブロックしません。

`OpenClaw Release Checks` は、信頼されたワークフロー参照を使用して、選択された参照を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。ソークカバレッジが実行される場合は、ライブ/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージバイト列の一貫性が保たれ、同じ候補を複数の子ジョブで再パッケージすることを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろに滞留しません。リリースブランチ/タグ検証と焦点を絞った再実行グループは `cancel-in-progress: false` を維持します。

## ライブと E2E シャード

リリースのライブ/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- プロバイダーでフィルタリングされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声/動画シャードと、プロバイダーでフィルタリングされた音楽シャード

これにより、同じファイルカバレッジを保ちながら、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約名である `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の一回限りの再実行でも引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` がプリインストールされています。メディアジョブはセットアップ前にバイナリだけを検証します。Docker ベースのライブスイートは通常の Blacksmith ランナーに置いてください。コンテナジョブは、ネストされた Docker テストを起動する場所として適していません。

Docker ベースのライブモデル/バックエンドシャードは、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはこのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー分割 Gateway、CLI バックエンド、ACP bind、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードは、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限を持つため、停止したコンテナやクリーンアップパスは、リリースチェック予算全体を消費する代わりに速やかに失敗します。これらのシャードがフルソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドで実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として機能するか」を確認する場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、Package Acceptance は、ユーザーがインストールまたは更新後に使用するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` アーティファクトとしてアップロードし、ソース、ワークフロー参照、パッケージ参照、バージョン、SHA-256、プロファイルを GitHub ステップ要約に出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択した場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを固有のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance が 1 つ解決している場合は同じ `package-under-test` アーティファクトをインストールします。単独の Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker Acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのプレリリース/安定版 Acceptance に使用します。
- `source=ref` は、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグをフェッチし、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離されたワークツリーに依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておいてください。`workflow_ref` はテストを実行する信頼されたワークフロー/ハーネスコードです。`package_ref` は、`source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスは、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含むフル Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブ ClawHub の可用性に左右されません。任意の Telegram レーンは、`NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec パスは単独ディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗のトリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、および `telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skill インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明を、同じ解決済みパッケージ tarball 上に維持します。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA からビルドされたアーティファクトの代わりに、出荷済み npm パッケージに対して同じ行列を実行できます。クロス OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム動作を引き続きカバーします。パッケージ/更新の製品検証は Package Acceptance から開始するべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで、実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックする公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` の Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 つの安定版 npm リリースに加えて、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートのための、固定された Plugin 互換性境界リリースと課題形状のフィクスチャへ展開します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに分割され、別々の対象 Docker ランナージョブになります。別個の `Update Migration` ワークフローは、通常の Full Release CI 範囲ではなく、網羅的な公開済み更新クリーンアップが問題である場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定した `update-migration` Docker レーンを使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、シナリオ行列に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows packaged と installer fresh の各レーンも、インストール済みパッケージが生の絶対 Windows パスからブラウザー制御オーバーライドをインポートできることを検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトにし、それ以外の場合は `openai/gpt-5.4` を使用します。これにより、GPT-4.x デフォルトを避けながら、インストールと Gateway 証明を GPT-5 テストモデル上に維持します。

### レガシー互換性ウィンドウ

パッケージ受け入れには、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指してもよい。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップしてもよい。
- `update-channel-switch` は tarball 由来の偽 git フィクスチャから欠落している `pnpm.patchedDependencies` を取り除いてもよく、永続化された `update.channel` の欠落をログに出してもよい。
- plugin smoke はレガシーのインストール記録場所を読んでもよく、マーケットプレイスのインストール記録永続化の欠落を許容してもよい。
- `plugin-update` は、インストール記録と再インストールなしの挙動が変わらないことを引き続き要求しつつ、設定メタデータの移行を許可してもよい。

公開済みの `2026.4.26` パッケージも、すでに出荷されたローカルビルドメタデータのスタンプファイルについて警告してもよいです。以降のパッケージは現代的なコントラクトを満たす必要があり、同じ条件は警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージのソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行と、その Docker アーティファクトである `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドを調べます。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージ表面、バンドル plugin のパッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコア plugin/channel/gateway/Plugin SDK 表面に触れる pull request で実行されます。ソースのみのバンドル plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete 共有ワークスペース CLI smoke を実行し、コンテナ gateway-network e2e を実行し、バンドル拡張ビルド引数を検証し、240 秒の集約コマンドタイムアウト内で範囲を限定したバンドル plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **フルパス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、および実際に installer/package/Docker 表面に触れる pull request 向けに、QR パッケージインストールと installer Docker/update カバレッジを維持します。フルモードでは、install-smoke は 1 つのターゲット SHA GHCR ルート Dockerfile smoke イメージを準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/gateway smoke、installer/update smoke、高速バンドル plugin Docker E2E を別々のジョブとして実行するため、installer 作業がルートイメージ smoke の後ろで待つことはありません。

`main` への push（マージコミットを含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合でも、ワークフローは高速 Docker smoke を維持し、フルインストール smoke は夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチではオプトインできますが、pull request と `main` push では実行されません。QR と installer Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は 1 つの共有ライブテストイメージを事前ビルドし、OpenClaw を npm tarball として一度パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- installer/update/plugin-dependency レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | provider 感度の高いテールプールスロット数。                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | provider がスロットリングしないようにする同時ライブレーン上限。                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。間隔なしの場合は `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを表示します。                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。agents が失敗した 1 つのレーンを再現できるよう、cleanup smoke をスキップします。 |

実効上限より重いレーンでも、空のプールからは開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーンの状態を出力し、最長優先の順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。また、提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを、再ビルドせずに再利用します。Docker イメージ pull は、1 試行あたり 180 秒の範囲限定タイムアウト付きで再試行されるため、停止した registry/cache ストリームが CI クリティカルパスの大半を消費するのではなく、すばやく再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使ってより小さなチャンク化ジョブを実行するため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方の provider installer レーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フルリリースパスカバレッジが要求する場合は `plugins-runtime-services` に折り込まれ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを維持します。バンドル channel update レーンは、一時的な npm ネットワーク失敗に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは 1 つの対象 Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行と同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E ワークフローは、毎日フルリリースパス Docker スイートを実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな product/package カバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常の pull request、`main` push、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。これはバンドル plugin テストを 8 つの extension ワーカーに分散します。これらの extension shard ジョブは、Plugin 設定グループを一度に最大 2 つ実行し、各グループに 1 つの Vitest ワーカーとより大きな Node ヒープを使うため、import の多い plugin バッチが余分な CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、対象 Docker レーンを小さなグループにまとめ、1〜3 分のジョブのために多数のランナーを予約しないようにします。

## QA Lab

QA Lab には、メインのスマートスコープワークフロー外に専用の CI レーンがあります。Agentic parity は広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。parity を広範な検証実行に乗せる必要がある場合は、`rerun_group=qa-parity` 付きで `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間に実行され、手動ディスパッチでも実行されます。これは mock parity レーン、live Matrix レーン、live Telegram および Discord レーンを並列ジョブとして展開します。live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex leases を使用します。

リリースチェックは、決定的なモックプロバイダーとモック修飾済みモデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram のライブトランスポートレーンを実行し、チャネル契約をライブモデルのレイテンシーや通常のプロバイダー Plugin 起動から分離します。ライブトランスポート Gateway は、QA パリティがメモリ動作を別途カバーするため、メモリ検索を無効にします。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使い、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` dispatch は、常に Matrix の全カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャード分割します。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA パリティゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために両方の成果物を小さなレポートジョブへダウンロードします。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープされた CI/チェック証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリスイープではなく、意図的に狭い一次セキュリティスキャナーです。日次、手動、非ドラフトの pull request ガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルタリングされた高信頼度セキュリティクエリでスキャンします。

pull request ガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始され、スケジュール済みワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、Web フェッチ、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済み Android セキュリティシャード。ワークフロー健全性チェックで許可される最小の Blacksmith Linux runner 上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係ビルド結果をアップロードされる SARIF から除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな状態でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に維持されています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。小さめの Blacksmith Linux runner 上で、狭く価値の高いサーフェスに対し、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリだけを実行します。その pull request ガードはスケジュール済みプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信 dispatch コード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルとバンドル済みチャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着コード、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動 dispatch は以下を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを分離して実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル Plugin 実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダー dispatch、自動返信 dispatch とキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着コード、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信 dispatch、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、Web/検索/フェッチ/埋め込みレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア Web フェッチ/検索、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリーポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側 Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティから分離されているため、品質検出結果をセキュリティシグナルを不明瞭にせずにスケジュール、測定、無効化、拡張できます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定してから、スコープ済みまたはシャード化されたフォローアップ作業としてのみ追加し直してください。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近 landed された変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push CI 実行が成功するとトリガーでき、手動 dispatch でも直接実行できます。ワークフロー実行による呼び出しは、`main` が先へ進んでいる場合、または直近 1 時間以内に別のスキップされていない Docs Agent 実行が作成されていた場合はスキップします。実行時は、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト用のイベント駆動 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push CI 実行が成功するとトリガーできますが、その UTC 日に別のワークフロー実行による呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動 dispatch はその日次アクティビティゲートを迂回します。このレーンはフルスイートのグループ化 Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗のみ修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格する必要があります。bot push が landed される前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo セーフティ姿勢を維持できるよう、GitHub-hosted Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、post-land の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR をクローズします。GitHub を変更する前に、landed PR がマージ済みであり、各重複に共有された参照 issue または重複する変更 hunk のいずれかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に対して厳格です。

- コアの本番変更では、コア本番とコアテストの型チェックに加えて、コアの lint/ガードを実行する。
- コアのテスト専用変更では、コアテストの型チェックとコアの lint のみを実行する。
- 拡張機能の本番変更では、拡張機能本番と拡張機能テストの型チェックに加えて、拡張機能の lint を実行する。
- 拡張機能のテスト専用変更では、拡張機能テストの型チェックと拡張機能の lint を実行する。
- 公開 Plugin SDK または plugin-contract の変更は、拡張機能がそれらのコア契約に依存するため、拡張機能の型チェックまで広げる（Vitest の拡張機能スイープは明示的なテスト作業のまま）。
- リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/設定/ルート依存関係チェックを実行する。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンを実行する。

ローカルの変更済みテストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より軽量です。直接のテスト編集はそのテスト自身を実行し、ソース編集はまず明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ上の依存先を使います。共有グループルーム配信設定は明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、またはメッセージツールのシステムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR プッシュ前に失敗します。変更がハーネス全体に及ぶため、安価なマッピング済みセットを信頼できる代替と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Testbox はリポジトリルートから実行し、広範な証明には新しくウォーム済みの box を優先してください。再利用された、期限切れになった、または予期せず大きな同期を報告した box に遅いゲートを費やす前に、まず box 内で `pnpm testbox:sanity` を実行してください。

この健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えている場合や、`git status --short` で追跡済み削除が 200 件以上表示される場合に高速に失敗します。通常これは、リモート同期状態が PR の信頼できるコピーではないことを意味します。プロダクトのテスト失敗をデバッグするのではなく、その box を停止して新しい box をウォームしてください。意図的な大量削除 PR では、その健全性実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

`pnpm testbox:run` は、同期後の出力なしに同期フェーズに 5 分を超えてとどまるローカルの Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定するか、通常より大きなローカル差分にはより大きいミリ秒値を使用してください。

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有リモート box ラッパーです。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能な box、リモートログが必要な場合に使用してください。通常の OpenClaw バックエンドは `blacksmith-testbox` です。所有 AWS/Hetzner 容量は、Blacksmith の障害、クォータ問題、または明示的な所有容量テストのためのフォールバックです。

初回実行前に、リポジトリルートからラッパーを確認してください。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を宣伝しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーを明示的に渡してください。

変更済みゲート:

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

対象を絞ったテスト再実行:

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

最後の JSON サマリーを読んでください。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。単発の Blacksmith 裏付け Crabbox 実行では Testbox が自動的に停止するはずです。実行が中断された場合やクリーンアップが不明な場合は、稼働中の box を調べ、自分が作成した box だけを停止してください。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydrated box 上で複数のコマンドが意図的に必要な場合にのみ、再利用を使用してください。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox 層が壊れているが Blacksmith 自体は動作する場合は、限定的なフォールバックとして直接 Blacksmith を使用してください。

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、請求、または組織制限の負荷として扱ってください。自分が作成したキュー済み ID を停止し、追加の Testbox 起動を避け、誰かが Blacksmith ダッシュボード、請求、組織制限を確認する間、証明を下記の所有 Crabbox 容量パスへ移してください。

Blacksmith が停止している、クォータ制限されている、必要な環境がない、または所有容量が明示的な目的である場合にのみ、所有 Crabbox 容量へエスカレーションしてください。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS の負荷が高い状況では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` を避けてください。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は `standard`、複数の容量リージョン、`capacity.hints: true` をデフォルトにしているため、仲介された AWS リースでは選択されたリージョン/マーケット、クォータ負荷、Spot フォールバック、高負荷クラス警告が出力されます。重い広範チェックには `fast` を使用し、standard/fast で不十分な場合にのみ `large` を使用し、`beast` はフルスイートや全 Plugin Docker マトリックス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドのレーンにのみ使用してください。`pnpm check:changed`、対象を絞ったテスト、docs のみの作業、通常の lint/型チェック、小さな E2E 再現、Blacksmith 障害トリアージに `beast` を使用しないでください。容量診断には `--market on-demand` を使用し、Spot マーケットの変動をシグナルに混ぜないようにしてください。

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions hydration デフォルトを所有します。ローカルの `.git` を除外するため、hydrated Actions checkout はメンテナーのローカルリモートやオブジェクトストアを同期するのではなく、自身のリモート Git メタデータを保持します。また、転送してはならないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けに、checkout、Node/pnpm セットアップ、`origin/main` fetch、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
