---
read_when:
    - プロバイダーランタイムフック、チャネルライフサイクル、またはパッケージパックの実装
    - Plugin の読み込み順序またはレジストリ状態のデバッグ
    - 新しいプラグイン機能またはコンテキストエンジンプラグインの追加
summary: 'Plugin アーキテクチャ内部: 読み込みパイプライン、レジストリ、ランタイムフック、HTTP ルート、リファレンステーブル'
title: Plugin アーキテクチャ内部
x-i18n:
    generated_at: "2026-06-27T12:06:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

公開 capability モデル、Plugin の形状、所有権/実行契約については、[Plugin アーキテクチャ](/ja-JP/plugins/architecture)を参照してください。このページは、load pipeline、registry、runtime hook、Gateway HTTP ルート、import path、schema table という内部メカニクスのリファレンスです。

## load pipeline

起動時に、OpenClaw はおおよそ次を行います。

1. 候補 Plugin ルートを検出する
2. ネイティブまたは互換 bundle manifest と package metadata を読む
3. 安全でない候補を拒否する
4. Plugin config（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）を正規化する
5. 各候補の有効化を判断する
6. 有効化されたネイティブモジュールを読み込む。ビルド済み bundled module は native loader を使い、
   サードパーティのローカルソース TypeScript は緊急用 Jiti fallback を使う
7. ネイティブの `register(api)` hook を呼び出し、登録内容を plugin registry に集める
8. registry を command/runtime surface に公開する

<Note>
`activate` は `register` の legacy alias です。loader は存在する方（`def.register ?? def.activate`）を解決し、同じ時点で呼び出します。すべての bundled plugin は `register` を使います。新しい Plugin では `register` を優先してください。
</Note>

安全性 gate は runtime 実行の**前**に行われます。entry が Plugin ルートから抜け出す場合、path が world-writable の場合、または非 bundled plugin で path ownership が疑わしい場合、候補はブロックされます。

ブロックされた候補は、診断用に Plugin id との関連付けを維持します。config がまだその id を参照している場合、validation はその Plugin を存在するがブロック済みとして報告し、config entry を古いものとして扱う代わりに path-safety warning を指し示します。

### Manifest 優先の挙動

manifest は control-plane の信頼できる情報源です。OpenClaw はこれを使って次を行います。

- Plugin を識別する
- 宣言された channel/skill/config schema または bundle capability を検出する
- `plugins.entries.<id>.config` を検証する
- Control UI の label/placeholder を補強する
- install/catalog metadata を表示する
- Plugin runtime を読み込まずに、軽量な activation descriptor と setup descriptor を保持する

ネイティブ Plugin では、runtime module が data-plane 部分です。hook、tool、command、provider flow などの実際の挙動を登録します。

任意の manifest `activation` block と `setup` block は control plane に残ります。これらは activation planning と setup discovery のための metadata-only descriptor であり、runtime registration、`register(...)`、または `setupEntry` を置き換えるものではありません。
最初の live activation consumer は、より広い registry materialization の前に Plugin loading を絞り込むため、manifest の command、channel、provider hint を使うようになりました。

- CLI loading は、要求された primary command を所有する Plugin に絞り込む
- channel setup/plugin resolution は、要求された channel id を所有する Plugin に絞り込む
- 明示的な provider setup/runtime resolution は、要求された provider id を所有する Plugin に絞り込む
- Gateway startup planning は、明示的な startup import と startup opt-out に `activation.onStartup` を使う。startup metadata がない Plugin は、より絞り込まれた activation trigger 経由でのみ読み込まれる

広い `all` scope を要求する request-time runtime preload でも、config、startup planning、configured channel、slot、auto-enable rule から明示的な effective plugin id set を導出します。その導出された set が空の場合、OpenClaw は検出可能なすべての Plugin に広げるのではなく、空の runtime registry を読み込みます。

activation planner は、既存 caller 向けの ids-only API と、新しい診断向けの plan API の両方を公開します。plan entry は Plugin が選択された理由を報告し、明示的な `activation.*` planner hint と、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、hook などの manifest ownership fallback を分離します。この理由の分離が compatibility boundary です。既存の Plugin metadata は動作し続け、新しい code は runtime loading semantics を変えずに広い hint や fallback behavior を検出できます。

setup discovery は、まだ setup-time runtime hook が必要な Plugin で `setup-api` に fallback する前に、候補 Plugin を絞り込むため `setup.providers` や `setup.cliBackends` など descriptor-owned id を優先するようになりました。provider setup list は、provider runtime を読み込まずに、manifest `providerAuthChoices`、descriptor-derived setup choice、install-catalog metadata を使います。明示的な `setup.requiresRuntime: false` は descriptor-only cutoff です。省略された `requiresRuntime` は互換性のため legacy setup-api fallback を維持します。検出された複数の Plugin が同じ正規化済み setup provider または CLI backend id を主張する場合、setup lookup は discovery order に頼らず、曖昧な owner を拒否します。setup runtime が実行される場合、registry diagnostics は legacy Plugin をブロックせずに、`setup.providers` / `setup.cliBackends` と setup-api によって登録された provider または CLI backend のずれを報告します。

### Plugin cache boundary

OpenClaw は Plugin discovery result や直接の manifest registry data を wall-clock window の背後に cache しません。install、manifest edit、load-path change は、次の明示的な metadata read または snapshot rebuild で見える必要があります。
manifest file parser は、opened manifest path、inode、size、timestamp を key にした bounded file-signature cache を保持する場合があります。この cache は変更されていない byte の再解析を避けるだけであり、discovery、registry、owner、policy answer を cache してはなりません。

