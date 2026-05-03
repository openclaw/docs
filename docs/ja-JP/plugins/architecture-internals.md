---
read_when:
    - プロバイダーランタイムフック、チャンネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しい Plugin 機能またはコンテキストエンジン Plugin の追加
summary: 'Plugin アーキテクチャの内部構造: ロードパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照表'
title: Plugin アーキテクチャの内部
x-i18n:
    generated_at: "2026-05-03T21:36:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の形状、所有権/実行
コントラクトについては、[Pluginアーキテクチャ](/ja-JP/plugins/architecture) を参照してください。このページは
内部メカニクスのリファレンスです: ロードパイプライン、レジストリ、ランタイムフック、
Gateway HTTP ルート、インポートパス、スキーマ表。

## ロードパイプライン

起動時に、OpenClaw はおおよそ次の処理を行います。

1. 候補 Plugin ルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin 設定を正規化する (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 各候補の有効化を判断する
6. 有効化されたネイティブモジュールをロードする: ビルド済みの同梱モジュールはネイティブローダーを使い、
   サードパーティのローカルソース TypeScript は緊急用の Jiti フォールバックを使う
7. ネイティブの `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. コマンド/ランタイムサーフェスへレジストリを公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在する方 (`def.register ?? def.activate`) を解決し、同じ時点で呼び出します。すべての同梱 Plugin は `register` を使います。新しい Plugin では `register` を優先してください。
</Note>

安全性ゲートはランタイム実行の**前に**発生します。エントリが Plugin ルートから脱出する場合、パスが world-writable の場合、または非同梱 Plugin のパス所有権が疑わしい場合、
候補はブロックされます。

ブロックされた候補は、診断のためにその Plugin id と結び付いたままになります。設定が
まだその id を参照している場合、検証はその Plugin を存在するがブロック済みとして報告し、
設定エントリを古いものとして扱うのではなく、パス安全性警告へ戻るように示します。

### マニフェストファーストの動作

マニフェストはコントロールプレーンの信頼できる情報源です。OpenClaw はこれを使って次のことを行います。

- Plugin を識別する
- 宣言されたチャンネル/Skills/設定スキーマまたはバンドル capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル/プレースホルダーを補強する
- インストール/カタログメタデータを表示する
- Plugin ランタイムをロードせずに、低コストなアクティベーションとセットアップ記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

任意のマニフェスト `activation` と `setup` ブロックはコントロールプレーン上に留まります。
これらはアクティベーション計画とセットアップ検出のためのメタデータのみの記述子であり、
ランタイム登録、`register(...)`、または `setupEntry` を置き換えるものではありません。
最初のライブアクティベーション利用側は、より広いレジストリ具現化の前に Plugin ロードを絞り込むため、
マニフェストのコマンド、チャンネル、プロバイダーのヒントを使うようになりました。

- CLI ロードは、要求されたプライマリコマンドを所有する Plugin に絞り込む
- チャンネルセットアップ/Plugin 解決は、要求された
  チャンネル id を所有する Plugin に絞り込む
- 明示的なプロバイダーセットアップ/ランタイム解決は、要求された
  プロバイダー id を所有する Plugin に絞り込む
- Gateway 起動計画は、明示的な起動時インポートと起動時オプトアウトに `activation.onStartup` を使う。起動メタデータのない Plugin は、
  より狭いアクティベーショントリガーを通じてのみロードされる

広い `all` スコープを要求するリクエスト時ランタイムプリロードでも、設定、起動計画、設定済みチャンネル、スロット、自動有効化ルールから
明示的な有効 Plugin id セットを導出します。その導出セットが空の場合、OpenClaw は
検出可能なすべての Plugin へ広げるのではなく、空のランタイムレジストリをロードします。

アクティベーションプランナーは、既存の呼び出し元向けの id のみの API と、
新しい診断向けのプラン API の両方を公開します。プランエントリは Plugin が選択された理由を報告し、
明示的な `activation.*` プランナーヒントと、`providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools`、フックなどのマニフェスト所有権
フォールバックを分離します。この理由の分離が互換性境界です。
既存の Plugin メタデータは動作し続け、新しいコードはランタイムロードセマンティクスを変えずに
広いヒントやフォールバック動作を検出できます。

セットアップ検出は、`setup-api` にフォールバックしてセットアップ時ランタイムフックをまだ必要とする Plugin を扱う前に、
候補 Plugin を絞り込むため `setup.providers` や
`setup.cliBackends` などの記述子所有 id を優先するようになりました。プロバイダー
セットアップ一覧は、プロバイダーランタイムをロードせずに、マニフェスト `providerAuthChoices`、記述子由来のセットアップ
選択肢、インストールカタログメタデータを使います。明示的な
`setup.requiresRuntime: false` は記述子のみの打ち切りです。省略された
`requiresRuntime` は互換性のためにレガシーの setup-api フォールバックを維持します。検出された複数の
Plugin が同じ正規化済みセットアッププロバイダーまたは CLI
バックエンド id を主張する場合、セットアップ検索は検出順序に頼るのではなく、
曖昧な所有者を拒否します。セットアップランタイムが実行される場合、レジストリ診断は
`setup.providers` / `setup.cliBackends` と、setup-api によって登録されたプロバイダーまたは CLI
バックエンドのずれを、レガシー Plugin をブロックせずに報告します。

### Plugin キャッシュ境界

OpenClaw は、Plugin 検出結果や直接のマニフェストレジストリ
データを、実時間ウィンドウの背後にキャッシュしません。インストール、マニフェスト編集、ロードパス変更は、
次の明示的なメタデータ読み取りまたはスナップショット再構築で可視化される必要があります。
マニフェストファイルパーサーは、開かれたマニフェストパス、inode、サイズ、タイムスタンプをキーにした
境界付きファイルシグネチャキャッシュを保持できます。このキャッシュは変更されていないバイトの
再パースを避けるだけであり、検出、レジストリ、所有者、または
ポリシーの回答をキャッシュしてはなりません。

安全なメタデータ高速パスは、隠れたキャッシュではなく明示的なオブジェクト所有権です。
Gateway 起動ホットパスでは、現在の `PluginMetadataSnapshot`、
導出された `PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出し
チェーンに渡すべきです。設定検証、起動時自動有効化、Plugin ブートストラップ、プロバイダー
選択は、それらが現在の設定と
Plugin インベントリを表している間、そのオブジェクトを再利用できます。セットアップ検索は、特定のセットアップパスが
明示的なマニフェストレジストリを受け取らない限り、オンデマンドでマニフェストメタデータを再構築します。それは
隠れた検索キャッシュを追加するのではなく、コールドパスフォールバックとして維持してください。入力が
変わったら、スナップショットを変更したり履歴コピーを保持したりせず、再構築して置き換えてください。
アクティブな Plugin レジストリ上のビューと同梱チャンネルブートストラップヘルパーは、
現在のレジストリ/ルートから再計算すべきです。1 回の呼び出し内で作業を重複排除したり再入を防いだりするための
短命なマップは問題ありません。それらがプロセス
メタデータキャッシュになってはなりません。

Plugin ロードでは、永続キャッシュレイヤーはランタイムロードです。コードまたはインストール済みアーティファクトが実際にロードされる場合、次のような
ローダー状態を再利用できます。

- `PluginLoaderCacheState` と互換性のあるアクティブランタイムレジストリ
- 同じランタイムサーフェスを繰り返しインポートしないために使われる jiti/モジュールキャッシュと公開サーフェスローダーキャッシュ
- インストール済み Plugin アーティファクトのファイルシステムキャッシュ
- パス正規化や重複解決のための短命な呼び出しごとのマップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイムロードを要求した場合を除き、
「どの Plugin がこのプロバイダーを所有しているか」のようなコントロールプレーンの質問に答えてはなりません。

次のものに永続キャッシュや実時間キャッシュを追加しないでください。

- 検出結果
- 直接のマニフェストレジストリ
- インストール済み Plugin インデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者検索、モデル抑制、プロバイダーポリシー、または公開アーティファクト
  メタデータ
- 変更されたマニフェスト、インストール済みインデックス、
  またはロードパスが次のメタデータ読み取りで可視化されるべき、その他のマニフェスト由来の回答

永続化されたインストール済み Plugin
インデックスからマニフェストメタデータを再構築する呼び出し元は、そのレジストリをオンデマンドで再構築します。インストール済みインデックスは永続的な
ソースプレーン状態であり、隠れたインプロセスメタデータキャッシュではありません。

## レジストリモデル

ロードされた Plugin は、ランダムなコアグローバルを直接変更しません。中央の
Plugin レジストリへ登録します。

レジストリは次を追跡します。

- Plugin レコード (identity、source、origin、status、diagnostics)
- ツール
- レガシーフックと型付きフック
- チャンネル
- プロバイダー
- Gateway RPC ハンドラー
- HTTP ルート
- CLI レジストラー
- バックグラウンドサービス
- Plugin 所有コマンド

コア機能は、Plugin モジュールと直接やり取りするのではなく、そのレジストリから読み取ります。
これによりロードは一方向に保たれます。

- Plugin モジュール -> レジストリ登録
- コアランタイム -> レジストリ利用

この分離は保守性のために重要です。つまり、ほとんどのコアサーフェスは
「すべての Plugin モジュールを特別扱いする」ではなく、「レジストリを読む」という
1 つの統合点だけで済みます。

## 会話バインディングコールバック

会話をバインドする Plugin は、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)` を使うと、バインド
リクエストが承認または拒否された後にコールバックを受け取れます。

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
- `binding`: 承認されたリクエストの解決済みバインディング
- `request`: 元のリクエスト要約、デタッチヒント、送信者 id、会話メタデータ

このコールバックは通知のみです。会話のバインドを誰に許可するかは変更せず、
コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダー Plugin には 3 つのレイヤーがあります。

- 低コストなランタイム前検索のための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨互換性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、および `channelEnvVars`。
- **設定時フック**: `catalog` (レガシー `discovery`) と
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、
  ストリームラッピング、thinking レベル、リプレイポリシー、使用量エンドポイントを扱う 40 個超の任意フック。完全な一覧は
  [フック順序と使い方](#hook-order-and-usage) を参照してください。

OpenClaw は引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、
ツールポリシーを所有します。これらのフックは、プロバイダー固有の
動作のための拡張サーフェスであり、完全にカスタムの推論トランスポートを必要としません。

プロバイダーに env ベースの認証情報があり、Plugin ランタイムをロードせずに汎用の認証/ステータス/モデルピッカーのパスから見えるべき場合は、
マニフェスト `setup.providers[].envVars` を使ってください。非推奨の `providerAuthEnvVars` は
非推奨期間中、互換性アダプターによってまだ読み取られ、それを使う非同梱 Plugin は
マニフェスト診断を受け取ります。あるプロバイダー id が別のプロバイダー id の env vars、認証プロファイル、
設定ベース認証、API キーオンボーディング選択を再利用すべき場合は、マニフェスト `providerAuthAliases` を使ってください。オンボーディング/認証選択 CLI サーフェスが、
プロバイダーランタイムをロードせずに、プロバイダーの選択 id、グループラベル、単純な 1 フラグ認証配線を知るべき場合は、マニフェスト
`providerAuthChoices` を使ってください。プロバイダーランタイムの
`envVars` は、オンボーディングラベルや OAuth
client-id/client-secret セットアップ変数など、オペレーター向けヒント用に維持してください。

チャンネルに env 駆動の認証またはセットアップがあり、
チャンネルランタイムをロードせずに汎用 shell-env フォールバック、設定/ステータスチェック、またはセットアッププロンプトから見えるべき場合は、
マニフェスト `channelEnvVars` を使ってください。

### フック順序と使い方

モデル/プロバイダー Plugin について、OpenClaw はおおよそ次の順序でフックを呼び出します。
「使用するタイミング」列は簡易判断ガイドです。
OpenClaw がもう呼び出さない互換性のみのプロバイダーフィールド、たとえば
`ProviderPlugin.capabilities` や `suppressBuiltInModel` は、意図的に
ここには記載していません。

| #   | フック                              | 機能                                                                                                   | 使用するタイミング                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` に公開                                | プロバイダーがカタログまたはベース URL のデフォルトを所有している場合                                                                                                  |
| 2   | `applyConfigDefaults`             | 設定の実体化中に、プロバイダー所有のグローバル設定デフォルトを適用                                      | デフォルトが認証モード、環境、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                                                         |
| --  | _(組み込みモデル検索)_         | OpenClaw は先に通常のレジストリ/カタログ経路を試す                                                          | _(Plugin フックではない)_                                                                                                                         |
| 3   | `normalizeModelId`                | 検索前にレガシーまたはプレビューのモデル ID エイリアスを正規化                                                     | プロバイダーが正規モデル解決前のエイリアス整理を所有している場合                                                                                 |
| 4   | `normalizeTransport`              | 汎用モデル組み立て前に、プロバイダーファミリーの `api` / `baseUrl` を正規化                                      | プロバイダーが同じトランスポートファミリー内のカスタムプロバイダー ID 向けにトランスポート整理を所有している場合                                                          |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決前に `models.providers.<id>` を正規化                                           | プロバイダーに Plugin と同居すべき設定整理が必要な場合。バンドルされた Google ファミリーヘルパーも、対応する Google 設定エントリを補完する   |
| 6   | `applyNativeStreamingUsageCompat` | ネイティブのストリーミング使用量互換書き換えを設定プロバイダーに適用                                               | プロバイダーにエンドポイント駆動のネイティブストリーミング使用量メタデータ修正が必要な場合                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイム認証読み込み前に、設定プロバイダー向けの環境マーカー認証を解決                                       | プロバイダーがプロバイダー所有の環境マーカー API キー解決を持つ場合。`amazon-bedrock` には、ここに組み込みの AWS 環境マーカー解決もある                  |
| 8   | `resolveSyntheticAuth`            | プレーンテキストを永続化せず、ローカル/セルフホストまたは設定ベースの認証を表面化                                   | プロバイダーが合成/ローカル資格情報マーカーで動作できる場合                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ね合わせる。CLI/アプリ所有の資格情報では、デフォルトの `persistence` は `runtime-only` | プロバイダーがコピーしたリフレッシュトークンを永続化せずに外部認証資格情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存された合成プロファイルプレースホルダーを、環境/設定ベース認証の背後に下げる                                      | プロバイダーが、優先順位で勝つべきではない合成プレースホルダープロファイルを保存する場合                                                                 |
| 11  | `resolveDynamicModel`             | ローカルレジストリにまだないプロバイダー所有のモデル ID 向けの同期フォールバック                                       | プロバイダーが任意の上流モデル ID を受け入れる場合                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップ後、`resolveDynamicModel` が再実行される                                                           | プロバイダーが不明な ID を解決する前にネットワークメタデータを必要とする場合                                                                                  |
| 13  | `normalizeResolvedModel`          | 組み込みランナーが解決済みモデルを使用する直前の最終書き換え                                               | プロバイダーがトランスポート書き換えを必要とするが、引き続きコアトランスポートを使用する場合                                                                             |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデル向けの互換フラグを提供                                  | プロバイダーが、プロバイダーを引き継がずにプロキシトランスポート上の自分のモデルを認識する場合                                                       |
| 15  | `normalizeToolSchemas`            | 組み込みランナーが確認する前にツールスキーマを正規化                                                    | プロバイダーがトランスポートファミリーのスキーマ整理を必要とする場合                                                                                                |
| 16  | `inspectToolSchemas`              | 正規化後にプロバイダー所有のスキーマ診断を表面化                                                  | プロバイダーが、コアにプロバイダー固有ルールを教えずにキーワード警告を出したい場合                                                                 |
| 17  | `resolveReasoningOutputMode`      | ネイティブとタグ付きの推論出力契約を選択                                                              | プロバイダーがネイティブフィールドではなく、タグ付きの推論/最終出力を必要とする場合                                                                         |
| 18  | `prepareExtraParams`              | 汎用ストリームオプションラッパー前のリクエストパラメーター正規化                                              | プロバイダーがデフォルトリクエストパラメーターまたはプロバイダーごとのパラメーター整理を必要とする場合                                                                           |
| 19  | `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                                   | プロバイダーが単なるラッパーではなく、カスタムワイヤープロトコルを必要とする場合                                                                                     |
| 20  | `wrapStreamFn`                    | 汎用ラッパー適用後のストリームラッパー                                                              | プロバイダーがカスタムトランスポートなしで、リクエストヘッダー/本文/モデル互換ラッパーを必要とする場合                                                          |
| 21  | `resolveTransportTurnState`       | ネイティブのターン単位トランスポートヘッダーまたはメタデータを付加                                                           | プロバイダーが汎用トランスポートにプロバイダーネイティブのターン ID を送信させたい場合                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションのクールダウンポリシーを付加                                                    | プロバイダーが汎用 WS トランスポートのセッションヘッダーまたはフォールバックポリシーを調整したい場合                                                               |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                                     | プロバイダーが追加の認証メタデータを保存し、カスタムランタイムトークン形状を必要とする場合                                                                    |
| 24  | `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き                                  | プロバイダーが共有の `pi-ai` リフレッシャーに適合しない場合                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth リフレッシュ失敗時に追加される修復ヒント                                                                  | プロバイダーがリフレッシュ失敗後にプロバイダー所有の認証修復ガイダンスを必要とする場合                                                                      |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                                                 | プロバイダーが、汎用ヒューリスティックでは見逃す生のオーバーフローエラーを持つ場合                                                                                |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                  | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などにマッピングできる場合                                                                          |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                                               | プロバイダーがプロキシ固有のキャッシュ TTL ゲートを必要とする場合                                                                                                |
| 29  | `buildMissingAuthMessage`         | 汎用の認証欠落リカバリーメッセージの置き換え                                                      | プロバイダーがプロバイダー固有の認証欠落リカバリーヒントを必要とする場合                                                                                 |
| 30  | `augmentModelCatalog`             | 探索後に追加される合成/最終カタログ行                                                          | プロバイダーが `models list` とピッカーで合成の前方互換行を必要とする場合                                                                     |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                 | プロバイダーが選択したモデル向けにカスタム思考段階またはバイナリラベルを公開する場合                                                                 |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                     | プロバイダーがバイナリの思考オン/オフのみを公開する場合                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推論対応の互換フック                                                                   | プロバイダーが一部のモデルだけで `xhigh` を有効にしたい場合                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                      | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有する場合                                                                                      |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けの最新モデルマッチャー                                              | プロバイダーがライブ/スモークの優先モデルマッチングを所有する場合                                                                                             |
| 36  | `prepareRuntimeAuth`              | 推論直前に、設定済み資格情報を実際のランタイムトークン/キーに交換                       | プロバイダーがトークン交換または短命のリクエスト資格情報を必要とする場合                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` と関連するステータス表示の使用状況/請求認証情報を解決する                                     | プロバイダーにカスタムの使用状況/クォータトークン解析または別の使用状況認証情報が必要                                                               |
| 38  | `fetchUsageSnapshot`              | 認証情報の解決後に、プロバイダー固有の使用状況/クォータスナップショットを取得して正規化する                             | プロバイダーにプロバイダー固有の使用状況エンドポイントまたはペイロードパーサーが必要                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索用の、プロバイダーが所有する埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダー Plugin に属する                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにカスタムのトランスクリプトポリシー（たとえば思考ブロックの除去）が必要                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用のトランスクリプトクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーに共有 Compaction ヘルパーを超える、プロバイダー固有のリプレイ書き換えが必要                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に、最終的なリプレイターンの検証または整形を行う                                           | プロバイダーのトランスポートには、汎用サニタイズ後により厳密なターン検証が必要                                                                    |
| 43  | `onModelSelected`                 | プロバイダーが所有する選択後の副作用を実行する                                                                 | モデルがアクティブになったとき、プロバイダーにテレメトリーまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダー Plugin を確認し、その後、モデル ID または transport/config を実際に変更するものが見つかるまで、フック対応の他のプロバイダー Plugin にフォールスルーします。これにより、呼び出し元がどのバンドル Plugin がその書き換えを所有しているかを知る必要なく、alias/compat プロバイダー shim が動作し続けます。サポート対象の Google 系 config エントリを書き換えるプロバイダーフックがない場合でも、バンドルされた Google config normalizer がその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤープロトコルまたはカスタム request executor を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き動作するプロバイダー挙動のためのものです。

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

バンドルされたプロバイダー Plugin は、上記のフックを組み合わせて、各ベンダーの catalog、auth、thinking、replay、usage のニーズに合わせます。権威あるフックセットは `extensions/` 配下の各 Plugin にあります。このページでは、リストをそのまま反映するのではなく、形を示します。

<AccordionGroup>
  <Accordion title="パススルー catalog プロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録するため、OpenClaw の静的 catalog より先に upstream
    モデル ID を公開できます。
  </Accordion>
  <Accordion title="OAuth と usage endpoint プロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせ、token exchange と `/usage` integration を所有します。
  </Accordion>
  <Accordion title="Replay と transcript cleanup ファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、プロバイダーは各 Plugin が
    cleanup を再実装する代わりに、`buildReplayPolicy` を通じて transcript policy にオプトインできます。
  </Accordion>
  <Accordion title="Catalog のみのプロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine` は `catalog` だけを登録し、共有推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic 固有の stream helper">
    Beta headers、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく
    Anthropic Plugin の公開 `api.ts` / `contract-api.ts` の継ぎ目
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## Runtime helper

