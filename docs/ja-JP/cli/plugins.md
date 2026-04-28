---
read_when:
    - Gatewayプラグインまたは互換バンドルをインストールまたは管理したい場合
    - Pluginの読み込み失敗をデバッグしたい場合
sidebarTitle: Plugins
summary: '`openclaw plugins` のCLIリファレンス（一覧、インストール、マーケットプレイス、アンインストール、有効化/無効化、doctor）'
title: プラグイン
x-i18n:
    generated_at: "2026-04-26T11:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gatewayプラグイン、フックパック、互換バンドルを管理します。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ja-JP/tools/plugin">
    Pluginのインストール、有効化、トラブルシューティングのエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin bundles" href="/ja-JP/plugins/bundles">
    バンドル互換性モデル。
  </Card>
  <Card title="Plugin manifest" href="/ja-JP/plugins/manifest">
    マニフェストフィールドと設定スキーマ。
  </Card>
  <Card title="Security" href="/ja-JP/gateway/security">
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
バンドルPluginはOpenClawに同梱されています。一部はデフォルトで有効です（たとえば、同梱のモデルプロバイダー、同梱の音声プロバイダー、同梱のbrowser Plugin）。それ以外は `plugins enable` が必要です。

ネイティブOpenClawプラグインには、インラインJSON Schema（空でも `configSchema` が必要）を含む `openclaw.plugin.json` が必要です。互換バンドルは代わりに独自のバンドルマニフェストを使用します。

`plugins list` には `Format: openclaw` または `Format: bundle` が表示されます。詳細な list/info 出力には、バンドルのサブタイプ（`codex`、`claude`、または `cursor`）と検出されたバンドル機能も表示されます。
</Note>

### インストール

```bash
openclaw plugins install <package>                      # まずClawHub、次にnpm
openclaw plugins install clawhub:<package>              # ClawHubのみ
openclaw plugins install <package> --force              # 既存インストールを上書き
openclaw plugins install <package> --pin                # バージョンを固定
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ローカルパス
openclaw plugins install <plugin>@<marketplace>         # マーケットプレイス
openclaw plugins install <plugin> --marketplace <name>  # マーケットプレイス（明示）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
プレーンなパッケージ名は、まずClawHub、次にnpmで確認されます。Pluginのインストールはコードの実行と同様に扱ってください。バージョン固定を推奨します。
</Warning>

<AccordionGroup>
  <Accordion title="設定includeと無効設定からの復旧">
    `plugins` セクションが単一ファイルの `$include` によって提供されている場合、`plugins install/update/enable/disable/uninstall` はそのinclude先ファイルに書き込み、`openclaw.json` には触れません。ルートinclude、include配列、兄弟上書きを含むincludeは、フラット化せずにfail closedします。対応する形式については [Config includes](/ja-JP/gateway/configuration) を参照してください。

    設定が無効な場合、通常 `plugins install` はfail closedし、まず `openclaw doctor --fix` を実行するよう案内します。唯一の文書化された例外は、`openclaw.install.allowInvalidConfigRecovery` に明示的にオプトインしたPlugin向けの、限定的なバンドルPlugin復旧パスです。

  </Accordion>
  <Accordion title="--force と reinstall と update の違い">
    `--force` は既存のインストール先を再利用し、すでにインストール済みのPluginまたはフックパックをその場で上書きします。新しいローカルパス、アーカイブ、ClawHubパッケージ、またはnpmアーティファクトから、同じidを意図的に再インストールする場合に使用してください。追跡済みnpm Pluginの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>` を推奨します。

    すでにインストール済みのPlugin idに対して `plugins install` を実行すると、OpenClawは停止し、通常のアップグレードには `plugins update <id-or-npm-spec>` を、本当に別ソースから現在のインストールを上書きしたい場合には `plugins install <package> --force` を案内します。

  </Accordion>
  <Accordion title="--pin の適用範囲">
    `--pin` はnpmインストールにのみ適用されます。マーケットプレイスインストールでは、npm specではなくマーケットプレイスのソースメタデータが保存されるため、`--marketplace` とは併用できません。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する緊急用オプションです。組み込みスキャナーが `critical` の検出結果を報告してもインストールを続行できますが、Pluginの `before_install` フックポリシーブロックは回避せず、スキャン失敗も回避しません。

    このCLIフラグはPluginの install/update フローに適用されます。Gateway経由のSkills依存関係インストールでは対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用しますが、`openclaw skills install` は別のClawHub Skillsダウンロード/インストールフローのままです。

  </Accordion>
  <Accordion title="フックパックとnpm spec">
    `plugins install` は、`package.json` に `openclaw.hooks` を公開するフックパックのインストール経路でもあります。フックの絞り込み表示やフック単位の有効化には `openclaw hooks` を使用し、パッケージのインストールには使用しないでください。

    npm spec は **registry-only** です（パッケージ名 + 任意の **正確なバージョン** または **dist-tag**）。Git/URL/file spec と semver range は拒否されます。依存関係のインストールは安全のため、シェルにグローバルnpmインストール設定があっても、プロジェクトローカルで `--ignore-scripts` を付けて実行されます。

    プレーンspecと `@latest` は安定トラックのままです。npmがそれらのいずれかをプレリリースに解決した場合、OpenClawは停止し、`@beta`/`@rc` のようなプレリリースタグ、または `@1.2.3-beta.4` のような正確なプレリリース版で明示的にオプトインするよう求めます。

    プレーンなインストールspecがバンドルPlugin id（たとえば `diffs`）と一致する場合、OpenClawはバンドルPluginを直接インストールします。同名のnpmパッケージをインストールするには、明示的なスコープ付きspec（たとえば `@scope/diffs`）を使用してください。

  </Accordion>
  <Accordion title="アーカイブ">
    対応アーカイブ: `.zip`, `.tgz`, `.tar.gz`, `.tar`。ネイティブOpenClaw Pluginアーカイブには、展開後のPluginルートに有効な `openclaw.plugin.json` が含まれている必要があります。`package.json` だけを含むアーカイブは、OpenClawがインストール記録を書き込む前に拒否されます。

    Claudeマーケットプレイスインストールもサポートされています。

  </Accordion>
