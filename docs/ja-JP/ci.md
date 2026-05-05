---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更する場合
summary: CI ジョブグラフ、スコープゲート、リリース包括ジョブ、同等のローカルコマンド
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-05T01:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは差分を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は意図的にスマートスコーピングをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは別個の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                           | 目的                                                                                                      | 実行されるタイミング               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extension を検出し、CI マニフェストを構築します                | 非ドラフトの push と PR では常時 |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                               | 非ドラフトの push と PR では常時 |
| `security-dependency-audit`      | npm advisory に対する依存関係不要の本番 lockfile 監査                                                     | 非ドラフトの push と PR では常時 |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                                          | 非ドラフトの push と PR では常時 |
| `check-dependencies`             | 本番 Knip の依存関係専用パスと未使用ファイル allowlist ガード                                             | Node 関連の変更                   |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルドします | Node 関連の変更                   |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                                    | Node 関連の変更                   |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つシャーディングされたチャネル contract チェック                              | Node 関連の変更                   |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テストシャード                               | Node 関連の変更                   |
| `check`                          | シャーディングされたメインのローカルゲート相当: 本番型、lint、ガード、テスト型、strict smoke              | Node 関連の変更                   |
| `check-additional`               | アーキテクチャ、シャーディングされた boundary/prompt drift、extension ガード、package boundary、gateway watch | Node 関連の変更                   |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                                           | Node 関連の変更                   |
| `checks`                         | ビルド済みアーティファクトのチャネルテスト用 verifier                                                     | Node 関連の変更                   |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                       | リリース用の手動 CI dispatch      |
| `check-docs`                     | Docs のフォーマット、lint、壊れたリンクのチェック                                                         | Docs が変更された場合             |
| `skills-python`                  | Python ベースの Skills 用 Ruff + pytest                                                                   | Python Skill 関連の変更           |
| `checks-windows`                 | Windows 固有のプロセス/パステストと共有 runtime import specifier のリグレッション                         | Windows 関連の変更                |
| `macos-node`                     | 共有ビルド済みアーティファクトを使用する macOS TypeScript テストレーン                                    | macOS 関連の変更                  |
| `macos-swift`                    | macOS アプリ用 Swift lint、ビルド、テスト                                                                 | macOS 関連の変更                  |
| `android`                        | 両方の flavor の Android unit test と 1 つの debug APK ビルド                                             | Android 関連の変更                |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                     | Main CI 成功または手動 dispatch   |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む日次/オンデマンド Kova runtime パフォーマンスレポート | スケジュール実行と手動 dispatch   |

## Fail-fast の順序

1. `preflight` が、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトジョブやプラットフォーム matrix ジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと重なるため、共有ビルドの準備ができ次第、下流の consumer を開始できます。
4. その後、より重いプラットフォームおよび runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、それは CI ノイズとして扱います。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI concurrency key はバージョン付き (`CI-v7-*`) なので、古い queue group にある GitHub 側の zombie が新しい main 実行を無期限にブロックすることはありません。手動の full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行を cancel しません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight マニフェストをすべての scoped area が変更されたかのように動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー linting を検証しますが、それだけで Windows、Android、macOS native build を強制することはありません。これらのプラットフォームレーンはプラットフォーム source の変更に scoped されたままです。
- **CI routing のみの編集、選択された安価な core-test fixture 編集、狭い Plugin contract helper/test-routing 編集** は、高速な Node のみのマニフェストパスを使用します: `preflight`、security、単一の `checks-fast-core` task。このパスは、変更が高速 task が直接 exercise する routing または helper surface に限定される場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node チェック** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、そのレーンを実行する CI workflow surface に scoped されます。無関係な source、Plugin、install-smoke、test-only の変更は Linux Node レーンのままです。