安全な metadata fast path は、隠れた cache ではなく明示的な object ownership です。
Gateway startup hot path は、現在の `PluginMetadataSnapshot`、導出された `PluginLookUpTable`、または明示的な manifest registry を call chain 経由で渡すべきです。Config validation、startup auto-enable、plugin bootstrap、provider selection は、それらの object が現在の config と Plugin inventory を表している間、再利用できます。Setup lookup は、特定の setup path が明示的な manifest registry を受け取らない限り、manifest metadata を必要に応じて再構築します。それを cold-path fallback として維持し、隠れた lookup cache を追加しないでください。input が変わったら、snapshot を mutation したり historical copy を保持したりせず、rebuild して置き換えてください。
active plugin registry 上の view と bundled channel bootstrap helper は、現在の registry/root から再計算すべきです。1 回の call 内で作業を dedupe したり reentry を guard したりする短命の map は問題ありませんが、process metadata cache にしてはなりません。

Plugin loading では、persistent cache layer は runtime loading です。code または installed artifact が実際に読み込まれる場合に loader state を再利用できます。例:

- `PluginLoaderCacheState` と互換性のある active runtime registry
- 同じ runtime surface の繰り返し import を避けるために使われる jiti/module cache と public-surface loader cache
- installed plugin artifact 用の filesystem cache
- path normalization または duplicate resolution 用の短命の per-call map

これらの cache は data-plane implementation detail です。caller が明示的に runtime loading を要求したのでない限り、「この provider を所有する Plugin はどれか?」のような control-plane question に答えてはなりません。

次のものに persistent cache または wall-clock cache を追加しないでください。

- discovery result
- direct manifest registry
- installed plugin index から再構築された manifest registry
- provider owner lookup、model suppression、provider policy、または public-artifact metadata
- 変更された manifest、installed index、または load path が次の metadata read で見えるべき、その他の manifest-derived answer

persisted installed plugin index から manifest metadata を rebuild する caller は、その registry を必要に応じて再構築します。installed index は durable source-plane state であり、隠れた in-process metadata cache ではありません。

## Registry model

読み込まれた Plugin は、ランダムな core global を直接 mutation しません。central plugin registry に登録します。

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

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は maintainability にとって重要です。つまり、ほとんどの core surface は「registry を読む」という 1 つの integration point だけで済み、「すべての Plugin module を special-case する」必要がありません。

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

この callback は notification-only です。conversation の bind を誰に許可するかは変更せず、core approval handling が完了した後に実行されます。

## Provider runtime hook

Provider Plugin には 3 つの layer があります。

- **Manifest metadata**: 軽量な pre-runtime lookup 用:
  `setup.providers[].envVars`、deprecated compatibility `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices`、`channelEnvVars`。
- **Config-time hook**: `catalog`（legacy `discovery`）と
  `applyConfigDefaults`。
