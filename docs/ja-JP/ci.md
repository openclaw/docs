---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を把握する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
summary: CI ジョブグラフ、スコープゲート、およびローカルコマンドの同等物
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-25T18:16:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

CI は `main` へのすべての push と、すべての pull request で実行されます。スマートスコープを使用して、変更が無関係な領域だけの場合は高コストなジョブをスキップします。

QA Lab には、メインのスマートスコープワークフローの外側に専用の CI レーンがあります。  
`Parity gate` ワークフローは、一致する PR の変更と手動ディスパッチで実行されます。これはプライベート QA ランタイムをビルドし、モックの GPT-5.5 および Opus 4.6 agentic pack を比較します。`QA-Lab - All Lanes` ワークフローは、`main` で毎晩、および手動ディスパッチで実行されます。これは、モック parity gate、ライブ Matrix レーン、ライブ Telegram レーンを並列ジョブとしてファンアウトします。ライブジョブは `qa-live-shared` 環境を使用し、Telegram レーンは Convex リースを使用します。`OpenClaw Release Checks` も、リリース承認前に同じ QA Lab レーンを実行します。

`Duplicate PRs After Merge` ワークフローは、land 後の重複クリーンアップのための、メンテナー向け手動ワークフローです。デフォルトでは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR をクローズします。GitHub を変更する前に、land 済み PR がマージ済みであること、および各重複 PR に共有の参照 issue または変更された hunk の重なりがあることを検証します。

`Docs Agent` ワークフローは、最近 land された変更に既存ドキュメントを整合させ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュール実行はありません。`main` 上で bot 以外による成功した push CI 実行がこれをトリガーでき、手動ディスパッチでも直接実行できます。workflow-run による呼び出しは、`main` がすでに先に進んでいる場合、または別のスキップされていない Docs Agent 実行が直近 1 時間以内に作成されている場合にスキップされます。実行されると、前回のスキップされていない Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回の docs パス以降に蓄積した `main` のすべての変更をカバーできます。

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュール実行はありません。`main` 上で bot 以外による成功した push CI 実行がこれをトリガーできますが、その UTC 日に別の workflow-run 呼び出しがすでに実行済みまたは実行中である場合はスキップされます。手動ディスパッチはその日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートをビルドし、Codex が広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行えるようにし、その後フルスイートレポートを再実行して、合格ベースラインのテスト数を減らす変更を拒否します。ベースラインに失敗するテストがある場合、Codex は明らかな失敗のみを修正でき、その後のエージェント実行後フルスイートレポートは、何かがコミットされる前に合格しなければなりません。bot push が land する前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する stale パッチはスキップされます。Codex アクションが docs agent と同じ drop-sudo の安全姿勢を維持できるように、GitHub ホストの Ubuntu を使用します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ジョブ概要

| ジョブ                             | 目的                                                                                         | 実行されるタイミング                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------- |
| `preflight`                        | docs-only の変更、変更されたスコープ、変更された拡張機能を検出し、CI マニフェストをビルドする | draft ではない push と PR で常に実行     |
| `security-scm-fast`                | `zizmor` による秘密鍵検出とワークフロー監査                                                  | draft ではない push と PR で常に実行     |
| `security-dependency-audit`        | npm アドバイザリに対する、依存関係不要の本番 lockfile 監査                                   | draft ではない push と PR で常に実行     |
| `security-fast`                    | 高速セキュリティジョブの必須集約                                                             | draft ではない push と PR で常に実行     |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済みアーティファクトチェック、および再利用可能な下流アーティファクトをビルドする | Node 関連の変更                         |
| `checks-fast-core`                 | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                       | Node 関連の変更                         |
| `checks-fast-contracts-channels`   | 安定した集約チェック結果を持つ、シャーディングされた channel contract チェック               | Node 関連の変更                         |
| `checks-node-extensions`           | 拡張機能スイート全体にわたる完全な bundled-plugin テストシャード                              | Node 関連の変更                         |
| `checks-node-core-test`            | channel、bundled、contract、および extension レーンを除く、コア Node テストシャード          | Node 関連の変更                         |
| `extension-fast`                   | 変更された bundled plugin のみを対象としたフォーカステスト                                   | 拡張機能の変更を含む pull request       |
| `check`                            | シャーディングされたメインのローカルゲート同等物: 本番型、lint、guard、test types、strict smoke | Node 関連の変更                      |
| `check-additional`                 | architecture、boundary、extension-surface guard、package-boundary、および gateway-watch シャード | Node 関連の変更                      |
| `build-smoke`                      | ビルド済み CLI スモークテストと起動時メモリスモーク                                           | Node 関連の変更                         |
| `checks`                           | ビルド済みアーティファクト channel テストに加え、push のみの Node 22 互換性の検証             | Node 関連の変更                         |
| `check-docs`                       | docs のフォーマット、lint、および broken-link チェック                                       | docs に変更がある場合                   |
| `skills-python`                    | Python ベースの Skills 向け Ruff + pytest                                                    | Python Skills 関連の変更                |
| `checks-windows`                   | Windows 固有のテストレーン                                                                    | Windows 関連の変更                      |
| `macos-node`                       | 共有ビルド済みアーティファクトを使用する macOS TypeScript テストレーン                        | macOS 関連の変更                        |
| `macos-swift`                      | macOS アプリ向け Swift lint、ビルド、およびテスト                                             | macOS 関連の変更                        |
| `android`                          | 両フレーバーの Android ユニットテストと、1 つの debug APK ビルド                              | Android 関連の変更                      |
| `test-performance-agent`           | 信頼できるアクティビティ後の日次 Codex 遅延テスト最適化                                       | Main CI 成功時または手動ディスパッチ    |

