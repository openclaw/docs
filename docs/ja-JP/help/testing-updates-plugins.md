---
read_when:
    - OpenClaw のアップデート、doctor、パッケージ受け入れ、または Plugin インストールの挙動を変更する
    - リリース候補の準備または承認
    - パッケージ更新、Plugin 依存関係のクリーンアップ、または Plugin インストールのリグレッションのデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、および Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とPlugin'
x-i18n:
    generated_at: "2026-05-02T04:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは更新と Plugin 検証専用のチェックリストです。目標は単純です。インストール可能なパッケージが実際のユーザー状態を更新でき、`doctor` を通じて古いレガシー状態を修復でき、さらにサポート対象のソースから Plugin をインストール、読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの対応表については [テスト](/ja-JP/help/testing) を参照してください。ライブプロバイダーキーとネットワークに触れるスイートについては [ライブテスト](/ja-JP/help/testing-live) を参照してください。

## 保護するもの

更新テストと Plugin テストは、次の契約を保護します。

- パッケージ tarball が完全で、有効な `dist/postinstall-inventory.json` を持ち、展開されていないリポジトリファイルに依存しない。
- ユーザーが古い公開済みパッケージから候補パッケージへ移行しても、config、agent、session、workspace、Plugin allowlist、channel config を失わない。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復パスを担う。起動処理は、古い Plugin 状態のための隠れた互換性 migration を増やすべきではない。
- Plugin のインストールは、ローカルディレクトリ、git リポジトリ、npm パッケージ、ClawHub レジストリパスから機能する。
- Plugin の npm 依存関係は managed npm root にインストールされ、信頼前にスキャンされ、アンインストール時に npm 経由で削除されるため、hoist された依存関係が残らない。
- 何も変更されていない場合、Plugin の更新は安定している。インストールレコード、解決済みソース、インストール済み依存関係レイアウト、有効化状態が維持される。

## 開発中のローカル証明

狭い範囲から開始します。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin のインストール、アンインストール、依存関係、またはパッケージインベントリの変更では、編集した継ぎ目をカバーする焦点を絞ったテストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ Docker lane が tarball を消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は config/docs/API drift check を実行し、package dist inventory を書き込み、`npm pack --dry-run` を実行し、禁止された packed file を拒否し、tarball を一時 prefix にインストールし、postinstall を実行し、バンドルされた channel entrypoint を smoke します。

## Docker lane

Docker lane は product レベルの証明です。Linux コンテナ内で実際のパッケージをインストールまたは更新し、CLI コマンド、Gateway 起動、HTTP probe、RPC status、ファイルシステム状態を通じて挙動を検証します。

反復中は焦点を絞った lane を使用します。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要な lane:

