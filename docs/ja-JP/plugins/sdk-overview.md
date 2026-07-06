---
read_when:
    - どの SDK サブパスからインポートする必要があるかを把握する必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを参照している
sidebarTitle: Plugin SDK overview
summary: Import map、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDKの概要
x-i18n:
    generated_at: "2026-07-06T21:50:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2c03d5321285292bfcb2d241b158e59be1a43e5b75bf5ca92a57bf63d9a791f
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付きコントラクトです。このページは、**何をインポートするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使う Plugin 作者向けです。Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能には、代わりに [外部アプリ向け Gateway 連携](/ja-JP/gateway/external-apps) を使用してください。
</Note>

<Tip>
代わりにハウツーガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins) から始めてください。チャネルには [Channel plugins](/ja-JP/plugins/sdk-channel-plugins)、モデルプロバイダーには [Provider plugins](/ja-JP/plugins/sdk-provider-plugins)、local AI CLI バックエンドには [CLI backend plugins](/ja-JP/plugins/cli-backend-plugins)、ネイティブエージェント実行基盤には [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)、ツールまたはライフサイクルフックには [Plugin hooks](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャネル固有のエントリ/ビルドヘルパーには `openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的なサーフェスと、`buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使用してください。

チャネル設定では、チャネル所有の JSON Schema を `openclaw.plugin.json#channelConfigs` で公開します。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw の同梱 Plugin は、保持されている同梱チャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性エクスポートは `plugin-sdk/channel-config-schema-legacy` に残っています。同梱スキーマのどちらのサブパスも、新しい Plugin のパターンではありません。

<Warning>
  プロバイダーまたはチャネルのブランド付き便利シーム（例: `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。同梱 Plugin は、自身の `api.ts` / `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせます。コアの利用側は、それらの Plugin ローカルなバレルを使うか、必要性が本当にクロスチャネルである場合に狭い汎用 SDK コントラクトを追加してください。

所有者による利用が追跡されている場合、少数の同梱 Plugin ヘルパーシームが生成されたエクスポートマップにまだ表示されます。これらは同梱 Plugin のメンテナンス専用であり、新しいサードパーティ Plugin の推奨インポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡されている所有者利用向けの非推奨互換性ファサードとして保持されています。これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域別（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済み同梱 Plugin ヘルパー）にグループ化された狭いサブパス群として公開されています。グループ化されリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths) を参照してください。

