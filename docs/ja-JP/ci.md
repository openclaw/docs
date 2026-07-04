---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしている
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリースアンブレラ、ローカルコマンド相当品
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-04T06:21:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。正規の
`main` プッシュは、まず 90 秒間の hosted-runner 受け入れウィンドウを通過します。
既存の `CI` concurrency group は、より新しいコミットが到着するとその待機中の実行をキャンセルするため、
連続したマージがそれぞれ完全な Blacksmith
matrix を登録することはありません。プルリクエストと手動 dispatch は待機をスキップします。`preflight` ジョブは
その後 diff を分類し、無関係な領域だけが変更された場合は高コストな lane をオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な
検証のために、意図的にスマートな
スコープ設定をバイパスし、完全なグラフへ fan out します。Android lane は `include_android` によって opt-in のままです。リリース専用の
Plugin カバレッジは別の [`Plugin Prerelease`](#plugin-prerelease)
workflow にあり、[`Full Release Validation`](#full-release-validation)
または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                                | 目的                                                                                                   | 実行されるタイミング                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only 変更、変更スコープ、変更された extensions を検出し、CI manifest をビルドする                   | draft 以外のプッシュと PR で常に                  |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` プッシュに対して hosted の 90 秒 debounce を行う                | すべての CI 実行。sleep は正規の `main` プッシュのみ |
| `security-fast`                    | 秘密鍵検出、`zizmor` による変更 workflow 監査、本番 lockfile 監査                 | draft 以外のプッシュと PR で常に                  |
| `check-dependencies`               | 本番 Knip dependency-only パスと未使用ファイル allowlist guard                                 | Node 関連の変更                               |
| `build-artifacts`                  | `dist/`、Control UI、built-CLI smoke checks、埋め込み built-artifact checks、再利用可能な artifacts をビルドする | Node 関連の変更                               |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI-routing checks などの高速な Linux 正当性 lane                | Node 関連の変更                               |
| `checks-fast-contracts-plugins-*`  | 2 つに sharding された Plugin contract checks                                                                        | Node 関連の変更                               |
| `checks-fast-contracts-channels-*` | 2 つに sharding された channel contract checks                                                                       | Node 関連の変更                               |
| `checks-node-core-*`               | channel、bundled、contract、extension lane を除く Core Node test shards                          | Node 関連の変更                               |
| `check-*`                          | sharding された main local gate 相当: prod types、lint、guards、test types、strict smoke                | Node 関連の変更                               |
| `check-additional-*`               | architecture、sharding された boundary/prompt drift、extension guards、package boundary、runtime topology     | Node 関連の変更                               |
| `checks-node-compat-node22`        | Node 22 compatibility build と smoke lane                                                                | リリース用の手動 CI dispatch                     |
| `check-docs`                       | docs formatting、lint、broken-link checks                                                             | Docs が変更された場合                                        |
| `skills-python`                    | Python backed Skills 向けの Ruff + pytest                                                                    | Python-skill 関連の変更                       |
| `checks-windows`                   | Windows 固有の process/path tests と共有 runtime import specifier regressions                      | Windows 関連の変更                            |
| `macos-node`                       | 共有 built artifacts を使う macOS TypeScript test lane                                               | macOS 関連の変更                              |
| `macos-swift`                      | macOS app 向けの Swift lint、build、tests                                                            | macOS 関連の変更                              |
| `ios-build`                        | Xcode project generation と iOS app simulator build                                                 | iOS app、shared app kit、または Swabble の変更         |
| `android`                          | 両方の flavor の Android unit tests と 1 つの debug APK build                                              | Android 関連の変更                            |
| `test-performance-agent`           | trusted activity 後の日次 Codex slow-test 最適化                                                 | Main CI success または manual dispatch                  |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 live lane を含む日次/on-demand Kova runtime performance reports | Scheduled と manual dispatch                       |

## Fail-fast 順序

1. `runner-admission` は正規の `main` プッシュでのみ待機します。より新しいプッシュは Blacksmith 登録前に実行をキャンセルします。
2. `preflight` はどの lane が存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内の step であり、独立した job ではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い artifact と platform matrix job を待たずにすばやく失敗します。
4. `build-artifacts` は高速な Linux lane と重なって実行されるため、下流の consumer は共有 build の準備ができ次第開始できます。
5. その後、より重い platform と runtime lane が fan out します: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref により新しい push が到着すると、GitHub は置き換えられた job を `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗している場合を除き、これは CI ノイズとして扱ってください。Matrix job は `fail-fast: false` を使用し、`build-artifacts` は小さな verifier job を queuing する代わりに、埋め込み channel、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI concurrency key は versioned (`CI-v7-*`) されているため、古い queue group 内の GitHub 側 zombie が新しい main 実行を無期限にブロックすることはありません。手動 full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使うと、GitHub Actions から wall time、queue time、最も遅い job、failure、`pnpm-store-warmup` fanout barrier を要約できます。CI は同じ run summary を `ci-timings-summary` artifact としてもアップロードします。build timing については、`build-artifacts` job の `Build dist` step を確認してください: `pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。この job は `startup-memory` artifact もアップロードします。

プルリクエスト実行では、terminal timing-summary job は `GH_TOKEN` を `gh run view` に渡す前に、trusted base revision から helper を実行します。これにより、token 付き query を branch-controlled code から切り離しつつ、プルリクエストの現在の CI 実行を要約できます。

## PR context と evidence

外部 contributor の PR は、
`.github/workflows/real-behavior-proof.yml` から PR context と evidence gate を実行します。この workflow は trusted
base commit を checkout し、PR body のみを評価します。contributor branch の code は実行しません。

この gate は、repository owner、member、
collaborator、bot ではない PR author に適用されます。PR body に author が書いた
`What Problem This Solves` と `Evidence` section が含まれている場合に pass します。Evidence には、focused
test、CI result、screenshot、recording、terminal output、live observation、
redacted log、artifact link を指定できます。body は意図と有用な validation を提供します。
reviewer は code、test、CI を調べて正しさを評価します。

check が失敗した場合は、別の code commit を push するのではなく、PR body を更新してください。

## Scope と routing

Scope logic は `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動 dispatch は changed-scope detection をスキップし、preflight manifest を、すべての scoped area が変更されたかのように動作させます。

- **CI workflow edits** は Node CI graph と workflow linting を検証しますが、それだけで Windows、iOS、Android、macOS native build を強制することはありません。これらの platform lane は platform source changes に scoped されたままです。
- **Workflow Sanity** は `actionlint`、すべての workflow YAML file に対する `zizmor`、composite-action interpolation guard、conflict-marker guard を実行します。PR-scoped の `security-fast` job も、変更された workflow file に対して `zizmor` を実行するため、workflow security finding は main CI graph の早い段階で失敗します。
- **`main` push 上の docs** は、CI が使用するものと同じ ClawHub docs mirror を使う standalone の `Docs` workflow によって check されるため、code+docs が混在する push で CI の `check-docs` shard も queue されることはありません。プルリクエストと手動 CI は、docs が変更された場合に CI から `check-docs` を引き続き実行します。
- **TUI PTY** は、TUI 変更向けに `checks-node-core-runtime-tui-pty` Linux Node shard で実行されます。この shard は `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` で `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定的な `TuiBackend` fixture lane と、external model endpoint のみを mock するより遅い `tui --local` smoke の両方をカバーします。
- **CI routing-only edits、選択された安価な core-test fixture edits、狭い plugin contract helper/test-routing edits** は、高速な Node-only manifest path を使用します: `preflight`、security、単一の `checks-fast-core` task です。この path は、変更が routing または helper surface に限定され、高速 task が直接 exercise する場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、およびその lane を実行する CI workflow surface に scoped されます。無関係な source、plugin、install-smoke、test-only changes は Linux Node lane に残ります。

最も遅い Node テストファミリーは、各ジョブがランナーを過剰に予約せず小さく保たれるように分割または均衡化されている。Plugin コントラクトとチャンネルコントラクトはそれぞれ、標準の GitHub ランナーへのフォールバック付きで、Blacksmith バックの重み付きシャード 2 つとして実行される。core unit fast/support レーンは別々に実行され、core runtime infra は state、process/config、shared、3 つの cron ドメインシャードに分割される。auto-reply は均衡化されたワーカーとして実行される（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/server 設定は、ビルド済みアーティファクトを待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割される。通常の CI では、独立した infra include-pattern シャードだけを最大 64 個のテストファイルからなる決定的なバンドルに詰めることで、非独立の command/cron、ステートフルな agents-core、gateway/server スイートを結合せずに Node マトリクスを削減する。重い固定スイートは 8 vCPU のままにし、バンドル済みレーンと低重みのレーンは 4 vCPU を使う。正規リポジトリ上の pull request では、追加のコンパクトな受け入れプランを使う。同じ設定別グループが現在の 34 ジョブ Linux Node プラン内の独立サブプロセスで実行されるため、単一の PR が 70 ジョブ超の完全な Node マトリクスを登録することはない。`main` push、手動 dispatch、リリースゲートでは完全なマトリクスを維持する。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest 設定を使う。Include-pattern シャードは CI シャード名でタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できる。`check-additional-*` は package-boundary のコンパイル/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離する。boundary guard リストは、prompt が重いシャード 1 つと残りの guard ストライプ用の結合シャード 1 つにストライプ化され、それぞれ選択された独立 guard を並行実行し、チェックごとのタイミングを出力する。高コストな Codex happy-path prompt snapshot drift チェックは、手動 CI と prompt に影響する変更の場合のみ独自の追加ジョブとして実行される。そのため、通常の無関係な Node 変更が cold prompt snapshot 生成の後ろで待たされることはなく、boundary シャードは均衡を保ちつつ、prompt drift はそれを発生させた PR に固定される。同じフラグは、ビルド済みアーティファクトの core support-boundary シャード内で prompt snapshot Vitest 生成をスキップする。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行される。

受け入れ後、正規 Linux CI は最大 24 個の Node テストジョブと、
小さめの fast/check レーン用に 12 個の並行実行を許可する。Windows と Android は、
これらのランナープールがより狭いため 2 個のままにする。

コンパクト PR プランは、現在のスイートに対して 18 個の Node ジョブを発行する。whole-config
グループは 120 分のバッチタイムアウト付きで独立サブプロセスにバッチ化され、
include-pattern グループは同じ境界付きジョブ予算を共有する。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドする。third-party flavor には別のソースセットやマニフェストはない。その unit-test レーンは、SMS/call-log BuildConfig フラグ付きで flavor を引き続きコンパイルしつつ、Android 関連の各 push で debug APK パッケージングジョブが重複することを避ける。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定された本番 Knip dependency-only パスで、`dlx` インストールでは pnpm の minimum release age が無効化される）と `pnpm deadcode:unused-files` を実行する。後者は Knip の本番 unused-file 検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較する。unused-file guard は、PR が新しい未レビューの未使用ファイルを追加した場合や古い allowlist エントリを残した場合に失敗し、Knip が静的に解決できない意図的な動的 Plugin、生成物、ビルド、live-test、package bridge サーフェスは保持する。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティから ClawSweeper へのターゲット側ブリッジである。信頼できない pull request コードをチェックアウトしたり実行したりしない。この workflow は `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` に dispatch する。

この workflow には 4 つのレーンがある。

- `clawsweeper_item`: 正確な issue と pull request レビューリクエスト用。
- `clawsweeper_comment`: issue コメント内の明示的な ClawSweeper コマンド用。
- `clawsweeper_commit_review`: `main` push 上のコミットレベルのレビューリクエスト用。
- `github_activity`: ClawSweeper エージェントが検査する可能性のある一般的な GitHub アクティビティ用。

`github_activity` レーンは、正規化されたメタデータのみを転送する。イベントタイプ、アクション、アクター、リポジトリ、項目番号、URL、タイトル、状態、存在する場合はコメントまたはレビューの短い抜粋である。完全な webhook 本文を転送することは意図的に避けている。`openclaw/clawsweeper` の受信 workflow は `.github/workflows/github-activity.yml` であり、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway hook に投稿する。

一般アクティビティは観測であり、デフォルト配信ではない。ClawSweeper エージェントは prompt 内で Discord ターゲットを受け取り、イベントが意外、対応可能、リスクあり、または運用上有用な場合にのみ `#clawsweeper` に投稿する必要がある。通常の open、edit、bot の churn、重複 webhook ノイズ、通常のレビュー traffic は `NO_REPLY` になるべきである。

この経路全体で、GitHub のタイトル、コメント、本文、レビューテキスト、ブランチ名、コミットメッセージは信頼できないデータとして扱う。それらは要約とトリアージの入力であり、workflow やエージェント runtime への指示ではない。

## 手動 dispatch

手動 CI dispatch は通常の CI と同じジョブグラフを実行するが、Android 以外のすべてのスコープ付きレーンを強制的に有効にする。Linux Node シャード、bundled-plugin シャード、Plugin とチャンネルのコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトの smoke チェック、docs チェック、Python Skills、Windows、macOS、iOS build、Control UI i18n である。スタンドアロンの手動 CI dispatch は `include_android=true` の場合のみ Android を実行する。完全リリース umbrella は `include_android=true` を渡すことで Android を有効化する。Plugin prerelease static checks、release-only の `agentic-plugins` シャード、full extension batch sweep、Plugin prerelease Docker レーンは CI から除外される。Docker prerelease スイートは、`Full Release Validation` が release-validation gate を有効にして別個の `Plugin Prerelease` workflow を dispatch した場合にのみ実行される。

手動実行では一意の concurrency group を使うため、release-candidate のフルスイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはない。任意の `target_ref` 入力により、信頼された呼び出し元は、選択された dispatch ref の workflow ファイルを使いながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できる。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                          | ジョブ                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI dispatch と非正規リポジトリのフォールバック、CodeQL JavaScript/actions 品質スキャン、workflow-sanity、labeler、auto-response、CI 外の docs workflow、Blacksmith マトリクスがより早くキューに入れるようにする install-smoke preflight                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低重みの extension シャード、QA Smoke CI を除く `checks-fast-core`、Plugin/チャンネルコントラクトシャード、ほとんどの bundled/低重み Linux Node シャード、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` シャード、`check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持される重い Linux Node スイート、boundary/extension が重い `check-additional-*` シャード、`android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI と Testbox の `build-artifacts`、`check-lint`（CPU 感度が高く、8 vCPU では節約分よりコストが大きい）、install-smoke Docker ビルド（32-vCPU のキュー時間コストが節約分より大きい）                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。fork は `macos-15` にフォールバックする                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。fork は `macos-26` にフォールバックする                                                                                                                                                                                                                     |

## ランナー登録予算

OpenClaw の現在の GitHub runner-registration バケットは、`ghx api rate_limit` で 5 分あたり 10,000 件の self-hosted
runner registration を報告している。GitHub はこのバケットを変更できるため、各チューニングパスの前に
`actions_runner_registration` を再確認する。この制限は `openclaw` organization 内のすべての Blacksmith ランナー登録で共有されるため、別の Blacksmith インストールを追加しても新しいバケットは追加されない。

Blacksmith ラベルは burst control の希少リソースとして扱う。ルーティング、通知、要約、シャード選択、または短い CodeQL スキャンだけを行うジョブは、測定済みの Blacksmith 固有ニーズがない限り GitHub-hosted ランナーに留めるべきである。新しい Blacksmith マトリクス、より大きい `max-parallel`、または高頻度 workflow は、最悪ケースの登録数を示し、organization レベルのターゲットを live バケットのおよそ 60% 未満に保つ必要がある。現在の 10,000 登録バケットでは、これは 6,000 登録の運用ターゲットを意味し、並行リポジトリ、retry、burst overlap の余裕を残す。

正規リポジトリ CI は、通常の push と pull-request 実行に対して Blacksmith をデフォルトのランナーパスとして維持する。`workflow_dispatch` と非正規リポジトリ実行は GitHub-hosted ランナーを使うが、通常の正規実行は現在、Blacksmith のキュー健全性を probe したり、Blacksmith が利用できない場合に GitHub-hosted ラベルへ自動フォールバックしたりしない。

## ローカル同等物

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

`OpenClaw Performance` は、製品とランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でもディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチでは通常、ワークフローの ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターは、テスト対象の ref をキーにします。各 `index.md` には、テスト対象の ref/SHA、ワークフローの ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターが記録されます。

このワークフローは、ピン留めされたリリースから OCM を、ピン留めされた `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンでは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースにおける Gateway 起動タイミングとメモリ、バンドル Plugin インポート RSS、反復 mock-OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象 ref について以前に公開された mock-provider ソースレポートが利用できる場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーは、レポートバンドル内の `source/index.md` にあり、隣に生 JSON があります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## 完全リリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカードレンダリング、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable と full プロファイルには、網羅的な live/E2E と Docker リリースパスの soak カバレッジが常に含まれます。beta プロファイルでは `run_release_soak=true` で有効化できます。正規のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補は重複する live poller を開始しません。公開後は、`release_package_spec` を渡すことで、出荷済み npm パッケージをリリースチェック、Package Acceptance、Docker、クロス OS、Telegram で再ビルドせずに再利用できます。公開済みパッケージの Telegram に絞った再実行にのみ `npm_telegram_package_spec` を使用します。Codex Plugin の live パッケージレーンは、デフォルトで同じ選択状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行では選択された ref から `extensions/codex` をパックします。`npm:`、`npm-pack:`、`git:` 仕様などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、絞り込み再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、リリースに変更を加える手動ワークフローです。リリースタグが存在し、OpenClaw npm プリフライトが成功した後に、`release/YYYY.M.PATCH` または `main` からディスパッチします。`pnpm plugins:sync:check` を検証し、すべての公開可能な Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後でのみ保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。stable 公開では正確な `windows_node_tag` も必要です。ワークフローは Windows ソースリリースを検証し、公開用の子ワークフローより前に、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、同じピン留めされたインストーラーダイジェストに加えて、正確なコンパニオンアセットとチェックサム契約を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチでピン留めされたコミット証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、そのピン留めされた ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。包括ベリファイアは、いずれかの子ワークフローが異なる SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡される live/provider の範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な助言用 provider/media マトリクスを意図的に実行したい場合にのみ `full` を使用します。stable と full のリリースチェックでは、網羅的な live/E2E と Docker リリースパス soak が常に実行されます。beta プロファイルでは `run_release_soak=true` で有効化できます。

- `minimum` は、最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は、stable provider/backend セットを追加します。
- `full` は、広範な助言用 provider/media マトリクスを実行します。

包括ワークフローはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行について最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、包括結果とタイミングサマリーを更新するために親ベリファイアジョブだけを再実行します。

復旧のために、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け取ります。リリース候補には `all`、通常の full CI 子のみには `ci`、Plugin prerelease 子のみには `plugin-prerelease`、すべてのリリース子には `release-checks`、または包括ワークフロー上でより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、集中的な修正後の失敗したリリースボックス再実行を限定できます。1 つの失敗したクロス OS レーンには、たとえば `windows/packaged-upgrade` のように、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは、標準ランタイムツールカバレッジゲートを除き助言扱いです。このゲートは、必要な OpenClaw 動的ツールが標準ティアサマリーからずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使って、選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。soak カバレッジが実行される場合は、live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージバイト列を一貫させ、複数の子ジョブで同じ候補を再パックすることを避けます。Codex npm-Plugin live レーンでは、リリースチェックは `release_package_spec` から導出された一致する公開済み Plugin 仕様を渡すか、オペレーター指定の `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトが選択されたチェックアウトの Codex Plugin をパックするようにします。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` 実行は、古い包括ワークフローを置き換えます。親モニターは、親がキャンセルされると、すでにディスパッチ済みの子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろに滞留しません。リリースブランチ/タグ検証と絞り込み再実行グループは `cancel-in-progress: false` を維持します。

## Live と E2E シャード

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、単一の直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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
- 分割されたメディア音声/動画シャード、および provider でフィルターされた音楽シャード

これにより、同じファイルカバレッジを維持しながら、遅い live provider の失敗を再実行および診断しやすくします。集約シャード名 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` は、手動の単発再実行で引き続き有効です。

ネイティブ live メディアシャードは、`Live Media Runner Image` ワークフローによってビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリを検証するだけです。Docker ベースの live スイートは通常の Blacksmith runner 上に置いてください。コンテナジョブはネストした Docker テストを起動する場所として適していません。

Docker によって支えられたライブモデル/バックエンドシャードは、選択されたコミットごとに別々の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー別にシャードされた Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップパスが停止した場合にリリースチェック全体の予算を消費するのではなく高速に失敗します。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドで実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」を確認するときは、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択している場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` ではないときに実行され、Package Acceptance が解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm 仕様を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け入れます。公開済みのプレリリース/安定版の受け入れに使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグをフェッチし、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離されたワークツリーで依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。このパスは URL 認証情報、デフォルト以外の HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済み IP、同じ公開安全ポリシー外へのリダイレクトを拒否します。
- `source=trusted-url` は `.github/package-trusted-sources.json` 内の名前付き信頼済みソースポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。設定されたホスト、ポート、パスプレフィックス、リダイレクトホスト、またはプライベートネットワーク解決が必要な、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用します。ポリシーが bearer 認証を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL 埋め込み認証情報は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm 仕様パスはスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリース既定値、失敗トリアージを含む、
専用の更新および Plugin テストポリシーについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skills インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が、同じ解決済みパッケージ tarball 上に維持されます。ベータ公開後に出荷済み npm パッケージに対して同じマトリクスを再ビルドなしで実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance がリリース検証の残りとは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム動作を引き続きカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバック公開済みベースラインを選択し、既定では `openclaw@latest` になります。失敗レーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加えて、固定された Plugin 互換性境界リリース、および Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルート向けの課題形状のフィクスチャへ拡張します。複数ベースラインの公開済みアップグレードサバイバー選択は、ベースライン別に個別の対象 Docker ランナージョブへシャードされます。別個の `Update Migration` ワークフローは、通常の Full Release CI の広さではなく、公開済み更新クリーンアップを網羅的に確認することが目的の場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を伴う `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ仕様を渡すこと、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持すること、またはシナリオマトリクス向けに `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定することができます。公開済みレーンは焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みレーンとインストーラー新規レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドをインポートできることも検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を既定とし、それ以外の場合は `openai/gpt-5.5` を既定とします。これにより、GPT-4.x 既定値を避けつつ、インストールと Gateway 証明を GPT-5 テストモデル上に維持します。

### レガシー互換性期間

Package Acceptance には、すでに公開済みのパッケージ向けに境界付きのレガシー互換性期間があります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の偽 git フィクスチャから欠落している pnpm `patchedDependencies` を取り除く場合があり、欠落している永続化済み `update.channel` をログに出す場合があります。
- Plugin smoke はレガシーインストールレコード位置を読み取る場合や、マーケットプレイスインストールレコード永続化の欠落を受け入れる場合があります。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変更されないことを引き続き要求しつつ、設定メタデータ移行を許可する場合があります。

公開済みの `2026.4.26` パッケージは、すでに出荷済みだったローカルビルドメタデータスタンプファイルについて警告する場合もあります。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/package サーフェス、バンドル済みPluginの package/manifest 変更、または Docker smoke ジョブが実行する core plugin/channel/gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル済みPlugin変更、テストのみの編集、docs のみの編集は Docker worker を予約しません。高速パスは、ルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI smoke を実行し、container gateway-network e2e を実行し、バンドル済み extension の build arg を検証し、240 秒の集約コマンドタイムアウト内で制限付きバンドル済みPlugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定されます）。
- **フルパス** は、QR package install と installer Docker/update カバレッジを、nightly のスケジュール実行、手動ディスパッチ、workflow-call のリリースチェック、および installer/package/Docker サーフェスに実際に触れるプルリクエスト向けに保持します。フルモードでは、install-smoke は target-SHA の GHCR ルート Dockerfile smoke イメージを 1 つ準備または再利用し、その後 QR package install、ルート Dockerfile/gateway smokes、installer/update smokes、高速のバンドル済みPlugin Docker E2E を別々のジョブとして実行するため、installer 作業がルートイメージ smoke の後ろで待つことはありません。

`main` への push（merge commit を含む）はフルパスを強制しません。push で変更スコープロジックがフルカバレッジを要求する場合、workflow は高速 Docker smoke を維持し、フル install smoke は nightly またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別途ゲートされます。これは nightly スケジュールと release checks workflow から実行され、手動の `Install Smoke` ディスパッチでは opt in できますが、プルリクエストと `main` push では実行されません。通常の PR CI では、Node 関連の変更に対して高速な Bun launcher regression lane が引き続き実行されます。QR と installer Docker テストは、それぞれ install に焦点を当てた Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度 pack し、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- installer/update/plugin-dependency lane 用の素の Node/Git runner。
- 通常の機能 lane 用に、同じ tarball を `/app` にインストールする functional イメージ。

Docker lane 定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、runner は選択された plan のみを実行します。scheduler は `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` で lane ごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で lane を実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常 lane 用の main-pool slot 数。                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | provider-sensitive tail-pool slot 数。                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | provider が throttle しないようにする同時 live lane 上限。                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install lane 上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時 multi-service lane 上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon create storm を避けるための lane 開始間隔。stagger なしの場合は `0` に設定。   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | lane ごとの fallback timeout（120 分）。選択された live/tail lane はより厳しい上限を使用。   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` は lane を実行せず scheduler plan を出力。                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの厳密な lane リスト。agent が失敗した lane を 1 つ再現できるよう cleanup smoke をスキップ。 |

有効上限より重い lane でも、空の pool からなら開始でき、その後 capacity を解放するまで単独で実行されます。ローカルの集約実行は Docker を preflight し、古い OpenClaw E2E container を削除し、active-lane status を出力し、longest-first ordering のために lane timing を永続化し、デフォルトでは最初の失敗後に新しい pooled lane の scheduling を停止します。

### 再利用可能な live/E2E workflow

再利用可能な live/E2E workflow は、どの package、image kind、live image、lane、credential coverage が必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。`scripts/docker-e2e.mjs` はその plan を GitHub outputs と summaries に変換します。これは、`scripts/package-openclaw-for-docker.mjs` 経由で OpenClaw を pack するか、現在の run の package artifact をダウンロードするか、`package_artifact_run_id` から package artifact をダウンロードします。tarball inventory を検証し、plan が package-installed lane を必要とする場合は Blacksmith の Docker layer cache 経由で package-digest-tagged bare/functional GHCR Docker E2E image をビルドして push し、再ビルドする代わりに提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` inputs または既存の package-digest image を再利用します。Docker image pull は、registry/cache stream が停止した場合に CI critical path の大半を消費せずすばやく retry できるよう、attempt ごとに 180 秒の制限付き timeout で retry されます。

### リリースパスの chunk

Release Docker coverage は、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さめの chunk job として実行されるため、各 chunk は必要な image kind のみを pull し、同じ weighted scheduler 経由で複数の lane を実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在の release Docker chunk は、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`package-update-openai` には live Codex Plugin package lane が含まれます。これは candidate OpenClaw package をインストールし、`codex_plugin_spec` または同一 ref の tarball から Codex Plugin を明示的な Codex CLI install approval 付きでインストールし、Codex CLI preflight を実行したうえで、OpenAI に対して同一 session の OpenClaw agent turn を複数回実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 plugin/runtime alias のままです。`install-e2e` lane alias は、両方の provider installer lane に対する集約手動 rerun alias のままです。

フルの release-path coverage が要求する場合、OpenWebUI は `plugins-runtime-services` に組み込まれ、OpenWebUI のみの dispatch に限って standalone の `openwebui` chunk を維持します。Bundled-channel update lane は、一時的な npm network failure に対して 1 回 retry します。

各 chunk は、lane log、timing、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、slow-lane table、lane ごとの rerun command を含む `.artifacts/docker-tests/` をアップロードします。workflow の `docker_lanes` input は、chunk job の代わりに準備済み image に対して選択された lane を実行します。これにより、failed-lane debugging は対象を絞った 1 つの Docker job に限定され、その run 用の package artifact を準備、ダウンロード、または再利用します。選択された lane が live Docker lane の場合、対象 job はその rerun 用に live-test image をローカルでビルドします。生成される lane ごとの GitHub rerun command には、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済み image input が含まれるため、失敗した lane は失敗した run とまったく同じ package と image を再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされた live/E2E workflow は、フルの release-path Docker suite を毎日実行します。

## Plugin プリリリース

`Plugin Prerelease` は、より高コストな product/package coverage であるため、`Full Release Validation` または明示的な operator によって dispatch される別 workflow です。通常のプルリクエスト、`main` push、standalone の手動 CI dispatch では、この suite は無効のままです。これは 8 つの extension worker にバンドル済みPluginテストを分散します。これらの extension shard job は、一度に最大 2 つの plugin config group を、group ごとに 1 つの Vitest worker とより大きな Node heap で実行するため、import-heavy な plugin batch が余分な CI job を作成しません。release-only Docker prerelease path は、1〜3 分の job のために多数の runner を予約しないよう、対象 Docker lane を小さな group に batch します。この workflow は `@openclaw/plugin-inspector` から情報提供用の `plugin-inspector-advisory` artifact もアップロードします。inspector finding は triage input であり、blocking の Plugin Prerelease gate は変更しません。

## QA Lab

QA Lab には、main の smart-scoped workflow の外に専用 CI lane があります。Agentic parity は広範な QA と release harness の下にネストされ、standalone の PR workflow ではありません。parity を広範な validation run と一緒に実行すべき場合は、`rerun_group=qa-parity` 付きで `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` workflow は、`main` で nightly に実行され、手動 dispatch でも実行されます。mock parity lane、live Matrix lane、live Telegram lane、live Discord lane を parallel job として fan out します。Live job は `qa-live-shared` environment を使用し、Telegram/Discord は Convex lease を使用します。

Release check は、deterministic mock provider と mock-qualified model（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram の live transport lane を実行するため、channel contract は live model latency と通常の provider-plugin startup から隔離されます。live transport gateway は、QA parity が memory behavior を別途カバーするため memory search を無効にします。provider connectivity は、別々の live model、native provider、Docker provider suite によってカバーされます。

Matrix は、scheduled gate と release gate で `--profile fast` を使用し、checkout された CLI が対応している場合にのみ `--fail-fast` を追加します。CLI default と手動 workflow input は `all` のままです。手動の `matrix_profile=all` dispatch は常にフル Matrix coverage を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` job に shard します。

`OpenClaw Release Checks` は、release approval の前に release-critical な QA Lab lane も実行します。その QA parity gate は candidate pack と baseline pack を parallel lane job として実行し、その後 final parity comparison 用の小さな report job に両方の artifact をダウンロードします。

通常の PR では、parity を必須 status として扱うのではなく、scoped CI/check evidence に従ってください。

## CodeQL

`CodeQL` workflow は、意図的に限定された first-pass security scanner であり、リポジトリ全体の sweep ではありません。daily、manual、non-draft pull request guard run は、Actions workflow code に加えて、highest-risk な JavaScript/TypeScript サーフェスを、high/critical `security-severity` に絞った high-confidence security query で scan します。

pull request guard は軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、または process-owning bundled plugin runtime path 配下の変更に対してのみ開始され、scheduled workflow と同じ high-confidence security matrix を実行します。Android と macOS CodeQL は PR default から外れたままです。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス生成ヘルパー、サブプロセスを所有するバンドル済み Plugin ランタイム、ワークフロースクリプトの接着部分                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、package-manager インストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフローの健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` の下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係ビルド結果をアップロード対象の SARIF から除外して、`/codeql-critical-security/macos` の下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置いています。

### Critical Quality のカテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。エラー深刻度の非セキュリティ JavaScript/TypeScript 品質クエリのみを、GitHub ホステッド Linux ランナー上の狭い高価値サーフェスに対して実行するため、品質スキャンが Blacksmith ランナー登録予算を消費しません。そのプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルとバンドル済みチャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部分、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを分離して実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル Plugin 実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の接着部分、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア Web フェッチ/検索、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティとは分離したままにします。これにより、セキュリティシグナルを曖昧にせずに、品質 findings をスケジュール、測定、無効化、拡張できます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、スコープ付きまたはシャード化されたフォローアップ作業として追加し直すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot プッシュ CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの実行 1 回で、前回のドキュメント確認以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot プッシュ CI 実行が成功するとトリガーできますが、別のワークフロー実行による呼び出しがその UTC 日にすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否します。グループ化されたレポートは、Linux と macOS 上で設定ごとのウォールタイムと最大 RSS を記録するため、前後比較で所要時間の差分と並べてテストメモリの差分が表面化します。ベースラインに失敗テストがある場合、Codex は明らかな失敗だけを修正でき、エージェント後のフルスイートレポートは何かがコミットされる前に合格していなければなりません。Bot のプッシュが取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行してプッシュを再試行します。競合する古いパッチはスキップされます。Codex アクションが docs agent と同じ drop-sudo 安全姿勢を維持できるよう、GitHub ホステッド Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ、明示的に列挙された PR をクローズします。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に共有参照 issue または重複する変更ハンクのどちらかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加えて、コア lint/ガードを実行します。
- コアのテストのみの変更は、コアテスト型チェックに加えてコア lint のみを実行します。
- 拡張本番変更は、拡張本番と拡張テストの型チェックに加えて、拡張 lint を実行します。
- 拡張のテストのみの変更は、拡張テスト型チェックに加えて拡張 lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、拡張がそれらのコア契約に依存しているため、拡張型チェックに拡張されます（Vitest 拡張スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョンバンプは、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンに失敗します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそれ自身を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ依存先を使います。共有グループルーム配信設定は明示的マッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信リグレッションを通るため、共有デフォルト変更は最初の PR プッシュ前に失敗します。変更がハーネス全体に及ぶほど大きく、安価なマップ済みセットを信頼できる代替として扱えない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナー向けの Linux 証明のためにリポジトリが所有するリモートボックスラッパーです。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能なボックス、リモートログが必要な場合に、リポジトリルートから使用します。通常の OpenClaw バックエンドは `blacksmith-testbox` です。所有 AWS/Hetzner キャパシティは、Blacksmith の障害、クォータ問題、または明示的な所有キャパシティテストのためのフォールバックです。

Crabbox が支える Blacksmith 実行は、ワンショット Testbox をウォームアップ、要求、同期、実行、報告、クリーンアップします。組み込みの同期健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合や、`git status --short` が少なくとも 200 件の追跡済み削除を示す場合に早期失敗します。意図的な大量削除 PR では、リモートコマンドに `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

Crabbox は、同期後の出力がないまま 5 分を超えて同期フェーズに留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、通常より大きなローカル差分にはより大きなミリ秒値を使用します。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、`blacksmith-testbox` を通知しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に所有クラウドのデフォルトがある場合でも、プロバイダーを明示的に渡します。Codex ワークツリーまたはリンク/スパースチェックアウトでは、Crabbox が起動する前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトを避けます。代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith が支える実行には Crabbox 0.22.0 以降が必要です。これにより、ラッパーは現在の Testbox 同期、キュー、クリーンアップ動作を取得します。兄弟チェックアウトを使用する場合は、タイミング測定や証明作業の前に、無視対象のローカルバイナリを再ビルドします。

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

対象を絞ったテスト再実行:

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

最終 JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委任された Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行はハイドレーションと keepalive を所有します。SSH コマンドがすでに戻った後に Testbox が外部から停止された場合、`cancelled` として完了することがあります。ラッパーの `exitCode` がゼロ以外であるか、コマンド出力が失敗したテストを示していない限り、それはクリーンアップ/ステータスの成果物として扱います。ワンショットの Blacksmith が支える Crabbox 実行は、Testbox を自動停止するはずです。実行が中断された場合やクリーンアップが不明確な場合は、ライブボックスを確認し、自分が作成したボックスのみを停止します。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレーション済みボックスで複数のコマンドが意図的に必要な場合にのみ再利用します。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox が壊れている層だが Blacksmith 自体は動作する場合、直接 Blacksmith を使うのは `list`、`status`、クリーンアップなどの診断のみにします。直接 Blacksmith 実行をメンテナー証明として扱う前に、Crabbox パスを修正します。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分後も IP または Actions 実行 URL なしで `queued` のままの場合、Blacksmith プロバイダー、キュー、課金、または組織制限の圧迫として扱います。自分が作成した queued ID を停止し、追加の Testbox 起動を避け、誰かが Blacksmith ダッシュボード、課金、組織制限を確認する間、証明を下記の所有 Crabbox キャパシティパスに移します。

Blacksmith が停止している、クォータ制限を受けている、必要な環境が不足している、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS 圧迫下では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` を避けます。`beast` リクエストは 192 vCPU から開始され、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は、デフォルトで `standard`、複数のキャパシティリージョン、`capacity.hints: true` を使用するため、仲介された AWS リースは選択されたリージョン/マーケット、クォータ圧迫、Spot フォールバック、高圧クラス警告を出力します。より重い広範なチェックには `fast` を使用し、standard/fast では不十分な場合にのみ `large` を使用し、`beast` はフルスイートや全 Plugin Docker マトリクス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドレーンにのみ使用します。`pnpm check:changed`、対象を絞ったテスト、docs のみの作業、通常の lint/typecheck、小さな E2E 再現、Blacksmith 障害トリアージには `beast` を使用しないでください。Spot マーケットの変動がシグナルに混ざらないよう、キャパシティ診断には `--market on-demand` を使用します。

`.crabbox.yaml` は、所有クラウドレーンのプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。ローカル `.git` を除外するため、ハイドレーション済みの Actions チェックアウトはメンテナーローカルのリモートやオブジェクトストアを同期せず、独自のリモート Git メタデータを保持します。また、転送してはならないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンド用に、チェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
