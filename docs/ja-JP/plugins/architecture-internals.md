---
read_when:
    - プロバイダーのランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順またはレジストリ状態のデバッグ
    - 新しいPlugin機能またはコンテキストエンジンPluginの追加
summary: 'Plugin アーキテクチャ内部: 読み込みパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照表'
title: Plugin アーキテクチャの内部
x-i18n:
    generated_at: "2026-05-10T19:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の形状、所有権/実行
契約については、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページは
内部メカニクスのリファレンスです: ロードパイプライン、レジストリ、ランタイムフック、
Gateway HTTP ルート、インポートパス、スキーマテーブル。

## ロードパイプライン

起動時、OpenClaw はおおよそ次の処理を行います:

1. 候補 Plugin ルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin 設定を正規化する（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 各候補の有効化を決定する
6. 有効なネイティブモジュールをロードする: ビルド済みバンドルモジュールはネイティブローダーを使用し、
   サードパーティのローカルソース TypeScript は緊急用の Jiti フォールバックを使用する
7. ネイティブ `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. レジストリをコマンド/ランタイムサーフェスに公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在するほう（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべてのバンドル Plugin は `register` を使用します。新しい Plugin では `register` を優先してください。
</Note>

安全性ゲートはランタイム実行の**前に**発生します。エントリが Plugin ルートを抜ける場合、パスが world-writable の場合、または
非バンドル Plugin でパスの所有権が不審に見える場合、候補はブロックされます。

ブロックされた候補は、診断のためにその Plugin id に紐付けられたままになります。設定が
引き続きその id を参照している場合、検証はその Plugin を存在するがブロック済みとして報告し、
設定エントリを古いものとして扱うのではなく、パス安全性の警告を指し示します。

### マニフェスト優先の挙動

マニフェストは制御プレーンの信頼できる情報源です。OpenClaw はこれを使用して次を行います:

- Plugin を識別する
- 宣言済みのチャンネル/Skills/設定スキーマ、またはバンドル capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル/プレースホルダーを補強する
- インストール/カタログメタデータを表示する
- Plugin ランタイムをロードせずに、低コストな有効化およびセットアップ記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーン部分です。これは
フック、ツール、コマンド、プロバイダーフローなどの実際の挙動を登録します。

任意のマニフェスト `activation` ブロックと `setup` ブロックは制御プレーンに留まります。
これらは有効化計画とセットアップ検出のためのメタデータ専用記述子であり、
ランタイム登録、`register(...)`、または `setupEntry` を置き換えるものではありません。
最初のライブ有効化コンシューマーは、より広範なレジストリ実体化の前に Plugin ロードを絞り込むため、マニフェストのコマンド、チャンネル、プロバイダーのヒントを使用するようになっています:

- CLI ロードは、要求されたプライマリコマンドを所有する Plugin に絞り込む
- チャンネルセットアップ/Plugin 解決は、要求された
  チャンネル id を所有する Plugin に絞り込む
- 明示的なプロバイダーセットアップ/ランタイム解決は、要求された
  プロバイダー id を所有する Plugin に絞り込む
- Gateway 起動計画は、明示的な起動時インポートと起動時オプトアウトに `activation.onStartup` を使用する。
  起動メタデータのない Plugin は、より狭い有効化トリガーを通じてのみロードされる

広範な `all` スコープを要求するリクエスト時ランタイムプリロードも、設定、起動計画、設定済み
チャンネル、スロット、自動有効化ルールから、明示的な有効 Plugin id セットを導出します。その導出セットが空の場合、OpenClaw は検出可能なすべての
Plugin に広げるのではなく、空のランタイムレジストリをロードします。

有効化プランナーは、既存の呼び出し元向けの ids-only API と、
新しい診断向けの plan API の両方を公開します。プランエントリは Plugin が選択された理由を報告し、
明示的な `activation.*` プランナーヒントを、`providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools`、フックなどのマニフェスト所有権フォールバックから分離します。この理由の分割が互換性境界です:
既存の Plugin メタデータは動作し続け、新しいコードはランタイムロードのセマンティクスを変更せずに
広範なヒントやフォールバック挙動を検出できます。

セットアップ検出は、`setup-api` にフォールバックする前に、候補 Plugin を絞り込むため
`setup.providers` や `setup.cliBackends` のような記述子所有の id を優先するようになりました。
これは、依然としてセットアップ時ランタイムフックを必要とする Plugin のためのフォールバックです。プロバイダー
セットアップリストは、プロバイダーランタイムをロードせずに、マニフェスト `providerAuthChoices`、記述子由来のセットアップ
選択肢、インストールカタログメタデータを使用します。明示的な
`setup.requiresRuntime: false` は記述子専用の打ち切りです。省略された
`requiresRuntime` は互換性のためにレガシーの setup-api フォールバックを維持します。複数の
検出済み Plugin が同じ正規化済みセットアッププロバイダーまたは CLI
バックエンド id を主張する場合、セットアップ lookup は検出順序に依存せず、曖昧な所有者を拒否します。
セットアップランタイムが実行される場合、レジストリ診断は
`setup.providers` / `setup.cliBackends` と setup-api によって登録されたプロバイダーまたは CLI
バックエンドとのずれを、レガシー Plugin をブロックせずに報告します。

### Plugin キャッシュ境界

OpenClaw は、Plugin 検出結果や直接のマニフェストレジストリ
データを、実時間ウィンドウの背後にキャッシュしません。インストール、マニフェスト編集、ロードパス変更は、
次の明示的なメタデータ読み取りまたはスナップショット再構築で見える必要があります。
マニフェストファイルパーサーは、開かれたマニフェストパス、inode、サイズ、タイムスタンプをキーとする
制限付きファイルシグネチャキャッシュを保持する場合があります。そのキャッシュは変更されていないバイトの
再パースを避けるだけで、検出、レジストリ、所有者、ポリシーの回答をキャッシュしてはなりません。

安全なメタデータ高速パスは、隠れたキャッシュではなく明示的なオブジェクト所有権です。
Gateway 起動のホットパスは、現在の `PluginMetadataSnapshot`、
導出された `PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出しチェーンに渡すべきです。
設定検証、起動時自動有効化、Plugin ブートストラップ、プロバイダー選択は、
これらのオブジェクトが現在の設定と Plugin インベントリを表している間、それらを再利用できます。
セットアップ lookup は、その特定のセットアップパスが明示的なマニフェストレジストリを受け取らない限り、
必要に応じてマニフェストメタデータを再構築します。それは隠れた lookup キャッシュを追加するのではなく、
コールドパスのフォールバックとして維持してください。入力が変わったら、スナップショットを変更したり
履歴コピーを保持したりせず、再構築して置き換えます。
アクティブな Plugin レジストリ上のビューとバンドルチャンネルのブートストラップヘルパーは、
現在のレジストリ/ルートから再計算するべきです。作業の重複排除や再入防止のために
1 回の呼び出し内で短命の map を使うのは問題ありませんが、それらがプロセスメタデータキャッシュになってはなりません。

