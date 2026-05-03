---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要があります
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しています
summary: CI ジョブグラフ、スコープゲート、リリース包括項目、ローカルコマンドの同等物
title: CI パイプライン
x-i18n:
    generated_at: "2026-05-03T21:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は、`main` へのすべてのプッシュとすべてのプルリクエストで実行されます。`preflight` ジョブは diff を分類し、無関係な領域だけが変更された場合は高コストなレーンをオフにします。手動の `workflow_dispatch` 実行は、意図的にスマートスコープをバイパスし、リリース候補と広範な検証のためにグラフ全体へ展開します。Android レーンは `include_android` を通じたオプトインのままです。リリース専用の Plugin カバレッジは別の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`完全リリース検証`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                              | 目的                                                                                                   | 実行タイミング                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions を検出し、CI マニフェストをビルドする                   | 非ドラフトのプッシュと PR では常に |
| `security-scm-fast`              | `zizmor` による秘密鍵検出とワークフロー監査                                                     | 非ドラフトのプッシュと PR では常に |
| `security-dependency-audit`      | npm アドバイザリに対する、依存関係不要の本番 lockfile 監査                                          | 非ドラフトのプッシュと PR では常に |
| `security-fast`                  | 高速セキュリティジョブの必須集約                                                             | 非ドラフトのプッシュと PR では常に |
| `check-dependencies`             | 本番 Knip の依存関係のみのパスと未使用ファイル許可リストガード                                 | Node 関連の変更              |
| `build-artifacts`                | `dist/`、Control UI、ビルド済みアーティファクトチェック、再利用可能な下流アーティファクトをビルドする                       | Node 関連の変更              |
| `checks-fast-core`               | バンドル/Plugin 契約/プロトコルチェックなどの高速 Linux 正当性レーン                              | Node 関連の変更              |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、シャード化されたチャンネル契約チェック                                      | Node 関連の変更              |
| `checks-node-core-test`          | チャンネル、バンドル、契約、extension レーンを除く Core Node テストシャード                          | Node 関連の変更              |
| `check`                          | シャード化されたメインのローカルゲート相当: 本番型、lint、ガード、テスト型、厳格なスモーク                | Node 関連の変更              |
| `check-additional`               | アーキテクチャ、シャード化された境界/プロンプトドリフト、extension ガード、パッケージ境界、Gateway watch        | Node 関連の変更              |
| `build-smoke`                    | ビルド済み CLI スモークテストと起動時メモリスモーク                                                            | Node 関連の変更              |
| `checks`                         | ビルド済みアーティファクトのチャンネルテスト用検証器                                                                 | Node 関連の変更              |
| `checks-node-compat-node22`      | Node 22 互換性ビルドとスモークレーン                                                                | リリース用の手動 CI ディスパッチ    |
| `check-docs`                     | docs のフォーマット、lint、壊れたリンクのチェック                                                             | docs が変更された場合                       |
| `skills-python`                  | Python ベースの Skills 向け Ruff + pytest                                                                    | Python Skill 関連の変更      |
| `checks-windows`                 | Windows 固有のプロセス/パステストと共有ランタイム import 指定子のリグレッション                      | Windows 関連の変更           |
| `macos-node`                     | 共有ビルド済みアーティファクトを使う macOS TypeScript テストレーン                                               | macOS 関連の変更             |
| `macos-swift`                    | macOS アプリの Swift lint、ビルド、テスト                                                            | macOS 関連の変更             |
| `android`                        | 両方のフレーバーの Android ユニットテストと 1 つのデバッグ APK ビルド                                              | Android 関連の変更           |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                                 | メイン CI 成功時または手動ディスパッチ |
| `openclaw-performance`           | mock-provider、deep-profile、GPT 5.4 ライブレーンを含む、日次/オンデマンドの Kova ランタイム性能レポート | スケジュールおよび手動ディスパッチ      |

## Fail-fast の順序

1. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重いアーティファクトジョブやプラットフォームマトリックスジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと重なるため、共有ビルドの準備ができ次第、下流の利用側が開始できます。
4. その後、より重いプラットフォームおよびランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

