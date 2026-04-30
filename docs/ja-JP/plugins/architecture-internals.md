---
read_when:
    - プロバイダーのランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しい Plugin 機能またはコンテキストエンジン Plugin の追加
summary: 'Plugin アーキテクチャ内部: ロードパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照表'
title: Plugin アーキテクチャの内部構造
x-i18n:
    generated_at: "2026-04-30T05:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開ケイパビリティモデル、Plugin形状、所有権/実行契約については、[Pluginアーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページは、内部メカニクスのリファレンスです: ロードパイプライン、レジストリ、ランタイムフック、Gateway HTTPルート、インポートパス、スキーマ表。

## ロードパイプライン

起動時に、OpenClawはおおむね次のことを行います:

1. 候補Pluginルートを検出する
2. ネイティブまたは互換バンドルマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin設定を正規化する（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 各候補の有効化を判断する
6. 有効化されたネイティブモジュールをロードする: ビルド済みのバンドルモジュールはネイティブローダーを使用し、
   未ビルドのネイティブPluginはjitiを使用する
7. ネイティブの`register(api)`フックを呼び出し、登録内容をPluginレジストリに収集する
8. レジストリをコマンド/ランタイムサーフェスに公開する

<Note>
`activate`は`register`のレガシーエイリアスです — ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべてのバンドル済みPluginは`register`を使用します。新しいPluginでは`register`を優先してください。
</Note>

安全ゲートはランタイム実行の**前**に行われます。エントリがPluginルートの外へ抜ける場合、パスがワールド書き込み可能な場合、または非バンドルPluginでパス所有権が疑わしく見える場合、候補はブロックされます。

### マニフェスト優先の動作

マニフェストはコントロールプレーンの信頼できる情報源です。OpenClawはこれを使って次のことを行います:

- Pluginを識別する
- 宣言されたチャネル/Skills/設定スキーマまたはバンドルケイパビリティを検出する
- `plugins.entries.<id>.config`を検証する
- Control UIのラベル/プレースホルダーを補強する
- インストール/カタログメタデータを表示する
- Pluginランタイムをロードせずに、低コストのアクティベーションとセットアップ記述子を保持する

ネイティブPluginでは、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

任意のマニフェスト`activation`ブロックと`setup`ブロックはコントロールプレーンに残ります。これらはアクティベーション計画とセットアップ検出のためのメタデータ専用記述子であり、ランタイム登録、`register(...)`、`setupEntry`を置き換えるものではありません。
最初のライブアクティベーション利用側は、より広いレジストリ実体化の前にPluginロードを絞り込むため、マニフェストのコマンド、チャネル、プロバイダーヒントを使うようになりました:

- CLIロードは、要求されたプライマリコマンドを所有するPluginに絞り込む
- チャネルセットアップ/Plugin解決は、要求されたチャネルidを所有するPluginに絞り込む
- 明示的なプロバイダーセットアップ/ランタイム解決は、要求されたプロバイダーidを所有するPluginに絞り込む
- Gateway起動計画は、明示的な起動時インポートと起動時オプトアウトに`activation.onStartup`を使用する。OpenClawが暗黙的な起動時インポートから移行する中で、すべてのPluginはこれを宣言する必要がある。一方で、静的ケイパビリティメタデータがなく、`activation.onStartup`もないPluginは、互換性のために非推奨の暗黙的な起動時サイドカーフォールバックを引き続き使用する

アクティベーションプランナーは、既存の呼び出し元向けのid専用APIと、新しい診断向けの計画APIの両方を公開します。計画エントリはPluginが選択された理由を報告し、明示的な`activation.*`プランナーヒントと、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどのマニフェスト所有権フォールバックを分離します。この理由の分離が互換性境界です: 既存のPluginメタデータは引き続き動作し、新しいコードはランタイムロードのセマンティクスを変えずに広範なヒントやフォールバック動作を検出できます。

セットアップ検出は、`setup-api`へフォールバックする前に候補Pluginを絞り込むため、`setup.providers`や`setup.cliBackends`などの記述子所有idを優先するようになりました。`setup-api`へのフォールバックは、セットアップ時ランタイムフックをまだ必要とするPlugin向けです。プロバイダーセットアップ一覧は、プロバイダーランタイムをロードせずに、マニフェスト`providerAuthChoices`、記述子由来のセットアップ選択肢、インストールカタログメタデータを使用します。明示的な`setup.requiresRuntime: false`は記述子専用の打ち切りです。省略された`requiresRuntime`は互換性のためにレガシーのsetup-apiフォールバックを維持します。検出された複数のPluginが同じ正規化済みセットアッププロバイダーまたはCLIバックエンドidを主張する場合、セットアップ検索は検出順に頼るのではなく、曖昧な所有者を拒否します。セットアップランタイムが実行される場合、レジストリ診断は、レガシーPluginをブロックせずに、`setup.providers` / `setup.cliBackends`とsetup-apiによって登録されたプロバイダーまたはCLIバックエンドの間のずれを報告します。

### Pluginキャッシュ境界

