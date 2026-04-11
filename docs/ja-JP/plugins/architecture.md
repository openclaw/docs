---
read_when:
    - ネイティブなOpenClawプラグインのビルドまたはデバッグ
    - プラグインの機能モデルまたは所有権の境界を理解すること
    - プラグインのロードパイプラインまたはレジストリに取り組むこと
    - プロバイダーのランタイムフックまたはチャネルプラグインの実装
sidebarTitle: Internals
summary: 'プラグイン内部: 機能モデル、所有権、コントラクト、ロードパイプライン、ランタイムヘルパー'
title: プラグイン内部
x-i18n:
    generated_at: "2026-04-11T15:16:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cac67984d0d729c0905bcf5c18372fb0d9b02bbd3a531580b7e2ef483ef40a6
    source_path: plugins/architecture.md
    workflow: 15
---

# プラグイン内部

<Info>
  これは**詳細なアーキテクチャリファレンス**です。実践的なガイドについては、以下を参照してください。
  - [プラグインのインストールと使用](/ja-JP/tools/plugin) — ユーザーガイド
  - [はじめに](/ja-JP/plugins/building-plugins) — 最初のプラグインチュートリアル
  - [チャネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) — メッセージングチャネルを構築する
  - [プロバイダープラグイン](/ja-JP/plugins/sdk-provider-plugins) — モデルプロバイダーを構築する
  - [SDK 概要](/ja-JP/plugins/sdk-overview) — インポートマップと登録 API
</Info>

このページでは、OpenClawプラグインシステムの内部アーキテクチャについて説明します。

## 公開機能モデル

機能は、OpenClaw内部における公開の**ネイティブプラグイン**モデルです。すべての
ネイティブOpenClawプラグインは、1つ以上の機能タイプに対して登録されます。

| 機能                   | 登録方法                                         | プラグイン例                         |
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
| Webフェッチ            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web検索                | `api.registerWebSearchProvider(...)`             | `google`                             |
| チャネル / メッセージ  | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

機能を1つも登録せず、フック、ツール、またはサービスを提供するプラグインは、
**従来型の hook-only** プラグインです。このパターンは現在も完全にサポートされています。

### 外部互換性の立場

機能モデルはすでにコアに導入されており、現在バンドル済み / ネイティブプラグインで
使われていますが、外部プラグインの互換性については、「exportされているので凍結済み」
という基準よりも厳密な基準が依然として必要です。

現在のガイダンス:

- **既存の外部プラグイン:** フックベースの統合を動作し続けるようにすること。
  これを互換性の基準と見なします
- **新しいバンドル済み / ネイティブプラグイン:** ベンダー固有の内部参照や
  新たな hook-only 設計ではなく、明示的な機能登録を優先します
- **機能登録を採用する外部プラグイン:** 許可されていますが、ドキュメントで
  明示的に安定したコントラクトと示されていない限り、機能固有のヘルパー
  サーフェスは進化中のものとして扱ってください

実用的なルール:

- 機能登録 API は意図された方向性です
- 移行期間中、従来型フックは外部プラグインにとって最も安全で、
  破壊的変更のない経路のままです
- exportされたヘルパーのサブパスはすべて同等ではありません。偶発的に
  exportされているヘルパーではなく、ドキュメント化された狭いコントラクトを
  優先してください

### プラグイン形状

OpenClawは、ロードされた各プラグインを、実際の登録動作に基づいて形状分類します
（静的メタデータだけではありません）。

- **plain-capability** -- ちょうど1つの機能タイプだけを登録します
  （たとえば `mistral` のような provider-only プラグイン）
- **hybrid-capability** -- 複数の機能タイプを登録します
  （たとえば `openai` はテキスト推論、音声、メディア理解、画像生成を所有します）
- **hook-only** -- フックのみを登録し（型付きまたはカスタム）、機能、ツール、
  コマンド、サービスは登録しません
- **non-capability** -- ツール、コマンド、サービス、またはルートを登録しますが、
  機能は登録しません

