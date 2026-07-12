---
read_when:
    - プロバイダーのランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しいPlugin機能またはコンテキストエンジンPluginの追加
summary: Plugin アーキテクチャの内部構造：読み込みパイプライン、レジストリ、ランタイムフック、HTTP ルート、リファレンステーブル
title: Pluginアーキテクチャの内部構造
x-i18n:
    generated_at: "2026-07-12T14:42:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の構成、および所有権／実行契約については、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページでは、ロードパイプライン、レジストリ、ランタイムフック、Gateway HTTP ルート、インポートパス、スキーマテーブルという内部メカニズムについて説明します。

## ロードパイプライン

起動時に、OpenClaw はおおむね次の処理を行います。

1. Plugin の候補ルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読み取る
3. 安全でない候補を拒否する
4. Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補を有効にするかどうかを決定する
6. 有効なネイティブモジュールをロードする。ビルド済みの同梱モジュールにはネイティブローダーを使用し、
   サードパーティのローカルソース TypeScript には緊急用の Jiti フォールバックを使用する
7. ネイティブの `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. レジストリをコマンド／ランタイムサーフェスに公開する

<Note>
`activate` は `register` のレガシーエイリアスです。ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。同梱されているすべての Plugin は `register` を使用しています。新しい Plugin では `register` を推奨します。
</Note>

安全性ゲートは、ランタイムでの実行**前**に適用されます。次の場合、検出処理は候補をブロックします。

- 解決されたエントリが Plugin ルートの外部を指している
- パス（またはそのルートディレクトリ）が全ユーザーによる書き込みを許可している
- 同梱されていない Plugin で、パスの所有者が現在の uid（または root）と一致しない

全ユーザーによる書き込みが許可されている同梱ディレクトリについては、ゲートによる再チェックの前に、まずその場で `chmod` による修復が試行されます（npm／グローバルインストールでは、パッケージディレクトリが `0777` で配布される場合があります）。同梱元については、所有権チェックが完全にスキップされます。

ブロックされた候補についても、Plugin ID が判明している場合は、出力される診断にその ID が含まれます（拒否対象となったディレクトリ内のマニフェストから解決された ID を含みます）。そのため、その ID を参照する設定では、無関係な「不明な Plugin」エラーではなく、パスの安全性に関する警告に紐づいたブロック済み Plugin として扱われます。

### マニフェスト優先の動作

マニフェストは、コントロールプレーンにおける信頼できる唯一の情報源です。OpenClaw はマニフェストを使用して次の処理を行います。

- Plugin を識別する
- 宣言されたチャネル／Skills／設定スキーマまたはバンドル機能を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル／プレースホルダーを拡充する
- インストール／カタログのメタデータを表示する
- Plugin ランタイムを読み込まずに、低コストなアクティベーションおよびセットアップ記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーン部分です。フック、ツール、コマンド、プロバイダーフローなどの実際の動作を登録します。

オプションのマニフェスト `activation` および `setup` ブロックは、コントロールプレーンに残ります。これらはアクティベーション計画とセットアップ検出のためのメタデータのみの記述子であり、ランタイム登録、`register(...)`、`setupEntry` の代わりにはなりません。ライブアクティベーションのコンシューマーは、マニフェストのコマンド、チャネル、プロバイダーのヒントを使用して、より広範なレジストリの実体化より前に Plugin の読み込み対象を絞り込みます。

- CLI の読み込みでは、要求されたプライマリコマンドを所有する Plugin に絞り込む
- チャネルのセットアップ／Plugin の解決では、要求されたチャネル ID を所有する Plugin に絞り込む
- 明示的なプロバイダーのセットアップ／ランタイムの解決では、要求されたプロバイダー ID を所有する Plugin に絞り込む
- Gateway の起動計画では、明示的な起動時インポートに `activation.onStartup` を使用する。起動メタデータのない Plugin は、より限定的なアクティベーショントリガーを通じてのみ読み込まれる

アクティベーションプランナーは、既存の呼び出し元向けの ID のみの API と、診断向けの計画 API の両方を公開します。計画エントリは Plugin が選択された理由を報告し、明示的な `activation.*` ヒントとマニフェスト所有権によるフォールバックを区別します。

| 理由（`activation.*` ヒント由来）   | 理由（マニフェストの所有権由来）                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner`（`channels`）                                                        |
| `activation-command-hint`            | `manifest-command-alias`（`commandAliases`）                                                  |
| `activation-provider-hint`           | `manifest-provider-owner`（`providers`）、`manifest-setup-provider-owner`（`setup.providers`） |
| `activation-route-hint`              | —                                                                                            |
| —（フックトリガーにはヒントのバリアントなし） | `manifest-hook-owner`（`hooks`）、`manifest-tool-contract`（`contracts.tools`）                |

この理由の分割が互換性の境界です。既存のPluginメタデータは引き続き機能し、
新しいコードはランタイムの読み込みセマンティクスを変更せずに、広範なヒントや
フォールバック動作を検出できます。

広範な`all`スコープを要求するリクエスト時のランタイムプリロードでも、
構成、起動計画、構成済みチャンネル、スロット、自動有効化ルールから、
明示的な実効Plugin IDセットを引き続き導出します
（`src/plugins/effective-plugin-ids.ts`の`resolveEffectivePluginIds`）。
導出されたセットが空の場合、OpenClawは検出可能なすべてのPluginへ
拡大せず、スコープを空のまま維持します。

セットアップ検出では、まず `setup.providers` や
`setup.cliBackends` などのディスクリプター所有 ID を使用して候補 Plugin を絞り込み、
その後、セットアップ時のランタイムフックが引き続き必要な Plugin に対して
`setup-api` へフォールバックします。プロバイダーのセットアップ一覧では、
プロバイダーランタイムを読み込まずに、マニフェストの `providerAuthChoices`、
ディスクリプターから導出されたセットアップ選択肢、およびインストールカタログの
メタデータを使用します。明示的な `setup.requiresRuntime: false` は
ディスクリプターのみを使用する打ち切り条件です。`requiresRuntime` を省略した場合は、
互換性のため従来の setup-api フォールバックが維持されます。検出された複数の
Plugin が、正規化された同一のセットアッププロバイダー ID または CLI バックエンド
ID の所有権を主張する場合、セットアップ検索は検出順序に依存せず、曖昧な所有者を
拒否します。セットアップランタイムが実行される場合、レジストリ診断は従来の
Plugin をブロックすることなく、`setup.providers` / `setup.cliBackends` と、
setup-api によって実際に登録されたプロバイダーまたは CLI バックエンドとの不一致を
報告します。

