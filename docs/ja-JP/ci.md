---
read_when:
    - CIジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions のチェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CIジョブグラフ、スコープゲート、リリース包括ジョブ、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-02T23:39:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは diff を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープを迂回し、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは別個の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                             | 実行タイミング                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions を検出し、CI マニフェストをビルドする                             | draft ではない push と PR で常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                               | draft ではない push と PR で常に |
| `security-dependency-audit`      | npm advisory に対する、依存関係を使わない本番 lockfile 監査                                                    | draft ではない push と PR で常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                                       | draft ではない push と PR で常に |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと、未使用ファイル allowlist ガード                                           | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み成果物チェック、再利用可能な下流成果物をビルドする                                 | Node 関連の変更              |
| `checks-fast-core`               | バンドル済み/Plugin contract/protocol チェックなどの高速 Linux 正当性レーン                                        | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化された channel contract チェック                                                | Node 関連の変更              |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く、Core Node テストシャード                                    | Node 関連の変更              |
| `check`                          | シャード化されたメインのローカルゲート相当: prod types、lint、guards、test types、strict smoke                          | Node 関連の変更              |
| `check-additional`               | architecture、boundary、prompt snapshot drift、extension-surface guards、package-boundary、gateway-watch シャード | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI の smoke テストと startup-memory smoke                                                                      | Node 関連の変更              |
| `checks`                         | ビルド済み成果物 channel テストの verifier                                                                           | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                          | リリース用の手動 CI ディスパッチ    |
| `check-docs`                     | docs のフォーマット、lint、リンク切れチェック                                                                       | docs が変更された場合                       |
| `skills-python`                  | Python バックエンドの Skills 向け Ruff + pytest                                                                              | Python-skill 関連の変更      |
| `checks-windows`                 | Windows 固有の process/path テストと、共有 runtime import specifier の回帰                                | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済み成果物を使う macOS TypeScript テストレーン                                                         | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリの Swift lint、ビルド、テスト                                                                      | macOS 関連の変更             |
| `android`                        | 両方の flavor の Android unit テストと 1 つの debug APK ビルド                                                        | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の毎日の Codex 低速テスト最適化                                                           | メイン CI 成功または手動ディスパッチ |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む、毎日/オンデマンドの Kova runtime パフォーマンスレポート           | スケジュール実行と手動ディスパッチ      |

## フェイルファスト順序

1. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブとプラットフォームマトリックスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームと runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗しているのでない限り、これは CI ノイズとして扱います。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI の concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側 zombie が新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使い、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動ディスパッチは changed-scope 検出をスキップし、preflight マニフェストを、スコープ対象領域がすべて変更されたかのように動作させます。

- **CI ワークフローの編集**は Node CI グラフとワークフロー lint を検証しますが、それだけで Windows、Android、macOS native build を強制することはありません。これらのプラットフォームレーンは、プラットフォームソース変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された低コストな core-test fixture 編集、狭い Plugin contract helper/test-routing 編集**は、高速 Node のみのマニフェストパスを使います: `preflight`、security、単一の `checks-fast-core` task です。このパスは、変更が fast task が直接実行する routing または helper surface に限定される場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は Windows 固有の process/path wrappers、npm/pnpm/UI runner helpers、package manager config、そのレーンを実行する CI workflow surface にスコープされます。無関係な source、plugin、install-smoke、test-only 変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブを小さく保ち、runner を過剰予約しないように分割またはバランス調整されています。channel contracts は 3 つの weighted shard として実行され、small core unit lanes はペア化され、auto-reply は 4 つの balanced workers として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing shards に分割）。agentic gateway/plugin configs は、ビルド済み成果物を待つのではなく、既存の source-only agentic Node jobs 全体に分散されます。広範な browser、QA、media、miscellaneous plugin tests は、共有 plugin catch-all ではなく専用の Vitest configs を使います。include-pattern shards は CI shard name を使って timing entries を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary work をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard shard は、小さな独立 guard を 1 つのジョブ内で並行実行し、`pnpm prompt:snapshots:check` も含めることで、Codex runtime の happy-path prompt drift がそれを引き起こした PR に固定されます。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig flags 付きで flavor をコンパイルしますが、Android 関連のすべての push で重複する debug APK packaging job は避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（最新の Knip version に固定された本番 Knip dependency-only pass で、`dlx` install のために pnpm の minimum release age を無効化）と `pnpm deadcode:unused-files` を実行します。後者は、Knip の本番 unused-file findings を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの unused file を追加した場合や stale allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な dynamic plugin、generated、build、live-test、package bridge surfaces は維持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw repository activity から ClawSweeper への target-side bridge です。信頼されていない pull request code を check out したり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、compact な `repository_dispatch` payloads を `openclaw/clawsweeper` に dispatch します。

