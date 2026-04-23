---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を把握する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
summary: CI ジョブグラフ、スコープゲート、およびローカルコマンドの同等物
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-23T15:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# CI パイプライン

CI は `main` へのすべての push とすべての pull request で実行されます。スマートスコープを使用しており、変更が無関係な領域だけに限られる場合は高コストなジョブをスキップします。

QA Lab には、メインのスマートスコープワークフローとは別に専用の CI レーンがあります。
`Parity gate` ワークフローは、該当する PR の変更時と手動実行で走行し、
非公開の QA ランタイムをビルドして、モックの GPT-5.4 および Opus 4.6 の
agentic pack を比較します。`QA-Lab - All Lanes` ワークフローは、`main` で毎晩実行され、
手動実行でも走行します。これは、モック parity gate、ライブ Matrix レーン、
ライブ Telegram レーンを並列ジョブとしてファンアウトします。ライブジョブは
`qa-live-shared` environment を使用し、Telegram レーンは Convex lease を使用します。
`OpenClaw Release Checks` も、リリース承認前に同じ QA Lab レーンを実行します。

## ジョブ概要

| ジョブ                             | 目的                                                                                         | 実行されるタイミング                |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                        | docs-only の変更、変更されたスコープ、変更された extension を検出し、CI manifest を構築する  | draft ではないすべての push と PR   |
| `security-scm-fast`                | `zizmor` による秘密鍵検出と workflow 監査                                                    | draft ではないすべての push と PR   |
| `security-dependency-audit`        | npm advisory に対する、依存関係不要の本番 lockfile 監査                                      | draft ではないすべての push と PR   |
| `security-fast`                    | 高速なセキュリティジョブ用の必須 aggregate                                                   | draft ではないすべての push と PR   |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み artifact チェック、および下流で再利用可能な artifact をビルドする | Node 関連の変更                     |
| `checks-fast-core`                 | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                       | Node 関連の変更                     |
| `checks-fast-contracts-channels`   | 安定した aggregate チェック結果を持つ shard 化された channel contract チェック               | Node 関連の変更                     |
| `checks-node-extensions`           | extension suite 全体に対する完全な bundled-plugin テスト shard                              | Node 関連の変更                     |
| `checks-node-core-test`            | channel、bundled、contract、extension レーンを除く、core Node テスト shard                  | Node 関連の変更                     |
| `extension-fast`                   | 変更された bundled plugin のみを対象にした絞り込みテスト                                     | extension に変更がある pull request |
| `check`                            | shard 化されたメインのローカルゲート相当: 本番型、lint、guard、テスト型、strict smoke        | Node 関連の変更                     |
| `check-additional`                 | architecture、boundary、extension-surface guard、package-boundary、および gateway-watch shard | Node 関連の変更                     |
| `build-smoke`                      | ビルド済み CLI の smoke テストと起動時メモリ smoke                                           | Node 関連の変更                     |
| `checks`                           | ビルド済み artifact の channel テストに加え、push 時のみ Node 22 互換性を検証する verifier   | Node 関連の変更                     |
| `check-docs`                       | docs のフォーマット、lint、リンク切れチェック                                                | docs が変更されたとき               |
| `skills-python`                    | Python ベースの Skills に対する Ruff + pytest                                               | Python Skills 関連の変更            |
| `checks-windows`                   | Windows 固有のテストレーン                                                                   | Windows 関連の変更                  |
| `macos-node`                       | 共有ビルド artifact を使う macOS TypeScript テストレーン                                     | macOS 関連の変更                    |
| `macos-swift`                      | macOS app 向けの Swift lint、ビルド、およびテスト                                            | macOS 関連の変更                    |
| `android`                          | 両 flavor の Android unit test と、1 つの debug APK ビルド                                   | Android 関連の変更                  |

## Fail-Fast の順序

ジョブは、安価なチェックが高コストなジョブより先に失敗するように順序付けされています。

