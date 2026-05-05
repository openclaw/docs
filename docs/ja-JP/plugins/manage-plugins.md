---
read_when:
    - すばやくプラグインのインストール、一覧表示、更新、またはアンインストールの例を確認したい場合
    - ClawHub と npm での Plugin 配布のどちらを選ぶかを決めたい場合
    - Plugin パッケージを公開しています
sidebarTitle: Manage plugins
summary: OpenClaw Plugin のインストール、一覧表示、アンインストール、更新、公開の簡単な例
title: Plugin を管理する
x-i18n:
    generated_at: "2026-05-05T01:48:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

ほとんどの Plugin ワークフローは、数個のコマンドで済みます。検索、インストール、Gateway の再起動、
検証、そしてその Plugin が不要になったらアンインストールです。

## Plugin を一覧表示する

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

スクリプトには `--json` を使用してください。これにはレジストリ診断と、Plugin パッケージが `dependencies` または
`optionalDependencies` を宣言している場合の各 Plugin の静的な `dependencyStatus` が含まれます。

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` はコールドインベントリチェックです。OpenClaw が設定、マニフェスト、Plugin レジストリから
検出できるものを表示します。すでに実行中の Gateway プロセスが Plugin ランタイムをインポートしたことを証明するものではありません。

## Plugin をインストールする

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

Plugin コードをインストールした後、チャンネルにサービスを提供する Gateway を再起動します。

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ツール、フック、サービス、Gateway メソッド、または Plugin が所有する CLI コマンドなどのランタイムサーフェスを
Plugin が登録したことを証明する必要がある場合は、`inspect --runtime` を使用してください。

## Plugin を更新する

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Plugin が `@beta` などの npm dist-tag からインストールされた場合、以降の
`update <plugin-id>` 呼び出しでは、記録されたそのタグが再利用されます。明示的な npm spec を渡すと、
今後の更新で追跡されるインストールがその spec に切り替わります。

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

2 つ目のコマンドは、以前に正確なバージョンまたはタグに固定されていた Plugin を、レジストリの既定のリリースラインに戻します。

`openclaw update` が beta チャンネルで実行される場合、既定ラインの npm および ClawHub
Plugin レコードは、対応する Plugin の `@beta` リリースを先に試します。その beta
リリースが存在しない場合、OpenClaw は記録済みの既定/latest spec にフォールバックします。
npm Plugin の場合、beta パッケージは存在するもののインストール検証に失敗した場合にも OpenClaw はフォールバックします。
正確なバージョン、および `@rc` や `@beta` などの明示的なタグは保持されます。

## Plugin をアンインストールする

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

アンインストールでは、該当する場合、Plugin の設定エントリ、Plugin インデックスレコード、許可/拒否リスト
エントリ、リンクされたロードパスが削除されます。管理対象のインストールディレクトリは、
`--keep-files` を渡さない限り削除されます。

## Plugin を公開する

外部 Plugin は [ClawHub](https://clawhub.ai)、npmjs.com、または
その両方に公開できます。

### ClawHub に公開する

ClawHub は、OpenClaw Plugin の主要な公開ディスカバリーサーフェスです。インストール前に、
検索可能なメタデータ、バージョン履歴、レジストリスキャン結果をユーザーに提供します。

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ユーザーは次のように ClawHub からインストールします。

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

裸の形式でも、まず ClawHub を確認します。

### npmjs.com に公開する

ネイティブ npm Plugin には、Plugin マニフェストと `package.json` の OpenClaw
エントリポイントメタデータを含める必要があります。

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

同じパッケージが ClawHub でも利用可能な場合、`npm:` は ClawHub ルックアップをスキップし、
npm 解決を強制します。

## ソースの選択

- **ClawHub**: OpenClaw ネイティブのディスカバリー、スキャン概要、
  バージョン、インストールヒントが必要な場合に使用します。
- **npmjs.com**: すでに JavaScript パッケージを配布している場合、または npm
  dist-tags/private registry ワークフローが必要な場合に使用します。
- **Git**: ブランチ、タグ、またはコミットから直接インストールしたい場合に使用します。
- **ローカルパス**: 同じマシン上で Plugin を開発またはテストしている場合に使用します。

## 関連情報

- [Plugins](/ja-JP/tools/plugin) - 概要とトラブルシューティング
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全な CLI リファレンス
- [ClawHub](/ja-JP/tools/clawhub) - 公開とレジストリ操作
- [Plugin の構築](/ja-JP/plugins/building-plugins) - Plugin パッケージを作成する
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
