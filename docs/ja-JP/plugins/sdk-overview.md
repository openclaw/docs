---
read_when:
    - どの SDK サブパスから import すべきかを知る必要がある場合
    - OpenClawPluginApi 上のすべての登録メソッドのリファレンスが欲しい場合
    - 特定の SDK export を調べている場合
sidebarTitle: SDK overview
summary: インポートマップ、登録 API リファレンス、および SDK アーキテクチャ
title: Plugin SDK 概要
x-i18n:
    generated_at: "2026-04-24T05:11:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK は、plugins と core の間にある型付き契約です。このページは、
**何を import するか** と **何を登録できるか** のリファレンスです。

<Tip>
  代わりにハウツーガイドを探していますか？

- 最初の Plugin？ [Building plugins](/ja-JP/plugins/building-plugins) から始めてください。
- チャンネル Plugin？ [Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
- プロバイダー Plugin？ [Provider plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
  </Tip>

## import 規約

必ず特定のサブパスから import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各サブパスは、小さく自己完結したモジュールです。これにより起動が高速になり、
循環依存の問題を防げます。チャンネル固有の entry/build helper には、
`openclaw/plugin-sdk/channel-core` を優先し、より広い傘となるサーフェスや
`buildChannelConfigSchema` のような共有 helper には
`openclaw/plugin-sdk/core` を使ってください。

<Warning>
  provider または channel 名付きの convenience seam（たとえば
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`）を import してはいけません。
  bundled plugin は、自分自身の `api.ts` /
  `runtime-api.ts` barrel の中で generic SDK subpath を組み合わせています。core consumer は、それらの plugin ローカル
  barrel を使うか、必要が本当に
  cross-channel なときだけ、狭い generic SDK 契約を追加してください。

一部の bundled-plugin helper seam（`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` など）は、現在も
生成された export map に現れます。これらは bundled-plugin 保守専用であり、
新しいサードパーティー Plugin には推奨される import パスではありません。
</Warning>

## サブパスリファレンス

Plugin SDK は、領域ごと（plugin
entry、channel、provider、auth、runtime、capability、memory、および予約済み
bundled-plugin helper）にまとめられた狭いサブパスの集合として公開されています。完全なカタログを
グループ化・リンク付きで見たい場合は
[Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths) を参照してください。

生成された 200 以上のサブパス一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。

## 登録 API

`register(api)` コールバックは、次の
メソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります。

### Capability 登録

| Method | 登録するもの |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)` | テキスト推論（LLM） |
| `api.registerAgentHarness(...)` | 実験的な低レベルエージェント実行器 |
| `api.registerCliBackend(...)` | ローカル CLI 推論バックエンド |
| `api.registerChannel(...)` | メッセージングチャンネル |
| `api.registerSpeechProvider(...)` | Text-to-speech / STT 合成 |
| `api.registerRealtimeTranscriptionProvider(...)` | ストリーミング realtime transcription |
| `api.registerRealtimeVoiceProvider(...)` | 双方向 realtime voice セッション |
| `api.registerMediaUnderstandingProvider(...)` | 画像/音声/動画解析 |
| `api.registerImageGenerationProvider(...)` | 画像生成 |
| `api.registerMusicGenerationProvider(...)` | 音楽生成 |
| `api.registerVideoGenerationProvider(...)` | 動画生成 |
| `api.registerWebFetchProvider(...)` | Web fetch / scrape プロバイダー |
| `api.registerWebSearchProvider(...)` | Web 検索 |

### Tools とコマンド

| Method | 登録するもの |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | エージェント tool（必須または `{ optional: true }`） |
| `api.registerCommand(def)` | カスタムコマンド（LLM をバイパス） |

### Infrastructure

| Method | 登録するもの |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)` | event hook |
| `api.registerHttpRoute(params)` | Gateway HTTP エンドポイント |
| `api.registerGatewayMethod(name, handler)` | Gateway RPC メソッド |
| `api.registerCli(registrar, opts?)` | CLI サブコマンド |
| `api.registerService(service)` | バックグラウンドサービス |
| `api.registerInteractiveHandler(registration)` | interactive handler |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi 組み込みランナー extension factory |
| `api.registerMemoryPromptSupplement(builder)` | 追加の memory 隣接プロンプトセクション |
| `api.registerMemoryCorpusSupplement(adapter)` | 追加の memory search/read corpus |

<Note>
  予約済みの core 管理 namespace（`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`）は、plugin がより狭い
  gateway method scope を割り当てようとしても、常に `operator.admin` のままです。plugin 所有メソッドには plugin 固有の prefix を推奨します。
</Note>

<Accordion title="registerEmbeddedExtensionFactory を使うタイミング">
  `api.registerEmbeddedExtensionFactory(...)` は、OpenClaw の組み込み実行中に Plugin が Pi ネイティブの
  event タイミングを必要とする場合に使います。たとえば、最終 tool-result メッセージが送出される前に実行しなければならない非同期の `tool_result`
  書き換えなどです。

これは現在、bundled-plugin 用の seam です。登録できるのは bundled plugin のみで、
`openclaw.plugin.json` に `contracts.embeddedExtensionFactories: ["pi"]` を
宣言していなければなりません。より低レベルな seam を必要としないものには、通常の OpenClaw plugin hook を使ってください。
</Accordion>

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け付けます。

- `commands`: registrar が所有する明示的なコマンド root
- `descriptors`: root CLI help、
  ルーティング、および遅延 plugin CLI 登録に使われる parse-time コマンド descriptor

plugin コマンドを通常の root CLI パスで遅延ロードのままにしたい場合は、その
registrar が公開するすべてのトップレベルコマンド root をカバーする `descriptors` を指定してください。

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
        description: "Matrix アカウント、検証、デバイス、profile 状態を管理",
        hasSubcommands: true,
      },
    ],
  },
);
```

遅延 root CLI 登録が不要な場合にのみ、`commands` 単独を使ってください。
この eager 互換パスは引き続きサポートされますが、parse-time 遅延ロード用の
descriptor ベース placeholder はインストールしません。

### CLI バックエンド登録

`api.registerCliBackend(...)` を使うと、plugin が `codex-cli` のようなローカル
AI CLI バックエンドのデフォルト config を所有できます。

- バックエンド `id` は、`codex-cli/gpt-5` のような model ref における provider prefix になります。
- バックエンド `config` は `agents.defaults.cliBackends.<id>` と同じ形状を使います。
- ユーザー config が引き続き優先されます。OpenClaw は、CLI 実行前に plugin デフォルトの上に `agents.defaults.cliBackends.<id>` をマージします。
- バックエンドがマージ後の互換書き換えを必要とする場合（たとえば古い flag 形式の正規化）には `normalizeConfig` を使ってください。

### Exclusive スロット

| Method | 登録するもの |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | Context engine（一度に 1 つだけ有効）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取り、engine がプロンプト追加を調整できるようにします。 |
| `api.registerMemoryCapability(capability)` | 統合 memory capability |
| `api.registerMemoryPromptSection(builder)` | memory prompt section builder |
| `api.registerMemoryFlushPlan(resolver)` | memory flush plan resolver |
| `api.registerMemoryRuntime(runtime)` | memory runtime adapter |

### Memory 埋め込みアダプター

| Method | 登録するもの |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブ plugin 用の memory 埋め込みアダプター |

- `registerMemoryCapability` は、推奨される exclusive memory-plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、
  コンパニオン Plugins は特定の
  memory plugin の private レイアウトに直接触れるのではなく、
  `openclaw/plugin-sdk/memory-host-core` を通じてエクスポートされた memory artifact を利用できます。
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, `registerMemoryRuntime` は、
  旧式互換の exclusive memory-plugin API です。
- `registerMemoryEmbeddingProvider` は、アクティブな memory plugin が
  1 つ以上の埋め込みアダプター id（たとえば `openai`, `gemini`, または plugin 定義の custom id）を登録できるようにします。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` のようなユーザー config は、
  それらの登録済みアダプター id に対して解決されます。

### Events とライフサイクル

| Method | 何をするか |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)` | 型付きライフサイクル hook |
| `api.onConversationBindingResolved(handler)` | 会話 binding コールバック |

### Hook 判定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかの handler がそれを設定すると、より低優先度の handler はスキップされます。
- `before_tool_call`: `{ block: false }` を返しても判定なしとして扱われます（`block` を省略したのと同じ）。上書きではありません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかの handler がそれを設定すると、より低優先度の handler はスキップされます。
- `before_install`: `{ block: false }` を返しても判定なしとして扱われます（`block` を省略したのと同じ）。上書きではありません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかの handler が dispatch を引き受けると、より低優先度の handler とデフォルトの model dispatch パスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかの handler がそれを設定すると、より低優先度の handler はスキップされます。
- `message_sending`: `{ cancel: false }` を返しても判定なしとして扱われます（`cancel` を省略したのと同じ）。上書きではありません。
- `message_received`: 受信 thread/topic ルーティングが必要な場合は、型付きの `threadId` フィールドを使ってください。`metadata` はチャンネル固有の追加情報用に残してください。
- `message_sending`: チャンネル固有の `metadata` にフォールバックする前に、型付きの `replyToId` / `threadId` ルーティングフィールドを使ってください。
- `gateway_start`: gateway 所有の起動状態には、内部 `gateway:startup` hook に依存するのではなく、`ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()` を使ってください。

### API オブジェクトのフィールド

| Field | Type | 説明 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | Plugin id |
| `api.name` | `string` | 表示名 |
| `api.version` | `string?` | Plugin バージョン（任意） |
| `api.description` | `string?` | Plugin 説明（任意） |
| `api.source` | `string` | Plugin ソースパス |
| `api.rootDir` | `string?` | Plugin ルートディレクトリ（任意） |
| `api.config` | `OpenClawConfig` | 現在の config スナップショット（利用可能な場合はアクティブなインメモリランタイムスナップショット） |
| `api.pluginConfig` | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有 config |
| `api.runtime` | `PluginRuntime` | [Runtime helpers](/ja-JP/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | スコープ付き logger（`debug`, `info`, `warn`, `error`） |
| `api.registrationMode` | `PluginRegistrationMode` | 現在のロードモード。`"setup-runtime"` は軽量な pre-full-entry の起動/セットアップウィンドウです |
| `api.resolvePath(input)` | `(string) => string` | Plugin ルート基準でパスを解決 |

## 内部モジュール規約

Plugin 内部では、内部 import にローカル barrel ファイルを使ってください。

```
my-plugin/
  api.ts            # 外部 consumer 向け公開 export
  runtime-api.ts    # 内部専用ランタイム export
  index.ts          # Plugin entry point
  setup-entry.ts    # 軽量な setup 専用 entry（任意）
```

<Warning>
  本番コードから、自分自身の Plugin を `openclaw/plugin-sdk/<your-plugin>`
  経由で import してはいけません。内部 import は `./api.ts` または
  `./runtime-api.ts` を通してください。SDK パスは外部契約専用です。
</Warning>

facade-loaded な bundled plugin の公開サーフェス（`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`、および同様の公開 entry ファイル）は、
OpenClaw がすでに動作中であれば、アクティブなランタイム config スナップショットを優先します。まだランタイム
スナップショットが存在しない場合は、ディスク上の解決済み config ファイルにフォールバックします。

provider plugin は、helper が意図的に provider 固有であり、まだ generic SDK
subpath に属さない場合に、狭い plugin ローカル契約 barrel を公開できます。bundled の例:

- **Anthropic**: Claude
  beta-header と `service_tier` stream helper 向けの公開 `api.ts` / `contract-api.ts` seam。
- **`@openclaw/openai-provider`**: `api.ts` は provider builder、
  default-model helper、realtime provider builder を export します。
- **`@openclaw/openrouter-provider`**: `api.ts` は provider builder
  に加えて onboarding/config helper を export します。

<Warning>
  extension 本番コードも `openclaw/plugin-sdk/<other-plugin>`
  import を避けるべきです。helper が本当に共有されるべきなら、2 つの plugin を結合するのではなく、
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared`、またはその他の
  capability 指向サーフェスのような中立的な SDK subpath に昇格させてください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ja-JP/plugins/sdk-entrypoints">
    `definePluginEntry` と `defineChannelPluginEntry` のオプション。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ja-JP/plugins/sdk-runtime">
    完全な `api.runtime` namespace リファレンス。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ja-JP/plugins/sdk-setup">
    パッケージ化、manifest、config schema。
  </Card>
  <Card title="Testing" icon="vial" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティと lint ルール。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ja-JP/plugins/sdk-migration">
    非推奨サーフェスからの移行。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ja-JP/plugins/architecture">
    詳細なアーキテクチャと capability モデル。
  </Card>
</CardGroup>