- **Runtime hook**: auth、model resolution、
  stream wrapping、thinking level、replay policy、usage endpoint を扱う 40 個以上の optional hook。完全な一覧は [Hook の順序と使い方](#hook-order-and-usage) を参照してください。

OpenClaw は引き続き generic agent loop、failover、transcript handling、tool policy を所有します。これらの hook は、provider-specific behavior のための extension surface であり、custom inference transport 全体を必要としません。

provider に env-based credential があり、generic auth/status/model-picker path が Plugin runtime を読み込まずにそれを確認する必要がある場合は、manifest `setup.providers[].envVars` を使います。deprecated `providerAuthEnvVars` は deprecation window 中に compatibility adapter によって引き続き読まれ、それを使う非 bundled plugin は manifest diagnostic を受け取ります。ある provider id が別の provider id の env var、auth profile、config-backed auth、API-key onboarding choice を再利用する必要がある場合は、manifest `providerAuthAliases` を使います。onboarding/auth-choice CLI surface が provider の choice id、group label、単純な one-flag auth wiring を provider runtime を読み込まずに知る必要がある場合は、manifest `providerAuthChoices` を使います。provider runtime の `envVars` は、onboarding label や OAuth client-id/client-secret setup var など operator-facing hint 用に維持してください。

channel に env-driven auth または setup があり、generic shell-env fallback、config/status check、setup prompt が channel runtime を読み込まずに確認する必要がある場合は、manifest `channelEnvVars` を使います。

### Hook の順序と使い方

model/provider Plugin について、OpenClaw はおおよそ次の順序で hook を呼び出します。
「When to use」列は quick decision guide です。
`ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw がもう呼び出さない compatibility-only provider field は、意図的にここには記載していません。

| #   | フック                            | 何をするか                                                                                                   | 使用する場面                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成中にプロバイダー設定を `models.providers` へ公開する                                      | プロバイダーがカタログまたはベース URL のデフォルトを所有している場合                                                                          |
| 2   | `applyConfigDefaults`             | 設定の実体化中に、プロバイダー所有のグローバル設定デフォルトを適用する                                      | デフォルトが認証モード、環境、またはプロバイダーモデルファミリーのセマンティクスに依存する場合                                                |
| --  | _(組み込みモデル検索)_            | OpenClaw はまず通常のレジストリ/カタログ経路を試す                                                          | _(Plugin フックではない)_                                                                                                                       |
| 3   | `normalizeModelId`                | 検索前にレガシーまたはプレビューモデル ID のエイリアスを正規化する                                         | プロバイダーが、正規モデル解決の前にエイリアスのクリーンアップを所有している場合                                                              |
| 4   | `normalizeTransport`              | 汎用モデル組み立ての前に、プロバイダーファミリーの `api` / `baseUrl` を正規化する                           | プロバイダーが、同じトランスポートファミリー内のカスタムプロバイダー ID に対するトランスポートのクリーンアップを所有している場合              |
| 5   | `normalizeConfig`                 | ランタイム/プロバイダー解決の前に `models.providers.<id>` を正規化する                                      | Plugin とともに置くべき設定クリーンアップがプロバイダーに必要な場合。バンドル済み Google ファミリーヘルパーも、サポート対象の Google 設定項目を補完する |
| 6   | `applyNativeStreamingUsageCompat` | 設定プロバイダーにネイティブストリーミング使用量互換の書き換えを適用する                                   | プロバイダーが、エンドポイント主導のネイティブストリーミング使用量メタデータ修正を必要とする場合                                              |
| 7   | `resolveConfigApiKey`             | ランタイム認証の読み込み前に、設定プロバイダー向けの環境マーカー認証を解決する                             | プロバイダーが独自の環境マーカー API キー解決フックを公開している場合                                                                          |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずに、ローカル/セルフホストまたは設定に基づく認証を提示する                                  | プロバイダーが合成/ローカル資格情報マーカーで動作できる場合                                                                                    |
| 9   | `resolveExternalAuthProfiles`     | プロバイダー所有の外部認証プロファイルを重ねる。CLI/app 所有の資格情報ではデフォルトの `persistence` は `runtime-only` | プロバイダーが、コピーしたリフレッシュトークンを永続化せずに外部認証資格情報を再利用する場合。マニフェストで `contracts.externalAuthProviders` を宣言する |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みの合成プロファイルプレースホルダーを、環境/設定ベースの認証より後ろに下げる                       | プロバイダーが、優先順位で勝つべきではない合成プレースホルダープロファイルを保存している場合                                                  |
| 11  | `resolveDynamicModel`             | ローカルレジストリにまだないプロバイダー所有モデル ID の同期フォールバック                                 | プロバイダーが任意の上流モデル ID を受け付ける場合                                                                                             |
| 12  | `prepareDynamicModel`             | 非同期ウォームアップの後、`resolveDynamicModel` が再度実行される                                           | プロバイダーが未知の ID を解決する前にネットワークメタデータを必要とする場合                                                                  |
| 13  | `normalizeResolvedModel`          | 埋め込みランナーが解決済みモデルを使用する前の最終書き換え                                                 | プロバイダーがトランスポートの書き換えを必要としつつ、コアトランスポートを引き続き使用する場合                                                |
| 14  | `normalizeToolSchemas`            | 埋め込みランナーが見る前にツールスキーマを正規化する                                                       | プロバイダーがトランスポートファミリーのスキーマクリーンアップを必要とする場合                                                                |
| 15  | `inspectToolSchemas`              | 正規化後に、プロバイダー所有のスキーマ診断を提示する                                                       | コアにプロバイダー固有ルールを教えずに、プロバイダーがキーワード警告を出したい場合                                                            |
| 16  | `resolveReasoningOutputMode`      | ネイティブ推論出力契約とタグ付き推論出力契約のどちらを使うか選択する                                      | プロバイダーがネイティブフィールドではなく、タグ付き推論/最終出力を必要とする場合                                                             |
| 17  | `prepareExtraParams`              | 汎用ストリームオプションラッパーの前にリクエストパラメーターを正規化する                                   | プロバイダーがデフォルトのリクエストパラメーター、またはプロバイダーごとのパラメータークリーンアップを必要とする場合                          |
| 18  | `createStreamFn`                  | 通常のストリーム経路をカスタムトランスポートで完全に置き換える                                             | プロバイダーが単なるラッパーではなく、カスタムのワイヤプロトコルを必要とする場合                                                              |
| 20  | `wrapStreamFn`                    | 汎用ラッパーの適用後にストリームをラップする                                                               | プロバイダーがカスタムトランスポートなしで、リクエストヘッダー/本文/モデル互換ラッパーを必要とする場合                                        |
| 21  | `resolveTransportTurnState`       | ネイティブのターンごとのトランスポートヘッダーまたはメタデータを付与する                                  | 汎用トランスポートでプロバイダーネイティブのターン ID を送信したい場合                                                                         |
| 22  | `resolveWebSocketSessionPolicy`   | ネイティブ WebSocket ヘッダーまたはセッションクールダウンポリシーを付与する                               | 汎用 WS トランスポートでセッションヘッダーまたはフォールバックポリシーを調整したい場合                                                        |
| 23  | `formatApiKey`                    | 認証プロファイルフォーマッター: 保存済みプロファイルがランタイムの `apiKey` 文字列になる                   | プロバイダーが追加の認証メタデータを保存し、カスタムランタイムトークン形状を必要とする場合                                                    |
| 24  | `refreshOAuth`                    | カスタムリフレッシュエンドポイントまたはリフレッシュ失敗ポリシー向けの OAuth リフレッシュ上書き            | プロバイダーが共有 OpenClaw リフレッシャーに適合しない場合                                                                                    |
| 25  | `buildAuthDoctorHint`             | OAuth リフレッシュが失敗したときに追加される修復ヒント                                                     | プロバイダーが、リフレッシュ失敗後にプロバイダー所有の認証修復ガイダンスを必要とする場合                                                      |
| 26  | `matchesContextOverflowError`     | プロバイダー所有のコンテキストウィンドウオーバーフローマッチャー                                          | プロバイダーに、汎用ヒューリスティックでは見逃す生のオーバーフローエラーがある場合                                                            |
| 27  | `classifyFailoverReason`          | プロバイダー所有のフェイルオーバー理由分類                                                                 | プロバイダーが生の API/トランスポートエラーをレート制限/過負荷などにマッピングできる場合                                                      |
| 28  | `isCacheTtlEligible`              | プロキシ/バックホールプロバイダー向けのプロンプトキャッシュポリシー                                       | プロバイダーがプロキシ固有のキャッシュ TTL ゲートを必要とする場合                                                                             |
| 29  | `buildMissingAuthMessage`         | 汎用の認証不足リカバリーメッセージの置き換え                                                               | プロバイダーがプロバイダー固有の認証不足リカバリーヒントを必要とする場合                                                                      |
| 30  | `augmentModelCatalog`             | 検出後に追加される合成/最終カタログ行                                                                      | プロバイダーが `models list` とピッカーで合成の前方互換行を必要とする場合                                                                      |
| 31  | `resolveThinkingProfile`          | モデル固有の `/think` レベルセット、表示ラベル、デフォルト                                                 | プロバイダーが、選択されたモデル向けにカスタム思考段階またはバイナリラベルを公開している場合                                                  |
| 32  | `isBinaryThinking`                | オン/オフ推論トグル互換フック                                                                               | プロバイダーがバイナリの思考オン/オフのみを公開している場合                                                                                   |
| 33  | `supportsXHighThinking`           | `xhigh` 推論サポート互換フック                                                                              | プロバイダーがモデルの一部でのみ `xhigh` を使いたい場合                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | デフォルト `/think` レベル互換フック                                                                        | プロバイダーがモデルファミリーのデフォルト `/think` ポリシーを所有している場合                                                                |
| 35  | `isModernModelRef`                | ライブプロファイルフィルターとスモーク選択向けのモダンモデルマッチャー                                     | プロバイダーがライブ/スモークの優先モデルマッチングを所有している場合                                                                         |
| 36  | `prepareRuntimeAuth`              | 推論の直前に、設定済み資格情報を実際のランタイムトークン/キーへ交換する                                    | プロバイダーがトークン交換または短命のリクエスト資格情報を必要とする場合                                                                      |
| 37  | `resolveUsageAuth`                | `/usage` と関連ステータスサーフェス向けの使用量/請求資格情報を解決する                                     | プロバイダーがカスタムの使用量/クォータトークン解析、または異なる使用量資格情報を必要とする場合                                               |
| 38  | `fetchUsageSnapshot`              | 認証が解決された後に、プロバイダー固有の使用量/クォータスナップショットを取得して正規化する                             | プロバイダーには、プロバイダー固有の使用量エンドポイントまたはペイロードパーサーが必要                                                                           |
| 39  | `createEmbeddingProvider`         | メモリ/検索用に、プロバイダー所有の埋め込みアダプターを構築する                                                     | メモリ埋め込みの動作はプロバイダーPluginに属する                                                                                    |
| 40  | `buildReplayPolicy`               | プロバイダーのトランスクリプト処理を制御するリプレイポリシーを返す                                        | プロバイダーにはカスタムトランスクリプトポリシー（たとえば thinking-block の除去）が必要                                                               |
| 41  | `sanitizeReplayHistory`           | 汎用トランスクリプトクリーンアップ後にリプレイ履歴を書き換える                                                        | プロバイダーには、共有Compactionヘルパーを超えるプロバイダー固有のリプレイ書き換えが必要                                                             |
| 42  | `validateReplayTurns`             | 埋め込みランナーの前に、最終的なリプレイターンの検証または再整形を行う                                           | プロバイダー転送には、汎用サニタイズ後により厳密なターン検証が必要                                                                    |
| 43  | `onModelSelected`                 | プロバイダー所有の選択後副作用を実行する                                                                 | モデルがアクティブになるとき、プロバイダーにはテレメトリまたはプロバイダー所有の状態が必要                                                                  |

`normalizeModelId`、`normalizeTransport`、`normalizeConfig` は、まず
一致した provider plugin を確認し、その後、他の hook 対応 provider plugin にフォールスルーして、
いずれかが model id または transport/config を実際に変更するまで続けます。これにより、
どの bundled plugin が書き換えを所有しているかを呼び出し元が知る必要なく、
alias/compat provider shim を機能させられます。provider hook が、サポートされている
Google ファミリーの config entry を書き換えない場合でも、bundled Google config normalizer が
その互換性クリーンアップを引き続き適用します。

provider が完全にカスタムの wire protocol やカスタム request executor を必要とする場合、
それは別種の拡張です。これらの hook は、OpenClaw の通常の inference loop 上で
引き続き実行される provider behavior のためのものです。

`resolveUsageAuth` は、OpenClaw が `fetchUsageSnapshot` を呼び出すべきか、
usage/status surface のために汎用の credential resolution へフォールバックすべきかを決定します。
provider に usage credential がある場合は `{ token, accountId? }` を返し、
provider-owned usage auth がリクエストを処理済みで、汎用 API-key/OAuth fallback を
抑制する必要がある場合は `{ handled: true }` を返し、provider が usage auth を
処理しなかった場合は `null` または `undefined` を返します。

### Provider の例

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

Bundled provider plugins は、各 vendor の catalog、auth、thinking、replay、usage のニーズに合わせて
上記の hook を組み合わせます。正式な hook set は `extensions/` 配下の各 plugin にあります。
このページは一覧をミラーするのではなく、形を示しています。

<AccordionGroup>
  <Accordion title="パススルー catalog provider">
    OpenRouter、Kilocode、Z.AI、xAI は `catalog` に加えて
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClaw の static catalog より前に
    upstream model id を表示できるようにします。
  </Accordion>
  <Accordion title="OAuth と usage endpoint provider">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai は
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせ、token exchange と `/usage` integration を所有します。
  </Accordion>
  <Accordion title="Replay と transcript cleanup のファミリー">
    共有の named family（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）により、各 plugin が
    cleanup を再実装する代わりに、provider が `buildReplayPolicy` 経由で
    transcript policy を選択できます。
  </Accordion>
  <Accordion title="Catalog のみの provider">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway`、および
    `volcengine` は `catalog` だけを登録し、共有の inference loop を利用します。
  </Accordion>
  <Accordion title="Anthropic 固有の stream helper">
    ベータヘッダー、`/fast` / `serviceTier`、`context1m` は、
    汎用 SDK ではなく Anthropic plugin の公開 `api.ts` / `contract-api.ts` 境界
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## Runtime helper

Plugin は `api.runtime` 経由で、選択された core helper にアクセスできます。TTS の場合:

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
- PCM audio buffer + sample rate を返します。Plugin は provider 向けに resample/encode する必要があります。
- `listVoices` は provider ごとに任意です。vendor-owned voice picker や setup flow に使用します。
- Voice listing には、provider-aware picker 向けに locale、gender、personality tag などのより豊富な metadata を含められます。
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
- vendor-owned synthesis behavior には speech provider を使用します。
- Legacy Microsoft `edge` input は `microsoft` provider id に正規化されます。
- 推奨される ownership model は company-oriented です。1 つの vendor plugin が、
  OpenClaw がそれらの capability contract を追加するにつれて、text、speech、image、
  将来の media provider を所有できます。

image/audio/video understanding では、Plugin は汎用 key/value bag ではなく、
1 つの typed media-understanding provider を登録します。

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
- vendor behavior は provider plugin に保持します。
- 追加的な拡張は typed のままにします。新しい optional method、新しい optional
  result field、新しい optional capability です。
- Video generation はすでに同じ pattern に従っています:
  - core が capability contract と runtime helper を所有します
  - vendor plugin が `api.registerVideoGenerationProvider(...)` を登録します
  - feature/channel plugin が `api.runtime.videoGeneration.*` を使用します

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

audio transcription では、Plugin は media-understanding runtime または古い STT alias のどちらかを使用できます。

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注記:

- `api.runtime.mediaUnderstanding.*` は、image/audio/video understanding 向けの推奨 shared surface です。
- `extractStructuredWithModel(...)` は、bounded provider-owned image-first extraction のための
  plugin-facing seam です。少なくとも 1 つの image input を含めてください。
  text input は補助的な context です。
  product plugin は自身の route と schema を所有し、OpenClaw は
  provider/runtime boundary を所有します。
- core の media-understanding audio configuration（`tools.media.audio`）と provider fallback order を使用します。
- transcription output が生成されない場合（たとえば skipped/unsupported input）は `{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は compatibility alias として残ります。

Plugin は `api.runtime.subagent` 経由で background subagent run も起動できます。

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

- `provider` と `model` は run ごとの任意の override であり、永続的な session change ではありません。
- OpenClaw は trusted caller に対してのみ、これらの override field を尊重します。
- plugin-owned fallback run では、operator が `plugins.entries.<id>.subagent.allowModelOverride: true` で明示的に有効化する必要があります。
- `plugins.entries.<id>.subagent.allowedModels` を使用して、trusted plugin を特定の canonical `provider/model` target に制限するか、明示的に任意の target を許可するために `"*"` を指定します。
- Untrusted plugin subagent run も動作しますが、override request は黙ってフォールバックするのではなく拒否されます。
- Plugin が作成した subagent session には、作成元の plugin id がタグ付けされます。Fallback `api.runtime.subagent.deleteSession(...)` は、それらの owned session のみを削除できます。任意の session deletion には、引き続き admin-scoped Gateway request が必要です。

web search では、Plugin は agent tool wiring に踏み込む代わりに、
共有 runtime helper を使用できます。

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
- vendor-specific search transport には web-search provider を使用します。
- `api.runtime.webSearch.*` は、agent tool wrapper に依存せずに search behavior を必要とする feature/channel plugin 向けの推奨 shared surface です。

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

- `generate(...)`: configured image-generation provider chain を使用して image を生成します。
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

Route field:

- `path`: Gateway HTTP サーバー配下のルートパス。
- `auth`: 必須。通常の Gateway 認証を要求するには `"gateway"` を、Plugin 管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: 任意。`"exact"` (デフォルト) または `"prefix"`。
- `replaceExisting`: 任意。同じ Plugin が自身の既存ルート登録を置き換えられるようにします。
- `handler`: ルートがリクエストを処理した場合は `true` を返します。

メモ:

- `api.registerHttpHandler(...)` は削除されており、Plugin 読み込みエラーを引き起こします。代わりに `api.registerHttpRoute(...)` を使用してください。
- Plugin ルートは `auth` を明示的に宣言する必要があります。
- 完全一致する `path + match` の競合は、`replaceExisting: true` でない限り拒否されます。また、ある Plugin が別の Plugin のルートを置き換えることはできません。
- 異なる `auth` レベルで重複するルートは拒否されます。`exact`/`prefix` のフォールスルーチェーンは同じ auth レベル内だけにしてください。
- `auth: "plugin"` ルートは、operator runtime scope を自動では受け取りません。これは Plugin 管理の Webhook/署名検証用であり、特権付きの Gateway ヘルパー呼び出し用ではありません。
- `auth: "gateway"` ルートは Gateway リクエストの runtime scope 内で実行されますが、そのスコープは意図的に保守的です:
  - 共有シークレットの bearer auth (`gateway.auth.mode = "token"` / `"password"`) では、呼び出し元が `x-openclaw-scopes` を送信しても、Plugin ルートの runtime scope は `operator.write` に固定されます
  - 信頼された identity-bearing HTTP モード (たとえばプライベート ingress 上の `trusted-proxy` や `gateway.auth.mode = "none"`) は、ヘッダーが明示的に存在する場合にのみ `x-openclaw-scopes` を尊重します
  - それらの identity-bearing Plugin ルートリクエストで `x-openclaw-scopes` が存在しない場合、runtime scope は `operator.write` にフォールバックします
- 実用上のルール: gateway-auth Plugin ルートが暗黙の admin サーフェスだと仮定しないでください。ルートに admin 限定の動作が必要な場合は、identity-bearing auth モードを要求し、明示的な `x-openclaw-scopes` ヘッダー契約を文書化してください。

## Plugin SDK インポートパス

新しい Plugin を作成するときは、モノリシックな `openclaw/plugin-sdk` ルート
バレルではなく、狭い SDK サブパスを使用してください。コアのサブパス:

| サブパス                            | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 登録プリミティブ                            |
| `openclaw/plugin-sdk/channel-core`  | チャンネル entry/build ヘルパー                    |
| `openclaw/plugin-sdk/core`          | 汎用共有ヘルパーと包括契約                         |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod スキーマ (`OpenClawSchema`) |

チャンネル Plugin は、狭い seam のファミリーから選択します — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。承認動作は、無関係な
Plugin フィールドをまたいで混在させるのではなく、1 つの `approvalCapability`
契約に統合するべきです。[チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

Runtime と config のヘルパーは、対応する焦点化された `*-runtime` サブパス
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` など) にあります。広範な `config-runtime`
互換バレルの代わりに、`config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`
を優先してください。

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
小さなチャンネルヘルパーファサード、`openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime` は、古い Plugin 向けの非推奨互換 shim です。
新しいコードでは、代わりにより狭い汎用プリミティブをインポートしてください。
</Info>

