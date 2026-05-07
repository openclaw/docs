---
read_when:
    - CI ジョブが実行されたか実行されなかったか、その理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリース包括ワークフロー、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-07T01:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` への各 push と各 pull request で実行されます。`preflight` ジョブは diff を分類し、関係のない領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のために、意図的にスマートスコープを迂回して完全なグラフへ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは別の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ドキュメントのみの変更、変更スコープ、変更されたプラグイン、CI マニフェストのビルドを検出する                   | draft でない push と PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | draft でない push と PR では常に |
| `security-dependency-audit`      | npm アドバイザリに対する、依存関係不要の本番 lockfile 監査                                          | draft でない push と PR では常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | draft でない push と PR では常に |
| `check-dependencies`             | 本番 Knip 依存関係のみのパスと未使用ファイル allowlist ガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルドする                       | Node 関連の変更              |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャンネル契約チェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | チャンネル、bundled、contract、プラグインレーンを除く Core Node テストシャード                          | Node 関連の変更              |
| `check`                          | シャード化されたメインのローカルゲート相当: 本番型、lint、ガード、テスト型、厳格な smoke                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、シャード化された境界/prompt drift、プラグインガード、パッケージ境界、Gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動メモリ smoke                                                            | Node 関連の変更              |
| `checks`                         | ビルド済みアーティファクトのチャンネルテスト用 verifier                                                                 | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                | リリース向けの手動 CI dispatch    |
| `check-docs`                     | ドキュメントのフォーマット、lint、壊れたリンクのチェック                                                             | ドキュメント変更                       |
| `skills-python`                  | Python backed Skills の Ruff + pytest                                                                    | Python Skill 関連の変更      |
| `checks-windows`                 | Windows 固有の process/path テストと、共有ランタイム import specifier の回帰検出                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済みアーティファクトを使う macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリ向けの Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方の flavor の Android ユニットテストと、1 つの debug APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                 | メイン CI 成功または手動 dispatch |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む、日次/オンデマンドの Kova ランタイム性能レポート | スケジュール実行と手動 dispatch      |

## fail-fast の順序

1. `preflight` が、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトジョブやプラットフォームマトリクスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、下流の利用側は共有ビルドの準備ができ次第開始できます。
4. その後、より重いプラットフォームレーンとランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗しているのでない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後はキューに入りません。自動 CI の concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループに残った GitHub 側のゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使い、進行中の実行をキャンセルしません。

`ci-timings-summary` ジョブは、draft でない各 CI 実行について、コンパクトな `ci-timings-summary` アーティファクトをアップロードします。現在の実行の wall time、queue time、最も遅いジョブ、失敗したジョブを記録するため、CI ヘルスチェックが Actions payload 全体を繰り返しスクレイプする必要はありません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight マニフェストを、すべてのスコープ領域が変更されたかのように動作させます。

- **CI ワークフローの編集**は Node CI グラフとワークフロー lint を検証しますが、それだけで Windows、Android、macOS のネイティブビルドを強制することはありません。これらのプラットフォームレーンは、プラットフォームソース変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された安価な core-test fixture 編集、狭い Plugin 契約 helper/test-routing 編集**は、高速な Node のみのマニフェストパスを使います: `preflight`、security、単一の `checks-fast-core` タスクです。このパスは、変更がルーティングまたは helper サーフェスに限定され、高速タスクがそれらを直接実行する場合、ビルドアーティファクト、Node 22 互換性、チャンネル契約、完全な core shard、bundled-plugin shard、追加ガードマトリクスをスキップします。
- **Windows Node チェック**は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、そのレーンを実行する CI ワークフローサーフェスにスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブが runner を過剰に予約せず小さく保たれるよう分割またはバランス調整されています。チャンネル契約は 3 つの重み付き shard として実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state、process/config、cron、shared shard に分割されます。auto-reply はバランスされた worker として実行され（reply サブツリーは agent-runner、dispatch、commands/state-routing shard に分割）、agentic gateway/server config はビルド済みアーティファクトを待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されます。広範な browser、QA、media、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使います。include-pattern shard は CI shard 名を使って timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard list は 4 つの matrix shard に分散され、それぞれが選択された独立ガードを並行実行し、チェックごとの timing を出力します。高コストな Codex happy-path prompt snapshot drift check は手動 CI と prompt に影響する変更でのみ実行されるため、通常の無関係な Node 変更が cold prompt snapshot generation の背後で待たされることはなく、prompt drift はそれを引き起こした PR に引き続き固定されます。同じフラグは、ビルド済みアーティファクトの core support-boundary shard 内の prompt snapshot Vitest generation もスキップします。Gateway watch、チャンネルテスト、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には個別の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きで flavor を引き続きコンパイルしますが、Android 関連の各 push で重複した debug APK packaging ジョブを避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新の Knip バージョンに固定された本番 Knip 依存関係のみのパスで、`dlx` install のために pnpm の minimum release age が無効化されています）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番 unused-file findings を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な dynamic Plugin、generated、build、live-test、package bridge サーフェスは保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡すターゲット側ブリッジです。信頼できない pull request コードを checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper command 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が検査する可能性のある一般 GitHub activity 用の `github_activity`。

`github_activity` レーンは正規化されたメタデータのみを転送します: event type、action、actor、repository、item number、URL、title、state、および comment や review が存在する場合の短い excerpt です。完全な Webhook body を転送しないよう意図されています。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的な activity は観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が意外、actionable、リスクがある、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 Webhook noise、通常の review traffic は `NO_REPLY` になるべきです。

GitHub のタイトル、コメント、本文、レビュー文、ブランチ名、コミットメッセージは、このパス全体で信頼されないデータとして扱います。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。フルリリースの包括ワークフローは `include_android=true` を渡して Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張機能バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の concurrency グループを使うため、リリース候補のフルスイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択されたディスパッチ ref のワークフローファイルを使いながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャード化されたチャンネル契約チェック、lint 以外の `check` シャード、`check-additional` 集約、Node テスト集約検証、ドキュメントチェック、Python skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHub ホストの Ubuntu を使い、Blacksmith マトリックスがより早くキューに入れるようにします |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低負荷の拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`check-additional` シャード、`android`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 感度が高く、8 vCPU では節約できる以上にコストがかかったため）。install-smoke Docker ビルド（32 vCPU のキュー時間コストが節約分を上回ったため）                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                      |

正規リポジトリの CI は、Blacksmith を既定のランナーパスとして維持します。`preflight` 中に、`scripts/ci-runner-labels.mjs` が直近のキュー済みおよび進行中の Actions 実行を調べ、キュー済みの Blacksmith ジョブを確認します。特定の Blacksmith ラベルにすでにキュー済みジョブがある場合、その正確なラベルを使うはずだった下流ジョブは、その実行に限り対応する GitHub ホストランナー（`ubuntu-24.04`、`windows-2025`、または `macos-latest`）にフォールバックします。同じ OS ファミリー内の他の Blacksmith サイズは、主要ラベルのままです。API プローブに失敗した場合、フォールバックは適用されません。

## ローカル相当

```bash
pnpm changed:lanes                            # origin/main...HEAD のローカル変更レーン分類器を確認
pnpm check:changed                            # スマートなローカルチェックゲート: 境界レーンごとの変更 typecheck/lint/guards
pnpm check                                    # 高速ローカルゲート: prod tsgo + シャード化 lint + 並列高速 guards
pnpm check:test-types
pnpm check:timed                              # ステージごとのタイミング付きの同じゲート
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest テスト
pnpm test:changed                             # 安価でスマートな変更 Vitest ターゲット
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # ドキュメント形式 + lint + 壊れたリンク
pnpm build                                    # CI artifact/build-smoke レーンが重要な場合に dist をビルド
pnpm ci:timings                               # 最新の origin/main push CI 実行を要約
pnpm ci:timings:recent                        # 直近の成功した main CI 実行を比較
node scripts/ci-run-timings.mjs <run-id>      # 経過時間、キュー時間、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --latest-main # issue/comment ノイズを無視し、origin/main push CI を選択
node scripts/ci-run-timings.mjs --recent 10   # 直近の成功した main CI 実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグや別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開レポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` はテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターを記録します。

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽 OpenAI 互換認証を備えたローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パス後に OpenClaw ネイティブのソースプローブも実行します: 既定、hook、50 Plugin 起動ケースにおける Gateway 起動時間とメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド。ソースプローブの Markdown 要約はレポートバンドル内の `source/index.md` にあり、生 JSON が隣に配置されます。