Plugin ロードでは、永続キャッシュ層はランタイムロードです。コードまたはインストール済みアーティファクトが
実際にロードされるとき、次のようなローダー状態を再利用できます:

- `PluginLoaderCacheState` と互換性のあるアクティブランタイムレジストリ
- 同じランタイムサーフェスを繰り返しインポートしないために使われる jiti/モジュールキャッシュと公開サーフェスローダーキャッシュ
- インストール済み Plugin アーティファクト用のファイルシステムキャッシュ
- パス正規化または重複解決用の短命な呼び出し単位 map

これらのキャッシュはデータプレーン実装の詳細です。呼び出し元が意図的にランタイムロードを要求していない限り、
「このプロバイダーを所有する Plugin はどれか」のような制御プレーンの問いに答えてはなりません。

次のものに永続キャッシュや実時間キャッシュを追加しないでください:

- 検出結果
- 直接のマニフェストレジストリ
- インストール済み Plugin インデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者 lookup、モデル抑制、プロバイダーポリシー、公開アーティファクト
  メタデータ
- 変更されたマニフェスト、インストール済みインデックス、
  またはロードパスが次のメタデータ読み取りで見えるべき、その他すべてのマニフェスト由来の回答

永続化されたインストール済み Plugin
インデックスからマニフェストメタデータを再構築する呼び出し元は、必要に応じてそのレジストリを再構築します。インストール済みインデックスは耐久的な
ソースプレーン状態であり、隠れたインプロセスメタデータキャッシュではありません。

## レジストリモデル

ロードされた Plugin は、ランダムな core グローバルを直接変更しません。中央の
Plugin レジストリに登録します。

レジストリは次を追跡します:

- Plugin レコード（identity、source、origin、status、diagnostics）
- ツール
- レガシーフックと型付きフック
- チャンネル
- プロバイダー
- Gateway RPC ハンドラー
- HTTP ルート
- CLI レジストラー
- バックグラウンドサービス
- Plugin 所有のコマンド

その後、core 機能は Plugin モジュールと直接話すのではなく、そのレジストリから読み取ります。
これにより、ロードは一方向に保たれます:

- Plugin モジュール -> レジストリ登録
- core ランタイム -> レジストリ消費

この分離は保守性にとって重要です。つまり、ほとんどの core サーフェスに必要な統合ポイントは
「レジストリを読む」1 つだけであり、「すべての Plugin モジュールを特別扱いする」必要はありません。

## 会話バインディングコールバック

