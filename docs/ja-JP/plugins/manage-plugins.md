---
read_when:
    - Plugin のインストール、一覧表示、更新、またはアンインストールの簡単な例が必要な場合
    - ClawHub と npm Plugin 配布のどちらを選ぶかを決めたい場合
    - Plugin パッケージを公開しています
sidebarTitle: Manage plugins
summary: OpenClaw Plugin のインストール、一覧表示、アンインストール、更新、公開の簡単な例
title: Pluginを管理
x-i18n:
    generated_at: "2026-05-02T20:52:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

多くの Plugin ワークフローは、いくつかのコマンドで構成されます。検索、インストール、Gateway の再起動、検証、そして Plugin が不要になったらアンインストールします。

## Plugin を一覧表示

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

スクリプトでは `--json` を使用します。これには、レジストリ診断と、Plugin パッケージが `dependencies` または `optionalDependencies` を宣言している場合の各 Plugin の静的な `dependencyStatus` が含まれます。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` はコールドインベントリチェックです。config、マニフェスト、Plugin レジストリから OpenClaw が検出できるものを表示しますが、すでに実行中の Gateway プロセスが Plugin ランタイムをインポートしたことを証明するものではありません。

## Plugin をインストール

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
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Plugin コードをインストールした後、チャンネルを提供する Gateway を再起動します。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ツール、フック、サービス、Gateway メソッド、Plugin 所有の CLI コマンドなどのランタイムサーフェスを Plugin が登録したことの証明が必要な場合は、`inspect --runtime` を使用します。

## Plugin を更新

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Plugin が `@beta` などの npm dist-tag からインストールされていた場合、以後の `update <plugin-id>` 呼び出しでは記録済みのそのタグが再利用されます。明示的な npm spec を渡すと、今後の更新で追跡されるインストール先がその spec に切り替わります。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2 つ目のコマンドは、以前に正確なバージョンまたはタグへ固定されていた Plugin を、レジストリのデフォルトリリースラインへ戻します。

`openclaw update` がベータチャンネルで実行されると、デフォルトラインの npm および ClawHub Plugin レコードは、まず一致する Plugin の `@beta` リリースを試します。そのベータリリースが存在しない場合、OpenClaw は記録済みのデフォルトまたは latest spec にフォールバックします。正確なバージョンと、`@rc` や `@beta` などの明示的なタグは保持されます。

## Plugin をアンインストール

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

アンインストールでは、Plugin の config エントリ、Plugin インデックスレコード、許可/拒否リストのエントリ、および該当する場合はリンクされた読み込みパスが削除されます。`--keep-files` を渡さない限り、管理対象のインストールディレクトリも削除されます。

## Plugin を公開

外部 Plugin は [ClawHub](https://clawhub.ai)、npmjs.com、またはその両方に公開できます。

### ClawHub に公開

ClawHub は OpenClaw Plugin の主要な公開ディスカバリーサーフェスです。インストール前に、検索可能なメタデータ、バージョン履歴、レジストリスキャン結果をユーザーに提供します。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ユーザーは ClawHub から次のようにインストールします。

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸の形式でも、まず ClawHub が確認されます。

### npmjs.com に公開

ネイティブ npm Plugin には、Plugin マニフェストと `package.json` の OpenClaw エントリポイントメタデータを含める必要があります。

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

ユーザーは npm 専用で次のようにインストールします。

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

同じパッケージが ClawHub でも利用可能な場合、`npm:` は ClawHub lookup をスキップし、npm 解決を強制します。

## ソースの選択

- **ClawHub**: OpenClaw ネイティブのディスカバリー、スキャン要約、バージョン、インストールヒントが必要な場合に使用します。
- **npmjs.com**: すでに JavaScript パッケージを配布している場合、または npm dist-tag/private registry ワークフローが必要な場合に使用します。
- **Git**: ブランチ、タグ、またはコミットから直接インストールしたい場合に使用します。
- **ローカルパス**: 同じマシン上で Plugin を開発またはテストしている場合に使用します。

## 関連項目

- [Plugins](/ja-JP/tools/plugin) - 概要とトラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全な CLI リファレンス
- [ClawHub](/ja-JP/tools/clawhub) - 公開とレジストリ操作
- [Plugin の構築](/ja-JP/plugins/building-plugins) - Plugin パッケージを作成する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
