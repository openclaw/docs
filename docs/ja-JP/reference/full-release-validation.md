---
read_when:
    - 完全リリース検証の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全リリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-05T01:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリースの包括ワークフローです。これはプレリリース検証のための単一の手動
エントリポイントですが、ほとんどの作業は子ワークフローで行われるため、
失敗したボックスはリリース全体を再開せずに再実行できます。

信頼済みのワークフロー参照、通常は `main` から実行し、リリースブランチ、
タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローはハーネスに信頼済みのワークフロー参照を使用し、テスト対象の
候補には入力 `ref` を使用します。これにより、古いリリースブランチやタグを
検証するときでも、新しい検証ロジックを利用できます。

デフォルトでは、`release_profile=stable` はリリースをブロックするレーンを実行し、
網羅的なライブ/Docker ソークをスキップします。stable 実行にソークレーンを含めるには
`run_release_soak=true` を渡します。`release_profile=full` は常にソークレーンを有効にするため、
広範なアドバイザリプロファイルがカバレッジを黙って落とすことはありません。

Package Acceptance は通常、`pnpm ci:full-release` でディスパッチされた完全 SHA 実行を含め、
解決済みの `ref` から候補 tarball をビルドします。公開後は、
`package_acceptance_package_spec=openclaw@YYYY.M.D`（または
`openclaw@beta`/`openclaw@latest`）を渡すと、同じパッケージ/更新マトリックスを
代わりに出荷済みの npm パッケージに対して実行できます。

## トップレベルのステージ

| ステージ                | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決    | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**検証内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は包括ワークフローを再実行します。                                                                                                                                                                                                                               |
| Vitest と通常 CI | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**検証内容:** ターゲット参照に対する手動のフル CI グラフ。Linux Node レーン、同梱 Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n、および包括ワークフロー経由の Android を含みます。<br />**再実行:** `rerun_group=ci`。                                                  |
| Plugin プレリリース    | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**検証内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な拡張バッチシャード、および Plugin プレリリース Docker レーン。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                                                                                        |
| リリースチェック       | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**検証内容:** インストールスモーク、クロス OS パッケージチェック、Package Acceptance、QA Lab パリティ、ライブ Matrix、およびライブ Telegram。`run_release_soak=true` または `release_profile=full` の場合は、網羅的なライブ/E2E スイートと Docker リリースパスチャンクも実行します。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。 |
| パッケージアーティファクト     | **ジョブ:** `Prepare release package artifact`<br />**子ワークフロー:** なし<br />**検証内容:** `OpenClaw Release Checks` を待つ必要がないパッケージ向けチェックのために、親の `release-package-under-test` tarball を十分早く作成します。<br />**再実行:** 包括ワークフローを再実行するか、`rerun_group=npm-telegram` に `npm_telegram_package_spec` を指定します。                                                                                    |
| パッケージ Telegram     | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**検証内容:** `release_profile=full` を指定した `rerun_group=all` の場合は親アーティファクトを裏付けとする Telegram パッケージ検証、`npm_telegram_package_spec` が設定されている場合は公開済みパッケージの Telegram 検証。<br />**再実行:** `npm_telegram_package_spec` を指定した `rerun_group=npm-telegram`。                                                                               |
| 包括ワークフロー検証    | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**検証内容:** 記録された子実行の結論を再チェックし、子ワークフローの最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブだけを再実行します。                                                                                                                                                                                    |

`ref=main` かつ `rerun_group=all` の場合、新しい包括ワークフローが古いものを置き換えます。
親がキャンセルされると、そのモニターはすでにディスパッチした子ワークフローを
キャンセルします。リリースブランチおよびタグ検証の実行は、デフォルトでは互いを
キャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを
一度だけ解決し、パッケージまたは Docker 向けのステージで必要な場合に共有の
`release-package-under-test` アーティファクトを準備します。