同じ PR または `main` ref に新しいプッシュが到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗していない限り、これは CI ノイズとして扱ってください。集約シャードチェックは `!cancelled() && always()` を使用するため、通常のシャード失敗は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後にキューへ入ることはありません。自動 CI の並行実行キーはバージョン付き (`CI-v7-*`) なので、古いキューグループ内の GitHub 側ゾンビが新しい main 実行を無期限にブロックすることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチは changed-scope 検出をスキップし、preflight マニフェストがすべてのスコープ領域が変更されたかのように振る舞うようにします。

- **CI ワークフロー編集**は Node CI グラフとワークフロー lint を検証しますが、それ自体では Windows、Android、macOS のネイティブビルドを強制しません。これらのプラットフォームレーンは、プラットフォームソース変更にスコープされたままです。
- **CI ルーティングのみの編集、選択された低コストな core-test fixture 編集、狭い Plugin 契約ヘルパー/テストルーティング編集**は、高速な Node のみのマニフェストパスを使用します: `preflight`、security、単一の `checks-fast-core` タスクです。このパスは、変更が高速タスクで直接実行されるルーティングまたはヘルパー表面に限定されている場合、ビルドアーティファクト、Node 22 互換性、チャンネル契約、フル core シャード、バンドル Plugin シャード、追加ガードマトリックスをスキップします。
- **Windows Node チェック**は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、そのレーンを実行する CI ワークフロー表面にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンにとどまります。

最も遅い Node テストファミリーは、各ジョブがランナーを過剰予約せず小さく保たれるよう分割またはバランスされています。チャンネル契約は 3 つの重み付きシャードとして実行され、core unit fast/support レーンは個別に実行され、core runtime infra は state と process/config シャードに分割され、auto-reply はバランスされた worker として実行されます（reply サブツリーは agent-runner、dispatch、commands/state-routing シャードに分割）。また、agentic gateway/server 設定は、ビルド済みアーティファクトを待つ代わりに chat/auth/model/http-plugin/runtime/startup レーンへ分割されます。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest 設定を使用します。include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、ランタイムトポロジーアーキテクチャを Gateway watch カバレッジから分離します。境界ガードリストは 4 つのマトリックスシャードに分割され、各シャードは選択された独立ガードを並行実行してチェックごとのタイミングを出力します。これには `pnpm prompt:snapshots:check` も含まれるため、Codex ランタイムの正常系プロンプトドリフトは、それを発生させた PR に固定されます。Gateway watch、チャンネルテスト、core support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには個別の source set や manifest はありません。そのユニットテストレーンは SMS/call-log BuildConfig フラグ付きでフレーバーをコンパイルしますが、Android 関連の各プッシュで重複した debug APK パッケージングジョブを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（最新の Knip バージョンに固定され、`dlx` インストール用に pnpm の最小リリース経過時間を無効化した、本番 Knip の依存関係のみのパス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合や、古い許可リストエントリを残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な動的 Plugin、生成物、ビルド、ライブテスト、パッケージブリッジの表面は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティから ClawSweeper へのターゲット側ブリッジです。信頼できないプルリクエストコードをチェックアウトしたり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` へディスパッチします。

このワークフローには 4 つのレーンがあります。

- 正確な issue とプルリクエストレビューリクエスト用の `clawsweeper_item`;
- issue コメント内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` プッシュ上のコミットレベルレビューリクエスト用の `clawsweeper_commit_review`;
- ClawSweeper エージェントが検査する可能性のある一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します: イベントタイプ、アクション、アクター、リポジトリ、項目番号、URL、タイトル、状態、存在する場合はコメントまたはレビューの短い抜粋です。Webhook 本文全体を転送することは意図的に避けています。`openclaw/clawsweeper` の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway hook に投稿します。

一般アクティビティは観測であり、デフォルト配送ではありません。ClawSweeper エージェントはプロンプト内で Discord ターゲットを受け取り、そのイベントが意外、対応可能、リスクがある、または運用上有用な場合にのみ `#clawsweeper` へ投稿するべきです。通常の open、編集、bot の変動、重複 Webhook ノイズ、通常のレビュー流量では `NO_REPLY` になるべきです。

