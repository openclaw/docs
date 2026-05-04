---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しています
summary: CI ジョブグラフ、スコープゲート、リリース包括、対応するローカルコマンド
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-04T04:58:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。`preflight` ジョブは差分を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は意図的にスマートスコープをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは別個の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs-only 変更、変更スコープ、変更された拡張、CI マニフェストのビルドを検出する                   | 非ドラフトのプッシュと PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | 非ドラフトのプッシュと PR では常に |
| `security-dependency-audit`      | npm アドバイザリに対する依存関係不要の本番 lockfile 監査                                          | 非ドラフトのプッシュと PR では常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | 非ドラフトのプッシュと PR では常に |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルドする                       | Node 関連の変更              |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を伴うシャード化されたチャンネル契約チェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | チャンネル、バンドル、契約、拡張レーンを除く Core Node テストシャード                          | Node 関連の変更              |
| `check`                          | シャード化されたメインローカルゲート相当: 本番型、lint、ガード、テスト型、厳格な smoke                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、シャード化された境界/プロンプトドリフト、拡張ガード、パッケージ境界、gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                                            | Node 関連の変更              |
| `checks`                         | ビルド済みアーティファクトのチャンネルテストの検証                                                            | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                                | リリース用の手動 CI ディスパッチ    |
| `check-docs`                     | ドキュメントのフォーマット、lint、壊れたリンクのチェック                                                             | ドキュメント変更                       |
| `skills-python`                  | Python backed skills 向けの Ruff + pytest                                                                    | Python skill 関連の変更      |
| `checks-windows`                 | Windows 固有のプロセス/パステストと共有ランタイム import specifier 回帰                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済みアーティファクトを使用する macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリ向けの Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方のフレーバーの Android ユニットテストと 1 つの debug APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                 | Main CI 成功または手動ディスパッチ |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 live レーンを含む日次/オンデマンド Kova ランタイムパフォーマンスレポート | スケジュールおよび手動ディスパッチ      |

## フェイルファスト順序

1. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトおよびプラットフォームマトリックスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しいプッシュが入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗しているのでない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに追加されません。自動 CI の concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループにある GitHub 側のゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチは changed-scope 検出をスキップし、preflight マニフェストをすべてのスコープ対象領域が変更されたかのように動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それ自体では Windows、Android、macOS ネイティブビルドを強制しません。これらのプラットフォームレーンはプラットフォームソース変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された安価な core-test fixture 編集、狭い plugin contract helper/test-routing 編集** は高速な Node のみのマニフェストパスを使用します: `preflight`、security、単一の `checks-fast-core` タスクです。このパスは、変更が高速タスクが直接実行するルーティングまたは helper surface に限定されている場合、ビルドアーティファクト、Node 22 互換性、チャンネル契約、完全な core シャード、bundled-plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI runner helper、パッケージマネージャ設定、そのレーンを実行する CI ワークフロー surface にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに留まります。

最も遅い Node テストファミリーは、各ジョブが小さく保たれ、ランナーを過剰に予約しないよう分割またはバランス調整されています。チャンネル契約は 3 つの重み付きシャードとして実行され、core unit fast/support レーンは別々に実行され、core runtime infra は state と process/config シャードに分割され、auto-reply はバランス調整された worker として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/server config はビルド済みアーティファクトを待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されます。広範な browser、QA、media、その他の Plugin テストは共有 Plugin catch-all ではなく専用の Vitest config を使用します。include-pattern シャードは CI シャード名を使用してタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、ランタイムトポロジーアーキテクチャを gateway watch カバレッジから分離します。境界ガードリストは 4 つのマトリックスシャードにストライプされ、各シャードは選択された独立ガードを並行実行し、`pnpm prompt:snapshots:check` を含む各チェックのタイミングを出力します。これにより、Codex ランタイムの happy-path プロンプトドリフトはそれを引き起こした PR に固定されます。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには独立した source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きでフレーバーをコンパイルしつつ、Android 関連の各プッシュで重複した debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定された本番 Knip の依存関係のみのパスで、`dlx` インストール時は pnpm の minimum release age が無効）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file ガードは、PR が新しい未レビューの未使用ファイルを追加した場合や古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、generated、build、live-test、package bridge surface は維持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡すターゲット側ブリッジです。信頼されていないプルリクエストコードの checkout や実行は行いません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、compact な `repository_dispatch` payload を `openclaw/clawsweeper` にディスパッチします。

