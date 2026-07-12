---
doc-schema-version: 1
read_when:
    - Control UI で Plugin を参照、インストール、有効化、または無効化したい場合
    - Plugin の一覧表示、インストール、更新、確認、アンインストールの簡単な例が必要な場合
    - Plugin のインストール元を選択する場合
    - Plugin パッケージの公開に適したリファレンスが必要な場合
sidebarTitle: Manage plugins
summary: Control UI または CLI から OpenClaw のプラグインを管理する
title: Pluginを管理する
x-i18n:
    generated_at: "2026-07-11T22:27:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI は、一般的な検出、インストール、有効化、無効化の
ワークフローに対応します。CLI ではさらに、更新、アンインストール、高度な設定、明示的な
インストール元の制御を行えます。コマンドの完全な仕様、フラグ、ソース選択
ルール、エッジケースについては、[`openclaw plugins`](/ja-JP/cli/plugins) を参照してください。

一般的な CLI ワークフローは、パッケージを検索し、ClawHub、npm、git、または
ローカルパスからインストールし、管理対象の Gateway を自動再起動させる（または手動で再起動する）、
その後 Plugin のランタイム登録を検証する、という流れです。

## Control UI を使用する

Control UI で **Plugin** を開くか、設定済みの Control UI ベースパスを基準に
`/settings/plugins` を使用します。たとえば、ベースパスが `/openclaw` の場合は
`/openclaw/settings/plugins` を使用します。このページには 2 つのタブがあります。

- **インストール済み** には、カテゴリー（チャンネル、
  モデルプロバイダー、メモリ、ツール）別にグループ化されたローカルインベントリ全体が表示されます。
  各行から詳細ビューを開けます。オーバーフロー（`…`）メニューでは Plugin を有効または無効にでき、
  外部からインストールした Plugin には **削除** も表示されます。このタブには、設定済みの
  [MCP サーバー](/ja-JP/cli/mcp)も表示され、同じメニュー操作で有効化、無効化、削除を行えます。
  これらの操作では、Gateway 設定の `mcp.servers` が編集されます。
