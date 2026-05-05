---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Pluginシステム" href="/ja-JP/tools/plugin">
    Pluginのインストール、有効化、トラブルシューティングのエンドユーザー向けガイド。
  </Card>
  <Card title="Pluginを管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開のクイック例。
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
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を指定してコマンドを実行します。トレースはフェーズごとの所要時間を
stderr に書き込み、JSON出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドル済みPluginはOpenClawに同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザーPlugin）。それ以外は `plugins enable` が必要です。

ネイティブOpenClaw Pluginは、インラインJSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な一覧/info出力では、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と、検出されたバンドル機能も表示されます。
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
裸のパッケージ名は、ローンチ移行期間中はデフォルトでnpmからインストールされます。ClawHubには `clawhub:<package>` を使用してください。Pluginのインストールは、コードを実行するものとして扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は、インストール可能なPluginパッケージをClawHubに問い合わせ、
インストール可能なパッケージ名を出力します。検索対象はコードPluginとバンドルPluginのパッケージであり、
Skillsではありません。ClawHub Skillsには `openclaw skills search` を使用してください。

<Note>
ClawHubは、ほとんどのPluginにおける主要な配布および発見サーフェスです。Npmは
サポート対象のフォールバックおよび直接インストール経路として残ります。OpenClaw所有の
`@openclaw/*` Pluginパッケージはnpmで再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[Pluginインベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールは `latest` を使用します。
ベータチャンネルのインストールと更新では、そのタグが利用可能な場合はnpmの `beta` dist-tagを優先し、
その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定includeと無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのinclude先ファイルに書き込み、`openclaw.json` は変更しません。ルートinclude、include配列、兄弟オーバーライドを伴うincludeは、平坦化せずにフェイルクローズします。サポートされる形については、[設定include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常フェイルクローズし、先に `openclaw doctor --fix` を実行するよう通知します。Gateway起動時およびホットリロード時には、無効なPlugin設定は他の無効な設定と同様にフェイルクローズします。`openclaw doctor --fix` は無効なPluginエントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしたPlugin向けの限定的なバンドル済みPlugin復旧経路です。

  </Accordion>
  <Accordion title="--forceと再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みのPluginまたはフックパックをその場で上書きします。同じidを新しいローカルパス、アーカイブ、ClawHubパッケージ、またはnpmアーティファクトから意図的に再インストールする場合に使用します。すでに追跡されているnpm Pluginの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みのPlugin idに対して `plugins install` を実行すると、OpenClawは停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、現在のインストールを別のソースから本当に上書きする場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pinのスコープ">
    `--pin` はnpmインストールにのみ適用されます。`git:` インストールではサポートされません。固定ソースが必要な場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的なgit refを使用してください。`--marketplace` でもサポートされません。marketplaceインストールはnpm specではなく、marketplaceソースメタデータを保持するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する非常用オプションです。組み込みスキャナーが `critical` 所見を報告した場合でもインストールの継続を許可しますが、Pluginの `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    このCLIフラグはPluginのインストール/更新フローに適用されます。GatewayバックのSkill依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個のClawHub Skillダウンロード/インストールフローのままです。

    ClawHubで公開したPluginがレジストリスキャンによってブロックされる場合は、[ClawHub](/ja-JP/tools/clawhub)の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックとnpm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージのインストールではなく、フィルター済みのフック可視性とフックごとの有効化には `openclaw hooks` を使用してください。

    Npm specは**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file specおよびsemver範囲は拒否されます。依存関係のインストールは、シェルにグローバルnpmインストール設定がある場合でも、安全のため `--ignore-scripts` 付きでプロジェクトローカルに実行されます。

    npm解決を明示したい場合は `npm:<package>` を使用してください。裸のパッケージspecも、ローンチ移行期間中はnpmから直接インストールされます。

    裸のspecと `@latest` は安定版トラックに留まります。`2026.5.3-1` のようなOpenClawの日付付き修正版は、このチェックでは安定版リリースです。npmがそれらのいずれかをプレリリースに解決した場合、OpenClawは停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストールspecが公式Plugin id（たとえば `diffs`）と一致する場合、OpenClawはカタログエントリを直接インストールします。同じ名前のnpmパッケージをインストールするには、明示的なスコープ付きspec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Gitリポジトリ">
    gitリポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローンURLが含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Gitインストールは一時ディレクトリにクローンし、指定されたrefがある場合はそれをチェックアウトしてから、通常のPluginディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストールレコードはnpmインストールと同じように動作します。記録されたgitインストールには、ソースURL/refと解決済みコミットが含まれるため、後で `openclaw plugins update` がソースを再解決できます。

    gitからインストールした後、GatewayメソッドやCLIコマンドなどのランタイム登録を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。Pluginが `api.registerCli` でCLIルートを登録した場合は、たとえば `openclaw demo-plugin ping` のように、そのコマンドをOpenClawルートCLI経由で直接実行します。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブOpenClaw Pluginアーカイブには、展開後のPluginルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClawがインストールレコードを書き込む前に拒否されます。

    Claude marketplaceインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHubインストールは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

裸のnpmセーフなPlugin specは、ローンチ移行期間中はデフォルトでnpmからインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm専用解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClawは、インストール前に公開されているPlugin API / 最小Gateway互換性を確認します。選択されたClawHubバージョンがClawPackアーティファクトを公開している場合、OpenClawはバージョン付きnpm-pack `.tgz` をダウンロードし、ClawHubダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブ経路でインストールします。ClawPackメタデータのない古いClawHubバージョンは、引き続き従来のパッケージアーカイブ検証経路でインストールされます。記録されたインストールは、後の更新のために、ClawHubソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball名、ClawPackダイジェスト情報を保持します。
バージョンなしのClawHubインストールは、`openclaw plugins update` が新しいClawHubリリースを追跡できるよう、バージョンなしの記録済みspecを保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### Marketplace省略記法

Claudeのローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` にmarketplace名が存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplaceソースを明示的に渡したい場合は、`--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルマーケットプレイスのルート、または `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ短縮形
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ一覧/情報/有効化/無効化フローに参加します。現在、バンドル Skills、Claude コマンド Skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor コマンド Skills、互換 Codex hook ディレクトリがサポートされています。その他の検出済みバンドル機能は診断/情報に表示されますが、まだランタイム実行には接続されていません。
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
  有効化されている Plugin のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブル表示から、ソース/出所/バージョン/アクティベーションメタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル Plugin レジストリを読み取り、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使います。Plugin がインストール済み、有効化済み、かつコールドスタート計画から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook の実行を期待する前に、そのチャネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から得た各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` 参照パス上に存在するかを確認します。Plugin ランタイムコードのインポート、パッケージマネージャーの実行、欠落した依存関係の修復は行いません。
</Note>

`plugins search` はリモートの ClawHub カタログ検索です。ローカル状態の検査、config の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin を扱う場合は、Plugin ソースディレクトリを、対応するパッケージ済みソースパス（例: `/app/extensions/synology-chat`）の上に bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは不活性なままなので、通常のパッケージ済みインストールは引き続きコンパイル済み dist を使います。

ランタイム hook のデバッグでは、次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込み検査パスから登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態の整理や、config で参照されている欠落したダウンロード可能 Plugin の復旧には `openclaw doctor --fix` を使います。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、config パス、RPC ヘルスを確認します。
- 非バンドルの会話 hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使います（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクインストールは管理対象のインストール先へコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使うと、デフォルト動作をピン留めなしのままにしつつ、解決された正確な spec（`name@version`）を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは機械管理の状態であり、ユーザー config ではありません。インストールと更新は、アクティブな OpenClaw state ディレクトリ配下の `plugins/installs.json` に書き込みます。そのトップレベルの `installRecords` マップは、壊れた Plugin マニフェストや欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェストから派生したコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使用されます。

OpenClaw が config 内に出荷済みのレガシー `plugins.installs` レコードを見つけると、それらを Plugin インデックスへ移動し、config キーを削除します。どちらかの書き込みが失敗した場合、インストールメタデータが失われないように config レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、永続化された Plugin インデックス、Plugin 許可/拒否リストエントリ、および該当する場合はリンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、OpenClaw の Plugin extensions ルート内にある追跡対象の管理インストールディレクトリも削除します。Active Memory Plugin の場合、メモリスロットは `memory-core` にリセットされます。

<Note>
`--keep-config` は、非推奨の `--keep-files` エイリアスとしてサポートされています。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理対象 Plugin インデックス内の追跡対象 Plugin インストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されているインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tag や正確にピン留めされたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに解決し直し、そのインストール済み Plugin を更新して、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに解決されます。Plugin が正確なバージョンにピン留めされており、レジストリのデフォルトリリースラインへ戻したい場合に使います。

  </Accordion>
  <Accordion title="ベータチャネルの更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は、記録済みのデフォルト/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクターにピン留めされたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が解決済みターゲットとすでに一致している場合、ダウンロード、再インストール、`openclaw.json` の再書き込みを行わずに更新はスキップされます。

    保存された integrity ハッシュが存在し、取得したアーティファクトハッシュが変わった場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを出力し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り fail closed します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中に組み込みの dangerous-code スキャンで偽陽性が出た場合の緊急用オーバーライドとして、`plugins update` でも利用できます。ただし、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続き回避せず、hook-pack 更新ではなく Plugin 更新にのみ適用されます。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは Plugin ランタイムをインポートせずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバーサポートを表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hook、tools、commands、services、gateway methods、HTTP routes を含めます。ランタイム検査は欠落している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは、ルートの `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` 配下にコマンドを表示したら、`openclaw <command> ...` として実行します。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容に基づいて分類されます。

- **plain-capability** — 1 つの capability type（例: provider-only Plugin）
- **hybrid-capability** — 複数の capability type（例: text + speech + images）
- **hook-only** — hook のみで、capabilities や surfaces なし
- **non-capability** — tools/commands/services はあるが capabilities なし

capability モデルの詳細は [Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト作成と監査に適した機械可読レポートを出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、hook summary 列を含む全体テーブルを表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin 読み込みエラー、マニフェスト/検出診断、互換性通知を報告します。すべてクリーンな場合は `No plugin issues detected.` を出力します。

設定済み Plugin がディスク上に存在するものの、ローダーのパス安全性チェックでブロックされている場合、config バリデーションは Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` config を削除するのではなく、パス所有権や world-writable 権限など、直前の blocked-plugin 診断を修正してください。

`register`/`activate` export の欠落などのモジュール形状エラーでは、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトな export-shape サマリーが含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化、ソースメタデータ、コントリビューション所有権に関する OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者ルックアップ、チャネル設定分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古くなっているかを調べます。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト/package メタデータから再構築できます。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ周辺の managed npm ドリフトも修復します。managed Plugin npm ルート配下の孤立または復旧された `@openclaw/*` package が bundled Plugin をシャドーしている場合、doctor はその古い package を削除し、レジストリを再構築して、起動時に bundled マニフェストに対して検証されるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行の展開中に緊急で起動を復旧する場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決済みのソースラベルに加えて、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
