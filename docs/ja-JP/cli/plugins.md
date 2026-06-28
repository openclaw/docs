---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい
    - シンプルなツールPluginをスキャフォールドまたは検証したい
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: 'CLI リファレンス: `openclaw plugins`（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-06-28T20:43:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin を管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開のクイック例。
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
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの所要時間を
stderr に書き出し、JSON 出力を解析可能な状態に保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin ライフサイクルの変更操作は無効化されます。このインストールには、`plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、または `plugins disable` ではなく Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえばバンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）に加えて、検出されたバンドル機能も表示されます。
</Note>

### 作成者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` は、デフォルトで最小構成の TypeScript ツール Plugin を作成します。最初の引数は Plugin id です。表示名には `--name` を渡します。OpenClaw は
id をデフォルトの出力ディレクトリとパッケージ命名に使用します。ツールのスキャフォールドは
`defineToolPlugin` を使用します。
`plugins build` はビルド済みエントリをインポートし、その静的ツールメタデータを読み取り、
`openclaw.plugin.json` を書き出し、`package.json` の `openclaw.extensions` を同期状態に保ちます。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、現在のエントリエクスポートが引き続き一致していることを確認します。ツール作成ワークフロー全体については
[ツール Plugin](/ja-JP/plugins/tool-plugins) を参照してください。

スキャフォールドは TypeScript ソースを書き出しますが、ビルド済みの
`./dist/index.js` エントリからメタデータを生成するため、このワークフローは公開済み CLI でも機能します。
エントリがデフォルトのパッケージエントリでない場合は `--entry <path>` を使用してください。CI では
`plugins build --check` を使用して、生成済みメタデータが古い場合にファイルを書き換えず失敗させます。

### プロバイダースキャフォールド

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

プロバイダースキャフォールドは、OpenAI 互換の
API キー配管、`clawhub package validate` 用の組み込み `npm run validate` スクリプト、ClawHub パッケージメタデータ、将来 GitHub Actions OIDC 経由で信頼済み公開を行うための手動起動 GitHub ワークフローを備えた、汎用テキスト/モデルプロバイダー Plugin を作成します。プロバイダースキャフォールドは
Skills を生成せず、`openclaw plugins build` や
`openclaw plugins validate` も使用しません。これらのコマンドは、ツールスキャフォールドの
生成メタデータパス用です。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメント
ルート、認証情報テキスト、README 文面を実際のプロバイダー詳細に置き換えてください。初回の ClawHub 公開と信頼済みパブリッシャー設定には、生成された README を使用してください。

### インストール

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

