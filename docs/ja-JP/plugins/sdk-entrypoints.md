---
read_when:
    - definePluginEntry または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（full と setup と CLI メタデータの違い）を理解したい
    - エントリーポイントのオプションを調べています
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: Plugin のエントリーポイント
x-i18n:
    generated_at: "2026-05-07T13:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべてのPluginはデフォルトのエントリオブジェクトをエクスポートします。SDKはそれらを作成するための3つのヘルパーを提供します。

インストール済みPluginでは、利用可能な場合、`package.json` はランタイム読み込み先としてビルド済みJavaScriptを指す必要があります。

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

`extensions` と `setupEntry` は、ワークスペースおよびgitチェックアウト開発用のソースエントリとして引き続き有効です。`runtimeExtensions` と `runtimeSetupEntry` は、OpenClawがインストール済みパッケージを読み込む場合に推奨され、npmパッケージがランタイムのTypeScriptコンパイルを避けられるようにします。明示的なランタイムエントリは必須です。`runtimeSetupEntry` には `setupEntry` が必要で、`runtimeExtensions` または `runtimeSetupEntry` のアーティファクトがない場合は、暗黙にソースへフォールバックするのではなく、インストール/検出に失敗します。インストール済みパッケージがTypeScriptソースエントリのみを宣言している場合、OpenClawは一致するビルド済み `dist/*.js` ピアが存在すればそれを使用し、その後TypeScriptソースへフォールバックします。

すべてのエントリパスはPluginパッケージディレクトリ内に収まっている必要があります。ランタイムエントリおよび推定されたビルド済みJavaScriptピアによって、外へ抜ける `extensions` または `setupEntry` のソースパスが有効になることはありません。

