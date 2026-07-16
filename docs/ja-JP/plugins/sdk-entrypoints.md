---
read_when:
    - defineToolPlugin、definePluginEntry、または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（フル、セットアップ、CLI メタデータ）の違いを理解したい場合
    - エントリーポイントのオプションを検索しています
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: Pluginのエントリポイント
x-i18n:
    generated_at: "2026-07-16T11:57:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべてのPluginは、デフォルトのエントリオブジェクトをエクスポートします。SDKは、
各エントリ形状に対応するヘルパーを提供します: `defineToolPlugin`、`definePluginEntry`、
`defineChannelPluginEntry`、`defineSetupPluginEntry`。

<Tip>
  **手順をお探しですか？** ステップごとのガイドについては、[ツールPlugin](/ja-JP/plugins/tool-plugins)、
  [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins)、または
  [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)を参照してください。
</Tip>

## パッケージエントリ

インストール済みPluginでは、`package.json`の`openclaw`フィールドが、ソースと
ビルド済みエントリの両方を指します。

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
- `runtimeExtensions`と`runtimeSetupEntry`は、インストール済み
  パッケージに推奨されます。これにより、npmパッケージは実行時のTypeScriptコンパイルを省略できます。
- `runtimeExtensions`が存在する場合、配列の長さが`extensions`と一致する必要があります
  （エントリは位置ごとに対応します）。`runtimeSetupEntry`には`setupEntry`が必要です。
- `runtimeExtensions`/`runtimeSetupEntry`アーティファクトが宣言されているものの
  存在しない場合、インストールまたは検出はパッケージングエラーで失敗します。OpenClawは
  暗黙的にソースへフォールバックしません。以下のソースフォールバックは、ランタイムエントリが
  まったく宣言されていない場合にのみ適用されます。
- インストール済みパッケージでTypeScriptソースエントリのみが宣言されている場合、OpenClawは
  対応するビルド済みの`dist/*.js`（または`.mjs`/`.cjs`）ピアを探して使用します。
  見つからない場合は、TypeScriptソースへフォールバックします。
- すべてのエントリパスは、Pluginパッケージディレクトリ内に収める必要があります。ランタイム
  エントリや推論されたビルド済みJSピアがあっても、パッケージ外を指す`extensions`または
  `setupEntry`ソースパスが有効になることはありません。

## `defineToolPlugin`

**インポート:** `openclaw/plugin-sdk/tool-plugin`

エージェントツールのみを追加するPlugin向けです。ソースを小さく保ち、TypeBoxスキーマから設定と
ツールパラメーターの型を推論し、通常の戻り値をOpenClawのツール結果形式でラップし、
`openclaw plugins build`がPluginマニフェスト（`contracts.tools`、
`configSchema`）へ書き込む静的メタデータを公開します。

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

- `configSchema`は省略可能です。省略すると厳密な空オブジェクトスキーマが使用されます
  （生成されるマニフェストには引き続き`configSchema`が含まれます）。
- `execute`は通常の文字列またはJSONシリアライズ可能な値を返します。ヘルパーは
  これをテキストのツール結果としてラップし、`details`には元の
  （文字列化されていない）戻り値を設定します。
- カスタムツール結果向けに、`openclaw/plugin-sdk/tool-results`は
  `textResult`と`jsonResult`をエクスポートします。
- ツール名は静的であるため、`openclaw plugins build`は
  手作業で名前を重複定義せずに、宣言されたツールから`contracts.tools`を導出します。
- ランタイム読み込みは引き続き厳格です。インストール済みPluginには
  `openclaw.plugin.json`と`package.json`の`openclaw.extensions`が必要です。OpenClawは、
  不足しているマニフェストデータを推論するためにPluginコードを実行することはありません。

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、高度なツールPlugin、フックPlugin、およびメッセージングチャンネルでは
**ない**ものすべてに使用します。

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

| フィールド                  | 型                                                               | 必須     | デフォルト          |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | はい     | -                   |
| `name`                    | `string`                                                         | はい     | -                   |
| `description`             | `string`                                                         | はい     | -                   |
| `kind`                    | `string`（非推奨、以下を参照）                                   | いいえ   | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ   | 空オブジェクトスキーマ |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | いいえ   | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | いいえ   | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | いいえ   | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | はい     | -                   |

