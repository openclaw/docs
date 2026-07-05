---
read_when:
    - ネイティブ OpenClaw Plugin の構築またはデバッグ
    - Plugin ケイパビリティモデルまたは所有権境界の理解
    - Plugin ロードパイプラインまたはレジストリで作業する
    - プロバイダーランタイムフックまたはチャンネルPluginの実装
sidebarTitle: Internals
summary: 'Plugin の内部: 機能モデル、所有権、契約、読み込みパイプライン、ランタイムヘルパー'
title: Plugin 内部
x-i18n:
    generated_at: "2026-07-05T11:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

これは OpenClaw Pluginシステムの**詳細アーキテクチャリファレンス**です。実践的なガイドは、以下の特化ページのいずれかから始めてください。

<CardGroup cols={2}>
  <Card title="Pluginのインストールと使用" icon="plug" href="/ja-JP/tools/plugin">
    Pluginの追加、有効化、トラブルシューティングのためのエンドユーザー向けガイド。
  </Card>
  <Card title="Pluginの構築" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小の動作するマニフェストを使った、初めてのPluginチュートリアル。
  </Card>
  <Card title="チャネルPlugin" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネルPluginを構築します。
  </Card>
  <Card title="プロバイダーPlugin" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダーPluginを構築します。
  </Card>
  <Card title="SDK概要" icon="book" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録APIのリファレンス。
  </Card>
</CardGroup>

## 公開ケイパビリティモデル

ケイパビリティは、OpenClaw内の公開**ネイティブPlugin**モデルです。すべてのネイティブOpenClaw Pluginは、1つ以上のケイパビリティ型に対して登録します。

