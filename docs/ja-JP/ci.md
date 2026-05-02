---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しています
summary: CI ジョブグラフ、スコープゲート、リリース包括枠、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-02T20:42:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。`preflight` ジョブは diff を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープを迂回し、リリース候補と広範な検証のために完全なグラフへ展開します。Android レーンは `include_android` を通じてオプトインのままです。リリース専用の Plugin カバレッジは、別の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                           | 目的                                                                                                      | 実行タイミング                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions を検出し、CI マニフェストを構築する                 | 非ドラフトのプッシュと PR で常時   |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                               | 非ドラフトのプッシュと PR で常時   |
| `security-dependency-audit`      | npm アドバイザリに対する依存関係不要の本番 lockfile 監査                                                  | 非ドラフトのプッシュと PR で常時   |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                                          | 非ドラフトのプッシュと PR で常時   |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                           | Node 関連の変更                    |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み成果物チェック、再利用可能な下流成果物をビルドする                        | Node 関連の変更                    |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                                    | Node 関連の変更                    |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を伴う、シャード化されたチャンネルコントラクトチェック                            | Node 関連の変更                    |
| `checks-node-core-test`          | チャンネル、bundled、contract、extension レーンを除く Core Node テストシャード                            | Node 関連の変更                    |
| `check`                          | シャード化された主要ローカルゲート相当: 本番型、lint、ガード、テスト型、strict smoke                      | Node 関連の変更                    |
| `check-additional`               | アーキテクチャ、境界、extension surface ガード、package-boundary、gateway-watch シャード                  | Node 関連の変更                    |
| `build-smoke`                    | ビルド済み CLI の smoke テストと startup-memory smoke                                                     | Node 関連の変更                    |
| `checks`                         | ビルド済み成果物のチャンネルテスト用 verifier                                                            | Node 関連の変更                    |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                       | リリース用の手動 CI ディスパッチ   |
| `check-docs`                     | Docs のフォーマット、lint、リンク切れチェック                                                             | Docs が変更された場合              |
| `skills-python`                  | Python バックエンド Skills 向け Ruff + pytest                                                             | Python skill 関連の変更            |
| `checks-windows`                 | Windows 固有のプロセス/パステストと共有ランタイム import specifier のリグレッション                       | Windows 関連の変更                 |
| `macos-node`                     | 共有ビルド成果物を使用する macOS TypeScript テストレーン                                                  | macOS 関連の変更                   |
| `macos-swift`                    | macOS アプリ向け Swift lint、ビルド、テスト                                                               | macOS 関連の変更                   |
| `android`                        | 両方の flavor の Android ユニットテストと 1 つの debug APK ビルド                                         | Android 関連の変更                 |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                     | Main CI 成功または手動ディスパッチ |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 ライブレーンを伴う、日次/オンデマンドの Kova ランタイム性能レポート | スケジュールおよび手動ディスパッチ |

## fail-fast の順序

1. `preflight` が、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォーム matrix ジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、下流のコンシューマーを開始できます。
4. その後、より重いプラットフォームとランタイムのレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しいプッシュが到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱います。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチでは changed-scope 検出をスキップし、preflight マニフェストを、すべてのスコープ領域が変更されたかのように動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それだけで Windows、Android、macOS ネイティブビルドを強制することはありません。これらのプラットフォームレーンはプラットフォームソースの変更にスコープされたままです。
- **CI ルーティングのみの編集、一部の安価な core-test fixture 編集、狭い plugin contract helper/test-routing 編集** は、高速な Node のみのマニフェストパスを使用します: `preflight`、security、単一の `checks-fast-core` タスクです。そのパスでは、変更が高速タスクが直接実行するルーティングまたは helper surface に限定される場合、ビルド成果物、Node 22 互換性、チャンネルコントラクト、完全な core シャード、bundled-plugin シャード、追加ガード matrix をスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パス wrapper、npm/pnpm/UI runner helper、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフロー surface にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに留まります。