この経路全体で、GitHub のタイトル、コメント、本文、レビュー文、ブランチ名、コミットメッセージを信頼できないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ付きレーンをすべて強制的に有効にします: Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n。スタンドアロンの手動 CI ディスパッチは `include_android=true` を指定した場合にのみ Android を実行します。フルリリースの包括ワークフローは `include_android=true` を渡して Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、全 Plugin 一括スイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の同時実行グループを使用するため、リリース候補のフルスイートが同じ ref 上の別の push または PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使いながら、そのグラフをブランチ、タグ、または完全なコミット SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ランナー

| ランナー                         | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速セキュリティジョブと集約（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、高速プロトコル/契約/バンドル済みチェック、シャーディングされたチャネル契約チェック、lint を除く `check` シャード、`check-additional` シャードと集約、Node テスト集約検証、ドキュメントチェック、Python Skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub ホストの Ubuntu を使用し、Blacksmith マトリクスがより早くキューに入れるようにします |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、軽量な Plugin シャード、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node テストシャード、バンドル済み Plugin テストシャード、`android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`（CPU 依存が十分に大きく、8 vCPU では節約分よりコストのほうが大きかった）。install-smoke Docker ビルド（32 vCPU のキュー時間は節約分よりコストのほうが大きかった）                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` では `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` では `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` は製品/ランタイム性能ワークフローです。`main` で毎日実行され、手動でもディスパッチできます:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグや別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開レポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` にはテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターが記録されます。

ワークフローは固定されたリリースから OCM を、`openclaw/Kova` から固定された `kova_ref` 入力の Kova をインストールし、その後 3 つのレーンを実行します:

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を持つローカルビルドのランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポット向け CPU/ヒープ/トレースプロファイリング。
- `live-gpt54`: 実際の OpenAI `openai/gpt-5.4` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされます。

mock-provider レーンは Kova パスの後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、hook、50-Plugin 起動ケースにおける Gateway 起動時間とメモリ、mock-OpenAI `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンドです。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` にあり、生の JSON がその横にあります。

すべてのレーンが GitHub artifact をアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブ artifact も `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、install smoke、package acceptance、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします。`rerun_group=all` と `release_profile=full` を指定すると、リリースチェックの `release-package-under-test` artifact に対して `NPM Telegram Beta E2E` も実行します。公開後は、`npm_telegram_package_spec` を渡すことで、公開済み npm パッケージに対して同じ Telegram パッケージレーンを再実行できます。

ステージマトリクス、正確なワークフロージョブ名、プロファイルの違い、artifact、
およびフォーカスした再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)
を参照してください。

`OpenClaw Release Publish` は変更を伴う手動リリースワークフローです。リリースタグが存在し、
OpenClaw npm preflight が成功した後に、`release/YYYY.M.D` または `main` からディスパッチします。
これは `pnpm plugins:sync:check` を検証し、公開可能なすべての Plugin パッケージ向けに
`Plugin NPM Release` をディスパッチし、同じリリース SHA 向けに
`Plugin ClawHub Release` をディスパッチし、その後にのみ保存済みの `preflight_run_id` を使って
`OpenClaw NPM Release` をディスパッチします。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットの証明を行う場合は、
`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチ ref はブランチまたはタグである必要があり、生のコミット SHA ではありません。
ヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチを push し、
その固定 ref から `Full Release Validation` をディスパッチし、すべての子ワークフローの
`headSha` がターゲットと一致することを検証し、実行完了時に一時ブランチを削除します。
包括検証ツールは、いずれかの子ワークフローが異なる SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡されるライブ/プロバイダー範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範なアドバイザリープロバイダー/メディア行列を意図的に使いたい場合のみ `full` を使用してください。

- `minimum` は最速の OpenAI/コアのリリースクリティカルなレーンを維持します。
- `stable` は安定版のプロバイダー/バックエンドセットを追加します。
- `full` は広範なアドバイザリープロバイダー/メディア行列を実行します。

アンブレラはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再確認し、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功になった場合は、親の検証ジョブだけを再実行して、アンブレラ結果とタイミング要約を更新してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常のフル CI 子のみには `ci`、Plugin プレリリース子のみには `plugin-prerelease`、すべてのリリース子には `release-checks`、またはアンブレラ上のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用してください。これにより、焦点を絞った修正後の失敗したリリースボックス再実行を限定できます。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使って選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトを live/E2E リリースパス Docker ワークフローとパッケージ受け入れシャードの両方に渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再パックすることを避けられます。

