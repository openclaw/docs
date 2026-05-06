---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を把握する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CIジョブグラフ、スコープゲート、リリース包括、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-06T09:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は、`main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは diff を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、意図的にスマートなスコープ制限を迂回し、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` を通じてオプトインのままです。リリース専用の Plugin カバレッジは、別個の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された拡張機能を検出し、CI マニフェストを構築する                   | 非ドラフトの push と PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | 非ドラフトの push と PR では常に |
| `security-dependency-audit`      | npm advisory に対する、依存関係不要の本番 lockfile 監査                                          | 非ドラフトの push と PR では常に |
| `security-fast`                  | 高速セキュリティジョブ用の必須集約                                                             | 非ドラフトの push と PR では常に |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルドする                       | Node 関連の変更              |
| `checks-fast-core`               | bundled/Plugin契約/protocol チェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャンネル契約チェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | チャンネル、bundled、契約、拡張機能レーンを除く Core Node テストシャード                          | Node 関連の変更              |
| `check`                          | シャード化されたメインのローカルゲート相当: 本番型、lint、ガード、テスト型、strict smoke                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、シャード化された boundary/prompt drift、拡張機能ガード、パッケージ boundary、Gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                                            | Node 関連の変更              |
| `checks`                         | ビルド済みアーティファクトのチャンネルテスト用 verifier                                                                 | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                | リリース用の手動 CI dispatch    |
| `check-docs`                     | docs のフォーマット、lint、壊れたリンクのチェック                                                             | docs が変更された場合                       |
| `skills-python`                  | Python backed Skills 用の Ruff + pytest                                                                    | Python Skills 関連の変更      |
| `checks-windows`                 | Windows 固有のプロセス/パステストと、共有ランタイム import specifier のリグレッション                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済みアーティファクトを使う macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリ用の Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方の flavor に対する Android ユニットテストと 1 つの debug APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                 | メイン CI 成功または手動 dispatch |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 ライブレーンを含む、日次/オンデマンドの Kova ランタイムパフォーマンスレポート | スケジュール実行と手動 dispatch      |

## Fail-fast 順序

1. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトおよびプラットフォームマトリックスジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、下流の利用者を開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側 zombie が新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使い、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight マニフェストをすべてのスコープ領域が変更されたかのように動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それだけで Windows、Android、または macOS のネイティブビルドを強制することはありません。これらのプラットフォームレーンは、プラットフォームソースの変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された低コストの core-test fixture 編集、狭い Plugin 契約 helper/test-routing 編集** は、高速 Node のみのマニフェストパスを使います: `preflight`、security、および単一の `checks-fast-core` タスクです。このパスは、変更が高速タスクで直接実行されるルーティングまたはヘルパー surface に限定されている場合、ビルドアーティファクト、Node 22 互換性、チャンネル契約、フル core シャード、bundled-Plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI runner ヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフロー surface にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンのままです。

