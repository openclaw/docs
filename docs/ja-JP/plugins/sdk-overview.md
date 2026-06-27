---
read_when:
    - どの SDK サブパスからインポートするかを知っておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを調べている
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録APIリファレンス、SDKアーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-06-27T12:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は Plugin とコアの間の型付き契約です。このページは、**何をインポートするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能には、代わりに
  [外部アプリ向け Gateway 連携](/ja-JP/gateway/external-apps)を使用してください。
</Note>

<Tip>
手順ガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins)から始め、チャネル Plugin には [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、プロバイダー Plugin には [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには [CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)、ツールまたはライフサイクルフック Plugin には [Plugin フック](/ja-JP/plugins/hooks)を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは小さく自己完結したモジュールです。これにより起動が速く保たれ、循環依存の問題を防げます。チャネル固有のエントリやビルドヘルパーには、`openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的な面と `buildChannelConfigSchema` などの共有ヘルパーには、`openclaw/plugin-sdk/core` を使い続けてください。

チャネル設定では、チャネルが所有する JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開します。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw のバンドル Plugin は、保持されているバンドルチャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換エクスポートは `plugin-sdk/channel-config-schema-legacy` に残っています。どちらのバンドルスキーマサブパスも、新しい Plugin のパターンではありません。

<Warning>
  プロバイダー名またはチャネル名付きの便利な境界（例:
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。
  バンドル Plugin は、自身の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせます。コアの利用側は、それらの Plugin ローカルなバレルを使うか、必要性が本当にクロスチャネルである場合に狭い汎用 SDK 契約を追加してください。

追跡済みの所有者利用がある場合、少数のバンドル Plugin ヘルパー境界が生成されたエクスポートマップにまだ現れます。これらはバンドル Plugin の保守専用であり、新しいサードパーティ Plugin に推奨されるインポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡済みの所有者利用向けに非推奨の互換ファサードとして保持されています。これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みバンドル Plugin ヘルパー）ごとにまとめられた狭いサブパスのセットとして公開されます。グループ化されリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

コンパイラーのエントリポイント一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト/内部サブパスを差し引いた後の公開サブセットから生成されます。公開エクスポート数を監査するには、`pnpm plugin-sdk:surface` を実行します。十分に古く、バンドル拡張の本番コードで未使用の非推奨公開サブパスは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。広範な非推奨再エクスポートバレルは `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                         | 登録するもの                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論 (LLM)                   |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器   |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド         |
| `api.registerChannel(...)`                       | メッセージングチャネル                |
| `api.registerEmbeddingProvider(...)`             | 再利用可能なベクトル埋め込みプロバイダー |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成           |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし  |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション      |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析                    |
| `api.registerImageGenerationProvider(...)`       | 画像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                              |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                              |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイププロバイダー     |
| `api.registerWebSearchProvider(...)`             | Web 検索                              |

`api.registerEmbeddingProvider(...)` で登録された埋め込みプロバイダーは、Plugin マニフェスト内の `contracts.embeddingProviders` にも列挙する必要があります。これは、再利用可能なベクトル生成のための汎用埋め込み面です。メモリ検索は、この汎用プロバイダー面を利用できます。既存のメモリ固有プロバイダーが移行する間、古い `api.registerMemoryEmbeddingProvider(...)` と `contracts.memoryEmbeddingProviders` 境界は非推奨の互換性として扱われます。

ランタイム `batchEmbed(...)` をまだ公開しているメモリ固有プロバイダーは、そのランタイムが明示的に `sourceWideBatchEmbed: true` を設定しない限り、既存のファイル単位バッチング契約のままです。このオプトインにより、メモリホストは複数の変更済みメモリファイルと有効なソースからのチャンクを、ホストのバッチ上限まで 1 回の `batchEmbed(...)` 呼び出しで送信できます。JSONL リクエストファイルをアップロードするバッチアダプターは、リクエスト数上限だけでなくアップロードサイズ上限の前にもプロバイダージョブを分割する必要があります。プロバイダーは、`batch.chunks` と同じ順序で入力チャンクごとに 1 つの埋め込みを返す必要があります。プロバイダーがファイルローカルなバッチを期待している場合、またはより大きなソース全体ジョブで入力順序を保持できない場合は、このフラグを省略してください。

### ツールとコマンド

固定ツール名を持つ単純なツール専用 Plugin には [`defineToolPlugin`](/ja-JP/plugins/tool-plugins) を使用します。混在 Plugin または完全に動的なツール登録には、`api.registerTool(...)` を直接使用します。

| メソッド                       | 登録するもの                                  |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）            |

Plugin コマンドは、エージェントが短いコマンド所有のルーティングヒントを必要とする場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体についての内容に限定してください。プロバイダー固有または Plugin 固有のポリシーをコアのプロンプトビルダーに追加しないでください。

ガイダンスエントリは、すべてのプロンプト面に適用されるレガシー文字列、または構造化エントリにできます。

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

構造化された `surfaces` には、`openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend`、または `subagent` を含められます。`pi_main` は `openclaw_main` の非推奨エイリアスとして残っています。意図的に全ての面へガイダンスを適用する場合は、`surfaces` を省略します。空の `surfaces` 配列を渡さないでください。誤ったスコープ喪失がグローバルなプロンプトテキストにならないよう、拒否されます。

ネイティブ Codex アプリサーバーの開発者向け指示は、他のプロンプト面より厳格です。`codex_app_server` に明示的にスコープされたガイダンスだけが、その高優先度レーンに昇格されます。互換性のため、レガシー文字列ガイダンスとスコープなしの構造化ガイダンスは、非 Codex プロンプト面で引き続き利用できます。

### インフラストラクチャ

| メソッド                                       | 登録するもの                          |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                        |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント           |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                  |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway 検出アドバタイザー   |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                      |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 配下の Node 機能 CLI |
| `api.registerService(service)`                 | バックグラウンドサービス              |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー            |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムツール結果ミドルウェア      |
| `api.registerMemoryPromptSupplement(builder)`  | 追加型のメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加型のメモリ検索/読み取りコーパス   |

### ワークフロー Plugin 向けホストフック

ホストフックは、プロバイダー、チャネル、またはツールを追加するだけでなく、ホストのライフサイクルに参加する必要がある Plugin のための SDK 境界です。これらは汎用契約です。Plan Mode でも使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI 連携 Plugin でも使用できます。

| メソッド                                                                               | 所有する契約                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin 所有の、Gateway セッションを通じて投影される JSON 互換のセッション状態                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションの次のエージェントターンに注入される、永続的で厳密に一度だけのコンテキスト                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメータをブロックまたは書き換えられる、マニフェストで制御された信頼済みのプリプラグインツールポリシー                                               |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                            |
| `api.registerCommand(...)`                                                           | スコープ付きプラグインコマンド。コマンド結果は `continueAgent: true` を設定可能。Discord ネイティブコマンドは `descriptionLocalizations` をサポート |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、または設定サーフェス向けの Control UI コントリビューション記述子                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット/削除/再読み込みパスでの、Plugin 所有ランタイムリソースのクリーンアップコールバック                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルでクリアされる実行ごとのプラグインスクラッチ状態                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 所有スケジューラージョブのクリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行わない                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | アクティブな直接アウトバウンドセッションルートへの、バンドル専用のホスト仲介ファイル添付配信                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル専用の Cron バックのスケジュール済みセッションターンとタグベースのクリーンアップ                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway 経由でディスパッチできる型付きセッションアクション                                                                    |

新しいプラグインコードにはグループ化された名前空間を使用します。

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

同等のフラットなメソッドは、既存プラグイン向けの非推奨の互換性
エイリアスとして引き続き利用できます。`api.registerSessionExtension`、
`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、
`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、
`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、
`api.registerSessionSchedulerJob`、`api.registerSessionAction`、
`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または
`api.unscheduleSessionTurnsByTag` を直接呼び出す新しいプラグインコードを追加しないでください。

`scheduleSessionTurn(...)` は Gateway の Cron スケジューラー上にある
セッションスコープの便利機能です。Cron はタイミングを所有し、ターンが実行されると
バックグラウンドタスクレコードを作成します。Plugin SDK は対象セッション、
Plugin 所有の命名、クリーンアップだけを制約します。作業自体に永続的な
複数ステップの Task Flow 状態が必要な場合は、スケジュール済みターン内で
`api.runtime.tasks.managedFlows` を使用してください。

契約は意図的に権限を分割しています。

- 外部プラグインは、セッション拡張、UI 記述子、コマンド、ツール
  メタデータ、次ターン注入、通常フックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックの前に実行され、
  ホストに信頼されます。バンドルポリシーが最初に実行されます。インストール済みプラグインのポリシーには、
  明示的な有効化と `contracts.trustedToolPolicies` 内のローカル ID が必要で、
  その後にプラグイン読み込み順で実行されます。ポリシー ID は登録元プラグインにスコープされます。
- 予約済みコマンドの所有権はバンドル専用です。外部プラグインは独自の
  コマンド名またはエイリアスを使用するべきです。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、
  `heartbeat_prompt_contribution`、レガシー `before_agent_start` からの
  プロンプトフィールド、`enqueueNextTurnInjection` など、プロンプトを変更するフックを無効化します。

Plan 以外のコンシューマーの例:

| Plugin アーキタイプ             | 使用するフック                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー            | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                            |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                                 |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード   | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みのコア管理名前空間 (`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`) は、プラグインがより狭い Gateway メソッドスコープを割り当てようとしても、
  常に `operator.admin` のままです。Plugin 所有メソッドには
  プラグイン固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使うタイミング">
  バンドルプラグインと、対応するマニフェスト契約を持つ明示的に有効化された
  インストール済みプラグインは、実行後かつランタイムがその結果をモデルへ戻す前に
  ツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。
  これは tokenjuice のような非同期出力リデューサー向けの、信頼済みでランタイム中立な
  接合点です。

プラグインは対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。
たとえば `["openclaw", "codex"]` です。その契約がない、または明示的に有効化されていない
インストール済みプラグインは、このミドルウェアを登録できません。モデル前のツール結果
タイミングが不要な作業には、通常の OpenClaw プラグインフックを使い続けてください。古い
埋め込みランナー専用の拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` により、プラグインは mDNS/Bonjour などの
ローカル検出トランスポートでアクティブな Gateway を広告できます。OpenClaw は
ローカル検出が有効な場合に Gateway 起動中にサービスを呼び出し、現在の
Gateway ポートとシークレットではない TXT ヒントデータを渡し、Gateway シャットダウン中に
返された `stop` ハンドラーを呼び出します。

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

Gateway 検出プラグインは、広告された TXT 値をシークレットや認証として扱ってはいけません。
検出はルーティングヒントです。Gateway 認証と TLS ピン留めが引き続き
信頼を所有します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は 2 種類のコマンドメタデータを受け付けます。

- `commands`: 登録者が所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延プラグイン CLI 登録に使用される
  解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ向けの任意の親コマンドパス

ペアリング済みノード機能には
`api.registerNodeCliFeature(registrar, opts?)` を優先してください。これは
`api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、
`openclaw nodes canvas` のようなコマンドを、Plugin 所有のノード機能として明示します。

通常のルート CLI パスでプラグインコマンドを遅延読み込みのままにしたい場合は、
その登録者が公開するすべてのトップレベルコマンドルートをカバーする
`descriptors` を提供してください。

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

遅延ルート CLI 登録が不要な場合にのみ、`commands` を単独で使用してください。
その積極的な互換性パスは引き続きサポートされますが、解析時の遅延読み込み向けに
記述子バックのプレースホルダーはインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` により、プラグインは `claude-cli` や `my-cli` などの
ローカル AI CLI バックエンド向けデフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照内のプロバイダープレフィックスになります。
- バックエンドの `config` は `agents.defaults.cliBackends.<id>` と同じ形を使用します。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、
  `agents.defaults.cliBackends.<id>` をプラグインデフォルトに重ねてマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は
  `normalizeConfig` を使用します（たとえば古いフラグ形状の正規化）。
- CLI 方言に属するリクエストスコープの argv 書き換えには `resolveExecutionArgs` を使用します。
  たとえば OpenClaw の thinking レベルをネイティブの effort フラグにマッピングする場合です。
  フックは `ctx.executionMode` を受け取ります。一時的な `/btw` 呼び出しに
  バックエンドネイティブの分離フラグを追加するには `"side-question"` を使用します。それらのフラグが
  通常は常時オンの CLI でネイティブツールを確実に無効化する場合は、
  `sideQuestionToolMode: "disabled"` も宣言してください。

エンドツーエンドの作成ガイドについては、
[CLI バックエンドプラグイン](/ja-JP/plugins/cli-backend-plugins) を参照してください。

### 排他的スロット

| メソッド                                   | 登録するもの                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つがアクティブ）。ホストがモデル/プロバイダー/モード診断を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い strict エンジンは、そのキーなしで再試行されます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                                   |

### 非推奨のメモリ埋め込みアダプター

| メソッド                                       | 登録するもの                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は、排他的なメモリ Plugin API として推奨されます。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できます。
  これにより、コンパニオン Plugin は特定のメモリ Plugin のプライベートなレイアウトに踏み込まずに、
  `openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的なメモリ Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバックチェーンを継承せずに、
  `ollama/qwen3:8b` などの正確な `provider/model`
  参照へフラッシュターンを固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーは
  `api.registerEmbeddingProvider(...)` と
  `contracts.embeddingProviders` を使用してください。
- 既存のメモリ固有プロバイダーは移行期間中も動作しますが、Plugin 検査では、
  非バンドル Plugin に対する互換性負債として報告されます。

### イベントとライフサイクル

| メソッド                                     | 実行すること                 |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック   |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、およびガードのセマンティクスについては
[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

### フック判定セマンティクス

`before_install` は Plugin ランタイムのライフサイクルフックであり、オペレーターのインストールポリシー面ではありません。
許可/ブロックの判定が CLI と Gateway バックのインストールまたは更新パスを対象にする必要がある場合は、
`security.installPolicy` を使用してください。

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、上書きではなく判定なし（`block` を省略した場合と同じ）として扱われます。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、上書きではなく判定なし（`block` を省略した場合と同じ）として扱われます。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを引き受けると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、上書きではなく判定なし（`cancel` を省略した場合と同じ）として扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用します。`metadata` はチャネル固有の追加情報用に保持します。
- `message_sending`: チャネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用します。
- `gateway_start`: 内部の `gateway:startup` フックに依存するのではなく、Gateway 所有の起動状態には `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を使用します。
- `cron_changed`: Gateway 所有の Cron ライフサイクル変更を監視します。外部のウェイクスケジューラーを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw にします。

### API オブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                    |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                    |
| `api.description`        | `string?`                 | Plugin 説明（任意）                                                                          |
| `api.source`             | `string`                  | Plugin ソースパス                                                                            |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                            |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                         |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は軽量の完全エントリ前の起動/セットアップ期間です       |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                            |

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
  本番コードから `openclaw/plugin-sdk/<your-plugin>` を通じて自分の Plugin をインポートしないでください。
  内部インポートは `./api.ts` または
  `./runtime-api.ts` を通じてルーティングします。SDK パスは外部契約専用です。
</Warning>

ファサードでロードされるバンドル Plugin の公開面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および類似の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。
ランタイムスナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化されたバンドル Plugin のファサードは、OpenClaw の Plugin
ファサードローダーを通じてロードする必要があります。`dist/extensions/...` からの直接インポートは、
パッケージ化インストールが Plugin 所有コードに使用する manifest とランタイム sidecar チェックを迂回します。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合、狭い Plugin ローカル契約バレルを公開できます。バンドル例:

- **Anthropic**: Claude の beta-header と `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、およびリアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  Extension の本番コードでも `openclaw/plugin-sdk/<other-plugin>`
  インポートは避けるべきです。ヘルパーが本当に共有される場合は、2 つの Plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の機能指向の面など、
  中立的な SDK サブパスへ昇格させてください。
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
    パッケージ化、manifest、および設定スキーマ。
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
