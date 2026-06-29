---
read_when:
    - plugin import के लिए सही plugin-sdk subpath चुनना
    - बंडल किए गए Plugin उप-पथों और हेल्पर सतहों का ऑडिट करना
summary: 'Plugin SDK उपपथ कैटलॉग: कौन-से imports कहाँ रहते हैं, क्षेत्र के अनुसार समूहीकृत'
title: Plugin SDK उप-पथ
x-i18n:
    generated_at: "2026-06-28T23:53:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK को `openclaw/plugin-sdk/` के अंतर्गत संकीर्ण सार्वजनिक उप-पथों के सेट के रूप में
उजागर किया गया है। यह पृष्ठ उद्देश्य के अनुसार समूहित आम तौर पर उपयोग किए जाने वाले उप-पथों को सूचीबद्ध करता है।
जनरेट की गई compiler entrypoint inventory
`scripts/lib/plugin-sdk-entrypoints.json` में रहती है; package exports वे सार्वजनिक subset हैं
जो `scripts/lib/plugin-sdk-private-local-only-subpaths.json` में सूचीबद्ध repo-local test/internal
उप-पथों को घटाने के बाद बचते हैं। मेंटेनर सार्वजनिक export count को `pnpm plugin-sdk:surface` से
और सक्रिय reserved helper subpaths को `pnpm plugins:boundary-report:summary` से audit कर सकते हैं;
unused reserved helper exports सार्वजनिक SDK में dormant compatibility debt के रूप में रहने के बजाय
CI report को fail कर देते हैं।

Plugin authoring guide के लिए, [Plugin SDK overview](/hi/plugins/sdk-overview) देखें।

## Plugin entry

