---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしている
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している場合
summary: CI ジョブグラフ、スコープゲート、リリース包括、ローカルコマンド相当
title: CI パイプライン
x-i18n:
    generated_at: "2026-06-28T00:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は、`main` へのすべてのプッシュとすべてのプルリクエストで実行されます。正規の
`main` プッシュは、まず 90 秒のホステッドランナー受け入れウィンドウを通過します。
既存の `CI` concurrency group は、新しいコミットが到着したときにその待機中の実行をキャンセルするため、連続するマージがそれぞれ完全な Blacksmith
マトリックスを登録することはありません。プルリクエストと手動 dispatch は待機をスキップします。続いて `preflight` ジョブが差分を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のために、意図的にスマートなスコープ指定をバイパスして完全なグラフへ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは、別個の [`Plugin プレリリース`](#plugin-prerelease)
workflow にあり、[`完全リリース検証`](#full-release-validation)
または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                                | 目的                                                                                                   | 実行されるタイミング                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs のみの変更、変更されたスコープ、変更された拡張機能を検出し、CI マニフェストをビルドする                   | draft ではないプッシュと PR で常に実行                  |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` プッシュ向けにホステッドの 90 秒 debounce を行う                | すべての CI 実行。sleep は正規の `main` プッシュのみ |
| `security-fast`                    | 秘密鍵の検出、`zizmor` による変更 workflow の監査、本番 lockfile 監査                 | draft ではないプッシュと PR で常に実行                  |
| `check-dependencies`               | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                 | Node 関連の変更                               |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI smoke チェック、埋め込みビルド成果物チェック、再利用可能な成果物をビルドする | Node 関連の変更                               |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI routing チェックなどの高速な Linux 正当性レーン                | Node 関連の変更                               |
| `checks-fast-contracts-plugins-*`  | 2 つにシャードされた Plugin contract チェック                                                                        | Node 関連の変更                               |
| `checks-fast-contracts-channels-*` | 2 つにシャードされた channel contract チェック                                                                       | Node 関連の変更                               |
| `checks-node-core-*`               | channel、bundled、contract、extension レーンを除く Core Node テストシャード                          | Node 関連の変更                               |
| `check-*`                          | シャードされた主要なローカルゲート相当: prod types、lint、guards、test types、strict smoke                | Node 関連の変更                               |
| `check-additional-*`               | architecture、シャードされた boundary/prompt drift、extension guards、package boundary、runtime topology     | Node 関連の変更                               |
| `checks-node-compat-node22`        | Node 22 互換性ビルドと smoke レーン                                                                | リリース向けの手動 CI dispatch                     |
| `check-docs`                       | docs の formatting、lint、broken-link チェック                                                             | docs が変更された場合                                        |
| `skills-python`                    | Python-backed Skills 向けの Ruff + pytest                                                                    | Python skill 関連の変更                       |
| `checks-windows`                   | Windows 固有の process/path テストと共有 runtime import specifier regression                      | Windows 関連の変更                            |
| `macos-node`                       | 共有ビルド成果物を使う macOS TypeScript テストレーン                                               | macOS 関連の変更                              |
| `macos-swift`                      | macOS アプリ向けの Swift lint、build、tests                                                            | macOS 関連の変更                              |
| `ios-build`                        | Xcode project generation と iOS アプリ simulator build                                                 | iOS app、shared app kit、または Swabble の変更         |
| `android`                          | 両方の flavor の Android unit tests と 1 つの debug APK build                                              | Android 関連の変更                            |
| `test-performance-agent`           | trusted activity 後の日次 Codex slow-test optimization                                                 | Main CI 成功または手動 dispatch                  |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 live レーンを含む日次/オンデマンド Kova runtime performance reports | scheduled と manual dispatch                       |

## フェイルファストの順序

1. `runner-admission` は正規の `main` プッシュの場合のみ待機します。新しいプッシュがあると、Blacksmith 登録前に実行がキャンセルされます。
2. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い artifact と platform matrix ジョブを待たずに素早く失敗します。
4. `build-artifacts` は高速 Linux レーンと重なって実行されるため、下流の consumer は共有ビルドの準備ができ次第開始できます。
5. その後、より重い platform と runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しいプッシュが到着すると、GitHub は superseded されたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。Matrix ジョブは `fail-fast: false` を使用し、`build-artifacts` は小さな verifier ジョブを queue する代わりに、embedded channel、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI concurrency key は versioned (`CI-v7-*`) されているため、古い queue group にある GitHub 側の zombie が新しい main 実行を無期限にブロックすることはありません。手動 full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅いジョブ、failures、`pnpm-store-warmup` fanout barrier を要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用してください。CI は同じ実行サマリーを `ci-timings-summary` artifact としてもアップロードします。ビルド timing については、`build-artifacts` ジョブの `Build dist` ステップを確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含めます。このジョブは `startup-memory` artifact もアップロードします。

プルリクエスト実行では、terminal timing-summary ジョブが、`GH_TOKEN` を `gh run view` に渡す前に trusted base revision から helper を実行します。これにより、token 付き query を branch-controlled code の外に保ちながら、プルリクエストの現在の CI 実行を要約できます。

## PR コンテキストとエビデンス

外部 contributor の PR は、
`.github/workflows/real-behavior-proof.yml` から PR context と evidence gate を実行します。この workflow は trusted
base commit をチェックアウトし、PR body のみを評価します。contributor branch の code は実行しません。

この gate は、repository owner、member、collaborator、bot ではない PR author に適用されます。PR body に author が書いた
`What Problem This Solves` と `Evidence` section が含まれている場合に pass します。Evidence には、focused
test、CI result、screenshot、recording、terminal output、live observation、
redacted log、artifact link を使用できます。body は intent と有用な validation を提供します。reviewer は code、tests、CI を検査して correctness を評価します。

チェックが失敗した場合は、別の code commit を push するのではなく、PR body を更新してください。

## スコープとルーティング

Scope logic は `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests でカバーされています。Manual dispatch は changed-scope detection をスキップし、preflight manifest がすべての scoped area が変更されたかのように動作します。

- **CI workflow edits** は Node CI graph と workflow linting を検証しますが、それ自体では Windows、iOS、Android、macOS native build を強制しません。これらの platform lane は platform source changes に scoped されたままです。
- **Workflow Sanity** は、すべての workflow YAML files に対する `actionlint`、`zizmor`、composite-action interpolation guard、conflict-marker guard を実行します。PR-scoped の `security-fast` job も changed workflow files に対して `zizmor` を実行するため、workflow security findings は main CI graph の早い段階で失敗します。
- **`main` プッシュ上の Docs** は、CI と同じ ClawHub docs mirror を使う standalone `Docs` workflow によってチェックされるため、code+docs が混在したプッシュで CI の `check-docs` shard も queue されることはありません。Pull requests と manual CI は、docs が変更された場合に CI から `check-docs` を引き続き実行します。
- **TUI PTY** は、TUI changes 向けに `checks-node-core-runtime-tui-pty` Linux Node shard で実行されます。この shard は `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` で `test/vitest/vitest.tui-pty.config.ts` を実行するため、deterministic `TuiBackend` fixture lane と、external model endpoint のみを mock するより遅い `tui --local` smoke の両方をカバーします。
- **CI routing-only edits、選択された cheap core-test fixture edits、narrow plugin contract helper/test-routing edits** は、高速な Node-only manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task。この path は、routing または fast task が直接 exercise する helper surface に変更が限定されている場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrappers、npm/pnpm/UI runner helpers、package manager config、その lane を実行する CI workflow surfaces に scoped されます。無関係な source、plugin、install-smoke、test-only changes は Linux Node lanes に残ります。

最も遅い Node テストファミリーは、各ジョブが runner を過剰予約せず小さく保たれるように分割またはバランス調整されています。plugin contracts と channel contracts はそれぞれ、標準の GitHub runner フォールバック付きで、Blacksmith backed の重み付き 2 shard として実行されます。core unit fast/support lane は別々に実行されます。core runtime infra は state、process/config、shared、3 つの cron domain shard に分割されます。auto-reply はバランス調整された worker として実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing shard に分割されます）。agentic gateway/server config は、ビルド済み artifact を待つのではなく、chat/auth/model/http-plugin/runtime/startup lane に分割されます。その後、通常の CI は isolated infra include-pattern shard のみを、最大 64 個のテストファイルからなる決定的な bundle に詰め込みます。これにより、non-isolated command/cron、stateful agents-core、gateway/server suite をマージせずに Node matrix を削減します。重い固定 suite は 8 vCPU のままにし、bundle された lane と低ウェイト lane は 4 vCPU を使用します。正規リポジトリ上のプルリクエストでは、追加のコンパクトな admission plan を使用します。同じ config ごとの group が現在の 34-job Linux Node plan 内の isolated subprocess で実行されるため、単一の PR が 70 job 超の完全な Node matrix を登録することはありません。`main` push、manual dispatch、release gate は完全な matrix を維持します。広範な browser、QA、media、その他の plugin テストは、共有 plugin catch-all ではなく専用の Vitest config を使用します。Include-pattern shard は CI shard 名を使って timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional-*` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard list は、prompt-heavy shard 1 つと、残りの guard stripe 用の combined shard 1 つにストライプ化され、それぞれ選択された独立 guard を並行実行し、check ごとの timing を出力します。高コストな Codex happy-path prompt snapshot drift check は、manual CI と prompt に影響する変更のみで独自の additional job として実行されます。そのため、通常の無関係な Node 変更は cold prompt snapshot 生成の後ろで待たず、boundary shard はバランスを保ちつつ、prompt drift はそれを引き起こした PR に固定されます。同じ flag により、built-artifact core support-boundary shard 内の prompt snapshot Vitest generation もスキップされます。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

admit 後、正規 Linux CI では最大 24 個の Node test job の同時実行を許可し、
小さめの fast/check lane では 12 個を許可します。Windows と Android は、
runner pool がより狭いため 2 個のままです。

コンパクト PR plan は、現在の suite に対して 18 個の Node job を生成します。whole-config
group は 120 分の batch timeout 付きで isolated subprocess に batch され、
include-pattern group は同じ bounded job budget を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。その unit-test lane は引き続き SMS/call-log BuildConfig flag 付きで flavor をコンパイルしつつ、Android 関連の各 push で重複した debug APK packaging job を避けます。

`check-dependencies` shard は `pnpm deadcode:dependencies`（production Knip dependency-only pass。最新の Knip version に固定され、`dlx` install では pnpm の minimum release age が無効化されます）と `pnpm deadcode:unused-files` を実行します。後者は Knip の production unused-file finding を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの unused file を追加した場合、または古い allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic plugin、generated、build、live-test、package bridge surface は保持します。

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリの activity を ClawSweeper に渡す target-side bridge です。信頼されていない pull request code を checkout したり実行したりしません。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App token を作成し、compact な `repository_dispatch` payload を `openclaw/clawsweeper` に dispatch します。

この workflow には 4 つの lane があります。

- `clawsweeper_item`: 正確な issue と pull request review request 用。
- `clawsweeper_comment`: issue comment 内の明示的な ClawSweeper command 用。
- `clawsweeper_commit_review`: `main` push 上の commit-level review request 用。
- `github_activity`: ClawSweeper agent が検査する可能性のある一般的な GitHub activity 用。

`github_activity` lane は正規化された metadata のみを転送します。event type、action、actor、repository、item number、URL、title、state、そして存在する場合は comment または review の短い抜粋です。full webhook body は意図的に転送しません。`openclaw/clawsweeper` 側の受信 workflow は `.github/workflows/github-activity.yml` で、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般 activity は観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt 内で Discord target を受け取り、event が意外、actionable、risk がある、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot churn、重複 webhook noise、通常の review traffic は `NO_REPLY` になるべきです。

この path 全体で、GitHub title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約と triage の入力であり、workflow や agent runtime への指示ではありません。

## Manual dispatches

Manual CI dispatch は通常の CI と同じ job graph を実行しますが、Android 以外のすべての scoped lane を強制的に有効化します。Linux Node shard、bundled-plugin shard、plugin and channel contract shard、Node 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke check、docs check、Python skills、Windows、macOS、iOS build、Control UI i18n です。スタンドアロンの manual CI dispatch は `include_android=true` の場合のみ Android を実行します。full release umbrella は `include_android=true` を渡して Android を有効化します。Plugin prerelease static check、release-only の `agentic-plugins` shard、full extension batch sweep、plugin prerelease Docker lane は CI から除外されます。Docker prerelease suite は、`Full Release Validation` が release-validation gate を有効にして別個の `Plugin Prerelease` workflow を dispatch した場合のみ実行されます。

Manual run は一意の concurrency group を使用するため、release-candidate full suite が同じ ref 上の別の push や PR run によってキャンセルされません。任意の `target_ref` input により、信頼された caller は、選択された dispatch ref の workflow file を使用しながら、その graph を branch、tag、または full commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manual CI dispatch と non-canonical repository fallback、CodeQL JavaScript/actions quality scan、workflow-sanity、labeler、auto-response、CI 外の docs workflow、そして Blacksmith matrix がより早く queue できるようにする install-smoke preflight                                   |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低ウェイト extension shard、`checks-fast-core`、plugin/channel contract shard、大半の bundled/低ウェイト Linux Node shard、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` shard、`check-dependencies`             |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持される重い Linux Node suite、boundary/extension-heavy `check-additional-*` shard、`android`                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（8 vCPU は節約分よりコストが大きいほど CPU-sensitive）；install-smoke Docker build（32-vCPU queue time は節約分よりコストが大きい）                                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。fork は `macos-15` にフォールバックします                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。fork は `macos-26` にフォールバックします                                                                                                                                                                                      |

## Runner registration budget

OpenClaw の現在の GitHub runner-registration bucket は、5 分あたり 3,000 件の self-hosted
runner registration を許可します。この limit は `openclaw` organization 内のすべての Blacksmith runner
registration で共有されるため、別の Blacksmith installation を追加しても新しい bucket は追加されません。

Blacksmith label は burst control の希少リソースとして扱ってください。route、notify、summarize、shard select、または短い CodeQL scan のみを実行する job は、Blacksmith 固有の必要性が測定されていない限り、GitHub-hosted runner に留めるべきです。新しい Blacksmith matrix、より大きな `max-parallel`、または高頻度 workflow は、worst-case registration count を示し、organization-level
target を 5 分あたり 2,000 registration 未満に保ち、同時実行 repository と retry された job のための余裕を残す必要があります。

Canonical-repo CI は、通常の push と pull-request run に対して Blacksmith をデフォルトの runner path として維持します。`workflow_dispatch` と non-canonical repository run は GitHub-hosted runner を使用しますが、通常の canonical run は現在、Blacksmith queue health を probe したり、Blacksmith が利用できない場合に GitHub-hosted label へ自動 fallback したりしません。

## Local equivalents

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

## OpenClaw のパフォーマンス

`OpenClaw Performance` は、製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグまたは現在のワークフロー実装を持つ別ブランチをベンチマークするには、`target_ref` を設定します。公開されたレポートパスと latest ポインターは、テスト対象 ref をキーにし、各 `index.md` には、テスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、lane auth mode、モデル、繰り返し回数、シナリオフィルターが記録されます。

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースにおける Gateway 起動時間とメモリ、バンドル Plugin インポート RSS、繰り返し実行される模擬 OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象 ref の以前に公開された mock-provider ソースレポートが利用可能な場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON はその隣にあります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカードレンダリング、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable と full プロファイルには、常に網羅的な live/E2E と Docker リリースパス soak カバレッジが含まれます。beta プロファイルでは `run_release_soak=true` でオプトインできます。正規のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、フル候補は重複する live ポーラーを開始しません。公開後は、`release_package_spec` を渡して、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、リビルドなしに出荷済み npm パッケージを再利用します。フォーカスした公開済みパッケージ Telegram 再実行にのみ `npm_telegram_package_spec` を使用します。Codex Plugin live パッケージレーンは、デフォルトで同じ選択状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行では選択された ref から `extensions/codex` を pack します。`npm:`、`npm-pack:`、`git:` spec などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、フォーカスした再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、手動の変更を伴うリリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後に、`release/YYYY.M.PATCH` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後にのみ保存された `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。stable 公開には正確な `windows_node_tag` も必要です。このワークフローは、公開子ワークフローの前に Windows ソースリリースを検証し、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、同じ固定インストーラーダイジェスト、正確なコンパニオンアセット、チェックサム契約を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチ上で固定コミットの証明を得るには、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーは、ターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが異なる SHA で実行された場合に失敗します。

`release_profile` は、リリースチェックに渡される live/provider の範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media マトリクスを意図的に必要とする場合にのみ `full` を使用します。stable と full のリリースチェックは、常に網羅的な live/E2E と Docker リリースパス soak を実行します。beta プロファイルでは `run_release_soak=true` でオプトインできます。

- `minimum` は、最速の OpenAI/コアのリリースクリティカルなレーンを維持します。
- `stable` は、stable provider/backend セットを追加します。
- `full` は、広範な advisory provider/media マトリクスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再確認し、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して緑になった場合、アンブレラ結果とタイミングサマリーを更新するには親 verifier ジョブのみを再実行します。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け取ります。リリース候補には `all`、通常の full CI 子のみには `ci`、Plugin prerelease 子のみには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはより狭いグループとして、アンブレラ上の `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、フォーカスした修正後の失敗したリリースボックス再実行を限定できます。1 つの失敗したクロス OS レーンには、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。たとえば `windows/packaged-upgrade` です。長時間のクロス OS コマンドは heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは advisory ですが、標準ランタイムツールカバレッジゲートは例外で、必要な OpenClaw 動的ツールが標準ティアサマリーからずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使用して、選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。soak カバレッジが実行される場合は、live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージのバイト列を一貫させ、複数の子ジョブで同じ候補を再 pack することを避けます。Codex npm-plugin live レーンでは、リリースチェックは `release_package_spec` から導出された一致する公開済み Plugin spec を渡すか、オペレーター指定の `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトに選択されたチェックアウトの Codex Plugin を pack させます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機することはありません。リリースブランチ/タグ検証とフォーカスした再実行グループは `cancel-in-progress: false` を維持します。

## Live と E2E シャード

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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
- 分割されたメディア audio/video シャードと provider-filtered music シャード

これにより、同じファイルカバレッジを維持しながら、遅い live provider の失敗を再実行および診断しやすくします。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも引き続き有効です。

ネイティブ live media シャードは、`Live Media Runner Image` ワークフローでビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリのみを検証します。Docker バックの live スイートは通常の Blacksmith runner 上に維持してください。container ジョブはネストした Docker テストを起動する場所として適していません。

Docker支援のライブモデル/バックエンドシャードは、選択されたコミットごとに個別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、provider 分割 Gateway、CLI バックエンド、ACP bind、Codex ハーネスのシャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップ経路が詰まった場合に、リリースチェック全体の予算を消費するのではなく早く失敗します。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## パッケージ受け入れ

問いが「このインストール可能な OpenClaw パッケージは製品として動作するか」の場合は `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通じて単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じて package-digest Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、その後それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance が解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram dispatch では、引き続き公開済み npm spec をインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みプレリリース/安定版の受け入れにこれを使用します。
- `source=ref` は信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離された worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。この経路は URL 認証情報、非デフォルト HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済み IP、および同じ公開安全ポリシー外へのリダイレクトを拒否します。
- `source=trusted-url` は `.github/package-trusted-sources.json` の名前付き trusted-source ポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。構成済みホスト、ポート、パスプレフィックス、リダイレクト先ホスト、またはプライベートネットワーク解決が必要な、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみこれを使用します。ポリシーが bearer auth を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を使用します。URL 埋め込みの認証情報は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から1つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリース経路チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開パッケージ検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec 経路はスタンドアロン dispatch 用に保持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージを含む専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skills インストール、古い Plugin 依存関係のクリーンアップ、構成済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が同じ解決済みパッケージ tarball 上に維持されます。ベータ公開後に、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定すると、再ビルドせずに出荷済み npm パッケージに対して同じマトリックスを実行できます。Package Acceptance がリリース検証の他の部分とは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは、引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリース経路で、実行ごとに1つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補となり、`published_upgrade_survivor_baseline` がフォールバックの公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新4つの安定版 npm リリースに加え、固定された Plugin 互換性境界リリース、および Feishu 設定、保持された bootstrap/persona ファイル、構成済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルート向けの issue 形状 fixture へ拡張します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに個別の対象 Docker runner ジョブへシャーディングされます。別個の `Update Migration` ワークフローは、問いが通常の Full Release CI の幅ではなく、公開済み更新クリーンアップの網羅性である場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定して `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡したり、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持したり、シナリオマトリックス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定したりできます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを構成し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みレーンとインストーラー新規レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control override を import できることも検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトにし、そうでなければ `openai/gpt-5.5` を使用します。これにより、GPT-4.x デフォルトを避けつつ、インストールと Gateway 証明を GPT-5 テストモデルに維持します。

### レガシー互換性期間

Package Acceptance には、すでに公開済みのパッケージ向けに境界付きのレガシー互換性期間があります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性経路を使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball に含まれないファイルを指してもよい。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップしてもよい。
- `update-channel-switch` は、tarball 由来の fake git fixture から欠落した pnpm `patchedDependencies` を削除してもよく、永続化された `update.channel` の欠落をログに記録してもよい。
- Plugin smoke はレガシーのインストール記録場所を読み取ってもよく、marketplace インストール記録の永続化がないことを許容してもよい。
- `plugin-update` は、インストール記録と no-reinstall 動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許可してもよい。

公開済みの `2026.4.26` パッケージも、すでに出荷済みだったローカルビルドメタデータスタンプファイルについて警告してよいです。それ以降のパッケージは現代的な契約を満たす必要があります。同じ条件は警告やスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、`resolve_package` サマリーから開始して、パッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます。`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージ面、バンドル Plugin のパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 面に触れるプルリクエストで実行されます。ソースのみのバンドル Plugin 変更、テストのみの編集、docs のみの編集は Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度だけビルドし、CLI をチェックし、agents delete shared-workspace CLI スモークを実行し、コンテナ gateway-network e2e を実行し、バンドル拡張機能のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きバンドル Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は別途上限が設定されます）。
- **フルパス**は、QR パッケージインストールとインストーラー Docker/更新カバレッジを、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker 面に実際に触れるプルリクエスト向けに保持します。フルモードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージのスモークの後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュでフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フルインストールスモークは夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは任意で有効化できますが、プルリクエストと `main` へのプッシュでは実行されません。通常の PR CI は、Node 関連の変更に対して高速 Bun ランチャー回帰レーンを引き続き実行します。QR とインストーラー Docker テストは、それぞれインストールに特化した Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度だけパックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/Plugin 依存関係レーン向けの素の Node/Git ランナー。
- 通常の機能レーン向けに、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーンのメインプールスロット数。                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーの影響を受けやすいテールプールのスロット数。                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時 live レーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。間隔なしの場合は `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの厳密なレーン一覧。agents が失敗した 1 レーンを再現できるように cleanup スモークをスキップします。 |

実効上限より重いレーンでも、空のプールからは開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先の順序付けのためにレーン所要時間を永続化し、デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランでパッケージインストール済みレーンが必要な場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュします。また、再ビルドの代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに上限 180 秒のタイムアウトで再試行されるため、詰まった registry/cache ストリームが CI のクリティカルパスの大半を消費せず、すばやく再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さくチャンク化されたジョブを実行します。これにより各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`package-update-openai` には live Codex Plugin パッケージレーンが含まれます。このレーンは候補 OpenClaw パッケージをインストールし、明示的な Codex CLI インストール承認を伴って `codex_plugin_spec` または同一 ref の tarball から Codex Plugin をインストールし、Codex CLI 事前チェックを実行し、その後 OpenAI に対して同一セッションの OpenClaw agent ターンを複数回実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを保持します。バンドルチャンネル更新レーンは、一時的な npm ネットワーク失敗に対して一度だけ再試行します。

各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、低速レーン表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは対象を絞った 1 つの Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその再実行向けに live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E ワークフローは、フル release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別ワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。これはバンドル Plugin テストを 8 つの拡張機能ワーカーに分散します。これらの拡張機能シャードジョブは、Plugin config グループを同時に最大 2 つまで実行し、各グループに Vitest ワーカーを 1 つ使い、より大きな Node ヒープを使うため、import の多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用 Docker プレリリースパスは、1〜3 分のジョブのために数十のランナーを予約しないよう、対象 Docker レーンを小さなグループでバッチ化します。このワークフローは、`@openclaw/plugin-inspector` から情報提供用の `plugin-inspector-advisory` アーティファクトもアップロードします。inspector findings はトリアージ入力であり、ブロッキングの Plugin Prerelease ゲートは変更しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外に専用 CI レーンがあります。エージェント的パリティは、スタンドアロンの PR ワークフローではなく、広範な QA およびリリースハーネスの下にネストされています。パリティを広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使います。

- `QA-Lab - All Lanes` ワークフローは `main` で夜間に、また手動ディスパッチで実行されます。これは mock parity レーン、live Matrix レーン、live Telegram および Discord レーンを並列ジョブとしてファンアウトします。live ジョブは `qa-live-shared` 環境を使い、Telegram/Discord は Convex leases を使います。

リリースチェックは、決定論的 mock provider と mock-qualified models（`mock-openai/gpt-5.5` および `mock-openai/gpt-5.5-alt`）で Matrix と Telegram の live transport レーンを実行します。これにより、チャンネル契約が live model のレイテンシーおよび通常の provider-plugin startup から分離されます。live transport Gateway はメモリ検索を無効化します。QA parity がメモリ動作を別途カバーしているためです。プロバイダー接続性は、別の live model、native provider、Docker provider スイートでカバーされます。

Matrix はスケジュールおよびリリースゲートで `--profile fast` を使い、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI デフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` はリリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA parity ゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後小さなレポートジョブに両方のアーティファクトをダウンロードして最終パリティ比較を行います。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープ済み CI/check 証拠に従います。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に狭い第一段階のセキュリティスキャナーです。日次、手動、非ドラフトのプルリクエストガード実行は、Actions ワークフローコードに加え、最高リスクの JavaScript/TypeScript 面を、高/クリティカルの `security-severity` にフィルタされた高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。これは `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュールされたワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトから外れたままです。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフローの健全性確認で許可される最小の Blacksmith Linux ランナー上で、CodeQL 向けに Android アプリを手動ビルドします。`/codeql-critical-security/android` にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 向けに macOS アプリを手動ビルドし、アップロードされる SARIF から依存関係のビルド結果を除外し、`/codeql-critical-security/macos` にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大部分を占めるため、日次のデフォルトからは外しています。

### 重要な品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。品質スキャンが Blacksmith ランナー登録予算を消費しないように、GitHub ホストの Linux ランナー上で、狭く高価値なサーフェスに対してエラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。プルリクエストガードは、スケジュールされたプロファイルより意図的に小さくしています。非ドラフト PR では、エージェントコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルとバンドル済みチャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、マイグレーション、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着部、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティから分離しています。これにより、セキュリティシグナルを曖昧にせずに、品質検出をスケジュール、計測、無効化、拡張できます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定してから、スコープ付きまたはシャード化されたフォローアップ作業としてのみ戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されていた場合はスキップされます。実行時には、前回スキップされなかった Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間に 1 回の実行で、最後のドキュメント確認以降に蓄積したすべての main 変更を対象にできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push CI 実行が成功するとトリガーできますが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップされます。手動ディスパッチはこの日次アクティビティゲートを迂回します。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなくカバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行して、合格ベースラインテスト数を減らす変更を拒否します。グループ化されたレポートは Linux と macOS で設定ごとの実時間と最大 RSS を記録するため、前後比較では所要時間の差分と並んでテストメモリの差分が見えます。ベースラインに失敗テストがある場合、Codex は明白な失敗のみ修正でき、エージェント後のフルスイートレポートはコミット前に合格する必要があります。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex アクションが docs agent と同じ drop-sudo 安全姿勢を維持できるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に共有参照 issue または重複する変更ハンクのどちらかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加えて、コア lint/ガードを実行します。
- コアのテストのみの変更は、コアテストの型チェックに加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの型チェックに加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの型チェックに加えて、extension lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存しているため、extension 型チェックまで拡張します（Vitest extension sweep は明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンに失敗します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より安価です。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピングを優先し、その後に sibling テストと import-graph 依存先を使います。共有グループルーム配信設定は明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、または message-tool system prompt への変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルト変更は最初の PR push 前に失敗します。変更がハーネス全体に及び、安価なマッピング済みセットを信頼できる代理と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有の remote-box ラッパーです。チェックがローカル編集ループには広すぎる場合、CI との一致が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能な box、リモートログが必要な場合に、リポジトリルートから使用します。通常の OpenClaw バックエンドは `blacksmith-testbox` です。所有する AWS/Hetzner 容量は、Blacksmith の障害、クォータ問題、または明示的な所有容量テストのためのフォールバックです。

Crabbox バックの Blacksmith 実行は、ワンショット Testbox をウォームアップ、確保、同期、実行、レポート、クリーンアップします。組み込みの同期健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合や、`git status --short` が追跡済み削除を 200 件以上表示する場合に即座に失敗します。意図的な大規模削除 PR では、リモートコマンドに `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

Crabbox は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、非常に大きいローカル差分にはより大きいミリ秒値を使用してください。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を公開していない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に owned-cloud のデフォルトがあっても、プロバイダーを明示的に渡してください。Codex ワークツリーまたはリンク済み/スパースチェックアウトでは、Crabbox が開始する前に pnpm が依存関係を再調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトは避け、代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith バックの実行には Crabbox 0.22.0 以降が必要です。これにより、ラッパーは現在の Testbox 同期、キュー、クリーンアップ動作を取得できます。兄弟チェックアウトを使用する場合は、タイミング計測または証明作業の前に、無視対象のローカルバイナリを再ビルドします。

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

最終 JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委譲された Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行はハイドレーションと keepalive を所有します。SSH コマンドがすでに返った後に Testbox が外部から停止された場合、`cancelled` として終了することがあります。ラッパーの `exitCode` がゼロ以外である場合、またはコマンド出力がテスト失敗を示す場合を除き、これはクリーンアップ/ステータスの成果物として扱ってください。ワンショットの Blacksmith バック Crabbox 実行は Testbox を自動的に停止するはずです。実行が中断された場合やクリーンアップが不明な場合は、ライブボックスを調べ、自分が作成したボックスだけを停止してください。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレーション済みボックスで複数のコマンドが意図的に必要な場合にのみ、再利用を使います。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層で、Blacksmith 自体は動作する場合、直接の Blacksmith は `list`、`status`、クリーンアップなどの診断にのみ使用します。直接の Blacksmith 実行をメンテナー証明として扱う前に、Crabbox パスを修正してください。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分経っても IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、請求、または組織制限の圧迫として扱います。自分が作成したキュー中の ID を停止し、追加の Testbox を開始せず、誰かが Blacksmith ダッシュボード、請求、組織制限を確認している間は、下記の所有 Crabbox キャパシティパスに証明を移してください。

Blacksmith が停止している、クォータ制限を受けている、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS の圧迫下では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` を避けてください。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は、`standard`、複数のキャパシティリージョン、`capacity.hints: true` をデフォルトにしているため、仲介された AWS リースは選択されたリージョン/マーケット、クォータ圧迫、Spot フォールバック、高負荷クラス警告を出力します。より重い広範なチェックには `fast` を使い、standard/fast で足りない場合にのみ `large` を使い、フルスイートや全 Plugin Docker マトリクス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドレーンにのみ `beast` を使ってください。`pnpm check:changed`、絞り込んだテスト、docs のみの作業、通常の lint/typecheck、小規模な E2E 再現、Blacksmith 障害トリアージには `beast` を使わないでください。キャパシティ診断には `--market on-demand` を使い、Spot マーケットの変動がシグナルに混ざらないようにします。

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。ローカルの `.git` を除外するため、ハイドレーション済み Actions チェックアウトは、メンテナーローカルのリモートやオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持します。また、転送されるべきでないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、所有クラウド `crabbox run --id <cbx_id>` コマンド向けの非シークレット環境引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