会話をバインドする Plugin は、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)` を使用すると、バインド
リクエストが承認または拒否された後にコールバックを受け取れます:

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

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認済みリクエストの解決済みバインディング
- `request`: 元のリクエスト概要、detach ヒント、送信者 id、
  会話メタデータ

このコールバックは通知専用です。会話をバインドできる主体を変更するものではなく、
core の承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダー Plugin には 3 つの層があります:

- 低コストなプリランタイム lookup のための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨の互換性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **設定時フック**: `catalog`（レガシー `discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**: auth、モデル解決、
  ストリームラッピング、thinking レベル、replay ポリシー、使用量エンドポイントをカバーする 40 個以上の任意フック。完全な一覧は
  [フックの順序と使用法](#hook-order-and-usage)を参照してください。

OpenClaw は引き続き、汎用エージェントループ、failover、トランスクリプト処理、
ツールポリシーを所有します。これらのフックは、プロバイダー固有の
挙動を、完全なカスタム推論トランスポートを必要とせずに拡張するためのサーフェスです。

プロバイダーに env ベースの認証情報があり、汎用 auth/status/model-picker パスが
Plugin ランタイムをロードせずにそれを見るべき場合は、マニフェスト `setup.providers[].envVars` を使用してください。
非推奨の `providerAuthEnvVars` は、非推奨期間中、互換性アダプターによって引き続き読み取られます。
これを使用する非バンドル Plugin はマニフェスト診断を受け取ります。1 つの
プロバイダー id が別のプロバイダー id の env vars、auth profiles、
設定ベース auth、API-key オンボーディング選択を再利用するべき場合は、マニフェスト `providerAuthAliases` を使用してください。
オンボーディング/auth-choice CLI サーフェスが、プロバイダーランタイムをロードせずに、
プロバイダーの choice id、グループラベル、シンプルな 1 フラグ auth wiring を知るべき場合は、
マニフェスト `providerAuthChoices` を使用してください。プロバイダーランタイムの
`envVars` は、オンボーディングラベルや OAuth
client-id/client-secret セットアップ変数など、オペレーター向けヒントのために残してください。

チャンネルに env 駆動の auth またはセットアップがあり、汎用 shell-env フォールバック、
設定/status チェック、またはセットアッププロンプトがチャンネルランタイムをロードせずにそれを見るべき場合は、
マニフェスト `channelEnvVars` を使用してください。

### フックの順序と使用法

モデル/プロバイダー Plugin の場合、OpenClaw はおおよそ次の順序でフックを呼び出します。
「使用する場面」列は簡易判断ガイドです。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在呼び出さない
互換性専用のプロバイダーフィールドは、意図的にここには記載していません。

| #   | Hook                              | 何をするか                                                                                                   | 使用する場面                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時にプロバイダー設定を `models.providers` へ公開する                                | プロバイダーがカタログまたはベース URL のデフォルトを所有している                                                                                                  |
| 2   | `applyConfigDefaults`             | 設定の実体化時に、プロバイダー所有のグローバル設定デフォルトを適用する                                      | デフォルトが認証モード、env、またはプロバイダーのモデルファミリーのセマンティクスに依存する                                                                         |
| --  | _(組み込みモデル検索)_         | OpenClaw は通常のレジストリ/カタログ経路を最初に試す                                                          | _(Plugin フックではない)_                                                                                                                         |
| 3   | `normalizeModelId`                | 検索前にレガシーまたはプレビューのモデル ID エイリアスを正規化する                                                     | プロバイダーが正規モデル解決前のエイリアス整理を所有している                                                                                 |
| 4   | `normalizeTransport`              | 汎用モデル組み立て前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                                      | 同じトランスポートファミリー内のカスタムプロバイダー ID について、プロバイダーがトランスポート整理を所有している                                                          |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決前に `models.providers.<id>` を正規化する                                           | プロバイダーに、Plugin 側に置くべき設定整理が必要である。バンドルされた Google ファミリーヘルパーも、サポート対象の Google 設定エントリを補完する   |
| 6   | `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブのストリーミング使用量互換書き換えを適用する                                               | プロバイダーに、エンドポイント駆動のネイティブストリーミング使用量メタデータ修正が必要である                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイム認証読み込み前に、設定プロバイダー向けの env マーカー認証を解決する                                       | プロバイダーがプロバイダー所有の env マーカー API キー解決を持つ。`amazon-bedrock` もここに組み込み AWS env マーカーリゾルバーを持つ                  |
| 8   | `resolveSyntheticAuth`            | プレーンテキストを永続化せずに、ローカル/セルフホストまたは設定ベースの認証を表面化する                                   | プロバイダーが合成/ローカル認証情報マーカーで動作できる                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/アプリ所有の認証情報では、デフォルトの `persistence` は `runtime-only` | プロバイダーが、コピーされたリフレッシュトークンを永続化せずに外部認証情報を再利用する。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを、env/設定ベースの認証より低い優先度に下げる                                      | プロバイダーが、優先順位で勝つべきでない合成プレースホルダープロファイルを保存する                                                                 |
| 11  | `resolveDynamicModel`             | ローカルレジストリにまだないプロバイダー所有モデル ID の同期フォールバック                                       | プロバイダーが任意の上流モデル ID を受け付ける                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップ後に `resolveDynamicModel` が再実行される                                                           | 不明な ID を解決する前に、プロバイダーにネットワークメタデータが必要である                                                                                  |
| 13  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使用する前の最終書き換え                                               | プロバイダーにトランスポート書き換えが必要だが、引き続きコアトランスポートを使用する                                                                             |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポート背後のベンダーモデルに互換フラグを提供する                                  | プロバイダーを引き継がずに、プロバイダーがプロキシトランスポート上の自前モデルを認識する                                                       |
| 15  | `normalizeToolSchemas`            | 埋め込みランナーが見る前にツールスキーマを正規化する                                                    | プロバイダーにトランスポートファミリーのスキーマ整理が必要である                                                                                                |
| 16  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を表面化する                                                  | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい                                                                 |
| 17  | `resolveReasoningOutputMode`      | ネイティブとタグ付き推論出力契約のどちらかを選択する                                                              | プロバイダーに、ネイティブフィールドではなくタグ付き推論/最終出力が必要である                                                                         |
| 18  | `prepareExtraParams`              | 汎用ストリームオプションラッパーの前にリクエストパラメータを正規化する                                              | プロバイダーに、デフォルトのリクエストパラメータまたはプロバイダーごとのパラメータ整理が必要である                                                                           |
| 19  | `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                                   | プロバイダーに、単なるラッパーではなくカスタムワイヤプロトコルが必要である                                                                                     |
| 20  | `wrapStreamFn`                    | 汎用ラッパーの適用後のストリームラッパー                                                              | プロバイダーに、カスタムトランスポートなしでリクエストヘッダー/本文/モデル互換ラッパーが必要である                                                          |
| 21  | `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたはメタデータを付加する                                                           | プロバイダーが、汎用トランスポートにプロバイダーネイティブのターン識別情報を送らせたい                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションのクールダウンポリシーを付加する                                                    | プロバイダーが、汎用 WS トランスポートのセッションヘッダーまたはフォールバックポリシーを調整したい                                                               |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイム `apiKey` 文字列になる                                     | プロバイダーが追加の認証メタデータを保存し、カスタムのランタイムトークン形状を必要とする                                                                    |
| 24  | `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き                                  | プロバイダーが共有の `pi-ai` リフレッシャーに適合しない                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth リフレッシュ失敗時に追加される修復ヒント                                                                  | プロバイダーに、リフレッシュ失敗後のプロバイダー所有の認証修復ガイダンスが必要である                                                                      |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                                                 | プロバイダーに、汎用ヒューリスティックでは見逃す生のオーバーフローエラーがある                                                                                |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                  | プロバイダーが、生の API/トランスポートエラーをレート制限/過負荷などに対応付けられる                                                                          |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                                               | プロバイダーに、プロキシ固有のキャッシュ TTL ゲートが必要である                                                                                                |
| 29  | `buildMissingAuthMessage`         | 汎用の認証不足リカバリーメッセージの置き換え                                                      | プロバイダーに、プロバイダー固有の認証不足リカバリーヒントが必要である                                                                                 |
| 30  | `augmentModelCatalog`             | 探索後に追加される合成/最終カタログ行                                                          | プロバイダーに、`models list` とピッカー内の合成フォワード互換行が必要である                                                                     |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                 | プロバイダーが、選択されたモデル向けにカスタム思考段階または二値ラベルを公開する                                                                 |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                     | プロバイダーが二値の思考オン/オフのみを公開する                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推論サポート互換フック                                                                   | プロバイダーがモデルの一部でのみ `xhigh` を有効にしたい                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                      | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有している                                                                                      |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                              | プロバイダーがライブ/スモークの優先モデルマッチングを所有している                                                                                             |
| 36  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムトークン/キーへ交換する                       | プロバイダーに、トークン交換または短命のリクエスト認証情報が必要である                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` と関連するステータスサーフェス用の使用量/請求認証情報を解決する                                     | プロバイダーがカスタムの使用量/クォータトークン解析、または別の使用量認証情報を必要とする                                                               |
| 38  | `fetchUsageSnapshot`              | 認証が解決された後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーがプロバイダー固有の使用量エンドポイント、またはペイロードパーサーを必要とする                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索用のプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダーPluginに属する                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーがカスタムのトランスクリプトポリシーを必要とする（例: thinkingブロックの除去）                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用トランスクリプトクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーが共有のCompactionヘルパーを超えた、プロバイダー固有のリプレイ書き換えを必要とする                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に、最終的なリプレイターン検証または再整形を行う                                           | プロバイダートランスポートが汎用サニタイズ後に、より厳密なターン検証を必要とする                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったときに、プロバイダーがテレメトリまたはプロバイダー所有の状態を必要とする                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダー Plugin を確認し、その後、モデル ID または transport/config を実際に変更するものが見つかるまで、他のフック対応プロバイダー Plugin にフォールスルーします。これにより、呼び出し元がどのバンドル Plugin が書き換えを所有しているかを知る必要なく、alias/compat プロバイダー shim が機能し続けます。サポートされている Google 系 config エントリをプロバイダーフックが書き換えない場合でも、バンドルされた Google config normalizer がその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤプロトコルやカスタムリクエスト executor を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の inference loop 上で引き続き実行されるプロバイダー動作のためのものです。

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

バンドルされたプロバイダー Plugin は、上記のフックを組み合わせて、各ベンダーの catalog、auth、thinking、replay、usage の要件に適合させます。権威あるフックセットは `extensions/` 配下の各 Plugin にあります。このページはリストを反映するのではなく、形を示すものです。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的 catalog より先に upstream のモデル ID を公開できるようにします。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は
    `prepareRuntimeAuth` または `formatApiKey` と `resolveUsageAuth` +
    `fetchUsageSnapshot` を組み合わせ、token exchange と `/usage` 連携を所有します。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    共有の名前付き family（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各 Plugin がクリーンアップを再実装する代わりに、プロバイダーは `buildReplayPolicy` 経由で transcript policy に opt in できます。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` は
    `catalog` だけを登録し、共有 inference loop を利用します。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく、Anthropic Plugin の公開 `api.ts` / `contract-api.ts` の seam
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Plugin は、`api.runtime` 経由で選択された core ヘルパーにアクセスできます。TTS の場合:

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

注意:

- `textToSpeech` は、file/voice-note surface 向けの通常の core TTS 出力 payload を返します。
- core の `messages.tts` 設定とプロバイダー選択を使用します。
- PCM audio buffer + sample rate を返します。Plugin はプロバイダー向けに resample/encode する必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の voice picker や setup flow に使用します。
- voice listing には、provider-aware picker 向けの locale、gender、personality tags など、より豊富な metadata を含められます。
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

注意:

- TTS policy、fallback、reply delivery は core に保持します。
- ベンダー所有の synthesis behavior には speech provider を使用します。
- legacy Microsoft `edge` input は `microsoft` provider ID に normalize されます。
- 推奨される所有モデルは company-oriented です。OpenClaw がこれらの capability contract を追加するにつれて、1 つのベンダー Plugin が text、speech、image、将来の media provider を所有できます。

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

注意:

- orchestration、fallback、config、channel wiring は core に保持します。
- ベンダー動作は provider Plugin に保持します。
- 追加的な拡張は型付きのままにする必要があります: 新しい optional method、新しい optional result field、新しい optional capability。
- video generation もすでに同じ pattern に従っています:
  - core が capability contract と runtime helper を所有します
  - vendor Plugin は `api.registerVideoGenerationProvider(...)` を登録します
  - feature/channel Plugin は `api.runtime.videoGeneration.*` を利用します

media-understanding runtime helper では、Plugin は次のように呼び出せます:

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

注意:

- `api.runtime.mediaUnderstanding.*` は、image/audio/video understanding 向けの推奨共有 surface です。
- core の media-understanding audio 設定（`tools.media.audio`）と provider fallback order を使用します。
- transcription output が生成されない場合（たとえば、skipped/unsupported input）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は compatibility alias として残ります。

Plugin は `api.runtime.subagent` 経由で background subagent run を起動することもできます。

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意:

- `provider` と `model` は run ごとの任意 override であり、永続的な session 変更ではありません。
- OpenClaw は trusted caller に対してのみ、これらの override field を尊重します。
- Plugin 所有の fallback run では、operator は `plugins.entries.<id>.subagent.allowModelOverride: true` で opt in する必要があります。
- trusted Plugin を特定の canonical `provider/model` target に制限するには `plugins.entries.<id>.subagent.allowedModels` を使用し、明示的に任意の target を許可するには `"*"` を使用します。
- untrusted Plugin の subagent run も動作しますが、override request は暗黙の fallback ではなく拒否されます。
- Plugin が作成した subagent session には、作成元 Plugin ID がタグ付けされます。fallback `api.runtime.subagent.deleteSession(...)` は、それらの owned session のみを削除できます。任意の session 削除には、引き続き admin-scoped Gateway request が必要です。

web search では、Plugin は agent tool wiring に入り込む代わりに、共有 runtime helper を利用できます。

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

注意:

- provider selection、credential resolution、共有 request semantics は core に保持します。
- vendor-specific search transport には web-search provider を使用します。
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

- `generate(...)`: 設定された image-generation provider chain を使用して image を生成します。
- `listProviders(...)`: 利用可能な image-generation provider とその capability を一覧表示します。

## Gateway HTTP routes

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
- `auth`: 必須です。通常の Gateway auth を要求するには `"gateway"` を使用し、Plugin 管理の auth/webhook verification には `"plugin"` を使用します。
- `match`: 任意です。`"exact"`（default）または `"prefix"`。
- `replaceExisting`: 任意です。同じ Plugin が自身の既存 route registration を置き換えられるようにします。
- `handler`: route が request を処理した場合は `true` を返します。

注意:

- `api.registerHttpHandler(...)` は削除されており、Plugin 読み込みエラーの原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全に一致する `path + match` の競合は、`replaceExisting: true` の場合を除いて拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルが異なる重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベル内だけにしてください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動的には受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストのランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です。
  - 共有シークレットの bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートのランタイムスコープは `operator.write` に固定されます
  - 信頼された ID 付き HTTP モード（たとえばプライベート ingress 上の `trusted-proxy` や `gateway.auth.mode = "none"`）では、ヘッダーが明示的に存在する場合に限り `x-openclaw-scopes` が尊重されます
  - これらの ID 付き Plugin ルートリクエストで `x-openclaw-scopes` が存在しない場合、ランタイムスコープは `operator.write` にフォールバックします
- 実用上のルール: gateway-auth の Plugin ルートを暗黙の管理者サーフェスだと想定しないでください。ルートに管理者専用の動作が必要な場合は、ID 付き auth モードを必須にし、明示的な `x-openclaw-scopes` ヘッダー契約をドキュメント化してください。

## Plugin SDK インポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルート
barrel ではなく、狭い SDK サブパスを使用してください。コアサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャンネル entry/build ヘルパー                    |
| `openclaw/plugin-sdk/core`          | 汎用の共有ヘルパーと包括的な契約                   |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャンネル Plugin は、狭いシームのファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。承認動作は、無関係な
Plugin フィールドを混在させるのではなく、1 つの `approvalCapability` 契約に統合する必要があります。詳しくは [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムと設定ヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）の下にあります。広い `config-runtime` 互換 barrel ではなく、
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`
を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換 shim です。
新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部の entry point（バンドル Plugin パッケージルートごと）:

- `index.js` — バンドル Plugin entry
- `api.js` — ヘルパー/types barrel
- `runtime-api.js` — ランタイム専用 barrel
- `setup-entry.js` — セットアップ Plugin entry

外部 Plugin は `openclaw/plugin-sdk/*` サブパスだけをインポートしてください。コアまたは別の Plugin から、別の Plugin パッケージの `src/*` をインポートしてはいけません。
facade 経由で読み込まれる entry point は、存在する場合はアクティブなランタイム設定スナップショットを優先し、その後ディスク上の解決済み設定ファイルへフォールバックします。

`image-generation`, `media-understanding`,
`speech` などの capability 固有サブパスは、現在バンドル Plugin が使用しているため存在します。これらは自動的に長期固定の外部契約になるわけではありません — 依存する場合は、関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票などの非メッセージプリミティブについて、チャンネル固有の `describeMessageTool(...)` スキーマ
contribution を所有する必要があります。
共有の送信表示には、プロバイダー固有のボタン、コンポーネント、ブロック、カードのフィールドではなく、汎用の `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作者向けチェックリストについては、[メッセージ表示](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ capability を通じて何をレンダリングできるかを宣言します。

- `presentation` は意味的な表示ブロック（`text`, `context`, `divider`, `buttons`, `select`）用
- `delivery-pin` はピン留め配信リクエスト用

コアは、表示をネイティブにレンダリングするか、テキストへ劣化させるかを決定します。
汎用メッセージツールからプロバイダー固有 UI のエスケープハッチを公開しないでください。
レガシーのネイティブスキーマ向けの非推奨 SDK ヘルパーは、既存の
サードパーティ Plugin 向けに引き続きエクスポートされますが、新しい Plugin では使用しないでください。

## チャンネルターゲット解決

チャンネル Plugin は、チャンネル固有のターゲットセマンティクスを所有する必要があります。共有のアウトバウンドホストは汎用に保ち、プロバイダールールにはメッセージングアダプターサーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化されたターゲットを
  ディレクトリ検索前に `direct`, `group`, `channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力が
  ディレクトリ検索ではなく ID らしい解決に直接進むべきかどうかをコアに伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  ディレクトリミス後にコアが最終的なプロバイダー所有の解決を必要とするときの Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後のプロバイダー固有のセッション
  ルート構築を所有します。

推奨される分割:

- peers/groups の検索前に行うべきカテゴリ決定には `inferTargetChatType` を使用します。
- 「これを明示的/ネイティブなターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- プロバイダー固有の正規化フォールバックには `resolveTarget` を使用し、広い
  ディレクトリ検索には使用しません。
- chat ids、thread ids、JIDs、handles、room
  ids などのプロバイダー固有 ID は、汎用 SDK
  フィールドではなく、`target` 値またはプロバイダー固有 params 内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリを派生する Plugin は、そのロジックを
Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用してください。

チャンネルが次のような設定に基づく peers/groups を必要とする場合に使用します。

- allowlist 駆動の DM peers
- 設定済みチャンネル/group マップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作だけを扱います。

- クエリフィルタリング
- limit 適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャンネル固有のアカウント検査と ID 正規化は、
Plugin 実装内に残してください。

## プロバイダーカタログ

プロバイダー Plugin は、
`registerProvider({ catalog: { run(...) { ... } } })` で推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が
`models.providers` に書き込むものと同じ形を返します。

- `{ provider }` は 1 つのプロバイダー entry 用
- `{ providers }` は複数のプロバイダー entry 用

Plugin がプロバイダー固有のモデル ID、base URL
デフォルト、または auth-gated なモデルメタデータを所有する場合は、`catalog` を使用してください。

`catalog.order` は、Plugin のカタログが OpenClaw の
組み込み暗黙プロバイダーに対していつマージされるかを制御します。

- `simple`: プレーンな API キーまたは env 駆動のプロバイダー
- `profile`: auth profile が存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダー entry を合成するプロバイダー
- `late`: 最後のパス。他の暗黙プロバイダーの後

後のプロバイダーがキー衝突時に優先されるため、Plugin は同じプロバイダー ID を持つ組み込みプロバイダー entry を意図的に上書きできます。

Plugin は
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて読み取り専用のモデル行も公開できます。これは list/help/picker サーフェス向けの今後の経路であり、
`text`, `image_generation`, `video_generation`, `music_generation` 行をサポートします。
プロバイダー Plugin は引き続きライブエンドポイント呼び出し、トークン交換、ベンダーレスポンスマッピングを所有します。コアは共通の行形状、ソースラベル、メディアツールのヘルプ書式を所有します。メディア生成プロバイダー登録は、`defaultModel`, `models`, `capabilities` から静的カタログ行を自動的に合成します。

互換性:

- `discovery` はレガシー alias として引き続き動作しますが、非推奨警告を出します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します
- `augmentModelCatalog` は非推奨です。バンドルプロバイダーは
  `registerModelCatalogProvider` を通じて補足行を公開してください

## 読み取り専用チャンネル検査

Plugin がチャンネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` はランタイム経路です。認証情報が完全に具体化されていると想定してよく、
  必須シークレットが欠けている場合に早期失敗できます。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  repair フローなどの読み取り専用コマンド経路は、設定を説明するだけのために
  ランタイム認証情報を具体化する必要があってはなりません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態だけを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような認証情報の source/status フィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するだけなら、生のトークン値を返す必要はありません。
  `tokenStatus: "available"`（および対応する source
  フィールド）を返すだけで、status 形式のコマンドには十分です。
- 認証情報が SecretRef 経由で設定されているが、現在のコマンド経路では利用できない場合は、`configured_unavailable` を使用します。

これにより、読み取り専用コマンドは、クラッシュしたりアカウントを未設定として誤報したりする代わりに、「設定済みだがこのコマンド
経路では利用不可」と報告できます。

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

各 entry は Plugin になります。パックに複数の extensions が列挙されている場合、Plugin id は
`name/<fileBase>` になります。

Plugin が npm deps をインポートする場合は、そのディレクトリにインストールして
`node_modules` を利用可能にしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` entry は、シンボリックリンク解決後も Plugin
ディレクトリ内に留まる必要があります。パッケージディレクトリの外へ抜ける entry は
拒否されます。

セキュリティ上の注意: `openclaw plugins install` は、プロジェクトローカルの
`npm install --omit=dev --ignore-scripts`（ライフサイクルスクリプトなし、
ランタイムでの dev dependencies なし）で Plugin 依存関係をインストールし、継承されたグローバル npm install 設定を無視します。
Plugin 依存ツリーは「pure JS/TS」に保ち、
`postinstall` build を必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は軽量なセットアップ専用モジュールを指すことができます。
OpenClaw が無効化されたチャンネル Plugin のセットアップサーフェスを必要とする場合、または
チャンネル Plugin が有効でもまだ未設定の場合、完全な Plugin entry ではなく `setupEntry` を読み込みます。これにより、メインの Plugin entry が tools、hooks、その他のランタイム専用
コードも配線する場合でも、startup と setup が軽くなります。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使うと、チャンネルがすでに設定済みの場合でも、Gateway の
pre-listen startup フェーズ中にチャンネル Plugin を同じ `setupEntry` 経路へ opt in できます。

これは、`setupEntry` が Gateway がリッスンを開始する前に存在している必要がある起動サーフェスを完全にカバーしている場合にのみ使用します。実際には、セットアップエントリは、起動が依存するチャンネル所有のすべての capability を登録する必要があるということです。たとえば、次のものです。

- チャンネル登録自体
- Gateway がリッスンを開始する前に利用可能でなければならない HTTP ルート
- 同じ時間枠の間に存在していなければならない Gateway メソッド、ツール、またはサービス

完全なエントリが必要な起動 capability をまだ所有している場合は、このフラグを有効にしないでください。Plugin はデフォルトの動作のままにし、起動中に OpenClaw が完全なエントリをロードするようにします。

バンドルされたチャンネルは、完全なチャンネルランタイムがロードされる前にコアが参照できる、セットアップ専用の contract-surface ヘルパーも公開できます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全な Plugin エントリをロードせずに、従来の単一アカウントチャンネル設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、このサーフェスを使用します。Matrix は現在のバンドル例です。名前付きアカウントがすでに存在する場合は auth/bootstrap キーのみを名前付きの昇格アカウントに移動し、常に `accounts.default` を作成する代わりに、設定済みの非正規デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターは、バンドルされた contract-surface の検出を lazy に保ちます。インポート時は軽量なままで、昇格サーフェスはモジュールインポート時にバンドルチャンネル起動へ再入するのではなく、初回使用時にのみロードされます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスに置いてください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままであり、Plugin がより狭いスコープを要求した場合でも常に `operator.admin` に解決されます。

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

チャンネルPluginは `openclaw.channel` を介してセットアップ/検出メタデータを、`openclaw.install` を介してインストールヒントを公開できます。これにより、コアカタログはデータを持たない状態を維持できます。

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
- `docsLabel`: docs リンクのリンクテキストを上書き
- `preferOver`: このカタログエントリが優先すべき、優先度の低い Plugin/チャンネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: アウトバウンド整形の判断で、そのチャンネルを markdown 対応としてマーク
- `exposure.configured`: `false` に設定すると、設定済みチャンネル一覧サーフェスからチャンネルを非表示
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからチャンネルを非表示
- `exposure.docs`: docs ナビゲーションサーフェスで、そのチャンネルを内部/非公開としてマーク
- `showConfigured` / `showInSetup`: 互換性のために引き続き受け付けられる legacy エイリアス。`exposure` を優先
- `quickstartAllowFrom`: チャンネルを標準のクイックスタート `allowFrom` フローに参加させる
- `forceAccountBinding`: アカウントが 1 つしか存在しない場合でも、明示的なアカウントバインディングを要求
- `preferSessionLookupForAnnounceTarget`: announce ターゲットを解決するときにセッション検索を優先

OpenClaw は **外部チャンネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを配置します。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）に、1 つ以上の JSON ファイル（カンマ/セミコロン/`PATH` 区切り）を指定します。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは legacy エイリアスとして、`"entries"` キーの代わりに `"packages"` または `"plugins"` も受け付けます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックの横に、正規化済みのインストールソース情報を公開します。正規化済み情報は、npm spec が正確なバージョンなのか floating selector なのか、期待される integrity メタデータが存在するかどうか、ローカルソースパスも利用可能かどうかを識別します。カタログ/パッケージ ID が既知の場合、正規化済み情報は、解析された npm パッケージ名がその ID からずれていると警告します。また、`defaultChoice` が無効な場合、または利用できないソースを指している場合、および有効な npm ソースなしに npm integrity メタデータが存在する場合にも警告します。コンシューマーは `installSource` を追加的な任意フィールドとして扱うべきです。そうすることで、手作業で作成されたエントリやカタログ shim がそれを合成する必要がなくなります。
これにより、オンボーディングと診断は Plugin ランタイムをインポートせずに source-plane の状態を説明できます。

公式の外部 npm エントリでは、正確な `npmSpec` と `expectedIntegrity` を優先するべきです。裸のパッケージ名と dist-tag は互換性のために引き続き機能しますが、source-plane 警告を表示するため、既存の Plugin を壊さずに、カタログを pin 済みで integrity チェック済みのインストールへ移行できます。オンボーディングがローカルカタログパスからインストールする場合、可能であれば、`source: "path"` とワークスペース相対の `sourcePath` を持つ管理対象Pluginインデックスエントリを記録します。絶対の運用ロードパスは `plugins.load.paths` に残ります。インストール記録は、長期保存される設定にローカルワークステーションパスを重複して書き込むことを避けます。これにより、ローカル開発インストールは source-plane 診断から見えるまま、2 つ目の生のファイルシステムパス開示サーフェスを追加せずに済みます。永続化された `plugins/installs.json` Pluginインデックスは、インストールソースの信頼できる情報源であり、Plugin ランタイムモジュールをロードせずに更新できます。その `installRecords` マップは、Plugin マニフェストが欠落している場合や無効な場合でも永続的です。その `plugins` 配列は再構築可能なマニフェストビューです。

## コンテキストエンジンPlugin

コンテキストエンジンPluginは、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

Plugin が、単にメモリ検索やフックを追加するのではなく、デフォルトのコンテキストパイプラインを置き換える、または拡張する必要がある場合に使用します。

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

ファクトリの `ctx` は、構築時の初期化用に任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

エンジンが Compaction アルゴリズムを所有**しない**場合は、`compact()` を実装したまま、明示的に委譲してください。

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

## 新しい capability を追加する

Plugin が現在の API に合わない動作を必要とする場合、private reach-in で Plugin システムを迂回しないでください。不足している capability を追加します。

推奨手順:

1. コア contract を定義する
   コアが所有すべき共有動作を決めます。policy、fallback、config merge、lifecycle、チャンネル向け semantics、ランタイムヘルパーの形状です。
2. 型付き Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` や `api.runtime` を、最小限で有用な型付き capability サーフェスで拡張します。
3. コア + チャンネル/機能コンシューマーを配線する
   チャンネルと機能Pluginは、vendor 実装を直接インポートするのではなく、コアを介して新しい capability を利用するべきです。
4. vendor 実装を登録する
   その後、vendor Plugin がその capability に対してバックエンドを登録します。
5. contract カバレッジを追加する
   所有権と登録形状が時間が経っても明示的なままになるようにテストを追加します。

これは、OpenClaw が 1 つのプロバイダーの世界観にハードコードされることなく、意見を持った設計を保つ方法です。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/adding-capabilities) を参照してください。

### capability チェックリスト

新しい capability を追加する場合、実装は通常、次のサーフェスをまとめて触る必要があります。

- `src/<capability>/types.ts` のコア contract 型
- `src/<capability>/runtime.ts` のコア runner/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャンネルPluginが利用する必要がある場合は、`src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` の capture/test ヘルパー
- `src/plugins/contracts/registry.ts` の所有権/contract アサーション
- `docs/` の operator/Plugin docs

これらのサーフェスのいずれかが欠けている場合、それは通常、その capability がまだ完全に統合されていない兆候です。

### capability テンプレート

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

contract テストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールは単純になります。

- コアは capability contract + オーケストレーションを所有する
- vendor Plugin は vendor 実装を所有する
- 機能/チャンネルPluginはランタイムヘルパーを利用する
- contract テストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開 capability モデルと形状
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