この workflow には 4 つのレーンがあります。

- exact issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper commands 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が inspect する可能性のある一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは正規化済み metadata のみを転送します: event type、action、actor、repository、item number、URL、title、state、存在する場合は comments または reviews の short excerpts です。完全な Webhook body は意図的に転送しません。`openclaw/clawsweeper` 内の受信 workflow は `.github/workflows/github-activity.yml` で、正規化済み event を ClawSweeper agent 用の OpenClaw Gateway hook に post します。

一般アクティビティは observation であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が surprising、actionable、risky、または operationally useful な場合にのみ `#clawsweeper` に post するべきです。通常の open、edit、bot churn、重複 Webhook noise、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub titles、comments、bodies、review text、branch names、commit messages は信頼されていないデータとして扱います。これらは summarization と triage の入力であり、workflow や agent runtime への指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的に有効にします: Linux Node シャード、同梱 Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。完全リリースのアンブレラは `include_android=true` を渡して Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な extension バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合のみ実行されます。

手動実行は一意の並行実行グループを使用するため、リリース候補のフルスイートが、同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼済みの呼び出し元は、選択したディスパッチ ref のワークフローファイルを使用しながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約 (`security-scm-fast`、`security-dependency-audit`、`security-fast`)、高速プロトコル/契約/同梱チェック、シャード化されたチャネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、docs チェック、Python skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使用するため、Blacksmith マトリクスをより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な extension シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、同梱 Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (8 vCPU では削減できた分よりコストが高くなるほど CPU に敏感)。install-smoke Docker ビルド (32-vCPU のキュー時間コストが削減分を上回った)                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                |

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

## OpenClaw Performance

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

このワークフローは固定されたリリースから OCM を、固定された `kova_ref` 入力から Kova をインストールし、次の 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を備えたローカルビルドのランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは Kova パスの後に OpenClaw ネイティブのソースプローブも実行します: デフォルト、hook、50-Plugin 起動ケースでの Gateway 起動時間とメモリ、繰り返しのモック OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンド。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON がその横に配置されます。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` 以下にコミットします。現在のブランチポインターは `openclaw-performance/<ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker release-path スイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。`rerun_group=all` と `release_profile=full` の場合は、release checks の `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡して、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行します。

ステージマトリクス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、フォーカスされた再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチしてから、保存された `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

高速に進むブランチで固定コミットの証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが異なる SHA で実行された場合に失敗します。

`release_profile` は release checks に渡される live/provider の幅を制御します。手動リリースワークフローのデフォルトは `stable` です。広範なアドバイザリ provider/media マトリクスを意図的に実行したい場合のみ `full` を使用してください。

- `minimum` は最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は安定版 provider/backend セットを追加します。
- `full` は広範なアドバイザリ provider/media マトリクスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブが現在の子実行の結論を再チェックして、各子実行の最も遅いジョブのテーブルを追記します。子ワークフローが再実行されて成功になった場合は、アンブレラの結果とタイミングサマリーを更新するために、親検証ジョブのみを再実行してください。

復旧では、`Full Release Validation` と `OpenClaw Release Checks` の両方が `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子ワークフローだけには `ci`、Plugin プレリリース子ワークフローだけには `plugin-prerelease`、すべてのリリース子ワークフローには `release-checks`、またはアンブレラ上でより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正後に失敗したリリースボックスの再実行範囲を限定できます。

`OpenClaw Release Checks` は信頼済みワークフロー ref を使って、選択した ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトを live/E2E リリースパス Docker ワークフローとパッケージ受け入れ shard の両方に渡します。これにより、リリースボックス間でパッケージのバイト列を一貫させ、複数の子ジョブで同じ候補を再パックすることを避けられます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは親がキャンセルされたとき、すでにディスパッチした子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間の release-check 実行の後ろで待機することはありません。リリースブランチ/タグ検証と、焦点を絞った再実行グループでは `cancel-in-progress: false` を維持します。

## Live と E2E shard

リリース live/E2E 子ワークフローは、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- プロバイダーで絞り込まれた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声/動画 shard と、プロバイダーで絞り込まれた音楽 shard

これにより、同じファイルカバレッジを維持しながら、遅い live プロバイダーの失敗を再実行および診断しやすくします。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` shard 名は、手動の一括再実行でも引き続き有効です。

