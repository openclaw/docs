---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper ディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリース包括ジョブ、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-07T13:13:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは差分を分類し、無関係な領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のために、意図的にスマートスコープを迂回してグラフ全体へ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは、別個の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更されたスコープ、変更された extensions を検出し、CI マニフェストをビルドする                   | draft 以外の push と PR で常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | draft 以外の push と PR で常に |
| `security-dependency-audit`      | npm advisories に対する、依存関係なしの production lockfile 監査                                          | draft 以外の push と PR で常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | draft 以外の push と PR で常に |
| `check-dependencies`             | production Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み成果物チェック、再利用可能な downstream 成果物をビルドする                       | Node 関連の変更              |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、shard 化された channel contract チェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テスト shard                          | Node 関連の変更              |
| `check`                          | shard 化されたメインのローカルゲート相当: production 型、lint、ガード、テスト型、strict smoke                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、shard 化された boundary/prompt drift、extension ガード、package boundary、gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                                            | Node 関連の変更              |
| `checks`                         | ビルド済み成果物 channel テスト用の検証器                                                                 | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                | リリース用の手動 CI dispatch    |
| `check-docs`                     | docs の formatting、lint、broken-link チェック                                                             | docs が変更された場合                       |
| `skills-python`                  | Python ベースの Skills 用 Ruff + pytest                                                                    | Python skill 関連の変更      |
| `checks-windows`                 | Windows 固有の process/path テストと共有 runtime import specifier 回帰テスト                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド成果物を使用する macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS app 用の Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方の flavor の Android unit テストと 1 つの debug APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex slow-test 最適化                                                 | main CI 成功または手動 dispatch |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む日次/オンデマンド Kova runtime performance レポート | スケジュールおよび手動 dispatch      |

## フェイルファスト順序

1. `preflight` が、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い artifact と platform matrix ジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第 downstream consumer を開始できます。
4. その後、より重い platform と runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が到着した場合、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗している場合を除き、これは CI ノイズとして扱ってください。集約 shard チェックは `!cancelled() && always()` を使用するため、通常の shard 失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI concurrency key はバージョン付き (`CI-v7-*`) なので、古い queue group 内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはできません。手動 full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

`ci-timings-summary` ジョブは、draft 以外の各 CI 実行についてコンパクトな `ci-timings-summary` artifact をアップロードします。現在の実行の wall time、queue time、最も遅いジョブ、失敗したジョブを記録するため、CI health check は Actions payload 全体を繰り返し scrape する必要がありません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight manifest をすべてのスコープ領域が変更されたかのように動作させます。

- **CI workflow edits** は Node CI グラフと workflow linting を検証しますが、それ自体では Windows、Android、macOS の native build を強制しません。これらの platform レーンは platform source の変更にスコープされたままです。
- **CI routing-only edits、選択された cheap core-test fixture edits、および narrow plugin contract helper/test-routing edits** は、高速 Node のみの manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task。この path は、変更が routing または helper surface のうち高速 task が直接実行する範囲に限定されている場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、およびそのレーンを実行する CI workflow surface にスコープされます。無関係な source、plugin、install-smoke、test-only の変更は Linux Node レーンに残ります。

最も遅い Node test family は、各ジョブが runner を過剰予約せず小さく保てるように分割またはバランス調整されています。channel contracts は標準の GitHub runner fallback を持つ 3 つの weighted Blacksmith-backed shard として実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state、process/config、cron、shared shards に分割され、auto-reply は balanced workers として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing shards に分割）。agentic gateway/server config は、ビルド成果物を待つのではなく chat/auth/model/http-plugin/runtime/startup レーンに分割されます。広範な browser、QA、media、および miscellaneous plugin テストは、共有 plugin catch-all ではなく専用の Vitest config を使用します。Include-pattern shards は CI shard name を使用して timing entries を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard list は 4 つの matrix shard に striped され、それぞれが選択された独立ガードを同時に実行し、check ごとの timing を出力します。高コストな Codex happy-path prompt snapshot drift チェックは、手動 CI と prompt に影響する変更のみを対象とした独自の additional job として実行されるため、通常の無関係な Node 変更は cold prompt snapshot generation の後ろで待たず、boundary shards はバランスを保ちつつ、prompt drift はそれを引き起こした PR に固定されます。同じフラグは、built-artifact core support-boundary shard 内の prompt snapshot Vitest generation もスキップします。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で同時に実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には separate source set や manifest はありません。その unit-test レーンは、SMS/call-log BuildConfig flags を使って flavor をコンパイルしつつ、Android 関連の各 push で debug APK packaging job が重複することを避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新 Knip version に固定され、`dlx` install では pnpm の minimum release age が無効化された production Knip dependency-only pass）と `pnpm deadcode:unused-files` を実行します。後者は Knip の production unused-file findings を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの unused file を追加した場合や stale allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw repository activity から ClawSweeper への target-side bridge です。信頼されていない pull request code を checkout したり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

