---
read_when:
    - आपको `defineToolPlugin`, `definePluginEntry`, या `defineChannelPluginEntry` का सटीक टाइप सिग्नेचर चाहिए
    - आप पंजीकरण मोड (पूर्ण बनाम सेटअप बनाम CLI मेटाडेटा) को समझना चाहते हैं
    - आप प्रवेश बिंदु के विकल्प खोज रहे हैं
sidebarTitle: Entry Points
summary: defineToolPlugin, definePluginEntry, defineChannelPluginEntry और defineSetupPluginEntry के लिए संदर्भ
title: Plugin प्रवेश बिंदु
x-i18n:
    generated_at: "2026-07-19T09:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e64fe1d65531fea8f266aa23b73064daf2ed2c5c43af8bb08ea57e347fe566f4
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

प्रत्येक plugin एक डिफ़ॉल्ट एंट्री ऑब्जेक्ट निर्यात करता है। SDK प्रत्येक एंट्री आकार के लिए एक सहायक प्रदान करता है: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`।

<Tip>
  **चरण-दर-चरण विवरण खोज रहे हैं?** चरण-दर-चरण मार्गदर्शिकाओं के लिए [टूल Plugins](/hi/plugins/tool-plugins),
  [चैनल Plugins](/hi/plugins/sdk-channel-plugins), या
  [प्रोवाइडर Plugins](/hi/plugins/sdk-provider-plugins) देखें।
</Tip>

## पैकेज एंट्रियाँ

इंस्टॉल किए गए plugins स्रोत और निर्मित, दोनों एंट्रियों पर `package.json` `openclaw` फ़ील्ड इंगित करते हैं:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` और `setupEntry` स्रोत एंट्रियाँ हैं, जिनका उपयोग वर्कस्पेस और git
  चेकआउट विकास के लिए किया जाता है।
- इंस्टॉल किए गए पैकेजों के लिए `runtimeExtensions` और `runtimeSetupEntry` को प्राथमिकता दी जाती है:
  इनके कारण npm पैकेज रनटाइम TypeScript कंपाइलेशन छोड़ सकते हैं।
- यदि `runtimeExtensions` मौजूद है, तो उसकी ऐरे लंबाई `extensions` से मेल खानी चाहिए
  (एंट्रियाँ स्थितिनुसार युग्मित होती हैं)। `runtimeSetupEntry` के लिए `setupEntry` आवश्यक है।
- यदि कोई `runtimeExtensions`/`runtimeSetupEntry` आर्टिफ़ैक्ट घोषित है, लेकिन
  अनुपस्थित है, तो इंस्टॉलेशन/डिस्कवरी पैकेजिंग त्रुटि के साथ विफल होती है; OpenClaw
  स्रोत पर चुपचाप वापस नहीं जाता। स्रोत फ़ॉलबैक (नीचे) केवल तभी लागू होता है, जब
  कोई रनटाइम एंट्री बिल्कुल घोषित न हो।
- यदि कोई इंस्टॉल किया गया पैकेज केवल TypeScript स्रोत एंट्री घोषित करता है, तो OpenClaw
  उससे मेल खाने वाला निर्मित `dist/*.js` (या `.mjs`/`.cjs`) पीयर खोजकर उसका उपयोग करता है;
  अन्यथा वह TypeScript स्रोत पर फ़ॉलबैक करता है।
- सभी एंट्री पथ plugin पैकेज डायरेक्टरी के भीतर ही रहने चाहिए। रनटाइम
  एंट्रियाँ और अनुमानित निर्मित-JS पीयर, बाहर निकलने वाले `extensions` या
  `setupEntry` स्रोत पथ को मान्य नहीं बनाते।

## `defineToolPlugin`

**इम्पोर्ट:** `openclaw/plugin-sdk/tool-plugin`

