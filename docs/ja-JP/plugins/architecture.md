---
read_when:
    - ネイティブな OpenClaw Plugin のビルドまたはデバッグ
    - Plugin の機能モデルや所有権の境界を理解すること
    - Plugin のロードパイプラインまたはレジストリに取り組むこと
    - プロバイダーのランタイムフックやチャネル Plugin を実装すること
sidebarTitle: Internals
summary: 'Plugin の内部: 機能モデル、所有権、コントラクト、ロードパイプライン、ランタイムヘルパー'
title: Plugin の内部
x-i18n:
    generated_at: "2026-04-15T04:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86798b5d2b0ad82d2397a52a6c21ed37fe6eee1dd3d124a9e4150c4f630b841
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin の内部

<Info>
  これは**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、以下を参照してください。
  - [Install and use plugins](/ja-JP/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin チュートリアル
  - [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — メッセージングチャネルを構築する
  - [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — モデルプロバイダーを構築する
  - [SDK Overview](/ja-JP/plugins/sdk-overview) — インポートマップと登録 API
</Info>

このページでは、OpenClaw の Plugin システムの内部アーキテクチャを扱います。

## 公開されている機能モデル

Capabilities は、OpenClaw 内の公開された**ネイティブ Plugin**モデルです。すべてのネイティブ OpenClaw Plugin は、1 つ以上の capability type に対して登録されます。

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web 取得               | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 検索               | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージング | `api.registerChannel(...)`                    | `msteams`, `matrix`                  |

capability を 1 つも登録せず、hooks、tools、または services を提供する Plugin は、**レガシーな hook-only** Plugin です。このパターンも現在は完全にサポートされています。

### 外部互換性の方針

capability model はすでに core に導入されており、現在 bundled/native plugins で使用されていますが、外部 Plugin の互換性には、単に「export されているから凍結済み」というよりも厳密な基準が必要です。

現在のガイダンス:

- **既存の外部 Plugin:** hook ベースの統合が動作し続けるようにする。これを互換性の基準とみなす
- **新しい bundled/native plugins:** ベンダー固有の内部依存や新しい hook-only 設計よりも、明示的な capability registration を優先する
- **capability registration を採用する外部 Plugin:** 使用は可能だが、docs でその contract が stable と明示されていない限り、capability 固有の helper surface は進化中のものとして扱う

実用上のルール:

- capability registration APIs は意図された方向性である
- レガシー hooks は、移行期間中の外部 Plugin にとって最も破壊的変更の少ない安全な経路のままである
- export された helper subpath はすべて同等ではない。偶発的な helper export ではなく、文書化された狭い contract を優先する

### Plugin の形態

OpenClaw は、読み込まれた各 Plugin を、静的メタデータだけでなく実際の登録動作に基づいて形態分類します。

- **plain-capability** -- capability type をちょうど 1 つ登録する（たとえば `mistral` のような provider-only plugin）
- **hybrid-capability** -- 複数の capability type を登録する（たとえば `openai` は text inference、speech、media understanding、image generation を担う）
- **hook-only** -- hooks（typed または custom）のみを登録し、capabilities、tools、commands、services は登録しない
- **non-capability** -- tools、commands、services、または routes を登録するが、capabilities は登録しない

Plugin の形態と capability の内訳は、`openclaw plugins inspect <id>` で確認できます。詳細は [CLI reference](/cli/plugins#inspect) を参照してください。

### レガシー hooks

`before_agent_start` hook は、hook-only plugins のための互換性経路として引き続きサポートされています。現実のレガシー Plugin は依然としてこれに依存しています。

方向性:

- 動作し続けるように保つ
- レガシーとして文書化する
- model/provider の上書き処理には `before_model_resolve` を優先する
- prompt の変更処理には `before_prompt_build` を優先する
- 実運用での使用が減り、fixture coverage によって安全な移行が証明されるまで削除しない

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、次のラベルのいずれかが表示されることがあります。

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config が正常に解析され、plugins が解決される                |
| **compatibility advisory** | Plugin がサポートされているが古いパターン（例: `hook-only`）を使用している |
| **legacy warning**         | Plugin が `before_agent_start` を使用しており、これは非推奨である |
| **hard error**             | Config が無効であるか、plugin のロードに失敗した             |

`hook-only` も `before_agent_start` も、現時点であなたの Plugin を壊すことはありません。`hook-only` は advisory であり、`before_agent_start` は警告を出すだけです。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムには 4 つの層があります。

1. **Manifest + discovery**
   OpenClaw は、設定されたパス、workspace roots、global extension roots、bundled extensions から候補 Plugin を見つけます。discovery では、ネイティブの `openclaw.plugin.json` manifests と、サポートされる bundle manifests を最初に読み取ります。
2. **Enablement + validation**
   Core は、発見された Plugin が有効、無効、ブロック済み、または memory のような排他的スロットに選択されているかを判断します。
3. **Runtime loading**
   ネイティブ OpenClaw plugins は jiti 経由でプロセス内に読み込まれ、capabilities を中央レジストリに登録します。互換性のある bundles は、ランタイムコードを import せずに registry records に正規化されます。
4. **Surface consumption**
   OpenClaw の残りの部分は registry を読み取り、tools、channels、provider setup、hooks、HTTP routes、CLI commands、services を公開します。

特に plugin CLI では、root command discovery は 2 段階に分かれています。

- parse-time metadata は `registerCli(..., { descriptors: [...] })` から取得される
- 実際の plugin CLI module は lazy のままにでき、最初の呼び出し時に登録される

これにより、plugin が所有する CLI code を plugin 内に保ちつつ、OpenClaw は parsing 前に root command 名を予約できます。

重要な設計境界は次のとおりです。

- discovery + config validation は、Plugin code を実行せずに **manifest/schema metadata** から動作するべきである
- ネイティブな runtime behavior は plugin module の `register(api)` path から得られる

この分離により、OpenClaw は完全な runtime が有効になる前に、config の検証、欠落または無効な plugins の説明、UI/schema hints の構築を行えます。

### Channel Plugins と共有 `message` tool

Channel plugins は、通常のチャット操作のために別個の send/edit/react tool を登録する必要はありません。OpenClaw は core に 1 つの共有 `message` tool を保持し、channel plugins はその背後にあるチャネル固有の discovery と execution を担います。

現在の境界は次のとおりです。

- core は共有 `message` tool host、prompt wiring、session/thread bookkeeping、execution dispatch を担う
- channel plugins はスコープ付き action discovery、capability discovery、およびチャネル固有の schema fragments を担う
- channel plugins は、会話 ID が thread ID をどのようにエンコードするか、または親会話からどのように継承するかといった、プロバイダー固有の session conversation grammar を担う
- channel plugins は action adapter を通じて最終 action を実行する

channel plugins に対する SDK surface は `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された discovery call により、Plugin は表示される actions、capabilities、schema contributions をまとめて返せるため、それらの要素がずれないようにできます。

チャネル固有の message-tool param がローカルパスやリモート media URL のような media source を含む場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返すべきです。Core はこの明示的なリストを使って、plugin が所有する param 名をハードコードすることなく、sandbox path normalization と outbound media-access hints を適用します。
そこではチャネル全体の単一のフラットリストではなく、action 単位の map を優先してください。そうしないと、profile 専用の media param が `send` のような無関係な action でも正規化されてしまいます。

Core は runtime scope をその discovery step に渡します。重要な fields には次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼された受信元の `requesterSenderId`

これはコンテキスト依存の plugins にとって重要です。チャネルは、core `message` tool にチャネル固有の分岐をハードコードすることなく、アクティブな account、現在の room/thread/message、または信頼された requester identity に基づいて message actions を隠したり公開したりできます。

これが、embedded-runner の routing 変更が依然として plugin の作業である理由です。runner は、共有 `message` tool が現在の turn に対して適切なチャネル所有の surface を公開できるように、現在の chat/session identity を plugin discovery boundary に転送する責任を負います。

channel が所有する execution helpers については、bundled plugins は execution runtime を自分たちの extension modules 内に保持すべきです。Core はもはや `src/agents/tools` 配下の Discord、Slack、Telegram、WhatsApp の message-action runtimes を所有していません。
また、別個の `plugin-sdk/*-action-runtime` subpath も公開しておらず、bundled plugins は自分たちが所有する extension modules からローカルの runtime code を直接 import するべきです。

同じ境界は、一般に provider 名付き SDK seams にも適用されます。core は Slack、Discord、Signal、WhatsApp、または類似の extensions 向けのチャネル固有 convenience barrel を import すべきではありません。core がある behavior を必要とする場合は、bundled plugin 自身の `api.ts` / `runtime-api.ts` barrel を利用するか、その必要性を共有 SDK の狭い汎用 capability に昇格させてください。

polls については、特に 2 つの execution path があります。

- `outbound.sendPoll` は共通の poll model に適合するチャネル向けの共有ベースラインである
- `actions.handleAction("poll")` はチャネル固有の poll semantics や追加の poll parameters に対する推奨経路である

Core は現在、plugin の poll dispatch が action を拒否した後まで共有 poll parsing を遅延させています。これにより、plugin が所有する poll handlers は、先に汎用 poll parser に妨げられることなく、チャネル固有の poll fields を受け取れます。

完全な起動シーケンスについては、[Load pipeline](#load-pipeline) を参照してください。

## Capability ownership model

OpenClaw は、ネイティブ Plugin を、無関係な統合の寄せ集めではなく、**会社**または**機能**の所有境界として扱います。

つまり、次のことを意味します。

- 会社 Plugin は通常、その会社に関する OpenClaw 向けの surface をすべて所有するべきである
- 機能 Plugin は通常、自身が導入する完全な機能 surface を所有するべきである
- channels は、provider behavior を場当たり的に再実装するのではなく、共有 core capabilities を利用するべきである

例:

- bundled の `openai` Plugin は、OpenAI の model-provider behavior と、OpenAI の speech + realtime-voice + media-understanding + image-generation behavior を所有する
- bundled の `elevenlabs` Plugin は、ElevenLabs の speech behavior を所有する
- bundled の `microsoft` Plugin は、Microsoft の speech behavior を所有する
- bundled の `google` Plugin は、Google の model-provider behavior と、Google の media-understanding + image-generation + web-search behavior を所有する
- bundled の `firecrawl` Plugin は、Firecrawl の web-fetch behavior を所有する
- bundled の `minimax`、`mistral`、`moonshot`、`zai` Plugins は、それぞれの media-understanding backend を所有する
- bundled の `qwen` Plugin は、Qwen の text-provider behavior と、media-understanding および video-generation behavior を所有する
- `voice-call` Plugin は機能 Plugin である。call transport、tools、CLI、routes、Twilio media-stream bridging を所有するが、vendor plugins を直接 import する代わりに、共有の speech と realtime-transcription および realtime-voice capabilities を利用する

意図されている最終状態は次のとおりです。

- OpenAI は、text models、speech、images、将来の video にまたがる場合でも、1 つの Plugin に存在する
- 別の vendor も、自身の surface area に対して同じことができる
- channels は、どの vendor plugin が provider を所有しているかを気にせず、core が公開する共有 capability contract を利用する

これが重要な区別です。

- **plugin** = 所有権の境界
- **capability** = 複数の plugins が実装または利用できる core contract

したがって、OpenClaw が video のような新しい domain を追加する場合、最初の問いは「どの provider が video handling をハードコードすべきか？」ではありません。最初の問いは「core の video capability contract は何か？」です。その contract が存在すれば、vendor plugins はそれに対して登録でき、channel/feature plugins はそれを利用できます。

その capability がまだ存在しない場合、通常取るべき対応は次のとおりです。

1. core で不足している capability を定義する
2. それを型付きで plugin API/runtime を通じて公開する
3. channels/features をその capability に対して接続する
4. vendor plugins に実装を登録させる

これにより、所有権を明示したまま、単一 vendor や一回限りの plugin 固有 code path に依存する core behavior を避けられます。

### Capability layering

コードをどこに置くべきかを判断する際には、次のメンタルモデルを使ってください。

- **core capability layer**: 共有の orchestration、policy、fallback、config merge rules、delivery semantics、型付き contracts
- **vendor plugin layer**: vendor 固有の APIs、auth、model catalogs、speech synthesis、image generation、将来の video backends、usage endpoints
- **channel/feature plugin layer**: core capabilities を利用し、それを surface 上に提示する Slack/Discord/voice-call などの統合

たとえば、TTS は次の形になります。

- core は reply-time の TTS policy、fallback order、prefs、channel delivery を所有する
- `openai`、`elevenlabs`、`microsoft` は synthesis implementations を所有する
- `voice-call` は telephony TTS runtime helper を利用する

将来の capabilities に対しても、同じパターンを優先すべきです。

### 複数 capability を持つ company Plugin の例

company Plugin は、外側から見て一貫性があるように感じられるべきです。OpenClaw に models、speech、realtime transcription、realtime voice、media understanding、image generation、video generation、web fetch、web search の共有 contracts があるなら、vendor はそれらすべての surface を 1 か所で所有できます。

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

重要なのは、helper 名が正確に何であるかではありません。重要なのは形です。

- 1 つの Plugin が vendor surface を所有する
- それでも core は capability contracts を所有する
- channels と feature plugins は vendor code ではなく `api.runtime.*` helpers を利用する
- contract tests は、その Plugin が所有すると主張する capabilities を登録したことを検証できる

### Capability の例: video understanding

OpenClaw はすでに image/audio/video understanding を 1 つの共有 capability として扱っています。そこでも同じ所有モデルが適用されます。

1. core が media-understanding contract を定義する
2. vendor plugins が、該当する場合は `describeImage`、`transcribeAudio`、`describeVideo` を登録する
3. channels と feature plugins は、vendor code に直接接続する代わりに、共有された core behavior を利用する

これにより、ある provider の video に関する前提を core に埋め込むことを避けられます。Plugin は vendor surface を所有し、core は capability contract と fallback behavior を所有します。

video generation もすでに同じ流れを使っています。core が型付き capability contract と runtime helper を所有し、vendor plugins はそれに対して `api.registerVideoGenerationProvider(...)` の実装を登録します。

具体的な rollout checklist が必要ですか。 [Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## コントラクトと強制

plugin API surface は、意図的に `OpenClawPluginApi` に集約され、型付けされています。この contract は、サポートされる registration points と、Plugin が依存してよい runtime helpers を定義します。

これが重要な理由:

- Plugin 作成者は、安定した単一の内部標準を得られる
- core は、2 つの plugins が同じ provider id を登録するような重複した所有を拒否できる
- 起動時に、不正な registration に対して実用的な diagnostics を表示できる
- contract tests により、bundled-plugin の所有権を強制し、静かな drift を防げる

強制には 2 つの層があります。

1. **runtime registration enforcement**
   plugin registry は、plugins のロード時に registrations を検証します。例: 重複した provider ids、重複した speech provider ids、不正な registrations は、未定義動作ではなく plugin diagnostics を生成します。
2. **contract tests**
   bundled plugins は、テスト実行中に contract registries に記録されるため、OpenClaw は所有権を明示的に検証できます。現在、これは model providers、speech providers、web search providers、bundled registration ownership に使用されています。

実際の効果として、OpenClaw は、どの Plugin がどの surface を所有しているかを事前に把握できます。これにより、所有権が暗黙的ではなく、宣言され、型付けされ、テスト可能であるため、core と channels をシームレスに組み合わせられます。

### コントラクトに含めるべきもの

良い plugin contracts は次の性質を持ちます。

- 型付き
- 小さい
- capability 固有
- core が所有する
- 複数の plugins で再利用できる
- vendor の知識なしに channels/features から利用できる

悪い plugin contracts は次のようなものです。

- core に隠された vendor 固有の policy
- registry を迂回する、一回限りの plugin 用 escape hatch
- vendor implementation に直接到達する channel code
- `OpenClawPluginApi` や `api.runtime` の一部ではない ad hoc な runtime objects

迷ったら、抽象化のレベルを上げてください。まず capability を定義し、その後で plugins がそこに接続できるようにします。

## 実行モデル

ネイティブ OpenClaw plugins は、Gateway と**同一プロセス内**で実行されます。sandbox 化はされていません。ロードされたネイティブ Plugin は、core code と同じプロセスレベルの信頼境界を持ちます。

影響:

- ネイティブ Plugin は tools、network handlers、hooks、services を登録できる
- ネイティブ Plugin のバグは gateway をクラッシュさせたり不安定化させたりできる
- 悪意あるネイティブ Plugin は、OpenClaw process 内での任意コード実行と同等である

互換 bundles は、OpenClaw が現在それらを metadata/content packs として扱うため、デフォルトではより安全です。現在のリリースでは、それは主に bundled skills を意味します。

bundled ではない plugins には、allowlists と明示的な install/load paths を使用してください。workspace plugins は本番デフォルトではなく、開発時の code として扱ってください。

bundled workspace package names では、plugin id を npm name に固定してください。デフォルトは `@openclaw/<id>`、または package が意図的により狭い plugin role を公開する場合は `-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` のような承認済み typed suffix を使います。

重要な信頼に関する注意:

- `plugins.allow` が信頼するのは**plugin ids**であり、ソースの provenance ではない。
- bundled plugin と同じ id を持つ workspace plugin は、その workspace plugin が enabled/allowlisted されると、意図的に bundled copy を shadow する。
- これは正常であり、ローカル開発、patch testing、hotfixes に有用である。

## Export boundary

OpenClaw は implementation convenience ではなく、capabilities を export します。

capability registration は public のままにし、非 contract の helper exports は削減してください。

- bundled-plugin 固有の helper subpaths
- public API を意図していない runtime plumbing subpaths
- vendor 固有の convenience helpers
- 実装詳細である setup/onboarding helpers

bundled-plugin の一部 helper subpaths は、互換性と bundled-plugin メンテナンスのために、生成された SDK export map にまだ残っています。現在の例には `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seams が含まれます。これらは、新しいサードパーティ plugins 向けの推奨 SDK パターンではなく、予約された実装詳細 export として扱ってください。

## Load pipeline

起動時に、OpenClaw はおおむね次のことを行います。

1. 候補 plugin roots を検出する
2. ネイティブまたは互換 bundle の manifests と package metadata を読み取る
3. 安全でない candidates を拒否する
4. plugin config（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）を正規化する
5. 各 candidate の enablement を決定する
6. 有効なネイティブ modules を jiti 経由で読み込む
7. ネイティブの `register(api)`（またはレガシーな別名である `activate(api)`）hooks を呼び出し、registrations を plugin registry に収集する
8. commands/runtime surfaces に registry を公開する

<Note>
`activate` は `register` のレガシーな別名です。loader は存在する方（`def.register ?? def.activate`）を解決して同じタイミングで呼び出します。bundled plugins はすべて `register` を使用しています。新しい plugins では `register` を優先してください。
</Note>

安全ゲートは、runtime execution の**前**に発生します。entry が plugin root の外に出ている場合、path が world-writable の場合、または bundled ではない plugins に対して path ownership が疑わしい場合、candidates はブロックされます。

### Manifest-first behavior

manifest は control-plane の source of truth です。OpenClaw はそれを次の目的に使います。

- plugin を識別する
- 宣言された channels/skills/config schema または bundle capabilities を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI の labels/placeholders を補強する
- install/catalog metadata を表示する
- plugin runtime を読み込まずに、軽量な activation と setup descriptors を保持する

ネイティブ plugins では、runtime module が data-plane 部分です。そこでは hooks、tools、commands、provider flows などの実際の behavior を登録します。

任意の manifest `activation` および `setup` blocks は control plane に留まります。これらは activation planning と setup discovery のための metadata-only descriptors であり、runtime registration、`register(...)`、または `setupEntry` を置き換えるものではありません。
最初の live activation consumers では、manifest の command、channel、provider hints を使って、より広い registry materialization の前に plugin loading を絞り込むようになっています。

- CLI loading は、要求された primary command を所有する plugins に絞り込まれる
- channel setup/plugin resolution は、要求された channel id を所有する plugins に絞り込まれる
- 明示的な provider setup/runtime resolution は、要求された provider id を所有する plugins に絞り込まれる

setup discovery は、setup-time runtime hooks がまだ必要な plugins に対して `setup-api` にフォールバックする前に、`setup.providers` や `setup.cliBackends` のような descriptor-owned ids を優先して候補 Plugin を絞り込むようになりました。発見された複数の plugins が同じ正規化済み setup provider または CLI backend id を主張した場合、setup lookup は discovery order に依存せず、その曖昧な owner を拒否します。

### loader がキャッシュするもの

OpenClaw は、短期間の in-process cache を次の対象に対して保持します。

- discovery results
- manifest registry data
- loaded plugin registries

これらの caches は、突発的な startup や繰り返し実行される command のオーバーヘッドを減らします。これらは永続化ではなく、短命な performance cache と考えるのが適切です。

パフォーマンスに関する注意:

- これらの caches を無効にするには、`OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定します。
- cache window は `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## レジストリモデル

ロードされた plugins は、無作為な core globals を直接変更しません。中央の plugin registry に登録します。

registry は次を追跡します。

- plugin records（identity、source、origin、status、diagnostics）
- tools
- legacy hooks と typed hooks
- channels
- providers
- Gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin が所有する commands

その後、core features は plugin modules と直接やり取りする代わりに、その registry を読み取ります。これにより、ロードは一方向に保たれます。

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性にとって重要です。つまり、ほとんどの core surface が必要とする統合ポイントは 1 つだけ、「registry を読む」であり、「すべての plugin module を個別扱いする」ではありません。

## Conversation binding callbacks

conversation を bind する plugins は、承認が解決されたときに反応できます。

bind request が承認または拒否された後に callback を受け取るには、`api.onConversationBindingResolved(...)` を使用します。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // この plugin + conversation に対する binding が存在するようになった。
        console.log(event.binding?.conversationId);
        return;
      }

      // リクエストは拒否された。ローカルの保留状態をすべてクリアする。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

callback payload fields:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認された requests に対する解決済み binding
- `request`: 元の request summary、detach hint、sender id、conversation metadata

この callback は通知専用です。誰が conversation を bind できるかを変更するものではなく、core の approval handling が完了した後に実行されます。

## プロバイダーのランタイムフック

provider plugins には現在 2 つの層があります。

- manifest metadata: runtime load 前に軽量な provider env-auth lookup を行うための `providerAuthEnvVars`、auth を共有する provider variants のための `providerAuthAliases`、runtime load 前に軽量な channel env/setup lookup を行うための `channelEnvVars`、さらに runtime load 前に軽量な onboarding/auth-choice labels と CLI flag metadata を提供するための `providerAuthChoices`
- config-time hooks: `catalog` / レガシーな `discovery`、および `applyConfigDefaults`
- runtime hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw は、依然として汎用的な agent loop、failover、transcript handling、tool policy を所有します。これらの hooks は、完全なカスタム inference transport を必要とせずに provider 固有の behavior を実装するための extension surface です。

provider が env ベースの credentials を持っており、汎用的な auth/status/model-picker paths が plugin runtime を読み込まずにそれを認識すべき場合は、manifest の `providerAuthEnvVars` を使用します。1 つの provider id が別の provider id の env vars、auth profiles、config-backed auth、API-key onboarding choice を再利用すべき場合は、manifest の `providerAuthAliases` を使用します。onboarding/auth-choice CLI surfaces が provider runtime を読み込まずに、その provider の choice id、group labels、単純な one-flag auth wiring を認識すべき場合は、manifest の `providerAuthChoices` を使用します。provider runtime の `envVars` は、onboarding labels や OAuth client-id/client-secret setup vars のような operator 向けヒントに使い続けてください。

channel に env 駆動の auth または setup があり、汎用的な shell-env fallback、config/status checks、setup prompts が channel runtime を読み込まずにそれを認識すべき場合は、manifest の `channelEnvVars` を使用します。

### Hook の順序と使い方

model/provider plugins に対して、OpenClaw は hooks をおおよそ次の順序で呼び出します。
「When to use」列は、素早く判断するためのガイドです。

| #   | Hook                              | 役割                                                                                                           | 使用する場面                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時に、provider config を `models.providers` に公開する                                      | Provider が catalog または base URL defaults を所有している                                                                                 |
| 2   | `applyConfigDefaults`             | config materialization 中に、provider が所有するグローバル config defaults を適用する                         | defaults が auth mode、env、または provider の model-family semantics に依存する                                                           |
| --  | _(built-in model lookup)_         | OpenClaw は最初に通常の registry/catalog path を試す                                                          | _(plugin hook ではない)_                                                                                                                    |
| 3   | `normalizeModelId`                | lookup 前に、レガシーまたは preview の model-id aliases を正規化する                                          | Provider が canonical model resolution 前の alias cleanup を所有している                                                                    |
| 4   | `normalizeTransport`              | 汎用的な model assembly の前に、provider-family の `api` / `baseUrl` を正規化する                             | 同じ transport family 内の custom provider ids に対する transport cleanup を Provider が所有している                                       |
| 5   | `normalizeConfig`                 | runtime/provider resolution 前に、`models.providers.<id>` を正規化する                                        | plugin とともに管理されるべき config cleanup が Provider に必要な場合。bundled の Google-family helpers は、サポート対象の Google config entries の後方支援も行う |
| 6   | `applyNativeStreamingUsageCompat` | config providers に対して native streaming-usage compat rewrites を適用する                                   | endpoint 主導の native streaming usage metadata fixes が Provider に必要な場合                                                             |
| 7   | `resolveConfigApiKey`             | runtime auth load 前に、config providers の env-marker auth を解決する                                        | Provider が provider 所有の env-marker API-key resolution を持つ場合。`amazon-bedrock` にはここに built-in の AWS env-marker resolver もある |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、local/self-hosted または config-backed auth を表面化する                                  | Provider が synthetic/local credential marker で動作できる場合                                                                             |
| 9   | `resolveExternalAuthProfiles`     | provider が所有する external auth profiles を overlay する。デフォルトの `persistence` は CLI/app 所有 credentials に対して `runtime-only` | copied refresh tokens を永続化せずに external auth credentials を Provider が再利用する場合                                               |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの synthetic profile placeholders を env/config-backed auth より後順位にする                          | precedence を取るべきでない synthetic placeholder profiles を Provider が保存している場合                                                  |
| 11  | `resolveDynamicModel`             | まだローカル registry にない provider 所有の model ids に対する同期 fallback                                 | Provider が任意の upstream model ids を受け付ける場合                                                                                      |
| 12  | `prepareDynamicModel`             | 非同期 warm-up を行い、その後 `resolveDynamicModel` を再実行する                                              | unknown ids を解決する前に network metadata が Provider に必要な場合                                                                       |
| 13  | `normalizeResolvedModel`          | embedded runner が resolved model を使う前の最終 rewrite                                                      | Provider が transport rewrites を必要とするが、core transport は引き続き使う場合                                                           |
| 14  | `contributeResolvedModelCompat`   | 別の compatible transport の背後にある vendor models の compat flags を提供する                               | provider を引き継がずに proxy transports 上で自分の models を認識したい場合                                                                |
| 15  | `capabilities`                    | 共有 core logic で使われる、provider 所有の transcript/tooling metadata                                       | transcript/provider-family の quirks が Provider に必要な場合                                                                              |
| 16  | `normalizeToolSchemas`            | embedded runner が見る前に tool schemas を正規化する                                                          | transport-family の schema cleanup が Provider に必要な場合                                                                                |
| 17  | `inspectToolSchemas`              | 正規化後に provider 所有の schema diagnostics を表面化する                                                    | core に provider 固有ルールを教え込まずに keyword warnings を出したい場合                                                                  |
| 18  | `resolveReasoningOutputMode`      | native と tagged の reasoning-output contract を選択する                                                      | native fields ではなく tagged reasoning/final output が Provider に必要な場合                                                              |
| 19  | `prepareExtraParams`              | 汎用的な stream option wrappers の前に request params を正規化する                                            | default request params または provider ごとの param cleanup が Provider に必要な場合                                                       |
| 20  | `createStreamFn`                  | 通常の stream path を custom transport で完全に置き換える                                                     | wrapper だけではなく、custom wire protocol が Provider に必要な場合                                                                        |
| 21  | `wrapStreamFn`                    | 汎用 wrappers が適用された後に stream wrapper を適用する                                                      | custom transport なしで request headers/body/model compat wrappers が Provider に必要な場合                                                |
| 22  | `resolveTransportTurnState`       | ネイティブなターンごとの transport headers または metadata を付加する                                         | 汎用 transports が provider ネイティブの turn identity を送信するようにしたい場合                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | ネイティブな WebSocket headers または session cool-down policy を付加する                                     | 汎用 WS transports で session headers や fallback policy を Provider が調整したい場合                                                      |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存された profile を runtime の `apiKey` string に変換する                           | 追加の auth metadata を Provider が保存しており、custom runtime token shape が必要な場合                                                   |
| 25  | `refreshOAuth`                    | custom refresh endpoints または refresh-failure policy のための OAuth refresh override                        | Provider が共有の `pi-ai` refreshers に適合しない場合                                                                                      |
| 26  | `buildAuthDoctorHint`             | OAuth refresh が失敗したときに追加される repair hint                                                          | refresh failure 後に provider 所有の auth repair guidance が必要な場合                                                                     |
| 27  | `matchesContextOverflowError`     | provider 所有の context-window overflow matcher                                                               | 汎用 heuristics では見逃す raw overflow errors を Provider が持つ場合                                                                       |
| 28  | `classifyFailoverReason`          | provider 所有の failover reason classification                                                                | raw API/transport errors を rate-limit/overload などに Provider がマッピングできる場合                                                     |
| 29  | `isCacheTtlEligible`              | proxy/backhaul providers 向けの prompt-cache policy                                                           | proxy 固有の cache TTL gating が Provider に必要な場合                                                                                     |
| 30  | `buildMissingAuthMessage`         | 汎用の missing-auth recovery message の置き換え                                                               | provider 固有の missing-auth recovery hint が必要な場合                                                                                    |
| 31  | `suppressBuiltInModel`            | 古くなった upstream model の抑制と、必要に応じた user-facing error hint                                       | 古い upstream rows を隠したり、vendor hint に置き換えたりする必要がある場合                                                                |
| 32  | `augmentModelCatalog`             | discovery 後に synthetic/final catalog rows を追加する                                                        | `models list` や pickers に synthetic な forward-compat rows が Provider に必要な場合                                                      |
| 33  | `isBinaryThinking`                | binary-thinking providers 向けの on/off reasoning toggle                                                      | Provider が binary な thinking on/off のみを公開する場合                                                                                   |
| 34  | `supportsXHighThinking`           | 選択された models に対する `xhigh` reasoning support                                                          | 一部の models にだけ `xhigh` を適用したい場合                                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | 特定の model family に対するデフォルトの `/think` level                                                      | model family に対するデフォルトの `/think` policy を Provider が所有している場合                                                           |
| 36  | `isModernModelRef`                | live profile filters と smoke selection のための modern-model matcher                                         | live/smoke の preferred-model matching を Provider が所有している場合                                                                       |
| 37  | `prepareRuntimeAuth`              | 推論直前に、設定済み credential を実際の runtime token/key に交換する                                         | token exchange または短命な request credential が Provider に必要な場合                                                                    |
| 38  | `resolveUsageAuth`                | `/usage` および関連する status surfaces 向けの usage/billing credentials を解決する                            | custom な usage/quota token parsing、または別の usage credential が Provider に必要な場合                                                  |
| 39  | `fetchUsageSnapshot`              | auth 解決後に、provider 固有の usage/quota snapshots を取得して正規化する                                     | provider 固有の usage endpoint または payload parser が Provider に必要な場合                                                              |
| 40  | `createEmbeddingProvider`         | memory/search 向けの provider 所有 embedding adapter を構築する                                               | memory embedding behavior が provider plugin とともに管理されるべき場合                                                                    |
| 41  | `buildReplayPolicy`               | provider の transcript handling を制御する replay policy を返す                                                | Provider に custom transcript policy（たとえば thinking-block stripping）が必要な場合                                                      |
| 42  | `sanitizeReplayHistory`           | 汎用 transcript cleanup の後で replay history を書き換える                                                    | 共有 Compaction helpers を超えた provider 固有の replay rewrites が Provider に必要な場合                                                 |
| 43  | `validateReplayTurns`             | embedded runner の前に、replay turns の最終 validation または整形を行う                                       | 汎用 sanitation の後に、provider transport がより厳密な turn validation を必要とする場合                                                  |
| 44  | `onModelSelected`                 | model がアクティブになったときに provider 所有の post-selection side effects を実行する                       | model がアクティブになったときに telemetry または provider 所有 state が必要な場合                                                        |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致した provider plugin を確認し、その後、実際に model id または transport/config を変更するものが現れるまで、他の hook 対応 provider plugins へとフォールスルーします。これにより、caller がどの bundled plugin がその rewrite を所有しているかを知る必要なく、alias/compat provider shims を動作させ続けられます。どの provider hook もサポート対象の Google-family config entry を書き換えない場合でも、bundled の Google config normalizer はその互換性 cleanup を引き続き適用します。

provider が完全にカスタムな wire protocol またはカスタム request executor を必要とする場合、それは別の種類の extension です。これらの hooks は、OpenClaw の通常の inference loop 上で引き続き動作する provider behavior のためのものです。

### Provider の例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 組み込みの例

- Anthropic は `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、`resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`wrapStreamFn` を使用します。これは、Claude 4.6 の forward-compat、provider-family hints、auth repair guidance、usage endpoint integration、prompt-cache eligibility、auth-aware な config defaults、Claude の default/adaptive thinking policy、および beta headers、`/fast` / `serviceTier`、`context1m` のための Anthropic 固有の stream shaping を所有しているためです。
- Anthropic の Claude 固有 stream helpers は、今のところ bundled plugin 自身の public `api.ts` / `contract-api.ts` seam に置かれています。その package surface は、generic SDK を 1 つの provider の beta-header rules 向けに広げる代わりに、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、およびより低レベルな Anthropic wrapper builders を export します。
- OpenAI は `resolveDynamicModel`、`normalizeResolvedModel`、`capabilities` に加えて、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`supportsXHighThinking`、`isModernModelRef` を使用します。これは、GPT-5.4 の forward-compat、直接の OpenAI `openai-completions` -> `openai-responses` の normalization、Codex-aware な auth hints、Spark suppression、synthetic な OpenAI list rows、GPT-5 の thinking / live-model policy を所有しているためです。また、`openai-responses-defaults` stream family は、attribution headers、`/fast`/`serviceTier`、text verbosity、native Codex web search、reasoning-compat payload shaping、Responses context management のための共有 native OpenAI Responses wrappers を所有します。
- OpenRouter は `catalog` に加えて `resolveDynamicModel` と `prepareDynamicModel` を使用します。これは、その provider がパススルーであり、OpenClaw の静的 catalog が更新される前に新しい model ids を公開する可能性があるためです。また、provider 固有の request headers、routing metadata、reasoning patches、prompt-cache policy を core の外に保つために、`capabilities`、`wrapStreamFn`、`isCacheTtlEligible` も使用します。その replay policy は `passthrough-gemini` family に由来し、`openrouter-thinking` stream family は proxy reasoning injection と unsupported-model / `auto` のスキップを所有します。
- GitHub Copilot は `catalog`、`auth`、`resolveDynamicModel`、`capabilities` に加えて `prepareRuntimeAuth` と `fetchUsageSnapshot` を使用します。これは、provider 所有の device login、model fallback behavior、Claude transcript quirks、GitHub token -> Copilot token exchange、provider 所有の usage endpoint が必要だからです。
- OpenAI Codex は `catalog`、`resolveDynamicModel`、`normalizeResolvedModel`、`refreshOAuth`、`augmentModelCatalog` に加えて `prepareExtraParams`、`resolveUsageAuth`、`fetchUsageSnapshot` を使用します。これは、依然として core の OpenAI transports 上で動作する一方で、自身の transport/base URL normalization、OAuth refresh fallback policy、default transport choice、synthetic な Codex catalog rows、ChatGPT usage endpoint integration を所有しているためです。direct OpenAI と同じ `openai-responses-defaults` stream family を共有します。
- Google AI Studio と Gemini CLI OAuth は `resolveDynamicModel`、`buildReplayPolicy`、`sanitizeReplayHistory`、`resolveReasoningOutputMode`、`wrapStreamFn`、`isModernModelRef` を使用します。これは、`google-gemini` replay family が Gemini 3.1 の forward-compat fallback、native Gemini replay validation、bootstrap replay sanitation、tagged reasoning-output mode、modern-model matching を所有し、`google-thinking` stream family が Gemini thinking payload normalization を所有しているためです。Gemini CLI OAuth はさらに、token formatting、token parsing、quota endpoint wiring のために `formatApiKey`、`resolveUsageAuth`、`fetchUsageSnapshot` も使用します。
- Anthropic Vertex は `anthropic-by-model` replay family を通じて `buildReplayPolicy` を使用するため、Claude 固有の replay cleanup はすべての `anthropic-messages` transport ではなく Claude ids に限定されたままになります。
- Amazon Bedrock は `buildReplayPolicy`、`matchesContextOverflowError`、`classifyFailoverReason`、`resolveDefaultThinkingLevel` を使用します。これは、Anthropic-on-Bedrock traffic 向けの Bedrock 固有の throttle/not-ready/context-overflow error classification を所有しているためです。その replay policy は引き続き同じ Claude 専用の `anthropic-by-model` guard を共有します。
- OpenRouter、Kilocode、Opencode、Opencode Go は、`passthrough-gemini` replay family を通じて `buildReplayPolicy` を使用します。これは、Gemini models を OpenAI 互換 transports 経由で proxy しており、native Gemini replay validation や bootstrap rewrites なしで Gemini thought-signature sanitation が必要なためです。
- MiniMax は `hybrid-anthropic-openai` replay family を通じて `buildReplayPolicy` を使用します。これは、1 つの provider が Anthropic-message と OpenAI-compatible の両方の semantics を所有するためです。Anthropic 側では Claude 専用の thinking-block dropping を維持しつつ、reasoning output mode は native に戻し、`minimax-fast-mode` stream family は共有 stream path 上で fast-mode の model rewrites を所有します。
- Moonshot は `catalog` と `wrapStreamFn` を使用します。これは、依然として共有 OpenAI transport を使用しつつ、provider 所有の thinking payload normalization が必要だからです。`moonshot-thinking` stream family は config と `/think` state を native の binary thinking payload にマッピングします。
- Kilocode は `catalog`、`capabilities`、`wrapStreamFn`、`isCacheTtlEligible` を使用します。これは、provider 所有の request headers、reasoning payload normalization、Gemini transcript hints、Anthropic cache-TTL gating が必要だからです。`kilocode-thinking` stream family は共有 proxy stream path 上で Kilo thinking injection を保持しつつ、明示的な reasoning payloads をサポートしない `kilo/auto` やその他の proxy model ids はスキップします。
- Z.AI は `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、`isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、`resolveUsageAuth`、`fetchUsageSnapshot` を使用します。これは、GLM-5 fallback、`tool_stream` defaults、binary thinking UX、modern-model matching、usage auth と quota fetching の両方を所有しているためです。`tool-stream-default-on` stream family は、デフォルト有効の `tool_stream` wrapper を provider ごとの手書き glue から切り離して保持します。
- xAI は `normalizeResolvedModel`、`normalizeTransport`、`contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、`resolveSyntheticAuth`、`resolveDynamicModel`、`isModernModelRef` を使用します。これは、native xAI Responses transport normalization、Grok fast-mode alias rewrites、デフォルトの `tool_stream`、strict-tool / reasoning-payload cleanup、plugin 所有 tools のための fallback auth reuse、forward-compat な Grok model resolution、および xAI tool-schema profile、unsupported schema keywords、native `web_search`、HTML-entity な tool-call argument decoding のような provider 所有 compat patches を所有しているためです。
- Mistral、OpenCode Zen、OpenCode Go は、transcript/tooling quirks を core の外に保つために `capabilities` のみを使用します。
- `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` のような catalog-only の bundled providers は、`catalog` のみを使用します。
- Qwen は、text provider 向けの `catalog` と、その multimodal surfaces 向けの共有 media-understanding および video-generation registrations を使用します。
- MiniMax と Xiaomi は `catalog` に加えて usage hooks を使用します。これは、推論自体は共有 transports を通じて実行される一方で、その `/usage` behavior は plugin 所有だからです。

## ランタイムヘルパー

plugins は、`api.runtime` を通じて選択された core helpers にアクセスできます。TTS の場合は次のとおりです。

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

注意:

- `textToSpeech` は、file/voice-note surfaces 向けの通常の core TTS output payload を返します。
- core の `messages.tts` configuration と provider selection を使用します。
- PCM audio buffer + sample rate を返します。plugins 側で providers 向けに resample/encode する必要があります。
- `listVoices` は provider ごとに optional です。vendor 所有の voice pickers や setup flows に使用してください。
- voice listings には、provider-aware な pickers 向けに locale、gender、personality tags のような、より豊富な metadata を含められます。
- 現在 telephony をサポートしているのは OpenAI と ElevenLabs です。Microsoft はサポートしていません。

plugins は `api.registerSpeechProvider(...)` を通じて speech providers を登録することもできます。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

注意:

- TTS policy、fallback、reply delivery は core に残してください。
- vendor 所有の synthesis behavior には speech providers を使用してください。
- レガシーな Microsoft の `edge` input は `microsoft` provider id に正規化されます。
- 推奨される所有モデルは会社単位です。OpenClaw がこれらの capability contracts を追加していく中で、1 つの vendor plugin が text、speech、image、将来の media providers を所有できます。

image/audio/video understanding については、plugins は generic な key/value bag ではなく、1 つの型付き media-understanding provider を登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注意:

- orchestration、fallback、config、channel wiring は core に保持してください。
- vendor behavior は provider plugin に保持してください。
- 加算的な拡張は型付きのままにしてください。新しい optional methods、新しい optional result fields、新しい optional capabilities。
- video generation もすでに同じパターンに従っています。
  - core が capability contract と runtime helper を所有する
  - vendor plugins が `api.registerVideoGenerationProvider(...)` を登録する
  - feature/channel plugins が `api.runtime.videoGeneration.*` を利用する

media-understanding の runtime helpers については、plugins は次のように呼び出せます。

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

audio transcription については、plugins は media-understanding runtime または古い STT alias のいずれかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME を確実に推測できない場合は optional:
  mime: "audio/ogg",
});
```

注意:

- `api.runtime.mediaUnderstanding.*` は、image/audio/video understanding のための推奨される共有 surface です。
- core の media-understanding audio configuration（`tools.media.audio`）と provider fallback order を使用します。
- transcription output が生成されない場合（たとえば skipped/unsupported input）には `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性 alias として残っています。

plugins は `api.runtime.subagent` を通じてバックグラウンドの subagent run を開始することもできます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意:

- `provider` と `model` は永続的な session 変更ではなく、run ごとの optional overrides です。
- OpenClaw は、信頼された caller に対してのみそれらの override fields を適用します。
- plugin 所有の fallback runs では、operator が `plugins.entries.<id>.subagent.allowModelOverride: true` で opt in する必要があります。
- 信頼された plugins を特定の canonical `provider/model` targets に制限するには `plugins.entries.<id>.subagent.allowedModels` を、任意の target を明示的に許可するには `"*"` を使用します。
- 信頼されていない plugin の subagent runs も引き続き動作しますが、override requests は黙ってフォールバックされるのではなく拒否されます。

web search については、plugins は agent tool wiring に直接入り込む代わりに、共有 runtime helper を利用できます。

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

plugins は `api.registerWebSearchProvider(...)` を通じて web-search providers を登録することもできます。

注意:

- provider selection、credential resolution、共有 request semantics は core に保持してください。
- vendor 固有の search transports には web-search providers を使用してください。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せず search behavior を必要とする feature/channel plugins のための推奨される共有 surface です。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: 設定された image-generation provider chain を使用して画像を生成します。
- `listProviders(...)`: 利用可能な image-generation providers とその capabilities を一覧表示します。

## Gateway HTTP routes

plugins は `api.registerHttpRoute(...)` で HTTP endpoints を公開できます。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

route fields:

- `path`: gateway HTTP server 配下の route path。
- `auth`: 必須。通常の gateway auth を要求するには `"gateway"` を、plugin 管理の auth/webhook verification には `"plugin"` を使用します。
- `match`: optional。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: optional。同じ Plugin が自身の既存 route registration を置き換えることを許可します。
- `handler`: route が request を処理した場合は `true` を返します。

注意:

- `api.registerHttpHandler(...)` は削除されており、plugin-load error を引き起こします。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin routes は `auth` を明示的に宣言する必要があります。
- 完全に同一の `path + match` の競合は、`replaceExisting: true` でない限り拒否され、ある Plugin が別の Plugin の route を置き換えることはできません。
- `auth` level が異なる重複 routes は拒否されます。`exact`/`prefix` の fallthrough chain は同じ auth level のみで維持してください。
- `auth: "plugin"` routes は、operator runtime scopes を自動では受け取り**ません**。これらは plugin 管理の webhooks/signature verification のためのものであり、特権付き Gateway helper calls のためのものではありません。
- `auth: "gateway"` routes は Gateway request runtime scope 内で実行されますが、その scope は意図的に保守的です。
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、caller が `x-openclaw-scopes` を送信しても、plugin-route runtime scopes は `operator.write` に固定されます
  - 信頼された identity-bearing HTTP modes（たとえば `trusted-proxy` または private ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` header が明示的に存在する場合にのみそれを尊重します
  - そのような identity-bearing plugin-route requests で `x-openclaw-scopes` が存在しない場合、runtime scope は `operator.write` にフォールバックします
- 実用上のルール: gateway-auth の plugin route が暗黙の admin surface だと想定しないでください。route が admin-only behavior を必要とする場合は、identity-bearing auth mode を要求し、明示的な `x-openclaw-scopes` header contract を文書化してください。

## Plugin SDK import paths

plugins を作成する際は、巨大な `openclaw/plugin-sdk` import ではなく SDK subpaths を使用してください。

- plugin registration primitives には `openclaw/plugin-sdk/plugin-entry`。
- 汎用の共有 plugin-facing contract には `openclaw/plugin-sdk/core`。
- ルート `openclaw.json` Zod schema export（`OpenClawSchema`）には `openclaw/plugin-sdk/config-schema`。
- 共有の setup/auth/reply/webhook wiring には、`openclaw/plugin-sdk/channel-setup`、
  `openclaw/plugin-sdk/setup-runtime`、
  `openclaw/plugin-sdk/setup-adapter-runtime`、
  `openclaw/plugin-sdk/setup-tools`、
  `openclaw/plugin-sdk/channel-pairing`、
  `openclaw/plugin-sdk/channel-contract`、
  `openclaw/plugin-sdk/channel-feedback`、
  `openclaw/plugin-sdk/channel-inbound`、
  `openclaw/plugin-sdk/channel-lifecycle`、
  `openclaw/plugin-sdk/channel-reply-pipeline`、
  `openclaw/plugin-sdk/command-auth`、
  `openclaw/plugin-sdk/secret-input`、
  `openclaw/plugin-sdk/webhook-ingress` のような stable な channel primitives。
  `channel-inbound` は debounce、mention matching、受信 mention-policy helpers、envelope formatting、受信 envelope context helpers のための共有ホームです。
  `channel-setup` は狭い optional-install setup seam です。
  `setup-runtime` は、`setupEntry` / deferred startup で使われる runtime-safe な setup surface であり、import-safe な setup patch adapters を含みます。
  `setup-adapter-runtime` は env-aware な account-setup adapter seam です。
  `setup-tools` は小さな CLI/archive/docs helper seam（`formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`）です。
- 共有の runtime/config helpers には、`openclaw/plugin-sdk/channel-config-helpers`、
  `openclaw/plugin-sdk/allow-from`、
  `openclaw/plugin-sdk/channel-config-schema`、
  `openclaw/plugin-sdk/telegram-command-config`、
  `openclaw/plugin-sdk/channel-policy`、
  `openclaw/plugin-sdk/approval-gateway-runtime`、
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`、
  `openclaw/plugin-sdk/approval-handler-runtime`、
  `openclaw/plugin-sdk/approval-runtime`、
  `openclaw/plugin-sdk/config-runtime`、
  `openclaw/plugin-sdk/infra-runtime`、
  `openclaw/plugin-sdk/agent-runtime`、
  `openclaw/plugin-sdk/lazy-runtime`、
  `openclaw/plugin-sdk/reply-history`、
  `openclaw/plugin-sdk/routing`、
  `openclaw/plugin-sdk/status-helpers`、
  `openclaw/plugin-sdk/text-runtime`、
  `openclaw/plugin-sdk/runtime-store`、
  `openclaw/plugin-sdk/directory-runtime` のような domain subpaths。
  `telegram-command-config` は Telegram custom command の normalization/validation のための狭い public seam であり、bundled Telegram contract surface が一時的に利用できない場合でも利用可能なままです。
  `text-runtime` は、assistant-visible-text stripping、markdown render/chunking helpers、redaction helpers、directive-tag helpers、safe-text utilities を含む、共有の text/markdown/logging seam です。
- approval 固有の channel seams では、plugin 上の 1 つの `approvalCapability` contract を優先してください。その後 core は、その 1 つの capability を通じて approval auth、delivery、render、native-routing、lazy native-handler behavior を読み取ります。approval behavior を無関係な plugin fields に混ぜ込まないでください。
- `openclaw/plugin-sdk/channel-runtime` は非推奨で、古い plugins 向けの互換性 shim としてのみ残されています。新しい code ではより狭い汎用 primitives を import すべきであり、repo code でも shim への新しい import を追加すべきではありません。
- bundled extension internals は private のままです。外部 plugins は `openclaw/plugin-sdk/*` subpaths のみを使用するべきです。OpenClaw の core/test code は、plugin package root 配下の `index.js`、`api.js`、`runtime-api.js`、`setup-entry.js`、`login-qr-api.js` のような狭く限定された files など、repo の public entry points を使用できます。core からも別の extension からも、plugin package の `src/*` を import してはいけません。
- repo entry point の分割:
  `<plugin-package-root>/api.js` は helper/types barrel、
  `<plugin-package-root>/runtime-api.js` は runtime-only barrel、
  `<plugin-package-root>/index.js` は bundled plugin entry、
  `<plugin-package-root>/setup-entry.js` は setup plugin entry です。
- 現在の bundled provider の例:
  - Anthropic は `wrapAnthropicProviderStream`、beta-header helpers、`service_tier` parsing のような Claude stream helpers のために `api.js` / `contract-api.js` を使用します。
  - OpenAI は provider builders、default-model helpers、realtime provider builders のために `api.js` を使用します。
  - OpenRouter は provider builder と onboarding/config helpers のために `api.js` を使用し、一方で `register.runtime.js` は repo ローカル用途のために汎用的な `plugin-sdk/provider-stream` helpers を再 export できます。
- facade-loaded public entry points は、利用可能な場合はアクティブな runtime config snapshot を優先し、その後 OpenClaw がまだ runtime snapshot を提供していない場合には disk 上で解決された config file にフォールバックします。
- 汎用の共有 primitives は、依然として推奨される public SDK contract です。bundled channel ブランド付き helper seams の小さな予約済み互換性セットはまだ存在します。これらは bundled-maintenance/compatibility seams として扱い、新しいサードパーティ import targets として扱わないでください。新しい cross-channel contracts は、引き続き汎用的な `plugin-sdk/*` subpaths または plugin ローカルの `api.js` / `runtime-api.js` barrels に配置するべきです。

互換性に関する注意:

- 新しい code では、ルートの `openclaw/plugin-sdk` barrel は避けてください。
- まずは狭く安定した primitives を優先してください。新しい setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool subpaths は、新しい bundled および外部 Plugin 作業に対する意図された contract です。
  target の parsing/matching は `openclaw/plugin-sdk/channel-targets` に属します。
  message action gates と reaction message-id helpers は
  `openclaw/plugin-sdk/channel-actions` に属します。
- bundled extension 固有の helper barrels は、デフォルトでは stable ではありません。
  helper が bundled extension だけに必要な場合は、それを
  `openclaw/plugin-sdk/<extension>` に昇格させるのではなく、その extension の
  ローカルな `api.js` または `runtime-api.js` seam の背後に置いてください。
- 新しい共有 helper seams は、channel ブランド付きではなく汎用であるべきです。共有 target
  parsing は `openclaw/plugin-sdk/channel-targets` に属し、channel 固有の
  internals は所有する Plugin のローカルな `api.js` または `runtime-api.js`
  seam の背後に残すべきです。
- `image-generation`、
  `media-understanding`、`speech` のような capability 固有 subpaths は、現在
  bundled/native plugins がそれらを使っているため存在しています。これらが存在すること自体は、export されたすべての helper が
  長期的に凍結された外部 contract であることを意味しません。

## Message tool schemas

plugins は、channel 固有の `describeMessageTool(...)` schema
contributions を所有するべきです。provider 固有 fields は共有 core ではなく、Plugin に保持してください。

共有可能な portable schema fragments については、
`openclaw/plugin-sdk/channel-actions` から export される汎用 helpers を再利用してください。

- button-grid スタイルの payloads には `createMessageToolButtonsSchema()`
- 構造化された card payloads には `createMessageToolCardSchema()`

ある schema shape が 1 つの provider にしか意味を持たないなら、共有 SDK に昇格させるのではなく、その Plugin 自身の source に定義してください。

## Channel target resolution

channel plugins は、channel 固有の target semantics を所有するべきです。共有 outbound host は汎用のままに保ち、provider rules には messaging adapter surface を使ってください。

- `messaging.inferTargetChatType({ to })` は、正規化済み target を
  directory lookup 前に `direct`、`group`、`channel` のどれとして扱うべきかを決定する
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、directory search の代わりに入力をそのまま id-like resolution に進めるべきかを core に伝える
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  directory miss 後に、core が最終的な provider 所有 resolution を必要とする場合の plugin fallback である
- `messaging.resolveOutboundSessionRoute(...)` は、target 解決後の
  provider 固有 session route construction を所有する

推奨される分担:

- peers/groups の検索前に行うべきカテゴリ判断には `inferTargetChatType` を使う
- 「これを明示的/ネイティブな target id として扱う」チェックには `looksLikeId` を使う
- provider 固有の normalization fallback には `resolveTarget` を使い、広範な directory search には使わない
- chat ids、thread ids、JIDs、handles、room ids のような provider ネイティブ ids は、汎用 SDK fields ではなく `target` values または provider 固有 params の中に保持する

## Config-backed directories

config から directory entries を導出する plugins は、そのロジックを Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有 helpers を再利用するべきです。

これは、channel が次のような config-backed peers/groups を必要とする場合に使用します。

- allowlist に基づく DM peers
- 設定済みの channel/group maps
- account-scoped の静的 directory fallbacks

`directory-runtime` の共有 helpers は、汎用操作のみを扱います。

- query filtering
- limit application
- deduping/normalization helpers
- `ChannelDirectoryEntry[]` の構築

channel 固有の account inspection と id normalization は、Plugin 実装内に残すべきです。

## Provider catalogs

provider plugins は、
`registerProvider({ catalog: { run(...) { ... } } })` を使って、推論用の model catalogs を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むのと同じ shape を返します。

- 1 つの provider entry に対しては `{ provider }`
- 複数の provider entries に対しては `{ providers }`

provider 固有の model ids、base URL defaults、または auth-gated model metadata を Plugin が所有する場合は `catalog` を使ってください。

`catalog.order` は、OpenClaw の built-in implicit providers に対して Plugin の catalog がいつ merge されるかを制御します。

- `simple`: 単純な API-key または env 駆動 providers
- `profile`: auth profiles が存在すると現れる providers
- `paired`: 複数の関連 provider entries を合成する providers
- `late`: 他の implicit providers の後の最後のパス

後の providers がキー衝突時に勝つため、plugins は同じ provider id を持つ built-in provider entry を意図的に上書きできます。

互換性:

- `discovery` はレガシーな別名として引き続き機能する
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用する

## 読み取り専用の channel inspection

Plugin が channel を登録する場合は、`resolveAccount(...)` とあわせて
`plugin.config.inspectAccount(cfg, accountId)` の実装を優先してください。

理由:

- `resolveAccount(...)` は runtime path です。credentials が完全に materialize されていることを前提にしてよく、必要な secrets が欠けている場合は即座に失敗して構いません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、および doctor/config
  repair flows のような読み取り専用 command paths は、設定を説明するだけのために runtime credentials を materialize する必要があるべきではありません。

推奨される `inspectAccount(...)` の振る舞い:

- 説明的な account state のみを返す
- `enabled` と `configured` を保持する
- 関連する場合は、次のような credential source/status fields を含める
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するためだけに raw token values を返す必要はありません。status-style commands には `tokenStatus: "available"`（および対応する source field）を返せば十分です。
- credential が SecretRef 経由で設定されているが、現在の command path では利用できない場合は `configured_unavailable` を使う

これにより、読み取り専用 commands は、クラッシュしたり account を未設定だと誤報したりする代わりに、「設定済みだがこの command path では利用できない」と報告できます。

## Package packs

Plugin directory には、`openclaw.extensions` を含む `package.json` を置けます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各 entry は 1 つの Plugin になります。pack に複数の extensions が列挙されている場合、plugin id は `name/<fileBase>` になります。

Plugin が npm deps を import する場合は、その directory でそれらを install して
`node_modules` を利用可能にしてください（`npm install` / `pnpm install`）。

セキュリティのガードレール: すべての `openclaw.extensions` entry は、symlink 解決後も Plugin
directory 内に留まらなければなりません。package directory から外に出る entries は拒否されます。

セキュリティに関する注意: `openclaw plugins install` は、plugin dependencies を
`npm install --omit=dev --ignore-scripts` で install します（lifecycle scripts なし、runtime での dev dependencies なし）。plugin dependency
trees は「pure JS/TS」に保ち、`postinstall` builds を必要とする packages は避けてください。

任意: `openclaw.setupEntry` は軽量な setup 専用 module を指せます。
OpenClaw が無効な channel plugin 用の setup surfaces を必要とする場合、または
channel plugin が有効でも未設定である場合には、完全な plugin entry の代わりに `setupEntry`
を読み込みます。これにより、main plugin entry が tools、hooks、その他の runtime-only
code も配線している場合に、startup と setup を軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を指定すると、gateway の pre-listen startup phase 中、channel がすでに設定済みであっても、channel plugin は同じ `setupEntry` path を使うようにできます。

これは、`setupEntry` が gateway が listen を開始する前に存在しなければならない startup surface を完全にカバーしている場合にのみ使用してください。実際には、setup entry は startup が依存する channel 所有 capabilities をすべて登録する必要があります。たとえば:

- channel registration 自体
- gateway が listen を開始する前に利用可能でなければならない HTTP routes
- その同じウィンドウ中に存在しなければならない gateway methods、tools、services

full entry が依然として必要な startup capability を所有しているなら、この flag を有効にしてはいけません。デフォルト動作のままにし、OpenClaw に startup 中に full entry を読み込ませてください。

bundled channels は、full channel runtime が読み込まれる前に core が参照できる setup-only contract-surface helpers を公開することもできます。現在の setup
promotion surface は次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、full plugin entry を読み込まずにレガシーな single-account channel
config を `channels.<id>.accounts.*` に昇格させる必要があるときに、その surface を使います。
Matrix は現在の bundled の例です。named accounts がすでに存在する場合は auth/bootstrap keys のみを named な promoted account に移動し、常に `accounts.default` を作成するのではなく、設定済みの非 canonical な default-account key を保持できます。

これらの setup patch adapters は、bundled contract-surface discovery を lazy に保ちます。import 時間は軽いままで、promotion surface は module import 時に bundled channel startup に再突入する代わりに、最初の使用時にのみ読み込まれます。

それらの startup surfaces に Gateway RPC methods が含まれる場合は、
plugin 固有の prefix を付けてください。core admin namespaces（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、Plugin がより狭い scope を要求しても常に `operator.admin` に解決されます。

例:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel catalog metadata

channel plugins は、`openclaw.channel` を通じて setup/discovery metadata を、`openclaw.install` を通じて install hints を公開できます。これにより core catalog をデータフリーに保てます。

例:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

最小例以外で有用な `openclaw.channel` fields:

- `detailLabel`: より豊かな catalog/status surfaces のための二次ラベル
- `docsLabel`: docs link のリンクテキストを上書きする
- `preferOver`: この catalog entry が上位に出るべき低優先度の plugin/channel ids
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface の copy controls
- `markdownCapable`: outbound formatting の判断用に、その channel が markdown 対応であることを示す
- `exposure.configured`: `false` に設定すると、その channel を configured-channel listing surfaces から隠す
- `exposure.setup`: `false` に設定すると、その channel を interactive setup/configure pickers から隠す
- `exposure.docs`: docs navigation surfaces 用に、その channel を internal/private としてマークする
- `showConfigured` / `showInSetup`: レガシーな別名も互換性のため引き続き受け付けるが、`exposure` を優先する
- `quickstartAllowFrom`: その channel を標準のクイックスタート `allowFrom` flow に opt in する
- `forceAccountBinding`: account が 1 つしかない場合でも明示的な account binding を要求する
- `preferSessionLookupForAnnounceTarget`: announce targets の解決時に session lookup を優先する

OpenClaw は**外部 channel catalogs**（たとえば MPM
registry export）を merge することもできます。次のいずれかの場所に JSON file を置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で、1 つ以上の JSON files を指定してください（comma/semicolon/`PATH` 区切り）。各 file には `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。parser は `"entries"` key のレガシーな別名として `"packages"` または `"plugins"` も受け付けます。

## Context engine plugins

Context engine plugins は、ingest、assembly、Compaction に関する session context orchestration を所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブな engine を選択します。

これは、memory search や hooks を追加するだけではなく、デフォルトの context
pipeline を置き換えたり拡張したりする必要がある場合に使用します。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

engine が Compaction algorithm を所有**しない**場合でも、`compact()`
は実装したまま、明示的に委譲してください。

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 新しい capability の追加

Plugin が現在の API に合わない behavior を必要とする場合、private な内部依存で
plugin system を迂回しないでください。不足している capability を追加してください。

推奨される手順:

1. core contract を定義する
   core が所有すべき共有 behavior を決めます。policy、fallback、config merge、
   lifecycle、channel-facing semantics、runtime helper shape を含みます。
2. 型付きの plugin registration/runtime surfaces を追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な
   型付き capability surface で拡張します。
3. core + channel/feature consumers を接続する
   channels と feature plugins は、新しい capability を core を通じて利用するべきであり、vendor implementation を直接 import してはいけません。
4. vendor implementations を登録する
   その後、vendor plugins がその capability に対して backends を登録します。
5. contract coverage を追加する
   ownership と registration shape が時間とともに明示的なままであるよう、tests を追加します。

これが、OpenClaw が意見を持ちながらも、1 つの provider の worldview にハードコードされない理由です。具体的な file checklist と worked example については、[Capability Cookbook](/ja-JP/plugins/architecture)
を参照してください。

### Capability checklist

新しい capability を追加するとき、実装では通常、次の surfaces をまとめて変更する必要があります。

- `src/<capability>/types.ts` の core contract types
- `src/<capability>/runtime.ts` の core runner/runtime helper
- `src/plugins/types.ts` の plugin API registration surface
- `src/plugins/registry.ts` の plugin registry wiring
- feature/channel
  plugins がそれを利用する必要がある場合の `src/plugins/runtime/*` における plugin runtime exposure
- `src/test-utils/plugin-registration.ts` の capture/test helpers
- `src/plugins/contracts/registry.ts` の ownership/contract assertions
- `docs/` の operator/plugin docs

これらの surfaces のいずれかが欠けている場合、それは通常、その capability がまだ完全には統合されていない兆候です。

### Capability template

最小パターン:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

contract test パターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールは単純に保たれます。

- core が capability contract + orchestration を所有する
- vendor plugins が vendor implementations を所有する
- feature/channel plugins が runtime helpers を利用する
- contract tests が ownership を明示的に保つ