<Tip>
  **ウォークスルーを探していますか？** 手順付きのガイドについては、[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) または [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、ツールPlugin、フックPlugin、およびメッセージングチャネルでは**ない**もの向けです。

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

| フィールド     | 型                                                               | 必須 | デフォルト              |
| -------------- | ---------------------------------------------------------------- | ---- | ----------------------- |
| `id`           | `string`                                                         | はい | -                       |
| `name`         | `string`                                                         | はい | -                       |
| `description`  | `string`                                                         | はい | -                       |
| `kind`         | `string`                                                         | いいえ | -                     |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空のオブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい | -                       |

- `id` は `openclaw.plugin.json` マニフェストと一致する必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価用の関数にできます。
- OpenClawは初回アクセス時にそのスキーマを解決してメモ化するため、コストの高いスキーマビルダーは一度だけ実行されます。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

チャネル固有の配線で `definePluginEntry` をラップします。`api.registerChannel({ plugin })` を自動的に呼び出し、任意のルートヘルプCLIメタデータの境界面を公開し、登録モードに基づいて `registerFull` を制御します。

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

| フィールド            | 型                                                               | 必須 | デフォルト              |
| --------------------- | ---------------------------------------------------------------- | ---- | ----------------------- |
| `id`                  | `string`                                                         | はい | -                       |
| `name`                | `string`                                                         | はい | -                       |
| `description`         | `string`                                                         | はい | -                       |
| `plugin`              | `ChannelPlugin`                                                  | はい | -                       |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ | 空のオブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ | -                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ | -                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ | -                     |

- `setRuntime` は登録中に呼び出されるため、ランタイム参照を保存できます（通常は `createPluginRuntimeStore` 経由）。CLIメタデータのキャプチャ中はスキップされます。
- `registerCliMetadata` は `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"`、および `api.registrationMode === "full"` の間に実行されます。
  チャネル所有のCLIディスクリプターの標準的な場所として使用してください。これにより、ルートヘルプは非アクティブ化のままになり、検出スナップショットには静的コマンドメタデータが含まれ、通常のCLIコマンド登録は完全なPlugin読み込みと互換性を保ちます。
- 検出登録は非アクティブ化ですが、インポートなしではありません。OpenClawはスナップショットを構築するために、信頼済みPluginエントリとチャネルPluginモジュールを評価する場合があります。そのため、トップレベルのインポートには副作用がないようにし、ソケット、クライアント、ワーカー、サービスは `"full"` のみのパスの背後に置いてください。
- `registerFull` は `api.registrationMode === "full"` の場合にのみ実行されます。セットアップ専用読み込み中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリにでき、OpenClawは初回アクセス時に解決済みスキーマをメモ化します。
- Plugin所有のルートCLIコマンドでは、ルートCLI解析ツリーから消えずにコマンドを遅延読み込みのままにしたい場合、`api.registerCli(..., { descriptors: [...] })` を優先してください。ペアノード機能コマンドでは、コマンドが `openclaw nodes` の下に配置されるように `api.registerNodeCliFeature(...)` を優先してください。その他のネストされたPluginコマンドでは、`parentPath` を追加し、レジストラーに渡された `program` オブジェクトにコマンドを登録してください。OpenClawはPluginを呼び出す前にそれを親コマンドへ解決します。チャネルPluginでは、それらのディスクリプターを `registerCliMetadata(...)` から登録し、`registerFull(...)` はランタイム専用の作業に集中させることを優先してください。
- `registerFull(...)` がGateway RPCメソッドも登録する場合、それらはPlugin固有のプレフィックス上に置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に強制されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル向けです。ランタイムやCLI配線を含まない `{ plugin }` だけを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

チャネルが無効、未構成、または遅延読み込みが有効な場合、OpenClawは完全なエントリの代わりにこれを読み込みます。これが重要になる場合については、[Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

実際には、`defineSetupPluginEntry(...)` を狭いセットアップヘルパーファミリーと組み合わせます。

- インポート安全なセットアップパッチアダプター、lookup-note出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲セットアッププロキシなどのランタイム安全なセットアップヘルパーには `openclaw/plugin-sdk/setup-runtime`
- 任意インストールのセットアップサーフェスには `openclaw/plugin-sdk/channel-setup`
- セットアップ/インストールCLI/アーカイブ/docsヘルパーには `openclaw/plugin-sdk/setup-tools`

重いSDK、CLI登録、長寿命のランタイムサービスは完全なエントリに保持してください。

セットアップサーフェスとランタイムサーフェスを分割するバンドル済みワークスペースチャネルは、代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。この契約により、セットアップエントリはセットアップ安全なPlugin/シークレットのエクスポートを保持しながら、ランタイムセッターも公開できます。

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

完全なチャネルエントリが読み込まれる前に、セットアップフローが本当に軽量なランタイムセッターを必要とする場合にのみ、そのバンドル済み契約を使用してください。

## 登録モード

`api.registrationMode` は、Pluginがどのように読み込まれたかを示します。

| モード            | タイミング                         | 登録するもの                                                                                                            |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 通常のGateway起動                  | すべて                                                                                                                  |
| `"discovery"`     | 読み取り専用の機能検出             | チャネル登録と静的CLIディスクリプター。エントリコードは読み込まれる可能性がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"setup-only"`    | 無効/未構成のチャネル              | チャネル登録のみ                                                                                                        |
| `"setup-runtime"` | ランタイムが利用可能なセットアップフロー | 完全なエントリが読み込まれる前に必要な軽量ランタイムだけをチャネル登録に加えて登録します                               |
| `"cli-metadata"`  | ルートヘルプ / CLIメタデータのキャプチャ | CLIディスクリプターのみ                                                                                                 |

`defineChannelPluginEntry` はこの分割を自動的に処理します。チャネルに `definePluginEntry` を直接使用する場合は、自分でモードを確認してください。

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

検出モードは、非アクティブ化のレジストリスナップショットを構築します。OpenClawがチャネル機能と静的CLIディスクリプターを登録できるように、PluginエントリとチャネルPluginオブジェクトを評価する場合があります。検出でのモジュール評価は、信頼済みだが軽量なものとして扱ってください。トップレベルでは、ネットワーククライアント、サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、認証情報の読み取り、その他のライブランタイム副作用を使用しないでください。

`"setup-runtime"` は、完全なバンドル済みチャネルランタイムに再入することなく、セットアップ専用の起動サーフェスが存在する必要がある時間枠として扱ってください。適しているのは、チャネル登録、セットアップ安全なHTTPルート、セットアップ安全なGatewayメソッド、委譲セットアップヘルパーです。重いバックグラウンドサービス、CLIレジストラー、プロバイダー/クライアントSDKのブートストラップは、引き続き `"full"` に属します。

CLIレジストラーについて具体的には:

- registrar が 1 つ以上のルートコマンドを所有していて、最初の呼び出し時に OpenClaw に実際の CLI モジュールを遅延読み込みさせたい場合は、`descriptors` を使用する
- それらの descriptor が、registrar によって公開されるすべてのトップレベルコマンドルートをカバーしていることを確認する
- descriptor のコマンド名は、英字、数字、ハイフン、アンダースコアのみにし、英字または数字で始める。OpenClaw はこの形から外れる descriptor 名を拒否し、ヘルプをレンダリングする前に説明から端末制御シーケンスを取り除く
- 即時読み込みの互換性パスにのみ `commands` 単体を使用する

## Plugin の形態

OpenClaw は、読み込まれた Plugin を登録動作によって分類します。

| 形態                  | 説明                                                |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1 つの capability 種別（例: provider のみ）         |
| **hybrid-capability** | 複数の capability 種別（例: provider + speech）     |
| **hook-only**         | hook のみで、capability はない                      |
| **non-capability**    | ツール、コマンド、サービスはあるが capability はない |

Plugin の形態を確認するには、`openclaw plugins inspect <id>` を使用します。

## 関連

- [SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API とサブパスリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) - manifest、セットアップエントリ、遅延読み込み
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) - provider 登録と hook
