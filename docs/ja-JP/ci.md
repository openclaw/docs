---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリース包括項目、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-06-30T13:45:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。正規の
`main` プッシュは、まず 90 秒のホストランナー受け入れウィンドウを通過します。
既存の `CI` concurrency group は、新しいコミットが入ると待機中の実行をキャンセルするため、
連続したマージがそれぞれ完全な Blacksmith マトリックスを登録することはありません。プルリクエストと手動 dispatch は待機をスキップします。その後、`preflight` ジョブが
diff を分類し、無関係な領域だけが変更された場合は高コストのレーンをオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な
検証のため、意図的にスマートなスコープ判定をバイパスしてグラフ全体にファンアウトします。Android レーンは `include_android` によるオプトインのままです。リリース専用の
Plugin カバレッジは、別個の [`Plugin プレリリース`](#plugin-prerelease)
ワークフローにあり、[`完全リリース検証`](#full-release-validation)
または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                                | 目的                                                                                                   | 実行タイミング                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only 変更、変更スコープ、変更された extensions を検出し、CI マニフェストをビルドします                   | non-draft のプッシュと PR で常に実行                  |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` プッシュに対してホスト側で 90 秒のデバウンスを行います                | すべての CI 実行。正規の `main` プッシュでのみ sleep |
| `security-fast`                    | 秘密鍵検出、`zizmor` による変更済みワークフロー監査、本番 lockfile 監査                 | non-draft のプッシュと PR で常に実行                  |
| `check-dependencies`               | 本番 Knip dependency-only パスと未使用ファイル allowlist ガード                                 | Node 関連の変更                               |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI smoke チェック、埋め込みビルド成果物チェック、再利用可能な成果物をビルドします | Node 関連の変更                               |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI ルーティングチェックなどの高速 Linux 正当性レーン                | Node 関連の変更                               |
| `checks-fast-contracts-plugins-*`  | 2 分割された Plugin contract チェック                                                                        | Node 関連の変更                               |
| `checks-fast-contracts-channels-*` | 2 分割された channel contract チェック                                                                       | Node 関連の変更                               |
| `checks-node-core-*`               | channel、bundled、contract、extension レーンを除外した Core Node テストシャード                          | Node 関連の変更                               |
| `check-*`                          | prod types、lint、guards、test types、strict smoke という、シャード化された主要ローカルゲート相当の処理                | Node 関連の変更                               |
| `check-additional-*`               | architecture、シャード化された boundary/prompt drift、extension guards、package boundary、runtime topology     | Node 関連の変更                               |
| `checks-node-compat-node22`        | Node 22 互換性ビルドと smoke レーン                                                                | リリース用の手動 CI dispatch                     |
| `check-docs`                       | ドキュメントの formatting、lint、broken-link チェック                                                             | ドキュメント変更時                                        |
| `skills-python`                    | Python-backed Skills 用の Ruff + pytest                                                                    | Python Skill 関連の変更                       |
| `checks-windows`                   | Windows 固有の process/path テストと共有 runtime import specifier のリグレッション                      | Windows 関連の変更                            |
| `macos-node`                       | 共有ビルド成果物を使用する macOS TypeScript テストレーン                                               | macOS 関連の変更                              |
| `macos-swift`                      | macOS アプリ用の Swift lint、build、tests                                                            | macOS 関連の変更                              |
| `ios-build`                        | Xcode プロジェクト生成と iOS アプリの simulator build                                                 | iOS アプリ、共有 app kit、または Swabble の変更         |
| `android`                          | 両 flavor の Android unit tests と 1 つの debug APK build                                              | Android 関連の変更                            |
| `test-performance-agent`           | 信頼済みアクティビティ後の日次 Codex slow-test 最適化                                                 | Main CI 成功時または手動 dispatch                  |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 live レーンを含む、日次/オンデマンドの Kova runtime performance レポート | Scheduled および手動 dispatch                       |

## Fail-fast 順序

1. `runner-admission` は正規の `main` プッシュに対してのみ待機します。新しいプッシュがあると、Blacksmith 登録前にその実行はキャンセルされます。
2. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォームマトリックスジョブを待たずに素早く失敗します。
4. `build-artifacts` は高速 Linux レーンと並行して実行されるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
5. その後、より重いプラットフォームおよび runtime レーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しいプッシュが入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。Matrix jobs は `fail-fast: false` を使用し、`build-artifacts` は小さな verifier jobs をキューに入れる代わりに、埋め込み channel、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI concurrency key は versioned (`CI-v7-*`) なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動 full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅い jobs、failures、`pnpm-store-warmup` fanout barrier を要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。CI は同じ実行サマリーも `ci-timings-summary` artifact としてアップロードします。ビルド時間については、`build-artifacts` ジョブの `Build dist` ステップを確認してください: `pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。このジョブは `startup-memory` artifact もアップロードします。

プルリクエスト実行では、terminal timing-summary ジョブは `GH_TOKEN` を `gh run view` に渡す前に、信頼済み base revision から helper を実行します。これにより、トークン付きクエリを branch-controlled code の外に保ちながら、プルリクエストの現在の CI 実行を要約できます。

## PR コンテキストと証拠

外部コントリビューターの PR は、
`.github/workflows/real-behavior-proof.yml` から PR コンテキストと証拠ゲートを実行します。このワークフローは信頼済みの
base commit をチェックアウトし、PR body のみを評価します。コントリビューター branch のコードは実行しません。

このゲートは、repository owners、members、
collaborators、bots ではない PR authors に適用されます。PR body に著者が書いた
`What Problem This Solves` と `Evidence` セクションが含まれている場合に通過します。証拠には、focused
test、CI result、screenshot、recording、terminal output、live observation、
redacted log、artifact link を使用できます。本文は意図と有用な検証を提供します。
reviewers は code、tests、CI を検査して正しさを評価します。

チェックが失敗した場合は、別の code commit をプッシュするのではなく、PR body を更新してください。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests でカバーされています。手動 dispatch は changed-scope detection をスキップし、すべての scoped area が変更されたかのように preflight manifest を動作させます。

- **CI workflow edits** は Node CI graph と workflow linting を検証しますが、それだけで Windows、iOS、Android、macOS native builds を強制することはありません。これらの platform lanes は platform source changes にスコープされたままです。
- **Workflow Sanity** は `actionlint`、すべての workflow YAML files に対する `zizmor`、composite-action interpolation guard、conflict-marker guard を実行します。PR-scoped `security-fast` ジョブも、変更された workflow files に対して `zizmor` を実行するため、workflow security findings は main CI graph 内で早期に失敗します。
- **`main` プッシュ上のドキュメント** は、CI と同じ ClawHub docs mirror を使用する standalone `Docs` workflow によってチェックされるため、code+docs が混在するプッシュでも CI `check-docs` shard は追加でキューに入りません。プルリクエストと手動 CI では、ドキュメントが変更された場合に引き続き CI から `check-docs` を実行します。
- **TUI PTY** は、TUI 変更用の `checks-node-core-runtime-tui-pty` Linux Node shard で実行されます。この shard は `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 付きで `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定的な `TuiBackend` fixture lane と、外部 model endpoint だけを mock する遅めの `tui --local` smoke の両方をカバーします。
- **CI routing-only edits、選択された安価な core-test fixture edits、狭い plugin contract helper/test-routing edits** は、高速な Node-only manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task。この path は、変更が routing または helper surfaces に限定され、高速 task がそれらを直接 exercise する場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrappers、npm/pnpm/UI runner helpers、package manager config、およびその lane を実行する CI workflow surfaces にスコープされます。無関係な source、plugin、install-smoke、test-only changes は Linux Node lanes に留まります。

最も遅い Node テストファミリーは分割または均衡化され、ランナーを過剰に予約せず各ジョブが小さく保たれます。Plugin 契約とチャネル契約はそれぞれ標準の GitHub ランナーフォールバック付きの重み付き Blacksmith バックドシャード 2 個として実行され、コアユニットの fast/support レーンは個別に実行され、コアランタイムインフラは state、process/config、shared、3 つの cron ドメインシャードに分割され、自動返信は均衡化されたワーカーとして実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。また、エージェント型 gateway/server config はビルド済み成果物を待つのではなく、chat/auth/model/http-plugin/runtime/startup レーンに分割されます。通常の CI は、独立したインフラ include-pattern シャードだけを最大 64 テストファイルの決定的なバンドルに詰めるため、非独立の command/cron、ステートフルな agents-core、gateway/server スイートをマージせずに Node マトリックスを削減します。重い固定スイートは 8 vCPU のままにし、バンドル済みレーンと低重みレーンは 4 vCPU を使用します。正規リポジトリ上の pull request では、追加のコンパクトな admission プランを使用します。同じ config ごとのグループが現在の 34 ジョブ Linux Node プラン内の独立サブプロセスで実行されるため、単一の PR が 70 ジョブ超の Node マトリックス全体を登録することはありません。`main` への push、手動ディスパッチ、リリースゲートは完全なマトリックスを維持します。広範なブラウザ、QA、メディア、その他の Plugin テストは、共有 Plugin キャッチオールではなく専用の Vitest config を使用します。Include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルタ済みシャードを区別できます。`check-additional-*` は package-boundary の compile/canary 作業をまとめ、ランタイムトポロジーアーキテクチャを Gateway watch カバレッジから分離します。boundary guard リストは、プロンプトが重いシャード 1 個と、残りの guard stripe をまとめた結合シャード 1 個に分割され、それぞれ選択された独立 guard を並行実行し、チェックごとのタイミングを出力します。高コストな Codex ハッピーパスプロンプトスナップショット drift チェックは、手動 CI とプロンプトに影響する変更の場合のみ独自の追加ジョブとして実行されるため、通常の無関係な Node 変更はコールドなプロンプトスナップショット生成の背後で待たず、boundary シャードは均衡を保ちます。一方でプロンプト drift は、それを引き起こした PR に固定されたままです。同じフラグにより、ビルド済み成果物のコア support-boundary シャード内でのプロンプトスナップショット Vitest 生成もスキップされます。Gateway watch、チャネルテスト、コア support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

admission 後、正規 Linux CI は最大 24 個の Node テストジョブの同時実行を許可し、
より小さい fast/check レーンでは 12 個を許可します。Windows と Android は
ランナープールがより狭いため 2 個のままです。

コンパクトな PR プランは、現在のスイートに対して 18 個の Node ジョブを生成します。whole-config
グループは 120 分のバッチタイムアウト付きで独立サブプロセスにバッチ化され、
include-pattern グループは同じ制限付きジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play debug APK をビルドします。third-party flavor には個別の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きで flavor を引き続きコンパイルしますが、Android 関連の push ごとに重複する debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install のため pnpm の minimum release age を無効化した、本番 Knip dependency-only パス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番 unused-file 検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの unused file を追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な動的 Plugin、生成物、ビルド、live-test、package bridge サーフェスは保持されます。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡すターゲット側ブリッジです。信頼されていない pull request コードを checkout したり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` にディスパッチします。

この workflow には 4 つのレーンがあります。

- `clawsweeper_item`: 正確な issue および pull request レビューリクエスト用。
- `clawsweeper_comment`: issue コメント内の明示的な ClawSweeper コマンド用。
- `clawsweeper_commit_review`: `main` push 上の commit レベルレビューリクエスト用。
- `github_activity`: ClawSweeper エージェントが検査できる一般的な GitHub アクティビティ用。

`github_activity` レーンは、正規化されたメタデータのみを転送します。event type、action、actor、repository、item number、URL、title、state、および存在する場合は comment または review の短い抜粋です。完全な webhook body を転送しないよう意図されています。`openclaw/clawsweeper` 側の受信 workflow は `.github/workflows/github-activity.yml` で、正規化イベントを ClawSweeper エージェント用の OpenClaw Gateway hook に投稿します。

一般アクティビティは観測であり、デフォルト配信ではありません。ClawSweeper エージェントはプロンプト内で Discord ターゲットを受け取り、イベントが予期せず、対応可能で、リスクがあり、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常の review traffic は `NO_REPLY` になるべきです。

このパス全体を通じて、GitHub の title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。それらは要約と triage の入力であり、workflow やエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的に有効にします。Linux Node シャード、bundled-plugin シャード、Plugin とチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物 smoke check、docs check、Python Skills、Windows、macOS、iOS build、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。完全なリリース umbrella は `include_android=true` を渡して Android を有効にします。Plugin prerelease static check、release-only の `agentic-plugins` シャード、完全な extension batch sweep、Plugin prerelease Docker レーンは CI から除外されます。Docker prerelease スイートは、`Full Release Validation` が release-validation gate を有効にして個別の `Plugin Prerelease` workflow をディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency group を使用するため、release-candidate の完全スイートが同じ ref 上の別の push や PR run によってキャンセルされません。任意の `target_ref` input により、信頼された呼び出し元は、選択した dispatch ref の workflow file を使用しながら、そのグラフを branch、tag、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                        | ジョブ                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI ディスパッチと非正規リポジトリのフォールバック、CodeQL JavaScript/actions 品質スキャン、workflow-sanity、labeler、auto-response、CI 外の docs workflow、および Blacksmith マトリックスをより早く queue できるようにする install-smoke preflight                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低重み extension シャード、`checks-fast-core`、Plugin/チャネル契約シャード、ほとんどの bundled/低重み Linux Node シャード、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` シャード、および `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保持されている重い Linux Node スイート、boundary/extension が重い `check-additional-*` シャード、および `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（8 vCPU は節約分よりコストが大きいほど CPU に敏感）、install-smoke Docker build（32 vCPU の queue time は節約分よりコストが大きい）                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。fork は `macos-15` にフォールバック                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。fork は `macos-26` にフォールバック                                                                                                                                                                                                  |

## ランナー登録予算

OpenClaw の現在の GitHub runner-registration bucket は、`ghx api rate_limit` で 5 分あたり 10,000 件の self-hosted
runner registration を報告します。GitHub がこの bucket を変更する可能性があるため、各 tuning pass の前に
`actions_runner_registration` を再確認してください。この制限は
`openclaw` organization 内のすべての Blacksmith runner registration で共有されるため、別の Blacksmith installation を追加しても
新しい bucket は追加されません。

burst control では、Blacksmith label を希少リソースとして扱ってください。
route、notify、summarize、shard select のみを行うジョブや、短い CodeQL scan を実行するジョブは、
測定済みの Blacksmith 固有の必要性がない限り GitHub-hosted runner に留めるべきです。
新しい Blacksmith matrix、より大きな `max-parallel`、または高頻度 workflow は、
worst-case registration count を示し、org レベルの target を live bucket の約 60% 未満に保つ必要があります。
現在の 10,000-registration bucket では、これは 6,000-registration の operating target を意味し、
並行リポジトリ、retry、burst overlap のための余裕を残します。

正規リポジトリの CI は、通常の push および pull-request run で Blacksmith をデフォルトのランナーパスとして維持します。`workflow_dispatch` と非正規リポジトリの run は GitHub-hosted runner を使用しますが、通常の正規 run は現在、Blacksmith queue health を probe したり、Blacksmith が利用できない場合に GitHub-hosted label へ自動的にフォールバックしたりしません。

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

## OpenClaw パフォーマンス

`OpenClaw Performance` は、製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチでは通常、ワークフローの ref をベンチマークします。リリースタグまたは別ブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` には、テスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリングです。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターンです。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースにおける Gateway 起動時間とメモリ、バンドル済み Plugin のインポート RSS、模擬 OpenAI `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象 ref について以前に公開された mock-provider ソースレポートが利用できる場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーは、レポートバンドル内の `source/index.md` にあり、生の JSON はその横にあります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブのアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明用に `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカードレンダリング、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチします。stable と full のプロファイルには、常に網羅的な live/E2E と Docker リリースパス soak カバレッジが含まれます。beta プロファイルでは `run_release_soak=true` によってオプトインできます。正規のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補は重複したライブポーラーを開始しません。公開後は、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、再ビルドせずに出荷済み npm パッケージを再利用するために `release_package_spec` を渡します。公開済みパッケージの Telegram に絞った再実行にのみ `npm_telegram_package_spec` を使用します。Codex Plugin ライブパッケージレーンは、デフォルトで同じ選択状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行では選択された ref から `extensions/codex` をパックします。`npm:`、`npm-pack:`、`git:` 仕様などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、絞り込み再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、手動の変更を伴うリリースワークフローです。リリースタグが存在し、OpenClaw npm プリフライトが成功した後、`release/YYYY.M.PATCH` または `main` からディスパッチします。`pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にのみ保存済みの `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。stable 公開では、正確な `windows_node_tag` も必要です。このワークフローは、公開用の子ワークフローの前に Windows ソースリリースを検証し、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、同じ固定インストーラーダイジェストに加えて、正確なコンパニオンアセットとチェックサム契約を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットの証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` ではなく、ヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA ではありません。このヘルパーは、ターゲット SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証器も、いずれかの子ワークフローが異なる SHA で実行された場合は失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダーの幅を制御します。手動リリースワークフローのデフォルトは `stable` です。広範なアドバイザリプロバイダー/メディアマトリクスを意図的に必要とする場合にのみ `full` を使用します。stable と full のリリースチェックでは、常に網羅的な live/E2E と Docker リリースパス soak が実行されます。beta プロファイルでは `run_release_soak=true` によってオプトインできます。

- `minimum` は、最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は、stable プロバイダー/バックエンドセットを追加します。
- `full` は、広範なアドバイザリプロバイダー/メディアマトリクスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再確認し、各子実行について最も遅いジョブの表を追記します。子ワークフローを再実行して green になった場合は、アンブレラ結果とタイミングサマリーを更新するために、親の検証器ジョブだけを再実行します。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子だけには `ci`、Plugin プリリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはアンブレラ上のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、絞り込んだ修正後の失敗したリリースボックスの再実行を限定できます。1 つの失敗したクロス OS レーンでは、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。たとえば `windows/packaged-upgrade` です。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは、標準ランタイムツールカバレッジゲートを除きアドバイザリです。このゲートは、必要な OpenClaw 動的ツールが標準ティアサマリーからずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して選択 ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。soak カバレッジが実行される場合は、live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージバイトが一貫し、複数の子ジョブで同じ候補を再パックすることを避けられます。Codex npm-Plugin ライブレーンについては、リリースチェックは `release_package_spec` から導出された一致する公開済み Plugin 仕様を渡すか、オペレーター指定の `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトが選択チェックアウトの Codex Plugin をパックするようにします。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチ済みの子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろに残ることはありません。リリースブランチ/タグ検証と絞り込み再実行グループは、`cancel-in-progress: false` を維持します。

## ライブと E2E シャード

リリース live/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- プロバイダーフィルター済みの `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声/動画シャード、およびプロバイダーフィルター済みの音楽シャード

これにより、同じファイルカバレッジを保ちながら、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローによってビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` がプリインストールされています。メディアジョブは、セットアップ前にバイナリを検証するだけです。Docker ベースのライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブは、ネストされた Docker テストを起動する場所として適していません。

Docker ベースのライブモデル/バックエンドシャードは、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー分割 Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードは、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限を持つため、コンテナやクリーンアップ経路が停止しても、リリースチェック全体の予算を消費する代わりに高速に失敗します。これらのシャードがソース全体の Docker ターゲットを個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いには `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、その後それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` ではない場合に実行され、パッケージ受け入れが解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、引き続き公開済み npm spec をインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け入れます。公開済みプレリリース/安定版の受け入れにはこれを使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグをフェッチし、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離されたワークツリーに依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。この経路は URL 認証情報、デフォルト以外の HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済み IP、同じ公開安全ポリシーの外へのリダイレクトを拒否します。
- `source=trusted-url` は `.github/package-trusted-sources.json` 内の名前付き trusted-source ポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。設定済みのホスト、ポート、パスプレフィックス、リダイレクト先ホスト、またはプライベートネットワーク解決が必要な、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用します。ポリシーが bearer 認証を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL 埋め込み認証情報は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトには指定するべきです。

`workflow_ref` と `package_ref` は分離しておいてください。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスは古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリース経路チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec 経路はスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、パッケージ受け入れ入力、リリースデフォルト、失敗トリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、および `telegram_mode=mock-openai` でパッケージ受け入れを呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skills インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が、同じ解決済みパッケージ tarball 上に保たれます。ベータ公開後、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定すると、再ビルドせずに出荷済み npm パッケージに対して同じマトリクスを実行できます。パッケージ受け入れがリリース検証の残りとは異なるパッケージを必要とする場合にのみ `package_acceptance_package_spec` を設定します。クロス OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証はパッケージ受け入れから開始するべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリース経路で実行ごとに 1 つの公開済みパッケージベースラインを検証します。パッケージ受け入れでは、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択し、デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 つの安定版 npm リリースに加えて、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに関する、固定された Plugin 互換性境界リリースと issue 形状のフィクスチャへ拡張します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに個別の対象 Docker ランナージョブへシャード化されます。別個の `Update Migration` ワークフローは、問いが通常の Full Release CI の広さではなく、公開済み更新のクリーンアップを網羅することにある場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定して `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すこと、`openclaw@2026.4.15` のように `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持すること、またはシナリオマトリクス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定することができます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、`summary.json` にレシピ手順を記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows パッケージ版とインストーラーの fresh レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合はデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.5` を使用します。そのため、GPT-4.x デフォルトを避けながら、インストールと Gateway 証明は GPT-5 テストモデル上に保たれます。

### レガシー互換性ウィンドウ

パッケージ受け入れには、すでに公開済みのパッケージ向けに境界付きのレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性経路を使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 派生の偽 git フィクスチャから欠落した pnpm `patchedDependencies` を刈り込む場合があり、永続化された `update.channel` の欠落をログ出力する場合があります。
- Plugin smoke は、レガシーのインストールレコード場所を読む場合や、marketplace インストールレコード永続化の欠落を許容する場合があります。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許可する場合があります。

公開済みの `2026.4.26` パッケージも、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告を出す場合があります。それ以降のパッケージは現代の契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます。`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行する代わりに、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージ面、同梱Pluginパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャネル/Gateway/Plugin SDK 面に触れる pull request で実行されます。ソースのみの同梱Plugin変更、テストのみの編集、docs のみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete shared-workspace CLI スモークを実行し、container gateway-network e2e を実行し、同梱拡張機能の build arg を検証し、240 秒の集約コマンドタイムアウト内で境界づけられた同梱Plugin Docker プロファイルを実行します（各シナリオの Docker run は個別に上限設定されます）。
- **フルパス**は、QR パッケージインストールとインストーラー Docker/update カバレッジを、nightly scheduled runs、手動 dispatch、workflow-call release checks、そして本当に installer/package/Docker 面に触れる pull request のために保持します。フルモードでは、install-smoke が target-SHA GHCR ルート Dockerfile スモークイメージを1つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、installer/update スモーク、高速同梱Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待たされません。

`main` への push（merge commit を含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フル install smoke は nightly またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。nightly スケジュールと release checks ワークフローから実行され、手動の `Install Smoke` dispatch では opt in できますが、pull request と `main` push では実行されません。通常の PR CI では、Node 関連の変更に対して高速 Bun ランチャー回帰レーンが引き続き実行されます。QR と installer Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを1つ事前ビルドし、OpenClaw を npm tarball として一度だけパックし、共有の `scripts/e2e/Dockerfile` イメージを2つビルドします。

- installer/update/plugin-dependency レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールスロット数。                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーが throttling しないようにする同時 live レーン上限。                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon の create storm を避けるためのレーン開始間隔。ずらしなしには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。agents が失敗した1レーンを再現できるよう cleanup smoke をスキップします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、longest-first 順序付け用にレーン所要時間を永続化し、デフォルトでは最初の失敗後に新しい pooled レーンのスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、どのパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub outputs と summaries に変換します。`scripts/package-openclaw-for-docker.mjs` 経由で OpenClaw をパックするか、現在の run のパッケージ artifact をダウンロードするか、`package_artifact_run_id` からパッケージ artifact をダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は、Blacksmith の Docker layer cache を通じて package-digest-tagged の bare/functional GHCR Docker E2E イメージをビルドして push します。また、再ビルドの代わりに、提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力、または既存の package-digest イメージを再利用します。Docker image pull は、registry/cache stream が詰まっても CI critical path の大半を消費せず素早く再試行できるよう、試行ごとに境界づけられた 180 秒タイムアウトでリトライされます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さな chunked jobs として実行されます。各チャンクは必要なイメージ種別だけを pull し、同じ weighted scheduler を通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`package-update-openai` には live Codex plugin package レーンが含まれ、candidate OpenClaw パッケージをインストールし、`codex_plugin_spec` または同一 ref tarball から Codex Plugin を明示的な Codex CLI インストール承認付きでインストールし、Codex CLI preflight を実行し、その後 OpenAI に対して同一セッションの OpenClaw agent turn を複数実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 plugin/runtime alias のままです。`install-e2e` レーン alias は、両方のプロバイダーインストーラーレーン向けの集約手動 rerun alias のままです。

OpenWebUI は、フル release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみの dispatch の場合だけ standalone の `openwebui` チャンクを維持します。同梱チャネル update レーンは、一時的な npm ネットワーク失敗に対して一度リトライします。

各チャンクは、レーンログ、timings、`summary.json`、`failures.json`、フェーズ timings、スケジューラープラン JSON、slow-lane テーブル、レーンごとの rerun コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択レーンを実行します。これにより、失敗レーンのデバッグは対象を絞った1つの Docker ジョブに境界づけられ、その run 用のパッケージ artifact を準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその rerun 用に live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub rerun コマンドには、値が存在する場合 `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗 run とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # Docker artifact をダウンロードし、統合/レーンごとの対象 rerun コマンドを出力
pnpm test:docker:timings <summary>   # slow-lane とフェーズ critical-path の summary
```

スケジュールされた live/E2E ワークフローは、フル release-path Docker suite を毎日実行します。

## Plugin Prerelease

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジのため、`Full Release Validation` または明示的なオペレーターによって dispatch される別ワークフローです。通常の pull request、`main` push、standalone の手動 CI dispatch では、この suite はオフのままです。同梱Pluginテストを8つの extension worker に分散します。これらの extension shard jobs は、グループごとに1つの Vitest worker と大きめの Node heap で、最大2つの Plugin config group を同時に実行するため、import-heavy な Plugin batch が追加の CI job を作成しません。release-only Docker prerelease path は、1〜3分のジョブのために多数の runner を予約しないよう、対象 Docker レーンを小さなグループに batch します。このワークフローは `@openclaw/plugin-inspector` からの情報提供用 `plugin-inspector-advisory` artifact もアップロードします。inspector findings は triage input であり、blocking の Plugin Prerelease gate は変更しません。

## QA Lab

QA Lab には、メインの smart-scoped workflow の外に専用 CI レーンがあります。Agentic parity は broad QA と release harness の下にネストされており、standalone PR workflow ではありません。parity を broad validation run に同乗させる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使います。

- `QA-Lab - All Lanes` ワークフローは `main` で nightly に、また手動 dispatch で実行されます。mock parity レーン、live Matrix レーン、live Telegram レーンと Discord レーンを並列ジョブとして fan out します。live jobs は `qa-live-shared` environment を使い、Telegram/Discord は Convex lease を使います。

Release checks は、決定的 mock provider と mock-qualified models（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram の live transport レーンを実行し、チャネル契約を live model latency と通常の provider-plugin startup から分離します。live transport gateway は、QA parity が memory behavior を別途カバーするため、memory search を無効化します。provider connectivity は、別の live model、native provider、Docker provider suite によってカバーされます。

Matrix は scheduled gate と release gate で `--profile fast` を使い、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI デフォルトと手動ワークフロー入力は `all` のままです。手動 `matrix_profile=all` dispatch は、常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブに shard します。

`OpenClaw Release Checks` は、リリース承認前に release-critical な QA Lab レーンも実行します。その QA parity gate は candidate と baseline pack を並列レーンジョブとして実行し、その後最終 parity comparison 用の小さな report job に両方の artifact をダウンロードします。

通常の PR では、parity を必須 status として扱うのではなく、scoped CI/check evidence に従います。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体の sweep ではなく、意図的に狭い first-pass security scanner です。daily、manual、non-draft pull request guard run は、Actions workflow code と、最もリスクの高い JavaScript/TypeScript 面を、高/重大の `security-severity` にフィルタされた高信頼 security queries でスキャンします。

pull request guard は軽量なままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始し、scheduled workflow と同じ高信頼 security matrix を実行します。Android と macOS CodeQL は PR デフォルトから外れています。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加えて、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフロー健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、アップロードされる SARIF から依存関係のビルド結果を除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置かれています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。狭く価値の高いサーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを GitHub ホストの Linux ランナー上で実行するため、品質スキャンが Blacksmith ランナー登録予算を消費しません。そのプルリクエストガードは、スケジュールプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルと同梱チャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードだけを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルと同梱チャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着部、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティと分離されています。これにより、品質の検出結果を、セキュリティシグナルを曖昧にせずにスケジュール、測定、無効化、拡張できます。Swift、Python、同梱 Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、スコープ付きまたはシャード化されたフォローアップ作業として戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存のドキュメントを揃え続けるための、イベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の bot 以外による push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。workflow-run 呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップします。実行時には、前回スキップされなかった Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント通過以降に蓄積されたすべての main 変更を対象にできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の bot 以外による push CI 実行が成功するとトリガーできますが、別の workflow-run 呼び出しがその UTC 日にすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、この日次アクティビティゲートを迂回します。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせます。その後、フルスイートレポートを再実行し、成功しているベースラインテスト数を減らす変更を拒否します。グループ化レポートは Linux と macOS で設定ごとのウォール時間と最大 RSS を記録するため、前後比較で期間の差分と並んでテストメモリの差分が見えるようになります。ベースラインに失敗テストがある場合、Codex は明らかな失敗だけを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格する必要があります。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo の安全姿勢を維持できるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップのための手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR をクローズします。GitHub を変更する前に、取り込まれた PR がマージ済みであり、各重複 PR に共有の参照 Issue または重複する変更 hunk のどちらかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。

- コア本番変更は、コア本番とコアテストの typecheck に加えて、コア lint/guards を実行します。
- コアのテストのみの変更は、コアテストの typecheck に加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの typecheck に加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの typecheck に加えて、extension lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存しているため、extension typecheck まで拡張します（Vitest extension sweep は明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明な root/設定変更は、安全側に倒してすべてのチェックレーンを失敗させます。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそのテスト自体を実行し、ソース編集では明示的なマッピングを優先し、その後に sibling テストと import graph の依存先を使います。共有 group-room 配信設定は明示的マッピングの 1 つです。グループの visible-reply 設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR push 前に失敗します。`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` は、変更が harness 全体に及ぶため、低コストのマッピング済みセットを信頼できる proxy と見なせない場合にのみ使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有の remote-box ラッパーです。ローカル編集ループには広すぎるチェック、CI との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能な box、リモートログが必要な場合は、リポジトリルートから使用します。通常の OpenClaw backend は `blacksmith-testbox` です。所有 AWS/Hetzner キャパシティは、Blacksmith 障害、クォータ問題、または明示的な所有キャパシティテストのためのフォールバックです。

Crabbox backed の Blacksmith 実行は、一回限りの Testbox をウォームアップ、確保、同期、実行、レポート、クリーンアップします。組み込みの同期健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合や、`git status --short` が少なくとも 200 件の追跡済み削除を示す場合に即座に失敗します。意図的な大規模削除 PR では、リモートコマンドに `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

Crabbox は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定するか、通常より大きなローカル差分ではより大きなミリ秒値を使用してください。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を通知しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーを明示的に渡してください。Codex worktree やリンク済み/スパース checkout では、Crabbox が開始する前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトは避け、代わりに node ラッパーを直接呼び出してください。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith backed の実行では、ラッパーが現在の Testbox の同期、キュー、クリーンアップ動作を得られるように Crabbox 0.22.0 以降が必要です。兄弟 checkout を使う場合は、タイミング測定や証拠作業の前に、無視対象のローカルバイナリを再ビルドしてください。

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

最後の JSON サマリーを読んでください。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委任された Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行は hydration と keepalive を所有します。SSH コマンドがすでに戻った後に Testbox が外部から停止された場合、`cancelled` として終了することがあります。ラッパーの `exitCode` がゼロ以外であるか、コマンド出力が失敗したテストを示していない限り、それはクリーンアップ/ステータスの成果物として扱ってください。一回限りの Blacksmith backed Crabbox 実行では、Testbox は自動的に停止されるはずです。実行が中断された場合やクリーンアップが不明確な場合は、稼働中の box を調べ、自分が作成した box だけを停止してください。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydration 済み box で意図的に複数のコマンドが必要な場合にのみ、再利用を使ってください。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れているレイヤーで、Blacksmith 自体は動作する場合は、`list`、`status`、クリーンアップなどの診断に限って直接 Blacksmith を使ってください。直接 Blacksmith 実行をメンテナー証拠として扱う前に、Crabbox 経路を修正してください。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、請求、または org 制限の圧迫として扱ってください。自分が作成した queued ID を停止し、追加の Testbox の開始は避け、誰かが Blacksmith ダッシュボード、請求、org 制限を確認している間に、証拠作業を下の所有 Crabbox 容量経路へ移してください。

Blacksmith が停止している、クォータ制限を受けている、必要な環境がない、または所有容量が明示的な目的である場合にのみ、所有 Crabbox 容量へエスカレーションしてください。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS の圧迫下では、そのタスクが本当に 48xlarge クラスの CPU を必要としない限り `class=beast` は避けてください。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は、`standard`、複数の容量リージョン、`capacity.hints: true` をデフォルトにしているため、仲介された AWS lease は選択されたリージョン/マーケット、クォータ圧迫、Spot フォールバック、高圧クラス警告を出力します。より重い広範なチェックには `fast` を使い、standard/fast では不十分な場合にのみ `large` を使い、`beast` はフルスイートや全 Plugin Docker マトリックス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングのような例外的な CPU バウンド lane にのみ使ってください。`pnpm check:changed`、絞り込んだテスト、docs のみの作業、通常の lint/typecheck、小さな E2E 再現、Blacksmith 障害トリアージには `beast` を使わないでください。容量診断には、Spot マーケットの変動がシグナルに混ざらないように `--market on-demand` を使ってください。

`.crabbox.yaml` は、所有クラウド lane のプロバイダー、同期、GitHub Actions hydration デフォルトを所有します。これはローカルの `.git` を除外するため、hydration された Actions checkout は、メンテナーのローカル remote やオブジェクトストアを同期する代わりに、自身の remote Git メタデータを保持します。また、転送されるべきでないローカル runtime/build 成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、checkout、Node/pnpm セットアップ、`origin/main` fetch、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けの非 secret 環境引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