最も遅い Node テストファミリーは、各ジョブが runner を過剰に予約せず小さく保たれるように分割またはバランス調整されています。チャンネルコントラクトは 3 つの重み付きシャードとして実行され、小さな core unit レーンはペア化され、auto-reply は 4 つのバランスされた worker として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/plugin configs は、ビルド成果物を待つのではなく、既存の source-only agentic Node ジョブ全体に分散されます。広範な browser、QA、media、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使用します。include-pattern シャードは CI シャード名を使用してタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary work をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard シャードは、1 つのジョブ内で小さな独立ガードを同時に実行します。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で同時に実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。そのユニットテストレーンは、SMS/call-log BuildConfig フラグを使って flavor を引き続きコンパイルしつつ、Android 関連の各プッシュで debug APK packaging ジョブが重複するのを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定された本番 Knip の依存関係のみのパスで、`dlx` install では pnpm の minimum release age が無効）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file ガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、生成物、ビルド、live-test、package bridge surface は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に送る target-side bridge です。信頼できないプルリクエストコードを checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、その後、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が検査する可能性のある一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します: event type、action、actor、repository、item number、URL、title、state、および存在する場合は comments または reviews の短い excerpt です。完全な webhook body を転送することは意図的に避けています。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的な activity は観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が意外で、対応可能で、リスクがあり、または運用上有用な場合にのみ `#clawsweeper` に投稿すべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub の title、comment、body、review text、branch name、commit message は信頼できないデータとして扱います。これらは要約とトリアージの入力であり、ワークフローや agent runtime への指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効化します。Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは、`include_android=true` を指定した場合のみ Android を実行します。完全リリースの包括ワークフローは、`include_android=true` を渡すことで Android を有効化します。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な extensions バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合のみ実行されます。

手動実行では一意の同時実行グループを使うため、リリース候補の完全スイートが、同じ ref 上の別の push または PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力を使うと、信頼済みの呼び出し元が、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドル済みチェック、シャード化されたチャネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリクスをより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な extension シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル済み Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 依存が十分に大きく、8 vCPU は節約分よりコストが高かった）。install-smoke Docker ビルド（32-vCPU のキュー時間は節約分よりコストが高かった）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork は `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork は `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽 OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、gateway、agent-turn のホットスポットに対する CPU/ヒープ/トレースプロファイリングです。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターンです。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、hook、50-Plugin 起動ケースでの gateway 起動時間とメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復、起動済み gateway に対する CLI 起動コマンドです。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、隣に生 JSON があります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 配下の `openclaw/clawgrit-reports` にコミットします。現在のブランチポインターは `openclaw-performance/<ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は「リリース前にすべて実行する」ための手動包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用 Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。`rerun_group=all` と `release_profile=full` を指定すると、release checks の `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡すことで、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行できます。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、
および絞り込み再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を加える手動リリースワークフローです。リリースタグが存在し、
OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。
これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して
`Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、
その後で初めて、保存された `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

変化の速いブランチで固定コミットの証明が必要な場合は、
`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使ってください。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。
ヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、
その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの
`headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。
包括検証も、いずれかの子ワークフローが異なる SHA で実行された場合は失敗します。

`release_profile` は、release checks に渡される live/provider の範囲を制御します。
手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media マトリクスを
意図的に実行したい場合のみ `full` を使ってください。

- `minimum` は最速の OpenAI/core リリースクリティカルレーンに絞ります。
- `stable` は安定版 provider/backend セットを追加します。
- `full` は広範な advisory provider/media マトリクスを実行します。

包括ワークフローはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、包括結果とタイミングサマリーを更新するために、親の verifier ジョブだけを再実行してください。

リカバリでは、`Full Release Validation` と `OpenClaw Release Checks` の両方が `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子だけには `ci`、Plugin プレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、または傘下では、より狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、集中的な修正後に失敗したリリースボックスの再実行範囲を限定できます。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをライブ/E2E リリースパス Docker ワークフローとパッケージ受け入れシャードの両方に渡します。これにより、リリースボックス間でパッケージのバイト列を一貫させ、複数の子ジョブで同じ候補を再パッケージすることを避けます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古い傘を置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間の release-check 実行の後ろで待機しません。リリースブランチ/タグ検証と集中的な再実行グループでは、`cancel-in-progress: false` を維持します。

## ライブおよび E2E シャード

リリースライブ/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider フィルター済みの `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア audio/video シャードと、provider フィルター済み music シャード