</AccordionGroup>

ClawHubインストールは明示的な `clawhub:<package>` ロケーターを使用します。

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClawは現在、プレーンなnpm安全Plugin specに対してもClawHubを優先します。ClawHubにそのパッケージまたはバージョンがない場合のみnpmにフォールバックします。

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClawはClawHubからパッケージアーカイブをダウンロードし、広告されたPlugin API / 最小gateway互換性を確認してから、通常のアーカイブ経路でインストールします。記録されたインストールは、後続の更新のためにClawHubソースメタデータを保持します。

#### マーケットプレイス短縮記法

マーケットプレイス名がClaudeのローカルレジストリキャッシュ `~/.claude/plugins/known_marketplaces.json` に存在する場合は、`plugin@marketplace` の短縮記法を使用します。

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

マーケットプレイスのソースを明示的に渡したい場合は `--marketplace` を使用します。

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="マーケットプレイスソース">
    - `~/.claude/plugins/known_marketplaces.json` にあるClaudeの既知マーケットプレイス名
    - ローカルのマーケットプレイスルートまたは `marketplace.json` パス
    - `owner/repo` のようなGitHubリポジトリ短縮記法
    - `https://github.com/owner/repo` のようなGitHubリポジトリURL
    - git URL

  </Tab>
  <Tab title="リモートマーケットプレイスのルール">
    GitHubまたはgitから読み込まれるリモートマーケットプレイスでは、Pluginエントリはクローンされたマーケットプレイスリポジトリ内にとどまる必要があります。OpenClawは、そのリポジトリからの相対パスソースを受け入れ、リモートマニフェスト内のHTTP(S)、絶対パス、git、GitHub、およびその他のパス以外のPluginソースは拒否します。
  </Tab>
</Tabs>

ローカルパスとアーカイブについては、OpenClawが自動検出します。

- ネイティブOpenClawプラグイン（`openclaw.plugin.json`）
- Codex互換バンドル（`.codex-plugin/plugin.json`）
- Claude互換バンドル（`.claude-plugin/plugin.json` またはデフォルトのClaudeコンポーネントレイアウト）
- Cursor互換バンドル（`.cursor-plugin/plugin.json`）

