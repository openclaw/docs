---
read_when:
    - プロバイダーランタイムフック、チャンネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しい Plugin 機能またはコンテキストエンジン Plugin の追加
summary: 'Plugin アーキテクチャ内部: ロードパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照テーブル'
title: Pluginアーキテクチャ内部
x-i18n:
    generated_at: "2026-07-06T21:49:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee2b2238b7d91570cc8ebfff958553b0e1d769129060b55a76eae2e1db4f0869
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin 形状、所有権/実行の契約については、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページでは、内部メカニクスであるロードパイプライン、レジストリ、ランタイムフック、Gateway HTTP ルート、インポートパス、スキーマテーブルを扱います。

## ロードパイプライン

起動時、OpenClaw はおおよそ次の処理を行います。

1. 候補 Plugin ルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`,
   `slots`、`load.paths`）を正規化する
5. 各候補の有効化を判断する
6. 有効化されたネイティブモジュールをロードする: ビルド済みのバンドルモジュールはネイティブローダーを使用し、
   サードパーティのローカルソース TypeScript は緊急用の Jiti フォールバックを使用する
7. ネイティブの `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. コマンド/ランタイム面にレジストリを公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべてのバンドル済み Plugin は `register` を使用します。新しい Plugin では `register` を優先してください。
</Note>

安全性ゲートはランタイム実行の**前に**実行されます。検出は、次の場合に候補をブロックします。

- 解決されたエントリが Plugin ルートの外へ出る
- パス（またはそのルートディレクトリ）が world-writable である
- 非バンドル Plugin で、パスの所有者が現在の uid（または root）と一致しない

world-writable なバンドルディレクトリには、ゲートの再チェック前にまずインプレースの `chmod` 修復を試みます（npm/global インストールではパッケージディレクトリが `0777` で出荷されることがあります）。所有者チェックはバンドル由来の場合は完全にスキップされます。

ブロックされた候補でも、Plugin id が分かっている場合（それ以外なら拒否されるディレクトリ内のマニフェストから解決された id を含む）は、出力される診断にその Plugin id が含まれます。そのため、その id を参照する設定では、無関係な「不明な Plugin」エラーではなく、パス安全性警告に紐づいたブロック済み Plugin として扱われます。

### マニフェスト優先の動作

マニフェストは制御プレーンの信頼できる情報源です。OpenClaw はこれを使って次を行います。

- Plugin を識別する
- 宣言されたチャンネル/Skills/設定スキーマまたはバンドル capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル/プレースホルダーを補強する
- インストール/カタログメタデータを表示する
- Plugin ランタイムをロードせずに、軽量な activation と setup 記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

任意のマニフェスト `activation` ブロックと `setup` ブロックは制御プレーンに留まります。これらは activation 計画と setup 検出のためのメタデータ専用記述子です。ランタイム登録、`register(...)`、`setupEntry` を置き換えるものではありません。ライブ activation の利用側は、マニフェストのコマンド、チャンネル、プロバイダーのヒントを使用して、より広いレジストリ具体化の前に Plugin ロードを絞り込みます。

- CLI ロードは、要求されたプライマリコマンドを所有する Plugin に絞り込む
- チャンネル setup/Plugin 解決は、要求されたチャンネル id を所有する Plugin に絞り込む
- 明示的なプロバイダー setup/ランタイム解決は、要求されたプロバイダー id を所有する Plugin に絞り込む
- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使用する。起動メタデータのない Plugin は、より狭い activation トリガーを通じてのみロードされる

activation プランナーは、既存の呼び出し元向けの id のみの API と、診断向けの plan API の両方を公開します。plan エントリは Plugin が選択された理由を報告し、明示的な `activation.*` ヒントとマニフェスト所有権フォールバックを分離します。

| 理由（`activation.*` ヒント由来）   | 理由（マニフェスト所有権由来）                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| —（フックトリガーにはヒントのバリアントがない） | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

この理由の分割が互換性境界です。既存の Plugin メタデータは引き続き動作し、新しいコードはランタイムロードのセマンティクスを変更せずに、広いヒントやフォールバック動作を検出できます。

広い `all` スコープを要求するリクエスト時ランタイムプリロードでも、設定、起動計画、設定済みチャンネル、slots、自動有効化ルールから、明示的な有効 Plugin id セットを導出します（`src/plugins/effective-plugin-ids.ts` の `resolveEffectivePluginIds`）。その導出されたセットが空の場合、OpenClaw は検出可能なすべての Plugin に広げるのではなく、スコープを空のままにします。

Setup 検出は、`setup.providers` や `setup.cliBackends` などの記述子所有 id を優先し、`setup-api` にフォールバックする前に候補 Plugin を絞り込みます。これは setup 時ランタイムフックをまだ必要とする Plugin 向けです。プロバイダー setup リストは、プロバイダーランタイムをロードせずに、マニフェストの `providerAuthChoices`、記述子から導出された setup choices、インストールカタログメタデータを使用します。明示的な `setup.requiresRuntime: false` は記述子のみの打ち切りです。`requiresRuntime` が省略されている場合は、互換性のためにレガシーの setup-api フォールバックを維持します。検出された複数の Plugin が同じ正規化済み setup プロバイダーまたは CLI backend id を主張する場合、setup lookup は検出順に依存せず、曖昧な所有者を拒否します。setup ランタイムが実行される場合、レジストリ診断は、`setup.providers` / `setup.cliBackends` と、setup-api によって実際に登録されたプロバイダーまたは CLI backend の不一致を報告しますが、レガシー Plugin はブロックしません。

### Plugin キャッシュ境界

