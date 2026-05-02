---
read_when:
    - プロバイダーランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しい Plugin 機能またはコンテキストエンジン Plugin の追加
summary: 'Plugin アーキテクチャの内部: ロードパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照表'
title: Plugin アーキテクチャの内部
x-i18n:
    generated_at: "2026-05-02T05:00:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開機能モデル、Plugin形状、所有権/実行契約については、[Pluginアーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページは、内部メカニクスのリファレンスです。ロードパイプライン、レジストリ、ランタイムフック、Gateway HTTPルート、インポートパス、スキーマ表を扱います。

## ロードパイプライン

起動時に、OpenClawはおおよそ次の処理を行います。

1. 候補Pluginルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補の有効化を判定する
6. 有効化されたネイティブモジュールをロードする。ビルド済みのバンドルモジュールはネイティブローダーを使い、
   サードパーティのローカルソースTypeScriptは緊急用のJitiフォールバックを使う
7. ネイティブの`register(api)`フックを呼び出し、登録内容をPluginレジストリに収集する
8. レジストリをコマンド/ランタイムサーフェスに公開する

<Note>
`activate`は`register`のレガシーエイリアスです。ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべてのバンドルPluginは`register`を使います。新しいPluginでは`register`を推奨します。
</Note>

安全ゲートはランタイム実行の**前に**発生します。エントリがPluginルートから抜け出す場合、パスが誰でも書き込み可能な場合、または非バンドルPluginのパス所有権が疑わしい場合、候補はブロックされます。

### マニフェスト優先の動作

マニフェストはコントロールプレーンの信頼できる情報源です。OpenClawはこれを使って次を行います。

- Pluginを識別する
- 宣言されたチャンネル/Skills/設定スキーマまたはバンドル機能を検出する
- `plugins.entries.<id>.config`を検証する
- Control UIのラベル/プレースホルダーを拡張する
- インストール/カタログメタデータを表示する
- Pluginランタイムをロードせずに、軽量な有効化とセットアップ記述子を保持する

ネイティブPluginでは、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

任意のマニフェスト`activation`ブロックと`setup`ブロックはコントロールプレーンに残ります。これらは有効化計画とセットアップ検出のためのメタデータ専用記述子であり、ランタイム登録、`register(...)`、または`setupEntry`を置き換えるものではありません。
最初のライブ有効化コンシューマーは、より広いレジストリ実体化の前にPluginロードを絞り込むため、現在はマニフェストのコマンド、チャンネル、プロバイダーヒントを使います。

- CLIロードは、要求されたプライマリコマンドを所有するPluginに絞り込む
- チャンネルセットアップ/Plugin解決は、要求されたチャンネルidを所有するPluginに絞り込む
- 明示的なプロバイダーセットアップ/ランタイム解決は、要求されたプロバイダーidを所有するPluginに絞り込む
- Gateway起動計画は、明示的な起動時インポートと起動時オプトアウトに`activation.onStartup`を使う。起動メタデータのないPluginは、より狭い有効化トリガーを通じてのみロードされる

有効化プランナーは、既存呼び出し元向けのidのみのAPIと、新しい診断向けのプランAPIの両方を公開します。プランエントリは、Pluginが選択された理由を報告し、明示的な`activation.*`プランナーヒントと、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどのマニフェスト所有権フォールバックを分離します。その理由の分割が互換性境界です。既存のPluginメタデータは動作し続け、新しいコードはランタイムロードのセマンティクスを変えずに、広いヒントやフォールバック動作を検出できます。

セットアップ検出は、現在は`setup.providers`や`setup.cliBackends`などの記述子所有idを優先して候補Pluginを絞り込み、その後、セットアップ時ランタイムフックがまだ必要なPlugin向けに`setup-api`へフォールバックします。プロバイダーセットアップ一覧は、プロバイダーランタイムをロードせずに、マニフェスト`providerAuthChoices`、記述子から派生したセットアップ選択肢、インストールカタログメタデータを使います。明示的な`setup.requiresRuntime: false`は記述子専用の打ち切りです。`requiresRuntime`が省略されている場合は、互換性のためレガシー`setup-api`フォールバックを維持します。検出された複数のPluginが同じ正規化済みセットアッププロバイダーまたはCLIバックエンドidを主張する場合、セットアップ検索は検出順に頼らず、曖昧な所有者を拒否します。セットアップランタイムが実行される場合、レジストリ診断は、レガシーPluginをブロックせずに、`setup.providers` / `setup.cliBackends`とsetup-apiによって登録されたプロバイダーまたはCLIバックエンドとのずれを報告します。

### Pluginキャッシュ境界

OpenClawは、Plugin検出結果や直接的なマニフェストレジストリデータを、壁時計時間の期間でキャッシュしません。インストール、マニフェスト編集、ロードパス変更は、次の明示的なメタデータ読み取りまたはスナップショット再構築で可視化される必要があります。
マニフェストファイルパーサーは、開かれたマニフェストパス、inode、サイズ、タイムスタンプをキーにした有界のファイル署名キャッシュを保持できます。このキャッシュは変更されていないバイト列の再解析を避けるだけで、検出、レジストリ、所有者、ポリシーの回答をキャッシュしてはなりません。