- **検出** はストアです。OpenClaw に含まれる注目の Plugin、公式の
  外部 Plugin、厳選されたコネクター一覧が表示されます。コネクターカードでは、
  ホスト型 MCP サーバー（GitHub、Notion、Linear、Sentry、
  Home Assistant）をワンクリックで追加するか、検索条件が入力済みの ClawHub 検索へ移動できます。
  検索ボックスに入力すると [ClawHub](https://clawhub.ai/plugins) がインラインで検索され、
  ダウンロード数とソース検証バッジを含む **ClawHub から** セクションが追加されます。

同梱 Plugin はパッケージをインストールする必要がありません。メニュー操作は **有効化**
または **無効化** です。たとえば Workboard は OpenClaw に同梱され、
デフォルトでは無効になっているため、使用するには **有効化** を選択します。バンドルされた Plugin は
削除できず、無効化のみ可能です。

カタログと検索へのアクセスには `operator.read` が必要です。インストール、有効化、無効化、
削除、および MCP サーバーの変更には `operator.admin` が必要です。ClawHub からのインストールは
Gateway によって実行され、信頼性、整合性、Plugin インストール
ポリシーのチェックが維持されます。

Plugin コードのインストールまたは削除には Gateway の再起動が必要です。有効化状態の
変更は、インストール済み Plugin と現在の Gateway ランタイムが対応していれば再起動なしで適用できます。
対応していない場合、UI に再起動が必要であることが表示されます。
OAuth を使用する MCP コネクターは、追加後も CLI から一度だけ
`openclaw mcp login <name>` を実行する必要があります。

Control UI では、任意の npm、git、ローカルパスのソースからのインストール、
Plugin の更新、高度な Plugin 設定の公開は行えません。これらの操作には、
以下の CLI ワークフローを使用してください。

## Plugin の一覧表示と検索

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

スクリプト用の `--json`：

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` はコールドインベントリチェックです。つまり、OpenClaw が
設定、マニフェスト、永続化された Plugin レジストリから検出できる対象を確認します。
すでに実行中の Gateway が Plugin ランタイムをインポートしたことを証明するものではありません。
JSON 出力には、レジストリ診断と各 Plugin の `dependencyStatus`（宣言された
`dependencies`/`optionalDependencies` がディスク上で解決できるかどうか）が含まれます。

`plugins search` は、インストール可能な Plugin パッケージを ClawHub で検索し、
結果ごとにインストール方法のヒント（`openclaw plugins install clawhub:<package>`）を表示します。

## Plugin を有効化および無効化する

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

インストール済みファイルには触れず、Plugin の設定エントリーを切り替えます。一部の
バンドル Plugin（バンドルされたモデル／音声プロバイダー、バンドルされたブラウザー Plugin）は
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

起動移行期間中、プレフィックスのないパッケージ指定は npm からインストールされます。ただし、
名前がバンドル済みまたは公式の Plugin ID と一致する場合、OpenClaw は
代わりにそのローカル／公式コピーを使用します。ソースを確定的に選択するには、
`clawhub:`、`npm:`、`git:`、または `npm-pack:` を使用してください。

`--force` は、異なるソースから既存のインストール先を上書きする場合にのみ使用してください。
追跡対象の npm、ClawHub、または hook-pack インストールを通常どおりアップグレードする場合は、
代わりに `openclaw plugins update` を使用してください。`--force` は
`--link` と併用できません。

## 再起動して検査する

設定の再読み込みが有効な実行中の管理対象 Gateway は、Plugin コードの
インストール、更新、アンインストール後に自動的に再起動します。Gateway が
管理対象外であるか、再読み込みが無効な場合は、稼働中のランタイムサーフェスを確認する前に
自分で再起動してください。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` は Plugin モジュールを読み込み、ランタイム
サーフェス（ツール、フック、サービス、Gateway メソッド、HTTP ルート、Plugin 所有の
CLI コマンド）が登録されたことを証明します。通常の `inspect` と `list` は、
コールド状態のマニフェスト／設定／レジストリチェックのみを行います。

## Plugin を更新する

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin ID を渡すと、追跡されているインストール指定が再利用されます。保存された dist-tag
（`@beta`）と完全に固定されたバージョンは、以後の `update <plugin-id>`
実行にも引き継がれます。

`openclaw plugins update --all` は一括メンテナンス用の経路です。通常の
追跡対象インストール指定は引き続き尊重されますが、信頼済みの公式 OpenClaw
Plugin レコードは、古い公式パッケージの完全固定バージョンに留まるのではなく、
現在の公式カタログの対象に同期されます。`update.channel` が
`beta` の場合、この同期ではベータリリース系列が優先されます。完全指定またはタグ付きの
公式指定を変更せず維持するには、対象を指定した `update <plugin-id>` を使用してください。

npm インストールでは、追跡対象レコードを切り替えるために明示的なパッケージ指定を渡します。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2 つ目のコマンドは、Plugin が以前に完全なバージョンまたはタグに固定されていた場合、
レジストリのデフォルトリリース系列へ戻します。

正確なフォールバックおよび固定ルールについては、
[`openclaw plugins`](/ja-JP/cli/plugins#update) を参照してください。

## Plugin をアンインストールする

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

アンインストールでは、Plugin の設定エントリー、永続化された Plugin インデックスレコード、
許可／拒否リストのエントリー、および該当する場合はリンクされた `plugins.load.paths` の
エントリーが削除されます。`--keep-files` を渡さない限り、管理対象の
インストールディレクトリも削除されます。アンインストールによって Plugin のソースが変更された場合、
実行中の管理対象 Gateway は自動的に再起動します。

Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin のインストール、更新、アンインストール、
有効化、無効化はすべて無効です。代わりに、インストール用の Nix ソースで
これらの選択を管理してください。

## ソースを選択する

| ソース      | 使用する場合                                                                    | 例                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw ネイティブの検出、スキャン概要、バージョン、ヒントを利用したい場合     | `openclaw plugins install clawhub:<package>`                   |
| git         | リポジトリのブランチ、タグ、コミットを使用したい場合                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上で Plugin を開発またはテストしている場合                  | `openclaw plugins install --link ./my-plugin`                  |
| マーケットプレイス | Claude 互換のマーケットプレイス Plugin をインストールする場合                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | npm インストールのセマンティクスを通じてローカルパッケージアーティファクトを検証する場合      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | すでに JavaScript パッケージを公開しているか、npm dist-tag／プライベートレジストリが必要な場合 | `openclaw plugins install npm:@acme/openclaw-plugin`           |

管理対象のローカルパスインストールには、Plugin ディレクトリまたはアーカイブを指定する必要があります。
単独の Plugin ファイルは `plugins install` でインストールせず、
`plugins.load.paths` に配置してください。

## Plugin を公開する

ClawHub は OpenClaw Plugin の主要な公開検出サーフェスです。ユーザーがインストール前に
Plugin のメタデータ、バージョン履歴、レジストリのスキャン結果、インストール方法のヒントを
確認できるようにしたい場合は、ClawHub で公開してください。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ネイティブ npm Plugin を公開する前に、Plugin マニフェスト（`openclaw.plugin.json`）と
`package.json` メタデータを同梱する必要があります。

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

このページを公開仕様のリファレンスとして扱うのではなく、完全な公開仕様については
以下のページを参照してください。

- [ClawHub での公開](/ja-JP/clawhub/publishing)では、所有者、スコープ、
  リリース、レビュー、パッケージ検証、パッケージ移管について説明します。
- [Plugin の構築](/ja-JP/plugins/building-plugins)では、Plugin パッケージの完全な
  構成（`openclaw.plugin.json` を含む）と、初回公開のワークフローを示します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)では、ネイティブ Plugin マニフェストの
  フィールドを定義します。

同じパッケージが ClawHub と npm の両方で提供されている場合は、明示的な
`clawhub:` または `npm:` プレフィックスを使用して、どちらか一方のソースを指定してください。

## 関連項目

- [Plugin](/ja-JP/tools/plugin) - インストール、設定、再起動、トラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - CLI の完全なリファレンス
- [コミュニティ Plugin](/ja-JP/plugins/community) - 公開検出と ClawHub での公開
- [ClawHub](/ja-JP/clawhub/cli) - レジストリの CLI 操作
- [Plugin の構築](/ja-JP/plugins/building-plugins) - Plugin パッケージの作成
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
