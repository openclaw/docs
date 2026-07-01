---
read_when:
    - どの SDK サブパスからインポートするかを知っておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-07-01T18:07:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付きコントラクトです。このページは、
**何を import するか** と **何を登録できるか** のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin
  作者向けです。Gateway 経由で agent を実行したい外部アプリ、スクリプト、
  ダッシュボード、CI ジョブ、IDE 拡張機能には、代わりに
  [外部アプリ向け Gateway 連携](/ja-JP/gateway/external-apps)を使用してください。
</Note>

<Tip>
代わりにハウツーガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins)から始め、channel Plugin には [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins)、provider Plugin には [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI backend には [CLI backend Plugin](/ja-JP/plugins/cli-backend-plugins)、tool または lifecycle hook Plugin には [Plugin hooks](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## import 規約

必ず特定のサブパスから import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が速く保たれ、
循環依存の問題を防げます。channel 固有の entry/build helper には、
`openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的な surface
や、`buildChannelConfigSchema` などの共有 helper には
`openclaw/plugin-sdk/core` を残してください。

channel config では、channel が所有する JSON Schema を
`openclaw.plugin.json#channelConfigs` 経由で公開してください。
`plugin-sdk/channel-config-schema` サブパスは、共有 schema primitive と汎用
builder 用です。OpenClaw の bundled Plugin は、保持されている bundled-channel
schema に `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の
互換 export は `plugin-sdk/channel-config-schema-legacy` に残っています。どちらの
bundled schema サブパスも、新しい Plugin のためのパターンではありません。

<Warning>
  provider または channel のブランド付き convenience seam（たとえば
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）を
  import しないでください。Bundled Plugin は、自身の `api.ts` /
  `runtime-api.ts` barrel 内で汎用 SDK サブパスを合成します。コア consumer は、
  それらの Plugin ローカル barrel を使用するか、必要性が本当に
  cross-channel である場合に限って、狭い汎用 SDK コントラクトを追加してください。

追跡済みの owner 使用がある場合、少数の bundled-plugin helper seam は、生成された
export map にまだ表示されます。これらは bundled-plugin のメンテナンス専用であり、
新しいサードパーティ Plugin に推奨される import path ではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、
追跡済みの owner 使用向けに、非推奨の互換 facade として保持されています。これらの
import path を新しい Plugin にコピーしないでください。代わりに、注入された runtime
helper と汎用 channel SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin entry、channel、provider、auth、runtime、
capability、memory、予約済み bundled-plugin helper）ごとにグループ化された、狭い
サブパスのセットとして公開されます。グループ化されリンクされた完全なカタログは、
[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

compiler entrypoint inventory は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。package export は、
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に一覧された
repo-local test/internal サブパスを差し引いた後の public subset から生成されます。
public export 数を監査するには `pnpm plugin-sdk:surface` を実行してください。
十分に古く、bundled extension の本番コードで使用されていない非推奨の public
サブパスは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。
広範な非推奨 re-export barrel は
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` callback は、次の method を持つ `OpenClawPluginApi` object を受け取ります。

### capability 登録

| method                                           | 登録するもの                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                   |
| `api.registerAgentHarness(...)`                  | 実験的な低レベル agent executor       |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論 backend             |
| `api.registerChannel(...)`                       | メッセージング channel                |
| `api.registerEmbeddingProvider(...)`             | 再利用可能な vector embedding provider |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミング realtime transcription |
| `api.registerRealtimeVoiceProvider(...)`         | duplex realtime voice session         |
| `api.registerMediaUnderstandingProvider(...)`    | image/audio/video analysis            |
| `api.registerImageGenerationProvider(...)`       | image generation                      |
| `api.registerMusicGenerationProvider(...)`       | music generation                      |
| `api.registerVideoGenerationProvider(...)`       | video generation                      |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider           |
| `api.registerWebSearchProvider(...)`             | Web search                            |

`api.registerEmbeddingProvider(...)` で登録された embedding provider は、
Plugin manifest の `contracts.embeddingProviders` にも listed されている必要があります。
これは、再利用可能な vector generation のための汎用 embedding surface です。memory
search は、この汎用 provider surface を利用できます。古い
`api.registerMemoryEmbeddingProvider(...)` と
`contracts.memoryEmbeddingProviders` seam は、既存の memory-specific provider が
移行している間の非推奨の互換性です。

runtime `batchEmbed(...)` をまだ公開している memory-specific provider は、その runtime
が明示的に `sourceWideBatchEmbed: true` を設定していない限り、既存の per-file batching
コントラクトに留まります。この opt-in により、memory host は、複数の dirty memory
file と有効な source からの chunk を、host の batch limit まで 1 回の `batchEmbed(...)`
call で送信できます。JSONL request file を upload する batch adapter は、request-count
cap だけでなく upload-size cap の前でも provider job を分割する必要があります。
provider は、`batch.chunks` と同じ順序で、input chunk ごとに 1 つの embedding を返す必要があります。
provider が file-local batch を想定している場合、またはより大きな source-wide job 全体で
input ordering を保持できない場合は、この flag を省略してください。

### tool と command

固定 tool 名の単純な tool-only Plugin には [`defineToolPlugin`](/ja-JP/plugins/tool-plugins) を
使用してください。mixed Plugin または完全に dynamic な tool 登録には、
`api.registerTool(...)` を直接使用してください。

| method                          | 登録するもの                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | agent tool（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | custom command（LLM をバイパス）              |

Plugin command は、agent が短い command-owned routing hint を必要とする場合に
`agentPromptGuidance` を設定できます。その text は command 自体に関するものに留めてください。
provider または Plugin 固有の policy を core prompt builder に追加しないでください。

guidance entry は、すべての prompt surface に適用される legacy string、または structured entry
にできます。

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

structured `surfaces` には、`openclaw_main`、`codex_app_server`、
`cli_backend`、`acp_backend`、または `subagent` を含められます。`pi_main` は
`openclaw_main` の非推奨 alias のままです。意図的にすべての surface に guidance
を適用する場合は、`surfaces` を省略してください。空の `surfaces` array は渡さないでください。
偶発的な scope loss が global prompt text にならないように reject されます。

native Codex app-server developer instruction は、他の prompt surface より厳格です。
`codex_app_server` に明示的に scope された guidance だけが、その高優先度 lane に昇格されます。
legacy string guidance と unscoped structured guidance は、互換性のために non-Codex prompt
surface で引き続き利用できます。

### infrastructure

| method                                         | 登録するもの                          |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | event hook                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                    |
| `api.registerGatewayDiscoveryService(service)` | local Gateway discovery advertiser    |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                        |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 配下の Node feature CLI |
| `api.registerService(service)`                 | background service                    |
| `api.registerInteractiveHandler(registration)` | interactive handler                   |
| `api.registerAgentToolResultMiddleware(...)`   | runtime tool-result middleware        |
| `api.registerMemoryPromptSupplement(builder)`  | additive memory-adjacent prompt section |
| `api.registerMemoryCorpusSupplement(adapter)`  | additive memory search/read corpus    |

### workflow Plugin 向け host hook

host hook は、provider、channel、または tool を追加するだけでなく、host lifecycle
に参加する必要がある Plugin のための SDK seam です。これらは汎用コントラクトです。
Plan Mode も使用できますが、approval workflow、workspace policy gate、background monitor、
setup ウィザード、UI companion Plugin も使用できます。

| メソッド                                                                             | それが所有するコントラクト                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin 所有の、Gateway セッションを通じて投影される JSON 互換セッション状態                                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションについて次のエージェントターンに注入される、永続的な厳密に 1 回のコンテキスト                                                            |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、マニフェストで制御された信頼済みプリ Plugin ツールポリシー                                             |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                                                                       |
| `api.registerCommand(...)`                                                           | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` または `suppressReply: true` を設定可能。Discord ネイティブコマンドは `descriptionLocalizations` をサポート |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、または設定サーフェス向けの Control UI コントリビューション記述子                                                               |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット、削除、リロード経路での Plugin 所有ランタイムリソースのクリーンアップコールバック                                                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                                                 |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルでクリアされる、実行ごとの Plugin スクラッチ状態                                                                                   |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 所有スケジューラージョブ用のクリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行わない                                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | アクティブな直接アウトバウンドセッションルートへの、バンドル専用のホスト仲介ファイル添付配信                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル専用の Cron ベースのスケジュール済みセッションターンと、タグベースのクリーンアップ                                                               |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway を通じてディスパッチできる型付きセッションアクション                                                                               |

新しい Plugin コードにはグループ化された名前空間を使用します。

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

同等のフラットなメソッドは、既存の plugins 向けの非推奨の互換エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または `api.unscheduleSessionTurnsByTag` を直接呼び出す新しい Plugin コードは追加しないでください。

`scheduleSessionTurn(...)` は、Gateway Cron スケジューラー上のセッションスコープの便利機能です。Cron はタイミングを所有し、ターンの実行時にバックグラウンドタスクレコードを作成します。Plugin SDK は対象セッション、Plugin 所有の命名、クリーンアップのみを制約します。作業自体に永続的な複数ステップの Task Flow 状態が必要な場合は、スケジュール済みターン内で `api.runtime.tasks.managedFlows` を使用してください。

これらのコントラクトは、権限を意図的に分割しています。

- 外部 plugins は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホストから信頼されます。バンドル済みポリシーが最初に実行されます。インストール済み Plugin ポリシーには明示的な有効化と `contracts.trustedToolPolicies` 内のローカル id が必要で、Plugin 読み込み順で次に実行されます。ポリシー id は登録元 Plugin にスコープされます。
- 予約済みコマンドの所有権はバンドル専用です。外部 plugins は独自のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` からのプロンプトフィールド、`enqueueNextTurnInjection` を含む、プロンプトを変更するフックを無効にします。

Plan 以外のコンシューマー例:

| Plugin アーキタイプ     | 使用されるフック                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー             | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                                               |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                             |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、Heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディング ウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有メソッドには Plugin 固有のプレフィックスを推奨します。
</Note>

<Accordion title="When to use tool-result middleware">
  バンドル済み plugins と、一致するマニフェストコントラクトで明示的に有効化されたインストール済み plugins は、実行後かつランタイムがその結果をモデルに戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼済みでランタイム中立の接合点です。

Plugins は対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。例: `["openclaw", "codex"]`。そのコントラクトがない、または明示的に有効化されていないインストール済み plugins は、このミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使ってください。古い埋め込みランナー専用の拡張ファクトリ登録経路は削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` により、Plugin は mDNS/Bonjour などのローカル検出トランスポート上でアクティブな Gateway をアドバタイズできます。OpenClaw はローカル検出が有効な場合に Gateway 起動中にサービスを呼び出し、現在の Gateway ポートと非シークレットの TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway 検出 plugins は、アドバタイズされた TXT 値をシークレットや認証として扱ってはいけません。検出はルーティングヒントです。Gateway 認証と TLS ピンニングが引き続き信頼を所有します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は 2 種類のコマンドメタデータを受け付けます。

- `commands`: レジストラーが所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ用の任意の親コマンドパス

ペアリング済みノード機能には、`api.registerNodeCliFeature(registrar, opts?)` を推奨します。これは `api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、`openclaw nodes canvas` のようなコマンドを明示的な Plugin 所有ノード機能にします。

Plugin コマンドを通常のルート CLI 経路で遅延読み込みのままにしたい場合は、そのレジストラーが公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を提供してください。

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

遅延ルート CLI 登録が不要な場合にのみ、`commands` を単独で使用してください。その積極的な互換経路は引き続きサポートされますが、解析時の遅延読み込み用に記述子ベースのプレースホルダーをインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` により、Plugin は `claude-cli` や `my-cli` などのローカル AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照でプロバイダープレフィックスになります。
- バックエンドの `config` は `agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、
  プラグインのデフォルトに `agents.defaults.cliBackends.<id>` をマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合
  （たとえば古いフラグ形状の正規化）には、`normalizeConfig` を使います。
- OpenClaw の thinking レベルをネイティブの effort フラグへマッピングするなど、
  CLI 方言に属するリクエスト単位の argv 書き換えには `resolveExecutionArgs` を使います。
  このフックは `ctx.executionMode` を受け取ります。一時的な `/btw` 呼び出しに
  バックエンドネイティブの分離フラグを追加するには `"side-question"` を使います。
  それらのフラグが、通常は常時有効の CLI でネイティブツールを確実に無効化する場合は、
  `sideQuestionToolMode: "disabled"` も宣言します。

エンドツーエンドの作成ガイドについては、
[CLI バックエンドプラグイン](/ja-JP/plugins/cli-backend-plugins)を参照してください。

### 排他的スロット

| Method                                     | 登録するもの                                                                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つが有効）。ホストがモデル/プロバイダー/モード診断を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い strict エンジンはそのキーなしで再試行されます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                               |

### 非推奨のメモリ埋め込みアダプター

| Method                                         | 登録するもの                                      |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 有効なプラグイン用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は推奨される排他的メモリプラグイン API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できます。
  これにより、コンパニオンプラグインは特定のメモリプラグインの非公開レイアウトへ
  直接到達する代わりに、`openclaw/plugin-sdk/memory-host-core` を通じて
  エクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリプラグイン API です。
- `MemoryFlushPlan.model` は、有効なフォールバックチェーンを継承せずに、
  フラッシュターンを `ollama/qwen3:8b` のような正確な `provider/model`
  参照へ固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーは
  `api.registerEmbeddingProvider(...)` と `contracts.embeddingProviders` を
  使うべきです。
- 既存のメモリ固有プロバイダーは移行期間中も動作し続けますが、
  プラグイン検査では、バンドルされていないプラグインに対する互換性負債として報告されます。

### イベントとライフサイクル

| Method                                       | 行うこと                         |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック       |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック   |

例、一般的なフック名、ガードセマンティクスについては、
[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

### フック判定セマンティクス

`before_install` はプラグインランタイムのライフサイクルフックであり、オペレーターのインストール
ポリシー面ではありません。許可/ブロックの判定が CLI と Gateway バックのインストールまたは更新パスを
カバーする必要がある場合は、`security.installPolicy` を使います。

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、判定なし（`block` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、判定なし（`block` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを主張すると、低優先度のハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーが設定すると、低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、判定なし（`cancel` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使います。`metadata` はチャンネル固有の追加情報用に残します。
- `message_sending`: チャンネル固有の `metadata` へフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使います。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を使います。
- `cron_changed`: Gateway が所有する Cron ライフサイクルの変更を監視します。外部のウェイクスケジューラーを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使い、期限チェックと実行の信頼できる情報源として OpenClaw を維持します。

### API オブジェクトフィールド

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                      |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                   |
| `api.description`        | `string?`                 | Plugin 説明（任意）                                                                         |
| `api.source`             | `string`                  | Plugin ソースパス                                                                           |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                           |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合は有効なインメモリランタイムスナップショット）   |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                        |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は軽量な完全エントリ前の起動/セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                           |

## 内部モジュール規約

プラグイン内では、内部インポートにローカルのバレルファイルを使います。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから自分自身のプラグインを `openclaw/plugin-sdk/<your-plugin>`
  経由でインポートしないでください。内部インポートは `./api.ts` または
  `./runtime-api.ts` 経由にしてください。SDK パスは外部契約専用です。
</Warning>

Facade で読み込まれるバンドル済みプラグインの公開面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、有効なランタイム設定スナップショットを優先します。
ランタイムスナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルへ
フォールバックします。パッケージ化されたバンドル済みプラグインの Facade は、
OpenClaw のプラグイン Facade ローダーを通じて読み込むべきです。
`dist/extensions/...` からの直接インポートは、パッケージ化インストールが
プラグイン所有コードに対して使うマニフェストとランタイムサイドカーチェックを迂回します。

プロバイダープラグインは、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合、狭いプラグインローカルの契約バレルを公開できます。バンドル済みの例:

- **Anthropic**: Claude beta-header と `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  拡張の本番コードも `openclaw/plugin-sdk/<other-plugin>` のインポートを避けるべきです。
  ヘルパーが本当に共有される場合は、2 つのプラグインを結合する代わりに、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  機能指向の面など、中立的な SDK サブパスへ昇格させてください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` と `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    完全な `api.runtime` 名前空間リファレンス。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージング、マニフェスト、設定スキーマ。
  </Card>
  <Card title="Testing" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティと lint ルール。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨の面からの移行。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
