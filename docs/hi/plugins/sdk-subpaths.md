---
read_when:
    - Plugin इम्पोर्ट के लिए सही plugin-sdk सबपाथ चुनना
    - बंडल किए गए Plugin के उपपथों और सहायक सतहों का ऑडिट करना
summary: 'Plugin SDK उपपथ कैटलॉग: कौन-से इम्पोर्ट कहाँ स्थित हैं, क्षेत्र के अनुसार समूहीकृत'
title: Plugin SDK उपपथ
x-i18n:
    generated_at: "2026-07-19T09:08:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3fa26ace32ca7e555508ec3869e67bd6ae2e5b3b2bfd0edb050e6d1ebfb61824
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK को `openclaw/plugin-sdk/` के अंतर्गत सीमित सार्वजनिक उप-पथों के एक समूह के रूप में उपलब्ध कराया गया है। यह पृष्ठ सामान्यतः उपयोग किए जाने वाले उप-पथों को उद्देश्य के अनुसार समूहित करके सूचीबद्ध करता है। तीन फ़ाइलें इस सतह को परिभाषित करती हैं:

- `scripts/lib/plugin-sdk-entrypoints.json`: अनुरक्षित एंट्रीपॉइंट सूची,
  जिसे बिल्ड संकलित करता है।
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: रिपॉज़िटरी-स्थानीय
  परीक्षण/आंतरिक उप-पथ। पैकेज एक्सपोर्ट इस सूची को घटाकर बनी सूची है।
- `src/plugin-sdk/entrypoints.ts`: अप्रचलित
  उप-पथों, आरक्षित बंडल किए गए सहायकों, समर्थित बंडल किए गए फ़साड और
  Plugin-स्वामित्व वाली सार्वजनिक सतहों के लिए वर्गीकरण मेटाडेटा।

अनुरक्षक `pnpm plugin-sdk:surface` से सार्वजनिक एक्सपोर्ट की संख्या और
`pnpm plugins:boundary-report:summary` से सक्रिय आरक्षित सहायक उप-पथों का ऑडिट करते हैं;
अप्रयुक्त आरक्षित सहायक एक्सपोर्ट निष्क्रिय संगतता ऋण के रूप में
सार्वजनिक SDK में बने रहने के बजाय CI रिपोर्ट को विफल कर देते हैं।

Plugin लेखन मार्गदर्शिका के लिए, [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) देखें।

## Plugin प्रविष्टि

| उप-पथ                        | प्रमुख एक्सपोर्ट                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | माइग्रेशन प्रदाता आइटम सहायक, जैसे `createMigrationItem`, कारण नियतांक, आइटम स्थिति चिह्नक, संपादन सहायक और `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | रनटाइम माइग्रेशन सहायक, जैसे `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` और `writeMigrationReport`                                             |
| `plugin-sdk/health`            | बंडल किए गए स्वास्थ्य उपभोक्ताओं के लिए Doctor स्वास्थ्य-जाँच पंजीकरण, पहचान, सुधार, चयन, गंभीरता और निष्कर्ष प्रकार                                                                                |
| `plugin-sdk/config-schema`     | अप्रचलित। रूट `openclaw.json` Zod स्कीमा (`OpenClawSchema`); इसके बजाय Plugin-स्थानीय स्कीमा परिभाषित करें और `plugin-sdk/json-schema-runtime` से सत्यापित करें                                                  |

### अप्रचलित संगतता और परीक्षण सहायक

पुराने Plugins के लिए अप्रचलित उप-पथ एक्सपोर्ट किए जाते हैं, लेकिन नए कोड को
नीचे दिए गए केंद्रित SDK उप-पथों का उपयोग करना चाहिए। अनुरक्षित सूची
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` है; CI इससे किए गए बंडल किए गए
प्रोडक्शन इंपोर्ट को अस्वीकार करता है। `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` और
`plugin-sdk/text-runtime` जैसे व्यापक बैरल केवल संगतता के लिए हैं, और `plugin-sdk/zod`
एक संगतता री-एक्सपोर्ट है: `zod` को सीधे `zod` से इंपोर्ट करें। व्यापक डोमेन
बैरल `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` और
`plugin-sdk/security-runtime` भी केंद्रित
उप-पथों के पक्ष में अप्रचलित हैं।

