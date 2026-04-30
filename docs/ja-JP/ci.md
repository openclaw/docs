---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
summary: CI ジョブグラフ、スコープゲート、リリースアンブレラ、ローカルコマンドの同等手段
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-30T09:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` への各 push と各 pull request で実行されます。`preflight` ジョブは差分を分類し、無関係な領域だけが変更された場合は高コストのレーンを無効にします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のために、意図的にスマートなスコープ設定をバイパスし、グラフ全体に展開します。Android レーンは `include_android` を通じてオプトインのままです。リリース専用の Plugin カバレッジは、別の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) から、または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| ジョブ                           | 目的                                                                                         | 実行タイミング                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | docs のみの変更、変更されたスコープ、変更された extensions を検出し、CI マニフェストを構築する | draft 以外の push と PR で常に         |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                   | draft 以外の push と PR で常に         |
| `security-dependency-audit`      | npm advisories に対する、依存関係なしの本番 lockfile 監査                                     | draft 以外の push と PR で常に         |
| `security-fast`                  | 高速なセキュリティジョブの必須集約                                                            | draft 以外の push と PR で常に         |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと未使用ファイル allowlist ガード                               | Node関連の変更                         |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な downstream アーティファクトをビルドする | Node関連の変更                         |
| `checks-fast-core`               | bundled/plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                       | Node関連の変更                         |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化された channel contract チェック                    | Node関連の変更                         |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テストシャード                   | Node関連の変更                         |
| `check`                          | シャード化されたメインのローカルゲート相当: prod types、lint、guards、test types、strict smoke | Node関連の変更                         |
| `check-additional`               | architecture、boundary、extension-surface guards、package-boundary、gateway-watch シャード     | Node関連の変更                         |
| `build-smoke`                    | ビルド済み CLI smoke テストと起動時メモリ smoke                                               | Node関連の変更                         |
| `checks`                         | ビルド済みアーティファクト channel テストの検証                                               | Node関連の変更                         |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                           | リリース用の手動 CI dispatch           |
| `check-docs`                     | docs のフォーマット、lint、broken-link チェック                                               | docs が変更された場合                  |
| `skills-python`                  | Python-backed Skills 用の Ruff + pytest                                                       | Python-skill関連の変更                 |
| `checks-windows`                 | Windows固有の process/path テストと共有 runtime import specifier 回帰                         | Windows関連の変更                      |
| `macos-node`                     | 共有ビルド済みアーティファクトを使う macOS TypeScript テストレーン                            | macOS関連の変更                        |
| `macos-swift`                    | macOS app 用の Swift lint、ビルド、テスト                                                     | macOS関連の変更                        |
| `android`                        | 両方の flavor の Android unit tests と 1 つの debug APK ビルド                                | Android関連の変更                      |
| `test-performance-agent`         | trusted activity 後の日次 Codex slow-test 最適化                                              | Main CI 成功または手動 dispatch        |

## フェイルファスト順序

1. `preflight` は、どのレーンがそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトジョブや platform matrix ジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと重なって実行されるため、共有ビルドの準備ができ次第、downstream consumer が開始できます。
4. その後、より重い platform と runtime のレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しい push が到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗している場合を除き、それは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使うため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後には queue しません。自動 CI の concurrency key は versioned (`CI-v7-*`) なので、古い queue group 内の GitHub 側の zombie が、新しい main 実行を無期限にブロックすることはありません。手動の full-suite 実行は `CI-manual-v1-*` を使い、進行中の実行を cancel しません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests でカバーされています。手動 dispatch は changed-scope 検出をスキップし、preflight マニフェストを、すべての scoped area が変更されたかのように動作させます。

- **CI ワークフロー編集** は Node CI グラフと workflow linting を検証しますが、それだけで Windows、Android、macOS の native build を強制することはありません。これらの platform レーンは platform source の変更にスコープされたままです。
- **CI routing-only edits、選択された安価な core-test fixture 編集、狭い plugin contract helper/test-routing 編集** は、高速 Node-only マニフェストパスを使います: `preflight`、security、単一の `checks-fast-core` タスクです。そのパスは、変更が高速タスクで直接実行される routing surface または helper surface に限定される場合、build artifacts、Node 22 compatibility、channel contracts、full core shards、bundled-plugin shards、additional guard matrices をスキップします。
- **Windows Node チェック** は、Windows固有の process/path wrappers、npm/pnpm/UI runner helpers、package manager config、そのレーンを実行する CI workflow surface にスコープされます。無関係な source、Plugin、install-smoke、test-only の変更は Linux Node レーンに留まります。

最も遅い Node test family は、各ジョブが runner を過剰予約せず小さく保たれるように分割またはバランス調整されています。channel contracts は 3 つの weighted shards として実行され、小さな core unit レーンはペア化され、auto-reply は 4 つの balanced workers として実行されます（reply subtree は agent-runner、dispatch、commands/state-routing shards に分割）。agentic gateway/plugin configs は、built artifacts を待つ代わりに既存の source-only agentic Node jobs 全体に分散されます。広範な browser、QA、media、miscellaneous plugin tests は、共有 plugin catch-all ではなく専用の Vitest config を使います。Include-pattern shards は CI shard name を使って timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch coverage から分離します。boundary guard shard は、小さな独立 guard を 1 つのジョブ内で並行実行します。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別個の source set や manifest はありません。その unit-test レーンは SMS/call-log BuildConfig flags を使って flavor をコンパイルしつつ、Android関連の各 push で重複した debug APK packaging job を避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip version に固定され、`dlx` install のために pnpm の minimum release age が無効化された、本番 Knip dependency-only pass）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番 unused-file findings を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。unused-file guard は、PR が新しい未レビューの unused file を追加した場合、または stale allowlist entry を残した場合に失敗します。一方で、Knip が静的に解決できない意図的な dynamic plugin、generated、build、live-test、package bridge surface は保持します。

## 手動 dispatch

手動 CI dispatch は通常の CI と同じジョブグラフを実行しますが、Android 以外の scoped lane をすべて強制的に有効にします: Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python Skills、Windows、macOS、Control UI i18n です。Standalone の手動 CI dispatch は `include_android=true` の場合にのみ Android を実行します。full release umbrella は `include_android=true` を渡すことで Android を有効にします。Plugin prerelease static checks、リリース専用の `agentic-plugins` shard、full extension batch sweep、plugin prerelease Docker lanes は CI から除外されます。Docker prerelease suite は、`完全リリース検証` が release-validation gate を有効にして別の `Plugin プレリリース` ワークフローを dispatch した場合にのみ実行されます。

手動実行は一意の concurrency group を使うため、release-candidate full suite が同じ ref 上の別の push や PR run によって cancel されることはありません。任意の `target_ref` input により、trusted caller は選択した dispatch ref の workflow file を使いながら、そのグラフを branch、tag、full commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| ランナー                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドル済みチェック、シャード化されたチャンネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約ベリファイア、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使用するため、Blacksmith マトリクスはより早くキューに入れられる |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な Plugin シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル済み Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU の影響を受けやすく、8 vCPU は節約分よりコストが大きかった）。install-smoke Docker ビルド（32-vCPU のキュー時間は節約分よりコストが大きかった）                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。フォークは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。フォークは `macos-latest` にフォールバックする                                                                                                                                                                                                                                                                                                                                                                                                 |

## ローカル相当

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

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動の `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、パッケージ受け入れ、Docker リリースパススイート、ライブ/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。公開済みパッケージ仕様が指定されている場合は、公開後の `NPM Telegram Beta E2E` ワークフローも実行できます。

