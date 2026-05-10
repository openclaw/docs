---
read_when:
    - フルリリース検証の実行または再実行
    - 安定版と完全版のリリース検証プロファイルの比較
    - リリース検証ステージ失敗のデバッグ
summary: 完全なリリース検証のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、エビデンス
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-05-10T19:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース全体を束ねるワークフローです。これはプレリリース証明の単一の手動エントリポイントですが、失敗した環境だけをリリース全体の再開なしで再実行できるよう、作業の大半は子ワークフローで行われます。

信頼済みワークフロー ref（通常は `main`）から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローは、ハーネスには信頼済みワークフロー ref を使用し、テスト対象候補には入力の `ref` を使用します。これにより、古いリリースブランチやタグを検証するときでも、新しい検証ロジックを利用できます。

デフォルトでは、`release_profile=stable` はリリースをブロックするレーンを実行し、網羅的なライブ/Docker ソークをスキップします。stable 実行でソークレーンを含めるには `run_release_soak=true` を渡します。`release_profile=full` は常にソークレーンを有効にするため、広範な助言用プロファイルでカバレッジが暗黙に落ちることはありません。

Package Acceptance は通常、完全 SHA 実行を `pnpm ci:full-release` でディスパッチした場合も含め、解決済みの `ref` から候補 tarball をビルドします。公開後は、`package_acceptance_package_spec=openclaw@YYYY.M.D`（または `openclaw@beta`/`openclaw@latest`）を渡すと、出荷済み npm パッケージに対して同じパッケージ/更新マトリクスを実行できます。

## トップレベルステージ

| ステージ             | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ターゲット解決       | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明すること:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合はアンブレラを再実行します。                                                                                                                                                                                                         |
| Vitest と通常 CI     | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明すること:** ターゲット ref に対する手動のフル CI グラフ。Linux Node レーン、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python skills、Windows、macOS、Control UI i18n、アンブレラ経由の Android を含みます。<br />**再実行:** `rerun_group=ci`。 |
| Plugin プレリリース  | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明すること:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、拡張機能のフルバッチシャード、Plugin プレリリース Docker レーン。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                                               |
| リリースチェック     | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明すること:** インストールスモーク、クロス OS パッケージチェック、Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram。`run_release_soak=true` または `release_profile=full` の場合は、網羅的なライブ/E2E スイートと Docker リリースパスチャンクも実行します。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。 |
| パッケージ成果物     | **ジョブ:** `Prepare release package artifact`<br />**子ワークフロー:** なし<br />**証明すること:** `OpenClaw Release Checks` を待つ必要のないパッケージ向けチェックで使えるよう、親の `release-package-under-test` tarball を十分早い段階で作成します。<br />**再実行:** アンブレラを再実行するか、`rerun_group=npm-telegram` に `npm_telegram_package_spec` を指定します。                                                                  |
| パッケージ Telegram  | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明すること:** `release_profile=full` の `rerun_group=all` に対する、親成果物に裏付けられた Telegram パッケージ証明、または `npm_telegram_package_spec` が設定されている場合の公開済みパッケージ Telegram 証明。<br />**再実行:** `npm_telegram_package_spec` を指定して `rerun_group=npm-telegram`。             |
| アンブレラ検証       | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明すること:** 記録された子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブだけを再実行します。                                                                                                                                                      |

`ref=main` かつ `rerun_group=all` の場合、新しいアンブレラは古いアンブレラを置き換えます。親がキャンセルされると、そのモニターはすでにディスパッチ済みの子ワークフローをキャンセルします。リリースブランチとタグの検証実行は、デフォルトでは互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを一度解決し、パッケージ向けまたは Docker 向けのステージが必要とする場合に、共有の `release-package-under-test` 成果物を準備します。

