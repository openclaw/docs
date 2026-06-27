---
read_when:
    - defineToolPlugin、definePluginEntry、または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（full と setup と CLI メタデータの違い）を理解したい
    - エントリーポイントのオプションを確認しています
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: Plugin エントリポイント
x-i18n:
    generated_at: "2026-06-27T12:31:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべてのプラグインはデフォルトのエントリオブジェクトをエクスポートします。SDK は、それらを作成するためのヘルパーを提供します。

インストール済みプラグインでは、利用可能な場合、`package.json` でランタイム読み込みがビルド済み JavaScript を指すようにする必要があります。

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

`extensions` と `setupEntry` は、ワークスペースおよび git チェックアウトでの開発向けの有効なソースエントリのままです。`runtimeExtensions` と `runtimeSetupEntry` は、OpenClaw がインストール済みパッケージを読み込むときに優先され、npm パッケージがランタイムで TypeScript コンパイルを避けられるようにします。明示的なランタイムエントリは必須です。`runtimeSetupEntry` には `setupEntry` が必要であり、`runtimeExtensions` または `runtimeSetupEntry` の成果物が欠けている場合は、ソースへ暗黙にフォールバックせず、インストールまたは検出が失敗します。インストール済みパッケージが TypeScript ソースエントリだけを宣言している場合、OpenClaw は一致するビルド済みの `dist/*.js` ピアが存在すればそれを使用し、その後 TypeScript ソースへフォールバックします。

すべてのエントリパスは、プラグインパッケージディレクトリの内部に留まる必要があります。ランタイムエントリや推論されたビルド済み JavaScript ピアによって、外部へ抜ける `extensions` または `setupEntry` ソースパスが有効になることはありません。

