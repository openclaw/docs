---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
summary: CI ジョブグラフ、スコープゲート、リリース包括、ローカルコマンド相当
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-30T18:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` への各プッシュとすべてのプルリクエストで実行されます。`preflight` ジョブは差分を分類し、関係のない領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` を通じてオプトインのままです。リリース専用の Plugin カバレッジは別の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                           | 目的                                                                                         | 実行タイミング                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された拡張、CI マニフェストの構築を検出                  | 非ドラフトのプッシュと PR で常時 |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                  | 非ドラフトのプッシュと PR で常時 |
| `security-dependency-audit`      | npm アドバイザリに対する、依存関係なしの本番ロックファイル監査                               | 非ドラフトのプッシュと PR で常時 |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | 非ドラフトのプッシュと PR で常時 |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと、未使用ファイル許可リストガード                             | Node 関連の変更                  |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み成果物チェック、再利用可能な下流成果物をビルド               | Node 関連の変更                  |
| `checks-fast-core`               | バンドル/Plugin 契約/プロトコルチェックなどの高速 Linux 正当性レーン                        | Node 関連の変更                  |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャンネル契約チェック                       | Node 関連の変更                  |
| `checks-node-core-test`          | チャンネル、バンドル、契約、拡張レーンを除く Core Node テストシャード                        | Node 関連の変更                  |
| `check`                          | 本番型、lint、ガード、テスト型、厳格な smoke の、シャード化された主要ローカルゲート相当      | Node 関連の変更                  |
| `check-additional`               | アーキテクチャ、境界、拡張サーフェスガード、パッケージ境界、gateway-watch シャード           | Node 関連の変更                  |
| `build-smoke`                    | ビルド済み CLI の smoke テストと起動時メモリ smoke                                           | Node 関連の変更                  |
| `checks`                         | ビルド済み成果物チャンネルテストの検証                                                       | Node 関連の変更                  |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                          | リリース用の手動 CI ディスパッチ |
| `check-docs`                     | Docs のフォーマット、lint、壊れたリンクのチェック                                           | Docs が変更された場合            |
| `skills-python`                  | Python バックの Skills 用 Ruff + pytest                                                      | Python Skills 関連の変更         |
| `checks-windows`                 | Windows 固有のプロセス/パステストと、共有ランタイム import specifier の回帰                  | Windows 関連の変更               |
| `macos-node`                     | 共有ビルド済み成果物を使う macOS TypeScript テストレーン                                     | macOS 関連の変更                 |
| `macos-swift`                    | macOS アプリの Swift lint、ビルド、テスト                                                    | macOS 関連の変更                 |
| `android`                        | 両方のフレーバーの Android ユニットテストと、1 つの debug APK ビルド                         | Android 関連の変更               |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                       | Main CI 成功または手動ディスパッチ |

## フェイルファスト順序

1. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォームマトリックスジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、下流のコンシューマーを開始できます。
4. その後、より重いプラットフォームとランタイムのレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しいプッシュが入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI の concurrency キーはバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチは changed-scope 検出をスキップし、すべてのスコープ対象領域が変更されたかのように preflight マニフェストを動作させます。

