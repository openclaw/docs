---
read_when:
    - フルリリース検証の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: フルリリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-11T20:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース検証の包括ワークフローです。これはプレリリース証明の単一の手動
エントリポイントですが、ほとんどの作業は子ワークフローで行われるため、
失敗したボックスはリリース全体を再開せずに再実行できます。

信頼できるワークフロー ref、通常は `main` から実行し、リリースブランチ、
タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローはハーネスに信頼できるワークフロー ref を使用し、テスト対象の
候補には入力 `ref` を使用します。これにより、古いリリースブランチやタグを
検証するときでも、新しい検証ロジックを利用できます。

デフォルトでは、`release_profile=stable` はリリースをブロックするレーンを実行し、
網羅的な live/Docker ソークをスキップします。stable 実行にソークレーンを含めるには
`run_release_soak=true` を渡します。`release_profile=full` は常にソークレーンを有効にするため、
広範なアドバイザリプロファイルでカバレッジが暗黙に落ちることはありません。

Package Acceptance は通常、完全 SHA 実行が `pnpm ci:full-release` でディスパッチされた場合も含め、
解決済みの `ref` から候補 tarball をビルドします。beta 公開後は、
`release_package_spec=openclaw@YYYY.M.D-beta.N` を渡して、出荷済みの npm パッケージを
リリースチェック、Package Acceptance、cross-OS、release-path Docker、package Telegram
全体で再利用します。Package Acceptance で意図的に別のパッケージを証明する必要がある場合のみ、
`package_acceptance_package_spec` を使用します。

## トップレベルステージ

| ステージ                | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決    | **Job:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は包括ワークフローを再実行します。                                                                                                                                                                                                                               |
| Vitest と通常 CI | **Job:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** ターゲット ref に対する手動の完全 CI グラフ。Linux Node レーン、バンドルされたPluginシャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n、包括ワークフロー経由の Android を含みます。<br />**再実行:** `rerun_group=ci`。                                                  |
| Pluginプレリリース    | **Job:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用のPlugin静的チェック、エージェント型Pluginカバレッジ、完全な拡張バッチシャード、Pluginプレリリース Docker レーン、互換性トリアージ用の非ブロッキング `plugin-inspector-advisory` アーティファクト。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                          |
| リリースチェック       | **Job:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、cross-OS パッケージチェック、Package Acceptance、QA Lab パリティ、live Matrix、live Telegram。`run_release_soak=true` または `release_profile=full` の場合は、網羅的な live/E2E スイートと Docker release-path チャンクも実行します。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。 |
| パッケージアーティファクト     | **Job:** `Prepare release package artifact`<br />**子ワークフロー:** なし<br />**証明内容:** `OpenClaw Release Checks` を待つ必要がないパッケージ向けチェックに十分間に合うよう、親 `release-package-under-test` tarball を作成します。<br />**再実行:** 包括ワークフローを再実行するか、公開済みパッケージの再実行用に `release_package_spec` を指定します。                                                                                           |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `rerun_group=all` かつ `release_profile=full` の場合は親アーティファクトに基づく Telegram パッケージ証明、または `release_package_spec` もしくは `npm_telegram_package_spec` が設定されている場合は公開済みパッケージの Telegram 証明。<br />**再実行:** `release_package_spec` または `npm_telegram_package_spec` を指定して `rerun_group=npm-telegram`。                           |
| 包括検証    | **Job:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行して green にした後、このジョブのみを再実行します。                                                                                                                                                                                    |

`ref=main` かつ `rerun_group=all` の場合、新しい包括ワークフローが古いものに優先します。
親がキャンセルされると、そのモニターはすでにディスパッチした子ワークフローをキャンセルします。
リリースブランチとタグの検証実行は、デフォルトでは互いをキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを
一度だけ解決し、パッケージ向けまたは Docker 向けのステージで必要な場合に
共有 `release-package-under-test` アーティファクトを準備します。

