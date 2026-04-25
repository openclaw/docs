---
read_when:
    - Gateway プラグインまたは互換バンドルをインストールまたは管理したい場合
    - Plugin の読み込み失敗をデバッグしたい場合
summary: '`openclaw plugins` の CLI リファレンス（list、install、marketplace、uninstall、enable/disable、doctor）'
title: プラグイン
x-i18n:
    generated_at: "2026-04-25T18:16:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway プラグイン、フックパック、および互換バンドルを管理します。

関連:

- Plugin システム: [プラグイン](/ja-JP/tools/plugin)
- バンドル互換性: [Plugin バンドル](/ja-JP/plugins/bundles)
- Plugin マニフェスト + スキーマ: [Plugin マニフェスト](/ja-JP/plugins/manifest)
- セキュリティ強化: [セキュリティ](/ja-JP/gateway/security)

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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

バンドル済みプラグインは OpenClaw に同梱されています。一部はデフォルトで有効です（たとえば、同梱されたモデルプロバイダー、同梱された音声プロバイダー、同梱されたブラウザ Plugin など）。その他は `plugins enable` が必要です。

ネイティブ OpenClaw plugins は、インライン JSON Schema（空でも `configSchema` が必要）を含む `openclaw.plugin.json` を同梱している必要があります。互換バンドルは、代わりに独自のバンドルマニフェストを使用します。

`plugins list` には `Format: openclaw` または `Format: bundle` が表示されます。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）に加えて、検出されたバンドル機能も表示されます。

### インストール

```bash
openclaw plugins install <package>                      # まず ClawHub、次に npm
openclaw plugins install clawhub:<package>              # ClawHub のみ
openclaw plugins install <package> --force              # 既存のインストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカルパス
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（明示指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

パッケージ名だけを指定した場合、まず ClawHub が確認され、その後 npm が確認されます。セキュリティ上の注意: plugin のインストールはコードを実行するのと同様に扱ってください。バージョン固定を推奨します。

`plugins` セクションが単一ファイルの `$include` で構成されている場合、`plugins install/update/enable/disable/uninstall` はその include 先ファイルに書き込み、`openclaw.json` は変更しません。ルート include、include 配列、兄弟オーバーライドを伴う include は、フラット化せずに fail closed します。対応する形については [設定 include](/ja-JP/gateway/configuration) を参照してください。

設定が無効な場合、通常 `plugins install` は fail closed し、まず `openclaw doctor --fix` を実行するよう案内します。ドキュメント化されている唯一の例外は、`openclaw.install.allowInvalidConfigRecovery` を明示的に opt in している plugins 向けの限定的なバンドル済み plugin 復旧パスです。

`--force` は既存のインストール先を再利用し、すでにインストール済みの plugin またはフックパックをその場で上書きします。同じ id を新しいローカルパス、アーカイブ、ClawHub パッケージ、または npm アーティファクトから意図的に再インストールする場合に使用します。すでに追跡されている npm plugin の通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

すでにインストールされている plugin id に対して `plugins install` を実行すると、OpenClaw は停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、本当に別のソースから現在のインストールを上書きしたい場合には `plugins install <package> --force` を案内します。

`--pin` は npm インストールにのみ適用されます。marketplace インストールでは、npm spec の代わりに marketplace のソースメタデータを永続化するため、サポートされていません。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーで誤検知が発生した場合の緊急回避オプションです。組み込みスキャナーが `critical` の検出結果を報告した場合でもインストールを続行できますが、plugin の `before_install` フックによるポリシーブロックは回避せず、スキャン失敗も回避しません。

この CLI フラグは plugin の install/update フローに適用されます。Gateway ベースの skill 依存関係インストールでは、対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別の ClawHub skill ダウンロード/インストールフローのままです。

`plugins install` は、`package.json` で `openclaw.hooks` を公開しているフックパックのインストール面でもあります。フィルター済みのフック可視性やフック単位の有効化には、パッケージのインストールではなく `openclaw hooks` を使用してください。

npm spec は **レジストリ限定** です（パッケージ名 + オプションの **完全一致バージョン** または **dist-tag**）。Git/URL/file spec や semver 範囲は拒否されます。依存関係のインストールは、安全のため `--ignore-scripts` 付きで実行されます。

素の spec と `@latest` は stable トラックのままです。npm がそのいずれかを prerelease に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease タグまたは `@1.2.3-beta.4` のような完全一致 prerelease バージョンで明示的に opt in するよう求めます。

素のインストール spec がバンドル済み plugin id（たとえば `diffs`）に一致する場合、OpenClaw はそのバンドル済み plugin を直接インストールします。同名の npm パッケージをインストールするには、明示的なスコープ付き spec（たとえば `@scope/diffs`）を使用してください。

サポートされるアーカイブ: `.zip`, `.tgz`, `.tar.gz`, `.tar`。

Claude marketplace からのインストールもサポートされています。

ClawHub インストールでは、明示的な `clawhub:<package>` ロケーターを使用します:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw は現在、素の npm-safe plugin spec についても ClawHub を優先します。ClawHub にそのパッケージまたはバージョンがない場合のみ、npm にフォールバックします。

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw は ClawHub からパッケージアーカイブをダウンロードし、告知された plugin API / 最小 gateway 互換性を確認してから、通常のアーカイブパスでインストールします。記録されたインストールには、後続の更新のために ClawHub のソースメタデータが保持されます。

marketplace 名が Claude のローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` の短縮記法を使用します:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

