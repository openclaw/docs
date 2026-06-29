---
read_when:
    - Gateway プラグインまたは互換バンドルをインストールまたは管理したい
    - シンプルなツールPluginをスキャフォールドまたは検証したい
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングのエンドユーザー向けガイド。
  </Card>
  <Card title="Manage plugins" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開のクイック例。
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、コマンドを `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 付きで実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力をパース可能な状態に保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin ライフサイクルの変更操作は無効です。このインストールでは、`plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、`plugins disable` の代わりに Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用します。
</Note>

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。それ以外は `plugins enable` が必要です。

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

`plugins init` は、デフォルトで最小構成の TypeScript ツール Plugin を作成します。最初の引数は Plugin ID です。表示名には `--name` を渡します。OpenClaw は、この ID をデフォルトの出力ディレクトリとパッケージ命名に使用します。ツールのスキャフォールドは `defineToolPlugin` を使用します。
`plugins build` はビルド済みエントリをインポートし、静的ツールメタデータを読み取り、`openclaw.plugin.json` を書き込み、`package.json` の `openclaw.extensions` を同期した状態に保ちます。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、現在のエントリエクスポートが引き続き一致していることを確認します。ツール作成ワークフロー全体については、[ツール Plugin](/ja-JP/plugins/tool-plugins)を参照してください。

スキャフォールドは TypeScript ソースを書き込みますが、ビルド済みの `./dist/index.js` エントリからメタデータを生成するため、公開済み CLI でも同じワークフローを使用できます。エントリがデフォルトのパッケージエントリでない場合は `--entry <path>` を使用します。CI では、ファイルを書き換えずに生成メタデータが古い場合に失敗させるため、`plugins build --check` を使用します。

### プロバイダースキャフォールド

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

プロバイダースキャフォールドは、OpenAI 互換の API キー配線、`clawhub package validate` 用の組み込み `npm run validate` スクリプト、ClawHub パッケージメタデータ、GitHub Actions OIDC による将来の信頼済み公開向けの手動ディスパッチ GitHub ワークフローを備えた、汎用テキスト/モデルプロバイダー Plugin を作成します。プロバイダースキャフォールドは Skills を生成せず、`openclaw plugins build` または `openclaw plugins validate` を使用しません。これらのコマンドは、ツールスキャフォールドの生成メタデータパス用です。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメントルート、認証情報テキスト、README の文面を実際のプロバイダー詳細に置き換えてください。初回の ClawHub 公開と信頼済み公開者設定には、生成された README を使用します。

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