`release_profile` は、リリースチェックに渡すライブ/プロバイダー範囲を制御します。

- `minimum` は、最速の OpenAI/コアのリリース重要レーンに限定します。
- `stable` は、安定版のプロバイダー/バックエンドセットを追加します。
- `full` は、広範な助言的プロバイダー/メディアマトリクスを実行します。

この包括ワークフローは、ディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再確認し、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、親のベリファイアジョブだけを再実行して、包括結果とタイミングサマリーを更新します。

復旧のために、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子のみには `ci`、すべてのリリース子には `release-checks`、またはより狭いグループとして包括ワークフロー上で `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、焦点を絞った修正後の失敗したリリースボックスの再実行を限定できます。

`OpenClaw Release Checks` は、信頼済みワークフロー参照を使用して、選択された参照を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをライブ/E2E リリースパス Docker ワークフローとパッケージ受け入れシャードの両方に渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再パックすることを避けられます。

## ライブと E2E シャード

リリースのライブ/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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

これにより、同じファイルカバレッジを保ちながら、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の一回限りの再実行でも有効なままです。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` がプリインストールされており、メディアジョブはセットアップ前にバイナリだけを検証します。Docker バックのライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブは、ネストされた Docker テストを起動する場所として適していません。

Docker バックのライブモデル/バックエンドシャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、Gateway、CLI バックエンド、ACP bind、Codex ハーネスシャードは `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドする場合、リリース実行は設定ミスであり、重複するイメージビルドで実行時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」という質問には、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、ユーザーがインストール後または更新後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップサマリーにソース、ワークフロー参照、パッケージ参照、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数のターゲット `docker_lanes` を選択する場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列ターゲット Docker ジョブとして展開します。
3. `package_telegram` は必要に応じて `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` ではない場合に実行され、Package Acceptance が解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチは、公開済み npm 仕様を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みのベータ/安定版の受け入れに使用します。
- `source=ref` は、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離されたワークツリーに依存関係をインストールして、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS の `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトには指定する必要があります。