## Fail-fast の順序

ジョブは、安価なチェックが高コストなジョブより先に失敗するように順序付けされています。

1. `preflight` が、どのレーンをそもそも存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、および `skills-python` は、より重いアーティファクトジョブやプラットフォームマトリクスジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、下流コンシューマーは共有ビルドの準備ができしだい開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、PR 専用の `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、および `android`。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。  
CI ワークフローの編集では、Node CI グラフとワークフロー lint の検証は行われますが、それだけで Windows、Android、または macOS のネイティブビルドが強制されることはありません。これらのプラットフォームレーンは、引き続きプラットフォームのソース変更にだけスコープされます。

CI のルーティングのみの編集、一部の安価な core-test fixture 編集、および限定的な plugin contract helper/test-routing 編集では、高速な Node 専用マニフェストパスが使われます: preflight、security、および単一の `checks-fast-core` タスクです。このパスでは、変更されたファイルが高速タスクが直接実行するルーティングまたは helper サーフェスに限定されている場合、build artifacts、Node 22 互換性、channel contracts、完全な core shard、bundled-plugin shard、および追加の guard matrix を回避します。

Windows Node チェックは、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフローサーフェスにスコープされます。無関係なソース、plugin、install-smoke、および test-only の変更は Linux Node レーンのままとなり、通常のテスト shard ですでにカバーされている内容のために 16-vCPU の Windows ワーカーを確保しないようにします。

別個の `install-smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これはスモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。pull request では、Docker/パッケージサーフェス、bundled plugin の package/manifest 変更、および Docker スモークジョブが実行する core plugin/channel/gateway/Plugin SDK サーフェスに対して高速パスを実行します。ソースのみの bundled plugin 変更、test-only 編集、および docs-only 編集では Docker ワーカーを確保しません。高速パスでは、ルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI smoke を実行し、container gateway-network e2e を実行し、bundled extension build arg を検証し、集約コマンドタイムアウト 240 秒の下で限定された bundled-plugin Docker profile を実行します。各シナリオの Docker 実行には個別の上限があります。完全パスでは、夜間スケジュール実行、手動ディスパッチ、workflow-call release checks、および実際に installer/package/Docker サーフェスに触れる pull request に対して、QR パッケージインストールおよび installer Docker/update カバレッジを維持します。マージコミットを含む `main` への push では完全パスは強制されません。changed-scope ロジックが push で完全カバレッジを要求する場合でも、ワークフローは高速 Docker smoke を維持し、完全な install smoke は夜間実行またはリリース検証に任せます。低速な Bun グローバルインストール image-provider smoke は `run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールと release checks ワークフローから実行され、手動の `install-smoke` ディスパッチでも有効化できますが、pull request と `main` への push では実行されません。QR および installer Docker テストは、それぞれ独自の install 重視 Dockerfile を維持します。ローカルの `test:docker:all` は、共有 live-test イメージ 1 つと共有の `scripts/e2e/Dockerfile` built-app イメージ 1 つを事前ビルドし、その後、重み付きスケジューラと `OPENCLAW_SKIP_DOCKER_BUILD=1` を使って live/E2E smoke レーンを実行します。デフォルトのメインプールスロット数 10 は `OPENCLAW_DOCKER_ALL_PARALLELISM` で、provider-sensitive な tail-pool スロット数 10 は `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` で調整します。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` となっており、npm install と multi-service レーンが Docker を過剰に占有しないようにしつつ、軽いレーンが利用可能なスロットを埋められるようにします。ローカル Docker デーモンの create ストームを避けるため、レーン開始はデフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` または別のミリ秒値で上書きできます。ローカル集約処理では、Docker の preflight を行い、古い OpenClaw E2E コンテナを削除し、アクティブレーンの状態を出力し、最長優先順序付けのためにレーン時間を永続化し、スケジューラ確認用に `OPENCLAW_DOCKER_ALL_DRY_RUN=1` をサポートします。デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止し、各レーンには 120 分のフォールバックタイムアウトがあります。これは `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きでき、一部の live/tail レーンではより厳しいレーンごとの上限が使われます。再利用可能な live/E2E ワークフローは、Docker matrix の前に SHA タグ付き GHCR Docker E2E イメージを 1 つビルドして push し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` で matrix を実行することで、共有イメージパターンを反映しています。スケジュールされた live/E2E ワークフローは、完全な release-path Docker スイートを毎日実行します。bundled update matrix は update target ごとに分割されており、繰り返される npm update と doctor repair パスを他の bundled チェックとシャーディングできます。

ローカル changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルゲートは、広い CI プラットフォームスコープよりも architecture boundary に対して厳格です。core の本番変更では core prod typecheck と core tests を実行し、core の test-only 変更では core test typecheck/tests のみを実行し、extension の本番変更では extension prod typecheck と extension tests を実行し、extension の test-only 変更では extension test typecheck/tests のみを実行します。公開 Plugin SDK または plugin-contract の変更は、extensions がそれらの core contract に依存しているため、extension 検証まで拡張されます。release metadata のみの version bump では、対象を絞った version/config/root-dependency チェックを実行します。不明な root/config 変更は、安全側に倒してすべてのレーンになります。

push では、`checks` matrix に push 専用の `compat-node22` レーンが追加されます。pull request では、このレーンはスキップされ、matrix は通常の test/channel レーンに集中したままです。

最も遅い Node テストファミリーは、各ジョブを小さく保ちつつ runner を過剰確保しないように分割またはバランス調整されています。channel contract は重み付きの 3 shard として実行され、bundled plugin テストは 6 つの extension worker にまたがってバランスされ、小さな core unit レーンはペアにされ、auto-reply は 6 つの小さな worker ではなく 3 つのバランスされた worker として実行され、agentic gateway/plugin config は built artifacts を待つのではなく既存の source-only agentic Node ジョブ全体に分散されます。広範な browser、QA、media、および miscellaneous plugin テストでは、共有 plugin catch-all ではなく専用の Vitest config を使用します。extension shard ジョブは、一度に最大 2 つの plugin config group を実行し、group ごとに 1 つの Vitest worker と、より大きな Node ヒープを使用するため、import が重い plugin バッチでも追加の CI ジョブを作成しません。広範な agents レーンでは、単一の遅いテストファイルに支配されるのではなく import/スケジューリングに支配されるため、共有 Vitest の file-parallel scheduler を使用します。`runtime-config` は、共有 runtime shard が tail を抱え込まないよう、infra core-runtime shard と一緒に実行されます。`check-additional` では package-boundary compile/canary 作業をまとめ、runtime topology architecture と gateway watch カバレッジを分離します。boundary guard shard は、その小さく独立した guard を 1 つのジョブ内で並行実行します。Gateway watch、channel テスト、および core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で並行実行され、2 つの追加 Blacksmith worker と 2 回目の artifact-consumer queue を避けつつ、従来の check 名を軽量な verifier ジョブとして維持します。  
Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありませんが、その unit-test レーンでは SMS/call-log の BuildConfig フラグを使ってその flavor をコンパイルしつつ、Android 関連の各 push ごとに重複した debug APK パッケージングジョブを回避します。  
`extension-fast` は PR 専用です。push 実行ではすでに完全な bundled plugin shard が実行されるためです。これにより、レビュー向けの changed-plugin フィードバックは維持しつつ、`checks-node-extensions` にすでに含まれているカバレッジのために `main` で追加の Blacksmith worker を確保せずに済みます。

GitHub は、同じ PR または `main` ref に新しい push が届くと、置き換えられたジョブを `cancelled` とマークすることがあります。同じ ref の最新実行も失敗していない限り、これを CI ノイズとして扱ってください。集約 shard チェックは `!cancelled() && always()` を使うため、通常の shard 失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられている場合にはキューに入りません。  
CI の concurrency key はバージョン付きです（`CI-v7-*`）。そのため、古いキューグループにある GitHub 側の zombie が新しい `main` 実行を無期限にブロックすることはありません。

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブとその集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速 protocol/contract/bundled チェック、シャーディングされた channel contract チェック、lint を除く `check` shard、`check-additional` の shard と集約、Node テストの集約 verifier、docs チェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHub ホストの Ubuntu を使用し、Blacksmith matrix がより早くキューに入れるようにします |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テスト shard、bundled plugin テスト shard、`android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然として CPU 感度が高く、8 vCPU では節約以上にコストがかかるためです。install-smoke の Docker ビルドもここで行われ、32-vCPU のキュー時間は節約以上にコストがかかりました                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                               |

## ローカルでの同等コマンド

```bash
pnpm changed:lanes   # origin/main...HEAD に対するローカル changed-lane classifier を確認
pnpm check:changed   # スマートなローカルゲート: 変更境界レーンごとの typecheck/lint/tests
pnpm check          # 高速なローカルゲート: 本番 tsgo + シャーディングされた lint + 並列高速 guard
pnpm check:test-types
pnpm check:timed    # 各ステージの計測時間付きで同じゲートを実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest テスト
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs のフォーマット + lint + broken link
pnpm build          # CI の artifact/build-smoke レーンが関係する場合に dist をビルド
node scripts/ci-run-timings.mjs <run-id>      # 経過時間、キュー時間、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --recent 10   # 最近成功した main CI 実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 関連

- [インストール概要](/ja-JP/install)
- [リリースチャネル](/ja-JP/install/development-channels)
