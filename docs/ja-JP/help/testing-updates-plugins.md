---
read_when:
    - OpenClaw の更新、doctor、パッケージ受け入れ、または Plugin インストールの動作を変更する
    - リリース候補の準備または承認
    - パッケージ更新、Plugin依存関係のクリーンアップ、またはPluginインストールの回帰のデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とプラグイン'
x-i18n:
    generated_at: "2026-05-03T21:35:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは、更新とPlugin検証専用のチェックリストです。目的は
単純です。インストール可能なパッケージが実際のユーザー状態を更新でき、`doctor` を通じて古い
レガシー状態を修復でき、さらにサポートされているソースから
Pluginをインストール、読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの一覧については、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダーの
キーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護するもの

更新テストとPluginテストは、次の契約を保護します。

- パッケージtarballが完全で、有効な `dist/postinstall-inventory.json` を持ち、
  展開されていないリポジトリファイルに依存しないこと。
- ユーザーが、公開済みの古いパッケージから候補パッケージへ、
  設定、エージェント、セッション、ワークスペース、Plugin許可リスト、または
  チャンネル設定を失わずに移行できること。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復
  パスを担うこと。起動時に、古いPlugin状態のための隠れた互換性移行を
  増やすべきではありません。
- Pluginのインストールが、ローカルディレクトリ、gitリポジトリ、npmパッケージ、および
  ClawHubレジストリパスから動作すること。
- Pluginのnpm依存関係が管理対象のnpmルートにインストールされ、信頼前に
  スキャンされ、アンインストール時にnpm経由で削除されるため、hoistされた依存関係が
  残らないこと。
- 何も変更されていない場合、Plugin更新が安定していること。インストール記録、解決済み
  ソース、インストール済み依存関係レイアウト、有効状態がそのまま保たれること。

## 開発中のローカル証明

狭い範囲から始めます。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pluginのインストール、アンインストール、依存関係、またはパッケージインベントリの変更では、編集した境界をカバーする
焦点を絞ったテストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージDockerレーンがtarballを使用する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は、設定/docs/APIドリフトチェックを実行し、パッケージdist
インベントリを書き込み、`npm pack --dry-run` を実行し、パックされた禁止ファイルを拒否し、
tarballを一時プレフィックスへインストールし、postinstallを実行し、同梱チャンネルの
エントリポイントをスモークします。

## Dockerレーン

Dockerレーンはプロダクトレベルの証明です。Linuxコンテナ内で実際の
パッケージをインストールまたは更新し、CLIコマンド、
Gateway起動、HTTPプローブ、RPCステータス、ファイルシステム状態を通じて挙動を検証します。

反復中は焦点を絞ったレーンを使用します。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要なレーン:

- `test:docker:plugins` は、Pluginインストールのスモーク、ローカルフォルダーインストール、
  ローカルフォルダー更新のスキップ挙動、事前インストール済み
  依存関係を持つローカルフォルダー、`file:` パッケージインストール、CLI実行を伴うgitインストール、git
  moving-ref更新、hoistされた推移的依存関係を伴うnpmレジストリインストール、
  npm更新のno-op、ローカルClawHubフィクスチャのインストールと更新
  no-op、マーケットプレイス更新挙動、Claudeバンドルの有効化/検査を検証します。
  ClawHubブロックをhermetic/オフラインに保つには、`OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-lifecycle-matrix` は、素のコンテナに候補パッケージをインストールし、
  npm Pluginをインストール、検査、無効化、有効化、
  明示的アップグレード、明示的ダウングレード、Pluginコード削除後のアンインストールまで実行します。
  各フェーズのRSSとCPUメトリクスを記録します。
- `test:docker:plugin-update` は、変更のないインストール済みPluginが
  `openclaw plugins update` 中に再インストールされたり、インストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、汚れた古いユーザーフィクスチャの上に候補tarballをインストールし、
  パッケージ更新と非対話型doctorを実行してから、
  loopback Gatewayを起動し、状態保持を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済みベースラインをインストールし、
  焼き込み済みの `openclaw config set` レシピを通じて設定し、候補tarballへ更新し、
  doctorを実行し、レガシークリーンアップを確認し、Gatewayを起動して、
  `/healthz`、`/readyz`、RPCステータスをプローブします。
- `test:docker:update-migration` は、クリーンアップが多い公開済み更新レーンです。
  設定済みのDiscord/Telegram風ユーザー状態から開始し、設定済みPlugin依存関係が
  materializeする機会を持てるようにベースライン
  doctorを実行し、設定済みのパッケージ化PluginのレガシーPlugin依存関係の残骸をシードし、
  候補tarballへ更新し、更新後doctorがレガシーの
  依存関係ルートを削除することを要求します。