`workflow_ref` と `package_ref` は分けてください。`workflow_ref` はテストを実行する信頼済みのワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスは古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` に加えて `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブの ClawHub 可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm 仕様パスは単独ディスパッチ用に保持されます。

リリースチェックは、`source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。リリースパス Docker チャンクは、重複するパッケージ/更新/Plugin レーンをカバーします。Package Acceptance は、同じ解決済みパッケージ tarball に対して、アーティファクトネイティブなバンドル済みチャンネル互換性、オフライン Plugin、Telegram の証明を保持します。Cross-OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新のプロダクト検証は Package Acceptance から開始する必要があります。Windows のパッケージ済みレーンとインストーラー fresh レーンは、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドを import できることも検証します。OpenAI cross-OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL`、それ以外は `openai/gpt-5.4-mini` をデフォルトにするため、インストールと Gateway の証明は高速かつ決定的なままです。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに境界付きのレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指してもよい。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップしてもよい。
- `update-channel-switch` は tarball 由来の fake git fixture から欠落している `pnpm.patchedDependencies` を取り除いてもよく、永続化された `update.channel` の欠落をログに出してもよい。
- Plugin smoke はレガシーのインストールレコード場所を読み取ってもよく、マーケットプレイスのインストールレコード永続化の欠落を受け入れてもよい。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許可してもよい。

公開済みの `2026.4.26` パッケージも、すでに出荷済みだったローカルビルドメタデータスタンプファイルについて警告してもよいです。それ以降のパッケージは現代的なコントラクトを満たす必要があります。同じ条件は警告またはスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグするときは、`resolve_package` サマリーから開始し、パッケージのソース、バージョン、SHA-256 を確認してください。次に、`docker_acceptance` 子実行とその Docker アーティファクト（`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド）を調べます。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストール smoke

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。smoke カバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。

- **高速パス** は、Docker/パッケージ面、バンドル済み Plugin パッケージ/マニフェスト変更、または Docker smoke ジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 面に触れる pull request で実行されます。ソースのみのバンドル済み Plugin 変更、テストのみの編集、docs のみの編集は Docker worker を予約しません。高速パスはルート Dockerfile イメージを 1 回ビルドし、CLI を確認し、agents delete shared-workspace CLI smoke を実行し、コンテナ gateway-network e2e を実行し、バンドル済み extension build arg を検証し、240 秒の集約コマンドタイムアウト（各シナリオの Docker run は個別に上限設定）のもとで境界付きのバンドル済み Plugin Docker プロファイルを実行します。
- **フルパス** は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、そしてインストーラー/パッケージ/Docker 面に本当に触れる pull request のために、QR パッケージインストールとインストーラー Docker/更新カバレッジを保持します。フルモードでは、install-smoke は 1 つの target-SHA GHCR ルート Dockerfile smoke イメージを準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway smoke、インストーラー/更新 smoke、高速のバンドル済み Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージ smoke の後ろで待つことはありません。

`main` push（merge commit を含む）はフルパスを強制しません。変更スコープロジックが push でフルカバレッジを要求する場合、ワークフローは高速 Docker smoke を維持し、フル install smoke は夜間またはリリース検証に任せます。

低速な Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別途制御されます。夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチでは opt in できますが、pull request と `main` push では実行されません。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は 1 つの共有ライブテストイメージを事前ビルドし、OpenClaw を npm tarball として 1 回パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- インストーラー/更新/Plugin 依存関係レーン用の素の Node/Git runner。
- 通常の機能レーン用に同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、runner は選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーンのメインプールスロット数。                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダー依存のテールプールスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm インストールレーン上限。                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon の作成集中を避けるためのレーン開始間隔。間隔なしの場合は `0` を設定します。     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` にするとレーンを実行せずにスケジューラープランを出力します。                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。cleanup smoke をスキップし、agent が 1 つの失敗レーンを再現できるようにします。 |

