---
read_when:
    - आपको OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED चेतावनी दिखाई देती है
    - आपको OPENCLAW_EXTENSION_API_DEPRECATED चेतावनी दिखाई देती है
    - आपने OpenClaw 2026.4.25 से पहले `api.registerEmbeddedExtensionFactory` का उपयोग किया था
    - आप किसी Plugin को आधुनिक Plugin आर्किटेक्चर में अपडेट कर रहे हैं
    - आप एक बाहरी OpenClaw Plugin का रखरखाव करते हैं
sidebarTitle: Migrate to SDK
summary: पुरानी पश्च-संगतता परत से आधुनिक Plugin SDK पर माइग्रेट करें
title: Plugin SDK माइग्रेशन
x-i18n:
    generated_at: "2026-07-19T09:08:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50cd42eb7512d223d7693a9dbc99db27392bf2797e409d096bbcf11c59c1fd2b
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ने व्यापक पश्च-संगतता परत को छोटे, केंद्रित इंपोर्ट से निर्मित आधुनिक Plugin
आर्किटेक्चर से बदल दिया है। यदि आपका Plugin इस
परिवर्तन से पहले का है, तो यह मार्गदर्शिका उसे वर्तमान अनुबंधों पर लाने में सहायता करती है।

## क्या बदला

पहले दो व्यापक रूप से खुले इंपोर्ट सतहों के कारण Plugin एक ही
प्रवेश बिंदु से लगभग किसी भी चीज़ तक पहुँच सकते थे:

- **`openclaw/plugin-sdk/compat`** - नए आर्किटेक्चर के निर्माण के दौरान
  पुराने हुक-आधारित Plugin को कार्यरत रखने के लिए दर्जनों सहायक पुनः निर्यात करता था।
- **`openclaw/plugin-sdk/infra-runtime`** - सिस्टम
  इवेंट, Heartbeat स्थिति, डिलीवरी कतारें, फ़ेच/प्रॉक्सी सहायक, फ़ाइल सहायक,
  अनुमोदन प्रकार और असंबंधित उपयोगिताओं को मिलाने वाला एक व्यापक बैरल।
- **`openclaw/plugin-sdk/config-runtime`** - एक व्यापक कॉन्फ़िगरेशन बैरल, जिसमें
  माइग्रेशन अवधि के दौरान अभी भी अप्रचलित सीधे लोड/राइट सहायक मौजूद थे।
- **`openclaw/extension-api`** - एक ब्रिज, जो Plugin को
  एम्बेडेड एजेंट रनर जैसे होस्ट-पक्षीय सहायकों तक सीधी पहुँच देता था।