すべてのレーンは GitHub artifacts をアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブ artifacts も `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## Full Release Validation

`Full Release Validation` は「リリース前にすべてを実行する」ための手動包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。安定版/既定の実行では、網羅的な live/E2E と Docker リリースパスカバレッジを `run_release_soak=true` の背後に保持します。`release_profile=full` はその soak カバレッジを強制的に有効にし、広範な advisory 検証が広範なままになるようにします。`rerun_group=all` と `release_profile=full` の場合、release checks の `release-package-under-test` artifact に対して `NPM Telegram Beta E2E` も実行します。公開後、`npm_telegram_package_spec` を渡すと、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行できます。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、artifacts、重点的な再実行ハンドルについては、[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を加える手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にのみ保存された `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットを証明するには、
`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーは、対象 SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証し、実行完了時に一時ブランチを削除します。統括ベリファイアは、いずれかの子ワークフローが異なる SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダー範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範なアドバイザリプロバイダー/メディアマトリックスを意図的に実行したい場合にのみ `full` を使用してください。`run_release_soak` は、stable/デフォルトのリリースチェックで網羅的なライブ/E2E と Docker リリースパスの soak を実行するかどうかを制御します。`full` は soak を強制的に有効にします。

- `minimum` は最速の OpenAI/core リリース重要レーンのみを保持します。
- `stable` は安定版プロバイダー/バックエンドセットを追加します。
- `full` は広範なアドバイザリプロバイダー/メディアマトリックスを実行します。

統括はディスパッチした子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックして、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して green になった場合は、統括結果とタイミングサマリーを更新するために親ベリファイアジョブだけを再実行します。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の full CI 子だけには `ci`、Plugin プレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、または統括上のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正後の失敗したリリースボックスの再実行範囲を限定できます。1 つの失敗した cross-OS レーンでは、たとえば `windows/packaged-upgrade` のように、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。長時間の cross-OS コマンドは Heartbeat 行を出力し、packaged-upgrade のサマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンはアドバイザリなので、QA のみの失敗は警告になりますが、リリースチェックベリファイアはブロックしません。

`OpenClaw Release Checks` は信頼済みワークフロー ref を使用して、選択された ref を一度だけ `release-package-under-test` tarball に解決し、その成果物を cross-OS チェックと Package Acceptance に渡します。soak カバレッジを実行する場合は、ライブ/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージバイトが一貫し、複数の子ジョブで同じ候補を再パックすることを避けられます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古い統括を置き換えます。親モニターは親がキャンセルされたときに、すでにディスパッチ済みの子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機することはありません。リリースブランチ/タグ検証と焦点を絞った再実行グループでは、`cancel-in-progress: false` を維持します。

## ライブと E2E shard

リリースのライブ/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、単一の直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

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
- 分割されたメディア audio/video shard と、プロバイダーでフィルターされた music shard

これにより、同じファイルカバレッジを維持しながら、遅いライブプロバイダーの失敗を再実行しやすく、診断しやすくなります。集約 shard 名である `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` は、手動の 1 回限りの再実行でも引き続き有効です。

ネイティブライブメディア shard は、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリを検証するだけです。Docker バックのライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストした Docker テストを起動する場所として適していません。

Docker バックのライブモデル/バックエンド shard は、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダーで shard された Gateway、CLI バックエンド、ACP bind、Codex harness shard が `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker shard は、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限を持つため、コンテナまたはクリーンアップパスが停止した場合、リリースチェックの予算全体を消費せずに素早く失敗します。これらの shard が full source Docker target を個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複するイメージビルドに実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いには `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、Package Acceptance はインストールまたは更新後にユーザーが実行するのと同じ Docker E2E harness を通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` 成果物としてアップロードし、ソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを GitHub ステップサマリーに出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはその成果物をダウンロードし、tarball インベントリを検証し、必要に応じて package-digest Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択している場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意の成果物を持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は必要に応じて `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決していた場合は同じ `package-under-test` 成果物をインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのプレリリース/stable acceptance にこれを使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw ブランチ/タグを fetch し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、detached worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` が必要です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有された成果物では指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みワークフロー/harness コードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテスト harness は古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む full Docker release-path チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証がライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` 内で `package-under-test` 成果物を再利用し、公開済み npm spec パスはスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージを含む専用の更新と Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージ成果物、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が、同じ解決済みパッケージ tarball 上に維持されます。SHA からビルドされた成果物の代わりに出荷済み npm パッケージに対して同じマトリックスを実行するには、Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定します。Cross-OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで実行ごとに 1 つの公開済みパッケージ baseline を検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済み baseline を選択します。デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはその baseline を保持します。`run_release_soak=true` または `release_profile=full` の Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の stable npm リリースに加えて、Plugin 互換性境界リリースを固定し、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係 root に関する issue 形状の fixture まで拡張します。複数 baseline の published-upgrade survivor 選択は、baseline ごとに別々の対象 Docker runner ジョブへ shard されます。別個の `Update Migration` ワークフローは、通常の Full Release CI の範囲ではなく、網羅的な公開済み更新クリーンアップが問いである場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` で `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すことも、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持することも、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` でシナリオマトリックスを設定することもできます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピで baseline を設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスを probe します。Windows packaged レーンと installer fresh レーンは、生の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI cross-OS agent-turn smoke は、`OPENCLAW_CROSS_OS_OPENAI_MODEL` が設定されている場合はそれをデフォルトにし、それ以外の場合は `openai/gpt-5.4` をデフォルトにします。そのため、インストールと Gateway の証明は GPT-5 テストモデル上に維持され、GPT-4.x のデフォルトを避けられます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリは、tarball から省略されたファイルを指していてもかまいません。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball 由来のフェイク git フィクスチャから存在しない `pnpm.patchedDependencies` を取り除くことができ、永続化された `update.channel` が存在しないことをログに出力できます。
- Plugin スモークは、レガシーのインストール記録場所を読み取るか、マーケットプレイスのインストール記録永続化が存在しないことを許容できます。
- `plugin-update` は、インストール記録と再インストールなしの動作が引き続き変わらないことを要求しつつ、設定メタデータの移行を許容できます。

