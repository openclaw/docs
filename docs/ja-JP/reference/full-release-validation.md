---
read_when:
    - Full Release Validation の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージの失敗のデバッグ
summary: Full Release Validation のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、エビデンス
title: 完全リリース検証
x-i18n:
    generated_at: "2026-07-05T11:43:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5ece97d1f12e6a097cf9314acd47614f0f80cee704b1b48c0cedfe5e39ff064
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース全体を束ねる仕組みです。リリース前の証明を行う単一の手動エントリーポイントです。ほとんどの作業は子ワークフローで実行されるため、失敗したボックスはリリース全体を最初からやり直さずに再実行できます。

信頼済みのワークフロー参照、通常は `main` から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` は、クロス OS オンボーディングとエンドツーエンドのエージェントターン用に `anthropic` または `minimax` も受け付けます。子ワークフローは、ハーネスには信頼済みのワークフロー参照を、テスト対象の候補には入力 `ref` を使用するため、古いリリースブランチやタグを検証するときも新しい検証ロジックを利用できます。

`release_profile=stable` と `release_profile=full` は、常に網羅的なライブ/Docker ソークを実行します。`beta` プロファイルで同じソークレーンを含めるには、`run_release_soak=true` を渡します。stable 公開では、このソークとブロッキングの製品パフォーマンス証拠がない検証マニフェストは拒否されます。

パッケージ受け入れは通常、完全 SHA の実行を `pnpm ci:full-release` でディスパッチした場合も含め、解決された `ref` から候補 tarball をビルドします。beta 公開後は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を渡すことで、出荷済みの npm パッケージをリリースチェック、パッケージ受け入れ、クロス OS、リリースパス Docker、パッケージ Telegram で再利用できます。パッケージ受け入れで意図的に別のパッケージを証明する場合にのみ、`package_acceptance_package_spec` を使用してください。Codex Plugin のライブパッケージレーンは同じ状態に従います。公開済みの `release_package_spec` 値は `codex_plugin_spec=npm:@openclaw/codex@<version>` を導出します。SHA/アーティファクト実行では、選択された ref から `extensions/codex` をパックします。また、オペレーターは `npm:`、`npm-pack:`、または `git:` の Plugin ソースに対して `codex_plugin_spec` を直接設定できます。このレーンは、その Plugin に必要な明示的な Codex CLI インストール承認を付与したうえで、Codex CLI プリフライトと同一セッションの OpenAI エージェントターンを実行します。

## トップレベルステージ

`rerun_group=all` の場合、`Verify Docker runtime image assets` ジョブが他のすべてのステージをゲートします。何かがディスパッチされる前に、`OPENCLAW_EXTENSIONS=diagnostics-otel,codex` を指定して `runtime-assets` Docker ターゲットをビルドします。より狭い `rerun_group` では、このプリフライトはスキップされます。

| ステージ                | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ターゲット解決          | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は、アンブレラを再実行します。                                                                                                                                                                                                                                             |
| Docker アセットプリフライト | **ジョブ:** `Verify Docker runtime image assets`<br />**子ワークフロー:** なし<br />**証明内容:** 他のステージがディスパッチされる前に、`runtime-assets` Docker ビルドターゲットが引き続き成功することを確認します。`rerun_group=all` の場合にのみ実行されます。<br />**再実行:** `rerun_group=all` でアンブレラを再実行します。                                                                                                                                                                          |
| Vitest と通常 CI        | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** ターゲット ref に対する手動のフル CI グラフを証明します。これには Linux Node レーン、バンドル済み Plugin シャード、Plugin とチャネルのコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、docs チェック、Python Skills、Windows、macOS、Control UI i18n、アンブレラ経由の Android が含まれます。<br />**再実行:** `rerun_group=ci`。                           |
| Plugin プレリリース     | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、Plugin のフルバッチシャード、Plugin プレリリース Docker レーン、互換性トリアージ用の非ブロッキング `plugin-inspector-advisory` アーティファクトを証明します。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                           |
| リリースチェック        | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、パッケージ受け入れ、QA Lab パリティ、ライブ Matrix、ライブ Telegram を証明します。stable および full プロファイルでは、網羅的なライブ/E2E スイートと Docker リリースパスチャンクも実行します。beta では `run_release_soak=true` でオプトインできます。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。 |
| パッケージ Telegram     | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `release_package_spec` または `npm_telegram_package_spec` が設定されている場合に、公開済みパッケージに絞った Telegram E2E を証明します。完全な候補検証では、代わりに正規のパッケージ受け入れ Telegram E2E を使用します。<br />**再実行:** `release_package_spec` または `npm_telegram_package_spec` を指定して `rerun_group=npm-telegram`。                                               |
| 製品パフォーマンス      | **ジョブ:** `Run product performance evidence`<br />**子ワークフロー:** `OpenClaw Performance`<br />**証明内容:** ターゲット SHA に対するリリースプロファイルのパフォーマンス実行（`profile=release`、`repeat=3`、`fail_on_regression=true`）を証明します。`rerun_group=all` または `rerun_group=performance` の場合にのみ必須（ブロッキング）です。より狭い再実行グループでは必須ではありません。<br />**再実行:** `rerun_group=performance`。                                                              |
| アンブレラ検証          | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブのみを再実行します。                                                                                                                                                                                                  |

`ref=main` かつ `rerun_group=all` の場合、新しいアンブレラは古いアンブレラを置き換えます。親がキャンセルされると、そのモニターはすでにディスパッチ済みの子ワークフローをすべてキャンセルします。リリースブランチとタグの検証実行は、デフォルトでは相互にキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度だけ解決し、パッケージまたは Docker 向けのステージで必要な場合に共有の `release-package-under-test` アーティファクトを準備します。

| ステージ                 | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット       | **ジョブ:** `Resolve target ref`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択された ref、任意の期待 SHA、プロファイル、再実行グループ、焦点を絞ったライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                                                           |
| パッケージアーティファクト | **ジョブ:** `Prepare release package artifact`<br />**基盤ワークフロー:** なし<br />**テスト:** 候補 tarball を 1 つパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードする。<br />**再実行:** 影響を受けるパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                                                                                                                                                                      |
| インストールスモーク     | **ジョブ:** `Run install smoke`<br />**基盤ワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージの再利用、QR パッケージインストール、ルートと Gateway の Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールのイメージプロバイダースモークを含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                                            |
| クロス OS                | **ジョブ:** `cross_os_release_checks`<br />**基盤ワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 選択されたプロバイダーとモードについて、候補 tarball とベースラインパッケージを使用する Linux、Windows、macOS 上の新規およびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                                                        |
| リポジトリとライブ E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI websocket ストリーミング、ネイティブライブプロバイダーと Plugin シャード、および `release_profile` によって選択される Docker バックのライブモデル/バックエンド/Gateway ハーネス。<br />**実行:** `run_release_soak=true`、`release_profile=full`、または焦点を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`、任意で `live_suite_filter` を指定。 |
| Docker リリースパス      | **ジョブ:** `Run Docker release-path validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**実行:** `run_release_soak=true`、`release_profile=full`、または焦点を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                                             |
| パッケージ受け入れ       | **ジョブ:** `Run package acceptance`<br />**基盤ワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、正規のモック OpenAI Telegram パッケージ E2E、および同じ tarball に対する公開済みアップグレード生存チェック。ブロッキングリリースチェックは、デフォルトの最新公開済みベースラインを使用する。ソークチェック（`run_release_soak=true`）では、報告済み Issue のアップグレードフィクスチャに対して、直近 4 件の安定版 npm リリースと固定された過去バージョン 3 件（`2026.4.23`、`2026.5.2`、`2026.4.15`）まで拡張される。<br />**再実行:** `rerun_group=package`。 |
| 成熟度スコアカード       | **ジョブ:** `Render maturity scorecard release docs`<br />**基盤ワークフロー:** `maturity-scorecard.yml`<br />**テスト:** ターゲット ref に対して助言的な成熟度スコアカードドキュメントをレンダリングする。`run_maturity_scorecard=true` が渡された場合にのみ実行される。<br />**再実行:** `run_maturity_scorecard=true` を指定した `rerun_group=qa`。                                                                                                                                                                                                  |
| QA パリティ              | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** 候補およびベースラインのエージェント型パリティパック、その後にパリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                                                     |
| QA ランタイムパリティ    | **ジョブ:** `Run QA Lab runtime parity lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** `openclaw`/`codex` ランタイムペアのエージェント型パリティレーン（`pnpm openclaw qa suite --runtime-pair openclaw,codex`）。標準ティアと、`run_release_soak=true` の場合はソークティアを含む。助言: 個別の失敗はリリースチェック検証をブロックしない。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                      |
| QA ランタイムツールカバレッジ | **ジョブ:** `Enforce QA Lab runtime tool coverage`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** QA ランタイムパリティレーンの出力を使用する、標準ランタイムパリティティア内の `openclaw` と `codex` 間の動的ツールドリフト（`pnpm openclaw qa coverage --tools`）。ブロッキング: このジョブは助言として上書きできない。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                 |
| QA ライブ Matrix         | **ジョブ:** `Run QA Lab live Matrix lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                        |
| QA ライブ Telegram       | **ジョブ:** `Run QA Lab live Telegram lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使用するライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                                                         |
| リリース検証             | **ジョブ:** `Verify release checks`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 焦点を絞った子ジョブが成功した後に再実行。                                                                                                                                                                                                                                                                                                                                                      |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合にこれらのチャンクを実行します。

