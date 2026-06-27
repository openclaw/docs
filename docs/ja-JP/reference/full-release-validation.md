---
read_when:
    - Full Release Validation の実行または再実行
    - 安定版と完全リリース検証プロファイルの比較
    - リリース検証ステージの失敗のデバッグ
summary: Full Release Validation のステージ、子ワークフロー、リリースプロファイル、再実行ハンドル、証跡
title: 完全なリリース検証
x-i18n:
    generated_at: "2026-06-27T12:58:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` はリリース用の包括ワークフローです。これはリリース前の証明のための単一の手動
エントリポイントですが、ほとんどの作業は子ワークフローで実行されるため、
失敗したボックスをリリース全体を再開せずに再実行できます。

信頼されたワークフロー ref、通常は `main` から実行し、リリースブランチ、
タグ、または完全なコミット SHA を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

子ワークフローはハーネスに信頼されたワークフロー ref を使用し、テスト対象候補には入力
`ref` を使用します。これにより、古いリリースブランチやタグを検証するときも
新しい検証ロジックを利用できます。

`release_profile=stable` と `release_profile=full` は常に網羅的な
live/Docker ソークを実行します。ベータプロファイルで同じソークレーンを含めるには
`run_release_soak=true` を渡します。Stable 公開では、このソークと
ブロッキング対象の製品パフォーマンスエビデンスがない検証マニフェストを拒否します。

パッケージ受け入れは通常、解決された `ref` から候補 tarball をビルドします。
これには `pnpm ci:full-release` でディスパッチされた完全 SHA の実行も含まれます。ベータ公開後は、
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を渡して、出荷済み npm パッケージを
リリースチェック、パッケージ受け入れ、クロス OS、リリースパス Docker、パッケージ Telegram で再利用します。
パッケージ受け入れで意図的に別のパッケージを証明する必要がある場合にのみ、
`package_acceptance_package_spec` を使用します。
Codex Plugin の live パッケージレーンは同じ状態に従います。公開済みの
`release_package_spec` 値から `codex_plugin_spec=npm:@openclaw/codex@<version>` が導出されます。
SHA/アーティファクト実行では選択された ref から `extensions/codex` をパックします。また、オペレーターは
`npm:`、`npm-pack:`、または `git:` Plugin
ソース向けに `codex_plugin_spec` を直接設定できます。このレーンは、その Plugin に必要な明示的な Codex CLI インストール承認を付与し、
その後 Codex CLI のプリフライトと同一セッションの OpenAI エージェントターンを実行します。

## トップレベルステージ

| ステージ                | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ターゲット解決    | **ジョブ:** `Resolve target ref`<br />**子ワークフロー:** なし<br />**証明内容:** リリースブランチ、タグ、または完全なコミット SHA を解決し、選択された入力を記録します。<br />**再実行:** これが失敗した場合は包括ワークフローを再実行します。                                                                                                                                                                                                                                             |
| Vitest と通常 CI | **ジョブ:** `Run normal full CI`<br />**子ワークフロー:** `CI`<br />**証明内容:** ターゲット ref に対する手動の完全 CI グラフ。Linux Node レーン、同梱 Plugin シャード、Plugin とチャンネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n、包括ワークフロー経由の Android を含みます。<br />**再実行:** `rerun_group=ci`。                           |
| Plugin プレリリース    | **ジョブ:** `Run plugin prerelease validation`<br />**子ワークフロー:** `Plugin Prerelease`<br />**証明内容:** リリース専用の Plugin 静的チェック、エージェント型 Plugin カバレッジ、完全な拡張バッチシャード、Plugin プレリリース Docker レーン、互換性トリアージ用の非ブロッキング `plugin-inspector-advisory` アーティファクト。<br />**再実行:** `rerun_group=plugin-prerelease`。                                                                                        |
| リリースチェック       | **ジョブ:** `Run release/live/Docker/QA validation`<br />**子ワークフロー:** `OpenClaw Release Checks`<br />**証明内容:** インストールスモーク、クロス OS パッケージチェック、パッケージ受け入れ、QA Lab パリティ、live Matrix、live Telegram。Stable および full プロファイルでは、網羅的な live/E2E スイートと Docker リリースパスチャンクも実行します。ベータは `run_release_soak=true` でオプトインできます。<br />**再実行:** `rerun_group=release-checks` またはより狭い release-checks ハンドル。 |
| パッケージ Telegram     | **ジョブ:** `Run package Telegram E2E`<br />**子ワークフロー:** `NPM Telegram Beta E2E`<br />**証明内容:** `release_package_spec` または `npm_telegram_package_spec` が設定されている場合の、公開済みパッケージに焦点を当てた Telegram E2E。完全な候補検証では、代わりに正規のパッケージ受け入れ Telegram E2E を使用します。<br />**再実行:** `release_package_spec` または `npm_telegram_package_spec` を指定して `rerun_group=npm-telegram`。                                               |
| 包括検証    | **ジョブ:** `Verify full validation`<br />**子ワークフロー:** なし<br />**証明内容:** 記録された子実行の結論を再チェックし、子ワークフローから最も遅いジョブの表を追記します。<br />**再実行:** 失敗した子を再実行してグリーンにした後、このジョブのみを再実行します。                                                                                                                                                                                                  |