OpenClawは、Plugin検出結果や直接マニフェストレジストリデータを、実時間ウィンドウの背後でキャッシュしません。インストール、マニフェスト編集、ロードパス変更は、次の明示的なメタデータ読み取りまたはスナップショット再構築で見えるようになる必要があります。
マニフェストファイルパーサーは、開いたマニフェストパス、inode、サイズ、タイムスタンプをキーにした有界のファイルシグネチャキャッシュを保持できます。このキャッシュは変更されていないバイト列の再解析を避けるだけで、検出、レジストリ、所有者、ポリシーの回答をキャッシュしてはなりません。

安全なメタデータ高速経路は、隠れたキャッシュではなく、明示的なオブジェクト所有です。
Gateway起動ホットパスは、現在の`PluginMetadataSnapshot`、派生した`PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出しチェーンに渡す必要があります。設定検証、起動時自動有効化、Pluginブートストラップ、プロバイダー選択は、それらのオブジェクトが現在の設定とPluginインベントリを表す間、再利用できます。セットアップ検索は、その特定のセットアップパスが明示的なマニフェストレジストリを受け取らない限り、必要に応じてマニフェストメタデータを再構築します。隠れた検索キャッシュを追加するのではなく、これをコールドパスフォールバックとして維持してください。入力が変わったら、スナップショットを変更したり履歴コピーを保持したりするのではなく、再構築して置き換えてください。
アクティブなPluginレジストリ上のビューと、バンドル済みチャネルのブートストラップヘルパーは、現在のレジストリ/ルートから再計算する必要があります。1回の呼び出し内で作業の重複排除や再入の保護に使う短命のマップは問題ありませんが、プロセスメタデータキャッシュになってはなりません。

Pluginロードでは、永続キャッシュ層はランタイムロードです。コードまたはインストール済みアーティファクトが実際にロードされるとき、次のようなローダー状態を再利用できます:

- `PluginLoaderCacheState`と互換性のあるアクティブランタイムレジストリ
- 同じランタイムサーフェスの繰り返しインポートを避けるために使われるjiti/モジュールキャッシュと公開サーフェスローダーキャッシュ
- インストール済みPluginアーティファクト向けのランタイム依存関係ミラーとファイルシステムキャッシュ
- パス正規化または重複解決のための短命の呼び出し単位マップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイムロードを要求していない限り、「どのPluginがこのプロバイダーを所有しているか」のようなコントロールプレーンの質問に答えてはなりません。

次のものに永続キャッシュや実時間キャッシュを追加しないでください:

- 検出結果
- 直接マニフェストレジストリ
- インストール済みPluginインデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者検索、モデル抑制、プロバイダーポリシー、公開アーティファクトメタデータ
- 変更されたマニフェスト、インストール済みインデックス、またはロードパスが次のメタデータ読み取りで見えるべき、その他のマニフェスト由来の回答

永続化されたインストール済みPluginインデックスからマニフェストメタデータを再構築する呼び出し元は、そのレジストリを必要に応じて再構築します。インストール済みインデックスは永続的なソースプレーン状態であり、隠れたインプロセスメタデータキャッシュではありません。

## レジストリモデル

ロード済みPluginは、ランダムなコアグローバルを直接変更しません。中央のPluginレジストリに登録します。

レジストリは次を追跡します:

- Pluginレコード（ID、ソース、オリジン、ステータス、診断）
- ツール
- レガシーフックと型付きフック
- チャネル
- プロバイダー
- Gateway RPCハンドラー
- HTTPルート
- CLI登録関数
- バックグラウンドサービス
- Plugin所有のコマンド

その後、コア機能はPluginモジュールと直接やり取りするのではなく、そのレジストリから読み取ります。これにより、ロードは一方向に保たれます:

- Pluginモジュール -> レジストリ登録
- コアランタイム -> レジストリ利用

この分離は保守性にとって重要です。つまり、ほとんどのコアサーフェスは「すべてのPluginモジュールを特別扱いする」のではなく、「レジストリを読む」という1つの統合点だけを必要とします。

## 会話バインディングコールバック

会話をバインドするPluginは、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)`を使うと、バインド要求が承認または拒否された後にコールバックを受け取れます:

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

