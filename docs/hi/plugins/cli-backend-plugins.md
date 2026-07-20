---
read_when:
    - आप एक स्थानीय AI CLI बैकएंड Plugin बना रहे हैं
    - आप `acme-cli/model` जैसे मॉडल रेफ़रेंस के लिए एक बैकएंड पंजीकृत करना चाहते हैं
    - आपको किसी तृतीय-पक्ष CLI को OpenClaw के टेक्स्ट फ़ॉलबैक रनर से मैप करना होगा
sidebarTitle: CLI backend plugins
summary: स्थानीय AI CLI बैकएंड पंजीकृत करने वाला Plugin बनाएँ
title: CLI बैकएंड Plugin बनाना
x-i18n:
    generated_at: "2026-07-20T07:13:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08edceae9afd133684094b6febc6ca9b0ab89ce1168474f0a4fabd15b5ac4200
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI बैकएंड Plugin OpenClaw को टेक्स्ट इन्फ़रेंस बैकएंड के रूप में स्थानीय AI CLI को कॉल करने देते हैं। बैकएंड मॉडल रेफ़रेंस में प्रोवाइडर प्रीफ़िक्स के रूप में दिखाई देता है:

```text
acme-cli/acme-large
```

CLI बैकएंड का उपयोग तब करें, जब अपस्ट्रीम इंटीग्रेशन पहले से स्थानीय कमांड के रूप में उपलब्ध हो, जब CLI स्थानीय लॉिन स्थिति का स्वामी हो, या API प्रोवाइडर अनुपलब्ध होने पर फ़ॉलबैक के रूप में।

<Info>
  यदि अपस्ट्रीम सेवा सामान्य HTTP मॉडल API उपलब्ध कराती है, तो इसके बजाय
  [प्रोवाइडर Plugin](/hi/plugins/sdk-provider-plugins) लिखें। यदि अपस्ट्रीम
  रनटाइम पूर्ण एजेंट सत्रों, टूल इवेंट, Compaction या बैकग्राउंड
  टास्क स्थिति का स्वामी है, तो [एजेंट हार्नेस](/hi/plugins/sdk-agent-harness) का उपयोग करें।
</Info>

## Plugin किसका स्वामी है

CLI बैकएंड Plugin के तीन कॉन्ट्रैक्ट होते हैं:

| कॉन्ट्रैक्ट             | फ़ाइल                   | उद्देश्य                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| पैकेज एंट्री        | `package.json`         | OpenClaw को Plugin रनटाइम मॉड्यूल की ओर निर्देशित करती है              |
| मैनिफ़ेस्ट स्वामित्व   | `openclaw.plugin.json` | रनटाइम लोड होने से पहले बैकएंड आईडी घोषित करता है              |
| रनटाइम पंजीकरण | `index.ts`             | कमांड डिफ़ॉल्ट के साथ `api.registerCliBackend(...)` को कॉल करता है |

मैनिफ़ेस्ट डिस्कवरी मेटाडेटा है: यह CLI निष्पादित या रनटाइम व्यवहार पंजीकृत नहीं करता। रनटाइम व्यवहार तब शुरू होता है, जब Plugin एंट्री
`api.registerCliBackend(...)` को कॉल करती है।

## न्यूनतम बैकएंड Plugin

