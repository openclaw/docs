---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しています
summary: CIジョブグラフ、スコープゲート、リリース包括ワークフロー、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-05T04:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは diff を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープをバイパスし、リリース候補と広範な検証のために完全なグラフへ展開します。Android レーンは `include_android` によってオプトインのままです。リリース専用の Plugin カバレッジは、別の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                           | 目的                                                                                                      | 実行タイミング                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions を検出し、CI マニフェストを構築する                 | draft でない push と PR では常時   |
| `security-scm-fast`              | `zizmor` による秘密鍵検出と workflow 監査                                                                 | draft でない push と PR では常時   |
| `security-dependency-audit`      | npm advisories に対する依存関係なしの本番 lockfile 監査                                                   | draft でない push と PR では常時   |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                                         | draft でない push と PR では常時   |
| `check-dependencies`             | 本番 Knip 依存関係のみのパスと未使用ファイル allowlist ガード                                             | Node 関連の変更                    |
| `build-artifacts`                | `dist/`、Control UI、ビルド成果物チェック、再利用可能な下流成果物をビルドする                             | Node 関連の変更                    |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                                    | Node 関連の変更                    |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化された channel contract チェック                                | Node 関連の変更                    |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テストシャード                               | Node 関連の変更                    |
| `check`                          | シャード化された主要ローカルゲート相当: 本番型、lint、ガード、テスト型、strict smoke                     | Node 関連の変更                    |
| `check-additional`               | アーキテクチャ、シャード化された boundary/prompt drift、extension ガード、package boundary、gateway watch | Node 関連の変更                    |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                                          | Node 関連の変更                    |
| `checks`                         | ビルド成果物 channel テストの検証                                                                        | Node 関連の変更                    |
| `checks-node-compat-node22`      | Node 22 互換ビルドと smoke レーン                                                                         | リリース用の手動 CI dispatch       |
| `check-docs`                     | Docs のフォーマット、lint、リンク切れチェック                                                            | Docs が変更された場合              |
| `skills-python`                  | Python backed skills 用の Ruff + pytest                                                                   | Python skill 関連の変更            |
| `checks-windows`                 | Windows 固有の process/path テストと共有ランタイム import specifier の回帰                                | Windows 関連の変更                 |
| `macos-node`                     | 共有ビルド成果物を使う macOS TypeScript テストレーン                                                     | macOS 関連の変更                   |
| `macos-swift`                    | macOS アプリ用の Swift lint、ビルド、テスト                                                              | macOS 関連の変更                   |
| `android`                        | 両 flavor の Android ユニットテストと 1 つの debug APK ビルド                                             | Android 関連の変更                 |
| `test-performance-agent`         | 信頼済みアクティビティ後の毎日の Codex 低速テスト最適化                                                  | Main CI 成功または手動 dispatch    |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む毎日/オンデマンドの Kova ランタイム性能レポート     | スケジュールおよび手動 dispatch    |

## Fail-fast 順序

1. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォームマトリクスジョブを待たずに高速に失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドが準備でき次第、下流の利用側を開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗している場合を除き、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は引き続き報告しますが、workflow 全体がすでに置き換えられた後にはキューに入りません。自動 CI の concurrency key はバージョン付き (`CI-v7-*`) なので、古い queue group にある GitHub 側の zombie が新しい main 実行を無期限にブロックすることはありません。手動の full-suite 実行は `CI-manual-v1-*` を使い、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight マニフェストをすべてのスコープ領域が変更されたかのように動作させます。

- **CI workflow の編集** は Node CI グラフと workflow linting を検証しますが、それだけで Windows、Android、macOS のネイティブビルドを強制することはありません。これらのプラットフォームレーンは、プラットフォームソース変更にスコープされたままです。
- **CI routing のみの編集、選択された軽量な core-test fixture 編集、狭い Plugin contract helper/test-routing 編集** は、高速な Node のみのマニフェスト経路を使います: `preflight`、security、単一の `checks-fast-core` タスクです。この経路は、変更が routing または高速タスクが直接実行する helper surface に限定される場合、ビルド成果物、Node 22 互換性、channel contract、完全な core shard、bundled-plugin shard、追加ガードマトリクスをスキップします。
- **Windows Node チェック** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、そのレーンを実行する CI workflow surface にスコープされます。無関係な source、Plugin、install-smoke、test-only の変更は Linux Node レーンに留まります。