- `status`: `"approved"`または`"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または`"deny"`
- `binding`: 承認された要求の解決済みバインディング
- `request`: 元の要求サマリー、デタッチヒント、送信者id、会話メタデータ

このコールバックは通知専用です。会話をバインドできる相手を変更せず、コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダーPluginには3つの層があります:

- 低コストのランタイム前検索のための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨の互換性`providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **設定時フック**: `catalog`（レガシー`discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、ストリームラッピング、thinkingレベル、リプレイポリシー、使用量エンドポイントをカバーする40以上の任意フック。完全な一覧は[フック順序と使用法](#hook-order-and-usage)を参照してください。

OpenClawは引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、ツールポリシーを所有します。これらのフックは、プロバイダー固有の動作のための拡張サーフェスであり、完全にカスタムの推論トランスポートを必要としません。

プロバイダーにenvベースの認証情報があり、汎用認証/ステータス/モデルピッカー経路がPluginランタイムをロードせずにそれを見るべき場合は、マニフェスト`setup.providers[].envVars`を使用してください。非推奨の`providerAuthEnvVars`は、非推奨期間中も互換アダプターによって読み取られ、それを使用する非バンドルPluginはマニフェスト診断を受け取ります。あるプロバイダーidが別のプロバイダーidのenv vars、認証プロファイル、設定裏付けの認証、APIキーのオンボーディング選択肢を再利用すべき場合は、マニフェスト`providerAuthAliases`を使用してください。オンボーディング/認証選択CLIサーフェスが、プロバイダーランタイムをロードせずにプロバイダーの選択肢id、グループラベル、単純な1フラグ認証配線を知るべき場合は、マニフェスト`providerAuthChoices`を使用してください。プロバイダーランタイム`envVars`は、オンボーディングラベルやOAuthクライアントid/クライアントシークレットのセットアップ変数など、運用者向けヒント用に保持してください。

チャネルにenv駆動の認証またはセットアップがあり、汎用シェルenvフォールバック、設定/ステータスチェック、またはセットアッププロンプトがチャネルランタイムをロードせずにそれを見るべき場合は、マニフェスト`channelEnvVars`を使用してください。

### フック順序と使用法

モデル/プロバイダーPluginについて、OpenClawはおおむねこの順序でフックを呼び出します。
「いつ使うか」列は簡易判断ガイドです。
`ProviderPlugin.capabilities`や`suppressBuiltInModel`など、OpenClawがもう呼び出さない互換性専用プロバイダーフィールドは、意図的にここには掲載していません。

| #   | フック                            | 役割                                                                                                           | 使用する場面                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中に、プロバイダー設定を `models.providers` に公開する                                      | プロバイダーがカタログまたはベース URL のデフォルトを所有している場合                                                                        |
| 2   | `applyConfigDefaults`             | 設定の実体化中に、プロバイダー所有のグローバル設定デフォルトを適用する                                        | デフォルトが認証モード、環境、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                            |
| --  | _(組み込みモデル検索)_            | OpenClaw はまず通常のレジストリ/カタログ経路を試す                                                            | _(Plugin フックではありません)_                                                                                                               |
| 3   | `normalizeModelId`                | 検索前に、レガシーまたはプレビューのモデル ID エイリアスを正規化する                                          | 正規のモデル解決前に、プロバイダーがエイリアスのクリーンアップを所有している場合                                                            |
| 4   | `normalizeTransport`              | 汎用モデル組み立て前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                               | 同じトランスポートファミリー内のカスタムプロバイダー ID について、プロバイダーがトランスポートのクリーンアップを所有している場合          |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決前に `models.providers.<id>` を正規化する                                          | プロバイダーに、Plugin 側で保持すべき設定クリーンアップが必要な場合。バンドル済み Google ファミリーのヘルパーは、サポート対象の Google 設定エントリも補完する |
| 6   | `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブのストリーミング使用量互換の書き換えを適用する                                    | プロバイダーに、エンドポイント駆動のネイティブストリーミング使用量メタデータ修正が必要な場合                                                |
| 7   | `resolveConfigApiKey`             | ランタイム認証の読み込み前に、設定プロバイダー向けの env マーカー認証を解決する                               | プロバイダーがプロバイダー所有の env マーカー API キー解決を持つ場合。`amazon-bedrock` には、ここに組み込みの AWS env マーカー解決もある   |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたは設定 backed の認証を表面化する                                 | プロバイダーが合成/ローカルの認証情報マーカーで動作できる場合                                                                                |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/アプリ所有の認証情報では、デフォルトの `persistence` は `runtime-only` | プロバイダーが、コピーしたリフレッシュトークンを永続化せずに外部認証情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを、env/設定 backed 認証の背後に下げる                              | プロバイダーが、優先されるべきではない合成プレースホルダープロファイルを保存する場合                                                        |
| 11  | `resolveDynamicModel`             | ローカルレジストリにまだない、プロバイダー所有のモデル ID 向けの同期フォールバック                            | プロバイダーが任意のアップストリームモデル ID を受け入れる場合                                                                               |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップの後、`resolveDynamicModel` を再実行する                                                   | 不明な ID を解決する前に、プロバイダーがネットワークメタデータを必要とする場合                                                              |
| 13  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使用する前の最終書き換え                                                    | プロバイダーにトランスポート書き換えが必要だが、引き続きコアトランスポートを使用する場合                                                    |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデル向けに互換フラグを提供する                                    | プロバイダーを引き継がずに、プロバイダーがプロキシトランスポート上の自分のモデルを認識する場合                                              |
| 15  | `normalizeToolSchemas`            | 埋め込みランナーが参照する前にツールスキーマを正規化する                                                      | プロバイダーにトランスポートファミリーのスキーマクリーンアップが必要な場合                                                                  |
| 16  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を表面化する                                                        | コアにプロバイダー固有のルールを教えずに、プロバイダーがキーワード警告を出したい場合                                                        |
| 17  | `resolveReasoningOutputMode`      | ネイティブまたはタグ付きの推論出力契約を選択する                                                              | プロバイダーがネイティブフィールドではなく、タグ付きの推論/最終出力を必要とする場合                                                         |
| 18  | `prepareExtraParams`              | 汎用ストリームオプションラッパーの前に、リクエストパラメーターを正規化する                                    | プロバイダーにデフォルトのリクエストパラメーター、またはプロバイダーごとのパラメータークリーンアップが必要な場合                            |
| 19  | `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                                | プロバイダーが単なるラッパーではなく、カスタムのワイヤプロトコルを必要とする場合                                                            |
| 20  | `wrapStreamFn`                    | 汎用ラッパーが適用された後のストリームラッパー                                                                | プロバイダーが、カスタムトランスポートなしでリクエストヘッダー/本文/モデル互換ラッパーを必要とする場合                                     |
| 21  | `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたはメタデータを付与する                                      | 汎用トランスポートに、プロバイダーネイティブのターン識別子を送信させたい場合                                                                |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付与する                                   | 汎用 WS トランスポートのセッションヘッダーまたはフォールバックポリシーを、プロバイダーが調整したい場合                                     |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルをランタイムの `apiKey` 文字列にする                      | プロバイダーが追加の認証メタデータを保存し、カスタムのランタイムトークン形式を必要とする場合                                                |
| 24  | `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き              | プロバイダーが共有の `pi-ai` リフレッシャーに適合しない場合                                                                                  |
| 25  | `buildAuthDoctorHint`             | OAuth リフレッシュが失敗したときに追加される修復ヒント                                                        | リフレッシュ失敗後に、プロバイダーがプロバイダー所有の認証修復ガイダンスを必要とする場合                                                    |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウ超過マッチャー                                                        | プロバイダーに、汎用ヒューリスティックでは見逃す生の超過エラーがある場合                                                                    |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                    | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などにマッピングできる場合                                                   |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                           | プロバイダーに、プロキシ固有のキャッシュ TTL ゲーティングが必要な場合                                                                        |
| 29  | `buildMissingAuthMessage`         | 汎用の認証欠落回復メッセージの置き換え                                                                        | プロバイダーに、プロバイダー固有の認証欠落回復ヒントが必要な場合                                                                            |
| 30  | `augmentModelCatalog`             | 検出後に追加される合成/最終カタログ行                                                                         | プロバイダーが `models list` とピッカーで合成の前方互換行を必要とする場合                                                                    |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                    | プロバイダーが、選択されたモデル向けにカスタムの思考段階またはバイナリラベルを公開する場合                                                  |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                                 | プロバイダーがバイナリの思考オン/オフのみを公開する場合                                                                                     |
| 33  | `supportsXHighThinking`           | `xhigh` 推論サポート互換フック                                                                                | プロバイダーが一部のモデルにのみ `xhigh` を有効にしたい場合                                                                                  |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                          | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有している場合                                                              |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                        | プロバイダーがライブ/スモークの優先モデルマッチングを所有している場合                                                                       |
| 36  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムトークン/キーに交換する                                         | プロバイダーがトークン交換または短命のリクエスト認証情報を必要とする場合                                                                    |
| 37  | `resolveUsageAuth`                | `/usage` と関連するステータスサーフェス用の使用量/課金認証情報を解決する                                     | プロバイダーにカスタムの使用量/クォータトークン解析、または異なる使用量認証情報が必要                                                               |
| 38  | `fetchUsageSnapshot`              | 認証の解決後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーにプロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索用にプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダー Plugin に属する                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにカスタムのトランスクリプトポリシー（たとえば thinking-block の除去）が必要                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用トランスクリプトのクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーに共有 Compaction ヘルパーを超えたプロバイダー固有のリプレイ書き換えが必要                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に最終的なリプレイターン検証または整形を行う                                           | プロバイダートランスポートに汎用サニタイズ後のより厳密なターン検証が必要                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったとき、プロバイダーにテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` はまず一致したプロバイダー Plugin を確認し、その後、実際にモデル ID または transport/config を変更するものが見つかるまで、他のフック対応プロバイダー Plugin にフォールスルーします。これにより、どの組み込み Plugin が rewrite を所有しているかを呼び出し側が知る必要なく、alias/compat プロバイダー shim が機能し続けます。サポートされている Google ファミリーの config エントリをプロバイダーフックが rewrite しない場合でも、組み込みの Google config normalizer がその互換性 cleanup を適用します。

