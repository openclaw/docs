---
read_when:
    - OpenClaw の update、doctor、package acceptance、または Plugin インストール動作の変更
    - リリース候補を準備または承認する
    - パッケージ更新、plugin 依存関係のクリーンアップ、または plugin インストール回帰のデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とプラグイン'
x-i18n:
    generated_at: "2026-06-27T11:44:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは更新とPlugin検証専用のチェックリストです。目的は
単純です。インストール可能なパッケージが実ユーザーの状態を更新でき、`doctor`で古い
レガシー状態を修復でき、さらにサポート対象ソースからPluginを
インストール、読み込み、更新、アンインストールできることを証明します。

より広いテストランナーのマップについては、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダーの
キーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護対象

更新とPluginテストは、次の契約を保護します。

- パッケージのtarballが完全で、有効な`dist/postinstall-inventory.json`を持ち、
  展開済みのリポジトリファイルに依存しない。
- ユーザーが、古い公開済みパッケージから候補パッケージへ、
  config、エージェント、セッション、ワークスペース、Plugin許可リスト、または
  チャンネルconfigを失わずに移行できる。
- `openclaw doctor --fix --non-interactive`がレガシーのクリーンアップと修復
  パスを所有する。起動処理は、古い
  Plugin状態のための隠れた互換性マイグレーションを増やすべきではない。
- Pluginインストールがローカルディレクトリ、gitリポジトリ、npmパッケージ、および
  ClawHubレジストリパスから機能する。
- Pluginのnpm依存関係はPluginごとに1つの管理されたnpmプロジェクトへインストールされ、
  信頼前にスキャンされ、アンインストール時にはnpm経由で削除されるため、巻き上げられた
  依存関係が残らない。
- 何も変わっていない場合、Plugin更新は安定している。インストール記録、解決済み
  ソース、インストール済み依存関係レイアウト、および有効状態がそのまま保たれる。

## 開発中のローカル証明

狭い範囲から始めます。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pluginのインストール、アンインストール、依存関係、またはパッケージインベントリの変更については、
編集した境界をカバーする重点テストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージDockerレーンがtarballを消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check`はconfig/docs/APIドリフトチェックを実行し、パッケージdist
インベントリを書き込み、`npm pack --dry-run`を実行し、禁止された梱包ファイルを拒否し、
tarballを一時prefixへインストールし、postinstallを実行し、バンドルされたチャンネル
エントリポイントをスモークします。

## Dockerレーン

Dockerレーンはプロダクトレベルの証明です。Linuxコンテナ内で実際の
パッケージをインストールまたは更新し、CLIコマンド、Gateway起動、
HTTPプローブ、RPCステータス、およびファイルシステム状態を通じて挙動を検証します。

反復中は重点レーンを使います。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要なレーン:

- `test:docker:plugins`はPluginインストールスモーク、ローカルフォルダーインストール、
  ローカルフォルダー更新スキップ挙動、事前インストール済み
  依存関係を持つローカルフォルダー、`file:`パッケージインストール、CLI実行を伴うgitインストール、git
  moving-ref更新、巻き上げられた推移的
  依存関係を持つnpmレジストリインストール、npm更新のno-op、不正なnpmパッケージメタデータの拒否、
  ローカルClawHub fixtureインストールと更新no-op、マーケットプレイス更新挙動、
  およびClaudeバンドルの有効化/検査を検証します。`OPENCLAW_PLUGINS_E2E_CLAWHUB=0`を設定すると、
  ClawHubブロックを密閉/オフラインに保てます。
- `test:docker:plugin-lifecycle-matrix`は空の
  コンテナに候補パッケージをインストールし、npm Pluginをインストール、検査、無効化、有効化、
  明示的アップグレード、明示的ダウングレード、Plugin
  コード削除後のアンインストールまで実行します。各フェーズのRSSとCPUメトリクスをログします。
- `test:docker:plugin-update`は、変更のないインストール済みPluginが
  `openclaw plugins update`中に再インストールされたりインストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor`は、汚れた
  旧ユーザーfixtureの上に候補tarballをインストールし、パッケージ更新と非対話doctorを実行してから、
  loopback Gatewayを起動し、状態保持をチェックします。
- `test:docker:published-upgrade-survivor`はまず公開済みベースラインをインストールし、
  焼き込み済みの`openclaw config set`レシピを通じて設定し、それを
  候補tarballへ更新し、doctorを実行し、レガシークリーンアップをチェックし、Gatewayを起動し、
  `/healthz`、`/readyz`、およびRPCステータスをプローブします。
