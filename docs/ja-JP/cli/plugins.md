---
read_when:
    - Gateway Pluginまたは互換性のあるバンドルをインストールまたは管理したい場合
    - シンプルなツール Plugin の雛形を作成または検証したい場合
    - Pluginの読み込み失敗をデバッグする場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（初期化、ビルド、検証、一覧表示、インストール、マーケットプレイス、アンインストール、有効化/無効化、診断）'
title: プラグイン
x-i18n:
    generated_at: "2026-07-16T11:36:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway の plugins、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    plugins のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイドです。
  </Card>
  <Card title="plugins を管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例です。
  </Card>
  <Card title="Plugin バンドル" href="/ja-JP/plugins/bundles">
    バンドル互換性モデルです。
  </Card>
  <Card title="Plugin マニフェスト" href="/ja-JP/plugins/manifest">
    マニフェストのフィールドと設定スキーマです。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security">
    Plugin インストールのセキュリティ強化です。
  </Card>
</CardGroup>

## コマンド

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # inspect のエイリアス
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
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースは各フェーズの所要時間を
stderr に書き込み、JSON 出力を解析可能な状態に保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、`openclaw.json` は変更できません。`install`、`update`、`uninstall`、`enable`、`disable` はすべて実行を拒否します。代わりに、このインストールの Nix ソース（nix-openclaw の `programs.openclaw.config` または `instances.<name>.config`）を編集してから、再ビルドしてください。エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を参照してください。
</Note>

<Note>
同梱 plugins は OpenClaw とともに提供されます。一部はデフォルトで有効です（同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー Plugin など）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw plugins には、インライン JSON Schema（空の場合も `configSchema`）を含む `openclaw.plugin.json` が付属します。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な一覧/info 出力には、検出されたバンドル機能に加えて、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）も表示されます。
</Note>

## 作成

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` はデフォルトで最小限の TypeScript ツール Plugin を作成します。最初の
引数は Plugin ID で、`--name` は表示名を設定します。OpenClaw はこの
ID をデフォルトの出力ディレクトリとパッケージ名に使用します。ツールのスキャフォールドは
`defineToolPlugin` を使用し、ビルド後に `openclaw plugins build`/`validate` を呼び出す
`package.json` スクリプト `plugin:build` と `plugin:validate` を生成します。

`plugins build` はビルド済みエントリをインポートし、その静的ツールメタデータを読み取り、
`openclaw.plugin.json` を書き込み、`package.json` の `openclaw.extensions` との整合性を維持します。
`plugins validate` は、生成されたマニフェスト、パッケージメタデータ、現在のエントリの
エクスポートが引き続き一致していることを確認します。作成ワークフロー全体については、
[ツール Plugins](/ja-JP/plugins/tool-plugins)を参照してください。

スキャフォールドは TypeScript ソースを書き込みますが、ビルド済みの
`./dist/index.js` エントリからメタデータを生成するため、このワークフローは公開済み CLI でも機能します。
エントリがデフォルトのパッケージエントリでない場合は `--entry <path>` を使用します。
CI では `plugins build --check` を使用すると、ファイルを書き換えずに生成済みメタデータが古い場合に
失敗させることができます。

### プロバイダーのスキャフォールド

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

プロバイダーのスキャフォールドは、API キー認証の仕組み、`clawhub package validate` を実行する
`npm run validate` スクリプト、ClawHub パッケージメタデータ、および将来 GitHub
OIDC 経由で信頼された公開を行うための手動実行 GitHub Actions ワークフローを備えた、
汎用の OpenAI 互換モデルプロバイダー Plugin を作成します。プロバイダーのスキャフォールドは
Skills を生成せず、`openclaw plugins build`/`validate` も使用しません。これらのコマンドは、
ツールスキャフォールドの生成メタデータ用パスで使用します。

公開前に、プレースホルダーの API ベース URL、モデルカタログ、ドキュメントルート、
認証情報のテキスト、README の文面を実際のプロバイダー情報に置き換えてください。
初回の ClawHub 公開と信頼された公開者の設定には、生成された README を使用します。

## インストール

```bash
openclaw plugins search "calendar"                      # ClawHub plugins を検索
openclaw plugins install @openclaw/<package>            # 信頼済み公式カタログ
openclaw plugins install <package>                       # 任意の npm パッケージ
openclaw plugins install clawhub:<package>                # ClawHub のみ
openclaw plugins install npm:<package>                    # npm のみ
openclaw plugins install npm-pack:<path.tgz>               # ローカル npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git リポジトリ
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # ローカルパスまたはアーカイブ
openclaw plugins install -l <path>                         # コピーせずリンク
openclaw plugins install <plugin>@<marketplace>             # マーケットプレイスの省略表記
openclaw plugins install <plugin> --marketplace <name>      # マーケットプレイス（明示指定）
openclaw plugins install <package> --force                  # ソースを確認／既存を上書き
openclaw plugins install <package> --pin                    # 解決済み npm バージョンを固定
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

