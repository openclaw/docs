---
read_when:
    - シンプルな OpenClaw Plugin を構築して、agent tools だけを追加したい場合
    - 手書きでPluginマニフェストメタデータを書く代わりにdefineToolPluginを使う必要があります
    - ツール専用 Plugin をスキャフォールド、生成、検証、テスト、または公開する必要がある
sidebarTitle: Tool Plugins
summary: defineToolPlugin と openclaw plugins init/build/validate でシンプルな型付きエージェントツールを構築する
title: ツール Plugin
x-i18n:
    generated_at: "2026-07-05T11:42:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` は、エージェントから呼び出せるツールだけを追加する Plugin を構築します。チャネル、モデルプロバイダー、フック、サービス、セットアップバックエンドは含みません。Plugin のランタイムコードを読み込まずに OpenClaw がツールを検出するために必要なマニフェストメタデータを生成します。

プロバイダー、チャネル、フック、サービス、または複合機能の Plugin では、代わりに
[Plugin の構築](/ja-JP/plugins/building-plugins)、[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、
または [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) から始めてください。

## 要件

- Node 22.19+、Node 23.11+、または Node 24+。
- TypeScript ESM パッケージ出力。
- `dependencies` に `typebox`（`devDependencies` だけでは不十分です。生成された
  Plugin はランタイムでこれをインポートします）。
- `openclaw >=2026.5.17`。`openclaw/plugin-sdk/tool-plugin` をエクスポートする最初のバージョンです。
- `dist/`、`openclaw.plugin.json`、および
  `package.json` を同梱するパッケージルート。

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

| ファイル               | 目的                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 1 つの `echo` ツールを持つ `defineToolPlugin` エントリ            |
| `src/index.test.ts`    | ツール一覧をアサートするメタデータテスト                          |
| `tsconfig.json`        | `dist/` への NodeNext TypeScript 出力                             |
| `vitest.config.ts`     | `src/**/*.test.ts` 用の Vitest 設定                               |
| `package.json`         | スクリプト、ランタイム依存関係、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 初期ツール用に生成されたマニフェストメタデータ                    |

`npm run plugin:build` は `npm run build`（tsc）を実行してから
`openclaw plugins build --entry ./dist/index.js` を実行します。`npm run plugin:validate`
は再ビルドして `openclaw plugins validate --entry ./dist/index.js` を実行します。
検証に成功すると次のように表示されます。

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` のオプション:

| フラグ               | デフォルト       | 効果                                   |
| -------------------- | ---------------- | -------------------------------------- |
| `--directory <path>` | `<id>`           | 出力ディレクトリ                       |
| `--name <name>`      | タイトルケース化された `<id>` | 表示名                    |
| `--type <type>`      | `tool`           | スキャフォールド種別: `tool` または `provider` |
| `--force`            | オフ             | 既存の出力ディレクトリを上書き         |

## ツールを書く

`defineToolPlugin` は、Plugin の識別情報、省略可能な設定スキーマ、静的なツール一覧を受け取ります。パラメーター型と設定型は TypeBox スキーマから推論されます。

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

ツール名は安定した API です。コアツールや他の Plugin と衝突しないよう、一意で小文字、かつ十分に具体的な名前を選んでください。

## 任意ツールとファクトリーツール

ツールをモデルに送信する前にユーザーが明示的に許可リストへ追加すべき場合は、`optional: true` を設定します。`openclaw plugins build` は対応する
`toolMetadata.<tool>.optional` マニフェストエントリを書き込むため、OpenClaw は Plugin のランタイムコードを読み込まずに、そのツールが任意であることを確認できます。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

ツールを作成する前にランタイムツールコンテキストが必要な場合は、`factory` を使用します。特定の実行でオプトアウトする、サンドボックス状態を検査する、またはランタイムヘルパーをバインドする場合です。具体的なツールはランタイムで構築されますが、メタデータは静的なままです。

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

`defineToolPlugin` はプレーンな戻り値を OpenClaw のツール結果形式にラップします。

- モデルにその正確なテキストを見せる必要がある場合は文字列を返します。
- モデルに整形済み JSON を見せ、OpenClaw が元の値を `details` に保持する必要がある場合は JSON 互換の値を返します。

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

カスタムの `AgentToolResult` が必要な場合や、既存の `api.registerTool` 実装を再利用したい場合は、ファクトリーツールを使用してください。

## 設定

`configSchema` は省略可能です。省略すると、OpenClaw は厳密な空オブジェクトスキーマを適用します。生成されたマニフェストには引き続き `configSchema` が含まれます。

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

OpenClaw は Gateway 設定内の Plugin のエントリから Plugin 設定を読み取ります。ソースやドキュメント例にシークレットをハードコードしないでください。Plugin のセキュリティモデルに従って、設定、環境変数、または SecretRefs を使用してください。

## 生成されるメタデータ

OpenClaw は Plugin のランタイムコードをインポートする前に Plugin マニフェストを読み取る必要があります。
`defineToolPlugin` はそのための静的メタデータを公開し、
`openclaw plugins build` がそれをパッケージに書き込みます。Plugin の ID、名前、説明、設定スキーマ、アクティベーション、またはツール名を変更した後は、ジェネレーターを再実行してください。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

1 つのツールを持つ Plugin の生成マニフェスト:

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

`contracts.tools` は重要な検出コントラクトです。インストール済みのすべての Plugin のランタイムを読み込まずに、各ツールを所有する Plugin を OpenClaw に伝えます。マニフェストが古いと、ツールが検出から欠落したり、登録エラーが誤った Plugin のせいにされたりする可能性があります。

## パッケージメタデータ

`openclaw plugins build` は、選択されたランタイムエントリに合わせて `package.json` も整合させます。

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

TypeScript ソースエントリではなく、ビルド済み JavaScript（`./dist/index.js`）を同梱してください。
ソースエントリが機能するのは、ワークスペースローカル開発だけです。

## CI で検証する

生成されたメタデータが古い場合、`plugins build --check` はファイルを書き換えずに失敗します。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` は次を確認します。

- `openclaw.plugin.json` が存在し、通常のマニフェストローダーに合格する。
- 現在のエントリが `defineToolPlugin` メタデータをエクスポートしている。
- 生成されたマニフェストフィールドがエントリメタデータと一致する。
- `contracts.tools` が宣言されたツール名と一致する。
- `package.json` が `openclaw.extensions` で選択されたランタイムエントリを指している。

## ローカルでインストールして検査する

別の OpenClaw チェックアウトまたはインストール済み CLI から、パッケージパスをインストールします。

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

パッケージ化されたスモークテストでは、先に pack して tarball をインストールします。

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

インストール後、Gateway を再起動またはリロードし、エージェントにツールの使用を依頼します。ツールが表示されない場合は、コードを変更する前に Plugin ランタイムと有効なツールカタログを検査してください（[トラブルシューティング](#troubleshooting) を参照）。

## 公開

パッケージの準備ができたら ClawHub 経由で公開します。`clawhub package publish`
はソースを受け取ります。ローカルフォルダー、GitHub リポジトリ（`owner/repo[@ref]`）、または tarball URL です。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

明示的な ClawHub ロケーターでインストールします。

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

ベア npm パッケージ仕様はローンチ移行期間中も npm からインストールされますが、ClawHub は OpenClaw
Plugin に推奨される検出および配布サーフェスです。オーナースコープとリリースレビューについては、[ClawHub 公開](/ja-JP/clawhub/publishing) を参照してください。

## トラブルシューティング

### `plugin entry not found: ./dist/index.js`

選択されたエントリファイルが存在しません。`npm run build` を実行してから、
`openclaw plugins build --entry ./dist/index.js` または
`openclaw plugins validate --entry ./dist/index.js` を再実行してください。

### `plugin entry does not expose defineToolPlugin metadata`

エントリが `defineToolPlugin` によって作成された値をエクスポートしていません。モジュールのデフォルトエクスポートが `defineToolPlugin(...)` の結果であることを確認するか、`--entry` で正しいエントリを渡してください。

### `openclaw.plugin.json generated metadata is stale`

マニフェストがエントリメタデータと一致しなくなっています。次を実行してください。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` と `package.json` の両方の変更をコミットしてください。

### `package.json openclaw.extensions must include ./dist/index.js`

パッケージメタデータが別のランタイムエントリを指しています。ジェネレーターが出荷予定のエントリにパッケージメタデータを整合させるよう、
`openclaw plugins build --entry ./dist/index.js` を実行してください。

### `Cannot find package 'typebox'`

ビルド済み Plugin はランタイムで `typebox` をインポートします。`dependencies` に保持し、再インストール、再ビルド、検証の再実行を行ってください。

### インストール後にツールが表示されない

次の順序で確認してください。

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` に、想定されるツール名を含む `contracts.tools` がある。
4. `package.json` に `openclaw.extensions: ["./dist/index.js"]` がある。
5. Plugin のインストール後に Gateway が再起動または再読み込みされている。

## 関連項目

- [Plugin のビルド](/ja-JP/plugins/building-plugins)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugins CLI](/ja-JP/cli/plugins)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