この workflow には 4 つのレーンがあります。

- exact issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper command 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が検査する可能性がある一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは正規化された metadata のみを forward します: event type、action、actor、repository、item number、URL、title、state、および存在する場合の comment または review の短い excerpt。意図的に webhook body 全体は forward しません。`openclaw/clawsweeper` 側の受信 workflow は `.github/workflows/github-activity.yml` であり、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般 activity は observation であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が surprising、actionable、risky、または operationally useful な場合にのみ `#clawsweeper` に投稿するべきです。Routine opens、edits、bot churn、duplicate webhook noise、normal review traffic は `NO_REPLY` になるべきです。

GitHub のタイトル、コメント、本文、レビュー文、ブランチ名、コミットメッセージは、このパス全体で信頼できないデータとして扱います。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャンネルコントラクト、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは、`include_android=true` の場合のみ Android を実行します。完全リリースの包括ワークフローは、`include_android=true` を渡して Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張機能バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の並行実行グループを使うため、リリース候補のフルスイートが同じ ref 上の別の push または PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼済みの呼び出し元は、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/コントラクト/バンドルチェック、シャード化されたチャンネルコントラクトチェック、lint を除く `check` シャード、`check-additional` 集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHub ホスト Ubuntu を使うため、Blacksmith マトリックスはより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`check-additional` シャード、`android`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU に十分敏感で、8 vCPU は節約分よりコストの方が大きかった）。install-smoke Docker ビルド（32 vCPU のキュー時間コストは節約分より大きかった）                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork は `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork は `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                       |

正規リポジトリの CI は、Blacksmith をデフォルトのランナーパスとして維持します。`preflight` 中に、`scripts/ci-runner-labels.mjs` は、最近キュー済みおよび実行中の Actions 実行でキュー済みの Blacksmith ジョブを確認します。特定の Blacksmith ラベルにすでにキュー済みジョブがある場合、その正確なラベルを使うはずだった下流ジョブは、その実行に限って対応する GitHub ホストランナー（`ubuntu-24.04`、`windows-2025`、または `macos-latest`）にフォールバックします。同じ OS ファミリーの他の Blacksmith サイズは、主要ラベルのままです。API プローブが失敗した場合、フォールバックは適用されません。

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

`OpenClaw Performance` は、製品/ランタイムのパフォーマンスワークフローです。これは `main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` にはテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

ワークフローは、ピン留めされたリリースから OCM を、ピン留めされた `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、その後 3 つのレーンを実行します:

- `mock-provider`: 決定的なフェイク OpenAI 互換認証を持つローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、hook、50 Plugin 起動ケースでの Gateway 起動時間とメモリ、繰り返しの mock-OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンドです。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生 JSON はその隣にあります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下の `openclaw/clawgrit-reports` にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべて実行する」ための手動包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker の証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable/default 実行では、網羅的な live/E2E と Docker リリースパスのカバレッジを `run_release_soak=true` の背後に維持します。`release_profile=full` はその soak カバレッジを強制的に有効にするため、広範な advisory 検証は広範なままになります。`rerun_group=all` と `release_profile=full` の場合、release checks の `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡して、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行します。