OpenClaw के Vitest-समर्थित परीक्षण-सहायक उप-पथ केवल रिपॉज़िटरी-स्थानीय हैं और अब
पैकेज एक्सपोर्ट नहीं हैं: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` और `testing`। निजी बंडल की गई सहायक सतहें
`ssrf-runtime-internal` और `codex-native-task-runtime` भी केवल रिपॉज़िटरी-स्थानीय
हैं।

### आरक्षित बंडल किए गए Plugin सहायक उप-पथ

`plugin-sdk/codex-mcp-projection` एकमात्र आरक्षित उप-पथ है: बंडल किए गए Codex Plugin के लिए
Plugin-स्वामित्व वाली संगतता सतह, न कि सामान्य SDK API।
पैकेज अनुबंध सुरक्षा-सीमाएँ अलग-अलग स्वामियों के Plugins के बीच इंपोर्ट को अवरुद्ध करती हैं, और
जब किसी आरक्षित उप-पथ का इंपोर्ट बंद हो जाता है, तो CI विफल हो जाता है।
`plugin-sdk/codex-native-task-runtime` केवल रिपॉज़िटरी-स्थानीय है और पैकेज
एक्सपोर्ट नहीं है।

`src/plugin-sdk/entrypoints.ts` समर्थित बंडल किए गए फ़साड को भी ट्रैक करता है—ऐसे SDK
एंट्रीपॉइंट, जिन्हें सामान्य अनुबंधों द्वारा प्रतिस्थापित किए जाने तक उनके बंडल किए गए Plugin का समर्थन मिलता है:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` और `plugin-sdk/zalouser`। इनमें से कई नए कोड के लिए भी
अप्रचलित हैं; नीचे प्रत्येक पंक्ति की टिप्पणियाँ देखें।

  <AccordionGroup>
  <Accordion title="चैनल उपपथ">
    | उपपथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Plugin-स्वामित्व वाली स्कीमाओं के लिए कैश किया गया JSON Schema सत्यापन सहायक |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ ही `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक, सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट और सेटअप स्थिति बिल्डर |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | अप्रचलित संगतता उपनाम; `plugin-sdk/setup-runtime` का उपयोग करें |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | बहु-खाता कॉन्फ़िगरेशन/कार्रवाई-गेट सहायक, डिफ़ॉल्ट-खाता फ़ॉलबैक सहायक |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, खाता-आईडी सामान्यीकरण सहायक |
    | `plugin-sdk/account-resolution` | खाता खोज + डिफ़ॉल्ट-फ़ॉलबैक सहायक |
    | `plugin-sdk/account-helpers` | सीमित खाता-सूची/खाता-कार्रवाई सहायक |
    | `plugin-sdk/access-groups` | पहुँच-समूह अनुमति-सूची पार्सिंग और संपादित समूह निदान सहायक |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | साझा चैनल कॉन्फ़िगरेशन स्कीमा प्रिमिटिव, साथ ही Zod और प्रत्यक्ष JSON/TypeBox बिल्डर |
    | `plugin-sdk/bundled-channel-config-schema` | केवल अनुरक्षित बंडल किए गए plugins के लिए बंडल की गई OpenClaw चैनल कॉन्फ़िगरेशन स्कीमाएँ |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`। उन plugins के लिए कैननिकल बंडल किए गए/आधिकारिक चैट चैनल आईडी और फ़ॉर्मैटर लेबल/उपनाम, जिन्हें अपनी तालिका हार्डकोड किए बिना एन्वलप-उपसर्ग वाले टेक्स्ट को पहचानना होता है। |
    | `plugin-sdk/channel-config-schema-legacy` | बंडल-चैनल कॉन्फ़िगरेशन स्कीमाओं के लिए अप्रचलित संगतता उपनाम |
    | `plugin-sdk/telegram-command-config` | अप्रचलित Telegram कमांड-नाम/विवरण सामान्यीकरण और डुप्लिकेट/टकराव जाँच; नए Plugin कोड में Plugin-स्थानीय कमांड कॉन्फ़िगरेशन प्रबंधन का उपयोग करें |
    | `plugin-sdk/command-gating` | सीमित कमांड प्राधिकरण गेट सहायक |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | माइग्रेट किए गए चैनल प्राप्ति पथों के लिए प्रयोगात्मक उच्च-स्तरीय चैनल इनग्रेस रनटाइम रिज़ॉल्वर, अंतर्निहित-उल्लेख नीति रिज़ॉल्वर और रूट तथ्य बिल्डर। प्रत्येक Plugin में प्रभावी अनुमति-सूचियाँ, कमांड अनुमति-सूचियाँ और लीगेसी प्रोजेक्शन संयोजित करने के बजाय इसे प्राथमिकता दें। [चैनल इनग्रेस API](/hi/plugins/sdk-channel-ingress) देखें। |
    | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-outbound` | संदेश जीवनचक्र अनुबंध, साथ ही उत्तर पाइपलाइन विकल्प, प्राप्ति-पुष्टियाँ, लाइव पूर्वावलोकन/स्ट्रीमिंग, जीवनचक्र सहायक, आउटबाउंड पहचान, पेलोड योजना, टिकाऊ प्रेषण और संदेश-प्रेषण संदर्भ सहायक। [चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) देखें। |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम। |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` के लिए अप्रचलित संगतता उपनाम। |
    | `plugin-sdk/inbound-envelope` | साझा इनबाउंड रूट + एन्वलप बिल्डर सहायक |
    | `plugin-sdk/inbound-reply-dispatch` | अप्रचलित संगतता फ़साड। इनबाउंड रनर और डिस्पैच प्रेडिकेट के लिए `plugin-sdk/channel-inbound`, तथा संदेश वितरण सहायकों के लिए `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/messaging-targets` | अप्रचलित लक्ष्य पार्सिंग उपनाम; `plugin-sdk/channel-targets` का उपयोग करें |
    | `plugin-sdk/outbound-media` | साझा आउटबाउंड मीडिया लोडिंग और होस्टेड-मीडिया स्थिति सहायक |
    | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/poll-runtime` | सीमित पोल सामान्यीकरण सहायक |
    | `plugin-sdk/thread-bindings-runtime` | थ्रेड-बाइंडिंग जीवनचक्र और अडैप्टर सहायक |
    | `plugin-sdk/agent-media-payload` | एजेंट मीडिया पेलोड रूट और लोडर |
    | `plugin-sdk/conversation-runtime` | वार्तालाप/थ्रेड बाइंडिंग, पेयरिंग और कॉन्फ़िगर किए गए बाइंडिंग सहायकों के लिए अप्रचलित व्यापक बैरल; `plugin-sdk/thread-bindings-runtime` और `plugin-sdk/session-binding-runtime` जैसे केंद्रित बाइंडिंग उपपथों को प्राथमिकता दें |
    | `plugin-sdk/runtime-group-policy` | रनटाइम समूह-नीति समाधान सहायक |
    | `plugin-sdk/channel-status` | साझा चैनल स्थिति स्नैपशॉट/सारांश सहायक |
    | `plugin-sdk/channel-config-primitives` | सीमित चैनल कॉन्फ़िगरेशन-स्कीमा प्रिमिटिव |
    | `plugin-sdk/channel-config-writes` | चैनल कॉन्फ़िगरेशन-लेखन प्राधिकरण सहायक |
    | `plugin-sdk/channel-plugin-common` | साझा चैनल Plugin प्रील्यूड निर्यात |
    | `plugin-sdk/allowlist-config-edit` | अनुमति-सूची कॉन्फ़िगरेशन संपादन/पठन सहायक |
    | `plugin-sdk/group-access` | अप्रचलित समूह-पहुँच निर्णय सहायक; `plugin-sdk/channel-ingress-runtime` से `resolveChannelMessageIngress` का उपयोग करें |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-inbound` का उपयोग करें। |
    | `plugin-sdk/direct-dm-guard-policy` | सीमित प्रत्यक्ष-DM प्री-क्रिप्टो गार्ड नीति सहायक |
    | `plugin-sdk/discord` | प्रकाशित `@openclaw/discord@2026.3.13` और ट्रैक की गई स्वामी संगतता के लिए अप्रचलित Discord संगतता फ़साड; नए plugins को सामान्य चैनल SDK उपपथों का उपयोग करना चाहिए |
    | `plugin-sdk/telegram-account` | ट्रैक की गई स्वामी संगतता के लिए अप्रचलित Telegram खाता-समाधान संगतता फ़साड; नए plugins को इंजेक्ट किए गए रनटाइम सहायकों या सामान्य चैनल SDK उपपथों का उपयोग करना चाहिए |
    | `plugin-sdk/zalouser` | अब भी प्रेषक कमांड प्राधिकरण आयात करने वाले प्रकाशित Lark/Zalo पैकेजों के लिए अप्रचलित Zalo Personal संगतता फ़साड; नए plugins को सामान्य चैनल SDK उपपथों का उपयोग करना चाहिए |
    | `plugin-sdk/interactive-runtime` | अर्थगत संदेश प्रस्तुति, वितरण और लीगेसी इंटरैक्टिव उत्तर सहायक। [संदेश प्रस्तुति](/hi/plugins/message-presentation) देखें |
    | `plugin-sdk/question-gateway-runtime` | चैनल इंटरैक्शन हैंडलर से Gateway के माध्यम से रनटाइम द्वारा रचित `ask_user` विकल्पों का समाधान करें |
    | `plugin-sdk/channel-inbound` | इवेंट वर्गीकरण, संदर्भ निर्माण, फ़ॉर्मैटिंग, रूट, डिबाउंस, उल्लेख मिलान, उल्लेख-नीति और इनबाउंड लॉगिंग के लिए साझा इनबाउंड सहायक |
    | `plugin-sdk/channel-inbound-debounce` | सीमित इनबाउंड डिबाउंस सहायक |
    | `plugin-sdk/channel-mention-gating` | व्यापक इनबाउंड रनटाइम सतह के बिना सीमित उल्लेख-नीति, उल्लेख मार्कर और उल्लेख टेक्स्ट सहायक |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-inbound` या `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-pairing-paths` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-pairing` का उपयोग करें। |
    | `plugin-sdk/channel-reply-options-runtime` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फ़साड। `plugin-sdk/channel-outbound` का उपयोग करें। |
    | `plugin-sdk/channel-send-result` | उत्तर परिणाम प्रकार |
    | `plugin-sdk/channel-actions` | चैनल संदेश-कार्रवाई सहायक, साथ ही Plugin संगतता के लिए रखे गए अप्रचलित नेटिव स्कीमा सहायक |
    | `plugin-sdk/channel-route` | साझा रूट सामान्यीकरण, पार्सर-संचालित लक्ष्य समाधान, थ्रेड-आईडी स्ट्रिंगीकरण, डिडुप्लिकेट/संक्षिप्त रूट कुंजियाँ, पार्स किए गए लक्ष्य प्रकार और रूट/लक्ष्य तुलना सहायक |
    | `plugin-sdk/channel-targets` | लक्ष्य पार्सिंग सहायक; रूट तुलना कॉलर को `plugin-sdk/channel-route` का उपयोग करना चाहिए |
    | `plugin-sdk/channel-contract` | चैनल अनुबंध प्रकार |
    | `plugin-sdk/channel-feedback` | फ़ीडबैक/प्रतिक्रिया वायरिंग |
  </Accordion>