marketplace ソースを明示的に渡したい場合は `--marketplace` を使用します:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplace ソースには次のものを使用できます:

- `~/.claude/plugins/known_marketplaces.json` にある Claude の既知 marketplace 名
- ローカル marketplace ルート、または `marketplace.json` のパス
- `owner/repo` のような GitHub リポジトリ短縮記法
- `https://github.com/owner/repo` のような GitHub リポジトリ URL
- git URL

GitHub または git から読み込まれるリモート marketplace では、plugin エントリはクローンされた marketplace リポジトリ内にとどまる必要があります。OpenClaw は、そのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内の HTTP(S)、絶対パス、git、GitHub、その他の非パス plugin ソースを拒否します。

ローカルパスとアーカイブについて、OpenClaw は次を自動検出します:

- ネイティブ OpenClaw plugins（`openclaw.plugin.json`）
- Codex 互換バンドル（`.codex-plugin/plugin.json`）
- Claude 互換バンドル（`.claude-plugin/plugin.json` またはデフォルトの Claude コンポーネントレイアウト）
- Cursor 互換バンドル（`.cursor-plugin/plugin.json`）

互換バンドルは通常の plugin ルートにインストールされ、同じ list/info/enable/disable フローに参加します。現在は、バンドル skill、Claude command-skills、Claude `settings.json` のデフォルト、Claude `.lsp.json` / マニフェストで宣言された `lspServers` のデフォルト、Cursor command-skills、および互換 Codex フックディレクトリがサポートされています。その他の検出されたバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。

### 一覧

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

`--enabled` を使用すると、有効な plugins のみを表示します。`--verbose` を使用すると、表形式表示から、ソース/由来/バージョン/アクティベーションメタデータを含む plugin ごとの詳細行表示に切り替わります。`--json` は、機械可読なインベントリとレジストリ diagnostics を出力します。

`plugins list` は、まず永続化されたローカル plugin レジストリを読み込み、レジストリが存在しないか無効な場合はマニフェストのみから導出したフォールバックを使用します。plugin がインストール済みか、有効か、コールドスタート計画時に見えるかを確認するには便利ですが、すでに実行中の Gateway プロセスに対するライブなランタイムプローブではありません。plugin コード、有効化状態、フックポリシー、または `plugins.load.paths` を変更した後は、新しい `register(api)` コードまたはフックが実行されることを期待する前に、そのチャネルを提供している Gateway を再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。

ランタイムフックのデバッグでは:

- `openclaw plugins inspect <id> --json` は、モジュール読み込み済みの検査パスから登録済みフックと diagnostics を表示します。
- `openclaw gateway status --deep --require-rpc` は、到達可能な Gateway、サービス/プロセスのヒント、設定パス、RPC の正常性を確認します。
- 非バンドルの会話フック（`llm_input`, `llm_output`, `agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリをコピーせずに使用するには `--link` を使います（`plugins.load.paths` に追加されます）:

```bash
openclaw plugins install -l ./my-plugin
```

リンクされたインストールは、管理されたインストール先にコピーせずソースパスを再利用するため、`--link` と `--force` は併用できません。

npm インストールで `--pin` を使用すると、デフォルトの未固定動作を維持しつつ、解決された完全 spec（`name@version`）が `plugins.installs` に保存されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、必要に応じて `plugins.entries`、`plugins.installs`、plugin allowlist、およびリンクされた `plugins.load.paths` エントリから plugin の記録を削除します。Active Memory plugins では、メモリスロットは `memory-core` にリセットされます。

デフォルトでは、アンインストールはアクティブな state-dir plugin ルート配下の plugin インストールディレクトリも削除します。ディスク上のファイルを保持するには、`--keep-files` を使用してください。

`--keep-config` は `--keep-files` の非推奨エイリアスとしてサポートされています。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、`plugins.installs` 内の追跡対象インストールと、`hooks.internal.installs` 内の追跡対象フックパックインストールに適用されます。

plugin id を渡すと、OpenClaw はその plugin に対して記録済みのインストール spec を再利用します。つまり、以前に保存された `@beta` のような dist-tag や完全固定バージョンは、後続の `update <id>` 実行でも引き続き使用されます。

npm インストールでは、dist-tag または完全一致バージョン付きの明示的な npm パッケージ spec を渡すこともできます。OpenClaw はそのパッケージ名を追跡対象 plugin レコードに再解決し、そのインストール済み plugin を更新し、以後の id ベース更新のために新しい npm spec を記録します。

バージョンやタグなしの npm パッケージ名を渡した場合も、追跡対象 plugin レコードに再解決されます。plugin が完全一致バージョンに固定されていて、それをレジストリのデフォルトリリースラインに戻したい場合に使用してください。

ライブ npm 更新の前に、OpenClaw はインストール済みパッケージバージョンを npm レジストリメタデータと照合します。インストール済みバージョンと記録済みアーティファクトの識別情報が、すでに解決先ターゲットと一致している場合、更新はスキップされ、ダウンロード、再インストール、`openclaw.json` の書き換えは行われません。

保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変更されていた場合、OpenClaw はそれを npm アーティファクトのドリフトとして扱います。対話型の `openclaw plugins update` コマンドは、想定ハッシュと実際のハッシュを表示し、続行前に確認を求めます。非対話型の更新ヘルパーは、呼び出し元が明示的な続行ポリシーを指定しない限り fail closed します。

`--dangerously-force-unsafe-install` は、plugin 更新時に組み込みの危険コードスキャンで誤検知が発生した場合の緊急回避オーバーライドとして、`plugins update` でも使用できます。これも plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは回避せず、plugin 更新にのみ適用され、フックパック更新には適用されません。

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一 plugin の詳細なイントロスペクションです。ID、読み込み状態、ソース、登録済み機能、フック、ツール、コマンド、サービス、gateway メソッド、HTTP ルート、ポリシーフラグ、diagnostics、インストールメタデータ、バンドル機能、および検出された MCP または LSP サーバー対応を表示します。

各 plugin は、実際にランタイムで登録する内容に基づいて分類されます:

- **plain-capability** — 1 種類の capability のみ（例: provider 専用 plugin）
- **hybrid-capability** — 複数種類の capability（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみで、capability や surface はなし
- **non-capability** — ツール/コマンド/サービスはあるが capability はなし

capability モデルの詳細は [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

`--json` フラグは、スクリプト処理や監査に適した機械可読レポートを出力します。

`inspect --all` は、shape、capability の種類、互換性通知、バンドル機能、フック概要の各列を含むフリート全体の表を表示します。

`info` は `inspect` のエイリアスです。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、plugin の読み込みエラー、マニフェスト/検出 diagnostics、および互換性通知を報告します。すべて問題がない場合は `No plugin issues detected.` と表示します。

`register`/`activate` エクスポートの欠落のようなモジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、diagnostic 出力にコンパクトな export 形状サマリーが含まれます。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカル plugin レジストリは、インストール済み plugin の ID、有効化状態、ソースメタデータ、および提供元の所有権に関する OpenClaw の永続化されたコールド読み取りモデルです。通常の起動、provider 所有者の参照、チャネル設定の分類、および plugin インベントリは、plugin ランタイムモジュールを import せずにこれを読み取れます。

永続化されたレジストリが存在するか、最新か、古くなっているかを確認するには `plugins registry` を使用します。耐久性のあるインストール ledger、設定ポリシー、マニフェスト/パッケージメタデータから再構築するには `--refresh` を使用します。これは修復パスであり、ランタイム有効化パスではありません。

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗に対する非推奨の緊急回避互換スイッチです。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この env フォールバックは、移行展開中の緊急起動復旧専用です。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

marketplace list は、ローカル marketplace パス、`marketplace.json` パス、`owner/repo` のような GitHub 短縮記法、GitHub リポジトリ URL、または git URL を受け付けます。`--json` は、解決されたソースラベルに加えて、解析済み marketplace マニフェストと plugin エントリを出力します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Plugin のビルド](/ja-JP/plugins/building-plugins)
- [コミュニティ plugins](/ja-JP/plugins/community)