ステージマトリックス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、対象を絞った再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後で初めて、保存された `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

変化の速いブランチで固定コミットの証明を行う場合は、
`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフロー dispatch の ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。このヘルパーは、対象 SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` を dispatch し、すべての子ワークフローの `headSha` が対象と一致することを検証し、実行完了時に一時ブランチを削除します。包括 verifier も、子ワークフローが別の SHA で実行された場合は失敗します。

`release_profile` は、リリースチェックへ渡される live/provider の広さを制御します。手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media マトリクスを意図的に使う場合にのみ `full` を使用してください。`run_release_soak` は、stable/default リリースチェックが網羅的な live/E2E と Docker リリースパス soak を実行するかどうかを制御します。`full` は soak を強制的に有効にします。

- `minimum` は最速の OpenAI/core リリースクリティカル lane に絞ります。
- `stable` は stable provider/backend セットを追加します。
- `full` は広範な advisory provider/media マトリクスを実行します。

包括側は dispatch された子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の conclusion を再チェックし、各子実行の最も遅いジョブの表を追記します。子ワークフローが再実行されて green になった場合は、包括結果とタイミング要約を更新するために親 verifier ジョブだけを再実行してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の full CI 子だけには `ci`、Plugin prerelease 子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、または包括側でより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、重点的な修正後に失敗したリリースボックスの再実行範囲を限定できます。1 つの cross-OS lane だけが失敗した場合は、たとえば `windows/packaged-upgrade` のように、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。長い cross-OS コマンドは heartbeat 行を出力し、packaged-upgrade の要約にはフェーズごとのタイミングが含まれます。QA release-check lane は advisory なので、QA のみの失敗は警告になりますが、release-check verifier はブロックしません。

`OpenClaw Release Checks` は trusted workflow ref を使って、選択された ref を一度だけ `release-package-under-test` tarball に解決し、その artifact を cross-OS チェックと Package Acceptance に渡します。さらに soak coverage が実行される場合は live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間で package bytes の一貫性が保たれ、同じ候補を複数の子ジョブで再パックすることを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古い包括を置き換えます。親 monitor は、親がキャンセルされたときに、すでに dispatch 済みの子ワークフローをすべてキャンセルします。そのため、新しい main validation が古い 2 時間の release-check 実行の後ろで待機し続けることはありません。リリースブランチ/タグ validation と focused rerun groups は `cancel-in-progress: false` を維持します。

## Live と E2E shard

リリース live/E2E 子は広範な native `pnpm test:live` coverage を維持しますが、1 つの serial ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割された media audio/video shard と provider-filtered music shard

これにより、同じファイル coverage を維持しながら、遅い live provider の失敗を再実行および診断しやすくなります。集約名である `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` shard 名は、手動の 1 回限りの再実行でも引き続き有効です。

native live media shard は、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされており、media ジョブはセットアップ前にバイナリを検証するだけです。Docker-backed live suite は通常の Blacksmith runner 上に維持してください。container job は nested Docker tests を起動する場所として適していません。

Docker-backed live model/backend shard は、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。live release ワークフローはそのイメージを一度だけビルドして push し、その後 Docker live model、provider-sharded gateway、CLI backend、ACP bind、Codex harness shard が `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker shard はワークフロージョブの timeout より短い明示的な script-level `timeout` cap を持つため、コンテナや cleanup path が詰まった場合に、release-check 予算全体を消費するのではなく早く失敗します。これらの shard が full source Docker target を個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドで wall clock を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージはプロダクトとして動作するか」を確認する場合は `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI は source tree を検証しますが、package acceptance は、ユーザーがインストールまたは更新後に使う同じ Docker E2E harness を通じて単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` を checkout し、1 つの package candidate を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` artifact としてアップロードし、source、workflow ref、package ref、version、SHA-256、profile を GitHub step summary に出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはその artifact をダウンロードし、tarball inventory を検証し、必要に応じて package-digest Docker イメージを準備し、ワークフロー checkout を pack する代わりに、そのパッケージに対して選択された Docker lane を実行します。profile が複数の targeted `docker_lanes` を選択した場合、再利用可能ワークフローは package と共有イメージを一度だけ準備し、それらの lane を unique artifact を持つ parallel targeted Docker job として fan out します。
3. `package_telegram` は必要に応じて `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` artifact をインストールします。standalone Telegram dispatch では、公開済み npm spec を引き続きインストールできます。
4. `summary` は、package resolution、Docker acceptance、または任意の Telegram lane が失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンだけを受け付けます。公開済み prerelease/stable acceptance にこれを使用します。
- `source=ref` は trusted `package_ref` ブランチ、タグ、または full commit SHA を pack します。resolver は OpenClaw のブランチ/タグを fetch し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、detached worktree に deps をインストールし、`scripts/package-openclaw-for-docker.mjs` で pack します。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` が必要です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有 artifact では指定するべきです。