| チャンク                                                        | カバレッジ                                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパススモークレーン。                                                                                   |
| `package-update-openai`                                         | OpenAI パッケージのインストール/更新動作、Codex オンデマンドインストール、Codex Plugin ライブターン、Chat Completions ツール呼び出し。 |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                                                                         |
| `package-update-core`                                           | プロバイダー非依存のパッケージおよび更新動作。                                                                             |
| `plugins-runtime-plugins`                                       | Plugin の動作を実行する Plugin ランタイムレーン。                                                                          |
| `plugins-runtime-services`                                      | サービスバックおよびライブ Plugin ランタイムレーン。要求された場合は OpenWebUI を含む。                                   |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。                                                     |

1 つの Docker レーンだけが失敗した場合は、再利用可能なライブ/E2E ワークフローで対象を絞った `docker_lanes=<lane[,lane]>` を使用します。リリースアーティファクトには、利用可能な場合、パッケージアーティファクトとイメージ再利用入力を含むレーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は主にリリースチェック内のライブ/プロバイダー範囲を制御します。
通常のフル CI、Plugin Prerelease、インストールスモーク、パッケージ
受け入れ、QA Lab は削除しません。stable プロファイルと full プロファイルは、常に網羅的なリポジトリ/ライブ
E2E と Docker リリースパスのソークカバレッジを実行します。beta プロファイルは
`run_release_soak=true` でオプトインできます。Package Acceptance は、すべてのフル候補に対して正規のパッケージ
Telegram E2E を提供するため、アンブレラはそのライブポーラーを重複実行しません。