ネイティブ live メディア shard は、`Live Media Runner Image` ワークフローでビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされており、メディアジョブはセットアップ前にバイナリだけを検証します。Docker ベースの live スイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストされた Docker テストを起動する場所として不適切です。

Docker ベースの live モデル/バックエンド shard は、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。live リリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker live モデル、プロバイダー別 gateway、CLI バックエンド、ACP bind、Codex harness shard が `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker shard には、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップパスが停止しても、リリースチェック予算全体を消費せずに早く失敗します。これらの shard が完全なソース Docker ターゲットを個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドで実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」が問題である場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、ユーザーがインストールまたは更新後に実行するものと同じ Docker E2E harness を通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` アーティファクトとしてアップロードし、ソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを GitHub ステップサマリーに出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker lane を実行します。プロファイルが複数のターゲット指定 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、その後それらの lane を一意のアーティファクトを持つ並列ターゲット指定 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance が 1 つを解決済みであれば同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、引き続き公開済み npm spec をインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram lane が失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンだけを受け付けます。公開済みプレリリース/安定版の受け入れに使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを fetch し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離された worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトには指定するべきです。

`workflow_ref` と `package_ref` は分けて維持してください。`workflow_ref` はテストを実行する信頼済みワークフロー/harness コードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテスト harness が古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証は live ClawHub の可用性に左右されません。任意の Telegram lane は `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec パスはスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker lane、Package Acceptance 入力、リリースデフォルト、失敗時のトリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージマイグレーション、更新、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram の証明を、同じ解決済みパッケージ tarball 上に維持します。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA からビルドされたアーティファクトの代わりに、出荷済み npm パッケージに対して同じマトリックスを実行できます。Cross-OS リリースチェックは、引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker lane は、実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` がフォールバック用の公開済みベースラインを選択し、デフォルトは `openclaw@latest` です。失敗した lane の再実行コマンドはそのベースラインを保持します。`published_upgrade_survivor_baselines=all-since-2026.4.23` を設定すると、Full Release CI が `2026.4.23` から `latest` までのすべての安定版 npm リリースに拡張されます。`release-history` は、古い日付前アンカーを使った手動のより広いサンプリング用に引き続き利用できます。`published_upgrade_survivor_scenarios=reported-issues` を設定すると、同じベースラインが、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに関する issue 形状の fixture に拡張されます。別の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、公開済み更新クリーンアップを網羅的に確認したい場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定した `update-migration` Docker lane を使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡したり、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一 lane を維持したり、シナリオマトリックス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定したりできます。公開済み lane は、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC status を調べます。Windows のパッケージ版およびインストーラーの fresh lane は、インストール済みパッケージが raw の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI cross-OS agent-turn smoke は、設定されていればデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使い、そうでなければ `openai/gpt-5.4` を使うため、インストールと gateway の証明は GPT-4.x のデフォルトを避けながら GPT-5 テストモデル上に維持されます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の private QA entries は、tarball から省略されたファイルを指している場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の fake git fixture から欠落した `pnpm.patchedDependencies` を削除する場合があり、永続化された `update.channel` の欠落をログに記録する場合があります。
- Plugin smoke は、レガシーの install-record 場所を読む場合や、marketplace install-record 永続化の欠落を許容する場合があります。
- `plugin-update` は、install record と no-reinstall 動作が変わらず維持されることを引き続き要求しながら、設定メタデータマイグレーションを許容する場合があります。

