---
read_when:
    - आपको OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED चेतावनी दिखाई देती है
    - आपको OPENCLAW_EXTENSION_API_DEPRECATED चेतावनी दिखाई देती है
    - आपने OpenClaw 2026.4.25 से पहले api.registerEmbeddedExtensionFactory का उपयोग किया था
    - आप किसी Plugin को आधुनिक Plugin आर्किटेक्चर के अनुरूप अपडेट कर रहे हैं
    - आप एक बाहरी OpenClaw Plugin का रखरखाव करते हैं
sidebarTitle: Migrate to SDK
summary: पुरानी पश्च-संगतता परत से आधुनिक Plugin SDK पर माइग्रेट करें
title: Plugin SDK माइग्रेशन
x-i18n:
    generated_at: "2026-07-20T07:33:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af65ffc5b71e5e2bfd3e54e6cfe80fd02a058dfa33646994386ab08ad583fbb0
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ने एक व्यापक पश्च-संगतता परत को छोटे, केंद्रित इम्पोर्ट से निर्मित आधुनिक Plugin
आर्किटेक्चर से बदल दिया है। यदि आपका Plugin उस
बदलाव से पहले का है, तो यह मार्गदर्शिका उसे वर्तमान अनुबंधों पर लाती है।

## क्या बदला

पहले कई अत्यधिक खुले इम्पोर्ट सतहों के कारण Plugin एक ही प्रवेश बिंदु से
लगभग किसी भी चीज़ तक पहुँच सकते थे:

- **`openclaw/plugin-sdk`** और **`openclaw/plugin-sdk/compat`** - केंद्रित SDK बनाए जाते समय
  दर्जनों सहायक फ़ंक्शन फिर से एक्सपोर्ट करते थे। दोनों रूट अब
  हटा दिए गए हैं; इसके बजाय किसी दस्तावेज़ीकृत उपपथ को इम्पोर्ट करें।
- **`openclaw/plugin-sdk/infra-runtime`** - एक व्यापक बैरल, जिसमें सिस्टम
  इवेंट, Heartbeat स्थिति, डिलीवरी कतारें, फ़ेच/प्रॉक्सी सहायक, फ़ाइल सहायक,
  अनुमोदन प्रकार और असंबंधित उपयोगिताएँ मिश्रित थीं।
- **`openclaw/plugin-sdk/config-runtime`** - एक व्यापक कॉन्फ़िगरेशन बैरल, जिसे
  केवल इसकी बाद की संगतता अवधि के लिए रखा गया था; प्रत्यक्ष रनटाइम लोड/राइट सहायक
  हटा दिए गए हैं।
- **`openclaw/extension-api`** - एक हटाया गया ब्रिज, जो Plugin को एम्बेडेड एजेंट रनर जैसे
  होस्ट-पक्षीय सहायकों तक प्रत्यक्ष पहुँच देता था।
