---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - GitHub Actions チェックの失敗をデバッグしている
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CIジョブグラフ、スコープゲート、リリース包括、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-05T01:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1420bd233290e4377b73dea864253eeb3e57b5cd626698305546bcac691840c0
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべてのプルリクエストで実行されます。正規の
`main` push は、まず 90 秒の hosted-runner 受け入れウィンドウを通過します。
既存の `CI` concurrency group は、より新しいコミットが到着するとその待機中の実行をキャンセルするため、連続した merge がそれぞれ完全な Blacksmith
matrix を登録することはありません。プルリクエストと手動 dispatch は待機をスキップします。その後、`preflight` job が diff を分類し、関係のない領域だけが変更された場合は高コストの lane を無効にします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のため、意図的にスマートなスコープ制御を迂回してグラフ全体へ fan out します。Android lane は `include_android` による opt-in のままです。リリース専用の Plugin カバレッジは、別個の [`Plugin プレリリース`](#plugin-prerelease)
workflow にあり、[`完全リリース検証`](#full-release-validation)
または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| Job                                | 目的                                                                                                      | 実行タイミング                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only 変更、変更スコープ、変更された extensions を検出し、CI manifest を構築する                     | draft ではない push と PR では常に                 |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` push に対して hosted 90 秒 debounce を行う                | すべての CI 実行。sleep は正規の `main` push のみ  |
| `security-fast`                    | private key 検出、`zizmor` による変更 workflow audit、production lockfile audit                          | draft ではない push と PR では常に                 |
| `check-dependencies`               | Production Knip の dependency-only pass と unused-file allowlist guard                                   | Node 関連の変更                                    |
| `build-artifacts`                  | `dist/`、Control UI、built-CLI smoke checks、embedded built-artifact checks、再利用可能な artifacts を build | Node 関連の変更                                    |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI-routing checks などの高速 Linux correctness lane                      | Node 関連の変更                                    |
| `checks-fast-contracts-plugins-*`  | 2 shard の Plugin contract checks                                                                         | Node 関連の変更                                    |
| `checks-fast-contracts-channels-*` | 2 shard の channel contract checks                                                                        | Node 関連の変更                                    |
| `checks-node-core-*`               | channel、bundled、contract、extension lane を除く Core Node test shards                                  | Node 関連の変更                                    |
| `check-*`                          | prod types、lint、guards、test types、strict smoke の sharded main local gate 相当                       | Node 関連の変更                                    |
| `check-additional-*`               | Architecture、sharded boundary/prompt drift、extension guards、package boundary、runtime topology        | Node 関連の変更                                    |
| `checks-node-compat-node22`        | Node 22 compatibility build と smoke lane                                                                 | リリース向けの手動 CI dispatch                     |
| `check-docs`                       | Docs formatting、lint、broken-link checks                                                                 | Docs が変更された場合                              |
| `skills-python`                    | Python backed Skills 向けの Ruff + pytest                                                                 | Python-skill 関連の変更                            |
| `checks-windows`                   | Windows 固有の process/path tests と shared runtime import specifier regressions                         | Windows 関連の変更                                 |
| `macos-node`                       | 共有 built artifacts を使用する macOS TypeScript test lane                                               | macOS 関連の変更                                   |
| `macos-swift`                      | macOS app 向けの Swift lint、build、tests                                                                 | macOS 関連の変更                                   |
| `ios-build`                        | Xcode project generation と iOS app simulator build                                                       | iOS app、shared app kit、または Swabble の変更     |
| `android`                          | 両 flavor の Android unit tests と debug APK build 1 件                                                   | Android 関連の変更                                 |
| `test-performance-agent`           | trusted activity 後の日次 Codex slow-test optimization                                                    | Main CI success または手動 dispatch                |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 live lane を含む日次/on-demand Kova runtime performance reports     | scheduled と手動 dispatch                          |

## Fail-fast の順序

1. `runner-admission` は正規の `main` push に対してのみ待機します。より新しい push は、Blacksmith 登録前に実行をキャンセルします。
2. `preflight` は、どの lane がそもそも存在するかを決定します。`docs-scope` と `changed-scope` logic はこの job 内の step であり、独立した job ではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い artifact と platform matrix job を待たずに素早く失敗します。
4. `build-artifacts` は高速 Linux lane と重ねて実行されるため、共有 build の準備ができ次第、下流の consumer を開始できます。
5. その後、より重い platform と runtime lane が fan out します: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しい push が到着すると、GitHub は置き換えられた job を `cancelled` として mark することがあります。同じ ref の最新実行も失敗しているのでない限り、これは CI noise として扱ってください。Matrix job は `fail-fast: false` を使用し、`build-artifacts` は embedded channel、core-support-boundary、gateway-watch の失敗を、小さな verifier job に queue する代わりに直接報告します。自動 CI concurrency key は versioned (`CI-v7-*`) なので、古い queue group にある GitHub 側 zombie が新しい main 実行を無期限に block することはありません。手動 full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅い job、失敗、`pnpm-store-warmup` fanout barrier を要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。CI は同じ run summary を `ci-timings-summary` artifact としても upload します。build timing については、`build-artifacts` job の `Build dist` step を確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。この job は `startup-memory` artifact も upload します。

プルリクエスト実行では、terminal timing-summary job は `GH_TOKEN` を `gh run view` に渡す前に、trusted base revision から helper を実行します。これにより、token を使う query を branch-controlled code の外に保ちながら、プルリクエストの現在の CI 実行を要約できます。

## PR コンテキストと証拠

外部 contributor の PR は、
`.github/workflows/real-behavior-proof.yml` から PR context と evidence gate を実行します。この workflow は trusted
base commit を checkout し、PR body のみを評価します。contributor branch のコードは実行しません。

この gate は、repository owner、member、collaborator、bot ではない PR author に適用されます。PR body に author が書いた
`What Problem This Solves` と `Evidence` sections が含まれている場合に pass します。Evidence には、focused
test、CI result、screenshot、recording、terminal output、live observation、
redacted log、artifact link を使用できます。body は意図と有用な検証を提供します。reviewer は code、tests、CI を inspect して correctness を評価します。

check が失敗した場合は、別の code commit を push するのではなく PR body を更新してください。

## スコープとルーティング

Scope logic は `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests で cover されています。Manual dispatch は changed-scope detection をスキップし、すべての scoped area が変更されたかのように preflight manifest を動作させます。

- **CI workflow edits** は Node CI graph と workflow linting を検証しますが、それ自体では Windows、iOS、Android、macOS native build を強制しません。これらの platform lane は platform source changes に scope されたままです。
- **Workflow Sanity** は `actionlint`、すべての workflow YAML files に対する `zizmor`、composite-action interpolation guard、conflict-marker guard を実行します。PR-scoped の `security-fast` job も変更された workflow files に対して `zizmor` を実行するため、workflow security findings は main CI graph の早い段階で失敗します。
- **`main` push 上の Docs** は、CI と同じ ClawHub docs mirror を使う standalone `Docs` workflow によって check されるため、code+docs が混在する push が CI `check-docs` shard も queue することはありません。プルリクエストと手動 CI では、docs が変更された場合に CI から `check-docs` が引き続き実行されます。
- **TUI PTY** は TUI 変更向けに `checks-node-core-runtime-tui-pty` Linux Node shard で実行されます。この shard は `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` で `test/vitest/vitest.tui-pty.config.ts` を実行するため、deterministic な `TuiBackend` fixture lane と、external model endpoint のみを mock する、より遅い `tui --local` smoke の両方を cover します。
- **CI routing-only edits、selected cheap core-test fixture edits、narrow plugin contract helper/test-routing edits** は、高速 Node-only manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task。この path は、変更が fast task が直接 exercise する routing または helper surface に限定される場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrappers、npm/pnpm/UI runner helpers、package manager config、およびその lane を実行する CI workflow surface に scope されます。関係のない source、plugin、install-smoke、test-only changes は Linux Node lane のままです。

最も遅い Node テストファミリーは分割またはバランス調整され、ランナーを過剰に予約せずに各ジョブを小さく保つようになっています。Plugin contracts と channel contracts はそれぞれ、標準の GitHub runner フォールバックを備えた 2 つの重み付き Blacksmith-backed シャードとして実行され、core unit fast/support レーンは個別に実行されます。core runtime infra は state、process/config、shared、3 つの cron ドメインシャードに分割され、auto-reply はバランス調整されたワーカーとして実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/server config は、ビルド済みアーティファクトを待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されます。通常の CI はその後、分離された infra include-pattern シャードのみを最大 64 テストファイルの決定的なバンドルに詰め込み、non-isolated command/cron、stateful agents-core、gateway/server スイートをマージせずに Node マトリックスを削減します。重い固定スイートは 8 vCPU のままにし、バンドル済みおよび低重みのレーンは 4 vCPU を使用します。正規リポジトリのプルリクエストでは、追加のコンパクトな admission plan を使用します。同じ config ごとのグループが現在の 34 ジョブ Linux Node plan 内の分離されたサブプロセスで実行されるため、単一の PR が 70 ジョブ超の Node マトリックス全体を登録しません。`main` push、手動 dispatch、release gate はフルマトリックスを維持します。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使用します。Include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional-*` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard リストは、prompt-heavy シャード 1 つと、残りの guard stripe 用の combined シャード 1 つに分割され、それぞれが選択された独立 guard を並行実行し、check ごとのタイミングを出力します。高コストな Codex happy-path prompt snapshot drift check は、手動 CI と prompt に影響する変更のみで独自の追加ジョブとして実行されるため、通常の無関係な Node 変更は cold prompt snapshot generation の後ろで待たず、boundary シャードはバランスを保ちながら、prompt drift はそれを引き起こした PR に固定されます。同じフラグにより、built-artifact core support-boundary シャード内の prompt snapshot Vitest generation もスキップされます。Gateway watch、channel tests、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

admit された後、正規 Linux CI は最大 24 の Node テストジョブの並行実行を許可し、
小さめの fast/check レーンでは 12 を許可します。Windows と Android は
ランナープールが狭いため 2 のままです。

コンパクトな PR plan は現在のスイートに対して 18 個の Node ジョブを出力します。whole-config
グループは 120 分の batch timeout を持つ分離されたサブプロセスにまとめられ、
include-pattern グループは同じ制限付きジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play debug APK をビルドします。third-party flavor には個別の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きで flavor をコンパイルしますが、Android 関連の各 push で重複した debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install のために pnpm の minimum release age を無効化した production Knip dependency-only pass）と `pnpm deadcode:unused-files` を実行します。後者は Knip の production unused-file 検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が未レビューの新しい未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡す target-side bridge です。信頼されていないプルリクエストコードをチェックアウトしたり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request review request 用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper command 用の `clawsweeper_comment`;
- `main` push 上の commit-level review request 用の `clawsweeper_commit_review`;
- ClawSweeper agent が調査する可能性のある一般的な GitHub activity 用の `github_activity`。

`github_activity` レーンは正規化されたメタデータのみを転送します。event type、action、actor、repository、item number、URL、title、state、および存在する場合は comment または review の短い抜粋です。意図的に webhook body 全体の転送を避けます。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的なアクティビティは観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、そのイベントが意外、actionable、リスクあり、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常の review traffic は `NO_REPLY` になるべきです。

この経路全体で、GitHub title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱います。これらは要約とトリアージの入力であり、workflow や agent runtime への指示ではありません。

## 手動 dispatch

手動 CI dispatch は通常の CI と同じジョブグラフを実行しますが、Android 以外のすべての scoped lane を強制的に有効にします。Linux Node shards、bundled-plugin shards、plugin and channel contract shards、Node 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python skills、Windows、macOS、iOS build、Control UI i18n です。スタンドアロンの手動 CI dispatch は `include_android=true` の場合のみ Android を実行します。full release umbrella は `include_android=true` を渡すことで Android を有効にします。Plugin prerelease static checks、release-only `agentic-plugins` shard、full extension batch sweep、plugin prerelease Docker lane は CI から除外されます。Docker prerelease suite は、`Full Release Validation` が release-validation gate を有効にして別個の `Plugin Prerelease` ワークフローを dispatch した場合のみ実行されます。

手動実行は一意の concurrency group を使用するため、release-candidate full suite が同じ ref 上の別の push または PR run によってキャンセルされません。任意の `target_ref` input により、信頼された caller は、選択された dispatch ref の workflow file を使用しながら、そのグラフを branch、tag、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

月次 npm-only extended-stable path は例外です。`OpenClaw NPM
Release` preflight と `Full Release Validation` の両方を正確な
`extended-stable/YYYY.M.33` branch から dispatch し、それらの run ID を保持し、両方の ID を
direct npm publish run に渡します。コマンド、正確な identity 要件、registry readback、selector
repair procedure については、[月次 npm-only extended-stable
publication](/ja-JP/reference/RELEASING#monthly-npm-only-extended-stable-publication) を参照してください。
この path は plugin、macOS、Windows、GitHub
Release、private dist-tag、その他の platform publication を dispatch しません。

## ランナー

| ランナー                        | ジョブ                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI dispatch と非正規リポジトリのフォールバック、CodeQL JavaScript/actions quality scan、workflow-sanity、labeler、auto-response、CI 外の docs workflow、および Blacksmith matrix をより早く queue できるようにする install-smoke preflight                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低重み extension shard、QA Smoke CI を除く `checks-fast-core`、plugin/channel contract shard、大半の bundled/lower-weight Linux Node shard、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` shard、および `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持されている重い Linux Node suite、boundary/extension-heavy `check-additional-*` shard、および `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI と Testbox の `build-artifacts`、`check-lint`（8 vCPU では節約分よりコストが大きいほど CPU-sensitive）、install-smoke Docker build（32-vCPU queue time は節約分よりコストが大きい）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。fork は `macos-15` にフォールバック                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。fork は `macos-26` にフォールバック                                                                                                                                                                                                                     |

## ランナー登録予算

OpenClaw の現在の GitHub runner-registration bucket は、`ghx api rate_limit` で
5 分あたり 10,000 件の self-hosted runner registration を報告します。GitHub がこの bucket を変更する可能性があるため、各 tuning pass の前に
`actions_runner_registration` を再確認してください。この制限は
`openclaw` organization 内のすべての Blacksmith runner registration で共有されるため、
別の Blacksmith installation を追加しても新しい bucket は追加されません。

burst control の希少リソースとして Blacksmith label を扱います。
route、notify、summarize、shard selection、短い CodeQL scan のみを行うジョブは、
測定済みの Blacksmith-specific な必要性がない限り、GitHub-hosted runner に留めるべきです。
新しい Blacksmith matrix、より大きい `max-parallel`、または高頻度 workflow は、
worst-case registration count を示し、org-level target を live bucket の約 60% 未満に保つ必要があります。
現在の 10,000-registration bucket では、これは 6,000-registration operating target を意味し、
並行リポジトリ、retry、burst overlap の余裕を残します。

正規リポジトリ CI は、通常の push と pull-request run のデフォルト runner path として Blacksmith を維持します。`workflow_dispatch` と非正規リポジトリの run は GitHub-hosted runner を使用しますが、通常の正規 run は現在、Blacksmith queue health を probe したり、Blacksmith が利用できない場合に GitHub-hosted label へ自動フォールバックしたりしません。

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

## OpenClaw Performance

`OpenClaw Performance` は、製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチでは通常、ワークフロー参照をベンチマークします。リリースタグや、現在のワークフロー実装を持つ別ブランチをベンチマークするには、`target_ref` を設定します。公開されるレポートパスと最新ポインターは、テスト対象の参照をキーにします。各 `index.md` には、テスト対象の参照/SHA、ワークフロー参照/SHA、Kova 参照、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターが記録されます。

このワークフローは、固定されたリリースから OCM をインストールし、`openclaw/Kova` から固定された `kova_ref` 入力の Kova をインストールしてから、3 つのレーンを実行します。

- `mock-provider`: 決定的な偽の OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースのプロファイリングです。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターンです。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。対象は、デフォルト、フック、50 Plugin 起動ケースでの Gateway 起動時間とメモリ、バンドル Plugin のインポート RSS、モック OpenAI を使った `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象の参照について、前回公開された mock-provider ソースレポートが利用できる場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、その横に生 JSON があります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローはさらに `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトを `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下の `openclaw/clawgrit-reports` にコミットします。現在のテスト対象参照ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカードレンダリング、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable と full プロファイルは常に、網羅的なライブ/E2E と Docker リリースパスのソークカバレッジを含みます。beta プロファイルは `run_release_soak=true` でオプトインできます。正規のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補は重複するライブポーラーを開始しません。公開後は、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、再ビルドせずに出荷済み npm パッケージを再利用するために `release_package_spec` を渡します。フォーカスした公開済みパッケージの Telegram 再実行にのみ `npm_telegram_package_spec` を使います。Codex Plugin ライブパッケージレーンは、デフォルトで同じ選択状態を使います。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行では選択された参照から `extensions/codex` をパックします。`npm:`、`npm-pack:`、`git:` 仕様などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、フォーカスした再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、手動の変更を伴うリリースワークフローです。リリースタグが存在し、OpenClaw npm プリフライトが成功した後に、`release/YYYY.M.PATCH` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージについて `Plugin NPM Release` をディスパッチし、同じリリース SHA について `Plugin ClawHub Release` をディスパッチし、その後で保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。stable 公開では、正確な `windows_node_tag` も必要です。ワークフローは、どの公開子ワークフローより前にも Windows ソースリリースを検証し、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、同じ固定済みインストーラーダイジェスト、正確なコンパニオンアセット、チェックサム契約を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチ上で固定コミット証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使います。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ参照はブランチまたはタグである必要があり、生のコミット SHA ではありません。このヘルパーは、ターゲット SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、その固定参照から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが異なる SHA で実行された場合に失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な助言用プロバイダー/メディアマトリクスを意図的に必要とする場合にのみ `full` を使います。stable と full のリリースチェックは、常に網羅的なライブ/E2E と Docker リリースパスのソークを実行します。beta プロファイルは `run_release_soak=true` でオプトインできます。

- `minimum` は、最速の OpenAI/コアのリリースクリティカルなレーンを維持します。
- `stable` は、stable のプロバイダー/バックエンドセットを追加します。
- `full` は、広範な助言用プロバイダー/メディアマトリクスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行について最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、アンブレラ結果とタイミングサマリーを更新するために、親の検証ジョブだけを再実行します。

リカバリー用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け取ります。リリース候補には `all`、通常の完全 CI 子だけには `ci`、Plugin プレリリース子だけには `plugin-prerelease`、すべてのリリース子には `release-checks` を使います。または、アンブレラ上で `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` のようなより狭いグループを使います。これにより、フォーカスした修正後の失敗したリリースボックス再実行を限定できます。1 つの失敗したクロス OS レーンには、たとえば `windows/packaged-upgrade` のように、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは、標準ランタイムツールカバレッジゲートを除き助言扱いです。このゲートは、必須の OpenClaw 動的ツールが標準ティアサマリーからずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼済みワークフロー参照を使って選択参照を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。ソークカバレッジが実行される場合は、ライブ/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージバイト列の一貫性を保ち、複数の子ジョブで同じ候補を再パックすることを避けます。Codex npm Plugin ライブレーンでは、リリースチェックは `release_package_spec` から導出された一致する公開済み Plugin 仕様を渡すか、オペレーター指定の `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトに選択チェックアウトの Codex Plugin をパックさせます。

`ref=main` と `rerun_group=all` の重複する `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをすべてキャンセルします。そのため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機しません。リリースブランチ/タグ検証とフォーカスした再実行グループは、`cancel-in-progress: false` を維持します。

## ライブと E2E シャード

リリースのライブ/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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
- 分割されたメディア音声/動画シャードとプロバイダーフィルター済み音楽シャード

これにより、同じファイルカバレッジを維持しながら、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも有効なままです。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリだけを検証します。Docker バックのライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストされた Docker テストを起動する場所として適していません。

Docker によるライブモデル/バックエンドシャードは、選択されたコミットごとに個別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー別 Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があるため、コンテナやクリーンアップ経路が停止した場合でも、リリースチェック全体の予算を消費せずに早期失敗します。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージはプロダクトとして動作するか」を確認する場合は `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証する一方、パッケージ受け入れは、ユーザーがインストールまたは更新後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択した場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` ではない場合に実行され、パッケージ受け入れがパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け入れます。公開済みの extended-stable、プレリリース、または stable の受け入れに使用します。
- `source=ref` は信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離ワークツリーに依存関係をインストールして、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。この経路は、URL 認証情報、デフォルトではない HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済み IP、同じ公開安全ポリシーの外部へのリダイレクトを拒否します。
- `source=trusted-url` は `.github/package-trusted-sources.json` 内の名前付き trusted-source ポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。これは、設定済みホスト、ポート、パスプレフィックス、リダイレクトホスト、またはプライベートネットワーク解決が必要な、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用します。ポリシーが bearer 認証を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL に埋め込まれた認証情報は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスは、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui` を追加
- `full` — OpenWebUI を含む完全な Docker リリース経路チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開パッケージ検証はライブ ClawHub の可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、スタンドアロンディスパッチ用には公開済み npm spec 経路を維持します。

ローカルコマンド、Docker レーン、パッケージ受け入れ入力、リリースデフォルト、失敗トリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` でパッケージ受け入れを呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub skill インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram の証跡が、同じ解決済みパッケージ tarball 上に保持されます。beta 公開後に Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定すると、再ビルドせずに出荷済み npm パッケージに対して同じマトリクスを実行できます。パッケージ受け入れが他のリリース検証とは異なるパッケージを必要とする場合のみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新のプロダクト検証はパッケージ受け入れから始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリース経路で、1 回の実行につき 1 つの公開済みパッケージベースラインを検証します。パッケージ受け入れでは、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の stable npm リリースに加えて、Feishu config、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダ付きログパス、古いレガシー Plugin 依存関係ルート向けの、固定された Plugin 互換性境界リリースと issue 形状のフィクスチャに広げます。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに個別の対象 Docker runner ジョブへシャーディングされます。別個の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、公開済み更新の徹底的なクリーンアップが問題である場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定した `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、シナリオマトリクス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスを検査します。Windows のパッケージ済みレーンとインストーラーのフレッシュレーンも、インストール済みパッケージが生の絶対 Windows パスから browser-control override をインポートできることを検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトとし、それ以外は `openai/gpt-5.5` を使用します。そのため、GPT-4.x のデフォルトを避けつつ、インストールと Gateway の証跡は GPT-5 テストモデル上に維持されます。

### レガシー互換性ウィンドウ

パッケージ受け入れには、既に公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性経路を使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の疑似 git フィクスチャから欠落している pnpm `patchedDependencies` を削除する場合があり、永続化された `update.channel` の欠落をログに記録する場合があります。
- Plugin smoke は、レガシーのインストールレコード場所を読み取る場合や、marketplace インストールレコード永続化の欠落を許容する場合があります。
- `plugin-update` は、インストールレコードと再インストールなしの動作を変更しないことを引き続き要求しつつ、config メタデータ移行を許可する場合があります。

公開済みの `2026.4.26` パッケージは、既に出荷済みのローカルビルドメタデータスタンプファイルについて警告する場合もあります。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

# Validate the published extended-stable package with package coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを確認します。`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージのサーフェス、バンドル済み Plugin のパッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、docs のみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI smoke を実行し、container gateway-network e2e を実行し、バンドル済み拡張機能の build arg を検証し、240 秒の集約コマンドタイムアウト内で境界づけられた bundled-plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **フルパス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そして installer/package/Docker サーフェスに実際に触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/update カバレッジを保持します。フルモードでは、install-smoke が target-SHA の GHCR ルート Dockerfile smoke イメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway smoke、インストーラー/update smoke、高速 bundled-plugin Docker E2E を個別ジョブとして実行するため、インストーラー作業がルートイメージ smoke の後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュ時にフルカバレッジを要求する場合、ワークフローは高速 Docker smoke を保持し、フル install smoke は夜間またはリリース検証に残します。

低速な Bun グローバルインストール image-provider smoke は `run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは opt in できますが、プルリクエストと `main` プッシュでは実行されません。通常の PR CI では、Node 関連の変更に対して高速な Bun launcher 回帰レーンを引き続き実行します。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- installer/update/plugin-dependency レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` を使ってレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダー影響を受けやすいテールプールのスロット数。                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時 live レーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時 multi-service レーン上限。                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon の create ストームを避けるためのレーン開始間隔。間隔なしの場合は `0` にします。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの厳密なレーンリスト。agents が失敗した 1 レーンを再現できるように cleanup smoke をスキップします。 |

有効な上限より重いレーンでも、空のプールから開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前確認し、古い OpenClaw E2E コンテナを削除し、アクティブレーンの状態を出力し、longest-first 順序付けのためにレーンのタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub outputs とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` で OpenClaw をパックするか、現在実行中のパッケージ artifact をダウンロードするか、`package_artifact_run_id` からパッケージ artifact をダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じて package-digest-tagged の bare/functional GHCR Docker E2E イメージをビルドしてプッシュします。また、再ビルドの代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存の package-digest イメージを再利用します。Docker イメージの pull は試行ごとに境界づけられた 180 秒のタイムアウト付きでリトライされるため、停止した registry/cache ストリームが CI のクリティカルパスの大半を消費せず、すばやくリトライされます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使ってより小さなチャンク化ジョブとして実行されるため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`package-update-openai` には live Codex Plugin パッケージレーンが含まれます。このレーンは候補 OpenClaw パッケージをインストールし、`codex_plugin_spec` または同じ ref の tarball から Codex Plugin を明示的な Codex CLI インストール承認付きでインストールし、Codex CLI preflight を実行し、その後 OpenAI に対して同一セッション内の複数の OpenClaw agent ターンを実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチ向けにのみスタンドアロンの `openwebui` チャンクを保持します。バンドル済みチャンネル update レーンは、一時的な npm ネットワーク障害に対して 1 回リトライします。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、遅いレーンのテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグを 1 つの対象 Docker ジョブに限定し、その実行用のパッケージ artifact を準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその再実行用に live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、これらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行から厳密に同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # Docker artifacts をダウンロードし、結合/レーン別の対象再実行コマンドを出力する
pnpm test:docker:timings <summary>   # 遅いレーンとフェーズのクリティカルパスサマリー
```

スケジュールされた live/E2E ワークフローは、フル release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな product/package カバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別ワークフローです。通常のプルリクエスト、`main` プッシュ、スタンドアロンの手動 CI ディスパッチでは、そのスイートはオフのままです。これはバンドル済み Plugin テストを 8 つの extension ワーカーに分散します。これらの extension shard ジョブは、一度に最大 2 つの Plugin config グループを、グループごとに 1 つの Vitest ワーカーとより大きな Node heap で実行するため、import-heavy な Plugin バッチが余分な CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、対象 Docker レーンを小さなグループでバッチ化し、1 から 3 分のジョブのために数十個の runner を予約することを避けます。このワークフローは `@openclaw/plugin-inspector` から情報用の `plugin-inspector-advisory` artifact もアップロードします。inspector の findings は triage 入力であり、ブロッキングの Plugin Prerelease ゲートは変更しません。

## QA Lab

QA Lab にはメインの smart-scoped ワークフロー外に専用 CI レーンがあります。Agentic parity は広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。parity を広範な検証実行に同乗させるべき場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは `main` 上で夜間と手動ディスパッチ時に実行され、mock parity レーン、live Matrix レーン、live Telegram と Discord レーンを並列ジョブとして fan out します。Live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex leases を使用します。

リリースチェックは、決定論的な mock provider と mock-qualified モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram の live transport レーンを実行するため、チャンネル契約は live モデルのレイテンシーと通常の provider-plugin 起動から分離されます。live transport Gateway は、QA parity がメモリ動作を別途カバーするため、memory search を無効化します。プロバイダー接続性は、別の live model、native provider、Docker provider スイートでカバーされます。

Matrix は、スケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブに shard します。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA parity ゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後最終 parity 比較のために小さなレポートジョブへ両方の artifact をダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープに応じた CI/check エビデンスに従ってください。

## CodeQL

`CodeQL` ワークフローは意図的に、リポジトリ全体の sweep ではなく、狭い初回パスのセキュリティスキャナーです。日次、手動、非ドラフトのプルリクエストガード実行では、Actions ワークフローコードと、最もリスクの高い JavaScript/TypeScript サーフェスを、高/critical の `security-severity` にフィルターした高信頼度セキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれています。これは `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有するバンドル済み Plugin ランタイムパス配下の変更に対してのみ開始され、スケジュール済みワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトには含まれません。

### セキュリティカテゴリ

| カテゴリ                                          | 対象面                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、シークレット、サンドボックス、Cron、Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシー対象面                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス spawn ヘルパー、サブプロセスを所有する同梱 Plugin ランタイム、ワークフロースクリプトの接着部分                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼対象面 |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフローの健全性が許容する最小の Blacksmith Linux ランナーで、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS で CodeQL 用に macOS アプリを手動ビルドし、依存関係のビルド結果をアップロードされる SARIF から除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドがランタイムの大半を占めるため、日次デフォルトの外に置かれています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。狭く価値の高い対象面に対して、エラー重大度かつ非セキュリティの JavaScript/TypeScript 品質クエリのみを GitHub ホスト Linux ランナー上で実行し、品質スキャンが Blacksmith ランナー登録予算を消費しないようにします。プルリクエストガードは、スケジュールプロファイルより意図的に小さくしています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、auth/シークレット/サンドボックス/セキュリティコード、コアチャネルと同梱チャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部分、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復用フックです。

| カテゴリ                                                | 対象面                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルと同梱チャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の接着部分、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドル対象面、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー auth と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway 制御フロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開対象面、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティと分離したままにすることで、セキュリティシグナルを曖昧にせずに、品質の検出事項をスケジュール、測定、無効化、拡張できるようにします。Swift、Python、同梱 Plugin の CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定した後にのみ、スコープ付きまたはシャード化されたフォローアップ作業として追加し直すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、既存ドキュメントを直近で取り込まれた変更に合わせ続けるための、イベント駆動型の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の bot 以外による push CI が成功するとトリガーでき、手動ディスパッチで直接実行することもできます。ワークフロー実行の呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に main に蓄積されたすべての変更をカバーできます。

### テストパフォーマンスエージェント

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` 上の bot 以外による push CI が成功するとトリガーできますが、その UTC 日に別のワークフロー実行の呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチはこの日次アクティビティゲートをバイパスします。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインのテスト数を減らす変更を拒否します。グループ化されたレポートは Linux と macOS で設定ごとの実時間と最大 RSS を記録するため、前後比較で所要時間の差分と並んでテストメモリの差分が表面化します。ベースラインに失敗テストがある場合、Codex は明白な失敗のみを修正でき、エージェント後のフルスイートレポートはコミット前に合格する必要があります。bot の push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo 安全姿勢を維持できるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ、明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであり、各重複に共有の参照 Issue または重複する変更 hunk があることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加えて、コア lint/guard を実行します。
- コアのテストのみの変更は、コアテストの型チェックに加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの型チェックに加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの型チェックに加えて、extension lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存しているため、extension 型チェックまで拡張します（Vitest extension sweep は明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンを実行します。

ローカルの changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそのテスト自身を実行し、ソース編集では明示的なマッピングを優先し、その後に sibling テストと import-graph の依存先を使います。共有 group-room 配信設定は明示的マッピングの 1 つです。group の可視返信設定、ソース返信配信モード、または message-tool システムプロンプトの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルト変更は最初の PR push 前に失敗します。変更がハーネス全体に十分広く、低コストのマッピングセットを信頼できる proxy と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有のリモートボックスラッパーです。チェックがローカル編集ループには広すぎる場合、CI
との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、
再利用可能なボックス、リモートログが必要な場合に、リポジトリルートから使用します。通常の OpenClaw バックエンドは
`blacksmith-testbox` です。所有 AWS/Hetzner キャパシティは、Blacksmith
の停止、クォータ問題、または所有キャパシティの明示的なテストのためのフォールバックです。

Crabbox が支援する Blacksmith 実行は、ワンショット Testbox のウォームアップ、要求、同期、実行、レポート、クリーンアップを行います。組み込みの同期健全性チェックは、
`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short`
で追跡対象の削除が 200 件以上表示された場合に、早期に失敗します。意図的な大量削除 PR では、リモートコマンドに
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

Crabbox は、同期フェーズに 5 分を超えてとどまり、同期後の出力がないローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル差分にはより大きいミリ秒値を使用します。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を宣伝しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーは明示的に渡します。Codex ワークツリーやリンク済み/スパースチェックアウトでは、Crabbox が開始する前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトは避け、代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith 支援の実行には Crabbox 0.22.0 以降が必要です。これにより、ラッパーが現在の Testbox 同期、キュー、クリーンアップ動作を取得できます。隣接チェックアウトを使用する場合は、タイミング測定や証明作業の前に、無視対象のローカルバイナリを再ビルドします。

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

最終 JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委譲された
Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行はハイドレーションと keepalive を所有します。
SSH コマンドがすでに返った後で Testbox が外部から停止された場合、`cancelled` として終了することがあります。ラッパーの `exitCode` がゼロ以外、またはコマンド出力がテスト失敗を示している場合を除き、これはクリーンアップ/ステータス成果物として扱います。
ワンショットの Blacksmith 支援 Crabbox 実行では、Testbox が自動的に停止されるはずです。実行が中断された場合、またはクリーンアップが不明確な場合は、ライブボックスを調べ、自分が作成したボックスだけを停止します。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレーション済みボックス上で複数のコマンドが意図的に必要な場合にのみ、再利用を使います。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層だが Blacksmith 自体は動作している場合、直接 Blacksmith を使うのは `list`、`status`、クリーンアップなどの診断だけにします。直接 Blacksmith 実行をメンテナー証明として扱う前に、Crabbox 経路を修正します。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、課金、または組織制限の圧力として扱います。自分が作成したキュー内の ID を停止し、追加の Testbox 起動を避け、誰かが Blacksmith ダッシュボード、課金、組織制限を確認している間は、下の所有 Crabbox キャパシティ経路へ証明を移します。

Blacksmith が停止している、クォータ制限を受けている、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS の圧力下では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` は避けます。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに引っかかる最も簡単な方法です。リポジトリ所有の `.crabbox.yaml` はデフォルトで `standard`、複数のキャパシティリージョン、`capacity.hints: true` を使用するため、仲介された AWS リースは選択されたリージョン/マーケット、クォータ圧力、Spot フォールバック、高圧力クラス警告を出力します。より重い広範なチェックには `fast` を使用し、`standard`/`fast` では不十分な場合にのみ `large` を使用し、`beast` はフルスイートや全 Plugin Docker マトリクス、明示的なリリース/ブロッカー検証、高コアのパフォーマンスプロファイリングなど、例外的な CPU バウンドレーンにのみ使用します。`pnpm check:changed`、絞り込んだテスト、docs のみの作業、通常の lint/typecheck、小規模な E2E 再現、Blacksmith 停止のトリアージには `beast` を使用しないでください。キャパシティ診断には `--market on-demand` を使用し、Spot マーケットの変動がシグナルに混ざらないようにします。

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。ローカル `.git` は除外されるため、ハイドレーション済みの Actions チェックアウトは、メンテナーローカルのリモートやオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持します。また、転送されるべきではないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンドのためのチェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
