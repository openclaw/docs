---
read_when:
    - プロバイダーランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しい Plugin 機能またはコンテキストエンジン Plugin の追加
summary: 'Plugin アーキテクチャの内部: ロードパイプライン、レジストリ、ランタイムフック、HTTP ルート、参照表'
title: Plugin アーキテクチャの内部構造
x-i18n:
    generated_at: "2026-05-02T20:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の形状、所有権/実行コントラクトについては、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページは、読み込みパイプライン、registry、ランタイム hook、Gateway HTTP ルート、import パス、schema table などの内部メカニクスに関するリファレンスです。

## 読み込みパイプライン

起動時、OpenClaw はおおよそ次の処理を行います。

1. 候補となる Plugin root を検出する
2. native または compatible bundle manifest と package metadata を読み取る
3. 安全でない候補を拒否する
4. Plugin config（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補を有効化するかどうかを決定する
6. 有効化された native module を読み込む: ビルド済みの bundled module は native loader を使い、
   サードパーティの local source TypeScript は emergency Jiti fallback を使う
7. native `register(api)` hook を呼び出し、登録内容を Plugin registry に収集する
8. registry を command/runtime surface に公開する

<Note>
`activate` は `register` の legacy alias です。loader は存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべての bundled Plugin は `register` を使います。新しい Plugin では `register` を優先してください。
</Note>

安全性ゲートは、ランタイム実行の**前**に適用されます。entry が Plugin root の外へ抜ける場合、path が world-writable の場合、または non-bundled Plugin で path の所有権が不審に見える場合、候補はブロックされます。

### Manifest-first の挙動

manifest は control-plane の信頼できる情報源です。OpenClaw はこれを使って次を行います。

- Plugin を識別する
- 宣言された channel/skill/config schema または bundle capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI の label/placeholder を補強する
- install/catalog metadata を表示する
- Plugin runtime を読み込まずに、低コストの activation descriptor と setup descriptor を保持する

native Plugin では、runtime module が data-plane 部分です。hook、tool、command、provider flow などの実際の挙動を登録します。

任意の manifest `activation` block と `setup` block は control plane に残ります。これらは activation 計画と setup 検出のための metadata-only descriptor です。runtime registration、`register(...)`、`setupEntry` を置き換えるものではありません。
最初の live activation consumer は、より広い registry materialization の前に Plugin の読み込みを絞り込むため、manifest の command、channel、provider hint を使うようになりました。

- CLI loading は、要求された primary command を所有する Plugin に絞り込む
- channel setup/Plugin resolution は、要求された channel id を所有する Plugin に絞り込む
- 明示的な provider setup/runtime resolution は、要求された provider id を所有する Plugin に絞り込む
- Gateway startup planning は、明示的な startup import と startup opt-out に `activation.onStartup` を使う。startup metadata のない Plugin は、より狭い activation trigger を通じてのみ読み込まれる

広い `all` scope を要求する request-time runtime preload でも、config、startup planning、configured channel、slot、auto-enable rule から、明示的な有効 Plugin id set を導出します。その導出 set が空の場合、OpenClaw は検出可能なすべての Plugin に広げるのではなく、空の runtime registry を読み込みます。

activation planner は、既存 caller 向けの ids-only API と、新しい diagnostics 向けの plan API の両方を公開します。plan entry は Plugin が選択された理由を報告し、明示的な `activation.*` planner hint と、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、hook などの manifest ownership fallback を分離します。この reason split が互換性境界です。既存の Plugin metadata は引き続き動作し、新しいコードは runtime loading semantics を変えずに broad hint や fallback behavior を検出できます。

setup discovery は、`setup-api` に fallback する前に、`setup.providers` や `setup.cliBackends` などの descriptor-owned id を優先して候補 Plugin を絞り込むようになりました。`setup-api` への fallback は、setup-time runtime hook がまだ必要な Plugin のためのものです。provider setup list は、provider runtime を読み込まずに、manifest `providerAuthChoices`、descriptor-derived setup choice、install-catalog metadata を使います。明示的な `setup.requiresRuntime: false` は descriptor-only cutoff です。省略された `requiresRuntime` は互換性のため legacy setup-api fallback を維持します。検出された複数の Plugin が同じ正規化済み setup provider または CLI backend id を主張する場合、setup lookup は discovery order に依存せず、曖昧な owner を拒否します。setup runtime が実行される場合、registry diagnostics は legacy Plugin をブロックせずに、`setup.providers` / `setup.cliBackends` と setup-api によって登録された provider または CLI backend との drift を報告します。

### Plugin cache 境界

OpenClaw は、Plugin discovery result や direct manifest registry data を wall-clock window の背後で cache しません。install、manifest edit、load-path change は、次の明示的な metadata read または snapshot rebuild で見えるようになっている必要があります。
manifest file parser は、開かれた manifest path、inode、size、timestamp を key にした bounded file-signature cache を保持することがあります。この cache は変更されていない byte の再 parse を避けるだけであり、discovery、registry、owner、policy の answer を cache してはなりません。

