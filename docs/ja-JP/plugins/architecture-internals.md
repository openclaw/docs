---
read_when:
    - プロバイダのランタイムフック、チャネルのライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリの状態のデバッグ
    - 新しい Plugin の機能またはコンテキストエンジン Plugin の追加
summary: 'Pluginアーキテクチャ内部: 読み込みパイプライン、レジストリ、ランタイムフック、HTTPルート、リファレンステーブル'
title: Pluginアーキテクチャ内部
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

公開されている機能モデル、Plugin の形状、所有権/実行コントラクトについては、[Plugin architecture](/ja-JP/plugins/architecture)を参照してください。このページは、内部メカニズムのリファレンスです。具体的には、読み込みパイプライン、レジストリ、ランタイムフック、Gateway HTTP ルート、インポートパス、スキーマテーブルを扱います。

## 読み込みパイプライン

起動時に、OpenClaw はおおむね次の処理を行います。

1. 候補となる Plugin ルートを検出する
2. ネイティブまたは互換バンドルのマニフェストとパッケージメタデータを読む
3. 安全でない候補を拒否する
4. Plugin 設定（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）を正規化する
5. 各候補を有効化するかどうかを決定する
6. 有効なネイティブモジュールを読み込む: ビルド済みの同梱モジュールはネイティブローダーを使用し、未ビルドのネイティブ Plugin は jiti を使用する
7. ネイティブの `register(api)` フックを呼び出し、登録内容を Plugin レジストリに収集する
8. レジストリをコマンド/ランタイムの各サーフェスに公開する

<Note>
`activate` は `register` のレガシーな別名です。ローダーは存在する方（`def.register ?? def.activate`）を解決し、同じタイミングで呼び出します。すべての同梱 Plugin は `register` を使用します。新しい Plugin では `register` を使ってください。
</Note>

安全性ゲートは、ランタイムの実行**前**に行われます。エントリが Plugin ルートの外に出る場合、パスが world-writable の場合、または同梱されていない Plugin でパスの所有権が不審に見える場合、候補はブロックされます。

### マニフェスト優先の動作

マニフェストは、コントロールプレーンにおける単一の信頼できる情報源です。OpenClaw はこれを次の目的で使用します。

- Plugin を識別する
- 宣言されたチャネル/Skills/設定スキーマまたはバンドル機能を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI のラベル/プレースホルダーを補強する
- インストール/カタログのメタデータを表示する
- Plugin ランタイムを読み込まずに、軽量なアクティベーション記述子とセットアップ記述子を保持する

ネイティブ Plugin では、ランタイムモジュールがデータプレーンの部分です。ここで、フック、ツール、コマンド、またはプロバイダフローなどの実際の動作を登録します。

任意のマニフェスト `activation` ブロックと `setup` ブロックは、コントロールプレーンに留まります。これらは、アクティベーション計画とセットアップ検出のためのメタデータ専用の記述子であり、ランタイム登録、`register(...)`、または `setupEntry` を置き換えるものではありません。
最初のライブアクティベーション利用側では、より広いレジストリ具現化の前に Plugin の読み込みを絞り込むため、マニフェストのコマンド、チャネル、プロバイダのヒントを使用するようになりました。

- CLI の読み込みは、要求されたプライマリコマンドを所有する Plugin に絞り込まれる
- チャネルのセットアップ/Plugin 解決は、要求された
  チャネル id を所有する Plugin に絞り込まれる
- 明示的なプロバイダのセットアップ/ランタイム解決は、要求された
  プロバイダ id を所有する Plugin に絞り込まれる

アクティベーションプランナーは、既存の呼び出し元向けの id のみ API と、新しい診断向けの plan API の両方を公開します。plan エントリは、Plugin が選択された理由を報告し、明示的な `activation.*` プランナーヒントを、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどのマニフェスト所有権フォールバックと分離します。この理由の分離が互換性境界です。既存の Plugin メタデータは引き続き機能し、新しいコードはランタイム読み込みセマンティクスを変えずに、広範なヒントやフォールバック動作を検出できます。

セットアップ検出では、`setup-api` にフォールバックする前に、`setup.providers` や `setup.cliBackends` などの記述子所有 id を優先して候補 Plugin を絞り込むようになりました。これにより、セットアップ時ランタイムフックがまだ必要な Plugin に対応します。プロバイダセットアップ一覧では、プロバイダランタイムを読み込まずに、マニフェストの `providerAuthChoices`、記述子由来のセットアップ候補、インストールカタログのメタデータを使用します。明示的な `setup.requiresRuntime: false` は記述子専用の打ち切りです。`requiresRuntime` を省略すると、互換性のため従来の `setup-api` フォールバックが維持されます。検出された複数の Plugin が同じ正規化済みセットアッププロバイダまたは CLI バックエンド id を主張した場合、セットアップ検索は検出順序に依存せず、その曖昧な所有者を拒否します。セットアップランタイムが実際に実行される場合、レジストリ診断は、`setup.providers` / `setup.cliBackends` と、`setup-api` によって登録されたプロバイダまたは CLI バックエンドとのずれを報告しますが、レガシー Plugin をブロックはしません。

### ローダーがキャッシュするもの

OpenClaw は、プロセス内に短期間のキャッシュを保持します。対象は次のとおりです。

- 検出結果
- マニフェストレジストリデータ
- 読み込まれた Plugin レジストリ

