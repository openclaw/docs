---
read_when:
    - OpenClaw の更新、診断、パッケージ受け入れ、または Plugin インストールの動作を変更する
    - リリース候補の準備または承認
    - パッケージ更新、Plugin依存関係のクリーンアップ、またはPluginインストールのリグレッションのデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とPlugin'
x-i18n:
    generated_at: "2026-05-02T20:50:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは更新と Plugin 検証の専用チェックリストです。目標は
単純です。インストール可能なパッケージが実ユーザー状態を更新でき、`doctor` を通じて古い
レガシー状態を修復でき、サポート対象ソースからの
Plugin のインストール、読み込み、更新、アンインストールが引き続き可能であることを証明します。

より広範なテストランナーの対応表については、[テスト](/ja-JP/help/testing)を参照してください。ライブプロバイダーの
キーとネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live)を参照してください。

## 保護する対象

更新と Plugin テストは次の契約を保護します。

- パッケージ tarball が完全で、有効な `dist/postinstall-inventory.json` を持ち、
  展開済みリポジトリファイルに依存しないこと。
- ユーザーが古い公開済みパッケージから候補パッケージへ移行しても、
  config、agents、sessions、workspaces、Plugin allowlists、channel config を失わないこと。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復
  パスを担うこと。起動時に、古い Plugin 状態向けの隠れた互換性マイグレーションを増やすべきではありません。
- Plugin のインストールがローカルディレクトリ、git リポジトリ、npm パッケージ、
  ClawHub レジストリパスから機能すること。
- Plugin の npm 依存関係が管理対象 npm ルートにインストールされ、信頼前にスキャンされ、
  アンインストール時に npm 経由で削除され、巻き上げられた依存関係が残らないこと。
- 何も変わっていない場合の Plugin 更新が安定していること。インストール記録、解決済み
  ソース、インストール済み依存関係レイアウト、有効化状態がそのまま保たれること。

## 開発中のローカル証明

狭い範囲から始めます。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin のインストール、アンインストール、依存関係、またはパッケージインベントリの変更では、
編集した継ぎ目をカバーするフォーカス済みテストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ Docker レーンが tarball を消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は config/docs/API ドリフトチェックを実行し、パッケージ dist
インベントリを書き込み、`npm pack --dry-run` を実行し、禁止された同梱ファイルを拒否し、
tarball を一時 prefix にインストールし、postinstall を実行し、同梱 channel
エントリポイントをスモークします。

## Docker レーン

Docker レーンはプロダクトレベルの証明です。Linux コンテナ内に実パッケージを
インストールまたは更新し、CLI コマンド、Gateway 起動、HTTP プローブ、RPC ステータス、
ファイルシステム状態を通じて挙動を検証します。

反復中はフォーカス済みレーンを使用します。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要なレーン:

- `test:docker:plugins` は Plugin インストールスモーク、ローカルフォルダーインストール、
  ローカルフォルダー更新スキップ挙動、事前インストール済み依存関係を持つローカルフォルダー、
  `file:` パッケージインストール、CLI 実行を伴う git インストール、git
  moving-ref 更新、巻き上げられた推移依存を伴う npm レジストリインストール、
  npm 更新の no-op、ローカル ClawHub fixture インストールと更新
  no-op、marketplace 更新挙動、Claude バンドルの有効化/検査を検証します。
  ClawHub ブロックを hermetic/オフラインに保つには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-update` は、変更のないインストール済み Plugin が
  `openclaw plugins update` 中に再インストールされたりインストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、汚れた旧ユーザー fixture の上に候補 tarball を
  インストールし、パッケージ更新と非対話 doctor を実行してから、loopback Gateway を起動し、
  状態保持を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済み baseline をインストールし、
  焼き込み済みの `openclaw config set` レシピで構成し、それを候補 tarball に更新し、
  doctor を実行し、レガシークリーンアップを確認し、Gateway を起動して、
  `/healthz`、`/readyz`、RPC ステータスをプローブします。
- `test:docker:update-migration` は、クリーンアップが重い公開済み更新レーンです。
  構成済み Discord/Telegram 風のユーザー状態から開始し、構成済み Plugin 依存関係が
  実体化する機会を得るよう baseline doctor を実行し、構成済み packaged Plugin の
  レガシー Plugin 依存関係の残骸を seed し、候補 tarball に更新し、更新後 doctor に
  レガシー依存関係ルートの削除を要求します。

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
`plugin-deps-cleanup`、`configured-plugin-installs`、`tilde-log-path`、および
`versioned-runtime-deps` です。集約実行では、
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` が、構成済み Plugin
インストールマイグレーションを含む、報告済み issue 形状のすべてのシナリオに展開されます。

完全な更新マイグレーションは意図的に Full Release CI から分離されています。リリース上の問いが「2026.4.23 以降のすべての公開済み stable リリースはこの候補に更新でき、
Plugin 依存関係の残骸をクリーンアップできるか」である場合は、手動の `Update Migration`
ワークフローを使用します。

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
パッケージを `package-under-test` tarball に解決し、バージョンと SHA-256 を記録してから、
その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。ワークフローハーネス
ref はパッケージソース ref から分離されているため、現在のテストロジックで
古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な
  公開済みバージョンを検証します。
