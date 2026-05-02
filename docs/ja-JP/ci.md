---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しています
summary: CI ジョブグラフ、スコープゲート、リリース包括、ローカルコマンド相当
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-02T04:50:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2da3014e67b8d2d4bb4c1c9d4c6134eed29309bb176544864df568809ae3ac7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は、`main` へのすべてのプッシュとすべてのプルリクエストで実行されます。`preflight` ジョブは差分を分類し、無関係な領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` を通じてオプトインのままです。リリース専用の Plugin カバレッジは、別個の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                      | 実行タイミング                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ドキュメントのみの変更、変更されたスコープ、変更された拡張機能を検出し、CI マニフェストを構築する      | ドラフトでないプッシュと PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                        | ドラフトでないプッシュと PR では常に |
| `security-dependency-audit`      | npm アドバイザリに対する、依存関係を使わない本番 lockfile 監査                             | ドラフトでないプッシュと PR では常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                | ドラフトでないプッシュと PR では常に |
| `check-dependencies`             | 本番 Knip 依存関係のみのパスと未使用ファイル許可リストガード                    | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルドする          | Node 関連の変更              |
| `checks-fast-core`               | バンドル済み、Plugin コントラクト、プロトコルチェックなどの高速 Linux 正確性レーン                 | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャンネルコントラクトチェック                         | Node 関連の変更              |
| `checks-node-core-test`          | チャンネル、バンドル済み、コントラクト、拡張機能レーンを除外した Core Node テストシャード             | Node 関連の変更              |
| `check`                          | シャード化された主ローカルゲート相当: 本番型、lint、ガード、テスト型、厳格なスモーク   | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、境界、拡張機能サーフェスガード、パッケージ境界、gateway-watch シャード | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI スモークテストと起動時メモリスモーク                                               | Node 関連の変更              |
| `checks`                         | ビルド済みアーティファクトのチャンネルテスト用検証器                                                    | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドとスモークレーン                                                   | リリース用の手動 CI ディスパッチ    |
| `check-docs`                     | ドキュメントのフォーマット、lint、リンク切れチェック                                                | ドキュメントが変更された場合                       |
| `skills-python`                  | Python ベースの Skills 向け Ruff + pytest                                                       | Python Skill 関連の変更      |
| `checks-windows`                 | Windows 固有のプロセス/パステストと共有ランタイム import specifier 回帰テスト         | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済みアーティファクトを使う macOS TypeScript テストレーン                                  | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリ向け Swift lint、ビルド、テスト                                               | macOS 関連の変更             |
| `android`                        | 両方の flavor の Android unit test と 1 つの debug APK ビルド                                 | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                    | main CI 成功時または手動ディスパッチ |

## Fail-fast の順序

1. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトジョブやプラットフォームマトリックスジョブを待たずに素早く失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しいプッシュが到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI の並行実行キーはバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使い、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動ディスパッチは変更スコープ検出をスキップし、すべてのスコープ対象領域が変更されたかのように preflight マニフェストを動作させます。

- **CI ワークフローの編集** は Node CI グラフとワークフロー lint を検証しますが、それ自体では Windows、Android、macOS のネイティブビルドを強制しません。これらのプラットフォームレーンは、プラットフォームソースの変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された低コストな core-test fixture 編集、狭い Plugin コントラクト helper/test-routing 編集** は、高速な Node のみのマニフェストパスを使います: `preflight`、security、単一の `checks-fast-core` タスクです。そのパスは、変更が高速タスクで直接実行されるルーティングまたは helper サーフェスに限定されている場合、ビルドアーティファクト、Node 22 互換性、チャンネルコントラクト、完全な core シャード、バンドル済み Plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI ランナー helper、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフローサーフェスにスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに留まります。

最も遅い Node テストファミリーは、各ジョブがランナーを過剰に予約せず小さく保たれるように分割またはバランス調整されています。チャンネルコントラクトは 3 つの重み付きシャードとして実行され、小さな core unit レーンはペア化され、auto-reply は 4 つのバランス済み worker として実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割されます）。agentic gateway/plugin config はビルド済みアーティファクトを待たずに、既存のソースのみの agentic Node ジョブ全体に分散されます。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使います。Include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional` はパッケージ境界の compile/canary 作業をまとめ、ランタイムトポロジーアーキテクチャを gateway watch カバレッジから分離します。boundary guard シャードは、小さな独立ガードを 1 つのジョブ内で並行実行します。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。その unit-test レーンは、SMS/通話ログの BuildConfig フラグ付きで flavor を引き続きコンパイルしつつ、Android 関連のすべてのプッシュで重複した debug APK パッケージングジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` インストールでは pnpm の minimum release age が無効化された本番 Knip 依存関係のみのパス）と `pnpm deadcode:unused-files` を実行します。後者は、Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合や古い allowlist エントリを残した場合に失敗しつつ、Knip が静的に解決できない意図的な動的 Plugin、生成済み、ビルド、ライブテスト、パッケージブリッジのサーフェスを保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティから ClawSweeper へのターゲット側ブリッジです。信頼されていないプルリクエストコードを checkout したり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` payload を `openclaw/clawsweeper` にディスパッチします。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request review リクエスト用の `clawsweeper_item`;
- issue comment 内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` プッシュ上の commit レベル review リクエスト用の `clawsweeper_commit_review`;
- ClawSweeper agent が調査する可能性のある一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します: event type、action、actor、repository、item number、URL、title、state、そして存在する場合は comment または review の短い excerpt です。完全な webhook body は意図的に転送しません。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化された event を ClawSweeper agent 用の OpenClaw Gateway hook に投稿します。

一般的なアクティビティは観測であり、デフォルト配信ではありません。ClawSweeper agent は prompt で Discord ターゲットを受け取り、その event が意外で、対応可能で、リスクがあり、または運用上有用な場合にのみ `#clawsweeper` に投稿すべきです。通常の open、edit、bot churn、重複 webhook ノイズ、通常の review トラフィックは `NO_REPLY` になるべきです。