| ステージ               | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット      | **ジョブ:** `Resolve target ref`<br />**対応するワークフロー:** なし<br />**テスト:** 選択された ref、任意の期待 SHA、プロファイル、再実行グループ、絞り込まれたライブスイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| パッケージアーティファクト    | **ジョブ:** `Prepare release package artifact`<br />**対応するワークフロー:** なし<br />**テスト:** 1 つの候補 tarball をパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードする。<br />**再実行:** 影響を受けたパッケージ、クロス OS、またはライブ/E2E グループ。                                                                                                                                                                                                              |
| インストールスモーク       | **ジョブ:** `Run install smoke`<br />**対応するワークフロー:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージの再利用、QR パッケージインストール、ルートおよび Gateway Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールのイメージプロバイダースモーク、高速な同梱 Plugin のインストール/アンインストール E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                 |
| クロス OS            | **ジョブ:** `cross_os_release_checks`<br />**対応するワークフロー:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使い、選択されたプロバイダーとモードについて Linux、Windows、macOS 上で新規およびアップグレードレーンを実行する。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                  |
| リポジトリとライブ E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**対応するワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、ライブキャッシュ、OpenAI websocket ストリーミング、ネイティブのライブプロバイダーおよび Plugin シャード、`release_profile` によって選択される Docker ベースのライブモデル/バックエンド/Gateway ハーネス。<br />**実行:** `run_release_soak=true`、`release_profile=full`、または絞り込み済みの `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`、任意で `live_suite_filter`。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**対応するワークフロー:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**実行:** `run_release_soak=true`、`release_profile=full`、または絞り込み済みの `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                      |
| パッケージ受け入れ  | **ジョブ:** `Run package acceptance`<br />**対応するワークフロー:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、mock-OpenAI Telegram パッケージ受け入れ、同じ tarball に対する公開済みアップグレード生存チェック。ブロッキングリリースチェックでは既定の最新公開ベースラインを使う。ソークチェックでは `2026.4.23` 以降のすべての安定版 npm リリースに加え、報告済み Issue のフィクスチャまで拡張する。<br />**再実行:** `rerun_group=package`。                          |
| QA パリティ           | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**対応するワークフロー:** 直接ジョブ<br />**テスト:** 候補およびベースラインのエージェント型パリティパック、その後のパリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA ライブ Matrix      | **ジョブ:** `Run QA Lab live Matrix lane`<br />**対応するワークフロー:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速ライブ Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA ライブ Telegram    | **ジョブ:** `Run QA Lab live Telegram lane`<br />**対応するワークフロー:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使うライブ Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| リリース検証    | **ジョブ:** `Verify release checks`<br />**対応するワークフロー:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 絞り込んだ子ジョブが成功した後に再実行する。                                                                                                                                                                                                                                                                                                    |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合に次のチャンクを実行します。

| チャンク                                                           | カバレッジ                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパススモークレーン。                                            |
| `package-update-openai`                                         | Codex のオンデマンドインストールを含む、OpenAI パッケージのインストール/更新動作。       |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                                   |
| `package-update-core`                                           | プロバイダーに依存しないパッケージおよび更新動作。                                    |
| `plugins-runtime-plugins`                                       | Plugin 動作を実行する Plugin ランタイムレーン。                              |
| `plugins-runtime-services`                                      | サービスバックおよびライブ Plugin ランタイムレーン。要求された場合は OpenWebUI を含む。 |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。            |

1 つの Docker レーンだけが失敗した場合は、再利用可能なライブ/E2E ワークフローでターゲットを絞った `docker_lanes=<lane[,lane]>` を使用します。リリースアーティファクトには、利用可能な場合、パッケージアーティファクトとイメージ再利用の入力を含むレーンごとの再実行コマンドが含まれます。

## リリースプロファイル

`release_profile` は主に、リリースチェック内のライブ/プロバイダー範囲を制御します。通常の完全 CI、Plugin プレリリース、インストールスモーク、パッケージ受け入れ、QA Lab は削除しません。`stable` の場合、網羅的なリポジトリ/ライブ E2E と Docker リリースパスチャンクはソークカバレッジであり、`run_release_soak=true` の場合に実行されます。`full` はソークカバレッジを強制的に有効にし、さらに `rerun_group=all` の場合は親リリースパッケージアーティファクトに対してアンブレラ実行でパッケージ Telegram E2E を実行するため、完全な公開前候補がその Telegram パッケージレーンを黙ってスキップすることはありません。

| プロファイル   | 想定用途                      | 含まれるライブ/プロバイダーカバレッジ                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルなスモーク。   | OpenAI/コアのライブパス、OpenAI 用 Docker ライブモデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker ライブ Gateway OpenAI。                     |
| `stable`  | 既定のリリース承認プロファイル。 | `minimum` に加えて、Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブライブテストハーネス、Docker ライブ CLI バックエンド、Docker ACP bind、Docker Codex ハーネス、OpenCode Go スモークシャード。 |
| `full`    | 広範なアドバイザリスイープ。             | `stable` に加えて、アドバイザリプロバイダー、Plugin ライブシャード、メディアライブシャード。                                                                                                        |

## full 限定の追加項目

これらのスイートは `stable` ではスキップされ、`full` に含まれます。

| 領域                             | full 限定カバレッジ                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker ライブモデル               | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。                                                                          |
| Docker ライブ Gateway              | DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai シャードに分割されたアドバイザリプロバイダー。                              |
| ネイティブ Gateway プロバイダープロファイル | 完全な Anthropic Opus および Sonnet/Haiku シャード、Fireworks、DeepSeek、完全な OpenCode Go モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin ライブシャード        | Plugins A-K、L-N、O-Z その他、Moonshot、xAI。                                                                             |
| ネイティブメディアライブシャード         | Audio、Google music、MiniMax music、video groups A-D。                                                                   |

`stable` には `native-live-src-gateway-profiles-anthropic-smoke` と `native-live-src-gateway-profiles-opencode-go-smoke` が含まれます。`full` は代わりに、より広範な Anthropic および OpenCode Go モデルシャードを使用します。絞り込んだ再実行では、引き続き集約ハンドル `native-live-src-gateway-profiles-anthropic` または `native-live-src-gateway-profiles-opencode-go` を使用できます。

## 絞り込んだ再実行

無関係なリリースボックスの繰り返しを避けるには、`rerun_group` を使用します。

| ハンドル              | スコープ                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | すべての完全リリース検証ステージ。                                   |
| `ci`                | 手動の完全 CI 子ワークフローのみ。                                            |
| `plugin-prerelease` | Plugin プレリリース子ワークフローのみ。                                         |
| `release-checks`    | すべての OpenClaw リリースチェックのステージ。                                   |
| `install-smoke`     | インストールスモークからリリースチェックまで。                                 |
| `cross-os`          | クロス OS リリースチェック。                                              |
| `live-e2e`          | リポジトリ/ライブ E2E と Docker リリースパス検証。                     |
| `package`           | パッケージ受け入れ。                                                   |
| `qa`                | QA パリティと QA ライブレーン。                                         |
| `qa-parity`         | QA パリティレーンとレポートのみ。                                      |
| `qa-live`           | QA ライブ Matrix と Telegram のみ。                                     |
| `npm-telegram`      | 公開パッケージ Telegram E2E。`npm_telegram_package_spec` が必要。 |

ライブスイートが 1 つ失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使用します。
有効なフィルター ID は再利用可能なライブ/E2E ワークフローで定義されており、
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、および
`live-codex-harness-docker` が含まれます。

`live-gateway-advisory-docker` ハンドルは、その 3 つのプロバイダーシャード用の集約再実行ハンドルであるため、すべての advisory Docker Gateway ジョブへ引き続きファンアウトします。

クロス OS レーンが 1 つ失敗した場合は、`rerun_group=cross-os` とともに `cross_os_suite_filter` を使用します。フィルターは OS ID、スイート ID、または OS/スイートの組み合わせを受け付けます。たとえば、`windows/packaged-upgrade`、`windows`、または `packaged-fresh` です。クロス OS のサマリーには、パッケージ化アップグレードレーンのフェーズごとのタイミングが含まれ、長時間実行されるコマンドは Heartbeat 行を出力するため、ジョブのタイムアウト前に停止した Windows 更新を確認できます。

QA リリースチェックレーンは advisory です。QA のみの失敗は警告として報告され、リリースチェック検証をブロックしません。新しい QA 証拠が必要な場合は、`rerun_group=qa`、`qa-parity`、または `qa-live` を再実行します。

## 保持する証拠

リリースレベルのインデックスとして `Full Release Validation` サマリーを保持します。これは子実行 ID にリンクし、最も遅いジョブの表を含みます。失敗時は、まず子ワークフローを調査し、その後、上記の最小の該当ハンドルを再実行します。

有用なアーティファクト:

- 完全リリース検証の親と `OpenClaw Release Checks` からの `release-package-under-test`
- `.artifacts/docker-tests/` 配下の Docker リリースパスアーティファクト
- パッケージ受け入れの `package-under-test` と Docker 受け入れアーティファクト
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