最も遅い Node テストファミリーは、各ジョブを小さく保ちつつ runner を過剰に予約しないよう、分割またはバランス調整されています。チャンネル契約は 3 つの重み付きシャードとして実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state と process/config シャードに分割され、auto-reply はバランスされた worker として実行されます (reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割)。また、agentic gateway/server config は、ビルド済みアーティファクトを待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されています。広範な browser、QA、media、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使います。include-pattern シャードは CI シャード名を使って timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルタ済みシャードを区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch カバレッジから分離します。boundary guard list は 4 つの matrix shard に stripe され、それぞれが選択された独立ガードを並行実行し、`pnpm prompt:snapshots:check` を含むチェックごとの timing を出力するため、Codex ランタイムの happy-path prompt drift は、それを引き起こした PR に固定されます。Gateway watch、チャンネルテスト、および core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。そのユニットテストレーンは、SMS/call-log BuildConfig flag を使って flavor を引き続きコンパイルしつつ、Android 関連のすべての push で重複する debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies` (最新の Knip バージョンに固定され、`dlx` install では pnpm の minimum release age が無効化された、本番 Knip の依存関係のみのパス) と `pnpm deadcode:unused-files` を実行します。後者は、Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡す target-side bridge です。信頼されていない pull request コードを checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- 正確な issue および pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が調査する可能性のある一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは、正規化済みメタデータのみを転送します: event type、action、actor、repository、item number、URL、title、state、および存在する場合は comment または review の短い抜粋です。意図的に完全な webhook body の転送を避けます。`openclaw/clawsweeper` の受信側ワークフローは `.github/workflows/github-activity.yml` であり、正規化済みイベントを ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般アクティビティは観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、イベントが驚くべきもの、対応可能なもの、リスクのあるもの、または運用上有用なものの場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローや agent runtime への指示ではありません。

## 手動 dispatch

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n。単独の手動 CI ディスパッチは `include_android=true` の場合に Android のみを実行します。フルリリースの包括ワークフローは `include_android=true` を渡すことで Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、拡張機能のフルバッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の並行実行グループを使うため、リリース候補のフルスイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力を使うと、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャード化されたチャネル契約チェック、lint を除く `check` シャード、`check-additional` 集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリックスをより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量の拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`check-additional` シャード、`android`                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 感度が十分高く、8 vCPU では節約できた分よりコストが大きかったため）。install-smoke Docker ビルド（32-vCPU のキュー時間は節約できた分よりコストが大きかったため）                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                      |

## ローカルでの対応コマンド

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

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフローの ref をベンチマークします。現在のワークフロー実装でリリースタグや別のブランチをベンチマークするには、`target_ref` を設定します。公開されるレポートパスと最新ポインターはテスト対象 ref をキーにし、各 `index.md` はテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターを記録します。

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を備えたローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します: デフォルト、hook、50-Plugin 起動ケースでの Gateway ブート時間とメモリ、mock-OpenAI の `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、横に raw JSON があります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブのアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。安定版/デフォルト実行では、網羅的な live/E2E と Docker リリースパスのカバレッジを `run_release_soak=true` の背後に置きます。`release_profile=full` は、その soak カバレッジを強制的に有効にし、広範な advisory 検証が広範なままになるようにします。`rerun_group=all` かつ `release_profile=full` の場合、リリースチェックの `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡して、同じ Telegram パッケージレーンを公開済み npm パッケージに対して再実行します。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、
および対象を絞った再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、
OpenClaw npm preflight が成功した後、`release/YYYY.M.D` または `main` からディスパッチします。
これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して
`Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` を
ディスパッチしてから、保存済みの `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

