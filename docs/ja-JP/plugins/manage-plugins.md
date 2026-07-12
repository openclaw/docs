---
doc-schema-version: 1
read_when:
    - Control UI で Plugin を参照、インストール、有効化、または無効化したい場合
    - プラグインの一覧表示、インストール、更新、確認、アンインストールの簡単な例を参照したい場合
    - Plugin のインストール元を選択する場合
    - Plugin パッケージの公開に適したリファレンスを探している場合
sidebarTitle: Manage plugins
summary: Control UI または CLI から OpenClaw Plugin を管理する
title: Pluginを管理する
x-i18n:
    generated_at: "2026-07-12T14:42:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI は、一般的な検出、インストール、有効化、無効化の
ワークフローに対応します。CLI ではさらに、更新、アンインストール、高度な設定、明示的な
インストール元の制御を行えます。コマンドの完全な契約、フラグ、ソース選択
ルール、エッジケースについては、[`openclaw plugins`](/ja-JP/cli/plugins) を参照してください。

一般的な CLI ワークフローは、パッケージを検索し、ClawHub、npm、git、または
ローカルパスからインストールし、管理対象の Gateway を自動再起動させる（または手動で再起動する）、
その後 Plugin のランタイム登録を検証する、という流れです。

## Control UI を使用する

Control UI で **Plugins** を開くか、設定済みの Control UI ベースパスを基準に
`/settings/plugins` を使用します。たとえば、ベースパスが `/openclaw` の場合は
`/openclaw/settings/plugins` を使用します。このページには 2 つのタブがあります。

- **Installed** には、カテゴリ（チャンネル、
  モデルプロバイダー、メモリ、ツール）別にグループ化されたローカルインベントリ全体が表示されます。各行から詳細ビューを開けます。オーバーフロー
  （`…`）メニューでは Plugin を有効化または無効化でき、外部からインストールされた
  Plugin については **Remove** も選択できます。このタブには設定済みの
  [MCP サーバー](/ja-JP/cli/mcp)も表示され、同じメニュー操作で有効化、無効化、削除を
  行えます。これらの操作では Gateway 設定の `mcp.servers` が編集されます。