<Note>
互換バンドルは通常のPluginルートにインストールされ、同じ list/info/enable/disable フローに参加します。現時点では、バンドルSkills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` / マニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、および互換Codex hookディレクトリがサポートされています。その他の検出されたバンドル機能は diagnostics/info に表示されますが、まだランタイム実行には接続されていません。
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
  テーブル表示から、ソース/出所/バージョン/有効化メタデータを含むPluginごとの詳細行表示に切り替えます。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読なインベントリとレジストリ診断を出力します。
</ParamField>

<Note>
`plugins list` はまず永続化されたローカルPluginレジストリを読み取り、レジストリが欠落または無効な場合はマニフェストのみの導出フォールバックを使います。Pluginがインストール済み、有効、かつコールドスタート計画に対して可視かどうかを確認するのに役立ちますが、すでに動作中のGatewayプロセスに対するライブランタイムプローブではありません。Pluginコード、有効化、フックポリシー、または `plugins.load.paths` を変更した後、新しい `register(api)` コードやフックが動作することを期待する前に、そのチャンネルを提供するGatewayを再起動してください。リモート/コンテナデプロイでは、ラッパープロセスだけでなく、実際の `openclaw gateway run` 子プロセスを再起動していることを確認してください。
</Note>

パッケージ化されたDockerイメージ内でバンドルPluginを扱う場合は、Pluginソースディレクトリを、対応するパッケージ化ソースパス（たとえば `/app/extensions/synology-chat`）の上にbind mountしてください。OpenClawは、マウントされたそのソースオーバーレイを `/app/dist/extensions/synology-chat` より先に検出します。単にコピーされたソースディレクトリは非アクティブのままなので、通常のパッケージ版インストールではコンパイル済みdistが使われ続けます。

ランタイムフックのデバッグでは:

- `openclaw plugins inspect <id> --json` は、モジュール読み込み済みの検査パスから、登録されたフックと診断を表示します。
- `openclaw gateway status --deep --require-rpc` は、到達可能なGateway、サービス/プロセスのヒント、設定パス、RPC健全性を確認します。
- バンドルされていない会話フック（`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`）には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。

ローカルディレクトリをコピーせずに使用するには `--link` を使います（`plugins.load.paths` に追加されます）。

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
リンクインストールは管理されたインストール先にコピーせずソースパスを再利用するため、`--link` では `--force` はサポートされません。

npmインストールでは `--pin` を使うと、デフォルト動作を非固定のままにしつつ、解決された正確なspec（`name@version`）を管理Pluginインデックスに保存できます。
</Note>

### Pluginインデックス

Pluginのインストールメタデータは、ユーザー設定ではなくマシン管理の状態です。インストールと更新は、アクティブなOpenClaw状態ディレクトリ配下の `plugins/installs.json` に書き込まれます。最上位の `installRecords` マップは、壊れた、または欠落したPluginマニフェストの記録も含む、インストールメタデータの永続的なソースです。`plugins` 配列は、マニフェスト由来のコールドレジストリキャッシュです。このファイルには「編集しないでください」警告が含まれ、`openclaw plugins update`、アンインストール、診断、コールドPluginレジストリで使用されます。

OpenClawが設定内の従来の `plugins.installs` レコードを検出すると、それらをPluginインデックスへ移動し、設定キーを削除します。いずれかの書き込みが失敗した場合は、インストールメタデータが失われないよう、設定レコードは保持されます。

### アンインストール

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` は、該当する場合に `plugins.entries`、永続化されたPluginインデックス、Plugin allow/deny リストのエントリ、およびリンクされた `plugins.load.paths` エントリからPluginレコードを削除します。`--keep-files` が設定されていない限り、アンインストールは、追跡されている管理インストールディレクトリがOpenClawのPlugin拡張ルート内にある場合、それも削除します。Active Memoryプラグインでは、メモリスロットは `memory-core` にリセットされます。

<Note>
`--keep-config` は、非推奨の `--keep-files` エイリアスとしてサポートされています。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新は、管理Pluginインデックス内で追跡されているPluginインストールと、`hooks.internal.installs` 内で追跡されているフックパックインストールに適用されます。