- `test:docker:plugins` は、Plugin install smoke、local folder install、local folder update skip behavior、preinstall 済み依存関係を含む local folder、`file:` package install、CLI 実行を伴う git install、git moving-ref update、hoist された transitive dependency を伴う npm registry install、npm update no-op、ローカル ClawHub fixture install と update no-op、marketplace update behavior、Claude-bundle enable/inspect を検証します。ClawHub ブロックを hermetic/offline に保つには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-update` は、変更されていないインストール済み Plugin が `openclaw plugins update` 中に再インストールされたり、インストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、汚れた old-user fixture の上に候補 tarball をインストールし、package update と non-interactive doctor を実行してから、loopback Gateway を起動し、状態保持を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済み baseline をインストールし、焼き込まれた `openclaw config set` recipe を通じて設定し、候補 tarball へ更新し、doctor を実行し、レガシークリーンアップを確認し、Gateway を起動して `/healthz`、`/readyz`、RPC status を probe します。
- `test:docker:update-migration` は、クリーンアップ重視の published-update lane です。設定済みの Discord/Telegram 風ユーザー状態から開始し、configured plugin dependencies が具現化する機会を得られるよう baseline doctor を実行し、configured packaged plugin のために legacy plugin dependency debris を seed し、候補 tarball へ更新し、post-update doctor が legacy dependency roots を削除することを要求します。

便利な published-upgrade survivor variant:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

利用可能な scenario は `base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`tilde-log-path`、`versioned-runtime-deps` です。集約実行では、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` が、報告された issue 形状のすべての scenario に展開されます。

完全な update migration は、意図的に Full Release CI から分離されています。release の問いが「2026.4.23 以降のすべての公開済み安定版リリースがこの候補に更新でき、plugin dependency debris をクリーンアップできるか」である場合は、手動の `Update Migration` workflow を使用します。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance は GitHub ネイティブの package gate です。1 つの候補 package を `package-under-test` tarball に解決し、version と SHA-256 を記録してから、その正確な tarball に対して再利用可能な Docker E2E lane を実行します。workflow harness ref は package source ref とは分離されているため、現在のテストロジックで古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な公開済み version を検証します。
- `source=ref`: 選択された現在の harness を使用して、信頼済み branch、tag、または commit を pack します。
- `source=url`: 必須の `package_sha256` を伴う HTTPS tarball を検証します。
- `source=artifact`: 別の Actions run によってアップロードされた tarball を再利用します。

release check は、package/update/plugin set で Package Acceptance を呼び出します。

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

また、次も渡します。

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、package migration、update channel switching、古い plugin dependency cleanup、offline plugin coverage、plugin update behavior、Telegram package QA が、同じ解決済み成果物上に保たれます。

`release-history` は、境界付きの release-check sample です。最新 6 件の安定版リリース、`2026.4.23`、およびそれ以前の日付 anchor 1 件を含みます。公開済み update migration の網羅的な coverage には、Full Release CI ではなく、分離された Update Migration workflow で `all-since-2026.4.23` を使用します。

release 前に候補を検証するときは、package profile を手動で実行します。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

release の問いに MCP channel、cron/subagent cleanup、OpenAI web search、または OpenWebUI が含まれる場合は `suite_profile=product` を使用します。完全な Docker release-path coverage が必要な場合にのみ `suite_profile=full` を使用します。

## リリースのデフォルト

release candidate では、デフォルトの proof stack は次のとおりです。

1. source レベルの regression に対する `pnpm check:changed` と `pnpm test:changed`。
2. package artifact integrity に対する `pnpm release:check`。
3. install/update/plugin contract に対する Package Acceptance `package` profile、または release-check custom package lane。
4. OS 固有の installer、オンボーディング、platform behavior に対する Cross-OS release check。
5. 変更面が provider または hosted-service behavior に触れる場合のみ live suite。

maintainer machine では、明示的に local proof を行う場合を除き、broad gate と Docker/package product proof は Testbox で実行するべきです。

## レガシー互換性

互換性の許容は狭く、期限付きです。

- `2026.4.25` までの package（`2026.4.25-beta.*` を含む）は、Package Acceptance で既に出荷済みの package metadata gap を許容する場合があります。
- 公開済みの `2026.4.26` package は、既に出荷済みの local build metadata stamp file に対して warn する場合があります。
- それ以降の package は、現代の契約を満たさなければなりません。同じ gap は warning や skipping ではなく fail します。

これらの古い形状に対して新しい startup migration を追加しないでください。doctor repair を追加または拡張し、それを `upgrade-survivor` または `published-upgrade-survivor` で証明します。

## coverage の追加

update または plugin behavior を変更するときは、正しい理由で fail できる最も低い layer に coverage を追加します。

- Pure path または metadata logic: source の隣の unit test。
- Package inventory または packed-file behavior: `package-dist-inventory` または tarball checker test。
- CLI install/update behavior: Docker lane assertion または fixture。
- Published-release migration behavior: `published-upgrade-survivor` scenario。
- Registry/package source behavior: `test:docker:plugins` fixture または ClawHub fixture server。
- Dependency layout または cleanup behavior: runtime execution と filesystem boundary の両方を assert します。npm dependencies は managed npm root の下に hoist される場合があるため、tests は package-local な `node_modules` tree を仮定するのではなく、root が scanned/cleaned されることを証明するべきです。

新しい Docker fixture はデフォルトで hermetic に保ちます。テストの目的が live registry behavior でない限り、local fixture registry と fake package を使用します。

## failure triage

artifact identity から開始します。

- Package Acceptance `resolve_package` summary: source、version、SHA-256、artifact name。
- Docker artifact: `.artifacts/docker-tests/**/summary.json`、`failures.json`、lane log、rerun command。
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`。baseline version、candidate version、scenario、phase timing、recipe step を含みます。

release umbrella 全体を再実行するよりも、同じ package artifact で失敗した正確な lane を再実行することを優先します。