プロバイダーが完全にカスタムの wire protocol やカスタム request executor を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の inference loop 上で引き続き動作するプロバイダー挙動のためのものです。

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

組み込みプロバイダー Plugin は、各ベンダーの catalog、auth、thinking、replay、usage のニーズに合わせるため、上記のフックを組み合わせます。信頼できるフックセットは `extensions/` 配下の各 Plugin にあります。このページは一覧をそのまま反映するのではなく、形を示しています。

<AccordionGroup>
  <Accordion title="パススルー catalog プロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的 catalog より先に upstream
    model id を公開できるようにします。
  </Accordion>
  <Accordion title="OAuth と usage エンドポイントプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせ、token exchange と `/usage` 統合を所有します。
  </Accordion>
  <Accordion title="Replay と transcript cleanup ファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各 Plugin が
    cleanup を再実装する代わりに、`buildReplayPolicy` を介して transcript policy にオプトインできます。
  </Accordion>
  <Accordion title="Catalog のみのプロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine` は `catalog` だけを登録し、共有 inference loop に乗ります。
  </Accordion>
  <Accordion title="Anthropic 固有の stream ヘルパー">
    Beta headers、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく
    Anthropic Plugin の公開 `api.ts` / `contract-api.ts` seam
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Plugin は `api.runtime` を介して、選択された core ヘルパーにアクセスできます。TTS の場合:

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

