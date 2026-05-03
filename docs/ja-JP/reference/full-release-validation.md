---
read_when:
    - 完全リリース検証の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全リリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-03T21:38:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース全体を統括するワークフローです。これはプレリリース証明の単一の手動
エントリーポイントですが、作業の大半は子ワークフローで行われるため、
失敗したボックスはリリース全体を最初からやり直さずに再実行できます。

信頼されたワークフロー ref、通常は `main` から実行し、リリースブランチ、
タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローはハーネスに信頼されたワークフロー ref を使用し、テスト対象の
候補には入力の `ref` を使用します。これにより、古いリリースブランチやタグを
検証するときにも、新しい検証ロジックを利用できます。

Package Acceptance は通常、解決された `ref` から候補 tarball をビルドします。
これには `pnpm ci:full-release` でディスパッチされた完全 SHA 実行も含まれます。
公開後は、`package_acceptance_package_spec=openclaw@YYYY.M.D`（または
`openclaw@beta`/`openclaw@latest`）を渡して、同じパッケージ/更新マトリクスを
出荷済みの npm パッケージに対して実行します。

## トップレベルステージ

| ステージ                | 詳細                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決    | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は統括ワークフローを再実行します。                                                                                                                                                                              |
| Vitest と通常 CI | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** ターゲット ref に対する手動の完全 CI グラフ。Linux Node レーン、同梱 Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python skills、Windows、macOS、Control UI i18n、統括ワークフロー経由の Android を含みます。<br />**再実行:** `rerun_group=ci`。 |
| Plugin プレリリース    | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な拡張バッチシャード、Plugin プレリリース Docker レーン。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                                       |
| リリースチェック       | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、live/E2E スイート、Docker リリースパスチャンク、Package Acceptance、QA Lab parity、live Matrix、live Telegram。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。                                |
| パッケージアーティファクト     | **ジョブ:** `Prepare release package artifact`<br />**子ワークフロー:** なし<br />**証明内容:** `OpenClaw Release Checks` を待つ必要がないパッケージ向けチェックで使えるよう、親の `release-package-under-test` tarball を十分早く作成します。<br />**再実行:** 統括ワークフローを再実行するか、`rerun_group=npm-telegram` に `npm_telegram_package_spec` を指定します。                                   |
| パッケージ Telegram     | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `rerun_group=all` かつ `release_profile=full` の親アーティファクトに基づく Telegram パッケージ証明、または `npm_telegram_package_spec` が設定されている場合の公開済みパッケージ Telegram 証明。<br />**再実行:** `npm_telegram_package_spec` 付きの `rerun_group=npm-telegram`。                              |
| 統括検証    | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行して成功にした後、このジョブだけを再実行します。                                                                                                                                   |

`ref=main` かつ `rerun_group=all` の場合、新しい統括ワークフローは古いものを置き換えます。
親がキャンセルされると、そのモニターはすでにディスパッチした子ワークフローを
キャンセルします。リリースブランチとタグの検証実行は、デフォルトでは互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度解決し、
パッケージ向けまたは Docker 向けのステージが必要とするときに、共有の
`release-package-under-test` アーティファクトを準備します。

| ステージ               | 詳細                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット      | **ジョブ:** `Resolve target ref`<br />**バッキングワークフロー:** なし<br />**テスト:** 選択された ref、任意の期待 SHA、プロファイル、再実行グループ、フォーカスされた live スイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                           |
| パッケージアーティファクト    | **ジョブ:** `Prepare release package artifact`<br />**バッキングワークフロー:** なし<br />**テスト:** 1 つの候補 tarball をパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードします。<br />**再実行:** 影響を受けるパッケージ、クロス OS、または live/E2E グループ。                                                                                                           |
| インストールスモーク       | **ジョブ:** `Run install smoke`<br />**バッキングワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージ再利用、QR パッケージインストール、ルートと Gateway の Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールの画像プロバイダースモーク、高速な同梱 Plugin インストール/アンインストール E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                              |
| クロス OS            | **ジョブ:** `cross_os_release_checks`<br />**バッキングワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 選択されたプロバイダーとモードについて、候補 tarball とベースラインパッケージを使用する Linux、Windows、macOS の新規およびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。                                                                               |
| リポジトリと live E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**バッキングワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** `release_profile` によって選択される、リポジトリ E2E、live キャッシュ、OpenAI websocket ストリーミング、ネイティブ live プロバイダーと Plugin シャード、Docker ベースの live モデル/バックエンド/Gateway ハーネス。<br />**再実行:** `rerun_group=live-e2e`。任意で `live_suite_filter` を指定できます。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**バッキングワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                      |
| Package Acceptance  | **ジョブ:** `Run package acceptance`<br />**バッキングワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、モック OpenAI Telegram パッケージ受け入れ、`2026.4.23` 以降のすべての安定版 npm リリースから同じ tarball に対する公開済みアップグレード survivor チェック。<br />**再実行:** `rerun_group=package`。                                         |
| QA parity           | **ジョブ:** `Run QA Lab parity lane` と `Run QA Lab parity report`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** 候補とベースラインのエージェント型 parity パック、その後の parity レポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                       |
| QA live Matrix      | **ジョブ:** `Run QA Lab live Matrix lane`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境の高速 live Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                        |
| QA live Telegram    | **ジョブ:** `Run QA Lab live Telegram lane`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使った live Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                    |
| リリース検証    | **ジョブ:** `Verify release checks`<br />**バッキングワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要な release-check ジョブ。<br />**再実行:** フォーカスされた子ジョブが通過した後に再実行します。                                                                                                                                                                                                 |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空のときに
これらのチャンクを実行します。

