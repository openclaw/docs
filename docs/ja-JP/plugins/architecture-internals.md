---
read_when:
    - プロバイダーのランタイムフック、チャネルのライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しいPlugin機能またはコンテキストエンジンPluginの追加
summary: Plugin アーキテクチャの内部構造：読み込みパイプライン、レジストリ、ランタイムフック、HTTP ルート、リファレンステーブル
title: Pluginアーキテクチャの内部構造
x-i18n:
    generated_at: "2026-07-11T22:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開機能モデル、Plugin の形式、所有権と実行の契約については、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページでは、ロードパイプライン、レジストリ、ランタイムフック、Gateway HTTP ルート、インポートパス、スキーマテーブルという内部メカニズムについて説明します。

## ロードパイプライン

起動時に、OpenClaw はおおよそ次の処理を行います。

1. Plugin ルートの候補を検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補を有効にするか決定する
6. 有効なネイティブモジュールをロードする。ビルド済みの同梱モジュールにはネイティブローダーを使用し、
   サードパーティのローカルソース TypeScript には緊急用の Jiti フォールバックを使用する
7. ネイティブの `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. コマンドとランタイムの各サーフェスにレジストリを公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。同梱されているすべての Plugin は `register` を使用しています。新しい Plugin では `register` を推奨します。
</Note>

安全性ゲートは、ランタイム実行の**前**に動作します。次の場合、検出処理は候補をブロックします。

- 解決されたエントリが Plugin ルートの外部を指している
- そのパス（またはルートディレクトリ）が全ユーザーによる書き込みを許可している
- 同梱されていない Plugin で、パスの所有者が現在の uid（または root）と一致しない

全ユーザーによる書き込みが許可された同梱ディレクトリについては、ゲートを再確認する前に、まずその場で `chmod` による修復を試みます（npm/グローバルインストールではパッケージディレクトリが `0777` で配布される場合があります）。同梱元については、所有権チェックを完全に省略します。

ブロックされた候補でも、Plugin id が判明している場合は、出力される診断情報にその id が保持されます。これには、それ以外の理由で拒否されたディレクトリ内のマニフェストから解決された id も含まれます。そのため、その id を参照する設定では、無関係な「不明な Plugin」エラーではなく、パスの安全性に関する警告に関連付けられたブロック済み Plugin が表示されます。

### マニフェスト優先の動作

マニフェストは、コントロールプレーンにおける信頼できる唯一の情報源です。OpenClaw はこれを使用して次の処理を行います。

- Plugin を識別する
- 宣言されたチャンネル、Skills、設定スキーマ、またはバンドル機能を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベルとプレースホルダーを拡充する
- インストールとカタログのメタデータを表示する
- Plugin ランタイムをロードせずに、低コストのアクティベーション記述子とセットアップ記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

省略可能なマニフェストの `activation` ブロックと `setup` ブロックは、コントロールプレーンに残ります。これらはアクティベーション計画とセットアップ検出のためのメタデータ専用記述子であり、ランタイム登録、`register(...)`、`setupEntry` の代わりにはなりません。ライブアクティベーションの利用側は、マニフェストのコマンド、チャンネル、プロバイダーのヒントを使用して、より広範なレジストリを具体化する前に Plugin のロード対象を絞り込みます。

- CLI のロードでは、要求された主要コマンドを所有する Plugin に絞り込む
- チャンネルのセットアップと Plugin の解決では、要求されたチャンネル id を所有する Plugin に絞り込む
- 明示的なプロバイダーのセットアップとランタイムの解決では、要求されたプロバイダー id を所有する Plugin に絞り込む
- Gateway の起動計画では、明示的な起動時インポートに `activation.onStartup` を使用する。起動メタデータがない Plugin は、より限定的なアクティベーショントリガーを通じてのみロードされる

アクティベーションプランナーは、既存の呼び出し元向けの id のみの API と、診断向けのプラン API の両方を公開します。プランの各エントリは Plugin が選択された理由を報告し、明示的な `activation.*` ヒントとマニフェスト所有権によるフォールバックを区別します。

| 理由（`activation.*` ヒント由来）   | 理由（マニフェスト所有権由来）                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner`（`channels`）                                                        |
| `activation-command-hint`            | `manifest-command-alias`（`commandAliases`）                                                  |
| `activation-provider-hint`           | `manifest-provider-owner`（`providers`）、`manifest-setup-provider-owner`（`setup.providers`） |
| `activation-route-hint`              | —                                                                                            |
| —（フックトリガーにはヒントのバリエーションがない） | `manifest-hook-owner`（`hooks`）、`manifest-tool-contract`（`contracts.tools`）                |

この理由の分離が互換性の境界です。既存の Plugin メタデータは引き続き機能し、新しいコードはランタイムのロードセマンティクスを変更せずに、広範なヒントやフォールバック動作を検出できます。

広範な `all` スコープを要求するリクエスト時のランタイムプリロードでも、設定、起動計画、設定済みチャンネル、スロット、自動有効化ルールから、実際に有効な Plugin id の集合を明示的に導出します（`src/plugins/effective-plugin-ids.ts` の `resolveEffectivePluginIds`）。導出された集合が空の場合、OpenClaw は検出可能なすべての Plugin へ範囲を広げず、スコープを空のままにします。

セットアップ検出では、まず `setup.providers` や `setup.cliBackends` などの記述子が所有する id を優先して候補 Plugin を絞り込み、それでもセットアップ時のランタイムフックが必要な Plugin については `setup-api` にフォールバックします。プロバイダーのセットアップ一覧では、プロバイダーランタイムをロードせずに、マニフェストの `providerAuthChoices`、記述子から導出されたセットアップ選択肢、インストールカタログのメタデータを使用します。明示的な `setup.requiresRuntime: false` は記述子のみで処理を打ち切ります。`requiresRuntime` が省略されている場合は、互換性のために従来の setup-api フォールバックを維持します。検出された複数の Plugin が、正規化後に同じセットアッププロバイダーまたは CLI バックエンド id を主張する場合、セットアップ検索は検出順序に依存せず、曖昧な所有者を拒否します。セットアップランタイムが実行された場合、レジストリ診断は、`setup.providers` / `setup.cliBackends` と、setup-api によって実際に登録されたプロバイダーまたは CLI バックエンドとのずれを報告しますが、レガシー Plugin はブロックしません。

### Plugin キャッシュの境界

