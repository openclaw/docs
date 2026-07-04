---
read_when:
    - Plugin इम्पोर्ट के लिए सही plugin-sdk सबपाथ चुनना
    - बंडल किए गए Plugin सबपाथ और सहायक सतहों का ऑडिट करना
summary: 'Plugin SDK उपपथ कैटलॉग: कौन से आयात कहाँ स्थित हैं, क्षेत्र के अनुसार समूहित'
title: Plugin SDK उपपथ
x-i18n:
    generated_at: "2026-07-04T10:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

OpenClaw_docs_i18n_input>
Plugin SDK को `openclaw/plugin-sdk/` के अंतर्गत संकरे सार्वजनिक उप-पथों के एक सेट के रूप में प्रदर्शित किया जाता है। यह पृष्ठ उद्देश्य के अनुसार समूहित आम तौर पर उपयोग किए जाने वाले उप-पथों को सूचीबद्ध करता है। जेनरेट की गई कंपाइलर प्रवेश-बिंदु इन्वेंटरी `scripts/lib/plugin-sdk-entrypoints.json` में रहती है; पैकेज निर्यात वह सार्वजनिक उपसमुच्चय हैं जो `scripts/lib/plugin-sdk-private-local-only-subpaths.json` में सूचीबद्ध रेपो-स्थानीय परीक्षण/आंतरिक उप-पथ घटाने के बाद बचता है। अनुरक्षक `pnpm plugin-sdk:surface` से सार्वजनिक निर्यात संख्या और `pnpm plugins:boundary-report:summary` से सक्रिय आरक्षित सहायक उप-पथों का ऑडिट कर सकते हैं; अप्रयुक्त आरक्षित सहायक निर्यात निष्क्रिय संगतता ऋण के रूप में सार्वजनिक SDK में बने रहने के बजाय CI रिपोर्ट को विफल कर देते हैं।

Plugin लेखन गाइड के लिए, [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) देखें।

## Plugin प्रवेश

| उप-पथ                         | मुख्य निर्यात                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | माइग्रेशन प्रदाता आइटम सहायक जैसे `createMigrationItem`, कारण स्थिरांक, आइटम स्थिति मार्कर, रिडैक्शन सहायक, और `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | रनटाइम माइग्रेशन सहायक जैसे `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, और `writeMigrationReport`            |
| `plugin-sdk/health`            | बंडल किए गए स्वास्थ्य उपभोक्ताओं के लिए Doctor स्वास्थ्य-जांच पंजीकरण, पहचान, मरम्मत, चयन, गंभीरता, और निष्कर्ष प्रकार                                               |

### पदावनत संगतता और परीक्षण सहायक

