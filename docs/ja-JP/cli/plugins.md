---
read_when:
    - Gateway Pluginまたは互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
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

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin ライフサイクルの変更操作は無効です。このインストールでは、`plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、`plugins disable` の代わりに Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効化されます（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、`cursor`）と検出されたバンドル機能も表示されます。
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
ローンチ切り替え期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。Plugin のインストールはコードを実行するのと同じように扱ってください。ピン留めされたバージョンを推奨します。
</Warning>

`plugins search` は、インストール可能な Plugin パッケージを ClawHub に問い合わせ、インストール可能なパッケージ名を出力します。検索対象は code-plugin パッケージと bundle-plugin パッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの Plugin にとって主要な配布および発見の場です。Npm は、サポートされるフォールバックおよび直接インストールの経路として残ります。OpenClaw 所有の `@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールでは `latest` を使用します。ベータチャンネルのインストールと更新では、npm の `beta` dist-tag が利用可能な場合はそれを優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="Config インクルードと無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟オーバーライドを持つインクルードは、平坦化する代わりにフェイルクローズします。サポートされる形については、[Config インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、通常 `plugins install` はフェイルクローズし、先に `openclaw doctor --fix` を実行するよう通知します。Gateway の起動中およびホットリロード中は、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。インストール時に文書化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしている Plugin 向けの、限定的なバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードでは、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードでは `plugins update <id-or-npm-spec>` を、別のソースから現在のインストールを本当に上書きしたい場合は `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin の範囲">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。ソースをピン留めしたい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされません。マーケットプレイスインストールは npm spec ではなく、マーケットプレイスのソースメタデータを保持するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する非常用オプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールの続行を許可しますが、Plugin の `before_install` フックポリシーブロックをバイパスすることは**なく**、スキャン失敗をバイパスすることも**ありません**。

    この CLI フラグは、Plugin の install/update フローに適用されます。Gateway が処理する skill 依存関係のインストールでは、対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub skill ダウンロード/インストールフローのままです。

    ClawHub に公開した Plugin がレジストリスキャンでブロックされた場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。フィルタリングされたフックの可視性とフックごとの有効化には `openclaw hooks` を使用し、パッケージインストールには使用しません。

    Npm spec は**レジストリのみ**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールは、安全のため `--ignore-scripts` を付けてプロジェクトローカルに実行されます。シェルにグローバル npm install 設定がある場合でも同様です。管理対象 Plugin の npm ルートは OpenClaw のパッケージレベル npm `overrides` を継承するため、ホストのセキュリティピンは hoist された Plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ローンチ切り替え期間中は、裸のパッケージ spec も npm から直接インストールされます。

    裸の spec と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような従来の OpenClaw 修正版も、このチェックでは引き続き安定版リリースとして扱われるため、古いパッケージも安全に更新され続けます。新しい月次サポートラインの作業では、ハイフン付き修正サフィックスではなく通常の SemVer パッチ番号を使用する予定です。npm がデフォルトラインの spec をプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 Plugin id（例: `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（例: `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、要求された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` で CLI ルートを登録した場合は、そのコマンドを OpenClaw ルート CLI 経由で直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブは、展開された Plugin ルートに有効な `openclaw.plugin.json` を含む必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールで使用されるものと同じ管理対象 npm ルートのインストールパスをテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには、`package-lock.json` 検証、hoist された依存関係のスキャン、npm インストール記録が含まれます。通常のアーカイブパスは、引き続き Plugin extensions ルート配下にローカルアーカイブとしてインストールされます。

    Claude マーケットプレイスインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ローンチ切り替え期間中、裸の npm-safe Plugin spec はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公開されている Plugin API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパス経由でインストールします。ClawPack メタデータがない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証パス経由でインストールされます。記録されたインストールは、後続の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョン指定なしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるように、バージョン指定なしの記録済み spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` などの明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### マーケットプレイス短縮表記

マーケットプレイス名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 短縮表記を使用します。

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
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` などの GitHub repo 短縮表記
    - `https://github.com/owner/repo` などの GitHub repo URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイス repo の内部に留まる必要があります。OpenClaw はその repo からの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugins (`openclaw.plugin.json`)
