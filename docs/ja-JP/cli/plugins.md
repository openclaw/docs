---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:04:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

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

低速なインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
同梱 Plugin は OpenClaw と一緒に配布されます。一部はデフォルトで有効です（たとえば同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な一覧/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
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
ローンチ移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。Plugin のインストールはコードの実行と同様に扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、インストール可能なパッケージ名を出力します。検索対象はコード Plugin とバンドル Plugin のパッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの Plugin の主要な配布および発見の場所です。Npm はサポート対象のフォールバックおよび直接インストール経路として残ります。OpenClaw 所有の `@openclaw/*` Plugin パッケージは再び npm で公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールには `latest` を使用します。ベータチャネルのインストールと更新では、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定 include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって支えられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルへ書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟オーバーライドを持つ include は、フラット化せずに安全側で失敗します。サポートされる形については[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、通常 `plugins install` は安全側で失敗し、先に `openclaw doctor --fix` を実行するよう伝えます。Gateway 起動時およびホットリロード時には、無効な Plugin 設定は他の無効な設定と同様に安全側で失敗します。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインする Plugin 向けの狭い同梱 Plugin 復旧経路です。

  </Accordion>
  <Accordion title="--force と再インストール、update の違い">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、本当に別のソースから現在のインストールを上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin の範囲">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされていません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされていません。マーケットプレイスインストールは npm spec ではなく、マーケットプレイスソースのメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する非常用オプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールを続行できますが、Plugin の `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    この CLI フラグは Plugin の install/update フローに適用されます。Gateway バックの Skill 依存関係インストールは対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用しますが、`openclaw skills install` は引き続き別個の ClawHub Skill ダウンロード/インストールフローです。

    ClawHub で公開した Plugin がレジストリスキャンによってブロックされる場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール場所でもあります。パッケージのインストールではなく、フィルター済みのフック可視性とフックごとの有効化には `openclaw hooks` を使用してください。

    npm spec は**レジストリ限定**です（パッケージ名 + 任意の**正確なバージョン**または **dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールは安全のため、シェルにグローバル npm インストール設定があっても `--ignore-scripts` 付きでプロジェクトローカルに実行されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ローンチ移行期間中は、裸のパッケージ spec も npm から直接インストールされます。

    裸の spec と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がそれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 Plugin id（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` のクローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリへクローンし、指定された ref がある場合はチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーによるインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、Gateway メソッドや CLI コマンドなどのランタイム登録を確認してください。Plugin が `api.registerCli` で CLI ルートを登録している場合は、たとえば `openclaw demo-plugin ping` のように、そのコマンドを OpenClaw ルート CLI から直接実行します。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` のみを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball で、レジストリインストールで使用されるものと同じ管理された npm ルートインストール経路をテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` 検証、巻き上げられた依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、Plugin extensions ルート配下のローカルアーカイブとして引き続きインストールされます。

    Claude マーケットプレイスインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ローンチ移行期間中、裸の npm 安全な Plugin spec はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみによる解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に広告されている Plugin API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブ経路でインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証経路で引き続きインストールされます。記録されたインストールは、後の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョン指定のない ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるよう、バージョンなしの記録済み spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### マーケットプレイス短縮表記

Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` にマーケットプレイス名が存在する場合は、`plugin@marketplace` 短縮表記を使用します。

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
  <Tab title="マーケットプレイスのソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルのマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まっている必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブでは、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル Skills、Claude command-skills、Claude `settings.json` のデフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  表形式ビューから、ソース/由来/バージョン/有効化メタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加え、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` は、まず永続化されたローカル Plugin レジストリを読み込み、レジストリがないか無効な場合はマニフェストのみから導出したフォールバックを使います。Plugin がインストール済みか、有効化済みか、コールドスタート計画から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook の実行を期待する前に、そのチャンネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から得た各 Plugin の `dependencyStatus` が含まれます。OpenClaw はそれらのパッケージ名が、その Plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。Plugin ランタイムコードの import、パッケージマネージャーの実行、欠落依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin 作業を行う場合は、Plugin ソースディレクトリを、`/app/extensions/synology-chat` のような対応するパッケージ済みソースパスへバインドマウントしてください。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは不活性なままなので、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使われます。

ランタイム hook のデバッグには次を使います。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みによる検査パスから登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。従来の依存関係状態をクリーンにする、または設定から参照されているダウンロード可能な欠落 Plugin を復旧するには、`openclaw doctor --fix` を使ってください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、設定パス、RPC ヘルスを確認します。
- 非バンドルの会話 hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使います（`plugins.load.paths` に追加します）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクインストールは管理対象インストール先へコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使うと、デフォルトの非固定動作を維持しながら、解決された厳密な spec（`name@version`）を管理対象 Plugin インデックスに保存します。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなく機械管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にそれを書き込みます。トップレベルの `installRecords` マップは、壊れた Plugin マニフェストや欠落 Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェストから導出されたコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使用されます。

OpenClaw が設定内で出荷済みの従来型 `plugins.installs` レコードを見つけると、それらを Plugin インデックスに移動して設定キーを削除します。どちらかの書き込みに失敗した場合は、インストールメタデータが失われないように設定レコードを保持します。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは追跡対象の管理対象インストールディレクトリが OpenClaw の Plugin extensions ルート内にある場合、そのディレクトリも削除します。Active Memory Plugin では、メモリスロットが `memory-core` にリセットされます。

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

更新は、管理対象 Plugin インデックス内の追跡対象 Plugin インストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tag や厳密に固定されたバージョンは、以後の `update <id>` 実行でも引き続き使われます。

    npm インストールでは、dist-tag または厳密なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに解決されます。Plugin が厳密なバージョンに固定されていて、レジストリのデフォルトリリースラインへ戻したい場合に使います。

  </Accordion>
  <Accordion title="Beta チャンネル更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャンネルを認識します。beta チャンネルでは、デフォルトラインの npm と ClawHub Plugin レコードはまず `@beta` を試し、Plugin の beta リリースが存在しない場合は記録済みの default/latest spec にフォールバックします。厳密なバージョンと明示的なタグは、そのセレクタに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID がすでに解決済みターゲットと一致する場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えを行わずにスキップされます。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変わっている場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待値と実際のハッシュを出力し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、閉じた状態で失敗します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中の組み込み危険コードスキャンの誤検知に対する break-glass オーバーライドとして、`plugins update` でも使用できます。それでも Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは回避せず、Plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

inspect は、デフォルトでは Plugin ランタイムを import せずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバー対応を表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hook、tool、コマンド、サービス、Gateway メソッド、HTTP ルートを含めます。ランタイム検査は欠落している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは、ルートの `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` で `cliCommands` の下にコマンドが表示されたら、`openclaw <command> ...` として実行します。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 つの capability type（例: provider 専用 Plugin）
- **hybrid-capability** — 複数の capability type（例: text + speech + images）
- **hook-only** — hook のみで、capabilities や surfaces はなし
- **non-capability** — tools/commands/services はあるが capabilities はなし

機能モデルの詳細は [Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト作成や監査に適した機械可読レポートを出力します。`inspect --all` は、形状、capability 種別、互換性通知、バンドル機能、hook 概要の列を含むフリート全体の表を表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin 読み込みエラー、マニフェスト/検出診断、互換性通知を報告します。すべてがクリーンな場合は `No plugin issues detected.` と出力します。

設定済み Plugin がディスク上に存在するものの、ローダーのパス安全性チェックによってブロックされている場合、設定検証は Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、直前のブロックされた Plugin 診断を修正してください。

`register`/`activate` export の欠落などのモジュール形状の失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトな export 形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化状態、ソースメタデータ、コントリビューション所有権について OpenClaw が永続化するコールド読み取りモデルです。通常の起動、プロバイダー所有者の検索、チャンネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

永続化されたレジストリが存在するか、最新か、古くなっているかを調べるには、`plugins registry` を使用します。永続化された Plugin インデックス、設定ポリシー、manifest/package メタデータから再構築するには、`--refresh` を使用します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ周辺の管理対象 npm のドリフトも修復します。管理対象 Plugin npm ルート配下の孤立または復旧された `@openclaw/*` package が bundled Plugin を覆い隠している場合、doctor はその古い package を削除してレジストリを再構築し、起動時に bundled manifest に対して検証されるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗向けの非推奨の非常用互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。env フォールバックは、移行のロールアウト中に緊急で起動を復旧する場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルマーケットプレイスのパス、`marketplace.json` のパス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析されたマーケットプレイス manifest と Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