変化の速いブランチで固定コミットを証明するには、
`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使います:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、raw コミット SHA は使えません。この
ヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、
その固定 ref から `Full Release Validation` をディスパッチし、すべての子
ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。
包括検証ツールは、いずれかの子ワークフローが別の SHA で実行された場合にも失敗します。

`release_profile` はリリースチェックに渡される live/provider の範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media マトリクスを意図的に実行したい場合にのみ `full` を使います。`run_release_soak` は、stable/default のリリースチェックで網羅的な live/E2E と Docker リリースパスの soak を実行するかを制御します。`full` は soak を強制的に有効にします。

- `minimum` は最速の OpenAI/core リリースクリティカルレーンだけを維持します。
- `stable` は安定版 provider/backend セットを追加します。
- `full` は広範な advisory provider/media マトリクスを実行します。

umbrella はディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して green になった場合は、umbrella の結果とタイミング概要を更新するために、親の verifier ジョブだけを再実行します。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の full CI 子だけには `ci`、Plugin prerelease 子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、または umbrella 上でより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使います。これにより、集中修正後の失敗したリリースボックスの再実行を限定できます。1 つの失敗した cross-OS レーンでは、たとえば `windows/packaged-upgrade` のように、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。長い cross-OS コマンドは heartbeat 行を出力し、packaged-upgrade の概要にはフェーズごとのタイミングが含まれます。QA release-check レーンは advisory なので、QA だけの失敗は警告になりますが、release-check verifier はブロックしません。

`OpenClaw Release Checks` は信頼済み workflow ref を使って、選択された ref を一度だけ `release-package-under-test` tarball に解決し、その artifact を cross-OS チェックと Package Acceptance に渡します。soak カバレッジを実行する場合は、live/E2E release-path Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージのバイト列を一貫させ、同じ候補を複数の子ジョブで再パックすることを避けます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古い umbrella を置き換えます。親 monitor は、親がキャンセルされたときにすでにディスパッチ済みの子ワークフローをキャンセルするため、新しい main validation が古い 2 時間の release-check 実行の後ろで待機しません。リリース branch/tag validation と集中再実行グループは `cancel-in-progress: false` のままです。

## Live と E2E シャード

release live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つのシリアルジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider でフィルタされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割された media audio/video シャードと、provider でフィルタされた music シャード

これにより、同じファイルカバレッジを維持しつつ、遅い live provider の失敗を再実行および診断しやすくします。集約 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` のシャード名は、手動の単発再実行でも引き続き有効です。

ネイティブ live media シャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリを検証するだけです。Docker-backed live スイートは通常の Blacksmith ランナー上に維持してください。container ジョブは nested Docker テストを起動する場所として不適切です。

Docker-backed live model/backend シャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使います。live release ワークフローはそのイメージを一度だけビルドして push し、その後 Docker live model、provider-sharded gateway、CLI backend、ACP bind、Codex harness シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的な script レベルの `timeout` 上限があり、停止した container や cleanup パスがリリースチェックの予算全体を消費するのではなく、すばやく失敗します。これらのシャードが完全な source Docker target を独立して再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか」が問いである場合は、`Package Acceptance` を使います。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、package acceptance は、ユーザーがインストールまたは更新後に使うものと同じ Docker E2E harness を通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` artifact としてアップロードし、GitHub step summary に source、workflow ref、package ref、version、SHA-256、profile を出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。reusable ワークフローはその artifact をダウンロードし、tarball inventory を検証し、必要に応じて package-digest Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。profile が複数の対象 `docker_lanes` を選択した場合、reusable ワークフローはパッケージと共有イメージを一度だけ準備し、その後それらのレーンを一意の artifact を持つ並列の対象 Docker ジョブとして fan out します。
3. `package_telegram` は必要に応じて `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決している場合は同じ `package-under-test` artifact をインストールします。standalone Telegram dispatch は引き続き公開済み npm spec をインストールできます。
4. `summary` は、パッケージ解決、Docker acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンだけを受け付けます。公開済み prerelease/stable acceptance にはこれを使います。
- `source=ref` は、信頼済みの `package_ref` branch、tag、または完全な commit SHA をパックします。resolver は OpenClaw branch/tag を fetch し、選択されたコミットがリポジトリ branch 履歴または release tag から到達可能であることを検証し、detached worktree に deps をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有 artifact には指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済み workflow/harness コードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在の test harness で古いワークフロー logic を実行せずに、古い信頼済みソースコミットを検証できます。

### スイート profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む完全な Docker release-path chunk
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` profile は offline Plugin カバレッジを使うため、公開済みパッケージの検証は live ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` artifact を再利用し、公開済み npm spec パスは standalone dispatch 用に維持されます。