プラグインの形状と機能の内訳を確認するには、`openclaw plugins inspect <id>` を使用してください。
詳細は [CLI リファレンス](/cli/plugins#inspect) を参照してください。

### 従来型フック

`before_agent_start` フックは、hook-only プラグイン向けの互換性パスとして引き続き
サポートされています。実際の従来型プラグインは今でもこれに依存しています。

方向性:

- 動作し続けるようにする
- 従来型として文書化する
- モデル / プロバイダーのオーバーライド作業には `before_model_resolve` を優先する
- プロンプト変更作業には `before_prompt_build` を優先する
- 実使用が減少し、fixtureカバレッジによって移行の安全性が証明されてからのみ削除する

### 互換性シグナル

`openclaw doctor` または `openclaw plugins inspect <id>` を実行すると、
次のいずれかのラベルが表示されることがあります。

| シグナル                 | 意味                                                         |
| ------------------------ | ------------------------------------------------------------ |
| **config valid**         | 設定は問題なく解析され、プラグインも解決される               |
| **compatibility advisory** | プラグインはサポートされているが古いパターンを使用している（例: `hook-only`） |
| **legacy warning**       | プラグインは非推奨の `before_agent_start` を使用している     |
| **hard error**           | 設定が無効であるか、プラグインのロードに失敗した             |

`hook-only` も `before_agent_start` も、現時点ではプラグインを壊しません --
`hook-only` は助言であり、`before_agent_start` は警告を出すだけです。これらの
シグナルは `openclaw status --all` と `openclaw plugins doctor` にも表示されます。

## アーキテクチャ概要

OpenClawのプラグインシステムは4つのレイヤーで構成されています。

1. **マニフェスト + 検出**
   OpenClawは、設定されたパス、ワークスペースルート、グローバル拡張ルート、
   バンドル済み拡張から候補プラグインを見つけます。検出では、ネイティブの
   `openclaw.plugin.json` マニフェストと、サポートされるバンドルマニフェストを
   最初に読み取ります。
2. **有効化 + 検証**
   コアは、検出されたプラグインが有効、無効、ブロック済み、またはメモリのような
   排他的スロットに選択されているかを判断します。
3. **ランタイムロード**
   ネイティブOpenClawプラグインはjiti経由でプロセス内にロードされ、中央レジストリに
   機能を登録します。互換性のあるバンドルは、ランタイムコードをインポートせずに
   レジストリレコードへ正規化されます。
4. **サーフェス利用**
   OpenClawの残りの部分はレジストリを読み取り、ツール、チャネル、プロバイダー設定、
   フック、HTTPルート、CLIコマンド、サービスを公開します。

特にプラグインCLIでは、ルートコマンドの検出は2段階に分かれています。

- パース時メタデータは `registerCli(..., { descriptors: [...] })` から取得されます
- 実際のプラグインCLIモジュールは遅延ロードのままにでき、最初の呼び出し時に登録されます

これにより、プラグイン所有のCLIコードをプラグイン内に保持しつつ、OpenClawは
パース前にルートコマンド名を予約できます。

重要な設計境界:

- 検出 + 設定検証は、プラグインコードを実行せずに**マニフェスト / スキーマメタデータ**
  から動作すべきです
- ネイティブのランタイム動作は、プラグインモジュールの `register(api)` パスから来ます

この分離により、OpenClawは、完全なランタイムが有効になる前に、設定を検証し、
不足している / 無効化されているプラグインを説明し、UI / スキーマのヒントを
構築できます。

### チャネルプラグインと共有 `message` ツール

チャネルプラグインは、通常のチャットアクションのために、別個の送信 / 編集 / リアクション
ツールを登録する必要はありません。OpenClawはコアに1つの共有 `message` ツールを保持し、
チャネルプラグインはその背後にあるチャネル固有の検出と実行を所有します。

現在の境界は次のとおりです。

- コアは共有 `message` ツールホスト、プロンプト配線、セッション / スレッド管理、
  および実行ディスパッチを所有します
- チャネルプラグインは、スコープ付きアクション検出、機能検出、およびあらゆる
  チャネル固有のスキーマ断片を所有します
- チャネルプラグインは、プロバイダー固有のセッション会話文法
  （たとえば、会話IDがどのようにスレッドIDをエンコードしたり、親会話から継承したりするか）
  を所有します
- チャネルプラグインは、そのアクションアダプターを通じて最終アクションを実行します

チャネルプラグインについては、SDKサーフェスは
`ChannelMessageActionAdapter.describeMessageTool(...)` です。この統一された検出呼び出しにより、
プラグインは、表示されるアクション、機能、スキーマへの寄与をまとめて返せるため、
これらの要素が互いにずれないようにできます。

コアは、その検出ステップにランタイムスコープを渡します。重要なフィールドには次が含まれます。

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 信頼された受信元の `requesterSenderId`

これはコンテキスト依存プラグインにとって重要です。チャネルは、コアの `message`
ツールにチャネル固有の分岐をハードコードすることなく、アクティブなアカウント、
現在のルーム / スレッド / メッセージ、または信頼されたリクエスターIDに基づいて、
メッセージアクションを非表示または公開できます。

これが、embedded-runnerルーティング変更が依然としてプラグイン作業である理由です。
ランナーは、現在のチャット / セッションIDをプラグイン検出境界へ転送し、共有
`message` ツールが現在のターンに対して正しいチャネル所有サーフェスを公開できるように
する責任を負います。

チャネル所有の実行ヘルパーについては、バンドル済みプラグインは実行ランタイムを
自身の拡張モジュール内に保持する必要があります。コアはもはや `src/agents/tools` 配下で
Discord、Slack、Telegram、WhatsAppのメッセージアクションランタイムを所有しません。
個別の `plugin-sdk/*-action-runtime` サブパスは公開しておらず、バンドル済みプラグインは
自身の拡張所有モジュールからローカルのランタイムコードを直接インポートする必要があります。

同じ境界は、一般的にプロバイダー名付きSDKシームにも適用されます。コアは、Slack、
Discord、Signal、WhatsApp、または同様の拡張向けのチャネル固有の便利barrelを
インポートすべきではありません。コアがある動作を必要とする場合は、バンドル済み
プラグイン自身の `api.ts` / `runtime-api.ts` barrelを利用するか、その必要性を共有SDK内の
狭い汎用機能へ昇格させてください。

pollについては、特に2つの実行パスがあります。

- `outbound.sendPoll` は、共通のpollモデルに適合するチャネル向けの共有ベースラインです
- `actions.handleAction("poll")` は、チャネル固有のpollセマンティクスや追加のpoll
  パラメーターがある場合に推奨されるパスです

コアは現在、プラグインpollディスパッチがそのアクションを拒否した後まで共有poll解析を
遅延するため、プラグイン所有のpollハンドラーは、先に汎用pollパーサーにブロックされる
ことなく、チャネル固有のpollフィールドを受け入れられます。

完全な起動シーケンスについては、[ロードパイプライン](#load-pipeline) を参照してください。

## 機能所有権モデル

OpenClawは、ネイティブプラグインを、無関係な統合の寄せ集めではなく、**企業**または
**機能**の所有権境界として扱います。

つまり、次のことを意味します。

- 企業プラグインは通常、その企業のOpenClaw向けサーフェスをすべて所有すべきです
- 機能プラグインは通常、自身が導入する機能サーフェス全体を所有すべきです
- チャネルは、プロバイダー動作を場当たり的に再実装するのではなく、共有コア機能を
  利用すべきです

例:

- バンドル済みの `openai` プラグインは、OpenAIのモデルプロバイダー動作と、
  OpenAIの音声 + リアルタイム音声 + メディア理解 + 画像生成動作を所有します
- バンドル済みの `elevenlabs` プラグインは、ElevenLabsの音声動作を所有します
- バンドル済みの `microsoft` プラグインは、Microsoftの音声動作を所有します
- バンドル済みの `google` プラグインは、Googleのモデルプロバイダー動作に加えて、
  Googleのメディア理解 + 画像生成 + Web検索動作を所有します
- バンドル済みの `firecrawl` プラグインは、FirecrawlのWebフェッチ動作を所有します
- バンドル済みの `minimax`、`mistral`、`moonshot`、`zai` プラグインは、
  それぞれのメディア理解バックエンドを所有します
- バンドル済みの `qwen` プラグインは、Qwenのテキストプロバイダー動作に加えて、
  メディア理解と動画生成動作を所有します
- `voice-call` プラグインは機能プラグインです。通話トランスポート、ツール、CLI、
  ルート、およびTwilioメディアストリームブリッジを所有しますが、ベンダー
  プラグインを直接インポートするのではなく、共有の音声機能とリアルタイム
  文字起こし / リアルタイム音声機能を利用します

意図された最終状態は次のとおりです。

- OpenAIは、テキストモデル、音声、画像、さらに将来の動画にまたがる場合でも、1つのプラグイン内に存在します
- 別のベンダーも、自身のサーフェス領域について同じことができます
- チャネルは、どのベンダープラグインがそのプロバイダーを所有しているかを気にせず、コアが公開する共有機能コントラクトを利用します

これが重要な区別です。

- **plugin** = 所有権の境界
- **capability** = 複数のプラグインが実装または利用できるコアコントラクト

したがって、OpenClawが動画のような新しいドメインを追加する場合、最初の問いは
「どのプロバイダーが動画処理をハードコードすべきか」ではありません。最初の問いは
「コアの動画機能コントラクトは何か」です。そのコントラクトが存在すれば、ベンダー
プラグインはそれに対して登録でき、チャネル / 機能プラグインはそれを利用できます。

機能がまだ存在しない場合、通常の正しい進め方は次のとおりです。

1. コアで不足している機能を定義する
2. それを型付きでプラグインAPI / ランタイム経由に公開する
3. チャネル / 機能をその機能に対して接続する
4. ベンダープラグインに実装を登録させる

これにより、所有権を明示したまま、単一ベンダーや単発のプラグイン固有コードパスに
依存するコア動作を避けられます。

### 機能レイヤリング

コードをどこに置くべきかを判断するときは、次のメンタルモデルを使ってください。

- **コア機能レイヤー**: 共有オーケストレーション、ポリシー、フォールバック、設定
  マージルール、配信セマンティクス、型付きコントラクト
- **ベンダープラグインレイヤー**: ベンダー固有API、認証、モデルカタログ、音声合成、
  画像生成、将来の動画バックエンド、使用量エンドポイント
- **チャネル / 機能プラグインレイヤー**: コア機能を利用し、それをサーフェス上に提示する
  Slack / Discord / voice-call などの統合

たとえば、TTSはこの形に従います。

- コアは、返信時TTSポリシー、フォールバック順序、設定、およびチャネル配信を所有します
- `openai`、`elevenlabs`、`microsoft` は音声合成実装を所有します
- `voice-call` は電話向けTTSランタイムヘルパーを利用します

将来の機能についても、同じパターンを優先すべきです。

### 複数機能を持つ企業プラグインの例

企業プラグインは、外側から見て一貫性があるべきです。OpenClawに、モデル、音声、
リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、
Webフェッチ、およびWeb検索の共有コントラクトがある場合、ベンダーは自分のすべての
サーフェスを1か所で所有できます。

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

- 1つのプラグインがベンダーサーフェスを所有する
- コアは引き続き機能コントラクトを所有する
- チャネルと機能プラグインは、ベンダーコードではなく `api.runtime.*` ヘルパーを利用する
- コントラクトテストは、プラグインが所有を主張する機能を実際に登録したことを検証できる

### 機能の例: 動画理解

OpenClawはすでに、画像 / 音声 / 動画理解を1つの共有機能として扱っています。
ここでも同じ所有権モデルが適用されます。

1. コアが media-understanding コントラクトを定義する
2. ベンダープラグインが、該当するものとして `describeImage`、`transcribeAudio`、
   `describeVideo` を登録する
3. チャネルと機能プラグインは、ベンダーコードに直接接続するのではなく、
   共有コア動作を利用する

これにより、あるプロバイダーの動画に関する前提をコアに焼き付けることを避けられます。
プラグインはベンダーサーフェスを所有し、コアは機能コントラクトとフォールバック動作を
所有します。

動画生成もすでに同じ流れを使っています。コアが型付き機能コントラクトとランタイム
ヘルパーを所有し、ベンダープラグインが
`api.registerVideoGenerationProvider(...)` 実装をそれに対して登録します。

具体的なロールアウトチェックリストが必要ですか。以下を参照してください。
[Capability Cookbook](/ja-JP/plugins/architecture)。

## コントラクトと強制

プラグインAPIサーフェスは、意図的に `OpenClawPluginApi` に型付けされ、集約されています。
このコントラクトは、サポートされる登録ポイントと、プラグインが依存できる
ランタイムヘルパーを定義します。

これが重要な理由:

- プラグイン作成者は、1つの安定した内部標準を得られる
- コアは、2つのプラグインが同じプロバイダーIDを登録するような重複所有権を拒否できる
- 起動時に、不正な登録に対する実用的な診断を表示できる
- コントラクトテストにより、バンドル済みプラグインの所有権を強制し、静かなドリフトを防げる

強制には2つのレイヤーがあります。

1. **ランタイム登録の強制**
   プラグインレジストリは、プラグインのロード時に登録内容を検証します。例:
   重複したプロバイダーID、重複した音声プロバイダーID、不正な登録は、
   未定義動作ではなくプラグイン診断を生成します。
2. **コントラクトテスト**
   バンドル済みプラグインは、テスト実行時にコントラクトレジストリへ取り込まれるため、
   OpenClawは所有権を明示的に検証できます。現在、これはモデルプロバイダー、
   音声プロバイダー、Web検索プロバイダー、およびバンドル済み登録の所有権に
   使用されています。

実際の効果として、OpenClawは、どのプラグインがどのサーフェスを所有しているかを、
事前に把握できます。これにより、所有権が暗黙的ではなく、宣言され、型付けされ、
テスト可能であるため、コアとチャネルはシームレスに構成できます。

### コントラクトに含めるべきもの

良いプラグインコントラクトは、次のようなものです。

- 型付きである
- 小さい
- 機能固有である
- コアが所有する
- 複数のプラグインで再利用できる
- ベンダー知識なしにチャネル / 機能から利用できる

悪いプラグインコントラクトは、次のようなものです。

- コア内に隠されたベンダー固有ポリシー
- レジストリを迂回する単発のプラグイン用エスケープハッチ
- ベンダー実装に直接入り込むチャネルコード
- `OpenClawPluginApi` または `api.runtime` の一部ではない、その場しのぎのランタイムオブジェクト

迷ったときは、抽象度を上げてください。まず機能を定義し、その後でプラグインが
そこに接続できるようにします。

## 実行モデル

ネイティブOpenClawプラグインは、Gatewayと**同一プロセス内**で動作します。
サンドボックス化はされていません。ロードされたネイティブプラグインは、
コアコードと同じプロセスレベルの信頼境界を持ちます。

影響:

- ネイティブプラグインは、ツール、ネットワークハンドラー、フック、サービスを登録できる
- ネイティブプラグインのバグは、Gatewayをクラッシュさせたり不安定化させたりできる
- 悪意あるネイティブプラグインは、OpenClawプロセス内での任意コード実行と同等である

互換バンドルは、OpenClawが現在それらをメタデータ / コンテンツパックとして
扱っているため、デフォルトではより安全です。現在のリリースでは、これは主に
バンドル済みSkillsを意味します。

バンドルされていないプラグインには、allowlistと明示的なインストール / ロードパスを
使用してください。ワークスペースプラグインは、本番のデフォルトではなく、
開発時コードとして扱ってください。

バンドル済みワークスペースパッケージ名については、プラグインIDをnpm名に固定して
ください。デフォルトでは `@openclaw/<id>`、またはパッケージが意図的により狭い
プラグイン役割を公開する場合は、承認された型付きサフィックス
`-provider`、`-plugin`、`-speech`、`-sandbox`、`-media-understanding`
を使用します。

重要な信頼に関する注記:

- `plugins.allow` は**ソースの出所**ではなく、**プラグインID**を信頼します。
- バンドル済みプラグインと同じIDを持つワークスペースプラグインは、その
  ワークスペースプラグインが有効化 / allowlist登録されている場合、意図的に
  バンドル版をシャドウします。
- これは正常であり、ローカル開発、パッチテスト、ホットフィックスに有用です。

## export境界

OpenClawがexportするのは実装上の利便性ではなく、機能です。

機能登録は公開のままにし、非コントラクトのヘルパーexportは削減してください。

- バンドル済みプラグイン固有のヘルパーサブパス
- 公開APIとして意図されていないランタイム配管サブパス
- ベンダー固有の利便ヘルパー
- 実装詳細であるセットアップ / オンボーディングヘルパー

一部のバンドル済みプラグインヘルパーサブパスは、互換性およびバンドル済み
プラグイン保守のため、生成されたSDK export map内にまだ残っています。現在の例には
`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、およびいくつかの `plugin-sdk/matrix*` シームが含まれます。
これらは、新しいサードパーティプラグイン向けに推奨されるSDKパターンではなく、
予約された実装詳細exportとして扱ってください。

## ロードパイプライン

起動時、OpenClawは概ね次のことを行います。

1. 候補プラグインルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. プラグイン設定を正規化する（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 各候補について有効化可否を決定する
6. 有効なネイティブモジュールをjiti経由でロードする
7. ネイティブの `register(api)`（または従来の別名である `activate(api)`）フックを呼び出し、登録内容をプラグインレジストリに収集する
8. レジストリをコマンド / ランタイムサーフェスに公開する

<Note>
`activate` は `register` の従来の別名です — ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じタイミングで呼び出します。すべてのバンドル済みプラグインは `register` を使用しています。新しいプラグインでは `register` を優先してください。
</Note>

安全性ゲートは、ランタイム実行**前**に発生します。候補は、エントリが
プラグインルート外に逃げる場合、パスがworld-writableである場合、または
バンドルされていないプラグインについてパス所有権が疑わしい場合にブロックされます。

### マニフェスト優先の動作

マニフェストは、コントロールプレーンにおける信頼できる唯一の情報源です。
OpenClawはこれを次の目的で使用します。

- プラグインを識別する
- 宣言されたチャネル / Skills / 設定スキーマまたはバンドル機能を検出する
- `plugins.entries.<id>.config` を検証する
- Control UIのラベル / プレースホルダーを拡張する
- インストール / カタログメタデータを表示する
- プラグインランタイムをロードせずに、軽量なアクティベーションおよびセットアップ
  記述子を保持する

ネイティブプラグインでは、ランタイムモジュールがデータプレーン部分です。これは、
フック、ツール、コマンド、またはプロバイダーフローのような実際の動作を登録します。

任意のマニフェスト `activation` および `setup` ブロックは、コントロールプレーン上に
留まります。これらはアクティベーション計画とセットアップ検出のための
メタデータ専用記述子であり、ランタイム登録、`register(...)`、または `setupEntry`
を置き換えるものではありません。

### ローダーがキャッシュするもの

OpenClawは、短寿命のプロセス内キャッシュを次の対象に対して保持します。

- 検出結果
- マニフェストレジストリデータ
- ロード済みプラグインレジストリ

これらのキャッシュは、突発的な起動負荷と繰り返しコマンドのオーバーヘッドを減らします。
これらは、永続化ではなく、短寿命のパフォーマンスキャッシュとして考えると安全です。

パフォーマンスに関する注記:

- これらのキャッシュを無効にするには、
  `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定してください。
- キャッシュ期間は `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` および
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整できます。

## レジストリモデル

ロードされたプラグインは、コアのランダムなグローバル状態を直接変更しません。
それらは中央のプラグインレジストリに登録されます。

レジストリは次を追跡します。

- プラグインレコード（ID、ソース、オリジン、状態、診断）
- ツール
- 従来型フックと型付きフック
- チャネル
- プロバイダー
- Gateway RPCハンドラー
- HTTPルート
- CLIレジストラー
- バックグラウンドサービス
- プラグイン所有コマンド

その後、コア機能はプラグインモジュールと直接やり取りするのではなく、この
レジストリから読み取ります。これにより、ロード方向は一方向に保たれます。

- プラグインモジュール -> レジストリ登録
- コアランタイム -> レジストリ利用

この分離は保守性の観点で重要です。つまり、多くのコアサーフェスは、
「すべてのプラグインモジュールを特別扱いする」ではなく、
「レジストリを読む」という1つの統合ポイントだけを必要とします。

## 会話バインディングコールバック

会話をバインドするプラグインは、承認が解決されたときに反応できます。

バインド要求が承認または拒否された後にコールバックを受け取るには、
`api.onConversationBindingResolved(...)` を使用します。

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
- `binding`: 承認された要求に対する解決済みバインディング
- `request`: 元の要求サマリー、デタッチヒント、送信者ID、および
  会話メタデータ

このコールバックは通知専用です。これは、誰が会話をバインドできるかを変更するものではなく、
コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダープラグインには現在2つのレイヤーがあります。

- マニフェストメタデータ: ランタイムロード前に軽量なプロバイダー環境認証検索を行う
  `providerAuthEnvVars`、認証を共有するプロバイダーバリアント向けの
  `providerAuthAliases`、ランタイムロード前に軽量なチャネル環境 / セットアップ検索を
  行う `channelEnvVars`、およびランタイムロード前に軽量なオンボーディング / 認証選択
  ラベルとCLIフラグメタデータを提供する `providerAuthChoices`
- 設定時フック: `catalog` / 従来の `discovery` および `applyConfigDefaults`
- ランタイムフック: `normalizeModelId`、`normalizeTransport`、
  `normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`resolveExternalAuthProfiles`、
  `shouldDeferSyntheticProfileAuth`、
  `resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、
  `contributeResolvedModelCompat`、`capabilities`、
  `normalizeToolSchemas`、`inspectToolSchemas`、
  `resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、
  `wrapStreamFn`、`resolveTransportTurnState`、
  `resolveWebSocketSessionPolicy`、`formatApiKey`、`refreshOAuth`、
  `buildAuthDoctorHint`、`matchesContextOverflowError`、
  `classifyFailoverReason`、`isCacheTtlEligible`、
  `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、
  `isBinaryThinking`、`supportsXHighThinking`、
  `resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`createEmbeddingProvider`、
  `buildReplayPolicy`、
  `sanitizeReplayHistory`、`validateReplayTurns`、`onModelSelected`

OpenClawは引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、
およびツールポリシーを所有します。これらのフックは、完全にカスタムな推論
トランスポートを必要とせずに、プロバイダー固有の動作を拡張するためのサーフェスです。

プロバイダーが、汎用の認証 / ステータス / モデルピッカーパスから、プラグインランタイムを
ロードせずに認識される環境ベース認証情報を持つ場合は、マニフェストの
`providerAuthEnvVars` を使用してください。あるプロバイダーIDが、別のプロバイダーIDの
環境変数、認証プロファイル、設定ベース認証、およびAPIキーのオンボーディング選択を
再利用すべき場合は、マニフェストの `providerAuthAliases` を使用してください。
オンボーディング / 認証選択のCLIサーフェスが、プロバイダーランタイムをロードせずに、
そのプロバイダーの選択ID、グループラベル、および単一フラグのシンプルな認証配線を
把握すべき場合は、マニフェストの `providerAuthChoices` を使用してください。
プロバイダーランタイムの `envVars` は、オンボーディングラベルやOAuthの
client-id / client-secret セットアップ変数など、オペレーター向けヒント用に
維持してください。

チャネルが、汎用のシェル環境フォールバック、設定 / ステータスチェック、または
セットアッププロンプトから、チャネルランタイムをロードせずに認識されるべき
環境駆動の認証またはセットアップを持つ場合は、マニフェストの `channelEnvVars`
を使用してください。

### フック順序と使い方

モデル / プロバイダープラグインについて、OpenClawはこれらのフックを概ね次の順序で
呼び出します。「When to use」列は、すばやく判断するためのガイドです。

| #   | フック                            | 役割                                                                                                           | 使用するタイミング                                                                                                                           |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時に、プロバイダー設定を `models.providers` に公開する                                      | プロバイダーがカタログまたはベースURLのデフォルトを所有している場合                                                                          |
| 2   | `applyConfigDefaults`             | 設定の具体化時に、プロバイダー所有のグローバル設定デフォルトを適用する                                        | デフォルトが認証モード、環境、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                            |
| --  | _(組み込みモデル検索)_            | OpenClawはまず通常のレジストリ / カタログパスを試す                                                           | _(プラグインフックではありません)_                                                                                                           |
| 3   | `normalizeModelId`                | 検索前に、従来型またはプレビューモデルIDのエイリアスを正規化する                                              | 正式なモデル解決の前に、プロバイダーがエイリアス整理を所有している場合                                                                        |
| 4   | `normalizeTransport`              | 汎用モデル組み立ての前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                             | 同じトランスポートファミリー内のカスタムプロバイダーIDについて、プロバイダーがトランスポート整理を所有している場合                          |
| 5   | `normalizeConfig`                 | ランタイム / プロバイダー解決前に、`models.providers.<id>` を正規化する                                       | プラグインと一緒に置くべき設定整理がプロバイダーに必要な場合。バンドル済みGoogle系ヘルパーは、サポートされるGoogle設定エントリの後方支援も行います |
| 6   | `applyNativeStreamingUsageCompat` | 設定プロバイダーに対して、ネイティブなストリーミング使用量互換の書き換えを適用する                            | エンドポイント駆動のネイティブストリーミング使用量メタデータ修正がプロバイダーに必要な場合                                                  |
| 7   | `resolveConfigApiKey`             | ランタイム認証ロード前に、設定プロバイダー向けの環境マーカー認証を解決する                                    | プロバイダー所有の環境マーカーAPIキー解決がある場合。`amazon-bedrock` には、ここに組み込みのAWS環境マーカーリゾルバーもあります             |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル / セルフホストまたは設定ベースの認証を表面化する                                 | プロバイダーが合成 / ローカル認証マーカーで動作できる場合                                                                                    |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルをオーバーレイする。デフォルトの `persistence` はCLI / アプリ所有資格情報向けに `runtime-only` | コピーされたリフレッシュトークンを永続化せずに、プロバイダーが外部認証資格情報を再利用する場合                                              |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを、環境 / 設定ベース認証より下位にする                             | 優先されるべきでない合成プレースホルダープロファイルをプロバイダーが保存する場合                                                            |
| 11  | `resolveDynamicModel`             | ローカルレジストリにまだないプロバイダー所有モデルIDに対する同期フォールバック                                 | プロバイダーが任意の上流モデルIDを受け入れる場合                                                                                             |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` を再度実行する                                        | 不明IDを解決する前に、ネットワークメタデータがプロバイダーに必要な場合                                                                        |
| 13  | `normalizeResolvedModel`          | embedded runnerが解決済みモデルを使う前の最終書き換え                                                         | プロバイダーがトランスポート書き換えを必要とするが、依然としてコアトランスポートを使う場合                                                  |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデルの互換フラグを提供する                                         | プロバイダーを引き継がずに、プロキシトランスポート上で自身のモデルを認識する場合                                                            |
| 15  | `capabilities`                    | 共有コアロジックで使われる、プロバイダー所有のトランスクリプト / ツール関連メタデータ                         | トランスクリプト / プロバイダーファミリー固有の癖をプロバイダーが持つ場合                                                                    |
| 16  | `normalizeToolSchemas`            | embedded runnerが見る前にツールスキーマを正規化する                                                            | トランスポートファミリーのスキーマ整理がプロバイダーに必要な場合                                                                              |
| 17  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を表面化する                                                         | コアにプロバイダー固有ルールを教え込まずに、キーワード警告を出したい場合                                                                    |
| 18  | `resolveReasoningOutputMode`      | ネイティブ対タグ付きのreasoning-outputコントラクトを選択する                                                   | ネイティブフィールドではなく、タグ付きreasoning / final出力をプロバイダーが必要とする場合                                                   |
| 19  | `prepareExtraParams`              | 汎用ストリームオプションラッパーの前に、リクエストパラメーターを正規化する                                     | デフォルトのリクエストパラメーターや、プロバイダーごとのパラメーター整理が必要な場合                                                        |
| 20  | `createStreamFn`                  | 通常のストリームパスを完全に置き換えて、カスタムトランスポートを使う                                           | 単なるラッパーではなく、カスタムワイヤープロトコルがプロバイダーに必要な場合                                                                |
| 21  | `wrapStreamFn`                    | 汎用ラッパー適用後にストリームをラップする                                                                     | カスタムトランスポートなしで、リクエストヘッダー / ボディ / モデル互換ラッパーがプロバイダーに必要な場合                                   |
| 22  | `resolveTransportTurnState`       | ネイティブのターン単位トランスポートヘッダーまたはメタデータを付加する                                         | プロバイダーが、汎用トランスポートでプロバイダーネイティブのターンIDを送信したい場合                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | ネイティブのWebSocketヘッダーまたはセッションクールダウンポリシーを付加する                                    | 汎用WSトランスポートで、セッションヘッダーやフォールバックポリシーをプロバイダーが調整したい場合                                            |
| 24  | `formatApiKey`                    | 認証プロファイルのフォーマッター: 保存済みプロファイルをランタイムの `apiKey` 文字列にする                    | 追加の認証メタデータをプロバイダーが保存し、カスタムのランタイムトークン形式を必要とする場合                                                |
| 25  | `refreshOAuth`                    | カスタム更新エンドポイントまたは更新失敗ポリシー向けのOAuth更新オーバーライド                                  | プロバイダーが共有 `pi-ai` リフレッシャーに適合しない場合                                                                                    |
| 26  | `buildAuthDoctorHint`             | OAuth更新失敗時に追加される修復ヒントを構築する                                                                | 更新失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合                                                                               |
| 27  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウ超過マッチャー                                                         | 汎用ヒューリスティクスでは見逃す生の超過エラーをプロバイダーが持つ場合                                                                        |
| 28  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                     | 生のAPI / トランスポートエラーを、rate-limit / overload などにプロバイダーがマップできる場合                                                |
| 29  | `isCacheTtlEligible`              | プロキシ / バックホールプロバイダー向けのプロンプトキャッシュポリシー                                           | プロキシ固有のキャッシュTTLゲーティングがプロバイダーに必要な場合                                                                            |
| 30  | `buildMissingAuthMessage`         | 汎用の認証不足リカバリーメッセージの置き換え                                                                   | プロバイダー固有の認証不足リカバリーヒントが必要な場合                                                                                       |
| 31  | `suppressBuiltInModel`            | 古い上流モデルの抑止と、任意のユーザー向けエラーヒント                                                         | 古い上流行を非表示にしたり、ベンダーヒントで置き換えたりする必要がある場合                                                                  |
| 32  | `augmentModelCatalog`             | 検出後に合成 / 最終カタログ行を追加する                                                                        | `models list` やピッカー向けに、前方互換の合成行がプロバイダーに必要な場合                                                                  |
| 33  | `isBinaryThinking`                | binary-thinkingプロバイダー向けのオン / オフ推論トグル                                                        | プロバイダーが二値のthinkingオン / オフのみを公開する場合                                                                                   |
| 34  | `supportsXHighThinking`           | 選択されたモデル向けの `xhigh` 推論サポート                                                                    | 一部のモデルに対してのみ `xhigh` を有効にしたい場合                                                                                          |
| 35  | `resolveDefaultThinkingLevel`     | 特定のモデルファミリー向けのデフォルト `/think` レベル                                                        | モデルファミリー向けのデフォルト `/think` ポリシーをプロバイダーが所有する場合                                                              |
| 36  | `isModernModelRef`                | ライブプロファイルフィルターおよびスモーク選択向けのモダンモデルマッチャー                                     | ライブ / スモーク優先モデルのマッチングをプロバイダーが所有する場合                                                                          |
| 37  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムトークン / キーへ交換する                                        | トークン交換または短命のリクエスト資格情報がプロバイダーに必要な場合                                                                         |
| 38  | `resolveUsageAuth`                | `/usage` および関連するステータスサーフェス向けに、使用量 / 課金資格情報を解決する                             | カスタムの使用量 / クォータトークン解析、または別の使用量資格情報がプロバイダーに必要な場合                                                |
| 39  | `fetchUsageSnapshot`              | 認証解決後に、プロバイダー固有の使用量 / クォータスナップショットを取得して正規化する                         | プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要な場合                                                                 |
| 40  | `createEmbeddingProvider`         | メモリ / 検索向けに、プロバイダー所有の埋め込みアダプターを構築する                                           | メモリ埋め込み動作をプロバイダープラグインと一緒に持たせるべき場合                                                                          |
| 41  | `buildReplayPolicy`               | プロバイダー向けのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにカスタムのトランスクリプトポリシー（たとえば、thinkingブロックの除去）が必要な場合                                           |
| 42  | `sanitizeReplayHistory`           | 汎用トランスクリプトクリーンアップ後に、リプレイ履歴を書き換える                                              | 共有コンパクションヘルパーを超える、プロバイダー固有のリプレイ書き換えが必要な場合                                                        |
| 43  | `validateReplayTurns`             | embedded runnerの前に、リプレイターンの最終検証または再整形を行う                                             | 汎用サニタイズ後に、より厳格なターン検証がプロバイダートランスポートに必要な場合                                                           |
| 44  | `onModelSelected`                 | モデルがアクティブになったときに、プロバイダー所有の選択後副作用を実行する                                    | モデルが有効になった際に、テレメトリーまたはプロバイダー所有状態が必要な場合                                                               |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致した
プロバイダープラグインを確認し、その後、モデルIDまたはトランスポート / 設定を
実際に変更するフック対応の他のプロバイダープラグインへとフォールスルーします。
これにより、呼び出し元がどのバンドル済みプラグインがその書き換えを所有しているかを
知る必要なく、エイリアス / 互換プロバイダーshimを機能させられます。どの
プロバイダーフックもサポートされたGoogle系設定エントリを書き換えない場合でも、
バンドル済みGoogle設定ノーマライザーは引き続きその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムなワイヤープロトコルやカスタムのリクエスト実行器を
必要とする場合、それは別種の拡張です。これらのフックは、OpenClawの通常の推論ループ上で
引き続き動作するプロバイダー動作用です。

### プロバイダー例

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

- Anthropicは、Claude 4.6の前方互換、プロバイダーファミリーのヒント、認証修復
  ガイダンス、使用量エンドポイント統合、プロンプトキャッシュ適格性、認証を考慮した
  設定デフォルト、Claudeのデフォルト / 適応的thinkingポリシー、およびベータヘッダー、
  `/fast` / `serviceTier`、`context1m` 向けのAnthropic固有ストリーム整形を所有しているため、
  `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、
  `resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、
  `resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、
  `wrapStreamFn` を使用します。
- AnthropicのClaude固有ストリームヘルパーは、今のところバンドル済みプラグイン自身の
  公開 `api.ts` / `contract-api.ts` シーム内に留まっています。そのパッケージサーフェスは、
  ある1つのプロバイダーのベータヘッダールールに合わせて汎用SDKを広げるのではなく、
  `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
  `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、
  およびより低レベルのAnthropicラッパービルダーをexportします。
- OpenAIは、GPT-5.4の前方互換、直接のOpenAI
  `openai-completions` -> `openai-responses` 正規化、Codex対応認証ヒント、
  Spark抑止、合成OpenAIリスト行、およびGPT-5のthinking / ライブモデルポリシーを
  所有しているため、`resolveDynamicModel`、`normalizeResolvedModel`、
  `capabilities` に加えて `buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`supportsXHighThinking`、`isModernModelRef`
  を使用します。`openai-responses-defaults` ストリームファミリーは、
  帰属ヘッダー、`/fast` / `serviceTier`、テキスト詳細度、ネイティブCodex Web検索、
  reasoning互換ペイロード整形、およびResponsesコンテキスト管理向けの共有ネイティブ
  OpenAI Responsesラッパーを所有します。
- OpenRouterは、プロバイダーがパススルーであり、OpenClawの静的カタログ更新前に
  新しいモデルIDを公開する可能性があるため、`catalog` に加えて
  `resolveDynamicModel` と `prepareDynamicModel` を使用します。また、
  プロバイダー固有のリクエストヘッダー、ルーティングメタデータ、reasoningパッチ、
  およびプロンプトキャッシュポリシーをコアの外に保つために、
  `capabilities`、`wrapStreamFn`、`isCacheTtlEligible` も使用します。
  そのリプレイポリシーは `passthrough-gemini` ファミリーから来ており、
  `openrouter-thinking` ストリームファミリーは、プロキシreasoning注入と、
  非サポートモデル / `auto` のスキップを所有します。
- GitHub Copilotは、プロバイダー所有のデバイスログイン、モデルフォールバック動作、
  Claudeトランスクリプトの癖、GitHubトークン -> Copilotトークン交換、
  およびプロバイダー所有の使用量エンドポイントを必要とするため、
  `catalog`、`auth`、`resolveDynamicModel`、`capabilities` に加えて
  `prepareRuntimeAuth` と `fetchUsageSnapshot` を使用します。
- OpenAI Codexは、依然としてコアOpenAIトランスポート上で動作するものの、
  そのトランスポート / ベースURL正規化、OAuth更新フォールバックポリシー、
  デフォルトトランスポート選択、合成Codexカタログ行、およびChatGPT使用量
  エンドポイント統合を所有しているため、`catalog`、`resolveDynamicModel`、
  `normalizeResolvedModel`、`refreshOAuth`、`augmentModelCatalog` に加えて
  `prepareExtraParams`、`resolveUsageAuth`、`fetchUsageSnapshot`
  を使用します。直接のOpenAIと同じ `openai-responses-defaults`
  ストリームファミリーを共有します。
- Google AI StudioとGemini CLI OAuthは、`google-gemini` リプレイファミリーが
  Gemini 3.1前方互換フォールバック、ネイティブGeminiリプレイ検証、ブートストラップ
  リプレイサニテーション、タグ付きreasoning-outputモード、およびモダンモデル
  マッチングを所有し、`google-thinking` ストリームファミリーがGemini thinking
  ペイロード正規化を所有しているため、`resolveDynamicModel`、
  `buildReplayPolicy`、`sanitizeReplayHistory`、
  `resolveReasoningOutputMode`、`wrapStreamFn`、`isModernModelRef`
  を使用します。Gemini CLI OAuthはさらに、トークン整形、トークン解析、
  クォータエンドポイント配線のために `formatApiKey`、`resolveUsageAuth`、
  `fetchUsageSnapshot` も使用します。
- Anthropic Vertexは、`anthropic-by-model` リプレイファミリー経由で
  `buildReplayPolicy` を使用します。これにより、Claude固有のリプレイ
  クリーンアップが、すべての `anthropic-messages` トランスポートではなく、
  Claude IDに限定されます。
- Amazon Bedrockは、Anthropic-on-Bedrockトラフィック向けのBedrock固有の
  throttle / not-ready / context-overflow エラー分類を所有しているため、
  `buildReplayPolicy`、`matchesContextOverflowError`、
  `classifyFailoverReason`、`resolveDefaultThinkingLevel` を使用します。
  そのリプレイポリシーは引き続き同じClaude専用の `anthropic-by-model`
  ガードを共有します。
- OpenRouter、Kilocode、Opencode、Opencode Goは、OpenAI互換トランスポート経由で
  Geminiモデルをプロキシし、ネイティブGeminiリプレイ検証やブートストラップ
  書き換えなしにGemini thought-signature サニテーションを必要とするため、
  `passthrough-gemini` リプレイファミリー経由で `buildReplayPolicy`
  を使用します。
- MiniMaxは、1つのプロバイダーがAnthropicメッセージとOpenAI互換の両方の
  セマンティクスを所有しているため、`hybrid-anthropic-openai`
  リプレイファミリー経由で `buildReplayPolicy` を使用します。これにより、
  Anthropic側ではClaude専用のthinkingブロック削除を維持しつつ、
  reasoning出力モードをネイティブに上書きし、`minimax-fast-mode`
  ストリームファミリーが共有ストリームパス上のfast-modeモデル書き換えを
  所有します。
- Moonshotは、共有OpenAIトランスポートを引き続き使用するものの、
  プロバイダー所有のthinkingペイロード正規化を必要とするため、`catalog` に加えて
  `wrapStreamFn` を使用します。`moonshot-thinking` ストリームファミリーは、
  設定と `/think` 状態をネイティブの二値thinkingペイロードへマップします。
- Kilocodeは、プロバイダー所有のリクエストヘッダー、reasoningペイロード正規化、
  Geminiトランスクリプトヒント、およびAnthropicキャッシュTTLゲーティングを
  必要とするため、`catalog`、`capabilities`、`wrapStreamFn`、
  `isCacheTtlEligible` を使用します。`kilocode-thinking` ストリームファミリーは、
  `kilo/auto` や、明示的なreasoningペイロードをサポートしない他のプロキシモデルIDを
  スキップしつつ、共有プロキシストリームパス上でKilo thinking注入を維持します。
- Z.AIは、GLM-5フォールバック、`tool_stream` デフォルト、二値thinking UX、
  モダンモデルマッチング、および使用量認証とクォータ取得の両方を所有しているため、
  `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、
  `isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、
  `resolveUsageAuth`、`fetchUsageSnapshot` を使用します。
  `tool-stream-default-on` ストリームファミリーは、デフォルトオンの
  `tool_stream` ラッパーを、プロバイダーごとの手書き接着コードから切り離します。
- xAIは、ネイティブxAI Responsesトランスポート正規化、Grok fast-modeエイリアス
  書き換え、デフォルトの `tool_stream`、strict-tool / reasoning-payload 整理、
  プラグイン所有ツール向けフォールバック認証再利用、前方互換のGrokモデル解決、
  およびxAIツールスキーマプロファイル、非サポートスキーマキーワード、ネイティブ
  `web_search`、HTMLエンティティのツール呼び出し引数デコードなどの
  プロバイダー所有互換パッチを所有しているため、`normalizeResolvedModel`、
  `normalizeTransport`、`contributeResolvedModelCompat`、
  `prepareExtraParams`、`wrapStreamFn`、`resolveSyntheticAuth`、
  `resolveDynamicModel`、`isModernModelRef` を使用します。
- Mistral、OpenCode Zen、OpenCode Goは、トランスクリプト / ツール関連の癖を
  コアの外に保つために `capabilities` のみを使用します。
- `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、
  `nvidia`、`qianfan`、`synthetic`、`together`、`venice`、
  `vercel-ai-gateway`、`volcengine` など、カタログ専用のバンドル済み
  プロバイダーは `catalog` のみを使用します。
- Qwenは、テキストプロバイダー向けに `catalog` を使用し、さらにその
  マルチモーダルサーフェス向けに共有のメディア理解および動画生成登録を使用します。
- MiniMaxとXiaomiは、推論自体は引き続き共有トランスポート経由で実行されるものの、
  その `/usage` 動作がプラグイン所有であるため、`catalog` に加えて使用量フックを
  使用します。

## ランタイムヘルパー

プラグインは、`api.runtime` 経由で選択されたコアヘルパーにアクセスできます。TTSの場合:

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

- `textToSpeech` は、ファイル / ボイスノートサーフェス向けの通常のコアTTS出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM音声バッファー + サンプルレートを返します。プラグイン側でプロバイダー向けの再サンプリング / エンコードが必要です。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有のボイスピッカーまたはセットアップフローで使用してください。
- ボイス一覧には、プロバイダー対応ピッカー向けに、locale、gender、personalityタグなどのより豊富なメタデータを含めることができます。
- 現時点で電話対応をサポートしているのはOpenAIとElevenLabsです。Microsoftは対応していません。

プラグインは `api.registerSpeechProvider(...)` 経由で音声プロバイダーを登録することもできます。

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

- TTSポリシー、フォールバック、および返信配信はコアに保持してください。
- ベンダー所有の音声合成動作には音声プロバイダーを使用してください。
- 従来のMicrosoft `edge` 入力は `microsoft` プロバイダーIDに正規化されます。
- 推奨される所有権モデルは企業指向です。1つのベンダープラグインが、
  OpenClawにそれらの機能コントラクトが追加されるにつれて、テキスト、音声、画像、
  将来のメディアプロバイダーを所有できます。

画像 / 音声 / 動画理解については、プラグインは汎用のキー / 値バッグではなく、
1つの型付きmedia-understandingプロバイダーを登録します。

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

- オーケストレーション、フォールバック、設定、およびチャネル配線はコアに保持してください。
- ベンダー動作はプロバイダープラグインに保持してください。
- 加算的拡張は型付きのままにすべきです。新しい任意メソッド、新しい任意の
  結果フィールド、新しい任意機能です。
- 動画生成もすでに同じパターンに従っています。
  - コアが機能コントラクトとランタイムヘルパーを所有する
  - ベンダープラグインが `api.registerVideoGenerationProvider(...)`
    を登録する
  - 機能 / チャネルプラグインが `api.runtime.videoGeneration.*` を利用する

media-understanding ランタイムヘルパーについては、プラグインは次を呼び出せます。

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

音声文字起こしについては、プラグインは media-understanding ランタイムまたは
古いSTTエイリアスのどちらかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` は、画像 / 音声 / 動画理解のための
  推奨される共有サーフェスです。
- コアの media-understanding 音声設定（`tools.media.audio`）とプロバイダーの
  フォールバック順序を使用します。
- 文字起こし出力が生成されなかった場合（たとえば入力がスキップされた / 非対応である場合）、
  `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性エイリアスとして引き続き残ります。

プラグインは `api.runtime.subagent` を通じてバックグラウンドsubagent実行を起動することもできます。

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

- `provider` と `model` は、永続的なセッション変更ではなく、実行ごとの任意の
  オーバーライドです。
- OpenClawは、信頼された呼び出し元に対してのみこれらのオーバーライドフィールドを
  受け付けます。
- プラグイン所有のフォールバック実行については、オペレーターが
  `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的に
  オプトインする必要があります。
- 信頼されたプラグインを特定の正規 `provider/model` ターゲットに制限するには
  `plugins.entries.<id>.subagent.allowedModels` を使用し、任意のターゲットを
  明示的に許可するには `"*"` を使用します。
- 信頼されていないプラグインのsubagent実行も引き続き動作しますが、
  オーバーライド要求は黙ってフォールバックされるのではなく拒否されます。

Web検索については、プラグインはエージェントツール配線に直接入り込むのではなく、
共有ランタイムヘルパーを利用できます。

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

プラグインは `api.registerWebSearchProvider(...)` 経由でWeb検索プロバイダーを
登録することもできます。

注記:

- プロバイダー選択、資格情報解決、および共有リクエストセマンティクスはコアに保持してください。
- ベンダー固有の検索トランスポートには Web search プロバイダーを使用してください。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せずに検索動作を
  必要とする機能 / チャネルプラグイン向けの推奨される共有サーフェスです。

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

- `generate(...)`: 設定された画像生成プロバイダーチェーンを使用して画像を生成します。
- `listProviders(...)`: 利用可能な画像生成プロバイダーとその機能を一覧表示します。

## Gateway HTTPルート

プラグインは `api.registerHttpRoute(...)` を使ってHTTPエンドポイントを公開できます。

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

- `path`: Gateway HTTPサーバー配下のルートパス。
- `auth`: 必須です。通常のGateway認証を要求するには `"gateway"` を使用し、
  プラグイン管理の認証 / webhook検証には `"plugin"` を使用します。
- `match`: 任意です。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意です。同じプラグインが自身の既存ルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、プラグインロードエラーの原因になります。
  代わりに `api.registerHttpRoute(...)` を使用してください。
- プラグインルートは `auth` を明示的に宣言する必要があります。
- 正確に同じ `path + match` の競合は、`replaceExisting: true` がない限り拒否され、
  あるプラグインが別のプラグインのルートを置き換えることはできません。
- `auth` レベルが異なる重複ルートは拒否されます。`exact` / `prefix` の
  フォールスルーチェーンは同じ認証レベル内のみにしてください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動的には受け取りません。
  これらはプラグイン管理のwebhook / 署名検証用であり、特権Gatewayヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストランタイムスコープ内で動作しますが、
  そのスコープは意図的に保守的です。
  - 共有シークレットのbearer認証（`gateway.auth.mode = "token"` / `"password"`）では、
    呼び出し元が `x-openclaw-scopes` を送信しても、プラグインルートのランタイム
    スコープは `operator.write` に固定されます
  - 信頼されたID保持HTTPモード（たとえば `trusted-proxy` や、プライベートな
    ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes`
    ヘッダーが明示的に存在する場合にのみそれを尊重します
  - それらのID保持プラグインルートリクエストで `x-openclaw-scopes` が存在しない場合、
    ランタイムスコープは `operator.write` にフォールバックします
- 実用的なルール: gateway認証されたプラグインルートが暗黙の管理者サーフェスだと
  想定しないでください。ルートが管理者専用動作を必要とする場合は、
  ID保持認証モードを要求し、明示的な `x-openclaw-scopes` ヘッダー
  コントラクトを文書化してください。

## プラグインSDKインポートパス

プラグインを作成する際は、単一の `openclaw/plugin-sdk` インポートではなく、
SDKサブパスを使用してください。

- プラグイン登録プリミティブには `openclaw/plugin-sdk/plugin-entry`。
- 汎用の共有プラグイン向けコントラクトには `openclaw/plugin-sdk/core`。
- ルート `openclaw.json` Zodスキーマexport（`OpenClawSchema`）には
  `openclaw/plugin-sdk/config-schema`。
- 共有セットアップ / 認証 / 返信 / webhook配線には、
  `openclaw/plugin-sdk/channel-setup`、
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
  `openclaw/plugin-sdk/webhook-ingress`
  などの安定したチャネルプリミティブを使用してください。`channel-inbound` は、
  デバウンス、メンションマッチング、受信メンションポリシーヘルパー、envelope整形、
  および受信 envelope コンテキストヘルパーの共有ホームです。
  `channel-setup` は狭い optional-install セットアップシームです。
  `setup-runtime` は、`setupEntry` / 遅延起動で使われるランタイム安全なセットアップ
  サーフェスであり、インポート安全なセットアップパッチアダプターを含みます。
  `setup-adapter-runtime` は環境対応のアカウントセットアップアダプターシームです。
  `setup-tools` は小さなCLI / アーカイブ / ドキュメントヘルパーシーム
  （`formatCliCommand`、`detectBinary`、`extractArchive`、
  `resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`）です。
- 共有ランタイム / 設定ヘルパーには、
  `openclaw/plugin-sdk/channel-config-helpers`、
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
  `openclaw/plugin-sdk/directory-runtime`
  などのドメインサブパスを使用してください。
  `telegram-command-config` は、Telegramのカスタムコマンド正規化 / 検証のための
  狭い公開シームであり、バンドル済みTelegramコントラクトサーフェスが一時的に
  利用できない場合でも利用可能なままです。
  `text-runtime` は、assistant-visible-text の除去、markdownの描画 / 分割ヘルパー、
  redactヘルパー、directive-tagヘルパー、および safe-text ユーティリティを含む、
  共有のテキスト / markdown / ロギングシームです。
- 承認固有のチャネルシームでは、プラグイン上の1つの `approvalCapability`
  コントラクトを優先すべきです。その後コアは、承認動作を無関係なプラグイン
  フィールドに混在させるのではなく、その1つの機能を通じて、承認認証、配信、
  レンダリング、ネイティブルーティング、遅延ネイティブハンドラー動作を読み取ります。
- `openclaw/plugin-sdk/channel-runtime` は非推奨であり、古いプラグイン向けの
  互換性shimとしてのみ残っています。新しいコードでは代わりにより狭い汎用
  プリミティブをインポートすべきであり、repoコードでもこのshimへの新規インポートを
  追加すべきではありません。
- バンドル済み拡張の内部実装は非公開のままです。外部プラグインは
  `openclaw/plugin-sdk/*` サブパスのみを使うべきです。OpenClawのコア / テストコードは、
  `index.js`、`api.js`、`runtime-api.js`、`setup-entry.js`、および
  `login-qr-api.js` のような狭く限定されたファイルなど、プラグインパッケージルート配下の
  repo公開エントリポイントを使用できます。コアからも別拡張からも、プラグイン
  パッケージの `src/*` をインポートしてはいけません。
- repoエントリポイントの分割:
  `<plugin-package-root>/api.js` はヘルパー / 型のbarrel、
  `<plugin-package-root>/runtime-api.js` はランタイム専用barrel、
  `<plugin-package-root>/index.js` はバンドル済みプラグインエントリ、
  `<plugin-package-root>/setup-entry.js` はセットアッププラグインエントリです。
- 現在のバンドル済みプロバイダー例:
  - Anthropicは、`wrapAnthropicProviderStream`、ベータヘッダーヘルパー、
    `service_tier` 解析などのClaudeストリームヘルパーに `api.js` /
    `contract-api.js` を使用します。
  - OpenAIは、プロバイダービルダー、デフォルトモデルヘルパー、およびリアルタイム
    プロバイダービルダーに `api.js` を使用します。
  - OpenRouterは、プロバイダービルダーとオンボーディング / 設定ヘルパーに `api.js`
    を使用し、`register.runtime.js` は引き続きrepoローカル用途のために
    汎用 `plugin-sdk/provider-stream` ヘルパーを再exportできます。
- ファサードロードされる公開エントリポイントは、利用可能なアクティブなランタイム設定
  スナップショットが存在する場合はそれを優先し、OpenClawがまだランタイム
  スナップショットを提供していない場合はディスク上の解決済み設定ファイルに
  フォールバックします。
- 汎用の共有プリミティブは、引き続き推奨される公開SDKコントラクトです。
  バンドル済みチャネル名付きヘルパーシームの小さな予約済み互換セットは依然として存在します。
  これらは、新しいサードパーティのインポート先ではなく、バンドル保守 / 互換性用の
  シームとして扱ってください。新しいクロスチャネルコントラクトは、引き続き汎用
  `plugin-sdk/*` サブパスか、プラグインローカルの `api.js` /
  `runtime-api.js` barrel に置くべきです。

互換性に関する注記:

- 新しいコードでは、ルートの `openclaw/plugin-sdk` barrel は避けてください。
- まずは狭く安定したプリミティブを優先してください。新しい
  setup / pairing / reply / feedback / contract / inbound / threading / command /
  secret-input / webhook / infra / allowlist / status / message-tool サブパスが、
  新しいバンドル済みおよび外部プラグイン作業向けの意図されたコントラクトです。
  ターゲットのパース / マッチングは `openclaw/plugin-sdk/channel-targets`
  に置くべきです。メッセージアクションのゲートとリアクション用 message-id
  ヘルパーは `openclaw/plugin-sdk/channel-actions` に置くべきです。
- バンドル済み拡張固有のヘルパーbarrelは、デフォルトでは安定していません。
  あるヘルパーがバンドル済み拡張でしか必要ないなら、それを
  `openclaw/plugin-sdk/<extension>` に昇格させるのではなく、その拡張の
  ローカル `api.js` または `runtime-api.js` シームの背後に置いてください。
- 新しい共有ヘルパーシームは、チャネル名付きではなく汎用であるべきです。
  共有ターゲットのパースは `openclaw/plugin-sdk/channel-targets` に置き、
  チャネル固有の内部実装は所有プラグインのローカル `api.js` または
  `runtime-api.js` シームの背後に保持してください。
- `image-generation`、`media-understanding`、`speech` のような機能固有
  サブパスは、現在バンドル済み / ネイティブプラグインがそれらを使用しているため
  存在しています。それらが存在すること自体は、exportされているすべてのヘルパーが
  長期的に凍結された外部コントラクトであることを意味しません。

## メッセージツールスキーマ

プラグインは、チャネル固有の `describeMessageTool(...)` スキーマ寄与を所有すべきです。
プロバイダー固有のフィールドは、共有コアではなくプラグイン内に保持してください。

共有可能なポータブルスキーマ断片については、
`openclaw/plugin-sdk/channel-actions` 経由でexportされる汎用ヘルパーを再利用してください。

- ボタングリッド形式のペイロードには `createMessageToolButtonsSchema()`
- 構造化カードペイロードには `createMessageToolCardSchema()`

あるスキーマ形状が1つのプロバイダーにしか意味を持たない場合は、それを共有SDKへ
昇格させるのではなく、そのプラグイン自身のソース内で定義してください。

## チャネルターゲット解決

チャネルプラグインは、チャネル固有のターゲットセマンティクスを所有すべきです。
共有アウトバウンドホストは汎用のままにし、プロバイダールールには
メッセージングアダプターサーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、ディレクトリ検索前に、正規化された
  ターゲットを `direct`、`group`、`channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、コアに対して、
  入力をディレクトリ検索ではなくID風の解決へ直接進めるべきかどうかを伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後に、
  コアがプロバイダー所有の最終解決を必要とする場合のプラグインフォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後の
  プロバイダー固有セッションルート構築を所有します。

推奨される分割:

- ピア / グループ検索前に行うべきカテゴリ判断には `inferTargetChatType` を使う
- 「これを明示的 / ネイティブなターゲットIDとして扱う」判定には `looksLikeId` を使う
- 広範なディレクトリ検索ではなく、プロバイダー固有の正規化フォールバックには
  `resolveTarget` を使う
- チャットID、スレッドID、JID、ハンドル、ルームIDのようなプロバイダーネイティブIDは、
  汎用SDKフィールドではなく、`target` 値またはプロバイダー固有パラメーター内に
  保持する

## 設定ベースのディレクトリ

設定からディレクトリエントリを導出するプラグインは、そのロジックをプラグイン内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用すべきです。

これは、チャネルが次のような設定ベースのピア / グループを必要とする場合に使用します。

- allowlist 駆動のDMピア
- 設定済みのチャネル / グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを扱います。

- クエリフィルタリング
- 件数制限の適用
- 重複排除 / 正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査とID正規化は、プラグイン実装側に残すべきです。

## プロバイダーカタログ

プロバイダープラグインは、
`registerProvider({ catalog: { run(...) { ... } } })` を使って推論用の
モデルカタログを定義できます。

`catalog.run(...)` は、OpenClawが `models.providers` に書き込むのと同じ形を返します。

- 1つのプロバイダーエントリに対しては `{ provider }`
- 複数のプロバイダーエントリに対しては `{ providers }`

プラグインが、プロバイダー固有のモデルID、base URLデフォルト、または認証に応じた
モデルメタデータを所有している場合は `catalog` を使用してください。

`catalog.order` は、OpenClawの組み込み暗黙プロバイダーに対して、
プラグインのカタログがいつマージされるかを制御します。

- `simple`: プレーンなAPIキーまたは環境駆動プロバイダー
- `profile`: 認証プロファイルが存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリを合成するプロバイダー
- `late`: 他の暗黙プロバイダーの後の最後のパス

後から来るプロバイダーがキー衝突時に優先されるため、プラグインは同じ
プロバイダーIDを持つ組み込みプロバイダーエントリを意図的に上書きできます。

互換性:

- `discovery` は従来の別名として引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClawは `catalog` を使用します

## 読み取り専用のチャネル検査

プラグインがチャネルを登録する場合は、`resolveAccount(...)` とあわせて
`plugin.config.inspectAccount(cfg, accountId)` の実装を優先してください。

理由:

- `resolveAccount(...)` はランタイムパスです。資格情報が完全に具体化されていることを
  前提にしてよく、必要なシークレットが不足している場合は即座に失敗できます。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、
  `openclaw channels resolve`、doctor / config修復フローのような
  読み取り専用コマンドパスでは、設定内容を説明するためだけにランタイム資格情報を
  具体化する必要があってはなりません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返す
- `enabled` と `configured` を保持する
- 関連する場合は、次のような資格情報のソース / ステータスフィールドを含める
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可能性を報告するためだけに、生のトークン値を返す必要はありません。
  ステータス系コマンドには、`tokenStatus: "available"`（および対応するソースフィールド）
  を返すだけで十分です。
- 資格情報がSecretRef経由で設定されているが、現在のコマンドパスでは利用できない場合は、
  `configured_unavailable` を使用する

これにより、読み取り専用コマンドは、クラッシュしたり、アカウントが未設定だと誤報したり
するのではなく、「設定されているが、このコマンドパスでは利用不可」と報告できます。

## パッケージパック

プラグインディレクトリには、`openclaw.extensions` を持つ `package.json` を含めることができます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリが1つのプラグインになります。パックに複数の拡張が列挙されている場合、
プラグインIDは `name/<fileBase>` になります。

プラグインがnpm依存関係をインポートする場合は、そのディレクトリ内にそれらを
インストールして `node_modules` を利用可能にしてください
（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、symlink解決後も
プラグインディレクトリ内に留まっていなければなりません。パッケージディレクトリ外へ
逃げるエントリは拒否されます。

セキュリティに関する注記: `openclaw plugins install` は、プラグイン依存関係を
`npm install --omit=dev --ignore-scripts` でインストールします
（ライフサイクルスクリプトなし、ランタイムでdev依存関係なし）。プラグイン依存ツリーは
「pure JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は、軽量なセットアップ専用モジュールを指すことができます。
OpenClawが無効化されたチャネルプラグイン向けのセットアップサーフェスを必要とするとき、
またはチャネルプラグインが有効でも未設定のときは、完全なプラグインエントリではなく
`setupEntry` をロードします。これにより、メインのプラグインエントリがツール、フック、
その他のランタイム専用コードも配線している場合に、起動とセットアップを軽量にできます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` を使うと、
チャネルがすでに設定済みであっても、Gatewayのpre-listen起動フェーズ中に、
チャネルプラグインを同じ `setupEntry` パスへオプトインさせることができます。

これを使用するのは、`setupEntry` が、Gatewayがlistenを開始する前に存在している必要がある
起動サーフェスを完全にカバーしている場合だけにしてください。実際には、セットアップ
エントリが、起動時に依存されるすべてのチャネル所有機能を登録している必要があります。たとえば:

- チャネル登録そのもの
- Gatewayがlistenを開始する前に利用可能である必要があるHTTPルート
- 同じ時間帯に存在している必要があるGatewayメソッド、ツール、またはサービス

完全エントリがまだ必須の起動機能を所有している場合は、このフラグを有効にしないでください。
デフォルト動作のままにし、OpenClawが起動中に完全エントリをロードするようにしてください。

バンドル済みチャネルは、完全なチャネルランタイムがロードされる前にコアが参照できる、
セットアップ専用のコントラクトサーフェスヘルパーを公開することもできます。
現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全なプラグインエントリをロードせずに、従来の単一アカウントチャネル設定を
`channels.<id>.accounts.*` へ昇格する必要があるときに、このサーフェスを使用します。
現在のバンドル例はMatrixです。すでに名前付きアカウントが存在する場合、認証 /
ブートストラップキーのみを名前付き昇格アカウントへ移動し、常に `accounts.default`
を作成するのではなく、設定済みの非正規default-accountキーを保持できます。

これらのセットアップパッチアダプターにより、バンドル済みコントラクトサーフェス検出は
遅延のまま保たれます。インポート時の負荷は軽く保たれ、昇格サーフェスはモジュール
インポート時にバンドル済みチャネル起動へ再突入するのではなく、最初の利用時にのみ
ロードされます。

これらの起動サーフェスにGateway RPCメソッドが含まれる場合は、それらをプラグイン固有の
プレフィックス上に置いてください。コア管理者名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約されており、プラグインが
より狭いスコープを要求しても、常に `operator.admin` に解決されます。

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

### チャネルカタログメタデータ

チャネルプラグインは、`openclaw.channel` を通じてセットアップ / 検出メタデータを、
`openclaw.install` を通じてインストールヒントを公開できます。これにより、コアの
カタログをデータフリーに保てます。

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

最小例を超えて有用な `openclaw.channel` フィールド:

- `detailLabel`: より豊かなカタログ / ステータスサーフェス向けの補助ラベル
- `docsLabel`: ドキュメントリンクのリンクテキストを上書きする
- `preferOver`: このカタログエントリが優先すべき、より低優先度のプラグイン /
  チャネルID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`:
  選択サーフェスのコピー制御
- `markdownCapable`: アウトバウンド整形判断のために、そのチャネルを
  markdown対応としてマークする
- `exposure.configured`: `false` に設定すると、そのチャネルを
  設定済みチャネル一覧サーフェスから非表示にする
- `exposure.setup`: `false` に設定すると、そのチャネルを対話型セットアップ /
  設定ピッカーから非表示にする
- `exposure.docs`: そのチャネルをドキュメントナビゲーションサーフェス向けに
  internal / private としてマークする
- `showConfigured` / `showInSetup`: 互換性のため従来の別名も引き続き受け付けますが、
  `exposure` を優先してください
- `quickstartAllowFrom`: そのチャネルを標準クイックスタート `allowFrom`
  フローにオプトインさせる
- `forceAccountBinding`: アカウントが1つしかない場合でも明示的なアカウント
  バインディングを要求する
- `preferSessionLookupForAnnounceTarget`: 通知ターゲット解決時にセッション検索を優先する

OpenClawは、**外部チャネルカタログ**（たとえば MPM レジストリエクスポート）を
マージすることもできます。次のいずれかにJSONファイルを配置してください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で、
1つ以上のJSONファイルを指定できます
（カンマ / セミコロン / `PATH` 区切り）。各ファイルには
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
を含める必要があります。パーサーは `"entries"` キーの従来の別名として
`"packages"` または `"plugins"` も受け付けます。

## コンテキストエンジンプラグイン

コンテキストエンジンプラグインは、取り込み、組み立て、圧縮のためのセッション
コンテキストオーケストレーションを所有します。プラグインから
`api.registerContextEngine(id, factory)` で登録し、アクティブなエンジンは
`plugins.slots.contextEngine` で選択します。

これは、単にメモリ検索やフックを追加するのではなく、デフォルトのコンテキスト
パイプラインを置き換えたり拡張したりする必要がある場合に使用します。

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

エンジンが圧縮アルゴリズムを**所有しない**場合でも、`compact()` は実装したまま、
明示的に委譲してください。

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

## 新しい機能を追加する

プラグインが現在のAPIに合わない動作を必要とする場合は、非公開の内部参照で
プラグインシステムを迂回しないでください。不足している機能を追加してください。

推奨される手順:

1. コアコントラクトを定義する
   コアが所有すべき共有動作を決めます。ポリシー、フォールバック、設定マージ、
   ライフサイクル、チャネル向けセマンティクス、ランタイムヘルパーの形です。
2. 型付きのプラグイン登録 / ランタイムサーフェスを追加する
   `OpenClawPluginApi` および / または `api.runtime` を、最小限で有用な
   型付き機能サーフェスで拡張します。
3. コア + チャネル / 機能コンシューマーを配線する
   チャネルと機能プラグインは、ベンダー実装を直接インポートするのではなく、
   コア経由で新しい機能を利用すべきです。
4. ベンダー実装を登録する
   その後、ベンダープラグインがその機能に対してバックエンドを登録します。
5. コントラクトカバレッジを追加する
   所有権と登録形状が時間が経っても明示的なままになるように、テストを追加します。

これが、OpenClawが意見を持ちながらも、1つのプロバイダーの世界観にハードコード
されない理由です。具体的なファイルチェックリストと実例については、
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### 機能チェックリスト

新しい機能を追加する際、実装は通常これらのサーフェスをまとめて触るべきです。

- `src/<capability>/types.ts` 内のコアコントラクト型
- `src/<capability>/runtime.ts` 内のコアランナー / ランタイムヘルパー
- `src/plugins/types.ts` 内のプラグインAPI登録サーフェス
- `src/plugins/registry.ts` 内のプラグインレジストリ配線
- 機能 / チャネルプラグインが利用する必要がある場合の
  `src/plugins/runtime/*` 内のプラグインランタイム公開
- `src/test-utils/plugin-registration.ts` 内のキャプチャ / テストヘルパー
- `src/plugins/contracts/registry.ts` 内の所有権 / コントラクト検証
- `docs/` 内のオペレーター / プラグインドキュメント

これらのサーフェスのいずれかが欠けている場合、それは通常、その機能がまだ完全には
統合されていない兆候です。

### 機能テンプレート

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

コントラクトテストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールはシンプルに保たれます。

- コアが機能コントラクト + オーケストレーションを所有する
- ベンダープラグインがベンダー実装を所有する
- 機能 / チャネルプラグインがランタイムヘルパーを利用する
- コントラクトテストが所有権を明示的に保つ