उन plugins के लिए जो केवल एजेंट टूल जोड़ते हैं। यह स्रोत को छोटा रखता है, TypeBox स्कीमा से कॉन्फ़िगरेशन
और टूल-पैरामीटर प्रकारों का अनुमान लगाता है, सामान्य रिटर्न मानों को
OpenClaw टूल-परिणाम प्रारूप में रैप करता है, और वह स्थिर मेटाडेटा उपलब्ध कराता है जिसे
`openclaw plugins build` plugin मैनिफ़ेस्ट (`contracts.tools`,
`configSchema`) में लिखता है।

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          hasKey: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` वैकल्पिक है; इसे छोड़ने पर एक सख़्त खाली ऑब्जेक्ट स्कीमा उपयोग होता है
  (जनरेट किए गए मैनिफ़ेस्ट में फिर भी `configSchema` शामिल होता है)।
- `execute` एक सामान्य स्ट्रिंग या JSON-सीरियलाइज़ करने योग्य मान लौटाता है; सहायक
  उसे टेक्स्ट टूल परिणाम के रूप में रैप करता है, जिसमें `details` मूल
  (स्ट्रिंग में अपरिवर्तित) रिटर्न मान पर सेट होता है।
- `outputSchema` वैकल्पिक रूप से Code Mode और Tool Search के लिए उस मूल `details` मान का वर्णन करता है।
  कैटलॉग कॉल निष्पादन से पहले अमान्य स्कीमा को अस्वीकार करते हैं
  और अंतिम मान लौटाने से पहले उसे सत्यापित करते हैं।
- कस्टम टूल परिणामों के लिए, `openclaw/plugin-sdk/tool-results`
  `textResult` और `jsonResult` निर्यात करता है।
- टूल नाम स्थिर होते हैं, इसलिए `openclaw plugins build`
  बिना नामों को हाथ से दोहराए घोषित टूलों से `contracts.tools` प्राप्त करता है।
- रनटाइम लोडिंग सख़्त रहती है: इंस्टॉल किए गए plugins को अब भी
  `openclaw.plugin.json` और `package.json` `openclaw.extensions` की आवश्यकता होती है। OpenClaw
  अनुपस्थित मैनिफ़ेस्ट डेटा का अनुमान लगाने के लिए कभी भी plugin कोड निष्पादित नहीं करता।

## `definePluginEntry`

**इम्पोर्ट:** `openclaw/plugin-sdk/plugin-entry`

प्रोवाइडर plugins, उन्नत टूल plugins, हुक plugins और ऐसी किसी भी चीज़ के लिए
जो मैसेजिंग चैनल **नहीं** है।

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| फ़ील्ड                     | प्रकार                                                             | आवश्यक | डिफ़ॉल्ट             |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | हाँ      | -                   |
| `name`                    | `string`                                                         | हाँ      | -                   |
| `description`             | `string`                                                         | हाँ      | -                   |
| `kind`                    | `string` (बहिष्कृत, नीचे देखें)                                 | नहीं       | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | नहीं       | खाली ऑब्जेक्ट स्कीमा |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | नहीं       | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | नहीं       | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | नहीं       | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | हाँ      | -                   |

- `id` आपके `openclaw.plugin.json` मैनिफ़ेस्ट से मेल खाना चाहिए।
- बाहरी सत्र कैटलॉग
  `openclaw/plugin-sdk/session-catalog` और
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })` का उपयोग करते हैं।
  कोर `sessions.catalog.*` Gateway विधियों का स्वामी है; प्रोवाइडर RPC पंजीकृत किए बिना होस्ट,
  सत्र और सामान्यीकृत ट्रांस्क्रिप्ट प्रोजेक्शन लौटाते हैं। किसी सूची प्रोवाइडर को प्रत्येक होस्ट का
  निपटारा होते ही वैकल्पिक `onHost(host)` कॉलबैक कॉल करना चाहिए; लौटाई गई होस्ट ऐरे अंतिम संगतता
  स्नैपशॉट के रूप में आवश्यक रहती है।