<Steps>
  <Step title="पैकेज मेटाडेटा बनाएँ">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    प्रकाशित पैकेजों में बिल्ड की गई JavaScript रनटाइम फ़ाइलें शामिल होनी चाहिए। यदि आपकी स्रोत
    एंट्री `./src/index.ts` है, तो बिल्ड किए गए JavaScript समकक्ष की ओर निर्देशित करने वाला
    `openclaw.runtimeExtensions` जोड़ें। [एंट्री पॉइंट](/hi/plugins/sdk-entrypoints) देखें।

  </Step>

  <Step title="बैकएंड स्वामित्व घोषित करें">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` रनटाइम स्वामित्व सूची है; जब कॉन्फ़िगरेशन या मॉडल चयन में `acme-cli/...` का उल्लेख होता है, तो यह OpenClaw को
    Plugin स्वतः लोड करने देता है।

    `setup.cliBackends` डिस्क्रिप्टर-प्रथम सेटअप सतह है। इसे तब जोड़ें, जब
    मॉडल डिस्कवरी, ऑनबोर्डिंग या स्थिति को Plugin रनटाइम लोड किए बिना बैकएंड
    पहचानना चाहिए। `requiresRuntime: false` का उपयोग केवल तब करें, जब
    वे स्थिर डिस्क्रिप्टर सेटअप के लिए पर्याप्त हों।

  </Step>

  <Step title="बैकएंड पंजीकृत करें">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    बैकएंड आईडी को मैनिफ़ेस्ट की `cliBackends` एंट्री से मेल खाना चाहिए।
    पंजीकृत `config` केवल डिफ़ॉल्ट है; रनटाइम पर
    `agents.defaults.cliBackends.acme-cli` के अंतर्गत उपयोगकर्ता कॉन्फ़िगरेशन इसके ऊपर मर्ज होता है।

  </Step>
</Steps>

## कॉन्फ़िगरेशन संरचना

`CliBackendConfig` बताता है कि OpenClaw को CLI कैसे लॉन्च और पार्स करना चाहिए:

| फ़ील्ड                                                     | उपयोग                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | बाइनरी नाम या पूर्ण कमांड पथ                                              |
| `args`                                                    | नए रन के लिए आधार argv                                                          |
| `resumeArgs`                                              | पुनः आरंभ किए गए सत्रों के लिए वैकल्पिक argv; `{sessionId}` का समर्थन करता है                       |
| `output` / `resumeOutput`                                 | पार्सर: `json`, `jsonl` या `text`                                                |
| `jsonlDialect`                                            | JSONL इवेंट डायलेक्ट: `claude-stream-json` या `gemini-stream-json`                 |
| `liveSession`                                             | लंबे समय तक चलने वाला CLI प्रोसेस मोड (`claude-stdio`)                                      |
| `input`                                                   | प्रॉम्प्ट ट्रांसपोर्ट: `arg` या `stdin`                                                |
| `maxPromptArgChars`                                       | stdin पर फ़ॉलबैक करने से पहले `arg` मोड के लिए अधिकतम प्रॉम्प्ट लंबाई                     |
| `env` / `clearEnv`                                        | इंजेक्ट करने के लिए अतिरिक्त एनवायरनमेंट वेरिएबल, या लॉन्च से पहले हटाने के लिए नाम                         |
| `modelArg`                                                | मॉडल आईडी से पहले प्रयुक्त फ़्लैग                                                     |
| `modelAliases`                                            | OpenClaw मॉडल आईडी को CLI-मूल आईडी से मैप करें                                          |
| `sessionArg` / `sessionArgs`                              | सत्र आईडी कैसे पास करें                                                          |
| `sessionMode`                                             | `always`, `existing` या `none`                                                   |
| `sessionIdFields`                                         | वे JSON फ़ील्ड जिन्हें OpenClaw CLI आउटपुट से पढ़ता है                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | सिस्टम प्रॉम्प्ट ट्रांसपोर्ट                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | सिस्टम प्रॉम्प्ट फ़ाइल के लिए कॉन्फ़िगरेशन-ओवरराइड ट्रांसपोर्ट (उदाहरण के लिए `-c`)             |
| `systemPromptMode`                                        | `append` या `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` या `never`                                                     |
| `imageArg` / `imageMode`                                  | इमेज पथ फ़्लैग और एकाधिक इमेज कैसे पास करें (`repeat` या `list`)              |
| `imagePathScope`                                          | हैंडऑफ़ से पहले स्टेज की गई इमेज फ़ाइलें कहाँ रहती हैं: `temp` या `workspace`               |
| `serialize`                                               | समान-बैकएंड रन को क्रमबद्ध रखें                                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | सुरक्षित सत्र रीसेट के लिए Compaction से पहले सीमित रॉ-ट्रांसक्रिप्ट रीसीड में ऑप्ट-इन करें |
| `reliability.watchdog`                                    | आउटपुट न मिलने की टाइमआउट ट्यूनिंग, नए और पुनः आरंभ किए गए रन के लिए अलग-अलग                      |

CLI से मेल खाने वाला सबसे छोटा स्थिर कॉन्फ़िगरेशन चुनें। Plugin कॉलबैक केवल
ऐसे व्यवहार के लिए जोड़ें, जो वास्तव में बैकएंड से संबंधित हो।

## उन्नत बैकएंड हुक

`CliBackendPlugin` इन्हें भी परिभाषित कर सकता है:

| हुक                               | उपयोग                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | मर्ज के बाद पुराने उपयोगकर्ता कॉन्फ़िगरेशन को पुनर्लिखें                                      |
| `resolveExecutionArgs(ctx)`        | सोचने के प्रयास या सहायक-प्रश्न आइसोलेशन जैसे अनुरोध-स्कोप वाले फ़्लैग जोड़ें |
| `prepareExecution(ctx)`            | लॉन्च से पहले अस्थायी प्रमाणीकरण, कॉन्फ़िगरेशन या एनवायरनमेंट ब्रिज बनाएँ         |
| `transformSystemPrompt(ctx)`       | अंतिम CLI-विशिष्ट सिस्टम प्रॉम्प्ट रूपांतरण लागू करें                          |
| `textTransforms`                   | द्विदिश प्रॉम्प्ट/आउटपुट प्रतिस्थापन                                    |
| `defaultAuthProfileId`             | किसी विशिष्ट OpenClaw प्रमाणीकरण प्रोफ़ाइल को प्राथमिकता दें                                     |
| `authEpochMode`                    | तय करें कि प्रमाणीकरण परिवर्तन संग्रहीत CLI सत्रों को कैसे अमान्य करते हैं                      |
| `nativeToolMode`                   | घोषित करें कि नेटिव टूल अनुपस्थित, हमेशा चालू या होस्ट द्वारा चयन योग्य हैं      |
| `sideQuestionToolMode`             | `/btw` सहायक प्रश्नों के लिए अक्षम नेटिव टूल घोषित करें                     |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw के लूपबैक MCP टूल ब्रिज में ऑप्ट-इन करें                                |
| `ownsNativeCompaction`             | बैकएंड अपने Compaction का स्वयं स्वामी है—OpenClaw इसे स्थगित करता है                           |
| `subscriptionAuthDispatch`         | सदस्यता क्रेडेंशियल पर ऑप्ट-इन किए गए एम्बेडेड रन इस बैकएंड के माध्यम से निष्पादित होते हैं |
| `runtimeArtifact`                  | स्क्रिप्ट लॉन्चर को उसके पूर्ण बंडल पैकेज ट्री तक सीमित करें                |

इन हुक का स्वामित्व प्रोवाइडर के पास रखें। जब कोई बैकएंड हुक व्यवहार व्यक्त कर सकता हो,
तो कोर में CLI-विशिष्ट शाखाएँ न जोड़ें।

`prepareExecution(ctx)` को `ctx.contextTokenBudget` मिलता है, जो रन के लिए चुनी गई प्रभावी टोकन
सीमा है। नेटिव Compaction के स्वामी बैकएंड उस बजट को अपने CLI-विशिष्ट लॉन्च कॉन्ट्रैक्ट में मैप कर सकते हैं।

`runtimeArtifact` Plugin के स्वामित्व में है और उपयोगकर्ता इसे ओवरराइड नहीं कर सकता। इसे
केवल तब देखा जाता है, जब कोई लाइव अनुमान टर्न सत्यापित सेटअप प्राधिकार बनाता या पुनः सत्यापित करता है;
सामान्य CLI रन में इसकी आवश्यकता नहीं होती। इस घोषणा के बिना कोई बैकएंड
सत्यापित CLI सेटअप प्राधिकार नहीं बना सकता। `bundled-package-tree` घोषणा
सटीक `package.json` स्वामी का नाम बताती है और पैकेज एंट्रीपॉइंट का
कमांड होना आवश्यक बनाती है। OpenClaw नेस्टेड निर्भरताओं सहित सीमाबद्ध पूर्ण इंस्टॉल किए गए
पैकेज ट्री को हैश करता है और रीडायरेक्ट करने वाले सिमलिंक,
घोषित पैकेज से बाहर के लॉन्चर, आवश्यक बाहरी निर्भरता
घोषणाओं, अत्यधिक बड़े ट्री और अज्ञात स्क्रिप्ट के लिए फ़ेल-क्लोज़ करता है। इसे केवल तभी घोषित करें, जब उस
ट्री में पूर्ण अनुमान कार्यान्वयन हो; वैकल्पिक टूल एकीकरण
किसी बाहरी कार्यान्वयन ग्राफ़ को सुरक्षित नहीं बनाते।

यदि वही बैकएंड एक स्व-निहित नेटिव एक्ज़ीक्यूटेबल भी प्रदान करता है, तो उसके
कैनोनिकल बेसनेम `nativeExecutableNames` में सूचीबद्ध करें। उपयोगकर्ता द्वारा बैकएंड कमांड
ओवरराइड किए जाने पर भी अन्य नेटिव कमांड असत्यापित रहते हैं।

सामान्य टर्न के लिए `ctx.executionMode`, `"agent"` है और
क्षणिक `/btw` कॉल के लिए `"side-question"` है। इसका उपयोग तब करें, जब CLI को BTW के लिए अलग
एक-बार उपयोग होने वाले फ़्लैग चाहिए, जैसे नेटिव टूल, सत्र स्थायित्व या रिज़्यूम व्यवहार
अक्षम करना। यदि किसी बैकएंड में सामान्यतः `nativeToolMode: "always-on"` है, लेकिन उसका
साइड-क्वेश्चन argv उन टूल को विश्वसनीय रूप से अक्षम करता है, तो
`sideQuestionToolMode: "disabled"` भी सेट करें; अन्यथा BTW को बिना-टूल वाला
CLI रन चाहिए होने पर OpenClaw फ़ेल-क्लोज़ करता है।

`nativeToolMode: "selectable"` केवल तभी सेट करें, जब `resolveExecutionArgs` किसी
व्यक्तिगत रन के लिए प्रत्येक बैकएंड-नेटिव टूल अक्षम कर सकता हो। उन प्रतिबंधित रन के लिए,
`ctx.toolAvailability.native` एक खाली ट्यूपल है और
`ctx.toolAvailability.mcp` सटीक होस्ट-पृथक MCP अनुमत-सूची है। हुक को
परस्पर-विरोधी टूल फ़्लैग बदलने होंगे और दोनों मान लागू करने वाला argv लौटाना होगा;
OpenClaw इसे अंतिम नए या रिज़्यूम argv के साथ एक बार कॉल करता है और जब
बैकएंड प्रतिबंध लागू नहीं कर सकता, तो फ़ेल-क्लोज़ करता है। इस संदर्भ में MCP नामों को स्वतः
स्वीकृत करना केवल इसलिए सुरक्षित है, क्योंकि होस्ट ने पहले ही जनरेट किए गए MCP
कॉन्फ़िगरेशन को उन्हीं सर्वर और टूल तक सीमित कर दिया है।

### `ownsNativeCompaction`: OpenClaw Compaction से बाहर निकलना

यदि आपका बैकएंड ऐसा एजेंट चलाता है, जो अपने **स्वयं के** ट्रांसक्रिप्ट को कॉम्पैक्ट करता है, तो
`ownsNativeCompaction: true` सेट करें, ताकि OpenClaw का सुरक्षा सारांशकर्ता उसके
सत्रों पर कभी न चले—CLI Compaction जीवनचक्र कोई कार्रवाई न करने वाला परिणाम लौटाता है और
टर्न आगे बढ़ता है। `claude-cli` इसे घोषित करता है, क्योंकि Claude Code बिना किसी
हार्नेस एंडपॉइंट के आंतरिक रूप से कॉम्पैक्ट करता है। Codex जैसे नेटिव-हार्नेस सत्र
इसके बजाय अपने हार्नेस Compaction एंडपॉइंट पर रूट होते रहते हैं।

**इसे केवल तभी घोषित करें, जब निम्नलिखित सभी शर्तें पूरी हों**, अन्यथा स्थगित
बजट-से-अधिक सत्र बजट से अधिक बना रह सकता है या पुराना पड़ सकता है (OpenClaw अब
उसे बचाता नहीं है):

- बैकएंड अपनी विंडो के निकट पहुँचने पर अपने ट्रांसक्रिप्ट को विश्वसनीय रूप से कॉम्पैक्ट या सीमाबद्ध करता है;
- यह रिज़्यूम किए जा सकने योग्य सत्र बनाए रखता है, ताकि कॉम्पैक्ट की गई स्थिति टर्न के बीच बनी रहे
  (उदाहरण के लिए `--resume` / `--session-id`);
- यह नेटिव-हार्नेस Compaction सत्र नहीं है—मेल खाने वाले `agentHarnessId`
  सत्र इसके बजाय हार्नेस एंडपॉइंट पर रूट होते हैं।

## MCP टूल ब्रिज

CLI बैकएंड को डिफ़ॉल्ट रूप से OpenClaw टूल प्राप्त नहीं होते। यदि CLI किसी
MCP कॉन्फ़िगरेशन का उपयोग कर सकता है, तो स्पष्ट रूप से ऑप्ट इन करें:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

समर्थित ब्रिज मोड:

| मोड                     | उपयोग                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | MCP कॉन्फ़िग फ़ाइल स्वीकार करने वाले CLI                              |
| `codex-config-overrides` | argv पर कॉन्फ़िग ओवरराइड स्वीकार करने वाले CLI                        |
| `gemini-system-settings` | अपनी सिस्टम सेटिंग डायरेक्टरी से MCP सेटिंग पढ़ने वाले CLI |

ब्रिज केवल तभी सक्षम करें, जब CLI वास्तव में इसका उपयोग कर सकता हो। यदि CLI की
अपनी अंतर्निहित टूल परत है, जिसे अक्षम नहीं किया जा सकता, तो `nativeToolMode:
"always-on"` सेट करें, ताकि कॉलर द्वारा नेटिव
टूल न होने की आवश्यकता रखे जाने पर OpenClaw फ़ेल-क्लोज़ कर सके। यदि यह प्रति रन प्रत्येक नेटिव टूल अक्षम कर सकता है, तो ऊपर दिए गए
`resolveExecutionArgs` अनुबंध के साथ `"selectable"` का उपयोग करें।

## उपयोगकर्ता कॉन्फ़िगरेशन

उपयोगकर्ता किसी भी बैकएंड डिफ़ॉल्ट को ओवरराइड कर सकते हैं:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

उस न्यूनतम ओवरराइड का दस्तावेज़ीकरण करें, जिसकी उपयोगकर्ताओं को आवश्यकता पड़ने की संभावना है—आमतौर पर केवल
`command`, जब बाइनरी `PATH` से बाहर हो।

## सत्यापन

बंडल किए गए plugins के लिए, बिल्डर और सेटअप
पंजीकरण के आसपास एक केंद्रित परीक्षण जोड़ें, फिर Plugin की लक्षित परीक्षण लेन चलाएँ:

```bash
pnpm test extensions/acme-cli
```

स्थानीय या इंस्टॉल किए गए plugins के लिए, खोज और एक वास्तविक मॉडल रन सत्यापित करें:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "ठीक यही उत्तर दें: backend ok" --model acme-cli/acme-large
```

