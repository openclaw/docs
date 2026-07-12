---
read_when:
    - defineToolPlugin、definePluginEntry、または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（full、setup、CLI メタデータ）の違いを理解したい場合
    - エントリーポイントのオプションを確認しています
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: Plugin エントリーポイント
x-i18n:
    generated_at: "2026-07-12T14:42:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fba10e51604d6b83b5da265530565fddf3129c5a6e69c4f1a65d5455fe99ad83
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべてのPluginは、デフォルトのエントリオブジェクトをエクスポートします。SDKは、
各エントリ形式に対応するヘルパーとして、`defineToolPlugin`、`definePluginEntry`、
`defineChannelPluginEntry`、`defineSetupPluginEntry`を提供します。

<Tip>
  **手順ガイドをお探しですか？** ステップごとのガイドについては、[ツールPlugin](/ja-JP/plugins/tool-plugins)、
  [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins)、または
  [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)を参照してください。
</Tip>

## パッケージエントリ

インストール済みPluginでは、`package.json`の`openclaw`フィールドでソースと
ビルド済みの両方のエントリを指定します。

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

- `extensions`と`setupEntry`はソースエントリで、ワークスペースおよびgit
  チェックアウトでの開発に使用されます。
- インストール済みパッケージでは、`runtimeExtensions`と`runtimeSetupEntry`が優先されます。
  これにより、npmパッケージは実行時のTypeScriptコンパイルを省略できます。
- `runtimeExtensions`が存在する場合、配列の長さが`extensions`と一致している
  必要があります（エントリは位置によって対応付けられます）。`runtimeSetupEntry`には`setupEntry`が必要です。
- `runtimeExtensions`/`runtimeSetupEntry`のアーティファクトが宣言されているにもかかわらず
  存在しない場合、インストールまたは検出はパッケージングエラーで失敗します。OpenClawは
  暗黙的にソースへフォールバックしません。後述のソースへのフォールバックは、
  ランタイムエントリがまったく宣言されていない場合にのみ適用されます。
- インストール済みパッケージがTypeScriptソースエントリのみを宣言している場合、OpenClawは
  対応するビルド済みの`dist/*.js`（または`.mjs`/`.cjs`）ピアを検索して使用します。
  見つからない場合はTypeScriptソースへフォールバックします。
- すべてのエントリパスは、Pluginパッケージディレクトリ内に収まる必要があります。ランタイム
  エントリや推論されたビルド済みJSピアが存在しても、パッケージ外を指す`extensions`または
  `setupEntry`のソースパスが有効になることはありません。

## `defineToolPlugin`

**インポート:** `openclaw/plugin-sdk/tool-plugin`

エージェントツールのみを追加するPlugin向けです。ソースを小さく保ち、TypeBoxスキーマから
設定とツールパラメーターの型を推論し、プレーンな戻り値をOpenClawのツール結果形式で
ラップします。また、`openclaw plugins build`がPluginマニフェスト
（`contracts.tools`、`configSchema`）へ書き込む静的メタデータを公開します。

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

- `configSchema`は任意です。省略した場合は厳密な空オブジェクトスキーマが使用されます
  （生成されるマニフェストには引き続き`configSchema`が含まれます）。
- `execute`はプレーンな文字列またはJSONシリアライズ可能な値を返します。ヘルパーは
  それをテキストツール結果としてラップし、`details`には元の
  （文字列化されていない）戻り値を設定します。
- カスタムツール結果向けに、`openclaw/plugin-sdk/tool-results`は
  `textResult`と`jsonResult`をエクスポートします。
- ツール名は静的であるため、`openclaw plugins build`は名前を手作業で重複定義せずに、
  宣言されたツールから`contracts.tools`を導出します。
- ランタイムの読み込みは引き続き厳格です。インストール済みPluginには
  `openclaw.plugin.json`と`package.json`の`openclaw.extensions`が必要です。OpenClawは、
  欠落したマニフェストデータを推論するためにPluginコードを実行することはありません。

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、高度なツールPlugin、フックPlugin、および
メッセージングチャンネルでは**ない**ものに使用します。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| フィールド                | 型                                                               | 必須 | デフォルト             |
| ------------------------- | ---------------------------------------------------------------- | ---- | ---------------------- |
| `id`                      | `string`                                                         | はい | -                      |
| `name`                    | `string`                                                         | はい | -                      |
| `description`             | `string`                                                         | はい | -                      |
| `kind`                    | `string`（非推奨、下記参照）                                    | いいえ | -                    |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空オブジェクトスキーマ |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | いいえ | -                    |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | いいえ | -                    |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | いいえ | -                    |
| `register`                | `(api: OpenClawPluginApi) => void`                               | はい | -                      |

