---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:15:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

プラグイン、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ja-JP/tools/plugin">
    プラグインのインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Manage plugins" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例。
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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

低速なインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を指定してコマンドを実行します。このトレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin ライフサイクルの変更系操作は無効です。このインストールには `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、`plugins disable` の代わりに Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
バンドルされたプラグインは OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、`cursor`）と、検出されたバンドル機能も表示されます。
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
裸のパッケージ名は、ローンチ切り替え期間中はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。Plugin のインストールはコードを実行するものとして扱ってください。固定バージョンの使用を推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、インストール可能なパッケージ名を出力します。検索対象はコード Plugin とバンドル Plugin パッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどのプラグインにおける主要な配布および発見の場です。npm は引き続き、対応済みのフォールバックおよび直接インストール経路です。OpenClaw 所有の `@openclaw/*` Plugin パッケージは再び npm で公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールでは `latest` を使用します。ベータチャンネルのインストールと更新では、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟オーバーライドを伴うインクルードは、フラット化せずに失敗クローズします。サポートされている形状については、[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常失敗クローズし、まず `openclaw doctor --fix` を実行するよう通知します。Gateway 起動時およびホットリロード時には、無効な Plugin 設定は他の無効な設定と同様に失敗クローズします。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしているプラグイン向けの、限定的なバンドル Plugin 復旧経路です。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから同じ ID を意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みの Plugin ID に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、本当に別ソースから現在のインストールを上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされていません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` ではサポートされていません。マーケットプレイスインストールは npm spec ではなく、マーケットプレイスソースのメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーにおける誤検知用の非常手段オプションです。組み込みスキャナーが `critical` findings を報告した場合でもインストールを続行できますが、Plugin の `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    この CLI フラグは Plugin のインストール/更新フローに適用されます。Gateway 経由の skill 依存関係インストールでは、対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub skill ダウンロード/インストールフローのままです。

    ClawHub で公開した Plugin がレジストリスキャンによってブロックされる場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。フィルタリングされたフックの可視性やフックごとの有効化には `openclaw hooks` を使用し、パッケージインストールには使用しません。

    npm specs は**レジストリ限定**です（パッケージ名 + 任意の**正確なバージョン**または **dist-tag**）。Git/URL/file specs と semver 範囲は拒否されます。依存関係のインストールは安全のため、シェルにグローバル npm インストール設定があっても、プロジェクトローカルで `--ignore-scripts` を付けて実行されます。管理対象 Plugin の npm ルートは OpenClaw のパッケージレベル npm `overrides` を継承するため、ホスト側のセキュリティ固定は hoist された Plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用してください。裸のパッケージ specs も、ローンチ切り替え期間中は npm から直接インストールされます。

    裸の specs と `@latest` は安定版トラックのままです。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がこれらのいずれかをプレリリースへ解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 Plugin ID（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git repositories">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールでは一時ディレクトリにクローンし、要求された ref が存在する場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、Gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` で CLI ルートを登録している場合は、OpenClaw ルート CLI からそのコマンドを直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    ファイルが npm-pack tarball で、レジストリインストールで使用される同じ管理対象 npm ルートのインストール経路をテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` 検証、hoist された依存関係のスキャン、npm インストール記録が含まれます。プレーンなアーカイブパスは引き続き、Plugin 拡張ルート配下にローカルアーカイブとしてインストールされます。

    Claude マーケットプレイスインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

裸の npm セーフな Plugin specs は、ローンチ切り替え期間中はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm 限定の解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公開されているプラグイン API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付きの npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブ経路でインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証経路で引き続きインストールされます。記録されたインストールは、後続の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョンなしの ClawHub インストールは、バージョンなしの記録済み spec を保持するため、`openclaw plugins update` は新しい ClawHub リリースを追従できます。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

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
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知のマーケットプレイス名
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ短縮表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、プラグインエントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェストからの HTTP(S)、絶対パス、git、GitHub、およびその他の非パスのプラグインソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw プラグイン (`openclaw.plugin.json`)
- Codex 互換バンドル (`.codex-plugin/plugin.json`)
- Claude 互換バンドル (`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト)
- Cursor 互換バンドル (`.cursor-plugin/plugin.json`)

<Note>
互換バンドルは通常のプラグインルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル Skills、Claude コマンド Skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor コマンド Skills、および互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  有効化済みプラグインのみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブルビューから、ソース/由来/バージョン/有効化メタデータを含むプラグインごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` は、永続化されたローカルプラグインレジストリを最初に読み取り、レジストリがないか無効な場合はマニフェストのみから導出したフォールバックを使用します。これは、プラグインがインストール済み、有効化済み、コールドスタート計画に表示可能かを確認するのに便利ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。プラグインコード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hooks が実行されることを期待する前に、そのチャネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から各プラグインの `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名がプラグインの通常の Node `node_modules` ルックアップパス上に存在するかを確認します。プラグインのランタイムコードを import したり、パッケージマネージャーを実行したり、欠落した依存関係を修復したりはしません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態を調べたり、設定を変更したり、パッケージをインストールしたり、プラグインランタイムコードを読み込んだりはしません。検索結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドルプラグインを扱う場合は、プラグインのソースディレクトリを、`/app/extensions/synology-chat` のような対応するパッケージ済みソースパス上に bind mount します。OpenClaw は、そのマウントされたソースオーバーレイを `/app/dist/extensions/synology-chat` より先に検出します。単にコピーされたソースディレクトリは非アクティブなままなので、通常のパッケージ済みインストールは引き続きコンパイル済み dist を使用します。

ランタイム hook のデバッグでは、次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュールを読み込んだ検査パスから、登録済み hooks と診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態をクリーンアップしたり、設定から参照されている欠落したダウンロード可能プラグインを復旧したりするには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、設定パス、および RPC ヘルスを確認します。
- 非バンドルの会話 hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには、`--link` を使用します (`plugins.load.paths` に追加されます)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクインストールは管理対象インストール先へ上書きコピーするのではなくソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルトの固定なし動作を維持しつつ、解決済みの正確な spec (`name@version`) を管理対象プラグインインデックスに保存できます。
</Note>

### プラグインインデックス

プラグインインストールメタデータは機械管理の状態であり、ユーザー設定ではありません。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にそれを書き込みます。最上位の `installRecords` map は、破損または欠落したプラグインマニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェストから導出されたコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、およびコールドプラグインレジストリで使用されます。

OpenClaw が設定内の出荷済みレガシー `plugins.installs` レコードを検出した場合、ランタイム読み取りはそれらを互換性入力として扱い、`openclaw.json` は書き換えません。明示的なプラグイン書き込みと `openclaw doctor --fix` は、設定書き込みが許可されている場合、それらのレコードをプラグインインデックスに移動し、設定キーを削除します。どちらかの書き込みに失敗した場合は、インストールメタデータが失われないように設定レコードが保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合、`plugins.entries`、永続化されたプラグインインデックス、プラグイン allow/deny list エントリ、およびリンクされた `plugins.load.paths` エントリからプラグインレコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、追跡対象の管理対象インストールディレクトリが OpenClaw のプラグイン拡張ルート内にある場合、それも削除します。Active Memory プラグインでは、メモリスロットが `memory-core` にリセットされます。

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

更新は、管理対象プラグインインデックス内の追跡対象プラグインインストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="プラグイン id と npm spec の解決">
    プラグイン id を渡すと、OpenClaw はそのプラグインに記録済みのインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tags や正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象プラグインレコードに解決し直し、そのインストール済みプラグインを更新し、今後の id ベース更新のために新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象プラグインレコードに解決されます。プラグインが正確なバージョンに固定されていて、レジストリのデフォルトリリースラインに戻したい場合に使用します。

  </Accordion>
  <Accordion title="ベータチャネルの更新">
    `openclaw plugins update` は、新しい spec を渡さない限り追跡対象プラグイン spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャネルを認識します。ベータチャネルでは、デフォルトラインの npm と ClawHub プラグインレコードは最初に `@beta` を試し、プラグインのベータリリースが存在しない場合は、記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="バージョン確認と integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID が、解決されたターゲットとすでに一致している場合、ダウンロード、再インストール、`openclaw.json` の書き換えなしで更新はスキップされます。

    保存済み integrity ハッシュが存在し、取得されたアーティファクトハッシュが変化した場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待値と実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、閉じた状態で失敗します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、プラグイン更新中の組み込み危険コードスキャンの誤検知に対する緊急時のオーバーライドとして、`plugins update` でも使用できます。それでもプラグインの `before_install` ポリシーブロックやスキャン失敗によるブロックは回避せず、プラグイン更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトではプラグインランタイムを import せずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバー対応を表示します。プラグインモジュールを読み込み、登録済み hooks、tools、commands、services、gateway methods、および HTTP routes を含めるには、`--runtime` を追加します。ランタイム検査は、欠落したプラグイン依存関係を直接報告します。インストールと修復は、`openclaw plugins install`、`openclaw plugins update`、および `openclaw doctor --fix` に留まります。

プラグイン所有の CLI コマンドは通常、ルート `openclaw` コマンドグループとしてインストールされますが、プラグインは `openclaw nodes` のようなコア親の下にネストされたコマンドを登録することもできます。`inspect --runtime` が `cliCommands` の下にコマンドを表示したら、表示されたパスで実行します。たとえば、`demo-git` を登録するプラグインは `openclaw demo-git ping` で検証できます。

各プラグインは、ランタイムで実際に登録する内容によって分類されます:

- **plain-capability** — 1つのケイパビリティ種別（例: プロバイダー専用Plugin）
- **hybrid-capability** — 複数のケイパビリティ種別（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみで、ケイパビリティやサーフェスはなし
- **non-capability** — ツール/コマンド/サービスはあるがケイパビリティはなし

ケイパビリティモデルの詳細は、[Pluginの形状](/ja-JP/plugins/architecture#plugin-shapes)を参照してください。

<Note>
`--json` フラグは、スクリプト処理や監査に適した機械可読レポートを出力します。`inspect --all` は、形状、ケイパビリティ種別、互換性通知、バンドルケイパビリティ、フック概要の列を含むフリート全体の表を表示します。`info` は `inspect` のエイリアスです。
</Note>

### 診断

```bash
openclaw plugins doctor
```

`doctor` は、Pluginの読み込みエラー、マニフェスト/検出の診断、互換性通知を報告します。すべて問題がない場合は `No plugin issues detected.` と出力します。

設定済みのPluginがディスク上に存在するものの、ローダーのパス安全性チェックによってブロックされている場合、設定検証はPluginエントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` 設定を削除するのではなく、パスの所有権や全員書き込み可能な権限など、先行するブロック済みPluginの診断を修正してください。

`register`/`activate` エクスポートの欠落など、モジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトなエクスポート形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカルPluginレジストリは、インストール済みPluginの識別情報、有効化状態、ソースメタデータ、コントリビューション所有権に関する、OpenClawの永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者の検索、チャンネルセットアップ分類、Pluginインベントリは、Pluginランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古くなっているかを確認します。`--refresh` を使用すると、永続化されたPluginインデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築します。これは修復パスであり、ランタイム有効化パスではありません。

`openclaw doctor --fix` は、レジストリ隣接の管理対象npmドリフトも修復します。管理対象Plugin npmルート配下の孤立または復旧された `@openclaw/*` パッケージがバンドルPluginを隠している場合、doctor はその古いパッケージを削除し、レジストリを再構築して、起動時にバンドルマニフェストに対して検証されるようにします。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の非推奨の緊急互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この環境変数フォールバックは、移行の展開中に緊急起動復旧を行う場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のようなGitHub省略形、GitHubリポジトリURL、またはgit URLを受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイスマニフェストとPluginエントリを出力します。

## 関連情報

- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [CLIリファレンス](/ja-JP/cli)
- [コミュニティPlugin](/ja-JP/plugins/community)