`ref=main` と `rerun_group=all` の重複する `Full Release Validation` 実行は、古いアンブレラを置き換えます。親モニターは、親がキャンセルされたときに、すでにディスパッチ済みの子ワークフローをすべてキャンセルするため、新しい main 検証が古い 2 時間のリリースチェック実行の後ろで待機することはありません。リリースブランチ/タグ検証と、焦点を絞った再実行グループは `cancel-in-progress: false` を維持します。

## Live と E2E のシャード

リリース live/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、単一の直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

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

これにより、同じファイルカバレッジを保ちながら、遅いライブプロバイダーの失敗を再実行しやすく、診断しやすくなります。集約 `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行でも引き続き有効です。

ネイティブのライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリを確認するだけです。Docker に基づくライブスイートは通常の Blacksmith ランナーで実行してください。コンテナジョブはネストされた Docker テストを起動する場所として適していません。

Docker に基づくライブモデル/バックエンドシャードは、選択されたコミットごとに個別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後 Docker ライブモデル、プロバイダー分割 Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限があり、コンテナやクリーンアップ経路が停止した場合に、リリースチェック予算全体を消費するのではなく早く失敗します。これらのシャードがフルソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドで実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか」を問う場合は、`Package Acceptance` を使用してください。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが利用するのと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、ソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを GitHub ステップ要約に出力します。
2. `docker_acceptance` は、`ref=workflow_ref` と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数のターゲット `docker_lanes` を選択した場合、再利用可能ワークフローはパッケージと共有イメージを一度準備してから、それらのレーンを一意のアーティファクトを持つ並列ターゲット Docker ジョブとして展開します。
3. `package_telegram` は、任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` ではない場合に実行され、Package Acceptance が解決したものがある場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、公開済み npm spec を引き続きインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

### 候補ソース

- `source=npm` は `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済みプレリリース/安定版の受け入れに使用してください。
- `source=ref` は、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、デタッチされたワークツリーに依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は HTTPS `.tgz` をダウンロードします。`package_sha256` が必須です。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトには指定するべきです。

`workflow_ref` と `package_ref` は分けておいてください。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は、`source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフローロジックを実行せずに、古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`upgrade-survivor`、`published-upgrade-survivor`、`plugins-offline`、`plugin-update`
- `product` — `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含むフル Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブ ClawHub 可用性に左右されません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec パスはスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗トリアージを含む、専用の更新および Plugin テストポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、古い Plugin 依存関係のクリーンアップ、設定済み Plugin インストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が、同じ解決済みパッケージ tarball 上に維持されます。SHA でビルドされたアーティファクトの代わりに、出荷済み npm パッケージに対して同じ行列を実行するには、Full Release Validation または OpenClaw Release Checks で `package_acceptance_package_spec` を設定してください。Cross-OS リリースチェックは引き続き OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。`published-upgrade-survivor` Docker レーンは、1 回の実行につき 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補であり、`published_upgrade_survivor_baseline` がフォールバックの公開済みベースラインを選択し、デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドはそのベースラインを保持します。`published_upgrade_survivor_baselines=all-since-2026.4.23` を設定すると、Full Release CI が `2026.4.23` から `latest` までのすべての安定版 npm リリースに展開されます。より古い日付前アンカーを使った手動の広範なサンプリングには、`release-history` が引き続き利用可能です。`published_upgrade_survivor_scenarios=reported-issues` を設定すると、同じベースラインが、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに関する、Issue 形状のフィクスチャに展開されます。通常の Full Release CI の範囲ではなく、公開済み更新クリーンアップを網羅的に確認したい場合は、別の `Update Migration` ワークフローが `all-since-2026.4.23` と `plugin-deps-cleanup` を指定して `update-migration` Docker レーンを使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、シナリオ行列に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みレーンとインストーラーの新規レーンでは、インストール済みパッケージが未加工の絶対 Windows パスからブラウザー制御オーバーライドをインポートできることも検証します。OpenAI の cross-OS agent-turn smoke は、設定されている場合はデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。そのため、GPT-4.x デフォルトを避けながら、インストールと Gateway 証明を GPT-5 テストモデル上に維持できます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージ向けに限定されたレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は tarball 由来の偽 git フィクスチャから欠落している `pnpm.patchedDependencies` を刈り込む場合があり、永続化された `update.channel` の欠落をログに出す場合があります。
- Plugin smoke はレガシーのインストール記録場所を読む場合があり、またはマーケットプレイスのインストール記録永続化がないことを許容する場合があります。
- `plugin-update` は、インストール記録と再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータの移行を許可する場合があります。

公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプファイルについても警告する場合があります。それ以降のパッケージは現代的な契約を満たす必要があります。同じ条件は警告やスキップではなく失敗になります。

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

失敗したパッケージ受け入れ実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。完全なリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

## インストールスモーク

別個の `Install Smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。スモークカバレッジは `run_fast_install_smoke` と `run_full_install_smoke` に分割されます。

