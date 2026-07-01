---
read_when:
    - Plugin आयात के लिए सही plugin-sdk उपपथ चुनना
    - बंडल किए गए Plugin उप-पथों और सहायक सतहों का ऑडिट करना
summary: 'Plugin SDK उपपथ कैटलॉग: कौन-से imports कहाँ रहते हैं, क्षेत्र के अनुसार समूहित'
title: Plugin SDK उपपथ
x-i18n:
    generated_at: "2026-07-01T20:20:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK को `openclaw/plugin-sdk/` के अंतर्गत संकरे सार्वजनिक उप-पथों के सेट के रूप में उजागर किया जाता है। यह पृष्ठ उद्देश्य के अनुसार समूहित सामान्यतः उपयोग किए जाने वाले उप-पथों की सूची देता है। जनरेट की गई compiler entrypoint inventory `scripts/lib/plugin-sdk-entrypoints.json` में रहती है; पैकेज निर्यात `scripts/lib/plugin-sdk-private-local-only-subpaths.json` में सूचीबद्ध रेपो-स्थानीय test/internal उप-पथों को घटाने के बाद सार्वजनिक उपसमुच्चय हैं। अनुरक्षक सार्वजनिक निर्यात संख्या को `pnpm plugin-sdk:surface` से और सक्रिय आरक्षित helper उप-पथों को `pnpm plugins:boundary-report:summary` से ऑडिट कर सकते हैं; अप्रयुक्त आरक्षित helper निर्यात सार्वजनिक SDK में निष्क्रिय संगतता ऋण के रूप में बने रहने के बजाय CI रिपोर्ट को विफल करते हैं।

Plugin authoring guide के लिए, [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) देखें।

## Plugin प्रविष्टि

| उप-पथ                        | मुख्य निर्यात                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Migration provider item helpers जैसे `createMigrationItem`, कारण constants, item status markers, redaction helpers, और `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Runtime migration helpers जैसे `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, और `writeMigrationReport`                                              |
| `plugin-sdk/health`            | bundled health consumers के लिए Doctor health-check registration, detection, repair, selection, severity, और finding types                                               |

### पदावनत संगतता और test helpers

