---
read_when:
    - Gateway Pluginまたは互換性のあるバンドルをインストールまたは管理する場合
    - シンプルなツールPluginをスキャフォールドまたは検証したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（初期化、ビルド、検証、一覧表示、インストール、マーケットプレイス、アンインストール、有効化/無効化、診断）'
title: Plugin
x-i18n:
    generated_at: "2026-07-11T22:07:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gateway プラグイン、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ja-JP/tools/plugin">
    プラグインのインストール、有効化、トラブルシューティングを行うエンドユーザー向けガイドです。
  </Card>
  <Card title="Manage plugins" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開のクイック例です。
  </Card>
  <Card title="Plugin bundles" href="/ja-JP/plugins/bundles">
    バンドルの互換性モデルです。
  </Card>
  <Card title="Plugin manifest" href="/ja-JP/plugins/manifest">
    マニフェストのフィールドと設定スキーマです。
  </Card>
  <Card title="Security" href="/ja-JP/gateway/security">
    プラグインのインストールに対するセキュリティ強化です。
  </Card>
</CardGroup>

## コマンド

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

時間のかかるインストール、検査、アンインストール、またはレジストリ更新を調査する場合は、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を指定してコマンドを実行します。トレースは各フェーズの所要時間を
標準エラー出力に書き込み、JSON 出力を解析可能な状態に保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、`openclaw.json` は変更できません。`install`、`update`、`uninstall`、`enable`、`disable` はすべて実行を拒否します。代わりに、このインストールの Nix ソース（nix-openclaw の `programs.openclaw.config` または `instances.<name>.config`）を編集し、再ビルドしてください。エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を参照してください。
</Note>

<Note>
同梱プラグインは OpenClaw とともに提供されます。一部はデフォルトで有効です（たとえば、同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザプラグイン）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw プラグインには、インライン JSON Schema（空の場合も含む `configSchema`）を持つ `openclaw.plugin.json` が含まれます。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` には `Format: openclaw` または `Format: bundle` と表示されます。詳細な一覧および情報出力には、バンドルのサブタイプ（`codex`、`claude`、`cursor`）と、検出されたバンドル機能も表示されます。
</Note>

## 作成

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` は、デフォルトで最小構成の TypeScript ツールプラグインを作成します。最初の
引数はプラグイン ID で、`--name` は表示名を設定します。OpenClaw はこの
ID をデフォルトの出力ディレクトリとパッケージ名に使用します。ツールのスキャフォールドは
`defineToolPlugin` を使用し、ビルド後に `openclaw plugins build`/`validate` を呼び出す
`package.json` スクリプト `plugin:build` と `plugin:validate` を生成します。

`plugins build` はビルド済みエントリをインポートし、その静的ツールメタデータを読み取り、
`openclaw.plugin.json` を書き込み、`package.json` の `openclaw.extensions` との整合性を維持します。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、現在のエントリエクスポートが
引き続き一致していることを確認します。完全な作成ワークフローについては、
[ツールプラグイン](/ja-JP/plugins/tool-plugins)を参照してください。

スキャフォールドは TypeScript ソースを書き込みますが、ビルド済みの
`./dist/index.js` エントリからメタデータを生成するため、このワークフローは公開済み CLI でも機能します。
エントリがデフォルトのパッケージエントリでない場合は `--entry <path>` を使用します。
CI では `plugins build --check` を使用すると、ファイルを書き換えずに
生成済みメタデータが古い場合に失敗させることができます。

### プロバイダーのスキャフォールド

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

プロバイダーのスキャフォールドは、API キー認証の配線、`clawhub package validate` を実行する
`npm run validate` スクリプト、ClawHub パッケージメタデータ、GitHub
OIDC を介した将来の信頼済み公開向けの手動実行 GitHub Actions ワークフローを備えた、
汎用的な OpenAI 互換モデルプロバイダープラグインを作成します。プロバイダーのスキャフォールドは Skills を生成せず、
`openclaw plugins build`/`validate` も使用しません。これらのコマンドは、ツール
スキャフォールドの生成済みメタデータ経路用です。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメント
ルート、認証情報の文言、README の文章を、実際のプロバイダー情報に置き換えてください。初回の ClawHub 公開と
信頼済み公開者の設定には、生成された README を使用してください。

