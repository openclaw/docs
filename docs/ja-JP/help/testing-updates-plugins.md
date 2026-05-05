---
read_when:
    - OpenClaw の更新、doctor、package acceptance、または Plugin インストールの挙動を変更する
    - リリース候補の準備または承認
    - パッケージ更新、Plugin 依存関係のクリーンアップ、または Plugin インストールのリグレッションのデバッグ
sidebarTitle: Update and plugin tests
summary: OpenClaw が更新パス、パッケージ移行、Plugin のインストール/更新動作を検証する方法
title: 'テスト: 更新とPlugin'
x-i18n:
    generated_at: "2026-05-05T01:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

これは更新と Plugin 検証専用のチェックリストです。目的は単純です。
インストール可能なパッケージが実際のユーザー状態を更新でき、`doctor` を通じて古い
レガシー状態を修復でき、サポートされているソースから Plugin を引き続きインストール、
読み込み、更新、アンインストールできることを証明します。

より広範なテストランナーの対応表については、[テスト](/ja-JP/help/testing) を参照してください。ライブプロバイダーの
キーやネットワークに触れるスイートについては、[ライブテスト](/ja-JP/help/testing-live) を参照してください。

## 保護するもの

更新と Plugin のテストは、次の契約を保護します。

- パッケージ tarball が完全で、有効な `dist/postinstall-inventory.json` を持ち、
  展開されていないリポジトリファイルに依存しないこと。
- ユーザーが古い公開済みパッケージから候補パッケージへ移行しても、設定、エージェント、
  セッション、ワークスペース、Plugin allowlist、またはチャンネル設定を失わないこと。
- `openclaw doctor --fix --non-interactive` がレガシーのクリーンアップと修復パスを所有すること。
  起動時に、古い Plugin 状態のための隠れた互換性マイグレーションを増やしてはなりません。
- Plugin のインストールが、ローカルディレクトリ、git リポジトリ、npm パッケージ、
  ClawHub レジストリパスから機能すること。
- Plugin の npm 依存関係が管理対象の npm ルートにインストールされ、信頼前にスキャンされ、
  アンインストール時に npm 経由で削除されることで、巻き上げられた依存関係が残らないこと。
- 何も変更されていない場合の Plugin 更新が安定していること。インストールレコード、解決済みソース、
  インストール済み依存関係レイアウト、有効状態が維持されます。

## 開発中のローカル証明

狭い範囲から開始します。

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Plugin のインストール、アンインストール、依存関係、またはパッケージインベントリの変更では、
編集した継ぎ目をカバーする焦点を絞ったテストも実行します。

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

パッケージ Docker レーンが tarball を消費する前に、パッケージ成果物を証明します。

```bash
pnpm release:check
```

`release:check` は設定、ドキュメント、API のドリフトチェックを実行し、パッケージ dist
インベントリを書き込み、`npm pack --dry-run` を実行し、禁止された梱包済みファイルを拒否し、
一時 prefix に tarball をインストールし、postinstall を実行し、バンドルされたチャンネル
エントリポイントをスモークします。

## Docker レーン

Docker レーンは製品レベルの証明です。Linux コンテナ内で実際のパッケージをインストールまたは更新し、
CLI コマンド、Gateway 起動、HTTP プローブ、RPC 状態、ファイルシステム状態を通じて挙動を検証します。

反復中は焦点を絞ったレーンを使います。

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

重要なレーン:

- `test:docker:plugins` は、Plugin インストールのスモーク、ローカルフォルダーインストール、
  ローカルフォルダー更新のスキップ挙動、事前インストール済み依存関係を持つローカルフォルダー、
  `file:` パッケージインストール、CLI 実行を伴う git インストール、git の移動参照更新、
  巻き上げられた推移的依存関係を持つ npm レジストリインストール、npm 更新の no-op、
  ローカル ClawHub fixture のインストールと更新 no-op、マーケットプレイス更新挙動、
  Claude バンドルの有効化と検査を検証します。ClawHub ブロックを hermetic/offline に保つには
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。
- `test:docker:plugin-lifecycle-matrix` は、ベアコンテナに候補パッケージをインストールし、
  npm Plugin をインストール、検査、無効化、有効化、明示的アップグレード、明示的ダウングレード、
  および Plugin コード削除後のアンインストールまで実行します。各フェーズの RSS と CPU メトリクスを記録します。
- `test:docker:plugin-update` は、未変更のインストール済み Plugin が
  `openclaw plugins update` 中に再インストールされたりインストールメタデータを失ったりしないことを検証します。
- `test:docker:upgrade-survivor` は、汚れた古いユーザー fixture の上に候補 tarball をインストールし、
  パッケージ更新と非対話 doctor を実行してから、loopback Gateway を起動し、状態保存を確認します。
- `test:docker:published-upgrade-survivor` は、まず公開済みベースラインをインストールし、
  baked された `openclaw config set` レシピで設定し、候補 tarball に更新し、doctor を実行し、
  レガシークリーンアップを確認し、Gateway を起動し、`/healthz`、`/readyz`、RPC 状態をプローブします。
- `test:docker:update-migration` は、クリーンアップが重い公開済み更新レーンです。
  設定済みの Discord/Telegram 形式のユーザー状態から開始し、設定済み Plugin 依存関係が具現化する機会を得るように
  ベースライン doctor を実行し、設定済みのパッケージ化 Plugin のレガシー Plugin 依存関係の残骸をシードし、
  候補 tarball に更新し、更新後の doctor がレガシー依存関係ルートを削除することを必須にします。

