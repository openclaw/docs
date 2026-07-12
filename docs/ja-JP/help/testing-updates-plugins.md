---
read_when:
    - OpenClaw の更新、doctor、パッケージ受け入れ、または Plugin のインストール動作の変更
    - リリース候補の準備または承認
    - パッケージ更新、Plugin の依存関係整理、または Plugin インストールのリグレッションをデバッグする
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストールおよび更新動作を検証する仕組み
title: テスト：アップデートとプラグイン
x-i18n:
    generated_at: "2026-07-11T22:19:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新およびPlugin検証のチェックリスト：インストール可能なパッケージが
実際のユーザー状態を更新でき、`doctor` を通じて古いレガシー状態を修復でき、
サポート対象のすべてのソースからPluginを引き続きインストール、読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの一覧については、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダーの
キーおよびネットワークにアクセスするスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護対象

- パッケージのtarballが完全で、有効な`dist/postinstall-inventory.json`を含み、
  展開されていないリポジトリファイルに依存しないこと。
- ユーザーが、設定、エージェント、セッション、ワークスペース、Plugin許可リスト、
  またはチャンネル設定を失うことなく、公開済みの古いパッケージから候補パッケージへ移行できること。
- `openclaw doctor --fix --non-interactive`がレガシーなクリーンアップおよび修復
  パスを担うこと。起動処理に、古いPlugin状態のための隠れた互換性移行を追加しないこと。
- Pluginのインストールが、ローカルディレクトリ、gitリポジトリ、npmパッケージ、
  およびClawHubレジストリのパスから機能すること。
- Pluginのnpm依存関係が、Pluginごとに1つの管理対象npmプロジェクトへインストールされ、
  信頼する前にスキャンされ、Pluginのアンインストール時に`npm uninstall`によって
  削除されるため、巻き上げられた依存関係が残存しないこと。
- 何も変更されていない場合、Pluginの更新は何もしないこと。インストール記録、解決済み
  ソース、インストール済み依存関係の配置、および有効化状態がそのまま維持されること。

## 開発中のローカル検証

まず対象を絞ります。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pluginのインストール、アンインストール、依存関係、またはパッケージインベントリを変更した場合は、
編集した境界を対象とするテストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ用Dockerレーンでtarballを使用する前に、パッケージ成果物を検証します。

```bash
pnpm release:check
```

`release:check`は、設定、ドキュメント、APIのドリフトチェック（設定スキーマ、設定ドキュメントの
ベースライン、Plugin SDK APIのベースラインとエクスポート、Pluginのバージョンとインベントリ）を実行し、
パッケージのdistインベントリを書き込み、`npm pack --dry-run`を実行し、パッケージへの同梱が禁止された
ファイルを拒否し、tarballを一時プレフィックスへインストールしてpostinstallを実行し、
同梱チャンネルのエントリポイントをスモークテストします。

## Dockerレーン

Dockerレーンは製品レベルの検証です。Linuxコンテナ内で実際の
パッケージをインストールまたは更新し、CLIコマンド、Gatewayの起動、HTTPプローブ、
RPCステータス、およびファイルシステムの状態を通じて動作を検証します。

反復作業中は対象を絞ったレーンを使用します。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要なレーン：

- `test:docker:plugins`は、Pluginインストールのスモークテスト、ローカルフォルダーからのインストール、
  ローカルフォルダーの更新スキップ動作、依存関係が事前インストールされたローカルフォルダー、
  `file:`パッケージのインストール、CLI実行を伴うgitインストール、移動するgit参照の更新、
  巻き上げられた推移的依存関係を伴うnpmレジストリからのインストール、npm更新時の無処理、
  不正なnpmパッケージメタデータの拒否、ローカルClawHubフィクスチャのインストールと更新時の無処理、
  マーケットプレイスの更新動作、およびClaudeバンドルの有効化と検査を対象とします。
  ClawHub部分を自己完結型かつオフラインに保つには、`OPENCLAW_PLUGINS_E2E_CLAWHUB=0`を設定します。
- `test:docker:plugin-lifecycle-matrix`は、最小構成のコンテナに候補パッケージをインストールし、
  npm Pluginについて、インストール、検査、無効化、有効化、明示的なアップグレード、
  明示的なダウングレードを実行し、Pluginコードを削除した後にアンインストールします。
  フェーズごとにRSSおよびCPUメトリクスを記録します。
- `test:docker:plugin-update`は、インストール済みPluginに変更がない場合に、
  `openclaw plugins update`の実行中に再インストールされたり、インストールメタデータが失われたりしないことを検証します。
- `test:docker:upgrade-survivor`は、汚れた旧ユーザーフィクスチャに候補tarballを上書きインストールし、
  パッケージ更新と非対話型doctorを実行した後、loopback Gatewayを起動して状態が保持されていることを確認します。
