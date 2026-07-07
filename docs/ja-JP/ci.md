---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更しようとしています
summary: CI ジョブグラフ、スコープゲート、リリース包括ジョブ、ローカルコマンドの同等操作
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-06T21:46:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56efdae09754c6fe11abfe707a28c679dd0dae231fbaf15da0cf57f76498bb29
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` への push（Markdown と `docs/**` パスはトリガー時に無視）、非ドラフトの pull request（CHANGELOG のみの差分は無視）、および手動 dispatch で実行されます。正規の `main` push はまず 90 秒の hosted-runner 受け入れウィンドウを通過します。`CI` concurrency group は新しい commit が到着すると待機中の run をキャンセルするため、連続する merge がそれぞれ完全な Blacksmith matrix を登録することはありません。Pull request と手動 dispatch は待機をスキップします。その後、`preflight` job が差分を分類し、無関係な領域だけが変更された場合は高コストな lane をオフにします。手動の `workflow_dispatch` run は、release candidate と広範な検証のため、意図的にスマートスコープをバイパスしてグラフ全体にファンアウトします。Android lane は `include_android`（または `release_gate` input）を通じて opt-in のままです。リリース専用の Plugin coverage は別の [`Plugin プレリリース`](#plugin-prerelease) workflow にあり、[`完全リリース検証`](#full-release-validation) または明示的な手動 dispatch からのみ実行されます。

## パイプライン概要

| Job                                | 目的                                                                                                                                                                                            | 実行タイミング                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs のみの変更、変更された scope、変更された extensions を検出し、CI manifest を構築する                                                                                                            | 非ドラフトの push と PR で常に実行                  |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` push に対して hosted の 90 秒 debounce を行う                                                                                                         | すべての CI run。sleep は正規の `main` push のみ |
| `security-fast`                    | 秘密鍵の検出、`zizmor` による変更 workflow 監査、本番 lockfile 監査                                                                                                          | 非ドラフトの push と PR で常に実行                  |
| `pnpm-store-warmup`                | Linux Node shard をブロックせず、lockfile に固定された pnpm store cache をウォームする                                                                                                                       | Node または docs-check lane が選択された場合                   |
| `build-artifacts`                  | `dist/`、Control UI、built-CLI smoke check、起動時メモリ、埋め込み built-artifact check をビルドする                                                                                              | Node 関連の変更                               |
| `checks-fast-core`                 | 高速な Linux correctness lane: bundled + protocol、Bun launcher、CI-routing fast task                                                                                                       | Node 関連の変更                               |
| `checks-fast-contracts-plugins-*`  | 重み付けされた 2 つの Plugin contract shard                                                                                                                                                                | Node 関連の変更                               |
| `checks-fast-contracts-channels-*` | 重み付けされた 2 つの channel contract shard                                                                                                                                                               | Node 関連の変更                               |
| `checks-node-*`                    | channel、bundled、contract、extension lane を除外した Core Node test shard                                                                                                                   | Node 関連の変更                               |
| `check-*`                          | shard 化された main local gate 相当: guards、shrinkwrap、bundled-channel config metadata、prod types、lint、dependencies、test types                                                                | Node 関連の変更                               |
| `check-additional-*`               | boundary check stripe（prompt snapshot drift を含む）、session accessor/transcript reader boundary、extension lint group、package boundary compile/canary、runtime topology architecture | Node 関連の変更                               |
| `checks-node-compat-node22`        | Node 22 互換 build と smoke lane                                                                                                                                                         | リリース向けの手動 CI dispatch                     |
| `check-docs`                       | docs formatting、lint、broken-link check                                                                                                                                                      | Docs が変更された場合（PR と手動 dispatch）              |
| `native-i18n`                      | Native app、Android、Apple i18n inventory check                                                                                                                                               | Native i18n 関連の変更                        |
| `skills-python`                    | Python-backed Skills 向け Ruff + pytest                                                                                                                                                             | Python-skill 関連の変更                       |
| `checks-windows`                   | Windows 固有の process/path test と、共有 runtime import specifier regression                                                                                                               | Windows 関連の変更                            |
| `macos-node`                       | macOS の絞り込まれた TypeScript test: launchd、Homebrew、runtime path、packaging script、process-group wrapper                                                                                         | macOS 関連の変更                              |
| `macos-swift`                      | macOS app 向け Swift lint、build、test                                                                                                                                                     | macOS 関連の変更                              |
| `ios-build`                        | Xcode project generation と iOS app simulator build                                                                                                                                          | iOS app、shared app kit、または Swabble の変更         |
| `android`                          | 両 flavor の Android unit test と 1 つの debug APK build                                                                                                                                       | Android 関連の変更                            |
| `test-performance-agent`           | 別 workflow: trusted activity 後の日次 Codex slow-test optimization                                                                                                                       | Main CI success または手動 dispatch                  |
| `openclaw-performance`             | 別 workflow: mock-provider、deep-profile、GPT 5.5 live lane を含む日次/on-demand Kova runtime performance report                                                                       | スケジュールおよび手動 dispatch                       |

## Fail-fast 順序

1. `runner-admission` は正規の `main` push のみ待機します。新しい push があると、Blacksmith 登録前に run がキャンセルされます。
2. `preflight` はどの lane がそもそも存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、この job 内の step であり、独立した job ではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い artifact および platform matrix job を待たずにすばやく失敗します。
4. `build-artifacts` は高速な Linux lane と重なって実行されるため、共有 build の準備ができ次第、下流の consumer が開始できます。
5. その後、より重い platform および runtime lane がファンアウトします: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しい push が到着すると、GitHub は置き換えられた job を `cancelled` としてマークする場合があります。同じ ref の最新 run も失敗していない限り、これは CI ノイズとして扱ってください。Matrix job は `fail-fast: false` を使用し、`build-artifacts` は小さな verifier job を queue に入れる代わりに、埋め込み channel、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI concurrency key は versioned（`CI-v7-*`）であるため、古い queue group 内の GitHub 側 zombie が新しい main run を無期限にブロックすることはありません。手動 full-suite run は `CI-manual-v1-*` を使用し、進行中の run をキャンセルしません。

`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用して、GitHub Actions から wall time、queue time、最も遅い job、失敗、`pnpm-store-warmup` fanout barrier を要約します。workflow 内の `ci-timings-summary` job は `ci.yml` に存在しますが、現在は無効化されています（`if: false`）。代わりに timing helper をローカルで実行してください。Build timing については、`build-artifacts` job の `Build dist` step を確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。この job は `startup-memory` artifact もアップロードします。

## PR コンテキストと証拠

外部 contributor の PR は、`.github/workflows/real-behavior-proof.yml` から PR context と evidence gate を実行します。この workflow は trusted workflow revision（`github.workflow_sha`）を checkout し、PR body のみを評価します。contributor branch の code は実行しません。

この gate は、repository owner、member、collaborator、bot ではない PR author に適用されます。PR body に author が書いた `What Problem This Solves` と `Evidence` section が含まれている場合に通過します。Evidence には、焦点を絞った test、CI result、screenshot、recording、terminal output、live observation、redacted log、artifact link を使用できます。Body は意図と有用な validation を提供します。reviewer は code、test、CI を検査して correctness を評価します。

check が失敗した場合は、別の code commit を push する代わりに PR body を更新してください。

## スコープとルーティング

Scope logic は `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit test でカバーされています。手動 dispatch は changed-scope detection をスキップし、preflight manifest がすべての scoped area が変更されたかのように動作します。

- **CI ワークフローの編集**は、Node CI グラフ、ワークフローの lint、Windows レーン（`ci.yml` が実行）を検証しますが、それだけで iOS、Android、macOS のネイティブビルドを強制するものではありません。これらのプラットフォームレーンは、プラットフォームのソース変更にスコープされたままです。
- **ワークフロー健全性**は、すべてのワークフロー YAML ファイルに対する `actionlint`、`zizmor`、コンポジットアクション補間ガード、競合マーカーガードを実行します。PR スコープの `security-fast` ジョブも、変更されたワークフローファイルに対して `zizmor` を実行するため、ワークフローのセキュリティ所見はメインの CI グラフで早期に失敗します。
- **`main` プッシュ時のドキュメント**は、CI と同じ ClawHub ドキュメントミラーを使うスタンドアロンの `Docs` ワークフローでチェックされるため、コードとドキュメントが混在するプッシュでも CI の `check-docs` シャードは追加でキューに入りません。Pull request と手動 CI では、ドキュメントが変更された場合に引き続き CI から `check-docs` が実行されます。
- **TUI PTY**は、TUI の変更に対して `checks-node-core-runtime-tui-pty` Linux Node シャードで実行されます。このシャードは `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 付きで `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定論的な `TuiBackend` フィクスチャレーンと、外部モデルエンドポイントのみをモックする遅めの `tui --local` スモークの両方をカバーします。
- **CI ルーティングのみの編集、高速タスクが直接実行する少数の core-test フィクスチャ、狭い Plugin 契約ヘルパーの編集**は、高速な Node のみのマニフェストパスを使います。`preflight`、`security-fast`、および変更が触れた高速レーンのみ、つまり単一の `checks-fast-core` CI ルーティングタスク、2 つの Plugin 契約シャード、またはその両方です。このパスは、ビルド成果物、Node 22 互換性、チャネル契約、完全なコアシャード、バンドル済み Plugin シャード、追加のガードマトリクスをスキップします。
- **Windows Node チェック**は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフローサーフェスにスコープされます。無関係なソース、Plugin、インストールスモーク、テストのみの変更は Linux Node レーンにとどまります。

最も遅い Node テストファミリーは、各ジョブを小さく保ちつつランナーを過剰に予約しないよう、分割またはバランスされています。

- Plugin 契約とチャネル契約は、それぞれ標準の GitHub ランナーフォールバック付きで、重み付けされた Blacksmith バックの 2 つのシャードとして実行されます。
- コアユニットの高速/サポートレーンは個別に実行されます。コアランタイムインフラは、process、shared、hooks、secrets、3 つの cron ドメインシャードに分割されます。
- 自動返信はバランスされたワーカーとして実行され、reply サブツリーは agent-runner、commands、dispatch、session、state-routing シャードに分割されます。
- Agentic gateway/server（コントロールプレーン）設定は、ビルド済み成果物を待つのではなく、chat、auth、model、HTTP/plugin、runtime、startup レーンに分割されます。
- 通常の CI は、分離されたインフラ include-pattern シャードのみを最大 64 テストファイルの決定論的なバンドルに詰め込み、非分離の command/cron、ステートフルな agents-core、gateway/server スイートをマージせずに Node マトリクスを削減します。重い固定スイートは 8 vCPU のままにし、バンドル済みレーンと低重みレーンは 4 vCPU を使います。
- 正規リポジトリ上の Pull request は、コンパクトな受け入れプランを使います。同じ設定ごとのグループが分離サブプロセスで実行され、現在は 74 ジョブの完全マトリクスではなく 18 個の Node テストジョブです。`main` プッシュ、手動ディスパッチ、リリースゲートは完全マトリクスを維持します。
- 広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin キャッチオールではなく専用の Vitest 設定を使います。Include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できます。
- `check-additional-*` は、補助的な境界ガードリスト（`scripts/run-additional-boundary-checks.mjs`）を、プロンプト負荷の高い 1 つのシャード（`check-additional-boundaries-a`。Codex プロンプトスナップショットのドリフトチェックを含む）と、残りのストライプをまとめた 1 つのシャード（`check-additional-boundaries-bcd`）に分割します。各シャードは独立したガードを並行実行し、チェックごとのタイミングを出力します。パッケージ境界の compile/canary 作業はまとめたままにし、ランタイムトポロジーアーキテクチャは `build-artifacts` に埋め込まれた Gateway watch カバレッジとは別に実行されます。
- Gateway watch、チャネルテスト、コア support-boundary シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

受け入れ後、正規の Linux CI は最大 24 個の Node テストジョブと、
小さめの fast/check レーン用に 12 個の同時実行を許可します。Windows と Android は、
これらのランナープールが狭いため 2 個のままです。コンパクトな設定全体バッチは
120 分のバッチタイムアウトで実行され、include-pattern グループは同じ有界の
ジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party フレーバーには別個のソースセットやマニフェストはありません。そのユニットテストレーンは、Android 関連の各プッシュで重複した debug APK パッケージングジョブを避けつつ、SMS/通話ログ BuildConfig フラグ付きで引き続きフレーバーをコンパイルします。

`check-dependencies` シャードは、`pnpm deadcode:dependencies`（正確な Knip バージョンに固定された本番 Knip 依存関係のみのパスで、`dlx` インストールでは pnpm の最低リリース経過日数を無効化）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル所見を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。さらに、助言的な `pnpm deadcode:report:ci:ts-unused` レポートが `deadcode-reports` 成果物としてアップロードされます。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない意図的な動的 Plugin、生成物、ビルド、ライブテスト、パッケージブリッジのサーフェスは保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に送るターゲット側ブリッジです。信頼されていない pull request コードをチェックアウトしたり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` にディスパッチします。

このワークフローには 4 つのレーンがあります。

- 正確な issue と pull request レビューリクエスト用の `clawsweeper_item`;
- issue コメント内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` プッシュ上のコミットレベルレビューリクエスト用の `clawsweeper_commit_review`;
- ClawSweeper エージェントが検査する可能性のある一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します。イベント種別、アクション、アクター、リポジトリ、項目番号、URL、タイトル、状態、およびコメントやレビューが存在する場合の短い抜粋です。完全な Webhook 本文は意図的に転送しません。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway フックに投稿します。

一般アクティビティは観測であり、デフォルト配信ではありません。ClawSweeper エージェントはプロンプト内で Discord ターゲットを受け取り、イベントが予想外、対応可能、リスクあり、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常の open、edit、bot の変動、重複 Webhook ノイズ、通常のレビュー通信は `NO_REPLY` になるべきです。

このパス全体で、GitHub のタイトル、コメント、本文、レビュー本文、ブランチ名、コミットメッセージを信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的に有効にします。Linux Node シャード、バンドル済み Plugin シャード、Plugin とチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、iOS ビルド、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは、`include_android=true` の場合にのみ Android を実行します（`release_gate` 入力も Android を強制します）。完全リリースの包括ワークフローは `include_android=true` を渡すことで Android を有効にします。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な extension バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency group を使うため、リリース候補の完全スイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼された呼び出し元は、選択されたディスパッチ ref のワークフローファイルを使いながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できます。`release_gate` 入力は、容量不足で停滞した PR CI 用の正確な SHA の maintainer フォールバックです。`target_ref` は、ディスパッチされたブランチヘッドに一致する完全なコミット SHA である必要があります。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

月次 npm のみの extended-stable パスは例外です。`OpenClaw NPM
Release` preflight と `Full Release Validation` の両方を正確な
`extended-stable/YYYY.M.33` ブランチからディスパッチし、それらの run ID を保持し、
両方の ID を直接 npm publish 実行に渡します。コマンド、正確な identity 要件、
registry readback、selector 修復手順については、[月次 npm のみの extended-stable
公開](/ja-JP/reference/RELEASING#monthly-npm-only-extended-stable-publication) を参照してください。
このパスは、Plugin、macOS、Windows、GitHub
Release、private dist-tag、またはその他のプラットフォーム公開をディスパッチしません。

## ランナー

| ランナー                          | ジョブ                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI ディスパッチと非正規リポジトリのフォールバック、CodeQL のセキュリティおよび品質スキャン、workflow-sanity、labeler、auto-response、単独の Docs ワークフロー、Install Smoke ワークフロー全体                                                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、`checks-fast-core`、Plugin/チャンネル契約シャード、ほとんどのバンドル済み/軽量 Linux Node シャード、`check-lint` 以外の `check-*` レーン、選択された `check-additional-*` シャード、`check-docs`、`skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持されている重い Linux Node スイート、境界/拡張機能が重い `check-additional-*` シャード、`android`                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404` | CI と Testbox の `build-artifacts`、および `check-lint`（CPU の影響を十分に受けるため、8 vCPU は節約分よりコストが大きかった）                                                                                                                                                              |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。フォークは `macos-15` にフォールバックする                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。フォークは `macos-26` にフォールバックする                                                                                                                                                                                             |

## ランナー登録予算

OpenClaw の現在の GitHub ランナー登録バケットは、`ghx api rate_limit` で 5 分あたり 10,000 件のセルフホストランナー登録を報告する。GitHub はこのバケットを変更できるため、各チューニング作業の前に `actions_runner_registration` を再確認する。この制限は `openclaw` organization 内のすべての Blacksmith ランナー登録で共有されるため、別の Blacksmith インストールを追加しても新しいバケットは追加されない。

バースト制御では、Blacksmith ラベルを希少リソースとして扱う。ルーティング、通知、要約、シャード選択、または短い CodeQL スキャンだけを行うジョブは、測定済みの Blacksmith 固有の必要性がない限り、GitHub ホストランナーに留める。新しい Blacksmith マトリクス、より大きい `max-parallel`、または高頻度ワークフローは、最悪ケースの登録数を示し、organization レベルの目標をライブバケットのおよそ 60% 未満に保つ必要がある。現在の 10,000 登録バケットでは、これは 6,000 登録の運用目標を意味し、同時実行リポジトリ、リトライ、バーストの重なりに対する余裕を残す。

正規リポジトリの CI は、通常の push および pull request 実行のデフォルトランナーパスとして Blacksmith を維持する。`workflow_dispatch` と非正規リポジトリの実行は GitHub ホストランナーを使用するが、通常の正規実行は現在、Blacksmith のキュー健全性をプローブしたり、Blacksmith が利用できない場合に GitHub ホストラベルへ自動フォールバックしたりしない。

## ローカル同等コマンド

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

## OpenClaw Performance

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローである。`main` で毎日実行され、手動でもディスパッチできる。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークする。現在のワークフロー実装でリリースタグまたは別ブランチをベンチマークするには、`target_ref` を設定する。公開レポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` はテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、繰り返し回数、シナリオフィルターを記録する。

ワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行する。

- `mock-provider`: 決定的な偽の OpenAI 互換認証を使い、ローカルビルドランタイムに対して Kova 診断シナリオを実行する。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリング。スケジュール時、または `deep_profile=true` 付きのディスパッチ時に実行される。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` エージェントターン。`OPENAI_API_KEY` が利用できない場合はスキップされる。スケジュール時、または `live_openai_candidate=true` 付きのディスパッチ時に実行される。

mock-provider レーンは、Kova パスの後に OpenClaw ネイティブのソースプローブも実行する。デフォルト、スキップ済みチャンネル、内部フック、50 Plugin 起動ケースにわたる Gateway 起動タイミングとメモリ、バンドル済み Plugin インポート RSS、繰り返しの mock-OpenAI `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態のスモークパフォーマンスプローブである。テスト対象 ref について前回公開された mock-provider ソースレポートが利用できる場合、ソース要約は現在の RSS とヒープ値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークする。ソースプローブの Markdown 要約はレポートバンドル内の `source/index.md` にあり、生 JSON はその横にある。

すべてのレーンは GitHub アーティファクトをアップロードする。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下へコミットする。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれる。

## フルリリース検証

`Full Release Validation` は「リリース前にすべてを実行する」ための手動の包括ワークフローである。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフローをディスパッチし（Android を含む）、リリース専用の Plugin/パッケージ/静的/Docker 証明のために `Plugin Prerelease` をディスパッチし、ターゲット SHA に対して `OpenClaw Performance` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチする（アドバイザリ成熟度スコアカードのレンダリングは `run_maturity_scorecard` によるオプトイン）。stable プロファイルと full プロファイルは、常に包括的なライブ/E2E と Docker リリースパスの soak カバレッジを含む。beta プロファイルは `run_release_soak=true` でオプトインできる。正規パッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補は重複するライブポーラーを開始しない。公開後は、`release_package_spec` を渡して、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram にわたり、再ビルドなしで出荷済み npm パッケージを再利用する。集中した公開済みパッケージ Telegram 再実行にのみ `npm_telegram_package_spec` を使用する。Codex Plugin ライブパッケージレーンは、デフォルトで同じ選択状態を使用する。公開済みの `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行は選択された ref から `extensions/codex` をパックする。`npm:`、`npm-pack:`、`git:` specs などのカスタム Plugin ソースには `codex_plugin_spec` を明示的に設定する。

ステージマトリクス、正確なワークフロージョブ名、プロファイル差分、アーティファクト、集中再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照する。

`OpenClaw Release Publish` は、変更を加える手動リリースワークフローである。リリースタグが存在し、OpenClaw npm preflight が成功した後（preflight はチェックの中で `pnpm plugins:sync:check` を実行する）、`release/YYYY.M.PATCH` または `main` からディスパッチする。保存済みの `preflight_run_id` と成功した `full_release_validation_run_id` が必要で、すべての公開可能な Plugin パッケージに対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して `Plugin ClawHub Release` をディスパッチしてから、ようやく `OpenClaw NPM Release` をディスパッチする。stable 公開では正確な `windows_node_tag` も必要である。このワークフローは、いずれかの公開子ワークフローの前に Windows ソースリリースを検証し、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較したうえで、GitHub リリースドラフトを公開する前に、同じ固定済みインストーラーダイジェストと正確なコンパニオンアセットおよびチェックサム契約を昇格および検証する。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

動きの速いブランチで固定コミットの証明を行う場合は、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用する。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch の ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。この
ヘルパーは対象 SHA に一時的な `release-ci/<sha>-...` ブランチを push し、
その固定 ref から `Full Release Validation` を dispatch し、すべての子
workflow の `headSha` が対象と一致することを検証し、run の完了時に一時ブランチを削除します。包括 verifier は、いずれかの子 workflow が異なる SHA で実行された場合にも失敗します。

`release_profile` は release checks に渡されるライブ/provider の範囲を制御します。
手動 release workflow のデフォルトは `stable` です。広範な advisory provider/media matrix を意図的に使いたい場合のみ `full` を使ってください。stable と full の release checks は常に網羅的な live/E2E と Docker release-path soak を実行します。
beta profile は `run_release_soak=true` で opt in できます。

- `minimum` は最速の OpenAI/core release-critical lanes を維持します。
- `stable` は stable provider/backend セットを追加します。
- `full` は広範な advisory provider/media matrix を実行します。

包括 workflow は dispatch された子 run id を記録し、最後の `Verify full validation` job は現在の子 run の conclusion を再確認し、各子 run の slowest-job table を追記します。子 workflow を rerun して green になった場合は、包括結果とタイミング summary を更新するために親 verifier job だけを rerun してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。release candidate には `all`、通常の full CI child のみには `ci`、plugin prerelease child のみには `plugin-prerelease`、OpenClaw Performance child のみには `performance`、すべての release child には `release-checks`、または包括 workflow ではより狭い group として `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使います。これにより、集中的な修正後の失敗した release box の rerun を限定できます。1 つの失敗した cross-OS lane には、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長い cross-OS command は heartbeat line を出力し、packaged-upgrade summary には phase ごとの timing が含まれます。QA release-check lane は advisory ですが、標準 runtime tool coverage gate は例外で、必須の OpenClaw dynamic tools が標準 tier summary から drift したり消えたりした場合に block します。

`OpenClaw Release Checks` は信頼済み workflow ref を使って、選択された ref を一度だけ `release-package-under-test` tarball に解決し、その artifact を cross-OS checks と Package Acceptance に渡します。soak coverage が実行される場合は live/E2E release-path Docker workflow にも渡します。これにより、release box 間で package bytes の一貫性を保ち、同じ candidate を複数の子 job で repack することを避けます。Codex npm-plugin live lane については、release checks は `release_package_spec` から導出した一致する公開済み plugin spec を渡すか、operator が指定した `codex_plugin_spec` を渡すか、入力を空にして Docker script が選択された checkout の Codex plugin を pack するようにします。

`ref=main` かつ `rerun_group=all` の重複した `Full Release Validation` run は古い包括 run を置き換えます。親 monitor は、親が cancel されたときに、すでに dispatch した子 workflow をすべて cancel するため、新しい main validation が古い 2 時間の release-check run の後ろで待機することはありません。release branch/tag validation と focused rerun group は `cancel-in-progress: false` を維持します。

## Live と E2E shards

release live/E2E child は広範なネイティブ `pnpm test:live` coverage を維持しますが、1 つの serial job ではなく、`scripts/test-live-shard.mjs` を通じて名前付き shard として実行します。

- `native-live-src-agents` と `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割された media audio/video shards と provider-filtered music shards

これにより、同じ file coverage を保ちながら、遅い live provider の失敗を rerun および診断しやすくします。aggregate の `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` shard 名は、手動 one-shot rerun でも引き続き有効です。

ネイティブ live media shards は、`Live Media Runner Image` workflow によってビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。この image には `ffmpeg` と `ffprobe` が事前インストールされています。media job は setup 前に binary を検証するだけです。Docker-backed live suite は通常の Blacksmith runner に維持してください。container job はネストした Docker tests を起動する場所として不適切です。

Docker-backed live model/backend shards は、選択された commit ごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` image を使います。live release workflow はその image を一度だけビルドして push し、その後 Docker live model、provider-sharded gateway、CLI backend、ACP bind、Codex harness shards は `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker shards は、workflow job timeout より短い明示的な script-level `timeout` cap を持つため、container や cleanup path が stuck した場合に release-check budget 全体を消費せずに早く失敗します。これらの shard が full source Docker target を個別に rebuild している場合、その release run は誤設定されており、重複した image build で wall clock を浪費します。

## Package Acceptance

「この installable OpenClaw package は product として機能するか」が問いである場合は `Package Acceptance` を使います。これは通常の CI とは異なります。通常の CI は source tree を検証しますが、package acceptance は install または update 後にユーザーが実行するのと同じ Docker E2E harness を通じて、単一の tarball を検証します。

### Jobs

1. `resolve_package` は `workflow_ref` を checkout し、1 つの package candidate を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` artifact として upload し、source、workflow ref、package ref、version、SHA-256、profile を GitHub step summary に出力します。
2. `package_integrity` は `package-under-test` artifact を download し、`scripts/check-openclaw-package-tarball.mjs` で public package tarball contract を強制します。
3. `docker_acceptance` は、解決済み package source SHA（`workflow_ref` に fallback）と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。reusable workflow はその artifact を download し、tarball inventory を検証し、必要に応じて package-digest Docker images を準備し、workflow checkout を pack する代わりにその package に対して選択された Docker lanes を実行します。profile が複数の targeted `docker_lanes` を選択した場合、reusable workflow は package と shared images を一度だけ準備し、その後それらの lane を unique artifact を持つ並列 targeted Docker jobs として fan out します。
4. `package_telegram` は必要に応じて `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance が package を解決した場合は同じ `package-under-test` artifact を install します。standalone Telegram dispatch では、引き続き公開済み npm spec を install できます。
5. `summary` は package resolution、integrity、Docker acceptance、または任意の Telegram lane が失敗した場合に workflow を失敗させます。`advisory` input は、advisory caller 向けに acceptance failure を warning に downgrade します。

### Candidate sources

- `source=npm` は `openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw release version のみを受け付けます。公開済み extended-stable、prerelease、または stable acceptance に使います。
- `source=ref` は信頼済み `package_ref` branch、tag、または full commit SHA を pack します。resolver は OpenClaw branch/tag を fetch し、選択された commit が repository branch history または release tag から到達可能であることを検証し、detached worktree に deps を install し、`scripts/package-openclaw-for-docker.mjs` で pack します。
- `source=url` は public HTTPS `.tgz` を download します。`package_sha256` は必須です。この path は URL credentials、default 以外の HTTPS port、private/internal/special-use hostname または解決済み IP、同じ public safety policy の外への redirect を拒否します。
- `source=trusted-url` は `.github/package-trusted-sources.json` の名前付き trusted-source policy から HTTPS `.tgz` を download します。`package_sha256` と `trusted_source_id` は必須です。configured hosts、ports、path prefixes、redirect hosts、または private-network resolution が必要な maintainer-owned enterprise mirror または private package repository にのみ使います。policy が bearer auth を宣言している場合、workflow は固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を使います。URL-embedded credentials は引き続き拒否されます。
- `source=artifact` は `artifact_run_id` と `artifact_name` から 1 つの `.tgz` を download します。`package_sha256` は任意ですが、外部共有 artifact には指定するべきです。

`workflow_ref` と `package_ref` は分けておいてください。`workflow_ref` は test を実行する信頼済み workflow/harness code です。`package_ref` は `source=ref` のときに pack される source commit です。これにより、現在の test harness は古い workflow logic を実行せずに、古い信頼済み source commit を検証できます。

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — live `plugins` coverage を `plugins-offline` の代わりに使う `package` セットに加えて、`mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full` — OpenWebUI を含む full Docker release-path chunks
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須です

`package` profile は offline plugin coverage を使うため、published-package validation は live ClawHub availability によって gate されません。任意の Telegram lane は `NPM Telegram Beta E2E` で `package-under-test` artifact を再利用し、standalone dispatch 用には公開済み npm spec path を維持します。

専用の update と plugin testing policy については、local commands、
Docker lanes、Package Acceptance inputs、release defaults、failure triage を含め、
[Testing updates and plugins](/ja-JP/help/testing-updates-plugins) を参照してください。

Release checks は、prepared release package artifact、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'`、`telegram_mode=mock-openai` とともに、`source=artifact` で Package Acceptance を呼び出します。これにより、package migration、update、live ClawHub skill install、stale-plugin-dependency cleanup、configured-plugin install repair、offline plugin、plugin-update、Telegram proof を同じ解決済み package tarball 上に保ちます。beta の公開後に、rebuild せず shipped npm package に対して同じ matrix を実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance が release validation の残り部分とは異なる package を必要とする場合のみ `package_acceptance_package_spec` を設定してください。Cross-OS release checks は引き続き OS 固有のオンボーディング、installer、platform behavior を cover します。package/update product validation は Package Acceptance から始めるべきです。

`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで、実行ごとに公開済みパッケージのベースラインを 1 つ検証します。パッケージ受け入れでは、解決された `package-under-test` tarball が常に候補になり、`published_upgrade_survivor_baseline` がフォールバック用の公開済みベースラインを選択します。既定は `openclaw@latest` です。失敗したレーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定したフルリリース検証では、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` が設定され、最新 4 件の安定版 npm リリースに加えて、固定された Plugin 互換性境界リリースと、Feishu 設定、保持された bootstrap/persona ファイル、設定済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに対する issue 形状のフィクスチャへ展開されます。複数ベースラインの公開済みアップグレードサバイバー選択は、ベースラインごとにシャーディングされ、個別のターゲット Docker ランナージョブになります。別個の `Update Migration` ワークフローは、通常のフルリリース CI の広さではなく、公開済み更新のクリーンアップを網羅的に確認する場合に、`all-since-2026.4.23` ベースラインと `plugin-deps-cleanup` シナリオ付きの `update-migration` Docker レーンを使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ仕様を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定してシナリオマトリクスを指定できます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ済みレーンとインストーラー fresh レーンも、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドをインポートできることを検証します。OpenAI クロス OS agent-turn smoke は、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を既定にし、それ以外の場合は `openai/gpt-5.5` を使用します。これにより、GPT-4.x の既定を避けつつ、インストールと Gateway の証明を GPT-5 テストモデル上に保ちます。

### レガシー互換性ウィンドウ

パッケージ受け入れには、すでに公開済みのパッケージに対する有界のレガシー互換性ウィンドウがあります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリは、tarball から省略されたファイルを指していてもかまいません。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball 由来の fake git フィクスチャから欠落している pnpm `patchedDependencies` を除去でき、永続化された `update.channel` の欠落をログに出力できます。
- Plugin smoke は、レガシーのインストールレコード場所を読み取るか、マーケットプレイスのインストールレコード永続化の欠落を許容できます。
- `plugin-update` は、インストールレコードと再インストールなしの挙動が変わらないことを引き続き要求しながら、設定メタデータ移行を許可できます。

公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプファイルについても警告を出せます。また、`2026.5.20` までのパッケージでは、`npm-shrinkwrap.json` が欠落している場合に失敗ではなく警告にできます。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は警告またはスキップではなく失敗になります。

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

# Validate the published extended-stable package with package coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
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

失敗したパッケージ受け入れ実行をデバッグする場合は、`resolve_package` サマリーから開始し、パッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンド。フルリリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストール smoke

別個の `Install Smoke` ワークフローは、pull request または `main` push では実行されなくなりました。夜間スケジュール、手動 dispatch、リリース検証からの workflow call で実行され、すべての実行が GitHub ホストランナー上で完全な install-smoke パスを通ります。

- ルート Dockerfile smoke イメージはターゲット SHA ごとに 1 回ビルドされるか、`ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>` として GHCR から再利用されます。その後、CLI smoke、agents delete shared-workspace CLI smoke、コンテナ gateway-network E2E、組み込み `matrix` Plugin build-arg smoke がそのイメージに対して実行されます。Plugin smoke は、ランタイム依存関係インストールのミラーリングと、Plugin が entry-escape 診断なしで読み込まれることを検証します。
- QR パッケージインストールとインストーラー/update Docker smoke（Rocky Linux インストーラーレーン、および設定可能な `update_baseline_version` npm ベースラインに対する update レーンを含む）は個別のジョブとして実行されるため、インストーラー作業がルートイメージ smoke の後ろで待たされることはありません。

遅い Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって個別にゲートされます。これは夜間スケジュールで実行され、リリースチェックからの workflow call では既定でオンになり、手動の `Install Smoke` dispatch では opt in できます。通常の PR CI は、Node 関連の変更に対して高速な Bun ランチャー回帰レーンを引き続き実行します。QR とインストーラー Docker テストは、それぞれ独自のインストール重視 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/update/Plugin 依存関係レーン用の素の Node/Git ランナー。
- 通常の機能レーン用に同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整可能項目

| 変数                                   | 既定値  | 目的                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | プロバイダー依存のテールプールスロット数。                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | プロバイダーが throttle しないようにする同時 live レーン上限。                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | 同時 npm install レーン上限。                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 同時 multi-service レーン上限。                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker daemon の create storm を避けるためのレーン開始間隔。stagger なしの場合は `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` はレーンを実行せずにスケジューラープランを出力します。                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | カンマ区切りの正確なレーン一覧。cleanup smoke をスキップし、エージェントが失敗した 1 レーンを再現できるようにします。 |

有効上限より重いレーンでも、空のプールから開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を preflight し、古い OpenClaw E2E コンテナを削除し、アクティブレーンのステータスを出力し、longest-first 順序付けのためにレーンタイミングを永続化し、既定では最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、どのパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。次に `scripts/docker-e2e.mjs` がそのプランを GitHub outputs とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在実行中のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は Blacksmith の Docker layer cache を通じて package-digest タグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。また、再ビルドする代わりに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存の package-digest イメージを再利用します。Docker イメージの pull は、試行ごとに有界の 180 秒タイムアウトで再試行されるため、停止した registry/cache ストリームが CI クリティカルパスの大半を消費する代わりに、すばやく再試行されます。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使った小さなチャンクジョブで実行されます。これにより、各チャンクは必要なイメージ種別のみを pull し、同じ重み付きスケジューラーを通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`package-update-openai` には live Codex Plugin パッケージレーンが含まれます。このレーンは、候補 OpenClaw パッケージをインストールし、明示的な Codex CLI インストール承認のもとで `codex_plugin_spec` または同一 ref tarball から Codex Plugin をインストールし、Codex CLI preflight を実行し、その後 OpenAI に対して同一セッションの OpenClaw エージェントターンを複数実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/ランタイムエイリアスのままです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンに対する集約手動再実行エイリアスのままです。

OpenWebUI は、完全なリリースパスのカバレッジで要求される場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチの場合だけスタンドアロンの `openwebui` チャンクを維持します。バンドル済みチャネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回だけ再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、遅いレーンの表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに選択されたレーンを準備済みイメージに対して実行します。これにより、失敗したレーンのデバッグを対象を絞った 1 つの Docker ジョブに限定し、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用のライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、これらの値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、および準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

スケジュールされたライブ/E2E ワークフローは、完全なリリースパスの Docker スイートを毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、よりコストの高いプロダクト/パッケージのカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常の pull request、`main` push、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。これは、バンドル済み Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、Plugin 設定グループを同時に最大 2 つまで実行し、各グループに 1 つの Vitest ワーカーとより大きな Node ヒープを割り当てるため、インポートの多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパス（`full_release_validation` 入力で有効化）は、1〜3 分のジョブのために多数の runner を予約しないよう、対象 Docker レーンを 4 つずつのグループにまとめます。このワークフローは、`@openclaw/plugin-inspector` からの情報提供用 `plugin-inspector-advisory` アーティファクトもアップロードします。inspector の検出結果はトリアージ入力であり、ブロッキング対象の Plugin プレリリースゲートは変更しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローとは別に専用の CI レーンがあります。エージェント型パリティは、スタンドアロンの PR ワークフローではなく、広範な QA およびリリースハーネスの下にネストされています。パリティを広範な検証実行に含める必要がある場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` で毎晩および手動ディスパッチで実行されます。これは、モックパリティレーン、ライブ Matrix レーン、ライブ Telegram レーンおよび Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定論的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` および `mock-openai/gpt-5.5-alt`）を使って Matrix と Telegram のライブトランスポートレーンを実行します。これにより、チャネル契約がライブモデルのレイテンシーおよび通常のプロバイダー Plugin 起動から切り離されます。ライブトランスポート Gateway は、QA パリティがメモリ動作を別途カバーするため、メモリ検索を無効化します。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダーの各スイートでカバーされます。

Matrix は、スケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI のデフォルトおよび手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、Matrix の全カバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` も、リリース承認前にリリースクリティカルな QA Lab レーンを実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較用の小さなレポートジョブに両方のアーティファクトをダウンロードします。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープされた CI/チェックのエビデンスに従います。

## CodeQL

`CodeQL` ワークフローは、完全なリポジトリスイープではなく、意図的に絞り込まれた第 1 段階のセキュリティスキャナーです。毎日、手動、`main` push、およびドラフトではない pull request のガード実行では、Actions ワークフローコードに加えて、最もリスクの高い JavaScript/TypeScript サーフェスを、高信頼度のセキュリティクエリでスキャンし、high/critical の `security-severity` に絞り込みます。

pull request ガードは軽量のままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有するバンドル済み Plugin ランタイムパス配下の変更に対してのみ開始され、スケジュール済みワークフローと同じ高信頼度のセキュリティマトリクスを実行します。Android と macOS の CodeQL は、PR のデフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加えて、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス spawn ヘルパー、サブプロセスを所有するバンドル済み Plugin ランタイム、ワークフロースクリプトの接着部分                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー sanity が許容する最小の Blacksmith Linux runner 上で、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係のビルド結果をアップロード済み SARIF から除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次デフォルトの外に置かれています。

### クリティカル品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。GitHub-hosted Linux runner 上で、狭く高価値なサーフェスに対して、error 重要度の非セキュリティ JavaScript/TypeScript 品質クエリのみを実行します。これにより、品質スキャンが Blacksmith runner 登録予算を消費しません。その pull request ガードは、スケジュール済みプロファイルより意図的に小さくなっています。ドラフトではない PR は、触れたサーフェスに対応するシャードのみを、PR でルーティング可能な 13 個のシャード（`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary`、`session-diagnostics-boundary`）から実行します。`ui-control-plane` と `web-media-runtime-boundary` は PR 実行には含めません。CodeQL 設定および品質ワークフローの変更は、PR シャードセット全体を実行します（ネットワークランタイムシャードは、それ自身の CodeQL 設定ファイルとネットワーク所有ソースパスをキーにします）。

手動ディスパッチは以下を受け付けます。

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、マイグレーション、正規化、IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネル Plugin の実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーのディスパッチ、自動返信のディスパッチとキュー、ACP コントロールプレーンランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の接着コード、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | ネットワークポリシーパッケージ、生ソケットとプロキシキャプチャランタイム、SSH トンネル、Gateway ロック、JSONL ソケット、プッシュトランスポートサーフェス                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK のインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーのデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリポイントコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離されたままにします。これにより、品質の指摘をセキュリティシグナルを曖昧にせずにスケジュール、測定、無効化、拡張できます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルで安定したランタイムとシグナルが得られた後にのみ、スコープ指定またはシャード化されたフォローアップ作業として戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動ディスパッチで直接実行することもできます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップされます。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーできますが、その UTC 日に別のワークフロー実行による呼び出しがすでに実行済みまたは実行中の場合はスキップします。手動ディスパッチは、その日次アクティビティゲートをバイパスします。このレーンはフルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には大規模なリファクタではなく、カバレッジを保つ小さなテストパフォーマンス修正だけを行わせ、その後フルスイートレポートを再実行して、合格ベースラインのテスト数を減らす変更を拒否します。グループ化されたレポートは Linux と macOS で設定ごとのウォールタイムと最大 RSS を記録するため、前後比較では所要時間の差分に加えてテストメモリの差分も明らかになります。ベースラインに失敗しているテストがある場合、Codex は明白な失敗のみを修正でき、エージェント後のフルスイートレポートはコミット前に合格しなければなりません。bot の push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex アクションが docs agent と同じ sudo 降格の安全姿勢を保てるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複整理用の手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであること、および各重複 PR に共有された参照 Issue または重複する変更ハンクがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界に対して厳格です。

- コア本番変更は、コア本番およびコアテストの型チェックに加えて、コア lint/guard を実行します。
- コアのテストのみの変更は、コアテストの型チェックに加えてコア lint のみを実行します。
- 拡張機能の本番変更は、拡張機能の本番および拡張機能テストの型チェックに加えて、拡張機能 lint を実行します。
- 拡張機能のテストのみの変更は、拡張機能テストの型チェックに加えて拡張機能 lint を実行します。
- 公開 Plugin SDK または plugin-contract の変更は、拡張機能がそれらのコアコントラクトに依存するため、拡張機能の型チェックへ拡張されます（Vitest 拡張機能スイープは明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン更新は、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
- 不明な root/config 変更は、安全側に倒してすべてのチェックレーンを実行します。

ローカル changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。直接のテスト編集は自身を実行し、ソース編集は明示的なマッピングを優先し、その後 sibling テストとインポートグラフ依存を実行します。共有 group-room 配信設定は明示的なマッピングの 1 つです。group visible-reply 設定、ソース返信配信モード、または message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルトの変更は最初の PR push の前に失敗します。変更がハーネス全体に及び、低コストなマッピング済みセットを信頼できる代理として扱えない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux 証明のためのリポジトリ所有 remote-box ラッパーです。エージェントセッションは、テストおよび計算負荷の高い作業でデフォルトでこれを使用します。これにはビルド、型チェック、lint ファンアウト、Docker、パッケージレーン、E2E、ライブ証明、CI parity が含まれます。信頼済みメンテナーコードはデフォルトで `blacksmith-testbox` を使用し、`.crabbox.yaml` も現在はそれをデフォルトにしています。設定済みワークフローはプロバイダーとエージェント認証情報を hydrate するため、信頼できない contributor または fork のコードは、代わりにシークレットなしの fork CI またはサニタイズ済み direct AWS Crabbox を使わなければなりません。サニタイズ済み AWS 実行では `CRABBOX_ENV_ALLOW=CI` を設定し、`--no-hydrate` を渡し、新しい一時リモート `HOME` を使用します。これにより、リポジトリの `OPENCLAW_*` allowlist と既存の認証プロファイルが信頼できないコードへ到達するのを防ぎます。信頼できないそのソース専用に新しくウォームアップしたリースを使用し、信頼済みまたは以前に hydrate されたリースは決して使用しません。クリーンな信頼済み `main` チェックアウトからインストール済みの信頼済み Crabbox バイナリを起動し、`--fresh-pr` でリモート PR のみを取得します。信頼できないチェックアウトのラッパーや設定をローカルで実行してはいけません。`CRABBOX_AWS_INSTANCE_PROFILE` を unset し、解決された `aws.instanceProfile` が空でない限り fail closed します。インストール/テストの前に、信頼済みの絶対パスツールを使用して IMDSv2 トークンを必須にし、IAM 認証情報エンドポイントが 404 を返すことを証明し、リモートの `git rev-parse HEAD` をレビュー済み PR head SHA の完全値と比較します。リースをその SHA にバインドし、head が変わったら停止して再ウォームアップします。クリーンな `main` から信頼済みの `scripts/crabbox-untrusted-bootstrap.sh` を `--fresh-pr` と一緒にアップロードします。これは固定された Node/pnpm をインストールし、SHA と package-manager pin を検証し、`HOME` を分離し、依存関係をインストールしてから、要求されたテストを実行します。
すべての `CRABBOX_TAILSCALE*` override を unset し、`--network public
--tailscale=false` を強制し、exit-node/LAN フラグをクリアし、スクリプトをアップロードする前に `crabbox inspect` が Tailscale 状態なしの public networking を報告することを要求します。所有 AWS/Hetzner キャパシティは、Blacksmith 障害、クォータ問題、または明示的な所有キャパシティテストのフォールバックでもあります。

テストまたは重い証明が必要になりそうな信頼済みコードタスクの開始時に、エージェントはバックグラウンドコマンドセッションでただちに pre-warm し、hydration の実行中に調査と編集を続け、返された `tbx_...` id を再利用し、各実行で現在のチェックアウトを同期し、引き渡し前に停止するべきです。

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox-backed Blacksmith 実行は、one-shot Testbox を warm、claim、sync、run、report、cleanup します。組み込みの sync sanity check は、同期先 box の `git status --short` が少なくとも 200 件の追跡済み削除を示すと即座に失敗します。これにより `pnpm-lock.yaml` のようなルートファイルの消失を捕捉します。意図的な大量削除 PR では、リモートコマンドに `CRABBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

Crabbox は、同期後の出力がないまま sync フェーズに 5 分以上留まるローカル Blacksmith CLI 呼び出しも終了します。そのガードを無効にするには `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル差分にはより大きなミリ秒値を使用してください。

初回実行の前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、選択されたプロバイダーを advertise しない古い Crabbox バイナリを拒否します。また、Blacksmith-backed 実行では、ラッパーが現在の Testbox sync、queue、cleanup 動作を得るために Crabbox 0.22.0 以上が必要です。Codex worktree または linked/sparse checkout では、Crabbox が開始する前に pnpm が依存関係を reconcile する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトは避けてください。代わりに node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

sibling checkout を使用する場合は、timing または証明作業の前に ignored local binary を再ビルドしてください。

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` の `blacksmith:` ブロックは、org、workflow、job、ref のデフォルトをすでに固定しているため、以下の明示的なフラグは任意です。変更ゲート:

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

対象を絞ったテストの再実行:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

フルスイート:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

最後の JSON サマリーを読みます。有用なフィールドは `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委譲された
Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーが
コマンド結果です。リンクされた GitHub Actions 実行は hydration と keepalive を担当します。この実行は、SSH
コマンドがすでに返ったあとに Testbox が外部から停止された場合、`cancelled` として終了することがあります。
ラッパーの `exitCode` が非ゼロであるか、コマンド出力が失敗したテストを示していない限り、それはクリーンアップまたはステータスの成果物として扱います。
Blacksmith バックのワンショット Crabbox 実行では、Testbox は自動的に停止されるはずです。
実行が中断された場合、またはクリーンアップが不明な場合は、稼働中のボックスを確認し、自分が作成したボックスだけを停止してください:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じ hydration 済みボックスで複数のコマンドを意図的に実行する必要がある場合にのみ、再利用を使います:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

古いソースではなく、リースを再利用します。各実行で現在のチェックアウトをアップロードするために `--no-sync` は省略します。意図的に、変更されていない同期済みツリーを再実行する場合にのみ使用してください。信頼されていないコントリビューター/フォークのコードでは、すべてのコマンドで `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`、新しい一時リモート `HOME` を使用する必要があります。テスト前に、そのサニタイズ済みコマンド内で依存関係をインストールします。同じ信頼されていないソース専用に新しくウォームアップされたリースのみを再利用し、信頼済みまたは以前にハイドレートされたリースは絶対に使用しないでください。信頼されていないチェックアウトのラッパーや設定をローカルで実行してはいけません。クリーンな信頼済み `main` から、インストール済みの信頼済み Crabbox バイナリを起動し、すべての実行で `--fresh-pr` を渡します。`CRABBOX_AWS_INSTANCE_PROFILE` は未設定のままにし、解決済みインスタンスプロファイルが空でない場合は拒否し、信頼済みリモートの IMDS ロールなし証明を必須にし、インストール/テスト前にレビュー対象の head SHA を検証します。リースをその SHA に紐付け、head が変更された場合は停止して再ウォームアップします。リモート PR が存在しない場合は、シークレットなしのフォーク CI を使用します。信頼されていないソースに `hydrate-github` や認証情報でハイドレートされた Blacksmith ワークフローを選択してはいけません。

Crabbox が壊れている層で、Blacksmith 自体は動作している場合は、`list`、`status`、クリーンアップなどの診断に限って直接 Blacksmith を使用します。直接 Blacksmith 実行をメンテナー証明として扱う前に、Crabbox パスを修正してください。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するものの、新しいウォームアップが数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、請求、または org 制限の負荷として扱います。作成したキュー中の id を停止し、それ以上 Testbox を開始するのを避け、誰かが Blacksmith ダッシュボード、請求、org 制限を確認している間、下記の所有 Crabbox キャパシティパスへ証明を移します。

Blacksmith がダウンしている、クォータ制限がある、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

AWS の負荷下では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` は避けてください。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は、`class: standard`、オンデマンドマーケット、`capacity.hints: true` をデフォルトにしているため、仲介された AWS リースでは選択されたリージョン/マーケット、クォータ負荷、Spot フォールバック、高負荷クラス警告が表示されます。より重い広範なチェックには `fast` を使用し、standard/fast で不十分な場合にのみ `large` を使用し、`beast` はフルスイートまたは全 Plugin Docker マトリクス、明示的なリリース/ブロッカー検証、高コア性能プロファイリングなど、例外的な CPU バウンドレーンにのみ使用してください。`pnpm check:changed`、フォーカスされたテスト、docs のみの作業、通常の lint/typecheck、小規模 E2E 再現、Blacksmith 障害トリアージに `beast` を使用しないでください。Spot マーケットの変動がシグナルに混ざらないように、キャパシティ診断には `--market on-demand` を使用します。

`.crabbox.yaml` はプロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。Crabbox 同期は `.git` を転送しないため、ハイドレートされた Actions チェックアウトは、メンテナーローカルのリモートやオブジェクトストアを同期する代わりに、独自のリモート Git メタデータを保持します。また、リポジトリ設定は、転送してはならないローカルランタイム/ビルド成果物（`.artifacts` やテストレポートなど）も除外します。`.github/workflows/crabbox-hydrate.yml` は、所有クラウドの `crabbox run --id <cbx_id>` コマンドのために、チェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、非シークレット環境の引き渡しを所有します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