### Plugin キャッシュの境界

OpenClaw は、Plugin の検出結果やマニフェストレジストリの直接データを、
実時間に基づく期間の背後にキャッシュしません。インストール、マニフェストの編集、
およびロードパスの変更は、次回の明示的なメタデータ読み取りまたはスナップショット
再構築時に反映されなければなりません。マニフェストファイルのパーサーは、開いた
マニフェストのパスに加えて、デバイス/inode、サイズ、mtime/ctime をキーとする、
上限付きのファイルシグネチャキャッシュを保持します。このキャッシュは変更されて
いないバイト列の再解析を回避するだけであり、検出、レジストリ、所有者、または
ポリシーに関する結果をキャッシュしてはなりません。

安全なメタデータ高速パスとは、隠れたキャッシュではなく、明示的なオブジェクト所有権です。
Gateway の起動時のホットパスでは、現在の `PluginMetadataSnapshot`、
派生した `PluginLookUpTable`、または明示的なマニフェストレジストリを呼び出し
チェーン全体で渡す必要があります。設定の検証、起動時の自動有効化、plugin のブートストラップ、プロバイダーの
選択では、それらが現在の設定と
plugin インベントリを表している間、これらのオブジェクトを再利用できます。セットアップ時の検索では、特定のセットアップパスが明示的なマニフェストレジストリを受け取らない限り、
引き続き必要に応じてマニフェストメタデータを再構築します。隠れた検索キャッシュを追加するのではなく、
コールドパスのフォールバックとして維持してください。
入力が変更された場合は、スナップショットを変更したり
履歴コピーを保持したりせず、再構築して置き換えてください。アクティブな plugin レジストリのビューと、バンドルされた
チャネルのブートストラップヘルパーは、現在の
レジストリ／ルートから再計算する必要があります。処理の重複排除や
再入防止のために、1 回の呼び出し内で短時間だけ使用するマップは問題ありませんが、
プロセスのメタデータキャッシュにしてはなりません。

plugin の読み込みにおける永続キャッシュレイヤーは、ランタイム読み込みです。コードやインストール済みアーティファクトが実際に読み込まれる場合には、
次のようなローダー状態を再利用できます。

- `PluginLoaderCacheState` および互換性のあるアクティブなランタイムレジストリ
- 同じランタイムサーフェスを繰り返しインポートしないために使用される
  jiti／モジュールキャッシュおよび公開サーフェスのローダーキャッシュ
- インストール済み plugin アーティファクト用のファイルシステムキャッシュ
- パスの正規化や重複解決のための、呼び出しごとの短時間マップ

これらのキャッシュはデータプレーンの実装詳細です。呼び出し元が意図的にランタイム読み込みを要求した場合を除き、
「どの plugin がこのプロバイダーを所有しているか？」のような
コントロールプレーンの問いに答えてはなりません。

次の項目に対して、永続キャッシュまたは実時間ベースのキャッシュを追加しないでください。

- 検出結果
- 直接のマニフェストレジストリ
- インストール済み plugin インデックスから再構築されたマニフェストレジストリ
- プロバイダー所有者の検索、モデルの抑制、プロバイダーポリシー、または公開アーティファクトの
  メタデータ
- マニフェスト、インストール済みインデックス、
  または読み込みパスの変更が次回のメタデータ読み取りで反映されるべき、その他のマニフェスト由来の回答

永続化されたインストール済み plugin
インデックスからマニフェストメタデータを再構築する呼び出し元は、必要に応じてそのレジストリを再構築します。インストール済みインデックスは永続的な
ソースプレーン状態であり、隠れたプロセス内メタデータキャッシュではありません。

## レジストリモデル

読み込まれた plugin は、無関係なコアのグローバル変数を直接変更しません。中央の
plugin レジストリ（`src/plugins/registry-types.ts` の `PluginRegistry`）に登録されます。
このレジストリは、plugin レコード（識別情報、ソース、出所、ステータス、診断）
に加え、ツール、レガシーフックと型付きフック、
チャネル、プロバイダー、Gateway RPC ハンドラー、HTTP ルート、CLI レジストラー、
バックグラウンドサービス、plugin 所有のコマンド、さらに数十種類の型付きプロバイダー
ファミリー（音声、埋め込み、画像／動画／音楽生成、Web
フェッチ／検索、エージェントハーネス、セッションアクションなど）という、すべての機能の配列を追跡します。

その後、コア機能は plugin
モジュールと直接通信するのではなく、そのレジストリから読み取ります。これにより、読み込みは一方向に保たれます。

- plugin モジュール -> レジストリへの登録
- コアランタイム -> レジストリの利用

この分離は保守性にとって重要です。つまり、ほとんどのコアサーフェスに必要な統合ポイントは
「レジストリを読み取る」の 1 つだけであり、「各
plugin モジュールを個別処理する」必要はありません。

## 会話バインディングのコールバック

会話をバインドする plugin は、承認が解決されたときに反応できます。

バインド要求が承認または拒否された後にコールバックを受け取るには、
`api.onConversationBindingResolved(...)` を使用します。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // この plugin と会話のバインディングが作成されました。
        console.log(event.binding?.conversationId);
        return;
      }

      // 要求が拒否されたため、ローカルの保留状態をすべてクリアします。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバックペイロードのフィールド：

- `status`：`"approved"` または `"denied"`
- `decision`：`"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`：承認された要求に対して解決されたバインディング
- `request`：元の要求の概要、デタッチのヒント、送信者 ID、
  および会話メタデータ

このコールバックは通知専用です。会話のバインドを許可される主体を変更するものではなく、
コアの承認処理が完了した後に実行されます。

## プロバイダーのランタイムフック

プロバイダー plugin には 3 つのレイヤーがあります。

- 安価なランタイム前検索用の **マニフェストメタデータ**：
  `setup.providers[].envVars`、非推奨の互換性用 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、および `channelEnvVars`。
- **設定時フック**：`catalog`（レガシーの `discovery`）と
  `applyConfigDefaults`。