- **Discover** はストアです。OpenClaw に含まれる注目の Plugin、公式の
  外部 Plugin、厳選されたコネクター一覧が表示されます。コネクターカードからは、ホスト型
  MCP サーバー（GitHub、Notion、Linear、Sentry、
  Home Assistant）をワンクリックで追加するか、入力済みの ClawHub 検索へ移動できます。検索
  ボックスに入力すると、[ClawHub](https://clawhub.ai/plugins) がインラインで検索され、ダウンロード数とソース検証バッジを含む **From
  ClawHub** セクションが追加されます。

同梱 Plugin ではパッケージのインストールは不要です。メニュー操作は **Enable**
または **Disable** です。たとえば Workboard は OpenClaw に同梱されており、デフォルトでは
無効になっているため、有効にするには **Enable** を選択します。バンドル済み Plugin は
削除できず、無効化のみ可能です。

カタログと検索へのアクセスには `operator.read` が必要です。インストール、有効化、無効化、
削除、および MCP サーバーの変更には `operator.admin` が必要です。ClawHub からのインストールは
Gateway によって実行され、その信頼性、整合性、および Plugin インストール
ポリシーのチェックが維持されます。

Plugin コードをインストールまたは削除するには、Gateway の再起動が必要です。有効化状態の
変更は、インストール済み Plugin と現在の Gateway ランタイムが対応していれば再起動なしで適用できます。
それ以外の場合、UI に再起動が必要であることが表示されます。
OAuth 対応 MCP コネクターについては、追加後に CLI から一度だけ
`openclaw mcp login <name>` を実行する必要があります。

Control UI では、任意の npm、git、ローカルパスのソースからのインストール、
Plugin の更新、高度な Plugin 設定の公開は行いません。これらの操作には
以下の CLI ワークフローを使用してください。

## Plugin の一覧表示と検索

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

スクリプト向けの `--json`：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` はコールドインベントリチェックです。つまり、設定、マニフェスト、
永続化された Plugin レジストリから OpenClaw が検出できるものを確認します。すでに実行中の
Gateway が Plugin ランタイムをインポートしたことを証明するものではありません。JSON 出力には
レジストリ診断と、各 Plugin の `dependencyStatus`（宣言された
`dependencies`/`optionalDependencies` がディスク上で解決できるかどうか）が含まれます。

`plugins search` は ClawHub にインストール可能な Plugin パッケージを問い合わせ、
各結果にインストールのヒント（`openclaw plugins install clawhub:<package>`）を表示します。

## Plugin を有効化および無効化する

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

インストール済みファイルには触れず、Plugin の設定エントリを切り替えます。一部の
バンドル済み Plugin（バンドル済みのモデル／音声プロバイダー、バンドル済みブラウザー Plugin）は
デフォルトで有効です。それ以外はインストール後に `enable` が必要です。

## Plugin をインストールする

```bash
# ClawHub で Plugin パッケージを検索します。
openclaw plugins search "calendar"

# ClawHub からインストールします。
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# npm からインストールします。
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# ローカルの npm-pack アーティファクトからインストールします。
openclaw plugins install npm-pack:<path.tgz>

# git またはローカルの開発用チェックアウトからインストールします。
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

起動移行期間中、プレフィックスなしのパッケージ指定は npm からインストールされます。ただし、
名前がバンドル済みまたは公式 Plugin の ID と一致する場合、OpenClaw は
代わりにそのローカル／公式コピーを使用します。決定的なソース選択には `clawhub:`、`npm:`、`git:`、または
`npm-pack:` を使用してください。

異なるソースから既存のインストール先を上書きする場合にのみ `--force` を使用してください。
追跡対象の npm、ClawHub、または hook-pack インストールを通常どおりアップグレードする場合は、
代わりに `openclaw plugins update` を使用してください。`--force` は
`--link` と併用できません。

## 再起動と検査

設定の再読み込みが有効な、実行中の管理対象 Gateway は、Plugin コードの
インストール、更新、またはアンインストール後に自動的に再起動します。Gateway が
管理対象外であるか、再読み込みが無効な場合は、ライブランタイムのサーフェスを確認する前に
手動で再起動してください。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` は Plugin モジュールを読み込み、ランタイムサーフェス
（ツール、フック、サービス、Gateway メソッド、HTTP ルート、Plugin 所有の
CLI コマンド）が登録されたことを証明します。通常の `inspect` と `list` は、
コールドなマニフェスト／設定／レジストリのチェックにすぎません。

## Plugin を更新する

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin ID を渡すと、追跡中のインストール指定が再利用されます。保存済みの dist-tag
（`@beta`）と正確に固定されたバージョンは、以降の `update <plugin-id>`
実行にも引き継がれます。

`openclaw plugins update --all` は一括メンテナンス用の手段です。通常の
追跡対象インストール指定は引き続き尊重されますが、信頼済みの公式 OpenClaw
Plugin レコードは、古い正確な公式パッケージに固定されたままではなく、
現在の公式カタログ対象と同期されます。`update.channel` が
`beta` の場合、その同期ではベータリリース系列が優先されます。正確な指定またはタグ付きの公式指定を
変更せず維持するには、対象を指定した `update <plugin-id>` を使用してください。

npm インストールでは、明示的なパッケージ指定を渡して追跡レコードを
切り替えます。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2 番目のコマンドは、以前に正確なバージョンまたはタグへ固定されていた Plugin を、
レジストリのデフォルトリリース系列へ戻します。

正確なフォールバックおよび固定ルールについては、[`openclaw plugins`](/ja-JP/cli/plugins#update) を
参照してください。

## Plugin をアンインストールする

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

アンインストールでは、Plugin の設定エントリ、永続化された Plugin インデックスレコード、
許可／拒否リストのエントリ、および該当する場合はリンクされた `plugins.load.paths` エントリが
削除されます。`--keep-files` を渡さない限り、管理対象のインストールディレクトリも削除されます。
アンインストールによって Plugin のソースが変更された場合、実行中の管理対象 Gateway は自動的に再起動します。

Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin のインストール、更新、アンインストール、
有効化、無効化はすべて無効です。これらの選択は、インストール用の Nix ソースで
管理してください。

## ソースを選択する

| ソース      | 使用する場合                                                                    | 例                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw ネイティブの検出、スキャン概要、バージョン、ヒントを利用したい場合     | `openclaw plugins install clawhub:<package>`                   |
| git         | リポジトリのブランチ、タグ、またはコミットを使用したい場合                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上で Plugin を開発またはテストしている場合                  | `openclaw plugins install --link ./my-plugin`                  |
| マーケットプレイス | Claude 互換のマーケットプレイス Plugin をインストールする場合                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | npm のインストールセマンティクスを通じてローカルパッケージアーティファクトを検証する場合      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | JavaScript パッケージをすでに配布している場合、または npm の dist-tag／プライベートレジストリが必要な場合 | `openclaw plugins install npm:@acme/openclaw-plugin`           |

管理対象のローカルパスインストールは、Plugin ディレクトリまたはアーカイブである必要があります。
単独の Plugin ファイルは `plugins install` でインストールせず、
`plugins.load.paths` に配置してください。

## Plugin を公開する

ClawHub は、OpenClaw Plugin の主要な公開検出サーフェスです。ユーザーがインストール前に
Plugin のメタデータ、バージョン履歴、レジストリのスキャン結果、インストールのヒントを
確認できるようにしたい場合は、ClawHub で公開してください。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ネイティブ npm Plugin は、公開前に Plugin マニフェスト（`openclaw.plugin.json`）と
`package.json` メタデータを含める必要があります。

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

このページを公開リファレンスとして扱うのではなく、完全な公開契約については
以下のページを使用してください。

- [ClawHub での公開](/ja-JP/clawhub/publishing)では、所有者、スコープ、
  リリース、レビュー、パッケージ検証、パッケージ移管について説明します。
- [Plugin の構築](/ja-JP/plugins/building-plugins)では、完全な Plugin
  パッケージ構成（`openclaw.plugin.json` を含む）と初回公開
  ワークフローを示します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)では、ネイティブ Plugin マニフェストの
  フィールドを定義します。

同じパッケージが ClawHub と npm の両方で利用可能な場合は、明示的な
`clawhub:` または `npm:` プレフィックスを使用して一方のソースを指定してください。

## 関連項目

- [Plugin](/ja-JP/tools/plugin) - インストール、設定、再起動、トラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全な CLI リファレンス
- [コミュニティ Plugin](/ja-JP/plugins/community) - 公開検出と ClawHub での公開
- [ClawHub](/ja-JP/clawhub/cli) - レジストリの CLI 操作
- [Plugin の構築](/ja-JP/plugins/building-plugins) - Plugin パッケージを作成する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージのメタデータ
