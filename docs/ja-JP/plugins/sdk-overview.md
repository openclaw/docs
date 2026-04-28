---
read_when:
    - どの SDK サブパスから import するべきかを知る必要があります
    - OpenClawPluginApi のすべての登録メソッドに関するリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-04-25T13:55:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK は、Plugin とコアの間にある型付きコントラクトです。このページは、**何を import するか** と **何を登録できるか** のリファレンスです。

<Tip>
  ハウツーガイドを探していますか？

- 最初の Plugin ですか？ [Building plugins](/ja-JP/plugins/building-plugins) から始めてください。
- Channel Plugin ですか？ [Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
- Provider Plugin ですか？ [Provider plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
- ツールまたはライフサイクルフック Plugin ですか？ [Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

</Tip>

## import の規約

必ず特定のサブパスから import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより、起動を高速に保ち、循環依存の問題を防ぎます。channel 固有の entry/build ヘルパーについては、`openclaw/plugin-sdk/channel-core` を優先し、より広いアンブレラサーフェスと `buildChannelConfigSchema` のような共有ヘルパーには `openclaw/plugin-sdk/core` を使ってください。

channel config については、channel が所有する JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開してください。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。そのサブパス上にある同梱 channel 名付きの schema export は、レガシー互換 export であり、新しい Plugin のパターンではありません。

<Warning>
  provider または channel のブランド付き convenience seam（たとえば
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）を import しないでください。
  同梱 Plugin は、自身の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせています。コア利用側は、それらの Plugin ローカルな
  バレルを使うか、必要性が本当に
  channel 横断である場合に限って、狭く汎用的な SDK コントラクトを追加してください。

少数の同梱 Plugin ヘルパーシーム（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*` など）は、生成された
export map にまだ現れます。これらは同梱 Plugin の保守専用に存在しており、新しいサードパーティ Plugin には推奨される import パスではありません。
</Warning>

## サブパス リファレンス

Plugin SDK は、領域ごとにグループ化された狭いサブパス群（plugin
entry、channel、provider、auth、runtime、capability、memory、および同梱 Plugin 向けに予約されたヘルパー）として公開されています。グループ化され、リンク付きの完全なカタログについては、[Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths) を参照してください。

200 以上のサブパスの生成済み一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### Capability の登録

| Method                                           | 登録するもの                         |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                  |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行子   |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド        |
| `api.registerChannel(...)`                       | メッセージング channel               |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT 合成            |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングのリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション     |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析                   |
| `api.registerImageGenerationProvider(...)`       | 画像生成                             |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                             |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                             |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider          |
| `api.registerWebSearchProvider(...)`             | Web 検索                             |

### ツールとコマンド

| Method                          | 登録するもの                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパスする）        |

### インフラストラクチャ

| Method                                         | 登録するもの                            |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                          |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント             |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                    |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway discovery advertiser   |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                        |
| `api.registerService(service)`                 | バックグラウンドサービス                |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー              |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムのツール結果ミドルウェア      |
| `api.registerMemoryPromptSupplement(builder)`  | 加算的な memory 隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加算的な memory search/read コーパス    |

<Note>
  予約されたコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い gateway method scope を割り当てようとしても、常に `operator.admin` のままです。Plugin 所有のメソッドには、Plugin 固有のプレフィックスを使ってください。
</Note>

<Accordion title="ツール結果ミドルウェアを使うべきタイミング">
  同梱 Plugin は、ツール実行後かつランタイムがその結果をモデルへ返す前に、ツール結果を書き換える必要がある場合に `api.registerAgentToolResultMiddleware(...)` を使えます。これは、tokenjuice のような非同期出力リデューサー向けの、信頼済みでランタイム中立なシームです。

同梱 Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば `["pi", "codex"]` です。外部 Plugin はこのミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない処理には、通常の OpenClaw Plugin フックを使ってください。古い Pi 専用の組み込み拡張ファクトリー登録パスは削除されました。
</Accordion>

### Gateway discovery の登録

`api.registerGatewayDiscoveryService(...)` を使うと、Plugin は mDNS/Bonjour のようなローカル discovery トランスポートでアクティブな Gateway を通知できます。OpenClaw は、ローカル discovery が有効なときに Gateway 起動中にこのサービスを呼び出し、現在の Gateway ポートと秘密でない TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway discovery Plugin は、通知された TXT 値を秘密情報や認証として扱ってはいけません。discovery はルーティングヒントであり、信頼は引き続き Gateway auth と TLS pinning が担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け取ります。

- `commands`: registrar が所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使われる parse-time コマンド記述子

Plugin コマンドを通常のルート CLI パスで遅延ロードのままにしたい場合は、その registrar が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定してください。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` 単体の使用は、遅延ルート CLI 登録が不要な場合に限ってください。その eager な互換パスは引き続きサポートされていますが、parse-time の遅延ロード用 descriptor ベースのプレースホルダーはインストールしません。

### CLI バックエンドの登録

`api.registerCliBackend(...)` を使うと、Plugin は `codex-cli` のようなローカル AI CLI バックエンドのデフォルト config を所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のような model ref における provider プレフィックスになります。
- バックエンドの `config` は `agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー config が引き続き優先されます。OpenClaw は CLI 実行前に、Plugin デフォルトの上へ `agents.defaults.cliBackends.<id>` をマージします。
- マージ後に互換性のための書き換えが必要なバックエンドでは、`normalizeConfig` を使ってください（たとえば古いフラグ形状の正規化など）。

### 排他的スロット

| Method                                     | 登録するもの                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合 memory capability                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | memory プロンプトセクションビルダー                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | memory flush plan resolver                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | memory ランタイムアダプター                                                                                                                          |

### Memory 埋め込みアダプター

| Method                                         | 登録するもの                              |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブ Plugin 用の memory 埋め込みアダプター |

- `registerMemoryCapability` が推奨される排他的 memory Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、コンパニオン Plugin は特定の memory Plugin の private layout に直接触れる代わりに、`openclaw/plugin-sdk/memory-host-core` を通じてエクスポート済み memory artifact を利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、`registerMemoryRuntime` は、レガシー互換の排他的 memory Plugin API です。
- `registerMemoryEmbeddingProvider` を使うと、アクティブ memory Plugin は 1 つ以上の埋め込みアダプター id（たとえば `openai`、`gemini`、または Plugin 定義のカスタム id）を登録できます。
- `agents.defaults.memorySearch.provider` や `agents.defaults.memorySearch.fallback` のようなユーザー config は、これらの登録済みアダプター id に対して解決されます。

### イベントとライフサイクル

| Method                                       | 役割                          |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック    |
| `api.onConversationBindingResolved(handler)` | Conversation binding コールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

### フック決定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端になります。いずれかのハンドラーがこれを設定した時点で、より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返しても決定とは見なされません（`block` を省略した場合と同じ）であり、オーバーライドではありません。
- `before_install`: `{ block: true }` を返すと終端になります。いずれかのハンドラーがこれを設定した時点で、より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返しても決定とは見なされません（`block` を省略した場合と同じ）であり、オーバーライドではありません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端になります。いずれかのハンドラーがディスパッチを引き受けた時点で、より低優先度のハンドラーとデフォルトのモデルディスパッチ経路はスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端になります。いずれかのハンドラーがこれを設定した時点で、より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返しても決定とは見なされません（`cancel` を省略した場合と同じ）であり、オーバーライドではありません。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用してください。`metadata` は channel 固有の追加情報のために残しておいてください。
- `message_sending`: channel 固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用してください。
- `gateway_start`: 内部の `gateway:startup` フックに依存するのではなく、Gateway 所有の起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使用してください。

### API オブジェクトのフィールド

| Field                    | Type                      | 説明                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                      |
| `api.name`               | `string`                  | 表示名                                                                                         |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                      |
| `api.description`        | `string?`                 | Plugin 説明（任意）                                                                            |
| `api.source`             | `string`                  | Plugin ソースパス                                                                              |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                              |
| `api.config`             | `OpenClawConfig`          | 現在の config スナップショット（利用可能な場合は、アクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有 config                                        |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/ja-JP/plugins/sdk-runtime)                                                        |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は、完全なエントリー起動/セットアップ前の軽量ウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルート基準でパスを解決する                                                              |

## 内部モジュール規約

Plugin 内では、内部 import にローカルバレルファイルを使ってください。

```
my-plugin/
  api.ts            # 外部利用者向けの公開 export
  runtime-api.ts    # 内部専用ランタイム export
  index.ts          # Plugin エントリーポイント
  setup-entry.ts    # 軽量セットアップ専用エントリー（任意）
```

<Warning>
  本番コードから、自分自身の Plugin を `openclaw/plugin-sdk/<your-plugin>`
  経由で import しないでください。内部 import は `./api.ts` または
  `./runtime-api.ts` を通してください。SDK パスは外部コントラクト専用です。
</Warning>

ファサード経由でロードされる同梱 Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリーファイル）は、OpenClaw がすでに実行中であれば、アクティブなランタイム config スナップショットを優先します。まだランタイムスナップショットが存在しない場合は、ディスク上の解決済み config file にフォールバックします。

Provider Plugin は、ヘルパーが意図的に provider 固有で、まだ汎用 SDK
サブパスに属していない場合、狭い Plugin ローカルのコントラクトバレルを公開できます。同梱の例:

- **Anthropic**: Claude の beta-header と `service_tier` ストリームヘルパー向けの公開 `api.ts` / `contract-api.ts` シーム。
- **`@openclaw/openai-provider`**: `api.ts` は provider ビルダー、デフォルトモデルヘルパー、リアルタイム provider ビルダーを export します。
- **`@openclaw/openrouter-provider`**: `api.ts` は provider ビルダーに加えてオンボーディング/config ヘルパーを export します。

<Warning>
  extensions の本番コードでも、`openclaw/plugin-sdk/<other-plugin>` の import は避けるべきです。ヘルパーが本当に共有されるべきなら、2 つの Plugin を結合する代わりに、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または他の capability 指向サーフェスのような中立的な SDK サブパスへ昇格させてください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="エントリーポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` と `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    完全な `api.runtime` 名前空間リファレンス。
  </Card>
  <Card title="セットアップと config" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージング、マニフェスト、config schema。
  </Card>
  <Card title="テスト" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティと lint ルール。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと capability モデル。
  </Card>
</CardGroup>
