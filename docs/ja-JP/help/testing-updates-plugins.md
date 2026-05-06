---
read_when:
    - OpenClaw の更新、doctor、パッケージ受け入れ、または Plugin インストールの動作を変更する
    - リリース候補の準備または承認
    - パッケージ更新、Plugin 依存関係のクリーンアップ、または Plugin インストールの回帰のデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とPlugin'
x-i18n:
    generated_at: "2026-05-06T05:08:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは更新と Plugin 検証専用のチェックリストです。目的は
シンプルです。インストール可能なパッケージが実際のユーザー状態を更新でき、
`doctor` を通じて古いレガシー状態を修復でき、さらにサポート対象のソースから
Plugin をインストール、読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの対応表については、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダーの
キーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護するもの

更新と Plugin テストは、次の契約を保護します。

- パッケージ tarball が完全で、有効な `dist/postinstall-inventory.json` を持ち、
  展開されていないリポジトリファイルに依存しないこと。
- ユーザーが、古い公開済みパッケージから候補パッケージへ移行しても、
  config、agent、session、workspace、Plugin allowlist、または
  channel config を失わないこと。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復
  パスを所有すること。起動処理は、古い Plugin 状態のために隠れた互換性マイグレーションを増やすべきではありません。
- Plugin のインストールが、ローカルディレクトリ、git リポジトリ、npm パッケージ、そして
  ClawHub レジストリパスから機能すること。
- Plugin の npm 依存関係が、管理対象 npm ルートにインストールされ、信頼前にスキャンされ、
  アンインストール時に npm 経由で削除されるため、hoist された依存関係が
  残らないこと。
- 何も変更されていない場合、Plugin 更新が安定していること。インストール記録、解決済み
  ソース、インストール済み依存関係レイアウト、有効化状態がそのまま維持されること。

## 開発中のローカル証明

狭い範囲から始めます。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin のインストール、アンインストール、依存関係、またはパッケージインベントリを変更した場合は、
編集した seam をカバーする集中テストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ Docker lane が tarball を消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は config/docs/API の drift チェックを実行し、package dist
inventory を書き込み、`npm pack --dry-run` を実行し、禁止された packed file を拒否し、
tarball を一時 prefix にインストールし、postinstall を実行し、バンドルされた channel
entrypoint を smoke します。

## Docker lane

Docker lane はプロダクトレベルの証明です。Linux コンテナ内で実際の
パッケージをインストールまたは更新し、CLI コマンド、
Gateway 起動、HTTP probe、RPC status、filesystem 状態を通じて挙動を検証します。

反復中は集中 lane を使います。

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

- `test:docker:plugins` は、Plugin インストール smoke、ローカルフォルダーインストール、
  ローカルフォルダー更新の skip 挙動、事前インストール済み依存関係を持つローカルフォルダー、
  `file:` パッケージインストール、CLI 実行を伴う git インストール、git
  moving-ref 更新、hoist された推移的依存関係を持つ npm レジストリインストール、
  npm 更新 no-op、ローカル ClawHub fixture インストールと更新
  no-op、marketplace 更新挙動、Claude-bundle の enable/inspect を検証します。
  ClawHub ブロックを hermetic/offline に保つには
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-lifecycle-matrix` は、bare
  コンテナに候補パッケージをインストールし、npm Plugin を install、inspect、disable、enable、
  explicit upgrade、explicit downgrade、Plugin
  code 削除後の uninstall まで実行します。各フェーズの RSS と CPU metrics をログします。
- `test:docker:plugin-update` は、変更されていないインストール済み Plugin が
  `openclaw plugins update` 中に再インストールされたり、インストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、汚れた old-user fixture の上に候補 tarball をインストールし、
  パッケージ更新と non-interactive doctor を実行した後、
  loopback Gateway を起動して状態保持を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済み baseline をインストールし、
  焼き込まれた `openclaw config set` recipe で設定し、候補 tarball に更新し、
  doctor を実行し、レガシークリーンアップを確認し、Gateway を起動して
  `/healthz`、`/readyz`、RPC status を probe します。
- `test:docker:update-restart-auth` は、候補パッケージをインストールし、
  管理対象の token-auth Gateway を起動し、`openclaw update --yes --json` のために
  呼び出し元の gateway auth env を unset し、候補の update コマンドが
  通常の probe の前に Gateway を restart することを要求します。
- `test:docker:update-migration` は、クリーンアップが多い published-update lane です。
  設定済みの Discord/Telegram 形式のユーザー状態から開始し、設定済み Plugin 依存関係が具現化する機会を得られるよう baseline
  doctor を実行し、設定済み packaged Plugin の legacy Plugin dependency debris を seed し、候補 tarball に更新し、
  update 後の doctor が legacy dependency root を削除することを要求します。

便利な published-upgrade survivor variant:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能な scenario は `base`、`feishu-channel`、`bootstrap-persona`、
`plugin-deps-cleanup`、`configured-plugin-installs`、
`stale-source-plugin-shadow`、`tilde-log-path`、`versioned-runtime-deps` です。集約実行では、
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` は、configured-plugin install migration を含む、
報告 issue 形状のすべての scenario に展開されます。

Full update migration は、意図的に Full Release CI から分離されています。リリース上の問いが「2026.4.23 以降のすべての
公開済み stable release がこの候補へ更新でき、Plugin dependency debris をクリーンアップできるか」の場合は、
手動の `Update Migration` workflow を使います。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance は GitHub-native なパッケージ gate です。1 つの候補
パッケージを `package-under-test` tarball に解決し、version と SHA-256 を記録してから、
その正確な tarball に対して再利用可能な Docker E2E lane を実行します。workflow harness
ref はパッケージ source ref とは別なので、現在のテストロジックで
古い trusted release を検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な
  公開済み version を検証します。