リポジトリ内部の entry point (バンドル済み Plugin パッケージルートごと):

- `index.js` — バンドル済み Plugin entry
- `api.js` — ヘルパー/types バレル
- `runtime-api.js` — runtime 専用バレル
- `setup-entry.js` — setup Plugin entry

外部 Plugin は `openclaw/plugin-sdk/*` サブパスのみをインポートするべきです。core または別の Plugin から、別の Plugin パッケージの `src/*` をインポートしてはいけません。
ファサード経由で読み込まれる entry point は、存在する場合は active runtime config snapshot を優先し、その後ディスク上の解決済み config ファイルへフォールバックします。

`image-generation`、`media-understanding`、
`speech` のような capability 固有のサブパスは、バンドル済み Plugin が現在使用しているため存在します。これらは自動的に長期凍結された外部契約になるわけではありません — 依存する場合は関連する SDK リファレンスページを確認してください。

## メッセージツールスキーマ

Plugin は、リアクション、既読、投票など、メッセージ以外のプリミティブ向けに、チャンネル固有の `describeMessageTool(...)` スキーマ
contribution を所有するべきです。
共有送信 presentation では、provider-native な button、component、block、card フィールドではなく、汎用 `MessagePresentation` 契約を使用してください。
契約、フォールバックルール、provider マッピング、Plugin 作者チェックリストについては、[メッセージ presentation](/ja-JP/plugins/message-presentation) を参照してください。