| ケイパビリティ       | 登録メソッド                                     | Plugin例                       |
| ---------------------- | ------------------------------------------------ | ------------------------------ |
| テキスト推論         | `api.registerProvider(...)`                      | `anthropic`, `openai`          |
| CLI推論バックエンド  | `api.registerCliBackend(...)`                    | `anthropic`, `openai`          |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | プロバイダー所有のベクターPlugin |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`      |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| リアルタイム音声     | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`             |
| メディア理解         | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`             |
| トランスクリプトソース | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| 画像生成             | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`      |
| 音楽生成             | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`     |
| 動画生成             | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`        |
| Web取得              | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| Web検索              | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google` |
| チャネル / メッセージング | `api.registerChannel(...)`                       | `matrix`, `msteams`            |
| Gateway検出          | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
ケイパビリティを1つも登録しないものの、フック、ツール、検出サービス、またはバックグラウンドサービスを提供するPluginは、**レガシーのフック専用**Pluginです。このパターンは現在も完全にサポートされています。
</Note>

### 外部互換性の方針

ケイパビリティモデルはcoreに導入済みで、現在はバンドル済み/ネイティブPluginで使われていますが、外部Pluginの互換性には「エクスポートされているので固定されている」よりも厳密な基準がまだ必要です。

| Pluginの状況                                  | ガイダンス                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部Plugin                         | フックベースの連携を動作させ続けます。これが互換性のベースラインです。                        |
| 新しいバンドル済み/ネイティブPlugin                        | ベンダー固有の内部参照や新しいフック専用設計よりも、明示的なケイパビリティ登録を優先します。 |
| ケイパビリティ登録を採用する外部Plugin | 許可されていますが、ケイパビリティ固有のヘルパーサーフェスは、ドキュメントで安定と示されていない限り進化中として扱ってください。 |

ケイパビリティ登録は意図された方向性です。移行期間中、外部Pluginにとってレガシーフックは破壊的変更を避ける最も安全な経路のままです。エクスポートされたヘルパーサブパスはすべて同等ではありません。偶発的なヘルパーエクスポートよりも、狭く文書化された契約を優先してください。

### Pluginの形状

OpenClawは、読み込まれた各Pluginを、その実際の登録動作（静的メタデータだけではなく）に基づいて形状に分類します。

<AccordionGroup>
  <Accordion title="plain-capability">
    ちょうど1つのケイパビリティ型を登録します（たとえば `arcee` や `chutes` のようなプロバイダー専用Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    複数のケイパビリティ型を登録します（たとえば `openai` はテキスト推論、音声、メディア理解、画像生成を所有します）。
  </Accordion>
  <Accordion title="hook-only">
    フック（型付きまたはカスタム）のみを登録し、ケイパビリティ、ツール、コマンド、サービスは登録しません。
  </Accordion>
  <Accordion title="non-capability">
    ツール、コマンド、サービス、またはルートを登録しますが、ケイパビリティは登録しません。
  </Accordion>
</AccordionGroup>

Pluginの形状とケイパビリティの内訳を確認するには、`openclaw plugins inspect <id>` を使用します。詳細は [CLIリファレンス](/ja-JP/cli/plugins#inspect) を参照してください。

### レガシーフック

`before_agent_start` フックは、フック専用Pluginの互換性経路として引き続きサポートされています。実世界のレガシーPluginは現在もこれに依存しています。

方向性:

- 動作を維持する
- レガシーとして文書化する
- モデル/プロバイダーの上書きには `before_model_resolve` を優先する
- プロンプト変更には `before_prompt_build` を優先する
- 実際の使用が減り、フィクスチャのカバレッジで移行安全性が証明された後にのみ削除する

### 互換性シグナル

`openclaw doctor`、`openclaw plugins inspect <id>`、`openclaw status --all`、`openclaw plugins doctor` は、これらの互換性通知を表示します。

| シグナル                                     | 意味                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **config valid**                           | Configの解析に問題がなく、Pluginが解決されます                                                                        |
| **hook-only** (info)                       | Pluginはフックのみを登録します。サポートされている経路ですが、まだケイパビリティ登録には移行されていません                |
| **legacy `before_agent_start`** (warn)     | Pluginは `before_model_resolve`/`before_prompt_build` ではなく、非推奨の `before_agent_start` フックを使っています  |
| **deprecated memory-embedding API** (warn) | バンドルされていないPluginが、`registerEmbeddingProvider` ではなく古いメモリ固有のembedding provider APIを使っています |
| **hard error**                             | Configが無効、またはPluginの読み込みに失敗しました                                                                    |

現在、助言/警告シグナルはいずれもPluginを壊しません。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClawのPluginシステムには4つのレイヤーがあります。

<Steps>
  <Step title="マニフェスト + 検出">
    OpenClawは、設定済みパス、ワークスペースルート、グローバルPluginルート、バンドル済みPluginから候補Pluginを見つけます。検出では、ネイティブの `openclaw.plugin.json` マニフェストに加え、サポート対象のバンドルマニフェストを最初に読みます。
  </Step>
  <Step title="有効化 + 検証">
    coreは、検出されたPluginを有効、無効、ブロック、またはメモリのような排他的スロットに選択するかを決定します。
  </Step>
  <Step title="ランタイム読み込み">
    ネイティブOpenClaw Pluginはプロセス内で読み込まれ、ケイパビリティを中央レジストリに登録します。パッケージ化されたJavaScriptはネイティブの `require` を通じて読み込まれます。サードパーティのローカルソースTypeScriptは緊急時のJitiフォールバックです。互換性のあるバンドルは、ランタイムコードをインポートせずにレジストリレコードへ正規化されます。
  </Step>
  <Step title="サーフェス消費">
    OpenClawの残りの部分はレジストリを読み取り、ツール、チャネル、プロバイダーセットアップ、フック、HTTPルート、CLIコマンド、サービスを公開します。
  </Step>
</Steps>

Plugin CLIに限ると、ルートコマンド検出は2つのフェーズに分かれています。

- 解析時メタデータは `registerCli(..., { descriptors: [...] })` から取得されます
- 実際のPlugin CLIモジュールは遅延のままにでき、最初の呼び出し時に登録できます

これにより、Plugin所有のCLIコードをPlugin内に保持しつつ、OpenClawが解析前にルートコマンド名を予約できます。

重要な設計境界:

- マニフェスト/config検証は、Pluginコードを実行せずに**マニフェスト/スキーマメタデータ**から動作するべきです
- ネイティブケイパビリティ検出では、非アクティブ化レジストリスナップショットを構築するために、信頼済みPluginのエントリコードを読み込む場合があります
- ネイティブランタイム動作は、`api.registrationMode === "full"` のPluginモジュールの `register(api)` パスから来ます

この分割により、OpenClawはフルランタイムがアクティブになる前に、configを検証し、不足/無効なPluginを説明し、UI/スキーマのヒントを構築できます。

### Pluginメタデータスナップショットとルックアップテーブル

Gateway起動時には、現在のconfigスナップショット用に1つの `PluginMetadataSnapshot` が構築されます。このスナップショットはメタデータ専用です。インストール済みPluginインデックス、マニフェストレジストリ、マニフェスト診断、所有者マップ、Plugin ID正規化器、マニフェストレコードを保存します。読み込まれたPluginモジュール、プロバイダーSDK、パッケージ内容、ランタイムエクスポートは保持しません。

Plugin対応のconfig検証、起動時自動有効化、Gateway Pluginブートストラップは、マニフェスト/インデックスメタデータを個別に再構築する代わりに、そのスナップショットを消費します。`PluginLookUpTable` は同じスナップショットから派生し、現在のランタイムconfig用の起動Plugin計画を追加します。

起動後、Gatewayは現在のメタデータスナップショットを置換可能なランタイム成果物として保持します。繰り返し実行されるランタイムプロバイダー検出は、プロバイダーカタログの各パスごとにインストール済みインデックスとマニフェストレジストリを再構築する代わりに、そのスナップショットを借用できます。スナップショットは、Gatewayシャットダウン、config/Pluginインベントリの変更、インストール済みインデックスの書き込み時にクリアまたは置換されます。互換性のある現在のスナップショットが存在しない場合、呼び出し元はコールドなマニフェスト/インデックスパスへフォールバックします。互換性チェックには、`plugins.load.paths` やデフォルトエージェントワークスペースなどのPlugin検出ルートを含める必要があります。ワークスペースPluginはメタデータスコープの一部だからです。

スナップショットとルックアップテーブルは、繰り返される起動判断を高速パスに保ちます。

- チャネル所有権
- 遅延チャネル起動
- 起動Plugin ID
- プロバイダーとCLIバックエンドの所有権
- セットアッププロバイダー、コマンドエイリアス、モデルカタログプロバイダー、マニフェスト契約の所有権
- Plugin configスキーマとチャネルconfigスキーマの検証
- 起動時自動有効化の判断

安全境界はミューテーションではなく、スナップショットの置換です。config、Pluginインベントリ、インストールレコード、または永続化されたインデックスポリシーが変更されたら、スナップショットを再構築してください。これを広範なミュータブルグローバルレジストリとして扱わず、無制限の履歴スナップショットも保持しないでください。ランタイムPlugin読み込みはメタデータスナップショットとは分離されたままなので、古いランタイム状態がメタデータキャッシュの背後に隠れることはありません。

キャッシュ規則は [Pluginアーキテクチャ内部](/ja-JP/plugins/architecture-internals#plugin-cache-boundary) に文書化されています。マニフェストと検出メタデータは、呼び出し元が現在のフロー用の明示的なスナップショット、ルックアップテーブル、またはマニフェストレジストリを保持していない限り、常に新鮮です。隠れたメタデータキャッシュや壁時計TTLはPlugin読み込みの一部ではありません。コードまたはインストール済み成果物が実際に読み込まれた後に永続化できるのは、ランタイムローダー、モジュール、依存関係成果物のキャッシュのみです。

一部のコールドパス呼び出し元は、Gatewayの `PluginLookUpTable` を受け取る代わりに、永続化されたインストール済みPluginインデックスからマニフェストレジストリを直接再構築しています。そのパスは現在、必要に応じてレジストリを再構築します。呼び出し元がすでに現在のルックアップテーブルまたは明示的なマニフェストレジストリを持っている場合は、それをランタイムフローに渡すことを優先してください。

### アクティベーション計画

アクティベーション計画は制御プレーンの一部です。呼び出し元は、より広いランタイムレジストリを読み込む前に、具体的なコマンド、プロバイダー、チャンネル、ルート、エージェントハーネス、またはケイパビリティに関連する Plugin を問い合わせることができます。

プランナーは現在のマニフェスト動作との互換性を維持します。

- `activation.*` フィールドは明示的なプランナーヒントです
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、およびフックはマニフェスト所有権のフォールバックのままです
- 既存の呼び出し元向けに ids のみのプランナー API は引き続き利用できます
- plan API は理由ラベルを報告するため、診断で明示的なヒントと所有権フォールバックを区別できます

<Warning>
`activation` をライフサイクルフックや `register(...)` の置き換えとして扱わないでください。これは読み込みを絞り込むために使われるメタデータです。関係をすでに説明している場合は所有権フィールドを優先し、追加のプランナーヒントに限って `activation` を使用してください。
</Warning>

### チャンネル Plugin と共有メッセージツール

チャンネル Plugin は、通常のチャット操作のために個別の送信/編集/リアクションツールを登録する必要はありません。OpenClaw はコアに共有の `message` ツールを 1 つ保持し、チャンネル Plugin はその背後にあるチャンネル固有の検出と実行を所有します。

現在の境界は次のとおりです。

- コアは共有 `message` ツールのホスト、プロンプト配線、セッション/スレッドの帳簿管理、実行ディスパッチを所有します
- チャンネル Plugin はスコープ付きアクション検出、ケイパビリティ検出、およびチャンネル固有のスキーマ断片を所有します
- チャンネル Plugin は、会話 id がスレッド id をどのようにエンコードするか、または親会話からどのように継承するかなど、プロバイダー固有のセッション会話文法を所有します
- チャンネル Plugin は、アクションアダプターを通じて最終アクションを実行します

チャンネル Plugin 向けの SDK サーフェスは `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された検出呼び出しにより、Plugin は可視アクション、ケイパビリティ、スキーマへの寄与をまとめて返せるため、それらの要素が乖離しません。