この経路全体で、GitHub の title、comment、body、review text、branch name、commit message は信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローや agent runtime への指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ対象レーンを強制的に有効にします: Linux Node シャード、バンドル済み Plugin シャード、チャンネルコントラクト、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは、`include_android=true` の場合のみ Android を実行します。完全リリースの包括ワークフローは、`include_android=true` を渡すことで Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張機能バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` が release-validation gate を有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency group を使うため、リリース候補のフルスイートが、同じ ref 上の別のプッシュや PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択された dispatch ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドルチェック、シャーディングされたチャネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、docs チェック、Python skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub-hosted Ubuntu を使用するため、Blacksmith マトリックスをより早くキューに入れられる |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低負荷の拡張機能シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 感度が高く、8 vCPU は節約分よりコストが大きかった）。install-smoke Docker ビルド（32-vCPU のキュー時間コストが節約分より大きかった）                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                   |

## ローカルでの対応コマンド

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動アンブレラワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明として `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチします。`rerun_group=all` と `release_profile=full` を指定すると、release checks の `release-package-under-test` アーティファクトに対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡すと、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行できます。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、絞り込み再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

変化の速いブランチ上で固定コミットの証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使用してください。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。このヘルパーは、ターゲット SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットに一致することを検証し、実行完了時に一時ブランチを削除します。アンブレラ検証も、いずれかの子ワークフローが異なる SHA で実行された場合は失敗します。

`release_profile` は、release checks に渡される live/provider の範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な advisory provider/media マトリックスを意図的に実行したい場合にのみ `full` を使用してください。

- `minimum` は、最速の OpenAI/コアのリリースクリティカルレーンを維持します。
- `stable` は、安定版 provider/backend セットを追加します。
- `full` は、広範な advisory provider/media マトリックスを実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブが現在の子実行の結論を再確認し、各子実行について最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、アンブレラの結果とタイミング概要を更新するため、親の検証ジョブだけを再実行してください。

リカバリのために、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子のみには `ci`、Plugin prerelease 子のみには `plugin-prerelease`、すべての release 子には `release-checks` を使用します。またはアンブレラ上で、より狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、絞り込んだ修正後の失敗したリリースボックス再実行を限定できます。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトを live/E2E リリースパス Docker ワークフローと package acceptance シャードの両方に渡します。これにより、リリースボックス全体でパッケージのバイト列が一貫し、複数の子ジョブで同じ候補を再パックすることを避けられます。

`ref=main` と `rerun_group=all` の重複した `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチした子ワークフローをキャンセルするため、新しい main 検証が古い 2 時間の release-check 実行の後ろに滞留することはありません。リリースブランチ/タグ検証と絞り込み再実行グループは、`cancel-in-progress: false` を維持します。

## Live と E2E シャード

リリース live/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider でフィルタされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声/動画シャードと provider でフィルタされた音楽シャード

これにより、同じファイルカバレッジを保ちながら、遅い live provider の失敗を再実行して診断しやすくなります。集約用の `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の一回限り再実行でも引き続き有効です。

