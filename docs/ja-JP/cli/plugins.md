---
read_when:
    - Gateway plugins または互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-02T04:52:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Pluginシステム" href="/ja-JP/tools/plugin">
    Pluginのインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Pluginバンドル" href="/ja-JP/plugins/bundles">
    バンドル互換性モデル。
  </Card>
  <Card title="Pluginマニフェスト" href="/ja-JP/plugins/manifest">
    マニフェストフィールドと設定スキーマ。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security">
    Pluginインストールのセキュリティ強化。
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

低速なインストール、検査、アンインストール、またはレジストリ更新の調査では、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの所要時間を
stderr に書き込み、JSON 出力を解析可能なまま保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドルされたPluginはOpenClawに同梱されています。一部はデフォルトで有効です（たとえばバンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザーPlugin）。それ以外は `plugins enable` が必要です。

ネイティブOpenClaw Pluginは、インラインJSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細なlist/info出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）に加えて、検出されたバンドル機能も表示されます。
</Note>

### インストール

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
素のパッケージ名は、まずClawHub、次にnpmに照合されます。Pluginのインストールはコードを実行するものとして扱ってください。固定バージョンを優先してください。
</Warning>

`plugins search` はClawHubにインストール可能なPluginパッケージを問い合わせ、
インストール可能なパッケージ名を出力します。検索対象はコードPluginとバンドルPluginのパッケージであり、
Skillsではありません。ClawHubのSkillsには `openclaw skills search` を使用してください。

<Note>
ClawHubは、ほとんどのPluginにおける主要な配布および発見の画面です。npmは、
引き続きサポートされるフォールバックおよび直接インストール経路です。ClawHubへの移行中、
OpenClawはOpenClaw所有の一部の `@openclaw/*` Pluginパッケージを
まだnpmで配布しています。これらのパッケージバージョンは、Pluginリリース
トレイン間でバンドルされたソースより遅れる場合があります。npmがOpenClaw所有のPluginパッケージを非推奨として報告する場合、
その公開バージョンは古い外部アーティファクトです。より新しいnpmパッケージが公開されるまで、
現在のOpenClawにバンドルされたPluginまたはローカルチェックアウトを使用してください。
</Note>

