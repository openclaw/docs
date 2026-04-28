---
read_when:
    - ネイティブ OpenClaw Plugin を構築またはデバッグする場合
    - Plugin の capability モデルや所有権の境界を理解したい場合
    - Plugin のロードパイプラインや registry に取り組んでいる場合
    - provider ランタイムフックまたはチャンネル Plugin を実装している場合
sidebarTitle: Internals
summary: 'Plugin の内部構造: capability モデル、所有権、契約、ロードパイプライン、およびランタイムヘルパー'
title: Plugin の内部構造
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:35:30Z"
  model: gpt-5.4
  provider: openai
  source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
  source_path: plugins/architecture.md
  workflow: 15
---

これは OpenClaw Plugin システムの **詳細アーキテクチャ リファレンス** です。実践的なガイドについては、まず以下の各集中ページから始めてください。

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/ja-JP/tools/plugin">
    Plugin の追加、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Building plugins" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小の動作する manifest を使った最初の Plugin チュートリアル。
  </Card>
  <Card title="Channel plugins" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築します。
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築します。
  </Card>
  <Card title="SDK overview" icon="book" href="/ja-JP/plugins/sdk-overview">
    import map と登録 API リファレンス。
  </Card>
</CardGroup>

## 公開 capability モデル

capability は、OpenClaw 内の公開 **ネイティブ Plugin** モデルです。すべてのネイティブ OpenClaw Plugin は、1 つ以上の capability type に対して登録されます。

| Capability             | 登録メソッド                                     | Plugin の例                         |
| ---------------------- | ------------------------------------------------ | ---------------------------------- |
| テキスト推論           | `api.registerProvider(...)`                      | `openai`, `anthropic`              |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`              |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`          |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                           |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                 |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                             |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                        |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                           |
| チャンネル / メッセージング | `api.registerChannel(...)`                   | `msteams`, `matrix`                |
| Gateway 検出           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                          |

<Note>
capability を 1 つも登録せず、フック、ツール、discovery service、または background service を提供する Plugin は、**レガシー hook-only** Plugin です。このパターンは引き続き完全にサポートされています。
</Note>

### 外部互換性の立場

capability モデルはすでに core に導入されており、現在バンドル済み/ネイティブ Plugin で使われていますが、外部 Plugin 互換性には「エクスポートされているから固定されている」というより厳しい基準が引き続き必要です。

| Plugin の状況                                     | ガイダンス                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部 Plugin                                 | フックベースの統合を動作させ続けてください。これが互換性のベースラインです。                     |
| 新しいバンドル済み/ネイティブ Plugin              | vendor 固有の内部参照や新しい hook-only 設計よりも、明示的な capability 登録を優先してください。 |
| capability 登録を採用する外部 Plugin              | 許可されていますが、ドキュメントで安定と明記されない限り、capability 固有の helper surface は進化中として扱ってください。 |

capability 登録が意図された方向です。移行期間中、レガシーフックは外部 Plugin にとって最も安全で破壊のない経路のままです。エクスポートされた helper subpath はすべて同等ではありません。偶発的な helper export よりも、狭く文書化された契約を優先してください。

### Plugin の形

OpenClaw は、読み込まれたすべての Plugin を、静的メタデータだけでなく実際の登録動作に基づいて分類します。

<AccordionGroup>
  <Accordion title="plain-capability">
    ちょうど 1 つの capability type を登録します（たとえば `mistral` のような provider 専用 Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    複数の capability type を登録します（たとえば `openai` はテキスト推論、音声、メディア理解、画像生成を所有します）。
  </Accordion>
  <Accordion title="hook-only">
    フック（型付きまたはカスタム）のみを登録し、capability、ツール、コマンド、サービスは登録しません。
  </Accordion>
  <Accordion title="non-capability">
    ツール、コマンド、サービス、またはルートを登録しますが、capability は登録しません。
  </Accordion>
</AccordionGroup>

