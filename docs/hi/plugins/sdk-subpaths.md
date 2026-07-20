---
read_when:
    - Plugin इम्पोर्ट के लिए सही plugin-sdk सबपाथ चुनना
    - बंडल किए गए Plugin के उप-पथों और सहायक सतहों का ऑडिट करना
summary: 'Plugin SDK सबपाथ कैटलॉग: क्षेत्र के अनुसार समूहीकृत, कौन-से इम्पोर्ट कहाँ स्थित हैं'
title: Plugin SDK उपपथ
x-i18n:
    generated_at: "2026-07-20T07:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17f09b2095cbef8f330dbb500c11bd86ff79cb2d93b1f1d2feadb2b3e44127c2
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK में संकीर्ण सार्वजनिक उपपथ और केवल रिपॉज़िटरी के लिए बंडल किए गए
सहायक `openclaw/plugin-sdk/` के अंतर्गत होते हैं। यह पृष्ठ दोनों को सूचीबद्ध करता है और
निजी-स्थानीय प्रविष्टियों को स्पष्ट रूप से चिह्नित करता है। तीन फ़ाइलें सीमा निर्धारित करती हैं:

- `scripts/lib/plugin-sdk-entrypoints.json`: अनुरक्षित एंट्रीपॉइंट सूची
  जिसे बिल्ड कंपाइल करता है।
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: रिपॉज़िटरी-स्थानीय
  परीक्षण/आंतरिक उपपथ। पैकेज एक्सपोर्ट इस सूची को घटाकर बनी सूची हैं।
- `src/plugin-sdk/entrypoints.ts`: अप्रचलित
  उपपथों, आरक्षित बंडल सहायकों, समर्थित बंडल फ़साड और
  Plugin-स्वामित्व वाली सार्वजनिक सतहों के लिए वर्गीकरण मेटाडेटा।

अनुरक्षक सार्वजनिक एक्सपोर्ट की संख्या का ऑडिट `pnpm plugin-sdk:surface` से और
सक्रिय आरक्षित सहायक उपपथों का ऑडिट `pnpm plugins:boundary-report:summary` से करते हैं;
अप्रयुक्त आरक्षित सहायक एक्सपोर्ट निष्क्रिय संगतता ऋण के रूप में
सार्वजनिक SDK में बने रहने के बजाय CI रिपोर्ट को विफल कर देते हैं।

Plugin लेखन मार्गदर्शिका के लिए, [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) देखें।

## Plugin प्रविष्टि

| उपपथ                        | प्रमुख एक्सपोर्ट                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | जुलाई 2026 के बाद निजी-स्थानीय; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | जुलाई 2026 के बाद निजी-स्थानीय; माइग्रेशन प्रदाता आइटम सहायक, जैसे `createMigrationItem`, कारण स्थिरांक, आइटम स्थिति मार्कर, रिडैक्शन सहायक और `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; रनटाइम माइग्रेशन सहायक, जैसे `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` और `writeMigrationReport`              |
| `plugin-sdk/health`            | बंडल किए गए स्वास्थ्य उपभोक्ताओं के लिए Doctor स्वास्थ्य-जाँच पंजीकरण, पहचान, सुधार, चयन, गंभीरता और निष्कर्ष प्रकार                                                                                |

### संगतता और निजी-स्थानीय सहायक

केवल बाद की अवधि वाले अप्रचलित उपपथ एक्सपोर्ट किए जाते हैं। जुलाई 2026 के उपनाम और
अप्रयुक्त उपपथ हटा दिए गए, जबकि केवल बंडल किए गए सहायकों को
सार्वजनिक पैकेज से हटा दिया गया है और नीचे निजी-स्थानीय चिह्नित किया गया है। अनुरक्षित सूची
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI बंडल किए गए
`plugin-sdk/text-runtime` को अस्वीकार करता है। ये केवल संगतता के लिए हैं, और `plugin-sdk/zod` एक
संगतता पुनः-एक्सपोर्ट है: `zod` को सीधे `zod` से इम्पोर्ट करें। व्यापक डोमेन
बैरल `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` और
`plugin-sdk/security-runtime` भी केंद्रित
उपपथों के पक्ष में अप्रचलित हैं।

OpenClaw के Vitest-समर्थित परीक्षण-सहायक उपपथ केवल रिपॉज़िटरी-स्थानीय हैं और अब
पैकेज एक्सपोर्ट नहीं हैं: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` और `testing`। निजी बंडल सहायक सतहें
`ssrf-runtime-internal` और `codex-native-task-runtime` भी केवल रिपॉज़िटरी-स्थानीय
हैं।

### बंडल किए गए Plugin सहायक उपपथ

