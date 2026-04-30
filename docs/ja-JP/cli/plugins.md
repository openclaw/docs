---
read_when:
    - Gateway Pluginや互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、deps、doctor）'
title: Plugins
x-i18n:
    generated_at: "2026-04-30T05:06:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

インストール、検査、アンインストール、またはレジストリ更新の調査が遅い場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとの所要時間を stderr に書き込み、JSON 出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドル済みPluginは OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザーPlugin）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルサブタイプ（`codex`、`claude`、または `cursor`）に加えて、検出されたバンドル機能も表示されます。
</Note>

### インストール

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
裸のパッケージ名は、まず ClawHub、次に npm に対して確認されます。Pluginインストールはコードを実行するものとして扱ってください。ピン留めされたバージョンを優先してください。
</Warning>

<Note>
ClawHub は、ほとんどのPluginにとって主要な配布および発見の場です。npm は、フォールバックおよび直接インストールの経路として引き続きサポートされます。ClawHub への移行中、OpenClaw は OpenClaw 所有の一部の `@openclaw/*` Pluginパッケージを npm で引き続き公開しています。これらのパッケージバージョンは、Pluginリリース列車の間でバンドル済みソースより遅れることがあります。npm が OpenClaw 所有のPluginパッケージを非推奨として報告する場合、その公開バージョンは古い外部成果物です。新しい npm パッケージが公開されるまでは、現在の OpenClaw にバンドルされたPlugin、またはローカルチェックアウトを使用してください。
</Note>

