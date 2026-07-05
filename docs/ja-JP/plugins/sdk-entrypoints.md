---
read_when:
    - defineToolPlugin、definePluginEntry、または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（完全 vs セットアップ vs CLI メタデータ）を理解したい
    - エントリーポイントのオプションを調べています
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: Plugin エントリポイント
x-i18n:
    generated_at: "2026-07-05T01:58:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eea0981df2d977ac8eceb32a757db3e8edbb57b7a60889dd1dd6ec75e110a230
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべての Plugin はデフォルトのエントリオブジェクトをエクスポートします。SDK は、それらを作成するためのヘルパーを提供します。

インストール済み Plugin では、利用可能な場合、`package.json` はランタイム読み込みをビルド済み JavaScript に向ける必要があります。

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

`extensions` と `setupEntry` は、ワークスペースと git チェックアウト開発向けの有効なソースエントリのままです。OpenClaw がインストール済みパッケージを読み込むときは `runtimeExtensions` と `runtimeSetupEntry` が優先され、npm パッケージがランタイム TypeScript コンパイルを避けられます。明示的なランタイムエントリが必要です。`runtimeSetupEntry` には `setupEntry` が必要であり、`runtimeExtensions` または `runtimeSetupEntry` の成果物が欠けている場合は、ソースへ黙ってフォールバックするのではなく、インストールまたは検出が失敗します。インストール済みパッケージが TypeScript ソースエントリのみを宣言している場合、OpenClaw は一致するビルド済み `dist/*.js` ピアが存在すればそれを使用し、その後 TypeScript ソースへフォールバックします。

すべてのエントリパスは Plugin パッケージディレクトリ内に留まる必要があります。ランタイムエントリと推論されたビルド済み JavaScript ピアによって、外部へ抜ける `extensions` または `setupEntry` ソースパスが有効になることはありません。

