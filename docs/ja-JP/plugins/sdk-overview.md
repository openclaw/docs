---
read_when:
    - どの SDK サブパスからインポートするかを知っておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録APIリファレンス、SDKアーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-07-05T11:40:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00c9ba90e5bef8a08da3a32ee7178c59da7b494d856b22c70a786e2ae735d6f8
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付き契約です。このページは、**何を import するか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。Gateway を通じてエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能には、代わりに
  [外部アプリ向け Gateway 統合](/ja-JP/gateway/external-apps)を使用してください。
</Note>

<Tip>
ハウツーガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins)から始めてください。チャネルには [Channel plugins](/ja-JP/plugins/sdk-channel-plugins)、モデルプロバイダーには [Provider plugins](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには [CLI backend plugins](/ja-JP/plugins/cli-backend-plugins)、ネイティブエージェント実行環境には [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)、ツールまたはライフサイクルフックには [Plugin hooks](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## import 規約

常に特定のサブパスから import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャネル固有のエントリ/ビルドヘルパーには、`openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的なサーフェスや `buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を残してください。

チャネル設定では、チャネルが所有する JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開してください。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw のバンドル Plugin は、保持されているバンドルチャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性 export は `plugin-sdk/channel-config-schema-legacy` に残っています。どちらのバンドルスキーマサブパスも、新しい Plugin のパターンではありません。

<Warning>
  プロバイダーまたはチャネルのブランド付き convenience seam（例:
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）を import しないでください。
  バンドル Plugin は、自身の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせます。コア利用側は、それらの Plugin ローカルなバレルを使用するか、必要性が本当にクロスチャネルである場合に限り、狭い汎用 SDK 契約を追加してください。

所有者による使用が追跡されている場合、少数のバンドル Plugin ヘルパー seam は生成された export map にまだ表示されます。これらはバンドル Plugin のメンテナンス専用であり、新しいサードパーティ Plugin の推奨 import パスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡されている所有者使用のために非推奨の互換性 facade として保持されています。これらの import パスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みのバンドル Plugin ヘルパー）ごとにグループ化された、狭いサブパスの集合として公開されています。グループ化されリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

コンパイラーのエントリポイント一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。package exports は、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト/内部サブパスを差し引いた後の公開サブセットから生成されます。公開 export 数を監査するには、`pnpm plugin-sdk:surface` を実行してください。十分に古く、バンドル拡張の本番コードで未使用の非推奨公開サブパスは、`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されています。広範な非推奨 re-export バレルは、`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されています。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                           | 登録するもの                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                                                              |
| `api.registerModelCatalogProvider(...)`          | テキストおよびメディア生成用のモデルカタログ行                                  |
| `api.registerAgentHarness(...)`                  | [実験的](/ja-JP/plugins/sdk-agent-harness) ネイティブエージェント実行環境（Codex、Copilot） |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド                                                       |
| `api.registerChannel(...)`                       | メッセージングチャネル                                                                 |
| `api.registerEmbeddingProvider(...)`             | 再利用可能なベクトル埋め込みプロバイダー                                                |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成                                                    |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし                                                  |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析                                                        |
| `api.registerTranscriptSourceProvider(...)`      | ライブまたはインポートされた会議文字起こしソース                                        |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                                                  |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                                                  |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                                                  |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape プロバイダー                                                       |
| `api.registerWebSearchProvider(...)`             | Web 検索                                                                        |
| `api.registerCompactionProvider(...)`            | 差し替え可能な文字起こし Compaction バックエンド                                           |

`api.registerEmbeddingProvider(...)` で登録された埋め込みプロバイダーは、Plugin マニフェスト内の `contracts.embeddingProviders` にも列挙する必要があります。これは、再利用可能なベクトル生成のための汎用埋め込みサーフェスです。メモリ検索は、この汎用プロバイダーサーフェスを利用できます。古い `api.registerMemoryEmbeddingProvider(...)` と `contracts.memoryEmbeddingProviders` seam は、既存のメモリ固有プロバイダーが移行する間の非推奨互換性です。

ランタイム `batchEmbed(...)` をまだ公開しているメモリ固有プロバイダーは、そのランタイムが明示的に `sourceWideBatchEmbed: true` を設定しない限り、既存のファイル単位バッチング契約に留まります。この opt-in により、メモリホストは複数の dirty メモリファイルと有効化されたソースからのチャンクを、ホストのバッチ制限まで 1 回の `batchEmbed(...)` 呼び出しで送信できます。JSONL リクエストファイルをアップロードするバッチアダプターは、リクエスト数の上限だけでなく、アップロードサイズの上限に達する前にもプロバイダージョブを分割する必要があります。プロバイダーは、`batch.chunks` と同じ順序で、入力チャンクごとに 1 つの埋め込みを返す必要があります。プロバイダーがファイルローカルなバッチを期待する場合、またはより大きなソース横断ジョブで入力順序を保持できない場合は、このフラグを省略してください。

### ツールとコマンド

固定ツール名を持つシンプルなツール専用 Plugin には [`defineToolPlugin`](/ja-JP/plugins/tool-plugins) を使用してください。混在 Plugin または完全に動的なツール登録には、`api.registerTool(...)` を直接使用してください。

| メソッド                          | 登録するもの                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）             |

Plugin コマンドは、エージェントが短い、コマンド所有のルーティングヒントを必要とする場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体に関するものに留めてください。プロバイダーまたは Plugin 固有のポリシーをコアプロンプトビルダーに追加しないでください。

ガイダンスエントリは、すべてのプロンプトサーフェスに適用される従来の文字列、または構造化エントリにできます。

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

構造化された `surfaces` には、`openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend`、または `subagent` を含めることができます。`pi_main` は `openclaw_main` の非推奨エイリアスとして残っています。意図的な全サーフェス向けガイダンスでは `surfaces` を省略してください。空の `surfaces` 配列を渡さないでください。偶発的なスコープ喪失がグローバルプロンプトテキストにならないよう拒否されます。

ネイティブ Codex app-server の開発者向け指示は、他のプロンプトサーフェスよりも厳格です。`codex_app_server` に明示的にスコープされたガイダンスだけが、その高優先度レーンに昇格されます。従来の文字列ガイダンスとスコープなしの構造化ガイダンスは、互換性のために Codex 以外のプロンプトサーフェスでは引き続き利用できます。

### インフラストラクチャ

| メソッド                                          | 登録するもの                                            |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | イベントフック                                                   |
| `api.registerHttpRoute(params)`                 | Gateway HTTP エンドポイント                                        |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC メソッド                                           |
| `api.registerGatewayDiscoveryService(service)`  | ローカル Gateway 検出アドバタイザー                           |
| `api.registerCli(registrar, opts?)`             | CLI サブコマンド                                               |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 配下の Node 機能 CLI                      |
| `api.registerService(service)`                  | バックグラウンドサービス                                           |
| `api.registerInteractiveHandler(registration)`  | インタラクティブハンドラー                                          |
| `api.registerAgentToolResultMiddleware(...)`    | ランタイムツール結果ミドルウェア                               |
| `api.registerMemoryPromptSupplement(builder)`   | 追加のメモリ隣接プロンプトセクション                      |
| `api.registerMemoryCorpusSupplement(adapter)`   | 追加のメモリ検索/読み取りコーパス                           |
| `api.registerHostedMediaResolver(resolver)`     | ブラウザー形式のホストメディア URL 用 resolver                 |
| `api.registerTextTransforms(transforms)`        | Plugin 所有のプロンプト/メッセージ互換性テキスト書き換え      |
| `api.registerConfigMigration(migrate)`          | Plugin ランタイム読み込み前に実行される軽量な設定移行 |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` のインポーター                              |
| `api.registerAutoEnableProbe(probe)`            | この Plugin を自動有効化できる設定プローブ                |
| `api.registerReload(registration)`              | リロード処理のための restart/hot/noop 設定プレフィックスポリシー    |
| `api.registerNodeHostCommand(command)`          | ペアリングされたノードに公開されるコマンドハンドラー                      |
| `api.registerNodeInvokePolicy(policy)`          | ノードから呼び出されるコマンドの allowlist/approval ポリシー          |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` の findings コレクター             |

### ワークフロー Plugin 用ホストフック

ホストフックは、プロバイダー、チャンネル、またはツールを追加するだけでなく、ホストのライフサイクルに参加する必要がある Plugin 向けの SDK 継ぎ目です。これは汎用コントラクトです。計画モードでも使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI 連携 Plugin でも使用できます。

| メソッド                                                                             | 所有するコントラクト                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin が所有し、JSON 互換のセッション状態を Gateway セッション経由で投影します                                                                            |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションについて、次のエージェントターンに注入される耐久的な厳密に 1 回のコンテキスト                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、マニフェストで制御された信頼済みプリ Plugin ツールポリシー                                              |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更せずに表示するツールカタログメタデータ                                                                                                     |
| `api.registerCommand(...)`                                                           | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` または `suppressReply: true` を設定できます。Discord ネイティブコマンドは `descriptionLocalizations` をサポートします |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、または設定サーフェス向けの Control UI コントリビューション記述子                                                                 |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット、削除、リロードパスでの Plugin 所有ランタイムリソースのクリーンアップコールバック                                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態とモニター向けのサニタイズ済みイベント購読                                                                                                |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルでクリアされる、実行ごとの Plugin スクラッチ状態                                                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 所有スケジューラージョブのクリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行いません                                           |
| `api.session.workflow.sendSessionAttachment(...)`                                    | アクティブな直接アウトバウンドセッションルートへの、バンドル限定のホスト仲介ファイル添付配信                                                               |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル限定の Cron ベースのスケジュール済みセッションターンとタグベースのクリーンアップ                                                                  |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway 経由でディスパッチできる型付きセッションアクション                                                                                  |

新しい Plugin コードでは、グループ化された名前空間を使用してください。

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

同等のフラットなメソッドは、既存 Plugin 向けの非推奨互換エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または `api.unscheduleSessionTurnsByTag` を直接呼び出す新しい Plugin コードを追加しないでください。

`scheduleSessionTurn(...)` は、Gateway の Cron スケジューラー上にあるセッションスコープの便利機能です。Cron はタイミングを所有し、ターンの実行時にバックグラウンドタスクレコードを作成します。Plugin SDK は、ターゲットセッション、Plugin 所有の命名、クリーンアップだけを制約します。作業自体に耐久的な複数ステップのタスクフロー状態が必要な場合は、スケジュール済みターン内で `api.runtime.tasks.managedFlows` を使用してください。

これらのコントラクトは、権限を意図的に分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホスト信頼済みです。バンドル済みポリシーが先に実行されます。インストール済み Plugin ポリシーには明示的な有効化と `contracts.trustedToolPolicies` 内のローカル ID が必要で、Plugin のロード順でその後に実行されます。ポリシー ID は登録元 Plugin にスコープされます。
- 予約済みコマンドの所有権はバンドル限定です。外部 Plugin は独自のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` のプロンプトフィールド、`enqueueNextTurnInjection` など、プロンプトを変更するフックを無効にします。

計画以外の利用例:

| Plugin の類型              | 使用するフック                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー           | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                                                 |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                               |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベント購読、セッションスケジューラー所有権/クリーンアップ、Heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                                |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有メソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使うタイミング">
  バンドル済み Plugin と、対応するマニフェストコントラクトで明示的に有効化されたインストール済み Plugin は、実行後かつランタイムがその結果をモデルに戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼済みかつランタイム中立の継ぎ目です。

Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば `["openclaw", "codex"]` です。そのコントラクトがない、または明示的に有効化されていないインストール済み Plugin は、このミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使用してください。古い埋め込みランナー専用の拡張ファクトリー登録パスは削除されました。
</Accordion>

### Gateway ディスカバリー登録

`api.registerGatewayDiscoveryService(...)` を使うと、Plugin は mDNS/Bonjour などのローカルディスカバリートランスポート上でアクティブな Gateway を広告できます。ローカルディスカバリーが有効な場合、OpenClaw は Gateway 起動中にサービスを呼び出し、現在の Gateway ポートと秘密でない TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway ディスカバリー Plugin は、広告された TXT 値を秘密情報や認証として扱ってはいけません。ディスカバリーはルーティングのヒントです。信頼は引き続き Gateway 認証と TLS ピン留めが所有します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は 2 種類のコマンドメタデータを受け付けます。

- `commands`: 登録者が所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ向けの任意の親コマンドパス

ペアードノード機能では、`api.registerNodeCliFeature(registrar, opts?)` を優先してください。これは `api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、`openclaw nodes canvas` のようなコマンドを明示的な Plugin 所有ノード機能にします。

通常のルート CLI パスで Plugin コマンドを遅延ロードのままにしたい場合は、その登録者が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定してください。

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

遅延ルート CLI 登録が不要な場合にのみ、`commands` を単独で使用してください。その即時互換パスは引き続きサポートされますが、解析時の遅延ロード用に記述子ベースのプレースホルダーはインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` を使うと、Plugin は `claude-cli` や `my-cli` などのローカル AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照でプロバイダープレフィックスになります。
- バックエンドの `config` は `agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー設定は引き続き優先されます。OpenClaw は CLI を実行する前に、Plugin のデフォルトの上に
  `agents.defaults.cliBackends.<id>` をマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig` を使います
  （たとえば古いフラグ形状の正規化）。
- OpenClaw の思考レベルをネイティブの effort フラグにマッピングするなど、
  CLI 方言に属するリクエストスコープの argv 書き換えには `resolveExecutionArgs` を使います。
  このフックは `ctx.executionMode` を受け取ります。一時的な `/btw` 呼び出しに
  バックエンドネイティブの分離フラグを追加するには `"side-question"` を使います。それらのフラグが、
  本来は常時有効の CLI でネイティブツールを確実に無効化する場合は、
  `sideQuestionToolMode: "disabled"` も宣言します。

エンドツーエンドの作成ガイドについては、
[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を参照してください。

### 排他スロット

| メソッド                                   | 登録するもの                                                                                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つがアクティブ）。ホストがモデル/プロバイダー/モード診断を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い strict エンジンはそのキーなしで再試行されます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                         |

### 非推奨のメモリ埋め込みアダプター

| メソッド                                       | 登録するもの                                   |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin のメモリ埋め込みアダプター |

- `registerMemoryCapability` は推奨される排他的なメモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できます。
  これにより、コンパニオン Plugin は特定のメモリ Plugin のプライベートなレイアウトに入り込む代わりに、
  `openclaw/plugin-sdk/memory-host-core` 経由でエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的なメモリ Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバックチェーンを継承せずに、
  `ollama/qwen3:8b` のような正確な `provider/model` 参照へフラッシュターンを固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーは
  `api.registerEmbeddingProvider(...)` と
  `contracts.embeddingProviders` を使うべきです。
- 既存のメモリ固有プロバイダーは移行期間中も動作し続けますが、
  Plugin 検査では、バンドルされていない Plugin に対してこれを互換性の負債として報告します。

### イベントとライフサイクル

| メソッド                                     | 役割                         |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック   |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

### フック決定セマンティクス

`before_install` は Plugin ランタイムのライフサイクルフックであり、オペレーターのインストールポリシー面ではありません。
許可/ブロックの決定が CLI と Gateway バックのインストールまたは更新パスを対象にする必要がある場合は、`security.installPolicy` を使います。

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、決定なし（`block` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、決定なし（`block` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを要求すると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、決定なし（`cancel` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの `threadId` フィールドを使います。チャンネル固有の追加情報には `metadata` を保持します。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使います。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を使います。
- `cron_changed`: Gateway が所有する Cron ライフサイクル変更を監視します。外部のウェイクスケジューラーを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使い、期限チェックと実行については OpenClaw を信頼できる情報源として維持します。

### API オブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                    |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                    |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                        |
| `api.source`             | `string`                  | Plugin ソースパス                                                                            |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                            |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                         |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は軽量な完全エントリ前の起動/セットアップウィンドウ  |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                            |

## 内部モジュール規約

Plugin 内では、内部インポートにローカル barrel ファイルを使います。

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` 経由で自分の Plugin をインポートしないでください。
  内部インポートは `./api.ts` または
  `./runtime-api.ts` 経由にします。SDK パスは外部契約専用です。
</Warning>

Facade で読み込まれるバンドル済み Plugin の公開面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。
ランタイムスナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化されたバンドル済み Plugin facade は、OpenClaw の Plugin facade ローダー経由で読み込むべきです。
`dist/extensions/...` からの直接インポートは、パッケージ化インストールが Plugin 所有コードに対して使う
マニフェストとランタイム sidecar チェックを迂回します。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK サブパスに属さない場合、
狭い Plugin ローカル契約 barrel を公開できます。バンドル済みの例:

- **Anthropic**: Claude beta-header と `service_tier` ストリームヘルパーのための公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  Extension の本番コードも `openclaw/plugin-sdk/<other-plugin>` インポートを避けるべきです。
  ヘルパーが本当に共有される場合は、2 つの Plugin を結合する代わりに、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  機能指向の面のような中立的な SDK サブパスへ昇格させます。
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
    非推奨の面からの移行。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
