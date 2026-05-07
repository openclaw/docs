---
read_when:
    - どの SDK サブパスからインポートすべきかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要な場合
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-05-07T13:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDKは、Pluginとコアの間の型付き契約です。このページは、**何をimportするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw内で`openclaw/plugin-sdk/*`を使用するPlugin作者向けです。Gatewayを通じてエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CIジョブ、IDE拡張機能には、代わりに[OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk)と`@openclaw/sdk`パッケージを使用してください。
</Note>

<Tip>
代わりにハウツーガイドを探していますか？[Pluginを構築する](/ja-JP/plugins/building-plugins)から始め、チャネルPluginには[チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins)、プロバイダーPluginには[プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)、ローカルAI CLIバックエンドには[CLIバックエンドPlugin](/ja-JP/plugins/cli-backend-plugins)、ツールまたはライフサイクルフックPluginには[Pluginフック](/ja-JP/plugins/hooks)を使用してください。
</Tip>

## import規約

常に特定のサブパスからimportしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは小さな自己完結型モジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャネル固有のエントリ/ビルドヘルパーには`openclaw/plugin-sdk/channel-core`を優先してください。より広い包括的なサーフェスや、`buildChannelConfigSchema`などの共有ヘルパーには`openclaw/plugin-sdk/core`を使い続けてください。

チャネル設定では、チャネルが所有するJSON Schemaを`openclaw.plugin.json#channelConfigs`を通じて公開します。`plugin-sdk/channel-config-schema`サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClawの同梱Pluginは、保持される同梱チャネルスキーマに`plugin-sdk/bundled-channel-config-schema`を使用します。非推奨の互換エクスポートは`plugin-sdk/channel-config-schema-legacy`に残っています。どちらの同梱スキーマサブパスも、新しいPluginのパターンではありません。

