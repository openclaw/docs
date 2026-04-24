---
read_when:
    - ネイティブ OpenClaw Plugin を構築またはデバッグする場合
    - Plugin の機能モデルや所有権の境界を理解する場合
    - Plugin のロードパイプラインやレジストリに取り組む場合
    - プロバイダーランタイム hook やチャンネル Plugin を実装する場合
sidebarTitle: Internals
summary: 'Plugin 内部: 機能モデル、所有権、契約、ロードパイプライン、ランタイムヘルパー'
title: Plugin 内部
x-i18n:
    generated_at: "2026-04-24T05:09:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4506472486e09f33a2e87f0a3c38191a9817d1f36fcdd7dd4f57f0a8453e9b4f
    source_path: plugins/architecture.md
    workflow: 15
---

これは OpenClaw Plugin システムの **詳細アーキテクチャ参照** です。実用的なガイドについては、以下のいずれかの専用ページから始めてください。

<CardGroup cols={2}>
  <Card title="Plugins をインストールして使う" icon="plug" href="/ja-JP/tools/plugin">
    Plugins の追加、有効化、トラブルシューティングのエンドユーザーガイド。
  </Card>
  <Card title="Plugins を構築する" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小限に動作する manifest を使った初回 Plugin チュートリアル。
  </Card>
  <Card title="チャンネル Plugins" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築する。
  </Card>
  <Card title="プロバイダー Plugins" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築する。
  </Card>
  <Card title="SDK 概要" icon="book" href="/ja-JP/plugins/sdk-overview">
    import map と登録 API のリファレンス。
  </Card>
</CardGroup>

## 公開 capability モデル

Capabilities は、OpenClaw 内部における公開の **ネイティブ Plugin** モデルです。すべての
ネイティブ OpenClaw Plugin は、1 つ以上の capability type に対して登録します。

| Capability             | 登録メソッド                              | プラグイン例                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推論バックエンド  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Speech                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Capability を 1 つも登録せず、hook、tool、service を提供する Plugin は
**legacy hook-only** Plugin です。そのパターンも依然として完全にサポートされています。

### 外部互換性の立場

Capability モデルはコアに導入済みであり、現在バンドル済み/ネイティブ Plugins で
使われていますが、外部 Plugin 互換性には「export されているから凍結済み」と
言うよりも厳しい基準が必要です。

| Plugin の状況                                  | ガイダンス                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部 Plugins                         | hook ベースの統合を動き続けるように保つ。これが互換性のベースラインです。                        |
| 新しいバンドル済み/ネイティブ Plugins                        | ベンダー固有の reach-in や新しい hook-only 設計より、明示的な capability 登録を優先してください。 |
| capability 登録を採用する外部 Plugins | 許可されますが、ドキュメントで安定と明記されていない限り、capability 固有 helper surface は進化中として扱ってください。 |

Capability 登録が意図された方向性です。レガシー hook は、移行期間中において
外部 Plugin には依然として最も安全な no-breakage 経路です。export された
helper subpath はすべて同列ではありません。偶発的な helper export よりも、狭く文書化された契約を優先してください。

### Plugin の形

OpenClaw は、読み込まれた各 Plugin を、静的メタデータではなく実際の
登録動作に基づいて形状分類します。

- **plain-capability**: ちょうど 1 つの capability type を登録する（たとえば
  `mistral` のような provider-only Plugin）。
- **hybrid-capability**: 複数の capability type を登録する（たとえば
  `openai` はテキスト推論、speech、メディア理解、画像
  生成を所有します）。
- **hook-only**: hook（型付きまたはカスタム）のみを登録し、capability、
  tool、command、service は登録しない。
- **non-capability**: capability は登録せず、tool、command、service、route を登録する。