これにより、同じファイルカバレッジを維持しながら、遅いライブ provider の失敗を再実行および診断しやすくします。集約 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の一回限りの再実行にも引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリだけを検証します。Docker バックのライブスイートは通常の Blacksmith runner に置いてください。コンテナジョブは、ネストされた Docker テストを起動する場所として不適切です。

Docker バックのライブモデル/backend シャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、provider シャード化 Gateway、CLI backend、ACP bind、Codex harness シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードは、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限を持つため、停止したコンテナや cleanup パスは、release-check の予算全体を消費する代わりに速やかに失敗します。これらのシャードが完全なソース Docker ターゲットを独立して再ビルドする場合、そのリリース実行は設定ミスであり、重複イメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いには、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行する同じ Docker E2E harness を通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーに source、workflow ref、package ref、version、SHA-256、profile を出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローは、そのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じて package-digest Docker イメージを準備し、ワークフロー checkout をパックする代わりに、そのパッケージに対して選択された Docker lane を実行します。profile が複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらの lane をユニークなアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` ではない場合に実行され、パッケージ受け入れが解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロン Telegram dispatch は、引き続き公開済み npm spec をインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram lane が失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@alpha`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンだけを受け付けます。公開済みプレリリース/安定版の受け入れにはこれを使用します。
- `source=ref` は、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。resolver は OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、detached worktree に deps をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分離しておきます。`workflow_ref` はテストを実行する信頼済みワークフロー/harness コードです。`package_ref` は、`source=ref` のときにパックされるソースコミットです。これにより、現在のテスト harness が、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイート profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` のとき必須

`package` profile はオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブ ClawHub の可用性に左右されません。任意の Telegram lane は、`NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec パスはスタンドアロン dispatch 用に維持されます。

ローカルコマンド、Docker lane、パッケージ受け入れ入力、リリースデフォルト、失敗トリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` でパッケージ受け入れを呼び出します。これにより、パッケージ migration、更新、古い Plugin 依存関係 cleanup、設定済み Plugin インストール修復、オフライン Plugin、plugin-update、Telegram proof を、同じ解決済みパッケージ tarball 上に維持します。SHA ビルドアーティファクトではなく出荷済み npm パッケージに対して同じ matrix を実行するには、Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定します。Cross-OS リリースチェックは引き続き、OS 固有のオンボーディング、installer、platform behavior をカバーします。パッケージ/更新の製品検証は、パッケージ受け入れから始めるべきです。`published-upgrade-survivor` Docker lane は、実行ごとに 1 つの公開済みパッケージ baseline を検証します。パッケージ受け入れでは、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` がフォールバックの公開済み baseline を選択します。デフォルトは `openclaw@latest` です。失敗 lane の再実行コマンドはその baseline を保持します。Full Release CI を `2026.4.23` から `latest` までのすべての安定 npm リリースに拡張するには、`published_upgrade_survivor_baselines=all-since-2026.4.23` を設定します。古い日付前アンカーを使った手動のより広いサンプリングには、`release-history` が引き続き使用できます。同じ baseline を、Feishu config、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダ log パス、古い legacy Plugin 依存関係 root 向けの issue 形状 fixture 全体に拡張するには、`published_upgrade_survivor_scenarios=reported-issues` を設定します。別個の `Update Migration` ワークフローは、問いが通常の Full Release CI の範囲ではなく、公開済み更新 cleanup を網羅することにある場合、`all-since-2026.4.23` と `plugin-deps-cleanup` で `update-migration` Docker lane を使用します。ローカルの集約実行は、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一 lane を維持するか、scenario matrix 用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済み lane は、組み込みの `openclaw config set` コマンド recipe で baseline を設定し、recipe 手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC status を probe します。Windows packaged lane と installer fresh lane は、インストール済みパッケージが生の絶対 Windows パスから browser-control override を import できることも検証します。OpenAI cross-OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトにし、それ以外は `openai/gpt-5.4` を使用するため、GPT-4.x デフォルトを避けながら、install と Gateway proof を GPT-5 テストモデル上に維持します。

### legacy 互換性ウィンドウ