これらのキャッシュにより、起動時の突発的な負荷や、繰り返されるコマンドのオーバーヘッドが軽減されます。これらは永続化ではなく、短命なパフォーマンスキャッシュと考えてください。

パフォーマンスに関する注記:

- これらのキャッシュを無効にするには、`OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定します。
- キャッシュウィンドウは、`OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## レジストリモデル

読み込まれた Plugin は、コアのランダムなグローバル状態を直接変更しません。代わりに、中央の Plugin レジストリに登録します。

レジストリは次を追跡します。

- Plugin レコード（識別情報、ソース、オリジン、ステータス、診断）
- ツール
- レガシーフックと型付きフック
- チャネル
- プロバイダ
- Gateway RPC ハンドラー
- HTTP ルート
- CLI レジストラ
- バックグラウンドサービス
- Plugin が所有するコマンド

その後、コア機能は Plugin モジュールと直接やり取りするのではなく、そのレジストリから読み取ります。これにより、読み込みは一方向に保たれます。

- Plugin モジュール -> レジストリ登録
- コアランタイム -> レジストリ消費

この分離は、保守性の観点で重要です。つまり、ほとんどのコアサーフェスは「レジストリを読む」という 1 つの統合ポイントだけを必要とし、「各 Plugin モジュールを個別に特別扱いする」必要がありません。

## 会話バインディングコールバック

会話をバインドする Plugin は、承認が解決されたときに反応できます。

`api.onConversationBindingResolved(...)` を使用すると、バインド要求が承認または拒否された後にコールバックを受け取れます。

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // この Plugin + 会話に対するバインディングが作成されました。
        console.log(event.binding?.conversationId);
        return;
      }

      // 要求は拒否されました。ローカルの保留状態をすべてクリアします。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

コールバックペイロードのフィールド:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: 承認された要求に対する解決済みバインディング
- `request`: 元の要求サマリー、detach ヒント、sender id、および
  会話メタデータ

このコールバックは通知専用です。誰が会話をバインドできるかを変更するものではなく、コアの承認処理が完了した後に実行されます。

## プロバイダのランタイムフック

プロバイダ Plugin には 3 つのレイヤーがあります。

- **マニフェストメタデータ**: ランタイム前の安価な検索のため:
  `setup.providers[].envVars`、非推奨の互換性用 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、および `channelEnvVars`。
- **設定時フック**: `catalog`（レガシーの `discovery`）に加えて
  `applyConfigDefaults`。
