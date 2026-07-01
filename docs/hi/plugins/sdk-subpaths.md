---
read_when:
    - Plugin import के लिए सही plugin-sdk उप-पथ चुनना
    - बंडल किए गए Plugin सबपाथ और सहायक सतहों का ऑडिट करना
summary: 'Plugin एसडीके उपपथ कैटलॉग: कौन से आयात कहाँ रहते हैं, क्षेत्र के अनुसार समूहित'
title: Plugin SDK उपपथ
x-i18n:
    generated_at: "2026-07-01T13:03:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK को `openclaw/plugin-sdk/` के अंतर्गत संकीर्ण सार्वजनिक उपपथों के सेट के रूप में उपलब्ध कराया गया है। यह पृष्ठ आम तौर पर उपयोग किए जाने वाले उपपथों को उद्देश्य के अनुसार समूहित करके सूचीबद्ध करता है। जेनरेट की गई compiler entrypoint inventory `scripts/lib/plugin-sdk-entrypoints.json` में रहती है; package exports, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` में सूचीबद्ध repo-local test/internal उपपथों को घटाने के बाद सार्वजनिक subset होते हैं। Maintainers सार्वजनिक export count को `pnpm plugin-sdk:surface` से और सक्रिय reserved helper subpaths को `pnpm plugins:boundary-report:summary` से audit कर सकते हैं; अप्रयुक्त reserved helper exports, निष्क्रिय compatibility debt के रूप में public SDK में बने रहने के बजाय CI report को fail करते हैं।

Plugin authoring guide के लिए, [Plugin SDK overview](/hi/plugins/sdk-overview) देखें।

## Plugin entry

| उपपथ                        | मुख्य exports                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Migration provider item helpers जैसे `createMigrationItem`, reason constants, item status markers, redaction helpers, और `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Runtime migration helpers जैसे `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, और `writeMigrationReport`                                              |
| `plugin-sdk/health`            | bundled health consumers के लिए Doctor health-check registration, detection, repair, selection, severity, और finding types                                               |

### Deprecated compatibility and test helpers

