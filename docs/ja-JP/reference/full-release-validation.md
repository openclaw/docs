---
read_when:
    - 完全リリース検証の実行または再実行
    - 安定版とフルリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全リリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-02T05:05:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリースの包括ワークフローです。プレリリース検証の単一の手動エントリポイントですが、ほとんどの作業は子ワークフローで行われるため、失敗したボックスはリリース全体を再開せずに再実行できます。

信頼されたワークフロー参照、通常は `main` から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローはハーネスに信頼されたワークフロー参照を使用し、テスト対象候補には入力 `ref` を使用します。これにより、古いリリースブランチやタグを検証するときにも新しい検証ロジックを利用できます。

## トップレベルのステージ

| ステージ             | 詳細                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決       | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は包括ワークフローを再実行します。                                                                                                                                           |
| Vitest と通常 CI     | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** Linux Node レーン、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Control UI i18n、包括ワークフロー経由の Android を含む、ターゲット参照に対する手動フル CI グラフ。<br />**再実行:** `rerun_group=ci`。 |
| Plugin プレリリース  | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な拡張機能バッチシャード、Plugin プレリリース Docker レーン。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                   |
| リリースチェック     | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、ライブ/E2E スイート、Docker リリースパスチャンク、Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。      |
| パッケージ Telegram  | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `rerun_group=all` かつ `release_profile=full` の場合はアーティファクトに基づく Telegram パッケージ検証、または `npm_telegram_package_spec` が設定されている場合は公開済みパッケージの Telegram 検証。<br />**再実行:** `npm_telegram_package_spec` 付きの `rerun_group=npm-telegram`。 |
| 包括検証             | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結論を再確認し、子ワークフローの最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブのみを再実行します。                                                                                                                              |

`ref=main` かつ `rerun_group=all` の場合、新しい包括ワークフローが古い包括ワークフローを置き換えます。親がキャンセルされると、そのモニターはすでにディスパッチ済みの子ワークフローをキャンセルします。リリースブランチとタグの検証実行は、デフォルトでは互いにキャンセルしません。

## リリースチェックステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度解決し、パッケージまたは Docker 向けステージで必要な場合に共有の `release-package-under-test` アーティファクトを準備します。

| ステージ            | 詳細                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット  | **ジョブ:** `Resolve target ref`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択された参照、任意の期待 SHA、プロファイル、再実行グループ、絞り込まれたライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                         |
| パッケージアーティファクト | **ジョブ:** `Prepare release package artifact`<br />**基盤ワークフロー:** なし<br />**テスト:** 1 つの候補 tarball をパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードします。<br />**再実行:** 影響を受けるパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                     |
| インストールスモーク | **ジョブ:** `Run install smoke`<br />**基盤ワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージ再利用、QR パッケージインストール、ルートと Gateway の Docker スモーク、インストーラー Docker テスト、Bun グローバルインストール image-provider スモーク、高速なバンドル Plugin インストール/アンインストール E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。 |
| クロス OS           | **ジョブ:** `cross_os_release_checks`<br />**基盤ワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使用した、選択されたプロバイダーとモードの Linux、Windows、macOS 上での新規およびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。                                                                       |
| リポジトリとライブ E2E | **ジョブ:** `Run repo/live E2E validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI websocket ストリーミング、ネイティブライブプロバイダーと Plugin シャード、`release_profile` によって選択される Docker ベースのライブモデル/バックエンド/Gateway ハーネス。<br />**再実行:** `rerun_group=live-e2e`、任意で `live_suite_filter`。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**基盤ワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                              |
| Package Acceptance  | **ジョブ:** `Run package acceptance`<br />**基盤ワークフロー:** `Package Acceptance`<br />**テスト:** 同じ tarball に対するオフライン Plugin パッケージフィクスチャ、Plugin 更新、mock-OpenAI Telegram パッケージ受け入れ。<br />**再実行:** `rerun_group=package`。                                                                                                                               |
| QA パリティ         | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** 候補とベースラインのエージェント型パリティパック、その後にパリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                      |
| QA ライブ Matrix    | **ジョブ:** `Run QA Lab live Matrix lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                  |
| QA ライブ Telegram  | **ジョブ:** `Run QA Lab live Telegram lane`<br />**基盤ワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使ったライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                         |
| リリース検証        | **ジョブ:** `Verify release checks`<br />**基盤ワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 絞り込まれた子ジョブが成功した後に再実行します。                                                                                                                                                                               |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合にこれらのチャンクを実行します。

