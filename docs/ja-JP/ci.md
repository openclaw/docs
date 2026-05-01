---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を把握する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
summary: CI ジョブグラフ、スコープゲート、リリース包括項目、およびローカルコマンド相当
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-01T05:00:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのすべての push とすべての pull request で実行されます。`preflight` ジョブは diff を分類し、関係のない領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行は意図的にスマートスコープをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` によるオプトインのままです。リリース専用の Plugin カバレッジは別の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                           | 目的                                                                                         | 実行タイミング                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更されたスコープ、変更された extensions を検出し、CI マニフェストを構築する | draft でない push と PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                   | draft でない push と PR では常に |
| `security-dependency-audit`      | npm advisories に対する、依存関係なしの本番 lockfile 監査                                      | draft でない push と PR では常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                              | draft でない push と PR では常に |
| `check-dependencies`             | 本番 Knip 依存関係のみのパスと未使用ファイル許可リストガード                                  | Node 関連の変更                   |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルド | Node 関連の変更                   |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                        | Node 関連の変更                   |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を伴う、シャード化されたチャンネル契約チェック                       | Node 関連の変更                   |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テストシャード                   | Node 関連の変更                   |
| `check`                          | シャード化されたメインのローカルゲート相当: 本番型、lint、ガード、テスト型、厳格な smoke      | Node 関連の変更                   |
| `check-additional`               | アーキテクチャ、境界、extension サーフェスガード、package-boundary、gateway-watch シャード     | Node 関連の変更                   |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動メモリ smoke                                                  | Node 関連の変更                   |
| `checks`                         | ビルド済みアーティファクトのチャンネルテスト用検証                                            | Node 関連の変更                   |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                           | リリース用の手動 CI ディスパッチ  |
| `check-docs`                     | docs のフォーマット、lint、リンク切れチェック                                                 | docs が変更された場合             |
| `skills-python`                  | Python バックの Skills 向け Ruff + pytest                                                     | Python skill 関連の変更           |
| `checks-windows`                 | Windows 固有の process/path テストと共有ランタイム import specifier 回帰                      | Windows 関連の変更                |
| `macos-node`                     | 共有ビルド済みアーティファクトを使う macOS TypeScript テストレーン                            | macOS 関連の変更                  |
| `macos-swift`                    | macOS アプリ向け Swift lint、ビルド、テスト                                                    | macOS 関連の変更                  |
| `android`                        | 両方の flavor の Android unit test と 1 つの debug APK ビルド                                  | Android 関連の変更                |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                        | main CI 成功または手動ディスパッチ |

## フェイルファスト順序

1. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトとプラットフォームのマトリックスジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームとランタイムのレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が入ると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱います。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にはキューに入りません。自動 CI concurrency key はバージョン付き (`CI-v7-*`) なので、古いキューグループに残った GitHub 側のゾンビが新しい main 実行を無期限にブロックすることはありません。手動フルスイート実行は `CI-manual-v1-*` を使い、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動ディスパッチは changed-scope 検出をスキップし、すべてのスコープ領域が変更されたかのように preflight マニフェストを動作させます。

- **CI workflow edits** は Node CI グラフとワークフロー lint を検証しますが、それ自体では Windows、Android、macOS のネイティブビルドを強制しません。これらのプラットフォームレーンはプラットフォームソース変更にスコープされたままです。
- **CI routing-only edits, selected cheap core-test fixture edits, and narrow plugin contract helper/test-routing edits** は、高速な Node のみのマニフェストパスを使います: `preflight`、security、単一の `checks-fast-core` タスクです。このパスは、変更がその高速タスクで直接実行されるルーティングまたは helper サーフェスに限定される場合、ビルドアーティファクト、Node 22 互換性、チャンネル契約、完全な core シャード、bundled-plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node checks** は、Windows 固有の process/path wrapper、npm/pnpm/UI runner helper、package manager config、そのレーンを実行する CI workflow サーフェスにスコープされます。無関係なソース、Plugin、install-smoke、test-only の変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブが小さく保たれ、runner を過剰に確保しないように分割またはバランス調整されています。チャンネル契約は 3 つの重み付きシャードとして実行され、小さな core unit レーンはペア化され、auto-reply は 4 つのバランスされた worker として実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。agentic gateway/plugin config は、ビルド済みアーティファクトを待つ代わりに、既存の source-only agentic Node ジョブ全体に分散されます。広範な browser、QA、media、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使います。include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は config 全体とフィルター済みシャードを区別できます。`check-additional` は package-boundary の compile/canary 作業をまとめ、runtime topology アーキテクチャを gateway watch カバレッジから分離します。boundary guard シャードは、小さな独立ガードを 1 つのジョブ内で並行実行します。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には個別の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig フラグ付きで flavor を引き続きコンパイルしつつ、Android 関連の各 push で重複した debug APK packaging ジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定された本番 Knip 依存関係のみのパスで、`dlx` install では pnpm の minimum release age を無効化）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、意図的な動的 Plugin、生成物、ビルド、live-test、package bridge サーフェスなど Knip が静的に解決できないものを保持しながら、PR が新しい未レビューの未使用ファイルを追加した場合や古い許可リストエントリを残した場合に失敗します。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的に有効にします: Linux Node シャード、bundled-plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、build smoke、docs チェック、Python Skills、Windows、macOS、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは `include_android=true` の場合にのみ Android を実行します。フルリリースの umbrella は `include_android=true` を渡して Android を有効にします。Plugin prerelease static チェック、リリース専用の `agentic-plugins` シャード、完全な extension batch sweep、Plugin prerelease Docker レーンは CI から除外されます。Docker prerelease スイートは、`Full Release Validation` が release-validation gate を有効にして別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency group を使うため、リリース候補のフルスイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼済みの呼び出し元は、選択された dispatch ref のワークフローファイルを使いながら、ブランチ、タグ、または完全な commit SHA に対してそのグラフを実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/同梱チェック、シャード化されたチャンネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約ベリファイア、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke の preflight も GitHub ホストの Ubuntu を使うため、Blacksmith マトリックスはより早くキューに入れられる |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な Plugin シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、同梱 Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（8 vCPU は節約できた分よりもコストが大きいほど CPU 依存が強い）。install-smoke Docker ビルド（32-vCPU は節約できた分よりもキュー時間のコストが大きい）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。フォークでは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。フォークでは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、その対象で手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明用に `Plugin Prerelease` をディスパッチし、インストールスモーク、パッケージ受け入れ、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチします。公開済みパッケージ仕様が指定された場合は、公開後の `NPM Telegram Beta E2E` ワークフローも実行できます。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、成果物、
および絞り込んだ再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)
を参照してください。

`release_profile` は、リリースチェックに渡される live/provider の範囲を制御します。
手動リリースワークフローのデフォルトは `stable` です。広範な勧告用 provider/media マトリックスを
意図的に実行したい場合にのみ `full` を使ってください。

- `minimum` は最速の OpenAI/core リリース重要レーンに絞ります。
- `stable` は安定版 provider/backend セットを追加します。
- `full` は広範な勧告用 provider/media マトリックスを実行します。

包括ワークフローはディスパッチした子 run ID を記録し、最後の `Verify full validation` ジョブが現在の子 run の結論を再チェックし、各子 run の最も遅いジョブの表を追記します。子ワークフローを再実行して green になった場合は、包括結果とタイミング要約を更新するため、親のベリファイアジョブだけを再実行してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け取ります。リリース候補には `all`、通常の完全 CI 子だけには `ci`、Plugin prerelease 子だけには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはより狭いグループとして、包括ワークフロー上で `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使います。これにより、絞り込んだ修正後に、失敗したリリースボックスの再実行範囲を限定できます。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使って選択された ref を一度だけ `release-package-under-test` tarball に解決し、その成果物を live/E2E リリースパス Docker ワークフローとパッケージ受け入れシャードの両方に渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、複数の子ジョブで同じ候補を再パッケージすることを避けられます。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` run は、
古い包括ワークフローを置き換えます。親モニターは親がキャンセルされたとき、すでに
ディスパッチ済みの子ワークフローをすべてキャンセルするため、新しい main 検証が
古い 2 時間の release-check run の後ろで待機することはありません。リリースブランチ/タグの
検証と絞り込んだ再実行グループでは `cancel-in-progress: false` を維持します。

## Live と E2E シャード

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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
- 分割されたメディア audio/video シャードと provider でフィルタされた music シャード

これにより、同じファイルカバレッジを維持しながら、遅い live provider の失敗を再実行して診断しやすくなります。集約 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` のシャード名は、手動の一括再実行でも引き続き有効です。