`workflow_ref` と `package_ref` は分けてください。`workflow_ref` はテストを実行する trusted workflow/harness code です。`package_ref` は `source=ref` のときに pack される source commit です。これにより、現在のテスト harness は古い workflow logic を実行せずに、古い trusted source commit を検証できます。

### suite profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む full Docker release-path chunk
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` profile は offline plugin coverage を使用するため、published-package validation は live ClawHub availability に依存しません。任意の Telegram lane は `NPM Telegram Beta E2E` で `package-under-test` artifact を再利用し、公開済み npm spec path は standalone dispatch 用に維持されます。

local commands、Docker lanes、Package Acceptance inputs、release defaults、failure triage を含む、専用の update と plugin testing policy については、[更新と plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

Release checks は、`source=artifact`、準備済み release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、package migration、update、stale-plugin-dependency cleanup、configured-plugin install repair、offline plugin、plugin-update、Telegram proof が同じ解決済み package tarball 上に維持されます。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA-built artifact ではなく出荷済み npm package に対して同じマトリクスを実行できます。Cross-OS release checks は引き続き OS 固有のオンボーディング、installer、platform behavior をカバーします。package/update product validation は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker lane は、blocking release path で 1 回の実行につき 1 つの published package baseline を検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に candidate であり、`published_upgrade_survivor_baseline` が fallback published baseline を選択します。デフォルトは `openclaw@latest` です。failed-lane rerun コマンドはその baseline を保持します。`run_release_soak=true` または `release_profile=full` の Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 つの stable npm release に加えて、Feishu config、保持された bootstrap/persona file、configured OpenClaw plugin install、tilde log path、stale legacy plugin dependency root 向けの固定 plugin-compatibility boundary release と issue-shaped fixture まで拡張します。multi-baseline published-upgrade survivor selection は、baseline ごとに別々の targeted Docker runner job へ sharding されます。別の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、網羅的な published update cleanup が問題である場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` で `update-migration` Docker lane を使用します。local aggregate run では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確な package spec を渡すことができ、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で single lane を維持することも、scenario matrix 用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定することもできます。published lane は baked `openclaw config set` command recipe で baseline を設定し、recipe step を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、さらに RPC status を probe します。Windows packaged lane と installer fresh lane も、インストール済みパッケージが raw absolute Windows path から browser-control override を import できることを検証します。OpenAI cross-OS agent-turn smoke は、設定されていれば `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトにし、そうでなければ `openai/gpt-5.4` を使用します。これにより、install と gateway proof は GPT-5 test model 上に維持され、GPT-4.x default を避けられます。

### legacy compatibility window

Package Acceptance には、すでに公開済みのパッケージ向けに境界付きのレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` の永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来のフェイク git fixture から欠落している `pnpm.patchedDependencies` を刈り込む場合があり、永続化された `update.channel` の欠落をログに記録する場合があります。
- plugin smoke は、レガシーのインストール記録場所を読み取る場合や、マーケットプレイスのインストール記録の永続化欠落を許容する場合があります。
- `plugin-update` は、インストール記録と再インストールなしの挙動が変更されないことを引き続き要求しつつ、設定メタデータの移行を許容する場合があります。

