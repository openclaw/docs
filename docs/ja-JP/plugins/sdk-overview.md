---
read_when:
    - どの SDK サブパスからインポートするかを把握しておく必要があります
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要な場合
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、および SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-05-04T18:24:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付き契約です。このページは、
**何をインポートするか**、および **何を登録できるか** のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。
  Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、
  CI ジョブ、IDE 拡張機能には、代わりに
  [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) と `@openclaw/sdk` パッケージを使用してください。
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

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、
循環依存の問題を防ぎます。チャネル固有のエントリ/ビルドヘルパーには
`openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的なサーフェスと、
`buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使用してください。

チャネル設定では、チャネル所有の JSON Schema を
`openclaw.plugin.json#channelConfigs` 経由で公開してください。`plugin-sdk/channel-config-schema`
サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw の
バンドル Plugin は、保持されたバンドルチャネルスキーマに
`plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性エクスポートは
`plugin-sdk/channel-config-schema-legacy` に残っています。どちらのバンドルスキーマサブパスも、
新しい Plugin のパターンではありません。

<Warning>
  プロバイダー名やチャネル名を冠した便利なシーム（例:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`）
  はインポートしないでください。バンドル Plugin は、自身の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを組み合わせます。コア利用側は、
  それらの Plugin ローカルのバレルを使用するか、必要性が本当に
  クロスチャネルである場合に狭い汎用 SDK 契約を追加してください。

所有者による使用が追跡されている場合、少数のバンドル Plugin ヘルパーシームが、
生成されたエクスポートマップにまだ表示されます。これらはバンドル Plugin の
メンテナンス専用であり、新しいサードパーティ Plugin の推奨インポートパスではありません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、
追跡されている所有者使用向けの非推奨互換性ファサードとして保持されています。
これらのインポートパスを新しい Plugin にコピーしないでください。代わりに、
注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、
Capability、メモリ、予約済みバンドル Plugin ヘルパー）ごとにグループ化された、
狭いサブパス群として公開されています。グループ化されリンクされた完全なカタログについては、
[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths) を参照してください。

生成された 200 個以上のサブパスの一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### Capability 登録

| メソッド                                         | 登録するもの                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                  |
| `api.registerAgentHarness(...)`                  | 実験的な低レベルエージェント実行器 |
| `api.registerCliBackend(...)`                    | ローカル CLI 推論バックエンド       |
| `api.registerChannel(...)`                       | メッセージングチャネル              |
| `api.registerSpeechProvider(...)`                | テキスト読み上げ / STT 合成         |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミングリアルタイム文字起こし |
| `api.registerRealtimeVoiceProvider(...)`         | 双方向リアルタイム音声セッション    |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画分析                  |
| `api.registerImageGenerationProvider(...)`       | 画像生成                            |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                            |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                            |
| `api.registerWebFetchProvider(...)`              | Web 取得 / スクレイププロバイダー   |
| `api.registerWebSearchProvider(...)`             | Web 検索                            |

### ツールとコマンド

| メソッド                       | 登録するもの                                  |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）             |

Plugin コマンドは、エージェントに短いコマンド所有のルーティングヒントが必要な場合、
`agentPromptGuidance` を設定できます。そのテキストはコマンド自体に関する内容に留めてください。
プロバイダー固有または Plugin 固有のポリシーをコアのプロンプトビルダーに追加しないでください。

### インフラストラクチャ

| メソッド                                      | 登録するもの                            |
| --------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                          |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント             |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                    |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway 検出アドバタイザー     |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                        |
| `api.registerService(service)`                 | バックグラウンドサービス                |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー              |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムのツール結果ミドルウェア      |
| `api.registerMemoryPromptSupplement(builder)`  | 追加型のメモリ隣接プロンプトセクション  |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加型のメモリ検索/読み取りコーパス     |

### ワークフロー Plugin 用のホストフック

ホストフックは、プロバイダー、チャネル、またはツールを追加するだけでなく、
ホストのライフサイクルに参加する必要がある Plugin のための SDK シームです。これらは
汎用契約です。Plan Mode でも使用できますが、承認ワークフロー、ワークスペースポリシーゲート、
バックグラウンドモニター、セットアップウィザード、UI コンパニオン Plugin でも使用できます。

