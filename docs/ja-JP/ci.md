---
read_when:
    - CIジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper ディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリース包括ジョブ、ローカルコマンドの対応表
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-02T13:57:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。正規の
`main` push は、最初に 90 秒の hosted-runner 受け入れウィンドウを通過します。
既存の `CI` concurrency group は、新しい commit が到着するとその待機中の実行をキャンセルするため、
連続した merge がそれぞれ完全な Blacksmith matrix を登録することはありません。Pull request と manual dispatch は待機をスキップします。その後、`preflight` job が diff を分類し、関係のない領域だけが変更された場合は高コストな lane をオフにします。Manual `workflow_dispatch` 実行は、release candidate と広範な validation のために、意図的に smart scoping をバイパスして full graph に fan out します。Android lane は `include_android` による opt-in のままです。release 専用の plugin coverage は、別の [`Plugin Prerelease`](#plugin-prerelease)
workflow にあり、[`Full Release Validation`](#full-release-validation)
または明示的な manual dispatch からのみ実行されます。

## Pipeline 概要

| Job                                | 目的                                                                                                      | 実行されるタイミング                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only 変更、変更された scope、変更された extension を検出し、CI manifest を build                    | non-draft の push と PR では常に実行                 |
| `runner-admission`                 | Blacksmith work が登録される前に、正規の `main` push 向けに hosted 90 秒 debounce を行う                 | すべての CI 実行。sleep は正規の `main` push のみ    |
| `security-fast`                    | private key 検出、`zizmor` による changed-workflow audit、本番 lockfile audit                            | non-draft の push と PR では常に実行                 |
| `check-dependencies`               | 本番 Knip dependency-only pass と unused-file allowlist guard                                             | Node 関連の変更                                      |
| `build-artifacts`                  | `dist/`、Control UI、built-CLI smoke check、embedded built-artifact check、再利用可能 artifact を build   | Node 関連の変更                                      |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI-routing check などの高速 Linux correctness lane                       | Node 関連の変更                                      |
| `checks-fast-contracts-plugins-*`  | 2 分割された plugin contract check                                                                        | Node 関連の変更                                      |
| `checks-fast-contracts-channels-*` | 2 分割された channel contract check                                                                       | Node 関連の変更                                      |
| `checks-node-core-*`               | channel、bundled、contract、extension lane を除く Core Node test shard                                   | Node 関連の変更                                      |
| `check-*`                          | sharded main local gate 相当: prod type、lint、guard、test type、strict smoke                            | Node 関連の変更                                      |
| `check-additional-*`               | architecture、sharded boundary/prompt drift、extension guard、package boundary、runtime topology         | Node 関連の変更                                      |
| `checks-node-compat-node22`        | Node 22 compatibility build と smoke lane                                                                 | release 向けの manual CI dispatch                    |
| `check-docs`                       | Docs formatting、lint、broken-link check                                                                  | Docs が変更された場合                                |
| `skills-python`                    | Python-backed skills 向けの Ruff + pytest                                                                 | Python-skill 関連の変更                              |
| `checks-windows`                   | Windows 固有の process/path test と shared runtime import specifier regression                           | Windows 関連の変更                                   |
| `macos-node`                       | shared built artifact を使用する macOS TypeScript test lane                                               | macOS 関連の変更                                     |
| `macos-swift`                      | macOS app 向けの Swift lint、build、test                                                                  | macOS 関連の変更                                     |
| `ios-build`                        | Xcode project 生成と iOS app simulator build                                                              | iOS app、shared app kit、または Swabble の変更       |
| `android`                          | 両 flavor の Android unit test と 1 つの debug APK build                                                  | Android 関連の変更                                   |
| `test-performance-agent`           | trusted activity 後の日次 Codex slow-test optimization                                                    | Main CI 成功または manual dispatch                   |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 live lane を含む日次/オンデマンド Kova runtime performance report   | Scheduled と manual dispatch                         |

## Fail-fast 順序

1. `runner-admission` は正規の `main` push のみを待機します。新しい push があると、Blacksmith 登録前に実行がキャンセルされます。
2. `preflight` は、そもそもどの lane が存在するかを決定します。`docs-scope` と `changed-scope` の logic はこの job 内の step であり、独立した job ではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い artifact job や platform matrix job を待たずに素早く失敗します。
4. `build-artifacts` は高速 Linux lane と重なって実行されるため、shared build の準備ができ次第 downstream consumer を開始できます。
5. その後、より重い platform lane と runtime lane が fan out します: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しい push が到着した場合、GitHub は置き換えられた job を `cancelled` として mark することがあります。同じ ref の最新実行も失敗していない限り、これは CI noise として扱ってください。Matrix job は `fail-fast: false` を使用し、`build-artifacts` は小さな verifier job を queue する代わりに、embedded channel、core-support-boundary、gateway-watch の失敗を直接 report します。自動 CI concurrency key は versioned (`CI-v7-*`) されているため、古い queue group に残った GitHub 側の zombie が新しい main 実行を無期限に block することはありません。Manual full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅い job、failure、`pnpm-store-warmup` fanout barrier を要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。CI は同じ run summary も `ci-timings-summary` artifact として upload します。build timing については、`build-artifacts` job の `Build dist` step を確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。この job は `startup-memory` artifact も upload します。

pull request 実行では、terminal timing-summary job は `GH_TOKEN` を `gh run view` に渡す前に、trusted base revision から helper を実行します。これにより、token 付き query を branch-controlled code から切り離したまま、pull request の現在の CI 実行を要約できます。

## PR context と evidence

External contributor PR は、
`.github/workflows/real-behavior-proof.yml` から PR context と evidence gate を実行します。この workflow は trusted
base commit を checkout し、PR body のみを評価します。contributor branch の code は実行しません。

この gate は、repository owner、member、collaborator、bot ではない PR author に適用されます。PR body に author が記述した
`What Problem This Solves` section と `Evidence` section が含まれている場合に pass します。Evidence には、focused
test、CI result、screenshot、recording、terminal output、live observation、
redacted log、artifact link を使用できます。body は intent と有用な validation を提供します。
reviewer は code、test、CI を inspect して correctness を評価します。

check が失敗した場合は、別の code commit を push するのではなく、PR body を更新してください。

## Scope と routing

Scope logic は `scripts/ci-changed-scope.mjs` にあり、unit test は `src/scripts/ci-changed-scope.test.ts` にあります。Manual dispatch は changed-scope detection をスキップし、すべての scoped area が変更されたかのように preflight manifest を動作させます。

- **CI workflow edit** は Node CI graph と workflow linting を validate しますが、それ自体では Windows、iOS、Android、macOS native build を強制しません。これらの platform lane は platform source change に scoped されたままです。
- **Workflow Sanity** は、すべての workflow YAML file に対する `actionlint` と `zizmor`、composite-action interpolation guard、conflict-marker guard を実行します。PR-scoped の `security-fast` job も変更された workflow file に対して `zizmor` を実行するため、workflow security finding は main CI graph 内で早期に fail します。
- **`main` push 上の Docs** は、CI と同じ ClawHub docs mirror を使用する standalone `Docs` workflow によって check されるため、code+docs が混在する push でも CI の `check-docs` shard は追加で queue されません。Pull request と manual CI は、docs が変更された場合に CI から `check-docs` を引き続き実行します。
- **TUI PTY** は、TUI 変更向けに `checks-node-core-runtime-tui-pty` Linux Node shard で実行されます。この shard は `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` で `test/vitest/vitest.tui-pty.config.ts` を実行するため、deterministic な `TuiBackend` fixture lane と、external model endpoint のみを mock する遅めの `tui --local` smoke の両方を cover します。
- **CI routing-only edit、選択された安価な core-test fixture edit、狭い plugin contract helper/test-routing edit** は、高速 Node-only manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task。この path は、変更が fast task が直接 exercise する routing surface または helper surface に限定される場合、build artifact、Node 22 compatibility、channel contract、full core shard、bundled-plugin shard、追加の guard matrix をスキップします。
- **Windows Node check** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、およびその lane を実行する CI workflow surface に scoped されます。関係のない source、plugin、install-smoke、test-only 変更は Linux Node lane のままです。

最も遅い Node テストファミリーは分割またはバランス調整され、ランナーを過剰予約せずに各ジョブが小さく保たれます。Plugin 契約とチャンネル契約はそれぞれ、標準の GitHub ランナーフォールバック付きの Blacksmith-backed 重み付きシャード 2 つとして実行され、core unit fast/support レーンは個別に実行されます。core runtime infra は state、process/config、shared、3 つの cron ドメインシャードに分割され、auto-reply はバランス調整されたワーカーとして実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/server 設定はビルド済み成果物を待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されます。通常の CI は、孤立した infra include-pattern シャードだけを最大 64 個のテストファイルからなる決定的なバンドルに詰め込み、非孤立の command/cron、ステートフルな agents-core、gateway/server スイートをマージせずに Node マトリックスを削減します。重い固定スイートは 8 vCPU のままにし、バンドル済みおよび低重みのレーンは 4 vCPU を使用します。正規リポジトリ上のプルリクエストでは、追加のコンパクトな受け入れプランを使用します。同じ config ごとのグループが現在の 34 ジョブの Linux Node プラン内で孤立したサブプロセスとして実行されるため、単一の PR が 70 ジョブ超の Node マトリックス全体を登録することはありません。`main` への push、手動ディスパッチ、リリースゲートはフルマトリックスを保持します。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使用します。Include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional-*` はパッケージ境界の compile/canary 作業をまとめ、ランタイムトポロジーアーキテクチャを gateway watch カバレッジから分離します。境界ガードリストは、prompt が重いシャード 1 つと、残りのガードストライプ用の結合シャード 1 つにストライプ化され、それぞれ選択された独立ガードを並行実行し、check ごとのタイミングを出力します。高コストな Codex happy-path prompt スナップショットドリフトチェックは、手動 CI と prompt に影響する変更だけで独自の追加ジョブとして実行されます。これにより、通常の無関係な Node 変更は cold prompt スナップショット生成の後ろで待たず、境界シャードはバランスを保ちつつ、prompt ドリフトはそれを引き起こした PR に固定されます。同じフラグは、ビルド済み成果物の core support-boundary シャード内での prompt スナップショット Vitest 生成もスキップします。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

受け入れ後、正規 Linux CI は最大 24 個の Node テストジョブの同時実行を許可し、
より小さい fast/check レーンでは 12 個を許可します。Windows と Android は
これらのランナープールがより狭いため 2 個のままです。

コンパクト PR プランは、現在のスイートに対して 18 個の Node ジョブを出力します。whole-config
グループは 120 分のバッチタイムアウト付きで孤立したサブプロセスにバッチ化され、
include-pattern グループは同じ制限付きジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには別個の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きでそのフレーバーを引き続きコンパイルしつつ、Android 関連の push ごとに重複する debug APK パッケージングジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install 用に pnpm の最小リリース経過期間を無効化した、本番 Knip dependency-only パス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番 unused-file 検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file ガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な動的 Plugin、生成物、ビルド、live-test、パッケージブリッジのサーフェスは保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティから ClawSweeper へのターゲット側ブリッジです。信頼されていないプルリクエストコードをチェックアウトしたり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` に送信します。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request レビューリクエスト用の `clawsweeper_item`;
- issue コメント内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` push 上の commit-level レビューリクエスト用の `clawsweeper_commit_review`;
- ClawSweeper エージェントが検査できる一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します。event type、action、actor、repository、item number、URL、title、state、および存在する場合は comments または reviews の短い抜粋です。完全な webhook body は意図的に転送しません。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway hook に投稿します。

一般アクティビティは観測であり、デフォルト配信ではありません。ClawSweeper エージェントは prompt 内で Discord ターゲットを受け取り、イベントが意外、対応可能、リスクあり、または運用上有用な場合にのみ `#clawsweeper` に投稿する必要があります。通常の open、edit、bot churn、重複 webhook ノイズ、通常のレビュー traffic は `NO_REPLY` になるべきです。

GitHub の title、comment、body、review text、branch name、commit message は、この経路全体で信頼されていないデータとして扱います。これらは要約と triage の入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外の scoped レーンをすべて強制的に有効にします。Linux Node シャード、bundled-plugin シャード、Plugin とチャンネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物の smoke check、docs check、Python skills、Windows、macOS、iOS build、Control UI i18n です。単独の手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。full release umbrella は `include_android=true` を渡すことで Android を有効にします。Plugin prerelease static check、release-only の `agentic-plugins` シャード、完全な extension batch sweep、Plugin prerelease Docker レーンは CI から除外されます。Docker prerelease スイートは、`Full Release Validation` が release-validation gate を有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency group を使用するため、release-candidate full suite が同じ ref 上の別の push や PR run によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択された dispatch ref のワークフローファイルを使用しながら、そのグラフを branch、tag、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                        | ジョブ                                                                                                                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI ディスパッチと非正規リポジトリのフォールバック、CodeQL JavaScript/actions 品質スキャン、workflow-sanity、labeler、auto-response、CI 外の docs ワークフロー、および Blacksmith マトリックスをより早くキューに入れられるようにする install-smoke preflight              |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低重みの extension シャード、`checks-fast-core`、Plugin/チャンネル契約シャード、ほとんどの bundled/低重み Linux Node シャード、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` シャード、および `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 保持される重い Linux Node スイート、boundary/extension-heavy な `check-additional-*` シャード、および `android`                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（CPU に十分敏感で、8 vCPU は節約分よりコストが大きかった）、install-smoke Docker build（32-vCPU queue time は節約分よりコストが大きかった）                                                                                                        |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。fork は `macos-15` にフォールバック                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。fork は `macos-26` にフォールバック                                                                                                                                                                                           |

## ランナー登録予算

OpenClaw の現在の GitHub runner-registration バケットは、`ghx api rate_limit` で
5 分あたり 10,000 件の self-hosted runner 登録を報告します。GitHub がこのバケットを変更する可能性があるため、各チューニングパスの前に
`actions_runner_registration` を再確認してください。この制限は
`openclaw` organization 内のすべての Blacksmith runner 登録で共有されるため、別の Blacksmith installation を追加しても
新しいバケットは追加されません。

Blacksmith label は burst control のための希少リソースとして扱います。route、notify、summarize、select shards だけを行うジョブ、または短い CodeQL scan を実行するジョブは、測定済みの Blacksmith 固有の必要性がない限り、GitHub-hosted runner に留めるべきです。新しい Blacksmith マトリックス、より大きな `max-parallel`、または高頻度ワークフローは、worst-case registration count を示し、organization level target を live bucket の約 60% 未満に保つ必要があります。現在の 10,000 registration bucket では、6,000 registration の operating target を意味し、同時実行中のリポジトリ、retry、burst overlap のための余裕を残します。

正規リポジトリ CI は、通常の push と pull-request run のデフォルトランナーパスとして Blacksmith を維持します。`workflow_dispatch` と非正規リポジトリの run は GitHub-hosted runner を使用しますが、通常の正規 run は現時点で Blacksmith queue health を probe したり、Blacksmith が利用できない場合に GitHub-hosted label へ自動フォールバックしたりしません。

## ローカルでの同等手順

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

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグや別ブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開レポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` にはテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

このワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定的な偽の OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、agent-turn のホットスポット向けの CPU/ヒープ/トレースプロファイリング。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースにおける Gateway 起動時間とメモリ、バンドル Plugin import RSS、繰り返し mock-OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンド、SQLite state smoke パフォーマンスプローブです。テスト対象 ref の以前に公開された mock-provider ソースレポートが利用できる場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON がその横に置かれます。

すべてのレーンは GitHub artifacts をアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブ artifact も `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/package/static/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストール smoke、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカード描画、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable プロファイルと full プロファイルは、常に網羅的な live/E2E と Docker リリースパス soak カバレッジを含みます。beta プロファイルは `run_release_soak=true` でオプトインできます。標準のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、full candidate は重複した live poller を開始しません。公開後は、`release_package_spec` を渡して、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、再ビルドせずに出荷済み npm パッケージを再利用します。公開済みパッケージの Telegram に絞った再実行には `npm_telegram_package_spec` だけを使用します。Codex Plugin live package レーンは、デフォルトで同じ選択状態を使います。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/artifact 実行では選択された ref から `extensions/codex` を pack します。`npm:`、`npm-pack:`、`git:` spec などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリクス、正確なワークフロージョブ名、プロファイルの違い、artifact、
焦点を絞った再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)
を参照してください。

`OpenClaw Release Publish` は、変更を加える手動リリースワークフローです。リリースタグが存在し、
OpenClaw npm preflight が成功した後に、`release/YYYY.M.PATCH` または `main` からディスパッチします。
これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージ向けに
`Plugin NPM Release` をディスパッチし、同じリリース SHA 向けに `Plugin ClawHub Release` を
ディスパッチし、その後で保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` を
ディスパッチします。stable 公開では、正確な `windows_node_tag` も必要です。このワークフローは、
公開子ワークフローの前に Windows ソースリリースを検証し、その x64/ARM64 インストーラーを
candidate 承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub
リリースドラフトを公開する前に、同じ固定インストーラーダイジェストと正確な companion asset、
checksum contract を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットの証明を行う場合は、
`gh workflow run ... --ref main -f ref=<sha>` の代わりに helper を使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生のコミット SHA ではありません。
helper はターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、その固定 ref から
`Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと
一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証器は、いずれかの子ワークフローが
異なる SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡される live/provider の範囲を制御します。
手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media
マトリクスを意図的に必要とする場合にのみ `full` を使用します。stable と full のリリースチェックは、
常に網羅的な live/E2E と Docker リリースパス soak を実行します。beta プロファイルは
`run_release_soak=true` でオプトインできます。

- `minimum` は、最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は、stable provider/backend セットを追加します。
- `full` は、広範な advisory provider/media マトリクスを実行します。

アンブレラはディスパッチされた子 run id を記録し、最後の `Verify full validation` ジョブは現在の子 run の結論を再チェックし、各子 run の最も遅いジョブ表を追記します。子ワークフローが再実行されて green になった場合は、アンブレラ結果とタイミングサマリーを更新するために親 verifier ジョブだけを再実行します。

リカバリーでは、`Full Release Validation` と `OpenClaw Release Checks` の両方が `rerun_group` を受け取ります。リリース候補には `all`、通常の full CI 子だけには `ci`、Plugin prerelease 子だけには `plugin-prerelease`、すべてのリリース子には `release-checks` を使用します。または、アンブレラ上で `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` のより狭いグループを使います。これにより、焦点を絞った修正後に失敗したリリースボックスの再実行を限定できます。失敗した単一のクロス OS レーンでは、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA release-check レーンは advisory ですが、標準 runtime tool coverage gate は例外で、必要な OpenClaw dynamic tools が standard tier サマリーからずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使用して、選択された ref を一度だけ `release-package-under-test` tarball に解決し、その artifact をクロス OS チェックと Package Acceptance に渡します。soak カバレッジが実行される場合は、live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージ bytes の一貫性が保たれ、複数の子ジョブで同じ candidate を再 pack することを避けられます。Codex npm-plugin live レーンでは、リリースチェックは `release_package_spec` から導出された一致する公開済み Plugin spec を渡すか、operator が指定した `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトが選択された checkout の Codex Plugin を pack するようにします。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` run は、
古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチ済みの
子ワークフローをキャンセルするため、新しい main 検証が古い 2 時間の release-check run の後ろに
滞留しません。リリースブランチ/タグ検証と、焦点を絞った再実行グループは
`cancel-in-progress: false` を維持します。

## Live と E2E shards

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

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

これにより、同じファイルカバレッジを保ちながら、遅い live provider 失敗の再実行と診断が容易になります。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` shard 名は、手動の一回限りの再実行にも引き続き有効です。

ネイティブ live media shard は、`Live Media Runner Image` ワークフローによってビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。この image には `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリを検証するだけです。Docker-backed live suite は通常の Blacksmith runner 上に維持してください。container job はネストした Docker test を起動する場所として不適切です。

Docker バックのライブモデル/バックエンドシャードは、選択されたコミットごとに個別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー別にシャーディングされた Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップ経路が停止した場合に、リリースチェックの予算全体を消費するのではなく早期に失敗します。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複するイメージビルドに実時間を浪費します。

## パッケージ受け入れ検証

「このインストール可能な OpenClaw パッケージはプロダクトとして動作するか」という問いには `Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れ検証は、ユーザーがインストール後または更新後に実行するのと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数のターゲット指定 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列のターゲット指定 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` ではない場合に実行され、Package Acceptance が 1 つを解決していれば同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ検証、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのプレリリース/安定版の受け入れ検証に使用します。
- `source=ref` は、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグをフェッチし、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離されたワークツリーに依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` が必須です。この経路では、URL 認証情報、デフォルト以外の HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決先 IP、同じ公開安全ポリシーの外部へのリダイレクトが拒否されます。
- `source=trusted-url` は、`.github/package-trusted-sources.json` 内の名前付き trusted-source ポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` が必須です。これは、設定済みのホスト、ポート、パスプレフィックス、リダイレクトホスト、またはプライベートネットワーク解決を必要とする、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用します。ポリシーが bearer auth を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL に埋め込まれた認証情報は引き続き拒否されます。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分離しておきます。`workflow_ref` はテストを実行する信頼されたワークフロー/ハーネスコードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスは、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリース経路チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、スタンドアロンディスパッチ用には公開済み npm spec 経路を維持します。

専用の更新および Plugin テストポリシー、ローカルコマンド、
Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skills インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明を、同じ解決済みパッケージ tarball 上に保ちます。ベータを公開した後、再ビルドせずに同じマトリクスを出荷済み npm パッケージに対して実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance がリリース検証の他の部分とは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新のプロダクト検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリース経路で実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択し、デフォルトは `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加えて、固定された Plugin 互換性境界リリースと、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルート向けの issue 形状の fixture へ拡張します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに個別のターゲット指定 Docker runner ジョブへシャーディングされます。別個の `Update Migration` ワークフローは、問いが通常の Full Release CI の広さではなく、公開済み更新クリーンアップの網羅性である場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定して `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡したり、`openclaw@2026.4.15` のように `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持したり、シナリオマトリクス向けに `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定したりできます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows パッケージ版およびインストーラーの新規レーンでは、インストール済みパッケージが生の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトにし、それ以外の場合は `openai/gpt-5.5` を使用するため、GPT-4.x デフォルトを避けながら、インストールと Gateway 証明を GPT-5 テストモデル上に保ちます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに境界付きのレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、互換性経路を使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指していてもよい。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップしてもよい。
- `update-channel-switch` は、tarball 由来の偽 git fixture から欠落している pnpm `patchedDependencies` を刈り込んでもよく、永続化された `update.channel` の欠落をログに記録してもよい。
- Plugin smoke は、レガシーなインストールレコード場所を読み取ったり、marketplace インストールレコード永続化の欠落を受け入れたりしてもよい。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変更されないことを引き続き要求しながら、設定メタデータ移行を許可してもよい。

公開済みの `2026.4.26` パッケージでは、すでに出荷済みだったローカルビルドメタデータスタンプファイルについても警告してよいです。それ以降のパッケージは現代的な契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ検証の実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調査します: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、自身の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージサーフェス、バンドル Plugin のパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャネル/Gateway/Plugin SDK サーフェスに触れる pull request で実行されます。ソースのみのバンドル Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを 1 回ビルドし、CLI をチェックし、agents delete shared-workspace CLI スモークを実行し、container gateway-network e2e を実行し、バンドル拡張のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きバンドル Plugin Docker プロファイルを実行します（各シナリオの Docker run は個別に上限設定されます）。
- **フルパス**は、夜間スケジュール実行、手動 dispatch、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker サーフェスに実際に触れる pull request 向けに、QR パッケージインストールとインストーラー Docker/update カバレッジを保持します。フルモードでは、install-smoke が target-SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/update スモーク、高速バンドル Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待つことはありません。

`main` への push（merge commit を含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フル install smoke は夜間またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` dispatch ではオプトインできますが、pull request と `main` への push では実行されません。通常の PR CI では、Node 関連の変更に対して高速 Bun ランチャー回帰レーンが引き続き実行されます。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を保持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/update/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールのスロット数。                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに影響を受けやすいテールプールのスロット数。                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm インストールレーン上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。ずらしをなくすには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ/テールレーンではより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定     | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定     | カンマ区切りの厳密なレーンリスト。agents が 1 つの失敗レーンを再現できるように cleanup smoke をスキップします。 |

有効上限より重いレーンでも、空のプールからは開始でき、その後キャパシティを解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先の順序付けのためにレーン所要時間を保存し、デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能なライブ/E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じて package-digest-tagged の bare/functional GHCR Docker E2E イメージをビルドして push し、再ビルドする代わりに指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存の package-digest イメージを再利用します。Docker イメージの pull は、レジストリ/キャッシュストリームが詰まっても CI のクリティカルパスの大半を消費せず素早く再試行されるよう、試行ごとに上限 180 秒のタイムアウトで再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは `OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンク化ジョブとして実行されるため、各チャンクは必要なイメージ種別のみを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`package-update-openai` にはライブ Codex Plugin パッケージレーンが含まれます。このレーンは候補 OpenClaw パッケージをインストールし、明示的な Codex CLI インストール承認付きで `codex_plugin_spec` または同一 ref の tarball から Codex Plugin をインストールし、Codex CLI preflight を実行し、その後 OpenAI に対して同一セッションの OpenClaw agent turn を複数実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求した場合に `plugins-runtime-services` に組み込まれ、OpenWebUI のみの dispatch の場合だけスタンドアロンの `openwebui` チャンクを保持します。バンドルチャネル update レーンは、一時的な npm ネットワーク失敗に対して 1 回再試行します。

各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、低速レーン表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは対象 Docker ジョブ 1 つに限定され、その実行のためにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗レーンは失敗した実行からまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2E ワークフローは、フル release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストなプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによって dispatch される別ワークフローです。通常の pull request、`main` への push、スタンドアロンの手動 CI dispatch では、このスイートは無効のままです。これはバンドル Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、一度に最大 2 つの Plugin 設定グループを、グループごとに 1 つの Vitest ワーカーと大きめの Node ヒープで実行するため、import の多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用 Docker プレリリースパスは、1〜3 分のジョブのために何十ものランナーを予約しないよう、対象 Docker レーンを小さなグループにまとめます。このワークフローは `@openclaw/plugin-inspector` から情報提供用の `plugin-inspector-advisory` アーティファクトもアップロードします。inspector の検出事項はトリアージ入力であり、ブロッキングの Plugin Prerelease ゲートを変更しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外側に専用の CI レーンがあります。agentic parity は広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。parity を広範な検証実行に同乗させる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間および手動 dispatch 時に実行されます。mock parity レーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定論的 mock プロバイダーと mock-qualified モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブ transport レーンを実行するため、チャネル契約はライブモデル遅延と通常の provider-plugin 起動から分離されます。ライブ transport Gateway は、QA parity がメモリ動作を別途カバーするため、memory search を無効にします。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix は、スケジュールゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` dispatch は常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA parity ゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後最終 parity 比較のために両方のアーティファクトを小さなレポートジョブへダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープされた CI/check 証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは意図的に狭い初回パスのセキュリティスキャナーであり、リポジトリ全体のスイープではありません。日次、手動、非ドラフト pull request ガード実行は、Actions ワークフローコードに加えて、high/critical の `security-severity` にフィルタされた高信頼度セキュリティクエリで、最もリスクの高い JavaScript/TypeScript サーフェスをスキャンします。

pull request ガードは軽量のままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有するバンドル Plugin runtime パス配下の変更に対してのみ開始し、スケジュールワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトから外れたままです。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装コントラクトに加え、チャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査の接点              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーのサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス起動ヘルパー、サブプロセスを所有する同梱 Plugin ランタイム、ワークフロースクリプト接着コード                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin のインストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージコントラクトの信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフローの健全性チェックで許可される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドする。`/codeql-critical-security/android` 配下にアップロードする。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、アップロードされる SARIF から依存関係ビルド結果を除外し、`/codeql-critical-security/macos` 配下にアップロードする。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置かれている。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードである。狭く高価値なサーフェスに対して、エラー重大度の非セキュリティ JavaScript/TypeScript 品質クエリだけを GitHub ホスト Linux ランナー上で実行し、品質スキャンが Blacksmith ランナー登録予算を消費しないようにする。プルリクエストガードは、スケジュールプロファイルより意図的に小さい。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルと同梱チャンネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着コード、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージコントラクト、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードだけを実行する。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行する。

手動ディスパッチは次を受け付ける。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復フックである。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、マイグレーション、正規化、IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルと同梱チャンネル Plugin の実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化接着コード、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルのサーフェス、セッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティと分離したままにする。これにより、セキュリティシグナルを曖昧にせずに、品質の検出結果をスケジュール、測定、無効化、拡張できる。Swift、Python、同梱 Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定してから、スコープ付きまたはシャード化されたフォローアップ作業としてのみ戻すべきである。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近マージされた変更に既存ドキュメントを合わせ続けるための、イベント駆動型 Codex メンテナンスレーンである。純粋なスケジュールはない。`main` への非 bot プッシュ CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できる。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップする。実行時には、前回スキップされなかった Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に蓄積されたすべての main 変更をカバーできる。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動型 Codex メンテナンスレーンである。純粋なスケジュールはない。`main` への非 bot プッシュ CI 実行が成功するとトリガーできるが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップする。手動ディスパッチは、その日次アクティビティゲートをバイパスする。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせる。その後、フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否する。グループ化レポートは Linux と macOS で設定ごとのウォールタイムと最大 RSS を記録するため、前後比較では所要時間の差分に加えてテストメモリの差分も表面化する。ベースラインに失敗テストがある場合、Codex は明らかな失敗だけを修正でき、エージェント後のフルスイートレポートはコミット前に合格しなければならない。bot のプッシュが反映される前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行してプッシュを再試行する。競合する古いパッチはスキップされる。Codex アクションが docs agent と同じ drop-sudo 安全姿勢を維持できるように、GitHub ホスト Ubuntu を使用する。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、マージ後の重複クリーンアップ用の手動メンテナーワークフローである。デフォルトは dry-run で、`apply=true` の場合に明示的に列挙された PR だけをクローズする。GitHub を変更する前に、マージ済み PR がマージされていること、および各重複に共有された参照 issue または重複する変更 hunk があることを検証する。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行される。このローカルチェックゲートは、広い CI プラットフォームスコープよりもアーキテクチャ境界に厳しい。

- コア本番変更では、コア本番とコアテストの型チェックに加えて、コア lint/guard を実行する。
- コアのテストのみの変更では、コアテストの型チェックに加えてコア lint だけを実行する。
- extension 本番変更では、extension 本番と extension テストの型チェックに加えて、extension lint を実行する。
- extension のテストのみの変更では、extension テストの型チェックに加えて extension lint を実行する。
- 公開 Plugin SDK または Plugin コントラクトの変更は、extension がそれらのコアコントラクトに依存するため、extension 型チェックまで拡張する（Vitest extension スイープは明示的なテスト作業のまま）。
- リリースメタデータのみのバージョンバンプでは、対象を絞ったバージョン/設定/ルート依存関係チェックを実行する。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンで失敗させる。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より軽量である。直接のテスト編集はそのテスト自身を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ依存先を使う。共有グループルーム配信設定は明示的マッピングの 1 つである。グループの可視返信設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルト変更は最初の PR プッシュ前に失敗する。変更がハーネス全体に及ぶほど広く、安価なマッピングセットを信頼できる代理と見なせない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用する。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有リモートボックスラッパーです。チェックがローカル編集ループには広すぎる場合、CI
との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、
再利用可能なボックス、リモートログが必要な場合に、リポジトリルートから使用します。通常の OpenClaw バックエンドは
`blacksmith-testbox` です。所有 AWS/Hetzner 容量は、Blacksmith
の障害、クォータ問題、または所有容量テストを明示的に行う場合のフォールバックです。

Crabbox backed Blacksmith 実行は、ワンショット Testbox をウォームアップ、確保、同期、実行、レポート、クリーンアップします。組み込みの同期健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short`
で少なくとも 200 件の追跡済み削除が表示された場合に早期失敗します。意図的な大規模削除 PR では、リモートコマンドに
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

Crabbox は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定するか、非常に大きいローカル差分にはより大きいミリ秒値を使用します。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を通知しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがあっても、プロバイダーは明示的に渡します。Codex ワークツリーまたはリンク/スパースチェックアウトでは、Crabbox の開始前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトを避け、代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith backed 実行には Crabbox 0.22.0 以降が必要です。これにより、ラッパーは現在の Testbox 同期、キュー、クリーンアップ動作を取得します。兄弟チェックアウトを使用する場合は、タイミング測定または証明作業の前に、無視対象のローカルバイナリを再ビルドします。

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

最後の JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委譲された
Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行はハイドレーションとキープアライブを所有します。SSH コマンドがすでに返った後に Testbox が外部から停止されると、`cancelled` として終了することがあります。ラッパーの `exitCode` がゼロ以外であるか、コマンド出力に失敗したテストが表示されていない限り、それはクリーンアップ/ステータス成果物として扱います。
ワンショットの Blacksmith backed Crabbox 実行は Testbox を自動的に停止するはずです。実行が中断された場合、またはクリーンアップが不明確な場合は、ライブボックスを調査し、自分が作成したボックスだけを停止します。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレーション済みボックスで複数のコマンドが意図的に必要な場合にのみ、再利用を使用します。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層だが Blacksmith 自体は動作する場合は、`list`、`status`、クリーンアップなどの診断に限って直接 Blacksmith を使用します。直接 Blacksmith 実行をメンテナー証明として扱う前に、Crabbox パスを修正します。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、課金、または組織制限の圧迫として扱います。自分が作成したキュー済み ID を停止し、これ以上 Testbox を開始せず、誰かが Blacksmith ダッシュボード、課金、組織制限を確認している間に、下記の所有 Crabbox 容量パスへ証明を移します。

Blacksmith が停止している、クォータ制限がある、必要な環境がない、または所有容量が明示的な目的である場合にのみ、所有 Crabbox 容量へエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 圧迫下では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` を避けます。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は `standard`、複数の容量リージョン、`capacity.hints: true` をデフォルトにしているため、仲介された AWS リースは選択されたリージョン/マーケット、クォータ圧迫、Spot フォールバック、高圧クラス警告を表示します。重めの広範なチェックには `fast` を使用し、standard/fast では不十分な場合にのみ `large` を使用し、`beast` はフルスイートや全 Plugin Docker マトリックス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドレーンにのみ使用します。`pnpm check:changed`、絞り込んだテスト、docs のみの作業、通常の lint/typecheck、小規模 E2E 再現、Blacksmith 障害トリアージには `beast` を使用しないでください。容量診断には `--market on-demand` を使用し、Spot マーケットの変動がシグナルに混ざらないようにします。

`.crabbox.yaml` は、所有クラウドレーン向けのプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。これはローカル `.git` を除外するため、ハイドレーション済み Actions チェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期する代わりに自身のリモート Git メタデータを保持します。また、転送すべきでないローカル実行時/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けに、チェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