このワークフローには 4 つのレーンがあります。

- `clawsweeper_item` は正確な issue および pull request review request 用。
- `clawsweeper_comment` は issue comment 内の明示的な ClawSweeper コマンド用。
- `clawsweeper_commit_review` は `main` プッシュ上の commit-level review request 用。
- `github_activity` は ClawSweeper agent が調査する可能性がある一般的な GitHub アクティビティ用。

`github_activity` レーンは正規化されたメタデータのみを転送します: event type、action、actor、repository、item number、URL、title、state、および存在する場合は comment または review の短い excerpt です。意図的に Webhook 本文全体の転送は避けています。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的なアクティビティは観察であり、デフォルト配信ではありません。ClawSweeper agent はプロンプト内で Discord ターゲットを受け取り、そのイベントが意外で、対応可能で、リスクがあり、または運用上有用な場合にのみ `#clawsweeper` に投稿すべきです。通常の open、edit、bot churn、重複 Webhook ノイズ、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub の title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローや agent runtime への指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル済み Plugin シャード、チャンネルコントラクト、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは、`include_android=true` の場合のみ Android を実行します。完全リリースの包括ワークフローは `include_android=true` を渡すことで Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な extension バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の同時実行グループを使うため、リリース候補のフルスイートが同じ ref 上の別の push または PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力を使うと、信頼済みの呼び出し元が、選択されたディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/コントラクト/バンドル済みチェック、シャード化されたチャンネルコントラクトチェック、lint 以外の `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、docs チェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリックスをより早くキューに入れられます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な extension シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル済み Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 感度が高く、8 vCPU は節約できた以上にコストがかかったため）。install-smoke Docker ビルド（32-vCPU のキュー時間が節約できた以上にコストがかかったため）                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork は `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork は `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                   |

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

## OpenClaw Performance

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象の ref でキー付けされ、各 `index.md` にはテスト対象の ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

このワークフローは固定されたリリースから OCM を、`openclaw/Kova` から固定された `kova_ref` 入力の Kova をインストールし、その後 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を持つローカルビルドのランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: startup、Gateway、agent-turn ホットスポットの CPU/heap/trace プロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは Kova パスの後に OpenClaw ネイティブのソースプローブも実行します: デフォルト、hook、50-Plugin 起動ケースでの Gateway 起動タイミングとメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、未加工 JSON がその横に置かれます。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下の `openclaw/clawgrit-reports` にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動包括ワークフローです。ブランチ、タグ、または完全な commit SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。`rerun_group=all` と `release_profile=full` の場合、release checks の `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は `npm_telegram_package_spec` を渡して、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行します。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、対象を絞った再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を加える手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後でのみ保存された `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチ上で固定 commit 証明を得るには、`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使います:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生の commit SHA ではいけません。このヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行が完了したら一時ブランチを削除します。包括検証器は、いずれかの子ワークフローが異なる SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡すライブ/プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な助言的プロバイダー/メディアマトリクスを意図的に使いたい場合にのみ `full` を使用してください。

- `minimum` は、最速の OpenAI/コアのリリースクリティカルなレーンに絞ります。
- `stable` は、安定版のプロバイダー/バックエンドセットを追加します。
- `full` は、広範な助言的プロバイダー/メディアマトリクスを実行します。

アンブレラはディスパッチした子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再確認し、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、親検証ジョブだけを再実行して、アンブレラの結果とタイミング要約を更新してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子だけには `ci`、Plugin プレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはアンブレラ上のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、集中修正後の失敗したリリースボックスの再実行を限定できます。

