---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を把握する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティの転送を変更している場合
summary: CI ジョブグラフ、スコープゲート、リリース包括ジョブ、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-14T13:31:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 56332874183aa0cdf2bdf60f68324aef3b5a81bd87510dc75f195cdefe3313b4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は、`main` へのプッシュ（トリガーでは Markdown と `docs/**` のパスは無視されます）、ドラフトではないすべてのプルリクエスト、および手動ディスパッチで実行されます。
正規の `main` へのプッシュは、まず 90 秒間のホステッドランナー受付待機を通過します。`CI` 同時実行グループは、より新しいコミットが到着すると待機中の実行をキャンセルするため、連続するマージごとに完全な Blacksmith マトリクスが登録されることはありません。プルリクエストと手動ディスパッチでは待機をスキップします。
その後、`preflight` ジョブが差分を分類し、無関係な領域だけが変更された場合は高コストなレーンを無効にします。手動の `workflow_dispatch` 実行では、リリース候補と広範な検証のため、意図的にスマートスコープを回避してグラフ全体を並列展開します。Android レーンは `include_android`（または `release_gate` 入力）によるオプトインのままです。リリース専用の Plugin カバレッジは、別個の [`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、[`Full Release Validation`](#full-release-validation) または明示的な手動ディスパッチからのみ実行されます。

## パイプライン概要

| ジョブ                                | 目的                                                                                                                                                                                                               | 実行条件                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ドキュメントのみの変更、変更されたスコープ、変更された拡張機能を検出し、CI マニフェストを構築する                                                                                                                               | ドラフトではないプッシュと PR で常に実行                  |
| `runner-admission`                 | Blacksmith の処理が登録される前に、正規の `main` へのプッシュをホステッド環境で 90 秒間デバウンスする                                                                                                                            | すべての CI 実行。スリープするのは正規の `main` へのプッシュのみ |
| `security-fast`                    | 秘密鍵の検出、`zizmor` による変更済みワークフローの監査、および本番ロックファイルの監査                                                                                                                             | ドラフトではないプッシュと PR で常に実行                  |
| `pnpm-store-warmup`                | Linux Node シャードをブロックせずに、ロックファイルで固定された pnpm ストアキャッシュをウォームアップする                                                                                                                                          | Node またはドキュメントチェックのレーンが選択された場合                   |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI のスモークチェック、起動時メモリ、および組み込みのビルド成果物チェックをビルドする                                                                                                                 | Node 関連の変更                               |
| `control-ui-i18n`                  | 生成された Control UI のロケールバンドル、メタデータ、翻訳メモリを検証する。自動実行では勧告のみ、手動リリース CI ではブロッキング                                                                               | Control UI の i18n 関連変更および手動 CI      |
| `checks-fast-core`                 | 高速な Linux 正確性レーン：変更ファイルの TypeScript LOC ラチェット、バンドル済みコンポーネントとプロトコル、Bun ランチャー、および CI ルーティングの高速タスク                                                                                     | Node 関連または本番 TypeScript の変更      |
| `qa-smoke-ci-profile`              | 制限付き自動 QA スモーク代表セットを、自己完結した均衡の取れた 2 パートで実行する。分類体系全体のカバレッジは、明示的な QA プロファイルを通じて引き続き利用可能                                                         | Node 関連の変更                               |
| `checks-fast-contracts-plugins-*`  | 重み付けされた 2 つの Plugin コントラクトシャード                                                                                                                                                                                   | Node 関連の変更                               |
| `checks-fast-contracts-channels-*` | 重み付けされた 2 つのチャネルコントラクトシャード                                                                                                                                                                                  | Node 関連の変更                               |
| `checks-node-*`                    | プルリクエストでは変更対象の Node テストを実行し、`main`、手動、リリース、および広範フォールバック実行ではコア全体のシャードを実行する                                                                                                      | Node 関連の変更                               |
| `check-*`                          | シャード化されたメインのローカルゲート相当：ガード、shrinkwrap、バンドル済みチャネルの設定メタデータ、本番型、lint、依存関係、テスト型                                                                                   | Node 関連の変更                               |
| `check-additional-*`               | 境界チェックのストライプ（プロンプトスナップショットのドリフトを含む）、セッションアクセサー／トランスクリプトリーダー／SQLite トランザクションの境界、拡張機能の lint グループ、パッケージ境界のコンパイル／カナリア、およびランタイムトポロジーのアーキテクチャ | Node 関連の変更                               |
| `checks-node-compat-node22`        | Node 22 互換性のビルドおよびスモークレーン                                                                                                                                                                            | リリース向けの手動 CI ディスパッチ                     |
| `check-docs`                       | ドキュメントのフォーマット、lint、およびリンク切れチェック                                                                                                                                                                         | ドキュメントが変更された場合（PR と手動ディスパッチ）              |
| `native-i18n`                      | ネイティブアプリ、Android、および Apple の i18n インベントリチェック                                                                                                                                                                  | ネイティブ i18n 関連の変更                        |
| `skills-python`                    | Python ベースの Skills に対する Ruff と pytest                                                                                                                                                                                | Python Skills 関連の変更                       |
| `checks-windows`                   | Windows 固有のプロセス／パステスト、および共有ランタイムのインポート指定子に関するリグレッション                                                                                                                                  | Windows 関連の変更                            |
| `macos-node`                       | macOS 向けの重点的な TypeScript テスト：launchd、Homebrew、ランタイムパス、パッケージングスクリプト、プロセスグループラッパー                                                                                                            | macOS 関連の変更                              |
| `macos-swift`                      | macOS アプリの Swift lint、ビルド、およびテスト                                                                                                                                                                        | macOS 関連の変更                              |
| `ios-build`                        | Xcode プロジェクトの生成と iOS アプリのシミュレータービルド                                                                                                                                                             | iOS アプリ、共有アプリキット、または Swabble の変更         |
| `android`                          | 両方のフレーバーに対する Android 単体テストと、1 つのデバッグ APK ビルド                                                                                                                                                          | Android 関連の変更                            |
| `openclaw/ci-gate`                 | 最終集約：受付、事前検証、セキュリティを必須とし、マニフェストで無効化された後続レーンに限りスキップを許可する                                                                                               | ドラフトではないすべての CI 実行                              |
| `test-performance-agent`           | 別個のワークフロー：信頼されたアクティビティの後に毎日実行する Codex 低速テストの最適化                                                                                                                                          | メイン CI の成功または手動ディスパッチ                  |
| `openclaw-performance`             | 別個のワークフロー：モックプロバイダー、詳細プロファイル、GPT 5.6 ライブレーンを使用した、毎日／オンデマンドの Kova ランタイムパフォーマンスレポート                                                                                          | スケジュール実行および手動ディスパッチ                       |

独立した Periphery ワークフローは、iOS および macOS アプリでデッドコードの検出結果がゼロであることを強制します。共有の OpenClawKit ワークフローは両方の利用側を並列にスキャンし、Periphery が両方のビルドから同じ Swift USR を出力した場合にのみ宣言を報告します。生成された `OpenClawProtocol/GatewayModels.swift` スキーマコントラクトは、アプリ固有のデッドコードとして扱われず、ジェネレーターが所有するコードとして保持されます。

## フェイルファスト順序

1. `runner-admission` は、正規の `main` へのプッシュの場合にのみ待機します。より新しいプッシュがあると、Blacksmith への登録前に実行がキャンセルされます。
2. `preflight` は、どのレーンを存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、および `skills-python` は、より重い成果物およびプラットフォームのマトリクスジョブを待たずに、すばやく失敗します。
4. `build-artifacts` と勧告のみの `control-ui-i18n` チェックは、高速 Linux レーンと並行して実行されます。生成されたロケールのドリフトは可視のまま維持され、独立した更新ワークフローがバックグラウンドで修復します。
5. その後、より重いプラットフォームおよびランタイムのレーンが並列展開されます：`checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、および `android`。
6. `openclaw/ci-gate` は、選択されたすべてのレーンを待機します。受付、事前検証、セキュリティは成功する必要があります。後続ジョブは、マニフェストで選択されなかった場合にのみスキップできます。選択されたレーンが失敗またはキャンセルされると、集約も失敗します。

マージコーディネーターは、同じプルリクエストのヘッドに対して認証済みで成功した `openclaw/ci-gate` を最大 24 時間再利用できます。これにより、無関係な `main` の変更後にコントリビューターのブランチを書き換える必要がなくなります。再利用可能な結果は、現在の `main` に対する、別個の厳格な App 所有のテストマージチェックを置き換えるものではありません。
その後の再実行が保留中または失敗しても、鮮度期間内にヘッドが変更されていなければ、以前の成功結果は消去されません。

GitHub は、同じ PR または `main` ref に新しいプッシュが反映されると、置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新実行も失敗している場合を除き、これは CI のノイズとして扱います。マトリックスジョブは `fail-fast: false` を使用し、`build-artifacts` は、小規模な検証ジョブをキューに追加する代わりに、組み込みチャネル、コアサポート境界、Gateway watch の失敗を直接報告します。自動 CI 同時実行キーはバージョン管理されているため（`CI-v7-*`）、古いキューグループ内の GitHub 側のゾンビによって、新しい main の実行が無期限にブロックされることはありません。手動のフルスイート実行は `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。Plugin リストの起動時メモリガードは、セルフホストの Blacksmith Linux では上限を 350 MiB に維持し、同じビルド済み CLI でも RSS ベースラインが高い GitHub ホストの Linux では 425 MiB を許容します。

GitHub Actions の実時間、キュー時間、最も遅いジョブ、失敗、および `pnpm-store-warmup` ファンアウトバリアを要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。ワークフロー内の `ci-timings-summary` ジョブは `ci.yml` に存在しますが、現在は無効です（`if: false`）。代わりに、タイミングヘルパーをローカルで実行してください。ビルドのタイミングについては、`build-artifacts` ジョブの `Build dist` ステップを確認します。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。また、このジョブは `startup-memory` アーティファクトもアップロードします。

## PR のコンテキストとエビデンス

外部コントリビューターの PR では、
`.github/workflows/real-behavior-proof.yml` から PR のコンテキストおよびエビデンスゲートを実行します。ワークフローは
信頼済みのワークフローリビジョン（`github.workflow_sha`）をチェックアウトし、PR 本文
のみを評価します。コントリビューターのブランチにあるコードは実行しません。

このゲートは、リポジトリの所有者、メンバー、
コラボレーター、ボットのいずれでもない PR 作成者に適用されます。PR 本文に作成者が記載した
`What Problem This Solves` および `Evidence` セクションが含まれている場合に合格します。エビデンスには、対象を絞った
テスト、CI 結果、スクリーンショット、録画、ターミナル出力、ライブ観察、
編集済みログ、またはアーティファクトへのリンクを使用できます。本文は意図と有用な検証結果を示し、
レビュアーはコード、テスト、CI を確認して正しさを評価します。

チェックに失敗した場合は、別のコードコミットをプッシュするのではなく、PR 本文を更新してください。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチでは変更スコープの検出をスキップし、プリフライトマニフェストを、スコープ対象のすべての領域が変更されたかのように動作させます。

iOS と macOS の個別の Periphery ワークフローでは、検出件数ゼロのデッドコードポリシーを適用します。それぞれ、ドラフトではないプルリクエストがネイティブスキャンのスコープに触れた場合、または手動でディスパッチされた場合にのみ実行されます。

- **CI ワークフローの編集**では、Node CI グラフ、ワークフローの lint、Windows レーン（`ci.yml` が実行）を検証しますが、それだけで iOS、Android、macOS のネイティブビルドを強制することはありません。これらのプラットフォームレーンは、引き続きプラットフォームのソース変更にスコープされます。
- **ワークフローの健全性チェック**では、すべてのワークフロー YAML ファイルに対して `actionlint`、`zizmor`、複合アクションの補間ガード、競合マーカーガードを実行します。PR スコープの `security-fast` ジョブでは、変更されたワークフローファイルに対して `zizmor` も実行し、ワークフローのセキュリティ検出事項がメインの CI グラフ内で早期に失敗するようにします。
- **`main` プッシュ時のドキュメント**は、CI と同じ ClawHub ドキュメントミラーを使用するスタンドアロンの `Docs` ワークフローでチェックされるため、コードとドキュメントが混在するプッシュで CI の `check-docs` シャードもキューに追加されることはありません。プルリクエストおよび手動 CI では、ドキュメントが変更された場合、引き続き CI から `check-docs` を実行します。
- **TUI PTY** は、TUI の変更に対して `checks-node-core-runtime-tui-pty` Linux Node シャードで実行されます。このシャードは `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` を指定して `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定論的な `TuiBackend` フィクスチャレーンと、外部モデルエンドポイントのみをモックする、より低速な `tui --local` スモークの両方をカバーします。
- **CI ルーティングのみの編集、高速タスクが直接実行する少数のコアテストフィクスチャ、および限定的な Plugin コントラクトヘルパーの編集**では、高速な Node 専用マニフェストパスを使用します。対象は `preflight`、`security-fast`、および変更が影響する高速レーンのみです。つまり、単一の `checks-fast-core` CI ルーティングタスク、2 つの Plugin コントラクトシャード、またはその両方です。このパスでは、ビルドアーティファクト、Node 22 互換性、チャネルコントラクト、完全なコアシャード、バンドル済み Plugin シャード、および追加のガードマトリックスをスキップします。
- **Windows Node チェック**は、Windows 固有のプロセス／パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフローのサーフェスにスコープされます。無関係なソース、Plugin、インストールスモーク、テストのみの変更は Linux Node レーンに残ります。

最も遅い Node テストファミリーは、各ジョブを小規模に保ちつつ、ランナーを過剰に予約しないように分割または均衡化されています。

- Plugin コントラクトとチャネルコントラクトは、それぞれ標準の GitHub ランナーフォールバックを備えた、Blacksmith バックエンドの重み付き 2 シャードとして実行されます。
- コアユニットの高速／サポートレーンは個別に実行されます。コアランタイムインフラは、プロセス、共有、フック、シークレット、および 3 つの Cron ドメインシャードに分割されます。
- 自動返信は均衡化されたワーカーとして実行され、返信サブツリーはエージェントランナー、コマンド、ディスパッチ、セッション、状態ルーティングの各シャードに分割されます。
- エージェント型 Gateway／サーバー（コントロールプレーン）の設定は、ビルドアーティファクトを待つ代わりに、チャット、認証、モデル、HTTP／Plugin、ランタイム、起動の各レーンに分割されます。
- 通常の CI では、分離されたインフラの include パターンシャードのみを、最大 64 テストファイルの決定論的なバンドルにまとめます。これにより、非分離のコマンド／Cron、状態を持つ agents-core、Gateway／サーバースイートを統合せずに Node マトリックスを削減します。負荷の高い固定スイートは 8 vCPU のままとし、バンドル済みレーンと低負荷レーンは 4 vCPU を使用します。
- 正規リポジトリのプルリクエストでは、合成されたマージツリーの差分に対して変更テストリゾルバーを再利用します。変更箇所を正確に特定できる場合は、対象を絞った Node ジョブを 1 つ実行します。各選択済みテストファイルは独自のプロセスで実行されるため、状態を持つスイートの分離は維持されます。プランナーは、兄弟テストとインポートグラフの依存先を組み合わせ、ワークスペースパッケージ、パッケージ／ロックファイル、共有ハーネス、分割設定、名前変更、削除、公開 extension コントラクトの変更、特殊なシャード設定を持つテスト、部分的にしか解決できないターゲットまたは空のターゲット、過大なパスまたはターゲットプラン、プランナーエラーの場合は、既存の 14 ジョブのコンパクトなフルスイートプランにフォールバックします。対象限定プランでも、完全なビルドアーティファクト境界ゲートは常に維持されます。これは、そのリポジトリスキャナーをインポートから導出できないためです。`main` プッシュ、手動ディスパッチ、リリースゲートでは、完全なマトリックスを維持します。置き換えによってキャンセルされた `main` 実行があると、単一プッシュの差分だけでは統合のエビデンスとして不十分になるためです。
- 完全な Node マトリックスでは、一貫して遅いシリアルツールおよび自動返信コマンドのシャードを先に受け入れます。これにより、28 ジョブの上限を維持しながら、短いアルファベット順のグループによってクリティカルパスの処理が後のウェーブへ押し出されるのを防ぎます。
- 広範なブラウザー、QA、メディア、その他の Plugin テストでは、共有の Plugin キャッチオールではなく、それぞれ専用の Vitest 設定を使用します。include パターンシャードは CI シャード名を使用してタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` は設定全体とフィルター済みシャードを区別できます。
- `check-additional-*` は、補助的な境界ガードリスト（`scripts/run-additional-boundary-checks.mjs`）を、プロンプト負荷の高い 1 つのシャード（Codex プロンプトスナップショットのドリフトチェックを含む `check-additional-boundaries-a`）と、残りのストライプ用の 1 つの統合シャード（`check-additional-boundaries-bcd`）に分割します。各シャードは独立したガードを並行実行し、チェックごとのタイミングを出力します。パッケージ境界のコンパイル／カナリア処理はまとめたままとし、ランタイムトポロジーアーキテクチャは `build-artifacts` に組み込まれた Gateway watch カバレッジとは別に実行されます。
- Gateway watch、チャネルテスト、コアサポート境界シャードは、`dist/` と `dist-runtime/` のビルド完了後、`build-artifacts` 内で並行実行されます。

受け入れ後、正規の Linux CI では、Node テストジョブを最大 28 個、
小規模な高速／チェックレーンを最大 12 個まで同時実行できます。Windows と Android は、
ランナープールがより小さいため 2 個のままです。コンパクトな設定全体のバッチには
120 分のバッチタイムアウトが適用され、include パターングループは同じ制限付き
ジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play デバッグ APK をビルドします。サードパーティフレーバーには個別のソースセットやマニフェストはありません。そのユニットテストレーンでは、SMS／通話ログの BuildConfig フラグを指定して引き続きフレーバーをコンパイルしますが、Android 関連のプッシュごとに重複するデバッグ APK パッケージングジョブを実行することは避けます。

`check-dependencies` シャードは、本番用の Knip 依存関係、未使用ファイル、未使用エクスポートのチェックを実行します。未使用ファイルガードは、PR がレビューされていない新しい未使用ファイルを追加した場合、または古い許可リストエントリを残した場合に失敗します。その一方で、Knip が静的に解決できない、意図的な動的 Plugin、生成物、ビルド、ライブテスト、パッケージブリッジのサーフェスは維持します。未使用エクスポートガードはテストサポートファイルを除外し、新しい検出事項または古くなった必須ベースラインエントリがある場合に失敗します。不要なエクスポートを削除した後、`pnpm deadcode:exports:update` を使用して縮小のみ可能なベースラインを再生成します。過去のターゲットは、エクスポートガードが提供されていればそれを実行し、それ以外の場合は従来のデッドコードフォールバックを維持します。

## ClawSweeper アクティビティの転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリアクティビティから ClawSweeper へのターゲット側ブリッジです。信頼されていないプルリクエストコードをチェックアウトしたり実行したりすることはありません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` にディスパッチします。

このワークフローには 4 つのレーンがあります。

- `clawsweeper_item` は、特定の issue およびプルリクエストのレビューリクエスト用です。
- `clawsweeper_comment` は、issue コメント内の明示的な ClawSweeper コマンド用です。
- `clawsweeper_commit_review` は、`main` プッシュに対するコミット単位のレビューリクエスト用です。
- `github_activity` は、ClawSweeper エージェントが調査できる一般的な GitHub アクティビティ用です。

`github_activity` レーンは、正規化されたメタデータのみを転送します。イベントタイプ、アクション、アクター、リポジトリ、項目番号、URL、タイトル、状態、およびコメントやレビューが存在する場合はその短い抜粋です。Webhook 本文全体は意図的に転送しません。`openclaw/clawsweeper` 内の受信ワークフローは `.github/workflows/github-activity.yml` であり、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway フックへ送信します。

一般的なアクティビティは監視対象であり、デフォルトで配信されるものではありません。ClawSweeper エージェントはプロンプト内で Discord の送信先を受け取り、イベントが予想外である、対応可能である、リスクがある、または運用上有用である場合にのみ `#clawsweeper` へ投稿する必要があります。通常のオープン、編集、ボットによる頻繁な更新、重複する Webhook ノイズ、通常のレビュートラフィックでは、`NO_REPLY` となる必要があります。

この経路全体を通じて、GitHub のタイトル、コメント、本文、レビューテキスト、ブランチ名、コミットメッセージは信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のスコープ対象レーンをすべて強制的に有効化します。対象は、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、iOS ビルド、Control UI i18n です。Control UI のロケール同等性は、生成物の差異をスタンドアロンの更新ワークフローがバックグラウンドで修復するため、自動 PR および `main` 実行では勧告扱いです。手動 CI ではブロッキングとなるため、完全リリース検証でもブロッキングとなります。スタンドアロンの手動 CI ディスパッチでは、`include_android=true` を指定した場合にのみ Android を実行します（`release_gate` 入力でも Android が強制的に有効になります）。完全リリースの包括的ワークフローでは、`include_android=true` を渡して Android を有効化します。Plugin プレリリースの静的チェック、リリース専用の `agentic-plugins` シャード、全拡張機能の一括スイープ、Plugin プレリリースの Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の同時実行グループを使用するため、リリース候補の完全スイートが、同じ ref に対する別の push または PR 実行によってキャンセルされることはありません。オプションの `target_ref` 入力を使用すると、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使用しながら、ブランチ、タグ、または完全なコミット SHA に対してそのグラフを実行できます。オプションの `loc_base_ref` は、スタンドアロンの手動実行に正確な比較 SHA を指定します。`release_gate` 入力は、容量不足で停滞している PR CI 向けの、正確な SHA を指定するメンテナ用フォールバックです。`target_ref` にはディスパッチされたブランチの head と一致する完全なコミット SHA、`pr_number` にはオープン中のプルリクエストを指定する必要があります。ワークフローは、その PR の現在の head と base を認証し、GitHub によるマージ可能性の計算完了を待ち、報告されたテスト用マージコミットを固定し、GitHub の合成プルリクエストマージ ref を取得し、その SHA と両方の親を検証してから、依存関係をインストールして変更ファイルの TypeScript LOC ラチェットを実行する前に、そのツリーをチェックアウトします。これは、自動 PR CI のマージ済みツリーおよびポリシー実装と一致します。`pr_number` を含まないターゲット所有のワークフローリビジョンでは、同等のマージツリー証拠を提供できません。フォールバックを使用するのではなく、PR の head を現在のワークフローに更新し、正確な head の検証を再開してください。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

毎月の npm のみの延長安定版パスは例外です。正確な
`extended-stable/YYYY.M.33` ブランチから `OpenClaw NPM
Release` プレフライトと `Full Release Validation` の両方をディスパッチし、それぞれの実行 ID を保持して、
直接 npm 公開を実行する際に両方の ID を渡します。コマンド、正確な ID 要件、レジストリの読み戻し、セレクターの
修復手順については、[毎月の npm のみの延長安定版の
公開](/ja-JP/reference/RELEASING#monthly-npm-only-extended-stable-publication)を参照してください。
このパスでは、Plugin、macOS、Windows、GitHub
Release、非公開 dist-tag、その他のプラットフォーム公開はディスパッチされません。

## ランナー

| ランナー                          | ジョブ                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `runner-admission`、`security-fast`、手動 CI ディスパッチおよび非正規リポジトリのフォールバック、QA Smoke 集約、CodeQL のセキュリティおよび品質スキャン、ワークフロー健全性チェック、ラベラー、自動応答、スタンドアロンの Docs ワークフロー、Install Smoke ワークフロー全体            |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`pnpm-store-warmup`、`native-i18n`、QA Smoke CI を除く `checks-fast-core`、Plugin／チャネル契約シャード、同梱／低負荷の Linux Node シャードの大部分、`check-lint` を除く `check-*` レーン、選択された `check-additional-*` シャード、`check-docs`、`skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持されている高負荷 Linux Node スイート、境界／拡張機能負荷の高い `check-additional-*` シャード、`android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | 自動 QA Smoke CI シャード、CI および Testbox の `build-artifacts`、`check-lint`（CPU 依存性が高く、8 vCPU では節約分よりコストが大きかったため）                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。フォークでは `macos-15` にフォールバック                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` および `ios-build`。フォークでは `macos-26` にフォールバック                                                                                                                                                                                               |

## ランナー登録予算

OpenClaw の現在の GitHub ランナー登録バケットでは、`ghx api rate_limit` において
5 分あたり 10,000 件のセルフホステッドランナー登録が報告されています。GitHub が
このバケットを変更する可能性があるため、調整作業のたびに
`actions_runner_registration` を再確認してください。この上限は
`openclaw` 組織内のすべての Blacksmith ランナー登録で共有されるため、別の Blacksmith インストールを追加しても
新しいバケットは追加されません。

バースト制御では、Blacksmith ラベルを希少リソースとして扱ってください。
ルーティング、通知、要約、シャード選択、短時間の CodeQL スキャンのみを行うジョブは、
Blacksmith 固有の必要性が測定によって確認されていない限り、
GitHub ホステッドランナーに留める必要があります。新しい Blacksmith マトリクス、より大きな `max-parallel`、または高頻度の
ワークフローでは、最悪時の登録数を示し、組織レベルの
目標を実際のバケットの約 60% 未満に保つ必要があります。現在の 10,000 件の登録
バケットでは、運用目標は 6,000 件となり、同時実行される
リポジトリ、再試行、バーストの重複に備えた余裕が残ります。

変更ターゲット PR プランにより、一般的な Node テストのバーストは 14 件の Blacksmith 登録から 1 件に削減されます。広範なリスクを伴う PR では 14 件登録のコンパクトなフォールバックを維持するため、最悪の場合でも増加しません。

正規リポジトリの CI では、通常の push およびプルリクエスト実行におけるデフォルトのランナーパスとして Blacksmith を維持します。`workflow_dispatch` および非正規リポジトリの実行では GitHub ホステッドランナーを使用しますが、通常の正規リポジトリ実行では、現在 Blacksmith のキュー健全性をプローブせず、Blacksmith が利用できない場合にも GitHub ホステッドラベルへ自動的にフォールバックしません。

## ローカルでの同等コマンド

```bash
pnpm changed:lanes                            # origin/main...HEAD に対するローカルの変更レーン分類器を確認
pnpm check:changed                            # スマートなローカルチェックゲート：境界レーン別に変更されたフォーマット／型チェック／lint／ガードを実行
pnpm check                                    # 高速なローカルゲート：本番 tsgo + シャード化された lint + 並列高速ガード
pnpm check:test-types
pnpm check:timed                              # ステージごとの所要時間を含む同じゲート
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest テスト
pnpm test:changed                             # 低コストでスマートな変更対象 Vitest テスト
pnpm test:ui                                  # Control UI のユニット／ブラウザスイート
pnpm ui:i18n:check                            # 生成された Control UI のロケール同等性（リリースゲート）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # ドキュメントのフォーマット + lint + リンク切れ
pnpm build                                    # CI 成果物／スモークチェックが重要な場合に dist をビルド
pnpm ios:build                                # iOS アプリプロジェクトを生成してビルド
pnpm ci:timings                               # 最新の origin/main push CI 実行を要約
pnpm ci:timings:recent                        # 最近成功した main CI 実行を比較
node scripts/ci-run-timings.mjs <run-id>      # 実時間、キュー時間、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --latest-main # issue／コメントのノイズを無視して origin/main push CI を選択
node scripts/ci-run-timings.mjs --recent 10   # 最近成功した main CI 実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw のパフォーマンス

`OpenClaw Performance` は製品／ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でディスパッチすることもできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチでは通常、ワークフローの ref をベンチマークします。現在のワークフロー実装を使用してリリースタグまたは別のブランチをベンチマークするには、`target_ref` を設定します。公開されるレポートパスと最新ポインターはテスト対象の ref をキーとし、各 `index.md` には、テスト対象の ref／SHA、ワークフローの ref／SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、シナリオフィルターが記録されます。

ワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力に基づいて `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を使用し、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、エージェントターンのホットスポットに対する CPU／ヒープ／トレースプロファイリングです。スケジュール時、または `deep_profile=true` を指定したディスパッチ時に実行されます。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.6-luna` エージェントターンです。`OPENAI_API_KEY` が利用できない場合はスキップされます。スケジュール時、または `live_openai_candidate=true` を指定したディスパッチ時に実行されます。

モックプロバイダーレーンでは、Kova のパス後に OpenClaw ネイティブのソースプローブも実行します。対象は、デフォルト、チャネルスキップ、内部フック、50 個の Plugin 起動ケースにおける Gateway の起動時間とメモリ、バンドル済み Plugin のインポート RSS、モック OpenAI で繰り返す `channel-chat-baseline` hello ループ、起動済み Gateway に対する CLI 起動コマンド、SQLite 状態スモークパフォーマンスプローブです。テスト対象 ref について以前公開されたモックプロバイダーのソースレポートが利用可能な場合、ソースサマリーは現在の RSS 値とヒープ値をそのベースラインと比較し、RSS の大幅な増加を `watch` としてマークします。ソースプローブの Markdown サマリーはレポートバンドル内の `source/index.md` に配置され、隣に生の JSON が置かれます。

各レーンは、CPU、ヒープ、トレース、圧縮済み診断バンドルを含む完全な GitHub アーティファクトをアップロードします。別の公開ジョブがそれらのアーティファクトをダウンロードして検証し、その後 `openclaw/clawgrit-reports` contents のみにスコープを限定した短期間有効な ClawSweeper GitHub App トークンを発行し、Git push ステップにのみ渡します。このジョブは、`report.json`、`report.md`、`index.md`、ソースプローブのアーティファクト、バンドルのメタデータとチェックサムを `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` 配下にコミットします。完全な診断アーカイブはリンク先の Actions アーティファクトに残ります。公開ジョブは、push を試行する前に 50 MB を超えるレポートファイルを拒否します。現在のテスト対象 ref ポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` です。スケジュール実行と `profile=release` ディスパッチは、アプリトークンの作成またはレポートの公開に失敗すると失敗します。リリース以外の手動ディスパッチでは公開は参考情報扱いとなり、認証または公開に失敗した場合も GitHub アーティファクトを保持します。以前のソースベースラインは公開レポートリポジトリから匿名で取得されるため、ベースラインの取得成功は公開ジョブの認証成功を証明するものではありません。

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動統括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動の `CI` ワークフロー（Android を含む）をディスパッチし、リリース専用の Plugin／パッケージ／静的／Docker 検証用に `Plugin Prerelease` をディスパッチし、ターゲット SHA に対して `OpenClaw Performance` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram の各レーン用に `OpenClaw Release Checks` をディスパッチします（参考情報扱いの成熟度スコアカードのレンダリングは `run_maturity_scorecard` によりオプトインできます）。stable と full プロファイルには、網羅的な live／E2E と Docker リリースパスのソークカバレッジが常に含まれます。beta プロファイルでは `run_release_soak=true` によりオプトインできます。標準のパッケージ Telegram E2E は Package Acceptance 内で実行されるため、完全な候補では重複する live ポーラーを開始しません。公開後は `release_package_spec` を渡すことで、ビルドし直さずに、出荷済み npm パッケージをリリースチェック、Package Acceptance、Docker、クロス OS、Telegram 全体で再利用できます。公開済みパッケージの Telegram のみに絞った再実行には、`npm_telegram_package_spec` のみを使用します。Codex Plugin の live パッケージレーンでも、デフォルトで同じ選択済み状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` から `codex_plugin_spec=npm:@openclaw/codex@<tag>` を導出し、SHA／アーティファクト実行では選択した ref から `extensions/codex` をパックします。`npm:`、`npm-pack:`、`git:` の仕様など、カスタム Plugin ソースには `codex_plugin_spec` を明示的に設定します。

ステージマトリックス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、絞り込み再実行用のハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、変更を伴う手動リリースワークフローです。通常の beta と stable の公開は、リリースタグが存在し、OpenClaw npm プリフライトが成功した後に、信頼できる `main` からディスパッチします（プリフライトではチェックの一部として `pnpm plugins:sync:check` を実行します）。タグは引き続き、`release/YYYY.M.PATCH` 上のコミットを含む正確なリリースコミットを選択します。Tideclaw alpha の公開では、対応する alpha ブランチを引き続き使用します。保存済みの `preflight_run_id` と、成功した `full_release_validation_run_id` およびその正確な `full_release_validation_run_attempt` が必要です。公開可能なすべての Plugin パッケージ用に `Plugin NPM Release` をディスパッチし、同じリリース SHA 用に `Plugin ClawHub Release` をディスパッチしてから、初めて `OpenClaw NPM Release` をディスパッチします。stable の公開には、正確な `windows_node_tag` も必要です。ワークフローは、公開用の子ワークフローを開始する前に Windows ソースリリースを検証し、その x64／ARM64 インストーラーを候補として承認済みの `windows_node_installer_digests` 入力と比較します。その後、同じ固定済みインストーラーダイジェストに加え、正確な関連アセットおよびチェックサム契約を昇格・検証してから、GitHub リリースドラフトを公開します。Plugin のみに絞った修復では、空でないパッケージリストを指定して `plugin_publish_scope=selected` を使用します。Plugin のみの `all-publishable` 実行には、コア公開と同じ不変の npm プリフライトおよび完全リリース検証の証拠が必要です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

変化の速いブランチで固定コミットを検証する場合は、`gh workflow run ... --ref main -f ref=<sha>` ではなくヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローのディスパッチ ref は、未加工のコミット SHA ではなく、ブランチまたはタグでなければなりません。ヘルパーは、信頼できる `main` ワークフロー SHA に一時的な `release-ci/<sha>-...` ブランチを push し、要求されたターゲット SHA をワークフローの `ref` 入力経由で渡し、利用可能な場合は厳密な完全一致ターゲットの証拠を再利用し、各子ワークフローの `headSha` が信頼できるワークフロー SHA と一致することを検証し、実行完了時に一時ブランチを削除します。新規検証を強制するには `-f reuse_evidence=false` を渡します。統括検証ジョブは、いずれかの子ワークフローが異なるワークフロー SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡す live／プロバイダーの範囲を制御します。手動リリースワークフローのデフォルトは `stable` です。広範な参考情報扱いのプロバイダー／メディアマトリックスを意図的に実行する場合にのみ、`full` を使用します。stable と full のリリースチェックでは、網羅的な live／E2E と Docker リリースパスのソークを常に実行します。beta プロファイルでは `run_release_soak=true` によりオプトインできます。

- `minimum` は、最速の OpenAI／コアのリリースクリティカルなレーンを維持します。
- `stable` は、stable のプロバイダー／バックエンドセットを追加します。
- `full` は、広範な参考情報扱いのプロバイダー／メディアマトリックスを実行します。

統括ワークフローは、ディスパッチした子ワークフローの実行 ID を記録します。最後の `Verify full validation` ジョブは、子ワークフローの現在の実行結果を再確認し、各子ワークフロー実行の最も遅いジョブの表を追記します。子ワークフローを再実行して成功に変わった場合は、親の検証ジョブだけを再実行して、統括結果とタイミングサマリーを更新します。

復旧用に、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI の子ワークフローのみには `ci`、Plugin プレリリースの子ワークフローのみには `plugin-prerelease`、OpenClaw Performance の子ワークフローのみには `performance`、すべてのリリース子ワークフローには `release-checks` を使用します。さらに統括ワークフローでは、`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` のより狭いグループも使用できます。これにより、絞り込んだ修正後の失敗したリリースボックスの再実行範囲を限定できます。失敗したクロス OS レーンを 1 つだけ再実行する場合は、`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。例: `windows/packaged-upgrade`。長時間のクロス OS コマンドは Heartbeat 行を出力し、パッケージ化アップグレードのサマリーにはフェーズごとの所要時間が含まれます。QA リリースチェックレーンは、標準ランタイムツールのカバレッジゲートを除き参考情報扱いです。このゲートは、必要な OpenClaw 動的ツールに差異が生じたり、標準ティアのサマリーから消えたりした場合にブロックします。

`OpenClaw Release Checks` は、信頼できるワークフロー ref を使用して、選択した ref を一度だけ `release-package-under-test` tarball に解決し、そのアーティファクトをクロス OS チェックと Package Acceptance に渡します。ソークカバレッジの実行時には、live／E2E リリースパスの Docker ワークフローにも渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、複数の子ジョブで同じ候補を再パックすることを回避できます。Codex npm Plugin の live レーンでは、リリースチェックは `release_package_spec` から導出した一致する公開済み Plugin 仕様を渡すか、オペレーターが指定した `codex_plugin_spec` を渡すか、入力を空のままにして Docker スクリプトに選択済みチェックアウトの Codex Plugin をパックさせます。

`ref=main` と `rerun_group=all` に対する重複した `Full Release Validation` 実行では、古い統括ワークフローが置き換えられます。親モニターは、親がキャンセルされたときに、すでにディスパッチ済みの子ワークフローをすべてキャンセルします。これにより、新しい main 検証が、古くなった 2 時間のリリースチェック実行の後で待機することを防ぎます。リリースブランチ／タグの検証および絞り込み再実行グループでは、`cancel-in-progress: false` を維持します。

## Live および E2E シャード

リリースの live／E2E 子ワークフローは、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、単一の直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャードとして実行します。

- `native-live-src-agents` および `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- プロバイダーでフィルタリングされた `native-live-src-gateway-profiles` ジョブ
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- 分割されたメディア音声／動画シャードおよびプロバイダーでフィルタリングされた音楽シャード

これにより、同じファイルカバレッジを維持しつつ、時間のかかる live プロバイダーの失敗を再実行して診断しやすくなります。集約された `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` のシャード名は、手動の単発再実行でも引き続き有効です。

ネイティブ live メディアシャードは、`Live Media Runner Image` ワークフローでビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 内で実行されます。このイメージには `ffmpeg` と `ffprobe` が事前インストールされており、メディアジョブではセットアップ前にバイナリを検証するだけです。Docker を利用する live スイートは通常の Blacksmith ランナー上で実行してください。コンテナジョブは、ネストした Docker テストを起動する場所として不適切です。

Docker を利用する live モデル／バックエンドシャードは、選択したコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` イメージを使用します。live リリースワークフローは、そのイメージを一度だけビルドして push します。その後、Docker live モデル、プロバイダー別に分割された Gateway、CLI バックエンド、ACP bind、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。Gateway Docker シャードには、ワークフローのジョブタイムアウトより短い、スクリプトレベルで明示された `timeout` の上限があります。これにより、停止したコンテナやクリーンアップパスは、リリースチェックの予算全体を消費せず、早期に失敗します。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドする場合、リリース実行の設定に誤りがあり、重複するイメージビルドに実時間を浪費します。

## Package Acceptance

「このインストール可能な OpenClaw パッケージは製品として動作するか」を確認する場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、Package Acceptance は、ユーザーがインストールまたは更新後に使用するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` と `.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、GitHub のステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `package_integrity` は `package-under-test` アーティファクトをダウンロードし、`scripts/check-openclaw-package-tarball.mjs` を使用して公開パッケージ tarball の契約を適用します。
3. `docker_acceptance` は、解決されたパッケージソース SHA（`workflow_ref` にフォールバック）および `package_artifact_name=package-under-test` を指定して `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能なワークフローは、そのアーティファクトをダウンロードし、tarball のインベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローのチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルで複数の対象 `docker_lanes` が選択されている場合、再利用可能なワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意のアーティファクトを持つ並列の対象 Docker ジョブとして展開します。
4. `package_telegram` は、必要に応じて `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance で解決された場合は同じ `package-under-test` アーティファクトをインストールします。スタンドアロンの Telegram ディスパッチでは、引き続き公開済みの npm spec をインストールできます。
5. `summary` は、パッケージの解決、整合性、Docker Acceptance、またはオプションの Telegram レーンが失敗した場合にワークフローを失敗させます。`advisory` 入力は、アドバイザリー用途の呼び出し元に対して Acceptance の失敗を警告に引き下げます。

### 候補ソース

- `source=npm` は、`openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような OpenClaw の正確なリリースバージョンのみを受け入れます。公開済みの延長安定版、プレリリース、または安定版の Acceptance に使用します。
- `source=ref` は、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチとタグをフェッチし、選択したコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、デタッチされた worktree に依存関係をインストールして、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。このパスでは、URL の認証情報、デフォルト以外の HTTPS ポート、プライベート、内部、特殊用途のホスト名または解決済み IP、および同じ公開安全ポリシーの範囲外へのリダイレクトを拒否します。
- `source=trusted-url` は、`.github/package-trusted-sources.json` 内の名前付き信頼済みソースポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。設定済みのホスト、ポート、パスプレフィックス、リダイレクト先ホスト、またはプライベートネットワーク解決を必要とする、メンテナー所有のエンタープライズミラーやプライベートパッケージリポジトリにのみ使用してください。ポリシーで Bearer 認証が宣言されている場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を使用します。URL に埋め込まれた認証情報は引き続き拒否されます。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部で共有されるアーティファクトには指定することを推奨します。

`workflow_ref` と `package_ref` は分離したままにしてください。`workflow_ref` は、テストを実行する信頼済みのワークフロー／ハーネスコードです。`package_ref` は、`source=ref` の場合にパックされるソースコミットです。これにより、現在のテストハーネスで古いワークフローロジックを実行せずに、以前の信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `plugins-offline` の代わりにライブの `plugins` カバレッジを使用する `package` セットに、`mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui` を追加
- `full` — OpenWebUI を含む完全な Docker リリースパスのチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合に必須

`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブの ClawHub の可用性に左右されません。オプションの Telegram レーンは、`NPM Telegram Beta E2E` で `package-under-test` アーティファクトを再利用します。公開済み npm spec のパスは、スタンドアロンのディスパッチ用に維持されます。

ローカルコマンド、Docker レーン、Package Acceptance の入力、リリースのデフォルト、障害のトリアージを含む、専用の更新および Plugin テストポリシーについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みのリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'`、および `telegram_mode=mock-openai` を指定して Package Acceptance を呼び出します。これにより、パッケージ移行、更新、ライブ ClawHub からの Skills インストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin のインストール修復、オフライン Plugin、Plugin 更新、および Telegram の検証が、同じ解決済みパッケージ tarball に対して行われます。ベータ版の公開後に、再ビルドせず出荷済み npm パッケージに対して同じマトリックスを実行するには、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定します。Package Acceptance でリリース検証の残りの部分とは異なるパッケージが必要な場合にのみ、`package_acceptance_package_spec` を設定してください。クロス OS リリースチェックでは、引き続き OS 固有のオンボーディング、インストーラー、およびプラットフォームの動作をカバーします。パッケージ／更新の製品検証は Package Acceptance から開始してください。

`published-upgrade-survivor` Docker レーンは、ブロッキングリリースパスで実行ごとに 1 つの公開済みパッケージベースラインを検証します。Package Acceptance では、解決された `package-under-test` tarball が常に候補となり、`published_upgrade_survivor_baseline` がフォールバック用の公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドでは、そのベースラインが維持されます。`run_release_soak=true` または `release_profile=full` を使用する Full Release Validation では、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` と `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加えて、固定された Plugin 互換性境界リリース、および Feishu 設定、保持された bootstrap／persona ファイル、設定済み OpenClaw Plugin のインストール、チルダを含むログパス、古いレガシー Plugin 依存関係ルート向けの issue 形式のフィクスチャまで対象を拡張します。複数ベースラインの公開済みアップグレード生存確認の選択項目は、ベースラインごとにシャード化され、個別の対象 Docker ランナージョブとして実行されます。通常の Full Release CI の範囲ではなく、公開済み更新のクリーンアップを網羅的に確認する場合は、別の `Update Migration` ワークフローで `all-since-2026.4.23` ベースラインと `plugin-deps-cleanup` シナリオを指定した `update-migration` Docker レーンを使用します。ローカルの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡したり、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一レーンに限定したり、シナリオマトリックス用に `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を設定したりできます。公開済みレーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、レシピのステップを `summary.json` に記録し、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ版およびインストーラーの新規インストールレーンでは、インストール済みパッケージが未加工の絶対 Windows パスからブラウザー制御のオーバーライドをインポートできることも検証します。OpenAI のクロス OS エージェントターン smoke は、設定されている場合はデフォルトで `OPENCLAW_CROSS_OS_OPENAI_MODEL`、それ以外は `openai/gpt-5.6-luna` を使用するため、インストールと Gateway の検証では低コストの GPT-5.6 テスト階層が使用されます。

### レガシー互換性期間

Package Acceptance には、すでに公開済みのパッケージに対する期限付きのレガシー互換性期間があります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知のプライベート QA エントリは、tarball から省略されたファイルを参照する場合があります。
- `doctor-switch` は、パッケージでそのフラグが公開されていない場合、`gateway install --wrapper` 永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball から生成された偽の git フィクスチャから欠落している pnpm `patchedDependencies` を除去でき、欠落している永続化済み `update.channel` をログに記録する場合があります。
- Plugin smoke は、レガシーのインストール記録の場所を読み取るか、マーケットプレイスのインストール記録が永続化されていないことを許容する場合があります。
- `plugin-update` は、インストール記録と再インストールしない動作が変更されないことを引き続き要求しながら、設定メタデータの移行を許可する場合があります。

公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータのスタンプファイルについて警告する場合もあります。また、`2026.5.20` までのパッケージでは、`npm-shrinkwrap.json` が欠落している場合に失敗ではなく警告とすることができます。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件では、警告またはスキップではなく失敗となります。

### 例

```bash
# 現在のベータパッケージを製品レベルのカバレッジで検証します。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 公開済みの延長安定版パッケージをパッケージカバレッジで検証します。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 現在のハーネスを使用してリリースブランチをパックし、検証します。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# tarball URL を検証します。source=url では SHA-256 が必須です。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 名前付きの信頼済みプライベートミラーポリシーから tarball を検証します。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 別の Actions 実行によってアップロードされた tarball を再利用します。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

失敗した Package Acceptance 実行をデバッグする場合は、まず `resolve_package` サマリーでパッケージソース、バージョン、および SHA-256 を確認します。次に、`docker_acceptance` 子実行と、その Docker アーティファクト（`.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズのタイミング、再実行コマンド）を調査します。Full Release Validation 全体を再実行する代わりに、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行してください。

## インストール smoke

`Install Smoke` ワークフローは、pull request または `main` への push では実行されなくなりました。夜間／手動ラッパーとリリース検証は、どちらも読み取り専用の `install-smoke-reusable.yml` コアを呼び出し、すべての実行で GitHub ホストランナー上の完全なインストール smoke パスを使用します。

- ルート Dockerfile の smoke イメージは対象 SHA ごとに一度だけビルドされ、不変アーティファクト内でワークフローリビジョンと生成元の試行に関連付けられた後、CLI smoke、エージェントが共有ワークスペースを削除する CLI smoke、コンテナ Gateway ネットワーク E2E、およびバンドル済み `matrix` Plugin の build-arg smoke によってロードされます。Plugin smoke は、ランタイム依存関係のインストールミラーリングと、エントリエスケープ診断なしで Plugin がロードされることを検証します。
- QR パッケージのインストールと、インストーラー／更新の Docker smoke（Rocky Linux インストーラーレーン、および設定可能な `update_baseline_version` npm ベースラインに対する更新レーンを含む）は別々のジョブとして実行されるため、インストーラー作業がルートイメージの smoke の後ろで待機することはありません。

低速な Bun グローバルインストールのイメージプロバイダースモークは、`run_bun_global_install_smoke` によって個別にゲートされます。これは nightly スケジュールで実行され、リリースチェックからのワークフロー呼び出しではデフォルトで有効になり、手動の `Install Smoke` ディスパッチではオプトインできます。通常の PR CI では、Node に関連する変更に対して高速な Bun ランチャーのリグレッションレーンが引き続き実行されます。QR およびインストーラーの Docker テストでは、それぞれ独自のインストール重視 Dockerfile を使用します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有ライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回パックし、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー、更新、Plugin 依存関係レーン用の最小構成の Node/Git ランナー。
- 通常の機能レーン向けに、同じ tarball を `/app` へインストールする機能イメージ。

Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs`、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` を使用してレーンごとにイメージを選択し、`OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整可能項目

| 変数                                   | デフォルト | 目的                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | 通常レーン用のメインプールのスロット数。                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | プロバイダー依存のテールプールのスロット数。                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | プロバイダーによるスロットリングを防ぐための同時ライブレーン上限。                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | npm インストールレーンの同時実行上限。                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | 複数サービスレーンの同時実行上限。                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Docker デーモンの作成集中を避けるためのレーン開始間隔。間隔をなくすには `0` を設定。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ／テールレーンでは、より厳しい上限を使用。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定   | `1` はレーンを実行せずにスケジューラープランを出力。                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定   | 完全一致するレーンをカンマ区切りで指定。クリーンアップスモークをスキップし、エージェントが失敗したレーンを 1 つ再現可能。 |

実効上限より重いレーンでも、空のプールからは開始でき、その後は容量を解放するまで単独で実行されます。ローカル集約処理は Docker を事前確認し、古い OpenClaw E2E コンテナを削除し、アクティブレーンの状態を出力し、最長優先順に並べるためにレーンの所要時間を永続化します。また、デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止します。

### 再利用可能なライブ／E2E ワークフロー

再利用可能なライブ／E2E ワークフローは、必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報のカバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせます。次に `scripts/docker-e2e.mjs` が、そのプランを GitHub の出力とサマリーに変換します。OpenClaw を `scripts/package-openclaw-for-docker.mjs` でパックするか、現在の実行からパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードした後、tarball の内容一覧を検証します。デフォルトの `no-push-artifact` パスは、Blacksmith の Docker レイヤーキャッシュを介してパッケージダイジェストでタグ付けされた最小構成／機能イメージをビルドし、イメージの正確なバイト列をイミュータブルなワークフローアーティファクトにパックして、各コンシューマーにそのアーティファクトを検証してロードさせます。一方、`existing-only` では明示的な `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 参照が必要であり、ビルドもプッシュも行いません。これらのレジストリプルでは、試行ごとに上限 180 秒のタイムアウトを使用するため、停止したストリームは CI のクリティカルパスの大半を消費せず、速やかに再試行されます。スケジュールされた検証が成功すると、`openclaw-scheduled-live-checks.yml` はイミュータブルなテスト済みイメージマニフェストを、独立したパッケージ書き込みパブリッシャーに渡します。読み取り専用のリリースおよびプレリリース呼び出し元が、その書き込み処理を通ることはありません。

### リリースパスのチャンク

リリース向け Docker カバレッジでは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を使用して小さく分割されたジョブを実行します。各チャンクは、必要なアーティファクトベースのイメージ種別のみを検証してロードするか、明示的な `existing-only` 再利用ではプルし、同じ重み付きスケジューラーで複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

現在のリリース向け Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、および `openwebui` です。`package-update-openai` にはライブ Codex Plugin パッケージレーンが含まれます。このレーンは、候補の OpenClaw パッケージをインストールし、Codex CLI のインストールを明示的に承認したうえで `codex_plugin_spec` または同一 ref の tarball から Codex Plugin をインストールし、Codex CLI の事前確認を実行してから、OpenAI に対して同一セッション内で複数回の OpenClaw エージェントターンを実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は引き続き Plugin／ランタイムの集約エイリアスです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンに対する手動再実行用の集約エイリアスとして残ります。

OpenWebUI は、安定版または完全なリリースパスのカバレッジで要求された場合、再利用可能なワークフローが対応ジョブを GitHub ホステッドランナーへ振り分ける場合でも、専用の大容量ディスク Blacksmith ランナー上で独立した `openwebui` チャンクとして実行されます。外部イメージのプルを分離することで、大容量イメージが `plugins-runtime-services` 内の共有パッケージおよび Plugin イメージと競合するのを防ぎます。従来の Plugin／ランタイム集約チャンクには、互換性のある手動再実行向けに引き続き OpenWebUI が含まれます。バンドル済みチャンネルの更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、低速レーンの表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに、その実行用に準備されたイメージに対して選択したレーンを実行します。これにより、失敗したレーンのデバッグを対象の Docker ジョブ 1 つに限定できます。選択したレーンがライブ Docker レーンの場合、その対象ジョブは再実行用のライブテストイメージをローカルでビルドします。内部の再利用可能ワークフローのパッケージタプルは `workflow_dispatch` スキーマの一部ではないため、再実行ヘルパーは失敗アーティファクトで選択された正確な対象 SHA を検証し、手動ディスパッチはその ref を再パックします。生成されるコマンドには、準備済みイメージの入力と、それらの入力が GHCR ベースの場合に限り `shared_image_policy=existing-only` が含まれます。ランナーローカルのアーティファクトタグは省略されるため、新しいランナーでは再ビルドされます。明示的な対象オーバーライドを指定すると、アーティファクトによってオーバーライドとの一致が証明されない限り、復元された GHCR イメージ参照は破棄されます。完全リリース用の一時ブランチは削除されるため、アーティファクトから生成されたワークフロー定義の ref も省略されます。オペレーターが明示的にオーバーライドしない限り、ディスパッチにはリポジトリのデフォルトブランチが使用されます。

```bash
pnpm test:docker:rerun <run-id>      # Docker アーティファクトをダウンロードし、統合およびレーンごとの対象再実行コマンドを出力
pnpm test:docker:timings <summary>   # 低速レーンおよびフェーズのクリティカルパスのサマリー
```

スケジュールされたライブ／E2E ワークフローは、完全なリリースパスの Docker スイートを毎日実行し、成功後に、テストされた正確なイメージアーティファクト向けの明示的なパブリッシャーを呼び出します。

## Plugin プレリリース

`Plugin Prerelease` は、より高コストな製品／パッケージカバレッジであるため、`Full Release Validation` またはオペレーターによる明示的な操作でディスパッチされる独立したワークフローです。通常のプルリクエスト、`main` プッシュ、および単独の手動 CI ディスパッチでは、このスイートは無効のままです。バンドル済み Plugin のテストを 8 つの拡張ワーカーに分散します。これらの拡張シャードジョブは、インポート量の多い Plugin バッチによって追加の CI ジョブが作成されないよう、Node のヒープを拡大し、グループごとに 1 つの Vitest ワーカーを使用して、同時に最大 2 つの Plugin 設定グループを実行します。リリース専用の Docker プレリリースパス（`full_release_validation` 入力で有効化）は、対象の Docker レーンを 4 つずつのグループにまとめ、1〜3 分のジョブのために数十台のランナーを確保することを避けます。このワークフローは、`@openclaw/plugin-inspector` から参考情報として `plugin-inspector-advisory` アーティファクトもアップロードします。インスペクターの検出結果はトリアージ用の入力であり、ブロッキング対象である Plugin プレリリースゲートには影響しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフローとは別に専用の CI レーンがあります。エージェント動作の同等性検証は、単独の PR ワークフローではなく、広範な QA およびリリースハーネス内に含まれています。同等性検証を広範な検証実行に含める場合は、`rerun_group=qa-parity` とともに `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` の nightly および手動ディスパッチで実行されます。モック同等性レーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram／Discord は Convex リースを使用します。

リリースチェックでは、決定論的モックプロバイダーとモック用モデル（`mock-openai/gpt-5.6-luna` および `mock-openai/gpt-5.6-luna-alt`）を使用して Matrix および Telegram のライブトランスポートレーンを実行し、チャンネル契約をライブモデルのレイテンシーと通常のプロバイダー Plugin 起動から分離します。QA 同等性検証でメモリの動作を別途カバーするため、ライブトランスポート Gateway ではメモリ検索を無効にします。プロバイダー接続は、独立したライブモデル、ネイティブプロバイダー、および Docker プロバイダーの各スイートでカバーされます。

Matrix は、スケジュールおよびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合に限り `--fail-fast` を追加します。CLI のデフォルトおよび手動ワークフロー入力は引き続き `all` です。手動の `matrix_profile=all` ディスパッチでは、完全な Matrix カバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の各ジョブに分割します。

`OpenClaw Release Checks` は、リリース承認前にリリースクリティカルな QA Lab レーンも実行します。その QA 同等性ゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、両方のアーティファクトを小規模なレポートジョブへダウンロードして、最終的な同等性比較を行います。

通常の PR では、同等性検証を必須ステータスとして扱わず、スコープされた CI／チェックの証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、リポジトリ全体のスキャンではなく、意図的に範囲を絞った初回セキュリティスキャナーです。日次、手動、`main` プッシュ、およびドラフトではないプルリクエストのガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript／TypeScript サーフェスを、高／重大の `security-severity` に絞った確信度の高いセキュリティクエリでスキャンします。

プルリクエストのガードは軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有するバンドル済み Plugin のランタイムパス配下に変更がある場合にのみ開始し、スケジュールされたワークフローと同じ、確信度の高いセキュリティマトリクスを実行します。Android および macOS の CodeQL は、PR のデフォルト対象には含まれません。

### セキュリティカテゴリー

| カテゴリ                                          | 対象範囲                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway のベースライン                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査の接点              |
| `/codeql-security-high/network-ssrf-boundary`     | コアの SSRF、IP 解析、ネットワークガード、ウェブフェッチ、および Plugin SDK の SSRF ポリシー対象範囲                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、およびエージェントツール実行ゲート                                           |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス生成ヘルパー、サブプロセスを所有するバンドル済み Plugin ランタイム、およびワークフロースクリプト連携                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin のインストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーによるインストール、ソース読み込み、および Plugin SDK パッケージ契約の信頼境界 |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュール実行される Android セキュリティシャード。ワークフローの健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` としてアップロードします。
- `CodeQL macOS Critical Security` — 毎週または手動で実行される macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、アップロードする SARIF から依存関係のビルド結果を除外して、`/codeql-critical-security/macos` としてアップロードします。問題がない場合でも macOS ビルドが実行時間の大半を占めるため、日次のデフォルト対象からは除外されています。

### 重要な品質カテゴリ

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。品質スキャンが Blacksmith のランナー登録予算を消費しないよう、GitHub ホストの Linux ランナー上で、限定された高価値の対象範囲に対して、エラー重大度のみの非セキュリティ JavaScript/TypeScript 品質クエリを実行します。プルリクエスト用のガードは、スケジュール実行プロファイルより意図的に小さく設定されています。ドラフトではない PR では、変更対象に対応するシャードのみを、PR からルーティング可能な 13 個のシャード（`agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary`、`session-diagnostics-boundary`）から実行します。`ui-control-plane` と `web-media-runtime-boundary` は PR 実行の対象外です。CodeQL 設定と品質ワークフローの変更では、PR シャード一式をすべて実行します（ネットワークランタイムシャードは、それ自体の CodeQL 設定ファイルとネットワークを所有するソースパスを基準に起動します）。

手動ディスパッチでは、次を指定できます。

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

限定プロファイルは、1 つの品質シャードを分離して実行するための学習・反復用フックです。

| カテゴリ                                                | 対象範囲                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、および Gateway のセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、および IO 契約                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマおよびサーバーメソッド契約                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルおよびバンドル済みチャネル Plugin の実装契約                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル／プロバイダーのディスパッチ、自動返信のディスパッチとキュー、および ACP コントロールプレーンのランタイム契約                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、およびアウトバウンド配信契約                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の連携、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | ネットワークポリシーパッケージ、raw ソケットおよびプロキシキャプチャのランタイム、SSH トンネル、Gateway ロック、JSONL ソケット、およびプッシュ転送の対象範囲                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 返信キューの内部実装、セッション配信キュー、アウトバウンドセッションのバインド／配信ヘルパー、診断イベント／ログバンドルの対象範囲、およびセッション doctor CLI 契約 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK の受信返信ディスパッチ、返信ペイロード／チャンク化／ランタイムヘルパー、チャネル返信オプション、配信キュー、およびセッション／スレッドのバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログの正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーのデフォルト／カタログ、およびウェブ／検索／フェッチ／埋め込みレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI のブートストラップ、ローカル永続化、Gateway 制御フロー、およびタスクコントロールプレーンのランタイム契約                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コアのウェブフェッチ／検索、メディア IO、メディア理解、画像生成、およびメディア生成のランタイム契約                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開対象範囲、および Plugin SDK エントリポイント契約                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースおよび Plugin パッケージ契約ヘルパー                                                                                      |

品質をセキュリティから分離することで、セキュリティシグナルを不明瞭にせずに、品質上の検出事項をスケジュール、測定、無効化、拡張できます。Swift、Python、およびバンドル済み Plugin への CodeQL 拡張は、限定プロファイルの実行時間とシグナルが安定した後にのみ、対象範囲を限定またはシャード化したフォローアップ作業として再追加する必要があります。

## メンテナンスワークフロー

### Docs Agent

`Docs Agent` ワークフローは、既存ドキュメントを最近取り込まれた変更に合わせて維持するための、イベント駆動型 Codex メンテナンスレーンです。純粋なスケジュール実行はありません。`main` への bot 以外の push による CI 実行が成功すると起動でき、手動ディスパッチでも直接実行できます。ワークフロー実行による起動では、`main` が先に進んでいる場合、または過去 1 時間以内にスキップされていない別の Docs Agent 実行が作成されている場合はスキップします。実行時には、前回スキップされなかった Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に main に蓄積されたすべての変更を対象にできます。

### Test Performance Agent

`Test Performance Agent` ワークフローは、遅いテスト向けのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュール実行はありません。`main` への bot 以外の push による CI 実行が成功すると起動できますが、同じ UTC 日に別のワークフロー実行による起動がすでに完了しているか実行中の場合はスキップします。手動ディスパッチでは、この日次アクティビティゲートを回避します。このレーンは、フルスイートをグループ化した Vitest パフォーマンスレポートを生成し、Codex が広範なリファクタリングではなく、カバレッジを維持する小規模なテストパフォーマンス修正のみを行えるようにします。その後、フルスイートのレポートを再実行し、成功するベースラインテスト数を減らす変更を拒否します。グループ化されたレポートには、Linux と macOS での設定ごとの実時間と最大 RSS が記録されるため、変更前後の比較で実行時間の差分と並べてテストメモリの差分を確認できます。ベースラインに失敗するテストがある場合、Codex が修正できるのは明白な失敗のみであり、エージェント実行後のフルスイートレポートは、何かをコミットする前に成功しなければなりません。bot の push が取り込まれる前に `main` が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。Codex アクションで Docs Agent と同じ sudo 権限削除の安全方針を維持できるよう、GitHub ホストの Ubuntu を使用します。

### マージ後の重複 PR

`Duplicate PRs After Merge` ワークフローは、取り込み後に重複を整理するためのメンテナー向け手動ワークフローです。デフォルトではドライランとなり、`apply=true` の場合にのみ、明示的に指定された PR をクローズします。GitHub を変更する前に、取り込まれた PR がマージ済みであることと、各重複 PR に共通の参照 issue または重複する変更ハンクがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームの対象範囲よりも、アーキテクチャ境界について厳格です。

- コアの本番コード変更では、コア本番コードとコアテストの型チェックに加え、コアの lint／ガードを実行します。
- コアのテストのみの変更では、コアテストの型チェックとコアの lint のみを実行します。
- 拡張機能の本番コード変更では、拡張機能の本番コードと拡張機能テストの型チェックに加え、拡張機能の lint を実行します。
- 拡張機能のテストのみの変更では、拡張機能テストの型チェックと拡張機能の lint を実行します。
- 公開 Plugin SDK または Plugin 契約の変更では、拡張機能がそれらのコア契約に依存しているため、拡張機能の型チェックまで対象を拡大します（Vitest の拡張機能スイープは、明示的なテスト作業として扱われます）。
- リリースメタデータのみのバージョン更新では、対象を限定したバージョン／設定／ルート依存関係チェックを実行します。
- 不明なルート／設定変更では、安全側に倒してすべてのチェックレーンを実行します。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストです。テストを直接変更した場合はそのテスト自体を実行し、ソース変更では明示的なマッピングを優先した後、同階層のテストとインポートグラフ上の依存先を実行します。共有グループルーム配信設定は、明示的なマッピングの 1 つです。グループの可視返信設定、ソース返信配信モード、またはメッセージツールのシステムプロンプトに対する変更は、コア返信テストに加えて Discord と Slack の配信回帰テストへルーティングされるため、共有デフォルトの変更は最初の PR push より前に失敗を検出できます。変更がハーネス全体に及び、この低コストなマッピングセットを信頼できる代替指標として扱えない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

## Testbox 検証

Crabbox は、メンテナーによる Linux 検証向けのリポジトリ所有リモートボックスラッパーです。Agent
セッションでは、既存の依存関係がインストール済みの場合に限り、信頼済みソースに対する
1 個または少数の焦点を絞ったテストと低コストの静的チェックのみをローカルで実行します。より大規模なスイートや、
ビルド、型チェック、lint のファンアウト、
Docker、パッケージレーン、E2E、ライブ検証、CI 同等性など、計算負荷の高い作業には Crabbox を使用します。信頼済みメンテナーによる高負荷の
検証では、デフォルトで `blacksmith-testbox` を使用し、`.crabbox.yaml` も現在はこれをデフォルトとします。設定済みの
ワークフローはプロバイダーと Agent の認証情報をハイドレートするため、信頼されていないコントリビューターまたは
フォークのコードでは、代わりにシークレットなしのフォーク CI またはサニタイズ済みの直接 AWS Crabbox を使用する必要があります。
サニタイズ済み AWS 実行では `CRABBOX_ENV_ALLOW=CI` を設定し、
`--no-hydrate` を渡して、新しい一時リモート `HOME` を使用します。これにより、リポジトリの
`OPENCLAW_*` 許可リストと既存の認証プロファイルが信頼されていないコードに到達するのを防ぎます。
その信頼されていないソース専用に新しくウォームアップしたリースを使用し、
信頼済みまたは以前にハイドレートしたリースは決して使用しません。クリーンな信頼済み `main` チェックアウトから、
インストール済みの信頼できる Crabbox
バイナリを起動し、`--fresh-pr` を使用してリモート PR のみをフェッチします。信頼されていないチェックアウトのラッパーや設定をローカルで実行してはなりません。
`CRABBOX_AWS_INSTANCE_PROFILE` を設定解除し、解決された
`aws.instanceProfile` が空でない限り、フェイルクローズします。インストールやテストの前に、信頼済みの
絶対パスツールを使用して IMDSv2 トークンを必須とし、IAM 認証情報
エンドポイントが 404 を返すことを証明し、リモートの `git rev-parse HEAD` をレビュー済み PR ヘッドの完全な SHA と
比較します。リースをその SHA に紐付け、ヘッドが変更された場合は停止して再ウォームアップします。
クリーンな `main` から信頼済みの `scripts/crabbox-untrusted-bootstrap.sh` を
`--fresh-pr` とともにアップロードします。これは固定バージョンの Node/pnpm をインストールし、SHA と
パッケージマネージャーの固定バージョンを検証し、`HOME` を分離して依存関係をインストールした後、
要求されたテストを実行します。
すべての `CRABBOX_TAILSCALE*` オーバーライドを設定解除し、`--network public
--tailscale=false` を強制し、exit-node/LAN フラグをクリアして、スクリプトをアップロードする前に `crabbox inspect` が
Tailscale 状態なしのパブリックネットワークを報告することを必須とします。
所有する AWS/Hetzner キャパシティは、Blacksmith の障害、
クォータ問題、または所有キャパシティを明示的にテストする場合のフォールバックでもあります。

Agent は、予定されている作業のために事前ウォームアップしません。最初の高負荷コマンドの
準備ができた時点で Testbox を遅延取得し、返された `tbx_...` ID を以降の高負荷
コマンドで再利用し、実行ごとに現在のチェックアウトを同期して、引き渡し前に停止します。

Crabbox を基盤とする Blacksmith 実行では、ワンショット Testbox のウォームアップ、要求、同期、実行、レポート、クリーンアップを
行います。組み込みの同期健全性チェックは、同期先ボックスの
`git status --short` が追跡対象ファイルの削除を 200 件以上示す場合に即座に失敗し、
`pnpm-lock.yaml` のようなルートファイルの消失を検出します。意図的に
大量削除を行う PR では、リモートコマンドに `CRABBOX_ALLOW_MASS_DELETIONS=1` を設定します。

Crabbox は、同期後の出力がないまま
同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了します。このガードを無効にするには
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、ローカル差分が異常に大きい場合は
より大きなミリ秒値を使用します。

初回実行前に、リポジトリルートからラッパーを確認します。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、選択したプロバイダーを公開していない古い Crabbox バイナリを拒否します。また、Blacksmith を基盤とする実行では、ラッパーが現在の Testbox の同期、キュー、クリーンアップ動作を利用できるよう、Crabbox 0.22.0 以降が必要です。Codex ワークツリーまたはリンク済み／スパースチェックアウトでは、Crabbox の起動前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトを避け、代わりに Node ラッパーを直接呼び出します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

隣接チェックアウトを使用する場合は、計測または検証作業の前に、無視対象のローカルバイナリを再ビルドします。

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` の `blacksmith:` ブロックでは、組織、ワークフロー、ジョブ、ref のデフォルトがすでに固定されているため、以下の明示的なフラグは省略できます。変更ゲート：

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

ローカルの依存関係が利用できない場合、または対象がファンアウトする場合に、Testbox で焦点を絞ったテストを再実行します。

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

フルスイート：

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

最後の JSON サマリーを確認します。有用なフィールドは `provider`、`leaseId`、
`syncDelegated`、`exitCode`、`commandMs`、`totalMs` です。委任された
Blacksmith Testbox 実行では、Crabbox ラッパーの終了コードと JSON サマリーが
コマンド結果です。リンクされた GitHub Actions 実行がハイドレーションと keepalive を所有します。SSH
コマンドがすでに返った後に Testbox が外部から停止されると、`cancelled` として完了することがあります。
ラッパーの `exitCode` がゼロ以外であるか、コマンド出力がテスト失敗を示さない限り、
これはクリーンアップ／ステータスの副産物として扱います。
ワンショットの Blacksmith 基盤 Crabbox 実行では、Testbox が自動的に停止される必要があります。
実行が中断された場合、またはクリーンアップが不明確な場合は、稼働中のボックスを調べ、作成した
ボックスのみを停止します。

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレート済みボックスで複数のコマンドを意図的に実行する必要がある場合にのみ、再利用します。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

古いソースではなく、リースを再利用します。実行ごとに
現在のチェックアウトがアップロードされるよう `--no-sync` は省略します。変更されていない同期済みツリーを
意図的に再実行する場合にのみ使用します。信頼されていないコントリビューター／フォークのコードでは、
すべてのコマンドで `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`、および新しい
一時リモート `HOME` を使用する必要があります。テスト前に、そのサニタイズ済みコマンド内で依存関係をインストールします。
同じ信頼されていないソース専用に新しくウォームアップしたリースのみを再利用し、
信頼済みまたは以前にハイドレートしたリースは決して使用しません。信頼されていないチェックアウトのラッパーや設定を
ローカルで実行してはなりません。クリーンな信頼済み `main` からインストール済みの
信頼できる Crabbox バイナリを起動し、実行ごとに `--fresh-pr` を渡します。
`CRABBOX_AWS_INSTANCE_PROFILE` は未設定のままにし、解決された
インスタンスプロファイルが空でない場合は拒否し、信頼済みリモートの IMDS によるロール不在の証明を必須とし、インストール／テスト前に
レビュー済みヘッド SHA を検証します。リースをその SHA に紐付け、ヘッドが変更された場合は
停止して再ウォームアップします。リモート PR が存在しない場合は、シークレットなしのフォーク CI を使用します。
信頼されていないソースでは、`hydrate-github` または認証情報をハイドレートする Blacksmith ワークフローを
決して選択しません。

Crabbox レイヤーが壊れているものの Blacksmith 自体は動作する場合、直接
Blacksmith を使用するのは、`list`、`status`、クリーンアップなどの診断に限ります。直接 Blacksmith を実行した結果を
メンテナー検証として扱う前に、Crabbox の経路を修正します。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するものの、新しい
ウォームアップが数分経っても IP や Actions 実行 URL なしで `queued` のままの場合は、
Blacksmith のプロバイダー、キュー、請求、または組織制限による圧力として扱います。作成した
キュー内の ID を停止し、Testbox を追加で起動せず、誰かが Blacksmith のダッシュボード、
請求、組織制限を確認する間、検証を以下の所有 Crabbox キャパシティ経路へ移します。

Blacksmith が停止している、クォータ制限に達している、必要な環境がない、または所有キャパシティ自体が明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします。

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

AWS に負荷がかかっている状況では、タスクが本当に 48xlarge クラスの CPU を必要としない限り、`class=beast` を避けます。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot またはオンデマンド Standard クォータに最も容易に抵触します。リポジトリ所有の `.crabbox.yaml` は `class: standard`、オンデマンドマーケット、`capacity.hints: true` をデフォルトとするため、仲介された AWS リースでは、選択されたリージョン／マーケット、クォータ圧力、Spot フォールバック、高負荷クラスの警告が出力されます。より負荷の高い広範なチェックには `fast` を使用し、standard/fast では不十分な場合にのみ `large` を使用します。`beast` は、フルスイートや全 Plugin の Docker マトリクス、明示的なリリース／ブロッカー検証、高コア数のパフォーマンスプロファイリングなど、例外的に CPU 負荷の高いレーンにのみ使用します。`pnpm check:changed`、焦点を絞ったテスト、ドキュメントのみの作業、通常の lint／型チェック、小規模な E2E 再現、Blacksmith 障害のトリアージには `beast` を使用しません。キャパシティ診断には `--market on-demand` を使用し、Spot マーケットの変動が診断信号に混入しないようにします。

`.crabbox.yaml` は、プロバイダー、同期、GitHub Actions ハイドレーションのデフォルトを所有します。Crabbox の同期では `.git` を転送しないため、ハイドレート済み Actions チェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期する代わりに、自身のリモート Git メタデータを保持します。また、リポジトリ設定では、決して転送すべきでないローカルのランタイム／ビルド成果物（`.artifacts` やテストレポートなど）も除外されます。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm のセットアップ、`origin/main` のフェッチ、および所有クラウドの `crabbox run --id <cbx_id>` コマンドへの非シークレット環境の引き渡しを所有します。

## 関連項目

- [インストールの概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
