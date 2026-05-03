---
read_when:
    - Gateway Pluginまたは互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:29:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway の Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin を管理する" href="/ja-JP/plugins/manage-plugins">
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
```

低速なインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を指定してコマンドを実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能なまま保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin には、インライン JSON Schema（空であっても `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と、検出されたバンドル機能も表示されます。
</Note>

### インストール

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
起動移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。Plugin のインストールはコードを実行するものとして扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、インストールに使えるパッケージ名を出力します。検索対象はコード Plugin パッケージとバンドル Plugin パッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの Plugin にとって主要な配布および発見サーフェスです。Npm は、サポートされるフォールバックおよび直接インストール経路として残ります。OpenClaw 所有の `@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールは `latest` を使用します。ベータチャネルのインストールと更新では、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定 include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include されたファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟オーバーライドを持つ include は、フラット化される代わりに安全側で失敗します。サポートされる形については[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常、安全側で失敗し、先に `openclaw doctor --fix` を実行するよう指示します。Gateway の起動およびホットリロード中は、無効な Plugin 設定は他の無効な設定と同様に安全側で失敗します。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインする Plugin 向けの、限定的なバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ ID を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用してください。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin ID に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、本当に現在のインストールを別ソースから上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされません。marketplace インストールは npm spec ではなく marketplace ソースメタデータを保持するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告した場合でもインストールを続行できますが、Plugin の `before_install` フックポリシーブロックはバイパスせず、スキャン失敗もバイパスしません。

    この CLI フラグは Plugin のインストール/更新フローに適用されます。Gateway を介した skill 依存関係のインストールでは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub skill ダウンロード/インストールフローのままです。

    ClawHub で公開した Plugin がレジストリスキャンでブロックされる場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージインストールではなく、フィルタリングされたフック表示とフックごとの有効化には `openclaw hooks` を使用してください。

    Npm spec は **レジストリのみ**（パッケージ名 + 任意の **正確なバージョン** または **dist-tag**）です。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールは、安全のため `--ignore-scripts` を指定してプロジェクトローカルで実行されます。シェルにグローバル npm インストール設定がある場合でも同様です。

    npm 解決を明示したい場合は `npm:<package>` を使用してください。起動移行期間中は、裸のパッケージ spec も npm から直接インストールされます。

    裸の spec と `@latest` は安定版トラックに留まります。npm がそのどちらかを prerelease に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease タグまたは `@1.2.3-beta.4` のような正確な prerelease バージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 Plugin ID（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、gateway メソッドや CLI コマンドなどのランタイム登録を確認するために `openclaw plugins inspect <id> --runtime --json` を使用してください。Plugin が `api.registerCli` で CLI ルートを登録した場合は、たとえば `openclaw demo-plugin ping` のように、そのコマンドを OpenClaw ルート CLI から直接実行します。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

起動移行期間中、裸の npm セーフな Plugin spec はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、広告されている Plugin API / 最小 gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパス経由でインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証パス経由で引き続きインストールされます。記録されたインストールには、後続の更新のために、ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報が保持されます。
バージョン指定のない ClawHub インストールでは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるよう、バージョン指定のない記録 spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### Marketplace 省略記法

marketplace 名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace ソースを明示的に渡したい場合は `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスのソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルのマーケットプレイスルート、または `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略形
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、plugin エントリはクローンされたマーケットプレイスリポジトリ内に収まっている必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェストからの HTTP(S)、絶対パス、git、GitHub、およびその他の非パス plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw plugins (`openclaw.plugin.json`)
- Codex 互換バンドル (`.codex-plugin/plugin.json`)
- Claude 互換バンドル (`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト)
- Cursor 互換バンドル (`.cursor-plugin/plugin.json`)

<Note>
互換バンドルは通常の plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、および互換 Codex hook ディレクトリがサポートされています。他の検出済みバンドル機能は diagnostics/info に表示されますが、まだ runtime 実行には接続されていません。
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
  有効な plugins のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブル表示から、source/origin/version/activation メタデータを含む plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに、registry diagnostics とパッケージ依存関係のインストール状態を加えたものです。
</ParamField>

<Note>
`plugins list` は、まず永続化されたローカル plugin registry を読み込みます。registry が見つからない、または無効な場合は、manifest のみから派生したフォールバックを使います。plugin がインストール済み、有効、かつ cold startup planning から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブ runtime probe ではありません。plugin コード、有効化、hook policy、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードまたは hooks の実行を期待する前に、その channel を提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から得た各 plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が plugin の通常の Node `node_modules` 参照パス上に存在するかを確認します。plugin runtime コードの import、パッケージマネージャーの実行、欠落した依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、config の変更、パッケージのインストール、plugin runtime コードの読み込みは行いません。検索結果には、ClawHub パッケージ名、family、channel、version、summary、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内で bundled plugin 作業を行う場合は、plugin ソースディレクトリを対応するパッケージ化済みソースパス、たとえば `/app/extensions/synology-chat` に bind-mount してください。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソース overlay を検出します。単純にコピーされたソースディレクトリは inert のままなので、通常のパッケージ化済みインストールでは引き続きコンパイル済み dist が使われます。

runtime hook デバッグの場合:

- `openclaw plugins inspect <id> --runtime --json` は、モジュールを読み込む inspection pass から登録済み hooks と diagnostics を表示します。Runtime inspection は依存関係をインストールしません。legacy dependency state のクリーンアップ、または欠落している設定済み downloadable plugins のインストールには `openclaw doctor --fix` を使ってください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、service/process hints、config path、RPC health を確認します。
- 非 bundled conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使います (`plugins.load.paths` に追加します)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
linked installs は managed install target に上書きコピーするのではなく source path を再利用するため、`--force` は `--link` と併用できません。

