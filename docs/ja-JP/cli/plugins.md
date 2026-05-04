---
read_when:
    - Gateway plugins または互換バンドルをインストールまたは管理したい場合
    - Pluginの読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Gateway プラグイン、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    プラグインのインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="プラグインの管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例。
  </Card>
  <Card title="Plugin バンドル" href="/ja-JP/plugins/bundles">
    バンドル互換性モデル。
  </Card>
  <Card title="Plugin マニフェスト" href="/ja-JP/plugins/manifest">
    マニフェストフィールドと設定スキーマ。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security">
    プラグインインストールのセキュリティ強化。
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
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを
stderr に書き込み、JSON 出力を解析可能なまま保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドル済みプラグインは OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザプラグイン）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw プラグインは、インライン JSON スキーマ（空であっても `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な一覧/情報出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と、検出されたバンドル機能も表示されます。
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
接頭辞なしのパッケージ名は、ローンチ切り替え期間中はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。プラグインのインストールはコードの実行と同じように扱ってください。ピン留めされたバージョンを優先してください。
</Warning>

`plugins search` は ClawHub に対してインストール可能なプラグインパッケージを問い合わせ、インストール可能なパッケージ名を出力します。検索対象はコードプラグインとバンドルプラグインのパッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどのプラグインにとって主要な配布および発見の場です。npm
は引き続き、サポートされるフォールバックおよび直接インストール経路です。OpenClaw 所有の
`@openclaw/*` プラグインパッケージは npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[プラグインインベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールでは `latest` を使用します。
ベータチャンネルのインストールと更新では、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定インクルードと無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` を基にしている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートのインクルード、インクルード配列、兄弟オーバーライドを伴うインクルードは、平坦化される代わりに安全側に失敗します。サポートされる形については、[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常安全側に失敗し、まず `openclaw doctor --fix` を実行するよう指示します。Gateway 起動時およびホットリロード時には、無効なプラグイン設定は他の無効な設定と同様に安全側に失敗します。`openclaw doctor --fix` は無効なプラグインエントリーを隔離できます。インストール時の例外として文書化されているのは、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしたプラグイン向けの、限定的なバンドル済みプラグイン回復パスだけです。

  </Accordion>
  <Accordion title="--force と再インストール、更新の違い">
    `--force` は既存のインストール先を再利用し、すでにインストールされているプラグインまたはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールするときに使用します。すでに追跡されている npm プラグインの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みのプラグイン id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内し、現在のインストールを別のソースから本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールのみに適用されます。`git:` インストールではサポートされていません。ソースをピン留めしたい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git 参照を使用してください。`--marketplace` でもサポートされていません。マーケットプレイスインストールでは、npm 指定ではなくマーケットプレイスソースメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する非常時用オプションです。組み込みスキャナーが `critical` の検出結果を報告した場合でもインストールを続行できますが、プラグインの `before_install` フックポリシーブロックは**バイパスせず**、スキャン失敗も**バイパスしません**。

    この CLI フラグはプラグインのインストール/更新フローに適用されます。Gateway が背後で行う Skills の依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用し、`openclaw skills install` は引き続き別個の ClawHub Skills ダウンロード/インストールフローです。

    ClawHub で公開したプラグインがレジストリスキャンによってブロックされた場合は、[ClawHub](/ja-JP/tools/clawhub)の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm 指定">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール窓口でもあります。フィルタリングされたフックの表示とフックごとの有効化には `openclaw hooks` を使用し、パッケージインストールには使用しません。

    npm の指定は**レジストリのみ**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file 指定と semver 範囲は拒否されます。依存関係のインストールは、安全のためプロジェクトローカルで `--ignore-scripts` 付きで実行されます。シェルにグローバル npm インストール設定がある場合でも同様です。

    npm の解決を明示したい場合は `npm:<package>` を使用します。接頭辞なしのパッケージ指定も、ローンチ切り替え期間中は npm から直接インストールされます。

    接頭辞なしの指定と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付スタンプ付き修正版バージョンは、このチェックでは安定版リリースです。npm がそれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    接頭辞なしのインストール指定が公式プラグイン id（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリーを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き指定（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` のクローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールでは一時ディレクトリにクローンし、要求された参照がある場合はそれをチェックアウトしてから、通常のプラグインディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーによるインストール処理、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/参照に加えて解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を検証します。プラグインが `api.registerCli` で CLI ルートを登録した場合は、そのコマンドを OpenClaw ルート CLI から直接実行します。たとえば `openclaw demo-plugin ping` です。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw プラグインアーカイブには、展開されたプラグインルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    Claude マーケットプレイスのインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

接頭辞なしの npm 対応プラグイン指定は、ローンチ切り替え期間中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公表されているプラグイン API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスでインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証パスで引き続きインストールされます。記録されたインストールは、後続の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョン指定なしの ClawHub インストールは、バージョン指定なしの記録済み指定を保持するため、`openclaw plugins update` は新しい ClawHub リリースを追跡できます。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターにピン留めされたままです。

#### マーケットプレイスの省略記法

マーケットプレイス名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

マーケットプレイスソースを明示的に渡したい場合は `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` などの GitHub リポジトリ省略表記
    - `https://github.com/owner/repo` などの GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他の非パス plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw plugins（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常の plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現時点では、バンドル Skills、Claude コマンド Skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor コマンド Skills、互換 Codex フックディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  有効化された plugins のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブル表示から、ソース/出所/バージョン/有効化メタデータを含む plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加えて、レジストリ diagnostics とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル plugin レジストリを読み込み、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使います。plugin がインストール済み、有効化済み、コールドスタート計画で可視かどうかを確認するのに便利ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。plugin コード、有効化、フックポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードやフックの実行を期待する前に、そのチャンネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から各 plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。plugin ランタイムコードのインポート、パッケージマネージャーの実行、欠落依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` などのインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル plugin 作業を行うには、plugin ソースディレクトリを、`/app/extensions/synology-chat` などの対応するパッケージ済みソースパスに bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは無効なままなので、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使用されます。

ランタイムフックのデバッグには次を使います。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込み検査パスから登録済みフックと diagnostics を表示します。ランタイム検査が依存関係をインストールすることはありません。レガシー依存関係状態をクリーンアップするか、欠落している設定済みダウンロード可能 plugins をインストールするには、`openclaw doctor --fix` を使ってください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスヒント、設定パス、RPC ヘルスを確認します。
- 非バンドルの会話フック（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使います（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象インストール先にコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使うと、デフォルト動作はピン留めなしのまま、解決された正確な spec（`name@version`）を管理対象 plugin インデックスに保存します。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなく機械管理状態です。インストールと更新は、それをアクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` に書き込みます。最上位の `installRecords` マップは、壊れた plugin マニフェストや欠落した plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、diagnostics、コールド plugin レジストリで使用されます。

OpenClaw が設定内の出荷済みレガシー `plugins.installs` レコードを見つけると、それらを plugin インデックスへ移動し、設定キーを削除します。どちらかの書き込みに失敗した場合、インストールメタデータが失われないよう、設定レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、永続化された plugin インデックス、plugin 許可/拒否リストエントリ、および該当する場合はリンクされた `plugins.load.paths` エントリから plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、追跡対象の管理対象インストールディレクトリが OpenClaw の plugin extensions ルート内にある場合、そのディレクトリも削除します。active memory plugins では、メモリスロットが `memory-core` にリセットされます。

<Note>
`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理対象 plugin インデックス内の追跡対象 plugin インストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="plugin id と npm spec の解決">
    plugin id を渡すと、OpenClaw はその plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` などの dist-tags や正確にピン留めされたバージョンは、以後の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象 plugin レコードに解決し、そのインストール済み plugin を更新して、将来の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象 plugin レコードに解決されます。plugin が正確なバージョンにピン留めされていて、レジストリのデフォルトリリースラインに戻したい場合にこれを使います。

  </Accordion>
  <Accordion title="ベータチャンネルの更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャンネルを認識します。ベータチャンネルでは、デフォルトラインの npm および ClawHub plugin レコードは最初に `@beta` を試し、plugin ベータリリースが存在しない場合は記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクタにピン留めされたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID がすでに解決済みターゲットと一致している場合、ダウンロード、再インストール、`openclaw.json` の書き換えを行わずに更新はスキップされます。

    保存済みの integrity ハッシュが存在し、取得したアーティファクトハッシュが変わった場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、安全側で失敗します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、plugin 更新中に組み込みの危険コードスキャンが誤検出した場合の非常用オーバーライドとして、`plugins update` でも利用できます。ただし、plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続きバイパスされず、plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは plugin ランタイムをインポートせずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、diagnostics、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバーサポートを表示します。`--runtime` を追加すると、plugin モジュールを読み込み、登録済みフック、ツール、コマンド、サービス、gateway メソッド、HTTP ルートを含めます。ランタイム検査は欠落している plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に残ります。

Plugin 所有の CLI コマンドは、ルート `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` の下にコマンドを表示した後は、`openclaw <command> ...` として実行します。たとえば、`demo-git` を登録する plugin は `openclaw demo-git ping` で検証できます。

各 plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 種類の機能タイプ（例: provider 専用 plugin）
- **hybrid-capability** — 複数の機能タイプ（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみ、機能やサーフェスなし
- **non-capability** — ツール/コマンド/サービスはあるが機能なし

機能モデルの詳細は [Plugin の形態](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプトや監査に適した機械可読レポートを出力します。`inspect --all` は、形態、機能の種類、互換性通知、バンドル機能、フック概要の列を含む全体テーブルを表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、plugin 読み込みエラー、マニフェスト/検出 diagnostics、互換性通知を報告します。すべて問題がない場合は `No plugin issues detected.` と表示します。

設定済みの plugin がディスク上に存在するものの、ローダーのパス安全性チェックでブロックされている場合、設定検証は plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、先行するブロック済み plugin diagnostics を修正してください。

`register`/`activate` エクスポートの欠落などのモジュール形状の失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、diagnostic 出力にコンパクトなエクスポート形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル plugin レジストリは、インストール済み plugin の ID、有効化、ソースメタデータ、貢献所有権に関する OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、provider 所有者検索、チャンネルセットアップ分類、plugin インベントリは、plugin ランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古いかを確認します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、manifest/package メタデータから再構築できます。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ周辺の管理対象 npm のずれも修復します。管理対象 Plugin npm ルート配下の孤立または復旧された `@openclaw/*` パッケージが同梱 Plugin を隠している場合、doctor はその古いパッケージを削除し、レジストリを再構築して、起動時に同梱 manifest に対して検証されるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨の非常用互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行の展開中に緊急で起動を復旧する場合にのみ使用します。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list は、ローカル Marketplace パス、`marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub repo URL、または git URL を受け付けます。`--json` は、解決済みのソースラベルに加えて、解析済みの Marketplace manifest と Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [Community Plugin](/ja-JP/plugins/community)
