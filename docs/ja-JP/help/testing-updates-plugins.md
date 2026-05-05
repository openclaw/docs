---
read_when:
    - OpenClawの更新、doctor、パッケージ受け入れ、またはPluginインストールの動作の変更
    - リリース候補の準備または承認
    - パッケージ更新、Plugin 依存関係のクリーンアップ、または Plugin インストールのリグレッションのデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とPlugin'
x-i18n:
    generated_at: "2026-05-05T06:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは更新と Plugin 検証専用のチェックリストです。目標は
シンプルです。インストール可能なパッケージが実際のユーザー状態を更新でき、
`doctor` を通じて古いレガシー状態を修復でき、さらにサポートされているソースから
Plugin をインストール、読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの一覧については、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダー
キーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護するもの

更新と Plugin テストは、次の契約を保護します。

- パッケージ tarball が完全で、有効な `dist/postinstall-inventory.json` を持ち、
  展開されていないリポジトリファイルに依存しないこと。
- ユーザーが、古い公開済みパッケージから候補パッケージへ移行しても、
  config、agents、sessions、workspaces、Plugin allowlists、channel config を失わないこと。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復
  パスを所有すること。起動処理に、古い Plugin 状態向けの隠れた互換性マイグレーションを増やすべきではありません。
- Plugin のインストールが、ローカルディレクトリ、git リポジトリ、npm パッケージ、
  ClawHub レジストリパスから動作すること。
- Plugin の npm 依存関係が管理対象 npm ルートにインストールされ、信頼前にスキャンされ、
  アンインストール時に npm 経由で削除されることで、hoist された依存関係が残らないこと。
- 何も変更されていない場合の Plugin 更新が安定していること。インストール記録、解決済み
  ソース、インストール済み依存関係レイアウト、有効状態が維持されます。

## 開発中のローカル証明

まずは狭く始めます。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin のインストール、アンインストール、依存関係、またはパッケージインベントリを変更した場合は、
編集した接点をカバーする集中テストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ Docker レーンが tarball を消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は config/docs/API drift チェックを実行し、package dist
inventory を書き込み、`npm pack --dry-run` を実行し、禁止された packed files を拒否し、
tarball を一時 prefix にインストールし、postinstall を実行し、バンドル済み channel
entrypoints を smoke します。

## Docker レーン

Docker レーンは製品レベルの証明です。Linux コンテナ内で実際の
パッケージをインストールまたは更新し、CLI コマンド、Gateway 起動、HTTP probes、
RPC status、ファイルシステム状態を通じて挙動を検証します。

反復中は集中レーンを使用します。

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

- `test:docker:plugins` は、Plugin install smoke、ローカルフォルダーインストール、
  ローカルフォルダー更新のスキップ挙動、依存関係が事前インストールされたローカルフォルダー、
  `file:` パッケージインストール、CLI 実行を伴う git インストール、git
  moving-ref 更新、hoist された推移的依存関係を伴う npm レジストリインストール、
  npm update no-op、ローカル ClawHub fixture インストールと update no-op、
  marketplace 更新挙動、Claude-bundle enable/inspect を検証します。
  ClawHub ブロックを hermetic/offline に保つには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-lifecycle-matrix` は、bare
  コンテナに候補パッケージをインストールし、npm Plugin を install、inspect、disable、enable、
  explicit upgrade、explicit downgrade、Plugin コード削除後の uninstall まで実行します。
  各フェーズの RSS と CPU metrics をログに記録します。
- `test:docker:plugin-update` は、変更のないインストール済み Plugin が
  `openclaw plugins update` 中に再インストールされたり、インストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、dirty
  old-user fixture の上に候補 tarball をインストールし、パッケージ更新と non-interactive doctor を実行してから、
  loopback Gateway を起動し、状態の保持を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済みベースラインをインストールし、
  焼き込まれた `openclaw config set` レシピで構成し、候補 tarball に更新し、doctor を実行し、
  レガシークリーンアップを確認し、Gateway を起動し、`/healthz`、`/readyz`、RPC status を probe します。
- `test:docker:update-restart-auth` は、候補パッケージをインストールし、
  管理対象の token-auth Gateway を起動し、`openclaw update --yes --json` のために呼び出し元の gateway auth env を解除し、
  通常の probe の前に、候補 update コマンドが Gateway を再起動することを要求します。
- `test:docker:update-migration` は、クリーンアップが多い published-update レーンです。
  構成済みの Discord/Telegram 風ユーザー状態から開始し、構成済み Plugin 依存関係が実体化する機会を得られるよう baseline
  doctor を実行し、構成済み packaged Plugin 向けにレガシー Plugin dependency debris を seed し、
  候補 tarball に更新し、post-update doctor がレガシー依存関係ルートを削除することを要求します。

便利な published-upgrade survivor バリアント:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能なシナリオは `base`、`feishu-channel`、`bootstrap-persona`、
`plugin-deps-cleanup`、`configured-plugin-installs`、
`stale-source-plugin-shadow`、`tilde-log-path`、`versioned-runtime-deps` です。集約実行では、
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` が、構成済み Plugin install migration を含む、報告済み issue 形状の全シナリオに展開されます。

Full update migration は、Full Release CI から意図的に分離されています。リリース上の問いが「2026.4.23 以降のすべての公開済み stable release がこの候補へ更新でき、
Plugin dependency debris をクリーンアップできるか」である場合は、手動の `Update Migration` workflow を使用します。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance は GitHub ネイティブのパッケージゲートです。1 つの候補
パッケージを `package-under-test` tarball に解決し、version と SHA-256 を記録してから、
その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。workflow harness
ref は package source ref から分離されているため、現在のテストロジックで古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な
  公開済みバージョンを検証します。
