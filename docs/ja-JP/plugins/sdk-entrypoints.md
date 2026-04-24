---
read_when:
    - definePluginEntryまたはdefineChannelPluginEntryの正確な型シグネチャが必要な場合
    - 登録モード（full対setup対CLI metadata）を理解したい場合
    - エントリーポイントオプションを調べている場合
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry、およびdefineSetupPluginEntryのリファレンス
title: Pluginエントリーポイント
x-i18n:
    generated_at: "2026-04-24T05:11:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

すべてのPluginはデフォルトのentry objectをexportします。SDKには、
それを作成するための3つのヘルパーがあります。

インストール済みPluginでは、`package.json`はランタイム読み込み先として、
利用可能な場合はビルド済みJavaScriptを指すようにしてください。

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

`extensions`と`setupEntry`は、workspaceおよびgit
checkout開発向けのソースentryとして引き続き有効です。`runtimeExtensions`と`runtimeSetupEntry`は、
OpenClawがインストール済みパッケージを読み込む際に優先され、
npmパッケージで実行時TypeScriptコンパイルを避けられます。インストール済みパッケージが
TypeScriptソースentryしか宣言していない場合でも、対応するビルド済み`dist/*.js` peerが
存在すればそれを使い、その後でTypeScriptソースへフォールバックします。

すべてのentry pathはPluginパッケージディレクトリ内に留まる必要があります。ランタイムentryや
推定されたビルド済みJavaScript peerがあるからといって、パッケージ外へ逃げる`extensions`または
`setupEntry`ソースパスが有効になるわけではありません。

<Tip>
  **ウォークスルーを探していますか？** ステップごとのガイドは[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)
  または[Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)を参照してください。
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、ツールPlugin、フックPlugin、および
メッセージングチャネル**ではない**もの向けです。

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

| フィールド | 型 | 必須 | デフォルト |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | はい      | —                   |
| `name`         | `string`                                                         | はい      | —                   |
| `description`  | `string`                                                         | はい      | —                   |
| `kind`         | `string`                                                         | いいえ       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ       | 空オブジェクトschema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい      | —                   |

- `id`は`openclaw.plugin.json` manifestと一致している必要があります。
- `kind`は排他的スロット用です: `"memory"`または`"context-engine"`。
- `configSchema`には遅延評価のため関数を使えます。
- OpenClawはそのschemaを最初のアクセス時に解決してメモ化するため、高コストなschema
  builderは1回しか実行されません。

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

チャネル固有の配線を加えた`definePluginEntry`のラッパーです。
自動的に`api.registerChannel({ plugin })`を呼び出し、
任意のroot-help CLI metadata seamを公開し、`registerFull`を登録モードで制御します。

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

| フィールド | 型 | 必須 | デフォルト |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | はい      | —                   |
| `name`                | `string`                                                         | はい      | —                   |
| `description`         | `string`                                                         | はい      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | はい      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ       | 空オブジェクトschema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ       | —                   |

- `setRuntime`は登録時に呼び出されるため、ランタイム参照を保存できます
  （通常は`createPluginRuntimeStore`経由）。CLI metadata
  capture中はスキップされます。
- `registerCliMetadata`は`api.registrationMode === "cli-metadata"`と
  `api.registrationMode === "full"`の両方で実行されます。
  これを、チャネル所有のCLI descriptorの正規の置き場所として使ってください。これにより、root helpが
  非活性のまま保たれつつ、通常のCLIコマンド登録も完全なPlugin読み込みと互換になります。
- `registerFull`は`api.registrationMode === "full"`のときだけ実行されます。setup-only読み込み中はスキップされます。
- `definePluginEntry`と同様に、`configSchema`は遅延factoryにでき、OpenClawは
  解決済みschemaを最初のアクセス時にメモ化します。
- Plugin所有のroot CLIコマンドでは、コマンドを遅延読み込みのままにしつつ
  root CLI parse treeから消えないようにしたい場合、`api.registerCli(..., { descriptors: [...] })`
  を優先してください。チャネルPluginでは、それらのdescriptorは
  `registerCliMetadata(...)`から登録し、`registerFull(...)`はランタイム専用処理へ集中させてください。
