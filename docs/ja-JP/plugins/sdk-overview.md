---
read_when:
    - どの SDK サブパスからインポートするかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドに関するリファレンスが必要な場合
    - 特定の SDK エクスポートを検索しています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-07-12T14:47:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコア間の型付きコントラクトです。このページでは、
**何をインポートするか**、および**何を登録できるか**を説明します。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する
  Plugin 作成者向けです。Gateway を介してエージェントを実行する
  外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能については、代わりに
  [外部アプリ向け Gateway 統合](/ja-JP/gateway/external-apps)を使用してください。
</Note>

<Tip>
代わりにハウツーガイドをお探しですか？まずは [Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。チャネルには[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、モデルプロバイダーには[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)、ローカル AI CLI バックエンドには[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)、ネイティブエージェント実行環境には[エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)、ツールまたはライフサイクルフックには[Plugin フック](/ja-JP/plugins/hooks)を使用してください。
</Tip>

## インポート規則

常に特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小規模で自己完結したモジュールです。これにより起動が高速になり、
循環依存の問題を防止できます。チャネル固有のエントリ／ビルドヘルパーには、
`openclaw/plugin-sdk/channel-core` を優先してください。より広範な包括的サーフェスと
`buildChannelConfigSchema` などの共有ヘルパーには、
`openclaw/plugin-sdk/core` を使用してください。

チャネル設定については、チャネルが所有する JSON Schema を
`openclaw.plugin.json#channelConfigs` を通じて公開してください。`plugin-sdk/channel-config-schema`
サブパスは、共有スキーマプリミティブと汎用ビルダー向けです。OpenClaw の
同梱 Plugin は、維持されている同梱チャネルスキーマに
`plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性エクスポートは
`plugin-sdk/channel-config-schema-legacy` に残されています。どちらの同梱スキーマサブパスも、
新しい Plugin の模範ではありません。

<Warning>
  プロバイダーまたはチャネルのブランド名を冠した利便性サーフェス（たとえば
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）を
  インポートしないでください。同梱 Plugin は、独自の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせます。コアの利用側は、
  それらの Plugin ローカルバレルを使用するか、必要性が本当に
  チャネル横断的な場合に限定して、狭い汎用 SDK コントラクトを追加する必要があります。

追跡対象となる所有者による使用実績がある場合、少数の同梱 Plugin 用ヘルパーサーフェスが、
生成されたエクスポートマップに引き続き表示されます。これらは同梱 Plugin の
保守専用であり、新しいサードパーティ Plugin の推奨インポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、
追跡対象となる所有者による使用のため、非推奨の互換性ファサードとして維持されています。
これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、
注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、
ケイパビリティ、メモリ、予約済みの同梱 Plugin ヘルパー）ごとに分類された、
一連の狭いサブパスとして公開されています。分類およびリンクされた完全なカタログについては、
[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。

コンパイラーのエントリポイント一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。パッケージのエクスポートは、
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` に列挙された
リポジトリローカルのテスト／内部サブパスを除外した公開サブセットから生成されます。
公開エクスポート数を監査するには、`pnpm plugin-sdk:surface` を実行してください。
十分に古く、同梱拡張機能の本番コードで使用されていない非推奨の公開サブパスは、
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` で追跡されます。広範な
非推奨の再エクスポートバレルは、
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` で追跡されます。

## 登録 API

`register(api)` コールバックは、以下のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### 機能の登録

| メソッド                                         | 登録されるもの                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                                                               |
| `api.registerWorkerProvider(...)`                | クラウドワーカーのライフサイクルリース                                            |
| `api.registerModelCatalogProvider(...)`          | テキストおよびメディア生成用のモデルカタログ行                                    |
| `api.registerAgentHarness(...)`                  | [実験的機能](/ja-JP/plugins/sdk-agent-harness) ネイティブエージェント実行機能（Codex、Copilot） |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド                                                     |
| `api.registerChannel(...)`                       | メッセージングチャネル                                                            |
| `api.registerEmbeddingProvider(...)`             | 再利用可能なベクトル埋め込みプロバイダー                                          |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成                                                       |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし                                              |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション                                                  |
| `api.registerMediaUnderstandingProvider(...)`    | 画像 / 音声 / 動画の分析                                                          |
| `api.registerTranscriptSourceProvider(...)`      | ライブまたはインポートされた会議文字起こしソース                                  |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                                                          |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                                                          |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                                                          |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイピングプロバイダー                                             |
| `api.registerWebSearchProvider(...)`             | Web 検索                                                                           |
| `api.registerCompactionProvider(...)`            | プラグイン可能な文字起こし Compaction バックエンド                                |

Worker プロバイダーは、`contracts.workerProviders` 内でも自身の id を宣言する必要があります。
Core は、`provision(profile, operationId)` より前に永続的な意図を保存します。プロバイダーは外部割り当ての前に設定を検証し、プロファイルが恒久的に拒否された場合は `WorkerProviderError` をスローします。操作 id が繰り返された場合、`provision` は同じリースを引き継ぐ必要があります。
Core は検証済みのプロファイル設定をリースとともに保存し、そのスナップショットを、冪等でなければならない `destroy({ leaseId, profile })` と、`active`、`destroyed`、または `unknown` を返す `inspect({ leaseId, profile })` に渡します。これにより、Gateway の再起動後や名前付きプロファイルの削除後でも、プロバイダーはライフサイクル呼び出しをルーティングできます。SSH エンドポイントでは、`keyRef` に `SecretRef` を使用し、鍵素材をインライン化することはありません。また、信頼できるプロビジョニング出力から得た `hostKey` を、ホスト名やコメントを付けず、正確に `algorithm base64` として含めます。Core は `hostKey` を固定し、初回接続で得た鍵を決して信頼しません。動的な `keyRef` を発行するプロバイダーは、`resolveSshIdentity({ leaseId, profile, keyRef })` を実装できます。これが存在する場合、そのリゾルバーが正式な情報源となり、実装していないプロバイダーは設定済みの汎用シークレットリゾルバーを使用します。
更新可能なリースを持つプロバイダーは、`renew(leaseId)` も実装できます。
`inspect` は、一時的または不確定な障害ではスローしなければなりません。正式に存在しないことが確認された場合にのみ、`unknown` を返します。Core はアクティブなローカルレコードを孤立状態としてマークするか、永続化済みの破棄リクエスト後であれば、その不在をティアダウンの完了として扱います。

`api.registerEmbeddingProvider(...)` で登録された埋め込みプロバイダーは、Plugin マニフェストの `contracts.embeddingProviders` にも記載する必要があります。これは、再利用可能なベクトル生成のための汎用埋め込みサーフェスです。メモリ検索は、この汎用プロバイダーサーフェスを利用できます。既存のメモリ専用プロバイダーが移行する間、従来の `api.registerMemoryEmbeddingProvider(...)` および `contracts.memoryEmbeddingProviders` シームは、非推奨の互換機能として維持されます。

ランタイムで引き続き `batchEmbed(...)` を公開するメモリ専用プロバイダーは、そのランタイムで `sourceWideBatchEmbed: true` が明示的に設定されていない限り、既存のファイル単位のバッチ処理契約を使用します。このオプトインを有効にすると、メモリホストは、ホストのバッチ上限まで、複数の変更済みメモリファイルおよび有効化されたソースのチャンクを 1 回の `batchEmbed(...)` 呼び出しで送信できます。JSONL リクエストファイルをアップロードするバッチアダプターは、リクエスト数の上限だけでなく、アップロードサイズの上限に達する前にもプロバイダージョブを分割する必要があります。プロバイダーは、`batch.chunks` と同じ順序で、入力チャンクごとに 1 つの埋め込みを返す必要があります。プロバイダーがファイルローカルなバッチを前提としている場合、またはより大規模なソース横断ジョブで入力順序を維持できない場合は、このフラグを省略してください。

### ツールとコマンド

固定されたツール名を持つシンプルなツール専用Pluginには、[`defineToolPlugin`](/ja-JP/plugins/tool-plugins)を使用します。複合Pluginまたは完全に動的なツール登録には、`api.registerTool(...)`を直接使用します。

| メソッド                               | 登録内容                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | エージェントツール（必須、または`{ optional: true }`）                                                                                   |
| `api.registerCommand(def)`             | カスタムコマンド（LLMをバイパス）                                                                                                        |
| `api.registerNodeHostCommand(command)` | `openclaw node run`によって処理されるコマンド。オプションの`agentTool`メタデータにより、Nodeの接続中にエージェントから見えるツールとして公開できます |

エージェントがコマンド所有の短いルーティングヒントを必要とする場合、Pluginコマンドで`agentPromptGuidance`を設定できます。そのテキストはコマンド自体に関する内容に限定し、プロバイダーまたはPlugin固有のポリシーをコアプロンプトビルダーに追加しないでください。

ガイダンスエントリには、すべてのプロンプトサーフェスに適用される従来形式の文字列、または構造化エントリを使用できます。

```ts
agentPromptGuidance: [
  "グローバルコマンドのヒント。",
  { text: "これはOpenClawのメインプロンプトにのみ表示します。", surfaces: ["openclaw_main"] },
];
```

構造化された`surfaces`には、`openclaw_main`、`codex_app_server`、`cli_backend`、`acp_backend`、または`subagent`を含めることができます。`pi_main`は、引き続き`openclaw_main`の非推奨エイリアスです。意図的にすべてのサーフェスを対象とするガイダンスでは、`surfaces`を省略します。空の`surfaces`配列を渡さないでください。誤ってスコープが失われたテキストがグローバルプロンプトテキストにならないよう、空の配列は拒否されます。

ネイティブCodexアプリサーバーの開発者向け指示は、ほかのプロンプトサーフェスよりも厳格です。`codex_app_server`を明示的にスコープとして指定したガイダンスのみが、その優先度の高いレーンに昇格します。従来形式の文字列ガイダンスとスコープ未指定の構造化ガイダンスは、互換性のためCodex以外のプロンプトサーフェスで引き続き利用できます。

Node ホストコマンドは、Gateway プロセス内ではなく、接続された Node ホスト上で実行されます。`agentTool` が存在する場合、Node は Gateway への接続に成功した後で記述子を公開します。Gateway がそれをエージェント実行に公開するのは、その Node が接続されており、かつ記述子の `command` が Node の承認済みコマンドサーフェスに含まれている間だけです。危険でないコマンドをデフォルトの Node コマンド許可リストに追加するには、`agentTool.defaultPlatforms` を設定します。それ以外の場合は、明示的な `gateway.nodes.allowCommands` または Node 呼び出しポリシーが必要です。`agentTool.name` はプロバイダーで安全に使用できる必要があります。先頭を英字にし、英字、数字、アンダースコア、またはハイフンのみを使用し、64 文字以内にしてください。MCP を基盤とする Node ツールは `agentTool.mcp` メタデータを設定できるため、カタログおよびツール検索サーフェスにリモート MCP サーバー／ツールの識別情報を表示できますが、実行は引き続き公開された Node コマンドを経由します。

### インフラストラクチャ

| メソッド                                        | 登録するもの                                                 |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `api.registerHook(events, handler, opts?)`      | イベントフック                                               |
| `api.registerHttpRoute(params)`                 | Gateway HTTP エンドポイント                                  |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC メソッド                                         |
| `api.registerGatewayDiscoveryService(service)`  | ローカル Gateway 検出アドバタイザー                           |
| `api.registerCli(registrar, opts?)`             | CLI サブコマンド                                              |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 配下の Node 機能 CLI                         |
| `api.registerService(service)`                  | バックグラウンドサービス                                     |
| `api.registerInteractiveHandler(registration)`  | インタラクティブハンドラー                                   |
| `api.registerAgentToolResultMiddleware(...)`    | ランタイムツール結果ミドルウェア                             |
| `api.registerMemoryPromptSupplement(builder)`   | メモリに隣接する追加プロンプトセクション                     |
| `api.registerMemoryCorpusSupplement(adapter)`   | 追加のメモリ検索／読み取りコーパス                           |
| `api.registerHostedMediaResolver(resolver)`     | ブラウザ形式のホストメディア URL 用リゾルバー                |
| `api.registerTextTransforms(transforms)`        | Plugin が所有するプロンプト／メッセージ互換テキスト書き換え  |
| `api.registerConfigMigration(migrate)`          | Plugin ランタイム読み込み前に実行される軽量な設定移行        |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate` 用インポーター                             |
| `api.registerAutoEnableProbe(probe)`            | この Plugin を自動有効化できる設定プローブ                   |
| `api.registerReload(registration)`              | 再読み込み処理用の再起動／ホット／何もしない設定プレフィックポリシー |
| `api.registerNodeHostCommand(command)`          | ペアリング済み Node に公開されるコマンドハンドラー           |
| `api.registerNodeInvokePolicy(policy)`          | Node が呼び出すコマンドの許可リスト／承認ポリシー            |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit` 用の検出事項コレクター              |

メモリプロンプト補足ビルダーは、任意の `agentId`、`agentSessionKey`、および `sandboxed` コンテキストを受け取ります。メモリコーパス補足の `search` および `get` 呼び出しは、任意の `agentId` および `sandboxed` コンテキストを受け取ります。エージェント所有のストレージを持つ Plugin は、登録時に単一のグローバルパスを取り込むのではなく、呼び出しごとにそのストレージを解決する必要があります。マルチエージェント操作でエージェント ID が必要なのに欠けている場合は、任意のエージェントを選択せず、フェイルクローズしてください。

Telegram のインタラクティブハンドラーは `{ submitText }` を返すことで、ハンドラーが成功した後に Telegram の通常の受信エージェントパスを通じてテキストをルーティングできます。受信ポリシーによってテキストがスキップされた場合や処理に失敗した場合、OpenClaw はコールバックボタンを維持するため、ブロック条件が変わった後にユーザーが再試行できます。この結果フィールドは Telegram 固有です。他のチャネルは、それぞれ独自のインタラクティブ結果コントラクトを維持します。

### ワークフロー Plugin 用のホストフック

ホストフックは、プロバイダー、チャネル、またはツールを追加するだけでなく、ホストのライフサイクルに関与する必要がある Plugin のための SDK 境界です。これらは汎用コントラクトです。Plan Mode だけでなく、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI コンパニオン Plugin でも使用できます。

| メソッド                                                                             | 所有するコントラクト                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway セッションを通じて投影される、Plugin 所有の JSON 互換セッション状態                                                                               |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 1 つのセッションの次回エージェントターンに注入される、永続的かつ正確に 1 回だけのコンテキスト                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | ツールパラメーターをブロックまたは書き換えできる、マニフェストで制御された信頼済みの Plugin 前段ツールポリシー                                             |
| `api.registerToolMetadata(...)`                                                      | ツール実装を変更しないツールカタログ表示メタデータ                                                                                                         |
| `api.registerCommand(...)`                                                           | スコープ付き Plugin コマンド。コマンド結果では `continueAgent: true` または `suppressReply: true` を設定可能。Discord ネイティブコマンドは `descriptionLocalizations` をサポート |
| `api.session.controls.registerControlUiDescriptor(...)`                              | セッション、ツール、実行、設定、またはタブサーフェス向けの Control UI コントリビューション記述子                                                          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | リセット／削除／再読み込みパスで Plugin 所有のランタイムリソースを解放するためのクリーンアップコールバック                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | ワークフロー状態およびモニター向けのサニタイズ済みイベントサブスクリプション                                                                               |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 終端実行ライフサイクルでクリアされる実行単位の Plugin スクラッチ状態                                                                                        |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 所有のスケジューラージョブ用クリーンアップメタデータ。処理のスケジュールやタスクレコードの作成は行わない                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | バンドル版限定の、ホストを介したアクティブな直接送信セッションルートへのファイル添付配信                                                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | バンドル版限定の、Cron を基盤とするスケジュール済みセッションターンとタグベースのクリーンアップ                                                            |
| `api.session.controls.registerSessionAction(...)`                                    | クライアントが Gateway を通じてディスパッチできる型付きセッションアクション                                                                                |

`surface: "tab"` 記述子は、Control UI にサイドバータブを追加します。有効な Plugin のタブ記述子は、Gateway の hello（`controlUiTabs`）でダッシュボードクライアントに公開されるため、そのタブは Plugin が有効な間だけ表示されます。バンドル版 Plugin は、そのタブ用のファーストクラスのダッシュボードビューを同梱できます。他の Plugin は `path` に Plugin の HTTP ルート（`api.registerHttpRoute(...)` を参照）を設定でき、ダッシュボードはそれをサンドボックス化されたフレーム内にレンダリングします。`icon` はダッシュボードアイコン名のヒント、`group` はサイドバーセクション（`control` または `agent`）の選択、`order` は Plugin タブ間の並び順、`requiredScopes` は必要なオペレータースコープを持たない接続からタブを非表示にするためのものです。

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "ログブック",
  description: "画面スナップショットから構築された、タイムライン形式のあなたの一日。",
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

同等のフラットメソッドは、既存の Plugin 向けに非推奨の互換エイリアスとして引き続き利用できます。`api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn`、または `api.unscheduleSessionTurnsByTag` を直接呼び出す新しい Plugin コードを追加しないでください。

`scheduleSessionTurn(...)` は、Gateway の Cron スケジューラーに対するセッションスコープの便利なインターフェースです。Cron はタイミングを所有し、ターンの実行時にバックグラウンドタスクレコードを作成します。Plugin SDK は、対象セッション、Plugin 所有の命名、およびクリーンアップのみを制約します。処理自体に永続的な複数ステップの Task Flow 状態が必要な場合は、スケジュール済みターン内で `api.runtime.tasks.managedFlows` を使用してください。

これらのコントラクトは、意図的に権限を分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次回ターンへの注入、および通常のフックを所有できます。
- 信頼済みツールポリシーは、通常の `before_tool_call` フックより前に実行され、ホストから信頼されます。バンドル版ポリシーが最初に実行されます。インストール済み Plugin のポリシーには、明示的な有効化と `contracts.trustedToolPolicies` 内のローカル ID が必要であり、Plugin の読み込み順でその次に実行されます。ポリシー ID は、登録した Plugin のスコープ内に限定されます。
- 予約済みコマンドの所有権はバンドル版限定です。外部 Plugin は、独自のコマンド名またはエイリアスを使用する必要があります。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧式の `before_agent_start` からのプロンプトフィールド、および `enqueueNextTurnInjection` を含む、プロンプトを変更するフックを無効にします。

Plan 以外の利用例：

| Plugin のアーキタイプ         | 使用するフック                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー              | セッション拡張、コマンド継続、次ターンへの注入、UI 記述子                                                                              |
| 予算／ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッションプロジェクション                                                                    |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルのクリーンアップ、エージェントイベント購読、セッションスケジューラーの所有権／クリーンアップ、Heartbeat プロンプトへの寄与、UI 記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                                |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、
  常に `operator.admin` のままです。Plugin が所有するメソッドには、
  Plugin 固有のプレフィックスを使用してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用する場合">
  バンドルされた Plugin、および一致するマニフェスト契約を持ち、明示的に有効化された
  インストール済み Plugin は、実行後かつランタイムが結果をモデルへ返す前に
  ツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)`
  を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、
  信頼済みかつランタイムに依存しない接続点です。

Plugin は対象とするランタイムごとに
`contracts.agentToolResultMiddleware` を宣言する必要があります。たとえば
`["openclaw", "codex"]` です。その契約がない、または明示的に有効化されていない
インストール済み Plugin は、このミドルウェアを登録できません。モデルへ渡す前の
ツール結果処理タイミングを必要としない処理には、通常の OpenClaw Plugin フックを
使用してください。以前の埋め込みランナー専用の拡張ファクトリー登録パスは
削除されました。
</Accordion>

### Gateway ディスカバリーの登録

`api.registerGatewayDiscoveryService(...)` を使用すると、Plugin は mDNS/Bonjour
などのローカルディスカバリートランスポート上で、稼働中の Gateway を通知できます。
ローカルディスカバリーが有効な場合、OpenClaw は Gateway の起動時にこのサービスを
呼び出し、現在の Gateway ポートと機密情報ではない TXT ヒントデータを渡します。
また、Gateway のシャットダウン時には返された `stop` ハンドラーを呼び出します。

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

Gateway ディスカバリー Plugin は、通知される TXT 値をシークレットや認証として
扱ってはなりません。ディスカバリーはルーティングのヒントです。信頼の確立は引き続き
Gateway 認証と TLS ピンニングが担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、次の 2 種類のコマンドメタデータを受け付けます。

- `commands`: レジストラーが所有する明示的なコマンド名
- `descriptors`: CLI ヘルプ、ルーティング、Plugin CLI の遅延登録に使用する解析時コマンド記述子
- `parentPath`: `["nodes"]` など、ネストされたコマンドグループ用のオプションの親コマンドパス

ペアリング済み Node の機能には、
`api.registerNodeCliFeature(registrar, opts?)` を使用してください。これは
`api.registerCli(..., { parentPath: ["nodes"] })` の小さなラッパーであり、
`openclaw nodes canvas` のようなコマンドが、Plugin が所有する明示的な Node 機能で
あることを示します。

Plugin コマンドを通常のルート CLI パスで遅延読み込みのままにする場合は、
そのレジストラーが公開するすべてのトップレベルコマンドルートを網羅する
`descriptors` を指定してください。

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
        description: "Matrix のアカウント、検証、デバイス、プロファイル状態を管理する",
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
        description: "ペアリング済み Node からキャンバスコンテンツをキャプチャまたはレンダリングする",
        hasSubcommands: true,
      },
    ],
  },
);
```

ルート CLI の遅延登録が不要な場合に限り、`commands` を単独で使用してください。
この先行読み込み互換パスは引き続きサポートされますが、解析時の遅延読み込み用に
記述子を基にしたプレースホルダーはインストールされません。

### CLI バックエンドの登録

`api.registerCliBackend(...)` を使用すると、Plugin は `claude-cli` や `my-cli`
などのローカル AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`my-cli/gpt-5` のようなモデル参照におけるプロバイダープレフィックスになります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形式を使用します。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、
  `agents.defaults.cliBackends.<id>` を Plugin のデフォルトに上書きマージします。
- バックエンドでマージ後に互換性のための書き換えが必要な場合は、
  `normalizeConfig` を使用します（たとえば、古いフラグ形式の正規化）。
- OpenClaw の思考レベルをネイティブの effort フラグへマッピングするなど、
  CLI 方言に属するリクエスト単位の argv 書き換えには、`resolveExecutionArgs` を
  使用します。このフックは `ctx.executionMode` を受け取ります。一時的な `/btw`
  呼び出しにバックエンドネイティブの分離フラグを追加するには、`"side-question"`
  を使用してください。通常は常に有効な CLI のネイティブツールをそれらのフラグで
  確実に無効化できる場合は、`sideQuestionToolMode: "disabled"` も宣言してください。
- 特定の実行ですべてのネイティブツールを無効化できるバックエンドは、
  `nativeToolMode: "selectable"` を宣言できます。制限付き呼び出しでは、空の
  `ctx.toolAvailability.native` タプルと、ホストによって厳密に分離された MCP
  許可リストが渡されます。`resolveExecutionArgs` は、新規実行または再開時の最終
  argv に対して、その両方を強制する必要があります。バックエンドがこれを実行できない
  場合、OpenClaw はフェイルクローズします。

エンドツーエンドの作成ガイドについては、
[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)を参照してください。

### 排他的スロット

| メソッド                                     | 登録内容                                                                                                                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つのみ有効）。ホストがモデル／プロバイダー／モードの診断情報を提供できる場合、ライフサイクルコールバックは `runtimeSettings` を受け取ります。古い厳格なエンジンでは、そのキーを除外して再試行します。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                                                      |

### 非推奨のメモリ埋め込みアダプター

| メソッド                                         | 登録内容                                  |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 有効な Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他的メモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` を公開することもでき、
  これにより関連 Plugin は、特定のメモリ Plugin の非公開レイアウトへ直接アクセスせずに、
  `openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされたメモリアーティファクトを
  利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリ Plugin API です。
- `MemoryFlushPlan.model` は、有効なフォールバックチェーンを継承せずに、フラッシュターンを
  `ollama/qwen3:8b` のような正確な `provider/model` 参照へ固定できます。
- `registerMemoryEmbeddingProvider` は非推奨です。新しい埋め込みプロバイダーは、
  `api.registerEmbeddingProvider(...)` と `contracts.embeddingProviders` を
  使用してください。
- 既存のメモリ固有プロバイダーは移行期間中も引き続き動作しますが、Plugin の検査では、
  バンドルされていない Plugin に対してこれを互換性上の負債として報告します。

### イベントとライフサイクル

| メソッド                                       | 動作                              |
| -------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック          |
| `api.onConversationBindingResolved(handler)` | 会話バインディングのコールバック     |

例、一般的なフック名、ガードのセマンティクスについては、
[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

### フックの判定セマンティクス

`before_install` は Plugin ランタイムのライフサイクルフックであり、オペレーターの
インストールポリシーサーフェスではありません。許可／ブロックの判定を CLI および
Gateway 経由のインストールまたは更新パスに適用する必要がある場合は、
`security.installPolicy` を使用してください。

- `before_tool_call`: `{ block: true }` を返すと処理が確定します。いずれかのハンドラーがこれを設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返しても上書きとは見なされず、判断なし（`block` の省略と同じ）として扱われます。
- `before_install`: `{ block: true }` を返すと処理が確定します。いずれかのハンドラーがこれを設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返しても上書きとは見なされず、判断なし（`block` の省略と同じ）として扱われます。
- `reply_dispatch`: `{ handled: true, ... }` を返すと処理が確定します。いずれかのハンドラーがディスパッチを引き受けると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと処理が確定します。いずれかのハンドラーがこれを設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返しても上書きとは見なされず、判断なし（`cancel` の省略と同じ）として扱われます。
- `message_received`: 受信スレッド／トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用します。`metadata` はチャネル固有の追加情報用に保持してください。
- `message_sending`: チャネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用します。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使用します。この時点では Cron がまだ読み込み中の場合があります。
- `cron_reconciled`: 起動後またはスケジューラーの再読み込み後に、外部 Cron の完全なプロジェクションを再構築します。これには `reason` と、`enabled: false` を含む実効的な `enabled` 状態が含まれ、`ctx.getCron?.()` は調整済みの正確なスケジューラーを返します。永続的なプロジェクション処理には `ctx.abortSignal` を渡してください。そのスケジューラースナップショットが置き換えられるか、Gateway が終了すると中止されます。
- `cron_changed`: Gateway が所有する Cron ライフサイクルの変更を監視します。`scheduled` イベントと `removed` イベントはコミット後の調整ヒントであり、順序付きの差分ログではありません。ジョブに次回の起動がない場合、scheduled イベントの `event.nextRunAtMs` は存在しません。removed イベントには、削除されたジョブのスナップショットが引き続き含まれます。

外部ウェイクスケジューラーは `cron_changed` イベントをデバウンスまたは統合してから、
`cron_reconciled` が最後に取得したスケジューラーから永続ビュー全体を
再読み込みする必要があります。`cron_changed` のコンテキストからスケジューラーを採用しないでください。
古いスケジューラーから切り離されたヒントが、後続の再読み込みと重なる可能性があります。

Gateway の起動時またはスケジューラーの置き換え時に読み込まれる永続状態については、
完全なスナップショットのトリガーとして `cron_reconciled` を使用します。Plugin のみの
ホットリロードでは再実行されません。監視ハンドラーは並列に実行され、fire-and-forget の
ディスパッチは重なる可能性があるため、コンシューマーはイベントの完了順序に依存してはなりません。
期限判定と実行の信頼できる情報源は OpenClaw のままにしてください。

永続的な置き換え、再試行／バックオフ、正常なシャットダウンを備えたシングルフライトアダプターについては、
[安全な外部 Cron プロジェクション](/ja-JP/plugins/hooks#safe-external-cron-projection)を参照してください。

### API オブジェクトのフィールド

| フィールド               | 型                        | 説明                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | 表示名                                                                                      |
| `api.version`            | `string?`                 | Plugin のバージョン（省略可能）                                                             |
| `api.description`        | `string?`                 | Plugin の説明（省略可能）                                                                   |
| `api.source`             | `string`                  | Plugin のソースパス                                                                         |
| `api.rootDir`            | `string?`                 | Plugin のルートディレクトリ（省略可能）                                                     |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合は、アクティブなメモリ内ランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` から取得した Plugin 固有の設定                                |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は完全なエントリを読み込む前の軽量な起動／セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                           |

## 内部モジュールの規則

Plugin 内の内部インポートには、ローカルのバレルファイルを使用します。

```text
my-plugin/
  api.ts            # 外部コンシューマー向けの公開エクスポート
  runtime-api.ts    # 内部専用のランタイムエクスポート
  index.ts          # Plugin のエントリポイント
  setup-entry.ts    # セットアップ専用の軽量エントリ（省略可能）
```

<Warning>
  本番コードから自身の Plugin を `openclaw/plugin-sdk/<your-plugin>`
  経由でインポートしないでください。内部インポートは `./api.ts` または
  `./runtime-api.ts` を経由させてください。SDK パスは外部向けの契約にのみ使用します。
</Warning>

ファサード経由で読み込まれる同梱 Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。
ランタイムスナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルに
フォールバックします。パッケージ化された同梱 Plugin のファサードは、OpenClaw の Plugin
ファサードローダーを介して読み込む必要があります。`dist/extensions/...` から直接インポートすると、
パッケージインストールが Plugin 所有コードに対して使用するマニフェストおよびランタイムサイドカーの
チェックがバイパスされます。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合に、限定的な Plugin ローカル契約バレルを公開できます。同梱されている例:

- **Anthropic**: Claude のベータヘッダーおよび `service_tier`
  ストリームヘルパー向けの公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、
  デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加えて、
  オンボーディング／設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードでも、`openclaw/plugin-sdk/<other-plugin>`
  からのインポートを避ける必要があります。ヘルパーが本当に共有されるものなら、2 つの Plugin を
  結合するのではなく、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  機能指向サーフェスなど、中立的な SDK サブパスに昇格させてください。
</Warning>

## 関連項目

<CardGroup cols={2}>
  <Card title="エントリポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` と `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="ランタイムヘルパー" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` 名前空間の完全なリファレンス。
  </Card>
  <Card title="セットアップと設定" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージ化、マニフェスト、設定スキーマ。
  </Card>
  <Card title="テスト" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティと lint ルール。
  </Card>
  <Card title="SDK の移行" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin の内部構造" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