Deprecated subpaths पुराने plugins के लिए exported रहते हैं, लेकिन नए code को नीचे दिए गए focused SDK subpaths का उपयोग करना चाहिए। maintained list `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI इससे bundled production imports को reject करता है। `compat`, `config-types`, `infra-runtime`, `text-runtime`, और `zod` जैसे broad barrels केवल compatibility के लिए हैं। `zod` को सीधे `zod` से import करें।

OpenClaw के Vitest-backed test-helper subpaths केवल repo-local हैं और अब package exports नहीं हैं: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, और `testing`।

### Reserved bundled plugin helper subpaths

ये subpaths अपने owning bundled plugin के लिए plugin-owned compatibility surfaces हैं, सामान्य SDK APIs नहीं: `plugin-sdk/codex-mcp-projection` और `plugin-sdk/codex-native-task-runtime`। Cross-owner extension imports को package contract guardrails द्वारा blocked किया जाता है।

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | उप-पथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | रूट `openclaw.json` Zod स्कीमा निर्यात (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin-स्वामित्व वाले स्कीमा के लिए कैश किया गया JSON Schema सत्यापन सहायक |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक, सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता उपनाम; `plugin-sdk/setup-runtime` का उपयोग करें |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | बहु-खाता कॉन्फ़िगरेशन/कार्रवाई-गेट सहायक, डिफ़ॉल्ट-खाता फ़ॉलबैक सहायक |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, खाता-id सामान्यीकरण सहायक |
    | `plugin-sdk/account-resolution` | खाता खोज + डिफ़ॉल्ट-फ़ॉलबैक सहायक |
    | `plugin-sdk/account-helpers` | संकीर्ण खाता-सूची/खाता-कार्रवाई सहायक |
    | `plugin-sdk/access-groups` | एक्सेस-ग्रुप अनुमति-सूची पार्सिंग और रिडैक्ट किए गए समूह डायग्नोस्टिक सहायक |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फ़िगरेशन स्कीमा प्रिमिटिव, साथ में Zod और प्रत्यक्ष JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | केवल अनुरक्षित बंडल किए गए Plugin के लिए बंडल किए गए OpenClaw चैनल कॉन्फ़िगरेशन स्कीमा |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। कैनॉनिकल बंडल किए गए/आधिकारिक चैट चैनल ids, साथ में उन Plugin के लिए फ़ॉर्मैटर लेबल/उपनाम जिन्हें अपनी तालिका हार्डकोड किए बिना एनवेलप-प्रीफ़िक्स किए गए पाठ को पहचानना होता है। |
    | `plugin-sdk/channel-config-schema-legacy` | बंडल-चैनल कॉन्फ़िगरेशन स्कीमा के लिए अप्रचलित संगतता उपनाम |
    | `plugin-sdk/telegram-command-config` | बंडल-कॉन्ट्रैक्ट फ़ॉलबैक के साथ Telegram कस्टम-कमांड सामान्यीकरण/सत्यापन सहायक |
    | `plugin-sdk/command-gating` | संकीर्ण कमांड प्राधिकरण गेट सहायक |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | अप्रचलित निम्न-स्तरीय चैनल इनग्रेस संगतता फसाड। नए प्राप्ति पथों को `plugin-sdk/channel-ingress-runtime` का उपयोग करना चाहिए। |
    | `plugin-sdk/channel-ingress-runtime` | माइग्रेट किए गए चैनल प्राप्ति पथों के लिए प्रयोगात्मक उच्च-स्तरीय चैनल इनग्रेस रनटाइम रिज़ॉल्वर और रूट तथ्य बिल्डर। प्रत्येक Plugin में प्रभावी अनुमति-सूचियां, कमांड अनुमति-सूचियां, और लेगेसी प्रोजेक्शन जोड़ने के बजाय इसे प्राथमिकता दें। [चैनल इनग्रेस API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश जीवनचक्र कॉन्ट्रैक्ट, साथ में उत्तर पाइपलाइन विकल्प, रसीदें, लाइव पूर्वावलोकन/स्ट्रीमिंग, जीवनचक्र सहायक, आउटबाउंड पहचान, पेलोड योजना, टिकाऊ भेजना, और संदेश-भेजने संदर्भ सहायक। [चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम, साथ में लेगेसी उत्तर-डिस्पैच फसाड। |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम, साथ में लेगेसी उत्तर-डिस्पैच फसाड। |
    | `plugin-sdk/inbound-envelope` | साझा इनबाउंड रूट + एनवेलप बिल्डर सहायक |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता फसाड। इनबाउंड रनर और डिस्पैच प्रेडिकेट के लिए `plugin-sdk/channel-inbound`, और संदेश डिलीवरी सहायक के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित लक्ष्य पार्सिंग उपनाम; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | साझा आउटबाउंड मीडिया लोडिंग और होस्टेड-मीडिया स्थिति सहायक |
    | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/poll-runtime` | संकीर्ण पोल सामान्यीकरण सहायक |
    | `plugin-sdk/thread-bindings-runtime` | थ्रेड-बाइंडिंग जीवनचक्र और एडेप्टर सहायक |
    | `plugin-sdk/agent-media-payload` | लेगेसी एजेंट मीडिया पेलोड बिल्डर |
    | `plugin-sdk/conversation-runtime` | बातचीत/थ्रेड बाइंडिंग, पेयरिंग, और कॉन्फ़िगर किए गए-बाइंडिंग सहायक |
    | `plugin-sdk/runtime-config-snapshot` | रनटाइम कॉन्फ़िगरेशन स्नैपशॉट सहायक |
    | `plugin-sdk/runtime-group-policy` | रनटाइम समूह-नीति समाधान सहायक |
    | `plugin-sdk/channel-status` | साझा चैनल स्थिति स्नैपशॉट/सारांश सहायक |
    | `plugin-sdk/channel-config-primitives` | संकीर्ण चैनल कॉन्फ़िगरेशन-स्कीमा प्रिमिटिव |
    | `plugin-sdk/channel-config-writes` | चैनल कॉन्फ़िगरेशन-लिखाई प्राधिकरण सहायक |
    | `plugin-sdk/channel-plugin-common` | साझा चैनल Plugin प्रस्तावना निर्यात |
    | `plugin-sdk/allowlist-config-edit` | अनुमति-सूची कॉन्फ़िगरेशन संपादन/पठन सहायक |
    | `plugin-sdk/group-access` | साझा समूह-एक्सेस निर्णय सहायक |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-inbound` का उपयोग करें। |
    | `plugin-sdk/direct-dm-guard-policy` | संकीर्ण प्रत्यक्ष-DM प्री-क्रिप्टो गार्ड नीति सहायक |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और ट्रैक की गई स्वामी संगतता के लिए अप्रचलित Discord संगतता फसाड; नए Plugin को सामान्य चैनल SDK उप-पथों का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | ट्रैक की गई स्वामी संगतता के लिए अप्रचलित Telegram खाता-समाधान संगतता फसाड; नए Plugin को इंजेक्ट किए गए रनटाइम सहायक या सामान्य चैनल SDK उप-पथों का उपयोग करना चाहिए |
    | `plugin-sdk/zalouser` | प्रकाशित Lark/Zalo पैकेजों के लिए अप्रचलित Zalo Personal संगतता फसाड, जो अभी भी प्रेषक कमांड प्राधिकरण आयात करते हैं; नए Plugin को `plugin-sdk/command-auth` का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | सिमैंटिक संदेश प्रस्तुति, डिलीवरी, और लेगेसी इंटरैक्टिव उत्तर सहायक। [संदेश प्रस्तुति](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/channel-inbound` | इवेंट वर्गीकरण, संदर्भ निर्माण, फ़ॉर्मैटिंग, रूट, डिबाउंस, मेंशन मिलान, मेंशन-नीति, और इनबाउंड लॉगिंग के लिए साझा इनबाउंड सहायक |
    | `plugin-sdk/channel-inbound-debounce` | संकीर्ण इनबाउंड डिबाउंस सहायक |
    | `plugin-sdk/channel-mention-gating` | व्यापक इनबाउंड रनटाइम सतह के बिना संकीर्ण मेंशन-नीति, मेंशन मार्कर, और मेंशन पाठ सहायक |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-inbound` या `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-pairing-paths` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-pairing` का उपयोग करें। |
    | `plugin-sdk/channel-reply-options-runtime` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फसाड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | उत्तर परिणाम प्रकार |
    | `plugin-sdk/channel-actions` | चैनल संदेश-कार्रवाई सहायक, साथ में Plugin संगतता के लिए रखे गए अप्रचलित नेटिव स्कीमा सहायक |
    | `plugin-sdk/channel-route` | साझा रूट सामान्यीकरण, पार्सर-चालित लक्ष्य समाधान, थ्रेड-id स्ट्रिंगीकरण, डिड्यूप/कॉम्पैक्ट रूट कुंजियां, पार्स किए गए-लक्ष्य प्रकार, और रूट/लक्ष्य तुलना सहायक |
    | `plugin-sdk/channel-targets` | लक्ष्य पार्सिंग सहायक; रूट तुलना कॉलर को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | चैनल कॉन्ट्रैक्ट प्रकार |
    | `plugin-sdk/channel-feedback` | फ़ीडबैक/प्रतिक्रिया वायरिंग |
    | `plugin-sdk/channel-secret-runtime` | संकीर्ण सीक्रेट-कॉन्ट्रैक्ट सहायक, जैसे `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, और सीक्रेट लक्ष्य प्रकार |
  </Accordion>

अप्रचलित चैनल सहायक परिवार केवल प्रकाशित-Plugin
संगतता के लिए उपलब्ध रहते हैं। हटाने की योजना है: उन्हें बाहरी Plugin
माइग्रेशन विंडो तक रखें, repo/बंडल किए गए Plugin को `channel-inbound` और
`channel-outbound` पर रखें, फिर अगले प्रमुख
SDK क्लीनअप में संगतता उप-पथों को हटाएं। यह पुराने चैनल message/runtime, चैनल
streaming, direct-DM access, inbound helper splinter, reply-options,
और pairing-path परिवारों पर लागू होता है।

  <Accordion title="Provider उप-पथ">
    | उप-पथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | सेटअप, कैटलॉग खोज और रनटाइम मॉडल तैयारी के लिए समर्थित LM Studio Provider फ़साड |
    | `plugin-sdk/lmstudio-runtime` | स्थानीय सर्वर डिफ़ॉल्ट, मॉडल खोज, अनुरोध हेडर और लोडेड-मॉडल सहायकों के लिए समर्थित LM Studio रनटाइम फ़साड |
    | `plugin-sdk/provider-setup` | चुने हुए स्थानीय/स्वयं-होस्टेड Provider सेटअप सहायक |
    | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्वयं-होस्टेड Provider सेटअप सहायक |
    | `plugin-sdk/cli-backend` | CLI बैकएंड डिफ़ॉल्ट + watchdog कॉन्स्टेंट |
    | `plugin-sdk/provider-auth-runtime` | Provider plugins के लिए रनटाइम API-key समाधान सहायक |
    | `plugin-sdk/provider-oauth-runtime` | जेनेरिक Provider OAuth callback प्रकार, callback-page रेंडरिंग, PKCE/state सहायक, authorization-input पार्सिंग, token-expiry सहायक और abort सहायक |
    | `plugin-sdk/provider-auth-api-key` | API-key ऑनबोर्डिंग/profile-write सहायक जैसे `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | मानक OAuth auth-result बिल्डर |
    | `plugin-sdk/provider-env-vars` | Provider auth env-var lookup सहायक |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex auth-import सहायक, अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा replay-policy बिल्डर, provider-endpoint सहायक और साझा model-id normalization सहायक |
    | `plugin-sdk/provider-catalog-live-runtime` | संरक्षित `/models`-शैली खोज के लिए लाइव Provider मॉडल कैटलॉग सहायक: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model-id फ़िल्टरिंग, TTL कैश और स्थिर fallback |
    | `plugin-sdk/provider-catalog-runtime` | Provider कैटलॉग augmentation रनटाइम hook और contract tests के लिए plugin-provider registry seams |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | जेनेरिक Provider HTTP/endpoint capability सहायक, Provider HTTP त्रुटियां और audio transcription multipart form सहायक |
    | `plugin-sdk/provider-web-fetch-contract` | संकरे web-fetch config/selection contract सहायक जैसे `enablePluginInConfig` और `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch Provider registration/cache सहायक |
    | `plugin-sdk/provider-web-search-config-contract` | उन Providers के लिए संकरे web-search config/credential सहायक जिन्हें plugin-enable wiring की आवश्यकता नहीं है |
    | `plugin-sdk/provider-web-search-contract` | संकरे web-search config/credential contract सहायक जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` और scoped credential setters/getters |
    | `plugin-sdk/provider-web-search` | Web-search Provider registration/cache/runtime सहायक |
    | `plugin-sdk/embedding-providers` | सामान्य embedding Provider प्रकार और read सहायक, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` और `listEmbeddingProviders(...)` शामिल हैं; plugins `api.registerEmbeddingProvider(...)` के माध्यम से Providers register करते हैं ताकि manifest ownership लागू रहे |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` और DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
    | `plugin-sdk/provider-usage` | Provider usage snapshot प्रकार, साझा usage fetch सहायक और Provider fetchers जैसे `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper प्रकार, plain-text tool-call compat और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper सहायक |
    | `plugin-sdk/provider-stream-shared` | सार्वजनिक साझा Provider stream wrapper सहायक जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` और Anthropic/DeepSeek/OpenAI-compatible stream utilities शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | नेटिव Provider transport सहायक जैसे guarded fetch, tool-result text extraction, transport message transforms और writable transport event streams |
    | `plugin-sdk/provider-onboard` | ऑनबोर्डिंग config patch सहायक |
    | `plugin-sdk/global-singleton` | process-local singleton/map/cache सहायक |
    | `plugin-sdk/group-activation` | संकरे group activation mode और command parsing सहायक |
  </Accordion>