- **ランタイムフック**：認証、モデル解決、
  ストリームのラップ、思考レベル、リプレイポリシー、使用量エンドポイントを扱う 40 個以上のオプションフック。詳しくは
  [フックの順序と使用方法](#hook-order-and-usage)を参照してください。

OpenClaw は引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、
およびツールポリシーを所有します。これらのフックは、完全にカスタムの推論トランスポートを必要とせずに、
プロバイダー固有の動作を実装するための拡張サーフェスです。

汎用の認証、ステータス、モデル選択の各経路が、Plugin ランタイムを読み込まずに参照すべき環境変数ベースの認証情報をプロバイダーが持つ場合は、マニフェストの `setup.providers[].envVars` を使用します。非推奨の `providerAuthEnvVars` は、非推奨期間中は互換性アダプターによって引き続き読み込まれ、これを使用する非バンドル Plugin にはマニフェスト診断が通知されます。あるプロバイダー ID で別のプロバイダー ID の環境変数、認証プロファイル、設定に基づく認証、API キーのオンボーディング選択肢を再利用する場合は、マニフェストの `providerAuthAliases` を使用します。オンボーディングや認証選択用の CLI サーフェスが、プロバイダーランタイムを読み込まずにプロバイダーの選択肢 ID、グループラベル、単一フラグによる簡単な認証配線を把握する必要がある場合は、マニフェストの `providerAuthChoices` を使用します。オンボーディングラベルや OAuth クライアント ID／クライアントシークレットの設定変数など、オペレーター向けのヒントには、プロバイダーランタイムの `envVars` を使用します。

汎用のシェル環境変数フォールバック、設定／ステータスチェック、セットアッププロンプトが、チャンネルランタイムを読み込まずに参照すべき環境変数駆動の認証またはセットアップをチャンネルが持つ場合は、マニフェストの `channelEnvVars` を使用します。

### フックの順序と使用方法

モデル／プロバイダー Plugin について、OpenClaw はおおむね次の順序でフックを呼び出します。
「使用するタイミング」列は、判断のためのクイックガイドです。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw がすでに呼び出さなくなった互換性専用のプロバイダーフィールドは、意図的にここには記載していません。

| フック                            | 機能                                                                                                           | 使用する場面                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | `models.json` の生成時にプロバイダー設定を `models.providers` に公開する                                       | プロバイダーがカタログまたはベース URL のデフォルトを所有する場合                                                                            |
| `applyConfigDefaults`             | 設定の実体化時に、プロバイダー所有のグローバル設定のデフォルトを適用する                                       | デフォルトが認証モード、環境変数、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                          |
| _(組み込みモデル検索)_           | OpenClaw は最初に通常のレジストリ／カタログ経路を試す                                                          | _(Plugin フックではない)_                                                                                                                     |
| `normalizeModelId`                | 検索前にレガシーまたはプレビュー版のモデル ID エイリアスを正規化する                                          | 正規モデルを解決する前のエイリアス整理をプロバイダーが所有する場合                                                                           |
| `normalizeTransport`              | 汎用モデルを組み立てる前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                            | 同じトランスポートファミリーに属するカスタムプロバイダー ID のトランスポート整理をプロバイダーが所有する場合                                   |
| `normalizeConfig`                 | ランタイム／プロバイダーを解決する前に `models.providers.<id>` を正規化する                                    | Plugin 側に置くべき設定整理がプロバイダーに必要な場合。バンドルされた Google ファミリーのヘルパーも、対応する Google 設定エントリを補完する    |
| `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブストリーミング使用量の互換性書き換えを適用する                                    | エンドポイントに応じたネイティブストリーミング使用量メタデータの修正がプロバイダーに必要な場合                                                |
| `resolveConfigApiKey`             | ランタイム認証を読み込む前に、設定プロバイダーの環境変数マーカー認証を解決する                                | プロバイダーが独自の環境変数マーカーによる API キー解決フックを公開する場合                                                                  |
| `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル／セルフホストまたは設定ベースの認証を提示する                                     | プロバイダーが合成／ローカル認証情報マーカーで動作できる場合                                                                                  |
| `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ね合わせる。CLI／アプリ所有の認証情報では、デフォルトの `persistence` は `runtime-only` | コピーしたリフレッシュトークンを永続化せずに、プロバイダーが外部認証情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーの優先順位を、環境変数／設定ベースの認証より下げる                  | 優先されるべきでない合成プレースホルダープロファイルをプロバイダーが保存する場合                                                              |
| `resolveDynamicModel`             | ローカルレジストリにまだ存在しないプロバイダー所有のモデル ID に対する同期フォールバック                      | プロバイダーが任意のアップストリームモデル ID を受け入れる場合                                                                                |
| `prepareDynamicModel`             | 非同期ウォームアップ後に `resolveDynamicModel` を再実行する                                                   | 不明な ID を解決する前にネットワークメタデータがプロバイダーに必要な場合                                                                      |
| `normalizeResolvedModel`          | 組み込みランナーが解決済みモデルを使用する前の最終書き換え                                                    | コアトランスポートを引き続き使用しながら、トランスポートの書き換えがプロバイダーに必要な場合                                                    |
| `normalizeToolSchemas`            | 組み込みランナーに渡す前にツールスキーマを正規化する                                                          | トランスポートファミリー固有のスキーマ整理がプロバイダーに必要な場合                                                                          |
| `inspectToolSchemas`              | 正規化後にプロバイダー所有のスキーマ診断を提示する                                                            | プロバイダー固有のルールをコアに持ち込まずに、キーワード警告を提示したい場合                                                                  |
| `resolveReasoningOutputMode`      | ネイティブまたはタグ付きの推論出力契約を選択する                                                              | ネイティブフィールドではなく、タグ付きの推論／最終出力がプロバイダーに必要な場合                                                              |
| `prepareExtraParams`              | 汎用ストリームオプションのラッパーを適用する前に、リクエストパラメーターを正規化する                          | デフォルトのリクエストパラメーターまたはプロバイダーごとのパラメーター整理が必要な場合                                                        |
| `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                                | 単なるラッパーではなく、カスタムワイヤープロトコルがプロバイダーに必要な場合                                                                  |
| `wrapStreamFn`                    | 汎用ラッパーの適用後にストリームをラップする                                                                  | カスタムトランスポートを使わずに、リクエストヘッダー／本文／モデルの互換性ラッパーがプロバイダーに必要な場合                                    |
| `resolveTransportTurnState`       | ターンごとのネイティブトランスポートヘッダーまたはメタデータを付加する                                        | 汎用トランスポートからプロバイダーネイティブのターン識別情報を送信したい場合                                                                  |
| `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションのクールダウンポリシーを付加する                                 | 汎用 WS トランスポートのセッションヘッダーまたはフォールバックポリシーを調整したい場合                                                        |
| `formatApiKey`                    | 認証プロファイルのフォーマッター：保存済みプロファイルをランタイムの `apiKey` 文字列に変換する                | プロバイダーが追加の認証メタデータを保存し、カスタムのランタイムトークン形式を必要とする場合                                                    |
| `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュオーバーライド      | プロバイダーが OpenClaw の共有リフレッシャーに適合しない場合                                                                                  |
| `buildAuthDoctorHint`             | OAuth のリフレッシュ失敗時に追加される修復ヒント                                                              | リフレッシュ失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合                                                                        |
| `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウ超過判定                                                              | 汎用ヒューリスティクスでは検出できない未加工の超過エラーがプロバイダーにある場合                                                              |
| `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                    | 未加工の API／トランスポートエラーをレート制限／過負荷などにプロバイダーがマッピングできる場合                                                |
| `isCacheTtlEligible`              | プロキシ／バックホールプロバイダー向けのプロンプトキャッシュポリシー                                          | プロキシ固有のキャッシュ TTL 制御がプロバイダーに必要な場合                                                                                   |
| `buildMissingAuthMessage`         | 汎用の認証不足復旧メッセージを置き換える                                                                      | プロバイダー固有の認証不足復旧ヒントが必要な場合                                                                                              |
| `augmentModelCatalog`             | 検出後に合成／最終カタログ行を追加する（非推奨、以下を参照）                                                   | `models list` と選択画面に、合成された前方互換行がプロバイダーに必要な場合                                                                    |
| `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                    | 選択したモデル向けにカスタム思考段階または二値ラベルをプロバイダーが公開する場合                                                              |
| `isBinaryThinking`                | 推論のオン／オフ切り替え互換性フック                                                                          | プロバイダーが二値の思考オン／オフのみを公開する場合                                                                                          |
| `supportsXHighThinking`           | `xhigh` 推論サポートの互換性フック                                                                             | モデルの一部にのみ `xhigh` を有効にしたい場合                                                                                                 |
| `resolveDefaultThinkingLevel`     | デフォルトの `/think` レベル互換性フック                                                                       | モデルファミリーのデフォルト `/think` ポリシーをプロバイダーが所有する場合                                                                    |
| `isModernModelRef`                | ライブプロファイルのフィルターとスモーク選択向けのモダンモデル判定                                            | ライブ／スモークで優先するモデルの判定をプロバイダーが所有する場合                                                                            |
| `prepareRuntimeAuth`              | 推論の直前に、設定済みの認証情報を実際のランタイムトークン／キーに交換する                                    | トークン交換または短期間有効なリクエスト認証情報がプロバイダーに必要な場合                                                                    |
| `resolveUsageAuth`                | `/usage` および関連するステータス画面向けの使用量／請求認証情報を解決する                                     | カスタムの使用量／クォータトークン解析、または別の使用量認証情報がプロバイダーに必要な場合                                                      |
| `fetchUsageSnapshot`              | 認証の解決後に、プロバイダー固有の使用量／クォータスナップショットを取得して正規化する                         | プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要な場合                                                                    |
| `createEmbeddingProvider`         | メモリ／検索用のプロバイダー所有埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダーPluginが担う                                                                                    |
| `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにカスタムトランスクリプトポリシー（たとえば、思考ブロックの除去）が必要                                                               |
| `sanitizeReplayHistory`           | 汎用的なトランスクリプトのクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーに、共有Compactionヘルパーの範囲を超えたプロバイダー固有のリプレイ書き換えが必要                                                             |
| `validateReplayTurns`             | 組み込みランナーの実行前に、リプレイターンの最終検証または再整形を行う                                           | プロバイダーのトランスポートに、汎用的なサニタイズ後のより厳格なターン検証が必要                                                                    |
| `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったときに、プロバイダーにテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダーPluginを確認し、その後、モデル ID またはトランスポート／設定を実際に変更するものが見つかるまで、フック対応のほかのプロバイダーPluginへフォールスルーします。これにより、呼び出し側が書き換えを所有するバンドルPluginを把握していなくても、エイリアス／互換プロバイダーシムが機能し続けます。サポート対象の Google 系設定エントリをプロバイダーフックが書き換えなかった場合でも、バンドルされた Google 設定ノーマライザーがその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムなワイヤープロトコルまたはカスタムリクエスト実行機構を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き動作するプロバイダーの振る舞いを対象としています。

`resolveUsageAuth` は、OpenClaw が `fetchUsageSnapshot` を呼び出すか、使用量／ステータス画面向けの汎用認証情報解決にフォールバックするかを決定します。プロバイダーに使用量取得用の認証情報がある場合は `{ token, accountId?, subscriptionType?, rateLimitTier? }` を返します（オプションのプランメタデータは `fetchUsageSnapshot` に渡されます）。プロバイダー所有の使用量認証がリクエストを処理済みで、汎用 API キー／OAuth フォールバックを抑止する必要がある場合は `{ handled: true }` を返します。プロバイダーが使用量認証を処理しなかった場合は `null` または `undefined` を返します。

組織または請求用の認証情報は、マニフェストの `providerUsageAuthEnvVars` で宣言します。これにより、それらを推論認証の候補にすることなく、汎用の検出処理とシークレット除去処理が認識できます。

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

バンドルされたプロバイダーPluginは、各ベンダーのカタログ、認証、思考、リプレイ、使用量の要件に適合するよう、上記のフックを組み合わせます。正式なフックセットは `extensions/` 以下の各Pluginに存在します。このページでは一覧を複製するのではなく、その構成を例示します。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的カタログより先にアップストリームのモデル ID を公開できるようにします。
  </Accordion>
  <Accordion title="OAuth および使用量エンドポイントのプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は、
    `prepareRuntimeAuth` または `formatApiKey` と `resolveUsageAuth` +
    `fetchUsageSnapshot` を組み合わせ、トークン交換と `/usage` 連携を所有します。
  </Accordion>
  <Accordion title="リプレイおよびトランスクリプトクリーンアップのファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各Pluginがクリーンアップを再実装する代わりに、`buildReplayPolicy` を介してトランスクリプトポリシーを選択できます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、
    `volcengine` は `catalog` のみを登録し、共有推論ループを利用します。
  </Accordion>
  <Accordion title="Anthropic 固有のストリームヘルパー">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく、Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Pluginは、`api.runtime` を介して選択されたコアヘルパーにアクセスできます。TTS の場合：

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

- `textToSpeech` は、ファイル／ボイスノート画面向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファとサンプルレートを返します。Pluginはプロバイダー向けにリサンプリング／エンコードする必要があります。
- `listVoices` はプロバイダーごとにオプションです。ベンダー所有の音声選択画面またはセットアップフローに使用します。
- コアは解決済みのリクエスト期限をプロバイダーの `listVoices` フックに渡します。プロバイダー固有のタイムアウト設定で上書きできます。
- 音声一覧には、プロバイダー対応の選択画面向けに、ロケール、性別、パーソナリティタグなどの詳細なメタデータを含められます。
- 現在、OpenAI と ElevenLabs は電話音声をサポートしています。Microsoft はサポートしていません。

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

注：

- TTS ポリシー、フォールバック、返信配信はコアに保持します。
- ベンダー所有の音声合成の振る舞いには、音声プロバイダーを使用します。
- 従来の Microsoft `edge` 入力は、`microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは企業単位です。OpenClaw がこれらの機能コントラクトを追加するにつれて、1 つのベンダーPluginがテキスト、音声、画像、将来のメディアプロバイダーを所有できます。

画像／音声／動画理解では、Pluginは汎用のキー／値バッグではなく、型付けされた単一のメディア理解プロバイダーを登録します。

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

- オーケストレーション、フォールバック、設定、チャネル配線はコアに保持します。
- ベンダーの振る舞いはプロバイダーPluginに保持します。
- 追加による拡張では型付けを維持する必要があります。新しいオプションメソッド、新しいオプション結果フィールド、新しいオプション機能として追加します。
- 動画生成はすでに同じパターンに従っています。
  - コアが機能コントラクトとランタイムヘルパーを所有する
  - ベンダーPluginが `api.registerVideoGenerationProvider(...)` を登録する
  - 機能／チャネルPluginが `api.runtime.videoGeneration.*` を使用する

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

音声文字起こしでは、Pluginはメディア理解ランタイムまたは以前の STT エイリアスのいずれかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注：

- `api.runtime.mediaUnderstanding.*` は、画像／音声／動画理解の推奨共有インターフェースです。
- `extractStructuredWithModel(...)` は、範囲を限定したプロバイダー所有の画像優先抽出のためのPlugin向け境界です。画像入力を少なくとも 1 つ含めてください。テキスト入力は補足コンテキストです。製品Pluginがルートとスキーマを所有し、OpenClaw がプロバイダー／ランタイム境界を所有します。
- コアのメディア理解音声設定（`tools.media.audio`）とプロバイダーのフォールバック順序を使用します。
- 文字起こし出力が生成されない場合（たとえば、入力がスキップされた場合や未対応の場合）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換エイリアスとして引き続き使用できます。

Pluginは `api.runtime.subagent` を介してバックグラウンドのサブエージェント実行を開始することもできます。

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

- `provider` と `model` は実行ごとのオプションの上書きであり、永続的なセッション変更ではありません。
- OpenClaw は、信頼された呼び出し元に対してのみこれらの上書きフィールドを適用します。
- Plugin所有のフォールバック実行では、オペレーターが `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的に有効化する必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、信頼されたPluginを特定の正規 `provider/model` ターゲットに制限するか、任意のターゲットを明示的に許可する場合は `"*"` を使用します。
- 信頼されていないPluginのサブエージェント実行も引き続き機能しますが、上書きリクエストは暗黙的にフォールバックせず拒否されます。
- Pluginが作成したサブエージェントセッションには、作成元のPlugin ID がタグ付けされます。フォールバックの `api.runtime.subagent.deleteSession(...)` が削除できるのは、それらの所有セッションのみです。任意のセッションを削除するには、引き続き管理者スコープの Gateway リクエストが必要です。

ウェブ検索では、Pluginはエージェントツールの配線へ直接アクセスする代わりに、共有ランタイムヘルパーを使用できます。

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

Pluginは `api.registerWebSearchProvider(...)` を介してウェブ検索プロバイダーを登録することもできます。

注：

- プロバイダー選択、認証情報の解決、共有リクエストのセマンティクスはコアに保持します。
- ベンダー固有の検索トランスポートには、ウェブ検索プロバイダーを使用します。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せず検索動作を必要とする機能／チャネルPlugin向けの推奨共有インターフェースです。

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

- `generate(...)`：設定済みの画像生成プロバイダーチェーンを使用して画像を生成します。
- `listProviders(...)`：利用可能な画像生成プロバイダーとその機能を一覧表示します。

## Gateway HTTP ルート

Pluginは `api.registerHttpRoute(...)` を使用して HTTP エンドポイントを公開できます。

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

ルートのフィールド:

- `path`: Gateway HTTP サーバー配下のルートパス。
- `auth`: 必須。`"gateway"` または `"plugin"`。通常の Gateway 認証を要求するには `"gateway"`、Plugin が管理する認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `handleUpgrade`: 同じルート上の WebSocket アップグレードリクエスト用の任意のハンドラー。
- `replaceExisting`: 任意。同じ Plugin が自身の既存のルート登録を置き換えられるようにします。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、使用すると Plugin の読み込みエラーが発生します。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin のルートでは `auth` を明示的に宣言する必要があります。
- `replaceExisting: true` でない限り、同一の `path + match` の競合は拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- 異なる `auth` レベルのルート同士が重複する場合は拒否されます。`exact`/`prefix` のフォールスルーチェーンでは、同じ認証レベルのみを使用してください。
- `auth: "plugin"` のルートには、オペレーターのランタイムスコープが自動的には付与され**ません**。これは Plugin が管理する Webhook/署名検証用であり、特権 Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` のルートは、Gateway リクエストのランタイムスコープ内で実行されます。デフォルトのサーフェス（`gatewayRuntimeScopeSurface: "write-default"`）は意図的に保守的です。
  - 共有シークレットの Bearer 認証（`gateway.auth.mode = "token"` / `"password"`）および信頼済みプロキシ以外の認証方式には、呼び出し元が `x-openclaw-scopes` を送信した場合でも、単一の `operator.write` スコープのみが付与されます
  - 明示的な `x-openclaw-scopes` ヘッダーがない `trusted-proxy` の呼び出し元についても、従来どおり `operator.write` のみのサーフェスが維持されます
  - `x-openclaw-scopes` を送信する `trusted-proxy` の呼び出し元には、代わりに宣言されたスコープが付与されます
  - ルートで `gatewayRuntimeScopeSurface: "trusted-operator"` を指定すると、アイデンティティを伴う認証モードでは常に `x-openclaw-scopes` を尊重できます（ヘッダーがない場合は CLI のデフォルトスコープ一式にフォールバックします）
- 実用上の原則: Gateway 認証を使用する Plugin ルートが暗黙の管理者サーフェスであると想定しないでください。ルートに管理者限定の動作が必要な場合は、`trusted-operator` スコープサーフェスを指定し、アイデンティティを伴う認証モードを要求したうえで、明示的な `x-openclaw-scopes` ヘッダーの契約を文書化してください。
- ルートの照合と認証の後、通常のハンドラーは Gateway のルート作業受付に従います。準備中または再起動中の Gateway は、ハンドラーを呼び出す前に `503` を返します。限定的な例外として、マニフェストで権限を付与された `auth: "gateway"` ルートが、そのルート固有の `trusted-operator` サーフェスも指定している場合があります。このルートは、一時停止制御のディスパッチが到達不能にならないよう引き続き到達可能ですが、同じ Plugin の通常の兄弟ルートは受付境界の内側に留まります。WebSocket の `handleUpgrade` の所有権にも、同じアトミックな受付境界が適用されます。ハンドラーがソケットを受け入れた後のソケットの存続期間は Plugin が所有し、この境界では追跡されません。

## Plugin SDK のインポートパス

新しい Plugin を作成する場合は、モノリシックな `openclaw/plugin-sdk` ルート
バレルではなく、用途を限定した SDK サブパスを使用してください。コアのサブパス:

| サブパス                            | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャネルのエントリ/ビルドヘルパー                  |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括的な契約                     |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` の Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、用途を限定した一連のシーム — `channel-setup`、
`setup-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-outbound`、
`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets`、`channel-actions` — から選択します。承認動作は、関連のない
Plugin フィールド間に分散させず、単一の `approvalCapability` 契約に集約する必要があります。
[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムおよび設定ヘルパーは、対応する用途別の `*-runtime` サブパス
（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、
`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、
`channel-activity-runtime` など）にあります。広範な `config-runtime` 互換バレルではなく、
`config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot`、
`config-mutation` を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/channel-lifecycle`、
小規模なチャネルヘルパーファサード、`openclaw/plugin-sdk/outbound-runtime`、
`openclaw/plugin-sdk/outbound-send-deps`、`openclaw/plugin-sdk/config-runtime`、
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換シムです。
新しいコードでは、代わりに、より用途を限定した汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（バンドルされた各 Plugin パッケージのルートごと）:

- `index.js` — バンドルされた Plugin のエントリ
- `api.js` — ヘルパー/型のバレル
- `runtime-api.js` — ランタイム専用バレル
- `setup-entry.js` — セットアップ Plugin のエントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートする必要があります。コアまたは
別の Plugin から、他の Plugin パッケージの `src/*` をインポートしてはいけません。
ファサードで読み込まれるエントリポイントは、アクティブなランタイム設定スナップショットが
存在する場合はそれを優先し、それ以外の場合はディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`、`media-understanding`、`speech` などの
機能固有のサブパスが存在するのは、現在バンドルされた Plugin がそれらを使用しているためです。
これらは、長期的な外部契約として自動的に固定されるものではありません。依存する場合は、
該当する SDK リファレンスページを確認してください。

## メッセージツールのスキーマ

Plugin は、リアクション、既読、投票など、メッセージ以外のプリミティブに対する
チャネル固有の `describeMessageTool(...)` スキーマへの追加を所有する必要があります。
共有の送信プレゼンテーションでは、プロバイダー固有のボタン、コンポーネント、ブロック、
カードのフィールドではなく、汎用の `MessagePresentation` 契約を使用してください。
契約、フォールバック規則、プロバイダーのマッピング、Plugin 作成者向けチェックリストについては、
[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信機能を持つ Plugin は、メッセージ機能を通じてレンダリング可能な内容を宣言します:

- セマンティックなプレゼンテーションブロック（`text`、`context`、
  `divider`、`chart`、`table`、`buttons`、`select`）用の `presentation`
- ピン留め配信リクエスト用の `delivery-pin`

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに縮退させるかを決定します。
汎用メッセージツールから、プロバイダー固有 UI への迂回手段を公開しないでください。
従来のネイティブスキーマ向けの非推奨 SDK ヘルパーは既存のサードパーティ Plugin のために
引き続きエクスポートされますが、新しい Plugin では使用しないでください。

## チャネルターゲットの解決

チャネル Plugin は、チャネル固有のターゲットセマンティクスを所有する必要があります。共有の
送信ホストは汎用のままにし、プロバイダーの規則にはメッセージングアダプターのサーフェスを使用してください:

- `messaging.inferTargetChatType({ to })` は、ディレクトリ検索の前に、正規化されたターゲットを
  `direct`、`group`、`channel` のいずれとして扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力についてディレクトリ検索を行わず、
  ID 形式の解決へ直接進むべきかどうかをコアに通知します。
- `messaging.targetResolver.reservedLiterals` は、そのプロバイダーにおける
  チャネル/セッション参照となる単独の単語を列挙します。解決処理は、予約済みリテラルを拒否する前に
  設定済みのディレクトリエントリを保持し、その後ディレクトリで見つからなければフェイルクローズします。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後、またはディレクトリで見つからなかった後に、
  コアがプロバイダー所有の最終的な解決を必要とする場合に使用する Plugin のフォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲットが解決された後のプロバイダー固有の
  セッションルート構築を所有します。

推奨される役割分担:

- ピア/グループの検索前に行うべきカテゴリ判定には `inferTargetChatType` を使用します。
- 「これを明示的な/ネイティブのターゲット ID として扱う」判定には `looksLikeId` を使用します。
- `resolveTarget` はプロバイダー固有の正規化フォールバックに使用し、広範なディレクトリ検索には
  使用しないでください。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダー固有 ID は、
  汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有パラメーター内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリを生成する Plugin は、そのロジックを Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用する必要があります。

チャネルが次のような設定に基づくピア/グループを必要とする場合に使用してください:

- 許可リストに基づく DM ピア
- 設定済みのチャネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、次の汎用操作のみを処理します:

- クエリのフィルタリング
- 上限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査と ID 正規化は、Plugin の実装内に留める必要があります。

## プロバイダーカタログ

プロバイダー Plugin は、
`registerProvider({ catalog: { run(...) { ... } } })` を使用して推論用モデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形式を返します:

- 1 つのプロバイダーエントリには `{ provider }`
- 複数のプロバイダーエントリには `{ providers }`

Plugin がプロバイダー固有のモデル ID、ベース URL のデフォルト値、
または認証を条件とするモデルメタデータを所有する場合は、`catalog` を使用してください。

`catalog.order` は、Plugin のカタログを OpenClaw の組み込み暗黙的プロバイダーに対して
いつマージするかを制御します:

- `simple`: 単純な API キーまたは環境変数駆動のプロバイダー
- `profile`: 認証プロファイルが存在する場合に表示されるプロバイダー
- `paired`: 関連する複数のプロバイダーエントリを合成するプロバイダー
- `late`: 他の暗黙的プロバイダーの後に行う最終パス

キーが競合した場合は後のプロバイダーが優先されるため、Plugin は同じプロバイダー ID を持つ
組み込みプロバイダーエントリを意図的に上書きできます。

Plugin は、
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて読み取り専用のモデル行を公開することもできます。これは一覧/ヘルプ/選択画面向けの
将来の標準経路であり、`text`、`voice`、`image_generation`、`video_generation`、
`music_generation` の行をサポートします。プロバイダー Plugin は引き続き、ライブエンドポイントの
呼び出し、トークン交換、ベンダーレスポンスのマッピングを所有します。コアは、共通の行形式、
ソースラベル、メディアツールのヘルプ書式を所有します。メディア生成プロバイダーの登録では、
`defaultModel`、`models`、`capabilities` から静的カタログ行が自動的に合成されます。

互換性:

- `discovery` は従来のエイリアスとして引き続き動作しますが、非推奨警告が出力されます
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用し、
  警告を出力します
- `augmentModelCatalog` は非推奨です。バンドルされたプロバイダーは、
  `registerModelCatalogProvider` を通じて補足行を公開する必要があります

## チャネルの読み取り専用検査

Plugin がチャネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` はランタイム経路です。認証情報が完全に具現化されていることを前提にでき、
  必須のシークレットがない場合は即座に失敗できます。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、
  `openclaw channels resolve` などの読み取り専用コマンド経路や、doctor/設定の
  修復フローでは、設定を説明するだけのためにランタイム認証情報を具現化する必要はありません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を維持します。
- 関連する場合は、次のような認証情報のソース／状態フィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するだけなら、生のトークン値を返す必要はありません。ステータス形式のコマンドでは、`tokenStatus: "available"`（および対応するソースフィールド）を返せば十分です。
- 認証情報が SecretRef 経由で設定されているものの、現在のコマンドパスでは利用できない場合は、`configured_unavailable` を使用します。

これにより、読み取り専用コマンドはクラッシュしたり、アカウントが未設定であると誤って報告したりせず、「設定済みだが、このコマンドパスでは利用不可」と報告できます。

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

各エントリが 1 つの Plugin になります。パックに複数の拡張機能が列挙されている場合、Plugin ID は `<manifestOrPackageName>/<fileBase>` になります（マニフェスト ID が存在する場合はそれが優先され、存在しない場合はスコープなしの `package.json` 名が使用されます）。

Plugin が npm 依存関係をインポートする場合は、`node_modules` を利用できるように、そのディレクトリで依存関係をインストールします（`npm install` / `pnpm install`）。

セキュリティ上のガードレール：すべての `openclaw.extensions` エントリは、シンボリックリンクを解決した後も Plugin ディレクトリ内に収まる必要があります。パッケージディレクトリ外を指すエントリは拒否されます。

セキュリティ上の注意：`openclaw plugins install` は、プロジェクトローカルの `npm install --omit=dev --ignore-scripts` を使用して Plugin の依存関係をインストールします（ライフサイクルスクリプトは実行せず、実行時に開発依存関係を含めません）。継承されたグローバル npm インストール設定は無視されます。Plugin の依存関係ツリーは「純粋な JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意：`openclaw.setupEntry` には、軽量なセットアップ専用モジュールを指定できます。無効なチャンネル Plugin のセットアップサーフェスが OpenClaw に必要な場合、またはチャンネル Plugin が有効でも未設定の場合、完全な Plugin エントリの代わりに `setupEntry` が読み込まれます。メインの Plugin エントリでツール、フック、その他の実行時専用コードも接続する場合に、起動とセットアップを軽量化できます。

任意：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` を使用すると、チャンネルがすでに設定済みの場合でも、Gateway のリッスン開始前の起動フェーズで、チャンネル Plugin に同じ `setupEntry` パスを使用させることができます。

これは、Gateway がリッスンを開始する前に存在しなければならない起動サーフェスを `setupEntry` が完全に網羅している場合にのみ使用してください。実際には、セットアップエントリで、起動時に依存するチャンネル所有のすべての機能を登録する必要があります。たとえば、次のものです。

- チャンネル登録自体
- Gateway がリッスンを開始する前に利用可能でなければならない HTTP ルート
- 同じ時間帯に存在しなければならない Gateway メソッド、ツール、またはサービス

完全なエントリが必要な起動機能を 1 つでも引き続き所有している場合は、このフラグを有効にしないでください。Plugin をデフォルト動作のままにし、OpenClaw が起動時に完全なエントリを読み込むようにします。

バンドルされたチャンネルは、完全なチャンネルランタイムが読み込まれる前にコアが参照できる、セットアップ専用の契約サーフェスヘルパーも公開できます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全な Plugin エントリを読み込まずに、従来の単一アカウントのチャンネル設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、このサーフェスを使用します。Matrix は現在のバンドル例です。名前付きアカウントがすでに存在する場合は、認証／ブートストラップキーのみを名前付きの昇格先アカウントに移動し、常に `accounts.default` を作成するのではなく、設定済みの非正規デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターにより、バンドルされた契約サーフェスの検出は遅延されたままになります。インポート時の処理は軽量に保たれ、モジュールのインポート時にバンドルされたチャンネルの起動処理へ再突入するのではなく、昇格サーフェスは初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスを使用してください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は引き続き予約されており、Plugin がより狭いスコープを要求した場合でも、常に `operator.admin` に解決されます。

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

チャンネル Plugin は `openclaw.channel` を介してセットアップ／検出メタデータを、`openclaw.install` を介してインストールのヒントを公開できます。これにより、コアのカタログをデータ非依存に保てます。

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

最小限の例以外で有用な `openclaw.channel` フィールド：

- `detailLabel`：より詳細なカタログ／状態サーフェス向けの副ラベル
- `docsLabel`：ドキュメントリンクのリンクテキストを上書き
- `preferOver`：このカタログエントリが優先すべき、優先度の低い Plugin／チャンネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：選択サーフェスの文言制御
- `markdownCapable`：送信時の書式設定判断で、チャンネルが Markdown 対応であることを示す
- `exposure.configured`：`false` に設定すると、設定済みチャンネルの一覧サーフェスでチャンネルを非表示にする
- `exposure.setup`：`false` に設定すると、対話型のセットアップ／設定選択画面でチャンネルを非表示にする
- `exposure.docs`：ドキュメントのナビゲーションサーフェスで、チャンネルを内部用／非公開として示す
- `showConfigured` / `showInSetup`：互換性のために引き続き受け付ける従来の別名。`exposure` を推奨
- `quickstartAllowFrom`：標準のクイックスタート `allowFrom` フローにチャンネルを参加させる
- `forceAccountBinding`：アカウントが 1 つしか存在しない場合でも、明示的なアカウントのバインドを必須にする
- `preferSessionLookupForAnnounceTarget`：通知先の解決時にセッション検索を優先する

OpenClaw は、**外部チャンネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを配置します。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）に、1 つ以上の JSON ファイルを指定します（カンマ／セミコロン／`PATH` 区切り）。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは、`"entries"` キーの従来の別名として `"packages"` または `"plugins"` も受け付けます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックと並べて、正規化されたインストールソース情報を公開します。正規化された情報は、npm の指定が正確なバージョンか可変セレクターか、想定される完全性メタデータが存在するか、ローカルソースパスも利用可能かを示します。カタログ／パッケージの識別情報が既知の場合、解析された npm パッケージ名がその識別情報と食い違っていると、正規化された情報に警告が表示されます。また、`defaultChoice` が無効な場合、利用できないソースを指している場合、または有効な npm ソースなしで npm 完全性メタデータが存在する場合にも警告します。手動作成されたエントリやカタログシムで合成する必要がないように、利用側は `installSource` を追加の任意フィールドとして扱う必要があります。
これにより、オンボーディングと診断は、Plugin ランタイムをインポートせずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、正確な `npmSpec` と `expectedIntegrity` の組み合わせを推奨します。裸のパッケージ名と dist-tag も互換性のために引き続き機能しますが、ソースプレーンの警告が表示されるため、既存の Plugin を壊すことなく、カタログをバージョン固定かつ完全性チェック済みのインストールへ移行できます。オンボーディングがローカルカタログパスからインストールする場合、管理対象 Plugin の Plugin インデックスエントリが `source: "path"` とともに記録され、可能な場合はワークスペース相対の `sourcePath` も記録されます。絶対パスの運用ロードパスは `plugins.load.paths` に保持され、インストールレコードではローカルワークステーションのパスを長期保存される設定に重複して記録しません。これにより、ローカル開発用インストールをソースプレーン診断から確認できる一方で、生のファイルシステムパスを開示する第 2 のサーフェスは追加されません。永続化された `installed_plugin_index` SQLite テーブルがインストールソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが欠落しているか無効な場合でも永続的に保持されます。`plugins` ペイロードは再構築可能なマニフェストビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction におけるセッションコンテキストのオーケストレーションを担います。Plugin から `api.registerContextEngine(id, factory)` を使用して登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

単にメモリ検索やフックを追加するのではなく、デフォルトのコンテキストパイプラインを置き換える、または拡張する必要がある場合に使用します。

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

ファクトリの `ctx` は、構築時の初期化に使用できる任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

アクティブなハーネスに永続的なバックエンドスレッドがある場合、`assemble()` は `contextProjection` を返せます。従来のターンごとのプロジェクションでは省略します。組み立てたコンテキストをバックエンドスレッドに一度注入し、エポックが変更されるまで再利用する場合は、`{ mode: "thread_bootstrap", epoch }` を返します。エンジン所有の Compaction パス後など、エンジンの意味的コンテキストが変更された後にエポックを変更します。ホストは、スレッドブートストラッププロジェクションでツール呼び出しのメタデータ、入力形状、秘匿化されたツール結果を保持できるため、生の機密情報を含むペイロードをコピーせずに、新しいバックエンドスレッドでもツールの連続性を維持できます。

エンジンが Compaction アルゴリズムを所有**しない**場合も、`compact()` を実装したままにし、明示的に委譲します。

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

## 新しいケイパビリティの追加

Plugin に現在の API では対応できない動作が必要な場合、非公開の内部参照によって
Plugin システムを迂回しないでください。不足しているケイパビリティを追加します。

推奨手順:

1. **コアのコントラクトを定義します。** コアが所有すべき共有動作を決定します:
   ポリシー、フォールバック、設定のマージ、ライフサイクル、チャネル向けのセマンティクス、
   およびランタイムヘルパーの形式です。
2. **型付きの Plugin 登録およびランタイムサーフェスを追加します。**
   `OpenClawPluginApi` および／または `api.runtime` を、実用上最小限の型付き
   ケイパビリティサーフェスで拡張します。
3. **コアとチャネル／機能のコンシューマーを接続します。** チャネルおよび機能 Plugin は、
   ベンダー実装を直接インポートせず、コアを通じて新しいケイパビリティを利用する必要があります。
4. **ベンダー実装を登録します。** その後、ベンダー Plugin が各バックエンドを
   ケイパビリティに登録します。
5. **コントラクトのカバレッジを追加します。** 所有権と登録形式が将来にわたって
   明示された状態を保つように、テストを追加します。

この方法により、OpenClaw は特定のプロバイダーの世界観にハードコードされることなく、
明確な方針を維持できます。具体的なファイルのチェックリストと実例については、
[ケイパビリティクックブック](/ja-JP/plugins/adding-capabilities)を参照してください。

### ケイパビリティのチェックリスト

新しいケイパビリティを追加する場合、通常は以下のサーフェスをまとめて
変更する必要があります:

- `src/<capability>/types.ts` のコアコントラクト型
- `src/<capability>/runtime.ts` のコアランナー／ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ接続
- 機能／チャネル Plugin が利用する必要がある場合は、
  `src/plugins/runtime/*` での Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ／テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権／コントラクトアサーション
- `docs/` の運用者／Plugin 向けドキュメント

これらのサーフェスのいずれかが欠けている場合、通常はケイパビリティが
まだ完全に統合されていないことを示します。

### ケイパビリティのテンプレート

最小パターン:

```ts
// コアコントラクト
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// 機能／チャネル Plugin 向けの共有ランタイムヘルパー
const clip = await api.runtime.videoGeneration.generate({
  prompt: "ロボットが研究室を歩く様子を表示してください。",
  cfg,
});
```

コントラクトテストのパターン（`src/plugins/contracts/registry.ts` は
`providerContractPluginIds` などの所有権検索を公開します。テストでは、Plugin の
`contracts.videoGenerationProviders` リストが、実際に登録する内容と一致することを
アサートします）:

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

これにより、ルールがシンプルに保たれます:

- コアがケイパビリティのコントラクトとオーケストレーションを所有する
- ベンダー Plugin がベンダー実装を所有する
- 機能／チャネル Plugin がランタイムヘルパーを利用する
- コントラクトテストによって所有権を明示的に保つ

## 関連項目

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開ケイパビリティモデルと形式
- [Plugin SDK のサブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