ネイティブ live media シャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。media ジョブはセットアップ前にバイナリを検証するだけです。Docker ベースの live スイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストされた Docker テストを起動する場所として適していません。

Docker ベースの live model/backend シャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使います。live リリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker live model、provider シャード化 Gateway、CLI backend、ACP bind、Codex harness シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードは、スタックしたコンテナやクリーンアップ経路がリリースチェック予算全体を消費せずに速く失敗するよう、ワークフロージョブタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限を持ちます。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドする場合、そのリリース run は設定ミスであり、重複イメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として機能するか」という問いには、`Package Acceptance` を使います。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E harness を通じて単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じて package-digest Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数の対象 `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとしてファンアウトします。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker acceptance、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済み beta/stable acceptance にこれを使用します。
- `source=ref` は信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw ブランチ/タグをフェッチし、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、デタッチされたワークツリーで依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておきます。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブの ClawHub 可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec パスはスタンドアロンディスパッチ用に保持されます。

リリースチェックは、`source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。リリースパス Docker チャンクは、重複する package/update/plugin レーンをカバーします。Package Acceptance は、同じ解決済みパッケージ tarball に対して、アーティファクトネイティブな bundled-channel 互換性、オフライン Plugin、Telegram の証明を保持します。Cross-OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。package/update のプロダクト検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、1 回の実行につき 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択します。既定値は `openclaw@latest` です。失敗レーンの再実行コマンドはそのベースラインを保持します。ローカル実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を `openclaw@2026.4.15` のような正確なパッケージに設定できます。公開済みレーンは、焼き込み済みの `openclaw config set` コマンドレシピでベースラインを構成し、その後レシピ手順を `summary.json` に記録します。より広範な以前のバージョンのカバレッジでは、正確な `published_upgrade_survivor_baseline` 値ごとに Package Acceptance をシャードするべきです。Windows の packaged レーンと installer fresh レーンは、インストール済みパッケージが raw の絶対 Windows パスから browser-control override をインポートできることも検証します。OpenAI cross-OS agent-turn smoke は、`OPENCLAW_CROSS_OS_OPENAI_MODEL` が設定されている場合はそれを既定で使用し、それ以外の場合は `openai/gpt-5.4-mini` を使用するため、インストールと Gateway の証明は高速かつ決定的なままです。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに範囲を限定したレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` の既知の private QA エントリは、tarball から省略されたファイルを指している場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来の fake git fixture から欠落している `pnpm.patchedDependencies` を刈り込む場合があり、永続化された `update.channel` の欠落をログ出力する場合があります。
- Plugin smoke はレガシーの install-record 場所を読む場合があり、または marketplace install-record 永続化の欠落を許容する場合があります。
- `plugin-update` は、install record と no-reinstall 動作が変わらないことを引き続き要求しつつ、config メタデータ移行を許容する場合があります。

公開済みの `2026.4.26` パッケージでは、すでに出荷済みだったローカルビルドメタデータスタンプファイルについても警告する場合があります。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は、警告またはスキップではなく失敗になります。

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

失敗した package acceptance 実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/package サーフェス、バンドル済み Plugin package/manifest の変更、または Docker smoke ジョブが実行する core plugin/channel/gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、docs のみの編集は Docker worker を予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete shared-workspace CLI smoke を実行し、container gateway-network e2e を実行し、バンドル済み拡張機能の build arg を検証し、240 秒の集約コマンドタイムアウト内で範囲限定の bundled-plugin Docker プロファイルを実行します（各シナリオの Docker 実行は別個に上限設定されます）。
- **フルパス** は、nightly scheduled 実行、手動ディスパッチ、workflow-call リリースチェック、および installer/package/Docker サーフェスに実際に触れるプルリクエスト向けに、QR package install と installer Docker/update カバレッジを保持します。full モードでは、install-smoke は 1 つの target-SHA GHCR ルート Dockerfile smoke イメージを準備または再利用し、その後 QR package install、ルート Dockerfile/Gateway smoke、installer/update smoke、高速 bundled-plugin Docker E2E を別々のジョブとして実行するため、installer 作業がルートイメージ smoke の後ろで待つことはありません。

`main` push（マージコミットを含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合でも、ワークフローは高速 Docker smoke を維持し、フル install smoke は nightly またはリリース検証に任せます。

低速な Bun global install image-provider smoke は、`run_bun_global_install_smoke` によって別個にゲートされます。これは nightly schedule とリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは opt in できますが、プルリクエストと `main` push では実行されません。QR と installer Docker テストは、それぞれ独自のインストール向け Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、1 つの共有 live-test イメージを事前ビルドし、OpenClaw を npm tarball として一度パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- installer/update/plugin-dependency レーン用の素の Node/Git runner。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする functional イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | 既定値  | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | provider-sensitive tail-pool スロット数。                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | provider がスロットリングしないようにする同時 live レーン上限。                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | 同時 npm install レーン上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時 multi-service レーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon create storm を避けるためのレーン開始間隔。stagger なしにするには `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定  | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定  | カンマ区切りの正確なレーンリスト。agents が 1 つの失敗レーンを再現できるよう cleanup smoke をスキップします。 |