- `source=ref`: 選択した現在の harness で trusted branch、tag、または commit を pack します。
- `source=url`: 必須の `package_sha256` を持つ HTTPS tarball を検証します。
- `source=artifact`: 別の Actions run によってアップロードされた tarball を再利用します。

Full Release Validation は、解決済み release SHA からビルドされた
`source=artifact` をデフォルトで使います。公開後の証明では、
同じ upgrade matrix が出荷済み npm パッケージを対象にするよう
`package_acceptance_package_spec=openclaw@YYYY.M.D` を渡します。

Release check は package/update/restart/plugin セットで Package Acceptance を呼び出します。

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

release soak が有効な場合は、次も渡します。

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、package migration、update channel switching、壊れた managed-plugin への
tolerance、古い Plugin dependency cleanup、offline Plugin coverage、Plugin
update behavior、Telegram package QA を、同じ解決済み成果物上で維持しつつ、
デフォルトの release package gate がすべての公開済み release を歩かないようにします。

`last-stable-4` は、npm に公開済みの最新 4 つの stable OpenClaw
release に解決されます。Release package acceptance は、`2026.4.23` を最初の Plugin-update
互換性境界、`2026.5.2` を Plugin architecture churn 境界、
`2026.4.15` を古い 2026.4.1x published-update baseline として pin します。resolver は、
すでに最新 4 つに含まれている pin を dedupe します。網羅的な published
update migration coverage には、Full Release CI ではなく別の Update
Migration workflow で `all-since-2026.4.23` を使います。legacy pre-date
anchor も含めたより広い手動 sampling が必要な場合は、`release-history` も引き続き利用できます。

複数の published-upgrade survivor baseline が選択された場合、再利用可能な
Docker workflow は各 baseline をそれぞれ独自の targeted runner job に shard します。各
baseline shard は選択された scenario set を引き続き実行しますが、log と artifact は
baseline ごとに分かれ、wall time は 1 つの大きな serial job ではなく最も遅い shard によって
制限されます。

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

リリース上の問いに MCP channel、cron/subagent cleanup、OpenAI web search、または OpenWebUI が含まれる場合は
`suite_profile=product` を使います。完全な Docker release-path coverage が必要な場合にのみ
`suite_profile=full` を使います。

## リリースのデフォルト

release candidate のデフォルト証明スタックは次のとおりです。

1. source-level regression には `pnpm check:changed` と `pnpm test:changed`。
2. パッケージ成果物の整合性には `pnpm release:check`。
3. install/update/restart/plugin 契約には Package Acceptance の `package` profile または release-check custom package
   lane。
4. OS 固有の installer、オンボーディング、platform
   behavior には Cross-OS release check。
5. 変更された surface が provider または hosted-service
   behavior に触れる場合のみ live suite。

maintainer machine では、明示的に local proof を行う場合を除き、broad gate と Docker/package product proof は
Testbox で実行するべきです。

## レガシー互換性

互換性の leniency は狭く、期限付きです。

- `2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、
  Package Acceptance で、すでに出荷済みの package metadata gap を許容できます。
- 公開済み `2026.4.26` パッケージは、すでに出荷済みの local build metadata stamp
  file について warn する場合があります。
- それ以降のパッケージは modern contract を満たす必要があります。同じ gap は
  warning や skipping ではなく失敗になります。

これらの古い形状のために新しい startup migration を追加しないでください。doctor
repair を追加または拡張し、更新コマンドが restart を所有する場合は
`upgrade-survivor`、`published-upgrade-survivor`、または
`update-restart-auth` でそれを証明します。

## coverage の追加

update または Plugin behavior を変更する場合は、正しい理由で失敗できる最も低い layer に coverage を追加します。

- pure path または metadata logic: source の隣の unit test。
- package inventory または packed-file behavior: `package-dist-inventory` または tarball
  checker test。
- CLI install/update behavior: Docker lane assertion または fixture。
- published-release migration behavior: `published-upgrade-survivor` scenario。
- update-owned restart behavior: `update-restart-auth`。
- registry/package source behavior: `test:docker:plugins` fixture または ClawHub
  fixture server。
- dependency layout または cleanup behavior: runtime execution と
  filesystem boundary の両方を assert します。npm dependencies は managed npm
  root 配下に hoist される場合があるため、test は package-local な
  `node_modules` tree を仮定するのではなく、root が scanned/cleaned されることを証明するべきです。

新しい Docker fixture はデフォルトで hermetic に保ちます。テストの目的が live registry behavior でない限り、
local fixture registry と fake package を使います。

## failure triage

artifact identity から始めます。

- パッケージ受け入れ `resolve_package` の概要: ソース、バージョン、SHA-256、および
  アーティファクト名。
- Docker アーティファクト: `.artifacts/docker-tests/**/summary.json`、
  `failures.json`、レーンログ、および再実行コマンド。
- アップグレードサバイバーの概要: `.artifacts/upgrade-survivor/summary.json`、
  ベースラインバージョン、候補バージョン、シナリオ、フェーズごとの所要時間、および
  レシピ手順を含む。

リリース全体の包括的な再実行よりも、同じパッケージアーティファクトで失敗した厳密なレーンを再実行することを優先する。