- **CI ワークフロー編集** は Node CI グラフとワークフロー lint を検証しますが、それだけで Windows、Android、macOS ネイティブビルドを強制することはありません。これらのプラットフォームレーンは、プラットフォームソースの変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された低コストな core-test fixture 編集、狭い Plugin 契約ヘルパー/テストルーティング編集** は、高速な Node のみのマニフェストパスを使用します: `preflight`、セキュリティ、単一の `checks-fast-core` タスクです。そのパスは、変更が高速タスクが直接実行するルーティングまたはヘルパーサーフェスに限定される場合、ビルド成果物、Node 22 互換性、チャンネル契約、完全な Core シャード、バンドル Plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node チェック** は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI runner ヘルパー、パッケージマネージャー設定、そのレーンを実行する CI ワークフローサーフェスにスコープされます。関係のないソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブを小さく保ちつつ runner を過剰予約しないように分割またはバランス調整されています。チャンネル契約は 3 つの重み付きシャードとして実行され、小さな Core ユニットレーンはペアにされ、auto-reply は 4 つのバランス済みワーカーとして実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割されます）。また、agentic Gateway/Plugin 設定は、ビルド済み成果物を待つ代わりに、既存のソースのみの agentic Node ジョブ全体に分散されます。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin キャッチオールではなく専用の Vitest 設定を使用します。include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できます。`check-additional` はパッケージ境界の compile/canary 作業をまとめ、runtime topology アーキテクチャを gateway watch カバレッジから分離します。boundary guard シャードは、小さな独立ガードを 1 つのジョブ内で同時に実行します。Gateway watch、チャンネルテスト、Core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で同時に実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには個別の source set や manifest はありません。そのユニットテストレーンは、SMS/call-log BuildConfig フラグ付きでフレーバーを引き続きコンパイルしつつ、Android 関連の各プッシュで重複した debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定された本番 Knip の依存関係のみのパスで、`dlx` インストールでは pnpm の最小リリース経過期間が無効）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い許可リストエントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic Plugin、生成物、ビルド、live-test、package bridge サーフェスは保持します。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ対象レーンを強制的に有効にします: Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、build smoke、docs チェック、Python Skills、Windows、macOS、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合のみ Android を実行します。フルリリースの包括ワークフローは `include_android=true` を渡して Android を有効にします。Plugin prerelease static checks、リリース専用の `agentic-plugins` シャード、完全な extension batch sweep、Plugin prerelease Docker レーンは CI から除外されます。Docker prerelease スイートは、`Full Release Validation` が release-validation gate を有効にして別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency group を使用するため、リリース候補のフルスイートが、同じ ref 上の別のプッシュや PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼済みの呼び出し元は、選択されたディスパッチ ref のワークフローファイルを使いながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| ランナー                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/コントラクト/バンドル済みチェック、シャード化されたチャンネルコントラクトチェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリクスはより早くキューに入れられる |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低負荷の Plugin シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル済み Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 依存が強く、8 vCPU は節約分よりコストが大きかった）。install-smoke Docker ビルド（32 vCPU は節約分よりキュー時間のコストが大きかった）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` では `macos-node`。フォークでは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` では `macos-swift`。フォークでは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動の `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 検証のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。公開済みパッケージ仕様が指定された場合は、公開後の `NPM Telegram Beta E2E` ワークフローも実行できます。

`release_profile` は、リリースチェックへ渡す live/provider の範囲を制御します。

- `minimum` は最速の OpenAI/core リリースクリティカルレーンを維持します。
- `stable` は安定版 provider/backend セットを追加します。
- `full` は広範な advisory provider/media マトリクスを実行します。

包括ワークフローはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブが現在の子実行の結果を再チェックし、各子実行の最遅ジョブテーブルを追記します。子ワークフローを再実行して成功した場合は、包括結果とタイミング要約を更新するために親の検証ジョブだけを再実行してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全な CI 子だけには `ci`、すべてのリリース子には `release-checks`、より狭いグループには包括ワークフロー上で `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、または `npm-telegram` を使います。これにより、集中修正後の失敗したリリースボックスの再実行を限定できます。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使って選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトを live/E2E リリースパス Docker ワークフローと package acceptance シャードの両方へ渡します。これにより、リリースボックス全体でパッケージのバイト列が一貫し、複数の子ジョブで同じ候補を再パックすることを避けられます。

## Live と E2E シャード

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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
- 分割されたメディア audio/video シャードと、provider でフィルターされた music シャード