有効な上限より重いレーンでも、空のプールからなら開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブなレーンの状態を出力し、最長優先の順序付けのためにレーンのタイミングを永続化し、既定では最初の失敗後に新しいプール済みレーンのスケジュールを停止します。

### 再利用可能なライブ/E2Eワークフロー

再利用可能なライブ/E2Eワークフローは、どのパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後、`scripts/docker-e2e.mjs` がその計画を GitHub の出力とサマリーに変換します。これは、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパッケージ化するか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。さらに、tarball のインベントリを検証し、計画がパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェスト付きタグの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドの代わりに指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに上限付きの 180 秒タイムアウトで再試行されるため、停止した registry/cache ストリームが CI のクリティカルパスの大半を消費する代わりにすばやく再試行されます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使ってより小さなチャンク化されたジョブを実行するため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`、`bundled-channels-contracts` です。集約 `bundled-channels` チャンクは手動の単発再実行用として引き続き利用でき、`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` も集約 Plugin/runtime エイリアスとして残ります。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスとして残ります。`bundled-channels` チャンクは、直列の一体型 `bundled-channel-deps` レーンではなく、分割された `bundled-channel-*` および `bundled-channel-update-*` レーンを実行します。

OpenWebUI は、完全なリリースパスカバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみの dispatch 向けにだけ単独の `openwebui` チャンクを保持します。バンドル済みチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラ計画 JSON、低速レーンの表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに選択されたレーンを準備済みイメージに対して実行します。これにより、失敗したレーンのデバッグは対象を絞った 1 つの Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行のためにライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2Eワークフローは、完全なリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによって dispatch される別ワークフローです。通常の pull request、`main` push、単独の手動 CI dispatch では、このスイートは無効のままです。これは、バンドル済み Plugin テストを 8 つの extension ワーカーに分散します。これらの extension shard ジョブは、グループごとに 1 つの Vitest ワーカーとより大きな Node heap を使い、同時に最大 2 つの Plugin config グループを実行するため、import の重い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1 から 3 分のジョブのために多数の runner を予約しないよう、対象 Docker レーンを小さなグループでバッチ化します。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外に専用の CI レーンがあります。

- `Parity gate` ワークフローは、一致する PR 変更と手動 dispatch で実行されます。プライベート QA runtime をビルドし、mock GPT-5.5 と Opus 4.6 の agentic pack を比較します。
- `QA-Lab - All Lanes` ワークフローは、`main` で毎晩および手動 dispatch で実行されます。mock parity gate、live Matrix レーン、live Telegram および Discord レーンを並列ジョブとしてファンアウトします。live ジョブは `qa-live-shared` environment を使用し、Telegram/Discord は Convex lease を使用します。

リリースチェックは、決定的な mock provider と mock-qualified model（`mock-openai/gpt-5.5` および `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram の live transport レーンを実行するため、チャンネル契約は live model のレイテンシや通常の provider-plugin startup から分離されます。live transport gateway は memory search を無効化します。QA parity が memory behavior を別途カバーしているためです。provider connectivity は、別個の live model、native provider、Docker provider の各スイートでカバーされます。

