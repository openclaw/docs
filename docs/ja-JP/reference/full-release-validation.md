---
read_when:
    - 完全リリース検証の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全リリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-02T21:05:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリースの包括ワークフローです。これはリリース前の証明に使う単一の手動エントリーポイントですが、ほとんどの作業は子ワークフローで行われるため、失敗したボックスはリリース全体を最初からやり直さずに再実行できます。

信頼済みのワークフロー ref、通常は `main` から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローはハーネスには信頼済みのワークフロー ref を使い、テスト対象の候補には入力 `ref` を使います。これにより、古いリリースブランチやタグを検証するときでも、新しい検証ロジックを利用できます。

Package Acceptance は通常、解決済みの `ref` から候補 tarball をビルドします。これには `pnpm ci:full-release` でディスパッチされた完全 SHA 実行も含まれます。公開後は、代わりに `package_acceptance_package_spec=openclaw@YYYY.M.D`（または `openclaw@beta`/`openclaw@latest`）を渡して、同じパッケージ/更新マトリクスを出荷済み npm パッケージに対して実行します。

## トップレベルステージ

| ステージ | 詳細 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決 | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は包括ワークフローを再実行します。 |
| Vitest と通常 CI | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** ターゲット ref に対する手動の完全 CI グラフ。Linux Node レーン、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n、および包括ワークフロー経由の Android を含みます。<br />**再実行:** `rerun_group=ci`。 |
| Plugin プレリリース | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な拡張バッチシャード、および Plugin プレリリース Docker レーン。<br />**再実行:** `rerun_group=plugin-prerelease`。 |
| リリースチェック | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、ライブ/E2E スイート、Docker リリースパスチャンク、Package Acceptance、QA Lab パリティ、ライブ Matrix、およびライブ Telegram。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。 |
| パッケージ Telegram | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `rerun_group=all` かつ `release_profile=full` の場合のアーティファクト裏付けの Telegram パッケージ証明、または `npm_telegram_package_spec` が設定されている場合の公開済みパッケージ Telegram 証明。<br />**再実行:** `npm_telegram_package_spec` を指定して `rerun_group=npm-telegram`。 |
| 包括検証 | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録済みの子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブのみを再実行します。 |

`ref=main` かつ `rerun_group=all` の場合、新しい包括ワークフローが古い包括ワークフローを置き換えます。親がキャンセルされると、そのモニターはすでにディスパッチ済みの子ワークフローをキャンセルします。リリースブランチとタグの検証実行は、デフォルトでは互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度だけ解決し、パッケージまたは Docker 向けステージで必要な場合に共有の `release-package-under-test` アーティファクトを準備します。

| ステージ | 詳細 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット | **ジョブ:** `Resolve target ref`<br />**裏側のワークフロー:** なし<br />**テスト:** 選択された ref、省略可能な想定 SHA、プロファイル、再実行グループ、および絞り込まれたライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。 |
| パッケージアーティファクト | **ジョブ:** `Prepare release package artifact`<br />**裏側のワークフロー:** なし<br />**テスト:** 1 つの候補 tarball をパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードします。<br />**再実行:** 影響を受けるパッケージ、クロス OS、またはライブ/E2E グループ。 |
| インストールスモーク | **ジョブ:** `Run install smoke`<br />**裏側のワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージ再利用を伴う完全なインストールパス、QR パッケージインストール、ルートおよび Gateway Docker スモーク、インストーラー Docker テスト、Bun グローバルインストール image-provider スモーク、高速なバンドル Plugin インストール/アンインストール E2E。<br />**再実行:** `rerun_group=install-smoke`。 |
| クロス OS | **ジョブ:** `cross_os_release_checks`<br />**裏側のワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 選択されたプロバイダーとモードについて、候補 tarball とベースラインパッケージを使った Linux、Windows、macOS 上の新規およびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。 |
| リポジトリとライブ E2E | **ジョブ:** `Run repo/live E2E validation`<br />**裏側のワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI websocket ストリーミング、ネイティブライブプロバイダーおよび Plugin シャード、ならびに `release_profile` で選択された Docker 裏付けのライブモデル/バックエンド/Gateway ハーネス。<br />**再実行:** `live_suite_filter` を任意で指定して `rerun_group=live-e2e`。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**裏側のワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**再実行:** `rerun_group=live-e2e`。 |
| Package Acceptance | **ジョブ:** `Run package acceptance`<br />**裏側のワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、mock-OpenAI Telegram パッケージ受け入れ、および `2026.4.23` 以降のすべての安定版 npm リリースから同じ tarball に対する公開済みアップグレード生存チェック。<br />**再実行:** `rerun_group=package`。 |
| QA パリティ | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**裏側のワークフロー:** 直接ジョブ<br />**テスト:** 候補とベースラインのエージェント型パリティパック、その後のパリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。 |
| QA ライブ Matrix | **ジョブ:** `Run QA Lab live Matrix lane`<br />**裏側のワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。 |
| QA ライブ Telegram | **ジョブ:** `Run QA Lab live Telegram lane`<br />**裏側のワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使ったライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。 |
| リリース検証 | **ジョブ:** `Verify release checks`<br />**裏側のワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 絞り込まれた子ジョブが合格した後に再実行します。 |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合にこれらのチャンクを実行します。