Plugin の shape と capability の内訳は `openclaw plugins inspect <id>` で確認してください。詳細は [CLI reference](/ja-JP/cli/plugins#inspect) を参照してください。

### レガシーフック

`before_agent_start` フックは、hook-only Plugin 向けの互換性パスとして引き続きサポートされています。実運用のレガシー Plugin は今もこれに依存しています。

方向性:

- 動作させ続ける
- レガシーとして文書化する
- model/provider 上書き作業には `before_model_resolve` を優先する
- prompt 変更作業には `before_prompt_build` を優先する
- 実利用が減り、fixture カバレッジで移行の安全性が証明されてから初めて削除する

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、次のいずれかのラベルが表示されることがあります。

| シグナル                   | 意味                                                           |
| -------------------------- | -------------------------------------------------------------- |
| **config valid**           | Config は正常に解析され、Plugin も解決されている               |
| **compatibility advisory** | Plugin はサポート済みだが古いパターンを使っている（例: `hook-only`） |
| **legacy warning**         | Plugin は非推奨の `before_agent_start` を使っている            |
| **hard error**             | Config が無効、または Plugin のロードに失敗した                |

`hook-only` も `before_agent_start` も、現時点では Plugin を壊しません。`hook-only` は advisory であり、`before_agent_start` は警告を出すだけです。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムは 4 つのレイヤーを持ちます。

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw は、設定されたパス、ワークスペースルート、グローバル Plugin ルート、バンドル済み Plugin から候補 Plugin を見つけます。discovery は、まずネイティブの `openclaw.plugin.json` manifest とサポート対象 bundle manifest を読み取ります。
  </Step>
  <Step title="有効化 + 検証">
    Core は、検出された Plugin が有効か、無効か、ブロックされているか、あるいは memory のような排他的スロットに選ばれているかを判断します。
  </Step>
  <Step title="ランタイムロード">
    ネイティブ OpenClaw Plugin は jiti によりインプロセスでロードされ、central registry に capability を登録します。互換 bundle はランタイムコードを import せずに registry record へ正規化されます。
  </Step>
  <Step title="surface 消費">
    OpenClaw の残りの部分は registry を読み取り、ツール、チャンネル、provider セットアップ、フック、HTTP ルート、CLI コマンド、サービスを公開します。
  </Step>
</Steps>

特に Plugin CLI については、ルートコマンド検出は 2 段階に分かれています。

- parse 時メタデータは `registerCli(..., { descriptors: [...] })` から来ます
- 実際の Plugin CLI module は lazy のままにでき、最初の呼び出し時に登録されます

これにより、Plugin 所有の CLI コードを Plugin 内に保ちつつ、OpenClaw が解析前にルートコマンド名を予約できます。

重要な設計境界:

- manifest/config 検証は、Plugin コードを実行せず **manifest/schema メタデータ** から動作すべきです
- ネイティブ capability discovery は、非アクティブな registry snapshot を構築するために、信頼済み Plugin エントリコードを読み込む場合があります
- ネイティブランタイム動作は、`api.registrationMode === "full"` のときの Plugin module の `register(api)` パスから来ます

この分離により、OpenClaw はフルランタイムが有効になる前に、config を検証し、不足/無効な Plugin を説明し、UI/schema のヒントを構築できます。

### アクティベーション計画

アクティベーション計画は control plane の一部です。呼び出し元は、より広いランタイム registry をロードする前に、具体的なコマンド、provider、channel、route、agent harness、または capability に対して、どの Plugin が関係するかを問い合わせることができます。

planner は現在の manifest 動作との互換性を保ちます。

- `activation.*` フィールドは明示的な planner ヒントです
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、およびフックは manifest 所有権のフォールバックのままです
- ids のみを返す planner API は既存の呼び出し元のために引き続き利用可能です
- plan API は reason label を報告するため、診断では明示的ヒントと所有権フォールバックを区別できます

<Warning>
`activation` をライフサイクルフックや `register(...)` の置き換えとして扱わないでください。これはロードを絞り込むためのメタデータです。既存の所有権フィールドで関係性を説明できる場合はそちらを優先し、追加の planner ヒントが必要な場合にのみ `activation` を使用してください。
</Warning>

### チャンネル Plugin と共有 message ツール

チャンネル Plugin は、通常のチャットアクション用に個別の送信/編集/リアクション ツールを登録する必要はありません。OpenClaw は core に 1 つの共有 `message` ツールを保持し、その背後のチャンネル固有の discovery と実行はチャンネル Plugin が所有します。

現在の境界は次のとおりです。

- core は共有 `message` ツール host、prompt 配線、session/thread bookkeeping、実行 dispatch を所有します
- チャンネル Plugin は、スコープ付きアクション discovery、capability discovery、および任意のチャンネル固有 schema fragment を所有します
- チャンネル Plugin は、会話 ID がスレッド ID をどのようにエンコードするか、または親会話からどのように継承するかといった、provider 固有のセッション会話文法を所有します
- チャンネル Plugin は、その action adapter を通じて最終アクションを実行します

チャンネル Plugin の SDK surface は `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された discovery 呼び出しにより、Plugin は可視アクション、capability、schema contribution をまとめて返せるため、それらの内容が食い違いません。

チャンネル固有の message-tool param がローカルパスやリモートメディア URL のようなメディアソースを持つ場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返すべきです。Core は、その明示的なリストを使って、Plugin 所有の param 名をハードコードせずに、sandbox パス正規化と送信メディアアクセス ヒントを適用します。そこでは、チャンネル全体で 1 つのフラットリストではなく、action スコープ付きマップを優先してください。そうしないと、profile 専用メディア param が `send` のような無関係なアクションでも正規化されてしまいます。

Core は、その discovery ステップにランタイムスコープを渡します。重要なフィールドは次のとおりです。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済みの受信 `requesterSenderId`

これはコンテキスト依存 Plugin にとって重要です。チャンネルは、アクティブな account、現在の room/thread/message、または信頼済み requester ID に基づいて message action を隠したり公開したりできます。core の `message` ツールにチャンネル固有の分岐をハードコードする必要はありません。

これが、組み込み runner のルーティング変更が依然として Plugin 作業である理由です。runner は、共有 `message` ツールが現在のターンに対して正しいチャンネル所有 surface を公開できるように、現在の chat/session ID を Plugin discovery 境界へ転送する責任を負います。

チャンネル所有の実行 helper については、バンドル済み Plugin は実行ランタイムを自身の extension module 内に保つべきです。Core はもはや `src/agents/tools` 配下で Discord、Slack、Telegram、または WhatsApp の message-action ランタイムを所有しません。別個の `plugin-sdk/*-action-runtime` subpath は公開しておらず、バンドル済み Plugin は自分の extension 所有 module からローカルのランタイムコードを直接 import するべきです。

同じ境界は、一般に provider 名付き SDK seam にも適用されます。core は Slack、Discord、Signal、WhatsApp、または同様の extension 向けチャンネル固有 convenience barrel を import すべきではありません。core に必要な動作がある場合は、バンドル済み Plugin 自身の `api.ts` / `runtime-api.ts` barrel を利用するか、その必要性を共有 SDK 内の狭い汎用 capability へ昇格させてください。

poll については特に、実行パスが 2 つあります。

- `outbound.sendPoll` は共通 poll モデルに適合するチャンネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャンネル固有の poll セマンティクスや追加 poll パラメータ向けの推奨パスです

core は現在、Plugin の poll dispatch がアクションを拒否した後にのみ共有 poll 解析を行うため、Plugin 所有の poll handler は、先に汎用 poll parser にブロックされることなく、チャンネル固有の poll フィールドを受け付けられます。

完全な起動シーケンスについては [Plugin architecture internals](/ja-JP/plugins/architecture-internals) を参照してください。

## Capability 所有権モデル

OpenClaw は、ネイティブ Plugin を無関係な統合の寄せ集めではなく、**会社** または **機能** に対する所有権境界として扱います。

これは次を意味します。

- 会社 Plugin は通常、その会社の OpenClaw 向け surface をすべて所有するべきです
- 機能 Plugin は通常、自らが導入する機能 surface 全体を所有するべきです
- チャンネルは、provider の動作を場当たり的に再実装するのではなく、共有 core capability を利用するべきです

<AccordionGroup>
  <Accordion title="ベンダーの複数 capability">
    `openai` はテキスト推論、音声、リアルタイム音声、メディア理解、画像生成を所有します。`google` はテキスト推論に加え、メディア理解、画像生成、Web search を所有します。`qwen` はテキスト推論に加え、メディア理解と動画生成を所有します。
  </Accordion>
  <Accordion title="ベンダーの単一 capability">
    `elevenlabs` と `microsoft` は音声を所有し、`firecrawl` は web-fetch を所有し、`minimax` / `mistral` / `moonshot` / `zai` はメディア理解バックエンドを所有します。
  </Accordion>
  <Accordion title="機能 Plugin">
    `voice-call` は通話トランスポート、ツール、CLI、ルート、および Twilio メディアストリームのブリッジを所有しますが、ベンダー Plugin を直接 import する代わりに、共有の音声、リアルタイム文字起こし、リアルタイム音声 capability を利用します。
  </Accordion>
</AccordionGroup>

意図された最終状態は次のとおりです。

- OpenAI は、テキストモデル、音声、画像、将来の動画にまたがっていても、1 つの Plugin に存在する
- 別のベンダーも、自身の surface 領域について同じことができる
- チャンネルは、どのベンダー Plugin が provider を所有しているかを気にせず、core が公開する共有 capability 契約を利用する

これが重要な区別です。

- **plugin** = 所有権境界
- **capability** = 複数の Plugin が実装または利用できる core 契約

したがって、OpenClaw が動画のような新しいドメインを追加する場合、最初の問いは「どの provider が動画処理をハードコードすべきか」ではありません。最初の問いは「core の動画 capability 契約は何か」です。その契約が存在すれば、ベンダー Plugin はそこに登録でき、チャンネル/機能 Plugin はそれを利用できます。

capability がまだ存在しない場合、通常取るべき正しい手順は次のとおりです。

<Steps>
  <Step title="capability を定義">
    不足している capability を core で定義します。
  </Step>
  <Step title="SDK 経由で公開">
    型付きの形で Plugin API/ランタイムを通じて公開します。
  </Step>
  <Step title="コンシューマーを接続">
    チャンネル/機能をその capability に接続します。
  </Step>
  <Step title="ベンダー実装">
    ベンダー Plugin に実装を登録させます。
  </Step>
</Steps>

これにより、所有権を明示したまま、単一ベンダーや一回限りの Plugin 固有コードパスに依存する core 動作を避けられます。

### Capability レイヤリング

コードの置き場所を決めるときは、この考え方を使ってください。

<Tabs>
  <Tab title="Core capability レイヤー">
    共有オーケストレーション、ポリシー、フォールバック、config マージルール、配信セマンティクス、および型付き契約。
  </Tab>
  <Tab title="ベンダー Plugin レイヤー">
    ベンダー固有 API、認証、モデルカタログ、音声合成、画像生成、将来の動画バックエンド、使用量エンドポイント。
  </Tab>
  <Tab title="チャンネル/機能 Plugin レイヤー">
    Slack/Discord/voice-call などの統合で、core capability を利用し、それをある surface 上に提示する。
  </Tab>
</Tabs>

たとえば TTS はこの形に従います。

- core は返信時の TTS ポリシー、フォールバック順序、設定、チャンネル配信を所有します
- `openai`、`elevenlabs`、`microsoft` は音声合成実装を所有します
- `voice-call` はテレフォニー TTS ランタイム helper を利用します

将来の capability に対しても、同じパターンを優先すべきです。

### 複数 capability を持つ会社 Plugin の例

会社 Plugin は外から見て一貫性があるべきです。OpenClaw にモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web fetch、Web search の共有契約があるなら、ベンダーはそのすべての surface を 1 か所で所有できます。

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

重要なのは helper 名の正確さではありません。形が重要です。

- 1 つの Plugin がベンダー surface を所有する
- core は依然として capability 契約を所有する
- チャンネルと機能 Plugin はベンダーコードではなく `api.runtime.*` helper を利用する
- 契約テストで、その Plugin が自分が所有すると主張する capability を登録したことを検証できる

### Capability の例: 動画理解

OpenClaw はすでに画像/音声/動画理解を 1 つの共有 capability として扱っています。ここでも同じ所有権モデルが適用されます。

<Steps>
  <Step title="Core が契約を定義">
    Core が media-understanding 契約を定義します。
  </Step>
  <Step title="ベンダー Plugin が登録">
    ベンダー Plugin は、該当するものとして `describeImage`、`transcribeAudio`、`describeVideo` を登録します。
  </Step>
  <Step title="コンシューマーが共有動作を利用">
    チャンネルと機能 Plugin は、ベンダーコードへ直接接続するのではなく、共有の core 動作を利用します。
  </Step>
</Steps>

これにより、ある provider の動画前提が core に焼き付くのを避けられます。Plugin はベンダー surface を所有し、core は capability 契約とフォールバック動作を所有します。

動画生成もすでに同じ流れを使っています。core が型付き capability 契約とランタイム helper を所有し、ベンダー Plugin が `api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的な展開チェックリストが必要ですか？ [Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

## 契約と強制

Plugin API surface は、意図的に `OpenClawPluginApi` に型付きで集約されています。この契約は、サポートされる登録ポイントと、Plugin が依存してよいランタイム helper を定義します。

これが重要な理由:

- Plugin 作成者は 1 つの安定した内部標準を得られる
- core は、2 つの Plugin が同じ provider id を登録するような重複所有を拒否できる
- 起動時に、不正な登録に対する実用的な診断を表示できる
- 契約テストで、バンドル済み Plugin の所有権を強制し、静かなドリフトを防げる

強制には 2 つのレイヤーがあります。

<AccordionGroup>
  <Accordion title="ランタイム登録の強制">
    Plugin registry は、Plugin ロード時に登録を検証します。例: 重複 provider id、重複 speech provider id、不正な登録は未定義動作ではなく Plugin 診断として出力されます。
  </Accordion>
  <Accordion title="契約テスト">
    バンドル済み Plugin はテスト実行中に契約 registry へ取り込まれ、OpenClaw が所有権を明示的に検証できるようになります。現在は、モデル provider、speech provider、Web search provider、およびバンドル済み登録所有権に使用されています。
  </Accordion>
</AccordionGroup>

実際の効果として、OpenClaw はどの Plugin がどの surface を所有するかを事前に把握できます。所有権が暗黙ではなく、宣言され、型付けされ、テスト可能であるため、core とチャンネルを継ぎ目なく組み合わせられます。

### 契約に含めるべきもの

<Tabs>
  <Tab title="良い契約">
    型付き、小さい、capability 固有、core 所有、複数の Plugin で再利用可能、かつベンダー知識なしでチャンネルや機能から利用可能なもの。
  </Tab>
  <Tab title="悪い契約">
    core に隠されたベンダー固有ポリシー、registry を迂回する一回限りの Plugin 逃げ道、ベンダー実装へ直接到達するチャンネルコード、または `OpenClawPluginApi` / `api.runtime` の一部ではない場当たり的なランタイムオブジェクト。
  </Tab>
</Tabs>

迷った場合は抽象化レベルを上げてください。まず capability を定義し、その後 Plugin にそこへ接続させてください。

## 実行モデル

ネイティブ OpenClaw Plugin は Gateway と **同一プロセス内** で実行されます。サンドボックス化されていません。ロードされたネイティブ Plugin は、core コードと同じプロセスレベルの信頼境界を持ちます。

<Warning>
影響:

ネイティブ Plugin はツール、ネットワークハンドラー、フック、サービスを登録できます。ネイティブ Plugin のバグは Gateway をクラッシュまたは不安定化させる可能性があります。悪意あるネイティブ Plugin は OpenClaw プロセス内での任意コード実行と同等です。
</Warning>

互換 bundle は、OpenClaw が現在それらをメタデータ/コンテンツパックとして扱うため、デフォルトではより安全です。現在のリリースでは、主にバンドル済み Skills がこれに当たります。

バンドルされていない Plugin には allowlist と明示的なインストール/ロードパスを使用してください。ワークスペース Plugin は本番デフォルトではなく、開発時コードとして扱ってください。

バンドル済みワークスペース package 名では、Plugin id を npm 名に固定してください。デフォルトでは `@openclaw/<id>`、またはその package が意図的により狭い Plugin ロールを公開する場合は、承認された型付きサフィックス `-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` を使用します。

<Note>
**信頼に関する注意:**

`plugins.allow` はソースの由来ではなく **Plugin id** を信頼します。ワークスペース Plugin がバンドル済み Plugin と同じ id を持つ場合、そのワークスペース Plugin が有効化または allowlist されていれば、意図的にバンドル済みコピーを shadow します。これは正常であり、ローカル開発、パッチテスト、ホットフィックスに有用です。バンドル済み Plugin の信頼は、インストールメタデータではなくソーススナップショット、つまりロード時点のディスク上の manifest とコードから解決されます。破損またはすり替えられたインストール記録によって、実際のソースが主張する以上にバンドル済み Plugin の信頼 surface が黙って拡大されることはありません。
</Note>

## エクスポート境界

OpenClaw は実装 convenience ではなく capability をエクスポートします。

capability 登録は公開のまま維持しつつ、契約外の helper export は削減します。

- バンドル済み Plugin 固有の helper subpath
- 公開 API を意図しないランタイム plumbing subpath
- ベンダー固有 convenience helper
- 実装詳細である setup/オンボーディング helper

一部のバンドル済み Plugin helper subpath は、互換性とバンドル済み Plugin 保守のために、生成された SDK export map にまだ残っています。現在の例には `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` seam が含まれます。これらは新しいサードパーティ Plugin 向けの推奨 SDK パターンではなく、予約された実装詳細 export として扱ってください。

## 内部構造とリファレンス

ロードパイプライン、レジストリモデル、プロバイダーのランタイムフック、Gateway HTTPルート、メッセージツールスキーマ、チャンネルターゲット解決、プロバイダーカタログ、コンテキストエンジンのPlugin、および新しい機能を追加するためのガイドについては、[Plugin architecture internals](/ja-JP/plugins/architecture-internals)を参照してください。

## 関連

- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [Pluginマニフェスト](/ja-JP/plugins/manifest)
- [Plugin SDKセットアップ](/ja-JP/plugins/sdk-setup)