- `kind` बहिष्कृत है: इसके बजाय `openclaw.plugin.json` मैनिफ़ेस्ट के `kind` फ़ील्ड में
  एक एक्सक्लूसिव स्लॉट (`"memory"` या
  `"context-engine"`) घोषित करें। रनटाइम-एंट्री `kind` केवल
  पुराने plugins के लिए संगतता फ़ॉलबैक के रूप में रहती है।
- लेज़ी मूल्यांकन के लिए `configSchema` एक फ़ंक्शन हो सकता है। OpenClaw पहली पहुँच पर स्कीमा का समाधान कर
  उसे मेमोइज़ करता है, इसलिए महँगे स्कीमा बिल्डर केवल
  एक बार चलते हैं।
- कोई `nodeHostCommands` डिस्क्रिप्टर `isAvailable({ config, env })` परिभाषित कर सकता है।
  `false` लौटाने पर वह कमांड और उसकी क्षमता हेडलेस
  Node की Gateway घोषणा से हट जाती है। OpenClaw इसका मूल्यांकन Node-स्थानीय
  स्टार्टअप कॉन्फ़िगरेशन के विरुद्ध करता है; कमांड हैंडलरों को आह्वान होने पर
  उपलब्धता फिर भी सत्यापित करनी चाहिए।

## `defineChannelPluginEntry`