便利な公開済みアップグレードサバイバーのバリアント:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` が、設定済み Plugin インストールマイグレーションを含む、
報告済み issue 形状のすべてのシナリオに展開されます。

完全な更新マイグレーションは、意図的に Full Release CI から分離されています。リリース上の問いが
「2026.4.23 以降のすべての公開済み stable リリースがこの候補へ更新でき、Plugin 依存関係の残骸をクリーンアップできるか」
である場合は、手動の `Update Migration` ワークフローを使います。

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance は GitHub ネイティブなパッケージゲートです。1 つの候補パッケージを
`package-under-test` tarball に解決し、バージョンと SHA-256 を記録してから、
その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。ワークフローハーネスの
ref はパッケージソース ref とは別なので、現在のテストロジックで古い信頼済みリリースを検証できます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な公開済みバージョンを検証します。
- `source=ref`: 選択した現在のハーネスで、信頼済みブランチ、タグ、またはコミットを pack します。
- `source=url`: 必須の `package_sha256` を指定して HTTPS tarball を検証します。
- `source=artifact`: 別の Actions 実行でアップロードされた tarball を再利用します。

Full Release Validation は、解決済みリリース SHA から構築された `source=artifact` をデフォルトで使います。
公開後の証明では、代わりに `package_acceptance_package_spec=openclaw@YYYY.M.D` を渡し、
同じアップグレードマトリックスが出荷済み npm パッケージを対象にするようにします。

リリースチェックは、パッケージ、更新、Plugin のセットで Package Acceptance を呼び出します。

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

また、次も渡します。

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

これにより、パッケージマイグレーション、更新チャンネル切り替え、古い Plugin 依存関係のクリーンアップ、
offline Plugin カバレッジ、Plugin 更新挙動、Telegram パッケージ QA が、同じ解決済み成果物上に保たれます。

`all-since-2026.4.23` は Full Release CI のアップグレードサンプルです。
`2026.4.23` から `latest` までのすべての stable な npm 公開済みリリースを含みます。
公開済み更新マイグレーションを網羅的にカバーするには、Full Release CI ではなく、別個の Update
Migration ワークフローで `all-since-2026.4.23` を使います。レガシーの事前日付アンカーも含めて
より広く手動サンプリングしたい場合には、`release-history` も引き続き利用できます。

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

リリース上の問いに MCP チャンネル、cron/subagent クリーンアップ、OpenAI web search、または OpenWebUI が含まれる場合は
`suite_profile=product` を使います。完全な Docker リリースパスカバレッジが必要な場合にのみ
`suite_profile=full` を使います。

## リリースのデフォルト

リリース候補では、デフォルトの証明スタックは次のとおりです。

1. ソースレベルの回帰には `pnpm check:changed` と `pnpm test:changed`。
2. パッケージ成果物の整合性には `pnpm release:check`。
3. インストール、更新、Plugin 契約には Package Acceptance の `package` プロファイル、またはリリースチェックのカスタムパッケージレーン。
4. OS 固有のインストーラー、オンボーディング、プラットフォーム挙動には Cross-OS release checks。
5. 変更された面がプロバイダーまたはホスト型サービスの挙動に触れる場合のみ、ライブスイート。

メンテナーのマシンでは、明示的にローカル証明を行う場合を除き、広範なゲートと Docker/パッケージ製品証明は
Testbox で実行する必要があります。

## レガシー互換性

互換性の緩和は狭く、期限付きです。

- `2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、Package Acceptance で
  すでに出荷済みのパッケージメタデータの欠落を許容する場合があります。
- 公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて
  警告する場合があります。
- それ以降のパッケージは、現代的な契約を満たす必要があります。同じ欠落は、警告やスキップではなく失敗になります。

これらの古い形状に対して新しい起動時マイグレーションを追加しないでください。doctor 修復を追加または拡張し、
`upgrade-survivor` または `published-upgrade-survivor` で証明します。

## カバレッジの追加

更新または Plugin 挙動を変更する場合は、適切な理由で失敗し得る最も低い層にカバレッジを追加します。

- 純粋なパスまたはメタデータロジック: ソースの隣にある単体テスト。
- パッケージインベントリまたは梱包済みファイルの挙動: `package-dist-inventory` または tarball チェッカーテスト。
- CLI インストール/更新挙動: Docker レーンのアサーションまたは fixture。
- 公開済みリリースのマイグレーション挙動: `published-upgrade-survivor` シナリオ。
- レジストリ/パッケージソースの挙動: `test:docker:plugins` fixture または ClawHub fixture サーバー。
- 依存関係レイアウトまたはクリーンアップ挙動: ランタイム実行とファイルシステム境界の両方をアサートします。
  npm 依存関係は管理対象の npm ルート配下に巻き上げられる場合があるため、テストでは
  パッケージローカルの `node_modules` ツリーを仮定するのではなく、そのルートがスキャン/クリーンアップされることを証明する必要があります。

新しい Docker fixture はデフォルトで hermetic に保ちます。テストの目的がライブレジストリ挙動でない限り、
ローカル fixture レジストリと fake パッケージを使います。

## 失敗のトリアージ

成果物 ID から開始します。

- Package Acceptance の `resolve_package` サマリー: ソース、バージョン、SHA-256、成果物名。
- Docker 成果物: `.artifacts/docker-tests/**/summary.json`、
  `failures.json`、レーンログ、再実行コマンド。
- アップグレードサバイバーサマリー: `.artifacts/upgrade-survivor/summary.json`。
  ベースラインバージョン、候補バージョン、シナリオ、フェーズタイミング、レシピ手順を含みます。

リリース全体の傘を再実行するよりも、同じパッケージ成果物で失敗した正確なレーンを再実行することを優先します。