チャンネル固有の message-tool パラメーターがローカルパスやリモートメディア URL などのメディアソースを保持する場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返す必要があります。コアはこの明示的なリストを使い、Plugin 所有のパラメーター名をハードコードせずにサンドボックスパス正規化とアウトバウンドメディアアクセスのヒントを適用します。そこではチャンネル全体のフラットなリストではなく、アクションごとのマップを優先してください。これにより、プロフィール専用のメディアパラメーターが `send` などの無関係なアクションで正規化されません。

コアはその検出ステップにランタイムスコープを渡します。重要なフィールドは次のとおりです。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済みインバウンド `requesterSenderId`

これはコンテキスト依存の Plugin にとって重要です。チャンネルは、コアの `message` ツールにチャンネル固有の分岐をハードコードせずに、アクティブなアカウント、現在のルーム/スレッド/メッセージ、または信頼済みリクエスター ID に基づいてメッセージアクションを隠したり公開したりできます。

そのため、埋め込みランナーのルーティング変更は引き続き Plugin 側の作業です。ランナーは、現在のチャット/セッション ID を Plugin 検出境界へ転送し、共有 `message` ツールが現在のターンに適したチャンネル所有サーフェスを公開する責任を持ちます。

チャンネル所有の実行ヘルパーについては、バンドル Plugin は実行ランタイムを自分自身の Plugin モジュール内に保持する必要があります。コアは `src/agents/tools` 配下の Discord、Slack、Telegram、WhatsApp message-action ランタイムを所有しなくなりました。個別の `plugin-sdk/*-action-runtime` サブパスは公開せず、バンドル Plugin は自分の Plugin 所有モジュールからローカルランタイムコードを直接インポートする必要があります。

