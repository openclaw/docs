---
read_when:
    - ネイティブ OpenClaw plugins を構築またはデバッグする
    - Plugin の capability model や ownership boundaries を理解する
    - Plugin の load pipeline や registry に取り組む
    - provider runtime hooks や channel plugins を実装する
sidebarTitle: Internals
summary: 'Plugin の内部: capability model、ownership、contracts、load pipeline、runtime helpers'
title: Plugin Internals
x-i18n:
    generated_at: "2026-04-23T14:05:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin Internals

<Info>
  これは**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、以下を参照してください。
  - [Install and use plugins](/ja-JP/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin チュートリアル
  - [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — メッセージング channel を構築する
  - [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — model provider を構築する
  - [SDK Overview](/ja-JP/plugins/sdk-overview) — import map と登録 API
</Info>

このページでは、OpenClaw Plugin システムの内部アーキテクチャを扱います。

## 公開 capability model

capabilities は、OpenClaw 内部における公開された**ネイティブ Plugin** model です。すべての
ネイティブ OpenClaw Plugin は、1 つ以上の capability types に対して登録されます。

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推論 backend       | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャンネル / メッセージング | `api.registerChannel(...)`                   | `msteams`, `matrix`                  |

capabilities を 1 つも登録せず、hooks、tools、services を提供する
Plugin は、**legacy hook-only** Plugin です。このパターンも引き続き完全にサポートされています。

### 外部互換性の方針

capability model はすでに core に導入されており、現在は bundled/native plugins
で使われていますが、外部 Plugin の互換性には、「export されている、したがって frozen である」
よりも厳しい基準が必要です。

現在の指針:

- **既存の外部 plugins:** hook ベースの統合を動作させ続ける。これを
  互換性の基準線として扱う
- **新しい bundled/native plugins:** vendor 固有の reach-in や新しい hook-only 設計よりも、
  明示的な capability registration を優先する
- **capability registration を採用する外部 plugins:** 使用は可能だが、docs が明示的に contract を stable と示していない限り、
  capability 固有の helper surfaces は進化中だとみなす

実務上のルール:

- capability registration APIs は意図された方向性です
- legacy hooks は、移行期間中の外部 plugins にとって最も安全で破壊的変更の少ない経路のままです
- export された helper subpaths はすべて同等ではありません。偶発的な helper exports ではなく、
  狭く文書化された contract を優先してください

### Plugin の形状

OpenClaw は、各ロード済み Plugin を、静的 metadata だけでなく実際の
登録動作に基づいて形状分類します。

- **plain-capability** -- ちょうど 1 種類の capability type だけを登録する（たとえば
  `mistral` のような provider-only Plugin）
- **hybrid-capability** -- 複数の capability types を登録する（たとえば
  `openai` は text inference、speech、media understanding、image
  generation を所有します）
- **hook-only** -- hooks（typed または custom）のみを登録し、capabilities、
  tools、commands、services を登録しない
- **non-capability** -- tools、commands、services、routes を登録するが
  capabilities は登録しない

Plugin の shape と capability の内訳を確認するには `openclaw plugins inspect <id>` を使用してください。詳細は [CLI reference](/ja-JP/cli/plugins#inspect) を参照してください。

### Legacy hooks

`before_agent_start` hook は、hook-only plugins 向けの互換経路として引き続きサポートされています。実際の legacy plugins は今でもこれに依存しています。

方向性:

- 動作し続けるようにする
- legacy として文書化する
- model/provider override の作業には `before_model_resolve` を優先する
- prompt mutation の作業には `before_prompt_build` を優先する
- 実使用が減少し、fixture coverage によって移行の安全性が証明されるまでは削除しない

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、
次のいずれかのラベルが表示されることがあります。

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config は正常に解析され、plugins も解決される               |
| **compatibility advisory** | Plugin はサポートされているが古いパターンを使用している（例: `hook-only`） |
| **legacy warning**         | Plugin は非推奨の `before_agent_start` を使用している        |
| **hard error**             | Config が無効、または Plugin のロードに失敗した             |

`hook-only` も `before_agent_start` も、今日の時点では Plugin を壊しません --
`hook-only` は advisory であり、`before_agent_start` は warning を出すだけです。これらの
signals は `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムには 4 つの層があります。

1. **Manifest + discovery**
   OpenClaw は、設定済みのパス、workspace roots、
   global plugin roots、bundled plugins から候補 Plugin を見つけます。discovery では、まずネイティブな
   `openclaw.plugin.json` manifests と対応する bundle manifests を読み取ります。
2. **Enablement + validation**
   Core は、発見された Plugin が有効、無効、ブロック済み、
   または memory のような排他的スロット向けに選択済みかを判断します。
3. **Runtime loading**
   ネイティブ OpenClaw plugins は jiti を通じて in-process でロードされ、
   capabilities を central registry に登録します。互換 bundle は runtime code を import せずに
   registry records へ正規化されます。
4. **Surface consumption**
   OpenClaw の他の部分は registry を読み取り、tools、channels、provider
   setup、hooks、HTTP routes、CLI commands、services を公開します。

特に plugin CLI では、root command discovery は 2 段階に分かれています。

- parse-time metadata は `registerCli(..., { descriptors: [...] })` から来ます
- 実際の plugin CLI module は lazy のままでよく、最初の invocation 時に登録できます

これにより、plugin 所有の CLI code を Plugin 内に保ちつつ、OpenClaw は parsing 前に
root command names を確保できます。

重要な設計境界:

- discovery + config validation は、Plugin code を実行せずに **manifest/schema metadata**
  から動作できるべきです
- ネイティブ runtime behavior は Plugin module の `register(api)` path から来ます

この分離により OpenClaw は、完全な runtime が有効になる前でも、
config を検証し、見つからない/無効な plugins を説明し、UI/schema hints を構築できます。

### Channel plugins と共有 message tool

Channel plugins は、通常の chat actions のために別個の send/edit/react tool を登録する必要はありません。OpenClaw は 1 つの共有 `message` tool を core に保持し、
channel plugins はその背後にある channel 固有の discovery と execution を所有します。

現在の境界は次のとおりです。

- core は、共有 `message` tool host、prompt wiring、session/thread
  bookkeeping、execution dispatch を所有します
- channel plugins は、スコープ付き action discovery、capability discovery、および
  channel 固有の schema fragments を所有します
- channel plugins は、conversation ids が thread ids をどのようにエンコードするか、
  あるいは親 conversations からどのように継承するかといった、provider 固有の session conversation grammar を所有します
- channel plugins は、自身の action adapter を通じて最終 action を実行します

channel plugins の SDK surface は
`ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された discovery
call により、Plugin は visible actions、capabilities、schema
contributions をまとめて返せるため、これらの要素が食い違わなくなります。

channel 固有の message-tool param がローカル path やリモート media URL などの
media source を持つ場合、Plugin は
`describeMessageTool(...)` から `mediaSourceParams` も返す必要があります。core はこの明示的な
リストを使って、plugin 所有の param 名をハードコードせずに sandbox path の正規化と outbound media-access hints を適用します。
そこでは channel 全体のフラットな 1 リストではなく、action スコープの map を優先してください。そうしないと、
profile-only の media param が `send` のような無関係な actions でも正規化されてしまいます。

Core は runtime scope をその discovery step に渡します。重要な fields には次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済みの inbound `requesterSenderId`

これは context-sensitive な plugins にとって重要です。channel は、
core `message` tool に channel 固有の分岐をハードコードせずに、アクティブ account、現在の room/thread/message、
あるいは信頼済みの requester identity に基づいて message actions を隠したり公開したりできます。

これが、embedded-runner routing の変更が依然として plugin の作業である理由です。runner は、
共有 `message` tool が現在のターンに対して正しい channel 所有 surface を公開できるよう、
現在の chat/session identity を plugin discovery boundary に転送する責任を持ちます。

channel 所有の execution helpers については、bundled plugins は execution
runtime を自身の extension modules 内に保持する必要があります。core はもはや Discord、
Slack、Telegram、WhatsApp の message-action runtimes を `src/agents/tools` 配下に所有しません。
個別の `plugin-sdk/*-action-runtime` subpaths は公開しておらず、bundled
plugins は自分の extension 所有 modules から自身のローカル runtime code を直接 import するべきです。

同じ境界は、一般に provider 名付き SDK seams にも適用されます。core は Slack、Discord、Signal、
WhatsApp などの extensions 用 channel 固有 convenience barrels を import するべきではありません。core がある動作を必要とするなら、bundled Plugin 自身の `api.ts` / `runtime-api.ts` barrel を消費するか、その必要性を共有 SDK の狭い汎用 capability に昇格させてください。

polls については、具体的に 2 つの execution paths があります。

- `outbound.sendPoll` は、共通 poll model に適合する channels 向けの共有ベースラインです
- `actions.handleAction("poll")` は、channel 固有の poll semantics や追加 poll parameters がある場合の優先経路です

Core は現在、plugin poll dispatch が action を辞退した後まで共有 poll parsing を遅らせるため、
plugin 所有の poll handlers は generic poll parser に先にブロックされることなく、channel 固有の poll
fields を受け付けられます。

完全な起動シーケンスについては [Load pipeline](#load-pipeline) を参照してください。

## Capability ownership model

OpenClaw は、ネイティブ Plugin を、無関係な統合の寄せ集めではなく、**company** または
**feature** の ownership boundary として扱います。

これは次を意味します。

- company Plugin は通常、その company の OpenClaw 向け
  surfaces すべてを所有するべきです
- feature Plugin は通常、導入する完全な feature surface を所有するべきです
- channels は、provider behavior をアドホックに再実装するのではなく、共有 core capabilities を消費するべきです

例:

- bundled の `openai` Plugin は、OpenAI の model-provider behavior と OpenAI の
  speech + realtime-voice + media-understanding + image-generation behavior を所有します
- bundled の `elevenlabs` Plugin は ElevenLabs の speech behavior を所有します
- bundled の `microsoft` Plugin は Microsoft の speech behavior を所有します
- bundled の `google` Plugin は Google の model-provider behavior と Google の
  media-understanding + image-generation + web-search behavior を所有します
- bundled の `firecrawl` Plugin は Firecrawl の web-fetch behavior を所有します
- bundled の `minimax`、`mistral`、`moonshot`、`zai` plugins は、それぞれの
  media-understanding backends を所有します
- bundled の `qwen` Plugin は、Qwen の text-provider behavior と
  media-understanding および video-generation behavior を所有します
- `voice-call` Plugin は feature Plugin です。call transport、tools、
  CLI、routes、Twilio media-stream bridging を所有しますが、vendor plugins を直接 import する代わりに、共有 speech、
  realtime-transcription、realtime-voice capabilities を消費します

意図している最終状態は次のとおりです。

- OpenAI は、text models、speech、images、
  将来の video にまたがっていても 1 つの Plugin に存在する
- 他の vendor も、自身の surface area に対して同じことができる
- channels は、どの vendor Plugin が provider を所有しているかを気にせず、
  core が公開する共有 capability contract を消費する

これが重要な区別です。

- **Plugin** = ownership boundary
- **capability** = 複数の plugins が実装または消費できる core contract

したがって、OpenClaw が video のような新しい domain を追加する場合、最初の問いは
「どの provider が video handling をハードコードすべきか」ではありません。最初の問いは「core の
video capability contract は何か」です。その contract が存在すれば、
vendor plugins はそれに対して登録でき、channel/feature plugins はそれを消費できます。

capability がまだ存在しない場合、通常は次の手順が正しい動きです。

1. core に不足している capability を定義する
2. それを typed な形で plugin API/runtime を通じて公開する
3. channels/features をその capability に対して配線する
4. vendor plugins に実装を登録させる

これにより、ownership を明示したまま、単一 vendor や
一回限りの plugin 固有 code path に依存する core behavior を避けられます。

### Capability layering

code をどこに置くべきか判断するときは、次の mental model を使ってください。

- **core capability layer**: 共有 orchestration、policy、fallback、config
  merge rules、delivery semantics、typed contracts
- **vendor plugin layer**: vendor 固有 APIs、auth、model catalogs、speech
  synthesis、image generation、将来の video backends、usage endpoints
- **channel/feature plugin layer**: Slack/Discord/voice-call などの統合で、
  core capabilities を消費して surface 上に提示するもの

たとえば TTS は次の形に従います。

- core は reply 時の TTS policy、fallback order、prefs、channel delivery を所有します
- `openai`、`elevenlabs`、`microsoft` は synthesis implementations を所有します
- `voice-call` は telephony TTS runtime helper を消費します

将来の capabilities でも、この同じパターンを優先すべきです。

### 複数 capability を持つ company Plugin の例

company Plugin は、外から見て一貫性があるように感じられるべきです。OpenClaw に
models、speech、realtime transcription、realtime voice、media
understanding、image generation、video generation、web fetch、web search の共有 contracts がある場合、
vendor は 1 か所で自分のすべての surfaces を所有できます。

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
      // vendor speech config — SpeechProviderPlugin interface を直接実装
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

重要なのは helper 名そのものではありません。重要なのは形です。

- 1 つの Plugin が vendor surface を所有する
- core は引き続き capability contracts を所有する
- channels と feature plugins は vendor code ではなく `api.runtime.*` helpers を消費する
- contract tests は、その Plugin が所有すると主張する capabilities を本当に登録したかを検証できる

### Capability の例: video understanding

OpenClaw はすでに image/audio/video understanding を 1 つの共有
capability として扱っています。同じ ownership model がここにも当てはまります。

1. core が media-understanding contract を定義する
2. vendor plugins は、該当するものとして `describeImage`、`transcribeAudio`、
   `describeVideo` を登録する
3. channels と feature plugins は、vendor code に直接配線する代わりに、共有 core behavior を消費する

これにより、ある 1 つの provider の video 前提を core に焼き込むことを避けられます。Plugin が
vendor surface を所有し、core が capability contract と fallback behavior を所有します。

video generation もすでに同じ流れを使っています。core が typed な
capability contract と runtime helper を所有し、vendor plugins が
`api.registerVideoGenerationProvider(...)` implementations をそれに対して登録します。

具体的なロールアウト手順が必要ですか。詳しくは
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## Contracts と enforcement

plugin API surface は、意図的に typed かつ
`OpenClawPluginApi` に一元化されています。この contract は、サポートされる registration points と、
Plugin が依存してよい runtime helpers を定義します。

これが重要な理由:

- plugin authors は 1 つの安定した内部標準を得られる
- core は、たとえば同じ
  provider id を 2 つの plugins が登録するような重複 ownership を拒否できる
- 起動時に、不正な registration に対する実行可能な diagnostics を表示できる
- contract tests により、bundled-plugin ownership を強制し、静かな drift を防げる

enforcement には 2 つの層があります。

1. **runtime registration enforcement**
   plugins のロード時に Plugin registry が registrations を検証します。例:
   duplicate provider ids、duplicate speech provider ids、不正な
   registrations は、未定義動作ではなく plugin diagnostics を生成します。
2. **contract tests**
   test 実行中に bundled plugins は contract registries に取り込まれ、
   OpenClaw が ownership を明示的に検証できるようになります。現在これは model
   providers、speech providers、web search providers、および bundled registration
   ownership に使われています。

実際の効果として、OpenClaw はどの Plugin がどの
surface を所有するかを最初から把握しています。これにより core と channels は、
ownership が暗黙的ではなく、宣言され、typed で、テスト可能であるため、シームレスに構成できます。

### Contract に含めるべきもの

良い plugin contracts は次のようなものです。

- typed
- 小さい
- capability 固有
- core が所有する
- 複数の plugins で再利用可能
- vendor の知識なしに channels/features が消費できる

悪い plugin contracts は次のようなものです。

- core に隠された vendor 固有 policy
- registry をバイパスする一回限りの plugin escape hatches
- vendor implementation に直接 reach-in する channel code
- `OpenClawPluginApi` または
  `api.runtime` の一部ではないアドホックな runtime objects

迷ったら、抽象度を上げてください。まず capability を定義し、その後で
plugins にそれを差し込ませます。

## 実行モデル

ネイティブ OpenClaw plugins は Gateway と **in-process** で動作します。sandbox 化は
されません。ロードされたネイティブ Plugin は、core code と同じプロセスレベルの trust boundary を持ちます。

影響:

- ネイティブ Plugin は tools、network handlers、hooks、services を登録できる
- ネイティブ Plugin のバグで gateway がクラッシュしたり不安定化したりする可能性がある
- 悪意あるネイティブ Plugin は、OpenClaw process 内での任意コード実行と同等

互換 bundles は、OpenClaw が現在それらを
metadata/content packs として扱うため、デフォルトではより安全です。現在のリリースでは、これは主に bundled
skills を意味します。

bundled ではない plugins には allowlists と明示的な install/load paths を使用してください。workspace plugins は
本番のデフォルトではなく、開発時の code として扱ってください。

bundled workspace package names では、plugin id は npm
name に固定してください。デフォルトは `@openclaw/<id>`、あるいは
Plugin が意図的により狭い役割を公開する場合には、承認済みの typed suffix である
`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` を使用します。

重要な trust の注記:

- `plugins.allow` は **plugin ids** を信頼し、source provenance は信頼しません。
- bundled Plugin と同じ id を持つ workspace Plugin は、その workspace Plugin が有効化/allowlist されている場合、意図的に bundled copy を上書きします。
- これは正常であり、ローカル開発、patch testing、hotfixes に有用です。
- bundled-plugin trust は、install metadata ではなく、source snapshot から解決されます。つまりロード時点の manifest とディスク上の code です。破損した、または差し替えられた install record が、実際の source が主張する以上に bundled Plugin の trust
  surface を静かに広げることはできません。

## Export boundary

OpenClaw は implementation convenience ではなく capabilities を export します。

capability registration は公開のままにし、contract ではない helper exports は削減してください。

- bundled-plugin 固有の helper subpaths
- 公開 API として意図されていない runtime plumbing subpaths
- vendor 固有の convenience helpers
- 実装詳細である setup/onboarding helpers

一部の bundled-plugin helper subpaths は、互換性と bundled-plugin 保守のために、生成された SDK export
map にまだ残っています。現在の例には
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seams が含まれます。これらは、
新しいサードパーティ plugins 向けの推奨 SDK パターンではなく、予約済みの実装詳細 export として扱ってください。

## Load pipeline

起動時、OpenClaw はおおむね次のことを行います。

1. 候補 Plugin roots を発見する
2. ネイティブまたは互換 bundle の manifests と package metadata を読み取る
3. 安全でない candidates を拒否する
4. plugin config（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各 candidate の enablement を決定する
6. 有効なネイティブ modules をロードする: build 済み bundled modules は native loader を使い、
   build されていないネイティブ plugins は jiti を使う
7. ネイティブ `register(api)` hooks を呼び出し、registrations を plugin registry に収集する
8. registry を commands/runtime surfaces に公開する

<Note>
`activate` は `register` の legacy alias です。loader は存在する方（`def.register ?? def.activate`）を解決して同じ場所で呼び出します。すべての bundled plugins は `register` を使用しています。新しい plugins では `register` を優先してください。
</Note>

安全性 gate は runtime 実行 **前** に行われます。entry が plugin root を逸脱している、
path が world-writable である、または bundled ではない plugins に対して path
ownership が疑わしい場合、その candidate はブロックされます。

### Manifest-first behavior

manifest は control-plane の source of truth です。OpenClaw はそれを使って次を行います。

- Plugin を識別する
- 宣言済み channels/skills/config schema または bundle capabilities を発見する
- `plugins.entries.<id>.config` を検証する
- Control UI の labels/placeholders を拡張する
- install/catalog metadata を表示する
- Plugin runtime をロードせずに、軽量な activation と setup descriptors を保持する

ネイティブ plugins では、runtime module が data-plane 部分です。これは hooks、tools、commands、provider flows などの実際の動作を登録します。

任意の manifest `activation` と `setup` blocks は control plane に留まります。
これらは activation planning と setup discovery のための metadata-only descriptors であり、runtime registration、`register(...)`、`setupEntry` を置き換えるものではありません。
最初の live activation consumers は、manifest の command、channel、provider hints を使って、より広い registry materialization の前に plugin loading を絞り込むようになっています。

- CLI のロードは、要求された primary command を所有する plugins に絞り込まれます
- channel setup/plugin resolution は、要求された
  channel id を所有する plugins に絞り込まれます
- 明示的な provider setup/runtime resolution は、要求された
  provider id を所有する plugins に絞り込まれます

setup discovery は、setup 時 runtime hooks がまだ必要な plugins に対して `setup-api` にフォールバックする前に、
`setup.providers` や `setup.cliBackends` のような descriptor 所有 ids を優先して candidate plugins を絞り込みます。複数の発見済み Plugin が同じ正規化済み setup provider または CLI backend
id を主張する場合、setup lookup は discovery order に依存せず、その曖昧な owner を拒否します。

### loader がキャッシュするもの

OpenClaw は、次に対する短命の in-process caches を保持します。

- discovery results
- manifest registry data
- loaded plugin registries

これらの caches は、突発的な startup と繰り返し command のオーバーヘッドを減らします。これらは永続化ではなく、短命の performance caches と考えるのが安全です。

パフォーマンスに関する注記:

- これらの caches を無効にするには `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定してください。
- cache window は `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## Registry model

ロードされた plugins は、無作為に core globals を直接変更しません。代わりに、
central plugin registry に登録します。

registry が追跡するもの:

- plugin records（identity、source、origin、status、diagnostics）
- tools
- legacy hooks と typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin 所有 commands

その後 core features は、Plugin modules と直接やり取りするのではなく、この registry から読み取ります。これによりロード方向は一方向に保たれます。

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性のために重要です。つまり、ほとんどの core surfaces は
「すべての Plugin module を特別扱いする」ではなく、「registry を読む」という 1 つの統合点だけを必要とします。

## Conversation binding callbacks

conversation を bind する plugins は、approval が解決されたときに反応できます。

bind request が承認または拒否された後に callback を受け取るには
`api.onConversationBindingResolved(...)` を使用します。

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

      // request は拒否された。ローカルの pending state をクリアする。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

callback payload fields:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認済み requests に対する解決済み binding
- `request`: 元の request summary、detach hint、sender id、および
  conversation metadata

この callback は通知専用です。conversation を bind できる相手を変更するものではなく、
core の approval handling が終わった後に実行されます。

## Provider runtime hooks

provider plugins は現在 2 層あります。

- manifest metadata: runtime load 前に軽量な provider env-auth lookup を行うための `providerAuthEnvVars`、
  auth を共有する provider variants 用の `providerAuthAliases`、runtime
  load 前に軽量な channel env/setup lookup を行うための `channelEnvVars`、さらに runtime load 前に軽量な onboarding/auth-choice labels と
  CLI flag metadata を提供する `providerAuthChoices`
- config-time hooks: `catalog` / legacy `discovery` と `applyConfigDefaults`
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw は、汎用 agent loop、failover、transcript handling、
tool policy を引き続き所有します。これらの hooks は、provider 固有の behavior を拡張するための surface であり、
推論 transport 全体を custom 実装する必要はありません。

provider に env ベース credentials があり、generic auth/status/model-picker
paths が Plugin runtime をロードせずにそれを認識すべき場合は、manifest の `providerAuthEnvVars` を使用してください。ある provider id が、別の provider id の env vars、auth profiles、config-backed auth、API-key onboarding choice を再利用すべき場合は、manifest の `providerAuthAliases` を使用してください。onboarding/auth-choice
CLI surfaces が provider の choice id、group labels、単純な
1-flag auth wiring を provider runtime をロードせずに認識すべき場合は、manifest の `providerAuthChoices` を使用してください。provider runtime の
`envVars` は、onboarding labels や OAuth
client-id/client-secret setup vars のような operator 向け hints 用に残してください。

channel に env 駆動の auth または setup があり、generic shell-env fallback、config/status checks、setup prompts が
channel runtime をロードせずにそれを認識すべき場合は、manifest の `channelEnvVars` を使用してください。

### Hook の順序と使い方

model/provider plugins に対して、OpenClaw はこれらの hooks をおおよそ次の順序で呼び出します。
「When to use」列は、素早く判断するためのガイドです。

| #   | Hook                              | 何をするか                                                                                                     | 使うべきタイミング                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中に provider config を `models.providers` に公開する                                        | provider が catalog または base URL defaults を所有している                                                                                   |
| 2   | `applyConfigDefaults`             | config materialization 中に provider 所有のグローバル config defaults を適用する                              | defaults が auth mode、env、または provider の model-family semantics に依存する                                                              |
| --  | _(built-in model lookup)_         | OpenClaw はまず通常の registry/catalog path を試す                                                              | _(plugin hook ではない)_                                                                                                                       |
| 3   | `normalizeModelId`                | lookup 前に legacy または preview の model-id aliases を正規化する                                              | provider が canonical model resolution 前の alias cleanup を所有している                                                                      |
| 4   | `normalizeTransport`              | 汎用 model assembly 前に provider-family の `api` / `baseUrl` を正規化する                                     | provider が同じ transport family 内の custom provider ids に対する transport cleanup を所有している                                          |
| 5   | `normalizeConfig`                 | runtime/provider resolution 前に `models.providers.<id>` を正規化する                                          | provider が Plugin と一緒に置くべき config cleanup を必要とする。bundled の Google-family helpers は、対応する Google config entries の backstop も行う |
| 6   | `applyNativeStreamingUsageCompat` | config providers にネイティブ streaming-usage compat rewrites を適用する                                       | provider が endpoint 駆動のネイティブ streaming usage metadata fixes を必要とする                                                            |
| 7   | `resolveConfigApiKey`             | runtime auth のロード前に、config providers 向けの env-marker auth を解決する                                  | provider が provider 所有の env-marker API-key resolution を持つ。`amazon-bedrock` もここに built-in の AWS env-marker resolver を持つ      |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに local/self-hosted または config-backed auth を表面化する                                    | provider が synthetic/local credential marker で動作できる                                                                                    |
| 9   | `resolveExternalAuthProfiles`     | provider 所有の外部 auth profiles をオーバーレイする。CLI/app 所有 creds のデフォルト `persistence` は `runtime-only` | provider が copied refresh tokens を永続化せずに外部 auth credentials を再利用する。manifest に `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済み synthetic profile placeholders の優先度を env/config-backed auth より下げる                           | provider が、優先されるべきでない synthetic placeholder profiles を保存する                                                                  |
| 11  | `resolveDynamicModel`             | まだローカル registry にない provider 所有 model ids に対する同期 fallback                                     | provider が任意の上流 model ids を受け付ける                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` を再実行する                                          | provider が未知 ids の解決前にネットワーク metadata を必要とする                                                                              |
| 13  | `normalizeResolvedModel`          | embedded runner が解決済み model を使う前に最終書き換えを行う                                                   | provider が transport rewrites を必要とするが、引き続き core transport を使う                                                                |
| 14  | `contributeResolvedModelCompat`   | 別の compatible transport の背後にいる vendor models に compat flags を提供する                                 | provider が provider を引き継がずに、proxy transports 上で自分の models を認識する                                                           |
| 15  | `capabilities`                    | 共有 core logic で使われる provider 所有の transcript/tooling metadata                                          | provider が transcript/provider-family quirks を必要とする                                                                                    |
| 16  | `normalizeToolSchemas`            | embedded runner が見る前に tool schemas を正規化する                                                            | provider が transport-family schema cleanup を必要とする                                                                                      |
| 17  | `inspectToolSchemas`              | 正規化後に provider 所有の schema diagnostics を表面化する                                                      | core に provider 固有ルールを教え込まずに keyword warnings を出したい                                                                        |
| 18  | `resolveReasoningOutputMode`      | native vs tagged の reasoning-output contract を選択する                                                        | provider が native fields ではなく tagged reasoning/final output を必要とする                                                                |
| 19  | `prepareExtraParams`              | 汎用 stream option wrappers の前に request params の正規化を行う                                                | provider が default request params または provider ごとの param cleanup を必要とする                                                         |
| 20  | `createStreamFn`                  | 通常の stream path を custom transport で完全に置き換える                                                       | provider が wrapper ではなく custom wire protocol を必要とする                                                                                |
| 21  | `wrapStreamFn`                    | 汎用 wrappers 適用後に stream wrapper をかける                                                                  | provider が custom transport なしで request headers/body/model compat wrappers を必要とする                                                  |
| 22  | `resolveTransportTurnState`       | ネイティブな per-turn transport headers または metadata を添付する                                              | provider が generic transports に provider ネイティブの turn identity を送らせたい                                                           |
| 23  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket headers または session cool-down policy を添付する                                         | provider が generic WS transports に session headers または fallback policy の調整をさせたい                                                |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存済み profile を runtime `apiKey` string に変換する                                  | provider が追加の auth metadata を保存し、custom な runtime token shape を必要とする                                                        |
| 25  | `refreshOAuth`                    | custom refresh endpoints または refresh-failure policy 向けの OAuth refresh override                            | provider が共有の `pi-ai` refreshers に適合しない                                                                                            |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 失敗時に追記される修復ヒントを構築する                                                            | provider が refresh failure 後に provider 所有の auth repair guidance を必要とする                                                           |
| 27  | `matchesContextOverflowError`     | provider 所有の context-window overflow matcher                                                                  | provider に generic heuristics が見逃す raw overflow errors がある                                                                            |
| 28  | `classifyFailoverReason`          | provider 所有の failover reason classification                                                                   | provider が raw API/transport errors を rate-limit/overload などにマッピングできる                                                           |
| 29  | `isCacheTtlEligible`              | proxy/backhaul providers 向けの prompt-cache policy                                                              | provider が proxy 固有の cache TTL gating を必要とする                                                                                       |
| 30  | `buildMissingAuthMessage`         | generic な missing-auth recovery message の置き換え                                                              | provider が provider 固有の missing-auth recovery hint を必要とする                                                                           |
| 31  | `suppressBuiltInModel`            | 古くなった upstream model の抑制と、任意でユーザー向け error hint を出す                                        | provider が古い upstream rows を隠す、または vendor hint に置き換える必要がある                                                             |
| 32  | `augmentModelCatalog`             | discovery 後に synthetic/final catalog rows を追加する                                                          | provider が `models list` や pickers に synthetic な forward-compat rows を必要とする                                                       |
| 33  | `resolveThinkingProfile`          | model 固有の `/think` level set、表示ラベル、デフォルトを決定する                                               | provider が selected models 向けに custom thinking ladder または binary label を公開する                                                     |
| 34  | `isBinaryThinking`                | on/off reasoning toggle compatibility hook                                                                       | provider が binary な thinking on/off のみを公開する                                                                                          |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning support compatibility hook                                                                     | provider が models の一部に対してのみ `xhigh` を提供したい                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | デフォルト `/think` level の compatibility hook                                                                  | provider が model family 向けのデフォルト `/think` policy を所有する                                                                         |
| 37  | `isModernModelRef`                | live profile filters と smoke selection 向けの modern-model matcher                                            | provider が live/smoke の preferred-model matching を所有している                                                                            |
| 38  | `prepareRuntimeAuth`              | 推論直前に、設定済み credential を実際の runtime token/key に交換する                                          | provider が token exchange または短命な request credential を必要とする                                                                      |
| 39  | `resolveUsageAuth`                | `/usage` と関連 status surfaces 向けの usage/billing credentials を解決する                                    | provider が custom な usage/quota token parsing または別の usage credential を必要とする                                                     |
| 40  | `fetchUsageSnapshot`              | auth 解決後に provider 固有の usage/quota snapshots を取得して正規化する                                       | provider が provider 固有の usage endpoint または payload parser を必要とする                                                                |
| 41  | `createEmbeddingProvider`         | memory/search 向けの provider 所有 embedding adapter を構築する                                                | memory embedding behavior は provider Plugin に属する                                                                                        |
| 42  | `buildReplayPolicy`               | provider 向け transcript handling を制御する replay policy を返す                                              | provider が custom transcript policy（たとえば thinking-block stripping）を必要とする                                                        |
| 43  | `sanitizeReplayHistory`           | 汎用 transcript cleanup の後に replay history を書き換える                                                     | provider が共有 compaction helpers を超える provider 固有 replay rewrites を必要とする                                                      |
| 44  | `validateReplayTurns`             | embedded runner の前に replay turns を最終検証または再整形する                                                 | provider transport が generic sanitization 後により厳格な turn validation を必要とする                                                      |
| 45  | `onModelSelected`                 | model が有効になったときに provider 所有の post-selection side effects を実行する                              | provider が model 有効化時に telemetry または provider 所有 state を必要とする                                                              |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致した
provider Plugin を確認し、その後、実際に model id または transport/config を変更するものが見つかるまで、他の hook 対応 provider plugins へフォールスルーします。これにより、
caller がどの bundled Plugin が rewrite を所有しているかを知らなくても、
alias/compat provider shims が機能し続けます。もし provider hook が対応する
Google-family config entry を書き換えない場合でも、bundled の Google config normalizer がその互換 cleanup を適用します。

provider が完全に custom な wire protocol または custom request executor を必要とする場合、それは別クラスの拡張です。これらの hooks は、
OpenClaw の通常の inference loop 上で引き続き動作する provider behavior 向けです。

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

### built-in の例

bundled provider plugins は、各
vendor の catalog、auth、thinking、replay、usage-tracking の必要性に合わせて、上記 hooks を組み合わせて使用します。各 provider に対する正確な
hook set は `extensions/` 配下の plugin source とともに存在するため、
ここでそれを複製するのではなく、そちらを authoritative な一覧として扱ってください。

代表的なパターン:

- **Pass-through catalog providers**（OpenRouter、Kilocode、Z.AI、xAI）は、
  `catalog` と `resolveDynamicModel`/`prepareDynamicModel` を登録し、
  OpenClaw の静的 catalog より先に upstream model ids を表面化できるようにします。
- **OAuth + usage endpoint providers**（GitHub Copilot、Gemini CLI、ChatGPT
  Codex、MiniMax、Xiaomi、z.ai）は、`prepareRuntimeAuth` または `formatApiKey`
  を `resolveUsageAuth` + `fetchUsageSnapshot` と組み合わせ、token exchange と
  `/usage` 統合を所有します。
- **Replay / transcript cleanup** は、`google-gemini`、
  `passthrough-gemini`、`anthropic-by-model`、
  `hybrid-anthropic-openai` といった named families を通じて共有されます。
  各 provider は transcript cleanup を個別実装する代わりに `buildReplayPolicy` で opt in します。
- **Catalog-only** の bundled providers（`byteplus`、`cloudflare-ai-gateway`、
  `huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、
  `venice`、`vercel-ai-gateway`、`volcengine`）は `catalog` だけを登録し、
  共有 inference loop に乗ります。
- **Anthropic 固有の stream helpers**（beta headers、`/fast`/`serviceTier`、
  `context1m`）は、generic SDK ではなく、
  Anthropic bundled Plugin の公開 `api.ts` /
  `contract-api.ts` seam（`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`）内にあります。

## Runtime helpers

plugins は `api.runtime` を通じて、選択された core helpers にアクセスできます。TTS の例:

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

注記:

- `textToSpeech` は、file/voice-note surfaces 向けの通常の core TTS output payload を返します。
- core の `messages.tts` 設定と provider selection を使用します。
- PCM audio buffer + sample rate を返します。plugins 側で provider 向けに resample/encode する必要があります。
- `listVoices` は provider ごとに任意です。vendor 所有の voice pickers や setup flows に使ってください。
- voice listings には、provider-aware な pickers 向けに locale、gender、personality tags などのより豊富な metadata を含められます。
- 現在 telephony をサポートするのは OpenAI と ElevenLabs です。Microsoft はサポートしていません。

plugins は `api.registerSpeechProvider(...)` で speech providers も登録できます。

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

注記:

- TTS policy、fallback、reply delivery は core に残してください。
- vendor 所有の synthesis behavior には speech providers を使用してください。
- 旧来の Microsoft `edge` input は `microsoft` provider id に正規化されます。
- 推奨される ownership model は company 指向です。1 つの vendor Plugin が、
  OpenClaw に capability contracts が追加されるにつれて、
  text、speech、image、将来の media providers を所有できます。

image/audio/video understanding では、plugins は generic な key/value bag の代わりに、
1 つの typed な media-understanding provider を登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注記:

- orchestration、fallback、config、channel wiring は core に残してください。
- vendor behavior は provider Plugin に保持してください。
- 追加拡張は typed のままにすべきです。新しい optional methods、新しい optional
  result fields、新しい optional capabilities。
- video generation もすでに同じパターンに従っています。
  - core が capability contract と runtime helper を所有する
  - vendor plugins が `api.registerVideoGenerationProvider(...)` を登録する
  - feature/channel plugins が `api.runtime.videoGeneration.*` を消費する

media-understanding の runtime helpers については、plugins は次を呼び出せます。

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

audio transcription には、plugins は media-understanding runtime
または旧来の STT alias のどちらも使えます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME を確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` が、image/audio/video understanding の推奨 shared surface です。
- core の media-understanding audio 設定（`tools.media.audio`）と provider fallback order を使用します。
- transcription output が生成されない場合（たとえば skipped/unsupported input）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換 alias として残っています。

plugins は `api.runtime.subagent` を通じてバックグラウンドの subagent runs も起動できます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注記:

- `provider` と `model` は run ごとの任意 override であり、永続的な session 変更ではありません。
- OpenClaw は、これらの override fields を trusted callers に対してのみ尊重します。
- plugin 所有の fallback runs については、operators は `plugins.entries.<id>.subagent.allowModelOverride: true` で opt in する必要があります。
- trusted plugins を特定の canonical `provider/model` targets に制限するには `plugins.entries.<id>.subagent.allowedModels` を使用し、任意 target を明示的に許可するには `"*"` を使用します。
- untrusted plugin の subagent runs も動作はしますが、override requests は黙ってフォールバックされるのではなく拒否されます。

web search については、plugins は agent tool wiring に reach-in する代わりに、
共有 runtime helper を消費できます。

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

plugins は
`api.registerWebSearchProvider(...)` で web-search providers も登録できます。

注記:

- provider selection、credential resolution、共有 request semantics は core に残してください。
- vendor 固有の search transports には web-search providers を使用してください。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せずに search behavior を必要とする feature/channel plugins 向けの推奨 shared surface です。

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

- `generate(...)`: 設定済みの image-generation provider chain を使って画像を生成します。
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

- `path`: gateway HTTP server 配下の route path
- `auth`: 必須。通常の gateway auth を必要とする場合は `"gateway"` を、plugin 管理の auth/webhook verification には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が自分の既存 route registration を置き換えることを許可します。
- `handler`: route が request を処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、plugin-load error の原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin routes は `auth` を明示的に宣言する必要があります。
- 完全一致の `path + match` の競合は、`replaceExisting: true` でない限り拒否され、ある Plugin が別の Plugin の route を置き換えることはできません。
- `auth` レベルが異なる重複 routes は拒否されます。`exact`/`prefix` の fallthrough chains は同じ auth レベル内にのみ保ってください。
- `auth: "plugin"` routes には operator runtime scopes は自動付与されません。これらは、特権的な Gateway helper calls ではなく、plugin 管理の webhooks/signature verification 向けです。
- `auth: "gateway"` routes は Gateway request runtime scope 内で実行されますが、その scope は意図的に保守的です。
  - 共有 secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、caller が `x-openclaw-scopes` を送信しても、plugin-route runtime scopes は `operator.write` に固定されます
  - 信頼された identity-bearing HTTP modes（たとえば `trusted-proxy` や private ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` は header が明示的に存在する場合にのみ尊重されます
  - それらの identity-bearing plugin-route requests で `x-openclaw-scopes` が存在しない場合、runtime scope は `operator.write` にフォールバックします
- 実務上のルール: gateway-auth Plugin route を暗黙の admin surface だと想定しないでください。route に admin-only behavior が必要なら、identity-bearing auth mode を要求し、明示的な `x-openclaw-scopes` header contract を文書化してください。

## Plugin SDK import paths

新しい plugins を作成するときは、巨大な `openclaw/plugin-sdk` root
barrel ではなく、狭い SDK subpaths を使用してください。core subpaths:

| Subpath                             | 用途 |
| ----------------------------------- | ---- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録の基本要素 |
| `openclaw/plugin-sdk/channel-core`  | channel entry/build helpers |
| `openclaw/plugin-sdk/core`          | 汎用の共有 helpers と umbrella contract |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` の Zod schema（`OpenClawSchema`） |

channel plugins は、`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets`、`channel-actions` といった、狭い seams 群から選択します。
approval behavior は、無関係な
plugin fields をまたいで混在させるのではなく、1 つの `approvalCapability` contract に統合すべきです。詳しくは [Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

runtime と config helpers は、対応する `*-runtime` subpaths
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` など）にあります。

<Info>
`openclaw/plugin-sdk/channel-runtime` は非推奨です。古い plugins 向けの互換 shim です。新しい code は、より狭い汎用 primitives を import してください。
</Info>

repo 内部の entry points（bundled Plugin の package root ごと）:

- `index.js` — bundled Plugin entry
- `api.js` — helper/types barrel
- `runtime-api.js` — runtime 専用 barrel
- `setup-entry.js` — setup Plugin entry

外部 plugins は `openclaw/plugin-sdk/*` subpaths だけを import してください。core からも、他の Plugin からも、別の Plugin package の `src/*` を import してはいけません。
facade-loaded entry points は、存在する場合はアクティブな runtime config snapshot を優先し、その後ディスク上の解決済み config file にフォールバックします。

`image-generation`、`media-understanding`、`speech` のような capability 固有 subpaths は、
bundled plugins が現在それらを使用しているため存在します。これらは自動的に長期固定の外部 contracts になるわけではありません。依存する場合は、関連する SDK
reference page を確認してください。

## Message tool schemas

plugins は、reactions、reads、polls のような message 以外の primitives に対する
channel 固有の `describeMessageTool(...)` schema
contributions を所有するべきです。共有 send presentation では、
provider ネイティブの button、component、block、card fields ではなく、
汎用の `MessagePresentation` contract を使用してください。
contract、fallback rules、provider mapping、plugin author checklist については [Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

send 対応 plugins は、message capabilities を通じて何をレンダリングできるかを宣言します。

- semantic presentation blocks（`text`、`context`、`divider`、`buttons`、`select`）に対する `presentation`
- pinned-delivery requests に対する `delivery-pin`

core は、presentation をネイティブにレンダリングするか、テキストに degrade するかを決定します。
汎用 message tool から provider ネイティブの UI escape hatches を公開してはいけません。
legacy ネイティブ schemas 向けの非推奨 SDK helpers は既存の
サードパーティ plugins のために引き続き export されていますが、新しい plugins はそれらを使うべきではありません。

## Channel target resolution

channel plugins は channel 固有の target semantics を所有するべきです。共有
outbound host は汎用のままにし、provider rules には messaging adapter surface を使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化された target を
  directory lookup 前に `direct`、`group`、`channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、ある
  input を directory search ではなく、そのまま id-like resolution に進めるべきかを core に伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  directory miss 後に、core が provider 所有の最終 resolution を必要とするときの plugin fallback です。
- `messaging.resolveOutboundSessionRoute(...)` は、target 解決後の provider 固有 session
  route construction を所有します。

推奨される分割:

- peers/groups を検索する前に行うべき category 判断には `inferTargetChatType` を使う
- 「これを明示的/ネイティブな target id として扱う」判定には `looksLikeId` を使う
- `resolveTarget` は広範な directory search ではなく、provider 固有の normalization fallback に使う
- chat ids、thread ids、JIDs、handles、room
  ids のような provider ネイティブ ids は、汎用 SDK
  fields ではなく、`target` 値または provider 固有 params の中に保持する

## Config-backed directories

config から directory entries を導出する plugins は、そのロジックを
plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有 helpers を再利用するべきです。

これは、channel が次のような config-backed peers/groups を必要とする場合に使います。

- allowlist 駆動の DM peers
- 設定済みの channel/group maps
- account スコープの static directory fallbacks

`directory-runtime` 内の共有 helpers は、汎用操作だけを扱います。

- query filtering
- limit application
- deduping/normalization helpers
- `ChannelDirectoryEntry[]` の構築

channel 固有の account inspection と id normalization は
plugin 実装側に残すべきです。

## Provider catalogs

provider plugins は
`registerProvider({ catalog: { run(...) { ... } } })` で、推論用の model catalogs を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します。

- 1 つの provider entry に対する `{ provider }`
- 複数の provider entries に対する `{ providers }`

plugin が provider 固有の model ids、base URL
defaults、または auth 制御された model metadata を所有している場合は `catalog` を使用してください。

`catalog.order` は、Plugin の catalog が OpenClaw の
built-in implicit providers と比較していつ merge されるかを制御します。

- `simple`: 平文の API-key または env 駆動の providers
- `profile`: auth profiles が存在すると現れる providers
- `paired`: 複数の関連 provider entries を合成する providers
- `late`: 他の implicit providers の後の最終パス

後の provider が key collision で優先されるため、plugins は同じ provider id を持つ
built-in provider entry を意図的に上書きできます。

互換性:

- `discovery` は legacy alias として引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用の channel inspection

Plugin が channel を登録する場合は、`resolveAccount(...)` と並んで
`plugin.config.inspectAccount(cfg, accountId)` の実装を推奨します。

理由:

- `resolveAccount(...)` は runtime path です。credentials が
  完全に materialize されている前提でよく、必要な secrets が欠けていればすぐ失敗してかまいません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、doctor/config
  repair flows のような読み取り専用 command paths では、configuration を説明するだけのために
  runtime credentials を materialize する必要があってはいけません。

推奨される `inspectAccount(...)` の動作:

- account state の説明のみを返す
- `enabled` と `configured` を保持する
- 関連する場合は credential source/status fields を含める。たとえば:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の
  availability を報告するだけなら、生の token 値を返す必要はありません。`tokenStatus: "available"`（および対応する source
  field）を返せば、status 系 commands には十分です。
- credential が SecretRef 経由で設定されているが、
  現在の command path では利用できない場合は `configured_unavailable` を使用する

これにより、読み取り専用 commands は、account を未設定と誤報したりクラッシュしたりせず、
「設定済みだがこの command path では利用不可」と報告できます。

## Package packs

Plugin directory には `openclaw.extensions` を含む `package.json` を置けます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各 entry は 1 つの Plugin になります。pack が複数の extensions を列挙している場合、plugin id
は `name/<fileBase>` になります。

Plugin が npm deps を import する場合は、その directory に
`node_modules` が利用可能になるように deps をインストールしてください（`npm install` / `pnpm install`）。

セキュリティ上のガードレール: すべての `openclaw.extensions` entry は、symlink 解決後も
plugin directory 内に留まる必要があります。package directory の外へ逃げる entries は
拒否されます。

セキュリティに関する注記: `openclaw plugins install` は、
`npm install --omit=dev --ignore-scripts` で plugin dependencies をインストールします（lifecycle scripts なし、本番 runtime では dev dependencies なし）。Plugin の dependency
tree は「pure JS/TS」に保ち、`postinstall` build を必要とする packages は避けてください。

任意: `openclaw.setupEntry` で軽量な setup 専用 module を指定できます。
OpenClaw が無効な channel Plugin の setup surfaces を必要とするとき、または
channel Plugin が有効でもまだ未設定のときは、完全な Plugin entry の代わりに `setupEntry`
をロードします。これにより、main plugin entry が tools、hooks、その他の runtime 専用
code も配線している場合に、startup と setup を軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使うと、gateway の
pre-listen startup phase 中に、channel がすでに設定済みであっても、channel Plugin を同じ `setupEntry` path に opt in させられます。

これを使うのは、gateway が listen を開始する前に存在すべき startup surface を
`setupEntry` が完全にカバーする場合だけにしてください。実際には、setup entry は startup が依存する
すべての channel 所有 capability を登録する必要があります。たとえば:

- channel 登録そのもの
- gateway が listen を開始する前に利用可能でなければならない HTTP routes
- その同じ時間帯に存在している必要がある gateway methods、tools、services

full entry が依然として必要な startup capability を所有している場合は、この flag を有効にしないでください。デフォルト動作のままにし、OpenClaw に startup 中に
full entry をロードさせてください。

bundled channels は、full channel runtime がロードされる前に core が参照できる、
setup 専用の contract-surface helpers も公開できます。現在の setup
promotion surface は次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、legacy な single-account channel
config を、full plugin entry をロードせずに `channels.<id>.accounts.*` へ昇格させる必要があるときに、この surface を使います。
現在の bundled の例は Matrix です。named accounts がすでに存在する場合には、
auth/bootstrap keys だけを named promoted account へ移動し、
常に `accounts.default` を作成するのではなく、設定済みの非 canonical な default-account key を保持できます。

これらの setup patch adapters は、bundled contract-surface discovery を lazy に保ちます。import
time は軽いままで、promotion surface は module import 時に bundled channel startup へ再突入する代わりに、
最初の使用時にだけロードされます。

それらの startup surfaces に gateway RPC methods が含まれる場合は、
plugin 固有 prefix に保ってください。core の admin namespaces（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、Plugin がより狭い scope を要求しても、
常に `operator.admin` に解決されます。

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

channel plugins は、`openclaw.channel` 経由で setup/discovery metadata を、
`openclaw.install` 経由で install hints を公開できます。これにより core catalog を data-free に保てます。

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
      "blurb": "Nextcloud Talk webhook bots によるセルフホスト型チャット。",
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

`openclaw.channel` の最小例以外で役立つ fields:

- `detailLabel`: より豊かな catalog/status surfaces 向けの補助ラベル
- `docsLabel`: docs link のリンクテキストを上書きする
- `preferOver`: この catalog entry が優先して上回るべき、優先度の低い plugin/channel ids
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface の copy 制御
- `markdownCapable`: outbound formatting の判断のために、その channel を markdown 対応としてマークする
- `exposure.configured`: `false` に設定すると、configured-channel listing surfaces から channel を隠す
- `exposure.setup`: `false` に設定すると、interactive setup/configure pickers から channel を隠す
- `exposure.docs`: docs navigation surfaces で channel を internal/private としてマークする
- `showConfigured` / `showInSetup`: 互換性のために引き続き受け付ける legacy aliases。`exposure` を推奨
- `quickstartAllowFrom`: その channel を標準のクイックスタート `allowFrom` フローに opt in させる
- `forceAccountBinding`: account が 1 つしかなくても明示的な account binding を必須にする
- `preferSessionLookupForAnnounceTarget`: announce targets の解決時に session lookup を優先する

OpenClaw は **外部 channel catalogs**（たとえば MPM
registry export）もマージできます。JSON file を次のいずれかに置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または `OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）を、1 つ以上の JSON files に向けて設定してください（カンマ/セミコロン/`PATH` 区切り）。各 file は
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を
含む必要があります。parser は `"entries"` key の legacy aliases として `"packages"` または `"plugins"` も受け付けます。

## Context engine plugins

context engine plugins は、ingest、assembly、
compaction の session context orchestration を所有します。Plugin から
`api.registerContextEngine(id, factory)` で登録し、
アクティブな engine は `plugins.slots.contextEngine` で選択してください。

memory search や hooks を追加するだけではなく、デフォルトの context
pipeline を置き換えるか拡張する必要がある場合にこれを使います。

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

engine が compaction algorithm を**所有しない**場合でも、`compact()`
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

## 新しい capability を追加する

Plugin が現在の API に収まらない behavior を必要とする場合は、private reach-in で
plugin system を迂回しないでください。不足している capability を追加してください。

推奨される手順:

1. core contract を定義する
   policy、fallback、config merge、
   lifecycle、channel-facing semantics、runtime helper shape のうち、どの共有 behavior を core が所有すべきか決めます。
2. typed な plugin registration/runtime surfaces を追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な
   typed capability surface で拡張します。
3. core + channel/feature consumers を配線する
   channels と feature plugins は、vendor implementation を直接 import するのではなく、
   core を通じて新しい capability を消費するべきです。
4. vendor implementations を登録する
   その後 vendor plugins が、その capability に対して backends を登録します。
5. contract coverage を追加する
   ownership と registration shape が時間とともに明示的なまま保たれるよう、tests を追加します。

これが、OpenClaw が 1 つの
provider の worldview にハードコードされることなく、意見を持ち続ける方法です。具体的な file checklist と worked example は [Capability Cookbook](/ja-JP/plugins/architecture)
を参照してください。

### Capability checklist

新しい capability を追加する場合、通常は次の
surfaces をまとめて触ることになります。

- `src/<capability>/types.ts` の core contract types
- `src/<capability>/runtime.ts` の core runner/runtime helper
- `src/plugins/types.ts` の plugin API registration surface
- `src/plugins/registry.ts` の plugin registry wiring
- feature/channel
  plugins がそれを消費する必要がある場合の `src/plugins/runtime/*` の plugin runtime exposure
- `src/test-utils/plugin-registration.ts` の capture/test helpers
- `src/plugins/contracts/registry.ts` の ownership/contract assertions
- `docs/` の operator/plugin docs

これらの surfaces のどれかが欠けている場合、それは通常、その capability がまだ
完全には統合されていない兆候です。

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

// feature/channel plugins 向けの共有 runtime helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

contract test パターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これでルールは単純に保たれます。

- core が capability contract + orchestration を所有する
- vendor plugins が vendor implementations を所有する
- feature/channel plugins が runtime helpers を消費する
- contract tests が ownership を明示的に保つ