OpenClaw は、Plugin 検出結果や直接のマニフェストレジストリデータを、壁時計時間のウィンドウの背後にキャッシュしません。インストール、マニフェスト編集、ロードパス変更は、次の明示的なメタデータ読み取りまたはスナップショット再構築で見える必要があります。マニフェストファイルパーサーは、開かれたマニフェストパスに device/inode、size、mtime/ctime を加えたものをキーとする、有界のファイルシグネチャキャッシュを保持します。このキャッシュは変更されていないバイト列の再パースを避けるだけであり、検出、レジストリ、所有者、ポリシーの回答をキャッシュしてはなりません。

安全なメタデータ高速パスは、隠れたキャッシュではなく、明示的なオブジェクト所有権です。Gateway 起動のホットパスでは、現在の `PluginMetadataSnapshot`、導出された `PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出しチェーンで渡すべきです。設定検証、起動時自動有効化、Plugin ブートストラップ、プロバイダー選択は、それらのオブジェクトが現在の設定と Plugin インベントリを表している間は再利用できます。Setup lookup は、特定の setup パスが明示的なマニフェストレジストリを受け取らない限り、依然として必要に応じてマニフェストメタデータを再構築します。隠れた lookup キャッシュを追加するのではなく、これをコールドパスフォールバックとして維持してください。入力が変わったら、スナップショットを変更したり履歴コピーを保持したりするのではなく、再構築して置き換えます。アクティブな Plugin レジストリ上のビューと、バンドル済みチャンネルブートストラップヘルパーは、現在のレジストリ/ルートから再計算すべきです。短命のマップは、1 回の呼び出し内で作業を重複排除したり再入を防いだりする用途なら問題ありません。ただし、プロセスメタデータキャッシュになってはなりません。

Plugin ロードにおいて、永続キャッシュ層はランタイムロードです。コードやインストール済みアーティファクトが実際にロードされる場合、次のようなローダー状態を再利用できます。

- `PluginLoaderCacheState` と互換性のあるアクティブランタイムレジストリ
- 同じランタイム面を繰り返しインポートするのを避けるために使われる jiti/module キャッシュと public-surface ローダーキャッシュ
- インストール済み Plugin アーティファクト用のファイルシステムキャッシュ
- パス正規化や重複解決用の短命な呼び出し単位マップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイムロードを要求した場合を除き、「どの Plugin がこのプロバイダーを所有しているか」のような制御プレーンの質問に答えてはなりません。

次について、永続キャッシュや壁時計時間キャッシュを追加しないでください。

- 検出結果
- 直接のマニフェストレジストリ
- インストール済み Plugin インデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者 lookup、モデル抑制、プロバイダーポリシー、public-artifact メタデータ
- 変更されたマニフェスト、インストール済みインデックス、ロードパスが次のメタデータ読み取りで見えるべき、その他のマニフェスト由来の回答

永続化されたインストール済み Plugin インデックスからマニフェストメタデータを再構築する呼び出し元は、そのレジストリを必要に応じて再構築します。インストール済みインデックスは永続的な source-plane 状態であり、隠れたインプロセスメタデータキャッシュではありません。

## レジストリモデル

ロード済み Plugin は、任意のコアグローバルを直接変更しません。中央の Plugin レジストリ（`src/plugins/registry-types.ts` の `PluginRegistry`）に登録します。このレジストリは Plugin レコード（identity、source、origin、status、diagnostics）に加え、すべての capability 用の配列を追跡します。対象には、tools、レガシーフックと型付きフック、channels、providers、gateway RPC handlers、HTTP routes、CLI registrars、background services、Plugin 所有 commands、さらに多数の型付きプロバイダーファミリー（speech、embeddings、image/video/music generation、web fetch/search、agent harnesses、session actions など）が含まれます。

その後、コア機能は Plugin モジュールと直接やり取りするのではなく、そのレジストリから読み取ります。これによりロードは一方向に保たれます。

- Plugin モジュール -> レジストリ登録
- コアランタイム -> レジストリ消費

この分離は保守性にとって重要です。つまり、ほとんどのコア面で必要な統合点は 1 つだけです。「すべての Plugin モジュールを特別扱いする」ことではなく、「レジストリを読む」ことです。

## 会話バインディングコールバック

会話をバインドする Plugin は、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)` を使用すると、バインドリクエストが承認または拒否された後にコールバックを受け取れます。

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

コールバック payload フィールド:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認されたリクエストの解決済みバインディング
- `request`: 元のリクエスト概要、detach hint、sender id、会話メタデータ

このコールバックは通知専用です。会話をバインドできる対象は変更せず、コアの承認処理が完了した後に実行されます。

## プロバイダーランタイムフック

プロバイダー Plugin には 3 つのレイヤーがあります。