同じ境界は、一般にプロバイダー名付き SDK シームにも適用されます。コアは Discord、Signal、Slack、WhatsApp、または類似の Plugin 向けのチャンネル固有の便利なバレルをインポートすべきではありません。コアがある動作を必要とする場合は、バンドル Plugin 自身の `api.ts` / `runtime-api.ts` バレルを利用するか、その必要性を共有 SDK の狭い汎用ケイパビリティへ昇格させてください。

バンドル Plugin も同じルールに従います。バンドル Plugin の `runtime-api.ts` は、自分自身のブランド付き `openclaw/plugin-sdk/<plugin-id>` ファサードを再エクスポートすべきではありません。これらのブランド付きファサードは外部 Plugin と古い利用者向けの互換シムのままですが、バンドル Plugin はローカルエクスポートに加えて、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/webhook-ingress` のような狭い汎用 SDK サブパスを使う必要があります。既存の外部エコシステムの互換境界が要求しない限り、新しいコードで Plugin id 固有の SDK ファサードを追加すべきではありません。

投票に限ると、実行パスは 2 つあります。

- `outbound.sendPoll` は、共通の投票モデルに適合するチャンネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャンネル固有の投票セマンティクスや追加の投票パラメーターに推奨されるパスです

コアは現在、Plugin の投票ディスパッチがアクションを辞退するまで共有投票解析を延期するため、Plugin 所有の投票ハンドラーは汎用投票パーサーに先にブロックされることなく、チャンネル固有の投票フィールドを受け入れられます。

完全な起動シーケンスについては、[Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)を参照してください。

## ケイパビリティ所有モデル

OpenClaw はネイティブ Plugin を、無関係な連携の寄せ集めではなく、**企業**または**機能**の所有境界として扱います。

つまり、次のようになります。

- 企業 Plugin は通常、その企業の OpenClaw 向けサーフェスをすべて所有するべきです
- 機能 Plugin は通常、それが導入する機能サーフェス全体を所有するべきです
- チャンネルは、プロバイダー動作を場当たり的に再実装するのではなく、共有コアケイパビリティを利用するべきです

<AccordionGroup>
  <Accordion title="ベンダーの複数ケイパビリティ">
    `google` はテキスト推論、CLI バックエンド、埋め込み、音声、リアルタイム音声、メディア理解、画像/音楽/動画生成、Web 検索を所有します。`openai` はテキスト推論、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像/動画生成を所有します。`minimax` はテキスト推論に加えて、メディア理解、音声、画像/音楽/動画生成、Web 検索を所有します。
  </Accordion>
  <Accordion title="ベンダーの単一ケイパビリティ">
    `arcee` と `chutes` はテキスト推論のみを所有し、`microsoft` は音声のみを所有します。ベンダー Plugin は、そのベンダーのサーフェスをさらに広く扱う必要が出るまで、この狭さのままでかまいません。
  </Accordion>
  <Accordion title="機能 Plugin">
    `voice-call` は通話トランスポート、ツール、CLI、ルート、Twilio メディアストリームブリッジを所有しますが、ベンダー Plugin を直接インポートするのではなく、共有の音声、リアルタイム文字起こし、リアルタイム音声ケイパビリティを利用します。
  </Accordion>
</AccordionGroup>

意図された最終状態は次のとおりです。

- ベンダーの OpenClaw 向けサーフェスは、テキストモデル、音声、画像、動画にまたがる場合でも 1 つの Plugin に存在します
- 他のベンダーも自分たちのサーフェス領域について同じことができます
- チャンネルは、どのベンダー Plugin がプロバイダーを所有しているかを気にしません。コアが公開する共有ケイパビリティ契約を利用します

重要な区別は次のとおりです。

- **Plugin** = 所有境界
- **ケイパビリティ** = 複数の Plugin が実装または利用できるコア契約

したがって OpenClaw が動画のような新しいドメインを追加する場合、最初の問いは「どのプロバイダーが動画処理をハードコードすべきか」ではありません。最初の問いは「コアの動画ケイパビリティ契約は何か」です。その契約が存在すれば、ベンダー Plugin はそれに登録でき、チャンネル/機能 Plugin はそれを利用できます。

ケイパビリティがまだ存在しない場合、通常の正しい進め方は次のとおりです。

<Steps>
  <Step title="ケイパビリティを定義する">
    不足しているケイパビリティをコアで定義します。
  </Step>
  <Step title="SDK を通じて公開する">
    Plugin API/ランタイムを通じて型付きで公開します。
  </Step>
  <Step title="利用側を配線する">
    チャンネル/機能をそのケイパビリティに接続します。
  </Step>
  <Step title="ベンダー実装">
    ベンダー Plugin に実装を登録させます。
  </Step>
</Steps>

これにより、単一ベンダーや一回限りの Plugin 固有コードパスに依存するコア動作を避けつつ、所有権を明示的に保てます。

### ケイパビリティのレイヤー化

コードの配置場所を決めるときは、次のメンタルモデルを使ってください。

<Tabs>
  <Tab title="コアケイパビリティレイヤー">
    共有オーケストレーション、ポリシー、フォールバック、設定マージルール、配信セマンティクス、型付き契約。
  </Tab>
  <Tab title="ベンダー Plugin レイヤー">
    ベンダー固有 API、認証、モデルカタログ、音声合成、画像生成、動画バックエンド、使用量エンドポイント。
  </Tab>
  <Tab title="チャンネル/機能 Plugin レイヤー">
    コアケイパビリティを利用し、それらをサーフェス上に提示する Discord/Slack/voice-call などの連携。
  </Tab>
</Tabs>

たとえば、TTS はこの形に従います。

- コアは返信時の TTS ポリシー、フォールバック順序、設定、チャンネル配信を所有します
- `elevenlabs`、`google`、`microsoft`、`openai` は合成実装を所有します
- `voice-call` は電話 TTS ランタイムヘルパーを利用します

将来のケイパビリティでも、同じパターンを優先するべきです。

### 複数ケイパビリティを持つ企業 Plugin の例

企業 Plugin は外側から見て一貫しているべきです。OpenClaw がモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web フェッチ、Web 検索の共有契約を持っている場合、ベンダーは自分のサーフェスをすべて 1 か所で所有できます。

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

重要なのは正確なヘルパー名ではありません。重要なのは形です。

- 1 つの Plugin がベンダーサーフェスを所有します
- コアは引き続きケイパビリティ契約を所有します
- チャンネルと機能 Plugin はベンダーコードではなく `api.runtime.*` ヘルパーを利用します
- 契約テストでは、Plugin が所有すると主張するケイパビリティを登録していることを表明できます

### ケイパビリティ例: 動画理解

OpenClaw はすでに画像/音声/動画理解を 1 つの共有ケイパビリティとして扱っています。そこにも同じ所有モデルが適用されます。

<Steps>
  <Step title="コアが契約を定義する">
    コアが media-understanding 契約を定義します。
  </Step>
  <Step title="ベンダー Plugin が登録する">
    ベンダー Plugin は該当する場合に `describeImage`、`transcribeAudio`、`describeVideo` を登録します。
  </Step>
  <Step title="利用側が共有動作を使う">
    チャンネルと機能 Plugin は、ベンダーコードへ直接配線するのではなく、共有コア動作を利用します。
  </Step>
</Steps>

これにより、1 つのプロバイダーの動画前提をコアへ焼き込むことを避けられます。Plugin はベンダーサーフェスを所有し、コアはケイパビリティ契約とフォールバック動作を所有します。

動画生成もすでに同じシーケンスを使っています。コアは型付きケイパビリティ契約とランタイムヘルパーを所有し、ベンダー Plugin はそれに対して `api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的なロールアウトチェックリストが必要ですか。[ケイパビリティ Cookbook](/ja-JP/plugins/adding-capabilities)を参照してください。

