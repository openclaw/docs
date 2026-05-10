---
read_when:
    - どの SDK サブパスからインポートするかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-05-10T19:47:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は Plugin とコアの間の型付きコントラクトです。このページは、
**何をインポートするか** と **何を登録できるか** のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。
  Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張は、代わりに
  [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) と `@openclaw/sdk` パッケージを使用してください。
</Note>

<Tip>
ハウツーガイドを探していますか？[Building plugins](/ja-JP/plugins/building-plugins) から始め、チャネル Plugin には [Channel plugins](/ja-JP/plugins/sdk-channel-plugins)、プロバイダー Plugin には [Provider plugins](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには [CLI backend plugins](/ja-JP/plugins/cli-backend-plugins)、ツールまたはライフサイクルフック Plugin には [Plugin hooks](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、
循環依存の問題を防げます。チャネル固有のエントリ/ビルドヘルパーには、
`openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的なサーフェスと
`buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使い続けます。

チャネル設定では、チャネルが所有する JSON Schema を
`openclaw.plugin.json#channelConfigs` を通じて公開します。`plugin-sdk/channel-config-schema`
サブパスは、共有スキーマプリミティブと汎用ビルダーのためのものです。OpenClaw の
同梱 Plugin は、保持されている同梱チャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。
非推奨の互換性エクスポートは
`plugin-sdk/channel-config-schema-legacy` に残されています。どちらの同梱スキーマサブパスも、
新しい Plugin のパターンではありません。

<Warning>
  プロバイダー名やチャネル名を冠した便利な継ぎ目（たとえば
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。
  同梱 Plugin は、自身の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを合成します。コア利用者は、それらの Plugin ローカルな
  バレルを使用するか、必要性が本当にクロスチャネルである場合に狭い汎用 SDK コントラクトを追加するべきです。

所有者の利用が追跡されている場合、少数の同梱 Plugin ヘルパーの継ぎ目が、生成されたエクスポート
マップに引き続き現れます。これらは同梱 Plugin の
保守専用であり、新しいサードパーティ
Plugin の推奨インポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、
追跡されている所有者の利用向けに、非推奨の互換性ファサードとして維持されています。これらの
インポートパスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと
汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域別（Plugin
エントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みの
同梱 Plugin ヘルパー）にグループ化された狭いサブパスのセットとして公開されます。完全なカタログ（グループ化され、リンクされています）については、
[Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths) を参照してください。

コンパイラーエントリポイントのインベントリは
`scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト/内部サブパスを差し引いた後、
公開サブセットから生成されます。公開エクスポート数を監査するには
`pnpm plugin-sdk:surface` を実行してください。十分に古く、同梱拡張の本番コードで未使用の非推奨公開
サブパスは
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。広範な
非推奨再エクスポートバレルは、
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、これらのメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                         | 登録するもの                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                  |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器 |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド         |
| `api.registerChannel(...)`                       | メッセージングチャネル               |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成          |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション    |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析                  |
| `api.registerImageGenerationProvider(...)`       | 画像生成                             |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                             |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                             |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイププロバイダー    |
| `api.registerWebSearchProvider(...)`             | Web 検索                              |

### ツールとコマンド

| メソッド                       | 登録するもの                                      |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）                |

Plugin コマンドは、エージェントに短い、コマンド所有のルーティングヒントが必要な場合に
`agentPromptGuidance` を設定できます。そのテキストはコマンド自体についての内容に留めてください。
プロバイダー固有または Plugin 固有のポリシーをコアのプロンプトビルダーに追加しないでください。

### インフラストラクチャ

| メソッド                                       | 登録するもの                              |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                           |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント             |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                     |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway 検出アドバタイザー     |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                         |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 配下の Node 機能 CLI    |
| `api.registerService(service)`                 | バックグラウンドサービス                |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー              |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムツール結果ミドルウェア        |
| `api.registerMemoryPromptSupplement(builder)`  | 追加型のメモリ隣接プロンプトセクション  |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加型のメモリ検索/読み取りコーパス     |

### ワークフロー Plugin のホストフック

ホストフックは、プロバイダー、チャネル、ツールを追加するだけでなく、ホスト
ライフサイクルに参加する必要がある Plugin のための SDK の継ぎ目です。これらは
汎用コントラクトです。Plan Mode も使用できますが、承認ワークフロー、
ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI コンパニオン
Plugin も使用できます。

| メソッド                                                                 | 所有するコントラクト                                                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin 所有の、JSON 互換セッション状態を Gateway セッション経由で投影                                                           |
| `api.enqueueNextTurnInjection(...)`                                      | 1 つのセッションの次のエージェントターンに注入される、永続的で厳密に 1 回だけのコンテキスト                                      |
| `api.registerTrustedToolPolicy(...)`                                     | ツールパラメーターをブロックまたは書き換えできる、同梱/信頼済みの Plugin 前ツールポリシー                                        |
| `api.registerToolMetadata(...)`                                          | ツール実装を変更しないツールカタログ表示メタデータ                                                                               |
| `api.registerCommand(...)`                                               | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` を設定可能。Discord ネイティブコマンドは `descriptionLocalizations` をサポート |
| `api.registerControlUiDescriptor(...)`                                   | セッション、ツール、実行、または設定サーフェス向けの Control UI コントリビューション記述子                                      |
| `api.registerRuntimeLifecycle(...)`                                      | リセット/削除/再読み込みパスでの Plugin 所有ランタイムリソースのクリーンアップコールバック                                      |
| `api.registerAgentEventSubscription(...)`                                | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 終端実行ライフサイクルでクリアされる、実行ごとの Plugin スクラッチ状態                                                          |
| `api.registerSessionSchedulerJob(...)`                                   | 決定的なクリーンアップを伴う、Plugin 所有のセッションスケジューラージョブレコード                                               |

コントラクトは意図的に権限を分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツール
  メタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、
  ホスト安全ポリシーに関与するため同梱専用です。
- 予約済みコマンド所有権は同梱専用です。外部 Plugin は自身の
  コマンド名またはエイリアスを使用するべきです。
- `allowPromptInjection=false` は、`agent_turn_prepare`、
  `before_prompt_build`、`heartbeat_prompt_contribution`、
  レガシー `before_agent_start` からのプロンプトフィールド、および
  `enqueueNextTurnInjection` を含む、プロンプトを変更するフックを無効にします。

Plan 以外の利用例:

| Plugin アーキタイプ          | 使用するフック                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー             | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                                            |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                         |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、Heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                          |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、
  常に `operator.admin` のままです。Plugin が所有するメソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用するタイミング">
  バンドル済みpluginsは、実行後かつランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)`を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼されたランタイム中立の接点です。

バンドル済みpluginsは、対象ランタイムごとに`contracts.agentToolResultMiddleware`を宣言する必要があります。たとえば`["pi", "codex"]`です。外部pluginsはこのミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない処理には、通常のOpenClaw pluginフックを使用してください。古いPi専用の埋め込み拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway探索登録

`api.registerGatewayDiscoveryService(...)`を使用すると、pluginはmDNS/Bonjourのようなローカル探索トランスポート上でアクティブなGatewayを告知できます。OpenClawは、ローカル探索が有効な場合にGateway起動中にこのサービスを呼び出し、現在のGatewayポートとシークレットではないTXTヒントデータを渡し、Gatewayシャットダウン中に返された`stop`ハンドラーを呼び出します。

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

Gateway探索pluginsは、告知されたTXT値をシークレットや認証として扱ってはいけません。探索はルーティングヒントです。信頼は引き続きGateway認証とTLSピンニングが担います。

### CLI登録メタデータ

`api.registerCli(registrar, opts?)`は2種類のコマンドメタデータを受け取ります。

- `commands`: registrarが所有する明示的なコマンド名
- `descriptors`: CLIヘルプ、ルーティング、遅延plugin CLI登録に使用される解析時コマンド記述子
- `parentPath`: `["nodes"]`のようなネストされたコマンドグループ向けの省略可能な親コマンドパス

ペアリング済みノード機能には、`api.registerNodeCliFeature(registrar, opts?)`を優先してください。これは`api.registerCli(..., { parentPath: ["nodes"] })`を包む小さなラッパーで、`openclaw nodes canvas`のようなコマンドをplugin所有のノード機能として明示します。

pluginコマンドを通常のルートCLIパスで遅延ロードのままにしたい場合は、そのregistrarが公開するすべてのトップレベルコマンドルートをカバーする`descriptors`を指定してください。

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

ネストされたコマンドは、解決済みの親コマンドを`program`として受け取ります。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands`単体で使用するのは、ルートCLI登録の遅延ロードが不要な場合だけにしてください。この積極的な互換パスは引き続きサポートされますが、解析時の遅延ロード向けに記述子ベースのプレースホルダーはインストールしません。

### CLIバックエンド登録

`api.registerCliBackend(...)`を使用すると、pluginは`codex-cli`のようなローカルAI CLIバックエンドのデフォルト設定を所有できます。

- バックエンドの`id`は、`codex-cli/gpt-5`のようなモデル参照内のプロバイダープレフィックスになります。
- バックエンドの`config`は、`agents.defaults.cliBackends.<id>`と同じ形状を使用します。
- ユーザー設定が引き続き優先されます。OpenClawはCLIを実行する前に、pluginデフォルトの上へ`agents.defaults.cliBackends.<id>`をマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig`を使用してください（たとえば古いフラグ形状の正規化）。
- OpenClawの思考レベルをネイティブのeffortフラグへマッピングするなど、CLI方言に属するリクエストスコープのargv書き換えには`resolveExecutionArgs`を使用してください。

エンドツーエンドの作成ガイドについては、[CLIバックエンドplugins](/ja-JP/plugins/cli-backend-plugins)を参照してください。

### 排他的スロット

| メソッド                                   | 登録内容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に1つだけアクティブ）。`assemble()`コールバックは`availableTools`と`citationsMode`を受け取り、エンジンがプロンプト追加内容を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュ計画リゾルバー                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                   |

### メモリ埋め込みアダプター

| メソッド                                       | 登録内容                                      |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブなplugin向けのメモリ埋め込みアダプター |

- `registerMemoryCapability`は、推奨される排他的メモリplugin APIです。
- `registerMemoryCapability`は`publicArtifacts.listArtifacts(...)`も公開できるため、コンパニオンpluginsは特定のメモリpluginの非公開レイアウトへ到達する代わりに、`openclaw/plugin-sdk/memory-host-core`を通じてエクスポート済みメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、`registerMemoryRuntime`は、レガシー互換の排他的メモリplugin APIです。
- `MemoryFlushPlan.model`は、アクティブなフォールバックチェーンを継承せずに、フラッシュターンを`ollama/qwen3:8b`のような正確な`provider/model`参照に固定できます。
- `registerMemoryEmbeddingProvider`を使用すると、アクティブなメモリpluginは1つ以上の埋め込みアダプターID（たとえば`openai`、`gemini`、またはカスタムのplugin定義ID）を登録できます。
- `agents.defaults.memorySearch.provider`や`agents.defaults.memorySearch.fallback`などのユーザー設定は、登録済みのアダプターIDに対して解決されます。

### イベントとライフサイクル

| メソッド                                     | 実行内容                       |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック       |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック   |

例、一般的なフック名、ガードセマンティクスについては、[Pluginフック](/ja-JP/plugins/hooks)を参照してください。

### フック判定セマンティクス

- `before_tool_call`: `{ block: true }`を返すと終端になります。いずれかのハンドラーがこれを設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }`を返すと、上書きではなく判定なし（`block`を省略した場合と同じ）として扱われます。
- `before_install`: `{ block: true }`を返すと終端になります。いずれかのハンドラーがこれを設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }`を返すと、上書きではなく判定なし（`block`を省略した場合と同じ）として扱われます。
- `reply_dispatch`: `{ handled: true, ... }`を返すと終端になります。いずれかのハンドラーがディスパッチを引き受けると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }`を返すと終端になります。いずれかのハンドラーがこれを設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }`を返すと、上書きではなく判定なし（`cancel`を省略した場合と同じ）として扱われます。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの`threadId`フィールドを使用してください。`metadata`はチャネル固有の追加情報用に保持してください。
- `message_sending`: チャネル固有の`metadata`へフォールバックする前に、型付きの`replyToId` / `threadId`ルーティングフィールドを使用してください。
- `gateway_start`: 内部の`gateway:startup`フックに依存する代わりに、Gateway所有の起動状態には`ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()`を使用してください。
- `cron_changed`: Gateway所有のcronライフサイクル変更を監視します。外部ウェイクスケジューラーを同期する場合は`event.job?.state?.nextRunAtMs`と`ctx.getCron?.()`を使用し、期限チェックと実行の信頼できる情報源はOpenClawのままにしてください。

### APIオブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                      |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                 |
| `api.name`               | `string`                  | 表示名                                                                                    |
| `api.version`            | `string?`                 | Pluginバージョン（省略可能）                                                               |
| `api.description`        | `string?`                 | Plugin説明（省略可能）                                                                     |
| `api.source`             | `string`                  | Pluginソースパス                                                                          |
| `api.rootDir`            | `string?`                 | Pluginルートディレクトリ（省略可能）                                                       |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`からのplugin固有設定                                          |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"`は軽量な完全エントリ前の起動/セットアップ期間です       |
| `api.resolvePath(input)` | `(string) => string`      | Pluginルートからの相対パスを解決                                                           |