公開済みの `2026.4.26` パッケージは、すでに出荷済みだったローカルビルドメタデータのスタンプファイルについても警告できます。それ以降のパッケージは最新のコントラクトを満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

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

失敗した package acceptance 実行をデバッグするときは、まず `resolve_package` サマリーでパッケージのソース、バージョン、SHA-256 を確認してください。次に、`docker_acceptance` の子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。リリース検証全体を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージ面、バンドル Plugin のパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 面に触れる pull request で実行されます。ソースのみのバンドル Plugin 変更、テストのみの編集、ドキュメントのみの編集は Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete 共有ワークスペース CLI スモークを実行し、コンテナ Gateway ネットワーク e2e を実行し、バンドル拡張のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で範囲限定のバンドル Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **フルパス** は、QR パッケージインストールとインストーラー Docker/更新カバレッジを、夜間のスケジュール実行、手動ディスパッチ、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker 面に実際に触れる pull request 向けに保持します。フルモードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル Plugin Docker E2E を別個のジョブとして実行するため、インストーラー作業はルートイメージスモークの後ろで待機しません。

`main` への push（merge commit を含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フルインストールスモークは夜間またはリリース検証に委ねます。

低速な Bun グローバルインストールの image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは opt-in できますが、pull request と `main` push では実行されません。QR とインストーラーの Docker テストは、それぞれインストールに特化した Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有のライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/Plugin 依存関係レーン用の最小 Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | プロバイダー依存のテールプールスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | プロバイダーが throttle しないようにする同時ライブレーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon の create storm を避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | カンマ区切りの正確なレーンリスト。エージェントが失敗した 1 つのレーンを再現できるよう、cleanup スモークをスキップします。 |

