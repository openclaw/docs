---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-04T04:58:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Gateway plugins、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    plugins のインストール、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="plugins を管理" href="/ja-JP/plugins/manage-plugins">
    インストール、一覧表示、更新、アンインストール、公開の簡単な例。
  </Card>
  <Card title="Plugin バンドル" href="/ja-JP/plugins/bundles">
    バンドル互換性モデル。
  </Card>
  <Card title="Plugin マニフェスト" href="/ja-JP/plugins/manifest">
    マニフェストフィールドと設定スキーマ。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security">
    plugin インストールのセキュリティ強化。
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

インストール、検査、アンインストール、または registry-refresh が遅い問題を調査する場合は、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを
stderr に書き込み、JSON 出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドル済み plugins は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw plugins には、インライン JSON Schema（空の場合でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルサブタイプ（`codex`、`claude`、または `cursor`）と、検出されたバンドル機能も表示されます。
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
ローンチ移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。plugin のインストールはコードを実行するものとして扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な plugin パッケージを問い合わせ、
インストール可能なパッケージ名を出力します。検索対象は code-plugin と bundle-plugin パッケージであり、
skills ではありません。ClawHub skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの plugins にとって主要な配布および発見の場です。Npm は
サポート対象のフォールバックおよび直接インストール経路のままです。OpenClaw 所有の
`@openclaw/*` plugin パッケージは npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールには `latest` を使用します。
ベータチャンネルのインストールと更新では、そのタグが利用可能な場合は npm の `beta` dist-tag を優先し、
その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定の include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルへ書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟 override を持つ include は、フラット化されずに fail closed します。サポートされる形については [設定 include](/ja-JP/gateway/configuration) を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常 fail closed し、先に `openclaw doctor --fix` を実行するよう指示します。Gateway 起動時とホットリロード時には、無効な plugin 設定は他の無効な設定と同様に fail closed します。`openclaw doctor --fix` は無効な plugin エントリを隔離できます。ドキュメント化されている唯一のインストール時例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした plugins 向けの限定的なバンドル済み plugin 復旧経路です。

  </Accordion>
  <Accordion title="--force と、再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内し、現在のインストールを別のソースから本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされません。marketplace インストールでは npm spec ではなく marketplace ソースメタデータを保持するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーでの誤検知に対する break-glass オプションです。組み込みスキャナーが `critical` findings を報告した場合でもインストールの続行を許可しますが、plugin の `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    この CLI フラグは plugin install/update フローに適用されます。Gateway 経由の skill 依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエスト override を使用し、`openclaw skills install` は別の ClawHub skill ダウンロード/インストールフローのままです。

    ClawHub で公開した plugin が registry スキャンによってブロックされる場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。絞り込まれたフック表示とフックごとの有効化には `openclaw hooks` を使用し、パッケージインストールには使用しません。

    Npm specs は **registry-only**（パッケージ名 + 任意の **exact version** または **dist-tag**）です。Git/URL/file specs と semver 範囲は拒否されます。依存関係のインストールは、シェルにグローバル npm インストール設定がある場合でも、安全のため project-local に `--ignore-scripts` 付きで実行されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ローンチ移行期間中は、裸のパッケージ spec も npm から直接インストールされます。

    裸の specs と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がこれらのいずれかを prerelease に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease タグまたは `@1.2.3-beta.4` のような正確な prerelease バージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 plugin id（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同じように動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後、gateway メソッドや CLI コマンドなどの runtime 登録を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。plugin が `api.registerCli` で CLI ルートを登録した場合は、OpenClaw ルート CLI からそのコマンドを直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw plugin アーカイブには、展開後の plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    Claude marketplace インストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ローンチ移行期間中、裸の npm-safe plugin specs はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm-only 解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公開されている plugin API / 最小 gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub digest ヘッダーとアーティファクト digest を検証してから、通常のアーカイブ経路でインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証経路で引き続きインストールされます。記録されたインストールは、後の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack digest facts を保持します。
バージョン指定なしの ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追従できるよう、バージョン指定なしの記録 spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグ selector は、その selector に固定されたままです。

#### Marketplace 省略記法

marketplace 名が Claude のローカル registry キャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
  <Tab title="マーケットプレイスソース">
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ短縮表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他のパス以外の plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブの場合、OpenClaw は自動検出します。