- **`api.registerEmbeddedExtensionFactory(...)`** - हटाया जा चुका केवल-एम्बेडेड-रनर
  हुक, जो `tool_result` जैसे एम्बेडेड-रनर इवेंट देखता था। इसके बजाय एजेंट
  टूल-परिणाम मिडलवेयर का उपयोग करें ([एम्बेडेड टूल-परिणाम एक्सटेंशन को
  मिडलवेयर पर माइग्रेट करें](#how-to-migrate) देखें)।

ये सतहें **अप्रचलित** हैं: ये अब भी काम करती हैं, लेकिन नए Plugin को
इनका उपयोग नहीं करना चाहिए, और मौजूदा Plugin को इन्हें हटाने वाली अगली प्रमुख रिलीज़ से
पहले माइग्रेट कर लेना चाहिए। `registerEmbeddedExtensionFactory` पहले ही हटाया जा चुका है;
लेगेसी पंजीकरण अब लोड नहीं होते।

<Warning>
  पश्च-संगतता परत को भविष्य की किसी प्रमुख रिलीज़ में हटा दिया जाएगा।
  इन सतहों से अब भी इंपोर्ट करने वाले Plugin उस समय काम करना बंद कर देंगे।
</Warning>

OpenClaw उसी परिवर्तन में दस्तावेज़ीकृत Plugin व्यवहार को हटाता या उसकी
नई व्याख्या नहीं करता जिसमें उसका प्रतिस्थापन प्रस्तुत किया जाता है। अनुबंध तोड़ने वाले परिवर्तन पहले
संगतता अडैप्टर, निदान, दस्तावेज़ीकरण और अप्रचलन अवधि से गुजरते हैं। यह
SDK इंपोर्ट, मैनिफ़ेस्ट फ़ील्ड, सेटअप API, हुक और रनटाइम
पंजीकरण व्यवहार पर लागू होता है।

### क्यों

- **धीमा स्टार्टअप** - एक सहायक इंपोर्ट करने पर दर्जनों असंबंधित मॉड्यूल लोड होते थे।
- **चक्रीय निर्भरताएँ** - व्यापक पुनः निर्यातों ने इंपोर्ट चक्र बनाना
  आसान कर दिया था।
- **अस्पष्ट API सतह** - स्थिर निर्यातों को आंतरिक निर्यातों से अलग पहचानने का कोई तरीका नहीं था।

प्रत्येक `openclaw/plugin-sdk/<subpath>` अब दस्तावेज़ीकृत अनुबंध वाला एक छोटा,
स्व-निहित मॉड्यूल है।

बंडल किए गए चैनलों के लिए लेगेसी प्रदाता सुविधा सीमाएँ भी हटा दी गई हैं -
चैनल-ब्रांड वाले सहायक शॉर्टकट निजी मोनो-रेपो सुविधाएँ थे, स्थिर
Plugin अनुबंध नहीं। इसके बजाय संकीर्ण सामान्य SDK उपपथों का उपयोग करें। बंडल किए गए
Plugin कार्यक्षेत्र के भीतर, प्रदाता-स्वामित्व वाले सहायकों को उस Plugin के अपने
`api.ts` या `runtime-api.ts` में रखें:

- Anthropic अपने Claude-विशिष्ट स्ट्रीम सहायकों को अपनी `api.ts` /
  `contract-api.ts` सीमा में रखता है।
- OpenAI प्रदाता बिल्डर, डिफ़ॉल्ट-मॉडल सहायक और रीयलटाइम प्रदाता
  बिल्डर अपने `api.ts` में रखता है।
- OpenRouter प्रदाता बिल्डर और ऑनबोर्डिंग/कॉन्फ़िगरेशन सहायक अपने
  `api.ts` में रखता है।

## संगतता नीति

बाहरी Plugin की संगतता का कार्य इस क्रम में होता है:

1. नया अनुबंध जोड़ें।
2. पुराने व्यवहार को संगतता अडैप्टर के माध्यम से जोड़े रखें।
3. पुराने पथ और प्रतिस्थापन का नाम बताने वाला निदान या चेतावनी उत्सर्जित करें।
4. परीक्षणों में दोनों पथों को शामिल करें।
5. अप्रचलन और माइग्रेशन पथ का दस्तावेज़ीकरण करें।
6. घोषित माइग्रेशन अवधि के बाद ही हटाएँ, आमतौर पर किसी प्रमुख
   रिलीज़ में।

यदि कोई मैनिफ़ेस्ट फ़ील्ड अभी भी स्वीकार किया जाता है, तो दस्तावेज़ और
निदान के अन्यथा कहने तक उसका उपयोग जारी रखें। नए कोड को दस्तावेज़ीकृत प्रतिस्थापन को प्राथमिकता देनी चाहिए;
सामान्य लघु रिलीज़ों के दौरान मौजूदा Plugin नहीं टूटने चाहिए।

वर्तमान माइग्रेशन कतार का `pnpm plugins:boundary-report` से ऑडिट करें:

| फ़्लैग                                                    | प्रभाव                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (या `pnpm plugins:boundary-report:summary`) | पूर्ण विवरण के बजाय संक्षिप्त गणनाएँ।                                         |
| `--json`                                                | मशीन-पठनीय रिपोर्ट।                                                       |
| `--owner <id>`                                          | एक Plugin या संगतता स्वामी तक फ़िल्टर करें।                                   |
| `--fail-on-cross-owner`                                 | क्रॉस-ओनर आरक्षित SDK इंपोर्ट होने पर गैर-शून्य स्थिति से बाहर निकलें।                             |
| `--fail-on-eligible-compat`                             | अप्रचलित संगतता रिकॉर्ड की `removeAfter` तारीख बीत जाने पर गैर-शून्य स्थिति से बाहर निकलें। |
| `--fail-on-unclassified-unused-reserved`                | अप्रयुक्त आरक्षित SDK शिम होने पर गैर-शून्य स्थिति से बाहर निकलें।                                    |

`pnpm plugins:boundary-report:ci` तीनों विफलता फ़्लैग के साथ चलता है। प्रत्येक
संगतता रिकॉर्ड की एक स्पष्ट `removeAfter` तारीख होती है (अस्पष्ट "अगली
प्रमुख रिलीज़" नहीं) - रिपोर्ट अप्रचलित रिकॉर्ड को उस तारीख के अनुसार समूहित करती है, स्थानीय
कोड/दस्तावेज़ संदर्भों की गणना करती है, क्रॉस-ओनर आरक्षित SDK इंपोर्ट सामने लाती है और
निजी मेमोरी-होस्ट SDK ब्रिज का सारांश प्रस्तुत करती है। आरक्षित SDK उपपथों के
स्वामी-उपयोग को ट्रैक किया जाना चाहिए; अप्रयुक्त आरक्षित निर्यातों को सार्वजनिक
SDK से हटा दिया जाना चाहिए।

## माइग्रेट करने का तरीका

<Steps>
  <Step title="रनटाइम कॉन्फ़िगरेशन लोड/राइट सहायकों को माइग्रेट करें">
    बंडल किए गए Plugin को सीधे `api.runtime.config.loadConfig()` और
    `api.runtime.config.writeConfigFile(...)` कॉल करना बंद कर देना चाहिए। सक्रिय कॉल पथ में पहले से
    पास किए गए कॉन्फ़िगरेशन को प्राथमिकता दें। वर्तमान प्रक्रिया स्नैपशॉट की आवश्यकता वाले दीर्घकालिक
    हैंडलर `api.runtime.config.current()` का उपयोग कर सकते हैं। दीर्घकालिक
    एजेंट टूल को `execute` के भीतर `ctx.getRuntimeConfig()` पढ़ना चाहिए, ताकि कॉन्फ़िगरेशन राइट से पहले
    बनाया गया टूल भी रीफ़्रेश किया गया कॉन्फ़िगरेशन देख सके।

    कॉन्फ़िगरेशन राइट स्पष्ट राइट-पश्चात नीति वाले ट्रांज़ैक्शनल सहायक से किए जाते हैं:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    जब परिवर्तन के लिए साफ़ Gateway पुनरारंभ आवश्यक हो, तब `afterWrite: { mode: "restart", reason: "..." }` का उपयोग करें,
    और `afterWrite: { mode: "none", reason: "..." }` का उपयोग केवल तब करें
    जब कॉलर अनुवर्ती कार्रवाई का स्वामी हो और जानबूझकर
    रीलोड प्लानर को दबाता हो। म्यूटेशन परिणामों में परीक्षण और लॉगिंग के लिए टाइप किया हुआ `followUp` सारांश शामिल होता है;
    पुनरारंभ लागू करने या शेड्यूल करने की ज़िम्मेदारी Gateway की ही रहती है।

    `loadConfig` और `writeConfigFile` बाहरी Plugin के लिए अप्रचलित संगतता
    सहायक बने हुए हैं और
    `runtime-config-load-write` संगतता कोड के साथ एक बार चेतावनी देते हैं। बंडल किए गए Plugin और रेपो
    रनटाइम कोड `pnpm check:deprecated-api-usage` और
    `pnpm check:no-runtime-action-load-config` द्वारा संरक्षित हैं: नया उत्पादन Plugin उपयोग
    तुरंत विफल होता है, सीधे कॉन्फ़िगरेशन राइट विफल होते हैं, Gateway सर्वर विधियों को
    अनुरोध रनटाइम स्नैपशॉट का उपयोग करना आवश्यक है, रनटाइम चैनल सेंड/एक्शन/क्लाइंट सहायकों को
    अपनी सीमा से कॉन्फ़िगरेशन प्राप्त करना आवश्यक है और दीर्घकालिक रनटाइम मॉड्यूल
    किसी भी एम्बिएंट `loadConfig()` कॉल की अनुमति नहीं देते।

    नए Plugin कोड को व्यापक `openclaw/plugin-sdk/config-runtime`
    बैरल से बचना चाहिए। कार्य के लिए संकीर्ण उपपथ का उपयोग करें:

    | आवश्यकता | इंपोर्ट |
    | --- | --- |
    | `OpenClawConfig` जैसे कॉन्फ़िगरेशन प्रकार | `openclaw/plugin-sdk/config-contracts` |
    | पहले से लोड किए गए कॉन्फ़िगरेशन के अभिकथन, Plugin-प्रवेश कॉन्फ़िगरेशन लुकअप और कॉन्फ़िगरेशन मर्जिंग | `openclaw/plugin-sdk/plugin-config-runtime` |
    | वर्तमान रनटाइम स्नैपशॉट रीड | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | कॉन्फ़िगरेशन राइट | `openclaw/plugin-sdk/config-mutation` |
    | सत्र स्टोर सहायक | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown तालिका कॉन्फ़िगरेशन | `openclaw/plugin-sdk/markdown-table-runtime` |
    | समूह नीति रनटाइम सहायक | `openclaw/plugin-sdk/runtime-group-policy` |
    | सीक्रेट इनपुट रिज़ॉल्यूशन | `openclaw/plugin-sdk/secret-input-runtime` |
    | मॉडल/सत्र ओवरराइड | `openclaw/plugin-sdk/model-session-runtime` |

    बंडल किए गए Plugin और उनके परीक्षण व्यापक
    बैरल के विरुद्ध स्कैनर-संरक्षित हैं, ताकि इंपोर्ट और मॉक केवल आवश्यक व्यवहार तक सीमित रहें। बाहरी संगतता के लिए
    बैरल अब भी मौजूद है, लेकिन नए कोड को
    उस पर निर्भर नहीं होना चाहिए।

  </Step>

  <Step title="एम्बेडेड टूल-परिणाम एक्सटेंशन को मिडलवेयर पर माइग्रेट करें">
    बंडल किए गए Plugin को केवल-एम्बेडेड-रनर
    `api.registerEmbeddedExtensionFactory(...)` टूल-परिणाम हैंडलर को
    रनटाइम-निरपेक्ष मिडलवेयर से बदलना आवश्यक है:

    ```typescript
    // OpenClaw रनटाइम टूल और Codex रनटाइम डायनेमिक टूल (परिणाम को
    // रूपांतरित किया जा सकता है)। Codex-नेटिव टूल परिणाम भी अवलोकन के लिए रिले किए जाते हैं,
    // लेकिन उनका रूपांतरित आउटपुट कभी मॉडल तक नहीं पहुँचता: Codex
    // PostToolUse हुक अनुबंध नेटिव टूल प्रतिक्रिया को प्रतिस्थापित नहीं कर सकता।
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

    स्पष्ट रूप से सक्षम होने और प्रत्येक लक्षित रनटाइम को
    `contracts.agentToolResultMiddleware` में घोषित किए जाने पर इंस्टॉल किए गए Plugin भी टूल-परिणाम मिडलवेयर
    पंजीकृत कर सकते हैं। अघोषित इंस्टॉल किए गए मिडलवेयर
    पंजीकरण अस्वीकार कर दिए जाते हैं।

  </Step>

  <Step title="अनुमोदन-नेटिव हैंडलर को क्षमता तथ्यों पर माइग्रेट करें">
    अनुमोदन-सक्षम चैनल Plugin नेटिव अनुमोदन व्यवहार को
    `approvalCapability.nativeRuntime` और साझा रनटाइम-संदर्भ
    रजिस्ट्री के माध्यम से प्रस्तुत करते हैं:

    - `approvalCapability.handler.loadRuntime(...)` को
      `approvalCapability.nativeRuntime` से बदलें।
    - अनुमोदन-विशिष्ट प्रमाणीकरण/डिलीवरी को लेगेसी `plugin.auth` /
      `plugin.approvals` वायरिंग से हटाकर `approvalCapability` पर ले जाएँ।
    - `ChannelPlugin.approvals` को सार्वजनिक
      चैनल-Plugin अनुबंध से हटा दिया गया है; डिलीवरी/नेटिव/रेंडर फ़ील्ड को
      `approvalCapability` पर ले जाएँ।
    - `plugin.auth` केवल चैनल लॉगिन/लॉगआउट प्रवाहों के लिए बना हुआ है; कोर अब
      वहाँ अनुमोदन प्रमाणीकरण हुक नहीं पढ़ता।
    - चैनल-स्वामित्व वाली रनटाइम वस्तुओं (क्लाइंट, टोकन, Bolt ऐप)
      को `openclaw/plugin-sdk/channel-runtime-context` के माध्यम से पंजीकृत करें।
    - नेटिव अनुमोदन हैंडलर से Plugin-स्वामित्व वाली रीरूट सूचनाएँ न भेजें;
      वास्तविक डिलीवरी परिणामों से कहीं और रूट किए जाने की सूचनाओं का स्वामी कोर है।
    - `channelRuntime` को `createChannelManager(...)` में पास करते समय एक
      वास्तविक `createPluginRuntime().channel` सतह प्रदान करें - आंशिक स्टब
      अस्वीकार कर दिए जाते हैं।

    वर्तमान अनुमोदन क्षमता लेआउट के लिए [चैनल Plugin](/hi/plugins/sdk-channel-plugins)
    देखें।

  </Step>

  <Step title="Windows रैपर फ़ॉलबैक व्यवहार का ऑडिट करें">
    यदि आपका Plugin `openclaw/plugin-sdk/windows-spawn` का उपयोग करता है, तो अनरिज़ॉल्व्ड Windows
    `.cmd`/`.bat` रैपर अब तब तक बंद होकर विफल होते हैं, जब तक आप स्पष्ट रूप से
    `allowShellFallback: true` पास नहीं करते:

    ```typescript
    // पहले
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // बाद में
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // इसे केवल उन विश्वसनीय संगतता कॉलर के लिए सेट करें जो जानबूझकर
      // शेल-मध्यस्थ फ़ॉलबैक स्वीकार करते हैं।
      allowShellFallback: true,
    });
    ```

    यदि आपका कॉलर जानबूझकर शेल फ़ॉलबैक पर निर्भर नहीं है, तो
    `allowShellFallback` सेट न करें और इसके बजाय उत्पन्न त्रुटि को संभालें।

  </Step>

  <Step title="अप्रचलित इंपोर्ट खोजें">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="केंद्रित इंपोर्ट से बदलें">
    पुरानी सतह का प्रत्येक निर्यात किसी विशिष्ट आधुनिक इंपोर्ट पथ से मैप होता है:

    ```typescript
    // पहले (बहिष्कृत पश्चगामी-संगतता परत)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // बाद में (आधुनिक केंद्रित इंपोर्ट)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    होस्ट-साइड सहायकों के लिए, सीधे इंपोर्ट करने के बजाय इंजेक्ट किए गए Plugin रनटाइम का
    उपयोग करें:

    ```typescript
    // पहले (बहिष्कृत extension-api ब्रिज)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // बाद में (इंजेक्ट किया गया रनटाइम)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    अन्य लीगेसी ब्रिज सहायकों के लिए भी यही पैटर्न अपनाएँ:

    | पुराना इंपोर्ट | आधुनिक समकक्ष |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | सेशन स्टोर सहायक | `api.runtime.agent.session.*` |

  </Step>

  <Step title="व्यापक infra-runtime इंपोर्ट बदलें">
    `openclaw/plugin-sdk/infra-runtime` बाहरी संगतता के लिए अब भी मौजूद है,
    लेकिन नए कोड को वास्तव में आवश्यक केंद्रित सतह इंपोर्ट करनी चाहिए:

    | आवश्यकता | इंपोर्ट |
    | --- | --- |
    | सिस्टम इवेंट क्यू सहायक | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat वेक, इवेंट और दृश्यता सहायक | `openclaw/plugin-sdk/heartbeat-runtime` |
    | लंबित डिलीवरी क्यू निकासी | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | चैनल गतिविधि टेलीमेट्री | `openclaw/plugin-sdk/channel-activity-runtime` |
    | इन-मेमोरी और स्थायी बैकएंड वाली डीडुप कैश | `openclaw/plugin-sdk/dedupe-runtime` |
    | सुरक्षित स्थानीय फ़ाइल/मीडिया पथ सहायक | `openclaw/plugin-sdk/file-access-runtime` |
    | डिस्पैचर-जागरूक फ़ेच | `openclaw/plugin-sdk/runtime-fetch` |
    | प्रॉक्सी और संरक्षित फ़ेच सहायक | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF डिस्पैचर नीति प्रकार | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | अनुमोदन अनुरोध/समाधान प्रकार | `openclaw/plugin-sdk/approval-runtime` |
    | अनुमोदन उत्तर पेलोड और कमांड सहायक | `openclaw/plugin-sdk/approval-reply-runtime` |
    | त्रुटि फ़ॉर्मेटिंग सहायक | `openclaw/plugin-sdk/error-runtime` |
    | ट्रांसपोर्ट तत्परता प्रतीक्षा | `openclaw/plugin-sdk/transport-ready-runtime` |
    | सुरक्षित टोकन सहायक | `openclaw/plugin-sdk/secure-random-runtime` |
    | सीमित एसिंक्रोनस कार्य समवर्तिता | `openclaw/plugin-sdk/concurrency-runtime` |
    | सिद्ध किए जा सकने वाले अपरिवर्तनीय नियमों के लिए आवश्यक-मान अभिकथन | `openclaw/plugin-sdk/expect-runtime` |
    | संख्यात्मक कोअर्शन | `openclaw/plugin-sdk/number-runtime` |
    | प्रोसेस-स्थानीय एसिंक्रोनस लॉक | `openclaw/plugin-sdk/async-lock-runtime` |
    | फ़ाइल लॉक | `openclaw/plugin-sdk/file-lock` |

    बंडल किए गए plugins को `infra-runtime` के विरुद्ध स्कैनर से सुरक्षित किया गया है,
    इसलिए रेपो कोड व्यापक बैरल पर वापस नहीं जा सकता।

  </Step>

  <Step title="चैनल रूट सहायकों को माइग्रेट करें">
    नया चैनल रूट कोड `openclaw/plugin-sdk/channel-route` का उपयोग करता है। पुराने
    रूट-की नाम संगतता उपनामों के रूप में बने हुए हैं:

    | पुराना सहायक | आधुनिक सहायक |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    आधुनिक रूट सहायक नेटिव अनुमोदनों, उत्तर दमन, इनबाउंड डीडुप,
    Cron डिलीवरी और सेशन रूटिंग में `{ channel, to, accountId, threadId }` को
    सुसंगत रूप से सामान्यीकृत करते हैं।

    `plugin-sdk/channel-route` से `ChannelMessagingAdapter.parseExplicitTarget` या
    `resolveChannelRouteTargetWithParser(...)` के नए उपयोग न जोड़ें—वे बहिष्कृत हैं और केवल पुराने
    plugins के लिए बने हुए हैं। नए चैनल plugins को लक्ष्य-आईडी सामान्यीकरण
    और डायरेक्टरी-मिस फ़ॉलबैक के लिए
    `messaging.targetResolver.resolveTarget(...)`,
    कोर को प्रारंभिक पीयर प्रकार की आवश्यकता होने पर `messaging.inferTargetChatType(...)`,
    और प्रदाता-नेटिव सेशन तथा थ्रेड पहचान के लिए
    `messaging.resolveOutboundSessionRoute(...)` का उपयोग करना चाहिए।

  </Step>

  <Step title="बिल्ड और परीक्षण करें">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## इंपोर्ट पथ संदर्भ

  <Accordion title="Common import path table">
  | आयात पथ | उद्देश्य | प्रमुख निर्यात |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | प्रामाणिक Plugin प्रवेश सहायक | `definePluginEntry` |
  | `plugin-sdk/core` | चैनल प्रवेश परिभाषाओं/बिल्डरों के लिए पुराना समग्र पुनः-निर्यात | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | रूट कॉन्फ़िग स्कीमा निर्यात | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | एकल-प्रदाता प्रवेश सहायक | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | केंद्रित चैनल प्रवेश परिभाषाएँ और बिल्डर | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
  | `plugin-sdk/setup` | साझा सेटअप विज़ार्ड सहायक | सेटअप अनुवादक, अनुमति-सूची प्रॉम्प्ट, सेटअप स्थिति बिल्डर |
  | `plugin-sdk/setup-runtime` | सेटअप-समय रनटाइम सहायक | `createSetupTranslator`, आयात-सुरक्षित सेटअप पैच अडैप्टर, लुकअप-नोट सहायक, `promptResolvedAllowFrom`, `splitSetupEntries`, प्रत्यायोजित सेटअप प्रॉक्सी |
  | `plugin-sdk/setup-adapter-runtime` | अप्रचलित सेटअप अडैप्टर उपनाम | `plugin-sdk/setup-runtime` का उपयोग करें |
  | `plugin-sdk/setup-tools` | सेटअप टूलिंग सहायक | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | बहु-खाता सहायक | खाता सूची/कॉन्फ़िग/कार्रवाई-गेट सहायक |
  | `plugin-sdk/account-id` | खाता-ID सहायक | `DEFAULT_ACCOUNT_ID`, खाता-ID सामान्यीकरण |
  | `plugin-sdk/account-resolution` | खाता लुकअप सहायक | खाता लुकअप + डिफ़ॉल्ट-फ़ॉलबैक सहायक |
  | `plugin-sdk/account-helpers` | सीमित खाता सहायक | खाता सूची/खाता-कार्रवाई सहायक |
  | `plugin-sdk/channel-setup` | सेटअप विज़ार्ड अडैप्टर | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, साथ ही `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM पेयरिंग के मूल घटक | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | उत्तर उपसर्ग, टाइपिंग और स्रोत-वितरण वायरिंग | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | कॉन्फ़िग अडैप्टर फ़ैक्टरियाँ और DM अभिगम सहायक | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | कॉन्फ़िग स्कीमा बिल्डर | केवल साझा चैनल कॉन्फ़िग स्कीमा के मूल घटक और सामान्य बिल्डर |
  | `plugin-sdk/bundled-channel-config-schema` | बंडल किए गए कॉन्फ़िग स्कीमा | केवल OpenClaw द्वारा अनुरक्षित बंडल किए गए plugins; नए plugins को Plugin-स्थानीय स्कीमा परिभाषित करने होंगे |
  | `plugin-sdk/channel-config-schema-legacy` | अप्रचलित बंडल किए गए कॉन्फ़िग स्कीमा | केवल संगतता उपनाम; अनुरक्षित बंडल किए गए plugins के लिए `plugin-sdk/bundled-channel-config-schema` का उपयोग करें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड कॉन्फ़िग सहायक | कमांड-नाम सामान्यीकरण, विवरण काटना, डुप्लिकेट/टकराव सत्यापन |
  | `plugin-sdk/channel-policy` | समूह/DM नीति समाधान | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/inbound-envelope` | इनबाउंड एनवेलप सहायक | साझा रूट + एनवेलप बिल्डर सहायक |
  | `plugin-sdk/channel-inbound` | इनबाउंड प्राप्ति सहायक | संदर्भ निर्माण, फ़ॉर्मैटिंग, रूट, रनर, तैयार उत्तर डिस्पैच और डिस्पैच प्रेडिकेट |
  | `plugin-sdk/messaging-targets` | अप्रचलित लक्ष्य पार्सिंग आयात पथ | सामान्य लक्ष्य पार्सिंग सहायकों के लिए `plugin-sdk/channel-targets`, रूट तुलना के लिए `plugin-sdk/channel-route`, और प्रदाता-विशिष्ट लक्ष्य समाधान के लिए Plugin-स्वामित्व वाले `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` का उपयोग करें |
  | `plugin-sdk/outbound-media` | आउटबाउंड मीडिया सहायक | साझा आउटबाउंड मीडिया लोडिंग |
  | `plugin-sdk/outbound-send-deps` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/channel-outbound` | आउटबाउंड संदेश जीवनचक्र सहायक | संदेश अडैप्टर, रसीदें, टिकाऊ प्रेषण सहायक, लाइव पूर्वावलोकन/स्ट्रीमिंग सहायक, उत्तर विकल्प, जीवनचक्र सहायक, आउटबाउंड पहचान और पेलोड नियोजन |
  | `plugin-sdk/channel-streaming` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/outbound-runtime` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-outbound` का उपयोग करें |
  | `plugin-sdk/thread-bindings-runtime` | थ्रेड-बाइंडिंग सहायक | थ्रेड-बाइंडिंग जीवनचक्र और अडैप्टर सहायक |
  | `plugin-sdk/agent-media-payload` | पुराने मीडिया पेलोड सहायक | पुराने फ़ील्ड लेआउट के लिए एजेंट मीडिया पेलोड बिल्डर |
  | `plugin-sdk/channel-runtime` | अप्रचलित संगतता शिम | केवल पुराने चैनल रनटाइम उपयोगिताएँ |
  | `plugin-sdk/channel-send-result` | प्रेषण परिणाम प्रकार | उत्तर परिणाम प्रकार |
  | `plugin-sdk/runtime-store` | स्थायी Plugin संग्रहण | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | व्यापक रनटाइम सहायक | रनटाइम/लॉगिंग/बैकअप/Plugin-इंस्टॉल सहायक |
  | `plugin-sdk/runtime-env` | सीमित रनटाइम परिवेश सहायक | लॉगर/रनटाइम परिवेश, टाइमआउट, पुनः प्रयास और बैकऑफ़ सहायक |
  | `plugin-sdk/plugin-runtime` | साझा Plugin रनटाइम सहायक | Plugin कमांड/हुक/http/इंटरैक्टिव सहायक |
  | `plugin-sdk/hook-runtime` | हुक पाइपलाइन सहायक | साझा Webhook/आंतरिक हुक पाइपलाइन सहायक |
  | `plugin-sdk/lazy-runtime` | लेज़ी रनटाइम सहायक | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | प्रक्रिया सहायक | साझा exec सहायक |
  | `plugin-sdk/cli-runtime` | CLI रनटाइम सहायक | कमांड फ़ॉर्मैटिंग, प्रतीक्षा, संस्करण सहायक |
  | `plugin-sdk/gateway-runtime` | Gateway सहायक | Gateway क्लाइंट, इवेंट-लूप-तैयार आरंभ सहायक, विज्ञापित LAN होस्ट समाधान और चैनल-स्थिति पैच सहायक |
  | `plugin-sdk/config-runtime` | अप्रचलित कॉन्फ़िग संगतता शिम | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` और `config-mutation` को प्राथमिकता दें |
  | `plugin-sdk/telegram-command-config` | Telegram कमांड सहायक | बंडल किया गया Telegram अनुबंध सरफ़ेस अनुपलब्ध होने पर फ़ॉलबैक-स्थिर Telegram कमांड सत्यापन सहायक |
  | `plugin-sdk/approval-runtime` | अनुमोदन प्रॉम्प्ट सहायक | exec/Plugin अनुमोदन पेलोड, अनुमोदन क्षमता/प्रोफ़ाइल सहायक, मूल अनुमोदन रूटिंग/रनटाइम सहायक और संरचित अनुमोदन प्रदर्शन पथ फ़ॉर्मैटिंग |
  | `plugin-sdk/approval-auth-runtime` | अनुमोदन प्रमाणीकरण सहायक | अनुमोदक समाधान, समान-चैट कार्रवाई प्रमाणीकरण |
  | `plugin-sdk/approval-client-runtime` | अनुमोदन क्लाइंट सहायक | मूल exec अनुमोदन प्रोफ़ाइल/फ़िल्टर सहायक |
  | `plugin-sdk/approval-delivery-runtime` | अनुमोदन वितरण सहायक | मूल अनुमोदन क्षमता/वितरण अडैप्टर |
  | `plugin-sdk/approval-gateway-runtime` | अनुमोदन Gateway सहायक | साझा अनुमोदन Gateway रिज़ॉल्वर |
  | `plugin-sdk/approval-reference-runtime` | अनुमोदन ट्रांसपोर्ट संदर्भ | ट्रांसपोर्ट-सीमित कॉलबैक के लिए नियतात्मक टिकाऊ-लोकेटर सहायक |
  | `plugin-sdk/approval-handler-adapter-runtime` | अनुमोदन अडैप्टर सहायक | हॉट चैनल प्रवेश-बिंदुओं के लिए हल्के मूल अनुमोदन अडैप्टर लोडिंग सहायक |
  | `plugin-sdk/approval-handler-runtime` | अनुमोदन हैंडलर सहायक | व्यापक अनुमोदन हैंडलर रनटाइम सहायक; पर्याप्त होने पर अधिक सीमित अडैप्टर/Gateway सीमों को प्राथमिकता दें |
  | `plugin-sdk/approval-native-runtime` | अनुमोदन लक्ष्य सहायक | मूल अनुमोदन लक्ष्य/खाता बाइंडिंग सहायक |
  | `plugin-sdk/approval-reply-runtime` | अनुमोदन उत्तर सहायक | exec/Plugin अनुमोदन उत्तर पेलोड सहायक |
  | `plugin-sdk/channel-runtime-context` | चैनल रनटाइम-संदर्भ सहायक | सामान्य चैनल रनटाइम-संदर्भ पंजीकरण/प्राप्ति/निगरानी सहायक |
  | `plugin-sdk/security-runtime` | सुरक्षा सहायक | साझा विश्वास, DM गेटिंग, रूट-सीमित फ़ाइल/पथ सहायक, बाहरी-सामग्री और सीक्रेट-संग्रह सहायक |
  | `plugin-sdk/ssrf-policy` | SSRF नीति सहायक | होस्ट अनुमति-सूची और निजी-नेटवर्क नीति सहायक |
  | `plugin-sdk/ssrf-runtime` | SSRF रनटाइम सहायक | पिन किया गया डिस्पैचर, सुरक्षित fetch, SSRF नीति सहायक |
  | `plugin-sdk/system-event-runtime` | सिस्टम इवेंट सहायक | `enqueueSystemEvent` (कुंजीबद्ध प्रतिस्थापन सहित), `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat सहायक | Heartbeat सक्रियण, इवेंट और दृश्यता सहायक |
  | `plugin-sdk/delivery-queue-runtime` | वितरण कतार सहायक | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | चैनल गतिविधि सहायक | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | डुप्लिकेट-निवारण सहायक | इन-मेमोरी और स्थायी-बैक्ड डुप्लिकेट-निवारण कैश |
  | `plugin-sdk/file-access-runtime` | फ़ाइल अभिगम सहायक | सुरक्षित स्थानीय-फ़ाइल/मीडिया पथ सहायक |
  | `plugin-sdk/transport-ready-runtime` | ट्रांसपोर्ट तत्परता सहायक | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | exec अनुमोदन नीति सहायक | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | सीमित कैश सहायक | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | डायग्नोस्टिक गेटिंग सहायक | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | त्रुटि सहायक | `formatUncaughtError`, `isApprovalNotFoundError`, त्रुटि ग्राफ़ सहायक, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | रैप किए गए fetch/प्रॉक्सी सहायक | `resolveFetch`, प्रॉक्सी सहायक, EnvHttpProxyAgent विकल्प सहायक |
  | `plugin-sdk/host-runtime` | होस्ट सामान्यीकरण सहायक | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | पुनः प्रयास सहायक | `RetryConfig`, `retryAsync`, नीति रनर |
  | `plugin-sdk/allow-from` | अनुमति-सूची फ़ॉर्मैटिंग और इनपुट मैपिंग | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | कमांड गेटिंग और कमांड-सरफ़ेस सहायक | `resolveControlCommandGate`, प्रेषक-प्राधिकरण सहायक, डायनेमिक आर्ग्युमेंट मेनू फ़ॉर्मैटिंग सहित कमांड रजिस्ट्री सहायक |
  | `plugin-sdk/command-status` | कमांड स्थिति/सहायता रेंडरर | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | सीक्रेट इनपुट पार्सिंग | सीक्रेट इनपुट सहायक |
  | `plugin-sdk/webhook-ingress` | Webhook अनुरोध सहायक | Webhook लक्ष्य उपयोगिताएँ |
  | `plugin-sdk/webhook-request-guards` | Webhook बॉडी गार्ड सहायक | अनुरोध बॉडी पढ़ने/सीमित करने के सहायक |
  | `plugin-sdk/reply-runtime` | साझा उत्तर रनटाइम | इनबाउंड डिस्पैच, Heartbeat, उत्तर नियोजक, खंडन |
  | `plugin-sdk/reply-dispatch-runtime` | सीमित उत्तर डिस्पैच सहायक | अंतिम रूप देना, प्रदाता डिस्पैच और वार्तालाप-लेबल सहायक |
  | `plugin-sdk/reply-history` | उत्तर-इतिहास सहायक | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` और `clearHistoryEntriesIfEnabled` जैसे अप्रचलित मैप-सहायक संगतता निर्यात |
  | `plugin-sdk/reply-reference` | उत्तर संदर्भ नियोजन | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | उत्तर खंड सहायक | टेक्स्ट/मार्कडाउन खंडन सहायक |
  | `plugin-sdk/session-store-runtime` | सत्र स्टोर सहायक | स्कोप किए गए सत्र पंक्ति सहायक, स्टोर पथ सहायक और updated-at रीड |
  | `plugin-sdk/state-paths` | स्थिति पथ सहायक | स्थिति और OAuth डायरेक्टरी सहायक |
  | `plugin-sdk/routing` | रूटिंग/सत्र-कुंजी सहायक | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, सत्र-कुंजी सामान्यीकरण सहायक |
  | `plugin-sdk/status-helpers` | चैनल स्थिति सहायक | चैनल/खाता स्थिति सारांश बिल्डर, रनटाइम-स्थिति डिफ़ॉल्ट, समस्या मेटाडेटा सहायक |
  | `plugin-sdk/target-resolver-runtime` | लक्ष्य रिज़ॉल्वर सहायक | साझा लक्ष्य रिज़ॉल्वर सहायक |
  | `plugin-sdk/string-normalization-runtime` | स्ट्रिंग सामान्यीकरण सहायक | स्लग/स्ट्रिंग सामान्यीकरण सहायक |
  | `plugin-sdk/request-url` | अनुरोध URL सहायक | अनुरोध-जैसे इनपुट से स्ट्रिंग URL निकालें |
  | `plugin-sdk/run-command` | समयबद्ध कमांड सहायक | सामान्यीकृत stdout/stderr वाला समयबद्ध कमांड रनर |
  | `plugin-sdk/param-readers` | पैरामीटर रीडर | सामान्य टूल/CLI पैरामीटर रीडर |
  | `plugin-sdk/tool-payload` | टूल पेलोड निष्कर्षण | टूल परिणाम ऑब्जेक्ट से सामान्यीकृत पेलोड निकालें |
  | `plugin-sdk/tool-send` | टूल प्रेषण निष्कर्षण | टूल आर्ग्युमेंट से प्रामाणिक प्रेषण लक्ष्य फ़ील्ड निकालें |
  | `plugin-sdk/temp-path` | अस्थायी पथ सहायक | साझा अस्थायी-डाउनलोड पथ सहायक |
  | `plugin-sdk/logging-core` | लॉगिंग सहायक | सबसिस्टम लॉगर और रिडैक्शन सहायक |
  | `plugin-sdk/markdown-table-runtime` | मार्कडाउन-तालिका सहायक | मार्कडाउन तालिका मोड सहायक |
  | `plugin-sdk/reply-payload` | संदेश उत्तर प्रकार | उत्तर पेलोड प्रकार |
  | `plugin-sdk/provider-setup` | चयनित स्थानीय/स्व-होस्टेड प्रदाता सेटअप सहायक | स्व-होस्टेड प्रदाता खोज/कॉन्फ़िग सहायक |
  | `plugin-sdk/self-hosted-provider-setup` | केंद्रित OpenAI-संगत स्व-होस्टेड प्रदाता सेटअप सहायक | वही स्व-होस्टेड प्रदाता खोज/कॉन्फ़िग सहायक |
  | `plugin-sdk/provider-auth-runtime` | प्रदाता रनटाइम प्रमाणीकरण सहायक | रनटाइम API-कुंजी समाधान सहायक |
  | `plugin-sdk/provider-auth-api-key` | प्रदाता API-कुंजी सेटअप सहायक | API-कुंजी ऑनबोर्डिंग/प्रोफ़ाइल-लेखन सहायक |
  | `plugin-sdk/provider-auth-result` | प्रदाता प्रमाणीकरण-परिणाम सहायक | मानक OAuth प्रमाणीकरण-परिणाम बिल्डर |
  | `plugin-sdk/provider-selection-runtime` | प्रदाता चयन सहायक | कॉन्फ़िगर-किया-गया-या-स्वचालित प्रदाता चयन और अपरिष्कृत प्रदाता कॉन्फ़िग विलय |
  | `plugin-sdk/provider-env-vars` | प्रदाता परिवेश-चर सहायक | प्रदाता प्रमाणीकरण परिवेश-चर लुकअप सहायक |
  | `plugin-sdk/provider-model-shared` | साझा प्रदाता मॉडल/रीप्ले सहायक | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, साझा रीप्ले-नीति बिल्डर, प्रदाता-एंडपॉइंट सहायक और मॉडल-id सामान्यीकरण सहायक |
  | `plugin-sdk/provider-catalog-shared` | साझा प्रदाता कैटलॉग सहायक | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | प्रदाता ऑनबोर्डिंग पैच | ऑनबोर्डिंग कॉन्फ़िगरेशन सहायक |
  | `plugin-sdk/provider-http` | प्रदाता HTTP सहायक | सामान्य प्रदाता HTTP/एंडपॉइंट क्षमता सहायक, जिनमें ऑडियो ट्रांसक्रिप्शन मल्टीपार्ट फ़ॉर्म सहायक शामिल हैं |
  | `plugin-sdk/provider-web-fetch` | प्रदाता वेब-फ़ेच सहायक | वेब-फ़ेच प्रदाता पंजीकरण/कैश सहायक |
  | `plugin-sdk/provider-web-search-config-contract` | प्रदाता वेब-सर्च कॉन्फ़िगरेशन सहायक | उन प्रदाताओं के लिए सीमित वेब-सर्च कॉन्फ़िगरेशन/क्रेडेंशियल सहायक जिन्हें Plugin-सक्षम वायरिंग की आवश्यकता नहीं है |
  | `plugin-sdk/provider-web-search-contract` | प्रदाता वेब-सर्च अनुबंध सहायक | सीमित वेब-सर्च कॉन्फ़िगरेशन/क्रेडेंशियल अनुबंध सहायक, जैसे `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, और सीमित-स्कोप वाले क्रेडेंशियल सेटर/गेटर |
  | `plugin-sdk/provider-web-search` | प्रदाता वेब-सर्च सहायक | वेब-सर्च प्रदाता पंजीकरण/कैश/रनटाइम सहायक |
  | `plugin-sdk/provider-tools` | प्रदाता टूल/स्कीमा संगतता सहायक | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, और DeepSeek/Gemini/OpenAI स्कीमा क्लीनअप + निदान |
  | `plugin-sdk/provider-usage` | प्रदाता उपयोग सहायक | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, और अन्य प्रदाता उपयोग सहायक |
  | `plugin-sdk/provider-stream` | प्रदाता स्ट्रीम रैपर सहायक | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, स्ट्रीम रैपर प्रकार और साझा Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot रैपर सहायक |
  | `plugin-sdk/provider-transport-runtime` | प्रदाता ट्रांसपोर्ट सहायक | नेटिव प्रदाता ट्रांसपोर्ट सहायक, जैसे सुरक्षित फ़ेच, टूल-परिणाम टेक्स्ट निष्कर्षण, ट्रांसपोर्ट संदेश रूपांतरण और लिखने योग्य ट्रांसपोर्ट इवेंट स्ट्रीम |
  | `plugin-sdk/keyed-async-queue` | क्रमबद्ध एसिंक क्यू | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | साझा मीडिया सहायक | मीडिया फ़ेच/रूपांतरण/संग्रहण सहायक, ffprobe-समर्थित वीडियो आयाम जाँच और मीडिया पेलोड बिल्डर |
  | `plugin-sdk/media-generation-runtime` | साझा मीडिया-जनरेशन सहायक | इमेज/वीडियो/संगीत जनरेशन के लिए साझा फ़ेलओवर सहायक, उम्मीदवार चयन और अनुपलब्ध-मॉडल संदेश |
  | `plugin-sdk/media-understanding` | मीडिया-अंडरस्टैंडिंग सहायक | मीडिया-अंडरस्टैंडिंग प्रदाता प्रकार और प्रदाता-संबंधी इमेज/ऑडियो सहायक एक्सपोर्ट |
  | `plugin-sdk/text-runtime` | अप्रचलित व्यापक टेक्स्ट संगतता एक्सपोर्ट | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, और `logging-core` का उपयोग करें |
  | `plugin-sdk/text-chunking` | टेक्स्ट चंकिंग सहायक | आउटबाउंड टेक्स्ट और ऑफ़सेट-संरक्षित रेंज चंकिंग सहायक |
  | `plugin-sdk/speech` | स्पीच सहायक | स्पीच प्रदाता प्रकार, प्रदाता-संबंधी निर्देश, रजिस्ट्री और सत्यापन सहायक तथा OpenAI-संगत TTS बिल्डर |
  | `plugin-sdk/speech-core` | साझा स्पीच कोर | स्पीच प्रदाता प्रकार, रजिस्ट्री, निर्देश और सामान्यीकरण |
  | `plugin-sdk/speech-settings` | स्पीच सेटिंग्स | प्रदाता रजिस्ट्रियों या सिंथेसिस रनटाइम के बिना हल्के TTS कॉन्फ़िगरेशन समाधान और सामान्यीकरण प्रिमिटिव |
  | `plugin-sdk/realtime-transcription` | रियलटाइम ट्रांसक्रिप्शन सहायक | प्रदाता प्रकार, रजिस्ट्री सहायक और साझा WebSocket सत्र सहायक |
  | `plugin-sdk/realtime-voice` | रियलटाइम वॉइस सहायक | प्रदाता प्रकार, रजिस्ट्री/समाधान सहायक, ब्रिज सत्र सहायक, ट्रांसपोर्ट-स्वतंत्र सत्र हार्नेस, ऑडियो-ऊर्जा/स्पीच-आरंभ गेट, साझा एजेंट टॉक-बैक क्यू, सक्रिय-रन वॉइस नियंत्रण, ट्रांसक्रिप्ट/इवेंट स्वास्थ्य, इको दमन, परामर्श प्रश्न मिलान, बाध्य-परामर्श समन्वय, टर्न-कॉन्टेक्स्ट ट्रैकिंग, आउटपुट गतिविधि ट्रैकिंग और तेज़ कॉन्टेक्स्ट परामर्श सहायक |
  | `plugin-sdk/image-generation` | इमेज-जनरेशन सहायक | इमेज-जनरेशन प्रदाता प्रकार, इमेज एसेट/डेटा URL सहायक और OpenAI-संगत इमेज प्रदाता बिल्डर |
  | `plugin-sdk/image-generation-core` | साझा इमेज-जनरेशन कोर | इमेज-जनरेशन प्रकार, फ़ेलओवर, प्रमाणीकरण और रजिस्ट्री सहायक |
  | `plugin-sdk/music-generation` | संगीत-जनरेशन सहायक | संगीत-जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
  | `plugin-sdk/music-generation-core` | साझा संगीत-जनरेशन कोर | संगीत-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता लुकअप और मॉडल-रेफ़ पार्सिंग |
  | `plugin-sdk/video-generation` | वीडियो-जनरेशन सहायक | वीडियो-जनरेशन प्रदाता/अनुरोध/परिणाम प्रकार |
  | `plugin-sdk/video-generation-core` | साझा वीडियो-जनरेशन कोर | वीडियो-जनरेशन प्रकार, फ़ेलओवर सहायक, प्रदाता लुकअप और मॉडल-रेफ़ पार्सिंग |
  | `plugin-sdk/interactive-runtime` | इंटरैक्टिव उत्तर सहायक | इंटरैक्टिव उत्तर पेलोड सामान्यीकरण/रिडक्शन |
  | `plugin-sdk/channel-config-primitives` | चैनल कॉन्फ़िगरेशन प्रिमिटिव | सीमित चैनल कॉन्फ़िगरेशन-स्कीमा प्रिमिटिव |
  | `plugin-sdk/channel-config-writes` | चैनल कॉन्फ़िगरेशन-लेखन सहायक | चैनल कॉन्फ़िगरेशन-लेखन प्राधिकरण सहायक |
  | `plugin-sdk/channel-plugin-common` | साझा चैनल प्रील्यूड | साझा चैनल Plugin प्रील्यूड एक्सपोर्ट |
  | `plugin-sdk/channel-status` | चैनल स्थिति सहायक | साझा चैनल स्थिति स्नैपशॉट/सारांश सहायक |
  | `plugin-sdk/allowlist-config-edit` | अनुमति-सूची कॉन्फ़िगरेशन सहायक | अनुमति-सूची कॉन्फ़िगरेशन संपादन/पठन सहायक |
  | `plugin-sdk/group-access` | समूह पहुँच सहायक | साझा समूह-पहुँच निर्णय सहायक |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | अप्रचलित संगतता फ़साड | `plugin-sdk/channel-inbound` का उपयोग करें |
  | `plugin-sdk/direct-dm-guard-policy` | प्रत्यक्ष-DM गार्ड सहायक | सीमित प्री-क्रिप्टो गार्ड नीति सहायक |
  | `plugin-sdk/extension-shared` | साझा एक्सटेंशन सहायक | निष्क्रिय-चैनल/स्थिति और एम्बिएंट प्रॉक्सी सहायक प्रिमिटिव |
  | `plugin-sdk/webhook-targets` | Webhook लक्ष्य सहायक | Webhook लक्ष्य रजिस्ट्री और रूट-इंस्टॉल सहायक |
  | `plugin-sdk/webhook-path` | अप्रचलित Webhook पथ उपनाम | `plugin-sdk/webhook-ingress` का उपयोग करें |
  | `plugin-sdk/web-media` | साझा वेब मीडिया सहायक | रिमोट/लोकल मीडिया लोडिंग सहायक |
  | `plugin-sdk/zod` | अप्रचलित Zod संगतता री-एक्सपोर्ट | `zod` को सीधे `zod` से इंपोर्ट करें |
  | `plugin-sdk/memory-core` | बंडल किए गए मेमोरी-कोर सहायक | मेमोरी मैनेजर/कॉन्फ़िगरेशन/फ़ाइल/CLI सहायक सतह |
  | `plugin-sdk/memory-core-engine-runtime` | मेमोरी इंजन रनटाइम फ़साड | मेमोरी इंडेक्स/सर्च रनटाइम फ़साड |
  | `plugin-sdk/memory-core-host-embedding-registry` | मेमोरी एम्बेडिंग रजिस्ट्री | हल्के मेमोरी एम्बेडिंग प्रदाता रजिस्ट्री सहायक |
  | `plugin-sdk/memory-core-host-engine-foundation` | मेमोरी होस्ट आधार इंजन | मेमोरी होस्ट आधार इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-embeddings` | मेमोरी होस्ट एम्बेडिंग इंजन | मेमोरी एम्बेडिंग अनुबंध, रजिस्ट्री पहुँच, लोकल प्रदाता और सामान्य बैच/रिमोट सहायक; विशिष्ट रिमोट प्रदाता उनके स्वामी Plugins में रहते हैं |
  | `plugin-sdk/memory-core-host-engine-qmd` | मेमोरी होस्ट QMD इंजन | मेमोरी होस्ट QMD इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-engine-storage` | मेमोरी होस्ट स्टोरेज इंजन | मेमोरी होस्ट स्टोरेज इंजन एक्सपोर्ट |
  | `plugin-sdk/memory-core-host-multimodal` | मेमोरी होस्ट मल्टीमॉडल सहायक | मेमोरी होस्ट मल्टीमॉडल सहायक |
  | `plugin-sdk/memory-core-host-query` | मेमोरी होस्ट क्वेरी सहायक | मेमोरी होस्ट क्वेरी सहायक |
  | `plugin-sdk/memory-core-host-secret` | मेमोरी होस्ट सीक्रेट सहायक | मेमोरी होस्ट सीक्रेट सहायक |
  | `plugin-sdk/memory-core-host-events` | अप्रचलित मेमोरी इवेंट उपनाम | `plugin-sdk/memory-host-events` का उपयोग करें |
  | `plugin-sdk/memory-core-host-status` | मेमोरी होस्ट स्थिति सहायक | मेमोरी होस्ट स्थिति सहायक |
  | `plugin-sdk/memory-core-host-runtime-cli` | मेमोरी होस्ट CLI रनटाइम | मेमोरी होस्ट CLI रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-core` | मेमोरी होस्ट कोर रनटाइम | मेमोरी होस्ट कोर रनटाइम सहायक |
  | `plugin-sdk/memory-core-host-runtime-files` | मेमोरी होस्ट फ़ाइल/रनटाइम सहायक | मेमोरी होस्ट फ़ाइल/रनटाइम सहायक |
  | `plugin-sdk/memory-host-core` | मेमोरी होस्ट कोर रनटाइम उपनाम | मेमोरी होस्ट कोर रनटाइम सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
  | `plugin-sdk/memory-host-events` | मेमोरी होस्ट इवेंट जर्नल उपनाम | मेमोरी होस्ट इवेंट जर्नल सहायकों के लिए विक्रेता-निरपेक्ष उपनाम |
  | `plugin-sdk/memory-host-files` | अप्रचलित मेमोरी फ़ाइल/रनटाइम उपनाम | `plugin-sdk/memory-core-host-runtime-files` का उपयोग करें |
  | `plugin-sdk/memory-host-markdown` | प्रबंधित Markdown सहायक | मेमोरी-संबंधित Plugins के लिए साझा प्रबंधित-Markdown सहायक |
  | `plugin-sdk/memory-host-search` | Active Memory सर्च फ़साड | आलसी Active Memory सर्च-मैनेजर रनटाइम फ़साड |
  | `plugin-sdk/memory-host-status` | अप्रचलित मेमोरी होस्ट स्थिति उपनाम | `plugin-sdk/memory-core-host-status` का उपयोग करें |
</Accordion>

  यह तालिका सामान्य माइग्रेशन उपसमुच्चय है, पूर्ण SDK सतह नहीं। कंपाइलर
  एंट्रीपॉइंट इन्वेंटरी `scripts/lib/plugin-sdk-entrypoints.json` में है;
  पैकेज एक्सपोर्ट सार्वजनिक उपसमुच्चय से जनरेट किए जाते हैं।

  आरक्षित बंडल किए गए Plugin सहायक सीमों को सार्वजनिक SDK
  एक्सपोर्ट मैप से हटा दिया गया है, सिवाय स्पष्ट रूप से दस्तावेज़ीकृत संगतता फ़साड के, जैसे
  बहिष्कृत `plugin-sdk/discord` शिम, जिसे उन बाहरी plugins के लिए रखा गया है जो अब भी
  प्रकाशित `@openclaw/discord` पैकेज को सीधे इम्पोर्ट करते हैं। स्वामी-विशिष्ट
  सहायक स्वामी Plugin पैकेज के भीतर रहते हैं; साझा होस्ट व्यवहार
  `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime` जैसे सामान्य SDK अनुबंधों से होकर जाता है।

  कार्य से मेल खाने वाला सबसे सीमित इम्पोर्ट उपयोग करें। यदि आपको कोई एक्सपोर्ट नहीं मिलता,
  तो `src/plugin-sdk/` पर स्रोत देखें या अनुरक्षकों से पूछें कि इसका स्वामित्व किस सामान्य
  अनुबंध के पास होना चाहिए।

  ## हटाई गई संगतता सतहें

  ### निजी परीक्षण बैरल

  `openclaw/plugin-sdk/testing` रिपॉज़िटरी-स्थानीय था और जारी किए गए पैकेज
  आर्टिफ़ैक्ट से बाहर रखा गया था, इसलिए इसे इसकी 2026-07-28 `removeAfter` तिथि से पहले हटा दिया गया। रिपॉज़िटरी
  परीक्षण `plugin-sdk/plugin-test-runtime`,
  `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
  `plugin-sdk/test-env`, और `plugin-sdk/test-fixtures` जैसे केंद्रित उपपथों का उपयोग करते हैं।

  ## सक्रिय बहिष्करण

  Plugin SDK, प्रदाता अनुबंध, रनटाइम
  सतह और मैनिफ़ेस्ट में अधिक सीमित बहिष्करण। प्रत्येक आज भी काम करता है, लेकिन भविष्य की किसी
  प्रमुख रिलीज़ में हटा दिया जाएगा। प्रत्येक प्रविष्टि पुराने API को उसके प्रामाणिक प्रतिस्थापन से मैप करती है।

  <AccordionGroup>
  <Accordion title="कमांड-ऑथ सहायता बिल्डर -> कमांड-स्थिति">
    **पुराना (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`।

    **नया (`openclaw/plugin-sdk/command-status`)**: समान सिग्नेचर, समान
    एक्सपोर्ट—बस अधिक सीमित उपपथ से इम्पोर्ट किए गए। `command-auth`
    उन्हें संगतता स्टब के रूप में पुनः एक्सपोर्ट करता है।

    ```typescript
    // पहले
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // बाद में
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="उल्लेख गेटिंग सहायक -> resolveInboundMentionDecision">
    **पुराना**: `resolveMentionGating(params)` और
    `resolveMentionGatingWithBypass(params)`, जो
    `openclaw/plugin-sdk/channel-inbound` या
    `openclaw/plugin-sdk/channel-mention-gating` से हैं।

    **नया**: `resolveInboundMentionDecision({ facts, policy })`—दो अलग-अलग कॉल आकारों के बजाय एक निर्णय
    ऑब्जेक्ट।

    Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp, और Zalo में अपनाया गया। Slack का अपना `app_mention` इवेंट मॉडल
    इस सहायक का उपयोग नहीं करता।

  </Accordion>

  <Accordion title="चैनल रनटाइम शिम और चैनल क्रिया सहायक">
    `openclaw/plugin-sdk/channel-runtime` पुराने
    चैनल plugins के लिए एक संगतता शिम है। इसे नए कोड से इम्पोर्ट न करें;
    रनटाइम ऑब्जेक्ट पंजीकृत करने के लिए
    `openclaw/plugin-sdk/channel-runtime-context` का उपयोग करें।

    `openclaw/plugin-sdk/channel-actions` में `channelActions*` सहायक
    कच्चे "actions" चैनल एक्सपोर्ट के साथ बहिष्कृत हैं। इसके बजाय अर्थपूर्ण
    `presentation` सतह के माध्यम से क्षमताएँ प्रदर्शित करें—चैनल plugins
    यह घोषित करते हैं कि वे क्या रेंडर करते हैं (कार्ड, बटन, चयन), न कि वे किन कच्चे
    क्रिया नामों को स्वीकार करते हैं।

  </Accordion>

  <Accordion title="वेब खोज प्रदाता tool() सहायक -> Plugin पर createTool()">
    **पुराना**: `openclaw/plugin-sdk/provider-web-search` से `tool()` फ़ैक्टरी।

    **नया**: प्रदाता Plugin पर सीधे `createTool(...)` लागू करें।
    टूल रैपर पंजीकृत करने के लिए OpenClaw को अब SDK सहायक की आवश्यकता नहीं है।

  </Accordion>

  <Accordion title="प्लेनटेक्स्ट चैनल एनवेलप -> BodyForAgent">
    **पुराना**: इनबाउंड चैनल संदेशों से एक समतल
    प्लेनटेक्स्ट प्रॉम्प्ट एनवेलप बनाने के लिए `api.runtime.channel.reply.formatInboundEnvelope(...)` (और इनबाउंड संदेश ऑब्जेक्ट पर
    `channelEnvelope` फ़ील्ड)।

    **नया**: `BodyForAgent` और संरचित उपयोगकर्ता-संदर्भ ब्लॉक। चैनल
    plugins रूटिंग मेटाडेटा (थ्रेड, विषय, उत्तर-प्राप्तकर्ता, प्रतिक्रियाएँ) को
    प्रॉम्प्ट स्ट्रिंग में जोड़ने के बजाय टाइप किए गए फ़ील्ड के रूप में संलग्न करते हैं।
    `formatAgentEnvelope(...)` सहायक संश्लेषित
    सहायक-सामना करने वाले एनवेलप के लिए अब भी समर्थित है, लेकिन इनबाउंड प्लेनटेक्स्ट एनवेलप
    हटाए जा रहे हैं।

    प्रभावित क्षेत्र: `inbound_claim`, `message_received`, और कोई भी कस्टम
    चैनल Plugin जिसने पुराने एनवेलप टेक्स्ट को पोस्ट-प्रोसेस किया था।

  </Accordion>

  <Accordion title="deactivate हुक -> gateway_stop">
    **पुराना**: `api.on("deactivate", handler)`।

    **नया**: `api.on("gateway_stop", handler)`। समान शटडाउन क्लीनअप
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

    `deactivate` एक बहिष्कृत संगतता उपनाम के रूप में जुड़ा रहता है, जब तक इसे
    2026-08-16 के बाद हटा नहीं दिया जाता।

  </Accordion>

  <Accordion title="subagent_spawning हुक -> कोर थ्रेड बाइंडिंग">
    **पुराना**: `api.on("subagent_spawning", handler)`, जो
    `threadBindingReady` या `deliveryOrigin` लौटाता है।

    **नया**: कोर को चैनल सत्र-बाइंडिंग एडाप्टर के माध्यम से `thread: true` सबएजेंट बाइंडिंग
    तैयार करने दें। लॉन्च के बाद अवलोकन के लिए केवल `api.on("subagent_spawned", handler)`
    का उपयोग करें।

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

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, और
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` केवल बहिष्कृत
    संगतता सतहों के रूप में बने रहते हैं, जब तक बाहरी plugins माइग्रेट करते हैं; इन्हें
    2026-08-30 के बाद हटा दिया जाएगा।

  </Accordion>

  <Accordion title="प्रदाता खोज प्रकार -> प्रदाता कैटलॉग प्रकार">
    चार खोज प्रकार उपनाम अब कैटलॉग-युग
    प्रकारों के पतले रैपर हैं:

    | पुराना उपनाम                 | नया प्रकार                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    साथ ही पुराना `ProviderCapabilities` स्थिर बैग—प्रदाता plugins को
    स्थिर ऑब्जेक्ट के बजाय `buildReplayPolicy`,
    `normalizeToolSchemas`, और `wrapStreamFn` जैसे स्पष्ट प्रदाता हुक का उपयोग करना चाहिए।

  </Accordion>

  <Accordion title="विचार नीति हुक -> resolveThinkingProfile">
    **पुराना** (`ProviderThinkingPolicy` पर तीन अलग-अलग हुक):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, और
    `resolveDefaultThinkingLevel(ctx)`।

    **नया**: एकल `resolveThinkingProfile(ctx)`, जो
    प्रामाणिक `id`, वैकल्पिक `label`, और
    रैंक की गई स्तर सूची वाला `ProviderThinkingProfile` लौटाता है। OpenClaw पुराने संग्रहीत मानों को प्रोफ़ाइल रैंक के अनुसार
    स्वचालित रूप से डाउनग्रेड करता है।

    संदर्भ में `provider`, `modelId`, वैकल्पिक मर्ज किया गया `reasoning`,
    और वैकल्पिक मर्ज किए गए मॉडल के `compat` तथ्य शामिल हैं। प्रदाता plugins उन
    कैटलॉग तथ्यों का उपयोग मॉडल-विशिष्ट प्रोफ़ाइल केवल तभी प्रदर्शित करने के लिए कर सकते हैं, जब कॉन्फ़िगर किया गया
    अनुरोध अनुबंध इसका समर्थन करता हो।

    तीन के बजाय एक हुक लागू करें। पुराने हुक बहिष्करण अवधि के दौरान
    काम करते रहते हैं, लेकिन प्रोफ़ाइल परिणाम के साथ संयोजित नहीं किए जाते।

  </Accordion>

  <Accordion title="बाहरी प्रमाणीकरण प्रदाता -> contracts.externalAuthProviders">
    **पुराना**: Plugin मैनिफ़ेस्ट में प्रदाता घोषित किए बिना
    बाहरी प्रमाणीकरण हुक लागू करना।

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

  <Accordion title="प्रदाता एनवायरनमेंट-वेरिएबल लुकअप -> setup.providers[].envVars">
    **पुराना** मैनिफ़ेस्ट फ़ील्ड: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`।

    **नया**: उसी एनवायरनमेंट-वेरिएबल लुकअप को मैनिफ़ेस्ट पर `setup.providers[].envVars`
    में प्रतिबिंबित करें। यह सेटअप/स्थिति एनवायरनमेंट मेटाडेटा को एक स्थान पर समेकित करता है
    और केवल एनवायरनमेंट-वेरिएबल लुकअप का उत्तर देने के लिए Plugin रनटाइम बूट करने से बचाता है।

    `providerAuthEnvVars` संगतता एडाप्टर के माध्यम से तब तक समर्थित रहता है,
    जब तक बहिष्करण अवधि समाप्त नहीं हो जाती।

  </Accordion>

  <Accordion title="मेमोरी Plugin पंजीकरण -> registerMemoryCapability">
    **पुराना**: तीन अलग-अलग कॉल—`api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`।

    **नया**: मेमोरी-स्थिति API पर एक कॉल—
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`।

    समान स्लॉट, एकल पंजीकरण कॉल। योगात्मक प्रॉम्प्ट और कॉर्पस सहायक
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    प्रभावित नहीं हैं।

  </Accordion>

  <Accordion title="मेमोरी एम्बेडिंग प्रदाता API">
    **पुराना**: `api.registerMemoryEmbeddingProvider(...)` और
    `contracts.memoryEmbeddingProviders`।

    **नया**: `api.registerEmbeddingProvider(...)` और
    `contracts.embeddingProviders`।

    सामान्य एम्बेडिंग प्रदाता अनुबंध मेमोरी के बाहर भी पुनः उपयोग योग्य है और
    नए प्रदाताओं के लिए समर्थित पथ है। मौजूदा प्रदाताओं के
    माइग्रेट होने तक मेमोरी-विशिष्ट पंजीकरण API बहिष्कृत संगतता के रूप में
    जुड़ा रहता है। Plugin निरीक्षण गैर-बंडल उपयोग को संगतता
    ऋण के रूप में रिपोर्ट करता है।

  </Accordion>

  <Accordion title="कच्चे चैनल प्रेषण परिणाम -> OutboundDeliveryResult">
    **पुराना**: `ChannelSendRawResult` के माध्यम से
    `{ ok, messageId, error }` लौटाएँ और इसे
    `createRawChannelSendResultAdapter(...)` से सामान्यीकृत करें।

    **नया**: `OutboundDeliveryResult` फ़ील्ड लौटाएँ और चैनल को
    `createAttachedChannelResultAdapter(...)` से संलग्न करें। विफल प्रेषण को त्रुटि स्ट्रिंग
    लौटाने के बजाय अपवाद फेंकना चाहिए। कच्चा परिणाम प्रकार अगले
    Plugin-SDK प्रमुख रिलीज़ तक उपलब्ध रहेगा।

  </Accordion>

  <Accordion title="सबएजेंट सत्र संदेश प्रकारों के नाम बदले गए">
    `src/plugins/runtime/types.ts` से अब भी एक्सपोर्ट किए जाने वाले दो पुराने प्रकार उपनाम:

    | पुराना                           | नया                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    रनटाइम विधि `readSession`, `getSessionMessages` के पक्ष में बहिष्कृत है।
    समान सिग्नेचर; पुरानी विधि नई विधि को कॉल करती है।

  </Accordion>

  <Accordion title="हटाए गए सत्र और ट्रांस्क्रिप्ट फ़ाइल API">
    SQLite सत्र/ट्रांस्क्रिप्ट परिवर्तन उन Plugin-सामना करने वाले API को हटाता या बहिष्कृत करता है
    जो सक्रिय `sessions.json` स्टोर, JSONL ट्रांस्क्रिप्ट पथ, या सत्र
    फ़ाइलों की सूचियाँ प्रदर्शित करते थे। रनटाइम plugins को सक्रिय फ़ाइलें रिज़ॉल्व या परिवर्तित करने के बजाय
    सत्र पहचान और SDK रनटाइम सहायकों का उपयोग करना चाहिए।

    | माइग्रेट की जा रही सतह | प्रतिस्थापन |
    | ----------------- | ----------- |
    | बहिष्कृत `loadSessionStore(...)`, `updateSessionStore(...)`, और `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`, `listSessionEntries(...)`, और पंक्ति-स्तरीय सत्र परिवर्तन। |
    | बहिष्कृत `resolveSessionFilePath(...)` | सत्र पहचान (`sessionKey`, `sessionId`, और SDK रनटाइम लक्ष्य सहायक) तथा वर्तमान सत्र पर काम करने वाली Gateway विधियाँ। |
    | हटाया गया `saveSessionStore(...)` | Gateway-स्वामित्व वाले सत्र रनटाइम API; Plugin कोड को सक्रिय स्टोर फ़ाइल में लिखने के बजाय दस्तावेज़ीकृत रनटाइम/संदर्भ सहायकों के माध्यम से सत्र स्थिति का अनुरोध या परिवर्तन करना चाहिए। |
    | हटाए गए `resolveSessionTranscriptPathInDir(...)` और `resolveAndPersistSessionFile(...)` | सत्र पहचान और वर्तमान सत्र पर काम करने वाली Gateway विधियाँ। |
    | `readLatestAssistantTextFromSessionTranscript(...)` | वर्तमान रनटाइम संदर्भ द्वारा प्रदर्शित पहचान-समर्थित ट्रांस्क्रिप्ट रीडर, या जब Plugin ट्रांस्क्रिप्ट स्वामी पथ के बाहर हो तब Gateway इतिहास/सत्र विधियाँ। |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target`, जिसमें `agentId`, `sessionKey`, और `sessionId` हैं। |
    | `sessionFiles` जैसे मेमोरी सिंक इनपुट | होस्ट द्वारा प्रदान किए गए पहचान-समर्थित ट्रांस्क्रिप्ट/सत्र स्रोत; लाइव सत्रों के लिए सक्रिय JSONL फ़ाइलें क्रॉल न करें। |
    | सक्रिय सत्रों के लिए `transcriptPath` या `sessionFile` नाम वाले रनटाइम विकल्प | `sessionTarget`/रनटाइम लक्ष्य ऑब्जेक्ट, जो स्टोरेज-तटस्थ सत्र पहचान वहन करते हैं। |

    पुरानी JSONL ट्रांसक्रिप्ट फ़ाइलें आयात, संग्रह, निर्यात और
    सहायता आर्टिफ़ैक्ट के रूप में मान्य बनी रहती हैं। वे अब सक्रिय सत्रों के लिए
    स्थिर-अवस्था रनटाइम अनुबंध नहीं हैं।

    `v2026.7.1-beta.5` के साथ जारी आधिकारिक plugins ने ऊपर दिए गए चार
    बहिष्कृत सहायकों को आयात किया था। `openclaw/plugin-sdk/session-store-runtime`
    उस सटीक ब्रिज को 2026-10-12 तक बनाए रखता है; नए plugins को प्रतिस्थापनों का उपयोग करना होगा।
    `resolveStorePath(...)` एक समर्थित SDK सहायक बना हुआ है और
    इस बहिष्करण का भाग नहीं है।

    `openclaw plugins inspect --all --runtime` उन गैर-बंडल plugins की रिपोर्ट करता है जिनकी
    लोड त्रुटियाँ या निदान अब भी इन हटाए गए फ़ाइल API का संदर्भ देते हैं।
    `@openclaw/plugin-inspector` परामर्शी जाँच में संस्करण `0.3.17` या
    उससे नया उपयोग करना आवश्यक है, ताकि बाहरी पैकेज स्कैन रिलीज़ से पहले संपूर्ण-स्टोर सत्र सहायकों,
    सत्र फ़ाइल-पथ सहायकों, पुरानी ट्रांसक्रिप्ट फ़ाइल लक्ष्यों और निम्न-स्तरीय
    ट्रांसक्रिप्ट सहायकों को भी चिह्नित करें।

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **पुराना**: `runtime.tasks.flow` (एकवचन) एक लाइव TaskFlow
    अभिगमकर्ता लौटाता था।

    **नया**: `runtime.tasks.managedFlows` उन plugins के लिए प्रबंधित TaskFlow परिवर्तन
    रनटाइम बनाए रखता है जो किसी प्रवाह से चाइल्ड टास्क बनाते, अपडेट करते, रद्द करते या चलाते हैं।
    जब plugin को केवल DTO-आधारित पठन चाहिए, तब `runtime.tasks.flows` का उपयोग करें।

    ```typescript
    // पहले
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // बाद में
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    2026-07-26 के बाद हटा दिया गया।

  </Accordion>

  <Accordion title="एम्बेडेड एक्सटेंशन फ़ैक्ट्रियाँ -> एजेंट टूल-परिणाम मिडलवेयर">
    ऊपर [माइग्रेट करने का तरीका](#how-to-migrate) में वर्णित है। पूर्णता के लिए
    यहाँ भी शामिल है: हटाए गए केवल-एम्बेडेड-रनर
    `api.registerEmbeddedExtensionFactory(...)` पथ को
    `contracts.agentToolResultMiddleware` में स्पष्ट रनटाइम सूची वाले
    `api.registerAgentToolResultMiddleware(...)` से प्रतिस्थापित किया गया है।
  </Accordion>

  <Accordion title="OpenClawSchemaType उपनाम -> OpenClawConfig">
    `openclaw/plugin-sdk` से पुनः निर्यात किया गया `OpenClawSchemaType` अब
    `OpenClawConfig` के लिए एक-पंक्ति का उपनाम है। कैनॉनिकल नाम को प्राथमिकता दें।

    ```typescript
    // पहले
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // बाद में
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
एक्सटेंशन-स्तरीय बहिष्करण (`extensions/` के अंतर्गत बंडल किए गए चैनल/प्रदाता plugins के भीतर)
उनके अपने `api.ts` और `runtime-api.ts`
बैरल में ट्रैक किए जाते हैं। वे तृतीय-पक्ष plugin अनुबंधों को प्रभावित नहीं करते और यहाँ
सूचीबद्ध नहीं हैं। यदि आप किसी बंडल किए गए plugin के स्थानीय बैरल का सीधे उपयोग करते हैं, तो
अपग्रेड करने से पहले उस बैरल में बहिष्करण संबंधी टिप्पणियाँ पढ़ें।
</Note>

## Talk और रीयलटाइम वॉइस माइग्रेशन

रीयलटाइम वॉइस, टेलीफ़ोनी, मीटिंग और ब्राउज़र Talk कोड
`openclaw/plugin-sdk/realtime-voice` द्वारा निर्यात किया गया एक Talk
सत्र नियंत्रक साझा करता है। नियंत्रक सामान्य Talk इवेंट एनवेलप, सक्रिय टर्न स्थिति, कैप्चर
स्थिति, आउटपुट-ऑडियो स्थिति, हाल का इवेंट इतिहास और पुराने टर्न की अस्वीकृति का स्वामी है।
प्रदाता plugins विक्रेता-विशिष्ट रीयलटाइम सत्रों के स्वामी होते हैं। ब्राउज़र-मीटिंग plugins
सत्र, ब्राउज़र, ऑडियो, Node-होस्ट,
एजेंट-परामर्श और वॉइस-कॉल तंत्र के लिए `openclaw/plugin-sdk/meeting-runtime` का उपयोग करते हैं, फिर URL नियमों,
DOM स्क्रिप्ट, मैन्युअल-कार्रवाई मैपिंग, कैप्शन, निर्माण और डायल-इन
योजनाओं के लिए `MeetingPlatformAdapter` लागू करते हैं। प्लेटफ़ॉर्म REST API, OAuth, आर्टिफ़ैक्ट,
चयनकर्ता और वायर नाम plugin में ही रहते हैं। ब्राउज़र अनुमति योजनाओं को अनुरोधित मीटिंग URL
मिलता है, ताकि प्रत्येक प्लेटफ़ॉर्म केवल अपने सटीक समर्थित मूलों को अनुमति दे सके। पुष्टि किए गए
ब्राउज़र प्रस्थान के बाद सत्र रनटाइम को प्लेटफ़ॉर्म-विशिष्ट लाइव स्वास्थ्य भी सामान्यीकृत करना होगा;
ऐतिहासिक ट्रांसक्रिप्ट फ़ील्ड बने रह सकते हैं, लेकिन बाहर निकलने के बाद कैप्शन और ऑडियो तत्परता
सक्रिय नहीं रहनी चाहिए।

सभी बंडल किए गए सरफ़ेस साझा नियंत्रक पर चलते हैं: ब्राउज़र रिले,
प्रबंधित-कक्ष हैंडऑफ़, वॉइस-कॉल रीयलटाइम, वॉइस-कॉल स्ट्रीमिंग STT, Google
Meet रीयलटाइम और नेटिव पुश-टू-टॉक। Gateway `hello-ok.features.events` में एक लाइव Talk इवेंट
चैनल विज्ञापित करता है: `talk.event`।

नए कोड को `createTalkEventSequencer(...)` को सीधे कॉल नहीं करना चाहिए, जब तक कि
वह कोई निम्न-स्तरीय एडाप्टर या परीक्षण फ़िक्स्चर लागू न कर रहा हो। साझा नियंत्रक का उपयोग करें, ताकि
टर्न-स्कोप वाले इवेंट टर्न आईडी के बिना उत्सर्जित न हो सकें, पुराने `turnEnd` /
`turnCancel` कॉल किसी नए सक्रिय टर्न को साफ़ न कर सकें और आउटपुट-ऑडियो
जीवनचक्र इवेंट टेलीफ़ोनी, मीटिंग, ब्राउज़र रिले,
प्रबंधित-कक्ष हैंडऑफ़ और नेटिव Talk क्लाइंट में एकरूप बने रहें।

सार्वजनिक API संरचना:

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

// क्लाइंट के स्वामित्व वाला प्रदाता सत्र API।
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ब्राउज़र के स्वामित्व वाले WebRTC/प्रदाता-वेबसॉकेट सत्र `talk.client.create` का उपयोग करते हैं,
क्योंकि ब्राउज़र प्रदाता नेगोशिएशन और मीडिया ट्रांसपोर्ट का स्वामी होता है, जबकि
Gateway क्रेडेंशियल, निर्देश और टूल नीति का स्वामी होता है। `talk.session.*`
Gateway द्वारा प्रबंधित रीयलटाइम gateway-relay, gateway-relay
ट्रांसक्रिप्शन और प्रबंधित-कक्ष नेटिव STT/TTS सत्रों के लिए सामान्य सरफ़ेस है।

`talk.provider` /
`talk.providers` के साथ रीयलटाइम चयनकर्ता रखने वाले पुराने कॉन्फ़िग को `openclaw doctor --fix` से सुधारा जाना चाहिए;
रनटाइम Talk स्पीच/TTS प्रदाता कॉन्फ़िग को रीयलटाइम प्रदाता कॉन्फ़िग के रूप में पुनः व्याख्यायित नहीं करता।

समर्थित `talk.session.create` संयोजन जानबूझकर सीमित हैं:

| मोड            | ट्रांसपोर्ट       | ब्रेन           | स्वामी              | टिप्पणियाँ                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway के माध्यम से ब्रिज किया गया पूर्ण-डुप्लेक्स प्रदाता ऑडियो; टूल कॉल एजेंट-परामर्श टूल के माध्यम से रूट होते हैं।           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | केवल स्ट्रीमिंग STT; कॉलर इनपुट ऑडियो भेजते हैं और ट्रांसक्रिप्ट इवेंट प्राप्त करते हैं।                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | नेटिव/क्लाइंट कक्ष | पुश-टू-टॉक और वॉकी-टॉकी शैली के कक्ष, जहाँ क्लाइंट कैप्चर/प्लेबैक का और Gateway टर्न स्थिति का स्वामी होता है। |
| `stt-tts`       | `managed-room`  | `direct-tools`  | नेटिव/क्लाइंट कक्ष | विश्वसनीय प्रथम-पक्ष सरफ़ेस के लिए केवल-एडमिन कक्ष मोड, जो Gateway टूल कार्रवाइयाँ सीधे निष्पादित करते हैं।                  |

पुराने `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` परिवारों (सभी हटाए जा चुके हैं) से माइग्रेट करने वाले पाठकों के लिए विधि मैप:

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

एकीकृत नियंत्रण शब्दावली भी जानबूझकर सीमित है:

| विधि                          | इन पर लागू                                              | अनुबंध                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | उसी Gateway कनेक्शन के स्वामित्व वाले प्रदाता सत्र में base64 PCM ऑडियो खंड जोड़ें।                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | प्रबंधित-कक्ष उपयोगकर्ता टर्न शुरू करें।                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | पुराने टर्न के सत्यापन के बाद सक्रिय टर्न समाप्त करें।                                                                                                                                                                          |
| `talk.session.cancelTurn`       | Gateway के स्वामित्व वाले सभी सत्र                              | किसी टर्न के लिए सक्रिय कैप्चर/प्रदाता/एजेंट/TTS कार्य रद्द करें।                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | उपयोगकर्ता टर्न को अनिवार्य रूप से समाप्त किए बिना सहायक का ऑडियो आउटपुट रोकें।                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | उसके ब्रिज द्वारा प्रदर्शित किसी भी एसिंक्रोनस पूर्णता के बाद प्रदाता टूल कॉल पूर्ण करें; अंतरिम आउटपुट के लिए `options.willContinue` या, समर्थित होने पर, किसी अन्य सहायक प्रतिक्रिया से बचने के लिए `options.suppressResponse` पास करें। |
| `talk.session.steer`            | एजेंट-समर्थित Talk सत्र                              | Talk सत्र से समाधान किए गए सक्रिय एम्बेडेड रन को बोले गए `status`, `steer`, `cancel` या `followup` नियंत्रण भेजें।                                                                                                 |
| `talk.session.close`            | सभी एकीकृत सत्र                                    | रिले सत्र रोकें या प्रबंधित-कक्ष स्थिति निरस्त करें, फिर एकीकृत सत्र आईडी भूल जाएँ।                                                                                                                                     |

इसे कार्यशील बनाने के लिए कोर में प्रदाता या प्लेटफ़ॉर्म के विशेष मामले न जोड़ें।
कोर Talk सत्र के अर्थ-विज्ञान का स्वामी है। प्रदाता plugins विक्रेता सत्र सेटअप के स्वामी हैं।
वॉइस-कॉल और Google Meet टेलीफ़ोनी/मीटिंग अडैप्टर के स्वामी हैं। ब्राउज़र और नेटिव
ऐप्स डिवाइस कैप्चर/प्लेबैक UX के स्वामी हैं।

## हटाने की समयरेखा

| कब                                        | क्या होता है                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **अभी**                                     | चेतावनी-सक्षम अप्रचलित सतहें रनटाइम चेतावनियाँ जारी करती हैं; रिपॉज़िटरी गार्ड कोर और बंडल किए गए plugins से अप्रचलित SDK इम्पोर्ट अस्वीकार करते हैं। |
| **प्रत्येक संगतता रिकॉर्ड की `removeAfter` तिथि** | वह विशिष्ट सतह हटाने के योग्य हो जाती है; तिथि बीतने पर `pnpm plugins:boundary-report --fail-on-eligible-compat` CI को विफल कर देता है।    |
| **अगली प्रमुख रिलीज़**                      | अब भी माइग्रेट न की गई सभी सतहें हटा दी जाती हैं; उनका अब भी उपयोग करने वाले plugins विफल हो जाएँगे।                                                          |

नीचे दिए गए सार्वजनिक SDK उपपथों के लिए रजिस्ट्री-समर्थित हटाने या पदावनति की समय-सीमाएँ हैं।
जब कोई बाहरी plugin उन्हें इम्पोर्ट करता है, तब वे वर्तमान में रनटाइम चेतावनी जारी नहीं
करते। रिपॉज़िटरी का अप्रचलित-उपयोग गार्ड केवल पूरी तरह अप्रयुक्त
θ1 स्तर और पहले वाले संगतता स्तर पर लागू होता है; इस समय-सीमा के दौरान θ2 बंडल किए गए
plugins के लिए उपलब्ध रहता है।

2026-07-15 को शुरू की गई समय-सीमा के लिए, θ1 का कोई ज्ञात बाहरी या बंडल किया गया
उपभोक्ता नहीं है और समय-सीमा के बाद उसे हटा दिया जाएगा। θ2 के बंडल किए गए उपभोक्ता हैं, लेकिन कोई
ज्ञात बाहरी उपभोक्ता नहीं है; केवल उसके सार्वजनिक पैकेज एक्सपोर्ट को सेवानिवृत्त किया जाएगा। उसका
मॉड्यूल बंडल किए गए plugins के लिए केवल निजी-स्थानीय
उपपथ के रूप में उपलब्ध रहेगा।

| `removeAfter` | स्तर                                   | SDK उपपथ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-30`  | पहले के संगतता बहिष्करण     | `agent-dir-compat`, `channel-envelope`, `channel-inbound-roots`, `channel-location`, `channel-message-runtime`, `channel-pairing-paths`, `channel-reply-options-runtime`, `config-schema`, `config-types`, `direct-dm`, `direct-dm-access`, `mattermost`, `media-generation-runtime-shared`, `memory-core`, `memory-core-engine-runtime`, `memory-core-host-events`, `memory-core-host-multimodal`, `memory-core-host-query`, `memory-host-files`, `memory-host-status`, `music-generation-core`, `outbound-runtime`, `outbound-send-deps`, `provider-auth-login`, `provider-zai-endpoint`, `reply-dedupe`, `runtime-logger`, `runtime-secret-resolution`, `self-hosted-provider-setup`, `setup-adapter-runtime`, `telegram-command-config`, `webhook-path`, `zalouser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `2026-07-30`  | θ1: पूरी तरह अप्रयुक्त; उपपथ हटाएँ       | `command-gating`, `lmstudio`, `lmstudio-runtime`, `secret-provider-integration`, `skills-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `2026-07-30`  | θ2: केवल बंडल में; सार्वजनिक निर्यात समाप्त करें | `access-groups`, `account-resolution-runtime`, `acp-binding-resolve-runtime`, `acp-binding-runtime`, `acp-runtime`, `acp-runtime-backend`, `agent-core`, `agent-harness-exec-review-runtime`, `agent-harness-task-runtime`, `agent-harness-tool-runtime`, `agent-media-payload`, `agent-sessions`, `approval-reaction-runtime`, `approval-reference-runtime`, `async-lock-runtime`, `browser-config`, `bundled-channel-config-schema`, `channel-activity-runtime`, `channel-config-writes`, `channel-mention-gating`, `channel-route`, `channel-secret-tts-runtime`, `channel-targets`, `chat-channel-ids`, `cli-backend`, `cli-runtime`, `codex-mcp-projection`, `command-status-runtime`, `command-surface`, `concurrency-runtime`, `context-visibility-runtime`, `conversation-binding-runtime`, `cron-store-runtime`, `dangerous-name-runtime`, `delivery-queue-runtime`, `direct-dm-guard-policy`, `directory-config-runtime`, `document-extractor`, `embedding-providers`, `exec-approvals-runtime`, `expect-runtime`, `fetch-runtime`, `file-access-runtime`, `file-lock`, `global-singleton`, `group-activation`, `heartbeat-runtime`, `host-runtime`, `html-entity-runtime`, `image-generation`, `image-generation-core`, `image-generation-runtime`, `inline-image-data-url-runtime`, `json-schema-runtime`, `json-unsafe-integers`, `keyed-async-queue`, `llm`, `markdown-table-runtime`, `media-generation-runtime`, `media-understanding`, `memory-core-host-embedding-registry`, `memory-core-host-engine-embeddings`, `memory-core-host-engine-qmd`, `memory-core-host-engine-storage`, `memory-core-host-runtime-cli`, `memory-core-host-runtime-core`, `memory-core-host-runtime-files`, `memory-core-host-secret`, `memory-core-host-status`, `memory-host-core`, `memory-host-events`, `memory-host-markdown`, `memory-host-search`, `message-tool-delivery-hints`, `migration`, `migration-runtime`, `music-generation`, `node-host`, `number-runtime`, `outbound-media`, `pair-loop-guard-runtime`, `plugin-config-runtime`, `plugin-state-runtime`, `poll-runtime`, `process-runtime`, `provider-auth-api-key`, `provider-auth-login-flow-runtime`, `provider-auth-result`, `provider-auth-runtime`, `provider-catalog-live-runtime`, `provider-catalog-shared`, `provider-entry`, `provider-env-vars`, `provider-http`, `provider-model-shared`, `provider-model-types`, `provider-oauth-runtime`, `provider-onboard`, `provider-selection-runtime`, `provider-setup`, `provider-stream`, `provider-stream-family`, `provider-stream-shared`, `provider-tools`, `provider-transport-runtime`, `provider-usage`, `provider-web-fetch`, `provider-web-fetch-contract`, `provider-web-search`, `provider-web-search-config-contract`, `provider-web-search-contract`, `qa-runner-runtime`, `realtime-bootstrap-context`, `realtime-transcription`, `realtime-voice`, `reply-reference`, `request-url`, `response-limit-runtime`, `retry-runtime`, `runtime-doctor`, `runtime-fetch`, `sandbox`, `secret-file-runtime`, `secure-random-runtime`, `session-binding-runtime`, `session-catalog`, `session-key-runtime`, `session-transcript-hit`, `session-transcript-runtime`, `session-visibility`, `simple-completion-runtime`, `speech`, `speech-core`, `sqlite-runtime`, `ssrf-dispatcher`, `string-normalization-runtime`, `system-event-runtime`, `talk-config-runtime`, `target-resolver-runtime`, `text-autolink-runtime`, `text-utility-runtime`, `thread-bindings-runtime`, `thread-bindings-session-runtime`, `time-runtime`, `tool-payload`, `tool-plugin`, `tool-results`, `transcripts`, `transport-ready-runtime`, `tts-runtime`, `types`, `video-generation`, `video-generation-core`, `video-generation-runtime`, `web-content-extractor`, `webhook-targets`, `windows-spawn` |
| `2026-08-15`  | पहले के संगतता बहिष्करण     | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `2026-09-01`  | पहले की संगतता अप्रचलन घोषणाएँ     | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

सभी मुख्य plugins पहले ही माइग्रेट हो चुके हैं। बाहरी plugins को अगले प्रमुख रिलीज़ से
पहले माइग्रेट करना चाहिए। आपका plugin जिन सतहों का उपयोग करता है, उनके लिए कौन-से
संगतता रिकॉर्ड सबसे जल्द देय हैं, यह देखने के लिए `pnpm plugins:boundary-report` चलाएँ।

## चेतावनियों को अस्थायी रूप से दबाना

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

यह एक अस्थायी वैकल्पिक उपाय है, स्थायी समाधान नहीं।

## संबंधित

- [आरंभ करना](/hi/plugins/building-plugins) - अपना पहला plugin बनाएँ
- [SDK का अवलोकन](/hi/plugins/sdk-overview) - पूर्ण सबपाथ इम्पोर्ट संदर्भ
- [चैनल Plugins](/hi/plugins/sdk-channel-plugins) - चैनल plugins बनाना
- [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins) - प्रदाता plugins बनाना
- [Plugin की आंतरिक संरचना](/hi/plugins/architecture) - आर्किटेक्चर का गहन विवरण
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - मैनिफ़ेस्ट स्कीमा संदर्भ