これにより、同じファイルカバレッジを保ちながら、遅い live provider の失敗を再実行および診断しやすくなります。集約用の `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも引き続き有効です。

ネイティブ live media シャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリを検証するだけです。Docker バックの live スイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストされた Docker テストを起動する場所として不適切です。

Docker バックの live model/backend シャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使います。live リリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker live model、Gateway、CLI backend、ACP bind、Codex harness シャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。これらのシャードがフルソース Docker ターゲットを個別に再ビルドする場合、そのリリース実行は設定ミスであり、重複イメージビルドで実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」という問いには `Package Acceptance` を使います。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、package acceptance はインストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通して、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップ要約にソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じて package-digest Docker イメージを準備し、ワークフローチェックアウトをパックする代わりにそのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、その後それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でなく、Package Acceptance が解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチは、公開済み npm 仕様を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みの beta/stable 受け入れにこれを使用します。
- `source=ref` は、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択したコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離されたワークツリーに依存関係をインストールして、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトには指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスは古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` のとき必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブ ClawHub の可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` の `package-under-test` アーティファクトを再利用し、公開済み npm 仕様パスはスタンドアロンのディスパッチ用に保持されます。

リリースチェックは、`source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。リリースパス Docker チャンクは重複する package/update/plugin レーンをカバーします。Package Acceptance は、同じ解決済みパッケージ tarball に対して、アーティファクトネイティブの bundled-channel 互換性、オフライン Plugin、Telegram の証明を保持します。Cross-OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム挙動をカバーします。package/update の製品検証は Package Acceptance から始めるべきです。Windows の packaged レーンと installer fresh レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドをインポートできることも検証します。OpenAI cross-OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` をデフォルトとし、そうでない場合は `openai/gpt-5.4-mini` を使用するため、インストールと Gateway の証明は高速かつ決定的に保たれます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の private QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の偽 git fixture から欠落している `pnpm.patchedDependencies` を刈り込む場合があり、永続化された `update.channel` の欠落をログに記録する場合があります。
- Plugin smoke はレガシーの install-record 位置を読み取る場合があり、または marketplace install-record 永続化の欠落を許容する場合があります。
- `plugin-update` は、install record と no-reinstall 挙動が変更されないことを引き続き要求しながら、設定メタデータ移行を許容する場合があります。

公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告する場合もあります。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は警告やスキップではなく失敗になります。

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

失敗した package acceptance 実行をデバッグするときは、`resolve_package` サマリーから開始して、パッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクト（`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド）を調査します。完全なリリース検証を再実行するのではなく、失敗した package プロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/package サーフェス、バンドル済み Plugin パッケージ/マニフェスト変更、または Docker smoke ジョブが実行する core plugin/channel/gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、docs のみの編集では Docker ワーカーは予約されません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI smoke を実行し、コンテナ gateway-network e2e を実行し、バンドル済み extension ビルド引数を検証し、240 秒の集約コマンドタイムアウト（各シナリオの Docker 実行は別途上限あり）内で、範囲を限定した bundled-plugin Docker プロファイルを実行します。
- **フルパス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、および installer/package/Docker サーフェスに本当に触れるプルリクエスト向けに、QR package install と installer Docker/update カバレッジを保持します。フルモードでは、install-smoke は target-SHA GHCR ルート Dockerfile smoke イメージを 1 つ準備または再利用し、QR package install、ルート Dockerfile/Gateway smoke、installer/update smoke、高速 bundled-plugin Docker E2E を別々のジョブとして実行するため、installer 作業はルートイメージ smoke の後ろで待機しません。

`main` へのプッシュ（マージコミットを含む）はフルパスを強制しません。変更スコープロジックがプッシュでフルカバレッジを要求する場合、ワークフローは高速 Docker smoke を維持し、フル install smoke は夜間またはリリース検証に任せます。

