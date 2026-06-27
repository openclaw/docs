---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - GitHub Actions チェックの失敗をデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリース包括、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-06-27T10:45:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべてのプッシュとすべてのプルリクエストで実行されます。正規の
`main` プッシュは、まず 90 秒のホストランナー受付ウィンドウを通過します。
既存の `CI` 並行実行グループは、より新しいコミットが到着すると待機中の実行をキャンセルするため、
連続したマージがそれぞれ完全な Blacksmith
マトリクスを登録することはありません。プルリクエストと手動ディスパッチは待機をスキップします。その後、`preflight` ジョブが
差分を分類し、無関係な領域だけが変更された場合は高コストのレーンをオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な
検証のため、意図的にスマートスコープをバイパスしてグラフ全体にファンアウトします。Android レーンは `include_android` によるオプトインのままです。リリース専用の
Plugin カバレッジは、別個の [`Plugin Prerelease`](#plugin-prerelease)
ワークフローにあり、[`Full Release Validation`](#full-release-validation)
または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                             | 目的                                                                                                      | 実行タイミング                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs のみの変更、変更スコープ、変更された拡張機能を検出し、CI マニフェストをビルドする                  | 非ドラフトのプッシュと PR で常に                    |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` プッシュをホスト側で 90 秒デバウンスする                  | すべての CI 実行。正規の `main` プッシュでのみ sleep |
| `security-fast`                    | 秘密鍵検出、`zizmor` による変更ワークフロー監査、本番 lockfile 監査                                      | 非ドラフトのプッシュと PR で常に                    |
| `check-dependencies`               | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                                          | Node 関連の変更                                     |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI スモークチェック、埋め込みビルド成果物チェック、再利用可能な成果物をビルド | Node 関連の変更                                     |
| `checks-fast-core`                 | bundled、protocol、QA Smoke CI、CI ルーティングチェックなどの高速 Linux 正当性レーン                     | Node 関連の変更                                     |
| `checks-fast-contracts-plugins-*`  | 2 分割された Plugin コントラクトチェック                                                                 | Node 関連の変更                                     |
| `checks-fast-contracts-channels-*` | 2 分割されたチャンネルコントラクトチェック                                                               | Node 関連の変更                                     |
| `checks-node-core-*`               | チャンネル、bundled、contract、extension レーンを除く Core Node テストシャード                           | Node 関連の変更                                     |
| `check-*`                          | 分割されたメインローカルゲート相当: 本番型、lint、ガード、テスト型、厳格なスモーク                      | Node 関連の変更                                     |
| `check-additional-*`               | アーキテクチャ、分割された boundary/prompt drift、extension ガード、パッケージ境界、ランタイムトポロジ   | Node 関連の変更                                     |
| `checks-node-compat-node22`        | Node 22 互換性ビルドとスモークレーン                                                                     | リリース用の手動 CI ディスパッチ                    |
| `check-docs`                       | docs のフォーマット、lint、壊れたリンクのチェック                                                        | docs が変更された場合                               |
| `skills-python`                    | Python バックエンドの Skills 向け Ruff + pytest                                                          | Python skill 関連の変更                             |
| `checks-windows`                   | Windows 固有のプロセス/パステストと共有ランタイム import specifier の回帰                                | Windows 関連の変更                                  |
| `macos-node`                       | 共有ビルド成果物を使用する macOS TypeScript テストレーン                                                 | macOS 関連の変更                                    |
| `macos-swift`                      | macOS アプリ向け Swift lint、ビルド、テスト                                                              | macOS 関連の変更                                    |
| `ios-build`                        | Xcode プロジェクト生成と iOS アプリシミュレータビルド                                                    | iOS アプリ、共有アプリキット、または Swabble の変更 |
| `android`                          | 両方の flavor の Android ユニットテストと 1 つの debug APK ビルド                                        | Android 関連の変更                                  |
| `test-performance-agent`           | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                    | Main CI 成功または手動ディスパッチ                  |
| `openclaw-performance`             | mock-provider、deep-profile、GPT 5.5 ライブレーンを含む日次/オンデマンド Kova ランタイム性能レポート     | スケジュール実行と手動ディスパッチ                  |

## fail-fast 順序

1. `runner-admission` は正規の `main` プッシュに対してのみ待機します。より新しいプッシュがあると、Blacksmith 登録前にその実行はキャンセルされます。
2. `preflight` は、どのレーンをそもそも存在させるかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い成果物ジョブとプラットフォームマトリクスジョブを待たずに素早く失敗します。
4. `build-artifacts` は高速 Linux レーンと並行して実行されるため、共有ビルドの準備ができ次第、下流の利用側を開始できます。
5. その後、より重いプラットフォームレーンとランタイムレーンがファンアウトします: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-core-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref により新しいプッシュが到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、それは CI ノイズとして扱ってください。マトリクスジョブは `fail-fast: false` を使用し、`build-artifacts` は小さな verifier ジョブをキューに入れる代わりに、埋め込みチャンネル、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI 並行実行キーはバージョン付き（`CI-v7-*`）なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅いジョブ、失敗、`pnpm-store-warmup` ファンアウトバリアを要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。CI は同じ実行サマリーも `ci-timings-summary` 成果物としてアップロードします。ビルド時間については、`build-artifacts` ジョブの `Build dist` ステップを確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。このジョブは `startup-memory` 成果物もアップロードします。

プルリクエスト実行では、末尾の timing-summary ジョブが、`GH_TOKEN` を `gh run view` に渡す前に、信頼済みベースリビジョンからヘルパーを実行します。これにより、トークン付きクエリをブランチ管理下のコードから外したまま、プルリクエストの現在の CI 実行を要約できます。

## PR コンテキストと証拠

外部コントリビューターの PR は、
`.github/workflows/real-behavior-proof.yml` から PR コンテキストと証拠ゲートを実行します。このワークフローは信頼済みの
ベースコミットをチェックアウトし、PR 本文のみを評価します。コントリビューターブランチのコードは実行しません。

このゲートは、リポジトリ所有者、メンバー、
コラボレーター、bot ではない PR 作者に適用されます。PR 本文に作者が記述した
`What Problem This Solves` と `Evidence` セクションが含まれる場合に合格します。証拠には、焦点を絞った
テスト、CI 結果、スクリーンショット、録画、端末出力、ライブ観察、
秘匿化されたログ、または成果物リンクを使用できます。本文は意図と有用な検証を提供します。
レビュアーはコード、テスト、CI を調べて正しさを評価します。

チェックが失敗した場合は、別のコードコミットをプッシュするのではなく、PR 本文を更新してください。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチは changed-scope 検出をスキップし、すべてのスコープ領域が変更されたかのように preflight マニフェストを動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それだけで Windows、iOS、Android、macOS ネイティブビルドを強制することはありません。これらのプラットフォームレーンは、プラットフォームソース変更にスコープされたままです。
- **Workflow Sanity** は、すべてのワークフロー YAML ファイルに対して `actionlint`、`zizmor`、composite-action interpolation ガード、conflict-marker ガードを実行します。PR スコープの `security-fast` ジョブも、変更されたワークフローファイルに対して `zizmor` を実行するため、ワークフローのセキュリティ所見はメイン CI グラフ内で早期に失敗します。
- **`main` プッシュ上の docs** は、CI で使用されるものと同じ ClawHub docs ミラーを使う独立した `Docs` ワークフローでチェックされるため、コードと docs が混在するプッシュが CI の `check-docs` シャードもキューに入れることはありません。プルリクエストと手動 CI では、docs が変更された場合に CI から `check-docs` が引き続き実行されます。
- **TUI PTY** は、TUI 変更に対して `checks-node-core-runtime-tui-pty` Linux Node シャード内で実行されます。このシャードは `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 付きで `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定的な `TuiBackend` fixture レーンと、外部モデルエンドポイントのみをモックする低速な `tui --local` スモークの両方をカバーします。
- **CI routing-only 編集、選択された低コストな core-test fixture 編集、狭い plugin contract helper/test-routing 編集** は、高速な Node のみのマニフェストパスを使用します: `preflight`、security、単一の `checks-fast-core` タスクです。このパスは、変更が高速タスクが直接実行するルーティングまたはヘルパー表面に限定されている場合、ビルド成果物、Node 22 互換性、チャンネルコントラクト、完全な core シャード、bundled-plugin シャード、追加ガードマトリクスをスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、そのレーンを実行する CI ワークフロー表面にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンのままです。

最も遅い Node テストファミリーは分割またはバランス調整され、ランナーを過剰に予約せずに各ジョブが小さく保たれます。Plugin コントラクトとチャネルコントラクトはそれぞれ、標準の GitHub ランナーフォールバック付きの、重み付けされた Blacksmith 支援シャード 2 つとして実行されます。core unit fast/support レーンは個別に実行され、core runtime infra は state、process/config、shared、および 3 つの cron ドメインシャードに分割されます。auto-reply はバランス調整されたワーカーとして実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/server 設定は、ビルド済み成果物を待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンに分割されます。通常の CI は、分離された infra include-pattern シャードだけを最大 64 個のテストファイルからなる決定的なバンドルに詰めるため、非分離の command/cron、stateful agents-core、gateway/server スイートを結合せずに Node マトリックスを削減できます。重い固定スイートは 8 vCPU のままにし、バンドル済みおよび低重みのレーンは 4 vCPU を使います。正規リポジトリ上のプルリクエストでは、追加のコンパクトな受け入れプランを使います。同じ config ごとのグループが、現在の 34 ジョブの Linux Node プラン内で分離されたサブプロセスとして実行されるため、単一の PR が 70 ジョブ超の Node マトリックス全体を登録することはありません。`main` への push、手動 dispatch、リリースゲートはフルマトリックスを維持します。広範なブラウザー、QA、メディア、およびその他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest 設定を使います。Include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional-*` はパッケージ境界のコンパイル/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard リストは、prompt が重い 1 つのシャードと、残りの guard ストライプ用の 1 つの結合シャードにストライプ化され、それぞれ選択された独立 guard を並行実行し、チェックごとのタイミングを出力します。高コストな Codex happy-path prompt snapshot drift チェックは、手動 CI と prompt に影響する変更の場合だけ、独自の追加ジョブとして実行されます。そのため、通常の無関係な Node 変更は cold prompt snapshot 生成を待たず、boundary シャードはバランスを保ちつつ、prompt drift はそれを発生させた PR に固定されます。同じフラグにより、ビルド済み成果物の core support-boundary シャード内での prompt snapshot Vitest 生成もスキップされます。Gateway watch、チャネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

受け入れ後、正規 Linux CI は最大 24 個の Node テストジョブの同時実行を許可し、
より小さい fast/check レーンでは 12 個を許可します。Windows と Android は、これらの
ランナープールがより狭いため 2 個のままです。

コンパクト PR プランは現在のスイートに対して 18 個の Node ジョブを出力します。config 全体の
グループは 120 分のバッチタイムアウト付きで分離されたサブプロセスにまとめられ、
include-pattern グループは同じ制限付きジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play debug APK をビルドします。third-party フレーバーには個別のソースセットやマニフェストはありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きでそのフレーバーを引き続きコンパイルしつつ、Android 関連の各 push で重複する debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` install では pnpm の minimum release age が無効化された、本番用 Knip dependency-only パス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番用 unused-file 検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、生成物、ビルド、live-test、package bridge のサーフェスは保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡すターゲット側ブリッジです。信頼されていないプルリクエストコードをチェックアウトしたり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` に dispatch します。

このワークフローには 4 つのレーンがあります。

- `clawsweeper_item` は、正確な issue およびプルリクエストレビュー要求用です。
- `clawsweeper_comment` は、issue コメント内の明示的な ClawSweeper コマンド用です。
- `clawsweeper_commit_review` は、`main` push 上のコミットレベルレビュー要求用です。
- `github_activity` は、ClawSweeper エージェントが調査する可能性のある一般的な GitHub アクティビティ用です。

`github_activity` レーンは、正規化されたメタデータのみを転送します。イベント種別、action、actor、repository、item number、URL、title、state、およびコメントやレビューが存在する場合の短い抜粋です。意図的に完全な Webhook 本文は転送しません。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway hook に投稿します。

一般的なアクティビティは観測であり、デフォルト配信ではありません。ClawSweeper エージェントは prompt 内で Discord ターゲットを受け取り、イベントが意外である、対応可能である、リスクがある、または運用上有用である場合にだけ `#clawsweeper` に投稿すべきです。通常の open、edit、bot の churn、重複 Webhook ノイズ、通常のレビュー traffic は `NO_REPLY` になるべきです。

このパス全体を通じて、GitHub の title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱います。これらは要約と triage の入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動 dispatch

手動 CI dispatch は通常の CI と同じジョブグラフを実行しますが、Android 以外のすべての scoped レーンを強制的に有効化します。Linux Node シャード、bundled-plugin シャード、Plugin とチャネルのコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物の smoke check、docs check、Python Skills、Windows、macOS、iOS build、Control UI i18n です。スタンドアロンの手動 CI dispatch は、`include_android=true` の場合のみ Android を実行します。full release umbrella は `include_android=true` を渡すことで Android を有効化します。Plugin prerelease static check、release-only の `agentic-plugins` シャード、full extension batch sweep、Plugin prerelease Docker レーンは CI から除外されます。Docker prerelease スイートは、`Full Release Validation` が release-validation gate を有効化して個別の `Plugin Prerelease` ワークフローを dispatch した場合のみ実行されます。

手動実行は一意の concurrency group を使うため、release-candidate full suite が同じ ref 上の別の push や PR 実行によってキャンセルされません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択された dispatch ref のワークフローファイルを使いながら、branch、tag、または完全な commit SHA に対してそのグラフを実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                        | ジョブ                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | 手動 CI dispatch と非正規リポジトリのフォールバック、CodeQL JavaScript/actions quality scan、workflow-sanity、labeler、auto-response、CI 外の docs workflow、および Blacksmith マトリックスがより早くキューに入れるようにする install-smoke preflight                           |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、低重みの extension シャード、`checks-fast-core`、Plugin/チャネルコントラクトシャード、ほとんどの bundled/低重み Linux Node シャード、`check-guards`、`check-prod-types`、`check-test-types`、選択された `check-additional-*` シャード、および `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持される重い Linux Node スイート、boundary/extension が重い `check-additional-*` シャード、および `android`                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`、`check-lint`（8 vCPU では節約分よりコストが高くなるほど CPU に敏感）、install-smoke Docker build（32 vCPU のキュー時間は節約分よりコストが高かった）                                                                                                           |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。fork は `macos-15` にフォールバックします                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。fork は `macos-26` にフォールバックします                                                                                                                                                                                    |

## ランナー登録予算

OpenClaw の現在の GitHub ランナー登録 bucket は、5 分あたり 3,000 件の self-hosted
runner 登録を許可します。この制限は `openclaw` organization 内のすべての Blacksmith runner
登録で共有されるため、別の Blacksmith install を追加しても新しい bucket は追加されません。

burst control の希少リソースとして Blacksmith label を扱ってください。route、notify、summarize、shard 選択、または短い CodeQL scan のみを行うジョブは、測定済みの Blacksmith 固有の必要性がない限り、GitHub-hosted runner に留めるべきです。新しい Blacksmith matrix、より大きな `max-parallel`、または高頻度 workflow は、最悪ケースの登録数を示し、organization レベルの target を 5 分あたり 2,000 登録未満に保ち、同時実行リポジトリと再試行ジョブのための余裕を残す必要があります。

正規リポジトリ CI は、通常の push と pull-request 実行に対して Blacksmith をデフォルトのランナーパスとして維持します。`workflow_dispatch` と非正規リポジトリの実行は GitHub-hosted runner を使いますが、通常の正規実行は現在、Blacksmith のキュー健全性を probe したり、Blacksmith が利用できない場合に GitHub-hosted label へ自動的にフォールバックしたりしません。

## ローカルでの同等コマンド

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

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でディスパッチすることもできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチでは通常、ワークフロー参照をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開されるレポートパスと最新ポインターはテスト対象の参照をキーにし、各 `index.md` にはテスト対象の参照/SHA、ワークフロー参照/SHA、Kova 参照、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターが記録されます。

このワークフローは固定されたリリースから OCM を、固定された `kova_ref` 入力で `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を使い、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、フック、50 Plugin 起動ケースでの Gateway 起動時間とメモリ、同梱 Plugin のインポート RSS、モック OpenAI による `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象の参照について以前に公開された mock-provider ソースレポートが利用可能な場合、ソースサマリーは現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON がその横にあります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブのアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象参照ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、その対象で手動の `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA プロファイル証拠からの成熟度スコアカードレンダリング、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。stable と full プロファイルには、常に網羅的な live/E2E と Docker リリースパスのソークカバレッジが含まれます。beta プロファイルでは `run_release_soak=true` でオプトインできます。標準パッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補は重複したライブポーラーを開始しません。公開後は、`release_package_spec` を渡すことで、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で、再ビルドせずに出荷済み npm パッケージを再利用できます。公開済みパッケージの Telegram に絞った再実行にのみ `npm_telegram_package_spec` を使用します。Codex Plugin のライブパッケージレーンは、デフォルトで同じ選択状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行では選択された参照から `extensions/codex` をパックします。`npm:`、`npm-pack:`、`git:` 仕様などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、絞り込み再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm プレフライトが成功した後に、`release/YYYY.M.PATCH` または `main` からディスパッチします。これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチし、その後に保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` をディスパッチします。stable 公開では、正確な `windows_node_tag` も必要です。このワークフローは Windows ソースリリースを検証し、公開子ワークフローの前に、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、同じ固定インストーラーダイジェストに加えて、正確なコンパニオンアセットとチェックサム契約を昇格および検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットを証明するには、`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ参照は、ブランチまたはタグである必要があり、生のコミット SHA は使用できません。このヘルパーは対象 SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、その固定参照から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証し、実行完了時に一時ブランチを削除します。包括検証器は、いずれかの子ワークフローが異なる SHA で実行された場合も失敗します。

`release_profile` は、リリースチェックに渡される live/プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な助言用プロバイダー/メディアマトリクスを意図的に必要とする場合にのみ `full` を使用します。stable と full のリリースチェックは常に、網羅的な live/E2E と Docker リリースパスのソークを実行します。beta プロファイルでは `run_release_soak=true` でオプトインできます。

- `minimum` は最速の OpenAI/コアのリリースクリティカルなレーンを維持します。
- `stable` は stable プロバイダー/バックエンドセットを追加します。
- `full` は広範な助言用プロバイダー/メディアマトリクスを実行します。

包括ワークフローはディスパッチされた子実行 ID を記録し、最終の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行の最遅ジョブ表を追記します。子ワークフローが再実行されて緑になった場合は、包括結果とタイミングサマリーを更新するために親検証ジョブのみを再実行します。

リカバリーのため、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け取ります。リリース候補には `all`、通常の full CI 子のみには `ci`、Plugin プレリリース子のみには `plugin-prerelease`、すべてのリリース子には `release-checks` を使用します。包括ワークフロー上では、より狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` も使用できます。これにより、絞り込んだ修正後に失敗したリリースボックスの再実行範囲を限定できます。1 つのクロス OS レーンが失敗した場合は、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。たとえば `windows/packaged-upgrade` です。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade サマリーにはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは、標準ランタイムツールカバレッジゲートを除き助言扱いです。このゲートは、必須の OpenClaw 動的ツールが標準ティアサマリーからずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼されたワークフロー参照を使用して、選択された参照を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。ソークカバレッジが実行される場合は、live/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス全体でパッケージのバイト列を一貫させ、同じ候補を複数の子ジョブで再パックすることを避けます。Codex npm Plugin ライブレーンでは、リリースチェックは `release_package_spec` から導出した一致する公開済み Plugin 仕様を渡すか、オペレーターが指定した `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトが選択されたチェックアウトの Codex Plugin をパックするようにします。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古い包括ワークフローを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをキャンセルします。そのため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機しません。リリースブランチ/タグ検証と絞り込み再実行グループは `cancel-in-progress: false` を維持します。

## ライブと E2E シャード

リリース live/E2E 子ワークフローは、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- プロバイダーでフィルターされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声/動画シャードと、プロバイダーでフィルターされた音楽シャード

これにより、同じファイルカバレッジを維持しながら、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前にインストールされています。メディアジョブはセットアップ前にバイナリのみを検証します。Docker に支えられたライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストされた Docker テストを起動する場所として不適切です。

Docker ベースのライブモデル/バックエンドシャードは、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー別に分割された Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップ経路が停止した場合に、リリースチェック全体の予算を消費せず早く失敗します。これらのシャードが完全なソース Docker ターゲットをそれぞれ独立して再ビルドしている場合、そのリリース実行は設定ミスであり、重複するイメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」が問われている場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、ユーザーがインストールまたは更新後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、その後それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、パッケージ受け入れが解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチは引き続き公開済み npm spec をインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け入れます。公開済みのプレリリース/安定版の受け入れに使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離された worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS の `.tgz` をダウンロードします。`package_sha256` は必須です。この経路は URL 認証情報、デフォルト以外の HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決後の IP、同じ公開安全ポリシー外へのリダイレクトを拒否します。
- `source=trusted-url` は、`.github/package-trusted-sources.json` の名前付き trusted-source ポリシーから HTTPS の `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。これは、設定済みのホスト、ポート、パスプレフィックス、リダイレクトホスト、またはプライベートネットワーク解決が必要な、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用します。ポリシーが bearer auth を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL 埋め込みの認証情報は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスは古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む完全な Docker リリース経路チャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブ ClawHub の可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec 経路はスタンドアロンディスパッチ用に保持されます。

ローカルコマンド、Docker レーン、パッケージ受け入れ入力、リリースデフォルト、失敗時のトリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`、`telegram_mode=mock-openai` でパッケージ受け入れを呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub skill インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストールの修復、オフライン Plugin、Plugin 更新、Telegram の証明が、同じ解決済みパッケージ tarball 上に保持されます。ベータ公開後に Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定すると、再ビルドせずに出荷済み npm パッケージに対して同じマトリクスを実行できます。パッケージ受け入れがリリース検証の他の部分とは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定します。クロス OS リリースチェックは、引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証はパッケージ受け入れから開始するべきです。`published-upgrade-survivor` Docker レーンは、ブロッキングリリース経路で実行ごとに 1 つの公開済みパッケージベースラインを検証します。パッケージ受け入れでは、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` がフォールバックの公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加え、Feishu config、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートのための、固定された Plugin 互換性境界リリースと issue 形状の fixture まで拡張します。複数ベースラインの published-upgrade survivor 選択は、ベースラインごとに別々の対象 Docker ランナージョブへシャード化されます。通常の Full Release CI の広さではなく、公開済み更新のクリーンアップを網羅的に確認することが目的の場合、別個の `Update Migration` ワークフローは `all-since-2026.4.23` と `plugin-deps-cleanup` を指定した `update-migration` Docker レーンを使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、シナリオマトリクス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ版およびインストーラー新規レーンでは、インストール済みパッケージが生の絶対 Windows パスから browser-control override を import できることも検証します。OpenAI のクロス OS agent-turn smoke は、`OPENCLAW_CROSS_OS_OPENAI_MODEL` が設定されている場合はそれをデフォルトにし、それ以外は `openai/gpt-5.5` にするため、インストールと Gateway の証明を GPT-5 テストモデルに維持しつつ、GPT-4.x デフォルトを避けます。

### レガシー互換性期間

パッケージ受け入れには、すでに公開済みのパッケージ向けに境界付きのレガシー互換性期間があります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、互換性経路を使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指している場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball 由来の fake git fixture から欠落している pnpm `patchedDependencies` を prune でき、永続化された `update.channel` の欠落をログに記録できます。
- Plugin smoke は、レガシーのインストールレコード場所を読み取るか、marketplace インストールレコード永続化の欠落を許容できます。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変更されないことを引き続き要求しつつ、config メタデータ移行を許可できます。

公開済みの `2026.4.26` パッケージも、すでに出荷済みだったローカルビルドメタデータスタンプファイルについて警告できます。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` の子実行とその Docker アーティファクトを調べます。`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行する代わりに、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これは smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス**は、Docker/パッケージ面、バンドル済み Plugin のパッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 面に触れるプルリクエストで実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI スモークを実行し、container gateway-network e2e を実行し、バンドル済み拡張のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付きのバンドル済み Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は個別に上限設定）。
- **フルパス**は、QR パッケージインストールとインストーラー Docker/更新カバレッジを、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そしてインストーラー/パッケージ/Docker 面に実際に触れるプルリクエスト向けに維持します。フルモードでは、install-smoke がターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速バンドル済み Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージスモークの後ろで待たされません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュでフルカバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、フルインストールスモークは夜間またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider スモークは `run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは任意で有効化できますが、プルリクエストと `main` プッシュでは実行されません。通常の PR CI では、Node 関連の変更に対して高速 Bun ランチャー回帰レーンを引き続き実行します。QR とインストーラー Docker テストは、それぞれインストールに特化した Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/更新/Plugin 依存関係レーン向けの素の Node/Git ランナー。
- 通常の機能レーン向けに、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン向けのメインプールのスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットルしないようにする同時 live レーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install レーン上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon の create ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの厳密なレーン一覧。クリーンアップスモークをスキップし、agent が失敗した 1 レーンを再現できるようにします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーンの状態を出力し、最長優先順序のためにレーン所要時間を永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。`scripts/docker-e2e.mjs` はそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュします。また、再ビルドする代わりに、提供された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに境界付きの 180 秒タイムアウトで再試行されるため、停止したレジストリ/キャッシュストリームが CI のクリティカルパスの大半を消費するのではなく、すばやく再試行されます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンク化ジョブとして実行されるため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`package-update-openai` には live Codex Plugin パッケージレーンが含まれます。このレーンは候補 OpenClaw パッケージをインストールし、`codex_plugin_spec` または同一 ref の tarball から Codex Plugin を明示的な Codex CLI インストール承認付きでインストールし、Codex CLI プリフライトを実行し、その後 OpenAI に対して同一セッションの OpenClaw agent ターンを複数実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フル release-path カバレッジが要求する場合に `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを維持します。バンドル済みチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、低速レーン表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択レーンを実行します。これにより、失敗レーンのデバッグを対象を絞った 1 つの Docker ジョブに限定し、その実行向けのパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその再実行用に live-test イメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済みの live/E2E ワークフローは、フル release-path Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、より高コストなプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別ワークフローです。通常のプルリクエスト、`main` プッシュ、単独の手動 CI ディスパッチでは、このスイートはオフのままです。これはバンドル済み Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、Plugin 設定グループを一度に最大 2 つ、グループごとに 1 つの Vitest ワーカーと大きめの Node ヒープで実行するため、import の多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用 Docker プレリリースパスは、1〜3 分のジョブのために数十のランナーを予約しないよう、対象 Docker レーンを小さなグループにまとめます。このワークフローは `@openclaw/plugin-inspector` からの情報用 `plugin-inspector-advisory` アーティファクトもアップロードします。inspector の所見はトリアージ入力であり、ブロック対象の Plugin Prerelease ゲートは変更しません。

## QA Lab

QA Lab には、メインのスマートスコープ付きワークフローの外に専用 CI レーンがあります。agentic parity は広範な QA およびリリースハーネスの配下にネストされ、単独の PR ワークフローではありません。parity を広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` で `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間および手動ディスパッチ時に実行されます。これは mock parity レーン、live Matrix レーン、live Telegram レーン、live Discord レーンを並列ジョブとして展開します。live ジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex lease を使用します。

リリースチェックは、決定論的 mock プロバイダーと mock-qualified モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram の live transport レーンを実行するため、チャンネル契約は live モデルのレイテンシや通常のプロバイダー Plugin 起動から分離されます。live transport Gateway は、QA parity がメモリ動作を別途カバーするため、memory search を無効にします。プロバイダー接続性は、別個の live モデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュール済みゲートとリリースゲートに `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI デフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` もリリース承認前にリリースクリティカルな QA Lab レーンを実行します。その QA parity ゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後最終 parity 比較のために両方のアーティファクトを小さなレポートジョブにダウンロードします。

通常の PR では、parity を必須ステータスとして扱うのではなく、スコープ付き CI/チェック証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリスイープではなく、意図的に狭い初回通過のセキュリティスキャナーです。日次、手動、非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加えて、最もリスクの高い JavaScript/TypeScript 面を、高/重大の `security-severity` にフィルターされた高信頼度セキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。これは `.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始し、スケジュール済みワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は PR デフォルトには含まれません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフロー健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` の下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係のビルド結果をアップロードされる SARIF から除外して、`/codeql-critical-security/macos` の下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大部分を占めるため、日次デフォルトの外に置かれています。

### クリティカル品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。狭く高価値なサーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを GitHub ホストの Linux ランナー上で実行します。これにより、品質スキャンが Blacksmith ランナー登録予算を消費しません。このプルリクエストガードは、スケジュールプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、config スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャネルと同梱チャネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL config と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための学習/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルと同梱チャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監督ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway 制御フロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティと分離されています。これにより、品質の検出事項をセキュリティシグナルを曖昧にせずにスケジュール、測定、無効化、拡張できます。Swift、Python、同梱 Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、スコープ化またはシャード化されたフォローアップ作業として追加し直すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを揃え続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップされます。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非 bot push CI 実行が成功するとトリガーできますが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、小さくカバレッジを維持するテストパフォーマンス修正のみを行わせます。その後、フルスイートレポートを再実行し、通過ベースラインのテスト数を減らす変更を拒否します。グループ化レポートは Linux と macOS で config ごとのウォールタイムと最大 RSS を記録するため、前後比較で実行時間の差分と並んでテストメモリの差分が見えるようになります。ベースラインに失敗テストがある場合、Codex が修正できるのは明らかな失敗のみで、エージェント後のフルスイートレポートはコミット前に通過する必要があります。Bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex アクションがドキュメントエージェントと同じ drop-sudo 安全姿勢を維持できるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複整理のための手動メンテナーワークフローです。デフォルトはドライランで、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複に共有の参照 issue または重複する変更ハンクがあることを確認します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広い CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア本番変更は、コア本番とコアテストの typecheck に加えて、コア lint/guards を実行します。
- コアのテストのみの変更は、コアテストの typecheck に加えて、コア lint のみを実行します。
- extension 本番変更は、extension 本番と extension テストの typecheck に加えて、extension lint を実行します。
- extension のテストのみの変更は、extension テストの typecheck に加えて、extension lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存するため、extension typecheck に拡張されます（Vitest extension sweep は明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/config/root-dependency チェックを実行します。
- 不明な root/config 変更は、安全側に倒してすべてのチェックレーンを失敗させます。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より軽量です。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ依存先を使います。共有グループルーム配信 config は明示的なマッピングの 1 つです。グループの表示返信 config、ソース返信配信モード、またはメッセージツールのシステムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を経由するため、共有デフォルトの変更は最初の PR push 前に失敗します。変更がハーネス全体に及ぶほど広く、安価なマッピング済みセットが信頼できる代替にならない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有リモートボックスラッパーです。チェックがローカル編集ループには広すぎる場合、CI との同等性が重要な場合、または証明にシークレット、Docker、パッケージレーン、再利用可能なボックス、リモートログが必要な場合に、リポジトリルートから使用します。通常の OpenClaw バックエンドは `blacksmith-testbox` です。所有 AWS/Hetzner キャパシティは、Blacksmith の障害、クォータ問題、または明示的な所有キャパシティテストのためのフォールバックです。

Crabbox をバックエンドにした Blacksmith 実行は、ワンショットの Testbox をウォームアップ、確保、同期、実行、レポート、クリーンアップします。組み込みの同期健全性チェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short` が追跡済み削除を 200 件以上示した場合に高速失敗します。意図的な大量削除 PR では、リモートコマンドに `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

Crabbox は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル diff にはより大きいミリ秒値を使用します。

初回実行の前に、repo ルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo ラッパーは、`blacksmith-testbox` を通知しない古い Crabbox バイナリを拒否します。`.crabbox.yaml` に owned-cloud のデフォルトがあっても、provider は明示的に渡します。Codex ワークツリーまたは linked/sparse checkout では、Crabbox が開始する前に pnpm が依存関係を再調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトは避け、代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith をバックエンドにした実行には Crabbox 0.22.0 以降が必要です。これにより、ラッパーは現在の Testbox の同期、キュー、クリーンアップ動作を取得します。兄弟 checkout を使用する場合は、タイミング計測や証明作業の前に、ignore されたローカルバイナリを再ビルドします。

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

最後の JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。ワンショットの Blacksmith バックエンド Crabbox 実行は Testbox を自動停止するはずです。実行が中断された場合やクリーンアップが不明確な場合は、ライブの box を確認し、自分が作成した box だけを停止します。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydrate 済み box で複数のコマンドが意図的に必要な場合にのみ reuse を使用します。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Crabbox レイヤーが壊れているが Blacksmith 自体は動作する場合、直接の Blacksmith は `list`、`status`、クリーンアップなどの診断にのみ使用します。直接の Blacksmith 実行をメンテナー証明として扱う前に、Crabbox パスを修正します。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しい warmup が数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith provider、キュー、課金、または org 制限の逼迫として扱います。自分が作成した queued id を停止し、これ以上 Testbox を開始せず、誰かが Blacksmith ダッシュボード、課金、org 制限を確認する間、証明は下記の owned Crabbox capacity パスへ移します。

Blacksmith が停止している、クォータ制限がある、必要な環境がない、または owned capacity が明示的な目的である場合にのみ、owned Crabbox capacity へエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS が逼迫している場合、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` は避けます。`beast` リクエストは 192 vCPU から開始し、リージョン別 EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。repo 所有の `.crabbox.yaml` は `standard`、複数の capacity リージョン、`capacity.hints: true` をデフォルトにしているため、ブローカーされた AWS lease は選択されたリージョン/マーケット、クォータ逼迫、Spot fallback、高負荷クラス警告を出力します。より重い広範なチェックには `fast` を使用し、standard/fast では不十分な場合にのみ `large` を使用し、フルスイートや全 Plugin Docker マトリックス、明示的なリリース/ブロッカー検証、高コア数のパフォーマンスプロファイリングなど、例外的な CPU バウンドレーンにのみ `beast` を使用します。`pnpm check:changed`、絞り込んだテスト、docs のみの作業、通常の lint/typecheck、小規模な E2E 再現、Blacksmith 障害トリアージには `beast` を使用しないでください。capacity 診断には `--market on-demand` を使用し、Spot マーケットの変動がシグナルに混ざらないようにします。

`.crabbox.yaml` は owned-cloud レーンの provider、同期、GitHub Actions hydration デフォルトを所有します。これはローカルの `.git` を除外するため、hydrate された Actions checkout はメンテナーのローカル remote やオブジェクトストアを同期する代わりに、自身の remote Git メタデータを保持します。また、転送すべきでないローカル runtime/build アーティファクトも除外します。`.github/workflows/crabbox-hydrate.yml` は、owned-cloud の `crabbox run --id <cbx_id>` コマンド向けに、checkout、Node/pnpm セットアップ、`origin/main` fetch、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