- `id`は`openclaw.plugin.json`マニフェストと一致する必要があります。
- 外部セッションカタログでは、
  `openclaw/plugin-sdk/session-catalog`および
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`を使用します。
  コアは`sessions.catalog.*` Gatewayメソッドを所有します。プロバイダーはRPCを登録せずに、
  ホスト、セッション、および正規化されたトランスクリプトのプロジェクションを返します。
- `kind`は非推奨です。代わりに、`openclaw.plugin.json`マニフェストの`kind`フィールドで
  排他的スロット（`"memory"`または`"context-engine"`）を宣言してください。
  ランタイムエントリの`kind`は、古いPlugin向けの互換性フォールバックとしてのみ残されています。
- `configSchema`には遅延評価用の関数を指定できます。OpenClawは初回アクセス時にスキーマを解決して
  メモ化するため、負荷の高いスキーマビルダーは一度だけ実行されます。
- `nodeHostCommands`記述子では`isAvailable({ config, env })`を定義できます。
  `false`を返すと、そのコマンドとケイパビリティはヘッドレスNodeのGateway宣言から除外されます。
  OpenClawはNodeローカルの起動設定に対してこれを評価しますが、コマンドハンドラーも
  呼び出し時に可用性を検証する必要があります。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry`をチャンネル固有の配線でラップします。`api.registerChannel({ plugin })`を
自動的に呼び出し、任意のルートヘルプCLIメタデータ用シームを公開し、登録モードに基づいて
`registerFull`を制御します。

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

| フィールド            | 型                                                               | 必須 | デフォルト             |
| --------------------- | ---------------------------------------------------------------- | ---- | ---------------------- |
| `id`                  | `string`                                                         | はい | -                      |
| `name`                | `string`                                                         | はい | -                      |
| `description`         | `string`                                                         | はい | -                      |
| `plugin`              | `ChannelPlugin`                                                  | はい | -                      |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空オブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ | -                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ | -                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ | -                    |

コールバックは登録モードごとに実行されます（完全な表は
[登録モード](#registration-mode)を参照）。

- `setRuntime`は`"cli-metadata"`と`"tool-discovery"`を除くすべてのモードで
  実行されます。通常は`createPluginRuntimeStore`を使用して、ここにランタイム参照を保存します。
- `registerCliMetadata`は`"cli-metadata"`、`"discovery"`、`"full"`で
  実行されます。チャンネル所有のCLI記述子を定義する標準の場所として使用してください。
  これにより、ルートヘルプはPluginをアクティブ化せず、検出スナップショットには静的な
  コマンドメタデータが含まれ、通常のCLI登録は完全なPlugin読み込みとの互換性を維持します。
- `registerFull`は`"full"`と`"tool-discovery"`でのみ実行されます。
  `"tool-discovery"`では、チャンネル登録の_代わりに_実行されます。OpenClawは
  `registerChannel`/`setRuntime`を完全にスキップして`registerFull`のみを呼び出します。
  そのため、スタンドアロンのツール検出または実行にチャンネルが必要とするプロバイダー/ツール登録は、
  通常のチャンネル設定の背後ではなく、ここに配置する必要があります。
- 検出登録は非アクティブ化ですが、インポートを行わないわけではありません。OpenClawは
  スナップショットを構築するために、信頼済みPluginのエントリとチャンネルPluginモジュールを
  評価する場合があります。トップレベルのインポートに副作用を持たせず、ソケット、
  クライアント、ワーカー、サービスは`"full"`専用パスの背後に配置してください。
- `definePluginEntry`と同様に、`configSchema`には遅延ファクトリを指定できます。OpenClawは
  初回アクセス時に解決済みスキーマをメモ化します。

CLI登録:

- ルートCLIの解析ツリーから消えることなく遅延読み込みしたいPlugin所有のルートCLIコマンドには、
  `api.registerCli(..., { descriptors: [...] })`を使用します。記述子名は英字、数字、ハイフン、
  アンダースコアに一致し、英字または数字で始まる必要があります。OpenClawはその他の形式を拒否し、
  ヘルプを表示する前に説明から端末制御シーケンスを除去します。レジストラーが公開する
  すべてのトップレベルコマンドルートを網羅してください。
  `commands`のみの場合は、引き続き即時読み込みの互換パスが使用されます。
- ペアリング済みNodeの機能コマンドには`api.registerNodeCliFeature(...)`を使用します。
  これによりコマンドは`openclaw nodes`配下に配置されます
  （`registerCli(registrar, { parentPath: ["nodes"], ... })`と同等です）。
- その他のネストされたPluginコマンドでは、`parentPath`を追加し、レジストラーに渡される
  `program`オブジェクトへコマンドを登録します。OpenClawはPluginを呼び出す前に、
  そのオブジェクトを親コマンドへ解決します。
- チャンネルPluginでは、`registerCliMetadata`からCLI記述子を登録し、
  `registerFull`はランタイム専用の処理に集中させてください。
- `registerFull`でGateway RPCメソッドも登録する場合は、Plugin固有のプレフィックスを使用してください。
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は、
  常に`operator.admin`へ強制変換されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な`setup-entry.ts`ファイル向けです。ランタイムやCLIの配線を含まず、
`{ plugin }`のみを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

チャンネルが無効、未設定、または遅延読み込みが有効な場合、OpenClawは完全なエントリの代わりに
これを読み込みます。これが重要になる状況については、
[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

`defineSetupPluginEntry(...)`は、範囲を限定したセットアップヘルパーファミリーと組み合わせて使用します。

| インポート                            | 用途                                                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw/plugin-sdk/setup-runtime` | ランタイムセーフなセットアップヘルパー: `createSetupTranslator`、インポートセーフなセットアップパッチアダプター、ルックアップ注記の出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
| `openclaw/plugin-sdk/channel-setup` | オプションインストール用のセットアップサーフェス                                                                                                                                                       |
| `openclaw/plugin-sdk/setup-tools`   | セットアップ/インストール CLI、アーカイブ、ドキュメントのヘルパー                                                                                                                                      |

重量のある SDK、CLI 登録、長時間稼働するランタイムサービスは、
フルエントリに保持してください。

セットアップとランタイムのサーフェスを分割するバンドル済みワークスペースチャネルでは、代わりに
`openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を使用できます。これにより、セットアップ
エントリでセットアップセーフな Plugin/シークレットのエクスポートを維持しながら、ランタイム
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
        /* セットアップセーフなルート */
      },
    });
  },
});
```

これは、フルチャネルエントリが読み込まれる前に、セットアップフローで軽量なランタイムセッターまたは
セットアップセーフな Gateway サーフェスが本当に必要な場合にのみ使用してください。
`registerSetupRuntime` は `"setup-runtime"` の読み込み時にのみ実行されます。遅延された
フルアクティベーションの前に存在する必要がある、設定専用のルートまたはメソッドに
限定してください。

## 登録モード

`api.registrationMode` は、Plugin がどのように読み込まれたかを示します。

| モード             | タイミング                                         | 登録するもの                                                                                                                              |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 通常の Gateway 起動                                | すべて                                                                                                                                    |
| `"discovery"`      | 読み取り専用のケイパビリティ検出                   | チャネル登録と静的 CLI ディスクリプター。エントリコードは読み込まれる場合がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"tool-discovery"` | 特定の Plugin のツールを一覧表示または実行するための限定的な読み込み | ケイパビリティ/ツール登録のみ。チャネルのアクティベーションは行いません                                                                    |
| `"setup-only"`     | 無効または未設定のチャネル                         | チャネル登録のみ                                                                                                                          |
| `"setup-runtime"`  | ランタイムを利用できるセットアップフロー           | チャネル登録に加え、フルエントリの読み込み前に必要な軽量ランタイムのみ                                                                    |
| `"cli-metadata"`   | ルートヘルプ / CLI メタデータの取得                | CLI ディスクリプターのみ                                                                                                                  |

