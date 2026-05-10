---
read_when:
    - Plugin のインストール、一覧表示、更新、アンインストールの簡単な例が必要な場合
    - ClawHub と npm の Plugin 配布のどちらを選ぶか決めたい
    - Plugin パッケージを公開しています
sidebarTitle: Manage plugins
summary: OpenClaw Plugin のインストール、一覧表示、アンインストール、更新、公開の簡単な例
title: Pluginを管理する
x-i18n:
    generated_at: "2026-05-10T19:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

ほとんどのPluginワークフローは、いくつかのコマンドで完了します。検索、インストール、Gatewayの再起動、検証、そしてPluginが不要になったらアンインストールします。

## Pluginを一覧表示する

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

スクリプトには `--json` を使用します。これにはレジストリ診断と、Pluginパッケージが `dependencies` または `optionalDependencies` を宣言している場合の各Pluginの静的な `dependencyStatus` が含まれます。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` はコールドインベントリチェックです。OpenClawが設定、マニフェスト、Pluginレジストリから検出できるものを表示します。すでに実行中のGatewayプロセスがPluginランタイムをインポートしたことを証明するものではありません。

## Pluginをインストールする

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Pluginコードをインストールした後、チャンネルを提供しているGatewayを再起動します。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ツール、フック、サービス、Gatewayメソッド、Plugin所有のCLIコマンドなど、Pluginがランタイムサーフェスを登録した証拠が必要な場合は、`inspect --runtime` を使用します。

## Pluginを更新する

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Pluginが `@beta` などのnpm dist-tagからインストールされていた場合、その後の `update <plugin-id>` 呼び出しでは記録済みのタグが再利用されます。明示的なnpm仕様を渡すと、今後の更新で追跡されるインストール先がその仕様に切り替わります。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2つ目のコマンドは、以前に正確なバージョンまたはタグに固定されていたPluginを、レジストリのデフォルトのリリースラインに戻します。

`openclaw update` がベータチャンネルで実行されると、デフォルトラインのnpmおよびClawHubのPluginレコードは、まず一致するPluginの `@beta` リリースを試します。そのベータリリースが存在しない場合、OpenClawは記録済みのデフォルト/最新仕様にフォールバックします。npm Pluginの場合、ベータパッケージが存在してもインストール検証に失敗したときにも、OpenClawはフォールバックします。正確なバージョンと、`@rc` や `@beta` などの明示的なタグは保持されます。

## Pluginをアンインストールする

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

アンインストールでは、Pluginの設定エントリ、Pluginインデックスレコード、許可/拒否リストのエントリ、および該当する場合はリンク済みのロードパスが削除されます。管理対象のインストールディレクトリは、`--keep-files` を渡さない限り削除されます。

Nixモード（`OPENCLAW_NIX_MODE=1`）では、Pluginのインストール、更新、アンインストール、有効化、無効化コマンドは無効になります。代わりに、そのインストールのNixソースでこれらの選択を管理してください。nix-openclawでは、agent-firstの[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用します。

## Pluginを公開する

外部Pluginは [ClawHub](https://clawhub.ai)、npmjs.com、またはその両方に公開できます。

### ClawHubに公開する

ClawHubは、OpenClaw Plugin向けの主要な公開ディスカバリーサーフェスです。ユーザーはインストール前に、検索可能なメタデータ、バージョン履歴、レジストリスキャン結果を確認できます。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ユーザーは次の方法でClawHubからインストールします。

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸の形式でも、ClawHubが最初に確認されます。

### npmjs.comに公開する

ネイティブnpm Pluginには、Pluginマニフェストと `package.json` のOpenClawエントリポイントメタデータが必要です。

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
```

ユーザーはnpmのみから次の方法でインストールします。

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

同じパッケージがClawHubでも利用可能な場合、`npm:` はClawHub検索をスキップし、npm解決を強制します。

## ソースの選択

- **ClawHub**: OpenClawネイティブのディスカバリー、スキャン概要、バージョン、インストールヒントが必要な場合に使用します。
- **npmjs.com**: すでにJavaScriptパッケージを出荷している場合、またはnpmのdist-tag/プライベートレジストリワークフローが必要な場合に使用します。
- **Git**: ブランチ、タグ、またはコミットから直接インストールしたい場合に使用します。
- **ローカルパス**: 同じマシン上でPluginを開発またはテストしている場合に使用します。

## 関連

- [Plugins](/ja-JP/tools/plugin) - 概要とトラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全なCLIリファレンス
- [ClawHub](/ja-JP/clawhub/cli) - 公開とレジストリ操作
- [Pluginの構築](/ja-JP/plugins/building-plugins) - Pluginパッケージを作成する
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
