---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - |-
      OpenClaw ドキュメントの i18n 入力>
      ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しています
summary: CI ジョブグラフ、スコープゲート、リリース包括、およびローカルコマンドの同等物
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-04T17:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。正規の
`main` プッシュは、まず 90 秒のホストランナー受け入れウィンドウを通過します。
既存の `CI` concurrency group は、より新しい
コミットが到着するとその待機中の実行をキャンセルするため、連続したマージがそれぞれ完全な Blacksmith
マトリックスを登録することはありません。プルリクエストと手動ディスパッチは待機をスキップします。`preflight` ジョブは
その後、差分を分類し、関係のない
領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な
検証のために、意図的にスマートな
スコープ設定をバイパスして完全なグラフへファンアウトします。Android レーンは `include_android` によるオプトインのままです。リリース専用の
Plugin カバレッジは別個の [`Plugin プレリリース`](#plugin-prerelease)
ワークフローにあり、[`完全リリース検証`](#full-release-validation)
または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                             | 目的                                                                                                      | 実行タイミング                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs のみの変更、変更されたスコープ、変更された extensions を検出し、CI マニフェストをビルドする          | ドラフトでないプッシュと PR では常に                |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` プッシュをホスト側で 90 秒デバウンスする                   | すべての CI 実行。正規の `main` プッシュでのみ sleep |
| `security-fast`                    | 秘密鍵検出、`zizmor` による変更済みワークフロー監査、本番 lockfile 監査                                   | ドラフトでないプッシュと PR では常に                |
| `check-dependencies`               | 本番 Knip の依存関係のみのパスと未使用ファイル許可リストガード                                            | Node 関連の変更                                     |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI smoke チェック、埋め込みビルド成果物チェック、再利用可能な成果物をビルド | Node 関連の変更                                     |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI ルーティングチェックなどの高速 Linux 正当性レーン                      | Node 関連の変更                                     |
| `checks-fast-contracts-plugins-*`  | 2 分割された Plugin contract チェック                                                                      | Node 関連の変更                                     |
| `checks-fast-contracts-channels-*` | 2 分割された channel contract チェック                                                                     | Node 関連の変更                                     |
| `checks-node-core-*`               | channel、bundled、contract、extension レーンを除く Core Node テストシャード                               | Node 関連の変更                                     |
| `check-*`                          | 分割された main ローカルゲート相当: prod types、lint、guards、test types、strict smoke                     | Node 関連の変更                                     |
| `check-additional-*`               | Architecture、分割された boundary/prompt drift、extension guards、package boundary、runtime topology       | Node 関連の変更                                     |
| `checks-node-compat-node22`        | Node 22 互換性ビルドと smoke レーン                                                                        | リリース用の手動 CI ディスパッチ                    |
| `check-docs`                       | Docs の formatting、lint、broken-link チェック                                                             | Docs が変更された場合                               |
| `skills-python`                    | Python ベースの Skills 向け Ruff + pytest                                                                 | Python skill 関連の変更                             |
| `checks-windows`                   | Windows 固有の process/path テストと共有 runtime import specifier のリグレッション                        | Windows 関連の変更                                  |
| `macos-node`                       | 共有ビルド成果物を使う macOS TypeScript テストレーン                                                      | macOS 関連の変更                                    |
| `macos-swift`                      | macOS アプリ向け Swift lint、build、tests                                                                 | macOS 関連の変更                                    |
| `ios-build`                        | Xcode project 生成と iOS アプリ simulator build                                                           | iOS アプリ、共有 app kit、または Swabble の変更     |
| `android`                          | 両方の flavor の Android unit tests と 1 つの debug APK build                                             | Android 関連の変更                                  |
| `test-performance-agent`           | 信頼済みアクティビティ後の日次 Codex slow-test 最適化                                                     | Main CI 成功または手動ディスパッチ                  |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 live レーンを含む日次/オンデマンドの Kova runtime performance レポート | スケジュール実行と手動ディスパッチ                  |

## fail-fast の順序

1. `runner-admission` は正規の `main` プッシュでのみ待機します。より新しいプッシュがあると、Blacksmith 登録前に実行がキャンセルされます。
2. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォームマトリックスジョブを待たずにすばやく失敗します。
4. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドが準備でき次第、下流のコンシューマーが開始できます。
5. その後、より重いプラットフォームと runtime のレーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しいプッシュが到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗している場合を除き、これは CI ノイズとして扱ってください。マトリックスジョブは `fail-fast: false` を使用し、`build-artifacts` は小さな verifier ジョブをキューに入れる代わりに、埋め込み channel、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側 zombie が新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅いジョブ、失敗、`pnpm-store-warmup` fanout barrier を要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。CI は同じ実行サマリーを `ci-timings-summary` artifact としてもアップロードします。ビルドタイミングについては、`build-artifacts` ジョブの `Build dist` ステップを確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。このジョブは `startup-memory` artifact もアップロードします。

プルリクエスト実行では、terminal timing-summary ジョブは `GH_TOKEN` を `gh run view` に渡す前に、信頼済み base revision からヘルパーを実行します。これにより、トークン付きクエリをブランチ管理下のコードから外しつつ、プルリクエストの現在の CI 実行を要約できます。

## PR コンテキストと証拠

外部コントリビューターの PR は、
`.github/workflows/real-behavior-proof.yml` から PR コンテキストと証拠ゲートを実行します。このワークフローは信頼済みの
base commit をチェックアウトし、PR 本文のみを評価します。コントリビューターブランチのコードは実行しません。

このゲートは、リポジトリのオーナー、メンバー、
コラボレーター、または bot ではない PR 作者に適用されます。PR 本文に作者による
`What Problem This Solves` と `Evidence` セクションが含まれている場合に通過します。証拠には、焦点を絞った
test、CI result、screenshot、recording、terminal output、live observation、
redacted log、または artifact link を使用できます。本文は意図と有用な検証を提供します。
レビュアーは code、tests、CI を検査して正しさを評価します。

チェックが失敗した場合は、別のコードコミットをプッシュするのではなく、PR 本文を更新してください。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests でカバーされています。手動ディスパッチは changed-scope detection をスキップし、preflight manifest をすべてのスコープ領域が変更されたかのように動作させます。

- **CI workflow edits** は Node CI グラフと workflow linting を検証しますが、それだけで Windows、iOS、Android、または macOS の native builds を強制することはありません。これらの platform lane は platform source changes にスコープされたままです。
- **Workflow Sanity** は、すべての workflow YAML files に対する `actionlint` と `zizmor`、composite-action interpolation guard、conflict-marker guard を実行します。PR スコープの `security-fast` ジョブも、変更された workflow files に対して `zizmor` を実行するため、workflow security findings は main CI グラフ内で早期に失敗します。
- **`main` プッシュ時の docs** は、CI で使用されるものと同じ ClawHub docs mirror を使う standalone `Docs` workflow によってチェックされるため、code+docs が混在したプッシュでも CI の `check-docs` shard は追加でキューに入りません。プルリクエストと手動 CI は、docs が変更された場合、引き続き CI から `check-docs` を実行します。
- **TUI PTY** は、TUI 変更に対して `checks-node-core-runtime-tui-pty` Linux Node shard で実行されます。この shard は `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` で `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定的な `TuiBackend` fixture lane と、外部 model endpoint のみを mock する遅めの `tui --local` smoke の両方をカバーします。
- **CI routing-only edits、選択された安価な core-test fixture edits、狭い plugin contract helper/test-routing edits** は、高速な Node のみの manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task。この path は、routing または helper surfaces に限定され、高速 task が直接 exercise する変更の場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrappers、npm/pnpm/UI runner helpers、package manager config、およびその lane を実行する CI workflow surfaces にスコープされます。関係のない source、plugin、install-smoke、test-only changes は Linux Node lanes のままです。

最も遅い Node テストファミリーは分割または均等化され、ランナーを過剰予約せずに各ジョブが小さく保たれます。プラグイン契約とチャネル契約はそれぞれ標準の GitHub ランナーフォールバック付きで、重み付けされた Blacksmith バックアップの 2 シャードとして実行されます。core unit fast/support レーンは個別に実行され、core runtime infra は state、process/config、shared、3 つの cron ドメインシャードに分割されます。auto-reply はバランスされたワーカーとして実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割されます）。agentic gateway/server 設定は、ビルド済み成果物を待つのではなく、chat/auth/model/http-plugin/runtime/startup レーンに分割されます。通常の CI は、分離された infra include-pattern シャードだけを最大 64 個のテストファイルからなる決定的なバンドルにまとめます。これにより、非分離の command/cron、ステートフルな agents-core、gateway/server スイートを統合せずに Node マトリクスを削減します。重い固定スイートは 8 vCPU のままにし、バンドル済みレーンと低重みレーンは 4 vCPU を使用します。正規リポジトリの Pull request では、追加のコンパクトな受け入れプランを使用します。同じ config 別グループを現在の 34 ジョブ Linux Node プラン内の分離サブプロセスで実行するため、単一の PR が 70 ジョブ超の完全な Node マトリクスを登録することはありません。`main` プッシュ、手動ディスパッチ、リリースゲートは完全なマトリクスを維持します。広範なブラウザー、QA、メディア、その他のプラグインテストは、共有プラグインの catch-all ではなく専用の Vitest config を使用します。include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional-*` はパッケージ境界の compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。境界ガードリストは、プロンプトが重い 1 つのシャードと、残りのガードストライプ用の 1 つの統合シャードにストライプ化され、それぞれ選択された独立ガードを並行実行し、チェックごとのタイミングを出力します。高コストな Codex happy-path プロンプトスナップショット drift チェックは、手動 CI とプロンプトに影響する変更だけで独自の追加ジョブとして実行されます。そのため、通常の無関係な Node 変更はコールドなプロンプトスナップショット生成の後ろで待たず、境界シャードはバランスを保ちつつ、プロンプト drift はそれを発生させた PR に固定されます。同じフラグは、ビルド済み成果物の core support-boundary シャード内でのプロンプトスナップショット Vitest 生成もスキップします。Gateway watch、チャネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

受け入れ後、正規 Linux CI は最大 24 個の Node テストジョブの同時実行を許可し、
小さい fast/check レーンでは 12 個を許可します。Windows と Android は、これらの
ランナープールがより狭いため 2 個のままです。

コンパクト PR プランは、現在のスイートに対して 18 個の Node ジョブを出力します。config 全体の
グループは 120 分のバッチタイムアウト付きで分離サブプロセスにバッチ化され、
include-pattern グループは同じ制限付きジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには個別のソースセットや manifest はありません。その unit-test レーンは、SMS/call-log BuildConfig フラグ付きでそのフレーバーを引き続きコンパイルしつつ、Android 関連の各プッシュで重複する debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` インストールでは pnpm の minimum release age を無効化した、本番 Knip dependency-only パス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番 unused-file 検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file ガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な動的プラグイン、生成、ビルド、live-test、package bridge のサーフェスは維持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡すターゲット側ブリッジです。信頼されていない Pull request コードをチェックアウトしたり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` にディスパッチします。

この workflow には 4 つのレーンがあります。

- 正確な issue と Pull request レビュー要求用の `clawsweeper_item`;
- issue コメント内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` プッシュ上の commit レベルレビュー要求用の `clawsweeper_commit_review`;
- ClawSweeper エージェントが検査できる一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは正規化されたメタデータのみを転送します。イベントタイプ、action、actor、repository、item number、URL、title、state、存在する場合はコメントまたはレビューの短い抜粋です。完全な webhook body は意図的に転送しません。`openclaw/clawsweeper` 側の受信 workflow は `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway hook に投稿します。

一般アクティビティは観測であり、デフォルト配信ではありません。ClawSweeper エージェントはプロンプト内で Discord ターゲットを受け取り、そのイベントが予想外、対応可能、リスクあり、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常のレビュー traffic は `NO_REPLY` になるべきです。

このパス全体で、GitHub の title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約と triage の入力であり、workflow やエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外の scoped レーンをすべて強制的に有効化します。Linux Node shards、bundled-plugin shards、plugin and channel contract shards、Node 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python skills、Windows、macOS、iOS build、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。完全リリースの umbrella は `include_android=true` を渡すことで Android を有効化します。プラグイン prerelease static checks、release-only の `agentic-plugins` シャード、完全な extension batch sweep、プラグイン prerelease Docker レーンは CI から除外されます。Docker prerelease スイートは、`Full Release Validation` が release-validation ゲート有効で別の `Plugin Prerelease` workflow をディスパッチした場合にのみ実行されます。

手動実行では一意の concurrency group を使用するため、release-candidate full suite が同じ ref 上の別の push や PR run によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択された dispatch ref の workflow ファイルを使用しながら、そのグラフを branch、tag、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

月次 npm-only extended-stable パスは例外です。`OpenClaw NPM
Release` preflight と `Full Release Validation` の両方を正確な
`extended-stable/YYYY.M.33` ブランチからディスパッチし、それらの run ID を保持し、両方の ID を
direct npm publish run に渡します。コマンド、正確な identity 要件、registry readback、selector
repair 手順については、[月次 npm-only extended-stable
公開](/ja-JP/reference/RELEASING#monthly-npm-only-extended-stable-publication) を参照してください。このパスは、plugin、macOS、Windows、GitHub
Release、private dist-tag、その他の platform publication をディスパッチしません。

## ランナー

| ランナー                          | ジョブ                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI ディスパッチと非正規リポジトリのフォールバック、CodeQL JavaScript/actions quality scans、workflow-sanity、labeler、auto-response、CI 外の docs workflows、install-smoke preflight。これにより Blacksmith マトリクスをより早くキューに入れられます                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低重みの extension shards、QA Smoke CI を除く `checks-fast-core`、plugin/channel contract shards、大半の bundled/lower-weight Linux Node shards、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` シャード、`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持される重い Linux Node suites、boundary/extension-heavy の `check-additional-*` シャード、`android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI と Testbox の `build-artifacts`、`check-lint`（CPU に敏感で、8 vCPU は節約額よりコストが高かった）、install-smoke Docker builds（32-vCPU の queue time は節約額よりコストが高かった）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`; fork は `macos-15` にフォールバックします                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`; fork は `macos-26` にフォールバックします                                                                                                                                                                                                                     |

## ランナー登録予算

OpenClaw の現在の GitHub runner-registration bucket は、`ghx api rate_limit` で 5 分あたり 10,000 件の self-hosted
runner registration として報告されます。GitHub がこの bucket を変更する可能性があるため、各 tuning pass の前に
`actions_runner_registration` を再確認してください。この制限は `openclaw`
organization 内のすべての Blacksmith runner registration によって共有されるため、別の Blacksmith installation を追加しても
新しい bucket は追加されません。

Blacksmith ラベルは burst control の希少リソースとして扱ってください。route、notify、summarize、shard selection、短い CodeQL scan だけを行うジョブは、測定済みの Blacksmith 固有ニーズがない限り、GitHub-hosted runner に留めるべきです。新しい Blacksmith matrix、より大きい `max-parallel`、または高頻度 workflow は、worst-case registration count を示し、org-level target を live bucket の約 60% 未満に保つ必要があります。現在の 10,000-registration bucket では、これは 6,000-registration の operating target を意味し、同時実行リポジトリ、retry、burst overlap のための余裕を残します。

正規リポジトリ CI は、通常の push と Pull request run のデフォルトランナーパスとして Blacksmith を維持します。`workflow_dispatch` と非正規リポジトリ run は GitHub-hosted runner を使用しますが、通常の正規 run は現在、Blacksmith queue health を probe したり、Blacksmith が利用できない場合に GitHub-hosted label へ自動フォールバックしたりしません。

## ローカルで同等のコマンド

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` は、プロダクトとランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフローの ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象の ref をキーにし、各 `index.md` にはテスト対象の ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

このワークフローは、ピン留めされたリリースから OCM を、`openclaw/Kova` からピン留めされた `kova_ref` 入力の Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定的な偽の OpenAI 互換認証を使うローカルビルドのランタイムに対して実行する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースのプロファイリング。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースでの Gateway 起動時間とメモリ、バンドル Plugin の import RSS、mock-OpenAI `channel-chat-baseline` hello ループの繰り返し、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象 ref について以前公開された mock-provider ソースレポートが利用できる場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON がその横に置かれます。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブのアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、その対象で手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/static/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカードレンダリング、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable と full プロファイルには常に網羅的な live/E2E と Docker リリースパス soak カバレッジが含まれます。beta プロファイルは `run_release_soak=true` でオプトインできます。標準のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補は重複した live poller を開始しません。公開後は、`release_package_spec` を渡して、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、リビルドせずに出荷済み npm パッケージを再利用します。集中的な公開済みパッケージ Telegram 再実行にのみ `npm_telegram_package_spec` を使用してください。Codex Plugin live package レーンは、デフォルトで同じ選択済み状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を派生し、SHA/アーティファクト実行では選択された ref から `extensions/codex` を pack します。`npm:`、`npm-pack:`、`git:` spec などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、集中的な再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、手動の変更を伴うリリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.PATCH` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にだけ保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。stable 公開には正確な `windows_node_tag` も必要です。このワークフローは、公開子ワークフローの前に Windows ソースリリースを検証し、その x64/ARM64 インストーラーを候補として承認された `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、それらと同じピン留めされたインストーラーダイジェストに加えて、正確な companion アセットとチェックサム契約を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

変化の速いブランチでピン留めされたコミット証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使用してください。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref は、ブランチまたはタグである必要があり、生のコミット SHA は使えません。このヘルパーは対象 SHA に一時的な `release-ci/<sha>-...` ブランチを push し、そのピン留め ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが異なる SHA で実行された場合は失敗します。

`release_profile` は、リリースチェックに渡される live/provider の幅を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media マトリックスを意図的に実行したい場合にのみ `full` を使用してください。stable と full のリリースチェックは常に網羅的な live/E2E と Docker リリースパス soak を実行します。beta プロファイルは `run_release_soak=true` でオプトインできます。

- `minimum` は最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は stable provider/backend セットを追加します。
- `full` は広範な advisory provider/media マトリックスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブが現在の子実行の結論を再チェックし、各子実行について最も遅いジョブのテーブルを追記します。子ワークフローが再実行されて green になった場合は、アンブレラ結果とタイミングサマリーを更新するために、親の検証ジョブだけを再実行します。

復旧のため、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の full CI 子だけには `ci`、Plugin prerelease 子だけには `plugin-prerelease`、すべてのリリース子には `release-checks` を使用します。アンブレラでは、より狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` も使用できます。これにより、集中的な修正後の失敗したリリースボックス再実行を限定できます。1 つの失敗したクロス OS レーンでは、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。たとえば `windows/packaged-upgrade` です。長時間のクロス OS コマンドは heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは、標準ランタイムツールカバレッジゲートを除き advisory です。このゲートは、必須の OpenClaw 動的ツールが標準 tier サマリーから drift したり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して選択済み ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。soak カバレッジが実行される場合は、live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再 pack することを避けられます。Codex npm-plugin live レーンについては、リリースチェックは `release_package_spec` から派生した一致する公開済み Plugin spec を渡すか、オペレーターが指定した `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトに選択済み checkout の Codex Plugin を pack させます。

`ref=main` と `rerun_group=all` に対する重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチ済みの子ワークフローをキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機することはありません。リリースブランチ/タグ検証と集中的な再実行グループは `cancel-in-progress: false` を維持します。

## Live と E2E シャード

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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

これにより、同じファイルカバレッジを維持しながら、遅い live provider の失敗を再実行および診断しやすくします。集約シャード名である `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` は、手動の単発再実行でも引き続き有効です。

ネイティブ live media シャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリだけを検証します。Docker-backed live スイートは通常の Blacksmith runner 上に維持してください。container job はネストした Docker テストを起動する場所として適していません。

Docker バックのライブモデル/バックエンドシャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー分割 Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップ経路が詰まった場合にリリースチェックの予算全体を消費せず、すばやく失敗します。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージはプロダクトとして動作するか？」という問いには `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通じて単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、ソース、ワークフロー参照、パッケージ参照、バージョン、SHA-256、プロファイルを GitHub ステップサマリーに出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` ではない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm 仕様を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのプレリリース/安定版の受け入れにはこれを使用します。
- `source=ref` は信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグをフェッチし、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離されたワークツリーに依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。この経路は URL 認証情報、非デフォルトの HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済み IP、および同じ公開安全ポリシーの外へのリダイレクトを拒否します。
- `source=trusted-url` は `.github/package-trusted-sources.json` 内の名前付き trusted-source ポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。設定済みホスト、ポート、パスプレフィックス、リダイレクトホスト、またはプライベートネットワーク解決が必要な、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみこれを使用します。ポリシーが bearer 認証を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL 埋め込みの認証情報は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼されたワークフロー/ハーネスコードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスは古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリース経路チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm 仕様の経路はスタンドアロンディスパッチ用に保持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skills インストール、古い Plugin 依存関係クリーンアップ、設定済み Plugin のインストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が同じ解決済みパッケージ tarball 上に保たれます。ベータ公開後に出荷済み npm パッケージに対して同じマトリックスを再ビルドなしで実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance が残りのリリース検証とは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム動作を引き続きカバーします。パッケージ/更新のプロダクト検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリース経路内で実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補となり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 つの安定版 npm リリースに加えて、固定された Plugin 互換性境界リリース、および Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルート用の課題形状フィクスチャへ展開します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに個別の対象 Docker runner ジョブへシャーディングされます。別個の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、公開済み更新クリーンアップを網羅的に確認する場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` で `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ仕様を渡すことも、`openclaw@2026.4.15` のように `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンに保つことも、シナリオマトリックス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定することもできます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みレーンとインストーラー新規レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合はデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、そうでない場合は `openai/gpt-5.5` を使用します。そのため、GPT-4.x デフォルトを避けつつ、インストールと Gateway 証明は GPT-5 テストモデル上に保たれます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに境界付きのレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性経路を使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指していてもよい。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップしてもよい。
- `update-channel-switch` は、tarball 派生の偽 git フィクスチャから欠落している pnpm `patchedDependencies` を刈り込み、永続化された `update.channel` の欠落をログに出してもよい。
- Plugin smoke は、レガシーインストールレコード位置を読み取るか、マーケットプレイスのインストールレコード永続化の欠落を許容してもよい。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許容してもよい。

公開済みの `2026.4.26` パッケージも、すでに出荷済みだったローカルビルドメタデータスタンプファイルについて警告してもよいです。それ以降のパッケージは現代の契約を満たす必要があり、同じ条件は警告やスキップではなく失敗になります。

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます。`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行する代わりに、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージサーフェス、同梱 Plugin のパッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコアの Plugin/チャネル/Gateway/Plugin SDK サーフェスに触れる pull request で実行されます。ソースのみの同梱 Plugin 変更、テストのみの編集、docs のみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを 1 回ビルドし、CLI をチェックし、agents delete shared-workspace CLI smoke を実行し、container gateway-network e2e を実行し、同梱拡張のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付き同梱 Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は別途上限付き）。
- **フルパス**は、nightly のスケジュール実行、手動 dispatch、workflow-call のリリースチェック、およびインストーラー/パッケージ/Docker サーフェスに実際に触れる pull request 向けに、QR パッケージインストールとインストーラー Docker/update カバレッジを保持します。フルモードでは、install-smoke は target-SHA の GHCR ルート Dockerfile smoke イメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway smoke、インストーラー/update smoke、高速同梱 Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージ smoke の後ろで待たされません。

`main` への push（merge commit を含む）はフルパスを強制しません。changed-scope ロジックが push でフルカバレッジを要求する場合でも、workflow は高速 Docker smoke を保持し、フル install smoke は nightly またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別途ゲートされます。nightly スケジュールとリリースチェック workflow から実行され、手動の `Install Smoke` dispatch ではオプトインできますが、pull request と `main` push では実行されません。通常の PR CI では、Node 関連の変更に対して高速な Bun ランチャー回帰レーンを引き続き実行します。QR とインストーラーの Docker テストは、それぞれインストール重視の Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/update/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダー依存の tail-pool スロット数。                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットルしないようにする同時 live レーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンではより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定     | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定     | カンマ区切りの正確なレーンリスト。エージェントが失敗した 1 レーンを再現できるように cleanup smoke をスキップします。 |

有効上限より重いレーンでも、空のプールからであれば開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーンのステータスを出力し、最長優先の順序付けのためにレーンの所要時間を永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジュールを停止します。

### 再利用可能な live/E2E workflow

再利用可能な live/E2E workflow は、どのパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub outputs とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の run のパッケージ artifact をダウンロードするか、`package_artifact_run_id` からパッケージ artifact をダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker layer cache を通じてパッケージ digest タグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。また、再ビルドする代わりに、提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージ digest イメージを再利用します。Docker イメージの pull は、試行ごとに 180 秒の境界付きタイムアウトでリトライされるため、停止した registry/cache ストリームが CI のクリティカルパスの大半を消費する代わりにすばやくリトライされます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンク化ジョブを実行します。これにより、各チャンクは必要なイメージ種別のみを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`package-update-openai` には live Codex Plugin パッケージレーンが含まれます。このレーンは候補 OpenClaw パッケージをインストールし、`codex_plugin_spec` または同一 ref の tarball から Codex CLI インストールの明示的承認付きで Codex Plugin をインストールし、Codex CLI preflight を実行し、その後 OpenAI に対して同一セッションの OpenClaw エージェントターンを複数実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動 rerun エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみの dispatch の場合に限りスタンドアロンの `openwebui` チャンクを保持します。同梱チャネル update レーンは、一時的な npm ネットワーク障害に対して 1 回リトライします。

各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、低速レーンテーブル、レーンごとの rerun コマンドを含む `.artifacts/docker-tests/` をアップロードします。workflow の `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグを対象の Docker ジョブ 1 つに限定し、その run 用のパッケージ artifact を準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその rerun 用に live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub rerun コマンドには、値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した run とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E workflow は、フル release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによって dispatch される別 workflow です。通常の pull request、`main` push、スタンドアロンの手動 CI dispatch では、このスイートはオフのままです。これは同梱 Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、1 グループあたり 1 つの Vitest ワーカーとより大きな Node heap を使い、最大 2 つの Plugin 設定グループを同時に実行するため、import の多い Plugin バッチが余分な CI ジョブを作成しません。リリース専用 Docker プレリリースパスは、1 から 3 分のジョブのために数十のランナーを予約しないよう、対象 Docker レーンを小さなグループにまとめます。この workflow は `@openclaw/plugin-inspector` から情報提供用の `plugin-inspector-advisory` artifact もアップロードします。inspector の findings はトリアージ入力であり、ブロッキングの Plugin Prerelease ゲートは変更しません。

## QA Lab

QA Lab には、メインの smart-scoped workflow の外に専用 CI レーンがあります。Agentic parity は、スタンドアロンの PR workflow ではなく、広範な QA およびリリースハーネスの下にネストされています。parity を広範な検証 run と一緒に走らせる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` workflow は `main` で nightly に、また手動 dispatch で実行されます。mock parity レーン、live Matrix レーン、live Telegram および Discord レーンを並列ジョブとして fan out します。live ジョブは `qa-live-shared` environment を使用し、Telegram/Discord は Convex lease を使用します。

リリースチェックは、決定論的 mock プロバイダーと mock-qualified モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram の live transport レーンを実行するため、チャネル契約は live model のレイテンシーと通常の provider-plugin startup から分離されます。QA parity がメモリ動作を別途カバーするため、live transport Gateway は memory search を無効にします。プロバイダー接続性は、別個の live model、native provider、Docker provider スイートによってカバーされます。

Matrix はスケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動 workflow 入力は `all` のままです。手動の `matrix_profile=all` dispatch は、フル Matrix カバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA parity ゲートは候補パックと baseline パックを並列レーンジョブとして実行し、その後最終 parity 比較用の小さな report ジョブに両方の artifact をダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープ化された CI/check evidence に従ってください。

## CodeQL

`CodeQL` workflow は、フルリポジトリ sweep ではなく、意図的に狭い初回通過のセキュリティスキャナーです。daily、手動、非 draft の pull request guard run は、Actions workflow コードに加えて、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルタされた高信頼度セキュリティクエリでスキャンします。

pull request guard は軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有する同梱 Plugin runtime パス配下の変更でのみ開始し、スケジュール workflow と同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は PR デフォルトから外れています。

### セキュリティカテゴリ

| カテゴリ                                          | 対象面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、シークレット、サンドボックス、cron、Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査の接点              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーの対象面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス生成ヘルパー、サブプロセスを所有する同梱 Plugin ランタイム、ワークフロースクリプトの接続部                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼対象面 |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフロー健全性チェックが受け入れる最小の Blacksmith Linux runner で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` の下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係ビルド結果をアップロード対象の SARIF から除外し、`/codeql-critical-security/macos` の下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次のデフォルトからは外しています。

### 重要品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。品質スキャンが Blacksmith runner 登録予算を消費しないよう、GitHub ホストの Linux runner 上で、狭く価値の高い対象面に対して、エラー重大度の非セキュリティ JavaScript/TypeScript 品質クエリのみを実行します。そのプルリクエストガードは、スケジュールプロファイルより意図的に小さくしています。ドラフトではない PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、Auth/シークレット/サンドボックス/セキュリティコード、コアチャネルと同梱チャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接続部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチでは以下を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復用フックです。

| カテゴリ                                                | 対象面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、シークレット、サンドボックス、cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルと同梱チャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP 制御プレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の接続部、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルの対象面、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドのバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー Auth と検出、プロバイダーランタイム登録、プロバイダーのデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway 制御フロー、タスク制御プレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開対象面、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開済みパッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質をセキュリティから分離しているため、品質の検出結果を、セキュリティシグナルを曇らせずにスケジュール、計測、無効化、拡張できます。Swift、Python、同梱 Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、スコープ付きまたはシャード化されたフォローアップ作業として戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の bot 以外による push CI の成功がトリガーになり、手動ディスパッチでも直接実行できます。ワークフロー実行からの起動は、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行時には、前回スキップされていない Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント処理以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の bot 以外による push CI の成功がトリガーになりますが、その UTC 日に別のワークフロー実行起動がすでに実行済みまたは実行中の場合はスキップされます。手動ディスパッチは、その日次アクティビティゲートを回避します。このレーンは、フルスイートをグループ化した Vitest パフォーマンスレポートを作成し、Codex には大規模なリファクタではなく、カバレッジを保つ小さなテスト性能修正のみを行わせます。その後、フルスイートレポートを再実行し、成功ベースラインのテスト数を減らす変更を拒否します。グループ化レポートは、Linux と macOS の設定ごとの実時間と最大 RSS を記録するため、前後比較では継続時間の差分に加えてテストメモリ差分も示されます。ベースラインに失敗テストがある場合、Codex は明白な失敗のみを修正でき、エージェント後のフルスイートレポートは、何かをコミットする前に成功している必要があります。bot の push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo の安全姿勢を保てるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトはドライランで、`apply=true` の場合にのみ、明示的に列挙された PR をクローズします。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に、共有された参照 issue または重複する変更ハンクのどちらかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広い CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア本番とコアテストの typecheck に加えて、コア lint/guards を実行します。
- コアのテストのみの変更は、コアテストの typecheck に加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの typecheck に加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの typecheck に加えて、extension lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存しているため、extension typecheck へ拡張します（Vitest extension sweep は明示的なテスト作業のままです）。
- リリースメタデータのみのバージョンバンプは、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンで失敗させます。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接的なテスト編集は自分自身を実行し、ソース編集は明示的なマッピングを優先し、その後に sibling テストとインポートグラフ依存先を実行します。共有グループルーム配信設定は、明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、またはメッセージツールシステムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルト変更は最初の PR push の前に失敗します。変更がハーネス全体に及び、低コストにマッピングされたセットを信頼できる代理にできない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のための、リポジトリ所有のリモートボックスラッパーです。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能なボックス、リモートログが必要な場合に、リポジトリルートから使用します。通常の OpenClaw バックエンドは
`blacksmith-testbox` です。所有する AWS/Hetzner キャパシティは、Blacksmith
障害、クォータ問題、または明示的な所有キャパシティテストのためのフォールバックです。

Crabbox が支える Blacksmith 実行は、ワンショット Testbox を warm、claim、sync、run、report、cleanup します。組み込みの同期健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short`
で少なくとも 200 件の追跡済み削除が表示された場合に即座に失敗します。意図的な大規模削除 PR では、リモートコマンドに
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

Crabbox は、同期後の出力なしに同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定するか、通常より大きいローカル差分にはより大きなミリ秒値を使用します。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を宣伝しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーは明示的に渡します。Codex ワークツリーまたはリンク済み/スパースチェックアウトでは、Crabbox が起動する前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトは避け、代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith が支える実行には Crabbox 0.22.0 以降が必要です。これにより、ラッパーは現在の Testbox 同期、キュー、cleanup 動作を取得します。兄弟チェックアウトを使用する場合は、タイミングまたは証明作業の前に、無視対象のローカルバイナリを再ビルドします。

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
```

重点テスト再実行:

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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

最終 JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委任された
Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行は hydration と keepalive を所有します。SSH コマンドがすでに返った後に Testbox が外部から停止された場合、`cancelled` として終了することがあります。ラッパーの `exitCode` が非ゼロであるか、コマンド出力にテスト失敗が示されていない限り、それは cleanup/status アーティファクトとして扱います。ワンショットの Blacksmith が支える Crabbox 実行は、Testbox を自動的に停止するはずです。実行が中断された場合や cleanup が不明確な場合は、ライブボックスを調べ、自分が作成したボックスだけを停止します。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydrated ボックスで複数のコマンドが意図的に必要な場合にのみ、再利用を使います。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層だが Blacksmith 自体は動作する場合、直接 Blacksmith を使うのは `list`、`status`、cleanup などの診断だけにします。直接 Blacksmith 実行をメンテナー証明として扱う前に、Crabbox パスを修正します。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するものの、新しい warmup が数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith のプロバイダー、キュー、請求、または org 制限の圧迫として扱います。作成した queued ID を停止し、これ以上 Testbox を起動しないで、誰かが Blacksmith ダッシュボード、請求、org 制限を確認している間、証明を下の所有 Crabbox キャパシティパスに移します。

Blacksmith が停止している、クォータ制限を受けている、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 圧迫下では、タスクが本当に 48xlarge クラスの CPU を必要としない限り `class=beast` は避けます。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は、`standard`、複数のキャパシティリージョン、`capacity.hints: true` をデフォルトにしています。そのため、仲介された AWS リースは、選択されたリージョン/マーケット、クォータ圧迫、Spot フォールバック、高圧クラス警告を出力します。より重い広範なチェックには `fast` を使用し、standard/fast では不十分な場合にのみ `large` を使用し、`beast` はフルスイートや全 Plugin Docker マトリックス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドレーンにのみ使用します。`pnpm check:changed`、重点テスト、docs のみの作業、通常の lint/typecheck、小規模 E2E 再現、Blacksmith 障害トリアージには `beast` を使用しないでください。キャパシティ診断には `--market on-demand` を使用し、Spot マーケットの変動をシグナルに混ぜないようにします。

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions hydration デフォルトを所有します。これはローカルの `.git` を除外するため、hydrated Actions チェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持します。また、転送すべきでないローカル runtime/build アーティファクトも除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けに、チェックアウト、Node/pnpm セットアップ、`origin/main` fetch、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