有効な上限より重いレーンでも、空のプールからは開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーンのステータスを出力し、最長優先の順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。`scripts/docker-e2e.mjs` はそのプランを GitHub 出力とサマリーに変換します。`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push し、再ビルドする代わりに指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに上限 180 秒のタイムアウトで再試行されるため、レジストリ/キャッシュストリームが詰まっても CI のクリティカルパスの大半を消費せずに素早く再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って、より小さいチャンクジョブとして実行されます。これにより各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は引き続き集約 Plugin/runtime エイリアスです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチの場合だけスタンドアロンの `openwebui` チャンクを維持します。バンドルチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグを 1 つの対象 Docker ジョブに限定し、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用できます。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されたレーンごとの GitHub 再実行コマンドには、該当する値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行と同じ正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済み live/E2E ワークフローは、release-path Docker スイート全体を毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、より高コストなプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常の pull request、`main` push、スタンドアロンの手動 CI ディスパッチでは、このスイートは無効のままです。8 つの拡張ワーカーにバンドル Plugin テストを分散します。これらの拡張シャードジョブは、Plugin 設定グループを一度に最大 2 つ実行し、グループごとに Vitest ワーカーを 1 つ使い、より大きな Node ヒープを使うため、import の重い Plugin バッチが余分な CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1〜3 分のジョブのために数十のランナーを予約することを避けるため、対象 Docker レーンを小さなグループにまとめます。

## QA Lab

QA Lab には、メインのスマートスコープ付きワークフローの外側に専用の CI レーンがあります。Agentic parity は広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。parity を広範な検証実行に乗せる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で毎晩、および手動ディスパッチで実行されます。mock parity レーン、live Matrix レーン、live Telegram と Discord レーンを並列ジョブとして fan out します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定論的なモックプロバイダーとモック指定モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram のライブトランスポートレーンを実行するため、チャンネル契約はライブモデルのレイテンシーや通常のプロバイダーPlugin起動から分離されます。ライブトランスポートGatewayはメモリ検索を無効にします。QAパリティがメモリの動作を別途カバーするためです。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Dockerプロバイダーのスイートでカバーされます。

Matrix は、スケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされたCLIが対応している場合にのみ `--fail-fast` を追加します。CLIのデフォルトと手動ワークフロー入力は引き続き `all` です。手動の `matrix_profile=all` ディスパッチは、常に Matrix の完全なカバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャーディングします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。そのQAパリティゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後、両方のアーティファクトを小さなレポートジョブにダウンロードして最終的なパリティ比較を行います。

通常のPRでは、パリティを必須ステータスとして扱うのではなく、スコープされたCI/チェックの証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリスイープではなく、意図的に絞り込まれた初回パスのセキュリティスキャナーです。日次、手動、非ドラフトのpull requestガード実行では、Actionsワークフローコードに加え、高/重大の `security-severity` に絞り込んだ高信頼度のセキュリティクエリで、最もリスクの高い JavaScript/TypeScript サーフェスをスキャンします。

pull requestガードは軽量なままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始し、スケジュール済みワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR のデフォルトから外れています。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、Gatewayベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加え、チャンネルPluginランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コアSSRF、IP解析、ネットワークガード、web-fetch、Plugin SDK のSSRFポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCPサーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Pluginインストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDKパッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済みの Android セキュリティシャード。ワークフローサニティで受け入れられる最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係ビルドの結果をアップロードする SARIF から除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置かれています。

### クリティカル品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。小さい Blacksmith Linux ランナー上で、絞り込まれた高価値サーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。そのpull requestガードは、スケジュール済みプロファイルより意図的に小さくなっています。非ドラフトPRでは、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IOコード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルとバンドルされたチャンネルPluginランタイム、Gatewayプロトコル/サーバーメソッド、メモリランタイム/SDK接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Pluginローダー、Plugin SDK/パッケージ契約、または Plugin SDK返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL設定と品質ワークフローの変更では、12個すべてのPR品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

絞り込まれたプロファイルは、1つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gatewayセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gatewayプロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルとバンドルされたチャンネルPluginの実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP制御プレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCPサーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホストSDK、メモリランタイムファサード、メモリPlugin SDKエイリアス、メモリランタイム有効化接着部、メモリdoctorコマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッションdoctor CLI契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDKインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embeddingレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロールUIブートストラップ、ローカル永続化、Gateway制御フロー、タスク制御プレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コアweb fetch/search、メディアIO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDKエントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースとPluginパッケージ契約ヘルパー                                                                                      |

品質はセキュリティとは分離されています。これにより、品質の検出結果をセキュリティ信号を曖昧にせずにスケジュール、計測、無効化、拡張できます。Swift、Python、バンドルされたPluginの CodeQL 拡張は、絞り込まれたプロファイルの実行時間と信号が安定した後でのみ、スコープ付きまたはシャーディングされたフォローアップ作業として戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、既存のドキュメントを最近マージされた変更と整合させ続けるための、イベント駆動型の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` へのbot以外のpushでCIが成功するとトリガーでき、手動ディスパッチで直接実行できます。Workflow-run呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去1時間以内に作成されている場合はスキップします。実行時には、前回スキップされなかった Docs Agent のソースSHAから現在の `main` までのコミット範囲をレビューするため、1時間ごとの1回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` へのbot以外のpushでCIが成功するとトリガーできますが、そのUTC日に別のworkflow-run呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には大規模なリファクターではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせます。その後、フルスイートレポートを再実行し、通過しているベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗のみを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に成功する必要があります。botのpushがマージされる前に `main` が進んだ場合、このレーンは検証済みパッチをrebaseし、`pnpm check:changed` を再実行してpushを再試行します。競合する古いパッチはスキップされます。Docs Agent と同じ drop-sudo の安全姿勢を Codex action が維持できるように、GitHubホストの Ubuntu を使用します。

### マージ後の重複PR

`Duplicate PRs After Merge` ワークフローは、マージ後の重複整理のための手動メンテナーワークフローです。デフォルトはdry-runで、`apply=true` の場合にのみ明示的に列挙されたPRをクローズします。GitHubを変更する前に、マージ済みPRがマージされていること、そして各重複PRに共有の参照Issueまたは重複する変更ハンクがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルのchanged-laneロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範なCIプラットフォームスコープよりもアーキテクチャ境界について厳格です。

- core のプロダクション変更では、core prod と core test の型チェックに加えて core lint/guards を実行する;
- core のテストのみの変更では、core test の型チェックに加えて core lint のみを実行する;
- extension のプロダクション変更では、extension prod と extension test の型チェックに加えて extension lint を実行する;
- extension のテストのみの変更では、extension test の型チェックに加えて extension lint を実行する;
- 公開 Plugin SDK または plugin-contract の変更では、extension がそれらの core contract に依存しているため、extension の型チェックまで拡張される（Vitest の extension sweep は明示的なテスト作業のまま）;
- リリースメタデータのみのバージョン更新では、対象を絞った version/config/root-dependency チェックを実行する;
- 不明な root/config 変更では、安全側に倒してすべてのチェックレーンを実行する。

ローカルの変更テストのルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストになっている。直接のテスト編集ではそのテスト自体を実行し、ソース編集では明示的なマッピングを優先し、その後に兄弟テストと import-graph の依存先を実行する。共有グループルーム配信設定は明示的なマッピングの 1 つである。グループの visible-reply 設定、ソース返信配信モード、または message-tool system prompt を変更すると、core reply tests に加えて Discord と Slack の配信リグレッションを通るため、共有デフォルトの変更は最初の PR push 前に失敗する。変更がハーネス全体に及ぶため、低コストのマップ済みセットを信頼できる代理として使えない場合に限り、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用する。

## Testbox 検証

Testbox はリポジトリルートから実行し、広範な証明には新しくウォーム済みの box を優先する。再利用された、期限切れになった、または想定外に大きな同期を報告した box で時間のかかるゲートを使う前に、まず box 内で `pnpm testbox:sanity` を実行する。

sanity check は、`pnpm-lock.yaml` などの必須 root ファイルが消えている場合や、`git status --short` が少なくとも 200 件の追跡済み削除を示す場合に高速に失敗する。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味する。製品テストの失敗をデバッグするのではなく、その box を停止して新しいものをウォームする。意図的な大量削除 PR の場合、その sanity 実行では `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定する。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了する。そのガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル差分にはより大きなミリ秒値を使用する。