送信可能な Plugin は、メッセージ capability を通じてレンダリング可能な内容を宣言します:

- `presentation`: セマンティック presentation ブロック (`text`, `context`, `divider`, `buttons`, `select`) 用
- `delivery-pin`: pinned-delivery リクエスト用

core は、presentation をネイティブにレンダリングするか、テキストに degrade するかを決定します。
汎用メッセージツールから provider-native UI の escape hatch を公開しないでください。
レガシー native スキーマ用の非推奨 SDK ヘルパーは、既存のサードパーティ Plugin 向けに引き続き export されますが、新しい Plugin では使用するべきではありません。

## チャンネルターゲット解決

チャンネル Plugin は、チャンネル固有のターゲットセマンティクスを所有するべきです。共有 outbound host は汎用のままにし、provider ルールには messaging adapter surface を使用してください:

- `messaging.inferTargetChatType({ to })` は、正規化されたターゲットを directory lookup の前に `direct`、`group`、`channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、入力を directory search ではなく id のような解決へ直行させるべきかを core に伝えます。
- `messaging.targetResolver.reservedLiterals` は、その provider におけるチャンネル/session 参照である裸の語を列挙します。解決は、reserved literal を拒否する前に設定済み directory entry を保持し、その後 directory miss では fail closed します。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または directory miss 後に core が最終的な provider 所有の解決を必要とする場合の Plugin フォールバックです。
- `messaging.resolveOutboundSessionRoute(...)` は、ターゲット解決後の provider 固有 session route 構築を所有します。

推奨される分担:

- peers/groups を検索する前に行うべき category 判断には `inferTargetChatType` を使用します。
- 「これを明示的/native target id として扱う」チェックには `looksLikeId` を使用します。
- 広範な directory search ではなく、provider 固有の正規化フォールバックには `resolveTarget` を使用します。
- chat id、thread id、JID、handle、room id のような provider-native id は、汎用 SDK フィールドではなく、`target` 値または provider 固有 params 内に保持します。

## Config-backed directories

config から directory entry を導出する Plugin は、そのロジックを Plugin 内に保ち、
`openclaw/plugin-sdk/directory-runtime` の共有ヘルパーを再利用するべきです。

チャンネルが次のような config-backed peers/groups を必要とする場合に使用してください:

- allowlist 駆動の DM peers
- 設定済みチャンネル/group map
- account-scoped な静的 directory フォールバック

`directory-runtime` の共有ヘルパーは、汎用操作だけを処理します:

- query filtering
- limit application
- deduping/normalization helpers
- `ChannelDirectoryEntry[]` の構築

チャンネル固有の account inspection と id normalization は、Plugin 実装内に留めるべきです。

## Provider catalogs

Provider Plugin は、`registerProvider({ catalog: { run(...) { ... } } })` で推論用の model catalog を定義できます。

`catalog.run(...)` は、OpenClaw が `models.providers` に書き込むものと同じ形を返します:

- `{ provider }`: 1 つの provider entry 用
- `{ providers }`: 複数の provider entry 用

Plugin が provider 固有の model id、base URL のデフォルト、または auth-gated model metadata を所有する場合は、`catalog` を使用してください。

`catalog.order` は、Plugin の catalog が OpenClaw の組み込み implicit provider と比較していつ merge されるかを制御します:

- `simple`: 単純な API key または env 駆動の provider
- `profile`: auth profile が存在すると現れる provider
- `paired`: 複数の関連 provider entry を合成する provider
- `late`: 他の implicit provider の後の最後の pass

キー衝突では後の provider が勝つため、Plugin は同じ provider id を持つ組み込み provider entry を意図的に override できます。

Plugin は `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` を通じて read-only model row も公開できます。これは list/help/picker surface の forward path であり、`text`、`image_generation`、`video_generation`、`music_generation` row をサポートします。
Provider Plugin は引き続き live endpoint 呼び出し、token exchange、vendor response mapping を所有します。core は共通 row shape、source label、media tool help formatting を所有します。Media-generation provider 登録は、`defaultModel`、`models`、`capabilities` から static catalog row を自動的に合成します。

互換性:

- `discovery` はレガシー alias として引き続き機能しますが、deprecation warning を出します
- `catalog` と `discovery` の両方が登録されている場合、OpenClaw は `catalog` を使用します
- `augmentModelCatalog` は非推奨です。バンドル済み provider は `registerModelCatalogProvider` を通じて supplemental row を公開するべきです

## Read-only channel inspection

Plugin がチャンネルを登録する場合は、`resolveAccount(...)` とあわせて
`plugin.config.inspectAccount(cfg, accountId)` を実装することを優先してください。

理由:

- `resolveAccount(...)` は runtime path です。これは credentials が完全に materialized されていると仮定でき、必要な secret がない場合は fast fail できます。
- `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、doctor/config repair flow などの read-only command path は、設定を説明するだけのために runtime credentials を materialize する必要があるべきではありません。

