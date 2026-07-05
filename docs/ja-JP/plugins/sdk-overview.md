---
read_when:
    - どの SDK サブパスからインポートする必要があるかを知る必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です。
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-07-05T20:18:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aead8f60f1faf47f8a9bbdc6a889f5f3df7a264c6941119ece26bd26a55d25bf
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付きコントラクトです。このページは、**何をインポートするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能では、代わりに
  [外部アプリ向け Gateway 統合](/ja-JP/gateway/external-apps)を使用してください。
</Note>

<Tip>
代わりにハウツーガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins)から始めてください。チャンネルには[チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、モデルプロバイダーには[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)、ネイティブエージェント実行環境には[エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)、ツールまたはライフサイクルフックには[Plugin フック](/ja-JP/plugins/hooks)を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャンネル固有のエントリ/ビルドヘルパーには `openclaw/plugin-sdk/channel-core` を優先してください。`openclaw/plugin-sdk/core` は、より広い包括的なサーフェスと、`buildChannelConfigSchema` などの共有ヘルパー用に残してください。

チャンネル設定では、チャンネルが所有する JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開します。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw のバンドル Plugin は、保持されているバンドルチャンネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換エクスポートは `plugin-sdk/channel-config-schema-legacy` に残っています。どちらのバンドルスキーマサブパスも、新しい Plugin のパターンではありません。

<Warning>
  プロバイダーまたはチャンネル名を冠した便利な境界（例:
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。
  バンドル Plugin は、それぞれの `api.ts` / `runtime-api.ts` バレル内で汎用 SDK サブパスを合成します。コアの利用側は、それらの Plugin ローカルバレルを使用するか、必要性が本当にチャンネル横断である場合に限って狭い汎用 SDK コントラクトを追加してください。

所有者による使用が追跡されている場合、小さな一群のバンドル Plugin ヘルパー境界が生成されたエクスポートマップに引き続き表示されます。これらはバンドル Plugin のメンテナンス専用であり、新しいサードパーティ Plugin に推奨されるインポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡されている所有者使用のために、非推奨の互換ファサードとして保持されています。これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャンネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャンネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みバンドル Plugin ヘルパー）ごとにグループ化された狭いサブパスのセットとして公開されています。グループ化およびリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

コンパイラーエントリポイントのインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト/内部サブパスを差し引いた後、公開サブセットから生成されます。公開エクスポート数を監査するには `pnpm plugin-sdk:surface` を実行してください。十分に古く、バンドル拡張機能の本番コードで使われていない非推奨の公開サブパスは、`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。広範な非推奨再エクスポートバレルは、`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、以下のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                         | 登録内容                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                                                              |
| `api.registerModelCatalogProvider(...)`          | テキストおよびメディア生成用のモデルカタログ行                                  |
| `api.registerAgentHarness(...)`                  | [実験的](/ja-JP/plugins/sdk-agent-harness) ネイティブエージェント実行環境（Codex、Copilot） |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド                                                     |
| `api.registerChannel(...)`                       | メッセージングチャンネル                                                          |
| `api.registerEmbeddingProvider(...)`             | 再利用可能なベクトル埋め込みプロバイダー                                          |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし                                              |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | ライブまたはインポートされた会議文字起こしソース                                  |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web フェッチ / スクレイププロバイダー                                             |
| `api.registerWebSearchProvider(...)`             | Web 検索                                                                          |
| `api.registerCompactionProvider(...)`            | 差し替え可能な文字起こし Compaction バックエンド                                 |

`api.registerEmbeddingProvider(...)` で登録された埋め込みプロバイダーは、Plugin マニフェスト内の `contracts.embeddingProviders` にも列挙する必要があります。これは、再利用可能なベクトル生成のための汎用埋め込みサーフェスです。メモリ検索は、この汎用プロバイダーサーフェスを利用できます。従来の `api.registerMemoryEmbeddingProvider(...)` と `contracts.memoryEmbeddingProviders` 境界は、既存のメモリ固有プロバイダーが移行する間の非推奨互換です。

ランタイム `batchEmbed(...)` をまだ公開しているメモリ固有プロバイダーは、ランタイムが明示的に `sourceWideBatchEmbed: true` を設定しない限り、既存のファイル単位バッチングコントラクトに残ります。このオプトインにより、メモリホストは、複数の変更済みメモリファイルと有効化されたソースからのチャンクを、ホストのバッチ制限まで 1 回の `batchEmbed(...)` 呼び出しで送信できます。JSONL リクエストファイルをアップロードするバッチアダプターは、リクエスト数上限だけでなくアップロードサイズ上限の前にもプロバイダージョブを分割する必要があります。プロバイダーは、`batch.chunks` と同じ順序で、入力チャンクごとに 1 つの埋め込みを返す必要があります。プロバイダーがファイルローカルバッチを期待する場合、またはより大きなソース全体ジョブで入力順序を保持できない場合は、このフラグを省略してください。

### ツールとコマンド

固定ツール名を持つシンプルなツール専用 Plugin には [`defineToolPlugin`](/ja-JP/plugins/tool-plugins) を使用してください。混合 Plugin または完全に動的なツール登録には、`api.registerTool(...)` を直接使用してください。

| メソッド                        | 登録内容                                      |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）            |

Plugin コマンドは、エージェントに短い、コマンド所有のルーティングヒントが必要な場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体に関する内容に留めてください。プロバイダーまたは Plugin 固有のポリシーをコアプロンプトビルダーに追加しないでください。

ガイダンスエントリは、すべてのプロンプトサーフェスに適用される従来の文字列、または構造化エントリにできます。

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

構造化された `surfaces` には、`openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend`、または `subagent` を含めることができます。`pi_main` は、`openclaw_main` の非推奨エイリアスとして残っています。意図的に全サーフェス向けのガイダンスにする場合は、`surfaces` を省略してください。空の `surfaces` 配列を渡さないでください。偶発的なスコープ喪失がグローバルプロンプトテキストにならないよう、これは拒否されます。

ネイティブ Codex app-server の開発者指示は、他のプロンプトサーフェスよりも厳格です。`codex_app_server` に明示的にスコープ指定されたガイダンスのみが、その高優先度レーンに昇格されます。従来の文字列ガイダンスとスコープなしの構造化ガイダンスは、互換性のために Codex 以外のプロンプトサーフェスで引き続き利用できます。

### インフラストラクチャ

| メソッド                                        | 登録内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | イベントフック                                               |
| `api.registerHttpRoute(params)`                 | Gateway HTTP エンドポイント                                  |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC メソッド                                         |
| `api.registerGatewayDiscoveryService(service)`  | ローカル Gateway 検出アドバタイザー                          |
| `api.registerCli(registrar, opts?)`             | CLI サブコマンド                                             |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 配下の Node 機能 CLI                         |
| `api.registerService(service)`                  | バックグラウンドサービス                                     |
| `api.registerInteractiveHandler(registration)`  | インタラクティブハンドラー                                   |
| `api.registerAgentToolResultMiddleware(...)`    | ランタイムツール結果ミドルウェア                             |
| `api.registerMemoryPromptSupplement(builder)`   | 追加型のメモリ隣接プロンプトセクション                       |
| `api.registerMemoryCorpusSupplement(adapter)`   | 追加型のメモリ検索/読み取りコーパス                          |
| `api.registerHostedMediaResolver(resolver)`     | ブラウザー形式のホスト済みメディア URL 用リゾルバー          |
| `api.registerTextTransforms(transforms)`        | Plugin 所有のプロンプト/メッセージ互換テキスト書き換え       |
| `api.registerConfigMigration(migrate)`          | Plugin ランタイム読み込み前に実行される軽量な設定移行        |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 用インポーター                             |
| `api.registerAutoEnableProbe(probe)`            | この Plugin を自動有効化できる設定プローブ                   |
| `api.registerReload(registration)`              | リロード処理向けの再起動/ホット/noop 設定プレフィックスポリシー |
| `api.registerNodeHostCommand(command)`          | ペアリングされたノードに公開されるコマンドハンドラー         |
| `api.registerNodeInvokePolicy(policy)`          | ノード起動コマンド向けの許可リスト/承認ポリシー              |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 用の検出結果コレクター              |

### ワークフロー Plugin 向けホストフック

Host フックは、プロバイダー、チャネル、またはツールを追加するだけでなく、ホストのライフサイクルに参加する必要がある Plugin 向けの SDK 接点です。これらは汎用的な契約です。Plan Mode でも使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI 連携 Plugin でも使用できます。

| Method                                                                               | 所有する契約                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway セッションを通じて投影される、Plugin 所有の JSON 互換セッション状態                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションの次のエージェントターンに注入される、永続的な厳密に 1 回だけのコンテキスト                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、マニフェストで制御された信頼済み pre-plugin ツールポリシー                                                                        |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                                                     |
| `api.registerCommand(...)`                                                           | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` または `suppressReply: true` を設定できます。Discord ネイティブコマンドは `descriptionLocalizations` をサポートします |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、設定、またはタブサーフェス向けの Control UI コントリビューション記述子                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット、削除、リロードパスでの Plugin 所有ランタイムリソース向けクリーンアップコールバック                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルでクリアされる、実行ごとの Plugin スクラッチ状態                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 所有スケジューラージョブ向けのクリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行いません                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | アクティブな直接アウトバウンドセッションルートへの、バンドル限定のホスト仲介ファイル添付配信                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル限定の Cron ベースのスケジュール済みセッションターンと、タグベースのクリーンアップ                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway を通じてディスパッチできる型付きセッションアクション                                                                                             |

`surface: "tab"` 記述子は、Control UI にサイドバータブを追加します。有効な Plugin のタブ記述子は、Gateway hello（`controlUiTabs`）でダッシュボードクライアントに通知されるため、そのタブは Plugin が有効な間だけ表示されます。バンドル Plugin はそのタブ向けにファーストクラスのダッシュボードビューを同梱できます。他の Plugin は `path` を Plugin HTTP ルート（`api.registerHttpRoute(...)` を参照）に設定でき、ダッシュボードはそれをサンドボックス化されたフレーム内でレンダリングします。`icon` はダッシュボードアイコン名のヒント、`group` はサイドバーセクション（`control` または `agent`）を選択し、`order` は Plugin タブ間の並び順を決め、`requiredScopes` はそれらのオペレータースコープを持たない接続からタブを非表示にします。

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

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

同等のフラットメソッドは、既存 Plugin 向けの非推奨互換エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または `api.unscheduleSessionTurnsByTag` を直接呼び出す新しい Plugin コードを追加しないでください。

`scheduleSessionTurn(...)` は、Gateway Cron スケジューラー上のセッションスコープの便利機能です。Cron はタイミングを所有し、ターン実行時にバックグラウンドタスクレコードを作成します。Plugin SDK はターゲットセッション、Plugin 所有の命名、クリーンアップのみを制約します。作業自体に永続的な複数ステップの Task Flow 状態が必要な場合は、スケジュールされたターン内で `api.runtime.tasks.managedFlows` を使用してください。

契約は権限を意図的に分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常フックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホストから信頼されます。バンドルポリシーが最初に実行されます。インストール済み Plugin のポリシーには、明示的な有効化と `contracts.trustedToolPolicies` 内のローカル ID が必要で、Plugin 読み込み順でその次に実行されます。ポリシー ID は登録元 Plugin にスコープされます。
- 予約済みコマンドの所有はバンドル限定です。外部 Plugin は自身のコマンド名またはエイリアスを使用する必要があります。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` からのプロンプトフィールド、`enqueueNextTurnInjection` など、プロンプトを変更するフックを無効にします。

Plan 以外の利用例:

| Plugin アーキタイプ             | 使用するフック                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー            | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                            |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                                 |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、Heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード   | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有メソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用するタイミング">
  バンドル Plugin と、対応するマニフェスト契約を持ち明示的に有効化されたインストール済み Plugin は、実行後かつランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼済みでランタイム非依存の接点です。

Plugin は、対象の各ランタイムについて `contracts.agentToolResultMiddleware` を宣言する必要があります。例: `["openclaw", "codex"]`。その契約を持たない、または明示的に有効化されていないインストール済み Plugin は、このミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使い続けてください。古い embedded-runner 限定の拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` を使用すると、Plugin は mDNS/Bonjour のようなローカル検出トランスポート上でアクティブな Gateway を通知できます。OpenClaw はローカル検出が有効な場合に Gateway 起動中にサービスを呼び出し、現在の Gateway ポートと非シークレットの TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway 検出 Plugin は、通知された TXT 値をシークレットや認証として扱ってはいけません。検出はルーティングヒントです。Gateway 認証と TLS ピンニングが引き続き信頼を所有します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は 2 種類のコマンドメタデータを受け入れます。

- `commands`: 登録元が所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ向けの任意の親コマンドパス

ペアノード機能では、`api.registerNodeCliFeature(registrar, opts?)` を優先してください。これは `api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、`openclaw nodes canvas` のようなコマンドを、明示的に Plugin 所有のノード機能にします。

Plugin コマンドを通常のルート CLI パスで遅延読み込みのままにしたい場合は、その登録元が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を提供してください。

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

遅延ルート CLI 登録が不要な場合にのみ、`commands` を単独で使用します。
この先行互換パスは引き続きサポートされていますが、解析時の遅延読み込み用に
ディスクリプターに裏付けられたプレースホルダーはインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` を使うと、Plugin が `claude-cli` や `my-cli` などのローカル
AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照のプロバイダープレフィックスになります。
- バックエンドの `config` は `agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、Plugin のデフォルトに
  `agents.defaults.cliBackends.<id>` をマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig` を使用します
  (たとえば古いフラグ形状の正規化)。
- CLI 方言に属するリクエスト単位の argv 書き換えには `resolveExecutionArgs` を使用します。
  たとえば、OpenClaw の思考レベルをネイティブの effort フラグにマッピングする場合です。
  フックは `ctx.executionMode` を受け取ります。一時的な `/btw` 呼び出しにバックエンドネイティブの
  分離フラグを追加するには `"side-question"` を使用します。それらのフラグが、本来は常時オンの CLI で
  ネイティブツールを確実に無効化する場合は、`sideQuestionToolMode: "disabled"` も宣言します。

エンドツーエンドの作成ガイドについては、
[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を参照してください。

### 排他スロット

| メソッド                                   | 登録するもの                                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン (同時に有効なのは 1 つ)。ホストがモデル/プロバイダー/モード診断を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い strict エンジンはそのキーなしで再試行されます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリケイパビリティ                                                                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                         |

### 非推奨のメモリ埋め込みアダプター

| メソッド                                       | 登録するもの                                  |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 有効な Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は推奨される排他的メモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できます。
  これにより、コンパニオン Plugin は特定のメモリ Plugin のプライベートレイアウトに触れずに、
  `openclaw/plugin-sdk/memory-host-core` 経由でエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリ Plugin API です。
- `MemoryFlushPlan.model` は、有効なフォールバックチェーンを継承せずに、フラッシュターンを
  `ollama/qwen3:8b` のような正確な `provider/model` 参照に固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーは
  `api.registerEmbeddingProvider(...)` と `contracts.embeddingProviders` を使用する必要があります。
- 既存のメモリ専用プロバイダーは移行期間中も動作しますが、Plugin 検査ではこれを
  バンドル外 Plugin の互換性負債として報告します。

### イベントとライフサイクル

| メソッド                                     | 行うこと                        |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック      |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック  |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

### フック判定セマンティクス

`before_install` は Plugin ランタイムのライフサイクルフックであり、オペレーターのインストールポリシー面ではありません。
許可/ブロックの判定が CLI と Gateway 経由のインストールまたは更新パスを対象にする必要がある場合は、
`security.installPolicy` を使用します。

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、判定なし (`block` の省略と同じ) として扱われ、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、判定なし (`block` の省略と同じ) として扱われ、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを要求すると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、判定なし (`cancel` の省略と同じ) として扱われ、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用します。チャンネル固有の追加情報には `metadata` を保持します。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用します。
- `gateway_start`: 内部の `gateway:startup` フックに依存するのではなく、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使用します。
- `cron_changed`: Gateway が所有する Cron ライフサイクル変更を監視します。外部ウェイクスケジューラーを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw のままにします。

### API オブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin ID                                                                                  |
| `api.name`               | `string`                  | 表示名                                                                                     |
| `api.version`            | `string?`                 | Plugin バージョン (任意)                                                                   |
| `api.description`        | `string?`                 | Plugin 説明 (任意)                                                                         |
| `api.source`             | `string`                  | Plugin ソースパス                                                                          |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ (任意)                                                           |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット (利用可能な場合は有効なメモリ内ランタイムスナップショット)      |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                       |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー (`debug`、`info`、`warn`、`error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は完全エントリー前の軽量な起動/セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                          |

## 内部モジュール規約

Plugin 内では、内部インポートにローカルのバレルファイルを使用します。

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` 経由で自分の Plugin をインポートしてはいけません。
  内部インポートは `./api.ts` または `./runtime-api.ts` 経由にします。SDK パスは外部契約専用です。
</Warning>

ファサードで読み込まれるバンドル済み Plugin の公開サーフェス (`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリーファイル) は、OpenClaw がすでに実行中の場合、
有効なランタイム設定スナップショットを優先します。ランタイムスナップショットがまだ存在しない場合は、
ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化されたバンドル済み Plugin のファサードは、OpenClaw の Plugin ファサードローダー経由で読み込む必要があります。
`dist/extensions/...` からの直接インポートは、パッケージ化インストールが Plugin 所有コードに使用する
マニフェストとランタイムサイドカーのチェックを迂回します。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有で、まだ汎用 SDK サブパスに属さない場合に、
狭い Plugin ローカル契約バレルを公開できます。バンドル済みの例:

- **Anthropic**: Claude ベータヘッダーと `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードも `openclaw/plugin-sdk/<other-plugin>` インポートを避ける必要があります。
  ヘルパーが本当に共有される場合は、2 つの Plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別のケイパビリティ指向サーフェスのような
  中立的な SDK サブパスに昇格させます。
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
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャとケイパビリティモデル。
  </Card>
</CardGroup>
