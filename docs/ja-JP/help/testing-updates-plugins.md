---
read_when:
    - OpenClaw の更新、doctor、パッケージ受け入れ、またはプラグインインストールの動作変更
    - リリース候補の準備または承認
    - パッケージ更新、Plugin 依存関係のクリーンアップ、または Plugin インストールのリグレッションのデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とPlugin'
x-i18n:
    generated_at: "2026-05-05T04:50:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e5dbc85d567b9aec07d13e309d45da45d9088fb41dcbb2a07dae69dca6b09af
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは、更新とPlugin検証専用のチェックリストです。目的は単純です。インストール可能なパッケージが実際のユーザー状態を更新でき、`doctor` を通じて古いレガシー状態を修復でき、さらにサポート対象のソースからPluginをインストール、読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの一覧については、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダーキーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護するもの

更新とPluginのテストは、次の契約を保護します。

- パッケージtarballが完全で、有効な `dist/postinstall-inventory.json` を持ち、展開されていないリポジトリファイルに依存していないこと。
- ユーザーが、設定、エージェント、セッション、ワークスペース、Plugin許可リスト、チャンネル設定を失うことなく、古い公開済みパッケージから候補パッケージへ移行できること。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復パスを所有すること。起動処理に、古いPlugin状態向けの隠れた互換性マイグレーションを増やすべきではありません。
- Pluginのインストールが、ローカルディレクトリ、gitリポジトリ、npmパッケージ、ClawHubレジストリパスから機能すること。
- Pluginのnpm依存関係が管理対象のnpmルートにインストールされ、信頼前にスキャンされ、アンインストール時にnpmを通じて削除されるため、巻き上げられた依存関係が残らないこと。
- 何も変更されていない場合のPlugin更新が安定していること。インストール記録、解決済みソース、インストール済み依存関係のレイアウト、有効化状態がそのまま維持されること。

## 開発中のローカル証明

狭い範囲から始めます。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pluginのインストール、アンインストール、依存関係、またはパッケージインベントリを変更する場合は、編集した接点をカバーする集中的なテストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージDockerレーンがtarballを消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は設定/ドキュメント/APIのドリフトチェックを実行し、パッケージdistインベントリを書き込み、`npm pack --dry-run` を実行し、パックが禁止されたファイルを拒否し、tarballを一時プレフィックスへインストールし、postinstallを実行し、バンドルされたチャンネルエントリポイントをスモークします。

## Dockerレーン

Dockerレーンは製品レベルの証明です。Linuxコンテナ内で実際のパッケージをインストールまたは更新し、CLIコマンド、Gateway起動、HTTPプローブ、RPCステータス、ファイルシステム状態を通じて動作を検証します。

反復中は集中的なレーンを使います。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要なレーン:

- `test:docker:plugins` は、Pluginインストールスモーク、ローカルフォルダーインストール、ローカルフォルダー更新のスキップ動作、事前インストール済み依存関係を持つローカルフォルダー、`file:` パッケージインストール、CLI実行を伴うgitインストール、gitの移動参照更新、巻き上げられた推移的依存関係を伴うnpmレジストリインストール、npm更新のno-op、ローカルClawHubフィクスチャのインストールと更新no-op、マーケットプレイス更新動作、Claudeバンドルの有効化/検査を検証します。ClawHubブロックを密閉/オフラインに保つには、`OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-lifecycle-matrix` は、素のコンテナに候補パッケージをインストールし、npm Pluginに対してインストール、検査、無効化、有効化、明示的アップグレード、明示的ダウングレード、Pluginコード削除後のアンインストールを実行します。各フェーズのRSSとCPUメトリクスをログに記録します。
- `test:docker:plugin-update` は、変更されていないインストール済みPluginが `openclaw plugins update` 中に再インストールされたりインストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、候補tarballを汚れた古いユーザーフィクスチャの上にインストールし、パッケージ更新と非対話doctorを実行してから、loopback Gatewayを起動して状態保持を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済みベースラインをインストールし、焼き込まれた `openclaw config set` レシピで設定し、候補tarballへ更新し、doctorを実行し、レガシークリーンアップを確認し、Gatewayを起動して `/healthz`、`/readyz`、RPCステータスをプローブします。
- `test:docker:update-migration` は、クリーンアップ量の多い公開済み更新レーンです。設定済みのDiscord/Telegram風ユーザー状態から開始し、設定済みPlugin依存関係が実体化する機会を得るためにベースラインdoctorを実行し、設定済みパッケージ化Plugin向けにレガシーPlugin依存関係の残骸をシードし、候補tarballへ更新し、更新後doctorがレガシー依存関係ルートを削除することを要求します。

