---
read_when:
    - OpenClaw の更新、doctor、パッケージ受け入れ、または Plugin インストール動作の変更
    - リリース候補の準備または承認
    - パッケージ更新、Plugin 依存関係のクリーンアップ、または Plugin インストールのリグレッションをデバッグする
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とプラグイン'
x-i18n:
    generated_at: "2026-07-05T11:30:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

更新と Plugin 検証のチェックリスト: インストール可能なパッケージが実際のユーザー状態を
更新でき、`doctor` を通じて古いレガシー状態を修復でき、サポートされるすべてのソースから
Plugin をインストール、読み込み、更新、アンインストールできることを証明する。

より広範なテストランナーのマップについては、[テスト](/ja-JP/help/testing)を参照。ライブプロバイダーの
キーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照。

## 保護するもの

- パッケージ tarball が完全で、有効な `dist/postinstall-inventory.json` を持ち、
  展開されていないリポジトリファイルに依存していない。
- ユーザーが古い公開済みパッケージから候補パッケージへ移行しても、
  config、agents、sessions、workspaces、Plugin allowlist、channel config を失わない。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復
  パスを所有する。起動処理に、古い Plugin 状態向けの隠れた互換性 migration を増やすべきではない。
- Plugin のインストールが、ローカルディレクトリ、git リポジトリ、npm パッケージ、
  ClawHub レジストリパスから機能する。
- Plugin の npm 依存関係は Plugin ごとに 1 つの管理された npm プロジェクトへ
  インストールされ、信頼前にスキャンされ、Plugin のアンインストール中に
  `npm uninstall` を通じて削除されるため、hoist された依存関係が残らない。
- 何も変わっていない場合、Plugin 更新は no-op になる: インストール記録、解決済み
  ソース、インストール済み依存関係のレイアウト、有効状態はそのまま保たれる。

## 開発中のローカル証明

狭い範囲から始める:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin のインストール、アンインストール、依存関係、またはパッケージ inventory の変更では、
編集した境界をカバーする重点テストも実行する:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ Docker lane が tarball を消費する前に、パッケージ artifact を証明する:

```bash
pnpm release:check
```

`release:check` は config/docs/API の drift チェック（config schema、config docs
baseline、Plugin SDK API baseline と exports、Plugin versions/inventory）を実行し、
package dist inventory を書き込み、`npm pack --dry-run` を実行し、禁止された
packed file を拒否し、tarball を一時 prefix にインストールし、postinstall を実行し、
同梱 channel entrypoint を smoke する。

## Docker lane

Docker lane は製品レベルの証明である。Linux container 内で実際のパッケージを
インストールまたは更新し、CLI コマンド、Gateway 起動、HTTP probe、RPC status、
ファイルシステム状態を通じて挙動を検証する。

反復中は重点 lane を使う:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要な lane:

- `test:docker:plugins` は Plugin インストール smoke、ローカルフォルダーのインストール、
  ローカルフォルダーの更新スキップ挙動、事前インストール済み依存関係を持つ
  ローカルフォルダー、`file:` パッケージインストール、CLI 実行付き git インストール、git
  moving-ref 更新、hoist された推移的依存関係を持つ npm registry インストール、
  npm update no-op、不正な npm package metadata の拒否、ローカル ClawHub fixture
  インストールと update no-op、marketplace update の挙動、
  Claude bundle の enable/inspect をカバーする。ClawHub ブロックを hermetic/offline に
  保つには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定する。
- `test:docker:plugin-lifecycle-matrix` は候補パッケージを bare container にインストールし、
  npm Plugin を install、inspect、disable、enable、明示的 upgrade、明示的 downgrade、
  Plugin code を削除した後の uninstall まで実行する。各 phase の RSS と CPU metrics を記録する。
- `test:docker:plugin-update` は、変更のないインストール済み Plugin が
  `openclaw plugins update` 中に再インストールされたりインストール metadata を失ったりしないことを検証する。
- `test:docker:upgrade-survivor` は dirty な old-user fixture の上に候補 tarball をインストールし、
  package update と non-interactive doctor を実行した後、loopback Gateway を起動して状態保持を確認する。