बहिष्कृत चैनल हेल्पर फ़ैमिली केवल प्रकाशित Plugin के साथ
संगतता के लिए उपलब्ध रहती हैं। हटाने की योजना यह है: उन्हें बाहरी Plugin
माइग्रेशन अवधि तक बनाए रखें, रेपो/बंडल किए गए Plugin को `channel-inbound` और
`channel-outbound` पर बनाए रखें, फिर अगले प्रमुख SDK क्लीनअप में संगतता
सबपाथ हटा दें। यह पुराने चैनल संदेश/रनटाइम, चैनल
स्ट्रीमिंग, सीधे-DM एक्सेस, इनबाउंड हेल्पर स्प्लिंटर, रिप्लाई-विकल्प,
और पेयरिंग-पाथ फ़ैमिली पर लागू होता है।

  <Accordion title="प्रदाता उपपथ">
    | उपपथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | सेटअप, कैटलॉग खोज और रनटाइम मॉडल तैयारी के लिए समर्थित LM Studio प्रदाता फ़साड |
    | `plugin-sdk/lmstudio-runtime` | स्थानीय सर्वर डिफ़ॉल्ट, मॉडल खोज, अनुरोध हेडर और लोड किए गए मॉडल के सहायकों के लिए समर्थित LM Studio रनटाइम फ़साड |
    | `plugin-sdk/provider-setup` | चयनित स्थानीय/स्व-होस्टेड प्रदाता सेटअप सहायक |
    | `plugin-sdk/self-hosted-provider-setup` | अप्रचलित OpenAI-संगत स्व-होस्टेड सेटअप सहायक; `plugin-sdk/provider-setup` या Plugin-स्वामित्व वाले सेटअप सहायकों का उपयोग करें |
    | `plugin-sdk/cli-backend` | CLI बैकएंड डिफ़ॉल्ट + वॉचडॉग नियतांक |
    | `plugin-sdk/provider-auth-runtime` | प्रदाता प्रमाणीकरण रनटाइम सहायक: OAuth लूपबैक प्रवाह, टोकन विनिमय, प्रमाणीकरण स्थायित्व और API-कुंजी समाधान |
    | `plugin-sdk/provider-oauth-runtime` | सामान्य प्रदाता OAuth कॉलबैक प्रकार, कॉलबैक-पृष्ठ रेंडरिंग, PKCE/स्थिति सहायक, प्राधिकरण-इनपुट पार्सिंग, टोकन-समाप्ति सहायक और निरस्तीकरण सहायक |
    | `plugin-sdk/provider-auth-api-key` | API-कुंजी ऑनबोर्डिंग/प्रोफ़ाइल-लेखन सहायक, जैसे `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | मानक OAuth प्रमाणीकरण-परिणाम बिल्डर |
    | `plugin-sdk/provider-env-vars` | प्रदाता प्रमाणीकरण परिवेश-चर लुकअप सहायक |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex प्रमाणीकरण-आयात सहायक, अप्रचलित `resolveOpenClawAgentDir` संगतता निर्यात |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, साझा रीप्ले-नीति बिल्डर, प्रदाता-एंडपॉइंट सहायक और साझा मॉडल-ID सामान्यीकरण सहायक |
    | `plugin-sdk/provider-catalog-live-runtime` | सुरक्षित `/models`-शैली खोज के लिए लाइव प्रदाता मॉडल कैटलॉग सहायक: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, मॉडल-ID फ़िल्टरिंग, TTL कैश और स्थिर फ़ॉलबैक |
    | `plugin-sdk/provider-catalog-runtime` | अनुबंध परीक्षणों के लिए प्रदाता कैटलॉग संवर्धन रनटाइम हुक और Plugin-प्रदाता रजिस्ट्री सीमाएँ |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | सामान्य प्रदाता HTTP/एंडपॉइंट क्षमता सहायक, प्रदाता HTTP त्रुटियाँ और ऑडियो ट्रांसक्रिप्शन मल्टीपार्ट फ़ॉर्म सहायक |
    | `plugin-sdk/provider-web-fetch-contract` | सीमित वेब-फ़ेच कॉन्फ़िगरेशन/चयन अनुबंध सहायक, जैसे `enablePluginInConfig` और `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | वेब-फ़ेच प्रदाता पंजीकरण/कैश सहायक |
    | `plugin-sdk/provider-web-search-config-contract` | उन प्रदाताओं के लिए सीमित वेब-खोज कॉन्फ़िगरेशन/क्रेडेंशियल सहायक जिन्हें Plugin-सक्षमकरण वायरिंग की आवश्यकता नहीं है |
    | `plugin-sdk/provider-web-search-contract` | सीमित वेब-खोज कॉन्फ़िगरेशन/क्रेडेंशियल अनुबंध सहायक, जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` और सीमित-दायरे वाले क्रेडेंशियल सेटर/गेटर |
    | `plugin-sdk/provider-web-search` | वेब-खोज प्रदाता पंजीकरण/कैश/रनटाइम सहायक |
    | `plugin-sdk/embedding-providers` | सामान्य एम्बेडिंग प्रदाता प्रकार और पठन सहायक, जिनमें `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` और `listEmbeddingProviders(...)` शामिल हैं; Plugin प्रदाताओं को `api.registerEmbeddingProvider(...)` के माध्यम से पंजीकृत करते हैं, ताकि मैनिफ़ेस्ट स्वामित्व लागू हो |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` और DeepSeek/Gemini/OpenAI स्कीमा सफ़ाई + निदान |
    | `plugin-sdk/provider-usage` | प्रदाता उपयोग स्नैपशॉट प्रकार, साझा उपयोग फ़ेच सहायक और `fetchClaudeUsage` जैसे प्रदाता फ़ेचर |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, स्ट्रीम रैपर प्रकार, सादा-पाठ टूल-कॉल संगतता और साझा Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI रैपर सहायक |
    | `plugin-sdk/provider-stream-shared` | सार्वजनिक साझा प्रदाता स्ट्रीम रैपर सहायक, जिनमें `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` और Anthropic/DeepSeek/OpenAI-संगत स्ट्रीम उपयोगिताएँ शामिल हैं |
    | `plugin-sdk/provider-transport-runtime` | मूल प्रदाता परिवहन सहायक, जैसे सुरक्षित फ़ेच, टूल-परिणाम पाठ निष्कर्षण, परिवहन संदेश रूपांतरण और लेखनयोग्य परिवहन इवेंट स्ट्रीम |
    | `plugin-sdk/provider-onboard` | ऑनबोर्डिंग कॉन्फ़िगरेशन पैच सहायक |
    | `plugin-sdk/global-singleton` | प्रक्रिया-स्थानीय सिंगलटन/मैप/कैश सहायक |
    | `plugin-sdk/group-activation` | सीमित समूह सक्रियण मोड और कमांड पार्सिंग सहायक |
  </Accordion>

