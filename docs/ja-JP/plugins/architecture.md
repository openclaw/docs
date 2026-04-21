---
read_when:
    - ネイティブ OpenClaw Plugin の構築またはデバッグ
    - Plugin の capability モデルまたは所有境界の理解
    - Plugin のロードパイプラインまたは registry の作業
    - provider ランタイムフックまたはチャネル Plugin の実装
sidebarTitle: Internals
summary: 'Plugin の内部: capability モデル、所有権、コントラクト、ロードパイプライン、ランタイムヘルパー'
title: Plugin の内部
x-i18n:
    generated_at: "2026-04-21T13:37:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin の内部

<Info>
  これは**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、以下を参照してください:
  - [Install and use plugins](/ja-JP/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin チュートリアル
  - [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — メッセージングチャネルを構築する
  - [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — モデル provider を構築する
  - [SDK Overview](/ja-JP/plugins/sdk-overview) — import map と登録 API
</Info>

このページでは、OpenClaw Plugin システムの内部アーキテクチャを扱います。

## 公開 capability モデル

capability は、OpenClaw 内部における公開された**ネイティブ Plugin**モデルです。すべてのネイティブ OpenClaw Plugin は、1 つ以上の capability タイプに対して登録します。

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

capability を 1 つも登録せず、hooks、tools、または services を提供する Plugin は、**レガシーな hook-only** Plugin です。このパターンは現在も完全にサポートされています。

### 外部互換性に関する立場

capability モデルはすでに core に導入されており、現在は同梱/ネイティブ Plugin で使われていますが、外部 Plugin 互換性には依然として「export されているから凍結済み」という以上の、より厳密な基準が必要です。

現在の指針:

- **既存の外部 Plugin:** hook ベースの統合を動作し続けるよう維持する。これを互換性の基準線として扱う
- **新しい同梱/ネイティブ Plugin:** ベンダー固有の密結合や新しい hook-only 設計ではなく、明示的な capability 登録を優先する
- **capability 登録を採用する外部 Plugin:** 許可されるが、docs で明示的に stable なコントラクトとして示されていない限り、capability 固有の helper surface は進化中とみなす

実践ルール:

- capability 登録 API は意図された方向性です
- 移行期間中、外部 Plugin にとって最も破壊的変更の少ない安全な経路は引き続き legacy hooks です
- export された helper subpath はすべて同等ではありません。偶発的な helper export ではなく、狭く文書化されたコントラクトを優先してください

### Plugin の形状

OpenClaw は、各ロード済み Plugin を、静的 metadata ではなく実際の登録動作に基づいて形状分類します。

- **plain-capability** -- ちょうど 1 種類の capability タイプを登録する（例: `mistral` のような provider 専用 Plugin）
- **hybrid-capability** -- 複数の capability タイプを登録する（例: `openai` はテキスト推論、音声、メディア理解、画像生成を所有する）
- **hook-only** -- hooks（typed または custom）のみを登録し、capabilities、tools、commands、services は登録しない
- **non-capability** -- tools、commands、services、または routes を登録するが capabilities は登録しない

`openclaw plugins inspect <id>` を使うと、Plugin の形状と capability の内訳を確認できます。詳細は [CLI reference](/cli/plugins#inspect) を参照してください。

### Legacy hooks

`before_agent_start` hook は、hook-only Plugin のための互換性経路として引き続きサポートされています。実際のレガシー Plugin は今もこれに依存しています。

方向性:

- 動作を維持する
- レガシーとして文書化する
- モデル/provider の上書き作業には `before_model_resolve` を優先する
- プロンプト変更作業には `before_prompt_build` を優先する
- 実使用が減少し、fixture coverage により移行の安全性が証明されるまで削除しない

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、以下のいずれかのラベルが表示されることがあります。

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 設定は正常に解析され、plugins が解決される                   |
| **compatibility advisory** | Plugin がサポート対象だが古いパターン（例: `hook-only`）を使っている |
| **legacy warning**         | Plugin が非推奨の `before_agent_start` を使っている          |
| **hard error**             | 設定が無効、または Plugin のロードに失敗した                 |

`hook-only` も `before_agent_start` も、現時点では Plugin を壊しません -- `hook-only` は advisory であり、`before_agent_start` は警告を出すだけです。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムは 4 層で構成されています。

1. **Manifest + discovery**
   OpenClaw は、設定されたパス、workspace roots、グローバル extension roots、および同梱 extensions から候補 Plugin を見つけます。discovery は、ネイティブの `openclaw.plugin.json` manifest と、サポートされる bundle manifest を最初に読み取ります。
2. **Enablement + validation**
   core は、発見された Plugin が有効、無効、ブロック済み、または memory のような排他的スロットに選択されるべきかを判断します。
3. **Runtime loading**
   ネイティブ OpenClaw Plugin は jiti によりプロセス内でロードされ、中央 registry に capability を登録します。互換 bundle は、runtime code を import せずに registry records に正規化されます。
4. **Surface consumption**
   OpenClaw の残りの部分は registry を読み取り、tools、channels、provider setup、hooks、HTTP routes、CLI commands、services を公開します。

特に Plugin CLI については、root command discovery は 2 段階に分かれています。

- parse-time metadata は `registerCli(..., { descriptors: [...] })` から来る
- 実際の Plugin CLI module は lazy のままにでき、最初の呼び出し時に登録される

これにより、Plugin 所有の CLI code を Plugin 内に保持しつつ、OpenClaw は解析前に root command 名を予約できます。

重要な設計境界:

- discovery + config validation は、Plugin code を実行せず、**manifest/schema metadata** から動作すべきです
- ネイティブ runtime の動作は、Plugin module の `register(api)` パスから来ます

この分離により、OpenClaw は完全な runtime が有効になる前に、設定の検証、欠落/無効 Plugin の説明、UI/schema ヒントの構築を行えます。

### チャネル Plugin と共有 message ツール

チャネル Plugin は、通常のチャット操作のために別個の send/edit/react ツールを登録する必要はありません。OpenClaw は core に 1 つの共有 `message` ツールを保持し、チャネル Plugin はその背後にあるチャネル固有の discovery と execution を所有します。

現在の境界は次のとおりです。

- core は、共有 `message` ツールホスト、プロンプト配線、session/thread の bookkeeping、execution dispatch を所有する
- チャネル Plugin は、scoped action discovery、capability discovery、およびチャネル固有の schema fragments を所有する
- チャネル Plugin は、conversation id が thread id をどのように符号化するか、あるいは親 conversation からどのように継承するかといった、provider 固有の session conversation grammar を所有する
- チャネル Plugin は、action adapter を通じて最終 action を実行する

チャネル Plugin の SDK surface は `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一 discovery 呼び出しにより、Plugin は可視 action、capabilities、schema への追加をまとめて返せるため、それらの要素が互いにずれにくくなります。

チャネル固有の message-tool param がローカルパスやリモート media URL のような media source を運ぶ場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返すべきです。core はこの明示的な一覧を使って、Plugin 所有の param 名をハードコードせずに sandbox のパス正規化と outbound media-access のヒントを適用します。
ここではチャネル全体のフラットな一覧ではなく、action 単位の map を優先してください。そうしないと、profile 専用の media param が `send` のような無関係な action でも正規化されてしまいます。

core はその discovery ステップに runtime scope を渡します。重要なフィールドには以下があります。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済みの受信 `requesterSenderId`

これはコンテキスト依存の Plugin にとって重要です。チャネルは、active account、現在の room/thread/message、または信頼済み requester identity に応じて message actions を隠したり公開したりできます。しかも、core の `message` ツールにチャネル固有の分岐をハードコードする必要はありません。

これが、embedded-runner のルーティング変更が依然として Plugin 作業である理由です。runner は、共有 `message` ツールが現在のターンに適したチャネル所有 surface を公開できるよう、現在の chat/session identity を Plugin discovery 境界へ転送する責任を持ちます。

チャネル所有の execution helpers については、同梱 Plugin は execution runtime を自身の extension modules 内に保持するべきです。core はもはや `src/agents/tools` 以下で Discord、Slack、Telegram、WhatsApp の message-action runtime を所有しません。
私たちは `plugin-sdk/*-action-runtime` の個別 subpath を公開しておらず、同梱 Plugin は自身の extension 所有 module からローカル runtime code を直接 import するべきです。

同じ境界は、一般に provider 名付き SDK seams にも適用されます。core は Slack、Discord、Signal、WhatsApp、または類似 extension 向けのチャネル固有 convenience barrel を import するべきではありません。core が何らかの動作を必要とする場合は、同梱 Plugin 自身の `api.ts` / `runtime-api.ts` barrel を消費するか、その必要性を共有 SDK 内の狭い汎用 capability へ昇格させてください。

poll については、特に 2 つの execution path があります。

- `outbound.sendPoll` は、共通の poll モデルに適合するチャネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャネル固有の poll セマンティクスや追加の poll パラメータがある場合の推奨パスです

現在 core は、Plugin 側の poll dispatch がその action を辞退した後にのみ共有 poll 解析へ委譲します。これにより、Plugin 所有の poll handler は、汎用 poll parser に先に遮られることなく、チャネル固有の poll フィールドを受け入れられます。

完全な起動シーケンスについては、[Load pipeline](#load-pipeline) を参照してください。

## capability 所有モデル

OpenClaw は、ネイティブ Plugin を、無関係な統合の寄せ集めではなく、**会社**または**機能**の所有境界として扱います。

これは次を意味します。

- 会社 Plugin は通常、その会社の OpenClaw 向け surface をすべて所有するべきです
- 機能 Plugin は通常、それが導入する機能 surface 全体を所有するべきです
- チャネルは、provider の動作を場当たり的に再実装するのではなく、共有 core capability を消費するべきです

例:

- 同梱の `openai` Plugin は、OpenAI の model-provider の動作と、OpenAI の音声 + リアルタイム音声 + メディア理解 + 画像生成の動作を所有します
- 同梱の `elevenlabs` Plugin は、ElevenLabs の音声動作を所有します
- 同梱の `microsoft` Plugin は、Microsoft の音声動作を所有します
- 同梱の `google` Plugin は、Google の model-provider の動作に加えて、Google のメディア理解 + 画像生成 + Web 検索の動作を所有します
- 同梱の `firecrawl` Plugin は、Firecrawl の Web 取得動作を所有します
- 同梱の `minimax`、`mistral`、`moonshot`、`zai` Plugin は、それぞれのメディア理解バックエンドを所有します
- 同梱の `qwen` Plugin は、Qwen の text-provider の動作に加えて、メディア理解と動画生成の動作を所有します
- `voice-call` Plugin は機能 Plugin です。これは通話トランスポート、tools、CLI、routes、Twilio media-stream bridging を所有しますが、ベンダー Plugin を直接 import するのではなく、共有の音声 capability とリアルタイム文字起こし、リアルタイム音声 capability を消費します

意図されている最終状態は次のとおりです。

- OpenAI は、テキストモデル、音声、画像、将来の動画にまたがっていても 1 つの Plugin に存在する
- 他のベンダーも、自身の surface area について同じことができる
- チャネルは、どのベンダー Plugin が provider を所有しているかを気にせず、core が公開する共有 capability コントラクトを消費する

これが重要な区別です。

- **Plugin** = 所有境界
- **capability** = 複数の Plugin が実装または消費できる core コントラクト

したがって、OpenClaw が動画のような新しいドメインを追加する場合、最初の問いは「どの provider が動画処理をハードコードすべきか？」ではありません。最初の問いは「core の動画 capability コントラクトは何か？」です。そのコントラクトが存在すれば、ベンダー Plugin はそれに対して登録でき、チャネル/機能 Plugin はそれを消費できます。

capability がまだ存在しない場合、通常の正しい手順は次のとおりです。

1. core で不足している capability を定義する
2. それを型付きで Plugin API/runtime を通して公開する
3. チャネル/機能をその capability に対して配線する
4. ベンダー Plugin に実装を登録させる

これにより、所有権を明示したまま、単一ベンダーや一回限りの Plugin 固有コードパスに依存する core の動作を避けられます。

### capability のレイヤリング

コードの所属先を決めるときは、次のメンタルモデルを使ってください。

- **core capability layer**: 共有オーケストレーション、ポリシー、フォールバック、設定マージ規則、配信セマンティクス、型付きコントラクト
- **vendor Plugin layer**: ベンダー固有 API、認証、モデルカタログ、音声合成、画像生成、将来の動画バックエンド、利用量エンドポイント
- **channel/feature Plugin layer**: Slack/Discord/voice-call などの統合。core capability を消費して surface に提示する

たとえば TTS は次の形になります。

- core は、返信時の TTS ポリシー、フォールバック順、設定、チャネル配信を所有する
- `openai`、`elevenlabs`、`microsoft` は、音声合成の実装を所有する
- `voice-call` は、telephony TTS runtime helper を消費する

将来の capability でも、同じパターンを優先すべきです。

### 複数 capability を持つ会社 Plugin の例

会社 Plugin は、外から見て一貫性があるべきです。OpenClaw にモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索の共有コントラクトがあるなら、ベンダーは自分のすべての surface を 1 か所で所有できます。

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

重要なのは、正確な helper 名ではありません。形が重要です。

- 1 つの Plugin がベンダー surface を所有する
- それでも core は capability コントラクトを所有する
- チャネルと機能 Plugin は、ベンダー code ではなく `api.runtime.*` helper を消費する
- コントラクトテストは、その Plugin が自分で所有すると主張する capability を登録したことを検証できる

### capability の例: 動画理解

OpenClaw はすでに、画像/音声/動画理解を 1 つの共有 capability として扱っています。そこでも同じ所有モデルが適用されます。

1. core が media-understanding コントラクトを定義する
2. ベンダー Plugin が必要に応じて `describeImage`、`transcribeAudio`、`describeVideo` を登録する
3. チャネルと機能 Plugin は、ベンダー code に直接配線するのではなく、共有 core 動作を消費する

これにより、ある provider の動画前提を core に焼き付けることを避けられます。Plugin がベンダー surface を所有し、core が capability コントラクトとフォールバック動作を所有します。

動画生成も、すでに同じ順序を使っています。core が型付き capability コントラクトと runtime helper を所有し、ベンダー Plugin は `api.registerVideoGenerationProvider(...)` 実装をそれに対して登録します。

具体的なロールアウト用チェックリストが必要ですか? [Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## コントラクトと enforcement

Plugin API surface は、意図的に型付きであり、`OpenClawPluginApi` に集約されています。このコントラクトは、サポートされる登録ポイントと、Plugin が依存してよい runtime helper を定義します。

これが重要な理由:

- Plugin 作者は、安定した 1 つの内部標準を得られる
- core は、2 つの Plugin が同じ provider id を登録するような所有重複を拒否できる
- 起動時に、不正な登録に対して実行可能な diagnostics を出せる
- コントラクトテストにより、同梱 Plugin の所有権を強制し、静かな drift を防げる

enforcement には 2 層あります。

1. **runtime registration enforcement**
   Plugin registry は、Plugin のロード時に登録を検証します。例: 重複した provider id、重複した音声 provider id、不正な登録は、未定義動作ではなく Plugin diagnostics を生成します。
2. **contract tests**
   同梱 Plugin はテスト実行中に contract registries へ取り込まれるため、OpenClaw は所有権を明示的に検証できます。現在は、モデル provider、音声 provider、Web 検索 provider、および同梱登録の所有権に使われています。

実際の効果として、OpenClaw は、どの Plugin がどの surface を所有しているかを前もって把握しています。これにより、所有権が暗黙ではなく宣言され、型付けされ、テスト可能になるため、core とチャネルはシームレスに構成できます。

### コントラクトに含めるべきもの

良い Plugin コントラクトは、次の性質を持ちます。

- 型付き
- 小さい
- capability 固有
- core が所有する
- 複数の Plugin で再利用できる
- ベンダー知識なしでチャネル/機能が消費できる

悪い Plugin コントラクトは、次のようなものです。

- core に隠されたベンダー固有ポリシー
- registry を迂回する、一回限りの Plugin 用 escape hatch
- ベンダー実装へ直接 reach するチャネル code
- `OpenClawPluginApi` や `api.runtime` の一部でないアドホックな runtime object

迷ったら、抽象化レベルを上げてください。まず capability を定義し、その後で Plugin を接続させます。

## 実行モデル

ネイティブ OpenClaw Plugin は、Gateway と**同一プロセス内**で実行されます。sandbox 化はされません。ロードされたネイティブ Plugin は、core code と同じプロセスレベルの trust boundary を持ちます。

含意:

- ネイティブ Plugin は、tools、network handlers、hooks、services を登録できる
- ネイティブ Plugin のバグは gateway をクラッシュまたは不安定化させうる
- 悪意あるネイティブ Plugin は、OpenClaw プロセス内での任意 code 実行と等価である

互換 bundle は、OpenClaw が現在それらを metadata/content pack として扱うため、デフォルトではより安全です。現行リリースでは、これは主に同梱 skills を意味します。

非同梱 Plugin には allowlist と明示的な install/load path を使ってください。workspace Plugin は本番デフォルトではなく、開発時 code として扱ってください。

同梱 workspace package 名については、Plugin id を npm 名に固定してください。デフォルトでは `@openclaw/<id>`、または Plugin の役割を意図的に狭く公開する場合は `-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` のような承認済み型付き suffix を使います。

重要な trust に関する注意:

- `plugins.allow` が信頼するのは**Plugin id**であり、ソースの来歴ではありません。
- 同梱 Plugin と同じ id を持つ workspace Plugin は、その workspace Plugin が有効化/allowlist されると、意図的に同梱コピーを shadow します。
- これは通常の動作であり、ローカル開発、パッチテスト、hotfix に有用です。

## export 境界

OpenClaw が export するのは capability であり、実装上の convenience ではありません。

capability 登録は公開のままにし、コントラクトではない helper export は削減してください。

- 同梱 Plugin 固有の helper subpath
- 公開 API として意図していない runtime plumbing subpath
- ベンダー固有の convenience helpers
- 実装詳細である setup/onboarding helpers

一部の同梱 Plugin helper subpath は、互換性と同梱 Plugin 保守のため、生成された SDK export map にまだ残っています。現在の例には `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seams が含まれます。これらは、新しいサードパーティ Plugin 向けに推奨される SDK パターンではなく、予約された実装詳細 export として扱ってください。

## ロードパイプライン

起動時、OpenClaw はおおよそ次を行います。

1. 候補 Plugin root を discovery する
2. ネイティブまたは互換 bundle の manifest と package metadata を読み取る
3. 安全でない候補を拒否する
4. Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）を正規化する
5. 各候補の有効化可否を決定する
6. 有効なネイティブ module を jiti 経由でロードする
7. ネイティブの `register(api)`（またはレガシー別名の `activate(api)`）hook を呼び出し、登録内容を Plugin registry に収集する
8. registry を commands/runtime surface に公開する

<Note>
`activate` は `register` のレガシー別名です。ローダーは存在する方（`def.register ?? def.activate`）を解決して同じタイミングで呼び出します。同梱 Plugin はすべて `register` を使っています。新しい Plugin では `register` を使ってください。
</Note>

安全性ゲートは、runtime 実行**前**に行われます。entry が Plugin root の外へ逃げる場合、パスが world-writable な場合、または非同梱 Plugin についてパス所有権が疑わしい場合、候補はブロックされます。

### Manifest-first の挙動

manifest は control plane の source of truth です。OpenClaw はこれを使って次を行います。

- Plugin を識別する
- 宣言された channels/skills/config schema または bundle capabilities を discovery する
- `plugins.entries.<id>.config` を検証する
- Control UI の labels/placeholders を拡張する
- install/catalog metadata を表示する
- cheap activation と setup descriptor を、Plugin runtime をロードせずに保持する

ネイティブ Plugin では、runtime module が data plane 部分です。これは hooks、tools、commands、provider flows などの実際の動作を登録します。

任意の manifest の `activation` および `setup` ブロックは control plane に留まります。これらは activation planning と setup discovery のための metadata-only descriptor であり、runtime registration、`register(...)`、`setupEntry` を置き換えるものではありません。
現在、最初の live activation consumer は、manifest の command、channel、provider のヒントを使って、より広い registry の materialization の前に Plugin のロード対象を絞り込みます。

- CLI ロードは、要求された primary command を所有する Plugin に絞り込まれる
- channel setup/Plugin 解決は、要求された channel id を所有する Plugin に絞り込まれる
- 明示的な provider setup/runtime 解決は、要求された provider id を所有する Plugin に絞り込まれる

setup discovery は、`setup-api` にフォールバックして setup 時 runtime hooks がまだ必要な Plugin を扱う前に、まず `setup.providers` や `setup.cliBackends` のような descriptor 所有 id を優先して候補 Plugin を絞り込みます。discovery された複数の Plugin が同じ正規化済み setup provider または CLI backend id を主張する場合、setup lookup は discovery 順に依存せず、その曖昧な所有者を拒否します。

### ローダーがキャッシュするもの

OpenClaw は、以下に対して短命なプロセス内キャッシュを保持します。

- discovery 結果
- manifest registry データ
- ロード済み Plugin registries

これらのキャッシュは、突発的な起動負荷と繰り返しコマンドのオーバーヘッドを減らします。これらは永続化ではなく、短命なパフォーマンスキャッシュと考えるのが適切です。

パフォーマンスに関する注意:

- これらのキャッシュを無効にするには、`OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定します。
- キャッシュ時間は `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## registry モデル

ロード済み Plugin は、ランダムな core のグローバルを直接変更しません。中央の Plugin registry に登録します。

registry が追跡するもの:

- Plugin records（ID、ソース、起点、状態、diagnostics）
- tools
- legacy hooks と typed hooks
- channels
- providers
- Gateway RPC handlers
- HTTP routes
- CLI registrars
- バックグラウンド services
- Plugin 所有 commands

その後、core 機能は Plugin module と直接やり取りする代わりに、この registry から読み取ります。これによりロードは一方向に保たれます。

- Plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性において重要です。つまり、ほとんどの core surface は「各 Plugin module を特別扱いする」必要はなく、「registry を読む」という 1 つの統合ポイントだけで済みます。

## conversation binding コールバック

conversation を bind する Plugin は、承認の解決時に反応できます。

bind リクエストが承認または拒否された後にコールバックを受け取るには、`api.onConversationBindingResolved(...)` を使います。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバックのペイロードフィールド:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認されたリクエストに対して解決された binding
- `request`: 元のリクエスト要約、detach ヒント、sender id、conversation metadata

このコールバックは通知専用です。conversation を bind できる主体を変更するものではなく、core の承認処理が完了した後に実行されます。

## provider ランタイムフック

provider Plugin には現在 2 つの層があります。

- manifest metadata: runtime ロード前に軽量な provider 環境認証 lookup を行うための `providerAuthEnvVars`、認証を共有する provider バリアント向けの `providerAuthAliases`、runtime ロード前に軽量な channel 環境/setup lookup を行うための `channelEnvVars`、さらに runtime ロード前に軽量なオンボーディング/認証選択ラベルと CLI フラグ metadata を扱うための `providerAuthChoices`
- config 時 hooks: `catalog` / レガシーの `discovery` と `applyConfigDefaults`
- runtime hooks: `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`resolveExternalAuthProfiles`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`resolveThinkingProfile`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、`buildReplayPolicy`、`sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClaw は引き続き、汎用 agent loop、failover、transcript 処理、tool policy を所有します。これらの hooks は、推論トランスポート全体を custom にしなくても、provider 固有の動作を拡張できる surface です。

provider が env ベースの認証情報を持ち、汎用の auth/status/model-picker パスが Plugin runtime をロードせずにそれを認識すべき場合は、manifest の `providerAuthEnvVars` を使ってください。ある provider id が別の provider id の env vars、auth profiles、config ベース auth、API キーのオンボーディング選択を再利用すべき場合は、manifest の `providerAuthAliases` を使ってください。オンボーディング/認証選択 CLI surface が、provider runtime をロードせずに provider の choice id、group labels、単純な 1 フラグ auth 配線を知る必要がある場合は、manifest の `providerAuthChoices` を使ってください。provider runtime の `envVars` は、オンボーディングラベルや OAuth client-id/client-secret の設定変数のような operator 向けヒントとして保持してください。

channel が env 駆動の auth または setup を持ち、汎用 shell-env フォールバック、config/status チェック、または setup prompts が channel runtime をロードせずにそれを認識すべき場合は、manifest の `channelEnvVars` を使ってください。

### hook 順序と使い方

モデル/provider Plugin について、OpenClaw はおおよそ次の順序で hooks を呼び出します。
「When to use」列は、簡易的な判断ガイドです。

| #   | Hook                              | 役割                                                                                                           | 使うべき場面                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時に provider 設定を `models.providers` に公開する                                           | provider がカタログまたは base URL デフォルトを所有している                                                                                |
| 2   | `applyConfigDefaults`             | 設定の具体化時に provider 所有のグローバル設定デフォルトを適用する                                            | デフォルトが auth モード、環境、または provider のモデルファミリーのセマンティクスに依存する                                                |
| --  | _(built-in model lookup)_         | OpenClaw はまず通常の registry/catalog パスを試す                                                             | _(Plugin hook ではない)_                                                                                                                    |
| 3   | `normalizeModelId`                | lookup 前にレガシーまたは preview の model-id alias を正規化する                                              | provider が、正規のモデル解決前に alias の整理を所有している                                                                                |
| 4   | `normalizeTransport`              | 汎用モデル組み立て前に provider ファミリーの `api` / `baseUrl` を正規化する                                    | provider が、同じトランスポートファミリー内の custom provider id に対するトランスポート整理を所有している                                  |
| 5   | `normalizeConfig`                 | runtime/provider 解決前に `models.providers.<id>` を正規化する                                                | provider が、Plugin とともに保持すべき設定整理を必要とする。なお、同梱の Google ファミリーヘルパーは、サポートされる Google 設定エントリの後方互換も担う |
| 6   | `applyNativeStreamingUsageCompat` | 設定 provider にネイティブ streaming-usage 互換の書き換えを適用する                                           | provider が、エンドポイント駆動のネイティブ streaming usage metadata 修正を必要とする                                                     |
| 7   | `resolveConfigApiKey`             | runtime auth ロード前に、設定 provider 用の env-marker 認証を解決する                                         | provider が provider 所有の env-marker API キー解決を持つ。`amazon-bedrock` もここで組み込みの AWS env-marker resolver を持つ             |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに local/self-hosted または config ベースの認証を表面化する                                   | provider が synthetic/local credential marker で動作できる                                                                                  |
| 9   | `resolveExternalAuthProfiles`     | provider 所有の外部 auth profile を重ねる。CLI/app 所有認証情報のデフォルト `persistence` は `runtime-only` | provider が、コピーした refresh token を永続化せずに外部 auth 認証情報を再利用する                                                         |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済み synthetic profile placeholder の優先順位を env/config ベース auth より下げる                         | provider が、優先されるべきでない synthetic placeholder profile を保存する                                                                  |
| 11  | `resolveDynamicModel`             | ローカル registry にまだない provider 所有 model id に対する同期フォールバック                                | provider が任意の上流 model id を受け入れる                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` を再実行する                                          | provider が未知 id の解決前にネットワーク metadata を必要とする                                                                             |
| 13  | `normalizeResolvedModel`          | embedded runner が解決済みモデルを使う前の最終書き換え                                                        | provider がトランスポート書き換えを必要とするが、依然として core トランスポートを使う                                                      |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデルに compat フラグを追加する                                    | provider が、provider 自体を引き継がずに、proxy トランスポート上で自分のモデルを認識する                                                   |
| 15  | `capabilities`                    | 共有 core ロジックで使われる provider 所有の transcript/tooling metadata                                      | provider が transcript/provider ファミリー固有の癖を必要とする                                                                              |
| 16  | `normalizeToolSchemas`            | embedded runner が参照する前に tool schema を正規化する                                                       | provider がトランスポートファミリーの schema 整理を必要とする                                                                               |
| 17  | `inspectToolSchemas`              | 正規化後に provider 所有の schema diagnostics を表面化する                                                    | provider が、core に provider 固有ルールを教え込まずにキーワード警告を出したい                                                              |
| 18  | `resolveReasoningOutputMode`      | ネイティブとタグ付きの reasoning-output コントラクトを選択する                                                | provider がネイティブフィールドではなく、タグ付き reasoning/final output を必要とする                                                       |
| 19  | `prepareExtraParams`              | 汎用 stream オプションラッパー前に request param を正規化する                                                 | provider がデフォルト request params または provider ごとの param 整理を必要とする                                                         |
| 20  | `createStreamFn`                  | 通常の stream パス全体を custom トランスポートで置き換える                                                    | provider がラッパーではなく custom wire protocol を必要とする                                                                               |
| 21  | `wrapStreamFn`                    | 汎用ラッパー適用後に stream をラップする                                                                      | provider が custom トランスポートなしで request headers/body/model compat ラッパーを必要とする                                              |
| 22  | `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたは metadata を付与する                                      | provider が、汎用トランスポートに provider ネイティブのターン ID を送らせたい                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたは session クールダウンポリシーを付与する                                    | provider が、汎用 WS トランスポートで session headers またはフォールバックポリシーを調整したい                                              |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存済み profile を runtime の `apiKey` 文字列に変換する                              | provider が追加の auth metadata を保存し、custom な runtime token 形式を必要とする                                                         |
| 25  | `refreshOAuth`                    | custom refresh endpoint または refresh 失敗ポリシー向けの OAuth refresh override                              | provider が共有 `pi-ai` refresher に適合しない                                                                                              |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 失敗時に付加される修復ヒント                                                                    | provider が refresh 失敗後の provider 所有 auth 修復ガイダンスを必要とする                                                                  |
| 27  | `matchesContextOverflowError`     | provider 所有のコンテキストウィンドウ超過マッチャー                                                           | provider が、汎用ヒューリスティクスでは見逃す生の overflow エラーを持つ                                                                      |
| 28  | `classifyFailoverReason`          | provider 所有の failover 理由分類                                                                             | provider が、生の API/トランスポートエラーを rate-limit/overload などにマッピングできる                                                     |
| 29  | `isCacheTtlEligible`              | proxy/backhaul provider 向けの prompt-cache ポリシー                                                          | provider が proxy 固有の cache TTL gating を必要とする                                                                                       |
| 30  | `buildMissingAuthMessage`         | 汎用の missing-auth 回復メッセージの置き換え                                                                  | provider が provider 固有の missing-auth 回復ヒントを必要とする                                                                             |
| 31  | `suppressBuiltInModel`            | 古い上流モデルの抑制と、任意のユーザー向けエラーヒント                                                        | provider が古い上流行を隠す、またはベンダーヒントに置き換える必要がある                                                                     |
| 32  | `augmentModelCatalog`             | discovery 後に synthetic/final なカタログ行を追加する                                                         | provider が `models list` や picker に forward-compat 用の synthetic 行を必要とする                                                         |
| 33  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                    | provider が、選択モデル向けに custom な thinking ラダーまたは二値ラベルを公開する                                                           |
| 34  | `isBinaryThinking`                | オン/オフの reasoning toggle 互換 hook                                                                        | provider が二値の thinking オン/オフしか公開しない                                                                                          |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning サポート互換 hook                                                                           | provider が一部モデルでのみ `xhigh` を提供したい                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換 hook                                                                           | provider がモデルファミリー向けのデフォルト `/think` ポリシーを所有する                                                                      |
| 37  | `isModernModelRef`                | live profile filters と smoke selection のための modern-model matcher                                         | provider が live/smoke の優先モデルマッチングを所有する                                                                                      |
| 38  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際の runtime token/key に交換する                                              | provider がトークン交換または短命なリクエスト認証情報を必要とする                                                                          |
| 39  | `resolveUsageAuth`                | `/usage` および関連 status surface 向けの利用量/課金認証情報を解決する                                        | provider が custom な利用量/クォータ token 解析、または別の利用量認証情報を必要とする                                                      |
| 40  | `fetchUsageSnapshot`              | 認証解決後に、provider 固有の利用量/クォータ snapshot を取得して正規化する                                     | provider が provider 固有の利用量エンドポイントまたはペイロード parser を必要とする                                                        |
| 41  | `createEmbeddingProvider`         | memory/search 向けの provider 所有 embedding adapter を構築する                                               | memory の embedding 動作は provider Plugin とともにあるべき                                                                                 |
| 42  | `buildReplayPolicy`               | provider の transcript 処理を制御する replay policy を返す                                                     | provider が custom な transcript policy（例: thinking-block の除去）を必要とする                                                            |
| 43  | `sanitizeReplayHistory`           | 汎用 transcript クリーンアップ後に replay history を書き換える                                                 | provider が共有 Compaction helper を超える provider 固有の replay 書き換えを必要とする                                                     |
| 44  | `validateReplayTurns`             | embedded runner の前に replay turn の最終検証または整形を行う                                                 | provider トランスポートが、汎用 sanitization 後により厳格な turn 検証を必要とする                                                          |
| 45  | `onModelSelected`                 | モデルがアクティブになったときに provider 所有の選択後副作用を実行する                                        | provider が、モデル有効化時に telemetry または provider 所有状態を必要とする                                                               |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致した provider Plugin を確認し、その後、実際に model id や transport/config を変更するものが見つかるまで、hook 対応の他の provider Plugin へ順にフォールスルーします。これにより、caller がどの同梱 Plugin がその書き換えを所有しているかを知らなくても、alias/compat provider shim を動作させられます。どの provider hook もサポート対象の Google ファミリー設定エントリを書き換えなかった場合でも、同梱の Google 設定 normalizer は引き続きその互換性クリーンアップを適用します。

provider が完全に custom な wire protocol や custom な request executor を必要とする場合、それは別種の拡張です。これらの hooks は、OpenClaw の通常の推論 loop 上で引き続き動作する provider の振る舞い向けです。

### provider の例

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

- Anthropic は、`resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、`resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、`resolveThinkingProfile`、`applyConfigDefaults`、`isModernModelRef`、`wrapStreamFn` を使います。これは、Claude 4.6 の forward-compat、provider ファミリーのヒント、auth 修復ガイダンス、usage endpoint 統合、prompt-cache 適格性、auth を考慮した設定デフォルト、Claude のデフォルト/適応 thinking ポリシー、そして beta headers、`/fast` / `serviceTier`、`context1m` 向けの Anthropic 固有 stream shaping を所有しているためです。
- Anthropic の Claude 固有 stream helper は、今のところ同梱 Plugin 自身の公開 `api.ts` / `contract-api.ts` seam に残っています。その package surface は、ある provider の beta-header ルールのために汎用 SDK を広げる代わりに、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、およびより低レベルな Anthropic wrapper builder を export します。
- OpenAI は、`resolveDynamicModel`、`normalizeResolvedModel`、`capabilities`、さらに `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`resolveThinkingProfile`、`isModernModelRef` を使います。これは、GPT-5.4 の forward-compat、直接 OpenAI の `openai-completions` -> `openai-responses` 正規化、Codex を認識した auth ヒント、Spark 抑制、synthetic な OpenAI list 行、GPT-5 の thinking / live-model ポリシーを所有しているためです。`openai-responses-defaults` stream ファミリーは、attribution headers、`/fast`/`serviceTier`、text verbosity、ネイティブ Codex Web 検索、reasoning-compat ペイロード整形、Responses のコンテキスト管理向けの共有ネイティブ OpenAI Responses ラッパーを所有します。
- OpenRouter は、provider がパススルーであり、OpenClaw の静的 catalog 更新前に新しい model id を公開することがあるため、`catalog`、`resolveDynamicModel`、`prepareDynamicModel` を使います。また、provider 固有の request headers、routing metadata、reasoning patch、prompt-cache ポリシーを core の外に保つために、`capabilities`、`wrapStreamFn`、`isCacheTtlEligible` も使います。その replay policy は `passthrough-gemini` ファミリーから来ており、`openrouter-thinking` stream ファミリーは proxy reasoning injection と未サポートモデル / `auto` のスキップを所有します。
- GitHub Copilot は、provider 所有のデバイスログイン、モデルフォールバック動作、Claude transcript の癖、GitHub token -> Copilot token 交換、provider 所有 usage endpoint を必要とするため、`catalog`、`auth`、`resolveDynamicModel`、`capabilities`、さらに `prepareRuntimeAuth` と `fetchUsageSnapshot` を使います。
- OpenAI Codex は、依然として core の OpenAI transports 上で動作しますが、自身の transport/base URL 正規化、OAuth refresh フォールバックポリシー、デフォルト transport 選択、synthetic Codex catalog 行、ChatGPT usage endpoint 統合を所有するため、`catalog`、`resolveDynamicModel`、`normalizeResolvedModel`、`refreshOAuth`、`augmentModelCatalog`、さらに `prepareExtraParams`、`resolveUsageAuth`、`fetchUsageSnapshot` を使います。direct OpenAI と同じ `openai-responses-defaults` stream ファミリーを共有します。
- Google AI Studio と Gemini CLI OAuth は、`google-gemini` replay ファミリーが Gemini 3.1 の forward-compat フォールバック、ネイティブ Gemini replay 検証、bootstrap replay sanitation、タグ付き reasoning-output モード、modern-model マッチングを所有し、`google-thinking` stream ファミリーが Gemini thinking ペイロード正規化を所有するため、`resolveDynamicModel`、`buildReplayPolicy`、`sanitizeReplayHistory`、`resolveReasoningOutputMode`、`wrapStreamFn`、`isModernModelRef` を使います。Gemini CLI OAuth はさらに、トークン整形、トークン解析、クォータ endpoint 配線のために `formatApiKey`、`resolveUsageAuth`、`fetchUsageSnapshot` も使います。
- Anthropic Vertex は、Claude 固有 replay クリーンアップがすべての `anthropic-messages` transport ではなく Claude id に限定されるよう、`anthropic-by-model` replay ファミリーを通して `buildReplayPolicy` を使います。
- Amazon Bedrock は、Anthropic-on-Bedrock トラフィック向けの Bedrock 固有 throttle/not-ready/context-overflow エラー分類を所有するため、`buildReplayPolicy`、`matchesContextOverflowError`、`classifyFailoverReason`、`resolveThinkingProfile` を使います。その replay policy は同じ Claude 専用の `anthropic-by-model` ガードを共有します。
- OpenRouter、Kilocode、Opencode、Opencode Go は、OpenAI 互換 transport を通して Gemini モデルを proxy し、ネイティブ Gemini replay 検証や bootstrap 書き換えなしで Gemini thought-signature sanitation を必要とするため、`passthrough-gemini` replay ファミリーを通して `buildReplayPolicy` を使います。
- MiniMax は、1 つの provider が Anthropic-message と OpenAI 互換の両セマンティクスを所有するため、`hybrid-anthropic-openai` replay ファミリーを通して `buildReplayPolicy` を使います。Anthropic 側では Claude 専用の thinking-block 除去を維持しつつ、reasoning output モードをネイティブへ戻します。また、`minimax-fast-mode` stream ファミリーは共有 stream パス上の fast-mode モデル書き換えを所有します。
- Moonshot は、共有 OpenAI transport を引き続き使いながら provider 所有の thinking ペイロード正規化が必要なため、`catalog`、`resolveThinkingProfile`、`wrapStreamFn` を使います。`moonshot-thinking` stream ファミリーは、設定と `/think` 状態をネイティブな二値 thinking ペイロードへマッピングします。
- Kilocode は、provider 所有 request headers、reasoning ペイロード正規化、Gemini transcript ヒント、Anthropic cache-TTL gating を必要とするため、`catalog`、`capabilities`、`wrapStreamFn`、`isCacheTtlEligible` を使います。`kilocode-thinking` stream ファミリーは、共有 proxy stream パス上で Kilo thinking injection を維持しつつ、明示的な reasoning ペイロードをサポートしない `kilo/auto` やその他の proxy model id をスキップします。
- Z.AI は、GLM-5 フォールバック、`tool_stream` デフォルト、二値 thinking UX、modern-model マッチング、usage auth と quota 取得の両方を所有するため、`resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、`isCacheTtlEligible`、`resolveThinkingProfile`、`isModernModelRef`、`resolveUsageAuth`、`fetchUsageSnapshot` を使います。`tool-stream-default-on` stream ファミリーは、デフォルト有効の `tool_stream` ラッパーを provider ごとの手書き glue から切り離します。
- xAI は、ネイティブ xAI Responses transport 正規化、Grok fast-mode alias 書き換え、デフォルト `tool_stream`、strict-tool / reasoning-payload 整理、Plugin 所有ツール向けフォールバック auth 再利用、forward-compat な Grok モデル解決、xAI tool-schema profile、未サポート schema キーワード、ネイティブ `web_search`、HTML entity の tool-call 引数デコードのような provider 所有 compat patch を所有するため、`normalizeResolvedModel`、`normalizeTransport`、`contributeResolvedModelCompat`、`prepareExtraParams`、`wrapStreamFn`、`resolveSyntheticAuth`、`resolveDynamicModel`、`isModernModelRef` を使います。
- Mistral、OpenCode Zen、OpenCode Go は、transcript/tooling の癖を core の外に保つために `capabilities` のみを使います。
- `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` のような catalog-only の同梱 provider は、`catalog` のみを使います。
- Qwen は、テキスト provider 向けの `catalog` と、multimodal surface 向けの共有 media-understanding および video-generation 登録を使います。
- MiniMax と Xiaomi は、推論自体は共有 transport を通して動作する一方で、`/usage` の動作が Plugin 所有であるため、`catalog` と usage hooks を使います。

## ランタイムヘルパー

Plugin は、`api.runtime` を通して選択された core helper にアクセスできます。TTS の場合:

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

- `textToSpeech` は、file/voice-note surface 向けの通常の core TTS 出力ペイロードを返します。
- core の `messages.tts` 設定と provider 選択を使います。
- PCM 音声バッファ + サンプルレートを返します。Plugin 側で provider 向けに再サンプリング/エンコードする必要があります。
- `listVoices` は provider ごとに任意です。ベンダー所有の voice picker や setup flow で使ってください。
- voice 一覧には、provider を認識する picker 向けに locale、gender、personality tags のようなより豊富な metadata を含められます。
- 現在 telephony をサポートするのは OpenAI と ElevenLabs です。Microsoft はサポートしません。

Plugin は `api.registerSpeechProvider(...)` を通して音声 provider を登録することもできます。

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

- TTS ポリシー、フォールバック、返信配信は core に維持してください。
- ベンダー所有の音声合成動作には音声 provider を使ってください。
- レガシーな Microsoft の `edge` 入力は `microsoft` provider id に正規化されます。
- 推奨される所有モデルは会社指向です。OpenClaw がこれらの capability コントラクトを追加していくにつれ、1 つのベンダー Plugin がテキスト、音声、画像、将来のメディア provider を所有できます。

画像/音声/動画理解については、Plugin は汎用 key/value bag ではなく、1 つの型付き media-understanding provider を登録します。

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

- オーケストレーション、フォールバック、設定、チャネル配線は core に維持してください。
- ベンダーの振る舞いは provider Plugin に維持してください。
- 加算的な拡張は型付きのままにしてください: 新しい任意メソッド、新しい任意 result fields、新しい任意 capabilities。
- 動画生成もすでに同じパターンに従っています:
  - core が capability コントラクトと runtime helper を所有する
  - ベンダー Plugin が `api.registerVideoGenerationProvider(...)` を登録する
  - 機能/チャネル Plugin が `api.runtime.videoGeneration.*` を消費する

media-understanding の runtime helper について、Plugin は次のように呼び出せます。

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

音声文字起こしについては、Plugin は media-understanding runtime または古い STT alias のどちらも使えます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注意:

- `api.runtime.mediaUnderstanding.*` は、画像/音声/動画理解に対する推奨の共有 surface です。
- core の media-understanding 音声設定（`tools.media.audio`）と provider フォールバック順を使います。
- 文字起こし出力が生成されない場合（たとえばスキップされた入力や未対応入力）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性 alias として引き続き残ります。

Plugin は `api.runtime.subagent` を通じてバックグラウンド subagent 実行を起動することもできます。

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

- `provider` と `model` は、永続的なセッション変更ではなく、実行ごとの任意 override です。
- OpenClaw は、信頼済み caller に対してのみそれらの override フィールドを受け入れます。
- Plugin 所有のフォールバック実行では、operator が `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的に opt-in する必要があります。
- 信頼済み Plugin を特定の正規 `provider/model` 接続先のみに制限するには `plugins.entries.<id>.subagent.allowedModels` を使い、任意の接続先を明示的に許可するには `"*"` を使います。
- 信頼されていない Plugin の subagent 実行も動作しますが、override 要求は黙ってフォールバックされるのではなく拒否されます。

Web 検索については、Plugin は agent ツール配線へ直接 reach する代わりに、共有 runtime helper を消費できます。

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

Plugin は `api.registerWebSearchProvider(...)` を通じて Web 検索 provider を登録することもできます。

注意:

- provider 選択、認証情報解決、共有 request セマンティクスは core に維持してください。
- ベンダー固有の検索トランスポートには Web 検索 provider を使ってください。
- `api.runtime.webSearch.*` は、agent ツールラッパーに依存せず検索動作を必要とする機能/チャネル Plugin 向けの推奨共有 surface です。

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

- `generate(...)`: 設定された画像生成 provider chain を使って画像を生成します。
- `listProviders(...)`: 利用可能な画像生成 provider とその capabilities を一覧表示します。

## Gateway HTTP ルート

Plugin は `api.registerHttpRoute(...)` で HTTP エンドポイントを公開できます。

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

ルートフィールド:

- `path`: Gateway HTTP サーバー配下のルートパス。
- `auth`: 必須。通常の Gateway 認証を要求する場合は `"gateway"`、Plugin 管理の認証/Webhook 検証には `"plugin"` を使います。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が既存の自分のルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理したら `true` を返します。

注意:

- `api.registerHttpHandler(...)` は削除されており、Plugin ロードエラーになります。代わりに `api.registerHttpRoute(...)` を使ってください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致の `path + match` 競合は、`replaceExisting: true` がない限り拒否され、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルの異なる重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベル内だけにしてください。
- `auth: "plugin"` のルートは、自動的に operator runtime scopes を受け取り**ません**。これらは特権付き Gateway helper 呼び出しではなく、Plugin 管理の Webhook/署名検証用です。
- `auth: "gateway"` のルートは Gateway リクエスト runtime scope の中で動作しますが、その scope は意図的に保守的です:
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、caller が `x-openclaw-scopes` を送っても、Plugin ルートの runtime scope は `operator.write` に固定されます
  - 信頼済みで ID を伴う HTTP モード（たとえば `trusted-proxy` や、プライベート ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` ヘッダーが明示的に存在する場合にのみそれを尊重します
  - そのような ID 付き Plugin ルートリクエストで `x-openclaw-scopes` がない場合、runtime scope は `operator.write` にフォールバックします
- 実践ルール: Gateway 認証された Plugin ルートを暗黙の admin surface だとみなさないでください。ルートが admin 専用動作を必要とするなら、ID 付き auth モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK の import パス

Plugin を作成するときは、巨大な `openclaw/plugin-sdk` import ではなく SDK subpath を使ってください。

- Plugin 登録プリミティブには `openclaw/plugin-sdk/plugin-entry`
- 汎用の共有 Plugin 向けコントラクトには `openclaw/plugin-sdk/core`
- ルート `openclaw.json` Zod schema export（`OpenClawSchema`）には `openclaw/plugin-sdk/config-schema`
- `openclaw/plugin-sdk/channel-setup`、`openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/setup-tools`、`openclaw/plugin-sdk/channel-pairing`、`openclaw/plugin-sdk/channel-contract`、`openclaw/plugin-sdk/channel-feedback`、`openclaw/plugin-sdk/channel-inbound`、`openclaw/plugin-sdk/channel-lifecycle`、`openclaw/plugin-sdk/channel-reply-pipeline`、`openclaw/plugin-sdk/command-auth`、`openclaw/plugin-sdk/secret-input`、`openclaw/plugin-sdk/webhook-ingress` のような安定したチャネルプリミティブは、共有の setup/auth/reply/webhook 配線用です。`channel-inbound` は debounce、mention matching、受信 mention-policy helper、envelope formatting、受信 envelope context helper の共有ホームです。
  `channel-setup` は狭い optional-install の setup seam です。
  `setup-runtime` は、`setupEntry` / 遅延起動で使われる runtime-safe な setup surface であり、import-safe な setup patch adapter を含みます。
  `setup-adapter-runtime` は env を認識する account-setup adapter seam です。
  `setup-tools` は小さな CLI/archive/docs helper seam（`formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`）です。
- `openclaw/plugin-sdk/channel-config-helpers`、`openclaw/plugin-sdk/allow-from`、`openclaw/plugin-sdk/channel-config-schema`、`openclaw/plugin-sdk/telegram-command-config`、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/approval-gateway-runtime`、`openclaw/plugin-sdk/approval-handler-adapter-runtime`、`openclaw/plugin-sdk/approval-handler-runtime`、`openclaw/plugin-sdk/approval-runtime`、`openclaw/plugin-sdk/config-runtime`、`openclaw/plugin-sdk/infra-runtime`、`openclaw/plugin-sdk/agent-runtime`、`openclaw/plugin-sdk/lazy-runtime`、`openclaw/plugin-sdk/reply-history`、`openclaw/plugin-sdk/routing`、`openclaw/plugin-sdk/status-helpers`、`openclaw/plugin-sdk/text-runtime`、`openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/directory-runtime` のようなドメイン subpath は、共有 runtime/config helper 用です。
  `telegram-command-config` は、Telegram custom command の正規化/検証向けの狭い公開 seam であり、同梱 Telegram コントラクト surface が一時的に利用できなくても引き続き利用可能です。
  `text-runtime` は、assistant-visible-text の除去、markdown の render/chunking helper、redaction helper、directive-tag helper、安全な text utility を含む、共有 text/markdown/logging seam です。
- 承認固有のチャネル seam では、Plugin 上の 1 つの `approvalCapability` コントラクトを優先してください。すると core は、無関係な Plugin フィールドに承認動作を混在させるのではなく、その 1 つの capability を通して承認 auth、配信、render、native-routing、遅延 native-handler の動作を読み取ります。
- `openclaw/plugin-sdk/channel-runtime` は非推奨であり、古い Plugin の互換 shim としてのみ残っています。新しい code では、より狭い汎用プリミティブを import してください。また、repo code でも shim の新規 import を追加しないでください。
- 同梱 extension の内部は private のままです。外部 Plugin は `openclaw/plugin-sdk/*` subpath のみを使うべきです。OpenClaw の core/test code は、`index.js`、`api.js`、`runtime-api.js`、`setup-entry.js`、および `login-qr-api.js` のような狭いファイルなど、Plugin package root 配下の repo 公開 entry point を使えます。core からも別 extension からも、Plugin package の `src/*` を import してはいけません。
- repo entry point の分割:
  `<plugin-package-root>/api.js` は helper/types barrel、
  `<plugin-package-root>/runtime-api.js` は runtime 専用 barrel、
  `<plugin-package-root>/index.js` は同梱 Plugin entry、
  `<plugin-package-root>/setup-entry.js` は setup Plugin entry です。
- 現在の同梱 provider 例:
  - Anthropic は、`wrapAnthropicProviderStream`、beta-header helper、`service_tier` 解析のような Claude stream helper に `api.js` / `contract-api.js` を使います。
  - OpenAI は、provider builder、default-model helper、realtime provider builder に `api.js` を使います。
  - OpenRouter は、provider builder と onboarding/config helper に `api.js` を使い、`register.runtime.js` は repo ローカル利用のために汎用 `plugin-sdk/provider-stream` helper を引き続き再 export できます。
- facade ロードされる公開 entry point は、利用可能な場合はアクティブな runtime 設定 snapshot を優先し、OpenClaw がまだ runtime snapshot を提供していない場合はディスク上で解決された設定ファイルへフォールバックします。
- 汎用の共有プリミティブは、引き続き推奨される公開 SDK コントラクトです。同梱チャネル名付き helper seam の小さな予約済み互換セットはまだ存在します。これらは新しいサードパーティ import 先ではなく、同梱保守/互換性 seam として扱ってください。新しい cross-channel コントラクトは、引き続き汎用 `plugin-sdk/*` subpath または Plugin ローカルの `api.js` / `runtime-api.js` barrel に置くべきです。

互換性に関する注意:

- 新しい code では、ルートの `openclaw/plugin-sdk` barrel を避けてください。
- まず狭く安定したプリミティブを優先してください。より新しい setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/allowlist/status/message-tool subpath は、新しい同梱 Plugin と外部 Plugin 作業に向けた意図されたコントラクトです。
  target の解析/マッチングは `openclaw/plugin-sdk/channel-targets` に置くべきです。
  message action gate と reaction の message-id helper は `openclaw/plugin-sdk/channel-actions` に置くべきです。
- 同梱 extension 固有の helper barrel は、デフォルトでは stable ではありません。helper が同梱 extension でしか必要ないなら、`openclaw/plugin-sdk/<extension>` に昇格させるのではなく、その extension のローカル `api.js` または `runtime-api.js` seam の背後に置いてください。
- 新しい共有 helper seam は、チャネル名付きではなく汎用であるべきです。共有 target 解析は `openclaw/plugin-sdk/channel-targets` に置き、チャネル固有の内部は、その所有 Plugin のローカル `api.js` または `runtime-api.js` seam の背後に残してください。
- `image-generation`、`media-understanding`、`speech` のような capability 固有 subpath は、現在同梱/ネイティブ Plugin がそれらを使っているため存在します。これらが存在すること自体は、export されたすべての helper が長期的に凍結された外部コントラクトであることを意味しません。

## message ツール schema

Plugin は、チャネル固有の `describeMessageTool(...)` schema への追加を所有すべきです。provider 固有フィールドは共有 core ではなく Plugin に置いてください。

共有して持ち運び可能な schema 断片には、`openclaw/plugin-sdk/channel-actions` から export される汎用 helper を再利用してください。

- ボタングリッド形式のペイロードには `createMessageToolButtonsSchema()`
- 構造化カード形式のペイロードには `createMessageToolCardSchema()`

schema の形が 1 つの provider にしか意味を持たないなら、共有 SDK へ昇格させるのではなく、その Plugin 自身の source に定義してください。

## チャネル target 解決

チャネル Plugin は、チャネル固有の target セマンティクスを所有すべきです。共有 outbound host は汎用のままに保ち、provider ルールには messaging adapter surface を使ってください。

- `messaging.inferTargetChatType({ to })` は、正規化された target を directory lookup 前に `direct`、`group`、`channel` のどれとして扱うべきかを判断します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力を directory search の代わりに id 形式の解決へ直接送るべきかどうかを core に伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または directory miss 後に、core が最終的な provider 所有解決を必要とするときの Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、target 解決後の provider 固有 session route 構築を所有します。

推奨される分割:

- peer/group を検索する前に行うべきカテゴリ判断には `inferTargetChatType` を使う
- 「これを明示的/ネイティブ target id として扱う」判定には `looksLikeId` を使う
- `resolveTarget` は、広範な directory search ではなく、provider 固有の正規化フォールバックに使う
- chat id、thread id、JID、handle、room id のような provider ネイティブ id は、汎用 SDK フィールドではなく `target` 値または provider 固有 param の中に保持する

## 設定ベースの directory

設定から directory entry を導出する Plugin は、そのロジックを Plugin 内に保持し、`openclaw/plugin-sdk/directory-runtime` の共有 helper を再利用すべきです。

これは、チャネルが次のような設定ベースの peer/group を必要とする場合に使います。

- allowlist 駆動の DM peer
- 設定済み channel/group map
- account 単位の静的 directory フォールバック

`directory-runtime` の共有 helper は、汎用操作のみを扱います。

- query filtering
- limit 適用
- deduping/normalization helper
- `ChannelDirectoryEntry[]` の構築

チャネル固有の account 検査と id 正規化は、Plugin 実装に残してください。

## provider カタログ

provider Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` により、推論用のモデル catalog を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むのと同じ形を返します。

- 1 つの provider entry の場合は `{ provider }`
- 複数の provider entry の場合は `{ providers }`

`catalog` は、Plugin が provider 固有 model id、base URL デフォルト、または auth に応じたモデル metadata を所有する場合に使ってください。

`catalog.order` は、Plugin の catalog が OpenClaw の組み込み暗黙 provider に対していつマージされるかを制御します。

- `simple`: 単純な API キーまたは env 駆動 provider
- `profile`: auth profile が存在すると現れる provider
- `paired`: 複数の関連 provider entry を合成する provider
- `late`: 他の暗黙 provider の後の最後のパス

後の provider がキー競合時に勝つため、Plugin は同じ provider id を持つ組み込み provider entry を意図的に上書きできます。

互換性:

- `discovery` はレガシー別名として引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使います

## 読み取り専用のチャネル検査

Plugin がチャネルを登録する場合、`resolveAccount(...)` とあわせて `plugin.config.inspectAccount(cfg, accountId)` の実装を推奨します。

理由:

- `resolveAccount(...)` は runtime パスです。認証情報が完全に具体化されている前提を置いてよく、必要な secret が足りなければ即座に失敗して構いません。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、doctor/config repair flow のような読み取り専用コマンドパスは、設定を説明するだけのために runtime 認証情報を具体化する必要があるべきではありません。

推奨される `inspectAccount(...)` の振る舞い:

- 説明的な account 状態のみを返す
- `enabled` と `configured` は保持する
- 関連する場合は、次のような認証情報 source/status フィールドを含める:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可能性を報告するだけなら、生の token 値を返す必要はありません。status 系コマンドには `tokenStatus: "available"`（および対応する source フィールド）を返せば十分です。
- SecretRef 経由で認証情報が設定されているが、現在のコマンドパスでは利用できない場合は `configured_unavailable` を使ってください。

これにより、読み取り専用コマンドはクラッシュしたり、その account を未設定と誤報したりする代わりに、「設定済みだがこのコマンドパスでは利用不可」と報告できます。

## パッケージ pack

Plugin ディレクトリには、`openclaw.extensions` を含む `package.json` を置けます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各 entry は 1 つの Plugin になります。pack が複数の extension を列挙している場合、Plugin id は `name/<fileBase>` になります。

Plugin が npm 依存関係を import する場合は、そのディレクトリで依存関係をインストールして `node_modules` を利用可能にしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` entry は、symlink 解決後も Plugin ディレクトリの内側に留まっていなければなりません。package ディレクトリの外へ出る entry は拒否されます。

セキュリティに関する注意: `openclaw plugins install` は、Plugin 依存関係を `npm install --omit=dev --ignore-scripts` でインストールします（ライフサイクルスクリプトなし、runtime で dev dependencies なし）。Plugin の依存ツリーは「pure JS/TS」に保ち、`postinstall` ビルドが必要な package は避けてください。

任意: `openclaw.setupEntry` は、軽量な setup 専用 module を指せます。OpenClaw が無効化されたチャネル Plugin の setup surface を必要とするとき、またはチャネル Plugin は有効だがまだ未設定のとき、完全な Plugin entry の代わりに `setupEntry` をロードします。これにより、メインの Plugin entry が tools、hooks、その他の runtime 専用 code も配線している場合に、起動と setup を軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` を使うと、チャネルがすでに設定済みでも、Gateway の pre-listen 起動フェーズ中にチャネル Plugin を同じ `setupEntry` パスへ opt-in できます。

これを使うのは、Gateway が listen を開始する前に存在していなければならない起動 surface を `setupEntry` が完全にカバーしている場合だけにしてください。実際には、setup entry が起動時に依存されるすべてのチャネル所有 capability を登録しなければならないことを意味します。たとえば:

- チャネル登録そのもの
- Gateway が listen を開始する前に利用可能である必要のある HTTP ルート
- 同じ時間帯に存在している必要がある Gateway methods、tools、services

完全な entry が依然として必要な起動 capability を所有しているなら、このフラグを有効にしてはいけません。デフォルト動作のままにして、OpenClaw に起動時フル entry をロードさせてください。

同梱チャネルは、完全なチャネル runtime がロードされる前に core が参照できる setup 専用コントラクト surface helper を公開することもできます。現在の setup promotion surface は次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、完全な Plugin entry をロードせずに、レガシーな単一 account チャネル設定を `channels.<id>.accounts.*` に昇格する必要があるときにこの surface を使います。Matrix は現在の同梱例です。named account がすでに存在する場合、auth/bootstrap キーだけを名前付き昇格 account へ移動し、常に `accounts.default` を作成する代わりに、設定済みの非正規 default-account キーを保持できます。

これらの setup patch adapter により、同梱コントラクト surface discovery は遅延のまま保たれます。import 時間は軽く保たれ、promotion surface は module import 時に同梱チャネル起動へ再突入するのではなく、最初の使用時にのみロードされます。

それらの起動 surface に Gateway RPC methods が含まれる場合は、Plugin 固有の prefix を付けてください。core の admin namespace（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、Plugin がより狭い scope を要求しても、常に `operator.admin` に解決されます。

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

### チャネル catalog metadata

チャネル Plugin は `openclaw.channel` を通して setup/discovery metadata を、`openclaw.install` を通して install ヒントを告知できます。これにより、core catalog をデータフリーに保てます。

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

最小例以外で有用な `openclaw.channel` フィールド:

- `detailLabel`: より豊かな catalog/status surface 向けの二次ラベル
- `docsLabel`: docs リンクのリンクテキストを上書きする
- `preferOver`: この catalog entry が優先すべき、より優先度の低い Plugin/チャネル id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: selection surface の文言制御
- `markdownCapable`: outbound formatting 判断のために、そのチャネルが markdown 対応であることを示す
- `exposure.configured`: `false` に設定すると、設定済みチャネル一覧 surface からそのチャネルを隠す
- `exposure.setup`: `false` に設定すると、対話型 setup/configure picker からそのチャネルを隠す
- `exposure.docs`: docs ナビゲーション surface において、そのチャネルを internal/private として扱う
- `showConfigured` / `showInSetup`: レガシー別名として互換性のために引き続き受け付けるが、`exposure` を推奨
- `quickstartAllowFrom`: そのチャネルを標準クイックスタートの `allowFrom` フローに opt-in する
- `forceAccountBinding`: account が 1 つしかなくても明示的な account binding を必須にする
- `preferSessionLookupForAnnounceTarget`: announce target 解決時に session lookup を優先する

OpenClaw は**外部チャネル catalog**（たとえば MPM registry export）もマージできます。JSON ファイルを以下のいずれかに配置してください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または `OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で、1 つ以上の JSON ファイルを指定できます（カンマ/セミコロン/`PATH` 区切り）。各ファイルは `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含む必要があります。parser は、`"entries"` キーのレガシー別名として `"packages"` または `"plugins"` も受け付けます。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、ingest、assembly、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

これは、単に memory search や hooks を追加するのではなく、デフォルトのコンテキストパイプラインを置き換えたり拡張したりする必要がある場合に使います。

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

エンジンが Compaction アルゴリズムを**所有しない**場合でも、`compact()` は実装したまま、明示的に委譲してください。

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

Plugin が現在の API に収まらない動作を必要とする場合、private な reach-in で Plugin システムを迂回しないでください。不足している capability を追加してください。

推奨される手順:

1. core コントラクトを定義する
   core が所有すべき共有動作を決めます: ポリシー、フォールバック、設定マージ、ライフサイクル、チャネル向けセマンティクス、runtime helper の形。
2. 型付き Plugin 登録/runtime surface を追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な型付き capability surface で拡張します。
3. core + チャネル/機能 consumer を配線する
   チャネルと機能 Plugin は、新しい capability を core を通して消費すべきであり、ベンダー実装を直接 import してはいけません。
4. ベンダー実装を登録する
   ベンダー Plugin が、その capability に対して自身のバックエンドを登録します。
5. コントラクトのカバレッジを追加する
   時間が経っても所有権と登録形状が明示的なまま保たれるよう、テストを追加します。

これが、OpenClaw が 1 つの provider の世界観にハードコードされることなく、意図を持った設計を保つ方法です。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### capability チェックリスト

新しい capability を追加するとき、実装は通常次の surface をまとめて変更する必要があります。

- `src/<capability>/types.ts` の core コントラクト型
- `src/<capability>/runtime.ts` の core runner/runtime helper
- `src/plugins/types.ts` の Plugin API 登録 surface
- `src/plugins/registry.ts` の Plugin registry 配線
- 機能/チャネル Plugin が消費する必要がある場合の `src/plugins/runtime/*` における Plugin runtime 公開
- `src/test-utils/plugin-registration.ts` の capture/test helper
- `src/plugins/contracts/registry.ts` の所有権/コントラクト検証
- `docs/` の operator/Plugin docs

これらの surface のいずれかが欠けている場合、それは通常、その capability がまだ完全には統合されていないことを示します。

### capability テンプレート

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

コントラクトテストのパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これによりルールはシンプルに保たれます。

- core が capability コントラクト + オーケストレーションを所有する
- ベンダー Plugin がベンダー実装を所有する
- 機能/チャネル Plugin が runtime helper を消費する
- コントラクトテストが所有権を明示的に保つ
