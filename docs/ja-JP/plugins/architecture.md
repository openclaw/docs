---
read_when:
    - ネイティブ OpenClaw Plugin のビルドまたはデバッグ
    - Plugin の機能モデルまたは所有権境界を理解する
    - Plugin の読み込みパイプラインまたはレジストリに取り組む
    - プロバイダーのランタイムフックまたはチャンネルPluginの実装
sidebarTitle: Internals
summary: 'Plugin 内部: ケイパビリティモデル、所有権、契約、読み込みパイプライン、ランタイムヘルパー'
title: Plugin 内部
x-i18n:
    generated_at: "2026-06-27T12:07:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

これは OpenClaw Pluginシステムの**詳細なアーキテクチャリファレンス**です。実践的なガイドは、以下の各トピックに絞ったページから始めてください。

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/ja-JP/tools/plugin">
    Pluginの追加、有効化、トラブルシューティングに関するエンドユーザー向けガイド。
  </Card>
  <Card title="Building plugins" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小の動作するマニフェストを使った、初めてのPluginチュートリアル。
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

## 公開ケイパビリティモデル

ケイパビリティは、OpenClaw内部の公開**ネイティブPlugin**モデルです。すべてのネイティブOpenClaw Pluginは、1つ以上のケイパビリティタイプに対して登録します。

| ケイパビリティ       | 登録メソッド                                     | Plugin例                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| テキスト推論         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI推論バックエンド  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 埋め込み             | `api.registerEmbeddingProvider(...)`             | プロバイダー所有のベクターPlugin    |
| 音声                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| リアルタイム音声     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| メディア理解         | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 文字起こしソース     | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| 画像生成             | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音楽生成             | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 動画生成             | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web取得              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web検索              | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージング | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway検出          | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
ケイパビリティを1つも登録せず、フック、ツール、検出サービス、またはバックグラウンドサービスを提供するPluginは、**レガシーフック専用**Pluginです。このパターンは現在も完全にサポートされています。
</Note>

### 外部互換性の方針

ケイパビリティモデルはコアに取り込まれており、現在は同梱/ネイティブPluginで使われていますが、外部Pluginの互換性には「エクスポートされているので固定されている」よりも厳密な基準が必要です。

| Pluginの状況                                     | ガイダンス                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既存の外部Plugin                                  | フックベースの統合を動作させ続けます。これが互換性の基準です。                                  |
| 新しい同梱/ネイティブPlugin                       | ベンダー固有の内部参照や新しいフック専用設計よりも、明示的なケイパビリティ登録を優先します。     |
| ケイパビリティ登録を採用する外部Plugin            | 許可されていますが、ドキュメントで安定と明記されていない限り、ケイパビリティ固有のヘルパー面は進化中として扱ってください。 |

ケイパビリティ登録が目指す方向です。移行期間中、外部Pluginにとってレガシーフックは破壊的変更を避ける最も安全な道のままです。エクスポートされたヘルパーサブパスはすべて同等ではありません。偶発的なヘルパーエクスポートよりも、範囲の狭い文書化された契約を優先してください。

### Pluginの形状

OpenClawは、読み込まれた各Pluginを、その実際の登録動作（静的メタデータだけではありません）に基づいて形状へ分類します。

<AccordionGroup>
  <Accordion title="plain-capability">
    ケイパビリティタイプをちょうど1つ登録します（たとえば `mistral` のようなプロバイダー専用Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    複数のケイパビリティタイプを登録します（たとえば `openai` はテキスト推論、音声、メディア理解、画像生成を所有します）。
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

`before_agent_start` フックは、フック専用Plugin向けの互換性パスとして引き続きサポートされています。実在するレガシーPluginは現在もこれに依存しています。

方向性:

- 動作を維持する
- レガシーとして文書化する
- モデル/プロバイダーの上書き作業には `before_model_resolve` を優先する
- プロンプト変更作業には `before_prompt_build` を優先する
- 実際の利用が減り、フィクスチャのカバレッジで移行の安全性が証明された後にのみ削除する

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、次のいずれかのラベルが表示される場合があります。

