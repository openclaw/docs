---
read_when:
    - Plugin import के लिए सही plugin-sdk subpath चुनना
    - बंडल किए गए Plugin उपपथों और सहायक सतहों का ऑडिट करना
summary: 'Plugin SDK उपपथ कैटलॉग: कौन-से इम्पोर्ट कहाँ रहते हैं, क्षेत्र के अनुसार समूहित'
title: Plugin SDK उपपथ
x-i18n:
    generated_at: "2026-07-01T08:05:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK को `openclaw/plugin-sdk/` के अंतर्गत संकरे सार्वजनिक उप-पथों के सेट के रूप में उजागर किया गया है। यह पृष्ठ सामान्य रूप से उपयोग किए जाने वाले उप-पथों को उद्देश्य के अनुसार समूहित करके सूचीबद्ध करता है। जनरेट की गई कंपाइलर प्रवेश-बिंदु सूची `scripts/lib/plugin-sdk-entrypoints.json` में रहती है; पैकेज निर्यात, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` में सूचीबद्ध रेपो-स्थानीय परीक्षण/आंतरिक उप-पथों को घटाने के बाद सार्वजनिक उपसमूह होते हैं। अनुरक्षक सार्वजनिक निर्यात संख्या का ऑडिट `pnpm plugin-sdk:surface` से और सक्रिय आरक्षित सहायक उप-पथों का ऑडिट `pnpm plugins:boundary-report:summary` से कर सकते हैं; अप्रयुक्त आरक्षित सहायक निर्यात सार्वजनिक SDK में निष्क्रिय संगतता ऋण के रूप में बने रहने के बजाय CI रिपोर्ट को विफल करते हैं।

Plugin लेखन मार्गदर्शिका के लिए, [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) देखें।

## Plugin प्रविष्टि

| उप-पथ                         | मुख्य निर्यात                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | माइग्रेशन प्रदाता आइटम सहायक जैसे `createMigrationItem`, कारण स्थिरांक, आइटम स्थिति मार्कर, रिडैक्शन सहायक, और `summarizeMigrationItems`                              |
| `plugin-sdk/migration-runtime` | रनटाइम माइग्रेशन सहायक जैसे `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, और `writeMigrationReport`                                                    |
| `plugin-sdk/health`            | बंडल किए गए स्वास्थ्य उपभोक्ताओं के लिए Doctor स्वास्थ्य-जाँच पंजीकरण, पहचान, मरम्मत, चयन, गंभीरता, और फाइंडिंग प्रकार                                                |

### अप्रचलित संगतता और परीक्षण सहायक

अप्रचलित उप-पथ पुराने Plugin के लिए निर्यातित रहते हैं, लेकिन नए कोड को नीचे दिए गए केंद्रित SDK उप-पथों का उपयोग करना चाहिए। अनुरक्षित सूची `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI इससे बंडल किए गए उत्पादन आयातों को अस्वीकार करता है। `compat`, `config-types`, `infra-runtime`, `text-runtime`, और `zod` जैसे व्यापक बैरल केवल संगतता के लिए हैं। `zod` को सीधे `zod` से आयात करें।

OpenClaw के Vitest-समर्थित परीक्षण-सहायक उप-पथ केवल रेपो-स्थानीय हैं और अब पैकेज निर्यात नहीं हैं: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, और `testing`।

### आरक्षित बंडल किए गए Plugin सहायक उप-पथ

ये उप-पथ अपने स्वामी बंडल किए गए Plugin के लिए Plugin-स्वामित्व वाली संगतता सतहें हैं, सामान्य SDK API नहीं: `plugin-sdk/codex-mcp-projection` और `plugin-sdk/codex-native-task-runtime`। क्रॉस-स्वामी एक्सटेंशन आयात पैकेज अनुबंध गार्डरेल द्वारा अवरुद्ध किए जाते हैं।

