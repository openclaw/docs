---
read_when:
    - SDK のどのサブパスからインポートするかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-05-11T20:34:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

プラグイン SDK は、プラグインとコアの間の型付きコントラクトです。このページは、**何をインポートするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用するプラグイン作者向けです。Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能には、代わりに [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) と `@openclaw/sdk` パッケージを使用してください。
</Note>

<Tip>
代わりにハウツーガイドを探していますか？[プラグインの構築](/ja-JP/plugins/building-plugins) から始め、チャネルプラグインには [チャネルプラグイン](/ja-JP/plugins/sdk-channel-plugins)、プロバイダープラグインには [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには [CLI バックエンドプラグイン](/ja-JP/plugins/cli-backend-plugins)、ツールまたはライフサイクルフックプラグインには [Plugin フック](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防ぎます。チャネル固有の entry/build ヘルパーには `openclaw/plugin-sdk/channel-core` を優先し、より広い包括的サーフェスと `buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使ってください。

チャネル設定では、チャネルが所有する JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開します。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw のバンドルプラグインは、保持されているバンドルチャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性エクスポートは `plugin-sdk/channel-config-schema-legacy` に残っています。どちらのバンドルスキーマサブパスも、新しいプラグインのパターンではありません。

<Warning>
  プロバイダーまたはチャネルのブランド付き便利シーム（たとえば `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。バンドルプラグインは、それぞれの `api.ts` / `runtime-api.ts` バレル内で汎用 SDK サブパスを合成します。コアの利用側は、それらのプラグインローカルなバレルを使用するか、本当にクロスチャネルで必要な場合に狭い汎用 SDK コントラクトを追加してください。

所有者による使用が追跡されている場合、少数のバンドルプラグインヘルパーシームが生成されたエクスポートマップに引き続き表示されます。これらはバンドルプラグインのメンテナンス専用であり、新しいサードパーティープラグインの推奨インポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡されている所有者の使用向けに、非推奨の互換性ファサードとして保持されています。これらのインポートパスを新しいプラグインにコピーしないでください。代わりに注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

プラグイン SDK は、領域別（プラグインエントリー、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みのバンドルプラグインヘルパー）にグループ化された狭いサブパスの集合として公開されます。グループ化されリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths) を参照してください。

コンパイラーエントリーポイントのインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト/内部サブパスを差し引いた後の公開サブセットから生成されます。公開エクスポート数を監査するには `pnpm plugin-sdk:surface` を実行してください。十分に古く、バンドル拡張機能の本番コードで未使用の非推奨公開サブパスは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。広い非推奨の再エクスポートバレルは `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                           | 登録するもの                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                  |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器 |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド           |
| `api.registerChannel(...)`                       | メッセージングチャネル                     |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成        |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし      |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション        |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析            |
| `api.registerImageGenerationProvider(...)`       | 画像生成                      |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                      |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                      |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイピングプロバイダー           |
| `api.registerWebSearchProvider(...)`             | Web 検索                            |

### ツールとコマンド

| メソッド                          | 登録するもの                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）             |

プラグインコマンドは、エージェントが短い、コマンド所有のルーティングヒントを必要とする場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体についての内容に留めてください。プロバイダーまたはプラグイン固有のポリシーをコアプロンプトビルダーに追加しないでください。

### インフラストラクチャ

| メソッド                                         | 登録するもの                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                      |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway 探索アドバタイザー      |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                          |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 配下の Node 機能 CLI |
| `api.registerService(service)`                 | バックグラウンドサービス                      |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー                     |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムのツール結果ミドルウェア          |
| `api.registerMemoryPromptSupplement(builder)`  | 追加型のメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加型のメモリ検索/読み取りコーパス      |

### ワークフロープラグイン向けホストフック

ホストフックは、プロバイダー、チャネル、ツールを追加するだけではなく、ホストライフサイクルに参加する必要があるプラグイン向けの SDK シームです。これらは汎用コントラクトです。Plan Mode で使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI コンパニオンプラグインでも使用できます。

| メソッド                                                                               | 所有するコントラクト                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway セッションを通じて投影される、プラグイン所有の JSON 互換セッション状態                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションの次のエージェントターンに注入される、永続的な exactly-once コンテキスト                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、バンドル/信頼済みのプリプラグインツールポリシー                                                      |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                            |
| `api.registerCommand(...)`                                                           | スコープ付きプラグインコマンド。コマンド結果は `continueAgent: true` を設定できます。Discord ネイティブコマンドは `descriptionLocalizations` をサポートします |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、設定サーフェス向けのコントロール UI コントリビューション記述子                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット/削除/再読み込みパスでのプラグイン所有ランタイムリソース向けクリーンアップコールバック                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルで消去される、実行ごとのプラグインスクラッチ状態                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | プラグイン所有スケジューラージョブ向けのクリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行いません                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | アクティブな直接アウトバウンドセッションルートへの、バンドル専用のホスト仲介ファイル添付配信                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル専用の Cron ベースのスケジュール済みセッションターンとタグベースのクリーンアップ                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway 経由でディスパッチできる型付きセッションアクション                                                                    |

新しいプラグインコードでは、グループ化された名前空間を使用してください。

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

同等のフラットメソッドは、既存プラグイン向けの非推奨互換性エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または `api.unscheduleSessionTurnsByTag` を直接呼び出す新しいプラグインコードは追加しないでください。

`scheduleSessionTurn(...)` は、Gateway Cron スケジューラ上のセッションスコープの便利なラッパーです。Cron はタイミングを所有し、ターンの実行時にバックグラウンドタスクレコードを作成します。Plugin SDK は、対象セッション、Plugin 所有の命名、クリーンアップだけを制約します。作業自体に永続的な複数ステップの Task Flow 状態が必要な場合は、スケジュールされたターン内で `api.runtime.tasks.managedFlows` を使用してください。

コントラクトは意図的に権限を分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホストの安全ポリシーに関与するためバンドル専用です。
- 予約済みコマンドの所有権はバンドル専用です。外部 Plugin は独自のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` のプロンプトフィールド、`enqueueNextTurnInjection` を含む、プロンプトを変更するフックを無効にします。

Plan 以外の利用例:

| Plugin アーキタイプ          | 使用するフック                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー             | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                                                |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                             |
| バックグラウンドライフサイクル監視 | ランタイムライフサイクルクリーンアップ、エージェントイベント購読、セッションスケジューラの所有権/クリーンアップ、Heartbeat プロンプト寄与、UI 記述子 |
| セットアップまたはオンボーディング ウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みのコア管理名前空間 (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有のメソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="When to use tool-result middleware">
  バンドル Plugin は、実行後、ランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合に、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼済みでランタイム中立な境界です。

バンドル Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば `["pi", "codex"]` です。外部 Plugin はこのミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使用してください。古い Pi 専用の埋め込み拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` を使うと、Plugin は mDNS/Bonjour などのローカル検出トランスポート上でアクティブな Gateway を公開できます。OpenClaw は、ローカル検出が有効な場合に Gateway 起動中にこのサービスを呼び出し、現在の Gateway ポートとシークレットではない TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラを呼び出します。

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

Gateway 検出 Plugin は、公開された TXT 値をシークレットや認証として扱ってはいけません。検出はルーティングのヒントです。Gateway 認証と TLS ピンニングが引き続き信頼を所有します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は 2 種類のコマンドメタデータを受け入れます。

- `commands`: registrar が所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ用の任意の親コマンドパス

ペアノード機能には、`api.registerNodeCliFeature(registrar, opts?)` を優先してください。これは `api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーで、`openclaw nodes canvas` のようなコマンドを、明示的な Plugin 所有のノード機能にします。

Plugin コマンドを通常のルート CLI パスで遅延ロードされたままにしたい場合は、その registrar が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定してください。

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

ネストされたコマンドは、解決済みの親コマンドを `program` として受け取ります。

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

遅延ルート CLI 登録が不要な場合のみ、`commands` を単独で使用してください。この即時互換パスは引き続きサポートされていますが、解析時の遅延ロード用に記述子ベースのプレースホルダーはインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` を使うと、Plugin は `codex-cli` などのローカル AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のようなモデル参照のプロバイダープレフィックスになります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形を使用します。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、`agents.defaults.cliBackends.<id>` を Plugin のデフォルトに重ねてマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig` を使用します。たとえば古いフラグ形状の正規化です。
- OpenClaw の思考レベルをネイティブな effort フラグにマッピングするなど、CLI 方言に属するリクエストスコープの argv 書き換えには、`resolveExecutionArgs` を使用します。

エンドツーエンドの作成ガイドについては、[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を参照してください。

### 排他的スロット

| メソッド                                   | 登録するもの                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つがアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュ計画リゾルバー                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                 |

### メモリ埋め込みアダプター

| メソッド                                       | 登録するもの                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他的メモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、コンパニオン Plugin は特定のメモリ Plugin のプライベートレイアウトに踏み込まずに、`openclaw/plugin-sdk/memory-host-core` を通じてエクスポート済みメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、`registerMemoryRuntime` は、レガシー互換の排他的メモリ Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバックチェーンを継承せずに、フラッシュターンを `ollama/qwen3:8b` のような正確な `provider/model` 参照に固定できます。
- `registerMemoryEmbeddingProvider` を使うと、アクティブなメモリ Plugin は、1 つ以上の埋め込みアダプター ID（たとえば `openai`、`gemini`、またはカスタムの Plugin 定義 ID）を登録できます。
- `agents.defaults.memorySearch.provider` や `agents.defaults.memorySearch.fallback` などのユーザー設定は、それらの登録済みアダプター ID に対して解決されます。

### イベントとライフサイクル

| メソッド                                     | 実行すること                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック    |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

### フック判定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラが設定すると、優先度の低いハンドラはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと判定なしとして扱われます（`block` を省略した場合と同じ）し、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラが設定すると、優先度の低いハンドラはスキップされます。
- `before_install`: `{ block: false }` を返すと判定なしとして扱われます（`block` を省略した場合と同じ）し、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラがディスパッチを引き受けると、優先度の低いハンドラとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラが設定すると、優先度の低いハンドラはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと判定なしとして扱われます（`cancel` を省略した場合と同じ）し、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用してください。`metadata` はチャネル固有の追加情報用に残してください。
- `message_sending`: チャネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用してください。
- `gateway_start`: 内部の `gateway:startup` フックに依存するのではなく、Gateway 所有の起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使用してください。
- `cron_changed`: Gateway 所有の Cron ライフサイクル変更を監視します。外部のウェイクスケジューラと同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw のままにしてください。

### API オブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                      |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                   |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                       |
| `api.source`             | `string`                  | Plugin のソースパス                                                                         |
| `api.rootDir`            | `string?`                 | Plugin のルートディレクトリ（任意）                                                         |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合は、アクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                        |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は、フルエントリ前の軽量な起動/セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートを基準にパスを解決                                                             |

## 内部モジュール規約

Plugin 内では、内部インポートにローカルのバレルファイルを使用します。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` 経由で自分の Plugin を
  インポートしないでください。内部インポートは `./api.ts` または
  `./runtime-api.ts` 経由にしてください。SDK パスは外部契約専用です。
</Warning>

ファサードでロードされるバンドル済み Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、OpenClaw がすでに実行中の場合、
アクティブなランタイム設定スナップショットを優先します。ランタイムスナップショットがまだ存在しない場合は、
ディスク上の解決済み設定ファイルにフォールバックします。パッケージ化されたバンドル済み Plugin のファサードは、OpenClaw の Plugin
ファサードローダーを通じてロードする必要があります。`dist/extensions/...` から直接インポートすると、
パッケージ化されたインストールが Plugin 所有コードに対して使用する manifest とランタイムサイドカーのチェックを迂回します。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合、Plugin ローカルの狭い契約バレルを公開できます。バンドル済みの例:

- **Anthropic**: Claude の beta-header と `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` シーム。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、
  デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、
  オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  Extension の本番コードでも `openclaw/plugin-sdk/<other-plugin>`
  インポートは避けるべきです。ヘルパーが本当に共有されるものなら、2 つの Plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  ケイパビリティ指向のサーフェスなど、中立的な SDK サブパスへ昇格してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="エントリポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` と `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="ランタイムヘルパー" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` 名前空間の完全なリファレンス。
  </Card>
  <Card title="セットアップと設定" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージング、manifest、設定スキーマ。
  </Card>
  <Card title="テスト" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティと lint ルール。
  </Card>
  <Card title="SDK 移行" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャとケイパビリティモデル。
  </Card>
</CardGroup>