| チャンク                                                        | カバレッジ                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパススモークレーン。                                |
| `package-update-openai`                                         | OpenAI パッケージのインストールと更新動作。                             |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールと更新動作。                          |
| `package-update-core`                                           | プロバイダー中立のパッケージと更新動作。                                |
| `plugins-runtime-plugins`                                       | Plugin の動作を実行する Plugin ランタイムレーン。                       |
| `plugins-runtime-services`                                      | サービスに支えられた Plugin ランタイムレーン。要求された場合は OpenWebUI を含みます。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。   |

1 つの Docker レーンだけが失敗した場合は、再利用可能なライブ/E2E ワークフローで対象を絞った `docker_lanes=<lane[,lane]>` を使用します。利用可能な場合、リリースアーティファクトには、パッケージアーティファクトとイメージ再利用入力付きのレーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は主にリリースチェック内のライブ/プロバイダーの幅を制御します。通常のフル CI、Plugin Prerelease、インストールスモーク、パッケージ受け入れ、QA Lab、Docker リリースパスチャンクは削除しません。`full` はさらに、`rerun_group=all` の場合に包括ワークフローがリリースパッケージアーティファクトに対してパッケージ Telegram E2E を実行するようにするため、公開前の完全な候補がその Telegram パッケージレーンを暗黙にスキップすることはありません。

| プロファイル | 想定用途 | 含まれるライブ/プロバイダーカバレッジ |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | リリース上重要なスモークの最速構成。 | OpenAI/コアのライブパス、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。 |
| `stable`  | デフォルトのリリース承認プロファイル。 | `minimum` に加えて Anthropic、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、OpenCode Go スモークシャード。 |
| `full`    | 広範なアドバイザリースイープ。 | `stable` に加えてアドバイザリープロバイダー、Plugin ライブシャード、メディアライブシャード。 |

## full のみの追加項目

これらのスイートは `stable` ではスキップされ、`full` に含まれます。

| 領域 | full のみのカバレッジ |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker ライブモデル | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。 |
| Docker ライブ Gateway | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI、Z.ai のアドバイザリーシャード。 |
| ネイティブ Gateway プロバイダープロファイル | Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード | Plugins A-K、L-N、O-Z その他、Moonshot、xAI。 |
| ネイティブメディアライブシャード | Audio、Google music、MiniMax music、video groups A-D。 |

`stable` には `native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full`
では代わりに、より広範な OpenCode Go モデルシャードを使用します。

## 対象を絞った再実行

無関係なリリースボックスの繰り返しを避けるには `rerun_group` を使用します。

| ハンドル | スコープ |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | すべての Full Release Validation ステージ。 |
| `ci`                | 手動の full CI 子のみ。 |
| `plugin-prerelease` | Plugin Prerelease 子のみ。 |
| `release-checks`    | すべての OpenClaw Release Checks ステージ。 |
| `install-smoke`     | Install Smoke からリリースチェックまで。 |
| `cross-os`          | クロス OS リリースチェック。 |
| `live-e2e`          | リポジトリ/ライブ E2E と Docker リリースパス検証。 |
| `package`           | Package Acceptance。 |
| `qa`                | QA パリティと QA ライブレーン。 |
| `qa-parity`         | QA パリティレーンとレポートのみ。 |
| `qa-live`           | QA ライブ Matrix と Telegram のみ。 |
| `npm-telegram`      | 公開済みパッケージの Telegram E2E。`npm_telegram_package_spec` が必要です。 |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は再利用可能なライブ/E2E ワークフローで定義されており、
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、および
`live-codex-harness-docker` が含まれます。

## 保持するエビデンス

リリースレベルのインデックスとして `Full Release Validation` の概要を保持します。これは
子実行 ID にリンクし、最も遅いジョブのテーブルを含みます。失敗時は、まず子
ワークフローを調査し、その後で上記の最小の一致するハンドルを再実行します。

有用なアーティファクト:

- `OpenClaw Release Checks` の `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- Package Acceptance の `package-under-test` と Docker 受け入れアーティファクト
- 各 OS とスイートの Cross-OS リリースチェックアーティファクト
- QA パリティ、Matrix、Telegram アーティファクト

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
