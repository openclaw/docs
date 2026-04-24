---
read_when:
    - GatewayのPluginまたは互換バンドルをインストールまたは管理したい場合
    - Pluginの読み込み失敗をデバッグしたい場合
summary: '`openclaw plugins` のCLIリファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugins
x-i18n:
    generated_at: "2026-04-24T04:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

GatewayのPlugin、フックパック、互換バンドルを管理します。

関連:

- Pluginシステム: [Plugins](/ja-JP/tools/plugin)
- バンドル互換性: [Plugin bundles](/ja-JP/plugins/bundles)
- Plugin manifest + schema: [Plugin manifest](/ja-JP/plugins/manifest)
- セキュリティ強化: [Security](/ja-JP/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

同梱PluginはOpenClawに含まれています。デフォルトで有効なものもあります（たとえば
同梱モデルプロバイダー、同梱音声プロバイダー、同梱browser
plugin）。それ以外は `plugins enable` が必要です。

ネイティブOpenClaw Pluginは、インラインJSON
Schema（空でも `configSchema` が必要）を含む `openclaw.plugin.json` を提供する必要があります。
互換バンドルは代わりに独自のバンドルmanifestを使用します。

`plugins list` には `Format: openclaw` または `Format: bundle` が表示されます。詳細なlist/info
出力では、bundle subtype（`codex`、`claude`、または `cursor`）と、検出されたbundle
capabilitiesも表示されます。

### インストール

```bash
openclaw plugins install <package>                      # まずClawHub、その後npm
openclaw plugins install clawhub:<package>              # ClawHubのみ
openclaw plugins install <package> --force              # 既存のインストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカルパス
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（明示指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

プレーンなパッケージ名は、まずClawHub、次にnpmで確認されます。セキュリティ上の注意:
Pluginのインストールはコード実行と同等に扱ってください。バージョン固定を推奨します。

`plugins` セクションが単一ファイルの `$include` で管理されている場合、
`plugins install/update/enable/disable/uninstall` はそのinclude先ファイルに書き込み、
`openclaw.json` には触れません。ルートinclude、include配列、および兄弟override付きincludeは、
フラット化せずフェイルクローズします。サポートされる形については [Config includes](/ja-JP/gateway/configuration) を参照してください。

configが不正な場合、`plugins install` は通常フェイルクローズし、
まず `openclaw doctor --fix` を実行するよう案内します。唯一の文書化された例外は、
明示的に
`openclaw.install.allowInvalidConfigRecovery`
へオプトインしているPlugin向けの、限定的な同梱Plugin復旧パスです。

`--force` は既存のインストール先を再利用し、すでにインストール済みの
Pluginまたはフックパックをその場で上書きします。新しいローカルパス、archive、ClawHubパッケージ、またはnpm artifactから、
同じidを意図的に再インストールするときに使ってください。
すでに追跡されているnpm Pluginの通常の更新には、
`openclaw plugins update <id-or-npm-spec>` を推奨します。

すでにインストール済みのplugin idに対して `plugins install` を実行すると、OpenClawは
停止し、通常の更新には `plugins update <id-or-npm-spec>`、
本当に別ソースから現在のインストールを上書きしたい場合は
`plugins install <package> --force` を案内します。

`--pin` はnpmインストール専用です。`--marketplace` とは併用できません。
marketplaceインストールはnpm specではなくmarketplaceソースメタデータを保存するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーでの誤検知に対する
緊急用オプションです。組み込みスキャナーが `critical` findings を報告しても
インストールを継続できますが、pluginの `before_install` フックによるポリシーブロックや、
scan failureは**回避しません**。

このCLIフラグはplugin install/updateフローに適用されます。GatewayバックドのSkills
依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエスト
overrideを使います。一方、`openclaw skills install` は別のClawHub Skill
ダウンロード/インストールフローです。

`plugins install` は、`package.json` で `openclaw.hooks` を公開するフックパックの
インストール面でもあります。フィルタ済みのフック表示やフックごとの有効化には
パッケージインストールではなく `openclaw hooks` を使ってください。

npm specは**レジストリ専用**です（パッケージ名 + 任意の**厳密なバージョン**または
**dist-tag**）。Git/URL/file specおよびsemver rangeは拒否されます。依存関係の
インストールは安全のため `--ignore-scripts` 付きで実行されます。

プレーンspecと `@latest` はstableトラックに留まります。npmがそのいずれかをprereleaseに解決した場合、
OpenClawは停止し、`@beta`/`@rc` のようなprerelease tag、または
`@1.2.3-beta.4` のような厳密なprerelease versionで明示的にオプトインするよう求めます。

プレーンなインストールspecが同梱plugin id（たとえば `diffs`）と一致する場合、OpenClawは
同梱pluginを直接インストールします。同名のnpmパッケージをインストールしたい場合は、
明示的なscoped spec（たとえば `@scope/diffs`）を使ってください。

サポートされるarchive: `.zip`, `.tgz`, `.tar.gz`, `.tar`。

Claude marketplaceインストールもサポートされています。

ClawHubインストールでは明示的な `clawhub:<package>` locatorを使います:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClawは現在、プレーンなnpm安全plugin specに対してもClawHubを優先します。
ClawHubにそのパッケージまたはバージョンがない場合にのみnpmへフォールバックします:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClawはClawHubからパッケージarchiveをダウンロードし、通知された
plugin API / 最小gateway互換性を確認してから、通常の
archiveパス経由でインストールします。記録されたインストールには、後の更新のためにClawHub
ソースメタデータが保持されます。

marketplace名がClaudeのローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、
`plugin@marketplace` 省略記法を使用します:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplaceソースを明示的に渡したい場合は `--marketplace` を使います:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplaceソースには次のものを使用できます:

- `~/.claude/plugins/known_marketplaces.json` にあるClaude known-marketplace名
- ローカルのmarketplaceルートまたは `marketplace.json` パス
- `owner/repo` のようなGitHubリポジトリ省略記法
- `https://github.com/owner/repo` のようなGitHubリポジトリURL
- git URL

GitHubまたはgitから読み込まれたリモートmarketplaceでは、pluginエントリは
クローンされたmarketplaceリポジトリ内に留まる必要があります。OpenClawは、その
リポジトリからの相対パスsourceは受け入れますが、リモートmanifestからのHTTP(S)、絶対パス、git、GitHub、
その他の非パスplugin sourceは拒否します。

ローカルパスとarchiveでは、OpenClawは次を自動検出します:

- ネイティブOpenClaw Plugin（`openclaw.plugin.json`）
- Codex互換バンドル（`.codex-plugin/plugin.json`）
- Claude互換バンドル（`.claude-plugin/plugin.json` またはデフォルトのClaude
  component layout）
- Cursor互換バンドル（`.cursor-plugin/plugin.json`）

互換バンドルは通常のpluginルートにインストールされ、同じ
list/info/enable/disableフローに参加します。現在のところ、bundle Skills、Claude
command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` /
manifest宣言の `lspServers` デフォルト、Cursor command-skills、および互換
Codexフックディレクトリがサポートされています。その他の検出されたbundle capabilitiesは
診断/infoには表示されますが、まだランタイム実行には接続されていません。

### 一覧表示

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

読み込まれているPluginだけを表示するには `--enabled` を使います。`--verbose` を使うと、
テーブル表示から、source/origin/version/activation
メタデータ付きのPluginごとの詳細行表示に切り替わります。`--json` は機械可読なインベントリとregistry
診断を出力します。

ローカルディレクトリをコピーせずに使うには `--link` を使用します（`plugins.load.paths` に追加）:

```bash
openclaw plugins install -l ./my-plugin
```

リンクインストールは管理されたインストール先にコピーせず、source pathを再利用するため、
`--link` と `--force` は併用できません。

npmインストールで `--pin` を使うと、デフォルト動作は非固定のままにしつつ、解決された厳密spec（`name@version`）を
`plugins.installs` に保存できます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は `plugins.entries`、`plugins.installs`、
plugin allowlist、および適用される場合はリンクされた `plugins.load.paths`
エントリからpluginレコードを削除します。アクティブなメモリPluginについては、memory slotは `memory-core` にリセットされます。

デフォルトでは、アンインストールはアクティブな
state-dir pluginルート下のpluginインストールディレクトリも削除します。ディスク上のファイルを残したい場合は
`--keep-files` を使ってください。

`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は `plugins.installs` の追跡対象インストールと、`hooks.internal.installs` の追跡対象フックパック
インストールに適用されます。

plugin idを渡すと、OpenClawはその
pluginに記録されたインストールspecを再利用します。つまり、以前保存された `@beta` のようなdist-tagや
厳密に固定されたバージョンは、後の `update <id>` 実行でも引き続き使われます。

npmインストールでは、dist-tag
または厳密バージョン付きの明示的なnpm package specを渡すこともできます。OpenClawはそのパッケージ名を追跡対象plugin
レコードへ解決し、そのインストール済みpluginを更新して、将来の
idベース更新のために新しいnpm specを記録します。

バージョンやtagなしでnpm package名を渡しても、追跡対象plugin
レコードへ解決されます。pluginが厳密バージョンに固定されていて、
レジストリのデフォルトリリースラインへ戻したい場合に使ってください。

ライブのnpm更新前に、OpenClawはインストール済みパッケージのバージョンを
npmレジストリメタデータと照合します。インストール済みバージョンと記録済みartifact
identityが、解決された対象とすでに一致している場合、更新は
ダウンロード、再インストール、`openclaw.json` の書き換えを行わずにスキップされます。

保存済みintegrity hashが存在し、取得したartifact hashが変化している場合、
OpenClawはそれをnpm artifact driftとして扱います。対話式の
`openclaw plugins update` コマンドは期待値と実際のhashを表示し、
続行前に確認を求めます。非対話の更新ヘルパーは、呼び出し元が明示的な継続ポリシーを
指定しない限りフェイルクローズします。

`--dangerously-force-unsafe-install` は `plugins update` でも、
plugin更新中の組み込み危険コードスキャン誤検知に対する緊急用overrideとして利用できます。
それでもpluginの `before_install` ポリシーブロックや
scan-failureブロックは回避せず、hook-pack更新ではなくplugin更新にのみ適用されます。

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一pluginの詳細な内観表示です。identity、読み込み状態、source、
登録済みcapabilities、フック、ツール、コマンド、サービス、gateway methods、
HTTP routes、ポリシーフラグ、診断、インストールメタデータ、bundle capabilities、
および検出されたMCPまたはLSP serverサポートを表示します。

各pluginは、ランタイムで実際に何を登録したかによって分類されます:

- **plain-capability** — 1種類のcapabilityタイプのみ（例: provider専用plugin）
- **hybrid-capability** — 複数のcapabilityタイプ（例: text + speech + images）
- **hook-only** — フックのみで、capabilitiesやsurfaceはなし
- **non-capability** — capabilitiesはないがtools/commands/servicesはある

capabilityモデルの詳細は [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

`--json` フラグは、スクリプトや監査に適した機械可読レポートを出力します。

`inspect --all` は、shape、capability kinds、
互換性通知、bundle capabilities、フック要約カラムを含む全体テーブルを表示します。

`info` は `inspect` のエイリアスです。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` はpluginの読み込みエラー、manifest/検出診断、
互換性通知を報告します。問題がなければ `No plugin issues
detected.` と表示します。

`register`/`activate` export欠落のようなmodule-shape障害については、
`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、
診断出力にコンパクトなexport-shape要約が含まれます。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

marketplace listは、ローカルmarketplaceパス、`marketplace.json` パス、
`owner/repo` のようなGitHub省略記法、GitHubリポジトリURL、またはgit URLを受け付けます。`--json`
は、解決されたsourceラベルに加えて、解析されたmarketplace manifestと
pluginエントリを出力します。

## 関連

- [CLI reference](/ja-JP/cli)
- [Building plugins](/ja-JP/plugins/building-plugins)
- [Community plugins](/ja-JP/plugins/community)