公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータスタンプファイルについても警告する場合があります。それ以降のパッケージは現代的な契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調査します: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージ面、バンドル Plugin パッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 面に触れるプルリクエストで実行されます。ソースのみのバンドル Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete shared-workspace CLI スモークを実行し、コンテナ gateway-network e2e を実行し、バンドル拡張機能のビルド引数を検証し、240 秒の集約コマンドタイムアウトの下で境界付きバンドル Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **完全パス**は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、および本当にインストーラー/パッケージ/Docker 面に触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/update カバレッジを保持します。完全モードでは、install-smoke は target-SHA GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/update スモーク、高速バンドル Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待つことはありません。

`main` プッシュ（マージコミットを含む）は完全パスを強制しません。変更スコープロジックがプッシュで完全カバレッジを要求する場合、ワークフローは高速 Docker スモークを保持し、完全インストールスモークは夜間またはリリース検証に委ねます。

遅い Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは任意で有効化できますが、プルリクエストと `main` プッシュでは実行されません。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/update/Plugin 依存レーン用の素の Node/Git ランナー。
- 通常機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用メインプールのスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットルしないようにする同時 live レーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。ずらしをなくすには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーン一覧。クリーンアップスモークをスキップし、agents が 1 つの失敗レーンを再現できるようにします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前確認し、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプールレーンのスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、どのパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在実行中のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュします。また、再ビルドする代わりに、提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに 180 秒の有界タイムアウトで再試行されるため、停止した registry/cache ストリームが CI のクリティカルパスの大半を消費せずに素早く再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` で小さなチャンク化ジョブを実行し、各チャンクが必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンに対する集約手動再実行エイリアスのままです。

OpenWebUI は、完全な release-path カバレッジが要求する場合は `plugins-runtime-services` に含まれ、OpenWebUI のみのディスパッチの場合だけスタンドアロンの `openwebui` チャンクを保持します。バンドルチャンネル update レーンは、一時的な npm ネットワーク失敗に対して一度再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、遅いレーンのテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは 1 つのターゲット Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、ターゲットジョブはその再実行用に live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E ワークフローは、完全な release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジなので、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` プッシュ、単独の手動 CI ディスパッチでは、このスイートをオフのままにします。バンドル Plugin テストを 8 つの拡張機能ワーカーに分散します。これらの拡張機能シャードジョブは、Plugin 設定グループを一度に最大 2 つ実行し、グループごとに 1 つの Vitest ワーカーと大きめの Node ヒープを使うため、import が重い Plugin バッチで追加の CI ジョブが作成されません。リリース専用 Docker プレリリースパスは、1 分から 3 分のジョブのために数十個のランナーを予約しないように、ターゲット Docker レーンを小さなグループにバッチ化します。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外側に専用の CI レーンがあります。エージェントパリティは広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。パリティを広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使います。

- `QA-Lab - All Lanes` ワークフローは `main` で夜間および手動ディスパッチ時に実行されます。モックパリティレーン、live Matrix レーン、live Telegram と Discord レーンを並列ジョブとして展開します。live ジョブは `qa-live-shared` 環境を使い、Telegram/Discord は Convex リースを使います。

リリースチェックは、決定論的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram の live トランスポートレーンを実行し、チャンネル契約を live モデル遅延と通常の provider-plugin 起動から分離します。live トランスポート Gateway はメモリ検索を無効化します。これは QA パリティがメモリ動作を別途カバーするためです。プロバイダー接続性は、別個の live モデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュールゲートとリリースゲートで `--profile fast` を使い、チェックアウトされた CLI がサポートする場合のみ `--fail-fast` を追加します。CLI デフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャード化します。