遅い Bun global install image-provider smoke は、`run_bun_global_install_smoke` で別途ゲートされます。夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチはこれを opt in できますが、プルリクエストと `main` へのプッシュでは実行されません。QR と installer Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として一度パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- installer/update/plugin-dependency レーン用の最小 Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` を使用してレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールのスロット数。                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | provider-sensitive tail-pool のスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | provider がスロットリングしないようにする同時ライブレーン上限。                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install レーン上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時 multi-service レーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon の create storm を避けるためのレーン開始間隔。間隔なしにするには `0` を設定。    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。cleanup smoke をスキップし、agent が 1 つの失敗レーンを再現できるようにします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後容量を解放するまで単独で実行されます。ローカル集約は Docker を preflight し、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先の順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジュールを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、必要な package、image kind、live image、lane、credential カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` がそのプランを GitHub outputs とサマリーに変換します。`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行の package artifact をダウンロードするか、`package_artifact_run_id` から package artifact をダウンロードします。tarball inventory を検証し、プランが package-installed レーンを必要とする場合は Blacksmith の Docker layer cache を通じて package-digest-tagged bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドの代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存の package-digest イメージを再利用します。Docker イメージの pull は、1 試行あたり 180 秒の範囲限定タイムアウトで再試行されるため、停止した registry/cache stream が CI クリティカルパスの大半を消費する代わりに、素早く再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を指定した小さなチャンク化ジョブを実行するため、各チャンクは必要な image kind だけを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`、および `bundled-channels-contracts` です。集約 `bundled-channels` チャンクは手動のワンショット再実行用に引き続き利用でき、`plugins-runtime-core`、`plugins-runtime`、および `plugins-integrations` は集約 plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスのままです。`bundled-channels` チャンクは、直列のオールインワン `bundled-channel-deps` レーンではなく、分割された `bundled-channel-*` と `bundled-channel-update-*` レーンを実行します。

OpenWebUI は、完全なリリースパスカバレッジが要求する場合に `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチに限ってスタンドアロンの `openwebui` チャンクを保持します。バンドルチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、およびレーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに、準備済みイメージに対して選択されたレーンを実行します。これにより、失敗したレーンのデバッグを 1 つの対象 Docker ジョブに限定し、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用できます。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行から正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2E ワークフローは、完全なリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、より高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別ワークフローです。通常のプルリクエスト、`main` プッシュ、および単独の手動 CI ディスパッチでは、このスイートはオフのままです。これは、バンドル plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、グループごとに 1 つの Vitest ワーカーとより大きな Node ヒープを使い、一度に最大 2 つの plugin 設定グループを実行するため、インポート負荷の高い plugin バッチが余分な CI ジョブを作成しません。

## QA ラボ

QA ラボには、メインのスマートスコープワークフローの外に専用の CI レーンがあります。

- `Parity gate` ワークフローは、一致する PR 変更と手動ディスパッチで実行されます。プライベート QA ランタイムをビルドし、モック GPT-5.5 と Opus 4.6 のエージェントパックを比較します。
- `QA-Lab - All Lanes` ワークフローは、`main` で毎晩、および手動ディスパッチで実行されます。モックパリティゲート、ライブ Matrix レーン、ライブ Telegram レーンと Discord レーンを並列ジョブとしてファンアウトします。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定論的モックプロバイダーとモック認定モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブトランスポートレーンを実行するため、チャンネル契約はライブモデルのレイテンシと通常の provider-plugin 起動から分離されます。ライブトランスポート Gateway はメモリ検索を無効にします。QA パリティがメモリ動作を別途カバーするためです。プロバイダー接続性は、別のライブモデル、ネイティブプロバイダー、および Docker プロバイダースイートでカバーされます。

Matrix は、スケジュールゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、および `e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA ラボレーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較用に小さなレポートジョブへ両方のアーティファクトをダウンロードします。

