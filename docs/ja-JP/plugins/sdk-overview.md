---
read_when:
    - どの SDK サブパスからインポートするかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドに関するリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-04-30T05:27:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付き契約です。このページは、**何をインポートするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能には、代わりに [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) と `@openclaw/sdk` パッケージを使用してください。
</Note>

<Tip>
代わりにハウツーガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins) から始め、チャネル Plugin には [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)、プロバイダー Plugin には [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)、ツールまたはライフサイクルフック Plugin には [Plugin フック](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャネル固有のエントリ/ビルドヘルパーには `openclaw/plugin-sdk/channel-core` を優先し、より広い包括的なサーフェスと `buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使用してください。

チャネル設定では、チャネルが所有する JSON Schema を `openclaw.plugin.json#channelConfigs` 経由で公開します。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw のバンドル Plugin は、保持されているバンドルチャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換エクスポートは `plugin-sdk/channel-config-schema-legacy` に残っています。どちらのバンドルスキーマサブパスも、新しい Plugin のパターンではありません。

<Warning>
  プロバイダーまたはチャネル名を冠した便利なつなぎ目（たとえば `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。バンドル Plugin は、それぞれの `api.ts` / `runtime-api.ts` バレル内で汎用 SDK サブパスを合成します。コアの利用側は、それらの Plugin ローカルなバレルを使用するか、必要性が本当にクロスチャネルである場合にだけ狭い汎用 SDK 契約を追加してください。

所有者による利用が追跡されている場合、少数のバンドル Plugin ヘルパーのつなぎ目は生成されたエクスポートマップにまだ表示されます。これらはバンドル Plugin のメンテナンス専用であり、新しいサードパーティ Plugin に推奨されるインポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡されている所有者利用のための非推奨の互換ファサードとして保持されています。これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みバンドル Plugin ヘルパー）ごとにグループ化された狭いサブパスの集合として公開されます。グループ化されリンクされた完全なカタログについては、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths) を参照してください。

生成された 200 以上のサブパス一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### ケイパビリティ登録

| メソッド                                         | 登録する内容                            |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                    |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器     |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド           |
| `api.registerChannel(...)`                       | メッセージングチャネル                  |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成            |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし   |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション       |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析                     |
| `api.registerImageGenerationProvider(...)`       | 画像生成                                |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                                |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                                |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイピングプロバイダー  |
| `api.registerWebSearchProvider(...)`             | Web 検索                                |

### ツールとコマンド

| メソッド                       | 登録する内容                                      |
| ------------------------------ | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM を迂回）                   |

Plugin コマンドは、エージェントに短いコマンド所有のルーティングヒントが必要な場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体に関する内容に留め、プロバイダーまたは Plugin 固有のポリシーをコアのプロンプトビルダーに追加しないでください。

### インフラストラクチャ

| メソッド                                       | 登録する内容                                |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                        |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway 検出アドバタイザー         |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                            |
| `api.registerService(service)`                 | バックグラウンドサービス                    |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー                  |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムのツール結果ミドルウェア          |
| `api.registerMemoryPromptSupplement(builder)`  | 追加的なメモリ隣接プロンプトセクション      |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加的なメモリ検索/読み取りコーパス         |

### ワークフロー Plugin 向けホストフック

ホストフックは、プロバイダー、チャネル、ツールの追加だけでなく、ホストのライフサイクルに参加する必要がある Plugin のための SDK のつなぎ目です。これらは汎用契約です。Plan Mode も使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI 連携 Plugin も使用できます。

| メソッド                                                                 | 所有する契約                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway セッションを通じて投影される、Plugin 所有の JSON 互換セッション状態            |
| `api.enqueueNextTurnInjection(...)`                                      | 1 セッションの次のエージェントターンへ注入される、永続的で厳密に 1 回のコンテキスト   |
| `api.registerTrustedToolPolicy(...)`                                     | ツールパラメーターをブロックまたは書き換えられる、バンドル/信頼済みの Plugin 前ツールポリシー |
| `api.registerToolMetadata(...)`                                          | ツール実装を変更しないツールカタログ表示メタデータ                                      |
| `api.registerCommand(...)`                                               | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` を設定可能          |
| `api.registerControlUiDescriptor(...)`                                   | セッション、ツール、実行、設定サーフェス用の Control UI コントリビューション記述子     |
| `api.registerRuntimeLifecycle(...)`                                      | リセット/削除/リロードパス上の Plugin 所有ランタイムリソースのクリーンアップコールバック |
| `api.registerAgentEventSubscription(...)`                                | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション               |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 終端実行ライフサイクルでクリアされる、実行単位の Plugin スクラッチ状態                 |
| `api.registerSessionSchedulerJob(...)`                                   | 決定論的クリーンアップを伴う、Plugin 所有のセッションスケジューラージョブレコード     |

これらの契約は、意図的に権限を分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホスト安全性ポリシーに参加するためバンドル専用です。
- 予約済みコマンド所有権はバンドル専用です。外部 Plugin は独自のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` のプロンプトフィールド、`enqueueNextTurnInjection` を含む、プロンプトを変更するフックを無効化します。

Plan 以外の利用例:

| Plugin アーキタイプ        | 使用されるフック                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー           | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                                              |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                          |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、Heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                            |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有メソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用する場合">
  バンドル Plugin は、ツール実行後、ランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼済みかつランタイム中立なつなぎ目です。

バンドル Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。例: `["pi", "codex"]`。外部 Plugin はこのミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使用してください。古い Pi 専用の埋め込み拡張ファクトリー登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` により、Plugin は mDNS/Bonjour などのローカル検出トランスポート上でアクティブな Gateway を通知できます。ローカル検出が有効な場合、OpenClaw は Gateway 起動中にサービスを呼び出し、現在の Gateway ポートと非シークレットの TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway 検出 Plugin は、通知された TXT 値をシークレットや
認証として扱ってはなりません。検出はルーティングのヒントです。信頼は引き続き Gateway 認証と TLS ピン留めが担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け取ります。

- `commands`: レジストラが所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、
  ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンドディスクリプタ

通常のルート CLI パスで Plugin コマンドを遅延ロードのままにしたい場合は、
そのレジストラが公開するすべてのトップレベルコマンドルートをカバーする
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` だけを使用するのは、遅延ルート CLI 登録が不要な場合に限ってください。
その積極的な互換パスは引き続きサポートされますが、解析時の遅延ロード用に
ディスクリプタに基づくプレースホルダーはインストールされません。

### CLI バックエンド登録

`api.registerCliBackend(...)` を使用すると、Plugin が `codex-cli` などのローカル
AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のようなモデル参照におけるプロバイダープレフィックスになります。
- バックエンドの `config` は、`agents.defaults.cliBackends.<id>` と同じ形状を使用します。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、
  `agents.defaults.cliBackends.<id>` を Plugin のデフォルトの上にマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、
  `normalizeConfig` を使用してください（たとえば古いフラグ形状の正規化）。

### 排他スロット

| メソッド                                   | 登録するもの                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                 |

### メモリ埋め込みアダプター

| メソッド                                       | 登録するもの                                   |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他的なメモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できます。
  これにより、コンパニオン Plugin は特定の
  メモリ Plugin のプライベートレイアウトに踏み込む代わりに、
  `openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的なメモリ Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバックチェーンを継承せずに、
  `ollama/qwen3:8b` などの正確な `provider/model`
  参照へフラッシュターンを固定できます。
- `registerMemoryEmbeddingProvider` を使用すると、アクティブなメモリ Plugin が
  1 つ以上の埋め込みアダプター ID（たとえば `openai`、`gemini`、またはカスタムの
  Plugin 定義 ID）を登録できます。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` などのユーザー設定は、それらの登録済み
  アダプター ID に対して解決されます。

### イベントとライフサイクル

| メソッド                                     | 実行すること                   |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック     |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

### フック決定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、決定なし（`block` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、決定なし（`block` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーがディスパッチを要求すると、低優先度のハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーが設定すると、低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、決定なし（`cancel` を省略した場合と同じ）として扱われ、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの `threadId` フィールドを使用してください。チャンネル固有の追加情報には `metadata` を使用してください。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用してください。
- `gateway_start`: 内部の `gateway:startup` フックに依存するのではなく、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、および `ctx.getCron?.()` を使用してください。
- `cron_changed`: Gateway が所有する Cron ライフサイクルの変更を監視します。外部ウェイクスケジューラを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使用し、期限チェックと実行の信頼できる情報源は OpenClaw にしてください。

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
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は、完全なエントリ前の軽量な起動/セットアップ期間です |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートを基準にパスを解決します                                                        |

## 内部モジュール規約

Plugin 内では、内部インポートにローカルバレルファイルを使用してください。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` を通じて自分の Plugin を
  インポートしてはなりません。内部インポートは `./api.ts` または
  `./runtime-api.ts` を通じてルーティングしてください。SDK パスは外部契約専用です。
</Warning>

ファサードでロードされるバンドル済み Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および類似の公開エントリファイル）は、
OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。ランタイム
スナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化されたバンドル済み Plugin ファサードは、OpenClaw の Plugin
ファサードローダーを通じてロードする必要があります。`dist/extensions/...` から直接インポートすると、
パッケージ化されたインストールが Plugin 所有の依存関係に使用する段階的なランタイム
依存関係ミラーをバイパスします。

ヘルパーが意図的にプロバイダー固有で、まだ汎用 SDK
サブパスに属さない場合、プロバイダー Plugin は狭い Plugin ローカル契約バレルを公開できます。
バンドル済みの例:

- **Anthropic**: Claude
  beta-header と `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、
  デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーと、
  オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  拡張機能の本番コードでも、`openclaw/plugin-sdk/<other-plugin>`
  のインポートは避けるべきです。ヘルパーが本当に共有されるものなら、2 つの Plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  機能指向サーフェスのような中立的な SDK サブパスに昇格させてください。
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