安全なメタデータ高速経路は、隠れたキャッシュではなく明示的なオブジェクト所有権です。
Gateway起動のホットパスでは、現在の`PluginMetadataSnapshot`、派生した`PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出しチェーンで渡すべきです。設定検証、起動時自動有効化、Pluginブートストラップ、プロバイダー選択は、それらのオブジェクトが現在の設定とPluginインベントリを表している間、再利用できます。セットアップ検索は、特定のセットアップパスが明示的なマニフェストレジストリを受け取らない限り、必要に応じてマニフェストメタデータを再構築します。隠れた検索キャッシュを追加するのではなく、これをコールドパスフォールバックとして維持してください。入力が変わったら、スナップショットを変更したり履歴コピーを保持したりせず、再構築して置き換えます。
アクティブなPluginレジストリ上のビューとバンドルチャンネルのブートストラップヘルパーは、現在のレジストリ/ルートから再計算するべきです。1回の呼び出し内で作業を重複排除したり再入を防いだりする短命のマップは問題ありませんが、プロセスメタデータキャッシュになってはなりません。

Pluginロードにおいて、永続的なキャッシュレイヤーはランタイムロードです。コードまたはインストール済みアーティファクトが実際にロードされる場合、次のようなローダー状態を再利用できます。

- `PluginLoaderCacheState`と互換性のあるアクティブなランタイムレジストリ
- 同じランタイムサーフェスを繰り返しインポートしないために使われるjiti/モジュールキャッシュと公開サーフェスローダーキャッシュ
- インストール済みPluginアーティファクト用のファイルシステムキャッシュ
- パス正規化または重複解決用の短命な呼び出し単位マップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイムロードを要求した場合を除き、「どのPluginがこのプロバイダーを所有しているか？」のようなコントロールプレーンの質問に答えてはなりません。

次のものに永続キャッシュや壁時計時間キャッシュを追加しないでください。

- 検出結果
- 直接的なマニフェストレジストリ
- インストール済みPluginインデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者検索、モデル抑制、プロバイダーポリシー、公開アーティファクトメタデータ
- 変更されたマニフェスト、インストール済みインデックス、またはロードパスが次のメタデータ読み取りで可視化されるべき、その他のマニフェスト由来の回答

永続化されたインストール済みPluginインデックスからマニフェストメタデータを再構築する呼び出し元は、そのレジストリを必要に応じて再構築します。インストール済みインデックスは永続的なソースプレーン状態であり、隠れたプロセス内メタデータキャッシュではありません。

## レジストリモデル

ロードされたPluginは、ランダムなコアグローバルを直接変更しません。中央のPluginレジストリに登録します。

レジストリは次を追跡します。

- Pluginレコード（ID、ソース、オリジン、ステータス、診断）
- ツール
- レガシーフックと型付きフック
- チャンネル
- プロバイダー
- Gateway RPCハンドラー
- HTTPルート
- CLIレジストラー
- バックグラウンドサービス
- Plugin所有コマンド

その後、コア機能はPluginモジュールと直接やり取りするのではなく、そのレジストリから読み取ります。これにより、ロードは一方向に保たれます。

- Pluginモジュール -> レジストリ登録
- コアランタイム -> レジストリ消費

この分離は保守性にとって重要です。ほとんどのコアサーフェスが必要とする統合ポイントは「レジストリを読む」だけであり、「すべてのPluginモジュールを特別扱いする」ことではありません。

## 会話バインディングコールバック

会話をバインドするPluginは、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)`を使うと、バインド要求が承認または拒否された後にコールバックを受け取れます。

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

コールバックペイロードフィールド:

- `status`: `"approved"`または`"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または`"deny"`
- `binding`: 承認された要求に対する解決済みバインディング
- `request`: 元の要求概要、デタッチヒント、送信者id、会話メタデータ

このコールバックは通知専用です。会話のバインドを許可される主体を変更するものではなく、コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダーPluginには3つのレイヤーがあります。

- 安価なランタイム前検索のための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨の互換性`providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **設定時フック**: `catalog`（レガシー`discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、ストリームラップ、思考レベル、リプレイポリシー、使用状況エンドポイントをカバーする40以上の任意フック。完全な一覧は[フックの順序と使い方](#hook-order-and-usage)を参照してください。

OpenClawは引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、ツールポリシーを所有します。これらのフックは、プロバイダー固有の動作のための拡張サーフェスであり、完全なカスタム推論トランスポートを必要としません。

プロバイダーにenvベースの認証情報があり、汎用の認証/ステータス/モデルピッカーパスがPluginランタイムをロードせずにそれを参照する必要がある場合は、マニフェスト`setup.providers[].envVars`を使います。非推奨の`providerAuthEnvVars`は、非推奨期間中は互換性アダプターによって引き続き読み取られ、それを使う非バンドルPluginはマニフェスト診断を受け取ります。1つのプロバイダーidが別のプロバイダーidのenv vars、認証プロファイル、設定ベース認証、APIキーオンボーディング選択肢を再利用するべき場合は、マニフェスト`providerAuthAliases`を使います。オンボーディング/認証選択CLIサーフェスが、プロバイダーランタイムをロードせずに、プロバイダーの選択肢id、グループラベル、単純な1フラグ認証配線を知るべき場合は、マニフェスト`providerAuthChoices`を使います。プロバイダーランタイムの`envVars`は、オンボーディングラベルやOAuthクライアントid/クライアントシークレット設定変数など、オペレーター向けヒントのために保持してください。

チャンネルにenv駆動の認証またはセットアップがあり、汎用シェルenvフォールバック、設定/ステータスチェック、またはセットアッププロンプトがチャンネルランタイムをロードせずにそれを参照する必要がある場合は、マニフェスト`channelEnvVars`を使います。

### フックの順序と使い方

モデル/プロバイダーPluginについて、OpenClawはおおよそ次の順序でフックを呼び出します。
「使用するタイミング」列は、簡潔な判断ガイドです。
`ProviderPlugin.capabilities`や`suppressBuiltInModel`など、OpenClawがすでに呼び出さない互換性専用のプロバイダーフィールドは、意図的にここには掲載していません。

| #   | フック                              | その動作                                                                                                   | 使用する場合                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` に公開                                | プロバイダーがカタログまたはベース URL のデフォルトを所有している                                                                                                  |
| 2   | `applyConfigDefaults`             | 設定の具現化中に、プロバイダー所有のグローバル設定デフォルトを適用                                      | デフォルトが認証モード、env、またはプロバイダーモデルファミリーのセマンティクスに依存する                                                                         |
| --  | _(組み込みモデル検索)_         | OpenClaw は最初に通常のレジストリ/カタログ経路を試す                                                          | _(Plugin フックではない)_                                                                                                                         |
| 3   | `normalizeModelId`                | 検索前にレガシーまたはプレビューモデル ID のエイリアスを正規化                                                     | プロバイダーが正規モデル解決前のエイリアスクリーンアップを所有している                                                                                 |
| 4   | `normalizeTransport`              | 汎用モデル組み立て前に、プロバイダーファミリーの `api` / `baseUrl` を正規化                                      | プロバイダーが同じトランスポートファミリー内のカスタムプロバイダー ID 向けトランスポートクリーンアップを所有している                                                          |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決前に `models.providers.<id>` を正規化                                           | プロバイダーが Plugin とともに置くべき設定クリーンアップを必要とする。バンドルされた Google ファミリーヘルパーは、サポート対象の Google 設定エントリも補完する   |
| 6   | `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブストリーミング使用量互換の書き換えを適用                                               | プロバイダーがエンドポイント駆動のネイティブストリーミング使用量メタデータ修正を必要とする                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイム認証読み込み前に、設定プロバイダー向けの env マーカー認証を解決                                       | プロバイダーがプロバイダー所有の env マーカー API キー解決を持つ。`amazon-bedrock` には、ここに組み込みの AWS env マーカー解決機能もある                  |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたは設定ベースの認証を公開                                   | プロバイダーが合成/ローカル認証情報マーカーで動作できる                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルをオーバーレイする。CLI/アプリ所有の認証情報では、デフォルトの `persistence` は `runtime-only` | プロバイダーがコピーされた更新トークンを永続化せずに外部認証情報を再利用する。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | env/設定ベース認証の背後に、保存済み合成プロファイルプレースホルダーの優先度を下げる                                      | プロバイダーが優先されるべきでない合成プレースホルダープロファイルを保存する                                                                 |
| 11  | `resolveDynamicModel`             | ローカルレジストリにまだ存在しないプロバイダー所有モデル ID の同期フォールバック                                       | プロバイダーが任意の上流モデル ID を受け入れる                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップ後に `resolveDynamicModel` が再度実行される                                                           | プロバイダーが未知の ID を解決する前にネットワークメタデータを必要とする                                                                                  |
| 13  | `normalizeResolvedModel`          | 組み込みランナーが解決済みモデルを使う前の最終書き換え                                               | プロバイダーがトランスポート書き換えを必要とするが、引き続きコアトランスポートを使う                                                                             |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデル向けの互換フラグを提供                                  | プロバイダーを引き継がずに、プロバイダーがプロキシトランスポート上の自社モデルを認識する                                                       |
| 15  | `normalizeToolSchemas`            | 組み込みランナーが参照する前にツールスキーマを正規化                                                    | プロバイダーがトランスポートファミリーのスキーマクリーンアップを必要とする                                                                                                |
| 16  | `inspectToolSchemas`              | 正規化後にプロバイダー所有のスキーマ診断を公開                                                  | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい                                                                 |
| 17  | `resolveReasoningOutputMode`      | ネイティブまたはタグ付き推論出力契約を選択                                                              | プロバイダーがネイティブフィールドではなく、タグ付き推論/最終出力を必要とする                                                                         |
| 18  | `prepareExtraParams`              | 汎用ストリームオプションラッパー前のリクエストパラメーター正規化                                              | プロバイダーがデフォルトリクエストパラメーターまたはプロバイダーごとのパラメータークリーンアップを必要とする                                                                           |
| 19  | `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                                   | プロバイダーが単なるラッパーではなく、カスタムワイヤプロトコルを必要とする                                                                                     |
| 20  | `wrapStreamFn`                    | 汎用ラッパー適用後のストリームラッパー                                                              | プロバイダーがカスタムトランスポートなしで、リクエストヘッダー/本文/モデル互換ラッパーを必要とする                                                          |
| 21  | `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたはメタデータを付与                                                           | プロバイダーが汎用トランスポートにプロバイダーネイティブのターン ID を送信させたい                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付与                                                    | プロバイダーが汎用 WS トランスポートのセッションヘッダーまたはフォールバックポリシーを調整したい                                                               |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                                     | プロバイダーが追加の認証メタデータを保存し、カスタムランタイムトークン形状を必要とする                                                                    |
| 24  | `refreshOAuth`                    | カスタム更新エンドポイントまたは更新失敗ポリシー向けの OAuth 更新オーバーライド                                  | プロバイダーが共有の `pi-ai` 更新機能に適合しない                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 更新失敗時に追加される修復ヒント                                                                  | プロバイダーが更新失敗後に、プロバイダー所有の認証修復ガイダンスを必要とする                                                                      |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                                                 | プロバイダーに、汎用ヒューリスティックでは見逃す生のオーバーフローエラーがある                                                                                |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                  | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などにマッピングできる                                                                          |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                                               | プロバイダーがプロキシ固有のキャッシュ TTL ゲートを必要とする                                                                                                |
| 29  | `buildMissingAuthMessage`         | 汎用の認証不足復旧メッセージの置き換え                                                      | プロバイダーがプロバイダー固有の認証不足復旧ヒントを必要とする                                                                                 |
| 30  | `augmentModelCatalog`             | 検出後に追加される合成/最終カタログ行                                                          | プロバイダーが `models list` とピッカーで合成前方互換行を必要とする                                                                     |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                 | プロバイダーが選択されたモデル向けにカスタム思考ラダーまたはバイナリラベルを公開する                                                                 |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                     | プロバイダーがバイナリの思考オン/オフのみを公開する                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推論サポート互換フック                                                                   | プロバイダーがモデルの一部にのみ `xhigh` を有効にしたい                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                      | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有している                                                                                      |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                              | プロバイダーがライブ/スモークの推奨モデルマッチングを所有している                                                                                             |
| 36  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムトークン/キーに交換                       | プロバイダーがトークン交換または短命のリクエスト認証情報を必要とする                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` と関連するステータス画面の使用量/請求認証情報を解決する                                     | プロバイダーがカスタムの使用量/クォータトークン解析、または異なる使用量認証情報を必要とする場合                                                               |
| 38  | `fetchUsageSnapshot`              | 認証が解決された後、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーがプロバイダー固有の使用量エンドポイント、またはペイロードパーサーを必要とする場合                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索向けにプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作がプロバイダー Plugin に属する場合                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーがカスタムのトランスクリプトポリシー（たとえば thinking ブロックの除去）を必要とする場合                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用トランスクリプトのクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーが共有 Compaction ヘルパーを超えるプロバイダー固有のリプレイ書き換えを必要とする場合                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に最終的なリプレイターンの検証または再形成を行う                                           | プロバイダー転送が汎用サニタイズ後により厳密なターン検証を必要とする場合                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったときに、プロバイダーがテレメトリまたはプロバイダー所有の状態を必要とする場合                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダーPluginを確認し、その後、他のフック対応プロバイダーPluginへ順にフォールスルーして、いずれかが実際にモデル ID またはトランスポート/設定を変更するまで処理します。これにより、呼び出し元がどのバンドルPluginが書き換えを所有しているかを知る必要なく、エイリアス/互換プロバイダーシムが動作し続けます。サポート対象の Google ファミリー設定エントリをどのプロバイダーフックも書き換えない場合でも、バンドルされた Google 設定ノーマライザーがその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤプロトコルやカスタムリクエスト実行器を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き実行されるプロバイダー動作用です。

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