- `test:docker:published-upgrade-survivor` はまず公開済み baseline をインストールし、
  焼き込み済みの `openclaw config set` recipe で構成し、候補 tarball へ更新し、
  doctor を実行し、レガシー cleanup を確認し、Gateway を起動して
  `/healthz`、`/readyz`、RPC status を probe する。
- `test:docker:update-restart-auth` は候補パッケージをインストールし、管理された
  token-auth Gateway を起動し、`openclaw update --yes --json` のために caller gateway auth env を解除し、
  通常の probe の前に候補 update command が Gateway を再起動することを要求する。
- `test:docker:update-migration` は cleanup が多い published-update lane である。
  構成済みの Discord/Telegram 風ユーザー状態から始め、構成済み Plugin 依存関係が
  materialize する機会を得られるよう baseline doctor を実行し、構成済み packaged Plugin の
  legacy Plugin dependency debris を seed し、候補 tarball へ更新し、post-update doctor が
  legacy dependency roots を削除することを要求する。

便利な published-upgrade survivor variant:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能な scenario: `base`、`acpx-openclaw-tools-bridge`、`feishu-channel`、
`bootstrap-persona`、`channel-post-core-restore`、`plugin-deps-cleanup`、
`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path`、
および `versioned-runtime-deps`。集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
（alias `far-reaching`）が、configured-plugin install migration を含むすべての scenario に展開される。

Full update migration は意図的に Full Release CI から分離されている。リリース上の問いが
「2026.4.23 以降のすべての公開済み stable release がこの候補へ更新され、
Plugin dependency debris を cleanup できるか」である場合は、手動の `Update Migration`
workflow を使う:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## パッケージ受け入れ

パッケージ受け入れは GitHub-native なパッケージ gate である。1 つの候補パッケージを
`package-under-test` tarball に解決し、version と SHA-256 を記録した後、
その正確な tarball に対して再利用可能な Docker E2E lane を実行する。workflow harness
ref は package source ref と分離されているため、現在の test logic で古い信頼済み release を検証できる。

候補ソース:

- `source=npm`: `openclaw@extended-stable`、`openclaw@beta`、
  `openclaw@latest`、または正確な公開済み version を検証する。
- `source=ref`: 選択した current harness で、信頼済み branch、tag、または commit を pack する。
- `source=url`: 必須の `package_sha256` を持つ public HTTPS tarball を検証する。
  このパスは、URL credential、default 以外の HTTPS port、private/internal
  hostname または DNS/IP result、special-use IP space、安全でない redirect を拒否する。
- `source=trusted-url`: 必須の `package_sha256` と `trusted_source_id` を持つ
  HTTPS tarball を、`.github/package-trusted-sources.json` にある maintainer-owned policy に照らして検証する。
  input-level allow-private switch で `source=url` を弱める代わりに、enterprise/private
  mirror にはこれを使う。policy によって構成されている場合、Bearer auth は固定の
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を使う。
- `source=artifact`: 別の Actions run によってアップロードされた tarball を再利用する。

Full Release Validation は、解決済み release SHA からビルドされた `source=artifact` をデフォルトで使う。
公開後の証明では、`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` を渡し、
同じ upgrade matrix が shipped npm package を対象にするようにする。

Release check は package/update/restart/plugin set でパッケージ受け入れを呼び出す:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

release soak が有効な場合（`release_profile=stable` と `full` では強制有効）、
次も渡す:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、package migration、update channel switching、corrupt managed-plugin
tolerance、stale Plugin dependency cleanup、offline Plugin coverage、Plugin
update behavior、Telegram package QA が同じ解決済み artifact 上に保たれ、
デフォルトの release package gate がすべての公開済み release を歩かずに済む。

`last-stable-4` は、npm に公開された最新 4 つの stable OpenClaw release に解決される。
Release package acceptance は `2026.4.23` を最初の plugin-update compatibility boundary、
`2026.5.2` を plugin-architecture churn boundary、`2026.4.15` を古い 2026.4.1x
published-update baseline として pin する。resolver は最新 4 つにすでに含まれる pin を重複排除する。
公開済み update migration coverage を網羅するには、Full Release CI ではなく、別の
Update Migration workflow で `all-since-2026.4.23` を使う。legacy pre-date anchor も含めて
より広く手動サンプリングしたい場合、`release-history` は引き続き利用できる。

