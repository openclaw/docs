---
read_when:
    - definePluginEntry または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（完全登録、セットアップ、CLI メタデータ）を理解したい
    - エントリーポイントのオプションを調べています
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntryのリファレンス
title: Plugin のエントリポイント
x-i18n:
    generated_at: "2026-05-02T05:02:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべてのPluginはデフォルトのエントリオブジェクトをエクスポートします。SDKはそれらを作成するための3つのヘルパーを提供します。

インストール済みPluginでは、利用可能な場合、`package.json` はランタイム読み込みがビルド済みJavaScriptを指すようにする必要があります:

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

`extensions` と `setupEntry` は、ワークスペースおよびgit checkout開発用のソースエントリとして引き続き有効です。OpenClawがインストール済みパッケージを読み込むときは、`runtimeExtensions` と `runtimeSetupEntry` が優先され、npmパッケージがランタイムTypeScriptコンパイルを回避できるようになります。明示的なランタイムエントリは必須です: `runtimeSetupEntry` には `setupEntry` が必要であり、`runtimeExtensions` または `runtimeSetupEntry` の成果物がない場合は、ソースへ暗黙的にフォールバックするのではなく、インストール/検出に失敗します。インストール済みパッケージがTypeScriptソースエントリのみを宣言している場合、OpenClawは一致するビルド済み `dist/*.js` ピアが存在すればそれを使用し、その後TypeScriptソースへフォールバックします。

すべてのエントリパスはPluginパッケージディレクトリ内に留まる必要があります。ランタイムエントリと推論されたビルド済みJavaScriptピアがあっても、外へ抜ける `extensions` または `setupEntry` ソースパスが有効になることはありません。

<Tip>
  **ウォークスルーを探していますか?** ステップバイステップのガイドについては、[チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins)
  または[プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)を参照してください。
</Tip>

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、ツールPlugin、フックPlugin、およびメッセージングチャネル**ではない**
ものすべてに使用します。

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
| `id`           | `string`                                                         | はい | —                   |
| `name`         | `string`                                                         | はい | —                   |
| `description`  | `string`                                                         | はい | —                   |
| `kind`         | `string`                                                         | いいえ | —                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空のオブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい | —                   |

- `id` は `openclaw.plugin.json` マニフェストと一致する必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価用の関数にできます。
- OpenClawは初回アクセス時にそのスキーマを解決してメモ化するため、高コストなスキーマビルダーは一度だけ実行されます。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` をチャネル固有の配線でラップします。`api.registerChannel({ plugin })` を自動的に呼び出し、任意のルートヘルプCLIメタデータの継ぎ目を公開し、登録モードに応じて `registerFull` をゲートします。

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
| `id`                | `string`                                                         | はい | —                   |
| `name`              | `string`                                                         | はい | —                   |
| `description`       | `string`                                                         | はい | —                   |
| `plugin`            | `ChannelPlugin`                                                  | はい | —                   |
| `configSchema`      | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空のオブジェクトスキーマ |
| `setRuntime`        | `(runtime: PluginRuntime) => void`                               | いいえ | —                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                             | いいえ | —                 |
| `registerFull`      | `(api: OpenClawPluginApi) => void`                               | いいえ | —                 |

- `setRuntime` は登録中に呼び出されるため、ランタイム参照を保存できます
  (通常は `createPluginRuntimeStore` 経由)。CLIメタデータの取得中はスキップされます。
- `registerCliMetadata` は `api.registrationMode === "cli-metadata"`、
  `api.registrationMode === "discovery"`、および
  `api.registrationMode === "full"` の間に実行されます。
  チャネル所有のCLI記述子の標準的な場所として使用してください。これにより、ルートヘルプは非アクティブ化のまま保たれ、検出スナップショットには静的コマンドメタデータが含まれ、通常のCLIコマンド登録は完全なPlugin読み込みとの互換性を維持します。
- 検出登録は非アクティブ化ですが、インポート不要ではありません。OpenClawはスナップショットを構築するために、信頼済みPluginエントリとチャネルPluginモジュールを評価する場合があります。そのため、トップレベルのインポートは副作用なしに保ち、ソケット、クライアント、ワーカー、サービスは `"full"` 専用パスの背後に置いてください。
- `registerFull` は `api.registrationMode === "full"` の場合にのみ実行されます。setup専用読み込み中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリにでき、OpenClawは初回アクセス時に解決済みスキーマをメモ化します。
- Plugin所有のルートCLIコマンドについては、コマンドをルートCLI解析ツリーから消さずに遅延読み込みのままにしたい場合、`api.registerCli(..., { descriptors: [...] })` を優先してください。チャネルPluginでは、それらの記述子を `registerCliMetadata(...)` から登録し、`registerFull(...)` はランタイム専用の作業に集中させてください。
- `registerFull(...)` がGateway RPCメソッドも登録する場合は、それらをPlugin固有のプレフィックス上に保ってください。予約済みコア管理名前空間 (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) は常に
  `operator.admin` に強制されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル用です。ランタイムやCLI配線なしで、`{ plugin }` のみを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClawは、チャネルが無効、未設定、または遅延読み込みが有効な場合に、完全なエントリの代わりにこれを読み込みます。これが重要になる場面については、[Setupと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

実際には、`defineSetupPluginEntry(...)` を狭いsetupヘルパーファミリーと組み合わせます:

- インポート安全なsetupパッチアダプター、lookup-note出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、委譲setupプロキシなど、ランタイム安全なsetupヘルパーには `openclaw/plugin-sdk/setup-runtime`
- optional-install setupサーフェスには `openclaw/plugin-sdk/channel-setup`
- setup/install CLI/archive/docsヘルパーには `openclaw/plugin-sdk/setup-tools`

重いSDK、CLI登録、長寿命のランタイムサービスは完全なエントリ内に保ってください。

setupサーフェスとランタイムサーフェスを分割する同梱ワークスペースチャネルでは、代わりに
`openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を使用できます。このコントラクトにより、setupエントリはsetup安全なPlugin/secretsエクスポートを保ちながら、ランタイムsetterも公開できます:

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