| ステージ               | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリース対象      | **ジョブ:** `Resolve target ref`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択された ref、省略可能な期待 SHA、プロファイル、再実行グループ、対象を絞ったライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| パッケージアーティファクト    | **ジョブ:** `Prepare release package artifact`<br />**基盤ワークフロー:** なし<br />**テスト:** 候補 tarball を1つパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードする。<br />**再実行:** 影響を受けるパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                                                                                                                                              |
| インストールスモーク       | **ジョブ:** `Run install smoke`<br />**基盤ワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージ再利用、QR パッケージインストール、ルートおよび Gateway Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールの image-provider スモーク、高速なバンドル Plugin のインストール/アンインストール E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                 |
| クロス OS            | **ジョブ:** `cross_os_release_checks`<br />**基盤ワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使用し、選択されたプロバイダーとモードについて Linux、Windows、macOS 上の新規およびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                  |
| リポジトリとライブ E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI websocket ストリーミング、ネイティブライブプロバイダーおよび Plugin シャード、`release_profile` によって選択される Docker ベースのライブモデル/バックエンド/Gateway ハーネス。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または対象を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`、省略可能で `live_suite_filter` を指定。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または対象を絞った `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                      |
| パッケージ受け入れ  | **ジョブ:** `Run package acceptance`<br />**基盤ワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、モック OpenAI Telegram パッケージ受け入れ、同じ tarball に対する公開済みアップグレード生存チェック。ブロッキングリリースチェックではデフォルトの最新公開済みベースラインを使用し、ソークチェックでは `2026.4.23` 以降のすべての安定版 npm リリースと報告済み issue フィクスチャまで拡張する。<br />**再実行:** `rerun_group=package`。                          |
| QA パリティ           | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** 候補およびベースラインのエージェント的パリティパック、その後パリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA ライブ Matrix      | **ジョブ:** `Run QA Lab live Matrix lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA ライブ Telegram    | **ジョブ:** `Run QA Lab live Telegram lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使用するライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| リリース検証器    | **ジョブ:** `Verify release checks`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 対象を絞った子ジョブが成功した後に再実行。                                                                                                                                                                                                                                                                                                    |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合に次のチャンクを実行する:

| チャンク                                                           | カバレッジ                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパススモークレーン。                                   |
| `package-update-openai`                                         | OpenAI パッケージのインストールおよび更新動作。                             |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                          |
| `package-update-core`                                           | プロバイダー中立のパッケージおよび更新動作。                           |
| `plugins-runtime-plugins`                                       | Plugin 動作を実行する Plugin ランタイムレーン。                     |
| `plugins-runtime-services`                                      | サービスに支えられた Plugin ランタイムレーン。要求された場合は OpenWebUI を含む。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。   |

1つの Docker レーンだけが失敗した場合は、再利用可能なライブ/E2E ワークフローで対象を絞った `docker_lanes=<lane[,lane]>` を使用する。リリースアーティファクトには、利用可能な場合にパッケージアーティファクトとイメージ再利用入力を含む、レーンごとの再実行コマンドが含まれる。

## リリースプロファイル

`release_profile` は主にリリースチェック内のライブ/プロバイダーの幅を制御する。通常の完全 CI、Plugin プレリリース、インストールスモーク、パッケージ受け入れ、QA Lab は除外しない。`stable` では、網羅的なリポジトリ/ライブ E2E と Docker リリースパスチャンクはソークカバレッジであり、`run_release_soak=true` のときに実行される。`full` はソークカバレッジを強制的に有効にし、さらに `rerun_group=all` の場合、包括実行が親リリースパッケージアーティファクトに対してパッケージ Telegram E2E を実行するため、完全な公開前候補がその Telegram パッケージレーンを黙ってスキップしない。

| プロファイル   | 想定用途                      | 含まれるライブ/プロバイダーカバレッジ                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルなスモーク。   | OpenAI/コアライブパス、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。                     |
| `stable`  | デフォルトのリリース承認プロファイル。 | `minimum` に加えて Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、OpenCode Go スモークシャード。 |
| `full`    | 広範なアドバイザリースイープ。             | `stable` に加えてアドバイザリープロバイダー、Plugin ライブシャード、メディアライブシャード。                                                                                                        |

