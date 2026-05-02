---
read_when:
    - ネイティブ OpenClaw Plugin のビルドまたはデバッグ
    - Plugin の機能モデルまたは所有権境界の理解
    - Plugin の読み込みパイプラインまたはレジストリで作業する場合
    - プロバイダーランタイムフックまたはチャンネルPluginの実装
sidebarTitle: Internals
summary: 'Plugin の内部: ケイパビリティモデル、オーナーシップ、コントラクト、ロードパイプライン、ランタイムヘルパー'
title: Plugin 内部
x-i18n:
    generated_at: "2026-05-02T05:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

これはOpenClaw Pluginシステムの**詳細アーキテクチャリファレンス**です。実践的なガイドは、以下の焦点を絞ったページのいずれかから始めてください。

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/ja-JP/tools/plugin">
    Pluginの追加、有効化、トラブルシューティングを行うエンドユーザー向けガイド。
  </Card>
  <Card title="Building plugins" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小の動作するマニフェストを使った最初のPluginチュートリアル。
  </Card>
  <Card title="Channel plugins" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネルPluginを構築します。
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダーPluginを構築します。
  </Card>
  <Card title="SDK overview" icon="book" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録APIのリファレンス。
  </Card>
</CardGroup>

## 公開 capability モデル

capability は、OpenClaw内の公開**ネイティブPlugin**モデルです。すべてのネイティブOpenClaw Pluginは、1つ以上のcapabilityタイプに対して登録されます。

| capability             | 登録メソッド                              | Plugin例                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI推論バックエンド  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 音声                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 画像生成       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web取得              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web検索             | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージング    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway検出      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
capabilityを1つも登録せず、hooks、ツール、検出サービス、またはバックグラウンドサービスを提供するPluginは、**レガシーのhook専用**Pluginです。このパターンは現在も完全にサポートされています。
</Note>

### 外部互換性の立場

capabilityモデルはcoreに取り込まれており、現在バンドル済み/ネイティブPluginで使われていますが、外部Plugin互換性には「エクスポートされているので固定済みである」よりも厳密な基準が必要です。

| Pluginの状況                                  | ガイダンス                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部Plugin                         | hookベースの統合を動作させ続けます。これが互換性のベースラインです。                        |
| 新しいバンドル済み/ネイティブPlugin                        | ベンダー固有の内部参照や新しいhook専用設計よりも、明示的なcapability登録を優先します。 |
| capability登録を採用する外部Plugin | 許可されていますが、ドキュメントでstableと明記されていない限り、capability固有のヘルパーサーフェスは進化中として扱ってください。 |

capability登録が目指す方向です。移行期間中、レガシーhooksは外部Pluginにとって最も破壊のない安全な経路であり続けます。エクスポートされたヘルパーサブパスはすべて同等ではありません。偶発的なヘルパーエクスポートよりも、狭く文書化されたcontractを優先してください。

### Pluginの形態

OpenClawは、読み込まれた各Pluginを、静的メタデータだけでなく実際の登録動作に基づいて形態に分類します。

<AccordionGroup>
  <Accordion title="plain-capability">
    ちょうど1つのcapabilityタイプを登録します（例: `mistral`のようなプロバイダー専用Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    複数のcapabilityタイプを登録します（例: `openai`はテキスト推論、音声、メディア理解、画像生成を所有します）。
  </Accordion>
  <Accordion title="hook-only">
    hooks（型付きまたはカスタム）のみを登録し、capability、ツール、コマンド、サービスは登録しません。
  </Accordion>
  <Accordion title="non-capability">
    ツール、コマンド、サービス、またはルートを登録しますが、capabilityは登録しません。
  </Accordion>
</AccordionGroup>