Plugin の形状と capability の内訳を確認するには `openclaw plugins inspect <id>` を使用してください。詳細は [CLI reference](/ja-JP/cli/plugins#inspect) を参照してください。

### レガシー hook

`before_agent_start` hook は、hook-only Plugin 向けの互換経路として引き続きサポートされます。現実に使われているレガシー Plugin が依存しています。

方向性:

- 動き続けるよう保つ
- レガシーとして文書化する
- model/provider override の処理には `before_model_resolve` を優先する
- prompt 変更には `before_prompt_build` を優先する
- 実使用が減り、fixture coverage が移行安全性を証明するまでは削除しない

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、
次のいずれかのラベルが表示されることがあります。

| Signal                     | 意味                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config は正常に parse され、Plugins は解決されている                       |
| **compatibility advisory** | Plugin はサポートされているが古いパターン（例: `hook-only`）を使っている |
| **legacy warning**         | Plugin は非推奨の `before_agent_start` を使っている        |
| **hard error**             | Config が無効、または Plugin のロードに失敗した                   |

`hook-only` も `before_agent_start` も、現時点で Plugin を壊しません:
`hook-only` は advisory であり、`before_agent_start` も警告を出すだけです。これらの
シグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムは 4 層あります。

1. **Manifest + discovery**
   OpenClaw は、設定済み path、workspace root、
   グローバル Plugin root、バンドル済み Plugin から候補 Plugin を見つけます。Discovery は最初にネイティブ
   `openclaw.plugin.json` manifest とサポート対象 bundle manifest を読み取ります。
2. **Enablement + validation**
   コアは、検出された Plugin が有効、無効、ブロック、または
   memory のような排他的スロット用に選択されているかを決定します。
3. **Runtime loading**
   ネイティブ OpenClaw Plugin は jiti を介してプロセス内でロードされ、
   中央レジストリに capabilities を登録します。互換 bundle はランタイムコードを import せずに
   レジストリレコードへ正規化されます。
4. **Surface consumption**
   OpenClaw の残り部分は、レジストリを読み取り、tools、channels、provider
   setup、hooks、HTTP routes、CLI commands、services を公開します。

特に Plugin CLI では、ルートコマンド discovery は 2 段階に分かれています。

- parse 時メタデータは `registerCli(..., { descriptors: [...] })` から来る
- 実際の Plugin CLI module は lazy のままでよく、最初の呼び出し時に登録できる

これにより、Plugin 所有の CLI コードを Plugin 内に保ちながら、OpenClaw は
parse 前にルートコマンド名を予約できます。

重要な設計境界:

- discovery + config validation は、Plugin コードを実行せずに **manifest/schema metadata**
  から動作すべき
- ネイティブ runtime behavior は Plugin module の `register(api)` 経路から来る

この分離により、OpenClaw は full runtime が有効になる前に、config を検証し、欠落/無効 Plugin を説明し、
UI/schema hint を構築できます。

### チャンネル Plugins と共有 message ツール

チャンネル Plugin は、通常のチャット操作のために別の send/edit/react ツールを登録する必要はありません。OpenClaw はコア内に 1 つの共有 `message` ツールを保持し、
チャンネル Plugin はその背後にあるチャンネル固有の discovery と execution を所有します。

現在の境界は次のとおりです。

- コアが共有 `message` ツールホスト、prompt 配線、session/thread
  bookkeeping、execution dispatch を所有する
- チャンネル Plugin がスコープ付き action discovery、capability discovery、任意の
  チャンネル固有 schema fragment を所有する
- チャンネル Plugin が、conversation id が thread id をどう符号化するか、
  親 conversation からどう継承するかなど、プロバイダー固有の session conversation grammar を所有する
- チャンネル Plugin が、自身の action adapter を通じて最終 action を実行する

チャンネル Plugin の SDK サーフェスは
`ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一 discovery
呼び出しにより、Plugin は visible action、capability、schema
contribution をまとめて返せるため、それらがずれません。

チャンネル固有の message-tool param がローカル path やリモートメディア URL のような
メディアソースを運ぶ場合、Plugin は
`describeMessageTool(...)` から `mediaSourceParams` も返すべきです。コアはその明示的
リストを使って、Plugin 所有 param 名をハードコードせずに、サンドボックス path 正規化や送信メディアアクセスヒントを適用します。
その場合は、チャンネル全体のフラットリストではなく action スコープの map を優先してください。そうしないと
profile-only の media param が `send` のような無関係 action で正規化されてしまいます。

コアは、その discovery ステップに runtime scope を渡します。重要なフィールドには次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済み受信 `requesterSenderId`

これはコンテキスト依存 Plugin にとって重要です。チャンネルは、アクティブ account、
現在の room/thread/message、または信頼済み requester identity に応じて
message action を隠したり公開したりできます。コア `message` ツール内にチャンネル固有の分岐を
ハードコードする必要はありません。

これが、embedded-runner のルーティング変更が依然として Plugin の作業である理由です。runner は、
現在の chat/session identity を Plugin discovery 境界へ転送する責任を持ち、
共有 `message` ツールが現在のターンに対して正しいチャンネル所有サーフェスを公開できるようにします。

チャンネル所有の execution helper については、バンドル済み Plugin は execution
runtime を自分たちの extension module 内に保持すべきです。コアはもはや Discord、
Slack、Telegram、WhatsApp の message-action runtime を `src/agents/tools` 配下で所有しません。
別個の `plugin-sdk/*-action-runtime` subpath は公開しておらず、バンドル済み
Plugin は自分たちの extension 所有 module からローカル runtime code を直接 import すべきです。

同じ境界は、一般的に provider 名付き SDK seam にも適用されます。コアは Slack、Discord、Signal、
WhatsApp、その他類似 extension 向けのチャンネル固有 convenience barrel を import すべきではありません。コアが何らかの挙動を必要とする場合は、バンドル済み Plugin 自身の `api.ts` / `runtime-api.ts` barrel を消費するか、その必要性を共有 SDK の狭い汎用 capability へ昇格させてください。

poll については、実行経路が 2 つあります。

- `outbound.sendPoll` は、共通
  poll モデルに適合するチャンネル向けの共有ベースライン
- `actions.handleAction("poll")` は、チャンネル固有の
  poll セマンティクスや追加 poll パラメータ向けの推奨経路

現在、コアは共有 poll parser を Plugin poll dispatch が action を拒否した後まで遅らせるため、
Plugin 所有の poll handler は汎用 poll parser に先にブロックされることなく、チャンネル固有の poll
field を受け付けられます。

完全な起動シーケンスについては [Plugin architecture internals](/ja-JP/plugins/architecture-internals) を参照してください。

## Capability 所有権モデル

OpenClaw は、ネイティブ Plugin を、無関係な統合の寄せ集めではなく、
**会社** または **機能** の所有境界として扱います。

つまり:

- 会社 Plugin は通常、その会社の OpenClaw 向け
  サーフェスすべてを所有すべき
- 機能 Plugin は通常、自らが導入する機能サーフェス全体を所有すべき
- チャンネルは、プロバイダー挙動を場当たり的に再実装するのではなく、共有コア capability を消費すべき

<Accordion title="バンドル済み Plugins 全体での所有権パターン例">
  - **ベンダーの multi-capability**: `openai` はテキスト推論、speech、realtime
    voice、メディア理解、画像生成を所有します。`google` はテキスト
    推論に加えてメディア理解、画像生成、web search を所有します。
    `qwen` はテキスト推論に加えてメディア理解と動画生成を所有します。
  - **ベンダーの single-capability**: `elevenlabs` と `microsoft` は speech を所有します。
    `firecrawl` は web-fetch を所有します。`minimax` / `mistral` / `moonshot` / `zai` は
    media-understanding backend を所有します。
  - **機能 Plugin**: `voice-call` は call transport、tools、CLI、routes、
    Twilio media-stream bridging を所有しますが、ベンダー
    Plugin を直接 import する代わりに、共有 speech、realtime
    transcription、realtime voice capability を消費します。
</Accordion>

意図された最終状態は次のとおりです。

- OpenAI は、テキストモデル、speech、画像、将来の動画にまたがっていても 1 つの Plugin に存在する
- 他のベンダーも、自分のサーフェス領域について同じことができる
- チャンネルは、どのベンダー Plugin が provider を所有しているかを気にせず、コアが公開する共有 capability 契約を消費する

これが重要な違いです。

- **plugin** = 所有権境界
- **capability** = 複数の Plugin が実装または消費できるコア契約

したがって、OpenClaw が動画のような新しいドメインを追加する場合、最初の問いは
「どの provider が動画処理をハードコードすべきか」ではありません。最初の問いは「コアの
動画 capability 契約は何か」です。その契約が存在すれば、ベンダー Plugin は
それに対して登録でき、チャンネル/機能 Plugin はそれを消費できます。

Capability がまだ存在しない場合、通常正しい手順は次のとおりです。

1. コアで欠けている capability を定義する
2. それを型付きで plugin API/runtime を通して公開する
3. チャンネル/機能をその capability に対して配線する
4. ベンダー Plugin に実装を登録させる

これにより、所有権を明示したまま、
単一ベンダーや 1 回限りの Plugin 固有コードパスに依存するコア挙動を避けられます。

### Capability のレイヤリング

コードの所属先を決めるときは、このメンタルモデルを使ってください。

- **コア capability レイヤー**: 共有オーケストレーション、ポリシー、フォールバック、config
  マージルール、配信セマンティクス、型付き契約
- **ベンダー Plugin レイヤー**: ベンダー固有 API、認証、モデルカタログ、speech
  synthesis、画像生成、将来の動画 backend、usage endpoint
- **チャンネル/機能 Plugin レイヤー**: Slack/Discord/voice-call などの統合
  で、コア capability を消費してサーフェス上に提示する

たとえば TTS は次の形に従います。

- コアが reply 時の TTS ポリシー、フォールバック順、設定、チャンネル配信を所有する
- `openai`、`elevenlabs`、`microsoft` が synthesis 実装を所有する
- `voice-call` が telephony TTS runtime helper を消費する

同じパターンを将来の capability にも優先すべきです。

### Multi-capability 会社 Plugin の例

会社 Plugin は、外側から見て一貫性があるべきです。OpenClaw に
モデル、speech、realtime transcription、realtime voice、メディア
understanding、画像生成、動画生成、web fetch、web search の共有契約があるなら、
ベンダーはそれらのサーフェスすべてを 1 か所で所有できます。

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
      // ベンダー speech config — SpeechProviderPlugin interface を直接実装
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

重要なのは正確な helper 名ではありません。形が重要です。

- 1 つの Plugin がベンダーサーフェスを所有する
- コアは引き続き capability 契約を所有する
- チャンネルと機能 Plugin は vendor code ではなく `api.runtime.*` helper を消費する
- 契約テストは、その Plugin が所有を主張する capability を実際に登録したことを検証できる

### Capability の例: 動画理解

OpenClaw はすでに、画像/音声/動画理解を 1 つの共有
capability として扱っています。同じ所有権モデルがそこにも適用されます。

1. コアが media-understanding 契約を定義する
2. ベンダー Plugin が、該当するものとして `describeImage`、`transcribeAudio`、
   `describeVideo` を登録する
3. チャンネルと機能 Plugin は、vendor code に直接配線する代わりに、
   共有コア挙動を消費する

これにより、ある 1 つの provider の動画前提をコアに焼き付けることを避けられます。Plugin が
ベンダーサーフェスを所有し、コアが capability 契約とフォールバック挙動を所有します。

動画生成もすでに同じ流れを使っています。コアが型付き
capability 契約と runtime helper を所有し、ベンダー Plugin は
`api.registerVideoGenerationProvider(...)` 実装をそれに対して登録します。

具体的なロールアウトチェックリストが必要ですか。  
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## 契約と強制

Plugin API サーフェスは、意図的に型付きで
`OpenClawPluginApi` に集中されています。この契約が、サポートされる登録ポイントと、
Plugin が依存できる runtime helper を定義します。

これが重要な理由:

- Plugin 作者は 1 つの安定した内部標準を得られる
- コアは、2 つの Plugin が同じ
  provider id を登録するような重複所有権を拒否できる
- 起動時に、不正な登録に対して実行可能な診断を表面化できる
- 契約テストにより、バンドル済み Plugin の所有権を強制し、静かなドリフトを防げる

強制には 2 層あります。

1. **runtime registration enforcement**
   Plugin レジストリは、Plugin 読み込み時に登録を検証します。例:
   duplicate provider id、duplicate speech provider id、不正な
   登録は、未定義挙動ではなく Plugin 診断を生成します。
2. **契約テスト**
   バンドル済み Plugin はテスト実行中に契約レジストリへ取り込まれるため、
   OpenClaw は所有権を明示的に検証できます。現在これは model
   provider、speech provider、web search provider、および bundled registration
   ownership に使われています。

実際の効果として、OpenClaw は最初から、どの Plugin がどの
サーフェスを所有しているかを把握しています。これにより、所有権が暗黙ではなく宣言済みで、型付きで、テスト可能であるため、
コアとチャンネルがシームレスに合成できます。

### 契約に含めるべきもの

良い Plugin 契約は次のようなものです。

- 型付き
- 小さい
- capability 固有
- コア所有
- 複数の Plugin で再利用可能
- ベンダー知識なしにチャンネル/機能から消費可能

悪い Plugin 契約は次のようなものです。

- コア内に隠されたベンダー固有ポリシー
- レジストリをバイパスする 1 回限りの Plugin escape hatch
- vendor 実装へ直接 reach-in するチャンネルコード
- `OpenClawPluginApi` や
  `api.runtime` の一部でない ad hoc runtime object

迷ったら抽象化レベルを上げてください。まず capability を定義し、その後で Plugin をそこへ接続させてください。

## 実行モデル

ネイティブ OpenClaw Plugin は Gateway と **同一プロセス内** で動作します。
サンドボックス化されていません。読み込まれたネイティブ Plugin は、コアコードと同じ
プロセスレベルの trust boundary を持ちます。

含意:

- ネイティブ Plugin は tool、network handler、hook、service を登録できる
- ネイティブ Plugin のバグは gateway をクラッシュまたは不安定化できる
- 悪意あるネイティブ Plugin は、OpenClaw プロセス内での任意コード実行と同等である

互換 bundle は、OpenClaw が現在それらを
metadata/content pack として扱うため、デフォルトではより安全です。現行リリースでは、それは主に bundled
skills を意味します。

バンドルされていない Plugin には allowlist と明示的な install/load path を使ってください。Workspace Plugin は、本番デフォルトではなく開発時コードとして扱ってください。

バンドル済み workspace package 名については、Plugin id を npm
名に固定してください。デフォルトは `@openclaw/<id>`、または
`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` のような承認済み型付きサフィックスです。これはパッケージが意図的により狭い Plugin 役割を公開する場合に限ります。

重要な trust 注記:

- `plugins.allow` が信頼するのは **plugin id** であり、ソース provenance ではありません。
- バンドル済み Plugin と同じ id を持つ workspace Plugin は、その workspace Plugin が有効/allowlist 済みなら、意図的にバンドル版を shadow します。
- これはローカル開発、パッチテスト、hotfix において通常かつ有用です。
- バンドル済み Plugin の trust は、インストールメタデータではなくソーススナップショット — すなわちロード時点のディスク上の manifest と code — から解決されます。破損または差し替えられた install record では、実際のソースが主張する範囲を超えて、バンドル済み Plugin の trust surface を黙って広げることはできません。

## Export 境界

OpenClaw が export するのは implementation convenience ではなく capability です。

Capability 登録は公開のままにします。非契約 helper export は削減します。

- bundled-plugin 固有 helper subpath
- 公開 API を意図していない runtime plumbing subpath
- ベンダー固有 convenience helper
- implementation detail である setup/onboarding helper

一部の bundled-plugin helper subpath は、互換性と bundled-plugin 保守のために、生成された SDK export
map にまだ残っています。現在の例には
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, およびいくつかの `plugin-sdk/matrix*` seam が含まれます。これらは、新しいサードパーティ Plugin 向けの推奨 SDK パターンではなく、予約された implementation-detail export として扱ってください。

## 内部とリファレンス

ロードパイプライン、レジストリモデル、provider runtime hook、Gateway HTTP
route、message tool schema、channel target resolution、provider catalog、
context engine plugins、新しい capability の追加ガイドについては
[Plugin architecture internals](/ja-JP/plugins/architecture-internals) を参照してください。

## 関連

- [Building plugins](/ja-JP/plugins/building-plugins)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Plugin manifest](/ja-JP/plugins/manifest)