- 安価なランタイム前 lookup のための**マニフェストメタデータ**:
  `setup.providers[].envVars`、非推奨の互換性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **設定時フック**: `catalog`（レガシー `discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、ストリームラップ、thinking levels、replay policy、使用量エンドポイントをカバーする 40 個以上の任意フック。[フックの順序と使い方](#hook-order-and-usage)を参照してください。

OpenClaw は引き続き、汎用 agent loop、failover、transcript handling、tool policy を所有します。これらのフックは、完全なカスタム inference transport を必要とせずに、プロバイダー固有の動作を拡張するための面です。

プロバイダーが環境変数ベースの認証情報を持ち、汎用の認証/状態/モデル選択パスが Plugin ランタイムを読み込まずに参照できるようにする必要がある場合は、マニフェストの `setup.providers[].envVars` を使用します。非推奨の `providerAuthEnvVars` は、非推奨期間中は互換性アダプターによって引き続き読み取られ、それを使用する非バンドル Plugin はマニフェスト診断を受け取ります。あるプロバイダー ID が別のプロバイダー ID の環境変数、認証プロファイル、設定ベースの認証、API キーのオンボーディング選択を再利用する必要がある場合は、マニフェストの `providerAuthAliases` を使用します。オンボーディング/認証選択 CLI サーフェスが、プロバイダーランタイムを読み込まずにプロバイダーの選択 ID、グループラベル、単純な単一フラグ認証の配線を知る必要がある場合は、マニフェストの `providerAuthChoices` を使用します。オンボーディングラベルや OAuth クライアント ID/クライアントシークレット設定変数など、運用者向けのヒントには、プロバイダーランタイムの `envVars` を維持します。

チャネルに環境変数駆動の認証またはセットアップがあり、汎用のシェル環境変数フォールバック、設定/状態チェック、またはセットアッププロンプトがチャネルランタイムを読み込まずに参照できるようにする必要がある場合は、マニフェストの `channelEnvVars` を使用します。

### フックの順序と使い方

モデル/プロバイダー Plugin では、OpenClaw は概ね次の順序でフックを呼び出します。
「使用する場合」列は、素早く判断するためのガイドです。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在は呼び出さない互換性専用のプロバイダーフィールドは、意図的にここには記載していません。

| フック                              | その役割                                                                                                   | 使用する場面                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` へ公開する                                | プロバイダーがカタログまたはベース URL のデフォルトを所有する場合                                                                                                  |
| `applyConfigDefaults`             | 設定の具体化中に、プロバイダー所有のグローバル設定デフォルトを適用する                                      | デフォルトが認証モード、env、またはプロバイダーモデルファミリーのセマンティクスに依存する場合                                                                         |
| _(組み込みモデル検索)_         | OpenClaw はまず通常のレジストリ/カタログパスを試す                                                          | _(Plugin フックではない)_                                                                                                                         |
| `normalizeModelId`                | 検索前にレガシーまたはプレビューのモデル ID エイリアスを正規化する                                                     | プロバイダーが正規モデル解決前のエイリアスクリーンアップを所有する場合                                                                                 |
| `normalizeTransport`              | 汎用モデル組み立て前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                                      | プロバイダーが同じトランスポートファミリー内のカスタムプロバイダー ID 向けトランスポートクリーンアップを所有する場合                                                          |
| `normalizeConfig`                 | ランタイム/プロバイダー解決前に `models.providers.<id>` を正規化する                                           | プロバイダーに、Plugin と一緒に置くべき設定クリーンアップが必要な場合。バンドルされた Google ファミリーのヘルパーも、サポート対象の Google 設定エントリを補完する   |
| `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブストリーミング使用量互換の書き換えを適用する                                               | プロバイダーに、エンドポイント駆動のネイティブストリーミング使用量メタデータ修正が必要な場合                                                                          |
| `resolveConfigApiKey`             | ランタイム認証の読み込み前に、設定プロバイダー向け env マーカー認証を解決する                                       | プロバイダーが独自の env マーカー API キー解決フックを公開する場合                                                                                |
| `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたは設定ベースの認証を表面化する                                   | プロバイダーが合成/ローカル資格情報マーカーで動作できる場合                                                                                 |
| `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/アプリ所有の資格情報では、デフォルトの `persistence` は `runtime-only` | プロバイダーが、コピーされたリフレッシュトークンを永続化せずに外部認証資格情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| `shouldDeferSyntheticProfileAuth` | 保存済み合成プロファイルプレースホルダーを env/設定ベース認証の背後に下げる                                      | プロバイダーが、優先順位で勝つべきではない合成プレースホルダープロファイルを保存する場合                                                                 |
| `resolveDynamicModel`             | ローカルレジストリにまだない、プロバイダー所有モデル ID の同期フォールバック                                       | プロバイダーが任意の上流モデル ID を受け入れる場合                                                                                                 |
| `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` が再度実行される                                                           | 不明な ID を解決する前に、プロバイダーがネットワークメタデータを必要とする場合                                                                                  |
| `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使用する前の最終書き換え                                               | プロバイダーがトランスポート書き換えを必要とするが、引き続きコアトランスポートを使用する場合                                                                             |
| `normalizeToolSchemas`            | 埋め込みランナーが参照する前にツールスキーマを正規化する                                                    | プロバイダーがトランスポートファミリーのスキーマクリーンアップを必要とする場合                                                                                                |
| `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を表面化する                                                  | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい場合                                                                 |
| `resolveReasoningOutputMode`      | ネイティブまたはタグ付き reasoning-output contract を選択する                                                              | ネイティブフィールドではなく、タグ付き reasoning/最終出力がプロバイダーに必要な場合                                                                         |
| `prepareExtraParams`              | 汎用ストリームオプションラッパー前にリクエストパラメーターを正規化する                                              | プロバイダーがデフォルトのリクエストパラメーターまたはプロバイダーごとのパラメータークリーンアップを必要とする場合                                                                           |
| `createStreamFn`                  | 通常のストリームパスをカスタムトランスポートで完全に置き換える                                                   | プロバイダーが単なるラッパーではなく、カスタムのワイヤプロトコルを必要とする場合                                                                                     |
| `wrapStreamFn`                    | 汎用ラッパー適用後のストリームラッパー                                                              | プロバイダーがカスタムトランスポートなしで、リクエストヘッダー/ボディ/モデル互換ラッパーを必要とする場合                                                          |
| `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたはメタデータを付与する                                                           | 汎用トランスポートにプロバイダーネイティブなターン ID を送信させたい場合                                                                       |
| `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付与する                                                    | 汎用 WS トランスポートのセッションヘッダーまたはフォールバックポリシーを、プロバイダーが調整したい場合                                                               |
| `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                                     | プロバイダーが追加の認証メタデータを保存し、カスタムランタイムトークン形状を必要とする場合                                                                    |
| `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き                                  | プロバイダーが共有 OpenClaw リフレッシャーに適合しない場合                                                                                          |
| `buildAuthDoctorHint`             | OAuth リフレッシュ失敗時に追加される修復ヒント                                                                  | リフレッシュ失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合                                                                      |
| `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                                                 | プロバイダーに、汎用ヒューリスティックでは見逃す生のオーバーフローエラーがある場合                                                                                |
| `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                  | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などに対応付けられる場合                                                                          |
| `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けプロンプトキャッシュポリシー                                                               | プロバイダーがプロキシ固有のキャッシュ TTL ゲーティングを必要とする場合                                                                                                |
| `buildMissingAuthMessage`         | 汎用の認証欠落リカバリーメッセージの置き換え                                                      | プロバイダー固有の認証欠落リカバリーヒントが必要な場合                                                                                 |
| `augmentModelCatalog`             | 検出後に追加される合成/最終カタログ行 (非推奨。以下を参照)                                  | プロバイダーが `models list` とピッカーに、合成の前方互換行を必要とする場合                                                                     |
| `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                 | プロバイダーが、選択されたモデル向けにカスタム思考ラダーまたはバイナリラベルを公開する場合                                                                 |
| `isBinaryThinking`                | オン/オフ reasoning トグル互換フック                                                                     | プロバイダーがバイナリの思考オン/オフのみを公開する場合                                                                                                  |
| `supportsXHighThinking`           | `xhigh` reasoning サポート互換フック                                                                   | プロバイダーがモデルの一部でのみ `xhigh` を有効にしたい場合                                                                                             |
| `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                      | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有する場合                                                                                      |
| `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                              | プロバイダーがライブ/スモークの優先モデルマッチングを所有する場合                                                                                             |
| `prepareRuntimeAuth`              | 推論直前に、設定済み資格情報を実際のランタイムトークン/キーへ交換する                       | プロバイダーがトークン交換または短命のリクエスト資格情報を必要とする場合                                                                             |
| `resolveUsageAuth`                | `/usage` と関連ステータスサーフェス向けの使用量/課金資格情報を解決する                                     | プロバイダーがカスタム使用量/クォータトークン解析または別の使用量資格情報を必要とする場合                                                               |
| `fetchUsageSnapshot`              | 認証解決後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーがプロバイダー固有の使用量エンドポイントまたはペイロードパーサーを必要とする場合                                                                           |
| `createEmbeddingProvider`         | メモリ/検索用のプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダー Plugin に属する                                                                                    |
| `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにはカスタムのトランスクリプトポリシーが必要（たとえば、thinking ブロックの除去）                                                               |
| `sanitizeReplayHistory`           | 汎用トランスクリプトクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーには共有 Compaction ヘルパーを超えるプロバイダー固有のリプレイ書き換えが必要                                                             |
| `validateReplayTurns`             | 埋め込みランナーの前に最終的なリプレイターン検証または整形を行う                                           | プロバイダートランスポートには汎用サニタイズ後のより厳格なターン検証が必要                                                                    |
| `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったとき、プロバイダーにはテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` はまず一致したプロバイダーPluginを確認し、その後、モデル ID またはトランスポート/設定を実際に変更するものが見つかるまで、フック対応の他のプロバイダーPluginにフォールスルーします。これにより、どのバンドルPluginが書き換えを所有しているかを呼び出し元が知る必要なく、エイリアス/互換プロバイダーのシムを機能させられます。対応している Google ファミリー設定エントリを書き換えるプロバイダーフックがない場合でも、バンドルされた Google 設定ノーマライザーがその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤプロトコルやカスタムリクエスト実行機構を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き動作するプロバイダー挙動のためのものです。