| シグナル                   | 意味                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **設定は有効**             | 設定は正常に解析され、Pluginも解決されています              |
| **互換性アドバイザリ**     | Pluginがサポート対象だが古いパターンを使用しています（例: `hook-only`） |
| **レガシー警告**           | Pluginが非推奨の `before_agent_start` を使用しています      |
| **ハードエラー**           | 設定が無効、またはPluginの読み込みに失敗しました             |

`hook-only` も `before_agent_start` も、現在あなたのPluginを壊すことはありません。`hook-only` はアドバイザリであり、`before_agent_start` は警告を発生させるだけです。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClawのPluginシステムには4つの層があります。

<Steps>
  <Step title="Manifest + discovery">
    OpenClawは、設定済みパス、ワークスペースルート、グローバルPluginルート、同梱Pluginから候補Pluginを見つけます。検出では、ネイティブの `openclaw.plugin.json` マニフェストと、サポート対象のバンドルマニフェストを先に読み取ります。
  </Step>
  <Step title="Enablement + validation">
    コアは、検出されたPluginが有効、無効、ブロック済み、またはメモリのような排他的スロットに選択されているかを判断します。
  </Step>
  <Step title="Runtime loading">
    ネイティブOpenClaw Pluginはプロセス内で読み込まれ、中央レジストリにケイパビリティを登録します。パッケージ化されたJavaScriptはネイティブの `require` 経由で読み込まれます。サードパーティのローカルソースTypeScriptは緊急時のJitiフォールバックです。互換バンドルは、ランタイムコードをインポートせずにレジストリレコードへ正規化されます。
  </Step>
  <Step title="Surface consumption">
    OpenClawの残りの部分はレジストリを読み取り、ツール、チャネル、プロバイダー設定、フック、HTTPルート、CLIコマンド、サービスを公開します。
  </Step>
</Steps>

Plugin CLIに限ると、ルートコマンド検出は2段階に分かれています。

- 解析時メタデータは `registerCli(..., { descriptors: [...] })` から取得されます
- 実際のPlugin CLIモジュールは遅延のままにでき、初回呼び出し時に登録できます

これにより、Plugin所有のCLIコードをPlugin内に保ちながら、OpenClawが解析前にルートコマンド名を予約できます。

重要な設計境界:

- マニフェスト/設定検証は、Pluginコードを実行せずに**マニフェスト/スキーマメタデータ**から動作する必要があります
- ネイティブケイパビリティ検出は、非アクティブ化レジストリスナップショットを構築するために、信頼されたPluginエントリコードを読み込む場合があります
- ネイティブランタイム動作は、`api.registrationMode === "full"` を伴うPluginモジュールの `register(api)` パスから取得されます

この分割により、OpenClawは完全なランタイムがアクティブになる前に、設定を検証し、不足または無効化されたPluginを説明し、UI/スキーマのヒントを構築できます。

### Pluginメタデータスナップショットとルックアップテーブル

Gatewayの起動時には、現在の設定スナップショット用に1つの `PluginMetadataSnapshot` が構築されます。このスナップショットはメタデータ専用です。インストール済みPluginインデックス、マニフェストレジストリ、マニフェスト診断、所有者マップ、Plugin ID正規化器、マニフェストレコードを保存します。読み込まれたPluginモジュール、プロバイダーSDK、パッケージ内容、ランタイムエクスポートは保持しません。

Plugin対応の設定検証、起動時の自動有効化、Gateway Pluginブートストラップは、マニフェスト/インデックスメタデータを個別に再構築する代わりに、そのスナップショットを使用します。`PluginLookUpTable` は同じスナップショットから派生し、現在のランタイム設定に対する起動Plugin計画を追加します。