## 契約と適用

Plugin API サーフェスは、意図的に `OpenClawPluginApi` に型付けされ、一元化されています。この契約は、サポートされる登録ポイントと、Plugin が依存できるランタイムヘルパーを定義します。

これが重要な理由:

- Plugin 作者は、安定した内部標準を1つ得られる
- core は、2つの Plugin が同じ provider id を登録するような所有権の重複を拒否できる
- startup は、不正な形式の登録に対して実行可能な診断を表示できる
- 契約テストは、バンドル Plugin の所有権を強制し、気づかないドリフトを防げる

強制には2つのレイヤーがあります:

<AccordionGroup>
  <Accordion title="ランタイム登録の強制">
    Plugin レジストリは、Plugin のロード時に登録を検証します。例: provider id の重複、speech provider id の重複、不正な形式の登録は、未定義の動作ではなく Plugin 診断を生成します。
  </Accordion>
  <Accordion title="契約テスト">
    バンドル Plugin は、テスト実行中に契約レジストリへ捕捉されるため、OpenClaw は所有権を明示的にアサートできます。現在これは、モデル provider、speech provider、web search provider、バンドル登録の所有権に使用されています。
  </Accordion>
</AccordionGroup>

実際の効果として、OpenClaw は、どの Plugin がどのサーフェスを所有するかを事前に把握できます。これにより、所有権が暗黙ではなく、宣言され、型付けされ、テスト可能になるため、core と channel はシームレスに合成できます。