| メソッド                                                                 | 所有する契約                                                                                                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin 所有の、JSON 互換セッション状態を Gateway セッション経由で投影                                                              |
| `api.enqueueNextTurnInjection(...)`                                      | 1 つのセッションの次のエージェントターンに注入される、永続的で厳密に 1 回のコンテキスト                                            |
| `api.registerTrustedToolPolicy(...)`                                     | ツールパラメーターをブロックまたは書き換えできる、バンドル/信頼済みのプレ Plugin ツールポリシー                                    |
| `api.registerToolMetadata(...)`                                          | ツール実装を変更せずに表示するツールカタログメタデータ                                                                              |
| `api.registerCommand(...)`                                               | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` を設定可能。Discord ネイティブコマンドは `descriptionLocalizations` をサポート |
| `api.registerControlUiDescriptor(...)`                                   | セッション、ツール、実行、または設定サーフェス向けの Control UI コントリビューション記述子                                         |
| `api.registerRuntimeLifecycle(...)`                                      | リセット/削除/再読み込みパスでの Plugin 所有ランタイムリソースのクリーンアップコールバック                                         |
| `api.registerAgentEventSubscription(...)`                                | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                           |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 終端実行ライフサイクルでクリアされる実行単位の Plugin スクラッチ状態                                                               |
| `api.registerSessionSchedulerJob(...)`                                   | 決定的なクリーンアップを伴う Plugin 所有セッションスケジューラージョブレコード                                                     |

これらの契約は、意図的に権限を分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、
  次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、
  ホスト安全性ポリシーに関与するためバンドル専用です。
- 予約済みコマンド所有権はバンドル専用です。外部 Plugin は、
  自身のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、
  `before_prompt_build`、`heartbeat_prompt_contribution`、レガシー
  `before_agent_start` のプロンプトフィールド、および
  `enqueueNextTurnInjection` を含む、プロンプトを変更するフックを無効化します。

Plan 以外の利用者の例:

| Plugin アーキタイプ          | 使用するフック                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 承認ワークフロー             | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                                               |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                             |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みコア管理名前空間（`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、
  常に `operator.admin` のままです。Plugin 所有メソッドには
  Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="ツール結果ミドルウェアを使用するタイミング">
  バンドル Plugin は、ツール実行後、ランタイムがその結果をモデルへ戻す前に
  ツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)`
  を使用できます。これは tokenjuice などの非同期出力リデューサー向けの、
  信頼済みでランタイム中立のシームです。

バンドル Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。
例: `["pi", "codex"]`。外部 Plugin はこのミドルウェアを登録できません。
モデル前のツール結果タイミングを必要としない作業には、通常の OpenClaw Plugin フックを使い続けてください。
古い Pi 専用の埋め込み拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` により、Plugin は mDNS/Bonjour のようなローカル探索トランスポート上で、アクティブな Gateway を通知できます。OpenClaw は、ローカル探索が有効な場合に Gateway 起動中にこのサービスを呼び出し、現在の Gateway ポートと秘密ではない TXT ヒントデータを渡し、Gateway シャットダウン中に返された `stop` ハンドラーを呼び出します。

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

Gateway 探索 Plugin は、通知された TXT 値をシークレットや認証として扱ってはいけません。探索はルーティングのヒントです。信頼は引き続き Gateway 認証と TLS ピン留めが担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、トップレベルのメタデータを 2 種類受け取ります。

- `commands`: registrar が所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、ルーティング、遅延 Plugin CLI 登録に使われる解析時コマンド記述子

通常のルート CLI パスで Plugin コマンドを遅延ロードのままにしたい場合は、その registrar が公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定してください。

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