バンドルされたプロバイダーPluginは、上記のフックを組み合わせて、各ベンダーのカタログ、認証、thinking、リプレイ、使用量の要件に適合させます。信頼できるフックセットは `extensions/` 配下の各Plugin内にあります。このページでは、一覧をそのまま反映するのではなく、形を示します。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` と `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的カタログより先にアップストリームのモデル ID を表示できるようにします。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は、`prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` + `fetchUsageSnapshot` と組み合わせ、トークン交換と `/usage` 連携を所有します。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）により、各Pluginがクリーンアップを再実装する代わりに、プロバイダーは `buildReplayPolicy` を通じてトランスクリプトポリシーへオプトインできます。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` は `catalog` だけを登録し、共有推論ループを利用します。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく Anthropic Pluginの公開 `api.ts` / `contract-api.ts` シーム（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Pluginは `api.runtime` を通じて、選択されたコアヘルパーへアクセスできます。TTS の場合:

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

- `textToSpeech` は、ファイル/ボイスメモ面向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファ + サンプルレートを返します。Pluginはプロバイダー向けにリサンプル/エンコードする必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローに使用します。
- 音声一覧には、プロバイダー対応ピッカー向けに、ロケール、性別、パーソナリティタグなどのより豊富なメタデータを含めることができます。
- 現在、OpenAI と ElevenLabs はテレフォニーをサポートしています。Microsoft はサポートしていません。

Pluginは `api.registerSpeechProvider(...)` を通じて音声プロバイダーも登録できます。

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

- TTS ポリシー、フォールバック、返信配信はコアに保持します。
- ベンダー所有の音声合成動作には音声プロバイダーを使用します。
- レガシー Microsoft `edge` 入力は `microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは企業指向です。OpenClaw がこれらのケイパビリティ契約を追加していくにつれて、1 つのベンダーPluginがテキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像/音声/動画理解では、Pluginは汎用のキー/値バッグではなく、型付けされたメディア理解プロバイダーを 1 つ登録します。

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