専用の update と Plugin テストポリシーについては、local コマンド、Docker レーン、Package Acceptance の入力、リリースデフォルト、失敗時の triage を含め、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済み release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ migration、update、古い Plugin 依存関係の cleanup、設定済み Plugin install repair、offline Plugin、plugin-update、Telegram proof を同じ解決済み package tarball 上に維持します。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA からビルドした artifact の代わりに、出荷済み npm package に対して同じマトリクスを実行できます。Cross-OS release checks は引き続き OS 固有の オンボーディング、installer、platform behavior をカバーします。package/update の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、blocking release path で実行ごとに 1 つの公開済み package baseline を検証します。Package Acceptance では、解決された `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` は fallback 公開済み baseline を選択します。デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドはその baseline を保持します。`run_release_soak=true` または `release_profile=full` の Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の stable npm release に加え、Feishu config、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin install、tilde log パス、古い legacy Plugin dependency root 用の、固定された Plugin 互換性 boundary release と issue-shaped fixture へ拡張します。複数 baseline の published-upgrade survivor 選択は、baseline ごとに別々の対象 Docker runner ジョブへシャード化されます。別の `Update Migration` ワークフローは、通常の Full Release CI の範囲ではなく、公開済み update cleanup を網羅的に問う場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` で `update-migration` Docker レーンを使います。local aggregate 実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確な package spec を渡すか、`openclaw@2026.4.15` のように `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、シナリオマトリクス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンド recipe で baseline を設定し、recipe step を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、さらに RPC status を probe します。Windows packaged および installer fresh レーンも、インストール済みパッケージが生の絶対 Windows パスから browser-control override を import できることを検証します。OpenAI cross-OS agent-turn smoke は、`OPENCLAW_CROSS_OS_OPENAI_MODEL` が設定されていればそれをデフォルトにし、そうでなければ `openai/gpt-5.4` を使います。これにより、GPT-4.x のデフォルトを避けながら、install と gateway proof を GPT-5 テストモデル上に維持します。

### legacy 互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに限定された legacy compatibility window があります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性パスを使えます。

- `dist/postinstall-inventory.json` 内の既知の private QA entry は、tarball から省略されたファイルを指している場合があります。
- パッケージがその flag を公開していない場合、`doctor-switch` は `gateway install --wrapper` persistence サブケースを skip する場合があります。
- `update-channel-switch` は tarball 由来の fake git fixture から不足している `pnpm.patchedDependencies` を prune する場合があり、persisted `update.channel` の欠落を log する場合があります。
- Plugin smoke は legacy install-record location を読む場合があり、または marketplace install-record persistence の欠落を受け入れる場合があります。
- `plugin-update` は install record と no-reinstall behavior が変更されないことを引き続き要求しつつ、config metadata migration を許容する場合があります。

公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータスタンプファイルについても警告が出る場合があります。以降のパッケージは最新の契約を満たす必要があります。同じ条件では、警告やスキップではなく失敗します。

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

失敗したパッケージ受け入れ実行をデバッグするときは、`resolve_package` のサマリーから始めて、パッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。フルリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージサーフェス、バンドル Plugin パッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI スモークを実行し、コンテナの gateway-network e2e を実行し、バンドル拡張のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きのバンドル Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は別途上限が設定されます）。
- **フルパス** は、QR パッケージインストールとインストーラー Docker/更新カバレッジを、ナイトリースケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そしてインストーラー/パッケージ/Docker サーフェスに実際に触れるプルリクエスト用に保持します。フルモードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを1つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待たされることはありません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュ時にフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フルインストールスモークはナイトリーまたはリリース検証に任せます。

