---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
    - リリース検証の実行または再実行を調整しています
    - ClawSweeper のディスパッチまたは GitHub アクティビティの転送を変更する場合
summary: CI ジョブグラフ、スコープゲート、リリース包括ジョブ、ローカルコマンドの対応関係
title: CI パイプライン
x-i18n:
    generated_at: "2026-07-12T14:22:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI は、`main` へのプッシュ（トリガーでは Markdown および `docs/**` のパスは無視されます）、
ドラフトではないプルリクエスト（CHANGELOG のみの差分は無視されます）、
および手動ディスパッチで実行されます。正規の `main` へのプッシュは、まず 90 秒間の
ホステッドランナー受け入れ待機を通過します。`CI` 同時実行グループは、
より新しいコミットが到着すると、その待機中の実行をキャンセルするため、連続するマージごとに
完全な Blacksmith マトリックスが登録されることはありません。プルリクエストと手動ディスパッチでは、この待機をスキップします。
その後、`preflight` ジョブが差分を分類し、関連のない領域だけが変更された場合は、
コストの高いレーンを無効にします。手動の `workflow_dispatch` 実行は意図的に
スマートスコープを迂回し、リリース候補と広範な検証のためにグラフ全体へ
処理を展開します。Android レーンは、`include_android`（または
`release_gate` 入力）を通じてオプトインのままです。リリース専用の Plugin カバレッジは、別の
[`Plugin Prerelease`](#plugin-prerelease) ワークフローにあり、
[`Full Release Validation`](#full-release-validation) または明示的な手動
ディスパッチからのみ実行されます。

## パイプラインの概要

| ジョブ                               | 目的                                                                                                                                                                                                                  | 実行タイミング                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ドキュメントのみの変更、変更されたスコープ、変更された拡張機能を検出し、CI マニフェストを構築する                                                                                                                    | ドラフトではないプッシュおよび PR で常に実行       |
| `runner-admission`                 | Blacksmith の作業が登録される前に、正規の `main` へのプッシュに対してホスト環境で 90 秒間のデバウンスを行う                                                                                                          | CI 実行ごと。正規の `main` へのプッシュ時のみ待機  |
| `security-fast`                    | 秘密鍵の検出、`zizmor` による変更されたワークフローの監査、および本番用ロックファイルの監査                                                                                                                          | ドラフトではないプッシュおよび PR で常に実行       |
| `pnpm-store-warmup`                | Linux Node シャードをブロックせずに、ロックファイルで固定された pnpm ストアキャッシュをウォームアップする                                                                                                            | Node またはドキュメントチェックレーンが選択された場合 |
| `build-artifacts`                  | `dist/`、Control UI、ビルド済み CLI のスモークチェック、起動時メモリ、および埋め込みビルド成果物のチェックを実行する                                                                                                  | Node 関連の変更                                     |
| `control-ui-i18n`                  | 生成された Control UI のロケールバンドル、メタデータ、および翻訳メモリを検証する。自動実行では勧告扱い、手動リリース CI ではブロッキング扱い                                                                         | Control UI の i18n 関連の変更および手動 CI          |
| `checks-fast-core`                 | 高速な Linux 正確性レーン：バンドル済み機能 + プロトコル、Bun ランチャー、および CI ルーティングの高速タスク                                                                                                         | Node 関連の変更                                     |
| `qa-smoke-ci-profile`              | 制限付き自動 QA スモーク代表セットを、自己完結した均衡の取れた 2 パートに分割して実行する。分類全体の網羅は明示的な QA プロファイルを通じて引き続き利用可能                                                            | Node 関連の変更                                     |
| `checks-fast-contracts-plugins-*`  | 重み付けされた 2 つの Plugin コントラクトシャード                                                                                                                                                                    | Node 関連の変更                                     |
| `checks-fast-contracts-channels-*` | 重み付けされた 2 つのチャネルコントラクトシャード                                                                                                                                                                    | Node 関連の変更                                     |
| `checks-node-*`                    | チャネル、バンドル済み機能、コントラクト、および拡張機能のレーンを除く、コア Node テストシャード                                                                                                                      | Node 関連の変更                                     |
| `check-*`                          | シャード化された主要ローカルゲート相当：ガード、shrinkwrap、バンドル済みチャネル設定メタデータ、本番型、lint、依存関係、テスト型                                                                                     | Node 関連の変更                                     |
| `check-additional-*`               | 境界チェックストライプ（プロンプトスナップショットのドリフトを含む）、セッションアクセサー／トランスクリプトリーダー／SQLite トランザクション境界、拡張機能 lint グループ、パッケージ境界のコンパイル／カナリア、ランタイムトポロジーアーキテクチャ | Node 関連の変更                                     |
| `checks-node-compat-node22`        | Node 22 互換性ビルドおよびスモークレーン                                                                                                                                                                             | リリース向けの手動 CI ディスパッチ                  |
| `check-docs`                       | ドキュメントのフォーマット、lint、およびリンク切れのチェック                                                                                                                                                         | ドキュメントが変更された場合（PR および手動ディスパッチ） |
| `native-i18n`                      | ネイティブアプリ、Android、および Apple の i18n インベントリチェック                                                                                                                                                 | ネイティブ i18n 関連の変更                          |
| `skills-python`                    | Python ベースの Skills に対する Ruff + pytest                                                                                                                                                                         | Python Skills 関連の変更                            |
| `checks-windows`                   | Windows 固有のプロセス／パステストと、共有ランタイムのインポート指定子に関するリグレッションテスト                                                                                                                   | Windows 関連の変更                                  |
| `macos-node`                       | macOS に重点を置いた TypeScript テスト：launchd、Homebrew、ランタイムパス、パッケージングスクリプト、プロセスグループラッパー                                                                                         | macOS 関連の変更                                    |
| `macos-swift`                      | macOS アプリ向けの Swift lint、ビルド、およびテスト                                                                                                                                                                  | macOS 関連の変更                                    |
| `ios-build`                        | Xcode プロジェクトの生成および iOS アプリのシミュレータービルド                                                                                                                                                       | iOS アプリ、共有アプリキット、または Swabble の変更 |
| `android`                          | 両方のフレーバーに対する Android 単体テストと、デバッグ APK ビルド 1 件                                                                                                                                               | Android 関連の変更                                  |
| `test-performance-agent`           | 独立したワークフロー：信頼されたアクティビティ後に Codex の低速テストを毎日最適化する                                                                                                                                 | メイン CI の成功時または手動ディスパッチ            |
| `openclaw-performance`             | 独立したワークフロー：モックプロバイダー、詳細プロファイル、および GPT 5.6 ライブレーンを使用した Kova ランタイムのパフォーマンスレポートを毎日またはオンデマンドで生成する                                             | スケジュール実行および手動ディスパッチ              |

## フェイルファストの順序

1. `runner-admission` は正規の `main` へのプッシュのみを待機します。より新しいプッシュがあると、Blacksmith への登録前に実行がキャンセルされます。
2. `preflight` は、どのレーンを存在させるかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内のステップであり、独立したジョブではありません。
3. `security-fast`、`check-*`、`check-additional-*`、`check-docs`、`skills-python` は、負荷の高いアーティファクトおよびプラットフォームマトリックスのジョブを待たずに迅速に失敗します。
4. `build-artifacts` と勧告的な `control-ui-i18n` チェックは、高速な Linux レーンと並行して実行されます。生成されたロケールの差分は、独立した更新ワークフローがバックグラウンドで修復している間も可視のままです。
5. その後、より負荷の高いプラットフォームおよびランタイムのレーンが並列展開されます。対象は `checks-fast-core`、`checks-fast-contracts-plugins-*`、`checks-fast-contracts-channels-*`、`checks-node-*`、`checks-windows`、`macos-node`、`macos-swift`、`ios-build`、`android` です。

同じ PR または `main` ref に新しいプッシュが反映されると、GitHub は置き換えられたジョブを `cancelled` としてマークする場合があります。同じ ref の最新の実行も失敗している場合を除き、これは CI のノイズとして扱ってください。マトリックスジョブでは `fail-fast: false` を使用し、`build-artifacts` は小さな検証ジョブをキューに追加する代わりに、組み込みのチャンネル、コアサポート境界、gateway-watch の失敗を直接報告します。自動 CI の並行実行キーはバージョン管理されており（`CI-v7-*`）、古いキューグループ内の GitHub 側のゾンビが、より新しい main の実行を無期限にブロックすることはありません。手動のフルスイート実行では `CI-manual-v1-*` を使用し、進行中の実行をキャンセルしません。Plugin 一覧の起動時メモリガードは、セルフホストの Blacksmith Linux では上限を 350 MiB に維持し、同じビルド済み CLI でも RSS ベースラインが高い GitHub ホストの Linux では 425 MiB を許容します。

GitHub Actions のウォール時間、キュー時間、最も遅いジョブ、失敗、および `pnpm-store-warmup` の並列展開バリアを要約するには、`pnpm ci:timings`、`pnpm ci:timings:recent`、または `node scripts/ci-run-timings.mjs <run-id>` を使用します。ワークフロー内の `ci-timings-summary` ジョブは `ci.yml` に存在しますが、現在は無効化されています（`if: false`）。代わりに、タイミングヘルパーをローカルで実行してください。ビルド時間については、`build-artifacts` ジョブの `Build dist` ステップを確認してください。`pnpm build:ci-artifacts` は `[build-all] phase timings:` を出力し、`ui:build` を含みます。また、このジョブは `startup-memory` アーティファクトもアップロードします。

## PR のコンテキストとエビデンス

外部コントリビューターの PR では、
`.github/workflows/real-behavior-proof.yml` から PR のコンテキストとエビデンスのゲートが実行されます。このワークフローは、
信頼されたワークフローリビジョン（`github.workflow_sha`）をチェックアウトし、PR 本文
のみを評価します。コントリビューターブランチのコードは実行しません。

このゲートは、リポジトリのオーナー、メンバー、
コラボレーター、または bot ではない PR 作成者に適用されます。PR 本文に作成者自身が記述した
`What Problem This Solves` セクションと `Evidence` セクションが含まれている場合に通過します。エビデンスには、対象を絞った
テスト、CI 結果、スクリーンショット、録画、ターミナル出力、ライブ観測、
秘匿化済みログ、または成果物へのリンクを使用できます。本文は意図と有用な検証結果を示し、
レビュー担当者はコード、テスト、CI を確認して正しさを評価します。

チェックが失敗した場合は、別のコードコミットをプッシュするのではなく、PR 本文を更新してください。

## スコープとルーティング

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。手動ディスパッチでは変更スコープの検出をスキップし、すべてのスコープ対象領域が変更されたものとしてプリフライトマニフェストを動作させます。

- **CI ワークフローの編集**では、Node CI グラフ、ワークフローの lint、および Windows レーン（`ci.yml` が実行）を検証しますが、それだけで iOS、Android、macOS のネイティブビルドを強制することはありません。これらのプラットフォームレーンは、引き続きプラットフォームのソース変更のみを対象とします。
- **ワークフローの健全性チェック**では、すべてのワークフロー YAML ファイルに対する `actionlint` と `zizmor`、複合アクションの補間ガード、および競合マーカーガードを実行します。PR スコープの `security-fast` ジョブでも変更されたワークフローファイルに対して `zizmor` を実行するため、ワークフローのセキュリティ上の問題はメイン CI グラフ内で早期に失敗します。
- **`main` へのプッシュ時のドキュメント**は、CI と同じ ClawHub ドキュメントミラーを使用する独立した `Docs` ワークフローによってチェックされます。そのため、コードとドキュメントが混在するプッシュで CI の `check-docs` シャードまでキューに追加されることはありません。Pull Request と手動 CI では、ドキュメントが変更された場合、引き続き CI から `check-docs` を実行します。
- **TUI PTY**は、TUI の変更に対して `checks-node-core-runtime-tui-pty` Linux Node シャードで実行されます。このシャードは `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` を指定して `test/vitest/vitest.tui-pty.config.ts` を実行するため、決定論的な `TuiBackend` フィクスチャレーンと、外部モデルエンドポイントのみをモックする低速な `tui --local` スモークテストの両方をカバーします。
- **CI ルーティングのみの編集、高速タスクが直接実行する少数のコアテストフィクスチャ、および限定的な Plugin コントラクトヘルパーの編集**では、高速な Node 専用マニフェストパスを使用します。実行対象は `preflight`、`security-fast`、および変更が影響する高速レーンのみです。具体的には、単一の `checks-fast-core` CI ルーティングタスク、2 つの Plugin コントラクトシャード、またはその両方です。このパスでは、ビルド成果物、Node 22 互換性、チャネルコントラクト、完全なコアシャード、同梱 Plugin シャード、および追加のガードマトリクスをスキップします。
- **Windows Node チェック**は、Windows 固有のプロセス／パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフローの対象領域に限定されます。無関係なソース、Plugin、インストールスモーク、テストのみの変更は Linux Node レーンに留まります。

最も低速な Node テストファミリーは、各ジョブを小さく保ちつつランナーを過剰に予約しないように分割または均等化されています。

- Plugin コントラクトとチャネルコントラクトは、それぞれ標準の GitHub ランナーフォールバックを備えた、重み付きの Blacksmith バックエンドによる 2 つのシャードとして実行されます。
- コアユニットの高速レーンとサポートレーンは個別に実行されます。コアランタイムインフラは、プロセス、共有、フック、シークレット、および 3 つの Cron ドメインシャードに分割されます。
- 自動返信は均等化されたワーカーとして実行され、返信サブツリーはエージェントランナー、コマンド、ディスパッチ、セッション、および状態ルーティングの各シャードに分割されます。
- エージェント型 Gateway／サーバー（コントロールプレーン）設定は、ビルド済み成果物を待つ代わりに、チャット、認証、モデル、HTTP／Plugin、ランタイム、および起動レーンに分割されます。
- 通常の CI では、分離されたインフラの include パターンシャードのみを、最大 64 テストファイルの決定論的なバンドルにまとめます。これにより、非分離型のコマンド／Cron、ステートフルな agents-core、または Gateway／サーバースイートを統合することなく Node マトリクスを削減します。負荷の高い固定スイートは引き続き 8 vCPU を使用し、バンドル済みレーンと低ウェイトレーンは 4 vCPU を使用します。
- 正規リポジトリの Pull Request では、コンパクトな受け入れプランを使用します。同じ設定別グループを分離されたサブプロセスで実行し、現在は 74 ジョブの完全マトリクスではなく 19 個の Node テストジョブを使用します。単一の設定全体バッチは、120 分のタイムアウトを維持したまま、同じランナーを使う既存のコンパクトジョブ全体に分散されます。また、シリアルツール設定は PR 専用の 3 グループに分散されます。`main` へのプッシュ、手動ディスパッチ、およびリリースゲートでは完全マトリクスを維持します。
- 広範なブラウザー、QA、メディア、およびその他の Plugin テストでは、共有の Plugin キャッチオールではなく、それぞれ専用の Vitest 設定を使用します。include パターンシャードは CI シャード名を使用してタイミングエントリを記録するため、`.artifacts/vitest-shard-timings.json` で設定全体とフィルタリング済みシャードを区別できます。
- `check-additional-*` は、補助的な境界ガード一覧（`scripts/run-additional-boundary-checks.mjs`）を、プロンプト負荷の高い 1 つのシャード（Codex プロンプトスナップショットのドリフトチェックを含む `check-additional-boundaries-a`）と、残りの分割分をまとめた 1 つのシャード（`check-additional-boundaries-bcd`）に分散します。各シャードは独立したガードを並行実行し、チェックごとの所要時間を出力します。パッケージ境界のコンパイル／カナリア処理はまとめたままにし、ランタイムトポロジーのアーキテクチャチェックは `build-artifacts` に組み込まれた Gateway ウォッチカバレッジとは別に実行します。
- `dist/` と `dist-runtime/` のビルド完了後、Gateway ウォッチ、チャネルテスト、およびコアのサポート境界シャードが `build-artifacts` 内で並行実行されます。

受け入れ後、正規の Linux CI では最大 28 個の Node テストジョブと、
小規模な高速／チェックレーンでは最大 12 個の同時実行が許可されます。Windows と Android は、
ランナープールが小さいため 2 個のままです。コンパクトな設定全体バッチは
120 分のバッチタイムアウトで実行され、include パターングループは同じ制限付き
ジョブ予算を共有します。

Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行してから、Play デバッグ APK をビルドします。サードパーティフレーバーには個別のソースセットやマニフェストはありません。そのユニットテストレーンでは SMS／通話履歴の BuildConfig フラグを指定してフレーバーをコンパイルしつつ、Android 関連のプッシュごとにデバッグ APK のパッケージングジョブが重複することを回避します。

`check-dependencies` シャードは、`pnpm deadcode:dependencies`（正確な Knip バージョンに固定された本番用 Knip の依存関係限定パス。`dlx` インストールでは pnpm の最小リリース経過時間を無効化）と `pnpm deadcode:unused-files` を実行します。後者は Knip による本番環境の未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。さらに、参考情報として `pnpm deadcode:report:ci:ts-unused` レポートを実行し、`deadcode-reports` 成果物としてアップロードします。未使用ファイルガードは、PR がレビューされていない新しい未使用ファイルを追加した場合や、古い許可リストエントリを残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な動的 Plugin、生成済み、ビルド、ライブテスト、およびパッケージブリッジの対象領域は維持されます。

## ClawSweeper アクティビティの転送

`.github/workflows/clawsweeper-dispatch.yml` は、OpenClaw リポジトリのアクティビティを ClawSweeper に転送するターゲット側ブリッジです。信頼されていない Pull Request のコードをチェックアウトまたは実行することはありません。このワークフローは `CLAWSWEEPER_APP_PRIVATE_KEY` から GitHub App トークンを作成し、コンパクトな `repository_dispatch` ペイロードを `openclaw/clawsweeper` にディスパッチします。

このワークフローには 4 つのレーンがあります。

- 正確な issue および Pull Request のレビュー要求用の `clawsweeper_item`
- issue コメント内の明示的な ClawSweeper コマンド用の `clawsweeper_comment`
- `main` へのプッシュにおけるコミット単位のレビュー要求用の `clawsweeper_commit_review`
- ClawSweeper エージェントが調査できる一般的な GitHub アクティビティ用の `github_activity`

`github_activity` レーンは、正規化されたメタデータのみを転送します。対象はイベント種別、アクション、アクター、リポジトリ、項目番号、URL、タイトル、状態、および存在する場合はコメントやレビューの短い抜粋です。完全な Webhook 本文は意図的に転送しません。`openclaw/clawsweeper` 側の受信ワークフローは `.github/workflows/github-activity.yml` であり、正規化されたイベントを ClawSweeper エージェント用の OpenClaw Gateway フックに送信します。

一般的なアクティビティは監視対象であり、デフォルトで配信されるものではありません。ClawSweeper エージェントはプロンプト内で Discord の送信先を受け取り、イベントが予想外、対処可能、危険、または運用上有用な場合にのみ `#clawsweeper` に投稿する必要があります。通常のオープン、編集、bot による更新、重複した Webhook ノイズ、および通常のレビュートラフィックに対しては `NO_REPLY` を返す必要があります。

この経路全体で、GitHub のタイトル、コメント、本文、レビューテキスト、ブランチ名、およびコミットメッセージを信頼されていないデータとして扱ってください。これらは要約とトリアージの入力であり、ワークフローやエージェントランタイムへの指示ではありません。

## 手動ディスパッチ

手動 CI ディスパッチは通常の CI と同じジョブグラフを実行しますが、Android 以外のすべてのスコープ対象レーンを強制的に有効にします。対象には、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネルのコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、iOS ビルド、および Control UI i18n が含まれます。Control UI のロケール同等性チェックは、自動 PR および `main` 実行では参考情報扱いです。これは独立した更新ワークフローが生成物のずれをバックグラウンドで修復するためです。手動 CI ではブロッキングとなり、したがって Full Release Validation でもブロッキングとなります。独立した手動 CI ディスパッチで Android を実行するのは `include_android=true` の場合のみです（`release_gate` 入力でも Android が強制されます）。完全リリースの包括ワークフローは、`include_android=true` を渡して Android を有効にします。Plugin プレリリースの静的チェック、リリース専用の `agentic-plugins` シャード、完全な extension バッチスイープ、および Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` がリリース検証ゲートを有効にして個別の `Plugin Prerelease` ワークフローをディスパッチした場合にのみ実行されます。

手動実行では一意の同時実行グループを使用するため、リリース候補の完全スイートが、同じ ref に対する別のプッシュや PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力を使用すると、信頼された呼び出し元は、選択したディスパッチ ref のワークフローファイルを使用しながら、ブランチ、タグ、または完全なコミット SHA を対象としてそのグラフを実行できます。`release_gate` 入力は、容量不足で停止している PR CI 向けの、正確な SHA を用いるメンテナー用フォールバックです。`target_ref` には、ディスパッチされたブランチの先頭と一致する完全なコミット SHA を指定する必要があります。

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

毎月の npm 専用 extended-stable パスは例外です。正確な
`extended-stable/YYYY.M.33` ブランチから `OpenClaw NPM
Release` プリフライトと `Full Release Validation` の両方をディスパッチし、
それぞれの実行 ID を保持して、両方の ID を
直接 npm 公開実行に渡します。コマンド、正確な ID 要件、レジストリの読み戻し、およびセレクターの
修復手順については、[毎月の npm 専用 extended-stable
公開](/ja-JP/reference/RELEASING#monthly-npm-only-extended-stable-publication)を参照してください。このパスでは、Plugin、macOS、Windows、GitHub
Release、非公開 dist-tag、またはその他のプラットフォーム公開はディスパッチされません。

## ランナー

| Runner                          | ジョブ                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | 手動 CI ディスパッチと非正規リポジトリのフォールバック、QA Smoke 集約、CodeQL のセキュリティおよび品質スキャン、workflow-sanity、labeler、auto-response、独立した Docs ワークフロー、および Install Smoke ワークフロー全体                                                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`、`security-fast`、`pnpm-store-warmup`、`native-i18n`、QA Smoke CI を除く `checks-fast-core`、Plugin/チャンネル契約シャード、バンドル済みまたは軽量な Linux Node シャードの大部分、`check-lint` を除く `check-*` レーン、選択された `check-additional-*` シャード、`check-docs`、および `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | 維持されている高負荷 Linux Node スイート、境界/拡張機能の負荷が高い `check-additional-*` シャード、および `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | 自動 QA Smoke CI シャード、CI および Testbox の `build-artifacts`、および `check-lint`（CPU 依存性が高く、8 vCPU では節約額よりコストが大きいため）                                                                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` 上の `macos-node`。フォークでは `macos-15` にフォールバック                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` 上の `macos-swift` および `ios-build`。フォークでは `macos-26` にフォールバック                                                                                                                                                                                                                |

## Runner 登録予算

OpenClaw の現在の GitHub Runner 登録バケットでは、`ghx api rate_limit` で 5 分あたり 10,000 件のセルフホステッド
Runner 登録が報告されます。GitHub がこのバケットを変更する可能性があるため、調整のたびに
`actions_runner_registration` を再確認してください。この制限は
`openclaw` Organization 内のすべての Blacksmith Runner 登録で共有されるため、別の Blacksmith インストールを追加しても
新しいバケットは追加されません。

バースト制御では、Blacksmith ラベルを希少なリソースとして扱ってください。
ルーティング、通知、要約、シャード選択、または短時間の CodeQL スキャンのみを行うジョブは、
Blacksmith 固有の必要性が測定で確認されない限り、GitHub ホステッド Runner に残す必要があります。
新しい Blacksmith マトリクス、より大きい `max-parallel`、または高頻度の
ワークフローでは、最悪時の登録数を示し、Organization 全体の
目標を稼働中バケットの約 60% 未満に維持する必要があります。現在の 10,000 登録
バケットでは、同時実行されるリポジトリ、再試行、バーストの重複に余裕を残すため、
運用目標は 6,000 登録となります。

正規リポジトリの CI では、通常の push および pull request 実行のデフォルト Runner パスとして Blacksmith を維持します。`workflow_dispatch` および非正規リポジトリの実行では GitHub ホステッド Runner を使用しますが、現在の通常の正規実行では Blacksmith のキュー健全性をプローブせず、Blacksmith が利用できない場合に GitHub ホステッドラベルへ自動的にフォールバックすることもありません。

## ローカルでの同等コマンド

```bash
pnpm changed:lanes                            # origin/main...HEAD に対するローカルの変更レーン分類器を確認
pnpm check:changed                            # スマートなローカルチェックゲート：境界レーン別の変更されたフォーマット/型チェック/lint/ガード
pnpm check                                    # 高速なローカルゲート：本番 tsgo + シャード化 lint + 並列高速ガード
pnpm check:test-types
pnpm check:timed                              # ステージごとの所要時間を含む同じゲート
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest テスト
pnpm test:changed                             # 低コストでスマートな変更対象 Vitest テスト
pnpm test:ui                                  # Control UI のユニット/ブラウザスイート
pnpm ui:i18n:check                            # 生成された Control UI ロケールの整合性（リリースゲート）
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # ドキュメントのフォーマット + lint + リンク切れ
pnpm build                                    # CI アーティファクト/スモークチェックが重要な場合に dist をビルド
pnpm ios:build                                # iOS アプリプロジェクトを生成してビルド
pnpm ci:timings                               # 最新の origin/main push CI 実行を要約
pnpm ci:timings:recent                        # 最近成功した main CI 実行を比較
node scripts/ci-run-timings.mjs <run-id>      # 実時間、キュー時間、最も遅いジョブを要約
node scripts/ci-run-timings.mjs --latest-main # Issue/コメントのノイズを無視し、origin/main push CI を選択
node scripts/ci-run-timings.mjs --recent 10   # 最近成功した main CI 実行を比較
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` は、製品/ランタイムのパフォーマンスワークフローです。`main` で毎日実行され、手動でディスパッチすることもできます。

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

手動ディスパッチでは通常、ワークフローの ref をベンチマークします。現在のワークフロー実装を使用してリリースタグまたは別のブランチをベンチマークするには、`target_ref` を設定します。公開されるレポートパスと latest ポインターはテスト対象の ref をキーとし、各 `index.md` には、テスト対象の ref/SHA、ワークフローの ref/SHA、Kova ref、プロファイル、レーン認証モード、モデル、反復回数、およびシナリオフィルターが記録されます。

ワークフローは、固定されたリリースから OCM を、固定された `kova_ref` 入力の `openclaw/Kova` から Kova をインストールし、次の 3 つのレーンを実行します。

- `mock-provider`: 決定論的な偽の OpenAI 互換認証を使用し、ローカルビルドのランタイムに対して Kova 診断シナリオを実行します。
- `mock-deep-profile`: 起動、Gateway、およびエージェントターンのホットスポットに対する CPU/ヒープ/トレースプロファイリングです。スケジュール時、または `deep_profile=true` を指定したディスパッチ時に実行されます。
- `live-openai-candidate`: 実際の OpenAI `openai/gpt-5.6-luna` エージェントターンです。`OPENAI_API_KEY` が利用できない場合はスキップされます。スケジュール時、または `live_openai_candidate=true` を指定したディスパッチ時に実行されます。

mock-provider レーンでは、Kova の実行後に OpenClaw ネイティブのソースプローブも実行します。具体的には、デフォルト、チャンネルスキップ、内部フック、50 Plugin の各起動ケースにおける Gateway の起動時間とメモリ、バンドル済み Plugin のインポート RSS、モック OpenAI の `channel-chat-baseline` hello ループの反復、起動済み Gateway に対する CLI 起動コマンド、および SQLite 状態スモークパフォーマンスプローブです。テスト対象の ref について以前に公開された mock-provider ソースレポートが利用可能な場合、ソース要約は現在の RSS とヒープ値をそのベースラインと比較し、大幅な RSS 増加を `watch` としてマークします。ソースプローブの Markdown 要約はレポートバンドル内の `source/index.md` にあり、その隣に生の JSON があります。

各レーンは、CPU、ヒープ、トレース、および圧縮された診断バンドルを含む完全な GitHub アーティファクトをアップロードします。別のパブリッシャージョブがそれらのアーティファクトをダウンロードして検証した後、`openclaw/clawgrit-reports` の contents のみにスコープされた短期間有効な ClawSweeper GitHub App トークンを発行し、それを Git push ステップにのみ渡します。`report.json`、`report.md`、`index.md`、ソースプローブのアーティファクト、およびバンドルのメタデータ/チェックサムを `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` の下にコミットします。完全な診断アーカイブは、リンクされた Actions アーティファクトに残ります。パブリッシャーは push を試みる前に、50 MB を超えるレポートファイルを拒否します。現在のテスト対象 ref のポインターは `openclaw-performance/<tested-ref>/latest-<lane>.json` です。スケジュール実行および `profile=release` のディスパッチでは、App トークンの作成またはレポートの公開に失敗すると処理全体が失敗します。リリース以外の手動ディスパッチでは、公開は勧告扱いのままとなり、認証または公開に失敗した場合も GitHub アーティファクトを保持します。以前のソースベースラインは公開レポートリポジトリから匿名で取得されるため、ベースラインの取得に成功してもパブリッシャー認証が成功したことの証明にはなりません。

## 完全リリース検証

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動の統括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動の `CI` ワークフロー（Android を含む）をディスパッチし、リリース専用の Plugin/パッケージ/静的/Docker 検証用に `Plugin Prerelease` をディスパッチし、ターゲット SHA に対して `OpenClaw Performance` をディスパッチし、さらにインストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab 整合性、Matrix、および Telegram レーン用に `OpenClaw Release Checks` をディスパッチします（勧告扱いの成熟度スコアカードのレンダリングは、`run_maturity_scorecard` によるオプトインです）。stable および full プロファイルには、網羅的な live/E2E と Docker リリースパスのソークカバレッジが常に含まれます。beta プロファイルでは、`run_release_soak=true` によりオプトインできます。正規パッケージの Telegram E2E は Package Acceptance 内で実行されるため、full candidate が重複する live poller を開始することはありません。公開後は、`release_package_spec` を渡すことで、リリースチェック、Package Acceptance、Docker、クロス OS、および Telegram 全体で、公開済み npm パッケージを再ビルドせずに再利用できます。公開済みパッケージの Telegram に限定した再実行の場合のみ、`npm_telegram_package_spec` を使用してください。Codex Plugin の live パッケージレーンでは、デフォルトで同じ選択状態を使用します。公開済みの `release_package_spec=openclaw@<tag>` からは `codex_plugin_spec=npm:@openclaw/codex@<tag>` が導出され、SHA/アーティファクト実行では選択された ref から `extensions/codex` がパックされます。`npm:`、`npm-pack:`、または `git:` 仕様などのカスタム Plugin ソースには、`codex_plugin_spec` を明示的に設定してください。

ステージマトリクス、正確なワークフロージョブ名、プロファイルの違い、アーティファクト、および
対象を絞った再実行用ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。

`OpenClaw Release Publish` は、リリースを変更する手動ワークフローです。リリースタグが
存在し、OpenClaw npm プリフライトが成功した後（プリフライトではチェックの一つとして
`pnpm plugins:sync:check` が実行されます）、信頼された `main` から通常のベータ版および
安定版の公開をディスパッチします。タグは引き続き、`release/YYYY.M.PATCH` 上のコミットを
含む正確なリリースコミットを選択します。Tideclaw アルファ版の公開では、対応する
アルファブランチを引き続き使用します。保存済みの `preflight_run_id`、成功した
`full_release_validation_run_id`、およびその正確な
`full_release_validation_run_attempt` が必要です。公開可能なすべての Plugin パッケージに
対して `Plugin NPM Release` をディスパッチし、同じリリース SHA に対して
`Plugin ClawHub Release` をディスパッチした後にのみ、`OpenClaw NPM Release` を
ディスパッチします。安定版の公開では正確な `windows_node_tag` も必要です。ワークフローは
公開用の子ワークフローを開始する前に、Windows ソースリリースを検証し、その x64/ARM64
インストーラーを候補として承認済みの `windows_node_installer_digests` 入力と比較します。
その後、同じ固定済みインストーラーダイジェストと、正確な付随アセットおよびチェックサムの
契約を昇格して検証してから、GitHub リリースのドラフトを公開します。
Plugin のみに絞った修復では、空でないパッケージリストとともに
`plugin_publish_scope=selected` を使用します。Plugin のみの `all-publishable` 実行でも、
コア公開と同じ不変の npm プリフライトおよび Full Release Validation の証拠が必要です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

更新の速いブランチで固定コミットの証明を行う場合は、
`gh workflow run ... --ref main -f ref=<sha>` の代わりにヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub ワークフローのディスパッチ参照には、未加工のコミット SHA ではなくブランチまたは
タグを指定する必要があります。ヘルパーは、信頼された `main` のワークフロー SHA 上に一時的な
`release-ci/<sha>-...` ブランチをプッシュし、要求されたターゲット SHA をワークフローの
`ref` 入力で渡し、利用可能な場合は厳密な完全一致ターゲットの証拠を再利用します。また、
すべての子ワークフローの `headSha` が信頼されたワークフロー SHA と一致することを検証し、
実行完了時に一時ブランチを削除します。新しい検証を強制するには
`-f reuse_evidence=false` を渡します。包括的な検証処理は、いずれかの子ワークフローが
異なるワークフロー SHA で実行された場合にも失敗します。

`release_profile` は、リリースチェックに渡すライブ／プロバイダーの範囲を制御します。手動の
リリースワークフローではデフォルトが `stable` です。広範な参考用のプロバイダー／メディア
マトリックスを意図的に実行する場合にのみ `full` を使用します。安定版および完全版の
リリースチェックでは、網羅的なライブ／E2E と Docker リリースパスの長時間検証を常に
実行します。ベータプロファイルでは `run_release_soak=true` を指定して有効化できます。

- `minimum` は、最速の OpenAI／コアのリリース必須レーンのみを維持します。
- `stable` は、安定版のプロバイダー／バックエンドセットを追加します。
- `full` は、広範な参考用のプロバイダー／メディアマトリックスを実行します。

包括的なワークフローは、ディスパッチした子実行の ID を記録します。最後の
`Verify full validation` ジョブは、現在の子実行の結果を再確認し、各子実行について最も
時間のかかったジョブの表を追記します。子ワークフローを再実行して成功した場合は、包括的な
結果とタイミング概要を更新するため、親の検証ジョブのみを再実行します。

復旧のため、`Full Release Validation` と `OpenClaw Release Checks` はどちらも
`rerun_group` を受け付けます。リリース候補には `all`、通常の完全 CI の子ワークフローのみに
は `ci`、Plugin プレリリースの子ワークフローのみに `plugin-prerelease`、OpenClaw
Performance の子ワークフローのみに `performance`、すべてのリリース子ワークフローには
`release-checks` を使用します。包括的なワークフローでは、より限定されたグループとして
`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、
`npm-telegram` も使用できます。これにより、対象を絞った修正後に、失敗したリリース環境の
再実行範囲を限定できます。失敗した cross-OS レーンが一つだけの場合は、
`rerun_group=cross-os` と `cross_os_suite_filter` を組み合わせます。たとえば
`windows/packaged-upgrade` です。長時間実行される cross-OS コマンドは Heartbeat 行を
出力し、パッケージ済みアップグレードの概要にはフェーズごとの所要時間が含まれます。QA
リリースチェックレーンは、標準ランタイムツールのカバレッジゲートを除いて参考扱いです。
このゲートは、必須の OpenClaw 動的ツールが標準ティアの概要から逸脱または消失した場合に
ブロックします。

`OpenClaw Release Checks` は、信頼されたワークフロー参照を使用して、選択された参照を一度だけ
`release-package-under-test` tarball に解決します。その後、このアーティファクトを cross-OS
チェックと Package Acceptance に渡し、長時間検証のカバレッジが実行される場合は、ライブ／E2E
リリースパスの Docker ワークフローにも渡します。これにより、各リリース環境でパッケージの
バイト列が一貫し、複数の子ジョブで同じ候補を再パッケージすることを回避できます。Codex
npm Plugin のライブレーンでは、リリースチェックは `release_package_spec` から導出した一致する
公開済み Plugin 仕様を渡すか、オペレーターが指定した `codex_plugin_spec` を渡すか、入力を
空のままにして Docker スクリプトが選択されたチェックアウトの Codex Plugin をパッケージする
ようにします。

`ref=main` および `rerun_group=all` に対する重複した `Full Release Validation` 実行では、
新しい包括的な実行が古いものを置き換えます。親モニターは、親がキャンセルされると、すでに
ディスパッチ済みのすべての子ワークフローをキャンセルします。そのため、新しい main の検証が、
古い 2 時間のリリースチェック実行の後ろで待機することはありません。リリースブランチ／タグの
検証と対象を絞った再実行グループでは、`cancel-in-progress: false` を維持します。

## ライブおよび E2E シャード

リリースのライブ／E2E 子ワークフローは、広範なネイティブ `pnpm test:live` カバレッジを
維持しますが、単一の直列ジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付き
シャードとして実行します。

- `native-live-src-agents` と `native-live-src-agents-zai-coding`
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
- 分割されたメディア音声／動画シャードと、プロバイダーでフィルタリングされた音楽シャード

これにより、同じファイルカバレッジを維持しながら、時間のかかるライブプロバイダーの失敗を再実行して診断しやすくなります。集約された `native-live-src-gateway`、`native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` のシャード名は、手動の単発再実行でも引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローによってビルドされた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。このイメージには `ffmpeg` と `ffprobe` がプリインストールされており、メディアジョブはセットアップ前にバイナリを検証するだけです。Docker を使用するライブスイートは通常の Blacksmith ランナーで実行してください。コンテナジョブ内でネストされた Docker テストを起動するのは不適切です。

Docker を使用するライブモデル／バックエンドシャードは、選択したコミットごとに個別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` イメージを使用します。ライブリリースワークフローはそのイメージを一度だけビルドしてプッシュし、その後、Docker ライブモデル、プロバイダーごとに分割された Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` を指定して実行されます。Gateway Docker シャードには、停止したコンテナやクリーンアップ処理がリリースチェックの全時間枠を消費せず速やかに失敗するように、ワークフロージョブのタイムアウトより短いスクリプトレベルの明示的な `timeout` 上限が設定されています。これらのシャードが完全なソース Docker ターゲットを個別に再ビルドする場合、リリース実行の設定が誤っており、重複したイメージビルドによって実経過時間が浪費されます。

## パッケージ受け入れテスト

「インストール可能な OpenClaw パッケージが製品として動作するか」が問題である場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れテストは、ユーザーがインストールまたは更新後に使用するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

### ジョブ

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` と `.artifacts/docker-e2e-package/package-candidate.json` を書き込み、両方を `package-under-test` アーティファクトとしてアップロードし、ソース、ワークフロー参照、パッケージ参照、バージョン、SHA-256、プロファイルを GitHub のステップサマリーに出力します。
2. `package_integrity` は `package-under-test` アーティファクトをダウンロードし、`scripts/check-openclaw-package-tarball.mjs` を使用して公開パッケージ tarball の契約を適用します。
3. `docker_acceptance` は、解決されたパッケージのソース SHA（利用できない場合は `workflow_ref`）と `package_artifact_name=package-under-test` を指定して `openclaw-live-and-e2e-checks-reusable.yml` を呼び出します。再利用可能なワークフローは、そのアーティファクトをダウンロードし、tarball の内容一覧を検証し、必要に応じてパッケージダイジェスト Docker イメージを準備して、ワークフローのチェックアウトをパッケージ化する代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルで複数の対象 `docker_lanes` が選択されている場合、再利用可能なワークフローはパッケージと共有イメージを一度だけ準備し、その後、それらのレーンを一意のアーティファクトを持つ並列の対象別 Docker ジョブとして展開します。
4. `package_telegram` は、必要に応じて `NPM Telegram Beta E2E` を呼び出します。`telegram_mode` が `none` でない場合に実行され、Package Acceptance がパッケージを解決した場合は、同じ `package-under-test` アーティファクトをインストールします。Telegram の単独ディスパッチでは、公開済みの npm 指定を引き続きインストールできます。
5. `summary` は、パッケージの解決、整合性、Docker 受け入れテスト、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。`advisory` 入力は、助言目的の呼び出し元に対して受け入れテストの失敗を警告に格下げします。

### 候補ソース

- `source=npm` は、`openclaw@extended-stable`、`openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような OpenClaw の正確なリリースバージョンのみを受け付けます。公開済みの延長安定版、プレリリース版、または安定版の受け入れテストに使用します。
- `source=ref` は、信頼された `package_ref` のブランチ、タグ、または完全なコミット SHA をパッケージ化します。リゾルバーは OpenClaw のブランチ／タグをフェッチし、選択したコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、切り離されたワークツリーに依存関係をインストールして、`scripts/package-openclaw-for-docker.mjs` でパッケージ化します。
- `source=url` は公開 HTTPS `.tgz` をダウンロードします。`package_sha256` は必須です。このパスでは、URL の認証情報、デフォルト以外の HTTPS ポート、プライベート／内部／特殊用途のホスト名または解決済み IP、および同じ公開安全ポリシーの範囲外へのリダイレクトが拒否されます。
- `source=trusted-url` は、`.github/package-trusted-sources.json` 内の名前付き信頼済みソースポリシーから HTTPS `.tgz` をダウンロードします。`package_sha256` と `trusted_source_id` は必須です。設定済みのホスト、ポート、パスプレフィックス、リダイレクト先ホスト、またはプライベートネットワーク名前解決を必要とする、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにのみ使用してください。ポリシーでベアラー認証が宣言されている場合、ワークフローは固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを使用します。URL に埋め込まれた認証情報は引き続き拒否されます。
- `source=artifact` は、`artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有されたアーティファクトには指定する必要があります。

`workflow_ref` と `package_ref` は分けて保持してください。`workflow_ref` はテストを実行する信頼済みのワークフロー／ハーネスコードです。`package_ref` は、`source=ref` の場合にパッケージ化されるソースコミットです。これにより、古いワークフローロジックを実行せずに、現在のテストハーネスで以前の信頼済みソースコミットを検証できます。

### スイートプロファイル

- `smoke` — `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package` — `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`skill-install`、`update-corrupt-plugin`、`upgrade-survivor`、`published-upgrade-survivor`、`root-managed-vps-upgrade`、`update-restart-auth`、`plugins-offline`、`plugin-update`
- `product` — `plugins-offline` の代わりにライブ `plugins` カバレッジを使用した `package` セットに、`mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui` を追加
- `full` — OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom` — 正確な `docker_lanes`。`suite_profile=custom` の場合は必須

`package` プロファイルではオフライン Plugin カバレッジを使用するため、公開パッケージの検証は ClawHub の稼働状況に左右されません。オプションの Telegram レーンは `NPM Telegram Beta E2E` の `package-under-test` アーティファクトを再利用し、単独ディスパッチ用には公開済み npm spec パスを維持します。

ローカルコマンド、Docker レーン、Package Acceptance の入力、リリースのデフォルト、障害トリアージを含む、更新および Plugin テスト専用のポリシーについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

リリースチェックは、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'`、および `telegram_mode=mock-openai` を指定して Package Acceptance を呼び出します。これにより、パッケージ移行、更新、稼働中の ClawHub からのスキルインストール、古い Plugin 依存関係のクリーンアップ、設定済み Plugin のインストール修復、オフライン Plugin、Plugin 更新、および Telegram の検証が、同じ解決済みパッケージ tarball に対して実行されます。ベータ版の公開後、Full Release Validation または OpenClaw Release Checks で `release_package_spec` を設定すると、再ビルドせずに、出荷済み npm パッケージに対して同じマトリクスを実行できます。Package Acceptance だけが他のリリース検証とは異なるパッケージを必要とする場合に限り、`package_acceptance_package_spec` を設定してください。クロス OS リリースチェックでは、引き続き OS 固有のオンボーディング、インストーラー、およびプラットフォーム動作を対象とします。パッケージおよび更新に関する製品検証は、Package Acceptance から開始してください。

`published-upgrade-survivor` Docker レーンは、ブロッキング対象のリリースパスで、実行ごとに公開済みパッケージのベースラインを 1 つ検証します。Package Acceptance では、解決済みの `package-under-test` tarball が常に候補となり、`published_upgrade_survivor_baseline` がフォールバック用の公開済みベースラインを選択します。デフォルトは `openclaw@latest` です。失敗したレーンの再実行コマンドでも、このベースラインは維持されます。`run_release_soak=true` または `release_profile=full` を指定した Full Release Validation では、`published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` および `published_upgrade_survivor_scenarios=reported-issues` を設定し、最新 4 件の安定版 npm リリースに加え、Plugin 互換性の境界となる固定リリース、および Feishu 設定、保持されたブートストラップ／ペルソナファイル、設定済み OpenClaw Plugin のインストール、チルダを含むログパス、古いレガシー Plugin 依存関係ルートに対応した、報告済み問題の形を再現するフィクスチャまで対象を拡張します。複数ベースラインを選択した公開済みアップグレードサバイバーは、ベースラインごとにシャーディングされ、個別の対象指定 Docker ランナージョブとして実行されます。通常の Full Release CI の範囲ではなく、公開済み更新のクリーンアップを網羅的に検証する場合は、別の `Update Migration` ワークフローで、`all-since-2026.4.23` ベースラインおよび `plugin-deps-cleanup` シナリオを指定した `update-migration` Docker レーンを使用します。ローカルでの集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なパッケージ spec を渡すか、`openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を指定して単一レーンを維持するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` でシナリオマトリクスを設定できます。公開済みレーンでは、組み込みの `openclaw config set` コマンドレシピを使用してベースラインを設定し、レシピの手順を `summary.json` に記録して、Gateway 起動後に `/healthz`、`/readyz`、および RPC ステータスをプローブします。Windows のパッケージ版およびインストーラー版の新規インストールレーンでは、インストール済みパッケージが Windows の生の絶対パスからブラウザー制御オーバーライドをインポートできることも検証します。OpenAI のクロス OS エージェントターンのスモークテストは、設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.6-luna` をデフォルトとします。これにより、インストールと Gateway の検証では、より低コストの GPT-5.6 テスト階層が使用されます。

### レガシー互換性期間

Package Acceptance には、すでに公開済みのパッケージを対象とする、期間限定のレガシー互換性があります。`2026.4.25-beta.*` を含む `2026.4.25` までのパッケージでは、次の互換性パスを使用できます。

- `dist/postinstall-inventory.json` 内の既知の非公開 QA エントリが、tarball から省略されたファイルを参照している場合があります。
- パッケージが該当フラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` の永続化サブケースをスキップできます。
- `update-channel-switch` は、tarball から生成された偽の git フィクスチャから、存在しない pnpm `patchedDependencies` を削除でき、永続化された `update.channel` が存在しないことをログに記録できます。
- Plugin スモークテストは、レガシーなインストールレコードの場所を読み取るか、マーケットプレイスのインストールレコードが永続化されていない状態を許容できます。
- `plugin-update` は、インストールレコードおよび再インストールを行わない動作が変更されないことを引き続き要求しながら、設定メタデータの移行を許容できます。

公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータのスタンプファイルについて警告を許容できます。また、`2026.5.20` までのパッケージでは、`npm-shrinkwrap.json` が存在しない場合、失敗ではなく警告にできます。それより後のパッケージは、最新のコントラクトを満たす必要があります。同じ条件でも、警告またはスキップではなく失敗になります。

### 例

```bash
# 製品レベルのカバレッジで現在のベータパッケージを検証します。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# パッケージカバレッジで公開済みの extended-stable パッケージを検証します。
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

失敗した Package Acceptance の実行をデバッグする場合は、まず `resolve_package` のサマリーで、パッケージソース、バージョン、および SHA-256 を確認します。次に、`docker_acceptance` の子実行と、その Docker アーティファクトである `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズの所要時間、および再実行コマンドを調べます。リリース検証全体を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンのみを再実行することを推奨します。

## インストールスモークテスト

`Install Smoke` ワークフローは、プルリクエストまたは `main` へのプッシュでは実行されなくなりました。夜間／手動ラッパーとリリース検証は、どちらも読み取り専用の `install-smoke-reusable.yml` コアを呼び出し、すべての実行で GitHub ホステッドランナー上の完全なインストールスモークテストパスを使用します。

- ルート Dockerfile のスモークイメージは、対象 SHA ごとに 1 回だけビルドされ、変更不能なアーティファクト内でワークフローのリビジョンおよび生成元の試行に関連付けられます。その後、CLI スモークテスト、エージェントが共有ワークスペースを削除する CLI スモークテスト、コンテナー Gateway ネットワーク E2E、および同梱の `matrix` Plugin に対する build-arg スモークテストで読み込まれます。Plugin スモークテストでは、ランタイム依存関係のインストールミラーリングと、エントリ脱出診断なしで Plugin が読み込まれることを検証します。
- QR パッケージのインストールと、インストーラー／更新の Docker スモークテスト（Rocky Linux インストーラーレーン、および設定可能な `update_baseline_version` npm ベースラインに対する更新レーンを含む）は、個別のジョブとして実行されるため、インストーラー関連の処理がルートイメージのスモークテストの完了を待つことはありません。

低速な Bun グローバルインストールのイメージプロバイダースモークテストは、`run_bun_global_install_smoke` によって別途制御されます。これは夜間スケジュールで実行され、リリースチェックからのワークフロー呼び出しではデフォルトで有効になります。また、手動の `Install Smoke` ディスパッチでも有効化できます。通常の PR CI では、Node に関連する変更に対して、高速な Bun ランチャー回帰レーンが引き続き実行されます。QR およびインストーラーの Docker テストでは、それぞれ独自のインストール専用 Dockerfile を維持します。

## ローカル Docker E2E

`pnpm test:docker:all` は、共有のライブテストイメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回だけパックして、共有の `scripts/e2e/Dockerfile` イメージを 2 つビルドします。

- インストーラー／更新／Plugin 依存関係レーン用の、最低限の Node/Git ランナー。
- 通常機能レーン用の、同じ tarball を `/app` にインストールする機能イメージ。

Docker レーンの定義は `scripts/lib/docker-e2e-scenarios.mjs` に、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランのみを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` および `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` を使用してレーンごとにイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。

### 調整項目

| 変数                                   | デフォルト | 目的                                                                                                  |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | 通常レーン用のメインプールのスロット数。                                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | プロバイダーの影響を受けるテールプールのスロット数。                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | プロバイダーによるスロットリングを防ぐための、同時実行ライブレーン数の上限。                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | npm インストールレーンの同時実行数の上限。                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | 複数サービスを使用するレーンの同時実行数の上限。                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker デーモンで作成処理が集中するのを避けるためのレーン開始間隔。間隔を設けない場合は `0` にします。 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | レーンごとのフォールバックタイムアウト（120 分）。選択されたライブ／テールレーンでは、より短い上限を使用します。 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | 未設定     | `1` を指定すると、レーンを実行せずにスケジューラーのプランを出力します。                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | 未設定     | 完全一致するレーン名のカンマ区切りリスト。クリーンアップスモークテストをスキップし、エージェントが失敗したレーンを 1 つだけ再現できるようにします。 |

実効上限より負荷の大きいレーンでも、空のプールから開始できます。その後、キャパシティを解放するまで単独で実行されます。ローカル集約処理では、Docker の事前チェックを行い、古い OpenClaw E2E コンテナーを削除し、アクティブなレーンのステータスを出力し、所要時間の長い順に並べるためにレーンの実行時間を永続化します。また、デフォルトでは最初の失敗後に新しいプール対象レーンのスケジューリングを停止します。

### 再利用可能なライブ／E2E ワークフロー

再利用可能なライブ/E2E ワークフローは、`scripts/test-docker-all.mjs --plan-json` に必要なパッケージ、イメージ種別、ライブイメージ、レーン、認証情報カバレッジを問い合わせます。その後、`scripts/docker-e2e.mjs` がそのプランを GitHub の出力とサマリーに変換します。これは、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージアーティファクトをダウンロードするか、`package_artifact_run_id` からパッケージアーティファクトをダウンロードし、その後 tarball の内容一覧を検証します。デフォルトの `no-push-artifact` パスは、Blacksmith の Docker レイヤーキャッシュを通じてパッケージダイジェストタグ付きのベア/機能イメージをビルドし、正確なイメージバイト列をイミュータブルなワークフローアーティファクトにパックして、各コンシューマーにそのアーティファクトを検証してロードさせます。一方、`existing-only` では明示的な `docker_e2e_bare_image`/`docker_e2e_functional_image` GHCR 参照が必須で、ビルドもプッシュも行いません。これらのレジストリプルでは、試行ごとに上限 180 秒のタイムアウトを使用するため、停止したストリームが CI のクリティカルパスの大半を消費することなく、すぐに再試行されます。スケジュールされた検証が成功すると、`openclaw-scheduled-live-checks.yml` はイミュータブルなテスト済みイメージマニフェストを、別個のパッケージ書き込みパブリッシャーに渡します。読み取り専用のリリースおよびプレリリース呼び出し元が、そのライターを経由することはありません。

### リリースパスのチャンク

リリース Docker カバレッジは、`OPENCLAW_SKIP_DOCKER_BUILD=1` を指定した小規模なチャンクジョブを実行します。これにより、各チャンクは必要なアーティファクト由来のイメージ種別だけを検証してロードし（または明示的な `existing-only` 再利用でプルし）、同じ重み付きスケジューラーを通じて複数のレーンを実行します。

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、および `openwebui` です。`package-update-openai` にはライブ Codex Plugin パッケージレーンが含まれます。このレーンは候補の OpenClaw パッケージをインストールし、`codex_plugin_spec` または同じ参照の tarball から Codex Plugin を、Codex CLI のインストールを明示的に承認してインストールし、Codex CLI の事前チェックを実行した後、OpenAI に対して同じセッション内で複数回 OpenClaw エージェントを実行します。`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は、引き続き Plugin/ランタイムの集約エイリアスです。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンを対象とする集約手動再実行エイリアスとして残ります。

OpenWebUI は、安定版または完全なリリースパスカバレッジから要求された場合、再利用可能なワークフローが対応ジョブを GitHub ホステッドランナーにルーティングする場合でも、専用の大容量ディスク Blacksmith ランナー上で独立した `openwebui` チャンクとして実行されます。外部イメージのプルを分離することで、大きなイメージが `plugins-runtime-services` 内の共有パッケージおよび Plugin イメージと競合するのを防ぎます。従来の集約 Plugin/ランタイムチャンクには、互換性のある手動再実行のために引き続き OpenWebUI が含まれます。バンドル済みチャンネルの更新レーンは、一時的な npm ネットワーク障害時に 1 回再試行します。

各チャンクは、レーンログ、タイミング、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、低速レーン表、レーンごとの再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブではなく、その実行用に準備されたイメージに対して選択されたレーンを実行します。これにより、失敗したレーンのデバッグを対象を絞った 1 つの Docker ジョブに限定できます。選択されたレーンがライブ Docker レーンの場合、対象ジョブはその再実行用のライブテストイメージをローカルでビルドします。内部の再利用可能ワークフローのパッケージタプルは `workflow_dispatch` スキーマの一部ではないため、再実行ヘルパーは失敗アーティファクトの正確な選択対象 SHA を検証し、手動ディスパッチはその参照を再パックします。生成されるコマンドには、準備済みイメージ入力と `shared_image_policy=existing-only` が、それらの入力が GHCR 由来の場合にのみ含まれます。ランナーローカルのアーティファクトタグは省略されるため、新しいランナーでは再ビルドされます。明示的な対象オーバーライドが指定された場合、アーティファクトによってオーバーライドとの一致が証明されない限り、復元された GHCR イメージ参照は破棄されます。完全リリース用の一時ブランチは削除されるため、アーティファクトから生成されたワークフロー定義参照も省略されます。オペレーターが明示的にオーバーライドしない限り、ディスパッチではリポジトリのデフォルトブランチが使用されます。

```bash
pnpm test:docker:rerun <run-id>      # Docker アーティファクトをダウンロードし、統合された対象指定再実行コマンドとレーンごとのコマンドを出力
pnpm test:docker:timings <summary>   # 低速レーンとフェーズのクリティカルパスのサマリー
```

スケジュールされたライブ/E2E ワークフローは、完全なリリースパス Docker スイートを毎日実行し、成功後に、正確なテスト済みイメージアーティファクトに対する明示的なパブリッシャーを呼び出します。

## Plugin プレリリース

`Plugin Prerelease` は、より高コストな製品/パッケージカバレッジであるため、`Full Release Validation` または明示的なオペレーターによってディスパッチされる別個のワークフローです。通常のプルリクエスト、`main` へのプッシュ、独立した手動 CI ディスパッチでは、そのスイートは実行されません。このワークフローは、バンドル済み Plugin のテストを 8 個の拡張ワーカーに分散します。これらの拡張シャードジョブは、グループごとに 1 つの Vitest ワーカーと大きな Node ヒープを使用し、一度に最大 2 個の Plugin 設定グループを実行するため、インポート負荷の高い Plugin バッチによって余分な CI ジョブが作成されません。リリース専用の Docker プレリリースパス（`full_release_validation` 入力によって有効化）は、対象指定 Docker レーンを 4 個ずつのグループにまとめ、1～3 分のジョブのために数十個のランナーを予約することを回避します。また、このワークフローは `@openclaw/plugin-inspector` から情報提供用の `plugin-inspector-advisory` アーティファクトをアップロードします。インスペクターの検出事項はトリアージ用の入力であり、ブロッキング対象の Plugin プレリリースゲートには影響しません。

## QA Lab

QA Lab には、メインのスマートスコープワークフロー外に専用の CI レーンがあります。エージェント型パリティは、独立した PR ワークフローではなく、広範な QA およびリリースハーネスの下にネストされています。パリティを広範な検証実行に含める必要がある場合は、`rerun_group=qa-parity` を指定して `Full Release Validation` を使用します。

- `QA-Lab - All Lanes` ワークフローは、`main` 上で毎晩、および手動ディスパッチ時に実行されます。モックパリティレーン、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。

リリースチェックでは、決定論的モックプロバイダーとモック修飾モデル（`mock-openai/gpt-5.6-luna` および `mock-openai/gpt-5.6-luna-alt`）を使用して、Matrix および Telegram のライブトランスポートレーンを実行します。これにより、チャンネル契約がライブモデルのレイテンシーおよび通常のプロバイダー Plugin 起動から分離されます。QA パリティがメモリ動作を別途カバーするため、ライブトランスポート Gateway はメモリ検索を無効にします。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、および Docker プロバイダースイートでカバーされます。

Matrix は、スケジュール実行およびリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合にのみ `--fail-fast` を追加します。CLI のデフォルトおよび手動ワークフロー入力は引き続き `all` です。手動の `matrix_profile=all` ディスパッチは、常に完全な Matrix カバレッジを `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の各ジョブにシャード分割します。

`OpenClaw Release Checks` は、リリース承認前にリリース上重要な QA Lab レーンも実行します。その QA パリティゲートは、候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために両方のアーティファクトを小規模なレポートジョブへダウンロードします。

通常の PR では、パリティを必須ステータスとして扱わず、スコープされた CI/チェック証拠に従ってください。

## CodeQL

`CodeQL` ワークフローは、意図的に範囲を絞った初回セキュリティスキャナーであり、リポジトリ全体の完全スキャンではありません。毎日、手動、`main` へのプッシュ、およびドラフトでないプルリクエストのガード実行では、Actions ワークフローコードと、最もリスクの高い JavaScript/TypeScript サーフェスを、高/重大の `security-severity` にフィルタリングされた高信頼度セキュリティクエリでスキャンします。

プルリクエストガードは軽量に保たれています。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、`scripts`、`src`、またはプロセスを所有するバンドル済み Plugin ランタイムパス配下の変更に対してのみ開始され、スケジュールされたワークフローと同じ高信頼度セキュリティマトリックスを実行します。Android および macOS の CodeQL は、PR のデフォルトには含まれません。

### セキュリティカテゴリー

| カテゴリー                                        | サーフェス                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | 認証、シークレット、サンドボックス、Cron、Gateway のベースライン                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | コアチャンネル実装契約、およびチャンネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査の接点                           |
| `/codeql-security-high/network-ssrf-boundary`     | コア SSRF、IP 解析、ネットワークガード、Web フェッチ、および Plugin SDK の SSRF ポリシーサーフェス                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP サーバー、プロセス実行ヘルパー、外向き配信、およびエージェントツール実行ゲート                                                  |
| `/codeql-security-high/process-exec-boundary`     | ローカルシェル、プロセス生成ヘルパー、サブプロセスを所有するバンドル済み Plugin ランタイム、およびワークフロースクリプトの接合部分   |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin のインストール、ローダー、マニフェスト、レジストリ、パッケージマネージャーのインストール、ソース読み込み、および Plugin SDK パッケージ契約の信頼境界サーフェス |

### プラットフォーム固有のセキュリティシャード

- `CodeQL Android Critical Security` — スケジュールされた Android セキュリティシャード。ワークフロー健全性チェックで許容される最小の Blacksmith Linux ランナー上で、CodeQL 用に Android アプリを手動ビルドします。`/codeql-critical-security/android` 配下にアップロードします。
- `CodeQL macOS Critical Security` — 毎週/手動の macOS セキュリティシャード。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動ビルドし、アップロードされる SARIF から依存関係のビルド結果を除外して、`/codeql-critical-security/macos` 配下にアップロードします。クリーンな場合でも macOS ビルドが実行時間の大半を占めるため、日次のデフォルトから除外されています。

### 重大品質カテゴリー

`CodeQL Critical Quality` は、対応する非セキュリティシャードです。品質スキャンが Blacksmith のランナー登録予算を消費しないよう、GitHub ホステッド Linux ランナー上で、範囲を絞った高価値サーフェスに対して、エラー重大度の非セキュリティ JavaScript/TypeScript 品質クエリのみを実行します。そのプルリクエストガードは、スケジュール済みプロファイルよりも意図的に小さく設定されています。ドラフトでない PR では、触れたサーフェスに対応するシャードのみを、PR でルーティング可能な 13 個のシャード — `agent-runtime-boundary`、`channel-runtime-boundary`、`config-boundary`、`core-auth-secrets`、`gateway-runtime-boundary`、`mcp-process-runtime-boundary`、`memory-runtime-boundary`、`network-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract`、`plugin-sdk-reply-runtime`、`provider-runtime-boundary`、`session-diagnostics-boundary` — から実行します。`ui-control-plane` と `web-media-runtime-boundary` は PR 実行に含まれません。CodeQL 設定および品質ワークフローの変更では、完全な PR シャードセットを実行します（ネットワークランタイムシャードは、自身の CodeQL 設定ファイルと、ネットワークを所有するソースパスをキーとして使用します）。

手動ディスパッチで受け付ける値:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

範囲を絞ったプロファイルは、1 つの品質シャードを分離して実行するための学習/反復用フックです。

| カテゴリ                                                | 対象範囲                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | 認証、シークレット、サンドボックス、Cron、Gateway のセキュリティ境界コード                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | 設定スキーマ、移行、正規化、IO コントラクト                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway プロトコルスキーマとサーバーメソッドのコントラクト                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | コアチャネルとバンドルされたチャネル Plugin の実装コントラクト                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | コマンド実行、モデル／プロバイダーのディスパッチ、自動応答のディスパッチとキュー、および ACP コントロールプレーンのランタイムコントラクト                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP サーバーとツールブリッジ、プロセス監視ヘルパー、およびアウトバウンド配信コントラクト                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化の連携コード、およびメモリ doctor コマンド                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | ネットワークポリシーパッケージ、生ソケットおよびプロキシキャプチャのランタイム、SSH トンネル、Gateway ロック、JSONL ソケット、プッシュ転送の対象範囲                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | 応答キューの内部実装、セッション配信キュー、アウトバウンドセッションのバインド／配信ヘルパー、診断イベント／ログバンドルの対象範囲、およびセッション doctor CLI コントラクト |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK の受信応答ディスパッチ、応答ペイロード／チャンク分割／ランタイムヘルパー、チャネル応答オプション、配信キュー、およびセッション／スレッドのバインドヘルパー             |
| `/codeql-critical-quality/provider-runtime-boundary`    | モデルカタログの正規化、プロバイダーの認証と検出、プロバイダーランタイムの登録、プロバイダーのデフォルト／カタログ、および Web／検索／取得／埋め込みレジストリ    |
| `/codeql-critical-quality/ui-control-plane`             | コントロール UI のブートストラップ、ローカル永続化、Gateway の制御フロー、およびタスクコントロールプレーンのランタイムコントラクト                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | コアの Web 取得／検索、メディア IO、メディア理解、画像生成、およびメディア生成のランタイムコントラクト                                                    |
| `/codeql-critical-quality/plugin-boundary`              | ローダー、レジストリ、公開サーフェス、および Plugin SDK エントリポイントのコントラクト                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | 公開パッケージ側の Plugin SDK ソースと Plugin パッケージのコントラクトヘルパー                                                                                      |

品質はセキュリティとは分離したままにします。これにより、セキュリティシグナルを不明瞭にすることなく、品質に関する検出結果をスケジュール、測定、無効化、または拡張できます。Swift、Python、およびバンドルされた Plugin の CodeQL 拡張は、限定されたプロファイルのランタイムとシグナルが安定した後にのみ、範囲を限定またはシャーディングしたフォローアップ作業として再追加する必要があります。

## メンテナンスワークフロー

### ドキュメントエージェント

`Docs Agent` ワークフローは、既存のドキュメントを最近反映された変更と整合させ続けるための、イベント駆動型 Codex メンテナンスレーンです。純粋なスケジュール実行はありません。`main` への bot 以外による push の CI 実行が成功するとトリガーされる場合があり、手動ディスパッチで直接実行することもできます。ワークフロー実行による呼び出しは、`main` が先へ進んでいる場合、またはスキップされなかった別の Docs Agent 実行が過去 1 時間以内に作成されている場合はスキップされます。実行時には、前回スキップされなかった Docs Agent のソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメント確認以降に蓄積された main のすべての変更を対象にできます。

### テストパフォーマンスエージェント

`Test Performance Agent`ワークフローは、遅いテスト向けのイベント駆動型Codexメンテナンスレーンです。純粋なスケジュール実行はありません。`main`へのbot以外によるpushのCI実行が成功するとトリガーされる可能性がありますが、そのUTC日内に別のworkflow-run呼び出しがすでに実行済み、または実行中の場合はスキップされます。手動ディスパッチでは、この日次アクティビティゲートをバイパスします。このレーンは、フルスイートをグループ化したVitestパフォーマンスレポートを作成し、Codexには広範なリファクタリングではなく、カバレッジを維持する小規模なテストパフォーマンス修正のみを許可します。その後、フルスイートレポートを再実行し、合格したベースラインテスト数を減少させる変更を拒否します。グループ化されたレポートは、LinuxとmacOSでconfigごとの実経過時間と最大RSSを記録するため、変更前後の比較では所要時間の差分と並んでテストメモリの差分も明らかになります。ベースラインに失敗するテストがある場合、Codexが修正できるのは明らかな失敗のみであり、何かをコミットする前に、エージェント実行後のフルスイートレポートが合格する必要があります。botのpushが反映される前に`main`が進んだ場合、このレーンは検証済みパッチをリベースし、`pnpm check:changed`を再実行してpushを再試行します。競合する古いパッチはスキップされます。Codexアクションがdocsエージェントと同じdrop-sudoの安全方針を維持できるように、GitHubホストのUbuntuを使用します。

### マージ後の重複PR

`Duplicate PRs After Merge`ワークフローは、反映後に重複を整理するためのメンテナー向け手動ワークフローです。デフォルトではドライランとなり、`apply=true`の場合にのみ、明示的に列挙されたPRをクローズします。GitHubを変更する前に、反映されたPRがマージ済みであること、および各重複PRに共通の参照issueまたは重複する変更hunkのいずれかがあることを検証します。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ローカルチェックゲートと変更ルーティング

ローカルの変更レーンロジックは`scripts/changed-lanes.mjs`にあり、`scripts/check-changed.mjs`によって実行されます。このローカルチェックゲートは、広範なCIプラットフォームのスコープよりもアーキテクチャ境界に対して厳格です。

- core の本番コード変更では、core の本番用およびテスト用型チェックに加え、core の lint/ガードを実行する。
- core のテストのみの変更では、core のテスト用型チェックと core の lint のみを実行する。
- 拡張機能の本番コード変更では、拡張機能の本番用およびテスト用型チェックに加え、拡張機能の lint を実行する。
- 拡張機能のテストのみの変更では、拡張機能のテスト用型チェックと拡張機能の lint を実行する。
- 公開 Plugin SDK またはプラグイン契約の変更では、拡張機能がそれらの core 契約に依存するため、拡張機能の型チェックまで対象を広げる（Vitest の拡張機能スイープは引き続き明示的なテスト作業とする）。
- リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/config/ルート依存関係チェックを実行する。
- 不明なルート/config 変更では、安全側に倒してすべてのチェックレーンを実行する。

ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、意図的に `check:changed` より低コストになっている。テストを直接編集した場合はそのテスト自体を実行し、ソースを編集した場合は明示的なマッピングを優先した後、同階層のテストとインポートグラフ上の依存先を実行する。共有グループルーム配信 config は明示的なマッピングの 1 つである。グループの表示返信 config、ソース返信の配信モード、またはメッセージツールのシステムプロンプトに対する変更は、core の返信テストに加え、Discord と Slack の配信回帰テストを経由するため、共有デフォルトの変更は最初の PR push 前に失敗する。変更がハーネス全体に及び、低コストのマッピング済みセットを信頼できる代替指標として使用できない場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用する。

## Testbox の検証

Crabbox は、メンテナーによる Linux での検証に使用するリポジトリ所有のリモートボックスラッパーである。Agent
セッションでは、テストおよび計算負荷の高い作業にデフォルトでこれを使用する。
対象には、ビルド、型チェック、lint のファンアウト、Docker、パッケージレーン、E2E、ライブ
検証、CI との同等性確認が含まれる。信頼済みのメンテナーコードではデフォルトで
`blacksmith-testbox` を使用し、`.crabbox.yaml` も現在はこれをデフォルトとしている。設定済みの
ワークフローはプロバイダーと Agent の認証情報をハイドレートするため、信頼されていないコントリビューターまたは
フォークのコードでは、代わりにシークレットなしのフォーク CI またはサニタイズ済みの直接 AWS Crabbox を使用しなければならない。
サニタイズ済み AWS の実行では `CRABBOX_ENV_ALLOW=CI` を設定し、
`--no-hydrate` を渡して、新しい一時的なリモート `HOME` を使用する。これにより、リポジトリの
`OPENCLAW_*` 許可リストと既存の認証プロファイルが信頼されていないコードに到達することを防ぐ。
新たにウォームアップした、その信頼されていないソース専用のリースを使用し、信頼済みまたは
以前にハイドレートされたリースは決して使用しない。クリーンで信頼済みの `main` チェックアウトから、インストール済みの信頼できる Crabbox
バイナリを起動し、`--fresh-pr` でリモート PR のみを取得する。信頼されていないチェックアウトのラッパーや config をローカルで実行してはならない。
`CRABBOX_AWS_INSTANCE_PROFILE` を設定解除し、解決後の
`aws.instanceProfile` が空でない限り、安全側に倒して失敗させる。インストールやテストの前に、信頼済みの
絶対パスのツールを使用して IMDSv2 トークンを必須とし、IAM 認証情報
エンドポイントが 404 を返すことを証明し、リモートの `git rev-parse HEAD` をレビュー済み PR head の完全な SHA と比較する。リースをその SHA に紐付け、head が変更された場合は停止して再ウォームアップする。
クリーンな `main` から信頼済みの `scripts/crabbox-untrusted-bootstrap.sh` を
`--fresh-pr` とともにアップロードする。このスクリプトは固定バージョンの Node/pnpm をインストールし、SHA と
パッケージマネージャーの固定バージョンを検証し、`HOME` を分離し、依存関係をインストールした後、要求された
テストを実行する。
すべての `CRABBOX_TAILSCALE*` オーバーライドを設定解除し、`--network public
--tailscale=false` を強制し、exit-node/LAN フラグをクリアして、スクリプトをアップロードする前に
`crabbox inspect` が Tailscale 状態なしのパブリックネットワークを報告することを必須とする。
所有する AWS/Hetzner キャパシティは、Blacksmith の障害、
クォータの問題、または所有キャパシティを使用する明示的なテストに対するフォールバックとしても引き続き使用する。

テストや負荷の高い検証が必要になりそうな信頼済みコードのタスク開始時には、Agent は
バックグラウンドのコマンドセッションですぐに事前ウォームアップし、ハイドレーションの実行中も
調査と編集を続け、返された `tbx_...` id を再利用し、
実行のたびに現在のチェックアウトを同期し、引き渡し前に停止すること。

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox を使用する Blacksmith 実行では、ワンショットの Testbox をウォームアップ、取得、同期、実行、レポートし、
クリーンアップする。組み込みの同期健全性チェックでは、同期先ボックスの
`git status --short` に追跡対象ファイルの削除が 200 件以上表示される場合、即座に失敗する。
これにより、`pnpm-lock.yaml` などのルートファイルが消失する問題を検出できる。意図的に
大量削除を行う PR では、リモートコマンドに `CRABBOX_ALLOW_MASS_DELETIONS=1` を設定する。

Crabbox は、同期後の出力がないまま
同期フェーズに 5 分を超えて留まるローカル Blacksmith CLI 呼び出しも終了する。このガードを無効にするには
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` を設定し、ローカル差分が異常に大きい場合は、より大きな
ミリ秒値を使用する。

最初の実行前に、リポジトリルートからラッパーを確認する。

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

リポジトリラッパーは、選択したプロバイダーを公開していない古い Crabbox バイナリを拒否する。また、Blacksmith を使用する実行では、ラッパーが現在の Testbox の同期、キュー、クリーンアップ動作を利用できるよう、Crabbox 0.22.0 以降が必要である。Codex ワークツリーまたはリンク済み/スパースチェックアウトでは、Crabbox の起動前に pnpm が依存関係を調整する可能性があるため、ローカルの `pnpm crabbox:run` スクリプトを避け、代わりに Node ラッパーを直接呼び出す。

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

同階層のチェックアウトを使用する場合は、計測または検証作業の前に、無視対象となっているローカルバイナリを再ビルドする。

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

`.crabbox.yaml` の `blacksmith:` ブロックでは、組織、ワークフロー、ジョブ、ref のデフォルトがすでに固定されているため、以下の明示的なフラグは省略可能です。変更ゲート：

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

対象を絞ったテストの再実行：

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
コマンドの結果です。リンクされた GitHub Actions の実行がハイドレーションとキープアライブを担当します。
SSH コマンドがすでに返った後に Testbox が外部から停止されると、
その実行は `cancelled` で終了する場合があります。ラッパーの `exitCode` がゼロ以外であるか、
コマンド出力にテスト失敗が示されていない限り、これはクリーンアップまたはステータス上の付随情報として扱います。
Blacksmith を使用する単発の Crabbox 実行では、Testbox が自動的に停止されるはずです。
実行が中断された場合やクリーンアップが不明確な場合は、稼働中のボックスを調べ、
自分で作成したボックスのみを停止します：

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

同じハイドレーション済みボックスで複数のコマンドを実行する必要が明確にある場合にのみ、再利用します：

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

古いソースではなく、リースを再利用します。各実行で現在のチェックアウトがアップロードされるよう、
`--no-sync` は省略してください。変更されていない、すでに同期済みのツリーを意図的に
再実行する場合にのみ使用します。信頼できないコントリビューターやフォークのコードでは、
すべてのコマンドに `CRABBOX_ENV_ALLOW=CI`、`--provider aws --no-hydrate`、
および新しい一時リモート `HOME` を使用する必要があります。テスト前に、その
サニタイズされたコマンド内で依存関係をインストールします。同じ信頼できないソース専用に
新しくウォームアップしたリースのみを再利用し、信頼済みまたは以前にハイドレーションされたリースは決して使用しません。
信頼できないチェックアウトのラッパーや設定をローカルで実行してはいけません。クリーンで信頼済みの
`main` から、インストール済みの信頼できる Crabbox バイナリを起動し、すべての
実行で `--fresh-pr` を渡します。`CRABBOX_AWS_INSTANCE_PROFILE` は未設定のままにし、解決された
インスタンスプロファイルが空でない場合は拒否し、信頼済みリモートでの IMDS ロール不在の証明を必須とし、
インストールやテストの前にレビュー済み head SHA を検証します。リースをその SHA に紐付け、
head が変更された場合は停止して再ウォームアップします。リモート PR が存在しない場合は、シークレットなしのフォーク CI を使用します。
信頼できないソースに対して `hydrate-github` や、認証情報でハイドレーションされる Blacksmith ワークフローを
決して選択しないでください。

Crabbox レイヤーが壊れていても Blacksmith 自体が動作する場合は、`list`、`status`、
クリーンアップなどの診断に限って Blacksmith を直接使用します。Blacksmith の直接実行を
メンテナー向け証明として扱う前に、Crabbox の経路を修正してください。

`blacksmith testbox list --all` と `blacksmith testbox status` は動作するものの、新しい
ウォームアップが数分後も IP や Actions 実行 URL なしで `queued` のままの場合は、
Blacksmith プロバイダー、キュー、課金、または組織制限による圧迫として扱います。自分で作成した
キュー内の ID を停止し、それ以上 Testbox を起動せず、担当者が Blacksmith ダッシュボード、
課金、組織制限を確認する間、証明を以下の所有 Crabbox キャパシティ経路に移します。

Blacksmith が停止している、クォータ制限を受けている、必要な環境がない、または所有キャパシティの使用自体が明示的な目的である場合にのみ、所有 Crabbox キャパシティへエスカレーションします：

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

AWS に負荷がかかっている状況では、タスクに 48xlarge クラスの CPU が本当に必要でない限り、`class=beast` を避けてください。`beast` リクエストは 192 vCPU から始まり、リージョンの EC2 Spot または On-Demand Standard クォータに抵触する最も簡単な方法です。リポジトリ所有の `.crabbox.yaml` は、デフォルトで `class: standard`、オンデマンド市場、`capacity.hints: true` を使用するため、仲介された AWS リースでは、選択されたリージョンと市場、クォータ圧迫、Spot フォールバック、高負荷クラスの警告が表示されます。より重い広範なチェックには `fast` を使用し、standard/fast では不十分な場合にのみ `large` を使用し、フルスイートや全 Plugin の Docker マトリクス、明示的なリリースまたはブロッカー検証、高コア数のパフォーマンスプロファイリングなど、CPU 負荷が非常に高い例外的なレーンに限って `beast` を使用します。`pnpm check:changed`、対象を絞ったテスト、ドキュメントのみの作業、通常の lint/typecheck、小規模な E2E 再現、Blacksmith 障害のトリアージには `beast` を使用しないでください。キャパシティ診断には `--market on-demand` を使用し、Spot 市場の変動が診断シグナルに混ざらないようにします。

`.crabbox.yaml` は、プロバイダー、同期、GitHub Actions のハイドレーションに関するデフォルトを管理します。Crabbox の同期では `.git` が転送されないため、ハイドレーションされた Actions のチェックアウトは、メンテナーのローカルリモートやオブジェクトストアを同期するのではなく、独自のリモート Git メタデータを維持します。また、リポジトリ設定では、決して転送すべきでないローカルのランタイム／ビルド成果物（`.artifacts` やテストレポートなど）も除外されます。`.github/workflows/crabbox-hydrate.yml` は、チェックアウト、Node/pnpm のセットアップ、`origin/main` のフェッチ、および所有クラウド上の `crabbox run --id <cbx_id>` コマンドへの非シークレット環境の引き渡しを管理します。

## 関連項目

- [インストール概要](/ja-JP/install)
- [開発チャンネル](/ja-JP/install/development-channels)