`OpenClaw Release Checks` は、信頼済みワークフロー参照を使って選択された参照を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをライブ/E2E リリースパスの Docker ワークフローとパッケージ受け入れシャードの両方に渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、複数の子ジョブで同じ候補を再パックすることを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機し続けることはありません。リリースブランチ/タグ検証と絞り込んだ再実行グループは `cancel-in-progress: false` を維持します。

## ライブと E2E シャード

リリースのライブ/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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

これにより、同じファイルカバレッジを維持しながら、遅いライブプロバイダーの失敗を再実行し、診断しやすくします。集約用の `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の一回限りの再実行でも引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリを検証するだけです。Docker バックのライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブは、ネストされた Docker テストを起動する場所としては不適切です。

Docker バックのライブモデル/バックエンドシャードは、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー分割 Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、停止したコンテナやクリーンアップパスがリリースチェック予算全体を消費せず、早く失敗するようにしています。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は誤設定されており、重複したイメージビルドで実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いには、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、ユーザーがインストールまたは更新後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップ要約にソース、ワークフロー参照、パッケージ参照、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` ではない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みプレリリース/安定版の受け入れに使用します。
- `source=ref` は、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離されたワークツリーに依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は、`source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` のときに必須です

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec パスはスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` とともに、`source=artifact` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram の証明を、同じ解決済みパッケージ tarball 上に維持できます。Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定すると、SHA からビルドされたアーティファクトの代わりに、出荷済み npm パッケージに対して同じマトリクスを実行できます。クロス OS リリースチェックは引き続き、OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から開始するべきです。`published-upgrade-survivor` Docker レーンは、実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択し、デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`published_upgrade_survivor_baselines=all-since-2026.4.23` を設定すると、Full Release CI が `2026.4.23` から `latest` までのすべての安定版 npm リリースに拡張されます。`release-history` は、古い日付前アンカーを使った手動のより広いサンプリング用に引き続き利用できます。`published_upgrade_survivor_scenarios=reported-issues` を設定すると、同じベースラインが、Feishu 設定、保持されたブートストラップ/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに関する issue 形状のフィクスチャ全体に拡張されます。別個の `Update Migration` ワークフローは、通常の Full Release CI の範囲ではなく、公開済み更新クリーンアップを網羅的に確認する問いに対して、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定した `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すことも、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で `openclaw@2026.4.15` のような単一レーンを維持することも、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` でシナリオマトリクスを設定することもできます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows パッケージ済みレーンとインストーラー新規レーンも、インストール済みパッケージが生の絶対 Windows パスからブラウザー制御オーバーライドをインポートできることを検証します。OpenAI クロス OS エージェントターン smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL`、それ以外の場合は `openai/gpt-5.4` をデフォルトにします。これにより、インストールと Gateway の証明を GPT-5 テストモデル上に維持しつつ、GPT-4.x デフォルトを避けられます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリは、tarball から省略されたファイルを指していてもかまいません。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball 由来の偽 git フィクスチャから欠落している `pnpm.patchedDependencies` を取り除いてもよく、永続化された `update.channel` の欠落をログに出してもかまいません。
- Plugin smoke は、レガシーインストール記録の場所を読み取ったり、マーケットプレイスインストール記録の永続化欠落を許容したりできます。
- `plugin-update` は、インストール記録と再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許可できます。

公開済みの `2026.4.26` パッケージでも、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告を出してもかまいません。それ以降のパッケージは現代的な契約を満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージ面、バンドル済み Plugin パッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャネル/Gateway/Plugin SDK 面に触れるプルリクエストで実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、ドキュメントのみの編集は Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete 共有ワークスペース CLI スモークを実行し、コンテナ gateway-network e2e を実行し、バンドル済み拡張機能のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きバンドル済み Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **完全パス** は、毎晩のスケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そしてインストーラー/パッケージ/Docker 面に実際に触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/更新カバレッジを保持します。完全モードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル済み Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）は完全パスを強制しません。変更スコープロジックがプッシュで完全カバレッジを要求する場合、ワークフローは高速 Docker スモークを維持し、完全インストールスモークは nightly またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider スモークは `run_bun_global_install_smoke` によって別途ゲートされます。これは nightly スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでも任意で有効にできますが、プルリクエストと `main` プッシュでは実行されません。QR とインストーラー Docker テストは、それぞれインストールに焦点を当てた Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整可能項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時 live レーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create 集中を避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。エージェントが失敗した 1 つのレーンを再現できるよう、クリーンアップスモークをスキップします。 |

