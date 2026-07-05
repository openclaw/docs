---
read_when:
    - Gatewayプラグインまたは互換バンドルをインストールまたは管理したい場合
    - シンプルなツール Plugin をスキャフォールドまたは検証したい
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-07-05T11:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a42d3fa6a60263f3fc2918cd34e6c1e3380b9ecae433a6ed340967c929de4c3c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin を管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例。
  </Card>
  <Card title="Plugin バンドル" href="/ja-JP/plugins/bundles">
    バンドル互換性モデル。
  </Card>
  <Card title="Plugin マニフェスト" href="/ja-JP/plugins/manifest">
    マニフェストフィールドと設定スキーマ。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security">
    Plugin インストールのセキュリティ強化。
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

インストール、検査、アンインストール、またはレジストリ更新が遅い場合の調査では、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの所要時間を
stderr に書き込み、JSON 出力は解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、`openclaw.json` は不変です。`install`、`update`、`uninstall`、`enable`、`disable` はすべて実行を拒否します。代わりに、このインストールの Nix ソース（nix-openclaw の場合は `programs.openclaw.config` または `instances.<name>.config`）を編集してから再ビルドします。エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を参照してください。
</Note>

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空の場合でも `configSchema`）を含む `openclaw.plugin.json` を同梱します。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
</Note>

## 作成者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` はデフォルトで最小構成の TypeScript ツール Plugin を作成します。最初の
引数は Plugin ID です。`--name` は表示名を設定します。OpenClaw は
デフォルトの出力ディレクトリとパッケージ名にこの ID を使用します。ツールスキャフォールドは
`defineToolPlugin` を使用し、ビルド後に `openclaw plugins build`/`validate` を呼び出す
`package.json` スクリプト `plugin:build` と
`plugin:validate` を生成します。

`plugins build` はビルド済みエントリをインポートし、その静的ツールメタデータを読み取り、
`openclaw.plugin.json` を書き込み、`package.json` の `openclaw.extensions` を整合させます。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、
現在のエントリエクスポートが引き続き一致していることを確認します。完全な作成ワークフローについては
[ツール Plugin](/ja-JP/plugins/tool-plugins)を参照してください。

スキャフォールドは TypeScript ソースを書き込みますが、ビルド済みの
`./dist/index.js` エントリからメタデータを生成するため、このワークフローは公開済み CLI でも機能します。
エントリがデフォルトのパッケージエントリでない場合は `--entry <path>` を使用します。
CI では、ファイルを書き換えずに生成済みメタデータが古い場合に失敗させるため、
`plugins build --check` を使用します。

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
`npm run validate` スクリプト、ClawHub パッケージメタデータ、
および GitHub OIDC 経由で将来の信頼済み公開を行うための手動実行 GitHub Actions ワークフローを備えた、
汎用 OpenAI 互換モデルプロバイダー Plugin を作成します。プロバイダースキャフォールドは Skills を生成せず、
`openclaw plugins build`/`validate` も使用しません。これらのコマンドは、
ツールスキャフォールドの生成済みメタデータパス用です。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメントルート、
認証情報テキスト、README の文面を実際のプロバイダー詳細に置き換えます。
初回の ClawHub 公開と信頼済みパブリッシャー設定には、生成された README を使用します。

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