<AccordionGroup>
  <Accordion title="चैनल उपपथ">
    | उपपथ | मुख्य exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | रूट `openclaw.json` Zod स्कीमा export (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin-स्वामित्व वाले स्कीमा के लिए कैश किया गया JSON Schema सत्यापन हेल्पर |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विजार्ड हेल्पर, सेटअप अनुवादक, allowlist प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता alias; `plugin-sdk/setup-runtime` का उपयोग करें |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | बहु-अकाउंट कॉन्फिग/action-gate हेल्पर, डिफॉल्ट-अकाउंट fallback हेल्पर |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, अकाउंट-id सामान्यीकरण हेल्पर |
    | `plugin-sdk/account-resolution` | अकाउंट lookup + डिफॉल्ट-fallback हेल्पर |
    | `plugin-sdk/account-helpers` | संकीर्ण अकाउंट-list/acount-action हेल्पर |
    | `plugin-sdk/access-groups` | एक्सेस-ग्रुप allowlist पार्सिंग और redacted ग्रुप डायग्नॉस्टिक्स हेल्पर |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फिग स्कीमा primitives, साथ में Zod और सीधे JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | केवल अनुरक्षित bundled plugins के लिए bundled OpenClaw चैनल कॉन्फिग स्कीमा |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। Canonical bundled/official चैट चैनल ids, साथ में उन plugins के लिए formatter labels/aliases जिन्हें अपनी तालिका hardcode किए बिना envelope-prefixed टेक्स्ट पहचानना होता है। |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel कॉन्फिग स्कीमा के लिए अप्रचलित संगतता alias |
    | `plugin-sdk/telegram-command-config` | Telegram कस्टम-कमांड सामान्यीकरण/सत्यापन हेल्पर, bundled-contract fallback के साथ |
    | `plugin-sdk/command-gating` | संकीर्ण कमांड authorization gate हेल्पर |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | अप्रचलित निम्न-स्तरीय चैनल ingress संगतता फसाड। नए receive paths को `plugin-sdk/channel-ingress-runtime` का उपयोग करना चाहिए। |
    | `plugin-sdk/channel-ingress-runtime` | माइग्रेट किए गए चैनल receive paths के लिए प्रयोगात्मक उच्च-स्तरीय चैनल ingress runtime resolver और route fact builders। हर Plugin में effective allowlists, command allowlists, और legacy projections assemble करने के बजाय इसे प्राथमिकता दें। [Channel ingress API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश lifecycle contracts, साथ में reply pipeline options, receipts, live preview/streaming, lifecycle helpers, outbound identity, payload planning, durable sends, और message-send context helpers। [Channel outbound API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता alias, साथ में legacy reply-dispatch फसाड। |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता alias, साथ में legacy reply-dispatch फसाड। |
    | `plugin-sdk/inbound-envelope` | साझा inbound route + envelope builder helpers |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता फसाड। inbound runners और dispatch predicates के लिए `plugin-sdk/channel-inbound`, और message delivery helpers के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित target parsing alias; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | साझा outbound media loading और hosted-media state helpers |
    | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/poll-runtime` | संकीर्ण poll सामान्यीकरण हेल्पर |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycle और adapter helpers |
    | `plugin-sdk/agent-media-payload` | Legacy agent media payload builder |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding, pairing, और configured-binding helpers |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot helper |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy resolution helpers |
    | `plugin-sdk/channel-status` | साझा चैनल status snapshot/summary helpers |
    | `plugin-sdk/channel-config-primitives` | संकीर्ण चैनल config-schema primitives |
    | `plugin-sdk/channel-config-writes` | चैनल config-write authorization helpers |
    | `plugin-sdk/channel-plugin-common` | साझा चैनल Plugin prelude exports |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read helpers |
    | `plugin-sdk/group-access` | साझा group-access decision helpers |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-inbound` का उपयोग करें। |
    | `plugin-sdk/direct-dm-guard-policy` | संकीर्ण direct-DM pre-crypto guard policy helpers |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और tracked owner compatibility के लिए अप्रचलित Discord संगतता फसाड; नए plugins को generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | tracked owner compatibility के लिए अप्रचलित Telegram account-resolution संगतता फसाड; नए plugins को injected runtime helpers या generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/zalouser` | प्रकाशित Lark/Zalo packages के लिए अप्रचलित Zalo Personal संगतता फसाड जो अब भी sender command authorization import करते हैं; नए plugins को `plugin-sdk/command-auth` का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | Semantic message presentation, delivery, और legacy interactive reply helpers। [Message Presentation](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/channel-inbound` | event classification, context building, formatting, roots, debounce, mention matching, mention-policy, और inbound logging के लिए साझा inbound helpers |
    | `plugin-sdk/channel-inbound-debounce` | संकीर्ण inbound debounce helpers |
    | `plugin-sdk/channel-mention-gating` | व्यापक inbound runtime surface के बिना संकीर्ण mention-policy, mention marker, और mention text helpers |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-inbound` या `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-pairing-paths` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-pairing` का उपयोग करें। |
    | `plugin-sdk/channel-reply-options-runtime` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | Reply result types |
    | `plugin-sdk/channel-actions` | Channel message-action helpers, साथ में Plugin compatibility के लिए रखे गए अप्रचलित native schema helpers |
    | `plugin-sdk/channel-route` | साझा route normalization, parser-driven target resolution, thread-id stringification, dedupe/compact route keys, parsed-target types, और route/target comparison helpers |
    | `plugin-sdk/channel-targets` | Target parsing helpers; route comparison callers को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | Channel contract types |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | संकीर्ण secret-contract helpers जैसे `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, और secret target types |
  </Accordion>

अप्रचलित चैनल helper families केवल published-plugin
compatibility के लिए उपलब्ध रहती हैं। हटाने की योजना यह है: उन्हें external Plugin
migration window तक रखें, repo/bundled plugins को `channel-inbound` और
`channel-outbound` पर रखें, फिर अगले major
SDK cleanup में compatibility subpaths हटा दें। यह पुराने channel message/runtime, channel
streaming, direct-DM access, inbound helper splinter, reply-options,
और pairing-path families पर लागू होता है।

  <Accordion title="Provider subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | सेटअप, कैटलॉग खोज, और रनटाइम मॉडल तैयारी के लिए समर्थित LM Studio प्रदाता facade |
    | `plugin-sdk/lmstudio-runtime` | स्थानीय सर्वर defaults, मॉडल खोज, अनुरोध headers, और लोडेड-मॉडल helpers के लिए समर्थित LM Studio रनटाइम facade |
    | `plugin-sdk/provider-setup` | चयनित स्थानीय/स्व-होस्टेड प्रदाता सेटअप helpers |
    | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्व-होस्टेड प्रदाता सेटअप helpers |
    | `plugin-sdk/cli-backend` | CLI backend defaults + watchdog constants |
    | `plugin-sdk/provider-auth-runtime` | प्रदाता प्लगइन्स के लिए रनटाइम API-key resolution helpers |
    | `plugin-sdk/provider-oauth-runtime` | सामान्य प्रदाता OAuth callback types, callback-page rendering, PKCE/state helpers, authorization-input parsing, token-expiry helpers, और abort helpers |
    | `plugin-sdk/provider-auth-api-key` | API-key onboarding/profile-write helpers जैसे `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | मानक OAuth auth-result builder |
    | `plugin-sdk/provider-env-vars` | प्रदाता auth env-var lookup helpers |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex auth-import helpers, deprecated `resolveOpenClawAgentDir` compatibility export |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा replay-policy builders, provider-endpoint helpers, और साझा model-id normalization helpers |
    | `plugin-sdk/provider-catalog-live-runtime` | सुरक्षित `/models`-style खोज के लिए लाइव प्रदाता मॉडल कैटलॉग helpers: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model-id filtering, TTL cache, और static fallback |
    | `plugin-sdk/provider-catalog-runtime` | contract tests के लिए प्रदाता catalog augmentation runtime hook और plugin-provider registry seams |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | सामान्य प्रदाता HTTP/endpoint capability helpers, प्रदाता HTTP errors, और audio transcription multipart form helpers |
    | `plugin-sdk/provider-web-fetch-contract` | संकीर्ण web-fetch config/selection contract helpers जैसे `enablePluginInConfig` और `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch प्रदाता registration/cache helpers |
    | `plugin-sdk/provider-web-search-config-contract` | उन प्रदाताओं के लिए संकीर्ण web-search config/credential helpers जिन्हें plugin-enable wiring की आवश्यकता नहीं है |
    | `plugin-sdk/provider-web-search-contract` | संकीर्ण web-search config/credential contract helpers जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और scoped credential setters/getters |
    | `plugin-sdk/provider-web-search` | Web-search प्रदाता registration/cache/runtime helpers |
    | `plugin-sdk/embedding-providers` | सामान्य embedding प्रदाता types और read helpers, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, और `listEmbeddingProviders(...)` शामिल हैं; प्लगइन्स प्रदाताओं को `api.registerEmbeddingProvider(...)` के माध्यम से register करते हैं ताकि manifest ownership लागू हो |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
    | `plugin-sdk/provider-usage` | प्रदाता usage snapshot types, साझा usage fetch helpers, और `fetchClaudeUsage` जैसे प्रदाता fetchers |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper types, plain-text tool-call compat, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helpers |
    | `plugin-sdk/provider-stream-shared` | सार्वजनिक साझा प्रदाता stream wrapper helpers जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, और Anthropic/DeepSeek/OpenAI-compatible stream utilities शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | native प्रदाता transport helpers जैसे guarded fetch, tool-result text extraction, transport message transforms, और writable transport event streams |
    | `plugin-sdk/provider-onboard` | Onboarding config patch helpers |
    | `plugin-sdk/global-singleton` | Process-local singleton/map/cache helpers |
    | `plugin-sdk/group-activation` | संकीर्ण group activation mode और command parsing helpers |
  </Accordion>

प्रदाता उपयोग snapshots सामान्यतः एक या अधिक quota `windows` report करते हैं, जिनमें प्रत्येक में
एक label, उपयोग किया गया प्रतिशत, और वैकल्पिक reset time होता है। जो प्रदाता resettable quota windows के बजाय balance या
account-state text expose करते हैं, उन्हें fabricated percentages के बजाय
खाली `windows` array के साथ `summary` return करना चाहिए।
OpenClaw उस summary text को status output में दिखाता है; `error` का उपयोग केवल तब करें जब
usage endpoint विफल हो गया हो या उसने कोई उपयोगी usage data return न किया हो।

  <Accordion title="Auth and security subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry helpers जिनमें dynamic argument menu formatting, sender-authorization helpers शामिल हैं |
    | `plugin-sdk/command-status` | Command/help message builders जैसे `buildCommandsMessagePaginated` और `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Approver resolution और same-chat action-auth helpers |
    | `plugin-sdk/approval-client-runtime` | Native exec approval profile/filter helpers |
    | `plugin-sdk/approval-delivery-runtime` | Native approval capability/delivery adapters |
    | `plugin-sdk/approval-gateway-runtime` | साझा approval gateway-resolution helper |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoints के लिए lightweight native approval adapter loading helpers |
    | `plugin-sdk/approval-handler-runtime` | व्यापक approval handler runtime helpers; पर्याप्त होने पर संकीर्ण adapter/gateway seams को प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | Native approval target, account-binding, route-gate, forwarding fallback, और local native exec prompt suppression helpers |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin approval reply payload helpers |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval payload helpers, native approval routing/runtime helpers, और structured approval display helpers जैसे `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | संकीर्ण inbound reply dedupe reset helpers |
    | `plugin-sdk/channel-contract-testing` | broad testing barrel के बिना संकीर्ण channel contract test helpers |
    | `plugin-sdk/command-auth-native` | Native command auth, dynamic argument menu formatting, और native session-target helpers |
    | `plugin-sdk/command-detection` | साझा command detection helpers |
    | `plugin-sdk/command-primitives-runtime` | hot channel paths के लिए lightweight command text predicates |
    | `plugin-sdk/command-surface` | Command-body normalization और command-surface helpers |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret surfaces के लिए संकीर्ण secret-contract collection helpers |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config parsing के लिए संकीर्ण `coerceSecretRef` और SecretRef typing helpers |
    | `plugin-sdk/secret-provider-integration` | बाहरी secret provider presets publish करने वाले प्लगइन्स के लिए type-only SecretRef provider integration manifest और preset contracts |
    | `plugin-sdk/security-runtime` | साझा trust, DM gating, root-bounded file/path helpers जिनमें create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store helpers, symlink-parent guards, external-content, sensitive text redaction, constant-time secret comparison, और secret-collection helpers शामिल हैं |
    | `plugin-sdk/ssrf-policy` | Host allowlist और private-network SSRF policy helpers |
    | `plugin-sdk/ssrf-dispatcher` | broad infra runtime surface के बिना संकीर्ण pinned-dispatcher helpers |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error, और SSRF policy helpers |
    | `plugin-sdk/secret-input` | Secret input parsing helpers |
    | `plugin-sdk/webhook-ingress` | Webhook request/target helpers और raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Request body size/timeout helpers |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/runtime` | व्यापक runtime/logging/backup/plugin-install सहायक |
    | `plugin-sdk/runtime-env` | सीमित runtime env, logger, timeout, retry, और backoff सहायक |
    | `plugin-sdk/browser-config` | सामान्यीकृत profile/defaults, CDP URL parsing, और browser-control auth सहायकों के लिए समर्थित browser config facade |
    | `plugin-sdk/agent-harness-task-runtime` | host-जारी task scope का उपयोग करने वाले harness-backed agents के लिए सामान्य task lifecycle और completion delivery सहायक |
    | `plugin-sdk/codex-mcp-projection` | user MCP server config को Codex thread config में project करने के लिए आरक्षित bundled Codex सहायक; third-party plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | native task mirror/runtime wiring के लिए निजी bundled Codex सहायक; third-party plugins के लिए नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य channel runtime-context registration और lookup सहायक |
    | `plugin-sdk/matrix` | पुराने third-party channel packages के लिए deprecated Matrix compatibility facade; नए plugins को सीधे `plugin-sdk/run-command` import करना चाहिए |
    | `plugin-sdk/mattermost` | पुराने third-party channel packages के लिए deprecated Mattermost compatibility facade; नए plugins को सीधे generic SDK subpaths import करने चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | साझा plugin command/hook/http/interactive सहायक |
    | `plugin-sdk/hook-runtime` | साझा webhook/internal hook pipeline सहायक |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, और `createLazyRuntimeSurface` जैसे lazy runtime import/binding सहायक |
    | `plugin-sdk/process-runtime` | process exec सहायक |
    | `plugin-sdk/cli-runtime` | CLI formatting, wait, version, argument-invocation, और lazy command-group सहायक |
    | `plugin-sdk/qa-live-transport-scenarios` | साझा live transport QA scenario ids, baseline coverage सहायक, और scenario-selection सहायक |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले plugin HTTP routes के लिए आरक्षित Gateway method dispatch सहायक |
    | `plugin-sdk/gateway-runtime` | Gateway client, event-loop-ready client start सहायक, gateway CLI RPC, gateway protocol errors, और channel-status patch सहायक |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` और channel/provider config types जैसे plugin config shapes के लिए केंद्रित type-only config surface |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject`, और `resolveLivePluginConfigObject` जैसे runtime plugin-config lookup सहायक |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, और `logConfigUpdated` जैसे transactional config mutation सहायक |
    | `plugin-sdk/message-tool-delivery-hints` | साझा message-tool delivery metadata hint strings |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot`, और test snapshot setters जैसे वर्तमान process config snapshot सहायक |
    | `plugin-sdk/telegram-command-config` | Telegram command-name/description normalization और duplicate/conflict checks, तब भी जब bundled Telegram contract surface उपलब्ध न हो |
    | `plugin-sdk/text-autolink-runtime` | व्यापक text barrel के बिना file-reference autolink detection |
    | `plugin-sdk/approval-reaction-runtime` | hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval सहायक, approval-capability builders, auth/profile सहायक, native routing/runtime सहायक, और structured approval display path formatting |
    | `plugin-sdk/reply-runtime` | साझा inbound/reply runtime सहायक, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | सीमित reply dispatch/finalize और conversation-label सहायक |
    | `plugin-sdk/reply-history` | साझा short-window reply-history सहायक। नए message-turn code को `createChannelHistoryWindow` का उपयोग करना चाहिए; lower-level map helpers केवल deprecated compatibility exports बने रहते हैं |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | सीमित text/markdown chunking सहायक |
    | `plugin-sdk/session-store-runtime` | session identity के आधार पर Session workflow सहायक (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), bounded recent user/assistant transcript text reads, legacy session store path/session-key सहायक, updated-at reads, और transition-only whole-store/file-path compatibility सहायक |
    | `plugin-sdk/session-transcript-runtime` | Transcript identity, scoped target/read/write सहायक, update publishing, write locks, और transcript memory hit keys |
    | `plugin-sdk/sqlite-runtime` | first-party runtime के लिए केंद्रित SQLite agent-schema, path, और transaction सहायक |
    | `plugin-sdk/cron-store-runtime` | Cron store path/load/save सहायक |
    | `plugin-sdk/state-paths` | State/OAuth dir path सहायक |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite keyed-state types और plugin-owned databases के लिए केंद्रीकृत connection pragma और WAL maintenance setup |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, और `resolveDefaultAgentBoundAccountId` जैसे route/session-key/account binding सहायक |
    | `plugin-sdk/status-helpers` | साझा channel/account status summary सहायक, runtime-state defaults, और issue metadata सहायक |
    | `plugin-sdk/target-resolver-runtime` | साझा target resolver सहायक |
    | `plugin-sdk/string-normalization-runtime` | Slug/string normalization सहायक |
    | `plugin-sdk/request-url` | fetch/request जैसे inputs से string URLs निकालें |
    | `plugin-sdk/run-command` | सामान्यीकृत stdout/stderr results वाला timed command runner |
    | `plugin-sdk/param-readers` | सामान्य tool/CLI param readers |
    | `plugin-sdk/tool-plugin` | एक सरल typed agent-tool plugin परिभाषित करें और manifest generation के लिए static metadata expose करें |
    | `plugin-sdk/tool-payload` | tool result objects से सामान्यीकृत payloads निकालें |
    | `plugin-sdk/tool-send` | tool args से canonical send target fields निकालें |
    | `plugin-sdk/sandbox` | Sandbox backend types और SSH/OpenShell command helpers, जिनमें fail-fast exec command preflight शामिल है |
    | `plugin-sdk/temp-path` | साझा temp-download path सहायक और निजी secure temp workspaces |
    | `plugin-sdk/logging-core` | Subsystem logger और redaction सहायक |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode और conversion सहायक |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` जैसे model/session override सहायक |
    | `plugin-sdk/talk-config-runtime` | Talk provider config resolution सहायक |
    | `plugin-sdk/json-store` | छोटे JSON state read/write सहायक |
    | `plugin-sdk/json-unsafe-integers` | unsafe integer literals को strings के रूप में preserve करने वाले JSON parsing सहायक |
    | `plugin-sdk/file-lock` | Re-entrant file-lock सहायक |
    | `plugin-sdk/persistent-dedupe` | Disk-backed dedupe cache सहायक |
    | `plugin-sdk/acp-runtime` | ACP runtime/session और reply-dispatch सहायक |
    | `plugin-sdk/acp-runtime-backend` | startup-loaded plugins के लिए lightweight ACP backend registration और reply-dispatch सहायक |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup imports के बिना read-only ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | सीमित agent runtime config-schema primitives |
    | `plugin-sdk/boolean-param` | Loose boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name matching resolution सहायक |
    | `plugin-sdk/device-bootstrap` | Device bootstrap और pairing token सहायक |
    | `plugin-sdk/extension-shared` | साझा passive-channel, status, और ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply सहायक |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing सहायक |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize सहायक |
    | `plugin-sdk/agent-harness` | low-level agent harnesses के लिए experimental trusted-plugin surface: harness types, active-run steer/abort सहायक, OpenClaw tool bridge सहायक, runtime-plan tool policy सहायक, terminal outcome classification, tool progress formatting/detail सहायक, और attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | deprecated Z.AI provider-owned endpoint detection facade; Z.AI plugin public API का उपयोग करें |
    | `plugin-sdk/async-lock-runtime` | छोटी runtime state files के लिए process-local async lock सहायक |
    | `plugin-sdk/channel-activity-runtime` | Channel activity telemetry सहायक |
    | `plugin-sdk/concurrency-runtime` | Bounded async task concurrency सहायक |
    | `plugin-sdk/dedupe-runtime` | In-memory dedupe cache सहायक |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain सहायक |
    | `plugin-sdk/file-access-runtime` | Safe local-file और media-source path सहायक |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat wake, event, और visibility सहायक |
    | `plugin-sdk/number-runtime` | Numeric coercion सहायक |
    | `plugin-sdk/secure-random-runtime` | Secure token/UUID सहायक |
    | `plugin-sdk/system-event-runtime` | System event queue सहायक |
    | `plugin-sdk/transport-ready-runtime` | Transport readiness wait सहायक |
    | `plugin-sdk/exec-approvals-runtime` | व्यापक infra-runtime barrel के बिना exec approval policy file सहायक |
    | `plugin-sdk/infra-runtime` | Deprecated compatibility shim; ऊपर दिए गए focused runtime subpaths का उपयोग करें |
    | `plugin-sdk/collection-runtime` | छोटे bounded cache सहायक |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flag, event, और trace-context सहायक |
    | `plugin-sdk/error-runtime` | Error graph, formatting, साझा error classification सहायक, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, EnvHttpProxyAgent option, और pinned lookup सहायक |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch imports के बिना dispatcher-aware runtime fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | व्यापक media runtime surface के बिना inline image data URL sanitizer और signature sniffing सहायक |
    | `plugin-sdk/response-limit-runtime` | व्यापक media runtime surface के बिना bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routing या pairing stores के बिना वर्तमान conversation binding state |
    | `plugin-sdk/session-store-runtime` | व्यापक config writes/maintenance imports के बिना session-store सहायक |
    | `plugin-sdk/sqlite-runtime` | database lifecycle controls के बिना केंद्रित SQLite agent-schema, path, और transaction सहायक |
    | `plugin-sdk/context-visibility-runtime` | व्यापक config/security imports के बिना context visibility resolution और supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging imports के बिना सीमित primitive record/string coercion और normalization सहायक |
    | `plugin-sdk/host-runtime` | Hostname और SCP host normalization सहायक |
    | `plugin-sdk/retry-runtime` | Retry config और retry runner सहायक |
    | `plugin-sdk/agent-runtime` | Agent dir/identity/workspace सहायक, जिनमें `resolveAgentDir`, `resolveDefaultAgentDir`, और deprecated `resolveOpenClawAgentDir` compatibility export शामिल हैं |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/media-runtime` | साझा मीडिया fetch/transform/store सहायक, जिनमें `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और अप्रचलित `fetchRemoteMedia` शामिल हैं; जब किसी URL को OpenClaw मीडिया बनना हो, तो बफर पढ़ने से पहले store सहायकों को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | संकीर्ण MIME सामान्यीकरण, फ़ाइल-एक्सटेंशन मैपिंग, MIME पहचान, और मीडिया-प्रकार सहायक |
    | `plugin-sdk/media-store` | संकीर्ण मीडिया store सहायक, जैसे `saveMediaBuffer` और `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन failover सहायक, उम्मीदवार चयन, और अनुपस्थित-मॉडल संदेश |
    | `plugin-sdk/media-understanding` | मीडिया understanding provider प्रकार और provider-facing image/audio/structured-extraction सहायक निर्यात |
    | `plugin-sdk/text-chunking` | टेक्स्ट और markdown chunking/render सहायक, markdown तालिका रूपांतरण, directive-tag हटाना, और safe-text उपयोगिताएं |
    | `plugin-sdk/text-chunking` | आउटबाउंड टेक्स्ट chunking सहायक |
    | `plugin-sdk/speech` | Speech provider प्रकार और provider-facing directive, registry, validation, OpenAI-compatible TTS builder, तथा speech सहायक निर्यात |
    | `plugin-sdk/speech-core` | साझा speech provider प्रकार, registry, directive, normalization, और speech सहायक निर्यात |
    | `plugin-sdk/realtime-transcription` | Realtime transcription provider प्रकार, registry सहायक, और साझा WebSocket session सहायक |
    | `plugin-sdk/realtime-bootstrap-context` | सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` context injection के लिए realtime profile bootstrap सहायक |
    | `plugin-sdk/realtime-voice` | Realtime voice provider प्रकार, registry सहायक, और साझा realtime voice व्यवहार सहायक, जिनमें output activity tracking शामिल है |
    | `plugin-sdk/image-generation` | Image generation provider प्रकार और image asset/data URL सहायक, तथा OpenAI-compatible image provider builder |
    | `plugin-sdk/image-generation-core` | साझा image-generation प्रकार, failover, auth, और registry सहायक |
    | `plugin-sdk/music-generation` | Music generation provider/request/result प्रकार |
    | `plugin-sdk/music-generation-core` | साझा music-generation प्रकार, failover सहायक, provider lookup, और model-ref parsing |
    | `plugin-sdk/video-generation` | Video generation provider/request/result प्रकार |
    | `plugin-sdk/video-generation-core` | साझा video-generation प्रकार, failover सहायक, provider lookup, और model-ref parsing |
    | `plugin-sdk/transcripts` | साझा transcripts source provider प्रकार, registry सहायक, session descriptors, और utterance metadata |
    | `plugin-sdk/webhook-targets` | Webhook target registry और route-install सहायक |
    | `plugin-sdk/webhook-path` | अप्रचलित compatibility alias; `plugin-sdk/webhook-ingress` का उपयोग करें |
    | `plugin-sdk/web-media` | साझा remote/local media loading सहायक |
    | `plugin-sdk/zod` | अप्रचलित compatibility re-export; `zod` को सीधे `zod` से import करें |
    | `plugin-sdk/testing` | legacy OpenClaw tests के लिए repo-local अप्रचलित compatibility barrel. नए repo tests को इसके बजाय केंद्रित local test subpaths से import करना चाहिए, जैसे `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, या `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | repo test helper bridges import किए बिना direct plugin registration unit tests के लिए repo-local न्यूनतम `createTestPluginApi` सहायक |
    | `plugin-sdk/agent-runtime-test-contracts` | auth, delivery, fallback, tool-hook, prompt-overlay, schema, और transcript projection tests के लिए repo-local native agent-runtime adapter contract fixtures |
    | `plugin-sdk/channel-test-helpers` | generic actions/setup/status contracts, directory assertions, account startup lifecycle, send-config threading, runtime mocks, status issues, outbound delivery, और hook registration के लिए repo-local channel-oriented test helpers |
    | `plugin-sdk/channel-target-testing` | channel tests के लिए repo-local साझा target-resolution error-case suite |
    | `plugin-sdk/plugin-test-contracts` | repo-local plugin package, registration, public artifact, direct import, runtime API, और import side-effect contract helpers |
    | `plugin-sdk/provider-test-contracts` | repo-local provider runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch, और stream contract helpers |
    | `plugin-sdk/provider-http-test-mocks` | provider tests के लिए repo-local opt-in Vitest HTTP/auth mocks, जो `plugin-sdk/provider-http` का अभ्यास करते हैं |
    | `plugin-sdk/test-fixtures` | repo-local generic CLI runtime capture, sandbox context, skill writer, agent-message, system-event, module reload, bundled plugin path, terminal-text, chunking, auth-token, और typed-case fixtures |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factories के अंदर उपयोग के लिए repo-local केंद्रित Node builtin mock helpers |
  </Accordion>

  <Accordion title="Memory उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI सहायकों के लिए bundled memory-core helper surface |
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
    इन्हें SDK inventory में track किया जाता है ताकि package builds और aliasing deterministic रहें,
    लेकिन ये सामान्य plugin authoring APIs नहीं हैं। नए reusable host contracts को generic SDK subpaths
    जैसे `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और
    `plugin-sdk/plugin-config-runtime` का उपयोग करना चाहिए।

    | उपपथ | स्वामी और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | user MCP server config को Codex app-server thread config में project करने के लिए bundled Codex plugin helper |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server native subagents को OpenClaw task state में mirror करने के लिए bundled Codex plugin helper |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