| ステージ               | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット      | **ジョブ:** `Resolve target ref`<br />**バッキングワークフロー:** なし<br />**テスト:** 選択された ref、任意の期待 SHA、プロファイル、再実行グループ、フォーカスされたライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| パッケージ成果物    | **ジョブ:** `Prepare release package artifact`<br />**バッキングワークフロー:** なし<br />**テスト:** 1 つの候補 tarball をパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードする。<br />**再実行:** 影響を受けたパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                                                                                                                                              |
| インストールスモーク       | **ジョブ:** `Run install smoke`<br />**バッキングワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージの再利用、QR パッケージインストール、ルートおよび Gateway Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールのイメージプロバイダースモーク、高速なバンドル Plugin のインストール/アンインストール E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                 |
| クロス OS            | **ジョブ:** `cross_os_release_checks`<br />**バッキングワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使用した、選択されたプロバイダーとモードの Linux、Windows、macOS 上の新規およびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                  |
| リポジトリおよびライブ E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**バッキングワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI websocket ストリーミング、ネイティブライブプロバイダーおよび Plugin シャード、ならびに `release_profile` により選択される Docker ベースのライブモデル/バックエンド/Gateway ハーネス。<br />**実行:** `run_release_soak=true`、`release_profile=full`、またはフォーカスされた `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`、任意で `live_suite_filter` を指定。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**バッキングワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージ成果物に対するリリースパス Docker チャンク。<br />**実行:** `run_release_soak=true`、`release_profile=full`、またはフォーカスされた `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                      |
| パッケージ受け入れ  | **ジョブ:** `Run package acceptance`<br />**バッキングワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、モック OpenAI Telegram パッケージ受け入れ、同じ tarball に対する公開済みアップグレード生存チェック。ブロッキングリリースチェックは既定の最新公開済みベースラインを使用する。ソークチェックは `2026.4.23` 以降のすべての安定版 npm リリースと、報告済み issue のフィクスチャまで拡張される。<br />**再実行:** `rerun_group=package`。                          |
| QA パリティ           | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** 候補およびベースラインのエージェント型パリティパック、その後パリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA ライブ Matrix      | **ジョブ:** `Run QA Lab live Matrix lane`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA ライブ Telegram    | **ジョブ:** `Run QA Lab live Telegram lane`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使ったライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| リリース検証          | **ジョブ:** `Verify release checks`<br />**バッキングワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** フォーカスされた子ジョブが通過した後に再実行。                                                                                                                                                                                                                                                                                                    |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空のときに次のチャンクを実行する:

| チャンク                                                           | カバレッジ                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパススモークレーン。                                                             |
| `package-update-openai`                                         | OpenAI パッケージのインストール/更新動作、Codex のオンデマンドインストール、Chat Completions ツール呼び出し。 |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                                                    |
| `package-update-core`                                           | プロバイダー非依存のパッケージおよび更新動作。                                                     |
| `plugins-runtime-plugins`                                       | Plugin の動作を実行する Plugin ランタイムレーン。                                               |
| `plugins-runtime-services`                                      | サービスバックおよびライブ Plugin ランタイムレーン。要求された場合は OpenWebUI を含む。                  |
| `plugins-runtime-install-a` から `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。                             |

1 つの Docker レーンだけが失敗した場合は、再利用可能なライブ/E2E ワークフローで対象を絞った `docker_lanes=<lane[,lane]>` を使用する。リリース成果物には、利用可能な場合、パッケージ成果物およびイメージ再利用入力付きのレーンごとの再実行コマンドが含まれる。

## リリースプロファイル

`release_profile` は主に、リリースチェック内のライブ/プロバイダーの広さを制御する。
通常のフル CI、Plugin プレリリース、インストールスモーク、パッケージ受け入れ、QA Lab は削除しない。`stable` では、網羅的なリポジトリ/ライブ E2E と Docker リリースパスチャンクはソークカバレッジであり、`run_release_soak=true` のときに実行される。
`full` はソークカバレッジを強制的に有効にし、さらに `rerun_group=all` のときにアンブレラ実行で親リリースパッケージ成果物に対してパッケージ Telegram E2E を実行するため、完全な公開前候補がその Telegram パッケージレーンを暗黙にスキップしない。

| プロファイル   | 想定用途                      | 含まれるライブ/プロバイダーのカバレッジ                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルなスモーク。   | OpenAI/コアライブパス、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。                     |
| `stable`  | 既定のリリース承認プロファイル。 | `minimum` に加え、Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、OpenCode Go スモークシャード。 |
| `full`    | 広範なアドバイザリスイープ。             | `stable` に加え、アドバイザリプロバイダー、Plugin ライブシャード、メディアライブシャード。                                                                                                        |