Provider usage snapshots सामान्यतः एक या अधिक quota `windows` रिपोर्ट करते हैं, जिनमें से प्रत्येक में
एक label, उपयोग किया गया प्रतिशत और वैकल्पिक reset time होता है। ऐसे Providers जो resettable quota windows के बजाय balance या
account-state text दिखाते हैं, उन्हें प्रतिशत गढ़ने के बजाय खाली `windows` array के साथ
`summary` लौटाना चाहिए।
OpenClaw उस summary text को status output में दिखाता है; `error` का उपयोग केवल तब करें जब
usage endpoint विफल हो गया हो या उसने कोई उपयोगी usage data न लौटाया हो।

  <Accordion title="Auth और security उप-पथ">
    | उप-पथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry सहायक जिनमें dynamic argument menu formatting, sender-authorization सहायक शामिल हैं |
    | `plugin-sdk/command-status` | command/help message बिल्डर जैसे `buildCommandsMessagePaginated` और `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | approver resolution और same-chat action-auth सहायक |
    | `plugin-sdk/approval-client-runtime` | नेटिव exec approval profile/filter सहायक |
    | `plugin-sdk/approval-delivery-runtime` | नेटिव approval capability/delivery adapters |
    | `plugin-sdk/approval-gateway-runtime` | साझा approval gateway-resolution सहायक |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoints के लिए हल्के नेटिव approval adapter loading सहायक |
    | `plugin-sdk/approval-handler-runtime` | व्यापक approval handler रनटाइम सहायक; जब संकरे adapter/gateway seams पर्याप्त हों तो उन्हें प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | नेटिव approval target, account-binding, route-gate, forwarding fallback और local native exec prompt suppression सहायक |
    | `plugin-sdk/approval-reaction-runtime` | hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores और local native exec prompt suppression के लिए compatibility export |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin approval reply payload सहायक |
    | `plugin-sdk/approval-runtime` | exec/plugin approval payload सहायक, नेटिव approval routing/runtime सहायक और structured approval display सहायक जैसे `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | संकरे inbound reply dedupe reset सहायक |
    | `plugin-sdk/channel-contract-testing` | broad testing barrel के बिना संकरे channel contract test सहायक |
    | `plugin-sdk/command-auth-native` | नेटिव command auth, dynamic argument menu formatting और नेटिव session-target सहायक |
    | `plugin-sdk/command-detection` | साझा command detection सहायक |
    | `plugin-sdk/command-primitives-runtime` | hot channel paths के लिए हल्के command text predicates |
    | `plugin-sdk/command-surface` | command-body normalization और command-surface सहायक |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret surfaces के लिए संकरे secret-contract collection सहायक |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config parsing के लिए संकरे `coerceSecretRef` और SecretRef typing सहायक |
    | `plugin-sdk/secret-provider-integration` | बाहरी secret provider presets प्रकाशित करने वाले plugins के लिए केवल-प्रकार SecretRef provider integration manifest और preset contracts |
    | `plugin-sdk/security-runtime` | साझा trust, DM gating, root-bounded file/path सहायक जिनमें create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store सहायक, symlink-parent guards, external-content, sensitive text redaction, constant-time secret comparison और secret-collection सहायक शामिल हैं |
    | `plugin-sdk/ssrf-policy` | host allowlist और private-network SSRF policy सहायक |
    | `plugin-sdk/ssrf-dispatcher` | broad infra runtime surface के बिना संकरे pinned-dispatcher सहायक |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF-guarded fetch, SSRF error और SSRF policy सहायक |
    | `plugin-sdk/secret-input` | secret input parsing सहायक |
    | `plugin-sdk/webhook-ingress` | Webhook request/target सहायक और raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | request body size/timeout सहायक |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/runtime` | व्यापक रनटाइम/लॉगिंग/बैकअप/Plugin-इंस्टॉल सहायक |
    | `plugin-sdk/runtime-env` | संकीर्ण रनटाइम परिवेश, लॉगर, टाइमआउट, पुनःप्रयास, और बैकऑफ सहायक |
    | `plugin-sdk/browser-config` | सामान्यीकृत प्रोफ़ाइल/डिफ़ॉल्ट, CDP URL पार्सिंग, और ब्राउज़र-नियंत्रण प्रमाणीकरण सहायकों के लिए समर्थित ब्राउज़र कॉन्फ़िग फ़साड |
    | `plugin-sdk/agent-harness-task-runtime` | होस्ट द्वारा जारी कार्य स्कोप का उपयोग करने वाले हार्नेस-समर्थित एजेंटों के लिए सामान्य कार्य जीवनचक्र और पूर्णता डिलीवरी सहायक |
    | `plugin-sdk/codex-mcp-projection` | उपयोगकर्ता MCP सर्वर कॉन्फ़िग को Codex थ्रेड कॉन्फ़िग में प्रोजेक्ट करने के लिए आरक्षित बंडल किया गया Codex सहायक; तृतीय-पक्ष plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | नेटिव कार्य मिरर/रनटाइम वायरिंग के लिए निजी बंडल किया गया Codex सहायक; तृतीय-पक्ष plugins के लिए नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य चैनल रनटाइम-संदर्भ पंजीकरण और लुकअप सहायक |
    | `plugin-sdk/matrix` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Matrix संगतता फ़साड; नए plugins को सीधे `plugin-sdk/run-command` आयात करना चाहिए |
    | `plugin-sdk/mattermost` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Mattermost संगतता फ़साड; नए plugins को सामान्य SDK उपपथ सीधे आयात करने चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | साझा Plugin कमांड/हुक/http/इंटरैक्टिव सहायक |
    | `plugin-sdk/hook-runtime` | साझा Webhook/आंतरिक हुक पाइपलाइन सहायक |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, और `createLazyRuntimeSurface` जैसे लेज़ी रनटाइम आयात/बाइंडिंग सहायक |
    | `plugin-sdk/process-runtime` | प्रक्रिया निष्पादन सहायक |
    | `plugin-sdk/cli-runtime` | CLI फ़ॉर्मैटिंग, प्रतीक्षा, संस्करण, आर्ग्युमेंट-इनवोकेशन, और लेज़ी कमांड-समूह सहायक |
    | `plugin-sdk/qa-live-transport-scenarios` | साझा लाइव ट्रांसपोर्ट QA परिदृश्य आईडी, बेसलाइन कवरेज सहायक, और परिदृश्य-चयन सहायक |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले Plugin HTTP रूटों के लिए आरक्षित Gateway मेथड डिस्पैच सहायक |
    | `plugin-sdk/gateway-runtime` | Gateway क्लाइंट, इवेंट-लूप-तैयार क्लाइंट आरंभ सहायक, Gateway CLI RPC, Gateway प्रोटोकॉल त्रुटियां, विज्ञापित LAN होस्ट रिज़ॉल्यूशन, और चैनल-स्थिति पैच सहायक |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` और चैनल/प्रदाता कॉन्फ़िग प्रकारों जैसे Plugin कॉन्फ़िग आकारों के लिए केंद्रित केवल-प्रकार कॉन्फ़िग सतह |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject`, और `resolveLivePluginConfigObject` जैसे रनटाइम Plugin-कॉन्फ़िग लुकअप सहायक |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, और `logConfigUpdated` जैसे ट्रांज़ैक्शनल कॉन्फ़िग म्यूटेशन सहायक |
    | `plugin-sdk/message-tool-delivery-hints` | साझा संदेश-टूल डिलीवरी मेटाडेटा संकेत स्ट्रिंग |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot`, और परीक्षण स्नैपशॉट सेटर जैसे वर्तमान प्रक्रिया कॉन्फ़िग स्नैपशॉट सहायक |
    | `plugin-sdk/telegram-command-config` | Telegram कमांड-नाम/विवरण सामान्यीकरण और डुप्लिकेट/टकराव जांच, तब भी जब बंडल की गई Telegram कॉन्ट्रैक्ट सतह उपलब्ध न हो |
    | `plugin-sdk/text-autolink-runtime` | व्यापक टेक्स्ट बैरल के बिना फ़ाइल-संदर्भ ऑटोलिंक पहचान |
    | `plugin-sdk/approval-reaction-runtime` | हार्डकोडेड स्वीकृति प्रतिक्रिया बाइंडिंग, प्रतिक्रिया प्रॉम्प्ट पेलोड, प्रतिक्रिया लक्ष्य स्टोर, और लोकल नेटिव exec प्रॉम्प्ट दमन के लिए संगतता निर्यात |
    | `plugin-sdk/approval-runtime` | Exec/Plugin स्वीकृति सहायक, स्वीकृति-क्षमता बिल्डर, प्रमाणीकरण/प्रोफ़ाइल सहायक, नेटिव रूटिंग/रनटाइम सहायक, और संरचित स्वीकृति डिस्प्ले पथ फ़ॉर्मैटिंग |
    | `plugin-sdk/reply-runtime` | साझा इनबाउंड/जवाब रनटाइम सहायक, चंकिंग, डिस्पैच, Heartbeat, जवाब प्लानर |
    | `plugin-sdk/reply-dispatch-runtime` | संकीर्ण जवाब डिस्पैच/फ़ाइनलाइज़ और वार्तालाप-लेबल सहायक |
    | `plugin-sdk/reply-history` | साझा छोटी-विंडो जवाब-इतिहास सहायक। नए संदेश-टर्न कोड को `createChannelHistoryWindow` का उपयोग करना चाहिए; निम्न-स्तरीय मैप सहायक केवल अप्रचलित संगतता निर्यात बने रहते हैं |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | संकीर्ण टेक्स्ट/मार्कडाउन चंकिंग सहायक |
    | `plugin-sdk/session-store-runtime` | सत्र वर्कफ़्लो सहायक (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), सत्र पहचान के अनुसार सीमित हालिया उपयोगकर्ता/सहायक ट्रांसक्रिप्ट टेक्स्ट पठन, लेगसी सत्र स्टोर पथ/सत्र-कुंजी सहायक, अपडेटेड-एट पठन, और केवल-ट्रांज़िशन पूरे-स्टोर/फ़ाइल-पथ संगतता सहायक |
    | `plugin-sdk/session-transcript-runtime` | ट्रांसक्रिप्ट पहचान, स्कोप किए गए लक्ष्य/रीड/राइट सहायक, अपडेट प्रकाशन, राइट लॉक, और ट्रांसक्रिप्ट मेमरी हिट कुंजियां |
    | `plugin-sdk/sqlite-runtime` | प्रथम-पक्ष रनटाइम के लिए केंद्रित SQLite एजेंट-स्कीमा, पथ, और ट्रांज़ैक्शन सहायक |
    | `plugin-sdk/cron-store-runtime` | Cron स्टोर पथ/लोड/सेव सहायक |
    | `plugin-sdk/state-paths` | स्टेट/OAuth डायरेक्टरी पथ सहायक |
    | `plugin-sdk/plugin-state-runtime` | Plugin साइडकार SQLite कुंजीकृत-स्टेट प्रकार और Plugin-स्वामित्व वाले डेटाबेस के लिए केंद्रीकृत कनेक्शन प्रैग्मा और WAL रखरखाव सेटअप |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, और `resolveDefaultAgentBoundAccountId` जैसे रूट/सत्र-कुंजी/खाता बाइंडिंग सहायक |
    | `plugin-sdk/status-helpers` | साझा चैनल/खाता स्थिति सारांश सहायक, रनटाइम-स्टेट डिफ़ॉल्ट, और इश्यू मेटाडेटा सहायक |
    | `plugin-sdk/target-resolver-runtime` | साझा लक्ष्य रिज़ॉल्वर सहायक |
    | `plugin-sdk/string-normalization-runtime` | स्लग/स्ट्रिंग सामान्यीकरण सहायक |
    | `plugin-sdk/request-url` | fetch/request-जैसे इनपुट से स्ट्रिंग URL निकालें |
    | `plugin-sdk/run-command` | सामान्यीकृत stdout/stderr परिणामों वाला समयबद्ध कमांड रनर |
    | `plugin-sdk/param-readers` | सामान्य टूल/CLI पैरामीटर रीडर |
    | `plugin-sdk/tool-plugin` | एक सरल टाइप्ड एजेंट-टूल Plugin परिभाषित करें और मैनिफ़ेस्ट जनरेशन के लिए स्थैतिक मेटाडेटा उजागर करें |
    | `plugin-sdk/tool-payload` | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
    | `plugin-sdk/tool-send` | टूल आर्ग से कैनॉनिकल भेजने-लक्ष्य फ़ील्ड निकालें |
    | `plugin-sdk/sandbox` | सैंडबॉक्स बैकएंड प्रकार और SSH/OpenShell कमांड सहायक, जिनमें फ़ेल-फ़ास्ट exec कमांड प्रीफ़्लाइट शामिल है |
    | `plugin-sdk/temp-path` | साझा अस्थायी-डाउनलोड पथ सहायक और निजी सुरक्षित अस्थायी वर्कस्पेस |
    | `plugin-sdk/logging-core` | सबसिस्टम लॉगर और रिडैक्शन सहायक |
    | `plugin-sdk/markdown-table-runtime` | मार्कडाउन तालिका मोड और रूपांतरण सहायक |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` जैसे मॉडल/सत्र ओवरराइड सहायक |
    | `plugin-sdk/talk-config-runtime` | Talk प्रदाता कॉन्फ़िग रिज़ॉल्यूशन सहायक |
    | `plugin-sdk/json-store` | छोटे JSON स्टेट रीड/राइट सहायक |
    | `plugin-sdk/json-unsafe-integers` | JSON पार्सिंग सहायक जो असुरक्षित पूर्णांक लिटरल को स्ट्रिंग के रूप में सुरक्षित रखते हैं |
    | `plugin-sdk/file-lock` | पुनः-प्रवेशी फ़ाइल-लॉक सहायक |
    | `plugin-sdk/persistent-dedupe` | डिस्क-समर्थित डीड्यूप कैश सहायक |
    | `plugin-sdk/acp-runtime` | ACP रनटाइम/सत्र और जवाब-डिस्पैच सहायक |
    | `plugin-sdk/acp-runtime-backend` | स्टार्टअप-लोडेड plugins के लिए हल्के ACP बैकएंड पंजीकरण और जवाब-डिस्पैच सहायक |
    | `plugin-sdk/acp-binding-resolve-runtime` | जीवनचक्र स्टार्टअप आयातों के बिना केवल-पठन ACP बाइंडिंग रिज़ॉल्यूशन |
    | `plugin-sdk/agent-config-primitives` | संकीर्ण एजेंट रनटाइम कॉन्फ़िग-स्कीमा प्रिमिटिव |
    | `plugin-sdk/boolean-param` | ढीला बूलियन पैरामीटर रीडर |
    | `plugin-sdk/dangerous-name-runtime` | खतरनाक-नाम मिलान रिज़ॉल्यूशन सहायक |
    | `plugin-sdk/device-bootstrap` | डिवाइस बूटस्ट्रैप और पेयरिंग टोकन सहायक |
    | `plugin-sdk/extension-shared` | साझा पैसिव-चैनल, स्थिति, और एंबिएंट प्रॉक्सी सहायक प्रिमिटिव |
    | `plugin-sdk/models-provider-runtime` | `/models` कमांड/प्रदाता जवाब सहायक |
    | `plugin-sdk/skill-commands-runtime` | Skill कमांड सूचीकरण सहायक |
    | `plugin-sdk/native-command-registry` | नेटिव कमांड रजिस्ट्री/बिल्ड/सीरियलाइज़ सहायक |
    | `plugin-sdk/agent-harness` | निम्न-स्तरीय एजेंट हार्नेसों के लिए प्रायोगिक विश्वसनीय-Plugin सतह: हार्नेस प्रकार, सक्रिय-रन स्टीयर/अबॉर्ट सहायक, OpenClaw टूल ब्रिज सहायक, रनटाइम-प्लान टूल नीति सहायक, टर्मिनल परिणाम वर्गीकरण, टूल प्रगति फ़ॉर्मैटिंग/विवरण सहायक, और प्रयास परिणाम उपयोगिताएं |
    | `plugin-sdk/provider-zai-endpoint` | अप्रचलित Z.AI प्रदाता-स्वामित्व वाला एंडपॉइंट पहचान फ़साड; Z.AI Plugin सार्वजनिक API का उपयोग करें |
    | `plugin-sdk/async-lock-runtime` | छोटी रनटाइम स्टेट फ़ाइलों के लिए प्रक्रिया-स्थानीय असिंक लॉक सहायक |
    | `plugin-sdk/channel-activity-runtime` | चैनल गतिविधि टेलीमेट्री सहायक |
    | `plugin-sdk/concurrency-runtime` | सीमित असिंक कार्य समवर्तीता सहायक |
    | `plugin-sdk/dedupe-runtime` | इन-मेमरी डीड्यूप कैश सहायक |
    | `plugin-sdk/delivery-queue-runtime` | आउटबाउंड लंबित-डिलीवरी ड्रेन सहायक |
    | `plugin-sdk/file-access-runtime` | सुरक्षित लोकल-फ़ाइल और मीडिया-स्रोत पथ सहायक |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat वेक, इवेंट, और दृश्यता सहायक |
    | `plugin-sdk/number-runtime` | संख्यात्मक कोअर्शन सहायक |
    | `plugin-sdk/secure-random-runtime` | सुरक्षित टोकन/UUID सहायक |
    | `plugin-sdk/system-event-runtime` | सिस्टम इवेंट कतार सहायक |
    | `plugin-sdk/transport-ready-runtime` | ट्रांसपोर्ट तैयारी प्रतीक्षा सहायक |
    | `plugin-sdk/exec-approvals-runtime` | व्यापक infra-runtime बैरल के बिना Exec स्वीकृति नीति फ़ाइल सहायक |
    | `plugin-sdk/infra-runtime` | अप्रचलित संगतता शिम; ऊपर दिए गए केंद्रित रनटाइम उपपथों का उपयोग करें |
    | `plugin-sdk/collection-runtime` | छोटे सीमित कैश सहायक |
    | `plugin-sdk/diagnostic-runtime` | डायग्नॉस्टिक फ़्लैग, इवेंट, और ट्रेस-संदर्भ सहायक |
    | `plugin-sdk/error-runtime` | त्रुटि ग्राफ़, फ़ॉर्मैटिंग, साझा त्रुटि वर्गीकरण सहायक, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | रैप किया हुआ fetch, प्रॉक्सी, EnvHttpProxyAgent विकल्प, और पिन किए गए लुकअप सहायक |
    | `plugin-sdk/runtime-fetch` | प्रॉक्सी/guarded-fetch आयातों के बिना डिस्पैचर-सचेत रनटाइम fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | व्यापक मीडिया रनटाइम सतह के बिना इनलाइन इमेज डेटा URL सैनिटाइज़र और सिग्नेचर स्निफ़िंग सहायक |
    | `plugin-sdk/response-limit-runtime` | व्यापक मीडिया रनटाइम सतह के बिना सीमित प्रतिक्रिया-बॉडी रीडर |
    | `plugin-sdk/session-binding-runtime` | कॉन्फ़िगर की गई बाइंडिंग रूटिंग या पेयरिंग स्टोर के बिना वर्तमान वार्तालाप बाइंडिंग स्टेट |
    | `plugin-sdk/session-store-runtime` | व्यापक कॉन्फ़िग राइट/रखरखाव आयातों के बिना सत्र-स्टोर सहायक |
    | `plugin-sdk/sqlite-runtime` | डेटाबेस जीवनचक्र नियंत्रणों के बिना केंद्रित SQLite एजेंट-स्कीमा, पथ, और ट्रांज़ैक्शन सहायक |
    | `plugin-sdk/context-visibility-runtime` | व्यापक कॉन्फ़िग/सुरक्षा आयातों के बिना संदर्भ दृश्यता रिज़ॉल्यूशन और पूरक संदर्भ फ़िल्टरिंग |
    | `plugin-sdk/string-coerce-runtime` | मार्कडाउन/लॉगिंग आयातों के बिना संकीर्ण प्रिमिटिव रिकॉर्ड/स्ट्रिंग कोअर्शन और सामान्यीकरण सहायक |
    | `plugin-sdk/host-runtime` | होस्टनाम और SCP होस्ट सामान्यीकरण सहायक |
    | `plugin-sdk/retry-runtime` | पुनःप्रयास कॉन्फ़िग और पुनःप्रयास रनर सहायक |
    | `plugin-sdk/agent-runtime` | एजेंट डायरेक्टरी/पहचान/वर्कस्पेस सहायक, जिनमें `resolveAgentDir`, `resolveDefaultAgentDir`, और अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात शामिल हैं |
    | `plugin-sdk/directory-runtime` | कॉन्फ़िग-समर्थित डायरेक्टरी क्वेरी/डीड्यूप |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण सबपाथ">
    | सबपाथ | मुख्य एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/media-runtime` | साझा मीडिया fetch/transform/store सहायक, जिनमें `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और अप्रचलित `fetchRemoteMedia` शामिल हैं; जब किसी URL को OpenClaw मीडिया बनना हो, तो बफ़र पढ़ने से पहले store सहायकों को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | संकीर्ण MIME सामान्यीकरण, फ़ाइल-एक्सटेंशन मैपिंग, MIME पहचान, और मीडिया-प्रकार सहायक |
    | `plugin-sdk/media-store` | संकीर्ण मीडिया store सहायक, जैसे `saveMediaBuffer` और `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन failover सहायक, उम्मीदवार चयन, और अनुपस्थित-मॉडल संदेश |
    | `plugin-sdk/media-understanding` | मीडिया समझ प्रदाता प्रकार और प्रदाता-मुखी image/audio/structured-extraction सहायक एक्सपोर्ट |
    | `plugin-sdk/text-chunking` | टेक्स्ट और markdown chunking/render सहायक, markdown तालिका रूपांतरण, directive-tag हटाना, और safe-text उपयोगिताएं |
    | `plugin-sdk/text-chunking` | आउटबाउंड टेक्स्ट chunking सहायक |
    | `plugin-sdk/speech` | स्पीच प्रदाता प्रकार और प्रदाता-मुखी directive, registry, validation, OpenAI-संगत TTS builder, और स्पीच सहायक एक्सपोर्ट |
    | `plugin-sdk/speech-core` | साझा स्पीच प्रदाता प्रकार, registry, directive, normalization, और स्पीच सहायक एक्सपोर्ट |
    | `plugin-sdk/realtime-transcription` | रीयलटाइम ट्रांसक्रिप्शन प्रदाता प्रकार, registry सहायक, और साझा WebSocket सत्र सहायक |
    | `plugin-sdk/realtime-bootstrap-context` | सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` context injection के लिए रीयलटाइम प्रोफ़ाइल bootstrap सहायक |
    | `plugin-sdk/realtime-voice` | रीयलटाइम वॉइस प्रदाता प्रकार, registry सहायक, और साझा रीयलटाइम वॉइस व्यवहार सहायक, जिनमें आउटपुट गतिविधि ट्रैकिंग शामिल है |
    | `plugin-sdk/image-generation` | इमेज जनरेशन प्रदाता प्रकार और image asset/data URL सहायक तथा OpenAI-संगत इमेज प्रदाता builder |
    | `plugin-sdk/image-generation-core` | साझा इमेज-जनरेशन प्रकार, failover, auth, और registry सहायक |
    | `plugin-sdk/music-generation` | संगीत जनरेशन प्रदाता/request/result प्रकार |
    | `plugin-sdk/music-generation-core` | साझा संगीत-जनरेशन प्रकार, failover सहायक, प्रदाता lookup, और model-ref parsing |
    | `plugin-sdk/video-generation` | वीडियो जनरेशन प्रदाता/request/result प्रकार |
    | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन प्रकार, failover सहायक, प्रदाता lookup, और model-ref parsing |
    | `plugin-sdk/transcripts` | साझा transcripts स्रोत प्रदाता प्रकार, registry सहायक, सत्र descriptors, और utterance metadata |
    | `plugin-sdk/webhook-targets` | Webhook target registry और route-install सहायक |
    | `plugin-sdk/webhook-path` | अप्रचलित संगतता alias; `plugin-sdk/webhook-ingress` का उपयोग करें |
    | `plugin-sdk/web-media` | साझा remote/local मीडिया loading सहायक |
    | `plugin-sdk/zod` | अप्रचलित संगतता re-export; `zod` को सीधे `zod` से import करें |
    | `plugin-sdk/testing` | पुराने OpenClaw परीक्षणों के लिए repo-स्थानीय अप्रचलित संगतता barrel। नए repo परीक्षणों को इसके बजाय केंद्रित स्थानीय test subpaths जैसे `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, या `plugin-sdk/test-fixtures` import करने चाहिए |
    | `plugin-sdk/plugin-test-api` | repo test helper bridges import किए बिना सीधे plugin registration unit tests के लिए repo-स्थानीय न्यूनतम `createTestPluginApi` सहायक |
    | `plugin-sdk/agent-runtime-test-contracts` | auth, delivery, fallback, tool-hook, prompt-overlay, schema, और transcript projection परीक्षणों के लिए repo-स्थानीय native agent-runtime adapter contract fixtures |
    | `plugin-sdk/channel-test-helpers` | generic actions/setup/status contracts, directory assertions, account startup lifecycle, send-config threading, runtime mocks, status issues, outbound delivery, और hook registration के लिए repo-स्थानीय channel-oriented test helpers |
    | `plugin-sdk/channel-target-testing` | channel परीक्षणों के लिए repo-स्थानीय साझा target-resolution error-case suite |
    | `plugin-sdk/plugin-test-contracts` | repo-स्थानीय plugin package, registration, public artifact, direct import, runtime API, और import side-effect contract helpers |
    | `plugin-sdk/provider-test-contracts` | repo-स्थानीय provider runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch, और stream contract helpers |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` का अभ्यास करने वाले provider परीक्षणों के लिए repo-स्थानीय opt-in Vitest HTTP/auth mocks |
    | `plugin-sdk/test-fixtures` | repo-स्थानीय generic CLI runtime capture, sandbox context, skill writer, agent-message, system-event, module reload, bundled plugin path, terminal-text, chunking, auth-token, और typed-case fixtures |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factories के अंदर उपयोग के लिए repo-स्थानीय केंद्रित Node builtin mock helpers |
  </Accordion>

  <Accordion title="Memory सबपाथ">
    | सबपाथ | मुख्य एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI सहायकों के लिए bundled memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | हल्के memory embedding provider registry helpers |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine exports |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding contracts, registry access, local provider, और generic batch/remote helpers। इस surface पर `registerMemoryEmbeddingProvider` अप्रचलित है; नए providers के लिए generic embedding provider API का उपयोग करें। |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine exports |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine exports |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal helpers |
    | `plugin-sdk/memory-core-host-query` | Memory host query helpers |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret helpers |
    | `plugin-sdk/memory-core-host-events` | अप्रचलित संगतता alias; `plugin-sdk/memory-host-events` का उपयोग करें |
    | `plugin-sdk/memory-core-host-status` | Memory host status helpers |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI runtime helpers |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host core runtime helpers |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host file/runtime helpers |
    | `plugin-sdk/memory-host-core` | memory host core runtime helpers के लिए vendor-neutral alias |
    | `plugin-sdk/memory-host-events` | memory host event journal helpers के लिए vendor-neutral alias |
    | `plugin-sdk/memory-host-files` | अप्रचलित संगतता alias; `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
    | `plugin-sdk/memory-host-markdown` | memory-adjacent plugins के लिए साझा managed-markdown helpers |
    | `plugin-sdk/memory-host-search` | search-manager access के लिए Active Memory runtime facade |
    | `plugin-sdk/memory-host-status` | अप्रचलित संगतता alias; `plugin-sdk/memory-core-host-status` का उपयोग करें |
  </Accordion>

  <Accordion title="आरक्षित bundled-helper सबपाथ">
    आरक्षित bundled-helper SDK सबपाथ bundled plugin code के लिए संकीर्ण owner-specific surfaces हैं। इन्हें SDK inventory में track किया जाता है ताकि package builds और aliasing deterministic रहें, लेकिन ये सामान्य plugin authoring APIs नहीं हैं। नए reusable host contracts को generic SDK सबपाथों का उपयोग करना चाहिए, जैसे `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime`।

    | सबपाथ | स्वामी और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | user MCP server config को Codex app-server thread config में project करने के लिए bundled Codex plugin helper |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server native subagents को OpenClaw task state में mirror करने के लिए bundled Codex plugin helper |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
