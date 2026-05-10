---
read_when:
    - Gateway Pluginまたは互換バンドルをインストールまたは管理したい
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` のCLIリファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin を管理" href="/ja-JP/plugins/manage-plugins">
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

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの時間を stderr に書き込み、JSON 出力は解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード (`OPENCLAW_NIX_MODE=1`) では、Plugin ライフサイクルの変更操作は無効です。このインストールには `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、`plugins disable` ではなく Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効です（例: バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空であっても `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

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

セットアップ時インストールをテストするメンテナーは、保護された環境変数で自動 Plugin インストールソースを上書きできます。[Plugin インストール上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
起動移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。Plugin インストールはコードを実行するものとして扱ってください。固定バージョンを優先してください。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、インストール可能なパッケージ名を出力します。検索対象はコード Plugin パッケージとバンドル Plugin パッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの Plugin にとって主要な配布および検出の場です。npm は引き続き、サポートされるフォールバックおよび直接インストール経路です。OpenClaw 所有の `@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールは `latest` を使用します。ベータチャネルのインストールと更新は、npm の `beta` dist-tag が利用可能な場合はそれを優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定 include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟上書きを伴う include は、平坦化せずに失敗して閉じます。サポートされる形状については[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、通常 `plugins install` は失敗して閉じ、先に `openclaw doctor --fix` を実行するよう伝えます。Gateway 起動時およびホットリロード時には、無効な Plugin 設定は他の無効な設定と同様に失敗して閉じます。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした Plugin のための、限定的なバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みの Plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、現在のインストールを別ソースから本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。固定ソースが必要な場合は `git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされません。marketplace インストールは npm spec ではなく marketplace ソースメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールを続行できますが、Plugin の `before_install` フックポリシーブロックは**バイパスせず**、スキャン失敗も**バイパスしません**。

    この CLI フラグは Plugin のインストール/更新フローに適用されます。Gateway 経由の Skill 依存関係インストールでは、対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は別個の ClawHub Skill ダウンロード/インストールフローのままです。

    ClawHub で公開した Plugin がレジストリスキャンによってブロックされている場合は、[ClawHub](/ja-JP/clawhub/security) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。パッケージのインストールではなく、フィルター済みフック表示とフック単位の有効化には `openclaw hooks` を使用してください。

    npm spec は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または **dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係インストールは、シェルにグローバル npm インストール設定がある場合でも、安全のため `--ignore-scripts` を付けてプロジェクトローカルで実行されます。管理対象 Plugin の npm ルートは OpenClaw のパッケージレベル npm `overrides` を継承するため、ホストのセキュリティピンはホイストされた Plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用してください。起動移行期間中は、裸のパッケージ spec も npm から直接インストールされます。

    裸の spec と `@latest` は安定トラックのままです。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定リリースです。npm がそれらのいずれかをプレリリースへ解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 Plugin id（例: `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（例: `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用してください。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、Gateway メソッドや CLI コマンドなどのランタイム登録を検証するために `openclaw plugins inspect <id> --runtime --json` を使用してください。Plugin が `api.registerCli` で CLI ルートを登録している場合は、OpenClaw ルート CLI を通じてそのコマンドを直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開後の Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールで使用されるものと同じ管理対象 npm ルートのインストールパスをテストしたい場合は、`npm-pack:<path.tgz>` を使用してください。これには `package-lock.json` 検証、ホイストされた依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、Plugin extensions ルート配下にローカルアーカイブとして引き続きインストールされます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールは明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

起動移行期間中、裸の npm セーフな Plugin spec はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 専用解決を明示するには `npm:` を使用してください。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公開されている Plugin API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付きの npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパス経由でインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証パス経由で引き続きインストールされます。記録されたインストールは、後続の更新に備えて、ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェストの事実を保持します。
バージョン指定のない ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるように、バージョン指定なしの記録済み spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` などの明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### マーケットプレイス省略記法

マーケットプレイス名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` 由来の Claude 既知マーケットプレイス名
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` などの GitHub リポジトリ省略記法
    - `https://github.com/owner/repo` などの GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub または git から読み込まれたリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  テーブルビューから、ソース/由来/バージョン/アクティベーションメタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル Plugin レジストリを読み取り、レジストリが存在しないか無効な場合はマニフェストのみから導出したフォールバックを使用します。これは、Plugin がインストール済みで有効化され、コールドスタート計画から見えるかどうかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook が実行されることを期待する前に、そのチャネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の
`dependencies` と `optionalDependencies` から得られる各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` 検索パス上に存在するかを確認します。Plugin ランタイムコードの import、パッケージマネージャーの実行、不足している依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、config の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin 作業を行う場合は、Plugin ソースディレクトリを、`/app/extensions/synology-chat` などの対応するパッケージ化済みソースパスに bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より先にそのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは動作しないため、通常のパッケージ化済みインストールは引き続きコンパイル済み dist を使用します。

ランタイム hook のデバッグには次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込み済み検査パスから登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態を整理したり、config から参照されている不足ダウンロード可能 Plugin を復旧したりするには、`openclaw doctor --fix` を使用します。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスヒント、config パス、RPC ヘルスを確認します。
- バンドルされていない会話 hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリをコピーしないようにするには `--link` を使用します（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクインストールは管理対象インストール先へコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルト動作は固定なしのまま、解決された正確な spec（`name@version`）を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー config ではなく機械管理状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` に書き込みます。そのトップレベルの `installRecords` map は、壊れた Plugin マニフェストや欠落している Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、uninstall、診断、コールド Plugin レジストリで使用されます。

OpenClaw が config 内の出荷済みレガシー `plugins.installs` レコードを見つけた場合、ランタイム読み取りはそれらを `openclaw.json` に書き戻さずに互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、config 書き込みが許可されている場合、それらのレコードを Plugin インデックスへ移動し、config キーを削除します。どちらかの書き込みに失敗した場合は、インストールメタデータが失われないように config レコードが保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny list エントリ、および該当する場合はリンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、追跡対象の管理対象インストールディレクトリが OpenClaw の Plugin extensions ルート内にある場合、そのディレクトリも削除します。Active Memory Plugin では、メモリスロットは `memory-core` にリセットされます。

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
  <Accordion title="Resolving plugin id vs npm spec">
    Plugin id を渡すと、OpenClaw はその Plugin に記録済みのインストール spec を再利用します。つまり、以前に保存された `@beta` などの dist-tag や、正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象 Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象 Plugin レコードに解決されます。Plugin が正確なバージョンに固定されていて、レジストリのデフォルトリリースラインに戻したい場合に使用します。

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` は、新しい spec を渡さない限り追跡対象 Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が、解決されたターゲットとすでに一致している場合、ダウンロード、再インストール、`openclaw.json` の書き換えなしで更新はスキップされます。

    保存済みの integrity ハッシュが存在し、取得されたアーティファクトハッシュが変わっている場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、失敗して閉じます。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` は、Plugin 更新中の組み込み危険コードスキャンの誤検知に対する非常時 override として、`plugins update` でも使用できます。ただし、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続きバイパスせず、Plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect はデフォルトでは Plugin ランタイムを import せずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバーサポートを表示します。Plugin モジュールを読み込み、登録済み hook、tools、commands、services、gateway methods、HTTP routes を含めるには、`--runtime` を追加します。ランタイム検査は不足している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` で行います。

Plugin 所有の CLI コマンドは通常、ルート `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` などのコア親の下にネストされたコマンドを登録することもできます。`inspect --runtime` で `cliCommands` 配下のコマンドを確認したら、表示されたパスで実行してください。たとえば、`demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 種類の capability タイプ（例: provider 専用 plugin）
- **hybrid-capability** — 複数の capability タイプ（例: テキスト + 音声 + 画像）
- **hook-only** — hook のみで、capability や surface はなし
- **non-capability** — tools/commands/services はあるが capability はなし

capability モデルの詳細は [Plugin の形態](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト処理や監査に適した機械可読レポートを出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、hook summary の列を含むフリート全体の表を表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、plugin の load エラー、manifest/discovery 診断、compatibility notices を報告します。すべて問題がない場合は `No plugin issues detected.` と表示します。

設定済みの plugin がディスク上に存在するものの、loader の path-safety チェックによってブロックされている場合、config validation は plugin entry を保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` config を削除するのではなく、パス所有権や world-writable 権限など、先に表示された blocked-plugin 診断を修正してください。

`register`/`activate` export の欠落など module-shape の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力に簡潔な export-shape サマリーが含まれます。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル plugin registry は、インストール済み plugin の identity、enablement、source metadata、contribution ownership に関する OpenClaw の永続化された cold read model です。通常の起動、provider owner lookup、channel setup classification、plugin inventory は、plugin runtime modules を import せずにこれを読み取れます。

永続化された registry が存在するか、最新か、古くなっているかを確認するには `plugins registry` を使用します。永続化された plugin index、config policy、manifest/package metadata から再構築するには `--refresh` を使用します。これは repair path であり、runtime activation path ではありません。

`openclaw doctor --fix` は、registry に隣接する managed npm drift も修復します。managed plugin npm root 配下の孤立または復旧された `@openclaw/*` package が bundled plugin を隠している場合、doctor はその古い package を削除し、registry を再構築して、起動時に bundled manifest に対して検証できるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、registry read 失敗時の非推奨の緊急互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env fallback は、移行のロールアウト中に緊急の起動復旧が必要な場合のみ使用します。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list は、ローカル marketplace パス、`marketplace.json` パス、`owner/repo` のような GitHub shorthand、GitHub repo URL、または git URL を受け付けます。`--json` は、解決された source label に加えて、解析済みの marketplace manifest と plugin entries を出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/ja-JP/clawhub)