複数の published-upgrade survivor baseline が選択されている場合、再利用可能な
Docker workflow は各 baseline を専用の targeted runner job に shard する。各 baseline
shard は引き続き選択された scenario set を実行するが、log と artifact は baseline ごとに分かれ、
wall time は 1 つの大きな serial job ではなく、最も遅い shard によって bounded される。

release 前に候補を検証する場合は、package profile を手動で実行する:

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

公開済み extended-stable canary では、`package_spec=openclaw@extended-stable` を設定する。
パッケージ受け入れは、Docker lane が実行される前にその selector を正確な tarball に解決する。

release 上の問いに MCP channel、cron/subagent cleanup、OpenAI web search、または OpenWebUI が含まれる場合は
`suite_profile=product` を使う。完全な Docker release-path coverage が必要な場合にのみ
`suite_profile=full` を使う。

## リリースのデフォルト

release candidate では、デフォルトの証明 stack は次のとおり:

1. source-level regression 向けの `pnpm check:changed` と `pnpm test:changed`。
2. package artifact integrity 向けの `pnpm release:check`。
3. install/update/restart/plugin contract 向けのパッケージ受け入れ `package` profile、
   または release-check custom package lane。
4. OS-specific installer、オンボーディング、platform behavior 向けの cross-OS release check。
5. 変更された surface が provider または hosted-service behavior に触れる場合のみ live suite。

maintainer machine では、明示的に local proof を行う場合を除き、broad gate と Docker/package
product proof は Testbox で実行するべきである。

## レガシー互換性

互換性の leniency は狭く、時間で区切られている:

- `2026.4.25-beta.*` を含む `2026.4.25` までのパッケージは、
  パッケージ受け入れで既に shipped された package metadata gap を許容してよい。
- 公開済みの `2026.4.26` パッケージは、既に shipped された local build metadata stamp
  file について警告してよい。
- それ以降のパッケージは modern contract を満たさなければならない。同じ gap は
  warning や skipping ではなく fail する。

これらの古い形のために新しい startup migration を追加してはならない。doctor repair を追加または拡張し、
更新コマンドが再起動を所有する場合は `upgrade-survivor`、`published-upgrade-survivor`、または
`update-restart-auth` でそれを証明する。

## カバレッジの追加

update または Plugin behavior を変更する場合、正しい理由で失敗できる最も低い layer に coverage を追加する:

- 純粋なパスまたはメタデータロジック: ソースの隣にユニットテストを置く。
- パッケージインベントリまたは梱包ファイルの挙動: `package-dist-inventory` または tarball
  チェッカーテスト。
- CLI のインストール/更新の挙動: Docker レーンのアサーションまたはフィクスチャ。
- 公開リリースの移行の挙動: `published-upgrade-survivor` シナリオ。
- 更新が所有する再起動の挙動: `update-restart-auth`。
- レジストリ/パッケージソースの挙動: `test:docker:plugins` フィクスチャまたは ClawHub
  フィクスチャサーバー。
- 依存関係レイアウトまたはクリーンアップの挙動: ランタイム実行と
  ファイルシステム境界の両方をアサートする。npm 依存関係は Plugin の
  管理対象 npm プロジェクト内で巻き上げられる場合があるため、テストでは
  Plugin パッケージローカルの `node_modules` ツリーだけを想定するのではなく、
  そのプロジェクトがスキャン/クリーンアップされることを証明する必要がある。

新しい Docker フィクスチャはデフォルトで密閉された状態に保つ。テストの目的が
ライブレジストリの挙動でない限り、ローカルフィクスチャレジストリと
フェイクパッケージを使用する。

## 失敗のトリアージ

まずアーティファクトの識別情報から始める:

- Package Acceptance `resolve_package` サマリー: ソース、バージョン、SHA-256、および
  アーティファクト名。
- Docker アーティファクト: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`、レーンログ、および再実行コマンド。
- Upgrade survivor サマリー: `.artifacts/upgrade-survivor/summary.json`。
  ベースラインバージョン、候補バージョン、シナリオ、フェーズタイミング、および
  設定レシピのカバレッジを含む。

リリース全体の包括的な再実行よりも、同じパッケージアーティファクトで
失敗した正確なレーンを再実行することを優先する。