最も遅い Node テストファミリーは分割またはバランス調整され、各ジョブが runner を過剰に予約せず小さく保たれます。channel contracts は 3 つの weighted shard として実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state shard と process/config shard に分割され、auto-reply は balanced worker として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing shard に分割）。また、agentic gateway/server config は、built artifacts を待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されます。広範な browser、QA、media、miscellaneous Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使用します。include-pattern shard は CI shard 名を使用して timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary work をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard list は 4 つの matrix shard に stripe され、各 shard は選択された独立 guard を並行実行し、`pnpm prompt:snapshots:check` を含むチェックごとの timing を出力します。これにより、Codex runtime happy-path prompt drift はそれを引き起こした PR に固定されます。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig flags 付きで flavor を引き続きコンパイルしつつ、Android 関連の push ごとに debug APK packaging job を重複して実行することを避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新の Knip version に固定され、`dlx` install では pnpm の minimum release age が無効化された、本番 Knip の依存関係専用パス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番 unused-file finding を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの未使用ファイルを追加した場合や stale な allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw repository activity から ClawSweeper への target-side bridge です。信頼されていない pull request code を checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、compact な `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper command 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が inspect できる一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは normalized metadata のみを転送します: event type、action、actor、repository、item number、URL、title、state、および comment または review が存在する場合の short excerpt。意図的に webhook body 全体の転送は避けています。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、normalized event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的なアクティビティは観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が意外、actionable、risky、または operationally useful な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、duplicate webhook noise、normal review traffic は `NO_REPLY` になるべきです。

GitHub title、comment、body、review text、branch name、commit message は、この経路全体で信頼されていないデータとして扱います。これらは summarization と triage の入力であり、workflow や agent runtime への instruction ではありません。

## 手動 dispatch

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的に有効にします。対象は Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android だけを実行します。完全リリースの包括ワークフローは `include_android=true` を渡して Android を有効にします。Plugin プリリリース静的チェック、リリース専用の `agentic-plugins` シャード、拡張機能の完全バッチスイープ、Plugin プリリリース Docker レーンは CI から除外されます。Docker プリリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の並行実行グループを使うため、リリース候補のフルスイートが、同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャード化されたチャンネル契約チェック、lint 以外の `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHub ホスト Ubuntu を使うため、Blacksmith マトリクスはより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低負荷の拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU に敏感で、8 vCPU では節約分よりコストが高かったため）。install-smoke Docker ビルド（32 vCPU ではキュー時間のコストが節約分を上回ったため）                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                 |

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

## OpenClaw パフォーマンス

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグや別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` には、テスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

このワークフローは、固定されたリリースから OCM を、`openclaw/Kova` から固定された `kova_ref` 入力の Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定的な偽の OpenAI 互換認証を使うローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースのプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースでの Gateway 起動時間とメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復実行、起動済み Gateway に対する CLI 起動コマンドです。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、その横に生の JSON が置かれます。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が構成されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。安定版/デフォルト実行では、網羅的なライブ/E2E と Docker リリースパスのカバレッジは `run_release_soak=true` の背後に置かれます。`release_profile=full` はその soak カバレッジを強制的に有効にし、広範なアドバイザリ検証を広範なまま維持します。`rerun_group=all` と `release_profile=full` の場合、release checks の `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡すことで、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行できます。

