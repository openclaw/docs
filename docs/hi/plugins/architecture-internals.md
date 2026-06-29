---
read_when:
    - प्रदाता रनटाइम हुक, चैनल जीवनचक्र, या पैकेज पैक लागू करना
    - Plugin लोड क्रम या रजिस्ट्री स्थिति की डीबगिंग
    - नई Plugin क्षमता या संदर्भ इंजन Plugin जोड़ना
summary: 'Plugin आर्किटेक्चर की आंतरिक संरचना: लोड पाइपलाइन, रजिस्ट्री, रनटाइम हुक्स, HTTP रूट्स, और संदर्भ तालिकाएँ'
title: Plugin आर्किटेक्चर की आंतरिक संरचना
x-i18n:
    generated_at: "2026-06-28T23:31:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

सार्वजनिक capability मॉडल, plugin आकारों और ownership/execution
contracts के लिए, [Plugin architecture](/hi/plugins/architecture) देखें। यह पेज
internal mechanics के लिए संदर्भ है: load pipeline, registry, runtime hooks,
Gateway HTTP routes, import paths, और schema tables।

## Load pipeline

Startup पर, OpenClaw मोटे तौर पर यह करता है:

1. candidate plugin roots खोजता है
2. native या compatible bundle manifests और package metadata पढ़ता है
3. unsafe candidates को reject करता है
4. plugin config (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`) को normalize करता है
5. हर candidate के लिए enablement तय करता है
6. enabled native modules load करता है: built bundled modules native loader का उपयोग करते हैं;
   third-party local source TypeScript emergency Jiti fallback का उपयोग करता है
7. native `register(api)` hooks call करता है और registrations को plugin registry में collect करता है
8. registry को commands/runtime surfaces पर expose करता है

<Note>
`activate`, `register` का legacy alias है — loader जो भी मौजूद हो (`def.register ?? def.activate`) उसे resolve करता है और उसी point पर call करता है। सभी bundled plugins `register` का उपयोग करते हैं; नए plugins के लिए `register` को प्राथमिकता दें।
</Note>

Safety gates runtime execution से **पहले** होते हैं। Candidates तब block किए जाते हैं
जब entry plugin root से बाहर निकलती है, path world-writable होता है, या path
ownership non-bundled plugins के लिए suspicious दिखता है।

Blocked candidates diagnostics के लिए अपने plugin id से जुड़े रहते हैं। अगर config
अब भी उस id को reference करता है, validation plugin को present but blocked के रूप में report करता है
और config entry को stale मानने के बजाय path-safety warning की ओर point करता है।

### Manifest-first behavior

Manifest control-plane source of truth है। OpenClaw इसका उपयोग करता है:

- plugin की पहचान करने के लिए
- declared channels/skills/config schema या bundle capabilities खोजने के लिए
- `plugins.entries.<id>.config` validate करने के लिए
- Control UI labels/placeholders augment करने के लिए
- install/catalog metadata दिखाने के लिए
- plugin runtime load किए बिना cheap activation और setup descriptors preserve करने के लिए

Native plugins के लिए, runtime module data-plane part है। यह hooks, tools,
commands, या provider flows जैसे actual behavior register करता है।

Optional manifest `activation` और `setup` blocks control plane पर रहते हैं।
वे activation planning और setup discovery के लिए metadata-only descriptors हैं;
वे runtime registration, `register(...)`, या `setupEntry` को replace नहीं करते।
पहले live activation consumers अब manifest command, channel, और provider hints का उपयोग करते हैं
ताकि broader registry materialization से पहले plugin loading को narrow किया जा सके:

- CLI loading उन plugins तक narrow होती है जो requested primary command के owner हैं
- channel setup/plugin resolution उन plugins तक narrow होता है जो requested
  channel id के owner हैं
- explicit provider setup/runtime resolution उन plugins तक narrow होता है जो requested
  provider id के owner हैं
- Gateway startup planning explicit startup imports और startup opt-outs के लिए
  `activation.onStartup` का उपयोग करती है; startup metadata के बिना plugins केवल
  narrower activation triggers के through load होते हैं

Request-time runtime preloads जो broad `all` scope मांगते हैं, वे अब भी config,
startup planning, configured channels, slots, और auto-enable rules से explicit
effective plugin id set derive करते हैं। अगर वह derived set empty है, OpenClaw
हर discoverable plugin तक widen करने के बजाय empty runtime registry load करता है।

Activation planner existing callers के लिए ids-only API और नए diagnostics के लिए
plan API, दोनों expose करता है। Plan entries report करती हैं कि plugin क्यों selected हुआ,
explicit `activation.*` planner hints को manifest ownership
fallback जैसे `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, और hooks से अलग करते हुए। यह reason split compatibility boundary है:
existing plugin metadata काम करता रहता है, जबकि नया code runtime loading semantics बदले बिना
broad hints या fallback behavior detect कर सकता है।

Setup discovery अब `setup.providers` और `setup.cliBackends` जैसे descriptor-owned ids को
prefer करती है ताकि candidate plugins को narrow किया जा सके, इससे पहले कि वह उन plugins के लिए
`setup-api` पर fallback करे जिन्हें अब भी setup-time runtime hooks चाहिए। Provider
setup lists manifest `providerAuthChoices`, descriptor-derived setup
choices, और install-catalog metadata का उपयोग करती हैं, provider runtime load किए बिना। Explicit
`setup.requiresRuntime: false` descriptor-only cutoff है; omitted
`requiresRuntime` compatibility के लिए legacy setup-api fallback रखता है। अगर एक से अधिक
discovered plugin समान normalized setup provider या CLI backend id claim करते हैं,
setup lookup discovery order पर rely करने के बजाय ambiguous owner को refuse करता है।
जब setup runtime execute होता है, registry diagnostics `setup.providers` / `setup.cliBackends`
और setup-api द्वारा registered providers या CLI backends के बीच drift report करते हैं,
legacy plugins को block किए बिना।

### Plugin cache boundary

OpenClaw plugin discovery results या direct manifest registry data को wall-clock windows के पीछे
cache नहीं करता। Installs, manifest edits, और load-path changes अगले explicit metadata read या
snapshot rebuild पर visible होने चाहिए। Manifest file parser opened manifest path,
inode, size, और timestamps से keyed bounded file-signature cache रख सकता है; वह cache केवल
unchanged bytes को re-parse करने से बचाता है और discovery, registry, owner, या
policy answers cache नहीं करना चाहिए।

Safe metadata fast path explicit object ownership है, hidden cache नहीं।
Gateway startup hot paths को current `PluginMetadataSnapshot`, derived
`PluginLookUpTable`, या explicit manifest registry को call chain के through pass करना चाहिए।
Config validation, startup auto-enable, plugin bootstrap, और provider
selection उन objects को reuse कर सकते हैं जब तक वे current config और
plugin inventory को represent करते हैं। Setup lookup अब भी demand पर manifest metadata
reconstruct करता है, जब तक specific setup path को explicit manifest registry न मिले; इसे
hidden lookup caches जोड़ने के बजाय cold-path fallback के रूप में रखें। जब input
बदले, snapshot को mutate करने या historical copies रखने के बजाय rebuild और replace करें।
Active plugin registry पर views और bundled channel bootstrap helpers
current registry/root से recompute किए जाने चाहिए। Short-lived maps एक call के अंदर
work dedupe करने या reentry guard करने के लिए ठीक हैं; वे process
metadata caches नहीं बनने चाहिए।

Plugin loading के लिए, persistent cache layer runtime loading है। यह loader state reuse कर सकता है
जब code या installed artifacts वास्तव में load हों, जैसे:

- `PluginLoaderCacheState` और compatible active runtime registries
- jiti/module caches और public-surface loader caches, जिनका उपयोग same runtime surface को
  बार-बार import करने से बचने के लिए होता है
- installed plugin artifacts के लिए filesystem caches
- path normalization या duplicate resolution के लिए short-lived per-call maps

वे caches data-plane implementation details हैं। उन्हें control-plane सवालों का जवाब नहीं देना चाहिए
जैसे "कौन सा plugin इस provider का owner है?" जब तक caller ने जानबूझकर runtime loading न मांगा हो।

इनके लिए persistent या wall-clock caches न जोड़ें:

- discovery results
- direct manifest registries
- installed plugin index से reconstructed manifest registries
- provider owner lookup, model suppression, provider policy, या public-artifact
  metadata
- कोई भी अन्य manifest-derived answer जहां बदला हुआ manifest, installed index,
  या load path अगले metadata read पर visible होना चाहिए

Callers जो persisted installed plugin index से manifest metadata rebuild करते हैं
वे उस registry को demand पर reconstruct करते हैं। Installed index durable
source-plane state है; यह hidden in-process metadata cache नहीं है।

## Registry model

Loaded plugins random core globals को सीधे mutate नहीं करते। वे central plugin registry में
register करते हैं।

Registry track करती है:

- plugin records (identity, source, origin, status, diagnostics)
- tools
- legacy hooks और typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin-owned commands

Core features फिर plugin modules से सीधे बात करने के बजाय उस registry से read करती हैं।
इससे loading one-way रहती है:

- plugin module -> registry registration
- core runtime -> registry consumption

यह separation maintainability के लिए मायने रखता है। इसका मतलब है कि अधिकतर core surfaces को केवल
एक integration point चाहिए: "registry read करें", न कि "हर plugin module को special-case करें"।

## Conversation binding callbacks

Conversation bind करने वाले plugins approval resolve होने पर react कर सकते हैं।

Bind request approved या denied होने के बाद callback receive करने के लिए
`api.onConversationBindingResolved(...)` का उपयोग करें:

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

- `status`: `"approved"` या `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, या `"deny"`
- `binding`: approved requests के लिए resolved binding
- `request`: original request summary, detach hint, sender id, और
  conversation metadata

यह callback notification-only है। यह नहीं बदलता कि conversation bind करने की अनुमति किसे है,
और यह core approval handling finish होने के बाद run होता है।

## Provider runtime hooks

Provider plugins की तीन layers होती हैं:

- cheap pre-runtime lookup के लिए **Manifest metadata**:
  `setup.providers[].envVars`, deprecated compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, और `channelEnvVars`।
- **Config-time hooks**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`।
- **Runtime hooks**: auth, model resolution,
  stream wrapping, thinking levels, replay policy, और usage endpoints cover करने वाले 40+ optional hooks। पूरी list
  [Hook order and usage](#hook-order-and-usage) के तहत देखें।

OpenClaw अब भी generic agent loop, failover, transcript handling, और
tool policy का owner है। ये hooks provider-specific
behavior के लिए extension surface हैं, बिना whole custom inference transport की जरूरत के।

जब provider के पास env-based credentials हों जिन्हें generic auth/status/model-picker paths को
plugin runtime load किए बिना देखना चाहिए, manifest `setup.providers[].envVars` का उपयोग करें।
Deprecated `providerAuthEnvVars` अब भी deprecation window के दौरान
compatibility adapter द्वारा read किया जाता है, और इसका उपयोग करने वाले non-bundled plugins
manifest diagnostic receive करते हैं। जब एक provider id को दूसरे provider id के env vars,
auth profiles, config-backed auth, और API-key onboarding choice reuse करना चाहिए, manifest
`providerAuthAliases` का उपयोग करें। जब onboarding/auth-choice CLI surfaces को provider की
choice id, group labels, और simple one-flag auth wiring जाननी चाहिए
provider runtime load किए बिना, manifest `providerAuthChoices` का उपयोग करें। Provider runtime
`envVars` को operator-facing hints जैसे onboarding labels या OAuth
client-id/client-secret setup vars के लिए रखें।

जब channel में env-driven auth या setup हो जिसे generic shell-env fallback,
config/status checks, या setup prompts को channel runtime load किए बिना देखना चाहिए,
manifest `channelEnvVars` का उपयोग करें।

### Hook order and usage

Model/provider plugins के लिए, OpenClaw hooks को इस rough order में call करता है।
"When to use" column quick decision guide है।
Compatibility-only provider fields जिन्हें OpenClaw अब call नहीं करता, जैसे
`ProviderPlugin.capabilities` और `suppressBuiltInModel`, जानबूझकर यहां
listed नहीं हैं।

| #   | हुक                               | यह क्या करता है                                                                                                      | कब उपयोग करें                                                                                                                                       |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` जनरेशन के दौरान प्रदाता कॉन्फ़िग को `models.providers` में प्रकाशित करता है                            | प्रदाता किसी कैटलॉग या बेस URL डिफ़ॉल्ट का स्वामी है                                                                                                |
| 2   | `applyConfigDefaults`             | कॉन्फ़िग मटेरियलाइज़ेशन के दौरान प्रदाता-स्वामित्व वाले वैश्विक कॉन्फ़िग डिफ़ॉल्ट लागू करता है                       | डिफ़ॉल्ट auth मोड, env, या प्रदाता मॉडल-फ़ैमिली सेमांटिक्स पर निर्भर करते हैं                                                                        |
| --  | _(अंतर्निहित मॉडल लुकअप)_         | OpenClaw पहले सामान्य रजिस्ट्री/कैटलॉग पथ आज़माता है                                                                 | _(Plugin हुक नहीं)_                                                                                                                                 |
| 3   | `normalizeModelId`                | लुकअप से पहले लेगेसी या प्रीव्यू model-id aliases को सामान्य करता है                                                  | कैननिकल मॉडल रिज़ॉल्यूशन से पहले प्रदाता alias cleanup का स्वामी है                                                                                  |
| 4   | `normalizeTransport`              | सामान्य मॉडल असेंबली से पहले प्रदाता-फ़ैमिली `api` / `baseUrl` को सामान्य करता है                                    | प्रदाता उसी ट्रांसपोर्ट फ़ैमिली में कस्टम प्रदाता ids के लिए ट्रांसपोर्ट cleanup का स्वामी है                                                         |
| 5   | `normalizeConfig`                 | runtime/provider resolution से पहले `models.providers.<id>` को सामान्य करता है                                       | प्रदाता को ऐसी कॉन्फ़िग cleanup चाहिए जो plugin के साथ रहे; bundled Google-family helpers समर्थित Google कॉन्फ़िग entries का backstop भी करते हैं   |
| 6   | `applyNativeStreamingUsageCompat` | कॉन्फ़िग प्रदाताओं पर native streaming-usage compat rewrites लागू करता है                                             | प्रदाता को endpoint-driven native streaming usage metadata fixes चाहिए                                                                              |
| 7   | `resolveConfigApiKey`             | runtime auth loading से पहले कॉन्फ़िग प्रदाताओं के लिए env-marker auth resolve करता है                               | प्रदाता अपने env-marker API-key resolution hooks उजागर करते हैं                                                                                     |
| 8   | `resolveSyntheticAuth`            | plaintext persist किए बिना local/self-hosted या config-backed auth सतह पर लाता है                                    | प्रदाता synthetic/local credential marker के साथ काम कर सकता है                                                                                     |
| 9   | `resolveExternalAuthProfiles`     | प्रदाता-स्वामित्व वाली external auth profiles overlay करता है; CLI/app-owned creds के लिए डिफ़ॉल्ट `persistence` `runtime-only` है | प्रदाता कॉपी किए गए refresh tokens persist किए बिना external auth credentials दोबारा उपयोग करता है; manifest में `contracts.externalAuthProviders` घोषित करें |
| 10  | `shouldDeferSyntheticProfileAuth` | env/config-backed auth के पीछे stored synthetic profile placeholders को कम प्राथमिकता देता है                        | प्रदाता synthetic placeholder profiles stored करता है जिन्हें precedence नहीं जीतनी चाहिए                                                           |
| 11  | `resolveDynamicModel`             | local registry में अभी न होने वाले प्रदाता-स्वामित्व वाले model ids के लिए sync fallback                             | प्रदाता मनमाने upstream model ids स्वीकार करता है                                                                                                  |
| 12  | `prepareDynamicModel`             | Async warm-up, फिर `resolveDynamicModel` फिर से चलता है                                                              | प्रदाता को unknown ids resolve करने से पहले network metadata चाहिए                                                                                  |
| 13  | `normalizeResolvedModel`          | embedded runner द्वारा resolved model उपयोग करने से पहले अंतिम rewrite                                               | प्रदाता को transport rewrites चाहिए लेकिन फिर भी core transport उपयोग करता है                                                                       |
| 14  | `normalizeToolSchemas`            | embedded runner के देखने से पहले tool schemas को सामान्य करता है                                                     | प्रदाता को transport-family schema cleanup चाहिए                                                                                                   |
| 15  | `inspectToolSchemas`              | normalization के बाद प्रदाता-स्वामित्व वाले schema diagnostics सतह पर लाता है                                        | प्रदाता core को provider-specific rules सिखाए बिना keyword warnings चाहता है                                                                        |
| 16  | `resolveReasoningOutputMode`      | native बनाम tagged reasoning-output contract चुनता है                                                               | प्रदाता को native fields के बजाय tagged reasoning/final output चाहिए                                                                                |
| 17  | `prepareExtraParams`              | generic stream option wrappers से पहले request-param normalization                                                   | प्रदाता को default request params या per-provider param cleanup चाहिए                                                                               |
| 18  | `createStreamFn`                  | normal stream path को custom transport से पूरी तरह बदलता है                                                          | प्रदाता को केवल wrapper नहीं, custom wire protocol चाहिए                                                                                            |
| 20  | `wrapStreamFn`                    | generic wrappers लागू होने के बाद stream wrapper                                                                     | प्रदाता को custom transport के बिना request headers/body/model compat wrappers चाहिए                                                                |
| 21  | `resolveTransportTurnState`       | native per-turn transport headers या metadata जोड़ता है                                                              | प्रदाता चाहता है कि generic transports provider-native turn identity भेजें                                                                          |
| 22  | `resolveWebSocketSessionPolicy`   | native WebSocket headers या session cool-down policy जोड़ता है                                                       | प्रदाता चाहता है कि generic WS transports session headers या fallback policy tune करें                                                             |
| 23  | `formatApiKey`                    | Auth-profile formatter: stored profile runtime `apiKey` string बन जाता है                                            | प्रदाता extra auth metadata stored करता है और उसे custom runtime token shape चाहिए                                                                  |
| 24  | `refreshOAuth`                    | custom refresh endpoints या refresh-failure policy के लिए OAuth refresh override                                     | प्रदाता shared OpenClaw refreshers में फिट नहीं बैठता                                                                                               |
| 25  | `buildAuthDoctorHint`             | OAuth refresh विफल होने पर जोड़ा गया repair hint                                                                     | प्रदाता को refresh failure के बाद provider-owned auth repair guidance चाहिए                                                                         |
| 26  | `matchesContextOverflowError`     | प्रदाता-स्वामित्व वाला context-window overflow matcher                                                               | प्रदाता के पास raw overflow errors हैं जिन्हें generic heuristics चूक जाएँगी                                                                        |
| 27  | `classifyFailoverReason`          | प्रदाता-स्वामित्व वाला failover reason classification                                                                | प्रदाता raw API/transport errors को rate-limit/overload/etc में map कर सकता है                                                                      |
| 28  | `isCacheTtlEligible`              | proxy/backhaul प्रदाताओं के लिए prompt-cache policy                                                                  | प्रदाता को proxy-specific cache TTL gating चाहिए                                                                                                   |
| 29  | `buildMissingAuthMessage`         | generic missing-auth recovery message का replacement                                                                 | प्रदाता को provider-specific missing-auth recovery hint चाहिए                                                                                       |
| 30  | `augmentModelCatalog`             | discovery के बाद synthetic/final catalog rows जोड़ी जाती हैं                                                         | प्रदाता को `models list` और pickers में synthetic forward-compat rows चाहिए                                                                         |
| 31  | `resolveThinkingProfile`          | Model-specific `/think` level set, display labels, और default                                                        | प्रदाता selected models के लिए custom thinking ladder या binary label उजागर करता है                                                                |
| 32  | `isBinaryThinking`                | On/off reasoning toggle compatibility hook                                                                           | प्रदाता केवल binary thinking on/off उजागर करता है                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` reasoning support compatibility hook                                                                         | प्रदाता केवल models के subset पर `xhigh` चाहता है                                                                                                  |
| 34  | `resolveDefaultThinkingLevel`     | Default `/think` level compatibility hook                                                                            | प्रदाता model family के लिए default `/think` policy का स्वामी है                                                                                    |
| 35  | `isModernModelRef`                | live profile filters और smoke selection के लिए modern-model matcher                                                  | प्रदाता live/smoke preferred-model matching का स्वामी है                                                                                            |
| 36  | `prepareRuntimeAuth`              | inference से ठीक पहले configured credential को actual runtime token/key में exchange करता है                         | प्रदाता को token exchange या short-lived request credential चाहिए                                                                                   |
| 37  | `resolveUsageAuth`                | `/usage` और संबंधित status surfaces के लिए usage/billing credentials resolve करता है                                 | प्रदाता को custom usage/quota token parsing या अलग usage credential चाहिए                                                                          |
| 38  | `fetchUsageSnapshot`              | auth हल होने के बाद provider-विशिष्ट उपयोग/quota snapshots प्राप्त करें और सामान्यीकृत करें                             | Provider को provider-विशिष्ट उपयोग endpoint या payload parser चाहिए                                                                           |
| 39  | `createEmbeddingProvider`         | memory/search के लिए provider-स्वामित्व वाला embedding adapter बनाएं                                                     | Memory embedding व्यवहार provider plugin के साथ रहता है                                                                                    |
| 40  | `buildReplayPolicy`               | provider के लिए transcript handling नियंत्रित करने वाली replay policy लौटाएं                                        | Provider को custom transcript policy चाहिए (उदाहरण के लिए, thinking-block stripping)                                                               |
| 41  | `sanitizeReplayHistory`           | generic transcript cleanup के बाद replay history फिर से लिखें                                                        | Provider को shared compaction helpers से आगे provider-विशिष्ट replay rewrites चाहिए                                                             |
| 42  | `validateReplayTurns`             | embedded runner से पहले अंतिम replay-turn validation या reshaping करें                                           | Provider transport को generic sanitation के बाद सख्त turn validation चाहिए                                                                    |
| 43  | `onModelSelected`                 | provider-स्वामित्व वाले post-selection side effects चलाएं                                                                 | model सक्रिय होने पर provider को telemetry या provider-स्वामित्व वाला state चाहिए                                                                  |

`normalizeModelId`, `normalizeTransport`, और `normalizeConfig` पहले
मिलान हुए provider plugin की जांच करते हैं, फिर दूसरे hook-सक्षम provider plugins से होकर आगे बढ़ते हैं
जब तक कोई वास्तव में model id या transport/config नहीं बदलता। इससे
alias/compat provider shims काम करते रहते हैं, बिना caller से यह जानने की अपेक्षा किए कि कौन सा
bundled plugin rewrite का स्वामी है। यदि कोई provider hook समर्थित
Google-family config entry को rewrite नहीं करता, तो bundled Google config normalizer फिर भी
वह compatibility cleanup लागू करता है।

यदि provider को पूरी तरह custom wire protocol या custom request executor चाहिए,
तो वह extension की अलग श्रेणी है। ये hooks उस provider behavior के लिए हैं
जो अभी भी OpenClaw के normal inference loop पर चलता है।

`resolveUsageAuth` तय करता है कि OpenClaw को `fetchUsageSnapshot` को call करना चाहिए या
usage/status surfaces के लिए generic credential resolution पर fall back करना चाहिए। जब
provider के पास usage credential हो तो `{ token, accountId? }` return करें, जब provider-owned usage auth ने request handle कर ली हो और
generic API-key/OAuth fallback को दबाना आवश्यक हो तो `{ handled: true }` return करें, और
जब provider ने usage auth handle नहीं किया हो तो `null` या `undefined` return करें।

### Provider उदाहरण

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

### अंतर्निहित उदाहरण

Bundled provider plugins ऊपर दिए गए hooks को मिलाकर प्रत्येक vendor के catalog,
auth, thinking, replay, और usage needs के अनुरूप बनाते हैं। आधिकारिक hook set
प्रत्येक plugin के साथ `extensions/` के तहत रहता है; यह page list को mirror करने के बजाय
आकृतियों को दिखाता है।

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI `catalog` के साथ
    `resolveDynamicModel` / `prepareDynamicModel` register करते हैं ताकि वे OpenClaw के static catalog से पहले upstream
    model ids दिखा सकें।
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai
    token exchange और `/usage` integration का स्वामित्व लेने के लिए
    `prepareRuntimeAuth` या `formatApiKey` को `resolveUsageAuth` +
    `fetchUsageSnapshot` के साथ pair करते हैं।
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Shared named families (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) providers को
    प्रत्येक plugin द्वारा cleanup को फिर से implement करने के बजाय
    `buildReplayPolicy` के माध्यम से transcript policy में opt in करने देती हैं।
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, और
    `volcengine` सिर्फ `catalog` register करते हैं और shared inference loop का उपयोग करते हैं।
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier`, और `context1m`
    generic SDK के बजाय Anthropic plugin के public `api.ts` / `contract-api.ts` seam
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) के अंदर रहते हैं।
  </Accordion>
</AccordionGroup>

## Runtime helpers

Plugins `api.runtime` के माध्यम से चुने हुए core helpers access कर सकते हैं। TTS के लिए:

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

नोट्स:

- `textToSpeech` file/voice-note surfaces के लिए सामान्य core TTS output payload return करता है।
- core `messages.tts` configuration और provider selection का उपयोग करता है।
- PCM audio buffer + sample rate return करता है। Plugins को providers के लिए resample/encode करना होगा।
- `listVoices` प्रत्येक provider के लिए optional है। vendor-owned voice pickers या setup flows के लिए इसका उपयोग करें।
- Voice listings में provider-aware pickers के लिए locale, gender, और personality tags जैसे अधिक समृद्ध metadata शामिल हो सकते हैं।
- OpenAI और ElevenLabs आज telephony support करते हैं। Microsoft नहीं करता।

Plugins `api.registerSpeechProvider(...)` के माध्यम से speech providers भी register कर सकते हैं।

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

नोट्स:

- TTS policy, fallback, और reply delivery को core में रखें।
- vendor-owned synthesis behavior के लिए speech providers का उपयोग करें।
- Legacy Microsoft `edge` input को `microsoft` provider id में normalize किया जाता है।
- पसंदीदा ownership model company-oriented है: OpenClaw द्वारा ये
  capability contracts जोड़ने पर एक vendor plugin text, speech, image, और future media providers का स्वामी हो सकता है।

image/audio/video understanding के लिए, plugins generic key/value bag के बजाय एक typed
media-understanding provider register करते हैं:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

नोट्स:

- orchestration, fallback, config, और channel wiring को core में रखें।
- vendor behavior को provider plugin में रखें।
- Additive expansion typed रहनी चाहिए: new optional methods, new optional
  result fields, new optional capabilities।
- Video generation पहले से वही pattern follow करता है:
  - core capability contract और runtime helper का स्वामी है
  - vendor plugins `api.registerVideoGenerationProvider(...)` register करते हैं
  - feature/channel plugins `api.runtime.videoGeneration.*` consume करते हैं

media-understanding runtime helpers के लिए, plugins call कर सकते हैं:

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

audio transcription के लिए, plugins media-understanding runtime या पुराने STT alias में से किसी का भी उपयोग कर सकते हैं:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

नोट्स:

- `api.runtime.mediaUnderstanding.*` image/audio/video understanding के लिए पसंदीदा shared surface है।
- `extractStructuredWithModel(...)` bounded
  provider-owned image-first extraction के लिए plugin-facing seam है। कम से कम एक image input शामिल करें;
  text inputs supplemental context हैं।
  product plugins अपने routes और schemas के स्वामी होते हैं जबकि OpenClaw
  provider/runtime boundary का स्वामी होता है।
- core media-understanding audio configuration (`tools.media.audio`) और provider fallback order का उपयोग करता है।
- जब कोई transcription output produce नहीं होता (उदाहरण के लिए skipped/unsupported input), तो `{ text: undefined }` return करता है।
- `api.runtime.stt.transcribeAudioFile(...)` compatibility alias के रूप में बना रहता है।

Plugins `api.runtime.subagent` के माध्यम से background subagent runs भी launch कर सकते हैं:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

नोट्स:

- `provider` और `model` optional per-run overrides हैं, persistent session changes नहीं।
- OpenClaw उन override fields को केवल trusted callers के लिए honor करता है।
- plugin-owned fallback runs के लिए, operators को `plugins.entries.<id>.subagent.allowModelOverride: true` के साथ opt in करना होगा।
- trusted plugins को specific canonical `provider/model` targets तक restrict करने के लिए `plugins.entries.<id>.subagent.allowedModels` का उपयोग करें, या किसी भी target को स्पष्ट रूप से allow करने के लिए `"*"` का उपयोग करें।
- Untrusted plugin subagent runs फिर भी काम करते हैं, लेकिन override requests को silently fall back करने के बजाय reject किया जाता है।
- Plugin-created subagent sessions को creating plugin id से tag किया जाता है। Fallback `api.runtime.subagent.deleteSession(...)` केवल उन owned sessions को delete कर सकता है; arbitrary session deletion के लिए अभी भी admin-scoped Gateway request आवश्यक है।

web search के लिए, plugins agent tool wiring में जाने के बजाय
shared runtime helper consume कर सकते हैं:

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

Plugins `api.registerWebSearchProvider(...)` के माध्यम से web-search providers भी register कर सकते हैं।

नोट्स:

- provider selection, credential resolution, और shared request semantics को core में रखें।
- vendor-specific search transports के लिए web-search providers का उपयोग करें।
- `api.runtime.webSearch.*` उन feature/channel plugins के लिए पसंदीदा shared surface है जिन्हें agent tool wrapper पर निर्भर हुए बिना search behavior चाहिए।

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

- `generate(...)`: configured image-generation provider chain का उपयोग करके image generate करें।
- `listProviders(...)`: उपलब्ध image-generation providers और उनकी capabilities list करें।

## Gateway HTTP routes

Plugins `api.registerHttpRoute(...)` के साथ HTTP endpoints expose कर सकते हैं।

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

Route fields:

- `path`: Gateway HTTP सर्वर के अंतर्गत route path.
- `auth`: आवश्यक. सामान्य Gateway auth की आवश्यकता के लिए `"gateway"` का उपयोग करें, या Plugin-प्रबंधित auth/webhook सत्यापन के लिए `"plugin"`।
- `match`: वैकल्पिक. `"exact"` (डिफ़ॉल्ट) या `"prefix"`।
- `replaceExisting`: वैकल्पिक. उसी Plugin को अपने मौजूदा route registration को बदलने की अनुमति देता है।
- `handler`: जब route ने request को संभाल लिया हो तो `true` लौटाएँ।

नोट्स:

- `api.registerHttpHandler(...)` हटा दिया गया था और इससे plugin-load error होगा। इसके बजाय `api.registerHttpRoute(...)` का उपयोग करें।
- Plugin routes को `auth` स्पष्ट रूप से घोषित करना होगा।
- Exact `path + match` टकराव अस्वीकार किए जाते हैं, जब तक `replaceExisting: true` न हो, और एक Plugin किसी दूसरे Plugin के route को बदल नहीं सकता।
- अलग-अलग `auth` levels वाले overlapping routes अस्वीकार किए जाते हैं। `exact`/`prefix` fallthrough chains को केवल उसी auth level पर रखें।
- `auth: "plugin"` routes को operator runtime scopes अपने-आप नहीं मिलते। वे Plugin-प्रबंधित webhooks/signature verification के लिए हैं, privileged Gateway helper calls के लिए नहीं।
- `auth: "gateway"` routes Gateway request runtime scope के अंदर चलते हैं, लेकिन वह scope जानबूझकर conservative है:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) plugin-route runtime scopes को `operator.write` पर pinned रखता है, भले ही caller `x-openclaw-scopes` भेजे
  - trusted identity-bearing HTTP modes (उदाहरण के लिए private ingress पर `trusted-proxy` या `gateway.auth.mode = "none"`) `x-openclaw-scopes` को केवल तब मानते हैं जब header स्पष्ट रूप से मौजूद हो
  - अगर उन identity-bearing plugin-route requests पर `x-openclaw-scopes` अनुपस्थित है, तो runtime scope वापस `operator.write` पर चला जाता है