| プロファイル | 想定用途                          | 含まれるライブ/プロバイダーのカバレッジ                                                                                                                                                                   |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | 最速のリリース重要スモーク。      | OpenAI/コアのライブパス、OpenAI 向け Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。                      |
| `stable` | デフォルトのリリース承認プロファイル。 | `beta` に加えて Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、Docker サブエージェント通知、OpenCode Go スモークシャード。 |
| `full`   | 広範な助言的スイープ。            | `stable` に加えて助言的プロバイダー、Plugin ライブシャード、メディアライブシャード。                                                                                                                       |

## full のみの追加

これらのスイートは `stable` ではスキップされ、`full` に含まれます。

| 領域                             | full のみのカバレッジ                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker ライブモデル              | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。                                                                             |
| Docker ライブ Gateway            | 助言的プロバイダーを DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai のシャードに分割。                                |
| ネイティブ Gateway プロバイダープロファイル | Anthropic Opus と Sonnet/Haiku のフルシャード、Fireworks、DeepSeek、OpenCode Go のフルモデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード | Plugins A-K、L-N、O-Z other、Moonshot、xAI。                                                                                |
| ネイティブメディアライブシャード | Audio、Google music、MiniMax music、video groups A-D。                                                                      |

`stable` には `native-live-src-gateway-profiles-anthropic-smoke` と
`native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full` では、代わりにより広範な
Anthropic と OpenCode Go のモデルシャードを使用します。絞り込み再実行では引き続き
集約 `native-live-src-gateway-profiles-anthropic` または
`native-live-src-gateway-profiles-opencode-go` ハンドルを使用できます。