- `id`は、`openclaw.plugin.json`マニフェストと一致する必要があります。
- 外部セッションカタログでは、
  `openclaw/plugin-sdk/session-catalog`と
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`を使用します。
  コアは`sessions.catalog.*` Gatewayメソッドを所有します。プロバイダーはRPCを登録せずに、
  ホスト、セッション、および正規化されたトランスクリプトのプロジェクションを返します。
- `kind`は非推奨です。代わりに、`openclaw.plugin.json`マニフェストの
  `kind`フィールドで排他的スロット（`"memory"`または
  `"context-engine"`）を宣言してください。ランタイムエントリの`kind`は、
  古いPlugin向けの互換性フォールバックとしてのみ残されています。
- `configSchema`は、遅延評価用の関数にできます。OpenClawは初回アクセス時に
  スキーマを解決してメモ化するため、コストの高いスキーマビルダーは一度だけ実行されます。
- `nodeHostCommands`記述子では、`isAvailable({ config, env })`を定義できます。
  `false`を返すと、そのコマンドと機能はヘッドレスNodeのGateway宣言から除外されます。
  OpenClawはNodeローカルの起動設定に対してこれを評価しますが、コマンドハンドラーも
  呼び出し時に利用可能性を検証する必要があります。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry`をチャンネル固有の配線でラップします。`api.registerChannel({ plugin })`を自動的に
呼び出し、任意のルートヘルプCLIメタデータシームを公開し、登録モードに応じて
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

| フィールド              | 型                                                               | 必須     | デフォルト          |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | はい     | -                   |
| `name`                | `string`                                                         | はい     | -                   |
| `description`         | `string`                                                         | はい     | -                   |
| `plugin`              | `ChannelPlugin`                                                  | はい     | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ   | 空オブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ   | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ   | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ   | -                   |

