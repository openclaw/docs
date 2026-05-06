---
read_when:
    - definePluginEntry または defineChannelPluginEntry の正確な型シグネチャが必要です
    - 登録モード（full、setup、CLI メタデータ）を理解したい場合
    - エントリーポイントのオプションを確認しています
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry、および defineSetupPluginEntry のリファレンス
title: Plugin のエントリーポイント
x-i18n:
    generated_at: "2026-05-06T05:14:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

すべてのPluginは既定のエントリーオブジェクトをエクスポートします。SDKは、それらを
作成するための3つのヘルパーを提供します。

インストール済みPluginでは、利用可能な場合に `package.json` がランタイム読み込みをビルド済み
JavaScriptに向けるようにします。

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

`extensions` と `setupEntry` は、ワークスペースおよびgit
チェックアウトでの開発向けのソースエントリーとして引き続き有効です。`runtimeExtensions` と `runtimeSetupEntry` は、
OpenClawがインストール済みパッケージを読み込む場合に推奨され、npmパッケージがランタイムでの
TypeScriptコンパイルを回避できるようにします。明示的なランタイムエントリーは必須です。`runtimeSetupEntry` には
`setupEntry` が必要であり、`runtimeExtensions` または `runtimeSetupEntry` の
成果物がない場合は、ソースへ黙ってフォールバックするのではなく、インストール/検出が失敗します。インストール済みパッケージが
TypeScriptソースエントリーだけを宣言している場合、OpenClawは対応するビルド済みの `dist/*.js` ピアが存在すればそれを使用し、その後TypeScript
ソースへフォールバックします。

すべてのエントリーパスはPluginパッケージディレクトリ内に収まっている必要があります。ランタイムエントリー
および推論されたビルド済みJavaScriptピアによって、外へ抜ける `extensions` または
`setupEntry` のソースパスが有効になることはありません。

<Tip>
  **ウォークスルーを探していますか？** 手順付きガイドについては、[チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins)
  または[プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)を参照してください。
</Tip>

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、ツールPlugin、フックPlugin、およびメッセージングチャンネル**ではない**
すべてのもの向けです。

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

| フィールド       | 型                                                               | 必須     | 既定値                  |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | はい     | -                   |
| `name`         | `string`                                                         | はい     | -                   |
| `description`  | `string`                                                         | はい     | -                   |
| `kind`         | `string`                                                         | いいえ   | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ   | 空のオブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい     | -                   |

- `id` は `openclaw.plugin.json` マニフェストと一致する必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価のための関数にできます。
- OpenClawは初回アクセス時にそのスキーマを解決してメモ化するため、コストの高いスキーマ
  ビルダーは一度だけ実行されます。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` をチャンネル固有の配線でラップします。自動的に
`api.registerChannel({ plugin })` を呼び出し、任意のルートヘルプCLIメタデータの
継ぎ目を公開し、登録モードに応じて `registerFull` を制御します。

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

| フィールド              | 型                                                               | 必須     | 既定値                  |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | はい     | -                   |
| `name`                | `string`                                                         | はい     | -                   |
| `description`         | `string`                                                         | はい     | -                   |
| `plugin`              | `ChannelPlugin`                                                  | はい     | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ   | 空のオブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ   | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ   | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ   | -                   |

- `setRuntime` は登録中に呼び出されるため、ランタイム参照を保存できます
  （通常は `createPluginRuntimeStore` 経由）。CLIメタデータ
  取得中はスキップされます。
- `registerCliMetadata` は `api.registrationMode === "cli-metadata"`、
  `api.registrationMode === "discovery"`、および
  `api.registrationMode === "full"` の間に実行されます。
  これをチャンネル所有のCLI記述子の標準的な場所として使用すると、ルートヘルプは
  非アクティブ化のままになり、検出スナップショットには静的コマンドメタデータが含まれ、
  通常のCLIコマンド登録は完全なPlugin読み込みと互換性を維持できます。
- 検出登録は非アクティブ化ですが、インポート不要ではありません。OpenClawは
  スナップショットを構築するために、信頼済みPluginエントリーとチャンネルPluginモジュールを
  評価する場合があるため、トップレベルのインポートは副作用なしに保ち、ソケット、
  クライアント、ワーカー、サービスは `"full"` 専用パスの背後に置いてください。
- `registerFull` は `api.registrationMode === "full"` の場合にのみ実行されます。setup専用読み込み
  中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリーにでき、OpenClawは
  初回アクセス時に解決済みスキーマをメモ化します。
- Plugin所有のルートCLIコマンドでは、コマンドをルートCLI解析ツリーから消さずに
  遅延読み込みのままにしたい場合、`api.registerCli(..., { descriptors: [...] })` を優先してください。
  チャンネルPluginでは、それらの記述子を `registerCliMetadata(...)` から登録することを優先し、
  `registerFull(...)` はランタイム専用の作業に集中させてください。
- `registerFull(...)` がGateway RPCメソッドも登録する場合は、それらを
  Plugin固有のプレフィックスに置いてください。予約済みのコア管理名前空間（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）は常に
  `operator.admin` に強制変換されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル用です。ランタイムやCLI配線なしで、単に `{ plugin }` を返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClawは、チャンネルが無効、未設定、または遅延読み込みが有効な場合に、完全なエントリーの代わりにこれを読み込みます。
これが重要になる場面については、
[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

実際には、`defineSetupPluginEntry(...)` を狭いsetupヘルパー
ファミリーと組み合わせてください。

- インポート安全なsetupパッチアダプター、lookup-note出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、委譲setupプロキシなどの
  ランタイム安全なsetupヘルパーには `openclaw/plugin-sdk/setup-runtime`
- 任意インストールのsetupサーフェスには `openclaw/plugin-sdk/channel-setup`
- setup/インストールCLI/アーカイブ/ドキュメントヘルパーには `openclaw/plugin-sdk/setup-tools`

重いSDK、CLI登録、長寿命のランタイムサービスは完全な
エントリーに置いてください。

setupとランタイムサーフェスを分割するバンドル済みワークスペースチャンネルは、
代わりに `openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を使用できます。このコントラクトにより、
setupエントリーはランタイムセッターを公開したまま、setup安全なPlugin/secretsエクスポートを維持できます。

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