- `registerFull(...)`がgateway RPCメソッドも登録する場合は、それらを
  Plugin固有のprefixに留めてください。予約済みcore admin namespace（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）は常に
  `operator.admin`へ強制されます。

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

軽量な`setup-entry.ts`ファイル向けです。戻り値は
ランタイムやCLI配線を持たない、単なる`{ plugin }`です。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClawは、チャネルが無効、未設定、またはdeferred loadingが有効な場合、
完全entryの代わりにこれを読み込みます。これが重要になる場面については
[Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

実際には、`defineSetupPluginEntry(...)`は狭いsetup helper
ファミリーと組み合わせて使ってください。

- `openclaw/plugin-sdk/setup-runtime` — import-safe setup patch adapter、lookup-note output、
  `promptResolvedAllowFrom`、`splitSetupEntries`、delegated setup proxyのような
  ランタイム安全なsetup helper向け
- `openclaw/plugin-sdk/channel-setup` — 任意インストールのsetupインターフェース向け
- `openclaw/plugin-sdk/setup-tools` — setup/install CLI/archive/docs helper向け

重いSDK、CLI登録、および長寿命ランタイムサービスは完全entryに置いてください。

setupとランタイムインターフェースを分離するバンドルworkspaceチャネルでは、
代わりに
`openclaw/plugin-sdk/channel-entry-contract`の
`defineBundledChannelSetupEntry(...)`を使えます。このコントラクトにより、
setup entryはsetup-safe plugin/secrets exportを維持しつつ、ランタイムsetterも公開できます。

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
});
```

このバンドルコントラクトは、完全なチャネルentryが読み込まれる前に、
setupフローで本当に軽量ランタイムsetterが必要な場合にのみ使用してください。

## 登録モード

`api.registrationMode`は、Pluginがどのように読み込まれたかを示します。

| モード | タイミング | 登録するもの |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | 通常のgateway起動 | すべて |
| `"setup-only"`    | 無効/未設定チャネル | チャネル登録のみ |
| `"setup-runtime"` | ランタイム利用可能なsetupフロー | チャネル登録 + 完全entry読み込み前に必要な軽量ランタイムのみ |
| `"cli-metadata"`  | root help / CLI metadata capture  | CLI descriptorのみ |

`defineChannelPluginEntry`はこの分岐を自動的に処理します。チャネルに対して
`definePluginEntry`を直接使う場合は、自分でモードを確認してください。

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 重いランタイム専用登録
  api.registerService(/* ... */);
}
```

`"setup-runtime"`は、完全なバンドルチャネルランタイムへ再突入せずに、
setup-onlyの起動インターフェースが存在しなければならない窓と考えてください。
適しているのは、チャネル登録、setup-safe HTTP route、setup-safe gateway method、
およびdelegated setup helperです。重いバックグラウンドサービス、CLI registrar、
およびprovider/client SDK bootstrapは引き続き`"full"`に属します。

特にCLI registrarについては:

- registrarが1つ以上のrootコマンドを所有していて、
  初回呼び出し時に実際のCLI moduleをOpenClawに遅延読み込みさせたい場合は`descriptors`を使う
- それらのdescriptorが、registrarによって公開されるすべてのトップレベルコマンドrootをカバーすることを確認する
- eager互換パスに限って`commands`単独を使う

## Plugin形状

OpenClawは、読み込まれたPluginをその登録動作で分類します。

| 形状 | 説明 |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1つの機能タイプ（例: provider-only） |
| **hybrid-capability** | 複数の機能タイプ（例: provider + speech） |
| **hook-only**         | フックのみで、機能なし |
| **non-capability**    | capabilityはないが、tools/commands/servicesはある |

Pluginの形状を見るには`openclaw plugins inspect <id>`を使ってください。

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview) — 登録APIとsubpathリファレンス
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — `api.runtime`と`createPluginRuntimeStore`
- [Setup and Config](/ja-JP/plugins/sdk-setup) — manifest、setup entry、deferred loading
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — `ChannelPlugin` objectの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider登録とフック