推奨される `inspectAccount(...)` の動作:

- 説明的な account state のみを返します。
- `enabled` と `configured` を保持します。
- 関連する場合は、次のような credential source/status フィールドを含めます:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- read-only な availability を報告するだけのために raw token value を返す必要はありません。status 形式のコマンドには、`tokenStatus: "available"` (および対応する source フィールド) を返せば十分です。
- credential が SecretRef 経由で設定されているが現在の command path で利用できない場合は、`configured_unavailable` を使用します。

これにより read-only command は、クラッシュしたり account を未設定と誤報告したりする代わりに、「この command path では configured だが unavailable」と報告できます。

## Package packs

Plugin directory には、`openclaw.extensions` を含む `package.json` を含めることができます:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各 entry は Plugin になります。pack が複数の extension を列挙している場合、Plugin id は
`name/<fileBase>` になります。

Plugin が npm deps をインポートする場合は、その directory にインストールして
`node_modules` が利用可能になるようにしてください (`npm install` / `pnpm install`)。

セキュリティ guardrail: すべての `openclaw.extensions` entry は、symlink 解決後も Plugin
directory の内側に留まる必要があります。package directory から抜け出す entry は拒否されます。

セキュリティ上の注意: `openclaw plugins install` は、プロジェクトローカルの `npm install --omit=dev --ignore-scripts` で Plugin 依存関係をインストールします（ライフサイクルスクリプトなし、実行時の dev 依存関係なし）。継承されたグローバル npm install 設定は無視されます。Plugin の依存関係ツリーは「pure JS/TS」に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。