- ネイティブ OpenClaw plugins (`openclaw.plugin.json`)
- Codex 互換バンドル (`.codex-plugin/plugin.json`)
- Claude 互換バンドル (`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト)
- Cursor 互換バンドル (`.cursor-plugin/plugin.json`)

<Note>
互換バンドルは通常の plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェストで宣言された `lspServers` デフォルト、Cursor command-skills、および互換 Codex フックディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  テーブルビューから、ソース/オリジン/バージョン/アクティベーションメタデータを含む plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を表示します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル plugin レジストリを読み取り、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使います。plugin がインストール済みか、有効か、コールドスタート計画に見えるかを確認するのに有用ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。plugin コード、有効化状態、フックポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードやフックが実行されることを期待する前に、そのチャネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、各 plugin の `package.json`
`dependencies` と `optionalDependencies` から得られる `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が plugin の通常の Node `node_modules` 参照パス上に存在するかを確認します。plugin ランタイムコードのインポート、パッケージマネージャーの実行、欠落した依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル plugin を扱う場合は、plugin ソースディレクトリを、`/app/extensions/synology-chat` のような一致するパッケージ内ソースパスの上にバインドマウントしてください。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは無効なままなので、通常のパッケージ化インストールでは引き続きコンパイル済み dist が使われます。

ランタイムフックのデバッグでは、次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みによる検査パスから登録済みフックと診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態のクリーンアップや、設定済みのダウンロード可能な plugins の欠落依存関係のインストールには `openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、設定パス、および RPC の健全性を確認します。
- バンドルされていない会話フック (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリをコピーしないようにするには `--link` を使用します (`plugins.load.paths` に追加されます)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象のインストール先にコピーせずソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールでは `--pin` を使用すると、解決された正確な spec (`name@version`) を管理対象 plugin インデックスに保存しつつ、デフォルトの動作はピン留めなしのままにできます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなく機械管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にこれを書き込みます。トップレベルの `installRecords` マップは、壊れている plugin マニフェストや欠落している plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェストから派生したコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、およびコールド plugin レジストリで使用されます。

OpenClaw が設定内に同梱済みのレガシー `plugins.installs` レコードを見つけた場合、それらを plugin インデックスに移動し、設定キーを削除します。どちらかの書き込みに失敗した場合、インストールメタデータが失われないように設定レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、永続化された plugin インデックス、plugin 許可/拒否リストエントリ、および該当する場合はリンクされた `plugins.load.paths` エントリから plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、追跡対象の管理インストールディレクトリが OpenClaw の plugin extensions ルート内にある場合、そのディレクトリも削除します。active memory plugins の場合、メモリスロットは `memory-core` にリセットされます。

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
    plugin id を渡すと、OpenClaw はその plugin に記録済みのインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tag や正確にピン留めされたバージョンは、以後の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の plugin レコードに解決し、そのインストール済み plugin を更新し、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンまたはタグなしで npm パッケージ名を渡した場合も、追跡対象の plugin レコードに解決されます。plugin が正確なバージョンにピン留めされていて、レジストリのデフォルトリリースラインに戻したい場合に使用してください。

  </Accordion>
  <Accordion title="ベータチャネルの更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャネルを認識しています。ベータチャネルでは、デフォルトラインの npm および ClawHub plugin レコードはまず `@beta` を試し、plugin ベータリリースが存在しない場合は記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクタにピン留めされたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性のドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト識別情報が、解決されたターゲットとすでに一致している場合、ダウンロード、再インストール、または `openclaw.json` の書き換えを行わずに更新はスキップされます。

    保存済みの整合性ハッシュが存在し、取得されたアーティファクトハッシュが変わった場合、OpenClaw はそれを npm アーティファクトのドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待ハッシュと実際のハッシュを出力し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを提供しない限り、フェイルクローズします。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、plugin 更新中の組み込み危険コードスキャンの誤検知に対する緊急回避策として、`plugins update` でも利用できます。それでも plugin `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスせず、plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect はデフォルトでは plugin ランタイムをインポートせず、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバーサポートを表示します。`--runtime` を追加すると、plugin モジュールを読み込み、登録済みのフック、ツール、コマンド、サービス、Gateway メソッド、および HTTP ルートを含めます。ランタイム検査は、欠落している plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、および `openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは、ルートの `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` の下にコマンドを表示した後は、`openclaw <command> ...` として実行してください。たとえば、`demo-git` を登録する plugin は `openclaw demo-git ping` で検証できます。

各 plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 つの機能タイプ (例: プロバイダー専用 plugin)
- **hybrid-capability** — 複数の機能タイプ (例: テキスト + 音声 + 画像)
- **hook-only** — フックのみ、機能やサーフェスなし
- **non-capability** — ツール/コマンド/サービスはあるが機能なし

機能モデルの詳細については、[Plugin の形態](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト作成と監査に適した機械可読レポートを出力します。`inspect --all` は、形態、機能種別、互換性通知、バンドル機能、およびフック概要の列を含むフリート全体のテーブルを描画します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は plugin 読み込みエラー、マニフェスト/検出診断、および互換性通知を報告します。すべてがクリーンな場合は `No plugin issues detected.` を出力します。

設定済みの plugin がディスク上に存在しているものの、ローダーのパス安全性チェックによってブロックされている場合、設定検証は plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` または `plugins.allow` 設定を削除するのではなく、パス所有権や world-writable 権限など、その前に出ているブロックされた plugin 診断を修正してください。

`register`/`activate` エクスポートの欠落などのモジュール形状の失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、コンパクトなエクスポート形状の概要が診断出力に含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル plugin レジストリは、インストール済み plugin の ID、有効化状態、ソースメタデータ、およびコントリビューション所有権に関する、OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者検索、チャネルセットアップ分類、および plugin インベントリは、plugin ランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古くなっているかを確認します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築できます。これは修復パスであり、ランタイム有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時のための非推奨の緊急互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行のロールアウト中に緊急の起動回復を行う場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析されたマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
