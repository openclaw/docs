---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしている
summary: CI ジョブグラフ、スコープゲート、および対応するローカルコマンド
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-23T14:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# CI パイプライン

CI は `main` へのすべての push とすべての pull request で実行されます。スマートなスコープ判定を使用しており、変更が無関係な領域だけの場合は高コストのジョブをスキップします。

QA Lab には、メインのスマートスコープワークフローの外側に専用の CI レーンがあります。
`Parity gate` ワークフローは、一致する PR 変更時と manual dispatch で実行されます。これは
プライベートな QA ランタイムをビルドし、モックの GPT-5.4 と Opus 4.6 の
agentic pack を比較します。`QA-Lab - All Lanes` ワークフローは、`main` で毎晩実行され、
manual dispatch でも実行されます。これはモック parity gate、ライブ Matrix レーン、
ライブ Telegram レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared`
environment を使用し、Telegram レーンは Convex leases を使用します。`OpenClaw Release
Checks` も、リリース承認前に同じ QA Lab レーンを実行します。

## ジョブ概要

| ジョブ                             | 目的                                                                                         | 実行されるタイミング               |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                        | docs-only の変更、変更スコープ、変更された extensions を検出し、CI manifest をビルドする     | draft ではない push と PR で常に実行 |
| `security-scm-fast`                | `zizmor` による秘密鍵検出とワークフロー監査                                                  | draft ではない push と PR で常に実行 |
| `security-dependency-audit`        | npm advisories に対する、依存関係不要の本番 lockfile 監査                                    | draft ではない push と PR で常に実行 |
| `security-fast`                    | 高速セキュリティジョブ用の必須 aggregate                                                      | draft ではない push と PR で常に実行 |
| `build-artifacts`                  | `dist/`、Control UI、built-artifact チェック、および再利用可能な下流 artifact のビルド       | Node 関連の変更                    |
| `checks-fast-core`                 | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                       | Node 関連の変更                    |
| `checks-fast-contracts-channels`   | 安定した aggregate check 結果を持つ、分割された channel contract チェック                    | Node 関連の変更                    |
| `checks-node-extensions`           | extension スイート全体にわたる bundled-plugin テストの完全 shard                             | Node 関連の変更                    |
| `checks-node-core-test`            | channel、bundled、contract、および extension レーンを除く、core Node テスト shard            | Node 関連の変更                    |
| `extension-fast`                   | 変更された bundled plugins のみに対する重点テスト                                            | extension に変更がある pull request |
| `check`                            | 分割されたメインのローカル gate 相当: prod types、lint、guards、test types、および strict smoke | Node 関連の変更                 |
| `check-additional`                 | architecture、boundary、extension-surface guards、package-boundary、および gateway-watch shard | Node 関連の変更                  |
| `build-smoke`                      | built-CLI smoke テストと startup-memory smoke                                                | Node 関連の変更                    |
| `checks`                           | built-artifact channel テスト用 verifier と、push のみの Node 22 互換性                      | Node 関連の変更                    |
| `check-docs`                       | docs のフォーマット、lint、および broken-link チェック                                       | docs が変更されたとき              |
| `skills-python`                    | Python バックエンドの Skills 用 Ruff + pytest                                                | Python-skill 関連の変更            |
| `checks-windows`                   | Windows 固有のテストレーン                                                                    | Windows 関連の変更                 |
| `macos-node`                       | 共有 built artifacts を使用する macOS TypeScript テストレーン                                | macOS 関連の変更                   |
| `macos-swift`                      | macOS app 用の Swift lint、build、および tests                                               | macOS 関連の変更                   |
| `android`                          | 両フレーバー向けの Android unit tests と 1 つの debug APK ビルド                             | Android 関連の変更                 |

## Fail-Fast 順序

ジョブは、高コストなものが実行される前に低コストなチェックで失敗するよう順序付けされています:

1. `preflight` が、どのレーンをそもそも存在させるかを決定します。`docs-scope` と `changed-scope` ロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、および `skills-python` は、より重い artifact や platform matrix ジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して動作するため、共有 build の準備ができしだい下流の利用者が開始できます。
4. その後、より重い platform および runtime レーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR 専用の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、および `android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests でカバーされています。
CI ワークフローの編集では Node CI グラフとワークフロー lint が検証されますが、それ自体では Windows、Android、または macOS のネイティブ build を強制しません。これらの platform レーンは platform ソース変更に対してのみスコープされます。
Windows Node チェックは、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、およびそのレーンを実行する CI ワークフロー表面にスコープされます。無関係なソース、Plugin、install-smoke、および test-only の変更は Linux Node レーンにとどまるため、通常の test shard ですでにカバーされている検証のために 16-vCPU の Windows worker を確保しません。
別個の `install-smoke` ワークフローは、自身の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。より狭い changed-smoke シグナルから `run_install_smoke` を算出するため、Docker/install smoke は install、packaging、container 関連の変更、bundled extension の本番変更、および Docker smoke ジョブが対象とする core の Plugin/channel/gateway/Plugin SDK 表面で実行されます。test-only と docs-only の編集では Docker worker を確保しません。その QR package smoke は、BuildKit の pnpm store cache を維持しつつ Docker の `pnpm install` レイヤーを強制的に再実行するため、毎回依存関係を再ダウンロードせずにインストールを検証します。その gateway-network e2e は、ジョブ内で先にビルドした runtime image を再利用するため、別の Docker build を追加せずに実際の container-to-container WebSocket カバレッジを追加します。ローカルの `test:docker:all` は、1 つの共有 live-test image と 1 つの共有 `scripts/e2e/Dockerfile` built-app image を事前ビルドし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で live/E2E smoke レーンを並列実行します。デフォルト並列数 4 は `OPENCLAW_DOCKER_ALL_PARALLELISM` で調整できます。ローカル aggregate は、デフォルトで最初の失敗後に新しい pooled レーンのスケジューリングを停止し、各レーンには `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書き可能な 120 分タイムアウトがあります。startup または provider に敏感なレーンは、並列プールの後に排他的に実行されます。再利用可能な live/E2E ワークフローは、Docker matrix の前に 1 つの SHA タグ付き GHCR Docker E2E image をビルドして push し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で matrix を実行することで、この共有 image パターンを反映しています。scheduled live/E2E ワークフローは、完全な release-path Docker スイートを毎日実行します。QR と installer の Docker テストは、それぞれ独自の install 重視 Dockerfile を維持します。別個の `docker-e2e-fast` ジョブは、120 秒のコマンドタイムアウトのもとで制限付き bundled-plugin Docker profile を実行します: setup-entry 依存関係修復と、synthetic bundled-loader failure isolation です。完全な bundled update/channel matrix は、実際の npm update と doctor repair パスを繰り返し実行するため、manual/full-suite のままです。

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカル gate は、広い CI platform スコープよりも architecture boundary に対して厳格です。core の本番変更は core prod typecheck と core tests を実行し、core の test-only 変更は core test typecheck/tests のみを実行し、extension の本番変更は extension prod typecheck と extension tests を実行し、extension の test-only 変更は extension test typecheck/tests のみを実行します。公開 Plugin SDK または plugin-contract の変更は、extensions がそれらの core contract に依存するため、extension 検証まで拡張されます。リリースメタデータのみの version bump では、対象を絞った version/config/root-dependency チェックが実行されます。不明な root/config の変更は安全側に倒してすべてのレーンになります。

push では、`checks` matrix に push 専用の `compat-node22` レーンが追加されます。pull request では、このレーンはスキップされ、matrix は通常の test/channel レーンに集中したままです。

最も遅い Node テスト群は分割または均等化されており、各ジョブが小さく保たれます。channel contracts は registry と core カバレッジを合計 6 つの重み付き shard に分割し、bundled plugin テストは 6 つの extension worker にバランス配分され、auto-reply は 6 個の小さな worker ではなく 3 個のバランスされた worker として実行され、agentic gateway/plugin configs は built artifacts を待つ代わりに既存の source-only agentic Node ジョブに分散されます。広範な browser、QA、media、および miscellaneous plugin テストは、共有 plugin catch-all ではなく専用の Vitest config を使用します。広範な agents レーンは、単一の遅いテストファイルに支配されるのではなく import/スケジューリング支配型であるため、共有 Vitest の file-parallel scheduler を使用します。`runtime-config` は infra core-runtime shard とともに実行され、共有 runtime shard が最後尾を抱え込まないようにします。`check-additional` は package-boundary compile/canary 作業をまとめて保ち、runtime topology architecture を gateway watch カバレッジから分離します。boundary guard shard は、その小さく独立した guards を 1 つのジョブ内で並列実行します。Gateway watch、channel tests、および core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で並列実行され、古い check 名を軽量 verifier ジョブとして維持しつつ、追加の Blacksmith worker 2 台と 2 回目の artifact-consumer queue を回避します。
Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには別個の source set や manifest はありませんが、その unit-test レーンは SMS/call-log BuildConfig フラグ付きでそのフレーバーをコンパイルしつつ、Android 関連の各 push で重複した debug APK packaging ジョブを避けます。
`extension-fast` は PR 専用です。push 実行ではすでに完全な bundled plugin shard を実行しているためです。これにより、レビュー向けに changed-plugin フィードバックを維持しつつ、`main` で `checks-node-extensions` にすでに存在するカバレッジのために追加の Blacksmith worker を確保しません。

GitHub は、同じ PR または `main` ref に新しい push が届いたとき、置き換えられたジョブを `cancelled` とマークすることがあります。同じ ref の最新実行も失敗している場合を除き、これは CI ノイズとして扱ってください。aggregate shard チェックは `!cancelled() && always()` を使用しているため、通常の shard failure は引き続き報告しますが、ワークフロー全体がすでに置き換えられている場合はキューに入りません。
CI の concurrency key はバージョン付き（`CI-v7-*`）なので、古い queue group に残った GitHub 側の zombie が新しい main 実行を無期限にブロックすることはありません。

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと aggregate（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速 protocol/contract/bundled チェック、分割された channel contract チェック、lint を除く `check` shard、`check-additional` の shard と aggregate、Node テスト aggregate verifier、docs チェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight でも GitHub ホストの Ubuntu を使用するため、Blacksmith matrix をより早くキューに入れられます |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テスト shard、bundled plugin テスト shard、`android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然として CPU 感度が高く、8 vCPU では節約できた以上のコストがかかりました。install-smoke の Docker build では、32-vCPU のキュー時間が得られる節約以上のコストになりました                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                   |

## 対応するローカルコマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカルの changed-lane classifier を確認
pnpm check:changed   # スマートなローカル gate: boundary レーンごとの changed typecheck/lint/tests
pnpm check          # 高速ローカル gate: production tsgo + 分割 lint + 並列高速 guards
pnpm check:test-types
pnpm check:timed    # 同じ gate をステージごとの所要時間付きで実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # CI の artifact/build-smoke レーンが関係する場合は dist をビルド
node scripts/ci-run-timings.mjs <run-id>  # 実行時間、キュー時間、最も遅いジョブを要約
```