完全なチャンネルエントリーが読み込まれる前に、setupフローが本当に軽量なランタイム
セッターを必要とする場合にのみ、そのバンドル済みコントラクトを使用してください。

## 登録モード

`api.registrationMode` は、Pluginがどのように読み込まれたかを示します。

| モード            | タイミング                        | 登録するもの                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 通常のGateway起動                 | すべて                                                                                                                  |
| `"discovery"`     | 読み取り専用の機能検出            | チャンネル登録と静的CLI記述子。エントリーコードは読み込まれる場合がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"setup-only"`    | 無効/未設定のチャンネル           | チャンネル登録のみ                                                                                                      |
| `"setup-runtime"` | ランタイムが利用可能なsetupフロー | チャンネル登録に加えて、完全なエントリーが読み込まれる前に必要な軽量ランタイムのみ                                      |
| `"cli-metadata"`  | ルートヘルプ / CLIメタデータ取得  | CLI記述子のみ                                                                                                           |

`defineChannelPluginEntry` はこの分割を自動的に処理します。チャンネルに対して
`definePluginEntry` を直接使用する場合は、自分でモードを確認してください。

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

検出モードは、非アクティブ化のレジストリスナップショットを構築します。それでも、
OpenClawがチャンネル機能と静的CLI記述子を登録できるように、Pluginエントリーと
チャンネルPluginオブジェクトを評価する場合があります。検出時のモジュール評価は
信頼済みだが軽量なものとして扱ってください。トップレベルでは、ネットワーククライアント、サブプロセス、
リスナー、データベース接続、バックグラウンドワーカー、資格情報の読み取り、その他のライブランタイムの
副作用を発生させないでください。

`"setup-runtime"` は、完全なバンドル済みチャンネルランタイムに再入することなく、
setup専用の起動サーフェスが存在する必要がある期間として扱ってください。適しているのは
チャンネル登録、setup安全なHTTPルート、setup安全なGatewayメソッド、および
委譲setupヘルパーです。重いバックグラウンドサービス、CLI登録機能、および
プロバイダー/クライアントSDKのブートストラップは、引き続き `"full"` に属します。

CLI登録機能については特に次のとおりです。

- 登録機能が1つ以上のルートコマンドを所有していて、OpenClawに初回呼び出し時に実際のCLIモジュールを遅延読み込みさせたい場合は
  `descriptors` を使用します
- それらの記述子が、登録機能によって公開されるすべてのトップレベルコマンドルートを網羅していることを確認してください
- 記述子のコマンド名は、文字、数字、ハイフン、アンダースコアに限定し、
  文字または数字で始まるようにしてください。OpenClawはその形に合わない記述子名を拒否し、
  ヘルプをレンダリングする前に説明から端末制御シーケンスを取り除きます
- 積極的な互換性パスの場合のみ `commands` だけを使用します

## Pluginの形状

OpenClaw は、読み込まれたPluginを登録時の動作によって分類します。

| 形状                  | 説明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1つのケイパビリティ種別（例: プロバイダー専用）   |
| **hybrid-capability** | 複数のケイパビリティ種別（例: プロバイダー + 音声） |
| **hook-only**         | フックのみ、ケイパビリティなし                    |
| **non-capability**    | ツール/コマンド/サービスはあるが、ケイパビリティなし |

Plugin の形状を確認するには `openclaw plugins inspect <id>` を使用します。

## 関連

- [SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API とサブパスのリファレンス
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime) - `api.runtime` と `createPluginRuntimeStore`
- [セットアップと設定](/ja-JP/plugins/sdk-setup) - マニフェスト、セットアップエントリ、遅延読み込み
- [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins) - `ChannelPlugin` オブジェクトの構築
- [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー登録とフック