## full のみの追加

これらのスイートは `stable` ではスキップされ、`full` では含まれる:

| 領域                             | full のみのカバレッジ                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker ライブモデル               | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。                                                                          |
| Docker ライブ Gateway              | DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai シャードに分割されたアドバイザリプロバイダー。                              |
| ネイティブ Gateway プロバイダープロファイル | 完全な Anthropic Opus および Sonnet/Haiku シャード、Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード        | Plugins A-K、L-N、O-Z other、Moonshot、xAI。                                                                             |
| ネイティブメディアライブシャード         | Audio、Google music、MiniMax music、video groups A-D。                                                                   |

`stable` には `native-live-src-gateway-profiles-anthropic-smoke` と
`native-live-src-gateway-profiles-opencode-go-smoke` が含まれる。`full` は代わりに、より広範な Anthropic および OpenCode Go モデルシャードを使用する。フォーカスされた再実行では、引き続き集約ハンドル `native-live-src-gateway-profiles-anthropic` または
`native-live-src-gateway-profiles-opencode-go` を使用できる。

## フォーカスされた再実行

関連しないリリースボックスの繰り返しを避けるには、`rerun_group` を使用する:

| ハンドル            | スコープ                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | すべての完全リリース検証ステージ。                                                              |
| `ci`                | 手動の完全 CI 子ワークフローのみ。                                                              |
| `plugin-prerelease` | Plugin プレリリース子ワークフローのみ。                                                         |
| `release-checks`    | すべての OpenClaw リリースチェックステージ。                                                     |
| `install-smoke`     | インストールスモークからリリースチェックまで。                                                   |
| `cross-os`          | クロス OS リリースチェック。                                                                     |
| `live-e2e`          | リポジトリ/ライブ E2E と Docker リリースパス検証。                                               |
| `package`           | パッケージ受け入れ。                                                                             |
| `qa`                | QA パリティと QA ライブレーン。                                                                  |
| `qa-parity`         | QA パリティレーンとレポートのみ。                                                                |
| `qa-live`           | QA ライブ Matrix と Telegram のみ。                                                              |
| `npm-telegram`      | 公開済みパッケージの Telegram E2E。`release_package_spec` または `npm_telegram_package_spec` が必要。 |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は再利用可能なライブ/E2E ワークフローで定義されており、
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、および
`live-codex-harness-docker` が含まれます。

`live-gateway-advisory-docker` ハンドルは、その 3 つのプロバイダーシャード用の集約再実行ハンドルであるため、
引き続きすべてのアドバイザリ Docker Gateway ジョブにファンアウトします。

1 つのクロス OS レーンが失敗した場合は、`rerun_group=cross-os` とともに `cross_os_suite_filter` を使用します。フィルターは OS ID、スイート ID、または OS/スイートのペアを受け付けます。たとえば `windows/packaged-upgrade`、`windows`、または `packaged-fresh` です。クロス OS
サマリーにはパッケージ化アップグレードレーンのフェーズごとのタイミングが含まれ、長時間実行される
コマンドは Heartbeat 行を出力するため、ジョブのタイムアウト前に停止した Windows アップデートを確認できます。

QA リリースチェックレーンはアドバイザリです。QA のみの失敗は警告として報告され、
リリースチェック検証をブロックしません。新しい QA 証拠が必要な場合は `rerun_group=qa`、
`qa-parity`、または `qa-live` を再実行してください。

## 保持する証拠

リリースレベルのインデックスとして `Full Release Validation` サマリーを保持します。これは
子実行 ID にリンクし、最も遅いジョブの表を含みます。失敗時は、まず子
ワークフローを確認してから、上記の最小一致ハンドルを再実行します。

有用なアーティファクト:

- 完全リリース検証親ワークフローおよび `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- パッケージ受け入れ `package-under-test` と Docker 受け入れアーティファクト
- 各 OS とスイートのクロス OS リリースチェックアーティファクト
- QA パリティ、Matrix、および Telegram アーティファクト

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
