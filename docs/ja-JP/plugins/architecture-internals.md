---
read_when:
    - providerランタイムhook、channel lifecycle、またはpackage packを実装する
    - Pluginのload順序やregistry stateをデバッグする
    - 新しいPlugin capabilityまたはcontext engine pluginを追加する
summary: 'Pluginアーキテクチャ内部: loadパイプライン、registry、ランタイムhook、HTTP route、リファレンステーブル'
title: Pluginアーキテクチャ内部
x-i18n:
    generated_at: "2026-04-24T05:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 243ccb0cb5b55c4ba08ac387f5b19949391b3a4f1772f6d7ac889f3d8f548a47
    source_path: plugins/architecture-internals.md
    workflow: 15
---

公開capability model、plugin shape、ownership/execution
契約については [Plugin architecture](/ja-JP/plugins/architecture) を参照してください。このページは、
内部メカニズムのリファレンスです。loadパイプライン、registry、ランタイムhook、
Gateway HTTP route、import path、schema tableを扱います。

## Loadパイプライン

起動時、OpenClawはおおよそ次を行います:

1. 候補plugin rootを検出する
2. ネイティブまたは互換bundle manifestとpackage metadataを読む
3. 安全でない候補を拒否する
4. plugin config（`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`）を正規化する
5. 各候補について有効化を決定する
6. 有効なネイティブmoduleを読み込む: build済みの同梱moduleはネイティブloaderを使い、
   buildされていないネイティブpluginはjitiを使う
7. ネイティブ `register(api)` hookを呼び、plugin registryへ登録を収集する
8. registryをcommand/runtimeサーフェスへ公開する

<Note>
`activate` は `register` のレガシーaliasです。loaderは存在する方（`def.register ?? def.activate`）を解決し、同じタイミングで呼び出します。すべての同梱pluginは `register` を使っています。新しいpluginでは `register` を推奨します。
</Note>

安全性ゲートはランタイム実行の**前に**行われます。候補は、
entryがplugin rootを抜ける、pathがworld-writableである、または同梱でないpluginについてpath
ownershipが怪しい場合にブロックされます。

### Manifest-firstの動作

manifestはcontrol-planeの信頼できる情報源です。OpenClawはこれを使って:

- pluginを識別する
- 宣言されたchannel/Skills/config schemaやbundle capabilityを検出する
- `plugins.entries.<id>.config` を検証する
- Control UIのlabel/placeholderを補強する
- install/catalog metadataを表示する
- plugin runtimeを読み込まずに、安価なactivationとsetup descriptorを保持する

ネイティブpluginでは、ランタイムmoduleがdata-plane部分です。これはhook、tool、command、provider flowなどの実際の動作を登録します。

任意のmanifest `activation` と `setup` ブロックはcontrol planeに留まります。
これらはactivation planningとsetup discovery用のメタデータ専用descriptorであり、
ランタイム登録、`register(...)`、`setupEntry` の代替ではありません。
最初のlive activation consumerは現在、manifestのcommand、channel、providerヒントを使って、
より広いregistry具体化の前にplugin読み込みを絞り込みます:

- CLI読み込みは、要求されたprimary commandを所有するpluginに絞り込む
- channel setup/plugin解決は、要求された
  channel idを所有するpluginに絞り込む
- 明示的provider setup/runtime解決は、要求されたprovider idを所有する
  pluginに絞り込む

setup discoveryは現在、`setup.providers` や
`setup.cliBackends` のようなdescriptor所有idを優先して候補pluginを絞り込み、その後で
setup-time runtime hookがまだ必要なpluginに対して `setup-api` へフォールバックします。
検出された複数pluginが同じ正規化済みsetup providerまたはCLI backend
idを主張する場合、setup lookupはdiscovery順序に頼らず、
その曖昧なownerを拒否します。

### loaderがキャッシュするもの

OpenClawは短命なin-process cacheを次のために保持します:

- discovery結果
- manifest registry data
- 読み込み済みplugin registry

これらのcacheは、スパイク的な起動や繰り返しcommandのオーバーヘッドを減らします。これは
永続化ではなく、短命な性能cacheとして考えるのが安全です。

性能に関する注記:

- これらのcacheを無効化するには `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` または
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を設定します。
- cache windowは `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` と
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` で調整します。

## Registryモデル

読み込まれたpluginは、coreの適当なglobalを直接変更しません。代わりに
中央plugin registryへ登録します。

registryが追跡するもの:

- plugin record（identity, source, origin, status, diagnostics）
- tools
- legacy hookとtyped hook
- channels
- providers
- gateway RPC handler
- HTTP route
- CLI registrar
- background service
- plugin所有command

core featureは、そのregistryから読み取るのであって、plugin moduleへ直接話しかけません。
これにより読み込みは一方向に保たれます:

- plugin module -> registry registration
- core runtime -> registry consumption

この分離は保守性のために重要です。ほとんどのcoreサーフェスが
「registryを読む」という1つの統合ポイントだけを必要とし、
「すべてのplugin moduleを特別扱いする」必要がなくなります。

## Conversation binding callback

会話をbindするpluginは、approvalが解決されたときに反応できます。

bind requestが承認または拒否された後にcallbackを受け取るには
`api.onConversationBindingResolved(...)` を使ってください:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // このplugin + conversationに対するbindingが存在するようになった。
        console.log(event.binding?.conversationId);
        return;
      }

      // requestは拒否された。ローカルのpending stateを消す。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

callback payload field:

- `status`: `"approved"` または `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, または `"deny"`
- `binding`: 承認済みrequest向けの解決済みbinding
- `request`: 元のrequest summary、detach hint、sender id、会話metadata