<AccordionGroup>
  <Accordion title="Plugin id と npm spec の解決">
    Plugin id を渡すと、OpenClawはそのPluginに記録されているインストールspecを再利用します。つまり、以前保存された `@beta` のようなdist-tagや、正確に固定されたバージョンは、後続の `update <id>` 実行でも引き続き使用されます。

    npmインストールでは、dist-tagまたは正確なバージョン付きの明示的なnpm package specを渡すこともできます。OpenClawはそのパッケージ名を追跡済みPluginレコードへ逆引きし、そのインストール済みPluginを更新し、将来のidベース更新のために新しいnpm specを記録します。

    バージョンやタグなしのnpm package名を渡しても、追跡済みPluginレコードへ逆引きされます。Pluginが正確なバージョンに固定されていて、それをレジストリのデフォルトリリースラインへ戻したい場合に使用してください。

  </Accordion>
  <Accordion title="バージョンチェックと整合性ドリフト">
    ライブnpm更新の前に、OpenClawはインストール済みパッケージのバージョンをnpmレジストリメタデータと照合します。インストール済みバージョンと記録されたアーティファクト識別子が、すでに解決済みターゲットと一致している場合、ダウンロード、再インストール、`openclaw.json` の再書き込みを行わずに更新をスキップします。

    保存済みの整合性ハッシュが存在し、取得したアーティファクトハッシュが変化した場合、OpenClawはそれをnpmアーティファクトドリフトとして扱います。対話的な `openclaw plugins update` コマンドは、期待値と実際のハッシュを表示し、続行前に確認を求めます。非対話的な更新ヘルパーは、呼び出し元が明示的な続行ポリシーを指定しない限り、fail closedします。

  </Accordion>
  <Accordion title="updateでの --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` は、Plugin更新中に組み込み危険コードスキャンの誤検知が発生した場合の緊急用上書きとして、`plugins update` でも利用できます。それでもPluginの `before_install` ポリシーブロックやスキャン失敗ブロックは回避せず、適用されるのはPlugin更新のみで、フックパック更新には適用されません。
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

単一Pluginの詳細なイントロスペクションです。識別情報、読み込み状態、ソース、登録済み機能、フック、ツール、コマンド、サービス、Gatewayメソッド、HTTPルート、ポリシーフラグ、診断、インストールメタデータ、バンドル機能、検出されたMCPまたはLSPサーバー対応を表示します。

各Pluginは、ランタイムで実際に登録する内容によって分類されます。

- **plain-capability** — 1種類の機能タイプ（例: プロバイダー専用Plugin）
- **hybrid-capability** — 複数の機能タイプ（例: テキスト + 音声 + 画像）
- **hook-only** — フックのみで、機能やサーフェスはなし
- **non-capability** — ツール/コマンド/サービスはあるが機能はなし

機能モデルの詳細については [Plugin shapes](/ja-JP/plugins/architecture#plugin-shapes) を参照してください。

<Note>
`--json` フラグは、スクリプトや監査に適した機械可読レポートを出力します。`inspect --all` は、shape、機能種別、互換性通知、バンドル機能、フック要約列を含む全体表を表示します。`info` は `inspect` のエイリアスです。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` は、Pluginの読み込みエラー、マニフェスト/検出診断、互換性通知を報告します。問題がない場合は `No plugin issues detected.` と表示されます。

`register`/`activate` エクスポート欠落のようなモジュール形状の失敗については、`OPENCLAW_PLUGIN_LOAD_DEBUG=1` を付けて再実行すると、診断出力にコンパクトなエクスポート形状サマリーが含まれます。

### レジストリ

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

ローカルPluginレジストリは、インストール済みPluginの識別情報、有効化、ソースメタデータ、コントリビューション所有権に関する、OpenClawの永続化されたコールド読み取りモデルです。通常の起動、プロバイダー所有者の参照、チャンネル設定分類、Pluginインベントリは、Pluginランタイムモジュールをimportせずにこれを読み取れます。

永続化レジストリが存在するか、最新か、古いかを確認するには `plugins registry` を使用してください。永続化Pluginインデックス、設定ポリシー、マニフェスト/packageメタデータから再構築するには `--refresh` を使用します。これは修復パスであり、ランタイム有効化パスではありません。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` は、レジストリ読み取り失敗時の緊急用互換性スイッチとしては非推奨です。`plugins registry --refresh` または `openclaw doctor --fix` を優先してください。この環境変数フォールバックは、移行展開中の緊急起動復旧専用です。
</Warning>

### マーケットプレイス

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

マーケットプレイス一覧は、ローカルのマーケットプレイスパス、`marketplace.json` パス、`owner/repo` のようなGitHub短縮記法、GitHubリポジトリURL、またはgit URLを受け付けます。`--json` は、解決されたソースラベルと、解析済みのマーケットプレイスマニフェストおよびPluginエントリを出力します。

## 関連

- [Building plugins](/ja-JP/plugins/building-plugins)
- [CLI reference](/ja-JP/cli)
- [Community plugins](/ja-JP/plugins/community)
