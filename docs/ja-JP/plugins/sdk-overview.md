---
read_when:
    - どの SDK サブパスからインポートするかを把握しておく必要があります。
    - OpenClawPluginApi のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK エクスポートを調べています
sidebarTitle: Plugin SDK overview
summary: インポートマップ、登録 API リファレンス、SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-05-02T05:02:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK は、Plugin とコアの間の型付き契約です。このページは、**何をインポートするか**、および**何を登録できるか**のリファレンスです。

<Note>
  このページは、OpenClaw 内で `openclaw/plugin-sdk/*` を使用する Plugin 作者向けです。Gateway 経由でエージェントを実行したい外部アプリ、スクリプト、ダッシュボード、CI ジョブ、IDE 拡張機能では、代わりに
  [OpenClaw App SDK](/ja-JP/concepts/openclaw-sdk) と `@openclaw/sdk` パッケージを使用してください。
</Note>

<Tip>
ハウツーガイドを探していますか？[Plugin の構築](/ja-JP/plugins/building-plugins) から始め、チャネル Plugin には [Channel plugins](/ja-JP/plugins/sdk-channel-plugins)、プロバイダー Plugin には [Provider plugins](/ja-JP/plugins/sdk-provider-plugins)、ツールまたはライフサイクルフックの Plugin には [Plugin hooks](/ja-JP/plugins/hooks) を使用してください。
</Tip>

## インポート規約

常に特定のサブパスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速に保たれ、循環依存の問題を防げます。チャネル固有のエントリ/ビルドヘルパーには、`openclaw/plugin-sdk/channel-core` を優先してください。より広い包括的なサーフェスや `buildChannelConfigSchema` などの共有ヘルパーには `openclaw/plugin-sdk/core` を使用してください。

チャネル設定では、チャネル所有の JSON Schema を `openclaw.plugin.json#channelConfigs` を通じて公開してください。`plugin-sdk/channel-config-schema` サブパスは、共有スキーマプリミティブと汎用ビルダー用です。OpenClaw の同梱 Plugin は、保持される同梱チャネルスキーマに `plugin-sdk/bundled-channel-config-schema` を使用します。非推奨の互換性エクスポートは `plugin-sdk/channel-config-schema-legacy` に残っています。同梱スキーマのどちらのサブパスも、新しい Plugin のパターンではありません。

<Warning>
  プロバイダーまたはチャネル名を冠した便利な継ぎ目（たとえば
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）をインポートしないでください。
  同梱 Plugin は、自身の `api.ts` /
  `runtime-api.ts` バレル内で汎用 SDK サブパスを合成します。コアの利用者は、それらの Plugin ローカルなバレルを使用するか、必要性が本当にチャネル横断である場合にのみ狭い汎用 SDK 契約を追加してください。

所有者による使用を追跡している場合、少数の同梱 Plugin ヘルパーの継ぎ目が生成されたエクスポートマップにまだ表示されます。これらは同梱 Plugin のメンテナンス専用であり、新しいサードパーティ Plugin のインポートパスとしては推奨されません。

`openclaw/plugin-sdk/discord` と `openclaw/plugin-sdk/telegram-account` も、追跡済みの所有者使用向けの非推奨互換ファサードとして保持されています。これらのインポートパスを新しい Plugin にコピーしないでください。代わりに注入されたランタイムヘルパーと汎用チャネル SDK サブパスを使用してください。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域（Plugin エントリ、チャネル、プロバイダー、認証、ランタイム、ケイパビリティ、メモリ、予約済みの同梱 Plugin ヘルパー）ごとにまとめられた狭いサブパスの集合として公開されます。グループ化されリンクされた完全なカタログについては、
[Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths) を参照してください。

200 以上のサブパスからなる生成済みリストは、`scripts/lib/plugin-sdk-entrypoints.json` にあります。

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
| `api.registerWebFetchProvider(...)`              | Web フェッチ / スクレイププロバイダー           |
| `api.registerWebSearchProvider(...)`             | Web 検索                            |

### ツールとコマンド

| メソッド                          | 登録するもの                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェントツール（必須または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパス）             |