最も遅い Node テストファミリーは、各ジョブがランナーを過剰予約せずに小さく保たれるよう分割またはバランス調整されています。channel contract は 3 つの重み付きシャードとして実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state と process/config シャードに分割され、auto-reply はバランス調整された worker として実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/server config はビルド成果物を待たずに chat/auth/model/http-plugin/runtime/startup レーンへ分割されます。広範な browser、QA、media、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使います。include-pattern シャードは CI shard 名を使ってタイミング entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルタ済み shard を区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard list は 4 つの matrix shard に分割され、各 shard は選択された独立ガードを並行実行し、`pnpm prompt:snapshots:check` を含む check ごとのタイミングを出力するため、Codex runtime の happy-path prompt drift は、それを引き起こした PR に固定されます。Gateway watch、channel テスト、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig flags 付きで flavor を引き続きコンパイルしつつ、Android 関連のすべての push で debug APK packaging job が重複することを避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install では pnpm の minimum release age が無効化された本番 Knip dependency-only pass）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの未使用ファイルを追加した場合、または stale な allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw repository activity を ClawSweeper へ送る target-side bridge です。信頼されていない pull request コードを checkout したり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、compact な `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

この workflow には 4 つのレーンがあります。

- 正確な issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper command 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が検査する可能性のある一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは正規化された metadata のみを転送します: event type、action、actor、repository、item number、URL、title、state、存在する場合は comment または review の短い抜粋です。完全な webhook body は意図的に転送しません。`openclaw/clawsweeper` 側の受信 workflow は `.github/workflows/github-activity.yml` で、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的な activity は observation であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、その event が意外、actionable、risky、または運用上有用な場合にのみ `#clawsweeper` へ投稿するべきです。通常の open、edit、bot churn、重複 webhook noise、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約と triage の入力であり、workflow や agent runtime への指示ではありません。

## 手動 dispatch

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。フルリリースの傘ワークフローは `include_android=true` を渡すことで Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、拡張機能のフルバッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の同時実行グループを使用するため、リリース候補のフルスイートが、同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。オプションの `target_ref` 入力を使うと、信頼された呼び出し元が、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャード化されたチャネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、ドキュメントチェック、Python skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリクスはより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低負荷の拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（8 vCPU は節約できる以上にコストがかかるほど CPU の影響を受けやすい）。install-smoke Docker ビルド（32-vCPU のキュー時間は節約できる以上にコストがかかる）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。フォークは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。フォークは `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                                 |

## ローカルでの相当コマンド

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

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` にはテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターが記録されます。

ワークフローは固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、その後 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を持つローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50-Plugin 起動ケースでの Gateway 起動時間とメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復実行、起動済み Gateway に対する CLI 起動コマンドです。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON がその隣にあります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下へコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動の傘ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。安定版/デフォルト実行では、網羅的なライブ/E2E と Docker リリースパスのカバレッジを `run_release_soak=true` の背後に維持します。`release_profile=full` はその soak カバレッジを強制的に有効化し、広範なアドバイザリー検証が引き続き広範になるようにします。`rerun_group=all` と `release_profile=full` の場合、リリースチェックの `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡して、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、集中的な再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を加える手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にのみ保存済みの `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミット証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使います:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生のコミット SHA は使用できません。ヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行が完了したら一時ブランチを削除します。傘ワークフローの検証も、いずれかの子ワークフローが異なる SHA で実行された場合は失敗します。

`release_profile` はリリースチェックに渡すライブ/provider の範囲を制御します。
手動リリースワークフローのデフォルトは `stable` です。広範な勧告用 provider/media マトリクスを意図的に使いたい場合にのみ `full` を使用してください。`run_release_soak`
は、stable/default のリリースチェックで網羅的なライブ/E2E と Docker リリースパスの soak を実行するかどうかを制御します。`full` は soak を強制的に有効にします。