## インストール

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

セットアップ時のインストールをテストするメンテナーは、保護された環境変数を使用して
プラグインの自動インストール元を上書きできます。
[プラグインのインストール元の上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ただし、同梱または公式プラグインの ID と一致する場合、OpenClaw は npm レジストリへアクセスせず、そのローカルまたは公式コピーを使用します。外部 npm パッケージを意図的に使用する場合は `npm:<package>` を使用してください。ClawHub には `clawhub:<package>` を使用します。プラグインのインストールはコードの実行と同様に扱い、固定バージョンを優先してください。
</Warning>

`plugins search` は、インストール可能な `code-plugin` および
`bundle-plugin` パッケージを ClawHub に問い合わせます（Skills は対象外です。Skills には `openclaw skills search` を使用してください）。
デフォルトの `--limit` は 20 で、上限は 100 です。リモートカタログの読み取りのみを行い、
ローカル状態の検査、設定の変更、パッケージのインストール、プラグインランタイムの
読み込みは行いません。結果には ClawHub パッケージ名、ファミリー、チャンネル、バージョン、
概要、および `openclaw plugins install clawhub:<package>` のようなインストール例が含まれます。

<Note>
ClawHub は、ほとんどのプラグインにおける主要な配布および検出手段です。npm
は引き続き、対応済みのフォールバックおよび直接インストール経路です。OpenClaw が所有する
`@openclaw/*` プラグインパッケージは再び npm で公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw)または
[プラグイン一覧](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールでは `latest` を使用します。
ベータチャンネルでのインストールと更新では、利用可能な場合は npm の `beta` dist-tag を優先し、
なければ `latest` にフォールバックします。拡張安定版チャンネルでは、裸指定、デフォルト指定、または `latest` 指定の
公式 npm プラグインは、インストール済みコアの正確なバージョンに解決されます。
正確なバージョン固定、明示的な `latest` 以外のタグ、サードパーティパッケージ、
npm 以外のソースは書き換えられません。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` セクションが単一ファイルの `$include` によって提供されている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟要素による上書きを持つインクルードは、平坦化せず安全側に失敗します。対応している形式については、[設定のインクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、通常は `plugins install` が安全側に失敗し、先に `openclaw doctor --fix` を実行するよう通知します。Gateway の起動時およびホットリロード時には、無効なプラグイン設定は他の無効な設定と同様に安全側に失敗します。`openclaw doctor --fix` は無効なプラグインエントリを隔離できます。文書化されている唯一のインストール時の例外は、`openclaw.install.allowInvalidConfigRecovery` を明示的に有効化したプラグイン向けの限定的な同梱プラグイン復旧経路です。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` は既存のインストール先を再利用し、インストール済みのプラグインまたはフックパックをその場で上書きします。同じ ID を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。追跡済み npm プラグインの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を使用してください。

    すでにインストール済みのプラグイン ID に対して `plugins install` を実行すると、OpenClaw は処理を停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きする場合には `plugins install <package> --force` を使用するよう案内します。`--force` は `--link` と併用できません。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` は npm インストールにのみ適用され、解決された正確な `<name>@<version>` を記録します。`git:` インストールでは対応していません（代わりに、たとえば `git:github.com/acme/plugin@v1.2.3` のように仕様内で ref を固定してください）。また、`--marketplace` とも併用できません（マーケットプレイスからのインストールでは、npm 仕様の代わりにマーケットプレイスのソースメタデータが永続化されます）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨であり、現在は何も行いません。OpenClaw は、プラグインのインストール時に組み込みの危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、運用者が管理する `security.installPolicy` サーフェスを使用してください。プラグインの `before_install` フックはプラグインランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub で公開したプラグインがレジストリスキャンによって非表示またはブロックされた場合は、[ClawHub への公開](/ja-JP/clawhub/publishing)の公開者向け手順を使用してください。`--dangerously-force-unsafe-install` は、ClawHub にプラグインの再スキャンを要求したり、ブロックされたリリースを公開状態にしたりするものではありません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティの ClawHub パッケージをインストールする際は、ダウンロード前に選択したリリースの信頼記録が確認されます。ClawHub がそのリリースのダウンロードを無効化している場合、悪意のあるスキャン結果を報告している場合、またはリリースをブロック対象のモデレーション状態（隔離済み、取り消し済み）にしている場合、OpenClaw はこのフラグの有無にかかわらず無条件で拒否します。ブロック対象ではない危険なスキャン状態またはモデレーション状態の場合、OpenClaw は信頼性の詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub の警告を確認し、対話型プロンプトなしで続行すると判断した場合にのみ使用してください。保留中または古い（まだクリーンと判定されていない）スキャン結果では警告が表示されますが、確認は必須ではありません。公式 ClawHub パッケージと同梱 OpenClaw プラグインソースでは、このリリース信頼性チェックは完全に省略されます。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール手段でもあります。パッケージのインストールではなく、絞り込まれたフックの表示とフック単位の有効化には `openclaw hooks` を使用してください。

    Npm 仕様は **レジストリのみ** です（パッケージ名に、任意で **完全一致するバージョン** または **dist-tag** を付加）。Git/URL/ファイル仕様および semver 範囲は拒否されます。依存関係のインストールは、安全のため、シェルにグローバル npm インストール設定がある場合でも、Plugin ごとに管理される単一の npm プロジェクト内で `--ignore-scripts` を付けて実行されます。管理対象 Plugin の npm プロジェクトは、OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホスト側のセキュリティ固定は巻き上げられた Plugin の依存関係にも適用されます。

    npm による解決を明示するには `npm:<package>` を使用します。修飾なしのパッケージ仕様も、公式 Plugin ID と一致しない限り、ローンチ移行期間中は npm から直接インストールされます。

    バンドル済み Plugin と一致する未加工の `@openclaw/*` 仕様は、npm へのフォールバックより先に、イメージが所有するバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は、管理対象の npm オーバーライドを作成する代わりに、現在の OpenClaw ビルドに含まれるバンドル済み Discord Plugin を使用します。外部の npm パッケージを強制的に使用するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    修飾なしの仕様と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版も、この確認では安定版として扱われます。npm がいずれかの形式をプレリリース版に解決した場合、OpenClaw は停止し、プレリリースタグ（`@beta`/`@rc`）または完全一致するプレリリースバージョン（`@1.2.3-beta.4`）を使って明示的にオプトインするよう求めます。

    完全一致するバージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決されたパッケージのメタデータを確認します。最新の安定版パッケージが、より新しい OpenClaw Plugin API またはより高いホストの最低バージョンを必要とする場合、OpenClaw は過去の安定版を調べ、互換性のある最新リリースを代わりにインストールします。完全一致するバージョンと明示的な dist-tag は厳密に扱われます。互換性のない選択は失敗し、OpenClaw をアップグレードするか、互換性のあるバージョンを選択するよう求められます。

    修飾なしのインストール仕様が公式 Plugin ID（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同名の npm パッケージをインストールするには、明示的なスコープ付き仕様（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git リポジトリ">
    Git リポジトリから直接インストールするには `git:<repo>` を使用します。対応する形式は、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL です。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールでは一時ディレクトリにクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。そのため、マニフェスト検証、運用者のインストールポリシー、パッケージマネージャーによるインストール処理、およびインストール記録は npm インストールと同様に動作します。記録される Git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    Git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、Gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` で CLI ルートを登録した場合は、OpenClaw のルート CLI を通じてそのコマンドを直接実行します。たとえば、`openclaw demo-plugin ping` です。

  </Accordion>
  <Accordion title="アーカイブ">
    対応するアーカイブは `.zip`、`.tgz`、`.tar.gz`、`.tar` です。ネイティブ OpenClaw Plugin のアーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が必要です。`package.json` しか含まないアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールと同じ
    Plugin ごとの管理対象 npm プロジェクトパスを使用する場合は、
    `npm-pack:<path.tgz>` を使用します。これには `package-lock.json` の検証、
    巻き上げられた依存関係のスキャン、および npm インストール記録が
    含まれます。通常のアーカイブパスは引き続き、Plugin の extensions
    ルート配下にローカルアーカイブとしてインストールされます。

    Claude マーケットプレイスからのインストールにも対応しています。

  </Accordion>
</AccordionGroup>

ClawHub からのインストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm で安全に使用できる修飾なしの Plugin 仕様は、公式 Plugin ID と一致しない限り、ローンチ移行期間中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみで解決することを明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、公開されている Plugin API / Gateway の最低互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトのダイジェストを検証してから、通常のアーカイブ経路を通じてインストールします。ClawPack メタデータがない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証経路を通じてインストールされます。記録されるインストールには、後の更新に備えて、ClawHub のソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、および ClawPack ダイジェスト情報が保持されます。
バージョン未指定の ClawHub インストールでは、`openclaw plugins update` がより新しい ClawHub リリースを追跡できるように、記録される仕様もバージョン未指定のまま保持されます。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

### マーケットプレイスの短縮記法

マーケットプレイス名が `~/.claude/plugins/known_marketplaces.json` にある Claude のローカルレジストリキャッシュに存在する場合は、`plugin@marketplace` の短縮記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

マーケットプレイスのソースを明示的に渡すには `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスのソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルのマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリの短縮記法
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - Git URL

  </Tab>
  <Tab title="リモートマーケットプレイスの規則">
    GitHub または Git から読み込まれるリモートマーケットプレイスでは、Plugin エントリがクローンされたマーケットプレイスリポジトリ内に収まっている必要があります。OpenClaw は、そのリポジトリからの相対パスソースを受け入れ、リモートマニフェストに含まれる HTTP(S)、絶対パス、Git、GitHub、およびその他の非パス形式の Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は以下を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json`。このマニフェストファイルがない場合は、Claude のデフォルトコンポーネント構成）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

管理対象のローカルインストールは、Plugin ディレクトリまたはアーカイブである必要があります。単独の `.js`、
`.mjs`、`.cjs`、および `.ts` Plugin ファイルは、`plugins install` によって管理対象 Plugin
ルートへコピーされず、`~/.openclaw/extensions` または
`<workspace>/.openclaw/extensions` に直接配置しても読み込まれません。これらの
自動検出ルートは Plugin パッケージまたはバンドルディレクトリを読み込み、最上位の
スクリプトファイルはローカルヘルパーとしてスキップします。代わりに、単独ファイルを
`plugins.load.paths` に明示的に列挙してください。

<Note>
互換バンドルは通常の Plugin ルートへインストールされ、同じ一覧表示/情報表示/有効化/無効化フローに参加します。現在は、バンドルされた Skills、Claude のコマンド Skills、Claude の `settings.json` デフォルト、Claude の `.lsp.json` / マニフェストで宣言された `lspServers` デフォルト、Cursor のコマンド Skills、および互換性のある Codex フックディレクトリに対応しています。検出されたその他のバンドル機能は診断/情報に表示されますが、まだランタイム実行には接続されていません。
</Note>

ローカル Plugin ディレクトリをコピーせずに参照するには、`-l`/`--link` を使用します
（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

`--link` は `--force` と併用できません（リンクされた Plugin はソース
パスを直接参照するため、その場で上書きするものがありません）。また、`--marketplace` や
`git:` インストールとも併用できず、すでに存在するローカルパスが必要です。

<Note>
ワークスペースの extensions ルートから検出されたワークスペース由来の Plugin は、
明示的に有効化されるまでインポートも実行もされません。ローカル開発では、
`openclaw plugins enable <plugin-id>` を実行するか、
`plugins.entries.<plugin-id>.enabled: true` を設定します。設定で
`plugins.allow` を使用している場合は、同じ Plugin ID もそこに含めてください。この
フェイルクローズ規則は、チャンネル設定がセットアップ専用の読み込みのために
ワークスペース由来の Plugin を明示的に対象とする場合にも適用されます。そのため、
ワークスペース Plugin が無効なまま、または許可リストから除外されている間は、
ローカルチャンネル Plugin のセットアップコードは実行されません。リンクインストールと
明示的な `plugins.load.paths` エントリは、解決された Plugin の由来に対する通常の
ポリシーに従います。詳細は
[Plugin ポリシーの設定](/ja-JP/tools/plugin#configure-plugin-policy)
および [設定リファレンス](/ja-JP/gateway/configuration-reference#plugins)
を参照してください。

npm インストールで `--pin` を使用すると、デフォルトの動作は固定なしのまま、解決された完全一致仕様（`name@version`）を管理対象 Plugin インデックスに保存できます。
</Note>

## 一覧

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  有効な Plugin のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  表形式の表示から、形式/ソース/由来/バージョン/有効化メタデータを含む Plugin ごとの詳細行へ切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加え、レジストリ診断とパッケージ依存関係のインストール状態を表示します。
</ParamField>

<Note>
`plugins list` は最初に永続化されたローカル Plugin レジストリを読み込み、レジストリが存在しないか無効な場合は、マニフェストのみから導出したフォールバックを使用します。Plugin がインストール済みか、有効か、コールドスタート計画から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、フックポリシー、または `plugins.load.paths` を変更した後、新しい `register(api)` コードやフックが実行されることを期待する前に、チャンネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と
`optionalDependencies` から得られる各 Plugin の `dependencyStatus` が含まれます。
OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules`
検索パス上に存在するかを確認します。Plugin のランタイムコードをインポートしたり、
パッケージマネージャーを実行したり、不足している依存関係を修復したりはしません。
</Note>

起動ログに `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
と表示された場合は、`openclaw plugins list --enabled --verbose`、または
一覧にある Plugin ID を指定した `openclaw plugins inspect <id>` を実行して Plugin
ID を確認し、信頼する ID を `openclaw.json` の `plugins.allow` にコピーしてください。
警告ですべての検出済み Plugin を列挙できる場合は、それらの ID がすでに含まれた、
そのまま貼り付け可能な `plugins.allow` スニペットが表示されます。Plugin が
インストール元や読み込みパスの来歴なしで読み込まれる場合は、その Plugin ID を調査し、
信頼する ID を `plugins.allow` に固定するか、信頼できるソースから Plugin を
再インストールして、OpenClaw にインストールの来歴を記録させてください。

パッケージ化された Docker イメージ内でバンドル済み Plugin を扱う場合は、
`/app/extensions/synology-chat` のように、対応するパッケージ化済みソースパスの上へ
Plugin のソースディレクトリをバインドマウントします。OpenClaw は、
`/app/dist/extensions/synology-chat` より先に、そのマウントされたソースオーバーレイを
検出します。単にコピーしたソースディレクトリは動作しないため、通常のパッケージ版
インストールでは引き続きコンパイル済み dist が使用されます。

ランタイムフックをデバッグする場合：

- `openclaw plugins inspect <id> --runtime --json` は、モジュールを読み込む検査パスで登録済みフックと診断情報を表示します。ランタイム検査では依存関係をインストールしません。従来の依存関係の状態を整理する場合や、設定から参照されているダウンロード可能な Plugin が欠落している場合に復旧するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway の URL/プロファイル、サービス/プロセスのヒント、設定パス、RPC の正常性を確認します。
- バンドルされていない会話フック（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

### Plugin インデックス

Plugin のインストールメタデータは、ユーザー設定ではなく、システムによって管理される状態です。インストールと更新では、アクティブな OpenClaw 状態ディレクトリ配下の共有 SQLite 状態データベースに書き込まれます。`installed_plugin_index` 行には、破損または欠落した Plugin マニフェストのレコードを含む永続的な `installRecords` メタデータと、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使用される、マニフェストから生成されたコールドレジストリキャッシュが保存されます。

OpenClaw が設定内でリリース済みの従来形式の `plugins.installs` レコードを検出すると、ランタイムの読み取りでは、`openclaw.json` を書き換えずに互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、それらのレコードを Plugin インデックスへ移動し、設定の書き込みが許可されている場合は設定キーを削除します。いずれかの書き込みに失敗した場合、インストールメタデータが失われないよう、設定内のレコードは保持されます。

## アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` は、`plugins.entries`、永続化された Plugin インデックス、Plugin の許可/拒否リスト項目、および該当する場合はリンクされた `plugins.load.paths` 項目から Plugin レコードを削除します。`--keep-files` が設定されていない限り、追跡対象の管理インストールディレクトリも削除しますが、削除されるのは、そのディレクトリが OpenClaw の Plugin 拡張機能ルート内に解決される場合に限られます。Plugin が現在 `memory` または `contextEngine` スロットを所有している場合、そのスロットはデフォルト（メモリの場合は `memory-core`、コンテキストエンジンの場合は `legacy`）にリセットされます。

`uninstall` は削除対象のプレビューを表示し、変更を加える前に `Uninstall plugin "<id>"?` と確認します。確認プロンプトを省略するには `--force` を指定します（スクリプトや非対話実行に便利です）。指定しない場合、アンインストールには対話型 TTY が必要です。`--dry-run` は同じプレビューを表示し、確認も変更も行わずに終了します。

<Note>
`--keep-config` は、非推奨の `--keep-files` のエイリアスとしてサポートされています。
</Note>

## 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理対象 Plugin インデックスで追跡される Plugin インストールと、`hooks.internal.installs` で追跡されるフックパックのインストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin ID と npm 指定の解決">
    Plugin ID を渡すと、OpenClaw はその Plugin に記録されているインストール指定を再利用します。つまり、以前保存された `@beta` などの dist-tag や、厳密に固定されたバージョンは、以降の `update <id>` の実行でも引き続き使用されます。

    `update <id> --dry-run` では、厳密に固定された npm インストールは固定されたままです。OpenClaw がパッケージのレジストリ既定リリースラインも解決でき、その既定ラインがインストール済みの固定バージョンより新しい場合、ドライランでは固定状態を報告し、レジストリの既定ラインに追従するための明示的な `@latest` パッケージ更新コマンドを表示します。

    この対象指定更新の規則は、一括メンテナンスパスである `openclaw plugins update --all` とは異なります。一括更新でも通常の追跡対象インストール指定は尊重されますが、信頼済みの公式 OpenClaw Plugin レコードは、古い厳密指定の公式パッケージに留まる代わりに、現在の公式カタログの対象へ同期される場合があります。厳密指定またはタグ付きの公式指定を意図的に変更せず保持する場合は、対象を指定した `update <id>` を使用してください。

    npm インストールでは、dist-tag または厳密なバージョンを含む明示的な npm パッケージ指定を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに対応付け、インストール済み Plugin を更新し、今後の ID ベースの更新に使用する新しい npm 指定を記録します。

    バージョンやタグを付けずに npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに対応付けられます。Plugin が厳密なバージョンに固定されており、レジストリの既定リリースラインへ戻したい場合に使用してください。

  </Accordion>
  <Accordion title="ベータチャネルの更新">
    対象を指定した `openclaw plugins update <id-or-npm-spec>` は、新しい指定を渡さない限り、追跡対象の Plugin 指定を再利用します。一括実行の `openclaw plugins update --all` は、信頼済みの公式 Plugin レコードを公式カタログの対象へ同期する際に、設定済みの `update.channel` を使用します。そのため、ベータチャネルのインストールは、暗黙的に stable/latest へ正規化されることなく、ベータリリースラインに留まれます。

    `openclaw update` は、アクティブな OpenClaw 更新チャネルも認識します。ベータチャネルでは、既定ラインの npm および ClawHub Plugin レコードで最初に `@beta` を試します。Plugin のベータリリースが存在しない場合は、記録済みの default/latest 指定へフォールバックします。npm Plugin では、ベータパッケージが存在していてもインストール検証に失敗した場合にもフォールバックします。このフォールバックは警告として報告され、コアの更新を失敗させることはありません。厳密なバージョンと明示的なタグは、対象指定更新ではそのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="バージョン検査と整合性のずれ">
    npm の実更新前に、OpenClaw はインストール済みパッケージのバージョンを npm レジストリのメタデータと照合します。インストール済みバージョンと記録済みアーティファクト識別情報が解決された対象にすでに一致する場合、ダウンロード、再インストール、`openclaw.json` の書き換えを行わずに更新をスキップします。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変化している場合、OpenClaw はそれを npm アーティファクトのずれとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な続行ポリシーを指定しない限り、安全側に倒して失敗します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は互換性のために `plugins update` でも受け付けられますが、非推奨であり、Plugin の更新動作には影響しなくなりました。運用者の `security.installPolicy` は引き続き更新をブロックできます。Plugin の `before_install` フックは、Plugin フックが読み込まれているプロセスでのみ適用されます。
  </Accordion>
  <Accordion title="更新時の --acknowledge-clawhub-risk">
    コミュニティの ClawHub を利用する Plugin の更新では、置換パッケージをダウンロードする前に、インストール時と同じ厳密なリリース信頼性検査を実行します。選択した ClawHub リリースにリスクのある信頼性警告があっても続行すべき、レビュー済みの自動化では、`--acknowledge-clawhub-risk` を使用してください。公式 ClawHub パッケージおよびバンドル済み OpenClaw Plugin ソースでは、このリリース信頼性プロンプトは省略されます。
  </Accordion>
</AccordionGroup>

## 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

検査では、デフォルトでは Plugin ランタイムをインポートせずに、識別情報、読み込み状態、ソース、マニフェストの機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバーのサポートを表示します。JSON 出力には `contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin マニフェスト契約が含まれるため、運用者は Plugin を有効化または再起動する前に、信頼対象サーフェスの宣言を監査できます。`--runtime` を追加すると Plugin モジュールを読み込み、登録済みのフック、ツール、コマンド、サービス、Gateway メソッド、HTTP ルートを含めます。ランタイム検査では、欠落している Plugin の依存関係を直接報告します。インストールと修復は、引き続き `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` で行います。

Plugin が所有する CLI コマンドは通常、ルートの `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` などのコア親コマンドの配下にネストしたコマンドを登録することもできます。`inspect --runtime` で `cliCommands` 配下にコマンドが表示されたら、一覧に示されたパスで実行してください。たとえば、`demo-git` を登録する Plugin は、`openclaw demo-git ping` で確認できます。

各 Plugin は、ランタイムで実際に登録する内容に基づいて分類されます。

| 形態                | 意味                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `plain-capability`  | 機能タイプが厳密に 1 つ（例：プロバイダー専用 Plugin）               |
| `hybrid-capability` | 複数の機能タイプ（例：テキスト + 音声 + 画像）                        |
| `hook-only`         | フックのみで、機能、ツール、コマンド、サービス、ルートはなし          |
| `non-capability`    | ツール/コマンド/サービスはあるが、機能はなし                          |

機能モデルの詳細については、[Plugin の形態](/ja-JP/plugins/architecture#plugin-shapes)を参照してください。

<Note>
`--json` フラグは、スクリプト処理と監査に適した機械可読レポートを出力します。`inspect --all` は、形態、機能の種類、互換性通知、バンドル機能、フックの概要列を含む、全体規模の表を表示します。`info` は `inspect` のエイリアスです。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin の読み込みエラー、マニフェスト/検出の診断、互換性通知、欠落した Plugin スロットなどの古い Plugin 設定参照を報告します。インストールツリーと Plugin 設定に問題がない場合は、`No plugin issues detected.` と表示します。古い設定が残っていても、インストールツリーがそれ以外は正常な場合、完全に正常であるかのように示すのではなく、その旨を概要に表示します。

設定済み Plugin がディスク上に存在していても、ローダーのパス安全性検査によってブロックされている場合、設定検証では Plugin 項目を保持し、`present but blocked` と報告します。`plugins.entries.<id>` または `plugins.allow` の設定を削除するのではなく、パスの所有権や全ユーザー書き込み可能な権限など、その前に表示されたブロック対象 Plugin の診断を修正してください。

`register`/`activate` エクスポートの欠落など、モジュール形態の失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力に簡潔なエクスポート形態の概要が含まれます。

## レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の識別情報、有効化状態、ソースメタデータ、コントリビューションの所有権に関する、OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者の検索、チャネル設定の分類、Plugin インベントリでは、Plugin ランタイムモジュールをインポートせずにこのレジストリを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古くなっているかを確認します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築されます。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリに隣接する管理対象 npm のずれも修復します。管理対象 Plugin の npm プロジェクトまたは従来のフラットな管理対象 npm ルート配下で、孤立または復旧された `@openclaw/*` パッケージがバンドル済み Plugin を覆い隠している場合、Doctor はその古いパッケージを削除し、起動時にバンドル済みマニフェストに対して検証されるようレジストリを再構築します。また Doctor は、`peerDependencies.openclaw` を宣言する管理対象 npm Plugin に、ホストの `openclaw` パッケージを再リンクします。これにより、更新や npm 修復後も `openclaw/plugin-sdk/*` などのパッケージローカルなランタイムインポートを解決できます。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時に使用する非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。環境変数によるフォールバックは、移行の展開中に緊急起動を復旧する場合にのみ使用してください。
</Warning>

## マーケットプレイス

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` は、設定済みの OpenClaw マーケットプレイスフィードのエントリを一覧表示します。デフォルトではホストされたフィードの取得を試み、失敗した場合は最新の承認済みスナップショットまたは同梱データにフォールバックします。特定の設定済みプロファイルを読み取るには `--feed-profile <name>`、明示的なホスト済みフィード URL を読み取るには `--feed-url <url>`、フィードを取得せずに最新の承認済みスナップショットを読み取るには `--offline` を使用します。

`plugins marketplace refresh` は、設定済みのホスト済みフィードのスナップショットを更新し、OpenClaw がホスト済みデータ、ホスト済みスナップショット、または同梱のフォールバックデータのいずれを承認したかを報告します。新しく取得したホスト済みペイロードが固定されたチェックサムと一致しない限りコマンドを失敗させる必要がある場合は、`--expected-sha256` を使用します。

マーケットプレイスの `list` は、ローカルのマーケットプレイスパス、`marketplace.json` のパス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決済みのソースラベルに加え、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

マーケットプレイスの更新では、ホストされた OpenClaw マーケットプレイスフィードを読み込み、検証済みのレスポンスをローカルのホスト済みフィードスナップショットとして永続化します。オプションを指定しない場合は、設定済みのデフォルトフィードプロファイルを使用します。特定の設定済みプロファイルを更新するには `--feed-profile <name>`、明示的なホスト済みフィード URL を更新するには `--feed-url <url>`、ペイロードのチェックサム一致を必須にするには `--expected-sha256 <sha256>`（`sha256:<hex>` またはプレフィックスのない64文字の16進ダイジェスト）、機械可読形式で出力するには `--json` を使用します。明示的なホスト済みフィード URL に認証情報、クエリ文字列、フラグメントを含めてはなりません。チェックサムを固定しない更新では、ホスト済みスナップショットまたは同梱のフォールバック結果が報告されても、コマンドは失敗しません。チェックサムを固定した更新は、新しく取得したホスト済みペイロードを承認した場合にのみ成功します。また、ホスト済みデータの更新に成功しても、OpenClaw が検証済みスナップショットを永続化できない場合は失敗します。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/clawhub)