`resolveUsageAuth` は、OpenClaw が `fetchUsageSnapshot` を呼び出すべきか、それとも使用量/ステータス表示向けに汎用の資格情報解決へフォールバックすべきかを決定します。プロバイダーに使用量用の資格情報がある場合は `{ token, accountId? }` を返し、プロバイダー所有の使用量認証がリクエストを処理済みで、汎用の API キー/OAuth フォールバックを抑止する必要がある場合は `{ handled: true }` を返し、プロバイダーが使用量認証を処理しなかった場合は `null` または `undefined` を返します。

組織または課金用の資格情報は、マニフェストの `providerUsageAuthEnvVars` で宣言します。これにより、汎用の検出やシークレットスクラブ処理の表示面が、それらを推論認証候補にすることなく認識できます。

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

バンドルされたプロバイダーPluginは、各ベンダーのカタログ、認証、thinking、リプレイ、使用量の要件に合わせて、上記のフックを組み合わせます。信頼できるフックセットは `extensions/` 配下の各Pluginにあります。このページは一覧をミラーするのではなく、形を示すものです。

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` と `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的カタログに先行して上流のモデル ID を表示できるようにします。
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は `prepareRuntimeAuth` または `formatApiKey` と `resolveUsageAuth` + `fetchUsageSnapshot` を組み合わせ、トークン交換と `/usage` 連携を所有します。
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）により、各Pluginがクリーンアップを再実装する代わりに、プロバイダーは `buildReplayPolicy` を通じてトランスクリプトポリシーへオプトインできます。
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` は `catalog` だけを登録し、共有推論ループ上で動作します。
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Pluginは `api.runtime` を介して選択されたコアヘルパーにアクセスできます。TTS の場合:

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

- `textToSpeech` は、ファイル/ボイスメモ表示面向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファ + サンプルレートを返します。Pluginはプロバイダー向けにリサンプリング/エンコードする必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローで使用します。
- 音声一覧には、ロケール、性別、性格タグなど、プロバイダー対応ピッカー向けのより豊富なメタデータを含められます。
- OpenAI と ElevenLabs は現在テレフォニーに対応しています。Microsoft は対応していません。

Pluginは `api.registerSpeechProvider(...)` を介して音声プロバイダーを登録することもできます。

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
- ベンダー所有の合成挙動には音声プロバイダーを使用します。
- レガシー Microsoft `edge` 入力は `microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは企業指向です。OpenClaw がそれらの機能契約を追加するにつれ、1 つのベンダーPluginがテキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像/音声/動画理解については、Pluginは汎用のキー/値バッグではなく、型付きのメディア理解プロバイダーを 1 つ登録します。

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
- ベンダー挙動はプロバイダーPluginに保持します。
- 追加的な拡張は型付きのままにします。新しい任意メソッド、新しい任意結果フィールド、新しい任意機能を使用します。
- 動画生成もすでに同じパターンに従っています:
  - コアが機能契約とランタイムヘルパーを所有する
  - ベンダーPluginが `api.registerVideoGenerationProvider(...)` を登録する
  - 機能/チャネルPluginが `api.runtime.videoGeneration.*` を使用する