- `minimum` は最速の OpenAI/コアのリリース重要レーンに絞ります。
- `stable` は stable provider/backend セットを追加します。
- `full` は広範な勧告用 provider/media マトリクスを実行します。

umbrella は dispatch された子 run ID を記録し、最後の `Verify full validation` ジョブが現在の子 run の結論を再チェックし、各子 run の最も遅いジョブの表を追加します。子ワークフローが再実行されて green になった場合は、親 verifier ジョブのみを再実行して umbrella の結果とタイミング要約を更新してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の full CI 子のみには `ci`、Plugin prerelease 子のみには `plugin-prerelease`、すべてのリリース子には `release-checks`、または umbrella ではより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、集中的な修正後の失敗したリリース box の再実行を限定できます。失敗した cross-OS レーンが 1 つだけの場合は、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長い cross-OS コマンドは heartbeat 行を出力し、packaged-upgrade の要約には phase ごとのタイミングが含まれます。QA release-check レーンは勧告扱いのため、QA のみの失敗は警告になりますが、release-check verifier はブロックしません。

`OpenClaw Release Checks` は、信頼済みのワークフロー ref を使って選択された ref を一度だけ `release-package-under-test` tarball に解決し、その artifact を cross-OS チェックと Package Acceptance に渡します。soak カバレッジを実行する場合は live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリース box 間で package bytes の一貫性が保たれ、複数の子ジョブで同じ候補を再 pack することを避けられます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` run は、古い umbrella を置き換えます。親 monitor は、親がキャンセルされたときに、すでに dispatch 済みの子ワークフローをキャンセルするため、新しい main 検証が古い 2 時間の release-check run の後ろで待たされることはありません。リリース branch/tag 検証と集中的な rerun group では `cancel-in-progress: false` のままにします。

## ライブと E2E shard

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの serial ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider でフィルターされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割された media audio/video shard と provider でフィルターされた music shard

これにより、同じファイルカバレッジを保ちながら、遅い live provider の失敗を再実行および診断しやすくなります。集約名の `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` shard 名は、手動の 1 回限りの再実行でも引き続き有効です。

ネイティブ live media shard は、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリを検証するだけです。Docker backed の live suite は通常の Blacksmith runner 上に維持してください。container ジョブは nested Docker テストを起動する場所として不適切です。

Docker backed の live model/backend shard は、選択された commit ごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使います。live release ワークフローはそのイメージを一度だけビルドして push し、その後 Docker live model、provider で shard された Gateway、CLI backend、ACP bind、Codex harness shard が `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker shard は、ワークフローのジョブ timeout より短い明示的な script-level の `timeout` 上限を持つため、停止した container や cleanup path は release-check の予算全体を消費するのではなく早く失敗します。これらの shard が full source Docker target を個別に再ビルドする場合、release run は設定ミスであり、重複したイメージビルドに wall clock を浪費します。

## パッケージ受け入れ検証

「このインストール可能な OpenClaw package は製品として動作するか」という問いには `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI は source tree を検証しますが、package acceptance は、ユーザーがインストールまたは更新後に使うものと同じ Docker E2E harness を通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` を checkout し、1 つの package 候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` artifact として upload し、GitHub step summary に source、workflow ref、package ref、version、SHA-256、profile を出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。reusable ワークフローはその artifact を download し、tarball inventory を検証し、必要に応じて package-digest Docker イメージを準備し、ワークフロー checkout を pack する代わりに、その package に対して選択された Docker レーンを実行します。profile が複数の targeted `docker_lanes` を選択した場合、reusable ワークフローは package と共有イメージを一度だけ準備し、それらのレーンを unique artifact を持つ parallel targeted Docker ジョブとして fan out します。
3. `package_telegram` は必要に応じて `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` ではない場合に実行され、Package Acceptance が解決したものがある場合は同じ `package-under-test` artifact をインストールします。standalone Telegram dispatch は引き続き公開済み npm spec をインストールできます。
4. `summary` は、package resolution、Docker acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補 source

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw release version のみを受け付けます。公開済み prerelease/stable acceptance にはこれを使用します。
- `source=ref` は信頼済みの `package_ref` branch、tag、または full commit SHA を pack します。resolver は OpenClaw branches/tags を fetch し、選択された commit が repository branch history または release tag から到達可能であることを検証し、detached worktree に deps をインストールし、`scripts/package-openclaw-for-docker.mjs` で pack します。
- `source=url` は HTTPS `.tgz` を download します。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` を download します。`package_sha256` は任意ですが、外部共有 artifact では指定するべきです。