- `source=ref`: 選択された現在のハーネスで、信頼済みブランチ、タグ、または commit を pack します。
- `source=url`: 必須の `package_sha256` を伴う HTTPS tarball を検証します。
- `source=artifact`: 別の Actions 実行がアップロードした tarball を再利用します。

Full Release Validation は、解決済みリリース SHA からビルドされた `source=artifact` を
デフォルトで使用します。公開後の証明では、
`package_acceptance_package_spec=openclaw@YYYY.M.D` を渡し、同じアップグレードマトリクスが
出荷済み npm パッケージを対象にするようにします。

リリースチェックは Package Acceptance をパッケージ/更新/Plugin セットで呼び出します。

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

また、次も渡します。

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、パッケージマイグレーション、更新チャネル切り替え、古い Plugin 依存関係
クリーンアップ、オフライン Plugin カバレッジ、Plugin 更新挙動、Telegram パッケージ
QA が同じ解決済み成果物上に保たれます。

`all-since-2026.4.23` は Full Release CI のアップグレードサンプルです。`2026.4.23` から `latest` までのすべての stable npm 公開済みリリースが対象です。公開済み
更新マイグレーションを網羅的にカバーするには、Full Release CI ではなく、別個の Update
Migration ワークフローで `all-since-2026.4.23` を使用します。レガシーの期日前
アンカーも含めてより広く手動サンプリングしたい場合のために、`release-history` は引き続き
利用できます。

リリース前に候補を検証するときは、パッケージプロファイルを手動で実行します。

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

リリース上の問いに MCP channels、cron/subagent cleanup、OpenAI web search、または
OpenWebUI が含まれる場合は `suite_profile=product` を使用します。完全な Docker
リリースパスカバレッジが必要な場合にのみ `suite_profile=full` を使用します。

## リリースのデフォルト

リリース候補では、デフォルトの証明スタックは次のとおりです。

1. ソースレベルの回帰に対する `pnpm check:changed` と `pnpm test:changed`。
2. パッケージ成果物の整合性に対する `pnpm release:check`。
3. インストール/更新/Plugin 契約に対する Package Acceptance `package` プロファイルまたは release-check カスタムパッケージ
   レーン。
4. OS 固有のインストーラー、オンボーディング、プラットフォーム
   挙動に対する Cross-OS release checks。
5. 変更面がプロバイダーまたはホストサービス
   挙動に触れる場合のみライブスイート。

メンテナーのマシンでは、明示的にローカル証明を行う場合を除き、広範なゲートと Docker/パッケージプロダクト証明は
Testbox で実行するべきです。

## レガシー互換性

互換性の猶予は狭く、時間で区切られています。

- `2026.4.25` までのパッケージ、`2026.4.25-beta.*` を含むものは、Package Acceptance で
  すでに出荷済みのパッケージメタデータ欠落を許容する場合があります。
- 公開済み `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプ
  ファイルについて警告する場合があります。
- それ以降のパッケージは現代的な契約を満たす必要があります。同じ欠落は警告やスキップではなく
  失敗になります。

これらの古い形状のために新しい起動時マイグレーションを追加しないでください。doctor
修復を追加または拡張し、それを `upgrade-survivor` または `published-upgrade-survivor` で証明します。

## カバレッジの追加

更新または Plugin 挙動を変更する場合は、正しい理由で失敗できる最も低い層にカバレッジを追加します。

- 純粋なパスまたはメタデータロジック: ソース横のユニットテスト。
- パッケージインベントリまたは同梱ファイル挙動: `package-dist-inventory` または tarball
  checker テスト。
- CLI インストール/更新挙動: Docker レーンのアサーションまたは fixture。
- 公開済みリリースのマイグレーション挙動: `published-upgrade-survivor` シナリオ。
- レジストリ/パッケージソース挙動: `test:docker:plugins` fixture または ClawHub
  fixture server。
- 依存関係レイアウトまたはクリーンアップ挙動: ランタイム実行と
  ファイルシステム境界の両方をアサートします。npm 依存関係は管理対象 npm
  ルート下に巻き上げられる場合があるため、テストは package-local の `node_modules`
  ツリーを仮定するのではなく、そのルートがスキャン/クリーンアップされることを証明するべきです。

新しい Docker fixture はデフォルトで hermetic に保ちます。テストの目的がライブレジストリ挙動でない限り、
ローカル fixture レジストリと偽パッケージを使用します。

## 失敗のトリアージ

成果物の識別情報から始めます。

- Package Acceptance `resolve_package` summary: source、version、SHA-256、および
  artifact name。
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`、
  `failures.json`、lane logs、および rerun commands。
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`。
  baseline version、candidate version、scenario、phase timings、および
  recipe steps を含みます。

リリース全体の傘を再実行するよりも、同じパッケージ成果物で失敗した正確なレーンを
再実行することを優先します。