公開済みの `2026.4.26` パッケージでも、すでに出荷済みだったローカルビルドメタデータのスタンプファイルについて警告する場合があります。それ以降のパッケージは、現在のコントラクトを満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、まず `resolve_package` サマリーで、パッケージのソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクト（`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane ログ、フェーズタイミング、再実行コマンド）を調べます。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker lane を再実行することを優先してください。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージ面に触れるプルリクエスト、同梱 plugin のパッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコア plugin/channel/gateway/Plugin SDK 面に対して実行されます。ソースのみの同梱 plugin 変更、テストのみの編集、docs のみの編集は Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete 共有ワークスペース CLI smoke を実行し、コンテナー gateway-network e2e を実行し、同梱 extension ビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付き同梱 plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **完全パス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そしてインストーラー/パッケージ/Docker 面に実際に触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/update カバレッジを保持します。完全モードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile smoke イメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/gateway smoke、インストーラー/update smoke、高速同梱 plugin Docker E2E を個別のジョブとして実行するため、インストーラー作業がルートイメージの smoke の後ろで待たされません。

`main` への push（マージコミットを含む）は完全パスを強制しません。変更スコープロジックが push で完全カバレッジを要求する場合でも、ワークフローは高速 Docker smoke を維持し、完全 install smoke は夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチではオプトインできますが、プルリクエストと `main` への push では実行されません。QR とインストーラー Docker テストは、それぞれインストールに特化した Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/update/plugin-dependency lane 向けの素の Node/Git ランナー。
- 同じ tarball を `/app` にインストールする通常機能 lane 向けの機能イメージ。

Docker lane 定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` で lane ごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で lane を実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常 lane のメインプールスロット数。                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時ライブ lane 上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install lane 上限。                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービス lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるための lane 開始間隔。間隔なしの場合は `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | lane ごとのフォールバックタイムアウト（120 分）。選択された live/tail lane はより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` は lane を実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確な lane リスト。cleanup smoke をスキップし、agent が失敗した lane を 1 つ再現できるようにします。 |

実効上限より重い lane でも、空のプールから開始できます。その後はキャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナーを削除し、アクティブ lane ステータスを出力し、最長優先の順序付けのために lane タイミングを永続化し、デフォルトでは最初の失敗後に新しいプール lane のスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、`scripts/test-docker-all.mjs --plan-json` に、必要なパッケージ、イメージ種別、ライブイメージ、lane、認証情報カバレッジを問い合わせます。`scripts/docker-e2e.mjs` はそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランにパッケージインストール済み lane が必要な場合は、Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。そして、再ビルドする代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージ pull は、試行ごとに 180 秒の境界付きタイムアウトでリトライされるため、停止した registry/cache ストリームが CI のクリティカルパスの大半を消費するのではなく、すばやくリトライされます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンク化ジョブで実行されます。これにより、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数の lane を実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 plugin/runtime エイリアスのままです。`install-e2e` lane エイリアスは、両方のプロバイダーインストーラー lane 向けの集約手動再実行エイリアスのままです。

完全なリリースパスカバレッジが要求する場合、OpenWebUI は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチに対してだけ単独の `openwebui` チャンクを維持します。同梱 channel update lane は、一時的な npm ネットワーク障害に対して 1 回リトライします。