- **高速パス**は、Docker/パッケージサーフェス、同梱 Plugin パッケージ/マニフェスト変更、または Docker スモークジョブが実行するコア Plugin/チャネル/Gateway/Plugin SDK サーフェスに触れるプルリクエストで実行されます。ソースのみの同梱 Plugin 変更、テストのみの編集、ドキュメントのみの編集では Docker ワーカーを予約しません。高速パスはルート Dockerfile イメージを一度ビルドし、CLI をチェックし、agents delete 共有ワークスペース CLI スモークを実行し、コンテナ gateway-network e2e を実行し、同梱拡張のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で境界付き同梱 Plugin Docker プロファイルを実行します（各シナリオの Docker 実行は別々に上限設定されます）。
- **完全パス**は、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、および本当にインストーラー/パッケージ/Docker サーフェスに触れるプルリクエスト向けに、QR パッケージインストールとインストーラー Docker/更新カバレッジを維持します。完全モードでは、install-smoke は 1 つのターゲット SHA GHCR ルート Dockerfile スモークイメージを準備または再利用し、その後、QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/更新スモーク、高速同梱 Plugin Docker E2E を別々のジョブとして実行するため、インストーラー作業がルートイメージのスモークの後ろで待つことはありません。

`main` へのプッシュ（マージコミットを含む）は完全パスを強制しません。変更スコープロジックがプッシュで完全カバレッジを要求する場合でも、ワークフローは高速 Docker スモークを維持し、完全インストールスモークは夜間またはリリース検証に任せます。

遅い Bun グローバルインストール image-provider スモークは、`run_bun_global_install_smoke` によって別途ゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `Install Smoke` ディスパッチではオプトインできますが、プルリクエストと `main` へのプッシュでは実行されません。QR とインストーラー Docker テストは、それぞれインストールに焦点を当てた独自の Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は 1 つの共有ライブテストイメージを事前ビルドし、OpenClaw を npm tarball として一度パックし、2 つの共有 `scripts/e2e/Dockerfile` イメージをビルドします。