`ref=main` かつ `rerun_group=all` の場合、新しい包括ワークフローは古いものを置き換えます。
親がキャンセルされると、そのモニターはすでにディスパッチ済みの子ワークフローをすべて
キャンセルします。リリースブランチとタグの検証実行は、デフォルトでは互いにキャンセルしません。

## リリースチェックのステージ

`OpenClaw Release Checks` は最大の子ワークフローです。ターゲットを
一度だけ解決し、パッケージまたは Docker 向けのステージで必要な場合に共有の
`release-package-under-test` アーティファクトを準備します。

| ステージ               | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| リリースターゲット      | **ジョブ:** `Resolve target ref`<br />**Backing workflow:** なし<br />**テスト:** 選択された ref、任意の期待 SHA、プロファイル、再実行グループ、集中 live スイートフィルター。<br />**再実行:** `rerun_group=release-checks`。                                                                                                                                                                                                                                                                              |
| パッケージアーティファクト    | **ジョブ:** `Prepare release package artifact`<br />**Backing workflow:** なし<br />**テスト:** 1 つの候補 tarball をパックまたは解決し、下流のパッケージ向けチェック用に `release-package-under-test` をアップロードする。<br />**再実行:** 影響を受けたパッケージ、クロス OS、または live/E2E グループ。                                                                                                                                                                                                              |
| インストールスモーク       | **ジョブ:** `Run install smoke`<br />**Backing workflow:** `Install Smoke`<br />**テスト:** ルート Dockerfile スモークイメージ再利用、QR パッケージインストール、ルートおよび Gateway Docker スモーク、インストーラー Docker テスト、Bun グローバルインストールの image-provider スモーク、高速なバンドル Plugin インストール/アンインストール E2E を含む完全なインストールパス。<br />**再実行:** `rerun_group=install-smoke`。                                                                                                                                 |
| クロス OS            | **ジョブ:** `cross_os_release_checks`<br />**Backing workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**テスト:** 候補 tarball とベースラインパッケージを使用し、選択されたプロバイダーとモードについて Linux、Windows、macOS 上で新規およびアップグレードレーンを実行する。<br />**再実行:** `rerun_group=cross-os`。                                                                                                                                                                                  |
| リポジトリおよび live E2E   | **ジョブ:** `Run repo/live E2E validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** リポジトリ E2E、live キャッシュ、OpenAI websocket ストリーミング、ネイティブ live プロバイダーおよび Plugin シャード、`release_profile` で選択された Docker ベースの live モデル/バックエンド/Gateway ハーネス。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または集中 `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`、任意で `live_suite_filter` を指定。 |
| Docker リリースパス | **ジョブ:** `Run Docker release-path validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**テスト:** 共有パッケージアーティファクトに対するリリースパス Docker チャンク。<br />**実行条件:** `run_release_soak=true`、`release_profile=full`、または集中 `rerun_group=live-e2e`。<br />**再実行:** `rerun_group=live-e2e`。                                                                                                                                                      |
| Package Acceptance  | **ジョブ:** `Run package acceptance`<br />**Backing workflow:** `Package Acceptance`<br />**テスト:** オフライン Plugin パッケージフィクスチャ、Plugin 更新、標準 mock-OpenAI Telegram パッケージ E2E、および同じ tarball に対する published-upgrade survivor チェック。ブロック対象のリリースチェックはデフォルトの最新公開ベースラインを使用し、ソークチェックは `2026.4.23` 以降のすべての安定 npm リリースと報告済み issue フィクスチャに拡張される。<br />**再実行:** `rerun_group=package`。                   |
| QA パリティ           | **ジョブ:** `Run QA Lab parity lane` および `Run QA Lab parity report`<br />**Backing workflow:** 直接ジョブ<br />**テスト:** 候補およびベースラインのエージェント型パリティパック、その後にパリティレポート。<br />**再実行:** `rerun_group=qa-parity` または `rerun_group=qa`。                                                                                                                                                                                                                                          |
| QA live Matrix      | **ジョブ:** `Run QA Lab live Matrix lane`<br />**Backing workflow:** 直接ジョブ<br />**テスト:** `qa-live-shared` 環境での高速 live Matrix QA プロファイル。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **ジョブ:** `Run QA Lab live Telegram lane`<br />**Backing workflow:** 直接ジョブ<br />**テスト:** Convex CI 認証情報リースを使用する live Telegram QA。<br />**再実行:** `rerun_group=qa-live` または `rerun_group=qa`。                                                                                                                                                                                                                                                                                       |
| リリース検証          | **ジョブ:** `Verify release checks`<br />**Backing workflow:** なし<br />**テスト:** 選択された再実行グループに必要なリリースチェックジョブ。<br />**再実行:** 集中子ジョブが合格した後に再実行。                                                                                                                                                                                                                                                                                                    |