- **ランタイムフック**: 認証、モデル解決、
  ストリームラップ、thinking level、リプレイポリシー、使用量エンドポイントをカバーする 40 個以上の任意フック。完全な一覧は
  [フックの順序と使い方](#hook-order-and-usage) を参照してください。

OpenClaw は引き続き、汎用エージェントループ、フェイルオーバー、トランスクリプト処理、ツールポリシーを所有します。これらのフックは、プロバイダ固有の動作のための拡張サーフェスであり、推論転送全体を独自実装することなく対応できます。

プロバイダに、汎用の認証/ステータス/モデル選択パスから、プロバイダランタイムを読み込まずに見えるべき env ベースの認証情報がある場合は、マニフェストの `setup.providers[].envVars` を使用します。非推奨の `providerAuthEnvVars` も廃止期間中は互換性アダプタで引き続き読み取られ、それを使用する同梱されていない Plugin にはマニフェスト診断が出ます。あるプロバイダ id が別のプロバイダ id の env vars、認証プロファイル、config ベースの認証、API キーのオンボーディング選択を再利用すべき場合は、マニフェストの `providerAuthAliases` を使用します。オンボーディング/認証選択の CLI サーフェスが、プロバイダランタイムを読み込まずに、そのプロバイダの choice id、グループラベル、単純な単一フラグ認証配線を知る必要がある場合は、マニフェストの `providerAuthChoices` を使用します。プロバイダランタイムの
`envVars` は、オンボーディングラベルや OAuth
client-id/client-secret セットアップ変数のような、オペレーター向けヒント用に維持してください。

チャネルに env 駆動の認証またはセットアップがあり、汎用の shell-env フォールバック、config/status チェック、またはセットアッププロンプトから、チャネルランタイムを読み込まずに見える必要がある場合は、マニフェストの `channelEnvVars` を使用します。

### フックの順序と使い方

モデル/プロバイダ Plugin について、OpenClaw はおおむね次の順序でフックを呼び出します。
「When to use」列は、すばやく判断するためのガイドです。

| #   | フック                              | 役割                                                                                                   | 使用する場面                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時に、プロバイダ設定を `models.providers` に公開する                                | プロバイダがカタログまたは base URL のデフォルト値を所有している                                                                                                  |
| 2   | `applyConfigDefaults`             | 設定の具体化時に、プロバイダ所有のグローバル設定デフォルトを適用する                                      | デフォルト値が auth モード、env、またはプロバイダの model-family セマンティクスに依存する                                                                         |
| --  | _(組み込みのモデル検索)_         | OpenClaw は最初に通常のレジストリ/カタログパスを試す                                                          | _(Plugin フックではありません)_                                                                                                                         |
| 3   | `normalizeModelId`                | 検索前に、レガシーまたは preview の model-id エイリアスを正規化する                                                     | 正式なモデル解決の前に、プロバイダがエイリアスのクリーンアップを所有している                                                                                 |
| 4   | `normalizeTransport`              | 一般的なモデル組み立ての前に、プロバイダファミリーの `api` / `baseUrl` を正規化する                                      | 同じ transport ファミリー内のカスタムプロバイダ id について、プロバイダが transport のクリーンアップを所有している                                                          |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダ解決の前に、`models.providers.<id>` を正規化する                                           | Plugin と一緒にあるべき設定クリーンアップが必要な場合。なお、同梱の Google ファミリー用ヘルパーは、サポートされている Google 設定エントリのバックストップも担う   |
| 6   | `applyNativeStreamingUsageCompat` | 設定プロバイダに、ネイティブ streaming-usage 互換リライトを適用する                                               | エンドポイント駆動のネイティブ streaming usage メタデータ修正が必要な場合                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイム認証読み込みの前に、設定プロバイダ向けの env-marker 認証を解決する                                       | プロバイダ所有の env-marker API キー解決がある場合。`amazon-bedrock` もここに組み込みの AWS env-marker リゾルバを持つ                  |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、local/self-hosted または config ベースの認証を公開する                                   | プロバイダが synthetic/local 認証マーカーで動作できる場合                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | プロバイダ所有の外部認証プロファイルをオーバーレイする。デフォルトの `persistence` は CLI/app 所有の認証情報では `runtime-only` | コピーした refresh token を永続化せずに外部認証情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの synthetic プロファイルプレースホルダーを、env/config ベース認証より後順位にする                                      | synthetic なプレースホルダープロファイルを保存するが、それが優先されるべきではない場合                                                                 |
| 11  | `resolveDynamicModel`             | まだローカルレジストリにないプロバイダ所有の model id について、同期フォールバックを行う                                       | プロバイダが任意の上流 model id を受け付ける場合                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` を再実行する                                                           | 未知の id を解決する前に、プロバイダがネットワークメタデータを必要とする場合                                                                                  |
| 13  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使う前の最終リライト                                               | transport のリライトが必要だが、それでもコア transport を使う場合                                                                             |
| 14  | `contributeResolvedModelCompat`   | 別の互換 transport の背後にあるベンダーモデル向けに compat フラグを提供する                                  | プロバイダを乗っ取ることなく、プロキシ transport 上で自身のモデルを認識する場合                                                       |
| 15  | `capabilities`                    | 共有コアロジックで使われる、プロバイダ所有の transcript/tooling メタデータ                                           | transcript や provider-family の癖に対応する必要がある場合                                                                                              |
| 16  | `normalizeToolSchemas`            | 埋め込みランナーが見る前にツールスキーマを正規化する                                                    | transport-family のスキーマクリーンアップが必要な場合                                                                                                |
| 17  | `inspectToolSchemas`              | 正規化後に、プロバイダ所有のスキーマ診断を公開する                                                  | コアにプロバイダ固有ルールを教え込まずに、キーワード警告を出したい場合                                                                 |
| 18  | `resolveReasoningOutputMode`      | ネイティブまたはタグ付きの reasoning-output コントラクトを選択する                                                              | ネイティブフィールドではなく、タグ付き reasoning/final output が必要な場合                                                                         |
| 19  | `prepareExtraParams`              | 一般的なストリームオプションラッパーの前に、リクエストパラメータを正規化する                                              | デフォルトのリクエストパラメータまたはプロバイダごとのパラメータクリーンアップが必要な場合                                                                           |
| 20  | `createStreamFn`                  | 通常のストリームパス全体を、カスタム transport で完全に置き換える                                                   | ラッパーだけではなく、カスタム wire protocol が必要な場合                                                                                     |
| 21  | `wrapStreamFn`                    | 一般的なラッパー適用後にストリームをラップする                                                              | カスタム transport を使わずに、リクエストヘッダー/ボディ/モデル互換ラッパーが必要な場合                                                          |
| 22  | `resolveTransportTurnState`       | ネイティブのターン単位 transport ヘッダーまたはメタデータを付加する                                                           | 一般的な transports で、プロバイダネイティブのターン識別情報を送信したい場合                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付加する                                                    | 一般的な WS transports で、セッションヘッダーやフォールバックポリシーを調整したい場合                                                               |
| 24  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルをランタイムの `apiKey` 文字列に変換する                                     | 追加の認証メタデータを保存しており、カスタムなランタイムトークン形式が必要な場合                                                                    |
| 25  | `refreshOAuth`                    | カスタム refresh エンドポイントまたは refresh 失敗ポリシー向けの OAuth refresh オーバーライド                                  | 共有の `pi-ai` refreshers に当てはまらない場合                                                                                           |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 失敗時に付加される修復ヒントを構築する                                                                  | refresh 失敗後に、プロバイダ所有の認証修復ガイダンスが必要な場合                                                                      |
| 27  | `matchesContextOverflowError`     | プロバイダ所有のコンテキストウィンドウ超過エラーマッチャー                                                                 | 一般的なヒューリスティクスでは見逃す、生の超過エラーがある場合                                                                                |
| 28  | `classifyFailoverReason`          | プロバイダ所有のフェイルオーバー理由分類                                                                  | 生の API/transport エラーを、rate-limit/overload などにマップできる場合                                                                          |
| 29  | `isCacheTtlEligible`              | proxy/backhaul プロバイダ向けのプロンプトキャッシュポリシー                                                               | プロキシ固有のキャッシュ TTL 制御が必要な場合                                                                                                |
| 30  | `buildMissingAuthMessage`         | 一般的な認証不足リカバリメッセージの置き換え                                                      | プロバイダ固有の認証不足リカバリヒントが必要な場合                                                                                 |
| 31  | `suppressBuiltInModel`            | 古くなった上流モデルの抑制と、任意のユーザー向けエラーヒント                                          | 古い上流行を隠す、またはベンダーヒントに置き換える必要がある場合                                                                 |
| 32  | `augmentModelCatalog`             | 検出後に synthetic/final カタログ行を追加する                                                          | `models list` やピッカーに、synthetic な forward-compat 行が必要な場合                                                                     |
| 33  | `resolveThinkingProfile`          | モデル固有の `/think` レベル、表示ラベル、およびデフォルトを設定する                                                 | 選択されたモデル向けに、カスタムの thinking ラダーまたは二値ラベルを公開する場合                                                                 |
| 34  | `isBinaryThinking`                | オン/オフの reasoning トグル互換フック                                                                     | 二値の thinking オン/オフのみを公開する場合                                                                                                  |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning サポート互換フック                                                                   | モデルの一部サブセットでのみ `xhigh` を有効にしたい場合                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | デフォルトの `/think` レベル互換フック                                                                      | モデルファミリーに対するデフォルトの `/think` ポリシーをプロバイダが所有している場合                                                                                      |
| 37  | `isModernModelRef`                | ライブプロファイルフィルターおよびスモーク選択のための modern-model マッチャー                                              | ライブ/スモーク用の優先モデルマッチングをプロバイダが所有している場合                                                                                             |
| 38  | `prepareRuntimeAuth`              | 推論の直前に、設定済み認証情報を実際のランタイムトークン/キーに交換する                       | トークン交換または短命なリクエスト認証情報が必要な場合                                                                             |
| 39  | `resolveUsageAuth`                | `/usage` および関連するステータスサーフェス向けの使用量/課金認証情報を解決する                                     | カスタムの使用量/クォータトークン解析、または別の使用量認証情報が必要な場合                                                               |
| 40  | `fetchUsageSnapshot`              | 認証解決後に、プロバイダ固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダ固有の使用量エンドポイントまたはペイロードパーサーが必要な場合                                                                           |
| 41  | `createEmbeddingProvider`         | メモリ/検索向けのプロバイダ所有 embedding アダプターを構築する                                                     | メモリ embedding の動作をプロバイダ Plugin に属させるべき場合                                                                                    |
| 42  | `buildReplayPolicy`               | そのプロバイダの transcript 処理を制御するリプレイポリシーを返す                                        | カスタム transcript ポリシー（たとえば、thinking ブロックの除去）が必要な場合                                                               |
| 43  | `sanitizeReplayHistory`           | 一般的な transcript クリーンアップ後にリプレイ履歴を書き換える                                                        | 共有 Compaction ヘルパーを超える、プロバイダ固有のリプレイ書き換えが必要な場合                                                             |
| 44  | `validateReplayTurns`             | 埋め込みランナーの前に、最終的なリプレイターン検証または整形を行う                                           | 一般的なサニタイズ後に、プロバイダ transport でより厳密なターン検証が必要な場合                                                                    |
| 45  | `onModelSelected`                 | モデル選択後に、プロバイダ所有の副作用を実行する                                                                 | モデルがアクティブになったときに、telemetry またはプロバイダ所有の状態が必要な場合                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず一致したプロバイダ Plugin を確認し、その後、model id または transport/config を実際に変更するものが見つかるまで、他のフック対応プロバイダ Plugin へとフォールスルーします。これにより、呼び出し元がどの同梱 Plugin がそのリライトを所有しているかを知らなくても、エイリアス/互換プロバイダ shim を機能させられます。どのプロバイダフックも、サポート対象の Google ファミリー設定エントリを書き換えない場合でも、同梱の Google 設定正規化処理はその互換性クリーンアップを引き続き適用します。

プロバイダに完全にカスタムな wire protocol またはカスタムなリクエスト実行器が必要な場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き実行されるプロバイダ動作のためのものです。

### プロバイダの例

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

同梱プロバイダ Plugin は、各ベンダーのカタログ、認証、thinking、リプレイ、使用量の要件に合わせて、上記のフックを組み合わせています。権威あるフックセットは `extensions/` 配下の各 Plugin にあり、このページでは一覧をそのまま再掲するのではなく、形状を示しています。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダ">
    OpenRouter、Kilocode、Z.AI、xAI は、`catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の静的カタログより前に上流の
    model id を公開できるようにしています。
  </Accordion>
  <Accordion title="OAuth と使用量エンドポイントのプロバイダ">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は、
    `prepareRuntimeAuth` または `formatApiKey` と `resolveUsageAuth` +
    `fetchUsageSnapshot` を組み合わせて、トークン交換と `/usage` 統合を所有します。
  </Accordion>
  <Accordion title="リプレイと transcript クリーンアップのファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各 Plugin が
    個別にクリーンアップを再実装する代わりに、プロバイダは `buildReplayPolicy` を通じて
    transcript ポリシーにオプトインできます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダ">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine` は `catalog` のみを登録し、共有推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic 固有のストリームヘルパー">
    Beta ヘッダー、`/fast` / `serviceTier`、および `context1m` は、
    汎用 SDK ではなく、Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Plugin は `api.runtime` を通じて、選択されたコアヘルパーにアクセスできます。TTS の場合:

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

- `textToSpeech` は、ファイル/ボイスノート系サーフェス向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダ選択を使用します。
- PCM 音声バッファ + サンプルレートを返します。Plugin 側でプロバイダ用にリサンプリング/エンコードする必要があります。
- `listVoices` はプロバイダごとに任意です。ベンダー所有の音声ピッカーまたはセットアップフローに使用してください。
- 音声一覧には、ロケール、性別、性格タグなどのより豊富なメタデータを含めることができ、プロバイダ対応のピッカーに利用できます。
- OpenAI と ElevenLabs は現在 telephony をサポートしています。Microsoft はサポートしていません。

Plugin は `api.registerSpeechProvider(...)` を使って speech provider を登録することもできます。

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

- TTS のポリシー、フォールバック、返信配信はコアに維持してください。
- speech provider は、ベンダー所有の音声合成動作に使用してください。
- レガシーな Microsoft `edge` 入力は、`microsoft` プロバイダ id に正規化されます。
- 推奨される所有モデルは企業指向です。OpenClaw が今後そうした
  機能コントラクトを追加していくにつれ、1 つのベンダー Plugin が
  text、speech、image、将来の media provider を所有できます。

画像/音声/動画の理解については、Plugin は汎用のキー/値バッグではなく、型付きの
media-understanding provider を 1 つ登録します。

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

- オーケストレーション、フォールバック、設定、チャネル配線はコアに維持してください。
- ベンダー動作はプロバイダ Plugin に維持してください。
- 加法的な拡張は型付きのままにしてください。新しい任意メソッド、新しい任意の
  結果フィールド、新しい任意の capabilities です。
- 動画生成はすでに同じパターンに従っています:
  - コアが機能コントラクトとランタイムヘルパーを所有する
  - ベンダー Plugin が `api.registerVideoGenerationProvider(...)` を登録する
  - 機能/チャネル Plugin が `api.runtime.videoGeneration.*` を消費する

media-understanding のランタイムヘルパーについて、Plugin は次を呼び出せます。

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

音声文字起こしについては、Plugin は media-understanding ランタイムまたは古い STT エイリアスのいずれかを使えます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME を確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` は、
  画像/音声/動画理解のための推奨される共有サーフェスです。
- コアの media-understanding 音声設定（`tools.media.audio`）とプロバイダのフォールバック順序を使用します。
- 文字起こし出力が生成されなかった場合（たとえばスキップ/未対応入力）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性エイリアスとして引き続き残ります。

Plugin は `api.runtime.subagent` を通じてバックグラウンド subagent 実行を起動することもできます。

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

- `provider` と `model` は、永続的なセッション変更ではなく、実行ごとの任意オーバーライドです。
- OpenClaw は、信頼された呼び出し元に対してのみこれらのオーバーライドフィールドを反映します。
- Plugin 所有のフォールバック実行では、オペレーターが `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的にオプトインする必要があります。
- 信頼された Plugin を特定の正規 `provider/model` ターゲットに制限するには `plugins.entries.<id>.subagent.allowedModels` を使い、任意のターゲットを明示的に許可するには `"*"` を使用します。
- 信頼されていない Plugin の subagent 実行も動作はしますが、オーバーライド要求は黙ってフォールバックするのではなく拒否されます。

Web 検索については、Plugin はエージェントツール配線に直接触れる代わりに、
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

Plugin は
`api.registerWebSearchProvider(...)` を使って web-search provider を登録することもできます。

注記:

- プロバイダ選択、認証情報解決、共有リクエストセマンティクスはコアに維持してください。
- web-search provider はベンダー固有の検索 transport に使用してください。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せず検索動作が必要な機能/チャネル Plugin 向けの推奨共有サーフェスです。

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

- `generate(...)`: 設定済みの image-generation provider チェーンを使用して画像を生成します。
- `listProviders(...)`: 利用可能な image-generation provider とその capabilities を一覧表示します。

## Gateway HTTP ルート

Plugin は `api.registerHttpRoute(...)` を使って HTTP エンドポイントを公開できます。

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

- `path`: gateway HTTP サーバー配下のルートパス。
- `auth`: 必須。通常の gateway 認証を要求するには `"gateway"`、Plugin 管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が自分自身の既存ルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、Plugin 読み込みエラーの原因になります。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- `path + match` が完全に一致する競合は、`replaceExisting: true` がない限り拒否され、ある Plugin が別の Plugin のルートを置き換えることはできません。
- `auth` レベルが異なる重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベル内だけにしてください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動では受け取りません。これらは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストのランタイムスコープ内で動作しますが、そのスコープは意図的に保守的です:
  - 共有シークレット bearer 認証（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートのランタイムスコープは `operator.write` に固定されます
  - 信頼された ID 付き HTTP モード（たとえば `trusted-proxy` や、プライベート ingress 上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` ヘッダーが明示的に存在する場合にのみそれを反映します
  - これらの ID 付き Plugin ルートリクエストで `x-openclaw-scopes` が存在しない場合、ランタイムスコープは `operator.write` にフォールバックします
- 実用上のルール: gateway 認証の Plugin ルートを暗黙の管理者サーフェスだと想定しないでください。ルートに管理者専用動作が必要なら、ID 付き認証モードを要求し、明示的な `x-openclaw-scopes` ヘッダーコントラクトを文書化してください。

## Plugin SDK のインポートパス

新しい Plugin を作成する際は、巨大な `openclaw/plugin-sdk` ルート
barrel ではなく、狭い SDK サブパスを使用してください。コアのサブパス:

| サブパス                             | 用途                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                     |
| `openclaw/plugin-sdk/channel-core`  | チャネルエントリ/ビルドヘルパー                        |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括的コントラクト       |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、狭い境界のファミリーから選びます — `channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets`、`channel-actions`。承認動作は、無関係な
Plugin フィールドにまたがって混在させるのではなく、1 つの `approvalCapability`
コントラクトに集約してください。[Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムヘルパーと設定ヘルパーは、対応する `*-runtime` サブパス
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` など）配下にあります。

<Info>
`openclaw/plugin-sdk/channel-runtime` は非推奨です。これは古い Plugin 向けの互換 shim です。
新しいコードでは、より狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（同梱 Plugin パッケージルートごと）:

- `index.js` — 同梱 Plugin エントリ
- `api.js` — ヘルパー/型 barrel
- `runtime-api.js` — ランタイム専用 barrel
- `setup-entry.js` — セットアップ Plugin エントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスだけをインポートしてください。コアから、または別の Plugin から、他の Plugin パッケージの `src/*` をインポートしてはいけません。
ファサード読み込みされたエントリポイントは、存在する場合はアクティブなランタイム設定スナップショットを優先し、その後ディスク上で解決された設定ファイルにフォールバックします。

`image-generation`、`media-understanding`、
`speech` などの機能別サブパスは、同梱 Plugin が現在それらを使用しているため存在します。これらは自動的に長期固定された外部コントラクトになるわけではありません。依存する際は、関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票などのメッセージ以外のプリミティブについて、
チャネル固有の `describeMessageTool(...)` スキーマ提供を所有すべきです。
共有の送信プレゼンテーションには、プロバイダネイティブの button、component、block、card フィールドではなく、汎用の `MessagePresentation` コントラクトを使用してください。
コントラクト、フォールバック規則、プロバイダマッピング、Plugin 作成者向けチェックリストについては、[Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ capabilities を通じて何を描画できるかを宣言します。

- セマンティックな presentation ブロック（`text`、`context`、`divider`、`buttons`、`select`）用の `presentation`
- ピン留め配信リクエスト用の `delivery-pin`

コアは、その presentation をネイティブに描画するか、テキストに劣化させるかを判断します。
汎用メッセージツールから、プロバイダネイティブ UI の escape hatch を公開しないでください。
レガシーなネイティブスキーマ向けの非推奨 SDK ヘルパーは、既存の
サードパーティ Plugin のために引き続きエクスポートされていますが、新しい Plugin はそれらを使うべきではありません。

## チャネルターゲット解決

チャネル Plugin は、チャネル固有のターゲットセマンティクスを所有すべきです。共有アウトバウンドホストは汎用のままにし、プロバイダ規則には messaging adapter サーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化されたターゲットを
  ディレクトリ検索前に `direct`、`group`、`channel` のどれとして扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、その入力を
  ディレクトリ検索ではなく、id 風の解決に直接進めるべきかどうかをコアに伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  ディレクトリ未検出後に、コアが最終的なプロバイダ所有解決を必要とするときの
  Plugin 側フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後の
  プロバイダ固有セッションルート構築を所有します。

推奨される分割:

- peers/groups の検索前に行うべきカテゴリ判断には `inferTargetChatType` を使用する。
- 「これを明示的/ネイティブなターゲット id として扱う」判定には `looksLikeId` を使用する。
- `resolveTarget` は広範なディレクトリ検索ではなく、プロバイダ固有の正規化フォールバックに使用する。
- chat id、thread id、JID、handle、room id のようなプロバイダネイティブ id は、汎用 SDK フィールドではなく、`target` 値またはプロバイダ固有パラメータ内に保持する。

## 設定ベースのディレクトリ

設定からディレクトリエントリを導出する Plugin は、そのロジックを
Plugin 内に保持し、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用してください。

これは、チャネルが次のような設定ベースの peers/groups を必要とする場合に使用します。

- allowlist 駆動の DM peers
- 設定済みの channel/group マップ
- アカウント単位の静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを扱います。

- クエリフィルタリング
- 制限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査と id 正規化は、Plugin 実装側に残してください。

## プロバイダカタログ

プロバイダ Plugin は、
`registerProvider({ catalog: { run(...) { ... } } })` を使って推論用モデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むのと同じ形状を返します。

- 1 つのプロバイダエントリの場合は `{ provider }`
- 複数のプロバイダエントリの場合は `{ providers }`

Plugin がプロバイダ固有の model id、base URL デフォルト値、または認証ゲート付きモデルメタデータを所有する場合は `catalog` を使用します。

`catalog.order` は、Plugin のカタログが OpenClaw の組み込み暗黙プロバイダに対していつマージされるかを制御します。

- `simple`: 単純な API キーまたは env 駆動のプロバイダ
- `profile`: 認証プロファイルが存在するときに現れるプロバイダ
- `paired`: 複数の関連プロバイダエントリを合成するプロバイダ
- `late`: 他の暗黙プロバイダの後の最終パス

後のプロバイダがキー衝突時に勝つため、Plugin は同じプロバイダ id を持つ組み込みプロバイダエントリを意図的に上書きできます。

互換性:

- `discovery` はレガシーな別名として引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用のチャネル検査

Plugin がチャネルを登録する場合は、`resolveAccount(...)` とあわせて
`plugin.config.inspectAccount(cfg, accountId)` の実装を推奨します。

理由:

- `resolveAccount(...)` はランタイムパスです。認証情報が完全に具体化されていることを前提にでき、必要な secret が欠けている場合は即座に失敗して構いません。
- `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`、doctor/config
  修復フローのような読み取り専用コマンドパスでは、構成を説明するだけのために
  ランタイム認証情報を具体化する必要があってはいけません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態のみを返す。
- `enabled` と `configured` を保持する。
- 関連する場合は、認証情報のソース/ステータスフィールドを含める。例:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の利用可能性を報告するためだけに、生のトークン値を返す必要はありません。ステータス系コマンドには `tokenStatus: "available"`（および対応する source フィールド）を返せば十分です。
- SecretRef 経由で認証情報が設定されているが、現在のコマンドパスでは利用できない場合は `configured_unavailable` を使用する。

これにより、読み取り専用コマンドは、クラッシュしたり未設定として誤報したりする代わりに、「設定済みだがこのコマンドパスでは利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を持つ `package.json` を含められます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリは 1 つの Plugin になります。パックに複数の extension が列挙されている場合、Plugin id は
`name/<fileBase>` になります。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリ内で依存関係をインストールして
`node_modules` を利用可能にしてください（`npm install` / `pnpm install`）。

セキュリティ上のガードレール: すべての `openclaw.extensions` エントリは、symlink 解決後も Plugin ディレクトリ内に留まっていなければなりません。パッケージディレクトリの外へ出るエントリは拒否されます。

セキュリティに関する注記: `openclaw plugins install` は、
継承されたグローバル npm install 設定を無視し、プロジェクトローカルの
`npm install --omit=dev --ignore-scripts` で Plugin 依存関係をインストールします（ライフサイクルスクリプトなし、ランタイムで dev dependencies なし）。
Plugin の依存関係ツリーは「純粋な JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は軽量なセットアップ専用モジュールを指せます。
OpenClaw が無効なチャネル Plugin のセットアップサーフェスを必要とする場合、または
チャネル Plugin が有効でもまだ未設定の場合、完全な Plugin エントリの代わりに `setupEntry`
を読み込みます。これにより、メイン Plugin エントリがツール、フック、その他のランタイム専用コードも配線している場合でも、起動とセットアップを軽く保てます。

任意:
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使うと、チャネルがすでに設定済みであっても、gateway の
listen 前起動フェーズ中にチャネル Plugin を同じ `setupEntry` パスへオプトインさせることができます。

これは、gateway が listen を開始する前に存在していなければならない起動サーフェスを
`setupEntry` が完全にカバーしている場合にのみ使用してください。実際には、セットアップエントリは、起動が依存するチャネル所有機能をすべて登録する必要があります。たとえば次のようなものです。

- チャネル登録そのもの
- gateway が listen を開始する前に利用可能でなければならない HTTP ルート
- 同じウィンドウ中に存在していなければならない gateway メソッド、ツール、サービス

完全エントリが依然として必要な起動機能を所有している場合は、このフラグを有効にしないでください。デフォルト動作のままにして、起動時に OpenClaw が完全エントリを読み込むようにしてください。

同梱チャネルは、完全なチャネルランタイムが読み込まれる前にコアが参照できる、セットアップ専用の contract-surface ヘルパーを公開することもできます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全な Plugin エントリを読み込まずに、レガシーな単一アカウントチャネル設定を
`channels.<id>.accounts.*` に昇格する必要があるときにそのサーフェスを使用します。
現在の同梱例は Matrix です。名前付きアカウントがすでに存在する場合、認証/bootstrap キーのみを名前付き昇格アカウントに移動し、常に
`accounts.default` を作成するのではなく、設定済みの非 canonical な default-account キーを保持できます。

これらのセットアップパッチアダプターにより、同梱コントラクトサーフェスの検出を遅延化できます。インポート時の負荷は軽く保たれ、昇格サーフェスはモジュールインポート時に同梱チャネル起動へ再入するのではなく、最初の使用時にのみ読み込まれます。

それらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有の
prefix に置いてください。コア管理 namespace（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、たとえ
Plugin がより狭いスコープを要求しても、常に `operator.admin` に解決されます。

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

チャネル Plugin は、`openclaw.channel` を通じてセットアップ/検出メタデータを、`openclaw.install` を通じてインストールヒントを広告できます。これにより、コアのカタログをデータフリーに保てます。

例:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（self-hosted）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Nextcloud Talk Webhook bot 経由の self-hosted チャット。",
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

- `detailLabel`: より豊かなカタログ/ステータスサーフェス向けの副次ラベル
- `docsLabel`: ドキュメントリンクのリンクテキストを上書きする
- `preferOver`: このカタログエントリが優先して上回るべき、より低優先度の Plugin/チャネル id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェス上のコピー制御
- `markdownCapable`: アウトバウンド整形の判断で、そのチャネルが markdown 対応であることを示す
- `exposure.configured`: `false` に設定すると、設定済みチャネル一覧サーフェスからそのチャネルを隠す
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからそのチャネルを隠す
- `exposure.docs`: ドキュメントナビゲーションサーフェス上で、そのチャネルを内部用/非公開として示す
- `showConfigured` / `showInSetup`: 互換性のため引き続き受け付けられるレガシー別名。`exposure` を推奨
- `quickstartAllowFrom`: 標準クイックスタート `allowFrom` フローにそのチャネルをオプトインさせる
- `forceAccountBinding`: アカウントが 1 つしかない場合でも明示的なアカウントバインディングを必須にする
- `preferSessionLookupForAnnounceTarget`: announce ターゲット解決時にセッション検索を優先する

OpenClaw は **外部チャネルカタログ**（たとえば MPM
レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを配置してください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で
1 つ以上の JSON ファイルを指定します（カンマ/セミコロン/`PATH` 区切り）。各ファイルには
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
を含めてください。パーサーは `"entries"` キーのレガシー別名として
`"packages"` または `"plugins"` も受け付けます。

生成されたチャネルカタログエントリおよびプロバイダインストールカタログエントリは、生の `openclaw.install` ブロックに加えて、正規化されたインストールソース情報を公開します。正規化された情報では、npm spec が厳密なバージョンか浮動セレクターか、期待される integrity メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージの識別情報が既知の場合、正規化された情報は、解析された npm パッケージ名がその識別情報からずれていると警告します。また、`defaultChoice` が無効な場合や利用できないソースを指している場合、さらに有効な npm ソースなしで npm integrity メタデータが存在する場合にも警告します。利用側は `installSource` を追加的な任意フィールドとして扱うべきです。これにより、手作業で作成したエントリやカタログ shim がそれを合成する必要はありません。
これにより、オンボーディングと診断は Plugin ランタイムをインポートせずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、厳密な `npmSpec` と
`expectedIntegrity` を優先すべきです。素のパッケージ名や dist-tag も互換性のため引き続き動作しますが、ソースプレーン警告が表示されるため、既存の Plugin を壊さずにカタログを固定・integrity 検証付きインストールへ移行できます。
ローカルカタログパスからオンボーディングでインストールする場合、可能であれば `source: "path"` とワークスペース相対の
`sourcePath` を持つ managed plugin の plugin index エントリを記録します。実際の絶対読み込みパスは `plugins.load.paths` に残り、インストールレコードではローカルワークステーションのパスを長期設定に重複保存しません。これにより、ローカル開発インストールをソースプレーン診断で可視化しつつ、生のファイルシステムパスを開示する面を 2 つ目追加せずに済みます。永続化される `plugins/installs.json` plugin index はインストールソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが欠落している場合や無効な場合でも永続的であり、`plugins` 配列は再構築可能なマニフェスト/キャッシュビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。
Plugin から `api.registerContextEngine(id, factory)` で登録し、
`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

デフォルトのコンテキストパイプラインを単にメモリ検索やフックで拡張するのではなく、置き換えるか拡張する必要がある場合にこれを使用します。

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

エンジンが Compaction アルゴリズムを**所有しない**場合でも、`compact()`
は実装し、明示的に委譲してください。

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

## 新しい機能の追加

Plugin に現在の API に収まらない動作が必要な場合は、private な内部到達で
Plugin システムを回避しないでください。不足している機能を追加してください。

推奨される手順:

1. コアコントラクトを定義する
   コアが所有すべき共有動作を決めます: ポリシー、フォールバック、設定マージ、
   ライフサイクル、チャネル向けセマンティクス、ランタイムヘルパーの形状。
2. 型付きの Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な
   型付き機能サーフェスで拡張します。
3. コア + チャネル/機能利用側を配線する
   チャネルおよび機能 Plugin は、新しい機能をコア経由で利用すべきであり、
   ベンダー実装を直接インポートしてはいけません。
4. ベンダー実装を登録する
   その後、ベンダー Plugin がその機能に対してバックエンドを登録します。
5. コントラクトカバレッジを追加する
   所有権と登録形状が時間とともに明示的に保たれるよう、テストを追加します。

これが、OpenClaw が特定プロバイダの世界観にハードコードされることなく、
意見を持った設計を保てる理由です。具体的なファイルチェックリストと作業例については
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### 機能チェックリスト

新しい機能を追加する場合、実装では通常、次のサーフェスをまとめて変更する必要があります。

- `src/<capability>/types.ts` のコアコントラクト型
- `src/<capability>/runtime.ts` のコアランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャネル Plugin が利用する必要がある場合の `src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` の capture/test ヘルパー
- `src/plugins/contracts/registry.ts` の所有権/コントラクト検証
- `docs/` のオペレーター/Plugin 向けドキュメント

これらのサーフェスのいずれかが欠けている場合、それは通常、その機能がまだ完全には統合されていない兆候です。

### 機能テンプレート

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

// 機能/チャネル Plugin 向けの共有ランタイムヘルパー
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

コントラクトテストのパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールは単純に保たれます。

- コアが機能コントラクト + オーケストレーションを所有する
- ベンダー Plugin がベンダー実装を所有する
- 機能/チャネル Plugin がランタイムヘルパーを利用する
- コントラクトテストが所有権を明示的に保つ

## 関連

- [Plugin architecture](/ja-JP/plugins/architecture) — 公開機能モデルと形状
- [Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
