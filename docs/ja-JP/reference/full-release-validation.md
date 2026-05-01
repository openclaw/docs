---
read_when:
    - 完全リリース検証の実行または再実行
    - stable と full のリリース検証プロファイルの比較
    - リリース検証ステージの失敗をデバッグする
summary: 完全なリリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-01T05:03:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリースの包括ワークフローです。プレリリースの検証のための単一の手動エントリーポイントですが、ほとんどの処理は子ワークフローで行われるため、失敗したボックスはリリース全体を最初からやり直さずに再実行できます。

通常は `main` のような信頼できるワークフロー ref から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローは、ハーネスには信頼できるワークフロー ref を使用し、テスト対象の候補には入力 `ref` を使用します。これにより、古いリリースブランチやタグを検証する場合でも、新しい検証ロジックを利用できます。

## トップレベルステージ

| ステージ                 | 詳細                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決     | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は包括ワークフローを再実行します。                                                                                                                                                                              |
| Vitest と通常 CI  | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** Linux Node レーン、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n、包括ワークフロー経由の Android を含む、ターゲット ref に対する手動のフル CI グラフ。<br />**再実行:** `rerun_group=ci`。 |
| Plugin プレリリース     | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な拡張バッチシャード、Plugin プレリリース Docker レーン。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                                       |
| リリースチェック        | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、live/E2E スイート、Docker リリースパスチャンク、Package Acceptance、QA Lab パリティ、live Matrix、live Telegram。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。                                |
| 公開後 Telegram | **ジョブ:** `Run post-publish Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `npm_telegram_package_spec` が設定されている場合の、任意の公開済みパッケージ Telegram 検証。<br />**再実行:** `rerun_group=npm-telegram`。                                                                                                                                                     |
| 包括ワークフロー検証     | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブのみを再実行します。                                                                                                                                   |

`ref=main` かつ `rerun_group=all` の場合、新しい包括ワークフローが古いものを置き換えます。親がキャンセルされると、そのモニターはすでにディスパッチした子ワークフローをすべてキャンセルします。リリースブランチとタグの検証実行は、デフォルトでは互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度解決し、パッケージまたは Docker 向けステージで必要な場合に共有の `release-package-under-test` アーティファクトを準備します。

| ステージ               | 詳細                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット      | **ジョブ:** `Resolve target ref`<br />**バッキングワークフロー:** なし<br />**テスト:** 選択された ref、任意の期待 SHA、プロファイル、再実行グループ、絞り込まれた live スイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                           |
| パッケージアーティファクト    | **ジョブ:** `Prepare release package artifact`<br />**バッキングワークフロー:** なし<br />**テスト:** 候補 tarball を 1 つパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードします。<br />**再実行:** 影響を受けるパッケージ、クロス OS、または live/E2E グループ。                                                                                                           |
| インストールスモーク       | **ジョブ:** `Run install smoke`<br />**バッキングワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージ再利用、QR パッケージインストール、ルートと Gateway の Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールの image-provider スモーク、高速なバンドル済み Plugin Docker E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                         |
| クロス OS            | **ジョブ:** `cross_os_release_checks`<br />**バッキングワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 選択されたプロバイダーとモードについて、候補 tarball とベースラインパッケージを使用した Linux、Windows、macOS 上の新規インストールおよびアップグレードレーン。<br />**再実行:** `rerun_group=cross-os`。                                                                               |
| リポジトリと live E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**バッキングワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、live キャッシュ、OpenAI websocket ストリーミング、ネイティブ live プロバイダーと Plugin シャード、`release_profile` によって選択される Docker ベースの live モデル/バックエンド/Gateway ハーネス。<br />**再実行:** `rerun_group=live-e2e`、任意で `live_suite_filter` を指定。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**バッキングワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                      |
| Package Acceptance  | **ジョブ:** `Run package acceptance`<br />**バッキングワークフロー:** `Package Acceptance`<br />**テスト:** アーティファクトネイティブのバンドル済みチャネル依存関係互換性、オフライン Plugin パッケージフィクスチャ、同じ tarball に対する mock-OpenAI Telegram パッケージ受け入れ。<br />**再実行:** `rerun_group=package`。                                                                                       |
| QA パリティ           | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** 候補とベースラインのエージェント型パリティパック、その後のパリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                       |
| QA live Matrix      | **ジョブ:** `Run QA Lab live Matrix lane`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速 live Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                        |
| QA live Telegram    | **ジョブ:** `Run QA Lab live Telegram lane`<br />**バッキングワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使った live Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                    |
| リリース検証    | **ジョブ:** `Verify release checks`<br />**バッキングワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 絞り込まれた子ジョブが通過した後に再実行します。                                                                                                                                                                                                 |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合にこれらのチャンクを実行します。

| チャンク                                                                                       | カバレッジ                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Core Docker リリースパスのスモークレーン。                                   |
| `package-update-openai`                                                                     | OpenAI パッケージのインストールと更新動作。                             |
| `package-update-anthropic`                                                                  | Anthropic パッケージのインストールと更新動作。                          |
| `package-update-core`                                                                       | プロバイダー中立のパッケージと更新動作。                           |
| `plugins-runtime-plugins`                                                                   | Plugin 動作を実行する Plugin ランタイムレーン。                     |
| `plugins-runtime-services`                                                                  | サービスベースの Plugin ランタイムレーン。要求された場合は OpenWebUI を含みます。 |
| `plugins-runtime-install-a` から `plugins-runtime-install-h`                             | 並列リリース検証のために分割された Plugin インストール/ランタイムバッチ。   |
| `bundled-channels-core`                                                                     | バンドル済みチャネルの Docker 動作。                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | バンドル済みチャネルの更新動作。                                        |
| `bundled-channels-contracts`                                                                | Docker リリースパス内のバンドル済みチャネル契約チェック。             |

再利用可能なライブ/E2E ワークフローで、失敗した Docker レーンが 1 つだけの場合は、対象を絞った `docker_lanes=<lane[,lane]>` を使用します。リリース成果物には、利用可能な場合、パッケージ成果物とイメージ再利用入力を含むレーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は、リリースチェック内のライブ/プロバイダーの範囲のみを制御します。通常のフル CI、Plugin Prerelease、インストールスモーク、パッケージ受け入れ、QA Lab、または Docker リリースパスのチャンクは削除しません。

| プロファイル | 想定用途 | 含まれるライブ/プロバイダーのカバレッジ |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルなスモーク。 | OpenAI/コアのライブパス、OpenAI 向け Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI plugin、および Docker ライブ Gateway OpenAI。 |
| `stable` | デフォルトのリリース承認プロファイル。 | `minimum` に加えて、Anthropic、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP バインド、Docker Codex ハーネス、および OpenCode Go スモークシャード。 |
| `full` | 広範な助言的スイープ。 | `stable` に加えて、助言的プロバイダー、plugin ライブシャード、およびメディアライブシャード。 |

## `full` のみの追加項目

これらのスイートは `stable` ではスキップされ、`full` に含まれます。

| 領域 | `full` のみのカバレッジ |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker ライブモデル | OpenCode Go、OpenRouter、xAI、Z.ai、および Fireworks。 |
| Docker ライブ Gateway | DeepSeek、Fireworks、OpenCode Go、OpenRouter、xAI、および Z.ai の助言的シャード。 |
| ネイティブ Gateway プロバイダープロファイル | Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、および Z.ai。 |
| ネイティブ plugin ライブシャード | Plugins A-K、L-N、O-Z other、Moonshot、および xAI。 |
| ネイティブメディアライブシャード | Audio、Google music、MiniMax music、および video groups A-D。 |

`stable` には `native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full` は代わりに、より広範な OpenCode Go モデルシャードを使用します。

## 対象を絞った再実行

関連しないリリースボックスの繰り返しを避けるには、`rerun_group` を使用します。

| ハンドル | 範囲 |
| ------------------- | ------------------------------------------------- |
| `all` | すべての Full Release Validation ステージ。 |
| `ci` | 手動フル CI 子のみ。 |
| `plugin-prerelease` | Plugin Prerelease 子のみ。 |
| `release-checks` | すべての OpenClaw Release Checks ステージ。 |
| `install-smoke` | リリースチェックまでの Install Smoke。 |
| `cross-os` | Cross-OS リリースチェック。 |
| `live-e2e` | リポジトリ/ライブ E2E および Docker リリースパス検証。 |
| `package` | Package Acceptance。 |
| `qa` | QA パリティと QA ライブレーン。 |
| `qa-parity` | QA パリティレーンとレポートのみ。 |
| `qa-live` | QA ライブ Matrix と Telegram のみ。 |
| `npm-telegram` | 公開後の任意の Telegram E2E のみ。 |

1 つのライブスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。有効なフィルター ID は再利用可能なライブ/E2E ワークフローで定義されており、`docker-live-models`、`live-gateway-docker`、`live-gateway-anthropic-docker`、`live-gateway-google-docker`、`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、`live-cli-backend-docker`、`live-acp-bind-docker`、および `live-codex-harness-docker` が含まれます。

## 保持する証跡

リリースレベルの索引として `Full Release Validation` のサマリーを保持します。これは子 run ID にリンクし、最も遅いジョブの表を含みます。失敗時は、まず子ワークフローを確認し、その後で上記の最小の一致するハンドルを再実行します。

有用な成果物:

- `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 以下の Docker リリースパス成果物
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
