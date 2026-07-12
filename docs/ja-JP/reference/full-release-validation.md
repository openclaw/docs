---
read_when:
    - 完全リリース検証の実行または再実行
    - 安定版と完全リリースの検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全リリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、エビデンス
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-07-12T14:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース検証全体を統括する単一の手動エントリポイントであり、リリース前の証明に使用します。処理の大部分は子ワークフローで実行されるため、いずれかの環境で失敗しても、リリース全体を最初からやり直さずに再実行できます。

信頼済みのワークフロー ref（通常は `main`）から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` には、クロス OS オンボーディングとエンドツーエンドのエージェントターン用として `anthropic` または `minimax` も指定できます。再利用可能な子ジョブは、呼び出されたワークフローのハーネスを `job.workflow_repository` と `job.workflow_sha` から解決し、入力 `ref` はテスト対象の候補を選択します。これにより、古いリリースブランチやタグを検証する場合でも、現在の信頼済み検証ロジックを利用できます。

ディスパッチされたすべての子は、親の `Full Release Validation` 実行と同じワークフロー SHA を報告する必要があります。親と子のディスパッチ間に `main` が移動した場合、子自体が成功していても、統括ワークフローは安全側に倒して失敗します。不変の正確なコミット証明には、`pnpm ci:full-release --sha <target-sha>` を使用します。このヘルパーは、現在の信頼済み `origin/main` に固定された一時的な `release-ci/*` ref を作成し、対象 SHA を候補 `ref` としてのみ渡し、利用可能な場合は厳密な同一対象の証拠を再利用し、検証後に ref を削除します。新規実行を強制するには `-f reuse_evidence=false` を渡し、現在の `origin/main` から引き続き到達可能な古いワークフローコミットを選択するには `--workflow-sha <trusted-main-sha>` を渡します。ワークフロー自体がリポジトリの ref を作成または更新することはありません。

`release_profile=stable` と `release_profile=full` では、常に網羅的なライブ／Docker ソークテストを実行します。`beta` プロファイルで同じソークテストレーンを含めるには、`run_release_soak=true` を渡します。安定版の公開では、このソークテストとブロッキング対象の製品パフォーマンス証拠が含まれていない検証マニフェストは拒否されます。

Package Acceptance は通常、解決された `ref` から候補 tarball をビルドします。これには、`pnpm ci:full-release` でディスパッチされた完全 SHA の実行も含まれます。ベータ版の公開後は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を渡すと、リリースチェック、Package Acceptance、クロス OS、リリースパス Docker、パッケージ Telegram 全体で公開済み npm パッケージを再利用できます。Package Acceptance で意図的に異なるパッケージを証明する場合に限り、`package_acceptance_package_spec` を使用してください。Codex Plugin のライブパッケージレーンも同じ状態に従います。公開済みの `release_package_spec` 値から `codex_plugin_spec=npm:@openclaw/codex@<version>` を導出し、SHA／アーティファクト実行では選択した ref の `extensions/codex` をパックします。また、オペレーターは `npm:`、`npm-pack:`、または `git:` の Plugin ソースに対して `codex_plugin_spec` を直接設定できます。このレーンは、その Plugin が必要とする明示的な Codex CLI インストール承認を付与した後、Codex CLI の事前確認と同一セッション内での OpenAI エージェントターンを実行します。

## 最上位ステージ

`rerun_group=all` の場合、最初に `Check for reusable validation evidence` ジョブが実行されます。このジョブは、完全に同一の対象 SHA、リリースプロファイル、実効ソークテスト設定、および検証入力に対する、直近の成功済み完全検証を検索します。そのような証拠が存在する場合、すべてのレーンをスキップし、統括検証ジョブが不変の親アーティファクト、子実行、およびディスパッチログを再確認します。これは同一候補の再実行復旧専用であり、異なる SHA 間での再利用を許可するものではありません。候補が変更された場合、その差分の影響を受けるすべてのパッケージ、アーティファクト、インストール、Docker、またはプロバイダーゲートを再実行してください。新規の完全実行を強制するには、`reuse_evidence=false` を渡します。証拠の再利用は、`main`、またはワークフローコミットが信頼済み `main` の系譜に残っている正規の SHA 固定 `release-ci/*` ref からのみ実行されます。それ以外のワークフロー ref では、選択したレーンを新規に実行します。

同じく `rerun_group=all` の場合、`Verify Docker runtime image assets` ジョブが `OPENCLAW_EXTENSIONS=diagnostics-otel,codex` を指定して `runtime-assets` Docker ターゲットをビルドします。このジョブは他のステージと並行して実行され、統括検証ジョブによって必須化されます。各レーンは、ディスパッチ前にこのジョブの完了を待たなくなりました。より限定的な `rerun_group` では、この事前確認をスキップします。

| ステージ                | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 対象の解決              | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択した入力を記録します。<br />**再実行:** 失敗した場合は統括ワークフローを再実行します。                                                                                                                                                                                                                                                                                           |
| Docker アセットの事前確認 | **ジョブ:** `Verify Docker runtime image assets`<br />**子ワークフロー:** なし<br />**証明内容:** 他のステージがディスパッチされる前に、`runtime-assets` Docker ビルドターゲットが引き続き成功することを確認します。`rerun_group=all` の場合にのみ実行されます。<br />**再実行:** `rerun_group=all` を指定して統括ワークフローを再実行します。                                                                                                                                                                                      |
| Vitest と通常の CI      | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** 対象 ref に対して手動の完全 CI グラフを実行します。これには、Linux Node レーン、バンドル済み Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n、および統括ワークフロー経由の Android が含まれます。<br />**再実行:** `rerun_group=ci`。 |
| Plugin プレリリース     | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な Plugin バッチシャード、Plugin プレリリース Docker レーン、および互換性トリアージ用の非ブロッキング `plugin-inspector-advisory` アーティファクトを実行します。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                                                        |
| リリースチェック        | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、Package Acceptance、QA Lab の同等性、ライブ Matrix、およびライブ Telegram を検証します。stable および full プロファイルでは、網羅的なライブ／E2E スイートと Docker リリースパスチャンクも実行されます。beta では `run_release_soak=true` を指定して任意に有効化できます。<br />**再実行:** `rerun_group=release-checks` または、より限定的な release-checks ハンドル。 |
| パッケージ Telegram     | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `release_package_spec` または `npm_telegram_package_spec` が設定されている場合、公開済みパッケージに特化した Telegram E2E を実行します。完全な候補検証では、代わりに正規の Package Acceptance Telegram E2E を使用します。<br />**再実行:** `release_package_spec` または `npm_telegram_package_spec` を指定した `rerun_group=npm-telegram`。                                                                                               |
| 製品パフォーマンス      | **ジョブ:** `Run product performance evidence`<br />**子ワークフロー:** `OpenClaw Performance`<br />**証明内容:** 対象 SHA に対してリリースプロファイルのパフォーマンス実行（`profile=release`、`repeat=3`、`fail_on_regression=true`、`publish_reports=false`）を行います。Kova の出力はワークフローアーティファクトに保持され、子はレポート公開処理がスキップされたことを証明する必要があります。`rerun_group=all` または `rerun_group=performance` の場合のみ必須（ブロッキング）であり、より限定的な再実行グループでは必須ではありません。<br />**再実行:** `rerun_group=performance`。 |
| 統括検証ジョブ          | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結果を再確認し、子ワークフローから最も時間のかかったジョブの表を追記します。<br />**再実行:** 失敗した子を成功状態まで再実行した後、このジョブのみを再実行します。                                                                                                                                                                                                                                                            |

統括ワークフローは、製品パフォーマンスを常にアーティファクト専用モードでディスパッチします。`OpenClaw Performance` がレポートの公開を許可するのは、スケジュール実行、または `publish_reports=true` を明示的に設定した手動ディスパッチのみです。アーティファクト専用ガードは正常に完了し、公開ジョブがスキップされたままであることを証明する必要があります。新規および再利用された証拠には `controls.performanceReportPublication=artifact-only` が記録されます。検証ジョブと再利用セレクターは、一致する正規化済みのパフォーマンス子ワークフロー証明がない証拠を拒否します。

検証ジョブは、正規マニフェストを `full-release-validation-<run-id>-<run-attempt>` としてアップロードします。証拠ツールは、そのアーティファクト ID、ダイジェスト、生成元実行、および試行番号を検証してから、その正確なアーティファクト ID をダウンロードします。ダウンロードする ZIP のサイズに上限を設け、そのバイト列を REST の `sha256:` ダイジェストと照合し、アーカイブを展開せず、許可された唯一のサイズ制限付きマニフェストエントリをストリーム処理します。古い公開コンシューマー向けに、安定名のエイリアスが一時的に維持されます。検証ジョブは常に試行番号付きアーティファクトを優先します。移行措置として、試行 1 のマニフェスト v2 生成元に限り、安定名を受け入れます。それ以降の試行およびマニフェスト v3 では、そのレガシー名を拒否します。

`ref=main` かつ `rerun_group=all` の場合、`release/*` ref の場合、および Tideclaw alpha ref の場合、同じ ref と再実行グループを持つ新しい統括ワークフロー実行が古い実行を置き換えます。親がキャンセルされると、その監視処理はすでにディスパッチ済みの子ワークフローをすべてキャンセルします。タグおよび固定 SHA の検証実行は、互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。対象を一度だけ解決し、パッケージまたは Docker に関係するステージで必要な場合は、共有の `release-package-under-test` アーティファクトを準備します。

| ステージ                    | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリース対象           | **ジョブ:** `Resolve target ref`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択した ref、オプションの期待 SHA、プロファイル、再実行グループ、対象を絞ったライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                                                                             |
| パッケージアーティファクト         | **ジョブ:** `Prepare release package artifact`<br />**基盤ワークフロー:** なし<br />**テスト:** 候補 tarball を 1 つパックまたは解決し、後続のパッケージ関連チェック用に `release-package-under-test` をアップロードします。<br />**再実行:** 影響を受けたパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                                                                                                                                                                                                                             |
| インストールスモークテスト            | **ジョブ:** `Run install smoke`<br />**基盤ワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージの再利用、QR パッケージインストール、ルートおよび Gateway の Docker スモークテスト、インストーラーの Docker テスト、Bun グローバルインストールのイメージプロバイダースモークテストを含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                                                                                                                                           |
| クロス OS                 | **ジョブ:** `cross_os_release_checks`<br />**基盤ワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使用し、選択したプロバイダーとモードについて Linux、Windows、macOS 上で新規インストールおよびアップグレードのレーンを実行します。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                                                                                                 |
| リポジトリおよびライブ E2E        | **ジョブ:** `Run repo/live E2E validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI WebSocket ストリーミング、ネイティブのライブプロバイダーおよび Plugin シャード、ならびに `release_profile` で選択される Docker ベースのライブモデル/バックエンド/Gateway ハーネス。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または対象を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。必要に応じて `live_suite_filter` を指定します。                                                                                |
| Docker リリースパス      | **ジョブ:** `Run Docker release-path validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパスの Docker チャンク。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または対象を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                                                                                                     |
| パッケージ受け入れテスト       | **ジョブ:** `Run package acceptance`<br />**基盤ワークフロー:** `Package Acceptance`<br />**テスト:** オフラインの Plugin パッケージフィクスチャ、Plugin の更新、正規のモック OpenAI Telegram パッケージ E2E、および同じ tarball に対する公開済みバージョンからのアップグレード生存チェック。ブロッキングのリリースチェックでは、デフォルトで最新の公開済みベースラインを使用します。ソークチェック（`run_release_soak=true`）では、報告済み問題のアップグレードフィクスチャに対して、直近 4 件の安定版 npm リリースに加え、固定された過去の 3 バージョン（`2026.4.23`、`2026.5.2`、`2026.4.15`）まで対象を拡張します。<br />**再実行:** `rerun_group=package`。 |
| 成熟度スコアカード       | **ジョブ:** `Render maturity scorecard release docs`<br />**基盤ワークフロー:** `maturity-scorecard.yml`<br />**テスト:** 対象 ref に対して参考情報としての成熟度スコアカードドキュメントをレンダリングします。`run_maturity_scorecard=true` が渡された場合にのみ実行されます。<br />**再実行:** `run_maturity_scorecard=true` を指定した `rerun_group=qa`。                                                                                                                                                                                                                                                           |
| QA パリティ                | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** 候補版とベースラインのエージェント型パリティパックを実行し、その後パリティレポートを生成します。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| QA ランタイムパリティ        | **ジョブ:** `Run QA Lab runtime parity lane`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** `openclaw`/`codex` ランタイムペアのエージェント型パリティレーン（`pnpm openclaw qa suite --runtime-pair openclaw,codex`）。標準ティアと、`run_release_soak=true` の場合のソークティアを含みます。参考情報: 個々の失敗はリリースチェック検証をブロックしません。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                    |
| QA ランタイムツールカバレッジ | **ジョブ:** `Enforce QA Lab runtime tool coverage`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** QA ランタイムパリティレーンの出力を使用し、標準ランタイムパリティティアで `openclaw` と `codex` 間の動的ツールドリフトを検査します（`pnpm openclaw qa coverage --tools`）。ブロッキング: このジョブは参考扱いに変更できません。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                        |
| QA ライブ Matrix           | **ジョブ:** `Run QA Lab live Matrix lane`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                          |
| QA ライブ Telegram         | **ジョブ:** `Run QA Lab live Telegram lane`<br />**基盤ワークフロー:** 直接実行ジョブ<br />**テスト:** Convex CI 認証情報リースを使用したライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                                                                      |
| リリース検証         | **ジョブ:** `Verify release checks`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択した再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 対象を絞った子ジョブが成功した後に再実行します。                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker リリースパスのチャンク

Docker リリースパスステージでは、`live_suite_filter` が空の場合に次のチャンクを実行します。

| チャンク                                                           | カバレッジ                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパスのスモークテストレーン。                                                                                      |
| `package-update-openai`                                         | OpenAI パッケージのインストール/更新動作、Codex のオンデマンドインストール、Codex Plugin のライブターン、Chat Completions のツール呼び出し。 |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                                                                             |
| `package-update-core`                                           | プロバイダーに依存しないパッケージおよび更新動作。                                                                              |
| `plugins-runtime-plugins`                                       | Plugin の動作を検証する Plugin ランタイムレーン。                                                                        |
| `plugins-runtime-services`                                      | サービスバックエンドおよびライブ Plugin のランタイムレーン。                                                                              |
| `plugins-runtime-install-a` から `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムのバッチ。                                                      |
| `openwebui`                                                     | 要求された場合に専用の大容量ディスクランナー上で分離して実行する OpenWebUI 互換性スモークテスト。                                    |

Docker レーンが 1 つだけ失敗した場合は、再利用可能なライブ/E2E ワークフローで対象を絞った `docker_lanes=<lane[,lane]>` を使用します。リリースアーティファクトには、利用可能な場合、パッケージアーティファクトとイメージの再利用入力を含むレーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は主に、リリースチェック内のライブ/プロバイダー対象範囲を制御します。
通常の完全 CI、Plugin プレリリース、インストールスモーク、パッケージ
受け入れ、QA Lab は除外されません。stable および full プロファイルでは、常にリポジトリ/ライブの網羅的な
E2E と Docker リリースパスの長時間カバレッジが実行されます。beta プロファイルでは
`run_release_soak=true` を指定してオプトインできます。パッケージ受け入れは、すべての完全な候補に対して標準のパッケージ
Telegram E2E を提供するため、包括ワークフローではその
ライブポーラーを重複実行しません。

| プロファイル | 想定用途 | 含まれるライブ/プロバイダーカバレッジ |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | リリースに不可欠な最速のスモーク。 | OpenAI/コアのライブパス、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。 |
| `stable` | デフォルトのリリース承認プロファイル。 | `beta` に加えて、Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、Docker サブエージェント通知、および OpenCode Go スモークシャード。 |
| `full`   | 広範なアドバイザリースイープ。 | `stable` に加えて、アドバイザリープロバイダー、Plugin ライブシャード、メディアライブシャード。 |

## full のみに含まれる追加項目

以下のスイートは `stable` ではスキップされ、`full` には含まれます。

| 領域 | full のみのカバレッジ |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker ライブモデル | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。 |
| Docker ライブ Gateway | アドバイザリープロバイダーを DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai の各シャードに分割。 |
| ネイティブ Gateway プロバイダープロファイル | 完全な Anthropic Opus および Sonnet/Haiku シャード、Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード | Plugin A-K、L-N、O-Z その他、Moonshot、xAI。 |
| ネイティブメディアライブシャード | オーディオ、Google 音楽、MiniMax 音楽、動画グループ A-D。 |

`stable` には `native-live-src-gateway-profiles-anthropic-smoke` と
`native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full` では代わりに、より広範な
Anthropic および OpenCode Go モデルシャードを使用します。対象を絞った再実行では、引き続き集約
`native-live-src-gateway-profiles-anthropic` または
`native-live-src-gateway-profiles-opencode-go` ハンドルを使用できます。

## 対象を絞った再実行

無関係なリリースボックスの再実行を避けるには、`rerun_group` を使用します。

| ハンドル | 範囲 |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Full Release Validation のすべてのステージ。 |
| `ci`                | 手動の完全 CI 子ワークフローのみ。 |
| `plugin-prerelease` | Plugin プレリリース子ワークフローのみ。 |
| `release-checks`    | OpenClaw リリースチェックのすべてのステージ。 |
| `install-smoke`     | リリースチェックまでのインストールスモーク。 |
| `cross-os`          | クロス OS リリースチェック。 |
| `live-e2e`          | リポジトリ/ライブ E2E および Docker リリースパス検証。 |
| `package`           | パッケージ受け入れ。 |
| `qa`                | QA パリティと QA ライブレーン。 |
| `qa-parity`         | QA パリティレーンとレポートのみ。 |
| `qa-live`           | QA ライブ Matrix/Telegram に加え、有効時にはゲートされた Discord、WhatsApp、Slack レーン。 |
| `npm-telegram`      | 公開済みパッケージの Telegram E2E。`release_package_spec` または `npm_telegram_package_spec` が必要。 |
| `performance`       | 製品パフォーマンスのエビデンスのみ。 |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は、再利用可能なライブ/E2E ワークフローで定義されており、次を含みます。
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、
`live-codex-harness-docker`。

`live-gateway-advisory-docker` ハンドルは、その
3 つのプロバイダーシャード用の集約再実行ハンドルであるため、すべてのアドバイザリー Docker Gateway ジョブへ引き続きファンアウトします。

1 つのクロス OS レーンが失敗した場合は、`rerun_group=cross-os` とともに `cross_os_suite_filter` を使用します。
フィルターには OS ID、スイート ID、または OS/スイートの組み合わせを指定できます。たとえば
`windows/packaged-upgrade`、`windows`、`packaged-fresh` です。クロス OS
サマリーには、パッケージアップグレードレーンのフェーズごとの所要時間が含まれます。また、長時間実行される
コマンドは Heartbeat 行を出力するため、ジョブが
タイムアウトする前に停止した更新を確認できます。

QA リリースチェックの失敗は、通常のリリース検証をブロックします。QA ランタイムツールの
カバレッジチェック（標準ティアにおける `openclaw` と `codex` 間の動的なツールドリフト）も、
基礎となる QA ランタイムパリティレーンがアドバイザリーであっても、
リリースチェック検証をブロックします。Tideclaw alpha の実行では、パッケージ安全性に関係しない
リリースチェックレーンを引き続きアドバイザリーとして扱う場合があります。
`release_profile=beta` の場合、`Run repo/live E2E validation` ライブプロバイダースイートは
アドバイザリーです。サードパーティのモデルデプロイメントはリリースとは独立して変更されるため、
beta ではその失敗を警告として表示し、stable および full プロファイルでは
引き続きブロッキングとして扱います。
`live_suite_filter` で Discord、WhatsApp、Slack などのゲートされた QA ライブレーンを明示的に要求する場合、
対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ
変数を有効にする必要があります。有効でない場合、レーンを暗黙にスキップするのではなく、入力キャプチャが失敗します。
新しい QA エビデンスが必要な場合は、`rerun_group=qa`、`qa-parity`、または `qa-live` を
再実行します。

## 保持するエビデンス

リリースレベルのインデックスとして、`Full Release Validation` サマリーを保持します。これには
子実行 ID へのリンクと、最も遅いジョブの表が含まれます。失敗時は、まず子
ワークフローを確認してから、上記の最小限の対応ハンドルを再実行します。

有用なアーティファクト:

- `OpenClaw Release Checks` の `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- パッケージ受け入れの `package-under-test` と Docker 受け入れアーティファクト
- 各 OS およびスイートのクロス OS リリースチェックアーティファクト
- QA パリティ、ランタイムパリティ、Matrix、Telegram の各アーティファクト

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