| チャンク | カバレッジ |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core` | Core Docker リリースパススモークレーン。 |
| `package-update-openai` | OpenAI パッケージのインストールおよび更新動作。 |
| `package-update-anthropic` | Anthropic パッケージのインストールおよび更新動作。 |
| `package-update-core` | プロバイダー中立のパッケージおよび更新動作。 |
| `plugins-runtime-plugins` | Plugin の動作を実行する Plugin ランタイムレーン。 |
| `plugins-runtime-services` | サービス裏付けの Plugin ランタイムレーン。要求された場合は OpenWebUI を含みます。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。 |

1 つの Docker レーンだけが失敗した場合は、再利用可能なライブ/E2E ワークフローで対象を絞った `docker_lanes=<lane[,lane]>` を使います。リリースアーティファクトには、利用可能な場合、パッケージアーティファクトとイメージ再利用入力を含むレーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は主に、リリースチェック内のライブ/プロバイダー範囲を制御します。
通常のフル CI、Plugin Prerelease、インストールスモーク、パッケージ
受け入れ、QA Lab、または Docker リリースパスのチャンクは除外しません。`full` ではさらに、
`rerun_group=all` の場合に、アンブレラ実行がリリースパッケージ成果物に対してパッケージ Telegram E2E を実行するため、
完全な公開前候補がその Telegram パッケージレーンを気づかないうちにスキップすることはありません。

| プロファイル | 想定用途                          | 含まれるライブ/プロバイダーカバレッジ                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルなスモーク。 | OpenAI/コアライブパス、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、および Docker ライブ Gateway OpenAI。               |
| `stable`  | 既定のリリース承認プロファイル。       | `minimum` に加えて、Anthropic、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、および OpenCode Go スモークシャード。 |
| `full`    | 広範なアドバイザリスイープ。          | `stable` に加えて、アドバイザリプロバイダー、Plugin ライブシャード、およびメディアライブシャード。                                                                                                  |

## full 専用の追加項目

これらのスイートは `stable` ではスキップされ、`full` で含まれます。

| 領域                             | full 専用のカバレッジ                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker ライブモデル               | OpenCode Go、OpenRouter、xAI、Z.ai、および Fireworks。                              |
| Docker ライブ Gateway              | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI、および Z.ai のアドバイザリシャード。 |
| ネイティブ Gateway プロバイダープロファイル | Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、および Z.ai。  |
| ネイティブ Plugin ライブシャード        | Plugins A-K、L-N、O-Z その他、Moonshot、および xAI。                                 |
| ネイティブメディアライブシャード         | Audio、Google music、MiniMax music、および video groups A-D。                       |

`stable` には `native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full` は
代わりに、より広範な OpenCode Go モデルシャードを使用します。

## フォーカスした再実行

関係のないリリースボックスの繰り返しを避けるには、`rerun_group` を使用します。

| ハンドル              | スコープ                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | すべての Full Release Validation ステージ。                                   |
| `ci`                | 手動フル CI 子のみ。                                            |
| `plugin-prerelease` | Plugin Prerelease 子のみ。                                         |
| `release-checks`    | すべての OpenClaw Release Checks ステージ。                                   |
| `install-smoke`     | リリースチェックを通じた Install Smoke。                                 |
| `cross-os`          | Cross-OS リリースチェック。                                              |
| `live-e2e`          | リポジトリ/ライブ E2E と Docker リリースパス検証。                     |
| `package`           | Package Acceptance。                                                   |
| `qa`                | QA パリティに加えて QA ライブレーン。                                         |
| `qa-parity`         | QA パリティレーンとレポートのみ。                                      |
| `qa-live`           | QA ライブ Matrix と Telegram のみ。                                     |
| `npm-telegram`      | 公開済みパッケージ Telegram E2E。`npm_telegram_package_spec` が必要です。 |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は再利用可能なライブ/E2E ワークフローで定義されており、次のものが含まれます。
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、および
`live-codex-harness-docker`。

## 保持する証拠

`Full Release Validation` のサマリーをリリースレベルのインデックスとして保持します。これは
子実行 ID にリンクし、最も遅いジョブの表を含みます。失敗時は、まず子
ワークフローを調べ、その後、上記の最小の一致するハンドルを再実行します。

有用な成果物:

- `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパス成果物
- Package Acceptance の `package-under-test` と Docker 受け入れ成果物
- 各 OS とスイートの Cross-OS リリースチェック成果物
- QA パリティ、Matrix、および Telegram の成果物

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