Pluginの形態とcapabilityの内訳を確認するには、`openclaw plugins inspect <id>`を使います。詳細は[CLIリファレンス](/ja-JP/cli/plugins#inspect)を参照してください。

### レガシーhooks

`before_agent_start` hookは、hook専用Pluginの互換性経路として引き続きサポートされます。実際のレガシーPluginは今もこれに依存しています。

方向性:

- 動作を維持する
- レガシーとして文書化する
- モデル/プロバイダーのオーバーライド作業には`before_model_resolve`を優先する
- プロンプト変更作業には`before_prompt_build`を優先する
- 実際の利用が減少し、fixtureカバレッジで移行の安全性が証明された後にのみ削除する

### 互換性シグナル

`openclaw doctor`または`openclaw plugins inspect <id>`を実行すると、次のいずれかのラベルが表示される場合があります。

| シグナル                     | 意味                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | configは正常に解析され、Pluginは解決されます                       |
| **compatibility advisory** | Pluginがサポート済みだが古いパターン（例: `hook-only`）を使用しています |
| **legacy warning**         | Pluginが非推奨の`before_agent_start`を使用しています        |
| **hard error**             | configが無効、またはPluginの読み込みに失敗しました                   |

`hook-only`も`before_agent_start`も、現在のPluginを壊すことはありません。`hook-only`はadvisoryであり、`before_agent_start`はwarningを発生させるだけです。これらのシグナルは`openclaw status --all`と`openclaw plugins doctor`にも表示されます。

## アーキテクチャ概要

OpenClawのPluginシステムには4つのレイヤーがあります。

<Steps>
  <Step title="Manifest + discovery">
    OpenClawは、設定済みパス、ワークスペースroot、グローバルPlugin root、バンドル済みPluginから候補Pluginを見つけます。検出では、ネイティブの`openclaw.plugin.json`マニフェストと、サポートされるバンドルマニフェストを最初に読み取ります。
  </Step>
  <Step title="Enablement + validation">
    coreは、検出されたPluginを有効、無効、ブロック済み、またはmemoryのような排他slotに選択済みのどれにするかを決定します。
  </Step>
  <Step title="Runtime loading">
    ネイティブOpenClaw Pluginはin-processで読み込まれ、capabilityを中央registryに登録します。パッケージ化されたJavaScriptはネイティブ`require`経由で読み込まれます。サードパーティのローカルソースTypeScriptは緊急時のJiti fallbackです。互換バンドルは、runtime codeをimportせずにregistry recordsへ正規化されます。
  </Step>
  <Step title="Surface consumption">
    OpenClawの残りの部分はregistryを読み取り、ツール、チャネル、プロバイダーセットアップ、hooks、HTTP routes、CLI commands、サービスを公開します。
  </Step>
</Steps>

特にPlugin CLIでは、root command検出は2つのフェーズに分かれます。

- parse時メタデータは`registerCli(..., { descriptors: [...] })`から取得されます
- 実際のPlugin CLI moduleはlazyのままにしておき、最初の呼び出し時に登録できます

これにより、Plugin所有のCLI codeをPlugin内に保ちながら、OpenClawがparse前にroot command名を予約できます。

重要な設計境界:

- manifest/config validationは、Plugin codeを実行せずに**manifest/schema metadata**から動作する必要があります
- ネイティブcapability検出は、信頼済みPlugin entry codeを読み込み、非アクティブ化registry snapshotを構築する場合があります
- ネイティブruntime behaviorは、`api.registrationMode === "full"`を伴うPlugin moduleの`register(api)` pathから来ます

この分離により、OpenClawはfull runtimeがアクティブになる前に、configを検証し、不足/無効なPluginを説明し、UI/schema hintsを構築できます。

### Pluginメタデータsnapshotとlookup table

Gateway startupは、現在のconfig snapshot用に1つの`PluginMetadataSnapshot`を構築します。このsnapshotはmetadata-onlyです。インストール済みPlugin index、manifest registry、manifest diagnostics、owner maps、Plugin id normalizer、manifest recordsを保存します。読み込まれたPlugin modules、provider SDKs、package contents、runtime exportsは保持しません。

Plugin対応config validation、startup auto-enable、Gateway Plugin bootstrapは、manifest/index metadataを個別に再構築する代わりに、そのsnapshotを消費します。`PluginLookUpTable`は同じsnapshotから派生し、現在のruntime configに対するstartup Plugin planを追加します。

startup後、Gatewayは現在のmetadata snapshotを置換可能なruntime productとして保持します。繰り返されるruntime provider discoveryは、provider-catalog passごとにインストール済みindexとmanifest registryを再構築する代わりに、そのsnapshotを借用できます。Gateway shutdown、config/Plugin inventory changes、installed index writesでsnapshotはクリアまたは置換されます。互換性のある現在のsnapshotが存在しない場合、呼び出し側はcold manifest/index pathにfallbackします。互換性チェックには、`plugins.load.paths`やdefault agent workspaceなどのPlugin discovery rootsを含める必要があります。workspace Pluginはmetadata scopeの一部だからです。

snapshotとlookup tableは、繰り返されるstartup decisionsをfast pathに保ちます。

- チャネル所有権
- deferred channel startup
- startup Plugin ids
- providerとCLI backendの所有権
- setup provider、command alias、model catalog provider、manifest contractの所有権
- Plugin config schemaとchannel config schema validation
- startup auto-enable decisions

安全境界はsnapshotの置換であり、mutationではありません。config、Plugin inventory、install records、またはpersisted index policyが変わったときはsnapshotを再構築してください。これを広範なmutable global registryとして扱わず、無制限のhistorical snapshotsを保持しないでください。runtime plugin loadingはmetadata snapshotsから分離されたままなので、古いruntime stateがmetadata cacheの背後に隠れることはありません。

cache ruleは[Plugin architecture internals](/ja-JP/plugins/architecture-internals#plugin-cache-boundary)に文書化されています。manifestとdiscovery metadataは、呼び出し側が現在のflow用の明示的なsnapshot、lookup table、またはmanifest registryを保持していない限りfreshです。hidden metadata cachesとwall-clock TTLsはPlugin loadingの一部ではありません。codeまたはinstalled artifactsが実際に読み込まれた後に永続化してよいのは、runtime loader、module、dependency-artifact cachesのみです。

一部のcold-path callersは、Gateway `PluginLookUpTable`を受け取る代わりに、persisted installed plugin indexからmanifest registriesを直接再構築しています。そのpathは現在、必要に応じてregistryを再構築します。呼び出し側がすでにlookup tableまたは明示的なmanifest registryを持っている場合は、runtime flowsを通じて現在のlookup tableまたは明示的なmanifest registryを渡すことを優先してください。

### Activation planning

Activation planningはcontrol planeの一部です。呼び出し側は、より広範なruntime registriesを読み込む前に、具体的なcommand、provider、channel、route、agent harness、またはcapabilityに関連するPluginを問い合わせることができます。

plannerは現在のmanifest behaviorとの互換性を保ちます。

- `activation.*` fieldsは明示的なplanner hintsです
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, hooksはmanifest ownership fallbackのままです
- ids-only planner APIは既存の呼び出し側向けに引き続き利用可能です
- plan APIはreason labelsを報告するため、diagnosticsは明示的なhintsとownership fallbackを区別できます

<Warning>
`activation` をライフサイクルフックや `register(...)` の置き換えとして扱わないでください。これは読み込み対象を絞り込むために使われるメタデータです。関係性をすでに表している場合は所有権フィールドを優先し、`activation` は追加のプランナーヒントにのみ使用してください。
</Warning>

### チャネル Plugin と共有メッセージツール

チャネル Plugin は、通常のチャットアクションのために個別の送信/編集/リアクションツールを登録する必要はありません。OpenClaw はコア内に共有の `message` ツールを 1 つ保持し、チャネル Plugin はその背後にあるチャネル固有の検出と実行を所有します。

現在の境界は次のとおりです。

- コアは共有 `message` ツールホスト、プロンプト配線、セッション/スレッドの記録管理、実行ディスパッチを所有する
- チャネル Plugin はスコープ付きアクション検出、機能検出、チャネル固有のスキーマ断片を所有する
- チャネル Plugin は、会話 ID がスレッド ID をどのようにエンコードするか、親会話からどのように継承するかなど、プロバイダー固有のセッション会話文法を所有する
- チャネル Plugin は、自身のアクションアダプターを通じて最終アクションを実行する

チャネル Plugin の場合、SDK サーフェスは `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統合された検出呼び出しにより、Plugin は表示対象のアクション、機能、スキーマの提供内容をまとめて返せるため、それらの要素が乖離しません。

チャネル固有のメッセージツールパラメーターがローカルパスやリモートメディア URL などのメディアソースを持つ場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返すべきです。コアはその明示的な一覧を使って、Plugin が所有するパラメーター名をハードコードすることなく、サンドボックスパス正規化と送信メディアアクセスヒントを適用します。そこではチャネル全体のフラットな一覧ではなく、アクションごとのマップを優先してください。そうすれば、プロフィール専用のメディアパラメーターが `send` のような無関係なアクションで正規化されません。

コアは、その検出ステップにランタイムスコープを渡します。重要なフィールドは次のとおりです。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済みの受信 `requesterSenderId`

これはコンテキスト依存の Plugin にとって重要です。チャネルは、コアの `message` ツールにチャネル固有の分岐をハードコードすることなく、アクティブなアカウント、現在のルーム/スレッド/メッセージ、信頼済みの要求者 ID に基づいてメッセージアクションを非表示または表示できます。

このため、埋め込みランナーのルーティング変更は今でも Plugin 側の作業です。ランナーは、現在のチャット/セッション ID を Plugin の検出境界へ転送し、共有 `message` ツールが現在のターンに適したチャネル所有のサーフェスを公開するようにする責任があります。

チャネル所有の実行ヘルパーについては、バンドル Plugin は実行ランタイムを自身の拡張モジュール内に保持するべきです。コアは `src/agents/tools` 配下の Discord、Slack、Telegram、WhatsApp メッセージアクションランタイムを所有しなくなりました。個別の `plugin-sdk/*-action-runtime` サブパスは公開せず、バンドル Plugin は自身の拡張所有モジュールからローカルランタイムコードを直接インポートするべきです。

同じ境界は、一般にプロバイダー名付きの SDK 境界にも適用されます。コアは Slack、Discord、Signal、WhatsApp、または類似の拡張向けのチャネル固有の便利なバレルをインポートするべきではありません。コアがある振る舞いを必要とする場合は、バンドル Plugin 自身の `api.ts` / `runtime-api.ts` バレルを利用するか、その必要性を共有 SDK 内の狭い汎用機能へ昇格させてください。

バンドル Plugin も同じルールに従います。バンドル Plugin の `runtime-api.ts` は、自身のブランド付き `openclaw/plugin-sdk/<plugin-id>` ファサードを再エクスポートするべきではありません。これらのブランド付きファサードは外部 Plugin や古い利用者向けの互換シムとして残りますが、バンドル Plugin はローカルエクスポートに加え、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/webhook-ingress` などの狭い汎用 SDK サブパスを使うべきです。既存の外部エコシステムの互換境界が必要としない限り、新しいコードで Plugin ID 固有の SDK ファサードを追加するべきではありません。

投票については、特に 2 つの実行パスがあります。

- `outbound.sendPoll` は、共通の投票モデルに合うチャネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャネル固有の投票セマンティクスや追加の投票パラメーターに推奨されるパスです

コアは現在、Plugin の投票ディスパッチがアクションを辞退するまで共有投票解析を遅延するため、Plugin 所有の投票ハンドラーは汎用投票パーサーに先にブロックされることなく、チャネル固有の投票フィールドを受け入れられます。

完全な起動シーケンスについては、[Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)を参照してください。

## 機能所有モデル

OpenClaw はネイティブ Plugin を、無関係な連携の寄せ集めではなく、**会社**または**機能**の所有境界として扱います。

つまり、次のようになります。

- 会社 Plugin は通常、その会社の OpenClaw 向けサーフェスをすべて所有するべきです
- 機能 Plugin は通常、自身が導入する機能サーフェス全体を所有するべきです
- チャネルはプロバイダーの振る舞いをアドホックに再実装するのではなく、共有コア機能を利用するべきです

<AccordionGroup>
  <Accordion title="ベンダーの複数機能">
    `openai` はテキスト推論、音声、リアルタイム音声、メディア理解、画像生成を所有します。`google` はテキスト推論に加えて、メディア理解、画像生成、ウェブ検索を所有します。`qwen` はテキスト推論に加えて、メディア理解と動画生成を所有します。
  </Accordion>
  <Accordion title="ベンダーの単一機能">
    `elevenlabs` と `microsoft` は音声を所有し、`firecrawl` はウェブ取得を所有し、`minimax` / `mistral` / `moonshot` / `zai` はメディア理解バックエンドを所有します。
  </Accordion>
  <Accordion title="機能 Plugin">
    `voice-call` は通話トランスポート、ツール、CLI、ルート、Twilio メディアストリームブリッジを所有しますが、ベンダー Plugin を直接インポートするのではなく、共有の音声、リアルタイム文字起こし、リアルタイム音声機能を利用します。
  </Accordion>
</AccordionGroup>

意図する最終状態は次のとおりです。

- OpenAI は、テキストモデル、音声、画像、将来の動画にまたがる場合でも、1 つの Plugin 内に存在する
- 別のベンダーも、自身のサーフェス領域に対して同じことができる
- チャネルは、どのベンダー Plugin がプロバイダーを所有しているかを気にせず、コアが公開する共有機能契約を利用する

重要な区別は次のとおりです。

- **Plugin** = 所有境界
- **機能** = 複数の Plugin が実装または利用できるコア契約

そのため、OpenClaw が動画のような新しいドメインを追加する場合、最初の問いは「どのプロバイダーが動画処理をハードコードするべきか」ではありません。最初の問いは「コアの動画機能契約は何か」です。その契約が存在すれば、ベンダー Plugin はそれに対して登録でき、チャネル/機能 Plugin はそれを利用できます。

機能がまだ存在しない場合、通常の正しい進め方は次のとおりです。

<Steps>
  <Step title="機能を定義する">
    不足している機能をコアに定義します。
  </Step>
  <Step title="SDK を通じて公開する">
    型付けされた方法で Plugin API/ランタイムを通じて公開します。
  </Step>
  <Step title="利用側を配線する">
    チャネル/機能をその機能に対して配線します。
  </Step>
  <Step title="ベンダー実装">
    ベンダー Plugin が実装を登録できるようにします。
  </Step>
</Steps>

これにより、所有権を明示しながら、単一ベンダーや一度きりの Plugin 固有コードパスに依存するコアの振る舞いを避けられます。

### 機能レイヤリング

コードの配置場所を判断するときは、このメンタルモデルを使ってください。

<Tabs>
  <Tab title="コア機能レイヤー">
    共有オーケストレーション、ポリシー、フォールバック、設定マージルール、配信セマンティクス、型付き契約。
  </Tab>
  <Tab title="ベンダー Plugin レイヤー">
    ベンダー固有 API、認証、モデルカタログ、音声合成、画像生成、将来の動画バックエンド、使用量エンドポイント。
  </Tab>
  <Tab title="チャネル/機能 Plugin レイヤー">
    コア機能を利用し、それをサーフェス上に提示する Slack/Discord/voice-call などの連携。
  </Tab>
</Tabs>

たとえば、TTS はこの形に従います。

- コアは返信時 TTS ポリシー、フォールバック順序、設定、チャネル配信を所有する
- `openai`、`elevenlabs`、`microsoft` は合成実装を所有する
- `voice-call` は電話向け TTS ランタイムヘルパーを利用する

将来の機能でも、同じパターンを優先するべきです。

### 複数機能を持つ会社 Plugin の例

会社 Plugin は、外側から見て一体感があるべきです。OpenClaw にモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、ウェブ取得、ウェブ検索の共有契約がある場合、ベンダーは自身のサーフェスをすべて 1 か所で所有できます。

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

重要なのは、正確なヘルパー名ではありません。形が重要です。

- 1 つの Plugin がベンダーサーフェスを所有する
- コアは引き続き機能契約を所有する
- チャネルと機能 Plugin はベンダーコードではなく `api.runtime.*` ヘルパーを利用する
- 契約テストは、Plugin が所有すると主張する機能を登録したことをアサートできる

### 機能の例: 動画理解

OpenClaw はすでに、画像/音声/動画理解を 1 つの共有機能として扱っています。同じ所有モデルがそこにも適用されます。

<Steps>
  <Step title="コアが契約を定義する">
    コアがメディア理解契約を定義します。
  </Step>
  <Step title="ベンダー Plugin が登録する">
    ベンダー Plugin は、該当する場合に `describeImage`、`transcribeAudio`、`describeVideo` を登録します。
  </Step>
  <Step title="利用側が共有の振る舞いを使う">
    チャネルと機能 Plugin は、ベンダーコードへ直接配線するのではなく、共有コアの振る舞いを利用します。
  </Step>
</Steps>

これにより、ある 1 つのプロバイダーの動画に関する前提をコアに焼き込むことを避けられます。Plugin はベンダーサーフェスを所有し、コアは機能契約とフォールバックの振る舞いを所有します。

動画生成もすでに同じシーケンスを使っています。コアは型付き機能契約とランタイムヘルパーを所有し、ベンダー Plugin はそれに対して `api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的なロールアウトチェックリストが必要ですか。[機能クックブック](/ja-JP/plugins/architecture)を参照してください。

## 契約と強制

Plugin API サーフェスは、意図的に `OpenClawPluginApi` に型付けされ集約されています。この契約は、サポートされる登録ポイントと、Plugin が依存できるランタイムヘルパーを定義します。

これが重要な理由は次のとおりです。

- Plugin 作者は安定した内部標準を 1 つ得られる
- コアは、2 つの Plugin が同じプロバイダー ID を登録するような重複所有を拒否できる
- 起動時に不正な登録に対する実行可能な診断を提示できる
- 契約テストでバンドル Plugin の所有権を強制し、静かな乖離を防げる

強制には 2 つのレイヤーがあります。

<AccordionGroup>
  <Accordion title="ランタイム登録の強制">
    Plugin レジストリは、Plugin の読み込み時に登録を検証します。例: 重複したプロバイダー ID、重複した音声プロバイダー ID、不正な登録は、未定義の動作ではなく Plugin 診断を生成します。
  </Accordion>
  <Accordion title="契約テスト">
    同梱 Plugin はテスト実行中に契約レジストリへ取り込まれるため、OpenClaw は所有権を明示的に検証できます。現在これは、モデルプロバイダー、音声プロバイダー、Web 検索プロバイダー、同梱登録の所有権に使用されています。
  </Accordion>
</AccordionGroup>

実用上の効果として、OpenClaw はどの Plugin がどのサーフェスを所有するかを事前に把握できます。これにより、所有権が暗黙ではなく、宣言され、型付けされ、テスト可能になるため、コアとチャネルをシームレスに構成できます。

### 契約に含めるべきもの

<Tabs>
  <Tab title="良い契約">
    - 型付けされている
    - 小さい
    - 機能固有
    - コアが所有する
    - 複数の Plugin で再利用可能
    - ベンダー知識なしでチャネル/機能から利用可能

  </Tab>
  <Tab title="悪い契約">
    - コアに隠されたベンダー固有のポリシー
    - レジストリを迂回する単発の Plugin エスケープハッチ
    - チャネルコードがベンダー実装に直接到達する
    - `OpenClawPluginApi` または `api.runtime` の一部ではない、その場限りのランタイムオブジェクト

  </Tab>
</Tabs>

迷った場合は、抽象度を上げます。まず機能を定義し、その後で Plugin がそこに接続できるようにします。

## 実行モデル

ネイティブ OpenClaw Plugin は Gateway と**同一プロセス内**で実行されます。サンドボックス化されません。読み込まれたネイティブ Plugin は、コアコードと同じプロセスレベルの信頼境界を持ちます。

<Warning>
ネイティブ Plugin の影響: Plugin はツール、ネットワークハンドラー、フック、サービスを登録できます。Plugin のバグは Gateway をクラッシュさせたり不安定化させたりする可能性があります。また、悪意のあるネイティブ Plugin は、OpenClaw プロセス内での任意コード実行と同等です。
</Warning>

互換バンドルは、OpenClaw が現在それらをメタデータ/コンテンツパックとして扱うため、デフォルトでより安全です。現在のリリースでは、これは主に同梱 Skills を意味します。

同梱されていない Plugin には、許可リストと明示的なインストール/読み込みパスを使用します。ワークスペース Plugin は本番環境のデフォルトではなく、開発時のコードとして扱います。

同梱ワークスペースパッケージ名では、Plugin ID を npm 名に固定します。デフォルトでは `@openclaw/<id>`、またはパッケージが意図的により狭い Plugin ロールを公開する場合は、`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` などの承認済みの型付きサフィックスを使用します。

<Note>
**信頼に関する注記:** `plugins.allow` が信頼するのは**Plugin ID**であり、ソースの由来ではありません。同梱 Plugin と同じ ID を持つワークスペース Plugin は、そのワークスペース Plugin が有効化/許可リスト化されている場合、意図的に同梱コピーをシャドーします。これはローカル開発、パッチテスト、ホットフィックスにおいて通常かつ有用です。同梱 Plugin の信頼は、インストールメタデータではなく、読み込み時点でディスク上にあるマニフェストとコードというソーススナップショットから解決されます。破損または置換されたインストール記録が、実際のソースが主張する範囲を超えて、同梱 Plugin の信頼サーフェスを密かに広げることはできません。
</Note>

## エクスポート境界

OpenClaw がエクスポートするのは機能であり、実装上の利便性ではありません。

機能登録は公開したままにします。契約ではないヘルパーエクスポートは削減します。

- 同梱 Plugin 固有のヘルパーサブパス
- 公開 API として意図されていないランタイム配管サブパス
- ベンダー固有の利便性ヘルパー
- 実装詳細であるセットアップ/オンボーディングヘルパー

予約済みの同梱 Plugin ヘルパーサブパスは、生成された SDK エクスポートマップから廃止されています。所有者固有のヘルパーは所有元の Plugin パッケージ内に保持します。再利用可能なホスト動作のみを、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK 契約へ昇格します。

## 内部構造とリファレンス

読み込みパイプライン、レジストリモデル、プロバイダーランタイムフック、Gateway HTTP ルート、メッセージツールスキーマ、チャネルターゲット解決、プロバイダーカタログ、コンテキストエンジン Plugin、新しい機能を追加するためのガイドについては、[Plugin アーキテクチャの内部構造](/ja-JP/plugins/architecture-internals)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