Plugin は `api.runtime` 経由で選択された core helper にアクセスできます。TTS の場合:

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
- core の `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファー + サンプルレートを返します。Plugin はプロバイダー向けに resample/encode する必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーまたはセットアップフローに使用します。
- 音声一覧には、プロバイダー認識ピッカー向けに locale、gender、personality tag などのより豊富な metadata を含められます。
- OpenAI と ElevenLabs は現在 telephony をサポートしています。Microsoft はサポートしていません。

Plugin は `api.registerSpeechProvider(...)` 経由で speech provider も登録できます。

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
- ベンダー所有の synthesis behavior には speech provider を使用します。
- 従来の Microsoft `edge` 入力は `microsoft` provider id に正規化されます。
- 推奨される所有モデルは企業指向です。OpenClaw がこれらの capability contract を追加するにつれ、1 つのベンダー Plugin が text、speech、image、将来の media provider を所有できます。

image/audio/video understanding では、Plugin は汎用 key/value bag ではなく、型付きの media-understanding provider を 1 つ登録します。

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
- ベンダー挙動はプロバイダー Plugin に保持します。
- 追加的な拡張は型付きのままにします。新しい任意メソッド、新しい任意結果フィールド、新しい任意 capability です。
- Video generation もすでに同じパターンに従っています:
  - core が capability contract と runtime helper を所有する
  - ベンダー Plugin が `api.registerVideoGenerationProvider(...)` を登録する
  - feature/channel Plugin が `api.runtime.videoGeneration.*` を使用する

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

音声 transcription では、Plugin は media-understanding runtime または古い STT alias のいずれかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` は image/audio/video understanding の推奨共有 surface です。
- core の media-understanding 音声設定（`tools.media.audio`）とプロバイダー fallback order を使用します。
- transcription output が生成されない場合（たとえば skipped/unsupported input）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性 alias として残ります。

