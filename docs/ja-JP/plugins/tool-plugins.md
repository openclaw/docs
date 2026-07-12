---
read_when:
    - エージェントツールを追加するだけのシンプルな OpenClaw Plugin を構築したい場合
    - プラグインマニフェストのメタデータを手書きする代わりに、defineToolPlugin を使用したい場合
    - ツール専用Pluginのスキャフォールド、生成、検証、テスト、または公開が必要です
sidebarTitle: Tool Plugins
summary: defineToolPlugin と openclaw plugins init/build/validate を使用して、シンプルな型付きエージェントツールを構築する
title: ツールPlugin
x-i18n:
    generated_at: "2026-07-11T22:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` は、エージェントから呼び出せるツールだけを追加する Plugin を構築します。チャネル、モデルプロバイダー、フック、サービス、セットアップバックエンドは追加しません。Plugin のランタイムコードを読み込まずに OpenClaw がツールを検出するために必要なマニフェストメタデータを生成します。

プロバイダー、チャネル、フック、サービス、または複数の機能を持つ Plugin については、代わりに[Plugin の構築](/ja-JP/plugins/building-plugins)、[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、または[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)から始めてください。

## 要件

- Node 22.19+、Node 23.11+、または Node 24+。
- TypeScript ESM パッケージ出力。
- `dependencies` に `typebox` が必要（`devDependencies` だけでは不十分です。生成された Plugin が実行時にインポートします）。
- `openclaw/plugin-sdk/tool-plugin` を初めてエクスポートしたバージョンである `openclaw >=2026.5.17`。
- `dist/`、`openclaw.plugin.json`、`package.json` を配布するパッケージルート。

## クイックスタート

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` は以下を生成します。

| ファイル               | 目的                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | 1 つの `echo` ツールを含む `defineToolPlugin` エントリ             |
| `src/index.test.ts`    | ツール一覧を検証するメタデータテスト                               |
| `tsconfig.json`        | `dist/` への NodeNext TypeScript 出力                              |
| `vitest.config.ts`     | `src/**/*.test.ts` 用の Vitest 設定                                |
| `package.json`         | スクリプト、ランタイム依存関係、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 初期ツール用に生成されたマニフェストメタデータ                     |

`npm run plugin:build` は `npm run build`（tsc）を実行してから、`openclaw plugins build --entry ./dist/index.js` を実行します。`npm run plugin:validate` は再ビルドし、`openclaw plugins validate --entry ./dist/index.js` を実行します。検証に成功すると、以下が出力されます。

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` のオプション：

| フラグ                 | デフォルト         | 効果                                   |
| ---------------------- | ------------------ | -------------------------------------- |
| `--directory <path>`   | `<id>`             | 出力ディレクトリ                       |
| `--name <name>`        | タイトルケースの `<id>` | 表示名                             |
| `--type <type>`        | `tool`             | 生成タイプ：`tool` または `provider`   |
| `--force`              | オフ               | 既存の出力ディレクトリを上書き         |

## ツールを作成する

`defineToolPlugin` は、Plugin の識別情報、任意の設定スキーマ、および静的なツール一覧を受け取ります。パラメーター型と設定型は TypeBox スキーマから推論されます。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
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

ツール名は安定した API です。一意で小文字を使用し、コアツールや他の Plugin との衝突を避けられるだけの具体性を持つ名前を選んでください。

## 任意ツールとファクトリーツール

モデルに送信する前にユーザーがツールを明示的に許可リストへ追加する必要がある場合は、`optional: true` を設定します。`openclaw plugins build` は対応する `toolMetadata.<tool>.optional` マニフェストエントリを書き込むため、OpenClaw は Plugin のランタイムコードを読み込まずにそのツールが任意であることを認識できます。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

ツールを作成する前にランタイムツールコンテキストが必要な場合は、`factory` を使用します。たとえば、特定の実行で無効化する、サンドボックス状態を確認する、またはランタイムヘルパーをバインドする場合です。具体的なツールは実行時に構築されますが、メタデータは静的なままです。

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
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

ファクトリーでも、固定のツール名を事前に宣言します。Plugin がツール名を動的に計算する場合や、ツールをフック、サービス、プロバイダー、コマンドと組み合わせる場合は、`definePluginEntry` を直接使用してください。

## 戻り値

`defineToolPlugin` は、プレーンな戻り値を OpenClaw のツール結果形式でラップします。

- モデルにそのままのテキストを表示する場合は、文字列を返します。
- モデルに整形済み JSON を表示し、OpenClaw が元の値を `details` に保持する場合は、JSON 互換の値を返します。

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

カスタム `AgentToolResult` が必要な場合や、既存の `api.registerTool` 実装を再利用する場合は、ファクトリーツールを使用してください。

## 設定

`configSchema` は任意です。省略すると、OpenClaw は厳密な空オブジェクトスキーマを適用します。生成されるマニフェストには引き続き `configSchema` が含まれます。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

`configSchema` がある場合、2 番目の `execute` 引数はそこから型付けされます。

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw は、Gateway 設定内の該当 Plugin のエントリから Plugin 設定を読み取ります。ソースやドキュメントの例にシークレットをハードコードしないでください。Plugin のセキュリティモデルに従い、設定、環境変数、または SecretRef を使用してください。

## 生成されるメタデータ

OpenClaw は、Plugin のランタイムコードをインポートする前に Plugin マニフェストを読み取る必要があります。`defineToolPlugin` はこのための静的メタデータを公開し、`openclaw plugins build` はそれをパッケージに書き込みます。Plugin の ID、名前、説明、設定スキーマ、アクティベーション、またはツール名を変更した後は、ジェネレーターを再実行してください。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

1 ツールの Plugin 用に生成されるマニフェスト：

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
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

`contracts.tools` は重要な検出コントラクトです。インストール済みのすべての Plugin のランタイムを読み込まずに、各ツールをどの Plugin が所有するかを OpenClaw に伝えます。マニフェストが古いと、ツールが検出されなくなったり、登録エラーが誤った Plugin の問題として扱われたりする可能性があります。

## パッケージメタデータ

`openclaw plugins build` は、`package.json` も選択されたランタイムエントリに合わせます。

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

TypeScript ソースエントリではなく、ビルド済み JavaScript（`./dist/index.js`）を配布してください。ソースエントリはワークスペース内のローカル開発でのみ機能します。

## CI で検証する

生成されたメタデータが古い場合、`plugins build --check` はファイルを書き換えずに失敗します。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` は以下を確認します。

- `openclaw.plugin.json` が存在し、通常のマニフェストローダーを通過すること。
- 現在のエントリが `defineToolPlugin` メタデータをエクスポートしていること。
- 生成されたマニフェストフィールドがエントリのメタデータと一致すること。
- `contracts.tools` が宣言されたツール名と一致すること。
- `package.json` の `openclaw.extensions` が選択されたランタイムエントリを指していること。

## ローカルでインストールして確認する

別の OpenClaw チェックアウトまたはインストール済み CLI から、パッケージパスをインストールします。

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

パッケージ化したスモークテストでは、最初にパッケージを作成してから tarball をインストールします。

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

移行期間中は、修飾子のない npm パッケージ指定も引き続き npm からインストールされますが、OpenClaw Plugin の検出と配布には ClawHub が推奨されます。所有者スコープとリリースレビューについては、[ClawHub での公開](/ja-JP/clawhub/publishing)を参照してください。

## トラブルシューティング

### `plugin entry not found: ./dist/index.js`

選択したエントリファイルが存在しません。`npm run build` を実行してから、`openclaw plugins build --entry ./dist/index.js` または `openclaw plugins validate --entry ./dist/index.js` を再実行してください。

### `plugin entry does not expose defineToolPlugin metadata`

エントリが `defineToolPlugin` によって作成された値をエクスポートしていません。モジュールのデフォルトエクスポートが `defineToolPlugin(...)` の結果であることを確認するか、`--entry` で正しいエントリを指定してください。

### `openclaw.plugin.json generated metadata is stale`

マニフェストがエントリのメタデータと一致しなくなっています。以下を実行してください。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` と `package.json` の両方の変更をコミットしてください。

### `package.json openclaw.extensions must include ./dist/index.js`

パッケージメタデータが別のランタイムエントリを指しています。`openclaw plugins build --entry ./dist/index.js` を実行し、配布する予定のエントリにジェネレーターがパッケージメタデータを合わせるようにしてください。

### `Cannot find package 'typebox'`

ビルド済み Plugin は実行時に `typebox` をインポートします。`dependencies` に含めたままにし、再インストール、再ビルド、再検証を行ってください。

### インストール後にツールが表示されない

以下を順に確認してください。

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` の `contracts.tools` に、想定されるツール名が含まれている。
4. `package.json` に `openclaw.extensions: ["./dist/index.js"]` が含まれている。
5. Plugin のインストール後に Gateway が再起動または再読み込みされている。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin のエントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin SDK のサブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin CLI](/ja-JP/cli/plugins)
- [ClawHub への公開](/ja-JP/clawhub/publishing)