### 契約に含めるべきもの

<Tabs>
  <Tab title="良い契約">
    - 型付けされている
    - 小さい
    - capability 固有
    - core が所有している
    - 複数の Plugin で再利用できる
    - ベンダー知識なしで channel/feature が利用できる

  </Tab>
  <Tab title="悪い契約">
    - core に隠されたベンダー固有ポリシー
    - レジストリを迂回する一回限りの Plugin エスケープハッチ
    - channel コードがベンダー実装に直接到達している
    - `OpenClawPluginApi` または `api.runtime` の一部ではないアドホックなランタイムオブジェクト

  </Tab>
</Tabs>

迷った場合は、抽象度を上げます。まず capability を定義し、その後で Plugin がそこに接続できるようにします。

## 実行モデル

ネイティブ OpenClaw Plugin は Gateway と同じプロセス内で実行されます。サンドボックス化されません。ロードされたネイティブ Plugin は、core コードと同じプロセスレベルの信頼境界を持ちます。

<Warning>
ネイティブ Plugin の影響: Plugin は tools、ネットワークハンドラー、フック、サービスを登録できます。Plugin のバグは Gateway をクラッシュさせたり不安定にしたりする可能性があります。また、悪意のあるネイティブ Plugin は、OpenClaw プロセス内での任意コード実行と同等です。
</Warning>

