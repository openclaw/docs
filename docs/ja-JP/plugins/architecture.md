---
read_when:
    - ネイティブ OpenClaw plugins のビルドまたはデバッグ
    - プラグインのケイパビリティモデルまたは所有権境界を理解する
    - Plugin のロードパイプラインまたはレジストリの作業
    - プロバイダーのランタイムフックまたはチャンネルPluginの実装
sidebarTitle: Internals
summary: 'Plugin の内部: ケイパビリティモデル、所有権、契約、読み込みパイプライン、ランタイムヘルパー'
title: Plugin の内部構造
x-i18n:
    generated_at: "2026-04-30T05:24:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

これは OpenClaw Plugin システムの**詳細アーキテクチャリファレンス**です。実践的なガイドについては、以下の特化したページのいずれかから始めてください。

<CardGroup cols={2}>
  <Card title="Plugin のインストールと使用" icon="plug" href="/ja-JP/tools/plugin">
    Plugin の追加、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin の構築" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小の動作するマニフェストを使った、最初の Plugin のチュートリアル。
  </Card>
  <Card title="チャネル Plugin" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネル Plugin を構築します。
  </Card>
  <Card title="プロバイダー Plugin" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築します。
  </Card>
  <Card title="SDK 概要" icon="book" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録 API のリファレンス。
  </Card>
</CardGroup>

## 公開 capability モデル

capability は、OpenClaw 内の公開**ネイティブ Plugin**モデルです。すべてのネイティブ OpenClaw Plugin は、1 つ以上の capability タイプに対して登録されます。

| capability             | 登録メソッド                                     | Plugin の例                          |
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
| Web フェッチ           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web 検索               | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージング | `api.registerChannel(...)`                    | `msteams`, `matrix`                  |
| Gateway 検出           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
capability を 1 つも登録しないものの、フック、ツール、検出サービス、またはバックグラウンドサービスを提供する Plugin は、**レガシーのフック専用** Plugin です。このパターンは現在も完全にサポートされています。
</Note>

### 外部互換性の方針

capability モデルはコアに導入済みで、現在バンドル済み/ネイティブ Plugin によって使用されていますが、外部 Plugin の互換性には「エクスポートされているので固定されている」という基準よりも厳密な基準が必要です。

| Plugin の状況                                  | ガイダンス                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部 Plugin                         | フックベースの統合を動作し続けるようにします。これが互換性のベースラインです。                        |
| 新しいバンドル済み/ネイティブ Plugin                        | ベンダー固有の内部参照や新しいフック専用設計よりも、明示的な capability 登録を優先します。 |
| capability 登録を採用する外部 Plugin | 許可されていますが、ドキュメントで安定と明記されていない限り、capability 固有のヘルパーサーフェスは進化中として扱ってください。 |

capability 登録が意図された方向性です。移行期間中、外部 Plugin にとってレガシーフックは引き続き最も破壊的変更の少ない経路です。エクスポートされたヘルパーサブパスはすべて同等ではありません。偶発的なヘルパーエクスポートよりも、狭く文書化された契約を優先してください。

### Plugin の形態

OpenClaw は、すべての読み込まれた Plugin を、その実際の登録動作に基づいて形態に分類します（静的メタデータだけではありません）。

<AccordionGroup>
  <Accordion title="plain-capability">
    ちょうど 1 種類の capability タイプを登録します（たとえば `mistral` のようなプロバイダー専用 Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    複数の capability タイプを登録します（たとえば `openai` はテキスト推論、音声、メディア理解、画像生成を所有します）。
  </Accordion>
  <Accordion title="hook-only">
    フック（型付きまたはカスタム）のみを登録し、capability、ツール、コマンド、サービスは登録しません。
  </Accordion>
  <Accordion title="non-capability">
    ツール、コマンド、サービス、またはルートを登録しますが、capability は登録しません。
  </Accordion>
</AccordionGroup>