メディア理解ランタイムヘルパーについては、Pluginは次を呼び出せます。

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

音声文字起こしについては、Pluginはメディア理解ランタイムまたは古い STT エイリアスのどちらかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注:

- `api.runtime.mediaUnderstanding.*` は、画像/音声/動画理解向けの推奨共有表示面です。
- `extractStructuredWithModel(...)` は、境界付けられたプロバイダー所有の画像優先抽出に対するPlugin向け境界です。少なくとも 1 つの画像入力を含めます。テキスト入力は補足コンテキストです。プロダクトPluginがそれぞれのルートとスキーマを所有し、OpenClaw がプロバイダー/ランタイム境界を所有します。
- コアのメディア理解音声設定（`tools.media.audio`）とプロバイダーフォールバック順序を使用します。
- 文字起こし出力が生成されない場合（たとえばスキップ/非対応入力）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換エイリアスとして残ります。

Pluginは `api.runtime.subagent` を通じてバックグラウンドのサブエージェント実行を起動することもできます。

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
- OpenClaw は信頼済み呼び出し元に対してのみ、それらのオーバーライドフィールドを尊重します。
- Plugin所有のフォールバック実行については、オペレーターが `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、信頼済みPluginを特定の正規 `provider/model` ターゲットに制限します。または、任意のターゲットを明示的に許可するには `"*"` を使用します。
- 信頼されていないPluginのサブエージェント実行も動作しますが、オーバーライド要求はサイレントにフォールバックするのではなく拒否されます。
- Pluginが作成したサブエージェントセッションには、作成元Plugin ID がタグ付けされます。フォールバックの `api.runtime.subagent.deleteSession(...)` は、それらの所有セッションのみを削除できます。任意のセッション削除には、引き続き管理者スコープの Gateway リクエストが必要です。

Web 検索については、Pluginはエージェントツール配線へ踏み込む代わりに、共有ランタイムヘルパーを使用できます。

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

Pluginは `api.registerWebSearchProvider(...)` を介して Web 検索プロバイダーを登録することもできます。

注:

- プロバイダー選択、資格情報解決、共有リクエストセマンティクスはコアに保持します。
- ベンダー固有の検索トランスポートには Web 検索プロバイダーを使用します。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せずに検索挙動を必要とする機能/チャネルPlugin向けの推奨共有表示面です。

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
- `auth`: 必須、`"gateway"` または `"plugin"`。通常の Gateway 認証を要求するには `"gateway"` を使用し、Plugin 管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `handleUpgrade`: 同じルート上の WebSocket アップグレードリクエスト用の任意ハンドラー。
- `replaceExisting`: 任意。同じ Plugin が自身の既存ルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理した場合に `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除され、Plugin 読み込みエラーの原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` でない限り拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- 異なる `auth` レベルで重複するルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは、同じ認証レベル内のみにしてください。
- `auth: "plugin"` ルートは、オペレーターランタイムスコープを自動的には受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権的な Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは、Gateway リクエストランタイムスコープ内で実行されます。デフォルトのサーフェス（`gatewayRuntimeScopeSurface: "write-default"`）は意図的に保守的です:
  - 共有シークレットの bearer 認証（`gateway.auth.mode = "token"` / `"password"`）および信頼済みプロキシ以外の認証方式は、呼び出し元が `x-openclaw-scopes` を送信しても、単一の `operator.write` スコープを取得します
  - 明示的な `x-openclaw-scopes` ヘッダーのない `trusted-proxy` 呼び出し元も、従来の `operator.write` のみのサーフェスを維持します
  - `x-openclaw-scopes` を送信する `trusted-proxy` 呼び出し元は、代わりに宣言されたスコープを取得します
  - ルートは `gatewayRuntimeScopeSurface: "trusted-operator"` にオプトインすることで、ID を伴う認証モードでは常に `x-openclaw-scopes` を尊重できます（ヘッダーがない場合は完全な CLI デフォルトスコープセットにフォールバックします）
- 実用上のルール: Gateway 認証の Plugin ルートを暗黙の管理者サーフェスと見なさないでください。ルートに管理者専用の動作が必要な場合は、`trusted-operator` スコープサーフェスにオプトインし、ID を伴う認証モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK インポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルート
barrel ではなく、狭い SDK サブパスを使用してください。コアサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャネルエントリー/ビルドヘルパー                 |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括契約                         |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、狭い接点のファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。承認動作は、無関係な
Plugin フィールドをまたいで混在させるのではなく、1 つの `approvalCapability` 契約に統合するべきです。[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムおよび設定ヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）配下にあります。広範な `config-runtime` 互換 barrel ではなく、`config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
小さなチャネルヘルパー facade、`openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨互換 shim です。新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリーポイント（バンドル済み Plugin パッケージルートごと）:

- `index.js` — バンドル済み Plugin エントリー
- `api.js` — ヘルパー/型 barrel
- `runtime-api.js` — ランタイム専用 barrel
- `setup-entry.js` — セットアップ Plugin エントリー

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートするべきです。コアまたは別の Plugin から、別の Plugin パッケージの `src/*` をインポートしてはいけません。
facade 読み込みされたエントリーポイントは、存在する場合はアクティブなランタイム設定スナップショットを優先し、その後ディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`、`media-understanding`、`speech` などの機能固有サブパスは、現在バンドル済み Plugin が使用しているため存在します。これらは自動的に長期固定の外部契約になるわけではありません — 依存する場合は関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票などの非メッセージプリミティブについて、チャネル固有の `describeMessageTool(...)` スキーマ
コントリビューションを所有するべきです。
共有送信プレゼンテーションでは、プロバイダー固有のボタン、コンポーネント、ブロック、カードフィールドではなく、汎用 `MessagePresentation` 契約を使用するべきです。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作者チェックリストについては、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ機能を通じてレンダリング可能なものを宣言します:

- セマンティックなプレゼンテーションブロック（`text`, `context`, `divider`, `buttons`, `select`）用の `presentation`
- ピン留め配信リクエスト用の `delivery-pin`

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに劣化させるかを決定します。
汎用メッセージツールからプロバイダー固有 UI の抜け道を公開しないでください。
レガシーなネイティブスキーマ用の非推奨 SDK ヘルパーは既存のサードパーティ Plugin 向けにエクスポートされたままですが、新しい Plugin はそれらを使用するべきではありません。

## チャネルターゲット解決

チャネル Plugin は、チャネル固有のターゲットセマンティクスを所有するべきです。共有アウトバウンドホストは汎用のままにし、プロバイダールールにはメッセージングアダプターサーフェスを使用してください:

- `messaging.inferTargetChatType({ to })` は、ディレクトリ検索の前に、正規化されたターゲットを `direct`、`group`、`channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力がディレクトリ検索ではなく ID らしい解決へ直接進むべきかどうかをコアに伝えます。
- `messaging.targetResolver.reservedLiterals` は、そのプロバイダーのチャネル/セッション参照である裸の単語を列挙します。解決では、予約リテラルを拒否する前に設定済みディレクトリエントリーを保持し、その後ディレクトリミスでは fail closed します。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後に、コアが最終的なプロバイダー所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後のプロバイダー固有セッションルート構築を所有します。

推奨される分割:

- ピア/グループを検索する前に行うべきカテゴリ判断には `inferTargetChatType` を使用します。
- 「これを明示的/ネイティブターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- 広範なディレクトリ検索ではなく、プロバイダー固有の正規化フォールバックには `resolveTarget` を使用します。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダーネイティブ ID は、汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有 params 内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリーを派生する Plugin は、そのロジックを
Plugin 内に保持し、`openclaw/plugin-sdk/directory-runtime`
の共有ヘルパーを再利用するべきです。

チャネルが次のような設定に基づくピア/グループを必要とする場合に使用します:

- allowlist 駆動の DM ピア
- 設定済みチャネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを処理します:

- クエリフィルタリング
- 制限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査と ID 正規化は、Plugin 実装内に留めるべきです。

## プロバイダーカタログ

プロバイダー Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` で推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します:

- 1 つのプロバイダーエントリー用の `{ provider }`
- 複数のプロバイダーエントリー用の `{ providers }`

Plugin がプロバイダー固有のモデル ID、ベース URL デフォルト、または認証で保護されたモデルメタデータを所有する場合は `catalog` を使用します。

`catalog.order` は、Plugin のカタログが OpenClaw の組み込み暗黙プロバイダーに対していつマージされるかを制御します:

- `simple`: プレーンな API キーまたは env 駆動のプロバイダー
- `profile`: 認証プロファイルが存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリーを合成するプロバイダー
- `late`: 他の暗黙プロバイダー後の最後のパス

キー衝突では後のプロバイダーが勝つため、Plugin は同じプロバイダー ID を持つ組み込みプロバイダーエントリーを意図的に上書きできます。

Plugin は、`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて読み取り専用モデル行を公開することもできます。これは list/help/picker サーフェス向けの今後の経路であり、`text`、`voice`、`image_generation`、`video_generation`、`music_generation`
行をサポートします。プロバイダー Plugin は引き続きライブエンドポイント呼び出し、トークン交換、ベンダーレスポンスマッピングを所有し、コアは共通の行形状、ソースラベル、メディアツールヘルプ整形を所有します。メディア生成プロバイダー登録は、`defaultModel`、`models`、`capabilities` から静的カタログ行を自動的に合成します。

互換性:

- `discovery` はレガシーエイリアスとして引き続き動作しますが、非推奨警告を出します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用し、警告を出します
- `augmentModelCatalog` は非推奨です。バンドル済みプロバイダーは `registerModelCatalogProvider` を通じて補足行を公開するべきです

## 読み取り専用チャネル検査

Plugin がチャネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを優先してください。

理由:

- `resolveAccount(...)` はランタイム経路です。資格情報が完全に具体化されていると仮定でき、必要なシークレットがない場合は即座に失敗できます。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、doctor/設定
  修復フローなどの読み取り専用コマンド経路は、設定を説明するだけのためにランタイム資格情報を具体化する必要があるべきではありません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような資格情報ソース/ステータスフィールドを含めます:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するだけなら、生のトークン値を返す必要はありません。ステータス系コマンドには、`tokenStatus: "available"`（および一致する source フィールド）を返せば十分です。
- 資格情報が SecretRef 経由で設定されているものの、現在のコマンド経路で利用できない場合は `configured_unavailable` を使用します。

これにより、読み取り専用コマンドはクラッシュしたり、アカウントを未設定と誤報告したりする代わりに、「設定済みだがこのコマンド経路では利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を含む `package.json` を含めることができます:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリーは 1 つの Plugin になります。パックが複数の extensions を列挙している場合、Plugin
id は `<manifestOrPackageName>/<fileBase>` になります（manifest id が存在する場合はそれが優先され、そうでなければスコープなしの `package.json` 名になります）。

Plugin が npm deps を import する場合は、そのディレクトリでインストールして
`node_modules` を利用できるようにします（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、シンボリックリンク解決後も Plugin
ディレクトリ内に留まる必要があります。パッケージディレクトリの外へ出るエントリは
拒否されます。

セキュリティ上の注意: `openclaw plugins install` は Plugin 依存関係を
プロジェクトローカルの `npm install --omit=dev --ignore-scripts` でインストールします（ライフサイクルスクリプトなし、
実行時の dev 依存関係なし）。継承されたグローバル npm install 設定は無視されます。
Plugin の依存関係ツリーは「純粋な JS/TS」に保ち、
`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は軽量なセットアップ専用モジュールを指すことができます。
OpenClaw が無効なチャンネル Plugin のセットアップサーフェスを必要とする場合、または
チャンネル Plugin が有効でもまだ未設定の場合、完全な Plugin エントリではなく
`setupEntry` を読み込みます。これにより、メインの Plugin エントリがツール、フック、その他の実行時専用コードも
結線している場合でも、起動とセットアップを軽量に保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
は、チャンネルがすでに設定済みの場合でも、Gateway の
listen 前の起動フェーズ中にチャンネル Plugin を同じ `setupEntry` パスへオプトインできます。

これは、Gateway が listen を開始する前に存在している必要がある起動サーフェスを
`setupEntry` が完全にカバーしている場合にのみ使用してください。実際には、セットアップエントリが
起動で依存するチャンネル所有のすべての capability を登録する必要があることを意味します。例:

- チャンネル登録自体
- Gateway が listen を開始する前に利用可能である必要がある HTTP ルート
- 同じ期間中に存在している必要がある Gateway メソッド、ツール、またはサービス

完全なエントリが必要な起動 capability をまだ所有している場合は、このフラグを有効にしないでください。
Plugin はデフォルト動作のままにし、OpenClaw が起動中に
完全なエントリを読み込むようにしてください。

バンドル済みチャンネルは、完全なチャンネルランタイムが読み込まれる前に core が参照できる
セットアップ専用のコントラクトサーフェスヘルパーも公開できます。現在のセットアップ
昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、完全な Plugin エントリを読み込まずにレガシーな単一アカウントのチャンネル
設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、このサーフェスを使用します。
Matrix が現在のバンドル済みの例です。名前付きアカウントがすでに存在する場合は、auth/bootstrap キーのみを
名前付きの昇格済みアカウントへ移動し、常に
`accounts.default` を作成するのではなく、設定済みの非正規 default-account キーを保持できます。

これらのセットアップパッチアダプターにより、バンドル済みコントラクトサーフェスの検出は遅延されたままになります。import
時は軽量に保たれます。昇格サーフェスは、モジュール import 時にバンドル済みチャンネル起動へ
再突入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、
Plugin 固有の prefix に置いてください。core 管理者名前空間（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）は予約済みのままで、Plugin がより狭い scope を要求しても
常に `operator.admin` に解決されます。

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

チャンネル Plugin は `openclaw.channel` を通じてセットアップ/検出メタデータを、
`openclaw.install` を通じてインストールヒントを公開できます。これにより core カタログはデータを持たずに済みます。

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

- `detailLabel`: よりリッチなカタログ/ステータスサーフェス向けの副ラベル
- `docsLabel`: docs リンクのリンクテキストを上書き
- `preferOver`: このカタログエントリが上回るべき、より低優先度の Plugin/チャンネル id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: 送信フォーマット判断のために、チャンネルを markdown 対応としてマーク
- `exposure.configured`: `false` に設定した場合、設定済みチャンネル一覧サーフェスからチャンネルを非表示
- `exposure.setup`: `false` に設定した場合、対話型セットアップ/設定ピッカーからチャンネルを非表示
- `exposure.docs`: docs ナビゲーションサーフェス向けにチャンネルを internal/private としてマーク
- `showConfigured` / `showInSetup`: 互換性のためにまだ受け入れられるレガシーエイリアス。`exposure` を優先
- `quickstartAllowFrom`: 標準クイックスタート `allowFrom` フローへチャンネルをオプトイン
- `forceAccountBinding`: アカウントが 1 つしか存在しない場合でも、明示的なアカウント binding を要求
- `preferSessionLookupForAnnounceTarget`: announce target の解決時に session lookup を優先

OpenClaw は **外部チャンネルカタログ**（たとえば MPM
registry export）もマージできます。JSON ファイルを次のいずれかに配置してください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で
1 つ以上の JSON ファイルを指します（カンマ/セミコロン/`PATH` 区切り）。各ファイルには
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。parser は `"entries"` キーのレガシーエイリアスとして `"packages"` または `"plugins"` も受け入れます。

生成されたチャンネルカタログエントリと provider install catalog エントリは、
raw `openclaw.install` ブロックの横に正規化済み install-source facts を公開します。
正規化済み facts は、npm spec が exact version か floating
selector か、期待される integrity メタデータが存在するか、ローカル
source path も利用可能かを識別します。カタログ/パッケージ identity が判明している場合、
正規化済み facts は、解析された npm package name がその identity からずれていると警告します。
また、`defaultChoice` が無効な場合、または利用できない source を指す場合、
および有効な npm source なしで npm integrity メタデータが存在する場合にも警告します。
consumer は `installSource` を加算的な任意フィールドとして扱う必要があります。これにより、
手作業で作られたエントリや catalog shim がそれを合成する必要はありません。
これにより、オンボーディングと診断は Plugin runtime を import せずに
source-plane state を説明できます。

公式の外部 npm エントリでは、exact `npmSpec` と
`expectedIntegrity` を優先してください。bare package name と dist-tag は互換性のため引き続き動作しますが、
source-plane warning を表示するため、既存の Plugin を壊さずにカタログを
pinned かつ integrity-checked な install へ移行できます。
オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` と
workspace-relative な `sourcePath` を持つ managed plugin
plugin index entry を記録します。絶対の operational load path は
`plugins.load.paths` に残ります。install record は、ローカルワークステーション
path を長寿命の config へ重複して入れることを避けます。これにより、local development install は
source-plane 診断から見えるままにしつつ、2 つ目の raw filesystem-path disclosure
surface を追加しません。永続化された `installed_plugin_index` SQLite テーブルは install
source of truth であり、Plugin runtime module を読み込まずに refresh できます。
その `installRecords` map は、Plugin manifest が欠落または無効でも durable です。
その `plugins` payload は rebuild 可能な manifest view です。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、ingest、assembly、
compaction のための session context orchestration を所有します。Plugin から
`api.registerContextEngine(id, factory)` で登録し、active engine を
`plugins.slots.contextEngine` で選択します。

Plugin が memory search や hook を追加するだけでなく、デフォルトの context
pipeline を置き換える、または拡張する必要がある場合に使用してください。

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

factory `ctx` は、構築時の初期化向けに任意の `config`、`agentDir`、`workspaceDir`
値を公開します。

active harness が persistent backend thread を持つ場合、`assemble()` は
`contextProjection` を返すことができます。レガシーな per-turn projection では省略してください。
assembled context を backend thread に一度だけ注入し、epoch が変わるまで再利用する必要がある場合は
`{ mode: "thread_bootstrap", epoch }` を返します。
engine 所有の compaction pass 後など、engine の semantic context が変化したら
epoch を変更してください。host は thread-bootstrap projection 内で tool-call metadata、input
shape、redacted tool results を保持できるため、新しい
backend thread は raw secret-bearing payload をコピーせずに tool continuity を維持できます。

engine が compaction algorithm を所有して**いない**場合は、`compact()` を
実装したまま明示的に委譲してください。

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

## 新しい capability の追加

Plugin が現在の API に合わない挙動を必要とする場合、private な reach-in で
Plugin system を迂回しないでください。不足している capability を追加してください。

推奨される手順:

1. **core contract を定義します。** core が所有すべき shared behavior を決めます:
   policy、fallback、config merge、lifecycle、channel-facing semantics、
   runtime helper shape。
2. **typed plugin registration/runtime surface を追加します。** `OpenClawPluginApi` や
   `api.runtime` を、最小限で有用な typed
   capability surface で拡張します。
3. **core + channel/feature consumer を結線します。** チャンネルと feature Plugin は、
   vendor 実装を直接 import するのではなく、core 経由で新しい capability を
   consume するべきです。
4. **vendor implementation を登録します。** その後、vendor Plugin が
   capability に対して backend を登録します。
5. **contract coverage を追加します。** ownership と registration shape が
   時間が経っても明示的なままになるよう、テストを追加します。

これにより、OpenClaw は特定の provider の世界観へ hardcode されずに、opinionated なままでいられます。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/adding-capabilities) を参照してください。

### capability チェックリスト

新しい capability を追加する場合、実装は通常、これらの
surface をまとめて触る必要があります。

- `src/<capability>/types.ts` のコア契約型
- `src/<capability>/runtime.ts` のコアランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ接続
- 機能/チャネル Plugin が利用する必要がある場合の
  `src/plugins/runtime/*` における Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ/テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` のオペレーター/Plugin ドキュメント

これらのサーフェスのいずれかが欠けている場合、通常はそのケイパビリティが
まだ完全には統合されていないことを示します。

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

契約テストパターン（`src/plugins/contracts/registry.ts` は
`providerContractPluginIds` などの所有権ルックアップを公開します。テストでは、
Plugin の `contracts.videoGenerationProviders` リストが実際に登録する内容と一致することをアサートします）:

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

これによりルールはシンプルに保たれます:

- コアはケイパビリティ契約 + オーケストレーションを所有する
- ベンダー Plugin はベンダー実装を所有する
- 機能/チャネル Plugin はランタイムヘルパーを利用する
- 契約テストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開ケイパビリティモデルと形状
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