## Docker リリースパスチャンク

Docker リリースパスステージは、`live_suite_filter` が空の場合にこれらのチャンクを実行する:

| チャンク                                                           | カバレッジ                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | コア Docker リリースパススモークレーン。                                                                                      |
| `package-update-openai`                                         | OpenAI パッケージのインストール/更新動作、Codex オンデマンドインストール、Codex Plugin の live ターン、Chat Completions ツール呼び出し。 |
| `package-update-anthropic`                                      | Anthropic パッケージのインストールおよび更新動作。                                                                             |
| `package-update-core`                                           | プロバイダー非依存のパッケージおよび更新動作。                                                                              |
| `plugins-runtime-plugins`                                       | Plugin 動作を実行する Plugin ランタイムレーン。                                                                        |
| `plugins-runtime-services`                                      | サービス backed および live Plugin ランタイムレーン。要求時は OpenWebUI を含む。                                           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | 並列リリース検証用に分割された Plugin インストール/ランタイムバッチ。                                                      |

1 つの Docker レーンだけが失敗した場合は、再利用可能な live/E2E ワークフローで
対象を絞った `docker_lanes=<lane[,lane]>` を使用する。リリースアーティファクトには、利用可能な場合に
パッケージアーティファクトおよびイメージ再利用の入力を含むレーンごとの再実行
コマンドが含まれる。

## リリースプロファイル

`release_profile` は主に、リリースチェック内の live/プロバイダーの幅を制御する。
通常の完全 CI、Plugin Prerelease、インストールスモーク、パッケージ
acceptance、QA Lab は削除しない。stable および full プロファイルは常に、網羅的なリポジトリ/live
E2E と Docker リリースパスのソークカバレッジを実行する。beta プロファイルは
`run_release_soak=true` でオプトインできる。Package Acceptance はすべての full 候補に標準パッケージ
Telegram E2E を提供するため、umbrella はその live poller を重複実行しない。

| プロファイル   | 想定用途                      | 含まれる live/プロバイダーカバレッジ                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | 最速のリリースクリティカルスモーク。   | OpenAI/コア live パス、OpenAI 用 Docker live モデル、ネイティブ Gateway コア、ネイティブ OpenAI Gateway プロファイル、ネイティブ OpenAI Plugin、Docker live Gateway OpenAI。                     |
| `stable`  | デフォルトのリリース承認プロファイル。 | `minimum` に加えて Anthropic スモーク、Google、MiniMax、バックエンド、ネイティブ live テストハーネス、Docker live CLI バックエンド、Docker ACP bind、Docker Codex ハーネス、OpenCode Go スモークシャード。 |
| `full`    | 広範な advisory スイープ。             | `stable` に加えて advisory プロバイダー、Plugin live シャード、メディア live シャード。                                                                                                        |

## full のみの追加

これらのスイートは `stable` ではスキップされ、`full` に含まれる:

| 領域                             | full のみのカバレッジ                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live モデル               | OpenCode Go、OpenRouter、xAI、Z.ai、Fireworks。                                                                          |
| Docker live Gateway              | DeepSeek/Fireworks、OpenCode Go/OpenRouter、xAI/Z.ai シャードに分割された advisory プロバイダー。                              |
| ネイティブ Gateway プロバイダープロファイル | Anthropic Opus および Sonnet/Haiku の full シャード、Fireworks、DeepSeek、OpenCode Go の full モデルシャード、OpenRouter、xAI、Z.ai。 |
| ネイティブ Plugin live シャード        | Plugins A-K、L-N、O-Z other、Moonshot、xAI。                                                                             |
| ネイティブメディア live シャード         | Audio、Google music、MiniMax music、video groups A-D。                                                                   |

