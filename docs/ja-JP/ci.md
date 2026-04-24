---
read_when:
    - どのCIジョブが実行された、または実行されなかった理由を理解する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
summary: CI ジョブグラフ、スコープゲート、および対応するローカルコマンド
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-24T04:48:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 768f942c9624ba2339f31945dea73dea9488ac37c814b72d50c3485efe12596b
    source_path: ci.md
    workflow: 15
---

CI は `main` へのすべての push とすべての pull request で実行されます。スマートスコープを使って、無関係な領域だけが変更された場合は高コストなジョブをスキップします。

QA Lab には、メインのスマートスコープワークフローとは別に専用の CI レーンがあります。
`Parity gate` ワークフローは、一致する PR 変更と手動ディスパッチで実行されます。これは非公開の QA ランタイムをビルドし、モックの GPT-5.4 および Opus 4.6 agentic pack を比較します。`QA-Lab - All Lanes` ワークフローは、`main` で毎晩と手動ディスパッチ時に実行され、モック parity gate、ライブ Matrix レーン、ライブ Telegram レーンを並列ジョブとして fan out します。ライブジョブは `qa-live-shared` 環境を使い、Telegram レーンは Convex lease を使います。`OpenClaw Release Checks` も、リリース承認前に同じ QA Lab レーンを実行します。

`Duplicate PRs After Merge` ワークフローは、マージ後の重複クリーンアップ用の maintainer 向け手動ワークフローです。デフォルトでは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、landed PR がマージ済みであること、および各 duplicate に共有の参照 issue か重複する変更 hunk のいずれかがあることを確認します。

`Docs Agent` ワークフローは、最近マージされた変更に既存ドキュメントを合わせるためのイベント駆動 Codex メンテナンスレーンです。純粋なスケジュール実行はありません。`main` 上で成功した非ボットの push CI 実行がトリガーでき、手動ディスパッチでも直接実行できます。workflow-run 起動は、`main` がすでに先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行される場合、前回のスキップされていない Docs Agent の source SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で前回の docs パス以降に蓄積した `main` のすべての変更をカバーできます。

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動 Codex メンテナンスレーンです。これにも純粋なスケジュール実行はありません。`main` 上で成功した非ボットの push CI 実行がトリガーできますが、その UTC 日に別の workflow-run 起動がすでに実行済みまたは実行中ならスキップされます。手動ディスパッチはこの日次アクティビティゲートを回避します。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex に広範なリファクタリングではなく、カバレッジを保った小規模なテスト性能修正のみを行わせ、その後フルスイートレポートを再実行し、通過ベースラインのテスト数を減らす変更を拒否します。ベースラインに失敗しているテストがある場合、Codex は明らかな失敗のみを修正でき、after-agent のフルスイートレポートが通過しない限り何もコミットされません。ボット push が land する前に `main` が先に進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する stale patch はスキップされます。これは GitHub-hosted Ubuntu を使用し、Codex action が docs agent と同じ drop-sudo の安全姿勢を維持できるようにしています。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ジョブ概要

| Job | 目的 | 実行されるタイミング |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | docs-only 変更、変更スコープ、変更された extension を検出し、CI マニフェストを構築する | draft でない push と PR で常に実行 |
| `security-scm-fast` | `zizmor` による秘密鍵検出とワークフロー監査 | draft でない push と PR で常に実行 |
| `security-dependency-audit` | npm advisory に対する依存関係なしの本番 lockfile 監査 | draft でない push と PR で常に実行 |
| `security-fast` | 高速セキュリティジョブの必須 aggregate | draft でない push と PR で常に実行 |
| `build-artifacts` | `dist/`、Control UI、built-artifact チェック、および再利用可能な downstream artifact をビルドする | Node 関連の変更 |
| `checks-fast-core` | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン | Node 関連の変更 |
| `checks-fast-contracts-channels` | 安定した aggregate チェック結果を持つ分割 channel contract チェック | Node 関連の変更 |
| `checks-node-extensions` | extension スイート全体にわたる bundled-plugin の完全なテスト shard | Node 関連の変更 |
| `checks-node-core-test` | channel、bundled、contract、extension レーンを除く Core Node テスト shard | Node 関連の変更 |
| `extension-fast` | 変更された bundled plugin のみに対する絞り込まれたテスト | extension 変更を含む pull request |
| `check` | 分割されたメインのローカルゲート相当: 本番 type、lint、guard、test type、strict smoke | Node 関連の変更 |
| `check-additional` | architecture、boundary、extension-surface guard、package-boundary、および gateway-watch shard | Node 関連の変更 |
| `build-smoke` | built-CLI smoke テストと startup-memory smoke | Node 関連の変更 |
| `checks` | built-artifact channel テストと push 専用 Node 22 compatibility の verifier | Node 関連の変更 |
| `check-docs` | docs formatting、lint、broken-link チェック | docs が変更されたとき |
| `skills-python` | Python ベース Skills 向けの Ruff + pytest | Python Skills 関連の変更 |
| `checks-windows` | Windows 固有のテストレーン | Windows 関連の変更 |
| `macos-node` | 共有 built artifact を使う macOS TypeScript テストレーン | macOS 関連の変更 |
| `macos-swift` | macOS アプリ向けの Swift lint、build、テスト | macOS 関連の変更 |
| `android` | 両フレーバー向け Android unit テストと 1 つの debug APK ビルド | Android 関連の変更 |
| `test-performance-agent` | 信頼されたアクティビティ後の日次 Codex 遅延テスト最適化 | main CI 成功時または手動ディスパッチ |