起動後、Gatewayは現在のメタデータスナップショットを置き換え可能なランタイム成果物として保持します。繰り返し実行されるランタイムプロバイダー検出は、各プロバイダーカタログ処理ごとにインストール済みインデックスとマニフェストレジストリを再構築する代わりに、そのスナップショットを借用できます。スナップショットは、Gatewayのシャットダウン、設定/Pluginインベントリの変更、インストール済みインデックスの書き込み時にクリアまたは置換されます。互換性のある現在のスナップショットが存在しない場合、呼び出し元はコールドなマニフェスト/インデックスパスへフォールバックします。互換性チェックには、`plugins.load.paths` やデフォルトのエージェントワークスペースなどのPlugin検出ルートを含める必要があります。ワークスペースPluginはメタデータスコープの一部だからです。

スナップショットとルックアップテーブルは、繰り返される起動時の判断を高速パスに保ちます。

- チャネル所有権
- 遅延チャネル起動
- 起動Plugin ID
- プロバイダーおよびCLIバックエンドの所有権
- セットアッププロバイダー、コマンドエイリアス、モデルカタログプロバイダー、マニフェスト契約の所有権
- Plugin設定スキーマおよびチャネル設定スキーマの検証
- 起動時の自動有効化判断

安全境界はスナップショットの置換であり、ミューテーションではありません。設定、Pluginインベントリ、インストール記録、または永続化されたインデックスポリシーが変更されたら、スナップショットを再構築してください。これを広範な可変グローバルレジストリとして扱わず、無制限の履歴スナップショットを保持しないでください。ランタイムPluginの読み込みはメタデータスナップショットとは分離されたままなので、古いランタイム状態がメタデータキャッシュの背後に隠れることはありません。

