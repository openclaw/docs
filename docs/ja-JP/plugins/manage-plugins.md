---
doc-schema-version: 1
read_when:
    - Plugin 一覧、インストール、更新、詳細表示、アンインストールの手早い例が必要な場合
    - Plugin のインストール元を選択したい
    - Plugin パッケージを公開するための適切なリファレンスが必要です
sidebarTitle: Manage plugins
summary: OpenClaw plugins の一覧表示、インストール、更新、検査、アンインストールのクイック例
title: Pluginを管理する
x-i18n:
    generated_at: "2026-07-05T11:39:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44170a7bdcac24bd1f39ea5a1d22af9af219f4c979cc18d839d0cf29bdb7c38
    source_path: plugins/manage-plugins.md
    workflow: 16
---

一般的なPlugin管理コマンド。完全なコマンド契約、フラグ、
ソース選択ルール、エッジケースについては、[`openclaw plugins`](/ja-JP/cli/plugins)を参照してください。

典型的なワークフロー: パッケージを見つけ、ClawHub、npm、git、または
ローカルパスからインストールし、管理対象Gatewayを自動再起動させる
（または手動で再起動する）。その後、Pluginのランタイム登録を確認します。

## Pluginの一覧表示と検索

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

スクリプト向けの`--json`:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list`はコールドなインベントリ確認です。OpenClawが
設定、マニフェスト、永続化されたPluginレジストリから検出できるものを示します。
すでに実行中のGatewayがPluginランタイムをインポートしたことは証明しません。
JSON出力には、レジストリ診断と各Pluginの`dependencyStatus`（宣言された
`dependencies`/`optionalDependencies`がディスク上で解決できるかどうか）が含まれます。

`plugins search`はClawHubにインストール可能なPluginパッケージを問い合わせ、
結果ごとにインストールヒント（`openclaw plugins install clawhub:<package>`）を出力します。

## Pluginの有効化と無効化

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

インストール済みファイルには触れずに、Pluginの設定エントリを切り替えます。一部の
バンドルPlugin（バンドルされたモデル/音声プロバイダー、バンドルされたブラウザーPlugin）
はデフォルトで有効です。それ以外はインストール後に`enable`が必要です。

## Pluginのインストール

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm-pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

裸のパッケージ指定は、ローンチ切り替え中はnpmからインストールされます。ただし、
名前がバンドル済みまたは公式Plugin IDに一致する場合、OpenClawは
代わりにそのローカル/公式コピーを使用します。決定的なソース選択には
`clawhub:`、`npm:`、`git:`、または
`npm-pack:`を使用してください。

`--force`は、異なるソースからの既存のインストール先を上書きする場合にのみ使用します。
追跡済みのnpm、ClawHub、またはhook-packインストールの日常的なアップグレードには、
代わりに`openclaw plugins update`を使用してください。`--force`は
`--link`ではサポートされません。

## 再起動と検査

設定リロードが有効な実行中の管理対象Gatewayは、Pluginコードの
インストール、更新、アンインストール後に自動で再起動します。Gatewayが
管理対象外、またはリロードが無効な場合は、ライブランタイムサーフェスを確認する前に
自分で再起動してください。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime`はPluginモジュールを読み込み、ランタイム
サーフェス（ツール、フック、サービス、Gatewayメソッド、HTTPルート、Plugin所有の
CLIコマンド）が登録されたことを証明します。通常の`inspect`と`list`は、
コールドなマニフェスト/設定/レジストリ確認にすぎません。

## Pluginの更新

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin IDを渡すと、その追跡済みインストール指定を再利用します。保存済みのdist-tags
（`@beta`）と正確に固定されたバージョンは、後続の`update <plugin-id>`
実行にも引き継がれます。

