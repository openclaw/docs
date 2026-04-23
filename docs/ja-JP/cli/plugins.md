---
read_when:
    - Gateway plugins または互換 bundle をインストールまたは管理したい場合
    - plugin の読み込み失敗をデバッグしたい場合
summary: '`openclaw plugins` の CLI リファレンス（一覧、インストール、marketplace、アンインストール、有効化/無効化、doctor）'
title: plugins
x-i18n:
    generated_at: "2026-04-23T14:02:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway plugins、hook pack、および互換 bundle を管理します。

関連:

- Plugin システム: [Plugins](/ja-JP/tools/plugin)
- Bundle 互換性: [Plugin bundles](/ja-JP/plugins/bundles)
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

バンドルされた plugins は OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、
バンドルされた model provider、バンドルされた speech provider、バンドルされた browser
plugin）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw plugins は、インライン JSON
Schema（空であっても `configSchema`）を含む `openclaw.plugin.json` を同梱する必要があります。
互換 bundle は代わりに独自の bundle manifest を使用します。

`plugins list` には `Format: openclaw` または `Format: bundle` が表示されます。verbose な list/info
出力では、bundle サブタイプ（`codex`、`claude`、または `cursor`）と、検出された bundle
capabilities も表示されます。

### インストール

```bash
openclaw plugins install <package>                      # まず ClawHub、次に npm
openclaw plugins install clawhub:<package>              # ClawHub のみ
openclaw plugins install <package> --force              # 既存のインストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカル path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（明示指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

素の package 名はまず ClawHub で確認され、その後 npm が確認されます。セキュリティ上の注意:
plugin のインストールはコード実行と同様に扱ってください。できるだけバージョン固定を推奨します。

`plugins` セクションが単一ファイルの `$include` によって管理されている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、および sibling override を持つ include は、フラット化せずに fail closed します。サポートされる形状については [Config includes](/ja-JP/gateway/configuration) を参照してください。

設定が無効な場合、`plugins install` は通常 fail closed し、最初に
`openclaw doctor --fix` を実行するよう案内します。唯一文書化されている例外は、
`openclaw.install.allowInvalidConfigRecovery` に明示的に opt in している plugins 向けの、
限定的な bundled-plugin 復旧経路です。

`--force` は既存のインストール先を再利用し、すでにインストールされている
plugin または hook pack をその場で上書きします。新しいローカル path、archive、ClawHub package、または npm artifact から同じ id を意図的に再インストールする場合に使用してください。
すでに追跡されている npm plugin の通常のアップグレードでは、
`openclaw plugins update <id-or-npm-spec>` を使うことを推奨します。

すでにインストールされている plugin id に対して `plugins install` を実行すると、OpenClaw
は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、
別のソースから現在のインストールを本当に上書きしたい場合には
`plugins install <package> --force` を案内します。

`--pin` は npm インストールにのみ適用されます。marketplace インストールでは
サポートされません。marketplace インストールは npm spec の代わりに marketplace
ソースメタデータを保持するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる
誤検知向けの緊急用オプションです。組み込みスキャナーが `critical` findings を報告しても
インストール続行を許可しますが、plugin の `before_install` hook ポリシーブロックは**回避しません**。
また、scan failure も**回避しません**。

この CLI フラグは plugin install/update フローに適用されます。Gateway を利用する Skills
依存関係インストールでは、対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、
`openclaw skills install` は別個の ClawHub Skills ダウンロード/インストールフローのままです。

`plugins install` は、`package.json` 内で `openclaw.hooks` を公開する hook pack の
インストールサーフェスでもあります。パッケージのインストールではなく、フィルタされた hook
可視性や hook ごとの有効化には `openclaw hooks` を使用してください。

npm spec は **registry-only** です（package 名 + 任意の **厳密なバージョン** または
**dist-tag**）。Git/URL/file spec と semver range は拒否されます。依存関係インストールは
安全のため `--ignore-scripts` 付きで実行されます。

素の spec と `@latest` は stable トラックのままです。npm がそれらのいずれかを prerelease
に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease tag や
`@1.2.3-beta.4` のような厳密な prerelease version を使って明示的に opt in するよう求めます。

素の install spec が bundled plugin id（たとえば `diffs`）に一致する場合、OpenClaw
はその bundled plugin を直接インストールします。同名の npm package をインストールしたい場合は、
明示的な scoped spec（たとえば `@scope/diffs`）を使用してください。

サポートされる archive: `.zip`、`.tgz`、`.tar.gz`、`.tar`。

Claude marketplace インストールもサポートされています。

ClawHub インストールでは明示的な `clawhub:<package>` locator を使用します:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw は現在、素の npm-safe plugin spec に対しても ClawHub を優先します。ClawHub
にその package または version がない場合のみ npm にフォールバックします:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw は ClawHub から package archive をダウンロードし、広告された
plugin API / minimum gateway compatibility を確認した後、通常の archive 経路で
インストールします。記録されたインストールは、後の update のために ClawHub
ソースメタデータを保持します。

marketplace 名が Claude のローカル registry cache
`~/.claude/plugins/known_marketplaces.json` に存在する場合は、
`plugin@marketplace` の短縮記法を使用します:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace ソースを明示的に渡したい場合は `--marketplace` を使います:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplace ソースには次を使用できます:

- `~/.claude/plugins/known_marketplaces.json` 内の Claude known-marketplace 名
- ローカル marketplace ルートまたは `marketplace.json` path
- `owner/repo` のような GitHub repo 短縮記法
- `https://github.com/owner/repo` のような GitHub repo URL
- git URL

