---
read_when:
    - どの SDK サブパスからインポートするかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドに関するリファレンスが必要な場合
    - 特定のSDKエクスポートを検索しています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-07-11T22:34:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付き契約です。このページでは、**何をインポートするか**、および**何を登録できるか**を説明します。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作成者向けです。Gateway を介してエージェントを実行する外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能については、代わりに [外部アプリ向け Gateway 連携](/ja-JP/gateway/external-apps)を使用してください。
</Note>

<Tip>
代わりにハウツーガイドをお探しですか？まずは [Plugin の構築](/ja-JP/plugins/building-plugins)をご覧ください。チャネルには[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、モデルプロバイダーには[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)、ネイティブエージェント実行機能には[エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)、ツールまたはライフサイクルフックには[Plugin フック](/ja-JP/plugins/hooks)を使用してください。
</Tip>

## インポート規則

必ず特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャネル固有のエントリーヘルパーやビルドヘルパーには `openclaw/plugin-sdk/channel-core` を優先し、より広範な包括的サーフェスや `buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使用してください。

チャネル設定では、チャネルが所有する JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開してください。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw のバンドル済み Plugin は、保持されているバンドル済みチャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性エクスポートは `plugin-sdk/channel-config-schema-legacy` に残されています。どちらのバンドル済みスキーマサブパスも、新しい Plugin の手本ではありません。

<Warning>
  プロバイダー名またはチャネル名を冠した便利な接続面（例: `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）からインポートしないでください。バンドル済み Plugin は、独自の `api.ts` / `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせます。コアの利用側は、それらの Plugin ローカルなバレルを使用するか、必要性が本当にチャネル横断的である場合に限定的な汎用 SDK 契約を追加してください。

所有者による使用が追跡されている場合、少数のバンドル済み Plugin 用ヘルパー接続面が生成されたエクスポートマップに引き続き表示されます。これらはバンドル済み Plugin のメンテナンス専用であり、新しいサードパーティー Plugin の推奨インポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡対象の所有者による使用のため、非推奨の互換性ファサードとして維持されています。これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリー、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、および予約済みのバンドル済み Plugin ヘルパー）ごとにグループ化された、限定的なサブパスの集合として公開されています。グループ化されリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

コンパイラーのエントリーポイント一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージエクスポートは、`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙されたリポジトリローカルのテスト用・内部用サブパスを除外した公開サブセットから生成されます。公開エクスポート数を監査するには、`pnpm plugin-sdk:surface` を実行してください。十分に古く、バンドル済み拡張機能の本番コードで使用されていない非推奨の公開サブパスは `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。広範な非推奨の再エクスポートバレルは `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティの登録

| メソッド                                         | 登録するもの                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                                                               |
| `api.registerWorkerProvider(...)`                | クラウドワーカーのライフサイクルリース                                            |
| `api.registerModelCatalogProvider(...)`          | テキストおよびメディア生成用のモデルカタログ行                                    |
| `api.registerAgentHarness(...)`                  | [試験的](/ja-JP/plugins/sdk-agent-harness) ネイティブエージェント実行機能（Codex、Copilot） |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド                                                     |
| `api.registerChannel(...)`                       | メッセージングチャネル                                                            |
| `api.registerEmbeddingProvider(...)`             | 再利用可能なベクトル埋め込みプロバイダー                                          |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし                                              |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | 画像・音声・動画の分析                                                            |
| `api.registerTranscriptSourceProvider(...)`      | ライブまたはインポートされた会議文字起こしソース                                  |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイピングプロバイダー                                             |
| `api.registerWebSearchProvider(...)`             | Web 検索                                                                          |
| `api.registerCompactionProvider(...)`            | 差し替え可能な文字起こし Compaction バックエンド                                  |

ワーカープロバイダーは、`contracts.workerProviders` 内でも自身の ID を宣言する必要があります。コアは `provision(profile, operationId)` の前に永続的な意図を保存します。プロバイダーは外部割り当ての前に設定を検証し、プロファイルを永続的に拒否する場合は `WorkerProviderError` をスローします。操作 ID が繰り返された場合、`provision` は同じリースを採用する必要があります。
コアは検証済みのプロファイル設定をリースとともに保存し、そのスナップショットを `destroy({ leaseId, profile })` と `inspect({ leaseId, profile })` に渡します。`destroy` はべき等でなければならず、`inspect` は `active`、`destroyed`、または `unknown` を返します。これにより、Gateway の再起動後や名前付きプロファイルの削除後でも、プロバイダーはライフサイクル呼び出しをルーティングできます。SSH エンドポイントの `keyRef` にはインラインの鍵素材ではなく `SecretRef` を使用し、信頼済みのプロビジョニング出力から得た `hostKey` を、ホスト名やコメントを含めず、正確に `algorithm base64` の形式で含めます。コアは `hostKey` を固定し、最初の接続で得た鍵を決して信頼しません。動的な `keyRef` を発行するプロバイダーは `resolveSshIdentity({ leaseId, profile, keyRef })` を実装できます。このリゾルバーが存在する場合はそれが権威ある情報源となり、実装しないプロバイダーは設定済みの汎用シークレットリゾルバーを使用します。
更新可能なリースを持つプロバイダーは、`renew(leaseId)` も実装できます。
一時的または判定不能な失敗の場合、`inspect` は必ず例外をスローする必要があります。権威ある不在確認の場合にのみ `unknown` を返してください。コアは、アクティブなローカルレコードを孤立状態としてマークするか、永続化済みの破棄要求がある場合は、その不在を破棄完了として扱います。

`api.registerEmbeddingProvider(...)` で登録された埋め込みプロバイダーは、Plugin マニフェストの `contracts.embeddingProviders` にも列挙する必要があります。これは、再利用可能なベクトル生成のための汎用埋め込みサーフェスです。メモリ検索は、この汎用プロバイダーサーフェスを利用できます。既存のメモリ固有プロバイダーの移行期間中は、旧来の `api.registerMemoryEmbeddingProvider(...)` と `contracts.memoryEmbeddingProviders` の接続面が非推奨の互換性機能として維持されます。

引き続きランタイム `batchEmbed(...)` を公開するメモリ固有プロバイダーは、そのランタイムで `sourceWideBatchEmbed: true` を明示的に設定しない限り、既存のファイル単位のバッチ処理契約を使用します。このオプトインにより、メモリホストは、ホストのバッチ上限まで、複数の変更済みメモリファイルと有効化されたソースからのチャンクを 1 回の `batchEmbed(...)` 呼び出しで送信できます。JSONL リクエストファイルをアップロードするバッチアダプターは、リクエスト数の上限だけでなく、アップロードサイズの上限に達する前にもプロバイダージョブを分割する必要があります。プロバイダーは、`batch.chunks` と同じ順序で、入力チャンクごとに 1 つの埋め込みを返す必要があります。プロバイダーがファイルローカルなバッチを想定している場合、またはより大規模なソース横断ジョブで入力順序を維持できない場合は、このフラグを省略してください。

### ツールとコマンド

固定されたツール名を持つ単純なツール専用 Plugin には、[`defineToolPlugin`](/ja-JP/plugins/tool-plugins) を使用してください。複合 Plugin または完全に動的なツール登録には、`api.registerTool(...)` を直接使用してください。

| メソッド                               | 登録するもの                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | エージェントツール（必須、または `{ optional: true }`）                                                                                      |
| `api.registerCommand(def)`             | カスタムコマンド（LLM を経由しない）                                                                                                         |
| `api.registerNodeHostCommand(command)` | `openclaw node run` が処理するコマンド。オプションの `agentTool` メタデータにより、Node の接続中はエージェントから見えるツールとして公開可能 |

エージェントにコマンド固有の短いルーティングヒントが必要な場合、Plugin コマンドは `agentPromptGuidance` を設定できます。そのテキストはコマンド自体に関する内容に限定し、プロバイダー固有または Plugin 固有のポリシーをコアのプロンプトビルダーに追加しないでください。

ガイダンスエントリーには、すべてのプロンプトサーフェスに適用される従来形式の文字列、または構造化エントリーを使用できます。

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

構造化された `surfaces` には、`openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend`、または `subagent` を含められます。`pi_main` は、`openclaw_main` の非推奨エイリアスとして残されています。すべてのサーフェスに意図的に適用するガイダンスでは、`surfaces` を省略してください。空の `surfaces` 配列を渡さないでください。誤ってスコープが失われたテキストがグローバルなプロンプトテキストにならないよう、空の配列は拒否されます。

ネイティブ Codex アプリサーバーの開発者向け指示は、他のプロンプトサーフェスより厳格です。`codex_app_server` に明示的にスコープ指定されたガイダンスのみが、その高優先度レーンに昇格します。従来形式の文字列ガイダンスとスコープ指定のない構造化ガイダンスは、互換性のため、Codex 以外のプロンプトサーフェスで引き続き使用できます。

Nodeホストコマンドは、Gatewayプロセス内ではなく、接続されたNodeホスト上で実行されます。`agentTool`が存在する場合、NodeはGatewayへの接続に成功した後で記述子を公開します。Gatewayがそれをエージェント実行に公開するのは、そのNodeが接続されており、かつ記述子の`command`がNodeで承認されたコマンド公開範囲に含まれている間だけです。危険性のないコマンドをデフォルトのNodeコマンド許可リストに追加するには、`agentTool.defaultPlatforms`を設定します。それ以外の場合は、明示的な`gateway.nodes.allowCommands`またはNode呼び出しポリシーが必要です。`agentTool.name`はプロバイダーで安全に使用できる必要があります。先頭を文字にし、文字、数字、アンダースコア、ハイフンのみを使用し、64文字以内に収めてください。MCPを基盤とするNodeツールでは、`agentTool.mcp`メタデータを設定することで、カタログおよびツール検索画面にリモートMCPサーバー／ツールの識別情報を表示できますが、実行は引き続き公開されたNodeコマンドを経由します。

### インフラストラクチャ

| メソッド                                        | 登録内容                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | イベントフック                                               |
| `api.registerHttpRoute(params)`                 | Gateway HTTPエンドポイント                                   |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPCメソッド                                          |
| `api.registerGatewayDiscoveryService(service)`  | ローカルGateway検出アドバタイザー                             |
| `api.registerCli(registrar, opts?)`             | CLIサブコマンド                                               |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes`配下のNode機能CLI                             |
| `api.registerService(service)`                  | バックグラウンドサービス                                     |
| `api.registerInteractiveHandler(registration)`  | インタラクティブハンドラー                                   |
| `api.registerAgentToolResultMiddleware(...)`    | ランタイムのツール結果ミドルウェア                           |
| `api.registerMemoryPromptSupplement(builder)`   | メモリに隣接する追加プロンプトセクション                     |
| `api.registerMemoryCorpusSupplement(adapter)`   | 追加のメモリ検索／読み取りコーパス                           |
| `api.registerHostedMediaResolver(resolver)`     | ブラウザ形式のホスト済みメディアURL用リゾルバー              |
| `api.registerTextTransforms(transforms)`        | Plugin所有のプロンプト／メッセージ互換テキスト書き換え       |
| `api.registerConfigMigration(migrate)`          | Pluginランタイムの読み込み前に実行される軽量な設定移行       |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate`用インポーター                              |
| `api.registerAutoEnableProbe(probe)`            | このPluginを自動有効化できる設定プローブ                     |
| `api.registerReload(registration)`              | 再読み込み処理用の再起動／ホット／何もしない設定プレフィックポリシー |
| `api.registerNodeHostCommand(command)`          | ペアリング済みNodeに公開されるコマンドハンドラー             |
| `api.registerNodeInvokePolicy(policy)`          | Nodeから呼び出されるコマンドの許可リスト／承認ポリシー       |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit`用の検出結果コレクター               |

メモリプロンプト補足ビルダーは、任意の`agentId`、`agentSessionKey`、`sandboxed`コンテキストを受け取ります。メモリコーパス補足の`search`および`get`呼び出しは、任意の`agentId`および`sandboxed`コンテキストを受け取ります。エージェント所有のストレージを持つPluginは、登録時に単一のグローバルパスを取り込むのではなく、呼び出しごとにそのストレージを解決する必要があります。マルチエージェント操作でエージェントIDが必須であるにもかかわらず欠けている場合は、任意のエージェントを選択せず、フェイルクローズしてください。

Telegramのインタラクティブハンドラーは、ハンドラーが成功した後、Telegramの通常の受信エージェント経路を通じてテキストをルーティングするために`{ submitText }`を返せます。受信ポリシーによってテキストがスキップされた場合や処理が失敗した場合、OpenClawはコールバックボタンを保持するため、妨げとなる条件が変わった後にユーザーが再試行できます。この結果フィールドはTelegram固有です。他のチャンネルは、それぞれ独自のインタラクティブ結果コントラクトを維持します。

### ワークフローPlugin向けホストフック

ホストフックは、プロバイダー、チャンネル、ツールを追加するだけでなく、ホストのライフサイクルに参加する必要があるPlugin向けのSDK接続面です。これらは汎用コントラクトです。Plan Modeだけでなく、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UIコンパニオンPluginでも使用できます。

| メソッド                                                                             | 所有するコントラクト                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gatewayセッションを通じて投影される、Plugin所有のJSON互換セッション状態                                                                                   |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1つのセッションについて次のエージェントターンに挿入される、永続的かつ厳密に1回限りのコンテキスト                                                          |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、マニフェストで制御された信頼済みのPlugin前ツールポリシー                                                |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                                                                         |
| `api.registerCommand(...)`                                                           | スコープ付きPluginコマンド。コマンド結果では`continueAgent: true`または`suppressReply: true`を設定可能。Discordネイティブコマンドは`descriptionLocalizations`をサポート |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、設定、タブ画面向けのControl UIコントリビューション記述子                                                                         |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット／削除／再読み込み経路でPlugin所有のランタイムリソースを解放するためのクリーンアップコールバック                                                   |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態およびモニター向けにサニタイズされたイベント購読                                                                                           |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルで消去される、実行単位のPlugin一時状態                                                                                                |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin所有のスケジューラージョブ用クリーンアップメタデータ。作業のスケジュールやタスクレコードの作成は行わない                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | バンドル済みPlugin専用。アクティブな直接送信セッション経路への、ホスト仲介によるファイル添付配信                                                           |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル済みPlugin専用。Cronを基盤とするスケジュール済みセッションターンと、タグに基づくクリーンアップ                                                     |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントがGatewayを通じてディスパッチできる型付きセッションアクション                                                                                  |

`surface: "tab"`記述子は、Control UIにサイドバータブを追加します。有効なPluginのタブ記述子は、Gatewayのhello（`controlUiTabs`）でダッシュボードクライアントに通知されるため、そのタブはPluginが有効な間だけ表示されます。バンドル済みPluginは、そのタブ用の正式なダッシュボードビューを同梱できます。それ以外のPluginは`path`にPluginのHTTPルート（`api.registerHttpRoute(...)`を参照）を設定でき、ダッシュボードはそれをサンドボックス化されたフレーム内に表示します。`icon`はダッシュボードアイコン名のヒント、`group`はサイドバーセクション（`control`または`agent`）の選択、`order`はPluginタブ間の並び順を指定し、`requiredScopes`は該当するオペレータースコープを持たない接続からタブを非表示にします。

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

新しいPluginコードでは、グループ化された名前空間を使用してください。

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

同等のフラットなメソッドは、既存のPlugin向けに非推奨の互換エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、`api.unscheduleSessionTurnsByTag`を直接呼び出す新しいPluginコードを追加しないでください。

`scheduleSessionTurn(...)`は、GatewayのCronスケジューラーをセッションスコープで利用するための簡便な方法です。Cronが実行タイミングを管理し、ターンの実行時にバックグラウンドタスクレコードを作成します。Plugin SDKが制約するのは、対象セッション、Plugin所有の命名、クリーンアップだけです。作業自体に永続的な複数ステップのTask Flow状態が必要な場合は、スケジュール済みターン内で`api.runtime.tasks.managedFlows`を使用してください。

各コントラクトは、意図的に権限を分離しています。

- 外部Pluginは、セッション拡張、UI記述子、コマンド、ツールメタデータ、次ターンへの挿入、通常のフックを所有できます。
- 信頼済みツールポリシーは、通常の`before_tool_call`フックより前に実行され、ホストから信頼されます。バンドル済みポリシーが最初に実行されます。インストール済みPluginのポリシーは、明示的な有効化に加えて、そのローカルIDを`contracts.trustedToolPolicies`に含める必要があり、その後Pluginの読み込み順に実行されます。ポリシーIDのスコープは、登録元Pluginに限定されます。
- 予約済みコマンドの所有は、バンドル済みPluginに限定されます。外部Pluginは独自のコマンド名またはエイリアスを使用する必要があります。
- `allowPromptInjection=false`は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、従来の`before_agent_start`のプロンプトフィールド、`enqueueNextTurnInjection`など、プロンプトを変更するフックを無効にします。

Plan以外の利用例：

| Plugin の類型                 | 使用するフック                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー             | セッション拡張、コマンド継続、次ターンへの注入、UI 記述子                                                                                            |
| 予算／ワークスペースのポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                                              |
| バックグラウンドのライフサイクル監視 | ランタイムのライフサイクルクリーンアップ、エージェントイベント購読、セッションスケジューラーの所有権／クリーンアップ、Heartbeat プロンプトへの寄与、UI 記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                                               |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、
  常に `operator.admin` のままです。Plugin が所有するメソッドには、
  Plugin 固有のプレフィックスを使用してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用する場合">
  バンドル済み Plugin、および一致するマニフェスト契約を持ち明示的に有効化された
  インストール済み Plugin は、実行後かつランタイムが結果をモデルへ返す前に
  ツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)`
  を使用できます。これは、tokenjuice のような非同期出力リデューサー向けの、
  信頼済みかつランタイムに依存しない接続点です。

Plugin は、対象とする各ランタイムについて
`contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば
`["openclaw", "codex"]` です。その契約がない、または明示的に有効化されていない
インストール済み Plugin は、このミドルウェアを登録できません。モデルへ返す前の
ツール結果処理タイミングを必要としない処理には、通常の OpenClaw Plugin フックを
使用してください。以前の組み込みランナー専用の拡張ファクトリー登録経路は
削除されました。
</Accordion>

### Gateway ディスカバリーの登録

`api.registerGatewayDiscoveryService(...)` を使用すると、Plugin は mDNS/Bonjour
などのローカルディスカバリートランスポート上で、稼働中の Gateway を公開できます。
ローカルディスカバリーが有効な場合、OpenClaw は Gateway の起動時にサービスを
呼び出し、現在の Gateway ポートと機密情報ではない TXT ヒントデータを渡します。
また、Gateway のシャットダウン時には、返された `stop` ハンドラーを呼び出します。

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

Gateway ディスカバリー Plugin は、公開される TXT 値を機密情報や認証として
扱ってはいけません。ディスカバリーはルーティングのヒントにすぎず、信頼性の確保は
引き続き Gateway 認証と TLS ピンニングが担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のコマンドメタデータを受け付けます。

- `commands`: レジストラーが所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使用する
  解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ用の
  省略可能な親コマンドパス

ペアリング済み Node の機能には、
`api.registerNodeCliFeature(registrar, opts?)` を使用してください。これは
`api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、
`openclaw nodes canvas` のようなコマンドが Plugin 所有の Node 機能であることを
明示します。

Plugin コマンドを通常のルート CLI パスで遅延読み込みのままにする場合は、その
レジストラーが公開するすべての最上位コマンドルートを網羅する `descriptors` を
指定してください。

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

ルート CLI の遅延登録が不要な場合に限り、`commands` を単独で使用してください。
この即時読み込みの互換経路は引き続きサポートされていますが、解析時の遅延読み込み用に
記述子を基にしたプレースホルダーはインストールしません。

### CLI バックエンドの登録

`api.registerCliBackend(...)` を使用すると、Plugin は `claude-cli` や `my-cli`
などのローカル AI CLI バックエンド用デフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照における
  プロバイダープレフィックスになります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ構造を
  使用します。
- ユーザー設定が常に優先されます。OpenClaw は CLI の実行前に、
  `agents.defaults.cliBackends.<id>` を Plugin のデフォルトへマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、
  `normalizeConfig` を使用します（たとえば、古いフラグ形式の正規化）。
- OpenClaw の思考レベルをネイティブの effort フラグへマッピングする場合など、
  CLI 方言に属するリクエストスコープの argv 書き換えには
  `resolveExecutionArgs` を使用します。このフックは `ctx.executionMode` を
  受け取ります。一時的な `/btw` 呼び出しにバックエンド固有の分離フラグを
  追加するには、`"side-question"` を使用してください。それらのフラグにより、
  通常は常時有効な CLI のネイティブツールを確実に無効化できる場合は、
  `sideQuestionToolMode: "disabled"` も宣言してください。
- 特定の実行ですべてのネイティブツールを無効化できるバックエンドは、
  `nativeToolMode: "selectable"` を宣言できます。制限付き呼び出しでは、空の
  `ctx.toolAvailability.native` タプルと、ホスト分離された厳密な MCP
  許可リストが渡されます。`resolveExecutionArgs` は、新規実行または再開用の
  最終 argv に対して両方を強制する必要があります。バックエンドがこれを実行できない
  場合、OpenClaw はフェイルクローズします。

エンドツーエンドの作成ガイドについては、
[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)を参照してください。

### 排他的スロット

| メソッド                                   | 登録するもの                                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つのみ有効）。ホストがモデル／プロバイダー／モードの診断情報を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い厳格なエンジンでは、そのキーを除外して再試行します。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                                         |

### 非推奨のメモリ埋め込みアダプター

| メソッド                                       | 登録するもの                              |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 有効な Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他的メモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開でき、
  連携 Plugin は特定のメモリ Plugin の非公開レイアウトへ直接アクセスする代わりに、
  `openclaw/plugin-sdk/memory-host-core` を介してエクスポート済みメモリアーティファクトを
  利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、旧仕様と互換性のある排他的メモリ Plugin API です。
- `MemoryFlushPlan.model` は、有効なフォールバックチェーンを継承せず、
  `ollama/qwen3:8b` のような厳密な `provider/model` 参照へフラッシュターンを
  固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーでは、
  `api.registerEmbeddingProvider(...)` と `contracts.embeddingProviders` を
  使用してください。
- 既存のメモリ固有プロバイダーは移行期間中も引き続き動作しますが、バンドルされていない
  Plugin については、Plugin 検査でこれが互換性上の負債として報告されます。

### イベントとライフサイクル

| メソッド                                     | 動作                               |
| -------------------------------------------- | ---------------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック         |
| `api.onConversationBindingResolved(handler)` | 会話バインディングのコールバック   |

例、一般的なフック名、ガードのセマンティクスについては、
[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

### フックの判定セマンティクス

`before_install` は Plugin ランタイムのライフサイクルフックであり、オペレーター向けの
インストールポリシーの適用面ではありません。許可／ブロックの判定を CLI と
Gateway 経由のインストールまたは更新経路の両方に適用する必要がある場合は、
`security.installPolicy` を使用してください。

- `before_tool_call`: `{ block: true }` を返すと終端になります。いずれかのハンドラーがこれを設定すると、それより優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、上書きではなく判断なし（`block` を省略した場合と同じ）として扱われます。
- `before_install`: `{ block: true }` を返すと終端になります。いずれかのハンドラーがこれを設定すると、それより優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、上書きではなく判断なし（`block` を省略した場合と同じ）として扱われます。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端になります。いずれかのハンドラーがディスパッチを引き受けると、それより優先度の低いハンドラーとデフォルトのモデルディスパッチ経路はスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端になります。いずれかのハンドラーがこれを設定すると、それより優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、上書きではなく判断なし（`cancel` を省略した場合と同じ）として扱われます。
- `message_received`: 受信スレッド／トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用します。`metadata` はチャンネル固有の追加情報用に残します。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用します。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使用します。この時点では Cron がまだ読み込み中の場合があります。
- `cron_reconciled`: 起動後またはスケジューラーの再読み込み後に、外部 Cron の完全なプロジェクションを再構築します。これには `reason` と、`enabled: false` を含む実効的な `enabled` 状態が含まれ、`ctx.getCron?.()` は調整済みの正確なスケジューラーを返します。永続的なプロジェクション処理には `ctx.abortSignal` を渡してください。そのスケジューラーのスナップショットが置き換えられるか、Gateway が閉じると中止されます。
- `cron_changed`: Gateway が所有する Cron ライフサイクルの変更を監視します。`scheduled` および `removed` イベントはコミット後の調整ヒントであり、順序付きの差分ログではありません。スケジュール済みイベントの `event.nextRunAtMs` は、ジョブに次の起動予定がない場合は存在しません。削除済みイベントには、削除されたジョブのスナップショットが引き続き含まれます。

外部起動スケジューラーは `cron_changed` イベントをデバウンスまたは集約し、
その後、`cron_reconciled` が最後に取得したスケジューラーから完全な永続ビューを
再読み込みする必要があります。`cron_changed` コンテキストのスケジューラーを
採用しないでください。古いスケジューラーから切り離されたヒントが、その後の再読み込みと
重なる可能性があります。

Gateway の起動時またはスケジューラーの置き換え時に読み込まれる永続状態については、
`cron_reconciled` を完全スナップショットのトリガーとして使用します。Plugin のみの
ホットリロードでは再実行されません。監視ハンドラーは並列で実行され、処理完了を待たない
ディスパッチは重なる可能性があるため、利用側はイベントの完了順序に依存してはいけません。
期限チェックと実行の信頼できる唯一の情報源は OpenClaw のままにしてください。

永続的な置き換え、再試行／バックオフ、正常なシャットダウンを備えたシングルフライトアダプターについては、[安全な外部 Cron プロジェクション](/ja-JP/plugins/hooks#safe-external-cron-projection)を参照してください。

### API オブジェクトのフィールド

| フィールド               | 型                        | 説明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                      |
| `api.version`            | `string?`                 | Plugin のバージョン（任意）                                                                 |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                       |
| `api.source`             | `string`                  | Plugin のソースパス                                                                         |
| `api.rootDir`            | `string?`                 | Plugin のルートディレクトリ（任意）                                                         |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合は、アクティブなメモリ内ランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` の Plugin 固有設定                                             |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は完全なエントリの前に使われる軽量な起動／セットアップ期間 |
| `api.resolvePath(input)` | `(string) => string`      | Plugin のルートを基準にパスを解決                                                           |

## 内部モジュールの規約

Plugin 内では、内部インポートにローカルのバレルファイルを使用します。

```text
my-plugin/
  api.ts            # 外部利用者向けの公開エクスポート
  runtime-api.ts    # 内部専用のランタイムエクスポート
  index.ts          # Plugin のエントリポイント
  setup-entry.ts    # セットアップ専用の軽量エントリ（任意）
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` を介して
  自分自身の Plugin をインポートしないでください。内部インポートは
  `./api.ts` または `./runtime-api.ts` を経由させます。SDK パスは外部契約専用です。
</Warning>

ファサード経由で読み込まれるバンドル済み Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、OpenClaw がすでに
実行中の場合、アクティブなランタイム設定スナップショットを優先します。ランタイム
スナップショットがまだ存在しない場合は、ディスク上で解決された設定ファイルに
フォールバックします。パッケージ化されたバンドル済み Plugin のファサードは、OpenClaw の
Plugin ファサードローダーを介して読み込む必要があります。`dist/extensions/...` から直接
インポートすると、パッケージ化されたインストールが Plugin 所有コードに使用するマニフェストと
ランタイムサイドカーのチェックが回避されます。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合、限定的な Plugin ローカル契約バレルを公開できます。バンドル済みの例：

- **Anthropic**: Claude のベータヘッダーおよび `service_tier` ストリームヘルパー向けの
  公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、
  デフォルトモデルヘルパー、およびリアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーと
  オンボーディング／設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードでも、`openclaw/plugin-sdk/<other-plugin>` の
  インポートは避けてください。ヘルパーが真に共有されるものなら、2 つの Plugin を
  結合するのではなく、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、
  または別の機能指向サーフェスなど、中立的な SDK サブパスに昇格させてください。
</Warning>

## 関連項目

<CardGroup cols={2}>
  <Card title="エントリポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` および `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="ランタイムヘルパー" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` 名前空間の完全なリファレンス。
  </Card>
  <Card title="セットアップと設定" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージ化、マニフェスト、設定スキーマ。
  </Card>
  <Card title="テスト" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとリントルール。
  </Card>
  <Card title="SDK の移行" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin の内部構造" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