- `test:docker:published-upgrade-survivor`は、最初に公開済みのベースラインをインストールし、
  組み込みの`openclaw config set`手順で設定し、候補tarballへ更新してdoctorを実行し、
  レガシー状態のクリーンアップを確認してGatewayを起動し、`/healthz`、`/readyz`、
  およびRPCステータスをプローブします。
- `test:docker:update-restart-auth`は、候補パッケージをインストールし、
  管理対象のトークン認証Gatewayを起動し、`openclaw update --yes --json`用の
  呼び出し元Gateway認証環境変数を解除して、通常のプローブを行う前に、
  候補の更新コマンドによってGatewayが再起動されることを要求します。
- `test:docker:update-migration`は、クリーンアップを重点的に行う公開済みパッケージ更新レーンです。
  設定済みのDiscord/Telegram形式のユーザー状態から開始し、設定済みPluginの依存関係を
  実体化できるようにベースラインのdoctorを実行し、設定済みのパッケージ化Pluginに対して
  レガシーなPlugin依存関係の残骸を配置し、候補tarballへ更新した後、
  更新後のdoctorがレガシーな依存関係ルートを削除することを要求します。

公開済みアップグレードサバイバーの便利なバリエーション：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能なシナリオ：`base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、
`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、
`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path`、
および`versioned-runtime-deps`。集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
（別名`far-reaching`）が、設定済みPluginのインストール移行を含むすべてのシナリオに展開されます。

完全な更新移行は、意図的に完全リリースCIから分離されています。リリースに関する問いが
「2026.4.23以降に公開されたすべての安定版リリースからこの候補へ更新し、
Plugin依存関係の残骸をクリーンアップできるか？」である場合は、手動の`Update Migration`
ワークフローを使用します。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## パッケージ受け入れテスト

パッケージ受け入れテストは、GitHubネイティブのパッケージゲートです。1つの候補
パッケージを`package-under-test` tarballとして解決し、バージョンとSHA-256を記録した後、
その正確なtarballに対して再利用可能なDocker E2Eレーンを実行します。ワークフローハーネスの
参照はパッケージソースの参照から分離されているため、現在のテストロジックで古い信頼済みリリースを検証できます。

候補ソース：

- `source=npm`：`openclaw@extended-stable`、`openclaw@beta`、
  `openclaw@latest`、または公開済みの正確なバージョンを検証します。
- `source=ref`：選択した現在のハーネスを使用して、信頼済みのブランチ、タグ、
  またはコミットをパッケージ化します。
- `source=url`：必須の`package_sha256`を指定して公開HTTPS tarballを検証します。
  このパスは、URL認証情報、デフォルト以外のHTTPSポート、プライベートまたは内部の
  ホスト名やDNS/IP結果、特殊用途のIP空間、および安全でないリダイレクトを拒否します。
- `source=trusted-url`：必須の`package_sha256`と`trusted_source_id`を指定した
  HTTPS tarballを、`.github/package-trusted-sources.json`内のメンテナー管理ポリシーに
  照らして検証します。入力レベルのプライベート許可スイッチによって`source=url`を
  弱める代わりに、エンタープライズまたはプライベートミラーではこれを使用します。
  ポリシーで設定されている場合、Bearer認証では固定の`OPENCLAW_TRUSTED_PACKAGE_TOKEN`
  シークレットを使用します。
- `source=artifact`：別のActions実行によってアップロードされたtarballを再利用します。

