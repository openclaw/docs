---
read_when:
    - Gateway Plugin または互換バンドルをインストールまたは管理したい場合
    - Pluginの読み込み失敗をデバッグしたい
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-11T20:27:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
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

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの所要時間を stderr に書き込み、JSON 出力を解析可能なまま保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、plugin ライフサイクルの変更操作は無効化されます。`plugins install`、`plugins update`、`plugins uninstall`、`plugins enable`、または `plugins disable` の代わりに、このインストールには Nix ソースを使用してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。
</Note>

<Note>
同梱 plugins は OpenClaw とともに出荷されます。一部はデフォルトで有効です（たとえば同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw plugins は、インライン JSON Schema（空であっても `configSchema`）を含む `openclaw.plugin.json` を出荷する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力では、バンドルサブタイプ（`codex`、`claude`、または `cursor`）と、検出されたバンドル機能も表示されます。
</Note>

### インストール

```bash
openclaw plugins search "calendar"                   # ClawHub plugins を検索
openclaw plugins install <package>                      # デフォルトは npm
openclaw plugins install clawhub:<package>              # ClawHub のみ
openclaw plugins install npm:<package>                  # npm のみ
openclaw plugins install npm-pack:<path.tgz>            # npm install セマンティクスによるローカル npm pack
openclaw plugins install git:github.com/<owner>/<repo>  # git リポジトリ
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # 既存のインストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカルパス
openclaw plugins install <plugin>@<marketplace>         # マーケットプレイス
openclaw plugins install <plugin> --marketplace <name>  # マーケットプレイス（明示）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

セットアップ時インストールをテストするメンテナーは、保護された環境変数で自動 plugin インストールソースを上書きできます。[Plugin インストール上書き](/ja-JP/plugins/install-overrides)を参照してください。

<Warning>
ローンチ移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用してください。plugin のインストールはコードを実行するものとして扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な plugin パッケージを問い合わせ、インストールに使えるパッケージ名を出力します。検索対象は code-plugin と bundle-plugin パッケージであり、Skills ではありません。ClawHub skills には `openclaw skills search` を使用してください。

<Note>
ClawHub は、ほとんどの plugins の主要な配布および発見サーフェスです。npm は、サポートされるフォールバックおよび直接インストール経路として残ります。OpenClaw 所有の `@openclaw/*` plugin パッケージは再び npm で公開されています。現在の一覧は [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または [plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版インストールでは `latest` を使用します。ベータチャンネルのインストールと更新では、npm の `beta` dist-tag が利用可能な場合はそれを優先し、その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定の include と無効な設定の修復">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルへ書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟の上書きを持つ include は、フラット化する代わりに fail closed します。サポートされる形については[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常 fail closed し、先に `openclaw doctor --fix` を実行するよう指示します。Gateway 起動中およびホットリロード中は、無効な plugin 設定は他の無効な設定と同様に fail closed します。`openclaw doctor --fix` は無効な plugin エントリを隔離できます。インストール時の唯一の文書化された例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした plugins のための限定的な同梱 plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用してください。すでに追跡されている npm plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内し、別ソースから現在のインストールを本当に上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールのみに適用されます。`git:` インストールではサポートされません。固定ソースが必要な場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` でもサポートされません。マーケットプレイスインストールは npm spec ではなく、マーケットプレイスソースのメタデータを保持するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する非常用オプションです。組み込みスキャナーが `critical` findings を報告した場合でもインストールの続行を許可しますが、plugin の `before_install` フックポリシーブロックはバイパスせず、スキャン失敗もバイパスしません。

    この CLI フラグは plugin install/update フローに適用されます。Gateway-backed skill dependency installs は対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は別個の ClawHub skill download/install フローのままです。

    ClawHub で公開した plugin がレジストリスキャンによってブロックされている場合は、[ClawHub](/ja-JP/clawhub/security)の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm specs">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージのインストールではなく、フィルタリングされたフックの可視性とフックごとの有効化には `openclaw hooks` を使用してください。

    npm specs は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file specs と semver 範囲は拒否されます。依存関係のインストールは、シェルにグローバル npm install 設定がある場合でも、安全のため `--ignore-scripts` を付けてプロジェクトローカルで実行されます。管理対象 plugin の npm ルートは OpenClaw の package-level npm `overrides` を継承するため、ホストのセキュリティピンは hoisted plugin 依存関係にも適用されます。

    npm 解決を明示したい場合は `npm:<package>` を使用してください。ローンチ移行期間中は、裸の package specs も npm から直接インストールされます。

    裸の specs と `@latest` は安定版トラックに留まります。`2026.5.3-1` のような OpenClaw の日付付き修正版は、このチェックでは安定版リリースです。npm がそれらのいずれかを prerelease に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease tag、または `@1.2.3-beta.4` のような正確な prerelease version で明示的にオプトインするよう求めます。

    裸の install spec が公式 plugin id（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的な scoped spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリへクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストールレコードは npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を検証します。plugin が `api.registerCli` で CLI ルートを登録した場合は、OpenClaw ルート CLI からそのコマンドを直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw plugin アーカイブには、展開された plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストールレコードを書き込む前に拒否されます。

    ファイルが npm-pack tarball であり、レジストリインストールで使われるものと同じ管理対象 npm-root インストールパスをテストしたい場合は、`npm-pack:<path.tgz>` を使用します。これには `package-lock.json` 検証、hoisted dependency scanning、npm install records が含まれます。通常のアーカイブパスは、引き続き plugin extensions root の下にローカルアーカイブとしてインストールされます。

    Claude marketplace installs もサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

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

OpenClaw は、インストール前に公開されている Plugin API / 最小 Gateway 互換性を確認します。選択した ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータのない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証パスを通じてインストールされます。記録されたインストールには、後続の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報が保持されます。
バージョン指定のない ClawHub インストールでは、バージョンなしの記録済み spec を保持するため、`openclaw plugins update` は新しい ClawHub リリースを追跡できます。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### マーケットプレイス省略記法

マーケットプレイス名が `~/.claude/plugins/known_marketplaces.json` にある Claude のローカルレジストリキャッシュに存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub repo 省略記法
    - `https://github.com/owner/repo` のような GitHub repo URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイス repo 内に留まる必要があります。OpenClaw はその repo からの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin (`openclaw.plugin.json`)
- Codex 互換バンドル (`.codex-plugin/plugin.json`)
- Claude 互換バンドル (`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト)
- Cursor 互換バンドル (`.cursor-plugin/plugin.json`)

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現時点では、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  テーブルビューから、ソース/出所/バージョン/有効化メタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読のインベントリに加え、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` は永続化されたローカル Plugin レジストリを最初に読み取り、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使用します。これは、Plugin がインストール済みか、有効か、コールドスタート計画から見えるかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードまたは hook が実行されることを期待する前に、そのチャンネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の
`dependencies` と `optionalDependencies` から取得した各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ
名が Plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。Plugin ランタイムコードの import、パッケージマネージャーの実行、欠落した
依存関係の修復は行いません。
</Note>

`plugins search` はリモートの ClawHub カタログ検索です。ローカル
状態の検査、config の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索
結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、概要、および
`openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin を扱う場合は、Plugin
ソースディレクトリを、`/app/extensions/synology-chat` のような対応するパッケージ済みソースパスの上に bind mount します。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソース
オーバーレイを検出します。単にコピーされたソース
ディレクトリは動作しないため、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使用されます。

ランタイム hook のデバッグでは、次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みの検査パスから登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。従来の依存関係状態をクリーンアップする、または config で参照されているダウンロード可能な Plugin の欠落を回復するには、`openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、config パス、RPC ヘルスを確認します。
- バンドルされていない会話 hook (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリをコピーしないようにするには、`--link` を使用します (`plugins.load.paths` に追加されます)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象インストールターゲットに上書きコピーするのではなくソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルトの挙動は固定なしのまま、解決済みの正確な spec (`name@version`) を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー config ではなく機械管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にそれを書き込みます。最上位の `installRecords` map は、壊れた、または欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、uninstall、診断、コールド Plugin レジストリで使用されます。

OpenClaw が config 内に出荷済みの従来の `plugins.installs` レコードを見つけた場合、ランタイム読み取りは `openclaw.json` を書き換えずに、それらを互換性入力として扱います。明示的な Plugin 書き込みと `openclaw doctor --fix` は、config 書き込みが許可されている場合、それらのレコードを Plugin インデックスへ移動し、config キーを削除します。いずれかの書き込みに失敗した場合、インストールメタデータが失われないように config レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny list エントリ、および該当する場合はリンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、uninstall は、OpenClaw の Plugin extensions ルート内にある追跡対象の管理対象インストールディレクトリも削除します。active memory Plugin の場合、memory slot は `memory-core` にリセットされます。

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

更新は、管理対象 Plugin インデックス内の追跡対象 Plugin インストール、および `hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tag や正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の id ベース更新のために新しい npm spec を記録します。

    バージョンまたはタグなしで npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに解決されます。Plugin が正確なバージョンに固定されていて、それをレジストリのデフォルトリリースラインに戻したい場合に使用します。

  </Accordion>
  <Accordion title="Beta チャンネル更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャンネルを認識します。beta チャンネルでは、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin の beta リリースが存在しない場合は記録された default/latest spec にフォールバックします。そのフォールバックは警告として報告され、core 更新は失敗しません。正確なバージョンと明示的なタグは、そのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm registry メタデータと照合します。インストール済みバージョンと記録済みアーティファクト identity が、解決されたターゲットとすでに一致している場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えなしにスキップされます。

    保存された integrity ハッシュが存在し、取得したアーティファクトハッシュが変化している場合、OpenClaw はそれを npm artifact drift として扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、fail closed します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中の組み込み dangerous-code scan の false positive に対する break-glass override として、`plugins update` でも利用できます。ただし、Plugin の `before_install` ポリシーブロックや scan-failure blocking は回避せず、Plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは Plugin ランタイムを import せずに、identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities、および検出された MCP または LSP server support を表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hook、tool、command、service、gateway method、HTTP route を含めます。ランタイム検査は、欠落した Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に留まります。

Plugin 所有の CLI コマンドは通常、ルートの `openclaw` コマンドグループとしてインストールされますが、Plugin は `openclaw nodes` のような core parent 配下にネストされたコマンドを登録することもできます。`inspect --runtime` が `cliCommands` 配下にコマンドを表示したら、表示されたパスで実行します。たとえば `demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1つのケイパビリティタイプ（例: provider のみの plugin）
- **hybrid-capability** — 複数のケイパビリティタイプ（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみ。ケイパビリティやサーフェスはなし
- **non-capability** — ツール/コマンド/サービスはあるが、ケイパビリティはなし

ケイパビリティモデルの詳細については、[Plugin の形態](/ja-JP/plugins/architecture#plugin-shapes)を参照してください。

<Note>
`--json` フラグは、スクリプト作成や監査に適した機械可読レポートを出力します。`inspect --all` は、形態、ケイパビリティ種別、互換性通知、バンドルケイパビリティ、フック要約の列を含むフリート全体の表をレンダリングします。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、plugin のロードエラー、manifest/discovery 診断、互換性通知を報告します。すべて問題がない場合は `No plugin issues detected.` と表示します。

設定済みの plugin がディスク上に存在するものの、loader のパス安全性チェックによってブロックされている場合、設定検証は plugin エントリを保持し、`present but blocked` として報告します。`plugins.entries.<id>` や `plugins.allow` 設定を削除するのではなく、パスの所有権や world-writable 権限など、直前のブロックされた plugin 診断を修正してください。

`register`/`activate` export の欠落などのモジュール形態の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトな export 形態の要約が含まれます。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル plugin registry は、インストール済み plugin の ID、有効化状態、ソースメタデータ、コントリビューション所有権に関する OpenClaw の永続化された cold read モデルです。通常の起動、provider 所有者検索、channel セットアップ分類、plugin インベントリは、plugin runtime モジュールを import せずにこれを読み取れます。

永続化された registry が存在するか、最新か、古くなっているかを確認するには、`plugins registry` を使用します。永続化された plugin index、config policy、manifest/package metadata から再構築するには `--refresh` を使用します。これは修復パスであり、runtime activation パスではありません。

`openclaw doctor --fix` は、registry 周辺の managed npm drift も修復します。managed plugin npm root 配下にある orphaned または recovered の `@openclaw/*` package が bundled plugin をシャドウしている場合、doctor はその古い package を削除し、startup が bundled manifest に対して検証されるよう registry を再構築します。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、registry 読み取り失敗時の非推奨の緊急互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env fallback は、migration の展開中に emergency startup recovery が必要な場合にのみ使用します。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list は、ローカル marketplace パス、`marketplace.json` パス、`owner/repo` のような GitHub shorthand、GitHub repo URL、または git URL を受け付けます。`--json` は、解決済み source label に加えて、解析された marketplace manifest と plugin entries を出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [ClawHub](/ja-JP/clawhub)