<Tip>
  **ウォークスルーを探していますか？** 手順ごとのガイドについては、[Tool Plugins](/ja-JP/plugins/tool-plugins)、
  [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)、または
  [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

## `defineToolPlugin`

**インポート:** `openclaw/plugin-sdk/tool-plugin`

エージェントツールだけを追加する単純な Plugin 向けです。`defineToolPlugin` は、作成元ソースを小さく保ち、TypeBox スキーマから設定とツールパラメータの型を推論し、プレーンな戻り値を OpenClaw ツール結果形式でラップし、`openclaw plugins build` が Plugin マニフェストへ書き込む静的メタデータを公開します。

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

- `configSchema` は任意です。省略すると、OpenClaw は厳密な空オブジェクトスキーマを使用し、生成されたマニフェストには引き続き `configSchema` が含まれます。
- `execute` はプレーンな文字列または JSON シリアライズ可能な値を返します。ヘルパーは、それを `details` 付きのテキストツール結果としてラップします。
- カスタムツール結果については、`openclaw/plugin-sdk/tool-results` が `textResult` と `jsonResult` をエクスポートします。
- ツール名は静的です。`openclaw plugins build` は宣言されたツールから `contracts.tools` を導出するため、作者が手作業で名前を重複させる必要はありません。
- ランタイム読み込みは厳密なままです。インストール済み Plugin には引き続き `openclaw.plugin.json` と `package.json` の `openclaw.extensions` が必要です。OpenClaw は、欠落したマニフェストデータを推論するために Plugin コードを実行しません。

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダー Plugin、高度なツール Plugin、フック Plugin、およびメッセージングチャネルでは**ない**もの向けです。

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

| フィールド     | 型                                                               | 必須 | デフォルト          |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | はい | -                   |
| `name`         | `string`                                                         | はい | -                   |
| `description`  | `string`                                                         | はい | -                   |
| `kind`         | `string`                                                         | いいえ | -                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空オブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい | -                   |

- `id` は `openclaw.plugin.json` マニフェストと一致している必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価用の関数にできます。
- OpenClaw は初回アクセス時にそのスキーマを解決してメモ化するため、高コストなスキーマビルダーは一度だけ実行されます。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` をチャネル固有の配線でラップします。`api.registerChannel({ plugin })` を自動的に呼び出し、任意のルートヘルプ CLI メタデータ継ぎ目を公開し、登録モードに応じて `registerFull` を制御します。

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

| フィールド          | 型                                                               | 必須 | デフォルト          |
| ------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                | `string`                                                         | はい | -                   |
| `name`              | `string`                                                         | はい | -                   |
| `description`       | `string`                                                         | はい | -                   |
| `plugin`            | `ChannelPlugin`                                                  | はい | -                   |
| `configSchema`      | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空オブジェクトスキーマ |
| `setRuntime`        | `(runtime: PluginRuntime) => void`                               | いいえ | -                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                             | いいえ | -                 |
| `registerFull`      | `(api: OpenClawPluginApi) => void`                               | いいえ | -                 |

- `setRuntime` は登録中に呼び出されるため、ランタイム参照を保存できます（通常は `createPluginRuntimeStore` 経由）。CLI メタデータ取得中はスキップされます。
- `registerCliMetadata` は、`api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"`、および
  `api.registrationMode === "full"` の間に実行されます。
  これを、チャネルが所有する CLI 記述子の正規の場所として使用してください。そうすることで、ルートヘルプは非アクティブ化されたままになり、検出スナップショットには静的コマンドメタデータが含まれ、通常の CLI コマンド登録は完全な Plugin 読み込みと互換性を保ちます。
- 検出登録は非アクティブ化ですが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼された Plugin エントリとチャネル Plugin モジュールを評価する場合があります。そのため、トップレベルのインポートは副作用なしに保ち、ソケット、クライアント、ワーカー、サービスは `"full"` のみのパスの背後に置いてください。
- `registerFull` は `api.registrationMode === "full"` のときだけ実行されます。セットアップ専用読み込み中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリにでき、OpenClaw は初回アクセス時に解決済みスキーマをメモ化します。
- Plugin が所有するルート CLI コマンドでは、コマンドを遅延読み込みのままにしつつルート CLI 解析ツリーから消えないようにしたい場合、`api.registerCli(..., { descriptors: [...] })` を推奨します。ペアのノード機能コマンドでは、コマンドが `openclaw nodes` 配下に配置されるように `api.registerNodeCliFeature(...)` を推奨します。その他のネストされた Plugin コマンドでは、`parentPath` を追加し、レジストラに渡される `program` オブジェクトでコマンドを登録してください。OpenClaw は Plugin を呼び出す前にそれを親コマンドへ解決します。チャネル Plugin では、それらの記述子を `registerCliMetadata(...)` から登録し、`registerFull(...)` はランタイム専用の作業に集中させることを推奨します。
- `registerFull(...)` が Gateway RPC メソッドも登録する場合は、Plugin 固有のプレフィックスに置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に強制変換されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル向けです。ランタイムまたは CLI 配線なしで、`{ plugin }` だけを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw は、チャネルが無効、未設定、または遅延読み込みが有効な場合、完全なエントリの代わりにこれを読み込みます。これが重要になる場合については、[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

実際には、`defineSetupPluginEntry(...)` を狭いセットアップヘルパーファミリーと組み合わせます。

- `createSetupTranslator`、インポート安全なセットアップパッチアダプター、lookup-note 出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委任されたセットアッププロキシなど、ランタイム安全なセットアップヘルパーには `openclaw/plugin-sdk/setup-runtime`
- 任意インストールのセットアップサーフェスには `openclaw/plugin-sdk/channel-setup`
- セットアップ/インストール CLI/アーカイブ/ドキュメントヘルパーには `openclaw/plugin-sdk/setup-tools`

重い SDK、CLI 登録、長寿命のランタイムサービスは完全なエントリに置いてください。

セットアップとランタイムのサーフェスを分割するバンドル済みワークスペースチャネルは、代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。その契約により、セットアップエントリはランタイムセッターを公開したまま、セットアップ安全な Plugin/シークレットのエクスポートを保持できます。

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

そのバンドル契約は、完全なチャネルエントリが読み込まれる前に、セットアップフローが軽量なランタイムセッターまたはセットアップ安全な Gateway サーフェスを本当に必要とする場合にのみ使用してください。`registerSetupRuntime` は `"setup-runtime"` 読み込みでのみ実行されます。遅延された完全アクティブ化の前に存在する必要がある設定専用ルートまたはメソッドに限定してください。

## 登録モード

`api.registrationMode` は、Plugin がどのように読み込まれたかを示します。

| モード            | 条件                              | 登録するもの                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 通常の Gateway 起動               | すべて                                                                                                                  |
| `"discovery"`     | 読み取り専用の capability 検出    | Channel 登録と静的 CLI descriptor。entry コードは読み込まれる場合があるが、ソケット、worker、client、service は省略する |
| `"setup-only"`    | 無効または未設定の Channel        | Channel 登録のみ                                                                                                        |
| `"setup-runtime"` | runtime が利用可能な setup flow   | Channel 登録と、完全な entry が読み込まれる前に必要な軽量 runtime のみ                                                  |
| `"cli-metadata"`  | ルート help / CLI metadata capture | CLI descriptor のみ                                                                                                     |

`defineChannelPluginEntry` はこの分割を自動的に処理する。Channel で
`definePluginEntry` を直接使う場合は、自分で mode を確認する。

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

Discovery mode は、非アクティブ化 registry snapshot を構築する。OpenClaw が Channel
capability と静的 CLI descriptor を登録できるように、Plugin entry と Channel Plugin オブジェクトは
評価される場合がある。discovery での module evaluation は信頼済みだが軽量なものとして扱うこと:
top level で network client、subprocess、listener、database connection、background worker、
credential read、その他の live runtime side effect を発生させない。

`"setup-runtime"` は、完全な bundled Channel runtime に再入せずに setup-only startup surface が
存在しなければならない期間として扱う。適しているのは、Channel 登録、setup-safe な HTTP route、
setup-safe な gateway method、委譲された setup helper である。重い background service、CLI registrar、
provider/client SDK bootstrap は引き続き `"full"` に属する。

CLI registrar については特に次の点に注意する。

- registrar が 1 つ以上の root command を所有し、初回 invocation 時に OpenClaw に実際の CLI module を
  lazy-load させたい場合は `descriptors` を使う
- それらの descriptor が、registrar によって公開されるすべての top-level command root をカバーしていることを確認する
- descriptor command name は、文字、数字、ハイフン、アンダースコアに限定し、
  文字または数字で始める。OpenClaw はこの形式から外れた descriptor name を拒否し、
  help を rendering する前に description から terminal control sequence を除去する
- eager compatibility path でのみ `commands` 単独を使う

## Plugin の形状

OpenClaw は、読み込まれた Plugin を登録動作によって分類する。

| 形状                  | 説明                                             |
| --------------------- | ------------------------------------------------ |
| **plain-capability**  | 1 つの capability type（例: provider-only）      |
| **hybrid-capability** | 複数の capability type（例: provider + speech） |
| **hook-only**         | hook のみ、capability なし                       |
| **non-capability**    | tool/command/service はあるが capability なし    |

Plugin の形状を確認するには `openclaw plugins inspect <id>` を使う。

## 関連

- [SDK 概要](/ja-JP/plugins/sdk-overview) - 登録 API と subpath reference
- [Runtime Helper](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [Setup と Config](/ja-JP/plugins/sdk-setup) - manifest、setup entry、deferred loading
- [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins) - provider 登録と hook