完全リリース検証では、解決済みリリースSHAからビルドされた`source=artifact`を
デフォルトで使用します。公開後の検証では、
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`を渡すことで、同じアップグレードマトリクスが
リリース済みのnpmパッケージを対象とするようにします。

リリースチェックは、パッケージ、更新、再起動、Pluginの次のセットを指定してパッケージ受け入れテストを呼び出します。

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

リリースのソークテストが有効な場合（`release_profile=stable`および
`full`では強制的に有効）、次の値も渡します。

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、デフォルトのリリースパッケージゲートですべての公開済みリリースを走査することなく、
パッケージ移行、更新チャンネルの切り替え、破損した管理対象Pluginへの耐性、
古いPlugin依存関係のクリーンアップ、オフラインPluginの検証範囲、Plugin更新の動作、
およびTelegramパッケージQAを、同じ解決済み成果物に対して検証できます。

`last-stable-4`は、npmで公開された最新4件のOpenClaw安定版リリースへ解決されます。
リリースパッケージ受け入れテストでは、`2026.4.23`を最初のPlugin更新互換性境界、
`2026.5.2`をPluginアーキテクチャの大幅変更境界、`2026.4.15`を2026.4.1x系の
より古い公開済み更新ベースラインとして固定します。リゾルバーは、最新4件にすでに含まれる
固定値を重複排除します。公開済み更新移行を網羅的に検証する場合は、完全リリースCIではなく、
別個の更新移行ワークフローで`all-since-2026.4.23`を使用します。
以前の日付を対象とするレガシーな基準点も含めて、より広く手動サンプリングする場合は、
引き続き`release-history`を使用できます。

複数の公開済みアップグレードサバイバーのベースラインを選択すると、再利用可能な
Dockerワークフローは各ベースラインを個別の対象ランナージョブに分割します。各ベースラインの
シャードでは選択されたシナリオセットが引き続き実行されますが、ログと成果物はベースラインごとに
保持され、所要時間は1つの大きな直列ジョブではなく、最も遅いシャードによって決まります。

リリース前に候補を検証する場合は、パッケージプロファイルを手動で実行します。

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

公開済みextended-stableカナリアでは、
`package_spec=openclaw@extended-stable`を設定します。パッケージ受け入れテストは、
Dockerレーンを実行する前に、そのセレクターを正確なtarballへ解決します。

リリースに関する問いにMCPチャンネル、cron/サブエージェントのクリーンアップ、
OpenAI Web検索、またはOpenWebUIが含まれる場合は、`suite_profile=product`を使用します。
Dockerのリリースパスを完全に網羅する必要がある場合にのみ、`suite_profile=full`を使用します。

## リリース時のデフォルト

リリース候補に対するデフォルトの検証構成は次のとおりです。

1. ソースレベルのリグレッションを検出するための`pnpm check:changed`と`pnpm test:changed`。
2. パッケージ成果物の完全性を検証するための`pnpm release:check`。
3. インストール、更新、再起動、Pluginの契約を検証するための、パッケージ受け入れテストの
   `package`プロファイルまたはリリースチェックのカスタムパッケージレーン。
4. OS固有のインストーラー、オンボーディング、プラットフォーム動作を検証するためのクロスOSリリースチェック。
5. 変更された範囲がプロバイダーまたはホスト型サービスの動作に関係する場合にのみライブスイート。

メンテナーのマシンでは、ローカル検証を明示的に行う場合を除き、広範なゲートと
Docker/パッケージの製品検証をTestboxで実行する必要があります。

## レガシー互換性

互換性に関する緩和は限定的で、期間も制限されています。

- `2026.4.25-beta.*`を含む`2026.4.25`までのパッケージでは、パッケージ受け入れテストにおいて、
  すでにリリース済みのパッケージメタデータの欠落を許容する場合があります。
- 公開済みの`2026.4.26`パッケージでは、すでにリリースされたローカルビルドメタデータの
  スタンプファイルについて警告する場合があります。
- それ以降のパッケージは、現行の契約を満たす必要があります。同じ欠落は、
  警告やスキップではなく失敗になります。

これらの古い形式に対して新しい起動時移行を追加しないでください。doctorによる修復を追加または拡張し、
`upgrade-survivor`、`published-upgrade-survivor`、または更新コマンドが再起動を担う場合は
`update-restart-auth`を使用して検証してください。

## 検証範囲の追加

更新またはPluginの動作を変更する場合は、適切な理由で失敗できる最下層に検証を追加します。

- 純粋なパスまたはメタデータのロジック：ソースの隣にユニットテストを配置する。
- パッケージのインベントリまたはパック済みファイルの動作：`package-dist-inventory` または tarball
  チェッカーテスト。
- CLI のインストール／更新動作：Docker レーンのアサーションまたはフィクスチャ。
- 公開済みリリースの移行動作：`published-upgrade-survivor` シナリオ。
- 更新処理が担う再起動動作：`update-restart-auth`。
- レジストリ／パッケージソースの動作：`test:docker:plugins` フィクスチャまたは ClawHub
  フィクスチャサーバー。
- 依存関係の配置またはクリーンアップ動作：ランタイム実行とファイルシステム境界の
  両方を検証する。npm の依存関係は Plugin の管理対象 npm プロジェクト内で
  ホイストされる可能性があるため、テストでは Plugin パッケージローカルの
  `node_modules` ツリーのみを前提とせず、そのプロジェクトがスキャン／クリーンアップ
  されることを実証する必要がある。

新しい Docker フィクスチャは、デフォルトで自己完結型に保つ。テストの目的が
実際のレジストリ動作でない限り、ローカルのフィクスチャレジストリと偽のパッケージを使用する。

## 障害のトリアージ

まずアーティファクトの識別情報から確認する：

- Package Acceptance の `resolve_package` サマリー：ソース、バージョン、SHA-256、
  およびアーティファクト名。
- Docker アーティファクト：`.artifacts/docker-tests/**/summary.json`、
  `failures.json`、レーンログ、および再実行コマンド。
- アップグレードサバイバーのサマリー：`.artifacts/upgrade-survivor/summary.json`。
  ベースラインバージョン、候補バージョン、シナリオ、各フェーズの所要時間、
  および設定レシピのカバレッジを含む。

リリース全体の包括的なテストを再実行するよりも、同じパッケージアーティファクトを使用して、
失敗した正確なレーンを再実行することを優先する。