コールバックは登録モードごとに実行されます（完全な表は
[登録モード](#registration-mode)を参照）。

- `setRuntime`は、`"cli-metadata"`と
  `"tool-discovery"`を除くすべてのモードで実行されます。通常は
  `createPluginRuntimeStore`を介して、ここにランタイム参照を保存します。
- `registerCliMetadata`は、`"cli-metadata"`、`"discovery"`、および
  `"full"`で実行されます。チャンネル所有のCLI記述子の正規の配置場所として使用することで、
  ルートヘルプを非アクティブ化のまま保ち、検出スナップショットに静的コマンドメタデータを含め、
  通常のCLI登録と完全なPlugin読み込みとの互換性を維持できます。
- `registerFull`は、`"full"`と`"tool-discovery"`でのみ実行されます。
  `"tool-discovery"`では、チャンネル登録の_代わりに_実行されます。OpenClawは
  `registerChannel`/`setRuntime`を完全にスキップし、`registerFull`のみを
  呼び出します。そのため、スタンドアロンのツール検出または実行にチャンネルが必要とする
  プロバイダーやツールの登録は、通常のチャンネルセットアップの背後ではなく、ここに配置する必要があります。
- 検出登録は非アクティブですが、インポート不要という意味ではありません。OpenClawは
  スナップショットを構築するために、信頼されたPluginエントリとチャンネルPluginモジュールを
  評価する場合があります。トップレベルのインポートには副作用を持たせず、ソケット、
  クライアント、ワーカー、サービスは`"full"`専用のパスの背後に配置してください。
- `definePluginEntry`と同様に、`configSchema`は遅延ファクトリにできます。OpenClawは
  初回アクセス時に解決されたスキーマをメモ化します。

CLI登録:

- ルートCLIの解析ツリーから消さずに遅延読み込みしたい、Plugin所有のルート
  CLIコマンドには`api.registerCli(..., { descriptors: [...] })`を使用します。記述子名には英字、数字、ハイフン、
  アンダースコアのみを使用でき、英字または数字で始める必要があります。OpenClawはそれ以外の
  形式を拒否し、ヘルプを表示する前に説明から端末制御シーケンスを除去します。レジストラーが
  公開するすべてのトップレベルコマンドルートを網羅してください。
  `commands`のみの場合は、引き続き先行読み込みの互換性パスが使用されます。
- ペアリングされたNodeの機能コマンドには`api.registerNodeCliFeature(...)`を使用し、
  `openclaw nodes`（`registerCli(registrar, { parentPath: ["nodes"], ... })`と同等）の配下に配置します。
- その他のネストされたPluginコマンドでは、`parentPath`を追加し、
  レジストラーへ渡される`program`オブジェクトにコマンドを登録します。OpenClawは
  Pluginを呼び出す前に、それを親コマンドへ解決します。
- チャンネルPluginでは、`registerCliMetadata`からCLI記述子を登録し、
  `registerFull`はランタイム専用の処理に集中させます。
- `registerFull`でGateway RPCメソッドも登録する場合は、Plugin固有の
  プレフィックスを使用してください。予約済みのコア管理名前空間（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）は常に
  `operator.admin`へ強制変換されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な`setup-entry.ts`ファイル向けです。ランタイムやCLIの配線を行わず、
`{ plugin }`のみを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw は、チャンネルが無効、未設定、または遅延読み込みが有効な場合に、
完全なエントリの代わりにこれを読み込みます。これが重要になる状況については、
[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

`defineSetupPluginEntry(...)` は、対象範囲の狭いセットアップヘルパーファミリーと組み合わせてください。

| インポート                              | 用途                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | ランタイムセーフなセットアップヘルパー：`createSetupTranslator`、インポートセーフなセットアップパッチアダプター、ルックアップ注記の出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシ |
| `openclaw/plugin-sdk/channel-setup` | オプションインストール用セットアップサーフェス                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | セットアップ／インストール用 CLI、アーカイブ、ドキュメントのヘルパー                                                                                                                                       |

負荷の高い SDK、CLI 登録、長期間稼働するランタイムサービスは、
完全なエントリに配置してください。

セットアップとランタイムのサーフェスを分割するバンドル済みワークスペースチャンネルでは、
代わりに `openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を使用できます。これにより、セットアップエントリで
セットアップセーフな Plugin／シークレットのエクスポートを維持しながら、
ランタイムセッターも公開できます。

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

これは、完全なチャンネルエントリが読み込まれる前に、セットアップフローで
軽量なランタイムセッターまたはセットアップセーフな Gateway サーフェスが本当に必要な場合にのみ使用してください。
`registerSetupRuntime` は `"setup-runtime"` の読み込み時にのみ実行されます。
遅延された完全なアクティベーションより前に存在する必要がある、設定専用のルートまたはメソッドに
限定してください。

## 登録モード

`api.registrationMode` は、Plugin がどのように読み込まれたかを示します。

| モード               | タイミング                                               | 登録するもの                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 通常の Gateway 起動                             | すべて                                                                                                              |
| `"discovery"`      | 読み取り専用のケイパビリティ検出                     | チャンネル登録と静的 CLI 記述子。エントリコードは読み込まれる場合がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"tool-discovery"` | 特定の Plugin のツールを一覧表示または実行するための限定的な読み込み | ケイパビリティ／ツールの登録のみ。チャンネルのアクティベーションは行いません                                                                |
| `"setup-only"`     | 無効または未設定のチャンネル                      | チャンネル登録のみ                                                                                               |
| `"setup-runtime"`  | ランタイムが利用可能なセットアップフロー                  | チャンネル登録に加え、完全なエントリが読み込まれる前に必要な軽量ランタイムのみ                               |
| `"cli-metadata"`   | ルートヘルプ／CLI メタデータの取得                   | CLI 記述子のみ                                                                                                    |

`defineChannelPluginEntry` は、この分割を自動的に処理します。チャンネルに
`definePluginEntry` を直接使用する場合は、自分でモードを確認し、
`"tool-discovery"` ではチャンネル登録がスキップされることに注意してください。

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
    // ケイパビリティ専用のサーフェス（プロバイダー／ツール）を登録し、チャンネルは登録しません。
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 負荷の高いランタイム専用の登録
  api.registerService(/* ... */);
}
```

長期間稼働するサービスは、そのサービスコンテキストを通じて、
小さな無効化イベントまたはライフサイクルイベントを発行できます。

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw は、これに `plugin.<plugin-id>.changed` という名前空間を設定します。イベント名は
小文字の単一セグメントで、ペイロードはサイズが制限された JSON でなければならず、スコープは
`operator.read`、`operator.write`、または `operator.admin` でなければなりません。エミッターは
サービスの存続期間中にのみ存在し、停止後または起動失敗後に無効化されます。認可されたクライアントが
Plugin のスコープ付き Gateway メソッドを通じて正規状態を再読み込みできるように、
完全なレコードよりもバージョンまたは無効化ペイロードを優先してください。

検出モードでは、アクティベーションを伴わないレジストリスナップショットを構築します。OpenClaw が
チャンネルのケイパビリティと静的 CLI 記述子を登録できるように、Plugin エントリと
チャンネル Plugin オブジェクトが評価される場合があります。検出時のモジュール評価は、
信頼できるものの軽量であるものとして扱ってください。トップレベルでは、ネットワーククライアント、
サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、
認証情報の読み取り、その他のライブランタイム副作用を発生させないでください。

`"setup-runtime"` は、バンドル済みチャンネルの完全なランタイムに再度入ることなく、
セットアップ専用の起動サーフェスが存在しなければならない期間として扱ってください。適しているのは、
チャンネル登録、セットアップセーフな HTTP ルート、セットアップセーフな Gateway メソッド、
委譲セットアップヘルパーです。負荷の高いバックグラウンドサービス、CLI レジストラー、
プロバイダー／クライアント SDK のブートストラップは、引き続き `"full"` に配置してください。

## Plugin の形態

OpenClaw は、読み込まれた Plugin をその登録動作に基づいて分類します。

| 形態                 | 説明                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1 種類のケイパビリティ（例：プロバイダーのみ）           |
| **hybrid-capability** | 複数種類のケイパビリティ（例：プロバイダー＋音声） |
| **hook-only**         | フックのみで、ケイパビリティなし                        |
| **non-capability**    | ツール／コマンド／サービスはあるが、ケイパビリティなし        |

Plugin の形態を確認するには、`openclaw plugins inspect <id>` を使用してください。

## 関連項目

- [SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API とサブパスのリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) - マニフェスト、セットアップエントリ、遅延読み込み
- [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダーの登録とフック