Plugin の形態と capability の内訳を確認するには、`openclaw plugins inspect <id>` を使用してください。詳細は [CLI リファレンス](/ja-JP/cli/plugins#inspect) を参照してください。

### レガシーフック

`before_agent_start` フックは、フック専用 Plugin の互換性経路として引き続きサポートされています。現実のレガシー Plugin は今もこれに依存しています。

方向性:

- 動作を維持する
- レガシーとして文書化する
- モデル/プロバイダーのオーバーライド作業には `before_model_resolve` を優先する
- プロンプト変更作業には `before_prompt_build` を優先する
- 実際の使用量が減少し、フィクスチャのカバレッジで移行の安全性が証明された後にのみ削除する

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、次のいずれかのラベルが表示される場合があります。

| シグナル                     | 意味                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 設定は問題なく解析され、Plugin は解決されます                       |
| **compatibility advisory** | Plugin はサポートされているが古いパターンを使用しています（例: `hook-only`） |
| **legacy warning**         | Plugin は非推奨の `before_agent_start` を使用しています        |
| **hard error**             | 設定が無効であるか、Plugin の読み込みに失敗しました                   |

`hook-only` も `before_agent_start` も、現時点で Plugin を壊すことはありません。`hook-only` は助言であり、`before_agent_start` は警告を出すだけです。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClaw の Plugin システムには 4 つのレイヤーがあります。

<Steps>
  <Step title="マニフェスト + 検出">
    OpenClaw は、設定されたパス、ワークスペースルート、グローバル Plugin ルート、バンドル済み Plugin から候補 Plugin を見つけます。検出では、まずネイティブ `openclaw.plugin.json` マニフェストと、サポートされるバンドルマニフェストを読み取ります。
  </Step>
  <Step title="有効化 + 検証">
    コアは、検出された Plugin を有効、無効、ブロック済み、またはメモリのような排他的スロットに選択済みのどれにするかを決定します。
  </Step>
  <Step title="ランタイム読み込み">
    ネイティブ OpenClaw Plugin は jiti 経由でプロセス内に読み込まれ、capability を中央レジストリに登録します。互換性のあるバンドルは、ランタイムコードをインポートせずにレジストリレコードへ正規化されます。
  </Step>
  <Step title="サーフェス消費">
    OpenClaw の他の部分はレジストリを読み取り、ツール、チャネル、プロバイダー設定、フック、HTTP ルート、CLI コマンド、サービスを公開します。
  </Step>
</Steps>

Plugin CLI について具体的には、ルートコマンド検出は 2 つのフェーズに分かれています。

- 解析時メタデータは `registerCli(..., { descriptors: [...] })` から取得されます
- 実際の Plugin CLI モジュールは遅延のままにでき、最初の呼び出し時に登録できます

これにより、Plugin が所有する CLI コードを Plugin 内に保ちながら、OpenClaw は解析前にルートコマンド名を予約できます。

重要な設計境界:

- マニフェスト/設定検証は、Plugin コードを実行せずに**マニフェスト/スキーマメタデータ**から動作するべきです
- ネイティブ capability 検出は、信頼済み Plugin のエントリコードを読み込んで、非アクティブ化レジストリスナップショットを構築する場合があります
- ネイティブランタイム動作は、`api.registrationMode === "full"` を持つ Plugin モジュールの `register(api)` パスから発生します

この分割により、OpenClaw は完全なランタイムがアクティブになる前に、設定を検証し、欠落/無効化された Plugin を説明し、UI/スキーマのヒントを構築できます。

### Plugin メタデータスナップショットとルックアップテーブル

Gateway 起動時には、現在の設定スナップショットに対して 1 つの `PluginMetadataSnapshot` が構築されます。このスナップショットはメタデータ専用です。インストール済み Plugin インデックス、マニフェストレジストリ、マニフェスト診断、所有者マップ、Plugin ID 正規化器、マニフェストレコードを保存します。読み込まれた Plugin モジュール、プロバイダー SDK、パッケージ内容、ランタイムエクスポートは保持しません。

Plugin 対応の設定検証、起動時自動有効化、Gateway Plugin ブートストラップは、マニフェスト/インデックスメタデータを個別に再構築する代わりに、そのスナップショットを消費します。`PluginLookUpTable` は同じスナップショットから派生し、現在のランタイム設定の起動時 Plugin プランを追加します。

起動後、Gateway は現在のメタデータスナップショットを置き換え可能なランタイム生成物として保持します。繰り返しのランタイムプロバイダー検出では、各プロバイダーカタログ処理ごとにインストール済みインデックスとマニフェストレジストリを再構築する代わりに、そのスナップショットを借用できます。Gateway のシャットダウン、設定/Plugin インベントリの変更、インストール済みインデックスの書き込み時には、スナップショットはクリアまたは置換されます。互換性のある現在のスナップショットが存在しない場合、呼び出し元は低温経路のマニフェスト/インデックス経路にフォールバックします。ワークスペース Plugin はメタデータスコープの一部であるため、互換性チェックには `plugins.load.paths` やデフォルトのエージェントワークスペースなどの Plugin 検出ルートを含める必要があります。

スナップショットとルックアップテーブルにより、繰り返しの起動判断が高速経路に保たれます。

- チャネル所有権
- 遅延チャネル起動
- 起動時 Plugin ID
- プロバイダーと CLI バックエンドの所有権
- セットアッププロバイダー、コマンドエイリアス、モデルカタログプロバイダー、マニフェスト契約の所有権
- Plugin 設定スキーマとチャネル設定スキーマの検証
- 起動時自動有効化の判断

安全性の境界は、変更ではなくスナップショットの置換です。設定、Plugin インベントリ、インストールレコード、または永続化インデックスポリシーが変更されたら、スナップショットを再構築してください。これを広範な可変グローバルレジストリとして扱わず、無制限の履歴スナップショットも保持しないでください。ランタイム Plugin 読み込みはメタデータスナップショットとは分離されたままなので、古いランタイム状態がメタデータキャッシュの背後に隠れることはありません。

キャッシュルールは [Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals#plugin-cache-boundary) に記載されています。呼び出し元が現在のフロー用の明示的なスナップショット、ルックアップテーブル、またはマニフェストレジストリを保持していない限り、マニフェストと検出メタデータは新鮮です。隠れたメタデータキャッシュやウォールクロック TTL は Plugin 読み込みの一部ではありません。ランタイムローダー、モジュール、依存関係アーティファクトのキャッシュだけが、コードまたはインストール済みアーティファクトが実際に読み込まれた後も永続化できます。

一部の低温経路の呼び出し元は、Gateway の `PluginLookUpTable` を受け取る代わりに、永続化されたインストール済み Plugin インデックスからマニフェストレジストリを直接再構築しています。この経路は現在、必要に応じてレジストリを再構築します。呼び出し元がすでに持っている場合は、現在のルックアップテーブルまたは明示的なマニフェストレジストリをランタイムフローに渡すことを優先してください。

### アクティベーション計画

アクティベーション計画はコントロールプレーンの一部です。呼び出し元は、より広範なランタイムレジストリを読み込む前に、具体的なコマンド、プロバイダー、チャネル、ルート、エージェントハーネス、または capability に関連する Plugin を問い合わせることができます。

プランナーは現在のマニフェスト動作との互換性を維持します。

- `activation.*` フィールドは明示的なプランナーヒントです
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックはマニフェスト所有権のフォールバックのままです
- 既存の呼び出し元向けに ID のみのプランナー API は引き続き利用可能です
- プラン API は理由ラベルを報告するため、診断では明示的なヒントと所有権フォールバックを区別できます

<Warning>
`activation` をライフサイクルフックや `register(...)` の代替として扱わないでください。これは読み込み対象を絞るために使うメタデータです。関係性をすでに説明している場合は所有権フィールドを優先し、`activation` は追加のプランナー向けヒントにのみ使用してください。
</Warning>

### チャンネル Plugin と共有メッセージツール

チャンネル Plugin は、通常のチャット操作のために個別の送信/編集/リアクションツールを登録する必要はありません。OpenClaw はコア内に共有 `message` ツールを 1 つ保持し、その背後にあるチャンネル固有の検出と実行はチャンネル Plugin が所有します。

現在の境界は次のとおりです。

- コアは共有 `message` ツールホスト、プロンプト配線、セッション/スレッドの管理、実行ディスパッチを所有します
- チャンネル Plugin はスコープ付きアクション検出、機能検出、チャンネル固有のスキーマ断片を所有します
- チャンネル Plugin は、会話 id がスレッド id をエンコードする方法や親会話から継承する方法など、プロバイダー固有のセッション会話文法を所有します
- チャンネル Plugin は、自身のアクションアダプターを通じて最終アクションを実行します

チャンネル Plugin にとって、SDK サーフェスは `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された検出呼び出しにより、Plugin は可視アクション、機能、スキーマへの寄与をまとめて返せるため、それらの要素がずれにくくなります。

チャンネル固有のメッセージツールパラメーターがローカルパスやリモートメディア URL などのメディアソースを持つ場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返すべきです。コアはその明示的なリストを使い、Plugin が所有するパラメーター名をハードコードせずにサンドボックスパス正規化と送信メディアアクセスヒントを適用します。そこではチャンネル全体のフラットなリストではなく、アクションごとのマップを優先してください。そうすれば、プロフィール専用のメディアパラメーターが `send` などの無関係なアクションで正規化されません。

コアはその検出ステップにランタイムスコープを渡します。重要なフィールドには次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済み受信 `requesterSenderId`

これはコンテキストに依存する Plugin にとって重要です。チャンネルは、コアの `message` ツールにチャンネル固有の分岐をハードコードすることなく、アクティブなアカウント、現在のルーム/スレッド/メッセージ、または信頼済みリクエスター ID に基づいてメッセージアクションを非表示または表示できます。

これが、埋め込みランナーのルーティング変更が依然として Plugin 側の作業である理由です。ランナーは、現在のチャット/セッション ID を Plugin 検出境界へ転送し、共有 `message` ツールが現在のターンに適したチャンネル所有サーフェスを公開する責任を持ちます。

チャンネル所有の実行ヘルパーでは、バンドル Plugin は実行ランタイムを自分自身の拡張モジュール内に保つべきです。コアは `src/agents/tools` 配下の Discord、Slack、Telegram、WhatsApp メッセージアクションランタイムをもう所有しません。個別の `plugin-sdk/*-action-runtime` サブパスは公開しておらず、バンドル Plugin は自身の拡張が所有するモジュールからローカルランタイムコードを直接インポートするべきです。

同じ境界は、一般にプロバイダー名付き SDK の継ぎ目にも適用されます。コアは Slack、Discord、Signal、WhatsApp、または類似の拡張向けのチャンネル固有コンビニエンスバレルをインポートするべきではありません。コアがある振る舞いを必要とする場合は、バンドル Plugin 自身の `api.ts` / `runtime-api.ts` バレルを利用するか、その必要性を共有 SDK 内の狭い汎用機能へ昇格させてください。

バンドル Plugin も同じルールに従います。バンドル Plugin の `runtime-api.ts` は、自身のブランド付き `openclaw/plugin-sdk/<plugin-id>` ファサードを再エクスポートするべきではありません。これらのブランド付きファサードは外部 Plugin と古い利用者向けの互換性 shim として残りますが、バンドル Plugin はローカルエクスポートと、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/webhook-ingress` のような狭い汎用 SDK サブパスを使用するべきです。既存の外部エコシステムに対する互換性境界で必要な場合を除き、新しいコードで Plugin id 固有の SDK ファサードを追加するべきではありません。

投票については、具体的に 2 つの実行パスがあります。

- `outbound.sendPoll` は、共通の投票モデルに合うチャンネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャンネル固有の投票セマンティクスや追加の投票パラメーターに推奨されるパスです

コアは現在、Plugin の投票ディスパッチがそのアクションを辞退するまで共有投票解析を遅延するため、Plugin 所有の投票ハンドラーは汎用投票パーサーに先にブロックされることなく、チャンネル固有の投票フィールドを受け入れられます。

完全な起動シーケンスについては、[Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)を参照してください。

## 機能所有権モデル

OpenClaw は、ネイティブ Plugin を無関係な連携の寄せ集めではなく、**会社**または**機能**の所有権境界として扱います。

つまり、次のようになります。

- 会社 Plugin は通常、その会社の OpenClaw 向けサーフェスをすべて所有するべきです
- 機能 Plugin は通常、それが導入する機能サーフェス全体を所有するべきです
- チャンネルは、プロバイダーの振る舞いを場当たり的に再実装するのではなく、共有コア機能を利用するべきです

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` はテキスト推論、音声、リアルタイム音声、メディア理解、画像生成を所有します。`google` はテキスト推論に加え、メディア理解、画像生成、Web 検索を所有します。`qwen` はテキスト推論に加え、メディア理解と動画生成を所有します。
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` と `microsoft` は音声を所有し、`firecrawl` は Web 取得を所有し、`minimax` / `mistral` / `moonshot` / `zai` はメディア理解バックエンドを所有します。
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` は通話トランスポート、ツール、CLI、ルート、Twilio メディアストリームブリッジを所有しますが、ベンダー Plugin を直接インポートするのではなく、共有音声、リアルタイム文字起こし、リアルタイム音声機能を利用します。
  </Accordion>
</AccordionGroup>

意図する最終状態は次のとおりです。

- OpenAI は、テキストモデル、音声、画像、将来の動画にまたがる場合でも 1 つの Plugin に存在します
- 別のベンダーも、自身のサーフェス領域について同じことができます
- チャンネルは、どのベンダー Plugin がプロバイダーを所有しているかを気にしません。コアが公開する共有機能コントラクトを利用します

重要な区別は次のとおりです。

- **Plugin** = 所有権境界
- **機能** = 複数の Plugin が実装または利用できるコアコントラクト

そのため OpenClaw が動画などの新しいドメインを追加する場合、最初の問いは「どのプロバイダーが動画処理をハードコードするべきか」ではありません。最初の問いは「コアの動画機能コントラクトとは何か」です。そのコントラクトが存在すれば、ベンダー Plugin はそれに登録でき、チャンネル/機能 Plugin はそれを利用できます。

その機能がまだ存在しない場合、通常は次の手順が適切です。

<Steps>
  <Step title="Define the capability">
    不足している機能をコアで定義します。
  </Step>
  <Step title="Expose through the SDK">
    型付けされた形で Plugin API/ランタイムを通じて公開します。
  </Step>
  <Step title="Wire consumers">
    チャンネル/機能をその機能へ接続します。
  </Step>
  <Step title="Vendor implementations">
    ベンダー Plugin が実装を登録できるようにします。
  </Step>
</Steps>

これにより、単一ベンダーや一度きりの Plugin 固有コードパスに依存するコアの振る舞いを避けつつ、所有権を明示的に保てます。

### 機能レイヤリング

コードの配置場所を決めるときは、次のメンタルモデルを使用してください。

<Tabs>
  <Tab title="Core capability layer">
    共有オーケストレーション、ポリシー、フォールバック、設定マージルール、配信セマンティクス、型付きコントラクト。
  </Tab>
  <Tab title="Vendor plugin layer">
    ベンダー固有 API、認証、モデルカタログ、音声合成、画像生成、将来の動画バックエンド、使用量エンドポイント。
  </Tab>
  <Tab title="Channel/feature plugin layer">
    コア機能を利用し、それをサーフェス上に提示する Slack/Discord/voice-call などの連携。
  </Tab>
</Tabs>

たとえば、TTS はこの形に従います。

- コアは返信時 TTS ポリシー、フォールバック順、設定、チャンネル配信を所有します
- `openai`、`elevenlabs`、`microsoft` は合成実装を所有します
- `voice-call` は電話 TTS ランタイムヘルパーを利用します

将来の機能でも同じパターンを優先するべきです。

### マルチ機能会社 Plugin の例

会社 Plugin は外側から見てまとまりがあるべきです。OpenClaw にモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索の共有コントラクトがある場合、ベンダーは自身のすべてのサーフェスを 1 か所で所有できます。

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

重要なのは、正確なヘルパー名ではありません。重要なのは形です。

- 1 つの Plugin がベンダーサーフェスを所有します
- コアは引き続き機能コントラクトを所有します
- チャンネルと機能 Plugin はベンダーコードではなく `api.runtime.*` ヘルパーを利用します
- コントラクトテストは、Plugin が所有を主張する機能を登録していることを検証できます

### 機能の例: 動画理解

OpenClaw はすでに画像/音声/動画理解を 1 つの共有機能として扱っています。同じ所有権モデルがここにも適用されます。

<Steps>
  <Step title="Core defines the contract">
    コアがメディア理解コントラクトを定義します。
  </Step>
  <Step title="Vendor plugins register">
    ベンダー Plugin は該当する場合に `describeImage`、`transcribeAudio`、`describeVideo` を登録します。
  </Step>
  <Step title="Consumers use the shared behavior">
    チャンネルと機能 Plugin は、ベンダーコードへ直接配線するのではなく、共有コアの振る舞いを利用します。
  </Step>
</Steps>

これにより、1 つのプロバイダーの動画前提をコアに焼き込むことを避けられます。Plugin はベンダーサーフェスを所有し、コアは機能コントラクトとフォールバックの振る舞いを所有します。

動画生成もすでに同じ手順を使用しています。コアが型付き機能コントラクトとランタイムヘルパーを所有し、ベンダー Plugin がそれに対して `api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的なロールアウトチェックリストが必要ですか。[機能 Cookbook](/ja-JP/plugins/architecture)を参照してください。

## コントラクトと強制

Plugin API サーフェスは、意図的に `OpenClawPluginApi` に型付けされ、集中化されています。そのコントラクトは、サポートされる登録ポイントと、Plugin が依存してよいランタイムヘルパーを定義します。

これが重要な理由は次のとおりです。

- Plugin 作者は安定した内部標準を 1 つ得られます
- コアは、2 つの Plugin が同じプロバイダー id を登録するような重複所有権を拒否できます
- 起動時に不正な登録について実用的な診断を提示できます
- コントラクトテストは、バンドル Plugin の所有権を強制し、静かなずれを防げます

強制には 2 つのレイヤーがあります。

<AccordionGroup>
  <Accordion title="実行時登録の強制">
    Plugin レジストリは、Plugin の読み込み時に登録を検証します。例: 重複したプロバイダー ID、重複した音声プロバイダー ID、不正な形式の登録は、未定義の動作ではなく Plugin 診断を生成します。
  </Accordion>
  <Accordion title="コントラクトテスト">
    バンドル済みPlugin は、テスト実行中にコントラクトレジストリへ取り込まれるため、OpenClaw は所有権を明示的にアサートできます。現在これは、モデルプロバイダー、音声プロバイダー、ウェブ検索プロバイダー、バンドル済み登録の所有権に使用されています。
  </Accordion>
</AccordionGroup>

実務上の効果として、OpenClaw はどの Plugin がどのサーフェスを所有しているかを事前に把握できます。これにより、所有権が暗黙ではなく宣言され、型付けされ、テスト可能になるため、コアとチャンネルをシームレスに合成できます。

### コントラクトに含めるべきもの

<Tabs>
  <Tab title="良いコントラクト">
    - 型付けされている
    - 小さい
    - ケイパビリティ固有
    - コアが所有している
    - 複数の Plugin で再利用できる
    - ベンダー知識なしでチャンネル/機能から利用できる

  </Tab>
  <Tab title="悪いコントラクト">
    - コアに隠されたベンダー固有のポリシー
    - レジストリを迂回する一度限りの Plugin エスケープハッチ
    - チャンネルコードがベンダー実装へ直接到達している
    - `OpenClawPluginApi` または `api.runtime` の一部ではないアドホックなランタイムオブジェクト

  </Tab>
</Tabs>

迷った場合は、抽象化レベルを上げます。まずケイパビリティを定義し、その後で Plugin がそこへプラグインできるようにします。

## 実行モデル

ネイティブ OpenClaw Plugin は Gateway と同じ**プロセス内**で実行されます。サンドボックス化されません。読み込まれたネイティブ Plugin は、コアコードと同じプロセスレベルの信頼境界を持ちます。

<Warning>
ネイティブ Plugin の影響: Plugin はツール、ネットワークハンドラー、フック、サービスを登録できます。Plugin のバグは Gateway をクラッシュさせたり不安定化させたりする可能性があります。また、悪意のあるネイティブ Plugin は、OpenClaw プロセス内での任意コード実行と同等です。
</Warning>

互換バンドルは、OpenClaw が現在それらをメタデータ/コンテンツパックとして扱うため、デフォルトでより安全です。現在のリリースでは、それは主にバンドル済み Skills を意味します。

非バンドル Plugin には、許可リストと明示的なインストール/読み込みパスを使用します。ワークスペース Plugin は、本番環境のデフォルトではなく、開発時コードとして扱います。

バンドル済みワークスペースパッケージ名では、Plugin ID を npm 名に固定します。デフォルトでは `@openclaw/<id>`、またはパッケージが意図的により狭い Plugin ロールを公開する場合は、`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` など、承認済みの型付きサフィックスを使用します。

<Note>
**信頼に関する注意:** `plugins.allow` が信頼するのは**Plugin ID**であり、ソースの来歴ではありません。バンドル済みPlugin と同じ ID を持つワークスペース Plugin は、そのワークスペース Plugin が有効化/許可リスト化されている場合、意図的にバンドル済みのコピーをシャドウします。これは通常の動作であり、ローカル開発、パッチテスト、ホットフィックスに有用です。バンドル済みPlugin の信頼は、インストールメタデータではなく、読み込み時点のディスク上のマニフェストとコードというソーススナップショットから解決されます。破損または差し替えられたインストール記録が、実際のソースが主張する範囲を超えてバンドル済みPlugin の信頼サーフェスを密かに広げることはできません。
</Note>

## エクスポート境界

OpenClaw は実装上の利便性ではなく、ケイパビリティをエクスポートします。

ケイパビリティ登録は公開したままにします。コントラクトではないヘルパーエクスポートは削減します。

- バンドル済みPlugin 固有のヘルパーサブパス
- 公開 API として意図されていないランタイム配管サブパス
- ベンダー固有の利便性ヘルパー
- 実装詳細であるセットアップ/オンボーディングヘルパー

予約済みのバンドル済みPlugin ヘルパーサブパスは、生成された SDK エクスポートマップから廃止されました。所有者固有のヘルパーは所有元の Plugin パッケージ内に保持します。再利用可能なホスト動作のみを、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトへ昇格させます。

## 内部とリファレンス

読み込みパイプライン、レジストリモデル、プロバイダーランタイムフック、Gateway HTTP ルート、メッセージツールスキーマ、チャンネルターゲット解決、プロバイダーカタログ、コンテキストエンジン Plugin、新しいケイパビリティを追加するためのガイドについては、[Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