<Tip>
  **ウォークスルーを探していますか？** 手順付きガイドについては、[ツールプラグイン](/ja-JP/plugins/tool-plugins)、[チャンネルプラグイン](/ja-JP/plugins/sdk-channel-plugins)、または
  [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

## `defineToolPlugin`

**インポート:** `openclaw/plugin-sdk/tool-plugin`

エージェントツールだけを追加する単純なプラグイン向けです。`defineToolPlugin` は、作成元のソースを小さく保ち、TypeBox スキーマから config とツールパラメーターの型を推論し、プレーンな戻り値を OpenClaw のツール結果形式でラップし、`openclaw plugins build` がプラグインマニフェストへ書き込む静的メタデータを公開します。

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

- `configSchema` は任意です。省略した場合、OpenClaw は厳密な空オブジェクトスキーマを使用し、生成されるマニフェストには引き続き `configSchema` が含まれます。
- `execute` はプレーンな文字列または JSON シリアライズ可能な値を返します。ヘルパーはそれを `details` 付きのテキストツール結果としてラップします。
- ツール名は静的です。`openclaw plugins build` は宣言されたツールから `contracts.tools` を導出するため、作成者が名前を手作業で重複して記述する必要はありません。
- ランタイム読み込みは厳密なままです。インストール済みプラグインには引き続き `openclaw.plugin.json` と `package.json` の `openclaw.extensions` が必要です。OpenClaw は、不足しているマニフェストデータを推論するためにプラグインコードを実行しません。

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダープラグイン、高度なツールプラグイン、フックプラグイン、およびメッセージングチャンネルでは**ない**もの向けです。

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

| フィールド     | 型                                                               | 必須     | デフォルト          |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | はい     | -                   |
| `name`         | `string`                                                         | はい     | -                   |
| `description`  | `string`                                                         | はい     | -                   |
| `kind`         | `string`                                                         | いいえ   | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ   | 空オブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい     | -                   |

- `id` は `openclaw.plugin.json` マニフェストと一致している必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価用の関数にできます。
- OpenClaw は初回アクセス時にそのスキーマを解決してメモ化するため、コストの高いスキーマビルダーは一度だけ実行されます。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` をチャンネル固有の配線でラップします。`api.registerChannel({ plugin })` を自動的に呼び出し、任意のルートヘルプ CLI メタデータの接合点を公開し、登録モードに基づいて `registerFull` をゲートします。

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

| フィールド          | 型                                                               | 必須     | デフォルト          |
| ------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                | `string`                                                         | はい     | -                   |
| `name`              | `string`                                                         | はい     | -                   |
| `description`       | `string`                                                         | はい     | -                   |
| `plugin`            | `ChannelPlugin`                                                  | はい     | -                   |
| `configSchema`      | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ   | 空オブジェクトスキーマ |
| `setRuntime`        | `(runtime: PluginRuntime) => void`                               | いいえ   | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                             | いいえ   | -                   |
| `registerFull`      | `(api: OpenClawPluginApi) => void`                               | いいえ   | -                   |

- `setRuntime` は登録中に呼び出されるため、ランタイム参照を保存できます（通常は `createPluginRuntimeStore` 経由）。CLI メタデータのキャプチャ中はスキップされます。
- `registerCliMetadata` は `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"`、および
  `api.registrationMode === "full"` の間に実行されます。
  これをチャンネル所有の CLI 記述子の標準的な場所として使用すると、ルートヘルプは非アクティブ化のままになり、検出スナップショットに静的コマンドメタデータが含まれ、通常の CLI コマンド登録は完全なプラグイン読み込みと互換性を保ちます。
- 検出登録は非アクティブ化ですが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼されたプラグインエントリとチャンネルプラグインモジュールを評価する場合があるため、トップレベルのインポートは副作用なしに保ち、ソケット、クライアント、ワーカー、サービスは `"full"` のみのパスの背後に置いてください。
- `registerFull` は `api.registrationMode === "full"` の場合にのみ実行されます。セットアップ専用読み込み中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリにでき、OpenClaw は初回アクセス時に解決済みスキーマをメモ化します。
- プラグイン所有のルート CLI コマンドでは、ルート CLI 解析ツリーから消えずにコマンドを遅延読み込みのままにしたい場合、`api.registerCli(..., { descriptors: [...] })` を優先してください。ペアノードの機能コマンドでは、コマンドが `openclaw nodes` 配下に置かれるように `api.registerNodeCliFeature(...)` を優先してください。その他のネストされたプラグインコマンドでは、`parentPath` を追加し、レジストラに渡される `program` オブジェクトにコマンドを登録してください。OpenClaw はプラグインを呼び出す前に、それを親コマンドへ解決します。チャンネルプラグインでは、それらの記述子を `registerCliMetadata(...)` から登録することを優先し、`registerFull(...)` はランタイム専用の作業に集中させてください。
- `registerFull(...)` が Gateway RPC メソッドも登録する場合は、プラグイン固有のプレフィックス配下に置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に強制変換されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル向けです。ランタイムや CLI の配線なしで、`{ plugin }` だけを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

チャンネルが無効、未設定、または遅延読み込みが有効な場合、OpenClaw は完全なエントリの代わりにこれを読み込みます。これが重要になる場面については、[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

実際には、`defineSetupPluginEntry(...)` を狭いセットアップヘルパーファミリーと組み合わせます。

- `createSetupTranslator`、インポート安全なセットアップパッチアダプター、lookup-note 出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシなど、ランタイム安全なセットアップヘルパーには `openclaw/plugin-sdk/setup-runtime`
- 任意インストールのセットアップサーフェスには `openclaw/plugin-sdk/channel-setup`
- セットアップ/インストール CLI/アーカイブ/docs ヘルパーには `openclaw/plugin-sdk/setup-tools`

重い SDK、CLI 登録、および長寿命のランタイムサービスは完全なエントリに置いてください。

セットアップサーフェスとランタイムサーフェスを分割するバンドル済みワークスペースチャンネルでは、代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。その契約により、セットアップエントリはランタイムセッターを公開しながら、セットアップ安全なプラグイン/シークレットのエクスポートを維持できます。

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

そのバンドル済み契約は、完全なチャンネルエントリが読み込まれる前に、セットアップフローが軽量なランタイムセッターまたはセットアップ安全な Gateway サーフェスを本当に必要とする場合にのみ使用してください。`registerSetupRuntime` は `"setup-runtime"` 読み込みに対してのみ実行されます。遅延された完全なアクティベーションの前に存在する必要がある、設定専用のルートまたはメソッドに限定してください。

## 登録モード

`api.registrationMode` は、プラグインがどのように読み込まれたかを示します。

| モード              | タイミング                              | 登録するもの                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 通常の Gateway 起動            | すべて                                                                                                              |
| `"discovery"`     | 読み取り専用の機能検出    | チャネル登録と静的 CLI 記述子。エントリコードは読み込まれる場合があるが、ソケット、ワーカー、クライアント、サービスはスキップする |
| `"setup-only"`    | 無効化済み/未設定のチャネル     | チャネル登録のみ                                                                                               |
| `"setup-runtime"` | ランタイムが利用可能なセットアップフロー | チャネル登録と、完全なエントリが読み込まれる前に必要な軽量ランタイムのみ                               |
| `"cli-metadata"`  | ルートヘルプ / CLI メタデータ取得  | CLI 記述子のみ                                                                                                    |

`defineChannelPluginEntry` はこの分割を自動的に処理します。チャネルで
`definePluginEntry` を直接使う場合は、自分でモードを確認してください。

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

検出モードは、有効化しないレジストリスナップショットを構築します。OpenClaw がチャネル機能と静的 CLI 記述子を登録できるように、Plugin エントリとチャネル Plugin オブジェクトを評価する場合があります。検出時のモジュール評価は信頼できるが軽量なものとして扱ってください。トップレベルでは、ネットワーククライアント、サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、認証情報の読み取り、その他のライブランタイム副作用を実行しないでください。

`"setup-runtime"` は、完全なバンドル済みチャネルランタイムに再度入ることなく、セットアップ専用の起動サーフェスが存在する必要がある期間として扱ってください。適しているのは、チャネル登録、セットアップに安全な HTTP ルート、セットアップに安全な Gateway メソッド、委譲されたセットアップヘルパーです。重いバックグラウンドサービス、CLI レジストラ、プロバイダー/クライアント SDK のブートストラップは、引き続き `"full"` に属します。

CLI レジストラについては、特に次の点に注意してください。

- レジストラが 1 つ以上のルートコマンドを所有し、最初の呼び出し時に OpenClaw に実際の CLI モジュールを遅延読み込みさせたい場合は、`descriptors` を使う
- それらの記述子が、レジストラによって公開されるすべてのトップレベルコマンドルートを網羅していることを確認する
- 記述子のコマンド名は、文字、数字、ハイフン、アンダースコアに限定し、文字または数字で始める。OpenClaw はこの形に合わない記述子名を拒否し、ヘルプを描画する前に説明から端末制御シーケンスを取り除く
- 前のめりな互換パスでのみ、`commands` 単独を使う

## Plugin の形状

OpenClaw は、読み込まれた Plugin を登録動作によって分類します。

| 形状                 | 説明                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1 種類の機能タイプ（例: プロバイダーのみ）           |
| **hybrid-capability** | 複数の機能タイプ（例: プロバイダー + 音声） |
| **hook-only**         | フックのみ、機能なし                        |
| **non-capability**    | ツール/コマンド/サービスはあるが機能なし        |

Plugin の形状を確認するには、`openclaw plugins inspect <id>` を使います。

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview) - 登録 API とサブパスリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) - マニフェスト、セットアップエントリ、遅延読み込み
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー登録とフック