実効上限より重いレーンでも、空のプールから開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先の順序付け用にレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。次に `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` 経由で OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドの代わりに提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに 180 秒の境界付きタイムアウトでリトライされるため、停止したレジストリ/キャッシュストリームが CI クリティカルパスの大半を消費するのではなく、すばやくリトライされます。

### リリースパスチャンク

リリース Docker カバレッジは `OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンク化ジョブで実行されるため、各チャンクは必要なイメージ種別のみを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン用の集約手動再実行エイリアスのままです。

OpenWebUI は完全な release-path カバレッジが要求する場合に `plugins-runtime-services` に折り込まれ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを保持します。バンドル済みチャネル更新レーンは、一時的な npm ネットワーク失敗に対して一度リトライします。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーン表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択したレーンを実行します。これにより、失敗レーンのデバッグは対象を絞った 1 つの Docker ジョブに限定され、その実行用にパッケージアーティファクトを準備、ダウンロード、または再利用します。選択したレーンが live Docker レーンの場合、対象ジョブはその再実行用に live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済み live/E2E ワークフローは、完全な release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` プッシュ、スタンドアロンの手動 CI ディスパッチでは、そのスイートはオフのままです。これはバンドル済み Plugin テストを 8 つの拡張機能ワーカーに分散します。それらの拡張機能シャードジョブは、一度に最大 2 つの Plugin 設定グループを実行し、各グループにつき Vitest ワーカー 1 つとより大きな Node ヒープを使用するため、import が重い Plugin バッチが追加の CI ジョブを作成しません。リリース専用 Docker プレリリースパスは、1〜3 分のジョブのために多数のランナーを予約しないよう、対象 Docker レーンを小さなグループにまとめます。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外側に専用の CI レーンがあります。エージェント的パリティは、スタンドアロンの PR ワークフローではなく、広範な QA とリリースハーネスの下にネストされています。パリティを広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは nightly に `main` 上で、および手動ディスパッチで実行されます。これは mock parity レーン、live Matrix レーン、live Telegram と Discord レーンを並列ジョブとして展開します。live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex leases を使用します。

