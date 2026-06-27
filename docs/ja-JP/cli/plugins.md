---
read_when:
    - Gateway プラグインまたは互換バンドルをインストールまたは管理したい
    - シンプルなツール Plugin をスキャフォールドまたは検証したい
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-06-27T10:59:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能なまま保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード (`OPENCLAW_NIX_MODE=1`) では、Plugin ライフサイクルの変更操作は無効です。このインストールには、`plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、または `plugins disable` の代わりに Nix ソースを使用します。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
バンドル Plugin は OpenClaw に同梱されます。一部はデフォルトで有効です（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザー Plugin）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
</Note>

### 作成

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` はデフォルトで最小構成の TypeScript ツール Plugin を作成します。最初の引数は Plugin ID です。表示名には `--name` を渡します。OpenClaw は ID をデフォルトの出力ディレクトリとパッケージ名に使用します。ツールスキャフォールドは `defineToolPlugin` を使用します。
`plugins build` はビルド済みエントリをインポートし、その静的ツールメタデータを読み取り、`openclaw.plugin.json` を書き込み、`package.json` の `openclaw.extensions` を同期させます。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、現在のエントリエクスポートが引き続き一致していることを確認します。ツール作成ワークフロー全体については、[ツール Plugin](/ja-JP/plugins/tool-plugins)を参照してください。

スキャフォールドは TypeScript ソースを書き込みますが、ビルド済みの `./dist/index.js` エントリからメタデータを生成するため、公開された CLI でもこのワークフローは機能します。エントリがデフォルトのパッケージエントリではない場合は `--entry <path>` を使用します。CI では、ファイルを書き換えずに生成メタデータが古い場合に失敗させるため、`plugins build --check` を使用します。

### プロバイダースキャフォールド

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

プロバイダースキャフォールドは、OpenAI 互換の API キー接続、`clawhub package validate` 用の組み込み `npm run validate` スクリプト、ClawHub パッケージメタデータ、将来的な GitHub Actions OIDC による信頼済み公開のための手動ディスパッチ GitHub ワークフローを備えた、汎用テキスト/モデルプロバイダー Plugin を作成します。プロバイダースキャフォールドは Skills を生成せず、`openclaw plugins build` または `openclaw plugins validate` を使用しません。これらのコマンドは、ツールスキャフォールドの生成メタデータパス用です。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメントルート、認証情報テキスト、README 文面を実際のプロバイダー詳細に置き換えてください。初回の ClawHub 公開と信頼済みパブリッシャー設定には、生成された README を使用します。

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