互換バンドルは、OpenClaw が現在それらをメタデータ/コンテンツパックとして扱うため、デフォルトでより安全です。現在のリリースでは、これは主にバンドルされた Skills を意味します。

非バンドル Plugin には、allowlist と明示的な install/load パスを使用します。workspace Plugin は本番デフォルトではなく、開発時コードとして扱います。

バンドル workspace パッケージ名では、Plugin id を npm 名に固定してください。デフォルトでは `@openclaw/<id>`、またはパッケージが意図的により狭い Plugin ロールを公開する場合は、`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` などの承認済みの型付き suffix を使用します。

<Note>
**信頼に関する注記:** `plugins.allow` が信頼するのは **Plugin id** であり、ソースの来歴ではありません。バンドル Plugin と同じ id を持つ workspace Plugin は、その workspace Plugin が有効化/allowlist されている場合、意図的にバンドル版をシャドウします。これはローカル開発、パッチテスト、hotfix において通常かつ有用です。バンドル Plugin の信頼は、install メタデータではなく、ロード時のディスク上の manifest とコードというソーススナップショットから解決されます。破損または差し替えられた install record が、実際のソースが主張する範囲を超えて、バンドル Plugin の信頼サーフェスを密かに広げることはできません。
</Note>

## エクスポート境界

OpenClaw は、実装上の利便性ではなく capability をエクスポートします。

capability 登録は公開のままにします。契約ではないヘルパーエクスポートは削減します:

- バンドル Plugin 固有のヘルパー subpath
- 公開 API として意図されていないランタイム配管 subpath
- ベンダー固有の便利ヘルパー
- 実装詳細である setup/オンボーディングヘルパー

予約済みのバンドル Plugin ヘルパー subpath は、生成された SDK export map から廃止されています。所有者固有のヘルパーは、所有する Plugin パッケージ内に保持してください。再利用可能な host 動作のみを、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK 契約に昇格させます。

## 内部構造とリファレンス

ロードパイプライン、レジストリモデル、provider ランタイムフック、Gateway HTTP routes、message tool schemas、channel target resolution、provider catalogs、context engine plugins、新しい capability を追加するためのガイドについては、[Plugin architecture internals](/ja-JP/plugins/architecture-internals) を参照してください。

## 関連

- [Building plugins](/ja-JP/plugins/building-plugins)
- [Plugin manifest](/ja-JP/plugins/manifest)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