有用な公開済みアップグレード生存者バリアント:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能なシナリオは、`base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path`、`versioned-runtime-deps` です。集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` が、設定済みPluginインストールマイグレーションを含む、報告済みIssue形状のすべてのシナリオに展開されます。

完全な更新マイグレーションは、Full Release CIから意図的に分離されています。リリース上の問いが「2026.4.23以降のすべての公開済み安定リリースがこの候補へ更新でき、Plugin依存関係の残骸をクリーンアップできるか」である場合は、手動の `Update Migration` ワークフローを使います。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## パッケージ受け入れ

パッケージ受け入れは、GitHubネイティブのパッケージゲートです。1つの候補パッケージを `package-under-test` tarballに解決し、バージョンとSHA-256を記録してから、その正確なtarballに対して再利用可能なDocker E2Eレーンを実行します。ワークフローハーネスrefはパッケージソースrefとは別なので、現在のテストロジックで古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な公開済みバージョンを検証します。
- `source=ref`: 選択された現在のハーネスで、信頼済みブランチ、タグ、またはコミットをパックします。
- `source=url`: 必須の `package_sha256` を持つHTTPS tarballを検証します。
- `source=artifact`: 別のActions実行でアップロードされたtarballを再利用します。

Full Release Validationは、解決済みリリースSHAから構築された `source=artifact` をデフォルトで使います。公開後の証明では、同じアップグレードマトリクスが出荷済みnpmパッケージを対象にするように、`package_acceptance_package_spec=openclaw@YYYY.M.D` を渡します。

リリースチェックは、パッケージ/更新/Pluginセットでパッケージ受け入れを呼び出します。

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

リリースソークが有効な場合は、次も渡します。

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、デフォルトのリリースパッケージゲートで全公開済みリリースを辿ることなく、パッケージマイグレーション、更新チャンネル切り替え、古いPlugin依存関係クリーンアップ、オフラインPluginカバレッジ、Plugin更新動作、TelegramパッケージQAを、同じ解決済み成果物上に保てます。

`last-stable-4` は、npmに公開された最新4つの安定版OpenClawリリースへ解決されます。リリースパッケージ受け入れでは、`2026.4.23` を最初のPlugin更新互換性境界、`2026.5.2` をPluginアーキテクチャ変動境界、`2026.4.15` を古い2026.4.1x公開済み更新ベースラインとして固定します。リゾルバーは、すでに最新4件に含まれるピンを重複排除します。公開済み更新マイグレーションを網羅的にカバーするには、Full Release CIではなく、分離されたUpdate Migrationワークフローで `all-since-2026.4.23` を使います。レガシーな基準日前アンカーも含めてより広く手動サンプリングしたい場合のために、`release-history` も引き続き利用できます。

複数の公開済みアップグレード生存者ベースラインが選択されている場合、再利用可能なDockerワークフローは各ベースラインをそれぞれ専用のランナージョブへシャードします。各ベースラインシャードは選択されたシナリオセットを引き続き実行しますが、ログと成果物はベースラインごとに保持され、実行時間は1つの大きな直列ジョブではなく最も遅いシャードによって制限されます。

リリース前に候補を検証するときは、パッケージプロファイルを手動で実行します。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

リリース上の問いにMCPチャンネル、Cron/サブエージェントのクリーンアップ、OpenAIウェブ検索、またはOpenWebUIが含まれる場合は、`suite_profile=product` を使います。完全なDockerリリースパスのカバレッジが必要な場合にのみ、`suite_profile=full` を使います。

## リリースのデフォルト

リリース候補では、デフォルトの証明スタックは次のとおりです。

1. ソースレベルのリグレッション用の `pnpm check:changed` と `pnpm test:changed`。
2. パッケージ成果物の整合性用の `pnpm release:check`。
3. インストール/更新/Plugin契約用のパッケージ受け入れ `package` プロファイルまたはリリースチェックのカスタムパッケージレーン。
4. OS固有のインストーラー、オンボーディング、プラットフォーム動作用のクロスOSリリースチェック。
5. 変更された面がプロバイダーまたはホステッドサービスの動作に触れる場合のみ、ライブスイート。

メンテナーのマシンでは、明示的にローカル証明を行う場合を除き、広範なゲートとDocker/パッケージの製品証明はTestboxで実行するべきです。

## レガシー互換性

互換性の寛容さは狭く、期限付きです。

- `2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、パッケージ受け入れにおいて、すでに出荷済みのパッケージメタデータ欠落を許容できます。
- 公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプファイルに対して警告できます。
- それ以降のパッケージは現代的な契約を満たす必要があります。同じ欠落は、警告やスキップではなく失敗になります。

これらの古い形状に対して新しい起動時マイグレーションを追加しないでください。doctor修復を追加または拡張し、`upgrade-survivor` または `published-upgrade-survivor` で証明してください。

## カバレッジの追加

更新またはPluginの動作を変更するときは、正しい理由で失敗できる最も低いレイヤーにカバレッジを追加します。

- 純粋なパスまたはメタデータロジック: ソースの横に単体テスト。
- パッケージインベントリまたはパック済みファイルの動作: `package-dist-inventory` またはtarballチェッカーテスト。
- CLIインストール/更新動作: Dockerレーンのアサーションまたはフィクスチャ。
- 公開済みリリースのマイグレーション動作: `published-upgrade-survivor` シナリオ。
- レジストリ/パッケージソースの動作: `test:docker:plugins` フィクスチャまたはClawHubフィクスチャサーバー。
- 依存関係レイアウトまたはクリーンアップ動作: ランタイム実行とファイルシステム境界の両方を検証します。npm依存関係は管理対象のnpmルートの下に巻き上げられる可能性があるため、テストではパッケージローカルの `node_modules` ツリーを仮定するのではなく、ルートがスキャン/クリーンアップされることを証明するべきです。

新しいDockerフィクスチャはデフォルトで密閉した状態に保ちます。テストの目的がライブレジストリ動作でない限り、ローカルフィクスチャレジストリと偽パッケージを使います。

## 失敗のトリアージ

成果物の同一性から始めます。

- パッケージ受け入れの `resolve_package` サマリー: ソース、バージョン、SHA-256、成果物名。
- Docker成果物: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、再実行コマンド。
- アップグレード生存者サマリー: `.artifacts/upgrade-survivor/summary.json`。ベースラインバージョン、候補バージョン、シナリオ、フェーズタイミング、レシピ手順を含みます。

リリース全体の傘を再実行するよりも、同じパッケージ成果物で失敗した正確なレーンを再実行することを優先します。