セットアップ時インストールをテストするメンテナーは、保護付き環境変数で自動 Plugin インストールソースを上書きできます。[Plugin インストールの上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
裸のパッケージ名は、公式 Plugin ID と一致しない限り、ローンチ移行期間中はデフォルトで npm からインストールされます。バンドル Plugin と一致する生の `@openclaw/*` パッケージ指定は、現在の OpenClaw ビルドに同梱されたバンドルコピーを使用します。外部 npm パッケージを明示的に使用したい場合は `npm:<package>` を使用します。ClawHub には `clawhub:<package>` を使用します。Plugin のインストールはコードを実行するものとして扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、インストール可能なパッケージ名を出力します。コード Plugin とバンドル Plugin のパッケージを検索し、Skills は検索しません。ClawHub Skills には `openclaw skills search` を使用します。

<Note>
ClawHub は、ほとんどの Plugin における主要な配布および発見の場です。Npm は、サポートされるフォールバックおよび直接インストールのパスとして残ります。OpenClaw 所有の `@openclaw/*` Plugin パッケージは npm に再び公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールでは `latest` を使用します。ベータチャンネルのインストールと更新では、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` セクションが単一ファイルの `$include` に基づいている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟上書きを含むインクルードは、平坦化する代わりに fail closed します。サポートされる形状については、[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常 fail closed し、先に `openclaw doctor --fix` を実行するよう伝えます。Gateway 起動時およびホットリロード時には、無効な Plugin 設定は他の無効な設定と同様に fail closed します。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした Plugin 向けの、限定的なバンドル Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` は既存のインストール先を再利用し、すでにインストールされている Plugin またはフックパックをその場で上書きします。同じ ID を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常アップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin ID に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別ソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用します。マーケットプレイスインストールは npm 指定ではなくマーケットプレイスソースメタデータを永続化するため、`--marketplace` ではサポートされません。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨であり、現在は no-op です。OpenClaw は Plugin インストールに対して、組み込みのインストール時危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、共有のオペレーター所有 `security.installPolicy` サーフェスを使用します。Plugin の `before_install` フックは Plugin ランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub に公開した Plugin がレジストリスキャンによって非表示またはブロックされた場合は、[ClawHub 公開](/ja-JP/clawhub/publishing)のパブリッシャー手順を使用します。`--dangerously-force-unsafe-install` は ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開状態にしたりしません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティ ClawHub インストールでは、パッケージをダウンロードする前に選択したリリースの信頼記録を確認します。ClawHub がそのリリースのダウンロードを無効にしている場合、悪意のあるスキャン結果を報告している場合、またはリリースを隔離などのブロックするモデレーション状態に置いている場合、OpenClaw はそのリリースを拒否します。ブロックしないリスクのあるスキャンステータス、リスクのあるモデレーション状態、またはレジストリ理由については、OpenClaw は信頼詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub 警告を確認し、対話プロンプトなしで続行すると判断した場合にのみ使用してください。保留中または古いクリーンな信頼記録は警告しますが、確認は必要ありません。公式 ClawHub パッケージとバンドルされた OpenClaw Plugin ソースは、このリリース信頼プロンプトを迂回します。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージインストールではなく、絞り込まれたフック可視性とフックごとの有効化には `openclaw hooks` を使用します。

    Npm 指定は**レジストリのみ**です（パッケージ名 + 任意の**正確なバージョン**または **dist-tag**）。Git/URL/file 指定と semver 範囲は拒否されます。依存関係のインストールは、シェルにグローバル npm インストール設定がある場合でも、安全性のため `--ignore-scripts` を付けて、Plugin ごとに 1 つの管理された npm プロジェクト内で実行されます。管理された Plugin npm プロジェクトは OpenClaw のパッケージレベル npm `overrides` を継承するため、ホストのセキュリティ固定は巻き上げられた Plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。裸のパッケージ指定も、公式 Plugin ID と一致しない限り、ローンチ移行期間中は npm から直接インストールされます。

    バンドル済みPluginに一致する生の `@openclaw/*` パッケージ指定は、npm フォールバックより前に、イメージ所有のバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は、管理対象の npm オーバーライドを作成する代わりに、現在の OpenClaw ビルドに含まれるバンドル済み Discord Pluginを使用します。外部 npm パッケージを強制するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    裸の指定と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がこれらのいずれかをプレリリースへ解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    正確なバージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決されたパッケージメタデータを確認します。最新の安定版パッケージが、より新しい OpenClaw Plugin API または最小ホストバージョンを要求する場合、OpenClaw は古い安定版を検査し、代わりに互換性のある最新リリースをインストールします。正確なバージョンと `@beta` のような明示的な dist-tag は厳格なままです。選択されたパッケージに互換性がない場合、コマンドは失敗し、OpenClaw をアップグレードするか互換性のあるバージョンを選ぶよう求めます。

    裸のインストール指定が公式Plugin id（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き指定（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git repositories">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` のクローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    git インストールは一時ディレクトリにクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常のPluginディレクトリインストーラを使用します。つまり、マニフェスト検証、オペレーターのインストールポリシー、パッケージマネージャーのインストール処理、インストール記録は npm インストールと同じように動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Pluginが `api.registerCli` で CLI ルートを登録している場合は、たとえば `openclaw demo-plugin ping` のように、そのコマンドを OpenClaw ルート CLI から直接実行します。

  </Accordion>
  <Accordion title="Archives">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Pluginアーカイブには、展開されたPluginルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` のみを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールで使用されるものと同じPluginごとの管理対象 npm プロジェクトパスをテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには、`package-lock.json` 検証、hoist された依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、引き続きPlugin拡張ルート配下のローカルアーカイブとしてインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` locator を使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

公式Plugin id に一致しない限り、起動移行期間中、裸の npm-safe Plugin指定はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に告知されているPlugin API / 最小 gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータのない古い ClawHub バージョンは、引き続きレガシーパッケージアーカイブ検証パスを通じてインストールされます。記録されたインストールは、後の更新のために、ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョンなしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるように、バージョンなしの記録済み指定を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに pin されたままです。

#### Marketplace 省略記法

marketplace 名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace ソースを明示的に渡したい場合は、`--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` からの Claude known-marketplace 名
    - ローカル marketplace ルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub repo 省略記法
    - `https://github.com/owner/repo` のような GitHub repo URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub または git から読み込まれるリモート marketplace では、Pluginエントリはクローンされた marketplace repo 内に留まる必要があります。OpenClaw はその repo からの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他の非パスPluginソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

管理対象のローカルインストールは、Pluginディレクトリまたはアーカイブである必要があります。スタンドアロンの `.js`、`.mjs`、`.cjs`、および `.ts` Pluginファイルは、`plugins install` によって管理対象Pluginルートへコピーされません。代わりに `plugins.load.paths` に明示的に列挙してください。

<Note>
互換バンドルは通常のPluginルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在、bundle skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、および互換 Codex hook ディレクトリがサポートされています。その他の検出されたバンドル機能は diagnostics/info に表示されますが、ランタイム実行にはまだ接続されていません。
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
  有効化されたPluginのみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブルビューから、ソース/出所/バージョン/有効化メタデータを含むPluginごとの詳細行へ切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を表示します。
</ParamField>

<Note>
`plugins list` は、永続化されたローカルPluginレジストリを先に読み取り、レジストリが存在しないか無効な場合は、マニフェストのみから導出されるフォールバックを使用します。これはPluginがインストール済みで、有効化され、cold startup 計画から見えているかを確認するのに便利ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Pluginコード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードまたは hook の実行を期待する前に、そのチャネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、単なるラッパープロセスではなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から、各Pluginの `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名がPluginの通常の Node `node_modules` 参照パス上に存在するかを確認します。Pluginランタイムコードを import したり、パッケージマネージャーを実行したり、不足している依存関係を修復したりはしません。
</Note>

起動ログに `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` と表示された場合は、`openclaw plugins list --enabled --verbose` または、列挙されたPlugin id を指定した `openclaw plugins inspect <id>` を実行してPlugin id を確認し、信頼済み id を `openclaw.json` の `plugins.allow` にコピーします。警告が検出されたすべてのPluginを列挙できる場合、それらの id をすでに含む、そのまま貼り付け可能な `plugins.allow` スニペットを出力します。Pluginがインストール/ロードパスの由来なしに読み込まれる場合は、そのPlugin id を inspect し、信頼済み id を `plugins.allow` に pin するか、信頼できるソースからPluginを再インストールして OpenClaw がインストールの由来を記録できるようにします。

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態を検査したり、config を変更したり、パッケージをインストールしたり、Pluginランタイムコードを読み込んだりはしません。検索結果には、ClawHub パッケージ名、family、channel、version、summary、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ済み Docker イメージ内でバンドル済みPluginを扱う場合は、`/app/extensions/synology-chat` のように、一致するパッケージ済みソースパスへPluginソースディレクトリを bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単純にコピーされたソースディレクトリは inert のままなので、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使用されます。

ランタイム hook のデバッグには、次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、module-loaded inspection pass から登録済み hook と診断を表示します。ランタイム inspection は依存関係をインストールしません。レガシー依存関係状態をクリーンアップするか、config から参照されている不足したダウンロード可能Pluginを復旧するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway URL/profile、service/process ヒント、config パス、および RPC health を確認します。
- 非バンドル conversation hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルPluginディレクトリをコピーしないようにするには、`--link` を使用します（`plugins.load.paths` に追加します）。

```bash
openclaw plugins install -l ./my-plugin
```

スタンドアロンPluginファイルは、`plugins install` でインストールしたり、`~/.openclaw/extensions` または `<workspace>/.openclaw/extensions` に直接配置したりするのではなく、`plugins.load.paths` に列挙する必要があります。これらの自動検出ルートはPluginパッケージまたはバンドルディレクトリを読み込みますが、トップレベルのスクリプトファイルはローカルヘルパーとして扱われ、スキップされます。

<Note>
ワークスペースの extensions ルートから検出されたワークスペース由来の Plugin は、明示的に有効化されるまで
インポートも実行もされません。ローカル開発では、
`openclaw plugins enable <plugin-id>` を実行するか、
`plugins.entries.<plugin-id>.enabled: true` を設定してください。設定で
`plugins.allow` を使用している場合は、そこにも同じ Plugin id を含めてください。このフェイルクローズのルールは、
チャネルセットアップがセットアップ専用ロードのためにワークスペース由来の Plugin を明示的に対象にする場合にも適用されるため、
そのワークスペース Plugin が無効化されたまま、または allowlist から除外されたままである間は、ローカルチャネル Plugin のセットアップコードは実行されません。リンクされたインストールと
明示的な `plugins.load.paths` エントリは、解決された Plugin origin に対する通常のポリシーに従います。詳しくは
[Plugin ポリシーを設定する](/ja-JP/tools/plugin#configure-plugin-policy)
および [設定リファレンス](/ja-JP/gateway/configuration-reference#plugins) を参照してください。

リンクされたインストールは管理対象のインストール先へコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルトの非固定動作を維持しつつ、解決された正確な spec（`name@version`）を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなくマシン管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の共有 SQLite 状態データベースに書き込みます。`installed_plugin_index` 行は、壊れた、または欠落した Plugin マニフェストのレコードを含む永続的な `installRecords` メタデータに加え、`openclaw plugins update`、アンインストール、診断、cold Plugin レジストリで使用されるマニフェスト由来の cold レジストリキャッシュを保存します。

OpenClaw が設定内で出荷済みレガシーの `plugins.installs` レコードを検出すると、ランタイム読み取りは `openclaw.json` を書き換えずに互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、設定書き込みが許可されている場合にそれらのレコードを Plugin インデックスへ移動し、設定キーを削除します。どちらかの書き込みが失敗した場合は、インストールメタデータが失われないように設定レコードが保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは OpenClaw の Plugin extensions ルート内にある追跡済み管理対象インストールディレクトリも削除します。Active Memory Plugin の場合、メモリスロットは `memory-core` にリセットされます。

<Note>
`--keep-config` は、`--keep-files` の非推奨エイリアスとしてサポートされています。
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

更新は、管理対象 Plugin インデックス内の追跡済み Plugin インストールと、`hooks.internal.installs` 内の追跡済み hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前保存された `@beta` などの dist-tag や、正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    この対象指定更新ルールは、一括 `openclaw plugins update --all` メンテナンスパスとは異なります。一括更新は通常の追跡済みインストール spec を引き続き尊重しますが、信頼済みの公式 OpenClaw Plugin レコードは、古い正確な公式パッケージに留まる代わりに、現在の公式カタログターゲットへ同期できます。正確な、またはタグ付きの公式 spec を意図的にそのまま維持したい場合は、対象指定の `update <id>` を使用してください。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡済み Plugin レコードに解決し直し、そのインストール済み Plugin を更新して、将来の id ベース更新のために新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡済み Plugin レコードに解決し直されます。Plugin が正確なバージョンに固定されていて、それをレジストリのデフォルトリリースラインへ戻したい場合に使用してください。

  </Accordion>
  <Accordion title="ベータチャネル更新">
    対象指定の `openclaw plugins update <id-or-npm-spec>` は、新しい spec を渡さない限り、追跡済み Plugin spec を再利用します。一括 `openclaw plugins update --all` は、信頼済みの公式 Plugin レコードを公式カタログターゲットへ同期するときに、設定された `update.channel` を使用します。そのため、ベータチャネルのインストールは、stable/latest へ暗黙に正規化される代わりに、ベータリリースラインに留まることができます。

    `openclaw update` も、アクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、デフォルトラインの npm および ClawHub Plugin レコードは最初に `@beta` を試します。Plugin のベータリリースが存在しない場合は、記録された default/latest spec にフォールバックします。npm Plugin は、ベータパッケージが存在してもインストール検証に失敗した場合にもフォールバックします。このフォールバックは警告として報告され、コア更新を失敗させません。正確なバージョンと明示的なタグは、対象指定更新ではそのセレクタに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録されたアーティファクト ID が、解決されたターゲットとすでに一致している場合、ダウンロード、再インストール、`openclaw.json` の書き換えを行わずに更新はスキップされます。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトハッシュが変化した場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを出力し、続行前に確認を求めます。非対話型更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限りフェイルクローズします。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は互換性のために `plugins update` でも受け入れられますが、非推奨であり、現在は Plugin 更新動作を変更しません。オペレーターの `security.installPolicy` は引き続き更新をブロックできます。Plugin の `before_install` フックは、Plugin フックがロードされているプロセスでのみ適用されます。
  </Accordion>
  <Accordion title="更新時の --acknowledge-clawhub-risk">
    Community ClawHub backed の Plugin 更新は、置換パッケージをダウンロードする前に、インストール時と同じ exact-release 信頼チェックを実行します。選択された ClawHub リリースにリスクのある信頼警告がある場合でも続行すべき、レビュー済み自動化には `--acknowledge-clawhub-risk` を使用してください。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは Plugin ランタイムをインポートせずに、ID、ロード状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバーサポートを表示します。JSON 出力には、`contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin マニフェスト契約が含まれるため、オペレーターは Plugin を有効化または再起動する前に信頼済みサーフェス宣言を監査できます。`--runtime` を追加すると、Plugin モジュールをロードし、登録されたフック、ツール、コマンド、サービス、Gateway メソッド、HTTP ルートを含めます。ランタイム検査は欠落している Plugin 依存関係を直接報告します。インストールと修復は、`openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは通常、ルートの `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` などのコア親配下にネストされたコマンドを登録することもできます。`inspect --runtime` が `cliCommands` 配下にコマンドを表示した後、一覧にあるパスで実行してください。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 つの capability 種別（例: provider-only Plugin）
- **hybrid-capability** — 複数の capability 種別（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみ、capability やサーフェスなし
- **non-capability** — ツール/コマンド/サービスはあるが capability はなし

capability モデルの詳細については、[Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト処理と監査に適した機械可読レポートを出力します。`inspect --all` は、形状、capability 種別、互換性通知、バンドル機能、フック概要の列を含むフリート全体の表をレンダリングします。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin ロードエラー、マニフェスト/検出診断、互換性通知、欠落している Plugin スロットなどの古い Plugin 設定参照を報告します。インストールツリーと Plugin 設定がクリーンな場合は、`No plugin issues detected.` を出力します。古い設定が残っているが、インストールツリーはそれ以外では正常な場合、完全な Plugin 健全性を示唆する代わりに、概要でその旨を示します。

設定済み Plugin がディスク上に存在しているものの、ローダーのパス安全性チェックによってブロックされている場合、設定検証は Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、先行する blocked-plugin 診断を修正してください。

`register`/`activate` エクスポートの欠落などのモジュール形状エラーでは、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力にコンパクトなエクスポート形状サマリーが含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化状態、ソースメタデータ、貢献所有権に関する OpenClaw の永続化された cold read model です。通常の起動、provider owner lookup、チャネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにそれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古いかを調べます。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ近傍の管理対象 npm ドリフトも修復します。管理対象 Plugin npm プロジェクト配下、またはレガシーのフラットな管理対象 npm ルート配下にある、孤立または復旧された `@openclaw/*` パッケージがバンドル済み Plugin をシャドーしている場合、doctor はその古いパッケージを削除してレジストリを再構築し、起動時にバンドル済みマニフェストに対して検証されるようにします。Doctor はまた、`peerDependencies.openclaw` を宣言している管理対象 npm Plugin にホストの `openclaw` パッケージを再リンクするため、更新または npm 修復後に `openclaw/plugin-sdk/*` などのパッケージローカルなランタイムインポートが解決されます。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行の展開中に緊急起動復旧が必要な場合にのみ使用します。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list は、ローカル marketplace パス、`marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub repo URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加え、解析された marketplace マニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/ja-JP/clawhub)
