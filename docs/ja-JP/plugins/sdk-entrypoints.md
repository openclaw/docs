---
read_when:
    - defineToolPlugin、definePluginEntry、または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（full と setup と CLI metadata）を理解したい
    - エントリーポイントのオプションを調べています
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: Plugin エントリポイント
x-i18n:
    generated_at: "2026-07-05T11:38:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc86fe21ccd7705aabf1873ac025c5ff7b6345da2edf2689b07d0f5e4b56e8fe
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべての Plugin はデフォルトのエントリオブジェクトをエクスポートします。SDK は
各エントリ形状に対応するヘルパーを提供します: `defineToolPlugin`、`definePluginEntry`、
`defineChannelPluginEntry`、`defineSetupPluginEntry`。

<Tip>
  **ウォークスルーを探していますか?** 手順ごとのガイドについては、[Tool Plugins](/ja-JP/plugins/tool-plugins)、
  [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)、または
  [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

## パッケージエントリ

インストール済み Plugin は、`package.json` の `openclaw` フィールドでソースと
ビルド済みエントリの両方を指します:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` と `setupEntry` はソースエントリで、ワークスペースおよび git
  checkout 開発に使われます。
- `runtimeExtensions` と `runtimeSetupEntry` はインストール済み
  パッケージで優先されます。これにより npm パッケージは実行時の TypeScript コンパイルをスキップできます。
- `runtimeExtensions` が存在する場合は、配列の長さが `extensions` と一致している必要があります
  (エントリは位置でペアになります)。`runtimeSetupEntry` には `setupEntry` が必要です。
- `runtimeExtensions`/`runtimeSetupEntry` アーティファクトが宣言されているのに
  存在しない場合、インストール/検出はパッケージングエラーで失敗します。OpenClaw は
  暗黙にソースへフォールバックしません。ソースフォールバック (下記) は、ランタイムエントリがまったく宣言されていない場合にのみ適用されます。
- インストール済みパッケージが TypeScript ソースエントリのみを宣言している場合、OpenClaw は
  対応するビルド済み `dist/*.js` (または `.mjs`/`.cjs`) ピアを探して使用します。
  見つからない場合は TypeScript ソースへフォールバックします。
- すべてのエントリパスは Plugin パッケージディレクトリ内にとどまる必要があります。ランタイム
  エントリや推論されたビルド済み JS ピアによって、外へ抜ける `extensions` または
  `setupEntry` ソースパスが有効になることはありません。

## `defineToolPlugin`

**インポート:** `openclaw/plugin-sdk/tool-plugin`

エージェントツールだけを追加する Plugin 向けです。ソースを小さく保ち、TypeBox スキーマから config
およびツールパラメータの型を推論し、プレーンな戻り値を
OpenClaw のツール結果形式でラップし、`openclaw plugins build` が Plugin マニフェスト (`contracts.tools`、
`configSchema`) に書き込む静的メタデータを公開します。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` は任意です。省略すると厳密な空オブジェクトスキーマが使われます
  (生成されたマニフェストには引き続き `configSchema` が含まれます)。
- `execute` はプレーン文字列または JSON シリアライズ可能な値を返します。ヘルパーは
  それをテキストツール結果としてラップし、`details` には元の
  (文字列化されていない) 戻り値を設定します。
- カスタムツール結果には、`openclaw/plugin-sdk/tool-results` が
  `textResult` と `jsonResult` をエクスポートしています。
- ツール名は静的なので、`openclaw plugins build` は手動で名前を重複させることなく、
  宣言されたツールから `contracts.tools` を導出します。
- ランタイム読み込みは厳密なままです。インストール済み Plugin には引き続き
  `openclaw.plugin.json` と `package.json` の `openclaw.extensions` が必要です。OpenClaw は
  不足しているマニフェストデータを推論するために Plugin コードを実行することはありません。

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

Provider Plugin、高度なツール Plugin、フック Plugin、およびメッセージングチャネルでは**ない**もの向けです。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| フィールド                | 型                                                               | 必須 | デフォルト            |
| ------------------------- | ---------------------------------------------------------------- | ---- | --------------------- |
| `id`                      | `string`                                                         | はい | -                     |
| `name`                    | `string`                                                         | はい | -                     |
| `description`             | `string`                                                         | はい | -                     |
| `kind`                    | `string` (非推奨、下記参照)                                     | いいえ | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空オブジェクトスキーマ |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | いいえ | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | いいえ | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | いいえ | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | はい | -                     |

- `id` は `openclaw.plugin.json` マニフェストと一致している必要があります。
- `kind` は非推奨です。代わりに `openclaw.plugin.json` マニフェストの `kind` フィールドで
  排他的スロット (`"memory"` または `"context-engine"`) を宣言してください。
  ランタイムエントリの `kind` は、古い Plugin との互換性フォールバックとしてのみ残っています。
- `configSchema` は遅延評価のための関数にできます。OpenClaw は初回アクセス時にスキーマを解決して
  メモ化するため、コストの高いスキーマビルダーは一度だけ実行されます。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` をチャネル固有の配線でラップします。自動的に
`api.registerChannel({ plugin })` を呼び出し、任意のルートヘルプ CLI
メタデータの継ぎ目を公開し、登録モードに応じて `registerFull` をゲートします。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| フィールド            | 型                                                               | 必須 | デフォルト            |
| --------------------- | ---------------------------------------------------------------- | ---- | --------------------- |
| `id`                  | `string`                                                         | はい | -                     |
| `name`                | `string`                                                         | はい | -                     |
| `description`         | `string`                                                         | はい | -                     |
| `plugin`              | `ChannelPlugin`                                                  | はい | -                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空オブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ | -                   |

コールバックは登録モードごとに実行されます (完全な表は
[登録モード](#registration-mode) にあります):

- `setRuntime` は `"cli-metadata"` と
  `"tool-discovery"` を除くすべてのモードで実行されます。通常は
  `createPluginRuntimeStore` を使って、ここでランタイム参照を保存します。
- `registerCliMetadata` は `"cli-metadata"`、`"discovery"`、および
  `"full"` で実行されます。チャネル所有の CLI ディスクリプタの正規の場所として使用してください。
  そうすることで、ルートヘルプは非アクティブ化のまま保たれ、検出スナップショットには静的な
  コマンドメタデータが含まれ、通常の CLI 登録は完全な Plugin 読み込みと互換性を保ちます。
- `registerFull` は `"full"` と `"tool-discovery"` でのみ実行されます。
  `"tool-discovery"` では、チャネル登録の_代わりに_実行されます。OpenClaw は
  `registerChannel`/`setRuntime` を完全にスキップし、`registerFull` のみを呼び出すため、
  スタンドアロンのツール検出または実行にチャネルが必要とする Provider/ツール登録は、
  通常のチャネルセットアップの背後ではなく、そこに置く必要があります。
- 検出登録は非アクティブ化ですが、インポート不要ではありません。OpenClaw は
  スナップショットを構築するために、信頼済み Plugin エントリとチャネル Plugin モジュールを評価することがあります。
  トップレベルのインポートに副作用がないようにし、ソケット、
  クライアント、ワーカー、サービスは `"full"` 専用パスの背後に置いてください。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリにできます。OpenClaw は
  初回アクセス時に解決済みスキーマをメモ化します。

CLI 登録:

- ルート CLI の解析木から消えないように遅延読み込みしたい、Plugin 所有のルート
  CLI コマンドには `api.registerCli(..., { descriptors: [...] })` を使います。
  ディスクリプタ名は文字、数字、ハイフン、アンダースコアに一致し、文字または数字で始まる必要があります。OpenClaw は他の
  形状を拒否し、ヘルプ表示前に説明から端末制御シーケンスを取り除きます。
  登録側が公開するすべてのトップレベルコマンドルートをカバーしてください。
  `commands` だけの場合は eager な互換パスのままです。
- ペアノード機能コマンドには `api.registerNodeCliFeature(...)` を使い、
  それらが `openclaw nodes` の下に配置されるようにします (
  `registerCli(registrar, { parentPath: ["nodes"], ... })` と同等です)。
- その他のネストされた Plugin コマンドには `parentPath` を追加し、登録側に渡された
  `program` オブジェクト上でコマンドを登録してください。OpenClaw は Plugin を呼び出す前に、
  それを親コマンドへ解決します。
- チャネル Plugin では、`registerCliMetadata` から CLI ディスクリプタを登録し、
  `registerFull` はランタイム専用の作業に集中させてください。
- `registerFull` が Gateway RPC メソッドも登録する場合は、Plugin 固有のプレフィックスに置いてください。
  予約済みのコア管理名前空間 (`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`) は常に
  `operator.admin` に強制されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル向けです。ランタイムや CLI の配線なしで
`{ plugin }` だけを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw はチャネルが無効、未設定、または遅延読み込みが有効な場合に、
完全なエントリの代わりにこれを読み込みます。これが重要になる場面については、
[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

`defineSetupPluginEntry(...)` は、限定されたセットアップヘルパーファミリーと組み合わせてください:

| Import                              | 用途                                                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | ランタイムセーフなセットアップヘルパー: `createSetupTranslator`、インポートセーフなセットアップパッチアダプター、lookup-note 出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
| `openclaw/plugin-sdk/channel-setup` | 任意インストール用セットアップサーフェス                                                                                                                                           |
| `openclaw/plugin-sdk/setup-tools`   | セットアップ/インストール CLI、アーカイブ、ドキュメントヘルパー                                                                                                                   |

重い SDK、CLI 登録、長寿命のランタイムサービスは
完全エントリに置いてください。

セットアップとランタイムのサーフェスを分割する同梱ワークスペースチャネルは、代わりに
`openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を使用できます。これにより、セットアップ
エントリはセットアップセーフな plugin/secrets エクスポートを維持しながら、ランタイム
セッターも公開できます。

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

これは、セットアップフローが完全チャネルエントリの読み込み前に軽量なランタイムセッターまたは
セットアップセーフな gateway サーフェスを本当に必要とする場合にのみ使用してください。
`registerSetupRuntime` は `"setup-runtime"` 読み込みでのみ実行されます。
遅延された完全アクティベーションの前に存在する必要がある、設定のみのルートまたはメソッドに
限定してください。

## 登録モード

`api.registrationMode` は、Plugin がどのように読み込まれたかを示します。

| モード             | タイミング                                         | 登録するもの                                                                                                          |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 通常の gateway 起動                               | すべて                                                                                                                |
| `"discovery"`      | 読み取り専用の capability discovery               | チャネル登録と静的 CLI 記述子。エントリコードは読み込まれる場合がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"tool-discovery"` | 特定 Plugin のツールを一覧表示または実行するスコープ付き読み込み | capability/tool 登録のみ。チャネルアクティベーションなし                                                              |
| `"setup-only"`     | 無効化済み/未設定のチャネル                       | チャネル登録のみ                                                                                                      |
| `"setup-runtime"`  | ランタイムが利用可能なセットアップフロー          | チャネル登録に加え、完全エントリの読み込み前に必要な軽量ランタイムのみ                                                |
| `"cli-metadata"`   | ルートヘルプ / CLI メタデータ取得                 | CLI 記述子のみ                                                                                                        |

`defineChannelPluginEntry` はこの分割を自動的に処理します。チャネルに
`definePluginEntry` を直接使用する場合は、自分でモードを確認し、
`"tool-discovery"` がチャネル登録をスキップすることを覚えておいてください。

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Register capability-only surfaces (providers/tools), no channel.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Discovery モードは、アクティベートしないレジストリスナップショットを構築します。
OpenClaw がチャネル capability と静的 CLI 記述子を登録できるように、Plugin エントリと
チャネル Plugin オブジェクトを評価する場合があります。Discovery におけるモジュール評価は、
信頼済みだが軽量なものとして扱ってください。トップレベルでネットワーククライアント、
サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、認証情報の読み取り、
その他のライブランタイム副作用を発生させないでください。

`"setup-runtime"` は、完全な同梱チャネルランタイムに再入することなく、
セットアップ専用の起動サーフェスが存在している必要がある期間として扱ってください。
適しているのは、チャネル登録、セットアップセーフな HTTP ルート、セットアップセーフな
gateway メソッド、委譲セットアップヘルパーです。重いバックグラウンドサービス、CLI レジストラー、
provider/client SDK ブートストラップは、引き続き `"full"` に属します。

## Plugin の形状

OpenClaw は、読み込まれた Plugin をその登録動作によって分類します。

| 形状                  | 説明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1 種類の capability type（例: provider のみ）       |
| **hybrid-capability** | 複数の capability type（例: provider + speech）    |
| **hook-only**         | フックのみ、capability なし                        |
| **non-capability**    | ツール/コマンド/サービスはあるが capability なし   |

Plugin の形状を確認するには、`openclaw plugins inspect <id>` を使用してください。

## 関連

- [SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API とサブパスリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) - マニフェスト、セットアップエントリ、遅延読み込み
- [チャネル Plugins](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) - provider 登録とフック
