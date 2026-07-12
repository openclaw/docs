---
read_when:
    - 完全リリース検証の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全リリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、エビデンス
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-07-11T22:39:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース検証全体を統括する、リリース前の証明を行う単一の手動エントリポイントです。作業の大半は子ワークフローで実行されるため、失敗した環境のみをリリース全体を最初からやり直さずに再実行できます。

信頼されたワークフロー参照（通常は `main`）から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` には、OS 横断オンボーディングとエンドツーエンドのエージェントターン用に `anthropic` または `minimax` も指定できます。再利用可能な子ジョブは、呼び出されるワークフローハーネスを `job.workflow_repository` と `job.workflow_sha` から解決し、入力 `ref` でテスト対象の候補を選択します。これにより、古いリリースブランチやタグを検証する場合でも、現在の信頼された検証ロジックを利用できます。

ディスパッチされたすべての子は、親の `Full Release Validation` 実行と同じワークフロー SHA を報告する必要があります。親と子のディスパッチの間に `main` が移動した場合、子自体が成功しても、統括ワークフローは安全側に倒して失敗します。不変の正確なコミットを証明するには、`pnpm ci:full-release --sha <target-sha>` を使用します。このヘルパーは、現在の信頼された `origin/main` に固定された一時的な `release-ci/*` 参照を作成し、ターゲット SHA は候補の `ref` としてのみ渡します。また、利用可能な場合は厳密な完全一致ターゲットの証拠を再利用し、検証後に参照を削除します。新規実行を強制するには `-f reuse_evidence=false` を渡し、現在の `origin/main` から引き続き到達可能な古いワークフローコミットを選択するには `--workflow-sha <trusted-main-sha>` を渡します。ワークフロー自体がリポジトリ参照を作成または更新することはありません。

`release_profile=stable` と `release_profile=full` では、常に網羅的なライブ／Docker ソークテストを実行します。`beta` プロファイルで同じソークテストレーンを含めるには、`run_release_soak=true` を渡します。安定版の公開では、このソークテストとブロッキング対象の製品パフォーマンス証拠が含まれていない検証マニフェストは拒否されます。

Package Acceptance は通常、解決された `ref` から候補 tarball をビルドします。これには、`pnpm ci:full-release` でディスパッチされた完全 SHA の実行も含まれます。ベータ版の公開後は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を渡すことで、リリースチェック、Package Acceptance、OS 横断、リリースパス Docker、パッケージ版 Telegram の各処理で、公開済みの npm パッケージを再利用できます。Package Acceptance で意図的に別のパッケージを証明する場合にのみ、`package_acceptance_package_spec` を使用します。Codex Plugin のライブパッケージレーンも同じ状態に従います。公開済みの `release_package_spec` 値から `codex_plugin_spec=npm:@openclaw/codex@<version>` が導出され、SHA／アーティファクト実行では選択された参照から `extensions/codex` がパックされます。また、オペレーターは `npm:`、`npm-pack:`、または `git:` の Plugin ソースに対して `codex_plugin_spec` を直接設定できます。このレーンは、当該 Plugin が必要とする明示的な Codex CLI インストール承認を付与した後、Codex CLI の事前確認と同一セッション内の OpenAI エージェントターンを実行します。

## トップレベルのステージ

`rerun_group=all` の場合、最初に `Check for reusable validation evidence` ジョブが実行されます。このジョブは、完全に同一のターゲット SHA、リリースプロファイル、実効ソーク設定、検証入力に対する、直近の成功済み完全検証を検索します。そのような証拠が存在する場合、すべてのレーンがスキップされ、統括検証ジョブが不変の親アーティファクト、子実行、ディスパッチログを再確認します。これは同一候補の再実行からの復旧専用であり、異なる SHA 間での再利用を許可するものではありません。候補が変更された場合は、その差分の影響を受けるすべてのパッケージ、アーティファクト、インストール、Docker、またはプロバイダーのゲートを再実行してください。新規の完全実行を強制するには、`reuse_evidence=false` を渡します。証拠の再利用は、`main`、またはワークフローコミットが信頼された `main` の系譜上に残っている、SHA に固定された正規の `release-ci/*` 参照からのみ実行されます。それ以外のワークフロー参照では、選択されたレーンを新規実行します。

同じく `rerun_group=all` の場合、`Verify Docker runtime image assets` ジョブが `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` を指定して `runtime-assets` Docker ターゲットをビルドします。このジョブは他のステージと並列に実行され、統括検証ジョブによって必須化されます。各レーンは、ディスパッチ前にこのジョブの完了を待たなくなりました。より限定的な `rerun_group` では、この事前確認をスキップします。

| ステージ                  | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲットの解決          | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** 失敗した場合は統括ワークフローを再実行します。                                                                                                                                                                                                                                                                                              |
| Docker アセットの事前確認 | **ジョブ:** `Verify Docker runtime image assets`<br />**子ワークフロー:** なし<br />**証明内容:** 他のステージをディスパッチする前に、`runtime-assets` Docker ビルドターゲットが引き続き成功することを確認します。`rerun_group=all` の場合にのみ実行されます。<br />**再実行:** `rerun_group=all` を指定して統括ワークフローを再実行します。                                                                                                                                                                                            |
| Vitest と通常の CI        | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** ターゲット参照に対する手動の完全 CI グラフを実行します。これには、Linux Node レーン、同梱 Plugin のシャード、Plugin とチャンネルのコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI の国際化、統括ワークフロー経由の Android が含まれます。<br />**再実行:** `rerun_group=ci`。 |
| Plugin のプレリリース     | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin のカバレッジ、完全な Plugin バッチシャード、Plugin プレリリース Docker レーン、互換性トリアージ用の非ブロッキング `plugin-inspector-advisory` アーティファクトを実行します。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                                              |
| リリースチェック          | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールのスモークテスト、OS 横断パッケージチェック、Package Acceptance、QA Lab の同等性、ライブ Matrix、ライブ Telegram を実行します。安定版および完全版プロファイルでは、網羅的なライブ／E2E スイートと Docker リリースパスのチャンクも実行します。ベータ版では `run_release_soak=true` により追加できます。<br />**再実行:** `rerun_group=release-checks` または、より限定的なリリースチェック用ハンドル。 |
| パッケージ版 Telegram     | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `release_package_spec` または `npm_telegram_package_spec` が設定されている場合に、公開済みパッケージに焦点を当てた Telegram E2E を実行します。候補の完全検証では、代わりに正規の Package Acceptance Telegram E2E を使用します。<br />**再実行:** `release_package_spec` または `npm_telegram_package_spec` を指定して `rerun_group=npm-telegram`。                                                                 |
| 製品パフォーマンス        | **ジョブ:** `Run product performance evidence`<br />**子ワークフロー:** `OpenClaw Performance`<br />**証明内容:** ターゲット SHA に対してリリースプロファイルのパフォーマンス実行（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）を行います。Kova の出力はワークフローアーティファクト内に保持され、子ワークフローはレポート公開処理がスキップされたことを証明する必要があります。`rerun_group=all` または `rerun_group=performance` の場合にのみ必須（ブロッキング）であり、より限定的な再実行グループでは必須ではありません。<br />**再実行:** `rerun_group=performance`。 |
| 統括検証ジョブ            | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結果を再確認し、子ワークフローから処理時間が最長のジョブ一覧表を追記します。<br />**再実行:** 失敗した子を再実行して成功させた後、このジョブのみを再実行します。                                                                                                                                                                                                                                                                  |

統括ワークフローは、製品パフォーマンスを常にアーティファクト専用モードでディスパッチします。`OpenClaw Performance` がレポート公開を許可するのは、スケジュール実行、または `publish_reports=true` を明示的に設定した手動ディスパッチのみです。アーティファクト専用ガードは正常に完了し、公開ジョブがスキップされたままであることを証明する必要があります。新規および再利用された証拠には `controls.performanceReportPublication=artifact-only` が記録されます。検証ジョブと再利用セレクターは、対応する正規化済みパフォーマンス子ワークフローの証明がない証拠を拒否します。

検証ジョブは、正規のマニフェストを `full-release-validation-<run-id>-<run-attempt>` としてアップロードします。証拠ツールは、そのアーティファクト ID、ダイジェスト、生成元の実行、試行回数を検証してから、その正確なアーティファクト ID をダウンロードします。ダウンロードする ZIP のサイズを制限し、そのバイト列を REST の `sha256:` ダイジェストと照合して検証し、アーカイブを展開せずに、許可された唯一のサイズ制限付きマニフェストエントリをストリーミングします。古い公開処理の利用者向けに、固定名のエイリアスが一時的に残されています。検証ジョブは常に試行回数付きのアーティファクトを優先します。移行措置として、試行 1 のマニフェスト v2 生成元に限り、固定名も受け入れます。それ以降の試行とマニフェスト v3 では、そのレガシー名を拒否します。

`ref=main` かつ `rerun_group=all` の場合、`release/*` 参照の場合、および Tideclaw アルファ参照の場合、同じ参照と再実行グループを持つ新しい統括実行が古い実行に取って代わります。親がキャンセルされると、その監視処理は、すでにディスパッチ済みの子ワークフローをすべてキャンセルします。タグと固定 SHA の検証実行は互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度だけ解決し、パッケージまたは Docker 関連のステージで必要な場合に、共有の `release-package-under-test` アーティファクトを準備します。

| ステージ                 | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリース対象             | **ジョブ:** `Resolve target ref`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択した参照、任意の期待 SHA、プロファイル、再実行グループ、および対象を絞ったライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| パッケージ成果物         | **ジョブ:** `Prepare release package artifact`<br />**基盤ワークフロー:** なし<br />**テスト:** 候補 tarball を 1 つパックまたは解決し、後続のパッケージ関連チェック用に `release-package-under-test` をアップロードします。<br />**再実行:** 影響を受けたパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                                                                                                                                                                                                                             |
| インストールスモーク     | **ジョブ:** `Run install smoke`<br />**基盤ワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile のスモークイメージ再利用、QR パッケージインストール、ルートおよび Gateway の Docker スモーク、インストーラーの Docker テスト、Bun グローバルインストールのイメージプロバイダースモークを含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| クロス OS                | **ジョブ:** `cross_os_release_checks`<br />**基盤ワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使用し、選択したプロバイダーとモードについて Linux、Windows、macOS 上で新規インストールおよびアップグレードのレーンを実行します。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| リポジトリおよびライブ E2E | **ジョブ:** `Run repo/live E2E validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI WebSocket ストリーミング、ネイティブのライブプロバイダーおよび Plugin シャード、ならびに `release_profile` によって選択される Docker ベースのライブモデル/バックエンド/Gateway ハーネス。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または対象を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。必要に応じて `live_suite_filter` も指定します。                                                                                |
| Docker リリースパス      | **ジョブ:** `Run Docker release-path validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージ成果物に対するリリースパスの Docker チャンク。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または対象を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| パッケージ受け入れテスト | **ジョブ:** `Run package acceptance`<br />**基盤ワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、標準のモック OpenAI Telegram パッケージ E2E、および同じ tarball に対する公開済みバージョンからのアップグレード後の継続動作チェック。リリースをブロックするチェックでは、公開済みの最新バージョンをデフォルトのベースラインとして使用します。ソークチェック（`run_release_soak=true`）では、直近 4 件の安定版 npm リリースに加えて、固定された過去の 3 バージョン（`2026.4.23`、`2026.5.2`、`2026.4.15`）まで対象を広げ、報告済み問題のアップグレードフィクスチャに対して実行します。<br />**再実行:** `rerun_group=package`。 |
| 成熟度スコアカード       | **ジョブ:** `Render maturity scorecard release docs`<br />**基盤ワークフロー:** `maturity-scorecard.yml`<br />**テスト:** 対象の参照に対して参考情報としての成熟度スコアカードドキュメントをレンダリングします。`run_maturity_scorecard=true` が渡された場合にのみ実行されます。<br />**再実行:** `run_maturity_scorecard=true` を指定した `rerun_group=qa`。                                                                                                                                                                                                                                                           |
| QA 同等性                | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** 候補版とベースライン版のエージェント同等性パック、その後に同等性レポートを実行します。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA ランタイム同等性      | **ジョブ:** `Run QA Lab runtime parity lane`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** `openclaw`/`codex` ランタイムペアのエージェント同等性レーン（`pnpm openclaw qa suite --runtime-pair openclaw,codex`）。標準ティアに加え、`run_release_soak=true` の場合はソークティアも含みます。参考情報: 個々の失敗はリリースチェック検証をブロックしません。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                    |
| QA ランタイムツール網羅性 | **ジョブ:** `Enforce QA Lab runtime tool coverage`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** QA ランタイム同等性レーンの出力を使用し、標準ランタイム同等性ティア（`pnpm openclaw qa coverage --tools`）における `openclaw` と `codex` 間の動的なツール差異を検査します。ブロッキング: このジョブは参考扱いへの上書きができません。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                        |
| QA ライブ Matrix         | **ジョブ:** `Run QA Lab live Matrix lane`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA ライブ Telegram       | **ジョブ:** `Run QA Lab live Telegram lane`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** Convex CI の認証情報リースを使用するライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| リリース検証             | **ジョブ:** `Verify release checks`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択した再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 対象を絞った子ジョブが成功した後に再実行します。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker リリースパスのチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合に
次のチャンクを実行します。

| チャンク                                                        | 対象範囲                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパスのスモークレーン。                                                                                      |
| `package-update-openai`                                         | OpenAI パッケージのインストール/更新動作、Codex のオンデマンドインストール、Codex Plugin のライブターン、および Chat Completions のツール呼び出し。 |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                                                                             |
| `package-update-core`                                           | プロバイダーに依存しないパッケージおよび更新動作。                                                                              |
| `plugins-runtime-plugins`                                       | Plugin の動作を検証する Plugin ランタイムレーン。                                                                        |
| `plugins-runtime-services`                                      | サービスを基盤とするライブ Plugin ランタイムレーン。                                                                              |
| `plugins-runtime-install-a` から `plugins-runtime-install-h` まで | リリース検証を並列実行するために分割された Plugin のインストール/ランタイムバッチ。                                                      |
| `openwebui`                                                     | 要求された場合に専用の大容量ディスクランナーで分離して実行される OpenWebUI 互換性スモーク。                                    |

Docker レーンが 1 つだけ失敗した場合は、再利用可能なライブ/E2E ワークフローで
対象を絞った `docker_lanes=<lane[,lane]>` を使用します。利用可能な場合、
リリース成果物には、パッケージ成果物とイメージの再利用入力を含むレーンごとの再実行
コマンドが含まれます。

## リリースプロファイル

`release_profile` は主に、リリースチェック内のライブ/プロバイダー対象範囲を制御します。
通常のフル CI、Plugin プレリリース、インストールスモーク、パッケージ
受け入れ、QA Lab は除外されません。stable および full プロファイルでは、リポジトリ/ライブ
E2E と Docker リリース経路の網羅的なソークカバレッジが常に実行されます。beta プロファイルでは
`run_release_soak=true` を指定してオプトインできます。パッケージ受け入れは、すべてのフル候補に対して
標準のパッケージ Telegram E2E を提供するため、統括ワークフローでその
ライブポーラーを重複実行しません。

| プロファイル | 想定用途                              | 含まれるライブ/プロバイダーのカバレッジ                                                                                                                                                                   |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | リリースに不可欠な最速のスモークテスト。 | OpenAI/コアのライブ経路、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。                         |
| `stable` | デフォルトのリリース承認プロファイル。   | `beta` に加えて、Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、Docker サブエージェント通知、OpenCode Go スモークシャード。 |
| `full`   | 広範な参考用スイープ。                   | `stable` に加えて、参考用プロバイダー、Plugin ライブシャード、メディアライブシャード。                                                                                                                      |

## full のみの追加項目

次のスイートは `stable` ではスキップされ、`full` では含まれます。

| 領域                             | full のみのカバレッジ                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker ライブモデル              | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。                                                                             |
| Docker ライブ Gateway            | 参考用プロバイダーを DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai の各シャードに分割。                              |
| ネイティブ Gateway プロバイダープロファイル | Anthropic Opus のフルシャードと Sonnet/Haiku シャード、Fireworks、DeepSeek、OpenCode Go の全モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード | Plugin A-K、L-N、その他 O-Z、Moonshot、xAI。                                                                                |
| ネイティブメディアライブシャード | 音声、Google 音楽、MiniMax 音楽、動画グループ A-D。                                                                         |

`stable` には `native-live-src-gateway-profiles-anthropic-smoke` と
`native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full` では、代わりにより広範な
Anthropic および OpenCode Go モデルシャードを使用します。対象を絞った再実行では、引き続き集約
ハンドル `native-live-src-gateway-profiles-anthropic` または
`native-live-src-gateway-profiles-opencode-go` を使用できます。

## 対象を絞った再実行

無関係なリリース環境の再実行を避けるには、`rerun_group` を使用します。

| ハンドル            | 範囲                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Full Release Validation の全ステージ。                                                          |
| `ci`                | 手動フル CI 子ワークフローのみ。                                                                |
| `plugin-prerelease` | Plugin プレリリース子ワークフローのみ。                                                         |
| `release-checks`    | OpenClaw リリースチェックの全ステージ。                                                         |
| `install-smoke`     | インストールスモークからリリースチェックまで。                                                  |
| `cross-os`          | OS 横断リリースチェック。                                                                       |
| `live-e2e`          | リポジトリ/ライブ E2E および Docker リリース経路の検証。                                        |
| `package`           | パッケージ受け入れ。                                                                            |
| `qa`                | QA 同等性と QA ライブレーン。                                                                   |
| `qa-parity`         | QA 同等性レーンとレポートのみ。                                                                 |
| `qa-live`           | QA ライブの Matrix/Telegram、および有効時にゲートされる Discord、WhatsApp、Slack レーン。       |
| `npm-telegram`      | 公開済みパッケージの Telegram E2E。`release_package_spec` または `npm_telegram_package_spec` が必要。 |
| `performance`       | 製品パフォーマンスの証拠のみ。                                                                  |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は、再利用可能なライブ/E2E ワークフローで定義されており、
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、
`live-codex-harness-docker` などがあります。

`live-gateway-advisory-docker` ハンドルは、3 つのプロバイダーシャードをまとめた
再実行ハンドルであるため、引き続きすべての参考用 Docker Gateway ジョブへ展開されます。

1 つの OS 横断レーンが失敗した場合は、`rerun_group=cross-os` とともに
`cross_os_suite_filter` を使用します。このフィルターには、OS ID、スイート ID、または OS/スイートの組を指定できます。
たとえば `windows/packaged-upgrade`、`windows`、`packaged-fresh` です。OS 横断の
サマリーには、パッケージ済みアップグレードレーンのフェーズごとの所要時間が含まれます。また、長時間実行される
コマンドは Heartbeat 行を出力するため、更新が停止した場合にジョブの
タイムアウト前に確認できます。

QA リリースチェックの失敗は、通常のリリース検証をブロックします。QA ランタイムツールの
カバレッジチェック（標準階層での `openclaw` と `codex` 間の動的なツール差異）も、
基盤となる QA ランタイム同等性レーンが参考用であっても、リリースチェック検証を
ブロックします。Tideclaw alpha の実行では、パッケージ安全性に関係しない
リリースチェックレーンを引き続き参考用として扱う場合があります。
`release_profile=beta` の場合、`Run repo/live E2E validation` のライブプロバイダースイートは
参考用です。サードパーティーモデルのデプロイはリリースとは独立して変化するため、
beta ではその失敗を警告として表示し、stable および full プロファイルでは
引き続きブロック対象とします。
`live_suite_filter` で Discord、WhatsApp、Slack などのゲート付き QA ライブレーンを明示的に要求する場合、
対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ変数を
有効にする必要があります。有効でない場合、レーンを暗黙にスキップするのではなく、入力取得が失敗します。
新しい QA 証拠が必要な場合は、`rerun_group=qa`、`qa-parity`、または `qa-live` を再実行します。

## 保持する証拠

`Full Release Validation` のサマリーをリリースレベルの索引として保持します。ここには
子実行 ID へのリンクと、最も時間のかかったジョブの表が含まれます。失敗時は、まず子
ワークフローを確認し、その後、上記の中で一致する最小範囲のハンドルを再実行します。

有用な成果物：

- `OpenClaw Release Checks` の `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリース経路の成果物
- パッケージ受け入れの `package-under-test` と Docker 受け入れ成果物
- 各 OS およびスイートの OS 横断リリースチェック成果物
- QA 同等性、ランタイム同等性、Matrix、Telegram の成果物

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