Matrix はスケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI の既定値と手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` dispatch は、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブに shard します。

`OpenClaw Release Checks` は、リリース承認前にリリースで重要な QA Lab レーンも実行します。その QA parity gate は候補 pack と baseline pack を並列レーンジョブとして実行し、その後、最終的な parity 比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。

変更が実際に QA runtime、model-pack parity、または parity ワークフローが所有する surface に触れる場合を除き、PR の landing path を `Parity gate` の背後に置かないでください。通常のチャンネル、config、docs、または unit-test 修正では、これは任意のシグナルとして扱い、スコープされた CI/check evidence に従ってください。

## CodeQL

`CodeQL` ワークフローは意図的に狭い初回パスのセキュリティスキャナーであり、リポジトリ全体の sweep ではありません。毎日、手動、非 draft pull request の guard 実行では、Actions workflow code に加え、最もリスクの高い JavaScript/TypeScript surface を、高/critical の `security-severity` に絞った高信頼度のセキュリティクエリでスキャンします。

pull request guard は軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始され、スケジュールワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR 既定値には含まれません。

### セキュリティカテゴリ

| カテゴリ                                          | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth、secrets、sandbox、cron、gateway baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts に加え、channel Plugin runtime、gateway、Plugin SDK、secrets、audit touchpoints                 |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF、IP parsing、network guard、web-fetch、Plugin SDK SSRF policy surfaces                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers、process execution helpers、outbound delivery、agent tool-execution gates                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install、loader、manifest、registry、runtime-dependency staging、source-loading、Plugin SDK package contract trust surfaces |

### プラットフォーム固有のセキュリティ shard

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティ shard。workflow sanity が受け入れる最小の Blacksmith Linux runner 上で、CodeQL 用に Android app を手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティ shard。Blacksmith macOS 上で CodeQL 用に macOS app を手動でビルドし、アップロードされる SARIF から依存関係のビルド結果を除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS build が runtime を支配するため、日次の既定値の外に置かれています。

### Critical Quality カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティ shard です。これは、より小さな Blacksmith Linux runner 上で、狭い高価値 surface に対して error-severity の非セキュリティ JavaScript/TypeScript quality query だけを実行します。その pull request guard はスケジュールプロファイルより意図的に小さくなっています。非 draft PR は、agent command/model/tool execution と reply dispatch code、config schema/migration/IO code、auth/secrets/sandbox/security code、core channel とバンドル済み channel Plugin runtime、gateway protocol/server-method、memory runtime/SDK glue、MCP/process/outbound delivery、provider runtime/model catalog、session diagnostics/delivery queues、Plugin loader、Plugin SDK/package-contract、または Plugin SDK reply runtime の変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` shard のみを実行します。CodeQL config と quality workflow の変更は、12 個すべての PR quality shard を実行します。