**इम्पोर्ट:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` को चैनल-विशिष्ट वायरिंग के साथ रैप करता है: यह स्वचालित रूप से
`api.registerChannel({ plugin })` कॉल करता है, एक वैकल्पिक रूट-सहायता CLI
मेटाडेटा सीम उपलब्ध कराता है, और पंजीकरण मोड के आधार पर `registerFull` को नियंत्रित करता है।

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| फ़ील्ड                 | प्रकार                                                             | आवश्यक | डिफ़ॉल्ट             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | हाँ      | -                   |
| `name`                | `string`                                                         | हाँ      | -                   |
| `description`         | `string`                                                         | हाँ      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | हाँ      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | नहीं       | खाली ऑब्जेक्ट स्कीमा |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | नहीं       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | नहीं       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | नहीं       | -                   |

कॉलबैक प्रत्येक पंजीकरण मोड के अनुसार चलते हैं (पूरी तालिका
[पंजीकरण मोड](#registration-mode) के अंतर्गत है):

- `setRuntime`, `"cli-metadata"` और
  `"tool-discovery"` को छोड़कर प्रत्येक मोड में चलता है। रनटाइम संदर्भ को यहाँ संग्रहीत करें, आम तौर पर
  `createPluginRuntimeStore` के माध्यम से।
- `registerCliMetadata`, `"cli-metadata"`, `"discovery"`, और
  `"full"` के लिए चलता है। इसे चैनल-स्वामित्व वाले CLI डिस्क्रिप्टरों के प्रामाणिक स्थान के रूप में उपयोग करें,
  ताकि रूट सहायता सक्रिय न करे, डिस्कवरी स्नैपशॉट में स्थिर
  कमांड मेटाडेटा शामिल हो और सामान्य CLI पंजीकरण पूर्ण
  plugin लोड के साथ संगत रहे।
- `registerFull` केवल `"full"` और `"tool-discovery"` के लिए चलता है।
  `"tool-discovery"` के लिए यह चैनल पंजीकरण के _बदले_ चलता है: OpenClaw
  `registerChannel`/`setRuntime` को पूरी तरह छोड़ देता है और केवल
  `registerFull` कॉल करता है, इसलिए स्टैंडअलोन टूल डिस्कवरी या निष्पादन के लिए आपके चैनल को आवश्यक कोई भी प्रोवाइडर/टूल पंजीकरण
  वहीं होना चाहिए, सामान्य
  चैनल सेटअप के पीछे नहीं।
- डिस्कवरी पंजीकरण सक्रिय नहीं करता, लेकिन यह इम्पोर्ट-मुक्त भी नहीं है: स्नैपशॉट बनाने के लिए OpenClaw
  विश्वसनीय plugin एंट्री और चैनल plugin मॉड्यूल का मूल्यांकन कर सकता है।
  शीर्ष-स्तरीय इम्पोर्ट को साइड-इफ़ेक्ट-मुक्त रखें और सॉकेट,
  क्लाइंट, वर्कर और सेवाओं को केवल `"full"` वाले पथों के पीछे रखें।
- `definePluginEntry` की तरह, `configSchema` एक लेज़ी फ़ैक्टरी हो सकता है; OpenClaw
  पहली पहुँच पर समाधान किए गए स्कीमा को मेमोइज़ करता है।

CLI पंजीकरण:

- Plugin के स्वामित्व वाले रूट
  CLI कमांड के लिए `api.registerCli(..., { descriptors: [...] })` का उपयोग करें, जिन्हें आप रूट CLI
  पार्स ट्री से गायब किए बिना लेज़ी-लोड करना चाहते हैं। डिस्क्रिप्टर नामों में केवल अक्षर, संख्याएँ, हाइफ़न और
  अंडरस्कोर होने चाहिए और उनकी शुरुआत किसी अक्षर या संख्या से होनी चाहिए; OpenClaw अन्य
  स्वरूपों को अस्वीकार करता है और सहायता रेंडर करने से पहले विवरणों से टर्मिनल नियंत्रण अनुक्रम
  हटा देता है। रजिस्ट्रार द्वारा उजागर किए गए प्रत्येक शीर्ष-स्तरीय कमांड रूट को शामिल करें।
  अकेला `commands` उत्सुक संगतता पथ पर रहता है।
- युग्मित-Node सुविधा कमांड के लिए `api.registerNodeCliFeature(...)` का उपयोग करें, ताकि
  वे `openclaw nodes` के अंतर्गत आएँ (`registerCli(registrar, { parentPath: ["nodes"], ... })` के
  समतुल्य)।
- अन्य नेस्टेड Plugin कमांड के लिए, `parentPath` जोड़ें और रजिस्ट्रार को दिए गए
  `program` ऑब्जेक्ट पर कमांड पंजीकृत करें; Plugin को कॉल करने से पहले OpenClaw इसे
  पैरेंट कमांड में रिज़ॉल्व करता है।
- चैनल Plugin के लिए, CLI डिस्क्रिप्टर `registerCliMetadata` से पंजीकृत करें
  और `registerFull` को केवल रनटाइम कार्य पर केंद्रित रखें।
- यदि `registerFull` Gateway RPC विधियाँ भी पंजीकृत करता है, तो उन्हें
  Plugin-विशिष्ट प्रीफ़िक्स पर रखें। आरक्षित कोर एडमिन नेमस्पेस (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) हमेशा
  `operator.admin` में बदले जाते हैं।

## `defineSetupPluginEntry`

**इंपोर्ट:** `openclaw/plugin-sdk/channel-core`

हल्की `setup-entry.ts` फ़ाइल के लिए। बिना किसी
रनटाइम या CLI वायरिंग के केवल `{ plugin }` लौटाता है।

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

जब कोई चैनल अक्षम या कॉन्फ़िगर नहीं होता, अथवा स्थगित लोडिंग सक्षम होती है, तो
OpenClaw पूर्ण एंट्री के बजाय इसे लोड करता है। यह कब महत्वपूर्ण होता है, इसके लिए
[सेटअप और कॉन्फ़िगरेशन](/hi/plugins/sdk-setup#setup-entry) देखें।

`defineSetupPluginEntry(...)` को सीमित सेटअप सहायक परिवारों के साथ जोड़ें:

| इंपोर्ट                              | उपयोग                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | रनटाइम-सुरक्षित सेटअप सहायक: `createSetupTranslator`, इंपोर्ट-सुरक्षित सेटअप पैच अडैप्टर, लुकअप-नोट आउटपुट, `promptResolvedAllowFrom`, `splitSetupEntries`, प्रत्यायोजित सेटअप प्रॉक्सी |
| `openclaw/plugin-sdk/channel-setup` | वैकल्पिक-इंस्टॉल सेटअप सतहें                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | सेटअप/इंस्टॉल CLI, आर्काइव और दस्तावेज़ सहायक                                                                                                                                       |

भारी SDK, CLI पंजीकरण और दीर्घजीवी रनटाइम सेवाओं को
पूर्ण एंट्री में रखें।

सेटअप और रनटाइम सतहों को अलग करने वाले बंडल किए गए वर्कस्पेस चैनल
`openclaw/plugin-sdk/channel-entry-contract` से
`defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं। इससे सेटअप
एंट्री, रनटाइम सेटर उजागर करते हुए भी सेटअप-सुरक्षित Plugin/सीक्रेट एक्सपोर्ट बनाए रख सकती है:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* सेटअप-सुरक्षित रूट */
      },
    });
  },
});
```

इसका उपयोग केवल तब करें, जब पूर्ण चैनल एंट्री लोड होने से पहले किसी सेटअप प्रवाह को वास्तव में
हल्के रनटाइम सेटर या सेटअप-सुरक्षित Gateway सतह की आवश्यकता हो।
`registerSetupRuntime` केवल `"setup-runtime"` लोड के लिए चलता है; इसे
केवल कॉन्फ़िगरेशन रूट या उन विधियों तक सीमित रखें, जिनका स्थगित
पूर्ण सक्रियण से पहले मौजूद होना आवश्यक है।

## पंजीकरण मोड

`api.registrationMode` आपके Plugin को बताता है कि उसे कैसे लोड किया गया था:

| मोड               | कब                                               | क्या पंजीकृत करें                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | सामान्य Gateway स्टार्टअप                             | सब कुछ                                                                                                              |
| `"discovery"`      | केवल-पढ़ने योग्य क्षमता खोज                     | चैनल पंजीकरण और स्थिर CLI डिस्क्रिप्टर; एंट्री कोड लोड हो सकता है, लेकिन सॉकेट, वर्कर, क्लाइंट और सेवाएँ छोड़ दें |
| `"tool-discovery"` | विशिष्ट Plugin के टूल सूचीबद्ध करने या चलाने के लिए स्कोप्ड लोड | केवल क्षमता/टूल पंजीकरण; चैनल सक्रियण नहीं                                                                |
| `"setup-only"`     | अक्षम/अकॉन्फ़िगर चैनल                      | केवल चैनल पंजीकरण                                                                                               |
| `"setup-runtime"`  | रनटाइम उपलब्ध होने वाला सेटअप प्रवाह                  | चैनल पंजीकरण और केवल वह हल्का रनटाइम, जिसकी पूर्ण एंट्री लोड होने से पहले आवश्यकता होती है                               |
| `"cli-metadata"`   | रूट सहायता / CLI मेटाडेटा कैप्चर                   | केवल CLI डिस्क्रिप्टर                                                                                                    |

`defineChannelPluginEntry` इस विभाजन को स्वचालित रूप से संभालता है। यदि आप
किसी चैनल के लिए सीधे `definePluginEntry` का उपयोग करते हैं, तो मोड स्वयं जाँचें और याद रखें कि
`"tool-discovery"` चैनल पंजीकरण छोड़ देता है:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // केवल क्षमता वाली सतहें (प्रोवाइडर/टूल) पंजीकृत करें, चैनल नहीं।
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // केवल भारी रनटाइम पंजीकरण
  api.registerService(/* ... */);
}
```