- **`api.registerEmbeddedExtensionFactory(...)`** - केवल एम्बेडेड रनर के लिए एक हटाया गया
  हुक, जो `tool_result` जैसे एम्बेडेड-रनर इवेंट देखता था। इसके बजाय एजेंट
  टूल-परिणाम मिडलवेयर का उपयोग करें ([एम्बेडेड टूल-परिणाम एक्सटेंशन को
  मिडलवेयर में माइग्रेट करें](#how-to-migrate) देखें)।

रूट SDK, संगतता बैरल, एक्सटेंशन ब्रिज और एम्बेडेड एक्सटेंशन फ़ैक्टरी
हटा दिए गए हैं। `infra-runtime` और `config-runtime` केवल अपनी
अलग से दर्ज बाद की अवधियों के लिए बने हुए हैं; नए Plugin को केंद्रित उपपथों का उपयोग करना चाहिए।

<Warning>
  हटाए गए रूट, संगतता या एक्सटेंशन सतहों को इम्पोर्ट करने वाले Plugin अब
  लोड नहीं होते। अपग्रेड करने से पहले नीचे दिए गए मैपिंग का पालन करें।
</Warning>

OpenClaw किसी प्रतिस्थापन को प्रस्तुत करने वाले उसी बदलाव में दस्तावेज़ीकृत Plugin व्यवहार को
न तो हटाता है और न ही उसकी पुनर्व्याख्या करता है। अनुबंध तोड़ने वाले बदलाव पहले
संगतता एडाप्टर, निदान, दस्तावेज़ और एक अप्रचलन अवधि से गुजरते हैं। यह
SDK इम्पोर्ट, मैनिफ़ेस्ट फ़ील्ड, सेटअप API, हुक और रनटाइम
पंजीकरण व्यवहार पर लागू होता है।

### क्यों

- **धीमा स्टार्टअप** - एक सहायक को इम्पोर्ट करने पर दर्जनों असंबंधित मॉड्यूल लोड होते थे।
- **चक्रीय निर्भरताएँ** - व्यापक री-एक्सपोर्ट के कारण इम्पोर्ट चक्र बनाना आसान था।
- **अस्पष्ट API सतह** - स्थिर एक्सपोर्ट को आंतरिक एक्सपोर्ट से अलग पहचानने का कोई तरीका नहीं था।

अब प्रत्येक `openclaw/plugin-sdk/<subpath>` एक छोटा, स्व-निहित मॉड्यूल है,
जिसका अनुबंध दस्तावेज़ीकृत है।

बंडल किए गए चैनलों के लिए पुराने प्रदाता सुविधा-सीम भी अब हट गए हैं -
चैनल-ब्रांडेड सहायक शॉर्टकट निजी मोनो-रेपो सुविधाएँ थे, स्थिर
Plugin अनुबंध नहीं। इसके बजाय संकीर्ण सामान्य SDK उपपथों का उपयोग करें। बंडल किए गए
Plugin कार्यक्षेत्र के भीतर प्रदाता-स्वामित्व वाले सहायकों को उस Plugin के अपने
`api.ts` या `runtime-api.ts` में रखें:

- Anthropic अपने Claude-विशिष्ट स्ट्रीम सहायकों को अपने `api.ts` /
  `contract-api.ts` सीम में रखता है।
- OpenAI प्रदाता बिल्डर, डिफ़ॉल्ट-मॉडल सहायक और रीयलटाइम प्रदाता
  बिल्डर अपने `api.ts` में रखता है।
- OpenRouter प्रदाता बिल्डर और ऑनबोर्डिंग/कॉन्फ़िगरेशन सहायक अपने
  `api.ts` में रखता है।

## संगतता नीति

बाहरी Plugin की संगतता का कार्य इस क्रम में होता है:

1. नया अनुबंध जोड़ें।
2. पुराने व्यवहार को संगतता एडाप्टर के माध्यम से जोड़े रखें।
3. पुराने पथ और उसके प्रतिस्थापन का नाम बताने वाला निदान या चेतावनी जारी करें।
4. परीक्षणों में दोनों पथों को शामिल करें।
5. अप्रचलन और माइग्रेशन पथ का दस्तावेज़ीकरण करें।
6. घोषित माइग्रेशन अवधि के बाद ही हटाएँ, सामान्यतः किसी प्रमुख
   रिलीज़ में।

यदि कोई मैनिफ़ेस्ट फ़ील्ड अभी भी स्वीकार किया जाता है, तो दस्तावेज़ और
निदान द्वारा अन्यथा बताए जाने तक उसका उपयोग जारी रखें। नए कोड को दस्तावेज़ीकृत प्रतिस्थापन को प्राथमिकता देनी चाहिए;
सामान्य माइनर रिलीज़ के दौरान मौजूदा Plugin नहीं टूटने चाहिए।

`pnpm plugins:boundary-report` से वर्तमान माइग्रेशन कतार का ऑडिट करें:

| फ़्लैग                                                    | प्रभाव                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (या `pnpm plugins:boundary-report:summary`) | पूर्ण विवरण के बजाय संक्षिप्त संख्याएँ।                                         |
| `--json`                                                | मशीन-पठनीय रिपोर्ट।                                                       |
| `--owner <id>`                                          | किसी एक Plugin या संगतता स्वामी तक फ़िल्टर करें।                                   |
| `--fail-on-cross-owner`                                 | विभिन्न स्वामियों के बीच आरक्षित SDK इम्पोर्ट होने पर गैर-शून्य मान के साथ बाहर निकलें।                             |
| `--fail-on-eligible-compat`                             | अप्रचलित संगतता रिकॉर्ड की `removeAfter` तिथि बीत जाने पर गैर-शून्य मान के साथ बाहर निकलें। |
| `--fail-on-unclassified-unused-reserved`                | अप्रयुक्त आरक्षित SDK शिम होने पर गैर-शून्य मान के साथ बाहर निकलें।                                    |

`pnpm plugins:boundary-report:ci` तीनों विफलता फ़्लैग के साथ चलता है। प्रत्येक
संगतता रिकॉर्ड में स्पष्ट `removeAfter` तिथि होती है (अस्पष्ट "अगली
प्रमुख रिलीज़" नहीं) - रिपोर्ट उस तिथि के अनुसार अप्रचलित रिकॉर्ड समूहित करती है,
स्थानीय कोड/दस्तावेज़ संदर्भ गिनती है, विभिन्न स्वामियों के बीच आरक्षित SDK इम्पोर्ट सामने लाती है और
निजी मेमोरी-होस्ट SDK ब्रिज का सारांश देती है। आरक्षित SDK उपपथों के लिए
ट्रैक किया गया स्वामी उपयोग होना आवश्यक है; अप्रयुक्त आरक्षित एक्सपोर्ट को सार्वजनिक
SDK से हटा देना चाहिए।

## माइग्रेट कैसे करें

<Steps>
  <Step title="रनटाइम कॉन्फ़िगरेशन लोड/राइट सहायकों को माइग्रेट करें">
    बंडल किए गए Plugin को `api.runtime.config.loadConfig()` और
    `api.runtime.config.writeConfigFile(...)` को सीधे कॉल करना बंद कर देना चाहिए। सक्रिय कॉल पथ में पहले से
    पास किए गए कॉन्फ़िगरेशन को प्राथमिकता दें। वर्तमान प्रक्रिया स्नैपशॉट की आवश्यकता वाले
    दीर्घजीवी हैंडलर `api.runtime.config.current()` का उपयोग कर सकते हैं। दीर्घजीवी
    एजेंट टूल को `execute` के भीतर `ctx.getRuntimeConfig()` पढ़ना चाहिए, ताकि कॉन्फ़िगरेशन राइट से
    पहले बनाया गया टूल भी रीफ़्रेश किया हुआ कॉन्फ़िगरेशन देख सके।

    कॉन्फ़िगरेशन राइट स्पष्ट राइट-पश्चात नीति वाले ट्रांज़ैक्शनल सहायक से किए जाते हैं:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    जब बदलाव के लिए Gateway का स्वच्छ रीस्टार्ट आवश्यक हो, तब `afterWrite: { mode: "restart", reason: "..." }` का उपयोग करें,
    और `afterWrite: { mode: "none", reason: "..." }` का उपयोग केवल तब करें
    जब कॉलर अनुवर्ती कार्रवाई का स्वामी हो और जानबूझकर
    रीलोड प्लानर को दबाए। म्यूटेशन परिणामों में परीक्षण और लॉगिंग के लिए टाइप किया हुआ `followUp` सारांश शामिल होता है;
    रीस्टार्ट लागू करने या शेड्यूल करने की ज़िम्मेदारी Gateway की बनी रहती है।

    `loadConfig` और `writeConfigFile` को Plugin
    रनटाइम से हटा दिया गया है। बंडल किए गए Plugin और रेपो रनटाइम कोड
    `pnpm check:deprecated-api-usage` और
    `pnpm check:no-runtime-action-load-config` द्वारा सुरक्षित हैं: उत्पादन के नए Plugin उपयोग
    सीधे विफल होते हैं, प्रत्यक्ष कॉन्फ़िगरेशन राइट विफल होते हैं, Gateway सर्वर विधियों को
    अनुरोध रनटाइम स्नैपशॉट का उपयोग करना आवश्यक है, रनटाइम चैनल सेंड/एक्शन/क्लाइंट सहायकों को
    अपनी सीमा से कॉन्फ़िगरेशन प्राप्त करना आवश्यक है, और दीर्घजीवी रनटाइम मॉड्यूल
    परिवेशी `loadConfig()` कॉल की संख्या शून्य रखने की अनुमति देते हैं।

    नए Plugin कोड को व्यापक `openclaw/plugin-sdk/config-runtime`
    बैरल से बचना चाहिए। कार्य के लिए संकीर्ण उपपथ का उपयोग करें:

    | आवश्यकता | इम्पोर्ट |
    | --- | --- |
    | `OpenClawConfig` जैसे कॉन्फ़िगरेशन प्रकार | `openclaw/plugin-sdk/config-contracts` |
    | Plugin-प्रवेश कॉन्फ़िगरेशन लुकअप | `api.pluginConfig` |
    | कॉन्फ़िगरेशन मर्ज करना | कॉन्फ़िगरेशन सीमा पर Plugin-स्थानीय लॉजिक |
    | वर्तमान रनटाइम स्नैपशॉट रीड | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | कॉन्फ़िगरेशन राइट | `openclaw/plugin-sdk/config-mutation` |
    | सेशन स्टोर सहायक | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown तालिका कॉन्फ़िगरेशन | `openclaw/plugin-sdk/markdown-table-runtime` |
    | समूह नीति रनटाइम सहायक | `openclaw/plugin-sdk/runtime-group-policy` |
    | सीक्रेट इनपुट समाधान | `openclaw/plugin-sdk/secret-input-runtime` |
    | मॉडल/सेशन ओवरराइड | `openclaw/plugin-sdk/model-session-runtime` |

    बंडल किए गए Plugin और उनके परीक्षण व्यापक
    बैरल के विरुद्ध स्कैनर-सुरक्षित हैं, ताकि इम्पोर्ट और मॉक केवल आवश्यक व्यवहार तक स्थानीय रहें।
    बाहरी संगतता के लिए बैरल अभी भी मौजूद है, लेकिन नए कोड को
    उस पर निर्भर नहीं होना चाहिए।

  </Step>

  <Step title="एम्बेडेड टूल-परिणाम एक्सटेंशन को मिडलवेयर में माइग्रेट करें">
    बंडल किए गए Plugin को केवल एम्बेडेड रनर वाले
    `api.registerEmbeddedExtensionFactory(...)` टूल-परिणाम हैंडलर को
    रनटाइम-निरपेक्ष मिडलवेयर से बदलना आवश्यक है:

    ```typescript
    // OpenClaw रनटाइम टूल और Codex रनटाइम डायनेमिक टूल (परिणाम
    // रूपांतरित किया जा सकता है)। Codex-नेटिव टूल परिणाम भी अवलोकन के लिए रिले किए जाते हैं,
    // लेकिन उनका रूपांतरित आउटपुट कभी मॉडल तक नहीं पहुँचता: Codex
    // PostToolUse हुक अनुबंध किसी नेटिव टूल प्रतिक्रिया को प्रतिस्थापित नहीं कर सकता।
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    उसी समय Plugin मैनिफ़ेस्ट को अपडेट करें:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    इंस्टॉल किए गए Plugin भी टूल-परिणाम मिडलवेयर पंजीकृत कर सकते हैं, जब उसे स्पष्ट रूप से
    सक्षम किया गया हो और प्रत्येक लक्षित रनटाइम
    `contracts.agentToolResultMiddleware` में घोषित हो। अघोषित इंस्टॉल किए गए मिडलवेयर
    पंजीकरण अस्वीकार कर दिए जाते हैं।

  </Step>

  <Step title="अनुमोदन-नेटिव हैंडलर को क्षमता तथ्यों में माइग्रेट करें">
    अनुमोदन-सक्षम चैनल Plugin नेटिव अनुमोदन व्यवहार
    `approvalCapability.nativeRuntime` और साझा रनटाइम-संदर्भ
    रजिस्ट्री के माध्यम से उजागर करते हैं:

    - `approvalCapability.handler.loadRuntime(...)` को
      `approvalCapability.nativeRuntime` से बदलें।
    - अनुमोदन-विशिष्ट प्रमाणीकरण/डिलीवरी को पुराने `plugin.auth` /
      `plugin.approvals` वायरिंग से हटाकर `approvalCapability` पर ले जाएँ।
    - `ChannelPlugin.approvals` को सार्वजनिक
      चैनल-Plugin अनुबंध से हटा दिया गया है; डिलीवरी/नेटिव/रेंडर फ़ील्ड को
      `approvalCapability` पर ले जाएँ।
    - `plugin.auth` केवल चैनल लॉगिन/लॉगआउट प्रवाह के लिए बना हुआ है; कोर अब
      वहाँ अनुमोदन प्रमाणीकरण हुक नहीं पढ़ता।
    - चैनल-स्वामित्व वाली रनटाइम वस्तुओं (क्लाइंट, टोकन, Bolt ऐप)
      को `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से पंजीकृत करें।
    - नेटिव अनुमोदन हैंडलर से Plugin-स्वामित्व वाली पुनः-रूट सूचना न भेजें;
      वास्तविक डिलीवरी परिणामों से अन्यत्र रूट की गई सूचनाओं का स्वामी कोर है।
    - `channelRuntime` को `createChannelManager(...)` में पास करते समय एक
      वास्तविक `createPluginRuntime().channel` सतह प्रदान करें - आंशिक स्टब
      अस्वीकार कर दिए जाते हैं।

    वर्तमान अनुमोदन क्षमता लेआउट के लिए [चैनल Plugin](/hi/plugins/sdk-channel-plugins) देखें।

  </Step>

  <Step title="Windows रैपर फ़ॉलबैक व्यवहार का ऑडिट करें">
    यदि आपका Plugin `openclaw/plugin-sdk/windows-spawn` का उपयोग करता है, तो अनसुलझे Windows
    `.cmd`/`.bat` रैपर अब तब तक सुरक्षित रूप से विफल होते हैं, जब तक आप स्पष्ट रूप से
    `allowShellFallback: true` पास न करें:

    ```typescript
    // पहले
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // बाद में
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // इसे केवल उन विश्वसनीय संगतता कॉलर के लिए सेट करें जो जानबूझकर
      // शेल-मध्यस्थित फ़ॉलबैक स्वीकार करते हैं।
      allowShellFallback: true,
    });
    ```

    यदि आपका कॉलर जानबूझकर शेल फ़ॉलबैक पर निर्भर नहीं है, तो
    `allowShellFallback` सेट न करें और इसके बजाय उत्पन्न त्रुटि को संभालें।

  </Step>

  <Step title="अप्रचलित इम्पोर्ट खोजें">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="केंद्रित इम्पोर्ट से बदलें">
    पुरानी सतह का प्रत्येक एक्सपोर्ट किसी विशिष्ट आधुनिक इम्पोर्ट पथ से मैप होता है:

    ```typescript
    // पहले (पदावनत पश्चगामी-संगतता परत)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // बाद में (आधुनिक केंद्रित आयात)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    होस्ट-साइड सहायकों के लिए, सीधे आयात करने के बजाय इंजेक्ट किए गए Plugin रनटाइम का
    उपयोग करें:

    ```typescript
    // पहले (पदावनत extension-api ब्रिज)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // बाद में (इंजेक्ट किया गया रनटाइम)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    अन्य पुराने ब्रिज सहायकों के लिए भी यही पैटर्न है:

    | पुराना आयात | आधुनिक समकक्ष |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | सत्र स्टोर सहायक | `api.runtime.agent.session.*` |

  </Step>

  <Step title="व्यापक infra-runtime आयात बदलें">
    बाहरी संगतता के लिए `openclaw/plugin-sdk/infra-runtime` अभी भी मौजूद है,
    लेकिन नए कोड को वास्तव में आवश्यक केंद्रित सतह का आयात करना चाहिए:

    | आवश्यकता | आयात |
    | --- | --- |
    | सिस्टम इवेंट क्यू सहायक | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat वेक, इवेंट और दृश्यता सहायक | `openclaw/plugin-sdk/heartbeat-runtime` |
    | लंबित डिलीवरी क्यू निकासी | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | चैनल गतिविधि टेलीमेट्री | `openclaw/plugin-sdk/channel-activity-runtime` |
    | इन-मेमोरी और स्थायी-बैक्ड डीडुप कैश | `openclaw/plugin-sdk/dedupe-runtime` |
    | सुरक्षित स्थानीय फ़ाइल/मीडिया पथ सहायक | `openclaw/plugin-sdk/file-access-runtime` |
    | डिस्पैचर-जागरूक फ़ेच | `openclaw/plugin-sdk/runtime-fetch` |
    | प्रॉक्सी और संरक्षित फ़ेच सहायक | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF डिस्पैचर नीति प्रकार | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | अनुमोदन अनुरोध/समाधान प्रकार | `openclaw/plugin-sdk/approval-runtime` |
    | अनुमोदन उत्तर पेलोड और कमांड सहायक | `openclaw/plugin-sdk/approval-reply-runtime` |
    | त्रुटि फ़ॉर्मेटिंग सहायक | `openclaw/plugin-sdk/error-runtime` |
    | ट्रांसपोर्ट तत्परता प्रतीक्षा | `openclaw/plugin-sdk/transport-ready-runtime` |
    | सुरक्षित टोकन सहायक | `openclaw/plugin-sdk/secure-random-runtime` |
    | सीमित एसिंक कार्य समवर्तीता | `openclaw/plugin-sdk/concurrency-runtime` |
    | सिद्ध किए जा सकने वाले अपरिवर्तनों के लिए आवश्यक-मान अभिकथन | `openclaw/plugin-sdk/expect-runtime` |
    | संख्यात्मक कोअर्शन | `openclaw/plugin-sdk/number-runtime` |
    | प्रक्रिया-स्थानीय एसिंक लॉक | `openclaw/plugin-sdk/async-lock-runtime` |
    | फ़ाइल लॉक | `openclaw/plugin-sdk/file-lock` |

    बंडल किए गए plugins को स्कैनर द्वारा `infra-runtime` से सुरक्षित रखा जाता है, इसलिए रिपॉज़िटरी कोड
    फिर से व्यापक बैरल पर नहीं लौट सकता।

  </Step>

  <Step title="चैनल रूट सहायकों को माइग्रेट करें">
    नया चैनल रूट कोड `openclaw/plugin-sdk/channel-route` का उपयोग करता है। पुराने
    रूट-की नाम संगतता उपनामों के रूप में बने हुए हैं:

    | पुराना सहायक | आधुनिक सहायक |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    आधुनिक रूट सहायक नेटिव अनुमोदनों, उत्तर दमन, इनबाउंड डीडुप,
    Cron डिलीवरी और सत्र रूटिंग में `{ channel, to, accountId, threadId }` को
    सुसंगत रूप से सामान्यीकृत करते हैं।

    `plugin-sdk/channel-route` से `ChannelMessagingAdapter.parseExplicitTarget` या
    `resolveChannelRouteTargetWithParser(...)` के नए उपयोग न जोड़ें—
    वे पदावनत हैं और केवल पुराने plugins के लिए बने हुए हैं।
    नए चैनल plugins को लक्ष्य-ID सामान्यीकरण और
    डायरेक्टरी-मिस फ़ॉलबैक के लिए `messaging.targetResolver.resolveTarget(...)`,
    जब कोर को आरंभिक पीयर प्रकार चाहिए तब `messaging.inferTargetChatType(...)`,
    और प्रदाता-नेटिव सत्र तथा थ्रेड पहचान के लिए
    `messaging.resolveOutboundSessionRoute(...)` का उपयोग करना चाहिए।

  </Step>

  <Step title="बिल्ड और परीक्षण करें">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## आयात पथ संदर्भ

सार्वजनिक पैकेज एक्सपोर्ट मैप आयात किए जा सकने वाले SDK सबपाथ के लिए सत्य का स्रोत है।
[SDK अवलोकन](/hi/plugins/sdk-overview) से लिंक की गई विषयगत SDK मार्गदर्शिकाओं का उपयोग करें
और सबसे संकीर्ण दस्तावेज़ीकृत सार्वजनिक सबपाथ को प्राथमिकता दें। `scripts/lib/plugin-sdk-entrypoints.json`
में कंपाइलर इन्वेंटरी में बंडल किए गए plugins को बिल्ड करने के लिए उपयोग की जाने वाली
निजी-स्थानीय प्रविष्टियाँ भी हैं; वहाँ उनकी उपस्थिति उन्हें सार्वजनिक पैकेज एक्सपोर्ट नहीं बनाती।

यह तालिका सामान्य माइग्रेशन उपसमुच्चय है, संपूर्ण SDK सतह नहीं। कंपाइलर
एंट्रीपॉइंट इन्वेंटरी `scripts/lib/plugin-sdk-entrypoints.json` में है; पैकेज एक्सपोर्ट
सार्वजनिक उपसमुच्चय से जनरेट किए जाते हैं।

आरक्षित बंडल-Plugin सहायक सीमों को सार्वजनिक SDK एक्सपोर्ट मैप से हटा दिया गया है,
सिवाय स्पष्ट रूप से दस्तावेज़ीकृत संगतता फ़साड के, जैसे पदावनत
`plugin-sdk/discord` शिम, जिसे अब भी प्रकाशित `@openclaw/discord` पैकेज को
सीधे आयात करने वाले बाहरी plugins के लिए बनाए रखा गया है। स्वामी-विशिष्ट
सहायक स्वामी Plugin पैकेज के भीतर रहते हैं; साझा होस्ट व्यवहार
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` और इंजेक्ट किए गए Plugin API जैसे
सामान्य SDK अनुबंधों से होकर जाता है।

कार्य से मेल खाने वाले सबसे संकीर्ण आयात का उपयोग करें। यदि आपको कोई एक्सपोर्ट नहीं मिलता,
तो `src/plugin-sdk/` पर स्रोत देखें या अनुरक्षकों से पूछें कि इसका स्वामित्व किस सामान्य
अनुबंध के पास होना चाहिए।

## हटाई गई संगतता सतहें

जुलाई 2026 के स्वीप ने रूट SDK और compat बैरल, extension API ब्रिज,
समाप्त SDK सबपाथ उपनाम, अप्रयुक्त SDK सबपाथ और केवल-बंडल SDK मॉड्यूल के सार्वजनिक
एक्सपोर्ट हटा दिए। केवल-बंडल मॉड्यूल निजी-स्थानीय बिल्ड मैपिंग के माध्यम से
अपने रिपॉज़िटरी स्वामियों के लिए उपलब्ध रहते हैं; उन्हें प्रकाशित पैकेज से
आयात नहीं किया जा सकता।

### प्रक्रिया-वैश्विक API-प्रदाता प्रकाशन

`registerApiProvider(...)` और `unregisterApiProviders(...)` को
`openclaw/plugin-sdk/llm` से हटा दिया गया। वे API ट्रांसपोर्ट को प्रक्रिया-वैश्विक
स्थिति में प्रकाशित करते थे, जिसे फिर जीवनचक्र-स्वामित्व वाले मॉडल रनटाइम को प्रत्येक तैयार
रजिस्ट्री में कॉपी करना पड़ता था।

प्रदाता plugins को `api.registerProvider(...)` के माध्यम से टेक्स्ट-अनुमान प्रदाताओं को
पंजीकृत करना चाहिए। `ApiRegistry` बनाने वाले होस्ट-स्वामित्व वाले कोड और परीक्षणों को
सीधे उस रजिस्ट्री पर पंजीकरण करना चाहिए, ताकि प्रदाता का स्वामित्व और टियरडाउन
तैयार रनटाइम के दायरे में रहें।

### निजी परीक्षण बैरल

`openclaw/plugin-sdk/testing` रिपॉज़िटरी-स्थानीय था और शिप किए गए पैकेज
आर्टिफ़ैक्ट से बाहर रखा गया था, इसलिए इसे इसकी 2026-07-28 `removeAfter` तिथि से पहले
हटा दिया गया। रिपॉज़िटरी परीक्षण `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env` और `plugin-sdk/test-fixtures` जैसे केंद्रित सबपाथ का उपयोग करते हैं।

## माइग्रेशन संदर्भ

ये मैपिंग जुलाई 2026 में हटाई गई सतहों और बाद की अवधि की सक्रिय
पदावनतियों—दोनों को कवर करती हैं। कोई मैपिंग माइग्रेशन मार्गदर्शन है, इस बात का प्रमाण नहीं
कि पुरानी सतह अभी भी उपलब्ध है; वर्तमान स्थिति के लिए संगतता रजिस्ट्री और हटाने की
समयरेखा देखें।

<AccordionGroup>
  <Accordion title="command-auth सहायता बिल्डर -> command-status">
    **पुराना (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`।

    **नया (`openclaw/plugin-sdk/command-status`)**: वही सिग्नेचर, अधिक संकीर्ण
    सबपाथ से आयात किए गए। `command-auth` संगतता पुनः-एक्सपोर्ट
    हटा दिए गए हैं।

    ```typescript
    // पहले
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // बाद में
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="मेंशन गेटिंग सहायक -> resolveInboundMentionDecision">
    **पुराना**: `openclaw/plugin-sdk/channel-inbound` या
    `openclaw/plugin-sdk/channel-mention-gating` से `resolveMentionGating(params)` और
    `resolveMentionGatingWithBypass(params)`।

    **नया**: `resolveInboundMentionDecision({ facts, policy })`—दो विभाजित कॉल आकृतियों के बजाय
    एक निर्णय ऑब्जेक्ट।

    Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp और Zalo में अपनाया गया। Slack का अपना `app_mention`
    इवेंट मॉडल इस सहायक का उपयोग नहीं करता।

  </Accordion>

  <Accordion title="चैनल रनटाइम शिम और चैनल एक्शन सहायक">
    `openclaw/plugin-sdk/channel-runtime` हटा दिया गया है। रनटाइम ऑब्जेक्ट
    पंजीकृत करने के लिए `openclaw/plugin-sdk/channel-runtime-context` का उपयोग करें।

    `openclaw/plugin-sdk/channel-actions` में नेटिव संदेश स्कीमा सहायक
    कच्चे "actions" चैनल एक्सपोर्ट के साथ हटा दिए गए। इसके बजाय क्षमताओं को
    सिमैंटिक `presentation` सतह के माध्यम से उजागर करें—चैनल plugins
    बताते हैं कि वे क्या रेंडर करते हैं (कार्ड, बटन, चयन), न कि वे किन कच्चे
    एक्शन नामों को स्वीकार करते हैं।

  </Accordion>

  <Accordion title="वेब खोज प्रदाता tool() सहायक -> Plugin पर createTool()">
    **पुराना**: `openclaw/plugin-sdk/provider-web-search` से `tool()` फ़ैक्टरी।

    **नया**: प्रदाता Plugin पर सीधे `createTool(...)` लागू करें।
    टूल रैपर को पंजीकृत करने के लिए OpenClaw को अब SDK सहायक की आवश्यकता नहीं है।

  </Accordion>

  <Accordion title="प्लेनटेक्स्ट चैनल एनवेलप -> BodyForAgent">
    **पुराना**: इनबाउंड चैनल संदेशों से एक सपाट प्लेनटेक्स्ट प्रॉम्प्ट
    एनवेलप बनाने के लिए `api.runtime.channel.reply.formatInboundEnvelope(...)` (और इनबाउंड संदेश ऑब्जेक्ट पर
    `channelEnvelope` फ़ील्ड)।

    **नया**: `BodyForAgent` और संरचित उपयोगकर्ता-संदर्भ ब्लॉक। चैनल
    plugins रूटिंग मेटाडेटा (थ्रेड, विषय, उत्तर-प्रति, प्रतिक्रियाएँ) को
    प्रॉम्प्ट स्ट्रिंग में जोड़ने के बजाय टाइप किए गए फ़ील्ड के रूप में संलग्न करते हैं।
    संश्लेषित सहायक-सामना एनवेलप के लिए `formatAgentEnvelope(...)` सहायक अभी भी समर्थित है,
    लेकिन इनबाउंड प्लेनटेक्स्ट एनवेलप हटाए जा रहे हैं।

    प्रभावित क्षेत्र: `inbound_claim`, `message_received` और पुराना एनवेलप
    टेक्स्ट पोस्ट-प्रोसेस करने वाला कोई भी कस्टम चैनल Plugin।

  </Accordion>

  <Accordion title="deactivate हुक -> gateway_stop">
    **पुराना**: `api.on("deactivate", handler)`।

    **नया**: `api.on("gateway_stop", handler)`। वही शटडाउन क्लीनअप
    अनुबंध; केवल हुक का नाम बदलता है।

    ```typescript
    // पहले
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // बाद में
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` पदावनत संगतता उपनाम के रूप में तब तक जुड़ा रहेगा, जब तक इसे
    2026-08-16 के बाद हटा नहीं दिया जाता।

  </Accordion>

  <Accordion title="subagent_spawning हुक -> कोर थ्रेड बाइंडिंग">
    **पुराना**: `api.on("subagent_spawning", handler)`, जो
    `threadBindingReady` या `deliveryOrigin` लौटाता है।

    **नया**: कोर को चैनल सत्र-बाइंडिंग एडाप्टर के माध्यम से
    `thread: true` सबएजेंट बाइंडिंग तैयार करने दें। लॉन्च के बाद निरीक्षण के लिए
    केवल `api.on("subagent_spawned", handler)` का उपयोग करें।

    ```typescript
    // पहले
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // बाद में
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    बाहरी plugins के माइग्रेट होने तक `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` और `SubagentLifecycleHookRunner.runSubagentSpawning(...)`
    केवल पदावनत संगतता सतहों के रूप में बने रहेंगे और
    2026-08-30 के बाद हटा दिए जाएँगे।

  </Accordion>

  <Accordion title="प्रदाता खोज प्रकार -> प्रदाता कैटलॉग प्रकार">
    चार खोज प्रकार उपनाम अब कैटलॉग-युग प्रकारों पर पतले रैपर हैं:

    | पुराना उपनाम                 | नया प्रकार                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    उपनाम और पुराना `ProviderCapabilities` स्थिर बैग हटा दिए गए हैं।
    प्रदाता plugins को स्थिर ऑब्जेक्ट के बजाय `buildReplayPolicy`,
    `normalizeToolSchemas` और `wrapStreamFn` जैसे स्पष्ट प्रदाता हुक
    का उपयोग करना चाहिए।

  </Accordion>

  <Accordion title="चिंतन नीति हुक -> resolveThinkingProfile">
    **पुराना** (`ProviderThinkingPolicy` पर तीन अलग हुक):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` और
    `resolveDefaultThinkingLevel(ctx)`।

    **नया**: एकल `resolveThinkingProfile(ctx)` जो कैनोनिकल `id`, वैकल्पिक `label`, और
    रैंक की गई स्तर सूची वाला
    `ProviderThinkingProfile` लौटाता है। OpenClaw प्रोफ़ाइल रैंक के आधार पर संग्रहीत पुराने मानों को
    स्वचालित रूप से डाउनग्रेड करता है।

    संदर्भ में `provider`, `modelId`, वैकल्पिक मर्ज किए गए `reasoning`,
    और वैकल्पिक मर्ज किए गए मॉडल `compat` तथ्य शामिल हैं। प्रोवाइडर plugins उन
    कैटलॉग तथ्यों का उपयोग केवल तभी मॉडल-विशिष्ट प्रोफ़ाइल उपलब्ध कराने के लिए कर सकते हैं, जब कॉन्फ़िगर किया गया
    अनुरोध अनुबंध उसका समर्थन करता हो।

    तीन के बजाय एक हुक लागू करें। पुराने हुक हटा दिए गए हैं।

  </Accordion>

  <Accordion title="बाहरी प्रमाणीकरण प्रोवाइडर -> contracts.externalAuthProviders">
    **पुराना**: Plugin मैनिफ़ेस्ट में प्रोवाइडर घोषित किए बिना बाहरी प्रमाणीकरण हुक
    लागू करना।

    **नया**: Plugin मैनिफ़ेस्ट में `contracts.externalAuthProviders` घोषित करें
    **और** `resolveExternalAuthProfiles(...)` लागू करें।

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="प्रोवाइडर env-var लुकअप -> setup.providers[].envVars">
    **पुराना** मैनिफ़ेस्ट फ़ील्ड: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`।

    **नया**: उसी env-var लुकअप को मैनिफ़ेस्ट के `setup.providers[].envVars`
    में भी रखें। इससे सेटअप/स्थिति env मेटाडेटा एक ही स्थान पर समेकित होता है
    और केवल env-var लुकअप का उत्तर देने के लिए Plugin रनटाइम बूट करने की आवश्यकता नहीं रहती।

    `providerAuthEnvVars` अब स्वीकार नहीं किया जाता।

  </Accordion>

  <Accordion title="मेमोरी Plugin पंजीकरण -> registerMemoryCapability">
    **पुराना**: तीन अलग-अलग कॉल - `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`।

    **नया**: मेमोरी-स्टेट API पर एक कॉल -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`।

    समान स्लॉट, एकल पंजीकरण कॉल। योगात्मक प्रॉम्प्ट और कॉर्पस सहायक
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    प्रभावित नहीं होते।

  </Accordion>

  <Accordion title="मेमोरी एम्बेडिंग प्रोवाइडर API">
    **पुराना**: `api.registerMemoryEmbeddingProvider(...)` और
    `contracts.memoryEmbeddingProviders`।

    **नया**: `api.registerEmbeddingProvider(...)` और
    `contracts.embeddingProviders`।

    सामान्य एम्बेडिंग प्रोवाइडर अनुबंध मेमोरी के बाहर भी पुनः उपयोग योग्य है और नए
    प्रोवाइडर के लिए समर्थित मार्ग है। मौजूदा प्रोवाइडर के माइग्रेट होने तक
    मेमोरी-विशिष्ट पंजीकरण API को बहिष्कृत संगतता के रूप में जोड़ा रखा गया है।
    Plugin निरीक्षण गैर-बंडल उपयोग को संगतता
    ऋण के रूप में रिपोर्ट करता है।

  </Accordion>

  <Accordion title="रॉ चैनल प्रेषण परिणाम -> OutboundDeliveryResult">
    **पुराना**: `{ ok, messageId, error }` को
    `ChannelSendRawResult` के माध्यम से लौटाएँ और
    `createRawChannelSendResultAdapter(...)` से उसे सामान्यीकृत करें।

    **नया**: `OutboundDeliveryResult` फ़ील्ड लौटाएँ और चैनल को
    `createAttachedChannelResultAdapter(...)` से संलग्न करें। विफल प्रेषण को त्रुटि स्ट्रिंग लौटाने के
    बजाय अपवाद उत्पन्न करना चाहिए। रॉ परिणाम प्रकार अगले plugin-SDK प्रमुख रिलीज़ तक
    उपलब्ध रहेगा।

  </Accordion>

  <Accordion title="सबएजेंट सत्र संदेश प्रकारों के नाम बदले गए">
    `src/plugins/runtime/types.ts` से अभी भी निर्यात किए जाने वाले दो पुराने प्रकार उपनाम:

    | पुराना                           | नया                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    रनटाइम विधि `readSession` को
    `getSessionMessages` के पक्ष में बहिष्कृत किया गया है। समान सिग्नेचर; पुरानी विधि नई विधि
    को कॉल करती है।

  </Accordion>

  <Accordion title="हटाए गए सत्र और ट्रांसक्रिप्ट फ़ाइल API">
    SQLite सत्र/ट्रांसक्रिप्ट परिवर्तन उन Plugin-सामना करने वाले API को हटाता या बहिष्कृत करता है
    जो सक्रिय `sessions.json` स्टोर, JSONL ट्रांसक्रिप्ट पथ, या सत्र फ़ाइलों की सूचियाँ
    उजागर करते थे। रनटाइम plugins को सक्रिय फ़ाइलों को रिज़ॉल्व या परिवर्तित करने के बजाय
    सत्र पहचान और SDK रनटाइम सहायकों का उपयोग करना चाहिए।

    | माइग्रेट की जा रही सतह | प्रतिस्थापन |
    | ----------------- | ----------- |
    | बहिष्कृत `loadSessionStore(...)`, `updateSessionStore(...)`, और `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`, `listSessionEntries(...)`, और पंक्ति-स्तरीय सत्र परिवर्तन। |
    | बहिष्कृत `resolveSessionFilePath(...)` | सत्र पहचान (`sessionKey`, `sessionId`, और SDK रनटाइम लक्ष्य सहायक) तथा वर्तमान सत्र पर कार्य करने वाली Gateway विधियाँ। |
    | हटाया गया `saveSessionStore(...)` | Gateway-स्वामित्व वाले सत्र रनटाइम API; Plugin कोड को सक्रिय स्टोर फ़ाइल लिखने के बजाय दस्तावेज़ीकृत रनटाइम/संदर्भ सहायकों के माध्यम से सत्र स्थिति का अनुरोध या परिवर्तन करना चाहिए। |
    | हटाए गए `resolveSessionTranscriptPathInDir(...)` और `resolveAndPersistSessionFile(...)` | सत्र पहचान और वर्तमान सत्र पर कार्य करने वाली Gateway विधियाँ। |
    | `readLatestAssistantTextFromSessionTranscript(...)` | वर्तमान रनटाइम संदर्भ द्वारा उपलब्ध कराए गए पहचान-समर्थित ट्रांसक्रिप्ट रीडर, या जब Plugin ट्रांसक्रिप्ट स्वामी पथ के बाहर हो तब Gateway इतिहास/सत्र विधियाँ। |
    | `SessionTranscriptUpdate.sessionFile` | `agentId`, `sessionKey`, और `sessionId` के साथ `SessionTranscriptUpdate.target`। |
    | `sessionFiles` जैसे मेमोरी सिंक इनपुट | होस्ट द्वारा प्रदान किए गए पहचान-समर्थित ट्रांसक्रिप्ट/सत्र स्रोत; लाइव सत्रों के लिए सक्रिय JSONL फ़ाइलों को क्रॉल न करें। |
    | सक्रिय सत्रों के लिए `transcriptPath` या `sessionFile` नामक रनटाइम विकल्प | स्टोरेज-निरपेक्ष सत्र पहचान रखने वाले `sessionTarget`/रनटाइम लक्ष्य ऑब्जेक्ट। |

    पुरानी JSONL ट्रांसक्रिप्ट फ़ाइलें आयात, संग्रह, निर्यात और
    सहायता आर्टिफ़ैक्ट के रूप में मान्य रहेंगी। वे अब सक्रिय सत्रों के लिए
    स्थिर-अवस्था रनटाइम अनुबंध नहीं हैं।

    `v2026.7.1-beta.5` के साथ रिलीज़ किए गए आधिकारिक plugins ने ऊपर दिए गए चार
    बहिष्कृत सहायकों को आयात किया था। `openclaw/plugin-sdk/session-store-runtime`
    उस सटीक ब्रिज को 2026-10-12 तक बनाए रखता है; नए plugins को प्रतिस्थापनों का उपयोग करना अनिवार्य है।
    `resolveStorePath(...)` एक समर्थित SDK सहायक बना हुआ है और इस
    बहिष्करण का भाग नहीं है।

    `openclaw plugins inspect --all --runtime` उन गैर-बंडल plugins की रिपोर्ट करता है जिनकी
    लोड त्रुटियाँ या निदान अभी भी इन हटाए गए फ़ाइल API का संदर्भ देते हैं।
    `@openclaw/plugin-inspector` परामर्श स्वीप को `0.3.17` या
    इससे नए संस्करण का उपयोग करना अनिवार्य है, ताकि बाहरी पैकेज स्कैन रिलीज़ से पहले संपूर्ण-स्टोर सत्र सहायकों,
    सत्र फ़ाइल-पथ सहायकों, पुराने ट्रांसक्रिप्ट फ़ाइल लक्ष्यों और निम्न-स्तरीय
    ट्रांसक्रिप्ट सहायकों को भी चिह्नित करें।

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **पुराना**: `runtime.tasks.flow` (एकवचन) एक लाइव TaskFlow
    एक्सेसर लौटाता था।

    **नया**: `runtime.tasks.managedFlows` उन plugins के लिए प्रबंधित TaskFlow परिवर्तन
    रनटाइम बनाए रखता है जो किसी प्रवाह से चाइल्ड टास्क बनाते, अपडेट करते, रद्द करते या चलाते हैं।
    जब Plugin को केवल DTO-आधारित रीड की आवश्यकता हो, तब `runtime.tasks.flows` का उपयोग करें।

    ```typescript
    // पहले
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // बाद में
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    पुराने उपनाम जुलाई 2026 में हटा दिए गए थे।

  </Accordion>

  <Accordion title="एम्बेडेड एक्सटेंशन फ़ैक्टरियाँ -> एजेंट टूल-परिणाम मिडलवेयर">
    इसे ऊपर [माइग्रेट करने का तरीका](#how-to-migrate) में शामिल किया गया है। पूर्णता के लिए
    यहाँ भी शामिल है: हटाए गए, केवल एम्बेडेड-रनर वाले
    `api.registerEmbeddedExtensionFactory(...)` पथ को `contracts.agentToolResultMiddleware` में स्पष्ट रनटाइम सूची वाले
    `api.registerAgentToolResultMiddleware(...)` से प्रतिस्थापित किया गया है।
  </Accordion>

  <Accordion title="OpenClawSchemaType उपनाम -> OpenClawConfig">
    `OpenClawSchemaType` रूट-SDK उपनाम हटा दिया गया है। कैनोनिकल
    `OpenClawConfig` नाम का उपयोग करें।

    ```typescript
    // पहले
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // बाद में
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
एक्सटेंशन-स्तरीय बहिष्करण (`extensions/` के अंतर्गत बंडल किए गए चैनल/प्रोवाइडर plugins के भीतर)
उनके अपने `api.ts` और `runtime-api.ts`
बैरल में ट्रैक किए जाते हैं। वे तृतीय-पक्ष Plugin अनुबंधों को प्रभावित नहीं करते और यहाँ
सूचीबद्ध नहीं हैं। यदि आप किसी बंडल Plugin के स्थानीय बैरल का सीधे उपयोग करते हैं, तो
अपग्रेड करने से पहले उस बैरल में बहिष्करण टिप्पणियाँ पढ़ें।
</Note>

## Talk और रीयलटाइम वॉइस माइग्रेशन

रीयलटाइम वॉइस, टेलीफ़ोनी, मीटिंग और ब्राउज़र Talk कोड `openclaw/plugin-sdk/realtime-voice` द्वारा निर्यात किए गए एक Talk
सत्र नियंत्रक को साझा करता है।
नियंत्रक सामान्य Talk इवेंट एनवेलप, सक्रिय टर्न स्थिति, कैप्चर
स्थिति, आउटपुट-ऑडियो स्थिति, हाल का इवेंट इतिहास और पुराने-टर्न की अस्वीकृति का स्वामी है।
प्रोवाइडर plugins विक्रेता-विशिष्ट रीयलटाइम सत्रों के स्वामी हैं। ब्राउज़र-मीटिंग plugins
सत्र, ब्राउज़र, ऑडियो, Node-होस्ट,
एजेंट-परामर्श और वॉइस-कॉल यांत्रिकी के लिए `openclaw/plugin-sdk/meeting-runtime` का उपयोग करते हैं, फिर URL नियमों,
DOM स्क्रिप्ट, मैन्युअल-क्रिया मैपिंग, कैप्शन, निर्माण और डायल-इन
योजनाओं के लिए `MeetingPlatformAdapter` लागू करते हैं। प्लेटफ़ॉर्म REST API, OAuth, आर्टिफ़ैक्ट,
सेलेक्टर और वायर नाम Plugin में बने रहते हैं। ब्राउज़र अनुमति योजनाओं को अनुरोधित मीटिंग URL मिलता है,
ताकि प्रत्येक प्लेटफ़ॉर्म केवल अपने सटीक समर्थित ओरिजिन की अनुमति दे सके। पुष्टि किए गए ब्राउज़र प्रस्थान के बाद
सत्र रनटाइम को प्लेटफ़ॉर्म-विशिष्ट लाइव स्वास्थ्य भी सामान्यीकृत करना अनिवार्य है;
ऐतिहासिक ट्रांसक्रिप्ट फ़ील्ड बने रह सकते हैं, लेकिन छोड़ने के बाद कैप्शन और ऑडियो तत्परता
सक्रिय नहीं रहनी चाहिए।

सभी बंडल सतहें साझा नियंत्रक पर चलती हैं: ब्राउज़र रिले,
प्रबंधित-रूम हैंडऑफ़, वॉइस-कॉल रीयलटाइम, वॉइस-कॉल स्ट्रीमिंग STT, Google
Meet रीयलटाइम और नेटिव पुश-टू-टॉक। Gateway `hello-ok.features.events` में एक लाइव Talk इवेंट
चैनल की घोषणा करता है: `talk.event`।

नए कोड को `createTalkEventSequencer(...)` को सीधे कॉल नहीं करना चाहिए, जब तक कि
वह निम्न-स्तरीय एडाप्टर या परीक्षण फ़िक्स्चर लागू न कर रहा हो। साझा नियंत्रक का उपयोग करें, ताकि
टर्न-स्कोप वाले इवेंट टर्न id के बिना उत्सर्जित न हो सकें, पुराने `turnEnd` /
`turnCancel` कॉल किसी नए सक्रिय टर्न को साफ़ न कर सकें, और आउटपुट-ऑडियो
जीवनचक्र इवेंट टेलीफ़ोनी, मीटिंग, ब्राउज़र रिले,
प्रबंधित-रूम हैंडऑफ़ और नेटिव Talk क्लाइंट में सुसंगत रहें।

सार्वजनिक API स्वरूप:

```typescript
// Gateway के स्वामित्व वाला Talk सत्र API।
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// क्लाइंट के स्वामित्व वाला प्रोवाइडर सत्र API।
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ब्राउज़र-स्वामित्व वाले WebRTC/प्रोवाइडर-वेबसॉकेट सत्र `talk.client.create` का उपयोग करते हैं,
क्योंकि ब्राउज़र प्रोवाइडर नेगोशिएशन और मीडिया ट्रांसपोर्ट का स्वामी होता है, जबकि
Gateway क्रेडेंशियल, निर्देशों और टूल नीति का स्वामी होता है। `talk.session.*`,
gateway-relay रीयलटाइम, gateway-relay ट्रांसक्रिप्शन और प्रबंधित-रूम नेटिव STT/TTS सत्रों के लिए
सामान्य Gateway-प्रबंधित सतह है।

`talk.provider` /
`talk.providers` के पास रीयलटाइम सेलेक्टर रखने वाले पुराने कॉन्फ़िगरेशन को `openclaw doctor --fix` से सुधारना चाहिए;
रनटाइम Talk स्पीच/TTS प्रोवाइडर कॉन्फ़िगरेशन को रीयलटाइम प्रोवाइडर कॉन्फ़िगरेशन के रूप में पुनर्व्याख्यायित नहीं करता।

समर्थित `talk.session.create` संयोजन जानबूझकर सीमित रखे गए हैं:

| मोड            | ट्रांसपोर्ट       | ब्रेन           | स्वामी              | टिप्पणियाँ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway के माध्यम से ब्रिज किया गया पूर्ण-डुप्लेक्स प्रदाता ऑडियो; टूल कॉल agent-consult टूल के माध्यम से रूट होते हैं।           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | केवल स्ट्रीमिंग STT; कॉलर इनपुट ऑडियो भेजते हैं और ट्रांसक्रिप्ट इवेंट प्राप्त करते हैं।                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | नेटिव/क्लाइंट रूम | पुश-टू-टॉक और वॉकी-टॉकी शैली के रूम, जहाँ क्लाइंट कैप्चर/प्लेबैक का स्वामी होता है और Gateway टर्न स्थिति का स्वामी होता है। |
| `stt-tts`       | `managed-room`  | `direct-tools`  | नेटिव/क्लाइंट रूम | विश्वसनीय प्रथम-पक्षीय सतहों के लिए केवल-एडमिन रूम मोड, जो Gateway टूल कार्रवाइयों को सीधे निष्पादित करती हैं।                  |

पुराने `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` परिवारों (सभी हटाए जा चुके हैं) से माइग्रेट करने वाले पाठकों के लिए मेथड मैप:

| पुराना                              | नया                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` या `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

एकीकृत नियंत्रण शब्दावली भी जानबूझकर सीमित रखी गई है:

| मेथड                          | इस पर लागू                                              | अनुबंध                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | उसी Gateway कनेक्शन के स्वामित्व वाले प्रदाता सत्र में base64 PCM ऑडियो खंड जोड़ें।                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | प्रबंधित-रूम उपयोगकर्ता टर्न शुरू करें।                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | पुराने टर्न के सत्यापन के बाद सक्रिय टर्न समाप्त करें।                                                                                                                                                                          |
| `talk.session.cancelTurn`       | Gateway के स्वामित्व वाले सभी सत्र                              | किसी टर्न के लिए सक्रिय कैप्चर/प्रदाता/एजेंट/TTS कार्य रद्द करें।                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | उपयोगकर्ता टर्न को आवश्यक रूप से समाप्त किए बिना सहायक ऑडियो आउटपुट रोकें।                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | उसके ब्रिज द्वारा उजागर किसी भी असिंक्रोनस पूर्णता के बाद प्रदाता टूल कॉल पूर्ण करें; अंतरिम आउटपुट के लिए `options.willContinue` पास करें या, समर्थित होने पर, एक और सहायक प्रतिक्रिया से बचने के लिए `options.suppressResponse` पास करें। |
| `talk.session.steer`            | एजेंट-समर्थित Talk सत्र                              | Talk सत्र से रिज़ॉल्व किए गए सक्रिय एम्बेडेड रन को उच्चारित `status`, `steer`, `cancel`, या `followup` नियंत्रण भेजें।                                                                                                 |
| `talk.session.close`            | सभी एकीकृत सत्र                                    | रिले सत्र रोकें या प्रबंधित-रूम स्थिति निरस्त करें, फिर एकीकृत सत्र आईडी भुला दें।                                                                                                                                     |

इसे कार्यशील बनाने के लिए कोर में प्रदाता या प्लेटफ़ॉर्म के विशेष मामले न जोड़ें।
Talk सत्र के अर्थ-विज्ञान का स्वामित्व कोर के पास है। प्रदाता plugins विक्रेता सत्र सेटअप के स्वामी हैं।
Voice-call और Google Meet टेलीफ़ोनी/मीटिंग अडैप्टर के स्वामी हैं। ब्राउज़र और नेटिव
ऐप्स डिवाइस कैप्चर/प्लेबैक UX के स्वामी हैं।

## हटाने की समयरेखा

| कब                                        | क्या होता है                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **अभी**                                     | चेतावनी देने में सक्षम अप्रचलित सतहें रनटाइम चेतावनियाँ जारी करती हैं; रिपॉज़िटरी गार्ड कोर और बंडल किए गए plugins से अप्रचलित SDK आयात अस्वीकार करते हैं। |
| **प्रत्येक संगतता रिकॉर्ड की `removeAfter` तिथि** | वह विशिष्ट सतह हटाने योग्य हो जाती है; तिथि बीतने के बाद `pnpm plugins:boundary-report --fail-on-eligible-compat` CI को विफल कर देता है।    |
| **अगली प्रमुख रिलीज़**                      | अब भी माइग्रेट न हुई सभी सतहें हटा दी जाती हैं; उनका अब भी उपयोग करने वाले plugins विफल हो जाएँगे।                                                          |

नीचे दिए गए शेष सार्वजनिक SDK उपपथों में रजिस्ट्री-समर्थित हटाने की अवधियाँ हैं।
30 जुलाई वाली पंक्तियाँ उनके प्रारंभिक, मेंटेनर-अधिकृत स्वीप के बाद हटा दी गई थीं:
अप्रयुक्त उपपथ मिटा दिए गए, पुराने संगतता उपनाम मिटा दिए गए, और
केवल-बंडल मॉड्यूल को निजी-स्थानीय बिल्ड मैपिंग में अवनत कर दिया गया।

| `removeAfter` | स्तर                               | SDK उपपथ                                                                                                                                                           |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | पुराने संगतता अप्रचलन | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | पुराने संगतता अप्रचलन | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

सभी कोर plugins पहले ही माइग्रेट हो चुके हैं। बाहरी plugins को
अगली प्रमुख रिलीज़ से पहले माइग्रेट करना चाहिए। आपका plugin जिन सतहों का उपयोग करता है,
उनके लिए कौन-से संगतता रिकॉर्ड सबसे जल्द देय हैं, यह देखने के लिए `pnpm plugins:boundary-report` चलाएँ।

## चेतावनियों को अस्थायी रूप से दबाना

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

यह एक अस्थायी बचाव मार्ग है, स्थायी समाधान नहीं।

## संबंधित

- [आरंभ करना](/hi/plugins/building-plugins) - अपना पहला plugin बनाएँ
- [SDK अवलोकन](/hi/plugins/sdk-overview) - पूर्ण उपपथ आयात संदर्भ
- [चैनल Plugins](/hi/plugins/sdk-channel-plugins) - चैनल plugins बनाना
- [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins) - प्रदाता plugins बनाना
- [Plugin की आंतरिक संरचना](/hi/plugins/architecture) - आर्किटेक्चर का गहन विवरण
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - मैनिफ़ेस्ट स्कीमा संदर्भ