手動 dispatch は次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの quality shard を単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、cron、Gateway のセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル Plugin 実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質をセキュリティから分離しておくことで、品質の検出結果を、セキュリティシグナルを不明瞭にせずにスケジュール、測定、無効化、拡張できます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定してから、スコープ化またはシャーディングされたフォローアップ作業としてのみ追加し直すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更と既存ドキュメントの整合性を保つための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーされ、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップされます。実行時には、前回スキップされなかった Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーされますが、その UTC 日に別のワークフロー実行呼び出しがすでに実行済みまたは実行中の場合はスキップされます。手動ディスパッチは、その日次アクティビティゲートを迂回します。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明白な失敗のみ修正でき、エージェント後のフルスイートレポートはコミット前に合格しなければなりません。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して、push を再試行します。競合する古いパッチはスキップされます。Docs Agent と同じ drop-sudo 安全姿勢を Codex アクションが維持できるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合に明示的に列挙された PR のみを閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであり、各重複に共有された参照 Issue または重複する変更 hunk があることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカル変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加えてコア lint/guard を実行します。
- コアのテストのみの変更は、コアテストの型チェックに加えてコア lint のみを実行します。
- 拡張機能本番変更は、拡張機能本番と拡張機能テストの型チェックに加えて拡張機能 lint を実行します。
- 拡張機能のテストのみの変更は、拡張機能テストの型チェックに加えて拡張機能 lint を実行します。
- 公開 Plugin SDK または Plugin コントラクトの変更は、拡張機能がそれらのコアコントラクトに依存するため、拡張機能の型チェックまで拡張されます（Vitest 拡張機能スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンを実行します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集はそれ自体を実行し、ソース編集は明示的なマッピングを優先し、その後に sibling テストと import-graph 依存先を使います。共有グループルーム配信設定は、明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、またはメッセージツールシステムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR push の前に失敗します。安価なマッピング済みセットが信頼できるプロキシにならないほど変更がハーネス全体に及ぶ場合のみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Testbox はリポジトリルートから実行し、広範な証明には新しく warmed した box を優先してください。再利用された、期限切れになった、または予想外に大きな同期を報告したばかりの box で遅いゲートに時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行してください。

sanity check は、`pnpm-lock.yaml` などの必須ルートファイルが消えている場合、または `git status --short` が 200 件以上の tracked deletion を示す場合に即座に失敗します。これは通常、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、その box を停止して新しいものを warm してください。意図的な大規模削除 PR の場合は、その sanity 実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

`pnpm testbox:run` は、同期後出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。その guard を無効化するには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定するか、通常より大きなローカル差分にはより大きいミリ秒値を使用してください。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャネル](/ja-JP/install/development-channels)