コンパイラーエントリポイントのインベントリは `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト/内部サブパスを差し引いた後の公開サブセットから生成されます。公開エクスポート数を監査するには `pnpm plugin-sdk:surface` を実行してください。同梱拡張のプロダクションコードで使われなくなって十分に古い非推奨の公開サブパスは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡され、広範な非推奨再エクスポートバレルは `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、以下のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                         | 登録するもの                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論 (LLM)                                                                |
| `api.registerModelCatalogProvider(...)`          | テキストおよびメディア生成向けのモデルカタログ行                                  |
| `api.registerAgentHarness(...)`                  | [実験的](/ja-JP/plugins/sdk-agent-harness) ネイティブエージェント実行基盤 (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド                                                     |
| `api.registerChannel(...)`                       | メッセージングチャネル                                                            |
| `api.registerEmbeddingProvider(...)`             | 再利用可能なベクトル埋め込みプロバイダー                                          |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし                                              |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析                                                                |
| `api.registerTranscriptSourceProvider(...)`      | ライブまたはインポートされた会議トランスクリプトソース                            |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web fetch / スクレイピングプロバイダー                                            |
| `api.registerWebSearchProvider(...)`             | Web 検索                                                                          |
| `api.registerCompactionProvider(...)`            | 差し替え可能なトランスクリプト Compaction バックエンド                            |

`api.registerEmbeddingProvider(...)` で登録された埋め込みプロバイダーは、Plugin マニフェストの `contracts.embeddingProviders` にも列挙する必要があります。これは、再利用可能なベクトル生成向けの汎用埋め込みサーフェスです。メモリ検索は、この汎用プロバイダーサーフェスを利用できます。古い `api.registerMemoryEmbeddingProvider(...)` と `contracts.memoryEmbeddingProviders` シームは、既存のメモリ固有プロバイダーが移行している間の非推奨互換性です。

まだランタイム `batchEmbed(...)` を公開しているメモリ固有プロバイダーは、そのランタイムが明示的に `sourceWideBatchEmbed: true` を設定しない限り、既存のファイル単位バッチ処理コントラクトに留まります。このオプトインにより、メモリホストは、複数のダーティなメモリファイルと有効なソースからのチャンクを、ホストのバッチ上限まで 1 回の `batchEmbed(...)` 呼び出しで送信できます。JSONL リクエストファイルをアップロードするバッチアダプターは、リクエスト数上限だけでなくアップロードサイズ上限の前にもプロバイダージョブを分割する必要があります。プロバイダーは、`batch.chunks` と同じ順序で、入力チャンクごとに 1 つの埋め込みを返す必要があります。プロバイダーがファイルローカルなバッチを想定している場合、またはより大きなソース横断ジョブで入力順序を保持できない場合は、このフラグを省略してください。

### ツールとコマンド

固定ツール名を持つ単純なツール専用 Plugin には [`defineToolPlugin`](/ja-JP/plugins/tool-plugins) を使用してください。混合 Plugin または完全に動的なツール登録には、`api.registerTool(...)` を直接使用してください。

| メソッド                        | 登録するもの                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM を迂回）                |

Plugin コマンドは、エージェントに短いコマンド所有のルーティングヒントが必要な場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体についての内容に留めてください。プロバイダー固有または Plugin 固有のポリシーをコアプロンプトビルダーに追加しないでください。

ガイダンスエントリは、すべてのプロンプトサーフェスに適用されるレガシー文字列、または構造化エントリにできます。

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

構造化された `surfaces` には、`openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend`、または `subagent` を含めることができます。`pi_main` は `openclaw_main` の非推奨エイリアスとして残っています。意図的に全サーフェス向けのガイダンスにする場合は、`surfaces` を省略してください。空の `surfaces` 配列を渡さないでください。誤ったスコープ喪失がグローバルなプロンプトテキストにならないよう、拒否されます。

ネイティブ Codex アプリサーバーの開発者向け指示は、他のプロンプトサーフェスより厳密です。`codex_app_server` に明示的にスコープされたガイダンスだけが、その高優先度レーンに昇格されます。レガシー文字列ガイダンスとスコープなしの構造化ガイダンスは、互換性のため Codex 以外のプロンプトサーフェスで引き続き利用できます。

### インフラストラクチャ

| メソッド                                        | 登録するもの                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | イベントフック                                                   |
| `api.registerHttpRoute(params)`                 | Gateway HTTP エンドポイント                                      |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC メソッド                                             |
| `api.registerGatewayDiscoveryService(service)`  | ローカル Gateway 検出アドバタイザー                              |
| `api.registerCli(registrar, opts?)`             | CLI サブコマンド                                                 |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 配下の Node 機能 CLI                            |
| `api.registerService(service)`                  | バックグラウンドサービス                                         |
| `api.registerInteractiveHandler(registration)`  | インタラクティブハンドラー                                       |
| `api.registerAgentToolResultMiddleware(...)`    | ランタイムツール結果ミドルウェア                                 |
| `api.registerMemoryPromptSupplement(builder)`   | 追加型のメモリ隣接プロンプトセクション                           |
| `api.registerMemoryCorpusSupplement(adapter)`   | 追加型のメモリ検索/読み取りコーパス                              |
| `api.registerHostedMediaResolver(resolver)`     | ブラウザー形式のホスト済みメディア URL 向けリゾルバー            |
| `api.registerTextTransforms(transforms)`        | Plugin 所有のプロンプト/メッセージ互換性テキスト書き換え         |
| `api.registerConfigMigration(migrate)`          | Plugin ランタイム読み込み前に実行される軽量設定マイグレーション  |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 向けインポーター                              |
| `api.registerAutoEnableProbe(probe)`            | この Plugin を自動有効化できる設定プローブ                       |
| `api.registerReload(registration)`              | リロード処理向けの restart/hot/noop 設定プレフィックスポリシー   |
| `api.registerNodeHostCommand(command)`          | ペアリングされたノードに公開されるコマンドハンドラー             |
| `api.registerNodeInvokePolicy(policy)`          | ノード起動コマンド向けの許可リスト/承認ポリシー                  |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 向けの検出事項コレクター               |

Telegram のインタラクティブハンドラーは、ハンドラーが成功した後に Telegram の通常の受信エージェントパスへテキストを送るために `{ submitText }` を返せます。OpenClaw は、受信ポリシーがテキストをスキップした場合や処理に失敗した場合もコールバックボタンを保持するため、ユーザーはブロック条件が変わった後に再試行できます。この結果フィールドは Telegram 固有です。他のチャネルは、それぞれ独自のインタラクティブ結果コントラクトを保持します。

### ワークフロー Plugin 向けホストフック

ホストフックは、プロバイダー、チャネル、またはツールを追加するだけでなく、ホストのライフサイクルに参加する必要がある Plugin 向けの SDK 接点です。これらは汎用コントラクトです。Plan Mode で利用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI コンパニオン Plugin でも利用できます。

| メソッド                                                                               | 所有するコントラクト                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin が所有する、Gateway セッション経由で投影される JSON 互換セッション状態                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションの次のエージェントターンに注入される、耐久性のある exactly-once コンテキスト                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、マニフェストで制御された信頼済みプリ Plugin ツールポリシー                                                                        |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                                                     |
| `api.registerCommand(...)`                                                           | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` または `suppressReply: true` を設定できます。Discord ネイティブコマンドは `descriptionLocalizations` をサポートします |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、設定、またはタブサーフェス向けの Control UI コントリビューション記述子                                                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット、削除、再読み込みパスでの Plugin 所有ランタイムリソースのクリーンアップコールバック                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態とモニター向けのサニタイズ済みイベント購読                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | ターミナル実行ライフサイクルでクリアされる、実行単位の Plugin スクラッチ状態                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 所有スケジューラージョブのクリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行いません                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | アクティブな直接送信セッションルートへの、バンドル専用のホスト仲介ファイル添付配信                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル専用の Cron 裏付けのスケジュール済みセッションターンと、タグベースのクリーンアップ                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway 経由でディスパッチできる型付きセッションアクション                                                                                             |

`surface: "tab"` 記述子は、Control UI にサイドバータブを追加します。有効な Plugin のタブ記述子は、gateway hello（`controlUiTabs`）でダッシュボードクライアントへ通知されるため、そのタブは Plugin が有効な間だけ表示されます。バンドル Plugin は、そのタブ向けのファーストクラスのダッシュボードビューを同梱できます。他の Plugin は `path` を Plugin HTTP ルート（`api.registerHttpRoute(...)` を参照）に設定でき、ダッシュボードはそれをサンドボックス化されたフレームでレンダリングします。`icon` はダッシュボードアイコン名のヒント、`group` はサイドバーセクション（`control` または `agent`）を選択し、`order` は Plugin タブ間の並び順を決め、`requiredScopes` はそれらのオペレータースコープを持たない接続からタブを隠します。

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

同等のフラットメソッドは、既存 Plugin 向けの非推奨の互換エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または `api.unscheduleSessionTurnsByTag` を直接呼び出す新しい Plugin コードを追加しないでください。

`scheduleSessionTurn(...)` は、Gateway Cron スケジューラーのセッションスコープの簡便機能です。Cron はタイミングを所有し、ターンが実行されるときにバックグラウンドタスクレコードを作成します。Plugin SDK は、対象セッション、Plugin 所有の命名、クリーンアップのみを制約します。作業自体に耐久性のある複数ステップの TaskFlow 状態が必要な場合は、スケジュール済みターン内で `api.runtime.tasks.managedFlows` を使用してください。

これらのコントラクトは、権限を意図的に分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常フックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホストに信頼されます。バンドルポリシーが最初に実行されます。インストール済み Plugin のポリシーには、明示的な有効化と `contracts.trustedToolPolicies` 内の local ids が必要で、Plugin 読み込み順で次に実行されます。ポリシー ID は登録元 Plugin にスコープされます。
- 予約済みコマンドの所有権はバンドル専用です。外部 Plugin は独自のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` のプロンプトフィールド、`enqueueNextTurnInjection` など、プロンプトを変更するフックを無効にします。

Plan 以外の利用例:

| Plugin の典型例             | 使用するフック                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー            | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                            |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                                 |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベント購読、セッションスケジューラー所有/クリーンアップ、heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード   | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有メソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用するタイミング">
  バンドル Plugin と、一致するマニフェストコントラクトを持ち明示的に有効化されたインストール済み Plugin は、ツール実行後かつランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは、tokenjuice などの非同期出力リデューサー向けの、信頼済みでランタイム中立の接点です。

Plugin は対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば `["openclaw", "codex"]` です。そのコントラクトがない、または明示的に有効化されていないインストール済み Plugin は、このミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使用してください。古い埋め込みランナー専用の拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` を使用すると、Plugin は mDNS/Bonjour などのローカル検出トランスポート上でアクティブな Gateway を通知できます。OpenClaw は、ローカル検出が有効な場合に Gateway 起動中にそのサービスを呼び出し、現在の Gateway ポートとシークレットではない TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway 検出 Plugin は、通知された TXT 値をシークレットや認証として扱ってはいけません。検出はルーティングのヒントです。Gateway 認証と TLS ピン留めが引き続き信頼を所有します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のコマンドメタデータを受け取ります。

- `commands`: 登録元が所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ向けの任意の親コマンドパス

ペアノード機能では、`api.registerNodeCliFeature(registrar, opts?)` を優先してください。これは `api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、`openclaw nodes canvas` などのコマンドを明示的な Plugin 所有ノード機能にします。

通常のルート CLI パスで Plugin コマンドを遅延読み込みのままにしたい場合は、その登録元が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を提供してください。

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
その即時互換パスは引き続きサポートされていますが、解析時の遅延読み込み向けに
ディスクリプターに基づくプレースホルダーはインストールされません。

### CLI バックエンド登録

`api.registerCliBackend(...)` により、プラグインは `claude-cli` や `my-cli` などのローカル
AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照でプロバイダープレフィックスになります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形を使用します。
- ユーザー設定が常に優先されます。OpenClaw は CLI を実行する前に、`agents.defaults.cliBackends.<id>` を
  プラグインのデフォルトの上にマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig` を使用してください
  （たとえば古いフラグ形状の正規化）。
- CLI 方言に属するリクエストスコープの argv 書き換えには、`resolveExecutionArgs` を使用してください。
  たとえば、OpenClaw の思考レベルをネイティブの effort
  フラグにマッピングする場合です。このフックは `ctx.executionMode` を受け取ります。一時的な `/btw` 呼び出しに
  バックエンドネイティブの隔離フラグを追加するには、`"side-question"` を使用してください。それらのフラグが、
  通常は常時有効な CLI のネイティブツールを確実に無効化する場合は、
  `sideQuestionToolMode: "disabled"` も宣言してください。

エンドツーエンドの作成ガイドについては、
[CLI バックエンドプラグイン](/ja-JP/plugins/cli-backend-plugins)を参照してください。

### 排他的スロット

| メソッド                                   | 登録するもの                                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけ有効）。ホストがモデル/プロバイダー/モード診断を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い厳密なエンジンはそのキーなしで再試行されます。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュ計画リゾルバー                                                                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                         |

### 非推奨のメモリ埋め込みアダプター

| メソッド                                       | 登録するもの                                 |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 有効なプラグイン用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他的メモリプラグイン API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、
  関連プラグインは特定のメモリプラグインのプライベートレイアウトに入り込む代わりに、
  `openclaw/plugin-sdk/memory-host-core` を通じてエクスポート済みメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリプラグイン API です。
- `MemoryFlushPlan.model` は、有効なフォールバックチェーンを継承せずに、フラッシュターンを
  `ollama/qwen3:8b` などの正確な `provider/model`
  参照に固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーは
  `api.registerEmbeddingProvider(...)` と
  `contracts.embeddingProviders` を使用してください。
- 既存のメモリ固有プロバイダーは移行期間中も動作しますが、
  プラグイン検査では、非バンドルプラグインに対する互換性負債として報告されます。

### イベントとライフサイクル

| メソッド                                     | 実行すること                 |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック   |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[プラグインフック](/ja-JP/plugins/hooks)を参照してください。

### フック決定セマンティクス

`before_install` はプラグインランタイムのライフサイクルフックであり、オペレーターのインストール
ポリシーサーフェスではありません。許可/ブロックの決定が CLI と Gateway に基づくインストールまたは更新パスを
対象にする必要がある場合は、`security.installPolicy` を使用してください。

- `before_tool_call`: `{ block: true }` を返すと終端になります。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、決定なし（`block` の省略と同じ）として扱われ、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端になります。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、決定なし（`block` の省略と同じ）として扱われ、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端になります。いずれかのハンドラーがディスパッチを主張すると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端になります。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、決定なし（`cancel` の省略と同じ）として扱われ、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの `threadId` フィールドを使用してください。チャネル固有の追加情報には `metadata` を残してください。
- `message_sending`: チャネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用してください。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway 所有の起動状態には `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を使用してください。
- `cron_changed`: Gateway 所有の Cron ライフサイクル変更を監視します。外部ウェイクスケジューラーを同期する場合は、`event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw にしてください。

### API オブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | プラグイン ID                                                                                 |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | プラグインバージョン（任意）                                                                 |
| `api.description`        | `string?`                 | プラグイン説明（任意）                                                                       |
| `api.source`             | `string`                  | プラグインソースパス                                                                         |
| `api.rootDir`            | `string?`                 | プラグインルートディレクトリ（任意）                                                         |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合は有効なインメモリランタイムスナップショット）     |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からのプラグイン固有設定                                       |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は軽量なフルエントリ前の起動/セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | プラグインルートからの相対パスを解決                                                         |

## 内部モジュール規約

プラグイン内では、内部インポートにローカルバレルファイルを使用してください。

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` を通じて自分のプラグインをインポートしないでください。
  内部インポートは `./api.ts` または
  `./runtime-api.ts` を通してください。SDK パスは外部契約専用です。
</Warning>

ファサード読み込みされるバンドルプラグインの公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および類似の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、有効なランタイム設定スナップショットを優先します。ランタイム
スナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化されたバンドルプラグインのファサードは、OpenClaw のプラグイン
ファサードローダーを通じて読み込む必要があります。`dist/extensions/...` からの直接インポートは、
パッケージ化インストールがプラグイン所有コードに使用するマニフェストとランタイムサイドカーチェックをバイパスします。

プロバイダープラグインは、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合に、狭いプラグインローカル契約バレルを公開できます。バンドル例:

- **Anthropic**: Claude のベータヘッダーと `service_tier` ストリームヘルパー向けの公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、
  デフォルトモデルヘルパー、およびリアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダー
  とオンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードも、`openclaw/plugin-sdk/<other-plugin>`
  インポートを避けるべきです。ヘルパーが本当に共有される場合は、2 つのプラグインを結合する代わりに、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  機能指向サーフェスなど、中立的な SDK サブパスに昇格させてください。
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
    非推奨のサーフェスからの移行。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャとケイパビリティモデル。
  </Card>
</CardGroup>