| Subpath                        | मुख्य exports                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Migration provider item helpers जैसे `createMigrationItem`, reason constants, item status markers, redaction helpers, और `summarizeMigrationItems`                     |
| `plugin-sdk/migration-runtime` | Runtime migration helpers जैसे `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, और `writeMigrationReport`                                                  |
| `plugin-sdk/health`            | Bundled health consumers के लिए Doctor health-check registration, detection, repair, selection, severity, और finding types                                             |

### Deprecated compatibility और test helpers

Deprecated उप-पथ पुराने plugins के लिए exported रहते हैं, लेकिन नए code को नीचे दिए गए
focused SDK subpaths का उपयोग करना चाहिए। Maintained list
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI इससे bundled
production imports को reject करता है। `compat`, `config-types`,
`infra-runtime`, `text-runtime`, और `zod` जैसे broad barrels केवल compatibility के लिए हैं। `zod` को
सीधे `zod` से import करें।

OpenClaw के Vitest-backed test-helper subpaths केवल repo-local हैं और अब
package exports नहीं हैं: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, और `testing`।

### Reserved bundled plugin helper subpaths

ये subpaths अपने owning bundled Plugin के लिए plugin-owned compatibility surfaces हैं,
general SDK APIs नहीं: `plugin-sdk/codex-mcp-projection` और
`plugin-sdk/codex-native-task-runtime`। Cross-owner extension imports को
package contract guardrails द्वारा blocked किया जाता है।

<AccordionGroup>
  <Accordion title="चैनल उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | रूट `openclaw.json` Zod स्कीमा निर्यात (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin-स्वामित्व वाले स्कीमा के लिए कैश किया गया JSON Schema सत्यापन सहायक |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक, सेटअप अनुवादक, अनुमत-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता उपनाम; `plugin-sdk/setup-runtime` का उपयोग करें |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | बहु-खाता कॉन्फ़िगरेशन/action-gate सहायक, डिफ़ॉल्ट-खाता fallback सहायक |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id सामान्यीकरण सहायक |
    | `plugin-sdk/account-resolution` | खाता lookup + डिफ़ॉल्ट-fallback सहायक |
    | `plugin-sdk/account-helpers` | संकीर्ण खाता-सूची/खाता-action सहायक |
    | `plugin-sdk/access-groups` | एक्सेस-समूह अनुमत-सूची पार्सिंग और संशोधित समूह निदान सहायक |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फ़िगरेशन स्कीमा primitives, साथ में Zod और प्रत्यक्ष JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | केवल रखरखाव वाले bundled plugins के लिए bundled OpenClaw चैनल कॉन्फ़िगरेशन स्कीमा |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। ऐसे plugins के लिए कैनोनिकल bundled/official चैट चैनल ids और formatter labels/aliases जिन्हें अपनी तालिका hardcode किए बिना envelope-prefixed टेक्स्ट पहचानने की आवश्यकता होती है। |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel कॉन्फ़िगरेशन स्कीमा के लिए अप्रचलित संगतता उपनाम |
    | `plugin-sdk/telegram-command-config` | bundled-contract fallback के साथ Telegram custom-command सामान्यीकरण/सत्यापन सहायक |
    | `plugin-sdk/command-gating` | संकीर्ण कमांड प्राधिकरण gate सहायक |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | अप्रचलित low-level चैनल ingress संगतता फ़साड। नए receive paths को `plugin-sdk/channel-ingress-runtime` का उपयोग करना चाहिए। |
    | `plugin-sdk/channel-ingress-runtime` | migrated channel receive paths के लिए प्रायोगिक high-level चैनल ingress runtime resolver और route fact builders। प्रत्येक Plugin में effective allowlists, command allowlists, और legacy projections जोड़ने के बजाय इसे प्राथमिकता दें। [Channel ingress API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश lifecycle contracts, साथ में reply pipeline options, receipts, live preview/streaming, lifecycle helpers, outbound identity, payload planning, durable sends, और message-send context helpers। [Channel outbound API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम, साथ में legacy reply-dispatch facades। |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम, साथ में legacy reply-dispatch facades। |
    | `plugin-sdk/inbound-envelope` | साझा inbound route + envelope builder helpers |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता फ़साड। inbound runners और dispatch predicates के लिए `plugin-sdk/channel-inbound`, और message delivery helpers के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित target parsing उपनाम; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | साझा outbound media loading और hosted-media state helpers |
    | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/poll-runtime` | संकीर्ण poll normalization helpers |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycle और adapter helpers |
    | `plugin-sdk/agent-media-payload` | Legacy agent media payload builder |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding, pairing, और configured-binding helpers |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot helper |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy resolution helpers |
    | `plugin-sdk/channel-status` | साझा channel status snapshot/summary helpers |
    | `plugin-sdk/channel-config-primitives` | संकीर्ण channel config-schema primitives |
    | `plugin-sdk/channel-config-writes` | Channel config-write authorization helpers |
    | `plugin-sdk/channel-plugin-common` | साझा channel Plugin prelude exports |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read helpers |
    | `plugin-sdk/group-access` | साझा group-access decision helpers |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता facades। `plugin-sdk/channel-inbound` का उपयोग करें। |
    | `plugin-sdk/direct-dm-guard-policy` | संकीर्ण direct-DM pre-crypto guard policy helpers |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और tracked owner compatibility के लिए अप्रचलित Discord संगतता फ़साड; नए plugins को generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | tracked owner compatibility के लिए अप्रचलित Telegram account-resolution संगतता फ़साड; नए plugins को injected runtime helpers या generic channel SDK subpaths का उपयोग करना चाहिए |
    | `plugin-sdk/zalouser` | प्रकाशित Lark/Zalo packages के लिए अप्रचलित Zalo Personal संगतता फ़साड, जो अभी भी sender command authorization import करते हैं; नए plugins को `plugin-sdk/command-auth` का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | Semantic message presentation, delivery, और legacy interactive reply helpers। [Message Presentation](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/channel-inbound` | event classification, context building, formatting, roots, debounce, mention matching, mention-policy, और inbound logging के लिए साझा inbound helpers |
    | `plugin-sdk/channel-inbound-debounce` | संकीर्ण inbound debounce helpers |
    | `plugin-sdk/channel-mention-gating` | व्यापक inbound runtime surface के बिना संकीर्ण mention-policy, mention marker, और mention text helpers |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | अप्रचलित संगतता facades। `plugin-sdk/channel-inbound` या `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-pairing-paths` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-pairing` का उपयोग करें। |
    | `plugin-sdk/channel-reply-options-runtime` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | Reply result types |
    | `plugin-sdk/channel-actions` | Channel message-action helpers, साथ में Plugin compatibility के लिए रखे गए अप्रचलित native schema helpers |
    | `plugin-sdk/channel-route` | साझा route normalization, parser-driven target resolution, thread-id stringification, dedupe/compact route keys, parsed-target types, और route/target comparison helpers |
    | `plugin-sdk/channel-targets` | Target parsing helpers; route comparison callers को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | Channel contract types |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | संकीर्ण secret-contract helpers, जैसे `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, और secret target types |
  </Accordion>

अप्रचलित चैनल helper families केवल published-plugin संगतता के लिए उपलब्ध रहती हैं। हटाने की योजना है: उन्हें external Plugin migration window तक रखना, repo/bundled plugins को `channel-inbound` और `channel-outbound` पर रखना, फिर अगले major SDK cleanup में compatibility subpaths को हटाना। यह पुराने channel message/runtime, channel streaming, direct-DM access, inbound helper splinter, reply-options, और pairing-path families पर लागू होता है।

  <Accordion title="प्रदाता उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | सेटअप, कैटलॉग खोज, और रनटाइम मॉडल तैयारी के लिए समर्थित LM Studio प्रदाता facade |
    | `plugin-sdk/lmstudio-runtime` | स्थानीय सर्वर डिफ़ॉल्ट, मॉडल खोज, अनुरोध हेडर, और लोडेड-मॉडल सहायकों के लिए समर्थित LM Studio रनटाइम facade |
    | `plugin-sdk/provider-setup` | चयनित स्थानीय/स्वयं-होस्टेड प्रदाता सेटअप सहायक |
    | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्वयं-होस्टेड प्रदाता सेटअप सहायक |
    | `plugin-sdk/cli-backend` | CLI बैकएंड डिफ़ॉल्ट + watchdog स्थिरांक |
    | `plugin-sdk/provider-auth-runtime` | प्रदाता plugins के लिए रनटाइम API-key समाधान सहायक |
    | `plugin-sdk/provider-oauth-runtime` | सामान्य प्रदाता OAuth कॉलबैक प्रकार, कॉलबैक-पृष्ठ रेंडरिंग, PKCE/state सहायक, authorization-input पार्सिंग, token-expiry सहायक, और abort सहायक |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` जैसे API-key onboarding/profile-write सहायक |
    | `plugin-sdk/provider-auth-result` | मानक OAuth auth-result बिल्डर |
    | `plugin-sdk/provider-env-vars` | प्रदाता auth env-var lookup सहायक |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex auth-import सहायक, अप्रचलित `resolveOpenClawAgentDir` compatibility निर्यात |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा replay-policy बिल्डर, provider-endpoint सहायक, और साझा model-id normalization सहायक |
    | `plugin-sdk/provider-catalog-live-runtime` | संरक्षित `/models`-style खोज के लिए लाइव प्रदाता मॉडल कैटलॉग सहायक: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, model-id फ़िल्टरिंग, TTL कैश, और static fallback |
    | `plugin-sdk/provider-catalog-runtime` | कॉन्ट्रैक्ट परीक्षणों के लिए प्रदाता कैटलॉग augmentation रनटाइम hook और plugin-provider registry seams |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | सामान्य प्रदाता HTTP/endpoint capability सहायक, प्रदाता HTTP त्रुटियाँ, और audio transcription multipart form सहायक |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` और `WebFetchProviderPlugin` जैसे संकीर्ण web-fetch config/selection कॉन्ट्रैक्ट सहायक |
    | `plugin-sdk/provider-web-fetch` | Web-fetch प्रदाता registration/cache सहायक |
    | `plugin-sdk/provider-web-search-config-contract` | उन प्रदाताओं के लिए संकीर्ण web-search config/credential सहायक जिन्हें plugin-enable wiring की आवश्यकता नहीं है |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और scoped credential setters/getters जैसे संकीर्ण web-search config/credential कॉन्ट्रैक्ट सहायक |
    | `plugin-sdk/provider-web-search` | Web-search प्रदाता registration/cache/runtime सहायक |
    | `plugin-sdk/embedding-providers` | सामान्य embedding प्रदाता प्रकार और read सहायक, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, और `listEmbeddingProviders(...)` शामिल हैं; plugins `api.registerEmbeddingProvider(...)` के माध्यम से प्रदाता register करते हैं ताकि manifest ownership लागू हो |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
    | `plugin-sdk/provider-usage` | प्रदाता usage snapshot प्रकार, साझा usage fetch सहायक, और `fetchClaudeUsage` जैसे प्रदाता fetchers |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper प्रकार, plain-text tool-call compat, और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper सहायक |
    | `plugin-sdk/provider-stream-shared` | सार्वजनिक साझा प्रदाता stream wrapper सहायक जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, और Anthropic/DeepSeek/OpenAI-compatible stream utilities शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | संरक्षित fetch, transport message transforms, और writable transport event streams जैसे native प्रदाता transport सहायक |
    | `plugin-sdk/provider-onboard` | Onboarding config patch सहायक |
    | `plugin-sdk/global-singleton` | Process-local singleton/map/cache सहायक |
    | `plugin-sdk/group-activation` | संकीर्ण group activation mode और command parsing सहायक |
  </Accordion>

प्रदाता usage snapshots सामान्यतः एक या अधिक quota `windows` रिपोर्ट करते हैं, जिनमें प्रत्येक में
एक label, percent used, और वैकल्पिक reset time होता है। वे प्रदाता जो resettable quota windows के बजाय balance या
account-state text प्रदर्शित करते हैं, उन्हें percentages गढ़ने के बजाय
खाली `windows` array के साथ `summary` लौटाना चाहिए।
OpenClaw उस summary text को status output में दिखाता है; `error` का उपयोग केवल तब करें जब
usage endpoint विफल हो गया हो या उसने कोई उपयोगी usage data न लौटाया हो।

  <Accordion title="Auth और सुरक्षा उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry सहायक जिनमें dynamic argument menu formatting, sender-authorization सहायक शामिल हैं |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` और `buildHelpMessage` जैसे command/help message बिल्डर |
    | `plugin-sdk/approval-auth-runtime` | Approver resolution और same-chat action-auth सहायक |
    | `plugin-sdk/approval-client-runtime` | Native exec approval profile/filter सहायक |
    | `plugin-sdk/approval-delivery-runtime` | Native approval capability/delivery adapters |
    | `plugin-sdk/approval-gateway-runtime` | साझा approval gateway-resolution सहायक |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoints के लिए हल्के native approval adapter loading सहायक |
    | `plugin-sdk/approval-handler-runtime` | व्यापक approval handler रनटाइम सहायक; जब संकीर्ण adapter/gateway seams पर्याप्त हों तो उन्हें प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | Native approval target, account-binding, route-gate, forwarding fallback, और local native exec prompt suppression सहायक |
    | `plugin-sdk/approval-reaction-runtime` | Hardcoded approval reaction bindings, reaction prompt payloads, reaction target stores, और local native exec prompt suppression के लिए compatibility निर्यात |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin approval reply payload सहायक |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval payload सहायक, native approval routing/runtime सहायक, और `formatApprovalDisplayPath` जैसे structured approval display सहायक |
    | `plugin-sdk/reply-dedupe` | संकीर्ण inbound reply dedupe reset सहायक |
    | `plugin-sdk/channel-contract-testing` | व्यापक testing barrel के बिना संकीर्ण channel contract test सहायक |
    | `plugin-sdk/command-auth-native` | Native command auth, dynamic argument menu formatting, और native session-target सहायक |
    | `plugin-sdk/command-detection` | साझा command detection सहायक |
    | `plugin-sdk/command-primitives-runtime` | hot channel paths के लिए हल्के command text predicates |
    | `plugin-sdk/command-surface` | Command-body normalization और command-surface सहायक |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret surfaces के लिए संकीर्ण secret-contract collection सहायक |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config parsing के लिए संकीर्ण `coerceSecretRef` और SecretRef typing सहायक |
    | `plugin-sdk/secret-provider-integration` | बाहरी secret provider presets प्रकाशित करने वाले plugins के लिए type-only SecretRef provider integration manifest और preset कॉन्ट्रैक्ट |
    | `plugin-sdk/security-runtime` | साझा trust, DM gating, root-bounded file/path सहायक जिनमें create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store सहायक, symlink-parent guards, external-content, sensitive text redaction, constant-time secret comparison, और secret-collection सहायक शामिल हैं |
    | `plugin-sdk/ssrf-policy` | Host allowlist और private-network SSRF policy सहायक |
    | `plugin-sdk/ssrf-dispatcher` | व्यापक infra runtime surface के बिना संकीर्ण pinned-dispatcher सहायक |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error, और SSRF policy सहायक |
    | `plugin-sdk/secret-input` | Secret input parsing सहायक |
    | `plugin-sdk/webhook-ingress` | Webhook request/target सहायक और raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Request body size/timeout सहायक |
  </Accordion>

  <Accordion title="रनटाइम और स्टोरेज उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/runtime` | व्यापक रनटाइम/लॉगिंग/बैकअप/plugin-इंस्टॉल सहायक |
    | `plugin-sdk/runtime-env` | संकरे रनटाइम env, लॉगर, टाइमआउट, रिट्राई, और बैकऑफ सहायक |
    | `plugin-sdk/browser-config` | सामान्यीकृत प्रोफाइल/डिफॉल्ट, CDP URL पार्सिंग, और ब्राउज़र-कंट्रोल प्रमाणीकरण सहायकों के लिए समर्थित ब्राउज़र कॉन्फिग फेसाड |
    | `plugin-sdk/agent-harness-task-runtime` | होस्ट-जारी टास्क स्कोप का उपयोग करने वाले हार्नेस-समर्थित एजेंटों के लिए सामान्य टास्क लाइफसाइकल और पूर्णता डिलीवरी सहायक |
    | `plugin-sdk/codex-mcp-projection` | यूज़र MCP सर्वर कॉन्फिग को Codex थ्रेड कॉन्फिग में प्रोजेक्ट करने के लिए आरक्षित बंडल्ड Codex सहायक; तृतीय-पक्ष plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | नेटिव टास्क मिरर/रनटाइम वायरिंग के लिए निजी बंडल्ड Codex सहायक; तृतीय-पक्ष plugins के लिए नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य चैनल रनटाइम-कॉन्टेक्स्ट रजिस्ट्रेशन और लुकअप सहायक |
    | `plugin-sdk/matrix` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Matrix संगतता फेसाड; नए plugins को सीधे `plugin-sdk/run-command` आयात करना चाहिए |
    | `plugin-sdk/mattermost` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Mattermost संगतता फेसाड; नए plugins को सामान्य SDK उपपथ सीधे आयात करने चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | साझा plugin कमांड/हुक/http/इंटरैक्टिव सहायक |
    | `plugin-sdk/hook-runtime` | साझा Webhook/आंतरिक हुक पाइपलाइन सहायक |
    | `plugin-sdk/lazy-runtime` | लेज़ी रनटाइम आयात/बाइंडिंग सहायक जैसे `createLazyRuntimeModule`, `createLazyRuntimeMethod`, और `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | प्रोसेस exec सहायक |
    | `plugin-sdk/cli-runtime` | CLI फॉर्मैटिंग, प्रतीक्षा, वर्शन, आर्ग्युमेंट-इनवोकेशन, और लेज़ी कमांड-ग्रुप सहायक |
    | `plugin-sdk/qa-live-transport-scenarios` | साझा लाइव ट्रांसपोर्ट QA सिनेरियो ids, बेसलाइन कवरेज सहायक, और सिनेरियो-चयन सहायक |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले plugin HTTP रूटों के लिए आरक्षित Gateway मेथड डिस्पैच सहायक |
    | `plugin-sdk/gateway-runtime` | Gateway क्लाइंट, इवेंट-लूप-रेडी क्लाइंट स्टार्ट सहायक, gateway CLI RPC, gateway प्रोटोकॉल त्रुटियां, और चैनल-स्टेटस पैच सहायक |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` और चैनल/प्रोवाइडर कॉन्फिग प्रकारों जैसे plugin कॉन्फिग आकारों के लिए केंद्रित केवल-प्रकार कॉन्फिग सतह |
    | `plugin-sdk/plugin-config-runtime` | रनटाइम plugin-कॉन्फिग लुकअप सहायक जैसे `requireRuntimeConfig`, `resolvePluginConfigObject`, और `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | ट्रांजैक्शनल कॉन्फिग म्यूटेशन सहायक जैसे `mutateConfigFile`, `replaceConfigFile`, और `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | साझा मैसेज-टूल डिलीवरी मेटाडेटा हिंट स्ट्रिंग्स |
    | `plugin-sdk/runtime-config-snapshot` | वर्तमान प्रोसेस कॉन्फिग स्नैपशॉट सहायक जैसे `getRuntimeConfig`, `getRuntimeConfigSnapshot`, और टेस्ट स्नैपशॉट सेटर |
    | `plugin-sdk/telegram-command-config` | Telegram कमांड-नाम/विवरण सामान्यीकरण और डुप्लिकेट/कॉन्फ्लिक्ट जांचें, भले ही बंडल्ड Telegram कॉन्ट्रैक्ट सतह उपलब्ध न हो |
    | `plugin-sdk/text-autolink-runtime` | व्यापक टेक्स्ट बैरल के बिना फाइल-रेफरेंस ऑटोलिंक पहचान |
    | `plugin-sdk/approval-reaction-runtime` | हार्डकोडेड अनुमोदन रिएक्शन बाइंडिंग, रिएक्शन प्रॉम्प्ट पेलोड, रिएक्शन टारगेट स्टोर, और लोकल नेटिव exec प्रॉम्प्ट सप्रेशन के लिए संगतता निर्यात |
    | `plugin-sdk/approval-runtime` | Exec/plugin अनुमोदन सहायक, अनुमोदन-कैपेबिलिटी बिल्डर, auth/प्रोफाइल सहायक, नेटिव रूटिंग/रनटाइम सहायक, और संरचित अनुमोदन डिस्प्ले पथ फॉर्मैटिंग |
    | `plugin-sdk/reply-runtime` | साझा इनबाउंड/रिप्लाई रनटाइम सहायक, चंकिंग, डिस्पैच, heartbeat, रिप्लाई प्लानर |
    | `plugin-sdk/reply-dispatch-runtime` | संकरे रिप्लाई डिस्पैच/फाइनलाइज़ और बातचीत-लेबल सहायक |
    | `plugin-sdk/reply-history` | साझा शॉर्ट-विंडो रिप्लाई-हिस्ट्री सहायक। नए मैसेज-टर्न कोड को `createChannelHistoryWindow` का उपयोग करना चाहिए; निचले-स्तर के मैप सहायक केवल अप्रचलित संगतता निर्यात बने रहते हैं |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | संकरे टेक्स्ट/मार्कडाउन चंकिंग सहायक |
    | `plugin-sdk/session-store-runtime` | सेशन वर्कफ़्लो सहायक (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), सेशन पहचान द्वारा सीमित हालिया यूज़र/असिस्टेंट ट्रांसक्रिप्ट टेक्स्ट रीड, लीगेसी सेशन स्टोर पथ/सेशन-की सहायक, updated-at रीड, और केवल-ट्रांजिशन whole-store/file-path संगतता सहायक |
    | `plugin-sdk/session-transcript-runtime` | ट्रांसक्रिप्ट पहचान, स्कोप्ड टारगेट/रीड/राइट सहायक, अपडेट प्रकाशन, राइट लॉक, और ट्रांसक्रिप्ट मेमोरी हिट की |
    | `plugin-sdk/sqlite-runtime` | फर्स्ट-पार्टी रनटाइम के लिए केंद्रित SQLite एजेंट-स्कीमा, पथ, और ट्रांजैक्शन सहायक |
    | `plugin-sdk/cron-store-runtime` | Cron स्टोर पथ/लोड/सेव सहायक |
    | `plugin-sdk/state-paths` | स्टेट/OAuth dir पथ सहायक |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite keyed-state प्रकार और plugin-स्वामित्व वाले डेटाबेस के लिए केंद्रीकृत कनेक्शन pragma और WAL रखरखाव सेटअप |
    | `plugin-sdk/routing` | रूट/सेशन-की/अकाउंट बाइंडिंग सहायक जैसे `resolveAgentRoute`, `buildAgentSessionKey`, और `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | साझा चैनल/अकाउंट स्टेटस सारांश सहायक, रनटाइम-स्टेट डिफॉल्ट, और issue मेटाडेटा सहायक |
    | `plugin-sdk/target-resolver-runtime` | साझा टारगेट रिज़ॉल्वर सहायक |
    | `plugin-sdk/string-normalization-runtime` | Slug/स्ट्रिंग सामान्यीकरण सहायक |
    | `plugin-sdk/request-url` | fetch/request-जैसे इनपुट से स्ट्रिंग URL निकालें |
    | `plugin-sdk/run-command` | सामान्यीकृत stdout/stderr परिणामों वाला टाइम्ड कमांड रनर |
    | `plugin-sdk/param-readers` | सामान्य टूल/CLI param रीडर |
    | `plugin-sdk/tool-plugin` | एक सरल टाइप्ड agent-tool plugin परिभाषित करें और manifest generation के लिए स्थिर मेटाडेटा उजागर करें |
    | `plugin-sdk/tool-payload` | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
    | `plugin-sdk/tool-send` | टूल args से कैननिकल send target फील्ड निकालें |
    | `plugin-sdk/sandbox` | Sandbox बैकएंड प्रकार और SSH/OpenShell कमांड सहायक, जिसमें fail-fast exec कमांड preflight शामिल है |
    | `plugin-sdk/temp-path` | साझा temp-download पथ सहायक और निजी सुरक्षित temp वर्कस्पेस |
    | `plugin-sdk/logging-core` | सबसिस्टम लॉगर और रिडैक्शन सहायक |
    | `plugin-sdk/markdown-table-runtime` | Markdown टेबल मोड और रूपांतरण सहायक |
    | `plugin-sdk/model-session-runtime` | मॉडल/सेशन ओवरराइड सहायक जैसे `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk प्रोवाइडर कॉन्फिग रिज़ॉल्यूशन सहायक |
    | `plugin-sdk/json-store` | छोटे JSON स्टेट रीड/राइट सहायक |
    | `plugin-sdk/json-unsafe-integers` | JSON पार्सिंग सहायक जो असुरक्षित integer literals को स्ट्रिंग के रूप में सुरक्षित रखते हैं |
    | `plugin-sdk/file-lock` | Re-entrant file-lock सहायक |
    | `plugin-sdk/persistent-dedupe` | Disk-backed dedupe cache सहायक |
    | `plugin-sdk/acp-runtime` | ACP रनटाइम/सेशन और रिप्लाई-डिस्पैच सहायक |
    | `plugin-sdk/acp-runtime-backend` | स्टार्टअप-लोडेड plugins के लिए हल्के ACP बैकएंड रजिस्ट्रेशन और रिप्लाई-डिस्पैच सहायक |
    | `plugin-sdk/acp-binding-resolve-runtime` | लाइफसाइकल स्टार्टअप आयातों के बिना केवल-पढ़ने ACP बाइंडिंग रिज़ॉल्यूशन |
    | `plugin-sdk/agent-config-primitives` | संकरे एजेंट रनटाइम कॉन्फिग-स्कीमा primitives |
    | `plugin-sdk/boolean-param` | Loose boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name मिलान रिज़ॉल्यूशन सहायक |
    | `plugin-sdk/device-bootstrap` | डिवाइस bootstrap और pairing token सहायक |
    | `plugin-sdk/extension-shared` | साझा passive-channel, status, और ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` कमांड/प्रोवाइडर रिप्लाई सहायक |
    | `plugin-sdk/skill-commands-runtime` | Skill कमांड लिस्टिंग सहायक |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize सहायक |
    | `plugin-sdk/agent-harness` | निम्न-स्तरीय एजेंट हार्नेस के लिए प्रयोगात्मक trusted-plugin सतह: हार्नेस प्रकार, active-run steer/abort सहायक, OpenClaw टूल ब्रिज सहायक, runtime-plan tool policy सहायक, terminal outcome classification, tool progress formatting/detail सहायक, और attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | अप्रचलित Z.AI provider-owned endpoint detection facade; Z.AI plugin public API का उपयोग करें |
    | `plugin-sdk/async-lock-runtime` | छोटी रनटाइम स्टेट फाइलों के लिए process-local async lock सहायक |
    | `plugin-sdk/channel-activity-runtime` | Channel activity telemetry सहायक |
    | `plugin-sdk/concurrency-runtime` | Bounded async task concurrency सहायक |
    | `plugin-sdk/dedupe-runtime` | In-memory dedupe cache सहायक |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain सहायक |
    | `plugin-sdk/file-access-runtime` | सुरक्षित local-file और media-source पथ सहायक |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat wake, event, और visibility सहायक |
    | `plugin-sdk/number-runtime` | Numeric coercion सहायक |
    | `plugin-sdk/secure-random-runtime` | सुरक्षित token/UUID सहायक |
    | `plugin-sdk/system-event-runtime` | System event queue सहायक |
    | `plugin-sdk/transport-ready-runtime` | Transport readiness wait सहायक |
    | `plugin-sdk/exec-approvals-runtime` | व्यापक infra-runtime बैरल के बिना Exec approval policy file सहायक |
    | `plugin-sdk/infra-runtime` | अप्रचलित संगतता shim; ऊपर दिए गए केंद्रित रनटाइम उपपथों का उपयोग करें |
    | `plugin-sdk/collection-runtime` | Small bounded cache सहायक |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flag, event, और trace-context सहायक |
    | `plugin-sdk/error-runtime` | Error graph, formatting, shared error classification सहायक, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, EnvHttpProxyAgent option, और pinned lookup सहायक |
    | `plugin-sdk/runtime-fetch` | Proxy/guarded-fetch आयातों के बिना dispatcher-aware runtime fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | व्यापक media runtime surface के बिना inline image data URL sanitizer और signature sniffing सहायक |
    | `plugin-sdk/response-limit-runtime` | व्यापक media runtime surface के बिना bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routing या pairing stores के बिना current conversation binding state |
    | `plugin-sdk/session-store-runtime` | व्यापक config writes/maintenance आयातों के बिना session-store सहायक |
    | `plugin-sdk/sqlite-runtime` | database lifecycle controls के बिना केंद्रित SQLite agent-schema, path, और transaction सहायक |
    | `plugin-sdk/context-visibility-runtime` | व्यापक config/security आयातों के बिना context visibility resolution और supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging आयातों के बिना संकरे primitive record/string coercion और normalization सहायक |
    | `plugin-sdk/host-runtime` | Hostname और SCP host normalization सहायक |
    | `plugin-sdk/retry-runtime` | Retry config और retry runner सहायक |
    | `plugin-sdk/agent-runtime` | एजेंट dir/identity/workspace सहायक, जिनमें `resolveAgentDir`, `resolveDefaultAgentDir`, और अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात शामिल हैं |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/media-runtime` | साझा मीडिया फ़ेच/रूपांतरण/स्टोर सहायक, जिनमें `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और अप्रचलित `fetchRemoteMedia` शामिल हैं; जब किसी URL को OpenClaw मीडिया बनना हो, तो बफ़र पढ़ने से पहले स्टोर सहायकों को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | संकीर्ण MIME सामान्यीकरण, फ़ाइल-एक्सटेंशन मैपिंग, MIME पहचान, और मीडिया-प्रकार सहायक |
    | `plugin-sdk/media-store` | संकीर्ण मीडिया स्टोर सहायक जैसे `saveMediaBuffer` और `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन फ़ेलओवर सहायक, उम्मीदवार चयन, और अनुपस्थित-मॉडल संदेश |
    | `plugin-sdk/media-understanding` | मीडिया समझ प्रदाता प्रकार और प्रदाता-सामने image/audio/structured-extraction सहायक निर्यात |
    | `plugin-sdk/text-chunking` | टेक्स्ट और markdown चंकिंग/रेंडर सहायक, markdown तालिका रूपांतरण, directive-tag हटाना, और सुरक्षित-टेक्स्ट उपयोगिताएँ |
    | `plugin-sdk/text-chunking` | आउटबाउंड टेक्स्ट चंकिंग सहायक |
    | `plugin-sdk/speech` | स्पीच प्रदाता प्रकार और प्रदाता-सामने directive, registry, validation, OpenAI-संगत TTS builder, और स्पीच सहायक निर्यात |
    | `plugin-sdk/speech-core` | साझा स्पीच प्रदाता प्रकार, registry, directive, normalization, और स्पीच सहायक निर्यात |
    | `plugin-sdk/realtime-transcription` | रियलटाइम ट्रांसक्रिप्शन प्रदाता प्रकार, registry सहायक, और साझा WebSocket सेशन सहायक |
    | `plugin-sdk/realtime-bootstrap-context` | सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` संदर्भ इंजेक्शन के लिए रियलटाइम प्रोफ़ाइल बूटस्ट्रैप सहायक |
    | `plugin-sdk/realtime-voice` | रियलटाइम वॉइस प्रदाता प्रकार, registry सहायक, और साझा रियलटाइम वॉइस व्यवहार सहायक, जिनमें आउटपुट गतिविधि ट्रैकिंग शामिल है |
    | `plugin-sdk/image-generation` | इमेज जनरेशन प्रदाता प्रकार और इमेज एसेट/data URL सहायक, तथा OpenAI-संगत इमेज प्रदाता builder |
    | `plugin-sdk/image-generation-core` | साझा इमेज-जनरेशन प्रकार, फ़ेलओवर, auth, और registry सहायक |
    | `plugin-sdk/music-generation` | संगीत जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/music-generation-core` | साझा संगीत-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता lookup, और model-ref parsing |
    | `plugin-sdk/video-generation` | वीडियो जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता lookup, और model-ref parsing |
    | `plugin-sdk/transcripts` | साझा ट्रांसक्रिप्ट स्रोत प्रदाता प्रकार, registry सहायक, सेशन descriptors, और utterance metadata |
    | `plugin-sdk/webhook-targets` | Webhook लक्ष्य registry और route-install सहायक |
    | `plugin-sdk/webhook-path` | अप्रचलित संगतता alias; `plugin-sdk/webhook-ingress` का उपयोग करें |
    | `plugin-sdk/web-media` | साझा remote/local मीडिया लोडिंग सहायक |
    | `plugin-sdk/zod` | अप्रचलित संगतता re-export; `zod` को सीधे `zod` से import करें |
    | `plugin-sdk/testing` | विरासत OpenClaw परीक्षणों के लिए रेपो-स्थानीय अप्रचलित संगतता barrel। नए रेपो परीक्षणों को इसके बजाय केंद्रित स्थानीय परीक्षण उपपथों जैसे `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, या `plugin-sdk/test-fixtures` से import करना चाहिए |
    | `plugin-sdk/plugin-test-api` | रेपो परीक्षण सहायक bridges import किए बिना सीधे Plugin पंजीकरण unit tests के लिए रेपो-स्थानीय न्यूनतम `createTestPluginApi` सहायक |
    | `plugin-sdk/agent-runtime-test-contracts` | auth, delivery, fallback, tool-hook, prompt-overlay, schema, और transcript projection परीक्षणों के लिए रेपो-स्थानीय native agent-runtime adapter contract fixtures |
    | `plugin-sdk/channel-test-helpers` | generic actions/setup/status contracts, directory assertions, account startup lifecycle, send-config threading, runtime mocks, status issues, outbound delivery, और hook registration के लिए रेपो-स्थानीय channel-oriented test helpers |
    | `plugin-sdk/channel-target-testing` | channel परीक्षणों के लिए रेपो-स्थानीय साझा target-resolution error-case suite |
    | `plugin-sdk/plugin-test-contracts` | रेपो-स्थानीय Plugin package, registration, public artifact, direct import, runtime API, और import side-effect contract helpers |
    | `plugin-sdk/provider-test-contracts` | रेपो-स्थानीय provider runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch, और stream contract helpers |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` का अभ्यास करने वाले प्रदाता परीक्षणों के लिए रेपो-स्थानीय opt-in Vitest HTTP/auth mocks |
    | `plugin-sdk/test-fixtures` | रेपो-स्थानीय generic CLI runtime capture, sandbox context, skill writer, agent-message, system-event, module reload, bundled plugin path, terminal-text, chunking, auth-token, और typed-case fixtures |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` factories के भीतर उपयोग के लिए रेपो-स्थानीय केंद्रित Node builtin mock helpers |
  </Accordion>

  <Accordion title="Memory उपपथ">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI सहायकों के लिए bundled memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | हल्के memory embedding provider registry helpers |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine exports |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding contracts, registry access, local provider, और generic batch/remote helpers। इस surface पर `registerMemoryEmbeddingProvider` अप्रचलित है; नए प्रदाताओं के लिए generic embedding provider API का उपयोग करें। |
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
    | `plugin-sdk/memory-host-core` | Memory host core runtime helpers के लिए vendor-neutral alias |
    | `plugin-sdk/memory-host-events` | Memory host event journal helpers के लिए vendor-neutral alias |
    | `plugin-sdk/memory-host-files` | अप्रचलित संगतता alias; `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
    | `plugin-sdk/memory-host-markdown` | memory-adjacent plugins के लिए साझा managed-markdown helpers |
    | `plugin-sdk/memory-host-search` | search-manager access के लिए active memory runtime facade |
    | `plugin-sdk/memory-host-status` | अप्रचलित संगतता alias; `plugin-sdk/memory-core-host-status` का उपयोग करें |
  </Accordion>

  <Accordion title="आरक्षित bundled-helper उपपथ">
    आरक्षित bundled-helper SDK उपपथ bundled Plugin कोड के लिए संकीर्ण owner-specific surfaces हैं। उन्हें SDK inventory में track किया जाता है ताकि package builds और aliasing deterministic रहें, लेकिन वे सामान्य Plugin authoring APIs नहीं हैं। नए पुन: उपयोग योग्य host contracts को generic SDK उपपथों जैसे `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime` का उपयोग करना चाहिए।

    | उपपथ | स्वामी और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | user MCP server config को Codex app-server thread config में project करने के लिए bundled Codex Plugin helper |
    | `plugin-sdk/codex-native-task-runtime` | Codex app-server native subagents को OpenClaw task state में mirror करने के लिए bundled Codex Plugin helper |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