低速な Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これはナイトリースケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチではオプトインできますが、プルリクエストと `main` へのプッシュでは実行されません。QR とインストーラー Docker テストは、それぞれインストールに特化した Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有ライブテストイメージを1つ事前ビルドし、OpenClaw を npm tarball として一度パックし、2つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- インストーラー/更新/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 同じ tarball を通常の機能レーン用に `/app` へインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整可能項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | プロバイダー依存のテールプールスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | プロバイダーがスロットルしないようにする同時ライブレーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker デーモンの create ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ/テールレーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | カンマ区切りの正確なレーン一覧。エージェントが失敗した1つのレーンを再現できるよう、クリーンアップスモークをスキップします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker をプリフライトし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先順序のためにレーンタイミングを保存し、デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能なライブ/E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、どのパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後、`scripts/docker-e2e.mjs` がそのプランを GitHub の出力とサマリーに変換します。`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、パッケージインストール済みレーンが必要なプランでは、Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュします。また、再ビルドする代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに境界付きの 180 秒タイムアウトでリトライされるため、停止したレジストリ/キャッシュストリームが CI クリティカルパスの大半を消費するのではなく、すばやくリトライされます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンク化ジョブを実行するため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーで複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンに対する集約手動再実行エイリアスのままです。

フルリリースパスカバレッジが要求する場合、OpenWebUI は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチの場合だけスタンドアロンの `openwebui` チャンクを保持します。バンドルチャンネル更新レーンは、一時的な npm ネットワーク障害に対して1回リトライします。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに、準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグはターゲットを絞った1つの Docker ジョブに限定され、その実行のためにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、ターゲットジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されたレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2E ワークフローは、フルリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、そのスイートはオフのままです。これはバンドル Plugin テストを8つの拡張ワーカーに分散します。これらの拡張シャードジョブは、Plugin 設定グループを同時に最大2つ実行し、グループごとに1つの Vitest ワーカーとより大きな Node ヒープを使うため、インポート負荷の高い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1〜3分のジョブのために多数のランナーを予約しないよう、ターゲットを絞った Docker レーンを小さなグループでバッチ処理します。

## QA ラボ

QA ラボには、メインのスマートスコープワークフローの外側に専用の CI レーンがあります。エージェント型パリティは、スタンドアロンの PR ワークフローではなく、広範な QA とリリースハーネスの下にネストされています。広範な検証実行と一緒にパリティを走らせる必要がある場合は、`rerun_group=qa-parity` 付きの `Full Release Validation` を使います。

- `QA-Lab - All Lanes` ワークフローは、`main` でナイトリー実行され、手動ディスパッチでも実行されます。これはモックパリティレーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとしてファンアウトします。ライブジョブは `qa-live-shared` 環境を使い、Telegram/Discord は Convex リースを使います。

リリースチェックは、決定論的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って、Matrix と Telegram のライブトランスポートレーンを実行します。これにより、チャンネル契約がライブモデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway はメモリ検索を無効にします。QA パリティがメモリ動作を別途カバーするためです。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュールゲートとリリースゲートで `--profile fast` を使い、チェックアウトされた CLI が対応している場合だけ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` も、リリース承認前にリリース上重要な QA ラボレーンを実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープされた CI/check 証拠に従います。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に範囲を絞った最初のセキュリティスキャナーです。日次、手動、および draft ではない pull request のガード実行では、Actions ワークフローコードと、もっともリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` に絞った高信頼度のセキュリティクエリでスキャンします。

pull request ガードは軽量のままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュールされたワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は、PR のデフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加え、チャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査の接点              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin のインストール、ローダー、manifest、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー sanity が許可する最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係ビルド結果をアップロードされる SARIF から除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置いています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。小さい Blacksmith Linux ランナー上で、範囲を絞った高価値サーフェスに対し、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。その pull request ガードは、スケジュールされたプロファイルより意図的に小さくしています。draft ではない PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定 schema/migration/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルと同梱チャンネル Plugin ランタイム、Gateway protocol/server-method、メモリランタイム/SDK 接着部、MCP/process/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/package-contract、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動 dispatch は次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定 schema、migration、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schema とサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルと同梱チャンネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダー dispatch、自動返信 dispatch とキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイム facade、メモリ Plugin SDK alias、メモリランタイム起動接着部、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/log bundle サーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信 dispatch、返信 payload/chunking/runtime ヘルパー、チャンネル返信オプション、配信キュー、セッション/スレッドのバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap、ローカル永続化、Gateway 制御フロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティと分離したままにします。これにより、品質指摘をスケジュール、測定、無効化、拡張しても、セキュリティシグナルを曖昧にしません。Swift、Python、同梱 Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定してから、スコープされた、またはシャード化された後続作業としてのみ追加し直すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近 land された変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動 dispatch で直接実行することもできます。workflow-run による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までの commit 範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーできますが、その UTC 日に別の workflow-run 呼び出しがすでに実行済み、または実行中の場合はスキップします。手動 dispatch はその日次アクティビティゲートをバイパスします。このレーンはフルスイートのグループ化 Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせます。その後、フルスイートレポートを再実行し、通過しているベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗のみ修正でき、エージェント後のフルスイートレポートは、何かを commit する前に通過する必要があります。bot push が land する前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo 安全姿勢を保てるように、GitHub-hosted Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、land 後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を close します。GitHub を変更する前に、land 済み PR が merge されていることと、各重複が共有された参照 issue または重複する変更 hunk のいずれかを持つことを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカル check ゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカル check ゲートは、広い CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、core prod と core test の typecheck に加え、core lint/guards を実行します。
- コア test-only 変更は、core test typecheck と core lint のみを実行します。
- extension 本番変更は、extension prod と extension test の typecheck に加え、extension lint を実行します。
- extension test-only 変更は、extension test typecheck と extension lint のみを実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存するため、extension typecheck まで拡張されます（Vitest extension スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/設定/root-dependency check を実行します。
- 未知の root/config 変更は、安全側に倒してすべての check レーンを対象にします。

ローカル changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より安価です。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピングを優先し、その後 sibling tests と import-graph dependents を対象にします。共有 group-room 配信設定は明示的なマッピングの 1 つです。group visible-reply 設定、ソース返信配信モード、または message-tool system prompt の変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR push 前に失敗します。変更が harness 全体に及ぶほど広く、安価なマッピング済みセットを信頼できる proxy として扱えない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Testbox はリポジトリルートから実行し、広範な証明には新しくウォーム済みの box を優先します。再利用された、期限切れになった、または予想外に大きな同期を報告した box で遅いゲートに時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行します。

サニティチェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short` が追跡対象の削除を少なくとも 200 件表示した場合に高速に失敗します。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、その box を停止して新しいものをウォームしてください。意図的な大量削除 PR の場合は、そのサニティ実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカルの Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、異常に大きいローカル diff にはより大きなミリ秒値を使用します。