Plugin コマンドは、エージェントがコマンド所有の短いルーティングヒントを必要とする場合に `agentPromptGuidance` を設定できます。そのテキストはコマンド自体についての内容にとどめてください。プロバイダーまたは Plugin 固有のポリシーをコアのプロンプトビルダーに追加しないでください。

### インフラストラクチャ

| メソッド                                         | 登録するもの                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | イベントフック                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP エンドポイント                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC メソッド                      |
| `api.registerGatewayDiscoveryService(service)` | ローカル Gateway 検出アドバタイザー      |
| `api.registerCli(registrar, opts?)`            | CLI サブコマンド                          |
| `api.registerService(service)`                 | バックグラウンドサービス                      |
| `api.registerInteractiveHandler(registration)` | インタラクティブハンドラー                     |
| `api.registerAgentToolResultMiddleware(...)`   | ランタイムのツール結果ミドルウェア          |
| `api.registerMemoryPromptSupplement(builder)`  | 追加型のメモリ隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)`  | 追加型のメモリ検索/読み取りコーパス      |

### ワークフロー Plugin 向けホストフック

ホストフックは、プロバイダー、チャネル、ツールを追加するだけでなく、ホストのライフサイクルに参加する必要がある Plugin のための SDK の継ぎ目です。これらは汎用契約です。計画モードはこれらを使用できますが、承認ワークフロー、ワークスペースポリシーゲート、バックグラウンドモニター、セットアップウィザード、UI コンパニオン Plugin も使用できます。

| メソッド                                                                   | 所有する契約                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway セッションを通じて投影される、Plugin 所有の JSON 互換セッション状態                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | 1 つのセッションの次のエージェントターンに注入される、永続的で厳密に一度だけのコンテキスト                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | ツールパラメーターをブロックまたは書き換えできる、同梱/信頼済みの Plugin 前ツールポリシー                                                      |
| `api.registerToolMetadata(...)`                                          | ツール実装を変更しないツールカタログ表示メタデータ                                                            |
| `api.registerCommand(...)`                                               | スコープ付き Plugin コマンド。コマンド結果は `continueAgent: true` を設定可能。Discord ネイティブコマンドは `descriptionLocalizations` をサポート |
| `api.registerControlUiDescriptor(...)`                                   | セッション、ツール、実行、設定サーフェス向けの Control UI コントリビューション記述子                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | リセット/削除/再読み込みパスでの Plugin 所有ランタイムリソースのクリーンアップコールバック                                                 |
| `api.registerAgentEventSubscription(...)`                                | ワークフロー状態とモニター向けのサニタイズ済みイベントサブスクリプション                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 終端実行ライフサイクルでクリアされる、実行単位の Plugin スクラッチ状態                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | 決定論的なクリーンアップを伴う Plugin 所有のセッションスケジューラージョブレコード                                                             |

これらの契約は、権限を意図的に分割しています。

- 外部 Plugin は、セッション拡張、UI 記述子、コマンド、ツールメタデータ、次ターン注入、通常のフックを所有できます。
- 信頼済みツールポリシーは通常の `before_tool_call` フックより前に実行され、ホストの安全性ポリシーに参加するため同梱専用です。
- 予約済みコマンド所有権は同梱専用です。外部 Plugin は自身のコマンド名またはエイリアスを使用してください。
- `allowPromptInjection=false` は、`agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、レガシー `before_agent_start` のプロンプトフィールド、`enqueueNextTurnInjection` など、プロンプトを変更するフックを無効にします。

計画以外の利用者の例:

| Plugin の典型例             | 使用するフック                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 承認ワークフロー            | セッション拡張、コマンド継続、次ターン注入、UI 記述子                                                            |
| 予算/ワークスペースポリシーゲート | 信頼済みツールポリシー、ツールメタデータ、セッション投影                                                                                 |
| バックグラウンドライフサイクルモニター | ランタイムライフサイクルクリーンアップ、エージェントイベントサブスクリプション、セッションスケジューラー所有権/クリーンアップ、Heartbeat プロンプトコントリビューション、UI 記述子 |
| セットアップまたはオンボーディングウィザード   | セッション拡張、スコープ付きコマンド、Control UI 記述子                                                                              |

<Note>
  予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）は、Plugin がより狭い Gateway メソッドスコープを割り当てようとしても、常に `operator.admin` のままです。Plugin 所有のメソッドには、Plugin 固有のプレフィックスを優先してください。
