---
read_when:
    - プロバイダーランタイムフック、チャンネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しい Plugin 機能またはコンテキストエンジン Plugin の追加
summary: 'Pluginアーキテクチャ内部: 読み込みパイプライン、レジストリ、ランタイムフック、HTTPルート、参照表'
title: Plugin アーキテクチャの内部構造
x-i18n:
    generated_at: "2026-05-11T20:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の形状、所有権/実行契約については、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページは、内部メカニズムのリファレンスです: 読み込みパイプライン、registry、runtime hooks、Gateway HTTP routes、import paths、schema tables。

## 読み込みパイプライン

起動時に、OpenClaw はおおよそ次のことを行います:

1. 候補 Plugin root を検出する
2. ネイティブまたは互換 bundle manifest と package metadata を読み取る
3. 安全でない候補を拒否する
4. plugin config (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`) を正規化する
5. 各候補の有効化を決定する
6. 有効化された native modules を読み込む: ビルド済み bundled modules は native loader を使い、
   third-party local source TypeScript は緊急用の Jiti fallback を使う
7. native `register(api)` hooks を呼び出し、registrations を plugin registry に収集する
8. registry を commands/runtime surfaces に公開する

<Note>
`activate` は `register` の legacy alias です。loader は存在するほう (`def.register ?? def.activate`) を解決し、同じタイミングで呼び出します。すべての bundled plugins は `register` を使用しています。新しい plugins では `register` を優先してください。
</Note>

安全ゲートは runtime execution の**前**に行われます。entry が plugin root の外へ出る場合、path が world-writable の場合、または non-bundled plugins で path ownership が不審に見える場合、候補はブロックされます。

ブロックされた候補は診断のために plugin id との関連付けを維持します。config がその id をまだ参照している場合、validation はその plugin を存在するがブロック済みとして報告し、config entry を stale として扱うのではなく、path-safety warning を参照します。

### Manifest-first の動作

manifest は control-plane の信頼できる情報源です。OpenClaw はこれを使って次を行います:

- plugin を識別する
- 宣言された channels/skills/config schema または bundle capabilities を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI labels/placeholders を補強する
- install/catalog metadata を表示する
- plugin runtime を読み込まずに、低コストな activation と setup descriptors を保持する

native plugins では、runtime module が data-plane 部分です。hooks、tools、commands、provider flows などの実際の動作を登録します。

任意の manifest `activation` および `setup` blocks は control plane に残ります。これらは activation planning と setup discovery のための metadata-only descriptors です。runtime registration、`register(...)`、または `setupEntry` を置き換えるものではありません。
最初の live activation consumers は、より広い registry materialization の前に plugin loading を絞り込むため、manifest command、channel、provider hints を使うようになりました:

- CLI loading は、要求された primary command を所有する plugins に絞り込む
- channel setup/plugin resolution は、要求された
  channel id を所有する plugins に絞り込む
- explicit provider setup/runtime resolution は、要求された
  provider id を所有する plugins に絞り込む
- Gateway startup planning は、明示的な startup imports と startup opt-outs に `activation.onStartup` を使用する。startup metadata のない plugins は、より狭い activation triggers 経由でのみ読み込む

広い `all` scope を要求する request-time runtime preloads でも、config、startup planning、configured channels、slots、auto-enable rules から明示的な effective plugin id set を導出します。その導出された set が空の場合、OpenClaw は検出可能なすべての plugin に広げるのではなく、空の runtime registry を読み込みます。

activation planner は、既存 callers 向けの ids-only API と、新しい diagnostics 向けの plan API の両方を公開します。Plan entries は、plugin が選択された理由を報告し、明示的な `activation.*` planner hints と、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、hooks などの manifest ownership fallback を分離します。この reason split が互換性境界です。既存の plugin metadata は動作し続け、新しいコードは runtime loading semantics を変更せずに broad hints や fallback behavior を検出できます。

Setup discovery は、`setup-api` に fallback する前に、`setup.providers` や `setup.cliBackends` など descriptor-owned ids を優先して candidate plugins を絞り込むようになりました。provider setup lists は、provider runtime を読み込まずに、manifest `providerAuthChoices`、descriptor-derived setup choices、install-catalog metadata を使います。明示的な `setup.requiresRuntime: false` は descriptor-only cutoff です。省略された `requiresRuntime` は互換性のために legacy setup-api fallback を維持します。検出された複数の plugin が同じ normalized setup provider または CLI backend id を主張する場合、setup lookup は discovery order に依存せず、曖昧な owner を拒否します。setup runtime が実行される場合、registry diagnostics は legacy plugins をブロックせずに、`setup.providers` / `setup.cliBackends` と setup-api によって登録された providers または CLI backends の間の drift を報告します。

### Plugin cache boundary

OpenClaw は、plugin discovery results や direct manifest registry data を wall-clock windows の背後でキャッシュしません。installs、manifest edits、load-path changes は、次の明示的な metadata read または snapshot rebuild で可視になる必要があります。
manifest file parser は、開かれた manifest path、inode、size、timestamps をキーにした bounded file-signature cache を保持できます。この cache は変更されていない bytes の再解析を避けるだけであり、discovery、registry、owner、policy answers をキャッシュしてはなりません。

安全な metadata fast path は、隠れた cache ではなく明示的な object ownership です。
Gateway startup hot paths は、現在の `PluginMetadataSnapshot`、導出された `PluginLookUpTable`、または明示的な manifest registry を call chain 経由で渡すべきです。Config validation、startup auto-enable、plugin bootstrap、provider selection は、それらの objects が現在の config と plugin inventory を表している間、それらを再利用できます。Setup lookup は、特定の setup path が明示的な manifest registry を受け取らない限り、必要に応じて manifest metadata を再構築します。隠れた lookup caches を追加するのではなく、それを cold-path fallback として維持してください。input が変わった場合は、snapshot を mutate したり historical copies を保持したりせず、rebuild して置き換えます。
active plugin registry と bundled channel bootstrap helpers に対する views は、現在の registry/root から再計算すべきです。Short-lived maps は、作業を dedupe したり reentry を防いだりするために 1 回の呼び出し内で使う分には問題ありません。それらが process metadata caches になってはなりません。

plugin loading では、persistent cache layer は runtime loading です。code または installed artifacts が実際に読み込まれる場合、たとえば次のような loader state を再利用できます:

- `PluginLoaderCacheState` と compatible active runtime registries
- 同じ runtime surface を繰り返し import することを避けるために使われる jiti/module caches と public-surface loader caches
- installed plugin artifacts の filesystem caches
- path normalization または duplicate resolution のための short-lived per-call maps

これらの caches は data-plane implementation details です。caller が意図的に runtime loading を要求した場合を除き、「この provider を所有する plugin はどれか?」のような control-plane questions に答えてはなりません。

次のものに persistent または wall-clock caches を追加しないでください:

- discovery results
- direct manifest registries
- installed plugin index から再構築された manifest registries
- provider owner lookup、model suppression、provider policy、または public-artifact
  metadata
- manifest、installed index、または load path の変更が次の metadata read で可視になるべき、その他の manifest-derived answer

persisted installed plugin index から manifest metadata を rebuild する callers は、その registry を必要に応じて再構築します。installed index は durable source-plane state であり、隠れた in-process metadata cache ではありません。

## Registry モデル

読み込まれた plugins は、random core globals を直接 mutate しません。central plugin registry に登録します。

registry は次を追跡します:

- plugin records (identity, source, origin, status, diagnostics)
- tools
- legacy hooks と typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin-owned commands

Core features は、plugin modules と直接やり取りするのではなく、その registry から読み取ります。これにより loading は一方向に保たれます:

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性にとって重要です。つまり、ほとんどの core surfaces が必要とする integration point は 1 つだけです。「registry を読む」ことであり、「すべての plugin module を special-case する」ことではありません。

## Conversation binding callbacks

conversation を bind する plugins は、approval が解決されたときに反応できます。

bind request が approved または denied された後に callback を受け取るには、`api.onConversationBindingResolved(...)` を使用します:

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

Callback payload fields:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: approved requests の resolved binding
- `request`: original request summary、detach hint、sender id、および
  conversation metadata

この callback は notification-only です。conversation を bind できる主体を変更せず、core approval handling が完了した後に実行されます。

## Provider runtime hooks

Provider plugins には 3 つの layers があります:

- **Manifest metadata**: 低コストな pre-runtime lookup 用:
  `setup.providers[].envVars`、deprecated compatibility `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、および `channelEnvVars`。
- **Config-time hooks**: `catalog` (legacy `discovery`) と
  `applyConfigDefaults`。
- **Runtime hooks**: auth、model resolution、
  stream wrapping、thinking levels、replay policy、usage endpoints を対象にする 40 個以上の optional hooks。完全な一覧は [Hook order and usage](#hook-order-and-usage) を参照してください。

OpenClaw は引き続き generic agent loop、failover、transcript handling、tool policy を所有します。これらの hooks は、provider-specific behavior の extension surface であり、完全な custom inference transport を必要としません。

provider に env-based credentials があり、generic auth/status/model-picker paths が plugin runtime を読み込まずに参照すべき場合は、manifest `setup.providers[].envVars` を使用します。Deprecated `providerAuthEnvVars` は deprecation window 中は compatibility adapter によって引き続き読み取られ、それを使用する non-bundled plugins は manifest diagnostic を受け取ります。ある provider id が別の provider id の env vars、auth profiles、config-backed auth、API-key onboarding choice を再利用すべき場合は、manifest `providerAuthAliases` を使用します。onboarding/auth-choice CLI surfaces が provider の choice id、group labels、simple one-flag auth wiring を provider runtime を読み込まずに知るべき場合は、manifest `providerAuthChoices` を使用します。onboarding labels や OAuth client-id/client-secret setup vars など operator-facing hints には、provider runtime `envVars` を維持してください。

channel に env-driven auth または setup があり、generic shell-env fallback、config/status checks、setup prompts が channel runtime を読み込まずに参照すべき場合は、manifest `channelEnvVars` を使用します。

### Hook order and usage

model/provider plugins について、OpenClaw はおおよそ次の順序で hooks を呼び出します。
「When to use」列は簡単な判断ガイドです。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw がすでに呼び出さなくなった compatibility-only provider fields は、意図的にここには載せていません。

| #   | フック                            | 内容                                                                                                           | 使用する場面                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` へ公開する                                        | プロバイダーがカタログまたはベース URL のデフォルトを所有している                                                                            |
| 2   | `applyConfigDefaults`             | 設定の実体化中に、プロバイダー所有のグローバル設定デフォルトを適用する                                        | デフォルトが認証モード、env、またはプロバイダーモデルファミリーのセマンティクスに依存する                                                    |
| --  | _(組み込みモデル検索)_            | OpenClaw はまず通常のレジストリ/カタログ経路を試す                                                            | _(プラグインフックではない)_                                                                                                                  |
| 3   | `normalizeModelId`                | 検索前にレガシーまたはプレビューの model-id エイリアスを正規化する                                            | 正規モデル解決の前に、プロバイダーがエイリアスのクリーンアップを所有している                                                                |
| 4   | `normalizeTransport`              | 汎用モデル組み立ての前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                             | 同じトランスポートファミリー内のカスタムプロバイダー ID について、プロバイダーがトランスポートのクリーンアップを所有している               |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決の前に `models.providers.<id>` を正規化する                                        | Plugin 側に置くべき設定クリーンアップがプロバイダーに必要である。バンドルされた Google ファミリーヘルパーも、サポート対象の Google 設定エントリを補完する |
| 6   | `applyNativeStreamingUsageCompat` | ネイティブのストリーミング使用量互換の書き換えを設定プロバイダーに適用する                                   | エンドポイント駆動のネイティブストリーミング使用量メタデータ修正がプロバイダーに必要                                                        |
| 7   | `resolveConfigApiKey`             | ランタイム認証の読み込み前に、設定プロバイダー向けの env マーカー認証を解決する                              | プロバイダー所有の env マーカー API キー解決がある。`amazon-bedrock` には、ここに組み込みの AWS env マーカー解決もある                     |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずにローカル/セルフホストまたは設定ベースの認証を表面化する                                    | プロバイダーが合成/ローカル認証情報マーカーで動作できる                                                                                     |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/アプリ所有の認証情報ではデフォルトの `persistence` は `runtime-only` | コピーされたリフレッシュトークンを永続化せずに、プロバイダーが外部認証情報を再利用する。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを env/設定ベース認証の背後に下げる                                | 優先順位で勝つべきではない合成プレースホルダープロファイルをプロバイダーが保存する                                                          |
| 11  | `resolveDynamicModel`             | まだローカルレジストリにない、プロバイダー所有のモデル ID 向け同期フォールバック                             | プロバイダーが任意のアップストリームモデル ID を受け入れる                                                                                  |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップを行い、その後 `resolveDynamicModel` が再実行される                                      | 未知の ID を解決する前に、プロバイダーがネットワークメタデータを必要とする                                                                  |
| 13  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使用する前の最終書き換え                                                   | プロバイダーはトランスポート書き換えを必要とするが、引き続きコアトランスポートを使用する                                                    |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデル向けの互換フラグを提供する                                   | プロバイダーを引き継がずに、プロキシトランスポート上の自社モデルをプロバイダーが認識する                                                    |
| 15  | `normalizeToolSchemas`            | 埋め込みランナーが見る前にツールスキーマを正規化する                                                         | プロバイダーがトランスポートファミリーのスキーマクリーンアップを必要とする                                                                  |
| 16  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を表面化する                                                       | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい                                                              |
| 17  | `resolveReasoningOutputMode`      | ネイティブまたはタグ付き reasoning-output コントラクトを選択する                                             | ネイティブフィールドではなく、タグ付き推論/最終出力がプロバイダーに必要                                                                     |
| 18  | `prepareExtraParams`              | 汎用ストリームオプションラッパーの前にリクエストパラメーターを正規化する                                     | デフォルトのリクエストパラメーターまたはプロバイダー別パラメータークリーンアップがプロバイダーに必要                                       |
| 19  | `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                               | 単なるラッパーではなく、カスタムのワイヤプロトコルがプロバイダーに必要                                                                      |
| 20  | `wrapStreamFn`                    | 汎用ラッパー適用後のストリームラッパー                                                                       | カスタムトランスポートなしで、リクエストヘッダー/本文/モデル互換ラッパーがプロバイダーに必要                                               |
| 21  | `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたはメタデータを付加する                                     | 汎用トランスポートにプロバイダーネイティブのターン ID を送らせたい                                                                          |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションのクールダウンポリシーを付加する                                | 汎用 WS トランスポートでセッションヘッダーまたはフォールバックポリシーを調整したい                                                          |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                     | プロバイダーが追加の認証メタデータを保存し、カスタムのランタイムトークン形状を必要とする                                                    |
| 24  | `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き              | プロバイダーが共有の `pi-ai` リフレッシャーに適合しない                                                                                     |
| 25  | `buildAuthDoctorHint`             | OAuth リフレッシュ失敗時に追加される修復ヒント                                                               | リフレッシュ失敗後に、プロバイダー所有の認証修復ガイダンスがプロバイダーに必要                                                              |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                             | 汎用ヒューリスティックでは見逃す生のオーバーフローエラーがプロバイダーにある                                                                |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                   | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などへマッピングできる                                                       |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けプロンプトキャッシュポリシー                                            | プロバイダーがプロキシ固有のキャッシュ TTL ゲーティングを必要とする                                                                         |
| 29  | `buildMissingAuthMessage`         | 汎用の認証不足リカバリーメッセージの置き換え                                                                 | プロバイダー固有の認証不足リカバリーヒントがプロバイダーに必要                                                                              |
| 30  | `augmentModelCatalog`             | 検出後に追加される合成/最終カタログ行                                                                        | `models list` とピッカーで、合成の前方互換行がプロバイダーに必要                                                                            |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                   | 選択されたモデル向けに、カスタム thinking ラダーまたはバイナリラベルをプロバイダーが公開する                                                |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                                | プロバイダーがバイナリの thinking オン/オフのみを公開する                                                                                   |
| 33  | `supportsXHighThinking`           | `xhigh` 推論サポート互換フック                                                                               | モデルの一部だけで `xhigh` を有効にしたい                                                                                                   |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                         | モデルファミリー向けのデフォルト `/think` ポリシーをプロバイダーが所有している                                                              |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                       | ライブ/スモークの優先モデルマッチングをプロバイダーが所有している                                                                           |
| 36  | `prepareRuntimeAuth`              | 推論の直前に、設定済み認証情報を実際のランタイムトークン/キーに交換する                                      | トークン交換または短命リクエスト認証情報がプロバイダーに必要                                                                                |
| 37  | `resolveUsageAuth`                | `/usage` と関連するステータス表示向けの使用量/請求認証情報を解決する                                     | プロバイダーにカスタムの使用量/クォータトークン解析、または別の使用量認証情報が必要                                                               |
| 38  | `fetchUsageSnapshot`              | 認証の解決後にプロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーにプロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索向けにプロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの挙動はプロバイダー Plugin に属する                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにカスタムのトランスクリプトポリシー（たとえば思考ブロックの除去）が必要                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用トランスクリプトクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーに共有 Compaction ヘルパーを超えるプロバイダー固有のリプレイ書き換えが必要                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に最終的なリプレイターン検証または再整形を行う                                           | プロバイダーのトランスポートに、汎用サニタイズ後のより厳格なターン検証が必要                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後の副作用を実行する                                                                 | モデルがアクティブになったとき、プロバイダーにテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` はまず一致したプロバイダーPluginを確認し、その後、他のフック対応プロバイダーPluginへフォールスルーして、いずれかが実際にモデル ID またはトランスポート/設定を変更するまで続けます。これにより、呼び出し元がどの組み込みPluginが書き換えを所有しているかを知る必要なく、エイリアス/互換プロバイダーのシムが動作し続けます。プロバイダーフックがサポート対象の Google 系設定エントリーを書き換えない場合でも、組み込みの Google 設定ノーマライザーがその互換性クリーンアップを引き続き適用します。

プロバイダーが完全にカスタムのワイヤープロトコルまたはカスタムリクエスト実行器を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き動作するプロバイダー挙動のためのものです。

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

組み込みプロバイダーPluginは、各ベンダーのカタログ、認証、思考、リプレイ、使用量の要件に合わせるため、上記のフックを組み合わせます。正準のフックセットは `extensions/` 配下の各Pluginにあります。このページでは一覧をそのまま反映するのではなく、形を示します。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は、OpenClaw の静的カタログより前に上流のモデル ID を提示できるよう、`catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録します。
  </Accordion>
  <Accordion title="OAuth と使用量エンドポイントのプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は、トークン交換と `/usage` 統合を所有するために、
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせます。
  </Accordion>
  <Accordion title="リプレイとトランスクリプトクリーンアップのファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各Pluginがクリーンアップを再実装する代わりに、プロバイダーは
    `buildReplayPolicy` 経由でトランスクリプトポリシーを選択できます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine` は `catalog` だけを登録し、共有推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic 固有のストリームヘルパー">
    ベータヘッダー、`/fast` / `serviceTier`、および `context1m` は、汎用 SDK ではなく Anthropic Plugin の公開 `api.ts` / `contract-api.ts` 境界
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）の内部にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Pluginは `api.runtime` 経由で選択されたコアヘルパーにアクセスできます。TTS の場合:

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

- `textToSpeech` は、ファイル/音声メモサーフェス向けの通常のコア TTS 出力ペイロードを返します。
- コアの `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファー + サンプルレートを返します。Pluginはプロバイダー向けにリサンプリング/エンコードする必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローに使用します。
- 音声一覧には、プロバイダー対応ピッカー向けにロケール、性別、パーソナリティタグなどのより豊富なメタデータを含められます。
- OpenAI と ElevenLabs は現在テレフォニーをサポートしています。Microsoft はサポートしていません。

Pluginは `api.registerSpeechProvider(...)` 経由で音声プロバイダーも登録できます。

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
- レガシーの Microsoft `edge` 入力は `microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは会社指向です。OpenClaw がこれらの機能コントラクトを追加するにつれて、1 つのベンダーPluginがテキスト、音声、画像、将来のメディアプロバイダーを所有できます。

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

- オーケストレーション、フォールバック、設定、チャネル配線はコアに保持します。
- ベンダー挙動はプロバイダーPluginに保持します。
- 追加的な拡張は型付きのままにします。新しい任意メソッド、新しい任意結果フィールド、新しい任意機能を使います。
- 動画生成もすでに同じパターンに従っています:
  - コアが機能コントラクトとランタイムヘルパーを所有します
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

- `api.runtime.mediaUnderstanding.*` は、画像/音声/動画理解のための推奨共有サーフェスです。
- `extractStructuredWithModel(...)` は、境界付けられたプロバイダー所有の画像優先抽出に向けたPlugin向け境界です。少なくとも 1 つの画像入力を含めます。テキスト入力は補足コンテキストです。プロダクトPluginは自分のルートとスキーマを所有し、OpenClaw はプロバイダー/ランタイム境界を所有します。
- コアのメディア理解音声設定（`tools.media.audio`）とプロバイダーのフォールバック順を使用します。
- 文字起こし出力が生成されない場合（たとえばスキップされた入力/未サポート入力）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性エイリアスとして残ります。

Pluginは `api.runtime.subagent` 経由でバックグラウンドのサブエージェント実行も開始できます。

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
- 信頼済みPluginを特定の正準 `provider/model` ターゲットに制限するには `plugins.entries.<id>.subagent.allowedModels` を使用し、任意のターゲットを明示的に許可するには `"*"` を使用します。
- 信頼されていないPluginのサブエージェント実行も動作しますが、オーバーライドリクエストは黙ってフォールバックされるのではなく拒否されます。
- Pluginが作成したサブエージェントセッションには、作成元のPlugin ID がタグ付けされます。フォールバックの `api.runtime.subagent.deleteSession(...)` は、それらの所有セッションのみを削除できます。任意のセッション削除には、引き続き管理者スコープの Gateway リクエストが必要です。

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

Pluginは `api.registerWebSearchProvider(...)` 経由で Web 検索プロバイダーも登録できます。

注:

- プロバイダー選択、認証情報解決、共有リクエストセマンティクスはコアに保持します。
- ベンダー固有の検索トランスポートには Web 検索プロバイダーを使用します。
- `api.runtime.webSearch.*` は、エージェントツールラッパーに依存せず検索挙動を必要とする機能/チャネルPlugin向けの推奨共有サーフェスです。

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
- `auth`: 必須。通常の Gateway 認証を要求するには `"gateway"` を使用し、Plugin管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じPluginが自身の既存ルート登録を置き換えられるようにします。
- `handler`: ルートがリクエストを処理した場合に `true` を返します。

注:

- `api.registerHttpHandler(...)` は削除されており、プラグイン読み込みエラーを引き起こします。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` でない限り拒否されます。また、あるプラグインが別のプラグインのルートを置き換えることはできません。
- 異なる `auth` レベルを持つ重複ルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは、同じ auth レベルのみに保ってください。
- `auth: "plugin"` ルートは、オペレーター実行時スコープを自動では受け取りません。これはプラグイン管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエスト実行時スコープ内で実行されますが、そのスコープは意図的に保守的です。
  - 共有シークレットのベアラー認証 (`gateway.auth.mode = "token"` / `"password"`) では、呼び出し元が `x-openclaw-scopes` を送信しても、プラグインルートの実行時スコープは `operator.write` に固定されます
  - 信頼された ID 付き HTTP モード (たとえば `trusted-proxy` や、プライベート ingress 上の `gateway.auth.mode = "none"`) は、ヘッダーが明示的に存在する場合にのみ `x-openclaw-scopes` を尊重します
  - それらの ID 付きプラグインルートリクエストで `x-openclaw-scopes` がない場合、実行時スコープは `operator.write` にフォールバックします
- 実践上のルール: gateway 認証のプラグインルートを、暗黙の管理者サーフェスだと想定しないでください。ルートが管理者専用の動作を必要とする場合は、ID 付き認証モードを必須にし、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK インポートパス

新しいプラグインを作成するときは、モノリシックな `openclaw/plugin-sdk` ルートバレルではなく、狭い SDK サブパスを使用してください。コアサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                           |
| `openclaw/plugin-sdk/channel-core`  | チャンネルエントリ/ビルドヘルパー                |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括契約                       |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ (`OpenClawSchema`) |

チャンネルプラグインは、狭い接点のファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions` です。承認動作は、無関係なプラグインフィールドを混在させるのではなく、1 つの `approvalCapability` 契約に統合してください。[チャンネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

実行時ヘルパーと設定ヘルパーは、対応する焦点を絞った `*-runtime` サブパス
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など) の下にあります。広範な `config-runtime` 互換バレルではなく、`config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古いプラグイン向けの非推奨の互換シムです。新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント (バンドル済みプラグインパッケージのルートごと):

- `index.js` — バンドル済みプラグインエントリ
- `api.js` — ヘルパー/型バレル
- `runtime-api.js` — 実行時専用バレル
- `setup-entry.js` — セットアッププラグインエントリ

外部プラグインは `openclaw/plugin-sdk/*` サブパスのみをインポートしてください。コアまたは別のプラグインから、別のプラグインパッケージの `src/*` をインポートしないでください。ファサード読み込みエントリポイントは、存在する場合はアクティブな実行時設定スナップショットを優先し、その後ディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`, `media-understanding`, `speech` などの capability 固有サブパスは、バンドル済みプラグインが現在使用しているため存在します。これらは自動的に長期固定の外部契約になるわけではありません。依存する場合は、関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

プラグインは、リアクション、既読、投票など、メッセージ以外のプリミティブ向けに、チャンネル固有の `describeMessageTool(...)` スキーマ寄与を所有する必要があります。共有送信プレゼンテーションでは、プロバイダー固有のボタン、コンポーネント、ブロック、カードフィールドではなく、汎用 `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、プロバイダーマッピング、プラグイン作者チェックリストについては、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信可能なプラグインは、メッセージ capability を通じてレンダリング可能な内容を宣言します。

- `presentation`: セマンティックプレゼンテーションブロック (`text`, `context`, `divider`, `buttons`, `select`) 用
- `delivery-pin`: ピン留め配信リクエスト用

コアは、プレゼンテーションをネイティブにレンダリングするか、テキストに劣化させるかを決定します。汎用メッセージツールから、プロバイダー固有 UI の抜け道を公開しないでください。レガシーネイティブスキーマ向けの非推奨 SDK ヘルパーは既存のサードパーティープラグイン向けに引き続きエクスポートされますが、新しいプラグインでは使用しないでください。

## チャンネルターゲット解決

チャンネルプラグインは、チャンネル固有のターゲットセマンティクスを所有する必要があります。共有アウトバウンドホストは汎用のままにし、プロバイダールールにはメッセージングアダプターサーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化済みターゲットをディレクトリ検索前に `direct`, `group`, `channel` のどれとして扱うかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力をディレクトリ検索ではなく ID らしい解決に直接進めるべきかをコアに伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後にコアが最終的なプロバイダー所有の解決を必要とするときのプラグインフォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲットが解決された後のプロバイダー固有セッションルート構築を所有します。

推奨される分割:

- ピア/グループ検索前に行うべきカテゴリ判断には `inferTargetChatType` を使用してください。
- 「これを明示的/ネイティブなターゲット ID として扱う」チェックには `looksLikeId` を使用してください。
- 広範なディレクトリ検索ではなく、プロバイダー固有の正規化フォールバックに `resolveTarget` を使用してください。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダーネイティブ ID は、汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有パラメーター内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリを導出するプラグインは、そのロジックをプラグイン内に保ち、`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用してください。

チャンネルが次のような設定に基づくピア/グループを必要とする場合に使用します。

- allowlist 駆動の DM ピア
- 設定済みチャンネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作のみを扱います。

- クエリフィルタリング
- 制限の適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャンネル固有のアカウント検査と ID 正規化は、プラグイン実装内に留めてください。

## プロバイダーカタログ

プロバイダープラグインは、`registerProvider({ catalog: { run(...) { ... } } })` で推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します。

- `{ provider }`: 1 つのプロバイダーエントリ
- `{ providers }`: 複数のプロバイダーエントリ

プラグインがプロバイダー固有のモデル ID、ベース URL デフォルト、または認証で制限されたモデルメタデータを所有する場合は、`catalog` を使用してください。

`catalog.order` は、プラグインのカタログが OpenClaw の組み込み暗黙プロバイダーに対してどのタイミングでマージされるかを制御します。

- `simple`: プレーンな API キーまたは環境変数駆動のプロバイダー
- `profile`: 認証プロファイルが存在すると現れるプロバイダー
- `paired`: 関連する複数のプロバイダーエントリを合成するプロバイダー
- `late`: 最後のパス。他の暗黙プロバイダーの後

キー衝突では後のプロバイダーが勝つため、プラグインは同じプロバイダー ID を持つ組み込みプロバイダーエントリを意図的に上書きできます。

プラグインは `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて、読み取り専用のモデル行も公開できます。これは list/help/picker サーフェスの今後の経路であり、`text`, `image_generation`, `video_generation`, `music_generation` の行をサポートします。プロバイダープラグインは引き続きライブエンドポイント呼び出し、トークン交換、ベンダーレスポンスマッピングを所有します。コアは共通の行形状、ソースラベル、メディアツールヘルプの整形を所有します。メディア生成プロバイダー登録は、`defaultModel`, `models`, `capabilities` から静的カタログ行を自動的に合成します。

互換性:

- `discovery` はレガシーエイリアスとして引き続き機能しますが、非推奨警告を出します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します
- `augmentModelCatalog` は非推奨です。バンドル済みプロバイダーは、補足行を `registerModelCatalogProvider` を通じて公開してください

## 読み取り専用チャンネル検査

プラグインがチャンネルを登録する場合は、`resolveAccount(...)` とあわせて `plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` は実行時パスです。認証情報が完全に実体化されていると想定でき、必要なシークレットがない場合に即座に失敗できます。
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`、doctor/config 修復フローなどの読み取り専用コマンドパスは、設定を記述するだけのために実行時認証情報を実体化する必要があってはなりません。

推奨される `inspectAccount(...)` 動作:

- 説明的なアカウント状態のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような認証情報のソース/ステータスフィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するだけなら、生のトークン値を返す必要はありません。ステータス系コマンドには、`tokenStatus: "available"` (および対応するソースフィールド) を返せば十分です。
- 認証情報が SecretRef 経由で設定されているものの、現在のコマンドパスでは利用できない場合は、`configured_unavailable` を使用してください。

これにより、読み取り専用コマンドは、クラッシュしたりアカウントを未設定と誤って報告したりする代わりに、「このコマンドパスでは設定済みだが利用不可」と報告できます。

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

各エントリは 1 つのプラグインになります。パックが複数の extensions を列挙している場合、プラグイン ID は `name/<fileBase>` になります。

プラグインが npm 依存関係をインポートする場合は、そのディレクトリにインストールして `node_modules` が利用できるようにしてください (`npm install` / `pnpm install`)。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、シンボリックリンク解決後もプラグインディレクトリ内に留まる必要があります。パッケージディレクトリの外へ抜けるエントリは拒否されます。

セキュリティ上の注意: `openclaw plugins install` は、プロジェクトローカルの `npm install --omit=dev --ignore-scripts` でプラグイン依存関係をインストールします (ライフサイクルスクリプトなし、実行時の dev 依存関係なし)。継承されたグローバル npm インストール設定は無視されます。プラグイン依存ツリーは「pure JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は、軽量なセットアップ専用モジュールを指すことができます。OpenClaw が無効なチャンネルプラグインのセットアップサーフェスを必要とする場合、またはチャンネルプラグインは有効だがまだ未設定の場合、完全なプラグインエントリではなく `setupEntry` を読み込みます。これにより、メインのプラグインエントリがツール、フック、その他の実行時専用コードも接続している場合でも、起動とセットアップを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` は、チャンネルがすでに設定済みの場合でも、Gateway の listen 前起動フェーズ中にチャンネルプラグインを同じ `setupEntry` パスに参加させることができます。

これを使用するのは、Gateway がリッスンを開始する前に存在している必要がある起動サーフェスを `setupEntry` が完全にカバーしている場合のみにしてください。実際には、セットアップエントリが、起動が依存するすべてのチャネル所有 capability を登録する必要があるということです。たとえば次のようなものです。

- チャネル登録自体
- Gateway がリッスンを開始する前に利用可能でなければならない HTTP ルート
- 同じ期間中に存在していなければならない Gateway メソッド、ツール、サービス

完全エントリが必要な起動 capability をまだ所有している場合は、このフラグを有効にしないでください。Plugin はデフォルト動作のままにし、OpenClaw が起動時に完全エントリを読み込むようにしてください。

バンドルされたチャネルは、完全なチャネルランタイムが読み込まれる前に core が参照できる、セットアップ専用の契約サーフェスヘルパーも公開できます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、完全な Plugin エントリを読み込まずに、従来の単一アカウントチャネル設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、このサーフェスを使用します。現在のバンドル例は Matrix です。名前付きアカウントがすでに存在する場合は auth/bootstrap キーのみを名前付き昇格アカウントへ移動し、常に `accounts.default` を作成するのではなく、設定済みの非 canonical なデフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターは、バンドルされた契約サーフェスの検出を遅延のまま保ちます。インポート時の負荷は軽いままで、昇格サーフェスはモジュールインポート時にバンドルチャネルの起動へ再び入るのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスに置いてください。core 管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままであり、Plugin がより狭いスコープを要求した場合でも、常に `operator.admin` に解決されます。

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

チャネル Plugin は、`openclaw.channel` を介してセットアップ/検出メタデータを、`openclaw.install` を介してインストールヒントを通知できます。これにより、core カタログをデータなしのままにできます。

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
- `preferOver`: このカタログエントリが優先すべき、優先度の低い Plugin/チャネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスの文言制御
- `markdownCapable`: アウトバウンド書式設定の判断用に、チャネルを Markdown 対応としてマークする
- `exposure.configured`: `false` に設定すると、設定済みチャネル一覧サーフェスからチャネルを非表示にする
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからチャネルを非表示にする
- `exposure.docs`: ドキュメントナビゲーションサーフェス向けに、チャネルを内部/非公開としてマークする
- `showConfigured` / `showInSetup`: 互換性のため引き続き受け入れられる従来のエイリアス。`exposure` を優先する
- `quickstartAllowFrom`: チャネルを標準クイックスタート `allowFrom` フローへ参加させる
- `forceAccountBinding`: アカウントが 1 つしか存在しない場合でも、明示的なアカウントバインディングを必須にする
- `preferSessionLookupForAnnounceTarget`: 告知ターゲットを解決するときにセッション検索を優先する

OpenClaw は **外部チャネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。次のいずれかに JSON ファイルを置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）を 1 つ以上の JSON ファイル（カンマ/セミコロン/`PATH` 区切り）に向けます。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは、`"entries"` キーの従来のエイリアスとして `"packages"` または `"plugins"` も受け入れます。

生成されたチャネルカタログエントリと provider インストールカタログエントリは、生の `openclaw.install` ブロックの隣に正規化済みのインストールソース情報を公開します。正規化済みの情報は、npm spec が exact version か floating selector か、期待される integrity メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージの identity が既知の場合、正規化済みの情報は、解析された npm パッケージ名がその identity からずれていると警告します。また、`defaultChoice` が無効な場合や利用できないソースを指している場合、および有効な npm ソースなしに npm integrity メタデータが存在する場合にも警告します。consumer は `installSource` を加法的な任意フィールドとして扱うべきです。これにより、手作業で作成されたエントリやカタログ shim がそれを合成する必要はありません。
これにより、オンボーディングと診断は、Plugin ランタイムをインポートせずに source-plane 状態を説明できます。

公式の外部 npm エントリは、正確な `npmSpec` と `expectedIntegrity` を優先すべきです。裸のパッケージ名と dist-tag は互換性のため引き続き機能しますが、source-plane 警告を表示するため、既存の Plugin を壊さずに、カタログを pin され integrity チェック済みのインストールへ移行できます。オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` とワークスペース相対の `sourcePath` を持つ、管理対象 Plugin の Plugin インデックスエントリを記録します。絶対的な運用ロードパスは `plugins.load.paths` に残ります。インストール記録は、ローカルワークステーションパスを長期設定へ重複して書き込むことを避けます。これにより、source-plane 診断からローカル開発インストールを確認できる一方で、2 つ目の生のファイルシステムパス開示サーフェスを追加しません。永続化された `plugins/installs.json` Plugin インデックスは、インストールソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin manifest が欠落または無効な場合でも永続的です。その `plugins` 配列は、再構築可能な manifest view です。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

Plugin が、単にメモリ検索や hook を追加するだけではなく、デフォルトのコンテキストパイプラインを置き換える、または拡張する必要がある場合に使用してください。

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

factory の `ctx` は、構築時初期化用の任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

エンジンが Compaction アルゴリズムを所有しない場合でも、`compact()` は実装したままにし、明示的に委譲してください。

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

Plugin が現在の API に合わない動作を必要とする場合、非公開の reach-in で Plugin システムを迂回しないでください。欠けている capability を追加してください。

推奨される手順:

1. core 契約を定義する
   core が所有すべき共有動作を決めます。policy、fallback、config merge、lifecycle、channel-facing semantics、runtime helper shape です。
2. 型付き Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な型付き capability サーフェスで拡張します。
3. core とチャネル/feature consumer を配線する
   チャネルと feature Plugin は、vendor 実装を直接インポートするのではなく、core を通じて新しい capability を使用すべきです。
4. vendor 実装を登録する
   その後、vendor Plugin が capability に対して backend を登録します。
5. 契約 coverage を追加する
   所有権と登録形状が時間が経っても明示的に保たれるよう、テストを追加します。

これにより、OpenClaw は 1 つの provider の世界観に hardcode されることなく、方針を持ち続けられます。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/adding-capabilities) を参照してください。

### capability チェックリスト

新しい capability を追加する場合、実装では通常、次のサーフェスをまとめて触る必要があります。

- `src/<capability>/types.ts` の core 契約型
- `src/<capability>/runtime.ts` の core runner/runtime helper
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- feature/チャネル Plugin がそれを使用する必要がある場合の `src/plugins/runtime/*` の Plugin runtime exposure
- `src/test-utils/plugin-registration.ts` の capture/test helper
- `src/plugins/contracts/registry.ts` の ownership/contract assertion
- `docs/` の operator/Plugin ドキュメント

これらのサーフェスのいずれかが欠けている場合、通常その capability はまだ完全には統合されていないことを示しています。

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

契約テストパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これにより、ルールは単純に保たれます。

- core は capability 契約と orchestration を所有する
- vendor Plugin は vendor 実装を所有する
- feature/チャネル Plugin は runtime helper を使用する
- 契約テストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開 capability model と shape
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
