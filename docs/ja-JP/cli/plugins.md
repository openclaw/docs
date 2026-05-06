---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-06T17:54:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Pluginシステム" href="/ja-JP/tools/plugin">
    Pluginのインストール、有効化、トラブルシューティングに関するエンドユーザーガイド。
  </Card>
  <Card title="Pluginを管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例。
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

低速なインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を指定してコマンドを実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能な状態に保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、Pluginライフサイクルの変更操作は無効になります。このインストールには `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、`plugins disable` の代わりに Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
同梱Pluginは OpenClaw と一緒に出荷されます。一部はデフォルトで有効です（たとえば同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザーPlugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Pluginは、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力では、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
</Note>

### インストール

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
修飾なしのパッケージ名は、ローンチ移行期間中はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。Pluginのインストールはコードの実行と同様に扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能なPluginパッケージを問い合わせ、インストールに使えるパッケージ名を出力します。検索対象はコードPluginとバンドルPluginのパッケージであり、Skills ではありません。ClawHub の Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどのPluginにとって主要な配布および発見の入口です。npm は引き続き、サポートされるフォールバックおよび直接インストール経路です。OpenClaw 所有の `@openclaw/*` Pluginパッケージは npm で再公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Pluginインベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールでは `latest` を使用します。ベータチャネルのインストールと更新では、npm の `beta` dist-tag が利用可能な場合はそれを優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定 include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟オーバーライドを持つ include は、フラット化せずにフェイルクローズします。サポートされる形状については、[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常フェイルクローズし、先に `openclaw doctor --fix` を実行するよう指示します。Gateway の起動中およびホットリロード中は、無効なPlugin設定は他の無効な設定と同様にフェイルクローズします。`openclaw doctor --fix` は無効なPluginエントリを隔離できます。インストール時に文書化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしたPlugin向けの、限定的な同梱Plugin復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール、update との違い">
    `--force` は既存のインストール先を再利用し、すでにインストール済みのPluginまたはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Pluginの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストールされているPlugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。固定ソースが必要な場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされません。marketplace インストールは npm spec ではなく marketplace ソースメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールの続行を許可しますが、Plugin の `before_install` フックポリシーブロックは**バイパスせず**、スキャン失敗も**バイパスしません**。

    この CLI フラグは Plugin の install/update フローに適用されます。Gateway 経由の skill 依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub skill ダウンロード/インストールフローのままです。

    ClawHub で公開したPluginがレジストリスキャンによってブロックされる場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール入口でもあります。フィルター済みのフック表示やフック単位の有効化には、パッケージインストールではなく `openclaw hooks` を使用してください。

    npm specs は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または **dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールは安全のため、シェルにグローバル npm インストール設定がある場合でも、プロジェクトローカルで `--ignore-scripts` を指定して実行されます。管理対象Pluginの npm ルートは OpenClaw のパッケージレベルの npm `overrides` を継承するため、ホストのセキュリティピンは巻き上げられたPlugin依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ローンチ移行期間中は、修飾なしのパッケージ spec も npm から直接インストールされます。

    修飾なしの spec と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がこれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグまたは `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    修飾なしのインストール spec が公式Plugin id（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` のクローン URL があります。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、要求された ref がある場合はそれをチェックアウトしてから、通常のPluginディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録される git インストールには、ソース URL/ref と解決済みコミットが含まれるため、後で `openclaw plugins update` がソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を確認してください。Pluginが `api.registerCli` で CLI ルートを登録した場合は、そのコマンドを OpenClaw ルート CLI から直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Pluginアーカイブには、展開されたPluginルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールで使われるものと同じ管理対象 npm ルートのインストールパスをテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` の検証、巻き上げられた依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、引き続きPlugin extensions ルート配下のローカルアーカイブとしてインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ローンチ移行期間中、修飾なしの npm-safe なPlugin spec はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 専用の解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に、公開されている Plugin API / Gateway 最小互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付きの npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスでインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証パスで引き続きインストールされます。記録されたインストールは、後の更新のために、ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョン指定なしの ClawHub インストールは、バージョン指定なしの記録済み spec を保持するため、`openclaw plugins update` は新しい ClawHub リリースを追跡できます。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### マーケットプレイス省略表記

マーケットプレイス名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略表記を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

マーケットプレイスソースを明示的に渡したい場合は、`--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスソース">
    - `~/.claude/plugins/known_marketplaces.json` の Claude 既知マーケットプレイス名
    - ローカルのマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に収まっている必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル Skills、Claude command-skills、Claude `settings.json` のデフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、ランタイム実行にはまだ接続されていません。
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
  テーブル表示から、ソース/由来/バージョン/アクティベーションメタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を表示します。
</ParamField>

<Note>
`plugins list` は、まず永続化されたローカル Plugin レジストリを読み取り、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使用します。これは、Plugin がインストール済みか、有効化済みか、コールドスタート計画から見えるかを確認するのに便利ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook の実行を期待する前に、そのチャンネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と
`optionalDependencies` から得た各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ
名が Plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。
Plugin ランタイムコードの import、パッケージマネージャーの実行、欠落している
依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル
状態の検査、config の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索
結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、概要、
`openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin を扱う場合は、Plugin
ソースディレクトリを、一致するパッケージ化済みソースパス（例:
`/app/extensions/synology-chat`）の上に bind-mount してください。OpenClaw は、そのマウントされたソース
オーバーレイを `/app/dist/extensions/synology-chat` より前に検出します。単にコピーされたソース
ディレクトリは無効なままなので、通常のパッケージ化済みインストールは引き続きコンパイル済み dist を使用します。

ランタイム hook のデバッグには次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュールを読み込む検査パスから、登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。従来の依存関係状態のクリーンアップや、config から参照されているダウンロード可能 Plugin の欠落を復旧するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、config パス、RPC ヘルスを確認します。
- 非バンドル会話 hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使用します（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象インストール先へコピーする代わりにソースパスを再利用するため、`--force` は `--link` と一緒にはサポートされていません。

npm インストールでは、デフォルトの固定しない動作を維持しつつ、解決済みの正確な spec（`name@version`）を管理対象 Plugin インデックスに保存するには `--pin` を使用します。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー config ではなく、機械管理の状態です。インストールと更新は、アクティブな OpenClaw state ディレクトリ配下の `plugins/installs.json` に書き込みます。最上位の `installRecords` マップは、壊れた、または欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、uninstall、診断、コールド Plugin レジストリで使用されます。

OpenClaw が config 内に出荷済みの従来の `plugins.installs` レコードを見つけた場合、ランタイム読み取りでは `openclaw.json` を書き換えずに互換入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、config 書き込みが許可されている場合、それらのレコードを Plugin インデックスへ移動し、config キーを削除します。どちらかの書き込みが失敗した場合は、インストールメタデータが失われないように config レコードが保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合、`plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、uninstall は、追跡対象の管理インストールディレクトリが OpenClaw の Plugin extensions ルート内にある場合、それも削除します。Active Memory Plugin では、メモリスロットが `memory-core` にリセットされます。

<Note>
`--keep-config` は、`--keep-files` の非推奨エイリアスとしてサポートされています。
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
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tag や正確に固定されたバージョンは、後の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec も渡せます。OpenClaw はそのパッケージ名を追跡対象 Plugin レコードに解決し、そのインストール済み Plugin を更新して、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象 Plugin レコードに解決されます。Plugin が正確なバージョンに固定されていて、レジストリのデフォルトリリースラインへ戻したい場合に使用します。

  </Accordion>
  <Accordion title="ベータチャンネル更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャンネルを認識します。ベータチャンネルでは、デフォルトラインの npm と ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は、記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が、解決された対象とすでに一致している場合、ダウンロード、再インストール、`openclaw.json` の書き換えなしで更新はスキップされます。

    保存済みの integrity ハッシュが存在し、取得したアーティファクトハッシュが変わった場合、OpenClaw はそれを npm artifact drift として扱います。対話式の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを出力し、続行前に確認を求めます。非対話式の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、fail closed します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中に組み込みの dangerous-code スキャンが false positive になった場合の break-glass オーバーライドとして、`plugins update` でも使用できます。ただし、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続きバイパスせず、Plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

inspect は、デフォルトでは Plugin ランタイムを import せずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出された MCP または LSP サーバー対応を表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hook、tools、commands、services、Gateway methods、HTTP routes を含めます。ランタイム検査は、欠落した Plugin 依存関係を直接報告します。インストールと修復は、`openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に残ります。

Plugin 所有の CLI コマンドは、ルートの `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` 配下にコマンドを表示した後、`openclaw <command> ...` として実行します。たとえば、`demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **単一機能** — 1種類の機能タイプ（例: プロバイダー専用Plugin）
- **ハイブリッド機能** — 複数の機能タイプ（例: テキスト + 音声 + 画像）
- **フックのみ** — フックのみで、機能やサーフェスはなし
- **非機能** — ツール/コマンド/サービスはあるが機能はなし

機能モデルの詳細は [Pluginの形態](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化や監査に適した機械可読レポートを出力します。`inspect --all` は、形態、機能の種類、互換性通知、バンドル機能、フック概要の列を含む全体テーブルを表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Pluginの読み込みエラー、マニフェスト/検出診断、互換性通知を報告します。すべて問題がない場合は `No plugin issues detected.` と表示します。

設定済みのPluginがディスク上に存在していても、ローダーのパス安全性チェックによってブロックされている場合、設定検証はPluginエントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` 設定を削除するのではなく、パスの所有権や誰でも書き込み可能な権限など、先に表示されたブロック対象Pluginの診断を修正してください。

`register`/`activate` エクスポートの欠落など、モジュール形態の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力にコンパクトなエクスポート形態の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカルPluginレジストリは、インストール済みPluginのアイデンティティ、有効化状態、ソースメタデータ、貢献の所有権に関する、OpenClawの永続化されたコールドリードモデルです。通常の起動、プロバイダー所有者の検索、チャネルセットアップ分類、Pluginインベントリは、Pluginランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古いかを確認します。`--refresh` を使用すると、永続化されたPluginインデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ周辺の管理対象npmドリフトも修復します。管理対象Plugin npmルート配下の孤立または復旧された `@openclaw/*` パッケージがバンドルPluginを隠している場合、doctor はその古いパッケージを削除し、起動時にバンドルマニフェストに対して検証されるようレジストリを再構築します。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この環境変数フォールバックは、移行のロールアウト中に緊急起動復旧が必要な場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のようなGitHub短縮表記、GitHubリポジトリURL、またはgit URLを受け付けます。`--json` は、解決済みのソースラベルに加えて、解析済みのマーケットプレイスマニフェストとPluginエントリを出力します。

## 関連

- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [CLIリファレンス](/ja-JP/cli)
- [コミュニティPlugin](/ja-JP/plugins/community)