このcallbackは通知専用です。誰が会話をbindできるかは変更せず、
coreのapproval処理完了後に実行されます。

## Providerランタイムhook

provider pluginには3つのレイヤーがあります:

- **Manifest metadata**: 安価なpre-runtime lookup用の `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`
- **Config-time hook**: `catalog`（レガシーでは `discovery`）と
  `applyConfigDefaults`
- **Runtime hook**: auth、model解決、
  stream wrapping、thinking level、replay policy、usage endpointをカバーする40個以上の任意hook。完全な一覧は
  [Hook order and usage](#hook-order-and-usage) を参照してください。

OpenClawは引き続き、汎用agent loop、failover、transcript処理、tool policyを所有します。
これらのhookは、provider固有の動作を、完全なカスタム推論transportを必要とせずに拡張するためのサーフェスです。

providerがenvベースcredentialを持ち、generic auth/status/model-picker pathが
plugin runtimeを読み込まずにそれを見られるようにしたい場合は、manifest `providerAuthEnvVars` を使ってください。
あるprovider idに別のprovider idのenv var、auth profile、config-backed auth、API-keyオンボーディングchoiceを再利用させたい場合は、
manifest `providerAuthAliases` を使ってください。オンボーディング/auth-choice
CLIサーフェスがproviderのchoice id、group label、単純な1フラグauth配線を
provider runtimeを読み込まずに知る必要がある場合は、manifest `providerAuthChoices` を使ってください。provider runtime
`envVars` は、オンボーディングlabelやOAuth
client-id/client-secret setup varのようなoperator向けヒントに残してください。

channelにenv駆動のauthやsetupがあり、generic shell-env fallback、
config/status check、setup promptがchannel runtimeを読み込まずにそれを見られるようにしたい場合は、manifest `channelEnvVars` を使ってください。

### Hookの順序と使い方

model/provider pluginについて、OpenClawはおおよそ次の順でhookを呼びます。
「When to use」列は、簡単な判断ガイドです。

| #   | Hook                              | 役割                                                                                                           | 使用する場面                                                                                                                                    |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 生成時にprovider configを `models.providers` へ公開する                                          | providerがcatalogまたはbase URLデフォルトを所有している場合                                                                                     |
| 2   | `applyConfigDefaults`             | config materialization中にprovider所有のグローバルconfigデフォルトを適用する                                  | デフォルトがauth mode、env、またはprovider model-familyの意味論に依存する場合                                                                  |
| --  | _(組み込みmodel lookup)_          | OpenClawはまず通常のregistry/catalog pathを試す                                                                | _(plugin hookではありません)_                                                                                                                   |
| 3   | `normalizeModelId`                | lookup前にレガシーまたはpreview model-id aliasを正規化する                                                     | canonical model解決の前にproviderがalias cleanupを所有している場合                                                                              |
| 4   | `normalizeTransport`              | 汎用model assemblyの前にprovider-familyの `api` / `baseUrl` を正規化する                                      | 同じtransport family内のcustom provider idについて、providerがtransport cleanupを所有している場合                                              |
| 5   | `normalizeConfig`                 | ランタイム/provider解決の前に `models.providers.<id>` を正規化する                                             | plugin側に置くべきconfig cleanupが必要な場合。bundled Google-family helperも、サポートされるGoogle config entryのバックストップになる         |
| 6   | `applyNativeStreamingUsageCompat` | config providerに対してnative streaming-usage compatの書き換えを適用する                                       | endpoint駆動のnative streaming usage metadata修正が必要な場合                                                                                   |
| 7   | `resolveConfigApiKey`             | ランタイムauth読み込み前にconfig provider向けenv-marker authを解決する                                         | provider所有のenv-marker API-key解決がある場合。`amazon-bedrock` にはここで組み込みAWS env-marker resolverもあります                           |
| 8   | `resolveSyntheticAuth`            | 平文を永続化せずにlocal/self-hostedまたはconfig-backed authを公開する                                          | synthetic/local credential markerで動作できるprovider                                                                                            |
| 9   | `resolveExternalAuthProfiles`     | provider所有のexternal auth profileをoverlayする。デフォルト `persistence` はCLI/app所有credentialに対して `runtime-only` | copied refresh tokenを永続化せずにexternal auth credentialを再利用するprovider。manifestに `contracts.externalAuthProviders` を宣言します     |
| 10  | `shouldDeferSyntheticProfileAuth` | 保存済みsynthetic profile placeholderの優先度をenv/config-backed authより下げる                                | env/config-backed authを優先させたいsynthetic placeholder profileをproviderが保存する場合                                                       |
| 11  | `resolveDynamicModel`             | まだローカルregistryにないprovider所有model idに対する同期fallback                                             | 任意のupstream model idを受け付けるprovider                                                                                                     |
| 12  | `prepareDynamicModel`             | 非同期warm-upを行い、その後 `resolveDynamicModel` を再実行する                                                  | 不明id解決前にnetwork metadataが必要なprovider                                                                                                  |
| 13  | `normalizeResolvedModel`          | 埋め込みrunnerが解決済みmodelを使う前の最終書き換え                                                            | transport書き換えが必要だが、それでもcore transportを使うprovider                                                                               |
| 14  | `contributeResolvedModelCompat`   | 別の互換transportの背後にあるvendor model向けcompat flagを提供する                                             | provider自体を乗っ取らずに、proxy transport上で自分のmodelを認識するprovider                                                                    |
| 15  | `capabilities`                    | 共有core logicで使われるprovider所有のtranscript/tooling metadata                                              | transcript/provider-familyの癖が必要なprovider                                                                                                  |
| 16  | `normalizeToolSchemas`            | 埋め込みrunnerが見る前にtool schemaを正規化する                                                                | transport-familyのschema cleanupが必要なprovider                                                                                                |
| 17  | `inspectToolSchemas`              | 正規化後にprovider所有のschema diagnosticsを公開する                                                           | coreにprovider固有ルールを教えずにkeyword warningを出したいprovider                                                                             |
| 18  | `resolveReasoningOutputMode`      | nativeまたはtagged reasoning-output契約を選択する                                                              | native fieldではなく、tagged reasoning/final outputが必要なprovider                                                                             |
| 19  | `prepareExtraParams`              | 汎用stream option wrapperの前にrequest param正規化を行う                                                       | デフォルトrequest paramまたはproviderごとのparam cleanupが必要なprovider                                                                         |
| 20  | `createStreamFn`                  | 通常のstream pathを完全に置き換えてcustom transportを使う                                                      | wrapperではなくcustom wire protocolが必要なprovider                                                                                             |
| 21  | `wrapStreamFn`                    | 汎用wrapper適用後にstream wrapperをかける                                                                       | custom transportなしで、request header/body/model compat wrapperが必要なprovider                                                                |
| 22  | `resolveTransportTurnState`       | nativeなturn単位transport headerまたはmetadataを付与する                                                       | provider-nativeなturn identityを汎用transportで送らせたいprovider                                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket headerまたはsession cooldown policyを付与する                                                  | session headerやfallback policyをgeneric WS transportで調整したいprovider                                                                       |
| 24  | `formatApiKey`                    | auth-profile formatter: 保存profileをランタイムの `apiKey` 文字列にする                                        | 追加auth metadataを保存し、custom runtime token shapeが必要なprovider                                                                            |
| 25  | `refreshOAuth`                    | custom refresh endpointまたはrefresh-failure policy向けのOAuth refresh override                                | 共有 `pi-ai` refresherに適合しないprovider                                                                                                      |
| 26  | `buildAuthDoctorHint`             | OAuth refresh失敗時に付加される修復ヒント                                                                       | refresh failure後にprovider所有のauth修復ガイダンスが必要なprovider                                                                             |
| 27  | `matchesContextOverflowError`     | provider所有のcontext-window overflow matcher                                                                   | 汎用heuristicでは見逃すraw overflow errorを持つprovider                                                                                          |
| 28  | `classifyFailoverReason`          | provider所有のfailover reason分類                                                                               | raw API/transport errorをrate-limit/overloadなどへマッピングできるprovider                                                                      |
| 29  | `isCacheTtlEligible`              | proxy/backhaul provider向けprompt-cache policy                                                                  | proxy固有のcache TTL gatingが必要なprovider                                                                                                     |
| 30  | `buildMissingAuthMessage`         | 汎用missing-auth recovery messageの代替                                                                         | provider固有のmissing-auth recovery hintが必要なprovider                                                                                        |
| 31  | `suppressBuiltInModel`            | 古いupstream modelの抑制と、任意のuser-facing error hint                                                        | 古いupstream rowを隠したり、vendor hintに置き換えたりしたいprovider                                                                             |
| 32  | `augmentModelCatalog`             | discovery後にsynthetic/final catalog rowを追加する                                                             | `models list` とpickerにforward-compatなsynthetic rowが必要なprovider                                                                           |
| 33  | `resolveThinkingProfile`          | model固有の `/think` level set、表示label、デフォルト                                                           | 選択したmodelに対してcustom thinking ladderまたはbinary labelを公開するprovider                                                                  |
| 34  | `isBinaryThinking`                | on/off reasoning toggle互換hook                                                                                 | binaryなthinking on/offだけを公開するprovider                                                                                                   |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning support互換hook                                                                               | 一部modelにだけ `xhigh` を有効にしたいprovider                                                                                                  |
| 36  | `resolveDefaultThinkingLevel`     | デフォルト `/think` level互換hook                                                                               | model familyに対するデフォルト `/think` policyをproviderが所有している場合                                                                      |
| 37  | `isModernModelRef`                | live profile filterとsmoke selection向けのmodern-model matcher                                                 | live/smoke向けpreferred-model matchingをproviderが所有している場合                                                                            |
| 38  | `prepareRuntimeAuth`              | 推論直前に、設定済みcredentialを実際のランタイムtoken/keyへ交換する                                            | token交換や短命のrequest credentialが必要なprovider                                                                                           |
| 39  | `resolveUsageAuth`                | `/usage` と関連statusサーフェス向けのusage/billing credentialを解決する                                       | custom usage/quota token解析または別のusage credentialが必要なprovider                                                                        |
| 40  | `fetchUsageSnapshot`              | auth解決後にprovider固有のusage/quota snapshotを取得して正規化する                                             | provider固有のusage endpointまたはpayload parserが必要なprovider                                                                              |
| 41  | `createEmbeddingProvider`         | memory/search向けのprovider所有embedding adapterを構築する                                                     | memory embedding動作はprovider pluginに属する                                                                                                  |
| 42  | `buildReplayPolicy`               | provider向けtranscript handlingを制御するreplay policyを返す                                                   | custom transcript policy（例: thinking-block除去）が必要なprovider                                                                             |
| 43  | `sanitizeReplayHistory`           | 汎用transcript cleanup後にreplay historyを書き換える                                                           | 共有compaction helperを超えるprovider固有のreplay書き換えが必要なprovider                                                                    |
| 44  | `validateReplayTurns`             | 埋め込みrunner前の最終replay-turn検証または再整形                                                              | 汎用sanitation後でも、より厳格なturn検証が必要なprovider transport                                                                            |
| 45  | `onModelSelected`                 | modelが有効化されたときにprovider所有のpost-selection副作用を実行する                                          | modelが有効になったときにtelemetryまたはprovider所有stateが必要なprovider                                                                     |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig` は、まず
一致したprovider pluginを確認し、その後、実際にmodel
idやtransport/configを変更するものが見つかるまで、hook対応provider pluginを順に試します。
これにより、callerがどの同梱pluginがその書き換えを所有しているかを知らなくても、
alias/compat provider shimが動作します。provider hookがサポートされる
Google-family config entryを書き換えない場合でも、同梱Google config normalizerは引き続き
その互換性cleanupを適用します。

providerが完全にcustomなwire protocolやcustom request executorを必要とするなら、
それは別種の拡張です。これらのhookは、依然としてOpenClawの通常推論ループ上で動く
provider behavior向けです。

### Provider例

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

同梱provider pluginは、各vendorのcatalog、
auth、thinking、replay、usageの要件に合わせて、上記hookを組み合わせます。権威あるhook setは、
各pluginの `extensions/` 配下にあり、このページでは
一覧をそのまま写すのではなく、形状を示します。

<AccordionGroup>
  <Accordion title="パススルーcatalog provider">
    OpenRouter, Kilocode, Z.AI, xAI は `catalog` と
    `resolveDynamicModel` / `prepareDynamicModel` を登録し、OpenClawの静的catalogより前に
    upstream model idを表面化できるようにします。
  </Accordion>
  <Accordion title="OAuthとusage endpoint provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai は
    `prepareRuntimeAuth` または `formatApiKey` を `resolveUsageAuth` +
    `fetchUsageSnapshot` と組み合わせ、token交換と `/usage` 統合を所有します。
  </Accordion>
  <Accordion title="Replayとtranscript cleanup family">
    共有の名前付きfamily（`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`）により、providerは
    各pluginでcleanupを再実装する代わりに、`buildReplayPolicy` 経由で
    transcript policyへオプトインできます。
  </Accordion>
  <Accordion title="catalogのみのprovider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, および
    `volcengine` は `catalog` だけを登録し、共有推論ループに乗ります。
  </Accordion>
  <Accordion title="Anthropic固有のstream helper">
    Beta header、`/fast` / `serviceTier`、`context1m` は、汎用SDKではなく、
    Anthropic pluginの公開 `api.ts` / `contract-api.ts` seam
    （`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`）内にあります。
  </Accordion>
</AccordionGroup>

## ランタイムhelper

Pluginは `api.runtime` 経由で選択されたcore helperへアクセスできます。TTSの場合:

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

- `textToSpeech` は、file/voice-noteサーフェス向けの通常core TTS output payloadを返します。
- coreの `messages.tts` 設定とprovider選択を使います。
- PCM audio buffer + sample rateを返します。Plugin側でprovider向けにresample/encodeする必要があります。
- `listVoices` はproviderごとに任意です。vendor所有のvoice pickerやsetup flowに使ってください。
- Voice listingには、provider-aware picker向けにlocale, gender, personality tagのような、より豊富なmetadataを含められます。
- 現在telephonyをサポートするのはOpenAIとElevenLabsです。Microsoftはサポートしません。

Pluginは `api.registerSpeechProvider(...)` でspeech providerも登録できます。

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

- TTS policy、fallback、reply配信はcoreに残してください。
- vendor所有のsynthesis behaviorにはspeech providerを使ってください。
- レガシーのMicrosoft `edge` 入力は `microsoft` provider idへ正規化されます。
- 推奨されるownershipモデルはcompany単位です: OpenClawがそれらの
  capability contractを追加していくにつれ、1つのvendor pluginが
  text, speech, image, 将来のmedia providerまで所有できます。

画像/音声/動画理解については、Pluginは汎用key/value bagではなく、
typedなmedia-understanding providerを1つ登録します:

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

- orchestration、fallback、config、channel配線はcoreに残してください。
- vendor behaviorはprovider plugin内に残してください。
- 加法的な拡張はtypedのままにしてください: 新しい任意method、新しい任意
  result field、新しい任意capability。
- 動画生成もすでに同じパターンに従います:
  - coreがcapability contractとruntime helperを所有
  - vendor pluginが `api.registerVideoGenerationProvider(...)` を登録
  - feature/channel pluginが `api.runtime.videoGeneration.*` を消費

media-understandingのruntime helperとして、Pluginは次を呼び出せます:

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

音声文字起こしには、Pluginはmedia-understanding runtime
または古いSTT aliasのどちらかを使えます:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIMEを確実に推定できない場合は任意:
  mime: "audio/ogg",
});
```

注:

- `api.runtime.mediaUnderstanding.*` は、
  image/audio/video理解のための推奨される共有サーフェスです。
- coreのmedia-understanding音声設定（`tools.media.audio`）とprovider fallback orderを使います。
- 文字起こし出力が生成されなかった場合（たとえばskipped/unsupported input）、`{ text: undefined }` を返します。
- `api.runtime.stt.transcribeAudioFile(...)` は互換aliasとして残ります。

Pluginは `api.runtime.subagent` 経由でbackground subagent runも起動できます:

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

- `provider` と `model` は実行ごとの任意overrideであり、永続的なsession変更ではありません。
- OpenClawは、trusted callerに対してのみこれらのoverride fieldを尊重します。
- plugin所有のfallback runでは、operatorは `plugins.entries.<id>.subagent.allowModelOverride: true` でオプトインする必要があります。
- trusted pluginを特定のcanonical `provider/model` targetに制限するには `plugins.entries.<id>.subagent.allowedModels` を使い、明示的に任意targetを許可するには `"*"` を使ってください。
- untrusted pluginのsubagent runも引き続き機能しますが、override requestは黙ってfallbackせず拒否されます。

web searchについては、Pluginは
agent tool配線に手を入れる代わりに共有runtime helperを消費できます:

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

Pluginは
`api.registerWebSearchProvider(...)` 経由でweb-search providerも登録できます。

注:

- provider選択、credential解決、共有request semanticsはcoreに残してください。
- vendor固有のsearch transportにはweb-search providerを使ってください。
- `api.runtime.webSearch.*` は、agent tool wrapperに依存せずsearch behaviorを必要とするfeature/channel plugin向けの推奨共有サーフェスです。

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

- `generate(...)`: 設定済みimage-generation provider chainを使って画像を生成します。
- `listProviders(...)`: 利用可能なimage-generation providerとそのcapabilityを一覧表示します。

## Gateway HTTP route

Pluginは `api.registerHttpRoute(...)` でHTTP endpointを公開できます。

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

- `path`: gateway HTTP server配下のroute path。
- `auth`: 必須。通常のgateway authを要求するには `"gateway"`、plugin管理auth/Webhook検証には `"plugin"` を使います。
- `match`: 任意。`"exact"`（デフォルト）または `"prefix"`。
- `replaceExisting`: 任意。同じpluginが自分自身の既存route登録を置き換えることを許可します。
- `handler`: routeがrequestを処理したときに `true` を返します。

注:

- `api.registerHttpHandler(...)` は削除されており、使うとplugin-load errorになります。代わりに `api.registerHttpRoute(...)` を使ってください。
- Plugin routeは `auth` を明示的に宣言する必要があります。
- 同じ `path + match` の衝突は、`replaceExisting: true` がない限り拒否され、1つのpluginが別pluginのrouteを置き換えることはできません。
- `auth` levelが異なる重複routeは拒否されます。`exact`/`prefix` fallthrough chainは同じauth level内だけに保ってください。
- `auth: "plugin"` routeは、自動でoperator runtime scopeを受け取り**ません**。これはplugin管理Webhook/signature検証用であり、特権Gateway helper call用ではありません。
- `auth: "gateway"` routeはGateway request runtime scope内で動作しますが、そのscopeは意図的に保守的です:
  - shared-secret bearer auth（`gateway.auth.mode = "token"` / `"password"`）では、callerが `x-openclaw-scopes` を送っても、plugin-route runtime scopeは `operator.write` に固定されます
  - trusted identity-bearing HTTP mode（たとえば `trusted-proxy` またはprivate ingress上の `gateway.auth.mode = "none"`）では、`x-openclaw-scopes` headerが明示的に存在する場合にのみそれを尊重します
  - そのidentity-bearing plugin-route requestで `x-openclaw-scopes` が存在しない場合、runtime scopeは `operator.write` にフォールバックします
- 実務上のルール: gateway-auth plugin routeを暗黙のadminサーフェスだと想定しないでください。routeがadmin専用動作を必要とする場合は、identity-bearing auth modeを要求し、明示的な `x-openclaw-scopes` header契約を文書化してください。

## Plugin SDK import path

新しいpluginを作成するときは、巨大な `openclaw/plugin-sdk` ルート
barrelではなく、狭いSDK subpathを使ってください。core subpath:

| Subpath                             | 目的                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin登録primitive                                |
| `openclaw/plugin-sdk/channel-core`  | Channel entry/build helper                         |
| `openclaw/plugin-sdk/core`          | 汎用共有helperとumbrella契約                       |
| `openclaw/plugin-sdk/config-schema` | ルート `openclaw.json` Zod schema（`OpenClawSchema`） |

channel pluginは、狭いseam群から選びます —
`channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`。approval動作は、無関係な
plugin fieldをまたいで混在させるのではなく、1つの `approvalCapability` 契約へ
集約すべきです。[Channel plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。

ランタイムおよびconfig helperは、対応する `*-runtime` subpath
（`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` など）にあります。

<Info>
`openclaw/plugin-sdk/channel-runtime` は非推奨です —
古いplugin向けの互換shimです。新しいコードでは、より狭いgeneric primitiveをimportしてください。
</Info>

repo内部entry point（同梱plugin package rootごと）:

- `index.js` — 同梱plugin entry
- `api.js` — helper/types barrel
- `runtime-api.js` — ランタイム専用barrel
- `setup-entry.js` — setup plugin entry

外部pluginは `openclaw/plugin-sdk/*` subpathだけをimportすべきです。決して
別plugin packageの `src/*` をcoreや他pluginからimportしないでください。
facade-loaded entry pointは、存在すればアクティブなruntime config snapshotを優先し、
次にディスク上の解決済みconfig fileへフォールバックします。

`image-generation`, `media-understanding`,
`speech` のようなcapability固有subpathは、同梱pluginが現在それらを使っているため存在します。これらは
自動的に長期固定された外部契約ではありません。依存する前に、対応するSDK
リファレンスページを確認してください。

## Messageツールschema

Pluginは、reaction、read、pollのような非message primitive向けに、channel固有の `describeMessageTool(...)` schema
contributionを所有すべきです。
共有send presentationには、providerネイティブのbutton, component, block, card fieldではなく、
汎用 `MessagePresentation` 契約を使ってください。
契約、fallbackルール、provider mapping、plugin作成者向けチェックリストは [Message Presentation](/ja-JP/plugins/message-presentation) を参照してください。

send可能pluginは、message capabilityを通じて何をrenderできるかを宣言します:

- semantic presentation block（`text`, `context`, `divider`, `buttons`, `select`）向けの `presentation`
- pinned-delivery request向けの `delivery-pin`

presentationをネイティブにrenderするかtextへdegradeするかはcoreが決めます。
汎用message toolからproviderネイティブUIのescape hatchを公開しないでください。
レガシーのnative schema向け非推奨SDK helperは既存の
サードパーティplugin向けに引き続きexportされていますが、新しいpluginでは使わないでください。

## Channel target解決

channel pluginはchannel固有のtarget semanticsを所有すべきです。共有
outbound hostは汎用のままにし、providerルールにはmessaging adapterサーフェスを使ってください:

- `messaging.inferTargetChatType({ to })` は、directory lookup前に、正規化されたtargetを
  `direct`, `group`, `channel` のどれとして扱うべきかを決定します。
- `messaging.targetResolver.looksLikeId(raw, normalized)` は、
  directory searchではなく、ある入力をid風解決へ直接スキップすべきかどうかをcoreへ伝えます。
- `messaging.targetResolver.resolveTarget(...)` は、正規化後または
  directory miss後にcoreが最終的なprovider所有解決を必要とするときのplugin fallbackです。
- `messaging.resolveOutboundSessionRoute(...)` は、target解決後のprovider固有session
  route構築を所有します。

推奨される分割:

- peer/group検索前に行うべきカテゴリ判定には `inferTargetChatType` を使う。
- 「これを明示的/ネイティブtarget idとして扱う」チェックには `looksLikeId` を使う。
- `resolveTarget` はprovider固有の正規化fallbackに使い、広範なdirectory searchには使わない。
- chat id, thread id, JID, handle, room
  idのようなproviderネイティブidは、generic SDK fieldではなく `target` 値またはprovider固有param内に保つ。

## Configバックドdirectory

configからdirectory entryを導出するpluginは、そのロジックを
plugin内に保ち、
`openclaw/plugin-sdk/directory-runtime` の共有helperを再利用すべきです。

これを使う場面は、channelが次のようなconfig-backed peer/groupを必要とする場合です:

- allowlist駆動のDM peer
- 設定済みchannel/group map
- account-scopedな静的directory fallback

`directory-runtime` の共有helperが扱うのは汎用操作だけです:

- query filtering
- limit適用
- deduping/normalization helper
- `ChannelDirectoryEntry[]` の構築

channel固有のaccount inspectionとid正規化は、
plugin実装内に残すべきです。

## Provider catalog

provider pluginは、
`registerProvider({ catalog: { run(...) { ... } } })` で推論用model catalogを定義できます。

`catalog.run(...)` は、OpenClawが `models.providers` に書き込むのと同じ形を返します:

- 1つのprovider entry向けの `{ provider }`
- 複数provider entry向けの `{ providers }`

provider固有のmodel id、base URLデフォルト、auth制御model metadataを
pluginが所有する場合は `catalog` を使ってください。

`catalog.order` は、pluginのcatalogがOpenClaw組み込みのimplicit providerと比べて
いつマージされるかを制御します:

- `simple`: プレーンなAPI-keyまたはenv駆動provider
- `profile`: auth profileが存在すると現れるprovider
- `paired`: 複数の関連provider entryを合成するprovider
- `late`: 他のimplicit providerの後の最終パス

後のproviderがキー衝突時に勝つので、pluginは同じprovider idを持つ
組み込みprovider entryを意図的に上書きできます。

互換性:

- `discovery` もレガシーaliasとして引き続き動作します
- `catalog` と `discovery` の両方が登録されている場合、OpenClawは `catalog` を使います

## Read-only channel inspection

pluginがchannelを登録する場合は、
`resolveAccount(...)` と並んで `plugin.config.inspectAccount(cfg, accountId)` の実装を推奨します。

理由:

- `resolveAccount(...)` はランタイム経路です。credentialが完全に
  materializeされている前提にでき、必要なsecretが欠けていれば即座に失敗して構いません。
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  repair flowのようなread-only command pathでは、
  単に設定を説明するためだけにランタイムcredentialをmaterializeする必要があってはなりません。

推奨される `inspectAccount(...)` 動作:

- 説明的なaccount stateだけを返す。
- `enabled` と `configured` を保持する。
- relevantな場合はcredential source/status fieldを含める:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- read-only
  availabilityを報告するためだけに生のtoken値を返す必要はありません。status系commandには
  `tokenStatus: "available"`（および対応するsource
  field）を返せば十分です。
- SecretRef経由でcredentialが設定されているが、
  現在のcommand pathでは利用できない場合は `configured_unavailable` を使います。

これにより、read-only commandは「configuredだがこのcommand pathではunavailable」と
報告でき、crashしたり、未設定と誤報したりしなくなります。

## Package pack

plugin directoryは、`openclaw.extensions` を持つ `package.json` を含められます:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

各entryが1つのpluginになります。packが複数extensionを列挙している場合、plugin id
は `name/<fileBase>` になります。

pluginがnpm依存をimportする場合は、そのdirectoryで依存をインストールして
`node_modules` を利用可能にしてください（`npm install` / `pnpm install`）。

セキュリティガードレール: すべての `openclaw.extensions` entryは、symlink解決後もplugin
directory内に留まる必要があります。package directoryを抜けるentryは
拒否されます。

セキュリティに関する注記: `openclaw plugins install` はplugin依存を
`npm install --omit=dev --ignore-scripts` でインストールします（lifecycle scriptなし、ランタイムでdev dependencyなし）。plugin依存
treeは「pure JS/TS」に保ち、`postinstall` buildが必要なpackageは避けてください。

任意: `openclaw.setupEntry` は軽量なsetup専用moduleを指せます。
無効なchannel pluginにsetupサーフェスが必要な場合や、
channel pluginが有効でもまだ未設定の場合、OpenClawは完全なplugin entryの代わりに `setupEntry`
を読み込みます。これにより、メインplugin entryがtool, hook, その他ランタイム専用
codeも配線している場合でも、起動とsetupを軽く保てます。

任意: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
を使うと、channel pluginはgatewayの
pre-listen startup phase中にも、channelがすでに設定済みであっても同じ `setupEntry` 経路へオプトインできます。

これを使うのは、gatewayがlisten開始前に存在している必要のある
startupサーフェスを `setupEntry` が完全にカバーしている場合だけにしてください。実際には、
setup entryが起動依存のすべてのchannel所有capabilityを登録している必要があります。たとえば:

- channel登録自体
- gatewayがlisten開始前に利用可能でなければならないHTTP route
- 同じwindow中に存在していなければならないgateway method, tool, service

full entryがなお必要なstartup capabilityを所有しているなら、このflagは有効にしないでください。
デフォルト動作のままにして、OpenClawに起動中full entryを読み込ませてください。

同梱channelは、full channel runtime読み込み前にcoreが参照できるsetup専用のcontract-surface helperも公開できます。現在のsetup
promotionサーフェスは次のとおりです:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

coreは、レガシーsingle-account channel
configを `channels.<id>.accounts.*` へ昇格させる必要があるとき、
full plugin entryを読み込まずにそのサーフェスを使います。
現在の同梱例はMatrixです。named accountがすでに存在する場合、auth/bootstrap keyだけを
名前付きpromoted accountへ移動し、
常に `accounts.default` を作るのではなく、設定済みの非canonicalなdefault-account keyを保持できます。

これらのsetup patch adapterは、同梱contract-surface discoveryをlazyに保ちます。import
timeは軽いままで、promotionサーフェスはmodule import時にbundled channel startupへ再入する代わりに、
初回使用時にだけ読み込まれます。

それらのstartupサーフェスにgateway RPC methodが含まれる場合は、
plugin固有prefixに保ってください。core admin namespace（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）は予約済みであり、pluginがより狭いscopeを要求しても、
常に `operator.admin` へ解決されます。

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

### Channel catalog metadata

channel pluginは `openclaw.channel` 経由でsetup/discovery metadataを、
`openclaw.install` 経由でinstall hintをadvertiseできます。これによりcore catalogをdata-freeに保てます。

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
      "blurb": "Webhook bot経由のセルフホスト型チャット、Nextcloud Talk。",
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

最小例以外で役立つ `openclaw.channel` field:

- `detailLabel`: より豊かなcatalog/statusサーフェス向けの二次label
- `docsLabel`: docs linkのlink textをoverrideする
- `preferOver`: このcatalog entryが上回るべき低優先のplugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selectionサーフェスのcopy制御
- `markdownCapable`: outbound formatting判断のため、そのchannelをmarkdown対応としてマークする
- `exposure.configured`: `false` に設定すると、configured-channel listingサーフェスからそのchannelを隠す
- `exposure.setup`: `false` に設定すると、interactive setup/configure pickerからそのchannelを隠す
- `exposure.docs`: docs navigationサーフェスで、そのchannelをinternal/privateとしてマークする
- `showConfigured` / `showInSetup`: レガシーaliasは互換性のため引き続き受理されますが、`exposure` を推奨します
- `quickstartAllowFrom`: そのchannelを標準quickstart `allowFrom` フローへオプトインさせる
- `forceAccountBinding`: 1アカウントしか存在しなくても明示的account bindingを必須にする
- `preferSessionLookupForAnnounceTarget`: announce target解決時にsession lookupを優先する

OpenClawは、**外部channel catalog**（たとえばMPM
registry export）もマージできます。JSON fileを次のいずれかに置いてください:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または `OPENCLAW_PLUGIN_CATALOG_PATHS`（または `OPENCLAW_MPM_CATALOG_PATHS`）を、
1つ以上のJSON file（カンマ/セミコロン/`PATH` 区切り）へ向けてください。各fileは
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` を
含む必要があります。parserは `"entries"` キーに対するレガシーaliasとして
`"packages"` または `"plugins"` も受け付けます。

## Context engine plugin

context engine pluginは、ingest, assembly,
compactionのためのsession context orchestrationを所有します。pluginから
`api.registerContextEngine(id, factory)` で登録し、アクティブengineは
`plugins.slots.contextEngine` で選択します。

単にmemory searchやhookを追加するのではなく、デフォルトcontext
pipelineを置き換えたり拡張したりしたい場合に使ってください。

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

engineがcompaction algorithmを**所有しない**場合でも、`compact()`
は実装して明示的に委譲してください:

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

## 新しいcapabilityの追加

pluginが現在のAPIに収まらない動作を必要とする場合、privateなreach-inで
plugin systemを回避しないでください。不足しているcapabilityを追加してください。

推奨手順:

1. core契約を定義する
   coreが何を所有すべきか決めます: policy, fallback, config merge,
   lifecycle, channel-facing semantics, runtime helper shape。
2. typedなplugin登録/runtimeサーフェスを追加する
   `OpenClawPluginApi` および/または `api.runtime` を、最小限有用な
   typed capabilityサーフェスで拡張します。
3. core + channel/feature consumerを配線する
   channelとfeature pluginは、新しいcapabilityをcore経由で消費すべきであり、
   vendor実装を直接importすべきではありません。
4. vendor実装を登録する
   その後でvendor pluginが、そのcapabilityに対してbackendを登録します。
5. 契約カバレッジを追加する
   ownershipと登録形状が時間とともに明示的であり続けるよう、testを追加します。

これが、OpenClawが1つの
providerの世界観にハードコードされずに、意見を持ち続ける方法です。具体的なfileチェックリストと実例については
[Capability Cookbook](/ja-JP/plugins/architecture) を参照してください。

### Capabilityチェックリスト

新しいcapabilityを追加するとき、実装では通常これらの
サーフェスをまとめて触るべきです:

- `src/<capability>/types.ts` 内のcore契約型
- `src/<capability>/runtime.ts` 内のcore runner/runtime helper
- `src/plugins/types.ts` 内のplugin API登録サーフェス
- `src/plugins/registry.ts` 内のplugin registry配線
- feature/channel
  pluginがそれを消費する必要がある場合の `src/plugins/runtime/*` 内のplugin runtime公開
- `src/test-utils/plugin-registration.ts` 内のcapture/test helper
- `src/plugins/contracts/registry.ts` 内のownership/contract assertion
- `docs/` 内のoperator/plugin docs

これらのサーフェスの1つが欠けているなら、それは通常、そのcapabilityが
まだ完全統合されていない兆候です。

### Capabilityテンプレート

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

// feature/channel plugin向け共有runtime helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契約testパターン:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

これでルールは単純です:

- coreがcapability contract + orchestrationを所有
- vendor pluginがvendor実装を所有
- feature/channel pluginがruntime helperを消費
- contract testがownershipを明示的に保つ

## 関連

- [Plugin architecture](/ja-JP/plugins/architecture) — 公開capability modelとshape
- [Plugin SDK subpaths](/ja-JP/plugins/sdk-subpaths)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