メンテナーがセットアップ時インストールをテストする場合、保護付き環境変数で自動 Plugin インストール元を上書きできます。[Plugin インストールの上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
起動移行期間中、公式 Plugin ID に一致しない限り、裸のパッケージ名はデフォルトで npm からインストールされます。バンドル済み Plugin に一致する生の `@openclaw/*` パッケージ指定は、現在の OpenClaw ビルドに同梱されているバンドル済みコピーを使用します。外部 npm パッケージを意図的に使用したい場合は `npm:<package>` を使用します。ClawHub には `clawhub:<package>` を使用します。Plugin インストールはコードを実行することと同様に扱ってください。固定バージョンを優先してください。
</Warning>

`plugins search` は、インストール可能な Plugin パッケージを ClawHub に問い合わせ、インストール可能なパッケージ名を出力します。検索対象は code-plugin と bundle-plugin パッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用します。

<Note>
ClawHub は、ほとんどの Plugin にとって主要な配布および発見の場所です。Npm は、サポート済みのフォールバックおよび直接インストールパスとして残ります。OpenClaw 所有の `@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールは `latest` を使用します。ベータチャンネルのインストールと更新では、npm の `beta` dist-tag が利用可能な場合はそれを優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include されたファイルに書き込み、`openclaw.json` には触れません。ルート include、include 配列、兄弟オーバーライドを持つ include は、フラット化せずにフェイルクローズします。サポートされている形については、[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常フェイルクローズし、先に `openclaw doctor --fix` を実行するよう伝えます。Gateway 起動時およびホットリロード時には、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。ドキュメント化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした Plugin 向けの、限定的なバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ ID を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みの Plugin ID に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされていません。固定ソースが必要な場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` では npm spec ではなくマーケットプレイスソースメタデータを永続化するため、サポートされていません。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨で、現在は no-op です。OpenClaw は Plugin インストールに対して、組み込みのインストール時危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、共有のオペレーター所有 `security.installPolicy` サーフェスを使用してください。Plugin の `before_install` フックは Plugin ランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub で公開した Plugin がレジストリスキャンによって非表示またはブロックされた場合は、[ClawHub 公開](/ja-JP/clawhub/publishing)の公開者向け手順を使用してください。`--dangerously-force-unsafe-install` は ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開状態にしたりしません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティ ClawHub インストールは、パッケージをダウンロードする前に選択されたリリースの信頼レコードを確認します。ClawHub がそのリリースのダウンロードを無効化している場合、悪意のあるスキャン結果を報告している場合、または隔離などのブロック型モデレーション状態に置いている場合、OpenClaw はそのリリースを拒否します。ブロックではないリスクありスキャンステータス、リスクありモデレーション状態、またはレジストリ理由については、OpenClaw が信頼詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub の警告を確認し、対話プロンプトなしで続行すると判断した場合にのみ使用してください。保留中または古くなったクリーンな信頼レコードは警告しますが、確認は不要です。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージインストールではなく、フィルタリングされたフック表示とフックごとの有効化には `openclaw hooks` を使用してください。

    Npm 仕様は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または **dist-tag**）。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係のインストールは、安全のため、シェルにグローバル npm install 設定がある場合でも、Plugin ごとに 1 つの管理対象 npm プロジェクトで `--ignore-scripts` を付けて実行されます。管理対象 Plugin npm プロジェクトは OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホストのセキュリティピンはホイストされた Plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ベアパッケージ仕様も、公式 Plugin id と一致しない限り、ローンチ移行期間中は npm から直接インストールされます。

    バンドル済み Plugin と一致する生の `@openclaw/*` パッケージ仕様は、npm フォールバックの前に、イメージが所有するバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は、管理対象 npm オーバーライドを作成する代わりに、現在の OpenClaw ビルドに含まれるバンドル済み Discord Plugin を使用します。外部 npm パッケージを強制するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    ベア仕様と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がこれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    正確なバージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決されたパッケージメタデータを確認します。最新の安定版パッケージがより新しい OpenClaw Plugin API または最小ホストバージョンを要求する場合、OpenClaw は古い安定版を調べ、代わりに互換性のある最新リリースをインストールします。正確なバージョンと `@beta` のような明示的な dist-tag は厳密なままです。選択されたパッケージに互換性がない場合、コマンドは失敗し、OpenClaw をアップグレードするか互換性のあるバージョンを選択するよう求めます。

    ベアインストール仕様が公式 Plugin id（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き仕様（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git repositories">
    `git:<repo>` を使用して、git リポジトリから直接インストールします。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、要求された ref が存在する場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、オペレーターのインストールポリシー、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同じように動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を検証します。Plugin が `api.registerCli` で CLI ルートを登録した場合は、そのコマンドを OpenClaw ルート CLI から直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールで使用されるものと同じ Plugin ごとの管理対象 npm プロジェクトパスをテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` 検証、ホイストされた依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、引き続き Plugin extensions ルート配下のローカルアーカイブとしてインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm として安全なベア Plugin 仕様は、公式 Plugin id と一致しない限り、ローンチ移行期間中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 専用解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、公開されている Plugin API / 最小 gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパス経由でインストールします。ClawPack メタデータのない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証パス経由でインストールされます。記録されたインストールは、後の更新のために、ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョンなしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるように、バージョンなしの記録済み仕様を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターにピン留めされたままです。

#### Marketplace 省略記法

Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に marketplace 名が存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知 marketplace 名
    - ローカル marketplace ルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略記法
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub または git から読み込まれるリモート marketplace では、Plugin エントリはクローンされた marketplace リポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

管理対象ローカルインストールは、Plugin ディレクトリまたはアーカイブである必要があります。スタンドアロンの `.js`、`.mjs`、`.cjs`、`.ts` Plugin ファイルは、`plugins install` によって管理対象 Plugin ルートへコピーされません。代わりに `plugins.load.paths` に明示的に列挙してください。

<Note>
互換バンドルは通常の Plugin ルートへインストールされ、同じ list/info/enable/disable フローに参加します。現在、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  有効化された Plugin のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブル表示から、Plugin ごとの source/origin/version/activation メタデータを含む詳細行へ切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加え、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` は、まず永続化されたローカル Plugin レジストリを読み取り、レジストリが存在しないか無効な場合は、マニフェストのみから導出したフォールバックを使用します。これは Plugin がインストール済み、有効化済み、コールドスタート計画から見える状態かを確認するのに便利ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hooks が実行されることを期待する前に、そのチャネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` に基づく各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。Plugin ランタイムコードの import、パッケージマネージャーの実行、欠落した依存関係の修復は行いません。
</Note>

起動ログに `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` と出る場合は、`openclaw plugins list --enabled --verbose`、または一覧にある Plugin id を指定した `openclaw plugins inspect <id>` を実行して Plugin id を確認し、信頼する id を `openclaw.json` の `plugins.allow` にコピーします。警告が検出されたすべての Plugin を一覧表示できる場合は、それらの id をすでに含む、貼り付け可能な `plugins.allow` スニペットを出力します。Plugin が install/load-path provenance なしで読み込まれる場合は、その Plugin id を inspect してから、信頼する id を `plugins.allow` にピン留めするか、信頼できるソースから Plugin を再インストールして OpenClaw にインストール provenance を記録させます。

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、family、channel、version、summary、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ済み Docker イメージ内でバンドル済み Plugin を扱う場合は、Plugin ソースディレクトリを、一致するパッケージ済みソースパス（例: `/app/extensions/synology-chat`）へ bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは非アクティブなままなので、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使用されます。

ランタイム hook デバッグには、次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込み済みの検査パスから登録済み hooks と diagnostics を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態をクリーンアップする、または config で参照されている欠落したダウンロード可能 Plugin を復旧するには、`openclaw doctor --fix` を使用します。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway URL/profile、service/process ヒント、config パス、RPC ヘルスを確認します。
- 非バンドル conversation hooks（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカル Plugin ディレクトリのコピーを避けるには、`--link` を使用します（`plugins.load.paths` に追加します）。

```bash
openclaw plugins install -l ./my-plugin
```

スタンドアロン Plugin ファイルは、`plugins install` でインストールしたり、`~/.openclaw/extensions` または `<workspace>/.openclaw/extensions` に直接置いたりするのではなく、`plugins.load.paths` に列挙する必要があります。これらの自動検出ルートは Plugin パッケージまたはバンドルディレクトリを読み込みますが、トップレベルのスクリプトファイルはローカルヘルパーとして扱われ、スキップされます。

<Note>
workspace extensions ルートから検出された workspace 由来の plugins は、明示的に有効化されるまで
import も実行もされません。ローカル開発では、
`openclaw plugins enable <plugin-id>` を実行するか、
`plugins.entries.<plugin-id>.enabled: true` を設定します。config で
`plugins.allow` を使用している場合は、同じ plugin id もそこに含めてください。このフェイルクローズ規則は、
channel setup が setup-only loading のために workspace 由来の Plugin を明示的に対象にする場合にも適用されるため、その
workspace Plugin が無効のまま、または allowlist から除外されたままでは、ローカル channel Plugin setup code は実行されません。Linked installs
と明示的な `plugins.load.paths` エントリは、解決された plugin origin に対する通常のポリシーに従います。詳しくは
[Plugin ポリシーの構成](/ja-JP/tools/plugin#configure-plugin-policy)
と [Configuration リファレンス](/ja-JP/gateway/configuration-reference#plugins) を参照してください。

linked installs は管理対象の install target にコピーする代わりに source path を再利用するため、`--force` は `--link` と併用できません。

npm installs では `--pin` を使用すると、default behavior は unpinned のまま、解決された exact spec (`name@version`) を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin install metadata はユーザー config ではなく、マシン管理の state です。Installs と updates は、active OpenClaw state directory 配下の共有 SQLite state database にこれを書き込みます。`installed_plugin_index` 行は、壊れた、または見つからない Plugin manifest の records を含む永続的な `installRecords` metadata と、`openclaw plugins update`、uninstall、diagnostics、cold Plugin registry で使われる manifest 由来の cold registry cache を保存します。

OpenClaw が config 内に shipped legacy `plugins.installs` records を見つけた場合、runtime reads は `openclaw.json` を書き換えずに compatibility input として扱います。明示的な Plugin writes と `openclaw doctor --fix` は、config writes が許可されている場合、それらの records を Plugin インデックスへ移動し、config key を削除します。どちらかの write が失敗した場合は、install metadata が失われないように config records が保持されます。

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、persisted Plugin インデックス、Plugin allow/deny list entries、linked `plugins.load.paths` entries から Plugin records を削除します。`--keep-files` が設定されていない限り、uninstall は OpenClaw の Plugin extensions root 内にある tracked managed install directory も削除します。active memory plugins では、memory slot が `memory-core` にリセットされます。

<Note>
`--keep-config` は `--keep-files` の deprecated alias としてサポートされています。
</Note>

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates は、管理対象 Plugin インデックス内の tracked Plugin installs と、`hooks.internal.installs` 内の tracked hook-pack installs に適用されます。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Plugin id を渡すと、OpenClaw はその Plugin に記録済みの install spec を再利用します。つまり、以前に保存された `@beta` などの dist-tags や exact pinned versions は、以後の `update <id>` 実行でも引き続き使われます。

    `update <id> --dry-run` の間、exact pinned npm installs は pinned のままです。OpenClaw が package の registry default line も解決でき、その default line が installed pinned version より新しい場合、dry run は pin を報告し、registry default line に追従するための明示的な `@latest` package update command を出力します。

    その targeted-update 規則は、一括の `openclaw plugins update --all` maintenance path とは異なります。一括 updates は通常の tracked install specs を引き続き尊重しますが、trusted official OpenClaw Plugin records は、古い exact official package に留まる代わりに、現在の official catalog target と同期できます。exact または tagged official spec を意図的に変更しないままにしたい場合は、targeted `update <id>` を使用してください。

    npm installs では、dist-tag または exact version を含む明示的な npm package spec を渡すこともできます。OpenClaw はその package name を tracked Plugin record に解決し、その installed Plugin を更新して、今後の id-based updates のために新しい npm spec を記録します。

    version や tag のない npm package name を渡した場合も、tracked Plugin record に解決されます。Plugin が exact version に pin されていて、registry の default release line に戻したい場合に使用します。

  </Accordion>
  <Accordion title="Beta channel updates">
    Targeted `openclaw plugins update <id-or-npm-spec>` は、新しい spec を渡さない限り tracked Plugin spec を再利用します。一括 `openclaw plugins update --all` は、trusted official Plugin records を official catalog target に同期するときに configured `update.channel` を使用するため、beta-channel installs は stable/latest に暗黙的に正規化されるのではなく、beta release line に留まることができます。

    `openclaw update` は active OpenClaw update channel も認識します。beta channel では、default-line npm と ClawHub Plugin records はまず `@beta` を試します。Plugin beta release が存在しない場合は、記録済みの default/latest spec にフォールバックします。npm plugins は、beta package が存在しても install validation に失敗する場合にもフォールバックします。その fallback は warning として報告され、core update は失敗しません。Exact versions と explicit tags は、targeted updates ではその selector に pinned のままです。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    live npm update の前に、OpenClaw は installed package version を npm registry metadata と照合します。installed version と recorded artifact identity がすでに resolved target と一致している場合、update は downloading、reinstalling、`openclaw.json` の rewriting を行わずに skipped されます。

    stored integrity hash が存在し、fetched artifact hash が変化した場合、OpenClaw はそれを npm artifact drift として扱います。interactive `openclaw plugins update` command は expected hash と actual hash を出力し、続行前に確認を求めます。Non-interactive update helpers は、caller が明示的な continuation policy を指定しない限り fail closed します。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` は compatibility のために `plugins update` でも受け付けられますが、deprecated であり、Plugin update behavior は変更しなくなりました。Operator `security.installPolicy` は引き続き updates をブロックできます。Plugin `before_install` hooks は、Plugin hooks が loaded される processes でのみ適用されます。
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Community ClawHub-backed Plugin updates は、replacement package を downloading する前に、installs と同じ exact-release trust check を実行します。選択された ClawHub release に risky trust warning がある場合でも続行すべき reviewed automation では、`--acknowledge-clawhub-risk` を使用してください。Official ClawHub packages と bundled OpenClaw Plugin sources は、この release-trust prompt を bypass します。
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、default では Plugin runtime を import せずに、identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities、および検出された MCP または LSP server support を表示します。JSON output には、`contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin manifest contracts が含まれるため、operators は Plugin を enabling または restarting する前に trusted-surface declarations を audit できます。`--runtime` を追加すると、Plugin module を load し、registered hooks、tools、commands、services、gateway methods、HTTP routes を含めます。Runtime inspection は missing Plugin dependencies を直接報告します。installs と repairs は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に残ります。

Plugin-owned CLI commands は通常、root `openclaw` command groups として installed されますが、plugins は `openclaw nodes` などの core parent の下に nested commands を登録することもできます。`inspect --runtime` が `cliCommands` の下に command を表示したら、listed path で実行してください。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、runtime で実際に登録する内容によって分類されます。

- **plain-capability** — 1 種類の capability type（例: provider-only Plugin）
- **hybrid-capability** — 複数の capability types（例: text + speech + images）
- **hook-only** — hooks のみで、capabilities や surfaces はなし
- **non-capability** — tools/commands/services はあるが capabilities はなし

capability model の詳細は [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` flag は、scripting と auditing に適した machine-readable report を出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、hook summary columns を含む fleet-wide table を描画します。`info` は `inspect` の alias です。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin load errors、manifest/discovery diagnostics、compatibility notices、missing Plugin slots などの stale Plugin config references を報告します。install tree と Plugin config が clean な場合は `No plugin issues detected.` と出力します。stale config が残っていても install tree がそれ以外は healthy な場合、summary は full Plugin health を示唆する代わりにその旨を表示します。

configured Plugin が disk 上に存在するものの loader の path-safety checks によって blocked されている場合、config validation は Plugin entry を保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` config を削除するのではなく、path ownership や world-writable permissions など、先行する blocked-plugin diagnostic を修正してください。

missing `register`/`activate` exports などの module-shape failures では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、diagnostic output に compact export-shape summary が含まれます。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

local Plugin registry は、installed Plugin identity、enablement、source metadata、contribution ownership に関する OpenClaw の persisted cold read model です。通常の startup、provider owner lookup、channel setup classification、Plugin inventory は、Plugin runtime modules を import せずにこれを読み取れます。

persisted registry が存在するか、current か、stale かを確認するには `plugins registry` を使用します。persisted Plugin インデックス、config policy、manifest/package metadata から再構築するには `--refresh` を使用します。これは repair path であり、runtime activation path ではありません。

`openclaw doctor --fix` は registry-adjacent managed npm drift も修復します。managed Plugin npm project または legacy flat managed npm root 配下にある orphaned または recovered `@openclaw/*` package が bundled Plugin を shadow している場合、doctor はその stale package を削除し、startup が bundled manifest に対して validation するよう registry を再構築します。Doctor は、`peerDependencies.openclaw` を宣言する managed npm plugins に host `openclaw` package も relink するため、updates または npm repairs の後に `openclaw/plugin-sdk/*` などの package-local runtime imports が解決されます。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、registry read failures のための deprecated break-glass compatibility switch です。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。env fallback は、migration の rollout 中に emergency startup recovery が必要な場合のみ使用します。
</Warning>

### Marketplace

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

`plugins marketplace entries` は、設定済みの OpenClaw マーケットプレイスフィードからエントリを一覧表示します。デフォルトではホストされたフィードを試行し、最新の承認済みスナップショットまたはバンドルデータへフォールバックします。特定の設定済みプロファイルを読み取るには `--feed-profile <name>`、明示的なホスト済みフィード URL を読み取るには `--feed-url <url>`、フィードを取得せずに最新の承認済みスナップショットを読み取るには `--offline` を使用します。

`plugins marketplace refresh` は、設定済みのホスト済みフィードスナップショットを更新し、OpenClaw がホスト済みデータ、ホスト済みスナップショット、またはバンドルされたフォールバックデータのどれを受け入れたかを報告します。呼び出し元が、固定されたチェックサムと新しいホスト済みペイロードが一致しない限りコマンドを失敗させる必要がある場合は、`--expected-sha256` を使用します。

マーケットプレイスの `list` は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

マーケットプレイス更新は、ホスト済みの OpenClaw マーケットプレイスフィードを読み込み、検証済みレスポンスをローカルのホスト済みフィードスナップショットとして永続化します。オプションなしの場合、設定済みのデフォルトフィードプロファイルを使用します。特定の設定済みプロファイルを更新するには `--feed-profile <name>`、明示的なホスト済みフィード URL を更新するには `--feed-url <url>`、一致するペイロードチェックサム（`sha256:<hex>` または裸の 64 文字の 16 進ダイジェスト）を必須にするには `--expected-sha256 <sha256>`、機械可読な出力には `--json` を使用します。明示的なホスト済みフィード URL には、認証情報、クエリ文字列、フラグメントを含めてはいけません。固定されていない更新では、コマンドを失敗させずにホスト済みスナップショットまたはバンドルされたフォールバック結果を報告できます。固定された更新は、新しいホスト済みペイロードを受け入れない限り失敗し、成功したホスト済み更新は、OpenClaw が検証済みスナップショットを永続化できない場合に失敗します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/ja-JP/clawhub)