`stable` は `native-live-src-gateway-profiles-anthropic-smoke` と
`native-live-src-gateway-profiles-opencode-go-smoke` を含み、`full` は代わりにより広範な
Anthropic および OpenCode Go モデルシャードを使用する。集中再実行では引き続き
集約 `native-live-src-gateway-profiles-anthropic` または
`native-live-src-gateway-profiles-opencode-go` ハンドルを使用できる。

## 集中再実行

`rerun_group` を使って、無関係なリリースボックスの繰り返しを避けます。

| ハンドル            | スコープ                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | すべての完全リリース検証ステージ。                                                              |
| `ci`                | 手動の完全CI子ワークフローのみ。                                                                |
| `plugin-prerelease` | Pluginプレリリース子ワークフローのみ。                                                          |
| `release-checks`    | すべてのOpenClawリリースチェックステージ。                                                       |
| `install-smoke`     | インストールスモークからリリースチェックまで。                                                   |
| `cross-os`          | クロスOSリリースチェック。                                                                      |
| `live-e2e`          | リポジトリ/live E2EとDockerリリースパス検証。                                                    |
| `package`           | パッケージ受け入れ。                                                                            |
| `qa`                | QAパリティとQA liveレーン。                                                                      |
| `qa-parity`         | QAパリティレーンとレポートのみ。                                                                |
| `qa-live`           | QA live Matrix/Telegramに加え、有効時はゲート付きDiscord、WhatsApp、Slackレーン。               |
| `npm-telegram`      | 公開済みパッケージのTelegram E2E。`release_package_spec` または `npm_telegram_package_spec` が必要。 |

1つのliveスイートが失敗した場合は、`rerun_group=live-e2e` とともに `live_suite_filter` を使います。
有効なフィルターIDは再利用可能なlive/E2Eワークフローで定義されており、以下を含みます。
`docker-live-models`、`live-gateway-docker`、
`live-gateway-anthropic-docker`、`live-gateway-google-docker`、
`live-gateway-minimax-docker`、`live-gateway-advisory-docker`、
`live-cli-backend-docker`、`live-acp-bind-docker`、および
`live-codex-harness-docker`。

`live-gateway-advisory-docker` ハンドルは、その3つのプロバイダーシャードに対する集約再実行ハンドルであるため、
引き続きすべてのadvisory Docker Gatewayジョブにファンアウトします。

1つのクロスOSレーンが失敗した場合は、`rerun_group=cross-os` とともに `cross_os_suite_filter` を使います。
フィルターはOS ID、スイートID、またはOS/スイートのペアを受け付けます。
たとえば `windows/packaged-upgrade`、`windows`、または `packaged-fresh` です。
クロスOSサマリーには、パッケージ済みアップグレードレーンのフェーズ別タイミングが含まれ、
長時間実行されるコマンドはheartbeat行を出力するため、ジョブタイムアウト前に停止したWindows更新が見えるようになります。

QAリリースチェックの失敗は通常のリリース検証をブロックします。
標準ティアで必要なOpenClaw動的ツールのドリフトも、リリースチェック検証をブロックします。
Tideclaw alpha実行では、パッケージ安全性以外のリリースチェックレーンを引き続きadvisoryとして扱う場合があります。
`live_suite_filter` がDiscord、WhatsApp、Slackなどのゲート付きQA liveレーンを明示的に要求する場合、
対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ変数を有効にする必要があります。
有効でない場合、レーンを黙ってスキップするのではなく、入力キャプチャが失敗します。
新しいQA証拠が必要な場合は、`rerun_group=qa`、
`qa-parity`、または `qa-live` を再実行します。

## 保持する証拠

リリースレベルのインデックスとして `Full Release Validation` サマリーを保持します。これは子実行IDにリンクし、
最も遅いジョブのテーブルを含みます。失敗時はまず子ワークフローを調査し、その後、上記の最小の一致ハンドルを再実行します。

有用なアーティファクト:

- `OpenClaw Release Checks` の `release-package-under-test`
- `.artifacts/docker-tests/` 配下のDockerリリースパスアーティファクト
- パッケージ受け入れの `package-under-test` とDocker受け入れアーティファクト
- 各OSとスイートのクロスOSリリースチェックアーティファクト
- QAパリティ、Matrix、Telegramアーティファクト

## ワークフローファイル

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
