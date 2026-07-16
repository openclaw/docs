---
read_when:
    - エージェントツールを追加するだけのシンプルな OpenClaw Plugin を作成する場合
    - プラグインマニフェストのメタデータを手作業で記述する代わりに、defineToolPlugin を使用する場合
    - ツール専用Pluginのスキャフォールディング、生成、検証、テスト、または公開が必要です
sidebarTitle: Tool Plugins
summary: defineToolPlugin と openclaw plugins init/build/validate を使用して、シンプルな型付きエージェントツールを構築する
title: ツールプラグイン
x-i18n:
    generated_at: "2026-07-16T11:59:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` は、エージェントから呼び出し可能なツールのみを追加する Plugin を構築します。チャネル、モデルプロバイダー、フック、サービス、セットアップバックエンドは追加しません。Plugin のランタイムコードを読み込まずにツールを検出するために OpenClaw が必要とするマニフェストメタデータを生成します。

プロバイダー、チャネル、フック、サービス、または複数の機能を持つ Plugin については、代わりに
[Plugin の構築](/ja-JP/plugins/building-plugins)、[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、
または[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)から始めてください。

## 要件

- Node 22.22.3+、Node 24.15+、または Node 25.9+。
- TypeScript ESM パッケージ出力。
- `typebox` が `dependencies` に含まれていること（`devDependencies` だけでは不可。生成された
  Plugin が実行時にこれをインポートします）。
- `openclaw >=2026.5.17`。これは
  `openclaw/plugin-sdk/tool-plugin` をエクスポートする最初のバージョンです。
- `dist/`、`openclaw.plugin.json`、および
  `package.json` を配布するパッケージルート。

## クイックスタート

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` は次をスキャフォールドします。

| ファイル                   | 目的                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 1 つの `echo` ツールを持つ `defineToolPlugin` エントリ                     |
| `src/index.test.ts`    | ツールリストを検証するメタデータテスト                             |
| `tsconfig.json`        | `dist/` への NodeNext TypeScript 出力                             |
| `vitest.config.ts`     | `src/**/*.test.ts` 用の Vitest 設定                              |
| `package.json`         | スクリプト、ランタイム依存関係、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 初期ツール用に生成されたマニフェストメタデータ                  |

`npm run plugin:build` は `npm run build`（tsc）を実行してから
`openclaw plugins build --entry ./dist/index.js` を実行します。`npm run plugin:validate` は
再ビルドして `openclaw plugins validate --entry ./dist/index.js` を実行します。
検証に成功すると次のように出力されます。

```text
Plugin stock-quotes は有効です。
```

`openclaw plugins init <id>` のオプション：

| フラグ                 | デフォルト            | 効果                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 出力ディレクトリ                       |
| `--name <name>`      | タイトルケースの `<id>` | 表示名                           |
| `--type <type>`      | `tool`             | スキャフォールドの種類：`tool` または `provider`    |
| `--force`            | オフ                | 既存の出力ディレクトリを上書き |

## ツールを作成する

`defineToolPlugin` は、Plugin の識別情報、オプションの設定スキーマ、および
静的なツールリストを受け取ります。パラメーター型と設定型は
TypeBox スキーマから推論されます。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "株価スナップショットを取得します。",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "株価 API キー。" })),
    baseUrl: Type.Optional(Type.String({ description: "株価 API のベース URL。" })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "株価",
      description: "株価スナップショットを取得します。",
      parameters: Type.Object({
        symbol: Type.String({ description: "ティッカーシンボル（例：OPEN）。" }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

ツール名は安定した API です。コアツールや他の Plugin との衝突を避けられるよう、一意で小文字かつ十分に具体的な名前を選んでください。

## オプションツールとファクトリーツール

モデルに送信する前にユーザーがツールを明示的に許可リストへ追加する必要がある場合は、`optional: true` を設定します。`openclaw plugins build` は、対応する
`toolMetadata.<tool>.optional` マニフェストエントリを書き込むため、OpenClaw は
Plugin のランタイムコードを読み込まずに、そのツールがオプションであることを確認できます。

```typescript
tool({
  name: "workflow_run",
  description: "外部ワークフローを実行します。",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

ツールを作成する前にランタイムツールコンテキストが必要な場合は、`factory` を使用します。特定の実行で無効にする、サンドボックス状態を確認する、またはランタイムヘルパーをバインドする場合などです。具体的なツールは実行時に構築されますが、メタデータは静的なままです。

```typescript
tool({
  name: "local_workflow",
  description: "サンドボックス化されたセッションの外部でローカルワークフローを実行します。",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

ファクトリーでも、固定のツール名を事前に宣言します。Plugin がツール名を動的に計算する場合や、ツールをフック、サービス、プロバイダー、またはコマンドと組み合わせる場合は、`definePluginEntry` を直接使用してください。

## 戻り値

`defineToolPlugin` は、通常の戻り値を OpenClaw のツール結果形式にラップします。

- モデルにそのままのテキストを表示する場合は、文字列を返します。
- モデルに整形済み JSON を表示し、OpenClaw が元の値を `details` に保持する場合は、JSON 互換の値を返します。

```typescript
tool({
  name: "echo_text",
  description: "入力テキストをそのまま返します。",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "入力を構造化 JSON としてそのまま返します。",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

カスタムの `AgentToolResult` が必要な場合や、既存の `api.registerTool` 実装を再利用する場合は、ファクトリーツールを使用してください。

## 設定

`configSchema` はオプションです。省略すると、OpenClaw は厳密な空オブジェクトスキーマを適用します。生成されたマニフェストには引き続き `configSchema` が含まれます。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "設定を必要としないツールを追加します。",
  tools: () => [],
});
```

`configSchema` を指定すると、2 番目の `execute` 引数の型はそこから推論されます。

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "設定済みのツールを追加します。",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "設定が利用可能かどうかを確認します。",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw は Gateway 設定内の Plugin エントリから Plugin の設定を読み取ります。ソースやドキュメント例にシークレットをハードコードしないでください。Plugin のセキュリティモデルに従って、設定、環境変数、または SecretRefs を使用してください。

## 生成されたメタデータ

OpenClaw は Plugin のランタイムコードをインポートする前に、Plugin マニフェストを読み取る必要があります。
`defineToolPlugin` はこのための静的メタデータを公開し、
`openclaw plugins build` はそれをパッケージに書き込みます。Plugin の ID、名前、説明、設定スキーマ、アクティベーション、またはツール名を変更した後は、ジェネレーターを再実行してください。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

1 ツール Plugin 用に生成されたマニフェスト：

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "株価スナップショットを取得します。",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` は重要な検出コントラクトです。インストール済みのすべての Plugin のランタイムを読み込まずに、各ツールを所有する Plugin を OpenClaw に伝えます。マニフェストが古いと、ツールが検出されなくなったり、登録エラーが誤った Plugin のものと判断されたりする可能性があります。

## パッケージメタデータ

`openclaw plugins build` は、`package.json` も選択したランタイムエントリに合わせます。

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

TypeScript のソースエントリではなく、ビルド済み JavaScript（`./dist/index.js`）を配布してください。ソースエントリが機能するのは、ワークスペース内のローカル開発時のみです。

## CI で検証する

生成されたメタデータが古い場合、`plugins build --check` はファイルを書き換えずに失敗します。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` は次を確認します。

- `openclaw.plugin.json` が存在し、通常のマニフェストローダーを通過すること。
- 現在のエントリが `defineToolPlugin` メタデータをエクスポートすること。
- 生成されたマニフェストのフィールドがエントリメタデータと一致すること。
- `contracts.tools` が宣言されたツール名と一致すること。
- `package.json` が `openclaw.extensions` を選択したランタイムエントリへ向けていること。

## ローカルでインストールして確認する

別の OpenClaw チェックアウトまたはインストール済み CLI から、パッケージパスをインストールします。

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

パッケージ化したスモークテストでは、最初にパッケージを作成し、tarball をインストールします。

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

インストール後、Gateway を再起動または再読み込みし、エージェントにツールを使用するよう依頼します。ツールが表示されない場合は、コードを変更する前に Plugin のランタイムと有効なツールカタログを確認してください（[トラブルシューティング](#troubleshooting)を参照）。

## 公開

パッケージの準備ができたら、ClawHub を通じて公開します。`clawhub package publish` は、ローカルフォルダー、GitHub リポジトリ（`owner/repo[@ref]`）、または tarball URL をソースとして受け取ります。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

明示的な ClawHub ロケーターを使用してインストールします。

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

起動移行期間中は修飾なしの npm パッケージ指定でも引き続き npm からインストールされますが、OpenClaw Plugin の検出と配布には ClawHub が推奨される場所です。所有者スコープとリリースレビューについては、[ClawHub での公開](/ja-JP/clawhub/publishing)を参照してください。

## トラブルシューティング

### `plugin entry not found: ./dist/index.js`

選択したエントリファイルが存在しません。`npm run build` を実行してから、
`openclaw plugins build --entry ./dist/index.js` または
`openclaw plugins validate --entry ./dist/index.js` を再実行してください。

### `plugin entry does not expose defineToolPlugin metadata`

エントリが `defineToolPlugin` によって作成された値をエクスポートしていません。モジュールのデフォルトエクスポートが `defineToolPlugin(...)` の結果であることを確認するか、`--entry` で正しいエントリを指定してください。

### `openclaw.plugin.json generated metadata is stale`

マニフェストがエントリメタデータと一致しなくなりました。次を実行してください。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` と `package.json` の両方の変更をコミットしてください。

### `package.json openclaw.extensions must include ./dist/index.js`

パッケージメタデータが別のランタイムエントリを指しています。ジェネレーターがパッケージメタデータを配布予定のエントリに合わせるよう、`openclaw plugins build --entry ./dist/index.js` を実行してください。

### `Cannot find package 'typebox'`

ビルド済みの Plugin は実行時に `typebox` をインポートします。これを `dependencies` に保持し、再インストール、再ビルドしてから検証を再実行してください。

### インストール後にツールが表示されない

次の順序で確認してください。

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` に想定どおりのツール名を持つ `contracts.tools` があります。
4. `package.json` に `openclaw.extensions: ["./dist/index.js"]` があります。
5. Plugin のインストール後に Gateway が再起動または再読み込みされています。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin のエントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin SDK のサブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin CLI](/ja-JP/cli/plugins)
- [ClawHub への公開](/ja-JP/clawhub/publishing)