パッケージ受け入れには、すでに公開済みのパッケージ向けに範囲を限定した legacy 互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の private QA entry は、tarball から省略されたファイルを指す場合があります。
- パッケージがその flag を公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の fake git fixture から欠落した `pnpm.patchedDependencies` を prune する場合があり、欠落した永続化済み `update.channel` をログに出す場合があります。
- Plugin smoke は、legacy install-record location を読むか、marketplace install-record persistence の欠落を受け入れる場合があります。
- `plugin-update` は、install record と no-reinstall behavior が変更されないことを引き続き要求しながら、config metadata migration を許可する場合があります。

公開済みの `2026.4.26` パッケージでは、すでに出荷された local build metadata stamp ファイルについても警告する場合があります。それ以降のパッケージは現行の contract を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` のサマリーでパッケージのソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。フルリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージ表面、同梱 Plugin パッケージ/マニフェストの変更、または Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 表面に触れるプルリクエストで実行されます。ソースのみの同梱 Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete 共有ワークスペース CLI スモークを実行し、コンテナ gateway-network e2e を実行し、同梱拡張機能のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きの同梱 Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **フルパス**は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そして本当にインストーラー/パッケージ/Docker 表面に触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/更新カバレッジを維持します。フルモードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速の同梱 Plugin Docker E2E を個別ジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュでフルカバレッジを要求する場合、ワークフローは高速 Docker スモークを維持し、フルインストールスモークは夜間またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチで opt in できますが、プルリクエストと `main` へのプッシュでは実行されません。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/Plugin 依存関係レーン向けの最小 Node/Git ランナー。
- 通常機能レーン向けに、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用メインプールのスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットルしないようにする同時ライブレーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm インストールレーン上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの作成集中を避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定     | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定     | カンマ区切りの正確なレーンリスト。agents が 1 つの失敗レーンを再現できるように cleanup スモークをスキップします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーンステータスを出力し、最長優先順序のためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub outputs とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在実行中のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドする代わりに提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに境界付き 180 秒タイムアウトでリトライされるため、停止したレジストリ/キャッシュストリームが CI クリティカルパスの大半を消費するのではなく、すばやくリトライされます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使ってより小さなチャンク化ジョブを実行するため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチに限ってスタンドアロンの `openwebui` チャンクを維持します。同梱チャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回リトライします。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択レーンを実行します。これにより、失敗レーンのデバッグは 1 つのターゲット Docker ジョブに限定され、その実行向けにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択レーンがライブ Docker レーンの場合、ターゲットジョブはその再実行向けにライブテストイメージをローカルでビルドします。生成されたレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗実行から正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E ワークフローは、フル release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、このスイートは無効のままです。これは同梱 Plugin テストを 8 つの拡張機能ワーカーに分散します。これらの拡張機能シャードジョブは、グループごとに 1 つの Vitest ワーカーとより大きな Node ヒープを使い、一度に最大 2 つの Plugin config グループを実行するため、import の多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1 分から 3 分のジョブのために多数のランナーを予約しないように、ターゲット Docker レーンを小さなグループでバッチ処理します。

## QA Lab

QA Lab には、メインのスマートスコープワークフロー外に専用の CI レーンがあります。エージェント parity は、スタンドアロンの PR ワークフローではなく、広範な QA とリリースハーネスの下にネストされています。parity を広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` とともに `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` 上で夜間に、また手動ディスパッチで実行されます。mock parity レーン、live Matrix レーン、live Telegram と Discord レーンを並列ジョブとして展開します。live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex lease を使用します。

リリースチェックは、決定論的な mock provider と mock-qualified モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram の live transport レーンを実行するため、チャンネル契約はライブモデルのレイテンシーと通常の provider-plugin 起動から分離されます。live transport gateway はメモリ検索を無効化します。これは QA parity がメモリ動作を別途カバーするためです。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートによってカバーされます。