`defineChannelPluginEntry` はこの分割を自動的に処理します。チャネルに
`definePluginEntry` を直接使用する場合は、自分でモードを確認し、
`"tool-discovery"` ではチャネル登録がスキップされることに注意してください。

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
    // ケイパビリティ専用サーフェス（プロバイダー/ツール）のみを登録し、チャネルは登録しません。
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 重量のあるランタイム専用登録
  api.registerService(/* ... */);
}
```

検出モードでは、アクティベーションを伴わないレジストリスナップショットを構築します。OpenClaw が
チャネルケイパビリティと静的 CLI ディスクリプターを登録できるように、Plugin エントリと
チャネル Plugin オブジェクトが評価される場合があります。検出時のモジュール評価は、
信頼できるものの軽量であるべきです。トップレベルでは、ネットワーククライアント、
サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、
認証情報の読み取り、その他の稼働中ランタイムの副作用を発生させないでください。

`"setup-runtime"` は、フルのバンドル済みチャネルランタイムに再度入ることなく、
セットアップ専用の起動サーフェスが存在する必要がある期間として扱ってください。
適切な用途には、チャネル登録、セットアップセーフな HTTP ルート、
セットアップセーフな Gateway メソッド、委譲セットアップヘルパーがあります。
重量のあるバックグラウンドサービス、CLI レジストラー、
プロバイダー/クライアント SDK のブートストラップは、引き続き `"full"` に配置します。

## Plugin の形態

OpenClaw は、読み込まれた Plugin を登録動作に基づいて分類します。

| 形態                  | 説明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1 種類のケイパビリティ（例: プロバイダーのみ）    |
| **hybrid-capability** | 複数種類のケイパビリティ（例: プロバイダー + 音声） |
| **hook-only**         | フックのみで、ケイパビリティなし                   |
| **non-capability**    | ツール/コマンド/サービスがあるが、ケイパビリティなし |

Plugin の形態を確認するには、`openclaw plugins inspect <id>` を使用してください。

## 関連項目

- [SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API とサブパスのリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) - マニフェスト、セットアップエントリ、遅延読み込み
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダーの登録とフック