`OpenClaw Release Checks` も、リリース承認前にリリースクリティカルな QA Lab レーンを実行します。その QA パリティゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後両方のアーティファクトを小さなレポートジョブにダウンロードして最終的なパリティ比較を行います。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープされた CI/チェック証拠に従います。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリ全体のスイープではなく、意図的に狭い初回パスのセキュリティスキャナーです。日次、手動、非ドラフトのプルリクエストガードの実行では、Actions ワークフローコードに加えて、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルターされた高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始され、スケジュールされたワークフローと同じ高信頼度のセキュリティマトリクスを実行します。Android と macOS の CodeQL は、PR のデフォルト対象外のままです。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加え、チャンネル plugin ランタイム、gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK の SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー健全性で許可される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係のビルド結果をアップロード対象の SARIF から除外して、`/codeql-critical-security/macos` 配下にアップロードします。macOS ビルドはクリーンな場合でも実行時間の大半を占めるため、日次のデフォルト対象外に保たれています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。小さめの Blacksmith Linux ランナー上で、狭く高価値なサーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリだけを実行します。そのプルリクエストガードは、スケジュールされたプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行および返信ディスパッチコード、config スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルおよび同梱チャンネル plugin ランタイム、gateway protocol/server-method、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードだけを実行します。CodeQL config と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config スキーマ、マイグレーション、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルと同梱チャンネル plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、gateway 制御フロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティと分離されています。これにより、品質の検出結果を、セキュリティシグナルを不明瞭にすることなく、スケジュール、測定、無効化、または拡張できます。Swift、Python、同梱 plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、スコープ付きまたはシャード化された後続作業として戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。workflow-run 呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーできますが、その UTC 日に別の workflow-run 呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートを迂回します。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には大規模なリファクターではなく、カバレッジを維持する小さなテスト性能修正だけを行わせます。その後、フルスイートレポートを再実行し、通過ベースラインのテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex が修正できるのは明らかな失敗だけで、エージェント後のフルスイートレポートはコミット前に通過している必要があります。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo の安全姿勢を保てるよう、GitHub-hosted Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複整理のための手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に共有された参照 issue または重複する変更 hunk があることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと changed ルーティング

ローカル changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広い CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア prod とコア test の typecheck に加えて、コア lint/guards を実行します。
- コアのテストのみの変更は、コア test typecheck に加えてコア lint のみを実行します。
- 拡張本番変更は、拡張 prod と拡張 test の typecheck に加えて、拡張 lint を実行します。
- 拡張のテストのみの変更は、拡張 test typecheck に加えて拡張 lint を実行します。
- 公開 Plugin SDK または plugin-contract の変更は、拡張がそれらのコア契約に依存しているため、拡張 typecheck に拡大します（Vitest 拡張スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョンバンプは、対象を絞った version/config/root-dependency チェックを実行します。
- 不明な root/config 変更は安全側に倒し、すべてのチェックレーンを対象にします。

ローカル changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、`check:changed` より意図的に低コストです。直接のテスト編集はそのテスト自身を実行し、ソース編集は明示的なマッピングを優先し、その後に sibling テストと import-graph 依存先を使います。共有 group-room 配信 config は、明示的なマッピングの 1 つです。group visible-reply config、source reply delivery mode、または message-tool system prompt の変更は、コア返信テストに加えて Discord と Slack の配信回帰を経由するため、共有デフォルト変更は最初の PR push の前に失敗します。変更がハーネス全体に及ぶため、安価なマッピング済みセットを信頼できる代替と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

リポジトリルートから Testbox を実行し、広範な検証には新しくウォーム済みのボックスを優先してください。再利用された、期限切れになった、または予想外に大きな同期を報告したばかりのボックスで時間のかかるゲートを実行する前に、まずボックス内で `pnpm testbox:sanity` を実行してください。

このサニティチェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えている場合や、`git status --short` が少なくとも 200 件の追跡済み削除を示す場合に即座に失敗します。通常これは、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、そのボックスを停止して新しいものをウォームしてください。意図的な大量削除 PR では、そのサニティ実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

`pnpm testbox:run` は、同期後の出力がないまま 5 分を超えて同期フェーズに留まるローカルの Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定するか、通常より大きいローカル差分にはより大きなミリ秒値を使用してください。

Crabbox は、Blacksmith が利用できない場合や所有するクラウド容量が望ましい場合に Linux 検証で使う、リポジトリ所有の第 2 のリモートボックス経路です。ボックスをウォームし、プロジェクトワークフローを通じてハイドレートしてから、Crabbox CLI でコマンドを実行します。

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` は、プロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを管理します。これはローカルの `.git` を除外するため、ハイドレートされた Actions チェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期するのではなく、自身のリモート Git メタデータを保持します。また、転送されるべきではないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm セットアップ、`origin/main` のフェッチ、そして後続の `crabbox run --id <cbx_id>` コマンドが読み込む非シークレット環境の引き渡しを管理します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