安全な metadata fast path は、hidden cache ではなく、明示的な object ownership です。Gateway startup の hot path は、現在の `PluginMetadataSnapshot`、導出された `PluginLookUpTable`、または明示的な manifest registry を call chain に渡すべきです。config validation、startup auto-enable、Plugin bootstrap、provider selection は、それらが現在の config と Plugin inventory を表している間、それらの object を再利用できます。setup lookup は、特定の setup path が明示的な manifest registry を受け取らない限り、必要に応じて manifest metadata を再構築します。hidden lookup cache を追加するのではなく、それを cold-path fallback として維持してください。入力が変わった場合は、snapshot を mutate したり historical copy を保持したりせず、rebuild して置き換えてください。
active Plugin registry と bundled channel bootstrap helper の view は、現在の registry/root から再計算されるべきです。1 回の call の中で作業を dedupe したり reentry を guard したりするための短命の map は問題ありませんが、process metadata cache になってはなりません。

Plugin loading では、persistent cache layer は runtime loading です。code または installed artifact が実際に読み込まれる場合、loader state を再利用できます。たとえば次のようなものです。

- `PluginLoaderCacheState` と compatible active runtime registry
- 同じ runtime surface を繰り返し import しないために使われる jiti/module cache と public-surface loader cache
- installed Plugin artifact 用の filesystem cache
- path normalization や duplicate resolution のための短命の per-call map

これらの cache は data-plane の implementation detail です。caller が意図的に runtime loading を要求した場合を除き、「この provider を所有する Plugin はどれか?」のような control-plane の question に答えてはなりません。

次のものに persistent cache または wall-clock cache を追加しないでください。

- discovery result
- direct manifest registry
- installed Plugin index から再構築された manifest registry
- provider owner lookup、model suppression、provider policy、public-artifact metadata
- 変更された manifest、installed index、または load path が次の metadata read で見えるべき、その他の manifest-derived answer

persisted installed Plugin index から manifest metadata を rebuild する caller は、その registry を必要に応じて再構築します。installed index は durable source-plane state であり、hidden in-process metadata cache ではありません。

## Registry モデル

読み込まれた Plugin は、任意の core global を直接 mutate しません。central Plugin registry に登録します。

registry は次を追跡します。

- Plugin record（identity、source、origin、status、diagnostics）
- tool
- legacy hook と typed hook
- channel
- provider
- gateway RPC handler
- HTTP route
- CLI registrar
- background service
- Plugin-owned command

その後、core feature は Plugin module と直接やり取りする代わりに、その registry から読み取ります。これにより loading は一方向に保たれます。

- Plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性のために重要です。ほとんどの core surface が必要とする integration point は、「すべての Plugin module を special-case する」ことではなく、「registry を読む」ことだけになります。

## Conversation binding callback

conversation を bind する Plugin は、approval が resolved されたときに反応できます。

bind request が approved または denied された後に callback を受け取るには、`api.onConversationBindingResolved(...)` を使います。

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

callback payload field:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`、`"allow-always"`、または `"deny"`
- `binding`: approved request の resolved binding
- `request`: original request summary、detach hint、sender id、conversation metadata

この callback は notification-only です。conversation の bind が許可される主体を変更せず、core approval handling が完了した後に実行されます。

## Provider runtime hook

Provider Plugin には 3 つの layer があります。

- 低コストの pre-runtime lookup 用の **Manifest metadata**:
  `setup.providers[].envVars`、deprecated compatibility `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **Config-time hook**: `catalog`（legacy `discovery`）と
  `applyConfigDefaults`。