- `test:docker:update-restart-auth`は候補パッケージをインストールし、
  管理されたtoken-auth Gatewayを起動し、`openclaw update --yes --json`用に
  呼び出し元gateway auth envを解除し、通常のプローブの前に候補更新コマンドが
  Gatewayを再起動することを要求します。
- `test:docker:update-migration`はクリーンアップ重視の公開済み更新レーンです。
  設定済みのDiscord/Telegram風ユーザー状態から開始し、設定済みPlugin依存関係が実体化する機会を持てるように
  ベースラインdoctorを実行し、設定済みパッケージ化PluginのレガシーPlugin依存関係の残骸をseedし、
  候補tarballへ更新し、更新後doctorがレガシー
  依存関係rootを削除することを要求します。

有用な公開済みアップグレードsurvivorバリアント:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能なシナリオは`base`、`feishu-channel`、`bootstrap-persona`、
`plugin-deps-cleanup`、`configured-plugin-installs`、
`stale-source-plugin-shadow`、`tilde-log-path`、および`versioned-runtime-deps`です。集約実行では、
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`が、設定済みPluginインストールマイグレーションを含む、
報告済みissue形状のすべてのシナリオへ展開されます。

完全更新マイグレーションはFull Release CIから意図的に分離されています。リリース上の問いが「2026.4.23以降のすべての
公開済みstableリリースがこの候補へ更新でき、
Plugin依存関係の残骸をクリーンアップできるか」である場合は、手動の`Update Migration`ワークフローを使います。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## パッケージ受け入れ

パッケージ受け入れはGitHubネイティブのパッケージゲートです。1つの候補
パッケージを`package-under-test` tarballへ解決し、バージョンとSHA-256を記録してから、
再利用可能なDocker E2Eレーンをその正確なtarballに対して実行します。ワークフローハーネス
refはパッケージソースrefとは分離されているため、現在のテストロジックで
古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な
  公開済みバージョンを検証します。
- `source=ref`: 選択された現在の
  ハーネスで、信頼済みbranch、tag、またはcommitをpackします。
- `source=url`: 必須の`package_sha256`を持つ公開HTTPS tarballを検証します。
  このパスはURL認証情報、非デフォルトHTTPSポート、private/internal
  ホスト名またはDNS/IP結果、special-use IP空間、および安全でないリダイレクトを拒否します。
- `source=trusted-url`: 必須の
  `package_sha256`と`trusted_source_id`を持つHTTPS tarballを、`.github/package-trusted-sources.json`内のメンテナー所有ポリシーに照らして検証します。
  入力レベルのallow-private
  スイッチで`source=url`を弱める代わりに、enterprise/private
  ミラーにはこれを使います。Bearer authは、ポリシーで設定されている場合、固定の
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secretを使います。
- `source=artifact`: 別のActions runがアップロードしたtarballを再利用します。

完全リリース検証はデフォルトで`source=artifact`を使用し、解決済みリリースSHAから構築されます。
公開後の証明では、
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`を渡し、同じアップグレードmatrixが
出荷済みnpmパッケージを対象にするようにします。

リリースチェックは、package/update/restart/pluginセットでパッケージ受け入れを呼び出します。

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

リリースsoakが有効な場合は、次も渡します。

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、デフォルトのリリースパッケージゲートにすべての公開済みリリースを歩かせることなく、
同じ解決済み成果物上で、パッケージマイグレーション、更新チャンネル切り替え、破損した管理対象Pluginへの
耐性、古いPlugin依存関係のクリーンアップ、オフラインPluginカバレッジ、Plugin
更新挙動、およびTelegramパッケージQAを維持します。

`last-stable-4`は、npm公開済みOpenClaw
stableリリースの最新4つへ解決されます。リリースパッケージ受け入れでは、`2026.4.23`を最初のPlugin更新
互換性境界、`2026.5.2`をPluginアーキテクチャchurn境界、
`2026.4.15`を古い2026.4.1x公開済み更新ベースラインとしてpinします。resolverは
最新4つにすでに含まれるpinを重複排除します。包括的な公開済み
更新マイグレーションカバレッジには、Full Release CIではなく、別個のUpdate
Migrationワークフローで`all-since-2026.4.23`を使います。レガシーの事前日付
アンカーも必要な手動のより広いサンプリングでは、`release-history`が引き続き
利用できます。