दीर्घजीवी सेवाएँ अपने सेवा संदर्भ के माध्यम से छोटे अमान्यकरण या जीवनचक्र इवेंट
उत्सर्जित कर सकती हैं:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw इसे `plugin.<plugin-id>.changed` के रूप में नेमस्पेस करता है। इवेंट नाम एक
लोअरकेस सेगमेंट होते हैं, पेलोड सीमित JSON होना चाहिए और स्कोप
`operator.read`, `operator.write` या `operator.admin` होना चाहिए। एमिटर केवल
सेवा के जीवनकाल के दौरान मौजूद रहता है और रुकने या स्टार्ट विफल होने के बाद निरस्त हो जाता है। पूर्ण रिकॉर्ड के बजाय
संस्करण या अमान्यकरण पेलोड को प्राथमिकता दें, ताकि अधिकृत क्लाइंट Plugin की स्कोप्ड Gateway विधियों के माध्यम से
कैनोनिकल स्थिति दोबारा पढ़ें।

खोज मोड एक गैर-सक्रियकारी रजिस्ट्री स्नैपशॉट बनाता है। यह फिर भी
Plugin एंट्री और चैनल Plugin ऑब्जेक्ट का मूल्यांकन कर सकता है, ताकि OpenClaw
चैनल क्षमताएँ और स्थिर CLI डिस्क्रिप्टर पंजीकृत कर सके। खोज में मॉड्यूल
मूल्यांकन को विश्वसनीय लेकिन हल्का मानें: शीर्ष स्तर पर कोई नेटवर्क क्लाइंट,
सबप्रोसेस, लिसनर, डेटाबेस कनेक्शन, बैकग्राउंड वर्कर,
क्रेडेंशियल रीड या अन्य लाइव रनटाइम साइड इफ़ेक्ट नहीं होना चाहिए।