GitHub または git から読み込まれるリモート marketplace では、plugin エントリは
clone された marketplace repo 内にとどまる必要があります。OpenClaw はその repo
からの相対 path ソースを受け付け、リモート manifest からの HTTP(S)、absolute-path、git、GitHub、
その他の非 path plugin ソースは拒否します。

ローカル path と archive では、OpenClaw は以下を自動検出します:

- ネイティブ OpenClaw plugins（`openclaw.plugin.json`）
- Codex 互換 bundle（`.codex-plugin/plugin.json`）
- Claude 互換 bundle（`.claude-plugin/plugin.json` またはデフォルトの Claude
  component layout）
- Cursor 互換 bundle（`.cursor-plugin/plugin.json`）

互換 bundle は通常の plugin ルートにインストールされ、同じ list/info/enable/disable
フローに参加します。現時点では、bundle Skills、Claude
command-skills、Claude `settings.json` defaults、Claude `.lsp.json` /
manifest で宣言された `lspServers` defaults、Cursor command-skills、および互換
Codex hook directory がサポートされています。その他の検出された bundle
capabilities は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。

### 一覧

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

`--enabled` を使用すると、読み込まれた plugins のみを表示します。`--verbose` を使うと、
テーブル表示から、source/origin/version/activation
metadata を含む plugin ごとの詳細行表示に切り替わります。機械可読な inventory と registry
diagnostics には `--json` を使用してください。

ローカル directory をコピーせずに使用するには `--link` を使います（`plugins.load.paths` に追加されます）:

```bash
openclaw plugins install -l ./my-plugin
```

linked install はソース path を再利用し、管理されたインストール先へコピーしないため、
`--link` と `--force` は併用できません。

npm インストールでは `--pin` を使用すると、デフォルト動作を非固定のまま保ちながら、
解決された厳密 spec（`name@version`）を `plugins.installs` に保存します。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、`plugins.entries`、`plugins.installs`、
plugin allowlist、および該当する場合は linked な `plugins.load.paths` エントリから plugin レコードを削除します。
Active Memory plugins では、memory slot は `memory-core` にリセットされます。

デフォルトでは、アンインストール時にアクティブな state-dir plugin root 配下の
plugin インストールディレクトリも削除されます。ディスク上のファイルを残すには
`--keep-files` を使用してください。

`--keep-config` は非推奨のエイリアスとして `--keep-files` をサポートしています。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、`plugins.installs` 内の追跡対象インストールと、`hooks.internal.installs`
内の追跡対象 hook-pack インストールに適用されます。

plugin id を渡すと、OpenClaw はその plugin に対して記録済みの install spec を再利用します。
つまり、以前保存された `@beta` のような dist-tag や、厳密に固定された version は、
後続の `update <id>` 実行でも引き続き使用されます。

npm インストールでは、dist-tag または厳密 version を含む明示的な npm package spec
を渡すこともできます。OpenClaw はその package 名を追跡対象 plugin
レコードに解決し、そのインストール済み plugin を更新し、今後の
id ベース更新のために新しい npm spec を記録します。

version や tag を付けない npm package 名だけを渡した場合も、追跡対象 plugin
レコードに解決されます。plugin が厳密 version に固定されていて、
registry のデフォルトリリースラインへ戻したい場合にこれを使用してください。

ライブ npm update の前に、OpenClaw はインストール済み package version を npm registry metadata
と照合します。インストール済み version と記録済み artifact
identity が解決された対象とすでに一致している場合、ダウンロード、再インストール、
`openclaw.json` の書き換えは行わずに update をスキップします。

保存済み integrity hash が存在し、取得した artifact hash が変化している場合、
OpenClaw はそれを npm artifact drift とみなします。対話型の
`openclaw plugins update` コマンドは expected hash と actual hash を表示し、
続行前に確認を求めます。非対話型 update helper は、呼び出し元が明示的な continuation policy
を指定しない限り fail closed します。

`--dangerously-force-unsafe-install` は、plugin update 中の組み込み危険コードスキャンの
誤検知に対する緊急用上書きとして `plugins update` でも使用できます。引き続き、
plugin の `before_install` ポリシーブロックや scan-failure blocking は回避せず、
hook-pack update ではなく plugin update にのみ適用されます。

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一 plugin に対する詳細な introspection を行います。identity、ロード状態、source、
登録された capabilities、hooks、tools、commands、services、gateway methods、
HTTP routes、policy flags、diagnostics、install metadata、bundle capabilities、
および検出された MCP または LSP server サポートを表示します。

各 plugin は、実行時に実際に何を登録するかによって分類されます:

- **plain-capability** — 1 種類の capability タイプのみ（例: provider 専用 plugin）
- **hybrid-capability** — 複数の capability タイプ（例: text + speech + images）
- **hook-only** — hooks のみで、capabilities や surface はなし
- **non-capability** — tools/commands/services はあるが capabilities はなし

capability モデルの詳細は [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

`--json` フラグは、スクリプトや監査に適した機械可読レポートを出力します。

`inspect --all` は、shape、capability kinds、
互換性通知、bundle capabilities、hook summary 列を含む fleet 全体のテーブルを表示します。

`info` は `inspect` のエイリアスです。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は plugin の読み込みエラー、manifest/discovery diagnostics、および
互換性通知を報告します。すべて正常な場合は `No plugin issues
detected.` と表示されます。

`register`/`activate` export がないなどの module-shape failure については、
`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、diagnostic 出力に
コンパクトな export-shape summary が含まれます。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

marketplace list には、ローカル marketplace path、`marketplace.json` path、
`owner/repo` のような GitHub 短縮記法、GitHub repo URL、または git URL を渡せます。`--json`
は、解決された source ラベルに加えて、解析済み marketplace manifest と
plugin エントリを出力します。