便利な公開済みアップグレードsurvivorバリアント:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能なシナリオは、`base`、`feishu-channel`、`bootstrap-persona`、
`plugin-deps-cleanup`、`configured-plugin-installs`、`tilde-log-path`、および
`versioned-runtime-deps` です。集約実行では、
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` が、設定済みPluginインストール移行を含む、
報告済みissue形状のすべてのシナリオに展開されます。

完全な更新移行は、Full Release CIから意図的に分離されています。リリースの問いが「2026.4.23以降のすべての
公開済み安定版リリースがこの候補へ更新でき、
Plugin依存関係の残骸をクリーンアップできるか」である場合は、手動の `Update Migration` ワークフローを使用します。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package AcceptanceはGitHubネイティブのパッケージゲートです。1つの候補
パッケージを `package-under-test` tarballへ解決し、バージョンとSHA-256を記録してから、
その厳密なtarballに対して再利用可能なDocker E2Eレーンを実行します。ワークフローハーネス
refはパッケージソースrefと分離されているため、現在のテストロジックで
古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な
  公開済みバージョンを検証します。
- `source=ref`: 選択された現在の
  ハーネスで、信頼済みブランチ、タグ、またはコミットをパックします。
- `source=url`: 必須の `package_sha256` を伴うHTTPS tarballを検証します。
- `source=artifact`: 別のActions実行でアップロードされたtarballを再利用します。

Full Release Validationは、解決済みリリースSHAからビルドされた
`source=artifact` をデフォルトで使用します。公開後の証明では、
同じアップグレードマトリクスが出荷済みnpmパッケージを対象にするように、
`package_acceptance_package_spec=openclaw@YYYY.M.D` を渡します。

リリースチェックは、パッケージ/更新/PluginセットでPackage Acceptanceを呼び出します。

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

次も渡します。

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、パッケージ移行、更新チャンネル切り替え、古いPlugin依存関係
クリーンアップ、オフラインPluginカバレッジ、Plugin更新挙動、Telegramパッケージ
QAが、同じ解決済み成果物上に保たれます。

`all-since-2026.4.23` はFull Release CIのアップグレードサンプルです。`2026.4.23` から `latest` までの、npmで公開されたすべての安定版リリースです。公開済み
更新移行の網羅的なカバレッジでは、Full Release CIではなく、別個のUpdate
Migrationワークフローで `all-since-2026.4.23` を使用します。レガシーの事前日付
アンカーも必要な場合の手動のより広いサンプリング用として、`release-history` は引き続き
利用可能です。

リリース前に候補を検証する場合は、パッケージプロファイルを手動で実行します。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

リリースの問いにMCPチャンネル、cron/subagentクリーンアップ、OpenAI web search、またはOpenWebUIが含まれる場合は、
`suite_profile=product` を使用します。完全なDockerリリースパスカバレッジが必要な場合にのみ、
`suite_profile=full` を使用します。

## リリースのデフォルト

リリース候補では、デフォルトの証明スタックは次のとおりです。

1. ソースレベルの回帰に対する `pnpm check:changed` と `pnpm test:changed`。
2. パッケージ成果物の整合性に対する `pnpm release:check`。
3. インストール/更新/Plugin契約に対するPackage Acceptance `package` プロファイルまたはリリースチェックのカスタムパッケージ
   レーン。
4. OS固有のインストーラー、オンボーディング、プラットフォーム
   挙動に対するクロスOSリリースチェック。
5. 変更された面がプロバイダーまたはホスト型サービス
   挙動に触れる場合のみライブスイート。

メンテナーのマシンでは、明示的にローカル証明を行っている場合を除き、
広範なゲートとDocker/パッケージのプロダクト証明はTestboxで実行するべきです。

## レガシー互換性

互換性の寛容さは狭く、期限付きです。

- `2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、
  Package Acceptanceで、すでに出荷済みのパッケージメタデータのギャップを許容する場合があります。
- 公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータstamp
  ファイルについて警告する場合があります。
- それ以降のパッケージは、現代的な契約を満たす必要があります。同じギャップは
  警告やスキップではなく失敗になります。

これらの古い形状に対して、新しい起動時移行を追加しないでください。doctor
修復を追加または拡張し、それを `upgrade-survivor` または `published-upgrade-survivor` で証明します。

## カバレッジの追加

更新またはPluginの挙動を変更する場合は、正しい理由で失敗できる
最も低いレイヤーにカバレッジを追加します。

- 純粋なパスまたはメタデータロジック: ソースの隣のユニットテスト。
- パッケージインベントリまたはパックされたファイルの挙動: `package-dist-inventory` またはtarball
  チェッカーテスト。
- CLIインストール/更新挙動: Dockerレーンのアサーションまたはフィクスチャ。
- 公開済みリリースの移行挙動: `published-upgrade-survivor` シナリオ。
- レジストリ/パッケージソースの挙動: `test:docker:plugins` フィクスチャまたはClawHub
  フィクスチャサーバー。
- 依存関係レイアウトまたはクリーンアップ挙動: ランタイム実行と
  ファイルシステム境界の両方をアサートします。npm依存関係は管理対象npm
  ルート配下にhoistされる場合があるため、テストではパッケージローカルの
  `node_modules` ツリーを仮定するのではなく、ルートがスキャン/クリーンアップされることを証明するべきです。

新しいDockerフィクスチャはデフォルトでhermeticに保ちます。テストの目的がライブレジストリ挙動でない限り、
ローカルフィクスチャレジストリと偽パッケージを使用します。

## 失敗のトリアージ

成果物の同一性から始めます。

- Package Acceptance `resolve_package` サマリー: ソース、バージョン、SHA-256、および
  成果物名。
- Docker成果物: `.artifacts/docker-tests/**/summary.json`、
  `failures.json`、レーンログ、再実行コマンド。
- アップグレードsurvivorサマリー: `.artifacts/upgrade-survivor/summary.json`。
  ベースラインバージョン、候補バージョン、シナリオ、フェーズタイミング、
  レシピ手順を含みます。

リリース全体の傘を再実行するよりも、同じパッケージ成果物で失敗した厳密なレーンを
再実行することを優先します。