変更が実際に QA ランタイム、モデルパックパリティ、またはパリティワークフローが所有するサーフェスに触れる場合を除き、PR ランディングパスを `Parity gate` の背後に置かないでください。通常のチャンネル、設定、ドキュメント、または単体テスト修正では、これを任意のシグナルとして扱い、スコープ付き CI/チェックの証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリスイープではなく、意図的に絞り込まれた初回パスのセキュリティスキャナーです。毎日、手動、および非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript サーフェスを、high/critical の `security-severity` にフィルタリングされた高信頼度のセキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始され、スケジュールされたワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトから外れています。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、および Gateway ベースライン                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加え、チャンネル plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント                      |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、および Plugin SDK SSRF ポリシーサーフェス                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントツール実行ゲート                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、runtime-dependency ステージング、source-loading、および Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー健全性が許容する最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係ビルド結果をアップロード済み SARIF からフィルタリングし、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドがランタイムを支配するため、日次デフォルトの外に保持されています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。これは、より小さな Blacksmith Linux ランナー上で、狭い高価値サーフェスに対し、エラー重大度の非セキュリティ JavaScript/TypeScript 品質クエリのみを実行します。そのプルリクエストガードは、スケジュールされたプロファイルよりも意図的に小さくなっています。非ドラフト PR では、エージェントコマンド/モデル/ツール実行および返信ディスパッチコード、設定スキーマ/マイグレーション/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルおよびバンドルチャンネル plugin ランタイム、Gateway protocol/server-method、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、plugin ローダー、Plugin SDK/package-contract、または Plugin SDK 返信ランタイムの変更に対して、一致する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、および `plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは以下を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway のセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドルされたチャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーのディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、送信配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、送信セッションのバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK の受信返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドのバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーのデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティとは分離されたままにすることで、品質の検出結果をスケジュール、測定、無効化、拡張してもセキュリティシグナルを不明瞭にしない。Swift、Python、バンドル Plugin の CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定してから、スコープ指定またはシャード化されたフォローアップ作業としてのみ戻すべきである。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動型 Codex メンテナンスレーンである。純粋なスケジュールはない。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できる。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップする。実行時には、スキップされていない直前の Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間に 1 回の実行で、前回の docs パス以降に蓄積されたすべての main 変更をカバーできる。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動型 Codex メンテナンスレーンである。純粋なスケジュールはない。`main` への bot 以外の push CI 実行が成功するとトリガーできるが、別のワークフロー実行による呼び出しがその UTC 日にすでに実行済みまたは実行中の場合はスキップする。手動ディスパッチは、その日次アクティビティゲートを迂回する。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせ、その後フルスイートレポートを再実行して、合格ベースラインテスト数を減らす変更を拒否する。ベースラインに失敗テストがある場合、Codex は明らかな失敗だけを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格しなければならない。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行する。競合する古いパッチはスキップされる。Codex アクションが docs agent と同じ drop-sudo の安全姿勢を維持できるよう、GitHub ホストの Ubuntu を使用する。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ向けの手動メンテナーワークフローである。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR をクローズする。GitHub を変更する前に、取り込まれた PR がマージ済みであり、各重複が共有の参照 issue または重複する変更ハンクを持つことを検証する。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行される。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格である。

- コア本番変更は、コア本番とコアテストの typecheck に加えてコア lint/guard を実行する。
- コアのテストのみの変更は、コアテストの typecheck に加えてコア lint のみを実行する。
- extension 本番変更は、extension 本番と extension テストの typecheck に加えて extension lint を実行する。
- extension のテストのみの変更は、extension テストの typecheck に加えて extension lint を実行する。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存しているため、extension typecheck へ拡張される（Vitest extension sweep は明示的なテスト作業のまま）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行する。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンへ送る。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より軽量である。直接のテスト編集はそのテスト自体を実行し、ソース編集は明示的なマッピング、次に兄弟テストとインポートグラフ依存先を優先する。共有グループルーム配信設定は明示的なマッピングの一つである。グループの可視返信設定、ソース返信配信モード、またはメッセージツールのシステムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信リグレッションを通るため、共有デフォルト変更は最初の PR push の前に失敗する。変更がハーネス全体に及ぶほど広範で、安価なマッピング済みセットが信頼できるプロキシではない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用する。

## Testbox 検証

Testbox はリポジトリルートから実行し、広範な証明には新しくウォームアップした box を優先する。再利用された、期限切れになった、または予想外に大きな同期を報告したばかりの box で遅いゲートに時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行する。

sanity check は、`pnpm-lock.yaml` などの必須ルートファイルが消えている場合、または `git status --short` が少なくとも 200 個の追跡済み削除を示す場合に早期失敗する。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味する。製品テスト失敗をデバッグするのではなく、その box を停止して新しいものをウォームアップする。意図的な大量削除 PR では、その sanity run に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定する。

`pnpm testbox:run` は、sync フェーズに 5 分を超えて留まり、同期後の出力がないローカル Blacksmith CLI 呼び出しも終了する。その guard を無効化するには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きなローカル diff にはより大きなミリ秒値を使用する。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