- Codex 互換バンドル (`.codex-plugin/plugin.json`)
- Claude 互換バンドル (`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト)
- Cursor 互換バンドル (`.cursor-plugin/plugin.json`)

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  有効な Plugins のみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブルビューから、ソース/出所/バージョン/アクティベーションメタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加え、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` は、まず永続化されたローカル Plugin レジストリを読み取り、レジストリがないか無効な場合はマニフェストのみから導出したフォールバックを使用します。Plugin がインストール済み、有効、かつコールドスタートアップ計画に見えているかを確認するのに有用ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードまたは hooks の実行を期待する前に、そのチャネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の
`dependencies` と `optionalDependencies` から得られる各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。Plugin ランタイムコードのインポート、パッケージマネージャーの実行、または不足依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、config の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` などのインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin を扱う場合は、Plugin ソースディレクトリを、対応するパッケージ化済みソースパス、たとえば `/app/extensions/synology-chat` に bind-mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前にそのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは無効のままなので、通常のパッケージ化インストールは引き続きコンパイル済み dist を使用します。

ランタイム hook のデバッグには次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みの検査パスから登録済み hooks と診断を表示します。ランタイム検査は依存関係をインストールしません。従来の依存関係状態を整理したり、config で参照されている不足したダウンロード可能 Plugins を復旧したりするには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、config パス、RPC ヘルスを確認します。
- 非バンドル会話 hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使用します (`plugins.load.paths` に追加されます)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクインストールは管理対象のインストール先に上書きコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルト動作は固定しないまま、解決済みの正確な spec (`name@version`) を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー config ではなく機械管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にこれを書き込みます。そのトップレベルの `installRecords` マップは、壊れている、または欠落している Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェストから導出されたコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使用されます。

OpenClaw が config 内に出荷済みの従来の `plugins.installs` レコードを見つけた場合、ランタイム読み取りはそれらを `openclaw.json` を書き換えずに互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、config 書き込みが許可されている場合にそれらのレコードを Plugin インデックスへ移動し、config キーを削除します。どちらかの書き込みが失敗した場合、インストールメタデータが失われないように config レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny list エントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは OpenClaw の Plugin extensions ルート内にある追跡対象の管理インストールディレクトリも削除します。Active Memory Plugins では、memory slot が `memory-core` にリセットされます。

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

更新は、管理対象 Plugin インデックスで追跡されている Plugin インストールと、`hooks.internal.installs` で追跡されている hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` などの dist-tags や正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm package spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに逆解決し、そのインストール済み Plugin を更新して、将来の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに逆解決されます。Plugin が正確なバージョンに固定されていて、それをレジストリのデフォルトリリースラインに戻したい場合に使用します。

  </Accordion>
  <Accordion title="ベータチャネル更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクターに固定されたままです。

    OpenClaw はまだ LTS または monthly support Plugin チャネルを公開していません。計画中の support-line 作業では、Plugin パッケージと ClawHub タグが core パッケージと同じ support line に従う必要があります。

  </Accordion>
  <Accordion title="バージョン確認と integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm registry メタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が解決済みターゲットとすでに一致している場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えを行わずにスキップされます。

    保存された integrity hash が存在し、取得したアーティファクトハッシュが変化した場合、OpenClaw はそれを npm artifact drift として扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り fail closed します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中の built-in dangerous-code scan の false positives に対する break-glass override として、`plugins update` でも利用できます。それでも Plugin `before_install` ポリシーブロックや scan-failure blocking はバイパスされず、Plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect はデフォルトでは Plugin ランタイムをインポートせずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP server サポートを表示します。`--runtime` を追加すると Plugin モジュールを読み込み、登録済み hooks、tools、commands、services、gateway methods、HTTP routes を含めます。ランタイム検査は不足している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは、ルート `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` の下にコマンドを表示したら、`openclaw <command> ...` として実行します。たとえば `demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 つの機能タイプ（例: プロバイダー専用 Plugin）
- **hybrid-capability** — 複数の機能タイプ（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみで、機能やサーフェスはなし
- **non-capability** — ツール/コマンド/サービスはあるが機能はなし

機能モデルの詳細は [Plugin の形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化や監査に適した機械可読レポートを出力します。`inspect --all` は、形状、機能の種類、互換性通知、バンドル機能、フック概要の列を含む全体テーブルを表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin の読み込みエラー、マニフェスト/検出診断、互換性通知を報告します。すべて問題ない場合は `No plugin issues detected.` と表示します。

設定済みの Plugin がディスク上に存在するものの、ローダーのパス安全性チェックによってブロックされている場合、設定検証は Plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、直前のブロックされた Plugin の診断を修正してください。

`register`/`activate` エクスポートの欠落など、モジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトなエクスポート形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化状態、ソースメタデータ、コントリビューション所有権について、OpenClaw が永続化するコールド読み取りモデルです。通常の起動、プロバイダー所有者の検索、チャネル設定の分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取ることができます。

`plugins registry` を使用すると、永続化されたレジストリが存在するか、最新か、古いかを確認できます。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ周辺の管理対象 npm ドリフトも修復します。管理対象 Plugin npm ルート配下にある孤立または復元された `@openclaw/*` パッケージがバンドル済み Plugin を隠している場合、doctor はその古いパッケージを削除し、レジストリを再構築して、起動時にバンドル済みマニフェストに対して検証できるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗用の非推奨の緊急互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行の展開中に緊急の起動復旧が必要な場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