पदावनत उप-पथ पुराने plugins के लिए निर्यातित बने रहते हैं, लेकिन नए कोड को नीचे दिए गए केंद्रित SDK उप-पथों का उपयोग करना चाहिए। अनुरक्षित सूची `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI इससे बंडल किए गए उत्पादन आयातों को अस्वीकार करता है। `compat`, `config-types`, `infra-runtime`, `text-runtime`, और `zod` जैसे व्यापक बैरल केवल संगतता के लिए हैं। `zod` को सीधे `zod` से आयात करें।

OpenClaw के Vitest-समर्थित परीक्षण-सहायक उप-पथ केवल रेपो-स्थानीय हैं और अब पैकेज निर्यात नहीं हैं: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, और `testing`।

### आरक्षित बंडल किए गए Plugin सहायक उप-पथ

ये उप-पथ अपने स्वामी बंडल किए गए Plugin के लिए Plugin-स्वामित्व वाली संगतता सतहें हैं, सामान्य SDK API नहीं: `plugin-sdk/codex-mcp-projection` और `plugin-sdk/codex-native-task-runtime`। पैकेज अनुबंध सुरक्षा-रेलिंग द्वारा क्रॉस-ओनर एक्सटेंशन आयातों को अवरुद्ध किया जाता है।

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | उपपथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | रूट `openclaw.json` Zod स्कीमा निर्यात (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin-स्वामित्व वाले स्कीमा के लिए कैश किया गया JSON Schema वैलिडेशन सहायक |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक, सेटअप अनुवादक, allowlist प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता alias; `plugin-sdk/setup-runtime` का उपयोग करें |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | मल्टी-अकाउंट कॉन्फ़िग/action-gate सहायक, default-account fallback सहायक |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id सामान्यीकरण सहायक |
    | `plugin-sdk/account-resolution` | अकाउंट lookup + default-fallback सहायक |
    | `plugin-sdk/account-helpers` | संकीर्ण account-list/account-action सहायक |
    | `plugin-sdk/access-groups` | Access-group allowlist पार्सिंग और redacted group diagnostics सहायक |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता facade। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फ़िग स्कीमा primitives, साथ में Zod और सीधे JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | केवल अनुरक्षित bundled Plugin के लिए bundled OpenClaw चैनल कॉन्फ़िग स्कीमा |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। Canonical bundled/official चैट चैनल ids, साथ में उन Plugin के लिए formatter labels/aliases जिन्हें अपनी तालिका hardcode किए बिना envelope-prefixed टेक्स्ट पहचानना होता है। |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel कॉन्फ़िग स्कीमा के लिए अप्रचलित संगतता alias |
    | `plugin-sdk/telegram-command-config` | bundled-contract fallback के साथ Telegram custom-command सामान्यीकरण/वैलिडेशन सहायक |
    | `plugin-sdk/command-gating` | संकीर्ण command authorization gate सहायक |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | अप्रचलित निम्न-स्तरीय चैनल ingress संगतता facade। नए receive पथों को `plugin-sdk/channel-ingress-runtime` का उपयोग करना चाहिए। |
    | `plugin-sdk/channel-ingress-runtime` | माइग्रेट किए गए चैनल receive पथों के लिए प्रयोगात्मक उच्च-स्तरीय चैनल ingress runtime resolver और route fact बिल्डर। प्रत्येक Plugin में effective allowlists, command allowlists, और legacy projections असेंबल करने के बजाय इसे प्राथमिकता दें। [Channel ingress API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता facade। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश lifecycle contracts, साथ में reply pipeline options, receipts, live preview/streaming, lifecycle helpers, outbound identity, payload planning, durable sends, और message-send context helpers। [Channel outbound API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता alias, साथ में legacy reply-dispatch facades। |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता alias, साथ में legacy reply-dispatch facades। |
    | `plugin-sdk/inbound-envelope` | साझा inbound route + envelope builder सहायक |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता facade। inbound runners और dispatch predicates के लिए `plugin-sdk/channel-inbound`, और message delivery helpers के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित target parsing alias; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | साझा outbound media loading और hosted-media state सहायक |
    | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता facade। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता facade। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/poll-runtime` | संकीर्ण poll सामान्यीकरण सहायक |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycle और adapter सहायक |
    | `plugin-sdk/agent-media-payload` | Legacy agent media payload builder |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding, pairing, और configured-binding सहायक |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot सहायक |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy resolution सहायक |
    | `plugin-sdk/channel-status` | साझा channel status snapshot/summary सहायक |
    | `plugin-sdk/channel-config-primitives` | संकीर्ण चैनल config-schema primitives |
    | `plugin-sdk/channel-config-writes` | चैनल config-write authorization सहायक |
    | `plugin-sdk/channel-plugin-common` | साझा channel Plugin prelude निर्यात |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read सहायक |
    | `plugin-sdk/group-access` | साझा group-access decision सहायक |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता facades। `plugin-sdk/channel-inbound` का उपयोग करें। |
    | `plugin-sdk/direct-dm-guard-policy` | संकीर्ण direct-DM pre-crypto guard policy सहायक |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और tracked owner compatibility के लिए अप्रचलित Discord संगतता facade; नए Plugin को generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | tracked owner compatibility के लिए अप्रचलित Telegram account-resolution संगतता facade; नए Plugin को injected runtime helpers या generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/zalouser` | प्रकाशित Lark/Zalo packages के लिए अप्रचलित Zalo Personal संगतता facade जो अभी भी sender command authorization import करते हैं; नए Plugin को `plugin-sdk/command-auth` का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | Semantic message presentation, delivery, और legacy interactive reply helpers। [Message Presentation](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/channel-inbound` | event classification, context building, formatting, roots, debounce, mention matching, mention-policy, और inbound logging के लिए साझा inbound सहायक |
    | `plugin-sdk/channel-inbound-debounce` | संकीर्ण inbound debounce सहायक |
    | `plugin-sdk/channel-mention-gating` | व्यापक inbound runtime surface के बिना संकीर्ण mention-policy, mention marker, और mention text सहायक |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | अप्रचलित संगतता facades। `plugin-sdk/channel-inbound` या `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-pairing-paths` | अप्रचलित संगतता facade। `plugin-sdk/channel-pairing` का उपयोग करें। |
    | `plugin-sdk/channel-reply-options-runtime` | अप्रचलित संगतता facade। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता facade। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | Reply result types |
    | `plugin-sdk/channel-actions` | Channel message-action helpers, साथ में Plugin compatibility के लिए रखे गए अप्रचलित native schema helpers |
    | `plugin-sdk/channel-route` | साझा route normalization, parser-driven target resolution, thread-id stringification, dedupe/compact route keys, parsed-target types, और route/target comparison helpers |
    | `plugin-sdk/channel-targets` | Target parsing helpers; route comparison callers को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | Channel contract types |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | संकीर्ण secret-contract helpers जैसे `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, और secret target types |
  </Accordion>

अप्रचलित channel helper families केवल published-plugin संगतता के लिए उपलब्ध रहती हैं। हटाने की योजना यह है: उन्हें external plugin migration window तक रखें, repo/bundled Plugin को `channel-inbound` और `channel-outbound` पर रखें, फिर अगले major SDK cleanup में compatibility subpaths हटा दें। यह पुराने channel message/runtime, channel streaming, direct-DM access, inbound helper splinter, reply-options, और pairing-path families पर लागू होता है।

  <Accordion title="प्रदाता उप-पथ">
    | उप-पथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | सेटअप, कैटलॉग खोज, और रनटाइम मॉडल तैयारी के लिए समर्थित LM Studio प्रदाता फसाड |
    | `plugin-sdk/lmstudio-runtime` | स्थानीय सर्वर डिफ़ॉल्ट, मॉडल खोज, अनुरोध हेडर, और लोडेड-मॉडल हेल्पर के लिए समर्थित LM Studio रनटाइम फसाड |
    | `plugin-sdk/provider-setup` | क्यूरेट किए गए स्थानीय/स्वयं-होस्टेड प्रदाता सेटअप हेल्पर |
    | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्वयं-होस्टेड प्रदाता सेटअप हेल्पर |
    | `plugin-sdk/cli-backend` | CLI बैकएंड डिफ़ॉल्ट + वॉचडॉग कॉन्स्टेंट |
    | `plugin-sdk/provider-auth-runtime` | प्रदाता plugins के लिए रनटाइम API-key समाधान हेल्पर |
    | `plugin-sdk/provider-oauth-runtime` | सामान्य प्रदाता OAuth कॉलबैक प्रकार, कॉलबैक-पेज रेंडरिंग, PKCE/state हेल्पर, authorization-input पार्सिंग, token-expiry हेल्पर, और abort हेल्पर |
    | `plugin-sdk/provider-auth-api-key` | API-key ऑनबोर्डिंग/profile-write हेल्पर जैसे `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | मानक OAuth auth-result बिल्डर |
    | `plugin-sdk/provider-env-vars` | प्रदाता auth env-var lookup हेल्पर |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex auth-import हेल्पर, अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा replay-policy बिल्डर, provider-endpoint हेल्पर, और साझा model-id normalization हेल्पर |
    | `plugin-sdk/provider-catalog-live-runtime` | संरक्षित `/models`-शैली खोज के लिए लाइव प्रदाता मॉडल कैटलॉग हेल्पर: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model-id फ़िल्टरिंग, TTL cache, और स्थिर fallback |
    | `plugin-sdk/provider-catalog-runtime` | अनुबंध परीक्षणों के लिए प्रदाता कैटलॉग augmentation रनटाइम hook और plugin-provider registry seams |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | सामान्य प्रदाता HTTP/endpoint capability हेल्पर, प्रदाता HTTP त्रुटियां, और ऑडियो transcription multipart form हेल्पर |
    | `plugin-sdk/provider-web-fetch-contract` | संकुचित web-fetch config/selection अनुबंध हेल्पर जैसे `enablePluginInConfig` और `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch प्रदाता registration/cache हेल्पर |
    | `plugin-sdk/provider-web-search-config-contract` | उन प्रदाताओं के लिए संकुचित web-search config/credential हेल्पर जिन्हें plugin-enable wiring की आवश्यकता नहीं है |
    | `plugin-sdk/provider-web-search-contract` | संकुचित web-search config/credential अनुबंध हेल्पर जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और scoped credential setters/getters |
    | `plugin-sdk/provider-web-search` | Web-search प्रदाता registration/cache/runtime हेल्पर |
    | `plugin-sdk/embedding-providers` | सामान्य embedding प्रदाता प्रकार और read हेल्पर, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, और `listEmbeddingProviders(...)` शामिल हैं; plugins `api.registerEmbeddingProvider(...)` के माध्यम से प्रदाता register करते हैं ताकि manifest ownership लागू रहे |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
    | `plugin-sdk/provider-usage` | प्रदाता usage snapshot प्रकार, साझा usage fetch हेल्पर, और `fetchClaudeUsage` जैसे प्रदाता fetchers |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper प्रकार, plain-text tool-call compat, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper हेल्पर |
    | `plugin-sdk/provider-stream-shared` | सार्वजनिक साझा प्रदाता stream wrapper हेल्पर, जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, और Anthropic/DeepSeek/OpenAI-संगत stream utilities शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | नेटिव प्रदाता transport हेल्पर जैसे guarded fetch, tool-result text extraction, transport message transforms, और writable transport event streams |
    | `plugin-sdk/provider-onboard` | ऑनबोर्डिंग config patch हेल्पर |
    | `plugin-sdk/global-singleton` | Process-local singleton/map/cache हेल्पर |
    | `plugin-sdk/group-activation` | संकुचित group activation mode और command parsing हेल्पर |
  </Accordion>

प्रदाता usage snapshots सामान्यतः एक या अधिक quota `windows` रिपोर्ट करते हैं, प्रत्येक में
एक label, उपयोग किया गया प्रतिशत, और वैकल्पिक reset time होता है। जो प्रदाता resettable quota
windows के बजाय balance या account-state text उजागर करते हैं, उन्हें प्रतिशत गढ़ने के बजाय
खाली `windows` array के साथ `summary` लौटाना चाहिए।
OpenClaw उस summary text को status output में दिखाता है; `error` का उपयोग केवल तब करें जब
usage endpoint विफल हो गया हो या उसने कोई उपयोगी usage data न लौटाया हो।

  <Accordion title="Auth और security उप-पथ">
    | उप-पथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry हेल्पर जिनमें dynamic argument menu formatting, sender-authorization हेल्पर शामिल हैं |
    | `plugin-sdk/command-status` | Command/help message बिल्डर जैसे `buildCommandsMessagePaginated` और `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Approver resolution और same-chat action-auth हेल्पर |
    | `plugin-sdk/approval-client-runtime` | Native exec approval profile/filter हेल्पर |
    | `plugin-sdk/approval-delivery-runtime` | Native approval capability/delivery adapters |
    | `plugin-sdk/approval-gateway-runtime` | साझा approval gateway-resolution हेल्पर |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoints के लिए हल्के native approval adapter loading हेल्पर |
    | `plugin-sdk/approval-handler-runtime` | व्यापक approval handler runtime हेल्पर; जब वे पर्याप्त हों तो संकुचित adapter/gateway seams को प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | Native approval target, account-binding, route-gate, forwarding fallback, और local native exec prompt suppression हेल्पर |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, reaction hint text हेल्पर, और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin approval reply payload हेल्पर |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval payload हेल्पर, native approval routing/runtime हेल्पर, और structured approval display हेल्पर जैसे `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | संकुचित inbound reply dedupe reset हेल्पर |
    | `plugin-sdk/channel-contract-testing` | व्यापक testing barrel के बिना संकुचित channel contract test हेल्पर |
    | `plugin-sdk/command-auth-native` | Native command auth, dynamic argument menu formatting, और native session-target हेल्पर |
    | `plugin-sdk/command-detection` | साझा command detection हेल्पर |
    | `plugin-sdk/command-primitives-runtime` | hot channel paths के लिए हल्के command text predicates |
    | `plugin-sdk/command-surface` | Command-body normalization और command-surface हेल्पर |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | private channel और Web UI device-code pairing के लिए lazy provider auth login flow हेल्पर |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret surfaces के लिए संकुचित secret-contract collection हेल्पर |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config parsing के लिए संकुचित `coerceSecretRef` और SecretRef typing हेल्पर |
    | `plugin-sdk/secret-provider-integration` | बाहरी secret provider presets प्रकाशित करने वाले plugins के लिए केवल-प्रकार SecretRef provider integration manifest और preset contracts |
    | `plugin-sdk/security-runtime` | साझा trust, DM gating, root-bounded file/path हेल्पर जिनमें create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store हेल्पर, symlink-parent guards, external-content, sensitive text redaction, constant-time secret comparison, और secret-collection हेल्पर शामिल हैं |
    | `plugin-sdk/ssrf-policy` | Host allowlist और private-network SSRF policy हेल्पर |
    | `plugin-sdk/ssrf-dispatcher` | व्यापक infra runtime surface के बिना संकुचित pinned-dispatcher हेल्पर |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error, और SSRF policy हेल्पर |
    | `plugin-sdk/secret-input` | Secret input parsing हेल्पर |
    | `plugin-sdk/webhook-ingress` | Webhook request/target हेल्पर और raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Request body size/timeout हेल्पर |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/runtime` | व्यापक रनटाइम/लॉगिंग/बैकअप/Plugin-इंस्टॉल हेल्पर |
    | `plugin-sdk/runtime-env` | संकीर्ण रनटाइम env, logger, timeout, retry, और backoff हेल्पर |
    | `plugin-sdk/browser-config` | सामान्यीकृत प्रोफ़ाइल/डिफ़ॉल्ट, CDP URL पार्सिंग, और ब्राउज़र-कंट्रोल auth हेल्पर के लिए समर्थित ब्राउज़र config facade |
    | `plugin-sdk/agent-harness-task-runtime` | होस्ट-द्वारा जारी task scope का उपयोग करने वाले harness-backed agents के लिए सामान्य task lifecycle और completion delivery हेल्पर |
    | `plugin-sdk/codex-mcp-projection` | उपयोगकर्ता MCP server config को Codex thread config में प्रोजेक्ट करने के लिए आरक्षित bundled Codex हेल्पर; third-party plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | native task mirror/runtime wiring के लिए निजी bundled Codex हेल्पर; third-party plugins के लिए नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य channel runtime-context registration और lookup हेल्पर |
    | `plugin-sdk/matrix` | पुराने third-party channel packages के लिए deprecated Matrix compatibility facade; नए plugins को सीधे `plugin-sdk/run-command` import करना चाहिए |
    | `plugin-sdk/mattermost` | पुराने third-party channel packages के लिए deprecated Mattermost compatibility facade; नए plugins को सीधे generic SDK subpaths import करना चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | साझा plugin command/hook/http/interactive हेल्पर |
    | `plugin-sdk/hook-runtime` | साझा webhook/internal hook pipeline हेल्पर |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, और `createLazyRuntimeSurface` जैसे lazy runtime import/binding हेल्पर |
    | `plugin-sdk/process-runtime` | Process exec हेल्पर |
    | `plugin-sdk/cli-runtime` | CLI formatting, wait, version, argument-invocation, और lazy command-group हेल्पर |
    | `plugin-sdk/qa-live-transport-scenarios` | साझा live transport QA scenario ids, baseline coverage हेल्पर, और scenario-selection हेल्पर |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले plugin HTTP routes के लिए आरक्षित Gateway method dispatch हेल्पर |
    | `plugin-sdk/gateway-runtime` | Gateway client, event-loop-ready client start हेल्पर, gateway CLI RPC, gateway protocol errors, advertised LAN host resolution, और channel-status patch हेल्पर |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` जैसे plugin config shapes और channel/provider config types के लिए केंद्रित type-only config surface |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject`, और `resolveLivePluginConfigObject` जैसे runtime plugin-config lookup हेल्पर |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, और `logConfigUpdated` जैसे transactional config mutation हेल्पर |
    | `plugin-sdk/message-tool-delivery-hints` | साझा message-tool delivery metadata hint strings |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot`, और test snapshot setters जैसे current process config snapshot हेल्पर |
    | `plugin-sdk/telegram-command-config` | Telegram command-name/description normalization और duplicate/conflict checks, तब भी जब bundled Telegram contract surface उपलब्ध न हो |
    | `plugin-sdk/text-autolink-runtime` | broad text barrel के बिना file-reference autolink detection |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, reaction hint text हेल्पर, और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval हेल्पर, approval-capability builders, auth/profile हेल्पर, native routing/runtime हेल्पर, और structured approval display path formatting |
    | `plugin-sdk/reply-runtime` | साझा inbound/reply runtime हेल्पर, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण reply dispatch/finalize और conversation-label हेल्पर |
    | `plugin-sdk/reply-history` | साझा short-window reply-history हेल्पर। नए message-turn code को `createChannelHistoryWindow` का उपयोग करना चाहिए; lower-level map हेल्पर केवल deprecated compatibility exports बने रहते हैं |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | संकीर्ण text/markdown chunking हेल्पर |
    | `plugin-sdk/session-store-runtime` | Session workflow हेल्पर (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), session identity के आधार पर bounded recent user/assistant transcript text reads, legacy session store path/session-key हेल्पर, updated-at reads, और transition-only whole-store/file-path compatibility हेल्पर |
    | `plugin-sdk/session-transcript-runtime` | Transcript identity, scoped target/read/write हेल्पर, update publishing, write locks, और transcript memory hit keys |
    | `plugin-sdk/sqlite-runtime` | first-party runtime के लिए केंद्रित SQLite agent-schema, path, और transaction हेल्पर |
    | `plugin-sdk/cron-store-runtime` | Cron store path/load/save हेल्पर |
    | `plugin-sdk/state-paths` | State/OAuth dir path हेल्पर |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite keyed-state types और plugin-owned databases के लिए centralized connection pragma और WAL maintenance setup |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, और `resolveDefaultAgentBoundAccountId` जैसे route/session-key/account binding हेल्पर |
    | `plugin-sdk/status-helpers` | साझा channel/account status summary हेल्पर, runtime-state defaults, और issue metadata हेल्पर |
    | `plugin-sdk/target-resolver-runtime` | साझा target resolver हेल्पर |
    | `plugin-sdk/string-normalization-runtime` | Slug/string normalization हेल्पर |
    | `plugin-sdk/request-url` | fetch/request-like inputs से string URLs निकालें |
    | `plugin-sdk/run-command` | normalized stdout/stderr results के साथ timed command runner |
    | `plugin-sdk/param-readers` | सामान्य tool/CLI param readers |
    | `plugin-sdk/tool-plugin` | एक simple typed agent-tool plugin define करें और manifest generation के लिए static metadata expose करें |
    | `plugin-sdk/tool-payload` | tool result objects से normalized payloads निकालें |
    | `plugin-sdk/tool-send` | tool args से canonical send target fields निकालें |
    | `plugin-sdk/sandbox` | Sandbox backend types और SSH/OpenShell command हेल्पर, जिनमें fail-fast exec command preflight शामिल है |
    | `plugin-sdk/temp-path` | साझा temp-download path हेल्पर और private secure temp workspaces |
    | `plugin-sdk/logging-core` | Subsystem logger और redaction हेल्पर |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode और conversion हेल्पर |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` जैसे model/session override हेल्पर |
    | `plugin-sdk/talk-config-runtime` | Talk provider config resolution हेल्पर |
    | `plugin-sdk/json-store` | छोटे JSON state read/write हेल्पर |
    | `plugin-sdk/json-unsafe-integers` | JSON parsing हेल्पर जो unsafe integer literals को strings के रूप में सुरक्षित रखते हैं |
    | `plugin-sdk/file-lock` | Re-entrant file-lock हेल्पर |
    | `plugin-sdk/persistent-dedupe` | Disk-backed dedupe cache हेल्पर |
    | `plugin-sdk/acp-runtime` | ACP runtime/session और reply-dispatch हेल्पर |
    | `plugin-sdk/acp-runtime-backend` | startup-loaded plugins के लिए lightweight ACP backend registration और reply-dispatch हेल्पर |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup imports के बिना read-only ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | संकीर्ण agent runtime config-schema primitives |
    | `plugin-sdk/boolean-param` | Loose boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name matching resolution हेल्पर |
    | `plugin-sdk/device-bootstrap` | Device bootstrap और pairing token हेल्पर |
    | `plugin-sdk/extension-shared` | साझा passive-channel, status, और ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply हेल्पर |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing हेल्पर |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize हेल्पर |
    | `plugin-sdk/agent-harness` | low-level agent harnesses के लिए experimental trusted-plugin surface: harness types, active-run steer/abort हेल्पर, OpenClaw tool bridge हेल्पर, runtime-plan tool policy हेल्पर, terminal outcome classification, tool progress formatting/detail हेल्पर, और attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | Deprecated Z.AI provider-owned endpoint detection facade; Z.AI plugin public API का उपयोग करें |
    | `plugin-sdk/async-lock-runtime` | छोटे runtime state files के लिए process-local async lock हेल्पर |
    | `plugin-sdk/channel-activity-runtime` | Channel activity telemetry हेल्पर |
    | `plugin-sdk/concurrency-runtime` | Bounded async task concurrency हेल्पर |
    | `plugin-sdk/dedupe-runtime` | In-memory और persistent-backed dedupe cache हेल्पर |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain हेल्पर |
    | `plugin-sdk/file-access-runtime` | Safe local-file और media-source path हेल्पर |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat wake, event, और visibility हेल्पर |
    | `plugin-sdk/number-runtime` | Numeric coercion हेल्पर |
    | `plugin-sdk/secure-random-runtime` | Secure token/UUID हेल्पर |
    | `plugin-sdk/system-event-runtime` | System event queue हेल्पर |
    | `plugin-sdk/transport-ready-runtime` | Transport readiness wait हेल्पर |
    | `plugin-sdk/exec-approvals-runtime` | broad infra-runtime barrel के बिना exec approval policy file हेल्पर |
    | `plugin-sdk/infra-runtime` | Deprecated compatibility shim; ऊपर दिए गए focused runtime subpaths का उपयोग करें |
    | `plugin-sdk/collection-runtime` | छोटे bounded cache हेल्पर |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flag, event, और trace-context हेल्पर |
    | `plugin-sdk/error-runtime` | Error graph, formatting, shared error classification हेल्पर, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, EnvHttpProxyAgent option, और pinned lookup हेल्पर |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch imports के बिना dispatcher-aware runtime fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | broad media runtime surface के बिना inline image data URL sanitizer और signature sniffing हेल्पर |
    | `plugin-sdk/response-limit-runtime` | broad media runtime surface के बिना bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routing या pairing stores के बिना current conversation binding state |
    | `plugin-sdk/session-store-runtime` | broad config writes/maintenance imports के बिना session-store हेल्पर |
    | `plugin-sdk/sqlite-runtime` | database lifecycle controls के बिना focused SQLite agent-schema, path, और transaction हेल्पर |
    | `plugin-sdk/context-visibility-runtime` | broad config/security imports के बिना context visibility resolution और supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging imports के बिना narrow primitive record/string coercion और normalization हेल्पर |
    | `plugin-sdk/host-runtime` | Hostname और SCP host normalization हेल्पर |
    | `plugin-sdk/retry-runtime` | Retry config और retry runner हेल्पर |
    | `plugin-sdk/agent-runtime` | Agent dir/identity/workspace हेल्पर, जिनमें `resolveAgentDir`, `resolveDefaultAgentDir`, और deprecated `resolveOpenClawAgentDir` compatibility export शामिल हैं |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/media-runtime` | साझा मीडिया fetch/transform/store सहायक, जिनमें `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और अप्रचलित `fetchRemoteMedia` शामिल हैं; जब किसी URL को OpenClaw मीडिया बनना चाहिए, तो buffer reads से पहले store helpers को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | संकीर्ण MIME सामान्यीकरण, file-extension mapping, MIME detection, और media-kind helpers |
    | `plugin-sdk/media-store` | संकीर्ण media store helpers जैसे `saveMediaBuffer` और `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | साझा media-generation failover helpers, candidate selection, और missing-model messaging |
    | `plugin-sdk/media-understanding` | Media understanding provider types और provider-facing image/audio/structured-extraction helper exports |
    | `plugin-sdk/text-chunking` | Text और markdown chunking/render helpers, markdown table conversion, directive-tag stripping, और safe-text utilities |
    | `plugin-sdk/text-chunking` | Outbound text chunking helper |
    | `plugin-sdk/speech` | Speech provider types और provider-facing directive, registry, validation, OpenAI-compatible TTS builder, और speech helper exports |
    | `plugin-sdk/speech-core` | साझा speech provider types, registry, directive, normalization, और speech helper exports |
    | `plugin-sdk/realtime-transcription` | Realtime transcription provider types, registry helpers, और साझा WebSocket session helper |
    | `plugin-sdk/realtime-bootstrap-context` | सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` context injection के लिए realtime profile bootstrap helper |
    | `plugin-sdk/realtime-voice` | Realtime voice provider types, registry helpers, और साझा realtime voice behavior helpers, जिनमें output activity tracking शामिल है |
    | `plugin-sdk/image-generation` | Image generation provider types और image asset/data URL helpers तथा OpenAI-compatible image provider builder |
    | `plugin-sdk/image-generation-core` | साझा image-generation types, failover, auth, और registry helpers |
    | `plugin-sdk/music-generation` | Music generation provider/request/result types |
    | `plugin-sdk/music-generation-core` | साझा music-generation types, failover helpers, provider lookup, और model-ref parsing |
    | `plugin-sdk/video-generation` | Video generation provider/request/result types |
    | `plugin-sdk/video-generation-core` | साझा video-generation types, failover helpers, provider lookup, और model-ref parsing |
    | `plugin-sdk/transcripts` | साझा transcripts source provider types, registry helpers, session descriptors, और utterance metadata |
    | `plugin-sdk/webhook-targets` | Webhook target registry और route-install helpers |
    | `plugin-sdk/webhook-path` | अप्रचलित compatibility alias; `plugin-sdk/webhook-ingress` का उपयोग करें |
    | `plugin-sdk/web-media` | साझा remote/local media loading helpers |
    | `plugin-sdk/zod` | अप्रचलित compatibility re-export; `zod` को सीधे `zod` से import करें |
    | `plugin-sdk/testing` | legacy OpenClaw tests के लिए repo-local अप्रचलित compatibility barrel. नए repo tests को इसके बजाय focused local test subpaths जैसे `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, या `plugin-sdk/test-fixtures` import करने चाहिए |
    | `plugin-sdk/plugin-test-api` | repo test helper bridges import किए बिना direct plugin registration unit tests के लिए repo-local न्यूनतम `createTestPluginApi` helper |
    | `plugin-sdk/agent-runtime-test-contracts` | auth, delivery, fallback, tool-hook, prompt-overlay, schema, और transcript projection tests के लिए repo-local native agent-runtime adapter contract fixtures |
    | `plugin-sdk/channel-test-helpers` | generic actions/setup/status contracts, directory assertions, account startup lifecycle, send-config threading, runtime mocks, status issues, outbound delivery, और hook registration के लिए repo-local channel-oriented test helpers |
    | `plugin-sdk/channel-target-testing` | channel tests के लिए repo-local साझा target-resolution error-case suite |
    | `plugin-sdk/plugin-test-contracts` | repo-local plugin package, registration, public artifact, direct import, runtime API, और import side-effect contract helpers |
    | `plugin-sdk/provider-test-contracts` | repo-local provider runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch, और stream contract helpers |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` exercise करने वाले provider tests के लिए repo-local opt-in Vitest HTTP/auth mocks |
    | `plugin-sdk/test-fixtures` | repo-local generic CLI runtime capture, sandbox context, skill writer, agent-message, system-event, module reload, bundled plugin path, terminal-text, chunking, auth-token, और typed-case fixtures |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factories के भीतर उपयोग के लिए repo-local focused Node builtin mock helpers |
  </Accordion>

  <Accordion title="Memory उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helpers के लिए bundled memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | हल्के memory embedding provider registry helpers |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine exports |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding contracts, registry access, local provider, और generic batch/remote helpers. इस surface पर `registerMemoryEmbeddingProvider` अप्रचलित है; नए providers के लिए generic embedding provider API का उपयोग करें. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine exports |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine exports |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal helpers |
    | `plugin-sdk/memory-core-host-query` | Memory host query helpers |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret helpers |
    | `plugin-sdk/memory-core-host-events` | अप्रचलित compatibility alias; `plugin-sdk/memory-host-events` का उपयोग करें |
    | `plugin-sdk/memory-core-host-status` | Memory host status helpers |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI runtime helpers |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host core runtime helpers |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host file/runtime helpers |
    | `plugin-sdk/memory-host-core` | memory host core runtime helpers के लिए vendor-neutral alias |
    | `plugin-sdk/memory-host-events` | memory host event journal helpers के लिए vendor-neutral alias |
    | `plugin-sdk/memory-host-files` | अप्रचलित compatibility alias; `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
    | `plugin-sdk/memory-host-markdown` | memory-adjacent plugins के लिए साझा managed-markdown helpers |
    | `plugin-sdk/memory-host-search` | search-manager access के लिए Active Memory runtime facade |
    | `plugin-sdk/memory-host-status` | अप्रचलित compatibility alias; `plugin-sdk/memory-core-host-status` का उपयोग करें |
  </Accordion>

  <Accordion title="आरक्षित bundled-helper उपपथ">
    आरक्षित bundled-helper SDK उपपथ bundled plugin code के लिए संकीर्ण owner-specific surfaces हैं।
    उन्हें SDK inventory में track किया जाता है ताकि package
    builds और aliasing deterministic रहें, लेकिन वे सामान्य plugin
    authoring APIs नहीं हैं। नए reusable host contracts को generic SDK subpaths
    जैसे `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और
    `plugin-sdk/plugin-config-runtime` का उपयोग करना चाहिए।

    | उपपथ | owner और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | user MCP server config को Codex app-server thread config में project करने के लिए bundled Codex plugin helper |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server native subagents को OpenClaw task state में mirror करने के लिए bundled Codex plugin helper |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [plugins बनाना](/hi/plugins/building-plugins)