पदावनत उप-पथ पुराने plugins के लिए निर्यातित रहते हैं, लेकिन नए code को नीचे दिए गए केंद्रित SDK उप-पथों का उपयोग करना चाहिए। अनुरक्षित सूची `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI इससे bundled production imports को अस्वीकार करता है। व्यापक barrels जैसे `compat`, `config-types`, `infra-runtime`, `text-runtime`, और `zod` केवल संगतता के लिए हैं। `zod` को सीधे `zod` से import करें।

OpenClaw के Vitest-backed test-helper उप-पथ केवल रेपो-स्थानीय हैं और अब पैकेज निर्यात नहीं हैं: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, और `testing`।

### आरक्षित bundled Plugin helper उप-पथ

ये उप-पथ उनके स्वामित्व वाले bundled Plugin के लिए Plugin-स्वामित्व वाली संगतता surfaces हैं, सामान्य SDK APIs नहीं: `plugin-sdk/codex-mcp-projection` और `plugin-sdk/codex-native-task-runtime`। Cross-owner extension imports को package contract guardrails द्वारा रोका जाता है।

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | उप-पथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | रूट `openclaw.json` Zod स्कीमा निर्यात (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin-स्वामित्व वाले स्कीमा के लिए कैश किया गया JSON Schema सत्यापन सहायक |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विजार्ड सहायक, सेटअप अनुवादक, allowlist प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता उपनाम; `plugin-sdk/setup-runtime` का उपयोग करें |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | बहु-खाता कॉन्फिग/action-gate सहायक, डिफ़ॉल्ट-खाता fallback सहायक |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id सामान्यीकरण सहायक |
    | `plugin-sdk/account-resolution` | खाता lookup + डिफ़ॉल्ट-fallback सहायक |
    | `plugin-sdk/account-helpers` | संकीर्ण account-list/account-action सहायक |
    | `plugin-sdk/access-groups` | access-group allowlist पार्सिंग और संपादित समूह निदान सहायक |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फिग स्कीमा प्रिमिटिव, साथ में Zod और प्रत्यक्ष JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | केवल संधारित bundled plugins के लिए bundled OpenClaw चैनल कॉन्फिग स्कीमा |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। कैनोनिकल bundled/आधिकारिक चैट चैनल id, साथ में उन plugins के लिए formatter labels/aliases जिन्हें अपनी तालिका hardcode किए बिना envelope-prefixed टेक्स्ट पहचानने की आवश्यकता होती है। |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel कॉन्फिग स्कीमा के लिए अप्रचलित संगतता उपनाम |
    | `plugin-sdk/telegram-command-config` | bundled-contract fallback के साथ Telegram custom-command सामान्यीकरण/सत्यापन सहायक |
    | `plugin-sdk/command-gating` | संकीर्ण कमांड प्राधिकरण gate सहायक |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | अप्रचलित निम्न-स्तरीय चैनल ingress संगतता फसाड। नए receive पथों को `plugin-sdk/channel-ingress-runtime` का उपयोग करना चाहिए। |
    | `plugin-sdk/channel-ingress-runtime` | माइग्रेट किए गए चैनल receive पथों के लिए प्रायोगिक उच्च-स्तरीय चैनल ingress runtime resolver और route fact builders। प्रत्येक Plugin में effective allowlists, command allowlists, और legacy projections को जोड़ने के बजाय इसे प्राथमिकता दें। [Channel ingress API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश lifecycle अनुबंध, साथ में reply pipeline options, receipts, live preview/streaming, lifecycle helpers, outbound identity, payload planning, durable sends, और message-send context helpers। [Channel outbound API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम, साथ में legacy reply-dispatch फसाड। |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम, साथ में legacy reply-dispatch फसाड। |
    | `plugin-sdk/inbound-envelope` | साझा inbound route + envelope builder सहायक |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता फसाड। inbound runners और dispatch predicates के लिए `plugin-sdk/channel-inbound` का उपयोग करें, और message delivery helpers के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित target parsing उपनाम; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | साझा outbound media loading और hosted-media state सहायक |
    | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/poll-runtime` | संकीर्ण poll normalization सहायक |
    | `plugin-sdk/thread-bindings-runtime` | thread-binding lifecycle और adapter सहायक |
    | `plugin-sdk/agent-media-payload` | legacy agent media payload builder |
    | `plugin-sdk/conversation-runtime` | conversation/thread binding, pairing, और configured-binding सहायक |
    | `plugin-sdk/runtime-config-snapshot` | runtime config snapshot सहायक |
    | `plugin-sdk/runtime-group-policy` | runtime group-policy resolution सहायक |
    | `plugin-sdk/channel-status` | साझा चैनल स्थिति snapshot/summary सहायक |
    | `plugin-sdk/channel-config-primitives` | संकीर्ण चैनल config-schema प्रिमिटिव |
    | `plugin-sdk/channel-config-writes` | चैनल config-write authorization सहायक |
    | `plugin-sdk/channel-plugin-common` | साझा चैनल Plugin prelude निर्यात |
    | `plugin-sdk/allowlist-config-edit` | allowlist config edit/read सहायक |
    | `plugin-sdk/group-access` | साझा group-access decision सहायक |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-inbound` का उपयोग करें। |
    | `plugin-sdk/direct-dm-guard-policy` | संकीर्ण direct-DM pre-crypto guard policy सहायक |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और ट्रैक की गई owner compatibility के लिए अप्रचलित Discord संगतता फसाड; नए plugins को generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | ट्रैक की गई owner compatibility के लिए अप्रचलित Telegram account-resolution संगतता फसाड; नए plugins को injected runtime helpers या generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/zalouser` | प्रकाशित Lark/Zalo packages के लिए अप्रचलित Zalo Personal संगतता फसाड, जो अब भी sender command authorization आयात करते हैं; नए plugins को `plugin-sdk/command-auth` का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | अर्थपूर्ण message presentation, delivery, और legacy interactive reply सहायक। [Message Presentation](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/channel-inbound` | event classification, context building, formatting, roots, debounce, mention matching, mention-policy, और inbound logging के लिए साझा inbound सहायक |
    | `plugin-sdk/channel-inbound-debounce` | संकीर्ण inbound debounce सहायक |
    | `plugin-sdk/channel-mention-gating` | व्यापक inbound runtime surface के बिना संकीर्ण mention-policy, mention marker, और mention text सहायक |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-inbound` या `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-pairing-paths` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-pairing` का उपयोग करें। |
    | `plugin-sdk/channel-reply-options-runtime` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | reply result types |
    | `plugin-sdk/channel-actions` | चैनल message-action सहायक, साथ में Plugin संगतता के लिए रखे गए अप्रचलित native schema helpers |
    | `plugin-sdk/channel-route` | साझा route normalization, parser-driven target resolution, thread-id stringification, dedupe/compact route keys, parsed-target types, और route/target comparison helpers |
    | `plugin-sdk/channel-targets` | target parsing सहायक; route comparison callers को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | चैनल contract types |
    | `plugin-sdk/channel-feedback` | feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | संकीर्ण secret-contract सहायक जैसे `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, और secret target types |
  </Accordion>

अप्रचलित चैनल हेल्पर परिवार केवल प्रकाशित-Plugin संगतता के लिए उपलब्ध रहते हैं। हटाने की योजना यह है: बाहरी Plugin माइग्रेशन अवधि तक उन्हें बनाए रखें, repo/bundled plugins को `channel-inbound` और `channel-outbound` पर रखें, फिर अगले बड़े SDK cleanup में संगतता subpaths हटा दें। यह पुराने चैनल message/runtime, चैनल streaming, direct-DM access, inbound helper splinter, reply-options, और pairing-path परिवारों पर लागू होता है।

  <Accordion title="प्रदाता उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | सेटअप, कैटलॉग खोज, और रनटाइम मॉडल तैयारी के लिए समर्थित LM Studio प्रदाता facade |
    | `plugin-sdk/lmstudio-runtime` | स्थानीय सर्वर डिफॉल्ट, मॉडल खोज, अनुरोध हेडर, और लोडेड-मॉडल सहायकों के लिए समर्थित LM Studio रनटाइम facade |
    | `plugin-sdk/provider-setup` | चुने हुए स्थानीय/स्व-होस्टेड प्रदाता सेटअप सहायक |
    | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्व-होस्टेड प्रदाता सेटअप सहायक |
    | `plugin-sdk/cli-backend` | CLI बैकएंड डिफॉल्ट + watchdog स्थिरांक |
    | `plugin-sdk/provider-auth-runtime` | प्रदाता plugins के लिए रनटाइम API-key resolution सहायक |
    | `plugin-sdk/provider-oauth-runtime` | सामान्य प्रदाता OAuth callback प्रकार, callback-page rendering, PKCE/state सहायक, authorization-input parsing, token-expiry सहायक, और abort सहायक |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` जैसे API-key onboarding/profile-write सहायक |
    | `plugin-sdk/provider-auth-result` | मानक OAuth auth-result builder |
    | `plugin-sdk/provider-env-vars` | प्रदाता auth env-var lookup सहायक |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex auth-import सहायक, अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा replay-policy builders, provider-endpoint सहायक, और साझा model-id normalization सहायक |
    | `plugin-sdk/provider-catalog-live-runtime` | संरक्षित `/models`-शैली खोज के लिए live provider model catalog सहायक: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model-id filtering, TTL cache, और static fallback |
    | `plugin-sdk/provider-catalog-runtime` | अनुबंध tests के लिए प्रदाता catalog augmentation runtime hook और plugin-provider registry seams |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | सामान्य प्रदाता HTTP/endpoint capability सहायक, प्रदाता HTTP त्रुटियां, और audio transcription multipart form सहायक |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` और `WebFetchProviderPlugin` जैसे संकीर्ण web-fetch config/selection contract सहायक |
    | `plugin-sdk/provider-web-fetch` | Web-fetch प्रदाता registration/cache सहायक |
    | `plugin-sdk/provider-web-search-config-contract` | उन प्रदाताओं के लिए संकीर्ण web-search config/credential सहायक जिन्हें plugin-enable wiring की जरूरत नहीं है |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और scoped credential setters/getters जैसे संकीर्ण web-search config/credential contract सहायक |
    | `plugin-sdk/provider-web-search` | Web-search प्रदाता registration/cache/runtime सहायक |
    | `plugin-sdk/embedding-providers` | सामान्य embedding provider प्रकार और read सहायक, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, और `listEmbeddingProviders(...)` शामिल हैं; plugins `api.registerEmbeddingProvider(...)` के माध्यम से प्रदाता register करते हैं ताकि manifest ownership लागू रहे |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
    | `plugin-sdk/provider-usage` | प्रदाता usage snapshot प्रकार, साझा usage fetch सहायक, और `fetchClaudeUsage` जैसे provider fetchers |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper प्रकार, plain-text tool-call compat, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper सहायक |
    | `plugin-sdk/provider-stream-shared` | सार्वजनिक साझा प्रदाता stream wrapper सहायक जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, और Anthropic/DeepSeek/OpenAI-compatible stream utilities शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch, tool-result text extraction, transport message transforms, और writable transport event streams जैसे native provider transport सहायक |
    | `plugin-sdk/provider-onboard` | Onboarding config patch सहायक |
    | `plugin-sdk/global-singleton` | Process-local singleton/map/cache सहायक |
    | `plugin-sdk/group-activation` | संकीर्ण group activation mode और command parsing सहायक |
  </Accordion>

प्रदाता उपयोग snapshots सामान्यतः एक या अधिक quota `windows` रिपोर्ट करते हैं, प्रत्येक में
एक label, उपयोग किया गया प्रतिशत, और वैकल्पिक reset समय होता है। वे प्रदाता जो resettable quota windows के बजाय balance या
account-state text उजागर करते हैं, उन्हें प्रतिशत गढ़ने के बजाय
खाली `windows` array के साथ `summary` लौटाना चाहिए।
OpenClaw उस summary text को status output में दिखाता है; `error` का उपयोग केवल तब करें जब
usage endpoint विफल हुआ हो या उसने कोई उपयोग योग्य usage data न लौटाया हो।

  <Accordion title="Auth और security उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, dynamic argument menu formatting सहित command registry सहायक, sender-authorization सहायक |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` और `buildHelpMessage` जैसे command/help message builders |
    | `plugin-sdk/approval-auth-runtime` | Approver resolution और same-chat action-auth सहायक |
    | `plugin-sdk/approval-client-runtime` | Native exec approval profile/filter सहायक |
    | `plugin-sdk/approval-delivery-runtime` | Native approval capability/delivery adapters |
    | `plugin-sdk/approval-gateway-runtime` | साझा approval gateway-resolution सहायक |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoints के लिए हल्के native approval adapter loading सहायक |
    | `plugin-sdk/approval-handler-runtime` | विस्तृत approval handler runtime सहायक; जब संकरे adapter/gateway seams पर्याप्त हों तो उन्हें प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | Native approval target, account-binding, route-gate, forwarding fallback, और local native exec prompt suppression सहायक |
    | `plugin-sdk/approval-reaction-runtime` | hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin approval reply payload सहायक |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval payload सहायक, native approval routing/runtime सहायक, और `formatApprovalDisplayPath` जैसे structured approval display सहायक |
    | `plugin-sdk/reply-dedupe` | संकीर्ण inbound reply dedupe reset सहायक |
    | `plugin-sdk/channel-contract-testing` | broad testing barrel के बिना संकीर्ण channel contract test सहायक |
    | `plugin-sdk/command-auth-native` | Native command auth, dynamic argument menu formatting, और native session-target सहायक |
    | `plugin-sdk/command-detection` | साझा command detection सहायक |
    | `plugin-sdk/command-primitives-runtime` | hot channel paths के लिए हल्के command text predicates |
    | `plugin-sdk/command-surface` | Command-body normalization और command-surface सहायक |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | private channel और Web UI device-code pairing के लिए lazy provider auth login flow सहायक |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret surfaces के लिए संकीर्ण secret-contract collection सहायक |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config parsing के लिए संकीर्ण `coerceSecretRef` और SecretRef typing सहायक |
    | `plugin-sdk/secret-provider-integration` | external secret provider presets प्रकाशित करने वाले plugins के लिए type-only SecretRef provider integration manifest और preset contracts |
    | `plugin-sdk/security-runtime` | साझा trust, DM gating, root-bounded file/path सहायक जिनमें create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store सहायक, symlink-parent guards, external-content, sensitive text redaction, constant-time secret comparison, और secret-collection सहायक शामिल हैं |
    | `plugin-sdk/ssrf-policy` | Host allowlist और private-network SSRF policy सहायक |
    | `plugin-sdk/ssrf-dispatcher` | broad infra runtime surface के बिना संकीर्ण pinned-dispatcher सहायक |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error, और SSRF policy सहायक |
    | `plugin-sdk/secret-input` | Secret input parsing सहायक |
    | `plugin-sdk/webhook-ingress` | Webhook request/target सहायक और raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Request body size/timeout सहायक |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/runtime` | व्यापक रनटाइम/लॉगिंग/बैकअप/Plugin-इंस्टॉल सहायक |
    | `plugin-sdk/runtime-env` | संकीर्ण रनटाइम env, logger, timeout, retry, और backoff सहायक |
    | `plugin-sdk/browser-config` | सामान्यीकृत प्रोफ़ाइल/डिफ़ॉल्ट, CDP URL पार्सिंग, और browser-control auth सहायकों के लिए समर्थित ब्राउज़र config फसाड |
    | `plugin-sdk/agent-harness-task-runtime` | host द्वारा जारी task scope का उपयोग करने वाले harness-backed agents के लिए सामान्य task lifecycle और completion delivery सहायक |
    | `plugin-sdk/codex-mcp-projection` | उपयोगकर्ता MCP server config को Codex thread config में प्रोजेक्ट करने के लिए आरक्षित bundled Codex सहायक; तृतीय-पक्ष Plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | native task mirror/runtime wiring के लिए निजी bundled Codex सहायक; तृतीय-पक्ष Plugins के लिए नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य channel runtime-context पंजीकरण और lookup सहायक |
    | `plugin-sdk/matrix` | पुराने तृतीय-पक्ष channel packages के लिए deprecated Matrix compatibility फसाड; नए Plugins को सीधे `plugin-sdk/run-command` import करना चाहिए |
    | `plugin-sdk/mattermost` | पुराने तृतीय-पक्ष channel packages के लिए deprecated Mattermost compatibility फसाड; नए Plugins को generic SDK subpaths सीधे import करने चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | साझा Plugin command/hook/http/interactive सहायक |
    | `plugin-sdk/hook-runtime` | साझा Webhook/internal hook pipeline सहायक |
    | `plugin-sdk/lazy-runtime` | लेज़ी runtime import/binding सहायक जैसे `createLazyRuntimeModule`, `createLazyRuntimeMethod`, और `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | process exec सहायक |
    | `plugin-sdk/cli-runtime` | CLI formatting, wait, version, argument-invocation, और lazy command-group सहायक |
    | `plugin-sdk/qa-live-transport-scenarios` | साझा live transport QA scenario ids, baseline coverage सहायक, और scenario-selection सहायक |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले Plugin HTTP routes के लिए आरक्षित Gateway method dispatch सहायक |
    | `plugin-sdk/gateway-runtime` | Gateway client, event-loop-ready client start सहायक, Gateway CLI RPC, Gateway protocol errors, advertised LAN host resolution, और channel-status patch सहायक |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` और channel/provider config types जैसे Plugin config shapes के लिए केंद्रित type-only config surface |
    | `plugin-sdk/plugin-config-runtime` | रनटाइम Plugin-config lookup सहायक जैसे `requireRuntimeConfig`, `resolvePluginConfigObject`, और `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | transactional config mutation सहायक जैसे `mutateConfigFile`, `replaceConfigFile`, और `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | साझा message-tool delivery metadata hint strings |
    | `plugin-sdk/runtime-config-snapshot` | मौजूदा process config snapshot सहायक जैसे `getRuntimeConfig`, `getRuntimeConfigSnapshot`, और test snapshot setters |
    | `plugin-sdk/telegram-command-config` | Telegram command-name/description normalization और duplicate/conflict checks, तब भी जब bundled Telegram contract surface उपलब्ध न हो |
    | `plugin-sdk/text-autolink-runtime` | व्यापक text barrel के बिना file-reference autolink detection |
    | `plugin-sdk/approval-reaction-runtime` | hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-runtime` | Exec/Plugin approval सहायक, approval-capability builders, auth/profile सहायक, native routing/runtime सहायक, और structured approval display path formatting |
    | `plugin-sdk/reply-runtime` | साझा inbound/reply runtime सहायक, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण reply dispatch/finalize और conversation-label सहायक |
    | `plugin-sdk/reply-history` | साझा short-window reply-history सहायक। नए message-turn code को `createChannelHistoryWindow` का उपयोग करना चाहिए; lower-level map सहायक केवल deprecated compatibility exports बने रहते हैं |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | संकीर्ण text/markdown chunking सहायक |
    | `plugin-sdk/session-store-runtime` | session workflow सहायक (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), session identity द्वारा bounded recent user/assistant transcript text reads, legacy session store path/session-key सहायक, updated-at reads, और transition-only whole-store/file-path compatibility सहायक |
    | `plugin-sdk/session-transcript-runtime` | transcript identity, scoped target/read/write सहायक, update publishing, write locks, और transcript memory hit keys |
    | `plugin-sdk/sqlite-runtime` | first-party runtime के लिए केंद्रित SQLite agent-schema, path, और transaction सहायक |
    | `plugin-sdk/cron-store-runtime` | Cron store path/load/save सहायक |
    | `plugin-sdk/state-paths` | State/OAuth dir path सहायक |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite keyed-state types और Plugin-owned databases के लिए केंद्रीकृत connection pragma और WAL maintenance setup |
    | `plugin-sdk/routing` | route/session-key/account binding सहायक जैसे `resolveAgentRoute`, `buildAgentSessionKey`, और `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | साझा channel/account status summary सहायक, runtime-state defaults, और issue metadata सहायक |
    | `plugin-sdk/target-resolver-runtime` | साझा target resolver सहायक |
    | `plugin-sdk/string-normalization-runtime` | slug/string normalization सहायक |
    | `plugin-sdk/request-url` | fetch/request-जैसे inputs से string URLs निकालें |
    | `plugin-sdk/run-command` | सामान्यीकृत stdout/stderr results वाला timed command runner |
    | `plugin-sdk/param-readers` | सामान्य tool/CLI param readers |
    | `plugin-sdk/tool-plugin` | एक सरल typed agent-tool Plugin परिभाषित करें और manifest generation के लिए static metadata expose करें |
    | `plugin-sdk/tool-payload` | tool result objects से सामान्यीकृत payloads निकालें |
    | `plugin-sdk/tool-send` | tool args से canonical send target fields निकालें |
    | `plugin-sdk/sandbox` | Sandbox backend types और SSH/OpenShell command सहायक, जिसमें fail-fast exec command preflight शामिल है |
    | `plugin-sdk/temp-path` | साझा temp-download path सहायक और निजी secure temp workspaces |
    | `plugin-sdk/logging-core` | subsystem logger और redaction सहायक |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode और conversion सहायक |
    | `plugin-sdk/model-session-runtime` | model/session override सहायक जैसे `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk provider config resolution सहायक |
    | `plugin-sdk/json-store` | छोटे JSON state read/write सहायक |
    | `plugin-sdk/json-unsafe-integers` | JSON parsing सहायक जो unsafe integer literals को strings के रूप में सुरक्षित रखते हैं |
    | `plugin-sdk/file-lock` | re-entrant file-lock सहायक |
    | `plugin-sdk/persistent-dedupe` | disk-backed dedupe cache सहायक |
    | `plugin-sdk/acp-runtime` | ACP runtime/session और reply-dispatch सहायक |
    | `plugin-sdk/acp-runtime-backend` | startup-loaded Plugins के लिए lightweight ACP backend registration और reply-dispatch सहायक |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup imports के बिना read-only ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | संकीर्ण agent runtime config-schema primitives |
    | `plugin-sdk/boolean-param` | loose boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | dangerous-name matching resolution सहायक |
    | `plugin-sdk/device-bootstrap` | device bootstrap और pairing token सहायक |
    | `plugin-sdk/extension-shared` | साझा passive-channel, status, और ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply सहायक |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing सहायक |
    | `plugin-sdk/native-command-registry` | native command registry/build/serialize सहायक |
    | `plugin-sdk/agent-harness` | low-level agent harnesses के लिए experimental trusted-Plugin surface: harness types, active-run steer/abort सहायक, OpenClaw tool bridge सहायक, runtime-plan tool policy सहायक, terminal outcome classification, tool progress formatting/detail सहायक, और attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | deprecated Z.AI provider-owned endpoint detection फसाड; Z.AI Plugin public API का उपयोग करें |
    | `plugin-sdk/async-lock-runtime` | छोटे runtime state files के लिए process-local async lock सहायक |
    | `plugin-sdk/channel-activity-runtime` | channel activity telemetry सहायक |
    | `plugin-sdk/concurrency-runtime` | bounded async task concurrency सहायक |
    | `plugin-sdk/dedupe-runtime` | in-memory dedupe cache सहायक |
    | `plugin-sdk/delivery-queue-runtime` | outbound pending-delivery drain सहायक |
    | `plugin-sdk/file-access-runtime` | सुरक्षित local-file और media-source path सहायक |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat wake, event, और visibility सहायक |
    | `plugin-sdk/number-runtime` | numeric coercion सहायक |
    | `plugin-sdk/secure-random-runtime` | secure token/UUID सहायक |
    | `plugin-sdk/system-event-runtime` | system event queue सहायक |
    | `plugin-sdk/transport-ready-runtime` | transport readiness wait सहायक |
    | `plugin-sdk/exec-approvals-runtime` | व्यापक infra-runtime barrel के बिना exec approval policy file सहायक |
    | `plugin-sdk/infra-runtime` | deprecated compatibility shim; ऊपर दिए गए केंद्रित runtime subpaths का उपयोग करें |
    | `plugin-sdk/collection-runtime` | छोटे bounded cache सहायक |
    | `plugin-sdk/diagnostic-runtime` | diagnostic flag, event, और trace-context सहायक |
    | `plugin-sdk/error-runtime` | error graph, formatting, साझा error classification सहायक, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | wrapped fetch, proxy, EnvHttpProxyAgent option, और pinned lookup सहायक |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch imports के बिना dispatcher-aware runtime fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | व्यापक media runtime surface के बिना inline image data URL sanitizer और signature sniffing सहायक |
    | `plugin-sdk/response-limit-runtime` | व्यापक media runtime surface के बिना bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routing या pairing stores के बिना मौजूदा conversation binding state |
    | `plugin-sdk/session-store-runtime` | व्यापक config writes/maintenance imports के बिना session-store सहायक |
    | `plugin-sdk/sqlite-runtime` | database lifecycle controls के बिना केंद्रित SQLite agent-schema, path, और transaction सहायक |
    | `plugin-sdk/context-visibility-runtime` | व्यापक config/security imports के बिना context visibility resolution और supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging imports के बिना संकीर्ण primitive record/string coercion और normalization सहायक |
    | `plugin-sdk/host-runtime` | hostname और SCP host normalization सहायक |
    | `plugin-sdk/retry-runtime` | retry config और retry runner सहायक |
    | `plugin-sdk/agent-runtime` | agent dir/identity/workspace सहायक, जिनमें `resolveAgentDir`, `resolveDefaultAgentDir`, और deprecated `resolveOpenClawAgentDir` compatibility export शामिल हैं |
    | `plugin-sdk/directory-runtime` | config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और पदावनत `fetchRemoteMedia` सहित साझा मीडिया लाने/रूपांतरित करने/संग्रहित करने वाले सहायक; जब किसी URL को OpenClaw मीडिया बनना हो, तो बफ़र पढ़ने से पहले स्टोर सहायक को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | संकीर्ण MIME सामान्यीकरण, फ़ाइल-एक्सटेंशन मैपिंग, MIME पहचान, और मीडिया-प्रकार सहायक |
    | `plugin-sdk/media-store` | `saveMediaBuffer` और `saveMediaStream` जैसे संकीर्ण मीडिया स्टोर सहायक |
    | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन विफलता-स्थानांतरण सहायक, उम्मीदवार चयन, और अनुपस्थित-मॉडल संदेश |
    | `plugin-sdk/media-understanding` | मीडिया समझ प्रदाता प्रकार और प्रदाता-उन्मुख इमेज/ऑडियो/संरचित-निष्कर्षण सहायक निर्यात |
    | `plugin-sdk/text-chunking` | टेक्स्ट और markdown चंकिंग/रेंडर सहायक, markdown तालिका रूपांतरण, निर्देश-टैग हटाना, और सुरक्षित-टेक्स्ट उपयोगिताएं |
    | `plugin-sdk/text-chunking` | आउटबाउंड टेक्स्ट चंकिंग सहायक |
    | `plugin-sdk/speech` | स्पीच प्रदाता प्रकार और प्रदाता-उन्मुख निर्देश, रजिस्ट्री, वैलिडेशन, OpenAI-संगत TTS बिल्डर, और स्पीच सहायक निर्यात |
    | `plugin-sdk/speech-core` | साझा स्पीच प्रदाता प्रकार, रजिस्ट्री, निर्देश, सामान्यीकरण, और स्पीच सहायक निर्यात |
    | `plugin-sdk/realtime-transcription` | रीयलटाइम ट्रांसक्रिप्शन प्रदाता प्रकार, रजिस्ट्री सहायक, और साझा WebSocket सेशन सहायक |
    | `plugin-sdk/realtime-bootstrap-context` | सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` संदर्भ इंजेक्शन के लिए रीयलटाइम प्रोफ़ाइल बूटस्ट्रैप सहायक |
    | `plugin-sdk/realtime-voice` | रीयलटाइम वॉइस प्रदाता प्रकार, रजिस्ट्री सहायक, और आउटपुट गतिविधि ट्रैकिंग सहित साझा रीयलटाइम वॉइस व्यवहार सहायक |
    | `plugin-sdk/image-generation` | इमेज जनरेशन प्रदाता प्रकार और इमेज एसेट/data URL सहायक, साथ ही OpenAI-संगत इमेज प्रदाता बिल्डर |
    | `plugin-sdk/image-generation-core` | साझा इमेज-जनरेशन प्रकार, विफलता-स्थानांतरण, auth, और रजिस्ट्री सहायक |
    | `plugin-sdk/music-generation` | म्यूज़िक जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/music-generation-core` | साझा म्यूज़िक-जनरेशन प्रकार, विफलता-स्थानांतरण सहायक, प्रदाता lookup, और model-ref पार्सिंग |
    | `plugin-sdk/video-generation` | वीडियो जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन प्रकार, विफलता-स्थानांतरण सहायक, प्रदाता lookup, और model-ref पार्सिंग |
    | `plugin-sdk/transcripts` | साझा ट्रांसक्रिप्ट स्रोत प्रदाता प्रकार, रजिस्ट्री सहायक, सेशन विवरणक, और उच्चारण मेटाडेटा |
    | `plugin-sdk/webhook-targets` | Webhook लक्ष्य रजिस्ट्री और route-install सहायक |
    | `plugin-sdk/webhook-path` | पदावनत संगतता उपनाम; `plugin-sdk/webhook-ingress` का उपयोग करें |
    | `plugin-sdk/web-media` | साझा remote/local मीडिया लोडिंग सहायक |
    | `plugin-sdk/zod` | पदावनत संगतता पुनः-निर्यात; `zod` से सीधे `zod` आयात करें |
    | `plugin-sdk/testing` | पुराने OpenClaw परीक्षणों के लिए रेपो-स्थानीय पदावनत संगतता बैरल। नए रेपो परीक्षणों को इसके बजाय `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, या `plugin-sdk/test-fixtures` जैसे केंद्रित स्थानीय परीक्षण उपपथ आयात करने चाहिए |
    | `plugin-sdk/plugin-test-api` | रेपो परीक्षण सहायक ब्रिज आयात किए बिना सीधे Plugin पंजीकरण यूनिट परीक्षणों के लिए रेपो-स्थानीय न्यूनतम `createTestPluginApi` सहायक |
    | `plugin-sdk/agent-runtime-test-contracts` | auth, डिलीवरी, fallback, tool-hook, prompt-overlay, schema, और transcript projection परीक्षणों के लिए रेपो-स्थानीय नेटिव agent-runtime adapter contract fixtures |
    | `plugin-sdk/channel-test-helpers` | सामान्य actions/setup/status contracts, directory assertions, account startup lifecycle, send-config threading, runtime mocks, status issues, outbound delivery, और hook registration के लिए रेपो-स्थानीय channel-oriented परीक्षण सहायक |
    | `plugin-sdk/channel-target-testing` | channel परीक्षणों के लिए रेपो-स्थानीय साझा target-resolution error-case suite |
    | `plugin-sdk/plugin-test-contracts` | रेपो-स्थानीय Plugin package, registration, public artifact, direct import, runtime API, और import side-effect contract सहायक |
    | `plugin-sdk/provider-test-contracts` | रेपो-स्थानीय provider runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch, और stream contract सहायक |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` का अभ्यास करने वाले provider परीक्षणों के लिए रेपो-स्थानीय opt-in Vitest HTTP/auth mocks |
    | `plugin-sdk/test-fixtures` | रेपो-स्थानीय सामान्य CLI runtime capture, sandbox context, skill writer, agent-message, system-event, module reload, bundled Plugin path, terminal-text, chunking, auth-token, और typed-case fixtures |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factories के भीतर उपयोग के लिए रेपो-स्थानीय केंद्रित Node builtin mock सहायक |
  </Accordion>

  <Accordion title="मेमोरी उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI सहायकों के लिए बंडल किया गया memory-core सहायक सतह |
    | `plugin-sdk/memory-core-engine-runtime` | मेमोरी index/search runtime facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | हल्के मेमोरी embedding provider registry सहायक |
    | `plugin-sdk/memory-core-host-engine-foundation` | मेमोरी host foundation engine निर्यात |
    | `plugin-sdk/memory-core-host-engine-embeddings` | मेमोरी host embedding contracts, registry access, local provider, और generic batch/remote सहायक। इस सतह पर `registerMemoryEmbeddingProvider` पदावनत है; नए providers के लिए generic embedding provider API का उपयोग करें। |
    | `plugin-sdk/memory-core-host-engine-qmd` | मेमोरी host QMD engine निर्यात |
    | `plugin-sdk/memory-core-host-engine-storage` | मेमोरी host storage engine निर्यात |
    | `plugin-sdk/memory-core-host-multimodal` | मेमोरी host multimodal सहायक |
    | `plugin-sdk/memory-core-host-query` | मेमोरी host query सहायक |
    | `plugin-sdk/memory-core-host-secret` | मेमोरी host secret सहायक |
    | `plugin-sdk/memory-core-host-events` | पदावनत संगतता उपनाम; `plugin-sdk/memory-host-events` का उपयोग करें |
    | `plugin-sdk/memory-core-host-status` | मेमोरी host status सहायक |
    | `plugin-sdk/memory-core-host-runtime-cli` | मेमोरी host CLI runtime सहायक |
    | `plugin-sdk/memory-core-host-runtime-core` | मेमोरी host core runtime सहायक |
    | `plugin-sdk/memory-core-host-runtime-files` | मेमोरी host file/runtime सहायक |
    | `plugin-sdk/memory-host-core` | मेमोरी host core runtime सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
    | `plugin-sdk/memory-host-events` | मेमोरी host event journal सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
    | `plugin-sdk/memory-host-files` | पदावनत संगतता उपनाम; `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
    | `plugin-sdk/memory-host-markdown` | मेमोरी-समीप Plugin के लिए साझा managed-markdown सहायक |
    | `plugin-sdk/memory-host-search` | search-manager access के लिए Active Memory runtime facade |
    | `plugin-sdk/memory-host-status` | पदावनत संगतता उपनाम; `plugin-sdk/memory-core-host-status` का उपयोग करें |
  </Accordion>

  <Accordion title="आरक्षित बंडल-हेल्पर उपपथ">
    आरक्षित बंडल-हेल्पर SDK उपपथ बंडल किए गए Plugin कोड के लिए संकीर्ण owner-specific सतह हैं। उन्हें SDK inventory में ट्रैक किया जाता है ताकि package builds और aliasing deterministic रहें, लेकिन वे सामान्य Plugin authoring APIs नहीं हैं। नए पुनःप्रयोज्य host contracts को `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime` जैसे generic SDK उपपथों का उपयोग करना चाहिए।

    | उपपथ | स्वामी और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | user MCP server config को Codex app-server thread config में project करने के लिए बंडल किया गया Codex Plugin सहायक |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server native subagents को OpenClaw task state में mirror करने के लिए बंडल किया गया Codex Plugin सहायक |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugin बनाना](/hi/plugins/building-plugins)
