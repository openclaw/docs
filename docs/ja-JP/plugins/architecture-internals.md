---
read_when:
    - |-
      OpenClaw_docs_i18n_input>
      プロバイダーランタイムフック、チャンネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しいPlugin機能またはコンテキストエンジンPluginの追加
summary: 'Plugin アーキテクチャ内部: ロードパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照テーブル'
title: Plugin アーキテクチャの内部
x-i18n:
    generated_at: "2026-07-05T11:30:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46084f1182c08c2adfb18f1f1aebd83eb2bf8cd3430b4fdd9b79849ba0cade1d
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の形状、所有権/実行コントラクトについては、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページでは、ロードパイプライン、レジストリ、ランタイムフック、Gateway HTTP ルート、インポートパス、スキーマテーブルといった内部メカニクスを扱います。

## ロードパイプライン

起動時、OpenClaw はおおむね次を実行します。

1. 候補プラグインルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. プラグイン設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補の有効化を決定する
6. 有効なネイティブモジュールをロードする: ビルド済みのバンドルモジュールはネイティブローダーを使用し、
   サードパーティのローカルソース TypeScript は緊急用の Jiti フォールバックを使用する
7. ネイティブ `register(api)` フックを呼び出し、登録内容をプラグインレジストリに収集する
8. レジストリをコマンド/ランタイムサーフェスに公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在するほう（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべてのバンドルプラグインは `register` を使用します。新しいプラグインでは `register` を優先してください。
</Note>

安全ゲートはランタイム実行の**前**に実行されます。検出は次の場合に候補をブロックします。

- 解決されたエントリがプラグインルートの外へ出る
- そのパス（またはそのルートディレクトリ）が誰でも書き込み可能である
- バンドルされていないプラグインについて、パスの所有者が現在の uid（または root）と一致しない

誰でも書き込み可能なバンドルディレクトリは、ゲートが再チェックする前に、まずその場で `chmod` による修復が試行されます（npm/グローバルインストールではパッケージディレクトリが `0777` で配布されることがあります）。所有権チェックはバンドル起点では完全にスキップされます。

ブロックされた候補でも、既知の場合は出力される診断にプラグイン id が含まれます（それ以外なら拒否されるディレクトリ内のマニフェストから解決された id も含む）。そのため、その id を参照する設定では、無関係な「不明なプラグイン」エラーではなく、パス安全性警告に紐づくブロック済みプラグインとして表示されます。

### マニフェスト優先の動作

マニフェストはコントロールプレーンの信頼できる情報源です。OpenClaw はこれを使用して次を行います。

- プラグインを識別する
- 宣言されたチャンネル/Skills/設定スキーマまたはバンドル capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル/プレースホルダーを補強する
- インストール/カタログメタデータを表示する
- プラグインランタイムをロードせずに、安価なアクティベーションとセットアップ記述子を保持する

ネイティブプラグインでは、ランタイムモジュールがデータプレーン部分です。これはフック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

任意のマニフェスト `activation` ブロックと `setup` ブロックはコントロールプレーンに残ります。これらはアクティベーション計画とセットアップ検出のためのメタデータ専用記述子です。ランタイム登録、`register(...)`、`setupEntry` を置き換えるものではありません。ライブアクティベーションの利用側は、マニフェストのコマンド、チャンネル、プロバイダーのヒントを使用して、より広いレジストリ実体化の前にプラグインロードを絞り込みます。

- CLI ロードは、要求されたプライマリコマンドを所有するプラグインに絞り込む
- チャンネルのセットアップ/プラグイン解決は、要求されたチャンネル id を所有するプラグインに絞り込む
- 明示的なプロバイダーのセットアップ/ランタイム解決は、要求されたプロバイダー id を所有するプラグインに絞り込む
- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使用する。起動メタデータのないプラグインは、より狭いアクティベーショントリガーを通じてのみロードされる

アクティベーションプランナーは、既存の呼び出し元向けの id のみの API と、診断向けのプラン API の両方を公開します。プランエントリは、プラグインが選択された理由を報告し、明示的な `activation.*` ヒントとマニフェスト所有権フォールバックを分離します。

| 理由（`activation.*` ヒント由来）   | 理由（マニフェスト所有権由来）                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| —（フックトリガーにはヒントのバリアントがない） | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

この理由の分離が互換性の境界です。既存のプラグインメタデータは動作を続け、新しいコードはランタイムロードのセマンティクスを変えずに、広いヒントやフォールバック動作を検出できます。

広い `all` スコープを要求するリクエスト時のランタイム事前ロードでも、設定、起動計画、設定済みチャンネル、スロット、自動有効化ルールから、明示的に有効なプラグイン id セットを導出します（`src/plugins/effective-plugin-ids.ts` の `resolveEffectivePluginIds`）。導出されたセットが空の場合、OpenClaw はすべての検出可能なプラグインへ拡張せず、スコープを空のままにします。

セットアップ検出では、`setup.providers` や `setup.cliBackends` などの記述子所有 id を優先して候補プラグインを絞り込み、その後、セットアップ時ランタイムフックをまだ必要とするプラグインについて `setup-api` にフォールバックします。プロバイダーセットアップ一覧は、プロバイダーランタイムをロードせずに、マニフェストの `providerAuthChoices`、記述子から導出されたセットアップ選択肢、インストールカタログメタデータを使用します。明示的な `setup.requiresRuntime: false` は記述子専用の打ち切りです。省略された `requiresRuntime` は互換性のためにレガシーの setup-api フォールバックを維持します。複数の検出済みプラグインが同じ正規化済みセットアッププロバイダーまたは CLI バックエンド id を主張する場合、セットアップ検索は検出順に依存せず、曖昧な所有者を拒否します。セットアップランタイムが実行される場合、レジストリ診断はレガシープラグインをブロックせずに、`setup.providers` / `setup.cliBackends` と setup-api が実際に登録したプロバイダーまたは CLI バックエンドのずれを報告します。