任意: `openclaw.setupEntry` は、軽量なセットアップ専用モジュールを指すことができます。OpenClaw が無効化されたチャネル Plugin のセットアップサーフェスを必要とする場合、またはチャネル Plugin が有効だがまだ未設定の場合、フル Plugin エントリではなく `setupEntry` を読み込みます。これにより、メイン Plugin エントリがツール、フック、またはその他の実行時専用コードも配線する場合に、起動とセットアップを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` により、チャネルがすでに設定済みの場合でも、Gateway の listen 前の起動フェーズ中に、チャネル Plugin が同じ `setupEntry` パスを使うようにできます。

これは、Gateway が listen を開始する前に存在している必要がある起動サーフェスを `setupEntry` が完全にカバーしている場合にのみ使用してください。実際には、セットアップエントリが、起動が依存するチャネル所有のすべてのケイパビリティを登録する必要があるということです。たとえば次のものです。

- チャネル登録そのもの
- Gateway が listen を開始する前に利用可能でなければならない HTTP ルート
- 同じ期間中に存在していなければならない Gateway メソッド、ツール、またはサービス

フルエントリが必要な起動ケイパビリティをまだ所有している場合は、このフラグを有効にしないでください。Plugin はデフォルトの動作のままにし、OpenClaw が起動中にフルエントリを読み込むようにしてください。

バンドルされたチャネルは、フルチャネルランタイムが読み込まれる前に core が参照できるセットアップ専用の契約サーフェスヘルパーも公開できます。現在のセットアップ昇格サーフェスは次のとおりです。

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core は、フル Plugin エントリを読み込まずに、従来の単一アカウントチャネル設定を `channels.<id>.accounts.*` に昇格する必要がある場合に、そのサーフェスを使用します。Matrix は現在のバンドル例です。名前付きアカウントがすでに存在する場合、auth/bootstrap キーだけを名前付きの昇格アカウントに移動し、常に `accounts.default` を作成するのではなく、設定済みの非正準デフォルトアカウントキーを保持できます。

これらのセットアップパッチアダプターは、バンドルされた契約サーフェス探索を遅延させたままにします。import 時間は軽いままで、昇格サーフェスはモジュール import 時にバンドルチャネル起動へ再入するのではなく、初回使用時にのみ読み込まれます。

これらの起動サーフェスに Gateway RPC メソッドが含まれる場合は、Plugin 固有のプレフィックスに置いてください。core 管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Plugin がより狭いスコープを要求しても、常に `operator.admin` に解決されます。

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

チャネル Plugin は、`openclaw.channel` を通じてセットアップ/探索メタデータを、`openclaw.install` を通じてインストールヒントを告知できます。これにより core カタログをデータフリーに保てます。

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

最小例を超えて有用な `openclaw.channel` フィールド:

- `detailLabel`: より豊かなカタログ/ステータスサーフェス向けのセカンダリラベル
- `docsLabel`: docs リンクのリンクテキストを上書き
- `preferOver`: このカタログエントリが優先すべき、より低優先度の Plugin/チャネル ID
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`: 選択サーフェスのコピー制御
- `markdownCapable`: アウトバウンド整形の判断のため、チャネルを markdown 対応としてマーク
- `exposure.configured`: `false` に設定すると、設定済みチャネル一覧サーフェスからチャネルを非表示
- `exposure.setup`: `false` に設定すると、対話型セットアップ/設定ピッカーからチャネルを非表示
- `exposure.docs`: docs ナビゲーションサーフェス向けにチャネルを内部/非公開としてマーク
- `showConfigured` / `showInSetup`: 互換性のためにまだ受け付けられる従来のエイリアス。`exposure` を優先してください
- `quickstartAllowFrom`: チャネルを標準クイックスタート `allowFrom` フローに参加させる
- `forceAccountBinding`: アカウントが 1 つだけ存在する場合でも明示的なアカウントバインディングを要求
- `preferSessionLookupForAnnounceTarget`: announce ターゲットの解決時にセッション検索を優先

OpenClaw は、**外部チャネルカタログ**（たとえば MPM レジストリエクスポート）もマージできます。JSON ファイルを次のいずれかに置いてください。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または `OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）に 1 つ以上の JSON ファイルを指定します（カンマ/セミコロン/`PATH` 区切り）。各ファイルには `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を含める必要があります。パーサーは、`"entries"` キーの従来エイリアスとして `"packages"` または `"plugins"` も受け付けます。