ネイティブ live media シャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` がプリインストールされており、media ジョブはセットアップ前にバイナリだけを検証します。Docker-backed live スイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブは、ネストされた Docker テストを起動する場所として適していません。

Docker-backed live model/backend シャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。live release ワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker live model、provider-sharded Gateway、CLI backend、ACP bind、Codex harness シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブの timeout より短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナや cleanup パスが停止した場合に release-check 予算全体を消費せず、早く失敗します。これらのシャードが完全なソース Docker ターゲットを独立して再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドに壁時計時間を浪費します。

## パッケージ受け入れ検証

`Package Acceptance` は、「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いに使います。通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、ユーザーがインストール後またはアップデート後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` を指定して `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け入れます。公開済み beta/stable の受け入れに使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離された worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに、過去の信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使うため、公開済みパッケージの検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、スタンドアロンディスパッチ用には公開済み npm spec パスを残します。

専用のアップデートおよび Plugin テストポリシーについては、ローカルコマンド、
Docker レーン、Package Acceptance 入力、リリース既定値、失敗トリアージを含め、
[アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` を指定して Package Acceptance を呼び出します。これにより、パッケージ移行、アップデート、古い Plugin 依存関係のクリーンアップ、オフライン Plugin、Plugin アップデート、Telegram 証明が、同じ解決済みパッケージ tarball 上に保たれます。Cross-OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/アップデートの製品検証は Package Acceptance から開始するべきです。`published-upgrade-survivor` Docker レーンは、1 回の実行につき 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` はフォールバックの公開済みベースラインを選択します。既定値は `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。`published_upgrade_survivor_baselines=release-history` を設定すると、重複排除済みの履歴マトリクス全体にレーンを拡張します。対象は最新 6 件の stable リリース、`2026.4.23`、および `2026-03-15` より前の最新 stable リリースです。`published_upgrade_survivor_scenarios=reported-issues` を設定すると、同じベースラインを、Feishu 設定、保持された bootstrap/persona ファイル、チルダログパス、古いレガシー Plugin 依存関係ルートの issue 形状フィクスチャ全体に拡張します。別個の `Update Migration` ワークフローは、問いが通常の Full Release CI の広さではなく、公開済みアップデートのクリーンアップを網羅することにある場合に、`all-since-2026.4.23` と `plugin-deps-cleanup` を指定して `update-migration` Docker レーンを使います。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すことも、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持することも、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定してシナリオマトリクスを使うこともできます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みおよびインストーラーの新規レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI cross-OS agent-turn smoke は、設定されている場合は既定で `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使い、それ以外は `openai/gpt-5.5` を使うため、インストールと Gateway の証明は推奨 GPT-5 テストモデル上に保たれます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指していてもかまいません。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップしてもかまいません。
- `update-channel-switch` は、tarball 由来の偽 git フィクスチャから欠落した `pnpm.patchedDependencies` を刈り込んでもよく、永続化された `update.channel` の欠落をログに出してもかまいません。
- Plugin smoke はレガシーインストールレコードの場所を読み取ってもよく、マーケットプレイスインストールレコード永続化の欠落を許容してもかまいません。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許容してもかまいません。

公開済みの `2026.4.26` パッケージでは、すでに出荷済みだったローカルビルドメタデータスタンプファイルについても警告してかまいません。それ以降のパッケージは現代の契約を満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

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
  -f package_ref=release/YYYY.M.D \
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

失敗したパッケージ受け入れ実行をデバッグするときは、`resolve_package` サマリーから開始して、パッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます。`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## Install smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージ表面、バンドル済み Plugin パッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 表面に触れる pull request で実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、docs のみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI を確認し、agents delete shared-workspace CLI smoke を実行し、コンテナー gateway-network e2e を実行し、バンドル済みエクステンションの build arg を検証し、240 秒の集約コマンドタイムアウト内で範囲限定のバンドル済み Plugin Docker プロファイルを実行します。各シナリオの Docker 実行は別個に上限が設定されます。
- **完全パス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker 表面に実際に触れる pull request 向けに、QR パッケージインストールとインストーラー Docker/アップデートカバレッジを維持します。full モードでは、install-smoke は 1 つの target-SHA GHCR ルート Dockerfile smoke イメージを準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway smoke、インストーラー/アップデート smoke、高速バンドル済み Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業はルートイメージ smoke の後ろで待つことがありません。