Crabbox は、メンテナーの Linux 証明用にリポジトリが所有する remote-box ラッパーである。チェックがローカル編集ループには広すぎる場合、CI パリティが重要な場合、または証明にシークレット、Docker、package lanes、再利用可能な box、リモートログが必要な場合に使用する。通常の OpenClaw バックエンドは `blacksmith-testbox` である。所有 AWS/Hetzner キャパシティは、Blacksmith 障害、クォータ問題、または明示的な所有キャパシティテストのフォールバックである。

初回実行前に、リポジトリルートからラッパーを確認する:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を広告しない古い Crabbox バイナリを拒否する。`.crabbox.yaml` に owned-cloud のデフォルトがあっても、プロバイダーを明示的に渡す。

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

フォーカスしたテスト再実行:

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

最後の JSON サマリーを読む。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` である。1 回限りの Blacksmith-backed Crabbox 実行では、Testbox が自動的に停止するはずである。実行が中断された、またはクリーンアップが不明な場合は、稼働中の box を調べ、自分が作成した box のみを停止する:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydrated box 上で複数コマンドが意図的に必要な場合に限り、再利用を使う:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox のレイヤーが壊れているが Blacksmith 自体は動作する場合は、限定的なフォールバックとして直接 Blacksmith を使用する:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しい warmup が数分たっても IP や Actions run URL なしで `queued` のままの場合は、Blacksmith のプロバイダー、キュー、請求、または組織制限の圧迫として扱う。自分が作成した queued id を停止し、それ以上 Testbox を起動せず、誰かが Blacksmith dashboard、請求、組織制限を確認している間は、下記の owned Crabbox capacity パスへ証明を移す。

Blacksmith が停止している、クォータ制限がある、必要な環境が欠けている、または所有キャパシティ自体が明示的な目的である場合に限り、owned Crabbox capacity へエスカレーションする:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS の圧迫下では、タスクが本当に 48xlarge-class CPU を必要としない限り `class=beast` は避ける。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も触れやすい。リポジトリ所有の `.crabbox.yaml` はデフォルトで `standard`、複数のキャパシティリージョン、`capacity.hints: true` を使用するため、仲介された AWS lease では、選択された region/market、クォータ圧迫、Spot フォールバック、高圧クラス警告が出力される。より重い広範なチェックには `fast` を使い、standard/fast では不十分な場合にのみ `large` を使い、`beast` はフルスイートや全 Plugin Docker マトリクス、明示的な release/blocker 検証、高コア性能プロファイリングなど、CPU bound な例外的レーンに限って使用する。`pnpm check:changed`、フォーカスしたテスト、docs のみの作業、通常の lint/typecheck、小規模 E2E 再現、Blacksmith 障害トリアージには `beast` を使用しない。キャパシティ診断には `--market on-demand` を使用し、Spot market の変動をシグナルに混ぜない。

`.crabbox.yaml` は owned-cloud lanes の provider、sync、GitHub Actions hydration デフォルトを所有する。これはローカル `.git` を除外するため、hydrated Actions checkout はメンテナーのローカル remote や object store を同期する代わりに、自身のリモート Git メタデータを維持する。また、転送すべきでないローカル runtime/build artifacts も除外する。`.github/workflows/crabbox-hydrate.yml` は、checkout、Node/pnpm setup、`origin/main` fetch、owned-cloud の `crabbox run --id <cbx_id>` コマンド向けの非シークレット環境引き渡しを所有する。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