OpenClaw は、Plugin の検出結果やマニフェストレジストリの直接データを、実時間ベースの期間を設けてキャッシュしません。インストール、マニフェストの編集、ロードパスの変更は、次回の明示的なメタデータ読み取りまたはスナップショット再構築時に反映される必要があります。マニフェストファイルのパーサーは、開いたマニフェストのパスに加え、デバイス/inode、サイズ、mtime/ctime をキーとする上限付きのファイルシグネチャキャッシュを保持します。このキャッシュは変更されていないバイト列の再解析を避けるためだけのものであり、検出、レジストリ、所有者、ポリシーに関する回答をキャッシュしてはなりません。

安全なメタデータの高速経路は、隠れたキャッシュではなく、明示的なオブジェクト所有権です。Gateway 起動時のホットパスでは、現在の `PluginMetadataSnapshot`、導出された `PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出しチェーン経由で渡す必要があります。設定検証、起動時の自動有効化、Plugin のブートストラップ、プロバイダー選択では、それらのオブジェクトが現在の設定と Plugin インベントリを表している間は再利用できます。セットアップ検索では、特定のセットアップ経路が明示的なマニフェストレジストリを受け取らない限り、引き続き必要に応じてマニフェストメタデータを再構築します。隠れた検索キャッシュを追加せず、コールドパスのフォールバックとして維持してください。入力が変更された場合は、スナップショットを変更したり履歴コピーを保持したりせず、再構築して置き換えます。有効な Plugin レジストリ上のビューと、同梱チャンネルのブートストラップヘルパーは、現在のレジストリ/ルートから再計算する必要があります。処理の重複排除や再入の防止を目的とする、単一呼び出し内の短命なマップは使用できますが、プロセスのメタデータキャッシュにしてはなりません。

Plugin のロードでは、永続的なキャッシュ層はランタイムロードです。コードまたはインストール済みアーティファクトを実際にロードした場合は、次のようなローダー状態を再利用できます。

- `PluginLoaderCacheState` と互換性のある有効なランタイムレジストリ
- 同じランタイムサーフェスの繰り返しインポートを避けるために使用される jiti/モジュールキャッシュと公開サーフェスのローダーキャッシュ
- インストール済み Plugin アーティファクト用のファイルシステムキャッシュ
- パスの正規化や重複解決に使用する、呼び出しごとの短命なマップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイムロードを要求した場合を除き、「このプロバイダーを所有する Plugin はどれか」といったコントロールプレーンの問い合わせに答えてはなりません。

次の対象には、永続キャッシュや実時間ベースのキャッシュを追加しないでください。

- 検出結果
- 直接のマニフェストレジストリ
- インストール済み Plugin インデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者の検索、モデルの抑制、プロバイダーポリシー、または公開アーティファクトのメタデータ
- マニフェスト、インストール済みインデックス、またはロードパスの変更が次回のメタデータ読み取り時に反映されるべき、その他すべてのマニフェスト由来の回答

永続化されたインストール済み Plugin インデックスからマニフェストメタデータを再構築する呼び出し元は、そのレジストリを必要に応じて再構築します。インストール済みインデックスは永続的なソースプレーン状態であり、隠れたインプロセスのメタデータキャッシュではありません。

## レジストリモデル

ロードされた Plugin は、無関係なコアのグローバル変数を直接変更しません。中央の Plugin レジストリ（`src/plugins/registry-types.ts` の `PluginRegistry`）に登録します。このレジストリは、Plugin レコード（識別情報、ソース、生成元、状態、診断情報）と、すべての機能に対応する配列を追跡します。対象には、ツール、レガシーフックと型付きフック、チャンネル、プロバイダー、Gateway RPC ハンドラー、HTTP ルート、CLI 登録処理、バックグラウンドサービス、Plugin 所有のコマンドに加え、音声、埋め込み、画像/動画/音楽生成、ウェブ取得/検索、エージェントハーネス、セッションアクションなど、数十種類の型付きプロバイダーファミリーが含まれます。

その後、コア機能は Plugin モジュールと直接通信せず、このレジストリから情報を読み取ります。これにより、ロード方向が一方向に保たれます。

- Plugin モジュール -> レジストリへの登録
- コアランタイム -> レジストリの利用

この分離は保守性にとって重要です。ほとんどのコアサーフェスで必要な統合ポイントが、「各 Plugin モジュールを個別に特別扱いする」ことではなく、「レジストリを読み取る」ことの1つだけになるためです。

## 会話バインディングのコールバック

会話をバインドする Plugin は、承認が解決されたときに反応できます。

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

コールバックのペイロードフィールドは次のとおりです。

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認された要求について解決されたバインディング
- `request`: 元の要求の概要、デタッチヒント、送信者 id、
  会話メタデータ

このコールバックは通知専用です。会話のバインドを許可される主体は変更せず、コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダー Plugin には3つの層があります。

- 実行前に低コストで検索するための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨の互換用 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **設定時フック**: `catalog`（レガシーの `discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、
  ストリームのラップ、思考レベル、再実行ポリシー、使用量エンドポイントを対象とする40以上の省略可能なフック。[フックの順序と使用方法](#hook-order-and-usage)を参照してください。

OpenClaw は引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、ツールポリシーを所有します。これらのフックは、完全に独自の推論トランスポートを必要とせずに、プロバイダー固有の動作を拡張するためのサーフェスです。

プロバイダーに環境変数ベースの認証情報があり、汎用の認証、ステータス、モデル選択パスからPluginランタイムを読み込まずに参照する必要がある場合は、マニフェストの `setup.providers[].envVars` を使用します。非推奨の `providerAuthEnvVars` は、非推奨期間中は互換性アダプターによって引き続き読み取られ、これを使用するバンドル外Pluginにはマニフェスト診断が通知されます。あるプロバイダーIDで別のプロバイダーIDの環境変数、認証プロファイル、設定ベースの認証、およびAPIキーのオンボーディング選択肢を再利用する場合は、マニフェストの `providerAuthAliases` を使用します。オンボーディングおよび認証選択用のCLIインターフェースで、プロバイダーランタイムを読み込まずにプロバイダーの選択肢ID、グループラベル、および単一フラグによる簡易的な認証設定を認識する必要がある場合は、マニフェストの `providerAuthChoices` を使用します。オンボーディングラベルやOAuthのクライアントID／クライアントシークレット設定用変数など、運用者向けのヒントには、プロバイダーランタイムの `envVars` を使用します。

チャネルに環境変数駆動の認証またはセットアップがあり、汎用のシェル環境変数フォールバック、設定／ステータスチェック、またはセットアッププロンプトからチャネルランタイムを読み込まずに参照する必要がある場合は、マニフェストの `channelEnvVars` を使用します。

### フックの順序と用途

モデル／プロバイダーPluginについて、OpenClawはおおむね次の順序でフックを呼び出します。
「使用する場面」列は、判断のためのクイックガイドです。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClawが呼び出さなくなった互換性専用のプロバイダーフィールドは、意図的にここには記載していません。

| フック                              | 機能                                                                                                   | 使用する場面                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | `models.json` の生成時にプロバイダー設定を `models.providers` へ公開する                                | プロバイダーがカタログまたはベース URL のデフォルト値を所有する場合                                                                                                  |
| `applyConfigDefaults`             | 設定の実体化時にプロバイダー所有のグローバル設定のデフォルト値を適用する                                      | デフォルト値が認証モード、環境、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                                                         |
| _(組み込みモデル検索)_         | OpenClaw は最初に通常のレジストリ／カタログ経路を試す                                                          | _(Plugin フックではない)_                                                                                                                         |
| `normalizeModelId`                | 検索前にレガシーまたはプレビューモデル ID のエイリアスを正規化する                                                     | 正規モデル解決の前にプロバイダーがエイリアスの整理を所有する場合                                                                                 |
| `normalizeTransport`              | 汎用モデルの組み立て前にプロバイダーファミリーの `api` / `baseUrl` を正規化する                                      | 同じトランスポートファミリー内のカスタムプロバイダー ID に対するトランスポートの整理をプロバイダーが所有する場合                                                          |
| `normalizeConfig`                 | ランタイム／プロバイダー解決前に `models.providers.<id>` を正規化する                                           | Plugin 側に置くべき設定整理がプロバイダーに必要な場合。バンドルされている Google ファミリーのヘルパーも、サポート対象の Google 設定エントリを補完する   |
| `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブのストリーミング使用量互換の書き換えを適用する                                               | エンドポイントに応じたネイティブのストリーミング使用量メタデータ修正がプロバイダーに必要な場合                                                                          |
| `resolveConfigApiKey`             | ランタイム認証を読み込む前に、設定プロバイダー向けの環境マーカー認証を解決する                                       | プロバイダーが独自の環境マーカー API キー解決フックを公開する場合                                                                                |
| `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル／セルフホストまたは設定ベースの認証を提供する                                   | プロバイダーが合成／ローカル認証情報マーカーで動作できる場合                                                                                 |
| `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ね合わせる。CLI／アプリ所有の認証情報では、デフォルトの `persistence` は `runtime-only` | コピーした更新トークンを永続化せずに、プロバイダーが外部認証情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルのプレースホルダーを、環境／設定ベースの認証より低い優先度にする                                      | 優先されるべきでない合成プレースホルダープロファイルをプロバイダーが保存する場合                                                                 |
| `resolveDynamicModel`             | ローカルレジストリにまだ存在しないプロバイダー所有のモデル ID に対する同期フォールバック                                       | プロバイダーが任意のアップストリームモデル ID を受け入れる場合                                                                                                 |
| `prepareDynamicModel`             | 非同期ウォームアップ後に `resolveDynamicModel` を再実行する                                                           | 不明な ID を解決する前に、プロバイダーがネットワークメタデータを必要とする場合                                                                                  |
| `normalizeResolvedModel`          | 組み込みランナーが解決済みモデルを使用する前の最終書き換え                                               | プロバイダーがトランスポートの書き換えを必要とするが、引き続きコアトランスポートを使用する場合                                                                             |
| `normalizeToolSchemas`            | 組み込みランナーがツールスキーマを参照する前に正規化する                                                    | プロバイダーがトランスポートファミリーのスキーマ整理を必要とする場合                                                                                                |
| `inspectToolSchemas`              | 正規化後にプロバイダー所有のスキーマ診断を提供する                                                  | コアにプロバイダー固有のルールを持たせずに、プロバイダーがキーワード警告を提供したい場合                                                                 |
| `resolveReasoningOutputMode`      | ネイティブまたはタグ付きの推論出力契約を選択する                                                              | ネイティブフィールドではなく、タグ付きの推論／最終出力がプロバイダーに必要な場合                                                                         |
| `prepareExtraParams`              | 汎用ストリームオプションのラッパーより前に、リクエストパラメーターを正規化する                                              | デフォルトのリクエストパラメーターまたはプロバイダーごとのパラメーター整理が必要な場合                                                                           |
| `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                                   | 単なるラッパーではなく、カスタムのワイヤープロトコルがプロバイダーに必要な場合                                                                                     |
| `wrapStreamFn`                    | 汎用ラッパーの適用後にストリームをラップする                                                              | カスタムトランスポートを使わずに、リクエストヘッダー／本文／モデルの互換ラッパーがプロバイダーに必要な場合                                                          |
| `resolveTransportTurnState`       | ターンごとのネイティブトランスポートヘッダーまたはメタデータを付与する                                                           | 汎用トランスポートからプロバイダーネイティブのターン識別情報を送信したい場合                                                                       |
| `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションのクールダウンポリシーを付与する                                                    | 汎用 WS トランスポートでセッションヘッダーまたはフォールバックポリシーを調整したい場合                                                               |
| `formatApiKey`                    | 認証プロファイルのフォーマッター：保存済みプロファイルをランタイムの `apiKey` 文字列に変換する                                     | プロバイダーが追加の認証メタデータを保存し、カスタムのランタイムトークン形式を必要とする場合                                                                    |
| `refreshOAuth`                    | カスタム更新エンドポイントまたは更新失敗ポリシー向けに OAuth 更新処理をオーバーライドする                                  | プロバイダーが OpenClaw の共通更新処理に適合しない場合                                                                                          |
| `buildAuthDoctorHint`             | OAuth 更新失敗時に追加する修復ヒント                                                                  | 更新失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合                                                                      |
| `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウ超過判定                                                                 | 汎用ヒューリスティクスでは見逃す生の超過エラーがプロバイダーに存在する場合                                                                                |
| `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                  | 生の API／トランスポートエラーをレート制限／過負荷などにプロバイダーが対応付けできる場合                                                                          |
| `isCacheTtlEligible`              | プロキシ／バックホールプロバイダー向けのプロンプトキャッシュポリシー                                                               | プロバイダーがプロキシ固有のキャッシュ TTL 制御を必要とする場合                                                                                                |
| `buildMissingAuthMessage`         | 汎用の認証不足回復メッセージを置き換える                                                      | プロバイダー固有の認証不足回復ヒントが必要な場合                                                                                 |
| `augmentModelCatalog`             | 検出後に合成／最終カタログ行を追加する（非推奨。以下を参照）                                  | `models list` と選択画面で、合成された前方互換行がプロバイダーに必要な場合                                                                     |
| `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト値を解決する                                                 | 選択したモデル向けにカスタムの思考レベル体系または二値ラベルをプロバイダーが公開する場合                                                                 |
| `isBinaryThinking`                | 推論のオン／オフ切り替え互換フック                                                                     | プロバイダーが二値の思考オン／オフのみを公開する場合                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 推論サポートの互換フック                                                                   | 一部のモデルだけで `xhigh` を有効にしたい場合                                                                                             |
| `resolveDefaultThinkingLevel`     | デフォルトの `/think` レベル互換フック                                                                      | モデルファミリーのデフォルト `/think` ポリシーをプロバイダーが所有する場合                                                                                      |
| `isModernModelRef`                | ライブプロファイルのフィルターおよびスモーク選択向けの最新モデル判定                                              | ライブ／スモークで優先するモデルの照合をプロバイダーが所有する場合                                                                                             |
| `prepareRuntimeAuth`              | 推論の直前に、設定済み認証情報を実際のランタイムトークン／キーへ交換する                       | トークン交換または短命なリクエスト認証情報がプロバイダーに必要な場合                                                                             |
| `resolveUsageAuth`                | `/usage` および関連ステータス画面向けの使用量／請求認証情報を解決する                                     | カスタムの使用量／クォータトークン解析、または別の使用量認証情報がプロバイダーに必要な場合                                                               |
| `fetchUsageSnapshot`              | 認証解決後に、プロバイダー固有の使用量／クォータスナップショットを取得して正規化する                             | プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要な場合                                                                           |
| `createEmbeddingProvider`         | メモリ／検索向けのプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリの埋め込み動作はプロバイダー Plugin が所有する                                                                                    |
| `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーに独自のトランスクリプトポリシー（例：思考ブロックの除去）が必要な場合                                                               |
| `sanitizeReplayHistory`           | 汎用的なトランスクリプトのクリーンアップ後にリプレイ履歴を書き換える                                                        | 共有 Compaction ヘルパーの範囲を超える、プロバイダー固有のリプレイ書き換えが必要な場合                                                             |
| `validateReplayTurns`             | 組み込みランナーの実行前に、リプレイターンの最終検証または再整形を行う                                           | 汎用的なサニタイズ後に、プロバイダーのトランスポートでより厳密なターン検証が必要な場合                                                                    |
| `onModelSelected`                 | プロバイダー所有の選択後の副作用を実行する                                                                 | モデルがアクティブになったときに、プロバイダーでテレメトリまたはプロバイダー所有の状態が必要な場合                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダー Plugin を確認し、その後、いずれかが実際にモデル ID またはトランスポート／設定を変更するまで、フック対応の他のプロバイダー Plugin へフォールスルーします。これにより、呼び出し元が書き換えを所有する同梱 Plugin を把握していなくても、エイリアス／互換プロバイダーシムが機能し続けます。サポート対象の Google 系設定エントリをプロバイダーフックが書き換えない場合も、同梱の Google 設定ノーマライザーがその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤープロトコルまたはカスタムリクエスト実行機構を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き実行されるプロバイダー動作のためのものです。

`resolveUsageAuth` は、OpenClaw が `fetchUsageSnapshot` を呼び出すか、使用状況／ステータス画面向けの汎用的な認証情報解決にフォールバックするかを決定します。プロバイダーに使用状況取得用の認証情報がある場合は `{ token, accountId?, subscriptionType?, rateLimitTier? }` を返します（オプションのプランメタデータは `fetchUsageSnapshot` に渡されます）。プロバイダー所有の使用状況認証がリクエストを処理済みで、汎用 API キー／OAuth フォールバックを抑止する必要がある場合は `{ handled: true }` を返します。プロバイダーが使用状況認証を処理しなかった場合は `null` または `undefined` を返します。

組織または請求用の認証情報は、マニフェストの `providerUsageAuthEnvVars` で宣言します。これにより、汎用検出およびシークレット除去処理が、それらを推論認証の候補にせずに認識できます。

### プロバイダーの例

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

同梱のプロバイダー Plugin は、各ベンダーのカタログ、認証、思考、リプレイ、使用状況取得の要件に合わせて、上記のフックを組み合わせます。正式なフックセットは `extensions/` 以下の各 Plugin にあり、このページでは一覧を複製するのではなく、その形式を示します。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は、OpenClaw の静的カタログより先にアップストリームのモデル ID を公開できるよう、`catalog` と `resolveDynamicModel` / `prepareDynamicModel` を登録します。
  </Accordion>
  <Accordion title="OAuth および使用状況エンドポイントのプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は、トークン交換と `/usage` 統合を所有するため、`prepareRuntimeAuth` または `formatApiKey` と、`resolveUsageAuth` + `fetchUsageSnapshot` を組み合わせます。
  </Accordion>
  <Accordion title="リプレイおよびトランスクリプトのクリーンアップ系統">
    共有の名前付き系統（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）により、各 Plugin がクリーンアップを再実装する代わりに、`buildReplayPolicy` を介してトランスクリプトポリシーを有効化できます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` は、`catalog` のみを登録し、共有推論ループを利用します。
  </Accordion>
  <Accordion title="Anthropic 固有のストリームヘルパー">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく、Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Plugin は、`api.runtime` を介して選択されたコアヘルパーにアクセスできます。TTS の場合：

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

注：

- `textToSpeech` は、ファイル／音声メモ画面向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファーとサンプルレートを返します。Plugin はプロバイダー向けにリサンプリング／エンコードする必要があります。
- `listVoices` はプロバイダーごとにオプションです。ベンダー所有の音声選択画面またはセットアップフローで使用します。
- コアは、解決済みのリクエスト期限をプロバイダーの `listVoices` フックに渡します。プロバイダー固有のタイムアウト設定で上書きできる場合があります。
- 音声一覧には、ロケール、性別、パーソナリティタグなど、プロバイダー対応の選択画面向けのより詳細なメタデータを含められます。
- 現在、OpenAI と ElevenLabs は電話音声に対応しています。Microsoft は対応していません。

Plugin は、`api.registerSpeechProvider(...)` を介して音声プロバイダーを登録することもできます。

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

注：

- TTS ポリシー、フォールバック、返信配信はコアに保持します。
- ベンダー所有の音声合成動作には音声プロバイダーを使用します。
- 従来の Microsoft `edge` 入力は、`microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは企業単位です。OpenClaw がこれらの機能契約を追加していく中で、1 つのベンダー Plugin がテキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像／音声／動画の理解については、Plugin は汎用的なキー／値の集合ではなく、型付けされた 1 つのメディア理解プロバイダーを登録します。

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注：

- オーケストレーション、フォールバック、設定、チャネル接続はコアに保持します。
- ベンダー動作はプロバイダー Plugin に保持します。
- 追加による拡張は型付けを維持する必要があります。新しいオプションメソッド、新しいオプション結果フィールド、新しいオプション機能を使用します。
- 動画生成はすでに同じパターンに従っています。
  - コアが機能契約とランタイムヘルパーを所有します
  - ベンダー Plugin が `api.registerVideoGenerationProvider(...)` を登録します
  - 機能／チャネル Plugin が `api.runtime.videoGeneration.*` を使用します

メディア理解ランタイムヘルパーでは、Plugin は次のように呼び出せます。

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
  model: "gpt-5.6-sol",
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

音声文字起こしでは、Plugin はメディア理解ランタイムまたは従来の STT エイリアスのいずれかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注：

- `api.runtime.mediaUnderstanding.*` は、画像／音声／動画理解に推奨される共有画面です。
- `extractStructuredWithModel(...)` は、範囲を限定したプロバイダー所有の画像優先抽出に向けた Plugin 用の境界です。少なくとも 1 つの画像入力を含めてください。テキスト入力は補足コンテキストです。製品 Plugin がルートとスキーマを所有し、OpenClaw がプロバイダー／ランタイム境界を所有します。
- コアのメディア理解音声設定（`tools.media.audio`）とプロバイダーのフォールバック順序を使用します。
- 文字起こし出力が生成されない場合（たとえば、入力がスキップされた場合や未対応の場合）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換エイリアスとして引き続き利用できます。

Plugin は、`api.runtime.subagent` を介してバックグラウンドのサブエージェント実行を開始することもできます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注：

- `provider` と `model` は実行ごとのオプション上書きであり、永続的なセッション変更ではありません。
- OpenClaw は、信頼された呼び出し元に対してのみ、これらの上書きフィールドを受け入れます。
- Plugin 所有のフォールバック実行では、オペレーターが `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的に有効化する必要があります。
- 信頼された Plugin を特定の正規 `provider/model` ターゲットに制限するには `plugins.entries.<id>.subagent.allowedModels` を使用し、任意のターゲットを明示的に許可するには `"*"` を使用します。
- 信頼されていない Plugin のサブエージェント実行も引き続き動作しますが、上書き要求は暗黙にフォールバックするのではなく拒否されます。
- Plugin が作成したサブエージェントセッションには、作成元 Plugin の ID がタグ付けされます。フォールバックの `api.runtime.subagent.deleteSession(...)` が削除できるのは、それらの所有セッションだけです。任意のセッション削除には、引き続き管理者スコープの Gateway リクエストが必要です。

Web 検索では、Plugin はエージェントツールの配線へ直接アクセスする代わりに、共有ランタイムヘルパーを使用できます。

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

Plugin は、`api.registerWebSearchProvider(...)` を介して Web 検索プロバイダーを登録することもできます。

注：

- プロバイダー選択、認証情報の解決、共有リクエストセマンティクスはコアに保持します。
- ベンダー固有の検索トランスポートには Web 検索プロバイダーを使用します。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せず検索動作を必要とする機能／チャネル Plugin に推奨される共有画面です。

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

- `generate(...)`：設定された画像生成プロバイダーチェーンを使用して画像を生成します。
- `listProviders(...)`：利用可能な画像生成プロバイダーとその機能を一覧表示します。

## Gateway HTTP ルート

Plugin は `api.registerHttpRoute(...)` を使用して HTTP エンドポイントを公開できます。

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
- `auth`: 必須。`"gateway"` または `"plugin"`。通常の Gateway 認証を必須にするには `"gateway"`、Plugin が管理する認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `handleUpgrade`: 同じルート上の WebSocket アップグレードリクエストを処理する任意のハンドラー。
- `replaceExisting`: 任意。同じ Plugin が自身の既存のルート登録を置き換えられるようにします。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、使用すると Plugin のロードエラーが発生します。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートでは `auth` を明示的に宣言する必要があります。
- `replaceExisting: true` でない限り、完全に一致する `path + match` の競合は拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルが異なるルート同士の重複は拒否されます。`exact`/`prefix` のフォールスルーチェーンは、同じ認証レベル内だけに保ってください。
- `auth: "plugin"` ルートには、オペレーターのランタイムスコープが自動的に付与されることは**ありません**。これらは Plugin が管理する Webhook/署名検証用であり、特権を持つ Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは、Gateway リクエストのランタイムスコープ内で実行されます。デフォルトのサーフェス（`gatewayRuntimeScopeSurface: "write-default"`）は意図的に保守的です:
  - 共有シークレットのベアラー認証（`gateway.auth.mode = "token"` / `"password"`）および信頼済みプロキシ以外のすべての認証方式には、呼び出し元が `x-openclaw-scopes` を送信しても、単一の `operator.write` スコープだけが付与されます
  - 明示的な `x-openclaw-scopes` ヘッダーがない `trusted-proxy` の呼び出し元にも、従来どおり `operator.write` のみのサーフェスが維持されます
  - `x-openclaw-scopes` を送信する `trusted-proxy` の呼び出し元には、代わりに宣言されたスコープが付与されます
  - ルートは `gatewayRuntimeScopeSurface: "trusted-operator"` を指定することで、アイデンティティを伴う認証モードでは常に `x-openclaw-scopes` を尊重できます（ヘッダーがない場合は、CLI のデフォルトスコープ一式にフォールバックします）
- 実用上の原則: Gateway 認証を使用する Plugin ルートが暗黙の管理者サーフェスになると想定しないでください。ルートで管理者限定の動作が必要な場合は、`trusted-operator` スコープサーフェスを指定し、アイデンティティを伴う認証モードを必須にして、明示的な `x-openclaw-scopes` ヘッダーの契約を文書化してください。
- ルートの照合と認証の後、通常のハンドラーは Gateway のルートワーク受付に従います。準備済みまたは再起動中の Gateway は、ハンドラーを呼び出す前に `503` を返します。限定的な例外は、マニフェストで権限を付与された `auth: "gateway"` ルートで、かつルート固有の `trusted-operator` サーフェスも指定している場合です。このルートは、一時停止制御のディスパッチが到達不能になるのを防ぐため引き続き到達可能ですが、同じ Plugin の通常の兄弟ルートは受付境界の内側に留まります。WebSocket の `handleUpgrade` の所有権にも、同じアトミックな受付境界が適用されます。ハンドラーがソケットを受け入れた後、そのソケットの以降のライフタイムは Plugin の所有となり、この境界では追跡されません。

## Plugin SDK のインポートパス

新しい Plugin を作成する際は、モノリシックな `openclaw/plugin-sdk` ルートバレルではなく、用途を限定した SDK サブパスを使用してください。コアのサブパス:

| サブパス                            | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャンネルのエントリ/ビルドヘルパー                |
| `openclaw/plugin-sdk/core`          | 汎用の共有ヘルパーと包括的な契約                   |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` の Zod スキーマ（`OpenClawSchema`） |

チャンネル Plugin は、用途を限定した一連の境界 — `channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets`、`channel-actions` — から選択します。承認動作は、無関係な
Plugin フィールドに分散させるのではなく、単一の `approvalCapability` 契約に
集約してください。[チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムおよび設定ヘルパーは、対応する用途別の `*-runtime` サブパス
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` など）にあります。広範な `config-runtime` 互換バレルではなく、
`config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot`、
`config-mutation` を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小規模なチャンネルヘルパーファサード、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`、
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換シムです。
新しいコードでは、より用途を限定した汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（バンドルされた各 Plugin パッケージのルート単位）:

- `index.js` — バンドルされた Plugin のエントリ
- `api.js` — ヘルパー/型のバレル
- `runtime-api.js` — ランタイム専用バレル
- `setup-entry.js` — セットアップ Plugin のエントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートしてください。
コアまたは別の Plugin から、他の Plugin パッケージの `src/*` をインポートしてはなりません。
ファサードによってロードされるエントリポイントは、アクティブなランタイム設定スナップショットが
存在する場合はそれを優先し、存在しない場合はディスク上の解決済み設定ファイルに
フォールバックします。

`image-generation`、`media-understanding`、`speech` などの機能固有のサブパスが
存在するのは、現在バンドル済み Plugin がそれらを使用しているためです。これらは
外部向けの長期固定契約として自動的に保証されるものではありません。依存する場合は、
該当する SDK リファレンスページを確認してください。

## メッセージツールのスキーマ

リアクション、既読、投票など、メッセージ以外のプリミティブに対する
`describeMessageTool(...)` スキーマへのチャンネル固有の追加は、Plugin が
所有する必要があります。共有の送信プレゼンテーションでは、プロバイダー固有の
ボタン、コンポーネント、ブロック、カードのフィールドではなく、汎用の
`MessagePresentation` 契約を使用してください。契約、フォールバック規則、
プロバイダーのマッピング、および Plugin 作成者向けチェックリストについては、
[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信機能を持つ Plugin は、メッセージ機能を通じてレンダリング可能な内容を宣言します:

- セマンティックなプレゼンテーションブロック（`text`、`context`、
  `divider`、`chart`、`table`、`buttons`、`select`）には `presentation`
- ピン留め配信リクエストには `delivery-pin`

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに
デグレードするかを決定します。汎用メッセージツールから、プロバイダー固有の
UI エスケープハッチを公開しないでください。従来のネイティブスキーマ向けの
非推奨 SDK ヘルパーは既存のサードパーティ Plugin 用に引き続きエクスポートされますが、
新しい Plugin では使用しないでください。

## チャンネルターゲットの解決

チャンネル Plugin は、チャンネル固有のターゲットセマンティクスを所有する必要があります。
共有のアウトバウンドホストは汎用のままにし、プロバイダー規則にはメッセージングアダプターの
サーフェスを使用してください:

- `messaging.inferTargetChatType({ to })` は、ディレクトリ検索の前に、正規化された
  ターゲットを `direct`、`group`、`channel` のどれとして扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力がディレクトリ検索を
  スキップし、ID 形式の解決へ直接進むべきかどうかをコアに通知します。
- `messaging.targetResolver.reservedLiterals` は、そのプロバイダーにおいて
  チャンネル/セッション参照となる単独の語を列挙します。解決処理では、予約済みリテラルを
  拒否する前に設定済みのディレクトリエントリを維持し、その後ディレクトリ検索に失敗した場合は
  フェイルクローズします。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリ検索の失敗後に、
  コアが最終的なプロバイダー所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲットの解決後に、
  プロバイダー固有のセッションルート構築を所有します。

推奨される分担:

- ピア/グループを検索する前に行うべきカテゴリ判定には `inferTargetChatType` を使用します。
- 「これを明示的な/ネイティブのターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- `resolveTarget` はプロバイダー固有の正規化フォールバックに使用し、広範なディレクトリ検索には
  使用しないでください。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダー固有 ID は、
  汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有のパラメーター内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリを導出する Plugin は、そのロジックを Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用してください。

チャンネルで、次のような設定に基づくピア/グループが必要な場合に使用します:

- 許可リストに基づく DM ピア
- 設定済みのチャンネル/グループマップ
- アカウント単位の静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、次の汎用操作のみを処理します:

- クエリのフィルタリング
- 上限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャンネル固有のアカウント検査と ID 正規化は、Plugin の実装内に保持してください。

## プロバイダーカタログ

プロバイダー Plugin は、
`registerProvider({ catalog: { run(...) { ... } } })` を使用して、
推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと
同じ形式を返します:

- 1 つのプロバイダーエントリには `{ provider }`
- 複数のプロバイダーエントリには `{ providers }`

Plugin がプロバイダー固有のモデル ID、ベース URL のデフォルト、
または認証によって制限されるモデルメタデータを所有する場合は、`catalog` を使用します。

`catalog.order` は、Plugin のカタログが OpenClaw 組み込みの暗黙的プロバイダーに対して
いつマージされるかを制御します:

- `simple`: 単純な API キーまたは環境変数駆動のプロバイダー
- `profile`: 認証プロファイルが存在する場合に現れるプロバイダー
- `paired`: 関連する複数のプロバイダーエントリを合成するプロバイダー
- `late`: 他の暗黙的プロバイダーの後に実行される最終パス

キーが競合した場合は後のプロバイダーが優先されるため、Plugin は同じプロバイダー ID を持つ
組み込みプロバイダーエントリを意図的に上書きできます。

Plugin は、
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて、読み取り専用のモデル行を公開することもできます。これは
一覧/ヘルプ/選択画面の今後の経路であり、`text`、`voice`、`image_generation`、
`video_generation`、`music_generation` の行をサポートします。プロバイダー Plugin は
引き続き、ライブエンドポイント呼び出し、トークン交換、ベンダーレスポンスのマッピングを
所有します。コアは、共通の行形式、ソースラベル、メディアツールのヘルプ書式を所有します。
メディア生成プロバイダーの登録では、`defaultModel`、`models`、`capabilities` から
静的カタログ行が自動的に合成されます。

互換性:

- `discovery` は従来のエイリアスとして引き続き動作しますが、非推奨警告を出力します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用し、
  警告を出力します
- `augmentModelCatalog` は非推奨です。バンドルされたプロバイダーは、
  `registerModelCatalogProvider` を通じて補足行を公開してください

## 読み取り専用のチャンネル検査

Plugin がチャンネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` はランタイム経路です。認証情報が完全に実体化されていることを
  前提にでき、必要なシークレットがない場合は即座に失敗できます。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` などの
  読み取り専用コマンド経路、および doctor/設定修復フローでは、設定を説明するだけのために
  ランタイム認証情報を実体化する必要がないようにするべきです。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような認証情報のソース／状態フィールドを含めます。
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 読み取り専用で利用可能かどうかを報告するだけなら、生のトークン値を返す必要はありません。状態を表示するコマンドでは、`tokenStatus: "available"`（および対応するソースフィールド）を返せば十分です。
- 認証情報が SecretRef 経由で設定されているものの、現在のコマンドパスでは利用できない場合は、`configured_unavailable` を使用します。

これにより、読み取り専用コマンドはクラッシュしたり、アカウントが未設定であると誤って報告したりする代わりに、「設定済みだが、このコマンドパスでは利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を含む `package.json` を配置できます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリが 1 つの Plugin になります。パックに複数の拡張機能が列挙されている場合、Plugin ID は `<manifestOrPackageName>/<fileBase>` になります（マニフェスト ID が存在する場合はそれが優先され、存在しない場合はスコープを除いた `package.json` の名前が使用されます）。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリで依存関係をインストールし、`node_modules` を利用できるようにしてください（`npm install` / `pnpm install`）。

セキュリティ上のガードレール：すべての `openclaw.extensions` エントリは、シンボリックリンクの解決後も Plugin ディレクトリ内に収まる必要があります。パッケージディレクトリ外に出るエントリは拒否されます。

セキュリティ上の注意：`openclaw plugins install` は、プロジェクトローカルの `npm install --omit=dev --ignore-scripts` を使用して Plugin の依存関係をインストールします（ライフサイクルスクリプトは実行せず、実行時の開発依存関係も含みません）。継承されたグローバル npm インストール設定は無視されます。Plugin の依存関係ツリーは「純粋な JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意：`openclaw.setupEntry` には、軽量なセットアップ専用モジュールを指定できます。無効化されたチャンネル Plugin のセットアップ用インターフェースが OpenClaw に必要な場合、またはチャンネル Plugin が有効でも未設定の場合、完全な Plugin エントリの代わりに `setupEntry` が読み込まれます。これにより、メインの Plugin エントリでツール、フック、その他の実行時専用コードも接続している場合に、起動とセットアップを軽量に保てます。

任意：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` を使用すると、チャンネルがすでに設定済みでも、Gateway がリッスンを開始する前の起動フェーズで、同じ `setupEntry` パスを使用するようチャンネル Plugin を設定できます。

これは、Gateway がリッスンを開始する前に存在しなければならない起動用インターフェースを `setupEntry` が完全に網羅している場合にのみ使用してください。実際には、セットアップエントリで、起動が依存するチャンネル所有のすべての機能を登録する必要があります。たとえば、次のものです。

- チャンネル登録自体
- Gateway がリッスンを開始する前に利用可能でなければならない HTTP ルート
- 同じ時間帯に存在しなければならない Gateway メソッド、ツール、またはサービス

完全なエントリが必要な起動機能を引き続き所有している場合は、このフラグを有効にしないでください。Plugin はデフォルトの動作のままとし、起動時に OpenClaw が完全なエントリを読み込むようにします。

同梱チャンネルは、チャンネルの完全なランタイムが読み込まれる前にコアが参照できる、セットアップ専用の契約インターフェース用ヘルパーも公開できます。現在のセットアップ昇格インターフェースは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全な Plugin エントリを読み込まずに、従来の単一アカウント用チャンネル設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、このインターフェースを使用します。現在の同梱例は Matrix です。名前付きアカウントがすでに存在する場合、認証／ブートストラップ用キーのみを名前付きの昇格先アカウントへ移動し、常に `accounts.default` を作成するのではなく、設定済みの非標準デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターにより、同梱された契約インターフェースの検出は遅延されたままになります。インポート時間は軽量に保たれ、モジュールのインポート時に同梱チャンネルの起動処理へ再度入るのではなく、昇格インターフェースは初回使用時にのみ読み込まれます。

これらの起動用インターフェースに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスを使用してください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は引き続き予約されており、Plugin がより狭いスコープを要求した場合でも、常に `operator.admin` に解決されます。

例：

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

### チャンネルカタログのメタデータ

チャンネル Plugin は、`openclaw.channel` を介してセットアップ／検出用メタデータを、`openclaw.install` を介してインストールのヒントを公開できます。これにより、コアカタログにデータを持たせずに済みます。

例：

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

最小例以外で有用な `openclaw.channel` フィールド：

- `detailLabel`：より情報量の多いカタログ／状態表示用の副ラベル
- `docsLabel`：ドキュメントリンクのリンクテキストを上書き
- `preferOver`：このカタログエントリが優先すべき、優先度の低い Plugin／チャンネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選択インターフェースの文言制御
- `markdownCapable`：送信時の書式設定判断において、そのチャンネルが Markdown 対応であることを示す
- `exposure.configured`：`false` に設定すると、設定済みチャンネルの一覧インターフェースでチャンネルを非表示にする
- `exposure.setup`：`false` に設定すると、対話型のセットアップ／設定選択画面でチャンネルを非表示にする
- `exposure.docs`：ドキュメントのナビゲーションインターフェースで、チャンネルを内部用／非公開として示す
- `showConfigured` / `showInSetup`：互換性のため引き続き受け付けられる従来の別名。`exposure` を推奨
- `quickstartAllowFrom`：標準のクイックスタート `allowFrom` フローにチャンネルを参加させる
- `forceAccountBinding`：アカウントが 1 つしかない場合でも、明示的なアカウントバインドを必須にする
- `preferSessionLookupForAnnounceTarget`：告知先を解決するときにセッション検索を優先する

OpenClaw は、**外部チャンネルカタログ**（たとえば MPM レジストリのエクスポート）もマージできます。次のいずれかの場所に JSON ファイルを配置します。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で 1 つ以上の JSON ファイルを指定します（カンマ／セミコロン／`PATH` 区切り）。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは、`"entries"` キーの従来の別名として `"packages"` または `"plugins"` も受け付けます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックと並べて、正規化されたインストール元の情報を公開します。正規化された情報は、npm 仕様が完全一致バージョンか可変セレクターか、想定される整合性メタデータが存在するか、ローカルのソースパスも利用可能かを示します。カタログ／パッケージの識別情報が既知の場合、解析された npm パッケージ名がその識別情報とずれていると警告します。また、`defaultChoice` が無効である場合や利用できないソースを指している場合、および有効な npm ソースがないのに npm 整合性メタデータが存在する場合にも警告します。手作業で作成されたエントリやカタログ用シムで合成する必要がないよう、利用側は `installSource` を追加的な任意フィールドとして扱う必要があります。
これにより、オンボーディングと診断は Plugin ランタイムをインポートせずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、完全一致の `npmSpec` と `expectedIntegrity` の組み合わせを推奨します。単なるパッケージ名や dist-tag も互換性のため引き続き機能しますが、ソースプレーンの警告が表示されるため、既存の Plugin を壊すことなく、固定バージョンと整合性チェックを使用するインストールへカタログを移行できます。オンボーディングがローカルカタログパスからインストールする場合、管理対象の Plugin インデックスエントリとして `source: "path"` を記録し、可能であればワークスペース相対の `sourcePath` も記録します。実際の読み込みに使用する絶対パスは `plugins.load.paths` に保持され、インストール記録では、ローカルワークステーションのパスを長期保存される設定へ重複して記録することを避けます。これにより、生のファイルシステムパスを公開する経路を追加することなく、ローカル開発用インストールをソースプレーン診断で確認できます。永続化された `installed_plugin_index` SQLite テーブルがインストール元の信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが欠落または無効な場合でも永続的に保持されます。`plugins` ペイロードは再構築可能なマニフェストビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction におけるセッションコンテキストのオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` を使用して登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

Plugin でメモリ検索やフックを追加するだけでなく、デフォルトのコンテキストパイプラインを置き換える、または拡張する必要がある場合に使用します。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

ファクトリーの `ctx` は、構築時の初期化に使用できる任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

アクティブなハーネスに永続的なバックエンドスレッドがある場合、`assemble()` は `contextProjection` を返せます。従来のターンごとのプロジェクションでは省略します。組み立てたコンテキストをバックエンドスレッドへ一度だけ注入し、エポックが変わるまで再利用する場合は、`{ mode: "thread_bootstrap", epoch }` を返します。エンジンが所有する Compaction 処理の後など、エンジンの意味的なコンテキストが変化した後にエポックを変更します。ホストは、スレッドブートストラップ用プロジェクション内でツール呼び出しのメタデータ、入力形式、秘匿化されたツール結果を保持できます。これにより、新しいバックエンドスレッドで、生の機密情報を含むペイロードをコピーせずにツールの連続性を維持できます。

エンジンが Compaction アルゴリズムを所有**しない**場合も、`compact()` は実装したまま、明示的に委譲してください。

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 新しい機能の追加

Plugin が現在の API に適合しない動作を必要とする場合、非公開の内部アクセスで
Plugin システムを迂回しないでください。不足している機能を追加してください。

推奨手順:

1. **コアの契約を定義する。** コアが所有すべき共有動作を決定します:
   ポリシー、フォールバック、設定のマージ、ライフサイクル、チャネル向けのセマンティクス、
   およびランタイムヘルパーの形状です。
2. **型付きの Plugin 登録／ランタイムサーフェスを追加する。**
   `OpenClawPluginApi` および／または `api.runtime` を、実用上最小限の型付き
   機能サーフェスで拡張します。
3. **コアとチャネル／機能の利用側を接続する。** チャネルおよび機能 Plugin は、
   ベンダー実装を直接インポートするのではなく、コアを介して新しい機能を利用する
   必要があります。
4. **ベンダー実装を登録する。** 次に、ベンダー Plugin がその機能に対して
   バックエンドを登録します。
5. **契約のカバレッジを追加する。** 所有権と登録形式が将来にわたって明示的に
   保たれるよう、テストを追加します。

これは、OpenClaw が特定のプロバイダーの世界観にハードコードされることなく、
明確な方針を維持するための方法です。具体的なファイルチェックリストと実例については、
[機能クックブック](/ja-JP/plugins/adding-capabilities)を参照してください。

### 機能チェックリスト

新しい機能を追加する場合、通常は実装で次のサーフェスをまとめて変更する必要があります:

- `src/<capability>/types.ts` のコア契約型
- `src/<capability>/runtime.ts` のコアランナー／ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ接続
- 機能／チャネル Plugin が利用する必要がある場合は
  `src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ／テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権／契約アサーション
- `docs/` の運用者／Plugin 向けドキュメント

これらのサーフェスのいずれかが欠けている場合、通常はその機能がまだ完全に
統合されていないことを示します。

### 機能テンプレート

最小構成のパターン:

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

契約テストのパターン（`src/plugins/contracts/registry.ts` は
`providerContractPluginIds` などの所有権検索を公開します。テストでは、Plugin の
`contracts.videoGenerationProviders` リストが、実際に登録される内容と一致することを
アサートします）:

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

これにより、ルールがシンプルに保たれます:

- コアは機能の契約とオーケストレーションを所有する
- ベンダー Plugin はベンダー実装を所有する
- 機能／チャネル Plugin はランタイムヘルパーを利用する
- 契約テストは所有権を明示的に保つ

## 関連項目

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開機能モデルと形状
- [Plugin SDK のサブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