## 内部モジュール規約

plugin内では、内部インポートにローカルバレルファイルを使用してください。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから`openclaw/plugin-sdk/<your-plugin>`経由で自分自身のpluginをインポートしてはいけません。内部インポートは`./api.ts`または`./runtime-api.ts`を通してください。SDKパスは外部契約専用です。
</Warning>

ファサード経由で読み込まれる同梱 Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。ランタイム
スナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化された同梱 Plugin のファサードは、OpenClaw の Plugin
ファサードローダー経由で読み込む必要があります。`dist/extensions/...` からの直接インポートは、
パッケージ化されたインストールが Plugin 所有コードに使用するマニフェストと
ランタイムサイドカーのチェックをバイパスします。

Provider Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合に、狭い Plugin ローカルのコントラクトバレルを公開できます。同梱例:

- **Anthropic**: Claude ベータヘッダーと `service_tier` ストリームヘルパー向けの公開 `api.ts` / `contract-api.ts` シーム。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加え、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードでも、`openclaw/plugin-sdk/<other-plugin>`
  インポートは避ける必要があります。ヘルパーが本当に共有されるものなら、2 つの Plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  機能指向サーフェスのような中立的な SDK サブパスへ昇格させてください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="エントリポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` と `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="ランタイムヘルパー" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    完全な `api.runtime` 名前空間リファレンス。
  </Card>
  <Card title="セットアップと設定" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージ化、マニフェスト、設定スキーマ。
  </Card>
  <Card title="テスト" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティと lint ルール。
  </Card>
  <Card title="SDK 移行" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