यदि बैकएंड इमेज या MCP का समर्थन करता है, तो एक लाइव स्मोक परीक्षण जोड़ें, जो वास्तविक
CLI के साथ उन पथों को सिद्ध करे। प्रॉम्प्ट, इमेज,
MCP या सत्र-रिज़्यूम व्यवहार के लिए स्थिर निरीक्षण पर निर्भर न रहें।

## जाँच-सूची

<Check>`package.json` में प्रकाशित पैकेज के लिए `openclaw.extensions` और निर्मित रनटाइम प्रविष्टियाँ हैं</Check>
<Check>`openclaw.plugin.json`, `cliBackends` और जानबूझकर चुने गए `activation.onStartup` को घोषित करता है</Check>
<Check>जब सेटअप/मॉडल खोज को बैकएंड को कोल्ड स्थिति में देखना चाहिए, तब `setup.cliBackends` मौजूद है</Check>
<Check>`api.registerCliBackend(...)`, मैनिफ़ेस्ट वाले समान बैकएंड आईडी का उपयोग करता है</Check>
<Check>`agents.defaults.cliBackends.<id>` के अंतर्गत उपयोगकर्ता ओवरराइड अब भी प्रभावी रहते हैं</Check>
<Check>सत्र, सिस्टम प्रॉम्प्ट, इमेज और आउटपुट पार्सर सेटिंग वास्तविक CLI अनुबंध से मेल खाती हैं</Check>
<Check>लक्षित परीक्षण और कम-से-कम एक लाइव CLI स्मोक परीक्षण बैकएंड पथ को सिद्ध करते हैं</Check>

## संबंधित

- [CLI बैकएंड](/hi/gateway/cli-backends) - उपयोगकर्ता कॉन्फ़िगरेशन और रनटाइम व्यवहार
- [plugins बनाना](/hi/plugins/building-plugins) - पैकेज और मैनिफ़ेस्ट की मूल बातें
- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) - पंजीकरण API संदर्भ
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - `cliBackends` और सेटअप डिस्क्रिप्टर
- [एजेंट हार्नेस](/hi/plugins/sdk-agent-harness) - पूर्ण बाहरी एजेंट रनटाइम
