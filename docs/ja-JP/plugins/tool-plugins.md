---
read_when:
    - シンプルなOpenClaw Pluginを構築し、エージェントツールだけを追加したい場合
    - plugin manifest metadata を手書きする代わりに defineToolPlugin を使いたい場合
    - ツール専用Pluginをスキャフォールド、生成、検証、テスト、または公開する必要がある
sidebarTitle: Tool Plugins
summary: defineToolPlugin と openclaw plugins init/build/validate でシンプルな型付きエージェントツールを構築する
title: ツール Plugin
x-i18n:
    generated_at: "2026-06-27T12:36:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

ツール Plugin は、チャネル、モデルプロバイダー、フック、サービス、セットアップバックエンドを追加せずに、エージェントから呼び出せるツールを OpenClaw に追加します。Plugin が固定のツール一覧を所有し、ランタイムコードを読み込まなくてもそれらのツールを発見可能に保つマニフェストメタデータを OpenClaw に生成させたい場合は、`defineToolPlugin` を使用します。

推奨フローは次のとおりです。

1. `openclaw plugins init` でパッケージをスキャフォールドします。
2. `defineToolPlugin` でツールを記述します。
3. JavaScript をビルドします。
4. `openclaw plugins build` で `openclaw.plugin.json` と `package.json` のメタデータを生成します。
5. 公開またはインストールの前に、生成されたメタデータを検証します。