`main` push（merge commit を含む）は完全パスを強制しません。変更スコープロジックが push で完全カバレッジを要求する場合でも、ワークフローは高速 Docker smoke を維持し、完全な install smoke は夜間またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別個にゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは任意で有効にできますが、pull request と `main` push では実行されません。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は 1 つの共有 live-test イメージを事前ビルドし、OpenClaw を npm tarball として一度だけパックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- インストーラー/アップデート/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーンのメインプールスロット数。                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | プロバイダーに影響されやすいテールプールのスロット数。                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | プロバイダーがスロットリングしないようにする同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時 npm インストールレーン上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker デーモンの作成集中を避けるためのレーン開始間隔。間隔なしにするには `0` を設定します。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120分）。選択されたライブ/テールレーンはより厳しい上限を使います。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` はレーンを実行せずにスケジューラープランを出力します。                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | カンマ区切りの正確なレーンリスト。エージェントが失敗した1つのレーンを再現できるように、クリーンアップスモークをスキップします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前確認し、古い OpenClaw E2E コンテナを削除し、アクティブレーンのステータスを出力し、最長優先の並び順のためにレーンの所要時間を永続化し、デフォルトでは最初の失敗後に新しいプール対象レーンのスケジュールを停止します。

### 再利用可能なライブ/E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報のカバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後、`scripts/docker-e2e.mjs` がそのプランを GitHub の出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` で OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。さらに tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は、Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドせずに指定済みの `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージのプルは、試行ごとに上限180秒のタイムアウト付きで再試行されるため、止まったレジストリ/キャッシュストリームが CI のクリティカルパスの大半を消費する代わりに素早く再試行されます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さく分割されたジョブを実行します。これにより各チャンクは必要なイメージ種別だけをプルし、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。

フルのリリースパスカバレッジが要求する場合、OpenWebUI は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチの場合に限ってスタンドアロンの `openwebui` チャンクを保持します。バンドル済みチャンネルの更新レーンは、一時的な npm ネットワーク失敗に対して1回再試行します。

各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、遅いレーンのテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより失敗レーンのデバッグは対象を絞った1つの Docker ジョブに限定され、その実行のためにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2E ワークフローは、フルのリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストなプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別ワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。バンドル済み Plugin テストを8つの拡張ワーカーに分散します。これらの拡張シャードジョブは、一度に最大2つの Plugin 設定グループを、グループごとに1つの Vitest ワーカーとより大きい Node ヒープで実行するため、インポートの重い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1分から3分のジョブのために多数のランナーを予約しないよう、対象 Docker レーンを小さなグループにまとめます。

## QA ラボ

QA ラボには、メインのスマートスコープワークフローとは別に専用の CI レーンがあります。

- `Parity gate` ワークフローは、一致する PR 変更と手動ディスパッチで実行されます。非公開 QA ランタイムをビルドし、モック GPT-5.5 と Opus 4.6 のエージェントパックを比較します。
- `QA-Lab - All Lanes` ワークフローは、`main` 上で毎晩、また手動ディスパッチで実行されます。モックパリティゲート、ライブ Matrix レーン、ライブ Telegram レーンと Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使い、Telegram/Discord は Convex リースを使います。

リリースチェックは、決定的なモックプロバイダーとモック認定モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブトランスポートレーンを実行します。これにより、チャンネル契約はライブモデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway はメモリ検索を無効にします。これは、QA パリティがメモリ動作を別途カバーするためです。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix は、スケジュールゲートとリリースゲートで `--profile fast` を使い、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常にフル Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA ラボレーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。

変更が実際に QA ランタイム、モデルパックのパリティ、またはパリティワークフローが所有するサーフェスに触れていない限り、PR ランディングパスを `Parity gate` の背後に置かないでください。通常のチャンネル、設定、ドキュメント、またはユニットテストの修正では、これは任意のシグナルとして扱い、スコープされた CI/チェックの証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは意図的に狭い一次セキュリティスキャナーであり、リポジトリ全体のスイープではありません。毎日、手動、非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大 `security-severity` にフィルターされた高信頼度セキュリティクエリでスキャンします。

プルリクエストガードは軽量なままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始し、スケジュールされたワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は PR デフォルトに含まれません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、Gateway ベースライン                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加え、チャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント                 |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲート                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー sanity が受け入れる最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係のビルド結果をアップロード済み SARIF から除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次デフォルトの外に置かれています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。小さい Blacksmith Linux ランナー上で、狭い高価値サーフェスに対して、エラー重大度かつ非セキュリティの JavaScript/TypeScript 品質クエリのみを実行します。そのプルリクエストガードは、スケジュールプロファイルより意図的に小さくなっています。非ドラフト PR は、エージェントコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルとバンドル済みチャンネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1つの品質シャードを単独で実行するための教育/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway のセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config スキーマ、移行、正規化、IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルとバンドルされたチャンネルPluginの実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーのディスパッチ、自動返信のディスパッチとキュー、ACP コントロールプレーンのランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK のインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、セッション/スレッドのバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログの正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダー既定値/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI のブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンのランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成のランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイントのコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離されたままにしておくことで、セキュリティシグナルを不明瞭にせずに、品質の検出結果をスケジュール、測定、無効化、拡張できるようにします。Swift、Python、バンドルPluginの CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定してから、スコープ付きまたはシャーディングされたフォローアップ作業としてのみ追加し直してください。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近 land された変更に既存ドキュメントを合わせるためのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI run が成功するとトリガーでき、手動 dispatch で直接実行できます。Workflow-run 呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent run が過去 1 時間以内に作成されている場合はスキップします。実行時には、前回スキップされなかった Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の run で前回のドキュメントパス以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI run が成功するとトリガーできますが、その UTC 日に別の workflow-run 呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動 dispatch はその日次アクティビティゲートをバイパスします。このレーンはフルスイートのグループ化 Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行し、passing baseline test count を減らす変更を拒否します。ベースラインに失敗しているテストがある場合、Codex は明白な失敗のみを修正でき、agent 後のフルスイートレポートは何かをコミットする前にパスする必要があります。bot push が land する前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。GitHub-hosted Ubuntu を使用するため、Codex action は docs agent と同じ drop-sudo 安全姿勢を維持できます。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、land 後の重複クリーンアップのための手動 maintainer ワークフローです。既定は dry-run で、`apply=true` の場合に明示的に指定された PR のみを close します。GitHub を変更する前に、land 済み PR がマージ済みであり、各重複 PR に共有の参照 issue または重複する changed hunk があることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカル changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に厳格です。

- コア production 変更は、core prod と core test の typecheck に加えて core lint/guards を実行します。
- コア test-only 変更は、core test typecheck に加えて core lint のみを実行します。
- extension production 変更は、extension prod と extension test の typecheck に加えて extension lint を実行します。
- extension test-only 変更は、extension test typecheck に加えて extension lint を実行します。
- 公開 Plugin SDK または plugin-contract の変更は、extension がそれらのコアコントラクトに依存しているため、extension typecheck まで拡張されます（Vitest extension sweep は明示的なテスト作業のままです）。
- release metadata-only のバージョン bump は、対象を絞った version/config/root-dependency チェックを実行します。
- 不明な root/config 変更は、安全側に倒してすべての check lane を実行します。

ローカル changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピングを優先し、その後 sibling tests と import-graph dependents を使います。共有 group-room 配信 config は明示的なマッピングの 1 つです。group visible-reply config、source reply delivery mode、または message-tool system prompt への変更は、core reply tests に加えて Discord と Slack の配信 regression を通るため、共有既定値の変更は最初の PR push 前に失敗します。変更が harness-wide で、安価な mapped set が信頼できる proxy ではない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Testbox は repo root から実行し、広範な proof には新しく warmed した box を優先します。再利用された、期限切れの、または予想外に大きな sync を報告した box で遅いゲートに時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行してください。

sanity check は、`pnpm-lock.yaml` などの必須 root ファイルが消えている場合、または `git status --short` が少なくとも 200 件の tracked deletion を示す場合に即座に失敗します。これは通常、remote sync state が PR の信頼できるコピーではないことを意味します。product test failure をデバッグするのではなく、その box を停止して新しいものを warm してください。意図的な大規模 deletion PR では、その sanity run に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定します。

`pnpm testbox:run` は、sync 後の出力なしに 5 分を超えて sync phase に留まるローカル Blacksmith CLI 呼び出しも終了します。その guard を無効化するには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きい local diff にはより大きなミリ秒値を使用してください。

Crabbox は、Blacksmith が利用できない場合、または所有する cloud capacity が望ましい場合の Linux proof 用の repo-owned の第 2 remote-box 経路です。box を warm し、project workflow で hydrate してから、Crabbox CLI 経由でコマンドを実行します。

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` は provider、sync、GitHub Actions hydration の既定値を所有します。local `.git` を除外するため、hydrated Actions checkout は maintainer-local の remote や object store を sync せず、独自の remote Git メタデータを保持します。また、転送されるべきではない local runtime/build artifact も除外します。`.github/workflows/crabbox-hydrate.yml` は checkout、Node/pnpm setup、`origin/main` fetch、および後続の `crabbox run --id <cbx_id>` コマンドが source する非 secret 環境 handoff を所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