- `textToSpeech` は、file/voice-note surface 向けの通常の core TTS output payload を返します。
- core の `messages.tts` configuration と provider selection を使用します。
- PCM audio buffer + sample rate を返します。Plugin はプロバイダー向けに resample/encode する必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の voice picker やセットアップフローに使用します。
- voice listing には、provider-aware picker 向けに locale、gender、personality tags などのより豊富な metadata を含められます。
- OpenAI と ElevenLabs は現在 telephony をサポートしています。Microsoft はサポートしていません。

Plugin は `api.registerSpeechProvider(...)` を介して speech provider も登録できます。

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

- TTS policy、fallback、reply delivery は core に保持します。
- speech provider は、ベンダー所有の synthesis behavior に使用します。
- レガシー Microsoft `edge` input は `microsoft` provider id に正規化されます。
- 推奨される ownership model は company-oriented です。OpenClaw がこれらの capability contract を追加していくにつれて、1 つのベンダー Plugin が text、speech、image、および将来の media provider を所有できます。

image/audio/video understanding では、Plugin は汎用 key/value bag の代わりに、型付きの media-understanding provider を 1 つ登録します。

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

- orchestration、fallback、config、channel wiring は core に保持します。
- ベンダー挙動は provider Plugin に保持します。
- 加算的な拡張は型付きのままにする必要があります。新しい任意メソッド、新しい任意 result field、新しい任意 capability です。
- Video generation もすでに同じパターンに従っています。
  - core は capability contract と runtime helper を所有します
  - ベンダー Plugin は `api.registerVideoGenerationProvider(...)` を登録します
  - feature/channel Plugin は `api.runtime.videoGeneration.*` を消費します

media-understanding runtime helper では、Plugin は次を呼び出せます。

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

audio transcription では、Plugin は media-understanding runtime または古い STT alias のいずれかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` は、image/audio/video understanding 向けの推奨共有 surface です。
- core の media-understanding audio configuration（`tools.media.audio`）と provider fallback order を使用します。
- transcription output が生成されない場合（たとえば skipped/unsupported input）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は compatibility alias として残ります。

Plugin は `api.runtime.subagent` を通じて、バックグラウンド subagent run を起動することもできます。

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

- `provider` と `model` は run ごとの任意 override であり、永続的な session change ではありません。
- OpenClaw は、trusted caller に対してのみこれらの override field を尊重します。
- Plugin 所有の fallback run では、operator が `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、trusted Plugin を特定の正規 `provider/model` target に制限するか、`"*"` で任意の target を明示的に許可します。
- untrusted Plugin の subagent run も機能しますが、override request は暗黙に fallback する代わりに拒否されます。
- Plugin が作成した subagent session には、作成元の Plugin id がタグ付けされます。fallback `api.runtime.subagent.deleteSession(...)` は、それらの所有 session のみを削除できます。任意の session deletion には、引き続き admin-scoped Gateway request が必要です。

web search では、Plugin は agent tool wiring に入り込む代わりに、共有 runtime helper を消費できます。

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

Plugin は `api.registerWebSearchProvider(...)` を介して web-search provider も登録できます。

注記:

- provider selection、credential resolution、shared request semantics は core に保持します。
- web-search provider は、ベンダー固有の search transport に使用します。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せず search behavior を必要とする feature/channel Plugin 向けの推奨共有 surface です。

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

- `generate(...)`: 設定済みの image-generation provider chain を使用して画像を生成します。
- `listProviders(...)`: 利用可能な image-generation provider とその capability を一覧表示します。

## Gateway HTTP ルート

Plugin は `api.registerHttpRoute(...)` で HTTP endpoint を公開できます。

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

- `path`: gateway HTTP server 配下の route path。
- `auth`: 必須です。通常の gateway auth を要求するには `"gateway"` を使用し、Plugin-managed auth/webhook verification には `"plugin"` を使用します。
- `match`: 任意です。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意です。同じ Plugin が自身の既存 route registration を置き換えられるようにします。
- `handler`: route が request を処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、plugin-load エラーの原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- `replaceExisting: true` の場合を除き、完全一致の `path + match` 競合は拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルが異なる重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベルのみにしてください。
- `auth: "plugin"` ルートは operator runtime scope を自動的には受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエスト runtime scope 内で実行されますが、そのスコープは意図的に保守的です。
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、plugin-route runtime scope は `operator.write` に固定されます
  - 信頼された ID を伴う HTTP モード（たとえばプライベート ingress 上の `trusted-proxy` または `gateway.auth.mode = "none"`）では、ヘッダーが明示的に存在する場合にのみ `x-openclaw-scopes` を尊重します
  - これらの ID を伴う plugin-route リクエストで `x-openclaw-scopes` が存在しない場合、runtime scope は `operator.write` にフォールバックします