プロバイダー、チャネル、フック、サービス、または複合ケイパビリティの Plugin では、代わりに
[Plugin の構築](/ja-JP/plugins/building-plugins)、[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、
または [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) から始めます。

## 要件

- Node >= 22。
- TypeScript ESM パッケージ出力。
- 設定とツールパラメーターのスキーマには `typebox`。
- `openclaw >=2026.5.17`。`openclaw/plugin-sdk/tool-plugin` をエクスポートする最初の OpenClaw バージョンです。
- `dist/`、`openclaw.plugin.json`、`package.json` を配布できるパッケージルート。

生成された Plugin はランタイムで `typebox` をインポートするため、`typebox` は `devDependencies` だけでなく `dependencies` に保持してください。

## クイックスタート

新しい Plugin パッケージを作成します。

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

スキャフォールドは次を作成します。

- `src/index.ts`: `echo` ツールを持つ `defineToolPlugin` エントリ。
- `src/index.test.ts`: 小さなメタデータテスト。
- `tsconfig.json`: `dist/` への NodeNext TypeScript 出力。
- `package.json`: スクリプト、ランタイム依存関係、および `openclaw.extensions: ["./dist/index.js"]`。
- `openclaw.plugin.json`: 初期ツール用に生成されたマニフェストメタデータ。

期待される検証出力:

```text
Plugin stock-quotes is valid.
```

## ツールを書く

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

ツール名は安定した API です。コアツールや他の Plugin と衝突しないよう、一意で小文字、かつ十分に具体的な名前を選びます。

## 任意ツールとファクトリーツール

モデルへ送信する前に、ユーザーがそのツールを明示的に許可リストへ追加する必要がある場合は、`optional: true` を設定します。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` は対応する `toolMetadata.<tool>.optional` マニフェストエントリを書き込むため、OpenClaw は Plugin ランタイムコードを読み込まずにツールを発見できます。

ツールを作成する前にランタイムツールコンテキストが必要な場合は、`factory` を使用します。ファクトリーはメタデータを静的に保ちながら、特定の実行でツールをオプトアウトしたり、サンドボックス状態を検査したり、ランタイムヘルパーをバインドしたりできます。

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

ファクトリーも固定されたツール名向けです。Plugin がツール名を動的に計算する場合、またはツールをフック、サービス、プロバイダー、コマンド、その他のランタイムサーフェスと組み合わせる場合は、`definePluginEntry` を直接使用します。

## 戻り値

`defineToolPlugin` はプレーンな戻り値を OpenClaw のツール結果形式にラップします。

- モデルにその正確なテキストを見せたい場合は、文字列を返します。
- モデルに整形済み JSON を見せ、OpenClaw には元の値を `details` に保持させたい場合は、JSON 互換の値を返します。

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

カスタムの `AgentToolResult` を返す必要がある場合、または既存の `api.registerTool` 実装を再利用する必要がある場合は、ファクトリーツールを使用します。完全に動的なツールまたは複合 Plugin ケイパビリティが必要な場合は、`defineToolPlugin` ではなく `definePluginEntry` を使用します。

## 設定

`configSchema` は任意です。省略した場合、OpenClaw は厳密な空オブジェクトスキーマを使用し、生成されたマニフェストにも `configSchema` が含まれます。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

`configSchema` を含めると、2 番目の `execute` 引数はスキーマから型付けされます。

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

OpenClaw は Gateway 設定内の Plugin エントリから Plugin 設定を読み取ります。ソースやドキュメント例にシークレットをハードコードしないでください。Plugin のセキュリティモデルに従って、設定、環境変数、または SecretRefs を使用します。

## 生成されるメタデータ

OpenClaw はコールドメタデータからインストール済み Plugin を発見します。Plugin ランタイムコードをインポートする前に、Plugin マニフェストを読み取れる必要があります。そのため `defineToolPlugin` は静的メタデータを公開し、`openclaw plugins build` はそのメタデータをパッケージへ書き込みます。

Plugin ID、名前、説明、設定スキーマ、アクティベーション、またはツール名を変更した後は、ジェネレーターを実行します。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

1 ツールの Plugin では、生成されたマニフェストは次のようになります。

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

`contracts.tools` は重要な発見コントラクトです。これは、インストール済みのすべての Plugin ランタイムを読み込まずに、どの Plugin が各ツールを所有しているかを OpenClaw に伝えます。マニフェストが古い場合、発見結果からツールが欠落したり、登録エラーについて誤った Plugin が原因と見なされたりする可能性があります。

## パッケージメタデータ

シンプルなツール Plugin ワークフローでは、`openclaw plugins build` は `package.json` を選択された単一のランタイムエントリに合わせます。

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

インストール済みパッケージでは、`./dist/index.js` のようなビルド済み JavaScript を使用します。ソースエントリはワークスペース開発では便利ですが、公開パッケージは TypeScript ランタイム読み込みに依存すべきではありません。

## CI で検証する

生成されたメタデータが古い場合にファイルを書き換えず CI を失敗させるには、`plugins build --check` を使用します。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` は次を確認します。

- `openclaw.plugin.json` が存在し、通常のマニフェストローダーに合格すること。
- 現在のエントリが `defineToolPlugin` メタデータをエクスポートしていること。
- 生成されたマニフェストフィールドがエントリメタデータと一致すること。
- `contracts.tools` が宣言されたツール名と一致すること。
- `package.json` が `openclaw.extensions` で選択されたランタイムエントリを指していること。

## ローカルでインストールして調査する

別の OpenClaw チェックアウトまたはインストール済み CLI から、パッケージパスをインストールします。

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

パッケージ化されたスモークでは、先にパックして tarball をインストールします。

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

インストール後、Gateway を起動または再起動し、エージェントにツールを使うよう依頼します。ツールの可視性をデバッグしている場合は、コードを変更する前に Plugin ランタイムと有効なツールカタログを調査します。

## 公開

パッケージの準備ができたら ClawHub 経由で公開します。

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

明示的な ClawHub ロケーターでインストールします。

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

ローンチ移行中は素の npm パッケージ指定も引き続きサポートされますが、OpenClaw Plugin の発見と配布のサーフェスとしては ClawHub が推奨です。

## トラブルシューティング

### `plugin entry not found: ./dist/index.js`

選択されたエントリファイルが存在しません。`npm run build` を実行してから、`openclaw plugins build --entry ./dist/index.js` または `openclaw plugins validate --entry ./dist/index.js` を再実行します。

### `plugin entry does not expose defineToolPlugin metadata`

エントリが `defineToolPlugin` で作成された値をエクスポートしていません。モジュールのデフォルトエクスポートが `defineToolPlugin(...)` の結果であることを確認するか、`--entry` で正しいエントリを渡します。

### `openclaw.plugin.json generated metadata is stale`

マニフェストがエントリメタデータと一致しなくなっています。次を実行します。

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` と `package.json` の両方の変更をコミットします。

### `package.json openclaw.extensions must include ./dist/index.js`

パッケージメタデータが別のランタイムエントリを指しています。ジェネレーターが配布予定のエントリにパッケージメタデータを合わせるよう、`openclaw plugins build --entry ./dist/index.js` を実行します。

### `Cannot find package 'typebox'`

ビルド済み Plugin はランタイムで `typebox` をインポートします。`typebox` を `dependencies` に保持し、パッケージ依存関係を再インストールして、再ビルドし、検証を再実行します。

### インストール後にツールが表示されない

次を順番に確認します。

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` の `contracts.tools` に期待するツール名が含まれていること。
4. `package.json` に `openclaw.extensions: ["./dist/index.js"]` があること。
5. Plugin のインストール後に Gateway が再起動またはリロードされていること。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugins CLI](/ja-JP/cli/plugins)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