<Warning>
  プロバイダーやチャネル名を冠した利便性のためのつなぎ目（例: `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をimportしないでください。同梱Pluginは、自身の`api.ts` / `runtime-api.ts`バレル内で汎用SDKサブパスを組み立てます。コア利用者は、それらのPluginローカルバレルを使うか、必要性が本当にクロスチャネルである場合に狭い汎用SDK契約を追加するべきです。

追跡済みの所有者利用がある場合、少数の同梱Pluginヘルパーのつなぎ目が生成されたエクスポートマップにまだ表示されます。これらは同梱Pluginのメンテナンス専用であり、新しいサードパーティPluginのimportパスとしては推奨されません。

`openclaw/plugin-sdk/discord`と`openclaw/plugin-sdk/telegram-account`も、追跡済みの所有者利用向けに非推奨の互換ファサードとして保持されています。これらのimportパスを新しいPluginにコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャネルSDKサブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDKは、領域（Pluginエントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みの同梱Pluginヘルパー）ごとにグループ化された、狭いサブパスの集合として公開されます。グループ化されリンクされた完全なカタログについては、[Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

生成された200以上のサブパス一覧は`scripts/lib/plugin-sdk-entrypoints.json`にあります。

## 登録API

`register(api)`コールバックは、次のメソッドを持つ`OpenClawPluginApi`オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                         | 登録するもの                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                  |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器 |
| `api.registerCliBackend(...)`                    | ローカルCLI推論バックエンド          |
| `api.registerChannel(...)`                       | メッセージングチャネル               |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT合成           |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション    |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析                   |
| `api.registerImageGenerationProvider(...)`       | 画像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                              |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                              |
| `api.registerWebFetchProvider(...)`              | Webフェッチ / スクレイププロバイダー |
| `api.registerWebSearchProvider(...)`             | Web検索                               |

### ツールとコマンド

| メソッド                        | 登録するもの                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須、または`{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLMをバイパス）             |

Pluginコマンドは、エージェントに短い、コマンド所有のルーティングヒントが必要な場合に`agentPromptGuidance`を設定できます。そのテキストはコマンド自体に関する内容にしてください。プロバイダーやPlugin固有のポリシーをコアのプロンプトビルダーに追加しないでください。

### インフラストラクチャ

| メソッド                                       | 登録するもの                          |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                         |
| `api.registerHttpRoute(params)`                | Gateway HTTPエンドポイント             |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPCメソッド                    |
| `api.registerGatewayDiscoveryService(service)` | ローカルGateway検出アドバタイザー      |
| `api.registerCli(registrar, opts?)`            | CLIサブコマンド                        |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes`配下のNode機能CLI      |
| `api.registerService(service)`                 | バックグラウンドサービス              |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー            |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムツール結果ミドルウェア      |
| `api.registerMemoryPromptSupplement(builder)`  | 追加的なメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加的なメモリ検索/読み取りコーパス   |

### ワークフローPlugin向けのホストフック

ホストフックは、プロバイダー、チャネル、またはツールを追加するだけでなく、ホストライフサイクルに参加する必要があるPlugin向けのSDKのつなぎ目です。これらは汎用契約です。Plan Modeはこれらを使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UIコンパニオンPluginも使用できます。

| メソッド                                                                 | 所有する契約                                                                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gatewayセッションを通じて投影される、Plugin所有のJSON互換セッション状態                                                          |
| `api.enqueueNextTurnInjection(...)`                                      | 1つのセッションの次のエージェントターンへ注入される、永続的な正確に1回のコンテキスト                                             |
| `api.registerTrustedToolPolicy(...)`                                     | ツールパラメーターをブロックまたは書き換えできる、同梱/信頼済みのPlugin前ツールポリシー                                          |
| `api.registerToolMetadata(...)`                                          | ツール実装を変更しないツールカタログ表示メタデータ                                                                                |
| `api.registerCommand(...)`                                               | スコープ付きPluginコマンド。コマンド結果は`continueAgent: true`を設定可能。Discordネイティブコマンドは`descriptionLocalizations`をサポート |
| `api.registerControlUiDescriptor(...)`                                   | セッション、ツール、実行、または設定サーフェス向けのControl UI寄与記述子                                                          |
| `api.registerRuntimeLifecycle(...)`                                      | リセット/削除/再読み込みパスでのPlugin所有ランタイムリソース用クリーンアップコールバック                                        |
| `api.registerAgentEventSubscription(...)`                                | ワークフロー状態とモニター向けのサニタイズ済みイベント購読                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 終端実行ライフサイクルでクリアされる、実行ごとのPluginスクラッチ状態                                                             |
| `api.registerSessionSchedulerJob(...)`                                   | 決定的なクリーンアップを伴う、Plugin所有のセッションスケジューラージョブレコード                                                 |

これらの契約は意図的に権限を分割しています。

- 外部Pluginは、セッション拡張、UI記述子、コマンド、ツールメタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の`before_tool_call`フックより前に実行され、ホストの安全ポリシーに関与するため同梱専用です。
- 予約済みコマンド所有権は同梱専用です。外部Pluginは自身のコマンド名またはエイリアスを使用するべきです。
- `allowPromptInjection=false`は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー`before_agent_start`からのプロンプトフィールド、`enqueueNextTurnInjection`を含む、プロンプトを変更するフックを無効にします。

Plan以外の利用者の例:

| Pluginアーキタイプ             | 使用するフック                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー             | セッション拡張、コマンド継続、次ターン注入、UI記述子                                                                                 |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                             |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベント購読、セッションスケジューラー所有権/クリーンアップ、Heartbeatプロンプト寄与、UI記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI記述子                                                                               |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は、Pluginがより狭いGatewayメソッドスコープを割り当てようとしても、常に`operator.admin`のままです。Plugin所有メソッドには、Plugin固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使うタイミング">
  同梱Pluginは、ツール実行後、ランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)`を使用できます。これは、tokenjuiceなどの非同期出力リデューサー向けの、信頼済みでランタイム中立なつなぎ目です。

同梱 Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば `["pi", "codex"]` です。外部 Plugin はこのミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない処理には、通常の OpenClaw Plugin フックを使ってください。古い Pi 専用の埋め込み拡張ファクトリー登録パスは削除されました。
</Accordion>

### Gateway ディスカバリー登録

`api.registerGatewayDiscoveryService(...)` を使うと、Plugin は mDNS/Bonjour などのローカルディスカバリートランスポート上でアクティブな
Gateway を通知できます。OpenClaw はローカルディスカバリーが有効な場合、Gateway 起動中にこのサービスを呼び出し、現在の Gateway ポートと秘密ではない TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway ディスカバリー Plugin は、通知される TXT 値をシークレットや認証として扱ってはいけません。ディスカバリーはルーティングのヒントです。Gateway 認証と TLS ピンニングが引き続き信頼を担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は 2 種類のコマンドメタデータを受け付けます。

- `commands`: 登録側が所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使われる解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストしたコマンドグループ向けの任意の親コマンドパス

ペアリング済みノード機能には、`api.registerNodeCliFeature(registrar, opts?)` を優先してください。これは `api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーで、`openclaw nodes canvas` などのコマンドを、Plugin が所有するノード機能として明示します。

通常のルート CLI パスで Plugin コマンドを遅延読み込みのままにしたい場合は、その登録側が公開するすべてのトップレベルコマンドルートを網羅する `descriptors` を指定してください。

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

ネストしたコマンドは、解決済みの親コマンドを `program` として受け取ります。

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

遅延ルート CLI 登録が不要な場合に限り、`commands` 単体を使ってください。その積極読み込みの互換パスは引き続きサポートされますが、解析時の遅延読み込み用に記述子ベースのプレースホルダーはインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` を使うと、Plugin は `codex-cli` などのローカル AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のようなモデル参照内のプロバイダープレフィックスになります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI の実行前に、Plugin のデフォルトに `agents.defaults.cliBackends.<id>` をマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig` を使います（たとえば古いフラグ形状の正規化）。
- OpenClaw の思考レベルをネイティブの effort フラグにマッピングするなど、CLI 方言に属するリクエスト単位の argv 書き換えには `resolveExecutionArgs` を使います。

エンドツーエンドの作成ガイドについては、[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を参照してください。

### 排他スロット

| Method                                     | 登録内容                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合メモリー機能                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | メモリープロンプトセクションビルダー                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | メモリーフラッシュ計画リゾルバー                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | メモリーランタイムアダプター                                                                                                                         |

### メモリー埋め込みアダプター

| Method                                         | 登録内容                                       |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin 用のメモリー埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他メモリー Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、コンパニオン Plugin は特定のメモリー Plugin のプライベートレイアウトに踏み込む代わりに、`openclaw/plugin-sdk/memory-host-core` を通じてエクスポート済みメモリーアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、`registerMemoryRuntime` は、レガシー互換の排他メモリー Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバックチェーンを継承せずに、フラッシュターンを `ollama/qwen3:8b` などの正確な `provider/model` 参照に固定できます。
- `registerMemoryEmbeddingProvider` を使うと、アクティブなメモリー Plugin は 1 つ以上の埋め込みアダプター ID（たとえば `openai`、`gemini`、またはカスタムの Plugin 定義 ID）を登録できます。
- `agents.defaults.memorySearch.provider` や `agents.defaults.memorySearch.fallback` などのユーザー設定は、それらの登録済みアダプター ID に対して解決されます。

### イベントとライフサイクル

| Method                                       | 動作                         |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック   |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

### フック判定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、より低い優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すことは、上書きではなく、判定なし（`block` を省略した場合と同じ）として扱われます。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、より低い優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すことは、上書きではなく、判定なし（`block` を省略した場合と同じ）として扱われます。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを引き受けると、より低い優先度のハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーがこれを設定すると、より低い優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すことは、上書きではなく、判定なし（`cancel` を省略した場合と同じ）として扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使ってください。チャンネル固有の追加情報には `metadata` を使い続けてください。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使ってください。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使ってください。
- `cron_changed`: Gateway が所有する Cron ライフサイクル変更を監視します。外部ウェイクスケジューラーを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使い、期限チェックと実行の信頼できる情報源として OpenClaw を維持してください。

### API オブジェクトフィールド

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                      |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                   |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                       |
| `api.source`             | `string`                  | Plugin ソースパス                                                                           |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                           |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリーランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                        |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は軽量な完全エントリー前の起動/セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                           |

## 内部モジュール規約

Plugin 内では、内部インポートにローカルバレルファイルを使ってください。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` を通じて自分の Plugin をインポートしてはいけません。内部インポートは `./api.ts` または `./runtime-api.ts` 経由にしてください。SDK パスは外部契約専用です。
</Warning>

ファサードで読み込まれる同梱 Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts`、および類似の公開エントリーファイル）は、OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。ランタイムスナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。パッケージ化された同梱 Plugin のファサードは、OpenClaw の Plugin ファサードローダーを通じて読み込む必要があります。`dist/extensions/...` からの直接インポートは、パッケージ化インストールが Plugin 所有コードに使うマニフェストとランタイムサイドカーチェックをバイパスします。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK サブパスに属さない場合に、狭い Plugin ローカルのコントラクトバレルを公開できます。バンドルされている例:

- **Anthropic**: Claude の beta-header と `service_tier` ストリームヘルパー向けの公開 `api.ts` / `contract-api.ts` シーム。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードでも `openclaw/plugin-sdk/<other-plugin>`
  の import は避けるべきです。ヘルパーが本当に共有されるものなら、2 つの Plugin を結合するのではなく、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の機能指向のサーフェスなど、中立的な SDK サブパスに昇格してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="エントリーポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
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
    非推奨サーフェスから移行する。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