`openclaw plugins update --all`は一括メンテナンス用の経路です。通常の
追跡済みインストール指定は引き続き尊重しますが、信頼済みの公式OpenClaw
Pluginレコードは、古い正確な公式パッケージに固定されたままにせず、
現在の公式カタログターゲットへ同期します。`update.channel`が
`beta`の場合、その同期はbetaリリースラインを優先します。正確な、またはタグ付きの
公式指定をそのまま保つには、対象を絞った`update <plugin-id>`を使用してください。

npmインストールでは、追跡済みレコードを切り替えるために明示的なパッケージ指定を渡します。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2つ目のコマンドは、以前に正確なバージョンまたはタグに固定されていたPluginを、
レジストリのデフォルトリリースラインへ戻します。

正確なフォールバックと固定ルールについては、[`openclaw plugins`](/ja-JP/cli/plugins#update)を参照してください。

## Pluginのアンインストール

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

アンインストールは、該当する場合、Pluginの設定エントリ、永続化されたPluginインデックスレコード、
許可/拒否リストエントリ、リンクされた`plugins.load.paths`エントリを削除します。
`--keep-files`を渡さない限り、管理対象インストールディレクトリも削除されます。
アンインストールによってPluginソースが変更されると、実行中の管理対象Gatewayは
自動で再起動します。

Nixモード（`OPENCLAW_NIX_MODE=1`）では、Pluginのインストール、更新、
アンインストール、有効化、無効化はすべて無効です。代わりに、インストール用のNixソースで
これらの選択を管理してください。

## ソースの選択

| ソース      | 使用する場面                                                                    | 例                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClawネイティブの検出、スキャン概要、バージョン、ヒントが必要な場合     | `openclaw plugins install clawhub:<package>`                   |
| git         | リポジトリのブランチ、タグ、またはコミットが必要な場合                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上でPluginを開発またはテストしている場合                  | `openclaw plugins install --link ./my-plugin`                  |
| マーケットプレイス | Claude互換のマーケットプレイスPluginをインストールする場合                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | ローカルパッケージアーティファクトをnpm installの意味論で検証する場合      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | すでにJavaScriptパッケージを配布している、またはnpm dist-tags/プライベートレジストリが必要な場合 | `openclaw plugins install npm:@acme/openclaw-plugin`           |

管理対象のローカルパスインストールは、Pluginディレクトリまたはアーカイブである必要があります。
単体のPluginファイルは、`plugins install`でインストールする代わりに
`plugins.load.paths`へ配置してください。

## Pluginの公開

ClawHubはOpenClaw Plugin向けの主要な公開検出サーフェスです。ユーザーが
インストール前にPluginメタデータ、バージョン履歴、レジストリスキャン結果、
インストールヒントを見つけられるようにしたい場合は、そこで公開してください。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ネイティブnpm Pluginは、公開前にPluginマニフェスト（`openclaw.plugin.json`）と
`package.json`メタデータを同梱する必要があります。

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
次のページを使用してください。

- [ClawHubでの公開](/ja-JP/clawhub/publishing)では、所有者、スコープ、
  リリース、レビュー、パッケージ検証、パッケージ移管について説明します。
- [Pluginの構築](/ja-JP/plugins/building-plugins)では、完全なPlugin
  パッケージ形状（`openclaw.plugin.json`を含む）と初回公開
  ワークフローを示します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)では、ネイティブPluginマニフェスト
  フィールドを定義します。

同じパッケージがClawHubとnpmの両方で利用できる場合は、明示的な
`clawhub:`または`npm:`プレフィックスを使用して、片方のソースを強制してください。

## 関連

- [Plugin](/ja-JP/tools/plugin) - インストール、設定、再起動、トラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全なCLIリファレンス
- [コミュニティPlugin](/ja-JP/plugins/community) - 公開検出とClawHubでの公開
- [ClawHub](/ja-JP/clawhub/cli) - レジストリCLI操作
- [Pluginの構築](/ja-JP/plugins/building-plugins) - Pluginパッケージの作成
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