`workflow_ref` と `package_ref` は分けておいてください。`workflow_ref` はテストを実行する信頼済みのワークフロー/harness code です。`package_ref` は `source=ref` のときに pack される source commit です。これにより、現在の test harness で古い workflow logic を実行せずに、古い信頼済み source commit を検証できます。

### suite profile

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む full Docker release-path chunk
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` profile は offline plugin カバレッジを使うため、公開 package の検証は live ClawHub の可用性に gate されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` artifact を再利用し、公開済み npm spec path は standalone dispatch 用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance input、release default、failure triage を含む dedicated update と plugin testing policy については、[更新と plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

Release checks は `source=artifact`、準備済み release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、package migration、update、古い plugin dependency の cleanup、設定済み plugin install repair、offline plugin、plugin-update、Telegram proof が同じ解決済み package tarball 上で保たれます。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA からビルドした artifact ではなく出荷済み npm package に対して同じ matrix を実行できます。Cross-OS release checks は引き続き OS 固有のオンボーディング、installer、platform behavior をカバーします。package/update product validation は Package Acceptance から開始するべきです。`published-upgrade-survivor` Docker レーンは、blocking release path で run ごとに 1 つの公開済み package baseline を検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に candidate であり、`published_upgrade_survivor_baseline` が fallback 公開済み baseline を選択し、デフォルトは `openclaw@latest` です。失敗レーンの rerun command はその baseline を保持します。`run_release_soak=true` または `release_profile=full` の Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 つの stable npm release に加えて、Feishu config、保持された bootstrap/persona files、設定済み OpenClaw plugin install、tilde log path、古い legacy plugin dependency root に対する pinned plugin-compatibility boundary release と issue-shaped fixture へ拡張します。複数 baseline の published-upgrade survivor 選択は、baseline ごとに separate targeted Docker runner job に shard されます。別の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、公開済み update cleanup の網羅性が問いである場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を伴う `update-migration` Docker レーンを使用します。ローカルの aggregate run では `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確な package spec を渡すことができ、`openclaw@2026.4.15` のように `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、scenario matrix 用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは baked された `openclaw config set` コマンドレシピで baseline を設定し、recipe step を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、さらに RPC status を probe します。Windows packaged と installer fresh レーンは、インストール済み package が raw absolute Windows path から browser-control override を import できることも検証します。OpenAI cross-OS agent-turn smoke のデフォルトは、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL`、それ以外は `openai/gpt-5.4` なので、install と Gateway proof は GPT-4.x default を避けながら GPT-5 test model 上に維持されます。

### legacy 互換性 window

Package Acceptance には、すでに公開済みの package に対して限定された legacy-compatibility window があります。`2026.4.25` までの package（`2026.4.25-beta.*` を含む）は compatibility path を使用できます。

- `dist/postinstall-inventory.json` 内の既知の private QA entry は、tarball から省かれた file を指していてもよい。
- package がその flag を expose していない場合、`doctor-switch` は `gateway install --wrapper` persistence subcase を skip してもよい。
- `update-channel-switch` は、tarball 由来の fake git fixture から missing `pnpm.patchedDependencies` を prune してもよく、missing persisted `update.channel` を log してもよい。
- plugin smoke は legacy install-record location を読んでもよく、marketplace install-record persistence の missing を許容してもよい。
- `plugin-update` は config metadata migration を許可してもよいが、install record と no-reinstall behavior が unchanged のままであることは引き続き必須です。

公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータスタンプファイルについても警告が出る場合があります。以降のパッケージは現行のコントラクトを満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行と、その Docker アーティファクトである `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドを確認します。フルリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

独立した `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これはスモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージ面、バンドル済み Plugin パッケージ/マニフェストの変更、または Docker スモークジョブが実行するコア Plugin/チャネル/Gateway/Plugin SDK 面に触れるプルリクエストで実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを確保しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete 共有ワークスペース CLI スモークを実行し、コンテナ Gateway ネットワーク e2e を実行し、バンドル済み拡張機能のビルド引数を検証し、240 秒の集計コマンドタイムアウト内で境界付きのバンドル済み Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は別々に上限設定されます）。
- **フルパス**は、QR パッケージインストールとインストーラー Docker/更新カバレッジを、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そしてインストーラー/パッケージ/Docker 面に実際に触れるプルリクエスト向けに保持します。フルモードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル済み Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージのスモークを待つことはありません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュでフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フルインストールスモークは夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別にゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは opt in できますが、プルリクエストと `main` プッシュでは実行されません。QR とインストーラー Docker テストは、それぞれインストールに焦点を当てた Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` を使ってレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダー依存のテールプールスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ/テールレーンではより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。クリーンアップスモークをスキップし、agent が失敗した 1 レーンを再現できるようにします。 |

実効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集計は Docker をプリフライトし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。

### 再利用可能なライブ/E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、どのパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とするときは Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュします。また、再ビルドする代わりに、提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、1 回あたり 180 秒の境界付きタイムアウトで再試行されるため、詰まったレジストリ/キャッシュストリームが CI のクリティカルパスの大半を消費するのではなく、すばやく再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使った小さなチャンク化ジョブで実行されるため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーで複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスとして残ります。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスとして残ります。

フルリリースパスカバレッジが要求する場合、OpenWebUI は `plugins-runtime-services` に含められ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを保持します。バンドル済みチャネル更新レーンは、一時的な npm ネットワーク失敗に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択レーンを実行します。これにより、失敗レーンのデバッグは 1 つの対象 Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗したレーンは失敗実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済みライブ/E2E ワークフローは、フルリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる独立したワークフローです。通常のプルリクエスト、`main` プッシュ、単独の手動 CI ディスパッチでは、このスイートはオフのままです。これはバンドル済み Plugin テストを 8 つの拡張機能ワーカーに分散します。それらの拡張機能シャードジョブは、一度に最大 2 つの Plugin 設定グループを実行し、各グループにつき Vitest ワーカー 1 つと大きめの Node ヒープを使うため、import の重い Plugin バッチが余分な CI ジョブを作成しません。リリース専用 Docker プレリリースパスは、1〜3 分のジョブのために多数のランナーを確保しないよう、対象 Docker レーンを小さなグループにバッチ化します。

## QA ラボ

QA ラボには、メインのスマートスコープワークフローの外に専用 CI レーンがあります。agentic parity は広範な QA とリリースハーネスの下にネストされており、単独の PR ワークフローではありません。parity を広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` 付きで `Full Release Validation` を使います。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間実行され、手動ディスパッチでも実行されます。これはモック parity レーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使い、Telegram/Discord は Convex リースを使います。

リリースチェックは、決定論的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブトランスポートレーンを実行するため、チャネルコントラクトはライブモデルのレイテンシーや通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway は、QA parity がメモリ動作を別にカバーするため、メモリ検索を無効化します。プロバイダー接続性は、別のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使い、チェックアウトされた CLI がサポートする場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャーディングします。

`OpenClaw Release Checks` も、リリース承認前にリリースクリティカルな QA ラボレーンを実行します。その QA parity ゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後小さなレポートジョブに両方のアーティファクトをダウンロードして最終 parity 比較を行います。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープされた CI/チェックの証拠に従います。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に狭い初回パスのセキュリティスキャナーです。毎日、手動、および非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加えて、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルタリングされた高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュール済みワークフローと同じ高信頼度のセキュリティマトリックスを実行します。Android と macOS の CodeQL は、PR のデフォルトから外れています。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加えて、チャネル plugin ランタイム、gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、および Plugin SDK SSRF ポリシーのサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、および Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済みの Android セキュリティシャードです。ワークフロー健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャードです。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、アップロードされる SARIF から依存関係ビルド結果を除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次デフォルトの外に置かれています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。小さめの Blacksmith Linux ランナー上で、狭く価値の高いサーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。このプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルとバンドル済みチャネル plugin ランタイム、gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、および `plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、および gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、マイグレーション、正規化、および IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、および ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、およびアウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着部、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、およびセッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、およびセッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、および web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、gateway 制御フロー、およびタスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、およびメディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、および Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティから分離されています。これにより、品質の検出事項を、セキュリティシグナルを不明瞭にすることなく、スケジュール、測定、無効化、または拡張できます。Swift、Python、およびバンドル済み plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定してから、スコープ済みまたはシャード化されたフォローアップ作業としてのみ戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、既存のドキュメントを最近マージされた変更と整合させるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上のボット以外による push CI 実行が成功するとトリガーでき、手動ディスパッチで直接実行することもできます。workflow-run 呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上のボット以外による push CI 実行が成功するとトリガーできますが、その UTC 日に別の workflow-run 呼び出しがすでに実行済みまたは実行中の場合はスキップされます。手動ディスパッチは、この日次アクティビティゲートを迂回します。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には大規模なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗のみを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格する必要があります。ボット push が反映される前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo の安全姿勢を維持できるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、マージ後の重複クリーンアップのための手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合に明示的に列挙された PR のみを閉じます。GitHub を変更する前に、マージ済み PR がマージ済みであること、および各重複 PR に共有された参照 Issue または重複する変更ハンクがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。

- コア本番変更は、コア本番とコアテストの typecheck に加えて、コア lint/guard を実行します。
- コアのテストのみの変更は、コアテストの typecheck に加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの typecheck に加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの typecheck に加えて、extension lint を実行します。
- 公開 Plugin SDK または plugin 契約の変更は、extension がそれらのコア契約に依存しているため、extension typecheck まで拡張されます（Vitest extension スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/root 依存関係チェックを実行します。
- 不明な root/設定変更は、安全側に倒してすべてのチェックレーンを実行します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より安価です。直接のテスト編集はそのテスト自身を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ依存先を使います。共有 group-room 配信設定は、明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルト変更は最初の PR push 前に失敗します。変更がハーネス全体に及ぶほど広く、安価なマッピング済みセットが信頼できる代理にならない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox の検証

広範な検証には、リポジトリルートから Testbox を実行し、新しくウォームした box を優先します。再利用された、期限切れになった、または予想外に大きい同期を報告した box で遅いゲートに時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行してください。

健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short` が 200 件以上の追跡済み削除を示す場合に高速に失敗します。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、その box を停止して新しいものをウォームしてください。意図的な大量削除 PR では、その健全性実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカルの Blacksmith CLI 呼び出しも終了します。このガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きなローカル差分ではより大きいミリ秒値を使用してください。

Crabbox は、メンテナーの Linux 検証用にリポジトリが所有するリモート box ラッパーです。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または検証にシークレット、Docker、パッケージレーン、再利用可能な box、リモートログが必要な場合に使用します。通常の OpenClaw backend は `blacksmith-testbox` です。所有 AWS/Hetzner キャパシティは、Blacksmith の障害、クォータ問題、または明示的な所有キャパシティテストのフォールバックです。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を通知しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーを明示的に渡してください。

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

フォーカスしたテストの再実行:

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

最終 JSON サマリーを読んでください。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。単発の Blacksmith-backed Crabbox 実行では Testbox が自動的に停止するはずです。実行が中断された場合、またはクリーンアップが不明確な場合は、稼働中の box を調べ、自分が作成した box だけを停止してください。

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

同じ hydrated box で複数のコマンドを意図的に実行する必要がある場合のみ、再利用を使います。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

壊れている層が Crabbox で、Blacksmith 自体は動作する場合は、狭いフォールバックとして直接 Blacksmith を使用します。

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Blacksmith が停止している、クォータ制限がある、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions hydration のデフォルトを管理します。hydrated Actions checkout がメンテナーのローカルリモートやオブジェクトストアを同期するのではなく、自身のリモート Git メタデータを保持できるようにローカルの `.git` を除外し、転送されるべきではないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けに、checkout、Node/pnpm セットアップ、`origin/main` fetch、非シークレット環境の引き渡しを管理します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