- `source=ref`: 選択された現在の harness で、信頼済み branch、tag、または commit を pack します。
- `source=url`: 必須の `package_sha256` を伴う HTTPS tarball を検証します。
- `source=artifact`: 別の Actions run によってアップロードされた tarball を再利用します。

Full Release Validation は、デフォルトで `source=artifact` を使用し、
解決済みリリース SHA から構築されます。公開後の証明では、
`package_acceptance_package_spec=openclaw@YYYY.M.D` を渡し、同じ upgrade matrix が出荷済み npm パッケージを対象にするようにします。

Release checks は、package/update/restart/plugin セットで Package Acceptance を呼び出します。

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

release soak が有効な場合は、次も渡します。

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、package migration、update channel switching、古い Plugin dependency
cleanup、offline Plugin coverage、Plugin update behavior、Telegram package
QA が同じ解決済み成果物上に保たれ、デフォルトのリリースパッケージゲートが
すべての公開済みリリースを巡回することはありません。

`last-stable-4` は、npm に公開された最新 4 つの stable OpenClaw
release に解決されます。Release package acceptance は、`2026.4.23` を最初の Plugin-update
互換性境界として、`2026.5.2` を Plugin-architecture churn 境界として、
`2026.4.15` を古い 2026.4.1x published-update baseline として pin します。resolver は、
最新 4 件にすでに含まれる pin を重複排除します。包括的な published
update migration coverage には、Full Release CI ではなく、別個の Update
Migration workflow で `all-since-2026.4.23` を使用します。legacy pre-date
anchor も含めたより広い手動サンプリングが必要な場合は、`release-history` も引き続き利用できます。

複数の published-upgrade survivor baseline が選択されている場合、再利用可能な
Docker workflow は各 baseline を専用 runner job に shard します。各
baseline shard は選択された scenario set を引き続き実行しますが、logs と artifacts は
baseline ごとに分かれ、wall time は 1 つの大きな serial job ではなく最も遅い shard によって制限されます。

リリース前に候補を検証する場合は、package profile を手動実行します。

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

リリース上の問いに MCP channels、cron/subagent cleanup、OpenAI web search、または OpenWebUI が含まれる場合は、`suite_profile=product` を使用します。完全な Docker release-path coverage が必要な場合にのみ、`suite_profile=full` を使用します。

## リリースのデフォルト

リリース候補では、デフォルトの証明スタックは次のとおりです。

1. ソースレベルの回帰向けに `pnpm check:changed` と `pnpm test:changed`。
2. パッケージ成果物の整合性向けに `pnpm release:check`。
3. install/update/restart/plugin 契約向けに Package Acceptance `package` profile、または release-check custom package
   lanes。
4. OS 固有の installer、オンボーディング、platform
   behavior 向けに Cross-OS release checks。
5. 変更面が provider または hosted-service
   behavior に触れる場合のみ、live suites。

メンテナーマシンでは、明示的にローカル証明を行う場合を除き、広範なゲートと Docker/package product proof は
Testbox で実行するべきです。

## レガシー互換性

互換性の緩和は狭く、期限付きです。

- `2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、
  Package Acceptance で、すでに出荷済みの package metadata gaps を許容できます。
- 公開済みの `2026.4.26` パッケージは、すでに出荷済みの local build metadata stamp
  files について警告してもかまいません。
- それ以降のパッケージは現代の契約を満たす必要があります。同じ gaps は
  警告やスキップではなく失敗になります。

これらの古い形状向けに新しい起動時マイグレーションを追加しないでください。doctor
repair を追加または拡張し、更新コマンドが再起動を所有する場合は `upgrade-survivor`、`published-upgrade-survivor`、または
`update-restart-auth` で証明します。

## カバレッジの追加

更新または Plugin の挙動を変更する場合は、正しい理由で失敗できる最下層にカバレッジを追加します。

- Pure path または metadata logic: ソースの隣の unit test。
- Package inventory または packed-file behavior: `package-dist-inventory` または tarball
  checker test。
- CLI install/update behavior: Docker lane assertion または fixture。
- Published-release migration behavior: `published-upgrade-survivor` scenario。
- Update-owned restart behavior: `update-restart-auth`。
- Registry/package source behavior: `test:docker:plugins` fixture または ClawHub
  fixture server。
- Dependency layout または cleanup behavior: runtime execution と
  filesystem boundary の両方をアサートします。npm dependencies は managed npm
  root 配下に hoist される場合があるため、tests は package-local の `node_modules` tree を仮定するのではなく、root が scan/clean されることを証明するべきです。

新しい Docker fixtures はデフォルトで hermetic に保ちます。テストの目的が live registry behavior でない限り、
ローカル fixture registries と fake packages を使用します。

## 失敗のトリアージ

まず artifact identity から始めます。

- パッケージ受け入れ `resolve_package` の概要: ソース、バージョン、SHA-256、および
  アーティファクト名。
- Docker アーティファクト: `.artifacts/docker-tests/**/summary.json`、
  `failures.json`、レーンログ、および再実行コマンド。
- アップグレードサバイバーの概要: `.artifacts/upgrade-survivor/summary.json`、
  ベースラインバージョン、候補バージョン、シナリオ、フェーズタイミング、および
  レシピ手順を含む。

リリース全体のアンブレラを再実行するよりも、同じパッケージアーティファクトで失敗した正確なレーンを再実行することを優先してください。