## Fail-Fast 順序

ジョブは、高コストなものが走る前に安価なチェックが失敗するように並べられています。

1. `preflight` が、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` ロジックはこのジョブ内の step であり、独立した job ではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い artifact や platform matrix job を待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行され、shared build の準備ができ次第 downstream consumer が開始できるようにします。
4. その後、より重い platform と runtime レーンが fan out します: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR 専用の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。
CI workflow の編集では、Node CI グラフと workflow linting は検証されますが、それ自体では Windows、Android、macOS のネイティブ build は強制されません。これらの platform レーンは引き続き platform ソース変更にスコープされます。
Windows Node チェックは、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、およびそのレーンを実行する CI workflow サーフェスにスコープされます。無関係なソース、plugin、install-smoke、テスト専用の変更は Linux Node レーンに留まり、通常のテスト shard ですでにカバーされている内容のために 16-vCPU の Windows worker を確保しません。
別個の `install-smoke` ワークフローは、PR または `main` push のゲートではありません。これはスケジュールから 1 日 1 回実行され、手動開始も可能で、release check からは `workflow_call` で再利用されます。スケジュール実行と release-call 実行では、完全な install smoke パスが実行されます: QR package import、root Dockerfile CLI smoke、gateway-network e2e、bundled extension build-arg smoke、installer Docker/update coverage、制限付き bundled-plugin Docker profile、および有効時の Bun global install image-provider smoke。pull request では、`install-smoke` を待つのではなく、main CI レーンと対象を絞ったローカル Docker 証明を使うべきです。QR と installer Docker テストは独自の install 重視 Dockerfile を維持しています。ローカルの `test:docker:all` は、1 つの shared live-test image と 1 つの shared `scripts/e2e/Dockerfile` built-app image を事前ビルドし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で live/E2E smoke レーンを並列実行します。デフォルト並列数 4 は `OPENCLAW_DOCKER_ALL_PARALLELISM` で調整できます。ローカル aggregate はデフォルトで最初の失敗後に新しい pooled レーンのスケジューリングを停止し、各レーンには 120 分のタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。startup または provider に敏感なレーンは並列プールの後で排他的に実行されます。再利用可能な live/E2E workflow は、この shared-image パターンを反映し、Docker matrix の前に 1 つの SHA タグ付き GHCR Docker E2E image をビルドして push し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で matrix を実行します。スケジュールされた live/E2E workflow は、完全なリリースパス Docker スイートを毎日実行します。完全な bundled update/channel matrix は、実際の npm update と doctor repair を繰り返し行うため、手動/フルスイートのままです。

ローカル変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルゲートは、広い CI platform スコープより architecture boundary に対して厳格です。core 本番変更は core 本番 typecheck と core test を実行し、core テスト専用変更は core test の typecheck/test のみを実行し、extension 本番変更は extension 本番 typecheck と extension test を実行し、extension テスト専用変更は extension test の typecheck/test のみを実行します。公開 Plugin SDK または plugin-contract の変更は、extension がそれらの core contract に依存しているため extension 検証まで拡張されます。リリースメタデータのみの version bump は、対象を絞った version/config/root-dependency チェックを実行します。不明な root/config 変更は、安全側に倒してすべてのレーンに失敗セーフで広げます。

push では、`checks` matrix に push 専用の `compat-node22` レーンが追加されます。pull request ではこのレーンはスキップされ、matrix は通常の test/channel レーンに集中したままになります。

最も遅い Node テスト群は分割またはバランス調整されており、各ジョブが小さく保たれ、runner の過剰確保を避けています。channel contract は重み付き 3 shard で実行され、bundled plugin テストは 6 つの extension worker にまたがってバランスされ、小さな core unit レーンはペア化され、auto-reply は 6 つの小さな worker ではなく 3 つのバランス済み worker で実行され、agentic gateway/plugin config は built artifact を待たずに既存の source-only agentic Node job 全体に分散されます。広範な browser、QA、media、および miscellaneous plugin テストは、共有 plugin catch-all ではなく専用の Vitest config を使用します。extension shard job は、import 負荷の高い plugin batch が小さい CI runner をオーバーコミットしないよう、1 つの Vitest worker とより大きな Node heap で plugin config group を直列実行します。広範な agents レーンは、単一の遅いテストファイルに支配されるのではなく import/スケジューリング支配であるため、共有 Vitest の file-parallel scheduler を使用します。`runtime-config` は infra core-runtime shard と一緒に実行され、共有 runtime shard が tail を抱え込まないようにしています。`check-additional` は package-boundary compile/canary 作業をまとめて維持し、runtime topology architecture と gateway watch coverage を分離します。boundary guard shard は、小さく独立した guard を 1 つのジョブ内で並行実行します。Gateway watch、channel テスト、および core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。これにより、旧来の check 名を軽量な verifier job として維持しつつ、余分な 2 つの Blacksmith worker と 2 回目の artifact-consumer queue を避けています。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありませんが、その unit-test レーンでは SMS/call-log の BuildConfig フラグ付きでその flavor をコンパイルしつつ、Android 関連 push ごとに debug APK の重複パッケージングジョブを避けています。
`extension-fast` は PR 専用です。push 実行ではすでに full bundled plugin shard が実行されるためです。これにより、レビュー時には変更された plugin へのフィードバックを維持しつつ、`main` で `checks-node-extensions` にすでに含まれているカバレッジのために余分な Blacksmith worker を確保せずに済みます。

GitHub は、同じ PR または `main` ref に新しい push が届くと、置き換えられた job を `cancelled` とマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。aggregate shard check は `!cancelled() && always()` を使うため、通常の shard 失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられている場合にはキューされません。
CI の concurrency key はバージョン付き（`CI-v7-*`）なので、古い queue group にある GitHub 側 zombie が新しい `main` 実行を無期限にブロックすることはありません。

## Runner

| Runner | Jobs |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、高速セキュリティ job と aggregate（`security-scm-fast`, `security-dependency-audit`, `security-fast`）、高速 protocol/contract/bundled チェック、分割 channel contract チェック、lint を除く `check` shard、`check-additional` shard と aggregate、Node テスト aggregate verifier、docs チェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub-hosted Ubuntu を使い、Blacksmith matrix がより早くキューできるようにしています |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node テスト shard、bundled plugin テスト shard、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`。これは依然として CPU 感度が高く、8 vCPU は節約以上にコストがかかりました。install-smoke Docker build も同様で、32-vCPU のキュー時間コストは節約以上でした |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバック |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバック |

## ローカルで対応するコマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカル変更レーン分類器を確認
pnpm check:changed   # スマートなローカルゲート: 境界レーンごとの変更済み typecheck/lint/test
pnpm check          # 高速ローカルゲート: production tsgo + 分割 lint + 並列高速 guard
pnpm check:test-types
pnpm check:timed    # 同じゲートを各ステージの所要時間付きで実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest テスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs の format + lint + broken links
pnpm build          # CI の artifact/build-smoke レーンが関係する場合に dist をビルド
node scripts/ci-run-timings.mjs <run-id>      # 実行時間、キュー時間、最も遅い job を要約
node scripts/ci-run-timings.mjs --recent 10   # 最近成功した main CI 実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 関連

- [Install overview](/ja-JP/install)
- [Release channels](/ja-JP/install/development-channels)