- 実用上のルール: gateway-auth Plugin ルートが暗黙の admin surface だと想定しないでください。ルートに admin 限定の動作が必要な場合は、ID を伴う auth モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約をドキュメント化してください。

## Plugin SDK インポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルート
barrel ではなく、狭い SDK サブパスを使用してください。core サブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | Channel エントリ/ビルドヘルパー                   |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと umbrella contract               |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

Channel Plugin は、狭い seam のファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。承認動作は、無関係な
Plugin フィールドをまたいで混在させるのではなく、1 つの `approvalCapability` contract に統合するべきです。[Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

Runtime と config のヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）にあります。広範な `config-runtime` 互換 barrel ではなく、
`config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`
を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨互換 shim です。
新しいコードでは、代わりにより狭い汎用プリミティブをインポートするべきです。
</Info>

repo 内部エントリポイント（バンドル済み Plugin パッケージルートごと）:

- `index.js` — バンドル済み Plugin エントリ
- `api.js` — ヘルパー/types barrel
- `runtime-api.js` — runtime 専用 barrel
- `setup-entry.js` — setup Plugin エントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートするべきです。core から、または別の Plugin から、別の Plugin パッケージの `src/*` を決してインポートしないでください。
facade-loaded エントリポイントは、有効な runtime config snapshot が存在する場合はそれを優先し、その後ディスク上の解決済み config ファイルにフォールバックします。

`image-generation`, `media-understanding`, `speech` などの capability-specific サブパスは、バンドル済み Plugin が現在それらを使用しているため存在します。これらは、自動的に長期固定の外部契約になるわけではありません — 依存する場合は該当する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票などの非メッセージプリミティブについて、チャンネル固有の `describeMessageTool(...)` スキーマ
contribution を所有するべきです。
共有送信プレゼンテーションでは、provider-native なボタン、コンポーネント、ブロック、カードフィールドではなく、汎用 `MessagePresentation` contract を使用するべきです。
contract、fallback ルール、provider マッピング、Plugin 作者チェックリストについては、[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ capability を通じてレンダリング可能なものを宣言します。

- セマンティックなプレゼンテーションブロック（`text`, `context`, `divider`, `buttons`, `select`）には `presentation`
- pinned-delivery リクエストには `delivery-pin`

core は、プレゼンテーションをネイティブにレンダリングするか、テキストに degrade するかを決定します。
汎用メッセージツールから provider-native な UI エスケープハッチを公開しないでください。
レガシー native スキーマ向けの非推奨 SDK ヘルパーは、既存のサードパーティ Plugin のために引き続きエクスポートされていますが、新しい Plugin は使用するべきではありません。

## チャンネルターゲット解決

Channel Plugin は、チャンネル固有のターゲットセマンティクスを所有するべきです。共有 outbound host は汎用のままにし、provider ルールには messaging adapter surface を使用してください。

- `messaging.inferTargetChatType({ to })` は、directory lookup の前に、正規化済みターゲットを `direct`, `group`, `channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力が directory search ではなく id-like resolution に直接進むべきかどうかを core に伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または directory miss 後に core が最終的な provider-owned resolution を必要とする場合の Plugin fallback です。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲットが解決された後の provider 固有の session route 構築を所有します。

推奨される分割:

- peers/groups の検索前に行うべきカテゴリ判定には `inferTargetChatType` を使用します。
- 「これを明示的/ネイティブのターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- provider 固有の正規化 fallback には `resolveTarget` を使用し、広範な directory search には使用しません。
- chat ids、thread ids、JIDs、handles、room ids などの provider-native id は、汎用 SDK フィールドではなく、`target` 値または provider 固有 params 内に保持します。

## Config-backed ディレクトリ

config から directory entries を派生する Plugin は、そのロジックを Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用するべきです。

チャンネルが次のような config-backed peers/groups を必要とする場合に使用してください。

- allowlist 駆動の DM peers
- 設定済みの channel/group maps
- account-scoped static directory fallbacks

`directory-runtime` の共有ヘルパーは汎用操作のみを扱います。

- query filtering
- limit application
- deduping/normalization helpers
- `ChannelDirectoryEntry[]` の構築

チャンネル固有の account inspection と id normalization は Plugin 実装内に残すべきです。

## Provider catalogs

Provider Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` で inference 用の model catalogs を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します。

- 1 つの provider entry には `{ provider }`
- 複数の provider entries には `{ providers }`

Plugin が provider 固有の model ids、base URL defaults、または auth-gated model metadata を所有する場合は、`catalog` を使用してください。

`catalog.order` は、Plugin の catalog が OpenClaw の組み込み implicit providers に対していつ merge されるかを制御します。

- `simple`: プレーンな API-key または env 駆動の providers
- `profile`: auth profiles が存在すると現れる providers
- `paired`: 関連する複数の provider entries を合成する providers
- `late`: 最後の pass、他の implicit providers の後

key collision では後の providers が優先されるため、Plugin は同じ provider id を持つ built-in provider entry を意図的に上書きできます。

互換性:

- `discovery` はレガシー alias として引き続き機能します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用チャンネル検査

Plugin がチャンネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` は runtime パスです。credentials が完全に materialize されていると想定でき、必要な secrets が欠けている場合に fast fail できます。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` などの読み取り専用 command paths、および doctor/config repair flows は、configuration を記述するだけのために runtime credentials を materialize する必要があってはなりません。

推奨される `inspectAccount(...)` 動作:

- 説明的な account state のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような credential source/status フィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用 availability を報告するだけなら、raw token values を返す必要はありません。status-style commands には、`tokenStatus: "available"`（および対応する source フィールド）を返せば十分です。
- credential が SecretRef で設定されているものの、現在の command path で利用できない場合は `configured_unavailable` を使用します。

これにより、読み取り専用コマンドはクラッシュしたり account を未設定として誤報告したりする代わりに、「この command path では設定済みだが利用不可」と報告できます。

## パッケージ packs

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

各エントリは Plugin になります。pack が複数の extensions を列挙している場合、Plugin id は
`name/<fileBase>` になります。

Plugin が npm deps をインポートする場合は、そのディレクトリにインストールして
`node_modules` が利用できるようにしてください（`npm install` / `pnpm install`）。

セキュリティ guardrail: すべての `openclaw.extensions` エントリは、symlink resolution 後も Plugin
ディレクトリ内に留まる必要があります。package ディレクトリの外へ抜けるエントリは拒否されます。

セキュリティノート: `openclaw plugins install` は、project-local な `npm install --omit=dev --ignore-scripts`（lifecycle scripts なし、runtime での dev dependencies なし）で Plugin dependencies をインストールし、継承された global npm install settings は無視します。
Plugin dependency trees は「pure JS/TS」に保ち、`postinstall` builds を必要とする packages は避けてください。

任意: `openclaw.setupEntry` は軽量な setup-only module を指すことができます。
OpenClaw が無効な Channel Plugin の setup surfaces を必要とする場合、または
Channel Plugin が有効だがまだ未設定の場合、full plugin entry ではなく `setupEntry` をロードします。これにより、main plugin entry が tools、hooks、またはその他の runtime-only
code も配線する場合に、startup と setup が軽くなります。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
は、チャンネルがすでに設定済みの場合でも、Gateway の
pre-listen startup phase 中に Channel Plugin を同じ `setupEntry` パスへ opt in できます。

これは、Gateway が listen を開始する前に存在する必要がある startup surface を `setupEntry` が完全にカバーする場合にのみ使用してください。実際には、setup entry は startup が依存するすべての channel-owned capability を登録する必要があるという意味です。たとえば:

- channel registration 自体
- Gateway が listen を開始する前に利用可能でなければならない HTTP ルート
- 同じ window 中に存在しなければならない gateway methods、tools、または services

full entry が必要な startup capability をまだ所有している場合は、この flag を有効にしないでください。Plugin はデフォルト動作のままにし、startup 中に OpenClaw が full entry をロードするようにしてください。

バンドル済みチャンネルは、full channel runtime がロードされる前に core が参照できる setup-only contract-surface helpers も公開できます。現在の setup
promotion surface は次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全な Plugin エントリを読み込まずに、レガシーの単一アカウントのチャネル設定を `channels.<id>.accounts.*` に昇格する必要があるときに、そのサーフェスを使用します。Matrix が現在のバンドル済みの例です。名前付きアカウントがすでに存在する場合は auth/bootstrap キーだけを名前付きの昇格アカウントへ移動し、常に `accounts.default` を作成する代わりに、設定済みの非正規デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターは、バンドル済みコントラクトサーフェスの探索を遅延のまま保ちます。インポート時の負荷は軽いままで、昇格サーフェスはモジュールインポート時にバンドル済みチャネル起動へ再入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスに配置してください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Plugin がより狭いスコープを要求した場合でも常に `operator.admin` に解決されます。

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

チャネル Plugin は `openclaw.channel` を通じてセットアップ/探索メタデータを、`openclaw.install` を通じてインストールヒントを公開できます。これにより、コアカタログはデータを持たずに済みます。

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

- `detailLabel`: より詳細なカタログ/ステータスサーフェス向けの副ラベル
- `docsLabel`: ドキュメントリンクのリンクテキストを上書き
- `preferOver`: このカタログエントリが優先すべき、優先度の低い Plugin/チャネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: 送信フォーマット判断のため、チャネルを Markdown 対応としてマーク
- `exposure.configured`: `false` に設定すると、設定済みチャネルの一覧サーフェスからチャネルを非表示
- `exposure.setup`: `false` に設定すると、対話式セットアップ/設定ピッカーからチャネルを非表示
- `exposure.docs`: ドキュメントナビゲーションサーフェス向けに、チャネルを内部/非公開としてマーク
- `showConfigured` / `showInSetup`: 互換性のため引き続き受け付けるレガシーエイリアス。`exposure` を推奨
- `quickstartAllowFrom`: チャネルを標準クイックスタートの `allowFrom` フローに参加させる
- `forceAccountBinding`: アカウントが 1 つだけの場合でも明示的なアカウントバインディングを要求
- `preferSessionLookupForAnnounceTarget`: 通知先を解決するときにセッション検索を優先

OpenClaw は **外部チャネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。JSON ファイルを次のいずれかに置いてください:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）を 1 つ以上の JSON ファイル（カンマ/セミコロン/`PATH` 区切り）に向けます。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは `"entries"` キーのレガシーエイリアスとして `"packages"` または `"plugins"` も受け付けます。

生成されたチャネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックの隣に、正規化されたインストールソース情報を公開します。正規化された情報は、npm 仕様が厳密なバージョンか浮動セレクターか、期待される整合性メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージの同一性が分かっている場合、正規化された情報は、解析された npm パッケージ名がその同一性からずれていると警告します。また、`defaultChoice` が無効な場合や利用できないソースを指している場合、有効な npm ソースなしに npm 整合性メタデータが存在する場合にも警告します。コンシューマーは `installSource` を追加的な任意フィールドとして扱い、手作りのエントリやカタログシムがそれを合成しなくてもよいようにする必要があります。これにより、オンボーディングと診断は Plugin ランタイムをインポートせずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、厳密な `npmSpec` と `expectedIntegrity` を優先してください。裸のパッケージ名と dist-tag も互換性のため引き続き機能しますが、ソースプレーンの警告を表示するため、既存の Plugin を壊さずに、カタログをピン留め済みで整合性確認済みのインストールへ移行できます。オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` とワークスペース相対の `sourcePath` を持つ管理対象 Plugin の Plugin インデックスエントリを記録します。絶対の運用ロードパスは `plugins.load.paths` に残ります。インストールレコードは、長期保存される設定へローカルワークステーションのパスを重複して入れることを避けます。これにより、ローカル開発インストールはソースプレーン診断から見えるまま、2 つ目の生のファイルシステムパス開示サーフェスを追加せずに済みます。永続化された `plugins/installs.json` Plugin インデックスはインストールソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが存在しないか無効な場合でも永続的です。その `plugins` 配列は再構築可能なマニフェストビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

Plugin が、メモリ検索やフックを追加するだけでなく、デフォルトのコンテキストパイプラインを置き換えるか拡張する必要がある場合に使用してください。

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

ファクトリ `ctx` は、構築時初期化用に任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

エンジンが Compaction アルゴリズムを所有して**いない**場合は、`compact()` を実装したまま、明示的に委譲してください:

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

## 新しい機能の追加

Plugin が現在の API に合わない動作を必要とする場合は、Plugin システムをプライベートな直接参照で迂回しないでください。不足している機能を追加してください。

推奨手順:

1. コアコントラクトを定義する
   ポリシー、フォールバック、設定マージ、ライフサイクル、チャネル向けセマンティクス、ランタイムヘルパー形状など、コアが所有すべき共有動作を決めます。
2. 型付きの Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` または `api.runtime`、あるいはその両方を、最小限で有用な型付き機能サーフェスで拡張します。
3. コアとチャネル/機能コンシューマーを接続する
   チャネルと機能 Plugin は、ベンダー実装を直接インポートするのではなく、コアを通じて新しい機能を消費する必要があります。
4. ベンダー実装を登録する
   ベンダー Plugin は、その機能に対してバックエンドを登録します。
5. コントラクトカバレッジを追加する
   所有権と登録形状が時間とともに明示的なまま保たれるようにテストを追加します。

これにより、OpenClaw は 1 つのプロバイダーの世界観にハードコードされることなく、意見を持った設計を保てます。具体的なファイルチェックリストと実例については、[機能 Cookbook](/ja-JP/plugins/architecture) を参照してください。

### 機能チェックリスト

新しい機能を追加する場合、通常はこれらのサーフェスをまとめて変更する必要があります:

- `src/<capability>/types.ts` のコアコントラクト型
- `src/<capability>/runtime.ts` のコアランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャネル Plugin がそれを消費する必要がある場合の、`src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ/テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権/コントラクトアサーション
- `docs/` のオペレーター/Plugin ドキュメント

これらのサーフェスのいずれかが欠けている場合、その機能がまだ完全には統合されていない兆候であることが多いです。

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

これによりルールはシンプルに保たれます:

- コアは機能コントラクトとオーケストレーションを所有する
- ベンダー Plugin はベンダー実装を所有する
- 機能/チャネル Plugin はランタイムヘルパーを消費する
- コントラクトテストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開機能モデルと形状
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