完全なチャネルエントリが読み込まれる前に、setupフローが本当に軽量なランタイムsetterを必要とする場合にのみ、その同梱コントラクトを使用してください。

## 登録モード

`api.registrationMode` はPluginがどのように読み込まれたかを示します:

| モード            | タイミング                         | 登録するもの                                                                                                            |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 通常のGateway起動                  | すべて                                                                                                                  |
| `"discovery"`     | 読み取り専用のケイパビリティ検出   | チャネル登録と静的CLI記述子。エントリコードは読み込まれる場合がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"setup-only"`    | 無効/未設定のチャネル              | チャネル登録のみ                                                                                                        |
| `"setup-runtime"` | ランタイム利用可能なsetupフロー    | チャネル登録に加えて、完全なエントリが読み込まれる前に必要な軽量ランタイムのみ                                         |
| `"cli-metadata"`  | ルートヘルプ / CLIメタデータ取得   | CLI記述子のみ                                                                                                           |

`defineChannelPluginEntry` はこの分割を自動的に処理します。チャネルに対して `definePluginEntry` を直接使用する場合は、自分でモードを確認してください:

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

検出モードは非アクティブ化のレジストリスナップショットを構築します。OpenClawがチャネルケイパビリティと静的CLI記述子を登録できるようにするため、PluginエントリとチャネルPluginオブジェクトは評価される場合があります。検出時のモジュール評価は、信頼済みだが軽量なものとして扱ってください。トップレベルでは、ネットワーククライアント、サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、認証情報の読み取り、その他のライブランタイム副作用を避けてください。

`"setup-runtime"` は、完全な同梱チャネルランタイムへ再突入せずに、setup専用の起動サーフェスが存在する必要がある期間として扱ってください。適しているのは、チャネル登録、setup安全なHTTPルート、setup安全なGatewayメソッド、委譲setupヘルパーです。重いバックグラウンドサービス、CLIレジストラ、プロバイダー/クライアントSDKのブートストラップは、引き続き `"full"` に属します。

CLIレジストラについては特に:

- レジストラが1つ以上のルートコマンドを所有し、OpenClawに初回呼び出し時に実際のCLIモジュールを遅延読み込みさせたい場合は `descriptors` を使用します
- それらの記述子が、レジストラによって公開されるすべてのトップレベルコマンドルートを網羅していることを確認します
- 記述子のコマンド名は、文字、数字、ハイフン、アンダースコアに限定し、文字または数字で始めてください。OpenClawはその形式から外れる記述子名を拒否し、ヘルプをレンダリングする前に説明から端末制御シーケンスを取り除きます
- eagerな互換性パスにのみ `commands` 単独を使用します

## Plugin形状

OpenClaw は、読み込まれたPluginを登録時の動作によって分類します。

| 形状                  | 説明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1つのケイパビリティ種別（例: provider-only）       |
| **hybrid-capability** | 複数のケイパビリティ種別（例: provider + speech） |
| **hook-only**         | フックのみ、ケイパビリティなし                    |
| **non-capability**    | ツール/コマンド/サービスはあるがケイパビリティなし |

`openclaw plugins inspect <id>` を使用して、Plugin の形状を確認します。

## 関連

- [SDK の概要](/ja-JP/plugins/sdk-overview) — 登録 API とサブパスのリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) — `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) — マニフェスト、セットアップエントリ、遅延読み込み
- [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins) — `ChannelPlugin` オブジェクトの構築
- [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins) — プロバイダー登録とフック