- व्यावहारिक नियम: यह न मानें कि gateway-auth Plugin route implicit admin surface है। अगर आपके route को admin-only behavior चाहिए, तो identity-bearing auth mode की आवश्यकता रखें और explicit `x-openclaw-scopes` header contract को दस्तावेज़ित करें।

## Plugin SDK import paths

नए Plugins लिखते समय monolithic `openclaw/plugin-sdk` root
barrel के बजाय narrow SDK subpaths का उपयोग करें। Core subpaths:

| Subpath                             | उद्देश्य                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin registration primitives                     |
| `openclaw/plugin-sdk/channel-core`  | Channel entry/build helpers                        |
| `openclaw/plugin-sdk/core`          | Generic shared helpers और umbrella contract        |
| `openclaw/plugin-sdk/config-schema` | Root `openclaw.json` Zod schema (`OpenClawSchema`) |

Channel plugins narrow seams के परिवार से चुनते हैं — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, और `channel-actions`। Approval behavior को असंबंधित
Plugin fields में मिलाने के बजाय एक `approvalCapability` contract पर consolidate करना चाहिए।
देखें [Channel plugins](/hi/plugins/sdk-channel-plugins).

Runtime और config helpers matching focused `*-runtime` subpaths
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, आदि) के अंतर्गत रहते हैं। Broad `config-runtime`
compatibility barrel के बजाय `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, और `config-mutation`
को प्राथमिकता दें।

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
छोटे channel helper facades, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
और `openclaw/plugin-sdk/infra-runtime` पुराने Plugins के लिए deprecated compatibility shims हैं।
नए code को इसके बजाय narrower generic primitives import करने चाहिए।
</Info>

Repo-internal entry points (प्रति bundled Plugin package root):

- `index.js` — bundled Plugin entry
- `api.js` — helper/types barrel
- `runtime-api.js` — runtime-only barrel
- `setup-entry.js` — setup Plugin entry

External plugins को केवल `openclaw/plugin-sdk/*` subpaths import करने चाहिए। Core से या किसी दूसरे Plugin से
किसी दूसरे Plugin package का `src/*` कभी import न करें।
Facade-loaded entry points active runtime config snapshot को प्राथमिकता देते हैं जब वह
मौजूद हो, फिर disk पर resolved config file पर fall back करते हैं।

`image-generation`, `media-understanding`,
और `speech` जैसे capability-specific subpaths मौजूद हैं क्योंकि bundled Plugins आज उनका उपयोग करते हैं। वे
अपने-आप long-term frozen external contracts नहीं हैं — उन पर निर्भर करते समय संबंधित SDK
reference page देखें।

## Message tool schemas

Plugins को reactions, reads, और polls जैसे non-message primitives के लिए channel-specific `describeMessageTool(...)` schema
contributions का स्वामित्व रखना चाहिए।
Shared send presentation को provider-native button, component, block, या card fields के बजाय generic `MessagePresentation` contract
का उपयोग करना चाहिए।
Contract, fallback rules, provider mapping, और Plugin author checklist के लिए
[Message Presentation](/hi/plugins/message-presentation) देखें।

Send-capable plugins message capabilities के माध्यम से बताते हैं कि वे क्या render कर सकते हैं:

- semantic presentation blocks (`text`, `context`, `divider`, `buttons`, `select`) के लिए `presentation`
- pinned-delivery requests के लिए `delivery-pin`

Core तय करता है कि presentation को natively render करना है या उसे text में degrade करना है।
Generic message tool से provider-native UI escape hatches expose न करें।
Legacy native schemas के लिए deprecated SDK helpers मौजूदा third-party Plugins के लिए exported रहते हैं,
लेकिन नए Plugins को उनका उपयोग नहीं करना चाहिए।

## Channel target resolution

Channel plugins को channel-specific target semantics का स्वामित्व रखना चाहिए। Shared
outbound host को generic रखें और provider rules के लिए messaging adapter surface का उपयोग करें:

- `messaging.inferTargetChatType({ to })` directory lookup से पहले तय करता है कि normalized target
  को `direct`, `group`, या `channel` के रूप में माना जाना चाहिए।
- `messaging.targetResolver.looksLikeId(raw, normalized)` Core को बताता है कि
  input को directory search के बजाय सीधे id-like resolution पर जाना चाहिए या नहीं।
- `messaging.targetResolver.reservedLiterals` उन bare words को list करता है जो
  उस provider के लिए channel/session references हैं। Resolution reserved literals को reject करने से पहले configured
  directory entries को preserve करता है, फिर directory miss पर fail closed करता है।
- `messaging.targetResolver.resolveTarget(...)` Plugin fallback है जब
  Core को normalization के बाद या directory miss के बाद अंतिम provider-owned resolution चाहिए।
- `messaging.resolveOutboundSessionRoute(...)` target resolved होने के बाद provider-specific session
  route construction का स्वामित्व रखता है।

अनुशंसित विभाजन:

- उन category decisions के लिए `inferTargetChatType` का उपयोग करें जो
  peers/groups खोजने से पहले होने चाहिए।
- "इसे explicit/native target id के रूप में मानें" checks के लिए `looksLikeId` का उपयोग करें।
- provider-specific normalization fallback के लिए `resolveTarget` का उपयोग करें, broad directory search के लिए नहीं।
- chat ids, thread ids, JIDs, handles, और room
  ids जैसे provider-native ids को generic SDK
  fields में नहीं, बल्कि `target` values या provider-specific params के अंदर रखें।

## Config-backed directories

जो Plugins config से directory entries derive करते हैं, उन्हें वह logic
Plugin में रखना चाहिए और
`openclaw/plugin-sdk/directory-runtime` से shared helpers reuse करने चाहिए।

इसका उपयोग तब करें जब किसी channel को config-backed peers/groups चाहिए, जैसे:

- allowlist-driven DM peers
- configured channel/group maps
- account-scoped static directory fallbacks

`directory-runtime` में shared helpers केवल generic operations संभालते हैं:

- query filtering
- limit application
- deduping/normalization helpers
- `ChannelDirectoryEntry[]` बनाना

Channel-specific account inspection और id normalization को
Plugin implementation में ही रहना चाहिए।

## Provider catalogs

Provider plugins inference के लिए model catalogs को
`registerProvider({ catalog: { run(...) { ... } } })` से define कर सकते हैं।

`catalog.run(...)` वही shape लौटाता है जिसे OpenClaw
`models.providers` में लिखता है:

- एक provider entry के लिए `{ provider }`
- कई provider entries के लिए `{ providers }`

जब Plugin provider-specific model ids, base URL
defaults, या auth-gated model metadata का स्वामी हो, तब `catalog` का उपयोग करें।

`catalog.order` नियंत्रित करता है कि Plugin का catalog OpenClaw के
built-in implicit providers के सापेक्ष कब merge होता है:

- `simple`: plain API-key या env-driven providers
- `profile`: वे providers जो auth profiles मौजूद होने पर दिखाई देते हैं
- `paired`: वे providers जो कई संबंधित provider entries synthesize करते हैं
- `late`: अंतिम pass, दूसरे implicit providers के बाद

Key collision पर बाद वाले providers जीतते हैं, इसलिए Plugins जानबूझकर उसी provider id वाली
built-in provider entry को override कर सकते हैं।

Plugins read-only model rows भी
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` के माध्यम से publish कर सकते हैं। यह list/help/picker surfaces के लिए forward path है और
`text`, `image_generation`, `video_generation`, और `music_generation` rows का समर्थन करता है।
Provider plugins अभी भी live endpoint calls, token exchange, और vendor
response mapping के स्वामी हैं; Core common row shape, source labels, और media tool
help formatting का स्वामी है। Media-generation provider registrations `defaultModel`, `models`, और `capabilities` से static
catalog rows अपने-आप synthesize करते हैं।

Compatibility:

- `discovery` अभी भी legacy alias के रूप में काम करता है, लेकिन deprecation warning emit करता है
- अगर `catalog` और `discovery` दोनों registered हैं, तो OpenClaw `catalog` का उपयोग करता है
- `augmentModelCatalog` deprecated है; bundled providers को supplemental rows
  `registerModelCatalogProvider` के माध्यम से publish करने चाहिए

## Read-only channel inspection

अगर आपका Plugin कोई channel register करता है, तो `resolveAccount(...)` के साथ
`plugin.config.inspectAccount(cfg, accountId)` implement करना प्राथमिकता दें।

क्यों:

- `resolveAccount(...)` runtime path है। इसे यह मानने की अनुमति है कि credentials
  पूरी तरह materialized हैं और आवश्यक secrets missing होने पर fast fail कर सकता है।
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, और doctor/config
  repair flows जैसे read-only command paths को केवल configuration describe करने के लिए runtime credentials materialize करने की आवश्यकता नहीं होनी चाहिए।

अनुशंसित `inspectAccount(...)` behavior:

- केवल descriptive account state लौटाएँ।
- `enabled` और `configured` preserve करें।
- संबंधित होने पर credential source/status fields शामिल करें, जैसे:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Read-only availability report करने के लिए आपको raw token values लौटाने की आवश्यकता नहीं है।
  Status-style commands के लिए `tokenStatus: "available"` (और matching source
  field) लौटाना पर्याप्त है।
- जब credential SecretRef के माध्यम से configured हो लेकिन
  current command path में unavailable हो, तो `configured_unavailable` का उपयोग करें।

इससे read-only commands crash करने या account को not configured बताने के बजाय
"configured but unavailable in this command
path" report कर पाते हैं।

## Package packs

Plugin directory में `openclaw.extensions` वाला `package.json` शामिल हो सकता है:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

हर entry एक Plugin बन जाती है। अगर pack कई extensions list करता है, तो Plugin id
`name/<fileBase>` बन जाता है।

अगर आपका Plugin npm deps import करता है, तो उन्हें उसी directory में install करें ताकि
`node_modules` उपलब्ध हो (`npm install` / `pnpm install`)।

Security guardrail: हर `openclaw.extensions` entry को symlink resolution के बाद Plugin
directory के अंदर ही रहना होगा। Package directory से बाहर निकलने वाली entries
अस्वीकार की जाती हैं।

सुरक्षा नोट: `openclaw plugins install` Plugin dependencies को
project-local `npm install --omit=dev --ignore-scripts` के साथ install करता है (कोई lifecycle scripts नहीं,
runtime पर कोई dev dependencies नहीं), और inherited global npm install settings को अनदेखा करता है।
Plugin dependency trees को "pure JS/TS" रखें और ऐसे packages से बचें जिन्हें
`postinstall` builds की आवश्यकता होती है।

वैकल्पिक: `openclaw.setupEntry` एक हल्के setup-only module की ओर point कर सकता है।
जब OpenClaw को disabled channel Plugin के लिए setup surfaces चाहिए होते हैं, या
जब कोई channel Plugin enabled है लेकिन अभी भी unconfigured है, तो यह full Plugin entry के बजाय `setupEntry`
load करता है। इससे startup और setup हल्के रहते हैं
जब आपकी main Plugin entry tools, hooks, या अन्य runtime-only
code भी wire करती है।

वैकल्पिक: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
gateway के pre-listen startup phase के दौरान channel Plugin को उसी `setupEntry` path में opt कर सकता है,
भले ही channel पहले से configured हो।

इसे केवल तब उपयोग करें जब `setupEntry` उस startup surface को पूरी तरह cover करता हो जिसे
gateway के listening शुरू करने से पहले मौजूद होना चाहिए। व्यवहार में, इसका मतलब है कि setup entry को
हर channel-owned capability register करनी होगी जिस पर startup निर्भर करता है, जैसे:

- channel registration स्वयं
- कोई भी HTTP routes जो gateway के listening शुरू करने से पहले उपलब्ध होने चाहिए
- कोई भी gateway methods, tools, या services जो उसी window के दौरान मौजूद होने चाहिए

यदि आपकी full entry अभी भी किसी required startup capability की owner है, तो
इस flag को enable न करें। Plugin को default behavior पर रखें और OpenClaw को
startup के दौरान full entry load करने दें।

Bundled channels setup-only contract-surface helpers भी publish कर सकते हैं जिन्हें core
full channel runtime load होने से पहले consult कर सकता है। वर्तमान setup
promotion surface है:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core उस surface का उपयोग तब करता है जब उसे full Plugin entry load किए बिना legacy single-account channel
config को `channels.<id>.accounts.*` में promote करना होता है।
Matrix वर्तमान bundled example है: named accounts पहले से मौजूद होने पर यह केवल auth/bootstrap keys को
named promoted account में move करता है, और यह हमेशा
`accounts.default` बनाने के बजाय configured non-canonical default-account key को preserve कर सकता है।

वे setup patch adapters bundled contract-surface discovery को lazy रखते हैं। Import
time हल्का रहता है; promotion surface module import पर bundled channel startup में
दोबारा enter करने के बजाय केवल पहले use पर load होता है।

जब उन startup surfaces में gateway RPC methods शामिल हों, तो उन्हें
Plugin-specific prefix पर रखें। Core admin namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) reserved रहते हैं और हमेशा
`operator.admin` पर resolve होते हैं, भले ही कोई Plugin narrower scope request करे।

उदाहरण:

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

Channel Plugins `openclaw.channel` के जरिए setup/discovery metadata और
`openclaw.install` के जरिए install hints advertise कर सकते हैं। इससे core catalog data-free रहता है।

उदाहरण:

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

न्यूनतम उदाहरण से आगे उपयोगी `openclaw.channel` fields:

- `detailLabel`: richer catalog/status surfaces के लिए secondary label
- `docsLabel`: docs link के लिए link text override करें
- `preferOver`: lower-priority Plugin/channel ids जिन्हें इस catalog entry को outrank करना चाहिए
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface copy controls
- `markdownCapable`: outbound formatting decisions के लिए channel को markdown-capable mark करता है
- `exposure.configured`: `false` set होने पर channel को configured-channel listing surfaces से छिपाएं
- `exposure.setup`: `false` set होने पर channel को interactive setup/configure pickers से छिपाएं
- `exposure.docs`: docs navigation surfaces के लिए channel को internal/private mark करें
- `showConfigured` / `showInSetup`: compatibility के लिए legacy aliases अभी भी accepted हैं; `exposure` को prefer करें
- `quickstartAllowFrom`: channel को standard quickstart `allowFrom` flow में opt करें
- `forceAccountBinding`: केवल एक account मौजूद होने पर भी explicit account binding require करें
- `preferSessionLookupForAnnounceTarget`: announce targets resolve करते समय session lookup को prefer करें

OpenClaw **external channel catalogs** भी merge कर सकता है (उदाहरण के लिए, MPM
registry export)। इनमें से किसी एक पर JSON file drop करें:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

या `OPENCLAW_PLUGIN_CATALOG_PATHS` (या `OPENCLAW_MPM_CATALOG_PATHS`) को
एक या अधिक JSON files (comma/semicolon/`PATH`-delimited) पर point करें। हर file में
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` होना चाहिए। Parser `"entries"` key के legacy aliases के रूप में `"packages"` या `"plugins"` भी accept करता है।

Generated channel catalog entries और provider install catalog entries raw `openclaw.install` block के बगल में
normalized install-source facts expose करती हैं। Normalized facts identify करते हैं
कि npm spec exact version है या floating selector, expected integrity metadata मौजूद है या नहीं,
और local source path भी उपलब्ध है या नहीं। जब catalog/package identity ज्ञात होती है, तो
normalized facts चेतावनी देते हैं यदि parsed npm package name उस identity से drift करता है।
वे तब भी warn करते हैं जब `defaultChoice` invalid हो या ऐसे source की ओर point करे जो
उपलब्ध नहीं है, और जब valid npm source के बिना npm integrity metadata मौजूद हो।
Consumers को `installSource` को additive optional field की तरह treat करना चाहिए ताकि
hand-built entries और catalog shims को इसे synthesize न करना पड़े।
इससे onboarding और diagnostics Plugin runtime import किए बिना source-plane state समझा सकते हैं।

Official external npm entries को exact `npmSpec` और
`expectedIntegrity` prefer करना चाहिए। Bare package names और dist-tags compatibility के लिए
अब भी काम करते हैं, लेकिन वे source-plane warnings surface करते हैं ताकि catalog
existing Plugins को तोड़े बिना pinned, integrity-checked installs की ओर बढ़ सके।
जब onboarding local catalog path से install करता है, तो यह managed Plugin
Plugin index entry को `source: "path"` और संभव होने पर workspace-relative
`sourcePath` के साथ record करता है। Absolute operational load path
`plugins.load.paths` में रहता है; install record local workstation
paths को long-lived config में duplicate करने से बचता है। इससे local development installs
source-plane diagnostics को दिखाई देते हैं, बिना दूसरा raw filesystem-path disclosure
surface जोड़े। Persisted `installed_plugin_index` SQLite row install
source of truth है और Plugin runtime modules load किए बिना refresh की जा सकती है।
इसका `installRecords` map तब भी durable रहता है जब Plugin manifest missing या
invalid हो; इसका `plugins` payload rebuildable manifest view है।

## Context engine Plugins

Context engine Plugins ingest, assembly,
और Compaction के लिए session context orchestration own करते हैं। इन्हें अपने Plugin से
`api.registerContextEngine(id, factory)` के साथ register करें, फिर active engine को
`plugins.slots.contextEngine` के साथ select करें।

इसे तब उपयोग करें जब आपके Plugin को default context
pipeline को replace या extend करना हो, केवल memory search या hooks add करने के बजाय।

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

Factory `ctx` construction-time initialization के लिए optional `config`, `agentDir`, और `workspaceDir`
values expose करता है।

जब active harness के पास persistent backend thread हो, तो `assemble()` `contextProjection` return कर सकता है।
Legacy per-turn projection के लिए इसे omit करें। जब assembled context को
backend thread में एक बार inject किया जाना चाहिए और epoch बदलने तक reuse किया जाना चाहिए, तो
`{ mode: "thread_bootstrap", epoch }` return करें। Engine के semantic context के बदलने के बाद
epoch बदलें, जैसे engine-owned Compaction pass के बाद। Hosts thread-bootstrap projection में
tool-call metadata, input shape, और redacted tool results preserve कर सकते हैं ताकि fresh
backend threads raw secret-bearing payloads copy किए बिना tool continuity retain करें।

यदि आपका engine Compaction algorithm own **नहीं** करता है, तो `compact()`
implemented रखें और उसे explicitly delegate करें:

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

## नई capability जोड़ना

जब किसी Plugin को ऐसे behavior की आवश्यकता हो जो current API में fit नहीं होता, तो private reach-in के साथ
Plugin system को bypass न करें। Missing capability जोड़ें।

Recommended sequence:

1. core contract define करें
   तय करें कि core को कौन सा shared behavior own करना चाहिए: policy, fallback, config merge,
   lifecycle, channel-facing semantics, और runtime helper shape।
2. typed Plugin registration/runtime surfaces जोड़ें
   `OpenClawPluginApi` और/या `api.runtime` को smallest useful
   typed capability surface के साथ extend करें।
3. core + channel/feature consumers wire करें
   Channels और feature Plugins को नई capability core के जरिए consume करनी चाहिए,
   vendor implementation को सीधे import करके नहीं।
4. vendor implementations register करें
   फिर Vendor Plugins अपने backends capability के against register करते हैं।
5. contract coverage जोड़ें
   Tests जोड़ें ताकि ownership और registration shape समय के साथ explicit रहें।

इसी तरह OpenClaw किसी एक provider के worldview में hardcoded हुए बिना opinionated रहता है। Concrete file checklist और worked example के लिए [Capability Cookbook](/hi/plugins/adding-capabilities)
देखें।

### Capability checklist

जब आप नई capability जोड़ते हैं, तो implementation को आमतौर पर इन
surfaces को साथ-साथ touch करना चाहिए:

- `src/<capability>/types.ts` में core contract types
- `src/<capability>/runtime.ts` में core runner/runtime helper
- `src/plugins/types.ts` में Plugin API registration surface
- `src/plugins/registry.ts` में Plugin registry wiring
- `src/plugins/runtime/*` में Plugin runtime exposure, जब feature/channel
  Plugins को इसे consume करना हो
- `src/test-utils/plugin-registration.ts` में capture/test helpers
- `src/plugins/contracts/registry.ts` में ownership/contract assertions
- `docs/` में operator/Plugin docs

यदि इनमें से कोई surface missing है, तो यह आमतौर पर संकेत है कि capability अभी
fully integrated नहीं है।

### Capability template

न्यूनतम पैटर्न:

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

कॉन्ट्रैक्ट टेस्ट पैटर्न:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

यह नियम को सरल रखता है:

- core क्षमता कॉन्ट्रैक्ट + orchestration का स्वामी है
- vendor plugins vendor implementations के स्वामी हैं
- feature/channel plugins runtime helpers का उपयोग करते हैं
- contract tests ownership को स्पष्ट रखते हैं

## संबंधित

- [Plugin आर्किटेक्चर](/hi/plugins/architecture) — सार्वजनिक क्षमता मॉडल और आकार
- [Plugin SDK subpaths](/hi/plugins/sdk-subpaths)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