`"setup-runtime"` को उस विंडो के रूप में मानें, जहाँ केवल-सेटअप स्टार्टअप सतहें
पूर्ण बंडल किए गए चैनल रनटाइम में दोबारा प्रवेश किए बिना मौजूद होनी चाहिए।
उपयुक्त विकल्प चैनल पंजीकरण, सेटअप-सुरक्षित HTTP रूट, सेटअप-सुरक्षित Gateway विधियाँ
और प्रत्यायोजित सेटअप सहायक हैं। भारी बैकग्राउंड सेवाएँ, CLI रजिस्ट्रार और
प्रोवाइडर/क्लाइंट SDK बूटस्ट्रैप अब भी `"full"` में होने चाहिए।

## Plugin स्वरूप

OpenClaw लोड किए गए Plugin को उनके पंजीकरण व्यवहार के आधार पर वर्गीकृत करता है:

| स्वरूप                 | विवरण                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | एक क्षमता प्रकार (उदा. केवल प्रोवाइडर)           |
| **hybrid-capability** | एकाधिक क्षमता प्रकार (उदा. प्रोवाइडर + स्पीच) |
| **hook-only**         | केवल हुक, कोई क्षमता नहीं                        |
| **non-capability**    | टूल/कमांड/सेवाएँ, लेकिन कोई क्षमता नहीं        |

किसी Plugin का स्वरूप देखने के लिए `openclaw plugins inspect <id>` का उपयोग करें।

## संबंधित

- [SDK अवलोकन](/hi/plugins/sdk-overview) - पंजीकरण API और सबपाथ संदर्भ
- [रनटाइम सहायक](/hi/plugins/sdk-runtime) - `api.runtime` और `createPluginRuntimeStore`
- [सेटअप और कॉन्फ़िगरेशन](/hi/plugins/sdk-setup) - मैनिफ़ेस्ट, सेटअप एंट्री, स्थगित लोडिंग
- [चैनल Plugin](/hi/plugins/sdk-channel-plugins) - `ChannelPlugin` ऑब्जेक्ट बनाना
- [प्रोवाइडर Plugin](/hi/plugins/sdk-provider-plugins) - प्रोवाइडर पंजीकरण और हुक