メンテナーは、セットアップ時インストールのテストで、保護付き環境変数を使って自動 Plugin インストール元を上書きできます。
[Plugin インストールの上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
起動移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ただし、バンドル済みまたは公式 Plugin ID と一致する場合、OpenClaw は npm レジストリにアクセスせず、そのローカル/公式コピーを使用します。意図的に外部 npm パッケージを使用する場合は、代わりに `npm:<package>` を使用します。ClawHub には `clawhub:<package>` を使用します。Plugin のインストールはコードの実行と同様に扱い、固定バージョンを優先してください。
</Warning>

`plugins search` は、インストール可能な `code-plugin` および
`bundle-plugin` パッケージを ClawHub に問い合わせます（Skills ではありません。それらには `openclaw skills search` を使用します）。
デフォルトの `--limit` は 20 で、上限は 100 です。これはリモートカタログのみを読み取ります。
ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムのロードは行いません。
結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、
概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

<Note>
ClawHub は、ほとんどの Plugin にとって主要な配布および発見の場所です。npm は
サポートされるフォールバックおよび直接インストール経路として残ります。OpenClaw 所有の
`@openclaw/*` Plugin パッケージは、npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールでは `latest` を使用します。
ベータチャネルのインストールと更新では、利用可能な場合は npm の `beta` dist-tag を優先し、
なければ `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定インクルードと無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟オーバーライドを伴うインクルードは、フラット化せずに fail closed します。サポートされる形については[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常 fail closed し、先に `openclaw doctor --fix` を実行するよう案内します。Gateway の起動時およびホットリロード時には、無効な Plugin 設定は他の無効な設定と同様に fail closed します。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした Plugin 向けの、限定的なバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ ID を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードでは、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みの Plugin ID に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内し、現在のインストールを別のソースから本当に上書きしたい場合には `plugins install <package> --force` を案内します。`--force` は `--link` と併用できません。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用され、解決された正確な `<name>@<version>` を記録します。`git:` インストールではサポートされません（代わりに、例: `git:github.com/acme/plugin@v1.2.3` のように spec 内で ref を固定します）。また、`--marketplace` でもサポートされません（マーケットプレイスインストールでは、npm spec ではなくマーケットプレイスソースメタデータを永続化します）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨で、現在は no-op です。OpenClaw は Plugin インストールに対して、組み込みのインストール時危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、オペレーター所有の `security.installPolicy` サーフェスを使用します。Plugin の `before_install` フックは Plugin ランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub で公開した Plugin がレジストリスキャンによって非表示またはブロックされている場合は、[ClawHub 公開](/ja-JP/clawhub/publishing)の公開者向け手順を使用してください。`--dangerously-force-unsafe-install` は、ClawHub に Plugin の再スキャンを要求したり、ブロックされたリリースを公開状態にしたりしません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティ ClawHub インストールは、ダウンロード前に選択されたリリースの信頼記録を確認します。ClawHub がそのリリースのダウンロードを無効にしている場合、悪意のあるスキャン結果を報告している場合、またはリリースをブロックするモデレーション状態（隔離、取り消し）に置いている場合、OpenClaw はこのフラグに関係なく完全に拒否します。ブロックではないリスクのあるスキャン状態またはモデレーション状態については、OpenClaw が信頼の詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub の警告を確認し、対話プロンプトなしで続行すると判断した場合にのみ使用します。保留中または古い（まだクリーンでない）スキャン結果は警告しますが、承認は必要ありません。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼チェックを完全にバイパスします。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージインストールではなく、フィルター済みのフック可視性とフックごとの有効化には `openclaw hooks` を使用します。

    Npm 仕様は**レジストリのみ**です（パッケージ名に、任意で**正確なバージョン**または**dist-tag**を追加）。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係のインストールは、安全のため、シェルにグローバルな npm インストール設定がある場合でも、Plugin ごとに 1 つの管理された npm プロジェクト内で `--ignore-scripts` を付けて実行されます。管理対象の Plugin npm プロジェクトは OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホストのセキュリティ pin は hoist された Plugin 依存関係にも適用されます。

    npm 解決を明示するには `npm:<package>` を使用します。ベアパッケージ仕様も、公式 Plugin id に一致しない限り、ローンチ切り替え中は npm から直接インストールされます。

    バンドル済み Plugin に一致する素の `@openclaw/*` 仕様は、npm フォールバックの前にイメージ所有のバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は、管理対象の npm override を作成する代わりに、現在の OpenClaw ビルドに含まれるバンドル済み Discord Plugin を使用します。外部 npm パッケージを強制するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    ベア仕様と `@latest` は stable トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは stable とみなされます。npm がいずれかの形式を prerelease に解決した場合、OpenClaw は停止し、prerelease タグ（`@beta`/`@rc`）または正確な prerelease バージョン（`@1.2.3-beta.4`）で明示的に opt in するよう求めます。

    正確なバージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決済みパッケージメタデータを確認します。最新の stable パッケージがより新しい OpenClaw Plugin API または最小ホストバージョンを要求する場合、OpenClaw は古い stable バージョンを調べ、代わりに互換性のある最新リリースをインストールします。正確なバージョンと明示的な dist-tag は厳密なままです。互換性のない選択は失敗し、OpenClaw をアップグレードするか互換性のあるバージョンを選ぶよう求めます。

    ベアインストール仕様が公式 Plugin id（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的な scoped 仕様（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式: `git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` clone URL。インストール前に branch、tag、commit を check out するには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリへ clone し、指定された ref がある場合は check out してから通常の Plugin ディレクトリインストーラーを使用するため、manifest 検証、operator install policy、package-manager install 作業、install records は npm インストールと同じように動作します。記録された git インストールには source URL/ref と解決済み commit が含まれるため、`openclaw plugins update` は後で source を再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して gateway methods や CLI commands などの runtime registrations を確認します。Plugin が `api.registerCli` で CLI root を登録している場合は、その command を OpenClaw root CLI から直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブは、展開された Plugin root に有効な `openclaw.plugin.json` を含んでいる必要があります。`package.json` だけを含むアーカイブは、OpenClaw が install records を書き込む前に拒否されます。

    ファイルが npm-pack tarball で、registry インストールと同じ Plugin ごとの管理対象 npm プロジェクトパスを使用したい場合は、`npm-pack:<path.tgz>` を使用します。これには、`package-lock.json` 検証、hoist された依存関係のスキャン、npm install records が含まれます。通常のアーカイブパスは、Plugin extensions root の下に local archives として引き続きインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールは明示的な `clawhub:<package>` locator を使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ベア npm-safe Plugin 仕様は、公式 Plugin id に一致しない限り、ローンチ切り替え中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、公開されている Plugin API / 最小 gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack artifact を公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub digest header と artifact digest を検証してから、通常のアーカイブパス経由でインストールします。ClawPack metadata のない古い ClawHub バージョンは、引き続き legacy package archive verification path 経由でインストールされます。記録されたインストールは、後の更新のために ClawHub source metadata、artifact kind、npm integrity、npm shasum、tarball name、ClawPack digest facts を保持します。
バージョン指定なしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるよう、バージョン指定なしの記録済み仕様を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグ selector は、その selector に pinned されたままです。

### Marketplace 省略記法

Claude の local registry cache `~/.claude/plugins/known_marketplaces.json` に marketplace 名が存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace source を明示的に渡すには `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` の Claude known-marketplace 名
    - local marketplace root または `marketplace.json` path
    - `owner/repo` のような GitHub repo shorthand
    - `https://github.com/owner/repo` のような GitHub repo URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub または git から読み込まれる remote marketplaces では、Plugin entries は clone された marketplace repo の内部に留まる必要があります。OpenClaw はその repo からの相対 path sources を受け入れ、remote manifests からの HTTP(S)、absolute-path、git、GitHub、およびその他の non-path Plugin sources を拒否します。
  </Tab>
</Tabs>

local paths と archives について、OpenClaw は自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換 bundles（`.codex-plugin/plugin.json`）
- Claude 互換 bundles（`.claude-plugin/plugin.json`、またはその manifest file が存在しない場合のデフォルト Claude component layout）
- Cursor 互換 bundles（`.cursor-plugin/plugin.json`）

管理対象 local installs は Plugin ディレクトリまたはアーカイブである必要があります。スタンドアロンの `.js`、`.mjs`、`.cjs`、`.ts` Plugin ファイルは、`plugins install` によって管理対象 Plugin root にコピーされず、`~/.openclaw/extensions` または `<workspace>/.openclaw/extensions` に直接配置しても読み込まれません。これらの自動検出 root は Plugin package または bundle ディレクトリを読み込み、top-level script files は local helpers としてスキップします。代わりに、スタンドアロンファイルは `plugins.load.paths` に明示的に列挙してください。

<Note>
互換 bundle は通常の Plugin root にインストールされ、同じ list/info/enable/disable フローに参加します。現在は、bundle skills、Claude command-skills、Claude `settings.json` defaults、Claude `.lsp.json` / manifest-declared `lspServers` defaults、Cursor command-skills、および互換 Codex hook directories がサポートされています。他の検出済み bundle capabilities は diagnostics/info に表示されますが、runtime execution にはまだ接続されていません。
</Note>

local Plugin ディレクトリをコピーせずに参照するには、`-l`/`--link` を使用します（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

`--link` は `--force`（linked plugins は source path を直接指すため、その場で上書きするものがありません）、`--marketplace`、または `git:` インストールではサポートされず、すでに存在する local path が必要です。

<Note>
workspace extensions root から検出された workspace-origin plugins は、明示的に有効化されるまで import も実行もされません。local development では、`openclaw plugins enable <plugin-id>` を実行するか、`plugins.entries.<plugin-id>.enabled: true` を設定します。config が `plugins.allow` を使用している場合は、同じ Plugin id もそこに含めてください。この fail-closed ルールは、channel setup が setup-only loading のために workspace-origin Plugin を明示的に対象にする場合にも適用されるため、その workspace Plugin が disabled のまま、または allowlist から除外されている間は、local channel Plugin setup code は実行されません。Linked installs と明示的な `plugins.load.paths` entries は、解決済み Plugin origin に対する通常の policy に従います。[Configure plugin policy](/ja-JP/tools/plugin#configure-plugin-policy) と [Configuration reference](/ja-JP/gateway/configuration-reference#plugins) を参照してください。

npm インストールで `--pin` を使用すると、デフォルトの unpinned 動作を維持しつつ、解決済みの正確な仕様（`name@version`）を管理対象 Plugin index に保存できます。
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
  table view から、format/source/origin/version/activation metadata を含む Plugin ごとの detail lines に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な inventory に加えて、registry diagnostics と package dependency install state を表示します。
</ParamField>

<Note>
`plugins list` は最初に永続化された local Plugin registry を読み込み、registry が存在しないか無効な場合は manifest-only derived fallback を使用します。Plugin がインストール済み、有効、cold startup planning から見える状態かどうかを確認するのに便利ですが、すでに実行中の Gateway process に対する live runtime probe ではありません。Plugin code、enablement、hook policy、または `plugins.load.paths` を変更した後は、新しい `register(api)` code や hooks の実行を期待する前に、channel を提供する Gateway を再起動してください。remote/container deployments では、wrapper process だけでなく、実際の `openclaw gateway run` child を再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から各 Plugin の `dependencyStatus` が含まれます。OpenClaw はそれらの package names が Plugin の通常の Node `node_modules` lookup path 上に存在するかどうかを確認します。Plugin runtime code を import したり、package manager を実行したり、missing dependencies を修復したりはしません。
</Note>

startup が `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` を log した場合は、`openclaw plugins list --enabled --verbose` または列挙された Plugin id を指定した `openclaw plugins inspect <id>` を実行して Plugin ids を確認し、信頼できる ids を `openclaw.json` の `plugins.allow` にコピーします。警告が検出されたすべての Plugin を列挙できる場合、それらの ids をすでに含んだ、そのまま貼り付けられる `plugins.allow` snippet を出力します。Plugin が install/load-path provenance なしで読み込まれる場合は、その Plugin id を inspect してから、信頼できる id を `plugins.allow` に pin するか、信頼できる source から Plugin を再インストールして OpenClaw が install provenance を記録できるようにしてください。

packaged Docker image 内で bundled Plugin 作業を行う場合は、`/app/extensions/synology-chat` など、一致する packaged source path の上に Plugin source directory を bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、その mounted source overlay を検出します。単にコピーされた source directory は inert のままなので、通常の packaged installs は引き続き compiled dist を使用します。

runtime hook debugging について:

- `openclaw plugins inspect <id> --runtime --json` は、モジュールをロードした検査パスから登録済みフックと診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係の状態をクリーンアップする、または設定から参照されている欠落したダウンロード可能 Plugin を復旧するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway URL/プロファイル、サービス/プロセスのヒント、設定パス、RPC ヘルスを確認します。
- バンドル外の会話フック（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなく、マシン管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の共有 SQLite 状態データベースにそれを書き込みます。`installed_plugin_index` 行は、壊れた、または欠落した Plugin マニフェストのレコードを含む永続的な `installRecords` メタデータに加え、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使われる、マニフェスト由来のコールドレジストリキャッシュを保存します。

OpenClaw が設定内に出荷済みレガシー `plugins.installs` レコードを見つけた場合、ランタイム読み取りは `openclaw.json` を書き換えずに、それらを互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、設定書き込みが許可されている場合、それらのレコードを Plugin インデックスへ移動し、設定キーを削除します。どちらかの書き込みが失敗した場合、インストールメタデータが失われないように設定レコードは保持されます。

## アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` は、該当する場合、`plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは追跡対象の管理インストールディレクトリも削除しますが、それは OpenClaw の Plugin 拡張ルート内に解決される場合に限られます。Plugin が現在 `memory` または `contextEngine` スロットを所有している場合、そのスロットはデフォルト（memory は `memory-core`、context engine は `legacy`）にリセットされます。

`uninstall` は削除対象のプレビューを表示し、変更を行う前に `Uninstall plugin "<id>"?` と確認します。確認プロンプトをスキップするには `--force` を渡してください（スクリプトや非対話実行に便利です）。指定しない場合、アンインストールには対話型 TTY が必要です。`--dry-run` は同じプレビューを表示し、プロンプトや変更を行わずに終了します。

<Note>
`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。
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

更新は、管理 Plugin インデックスで追跡されている Plugin インストールと、`hooks.internal.installs` で追跡されているフックパックインストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されているインストール spec を再利用します。つまり、以前に保存された `@beta` などの dist-tag や正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    `update <id> --dry-run` 中は、正確に固定された npm インストールは固定されたままです。OpenClaw がそのパッケージのレジストリデフォルトラインも解決でき、そのデフォルトラインがインストール済みの固定バージョンより新しい場合、ドライランは固定を報告し、レジストリデフォルトラインへ追従するための明示的な `@latest` パッケージ更新コマンドを表示します。

    この対象指定更新ルールは、一括 `openclaw plugins update --all` メンテナンスパスとは異なります。一括更新は通常の追跡済みインストール spec を引き続き尊重しますが、信頼済みの公式 OpenClaw Plugin レコードは、古い正確な公式パッケージに留まる代わりに、現在の公式カタログターゲットへ同期できます。正確な、またはタグ付きの公式 spec を意図的にそのままにしたい場合は、対象指定の `update <id>` を使用してください。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec も渡せます。OpenClaw はそのパッケージ名を追跡済み Plugin レコードへ解決し、そのインストール済み Plugin を更新し、将来の id ベース更新のために新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡す場合も、追跡済み Plugin レコードへ解決されます。Plugin が正確なバージョンに固定されていて、レジストリのデフォルトリリースラインへ戻したい場合に使用してください。

  </Accordion>
  <Accordion title="ベータチャンネル更新">
    対象指定の `openclaw plugins update <id-or-npm-spec>` は、新しい spec を渡さない限り、追跡済み Plugin spec を再利用します。一括 `openclaw plugins update --all` は、信頼済みの公式 Plugin レコードを公式カタログターゲットへ同期する際に設定済みの `update.channel` を使用するため、ベータチャンネルのインストールは stable/latest へ暗黙に正規化される代わりに、ベータリリースラインに留まれます。

    `openclaw update` もアクティブな OpenClaw 更新チャンネルを認識します。ベータチャンネルでは、デフォルトラインの npm と ClawHub Plugin レコードはまず `@beta` を試します。Plugin のベータリリースが存在しない場合は、記録済みの default/latest spec にフォールバックします。npm Plugin は、ベータパッケージが存在してもインストール検証に失敗した場合にもフォールバックします。そのフォールバックは警告として報告され、コア更新を失敗させません。正確なバージョンと明示的なタグは、対象指定更新ではそのセレクタに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID がすでに解決済みターゲットと一致する場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えを行わずにスキップされます。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトハッシュが変化した場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、フェイルクローズします。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は互換性のために `plugins update` でも受け付けられますが、非推奨であり、Plugin 更新の動作を変更しなくなりました。オペレーターの `security.installPolicy` は引き続き更新をブロックできます。Plugin の `before_install` フックは、Plugin フックがロードされているプロセスでのみ適用されます。
  </Accordion>
  <Accordion title="更新時の --acknowledge-clawhub-risk">
    コミュニティの ClawHub バック Plugin 更新は、置き換えパッケージをダウンロードする前に、インストールと同じ正確なリリース信頼チェックを実行します。選択した ClawHub リリースにリスクのある信頼警告があっても続行すべきレビュー済み自動化には、`--acknowledge-clawhub-risk` を使用してください。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。
  </Accordion>
</AccordionGroup>

## 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspect は、デフォルトでは Plugin ランタイムをインポートせずに、ID、ロード状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバーサポートを表示します。JSON 出力には `contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin マニフェスト契約が含まれるため、オペレーターは Plugin を有効化または再起動する前に、信頼済みサーフェスの宣言を監査できます。Plugin モジュールをロードし、登録済みフック、ツール、コマンド、サービス、Gateway メソッド、HTTP ルートを含めるには `--runtime` を追加します。ランタイム検査は、欠落した Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは通常、ルートの `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` などのコア親の下にネストされたコマンドを登録することもできます。`inspect --runtime` が `cliCommands` 配下にコマンドを表示した後、一覧のパスで実行してください。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

| 形状                | 意味                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | ちょうど 1 つの機能タイプ（例: provider-only Plugin）             |
| `hybrid-capability` | 複数の機能タイプ（例: text + speech + images）                    |
| `hook-only`         | フックのみで、機能、ツール、コマンド、サービス、ルートなし        |
| `non-capability`    | ツール/コマンド/サービスはあるが機能なし                         |

機能モデルの詳細は [Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化と監査に適した機械可読レポートを出力します。`inspect --all` は、形状、機能種別、互換性通知、バンドル機能、フック概要の列を含む全体テーブルを表示します。`info` は `inspect` のエイリアスです。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin ロードエラー、マニフェスト/検出診断、互換性通知、欠落した Plugin スロットなどの古い Plugin 設定参照を報告します。インストールツリーと Plugin 設定がクリーンな場合、`No plugin issues detected.` と表示します。古い設定が残っているもののインストールツリーがそれ以外では正常な場合、概要は完全な Plugin ヘルスを示唆するのではなく、その旨を表示します。

設定済み Plugin がディスク上に存在するものの、ローダーのパス安全性チェックによってブロックされている場合、設定検証は Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、先行するブロック済み Plugin 診断を修正してください。

`register`/`activate` エクスポートの欠落などのモジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力にコンパクトなエクスポート形状の概要が含まれます。

## レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化状態、ソースメタデータ、コントリビューション所有権に関する、OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者検索、チャンネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

永続化されたレジストリが存在するか、最新か、古いかを調べるには `plugins registry` を使用します。永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築するには `--refresh` を使用します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ周辺の管理 npm ドリフトも修復します。管理 Plugin npm プロジェクト配下、またはレガシーのフラットな管理 npm ルート配下にある孤立または復旧された `@openclaw/*` パッケージがバンドル済み Plugin を隠している場合、doctor はその古いパッケージを削除し、レジストリを再構築して、起動がバンドル済みマニフェストに対して検証されるようにします。Doctor は、`peerDependencies.openclaw` を宣言する管理 npm Plugin にホストの `openclaw` パッケージも再リンクするため、更新や npm 修復後に `openclaw/plugin-sdk/*` などのパッケージローカルなランタイムインポートが解決されます。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗に対する非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行が展開される間の緊急起動復旧専用です。
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

`plugins marketplace entries` は、設定済みの OpenClaw marketplace フィードからエントリを一覧表示します。デフォルトではホストされたフィードを試行し、最新の受理済みスナップショットまたはバンドルデータにフォールバックします。特定の設定済みプロファイルを読み取るには `--feed-profile <name>` を、明示的なホスト済みフィード URL を読み取るには `--feed-url <url>` を、フィードを取得せずに最新の受理済みスナップショットを読み取るには `--offline` を使用します。

`plugins marketplace refresh` は、設定済みのホスト済みフィードスナップショットを更新し、OpenClaw がホスト済みデータ、ホスト済みスナップショット、またはバンドルされたフォールバックデータのどれを受理したかを報告します。呼び出し元が、固定されたチェックサムと新しいホスト済みペイロードが一致しない限りコマンドを失敗させる必要がある場合は、`--expected-sha256` を使用します。

マーケットプレイスの `list` は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイスマニフェストとプラグインエントリを出力します。

マーケットプレイスの更新は、ホストされた OpenClaw マーケットプレイスフィードを読み込み、検証済みレスポンスをローカルのホストフィードスナップショットとして永続化します。オプションなしの場合、設定済みのデフォルトフィードプロファイルを使用します。特定の設定済みプロファイルを更新するには `--feed-profile <name>`、明示的なホストフィード URL を更新するには `--feed-url <url>`、一致するペイロードチェックサム（`sha256:<hex>` または 64 文字の裸の 16 進ダイジェスト）を必須にするには `--expected-sha256 <sha256>`、機械可読出力には `--json` を使用します。明示的なホストフィード URL には、認証情報、クエリ文字列、またはフラグメントを含めてはなりません。ピン留めされていない更新では、コマンドを失敗させずに、ホストされたスナップショットまたはバンドルされたフォールバック結果を報告できます。ピン留めされた更新は、新しいホストペイロードを受け入れない限り失敗し、ホストされた更新が成功しても、OpenClaw が検証済みスナップショットを永続化できない場合は失敗します。

## 関連

- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/clawhub)