ステージマトリクス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、対象を絞った再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。`pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にのみ保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

移り変わりの速いブランチ上で固定コミットの証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使います。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。このヘルパーは、ターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。包括検証も、いずれかの子ワークフローが異なる SHA で実行された場合は失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な参考プロバイダー/メディアマトリクスを意図的に実行したい場合にのみ `full` を使用します。`run_release_soak` は、安定版/デフォルトのリリースチェックで、網羅的なライブ/E2E と Docker リリースパスのソークを実行するかどうかを制御します。`full` はソークを強制的に有効にします。

- `minimum` は、最速の OpenAI/コアのリリースクリティカルなレーンだけを保持します。
- `stable` は、安定版のプロバイダー/バックエンドセットを追加します。
- `full` は、広範な参考プロバイダー/メディアマトリクスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再確認し、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、親の検証ジョブだけを再実行して、アンブレラの結果とタイミング要約を更新します。

リカバリー用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常のフル CI 子だけには `ci`、Plugin プレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはアンブレラ上のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正後に、失敗したリリースボックスの再実行を限定できます。1 つのクロス OS レーンだけが失敗した場合は、たとえば `windows/packaged-upgrade` のように、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。長いクロス OS コマンドは Heartbeat 行を出力し、パッケージ化アップグレードの要約にはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは参考扱いのため、QA のみの失敗は警告されますが、リリースチェック検証はブロックしません。

`OpenClaw Release Checks` は、信頼されたワークフロー参照を使用して、選択された参照を一度だけ `release-package-under-test` tarball に解決し、その成果物をクロス OS チェックと Package Acceptance に渡します。さらに、ソークカバレッジを実行する場合は、ライブ/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再パッケージ化することを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチ済みの子ワークフローをキャンセルします。そのため、新しい main 検証が、古い 2 時間のリリースチェック実行の後ろで待機することはありません。リリースブランチ/タグ検証と焦点を絞った再実行グループでは、`cancel-in-progress: false` を維持します。

## ライブと E2E シャード

リリースのライブ/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つのシリアルジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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

これにより、同じファイルカバレッジを保ちながら、遅いライブプロバイダーの失敗を再実行および診断しやすくなります。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の一回限りの再実行でも引き続き有効です。

ネイティブのライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリを確認するだけです。Docker ベースのライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブは、ネストした Docker テストを起動する場所として適していません。

Docker ベースのライブモデル/バックエンドシャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローは、そのイメージを一度ビルドしてプッシュし、その後 Docker ライブモデル、プロバイダーで分割された Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限が設定されているため、コンテナやクリーンアップパスが停止しても、リリースチェックの予算全体を消費せずに素早く失敗します。これらのシャードがフルソース Docker ターゲットを個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複イメージビルドに実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いには、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、Package Acceptance は、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` 成果物としてアップロードし、ソース、ワークフロー参照、パッケージ参照、バージョン、SHA-256、プロファイルを GitHub ステップ要約に出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはその成果物をダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数のターゲット指定された `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度準備し、それらのレーンを固有の成果物を持つ並列のターゲット指定 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決している場合は同じ `package-under-test` 成果物をインストールします。単独の Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンだけを受け付けます。公開済みプレリリース/安定版の受け入れに使用します。
- `source=ref` は、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを確認し、切り離されたワークツリーで依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有された成果物には指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼されたワークフロー/ハーネスコードです。`package_ref` は、`source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスが、古いワークフローロジックを実行せずに、古い信頼されたソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含むフル Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証がライブ ClawHub の可用性に左右されません。任意の Telegram レーンは、`NPM Telegram Beta E2E` で `package-under-test` 成果物を再利用します。公開済み npm spec パスは単独ディスパッチ用に維持されます。