Matrix はスケジュールゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合に限って `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA parity ゲートは、candidate と baseline のパックを並列レーンジョブとして実行し、その後最終 parity 比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープ付き CI/check エビデンスに従います。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に狭い初回パスのセキュリティスキャナーです。日次、手動、および下書きではないプルリクエストのガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` に絞った高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始し、スケジュールされたワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は、PR の既定から外れます。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装コントラクトに加え、チャネル Plugin ランタイム、gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、および Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、および Plugin SDK パッケージコントラクトの信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフロー健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係ビルド結果をアップロード対象の SARIF から除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドがランタイムを支配するため、日次の既定から外しています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティのシャードです。小さめの Blacksmith Linux ランナー上で、狭く価値の高いサーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。そのプルリクエストガードは、スケジュールされたプロファイルより意図的に小さくしています。下書きではない PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルと同梱チャネル Plugin ランタイム、gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部分、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージコントラクト、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、および `plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、および gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、および IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルと同梱チャネル Plugin の実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、および ACP コントロールプレーンランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、およびアウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の接着部分、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、およびセッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、およびセッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダー既定値/カタログ、および web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、gateway コントロールフロー、およびタスクコントロールプレーンランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、およびメディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、および Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離しています。これにより、品質の検出結果を、セキュリティシグナルを不明瞭にせずに、スケジュール、測定、無効化、拡張できます。Swift、Python、および同梱 Plugin の CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定した後にのみ、スコープ済みまたはシャード化された後続作業として戻す必要があります。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot プッシュ CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間に作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント処理以降に `main` に蓄積されたすべての変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot プッシュ CI 実行が成功するとトリガーできますが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済み、または実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートを迂回します。このレーンは、フルスイートのグループ化 Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗しているテストがある場合、Codex は明らかな失敗のみを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格する必要があります。bot プッシュが取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して、プッシュを再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo 安全姿勢を保てるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。既定は dry-run で、`apply=true` の場合にのみ、明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に、共有された参照 issue または重複する変更ハンクのいずれかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア prod とコア test の型チェックに加え、コア lint/guards を実行します。
- コアのテスト専用変更は、コア test 型チェックに加え、コア lint のみを実行します。
- extension 本番変更は、extension prod と extension test の型チェックに加え、extension lint を実行します。
- extension のテスト専用変更は、extension test 型チェックに加え、extension lint を実行します。
- 公開 Plugin SDK または Plugin コントラクト変更は、extension がそれらのコアコントラクトに依存するため、extension 型チェックまで拡張されます（Vitest extension スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 未知のルート/設定変更は、安全側に倒してすべてのチェックレーンに回します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より安価です。直接のテスト編集はそのテスト自身を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ依存テストを選びます。共有 group-room 配信設定は、明示的なマッピングの 1 つです。グループの表示返信設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信リグレッションを通るため、共有既定値の変更は最初の PR プッシュ前に失敗します。変更がハーネス全体に及ぶほど広く、安価なマッピング済みセットが信頼できる代理ではない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

リポジトリルートから Testbox を実行し、広範な検証には新しくウォームアップしたボックスを優先してください。再利用された、期限切れになった、または予想外に大きな同期を報告したばかりのボックスで時間のかかるゲートを実行する前に、まずボックス内で `pnpm testbox:sanity` を実行してください。

このサニティチェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えている場合や、`git status --short` が 200 件以上の追跡対象の削除を示す場合に早期失敗します。通常これは、リモート同期状態が PR の信頼できるコピーではないことを意味します。そのボックスを停止し、製品テストの失敗をデバッグする代わりに新しいボックスをウォームアップしてください。意図的な大量削除 PR の場合は、そのサニティ実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカルの Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定するか、通常より大きなローカル差分にはより大きなミリ秒値を使用してください。

Crabbox は、Blacksmith が利用できない場合や、所有するクラウド容量を使うほうが望ましい場合の Linux 検証向けに、リポジトリが所有する 2 つ目のリモートボックス経路です。ボックスをウォームアップし、プロジェクトワークフローを通じてハイドレートしてから、Crabbox CLI 経由でコマンドを実行します。

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` は、プロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。これはローカルの `.git` を除外するため、ハイドレートされた Actions チェックアウトは、メンテナーローカルのリモートやオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持します。また、転送されるべきではないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm セットアップ、`origin/main` のフェッチ、および後続の `crabbox run --id <cbx_id>` コマンドがソースする非シークレット環境の受け渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
