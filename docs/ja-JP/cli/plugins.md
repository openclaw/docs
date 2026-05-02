---
read_when:
    - Gateway Pluginまたは互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-02T22:17:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Gateway の Plugin、フックパック、互換バンドルを管理します。

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

インストール、検査、アンインストール、またはレジストリ更新が遅い場合の調査では、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを
stderr に書き込み、JSON 出力は解析可能な状態に保ちます。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
バンドル済み Plugin は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空であっても `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力では、バンドルサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
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
ローンチ移行期間中、裸のパッケージ名はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用します。Plugin のインストールはコードを実行するものとして扱ってください。固定バージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、
すぐにインストールできるパッケージ名を出力します。検索対象はコード Plugin とバンドル Plugin のパッケージであり、
Skills ではありません。ClawHub の Skills には `openclaw skills search` を使用します。

<Note>
ClawHub は、ほとんどの Plugin における主要な配布および発見の場です。npm は
サポートされるフォールバックおよび直接インストール経路として残ります。OpenClaw 所有の
`@openclaw/*` Plugin パッケージは npm で再び公開されています。現在の一覧は
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) または
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。安定版のインストールは `latest` を使用します。
ベータチャンネルのインストールと更新では、npm の `beta` dist-tag が利用可能な場合はそれを優先し、
その後 `latest` にフォールバックします。
</Note>

<AccordionGroup>
  <Accordion title="設定 include と無効な設定の復旧">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟オーバーライドを持つ include は、平坦化するのではなく閉じた状態で失敗します。サポートされる形状については、[設定 include](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、`plugins install` は通常、閉じた状態で失敗し、先に `openclaw doctor --fix` を実行するよう案内します。Gateway 起動中は、1 つの Plugin の無効な設定はその Plugin に分離されるため、他のチャンネルと Plugin は実行を継続できます。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。インストール時に文書化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした Plugin 向けの、限定的なバンドル済み Plugin 復旧パスです。

  </Accordion>
  <Accordion title="--force と再インストールと更新の違い">
    `--force` は既存のインストール先を再利用し、すでにインストールされている Plugin またはフックパックをその場で上書きします。新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから同じ id を意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストールされている Plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を示し、現在のインストールを別のソースから本当に上書きしたい場合には `plugins install <package> --force` を示します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。ソースを固定したい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用します。`--marketplace` でもサポートされません。マーケットプレイスインストールは npm spec ではなく、マーケットプレイスのソースメタデータを永続化するためです。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーにおける誤検知のための緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告した場合でもインストールを続行できますが、Plugin の `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    この CLI フラグは Plugin のインストール/更新フローに適用されます。Gateway 経由の skill 依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は別個の ClawHub skill ダウンロード/インストールフローのままです。

    ClawHub で公開した Plugin がレジストリスキャンでブロックされた場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストール面でもあります。フィルターされたフックの可視性とフックごとの有効化には `openclaw hooks` を使用し、パッケージのインストールには使用しません。

    npm spec は**レジストリ専用**（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）です。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールは、安全性のため、シェルにグローバル npm インストール設定がある場合でも `--ignore-scripts` 付きでプロジェクトローカルに実行されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。裸のパッケージ spec も、ローンチ移行期間中は npm から直接インストールされます。

    裸の spec と `@latest` は安定版トラックに留まります。npm がこれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリースバージョンで明示的にオプトインするよう求めます。

    裸のインストール spec が公式 Plugin id（たとえば `diffs`）に一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用します。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` のクローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには、`@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、指定された ref がある場合はそれをチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、Gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` で CLI ルートを登録した場合は、そのコマンドを OpenClaw ルート CLI 経由で直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開後の Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    Claude マーケットプレイスインストールもサポートされます。

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

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw は、インストール前に公開されている Plugin API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付きの npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータのない古い ClawHub バージョンは、引き続き従来のパッケージアーカイブ検証パスを通じてインストールされます。記録されたインストールは、後の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョン指定のない ClawHub インストールは、`openclaw plugins update` が新しい ClawHub リリースを追跡できるよう、バージョン指定のない記録済み spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターに固定されたままです。

#### マーケットプレイス省略記法

Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` にマーケットプレイス名が存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
    - `owner/repo` などの GitHub リポジトリ短縮形
    - `https://github.com/owner/repo` などの GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内にとどまる必要があります。OpenClaw はそのリポジトリからの相対パスソースを受け入れ、リモートマニフェストからの HTTP(S)、絶対パス、git、GitHub、その他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します。

- ネイティブ OpenClaw Plugin (`openclaw.plugin.json`)
- Codex 互換バンドル (`.codex-plugin/plugin.json`)
- Claude 互換バンドル (`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト)
- Cursor 互換バンドル (`.cursor-plugin/plugin.json`)

<Note>
互換バンドルは通常の Plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex hook ディレクトリがサポートされています。他の検出済みバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  テーブルビューから、source/origin/version/activation メタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` は永続化されたローカル Plugin レジストリを最初に読み取り、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使います。Plugin がインストール、有効化され、コールドスタート計画から見えているかを確認するのに便利ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hook の実行を期待する前に、チャンネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` ルックアップパス上に存在するかを確認します。Plugin ランタイムコードの import、パッケージマネージャーの実行、不足している依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` などのインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin を扱う場合は、Plugin ソースディレクトリを、`/app/extensions/synology-chat` などの対応するパッケージ済みソースパスにバインドマウントします。OpenClaw は `/app/dist/extensions/synology-chat` より前に、そのマウントされたソースオーバーレイを検出します。単にコピーされたソースディレクトリは非アクティブなままなので、通常のパッケージ済みインストールは引き続きコンパイル済み dist を使用します。

ランタイム hook のデバッグには次を使用します。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みによる検査パスから登録済み hook と診断を表示します。ランタイム検査は依存関係をインストールしません。レガシー依存関係状態のクリーンアップや、不足している設定済みダウンロード可能 Plugin のインストールには `openclaw doctor --fix` を使用してください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスヒント、設定パス、RPC ヘルスを確認します。
- 非バンドル会話 hook (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使用します (`plugins.load.paths` に追加されます)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象インストールターゲットへ上書きコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使用すると、デフォルトの未固定動作を維持しながら、解決済みの正確な spec (`name@version`) を管理対象 Plugin インデックスに保存できます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは機械管理状態であり、ユーザー設定ではありません。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にそれを書き込みます。最上位の `installRecords` マップは、壊れた、または欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェストから派生したコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、アンインストール、診断、およびコールド Plugin レジストリで使用されます。

OpenClaw が設定内で出荷済みのレガシー `plugins.installs` レコードを見つけると、それらを Plugin インデックスに移動し、設定キーを削除します。いずれかの書き込みに失敗した場合、インストールメタデータが失われないように設定レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合、`plugins.entries`、永続化された Plugin インデックス、Plugin 許可/拒否リストエントリ、リンクされた `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、アンインストールは追跡対象の管理対象インストールディレクトリが OpenClaw の Plugin extensions ルート内にある場合、それも削除します。Active Memory Plugin の場合、メモリスロットは `memory-core` にリセットされます。

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

更新は、管理対象 Plugin インデックス内で追跡されている Plugin インストールと、`hooks.internal.installs` 内で追跡されている hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前保存された `@beta` などの dist-tag や正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec も渡せます。OpenClaw はそのパッケージ名を追跡対象の Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の id ベース更新のために新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡しても、追跡対象の Plugin レコードに解決されます。Plugin が正確なバージョンに固定されていて、レジストリのデフォルトリリースラインに戻したい場合に使用します。

  </Accordion>
  <Accordion title="ベータチャンネル更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャンネルを認識します。ベータチャンネルでは、デフォルトラインの npm および ClawHub Plugin レコードは最初に `@beta` を試し、Plugin ベータリリースが存在しない場合は記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、そのセレクターに固定されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクト ID がすでに解決済みターゲットと一致する場合、ダウンロード、再インストール、`openclaw.json` の書き換えを行わずに更新はスキップされます。

    保存された integrity ハッシュが存在し、取得したアーティファクトハッシュが変わっている場合、OpenClaw はそれを npm アーティファクトドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、期待ハッシュと実際のハッシュを出力し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを指定しない限り、フェイルクローズします。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中の組み込み危険コードスキャンの誤検知に対する緊急回避策として、`plugins update` でも使用できます。それでも Plugin `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスせず、Plugin 更新にのみ適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### 検査

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは Plugin ランタイムを import せずに、ID、読み込み状態、ソース、マニフェスト機能、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバーサポートを表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hook、ツール、コマンド、サービス、gateway メソッド、HTTP ルートを含めます。ランタイム検査は不足している Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に残ります。

Plugin 所有の CLI コマンドは、ルート `openclaw` コマンドグループとしてインストールされます。`inspect --runtime` が `cliCommands` の下にコマンドを表示した後は、`openclaw <command> ...` として実行してください。たとえば、`demo-git` を登録する Plugin は `openclaw demo-git ping` で検証できます。

各 Plugin は、実際にランタイムで登録する内容によって分類されます。

- **plain-capability** — 1 種類の capability type (例: provider のみの Plugin)
- **hybrid-capability** — 複数の capability type (例: text + speech + images)
- **hook-only** — hook のみで、capabilities や surfaces はありません
- **non-capability** — tools/commands/services はありますが、capabilities はありません

機能モデルの詳細については、[Plugin 形状](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプト化と監査に適した機械可読レポートを出力します。`inspect --all` は、shape、capability kinds、互換性通知、バンドル機能、hook summary 列を含むフリート全体のテーブルをレンダリングします。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は Plugin 読み込みエラー、マニフェスト/検出診断、互換性通知を報告します。すべて問題ない場合は `No plugin issues detected.` と出力します。

`register`/`activate` export の欠落などのモジュール形状の失敗では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力にコンパクトな export 形状の概要が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の ID、有効化、ソースメタデータ、contribution 所有権に関する OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、provider owner ルックアップ、チャンネルセットアップ分類、Plugin インベントリは、Plugin ランタイムモジュールを import せずにこれを読み取れます。

`plugins registry` を使用して、永続化されたレジストリが存在するか、最新か、古くなっているかを検査します。`--refresh` を使用すると、永続化された Plugin インデックス、設定ポリシー、マニフェスト/パッケージメタデータから再構築します。これは修復パスであり、ランタイム有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗に対する非推奨の緊急用互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。環境変数によるフォールバックは、移行が展開される間の緊急時の起動復旧専用です。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルのマーケットプレイスパス、`marketplace.json` のパス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済みのマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
