---
read_when:
    - ネイティブ OpenClaw Plugin のビルドまたはデバッグ
    - Plugin のケイパビリティモデルまたは所有権の境界を理解する
    - Plugin の読み込みパイプラインまたはレジストリに取り組む
    - プロバイダーランタイムフックまたはチャネルPluginの実装
sidebarTitle: Internals
summary: Plugin の内部構造：ケイパビリティモデル、所有権、コントラクト、読み込みパイプライン、ランタイムヘルパー
title: Plugin の内部構造
x-i18n:
    generated_at: "2026-07-11T22:26:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

これは OpenClaw Plugin システムの**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、以下の目的別ページのいずれかから始めてください。

<CardGroup cols={2}>
  <Card title="Plugin のインストールと使用" icon="plug" href="/ja-JP/tools/plugin">
    Plugin の追加、有効化、トラブルシューティングを行うエンドユーザー向けガイド。
  </Card>
  <Card title="Plugin の構築" icon="rocket" href="/ja-JP/plugins/building-plugins">
    最小限の動作するマニフェストを使用した、最初の Plugin のチュートリアル。
  </Card>
  <Card title="チャンネル Plugin" icon="comments" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築します。
  </Card>
  <Card title="プロバイダー Plugin" icon="microchip" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築します。
  </Card>
  <Card title="SDK の概要" icon="book" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録 API のリファレンス。
  </Card>
</CardGroup>

## 公開ケイパビリティモデル

ケイパビリティは、OpenClaw 内部の公開**ネイティブ Plugin**モデルです。すべてのネイティブ OpenClaw Plugin は、1 つ以上のケイパビリティ種別に対して登録されます。

| ケイパビリティ         | 登録メソッド                                     | Plugin の例                         |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| テキスト推論           | `api.registerProvider(...)`                      | `anthropic`, `openai`               |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | `anthropic`, `openai`               |
| 埋め込み               | `api.registerEmbeddingProvider(...)`             | プロバイダー所有のベクトル Plugin   |
| 音声                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`                  |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`                  |
| トランスクリプトソース | `api.registerTranscriptSourceProvider(...)`      | `discord`                           |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`           |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`          |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`             |
| Web 取得               | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Web 検索               | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`      |
| チャンネル / メッセージング | `api.registerChannel(...)`                   | `matrix`, `msteams`                 |
| Gateway 検出           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                           |

<Note>
ケイパビリティを 1 つも登録せず、フック、ツール、検出サービス、またはバックグラウンドサービスを提供する Plugin は、**レガシーなフック専用** Plugin です。このパターンは現在も完全にサポートされています。
</Note>

### 外部互換性に対する方針

ケイパビリティモデルはコアに導入済みで、現在バンドル済みおよびネイティブ Plugin で使用されています。ただし、外部 Plugin の互換性については、「エクスポートされているため固定されている」と見なすよりも厳格な基準が必要です。

| Plugin の状況                                   | ガイダンス                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 既存の外部 Plugin                              | フックベースの統合を動作させ続けます。これが互換性の基準です。                                                  |
| 新しいバンドル済み / ネイティブ Plugin         | ベンダー固有の内部アクセスや新しいフック専用設計より、明示的なケイパビリティ登録を優先します。                  |
| ケイパビリティ登録を採用する外部 Plugin        | 許可されますが、ドキュメントで安定版と明記されていない限り、ケイパビリティ固有のヘルパーサーフェスは発展途上として扱ってください。 |

ケイパビリティ登録が目指す方向です。移行期間中、外部 Plugin にとってレガシーフックは引き続き最も安全で破壊的変更のない経路です。エクスポートされたヘルパーのサブパスはすべて同等ではありません。付随的なヘルパーのエクスポートより、範囲が限定され文書化された契約を優先してください。

### Plugin の形態

OpenClaw は、読み込まれたすべての Plugin を、静的メタデータだけではなく、実際の登録動作に基づいて形態に分類します。

<AccordionGroup>
  <Accordion title="plain-capability">
    ケイパビリティ種別を正確に 1 つ登録します（例: `arcee` や `chutes` のようなプロバイダー専用 Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    複数のケイパビリティ種別を登録します（例: `openai` はテキスト推論、音声、メディア理解、画像生成を所有します）。
  </Accordion>
  <Accordion title="hook-only">
    フック（型付きまたはカスタム）のみを登録し、ケイパビリティ、ツール、コマンド、サービスは登録しません。
  </Accordion>
  <Accordion title="non-capability">
    ツール、コマンド、サービス、またはルートを登録しますが、ケイパビリティは登録しません。
  </Accordion>