専用の更新および Plugin テストポリシーには、ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗時のトリアージが含まれます。詳細は [更新とPluginのテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、準備済みのリリースパッケージ成果物、`source=artifact`、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram の証明が、同じ解決済みパッケージ tarball 上で行われます。SHA からビルドされた成果物ではなく、出荷済み npm パッケージに対して同じマトリクスを実行するには、Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定します。クロス OS リリースチェックは引き続き、OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決された `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` の Full Release Validation は、`published_upgrade_survivor_baselines=all-since-2026.4.23` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、`2026.4.23` から `latest` までのすべての安定版 npm リリースと、Feishu 設定、保持されたブートストラップ/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに関する issue 形式のフィクスチャまで拡張します。別の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、公開済み更新クリーンアップを網羅的に確認することが目的の場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を伴う `update-migration` Docker レーンを使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すことも、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持することも、シナリオマトリクス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定することもできます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ化レーンとインストーラーの新規インストールレーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドをインポートできることも検証します。OpenAI クロス OS エージェントターンスモークは、設定されている場合はデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、そうでない場合は `openai/gpt-5.4` を使用します。そのため、インストールと Gateway の証明は GPT-5 テストモデル上に維持され、GPT-4.x デフォルトを避けられます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージに対する範囲限定のレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の偽 git フィクスチャから存在しない `pnpm.patchedDependencies` を削除する場合があり、永続化された `update.channel` が存在しないことをログに記録する場合があります。
- Plugin スモークは、レガシーのインストール記録場所を読む場合や、マーケットプレイスのインストール記録永続化がないことを許容する場合があります。
- `plugin-update` は、インストール記録と再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許可する場合があります。

公開済みの `2026.4.26` パッケージでも、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告する場合があります。それ以降のパッケージは現代の契約を満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、`resolve_package` サマリーから始めて、パッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージサーフェス、バンドル済みPluginパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコアPlugin/チャネル/Gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル済みPlugin変更、テストのみの編集、docsのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete 共有ワークスペース CLI スモークを実行し、コンテナ gateway-network e2e を実行し、バンドル済み拡張機能のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きのバンドル済みPlugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **フルパス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker サーフェスに実際に触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/update カバレッジを維持します。フルモードでは、install-smoke は 1 つのターゲット SHA GHCR ルート Dockerfile スモークイメージを準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/update スモーク、高速バンドル済みPlugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュでフルカバレッジを要求する場合、ワークフローは高速 Docker スモークを維持し、フルインストールスモークは夜間またはリリース検証に残します。

遅い Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチではオプトインできますが、プルリクエストと `main` プッシュでは実行されません。QR とインストーラー Docker テストは、それぞれインストールに特化した Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- インストーラー/update/plugin-dependency レーン向けの素の Node/Git runner。
- 通常の機能レーン向けに、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、runner は選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整可能項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用メインプールのスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダー影響を受けやすいテールプールのスロット数。                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm インストールレーン上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの作成ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定。    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。クリーンアップスモークをスキップし、agents が 1 つの失敗レーンを再現できるようにします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先順序のためにレーンタイミングを保存し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。`scripts/docker-e2e.mjs` はそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在実行中のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、パッケージインストール済みレーンがプランで必要な場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドする代わりに指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに 180 秒の境界付きタイムアウトでリトライされるため、停止したレジストリ/キャッシュストリームが CI クリティカルパスの大半を消費するのではなく、すばやくリトライされます。

### リリースパスのチャンク

リリース Docker カバレッジは `OPENCLAW_SKIP_DOCKER_BUILD=1` で小さなチャンク化ジョブを実行するため、各チャンクは必要なイメージ種別のみを pull し、同じ重み付きスケジューラーを通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

フル release-path カバレッジが要求した場合、OpenWebUI は `plugins-runtime-services` に含まれ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを維持します。バンドル済みチャネル update レーンは、一時的な npm ネットワーク障害に対して一度リトライします。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、遅いレーンのテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは 1 つの対象 Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行から正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済み live/E2E ワークフローは、完全な release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別のワークフローです。通常のプルリクエスト、`main` プッシュ、スタンドアロンの手動 CI ディスパッチでは、そのスイートはオフのままです。これはバンドル済みPluginテストを 8 つの拡張機能ワーカーに分散します。これらの拡張機能シャードジョブは、グループごとに 1 つの Vitest ワーカーとより大きな Node ヒープを使って、最大 2 つのPlugin設定グループを同時に実行するため、import の重いPluginバッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1〜3 分のジョブのために何十もの runner を予約しないように、対象 Docker レーンを小さなグループでバッチ処理します。

## QA ラボ

QA ラボには、メインのスマートスコープワークフローの外に専用の CI レーンがあります。Agentic parity は広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。parity を広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間および手動ディスパッチ時に実行されます。mock parity レーン、live Matrix レーン、live Telegram および Discord レーンを並列ジョブとしてファンアウトします。live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex lease を使用します。

リリースチェックは、決定論的な mock プロバイダーと mock-qualified モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram live transport レーンを実行するため、チャネル契約は live モデルのレイテンシや通常の provider-plugin 起動から分離されます。live transport gateway は、QA parity がメモリ動作を別途カバーするため、メモリ検索を無効にします。プロバイダー接続性は、別の live model、native provider、Docker provider スイートでカバーされます。

Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI デフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` はリリース承認前にリリースクリティカルな QA ラボレーンも実行します。その QA parity ゲートは candidate と baseline のパックを並列レーンジョブとして実行し、その後最終 parity 比較用の小さなレポートジョブに両方のアーティファクトをダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープされた CI/check 証拠に従います。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に範囲を絞った初回パスのセキュリティスキャナーです。毎日、手動、およびドラフトでないプルリクエストのガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルターされた高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュールされたワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は PR のデフォルトから除外されています。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装コントラクトに加え、チャンネル Plugin ランタイム、gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、および Plugin SDK SSRF ポリシーのサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、および Plugin SDK パッケージコントラクトの信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー健全性で許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係ビルド結果をアップロード対象の SARIF から除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、毎日のデフォルトからは除外されています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。小さめの Blacksmith Linux ランナー上で、範囲を絞った高価値サーフェスに対し、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。そのプルリクエストガードはスケジュールプロファイルより意図的に小さくなっています。ドラフトでない PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルと同梱チャンネル Plugin ランタイム、gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージコントラクト、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、および `plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、および gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、および IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルと同梱チャンネル Plugin 実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーのディスパッチ、自動返信のディスパッチとキュー、および ACP コントロールプレーンのランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監督ヘルパー、およびアウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着部、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、およびセッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、およびセッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、および web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、gateway コントロールフロー、およびタスクコントロールプレーンのランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、およびメディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、および Plugin SDK エントリーポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離されています。これにより、品質の検出結果をスケジュール、測定、無効化、または拡張しても、セキュリティシグナルが不明瞭になりません。Swift、Python、および同梱 Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定してから、範囲指定またはシャード化されたフォローアップ作業としてのみ追加し直すべきです。

## メンテナンスワークフロー

### ドキュメントエージェント

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを整合させるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の非 bot による push CI 実行が成功するとトリガーされることがあり、手動ディスパッチで直接実行することもできます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更を対象にできます。

### テストパフォーマンスエージェント

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の非 bot による push CI 実行が成功するとトリガーされることがありますが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップされます。手動ディスパッチは、その日次アクティビティゲートをバイパスします。このレーンは、フルスイートをグループ化した Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなくカバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行して、通過しているベースラインテスト数を減らす変更を拒否します。ベースラインに失敗しているテストがある場合、Codex は明らかな失敗のみを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に通過する必要があります。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex アクションがドキュメントエージェントと同じ drop-sudo 安全姿勢を維持できるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、land 後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、land 済み PR がマージ済みであること、および各重複に共有された参照 Issue または重複する変更ハンクのどちらかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更では、コア本番とコアテストの型チェックに加え、コア lint/guards を実行します。
- コアのテストのみの変更では、コアテストの型チェックに加え、コア lint のみを実行します。
- 拡張機能本番変更では、拡張機能本番と拡張機能テストの型チェックに加え、拡張機能 lint を実行します。
- 拡張機能のテストのみの変更では、拡張機能テストの型チェックに加え、拡張機能 lint を実行します。
- 公開 Plugin SDK または Plugin コントラクトの変更では、拡張機能がそれらのコアコントラクトに依存しているため、拡張機能の型チェックまで拡張されます（Vitest 拡張機能スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョンバンプでは、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンに失敗します。

ローカルの changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピング、次に兄弟テストと import グラフ依存先を優先します。共有グループルーム配信設定は明示的なマッピングの 1 つです。グループの visible-reply 設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を経由するため、共有デフォルト変更は最初の PR push 前に失敗します。変更がハーネス全体に及ぶほど広く、低コストにマッピングされた集合が信頼できる代替にならない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

リポジトリルートから Testbox を実行し、広範な検証には新しくウォームアップしたボックスを優先する。再利用された、期限切れになった、または想定外に大きな同期を報告したボックスで遅いゲートを使う前に、まずそのボックス内で `pnpm testbox:sanity` を実行する。

健全性チェックは、`pnpm-lock.yaml` など必須のルートファイルが消えた場合、または `git status --short` が少なくとも 200 件の追跡済み削除を示す場合に高速に失敗する。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味するため、プロダクトテストの失敗をデバッグするのではなく、そのボックスを停止して新しいものをウォームアップする。意図的な大量削除 PR では、その健全性実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定する。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了する。このガードを無効化するには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル差分にはより大きいミリ秒値を使う。

Crabbox は、メンテナーの Linux 検証用にリポジトリが所有するリモートボックスラッパーである。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または検証にシークレット、Docker、パッケージレーン、再利用可能なボックス、リモートログが必要な場合に使用する。通常の OpenClaw バックエンドは `blacksmith-testbox` であり、所有する AWS/Hetzner 容量は Blacksmith の障害、クォータ問題、または明示的な所有容量テストのフォールバックである。

初回実行の前に、リポジトリルートからラッパーを確認する。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を公開していない古い Crabbox バイナリを拒否する。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーを明示的に渡す。

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

最終 JSON サマリーを読む。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` である。1 回限りの Blacksmith ベースの Crabbox 実行は Testbox を自動的に停止するはずである。実行が中断された場合、またはクリーンアップが不明な場合は、稼働中のボックスを調べ、自分が作成したボックスだけを停止する。

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

同じハイドレート済みボックスで複数のコマンドが意図的に必要な場合にのみ、再利用を使う。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox 層が壊れているが Blacksmith 自体は動作する場合は、限定的なフォールバックとして直接 Blacksmith を使う。

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Blacksmith が停止している、クォータ制限がある、必要な環境が欠けている、または所有容量自体が明示的な目的である場合にのみ、所有 Crabbox 容量へエスカレーションする。

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有する。これはローカルの `.git` を除外するため、ハイドレートされた Actions チェックアウトはメンテナーローカルのリモートとオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持する。また、転送してはならないローカルのランタイム/ビルド成果物も除外する。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンドに対するチェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、非シークレット環境の引き渡しを所有する。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