केवल बंडल किए गए सहायक मॉड्यूल जुलाई 2026 की छँटाई के बाद निजी-स्थानीय हैं। क्रॉस-ओनर इम्पोर्ट पैकेज अनुबंध सुरक्षा-सीमाओं द्वारा अवरुद्ध किए जाते हैं। `src/plugin-sdk/entrypoints.ts` उन समर्थित बंडल फ़साड को अलग से ट्रैक करता है जो सार्वजनिक बने हुए हैं—ऐसे SDK
एंट्रीपॉइंट जिन्हें उनके बंडल किए गए Plugin का समर्थन प्राप्त है, जब तक सामान्य अनुबंध
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account` को प्रतिस्थापित नहीं कर देते;
नए कोड के लिए अप्रचलित; नीचे प्रति-पंक्ति टिप्पणियाँ देखें।

<AccordionGroup>
  <Accordion title="चैनल उपपथ">
    | उपपथ | प्रमुख एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; Plugin-स्वामित्व वाली स्कीमाओं के लिए कैश किया गया JSON Schema सत्यापन सहायक |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ में `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक, सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | बहु-अकाउंट कॉन्फ़िगरेशन/क्रिया-गेट सहायक, डिफ़ॉल्ट-अकाउंट फ़ॉलबैक सहायक |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, अकाउंट-ID सामान्यीकरण सहायक |
    | `plugin-sdk/account-resolution` | अकाउंट खोज + डिफ़ॉल्ट-फ़ॉलबैक सहायक |
    | `plugin-sdk/account-helpers` | संकीर्ण अकाउंट-सूची/अकाउंट-क्रिया सहायक |
    | `plugin-sdk/access-groups` | जुलाई 2026 के बाद निजी-स्थानीय; एक्सेस-समूह अनुमति-सूची पार्सिंग और रिडैक्ट किए गए समूह निदान सहायक |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फ़िगरेशन स्कीमा प्रिमिटिव, साथ में Zod और प्रत्यक्ष JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | जुलाई 2026 के बाद निजी-स्थानीय; केवल अनुरक्षित बंडल किए गए Plugin के लिए बंडल की गई OpenClaw चैनल कॉन्फ़िगरेशन स्कीमाएँ |
    | `plugin-sdk/chat-channel-ids` | जुलाई 2026 के बाद निजी-स्थानीय; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। उन Plugin के लिए कैनोनिकल बंडल/आधिकारिक चैट चैनल ID और फ़ॉर्मैटर लेबल/उपनाम, जिन्हें अपनी तालिका हार्डकोड किए बिना एनवेलप-उपसर्गयुक्त टेक्स्ट पहचानना होता है। |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | माइग्रेट किए गए चैनल प्राप्ति पथों के लिए प्रयोगात्मक उच्च-स्तरीय चैनल इनग्रेस रनटाइम रिज़ॉल्वर, अंतर्निहित-उल्लेख नीति रिज़ॉल्वर और रूट तथ्य बिल्डर। प्रत्येक Plugin में प्रभावी अनुमति-सूचियाँ, कमांड अनुमति-सूचियाँ और विरासत प्रोजेक्शन संयोजित करने के बजाय इसे प्राथमिकता दें। [चैनल इनग्रेस API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश जीवनचक्र अनुबंध, साथ में उत्तर पाइपलाइन विकल्प, रसीदें, लाइव पूर्वावलोकन/स्ट्रीमिंग, जीवनचक्र सहायक, आउटबाउंड पहचान, पेलोड योजना, टिकाऊ प्रेषण और संदेश-प्रेषण संदर्भ सहायक। [चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम। |
    | `plugin-sdk/inbound-envelope` | साझा इनबाउंड रूट + एनवेलप बिल्डर सहायक |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता फ़साड। इनबाउंड रनर और डिस्पैच प्रेडिकेट के लिए `plugin-sdk/channel-inbound` तथा संदेश डिलीवरी सहायकों के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित लक्ष्य पार्सिंग उपनाम; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | जुलाई 2026 के बाद निजी-स्थानीय; साझा आउटबाउंड मीडिया लोडिंग और होस्टेड-मीडिया स्थिति सहायक |
    | `plugin-sdk/poll-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; संकीर्ण पोल सामान्यीकरण सहायक |
    | `plugin-sdk/thread-bindings-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; थ्रेड-बाइंडिंग जीवनचक्र और अडैप्टर सहायक |
    | `plugin-sdk/agent-media-payload` | एजेंट मीडिया पेलोड रूट और लोडर के लिए अप्रचलित संगतता फ़साड। नए चैनल Plugin `plugin-sdk/channel-outbound` से टाइप किए गए आउटबाउंड पेलोड नियोजन का उपयोग करते हैं; ऑपरेटर द्वारा उपलब्ध कराई गई स्थानीय-मीडिया लोडिंग तब तक अनुरक्षित फ़साड का उपयोग करती है, जब तक केंद्रित सार्वजनिक लोकल-रूट सीम उपलब्ध न हो। |
    | `plugin-sdk/conversation-runtime` | वार्तालाप/थ्रेड बाइंडिंग, पेयरिंग और कॉन्फ़िगर किए गए बाइंडिंग सहायकों के लिए अप्रचलित व्यापक बैरल; `plugin-sdk/thread-bindings-runtime` और `plugin-sdk/session-binding-runtime` जैसे केंद्रित बाइंडिंग उपपथों को प्राथमिकता दें |
    | `plugin-sdk/runtime-group-policy` | रनटाइम समूह-नीति रिज़ॉल्यूशन सहायक |
    | `plugin-sdk/channel-status` | साझा चैनल स्थिति स्नैपशॉट/सारांश सहायक |
    | `plugin-sdk/channel-config-primitives` | संकीर्ण चैनल कॉन्फ़िगरेशन-स्कीमा प्रिमिटिव |
    | `plugin-sdk/channel-config-writes` | जुलाई 2026 के बाद निजी-स्थानीय; चैनल कॉन्फ़िगरेशन-लेखन प्राधिकरण सहायक |
    | `plugin-sdk/channel-plugin-common` | साझा चैनल Plugin प्रील्यूड एक्सपोर्ट |
    | `plugin-sdk/allowlist-config-edit` | अनुमति-सूची कॉन्फ़िगरेशन संपादन/पठन सहायक |
    | `plugin-sdk/group-access` | अप्रचलित समूह-एक्सेस निर्णय सहायक; `plugin-sdk/channel-ingress-runtime` से `resolveChannelMessageIngress` का उपयोग करें |
    | `plugin-sdk/direct-dm-guard-policy` | जुलाई 2026 के बाद निजी-स्थानीय; संकीर्ण प्रत्यक्ष-DM पूर्व-क्रिप्टो गार्ड नीति सहायक |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और ट्रैक की गई स्वामी संगतता के लिए अप्रचलित Discord संगतता फ़साड; नए Plugin को सामान्य चैनल SDK उपपथों का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | ट्रैक की गई स्वामी संगतता के लिए अप्रचलित Telegram अकाउंट-रिज़ॉल्यूशन संगतता फ़साड; नए Plugin को इंजेक्ट किए गए रनटाइम सहायकों या सामान्य चैनल SDK उपपथों का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | अर्थपूर्ण संदेश प्रस्तुति, डिलीवरी और विरासत इंटरैक्टिव उत्तर सहायक। [संदेश प्रस्तुति](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/question-gateway-runtime` | चैनल इंटरैक्शन हैंडलर से Gateway के माध्यम से रनटाइम-निर्मित `ask_user` विकल्पों को रिज़ॉल्व करें |
    | `plugin-sdk/channel-inbound` | इवेंट वर्गीकरण, संदर्भ निर्माण, फ़ॉर्मैटिंग, रूट, डीबाउंस, उल्लेख मिलान, उल्लेख-नीति और इनबाउंड लॉगिंग के लिए साझा इनबाउंड सहायक |
    | `plugin-sdk/channel-inbound-debounce` | संकीर्ण इनबाउंड डीबाउंस सहायक |
    | `plugin-sdk/channel-mention-gating` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक इनबाउंड रनटाइम सतह के बिना संकीर्ण उल्लेख-नीति, उल्लेख मार्कर और उल्लेख टेक्स्ट सहायक |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | उत्तर परिणाम प्रकार |
    | `plugin-sdk/channel-actions` | चैनल संदेश-क्रिया सहायक, साथ में Plugin संगतता के लिए रखे गए अप्रचलित नेटिव स्कीमा सहायक |
    | `plugin-sdk/channel-route` | जुलाई 2026 के बाद निजी-स्थानीय; साझा रूट सामान्यीकरण, पार्सर-संचालित लक्ष्य रिज़ॉल्यूशन, थ्रेड-ID स्ट्रिंगीकरण, डीडुप/संक्षिप्त रूट कुंजियाँ, पार्स किए गए लक्ष्य प्रकार और रूट/लक्ष्य तुलना सहायक |
    | `plugin-sdk/channel-targets` | जुलाई 2026 के बाद निजी-स्थानीय; लक्ष्य पार्सिंग सहायक; रूट तुलना कॉलर को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | चैनल अनुबंध प्रकार |
    | `plugin-sdk/channel-feedback` | फ़ीडबैक/प्रतिक्रिया वायरिंग |
  </Accordion>

बाद की अवधि वाले चैनल संगतता उपपथ केवल अपनी
रजिस्ट्री तिथियों तक सार्वजनिक रहते हैं। प्रत्यक्ष-DM एक्सेस, उत्तर-विकल्प, पेयरिंग
पथ और चैनल रनटाइम खंडों जैसे जुलाई उपनाम हटा दिए गए हैं; केवल बंडल किए गए सहायक
निजी-स्थानीय हैं।

  <Accordion title="Provider उपपथ">
    | उपपथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | जुलाई 2026 के बाद निजी-स्थानीय; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | जुलाई 2026 के बाद निजी-स्थानीय; चुने हुए स्थानीय/स्वयं-होस्ट किए गए Provider सेटअप सहायक |
    | `plugin-sdk/cli-backend` | जुलाई 2026 के बाद निजी-स्थानीय; CLI बैकएंड डिफ़ॉल्ट + वॉचडॉग स्थिरांक |
    | `plugin-sdk/provider-auth-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; Provider प्रमाणीकरण रनटाइम सहायक: OAuth लूपबैक प्रवाह, टोकन विनिमय, प्रमाणीकरण स्थायित्व और API-कुंजी समाधान |
    | `plugin-sdk/provider-oauth-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; सामान्य Provider OAuth कॉलबैक प्रकार, कॉलबैक-पृष्ठ रेंडरिंग, PKCE/स्थिति सहायक, प्राधिकरण-इनपुट पार्सिंग, टोकन-समाप्ति सहायक और निरस्तीकरण सहायक |
    | `plugin-sdk/provider-auth-api-key` | जुलाई 2026 के बाद निजी-स्थानीय; API-कुंजी ऑनबोर्डिंग/प्रोफ़ाइल-लेखन सहायक, जैसे `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | जुलाई 2026 के बाद निजी-स्थानीय; मानक OAuth प्रमाणीकरण-परिणाम बिल्डर |
    | `plugin-sdk/provider-env-vars` | जुलाई 2026 के बाद निजी-स्थानीय; Provider प्रमाणीकरण पर्यावरण-चर लुकअप सहायक |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex प्रमाणीकरण-आयात सहायक, अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात |
    | `plugin-sdk/provider-model-shared` | जुलाई 2026 के बाद निजी-स्थानीय; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, साझा रीप्ले-नीति बिल्डर, Provider एंडपॉइंट सहायक और साझा मॉडल-ID सामान्यीकरण सहायक |
    | `plugin-sdk/provider-catalog-live-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; संरक्षित `/models`-शैली खोज के लिए लाइव Provider मॉडल कैटलॉग सहायक: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, मॉडल-ID फ़िल्टरिंग, TTL कैश और स्थिर फ़ॉलबैक |
    | `plugin-sdk/provider-catalog-runtime` | अनुबंध परीक्षणों के लिए Provider कैटलॉग संवर्धन रनटाइम हुक और Plugin-Provider रजिस्ट्री सीमाएँ |
    | `plugin-sdk/provider-catalog-shared` | जुलाई 2026 के बाद निजी-स्थानीय; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | जुलाई 2026 के बाद निजी-स्थानीय; सामान्य Provider HTTP/एंडपॉइंट क्षमता सहायक, Provider HTTP त्रुटियाँ और ऑडियो ट्रांसक्रिप्शन मल्टीपार्ट फ़ॉर्म सहायक |
    | `plugin-sdk/provider-web-fetch-contract` | जुलाई 2026 के बाद निजी-स्थानीय; संकीर्ण वेब-फ़ेच कॉन्फ़िगरेशन/चयन अनुबंध सहायक, जैसे `enablePluginInConfig` और `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | जुलाई 2026 के बाद निजी-स्थानीय; वेब-फ़ेच Provider पंजीकरण/कैश सहायक |
    | `plugin-sdk/provider-web-search-config-contract` | जुलाई 2026 के बाद निजी-स्थानीय; उन Provider के लिए संकीर्ण वेब-सर्च कॉन्फ़िगरेशन/क्रेडेंशियल सहायक जिन्हें Plugin-सक्षम वायरिंग की आवश्यकता नहीं है |
    | `plugin-sdk/provider-web-search-contract` | जुलाई 2026 के बाद निजी-स्थानीय; संकीर्ण वेब-सर्च कॉन्फ़िगरेशन/क्रेडेंशियल अनुबंध सहायक, जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और दायरा-निर्धारित क्रेडेंशियल सेटर/गेटर |
    | `plugin-sdk/provider-web-search` | जुलाई 2026 के बाद निजी-स्थानीय; वेब-सर्च Provider पंजीकरण/कैश/रनटाइम सहायक |
    | `plugin-sdk/embedding-providers` | जुलाई 2026 के बाद निजी-स्थानीय; सामान्य एम्बेडिंग Provider प्रकार और पठन सहायक, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` और `listEmbeddingProviders(...)` शामिल हैं; Plugin, `api.registerEmbeddingProvider(...)` के माध्यम से Provider पंजीकृत करते हैं ताकि मैनिफ़ेस्ट स्वामित्व लागू रहे |
    | `plugin-sdk/provider-tools` | जुलाई 2026 के बाद निजी-स्थानीय; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI स्कीमा सफ़ाई + निदान |
    | `plugin-sdk/provider-usage` | जुलाई 2026 के बाद निजी-स्थानीय; Provider उपयोग स्नैपशॉट प्रकार, साझा उपयोग फ़ेच सहायक और `fetchClaudeUsage` जैसे Provider फ़ेचर |
    | `plugin-sdk/provider-stream` | जुलाई 2026 के बाद निजी-स्थानीय; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, स्ट्रीम रैपर प्रकार, सादा-पाठ टूल-कॉल संगतता और साझा Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI रैपर सहायक |
    | `plugin-sdk/provider-stream-shared` | जुलाई 2026 के बाद निजी-स्थानीय; सार्वजनिक साझा Provider स्ट्रीम रैपर सहायक, जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` और Anthropic/DeepSeek/OpenAI-संगत स्ट्रीम उपयोगिताएँ शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; मूल Provider परिवहन सहायक, जैसे संरक्षित फ़ेच, टूल-परिणाम पाठ निष्कर्षण, परिवहन संदेश रूपांतरण और लेखनीय परिवहन घटना स्ट्रीम |
    | `plugin-sdk/provider-onboard` | जुलाई 2026 के बाद निजी-स्थानीय; ऑनबोर्डिंग कॉन्फ़िगरेशन पैच सहायक |
    | `plugin-sdk/global-singleton` | जुलाई 2026 के बाद निजी-स्थानीय; प्रक्रिया-स्थानीय सिंगलटन/मैप/कैश सहायक |
    | `plugin-sdk/group-activation` | जुलाई 2026 के बाद निजी-स्थानीय; संकीर्ण समूह सक्रियण मोड और कमांड पार्सिंग सहायक |
  </Accordion>

Provider उपयोग स्नैपशॉट सामान्यतः एक या अधिक कोटा `windows` की रिपोर्ट करते हैं, जिनमें से प्रत्येक में
एक लेबल, उपयोग किया गया प्रतिशत और वैकल्पिक रीसेट समय होता है। जो Provider रीसेट किए जा सकने वाले कोटा विंडो के बजाय बैलेंस या
खाता-स्थिति पाठ उपलब्ध कराते हैं, उन्हें प्रतिशत गढ़ने के बजाय
रिक्त `windows` सरणी के साथ `summary` लौटाना चाहिए।
OpenClaw उस सारांश पाठ को स्थिति आउटपुट में प्रदर्शित करता है; `error` का उपयोग केवल तब करें जब
उपयोग एंडपॉइंट विफल हो गया हो या उसने कोई उपयोगी उपयोग डेटा न लौटाया हो।

  <Accordion title="प्रमाणीकरण और सुरक्षा उपपथ">
    | उपपथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | अप्रचलित व्यापक कमांड प्राधिकरण सतह (`resolveControlCommandGate`, डायनेमिक आर्ग्युमेंट मेनू फ़ॉर्मेटिंग सहित कमांड रजिस्ट्री सहायक, प्रेषक-प्राधिकरण सहायक); चैनल इनग्रेस/रनटाइम प्राधिकरण या कमांड-स्थिति सहायकों का उपयोग करें |
    | `plugin-sdk/command-status` | कमांड/सहायता संदेश बिल्डर, जैसे `buildCommandsMessagePaginated` और `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | अनुमोदक समाधान और समान-चैट कार्रवाई-प्रमाणीकरण सहायक |
    | `plugin-sdk/approval-client-runtime` | मूल एक्ज़ेक अनुमोदन प्रोफ़ाइल/फ़िल्टर सहायक |
    | `plugin-sdk/approval-delivery-runtime` | मूल अनुमोदन क्षमता/वितरण अडैप्टर |
    | `plugin-sdk/approval-gateway-runtime` | साझा अनुमोदन Gateway रिज़ॉल्वर |
    | `plugin-sdk/approval-reference-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; परिवहन-सीमित अनुमोदन कॉलबैक के लिए निर्धारक टिकाऊ-लोकेटर सहायक |
    | `plugin-sdk/approval-handler-adapter-runtime` | हॉट चैनल प्रवेश-बिंदुओं के लिए हल्के मूल अनुमोदन अडैप्टर लोडिंग सहायक |
    | `plugin-sdk/approval-handler-runtime` | व्यापक अनुमोदन हैंडलर रनटाइम सहायक; जब संकीर्ण अडैप्टर/Gateway सीमाएँ पर्याप्त हों, तो उन्हें प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | मूल अनुमोदन लक्ष्य, खाता-बाइंडिंग, रूट-गेट, फ़ॉरवर्डिंग फ़ॉलबैक और स्थानीय मूल एक्ज़ेक प्रॉम्प्ट दमन सहायक |
    | `plugin-sdk/approval-reaction-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; हार्डकोड किए गए अनुमोदन प्रतिक्रिया बाइंडिंग, प्रतिक्रिया प्रॉम्प्ट पेलोड, प्रतिक्रिया लक्ष्य स्टोर, प्रतिक्रिया संकेत पाठ सहायक और स्थानीय मूल एक्ज़ेक प्रॉम्प्ट दमन के लिए संगतता निर्यात |
    | `plugin-sdk/approval-reply-runtime` | एक्ज़ेक/Plugin अनुमोदन उत्तर पेलोड सहायक |
    | `plugin-sdk/approval-runtime` | एक्ज़ेक/Plugin अनुमोदन पेलोड सहायक, अनुमोदन-क्षमता बिल्डर, अनुमोदन प्रमाणीकरण/प्रोफ़ाइल सहायक, मूल अनुमोदन रूटिंग/रनटाइम सहायक और `formatApprovalDisplayPath` जैसे संरचित अनुमोदन प्रदर्शन सहायक |
    | `plugin-sdk/command-auth-native` | मूल कमांड प्रमाणीकरण, डायनेमिक आर्ग्युमेंट मेनू फ़ॉर्मेटिंग और मूल सत्र-लक्ष्य सहायक |
    | `plugin-sdk/command-detection` | साझा कमांड पहचान सहायक |
    | `plugin-sdk/command-primitives-runtime` | हॉट चैनल पथों के लिए हल्के कमांड पाठ प्रेडिकेट |
    | `plugin-sdk/command-surface` | जुलाई 2026 के बाद निजी-स्थानीय; कमांड-बॉडी सामान्यीकरण और कमांड-सतह सहायक |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; निजी चैनल और वेब UI डिवाइस-कोड पेयरिंग के लिए लेज़ी Provider प्रमाणीकरण लॉगिन प्रवाह सहायक |
    | `plugin-sdk/channel-secret-runtime` | अप्रचलित व्यापक सीक्रेट-अनुबंध सतह (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, सीक्रेट लक्ष्य प्रकार); नीचे दिए गए केंद्रित उपपथों को प्राथमिकता दें |
    | `plugin-sdk/channel-secret-basic-runtime` | गैर-TTS चैनल/Plugin सीक्रेट सतहों के लिए संकीर्ण सीक्रेट-अनुबंध निर्यात और लक्ष्य-रजिस्ट्री बिल्डर |
    | `plugin-sdk/channel-secret-tts-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; संकीर्ण नेस्टेड चैनल TTS सीक्रेट असाइनमेंट सहायक |
    | `plugin-sdk/secret-ref-runtime` | सीक्रेट-अनुबंध/कॉन्फ़िगरेशन पार्सिंग के लिए संकीर्ण SecretRef टाइपिंग, समाधान और योजना-लक्ष्य पथ लुकअप |
    | `plugin-sdk/security-runtime` | विश्वास, DM गेटिंग, रूट-सीमित फ़ाइल/पथ सहायक—जिनमें केवल-निर्माण लेखन, सिंक/एसिंक परमाणु फ़ाइल प्रतिस्थापन, सिबलिंग अस्थायी लेखन, क्रॉस-डिवाइस मूव फ़ॉलबैक, निजी फ़ाइल-स्टोर सहायक, सिमलिंक-पैरेंट गार्ड, बाहरी-सामग्री, संवेदनशील पाठ संशोधन, स्थिर-समय सीक्रेट तुलना और सीक्रेट-संग्रह सहायक शामिल हैं—के लिए अप्रचलित व्यापक बैरल; केंद्रित सुरक्षा/SSRF/सीक्रेट उपपथों को प्राथमिकता दें |
    | `plugin-sdk/ssrf-policy` | होस्ट अनुमति-सूची और निजी-नेटवर्क SSRF नीति सहायक |
    | `plugin-sdk/ssrf-dispatcher` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक अवसंरचना रनटाइम सतह के बिना संकीर्ण पिन्ड-डिस्पैचर सहायक |
    | `plugin-sdk/ssrf-runtime` | पिन्ड-डिस्पैचर, SSRF-संरक्षित फ़ेच, SSRF त्रुटि और SSRF नीति सहायक |
    | `plugin-sdk/secret-input` | सीक्रेट इनपुट पार्सिंग सहायक |
    | `plugin-sdk/webhook-ingress` | Webhook अनुरोध/लक्ष्य सहायक और रॉ वेबसॉकेट/बॉडी प्रकारांतरण |
    | `plugin-sdk/webhook-request-guards` | अनुरोध बॉडी आकार/टाइमआउट सहायक और ट्रैक किए गए पोस्ट-ACK प्रसंस्करण के लिए `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | उपपथ | मुख्य निर्यात |
    | --- | --- |
    | `plugin-sdk/runtime` | रनटाइम/लॉगिंग/बैकअप सहायक, Plugin इंस्टॉल-पथ चेतावनियाँ और प्रोसेस सहायक |
    | `plugin-sdk/runtime-env` | सीमित रनटाइम परिवेश, लॉगर, टाइमआउट, पुनः प्रयास और बैकऑफ़ सहायक |
    | `plugin-sdk/browser-config` | जुलाई 2026 के बाद निजी-स्थानीय; सामान्यीकृत प्रोफ़ाइल/डिफ़ॉल्ट, CDP URL पार्सिंग और ब्राउज़र-नियंत्रण प्रमाणीकरण सहायकों के लिए समर्थित ब्राउज़र कॉन्फ़िगरेशन फ़साड |
    | `plugin-sdk/agent-harness-task-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; होस्ट द्वारा जारी कार्य-स्कोप का उपयोग करने वाले हार्नेस-समर्थित एजेंटों के लिए सामान्य कार्य जीवनचक्र और पूर्णता डिलीवरी सहायक |
    | `plugin-sdk/codex-mcp-projection` | जुलाई 2026 के बाद निजी-स्थानीय; उपयोगकर्ता MCP सर्वर कॉन्फ़िगरेशन को Codex थ्रेड कॉन्फ़िगरेशन में प्रक्षेपित करने के लिए आरक्षित बंडल किया गया Codex सहायक; तृतीय-पक्ष Plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | मूल कार्य मिरर/रनटाइम वायरिंग के लिए रिपॉज़िटरी-स्थानीय बंडल किया गया Codex सहायक; पैकेज निर्यात नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य चैनल रनटाइम-संदर्भ पंजीकरण और लुकअप सहायक |
    | `plugin-sdk/matrix` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Matrix संगतता फ़साड; नए Plugins को सीधे `plugin-sdk/run-command` आयात करना चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin कमांड/हुक/http/इंटरैक्टिव सहायकों के लिए अप्रचलित व्यापक बैरल; केंद्रित Plugin रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/hook-runtime` | Webhook/आंतरिक हुक पाइपलाइन सहायकों के लिए अप्रचलित व्यापक बैरल; केंद्रित हुक/Plugin रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` और `createLazyRuntimeSurface` जैसे विलंबित रनटाइम आयात/बाइंडिंग सहायक |
    | `plugin-sdk/process-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; प्रोसेस निष्पादन सहायक |
    | `plugin-sdk/node-host` | जुलाई 2026 के बाद निजी-स्थानीय; Node-होस्ट निष्पादन-योग्य फ़ाइल समाधान और PTY पुनरारंभ सहायक |
    | `plugin-sdk/cli-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; CLI फ़ॉर्मैटिंग, प्रतीक्षा, संस्करण, तर्क-आह्वान और विलंबित कमांड-समूह सहायकों के लिए अप्रचलित व्यापक बैरल; केंद्रित CLI/रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/qa-runner-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; CLI कमांड सतह के माध्यम से Plugin QA परिदृश्य उजागर करने वाला समर्थित फ़साड |
    | `plugin-sdk/tts-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; टेक्स्ट-टू-स्पीच कॉन्फ़िगरेशन स्कीमा और रनटाइम सहायकों के लिए समर्थित फ़साड |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले Plugin HTTP रूटों के लिए आरक्षित Gateway विधि डिस्पैच सहायक |
    | `plugin-sdk/gateway-runtime` | Gateway क्लाइंट, इवेंट-लूप-तैयार क्लाइंट आरंभ सहायक, Gateway CLI RPC, Gateway प्रोटोकॉल त्रुटियाँ, विज्ञापित LAN होस्ट समाधान और चैनल-स्थिति पैच सहायक |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` जैसे Plugin कॉन्फ़िगरेशन आकारों और चैनल/प्रदाता कॉन्फ़िगरेशन प्रकारों के लिए केंद्रित केवल-प्रकार कॉन्फ़िगरेशन सतह |
    | `plugin-sdk/plugin-config-runtime` | रनटाइम Plugin-कॉन्फ़िगरेशन सहायकों के लिए अप्रचलित संगतता फ़साड; नए Plugins `api.pluginConfig` के साथ केंद्रित कॉन्फ़िगरेशन अनुबंध, स्नैपशॉट और परिवर्तन सहायक उपयोग करते हैं |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` और `logConfigUpdated` जैसे लेन-देनात्मक कॉन्फ़िगरेशन परिवर्तन सहायक |
    | `plugin-sdk/message-tool-delivery-hints` | जुलाई 2026 के बाद निजी-स्थानीय; साझा संदेश-टूल डिलीवरी मेटाडेटा संकेत स्ट्रिंग |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` और परीक्षण स्नैपशॉट सेटर्स जैसे वर्तमान प्रोसेस कॉन्फ़िगरेशन स्नैपशॉट सहायक |
    | `plugin-sdk/text-autolink-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक टेक्स्ट बैरल के बिना फ़ाइल-संदर्भ ऑटोलिंक पहचान |
    | `plugin-sdk/reply-runtime` | साझा इनबाउंड/उत्तर रनटाइम सहायक, खंडन, डिस्पैच, Heartbeat, उत्तर योजनाकार |
    | `plugin-sdk/reply-dispatch-runtime` | सीमित उत्तर डिस्पैच/अंतिमीकरण और वार्तालाप-लेबल सहायक |
    | `plugin-sdk/reply-history` | साझा अल्प-अवधि उत्तर-इतिहास सहायक। नए संदेश-टर्न कोड को `createChannelHistoryWindow` का उपयोग करना चाहिए; निम्न-स्तरीय मैप सहायक केवल अप्रचलित संगतता निर्यात बने रहेंगे |
    | `plugin-sdk/reply-reference` | जुलाई 2026 के बाद निजी-स्थानीय; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | सीमित टेक्स्ट/मार्कडाउन खंडन सहायक |
    | `plugin-sdk/session-store-runtime` | सत्र कार्यप्रवाह सहायक (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), मरम्मत/जीवनचक्र सहायक (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), संक्रमणकालीन `sessionFile` मानों के लिए मार्कर सहायक, सत्र पहचान द्वारा सीमित हालिया उपयोगकर्ता/सहायक ट्रांसक्रिप्ट टेक्स्ट पठन, सत्र स्टोर पथ/सत्र-कुंजी सहायक और अद्यतन-समय पठन, व्यापक कॉन्फ़िगरेशन लेखन/रखरखाव आयातों के बिना |
    | `plugin-sdk/session-transcript-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; ट्रांसक्रिप्ट पहचान, सीमित अपरिष्कृत और दृश्यमान कर्सर, स्कोप किए गए लक्ष्य/पठन/लेखन सहायक, दृश्यमान संदेश-प्रविष्टि प्रक्षेपण, अपडेट प्रकाशन, लेखन लॉक और ट्रांसक्रिप्ट मेमोरी हिट कुंजियाँ |
    | `plugin-sdk/sqlite-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; डेटाबेस जीवनचक्र नियंत्रणों के बिना प्रथम-पक्ष रनटाइम के लिए केंद्रित SQLite एजेंट-स्कीमा, पथ और लेन-देन सहायक |
    | `plugin-sdk/cron-store-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; Cron स्टोर पथ/लोड/सहेजने के सहायक |
    | `plugin-sdk/state-paths` | स्थिति/OAuth डायरेक्टरी पथ सहायक |
    | `plugin-sdk/plugin-state-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; Plugin-स्कोप किए गए कुंजीबद्ध-स्थिति, BLOB और सहकारी SQLite लीज़ अनुबंधों के साथ कनेक्शन प्रैग्मा, सत्यापित WAL रखरखाव और परमाणु STRICT-स्कीमा माइग्रेशन सहायक। लीज़ कॉलबैक को एक निरस्त संकेत मिलता है और टाइप की गई त्रुटियाँ टाइमआउट, रद्दीकरण, स्वामित्व खोने, अमान्य इनपुट और स्टोरेज विफलता के बीच अंतर करती हैं |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` और `resolveDefaultAgentBoundAccountId` जैसे रूट/सत्र-कुंजी/खाता बाइंडिंग सहायक |
    | `plugin-sdk/status-helpers` | साझा चैनल/खाता स्थिति सारांश सहायक, रनटाइम-स्थिति डिफ़ॉल्ट और समस्या मेटाडेटा सहायक |
    | `plugin-sdk/target-resolver-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; साझा लक्ष्य समाधानकर्ता सहायक |
    | `plugin-sdk/string-normalization-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; स्लग/स्ट्रिंग सामान्यीकरण सहायक |
    | `plugin-sdk/request-url` | जुलाई 2026 के बाद निजी-स्थानीय; फ़ेच/अनुरोध-जैसे इनपुट से स्ट्रिंग URL निकालें |
    | `plugin-sdk/run-command` | सामान्यीकृत stdout/stderr परिणामों वाला समयबद्ध कमांड रनर |
    | `plugin-sdk/param-readers` | सामान्य टूल/CLI पैरामीटर रीडर |
    | `plugin-sdk/tool-plugin` | एक सरल टाइप किया गया एजेंट-टूल Plugin परिभाषित करें और मैनिफ़ेस्ट जनरेशन के लिए स्थिर मेटाडेटा उजागर करें |
    | `plugin-sdk/tool-payload` | जुलाई 2026 के बाद निजी-स्थानीय; टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
    | `plugin-sdk/tool-send` | टूल तर्कों से मानक प्रेषण लक्ष्य फ़ील्ड निकालें |
    | `plugin-sdk/sandbox` | जुलाई 2026 के बाद निजी-स्थानीय; सैंडबॉक्स बैकएंड प्रकार और SSH/OpenShell कमांड सहायक, जिनमें त्वरित-विफलता निष्पादन कमांड पूर्व-जाँच शामिल है |
    | `plugin-sdk/temp-path` | साझा अस्थायी-डाउनलोड पथ सहायक और निजी सुरक्षित अस्थायी कार्यस्थान |
    | `plugin-sdk/logging-core` | उपतंत्र लॉगर और संशोधन सहायक |
    | `plugin-sdk/markdown-table-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; मार्कडाउन तालिका मोड और रूपांतरण सहायक |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` जैसे मॉडल/सत्र ओवरराइड सहायक |
    | `plugin-sdk/talk-config-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; वार्ता प्रदाता कॉन्फ़िगरेशन समाधान सहायक |
    | `plugin-sdk/json-store` | छोटे JSON स्थिति पठन/लेखन सहायक |
    | `plugin-sdk/json-unsafe-integers` | जुलाई 2026 के बाद निजी-स्थानीय; असुरक्षित पूर्णांक लिटरल को स्ट्रिंग के रूप में संरक्षित रखने वाले JSON पार्सिंग सहायक |
    | `plugin-sdk/file-lock` | जुलाई 2026 के बाद निजी-स्थानीय; पुनः-प्रवेशी फ़ाइल-लॉक सहायक और निश्चित रूप से पुराने, अपरिवर्तित, सेवानिवृत्त लॉक साइडकार का Doctor-सुरक्षित पुनः दावा |
    | `plugin-sdk/persistent-dedupe` | डिस्क-समर्थित डीडुप कैश सहायक |
    | `plugin-sdk/ingress-effect-once` | गैर-आइडेम्पोटेंट प्रवेश दुष्प्रभावों के लिए टिकाऊ दावा/कमिट गार्ड |
    | `plugin-sdk/acp-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; ACP रनटाइम/सत्र और उत्तर-डिस्पैच सहायक |
    | `plugin-sdk/acp-runtime-backend` | जुलाई 2026 के बाद निजी-स्थानीय; स्टार्टअप पर लोड किए गए Plugins के लिए हल्के ACP बैकएंड पंजीकरण और उत्तर-डिस्पैच सहायक |
    | `plugin-sdk/acp-binding-resolve-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; जीवनचक्र स्टार्टअप आयातों के बिना केवल-पठन ACP बाइंडिंग समाधान |
    | `plugin-sdk/agent-config-primitives` | अप्रचलित एजेंट रनटाइम कॉन्फ़िगरेशन-स्कीमा प्रिमिटिव; स्कीमा प्रिमिटिव को किसी अनुरक्षित Plugin-स्वामित्व वाली सतह से आयात करें |
    | `plugin-sdk/boolean-param` | शिथिल बूलियन पैरामीटर रीडर |
    | `plugin-sdk/dangerous-name-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; खतरनाक-नाम मिलान समाधान सहायक |
    | `plugin-sdk/device-bootstrap` | डिवाइस बूटस्ट्रैप और पेयरिंग टोकन सहायक, जिनमें `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` शामिल है |
    | `plugin-sdk/extension-shared` | साझा निष्क्रिय-चैनल, स्थिति और परिवेशी प्रॉक्सी सहायक प्रिमिटिव |
    | `plugin-sdk/models-provider-runtime` | `/models` कमांड/प्रदाता उत्तर सहायक |
    | `plugin-sdk/skill-commands-runtime` | Skill कमांड सूचीकरण सहायक |
    | `plugin-sdk/native-command-registry` | मूल कमांड रजिस्ट्री/निर्माण/क्रमांकन सहायक |
    | `plugin-sdk/agent-harness` | निम्न-स्तरीय एजेंट हार्नेस के लिए प्रायोगिक विश्वसनीय-Plugin सतह: हार्नेस प्रकार, सक्रिय-रन संचालन/निरस्तीकरण सहायक, OpenClaw टूल ब्रिज सहायक, रनटाइम-योजना टूल नीति सहायक, टर्मिनल परिणाम वर्गीकरण, टूल प्रगति फ़ॉर्मैटिंग/विवरण सहायक और प्रयास परिणाम उपयोगिताएँ |
    | `plugin-sdk/async-lock-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; छोटी रनटाइम स्थिति फ़ाइलों के लिए प्रोसेस-स्थानीय एसिंक्रोनस लॉक सहायक |
    | `plugin-sdk/channel-activity-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; चैनल गतिविधि टेलीमेट्री सहायक |
    | `plugin-sdk/concurrency-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; सीमित एसिंक्रोनस कार्य समवर्तीता सहायक |
    | `plugin-sdk/dedupe-runtime` | इन-मेमोरी और स्थायी-बैकएंड डीडुप कैश सहायक |
    | `plugin-sdk/delivery-queue-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; आउटबाउंड लंबित-डिलीवरी निकासी सहायक |
    | `plugin-sdk/file-access-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; सुरक्षित स्थानीय-फ़ाइल और मीडिया-स्रोत पथ सहायक |
    | `plugin-sdk/heartbeat-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; Heartbeat जागरण, इवेंट और दृश्यता सहायक |
    | `plugin-sdk/expect-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; सिद्ध किए जा सकने वाले रनटाइम अपरिवर्तनीय नियमों के लिए आवश्यक-मान अभिकथन सहायक |
    | `plugin-sdk/number-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; संख्यात्मक प्रकारांतरण सहायक |
    | `plugin-sdk/secure-random-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; सुरक्षित टोकन/UUID सहायक |
    | `plugin-sdk/system-event-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; सिस्टम इवेंट कतार सहायक |
    | `plugin-sdk/transport-ready-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; ट्रांसपोर्ट तत्परता प्रतीक्षा सहायक |
    | `plugin-sdk/exec-approvals-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक इन्फ़्रा-रनटाइम बैरल के बिना निष्पादन अनुमोदन नीति फ़ाइल सहायक |
    | `plugin-sdk/infra-runtime` | अप्रचलित संगतता शिम; ऊपर दिए गए केंद्रित रनटाइम उपपथों का उपयोग करें |
    | `plugin-sdk/collection-runtime` | छोटे सीमित कैश सहायक |
    | `plugin-sdk/diagnostic-runtime` | नैदानिक फ़्लैग, इवेंट और ट्रेस-संदर्भ सहायक |
    | `plugin-sdk/error-runtime` | त्रुटि ग्राफ़, फ़ॉर्मैटिंग, साझा त्रुटि वर्गीकरण सहायक, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; रैप किया गया फ़ेच, प्रॉक्सी, EnvHttpProxyAgent विकल्प और पिन किए गए लुकअप सहायक |
    | `plugin-sdk/runtime-fetch` | जुलाई 2026 के बाद निजी-स्थानीय; प्रॉक्सी/गार्डेड-फ़ेच आयातों के बिना डिस्पैचर-सजग रनटाइम फ़ेच |
    | `plugin-sdk/inline-image-data-url-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक मीडिया रनटाइम सतह के बिना इनलाइन छवि डेटा URL सैनिटाइज़र और हस्ताक्षर पहचान सहायक |
    | `plugin-sdk/response-limit-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक मीडिया रनटाइम सतह के बिना बाइट-, निष्क्रियता- और समयसीमा-सीमित प्रतिक्रिया-बॉडी रीडर |
    | `plugin-sdk/session-binding-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; कॉन्फ़िगर किए गए बाइंडिंग रूटिंग या पेयरिंग स्टोर के बिना वर्तमान वार्तालाप बाइंडिंग स्थिति |
    | `plugin-sdk/context-visibility-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक कॉन्फ़िगरेशन/सुरक्षा आयातों के बिना संदर्भ दृश्यता समाधान और पूरक संदर्भ फ़िल्टरिंग |
    | `plugin-sdk/string-coerce-runtime` | मार्कडाउन/लॉगिंग आयातों के बिना सीमित प्रिमिटिव रिकॉर्ड/स्ट्रिंग प्रकारांतरण और सामान्यीकरण सहायक |
    | `plugin-sdk/html-entity-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; व्यापक टेक्स्ट उपयोगिताओं के बिना एकल-पास अर्धविराम-समाप्त HTML5 एंटिटी डिकोडिंग |
    | `plugin-sdk/text-utility-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; पाँच-इकाई HTML एस्केपिंग सहित निम्न-स्तरीय टेक्स्ट और पाथ सहायक |
    | `plugin-sdk/widget-html` | स्व-निहित HTML विजेट के लिए पूर्ण-दस्तावेज़ पहचान, आकार सत्यापन और टूल इनपुट त्रुटियाँ |
    | `plugin-sdk/host-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; होस्टनेम और SCP होस्ट सामान्यीकरण सहायक |
    | `plugin-sdk/retry-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; पुनः प्रयास कॉन्फ़िगरेशन और पुनः प्रयास रनर सहायक |
    | `plugin-sdk/agent-runtime` | एजेंट डायरेक्टरी/पहचान/वर्कस्पेस सहायकों के लिए अप्रचलित व्यापक बैरल, जिसमें `resolveAgentDir`, `resolveDefaultAgentDir`, और अप्रचलित `resolveOpenClawAgentDir` संगतता एक्सपोर्ट शामिल हैं; केंद्रित एजेंट/रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/directory-runtime` | कॉन्फ़िगरेशन-समर्थित डायरेक्टरी क्वेरी/डीडुप्लिकेशन |
    | `plugin-sdk/keyed-async-queue` | जुलाई 2026 के बाद निजी-स्थानीय; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण उपपथ">
    | उपपथ | प्रमुख एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/media-runtime` | अप्रचलित व्यापक मीडिया बैरल, जिसमें `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और अप्रचलित `fetchRemoteMedia` शामिल हैं; `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media`, और क्षमता रनटाइम उपपथों को प्राथमिकता दें, और जब किसी URL को OpenClaw मीडिया बनना हो तो बफ़र रीड से पहले स्टोर सहायकों को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | सीमित MIME सामान्यीकरण, फ़ाइल-एक्सटेंशन मैपिंग, MIME पहचान, और मीडिया-प्रकार सहायक |
    | `plugin-sdk/media-store` | `saveMediaBuffer` और `saveMediaStream` जैसे सीमित मीडिया स्टोर सहायक |
    | `plugin-sdk/media-generation-runtime` | जुलाई 2026 के बाद निजी-स्थानीय; साझा मीडिया-जनरेशन फ़ेलओवर सहायक, उम्मीदवार चयन, और मॉडल अनुपलब्ध होने के संदेश |
    | `plugin-sdk/media-understanding` | मीडिया-अंडरस्टैंडिंग प्रदाता प्रकारों और सहायकों के लिए अप्रचलित संगतता फ़साड; नए प्रदाता इंजेक्ट किए गए Plugin API के माध्यम से पंजीकृत होते हैं और अनुरोध सहायकों का स्वामित्व Plugin के पास रखते हैं |
    | `plugin-sdk/text-chunking` | आउटबाउंड टेक्स्ट और ऑफ़सेट-संरक्षित रेंज चंकिंग, मार्कडाउन चंकिंग/रेंडर सहायक, उद्धरण-जागरूक HTML टैग टोकनाइज़ेशन, मार्कडाउन तालिका रूपांतरण, डायरेक्टिव-टैग हटाना, और सुरक्षित-टेक्स्ट उपयोगिताएँ |
    | `plugin-sdk/speech` | जुलाई 2026 के बाद निजी-स्थानीय; स्पीच प्रदाता प्रकार तथा प्रदाता-सामना करने वाले डायरेक्टिव, रजिस्ट्री, सत्यापन, OpenAI-संगत TTS बिल्डर, और स्पीच सहायक एक्सपोर्ट |
    | `plugin-sdk/speech-core` | जुलाई 2026 के बाद निजी-स्थानीय; साझा स्पीच प्रदाता प्रकार, रजिस्ट्री, डायरेक्टिव, सामान्यीकरण, और स्पीच सहायक एक्सपोर्ट |
    | `plugin-sdk/speech-settings` | प्रदाता रजिस्ट्रियों या सिंथेसिस रनटाइम के बिना हल्के TTS कॉन्फ़िगरेशन समाधान और सामान्यीकरण प्रिमिटिव |
    | `plugin-sdk/realtime-transcription` | जुलाई 2026 के बाद निजी-स्थानीय; रीयलटाइम ट्रांसक्रिप्शन प्रदाता प्रकार, रजिस्ट्री सहायक, और साझा WebSocket सत्र सहायक |
    | `plugin-sdk/realtime-bootstrap-context` | जुलाई 2026 के बाद निजी-स्थानीय; सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` संदर्भ इंजेक्शन के लिए रीयलटाइम प्रोफ़ाइल बूटस्ट्रैप सहायक |
    | `plugin-sdk/realtime-voice` | जुलाई 2026 के बाद निजी-स्थानीय; रीयलटाइम वॉइस प्रदाता प्रकार, रजिस्ट्री सहायक, साझा ऑडियो-ऊर्जा/स्पीच-आरंभ गेट, और रीयलटाइम वॉइस व्यवहार सहायक, जिनमें ट्रांसपोर्ट-स्वतंत्र सत्र हार्नेस और आउटपुट गतिविधि ट्रैकिंग शामिल हैं |
    | `plugin-sdk/meeting-runtime` | ब्राउज़र-मीटिंग सत्र रनटाइम, रीयलटाइम ऑडियो इंजन/ट्रांसपोर्ट, `MeetingPlatformAdapter`, ब्राउज़र/Node नियंत्रण, एजेंट-परामर्श, वॉइस-कॉल प्रत्यायोजन, सेटअप जाँच, और SoX कमांड सहायक |
    | `plugin-sdk/image-generation` | जुलाई 2026 के बाद निजी-स्थानीय; इमेज जनरेशन प्रदाता प्रकार तथा इमेज एसेट/डेटा URL सहायक और OpenAI-संगत इमेज प्रदाता बिल्डर |
    | `plugin-sdk/image-generation-core` | जुलाई 2026 के बाद निजी-स्थानीय; साझा इमेज-जनरेशन प्रकार, फ़ेलओवर, प्रमाणीकरण, और रजिस्ट्री सहायक |
    | `plugin-sdk/music-generation` | जुलाई 2026 के बाद निजी-स्थानीय; म्यूज़िक जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/video-generation` | जुलाई 2026 के बाद निजी-स्थानीय; वीडियो जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/video-generation-core` | जुलाई 2026 के बाद निजी-स्थानीय; साझा वीडियो-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता लुकअप, और मॉडल-रेफ़ पार्सिंग |
    | `plugin-sdk/transcripts` | जुलाई 2026 के बाद निजी-स्थानीय; साझा ट्रांसक्रिप्ट स्रोत प्रदाता प्रकार, रजिस्ट्री सहायक, सत्र विवरणक, और उच्चारण मेटाडेटा |
    | `plugin-sdk/webhook-targets` | जुलाई 2026 के बाद निजी-स्थानीय; Webhook लक्ष्य रजिस्ट्री और रूट-इंस्टॉल सहायक |
    | `plugin-sdk/web-media` | साझा रिमोट/स्थानीय मीडिया लोडिंग सहायक |
    | `plugin-sdk/zod` | अप्रचलित संगतता री-एक्सपोर्ट; `zod` को सीधे `zod` से इंपोर्ट करें |
    | `plugin-sdk/plugin-test-api` | रेपो परीक्षण सहायक ब्रिज इंपोर्ट किए बिना सीधे Plugin पंजीकरण यूनिट परीक्षणों के लिए रेपो-स्थानीय न्यूनतम `createTestPluginApi` सहायक |
    | `plugin-sdk/agent-runtime-test-contracts` | प्रमाणीकरण, डिलीवरी, फ़ॉलबैक, टूल-हुक, प्रॉम्प्ट-ओवरले, स्कीमा, और ट्रांसक्रिप्ट प्रोजेक्शन परीक्षणों के लिए रेपो-स्थानीय नेटिव एजेंट-रनटाइम अडैप्टर कॉन्ट्रैक्ट फ़िक्स्चर |
    | `plugin-sdk/channel-test-helpers` | जेनेरिक क्रियाओं/सेटअप/स्थिति कॉन्ट्रैक्ट, डायरेक्टरी अभिकथन, अकाउंट स्टार्टअप जीवनचक्र, सेंड-कॉन्फ़िग थ्रेडिंग, रनटाइम मॉक, स्थिति समस्याएँ, आउटबाउंड डिलीवरी, और हुक पंजीकरण के लिए रेपो-स्थानीय चैनल-उन्मुख परीक्षण सहायक |
    | `plugin-sdk/channel-target-testing` | चैनल परीक्षणों के लिए रेपो-स्थानीय साझा लक्ष्य-समाधान त्रुटि-केस सूट |
    | `plugin-sdk/channel-contract-testing` | व्यापक परीक्षण बैरल के बिना रेपो-स्थानीय सीमित चैनल कॉन्ट्रैक्ट परीक्षण सहायक |
    | `plugin-sdk/plugin-test-contracts` | रेपो-स्थानीय Plugin पैकेज, पंजीकरण, सार्वजनिक आर्टिफ़ैक्ट, प्रत्यक्ष इंपोर्ट, रनटाइम API, और इंपोर्ट साइड-इफ़ेक्ट कॉन्ट्रैक्ट सहायक |
    | `plugin-sdk/plugin-state-test-runtime` | रेपो-स्थानीय Plugin स्टेट स्टोर, इनग्रेस क्यू, और स्टेट DB परीक्षण सहायक |
    | `plugin-sdk/provider-test-contracts` | रेपो-स्थानीय प्रदाता रनटाइम, प्रमाणीकरण, खोज, ऑनबोर्ड, कैटलॉग, विज़ार्ड, मीडिया क्षमता, रीप्ले नीति, रीयलटाइम STT लाइव-ऑडियो, वेब-सर्च/फ़ेच, और स्ट्रीम कॉन्ट्रैक्ट सहायक |
    | `plugin-sdk/provider-http-test-mocks` | जुलाई 2026 के बाद निजी-स्थानीय; `plugin-sdk/provider-http` का प्रयोग करने वाले प्रदाता परीक्षणों के लिए रेपो-स्थानीय ऑप्ट-इन Vitest HTTP/प्रमाणीकरण मॉक |
    | `plugin-sdk/reply-payload-testing` | उत्तर पेलोड फ़िक्स्चर में मेटाडेटा संलग्न करने के लिए रेपो-स्थानीय सहायक |
    | `plugin-sdk/sqlite-runtime-testing` | प्रथम-पक्ष परीक्षणों के लिए रेपो-स्थानीय SQLite जीवनचक्र सहायक |
    | `plugin-sdk/test-fixtures` | रेपो-स्थानीय जेनेरिक CLI रनटाइम कैप्चर, सैंडबॉक्स संदर्भ, स्किल राइटर, एजेंट-संदेश, सिस्टम-इवेंट, मॉड्यूल रीलोड, बंडल किया गया Plugin पथ, टर्मिनल-टेक्स्ट, चंकिंग, प्रमाणीकरण-टोकन, और टाइप किए गए केस फ़िक्स्चर |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` फ़ैक्टरियों के भीतर उपयोग के लिए रेपो-स्थानीय केंद्रित Node बिल्टइन मॉक सहायक |
  </Accordion>

  <Accordion title="मेमोरी उपपथ">
    | उपपथ | प्रमुख एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | जुलाई 2026 के बाद निजी-स्थानीय; हल्के मेमोरी एम्बेडिंग प्रदाता रजिस्ट्री सहायक |
    | `plugin-sdk/memory-core-host-engine-foundation` | मेमोरी होस्ट फ़ाउंडेशन इंजन एक्सपोर्ट |
    | `plugin-sdk/memory-core-host-engine-embeddings` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट एम्बेडिंग कॉन्ट्रैक्ट, रजिस्ट्री एक्सेस, स्थानीय प्रदाता, और जेनेरिक बैच/रिमोट सहायक। इस सतह पर `registerMemoryEmbeddingProvider` अप्रचलित है; नए प्रदाताओं के लिए जेनेरिक एम्बेडिंग प्रदाता API का उपयोग करें। |
    | `plugin-sdk/memory-core-host-engine-qmd` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट QMD इंजन एक्सपोर्ट |
    | `plugin-sdk/memory-core-host-engine-storage` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट स्टोरेज इंजन एक्सपोर्ट |
    | `plugin-sdk/memory-core-host-secret` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट सीक्रेट सहायक |
    | `plugin-sdk/memory-core-host-status` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट स्थिति सहायक |
    | `plugin-sdk/memory-core-host-runtime-cli` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट CLI रनटाइम सहायक |
    | `plugin-sdk/memory-core-host-runtime-core` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट कोर रनटाइम सहायक |
    | `plugin-sdk/memory-core-host-runtime-files` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट फ़ाइल/रनटाइम सहायक |
    | `plugin-sdk/memory-host-core` | विक्रेता-निरपेक्ष मेमोरी होस्ट सहायकों के लिए अप्रचलित संगतता फ़साड। नए मेमोरी Plugin इंजेक्ट की गई मेमोरी क्षमताओं और होस्ट-तैयार प्रॉम्प्ट का उपयोग करते हैं; एक सीमित रीड सीम उपलब्ध होने तक सहयोगी Plugin सार्वजनिक-आर्टिफ़ैक्ट खोज के लिए बनाए रखे गए फ़साड का उपयोग करते रहते हैं। |
    | `plugin-sdk/memory-host-events` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी होस्ट इवेंट जर्नल सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
    | `plugin-sdk/memory-host-markdown` | जुलाई 2026 के बाद निजी-स्थानीय; मेमोरी-समीपस्थ Plugin के लिए साझा प्रबंधित-मार्कडाउन सहायक |
    | `plugin-sdk/memory-host-search` | जुलाई 2026 के बाद निजी-स्थानीय; सर्च-मैनेजर एक्सेस के लिए Active Memory रनटाइम फ़साड |
  </Accordion>

  <Accordion title="आरक्षित बंडल-सहायक उपपथ">
    आरक्षित बंडल-सहायक SDK उपपथ बंडल किए गए Plugin कोड के लिए सीमित, स्वामी-विशिष्ट सतहें हैं।
    इन्हें SDK इन्वेंट्री में ट्रैक किया जाता है, ताकि पैकेज बिल्ड और एलियासिंग
    नियतात्मक रहें, लेकिन ये सामान्य Plugin ऑथरिंग API नहीं हैं। नए पुन: प्रयोज्य होस्ट कॉन्ट्रैक्ट को
    `plugin-sdk/gateway-runtime` और `plugin-sdk/ssrf-runtime` जैसे जेनेरिक SDK उपपथों का उपयोग करना चाहिए।

    | उपपथ | स्वामी और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | जुलाई 2026 के बाद निजी-स्थानीय; उपयोगकर्ता MCP सर्वर कॉन्फ़िगरेशन को Codex ऐप-सर्वर थ्रेड कॉन्फ़िगरेशन में प्रोजेक्ट करने के लिए बंडल किया गया Codex Plugin सहायक (आरक्षित पैकेज एक्सपोर्ट) |
    | `plugin-sdk/codex-native-task-runtime` | Codex ऐप-सर्वर नेटिव सबएजेंट को OpenClaw टास्क स्टेट में मिरर करने के लिए बंडल किया गया Codex Plugin सहायक (केवल रेपो-स्थानीय, पैकेज एक्सपोर्ट नहीं) |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugin बनाना](/hi/plugins/building-plugins)