実効上限より重いレーンでも、空のプールからは開始でき、その後 capacity を解放するまで単独で実行されます。ローカル集約は Docker をプリフライトし、古い OpenClaw E2E コンテナを削除し、アクティブレーン状態を出力し、最長優先順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、どのパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後、`scripts/docker-e2e.mjs` がそのプランを GitHub outputs とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` で OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。さらに tarball inventory を検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker layer cache を通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push し、再ビルドの代わりに指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージ pull は、試行ごとに境界付きの 180 秒タイムアウトで再試行されるため、停止した registry/cache stream が CI のクリティカルパスの大部分を消費する代わりに素早く再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは `OPENCLAW_SKIP_DOCKER_BUILD=1` でより小さいチャンクジョブを実行するため、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーで複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

現在のリリース Docker チャンクは `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`、および `bundled-channels-contracts` です。集約 `bundled-channels` チャンクは手動の単発再実行用として引き続き利用でき、`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスとして残ります。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーン向けの集約手動再実行エイリアスとして残ります。`bundled-channels` チャンクは、直列の一体型 `bundled-channel-deps` レーンではなく、分割された `bundled-channel-*` と `bundled-channel-update-*` レーンを実行します。

OpenWebUI は、完全なリリースパスカバレッジが要求されたときは `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチの場合だけ独立した `openwebui` チャンクを保持します。バンドルチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは対象を絞った 1 つの Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用にライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、それらの値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行の正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済みのライブ/E2E ワークフローは、完全なリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、よりコストの高いプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる個別のワークフローです。通常のプルリクエスト、`main` へのプッシュ、単独の手動 CI ディスパッチでは、このスイートは無効のままです。これは、バンドル Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、グループごとに 1 つの Vitest ワーカーとより大きな Node ヒープを使い、最大 2 つの Plugin 設定グループを同時に実行するため、インポートが重い Plugin バッチによって追加の CI ジョブが作成されません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外に専用の CI レーンがあります。

- `Parity gate` ワークフローは、一致する PR 変更と手動ディスパッチで実行されます。これはプライベート QA ランタイムをビルドし、モック GPT-5.5 と Opus 4.6 のエージェントパックを比較します。
- `QA-Lab - All Lanes` ワークフローは、`main` 上で毎晩、および手動ディスパッチで実行されます。モックパリティゲート、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとしてファンアウトします。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram のライブトランスポートレーンを実行するため、チャンネル契約はライブモデルのレイテンシーや通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway は、QA パリティがメモリ動作を別途カバーするため、メモリ検索を無効にします。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートによってカバーされます。

Matrix は、スケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合だけ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、Matrix の完全カバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、小さなレポートジョブに両方のアーティファクトをダウンロードして最終的なパリティ比較を行います。

変更が実際に QA ランタイム、モデルパックパリティ、またはパリティワークフローが所有するサーフェスに触れていない限り、PR ランディングパスを `Parity gate` の背後に置かないでください。通常のチャンネル、設定、ドキュメント、または単体テスト修正では、これを任意のシグナルとして扱い、スコープされた CI/チェック証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、意図的に狭い初回パスのセキュリティスキャナーであり、リポジトリ全体のスイープではありません。日次、手動、非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript サーフェスを、高信頼度のセキュリティクエリでスキャンし、高/重大の `security-severity` に絞り込みます。

プルリクエストガードは軽量なままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更に対してのみ開始し、スケジュール済みワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android と macOS の CodeQL は PR デフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、cron、gateway ベースライン                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約に加え、チャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント                 |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、ランタイム依存関係ステージング、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール済みの Android セキュリティシャード。ワークフロー健全性で許可される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、依存関係のビルド結果をアップロードされる SARIF から除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置いています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。小さめの Blacksmith Linux ランナー上で、狭く高価値なサーフェスに対して、エラー重要度の非セキュリティ JavaScript/TypeScript 品質クエリだけを実行します。そのプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルとバンドルチャンネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK グルー、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージ契約、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime` シャードだけを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは以下を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを分離して実行するための学習/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルとバンドルされたチャンネル Plugin 実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーのディスパッチ、自動返信のディスパッチとキュー、ACP コントロールプレーンのランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK のインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログの正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダー既定値/カタログ、Web/検索/フェッチ/埋め込みレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンのランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア Web フェッチ/検索、メディア IO、メディア理解、画像生成、メディア生成のランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティと分離されたままなので、品質の検出事項はセキュリティシグナルを不明瞭にすることなく、スケジュール、測定、無効化、拡張できる。Swift、Python、バンドル plugin の CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定してから、スコープ化またはシャーディングされたフォローアップ作業としてのみ追加し直すべきである。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更と既存ドキュメントの整合性を保つための、イベント駆動の Codex メンテナンスレーンである。純粋なスケジュールはない。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できる。ワークフロー実行の呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップする。実行時には、前回スキップされなかった Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に main に蓄積されたすべての変更をカバーできる。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動の Codex メンテナンスレーンである。純粋なスケジュールはない。`main` への bot 以外の push CI 実行が成功するとトリガーできるが、別のワークフロー実行呼び出しがその UTC 日にすでに実行済みまたは実行中の場合はスキップする。手動ディスパッチは、その日次アクティビティゲートをバイパスする。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなく、カバレッジを維持する小さなテスト性能修正のみを行わせる。その後、フルスイートレポートを再実行し、合格ベースラインのテスト数を減らす変更を拒否する。ベースラインに失敗しているテストがある場合、Codex は明らかな失敗のみを修正でき、agent 後のフルスイートレポートはコミット前に合格している必要がある。bot push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行する。競合する古いパッチはスキップされる。GitHub ホストの Ubuntu を使用するため、Codex action は docs agent と同じ drop-sudo セーフティ姿勢を維持できる。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローである。既定では dry-run で、`apply=true` の場合に明示的に一覧指定された PR のみをクローズする。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複 PR に共有された参照 issue または重複する変更ハンクのどちらかがあることを検証する。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行される。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格である。