### プラグインキャッシュ境界

OpenClaw は、プラグイン検出結果や直接のマニフェストレジストリデータを、実時間ウィンドウの背後にキャッシュしません。インストール、マニフェスト編集、ロードパス変更は、次の明示的なメタデータ読み取りまたはスナップショット再構築で可視になる必要があります。マニフェストファイルパーサーは、開かれたマニフェストパスに加えてデバイス/inode、サイズ、mtime/ctime をキーにした、境界付きのファイル署名キャッシュを保持します。このキャッシュは未変更のバイト列の再解析を避けるだけであり、検出、レジストリ、所有者、ポリシーの回答をキャッシュしてはなりません。

安全なメタデータ高速パスは、隠れたキャッシュではなく明示的なオブジェクト所有権です。Gateway 起動のホットパスでは、現在の `PluginMetadataSnapshot`、導出された `PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出しチェーンに渡すべきです。設定検証、起動時の自動有効化、プラグインブートストラップ、プロバイダー選択は、それらのオブジェクトが現在の設定とプラグインインベントリを表している間は再利用できます。セットアップ検索は、特定のセットアップパスが明示的なマニフェストレジストリを受け取らない限り、引き続き必要に応じてマニフェストメタデータを再構築します。隠れた検索キャッシュを追加するのではなく、これをコールドパスフォールバックとして維持してください。入力が変わったら、スナップショットを変更したり履歴コピーを保持したりせず、再構築して置き換えます。アクティブなプラグインレジストリ上のビューとバンドルチャンネルのブートストラップヘルパーは、現在のレジストリ/ルートから再計算すべきです。1 回の呼び出し内で作業の重複排除や再入防止に使う短命のマップは問題ありませんが、プロセスメタデータキャッシュになってはなりません。

プラグインロードにおいて、永続キャッシュ層はランタイムロードです。コードやインストール済みアーティファクトが実際にロードされる場合、次のようなローダー状態を再利用できます。

- `PluginLoaderCacheState` と互換性のあるアクティブランタイムレジストリ
- 同じランタイムサーフェスを繰り返しインポートしないために使われる jiti/モジュールキャッシュと公開サーフェスローダーキャッシュ
- インストール済みプラグインアーティファクト用のファイルシステムキャッシュ
- パス正規化や重複解決のための、呼び出しごとの短命マップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイムロードを要求していない限り、「どのプラグインがこのプロバイダーを所有しているか」のようなコントロールプレーンの質問に答えてはなりません。

次のものに対して、永続キャッシュや実時間キャッシュを追加しないでください。

- 検出結果
- 直接のマニフェストレジストリ
- インストール済みプラグインインデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者検索、モデル抑制、プロバイダーポリシー、公開アーティファクトメタデータ
- 変更されたマニフェスト、インストール済みインデックス、ロードパスが次のメタデータ読み取りで可視になるべき、その他のマニフェスト由来の回答

永続化されたインストール済みプラグインインデックスからマニフェストメタデータを再構築する呼び出し元は、そのレジストリを必要に応じて再構築します。インストール済みインデックスは耐久性のあるソースプレーン状態であり、隠れたプロセス内メタデータキャッシュではありません。

## レジストリモデル

ロードされたプラグインは、任意のコアグローバルを直接変更しません。中央のプラグインレジストリ（`src/plugins/registry-types.ts` の `PluginRegistry`）に登録します。このレジストリは、プラグインレコード（識別情報、ソース、起点、ステータス、診断）に加え、あらゆる capability の配列を追跡します。ツール、レガシーフックと型付きフック、チャンネル、プロバイダー、Gateway RPC ハンドラー、HTTP ルート、CLI 登録機能、バックグラウンドサービス、プラグイン所有コマンド、さらに多数の型付きプロバイダーファミリー（音声、埋め込み、画像/動画/音楽生成、Web 取得/検索、エージェントハーネス、セッションアクションなど）です。

その後、コア機能はプラグインモジュールと直接やり取りするのではなく、そのレジストリから読み取ります。これにより、ロードは一方向に保たれます。

- プラグインモジュール -> レジストリ登録
- コアランタイム -> レジストリ消費

この分離は保守性にとって重要です。つまり、ほとんどのコアサーフェスは「レジストリを読む」という 1 つの統合点だけで済み、「すべてのプラグインモジュールを特別扱いする」必要がありません。

## 会話バインディングコールバック

会話をバインドするプラグインは、承認が解決されたときに反応できます。

バインド要求が承認または拒否された後にコールバックを受け取るには、`api.onConversationBindingResolved(...)` を使用します。

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

コールバックペイロードのフィールド:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認された要求の解決済みバインディング
- `request`: 元の要求サマリー、デタッチヒント、送信者 id、会話メタデータ

このコールバックは通知専用です。会話のバインドを許可される対象は変更せず、コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダープラグインには 3 つの層があります。

- 安価なランタイム前検索のための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨の互換性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **設定時フック**: `catalog`（レガシー `discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、ストリームラッピング、thinking レベル、リプレイポリシー、使用量エンドポイントをカバーする 40 個以上の任意フック。[フックの順序と使用法](#hook-order-and-usage)を参照してください。

OpenClaw は引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、ツールポリシーを所有します。これらのフックは、プロバイダー固有の動作を拡張するためのサーフェスであり、まるごとカスタム推論トランスポートを必要としません。

プロバイダーに環境変数ベースの認証情報があり、汎用の認証、状態、モデルピッカーの経路が Plugin ランタイムを読み込まずに参照する必要がある場合は、マニフェストの `setup.providers[].envVars` を使用します。非推奨の `providerAuthEnvVars` は非推奨期間中、互換性アダプターによって引き続き読み取られ、これを使用する非バンドル Plugin にはマニフェスト診断が出ます。あるプロバイダー ID が別のプロバイダー ID の環境変数、認証プロファイル、設定に基づく認証、API キーのオンボーディング選択を再利用する必要がある場合は、マニフェストの `providerAuthAliases` を使用します。オンボーディングや認証選択の CLI サーフェスが、プロバイダーランタイムを読み込まずにプロバイダーの選択 ID、グループラベル、単純な 1 フラグの認証配線を把握する必要がある場合は、マニフェストの `providerAuthChoices` を使用します。オンボーディングラベルや OAuth のクライアント ID、クライアントシークレット設定変数など、オペレーター向けのヒントには、プロバイダーランタイムの `envVars` を維持してください。

チャンネルに環境変数で駆動される認証またはセットアップがあり、汎用のシェル環境フォールバック、設定や状態のチェック、セットアッププロンプトがチャンネルランタイムを読み込まずに参照する必要がある場合は、マニフェストの `channelEnvVars` を使用します。

### フックの順序と使用方法

モデルまたはプロバイダー Plugin では、OpenClaw はおおよそ次の順序でフックを呼び出します。
「使用するタイミング」列は、素早く判断するためのガイドです。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在は呼び出さない互換性専用のプロバイダーフィールドは、意図的にここには記載していません。

| フック                            | 機能                                                                                                           | 使用するタイミング                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` へ公開する                                         | プロバイダーがカタログまたはベース URL デフォルトを所有する場合                                                                              |
| `applyConfigDefaults`             | 設定の具現化中に、プロバイダー所有のグローバル設定デフォルトを適用する                                         | デフォルトが認証モード、env、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                              |
| _(組み込みモデル検索)_            | OpenClaw はまず通常のレジストリ/カタログパスを試す                                                            | _(プラグインフックではない)_                                                                                                                  |
| `normalizeModelId`                | 検索前にレガシーまたはプレビューのモデル ID エイリアスを正規化する                                            | 正規モデル解決の前に、プロバイダーがエイリアスのクリーンアップを所有する場合                                                                |
| `normalizeTransport`              | 汎用モデル組み立ての前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                             | 同じトランスポートファミリー内のカスタムプロバイダー ID について、プロバイダーがトランスポートのクリーンアップを所有する場合                |
| `normalizeConfig`                 | ランタイム/プロバイダー解決の前に `models.providers.<id>` を正規化する                                        | プラグイン側に置くべき設定クリーンアップがプロバイダーに必要な場合。バンドルされた Google ファミリーヘルパーも、サポート対象の Google 設定エントリを補完する |
| `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブストリーミング使用量互換の書き換えを適用する                                     | プロバイダーに、エンドポイント駆動のネイティブストリーミング使用量メタデータ修正が必要な場合                                                |
| `resolveConfigApiKey`             | ランタイム認証の読み込み前に、設定プロバイダーの env マーカー認証を解決する                                  | プロバイダーが独自の env マーカー API キー解決フックを公開する場合                                                                           |
| `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたは設定ベースの認証を表面化する                                  | プロバイダーが合成/ローカル資格情報マーカーで動作できる場合                                                                                  |
| `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/app 所有の認証情報ではデフォルトの `persistence` は `runtime-only` | コピーしたリフレッシュトークンを永続化せずに、プロバイダーが外部認証資格情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを env/設定ベース認証の背後に下げる                                | プロバイダーが、優先順位で勝つべきではない合成プレースホルダープロファイルを保存する場合                                                    |
| `resolveDynamicModel`             | ローカルレジストリにまだない、プロバイダー所有のモデル ID 向けの同期フォールバック                           | プロバイダーが任意のアップストリームモデル ID を受け入れる場合                                                                               |
| `prepareDynamicModel`             | 非同期ウォームアップ後に `resolveDynamicModel` を再実行する                                                   | 不明な ID を解決する前に、プロバイダーにネットワークメタデータが必要な場合                                                                  |
| `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使う前の最終書き換え                                                       | プロバイダーにトランスポート書き換えが必要だが、引き続きコアトランスポートを使う場合                                                        |
| `normalizeToolSchemas`            | 埋め込みランナーに渡る前にツールスキーマを正規化する                                                         | プロバイダーにトランスポートファミリーのスキーマクリーンアップが必要な場合                                                                  |
| `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を表面化する                                                       | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい場合                                                          |
| `resolveReasoningOutputMode`      | ネイティブかタグ付きかの reasoning 出力コントラクトを選択する                                                | ネイティブフィールドではなく、タグ付き reasoning/最終出力がプロバイダーに必要な場合                                                         |
| `prepareExtraParams`              | 汎用ストリームオプションラッパーの前にリクエストパラメーターを正規化する                                     | プロバイダーにデフォルトリクエストパラメーターまたはプロバイダー別パラメーターのクリーンアップが必要な場合                                  |
| `createStreamFn`                  | 通常のストリームパスをカスタムトランスポートで完全に置き換える                                               | ラッパーだけでなく、カスタムワイヤープロトコルがプロバイダーに必要な場合                                                                    |
| `wrapStreamFn`                    | 汎用ラッパー適用後のストリームラッパー                                                                       | カスタムトランスポートなしで、リクエストヘッダー/ボディ/モデル互換ラッパーがプロバイダーに必要な場合                                        |
| `resolveTransportTurnState`       | ネイティブのターン単位トランスポートヘッダーまたはメタデータを付与する                                       | 汎用トランスポートにプロバイダーネイティブのターン ID を送らせたい場合                                                                       |
| `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付与する                                  | 汎用 WS トランスポートでセッションヘッダーやフォールバックポリシーを調整したい場合                                                          |
| `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                     | プロバイダーが追加の認証メタデータを保存し、カスタムのランタイムトークン形状を必要とする場合                                                |
| `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き              | プロバイダーが共有 OpenClaw リフレッシャーに合わない場合                                                                                     |
| `buildAuthDoctorHint`             | OAuth リフレッシュ失敗時に追加される修復ヒント                                                               | リフレッシュ失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合                                                                      |
| `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                            | 汎用ヒューリスティックでは見逃す生のオーバーフローエラーがプロバイダーにある場合                                                            |
| `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                   | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などへ対応付けられる場合                                                      |
| `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                          | プロバイダーにプロキシ固有のキャッシュ TTL ゲートが必要な場合                                                                                |
| `buildMissingAuthMessage`         | 汎用の認証不足リカバリーメッセージの置き換え                                                                 | プロバイダー固有の認証不足リカバリーヒントが必要な場合                                                                                      |
| `augmentModelCatalog`             | 発見後に追加される合成/最終カタログ行 (非推奨、下記参照)                                                     | `models list` とピッカーで、プロバイダーに合成の前方互換行が必要な場合                                                                       |
| `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                   | 選択されたモデル向けに、プロバイダーがカスタム thinking 段階またはバイナリラベルを公開する場合                                              |
| `isBinaryThinking`                | オン/オフ reasoning トグル互換フック                                                                          | プロバイダーがバイナリ thinking のオン/オフのみを公開する場合                                                                                |
| `supportsXHighThinking`           | `xhigh` reasoning サポート互換フック                                                                          | プロバイダーがモデルの一部にのみ `xhigh` を有効にしたい場合                                                                                  |
| `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                          | モデルファミリーのデフォルト `/think` ポリシーをプロバイダーが所有する場合                                                                   |
| `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                      | プロバイダーがライブ/スモークの推奨モデルマッチングを所有する場合                                                                           |
| `prepareRuntimeAuth`              | 推論の直前に、設定済み資格情報を実際のランタイムトークン/キーへ交換する                                      | プロバイダーにトークン交換または短命リクエスト資格情報が必要な場合                                                                          |
| `resolveUsageAuth`                | `/usage` と関連ステータスサーフェス向けに使用量/請求資格情報を解決する                                       | プロバイダーにカスタムの使用量/クォータトークン解析または別の使用量資格情報が必要な場合                                                     |
| `fetchUsageSnapshot`              | 認証解決後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                         | プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要な場合                                                                 |
| `createEmbeddingProvider`         | メモリ/検索用のプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダー Plugin に属する                                                                                    |
| `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにはカスタムトランスクリプトポリシーが必要（たとえば、thinking ブロックの除去）                                                               |
| `sanitizeReplayHistory`           | 汎用トランスクリプトのクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーには共有 Compaction ヘルパーを超えた、プロバイダー固有のリプレイ書き換えが必要                                                             |
| `validateReplayTurns`             | 埋め込み runner の前に最終的なリプレイターン検証または整形を行う                                           | プロバイダーのトランスポートには汎用サニタイズ後のより厳密なターン検証が必要                                                                    |
| `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったとき、プロバイダーにはテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダーPluginを確認し、その後、モデル ID またはトランスポート/設定を実際に変更するものが見つかるまで、他のフック対応プロバイダーPluginへフォールスルーします。これにより、呼び出し元がどのバンドルPluginが書き換えを所有しているかを知る必要なく、エイリアス/互換プロバイダーシムが機能し続けます。サポート対象の Google 系設定エントリを書き換えるプロバイダーフックがない場合でも、バンドルされた Google 設定ノーマライザーがその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤプロトコルやカスタムリクエスト実行器を必要とする場合、それは別の種類の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き動作するプロバイダー動作のためのものです。

`resolveUsageAuth` は、OpenClaw が `fetchUsageSnapshot` を呼び出すべきか、使用量/ステータス画面向けに汎用の資格情報解決へフォールバックすべきかを決定します。プロバイダーに使用量用の資格情報がある場合は `{ token, accountId? }` を返し、プロバイダー所有の使用量認証がリクエストを処理済みで、汎用 API キー/OAuth フォールバックを抑制する必要がある場合は `{ handled: true }` を返し、プロバイダーが使用量認証を処理しなかった場合は `null` または `undefined` を返します。

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

### 組み込み例

バンドルされたプロバイダーPluginは、上記のフックを組み合わせて、各ベンダーのカタログ、認証、思考、リプレイ、使用量の要件に適合します。信頼できるフックセットは `extensions/` 配下の各Pluginにあります。このページでは、一覧をそのまま反映するのではなく形を示します。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的カタログより先にアップストリームのモデル ID を提示できるようにします。
  </Accordion>
  <Accordion title="OAuth と使用量エンドポイントプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせ、トークン交換と `/usage` 統合を所有します。
  </Accordion>
  <Accordion title="リプレイとトランスクリプトクリーンアップファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各Pluginがクリーンアップを再実装する代わりに、プロバイダーが `buildReplayPolicy` を通じてトランスクリプトポリシーを選択できます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine` は `catalog` だけを登録し、共有推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic 固有のストリームヘルパー">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）の内側にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Pluginは `api.runtime` を通じて、選択されたコアヘルパーにアクセスできます。TTS の場合:

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

注:

- `textToSpeech` は、ファイル/ボイスメモ画面向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファ + サンプルレートを返します。Pluginはプロバイダー向けにリサンプリング/エンコードする必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローに使用します。
- 音声一覧には、ロケール、性別、パーソナリティタグなど、プロバイダー対応ピッカー向けのより豊富なメタデータを含められます。
- OpenAI と ElevenLabs は現在テレフォニーをサポートしています。Microsoft はサポートしていません。

Pluginは `api.registerSpeechProvider(...)` によって音声プロバイダーも登録できます。

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

注:

- TTS ポリシー、フォールバック、返信配信はコアに置きます。
- ベンダー所有の合成動作には音声プロバイダーを使用します。
- レガシー Microsoft `edge` 入力は `microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは会社指向です。OpenClaw がこれらの機能契約を追加するにつれて、1 つのベンダーPluginがテキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像/音声/動画理解では、Pluginは汎用のキー/値バッグではなく、型付きのメディア理解プロバイダーを 1 つ登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注:

- オーケストレーション、フォールバック、設定、チャネル配線はコアに置きます。
- ベンダー動作はプロバイダーPluginに置きます。
- 追加的な拡張は型付きのままにします。新しい任意メソッド、新しい任意結果フィールド、新しい任意機能です。
- 動画生成はすでに同じパターンに従っています。
  - コアが機能契約とランタイムヘルパーを所有します
  - ベンダーPluginが `api.registerVideoGenerationProvider(...)` を登録します
  - 機能/チャネルPluginが `api.runtime.videoGeneration.*` を利用します

メディア理解ランタイムヘルパーでは、Pluginは次を呼び出せます。

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

音声文字起こしでは、Pluginはメディア理解ランタイムまたは古い STT エイリアスのどちらかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注:

- `api.runtime.mediaUnderstanding.*` は、画像/音声/動画理解向けの推奨共有サーフェスです。
- `extractStructuredWithModel(...)` は、範囲を限定したプロバイダー所有の画像優先抽出に対するPlugin向け境界です。少なくとも 1 つの画像入力を含めます。テキスト入力は補助的なコンテキストです。プロダクトPluginが自身のルートとスキーマを所有し、OpenClaw がプロバイダー/ランタイム境界を所有します。
- コアのメディア理解音声設定（`tools.media.audio`）とプロバイダーフォールバック順を使用します。
- 文字起こし出力が生成されない場合（たとえばスキップ/非対応入力）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換エイリアスとして残ります。

Pluginは `api.runtime.subagent` を通じてバックグラウンドサブエージェント実行も起動できます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注:

- `provider` と `model` は実行ごとの任意オーバーライドであり、永続的なセッション変更ではありません。
- OpenClaw は信頼済み呼び出し元に対してのみ、これらのオーバーライドフィールドを尊重します。
- Plugin所有のフォールバック実行では、オペレーターが `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、信頼済みPluginを特定の正規 `provider/model` ターゲットに制限するか、`"*"` で任意のターゲットを明示的に許可します。
- 信頼されていないPluginのサブエージェント実行も引き続き動作しますが、オーバーライドリクエストは暗黙にフォールバックするのではなく拒否されます。
- Pluginが作成したサブエージェントセッションには、作成元Plugin ID がタグ付けされます。フォールバックの `api.runtime.subagent.deleteSession(...)` は、それらの所有セッションのみを削除できます。任意のセッション削除には、引き続き管理者スコープの Gateway リクエストが必要です。

Web 検索では、Pluginはエージェントツール配線に入り込む代わりに、共有ランタイムヘルパーを利用できます。

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

Pluginは `api.registerWebSearchProvider(...)` によって Web 検索プロバイダーも登録できます。

注:

- プロバイダー選択、資格情報解決、共有リクエストセマンティクスはコアに置きます。
- ベンダー固有の検索トランスポートには Web 検索プロバイダーを使用します。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せず検索動作を必要とする機能/チャネルPlugin向けの推奨共有サーフェスです。

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

## Gateway HTTP ルート

Pluginは `api.registerHttpRoute(...)` で HTTP エンドポイントを公開できます。

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
- `auth`: 必須。`"gateway"` または `"plugin"`。通常の Gateway 認証を要求するには `"gateway"` を使い、Plugin 管理の認証/Webhook 検証には `"plugin"` を使います。
- `match`: 省略可能。`"exact"`（デフォルト）または `"prefix"`。
- `handleUpgrade`: 同じルート上の WebSocket アップグレード要求向けの省略可能なハンドラー。
- `replaceExisting`: 省略可能。同じ Plugin が自分自身の既存ルート登録を置き換えられるようにします。
- `handler`: ルートが要求を処理した場合は `true` を返します。

注:

- `api.registerHttpHandler(...)` は削除されており、Plugin 読み込みエラーを発生させます。代わりに `api.registerHttpRoute(...)` を使ってください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` でない限り拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- 異なる `auth` レベルを持つ重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ認証レベルのみにしてください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動的には受け取りません。これは Plugin 管理の Webhook/署名検証向けであり、特権的な Gateway ヘルパー呼び出し向けではありません。
- `auth: "gateway"` ルートは、Gateway 要求ランタイムスコープ内で実行されます。デフォルトのサーフェス（`gatewayRuntimeScopeSurface: "write-default"`）は意図的に保守的です:
  - 共有シークレットのベアラー認証（`gateway.auth.mode = "token"` / `"password"`）と、信頼済みプロキシ以外の認証方式では、呼び出し元が `x-openclaw-scopes` を送信しても、単一の `operator.write` スコープを取得します
  - 明示的な `x-openclaw-scopes` ヘッダーを持たない `trusted-proxy` 呼び出し元も、従来の `operator.write` のみのサーフェスを維持します
  - `x-openclaw-scopes` を送信する `trusted-proxy` 呼び出し元は、代わりに宣言されたスコープを取得します
  - ルートは `gatewayRuntimeScopeSurface: "trusted-operator"` を選択することで、ID を伴う認証モードでは常に `x-openclaw-scopes` を尊重できます（ヘッダーがない場合は、完全な CLI デフォルトスコープセットにフォールバックします）
- 実用上のルール: Gateway 認証の Plugin ルートが暗黙の管理者サーフェスであると想定しないでください。ルートに管理者専用の動作が必要な場合は、`trusted-operator` スコープサーフェスを選択し、ID を伴う認証モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK のインポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルートバレルではなく、狭い SDK サブパスを使ってください。コアサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャンネルのエントリー/ビルドヘルパー              |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括的な契約                     |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャンネル Plugin は、狭い継ぎ目のファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。承認動作は、無関係な
Plugin フィールドをまたいで混在させるのではなく、1 つの `approvalCapability` 契約に統合する必要があります。[チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムと設定ヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）配下にあります。広範な `config-runtime` 互換バレルの代わりに、
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`
を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
小さなチャンネルヘルパーファサード、`openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換シムです。
新しいコードでは、代わりにより狭い汎用プリミティブをインポートする必要があります。
</Info>

リポジトリ内部のエントリーポイント（バンドル Plugin パッケージルートごと）:

- `index.js` — バンドル Plugin エントリー
- `api.js` — ヘルパー/型バレル
- `runtime-api.js` — ランタイム専用バレル
- `setup-entry.js` — セットアップ Plugin エントリー

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートしてください。コアまたは別の Plugin から、別の Plugin パッケージの `src/*` をインポートしてはいけません。
ファサード読み込みのエントリーポイントは、存在する場合はアクティブなランタイム設定スナップショットを優先し、その後ディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`, `media-understanding`, `speech` などの機能固有サブパスは、現在バンドル Plugin が使っているため存在します。これらは自動的に長期固定の外部契約になるわけではありません — 依存する場合は関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票などの非メッセージプリミティブ向けに、チャンネル固有の `describeMessageTool(...)` スキーマ提供を所有する必要があります。
共有送信プレゼンテーションは、プロバイダー固有のボタン、コンポーネント、ブロック、カードフィールドではなく、汎用の `MessagePresentation` 契約を使う必要があります。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作者チェックリストについては、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ機能を通じて何をレンダリングできるかを宣言します:

- `presentation`: セマンティックなプレゼンテーションブロック（`text`, `context`, `divider`, `buttons`, `select`）
- `delivery-pin`: ピン留め配信要求

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに劣化させるかを決定します。
汎用メッセージツールから、プロバイダー固有 UI の抜け道を公開しないでください。
レガシーネイティブスキーマ向けの非推奨 SDK ヘルパーは既存のサードパーティ Plugin のために引き続きエクスポートされますが、新しい Plugin はそれらを使うべきではありません。

## チャンネルターゲット解決

チャンネル Plugin は、チャンネル固有のターゲットセマンティクスを所有する必要があります。共有アウトバウンドホストは汎用のままにし、プロバイダールールにはメッセージングアダプターサーフェスを使ってください:

- `messaging.inferTargetChatType({ to })` は、正規化済みターゲットをディレクトリ検索の前に `direct`, `group`, `channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力がディレクトリ検索ではなく ID らしい解決へ直接進むべきかどうかをコアに伝えます。
- `messaging.targetResolver.reservedLiterals` は、そのプロバイダーにおけるチャンネル/セッション参照である裸の単語を列挙します。解決では、予約リテラルを拒否する前に設定済みディレクトリエントリーを保持し、その後ディレクトリミスではフェイルクローズします。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後に、コアが最終的なプロバイダー所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲットが解決された後のプロバイダー固有のセッションルート構築を所有します。

推奨される分割:

- ピア/グループ検索の前に発生すべきカテゴリ判断には `inferTargetChatType` を使います。
- 「これを明示的/ネイティブなターゲット ID として扱う」チェックには `looksLikeId` を使います。
- 広範なディレクトリ検索ではなく、プロバイダー固有の正規化フォールバックには `resolveTarget` を使います。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダーネイティブ ID は、汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有パラメーター内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリーを導出する Plugin は、そのロジックを Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用する必要があります。

チャンネルで次のような設定に基づくピア/グループが必要な場合に使ってください:

- 許可リスト駆動の DM ピア
- 設定済みチャンネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを扱います:

- クエリフィルタリング
- 制限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャンネル固有のアカウント検査と ID 正規化は、Plugin 実装内に残す必要があります。

## プロバイダーカタログ

プロバイダー Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` を使って推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します:

- `{ provider }`: 1 つのプロバイダーエントリー
- `{ providers }`: 複数のプロバイダーエントリー

Plugin がプロバイダー固有のモデル ID、ベース URL デフォルト、または認証で保護されたモデルメタデータを所有する場合は、`catalog` を使ってください。

`catalog.order` は、Plugin のカタログが OpenClaw の組み込み暗黙プロバイダーに対していつマージされるかを制御します:

- `simple`: プレーンな API キーまたは環境変数駆動のプロバイダー
- `profile`: 認証プロファイルが存在する場合に現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリーを合成するプロバイダー
- `late`: 最後のパス。他の暗黙プロバイダーの後

後のプロバイダーはキー衝突時に優先されるため、Plugin は同じプロバイダー ID を持つ組み込みプロバイダーエントリーを意図的に上書きできます。

Plugin は、`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて読み取り専用モデル行を公開することもできます。これは list/help/picker サーフェス向けの将来の経路であり、
`text`, `voice`, `image_generation`, `video_generation`, `music_generation`
行をサポートします。プロバイダー Plugin は引き続きライブエンドポイント呼び出し、トークン交換、ベンダーレスポンスマッピングを所有します。コアは共通の行の形、ソースラベル、メディアツールヘルプの整形を所有します。メディア生成プロバイダー登録は、`defaultModel`, `models`, `capabilities` から静的カタログ行を自動的に合成します。

互換性:

- `discovery` はレガシーエイリアスとして引き続き動作しますが、非推奨警告を出します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使い、警告を出します
- `augmentModelCatalog` は非推奨です。バンドルプロバイダーは、`registerModelCatalogProvider` を通じて補足行を公開する必要があります

## 読み取り専用チャンネル検査

Plugin がチャンネルを登録する場合は、`resolveAccount(...)` と並べて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを優先してください。

理由:

- `resolveAccount(...)` はランタイム経路です。資格情報が完全に具体化されていることを前提にでき、必要なシークレットがない場合は即座に失敗できます。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  修復フローなどの読み取り専用コマンド経路は、設定を説明するためだけにランタイム資格情報を具体化する必要があってはなりません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような資格情報ソース/ステータスフィールドを含めます:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可否を報告するためだけに生のトークン値を返す必要はありません。ステータス形式のコマンドには、`tokenStatus: "available"`（および対応するソースフィールド）を返せば十分です。
- 資格情報が SecretRef 経由で設定されているものの、現在のコマンド経路では利用できない場合は `configured_unavailable` を使います。

これにより、読み取り専用コマンドはクラッシュしたり、アカウントが未設定だと誤報告したりする代わりに、「このコマンド経路では設定済みだが利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を持つ `package.json` を含めることができます:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリーは Plugin になります。パックが複数の拡張を列挙している場合、Plugin ID は `<manifestOrPackageName>/<fileBase>` になります（存在する場合はマニフェスト ID が優先され、それ以外の場合はスコープなしの `package.json` 名になります）。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリでインストールし、
`node_modules` を利用できるようにします（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、シンボリックリンク解決後も Plugin
ディレクトリ内に留まる必要があります。パッケージディレクトリの外へ抜けるエントリは
拒否されます。

セキュリティメモ: `openclaw plugins install` は、Plugin の依存関係を
プロジェクトローカルの `npm install --omit=dev --ignore-scripts` でインストールします（ライフサイクルスクリプトなし、
ランタイムでの dev 依存関係なし）。継承されたグローバル npm インストール設定は無視されます。
Plugin の依存関係ツリーは「純粋な JS/TS」に保ち、
`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は軽量なセットアップ専用モジュールを指せます。
OpenClaw が無効なチャンネル Plugin のセットアップサーフェスを必要とする場合、または
チャンネル Plugin が有効でもまだ未設定の場合、フル Plugin エントリの代わりに `setupEntry`
を読み込みます。これにより、メインの Plugin エントリがツール、フック、その他のランタイム専用
コードも配線している場合に、起動とセットアップを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使うと、チャンネルがすでに設定済みの場合でも、Gateway の
リッスン前起動フェーズ中にチャンネル Plugin を同じ `setupEntry` パスへ参加させられます。

これは、Gateway がリッスンを開始する前に存在している必要がある起動サーフェスを
`setupEntry` が完全にカバーする場合にのみ使用してください。実際には、セットアップエントリは
起動が依存するすべてのチャンネル所有ケイパビリティを登録する必要があります。例:

- チャンネル登録自体
- Gateway がリッスンを開始する前に利用可能である必要がある HTTP ルート
- 同じ時間枠中に存在する必要がある Gateway メソッド、ツール、サービス

フルエントリがまだ必須の起動ケイパビリティを所有している場合は、
このフラグを有効にしないでください。Plugin はデフォルトの動作のままにし、OpenClaw が
起動中にフルエントリを読み込むようにします。

バンドルされたチャンネルは、フルチャンネルランタイムが読み込まれる前に core が参照できる、
セットアップ専用の契約サーフェスヘルパーも公開できます。現在のセットアップ
昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、フル Plugin エントリを読み込まずにレガシーの単一アカウントチャンネル
設定を `channels.<id>.accounts.*` へ昇格する必要があるときに、そのサーフェスを使用します。
Matrix が現在のバンドル例です。名前付きアカウントがすでに存在する場合は、auth/bootstrap キーだけを
名前付きの昇格済みアカウントへ移動し、常に
`accounts.default` を作成する代わりに、設定済みの非正規デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターにより、バンドルされた契約サーフェスの探索は遅延されたままになります。インポート
時は軽量に保たれます。昇格サーフェスは、モジュールインポート時にバンドル済みチャンネル起動へ
再入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、
Plugin 固有のプレフィックスに置いてください。core 管理名前空間（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）は予約されたままであり、Plugin がより狭いスコープを
要求しても、常に `operator.admin` に解決されます。

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

### チャンネルカタログメタデータ

チャンネル Plugin は、`openclaw.channel` 経由でセットアップ/探索メタデータを、
`openclaw.install` 経由でインストールヒントを公開できます。これにより、core カタログはデータを持たずに済みます。

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

- `detailLabel`: よりリッチなカタログ/ステータスサーフェス向けのセカンダリラベル
- `docsLabel`: docs リンクのリンクテキストを上書き
- `preferOver`: このカタログエントリが優先すべき、優先度の低い Plugin/チャンネル ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: 送信フォーマット判断のために、チャンネルを markdown 対応としてマーク
- `exposure.configured`: `false` に設定すると、設定済みチャンネル一覧サーフェスからチャンネルを非表示
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからチャンネルを非表示
- `exposure.docs`: docs ナビゲーションサーフェス向けに、チャンネルを内部/非公開としてマーク
- `showConfigured` / `showInSetup`: 互換性のためにまだ受け入れられるレガシーエイリアス。`exposure` を優先してください
- `quickstartAllowFrom`: チャンネルを標準のクイックスタート `allowFrom` フローへ参加させる
- `forceAccountBinding`: アカウントが 1 つだけ存在する場合でも、明示的なアカウントバインディングを要求
- `preferSessionLookupForAnnounceTarget`: announce ターゲット解決時にセッション検索を優先

OpenClaw は **外部チャンネルカタログ**（たとえば MPM
レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを配置してください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で
1 つ以上の JSON ファイルを指定します（カンマ/セミコロン/`PATH` 区切り）。各ファイルには
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは、`"entries"` キーのレガシーエイリアスとして `"packages"` または `"plugins"` も受け入れます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、
生の `openclaw.install` ブロックの横に、正規化されたインストールソースの事実を公開します。
正規化された事実は、npm spec が正確なバージョンか浮動セレクターか、
期待される整合性メタデータが存在するか、ローカルソースパスも利用可能かを識別します。
カタログ/パッケージ ID がわかっている場合、正規化された事実は、解析された npm パッケージ名が
その ID からずれていると警告します。また、`defaultChoice` が無効な場合や利用できないソースを
指している場合、有効な npm ソースなしで npm 整合性メタデータが存在する場合にも警告します。
コンシューマーは `installSource` を追加的な任意フィールドとして扱うべきです。これにより、
手作りのエントリやカタログシムがそれを合成する必要はありません。
これにより、オンボーディングと診断は、Plugin ランタイムをインポートせずに
ソースプレーン状態を説明できます。

公式の外部 npm エントリでは、正確な `npmSpec` と
`expectedIntegrity` を優先してください。素のパッケージ名と dist-tag も互換性のために引き続き機能しますが、
ソースプレーン警告を表示するため、カタログは既存の Plugin を壊さずに
ピン留めされ整合性チェックされたインストールへ移行できます。
オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` と
ワークスペース相対の `sourcePath` を持つ、管理対象 Plugin
Plugin インデックスエントリを記録します。絶対の運用ロードパスは
`plugins.load.paths` に残ります。インストールレコードは、ローカルワークステーション
パスを長期保存設定へ重複して入れることを避けます。これにより、ローカル開発インストールは
ソースプレーン診断から見えるままになり、2 つ目の生ファイルシステムパス開示
サーフェスを追加せずに済みます。永続化された `installed_plugin_index` SQLite テーブルがインストール
ソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。
その `installRecords` マップは、Plugin マニフェストが欠落または
無効な場合でも永続的です。その `plugins` ペイロードは再構築可能なマニフェストビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、アセンブリ、
Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から
`api.registerContextEngine(id, factory)` で登録し、その後
`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

これは、Plugin がメモリ検索やフックを追加するだけでなく、デフォルトのコンテキスト
パイプラインを置き換えたり拡張したりする必要がある場合に使用します。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

factory の `ctx` は、構築時初期化のための任意の `config`、`agentDir`、`workspaceDir`
値を公開します。

アクティブなハーネスに永続バックエンドスレッドがある場合、`assemble()` は
`contextProjection` を返せます。レガシーのターンごとの projection では省略してください。
組み立てられたコンテキストをバックエンドスレッドへ一度注入し、epoch が変わるまで再利用すべき場合は、
`{ mode: "thread_bootstrap", epoch }` を返します。
エンジン所有の Compaction パス後など、エンジンの意味的コンテキストが変化した後に
epoch を変更します。ホストは、スレッドブートストラップ projection 内でツール呼び出しメタデータ、
入力形状、リダクト済みツール結果を保持できるため、新しい
バックエンドスレッドは、生の秘密情報を含むペイロードをコピーせずにツールの連続性を維持できます。

エンジンが Compaction アルゴリズムを所有して**いない**場合は、`compact()`
を実装したまま明示的に委譲してください。

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

## 新しいケイパビリティの追加

Plugin が現在の API に合わない動作を必要とする場合、プライベートな内部参照で
Plugin システムを迂回しないでください。不足しているケイパビリティを追加してください。

推奨手順:

1. **core 契約を定義する。** core が所有すべき共有動作を決めます:
   ポリシー、フォールバック、設定マージ、ライフサイクル、チャンネル向けセマンティクス、
   ランタイムヘルパー形状。
2. **型付き Plugin 登録/ランタイムサーフェスを追加する。** 最小限で有用な型付き
   ケイパビリティサーフェスで `OpenClawPluginApi` や `api.runtime` を拡張します。
3. **core とチャンネル/機能コンシューマーを配線する。** チャンネルと機能 Plugin は、
   ベンダー実装を直接インポートするのではなく、core 経由で新しいケイパビリティを
   使用するべきです。
4. **ベンダー実装を登録する。** その後、ベンダー Plugin が自分の
   バックエンドをそのケイパビリティに登録します。
5. **契約カバレッジを追加する。** 所有権と登録形状が時間が経っても明示的なままになるように
   テストを追加します。

これにより、OpenClaw は 1 つのプロバイダーの世界観にハードコードされることなく、
意見を持ったままでいられます。具体的なファイルチェックリストと実例については
[Capability Cookbook](/ja-JP/plugins/adding-capabilities) を参照してください。

### ケイパビリティチェックリスト

新しいケイパビリティを追加する場合、実装は通常、次の
サーフェスをまとめて触る必要があります。

- `src/<capability>/types.ts` のコア契約型
- `src/<capability>/runtime.ts` のコアランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャネル Plugin がそれを利用する必要がある場合の
  `src/plugins/runtime/*` における Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ/テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` のオペレーター/Plugin ドキュメント

これらのサーフェスのいずれかが欠けている場合、通常はその機能が
まだ完全には統合されていない兆候です。

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

契約テストパターン（`src/plugins/contracts/registry.ts` は
`providerContractPluginIds` などの所有権ルックアップを公開します。テストでは、Plugin の
`contracts.videoGenerationProviders` リストが実際に登録する内容と一致することをアサートします）:

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

これによりルールはシンプルに保たれます:

- コアは機能契約 + オーケストレーションを所有する
- ベンダー Plugin はベンダー実装を所有する
- 機能/チャネル Plugin はランタイムヘルパーを利用する
- 契約テストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開機能モデルと形状
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