- インストーラー/更新/Plugin 依存関係レーン向けの素の Node/Git ランナー。
- 通常の機能レーン向けに、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン向けのメインプールスロット数。                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーに敏感なテールプールのスロット数。                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーがスロットリングしないようにする同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時マルチサービスレーン上限。                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンの create ストームを避けるためのレーン開始間隔。間隔なしにするには `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ/テールレーンはより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。エージェントが 1 つの失敗レーンを再現できるよう、クリーンアップスモークをスキップします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、アクティブレーンステータスを出力し、最長優先の順序付けのためにレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプールレーンのスケジュールを停止します。

### 再利用可能なライブ/E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、どのパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。次に `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在実行中のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドしてプッシュし、再ビルドする代わりに指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージの pull は、試行ごとに 180 秒の境界付きタイムアウトで再試行されるため、詰まったレジストリ/キャッシュストリームが CI クリティカルパスの大半を消費するのではなく、速やかに再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使って小さなチャンクジョブとして実行されるため、各チャンクは必要なイメージ種別のみを pull し、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` です。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンの集約手動再実行エイリアスのままです。

OpenWebUI は、完全なリリースパスカバレッジが要求する場合に `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチ向けにだけスタンドアロンの `openwebui` チャンクを維持します。同梱チャネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、遅いレーンのテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗レーンのデバッグは対象を絞った 1 つの Docker ジョブに限定され、その実行向けにパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行のためにライブテストイメージをローカルでビルドします。生成されたレーンごとの GitHub 再実行コマンドには、値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行と同じ正確なパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュール済みライブ/E2E ワークフローは、完全なリリースパス Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` はより高コストなプロダクト/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。これは同梱 Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、1 グループにつき 1 つの Vitest ワーカーとより大きな Node ヒープを使って最大 2 つの Plugin 設定グループを同時に実行するため、import の多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパスは、1〜3 分のジョブに数十のランナーを予約しないよう、対象 Docker レーンを小さなグループでバッチ処理します。

## QA ラボ

QA ラボには、メインのスマートスコープワークフロー外に専用の CI レーンがあります。エージェント型パリティは、スタンドアロンの PR ワークフローではなく、広範な QA とリリースハーネスの下にネストされています。広範な検証実行にパリティを載せる必要がある場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で夜間に実行され、手動ディスパッチでも実行されます。mock parity レーン、live Matrix レーン、live Telegram レーンと live Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定論的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブトランスポートレーンを実行するため、チャネル契約はライブモデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。QA パリティがメモリ動作を別途カバーするため、ライブトランスポート Gateway はメモリ検索を無効にします。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートによってカバーされます。

Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA ラボレーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープされた CI/チェックの証拠に従います。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリ全体のスイープではなく、意図的に範囲を絞った初回パスのセキュリティスキャナーです。日次、手動、非ドラフト pull request ガードの実行では、Actions ワークフローコードに加えて、リスクが最も高い JavaScript/TypeScript 領域を、高/重大の `security-severity` に絞り込んだ高信頼度のセキュリティクエリでスキャンします。

pull request ガードは軽量なままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始され、スケジュールされたワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は、PR のデフォルトからは除外されています。

### セキュリティカテゴリ

| カテゴリ                                          | 対象領域                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、および Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装コントラクトに加えて、チャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査の接点              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、Web フェッチ、および Plugin SDK の SSRF ポリシー領域                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントのツール実行ゲート                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin のインストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーによるインストール、ソース読み込み、および Plugin SDK パッケージコントラクトの信頼領域 |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー健全性チェックで受け入れられる最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、アップロードされる SARIF から依存関係ビルド結果を除外して、`/codeql-critical-security/macos` 配下にアップロードします。macOS ビルドはクリーンな場合でも実行時間の大部分を占めるため、日次デフォルトの外に置かれています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は対応する非セキュリティシャードです。小さい Blacksmith Linux ランナー上で、範囲を絞った高価値領域に対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。その pull request ガードは、スケジュールされたプロファイルより意図的に小さくなっています。非ドラフト PR では、エージェントのコマンド/モデル/ツール実行と返信ディスパッチコード、設定スキーマ/移行/IO コード、認証/シークレット/サンドボックス/セキュリティコード、コアチャンネルとバンドル済みチャンネル Plugin ランタイム、Gateway プロトコル/サーバーメソッド、メモリランタイム/SDK 接着部、MCP/プロセス/アウトバウンド配信、プロバイダーランタイム/モデルカタログ、セッション診断/配信キュー、Plugin ローダー、Plugin SDK/パッケージコントラクト、または Plugin SDK 返信ランタイムの変更に対して、対応する `agent-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`channel-runtime-boundary`、`gateway-runtime-boundary`、`memory-runtime-boundary`、`mcp-process-runtime-boundary`、`provider-runtime-boundary`、`session-diagnostics-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、および `plugin-sdk-reply-runtime` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、12 個すべての PR 品質シャードを実行します。

手動ディスパッチは次を受け付けます。

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | 対象領域                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、および Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、および IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャンネルとバンドル済みチャンネル Plugin の実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、および ACP コントロールプレーンランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監督ヘルパー、およびアウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の接着部、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインディング/配信ヘルパー、診断イベント/ログバンドル領域、およびセッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK のインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャンネル返信オプション、配信キュー、およびセッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、および Web/検索/フェッチ/埋め込みレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI のブートストラップ、ローカル永続化、Gateway コントロールフロー、およびタスクコントロールプレーンランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア Web フェッチ/検索、メディア IO、メディア理解、画像生成、およびメディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開領域、および Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離されたままです。これにより、セキュリティシグナルを不明瞭にすることなく、品質検出結果をスケジュール、測定、無効化、または拡張できます。Swift、Python、およびバンドル済み Plugin の CodeQL 拡張は、狭いプロファイルの実行時間とシグナルが安定した後にのみ、範囲を絞った、またはシャード化されたフォローアップ作業として追加し直すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非ボット push の CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による起動は、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップされます。実行時には、前回スキップされなかった Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント処理以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への非ボット push の CI 実行が成功するとトリガーできますが、同じ UTC 日に別のワークフロー実行による起動がすでに実行済み、または実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートを迂回します。このレーンは、フルスイートをグループ化した Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなく、カバレッジを維持する小さなテストパフォーマンス修正だけを行わせ、その後フルスイートレポートを再実行して、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗テストがある場合、Codex は明らかな失敗だけを修正でき、エージェント後のフルスイートレポートは、何かがコミットされる前に合格しなければなりません。ボットの push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して、push を再試行します。競合する古いパッチはスキップされます。Codex アクションが docs agent と同じ drop-sudo 安全姿勢を維持できるように、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複クリーンアップ用の手動メンテナーワークフローです。デフォルトはドライランで、`apply=true` の場合にのみ明示的に列挙された PR をクローズします。GitHub を変更する前に、取り込まれた PR がマージ済みであること、また各重複が共有参照 issue または重複する変更ハンクを持つことを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォーム範囲よりもアーキテクチャ境界について厳格です。

- コア本番変更は、コア本番とコアテストの型チェックに加えて、コア lint/ガードを実行します。
- コアのテストのみの変更は、コアテストの型チェックに加えて、コア lint のみを実行します。
- 拡張本番変更は、拡張本番と拡張テストの型チェックに加えて、拡張 lint を実行します。
- 拡張のテストのみの変更は、拡張テストの型チェックに加えて、拡張 lint を実行します。
- 公開 Plugin SDK または Plugin コントラクトの変更は、拡張がそれらのコアコントラクトに依存するため、拡張型チェックに展開されます（Vitest 拡張スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明なルート/設定変更は、安全側に倒してすべてのチェックレーンに進みます。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、`check:changed` より意図的に低コストです。直接のテスト編集はそれ自体を実行し、ソース編集は明示的なマッピングを優先し、その後に兄弟テストと import グラフの依存先を実行します。共有グループルーム配信設定は、明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信リグレッションを通るため、共有デフォルトの変更は最初の PR push の前に失敗します。変更がハーネス全体に及ぶため、低コストのマッピング済みセットが信頼できる代理にならない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

リポジトリルートから Testbox を実行し、広範な検証には新しくウォームアップしたボックスを優先してください。再利用された、期限切れになった、または予期せず大きな同期を報告したボックスで時間のかかるゲートを使う前に、まずボックス内で `pnpm testbox:sanity` を実行してください。

サニティチェックは、`pnpm-lock.yaml` などの必須ルートファイルが消えた場合、または `git status --short` が少なくとも 200 件の追跡済み削除を示した場合に、すばやく失敗します。通常これは、リモート同期状態が PR の信頼できるコピーではないことを意味します。製品テストの失敗をデバッグするのではなく、そのボックスを停止して新しいボックスをウォームアップしてください。意図的な大量削除 PR の場合は、そのサニティ実行に `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

`pnpm testbox:run` は、同期後の出力がないまま同期フェーズに 5 分以上とどまるローカルの Blacksmith CLI 呼び出しも終了します。このガードを無効にするには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル差分にはより大きなミリ秒値を使用してください。

Crabbox は、Blacksmith が利用できない場合、または所有しているクラウド容量を使うほうが望ましい場合に、Linux 検証で使うリポジトリ所有の 2 つ目のリモートボックス経路です。ボックスをウォームアップし、プロジェクトワークフローを通じてハイドレートしてから、Crabbox CLI 経由でコマンドを実行します。

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` は、プロバイダー、同期、GitHub Actions のハイドレーション既定値を所有します。これはローカルの `.git` を除外するため、ハイドレートされた Actions チェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期するのではなく、自身のリモート Git メタデータを保持します。また、転送してはならないローカルのランタイム/ビルド成果物も除外します。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm セットアップ、`origin/main` のフェッチ、および後続の `crabbox run --id <cbx_id>` コマンドが source する非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