</Note>

<Accordion title="When to use tool-result middleware">
  同梱 Plugin は、ツール実行後、ランタイムがその結果をモデルへ戻す前にツール結果を書き換える必要がある場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。これは tokenjuice のような非同期出力リデューサー向けの、信頼済みでランタイム中立な継ぎ目です。

同梱 Plugin は、対象ランタイムごとに `contracts.agentToolResultMiddleware` を宣言する必要があります。例: `["pi", "codex"]`。外部 Plugin はこのミドルウェアを登録できません。モデル前のツール結果タイミングを必要としない処理には、通常の OpenClaw Plugin フックを使い続けてください。古い Pi 専用の埋め込み拡張ファクトリ登録パスは削除されました。
</Accordion>

### Gateway 検出登録

`api.registerGatewayDiscoveryService(...)` は、Plugin が mDNS/Bonjour などのローカル検出トランスポートでアクティブな
Gateway を公開できるようにします。OpenClaw は、ローカル検出が有効な場合に Gateway 起動中にこの
サービスを呼び出し、現在の Gateway ポートと秘密ではない TXT ヒントデータを渡し、Gateway シャットダウン中に返された
`stop` ハンドラーを呼び出します。

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

Gateway 検出 Plugin は、公開された TXT 値を秘密情報や
認証として扱ってはいけません。検出はルーティングのヒントです。Gateway 認証と TLS ピンニングが引き続き
信頼を担います。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け取ります。

- `commands`: レジストラが所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、
  ルーティング、遅延 Plugin CLI 登録に使用される解析時コマンド記述子

通常のルート CLI パスで Plugin コマンドを遅延読み込みのままにしたい場合は、
そのレジストラが公開するすべてのトップレベルコマンドルートをカバーする `descriptors` を指定します。

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

遅延ルート CLI 登録が不要な場合にのみ、`commands` を単独で使用します。
その eager 互換パスは引き続きサポートされますが、解析時の遅延読み込み用に
記述子ベースのプレースホルダーはインストールされません。

### CLI バックエンド登録

`api.registerCliBackend(...)` は、Plugin が `codex-cli` などのローカル
AI CLI バックエンドのデフォルト設定を所有できるようにします。

- バックエンド `id` は、`codex-cli/gpt-5` のようなモデル参照のプロバイダープレフィックスになります。
- バックエンド `config` は、`agents.defaults.cliBackends.<id>` と同じ形を使用します。
- ユーザー設定が引き続き優先されます。OpenClaw は CLI を実行する前に、`agents.defaults.cliBackends.<id>` を
  Plugin のデフォルトにマージします。
- マージ後にバックエンドが互換性のための書き換えを必要とする場合は、`normalizeConfig` を使用します
  (たとえば古いフラグ形状の正規化)。

### 排他的スロット

| メソッド                                   | 登録内容                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | コンテキストエンジン (同時にアクティブにできるのは 1 つ)。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、エンジンがプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合メモリ機能                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | メモリプロンプトセクションビルダー                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | メモリフラッシュプランリゾルバー                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | メモリランタイムアダプター                                                                                                                                  |

### メモリ埋め込みアダプター

| メソッド                                       | 登録内容                                     |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブな Plugin 用のメモリ埋め込みアダプター |

- `registerMemoryCapability` は推奨される排他的メモリ Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開でき、
  これにより companion Plugin は、特定の
  メモリ Plugin のプライベートレイアウトに直接アクセスする代わりに
  `openclaw/plugin-sdk/memory-host-core` 経由でエクスポートされたメモリアーティファクトを利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、レガシー互換の排他的メモリ Plugin API です。
- `MemoryFlushPlan.model` は、アクティブなフォールバック
  チェーンを継承せずに、フラッシュターンを `ollama/qwen3:8b` などの正確な `provider/model`
  参照に固定できます。