| チャンク                                                           | カバレッジ                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker リリースパススモークレーン。                                   |
| `package-update-openai`                                         | OpenAI パッケージのインストールと更新の挙動。                             |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールと更新の挙動。                          |
| `package-update-core`                                           | プロバイダー中立のパッケージと更新の挙動。                           |
| `plugins-runtime-plugins`                                       | Plugin の挙動を実行する Plugin ランタイムレーン。                     |
| `plugins-runtime-services`                                      | サービスに裏付けられた Plugin ランタイムレーン。要求された場合は OpenWebUI を含みます。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証のために分割された Plugin インストール/ランタイムバッチ。   |

再利用可能な live/E2E ワークフローで、失敗した Docker レーンが 1 つだけの場合は、対象を絞った `docker_lanes=<lane[,lane]>` を使用します。リリースアーティファクトには、利用可能な場合にパッケージアーティファクトとイメージ再利用の入力を含む、レーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は主に、リリースチェック内の live/プロバイダーの範囲を制御します。通常の完全 CI、Plugin Prerelease、インストールスモーク、パッケージ受け入れ、QA Lab、または Docker リリースパスのチャンクは削除しません。`full` は、`rerun_group=all` の場合に、親リリースパッケージアーティファクトに対してアンブレラ実行でパッケージ Telegram E2E も実行するため、完全な公開前候補がその Telegram パッケージレーンを暗黙にスキップすることはありません。

| プロファイル | 想定用途 | 含まれる live/プロバイダーのカバレッジ |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルスモーク。 | OpenAI/core live パス、OpenAI 用 Docker live モデル、ネイティブ Gateway core、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI plugin、および Docker live gateway OpenAI。 |
| `stable`  | デフォルトのリリース承認プロファイル。 | `minimum` に加えて、Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブ live テストハーネス、Docker live CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、および OpenCode Go スモークシャード。 |
| `full`    | 広範なアドバイザリースイープ。 | `stable` に加えて、アドバイザリープロバイダー、plugin live シャード、およびメディア live シャード。 |

## full のみの追加項目

これらのスイートは `stable` ではスキップされ、`full` では含まれます。

| 領域 | full のみのカバレッジ |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live モデル | OpenCode Go、OpenRouter、xAI、Z.ai、および Fireworks。 |
| Docker live gateway | アドバイザリープロバイダーを DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai シャードに分割。 |
| ネイティブ Gateway プロバイダープロファイル | 完全な Anthropic Opus および Sonnet/Haiku シャード、Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、および Z.ai。 |
| ネイティブ plugin live シャード | Plugins A-K、L-N、O-Z その他、Moonshot、および xAI。 |
| ネイティブメディア live シャード | Audio、Google music、MiniMax music、および video groups A-D。 |

`stable` は `native-live-src-gateway-profiles-anthropic-smoke` と `native-live-src-gateway-profiles-opencode-go-smoke` を含みます。`full` は代わりに、より広範な Anthropic および OpenCode Go モデルシャードを使用します。対象を絞った再実行では、引き続き集約 `native-live-src-gateway-profiles-anthropic` または `native-live-src-gateway-profiles-opencode-go` ハンドルを使用できます。

## 対象を絞った再実行

関連しないリリースボックスの繰り返しを避けるには、`rerun_group` を使用します。

| ハンドル | スコープ |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | すべての完全リリース検証ステージ。 |
| `ci`                | 手動の完全 CI 子のみ。 |
| `plugin-prerelease` | Plugin Prerelease 子のみ。 |
| `release-checks`    | すべての OpenClaw リリースチェックのステージ。 |
| `install-smoke`     | リリースチェックを通した Install Smoke。 |
| `cross-os`          | クロス OS リリースチェック。 |
| `live-e2e`          | リポジトリ/live E2E および Docker リリースパス検証。 |
| `package`           | Package Acceptance。 |
| `qa`                | QA パリティと QA live レーン。 |
| `qa-parity`         | QA パリティレーンとレポートのみ。 |
| `qa-live`           | QA live Matrix と Telegram のみ。 |
| `npm-telegram`      | 公開済みパッケージ Telegram E2E。`npm_telegram_package_spec` が必要です。 |

1 つの live スイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。有効なフィルター ID は再利用可能な live/E2E ワークフローで定義されており、`docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker`、および `live-codex-harness-docker` が含まれます。

`live-gateway-advisory-docker` ハンドルは、その 3 つのプロバイダーシャード用の集約再実行ハンドルであるため、引き続きすべてのアドバイザリ Docker Gateway ジョブへ展開されます。

## 保持するエビデンス

`Full Release Validation` サマリーをリリースレベルのインデックスとして保持します。これは子実行 ID にリンクし、最も遅いジョブの表を含みます。失敗時は、まず子ワークフローを調査し、その後、上記の最小の一致するハンドルを再実行します。

有用なアーティファクト:

- Full Release Validation 親および `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- Package Acceptance の `package-under-test` および Docker 受け入れアーティファクト
- 各 OS とスイートの Cross-OS リリースチェックアーティファクト
- QA パリティ、Matrix、および Telegram アーティファクト

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