- コア本番変更は、コア prod とコア test の typecheck に加えてコア lint/guard を実行する。
- コア test のみの変更は、コア test typecheck に加えてコア lint のみを実行する。
- extension 本番変更は、extension prod と extension test の typecheck に加えて extension lint を実行する。
- extension test のみの変更は、extension test typecheck に加えて extension lint を実行する。
- 公開 Plugin SDK または plugin-contract の変更は、extension がそれらのコアコントラクトに依存するため extension typecheck に拡張される（Vitest extension sweep は明示的なテスト作業のまま）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/root 依存関係チェックを実行する。
- 未知の root/設定変更は、安全側に倒してすべてのチェックレーンを対象にする。

ローカルの changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストになっている。直接のテスト編集はそのテスト自身を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストとインポートグラフ依存先を使う。共有 group-room 配信設定は明示的なマッピングの 1 つである。group visible-reply 設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を経由するため、共有の既定値変更は最初の PR push 前に失敗する。変更がハーネス全体に及ぶほど広く、低コストのマッピング済みセットを信頼できる代理として扱えない場合のみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用する。

## Testbox 検証

Testbox はリポジトリルートから実行し、広範な証明には新しくウォームアップした box を優先する。再利用済み、期限切れ、または予想外に大きな同期を報告した box で遅いゲートに時間を使う前に、まず box 内で `pnpm testbox:sanity` を実行する。

sanity check は、`pnpm-lock.yaml` などの必須 root ファイルが消えている場合、または `git status --short` が少なくとも 200 件の追跡済み削除を示す場合に高速に失敗する。通常これは、リモート同期状態が PR の信頼できるコピーではないことを意味する。製品テストの失敗をデバッグするのではなく、その box を停止して新しいものをウォームアップする。意図的な大規模削除 PR では、その sanity run に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定する。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了する。そのガードを無効化するには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル差分にはより大きなミリ秒値を使用する。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