複数の公開済みアップグレードsurvivorベースラインが選択されている場合、再利用可能な
Dockerワークフローは各ベースラインをそれぞれ専用runner jobへshardします。各
ベースラインshardは引き続き選択されたシナリオセットを実行しますが、ログと成果物は
ベースラインごとに保たれ、経過時間は大きな
直列job1つではなく最も遅いshardにより制限されます。

リリース前に候補を検証するときは、package profileを手動で実行します。

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

リリース上の問いにMCPチャンネル、cron/subagentクリーンアップ、OpenAI web search、またはOpenWebUIが含まれる場合は、
`suite_profile=product`を使います。完全なDockerリリースパスカバレッジが必要な場合にのみ、
`suite_profile=full`を使います。

## リリースデフォルト

リリース候補では、デフォルトの証明スタックは次のとおりです。

1. ソースレベルの回帰に対する`pnpm check:changed`と`pnpm test:changed`。
2. パッケージ成果物の整合性に対する`pnpm release:check`。
3. install/update/restart/plugin契約に対するパッケージ受け入れ`package` profileまたはrelease-checkのカスタムパッケージ
   レーン。
4. OS固有のインストーラー、オンボーディング、およびプラットフォーム
   挙動に対するクロスOSリリースチェック。
5. 変更された表面がプロバイダーまたはホスト型サービス
   挙動に触れる場合のみライブスイート。

メンテナーのマシンでは、明示的にローカル証明を行う場合を除き、広いゲートとDocker/パッケージのプロダクト証明は
Testboxで実行するべきです。

## レガシー互換性

互換性の寛容さは狭く、期限付きです。

- `2026.4.25`までのパッケージ（`2026.4.25-beta.*`を含む）は、
  パッケージ受け入れで、すでに出荷済みのパッケージメタデータ欠落を許容できる。
- 公開済みの`2026.4.26`パッケージは、すでに出荷済みのローカルビルドメタデータstamp
  ファイルについて警告できる。
- それ以降のパッケージは現代的な契約を満たす必要がある。同じ欠落は
  警告またはスキップではなく失敗になる。

これらの古い形状に対して新しい起動時マイグレーションを追加しないでください。doctor
修復を追加または拡張し、更新コマンドが再起動を所有する場合は、`upgrade-survivor`、`published-upgrade-survivor`、または
`update-restart-auth`で証明します。

## カバレッジの追加

更新またはPlugin挙動を変更する場合、正しい理由で失敗できる
最も低いレイヤーにカバレッジを追加します。

- 純粋なパスまたはメタデータのロジック: ソースの隣にユニットテストを置く。
- パッケージインベントリまたは梱包済みファイルの挙動: `package-dist-inventory` または tarball
  チェッカーテスト。
- CLI インストール/更新の挙動: Docker レーンのアサーションまたはフィクスチャ。
- 公開済みリリースの移行挙動: `published-upgrade-survivor` シナリオ。
- 更新が所有する再起動の挙動: `update-restart-auth`。
- レジストリ/パッケージソースの挙動: `test:docker:plugins` フィクスチャまたは ClawHub
  フィクスチャサーバー。
- 依存関係レイアウトまたはクリーンアップの挙動: ランタイム実行と
  ファイルシステム境界の両方を検証する。npm 依存関係は Plugin の
  管理対象 npm プロジェクト内に巻き上げられる場合があるため、テストでは Plugin パッケージローカルの `node_modules` ツリーだけを前提にせず、そのプロジェクトがスキャン/クリーンアップされることを証明する必要がある。

新しい Docker フィクスチャはデフォルトで自己完結に保つ。テストの目的がライブレジストリの挙動でない限り、ローカルのフィクスチャレジストリと
偽パッケージを使用する。

## 失敗のトリアージ

アーティファクトの識別情報から始める:

- Package Acceptance の `resolve_package` サマリー: ソース、バージョン、SHA-256、アーティファクト名。
- Docker アーティファクト: `.artifacts/docker-tests/**/summary.json`、
  `failures.json`、レーンログ、再実行コマンド。
- アップグレードサバイバーのサマリー: `.artifacts/upgrade-survivor/summary.json`、
  ベースラインバージョン、候補バージョン、シナリオ、フェーズのタイミング、レシピ手順を含む。

リリース全体の包括的な再実行よりも、同じパッケージアーティファクトで失敗した正確なレーンを再実行することを優先する。