各チャンクは、lane ログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速 lane テーブル、lane ごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択した lane を実行します。これにより、失敗 lane のデバッグを 1 つのターゲット Docker ジョブに限定し、その実行のためにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択した lane がライブ Docker lane の場合、ターゲットジョブはその再実行のためにライブテストイメージをローカルでビルドします。生成される lane ごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗した lane は失敗した実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E ワークフローは、完全なリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストなプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` への push、単独の手動 CI ディスパッチでは、このスイートはオフのままです。これは同梱 plugin テストを 8 つの extension ワーカーに分散します。これらの extension シャードジョブは、1 グループあたり 1 つの Vitest ワーカーとより大きな Node ヒープで、最大 2 つの plugin 設定グループを同時に実行します。これにより、import の重い plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1 分から 3 分のジョブのために多数の runner を予約しないよう、ターゲット Docker lane を小さなグループでバッチ化します。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外側に専用の CI lane があります。Agentic parity は広範な QA およびリリースハーネスの下にネストされており、単独の PR ワークフローではありません。parity を広範な検証実行に乗せる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用してください。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間に、また手動ディスパッチで実行されます。これは mock parity lane、live Matrix lane、live Telegram および Discord lane を並列ジョブとしてファンアウトします。live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex lease を使用します。

リリースチェックは、決定論的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram のライブトランスポートレーンを実行するため、チャネル契約はライブモデルのレイテンシーと通常のプロバイダーPlugin起動から分離されます。ライブトランスポートGatewayはメモリ検索を無効にします。これは QA parity がメモリ動作を別途カバーするためです。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダーのスイートでカバーされます。

Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使い、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA parity ゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的な parity 比較のために両方のアーティファクトを小さなレポートジョブへダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープされた CI/チェックの証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に狭い初回パスのセキュリティスキャナーです。日次、手動、非ドラフトのプルリクエストガードの実行では、Actions ワークフローコードに加えて、最高リスクの JavaScript/TypeScript サーフェスを、高/重大の `security-severity` に絞った高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始し、スケジュール済みワークフローと同じ高信頼度のセキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加えて、チャネルPluginランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK の SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済みの Android セキュリティシャード。ワークフロー健全性チェックが受け入れる最小の Blacksmith Linux ランナー上で、CodeQL のために Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL のために macOS アプリを手動でビルドし、アップロードされる SARIF から依存関係ビルド結果を除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置かれています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。より小さい Blacksmith Linux ランナー上で、狭く高価値なサーフェスに対して、エラー重要度の非セキュリティ JavaScript/TypeScript 品質クエリのみを実行します。そのプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルとバンドルされたチャネルPluginランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドルされたチャネルPluginの実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway 制御フロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリーポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースとPluginパッケージ契約ヘルパー                                                                                      |

品質はセキュリティから分離されています。これにより、セキュリティシグナルを曖昧にすることなく、品質の検出事項をスケジュール、測定、無効化、または拡張できます。Swift、Python、バンドルPluginの CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、スコープ付きまたはシャード化された後続作業として追加し直す必要があります。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを揃え続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push の CI 実行が成功するとトリガーされることがあり、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push の CI 実行が成功するとトリガーされることがありますが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートを迂回します。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex に広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行して、通過ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗のみを修正できます。また、エージェント後のフルスイートレポートは、何かをコミットする前に合格している必要があります。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して、push を再試行します。競合する古いパッチはスキップされます。Codex アクションが docs agent と同じ drop-sudo の安全姿勢を維持できるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複整理のための手動メンテナーワークフローです。デフォルトはドライランで、`apply=true` の場合にのみ、明示的に列挙された PR をクローズします。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に共有された参照 issue または重複する変更ハンクがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広い CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。

- コア本番環境の変更は、コア prod とコア test の型チェックに加えてコア lint/guard を実行する。
- コアのテストのみの変更は、コア test の型チェックに加えてコア lint のみを実行する。
- 拡張機能の本番環境の変更は、拡張機能 prod と拡張機能 test の型チェックに加えて拡張機能 lint を実行する。
- 拡張機能のテストのみの変更は、拡張機能 test の型チェックに加えて拡張機能 lint を実行する。
- 公開 Plugin SDK または plugin-contract の変更は、拡張機能がそれらのコア契約に依存しているため、拡張機能の型チェックまで拡張される（Vitest の拡張機能スイープは明示的なテスト作業のまま）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/config/ルート依存関係チェックを実行する。
- 不明なルート/config の変更は、安全側に倒してすべてのチェックレーンを実行する。

ローカルの changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` よりも低コストになっている。直接のテスト編集はそれ自身を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストと import-graph の依存先を使う。共有 group-room 配信 config は明示的なマッピングの 1 つである。group の可視返信 config、ソース返信配信モード、または message-tool の system prompt への変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR push 前に失敗する。変更がハーネス全体に及ぶため、低コストにマッピングされた集合が信頼できる proxy ではない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使う。

## Testbox 検証