<AccordionGroup>
  <Accordion title="設定のインクルードと無効な設定の復旧">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟オーバーライドを持つインクルードは、平坦化されるのではなくフェイルクローズします。サポートされる形状については、[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常フェイルクローズし、先に `openclaw doctor --fix` を実行するよう案内します。Gateway 起動中は、1つのPluginの無効な設定はそのPluginに隔離されるため、他のチャネルとPluginは実行を継続できます。`openclaw doctor --fix` は無効なPluginエントリを隔離できます。インストール時に文書化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしたPlugin向けの限定的なバンドル済みPlugin復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストール vs 更新">
    `--force` は既存のインストール対象を再利用し、インストール済みのPluginまたはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm 成果物から意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を優先してください。

    すでにインストール済みのPlugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内します。現在のインストールを別のソースから本当に上書きしたい場合は、`plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。マーケットプレイスインストールは npm spec ではなくマーケットプレイスソースメタデータを保持するため、`--marketplace` ではサポートされません。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する非常用オプションです。組み込みスキャナーが `critical` findings を報告した場合でもインストールの継続を許可しますが、Plugin の `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    この CLI フラグは、Pluginのインストール/更新フローに適用されます。Gateway によって裏付けられた Skill 依存関係インストールは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用しますが、`openclaw skills install` は別個の ClawHub Skill ダウンロード/インストールフローのままです。

    ClawHub で公開したPluginがレジストリスキャンによってブロックされた場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。パッケージのインストールではなく、フィルタリングされたフック表示とフックごとの有効化には `openclaw hooks` を使用してください。

    npm spec は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係インストールは、シェルにグローバル npm インストール設定がある場合でも、安全のため `--ignore-scripts` を付けてプロジェクトローカルで実行されます。

    ClawHub の検索をスキップして npm から直接インストールしたい場合は、`npm:<package>` を使用します。裸のパッケージ spec は引き続き ClawHub を優先し、ClawHub にそのパッケージまたはバージョンがない場合にのみ npm にフォールバックします。

    裸の spec と `@latest` は安定版トラックに留まります。npm がそれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストール spec がバンドル済みPlugin id（たとえば `diffs`）と一致する場合、OpenClaw はバンドル済みPluginを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開後のPluginルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    Claude マーケットプレイスインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw は現在、裸の npm 安全Plugin spec についても ClawHub を優先します。ClawHub にそのパッケージまたはバージョンがない場合にのみ npm にフォールバックします。

```bash
openclaw plugins install openclaw-codex-app-server
```

ClawHub に到達できない場合や、そのパッケージが npm にのみ存在することが分かっている場合など、npm 専用の解決を強制するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は ClawHub からパッケージアーカイブをダウンロードし、通知されているPlugin API / 最小 Gateway 互換性を確認してから、通常のアーカイブパスを通じてインストールします。記録されたインストールは、後の更新のために ClawHub ソースメタデータを保持します。
バージョン指定のない ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるよう、バージョン指定のない記録 spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターにピン留めされたままです。

#### マーケットプレイス省略記法

マーケットプレイス名が Claude の `~/.claude/plugins/known_marketplaces.json` のローカルレジストリキャッシュに存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
    - `~/.claude/plugins/known_marketplaces.json` からの Claude 既知マーケットプレイス名
    - ローカルマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略記法
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスルール">
    GitHub または git から読み込まれたリモートマーケットプレイスでは、Pluginエントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェストからの HTTP(S)、絶対パス、git、GitHub、およびその他のパス以外のPluginソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は自動検出します。

- ネイティブ OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常のPluginルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェストで宣言された `lspServers` デフォルト、Cursor command-skills、互換 Codex フックディレクトリがサポートされています。検出されたその他のバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
</Note>

### 一覧

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  有効なPluginのみを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブルビューから、ソース/出所/バージョン/有効化メタデータを含むPluginごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリとレジストリ診断。
</ParamField>

<Note>
`plugins list` は、永続化されたローカル Plugin レジストリを最初に読み取り、レジストリが存在しないか無効な場合はマニフェストのみから派生したフォールバックを使います。Plugin がインストール済み、有効、かつコールドスタート計画から可視かどうかを確認するのに役立ちますが、すでに実行中の Gateway プロセスに対するライブ実行時プローブではありません。Plugin コード、有効化状態、フックポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードやフックの実行を期待する前に、チャネルを提供する Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。
</Note>

パッケージ済み Docker イメージ内で同梱 Plugin を作業する場合は、Plugin
ソースディレクトリを、対応するパッケージ済みソースパスの上にバインドマウントします。たとえば
`/app/extensions/synology-chat` です。OpenClaw は、`/app/dist/extensions/synology-chat` より先に、そのマウントされたソースオーバーレイを検出します。単にコピーしたソース
ディレクトリは不活性なままなので、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使われます。

ランタイムフックのデバッグ:

- `openclaw plugins inspect <id> --json` は、モジュールをロードした検査パスからの登録済みフックと診断を表示します。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、設定パス、RPC の健全性を確認します。
- 非同梱の会話フック (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

`--link` を使うと、ローカルディレクトリのコピーを避けられます (`plugins.load.paths` に追加されます):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` は `--link` と併用できません。リンクインストールは、管理対象のインストール先へコピーする代わりにソースパスを再利用するためです。

npm インストールで `--pin` を使うと、デフォルト動作を固定なしのままにしつつ、解決された正確な指定 (`name@version`) を管理対象の Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなくマシン管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` に書き込みます。そのトップレベルの `installRecords` マップが、壊れたまたは欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的な情報源です。`plugins` 配列は、マニフェストから派生したコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、コールド Plugin レジストリで使われます。

OpenClaw が設定内の出荷済みレガシー `plugins.installs` レコードを検出すると、それらを Plugin インデックスへ移動し、設定キーを削除します。どちらかの書き込みに失敗した場合は、インストールメタデータが失われないように設定レコードが保持されます。

### ランタイム依存関係

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` は、Plugin 設定、有効化/設定済みのチャネル、設定済みのモデルプロバイダー、または同梱マニフェストのデフォルトによって選択された、OpenClaw 所有の同梱 Plugin 向けパッケージ済みランタイム依存関係ステージを検査します。これは、サードパーティの npm または ClawHub Plugin のインストール/更新パスではありません。

パッケージ済みインストールが Gateway 起動中または `plugins doctor` 中に、同梱ランタイム依存関係の欠落を報告する場合は `--repair` を使います。修復では、有効な同梱 Plugin の欠落している依存関係だけを、ライフサイクルスクリプトを無効にしてインストールします。`--prune` を使うと、古いパッケージレイアウトによって残された古い不明な外部ランタイム依存関係ルートを削除できます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化された Plugin インデックス、Plugin の許可/拒否リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、OpenClaw の Plugin ルート内にある追跡対象の管理インストールディレクトリも削除します。Active Memory Plugin の場合、メモリスロットは `memory-core` にリセットされます。

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

更新は、管理対象の Plugin インデックスで追跡されている Plugin インストールと、`hooks.internal.installs` で追跡されているフックパックインストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin ID と npm 指定の解決">
    Plugin ID を渡すと、OpenClaw はその Plugin に記録されたインストール指定を再利用します。つまり、以前に保存された `@beta` などの dist-tag や、正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使われます。

    npm インストールでは、dist-tag や正確なバージョンを含む明示的な npm パッケージ指定も渡せます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに逆引きし、そのインストール済み Plugin を更新し、今後の ID ベース更新用に新しい npm 指定を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象の Plugin レコードに逆引きされます。Plugin が正確なバージョンに固定されていて、レジストリのデフォルトリリースラインへ戻したい場合に使います。

  </Accordion>
  <Accordion title="バージョンチェックと整合性のドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージのバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録されたアーティファクト識別情報が解決済みターゲットとすでに一致する場合、ダウンロード、再インストール、`openclaw.json` の書き換えを行わずに更新をスキップします。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトハッシュが変わった場合、OpenClaw はそれを npm アーティファクトのドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待されるハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な続行ポリシーを指定しない限り、フェイルクローズします。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は `plugins update` でも使用でき、Plugin 更新中の組み込み危険コードスキャンの誤検知に対する非常用オーバーライドとして機能します。それでも Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスせず、フックパック更新ではなく Plugin 更新にのみ適用されます。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一の Plugin に対する詳細なイントロスペクションです。識別情報、ロード状態、ソース、登録済みのケイパビリティ、フック、ツール、コマンド、サービス、Gateway メソッド、HTTP ルート、ポリシーフラグ、診断、インストールメタデータ、バンドルケイパビリティ、検出された MCP または LSP サーバーサポートを表示します。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます:

- **plain-capability** — 1 種類のケイパビリティ種別 (例: プロバイダー専用 Plugin)
- **hybrid-capability** — 複数のケイパビリティ種別 (例: テキスト + 音声 + 画像)
- **hook-only** — フックのみで、ケイパビリティやサーフェスはありません
- **non-capability** — ツール/コマンド/サービスはありますが、ケイパビリティはありません

ケイパビリティモデルの詳細は [Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化や監査に適した機械可読レポートを出力します。`inspect --all` は、形状、ケイパビリティ種別、互換性通知、バンドルケイパビリティ、フック概要の列を含む全体横断の表を表示します。`info` は `inspect` のエイリアスです。
</Note>

### 診断

```bash
openclaw plugins doctor
```

`doctor` は、Plugin のロードエラー、マニフェスト/検出の診断、互換性通知を報告します。すべて問題がない場合は `No plugin issues detected.` を出力します。

`register`/`activate` エクスポートの欠落など、モジュール形状の失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を指定して再実行すると、診断出力にコンパクトなエクスポート形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の識別情報、有効化状態、ソースメタデータ、コントリビューション所有権に関する、OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者の検索、チャネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールをインポートせずにこれを読み取れます。

`plugins registry` を使うと、永続化されたレジストリが存在するか、最新か、古いかを検査できます。`--refresh` を使うと、永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築できます。これは修復パスであり、ランタイム有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗に対する非推奨の非常用互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。環境変数フォールバックは、移行のロールアウト中に緊急起動復旧が必要な場合にのみ使います。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決済みのソースラベルに加えて、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