Plugin は `api.runtime.subagent` を通じてバックグラウンド subagent run も起動できます。

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
- OpenClaw は trusted caller に対してのみ、それらの override field を尊重します。
- Plugin 所有の fallback run では、operator が `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、trusted Plugin を特定の canonical `provider/model` target に制限するか、任意の target を明示的に許可するには `"*"` を使用します。
- Untrusted Plugin の subagent run も動作しますが、override request は黙って fallback するのではなく拒否されます。
- Plugin が作成した subagent session には、作成元 Plugin ID がタグ付けされます。fallback `api.runtime.subagent.deleteSession(...)` はそれらの所有 session のみ削除できます。任意の session deletion には、引き続き admin scope の Gateway request が必要です。

web search では、Plugin は agent tool wiring に踏み込む代わりに、共有 runtime helper を使用できます。

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

Plugin は `api.registerWebSearchProvider(...)` 経由で web-search provider も登録できます。

注記:

- provider selection、credential resolution、shared request semantics は core に保持します。
- ベンダー固有の search transport には web-search provider を使用します。
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

- `generate(...)`: 設定された image-generation provider chain を使用して画像を生成します。
- `listProviders(...)`: 利用可能な image-generation provider とその capability を一覧表示します。

## Gateway HTTP route

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

route field:

- `path`: Gateway HTTP server 配下の route path。
- `auth`: 必須です。通常の gateway auth を要求するには `"gateway"` を、Plugin managed auth/webhook verification には `"plugin"` を使用します。
- `match`: 任意です。`"exact"`（default）または `"prefix"`。
- `replaceExisting`: 任意です。同じ Plugin が既存の route registration を置き換えられるようにします。
- `handler`: route が request を処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除され、Plugin 読み込みエラーを引き起こします。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートでは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` の場合を除いて拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルが異なる重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは、同じ認証レベルだけに保ってください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動的には受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストのランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です。
  - 共有シークレットの Bearer 認証（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートのランタイムスコープは `operator.write` に固定されます
  - 信頼済みの ID 付き HTTP モード（たとえば `trusted-proxy` や、プライベートイングレス上の `gateway.auth.mode = "none"`）では、ヘッダーが明示的に存在する場合にのみ `x-openclaw-scopes` が尊重されます
  - それらの ID 付き Plugin ルートリクエストで `x-openclaw-scopes` が存在しない場合、ランタイムスコープは `operator.write` にフォールバックします