npm installs で `--pin` を使うと、デフォルトの非固定動作を維持しつつ、解決された正確な spec (`name@version`) を managed plugin index に保存できます。
</Note>

### Plugin インデックス

Plugin install metadata はユーザー config ではなく、機械管理の状態です。Installs と updates は、それを active OpenClaw state directory 配下の `plugins/installs.json` に書き込みます。最上位の `installRecords` map は、壊れた、または欠落した plugin manifests の records も含む、install metadata の永続的な source です。`plugins` array は manifest から派生した cold registry cache です。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、uninstall、diagnostics、および cold plugin registry に使われます。

OpenClaw が config 内の出荷済み legacy `plugins.installs` records を見つけると、それらを plugin index に移動して config key を削除します。どちらかの書き込みが失敗した場合、install metadata が失われないように config records は保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された plugin index、plugin allow/deny list entries、および linked `plugins.load.paths` entries から plugin records を削除します。`--keep-files` が設定されていない限り、uninstall は、OpenClaw の plugin extensions root 内にある追跡対象の managed install directory も削除します。active memory plugins の場合、memory slot は `memory-core` にリセットされます。

<Note>
`--keep-config` は `--keep-files` の非推奨 alias としてサポートされています。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates は、managed plugin index 内の追跡対象 plugin installs と、`hooks.internal.installs` 内の追跡対象 hook-pack installs に適用されます。

<AccordionGroup>
  <Accordion title="plugin id と npm spec の解決">
    plugin id を渡すと、OpenClaw はその plugin に記録されている install spec を再利用します。つまり、以前に保存された `@beta` のような dist-tags や正確に固定された versions は、後続の `update <id>` 実行でも引き続き使われます。

    npm installs では、dist-tag または正確な version を含む明示的な npm package spec を渡すこともできます。OpenClaw はその package name を追跡対象 plugin record に解決し直し、そのインストール済み plugin を更新して、将来の id-based updates 用に新しい npm spec を記録します。

    version または tag なしで npm package name を渡した場合も、追跡対象 plugin record に解決し直されます。plugin が正確な version に固定されていて、registry のデフォルト release line に戻したい場合に使います。

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象 plugin spec を再利用します。`openclaw update` はさらに active OpenClaw update channel を認識します。beta channel では、default-line npm と ClawHub plugin records はまず `@beta` を試し、plugin beta release が存在しない場合は記録済みの default/latest spec にフォールバックします。Exact versions と explicit tags は、その selector に固定されたままです。

  </Accordion>
  <Accordion title="Version checks と integrity drift">
    live npm update の前に、OpenClaw はインストール済み package version を npm registry metadata と照合します。インストール済み version と記録済み artifact identity が解決済み target とすでに一致している場合、download、reinstall、または `openclaw.json` の書き換えを行わずに update は skipped されます。

    保存済み integrity hash が存在し、取得された artifact hash が変わった場合、OpenClaw はそれを npm artifact drift として扱います。対話型の `openclaw plugins update` command は expected hash と actual hash を表示し、続行前に確認を求めます。非対話型 update helpers は、呼び出し元が明示的な continuation policy を指定しない限り fail closed します。

  </Accordion>
  <Accordion title="update での --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、plugin updates 中の組み込み dangerous-code scan false positives に対する break-glass override として、`plugins update` でも利用できます。ただし、plugin `before_install` policy blocks または scan-failure blocking は引き続きバイパスせず、hook-pack updates ではなく plugin updates にのみ適用されます。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect はデフォルトでは plugin runtime を import せずに、identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities、および検出された MCP または LSP server support を表示します。`--runtime` を追加すると、plugin module を読み込み、登録済み hooks、tools、commands、services、gateway methods、HTTP routes を含めます。Runtime inspection は欠落した plugin dependencies を直接報告します。Installs と repairs は `openclaw plugins install`、`openclaw plugins update`、および `openclaw doctor --fix` に残ります。

plugin 所有の CLI commands は root `openclaw` command groups としてインストールされます。`inspect --runtime` が `cliCommands` 配下に command を表示した後、`openclaw <command> ...` として実行してください。たとえば `demo-git` を登録する plugin は、`openclaw demo-git ping` で検証できます。

各 plugin は、runtime で実際に登録する内容により分類されます。

- **plain-capability** — 1 種類の capability type (例: provider-only plugin)
- **hybrid-capability** — 複数の capability types (例: text + speech + images)
- **hook-only** — hooks のみで、capabilities や surfaces はありません
- **non-capability** — tools/commands/services はあるが capabilities はありません

capability model の詳細は [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` flag は、scripting と auditing に適した機械可読 report を出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、および hook summary columns を含む fleet-wide table を描画します。`info` は `inspect` の alias です。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は plugin load errors、manifest/discovery diagnostics、および compatibility notices を報告します。すべてが clean の場合は `No plugin issues detected.` と出力します。

設定済み plugin がディスク上に存在するものの loader の path-safety checks により blocked されている場合、config validation は plugin entry を保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` config を削除するのではなく、path ownership や world-writable permissions など、先行する blocked-plugin diagnostic を修正してください。

`register`/`activate` exports の欠落など module-shape failures の場合は、diagnostic output に compact export-shape summary を含めるため、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` で再実行してください。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル plugin registry は、インストール済み plugin identity、enablement、source metadata、および contribution ownership に対する OpenClaw の永続化 cold read model です。通常の startup、provider owner lookup、channel setup classification、および plugin inventory は、plugin runtime modules を import せずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、または古いかを確認します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、manifest/package メタデータから再構築できます。これは修復パスであり、ランタイムの有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨の非常時互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この環境変数フォールバックは、移行の展開中に緊急の起動復旧を行う場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイス manifest と Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