## full のみの追加項目

これらのスイートは `stable` ではスキップされ、`full` で含まれる:

| 領域                             | full のみのカバレッジ                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker ライブモデル               | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。                                                                          |
| Docker ライブ Gateway              | DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai シャードに分割されたアドバイザリープロバイダー。                              |
| ネイティブ Gateway プロバイダープロファイル | 完全な Anthropic Opus および Sonnet/Haiku シャード、Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード        | Plugins A-K、L-N、O-Z その他、Moonshot、xAI。                                                                             |
| ネイティブメディアライブシャード         | Audio、Google music、MiniMax music、video groups A-D。                                                                   |

`stable` には `native-live-src-gateway-profiles-anthropic-smoke` と `native-live-src-gateway-profiles-opencode-go-smoke` が含まれる。`full` は代わりに、より広範な Anthropic および OpenCode Go モデルシャードを使用する。対象を絞った再実行では、引き続き集約 `native-live-src-gateway-profiles-anthropic` または `native-live-src-gateway-profiles-opencode-go` ハンドルを使用できる。

## 対象を絞った再実行

無関係なリリースボックスの繰り返しを避けるには `rerun_group` を使用する:

| ハンドル              | スコープ                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | すべての完全リリース検証ステージ。                                   |
| `ci`                | 手動の完全 CI 子のみ。                                            |
| `plugin-prerelease` | Plugin プレリリース子のみ。                                         |
| `release-checks`    | すべての OpenClaw リリースチェックステージ。                                   |
| `install-smoke`     | リリースチェックまでのインストールスモーク。                                 |
| `cross-os`          | クロス OS リリースチェック。                                              |
| `live-e2e`          | リポジトリ/ライブ E2E と Docker リリースパス検証。                     |
| `package`           | パッケージ受け入れ。                                                   |
| `qa`                | QA パリティと QA ライブレーン。                                         |
| `qa-parity`         | QA パリティレーンとレポートのみ。                                      |
| `qa-live`           | QA ライブ Matrix と Telegram のみ。                                     |
| `npm-telegram`      | 公開済みパッケージの Telegram E2E。`npm_telegram_package_spec` が必要。 |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター id は、再利用可能なライブ/E2E ワークフローで定義されており、次のものが含まれます。
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、および
`live-codex-harness-docker`。

`live-gateway-advisory-docker` ハンドルは、3 つのプロバイダーシャードに対する集約再実行ハンドルであるため、引き続きすべてのアドバイザリ Docker Gateway ジョブへファンアウトします。

1 つのクロス OS レーンが失敗した場合は、`rerun_group=cross-os` とともに `cross_os_suite_filter` を使用します。フィルターは OS id、スイート id、または OS/スイートのペアを受け付けます。例: `windows/packaged-upgrade`、`windows`、`packaged-fresh`。クロス OS サマリーには、パッケージ化アップグレードレーンのフェーズごとの所要時間が含まれます。また、長時間実行されるコマンドは Heartbeat 行を出力するため、ジョブのタイムアウト前に Windows 更新の停止が見えるようになります。

QA リリースチェックレーンはアドバイザリです。QA のみの失敗は警告として報告され、リリースチェック検証器をブロックしません。新しい QA エビデンスが必要な場合は、`rerun_group=qa`、
`qa-parity`、または `qa-live` を再実行します。

## 保持するエビデンス

リリースレベルの索引として `Full Release Validation` サマリーを保持します。これは子実行 id にリンクし、最も遅いジョブの表を含みます。失敗時は、まず子ワークフローを確認してから、上記の最小の一致ハンドルを再実行します。

有用なアーティファクト:

- Full Release Validation 親および `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- パッケージ受け入れの `package-under-test` と Docker 受け入れアーティファクト
- 各 OS とスイートのクロス OS リリースチェックアーティファクト
- QA パリティ、Matrix、Telegram アーティファクト

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