- `registerMemoryEmbeddingProvider` は、アクティブなメモリ Plugin が 1 つ以上の
  埋め込みアダプター ID (たとえば `openai`、`gemini`、またはカスタム
  Plugin 定義 ID) を登録できるようにします。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` などのユーザー設定は、それらの登録済み
  アダプター ID に対して解決されます。

### イベントとライフサイクル

| メソッド                                     | 役割                         |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクルフック   |
| `api.onConversationBindingResolved(handler)` | 会話バインディングコールバック |

例、一般的なフック名、ガードセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

### フック決定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` を返すことは決定なし ( `block` を省略するのと同じ) として扱われ、上書きとしては扱われません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` を返すことは決定なし ( `block` を省略するのと同じ) として扱われ、上書きとしては扱われません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかのハンドラーが dispatch を要求すると、優先度の低いハンドラーとデフォルトのモデル dispatch パスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかのハンドラーが設定すると、優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` を返すことは決定なし ( `cancel` を省略するのと同じ) として扱われ、上書きとしては扱われません。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを使用します。`metadata` はチャネル固有の追加情報用に保持します。
- `message_sending`: チャネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使用します。
- `gateway_start`: 内部の `gateway:startup` フックに依存する代わりに、Gateway が所有する起動状態には `ctx.config`、`ctx.workspaceDir`、`ctx.getCron?.()` を使用します。
- `cron_changed`: Gateway が所有する cron ライフサイクル変更を監視します。外部 wake スケジューラーを同期するときは `event.job?.state?.nextRunAtMs` と `ctx.getCron?.()` を使用し、期限チェックと実行の信頼できる情報源として OpenClaw を維持します。

### API オブジェクトフィールド

| フィールド               | 型                        | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                    |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | Plugin バージョン (任意)                                                                     |
| `api.description`        | `string?`                 | Plugin 説明 (任意)                                                                           |
| `api.source`             | `string`                  | Plugin ソースパス                                                                            |
| `api.rootDir`            | `string?`                 | Plugin ルートディレクトリ (任意)                                                             |
| `api.config`             | `OpenClawConfig`          | 現在の設定スナップショット (利用可能な場合はアクティブなインメモリランタイムスナップショット) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有設定                                          |
| `api.runtime`            | `PluginRuntime`           | [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | スコープ付きロガー (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の読み込みモード。`"setup-runtime"` は軽量な full-entry 前の起動/セットアップ期間です       |
| `api.resolvePath(input)` | `(string) => string`      | Plugin ルートからの相対パスを解決                                                            |

## 内部モジュール規約

Plugin 内では、内部 import にローカル barrel ファイルを使用します。

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  production code から自分自身の Plugin を `openclaw/plugin-sdk/<your-plugin>` 経由で
  import してはいけません。内部 import は `./api.ts` または
  `./runtime-api.ts` 経由でルーティングします。SDK パスは外部契約専用です。
</Warning>

facade で読み込まれるバンドル済み Plugin の公開サーフェス (`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の公開エントリファイル) は、
OpenClaw がすでに実行中の場合、アクティブなランタイム設定スナップショットを優先します。ランタイム
スナップショットがまだ存在しない場合は、ディスク上の解決済み設定ファイルにフォールバックします。
パッケージ化されたバンドル済み Plugin facade は、OpenClaw の Plugin
facade loader を通じて読み込む必要があります。`dist/extensions/...` から直接 import すると、
パッケージ化インストールが Plugin 所有コードに使用する manifest とランタイム sidecar チェックがバイパスされます。

プロバイダー Plugin は、ヘルパーが意図的にプロバイダー固有であり、まだ汎用 SDK
サブパスに属さない場合に、狭い Plugin ローカル契約 barrel を公開できます。バンドル済みの例:

- **Anthropic**: Claude
  beta-header と `service_tier` ストリームヘルパー用の公開 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**: `api.ts` はプロバイダービルダー、
  デフォルトモデルヘルパー、リアルタイムプロバイダービルダーをエクスポートします。
- **`@openclaw/openrouter-provider`**: `api.ts` はプロバイダービルダー
  とオンボーディング/設定ヘルパーをエクスポートします。

<Warning>
  Extension production code も `openclaw/plugin-sdk/<other-plugin>`
  import を避けるべきです。ヘルパーが本当に共有される場合は、2 つの Plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`、`.../provider-model-shared`、または別の
  capability 指向サーフェスなど、中立的な SDK サブパスに昇格させてください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="エントリーポイント" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
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
    非推奨のサーフェスから移行する。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと機能モデル。
  </Card>
</CardGroup>