- 実用上のルール: Gateway 認証付き Plugin ルートが暗黙の管理者サーフェスであると仮定しないでください。ルートが管理者専用の動作を必要とする場合は、ID 付き認証モードを必須にし、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK のインポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルート
バレルではなく、狭い SDK サブパスを使用してください。コアサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                           |
| `openclaw/plugin-sdk/channel-core`  | チャネルエントリ/ビルドヘルパー                  |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括的契約                     |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、狭いシーム群から選択します — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。承認の動作は、無関係な
Plugin フィールドをまたいで混在させるのではなく、1 つの `approvalCapability`
契約に統合する必要があります。[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムと設定ヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）にあります。広範な `config-runtime` 互換バレルではなく、
`config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`
を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換シムです。
新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（バンドル済み Plugin パッケージルートごと）:

- `index.js` — バンドル済み Plugin エントリ
- `api.js` — ヘルパー/型バレル
- `runtime-api.js` — ランタイム専用バレル
- `setup-entry.js` — セットアップ Plugin エントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスだけをインポートしてください。
コアや別の Plugin から、別の Plugin パッケージの `src/*` をインポートしてはいけません。
ファサード経由で読み込まれるエントリポイントは、存在する場合はアクティブなランタイム設定スナップショットを優先し、
その後ディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`, `media-understanding`, `speech` などの機能別サブパスは、
バンドル済み Plugin が現在それらを使用しているため存在します。これらは、
自動的に長期固定の外部契約になるわけではありません — 依存する場合は、関連する SDK
リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票など、メッセージ以外のプリミティブに対する
チャネル固有の `describeMessageTool(...)` スキーマ提供を所有する必要があります。
共有送信プレゼンテーションでは、プロバイダー固有のボタン、コンポーネント、ブロック、カードフィールドではなく、
汎用の `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作成者チェックリストについては、
[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ機能を通じてレンダリング可能な内容を宣言します。

- セマンティックなプレゼンテーションブロック（`text`, `context`, `divider`, `buttons`, `select`）には `presentation`
- ピン留め配信リクエストには `delivery-pin`

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに劣化させるかを決定します。
汎用メッセージツールからプロバイダー固有 UI の抜け道を公開しないでください。
レガシーなネイティブスキーマ向けの非推奨 SDK ヘルパーは既存の
サードパーティ Plugin のために引き続きエクスポートされていますが、新しい Plugin では使用しないでください。

## チャネルターゲット解決

チャネル Plugin は、チャネル固有のターゲットセマンティクスを所有する必要があります。
共有アウトバウンドホストは汎用に保ち、プロバイダールールにはメッセージングアダプターサーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化済みターゲットをディレクトリ検索の前に
  `direct`, `group`, `channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力がディレクトリ検索ではなく
  ID らしい解決へ直接進むべきかどうかをコアに伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後に
  コアが最終的なプロバイダー所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後のプロバイダー固有セッション
  ルート構築を所有します。

推奨される分担:

- ピア/グループ検索の前に行うべきカテゴリ判断には `inferTargetChatType` を使用します。
- 「これを明示的/ネイティブなターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- プロバイダー固有の正規化フォールバックには `resolveTarget` を使用し、広範なディレクトリ検索には使用しません。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダーネイティブ ID は、
  汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有パラメーター内に保ってください。

## 設定に裏付けられたディレクトリ

設定からディレクトリエントリを導出する Plugin は、そのロジックを
Plugin 内に保ち、`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用してください。

チャネルが次のような設定に裏付けられたピア/グループを必要とする場合に使用します。

- 許可リスト駆動の DM ピア
- 設定済みのチャネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを処理します。

- クエリフィルタリング
- 制限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査と ID 正規化は、
Plugin 実装内に残してください。

## プロバイダーカタログ

プロバイダー Plugin は、推論用のモデルカタログを
`registerProvider({ catalog: { run(...) { ... } } })` で定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します。

- 1 つのプロバイダーエントリには `{ provider }`
- 複数のプロバイダーエントリには `{ providers }`

Plugin がプロバイダー固有のモデル ID、ベース URL のデフォルト、または認証で保護されたモデルメタデータを所有している場合は、
`catalog` を使用してください。

`catalog.order` は、Plugin のカタログが OpenClaw の組み込み暗黙プロバイダーに対して
いつマージされるかを制御します。

- `simple`: プレーンな API キーまたは env 駆動のプロバイダー
- `profile`: 認証プロファイルが存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリを合成するプロバイダー
- `late`: 他の暗黙プロバイダーの後の最後のパス

後のプロバイダーはキー衝突時に優先されるため、Plugin は同じプロバイダー ID を持つ
組み込みプロバイダーエントリを意図的に上書きできます。

互換性:

- `discovery` はレガシーエイリアスとして引き続き機能します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用チャネル検査

Plugin がチャネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを優先してください。

理由:

- `resolveAccount(...)` はランタイムパスです。認証情報が完全に実体化されていると仮定でき、
  必要なシークレットがない場合は即座に失敗できます。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  修復フローなどの読み取り専用コマンドパスは、設定を説明するだけのために
  ランタイム認証情報を実体化する必要があってはなりません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような認証情報ソース/ステータスフィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可否を報告するだけなら、生のトークン値を返す必要はありません。
  `tokenStatus: "available"`（および対応する source フィールド）を返すだけで、
  ステータス系コマンドには十分です。
- 認証情報が SecretRef 経由で設定されているが、現在のコマンドパスで利用できない場合は
  `configured_unavailable` を使用してください。

これにより、読み取り専用コマンドはクラッシュしたりアカウントを未設定と誤報したりする代わりに、
「設定済みだがこのコマンドパスでは利用不可」と報告できます。

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

各エントリは Plugin になります。パックが複数の extensions を列挙している場合、Plugin ID は
`name/<fileBase>` になります。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリにインストールして
`node_modules` が利用できるようにしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、シンボリックリンク解決後も Plugin
ディレクトリ内に留まる必要があります。パッケージディレクトリ外へ抜けるエントリは
拒否されます。

セキュリティ注記: `openclaw plugins install` は、プロジェクトローカルの
`npm install --omit=dev --ignore-scripts` で Plugin 依存関係をインストールします（ライフサイクルスクリプトなし、
実行時の開発依存関係なし）。継承されたグローバル npm インストール設定は無視されます。
Plugin 依存関係ツリーは「純粋な JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は、軽量なセットアップ専用モジュールを指すことができます。
OpenClaw が無効化されたチャネル Plugin のセットアップサーフェスを必要とする場合、または
チャネル Plugin が有効でもまだ未設定の場合は、完全な Plugin エントリではなく `setupEntry`
を読み込みます。これにより、メインの Plugin エントリがツール、フック、その他のランタイム専用
コードも接続する場合に、起動とセットアップを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
は、チャネルがすでに設定済みであっても、Gateway のリッスン前起動フェーズ中に
チャネル Plugin を同じ `setupEntry` パスにオプトインできます。

これは、Gateway がリッスンを開始する前に存在しなければならない起動サーフェスを
`setupEntry` が完全にカバーする場合にのみ使用してください。実際には、セットアップエントリは
起動が依存するチャネル所有のすべての機能を登録する必要があります。たとえば:

- チャネル登録自体
- Gateway がリッスンを開始する前に利用可能でなければならない HTTP ルート
- 同じ時間枠内に存在しなければならない Gateway メソッド、ツール、サービス

完全なエントリが必要な起動機能をまだ所有している場合は、このフラグを有効にしないでください。
Plugin はデフォルトの動作のままにし、OpenClaw が起動中に完全なエントリを読み込むようにしてください。

バンドル済みチャネルは、完全なチャネルランタイムが読み込まれる前にコアが参照できる
セットアップ専用の契約サーフェスヘルパーも公開できます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core は、完全な Plugin エントリを読み込まずに、レガシーの単一アカウントチャンネル設定を `channels.<id>.accounts.*` へ昇格する必要があるときに、そのサーフェスを使用します。
Matrix が現在のバンドル済みの例です。名前付きアカウントがすでに存在する場合、認証/ブートストラップキーだけを名前付きの昇格先アカウントへ移動し、常に `accounts.default` を作成する代わりに、設定済みの非正規なデフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターは、バンドル済みの契約サーフェス検出を遅延したままにします。インポート時の負荷は軽いままです。昇格サーフェスは、モジュールインポート時にバンドル済みチャンネルの起動へ再入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックス上に維持してください。Core 管理者名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Plugin がより狭いスコープを要求しても、常に `operator.admin` に解決されます。

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

チャンネルPlugin は、`openclaw.channel` を介してセットアップ/検出メタデータを、`openclaw.install` を介してインストールヒントを公開できます。これにより、Core カタログにデータを持たせずに済みます。

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

- `detailLabel`: より豊かなカタログ/ステータスサーフェス向けの副ラベル
- `docsLabel`: ドキュメントリンクのリンクテキストを上書きする
- `preferOver`: このカタログエントリが優先すべき、優先度の低い Plugin/チャンネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: アウトバウンド整形判断のために、チャンネルを Markdown 対応としてマークする
- `exposure.configured`: `false` に設定すると、設定済みチャンネル一覧サーフェスからチャンネルを非表示にする
- `exposure.setup`: `false` に設定すると、対話型のセットアップ/設定ピッカーからチャンネルを非表示にする
- `exposure.docs`: ドキュメントナビゲーションサーフェス向けに、チャンネルを内部/非公開としてマークする
- `showConfigured` / `showInSetup`: 互換性のために現在も受け付けられるレガシーエイリアス。`exposure` を推奨
- `quickstartAllowFrom`: チャンネルを標準クイックスタート `allowFrom` フローに参加させる
- `forceAccountBinding`: アカウントが 1 つだけ存在する場合でも、明示的なアカウントバインディングを必須にする
- `preferSessionLookupForAnnounceTarget`: アナウンス先を解決するときにセッション検索を優先する

OpenClaw は **外部チャンネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを配置します:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）に 1 つ以上の JSON ファイルを指定します（カンマ/セミコロン/`PATH` 区切り）。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは、`"entries"` キーのレガシーエイリアスとして `"packages"` または `"plugins"` も受け付けます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックの隣に、正規化されたインストールソース情報を公開します。正規化された情報は、npm spec が厳密なバージョンか浮動セレクターか、期待される整合性メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージ ID が既知の場合、正規化された情報は、解析された npm パッケージ名がその ID からずれていると警告します。また、`defaultChoice` が無効な場合や利用できないソースを指している場合、さらに有効な npm ソースなしに npm 整合性メタデータが存在する場合にも警告します。コンシューマーは、手作りエントリやカタログシムがそれを合成しなくて済むように、`installSource` を追加的な任意フィールドとして扱うべきです。
これにより、オンボーディングと診断は、Plugin ランタイムをインポートせずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、厳密な `npmSpec` と `expectedIntegrity` を優先すべきです。裸のパッケージ名や dist-tag も互換性のために引き続き機能しますが、ソースプレーン警告を表示するため、既存の Plugin を壊さずに、カタログを固定済みで整合性チェック済みのインストールへ移行できます。
オンボーディングがローカルカタログパスからインストールする場合、`source: "path"` と、可能であればワークスペース相対の `sourcePath` を持つ管理対象 Plugin の Plugin インデックスエントリを記録します。絶対的な運用ロードパスは `plugins.load.paths` に残ります。インストールレコードは、ローカルワークステーションのパスを長期設定へ重複して書き込むことを避けます。これにより、ソースプレーン診断からローカル開発インストールを確認できる一方で、生のファイルシステムパスを開示する 2 つ目のサーフェスを追加せずに済みます。永続化される `plugins/installs.json` Plugin インデックスがインストールソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが存在しない場合や無効な場合でも永続的です。その `plugins` 配列は、再構築可能なマニフェストビューです。

## コンテキストエンジンPlugin

コンテキストエンジンPlugin は、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

単にメモリ検索やフックを追加するだけでなく、デフォルトのコンテキストパイプラインを置き換える、または拡張する必要がある場合に使用します。

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

ファクトリ `ctx` は、構築時の初期化向けに任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

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

Plugin が現在の API に合わない挙動を必要とする場合は、Plugin システムを迂回して非公開の内部参照を使わないでください。不足しているケイパビリティを追加します。

推奨される順序:

1. Core 契約を定義する
   Core が所有すべき共有挙動を決めます: ポリシー、フォールバック、設定マージ、ライフサイクル、チャンネル向けセマンティクス、ランタイムヘルパーの形。
2. 型付きの Plugin 登録/ランタイムサーフェスを追加する
   最小限で有用な型付きケイパビリティサーフェスで `OpenClawPluginApi` および/または `api.runtime` を拡張します。
3. Core とチャンネル/機能コンシューマーを接続する
   チャンネルと機能Plugin は、ベンダー実装を直接インポートするのではなく、Core を通じて新しいケイパビリティを使用すべきです。
4. ベンダー実装を登録する
   次に、ベンダーPlugin がそのケイパビリティに対してバックエンドを登録します。
5. 契約カバレッジを追加する
   所有権と登録の形が時間が経っても明示的なままであるようにテストを追加します。

これにより、OpenClaw は 1 つのプロバイダーの世界観にハードコードされることなく、意見を持った状態を保てます。具体的なファイルチェックリストと実例については、[ケイパビリティクックブック](/ja-JP/plugins/architecture) を参照してください。

### ケイパビリティチェックリスト

新しいケイパビリティを追加するとき、実装では通常、これらのサーフェスをまとめて扱う必要があります:

- `src/<capability>/types.ts` の Core 契約型
- `src/<capability>/runtime.ts` の Core ランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャンネルPlugin がそれを使用する必要がある場合の `src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ/テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` のオペレーター/Plugin ドキュメント

これらのサーフェスのいずれかが欠けている場合、通常はそのケイパビリティがまだ完全に統合されていない兆候です。

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

これにより、ルールは単純に保たれます:

- Core はケイパビリティ契約とオーケストレーションを所有する
- ベンダーPlugin はベンダー実装を所有する
- 機能/チャンネルPlugin はランタイムヘルパーを使用する
- 契約テストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開ケイパビリティモデルと形
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