遅延ルート CLI 登録が不要な場合にのみ、`commands` を単独で使用してください。この積極的な互換パスは引き続きサポートされますが、解析時の遅延ロード用に記述子ベースのプレースホルダーはインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` により、Plugin は `codex-cli` のようなローカル AI CLI バックエンドのデフォルト設定を所有できます。

- バックエンドの `id` は、`codex-cli/gpt-5` のようなモデル参照内のプロバイダープレフィックスになります。
- バックエンドの `config` は `agents.defaults.cliBackends.<id>` と同じ形を使います。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、`agents.defaults.cliBackends.<id>` を Plugin のデフォルトの上にマージします。
- バックエンドがマージ後に互換性のための書き換えを必要とする場合は、`normalizeConfig` を使います（たとえば古いフラグ形状の正規化）。
- OpenClaw の思考レベルをネイティブの effort フラグにマッピングするなど、CLI 方言に属するリクエスト単位の argv 書き換えには `resolveExecutionArgs` を使います。

### 排他的スロット

| Method                                     | 登録内容                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン（一度に 1 つだけアクティブ）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合メモリー機能                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | メモリープロンプトセクションビルダー                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | メモリーフラッシュ計画リゾルバー                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | メモリーランタイムアダプター                                                                                                                           |

### メモリー埋め込みアダプター

| Method                                         | 登録内容                                      |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin 用のメモリー埋め込みアダプター |

- `registerMemoryCapability` は、推奨される排他的なメモリー Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、コンパニオン Plugin は特定のメモリー Plugin のプライベートなレイアウトに踏み込まずに、`openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされたメモリー成果物を利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、`registerMemoryRuntime` は、レガシー互換の排他的なメモリー Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバックチェーンを継承せずに、フラッシュターンを `ollama/qwen3:8b` のような正確な `provider/model` 参照に固定できます。
- `registerMemoryEmbeddingProvider` により、アクティブなメモリー Plugin は 1 つ以上の埋め込みアダプター ID（たとえば `openai`、`gemini`、またはカスタムの Plugin 定義 ID）を登録できます。
- `agents.defaults.memorySearch.provider` や `agents.defaults.memorySearch.fallback` などのユーザー設定は、これらの登録済みアダプター ID に対して解決されます。

### イベントとライフサイクル

| Method                                       | 動作                         |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック   |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks)を参照してください。

### フック判定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端になります。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すと、判定なしとして扱われます（`block` を省略した場合と同じ）。上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端になります。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すと、判定なしとして扱われます（`block` を省略した場合と同じ）。上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端になります。いずれかのハンドラーがディスパッチを引き受けると、優先度の低いハンドラーとデフォルトのモデルディスパッチパスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端になります。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すと、判定なしとして扱われます（`cancel` を省略した場合と同じ）。上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使います。チャンネル固有の追加情報には `metadata` を残してください。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使います。
- `gateway_start`: 内部の `gateway:startup` フックに依存せず、Gateway 所有の起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使います。
- `cron_changed`: Gateway 所有の Cron ライフサイクル変更を監視します。外部のウェイクスケジューラーを同期する場合は `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使い、期限チェックと実行の信頼できる情報源は OpenClaw に保ちます。

### API オブジェクトフィールド

| Field                    | Type                      | 説明                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin ID                                                                                  |
| `api.name`               | `string`                  | 表示名                                                                                     |
| `api.version`            | `string?`                 | Plugin バージョン（任意）                                                                  |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                      |
| `api.source`             | `string`                  | Plugin ソースパス                                                                          |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ（任意）                                                          |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット（利用可能な場合はアクティブなインメモリーランタイムスナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                       |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー（`debug`、`info`、`warn`、`error`）                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在のロードモード。`"setup-runtime"` は軽量なフルエントリー前の起動/セットアップ期間       |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                          |

## 内部モジュール規約

Plugin 内部では、内部インポートにローカルのバレルファイルを使います。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` 経由で自分の Plugin をインポートしてはいけません。内部インポートは `./api.ts` または `./runtime-api.ts` 経由でルーティングしてください。SDK パスは外部契約専用です。
</Warning>

ファサードで読み込まれるバンドル済み Plugin の公開サーフェス（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts`、および類似の公開エントリーファイル）は、OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。ランタイムスナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。パッケージ化されたバンドル済み Plugin ファサードは、OpenClaw の Plugin ファサードローダーを通じて読み込む必要があります。`dist/extensions/...` からの直接インポートは、パッケージ化されたインストールが Plugin 所有コードに使用するマニフェストとランタイムサイドカーチェックを迂回します。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK サブパスに属さない場合に、狭い Plugin ローカル契約バレルを公開できます。バンドル済みの例:

- **Anthropic**: Claude ベータヘッダーと `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` 境界。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダーに加え、オンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  Extension の本番コードも、`openclaw/plugin-sdk/<other-plugin>` インポートを避ける必要があります。ヘルパーが本当に共有されるものなら、2 つの Plugin を結合するのではなく、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の機能指向サーフェスのような中立的な SDK サブパスへ昇格してください。
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