- オーケストレーション、フォールバック、設定、チャネル配線はコアに保持します。
- ベンダー動作はプロバイダーPluginに保持します。
- 追加的な拡張は型付けされたままにします。新しい任意メソッド、新しい任意の結果フィールド、新しい任意ケイパビリティです。
- 動画生成はすでに同じパターンに従っています:
  - コアがケイパビリティ契約とランタイムヘルパーを所有します
  - ベンダーPluginが `api.registerVideoGenerationProvider(...)` を登録します
  - 機能/チャネルPluginが `api.runtime.videoGeneration.*` を使用します

メディア理解ランタイムヘルパーでは、Pluginは次のように呼び出せます。

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

- `api.runtime.mediaUnderstanding.*` は、画像/音声/動画理解の推奨共有面です。
- コアのメディア理解音声設定（`tools.media.audio`）とプロバイダーフォールバック順を使用します。
- 文字起こし出力が生成されない場合（たとえば入力がスキップされた/サポート対象外の場合）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換エイリアスとして残ります。

Pluginは `api.runtime.subagent` を通じてバックグラウンドのサブエージェント実行も起動できます。

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
- OpenClaw は、信頼された呼び出し元に対してのみ、これらのオーバーライドフィールドを尊重します。
- Plugin所有のフォールバック実行では、オペレーターが `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- 信頼されたPluginを特定の正規 `provider/model` ターゲットに制限するには `plugins.entries.<id>.subagent.allowedModels` を使用し、任意のターゲットを明示的に許可するには `"*"` を使用します。
- 信頼されていないPluginのサブエージェント実行も動作しますが、オーバーライド要求は黙ってフォールバックするのではなく拒否されます。
- Pluginが作成したサブエージェントセッションには、作成元Plugin ID がタグ付けされます。フォールバックの `api.runtime.subagent.deleteSession(...)` は、それら所有セッションのみを削除できます。任意のセッション削除には、引き続き管理者スコープの Gateway リクエストが必要です。

Web 検索では、Pluginはエージェントツール配線へ直接アクセスする代わりに、共有ランタイムヘルパーを使用できます。

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

Pluginは `api.registerWebSearchProvider(...)` を通じて Web 検索プロバイダーも登録できます。

注:

- プロバイダー選択、認証情報解決、共有リクエストセマンティクスはコアに保持します。
- ベンダー固有の検索トランスポートには Web 検索プロバイダーを使用します。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せずに検索動作を必要とする機能/チャネルPlugin向けの推奨共有面です。

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

- `generate(...)`: 設定済みの画像生成プロバイダーチェーンを使用して画像を生成します。
- `listProviders(...)`: 利用可能な画像生成プロバイダーとそのケイパビリティを一覧表示します。

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

- `path`: Gateway HTTP サーバー配下のルートパスです。
- `auth`: 必須です。通常の Gateway 認証を要求するには `"gateway"` を使用し、Plugin管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意です。`"exact"`（デフォルト）または `"prefix"` です。
- `replaceExisting`: 任意です。同じPluginが自身の既存ルート登録を置き換えられるようにします。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注:

- `api.registerHttpHandler(...)` は削除され、Plugin 読み込みエラーを引き起こします。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` の場合を除いて拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- 異なる `auth` レベルを持つ重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベルのみに保ってください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動的には受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストのランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です。
  - 共有シークレットの bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートのランタイムスコープは `operator.write` に固定されます
  - 信頼された ID を持つ HTTP モード（たとえば `trusted-proxy`、またはプライベート ingress 上の `gateway.auth.mode = "none"`）では、ヘッダーが明示的に存在する場合にのみ `x-openclaw-scopes` を尊重します
  - それらの ID を持つ Plugin ルートリクエストで `x-openclaw-scopes` が存在しない場合、ランタイムスコープは `operator.write` にフォールバックします