- **Runtime hook**: auth、model resolution、
  stream wrapping、thinking level、replay policy、usage endpoint を扱う 40 個以上の任意 hook。完全な一覧は
  [Hook の順序と使い方](#hook-order-and-usage)を参照してください。

OpenClaw は引き続き generic agent loop、failover、transcript handling、tool policy を所有します。これらの hook は、provider-specific behavior を extension surface として提供し、完全な custom inference transport を必要としないようにします。

provider に env-based credential があり、generic auth/status/model-picker path が Plugin runtime を読み込まずにそれを確認できるようにする必要がある場合は、manifest `setup.providers[].envVars` を使います。deprecated `providerAuthEnvVars` は deprecation window の間、compatibility adapter によって引き続き読み取られます。これを使う non-bundled Plugin は manifest diagnostic を受け取ります。ある provider id が別の provider id の env var、auth profile、config-backed auth、API-key onboarding choice を再利用するべき場合は、manifest `providerAuthAliases` を使います。onboarding/auth-choice CLI surface が、provider runtime を読み込まずに provider の choice id、group label、simple one-flag auth wiring を把握するべき場合は、manifest `providerAuthChoices` を使います。operator-facing hint、たとえば onboarding label や OAuth client-id/client-secret setup var には、provider runtime `envVars` を維持してください。

Plugin runtime を読み込まずに、generic shell-env fallback、config/status check、または setup prompt が、channel の env-driven auth や setup を確認できるようにする必要がある場合は、manifest `channelEnvVars` を使います。

### Hook の順序と使い方

model/provider Plugin について、OpenClaw はおおよそ次の順序で hook を呼び出します。
「いつ使うか」列は簡易 decision guide です。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw がもう呼び出さない compatibility-only provider field は、意図的にここには記載していません。

| #   | Hook                              | 実行内容                                                                                                   | 使用するタイミング                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` に公開する                                | プロバイダーがカタログまたはベース URL のデフォルトを所有している場合                                                                                                  |
| 2   | `applyConfigDefaults`             | 設定の実体化中に、プロバイダー所有のグローバル設定デフォルトを適用する                                      | デフォルトが認証モード、環境、またはプロバイダーのモデルファミリーのセマンティクスに依存する場合                                                                         |
| --  | _(組み込みモデル検索)_         | OpenClaw は先に通常のレジストリ/カタログパスを試す                                                          | _(Plugin フックではない)_                                                                                                                         |
| 3   | `normalizeModelId`                | 検索前にレガシーまたはプレビュー版のモデル ID エイリアスを正規化する                                                     | 正規モデル解決の前に、プロバイダーがエイリアスのクリーンアップを所有している場合                                                                                 |
| 4   | `normalizeTransport`              | 汎用モデル組み立ての前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                                      | 同じトランスポートファミリー内のカスタムプロバイダー ID について、プロバイダーがトランスポートのクリーンアップを所有している場合                                                          |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決の前に `models.providers.<id>` を正規化する                                           | 設定のクリーンアップを Plugin 側に置く必要がある場合。バンドルされた Google ファミリーのヘルパーも、対応している Google 設定エントリを補完する   |
| 6   | `applyNativeStreamingUsageCompat` | ネイティブのストリーミング使用量互換の書き換えを設定プロバイダーに適用する                                               | エンドポイント駆動のネイティブストリーミング使用量メタデータ修正がプロバイダーに必要な場合                                                                          |
| 7   | `resolveConfigApiKey`             | ランタイム認証の読み込み前に、設定プロバイダー向けの環境マーカー認証を解決する                                       | プロバイダー所有の環境マーカー API キー解決がある場合。`amazon-bedrock` にはここに組み込みの AWS 環境マーカーリゾルバーもある                  |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたは設定ベースの認証を公開する                                   | プロバイダーが合成/ローカル認証情報マーカーで動作できる場合                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/アプリ所有の認証情報では、デフォルトの `persistence` は `runtime-only` | コピーされたリフレッシュトークンを永続化せずに、プロバイダーが外部認証情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを、環境/設定ベースの認証より低い優先度に下げる                                      | 優先順位で勝つべきではない合成プレースホルダープロファイルをプロバイダーが保存している場合                                                                 |
| 11  | `resolveDynamicModel`             | まだローカルレジストリにない、プロバイダー所有のモデル ID 向けの同期フォールバック                                       | プロバイダーが任意の上流モデル ID を受け入れる場合                                                                                                 |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップ後に、`resolveDynamicModel` を再実行する                                                           | 不明な ID を解決する前に、プロバイダーがネットワークメタデータを必要とする場合                                                                                  |
| 13  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使用する前の最終書き換え                                               | プロバイダーがトランスポートの書き換えを必要とするが、引き続きコアトランスポートを使用する場合                                                                             |
| 14  | `contributeResolvedModelCompat`   | 別の互換トランスポートの背後にあるベンダーモデル向けの互換フラグを提供する                                  | プロバイダーを引き継がずに、プロキシトランスポート上の自社モデルをプロバイダーが認識する場合                                                       |
| 15  | `normalizeToolSchemas`            | 埋め込みランナーが参照する前にツールスキーマを正規化する                                                    | プロバイダーがトランスポートファミリーのスキーマクリーンアップを必要とする場合                                                                                                |
| 16  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を公開する                                                  | コアにプロバイダー固有のルールを教えずに、プロバイダーがキーワード警告を出したい場合                                                                 |
| 17  | `resolveReasoningOutputMode`      | ネイティブとタグ付きの推論出力契約を選択する                                                              | プロバイダーがネイティブフィールドではなく、タグ付きの推論/最終出力を必要とする場合                                                                         |
| 18  | `prepareExtraParams`              | 汎用ストリームオプションラッパーの前にリクエストパラメーターを正規化する                                              | プロバイダーがデフォルトのリクエストパラメーター、またはプロバイダーごとのパラメータークリーンアップを必要とする場合                                                                           |
| 19  | `createStreamFn`                  | 通常のストリームパスをカスタムトランスポートで完全に置き換える                                                   | プロバイダーが単なるラッパーではなく、カスタムワイヤプロトコルを必要とする場合                                                                                     |
| 20  | `wrapStreamFn`                    | 汎用ラッパーの適用後にストリームをラップする                                                              | カスタムトランスポートなしで、プロバイダーがリクエストヘッダー/ボディ/モデル互換ラッパーを必要とする場合                                                          |
| 21  | `resolveTransportTurnState`       | ターンごとのネイティブトランスポートヘッダーまたはメタデータを付加する                                                           | 汎用トランスポートにプロバイダーネイティブのターン ID を送信させたい場合                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付加する                                                    | 汎用 WS トランスポートでセッションヘッダーまたはフォールバックポリシーを調整したい場合                                                               |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                                     | プロバイダーが追加の認証メタデータを保存し、カスタムランタイムトークン形状を必要とする場合                                                                    |
| 24  | `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き                                  | プロバイダーが共有の `pi-ai` リフレッシャーに適合しない場合                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth リフレッシュ失敗時に追加される修復ヒント                                                                  | リフレッシュ失敗後に、プロバイダー所有の認証修復ガイダンスが必要な場合                                                                      |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウ超過マッチャー                                                                 | 汎用ヒューリスティックでは見逃す生の超過エラーがプロバイダーにある場合                                                                                |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                  | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などにマッピングできる場合                                                                          |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                                               | プロバイダーがプロキシ固有のキャッシュ TTL ゲートを必要とする場合                                                                                                |
| 29  | `buildMissingAuthMessage`         | 汎用の認証不足リカバリメッセージの置き換え                                                      | プロバイダー固有の認証不足リカバリヒントが必要な場合                                                                                 |
| 30  | `augmentModelCatalog`             | 探索後に追加される合成/最終カタログ行                                                          | `models list` とピッカーで、プロバイダーが合成の前方互換行を必要とする場合                                                                     |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                 | プロバイダーが、選択されたモデル向けにカスタム思考段階またはバイナリラベルを公開する場合                                                                 |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                     | プロバイダーがバイナリの思考オン/オフのみを公開する場合                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 推論サポート互換フック                                                                   | プロバイダーが一部のモデルだけで `xhigh` を有効にしたい場合                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                      | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有している場合                                                                                      |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けの最新モデルマッチャー                                              | プロバイダーがライブ/スモークの推奨モデルマッチングを所有している場合                                                                                             |
| 36  | `prepareRuntimeAuth`              | 推論直前に、設定済み認証情報を実際のランタイムトークン/キーに交換する                       | プロバイダーがトークン交換または短命のリクエスト認証情報を必要とする場合                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` と関連するステータス画面の使用量/請求認証情報を解決する                                     | プロバイダーでカスタムの使用量/クォータトークン解析、または別の使用量認証情報が必要                                                               |
| 38  | `fetchUsageSnapshot`              | 認証が解決された後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーで、プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索用に、プロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダーPluginに属する                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーでカスタムのトランスクリプトポリシー（たとえば thinking ブロックの除去）が必要                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用トランスクリプトクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーで、共有 Compaction ヘルパーを超えるプロバイダー固有のリプレイ書き換えが必要                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に最終的なリプレイターンの検証または再整形を行う                                           | プロバイダーのトランスポートで、汎用サニタイズ後により厳密なターン検証が必要                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになったときに、プロバイダーでテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` はまず一致したプロバイダー Plugin を確認し、その後、モデル ID または transport/config を実際に変更するものが見つかるまで、他のフック対応プロバイダー Plugin へフォールスルーします。これにより、呼び出し元が書き換えを所有するバンドル済み Plugin を知っている必要なく、alias/compat プロバイダー shim が動作し続けます。サポートされている Google ファミリーの config エントリを書き換えるプロバイダーフックがない場合でも、バンドル済み Google config normalizer がその互換性クリーンアップを適用します。

プロバイダーが完全にカスタムのワイヤープロトコルやカスタムリクエスト実行器を必要とする場合、それは別種の拡張です。これらのフックは、OpenClaw の通常の推論ループ上で引き続き実行されるプロバイダー動作のためのものです。

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

### 組み込み例

バンドル済みプロバイダー Plugin は、各ベンダーのカタログ、認証、thinking、replay、使用量のニーズに合わせて、上記のフックを組み合わせます。信頼できるフックセットは `extensions/` 配下の各 Plugin にあります。このページでは一覧を写すのではなく、形を示します。

<AccordionGroup>
  <Accordion title="パススルーカタログプロバイダー">
    OpenRouter、Kilocode、Z.AI、xAI は、OpenClaw の静的カタログより先にアップストリームのモデル ID を公開できるよう、`catalog` に加えて `resolveDynamicModel` / `prepareDynamicModel` を登録します。
  </Accordion>
  <Accordion title="OAuth と使用量エンドポイントのプロバイダー">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は、トークン交換と `/usage` 連携を所有するために、`prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` + `fetchUsageSnapshot` と組み合わせます。
  </Accordion>
  <Accordion title="Replay と transcript クリーンアップのファミリー">
    共有の名前付きファミリー（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）により、各 Plugin がクリーンアップを再実装する代わりに、プロバイダーは `buildReplayPolicy` を通じて transcript ポリシーを選択できます。
  </Accordion>
  <Accordion title="カタログ専用プロバイダー">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、`volcengine` は、`catalog` だけを登録し、共有の推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic 固有のストリームヘルパー">
    Beta ヘッダー、`/fast` / `serviceTier`、`context1m` は、汎用 SDK ではなく Anthropic Plugin の公開 `api.ts` / `contract-api.ts` seam（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムヘルパー

Plugin は `api.runtime` を通じて、選択された core ヘルパーにアクセスできます。TTS の場合:

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

- `textToSpeech` は、file/voice-note surface 向けの通常の core TTS 出力ペイロードを返します。
- core の `messages.tts` 設定とプロバイダー選択を使用します。
- PCM 音声バッファ + サンプルレートを返します。Plugin はプロバイダー向けにリサンプリング/エンコードする必要があります。
- `listVoices` はプロバイダーごとに任意です。ベンダー所有の音声ピッカーやセットアップフローに使用します。
- 音声一覧には、プロバイダー対応ピッカー向けに、ロケール、性別、personality タグなど、より豊富なメタデータを含めることができます。
- OpenAI と ElevenLabs は現在 telephony をサポートしています。Microsoft はサポートしていません。

Plugin は `api.registerSpeechProvider(...)` を通じて speech プロバイダーを登録することもできます。

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

- TTS ポリシー、fallback、reply delivery は core に保持します。
- ベンダー所有の合成動作には speech プロバイダーを使用します。
- レガシー Microsoft `edge` 入力は `microsoft` プロバイダー ID に正規化されます。
- 推奨される所有モデルは会社単位です。OpenClaw がそれらの capability contract を追加するにつれて、1 つのベンダー Plugin が text、speech、image、将来の media プロバイダーを所有できます。

image/audio/video understanding では、Plugin は汎用 key/value bag ではなく、1 つの型付き media-understanding プロバイダーを登録します。

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
- ベンダー動作はプロバイダー Plugin に保持します。
- 追加的な拡張は型付きのままにする必要があります。新しい任意メソッド、新しい任意 result フィールド、新しい任意 capability を使用します。
- 動画生成はすでに同じパターンに従っています:
  - core が capability contract とランタイムヘルパーを所有する
  - ベンダー Plugin が `api.registerVideoGenerationProvider(...)` を登録する
  - feature/channel Plugin が `api.runtime.videoGeneration.*` を利用する

media-understanding ランタイムヘルパーでは、Plugin は次を呼び出せます。

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

音声 transcription では、Plugin は media-understanding runtime または古い STT alias のどちらかを使用できます。

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
- core の media-understanding 音声設定（`tools.media.audio`）とプロバイダー fallback 順を使用します。
- transcription 出力が生成されない場合（たとえば、スキップされた/サポートされていない入力）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換性 alias として残ります。

Plugin は `api.runtime.subagent` を通じてバックグラウンド subagent run を起動することもできます。

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

- `provider` と `model` は run ごとの任意オーバーライドであり、永続的な session 変更ではありません。
- OpenClaw は、信頼された呼び出し元に対してのみ、それらの override フィールドを尊重します。
- Plugin 所有の fallback run では、operator は `plugins.entries.<id>.subagent.allowModelOverride: true` で opt in する必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、信頼された Plugin を特定の正規 `provider/model` ターゲットに制限するか、明示的に任意のターゲットを許可するには `"*"` を使用します。
- 信頼されていない Plugin の subagent run も動作しますが、override リクエストは暗黙に fallback するのではなく拒否されます。
- Plugin が作成した subagent session には、作成元 Plugin ID のタグが付けられます。fallback の `api.runtime.subagent.deleteSession(...)` は、それら所有 session のみを削除できます。任意の session 削除には引き続き admin スコープの Gateway リクエストが必要です。

web search では、Plugin は agent tool wiring に踏み込む代わりに、共有 runtime helper を利用できます。

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

Plugin は `api.registerWebSearchProvider(...)` を通じて web-search プロバイダーを登録することもできます。

注記:

- プロバイダー選択、credential 解決、共有 request semantics は core に保持します。
- ベンダー固有の検索 transport には web-search プロバイダーを使用します。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せずに search 動作を必要とする feature/channel Plugin 向けの推奨共有 surface です。

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

- `generate(...)`: 設定された image-generation プロバイダーチェーンを使用して画像を生成します。
- `listProviders(...)`: 利用可能な image-generation プロバイダーとその capability を一覧表示します。

## Gateway HTTP ルート

Plugin は `api.registerHttpRoute(...)` で HTTP エンドポイントを公開できます。

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
- `auth`: 必須。通常の Gateway 認証を要求するには `"gateway"` を、Plugin 管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が自身の既存 route registration を置き換えられるようにします。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

注記:

- `api.registerHttpHandler(...)` は削除されており、Plugin のロードエラーを引き起こします。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` でない限り拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- 異なる `auth` レベルで重複するルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは、同じ auth レベルだけに維持してください。
- `auth: "plugin"` ルートは、オペレーターのランタイムスコープを自動的には受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付き Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストのランタイムスコープ内で実行されますが、そのスコープは意図的に保守的です。
  - 共有シークレットの bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートのランタイムスコープは `operator.write` に固定されます
  - 信頼済みの ID を伴う HTTP モード（たとえば `trusted-proxy`、またはプライベート ingress 上の `gateway.auth.mode = "none"`）では、ヘッダーが明示的に存在する場合にのみ `x-openclaw-scopes` が尊重されます
  - これらの ID を伴う Plugin ルートリクエストで `x-openclaw-scopes` がない場合、ランタイムスコープは `operator.write` にフォールバックします
- 実践的なルール: gateway-auth の Plugin ルートを暗黙の管理者サーフェスだと仮定しないでください。ルートが管理者専用の動作を必要とする場合は、ID を伴う auth モードを必須にし、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK のインポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルート
barrel ではなく、狭い SDK サブパスを使用してください。Core サブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャネルエントリ/ビルドヘルパー                   |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括的な契約                     |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ（`OpenClawSchema`） |

チャネル Plugin は、狭いシームのファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions` です。承認の動作は、無関係な
Plugin フィールドをまたいで混在させるのではなく、1 つの
`approvalCapability` 契約に集約してください。[チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムと設定のヘルパーは、対応する焦点を絞った `*-runtime` サブパス
（`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など）配下にあります。幅広い `config-runtime`
互換 barrel ではなく、`config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`
を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨の互換 shim です。
新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部のエントリポイント（同梱 Plugin パッケージルートごと）:

- `index.js` — 同梱 Plugin エントリ
- `api.js` — ヘルパー/型 barrel
- `runtime-api.js` — ランタイム専用 barrel
- `setup-entry.js` — セットアップ Plugin エントリ

外部 Plugin は `openclaw/plugin-sdk/*` サブパスだけをインポートする必要があります。core や別の Plugin から、別の Plugin パッケージの `src/*` をインポートしないでください。
Facade からロードされるエントリポイントは、存在する場合はアクティブなランタイム設定スナップショットを優先し、その後ディスク上の解決済み設定ファイルにフォールバックします。

`image-generation`, `media-understanding`, `speech` などの機能固有のサブパスは、同梱 Plugin が現在それらを使用しているため存在します。これらは自動的に長期固定の外部契約になるわけではありません — 依存する場合は、関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票など、メッセージ以外のプリミティブに対するチャネル固有の `describeMessageTool(...)` スキーマ
contribution を所有する必要があります。共有送信プレゼンテーションでは、プロバイダーネイティブのボタン、コンポーネント、ブロック、カードのフィールドではなく、汎用の `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、プロバイダーマッピング、Plugin 作成者チェックリストについては、[メッセージプレゼンテーション](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ機能を通じてレンダーできる内容を宣言します。

- セマンティックなプレゼンテーションブロック（`text`, `context`, `divider`, `buttons`, `select`）には `presentation`
- 固定配信リクエストには `delivery-pin`

Core は、プレゼンテーションをネイティブにレンダーするか、テキストに縮退するかを決定します。
汎用メッセージツールから、プロバイダーネイティブ UI の逃げ道を公開しないでください。
既存のサードパーティ Plugin 向けには、レガシーネイティブスキーマ用の非推奨 SDK ヘルパーが引き続きエクスポートされていますが、新しい Plugin では使用しないでください。

## チャネルターゲット解決

チャネル Plugin は、チャネル固有のターゲットセマンティクスを所有する必要があります。共有アウトバウンドホストは汎用のままにし、プロバイダールールにはメッセージングアダプターサーフェスを使用してください。

- `messaging.inferTargetChatType({ to })` は、正規化されたターゲットをディレクトリ検索の前に `direct`, `group`, `channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力をディレクトリ検索ではなく ID らしい解決に直接進めるべきかどうかを core に伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後またはディレクトリミス後に core が最終的なプロバイダー所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後のプロバイダー固有のセッションルート構築を所有します。

推奨される分割:

- ピア/グループ検索の前に発生すべきカテゴリ決定には `inferTargetChatType` を使用します。
- 「これを明示的/ネイティブのターゲット ID として扱う」チェックには `looksLikeId` を使用します。
- プロバイダー固有の正規化フォールバックには `resolveTarget` を使用し、広範なディレクトリ検索には使用しません。
- チャット ID、スレッド ID、JID、ハンドル、ルーム ID などのプロバイダーネイティブ ID は、汎用 SDK フィールドではなく、`target` 値またはプロバイダー固有のパラメーター内に保持してください。

## 設定に基づくディレクトリ

設定からディレクトリエントリを派生する Plugin は、そのロジックを
Plugin 内に保持し、`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用してください。

チャネルが次のような設定に基づくピア/グループを必要とする場合に使用します。

- allowlist 駆動の DM ピア
- 設定済みのチャネル/グループマップ
- アカウントスコープの静的ディレクトリフォールバック

`directory-runtime` の共有ヘルパーは、汎用操作だけを処理します。

- クエリフィルタリング
- limit 適用
- 重複排除/正規化ヘルパー
- `ChannelDirectoryEntry[]` の構築

チャネル固有のアカウント検査と ID 正規化は、
Plugin 実装内に残してください。

## プロバイダーカタログ

プロバイダー Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` で推論用のモデルカタログを定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します。

- 1 つのプロバイダーエントリには `{ provider }`
- 複数のプロバイダーエントリには `{ providers }`

Plugin がプロバイダー固有のモデル ID、base URL のデフォルト、または auth で保護されたモデルメタデータを所有する場合は、`catalog` を使用してください。

`catalog.order` は、Plugin のカタログが OpenClaw の組み込み暗黙プロバイダーに対していつマージされるかを制御します。

- `simple`: プレーンな API キーまたは env 駆動のプロバイダー
- `profile`: auth プロファイルが存在すると現れるプロバイダー
- `paired`: 複数の関連プロバイダーエントリを合成するプロバイダー
- `late`: 他の暗黙プロバイダーの後の最後のパス

キー衝突時は後のプロバイダーが優先されるため、Plugin は同じプロバイダー ID を持つ組み込みプロバイダーエントリを意図的に上書きできます。

互換性:

- `discovery` はレガシーエイリアスとして引き続き機能します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します

## 読み取り専用チャネル検査

Plugin がチャネルを登録する場合は、`resolveAccount(...)` と併せて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを推奨します。

理由:

- `resolveAccount(...)` はランタイムパスです。認証情報が完全に実体化されていると仮定でき、必要なシークレットがない場合は早期失敗できます。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  修復フローなどの読み取り専用コマンドパスでは、設定を記述するだけのためにランタイム認証情報を実体化する必要があるべきではありません。

推奨される `inspectAccount(...)` の動作:

- 説明的なアカウント状態だけを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような認証情報の source/status フィールドを含めます。
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 読み取り専用の可用性を報告するだけなら、生のトークン値を返す必要はありません。ステータス系コマンドには `tokenStatus: "available"`（および対応する source フィールド）を返せば十分です。
- 認証情報が SecretRef 経由で設定されているが、現在のコマンドパスで利用できない場合は `configured_unavailable` を使用してください。

これにより、読み取り専用コマンドは、クラッシュしたりアカウントを未設定と誤って報告したりする代わりに、「設定済みだがこのコマンドパスでは利用不可」と報告できます。

## パッケージパック

Plugin ディレクトリには、`openclaw.extensions` を持つ `package.json` を含めることができます。

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各エントリは Plugin になります。パックに複数の extensions が列挙されている場合、Plugin ID は `name/<fileBase>` になります。

Plugin が npm 依存関係をインポートする場合は、そのディレクトリにインストールして
`node_modules` が利用できるようにしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` エントリは、symlink 解決後も Plugin ディレクトリ内に留まる必要があります。パッケージディレクトリの外に出るエントリは拒否されます。

セキュリティ上の注意: `openclaw plugins install` は、プロジェクトローカルの `npm install --omit=dev --ignore-scripts` で Plugin 依存関係をインストールします（ライフサイクルスクリプトなし、ランタイムで dev dependencies なし）。継承されたグローバル npm install 設定は無視されます。
Plugin の依存関係ツリーは「pure JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は、軽量なセットアップ専用モジュールを指すことができます。
OpenClaw が無効化されたチャネル Plugin のセットアップサーフェスを必要とする場合、またはチャネル Plugin が有効だがまだ未設定の場合、完全な Plugin エントリではなく `setupEntry` をロードします。これにより、メインの Plugin エントリがツール、フック、その他のランタイム専用コードも配線する場合に、起動とセットアップが軽くなります。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` は、チャネルがすでに設定済みの場合でも、Gateway の listen 前の起動フェーズ中に、チャネル Plugin を同じ `setupEntry` パスへ参加させることができます。

これは、Gateway が listen を開始する前に存在する必要がある起動サーフェスを `setupEntry` が完全にカバーする場合にのみ使用してください。実際には、セットアップエントリは起動が依存するすべてのチャネル所有機能を登録する必要があります。たとえば次のものです。

- チャネル登録そのもの
- Gateway が listen を開始する前に利用可能である必要がある HTTP ルート
- その同じ期間中に存在する必要がある Gateway メソッド、ツール、サービス

完全エントリが必要な起動機能をまだ所有している場合は、
このフラグを有効にしないでください。Plugin はデフォルトの動作のままにし、OpenClaw が起動中に完全エントリをロードするようにしてください。

同梱チャネルは、完全なチャネルランタイムがロードされる前に core が参照できる、セットアップ専用の契約サーフェスヘルパーも公開できます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

コアは、完全な Plugin エントリを読み込まずに、レガシーの単一アカウントチャンネル設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、そのサーフェスを使用します。Matrix は現在の同梱例です。名前付きアカウントがすでに存在する場合、認証/ブートストラップキーだけを名前付きの昇格アカウントへ移動し、常に `accounts.default` を作成するのではなく、設定済みの非正規デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターは、同梱された契約サーフェスの検出を遅延したままにします。インポート時は軽量に保たれ、昇格サーフェスはモジュールインポート時に同梱チャンネルの起動へ再突入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスに置いてください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Plugin がより狭いスコープを要求しても常に `operator.admin` に解決されます。

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

チャンネル Plugin は、`openclaw.channel` を介してセットアップ/検出メタデータを、`openclaw.install` を介してインストールヒントを通知できます。これにより、コアカタログはデータなしに保たれます。

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
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: 送信フォーマット判断のため、チャンネルを Markdown 対応としてマーク
- `exposure.configured`: `false` に設定された場合、設定済みチャンネルの一覧サーフェスからチャンネルを非表示
- `exposure.setup`: `false` に設定された場合、対話型のセットアップ/設定ピッカーからチャンネルを非表示
- `exposure.docs`: docs ナビゲーションサーフェス向けにチャンネルを内部/非公開としてマーク
- `showConfigured` / `showInSetup`: 互換性のため引き続き受け入れられるレガシーエイリアス。`exposure` を推奨
- `quickstartAllowFrom`: チャンネルを標準クイックスタート `allowFrom` フローに参加させる
- `forceAccountBinding`: アカウントが 1 つしか存在しない場合でも明示的なアカウントバインドを要求
- `preferSessionLookupForAnnounceTarget`: アナウンス先を解決するときにセッション検索を優先

OpenClaw は、**外部チャンネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。JSON ファイルを次のいずれかに配置してください:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）で 1 つ以上の JSON ファイルを指定します（カンマ/セミコロン/`PATH` 区切り）。各ファイルは `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含む必要があります。パーサーは、`"entries"` キーのレガシーエイリアスとして `"packages"` または `"plugins"` も受け入れます。

生成されたチャンネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックの横に正規化されたインストール元情報を公開します。正規化された情報は、npm spec が厳密なバージョンか浮動セレクターか、期待される integrity メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージ ID が既知の場合、正規化された情報は、解析された npm パッケージ名がその ID からずれていると警告します。また、`defaultChoice` が無効である場合や利用できないソースを指している場合、有効な npm ソースなしに npm integrity メタデータが存在する場合にも警告します。コンシューマーは、手作業で作成されたエントリやカタログシムがそれを合成しなくて済むように、`installSource` を加算的な任意フィールドとして扱うべきです。これにより、オンボーディングと診断は Plugin ランタイムをインポートせずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、厳密な `npmSpec` と `expectedIntegrity` を優先すべきです。裸のパッケージ名や dist-tag も互換性のため引き続き動作しますが、カタログが既存の Plugin を壊さずに、固定され integrity チェック済みのインストールへ移行できるよう、ソースプレーン警告を表示します。オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` とワークスペース相対の `sourcePath` を持つ管理対象 Plugin インデックスエントリを記録します。絶対的な運用ロードパスは `plugins.load.paths` に残ります。インストール記録は、ローカルワークステーションパスを長期保持される設定へ重複して入れることを避けます。これにより、ローカル開発インストールは、2 つ目の生のファイルシステムパス開示サーフェスを追加せずに、ソースプレーン診断から見えるままになります。永続化された `plugins/installs.json` Plugin インデックスは、インストール元の信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが欠落しているか無効な場合でも永続的です。その `plugins` 配列は、再構築可能なマニフェストビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

Plugin がメモリ検索やフックを追加するだけでなく、デフォルトのコンテキストパイプラインを置き換える、または拡張する必要がある場合に使用してください。

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

ファクトリーの `ctx` は、構築時の初期化用に任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

エンジンが Compaction アルゴリズムを所有しない場合でも、`compact()` は実装したままにし、明示的に委譲してください:

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

Plugin が現在の API に合わない動作を必要とする場合、private な内部参照で Plugin システムを迂回しないでください。欠けている capability を追加します。

推奨手順:

1. コア契約を定義する
   コアが所有すべき共有動作を決めます: ポリシー、フォールバック、設定マージ、ライフサイクル、チャンネル向けセマンティクス、ランタイムヘルパーの形状。
2. 型付き Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限で有用な型付き capability サーフェスで拡張します。
3. コア + チャンネル/機能コンシューマーを配線する
   チャンネルと機能 Plugin は、ベンダー実装を直接インポートするのではなく、コアを通じて新しい capability を使用するべきです。
4. ベンダー実装を登録する
   その後、ベンダー Plugin が capability に対してバックエンドを登録します。
5. 契約カバレッジを追加する
   所有権と登録の形状が時間が経っても明示的なままになるよう、テストを追加します。

これは、OpenClaw が 1 つのプロバイダーの世界観にハードコードされることなく、方針を持ち続ける方法です。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### capability チェックリスト

新しい capability を追加する場合、実装は通常、これらのサーフェスをまとめて触るべきです:

- `src/<capability>/types.ts` のコア契約型
- `src/<capability>/runtime.ts` のコアランナー/ランタイムヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin レジストリ配線
- 機能/チャンネル Plugin が使用する必要がある場合の `src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` のキャプチャ/テストヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` のオペレーター/Plugin docs

これらのサーフェスのいずれかが欠けている場合、通常は capability がまだ完全に統合されていない兆候です。

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

これにより、ルールは単純に保たれます:

- コアは capability 契約 + オーケストレーションを所有する
- ベンダー Plugin はベンダー実装を所有する
- 機能/チャンネル Plugin はランタイムヘルパーを使用する
- 契約テストは所有権を明示的に保つ

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 公開 capability モデルと形状
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
