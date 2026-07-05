---
read_when:
    - CI ジョブが実行された理由、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整している
    - ClawSweeper のディスパッチまたは GitHub アクティビティ転送を変更している
summary: CI ジョブグラフ、スコープゲート、リリース包括、ローカルコマンド相当物
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-05T11:08:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0462c4fe6ce0aacac5fe303cea1181b11822fc44b2d6a2fe4102ca59ce68539e
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は `main` へのプッシュ（Markdown と `docs/**` パスはトリガー時に無視）、非ドラフトのプルリクエスト（CHANGELOG のみの差分は無視）、および手動ディスパッチで実行されます。正規の `main` プッシュは、まず 90 秒のホステッドランナー受付ウィンドウを通過します。`CI` concurrency group は新しいコミットが入ると待機中の実行をキャンセルするため、連続したマージごとに Blacksmith matrix 全体が登録されることはありません。プルリクエストと手動ディスパッチはこの待機をスキップします。その後、`preflight` ジョブが差分を分類し、関係のない領域だけが変更された場合は高コストのレーンをオフにします。手動の `workflow_dispatch` 実行は、リリース候補と広範な検証のために意図的にスマートスコープを迂回し、グラフ全体に展開します。Android レーンは `include_android`（または `release_gate` 入力）を通じてオプトインのままです。リリース専用の Plugin カバレッジは別個の [`Plugin プレリリース`](#plugin-prerelease) ワークフローにあり、[`フルリリース検証`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                                | 目的                                                                                                                                                                                            | 実行タイミング                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | docs-only 変更、変更されたスコープ、変更された extensions を検出し、CI manifest をビルドする                                                                                                            | 非ドラフトのプッシュと PR で常に実行                  |
| `runner-admission`                 | Blacksmith 作業が登録される前に、正規の `main` プッシュに対してホステッド環境で 90 秒のデバウンスを行う                                                                                                         | すべての CI 実行。正規の `main` プッシュでのみ sleep |
| `security-fast`                    | 秘密鍵の検出、`zizmor` による変更済みワークフロー監査、本番 lockfile 監査                                                                                                          | 非ドラフトのプッシュと PR で常に実行                  |
| `pnpm-store-warmup`                | Linux Node shards をブロックせずに、lockfile で固定された pnpm store キャッシュをウォームする                                                                                                                       | Node または docs-check レーンが選択された場合                   |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI smoke チェック、起動メモリ、埋め込みビルド成果物チェックをビルドする                                                                                              | Node 関連の変更                               |
| `checks-fast-core`                 | 高速な Linux 正当性レーン: bundled + protocol、QA Smoke CI、Bun launcher、CI-routing fast task                                                                                          | Node 関連の変更                               |
| `checks-fast-contracts-plugins-*`  | 重み付けされた 2 つの Plugin contract shards                                                                                                                                                                | Node 関連の変更                               |
| `checks-fast-contracts-channels-*` | 重み付けされた 2 つの channel contract shards                                                                                                                                                               | Node 関連の変更                               |
| `checks-node-*`                    | channel、bundled、contract、extension レーンを除外した Core Node test shards                                                                                                                   | Node 関連の変更                               |
| `check-*`                          | shard 化された main local gate 相当: guards、shrinkwrap、bundled-channel config metadata、prod types、lint、dependencies、test types                                                                | Node 関連の変更                               |
| `check-additional-*`               | 境界チェックのストライプ（prompt snapshot drift を含む）、session accessor/transcript reader 境界、extension lint groups、package boundary compile/canary、runtime topology architecture | Node 関連の変更                               |
| `checks-node-compat-node22`        | Node 22 互換性ビルドと smoke レーン                                                                                                                                                         | リリース用の手動 CI ディスパッチ                     |
| `check-docs`                       | ドキュメントのフォーマット、lint、broken-link チェック                                                                                                                                                      | Docs が変更された場合（PR と手動ディスパッチ）              |
| `native-i18n`                      | ネイティブアプリ、Android、Apple i18n inventory チェック                                                                                                                                               | ネイティブ i18n 関連の変更                        |
| `skills-python`                    | Python-backed Skills の Ruff + pytest                                                                                                                                                             | Python-skill 関連の変更                       |
| `checks-windows`                   | Windows 固有の process/path テストと、共有ランタイム import specifier regression                                                                                                               | Windows 関連の変更                            |
| `macos-node`                       | focused macOS TypeScript テスト: launchd、Homebrew、runtime paths、packaging scripts、process-group wrapper                                                                                         | macOS 関連の変更                              |
| `macos-swift`                      | macOS アプリの Swift lint、ビルド、テスト                                                                                                                                                     | macOS 関連の変更                              |
| `ios-build`                        | Xcode project generation と iOS app simulator build                                                                                                                                          | iOS app、shared app kit、または Swabble の変更         |
| `android`                          | 両フレーバーの Android unit tests と 1 つの debug APK build                                                                                                                                       | Android 関連の変更                            |
| `test-performance-agent`           | 別ワークフロー: 信頼済みアクティビティ後の毎日の Codex slow-test optimization                                                                                                                       | Main CI success または手動ディスパッチ                  |
| `openclaw-performance`             | 別ワークフロー: mock-provider、deep-profile、GPT 5.5 live レーンを含む毎日/オンデマンドの Kova runtime performance reports                                                                       | スケジュール実行と手動ディスパッチ                       |

## fail-fast の順序

1. `runner-admission` は正規の `main` プッシュでのみ待機します。新しいプッシュがあると、Blacksmith 登録前にその実行がキャンセルされます。
2. `preflight` は、どのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックはこのジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、より重い成果物ジョブやプラットフォーム matrix ジョブを待たずにすばやく失敗します。
4. `build-artifacts` は高速な Linux レーンと重なって実行されるため、共有ビルドが準備でき次第、下流の利用側が開始できます。
5. その後、より重いプラットフォームおよびランタイムレーンが展開されます: `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android`。

同じ PR または `main` ref に新しいプッシュが入ると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新実行も失敗している場合を除き、これは CI ノイズとして扱ってください。Matrix ジョブは `fail-fast: false` を使用し、`build-artifacts` は小さな verifier ジョブをキューに入れる代わりに、embedded channel、core-support-boundary、gateway-watch の失敗を直接報告します。自動 CI concurrency key はバージョン付き（`CI-v7-*`）のため、古い queue group にある GitHub 側の zombie が新しい main 実行を無期限にブロックすることはありません。手動の full-suite 実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。

GitHub Actions から wall time、queue time、最も遅いジョブ、失敗、`pnpm-store-warmup` fanout barrier を要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。ワークフロー内の `ci-timings-summary` ジョブは `ci.yml` に存在しますが、現在は無効化されています（`if: false`）。代わりにローカルで timing helper を実行してください。ビルド時間については、`build-artifacts` ジョブの `Build dist` ステップを確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。このジョブは `startup-memory` artifact もアップロードします。

## PR context と evidence

外部コントリビューターの PR は、`.github/workflows/real-behavior-proof.yml` から PR context と evidence gate を実行します。このワークフローは信頼済みのワークフローリビジョン（`github.workflow_sha`）をチェックアウトし、PR 本文のみを評価します。コントリビューター branch のコードは実行しません。

この gate は、リポジトリの owners、members、collaborators、bots ではない PR author に適用されます。PR 本文に author による `What Problem This Solves` と `Evidence` セクションが含まれている場合に合格します。Evidence には、focused test、CI result、screenshot、recording、terminal output、live observation、redacted log、artifact link を使用できます。本文は意図と有用な検証を提供します。reviewer はコード、テスト、CI を確認して正しさを評価します。

チェックが失敗した場合は、別の code commit を push するのではなく、PR 本文を更新してください。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` の unit tests でカバーされています。手動ディスパッチは changed-scope detection をスキップし、preflight manifest がすべてのスコープ領域が変更されたかのように動作させます。

- **CI ワークフローの編集**は Node CI グラフ、ワークフロー lint、Windows レーン（`ci.yml` が実行）を検証しますが、それだけで iOS、Android、macOS のネイティブビルドを強制することはありません。これらのプラットフォームレーンは、プラットフォームのソース変更にスコープされたままです。
- **ワークフロー健全性**は、すべてのワークフロー YAML ファイルに対する `actionlint`、`zizmor`、複合アクション補間ガード、競合マーカーガードを実行します。PR スコープの `security-fast` ジョブも、変更されたワークフローファイルに対して `zizmor` を実行するため、ワークフローのセキュリティ検出はメイン CI グラフ内で早期に失敗します。
- **`main` プッシュ時のドキュメント**は、CI と同じ ClawHub ドキュメントミラーを使用するスタンドアロンの `Docs` ワークフローでチェックされるため、コードとドキュメントが混在するプッシュでも CI の `check-docs` シャードは追加でキューに入りません。プルリクエストと手動 CI では、ドキュメントが変更された場合に引き続き CI から `check-docs` を実行します。
- **TUI PTY**は、TUI 変更用の `checks-node-core-runtime-tui-pty` Linux Node シャードで実行されます。このシャードは `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 付きで `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定的な `TuiBackend` フィクスチャレーンと、外部モデルエンドポイントのみをモックする低速な `tui --local` スモークの両方をカバーします。
- **CI ルーティングのみの編集、高速タスクが直接実行する少数の core-test フィクスチャ、狭い Plugin コントラクトヘルパーの編集**は、高速な Node のみのマニフェストパスを使用します。対象は `preflight`、`security-fast`、および変更が触れる高速レーンのみ、つまり単一の `checks-fast-core` CI ルーティングタスク、2 つの Plugin コントラクトシャード、またはその両方です。このパスでは、ビルド成果物、Node 22 互換性、チャネルコントラクト、フルコアシャード、バンドル Plugin シャード、追加のガードマトリクスをスキップします。
- **Windows Node チェック**は、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフロー面にスコープされます。無関係なソース、Plugin、インストールスモーク、テストのみの変更は Linux Node レーンのままです。

最も遅い Node テストファミリーは、各ジョブがランナーを過剰に予約せず小さく保たれるように分割またはバランス調整されています。

- Plugin コントラクトとチャネルコントラクトは、それぞれ標準の GitHub ランナーフォールバック付きで、重み付けされた Blacksmith バックエンドの 2 シャードとして実行されます。
- コアユニットの高速/サポートレーンは別々に実行されます。コアランタイムインフラは、プロセス、共有、フック、シークレット、3 つの Cron ドメインシャードに分割されます。
- 自動返信はバランス調整されたワーカーとして実行され、返信サブツリーは agent-runner、commands、dispatch、session、state-routing シャードに分割されます。
- Agentic Gateway/サーバー（コントロールプレーン）設定は、ビルド済み成果物を待つ代わりに、chat、auth、model、HTTP/plugin、runtime、startup レーンに分割されます。
- 通常の CI は、分離されたインフラの include-pattern シャードのみを、最大 64 テストファイルの決定的なバンドルに詰め込みます。これにより、非分離の command/cron、ステートフルな agents-core、Gateway/サーバースイートを統合せずに Node マトリクスを削減します。重い固定スイートは 8 vCPU のままにし、バンドルされた低ウェイトのレーンは 4 vCPU を使用します。
- 正規リポジトリ上のプルリクエストは、コンパクトな受け入れプランを使用します。同じ設定ごとのグループが分離サブプロセスで実行され、現在は 74 ジョブのフルマトリクスではなく 18 個の Node テストジョブです。`main` プッシュ、手動ディスパッチ、リリースゲートではフルマトリクスを維持します。
- 広範なブラウザ、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest 設定を使用します。include-pattern シャードは CI シャード名を使ってタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できます。
- `check-additional-*` は、補助的な境界ガードリスト（`scripts/run-additional-boundary-checks.mjs`）を、プロンプト負荷の高い 1 つのシャード（`check-additional-boundaries-a`、Codex プロンプトスナップショットドリフトチェックを含む）と、残りのストライプ用の 1 つの結合シャード（`check-additional-boundaries-bcd`）に分割します。それぞれが独立したガードを並行実行し、チェックごとのタイミングを出力します。パッケージ境界のコンパイル/カナリア作業はまとめたままにし、ランタイムトポロジーアーキテクチャは `build-artifacts` に組み込まれた Gateway watch カバレッジとは別に実行します。
- Gateway watch、チャネルテスト、コアサポート境界シャードは、`dist/` と `dist-runtime/` がすでにビルドされた後、`build-artifacts` 内で並行実行されます。

受け入れ後、正規 Linux CI は最大 24 個の Node テストジョブと、
小規模な fast/check レーン用に 12 個の並行実行を許可します。Windows と Android は、
これらのランナープールが狭いため 2 個のままです。コンパクトな設定全体のバッチは
120 分のバッチタイムアウトで実行され、include-pattern グループは同じ制限付き
ジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。サードパーティフレーバーには個別のソースセットやマニフェストはありません。そのユニットテストレーンは、SMS/通話ログの BuildConfig フラグ付きでフレーバーを引き続きコンパイルしつつ、Android 関連の各プッシュで debug APK パッケージングジョブを重複実行することを避けます。

`check-dependencies` シャードは `pnpm deadcode:dependencies`（正確な Knip バージョンに固定され、`dlx` インストールでは pnpm の最小リリース経過時間を無効にした、本番用 Knip 依存関係のみのパス）と `pnpm deadcode:unused-files` を実行します。後者は Knip の本番未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。さらに、助言的な `pnpm deadcode:report:ci:ts-unused` レポートを `deadcode-reports` 成果物としてアップロードします。未使用ファイルガードは、PR が新しい未レビューの未使用ファイルを追加した場合、または古い許可リストエントリを残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な動的 Plugin、生成物、ビルド、ライブテスト、パッケージブリッジ面は保持します。

## ClawSweeper アクティビティ転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティを ClawSweeper に渡すターゲット側ブリッジです。信頼されていないプルリクエストコードをチェックアウトしたり実行したりしません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` にディスパッチします。

このワークフローには 4 つのレーンがあります。

- 正確な issue およびプルリクエストレビュー要求用の `clawsweeper_item`;
- issue コメント内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`;
- `main` プッシュ上のコミットレベルレビュー要求用の `clawsweeper_commit_review`;
- ClawSweeper エージェントが調査できる一般的な GitHub アクティビティ用の `github_activity`。

`github_activity` レーンは、正規化されたメタデータのみを転送します。イベントタイプ、アクション、アクター、リポジトリ、項目番号、URL、タイトル、状態、および存在する場合はコメントまたはレビューの短い抜粋です。完全な Webhook 本文を転送しないことを意図しています。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` で、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway フックに投稿します。

一般アクティビティは観測であり、デフォルト配信ではありません。ClawSweeper エージェントはプロンプト内で Discord ターゲットを受け取り、イベントが意外、対応可能、リスクあり、または運用上有用な場合にのみ `#clawsweeper` に投稿するべきです。通常のオープン、編集、ボットの変動、重複 Webhook ノイズ、通常のレビュー通信は `NO_REPLY` になるべきです。

この経路全体で、GitHub のタイトル、コメント、本文、レビューテキスト、ブランチ名、コミットメッセージは信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ付きレーンを強制的にオンにします。Linux Node シャード、バンドル Plugin シャード、Plugin およびチャネルコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物スモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、iOS ビルド、Control UI i18n です。スタンドアロンの手動 CI ディスパッチは、`include_android=true` の場合にのみ Android を実行します（`release_gate` 入力も Android を強制します）。フルリリースの包括ワークフローは `include_android=true` を渡すことで Android を有効化します。Plugin プレリリース静的チェック、リリース専用の `agentic-plugins` シャード、完全な拡張機能バッチスイープ、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別個の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行は一意の concurrency グループを使用するため、リリース候補のフルスイートが同じ ref 上の別のプッシュや PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼済みの呼び出し元は、選択されたディスパッチ ref のワークフローファイルを使用しながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できます。`release_gate` 入力は、キャパシティ不足で停滞した PR CI 向けの正確な SHA のメンテナーフォールバックです。これは `target_ref` がディスパッチされたブランチヘッドと一致する完全なコミット SHA であることを要求します。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

月次の npm のみの extended-stable パスは例外です。`OpenClaw NPM
Release` プリフライトと `Full Release Validation` の両方を正確な
`extended-stable/YYYY.M.33` ブランチからディスパッチし、それらの実行 ID を保持し、その両方の ID を
直接 npm publish 実行に渡します。コマンド、正確な ID 要件、レジストリの読み戻し、セレクター
修復手順については、[月次 npm のみ extended-stable
公開](/ja-JP/reference/RELEASING#monthly-npm-only-extended-stable-publication) を参照してください。
このパスは Plugin、macOS、Windows、GitHub
Release、private dist-tag、その他のプラットフォーム公開をディスパッチしません。

## ランナー

| ランナー                        | ジョブ                                                                                                                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI ディスパッチと非標準リポジトリのフォールバック、CodeQL のセキュリティおよび品質スキャン、workflow-sanity、labeler、auto-response、単独の Docs ワークフロー、Install Smoke ワークフロー全体                                                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | QA Smoke CI を除く `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、`checks-fast-core`、Plugin/チャネル契約シャード、ほとんどのバンドル済み/軽量 Linux Node シャード、`check-lint` を除く `check-*` レーン、選択された `check-additional-*` シャード、`check-docs`、`skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持されている重い Linux Node スイート、境界/拡張の重い `check-additional-*` シャード、`android`                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI、CI と Testbox の `build-artifacts`、`check-lint`（8 vCPU では節約分よりコストが大きいほど CPU に敏感）                                                                                                                                                                             |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。フォークは `macos-15` にフォールバック                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` と `ios-build`。フォークは `macos-26` にフォールバック                                                                                                                                                                                                      |

## ランナー登録予算

OpenClaw の現在の GitHub ランナー登録バケットは、`ghx api rate_limit` で 5 分あたり 10,000 件のセルフホストランナー登録を報告します。GitHub がこのバケットを変更する可能性があるため、各チューニング作業の前に `actions_runner_registration` を再確認してください。この制限は `openclaw` organization 内のすべての Blacksmith ランナー登録で共有されるため、別の Blacksmith インストールを追加しても新しいバケットは追加されません。

Blacksmith ラベルをバースト制御の希少リソースとして扱います。ルーティング、通知、要約、シャード選択、または短い CodeQL スキャンのみを行うジョブは、測定済みの Blacksmith 固有の必要性がない限り、GitHub ホストランナー上に留めるべきです。新しい Blacksmith マトリックス、より大きい `max-parallel`、または高頻度ワークフローは、最悪ケースの登録数を示し、organization レベルの目標をライブバケットのおよそ 60% 未満に維持する必要があります。現在の 10,000 登録バケットでは、これは 6,000 登録の運用目標を意味し、並行リポジトリ、リトライ、バーストの重なりのための余裕を残します。

標準リポジトリの CI は、通常の push と pull-request 実行のデフォルトランナーパスとして Blacksmith を維持します。`workflow_dispatch` と非標準リポジトリの実行は GitHub ホストランナーを使用しますが、通常の標準実行は現在、Blacksmith のキュー健全性を確認したり、Blacksmith が利用できない場合に GitHub ホストラベルへ自動フォールバックしたりしません。

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

`OpenClaw Performance` は製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でディスパッチできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチは通常、ワークフロー ref をベンチマークします。リリースタグまたは別のブランチを現在のワークフロー実装でベンチマークするには、`target_ref` を設定します。公開済みレポートパスと latest ポインターはテスト対象 ref をキーにし、各 `index.md` はテスト対象 ref/SHA、ワークフロー ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターを記録します。

このワークフローは、ピン留めされたリリースから OCM を、ピン留めされた `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を持つローカルビルドランタイムに対する Kova 診断シナリオ。
- `mock-deep-profile`: 起動、gateway、agent-turn のホットスポットに対する CPU/heap/trace プロファイリング。スケジュール時、または `deep_profile=true` を指定したディスパッチ時に実行されます。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.5` agent turn。`OPENAI_API_KEY` が利用できない場合はスキップされます。スケジュール時、または `live_openai_candidate=true` を指定したディスパッチ時に実行されます。

mock-provider レーンは、Kova パス後に OpenClaw ネイティブのソースプローブも実行します。デフォルト、スキップされたチャネル、内部フック、50 Plugin 起動ケースにおける gateway 起動時間とメモリ、バンドル済み Plugin インポート RSS、繰り返し mock-OpenAI `channel-chat-baseline` hello ループ、起動済み gateway に対する CLI 起動コマンド、SQLite 状態 smoke パフォーマンスプローブです。テスト対象 ref の前回公開済み mock-provider ソースレポートが利用可能な場合、ソース要約は現在の RSS と heap 値をそのベースラインと比較し、大きな RSS 増加を `watch` としてマークします。ソースプローブの Markdown 要約はレポートバンドル内の `source/index.md` にあり、生 JSON がその横にあります。

すべてのレーンは GitHub アーティファクトをアップロードします。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、ワークフローは `report.json`、`report.md`、バンドル、`index.md`、ソースプローブアーティファクトも `openclaw/clawgrit-reports` の `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` として書き込まれます。

## フルリリース検証

`Full Release Validation` は「リリース前にすべて実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動 `CI` ワークフロー（Android を含む）をディスパッチし、リリース専用の Plugin/パッケージ/static/Docker 証明のために `Plugin Prerelease` をディスパッチし、ターゲット SHA に対して `OpenClaw Performance` をディスパッチし、インストール smoke、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチします（アドバイザリ成熟度スコアカードのレンダリングは `run_maturity_scorecard` によるオプトインです）。stable および full プロファイルは、徹底的な live/E2E と Docker リリースパス soak カバレッジを常に含みます。beta プロファイルは `run_release_soak=true` でオプトインできます。標準パッケージ Telegram E2E は Package Acceptance 内で実行されるため、full candidate は重複する live poller を開始しません。公開後は、`release_package_spec` を渡して、リリースチェック、Package Acceptance、Docker、クロス OS、Telegram の間で、再ビルドせずに出荷済み npm パッケージを再利用します。公開済みパッケージ Telegram の集中的な再実行にのみ `npm_telegram_package_spec` を使用します。Codex Plugin の live パッケージレーンは、デフォルトで同じ選択済み状態を使用します。公開済み `release_package_spec=openclaw@<tag>` は `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA/アーティファクト実行は選択された ref から `extensions/codex` を pack します。`npm:`、`npm-pack:`、`git:` 仕様などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定します。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、集中的な再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。リリースタグが存在し、OpenClaw npm preflight が成功した後（preflight はチェックの中で `pnpm plugins:sync:check` を実行します）、`release/YYYY.M.PATCH` または `main` からディスパッチします。保存済みの `preflight_run_id` と成功した `full_release_validation_run_id` が必要で、公開可能なすべての Plugin パッケージのために `Plugin NPM Release` をディスパッチし、同じリリース SHA のために `Plugin ClawHub Release` をディスパッチし、その後にのみ `OpenClaw NPM Release` をディスパッチします。stable 公開には正確な `windows_node_tag` も必要です。このワークフローは Windows ソースリリースを検証し、公開子ワークフローの前に、その x64/ARM64 インストーラーを候補承認済みの `windows_node_installer_digests` 入力と比較します。その後、GitHub リリースドラフトを公開する前に、同じピン留め済みインストーラーダイジェストに加え、正確なコンパニオンアセットとチェックサム契約を昇格して検証します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

高速に変化するブランチ上のピン留めコミット証明には、`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用してください。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローディスパッチの ref はブランチまたはタグである必要があり、生のコミット SHA は使えません。この
ヘルパーはターゲット SHA に一時的な `release-ci/<sha>-...` ブランチをプッシュし、
その固定 ref から `Full Release Validation` をディスパッチし、すべての子
ワークフローの `headSha` がターゲットと一致することを検証し、
実行完了時に一時ブランチを削除します。包括検証も、いずれかの子ワークフローが
異なる SHA で実行されていた場合は失敗します。

`release_profile` は、リリースチェックに渡すライブ/プロバイダーの範囲を制御します。
手動リリースワークフローのデフォルトは `stable` です。広範な助言的プロバイダー/メディア行列を
意図的に必要とする場合にのみ `full` を使用してください。stable と full の
リリースチェックは常に、網羅的なライブ/E2E と Docker リリースパスのソークを実行します。
beta プロファイルは `run_release_soak=true` でオプトインできます。

- `minimum` は最速の OpenAI/コアのリリースクリティカルなレーンを維持します。
- `stable` は stable のプロバイダー/バックエンドセットを追加します。
- `full` は広範な助言的プロバイダー/メディア行列を実行します。

包括ワークフローはディスパッチされた子実行 ID を記録し、最後の `Verify full validation` ジョブは現在の子実行の結論を再チェックし、各子実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功した場合は、親の検証ジョブだけを再実行して、包括結果とタイミング概要を更新してください。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI 子のみには `ci`、Plugin プレリリース子のみには `plugin-prerelease`、OpenClaw Performance 子のみには `performance`、すべてのリリース子には `release-checks`、または包括側のより狭いグループとして `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、集中的な修正後に失敗したリリースボックスの再実行範囲を限定できます。1 つのクロス OS レーンが失敗した場合は、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長いクロス OS コマンドは Heartbeat 行を出力し、packaged-upgrade の概要にはフェーズごとのタイミングが含まれます。QA リリースチェックレーンは、標準ランタイムツールカバレッジゲートを除き助言的です。このゲートは、必須の OpenClaw 動的ツールが標準ティア概要からずれたり消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使って選択された ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。ソークカバレッジを実行する場合は、ライブ/E2E リリースパス Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、同じ候補を複数の子ジョブで再パックすることを避けられます。Codex npm-plugin ライブレーンでは、リリースチェックは `release_package_spec` から派生した一致する公開済み Plugin spec を渡すか、オペレーター指定の `codex_plugin_spec` を渡すか、入力を空にして Docker スクリプトが選択されたチェックアウトの Codex Plugin をパックするようにします。

`ref=main` および `rerun_group=all` の重複した `Full Release Validation` 実行は、
古い包括実行を置き換えます。親モニターは、親がキャンセルされたときに
すでにディスパッチ済みの子ワークフローをキャンセルするため、新しい main 検証が
古い 2 時間のリリースチェック実行の後ろで待機しません。リリースブランチ/タグの
検証と集中的な再実行グループでは `cancel-in-progress: false` を維持します。

## ライブおよび E2E シャード

リリースのライブ/E2E 子は広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つの直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents` と `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- プロバイダーでフィルターされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディアの音声/動画シャードと、プロバイダーでフィルターされた音楽シャード

これにより、同じファイルカバレッジを維持しつつ、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約名である `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` の各シャード名は、手動の単発再実行でも有効なままです。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされています。メディアジョブはセットアップ前にバイナリだけを検証します。Docker backed のライブスイートは通常の Blacksmith ランナー上に維持してください。コンテナジョブはネストした Docker テストを起動する場所として適切ではありません。

Docker backed のライブモデル/バックエンドシャードは、選択されたコミットごとに別個の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` イメージを使用します。ライブリリースワークフローはそのイメージを一度ビルドしてプッシュし、その後 Docker ライブモデル、プロバイダーでシャードされた Gateway、CLI バックエンド、ACP bind、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードは、ワークフロージョブのタイムアウトより短い明示的なスクリプトレベルの `timeout` 上限を持ち、停止したコンテナやクリーンアップ経路がリリースチェック全体の予算を消費せずに素早く失敗するようにします。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドしている場合、そのリリース実行は設定ミスであり、重複したイメージビルドに実時間を浪費します。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージは製品として動作するか」が問題である場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、ユーザーがインストールまたは更新後に実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub ステップ概要にソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `package_integrity` は `package-under-test` アーティファクトをダウンロードし、`scripts/check-openclaw-package-tarball.mjs` で公開パッケージ tarball 契約を強制します。
3. `docker_acceptance` は、解決済みパッケージソース SHA（`workflow_ref` にフォールバック）と `package_artifact_name=package-under-test` で `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能ワークフローはそのアーティファクトをダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数のターゲット `docker_lanes` を選択した場合、再利用可能ワークフローはパッケージと共有イメージを一度準備し、その後それらのレーンを一意のアーティファクトを持つ並列ターゲット Docker ジョブとして展開します。
4. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決した場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、引き続き公開済み npm spec をインストールできます。
5. `summary` は、パッケージ解決、整合性、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。`advisory` 入力は、助言的な呼び出し元に対して受け入れ失敗を警告に格下げします。

### 候補ソース

- `source=npm` は、`openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンのみを受け付けます。公開済み extended-stable、プレリリース、または stable の受け入れに使用します。
- `source=ref` は、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを取得し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離された worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。この経路は、URL 認証情報、デフォルト以外の HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済み IP、同じ公開安全ポリシーの外へのリダイレクトを拒否します。
- `source=trusted-url` は、`.github/package-trusted-sources.json` の名前付き信頼ソースポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。設定済みホスト、ポート、パスプレフィックス、リダイレクトホスト、またはプライベートネットワーク解決を必要とする、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用してください。ポリシーが bearer 認証を宣言している場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL に埋め込まれた認証情報は引き続き拒否されます。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有アーティファクトでは指定するべきです。

`workflow_ref` と `package_ref` は分けておいてください。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は `source=ref` のときにパックされるソースコミットです。これにより、現在のテストハーネスで、古いワークフロー論理を実行せずに古い信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `plugins-offline` の代わりにライブ `plugins` カバレッジを使う `package` セットに、`mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui` を追加したもの
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージ検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは `NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用し、公開済み npm spec 経路はスタンドアロンディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance 入力、リリースデフォルト、失敗時のトリアージを含む、専用の更新および Plugin テストポリシーについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

リリースチェックは、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'`、および `telegram_mode=mock-openai` とともに、`source=artifact` で Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub Skills インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin のインストール修復、オフライン Plugin、Plugin 更新、Telegram 証明が、同じ解決済みパッケージ tarball 上に維持されます。beta の公開後に、再ビルドせずに出荷済み npm パッケージに対して同じ行列を実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance がリリース検証の他部分とは異なるパッケージを必要とする場合にのみ、`package_acceptance_package_spec` を設定してください。クロス OS リリースチェックは引き続き、OS 固有のオンボーディング、インストーラー、プラットフォーム動作をカバーします。パッケージ/更新の製品検証は Package Acceptance から始めるべきです。

`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで 1 回の実行につき 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決された `package-under-test` tarball が常に候補となり、`published_upgrade_survivor_baseline` がフォールバックの公開済みベースラインを選択し、デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドはそのベースラインを保持します。`run_release_soak=true` または `release_profile=full` を指定した完全リリース検証は、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加えて、固定された Plugin 互換性境界リリースと、Feishu 設定、保持された bootstrap/persona ファイル、構成済み OpenClaw Plugin インストール、チルダログパス、古いレガシー Plugin 依存関係ルートに関する issue 形状のフィクスチャへ展開します。複数ベースラインの公開済みアップグレードサバイバー選択は、ベースラインごとに個別のターゲット Docker ラナージョブへシャーディングされます。通常の完全リリース CI の広さではなく、公開済み更新のクリーンアップを網羅的に確認する場合は、別の `Update Migration` ワークフローが `all-since-2026.4.23` ベースラインと `plugin-deps-cleanup` シナリオを指定して `update-migration` Docker レーンを使用します。ローカル集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ仕様を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンを維持するか、シナリオマトリクス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定できます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを構成し、レシピ手順を `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows パッケージ版とインストーラーの fresh レーンも、インストール済みパッケージが生の絶対 Windows パスから browser-control オーバーライドをインポートできることを検証します。OpenAI クロス OS agent-turn smoke は、設定されていればデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、そうでなければ `openai/gpt-5.5` を使用します。これにより、インストールと gateway の証明は GPT-4.x のデフォルトを避けつつ、GPT-5 テストモデル上に維持されます。

### レガシー互換性ウィンドウ

Package Acceptance には、すでに公開済みのパッケージに対して境界付きのレガシー互換性ウィンドウがあります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリは、tarball から省略されたファイルを指す場合があります。
- パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップする場合があります。
- `update-channel-switch` は、tarball 由来のフェイク git フィクスチャから欠落した pnpm `patchedDependencies` を刈り込む場合があり、永続化された `update.channel` の欠落をログ出力する場合があります。
- Plugin smoke は、レガシーのインストールレコード場所を読み取る場合や、marketplace インストールレコードの永続化欠落を許容する場合があります。
- `plugin-update` は、インストールレコードと再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許容する場合があります。

公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプファイルについても警告する場合があります。また、`2026.5.20` までのパッケージは、`npm-shrinkwrap.json` が欠落している場合に失敗ではなく警告にできます。それ以降のパッケージは現代の契約を満たす必要があります。同じ条件は警告やスキップではなく失敗になります。

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

失敗した package acceptance 実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、SHA-256 を確認します。次に、`docker_acceptance` 子実行とその Docker アーティファクトを調べます。対象は `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズタイミング、再実行コマンドです。完全リリース検証を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先してください。

## インストール smoke

別個の `Install Smoke` ワークフローは、pull request や `main` push ではもう実行されません。nightly スケジュール、手動 dispatch、リリース検証からの workflow call で実行され、すべての実行が GitHub ホストランナー上で完全な install-smoke パスを取ります。

- ルート Dockerfile smoke イメージはターゲット SHA ごとに 1 回ビルドされる（または GHCR から `ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>` として再利用される）だけで、その後 CLI smoke、agents delete shared-workspace CLI smoke、container gateway-network E2E、バンドルされた `matrix` Plugin build-arg smoke がそれに対して実行されます。Plugin smoke は、ランタイム依存関係インストールのミラーリングと、entry-escape 診断なしで Plugin が読み込まれることを検証します。
- QR パッケージインストールとインストーラー/update Docker smoke（Rocky Linux インストーラーレーン、および構成可能な `update_baseline_version` npm ベースラインに対する update レーンを含む）は、インストーラー作業がルートイメージ smoke の後ろで待機しないように、別ジョブとして実行されます。

遅い Bun グローバルインストール image-provider smoke は、`run_bun_global_install_smoke` によって別個にゲートされます。nightly スケジュールで実行され、リリースチェックからの workflow call ではデフォルトで有効になり、手動の `Install Smoke` dispatch ではこれにオプトインできます。通常の PR CI は、Node 関連変更に対して高速な Bun launcher 回帰レーンを引き続き実行します。QR とインストーラー Docker テストは、それぞれインストールに重点を置いた独自の Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回パックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー/update/Plugin 依存関係レーン用の最小 Node/Git ランナー。
- 通常の機能レーン用に、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールスロット数。                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Provider 影響を受けやすい tail-pool スロット数。                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Provider が throttle しないようにする同時 live レーン上限。                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | 同時 npm install レーン上限。                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 同時 multi-service レーン上限。                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon create storm を避けるためのレーン開始間隔。stagger なしにするには `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択された live/tail レーンはより厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` はレーンを実行せずにスケジューラープランを出力します。                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | カンマ区切りの正確なレーンリスト。agents が失敗した 1 レーンを再現できるように cleanup smoke をスキップします。 |

有効上限より重いレーンでも、空のプールからは開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約は Docker を事前確認し、古い OpenClaw E2E コンテナを削除し、アクティブレーンのステータスを出力し、longest-first ordering 用にレーンタイミングを永続化し、デフォルトでは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。

### 再利用可能な live/E2E ワークフロー

再利用可能な live/E2E ワークフローは、どのパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジが必要かを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。その後 `scripts/docker-e2e.mjs` が、そのプランを GitHub outputs とサマリーに変換します。これは、`scripts/package-openclaw-for-docker.mjs` 経由で OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードします。tarball インベントリを検証し、プランがパッケージインストール済みレーンを必要とする場合は、Blacksmith の Docker layer cache 経由でパッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。また、再ビルドせずに、指定された `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力または既存のパッケージダイジェストイメージを再利用します。Docker イメージ pull は、試行ごとに境界付きの 180 秒タイムアウトで再試行されるため、詰まった registry/cache ストリームが CI クリティカルパスの大半を消費せずにすばやく再試行されます。

### リリースパスチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を指定した小さなチャンクジョブで実行されます。これにより、各チャンクは必要なイメージ種別だけを pull し、同じ重み付きスケジューラーを通じて複数レーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、および `plugins-runtime-install-a` から `plugins-runtime-install-h` までです。`package-update-openai` には live Codex Plugin パッケージレーンが含まれます。このレーンは候補 OpenClaw パッケージをインストールし、`codex_plugin_spec` または明示的な Codex CLI インストール承認付きの同一 ref tarball から Codex Plugin をインストールし、Codex CLI preflight を実行した後、OpenAI に対して同一セッション内で複数の OpenClaw agent turn を実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスのままです。`install-e2e` レーンエイリアスは、両方の provider インストーラーレーン向けの集約手動再実行エイリアスのままです。

OpenWebUI は、フルリリースパスのカバレッジで要求される場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチに限ってスタンドアロンの `openwebui` チャンクを維持します。バンドル済みチャネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーンテーブル、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択されたレーンを実行します。これにより、失敗したレーンのデバッグは 1 つの対象 Docker ジョブに限定され、その実行用のパッケージアーティファクトを準備、ダウンロード、または再利用します。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行のためにライブテストイメージをローカルでビルドします。生成されるレーンごとの GitHub 再実行コマンドには、値が存在する場合に `package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。

```bash
pnpm test:docker:rerun <run-id>      # Docker アーティファクトをダウンロードし、統合/レーンごとの対象再実行コマンドを出力する
pnpm test:docker:timings <summary>   # 低速レーンとフェーズのクリティカルパス要約
```

スケジュールされたライブ/E2E ワークフローは、フルリリースパスの Docker スイート全体を毎日実行します。

## Plugin プレリリース

`Plugin Prerelease` は、よりコストの高い製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` へのプッシュ、スタンドアロンの手動 CI ディスパッチでは、このスイートはオフのままです。これはバンドル済み Plugin テストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、1 グループあたり 1 つの Vitest ワーカーとより大きな Node ヒープで、同時に最大 2 つの Plugin 設定グループを実行するため、インポートが多い Plugin バッチが追加の CI ジョブを作成しません。リリース専用の Docker プレリリースパス（`full_release_validation` 入力で有効化）は、1〜3 分のジョブのために数十のランナーを予約しないよう、対象 Docker レーンを 4 つずつのグループにまとめます。このワークフローは、`@openclaw/plugin-inspector` からの情報提供用 `plugin-inspector-advisory` アーティファクトもアップロードします。インスペクターの検出結果はトリアージ入力であり、ブロックする Plugin プレリリースゲートを変更しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローの外に専用の CI レーンがあります。エージェント的パリティは広範な QA とリリースハーネスの下にネストされており、スタンドアロンの PR ワークフローではありません。パリティを広範な検証実行に載せる必要がある場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` での夜間実行と手動ディスパッチで実行されます。これはモックパリティレーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとしてファンアウトします。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックは、決定的なモックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`）で Matrix と Telegram のライブトランスポートレーンを実行するため、チャネル契約はライブモデルのレイテンシと通常のプロバイダー Plugin 起動から分離されます。ライブトランスポート Gateway は、QA パリティがメモリ動作を別途カバーするため、メモリ検索を無効にします。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダースイートでカバーされます。

Matrix はスケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI がサポートする場合にのみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチは、Matrix の完全なカバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードします。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。

通常の PR では、パリティを必須ステータスとして扱うのではなく、スコープされた CI/チェック証拠に従います。

## CodeQL

`CodeQL` ワークフローは意図的に狭い初回パスのセキュリティスキャナーであり、リポジトリ全体のスイープではありません。毎日、手動、`main` プッシュ、非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加え、高/重大の `security-severity` にフィルタリングされた高信頼セキュリティクエリで、最もリスクの高い JavaScript/TypeScript サーフェスをスキャンします。

プルリクエストガードは軽量なままです。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有するバンドル済み Plugin ランタイムパス配下の変更に対してのみ開始し、スケジュールされたワークフローと同じ高信頼セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR デフォルトには含めません。

### セキュリティカテゴリ

| カテゴリ                                          | サーフェス                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway ベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイント              |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、web-fetch、Plugin SDK SSRF ポリシーサーフェス                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス生成ヘルパー、サブプロセスを所有するバンドル済み Plugin ランタイム、ワークフロースクリプト接着部分                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin インストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーインストール、ソース読み込み、Plugin SDK パッケージ契約の信頼サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフローの妥当性チェックが受け入れる最小の Blacksmith Linux ランナーで、CodeQL 用に Android アプリを手動でビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 週次/手動の macOS セキュリティシャード。Blacksmith macOS で CodeQL 用に macOS アプリを手動でビルドし、アップロードされる SARIF から依存関係のビルド結果を除外し、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間を支配するため、日次デフォルトの外に置かれています。

### 重大品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。品質スキャンが Blacksmith ランナー登録予算を消費しないよう、GitHub ホストの Linux ランナー上で、狭く価値の高いサーフェスに対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。そのプルリクエストガードは、スケジュールされたプロファイルより意図的に小さくなっています。非ドラフト PR は、触れたサーフェスに対応するシャードのみを、13 個の PR ルーティング可能シャードから実行します — `agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary`、`session-diagnostics-boundary` です。`ui-control-plane` と `web-media-runtime-boundary` は PR 実行には含めません。CodeQL 設定と品質ワークフローの変更では、PR シャードセット全体を実行します（ネットワークランタイムシャードは、それ自身の CodeQL 設定ファイルとネットワーク所有ソースパスをキーにします）。

手動ディスパッチは次を受け付けます。

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

狭いプロファイルは、1 つの品質シャードを単独で実行するための教育/反復用フックです。

| カテゴリ                                                | サーフェス                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway セキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドル済みチャネルPlugin実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル/プロバイダーディスパッチ、自動返信ディスパッチとキュー、ACP コントロールプレーンランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンド                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | ネットワークポリシーパッケージ、生ソケットとプロキシキャプチャランタイム、SSH トンネル、Gateway ロック、JSONL ソケット、プッシュトランスポートサーフェス                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キュー内部、セッション配信キュー、アウトバウンドセッションバインディング/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK インバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドバインディングヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーデフォルト/カタログ、web/search/fetch/embedding レジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI ブートストラップ、ローカル永続化、Gateway コントロールフロー、タスクコントロールプレーンランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コア Web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、Plugin SDK エントリーポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパー                                                                                      |

品質はセキュリティとは分離されたままにしておくことで、品質の検出結果をセキュリティシグナルを曖昧にせずにスケジュール、測定、無効化、拡張できるようにします。Swift、Python、バンドル済みPluginの CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定してから、スコープ付きまたはシャード化されたフォローアップ作業としてのみ戻すべきです。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、最近取り込まれた変更に既存ドキュメントを合わせ続けるための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーでき、手動ディスパッチでも直接実行できます。ワークフロー実行による呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップされます。実行時は、前回スキップされなかった Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に蓄積されたすべての main 変更をカバーできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテストのためのイベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーできますが、別のワークフロー実行呼び出しがその UTC 日にすでに実行済みまたは実行中の場合はスキップされます。手動ディスパッチは、その日次アクティビティゲートを迂回します。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタではなくカバレッジを維持する小さなテストパフォーマンス修正のみを行わせ、その後フルスイートレポートを再実行して、通過ベースラインのテスト数を減らす変更を拒否します。グループ化されたレポートは Linux と macOS で設定ごとの実時間と最大 RSS を記録するため、前後比較では所要時間の差分と並んでテストメモリの差分が表面化します。ベースラインに失敗しているテストがある場合、Codex は明らかな失敗のみを修正でき、agent 後のフルスイートレポートは何かがコミットされる前に通過する必要があります。bot の push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex action が docs agent と同じ drop-sudo 安全姿勢を維持できるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後の重複整理のための手動メンテナーワークフローです。デフォルトは dry-run で、`apply=true` の場合にのみ明示的に列挙された PR を閉じます。GitHub を変更する前に、取り込まれた PR がマージ済みであり、各重複に共有の参照 issue または重複する変更 hunk があることを確認します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの changed-lane ロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。そのローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。

- コア本番変更は、コア本番およびコアテストの typecheck に加えてコア lint/guard を実行します。
- コアのテストのみの変更は、コアテストの typecheck とコア lint のみを実行します。
- extension 本番変更は、extension 本番および extension テストの typecheck に加えて extension lint を実行します。
- extension のテストのみの変更は、extension テストの typecheck と extension lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更は、extension がそれらのコア契約に依存するため、extension typecheck まで拡張されます（Vitest extension sweep は明示的なテスト作業のままです）。
- リリースメタデータのみのバージョン bump は、対象を絞ったバージョン/設定/root-dependency チェックを実行します。
- 不明な root/設定変更は、安全側に倒してすべてのチェックレーンに失敗します。

ローカルの changed-test ルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より安価です。直接のテスト編集は自身を実行し、ソース編集は明示的なマッピングを優先し、その後に sibling テストと import-graph 依存先を使用します。共有 group-room 配信設定は、明示的なマッピングの 1 つです。group visible-reply 設定、ソース返信配信モード、または message-tool system prompt への変更は、コア返信テストに加えて Discord と Slack の配信回帰を通るため、共有デフォルト変更は最初の PR push 前に失敗します。`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` は、変更が harness 全体に及ぶため安価なマッピング済みセットを信頼できる proxy と見なせない場合にのみ使用してください。

## Testbox 検証

Crabbox は、メンテナー向け Linux proof のための repo 所有の remote-box ラッパーです。Agent
セッションはデフォルトでこれをテストと計算負荷の高い作業に使用します。
これには build、typecheck、lint fan-out、Docker、package lane、E2E、live
proof、CI parity が含まれます。信頼済みメンテナーコードのデフォルトは
`blacksmith-testbox` で、`.crabbox.yaml` も現在はそれをデフォルトにしています。その設定済み
ワークフローは provider と agent の認証情報を hydrate するため、信頼されていない contributor または
fork コードは、代わりに secretless fork CI または sanitized direct AWS Crabbox を使用する必要があります。
Sanitized AWS 実行では `CRABBOX_ENV_ALLOW=CI` を設定し、
`--no-hydrate` を渡し、新しい一時 remote `HOME` を使用します。これにより repo の
`OPENCLAW_*` allowlist と既存の auth profile が信頼されていないコードへ届くのを防ぎます。
これらは、その信頼されていないソース専用に新しく warm した lease を使用し、
信頼済みまたは以前 hydrate された lease は決して使用しません。クリーンな信頼済み `main` checkout から
インストール済みの信頼済み Crabbox
binary を起動し、`--fresh-pr` で remote PR のみを fetch します。信頼されていない checkout の wrapper や config をローカルで実行してはいけません。
`CRABBOX_AWS_INSTANCE_PROFILE` を unset し、解決された
`aws.instanceProfile` が空でない限り fail closed します。install/test の前に、信頼済みの
absolute-path tool を使用して IMDSv2 token を要求し、IAM credentials
endpoint が 404 を返すことを証明し、remote の `git rev-parse HEAD` をレビュー済み PR head の完全な SHA と比較します。その SHA に lease を bind し、head が変わったら stop/rewarm します。
クリーンな `main` から信頼済みの `scripts/crabbox-untrusted-bootstrap.sh` を
`--fresh-pr` と一緒に upload します。これは pin 済み Node/pnpm を install し、SHA と
package-manager pin を検証し、`HOME` を分離し、依存関係を install してから、
要求されたテストを実行します。
すべての `CRABBOX_TAILSCALE*` override を unset し、`--network public
--tailscale=false` を強制し、exit-node/LAN flag を clear し、script を upload する前に
`crabbox inspect` が Tailscale state なしの public networking を報告することを必須にします。
所有 AWS/Hetzner capacity は、Blacksmith outage、
quota 問題、または明示的な owned-capacity testing の fallback としても引き続き残ります。

テストまたは重い proof が必要になりそうな信頼済みコードタスクの開始時に、agent は
background command session でただちに pre-warm し、hydration の実行中に
inspection と editing を続け、返された `tbx_...` id を再利用し、
各 run で現在の checkout を sync し、handoff 前に stop するべきです。

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox-backed Blacksmith run は、one-shot Testbox を warm、claim、sync、run、report、cleanup します。組み込みの sync sanity check は、
sync 済み box 上の `git status --short` が少なくとも 200 件の tracked deletion を示す場合に fail fast します。
これにより `pnpm-lock.yaml` などの root file 消失を検出できます。意図的な
large-deletion PR の場合は、remote command に `CRABBOX_ALLOW_MASS_DELETIONS=1` を設定してください。

Crabbox は、sync phase のまま post-sync output なしで 5 分を超える
local Blacksmith CLI invocation も終了します。
その guard を無効化するには `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、通常より大きい
local diff にはより大きな millisecond 値を使用してください。

最初の実行前に、repo root から wrapper を確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper は、選択された provider を advertised しない古い Crabbox binary を拒否します。また Blacksmith-backed run には Crabbox 0.22.0 以上が必要です。これにより wrapper は現在の Testbox sync、queue、cleanup behavior を取得します。Codex worktree または linked/sparse checkout では、Crabbox 開始前に pnpm が dependencies を reconcile する可能性があるため、local の `pnpm crabbox:run` script は避け、代わりに node wrapper を直接呼び出してください。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

sibling checkout を使用する場合は、timing または proof 作業の前に ignored local binary を rebuild してください。

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

最後の JSON サマリーを読んでください。有用なフィールドは `provider`、`leaseId`、`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委任された Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーがコマンド結果です。リンクされた GitHub Actions 実行はハイドレーションと keepalive を担当します。SSH コマンドがすでに返った後に Testbox が外部から停止されると、`cancelled` として終了する場合があります。ラッパーの `exitCode` がゼロ以外、またはコマンド出力がテスト失敗を示していない限り、それはクリーンアップ/ステータスの成果物として扱ってください。1 回限りの Blacksmith バックエンド Crabbox 実行では、Testbox は自動的に停止されるはずです。実行が中断された場合やクリーンアップが不明な場合は、稼働中のボックスを調べ、自分が作成したボックスだけを停止してください。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレーション済みボックスで複数のコマンドを意図的に実行する必要がある場合にのみ、再利用を使ってください。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

古いソースではなく、リースを再利用してください。各実行で現在のチェックアウトをアップロードするため、`--no-sync` は省略してください。変更されていない、すでに同期済みのツリーを意図して再実行する場合にのみ使用します。信頼できないコントリビューター/フォークのコードでは、すべてのコマンドで `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`、新しい一時的なリモート `HOME` を使う必要があります。テスト前に、そのサニタイズ済みコマンド内で依存関係をインストールしてください。同じ信頼できないソース専用に新しくウォームアップしたリースだけを再利用してください。信頼済みリースや以前にハイドレーション済みのリースは絶対に使わないでください。信頼できないチェックアウトのラッパーや設定をローカルで実行してはいけません。クリーンで信頼済みの `main` からインストール済みの信頼済み Crabbox バイナリを起動し、すべての実行で `--fresh-pr` を渡してください。`CRABBOX_AWS_INSTANCE_PROFILE` は未設定のままにし、解決されたインスタンスプロファイルが空でない場合は拒否し、信頼済みリモート IMDS のロールなし証明を要求し、インストール/テスト前にレビュー済みの head SHA を検証してください。リースをその SHA に紐づけます。head が変更された場合は停止して再ウォームアップしてください。リモート PR が存在しない場合は、シークレットなしのフォーク CI を使ってください。信頼できないソースには、`hydrate-github` や認証情報でハイドレーションされた Blacksmith ワークフローを絶対に選択しないでください。

Crabbox が壊れている層で、Blacksmith 自体は動作している場合は、`list`、`status`、クリーンアップなどの診断に限って直接 Blacksmith を使ってください。直接 Blacksmith 実行をメンテナー証明として扱う前に、Crabbox 経路を修正してください。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するが、新しいウォームアップが数分経っても IP や Actions 実行 URL なしで `queued` のままの場合は、Blacksmith プロバイダー、キュー、請求、または org 制限の逼迫として扱ってください。自分が作成した queued ID を停止し、それ以上 Testbox を開始するのを避け、誰かが Blacksmith ダッシュボード、請求、org 制限を確認する間、証明は下記の所有 Crabbox キャパシティ経路へ移してください。

Blacksmith がダウンしている、クォータ制限がある、必要な環境がない、または所有キャパシティが明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションしてください。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

AWS の逼迫時は、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` は避けてください。`beast` リクエストは 192 vCPU から始まり、リージョン別の EC2 Spot または On-Demand Standard クォータに最も引っかかりやすい方法です。リポジトリ所有の `.crabbox.yaml` は `class: standard`、オンデマンドマーケット、`capacity.hints: true` をデフォルトにしているため、ブローカーされた AWS リースは選択されたリージョン/マーケット、クォータ逼迫、Spot フォールバック、高負荷クラス警告を出力します。より重い広範なチェックには `fast` を使い、standard/fast では不十分な場合にのみ `large` を使い、`beast` はフルスイートや全 Plugin Docker マトリクス、明示的なリリース/ブロッカー検証、高コア数のパフォーマンスプロファイリングなど、例外的な CPU バウンドレーンに限ってください。`pnpm check:changed`、対象を絞ったテスト、docs のみの作業、通常の lint/typecheck、小さな E2E 再現、Blacksmith 障害トリアージには `beast` を使わないでください。キャパシティ診断では、Spot マーケットの変動がシグナルに混ざらないように `--market on-demand` を使ってください。

`.crabbox.yaml` は provider、sync、GitHub Actions ハイドレーションのデフォルトを管理します。Crabbox sync は `.git` を転送しないため、ハイドレーション済みの Actions チェックアウトは、メンテナーローカルのリモート Git メタデータやオブジェクトストアを同期するのではなく、自身のリモート Git メタデータを保持します。またリポジトリ設定では、転送されるべきではないローカルのランタイム/ビルド成果物（`.artifacts` やテストレポートなど）も除外します。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm セットアップ、`origin/main` フェッチ、所有クラウドの `crabbox run --id <cbx_id>` コマンド向けの非シークレット環境引き渡しを管理します。

## 関連

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