- 実用上のルール: gateway-auth Plugin ルートを暗黙の管理者サーフェスだと仮定しないでください。ルートに管理者専用の動作が必要な場合は、ID を持つ auth モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK のインポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルートバレルではなく、狭い SDK サブパスを使用してください。コアサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャネルエントリ/ビルドヘルパー                   |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括的な契約                     |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、狭いシーム群から選択します — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, および `channel-actions`。承認動作は、無関係な Plugin フィールドをまたいで混在させるのではなく、単一の `approvalCapability` 契約に統合するべきです。契約については [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムおよび設定ヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）にあります。広範な `config-runtime` 互換バレルではなく、`config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, および `config-mutation` を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
および `openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換シムです。新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（バンドル済み Plugin パッケージのルートごと）:

- `index.js` — バンドル済み Plugin エントリ
- `api.js` — ヘルパー/型バレル
- `runtime-api.js` — ランタイム専用バレル
- `setup-entry.js` — セットアップ Plugin エントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートしてください。コアや別の Plugin から、別の Plugin パッケージの `src/*` を決してインポートしないでください。
ファサードで読み込まれるエントリポイントは、存在する場合はアクティブなランタイム設定スナップショットを優先し、その後ディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`, `media-understanding`,
および `speech` のような機能固有のサブパスは、バンドル済み Plugin が現在使用しているため存在します。これらは自動的に長期固定の外部契約になるわけではありません — それらに依存する場合は、関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票などの非メッセージプリミティブについて、チャネル固有の `describeMessageTool(...)` スキーマへの寄与を所有するべきです。
共有送信プレゼンテーションでは、プロバイダー固有のボタン、コンポーネント、ブロック、カードフィールドではなく、汎用の `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作成者チェックリストについては [メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ機能を通じてレンダリング可能なものを宣言します。

- セマンティックプレゼンテーションブロック（`text`, `context`, `divider`, `buttons`, `select`）には `presentation`
- ピン留め配信リクエストには `delivery-pin`

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに劣化させるかを決定します。
汎用メッセージツールから、プロバイダー固有 UI の抜け道を公開しないでください。
レガシーなネイティブスキーマ用の非推奨 SDK ヘルパーは、既存のサードパーティ Plugin のために引き続きエクスポートされていますが、新しい Plugin では使用しないでください。

## チャネルターゲット解決

チャネル Plugin は、チャネル固有のターゲットセマンティクスを所有するべきです。共有アウトバウンドホストは汎用に保ち、プロバイダールールにはメッセージングアダプターサーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化済みターゲットをディレクトリ検索前に `direct`, `group`, または `channel` として扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力をディレクトリ検索ではなく ID らしい解決へ直接進めるべきかをコアに伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後にコアが最終的なプロバイダー所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後のプロバイダー固有セッションルート構築を所有します。

推奨される分割:

- ピア/グループ検索前に行うべきカテゴリ判断には `inferTargetChatType` を使用します。
- 「これを明示的/ネイティブなターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- 広範なディレクトリ検索ではなく、プロバイダー固有の正規化フォールバックには `resolveTarget` を使用します。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダーネイティブ ID は、汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有パラメーター内に保ってください。

## 設定に基づくディレクトリ

設定からディレクトリエントリを導出する Plugin は、そのロジックを Plugin 内に保ち、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用するべきです。

チャネルが次のような設定に基づくピア/グループを必要とする場合に使用します。

- allowlist 駆動の DM ピア
- 設定済みチャネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを扱います。

- クエリフィルタリング
- limit の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査と ID 正規化は Plugin 実装内に残すべきです。

## プロバイダーカタログ

プロバイダー Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` を使って推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します。

- 1 つのプロバイダーエントリには `{ provider }`
- 複数のプロバイダーエントリには `{ providers }`

Plugin がプロバイダー固有のモデル ID、ベース URL のデフォルト、または auth で保護されたモデルメタデータを所有する場合は `catalog` を使用します。

`catalog.order` は、Plugin のカタログが OpenClaw の組み込み暗黙プロバイダーに対していつマージされるかを制御します。

- `simple`: プレーンな API キーまたは env 駆動のプロバイダー
- `profile`: auth プロファイルが存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリを合成するプロバイダー
- `late`: 最終パス。他の暗黙プロバイダーの後

キー衝突時は後のプロバイダーが優先されるため、Plugin は同じプロバイダー ID を持つ組み込みプロバイダーエントリを意図的に上書きできます。

互換性:

- `discovery` はレガシーエイリアスとして引き続き機能します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用チャネル検査

Plugin がチャネルを登録する場合は、`resolveAccount(...)` と並べて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを優先してください。

理由:

- `resolveAccount(...)` はランタイムパスです。認証情報が完全に実体化されていると仮定でき、必要なシークレットが欠落している場合は高速に失敗できます。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, および doctor/config 修復フローのような読み取り専用コマンドパスでは、設定を説明するだけのためにランタイム認証情報を実体化する必要があってはなりません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような認証情報ソース/ステータスフィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可能性を報告するだけなら、生のトークン値を返す必要はありません。`tokenStatus: "available"`（および一致する source フィールド）を返せば、status 形式のコマンドには十分です。
- 認証情報が SecretRef 経由で設定されているが現在のコマンドパスで利用できない場合は、`configured_unavailable` を使用します。

これにより、読み取り専用コマンドはクラッシュしたり、アカウントが未設定であると誤報したりする代わりに、「設定済みだがこのコマンドパスでは利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を含む `package.json` を含めることができます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリは Plugin になります。パックが複数の extensions を列挙している場合、Plugin ID は `name/<fileBase>` になります。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリにインストールして
`node_modules` が利用できるようにしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、シンボリックリンク解決後も Plugin ディレクトリ内に留まる必要があります。パッケージディレクトリを脱出するエントリは拒否されます。

セキュリティ上の注意: `openclaw plugins install` は、プロジェクトローカルの `npm install --omit=dev --ignore-scripts`（ライフサイクルスクリプトなし、実行時の dev 依存関係なし）で Plugin 依存関係をインストールし、継承されたグローバル npm install 設定を無視します。
Plugin 依存ツリーは「純粋な JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は、軽量なセットアップ専用モジュールを指すことができます。
OpenClaw が無効化されたチャネル Plugin のセットアップサーフェスを必要とする場合、またはチャネル Plugin が有効だがまだ未設定の場合、完全な Plugin エントリの代わりに `setupEntry` を読み込みます。これにより、メイン Plugin エントリがツール、フック、またはその他のランタイム専用コードも配線する場合に、起動とセットアップを軽量に保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
は、チャネルがすでに設定済みの場合でも、Gateway の listen 前起動フェーズ中にチャネル Plugin を同じ `setupEntry` パスへオプトインできます。

これは、Gateway が listen を開始する前に存在しなければならない起動サーフェスを `setupEntry` が完全にカバーする場合にのみ使用してください。実際には、セットアップエントリは起動が依存するすべてのチャネル所有機能を登録する必要があります。たとえば:

- チャネル登録自体
- Gateway が listen を開始する前に利用可能でなければならない HTTP ルート
- その同じ時間枠中に存在しなければならない Gateway メソッド、ツール、またはサービス

完全なエントリが必要な起動機能をまだ所有している場合は、このフラグを有効にしないでください。Plugin はデフォルトの動作のままにして、OpenClaw が起動中に完全なエントリを読み込むようにしてください。

バンドル済みチャネルは、完全なチャネルランタイムが読み込まれる前にコアが参照できる、セットアップ専用の契約サーフェスヘルパーを公開することもできます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core は、完全な plugin エントリを読み込まずにレガシーの単一アカウントチャンネル config を `channels.<id>.accounts.*` に昇格する必要があるとき、このサーフェスを使用します。
Matrix が現在のバンドル例です。名前付きアカウントがすでに存在する場合は auth/bootstrap キーだけを名前付きの昇格アカウントに移動し、常に `accounts.default` を作成するのではなく、設定済みの非正規 default-account キーを保持できます。

これらのセットアップパッチアダプターにより、バンドルされた契約サーフェスの検出は遅延されたままになります。インポート時の負荷は軽いままです。昇格サーフェスは、モジュールインポート時にバンドルチャンネルの起動へ再入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、plugin 固有のプレフィックス上に置いてください。Core 管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みのままであり、plugin がより狭いスコープを要求した場合でも常に `operator.admin` に解決されます。

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

チャンネル plugins は、`openclaw.channel` 経由でセットアップ/検出メタデータを、`openclaw.install` 経由でインストールヒントを広告できます。これにより、core カタログはデータを持たないままになります。

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
- `preferOver`: このカタログエントリが優先すべき、優先度の低い plugin/チャンネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: アウトバウンド整形の判断用に、チャンネルを markdown 対応としてマーク
- `exposure.configured`: `false` に設定すると、設定済みチャンネルの一覧サーフェスからチャンネルを非表示
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからチャンネルを非表示
- `exposure.docs`: docs ナビゲーションサーフェス向けに、チャンネルを内部/プライベートとしてマーク
- `showConfigured` / `showInSetup`: 互換性のためにまだ受け付けられるレガシーエイリアス。`exposure` を推奨
- `quickstartAllowFrom`: チャンネルを標準のクイックスタート `allowFrom` フローに参加させる
- `forceAccountBinding`: アカウントが 1 つだけ存在する場合でも、明示的なアカウントバインディングを必須にする
- `preferSessionLookupForAnnounceTarget`: アナウンスターゲット解決時にセッション検索を優先する

OpenClaw は **外部チャンネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。JSON ファイルを次のいずれかに配置してください:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）に 1 つ以上の JSON ファイルを指定します（カンマ/セミコロン/`PATH` 区切り）。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは `"entries"` キーのレガシーエイリアスとして `"packages"` または `"plugins"` も受け付けます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックの隣に正規化されたインストール元ファクトを公開します。正規化されたファクトは、npm spec が厳密なバージョンなのか浮動セレクターなのか、期待される integrity メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージ ID が既知の場合、正規化されたファクトは、解析された npm パッケージ名がその ID からずれていると警告します。また、`defaultChoice` が無効な場合や利用できないソースを指している場合、さらに有効な npm ソースなしに npm integrity メタデータが存在する場合にも警告します。コンシューマーは、手作りエントリやカタログ shim がそれを合成しなくてもよいように、`installSource` を追加的な任意フィールドとして扱う必要があります。
これにより、オンボーディングと診断は plugin ランタイムをインポートせずにソースプレーン状態を説明できます。

公式の外部 npm エントリでは、厳密な `npmSpec` と `expectedIntegrity` を優先してください。裸のパッケージ名と dist-tag も互換性のために引き続き機能しますが、ソースプレーン警告を表示します。これにより、既存 plugins を壊さずに、カタログを pin 済みかつ integrity チェック済みインストールへ移行できます。
オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` とワークスペース相対の `sourcePath` を持つ管理対象 plugin の plugin インデックスエントリを記録します。絶対的な運用ロードパスは `plugins.load.paths` に残ります。インストールレコードは、ローカルワークステーションのパスを長期 config に重複して入れることを避けます。これにより、生のファイルシステムパスを開示する 2 つ目のサーフェスを追加せずに、ローカル開発インストールをソースプレーン診断から見えるようにします。永続化された `plugins/installs.json` plugin インデックスがインストールソースの正本であり、plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、plugin マニフェストが欠落または無効な場合でも永続的です。その `plugins` 配列は再構築可能なマニフェストビューです。

## コンテキストエンジン plugins

コンテキストエンジン plugins は、取り込み、組み立て、Compaction のセッションコンテキストオーケストレーションを所有します。plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

plugin が単にメモリ検索やフックを追加するだけでなく、デフォルトのコンテキストパイプラインを置き換えたり拡張したりする必要がある場合に使用してください。

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

factory `ctx` は、構築時の初期化用に任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

エンジンが Compaction アルゴリズムを所有**しない**場合は、`compact()` を実装したままにし、明示的に委譲してください:

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

plugin が現在の API に合わない振る舞いを必要とする場合、private な内部参照で plugin システムを迂回しないでください。不足しているケイパビリティを追加してください。

推奨される手順:

1. core 契約を定義する
   core が所有すべき共有の振る舞いを決めます: ポリシー、フォールバック、config マージ、ライフサイクル、チャンネル向けセマンティクス、ランタイムヘルパーの形。
2. 型付き plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な型付きケイパビリティサーフェスで拡張します。
3. core とチャンネル/機能コンシューマーを配線する
   チャンネルと機能 plugins は、ベンダー実装を直接インポートするのではなく、core 経由で新しいケイパビリティを消費する必要があります。
4. ベンダー実装を登録する
   その後、ベンダー plugins が各自のバックエンドをケイパビリティに対して登録します。
5. 契約カバレッジを追加する
   所有権と登録形状が時間が経っても明示的なままになるように、テストを追加します。

これは、OpenClaw が 1 つのプロバイダーの世界観にハードコードされることなく、意見を持ち続ける方法です。具体的なファイルチェックリストと実例については、[ケイパビリティ Cookbook](/ja-JP/plugins/architecture) を参照してください。

### ケイパビリティチェックリスト

新しいケイパビリティを追加するとき、実装は通常、次のサーフェスをまとめて触る必要があります:

- `src/<capability>/types.ts` の core 契約型
- `src/<capability>/runtime.ts` の core ランナー/ランタイムヘルパー
- `src/plugins/types.ts` の plugin API 登録サーフェス
- `src/plugins/registry.ts` の plugin レジストリ配線
- 機能/チャンネル plugins が消費する必要がある場合は、`src/plugins/runtime/*` の plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ/テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` の operator/plugin docs

これらのサーフェスのいずれかが欠けている場合、そのケイパビリティはまだ完全に統合されていないことを示す場合がほとんどです。

### ケイパビリティテンプレート

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

契約テストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールはシンプルに保たれます:

- core がケイパビリティ契約とオーケストレーションを所有する
- ベンダー plugins がベンダー実装を所有する
- 機能/チャンネル plugins がランタイムヘルパーを消費する
- 契約テストが所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開ケイパビリティモデルと形状
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [plugins の構築](/ja-JP/plugins/building-plugins)