Testbox は repo ルートから実行し、広範な証明には新しく warm した box を優先する。再利用された、期限切れになった、または予期せず大きな sync を報告した box で遅い gate に時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行する。

sanity check は、`pnpm-lock.yaml` などの必須ルートファイルが消えている場合、または `git status --short` が 200 件以上の tracked deletion を示す場合に高速に失敗する。これは通常、remote sync state が PR の信頼できるコピーではないことを意味する。製品テスト失敗をデバッグするのではなく、その box を止めて新しいものを warm する。意図的に大規模な削除を行う PR では、その sanity run に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定する。

`pnpm testbox:run` は、sync 後の出力がないまま 5 分を超えて sync フェーズに留まるローカルの Blacksmith CLI 呼び出しも終了する。その guard を無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、非常に大きなローカル diff にはより大きなミリ秒値を使う。

Crabbox は、maintainer の Linux 証明のための repo 所有 remote-box wrapper である。チェックがローカル編集ループには広すぎる場合、CI parity が重要な場合、または証明に secrets、Docker、package lanes、再利用可能な boxes、remote logs が必要な場合に使う。通常の OpenClaw backend は `blacksmith-testbox` で、所有 AWS/Hetzner capacity は Blacksmith の障害、quota 問題、または明示的な owned-capacity testing のための fallback である。

初回実行の前に、repo ルートから wrapper を確認する。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper は、`blacksmith-testbox` を advertise しない古い Crabbox binary を拒否する。`.crabbox.yaml` に owned-cloud defaults があっても、provider は明示的に渡す。

Changed gate:

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

Focused test rerun:

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

Full suite:

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

最後の JSON summary を読む。有用な fields は `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` である。One-shot の Blacksmith-backed Crabbox run は Testbox を自動的に stop するはずである。run が interrupt された、または cleanup が不明な場合は、live boxes を inspect し、自分が作成した boxes だけを stop する。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydrated box で複数の commands が意図的に必要な場合にのみ reuse を使う。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層だが Blacksmith 自体は動作する場合は、狭い fallback として direct Blacksmith を使う。

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しい warmup が数分経っても IP や Actions run URL のない `queued` のままの場合は、Blacksmith provider、queue、billing、または org-limit の圧迫として扱う。作成した queued ids を stop し、それ以上 Testboxes を開始せず、誰かが Blacksmith dashboard、billing、org limits を確認している間に、下記の owned Crabbox capacity path へ証明を移す。

Blacksmith が down、quota-limited、必要な environment がない、または owned capacity が明示的な目的である場合にのみ、owned Crabbox capacity に escalate する。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 圧迫下では、タスクが本当に 48xlarge-class CPU を必要としない限り `class=beast` を避ける。`beast` request は 192 vCPUs から始まり、regional EC2 Spot または On-Demand Standard quota に抵触する最も簡単な方法である。repo 所有の `.crabbox.yaml` は `standard`、複数の capacity regions、`capacity.hints: true` を defaults としているため、brokered AWS leases は選択された region/market、quota pressure、Spot fallback、高圧 class warnings を表示する。より重い広範チェックには `fast` を使い、standard/fast で不足した後にのみ `large` を使い、`beast` は full-suite や all-plugin Docker matrices、明示的な release/blocker validation、または high-core performance profiling などの例外的な CPU-bound lanes にのみ使う。`pnpm check:changed`、focused tests、docs-only work、通常の lint/typecheck、小規模 E2E repro、または Blacksmith outage triage には `beast` を使わない。capacity diagnosis には `--market on-demand` を使い、Spot market churn が signal に混ざらないようにする。

`.crabbox.yaml` は owned-cloud lanes の provider、sync、GitHub Actions hydration defaults を所有する。これは local `.git` を exclude するため、hydrated Actions checkout は maintainer-local remotes と object stores を sync するのではなく、自身の remote Git metadata を保持する。また、転送してはならない local runtime/build artifacts を exclude する。`.github/workflows/crabbox-hydrate.yml` は checkout、Node/pnpm setup、`origin/main` fetch、owned-cloud `crabbox run --id <cbx_id>` commands のための non-secret environment handoff を所有する。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
