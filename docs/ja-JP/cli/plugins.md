---
read_when:
    - Gateway プラグインまたは互換バンドルをインストールまたは管理したい
    - Plugin の読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` の CLI リファレンス (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin
x-i18n:
    generated_at: "2026-05-02T20:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin システム" href="/ja-JP/tools/plugin">
    Plugin のインストール、有効化、トラブルシューティングのエンドユーザー向けガイド。
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

遅いインストール、検査、アンインストール、またはレジストリ更新の調査では、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を付けてコマンドを実行します。トレースはフェーズごとのタイミングを stderr に書き込み、JSON 出力を解析可能なままにします。[デバッグ](/ja-JP/help/debugging#plugin-lifecycle-trace)を参照してください。

<Note>
同梱 Plugin は OpenClaw に付属します。一部はデフォルトで有効です（たとえば同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー Plugin）。それ以外は `plugins enable` が必要です。

ネイティブ OpenClaw Plugin は、インライン JSON Schema（空でも `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` は `Format: openclaw` または `Format: bundle` を表示します。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
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
ベアパッケージ名は、ローンチ切り替え期間中はデフォルトで npm からインストールされます。ClawHub には `clawhub:<package>` を使用します。Plugin インストールはコードを実行するものとして扱ってください。ピン留めされたバージョンを推奨します。
</Warning>

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、インストール可能なパッケージ名を出力します。検索対象は code-plugin と bundle-plugin のパッケージであり、Skills ではありません。ClawHub Skills には `openclaw skills search` を使用してください。

<Note>
ClawHub はほとんどの Plugin の主要な配布および発見サーフェスです。Npm は引き続きサポートされるフォールバックおよび直接インストールの経路です。ClawHub への移行中も、OpenClaw は OpenClaw 所有の一部の `@openclaw/*` Plugin パッケージを npm で配布しています。これらのパッケージバージョンは、Plugin リリース列の間で同梱ソースより遅れる場合があります。npm が OpenClaw 所有の Plugin パッケージを非推奨と報告する場合、その公開済みバージョンは古い外部アーティファクトです。より新しい npm パッケージが公開されるまでは、現在の OpenClaw に同梱されている Plugin またはローカルチェックアウトを使用してください。
</Note>

<AccordionGroup>
  <Accordion title="設定インクルードと無効な設定の復旧">
    `plugins` セクションが単一ファイルの `$include` によって裏付けられている場合、`plugins install/update/enable/disable/uninstall` はそのインクルード先ファイルに書き込み、`openclaw.json` は変更しません。ルートインクルード、インクルード配列、兄弟オーバーライドを伴うインクルードは、平坦化せずに fail closed します。サポートされる形については、[設定インクルード](/ja-JP/gateway/configuration)を参照してください。

    インストール中に設定が無効な場合、通常 `plugins install` は fail closed し、先に `openclaw doctor --fix` を実行するよう伝えます。Gateway 起動中は、1つの Plugin の無効な設定はその Plugin に隔離されるため、他のチャネルや Plugin は実行を継続できます。`openclaw doctor --fix` は無効な Plugin エントリを隔離できます。文書化されているインストール時の例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインした Plugin 向けの限定的な同梱 Plugin 復旧パスのみです。

  </Accordion>
  <Accordion title="--force と再インストール対更新">
    `--force` は既存のインストール先を再利用し、すでにインストール済みの Plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm Plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みの Plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を案内し、現在のインストールを別のソースから本当に上書きしたい場合は `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin のスコープ">
    `--pin` は npm インストールにのみ適用されます。`git:` インストールではサポートされません。ソースをピン留めしたい場合は、`git:github.com/acme/plugin@v1.2.3` のような明示的な git ref を使用してください。`--marketplace` では、npm spec の代わりにマーケットプレイスのソースメタデータを永続化するため、サポートされません。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールの継続を許可しますが、Plugin の `before_install` フックポリシーブロックはバイパス**せず**、スキャン失敗もバイパス**しません**。

    この CLI フラグは Plugin の install/update フローに適用されます。Gateway 経由の Skill 依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub Skill ダウンロード/インストールフローのままです。

    ClawHub に公開した Plugin がレジストリスキャンでブロックされた場合は、[ClawHub](/ja-JP/tools/clawhub) の公開者向け手順を使用してください。

  </Accordion>
  <Accordion title="フックパックと npm spec">
    `plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックのインストールサーフェスでもあります。パッケージインストールではなく、フィルタリングされたフックの可視性とフック単位の有効化には `openclaw hooks` を使用してください。

    Npm spec は**レジストリのみ**です（パッケージ名 + 任意の**厳密なバージョン**または**dist-tag**）。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールは、安全性のため、シェルにグローバル npm インストール設定がある場合でも、`--ignore-scripts` を付けてプロジェクトローカルで実行されます。

    npm 解決を明示したい場合は `npm:<package>` を使用します。ローンチ切り替え期間中は、ベアパッケージ spec も npm から直接インストールされます。

    ベア spec と `@latest` は安定版トラックに留まります。npm がこれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような厳密なプレリリースバージョンで明示的にオプトインするよう求めます。

    ベアインストール spec が公式 Plugin id（たとえば `diffs`）と一致する場合、OpenClaw はカタログエントリを直接インストールします。同じ名前の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="Git リポジトリ">
    git リポジトリから直接インストールするには `git:<repo>` を使用します。サポートされる形式には、`git:github.com/owner/repo`、`git:owner/repo`、完全な `https://`、`ssh://`、`git://`、`file://`、および `git@host:owner/repo.git` クローン URL が含まれます。インストール前にブランチ、タグ、またはコミットをチェックアウトするには `@<ref>` または `#<ref>` を追加します。

    Git インストールは一時ディレクトリにクローンし、要求された ref がある場合はチェックアウトしてから、通常の Plugin ディレクトリインストーラーを使用します。つまり、マニフェスト検証、危険コードスキャン、パッケージマネージャーのインストール作業、インストール記録は npm インストールと同様に動作します。記録された git インストールには、ソース URL/ref と解決済みコミットが含まれるため、`openclaw plugins update` は後でソースを再解決できます。

    git からインストールした後は、`openclaw plugins inspect <id> --runtime --json` を使用して、gateway メソッドや CLI コマンドなどのランタイム登録を確認します。Plugin が `api.registerCli` で CLI ルートを登録した場合は、OpenClaw ルート CLI を通じてそのコマンドを直接実行します。例: `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="アーカイブ">
    サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。ネイティブ OpenClaw Plugin アーカイブには、展開された Plugin ルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` しか含まないアーカイブは、OpenClaw がインストール記録を書き込む前に拒否されます。

    Claude マーケットプレイスのインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

ローンチ切り替え期間中、ベアな npm-safe Plugin spec はデフォルトで npm からインストールされます。

```bash
openclaw plugins install openclaw-codex-app-server
```

npm のみの解決を明示するには `npm:` を使用します。

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw はインストール前に、公開されている Plugin API / 最小 Gateway 互換性を確認します。選択された ClawHub バージョンが ClawPack アーティファクトを公開している場合、OpenClaw はバージョン付き npm-pack `.tgz` をダウンロードし、ClawHub ダイジェストヘッダーとアーティファクトダイジェストを検証してから、通常のアーカイブパスを通じてインストールします。ClawPack メタデータのない古い ClawHub バージョンは、従来のパッケージアーカイブ検証パスを通じて引き続きインストールされます。記録されたインストールは、後の更新のために ClawHub ソースメタデータ、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェスト情報を保持します。
バージョン指定のない ClawHub インストールは、`openclaw plugins update` がより新しい ClawHub リリースを追跡できるよう、バージョン指定のない記録済み spec を保持します。`clawhub:pkg@1.2.3` や `clawhub:pkg@beta` のような明示的なバージョンまたはタグセレクターは、そのセレクターにピン留めされたままです。

#### マーケットプレイス省略記法

Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` にマーケットプレイス名が存在する場合は、`plugin@marketplace` 省略記法を使用します。

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
    - `~/.claude/plugins/known_marketplaces.json` にある Claude の既知のマーケットプレイス名
    - ローカルマーケットプレイスのルート、または `marketplace.json` パス
    - `owner/repo` のような GitHub リポジトリ省略表記
    - `https://github.com/owner/repo` のような GitHub リポジトリ URL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHub または git から読み込まれるリモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まる必要があります。OpenClaw は、そのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、およびその他の非パス Plugin ソースを拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについて、OpenClaw は自動検出します。

- ネイティブ OpenClaw plugins (`openclaw.plugin.json`)
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
  有効化済みの plugins だけを表示します。
</ParamField>
<ParamField path="--verbose" type="boolean">
  テーブル表示から、ソース/出所/バージョン/有効化メタデータを含む Plugin ごとの詳細行に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリに加えて、レジストリ診断とパッケージ依存関係のインストール状態を出力します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカル Plugin レジストリを読み込み、レジストリがないか無効な場合はマニフェストのみから派生したフォールバックを使います。Plugin がインストール済みか、有効か、コールドスタート計画から見えるかを確認するには有用ですが、すでに実行中の Gateway プロセスに対するライブランタイムプローブではありません。Plugin コード、有効化状態、hook ポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードや hooks の実行を期待する前に、そのチャンネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

`plugins list --json` には、`package.json` の `dependencies` と `optionalDependencies` から得た各 Plugin の `dependencyStatus` が含まれます。OpenClaw は、それらのパッケージ名が Plugin の通常の Node `node_modules` 探索パス上に存在するかを確認します。Plugin のランタイムコードの import、パッケージマネージャーの実行、欠落した依存関係の修復は行いません。
</Note>

`plugins search` はリモート ClawHub カタログ検索です。ローカル状態の検査、設定の変更、パッケージのインストール、Plugin ランタイムコードの読み込みは行いません。検索結果には、ClawHub パッケージ名、ファミリー、チャンネル、バージョン、概要、および `openclaw plugins install clawhub:<package>` のようなインストールヒントが含まれます。

パッケージ化された Docker イメージ内でバンドル Plugin 作業を行う場合は、Plugin ソースディレクトリを、たとえば `/app/extensions/synology-chat` のような一致するパッケージ済みソースパスに bind-mount します。OpenClaw は、そのマウントされたソースオーバーレイを `/app/dist/extensions/synology-chat` より先に検出します。単にコピーされたソースディレクトリは不活性なままなので、通常のパッケージ済みインストールでは引き続きコンパイル済み dist が使われます。

ランタイム hook のデバッグには、次を使います。

- `openclaw plugins inspect <id> --runtime --json` は、モジュール読み込みによる inspection パスから登録済み hooks と診断を表示します。ランタイム inspection は依存関係をインストールしません。レガシー依存関係状態のクリーンアップや、設定済みのダウンロード可能 plugins の欠落依存関係のインストールには、`openclaw doctor --fix` を使ってください。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、設定パス、RPC の健全性を確認します。
- 非バンドル conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) には `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリのコピーを避けるには `--link` を使います (`plugins.load.paths` に追加します)。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクされたインストールは管理対象のインストール先に上書きコピーする代わりにソースパスを再利用するため、`--force` は `--link` と併用できません。

npm インストールで `--pin` を使うと、解決された正確な spec (`name@version`) を管理対象 Plugin インデックスに保存しつつ、デフォルトの動作は unpinned のままにできます。
</Note>

### Plugin インデックス

Plugin インストールメタデータは、ユーザー設定ではなく機械管理の状態です。インストールと更新は、アクティブな OpenClaw 状態ディレクトリ配下の `plugins/installs.json` にそれを書き込みます。最上位の `installRecords` map は、壊れた、または欠落した Plugin マニフェストのレコードを含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには編集禁止の警告が含まれ、`openclaw plugins update`、uninstall、診断、コールド Plugin レジストリで使われます。

OpenClaw が設定内に出荷済みレガシーの `plugins.installs` レコードを見つけると、それらを Plugin インデックスに移動し、設定キーを削除します。どちらかの書き込みに失敗した場合は、インストールメタデータが失われないように設定内のレコードが保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、永続化された Plugin インデックス、Plugin allow/deny list エントリ、および該当する場合はリンク済みの `plugins.load.paths` エントリから Plugin レコードを削除します。`--keep-files` が設定されていない限り、uninstall は、OpenClaw の Plugin extensions ルート内にある追跡対象の管理インストールディレクトリも削除します。Active Memory plugins では、メモリスロットが `memory-core` にリセットされます。

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

更新は、管理対象 Plugin インデックス内の追跡対象 Plugin インストールと、`hooks.internal.installs` 内の追跡対象 hook-pack インストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClaw はその Plugin に記録されたインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tags や、正確に pin されたバージョンは、後続の `update <id>` 実行でも使われ続けます。

    npm インストールでは、dist-tag または正確なバージョンを含む明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象 Plugin レコードに解決し、そのインストール済み Plugin を更新し、今後の id ベース更新用に新しい npm spec を記録します。

    バージョンやタグなしで npm パッケージ名を渡した場合も、追跡対象 Plugin レコードに解決されます。Plugin が正確なバージョンに pin されていて、レジストリのデフォルトリリースラインへ戻したい場合に使います。

  </Accordion>
  <Accordion title="ベータチャンネル更新">
    `openclaw plugins update` は、新しい spec を渡さない限り、追跡対象の Plugin spec を再利用します。`openclaw update` はさらに、アクティブな OpenClaw 更新チャンネルを把握しています。ベータチャンネルでは、default-line npm と ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は記録済みの default/latest spec にフォールバックします。正確なバージョンと明示的なタグは、その selector に pin されたままです。

  </Accordion>
  <Accordion title="バージョンチェックと integrity drift">
    ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済み artifact identity が解決済みターゲットとすでに一致している場合、更新はダウンロード、再インストール、`openclaw.json` の書き換えなしにスキップされます。

    保存済み integrity hash が存在し、取得した artifact hash が変わった場合、OpenClaw はそれを npm artifact drift として扱います。対話型の `openclaw plugins update` コマンドは、期待値と実際の hash を表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを提供しない限り fail closed します。

  </Accordion>
  <Accordion title="更新時の --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin 更新中の組み込み dangerous-code scan の false positives に対する break-glass override として、`plugins update` でも利用できます。ただし、Plugin の `before_install` ポリシーブロックや scan-failure blocking は引き続きバイパスせず、Plugin 更新のみに適用され、hook-pack 更新には適用されません。
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect は、デフォルトでは Plugin ランタイムを import せずに、identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities、および検出された MCP または LSP server サポートを表示します。`--runtime` を追加すると、Plugin モジュールを読み込み、登録済み hooks、tools、commands、services、gateway methods、HTTP routes を含めます。ランタイム inspection は欠落した Plugin 依存関係を直接報告します。インストールと修復は `openclaw plugins install`、`openclaw plugins update`、`openclaw doctor --fix` に残ります。

Plugin 所有の CLI commands は、ルート `openclaw` command groups としてインストールされます。`inspect --runtime` が `cliCommands` の下に command を表示したら、`openclaw <command> ...` として実行します。たとえば `demo-git` を登録する Plugin は、`openclaw demo-git ping` で検証できます。

各 Plugin は、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1 種類の capability type (例: provider-only Plugin)
- **hybrid-capability** — 複数の capability types (例: text + speech + images)
- **hook-only** — hooks のみで、capabilities や surfaces はなし
- **non-capability** — tools/commands/services はあるが capabilities はなし

capability model の詳細は [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` flag は、スクリプト処理と監査に適した機械可読レポートを出力します。`inspect --all` は、shape、capability kinds、compatibility notices、bundle capabilities、hook summary columns を含む fleet-wide table を描画します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Plugin load errors、manifest/discovery diagnostics、compatibility notices を報告します。すべて問題がない場合は `No plugin issues detected.` と出力します。

`register`/`activate` exports の欠落などの module-shape failures では、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力に compact export-shape summary が含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル Plugin レジストリは、インストール済み Plugin の identity、enablement、source metadata、contribution ownership に関する、OpenClaw の永続化されたコールド read model です。通常の起動、provider owner lookup、channel setup classification、Plugin inventory は、Plugin ランタイムモジュールを import せずにこれを読み取れます。

永続化されたレジストリが存在するか、最新か、古いかを確認するには `plugins registry` を使います。永続化された Plugin インデックス、config policy、manifest/package metadata から再構築するには `--refresh` を使います。これは修復パスであり、ランタイム有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗に対する非推奨の緊急時互換性スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この環境変数フォールバックは、移行の展開中に緊急の起動復旧を行う場合にのみ使用します。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析されたマーケットプレイスマニフェストと Plugin エントリを出力します。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [CLI リファレンス](/ja-JP/cli)
- [コミュニティ Plugin](/ja-JP/plugins/community)