生成されたチャネルカタログエントリとプロバイダーインストールカタログエントリは、生の `openclaw.install` ブロックの隣に、正規化されたインストールソース情報を公開します。正規化された情報は、npm spec が厳密なバージョンか浮動セレクターか、期待される integrity メタデータが存在するか、ローカルソースパスも利用可能かを識別します。カタログ/パッケージ ID が既知の場合、正規化された情報は、解析された npm パッケージ名がその ID からずれていると警告します。また、`defaultChoice` が無効である場合、利用できないソースを指している場合、有効な npm ソースなしに npm integrity メタデータが存在する場合にも警告します。コンシューマーは、手作りのエントリやカタログ shim がそれを合成する必要がないように、`installSource` を追加の任意フィールドとして扱うべきです。
これにより、オンボーディングと診断は Plugin ランタイムを import せずにソースプレーンの状態を説明できます。

公式の外部 npm エントリでは、厳密な `npmSpec` と `expectedIntegrity` を優先してください。裸のパッケージ名と dist-tag は互換性のために引き続き動作しますが、ソースプレーン警告を表示するため、既存の Plugin を壊さずにカタログをピン留め済みで integrity チェック付きのインストールへ移行できます。オンボーディングがローカルカタログパスからインストールする場合、可能であれば `source: "path"` とワークスペース相対の `sourcePath` を持つ管理対象 Plugin Plugin インデックスエントリを記録します。絶対的な運用読み込みパスは `plugins.load.paths` に残ります。インストールレコードは、ローカルワークステーションパスを長期設定へ重複して入れることを避けます。これにより、ローカル開発インストールをソースプレーン診断から見えるようにしつつ、2 つ目の生のファイルシステムパス開示サーフェスを追加せずに済みます。永続化された `installed_plugin_index` SQLite 行はインストールソースの信頼できる情報源であり、Plugin ランタイムモジュールを読み込まずに更新できます。その `installRecords` マップは、Plugin マニフェストが見つからない場合や無効な場合でも永続的です。その `plugins` ペイロードは再構築可能なマニフェストビューです。

## コンテキストエンジン Plugin

コンテキストエンジン Plugin は、取り込み、組み立て、Compaction のためのセッションコンテキストオーケストレーションを所有します。Plugin から `api.registerContextEngine(id, factory)` で登録し、`plugins.slots.contextEngine` でアクティブなエンジンを選択します。

これは、Plugin がメモリ検索やフックを追加するだけではなく、デフォルトのコンテキストパイプラインを置き換えたり拡張したりする必要がある場合に使用します。

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

factory の `ctx` は、構築時初期化のために任意の `config`、`agentDir`、`workspaceDir` 値を公開します。

アクティブなハーネスが永続的なバックエンドスレッドを持つ場合、`assemble()` は `contextProjection` を返せます。従来のターンごとの投影では省略してください。組み立てられたコンテキストをバックエンドスレッドに一度注入し、epoch が変わるまで再利用すべき場合は、`{ mode: "thread_bootstrap", epoch }` を返します。エンジン所有の Compaction パス後など、エンジンの意味的コンテキストが変わった後に epoch を変更してください。ホストは、thread-bootstrap 投影でツール呼び出しメタデータ、入力形状、編集済みツール結果を保持する場合があります。これにより、新しいバックエンドスレッドは、生のシークレットを含むペイロードをコピーせずにツールの連続性を保持できます。

エンジンが Compaction アルゴリズムを所有**していない**場合は、`compact()` を実装したままにし、明示的に委譲してください。

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

Plugin が現在の API に合わない動作を必要とする場合、Plugin システムをバイパスして private reach-in しないでください。不足しているケイパビリティを追加してください。

推奨手順:

1. core 契約を定義する
   core が所有すべき共有動作を決めます。ポリシー、フォールバック、設定マージ、ライフサイクル、チャネル向けセマンティクス、実行時ヘルパー形状です。
2. 型付き Plugin 登録/ランタイムサーフェスを追加する
   `OpenClawPluginApi` や `api.runtime` を、最小限有用な型付きケイパビリティサーフェスで拡張します。
3. core + チャネル/機能コンシューマーを配線する
   チャネルと機能 Plugin は、ベンダー実装を直接 import するのではなく、core を通じて新しいケイパビリティを消費するべきです。
4. ベンダー実装を登録する
   ベンダー Plugin は、その後ケイパビリティに対してバックエンドを登録します。
5. 契約カバレッジを追加する
   所有権と登録形状が時間が経っても明示的なままになるように、テストを追加します。

これは、OpenClaw が 1 つのプロバイダーの世界観にハードコードされることなく、意見を持ち続けるための方法です。具体的なファイルチェックリストと実例については、[Capability Cookbook](/ja-JP/plugins/adding-capabilities) を参照してください。

### ケイパビリティチェックリスト

新しいケイパビリティを追加する場合、実装では通常、次のサーフェスをまとめて触るべきです。

- `src/<capability>/types.ts` の core 契約型
- `src/<capability>/runtime.ts` の core runner/runtime ヘルパー
- `src/plugins/types.ts` の Plugin API 登録サーフェス
- `src/plugins/registry.ts` の Plugin registry 配線
- 機能/チャネル Plugin が消費する必要がある場合は、`src/plugins/runtime/*` の Plugin ランタイム公開
- `src/test-utils/plugin-registration.ts` の capture/test ヘルパー
- `src/plugins/contracts/registry.ts` の所有権/契約アサーション
- `docs/` の operator/Plugin docs

これらのサーフェスのいずれかが欠けている場合、そのケイパビリティがまだ完全には統合されていない兆候であることが普通です。

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

- core は capability contract と orchestration を所有する
- ベンダーplugins はベンダー実装を所有する
- feature/channel plugins は runtime helpers を利用する
- 契約テストによって ownership を明示的に保つ

## 関連

- [Pluginアーキテクチャ](/ja-JP/plugins/architecture) — 公開 capability model と shapes
- [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [pluginsの構築](/ja-JP/plugins/building-plugins)