प्रदाता उपयोग स्नैपशॉट सामान्यतः एक या अधिक कोटा `windows` की रिपोर्ट करते हैं, जिनमें से प्रत्येक में
एक लेबल, उपयोग किया गया प्रतिशत और वैकल्पिक रीसेट समय होता है। जो प्रदाता रीसेट किए जा सकने वाले कोटा
अंतरालों के बजाय शेष राशि या खाता-स्थिति पाठ उजागर करते हैं, उन्हें काल्पनिक प्रतिशत बनाने के बजाय
रिक्त `windows` सरणी के साथ `summary` लौटाना चाहिए।
OpenClaw स्थिति आउटपुट में वह सारांश पाठ प्रदर्शित करता है; `error` का उपयोग केवल तभी करें जब
उपयोग एंडपॉइंट विफल हुआ हो या उसने कोई उपयोगी उपयोग डेटा न लौटाया हो।

  <Accordion title="प्रमाणीकरण और सुरक्षा उपपथ">
    | उपपथ | प्रमुख निर्यात |
    | --- | --- |
    | `plugin-sdk/command-auth` | अप्रचलित व्यापक कमांड प्राधिकरण सतह (`resolveControlCommandGate`, डायनेमिक तर्क मेनू फ़ॉर्मैटिंग सहित कमांड रजिस्ट्री सहायक, प्रेषक-प्राधिकरण सहायक); चैनल इनग्रेस/रनटाइम प्राधिकरण या कमांड-स्थिति सहायकों का उपयोग करें |
    | `plugin-sdk/command-status` | कमांड/सहायता संदेश बिल्डर, जैसे `buildCommandsMessagePaginated` और `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | अनुमोदक समाधान और समान-चैट क्रिया-प्रमाणीकरण सहायक |
    | `plugin-sdk/approval-client-runtime` | मूल निष्पादन अनुमोदन प्रोफ़ाइल/फ़िल्टर सहायक |
    | `plugin-sdk/approval-delivery-runtime` | मूल अनुमोदन क्षमता/वितरण अडैप्टर |
    | `plugin-sdk/approval-gateway-runtime` | साझा अनुमोदन Gateway समाधानकर्ता |
    | `plugin-sdk/approval-reference-runtime` | परिवहन-सीमित अनुमोदन कॉलबैक के लिए निर्धारक टिकाऊ-लोकेटर सहायक |
    | `plugin-sdk/approval-handler-adapter-runtime` | हॉट चैनल प्रवेश-बिंदुओं के लिए हल्के मूल अनुमोदन अडैप्टर लोडिंग सहायक |
    | `plugin-sdk/approval-handler-runtime` | अधिक व्यापक अनुमोदन हैंडलर रनटाइम सहायक; पर्याप्त होने पर अधिक सीमित अडैप्टर/Gateway सीमाओं को प्राथमिकता दें |
    | `plugin-sdk/approval-native-runtime` | मूल अनुमोदन लक्ष्य, खाता-बाइंडिंग, रूट-गेट, अग्रेषण फ़ॉलबैक और स्थानीय मूल निष्पादन प्रॉम्प्ट दमन सहायक |
    | `plugin-sdk/approval-reaction-runtime` | हार्डकोड किए गए अनुमोदन प्रतिक्रिया बाइंडिंग, प्रतिक्रिया प्रॉम्प्ट पेलोड, प्रतिक्रिया लक्ष्य स्टोर, प्रतिक्रिया संकेत पाठ सहायक और स्थानीय मूल निष्पादन प्रॉम्प्ट दमन के लिए संगतता निर्यात |
    | `plugin-sdk/approval-reply-runtime` | निष्पादन/Plugin अनुमोदन उत्तर पेलोड सहायक |
    | `plugin-sdk/approval-runtime` | निष्पादन/Plugin अनुमोदन पेलोड सहायक, अनुमोदन-क्षमता बिल्डर, अनुमोदन प्रमाणीकरण/प्रोफ़ाइल सहायक, मूल अनुमोदन रूटिंग/रनटाइम सहायक और `formatApprovalDisplayPath` जैसे संरचित अनुमोदन प्रदर्शन सहायक |
    | `plugin-sdk/reply-dedupe` | अप्रचलित सीमित इनबाउंड उत्तर डीडुप रीसेट सहायक |
    | `plugin-sdk/command-auth-native` | मूल कमांड प्रमाणीकरण, डायनेमिक तर्क मेनू फ़ॉर्मैटिंग और मूल सत्र-लक्ष्य सहायक |
    | `plugin-sdk/command-detection` | साझा कमांड पहचान सहायक |
    | `plugin-sdk/command-primitives-runtime` | हॉट चैनल पथों के लिए हल्के कमांड पाठ प्रेडिकेट |
    | `plugin-sdk/command-surface` | कमांड-बॉडी सामान्यीकरण और कमांड-सतह सहायक |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | निजी चैनल और Web UI डिवाइस-कोड युग्मन के लिए आलसी प्रदाता प्रमाणीकरण लॉगिन प्रवाह सहायक |
    | `plugin-sdk/channel-secret-runtime` | अप्रचलित व्यापक सीक्रेट-अनुबंध सतह (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, सीक्रेट लक्ष्य प्रकार); नीचे दिए गए केंद्रित उपपथों को प्राथमिकता दें |
    | `plugin-sdk/channel-secret-basic-runtime` | गैर-TTS चैनल/Plugin सीक्रेट सतहों के लिए सीमित सीक्रेट-अनुबंध निर्यात और लक्ष्य-रजिस्ट्री बिल्डर |
    | `plugin-sdk/channel-secret-tts-runtime` | सीमित नेस्टेड चैनल TTS सीक्रेट असाइनमेंट सहायक |
    | `plugin-sdk/secret-ref-runtime` | सीक्रेट-अनुबंध/कॉन्फ़िगरेशन पार्सिंग के लिए सीमित SecretRef टाइपिंग, समाधान और योजना-लक्ष्य पथ लुकअप |
    | `plugin-sdk/secret-provider-integration` | बाहरी सीक्रेट प्रदाता प्रीसेट प्रकाशित करने वाले Plugin के लिए केवल-प्रकार SecretRef प्रदाता एकीकरण मैनिफ़ेस्ट और प्रीसेट अनुबंध |
    | `plugin-sdk/security-runtime` | भरोसा, DM गेटिंग, रूट-सीमित फ़ाइल/पथ सहायकों के लिए अप्रचलित व्यापक बैरल, जिसमें केवल-निर्माण लेखन, सिंक/असिंक परमाणु फ़ाइल प्रतिस्थापन, सिबलिंग अस्थायी लेखन, क्रॉस-डिवाइस मूव फ़ॉलबैक, निजी फ़ाइल-स्टोर सहायक, सिमलिंक-पैरेंट गार्ड, बाहरी-सामग्री, संवेदनशील पाठ संशोधन, नियत-समय सीक्रेट तुलना और सीक्रेट-संग्रह सहायक शामिल हैं; केंद्रित सुरक्षा/SSRF/सीक्रेट उपपथों को प्राथमिकता दें |
    | `plugin-sdk/ssrf-policy` | होस्ट अनुमत-सूची और निजी-नेटवर्क SSRF नीति सहायक |
    | `plugin-sdk/ssrf-dispatcher` | व्यापक अवसंरचना रनटाइम सतह के बिना सीमित पिन किए गए डिस्पैचर सहायक |
    | `plugin-sdk/ssrf-runtime` | पिन किए गए डिस्पैचर, SSRF-सुरक्षित फ़ेच, SSRF त्रुटि और SSRF नीति सहायक |
    | `plugin-sdk/secret-input` | सीक्रेट इनपुट पार्सिंग सहायक |
    | `plugin-sdk/webhook-ingress` | Webhook अनुरोध/लक्ष्य सहायक और कच्चे वेबसॉकेट/बॉडी का प्रकारांतरण |
    | `plugin-sdk/webhook-request-guards` | अनुरोध बॉडी आकार/टाइमआउट सहायक और ट्रैक किए गए पोस्ट-ऐक प्रसंस्करण के लिए `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="रनटाइम और स्टोरेज उपपथ">
    | उपपथ | मुख्य एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/runtime` | रनटाइम/लॉगिंग/बैकअप सहायक, Plugin इंस्टॉल-पथ चेतावनियाँ और प्रक्रिया सहायक |
    | `plugin-sdk/runtime-env` | सीमित रनटाइम परिवेश, लॉगर, टाइमआउट, पुनः प्रयास और बैकऑफ़ सहायक |
    | `plugin-sdk/browser-config` | सामान्यीकृत प्रोफ़ाइल/डिफ़ॉल्ट, CDP URL पार्सिंग और ब्राउज़र-नियंत्रण प्रमाणीकरण सहायकों के लिए समर्थित ब्राउज़र कॉन्फ़िग फ़साड |
    | `plugin-sdk/agent-harness-task-runtime` | होस्ट द्वारा जारी कार्य स्कोप का उपयोग करने वाले हार्नेस-समर्थित एजेंटों के लिए सामान्य कार्य जीवनचक्र और पूर्णता डिलीवरी सहायक |
    | `plugin-sdk/codex-mcp-projection` | उपयोगकर्ता MCP सर्वर कॉन्फ़िग को Codex थ्रेड कॉन्फ़िग में प्रोजेक्ट करने के लिए आरक्षित बंडल किया गया Codex सहायक; तृतीय-पक्ष Plugins के लिए नहीं |
    | `plugin-sdk/codex-native-task-runtime` | मूल कार्य मिरर/रनटाइम वायरिंग के लिए रिपॉज़िटरी-स्थानीय बंडल किया गया Codex सहायक; पैकेज एक्सपोर्ट नहीं |
    | `plugin-sdk/channel-runtime-context` | सामान्य चैनल रनटाइम-संदर्भ पंजीकरण और लुकअप सहायक |
    | `plugin-sdk/matrix` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Matrix संगतता फ़साड; नए Plugins को सीधे `plugin-sdk/run-command` इम्पोर्ट करना चाहिए |
    | `plugin-sdk/mattermost` | पुराने तृतीय-पक्ष चैनल पैकेजों के लिए अप्रचलित Mattermost संगतता फ़साड; नए Plugins को सामान्य SDK उपपथ सीधे इम्पोर्ट करने चाहिए |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin कमांड/हुक/http/इंटरैक्टिव सहायकों के लिए अप्रचलित विस्तृत बैरल; केंद्रित Plugin रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/hook-runtime` | webhook/आंतरिक हुक पाइपलाइन सहायकों के लिए अप्रचलित विस्तृत बैरल; केंद्रित हुक/Plugin रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod` और `createLazyRuntimeSurface` जैसे विलंबित रनटाइम इम्पोर्ट/बाइंडिंग सहायक |
    | `plugin-sdk/process-runtime` | प्रक्रिया निष्पादन सहायक |
    | `plugin-sdk/node-host` | Node-होस्ट निष्पादन-योग्य फ़ाइल समाधान और PTY पुनरारंभ सहायक |
    | `plugin-sdk/cli-runtime` | CLI फ़ॉर्मेटिंग, प्रतीक्षा, संस्करण, आर्ग्युमेंट-आह्वान और विलंबित कमांड-समूह सहायकों के लिए अप्रचलित विस्तृत बैरल; केंद्रित CLI/रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/qa-runner-runtime` | CLI कमांड सतह के माध्यम से Plugin QA परिदृश्य उपलब्ध कराने वाला समर्थित फ़साड |
    | `plugin-sdk/tts-runtime` | टेक्स्ट-टू-स्पीच कॉन्फ़िग स्कीमा और रनटाइम सहायकों के लिए समर्थित फ़साड |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करने वाले Plugin HTTP रूटों के लिए आरक्षित Gateway विधि डिस्पैच सहायक |
    | `plugin-sdk/gateway-runtime` | Gateway क्लाइंट, इवेंट-लूप-तैयार क्लाइंट प्रारंभ सहायक, Gateway CLI RPC, Gateway प्रोटोकॉल त्रुटियाँ, विज्ञापित LAN होस्ट समाधान और चैनल-स्थिति पैच सहायक |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` और चैनल/प्रदाता कॉन्फ़िग प्रकारों जैसी Plugin कॉन्फ़िग आकृतियों के लिए केंद्रित केवल-प्रकार कॉन्फ़िग सतह |
    | `plugin-sdk/plugin-config-runtime` | `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` और `resolveLivePluginConfigObject` जैसे रनटाइम Plugin-कॉन्फ़िग सहायक |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile` और `logConfigUpdated` जैसे लेन-देनात्मक कॉन्फ़िग परिवर्तन सहायक |
    | `plugin-sdk/message-tool-delivery-hints` | साझा संदेश-टूल डिलीवरी मेटाडेटा संकेत स्ट्रिंग |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` और परीक्षण स्नैपशॉट सेटर्स जैसे वर्तमान प्रक्रिया कॉन्फ़िग स्नैपशॉट सहायक |
    | `plugin-sdk/text-autolink-runtime` | विस्तृत टेक्स्ट बैरल के बिना फ़ाइल-संदर्भ ऑटोलिंक पहचान |
    | `plugin-sdk/reply-runtime` | साझा इनबाउंड/उत्तर रनटाइम सहायक, खंडन, डिस्पैच, Heartbeat, उत्तर योजनाकार |
    | `plugin-sdk/reply-dispatch-runtime` | सीमित उत्तर डिस्पैच/अंतिमीकरण और वार्तालाप-लेबल सहायक |
    | `plugin-sdk/reply-history` | साझा अल्प-अवधि उत्तर-इतिहास सहायक। नए संदेश-टर्न कोड को `createChannelHistoryWindow` का उपयोग करना चाहिए; निम्न-स्तरीय मैप सहायक केवल अप्रचलित संगतता एक्सपोर्ट बने हुए हैं |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | सीमित टेक्स्ट/मार्कडाउन खंडन सहायक |
    | `plugin-sdk/session-store-runtime` | सत्र कार्यप्रवाह सहायक (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), मरम्मत/जीवनचक्र सहायक (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), संक्रमणकालीन `sessionFile` मानों के लिए मार्कर सहायक, सत्र पहचान के अनुसार सीमाबद्ध हालिया उपयोगकर्ता/सहायक ट्रांसक्रिप्ट टेक्स्ट पठन, सत्र स्टोर पथ/सत्र-कुंजी सहायक और अद्यतन-समय पठन, विस्तृत कॉन्फ़िग लेखन/रखरखाव इम्पोर्ट के बिना |
    | `plugin-sdk/session-transcript-runtime` | ट्रांसक्रिप्ट पहचान, सीमाबद्ध अपरिष्कृत और दृश्यमान कर्सर, स्कोप किए गए लक्ष्य/पठन/लेखन सहायक, दृश्यमान संदेश-प्रविष्टि प्रोजेक्शन, अपडेट प्रकाशन, लेखन लॉक और ट्रांसक्रिप्ट मेमोरी हिट कुंजियाँ |
    | `plugin-sdk/sqlite-runtime` | डेटाबेस जीवनचक्र नियंत्रणों के बिना प्रथम-पक्ष रनटाइम के लिए केंद्रित SQLite एजेंट-स्कीमा, पथ और लेन-देन सहायक |
    | `plugin-sdk/cron-store-runtime` | Cron स्टोर पथ/लोड/सहेजने के सहायक |
    | `plugin-sdk/state-paths` | स्थिति/OAuth डायरेक्टरी पथ सहायक |
    | `plugin-sdk/plugin-state-runtime` | Plugin-स्कोप वाली कुंजीबद्ध स्थिति, BLOB और सहकारी SQLite लीज़ अनुबंधों के साथ कनेक्शन प्रैग्मा, सत्यापित WAL रखरखाव और परमाणु STRICT-स्कीमा माइग्रेशन सहायक। लीज़ कॉलबैक को एक निरस्तीकरण संकेत मिलता है और टाइप की गई त्रुटियाँ टाइमआउट, निरस्तीकरण, स्वामित्व खोने, अमान्य इनपुट और स्टोरेज विफलता में अंतर करती हैं |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey` और `resolveDefaultAgentBoundAccountId` जैसे रूट/सत्र-कुंजी/खाता बाइंडिंग सहायक |
    | `plugin-sdk/status-helpers` | साझा चैनल/खाता स्थिति सारांश सहायक, रनटाइम-स्थिति डिफ़ॉल्ट और समस्या मेटाडेटा सहायक |
    | `plugin-sdk/target-resolver-runtime` | साझा लक्ष्य रिज़ॉल्वर सहायक |
    | `plugin-sdk/string-normalization-runtime` | स्लग/स्ट्रिंग सामान्यीकरण सहायक |
    | `plugin-sdk/request-url` | फ़ेच/अनुरोध-जैसे इनपुट से स्ट्रिंग URL निकालें |
    | `plugin-sdk/run-command` | सामान्यीकृत stdout/stderr परिणामों वाला समयबद्ध कमांड रनर |
    | `plugin-sdk/param-readers` | सामान्य टूल/CLI पैरामीटर रीडर |
    | `plugin-sdk/tool-plugin` | एक सरल टाइप किया गया एजेंट-टूल Plugin परिभाषित करें और मैनिफ़ेस्ट निर्माण के लिए स्थिर मेटाडेटा उपलब्ध कराएँ |
    | `plugin-sdk/tool-payload` | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
    | `plugin-sdk/tool-send` | टूल आर्ग्युमेंट से कैननिकल प्रेषण लक्ष्य फ़ील्ड निकालें |
    | `plugin-sdk/sandbox` | सैंडबॉक्स बैकएंड प्रकार और SSH/OpenShell कमांड सहायक, जिनमें शीघ्र-विफल निष्पादन कमांड पूर्व-जाँच शामिल है |
    | `plugin-sdk/temp-path` | साझा अस्थायी-डाउनलोड पथ सहायक और निजी सुरक्षित अस्थायी कार्यस्थान |
    | `plugin-sdk/logging-core` | उपतंत्र लॉगर और संपादन सहायक |
    | `plugin-sdk/markdown-table-runtime` | मार्कडाउन तालिका मोड और रूपांतरण सहायक |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry` और `resolveAgentMaxConcurrent` जैसे मॉडल/सत्र ओवरराइड सहायक |
    | `plugin-sdk/talk-config-runtime` | टॉक प्रदाता कॉन्फ़िग समाधान सहायक |
    | `plugin-sdk/json-store` | छोटे JSON स्थिति पठन/लेखन सहायक |
    | `plugin-sdk/json-unsafe-integers` | असुरक्षित पूर्णांक लिटरल को स्ट्रिंग के रूप में संरक्षित रखने वाले JSON पार्सिंग सहायक |
    | `plugin-sdk/file-lock` | पुनः-प्रवेश योग्य फ़ाइल-लॉक सहायक और निश्चित रूप से पुराने, अपरिवर्तित, सेवानिवृत्त लॉक साइडकार का Doctor-सुरक्षित पुनः अधिग्रहण |
    | `plugin-sdk/persistent-dedupe` | डिस्क-समर्थित डीडुप कैश सहायक |
    | `plugin-sdk/ingress-effect-once` | गैर-आइडेम्पोटेंट प्रवेश दुष्प्रभावों के लिए टिकाऊ दावा/कमिट गार्ड |
    | `plugin-sdk/acp-runtime` | ACP रनटाइम/सत्र और उत्तर-डिस्पैच सहायक |
    | `plugin-sdk/acp-runtime-backend` | स्टार्टअप पर लोड किए गए Plugins के लिए हल्के ACP बैकएंड पंजीकरण और उत्तर-डिस्पैच सहायक |
    | `plugin-sdk/acp-binding-resolve-runtime` | जीवनचक्र स्टार्टअप इम्पोर्ट के बिना केवल-पठन ACP बाइंडिंग समाधान |
    | `plugin-sdk/agent-config-primitives` | अप्रचलित एजेंट रनटाइम कॉन्फ़िग-स्कीमा प्रिमिटिव; स्कीमा प्रिमिटिव को रखरखाव किए जाने वाले Plugin-स्वामित्व वाली सतह से इम्पोर्ट करें |
    | `plugin-sdk/boolean-param` | शिथिल बूलियन पैरामीटर रीडर |
    | `plugin-sdk/dangerous-name-runtime` | खतरनाक-नाम मिलान समाधान सहायक |
    | `plugin-sdk/device-bootstrap` | डिवाइस बूटस्ट्रैप और पेयरिंग टोकन सहायक, जिनमें `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` शामिल है |
    | `plugin-sdk/extension-shared` | साझा निष्क्रिय-चैनल, स्थिति और परिवेशी प्रॉक्सी सहायक प्रिमिटिव |
    | `plugin-sdk/models-provider-runtime` | `/models` कमांड/प्रदाता उत्तर सहायक |
    | `plugin-sdk/skill-commands-runtime` | Skill कमांड सूचीकरण सहायक |
    | `plugin-sdk/native-command-registry` | मूल कमांड रजिस्ट्री/निर्माण/क्रमांकन सहायक |
    | `plugin-sdk/agent-harness` | निम्न-स्तरीय एजेंट हार्नेस के लिए प्रयोगात्मक विश्वसनीय-Plugin सतह: हार्नेस प्रकार, सक्रिय-रन दिशा-परिवर्तन/निरस्तीकरण सहायक, OpenClaw टूल ब्रिज सहायक, रनटाइम-योजना टूल नीति सहायक, टर्मिनल परिणाम वर्गीकरण, टूल प्रगति फ़ॉर्मेटिंग/विवरण सहायक और प्रयास परिणाम उपयोगिताएँ |
    | `plugin-sdk/provider-zai-endpoint` | अप्रचलित Z.AI प्रदाता-स्वामित्व वाला एंडपॉइंट पहचान फ़साड; Z.AI Plugin सार्वजनिक API का उपयोग करें |
    | `plugin-sdk/async-lock-runtime` | छोटी रनटाइम स्थिति फ़ाइलों के लिए प्रक्रिया-स्थानीय एसिंक लॉक सहायक |
    | `plugin-sdk/channel-activity-runtime` | चैनल गतिविधि टेलीमेट्री सहायक |
    | `plugin-sdk/concurrency-runtime` | सीमाबद्ध एसिंक कार्य समवर्तीता सहायक |
    | `plugin-sdk/dedupe-runtime` | इन-मेमोरी और स्थायी-समर्थित डीडुप कैश सहायक |
    | `plugin-sdk/delivery-queue-runtime` | आउटबाउंड लंबित-डिलीवरी निकासी सहायक |
    | `plugin-sdk/file-access-runtime` | सुरक्षित स्थानीय-फ़ाइल और मीडिया-स्रोत पथ सहायक |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat जागरण, इवेंट और दृश्यता सहायक |
    | `plugin-sdk/expect-runtime` | सिद्ध किए जा सकने वाले रनटाइम इनवेरिएंट के लिए आवश्यक-मान अभिकथन सहायक |
    | `plugin-sdk/number-runtime` | संख्यात्मक कोअर्शन सहायक |
    | `plugin-sdk/secure-random-runtime` | सुरक्षित टोकन/UUID सहायक |
    | `plugin-sdk/system-event-runtime` | सिस्टम इवेंट कतार सहायक |
    | `plugin-sdk/transport-ready-runtime` | ट्रांसपोर्ट तत्परता प्रतीक्षा सहायक |
    | `plugin-sdk/exec-approvals-runtime` | विस्तृत इन्फ़्रा-रनटाइम बैरल के बिना निष्पादन स्वीकृति नीति फ़ाइल सहायक |
    | `plugin-sdk/infra-runtime` | अप्रचलित संगतता शिम; ऊपर दिए गए केंद्रित रनटाइम उपपथों का उपयोग करें |
    | `plugin-sdk/collection-runtime` | छोटे सीमाबद्ध कैश सहायक |
    | `plugin-sdk/diagnostic-runtime` | निदान फ़्लैग, इवेंट और ट्रेस-संदर्भ सहायक |
    | `plugin-sdk/error-runtime` | त्रुटि ग्राफ़, फ़ॉर्मेटिंग, साझा त्रुटि वर्गीकरण सहायक, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | आवरित फ़ेच, प्रॉक्सी, EnvHttpProxyAgent विकल्प और पिन किए गए लुकअप सहायक |
    | `plugin-sdk/runtime-fetch` | प्रॉक्सी/गार्डेड-फ़ेच इम्पोर्ट के बिना डिस्पैचर-जागरूक रनटाइम फ़ेच |
    | `plugin-sdk/inline-image-data-url-runtime` | विस्तृत मीडिया रनटाइम सतह के बिना इनलाइन छवि डेटा URL सैनिटाइज़र और सिग्नेचर स्निफ़िंग सहायक |
    | `plugin-sdk/response-limit-runtime` | विस्तृत मीडिया रनटाइम सतह के बिना बाइट-, निष्क्रियता- और समय-सीमा-बद्ध प्रतिक्रिया-बॉडी रीडर |
    | `plugin-sdk/session-binding-runtime` | कॉन्फ़िगर किए गए बाइंडिंग रूटिंग या पेयरिंग स्टोर के बिना वर्तमान वार्तालाप बाइंडिंग स्थिति |
    | `plugin-sdk/context-visibility-runtime` | विस्तृत कॉन्फ़िग/सुरक्षा इम्पोर्ट के बिना संदर्भ दृश्यता समाधान और पूरक संदर्भ फ़िल्टरिंग |
    | `plugin-sdk/string-coerce-runtime` | मार्कडाउन/लॉगिंग इम्पोर्ट के बिना सीमित प्रिमिटिव रिकॉर्ड/स्ट्रिंग कोअर्शन और सामान्यीकरण सहायक |
    | `plugin-sdk/html-entity-runtime` | विस्तृत टेक्स्ट उपयोगिताओं के बिना एकल-पास अर्धविराम-समाप्त HTML5 एंटिटी डिकोडिंग |
    | `plugin-sdk/text-utility-runtime` | निम्न-स्तरीय टेक्स्ट और पथ सहायक, जिनमें पाँच-एंटिटी HTML एस्केपिंग शामिल है |
    | `plugin-sdk/widget-html` | स्व-निहित HTML विजेट के लिए पूर्ण-दस्तावेज़ पहचान, आकार सत्यापन और टूल इनपुट त्रुटियाँ |
    | `plugin-sdk/host-runtime` | होस्टनाम और SCP होस्ट सामान्यीकरण सहायक |
    | `plugin-sdk/retry-runtime` | पुनः प्रयास कॉन्फ़िग और पुनः प्रयास रनर सहायक |
    | `plugin-sdk/agent-runtime` | एजेंट डायरेक्टरी/पहचान/कार्यस्थान सहायकों के लिए अप्रचलित विस्तृत बैरल, जिसमें `resolveAgentDir`, `resolveDefaultAgentDir` और अप्रचलित `resolveOpenClawAgentDir` संगतता एक्सपोर्ट शामिल हैं; केंद्रित एजेंट/रनटाइम उपपथों को प्राथमिकता दें |
    | `plugin-sdk/directory-runtime` | कॉन्फ़िग-समर्थित डायरेक्टरी क्वेरी/डीडुप |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="क्षमता और परीक्षण उपपथ">
    | उपपथ | मुख्य एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/media-runtime` | अप्रचलित व्यापक मीडिया बैरल, जिसमें `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, और अप्रचलित `fetchRemoteMedia` शामिल हैं; `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media`, और क्षमता रनटाइम उपपथों को प्राथमिकता दें, और जब किसी URL को OpenClaw मीडिया बनना हो, तब बफ़र रीड से पहले स्टोर सहायकों को प्राथमिकता दें |
    | `plugin-sdk/media-mime` | सीमित MIME सामान्यीकरण, फ़ाइल-एक्सटेंशन मैपिंग, MIME पहचान, और मीडिया-प्रकार सहायक |
    | `plugin-sdk/media-store` | `saveMediaBuffer` और `saveMediaStream` जैसे सीमित मीडिया स्टोर सहायक |
    | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन फ़ेलओवर सहायक, उम्मीदवार चयन, और मॉडल अनुपलब्ध होने के संदेश |
    | `plugin-sdk/media-understanding` | मीडिया समझ प्रदाता प्रकार और प्रदाता-उन्मुख इमेज/ऑडियो/संरचित-निष्कर्षण सहायक एक्सपोर्ट |
    | `plugin-sdk/text-chunking` | आउटबाउंड टेक्स्ट और ऑफ़सेट-संरक्षित रेंज चंकिंग, मार्कडाउन चंकिंग/रेंडर सहायक, उद्धरण-सजग HTML टैग टोकनाइज़ेशन, मार्कडाउन तालिका रूपांतरण, डायरेक्टिव-टैग हटाना, और सुरक्षित-टेक्स्ट उपयोगिताएँ |
    | `plugin-sdk/speech` | स्पीच प्रदाता प्रकार और प्रदाता-उन्मुख डायरेक्टिव, रजिस्ट्री, सत्यापन, OpenAI-संगत TTS बिल्डर, और स्पीच सहायक एक्सपोर्ट |
    | `plugin-sdk/speech-core` | साझा स्पीच प्रदाता प्रकार, रजिस्ट्री, डायरेक्टिव, सामान्यीकरण, और स्पीच सहायक एक्सपोर्ट |
    | `plugin-sdk/speech-settings` | प्रदाता रजिस्ट्रियों या सिंथेसिस रनटाइम के बिना हल्के TTS कॉन्फ़िगरेशन समाधान और सामान्यीकरण प्रिमिटिव |
    | `plugin-sdk/realtime-transcription` | रियलटाइम ट्रांसक्रिप्शन प्रदाता प्रकार, रजिस्ट्री सहायक, और साझा WebSocket सत्र सहायक |
    | `plugin-sdk/realtime-bootstrap-context` | सीमित `IDENTITY.md`, `USER.md`, और `SOUL.md` संदर्भ इंजेक्शन के लिए रियलटाइम प्रोफ़ाइल बूटस्ट्रैप सहायक |
    | `plugin-sdk/realtime-voice` | रियलटाइम वॉइस प्रदाता प्रकार, रजिस्ट्री सहायक, साझा ऑडियो-ऊर्जा/वाक्-आरंभ गेट, और रियलटाइम वॉइस व्यवहार सहायक, जिनमें ट्रांसपोर्ट-स्वतंत्र सत्र हार्नेस और आउटपुट गतिविधि ट्रैकिंग शामिल हैं |
    | `plugin-sdk/meeting-runtime` | ब्राउज़र-मीटिंग सत्र रनटाइम, रियलटाइम ऑडियो इंजन/ट्रांसपोर्ट, `MeetingPlatformAdapter`, ब्राउज़र/Node नियंत्रण, एजेंट-परामर्श, वॉइस-कॉल प्रत्यायोजन, सेटअप जाँच, और SoX कमांड सहायक |
    | `plugin-sdk/image-generation` | इमेज जनरेशन प्रदाता प्रकार, इमेज एसेट/डेटा URL सहायक, और OpenAI-संगत इमेज प्रदाता बिल्डर |
    | `plugin-sdk/image-generation-core` | साझा इमेज-जनरेशन प्रकार, फ़ेलओवर, प्रमाणीकरण, और रजिस्ट्री सहायक |
    | `plugin-sdk/music-generation` | संगीत जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/music-generation-core` | अप्रचलित साझा संगीत-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता लुकअप, और मॉडल-संदर्भ पार्सिंग; Plugin-स्वामित्व वाली संगीत प्रदाता सतहों को प्राथमिकता दें |
    | `plugin-sdk/video-generation` | वीडियो जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
    | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता लुकअप, और मॉडल-संदर्भ पार्सिंग |
    | `plugin-sdk/transcripts` | साझा ट्रांसक्रिप्ट स्रोत प्रदाता प्रकार, रजिस्ट्री सहायक, सत्र वर्णनकर्ता, और कथन मेटाडेटा |
    | `plugin-sdk/webhook-targets` | Webhook लक्ष्य रजिस्ट्री और रूट-इंस्टॉल सहायक |
    | `plugin-sdk/webhook-path` | अप्रचलित संगतता उपनाम; `plugin-sdk/webhook-ingress` का उपयोग करें |
    | `plugin-sdk/web-media` | साझा रिमोट/लोकल मीडिया लोडिंग सहायक |
    | `plugin-sdk/zod` | अप्रचलित संगतता री-एक्सपोर्ट; `zod` को सीधे `zod` से इम्पोर्ट करें |
    | `plugin-sdk/plugin-test-api` | रिपॉज़िटरी परीक्षण सहायक ब्रिज इम्पोर्ट किए बिना प्रत्यक्ष Plugin पंजीकरण यूनिट परीक्षणों के लिए रिपॉज़िटरी-स्थानीय न्यूनतम `createTestPluginApi` सहायक |
    | `plugin-sdk/agent-runtime-test-contracts` | प्रमाणीकरण, डिलीवरी, फ़ेलबैक, टूल-हुक, प्रॉम्प्ट-ओवरले, स्कीमा, और ट्रांसक्रिप्ट प्रोजेक्शन परीक्षणों के लिए रिपॉज़िटरी-स्थानीय नेटिव एजेंट-रनटाइम अडैप्टर अनुबंध फ़िक्सचर |
    | `plugin-sdk/channel-test-helpers` | सामान्य ऐक्शन/सेटअप/स्थिति अनुबंधों, डायरेक्टरी अभिकथनों, अकाउंट स्टार्टअप जीवनचक्र, सेंड-कॉन्फ़िग थ्रेडिंग, रनटाइम मॉक, स्थिति समस्याओं, आउटबाउंड डिलीवरी, और हुक पंजीकरण के लिए रिपॉज़िटरी-स्थानीय चैनल-उन्मुख परीक्षण सहायक |
    | `plugin-sdk/channel-target-testing` | चैनल परीक्षणों के लिए साझा लक्ष्य-समाधान त्रुटि-स्थिति सुइट |
    | `plugin-sdk/channel-contract-testing` | व्यापक परीक्षण बैरल के बिना रिपॉज़िटरी-स्थानीय सीमित चैनल अनुबंध परीक्षण सहायक |
    | `plugin-sdk/plugin-test-contracts` | रिपॉज़िटरी-स्थानीय Plugin पैकेज, पंजीकरण, सार्वजनिक आर्टिफ़ैक्ट, प्रत्यक्ष इम्पोर्ट, रनटाइम API, और इम्पोर्ट साइड-इफ़ेक्ट अनुबंध सहायक |
    | `plugin-sdk/plugin-state-test-runtime` | रिपॉज़िटरी-स्थानीय Plugin स्टेट स्टोर, इनग्रेस कतार, और स्टेट DB परीक्षण सहायक |
    | `plugin-sdk/provider-test-contracts` | रिपॉज़िटरी-स्थानीय प्रदाता रनटाइम, प्रमाणीकरण, खोज, ऑनबोर्ड, कैटलॉग, विज़ार्ड, मीडिया क्षमता, रीप्ले नीति, रियलटाइम STT लाइव-ऑडियो, वेब-सर्च/फ़ेच, और स्ट्रीम अनुबंध सहायक |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http` का प्रयोग करने वाले प्रदाता परीक्षणों के लिए रिपॉज़िटरी-स्थानीय वैकल्पिक Vitest HTTP/प्रमाणीकरण मॉक |
    | `plugin-sdk/reply-payload-testing` | उत्तर पेलोड फ़िक्सचर में मेटाडेटा संलग्न करने के लिए रिपॉज़िटरी-स्थानीय सहायक |
    | `plugin-sdk/sqlite-runtime-testing` | प्रथम-पक्ष परीक्षणों के लिए रिपॉज़िटरी-स्थानीय SQLite जीवनचक्र सहायक |
    | `plugin-sdk/test-fixtures` | रिपॉज़िटरी-स्थानीय सामान्य CLI रनटाइम कैप्चर, सैंडबॉक्स संदर्भ, स्किल राइटर, एजेंट-संदेश, सिस्टम-इवेंट, मॉड्यूल रीलोड, बंडल किए गए Plugin पथ, टर्मिनल-टेक्स्ट, चंकिंग, प्रमाणीकरण-टोकन, और टाइप्ड-केस फ़िक्सचर |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` फ़ैक्टरियों के भीतर उपयोग के लिए रिपॉज़िटरी-स्थानीय केंद्रित Node बिल्टइन मॉक सहायक |
  </Accordion>

  <Accordion title="मेमोरी उपपथ">
    | उपपथ | मुख्य एक्सपोर्ट |
    | --- | --- |
    | `plugin-sdk/memory-core` | अप्रचलित संगतता उपनाम; `plugin-sdk/memory-host-core` का उपयोग करें |
    | `plugin-sdk/memory-core-engine-runtime` | अप्रचलित मेमोरी इंडेक्स/खोज रनटाइम फ़साड; विक्रेता-निरपेक्ष मेमोरी-होस्ट उपपथों को प्राथमिकता दें |
    | `plugin-sdk/memory-core-host-embedding-registry` | हल्के मेमोरी एम्बेडिंग प्रदाता रजिस्ट्री सहायक |
    | `plugin-sdk/memory-core-host-engine-foundation` | मेमोरी होस्ट आधार इंजन एक्सपोर्ट |
    | `plugin-sdk/memory-core-host-engine-embeddings` | मेमोरी होस्ट एम्बेडिंग अनुबंध, रजिस्ट्री अभिगम, स्थानीय प्रदाता, और सामान्य बैच/रिमोट सहायक। इस सतह पर `registerMemoryEmbeddingProvider` अप्रचलित है; नए प्रदाताओं के लिए सामान्य एम्बेडिंग प्रदाता API का उपयोग करें। |
    | `plugin-sdk/memory-core-host-engine-qmd` | मेमोरी होस्ट QMD इंजन एक्सपोर्ट |
    | `plugin-sdk/memory-core-host-engine-storage` | मेमोरी होस्ट स्टोरेज इंजन एक्सपोर्ट |
    | `plugin-sdk/memory-core-host-multimodal` | अप्रचलित मेमोरी होस्ट मल्टीमोडल सहायक; विक्रेता-निरपेक्ष मेमोरी-होस्ट उपपथों को प्राथमिकता दें |
    | `plugin-sdk/memory-core-host-query` | अप्रचलित मेमोरी होस्ट क्वेरी सहायक; विक्रेता-निरपेक्ष मेमोरी-होस्ट उपपथों को प्राथमिकता दें |
    | `plugin-sdk/memory-core-host-secret` | मेमोरी होस्ट सीक्रेट सहायक |
    | `plugin-sdk/memory-core-host-events` | अप्रचलित संगतता उपनाम; `plugin-sdk/memory-host-events` का उपयोग करें |
    | `plugin-sdk/memory-core-host-status` | मेमोरी होस्ट स्थिति सहायक |
    | `plugin-sdk/memory-core-host-runtime-cli` | मेमोरी होस्ट CLI रनटाइम सहायक |
    | `plugin-sdk/memory-core-host-runtime-core` | मेमोरी होस्ट कोर रनटाइम सहायक |
    | `plugin-sdk/memory-core-host-runtime-files` | मेमोरी होस्ट फ़ाइल/रनटाइम सहायक |
    | `plugin-sdk/memory-host-core` | मेमोरी होस्ट कोर रनटाइम सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
    | `plugin-sdk/memory-host-events` | मेमोरी होस्ट इवेंट जर्नल सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
    | `plugin-sdk/memory-host-files` | अप्रचलित संगतता उपनाम; `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
    | `plugin-sdk/memory-host-markdown` | मेमोरी-संबंधित Plugins के लिए साझा प्रबंधित-मार्कडाउन सहायक |
    | `plugin-sdk/memory-host-search` | खोज-प्रबंधक अभिगम के लिए Active Memory रनटाइम फ़साड |
    | `plugin-sdk/memory-host-status` | अप्रचलित संगतता उपनाम; `plugin-sdk/memory-core-host-status` का उपयोग करें |
  </Accordion>

  <Accordion title="आरक्षित बंडल-सहायक उपपथ">
    आरक्षित बंडल-सहायक SDK उपपथ बंडल किए गए Plugin कोड के लिए सीमित
    स्वामी-विशिष्ट सतहें हैं। इन्हें SDK इन्वेंट्री में ट्रैक किया जाता है ताकि पैकेज
    बिल्ड और उपनाम निर्धारण नियतात्मक रहें, लेकिन ये सामान्य Plugin
    लेखन API नहीं हैं। नए पुन: प्रयोज्य होस्ट अनुबंधों को `plugin-sdk/gateway-runtime`,
    `plugin-sdk/ssrf-runtime`, और `plugin-sdk/plugin-config-runtime` जैसे सामान्य SDK उपपथों
    का उपयोग करना चाहिए।

    | उपपथ | स्वामी और उद्देश्य |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | उपयोगकर्ता MCP सर्वर कॉन्फ़िगरेशन को Codex ऐप-सर्वर थ्रेड कॉन्फ़िगरेशन में प्रोजेक्ट करने के लिए बंडल किए गए Codex Plugin का सहायक (आरक्षित पैकेज एक्सपोर्ट) |
    | `plugin-sdk/codex-native-task-runtime` | Codex ऐप-सर्वर नेटिव उप-एजेंटों को OpenClaw कार्य स्थिति में मिरर करने के लिए बंडल किए गए Codex Plugin का सहायक (केवल रिपॉज़िटरी-स्थानीय, पैकेज एक्सपोर्ट नहीं) |

  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