メンテナーがセットアップ時インストールをテストする場合、保護付き環境変数で自動 Plugin インストール
ソースを上書きできます。
[Plugin インストール上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
ローンチ移行期間中、公式 Plugin id と一致しない限り、裸のパッケージ名はデフォルトで npm からインストールされます。バンドル済み Plugin と一致する生の `@openclaw/*` パッケージ指定は、現在の OpenClaw ビルドに同梱されたコピーを使用します。外部 npm パッケージを意図的に使用したい場合は `npm:<package>` を使用してください。ClawHub には `clawhub:<package>` を使用してください。Plugin のインストールはコードを実行する行為として扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、
インストール可能なパッケージ名を出力します。検索対象は code-plugin と bundle-plugin パッケージであり、
Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの Plugin にとって主要な配布および発見面です。Npm は
引き続きサポートされるフォールバックおよび直接インストールパスです。OpenClaw 所有の
`@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールは `latest` を使用します。
ベータチャネルのインストールと更新は、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、
その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定 include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` に裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟上書きを含む include は、フラット化する代わりに fail closed します。サポートされる形については[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常 fail closed し、先に `openclaw doctor --fix` を実行するよう通知します。Gateway 起動中およびホットリロード中は、無効な Plugin 設定は他の無効な設定と同様に fail closed します。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的に opt in する Plugin 向けの狭いバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内し、別のソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされていません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされていません。marketplace インストールは npm spec ではなく marketplace ソースメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨で、現在は no-op です。OpenClaw は Plugin インストールに対して、組み込みのインストール時危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、共有のオペレーター所有 `security.installPolicy` 面を使用してください。Plugin `before_install` フックは Plugin ランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub で公開した Plugin がレジストリスキャンによって非表示またはブロックされている場合は、[ClawHub 公開](/ja-JP/clawhub/publishing)のパブリッシャー手順を使用してください。`--dangerously-force-unsafe-install` は ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開状態にしたりしません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティ ClawHub インストールは、パッケージをダウンロードする前に選択されたリリースの信頼記録を確認します。ClawHub がそのリリースのダウンロードを無効化している場合、悪意のあるスキャン結果を報告している場合、または隔離などのブロック型モデレーション状態に置いている場合、OpenClaw はそのリリースを拒否します。ブロックしない危険なスキャン状態、危険なモデレーション状態、またはレジストリ理由については、OpenClaw が信頼詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub の警告を確認し、対話プロンプトなしで続行すると決めた場合にのみ使用してください。保留中または古いクリーンな信頼記録は警告しますが、acknowledgement は不要です。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼プロンプトを迂回します。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。パッケージインストールではなく、フィルター済みのフック可視性とフックごとの有効化には `openclaw hooks` を使用してください。

    npm 仕様は **registry-only**（パッケージ名 + 任意の **exact version** または **dist-tag**）です。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係のインストールは、シェルにグローバルな npm install 設定がある場合でも、安全のため `--ignore-scripts` を付けて、Plugin ごとに 1 つの管理対象 npm プロジェクト内で実行されます。管理対象 Plugin の npm プロジェクトは OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホスト側のセキュリティ pin は hoist された Plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ベアパッケージ仕様も、公式 Plugin ID と一致しない限り、ローンチ切り替え中は npm から直接インストールされます。

    バンドル済み Plugin と一致する生の `@openclaw/*` パッケージ仕様は、npm フォールバックの前にイメージ所有のバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は、管理対象 npm override を作成する代わりに、現在の OpenClaw ビルドに含まれるバンドル済み Discord Plugin を使用します。外部 npm パッケージを強制するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    ベア仕様と `@latest` は stable トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは stable リリースです。npm がそれらのいずれかを prerelease に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease タグ、または `@1.2.3-beta.4` のような正確な prerelease バージョンで明示的に opt in するよう求めます。

    正確なバージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決済みパッケージメタデータを確認します。最新の stable パッケージが、より新しい OpenClaw Plugin API または最小ホストバージョンを必要とする場合、OpenClaw は古い stable バージョンを調べ、互換性のある最新リリースを代わりにインストールします。正確なバージョンと `@beta` のような明示的な dist-tag は厳密なままです。選択されたパッケージに互換性がない場合、コマンドは失敗し、OpenClaw をアップグレードするか互換性のあるバージョンを選ぶよう求めます。

    ベアインストール仕様が公式 Plugin ID（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き仕様（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git リポジトリ">
    Git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` の clone URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールでは、一時ディレクトリに clone し、要求された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、manifest 検証、operator install policy、package-manager install 作業、install record は npm インストールと同じように動作します。記録される Git インストールには、source URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後で source を再解決できます。

    Git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、Gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` で CLI ルートを登録した場合は、そのコマンドを OpenClaw ルート CLI から直接実行します。たとえば `openclaw demo-plugin ping` です。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw が install record を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、registry
    インストールで使用されるものと同じ Plugin ごとの管理対象 npm プロジェクトパスを
    テストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` 検証、hoist された依存関係の
    スキャン、npm install record が含まれます。通常のアーカイブパスは引き続き、Plugin extensions ルートの下にローカル
    アーカイブとしてインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` locator を使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ベア npm-safe Plugin 仕様は、公式 Plugin ID と一致しない限り、ローンチ切り替え中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみによる解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、公開されている Plugin API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack artifact を公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub digest header と artifact digest を検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータのない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証パスを通じてインストールされます。記録されるインストールは、後の更新のために、ClawHub source metadata、artifact kind、npm integrity、npm shasum、tarball name、ClawPack digest facts を保持します。
バージョンなしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるように、バージョンなしの記録済み仕様を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグ selector は、その selector に pin されたままです。

#### Marketplace 省略記法

marketplace 名が Claude のローカル registry cache `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace source を明示的に渡したい場合は `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace source">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude known-marketplace 名
    - ローカル marketplace ルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub repo 省略記法
    - `https://github.com/owner/repo` のような GitHub repo URL
    - git URL

  </Tab>
  <Tab title="リモート marketplace ルール">
    GitHub または git から読み込まれたリモート marketplace では、Plugin エントリは clone された marketplace repo の内側に留まる必要があります。OpenClaw はその repo からの相対パス source を受け入れ、リモート manifest からの HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin source を拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについては、OpenClaw が自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換 bundle（`.codex-plugin/plugin.json`）
- Claude 互換 bundle（`.claude-plugin/plugin.json` またはデフォルトの Claude component layout）
- Cursor 互換 bundle（`.cursor-plugin/plugin.json`）

管理対象ローカルインストールは、Plugin ディレクトリまたはアーカイブである必要があります。単独の `.js`、
`.mjs`、`.cjs`、`.ts` Plugin ファイルは、`plugins install` によって管理対象 Plugin
ルートへコピーされません。代わりに `plugins.load.paths` に明示的に列挙してください。

<Note>
互換 bundle は通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現時点では、bundle skills、Claude command-skills、Claude `settings.json` defaults、Claude `.lsp.json` / manifest-declared `lspServers` defaults、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。その他の検出された bundle capabilities は diagnostics/info に表示されますが、まだ runtime execution には接続されていません。
</Note>

### 一覧

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  有効な Plugin のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブルビューから、source/origin/version/activation metadata を含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な inventory に加え、registry diagnostics と package dependency install state を表示します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル Plugin registry を読み取り、registry がないか無効な場合は manifest のみから派生した fallback を使用します。これは Plugin がインストール済みか、有効か、cold startup planning から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対する live runtime probe ではありません。Plugin コード、enablement、hook policy、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hooks が実行されることを期待する前に、その channel を提供している Gateway を再起動してください。リモート/container deployment では、wrapper process だけでなく、実際の `openclaw gateway run` child を再起動していることを確認してください。

`plugins list --json` には、各 Plugin の `package.json`
`dependencies` と `optionalDependencies` からの `dependencyStatus` が含まれます。OpenClaw は、それらの package
名が Plugin の通常の Node `node_modules` lookup path 上に存在するかどうかを確認します。Plugin runtime code の import、package manager の実行、または不足している
dependencies の修復は行いません。
</Note>

起動ログに `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` と出た場合は、
`openclaw plugins list --enabled --verbose` または
`openclaw plugins inspect <id>` を listed plugin id とともに実行して Plugin
ID を確認し、信頼できる ID を `openclaw.json` の `plugins.allow` にコピーします。
warning が検出されたすべての Plugin を列挙できる場合は、それらの ID をすでに含む、貼り付け可能な
`plugins.allow` snippet を出力します。Plugin が
install/load-path provenance なしで読み込まれる場合は、その Plugin ID を inspect してから、信頼できる ID を
`plugins.allow` に pin するか、信頼できる source から Plugin を再インストールして、
OpenClaw が install provenance を記録できるようにします。

`plugins search` はリモート ClawHub catalog lookup です。ローカル
state の inspect、config の変更、package のインストール、Plugin runtime code の load は行いません。検索
結果には、ClawHub package name、family、channel、version、summary、および
`openclaw plugins install clawhub:<package>` のような install hint が含まれます。

パッケージ化された Docker image 内でバンドル済み Plugin を扱う場合は、
Plugin source directory を、対応する packaged source path（たとえば
`/app/extensions/synology-chat`）に bind-mount します。OpenClaw は、その mounted source
overlay を `/app/dist/extensions/synology-chat` より先に検出します。通常のコピーされた source
directory は inert のままなので、通常の packaged installs は引き続き compiled dist を使用します。

runtime hook debugging には次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、module-loaded inspection pass から登録済み hooks と diagnostics を表示します。Runtime inspection は dependencies をインストールしません。legacy dependency state をクリーンアップするか、config から参照されているダウンロード可能 Plugin の欠落を復旧するには、`openclaw doctor --fix` を使用します。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway URL/profile、service/process hints、config path、RPC health を確認します。
- 非バンドル conversation hooks（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカル Plugin ディレクトリをコピーしないようにするには `--link` を使用します（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

単独の Plugin ファイルは、`plugins install` でインストールしたり、
`~/.openclaw/extensions` または `<workspace>/.openclaw/extensions` に直接配置したりするのではなく、
`plugins.load.paths` に列挙する必要があります。これらの auto-discovered roots は Plugin
package または bundle directory を読み込みますが、top-level script files は local
helpers として扱われ、skip されます。

<Note>
ワークスペースの extensions ルートから検出されたワークスペース由来の plugins は、
明示的に有効化されるまでインポートも実行もされません。ローカル開発では、
`openclaw plugins enable <plugin-id>` を実行するか、
`plugins.entries.<plugin-id>.enabled: true` を設定します。設定で
`plugins.allow` を使っている場合は、同じ plugin id もそこに含めてください。このフェイルクローズのルールは、
チャネル設定がセットアップ専用ロードのためにワークスペース由来の Plugin を明示的に対象にする場合にも適用されるため、
そのワークスペース Plugin が無効のまま、または許可リストから除外されたままの場合、ローカルのチャネル Plugin セットアップコードは実行されません。リンク済みインストール
および明示的な `plugins.load.paths` エントリは、解決された Plugin 由来に対する通常のポリシーに従います。詳しくは
[Plugin ポリシーを設定する](/ja-JP/tools/plugin#configure-plugin-policy)
および [設定リファレンス](/ja-JP/gateway/configuration-reference#plugins) を参照してください。

`--force` は `--link` と併用できません。リンク済みインストールは、管理対象のインストール先にコピーするのではなくソースパスを再利用するためです。

npm インストールでは `--pin` を使うと、デフォルトの非固定動作を維持しつつ、解決済みの正確な spec (`name@version`) を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータはユーザー設定ではなく、マシン管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の共有 SQLite 状態データベースにそれを書き込みます。`installed_plugin_index` 行には、破損または欠落した Plugin マニフェストのレコードを含む永続的な `installRecords` メタデータに加えて、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使用されるマニフェスト由来のコールドレジストリキャッシュが保存されます。

OpenClaw が設定内に出荷済みのレガシー `plugins.installs` レコードを見つけた場合、ランタイムの読み取りでは `openclaw.json` を書き換えずに互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、それらのレコードを Plugin インデックスへ移動し、設定の書き込みが許可されている場合は設定キーを削除します。いずれかの書き込みに失敗した場合、インストールメタデータが失われないように設定レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された Plugin インデックス、Plugin の許可/拒否リストエントリ、リンク済みの `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、OpenClaw の Plugin extensions ルート内にある追跡対象の管理対象インストールディレクトリも削除します。Active Memory plugins では、メモリスロットは `memory-core` にリセットされます。

<Note>
`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理対象 Plugin インデックス内の追跡対象 Plugin インストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前保存された `@beta` などの dist-tag や正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    `update <id> --dry-run` の間、正確に固定された npm インストールは固定されたままです。OpenClaw がパッケージのレジストリ既定ラインも解決でき、その既定ラインがインストール済みの固定バージョンより新しい場合、ドライランは固定を報告し、レジストリ既定ラインに従うための明示的な `@latest` パッケージ更新コマンドを出力します。

    その対象指定更新ルールは、一括の `openclaw plugins update --all` メンテナンスパスとは異なります。一括更新は通常の追跡対象インストール spec を引き続き尊重しますが、信頼済みの公式 OpenClaw Plugin レコードは、古い正確な公式パッケージに留まる代わりに、現在の公式カタログターゲットへ同期できます。正確な、またはタグ付きの公式 spec を意図的にそのまま維持したい場合は、対象指定の `update <id>` を使ってください。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象 Plugin レコードへ解決し直し、そのインストール済み Plugin を更新して、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンまたはタグなしで npm パッケージ名を渡した場合も、追跡対象 Plugin レコードへ解決し直されます。Plugin が正確なバージョンに固定されていて、レジストリの既定リリースラインへ戻したい場合に使ってください。

  </Accordion>
  <Accordion title="ベータチャネル更新">
    対象指定の `openclaw plugins update <id-or-npm-spec>` は、新しい spec を渡さない限り、追跡対象 Plugin spec を再利用します。一括の `openclaw plugins update --all` は、信頼済み公式 Plugin レコードを公式カタログターゲットへ同期するときに設定済みの `update.channel` を使うため、ベータチャネルのインストールは、安定版/latest に暗黙的に正規化されるのではなく、ベータリリースラインに留まることができます。

    `openclaw update` もアクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、既定ラインの npm および ClawHub Plugin レコードはまず `@beta` を試します。Plugin のベータリリースが存在しない場合は、記録済みの既定/latest spec にフォールバックします。npm plugins では、ベータパッケージが存在してもインストール検証に失敗した場合にもフォールバックします。そのフォールバックは警告として報告され、コア更新は失敗しません。正確なバージョンと明示的なタグは、対象指定更新ではそのセレクタに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト識別子が解決済みターゲットとすでに一致している場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えなしでスキップされます。

    保存済みの整合性ハッシュが存在し、取得されたアーティファクトハッシュが変化した場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待値と実際のハッシュを出力し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限りフェイルクローズします。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は互換性のため `plugins update` でも受け付けられますが、非推奨であり、Plugin 更新動作はもう変更しません。オペレーターの `security.installPolicy` は引き続き更新をブロックできます。Plugin の `before_install` hooks は、Plugin hooks がロードされるプロセスでのみ適用されます。
  </Accordion>
  <Accordion title="更新時の --acknowledge-clawhub-risk">
    コミュニティの ClawHub バック Plugin 更新は、置換パッケージをダウンロードする前に、インストールと同じ正確なリリース信頼チェックを実行します。選択された ClawHub リリースにリスクのある信頼警告がある場合でも続行すべきレビュー済み自動化には、`--acknowledge-clawhub-risk` を使ってください。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、既定では Plugin ランタイムをインポートせずに、識別情報、ロード状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバーサポートを表示します。JSON 出力には、`contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin マニフェスト契約が含まれるため、オペレーターは Plugin を有効化または再起動する前に、信頼済みサーフェス宣言を監査できます。Plugin モジュールをロードし、登録済み hooks、tools、commands、services、gateway methods、HTTP routes を含めるには、`--runtime` を追加します。ランタイム検査は、欠落している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI commands は通常、ルートの `openclaw` コマンドグループとしてインストールされますが、plugins は `openclaw nodes` などのコア親配下にネストした commands を登録することもできます。`inspect --runtime` が `cliCommands` 配下に command を表示したら、表示されたパスで実行します。たとえば `demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 種類の capability type（例: プロバイダー専用 Plugin）
- **hybrid-capability** — 複数の capability types（例: テキスト + 音声 + 画像）
- **hook-only** — hooks のみ、capabilities または surfaces なし
- **non-capability** — tools/commands/services はあるが capabilities なし

機能モデルの詳細は [Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化と監査に適した機械可読レポートを出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、hook summary の列を含むフリート全体の表をレンダリングします。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin ロードエラー、マニフェスト/検出診断、互換性通知、欠落した Plugin スロットなどの古い Plugin 設定参照を報告します。インストールツリーと Plugin 設定がクリーンな場合は、`No plugin issues detected.` を出力します。古い設定が残っているもののインストールツリーがそれ以外は健全な場合、完全な Plugin 健全性を示唆するのではなく、その旨を要約で示します。

設定済み Plugin がディスク上に存在するものの、ローダーのパス安全性チェックでブロックされている場合、設定検証は Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、先行するブロック済み Plugin 診断を修正してください。

`register`/`activate` exports の欠落などのモジュール形状失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力にコンパクトな export 形状サマリーが含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の識別情報、有効化状態、ソースメタデータ、貢献所有権に関する OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者検索、チャネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使って、永続化されたレジストリが存在するか、最新か、または古いかを調べます。永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築するには `--refresh` を使います。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ隣接の管理対象 npm ドリフトも修復します。管理対象 Plugin npm プロジェクト配下、またはレガシーのフラットな管理対象 npm ルート配下にある孤立または復旧された `@openclaw/*` パッケージがバンドル済み Plugin をシャドウしている場合、doctor はその古いパッケージを削除し、レジストリを再構築して、起動時にバンドル済みマニフェストに対して検証されるようにします。Doctor は、`peerDependencies.openclaw` を宣言する管理対象 npm plugins にホストの `openclaw` パッケージも再リンクするため、更新または npm 修復後に `openclaw/plugin-sdk/*` などのパッケージローカルなランタイムインポートが解決されます。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗用の非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行の展開中に緊急起動復旧が必要な場合のみを対象としています。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Marketplace list は、ローカルマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 短縮形、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイスマニフェストとPluginエントリを出力します。

Marketplace refresh は、ホストされた OpenClaw マーケットプレイスフィードを読み込み、検証済みレスポンスをローカルのホスト済みフィードスナップショットとして永続化します。オプションを指定しない場合は、設定済みのデフォルトフィードプロファイルを使用します。特定の設定済みプロファイルを更新するには `--feed-profile <name>`、明示的なホスト済みフィード URL を更新するには `--feed-url <url>`、一致するペイロードチェックサム（`sha256:<hex>` または裸の 64 文字の 16 進ダイジェスト）を必須にするには `--expected-sha256 <sha256>`、機械可読出力には `--json` を使用します。明示的なホスト済みフィード URL には、認証情報、クエリ文字列、フラグメントを含めてはいけません。ピン留めされていない更新では、コマンドを失敗させずに、ホスト済みスナップショットまたはバンドルされたフォールバック結果を報告できます。ピン留めされた更新は、新しいホスト済みペイロードを受け入れない限り失敗し、ホスト済み更新が成功しても、OpenClaw が検証済みスナップショットを永続化できない場合は失敗します。

## 関連

- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/ja-JP/clawhub)
