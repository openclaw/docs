---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい
    - シンプルなツール Plugin をスキャフォールドまたは検証したい
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-07-06T10:49:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gateway プラグイン、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ja-JP/tools/plugin">
    プラグインのインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Manage plugins" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例。
  </Card>
  <Card title="Plugin bundles" href="/ja-JP/plugins/bundles">
    バンドル互換性モデル。
  </Card>
  <Card title="Plugin manifest" href="/ja-JP/plugins/manifest">
    マニフェストフィールドと設定スキーマ。
  </Card>
  <Card title="Security" href="/ja-JP/gateway/security">
    プラグインインストールのセキュリティ強化。
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

低速なインストール、検査、アンインストール、またはレジストリ更新の調査では、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの所要時間を stderr に書き込み、
JSON 出力は解析可能なまま保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、`openclaw.json` は不変です。`install`、`update`、`uninstall`、`enable`、`disable` はすべて実行を拒否します。代わりに、このインストール用の Nix ソース（nix-openclaw では `programs.openclaw.config` または `instances.<name>.config`）を編集してから再ビルドします。エージェントファーストの[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を参照してください。
</Note>

<Note>
バンドル済みプラグインは OpenClaw に同梱されます。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザープラグイン）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw プラグインは、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱します。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な一覧/info 出力には、バンドルサブタイプ（`codex`、`claude`、または `cursor`）と、検出されたバンドル機能も表示されます。
</Note>

## 作成

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` はデフォルトで最小構成の TypeScript ツールプラグインを作成します。最初の
引数はプラグイン id です。`--name` は表示名を設定します。OpenClaw は
デフォルトの出力ディレクトリとパッケージ名に id を使用します。ツールスキャフォールドは
`defineToolPlugin` を使用し、ビルドしてから `openclaw plugins build`/`validate` を呼び出す
`package.json` スクリプト `plugin:build` と
`plugin:validate` を生成します。

`plugins build` はビルド済みエントリをインポートし、その静的ツールメタデータを読み取り、
`openclaw.plugin.json` を書き込み、`package.json` の `openclaw.extensions` を同期した状態に保ちます。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、現在のエントリエクスポートが
引き続き一致していることを確認します。完全な作成ワークフローについては
[ツールプラグイン](/ja-JP/plugins/tool-plugins)を参照してください。

スキャフォールドは TypeScript ソースを書き込みますが、ビルド済みの
`./dist/index.js` エントリからメタデータを生成するため、このワークフローは公開済み CLI でも機能します。
エントリがデフォルトのパッケージエントリでない場合は `--entry <path>` を使用します。
CI では `plugins build --check` を使用すると、生成済みメタデータが古い場合に
ファイルを書き換えず失敗させることができます。

### プロバイダースキャフォールド

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

プロバイダースキャフォールドは、API キー認証の配管、`clawhub package validate` を実行する
`npm run validate` スクリプト、ClawHub パッケージメタデータ、GitHub
OIDC 経由の将来的な信頼済み公開のための手動ディスパッチ GitHub Actions ワークフローを備えた、
汎用の OpenAI 互換モデルプロバイダープラグインを作成します。プロバイダースキャフォールドは Skills を生成せず、
`openclaw plugins build`/`validate` も使用しません。これらのコマンドは、ツール
スキャフォールドの生成メタデータパス用です。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメント
ルート、認証情報テキスト、README コピーを実際のプロバイダー詳細に置き換えてください。
初回の ClawHub 公開と信頼済み公開者セットアップには、生成された README を使用します。

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

メンテナーがセットアップ時インストールをテストする場合、保護された環境変数で自動プラグインインストール
ソースを上書きできます。
[プラグインインストールの上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
裸のパッケージ名は、ローンチ移行期間中はデフォルトで npm からインストールされます。ただし、バンドル済みまたは公式プラグイン id と一致する場合、OpenClaw は npm レジストリにアクセスせず、そのローカル/公式コピーを使用します。外部 npm パッケージを意図的に使いたい場合は `npm:<package>` を使用してください。ClawHub には `clawhub:<package>` を使用します。プラグインのインストールはコードを実行するものとして扱い、固定バージョンを優先してください。
</Warning>

`plugins search` は、インストール可能な `code-plugin` および
`bundle-plugin` パッケージを ClawHub に問い合わせます（Skills ではありません。それらには `openclaw skills search` を使用します）。
デフォルトの `--limit` は 20 で、上限は 100 です。リモートカタログを読むだけで、
ローカル状態の検査、設定変更、パッケージインストール、プラグインランタイムの
ロードは行いません。結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、
概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

<Note>
ClawHub は、ほとんどのプラグインにとって主要な配布および発見の場です。npm は
サポートされるフォールバックおよび直接インストール経路として残ります。OpenClaw 所有の
`@openclaw/*` プラグインパッケージは npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[プラグインインベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールでは `latest` を使用します。
ベータチャンネルのインストールと更新では、利用可能な場合は npm の `beta` dist-tag を優先し、
なければ `latest` にフォールバックします。extended-stable チャンネルでは、裸/default または `latest` の意図を持つ公式 npm プラグインは、
インストール済みコアの正確なバージョンに解決されます。正確なピン留め、明示的な非 `latest` タグ、サードパーティパッケージ、
および npm 以外のソースは書き換えられません。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟上書きを伴うインクルードは、平坦化せず fail closed します。サポートされる形については[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常 fail closed し、先に `openclaw doctor --fix` を実行するよう伝えます。Gateway 起動時およびホットリロード中は、無効なプラグイン設定は他の無効な設定と同様に fail closed します。`openclaw doctor --fix` は無効なプラグインエントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的に opt in したプラグイン向けの、狭いバンドル済みプラグイン復旧パスです。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` は既存のインストール先を再利用し、インストール済みのプラグインまたはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm プラグインの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みのプラグイン id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。`--force` は `--link` と併用できません。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` は npm インストールにのみ適用され、解決された正確な `<name>@<version>` を記録します。`git:` インストール（代わりに `git:github.com/acme/plugin@v1.2.3` のように spec 内で ref を固定してください）や `--marketplace` ではサポートされません（マーケットプレイスインストールは npm spec ではなく、マーケットプレイスソースメタデータを永続化します）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨であり、現在は no-op です。OpenClaw はプラグインインストール時に、組み込みの危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、オペレーター所有の `security.installPolicy` サーフェスを使用してください。プラグインの `before_install` フックはプラグインランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub で公開したプラグインがレジストリスキャンによって非表示またはブロックされている場合は、[ClawHub 公開](/ja-JP/clawhub/publishing)の公開者向け手順を使用してください。`--dangerously-force-unsafe-install` は ClawHub にプラグインの再スキャンを依頼したり、ブロックされたリリースを公開状態にしたりしません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティ ClawHub インストールは、ダウンロード前に選択されたリリースの信頼記録を確認します。ClawHub がそのリリースのダウンロードを無効にしている場合、悪意のあるスキャン結果を報告している場合、またはリリースをブロックするモデレーション状態（隔離、取り消し）に置いている場合、OpenClaw はこのフラグに関係なく完全に拒否します。ブロックしないリスクのあるスキャンステータスまたはモデレーション状態の場合、OpenClaw は信頼の詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub の警告を確認し、対話プロンプトなしで続行すると判断した場合にのみ使用してください。保留中または古い（まだクリーンではない）スキャン結果は警告しますが、確認は不要です。公式 ClawHub パッケージとバンドル済み OpenClaw プラグインソースは、このリリース信頼チェックを完全にバイパスします。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージのインストールではなく、フィルターされたフックの可視性とフックごとの有効化には `openclaw hooks` を使用してください。

    Npm 仕様は **レジストリ専用**（パッケージ名に任意の **正確なバージョン** または **dist-tag** を付けたもの）です。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係のインストールは、安全のため、シェルにグローバルな npm インストール設定がある場合でも、Plugin ごとに 1 つの管理対象 npm プロジェクトで `--ignore-scripts` を付けて実行されます。管理対象 Plugin npm プロジェクトは OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホストのセキュリティ pin は巻き上げられた Plugin 依存関係にも適用されます。

    npm 解決を明示するには `npm:<package>` を使用します。裸のパッケージ仕様も、公式 Plugin id と一致しない限り、ローンチ移行中は npm から直接インストールされます。

    バンドル済み Plugin と一致する生の `@openclaw/*` 仕様は、npm フォールバックの前にイメージ所有のバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は、管理対象 npm override を作成する代わりに、現在の OpenClaw ビルドのバンドル済み Discord Plugin を使用します。外部 npm パッケージを強制するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    裸の仕様と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版として扱われます。npm がどちらかの形式をプレリリースに解決した場合、OpenClaw は停止し、プレリリースタグ（`@beta`/`@rc`）または正確なプレリリースバージョン（`@1.2.3-beta.4`）で明示的にオプトインするよう求めます。

    正確なバージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決されたパッケージメタデータを確認します。最新の安定版パッケージがより新しい OpenClaw Plugin API または最小ホストバージョンを必要とする場合、OpenClaw は古い安定版を調べ、互換性のある最新リリースを代わりにインストールします。正確なバージョンと明示的な dist-tag は厳格なままです。互換性のない選択は失敗し、OpenClaw をアップグレードするか互換性のあるバージョンを選ぶよう求めます。

    裸のインストール仕様が公式 Plugin id（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的な scoped 仕様（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git repositories">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式: `git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、指定された ref がある場合はチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。そのため、マニフェスト検証、オペレーターのインストールポリシー、パッケージマネージャーのインストール処理、インストール記録は npm インストールと同じように動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を検証します。Plugin が `api.registerCli` で CLI root を登録した場合は、そのコマンドを OpenClaw root CLI から直接実行します。たとえば `openclaw demo-plugin ping` です。

  </Accordion>
  <Accordion title="Archives">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin root に有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball で、レジストリインストールと同じ Plugin ごとの管理対象 npm プロジェクトパスを使用したい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` 検証、巻き上げられた依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、Plugin extensions root 配下のローカルアーカイブとして引き続きインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールは明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

裸の npm 安全な Plugin 仕様は、公式 Plugin id と一致しない限り、ローンチ移行中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 専用の解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、広告されている Plugin API / 最小 gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub digest ヘッダーとアーティファクト digest を検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証パスを通じて引き続きインストールされます。記録されたインストールは、後の更新に備えて ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack digest 情報を保持します。
バージョンなしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるように、バージョンなしの記録済み仕様を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

### Marketplace 省略記法

marketplace 名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace ソースを明示的に渡すには `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知 marketplace 名
    - ローカル marketplace root または `marketplace.json` パス
    - `owner/repo` のような GitHub repo 省略記法
    - `https://github.com/owner/repo` のような GitHub repo URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub または git から読み込まれるリモート marketplace では、Plugin エントリはクローンされた marketplace repo の内部に留まる必要があります。OpenClaw はその repo からの相対パスソースを受け入れ、リモートマニフェストからの HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json`、またはそのマニフェストファイルがない場合のデフォルト Claude component レイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

管理対象ローカルインストールは Plugin ディレクトリまたはアーカイブである必要があります。スタンドアロンの `.js`、`.mjs`、`.cjs`、`.ts` Plugin ファイルは、`plugins install` によって管理対象 Plugin root にコピーされず、`~/.openclaw/extensions` または `<workspace>/.openclaw/extensions` に直接配置しても読み込まれません。これらの自動検出 root は Plugin パッケージまたはバンドルディレクトリを読み込み、トップレベルのスクリプトファイルはローカルヘルパーとしてスキップします。スタンドアロンファイルは代わりに `plugins.load.paths` に明示的に列挙してください。

<Note>
互換バンドルは通常の Plugin root にインストールされ、同じ list/info/enable/disable フローに参加します。現在、bundle skills、Claude command-skills、Claude `settings.json` defaults、Claude `.lsp.json` / マニフェスト宣言の `lspServers` defaults、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他の bundle capabilities は diagnostics/info に表示されますが、まだ runtime execution には接続されていません。
</Note>

ローカル Plugin ディレクトリをコピーせずに指すには `-l`/`--link` を使用します（`plugins.load.paths` に追加します）。

```bash
openclaw plugins install -l ./my-plugin
```

`--link` は `--force`（リンクされた Plugin はソースパスを直接指すため、その場で上書きするものがありません）、`--marketplace`、または `git:` インストールではサポートされません。また、既に存在するローカルパスが必要です。

<Note>
workspace extensions root から検出された workspace origin Plugin は、明示的に有効化されるまでインポートも実行もされません。ローカル開発では、`openclaw plugins enable <plugin-id>` を実行するか、`plugins.entries.<plugin-id>.enabled: true` を設定します。設定で `plugins.allow` を使用している場合は、同じ Plugin id もそこに含めます。この fail-closed ルールは、channel setup が setup-only loading のために workspace-origin Plugin を明示的に対象にしている場合にも適用されます。そのため、その workspace Plugin が無効のまま、または allowlist から除外されたままでは、ローカル channel Plugin setup コードは実行されません。リンクインストールと明示的な `plugins.load.paths` エントリは、解決された Plugin origin に対する通常のポリシーに従います。[Plugin ポリシーを設定する](/ja-JP/tools/plugin#configure-plugin-policy)と[設定リファレンス](/ja-JP/gateway/configuration-reference#plugins)を参照してください。

npm インストールで `--pin` を使用すると、デフォルトの未固定動作を維持しつつ、解決された正確な仕様（`name@version`）を管理対象 Plugin インデックスに保存できます。
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
  テーブル表示から、format/source/origin/version/activation メタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに、レジストリ diagnostics とパッケージ依存関係のインストール状態を加えたものです。
</ParamField>

<Note>
`plugins list` は永続化されたローカル Plugin レジストリを最初に読み取り、レジストリが欠落または無効な場合は manifest-only の派生フォールバックを使用します。これは、Plugin がインストール済み、有効、そして cold startup planning から見えるかを確認するのに有用ですが、既に実行中の Gateway プロセスに対する live runtime probe ではありません。Plugin コード、有効化、hook policy、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook が実行されることを期待する前に、channel を提供する Gateway を再起動してください。リモート/コンテナデプロイでは、wrapper process だけでなく、実際の `openclaw gateway run` child を再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から得られる各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` lookup path 上に存在するかを確認します。Plugin runtime code のインポート、package manager の実行、欠落 dependencies の修復は行いません。
</Note>

起動ログに `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` と出た場合は、`openclaw plugins list --enabled --verbose` を実行するか、表示された Plugin id で `openclaw plugins inspect <id>` を実行し、Plugin id を確認して信頼済み id を `openclaw.json` の `plugins.allow` にコピーします。警告が検出されたすべての Plugin を列挙できる場合は、それらの id を既に含む貼り付け可能な `plugins.allow` snippet を出力します。Plugin が install/load-path provenance なしで読み込まれる場合は、その Plugin id を inspect してから、信頼済み id を `plugins.allow` に固定するか、信頼できるソースから Plugin を再インストールして OpenClaw が install provenance を記録できるようにします。

パッケージ化された Docker image 内でバンドル済み Plugin を扱う場合は、Plugin ソースディレクトリを `/app/extensions/synology-chat` のような一致する packaged source path に bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、その mounted source overlay を検出します。単にコピーされた source directory は inert のままなので、通常の packaged installs は引き続き compiled dist を使用します。

runtime hook debugging の場合:

- `openclaw plugins inspect <id> --runtime --json` は、モジュールを読み込む検査パスから登録済みフックと診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係の状態をクリーンアップする、または設定から参照されている不足したダウンロード可能 Plugin を復旧するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway の URL/プロファイル、サービス/プロセスのヒント、設定パス、RPC の健全性を確認します。
- バンドルされていない会話フック（`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなくマシン管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の共有 SQLite 状態データベースにそれを書き込みます。`installed_plugin_index` 行には、壊れている、または不足している Plugin マニフェストのレコードを含む永続的な `installRecords` メタデータに加えて、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使用される、マニフェスト由来のコールドレジストリキャッシュが保存されます。

OpenClaw が設定内で出荷済みレガシーの `plugins.installs` レコードを検出した場合、ランタイム読み取りは `openclaw.json` を書き換えずに、それらを互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、設定書き込みが許可されている場合、それらのレコードを Plugin インデックスへ移動し、設定キーを削除します。どちらかの書き込みに失敗した場合、インストールメタデータが失われないように設定レコードは保持されます。

## アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` は、該当する場合、`plugins.entries`、永続化された Plugin インデックス、Plugin の許可/拒否リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは追跡対象の管理インストールディレクトリも削除しますが、それが OpenClaw の Plugin extensions ルート内に解決される場合に限ります。Plugin が現在 `memory` または `contextEngine` スロットを所有している場合、そのスロットはデフォルト（memory は `memory-core`、コンテキストエンジンは `legacy`）にリセットされます。

`uninstall` は削除対象のプレビューを表示し、その後、変更を行う前に `Uninstall plugin "<id>"?` と確認します。確認プロンプトをスキップするには `--force` を渡してください（スクリプトや非対話実行で便利です）。指定しない場合、アンインストールには対話型 TTY が必要です。`--dry-run` は同じプレビューを表示し、プロンプトや変更を行わずに終了します。

<Note>
`--keep-config` は、`--keep-files` の非推奨エイリアスとしてサポートされています。
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

更新は、管理 Plugin インデックス内で追跡されている Plugin インストールと、`hooks.internal.installs` 内で追跡されているフックパックインストールに適用されます。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Plugin ID を渡すと、OpenClaw はその Plugin に記録されているインストール仕様を再利用します。つまり、以前保存された `@beta` などの dist-tag や正確にピン留めされたバージョンは、以後の `update <id>` 実行でも引き続き使用されます。

    `update <id> --dry-run` 中、正確にピン留めされた npm インストールはピン留めされたままです。OpenClaw がパッケージのレジストリ既定ラインも解決でき、その既定ラインがインストール済みのピン留めバージョンより新しい場合、ドライランはピンを報告し、レジストリ既定ラインに従うための明示的な `@latest` パッケージ更新コマンドを表示します。

    その対象指定更新ルールは、一括の `openclaw plugins update --all` メンテナンスパスとは異なります。一括更新は通常の追跡インストール仕様を引き続き尊重しますが、信頼済みの公式 OpenClaw Plugin レコードは、古い正確な公式パッケージに留まる代わりに、現在の公式カタログターゲットへ同期できます。正確な、またはタグ付きの公式仕様を意図的に変更しない場合は、対象指定の `update <id>` を使用してください。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ仕様を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の ID ベース更新用に新しい npm 仕様を記録します。

    バージョンやタグなしで npm パッケージ名を渡しても、追跡対象の Plugin レコードへ解決されます。Plugin が正確なバージョンにピン留めされていて、レジストリの既定リリースラインへ戻したい場合に使用してください。

  </Accordion>
  <Accordion title="Beta channel updates">
    対象指定の `openclaw plugins update <id-or-npm-spec>` は、新しい仕様を渡さない限り、追跡対象の Plugin 仕様を再利用します。一括の `openclaw plugins update --all` は、信頼済みの公式 Plugin レコードを公式カタログターゲットへ同期するときに、設定済みの `update.channel` を使用します。そのため、ベータチャネルのインストールは、stable/latest に黙って正規化される代わりに、ベータリリースラインに留まることができます。

    `openclaw update` も、アクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、既定ラインの npm および ClawHub Plugin レコードは最初に `@beta` を試します。Plugin のベータリリースが存在しない場合は、記録済みの既定/latest 仕様へフォールバックします。npm Plugin では、ベータパッケージが存在してもインストール検証に失敗した場合にもフォールバックします。そのフォールバックは警告として報告され、コア更新を失敗させません。正確なバージョンと明示的なタグは、対象指定更新ではそのセレクターにピン留めされたままです。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が解決済みターゲットとすでに一致している場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えを行わずにスキップされます。

    保存済みの完全性ハッシュが存在し、取得したアーティファクトハッシュが変化している場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待ハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、フェイルクローズします。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` は互換性のため `plugins update` でも受け付けられますが、非推奨であり、もはや Plugin 更新の挙動を変更しません。オペレーターの `security.installPolicy` は引き続き更新をブロックできます。Plugin の `before_install` フックは、Plugin フックが読み込まれているプロセスでのみ適用されます。
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    コミュニティの ClawHub バックの Plugin 更新では、置換パッケージをダウンロードする前に、インストール時と同じ正確なリリース信頼チェックを実行します。選択された ClawHub リリースにリスクのある信頼警告があっても続行すべき、レビュー済み自動化には `--acknowledge-clawhub-risk` を使用してください。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。
  </Accordion>
</AccordionGroup>

## 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

検査は、既定では Plugin ランタイムをインポートせずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバーサポートを表示します。JSON 出力には、`contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin マニフェスト契約が含まれるため、オペレーターは Plugin を有効化または再起動する前に、信頼対象サーフェスの宣言を監査できます。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済みフック、ツール、コマンド、サービス、Gateway メソッド、HTTP ルートを含めます。ランタイム検査は不足している Plugin 依存関係を直接報告します。インストールと修復は、`openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは通常、ルートの `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` などのコア親配下にネストされたコマンドを登録することもできます。`inspect --runtime` が `cliCommands` 配下のコマンドを表示したら、一覧にあるパスで実行してください。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録するものに基づいて分類されます。

| 形状                | 意味                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | ちょうど 1 種類の機能タイプ（例: プロバイダー専用 Plugin）         |
| `hybrid-capability` | 複数の機能タイプ（例: テキスト + 音声 + 画像）       |
| `hook-only`         | フックのみで、機能、ツール、コマンド、サービス、ルートはない |
| `non-capability`    | ツール/コマンド/サービスはあるが機能はない                       |

機能モデルの詳細は、[Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化と監査に適した機械可読レポートを出力します。`inspect --all` は、形状、機能種別、互換性通知、バンドル機能、フック概要の列を含む全体テーブルをレンダリングします。`info` は `inspect` のエイリアスです。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin 読み込みエラー、マニフェスト/検出診断、互換性通知、不足している Plugin スロットなどの古い Plugin 設定参照を報告します。インストールツリーと Plugin 設定がクリーンな場合、`No plugin issues detected.` と表示します。古い設定が残っていてもインストールツリーがそれ以外は健全な場合、完全な Plugin 健全性を示唆する代わりに、概要でその旨を示します。

設定済み Plugin がディスク上に存在していても、ローダーのパス安全性チェックによってブロックされている場合、設定検証は Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、先行するブロック済み Plugin 診断を修正してください。

`register`/`activate` エクスポートの不足など、モジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトなエクスポート形状の概要が含まれます。

## レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化状態、ソースメタデータ、貢献所有権に関する OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者検索、チャネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

永続化されたレジストリが存在するか、最新か、古くなっているかを確認するには、`plugins registry` を使用してください。永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築するには、`--refresh` を使用します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ隣接の管理 npm ドリフトも修復します。管理 Plugin npm プロジェクト配下、またはレガシーのフラットな管理 npm ルート配下にある孤立または復旧された `@openclaw/*` パッケージがバンドル済み Plugin を隠している場合、doctor はその古いパッケージを削除し、レジストリを再構築して、起動がバンドル済みマニフェストに対して検証されるようにします。Doctor は、`peerDependencies.openclaw` を宣言する管理 npm Plugin にホストの `openclaw` パッケージも再リンクするため、更新または npm 修復の後に、`openclaw/plugin-sdk/*` などのパッケージローカルなランタイムインポートが解決されます。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗用の非推奨の緊急回復互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この環境変数フォールバックは、移行のロールアウト中に緊急起動復旧を行う場合のみを対象としています。
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

`plugins marketplace entries` は、設定済みの OpenClaw マーケットプレイスフィードからエントリを一覧表示します。デフォルトではホストされたフィードを試行し、最新の承認済みスナップショットまたはバンドル済みデータにフォールバックします。特定の設定済みプロファイルを読み取るには `--feed-profile <name>` を、明示的なホスト済みフィード URL を読み取るには `--feed-url <url>` を、フィードを取得せずに最新の承認済みスナップショットを読み取るには `--offline` を使用します。

`plugins marketplace refresh` は、設定済みのホスト済みフィードスナップショットを更新し、OpenClaw がホスト済みデータ、ホスト済みスナップショット、またはバンドル済みフォールバックデータのどれを承認したかを報告します。新しいホスト済みペイロードが固定されたチェックサムと一致しない限りコマンドを失敗させる必要がある呼び出し元では、`--expected-sha256` を使用します。

マーケットプレイスの `list` は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略記法、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決済みソースラベルに加えて、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

マーケットプレイスの更新は、ホスト済み OpenClaw マーケットプレイスフィードを読み込み、検証済みレスポンスをローカルのホスト済みフィードスナップショットとして永続化します。オプションを指定しない場合、設定済みのデフォルトフィードプロファイルを使用します。特定の設定済みプロファイルを更新するには `--feed-profile <name>` を、明示的なホスト済みフィード URL を更新するには `--feed-url <url>` を、一致するペイロードチェックサム（`sha256:<hex>` または 64 文字の裸の 16 進ダイジェスト）を必須にするには `--expected-sha256 <sha256>` を、機械可読出力には `--json` を使用します。明示的なホスト済みフィード URL には、認証情報、クエリ文字列、フラグメントを含めてはなりません。固定されていない更新では、コマンドを失敗させずにホスト済みスナップショットまたはバンドル済みフォールバック結果を報告できます。固定された更新は、新しいホスト済みペイロードを承認しない限り失敗します。また、ホスト済み更新に成功しても、OpenClaw が検証済みスナップショットを永続化できない場合は失敗します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/clawhub)