## 絞り込み再実行

無関係なリリースボックスを繰り返さないように `rerun_group` を使用します。

| ハンドル            | 範囲                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | フルリリース検証の全ステージ。                                                                  |
| `ci`                | 手動フル CI 子のみ。                                                                            |
| `plugin-prerelease` | Plugin Prerelease 子のみ。                                                                      |
| `release-checks`    | OpenClaw Release Checks の全ステージ。                                                          |
| `install-smoke`     | リリースチェック経由の Install Smoke。                                                          |
| `cross-os`          | クロス OS リリースチェック。                                                                    |
| `live-e2e`          | リポジトリ/ライブ E2E と Docker リリースパス検証。                                               |
| `package`           | Package Acceptance。                                                                            |
| `qa`                | QA パリティと QA ライブレーン。                                                                 |
| `qa-parity`         | QA パリティレーンとレポートのみ。                                                               |
| `qa-live`           | QA ライブ Matrix/Telegram に加え、有効な場合はゲート付き Discord、WhatsApp、Slack レーン。       |
| `npm-telegram`      | 公開済みパッケージの Telegram E2E。`release_package_spec` または `npm_telegram_package_spec` が必要。 |
| `performance`       | 製品パフォーマンス証拠のみ。                                                                    |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は再利用可能なライブ/E2E ワークフローで定義されており、
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、
`live-codex-harness-docker` などがあります。

`live-gateway-advisory-docker` ハンドルは、その 3 つのプロバイダーシャード向けの集約再実行ハンドルであるため、
引き続きすべての助言的 Docker Gateway ジョブにファンアウトします。

1 つのクロス OS レーンが失敗した場合は、`rerun_group=cross-os` とともに `cross_os_suite_filter` を使用します。
このフィルターは、OS ID、スイート ID、または OS/スイートのペアを受け付けます。
たとえば `windows/packaged-upgrade`、`windows`、`packaged-fresh` です。クロス OS
サマリーには、パッケージ済みアップグレードレーンのフェーズごとの所要時間が含まれ、長時間実行される
コマンドは Heartbeat 行を出力するため、ジョブの
タイムアウト前に停止した更新を確認できます。

QA リリースチェックの失敗は、通常のリリース検証をブロックします。QA ランタイムツール
カバレッジチェック（標準ティアにおける `openclaw` と `codex` 間の動的ツールドリフト）も、
基盤となる QA ランタイムパリティレーンが助言的であってもリリースチェック検証をブロックします。
Tideclaw alpha 実行では、パッケージ安全性以外のリリースチェックレーンを引き続き
助言的として扱う場合があります。`live_suite_filter` が Discord、
WhatsApp、Slack などのゲート付き QA ライブレーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ
変数を有効にする必要があります。有効でない場合、入力キャプチャはレーンを黙ってスキップするのではなく失敗します。
新しい QA 証拠が必要な場合は、`rerun_group=qa`、
`qa-parity`、または `qa-live` を再実行します。

## 保持する証拠

リリースレベルのインデックスとして `Full Release Validation` サマリーを保持します。これは
子実行 ID にリンクし、最も遅いジョブの表を含みます。失敗時はまず子
ワークフローを確認し、その後、上記の最小の一致するハンドルを再実行します。

有用なアーティファクト:

- `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- Package Acceptance の `package-under-test` と Docker 受け入れアーティファクト
- 各 OS とスイートのクロス OS リリースチェックアーティファクト
- QA パリティ、ランタイムパリティ、Matrix、Telegram アーティファクト

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