Crabbox は、メンテナーの Linux 証明用にリポジトリが所有するリモート box ラッパーです。チェックがローカル編集ループには広すぎる場合、CI パリティが重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能な box、リモートログが必要な場合に使用します。通常の OpenClaw バックエンドは `blacksmith-testbox` です。所有 AWS/Hetzner キャパシティは、Blacksmith の停止、クォータ問題、または明示的な所有キャパシティテストのフォールバックです。

最初の実行前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を広告しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーを明示的に渡します。

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

最終 JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。1 回限りの Blacksmith バックの Crabbox 実行では、Testbox は自動的に停止されるはずです。実行が中断された、またはクリーンアップが不明な場合は、稼働中の box を調べ、自分が作成した box だけを停止します。

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

同じ hydrate 済み box で複数のコマンドが意図的に必要な場合にのみ再利用を使います。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れているレイヤーだが Blacksmith 自体は動作する場合は、狭いフォールバックとして Blacksmith を直接使用します。

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Blacksmith が停止している、クォータ制限がある、必要な環境がない、または所有キャパシティ自体が明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions hydrate デフォルトを所有します。これはローカル `.git` を除外するため、hydrate 済みの Actions チェックアウトは、メンテナーのローカルリモートとオブジェクトストアを同期するのではなく、自身のリモート Git メタデータを保持します。また、転送してはならないローカル実行時/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けに、チェックアウト、Node/pnpm セットアップ、`origin/main` fetch、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