<AccordionGroup>
  <Accordion title="設定のincludeと無効な設定からの復旧">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートinclude、include配列、兄弟オーバーライドを伴うincludeは、フラット化せずに失敗して閉じます。サポートされる形については、[設定のinclude](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常失敗して閉じ、先に `openclaw doctor --fix` を実行するよう案内します。Gateway起動中は、1つのPluginの無効な設定はそのPluginに隔離されるため、他のチャンネルやPluginは実行を継続できます。`openclaw doctor --fix` は無効なPluginエントリを隔離できます。文書化されている唯一のインストール時の例外は、`openclaw.install.allowInvalidConfigRecovery` を明示的に選択したPlugin向けの、狭い範囲のバンドルPlugin復旧パスです。

  </Accordion>
  <Accordion title="--forceと再インストール対アップデート">
    `--force` は既存のインストール先を再利用し、すでにインストール済みのPluginまたはフックパックをその場で上書きします。同じidを新しいローカルパス、アーカイブ、ClawHubパッケージ、またはnpmアーティファクトから意図的に再インストールするときに使用します。すでに追跡されているnpm Pluginの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みのPlugin idに対して `plugins install` を実行すると、OpenClawは停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pinの範囲">
    `--pin` はnpmインストールにのみ適用されます。`git:` インストールではサポートされません。固定ソースが必要な場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的なgit refを使用してください。`--marketplace` でもサポートされません。marketplaceインストールはnpm specではなくmarketplaceソースメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーにおける誤検知向けの緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告した場合でもインストールを続行できますが、Pluginの `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    このCLIフラグはPluginのinstall/updateフローに適用されます。Gateway経由のSkill依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は別個のClawHub Skillダウンロード/インストールフローのままです。

    ClawHubで公開したPluginがレジストリスキャンによってブロックされた場合は、[ClawHub](/ja-JP/tools/clawhub)の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックとnpm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール画面でもあります。フィルターされたフックの可視性とフックごとの有効化には `openclaw hooks` を使用し、パッケージのインストールには使用しません。

    npm specは**レジストリ限定**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file specとsemver範囲は拒否されます。依存関係のインストールは、シェルにグローバルnpmインストール設定がある場合でも、安全のためプロジェクトローカルで `--ignore-scripts` を付けて実行されます。

    ClawHubの検索をスキップしてnpmから直接インストールしたい場合は `npm:<package>` を使用します。素のパッケージspecは引き続きClawHubを優先し、ClawHubにそのパッケージまたはバージョンがない場合にのみnpmへフォールバックします。

    素のspecと `@latest` は安定トラックに留まります。npmがこれらのいずれかをプレリリースに解決した場合、OpenClawは停止し、`@beta`/`@rc` のようなプレリリースタグまたは `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的に選択するよう求めます。

    素のインストールspecが公式Plugin id（たとえば `diffs`）に一致する場合、OpenClawはカタログエントリを直接インストールします。同じ名前のnpmパッケージをインストールするには、明示的なスコープ付きspec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Gitリポジトリ">
    gitリポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` のクローンURLが含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    gitインストールは一時ディレクトリにクローンし、指定されたrefがある場合はチェックアウトしてから、通常のPluginディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録はnpmインストールと同じように動作します。記録されたgitインストールには、ソースURL/refに加えて解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    gitからインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gatewayメソッドやCLIコマンドなどのランタイム登録を確認します。Pluginが `api.registerCli` でCLIルートを登録している場合は、OpenClawルートCLIを通じてそのコマンドを直接実行します。たとえば `openclaw demo-plugin ping` です。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブOpenClaw Pluginアーカイブは、展開されたPluginルートに有効な `openclaw.plugin.json` を含む必要があります。`package.json` だけを含むアーカイブは、OpenClawがインストール記録を書き込む前に拒否されます。

    Claude marketplaceインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHubインストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClawは現在、素のnpm安全なPlugin specについてもClawHubを優先します。ClawHubにそのパッケージまたはバージョンがない場合にのみnpmへフォールバックします。

```bash
openclaw plugins install openclaw-codex-app-server
```

ClawHubに到達できない場合や、そのパッケージがnpmにのみ存在するとわかっている場合など、npm限定の解決を強制するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClawはインストール前に、公開されているPlugin API / 最小gateway互換性を確認します。選択されたClawHubバージョンがClawPackアーティファクトを公開している場合、OpenClawはバージョン付きClawPackをダウンロードし、ClawHubダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスを通じてインストールします。ClawPackメタデータのない古いClawHubバージョンは、引き続き従来のパッケージアーカイブ検証パスを通じてインストールされます。記録されたインストールは、後のアップデートのためにClawHubソースメタデータとClawPackダイジェスト情報を保持します。
バージョン指定なしのClawHubインストールは、`openclaw plugins update` がより新しいClawHubリリースを追跡できるように、バージョン指定なしの記録済みspecを保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### Marketplace短縮表記

Claudeのローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` にmarketplace名が存在する場合は、`plugin@marketplace` 短縮表記を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplaceソースを明示的に渡したい場合は `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルマーケットプレイスのルート、または `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在、バンドル Skills、Claude コマンド Skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor コマンド Skills、および互換 Codex hook ディレクトリがサポートされています。その他の検出されたバンドル機能は診断/info に表示されますが、まだランタイム実行には接続されていません。
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
  テーブル表示から、ソース/出所/バージョン/有効化メタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  マシン可読なインベントリとレジストリ診断です。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル Plugin レジストリを読み取り、レジストリが欠落または無効な場合はマニフェストのみから派生したフォールバックを使用します。Plugin がインストール済み、有効、かつコールドスタートアップ計画から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook の実行を期待する前に、そのチャネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin を扱う場合は、Plugin ソースディレクトリを、対応するパッケージ化済みソースパス（例: `/app/extensions/synology-chat`）の上に bind mount してください。OpenClaw は `/app/dist/extensions/synology-chat` より先に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは非アクティブなままなので、通常のパッケージ化済みインストールでは引き続きコンパイル済み dist が使用されます。

ランタイム hook のデバッグには次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みによる検査パスから登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態を整理したり、設定済みのダウンロード可能 Plugin の不足分をインストールしたりするには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスヒント、設定パス、RPC ヘルスを確認します。
- 非バンドルの会話 hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使用します（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象インストール先にコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルト動作はピン留めなしのまま、解決済みの正確な spec（`name@version`）を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなくマシン管理状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にそれを書き込みます。トップレベルの `installRecords` マップは、壊れた、または欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、およびコールド Plugin レジストリによって使用されます。

OpenClaw が設定内に出荷済みレガシー `plugins.installs` レコードを見つけると、それらを Plugin インデックスへ移動し、設定キーを削除します。いずれかの書き込みに失敗した場合、インストールメタデータが失われないように設定レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny list エントリ、およびリンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、追跡対象の管理対象インストールディレクトリが OpenClaw の Plugin 拡張ルート内にある場合、そのディレクトリも削除します。Active Memory Plugin の場合、メモリスロットは `memory-core` にリセットされます。

<Note>
`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理対象 Plugin インデックス内の追跡対象 Plugin インストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Plugin ID を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` などの dist-tag や正確にピン留めされたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象 Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の ID ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡す場合も、追跡対象 Plugin レコードに解決されます。Plugin が正確なバージョンにピン留めされていて、レジストリのデフォルトリリースラインへ戻したい場合に使用してください。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が解決済みターゲットとすでに一致している場合、更新はダウンロード、再インストール、または `openclaw.json` の書き換えなしでスキップされます。

    保存済みの integrity ハッシュが存在し、取得されたアーティファクトハッシュが変わっている場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待ハッシュと実際のハッシュを出力し、続行する前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、フェイルクローズします。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` は、Plugin 更新中に組み込みの危険コードスキャンで誤検知が起きた場合の break-glass override として、`plugins update` でも使用できます。ただし、Plugin `before_install` ポリシーブロックやスキャン失敗によるブロックをバイパスすることはなく、hook-pack 更新ではなく Plugin 更新にのみ適用されます。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは Plugin ランタイムをインポートせずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバーサポートを表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hook、ツール、コマンド、サービス、Gateway メソッド、HTTP ルートを含めます。ランタイム検査は、不足している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、および `openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは、ルート `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` の下にコマンドを表示した後、`openclaw <command> ...` として実行します。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 種類の capability タイプ（例: provider-only Plugin）
- **hybrid-capability** — 複数の capability タイプ（例: text + speech + images）
- **hook-only** — hook のみ、capabilities や surfaces なし
- **non-capability** — tools/commands/services はあるが capabilities はなし

capability モデルの詳細は [Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト処理と監査に適したマシン可読レポートを出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、hook summary の列を含む fleet-wide テーブルをレンダリングします。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin 読み込みエラー、マニフェスト/検出診断、および互換性通知を報告します。すべてクリーンな場合は `No plugin issues detected.` と出力します。

`register`/`activate` エクスポートの欠落など、モジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` で再実行すると、診断出力にコンパクトなエクスポート形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化、ソースメタデータ、および貢献所有権に関する、OpenClaw の永続化されたコールド読み取りモデルです。通常のスタートアップ、プロバイダー所有者検索、チャネルセットアップ分類、および Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、または古くなっているかを確認します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、およびマニフェスト/パッケージメタデータから再構築します。これは修復パスであり、ランタイム有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨 break-glass 互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。env フォールバックは、移行の展開中に緊急スタートアップ復旧が必要な場合のみ使用してください。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list は、ローカルマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を受け入れます。`--json` は、解決済みソースラベルに加えて、解析済みマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