</AccordionGroup>

Plugin の形態とケイパビリティの内訳を確認するには、`openclaw plugins inspect <id>` を使用します。詳細は [CLI リファレンス](/ja-JP/cli/plugins#inspect)を参照してください。

### レガシーフック

`before_agent_start` フックは、フック専用 Plugin の互換経路として引き続きサポートされます。実環境で使用されているレガシー Plugin は、現在もこのフックに依存しています。

方針:

- 動作を維持する
- レガシーとして文書化する
- モデル / プロバイダーの上書きには `before_model_resolve` を優先する
- プロンプトの変更には `before_prompt_build` を優先する
- 実際の使用が減少し、フィクスチャのカバレッジによって移行の安全性が証明された後にのみ削除する

### 互換性シグナル

`openclaw doctor`、`openclaw plugins inspect <id>`、`openclaw status --all`、`openclaw plugins doctor` は、以下の互換性通知を表示します。

| シグナル                                   | 意味                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **設定が有効**                             | 設定が正常に解析され、Plugin が解決されています                                                                              |
| **フック専用**（情報）                     | Plugin はフックのみを登録しています。サポートされている経路ですが、ケイパビリティ登録にはまだ移行されていません              |
| **レガシー `before_agent_start`**（警告）  | Plugin は `before_model_resolve` / `before_prompt_build` ではなく、非推奨の `before_agent_start` フックを使用しています       |
| **非推奨のメモリ埋め込み API**（警告）     | バンドルされていない Plugin が、`registerEmbeddingProvider` ではなく旧式のメモリ固有埋め込みプロバイダー API を使用しています |
| **重大なエラー**                           | 設定が無効であるか、Plugin の読み込みに失敗しました                                                                           |

現在、助言および警告のシグナルによって Plugin が動作しなくなることはありません。これらのシグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャの概要

OpenClaw の Plugin システムには 4 つのレイヤーがあります。

<Steps>
  <Step title="マニフェストと検出">
    OpenClaw は、設定されたパス、ワークスペースルート、グローバル Plugin ルート、バンドル済み Plugin から候補 Plugin を検索します。検出では、まずネイティブの `openclaw.plugin.json` マニフェストと、サポート対象のバンドルマニフェストを読み取ります。
  </Step>
  <Step title="有効化と検証">
    コアは、検出された Plugin が有効、無効、ブロック済み、またはメモリなどの排他的スロット用に選択されているかを判断します。
  </Step>
  <Step title="ランタイム読み込み">
    ネイティブ OpenClaw Plugin はプロセス内で読み込まれ、ケイパビリティを中央レジストリに登録します。パッケージ化された JavaScript はネイティブの `require` を通じて読み込まれます。サードパーティのローカルソース TypeScript には、緊急時のフォールバックとして Jiti が使用されます。互換性のあるバンドルは、ランタイムコードをインポートせずにレジストリレコードへ正規化されます。
  </Step>
  <Step title="サーフェスの利用">
    OpenClaw のその他の部分はレジストリを読み取り、ツール、チャンネル、プロバイダー設定、フック、HTTP ルート、CLI コマンド、サービスを公開します。
  </Step>
</Steps>

特に Plugin CLI では、ルートコマンドの検出が 2 つのフェーズに分かれています。

- 解析時のメタデータは `registerCli(..., { descriptors: [...] })` から取得される
- 実際の Plugin CLI モジュールは遅延読み込みのままにでき、最初の呼び出し時に登録される

これにより、Plugin 所有の CLI コードを Plugin 内部に維持しながら、OpenClaw は解析前にルートコマンド名を予約できます。

重要な設計境界:

- マニフェスト / 設定の検証は、Plugin コードを実行せずに**マニフェスト / スキーマメタデータ**から動作する必要がある
- ネイティブケイパビリティの検出では、信頼された Plugin のエントリコードを読み込み、アクティブ化を伴わないレジストリスナップショットを構築できる
- ネイティブのランタイム動作は、`api.registrationMode === "full"` の状態で Plugin モジュールの `register(api)` 経路から提供される

この分離により、OpenClaw は完全なランタイムがアクティブになる前に、設定を検証し、見つからないまたは無効化された Plugin を説明し、UI / スキーマのヒントを構築できます。

### Plugin メタデータスナップショットとルックアップテーブル

Gateway の起動時に、現在の設定スナップショット用として 1 つの `PluginMetadataSnapshot` が構築されます。このスナップショットにはメタデータのみが含まれます。インストール済み Plugin インデックス、マニフェストレジストリ、マニフェスト診断、所有者マップ、Plugin ID ノーマライザー、マニフェストレコードが保存されます。読み込まれた Plugin モジュール、プロバイダー SDK、パッケージ内容、ランタイムエクスポートは保持されません。

Plugin を認識する設定検証、起動時の自動有効化、Gateway の Plugin ブートストラップは、マニフェスト / インデックスのメタデータを個別に再構築する代わりに、このスナップショットを使用します。`PluginLookUpTable` は同じスナップショットから派生し、現在のランタイム設定用の起動 Plugin プランを追加します。

起動後、Gateway は現在のメタデータスナップショットを交換可能なランタイム生成物として保持します。ランタイムで繰り返されるプロバイダー検出は、プロバイダーカタログの各走査でインストール済みインデックスとマニフェストレジストリを再構築する代わりに、そのスナップショットを借用できます。スナップショットは、Gateway のシャットダウン、設定 / Plugin インベントリの変更、インストール済みインデックスへの書き込み時に消去または置換されます。互換性のある現在のスナップショットが存在しない場合、呼び出し元はコールドなマニフェスト / インデックス経路にフォールバックします。互換性チェックには、`plugins.load.paths` や既定のエージェントワークスペースなどの Plugin 検出ルートを含める必要があります。ワークスペース Plugin はメタデータの対象範囲に含まれるためです。

スナップショットとルックアップテーブルにより、起動時に繰り返される以下の判断が高速経路に維持されます。

- チャンネルの所有権
- 遅延されたチャンネル起動
- 起動時の Plugin ID
- プロバイダーと CLI バックエンドの所有権
- セットアッププロバイダー、コマンドエイリアス、モデルカタログプロバイダー、マニフェスト契約の所有権
- Plugin 設定スキーマとチャンネル設定スキーマの検証
- 起動時の自動有効化に関する判断

安全性の境界はスナップショットの変更ではなく、置換です。設定、Plugin インベントリ、インストールレコード、または永続化されたインデックスポリシーが変更された場合は、スナップショットを再構築してください。これを広範な可変グローバルレジストリとして扱わず、履歴スナップショットを無制限に保持しないでください。ランタイム Plugin の読み込みはメタデータスナップショットから分離されたままであるため、古いランタイム状態がメタデータキャッシュの背後に隠されることはありません。

キャッシュの規則は [Plugin アーキテクチャの内部構造](/ja-JP/plugins/architecture-internals#plugin-cache-boundary)に記載されています。マニフェストおよび検出メタデータは、呼び出し元が現在のフロー用の明示的なスナップショット、ルックアップテーブル、またはマニフェストレジストリを保持していない限り、常に最新です。隠れたメタデータキャッシュと実時間ベースの TTL は、Plugin 読み込みには含まれません。ランタイムローダー、モジュール、依存関係アーティファクトのキャッシュのみが、コードまたはインストール済みアーティファクトが実際に読み込まれた後も存続できます。

一部のコールド経路の呼び出し元は、Gateway の `PluginLookUpTable` を受け取る代わりに、永続化されたインストール済み Plugin インデックスからマニフェストレジストリを直接再構築しています。この経路では現在、要求に応じてレジストリを再構築します。呼び出し元がすでに現在のルックアップテーブルまたは明示的なマニフェストレジストリを保持している場合は、ランタイムフローを通じてそれを渡すことを優先してください。

### アクティベーション計画

アクティベーション計画はコントロールプレーンの一部です。呼び出し元は、より広範なランタイムレジストリを読み込む前に、具体的なコマンド、プロバイダー、チャンネル、ルート、エージェントハーネス、またはケイパビリティに関連するPluginを問い合わせることができます。

プランナーは、現在のマニフェストの動作との互換性を維持します。

- `activation.*` フィールドは明示的なプランナーヒントです
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、およびフックは、引き続きマニフェスト所有権によるフォールバックとして機能します
- IDのみを返すプランナーAPIは、既存の呼び出し元向けに引き続き利用できます
- 計画APIは理由ラベルを報告するため、診断時に明示的なヒントと所有権によるフォールバックを区別できます

<Warning>
`activation` をライフサイクルフックや `register(...)` の代替として扱わないでください。これは読み込み範囲を絞るために使用されるメタデータです。所有権フィールドですでに関係を記述できる場合はそちらを優先し、`activation` は追加のプランナーヒントにのみ使用してください。
</Warning>

### チャンネルPluginと共有メッセージツール

通常のチャット操作のために、チャンネルPluginが個別の送信・編集・リアクションツールを登録する必要はありません。OpenClawはコアに1つの共有 `message` ツールを保持し、その背後にあるチャンネル固有の検出と実行はチャンネルPluginが所有します。

現在の境界は次のとおりです。

- コアは、共有 `message` ツールのホスト、プロンプト配線、セッションおよびスレッドの管理、実行ディスパッチを所有します
- チャンネルPluginは、スコープ付きアクションの検出、ケイパビリティの検出、チャンネル固有のスキーマ断片を所有します
- チャンネルPluginは、会話IDでスレッドIDをどのようにエンコードするか、親会話からどのように継承するかなど、プロバイダー固有のセッション会話文法を所有します
- チャンネルPluginは、アクションアダプターを通じて最終アクションを実行します

チャンネルPlugin向けのSDKサーフェスは `ChannelMessageActionAdapter.describeMessageTool(...)` です。この統合された検出呼び出しにより、Pluginは可視アクション、ケイパビリティ、スキーマへの寄与をまとめて返せるため、これらの要素が互いに乖離することを防げます。

チャンネル固有のメッセージツールパラメーターがローカルパスやリモートメディアURLなどのメディアソースを持つ場合、Pluginは `describeMessageTool(...)` から `mediaSourceParams` も返す必要があります。コアはこの明示的なリストを使用して、Pluginが所有するパラメーター名をハードコードせずに、サンドボックスパスの正規化と送信メディアへのアクセスヒントを適用します。チャンネル全体にわたる単一のフラットなリストではなく、アクション単位のマップを優先してください。これにより、プロフィール専用のメディアパラメーターが `send` などの無関係なアクションで正規化されることを防げます。

コアはランタイムスコープをその検出ステップに渡します。重要なフィールドは次のとおりです。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼された受信 `requesterSenderId`

これは、コンテキスト依存のPluginにとって重要です。チャンネルは、コアの `message` ツールにチャンネル固有の分岐をハードコードすることなく、アクティブなアカウント、現在のルーム・スレッド・メッセージ、または信頼されたリクエスターのIDに基づいて、メッセージアクションを非表示または表示できます。

このため、埋め込みランナーのルーティング変更も引き続きPlugin側の作業です。ランナーは現在のチャットおよびセッションのIDをPluginの検出境界に転送し、共有 `message` ツールが現在のターンに適したチャンネル所有のサーフェスを公開できるようにする責任があります。

チャンネル所有の実行ヘルパーについては、同梱Pluginは実行ランタイムを自身のPluginモジュール内に保持する必要があります。コアは、`src/agents/tools` 配下のDiscord、Slack、Telegram、WhatsAppのメッセージアクションランタイムを所有しなくなりました。個別の `plugin-sdk/*-action-runtime` サブパスは公開しておらず、同梱Pluginは自身が所有するPluginモジュールからローカルのランタイムコードを直接インポートする必要があります。

同じ境界は、一般にプロバイダー名を冠したSDKの接続面にも適用されます。コアは、Discord、Signal、Slack、WhatsApp、または同様のPlugin向けのチャンネル固有の便利なバレルをインポートすべきではありません。コアがある動作を必要とする場合は、同梱Plugin自身の `api.ts` / `runtime-api.ts` バレルを使用するか、その要件を共有SDKの限定的で汎用的なケイパビリティへ昇格させます。

同梱Pluginにも同じルールが適用されます。同梱Pluginの `runtime-api.ts` は、自身のブランド名を持つ `openclaw/plugin-sdk/<plugin-id>` ファサードを再エクスポートすべきではありません。これらのブランド名付きファサードは、外部Pluginや古い利用者向けの互換性シムとして残りますが、同梱Pluginはローカルエクスポートに加えて、`openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/webhook-ingress` などの限定的で汎用的なSDKサブパスを使用する必要があります。既存の外部エコシステムとの互換性境界で必要とされない限り、新しいコードでPlugin ID固有のSDKファサードを追加すべきではありません。

投票には、具体的に2つの実行パスがあります。

- `outbound.sendPoll` は、共通の投票モデルに適合するチャンネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャンネル固有の投票セマンティクスや追加の投票パラメーターに推奨されるパスです

コアは、Pluginの投票ディスパッチがアクションを処理しないと判断するまで、共有の投票解析を遅延するようになりました。これにより、Plugin所有の投票ハンドラーは、汎用投票パーサーによって先にブロックされることなく、チャンネル固有の投票フィールドを受け入れられます。

起動シーケンス全体については、[Pluginアーキテクチャの内部構造](/ja-JP/plugins/architecture-internals)を参照してください。

## ケイパビリティ所有権モデル

OpenClawはネイティブPluginを、無関係な統合機能の寄せ集めではなく、**企業**または**機能**の所有権境界として扱います。

これは、次のことを意味します。

- 企業Pluginは通常、その企業がOpenClawに提供するすべてのサーフェスを所有すべきです
- 機能Pluginは通常、自身が導入する機能サーフェス全体を所有すべきです
- チャンネルは、プロバイダーの動作を場当たり的に再実装するのではなく、共有コアケイパビリティを利用すべきです

<AccordionGroup>
  <Accordion title="ベンダーの複数ケイパビリティ">
    `google` はテキスト推論、CLIバックエンド、埋め込み、音声、リアルタイム音声、メディア理解、画像・音楽・動画生成、ウェブ検索を所有します。`openai` はテキスト推論、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像・動画生成を所有します。`minimax` はテキスト推論に加えて、メディア理解、音声、画像・音楽・動画生成、ウェブ検索を所有します。
  </Accordion>
  <Accordion title="ベンダーの単一ケイパビリティ">
    `arcee` と `chutes` はテキスト推論のみを所有し、`microsoft` は音声のみを所有します。ベンダーPluginは、そのベンダーのより広いサーフェスを扱う必要が生じるまで、この限定的な範囲を維持できます。
  </Accordion>
  <Accordion title="機能Plugin">
    `voice-call` は通話トランスポート、ツール、CLI、ルート、Twilioメディアストリームのブリッジを所有しますが、ベンダーPluginを直接インポートする代わりに、共有の音声、リアルタイム文字起こし、リアルタイム音声ケイパビリティを利用します。
  </Accordion>
</AccordionGroup>

目指す最終状態は次のとおりです。

- ベンダーがOpenClawに提供するサーフェスは、テキストモデル、音声、画像、動画にまたがる場合でも、1つのPlugin内に置かれます
- 他のベンダーも、それぞれのサーフェス領域について同じことを行えます
- チャンネルは、どのベンダーPluginがプロバイダーを所有しているかを意識せず、コアが公開する共有ケイパビリティ契約を利用します

重要な違いは次のとおりです。

- **Plugin** = 所有権境界
- **ケイパビリティ** = 複数のPluginが実装または利用できるコア契約

したがって、OpenClawが動画などの新しいドメインを追加する場合、最初の問いは「どのプロバイダーが動画処理をハードコードすべきか」ではありません。最初の問いは「コアの動画ケイパビリティ契約とは何か」です。その契約が存在すれば、ベンダーPluginはそれに対して登録でき、チャンネルおよび機能Pluginはそれを利用できます。

ケイパビリティがまだ存在しない場合、通常は次の手順が適切です。

<Steps>
  <Step title="ケイパビリティを定義する">
    不足しているケイパビリティをコアで定義します。
  </Step>
  <Step title="SDKを通じて公開する">
    Plugin APIおよびランタイムを通じて、型付きの形で公開します。
  </Step>
  <Step title="利用側を配線する">
    チャンネルおよび機能をそのケイパビリティに接続します。
  </Step>
  <Step title="ベンダー実装">
    ベンダーPluginが実装を登録できるようにします。
  </Step>
</Steps>

これにより、単一のベンダーや一度限りのPlugin固有コードパスに依存するコア動作を避けながら、所有権を明示できます。

### ケイパビリティのレイヤー構造

コードの配置先を決定するときは、次のメンタルモデルを使用してください。

<Tabs>
  <Tab title="コアケイパビリティ層">
    共有オーケストレーション、ポリシー、フォールバック、設定のマージ規則、配信セマンティクス、型付き契約。
  </Tab>
  <Tab title="ベンダーPlugin層">
    ベンダー固有のAPI、認証、モデルカタログ、音声合成、画像生成、動画バックエンド、使用量エンドポイント。
  </Tab>
  <Tab title="チャンネル・機能Plugin層">
    コアケイパビリティを利用し、サーフェス上に提示するDiscord・Slack・音声通話などの統合。
  </Tab>
</Tabs>

たとえば、TTSはこの構造に従います。

- コアは、返信時のTTSポリシー、フォールバック順序、設定、チャンネル配信を所有します
- `elevenlabs`、`google`、`microsoft`、`openai` は合成実装を所有します
- `voice-call` は電話向けTTSランタイムヘルパーを利用します

今後のケイパビリティでも、同じパターンを優先すべきです。

### 複数ケイパビリティを持つ企業Pluginの例

企業Pluginは、外部から見て一貫性のあるものにすべきです。OpenClawがモデル、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、ウェブ取得、ウェブ検索の共有契約を持つ場合、ベンダーは自身のすべてのサーフェスを1か所で所有できます。

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

重要なのは、正確なヘルパー名ではありません。構造が重要です。

- 1つのPluginがベンダーのサーフェスを所有します
- コアは引き続きケイパビリティ契約を所有します
- チャンネルおよび機能Pluginは、ベンダーコードではなく `api.runtime.*` ヘルパーを利用します
- 契約テストでは、Pluginが所有すると表明したケイパビリティを登録していることを検証できます

### ケイパビリティの例：動画理解

OpenClawはすでに、画像・音声・動画の理解を1つの共有ケイパビリティとして扱っています。そこでも同じ所有権モデルが適用されます。

<Steps>
  <Step title="コアが契約を定義する">
    コアがメディア理解契約を定義します。
  </Step>
  <Step title="ベンダーPluginが登録する">
    ベンダーPluginは、該当する場合に `describeImage`、`transcribeAudio`、`describeVideo` を登録します。
  </Step>
  <Step title="利用側が共有動作を使用する">
    チャンネルおよび機能Pluginは、ベンダーコードに直接接続する代わりに、共有コア動作を利用します。
  </Step>
</Steps>

これにより、あるプロバイダーの動画に関する前提をコアへ組み込むことを避けられます。Pluginはベンダーのサーフェスを所有し、コアはケイパビリティ契約とフォールバック動作を所有します。

動画生成では、すでに同じ流れを採用しています。コアが型付きケイパビリティ契約とランタイムヘルパーを所有し、ベンダーPluginがそれに対して `api.registerVideoGenerationProvider(...)` の実装を登録します。

具体的な展開チェックリストが必要ですか？[ケイパビリティ・クックブック](/ja-JP/plugins/adding-capabilities)を参照してください。

## 契約と適用

Plugin API サーフェスは、意図的に型付けされ、`OpenClawPluginApi` に一元化されています。このコントラクトは、サポートされる登録ポイントと、Plugin が利用できるランタイムヘルパーを定義します。

これが重要な理由：

- Plugin 作者が単一の安定した内部標準を利用できる
- 同じプロバイダー ID を 2 つの Plugin が登録するような所有権の重複をコアが拒否できる
- 不正な形式の登録に対して、起動時に対処可能な診断を提示できる
- コントラクトテストによって、同梱 Plugin の所有権を強制し、気付かないままの乖離を防止できる

適用には 2 つの層があります：

<AccordionGroup>
  <Accordion title="ランタイム登録の適用">
    Plugin の読み込み時に、Plugin レジストリが登録を検証します。たとえば、プロバイダー ID の重複、音声プロバイダー ID の重複、不正な形式の登録では、未定義の動作ではなく Plugin の診断情報が生成されます。
  </Accordion>
  <Accordion title="コントラクトテスト">
    OpenClaw が所有権を明示的に表明できるように、テスト実行時に同梱 Plugin がコントラクトレジストリへ取り込まれます。現在、これはモデルプロバイダー、音声プロバイダー、ウェブ検索プロバイダー、および同梱される登録の所有権に使用されています。
  </Accordion>
</AccordionGroup>

実際の効果として、OpenClaw はどの Plugin がどのサーフェスを所有するかを事前に把握できます。所有権が暗黙的ではなく、宣言され、型付けされ、テスト可能であるため、コアとチャネルをシームレスに構成できます。

### コントラクトに含めるべきもの

<Tabs>
  <Tab title="良いコントラクト">
    - 型付けされている
    - 小さい
    - ケイパビリティに特化している
    - コアが所有している
    - 複数の Plugin で再利用できる
    - ベンダーに関する知識がなくてもチャネルや機能から利用できる

  </Tab>
  <Tab title="悪いコントラクト">
    - コアに隠されたベンダー固有のポリシー
    - レジストリを迂回する単発の Plugin 用エスケープハッチ
    - ベンダー実装を直接参照するチャネルコード
    - `OpenClawPluginApi` または `api.runtime` の一部ではない場当たり的なランタイムオブジェクト

  </Tab>
</Tabs>

迷った場合は、抽象化レベルを引き上げます。まずケイパビリティを定義し、その後で Plugin がそこへ接続できるようにします。

## 実行モデル

ネイティブ OpenClaw Plugin は Gateway と同じ**プロセス内**で実行されます。サンドボックス化されていません。読み込まれたネイティブ Plugin は、コアコードと同じプロセスレベルの信頼境界を持ちます。

<Warning>
ネイティブ Plugin の影響：Plugin はツール、ネットワークハンドラー、フック、サービスを登録できます。Plugin のバグによって Gateway がクラッシュしたり不安定になったりする可能性があります。また、悪意のあるネイティブ Plugin は、OpenClaw プロセス内での任意コード実行と同等です。
</Warning>

互換バンドルは、OpenClaw が現在それらをメタデータまたはコンテンツパックとして扱うため、デフォルトではより安全です。現在のリリースでは、主に同梱 Skills を意味します。

同梱されていない Plugin には、許可リストと明示的なインストール／読み込みパスを使用してください。ワークスペース Plugin は本番環境のデフォルトではなく、開発時のコードとして扱ってください。

同梱ワークスペースパッケージ名では、Plugin ID を npm 名に基づかせてください。デフォルトでは `@openclaw/<id>` を使用します。パッケージが意図的に限定された Plugin の役割を公開する場合は、`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding` など、承認された型付きサフィックスを使用できます。

<Note>
**信頼に関する注意：** `plugins.allow` が信頼するのは、ソースの来歴ではなく **Plugin ID** です。同梱 Plugin と同じ ID を持つワークスペース Plugin は、そのワークスペース Plugin が有効化され、許可リストに追加されると、意図的に同梱コピーを上書きします。これは通常の動作であり、ローカル開発、パッチテスト、ホットフィックスに役立ちます。同梱 Plugin の信頼は、インストールメタデータではなく、読み込み時にディスク上に存在するマニフェストとコードというソーススナップショットから解決されます。インストール記録が破損または差し替えられていても、実際のソースが表明する範囲を超えて、同梱 Plugin の信頼サーフェスが密かに拡大されることはありません。
</Note>

## エクスポート境界

OpenClaw は、実装上の利便性ではなく、ケイパビリティをエクスポートします。

ケイパビリティの登録は公開したままにしてください。コントラクトではないヘルパーのエクスポートは削減してください：

- 同梱 Plugin 固有のヘルパーサブパス
- 公開 API として意図されていないランタイム配管用サブパス
- ベンダー固有の便利なヘルパー
- 実装の詳細であるセットアップ／オンボーディング用ヘルパー

予約されていた同梱 Plugin のヘルパーサブパスは、生成される SDK エクスポートマップから廃止されました。所有者固有のヘルパーは、所有する Plugin パッケージ内に保持してください。再利用可能なホスト動作のみを、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトへ昇格させてください。

## 内部構造とリファレンス

読み込みパイプライン、レジストリモデル、プロバイダーのランタイムフック、Gateway HTTP ルート、メッセージツールのスキーマ、チャネルターゲットの解決、プロバイダーカタログ、コンテキストエンジン Plugin、および新しいケイパビリティを追加するためのガイドについては、[Plugin アーキテクチャの内部構造](/ja-JP/plugins/architecture-internals)を参照してください。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