キャッシュルールは [Pluginアーキテクチャ内部](/ja-JP/plugins/architecture-internals#plugin-cache-boundary) に文書化されています。マニフェストと検出メタデータは、呼び出し元が現在のフロー用に明示的なスナップショット、ルックアップテーブル、またはマニフェストレジストリを保持していない限り、常に新鮮です。隠れたメタデータキャッシュや実時間TTLは、Plugin読み込みの一部ではありません。コードまたはインストール済み成果物が実際に読み込まれた後に永続化してよいのは、ランタイムローダー、モジュール、依存関係成果物のキャッシュだけです。

一部のコールドパス呼び出し元は、Gatewayの `PluginLookUpTable` を受け取る代わりに、永続化されたインストール済みPluginインデックスからマニフェストレジストリを直接再構築しています。このパスは現在、必要に応じてレジストリを再構築します。呼び出し元がすでに持っている場合は、現在のルックアップテーブルまたは明示的なマニフェストレジストリをランタイムフローに渡すことを優先してください。

### アクティベーション計画

アクティベーション計画は制御プレーンの一部です。呼び出し元は、より広範なランタイムレジストリを読み込む前に、具体的なコマンド、プロバイダー、チャネル、ルート、エージェントハーネス、またはケイパビリティに関連するPluginを問い合わせることができます。

プランナーは現在のマニフェスト動作との互換性を維持します。

- `activation.*` フィールドは明示的なプランナーのヒントです
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、およびフックは、引き続きマニフェスト所有権のフォールバックです
- id のみのプランナー API は、既存の呼び出し元向けに引き続き利用できます
- plan API は理由ラベルを報告するため、診断で明示的なヒントと所有権フォールバックを区別できます

<Warning>
`activation` をライフサイクルフックや `register(...)` の代替として扱わないでください。これは読み込みを絞り込むために使われるメタデータです。関係性をすでに説明している場合は所有権フィールドを優先し、追加のプランナーのヒントに限って `activation` を使用してください。
</Warning>

### チャンネル Plugin と共有メッセージツール

チャンネル Plugin は、通常のチャットアクション用に個別の送信/編集/リアクションツールを登録する必要はありません。OpenClaw は core に共有の `message` ツールを 1 つ保持し、チャンネル Plugin がその背後にあるチャンネル固有の検出と実行を所有します。

現在の境界は次のとおりです。

- core は共有 `message` ツールホスト、プロンプト配線、セッション/スレッドの帳簿管理、実行ディスパッチを所有します
- チャンネル Plugin はスコープ付きアクション検出、機能検出、およびチャンネル固有のスキーマ断片を所有します
- チャンネル Plugin は、会話 id がスレッド id をエンコードする方法や親会話から継承する方法など、プロバイダー固有のセッション会話文法を所有します
- チャンネル Plugin は、アクションアダプターを通じて最終アクションを実行します

チャンネル Plugin の SDK サーフェスは `ChannelMessageActionAdapter.describeMessageTool(...)` です。その統一された検出呼び出しにより、Plugin は可視アクション、機能、スキーマへの寄与をまとめて返せるため、それらが互いにずれることを防げます。

チャンネル固有の message-tool パラメーターがローカルパスやリモートメディア URL などのメディアソースを持つ場合、Plugin は `describeMessageTool(...)` から `mediaSourceParams` も返す必要があります。core はこの明示的なリストを使って、Plugin 所有のパラメーター名をハードコードせずに、サンドボックスパス正規化とアウトバウンドメディアアクセスのヒントを適用します。そこではチャンネル全体の単一の平坦なリストではなく、アクションスコープのマップを優先してください。これにより、プロファイル専用のメディアパラメーターが `send` のような無関係なアクションで正規化されません。

core はその検出ステップにランタイムスコープを渡します。重要なフィールドには次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼済みインバウンド `requesterSenderId`

これはコンテキスト依存の Plugin にとって重要です。チャンネルは、アクティブなアカウント、現在のルーム/スレッド/メッセージ、または信頼済みリクエスター ID に基づいてメッセージアクションを非表示または表示できます。core の `message` ツールにチャンネル固有の分岐をハードコードする必要はありません。

これが、組み込みランナーのルーティング変更が今でも Plugin の作業である理由です。ランナーは、現在のチャット/セッション ID を Plugin 検出境界に転送し、共有 `message` ツールが現在のターンに適したチャンネル所有のサーフェスを公開するようにする責任があります。

チャンネル所有の実行ヘルパーについては、バンドル Plugin は実行ランタイムを自身の拡張モジュール内に保持する必要があります。core は `src/agents/tools` 配下の Discord、Slack、Telegram、WhatsApp メッセージアクションランタイムを所有しなくなりました。個別の `plugin-sdk/*-action-runtime` サブパスは公開せず、バンドル Plugin は自身の拡張所有モジュールからローカルランタイムコードを直接インポートする必要があります。

同じ境界は、一般にプロバイダー名付きの SDK 接合部にも適用されます。core は Slack、Discord、Signal、WhatsApp、または類似の拡張向けのチャンネル固有の便利なバレルをインポートするべきではありません。core がある動作を必要とする場合は、バンドル Plugin 自身の `api.ts` / `runtime-api.ts` バレルを消費するか、その必要性を共有 SDK の狭い汎用機能に昇格させてください。

バンドル Plugin も同じルールに従います。バンドル Plugin の `runtime-api.ts` は、自身のブランド付き `openclaw/plugin-sdk/<plugin-id>` ファサードを再エクスポートするべきではありません。これらのブランド付きファサードは外部 Plugin と古いコンシューマー向けの互換性シムとして残りますが、バンドル Plugin はローカルエクスポートと、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/webhook-ingress` のような狭い汎用 SDK サブパスを使用する必要があります。既存の外部エコシステムの互換性境界が必要としない限り、新しいコードで Plugin id 固有の SDK ファサードを追加するべきではありません。

投票については、実行パスが 2 つあります。

- `outbound.sendPoll` は、共通の投票モデルに適合するチャンネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャンネル固有の投票セマンティクスや追加の投票パラメーター向けの推奨パスです

core は、Plugin の投票ディスパッチがそのアクションを辞退した後まで共有投票解析を遅延するようになったため、Plugin 所有の投票ハンドラーは、汎用投票パーサーに先にブロックされることなく、チャンネル固有の投票フィールドを受け入れられます。

完全な起動シーケンスについては、[Plugin アーキテクチャ内部](/ja-JP/plugins/architecture-internals)を参照してください。

## 機能所有権モデル

OpenClaw はネイティブ Plugin を、無関係な統合の寄せ集めではなく、**企業**または**機能**の所有権境界として扱います。

つまり、次のようになります。

- 企業 Plugin は通常、その企業の OpenClaw 向けサーフェスをすべて所有するべきです
- 機能 Plugin は通常、自身が導入する機能サーフェス全体を所有するべきです
- チャンネルは、プロバイダーの動作を場当たり的に再実装するのではなく、共有 core 機能を消費するべきです

<AccordionGroup>
  <Accordion title="ベンダーの複数機能">
    `openai` はテキスト推論、音声、リアルタイム音声、メディア理解、画像生成を所有します。`google` はテキスト推論に加えて、メディア理解、画像生成、Web 検索を所有します。`qwen` はテキスト推論に加えて、メディア理解と動画生成を所有します。
  </Accordion>
  <Accordion title="ベンダーの単一機能">
    `elevenlabs` と `microsoft` は音声を所有し、`firecrawl` は Web フェッチを所有し、`minimax` / `mistral` / `moonshot` / `zai` はメディア理解バックエンドを所有します。
  </Accordion>
  <Accordion title="機能 Plugin">
    `voice-call` は通話トランスポート、ツール、CLI、ルート、Twilio メディアストリームブリッジを所有しますが、ベンダー Plugin を直接インポートするのではなく、共有の音声、リアルタイム文字起こし、リアルタイム音声機能を消費します。
  </Accordion>
</AccordionGroup>

意図する最終状態は次のとおりです。

- OpenAI は、テキストモデル、音声、画像、将来の動画にまたがっていても 1 つの Plugin に存在します
- 別のベンダーも、自身のサーフェス領域について同じことができます
- チャンネルは、どのベンダー Plugin がプロバイダーを所有しているかを気にせず、core が公開する共有機能コントラクトを消費します

重要な区別は次のとおりです。

- **Plugin** = 所有権境界
- **機能** = 複数の Plugin が実装または消費できる core コントラクト

したがって、OpenClaw が動画のような新しいドメインを追加する場合、最初の問いは「どのプロバイダーが動画処理をハードコードするべきか」ではありません。最初の問いは「core の動画機能コントラクトとは何か」です。そのコントラクトが存在すれば、ベンダー Plugin はそれに対して登録でき、チャンネル/機能 Plugin はそれを消費できます。

機能がまだ存在しない場合、通常の正しい進め方は次のとおりです。

<Steps>
  <Step title="機能を定義する">
    不足している機能を core に定義します。
  </Step>
  <Step title="SDK 経由で公開する">
    Plugin API/ランタイムを通じて型付きで公開します。
  </Step>
  <Step title="コンシューマーを配線する">
    チャンネル/機能をその機能に対して配線します。
  </Step>
  <Step title="ベンダー実装">
    ベンダー Plugin が実装を登録できるようにします。
  </Step>
</Steps>

これにより、単一のベンダーや一度限りの Plugin 固有コードパスに依存する core の動作を避けながら、所有権を明示的に保てます。

### 機能レイヤー

コードの置き場所を判断するときは、次のメンタルモデルを使用してください。

<Tabs>
  <Tab title="core 機能レイヤー">
    共有オーケストレーション、ポリシー、フォールバック、設定マージルール、配信セマンティクス、型付きコントラクト。
  </Tab>
  <Tab title="ベンダー Plugin レイヤー">
    ベンダー固有の API、認証、モデルカタログ、音声合成、画像生成、将来の動画バックエンド、使用量エンドポイント。
  </Tab>
  <Tab title="チャンネル/機能 Plugin レイヤー">
    core 機能を消費し、それをサーフェス上に提示する Slack/Discord/voice-call などの統合。
  </Tab>
</Tabs>

たとえば、TTS は次の形に従います。

- core は返信時の TTS ポリシー、フォールバック順序、設定、チャンネル配信を所有します
- `openai`、`elevenlabs`、`microsoft` は合成実装を所有します
- `voice-call` は電話 TTS ランタイムヘルパーを消費します

将来の機能でも、同じパターンを優先するべきです。

### 複数機能を持つ企業 Plugin の例

企業 Plugin は外側から見て一体感があるべきです。OpenClaw にモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web フェッチ、Web 検索の共有コントラクトがある場合、ベンダーは自身のすべてのサーフェスを 1 か所で所有できます。

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
- core は引き続き機能コントラクトを所有します
- チャンネルと機能 Plugin は、ベンダーコードではなく `api.runtime.*` ヘルパーを消費します
- コントラクトテストは、Plugin が所有すると主張する機能を登録していることを検証できます

### 機能例: 動画理解

OpenClaw はすでに画像/音声/動画理解を 1 つの共有機能として扱っています。そこにも同じ所有権モデルが適用されます。

<Steps>
  <Step title="core がコントラクトを定義する">
    core がメディア理解コントラクトを定義します。
  </Step>
  <Step title="ベンダー Plugin が登録する">
    ベンダー Plugin は該当する場合に `describeImage`、`transcribeAudio`、`describeVideo` を登録します。
  </Step>
  <Step title="コンシューマーが共有動作を使う">
    チャンネルと機能 Plugin は、ベンダーコードへ直接配線するのではなく、共有 core 動作を消費します。
  </Step>
</Steps>

これにより、1 つのプロバイダーの動画に関する前提を core に焼き込むことを避けられます。Plugin はベンダーサーフェスを所有し、core は機能コントラクトとフォールバック動作を所有します。

動画生成もすでに同じシーケンスを使用しています。core が型付き機能コントラクトとランタイムヘルパーを所有し、ベンダー Plugin がそれに対して `api.registerVideoGenerationProvider(...)` 実装を登録します。

具体的なロールアウトチェックリストが必要な場合は、[機能 Cookbook](/ja-JP/plugins/adding-capabilities)を参照してください。

## コントラクトと強制

Plugin API サーフェスは、意図的に `OpenClawPluginApi` に型付けされ集約されています。そのコントラクトは、サポートされる登録ポイントと、Plugin が依存できるランタイムヘルパーを定義します。

これが重要な理由は次のとおりです。

- Plugin 作者は安定した内部標準を 1 つ得られます
- core は、2 つの Plugin が同じプロバイダー id を登録するような所有権の重複を拒否できます
- 起動時に、不正な登録に対する実行可能な診断を表示できます
- コントラクトテストにより、バンドル Plugin の所有権を強制し、静かなドリフトを防げます

強制には 2 つのレイヤーがあります。

<AccordionGroup>
  <Accordion title="ランタイム登録の強制">
    Plugin レジストリは、プラグインの読み込み時に登録を検証します。例: 重複したプロバイダー ID、重複した音声プロバイダー ID、不正な形式の登録は、未定義の動作ではなくプラグイン診断を生成します。
  </Accordion>
  <Accordion title="コントラクトテスト">
    バンドル済みプラグインは、テスト実行中にコントラクトレジストリへ取り込まれるため、OpenClaw は所有権を明示的にアサートできます。現在これは、モデルプロバイダー、音声プロバイダー、Web 検索プロバイダー、バンドル済み登録の所有権に使用されています。
  </Accordion>
</AccordionGroup>

実際の効果として、OpenClaw はどのプラグインがどのサーフェスを所有しているかを事前に把握できます。これにより、所有権が暗黙ではなく、宣言され、型付けされ、テスト可能になるため、コアとチャネルをシームレスに組み合わせられます。

### コントラクトに含めるべきもの

<Tabs>
  <Tab title="良いコントラクト">
    - 型付けされている
    - 小さい
    - 機能固有
    - コアが所有する
    - 複数のプラグインで再利用できる
    - ベンダー知識なしでチャネルや機能が利用できる

  </Tab>
  <Tab title="悪いコントラクト">
    - コアに隠されたベンダー固有のポリシー
    - レジストリを迂回する一回限りのプラグイン脱出口
    - ベンダー実装へ直接アクセスするチャネルコード
    - `OpenClawPluginApi` または `api.runtime` の一部ではないアドホックなランタイムオブジェクト

  </Tab>
</Tabs>

迷った場合は、抽象化レベルを上げてください。まず機能を定義し、それからプラグインがそこに接続できるようにします。

## 実行モデル

ネイティブ OpenClaw プラグインは Gateway と同じ**プロセス内**で実行されます。サンドボックス化されていません。読み込まれたネイティブプラグインは、コアコードと同じプロセスレベルの信頼境界を持ちます。

<Warning>
ネイティブプラグインの影響: プラグインはツール、ネットワークハンドラー、フック、サービスを登録できます。プラグインのバグによって Gateway がクラッシュしたり不安定化したりする可能性があります。また、悪意のあるネイティブプラグインは、OpenClaw プロセス内での任意コード実行と同等です。
</Warning>

互換バンドルは、OpenClaw が現在それらをメタデータ/コンテンツパックとして扱うため、デフォルトでより安全です。現在のリリースでは、これは主にバンドル済み Skills を意味します。

バンドルされていないプラグインには、許可リストと明示的なインストール/読み込みパスを使用してください。ワークスペースプラグインは開発時のコードとして扱い、本番環境のデフォルトとして扱わないでください。

バンドル済みワークスペースパッケージ名では、プラグイン ID を npm 名に固定してください。デフォルトでは `@openclaw/<id>`、またはパッケージが意図的により狭いプラグインロールを公開する場合は、`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` などの承認済みの型付きサフィックスを使用します。

<Note>
**信頼に関する注意:** `plugins.allow` はソースの由来ではなく、**プラグイン ID**を信頼します。バンドル済みプラグインと同じ ID を持つワークスペースプラグインは、そのワークスペースプラグインが有効化/許可リスト登録されている場合、意図的にバンドル済みコピーをシャドウします。これは通常の動作であり、ローカル開発、パッチテスト、ホットフィックスに有用です。バンドル済みプラグインの信頼は、インストールメタデータではなく、読み込み時点のディスク上のマニフェストとコードというソーススナップショットから解決されます。破損または置換されたインストール記録によって、バンドル済みプラグインの信頼サーフェスが実際のソースの主張を超えて暗黙に広がることはありません。
</Note>

## エクスポート境界

OpenClaw がエクスポートするのは機能であり、実装上の利便性ではありません。

機能登録は公開したままにします。コントラクトではないヘルパーエクスポートは削減してください。

- バンドル済みプラグイン固有のヘルパーサブパス
- パブリック API として意図されていないランタイム配管サブパス
- ベンダー固有の利便ヘルパー
- 実装詳細であるセットアップ/オンボーディングヘルパー

予約済みのバンドル済みプラグインヘルパーサブパスは、生成された SDK エクスポートマップから廃止されました。所有者固有のヘルパーは所有元のプラグインパッケージ内に保持してください。再利用可能なホスト動作だけを、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトへ昇格させます。

## 内部構造とリファレンス

読み込みパイプライン、レジストリモデル、プロバイダーランタイムフック、Gateway HTTP ルート、メッセージツールスキーマ、チャネルターゲット解決、プロバイダーカタログ、コンテキストエンジンプラグイン、新しい機能を追加するためのガイドについては、[プラグインアーキテクチャの内部構造](/ja-JP/plugins/architecture-internals)を参照してください。

## 関連

- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [プラグインマニフェスト](/ja-JP/plugins/manifest)
- [プラグイン SDK セットアップ](/ja-JP/plugins/sdk-setup)