セットアップ時のインストールをテストするメンテナーは、保護された環境変数を使用して
Plugin の自動インストール元を上書きできます。
[Plugin インストールの上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
ローンチ移行期間中、修飾なしのパッケージ名はデフォルトで npm からインストールされます。ただし、同梱または公式 Plugin ID と一致する場合、OpenClaw は npm レジストリにアクセスせず、そのローカル／公式コピーを使用します。外部 npm パッケージを意図的に使用する場合は `npm:<package>` を使用してください。ClawHub には `clawhub:<package>` を使用してください。Plugin のインストールはコードの実行と同様に扱い、固定バージョンを優先してください。
</Warning>

<Warning>
ClawHub パッケージと OpenClaw の同梱／公式カタログは、信頼されたインストール元です。新しい任意の npm、`npm-pack:`、git、ローカルパス／アーカイブ、またはマーケットプレイスのソースでは、警告が表示され、続行前に確認が求められます。非対話型で任意のソースからインストールする場合は、ソースを確認して信頼した後に `--force` を渡す必要があります。同じフラグは、必要に応じて既存のインストール先も上書きします。すでに追跡されているインストールの通常の更新には必要ありません。この確認は、危険性のある ClawHub リリースの信頼警告にのみ適用される `--acknowledge-clawhub-risk` とは別です。`--force` は `security.installPolicy` や残りのインストール安全性チェックを回避しません。
</Warning>

`plugins search` は、インストール可能な `code-plugin` および
`bundle-plugin` パッケージを ClawHub で検索します（Skills は対象外です。それらには `openclaw skills search` を使用します）。
デフォルトの `--limit` は 20、上限は 100 です。リモートカタログを読み取るだけで、
ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムの
読み込みは行いません。結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、
概要、および `openclaw plugins install clawhub:<package>` のようなインストール方法のヒントが含まれます。

<Note>
ClawHub は、ほとんどの plugins における主要な配布および検出先です。npm は、
サポート対象のフォールバックおよび直接インストール経路として引き続き利用できます。OpenClaw が所有する
`@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw)または
[Plugin 一覧](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールでは `latest` を使用します。
ベータチャネルのインストールと更新では、利用可能な場合は npm の `beta` dist-tag を優先し、
利用できない場合は `latest` にフォールバックします。延長安定版チャネルでは、修飾なし／デフォルトまたは
`latest` を意図した公式 npm plugins は、インストール済みコアの正確なバージョンに解決されます。
正確な固定バージョン、明示的な非 `latest` タグ、サードパーティーパッケージ、
npm 以外のソースは書き換えられません。
</Note>

<AccordionGroup>
  <Accordion title="設定のインクルードと無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって提供されている場合、`plugins install/update/enable/disable/uninstall` はそのインクルードファイルに書き込み、`openclaw.json` は変更しません。ルートのインクルード、インクルード配列、兄弟オーバーライドを伴うインクルードは、フラット化せずフェイルクローズします。サポートされる形式については、[設定のインクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常フェイルクローズし、先に `openclaw doctor --fix` を実行するよう通知します。Gateway の起動時とホットリロード時には、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されているインストール時の唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` を明示的にオプトインした plugins 向けの限定的な同梱 Plugin 復旧経路です。

  </Accordion>
  <Accordion title="--force による確認と再インストール／更新の違い">
    `--force` は、プロンプトを表示せずに ClawHub 以外のソースを確認します。`security.installPolicy` や残りのインストール安全性チェックは回避しません。Plugin またはフックパックがすでにインストールされている場合は、既存のインストール先を再利用し、その場で上書きします。任意の npm、ローカル、アーカイブ、git、またはマーケットプレイスのソースを確認した後、あるいは同じ ID を意図的に再インストールする場合に使用してください。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin ID に対して `plugins install` を実行すると、OpenClaw は処理を停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きする場合には `plugins install <package> --force` を案内します。任意のソースでは引き続き対話形式の出所警告が表示されます。非対話型インストールでは、確認後に `--force` を渡す必要があります。信頼された ClawHub および OpenClaw カタログのソースでは不要です。`--link` を使用した場合、`--force` はソースを確認しますが、リンクパスのインストールモードは変更しません。

  </Accordion>
  <Accordion title="--pin の適用範囲">
    `--pin` は npm インストールにのみ適用され、解決された正確な `<name>@<version>` を記録します。`git:` によるインストールではサポートされません（代わりに、`git:github.com/acme/plugin@v1.2.3` のように仕様内で ref を固定してください）。また、`--marketplace` でもサポートされません（マーケットプレイスのインストールでは、npm 仕様の代わりにマーケットプレイスのソースメタデータが保持されます）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は非推奨であり、現在は何も行いません。OpenClaw は Plugin のインストール時に組み込みの危険コードブロックを実行しなくなりました。

    ホスト固有のインストールポリシーが必要な場合は、オペレーターが管理する `security.installPolicy` サーフェスを使用します。Plugin の `before_install` フックは、Plugin ランタイムのライフサイクルフックであり、CLI インストールの主要なポリシー境界ではありません。

    ClawHub で公開した Plugin がレジストリスキャンによって非表示またはブロックされた場合は、[ClawHub での公開](/ja-JP/clawhub/publishing)に記載された公開者向け手順を使用します。`--dangerously-force-unsafe-install` は、Plugin の再スキャンや、ブロックされたリリースの公開を ClawHub に要求するものではありません。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    コミュニティの ClawHub インストールでは、ダウンロード前に選択したリリースの信頼記録が確認されます。ClawHub がそのリリースのダウンロードを無効化している場合、悪意のあるスキャン結果を報告している場合、またはリリースをブロック対象のモデレーション状態（隔離、失効）にしている場合、このフラグに関係なく OpenClaw はそのリリースを無条件に拒否します。ブロック対象ではない危険なスキャンステータスまたはモデレーション状態の場合、OpenClaw は信頼性の詳細を表示し、続行前に確認を求めます。

    `--acknowledge-clawhub-risk` は、ClawHub の警告を確認し、対話型プロンプトなしで続行すると判断した後にのみ使用します。保留中または古い（まだクリーンではない）スキャン結果では警告が表示されますが、確認は必要ありません。ClawHub の公式パッケージと OpenClaw にバンドルされた Plugin ソースでは、このリリース信頼性チェックが完全に省略されます。

  </Accordion>
  <Accordion title="フックパックと npm 仕様">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージのインストールではなく、フィルタリングされたフックの表示とフックごとの有効化には `openclaw hooks` を使用します。

    npm 仕様は**レジストリのみ**です（パッケージ名に加え、オプションで**完全一致バージョン**または **dist-tag**）。Git、URL、ファイル仕様、および semver 範囲は拒否されます。依存関係のインストールは、安全性のため、シェルにグローバルな npm インストール設定がある場合でも、Plugin ごとに `--ignore-scripts` を使用する単一の管理対象 npm プロジェクトで実行されます。管理対象 Plugin の npm プロジェクトは、OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホストのセキュリティ固定設定はホイストされた Plugin 依存関係にも適用されます。

    npm 解決を明示するには `npm:<package>` を使用します。裸のパッケージ仕様も、公式 Plugin ID と一致しない限り、ローンチ切り替え期間中は npm から直接インストールされます。

    バンドル済み Plugin と一致する未加工の `@openclaw/*` 仕様は、npm フォールバックより先に、イメージが所有するバンドル済みコピーへ解決されます。たとえば、`openclaw plugins install @openclaw/discord@2026.5.20 --pin` は管理対象 npm オーバーライドを作成せず、現在の OpenClaw ビルドにバンドルされた Discord Plugin を使用します。外部の npm パッケージを強制的に使用するには、`openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` を使用します。

    裸の仕様と `@latest` は、安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版として扱われます。npm がいずれかの形式をプレリリースへ解決した場合、OpenClaw は停止し、プレリリースタグ（`@beta`/`@rc`）または完全一致のプレリリースバージョン（`@1.2.3-beta.4`）を使用して明示的にオプトインするよう求めます。

    完全一致バージョンを指定しない npm インストール（`npm:<package>` または `npm:<package>@latest`）では、OpenClaw はインストール前に解決されたパッケージメタデータを確認します。最新の安定版パッケージが、より新しい OpenClaw Plugin API またはホストの最小バージョンを必要とする場合、OpenClaw は以前の安定版を調べ、互換性のある最新リリースを代わりにインストールします。完全一致バージョンと明示的な dist-tag は厳密に扱われます。互換性のない選択は失敗し、OpenClaw をアップグレードするか、互換性のあるバージョンを選択するよう求められます。

    裸のインストール仕様が公式 Plugin ID（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同名の npm パッケージをインストールするには、明示的なスコープ付き仕様（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git リポジトリ">
    Git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式は、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL です。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールでは、一時ディレクトリへクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。そのため、マニフェスト検証、オペレーターのインストールポリシー、パッケージマネージャーによるインストール処理、およびインストール記録は npm インストールと同様に動作します。記録される Git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後からソースを再解決できます。

    Git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、Gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` を使用して CLI ルートを登録している場合は、そのコマンドを OpenClaw のルート CLI から直接実行します。たとえば `openclaw demo-plugin ping` です。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブは、`.zip`、`.tgz`、`.tar.gz`、`.tar` です。ネイティブ OpenClaw Plugin のアーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` のみを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball で、レジストリインストールと同じ
    Plugin ごとの管理対象 npm プロジェクトパスを使用する場合は、`npm-pack:<path.tgz>` を使用します。
    これには、`package-lock.json` の検証、ホイストされた依存関係のスキャン、
    npm インストール記録が含まれます。通常のアーカイブパスは、引き続き Plugin の
    extensions ルート配下にローカルアーカイブとしてインストールされます。

    Claude マーケットプレイスからのインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm で安全に使用できる裸の Plugin 仕様は、公式 Plugin ID と一致しない限り、ローンチ切り替え期間中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公開されている Plugin API／Gateway の最小互換性を確認します。選択した ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub のダイジェストヘッダーとアーティファクトのダイジェストを検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータがない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証パスを通じてインストールされます。記録されたインストールには、後の更新に備えて、ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、および ClawPack ダイジェスト情報が保持されます。
バージョンなしの ClawHub インストールでは、`openclaw plugins update` がより新しい ClawHub リリースを追跡できるよう、バージョンなしの仕様が記録されます。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままになります。

### マーケットプレイスの短縮表記

マーケットプレイス名が `~/.claude/plugins/known_marketplaces.json` にある Claude のローカルレジストリキャッシュに存在する場合は、`plugin@marketplace` の短縮表記を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

マーケットプレイスソースを明示的に渡すには `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知のマーケットプレイス名
    - ローカルのマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリの短縮表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - Git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または Git から読み込まれたリモートマーケットプレイスでは、Plugin エントリがクローンされたマーケットプレイスリポジトリ内に収まっている必要があります。OpenClaw は、そのリポジトリからの相対パスソースを受け入れ、リモートマニフェストにある HTTP(S)、絶対パス、Git、GitHub、およびその他のパス以外の Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json`、またはそのマニフェストファイルがない場合はデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

管理対象のローカルインストールは、Plugin ディレクトリまたはアーカイブである必要があります。単独の `.js`、
`.mjs`、`.cjs`、および `.ts` Plugin ファイルは、`plugins install` によって管理対象 Plugin
ルートへコピーされず、`~/.openclaw/extensions` または `<workspace>/.openclaw/extensions` に直接配置しても
読み込まれません。これらの自動検出ルートは Plugin パッケージまたはバンドルディレクトリを読み込み、
トップレベルのスクリプトファイルをローカルヘルパーとしてスキップします。代わりに、単独ファイルを
`plugins.load.paths` に明示的に列挙します。

<Note>
互換バンドルは通常の Plugin ルートへインストールされ、同じ一覧表示／情報表示／有効化／無効化フローに含まれます。現在、バンドルの Skills、Claude のコマンド Skills、Claude の `settings.json` デフォルト、Claude の `.lsp.json`／マニフェストで宣言された `lspServers` デフォルト、Cursor のコマンド Skills、および互換性のある Codex フックディレクトリがサポートされています。検出されたその他のバンドル機能は診断／情報に表示されますが、ランタイム実行にはまだ接続されていません。
</Note>

ローカル Plugin ディレクトリをコピーせずに指定するには、`-l`/`--link` を使用します
（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

`--link` は `--marketplace` または `git:` のインストールではサポートされておらず、
すでに存在するローカルパスが必要です。非対話型のローカルリンクでは、ソースを確認した後に
`--force` を渡します。これは出所を確認しますが、リンク先ディレクトリを
コピーまたは上書きしません。

<Note>
ワークスペースの extensions ルートから検出されたワークスペース由来の Plugin は、
明示的に有効化されるまでインポートも実行もされません。ローカル開発では、
`openclaw plugins enable <plugin-id>` を実行するか、
`plugins.entries.<plugin-id>.enabled: true` を設定します。設定で
`plugins.allow` を使用している場合は、同じ Plugin ID もそこに含めます。このフェイルクローズ規則は、
チャンネル設定がセットアップ専用の読み込み対象としてワークスペース由来の Plugin を明示的に指定した場合にも
適用されます。そのため、そのワークスペース Plugin が無効なまま、または許可リストから除外されたままでは、
ローカルチャンネル Plugin のセットアップコードは実行されません。リンクされたインストールと
明示的な `plugins.load.paths` エントリには、解決された Plugin の出所に応じた
通常のポリシーが適用されます。
[Plugin ポリシーの設定](/ja-JP/tools/plugin#configure-plugin-policy)
および[設定リファレンス](/ja-JP/gateway/configuration-reference#plugins)を参照してください。

npm インストールで `--pin` を使用すると、デフォルトの固定されない動作を維持しながら、解決された完全一致仕様（`name@version`）を管理対象 Plugin インデックスに保存できます。
</Note>

## 一覧表示

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
  テーブル表示から、形式／ソース／出所／バージョン／アクティベーションのメタデータを含む Plugin ごとの詳細行へ切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加え、レジストリ診断とパッケージ依存関係のインストール状態を表示します。
</ParamField>

<Note>
`plugins list` は、まず永続化されたローカル Plugin レジストリを読み取り、レジストリが存在しないか無効な場合は、マニフェストのみから派生したフォールバックを使用します。これは、Plugin がインストール済みで有効になっており、コールドスタート計画から認識可能かどうかを確認する場合に役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin のコード、有効化状態、フックポリシー、または `plugins.load.paths` を変更した後、新しい `register(api)` のコードまたはフックが実行されることを期待する前に、そのチャネルを提供する Gateway を再起動してください。リモート／コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、各 Plugin の `dependencyStatus`（`package.json`
`dependencies` および `optionalDependencies` から取得）が含まれます。OpenClaw は、それらのパッケージ名が
Plugin の通常の Node `node_modules` 検索パス上に存在するかどうかを確認します。
Plugin のランタイムコードをインポートしたり、パッケージマネージャーを実行したり、不足している
依存関係を修復したりすることはありません。
</Note>

起動ログに `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` が記録された場合は、
`openclaw plugins list --enabled --verbose` または
`openclaw plugins inspect <id>` を一覧にある Plugin ID とともに実行して Plugin
ID を確認し、信頼できる ID を `openclaw.json` の `plugins.allow` にコピーしてください。警告に
検出されたすべての Plugin を一覧表示できる場合は、それらの ID がすでに含まれた、そのまま貼り付け可能な
`plugins.allow` スニペットが出力されます。Plugin がインストール元／ロードパスの来歴なしで
読み込まれる場合は、その Plugin ID を調査し、信頼できる ID を
`plugins.allow` に固定するか、信頼できるソースから Plugin を再インストールして、
OpenClaw がインストール元の来歴を記録できるようにしてください。

パッケージ化された Docker イメージ内でバンドル済み Plugin を扱う場合は、
Plugin のソースディレクトリを、対応するパッケージ内のソースパス（例:
`/app/extensions/synology-chat`）にバインドマウントしてください。OpenClaw は、マウントされたソースオーバーレイを
`/app/dist/extensions/synology-chat` より先に検出します。単にコピーしたソースディレクトリは
機能しないため、通常のパッケージインストールでは引き続きコンパイル済みの dist が使用されます。

ランタイムフックをデバッグする場合:

- `openclaw plugins inspect <id> --runtime --json` は、モジュールをロードする検査パスから、登録済みフックと診断情報を表示します。ランタイム検査で依存関係がインストールされることはありません。従来の依存関係の状態をクリーンアップするか、設定から参照されているものの欠落しているダウンロード可能な Plugin を復旧するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway の URL／プロファイル、サービス／プロセスのヒント、設定パス、RPC の正常性を確認します。
- バンドルされていない会話フック（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

### Plugin インデックス

Plugin のインストールメタデータはマシンが管理する状態であり、ユーザー設定ではありません。インストールと更新では、アクティブな OpenClaw 状態ディレクトリ配下の共有 SQLite 状態データベースに書き込まれます。`installed_plugin_index` 行には、破損または欠落した Plugin マニフェストのレコードを含む永続的な `installRecords` メタデータと、`openclaw plugins update`、アンインストール、診断、およびコールド Plugin レジストリで使用される、マニフェストから派生したコールドレジストリキャッシュが格納されます。

OpenClaw が設定内でリリース済みの従来の `plugins.installs` レコードを検出した場合、ランタイムの読み取りでは、`openclaw.json` を書き換えずに互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、それらのレコードを Plugin インデックスに移動し、設定の書き込みが許可されている場合は設定キーを削除します。いずれかの書き込みが失敗した場合は、インストールメタデータが失われないように設定レコードが保持されます。

## アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` は、`plugins.entries`、永続化された Plugin インデックス、Plugin の許可／拒否リストのエントリ、および該当する場合はリンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールでは追跡対象の管理インストールディレクトリも削除されますが、それが OpenClaw の Plugin extensions ルート内に解決される場合に限られます。Plugin が現在 `memory` または `contextEngine` スロットを所有している場合、そのスロットはデフォルト（メモリでは `memory-core`、コンテキストエンジンでは `legacy`）にリセットされます。

`uninstall` は削除対象のプレビューを表示し、変更を加える前に `Uninstall plugin "<id>"?` と確認を求めます。確認プロンプトを省略するには `--force` を渡してください（スクリプトや非対話実行に便利です）。これを指定しない場合、アンインストールには対話型 TTY が必要です。`--dry-run` は同じプレビューを表示し、確認を求めたり何かを変更したりせずに終了します。

<Note>
`--keep-config` は、`--keep-files` の非推奨エイリアスとしてサポートされています。
</Note>

## 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理対象の Plugin インデックスで追跡されている Plugin インストールと、`hooks.internal.installs` で追跡されているフックパックのインストールに適用されます。Plugin のインストール時にユーザーがすでに選択したソースを再利用するため、ソースを再度承認する必要はありません。

<AccordionGroup>
  <Accordion title="Plugin ID と npm spec の解決">
    Plugin ID を渡すと、OpenClaw はその Plugin に記録されているインストール spec を再利用します。つまり、`@beta` など、以前に保存された dist-tag と正確に固定されたバージョンは、以降の `update <id>` 実行でも引き続き使用されます。

    `update <id> --dry-run` の実行中、正確に固定された npm インストールは固定されたままです。OpenClaw がパッケージのレジストリのデフォルトラインも解決でき、そのデフォルトラインがインストール済みの固定バージョンより新しい場合、ドライランでは固定状態を報告し、レジストリのデフォルトラインに追従するための明示的な `@latest` パッケージ更新コマンドを出力します。

    この対象指定更新のルールは、一括 `openclaw plugins update --all` メンテナンスパスとは異なります。一括更新でも通常の追跡対象インストール spec は尊重されますが、信頼できる公式 OpenClaw Plugin レコードは、古い正確な公式パッケージに留まるのではなく、現在の公式カタログのターゲットに同期できます。正確な、またはタグ付きの公式 spec を意図的に変更せず保持する場合は、対象を指定した `update <id>` を使用してください。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw は、そのパッケージ名を追跡対象の Plugin レコードに逆解決し、そのインストール済み Plugin を更新して、今後の ID ベースの更新用に新しい npm spec を記録します。

    バージョンまたはタグなしで npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに逆解決されます。Plugin が正確なバージョンに固定されており、レジストリのデフォルトリリースラインに戻したい場合に使用してください。

  </Accordion>
  <Accordion title="ベータチャネルの更新">
    対象を指定した `openclaw plugins update <id-or-npm-spec>` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。一括 `openclaw plugins update --all` は、信頼できる公式 Plugin レコードを公式カタログのターゲットに同期する際に、設定された `update.channel` を使用します。これにより、ベータチャネルのインストールは、暗黙に stable/latest に正規化されるのではなく、ベータリリースラインに留まることができます。

    `openclaw update` は、アクティブな OpenClaw 更新チャネルも認識します。ベータチャネルでは、デフォルトラインの npm および ClawHub Plugin レコードは、最初に `@beta` を試します。Plugin のベータリリースが存在しない場合は、記録済みの default/latest spec にフォールバックします。npm Plugin は、ベータパッケージが存在していてもインストール検証に失敗した場合にもフォールバックします。このフォールバックは警告として報告され、コアの更新を失敗させません。正確なバージョンと明示的なタグは、対象指定更新ではそのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    npm のライブ更新前に、OpenClaw はインストール済みパッケージのバージョンを npm レジストリのメタデータと照合します。インストール済みバージョンと記録済みアーティファクトの識別情報が、解決されたターゲットとすでに一致している場合、ダウンロード、再インストール、または `openclaw.json` の書き換えを行わずに更新をスキップします。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変化した場合、OpenClaw はそれを npm アーティファクトのドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを出力し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な続行ポリシーを指定しない限り、安全側に倒して失敗します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は互換性のため `plugins update` でも受け付けられますが、非推奨であり、Plugin の更新動作には影響しなくなりました。オペレーターの `security.installPolicy` は引き続き更新をブロックできます。Plugin の `before_install` フックは、Plugin フックがロードされているプロセスでのみ適用されます。
  </Accordion>
  <Accordion title="更新時の --acknowledge-clawhub-risk">
    コミュニティの ClawHub を使用する Plugin の更新では、置換パッケージをダウンロードする前に、インストール時と同じ正確なリリースの信頼性チェックを実行します。選択した ClawHub リリースにリスクのある信頼性警告がある場合でも続行する、レビュー済みの自動化には `--acknowledge-clawhub-risk` を使用してください。公式 ClawHub パッケージとバンドル済み OpenClaw Plugin ソースでは、このリリース信頼性プロンプトは省略されます。
  </Accordion>
</AccordionGroup>

## 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

検査では、デフォルトでは Plugin ランタイムをインポートせずに、識別情報、ロード状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバーのサポートを表示します。JSON 出力には、`contracts.agentToolResultMiddleware` や `contracts.trustedToolPolicies` などの Plugin マニフェスト契約が含まれるため、オペレーターは Plugin を有効化または再起動する前に、信頼対象範囲の宣言を監査できます。`--runtime` を追加すると Plugin モジュールをロードし、登録済みのフック、ツール、コマンド、サービス、Gateway メソッド、および HTTP ルートを含めます。ランタイム検査では、不足している Plugin の依存関係が直接報告されます。インストールと修復は、引き続き `openclaw plugins install`、`openclaw plugins update`、および `openclaw doctor --fix` で行います。

Plugin が所有する CLI コマンドは通常、ルートの `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` などのコア親コマンド配下にネストしたコマンドを登録することもできます。`inspect --runtime` によって `cliCommands` 配下のコマンドが表示されたら、一覧に記載されたパスで実行してください。たとえば、`demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容に基づいて分類されます。

| 形状                | 意味                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 機能タイプが正確に 1 つ（例: プロバイダー専用 Plugin）            |
| `hybrid-capability` | 複数の機能タイプ（例: テキスト + 音声 + 画像）                    |
| `hook-only`         | フックのみで、機能、ツール、コマンド、サービス、ルートはなし      |
| `non-capability`    | ツール／コマンド／サービスはあるが機能はなし                      |

機能モデルの詳細については、[Plugin の形状](/ja-JP/plugins/architecture#plugin-shapes)を参照してください。

<Note>
`--json` フラグは、スクリプト作成や監査に適した機械可読レポートを出力します。`inspect --all` は、形状、機能の種類、互換性通知、バンドル機能、フック概要の各列を含む、フリート全体の表を表示します。`info` は `inspect` のエイリアスです。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin の読み込みエラー、マニフェスト／検出の診断、互換性に関する通知、Plugin スロットの欠落などの古い Plugin 設定参照を報告します。インストールツリーと Plugin 設定に問題がない場合は、`No plugin issues detected.` と表示されます。古い設定が残っているものの、インストールツリーのほかの部分が正常な場合は、Plugin が完全に正常であるかのように示すのではなく、その旨が概要に表示されます。

設定済みの Plugin がディスク上に存在していても、ローダーのパス安全性チェックによってブロックされている場合、設定検証では Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` の設定を削除するのではなく、パスの所有権や誰でも書き込み可能な権限など、直前に示されたブロック対象 Plugin の診断を修正してください。

`register`/`activate` エクスポートの欠落など、モジュール形式のエラーについては、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力に簡潔なエクスポート形式の概要が含まれます。

## レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の識別情報、有効化状態、ソースメタデータ、コントリビューションの所有権を保持する、OpenClaw の永続化されたコールドリードモデルです。通常の起動、プロバイダー所有者の検索、チャンネル設定の分類、Plugin インベントリでは、Plugin のランタイムモジュールをインポートせずにこのレジストリを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古くなっているかを確認します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト／パッケージのメタデータから再構築できます。これは修復用の経路であり、ランタイムを有効化する経路ではありません。

`openclaw doctor --fix` は、レジストリ周辺で管理される npm の不整合も修復します。管理対象 Plugin の npm プロジェクト、または従来のフラットな管理対象 npm ルートの下にある孤立した、もしくは復元された `@openclaw/*` パッケージがバンドル済み Plugin を覆い隠している場合、doctor はその古いパッケージを削除し、起動時にバンドル済みマニフェストに対して検証されるようレジストリを再構築します。また doctor は、`peerDependencies.openclaw` を宣言する管理対象 npm Plugin にホストの `openclaw` パッケージを再リンクし、更新または npm 修復後も `openclaw/plugin-sdk/*` などのパッケージローカルなランタイムインポートが解決されるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリの読み取りエラーに対する非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を使用してください。環境変数によるフォールバックは、移行の展開中に起動を緊急復旧する場合にのみ使用します。
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

`plugins marketplace entries` は、設定された OpenClaw マーケットプレイスフィードのエントリを一覧表示します。デフォルトではホストされたフィードの取得を試み、失敗した場合は、最後に受け入れられたスナップショットまたはバンドル済みデータにフォールバックします。特定の設定済みプロファイルを読み取るには `--feed-profile <name>`、明示的なホスト済みフィード URL を読み取るには `--feed-url <url>`、フィードを取得せずに最後に受け入れられたスナップショットを読み取るには `--offline` を使用します。

`plugins marketplace refresh` は、設定されたホスト済みフィードのスナップショットを更新し、OpenClaw がホスト済みデータ、ホスト済みスナップショット、バンドル済みフォールバックデータのいずれを受け入れたかを報告します。新しいホスト済みペイロードが固定されたチェックサムと一致しない限りコマンドを失敗させる必要がある場合は、`--expected-sha256` を使用します。

マーケットプレイスの `list` は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加え、解析済みのマーケットプレイスマニフェストと Plugin エントリを表示します。

マーケットプレイスの更新では、ホストされた OpenClaw マーケットプレイスフィードを読み込み、
検証済みのレスポンスをローカルのホスト済みフィードスナップショットとして永続化します。オプションを指定しない場合は、
設定されたデフォルトのフィードプロファイルを使用します。特定の設定済みプロファイルを更新するには
`--feed-profile <name>`、明示的なホスト済みフィード URL を更新するには `--feed-url <url>`、
一致するペイロードチェックサム（`sha256:<hex>` または 64 文字の 16 進ダイジェストのみ）を必須にするには
`--expected-sha256 <sha256>`、機械可読出力には `--json` を使用します。
明示的なホスト済みフィード URL に認証情報、クエリ文字列、フラグメントを含めてはなりません。
固定されていない更新では、コマンドを失敗させることなく、ホスト済みスナップショットまたは
バンドル済みフォールバックの結果が報告される場合があります。固定された更新は、新しいホスト済みペイロードが
受け入れられない限り失敗します。また、ホスト済みデータの更新に成功しても、OpenClaw が検証済みスナップショットを
永続化できない場合は失敗します。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/clawhub)
