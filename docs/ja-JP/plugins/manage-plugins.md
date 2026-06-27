---
doc-schema-version: 1
read_when:
    - Plugin の一覧表示、インストール、更新、検査、アンインストールのクイックな例が必要な場合
    - Pluginのインストール元を選択したい
    - Plugin パッケージの公開に適したリファレンスが必要です
sidebarTitle: Manage plugins
summary: OpenClaw Pluginの一覧表示、インストール、更新、検査、アンインストールの簡単な例
title: Pluginを管理する
x-i18n:
    generated_at: "2026-06-27T12:17:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

このページは、一般的なPlugin管理コマンドに使用します。網羅的なコマンド
契約、フラグ、ソース選択ルール、エッジケースについては、
[`openclaw plugins`](/ja-JP/cli/plugins)を参照してください。

ほとんどのインストールワークフローは次のとおりです。

1. パッケージを見つける
2. ClawHub、npm、git、またはローカルパスからインストールする
3. 管理対象のGatewayを自動再起動させるか、非管理の場合は手動で再起動する
4. Pluginのランタイム登録を検証する

## Pluginの一覧表示と検索

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

スクリプトには`--json`を使用します。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list`はコールドなインベントリチェックです。設定、マニフェスト、PluginレジストリからOpenClawが検出できるものを表示しますが、すでに実行中のGatewayがPluginランタイムをインポートしたことは証明しません。JSON出力には、レジストリ診断と、Pluginパッケージが`dependencies`または`optionalDependencies`を宣言している場合の各Pluginの静的な`dependencyStatus`が含まれます。

`plugins search`はClawHubにインストール可能なPluginパッケージを問い合わせ、`openclaw plugins install clawhub:<package>`のようなインストールのヒントを出力します。

## Pluginをインストールする

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

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

裸のパッケージ仕様は、ローンチ切り替え期間中はnpmからインストールされます。決定的なソース選択が必要な場合は、`clawhub:`、`npm:`、`git:`、または`npm-pack:`を使用します。裸の名前が公式Plugin IDと一致する場合、OpenClawはカタログエントリを直接インストールできます。

既存のインストール先を意図的に上書きしたい場合にのみ、`--force`を使用してください。追跡済みのnpm、ClawHub、またはhook-packインストールの通常のアップグレードには、`openclaw plugins update`を使用します。

## 再起動と検査

Pluginコードをインストール、更新、またはアンインストールした後、設定リロードが有効な実行中の管理対象Gatewayは自動的に再起動します。Gatewayが管理対象でない場合、またはリロードが無効な場合は、ライブランタイムサーフェスを確認する前に自分で再起動してください。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ツール、フック、サービス、Gatewayメソッド、HTTPルート、Plugin所有のCLIコマンドなどのランタイムサーフェスをPluginが登録した証拠が必要な場合は、`inspect --runtime`を使用します。通常の`inspect`と`list`は、コールドなマニフェスト、設定、レジストリチェックです。

## Pluginを更新する

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin IDを渡すと、OpenClawは追跡済みのインストール仕様を再利用します。`@beta`のような保存済みdist-tagや正確に固定されたバージョンは、後続の`update <plugin-id>`実行でも引き続き使用されます。

`openclaw plugins update --all`は一括メンテナンス用のパスです。通常の追跡済みインストール仕様は引き続き尊重しますが、信頼済みの公式OpenClaw Pluginレコードは、古い正確な公式パッケージに留まる代わりに、現在の公式カタログターゲットへ同期できます。`update.channel`が`beta`に設定されている場合、その一括公式同期はベータチャンネルのコンテキストを使用します。正確な仕様またはタグ付きの公式仕様を意図的にそのままにしたい場合は、対象を指定した`update <plugin-id>`を使用してください。

npmインストールでは、明示的なパッケージ仕様を渡して追跡レコードを切り替えることができます。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2番目のコマンドは、以前に正確なバージョンまたはタグに固定されていたPluginを、レジストリのデフォルトリリースラインへ戻します。

`openclaw update`がベータチャンネルで実行される場合、Pluginレコードは一致する`@beta`リリースを優先できます。正確なフォールバックと固定ルールについては、[`openclaw plugins`](/ja-JP/cli/plugins#update)を参照してください。

## Pluginをアンインストールする

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

アンインストールは、Pluginの設定エントリ、永続化されたPluginインデックスレコード、許可/拒否リストエントリ、および該当する場合はリンクされたロードパスを削除します。`--keep-files`を渡さない限り、管理対象のインストールディレクトリは削除されます。アンインストールによってPluginソースが変更されると、実行中の管理対象Gatewayは自動的に再起動します。

Nixモード（`OPENCLAW_NIX_MODE=1`）では、Pluginのインストール、更新、アンインストール、有効化、無効化コマンドは無効です。代わりに、そのインストールのNixソースでこれらの選択を管理してください。

## ソースを選択する

| ソース      | 使用する場合                                                                    | 例                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClawネイティブの検出、スキャン概要、バージョン、ヒントが必要な場合     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | すでにJavaScriptパッケージを配布している、またはnpm dist-tag/プライベートレジストリが必要な場合 | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | リポジトリのブランチ、タグ、またはコミットが必要な場合                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上でPluginを開発またはテストしている場合                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | ローカルパッケージアーティファクトをnpmインストールのセマンティクスで検証する場合      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Claude互換のマーケットプレイスPluginをインストールする場合                   | `openclaw plugins install <plugin> --marketplace <source>`     |

管理対象のローカルパスインストールは、Pluginディレクトリまたはアーカイブである必要があります。スタンドアロンのPluginファイルは、`plugins install`でインストールするのではなく、`plugins.load.paths`に配置してください。

## Pluginを公開する

ClawHubは、OpenClaw Pluginの主要な公開検出サーフェスです。ユーザーがインストール前にPluginメタデータ、バージョン履歴、レジストリスキャン結果、インストールのヒントを見つけられるようにしたい場合は、そこで公開します。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ネイティブnpm Pluginは、公開前にPluginマニフェストとパッケージメタデータを含める必要があります。

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

このページを公開リファレンスとして扱うのではなく、完全な公開契約については次のページを使用してください。

- [ClawHubでの公開](/ja-JP/clawhub/publishing)では、所有者、スコープ、リリース、レビュー、パッケージ検証、パッケージ移管について説明します。
- [Pluginの構築](/ja-JP/plugins/building-plugins)では、Pluginパッケージの形と初回公開ワークフローを示します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)では、ネイティブPluginマニフェストフィールドを定義します。

同じパッケージがClawHubとnpmの両方で利用できる場合、どちらか一方のソースを強制する必要があるときは、明示的な`clawhub:`または`npm:`プレフィックスを使用してください。

## 関連

- [Plugin](/ja-JP/tools/plugin) - インストール、設定、再起動、トラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全なCLIリファレンス
- [コミュニティPlugin](/ja-JP/plugins/community) - 公開検出とClawHubでの公開
- [ClawHub](/ja-JP/clawhub/cli) - レジストリCLI操作
- [Pluginの構築](/ja-JP/plugins/building-plugins) - Pluginパッケージを作成する
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