リリースチェックは、決定的な mock プロバイダーと mock 修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram の live transport レーンを実行するため、チャネル契約は live モデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。QA パリティがメモリ動作を別途カバーするため、live transport Gateway はメモリ検索を無効にします。プロバイダー接続性は、別個の live モデル、ネイティブプロバイダー、Docker プロバイダースイートによってカバーされます。

Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI がサポートする場合のみ `--fail-fast` を追加します。CLI デフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、完全な Matrix カバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` はリリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA パリティゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後最終的なパリティ比較のために両方のアーティファクトを小さなレポートジョブへダウンロードします。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープ化された CI/チェック証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に絞り込んだ初回パスのセキュリティスキャナーです。毎日、手動、およびドラフトでないプルリクエストのガード実行では、Actions ワークフローコードに加えて、高リスクの JavaScript/TypeScript サーフェスを、高/重大の `security-severity` に絞り込んだ高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始し、スケジュール済みワークフローと同じ高信頼度のセキュリティマトリックスを実行します。Android と macOS の CodeQL は、PR のデフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、Web フェッチ、Plugin SDK の SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーのインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済みの Android セキュリティシャード。ワークフロー健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係のビルド結果をアップロード済み SARIF から除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次デフォルトの外に置いています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。小さめの Blacksmith Linux ランナー上で、狭い高価値サーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。このプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくしています。ドラフトでない PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルとバンドル済みチャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、マイグレーション、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンのランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着部、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK のインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーのデフォルト/カタログ、Web/検索/フェッチ/埋め込みレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway 制御フロー、タスクコントロールプレーンのランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア Web フェッチ/検索、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリーポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティと分離したままにします。これにより、品質の検出結果を、セキュリティシグナルを不明瞭にすることなく、スケジュール、測定、無効化、または拡張できます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後でのみ、スコープ指定またはシャード化されたフォローアップ作業として戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` がすでに進んでいる場合、または過去 1 時間以内にスキップされていない別の Docs Agent 実行が作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積したすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーできますが、その UTC 日に別のワークフロー実行による呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインのテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗のみを修正でき、エージェント後のフルスイートレポートは、何かをコミットする前に合格する必要があります。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して、push を再試行します。競合する古いパッチはスキップされます。Codex アクションが docs agent と同じ drop-sudo の安全姿勢を保てるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップのための手動メンテナーワークフローです。デフォルトはドライランで、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複 PR に共有された参照 Issue があるか、変更された hunk が重なっていることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加え、コア lint/ガードを実行します。
- コアのテストのみの変更は、コアテストの型チェックに加え、コア lint のみを実行します。
- 拡張の本番変更は、拡張本番と拡張テストの型チェックに加え、拡張 lint を実行します。
- 拡張のテストのみの変更は、拡張テストの型チェックに加え、拡張 lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、拡張がそれらのコア契約に依存するため、拡張の型チェックへ拡張されます（Vitest 拡張スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョンバンプは、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンを実行します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より安価です。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ上の依存先を使います。共有グループルーム配信設定は明示的なマッピングの 1 つです。グループの表示返信設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加え、Discord と Slack の配信回帰を経由します。これにより、共有デフォルトの変更は最初の PR push の前に失敗します。変更がハーネス全体に及ぶほど広く、安価なマップ済みセットを信頼できる代理と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

広範な証明には、リポジトリルートから Testbox を実行し、新しくウォーム済みのボックスを優先します。再利用された、期限切れになった、または予想外に大きな同期を報告したばかりのボックスで遅いゲートに時間を使う前に、まずボックス内で `pnpm testbox:sanity` を実行してください。

サニティチェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short` が 200 件以上の追跡済み削除を示す場合にすばやく失敗します。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、そのボックスを停止して新しいボックスをウォームしてください。意図的な大量削除 PR では、そのサニティ実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、異常に大きなローカル差分にはより大きなミリ秒値を使用してください。

Crabbox は、メンテナーの Linux 証明向けにリポジトリが所有するリモートボックスラッパーです。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能なボックス、リモートログが必要な場合に使用します。通常の OpenClaw バックエンドは `blacksmith-testbox` です。所有 AWS/Hetzner 容量は、Blacksmith の障害、クォータ問題、または明示的な所有容量テストのためのフォールバックです。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を通知しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーは明示的に渡してください。

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

絞り込んだテストの再実行:

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

最終 JSON サマリーを読んでください。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。Blacksmith をバックエンドにした単発の Crabbox 実行では、Testbox は自動的に停止するはずです。実行が中断された、またはクリーンアップが不明確な場合は、稼働中のボックスを調べ、自分が作成したボックスだけを停止してください。

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

同じハイドレート済みボックスで複数のコマンドを意図的に実行する必要がある場合にのみ、再利用を使います。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層で、Blacksmith 自体は動作している場合は、狭いフォールバックとして直接 Blacksmith を使用します。

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Blacksmith がダウンしている、クォータ制限がある、必要な環境がない、または所有容量そのものが明示的な目的である場合にのみ、所有 Crabbox 容量へエスカレーションします。

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを管理します。ローカル `.git` は除外されるため、ハイドレートされた Actions チェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期するのではなく、独自のリモート Git メタデータを保持します。また、転送されるべきでないローカル実行時/ビルド成果物も除外されます。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、および所有クラウドの `crabbox run --id <cbx_id>` コマンド向けの非シークレット環境の引き渡しを管理します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