1. `preflight` が、どのレーンをそもそも存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内の step であり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い artifact ジョブや platform matrix ジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、下流の利用側は共有ビルドの準備ができ次第開始できます。
4. その後、より重い platform および runtime レーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR 専用の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。
CI workflow の編集では Node CI グラフと workflow linting が検証されますが、それ自体では Windows、Android、macOS のネイティブビルドは強制されません。これらの platform レーンは、引き続き platform のソース変更に対してのみスコープされます。
Windows Node チェックは、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager 設定、およびそのレーンを実行する CI workflow surface に対してスコープされます。無関係なソース、plugin、install-smoke、テスト専用の変更は Linux の Node レーンに留まるため、通常のテスト shard ですでにカバーされている範囲のために 16-vCPU の Windows worker を確保することはありません。
別の `install-smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは、より狭い changed-smoke シグナルから `run_install_smoke` を計算するため、Docker/install smoke は install、packaging、container 関連の変更、bundled extension の本番変更、および Docker smoke ジョブが実行する core plugin/channel/gateway/Plugin SDK surface で走行します。テスト専用および docs 専用の編集では Docker worker は確保されません。その QR package smoke は、BuildKit pnpm store cache を維持しながら Docker の `pnpm install` layer の再実行を強制するため、毎回依存関係を再ダウンロードせずにインストールを引き続き検証できます。その gateway-network e2e は、ジョブ内の前段でビルドされた runtime image を再利用するため、追加の Docker build を増やさずに実際の container-to-container WebSocket カバレッジを追加します。ローカルの `test:docker:all` は、共有の live-test image を 1 つと共有の `scripts/e2e/Dockerfile` built-app image を 1 つ事前ビルドし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で live/E2E smoke レーンを並列実行します。デフォルトの並列度 4 は `OPENCLAW_DOCKER_ALL_PARALLELISM` で調整できます。ローカル aggregate は、デフォルトでは最初の失敗後に新しい pooled レーンのスケジューリングを停止し、各レーンには 120 分の timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。起動や provider に敏感なレーンは、並列プールの後に排他的に実行されます。再利用可能な live/E2E workflow は、この共有 image パターンを踏襲し、Docker matrix の前に SHA タグ付きの GHCR Docker E2E image を 1 つビルドして push し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で matrix を実行します。定期実行される live/E2E workflow は、リリースパスの Docker suite 全体を毎日実行します。QR と installer の Docker テストは、それぞれ独自の install 重視 Dockerfile を維持します。別個の `docker-e2e-fast` ジョブは、120 秒のコマンド timeout の下で、境界を絞った bundled-plugin Docker profile を実行します: setup-entry の依存関係修復と synthetic な bundled-loader 障害の分離です。完全な bundled update/channel matrix は、実際の npm update と doctor repair の反復実行を行うため、手動実行または full-suite にのみ残されています。

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルゲートは、広い CI platform scope よりも architecture boundary に対して厳格です。core の本番変更では core の本番 typecheck と core テストを実行し、core のテスト専用変更では core のテスト typecheck/tests のみを実行し、extension の本番変更では extension の本番 typecheck と extension テストを実行し、extension のテスト専用変更では extension のテスト typecheck/tests のみを実行します。公開 Plugin SDK または plugin-contract の変更は、extension がそれらの core contract に依存しているため、extension 検証まで拡張されます。リリースメタデータ専用の version bump では、対象を絞った version/config/root-dependency チェックを実行します。未知の root/config 変更は、安全側に倒してすべてのレーンを実行します。

push では、`checks` matrix に push 専用の `compat-node22` レーンが追加されます。pull request では、このレーンはスキップされ、matrix は通常の test/channel レーンに集中したままになります。

最も遅い Node テストファミリーは、各ジョブを小さく保ちつつ runner の過剰確保を避けるため、分割またはバランス調整されています。channel contract は重み付きの 3 shard で実行され、bundled plugin テストは 6 つの extension worker に分散され、小規模な core unit レーンはペア化され、auto-reply は 6 つの極小 worker ではなくバランスされた 3 worker で実行され、agentic gateway/plugin config は built artifact を待つ代わりに既存の source-only agentic Node ジョブに分散されます。広範な browser、QA、media、およびその他の plugin テストは、共有 plugin catch-all ではなく専用の Vitest config を使用します。広範な agents レーンは、単一の遅いテストファイルに支配されるのではなく import/scheduling が支配的であるため、共有 Vitest の file-parallel scheduler を使用します。`runtime-config` は infra core-runtime shard とともに実行され、共有 runtime shard が最後尾を抱え込まないようにしています。`check-additional` は package-boundary の compile/canary 作業をまとめて維持し、runtime topology architecture を gateway watch coverage から分離しています。boundary guard shard は、小さく独立した guard を 1 つのジョブ内で並行実行します。Gateway watch、channel テスト、および core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で並行実行され、従来の check 名を軽量な verifier ジョブとして維持しつつ、追加の Blacksmith worker 2 台と 2 回目の artifact-consumer queue を避けています。
Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には個別の source set や manifest はありませんが、その unit-test レーンでは SMS/call-log BuildConfig flag を使ってその flavor をコンパイルしつつ、Android 関連の push ごとに debug APK の packaging ジョブを重複実行することは避けています。
`extension-fast` は PR 専用です。push 実行ではすでに完全な bundled plugin shard が実行されるためです。これにより、レビュー向けには変更された plugin のフィードバックを維持しつつ、`main` で `checks-node-extensions` にすでに含まれているカバレッジのために余分な Blacksmith worker を確保せずに済みます。

同じ PR または `main` ref に新しい push が届いた場合、GitHub は置き換えられたジョブを `cancelled` とマークすることがあります。同じ ref に対する最新の実行も失敗していない限り、これは CI ノイズとして扱ってください。aggregate shard チェックは `!cancelled() && always()` を使用しているため、通常の shard failure は引き続き報告されますが、workflow 全体がすでに置き換えられた後にキューに入ることはありません。
CI の concurrency key はバージョン付き（`CI-v7-*`）であるため、古い queue group に残った GitHub 側の zombie が、新しい `main` 実行を無期限にブロックすることはありません。

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブとその aggregate（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速 protocol/contract/bundled チェック、shard 化された channel contract チェック、lint を除く `check` shard、`check-additional` の shard と aggregate、Node テスト aggregate verifier、docs チェック、Python Skills、workflow-sanity、labeler、auto-response；install-smoke の preflight も、Blacksmith matrix をより早くキューできるよう GitHub-hosted Ubuntu を使用します |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テスト shard、bundled plugin テスト shard、`android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然として CPU 依存性が高く、8 vCPU では節約できる以上にコストがかかりました；install-smoke の Docker build。こちらも 32-vCPU では節約できる以上にキュー時間のコストが大きくなりました                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`；fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`；fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                             |

## ローカルでの同等コマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカル changed-lane classifier を確認
pnpm check:changed   # スマートなローカルゲート: boundary lane ごとの変更対象 typecheck/lint/tests
pnpm check          # 高速なローカルゲート: 本番 tsgo + shard 化された lint + 並列の高速 guard
pnpm check:test-types
pnpm check:timed    # ステージごとの所要時間付きの同じゲート
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest テスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs の format + lint + broken link
pnpm build          # CI の artifact/build-smoke レーンが関係する場合に dist をビルド
node scripts/ci-run-timings.mjs <run-id>      # wall time、queue time、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --recent 10   # 最近成功した main の CI 実行を比較
```
