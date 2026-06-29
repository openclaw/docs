---
read_when:
    - आपको `defineToolPlugin`, `definePluginEntry`, या `defineChannelPluginEntry` का सटीक type signature चाहिए
    - आप पंजीकरण मोड (पूर्ण बनाम सेटअप बनाम CLI मेटाडेटा) समझना चाहते हैं
    - आप एंट्री पॉइंट विकल्प खोज रहे हैं
sidebarTitle: Entry Points
summary: defineToolPlugin, definePluginEntry, defineChannelPluginEntry, और defineSetupPluginEntry के लिए संदर्भ
title: Plugin प्रवेश बिंदु
x-i18n:
    generated_at: "2026-06-28T23:51:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

हर Plugin एक डिफ़ॉल्ट एंट्री ऑब्जेक्ट एक्सपोर्ट करता है। SDK उन्हें
बनाने के लिए सहायक प्रदान करता है।

इंस्टॉल किए गए plugins के लिए, उपलब्ध होने पर `package.json` को रनटाइम लोडिंग को बने हुए
JavaScript की ओर इंगित करना चाहिए:

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

`extensions` और `setupEntry` workspace और git
checkout विकास के लिए वैध स्रोत एंट्री बने रहते हैं। जब OpenClaw कोई इंस्टॉल किया गया पैकेज लोड करता है, तब `runtimeExtensions` और `runtimeSetupEntry` को प्राथमिकता दी जाती है
और npm पैकेजों को रनटाइम
TypeScript compilation से बचने देते हैं। स्पष्ट रनटाइम एंट्री आवश्यक हैं: `runtimeSetupEntry`
के लिए `setupEntry` आवश्यक है, और गायब `runtimeExtensions` या `runtimeSetupEntry`
artifacts स्रोत पर चुपचाप वापस जाने के बजाय install/discovery में विफल होते हैं। यदि
कोई इंस्टॉल किया गया पैकेज केवल TypeScript स्रोत एंट्री घोषित करता है, तो OpenClaw
मिलान करने वाले बने हुए `dist/*.js` peer का उपयोग करेगा, जब वह मौजूद हो, फिर TypeScript
स्रोत पर वापस जाएगा।

सभी एंट्री paths को plugin पैकेज directory के अंदर ही रहना चाहिए। रनटाइम एंट्री
और अनुमानित बने हुए JavaScript peers किसी बाहर निकलने वाले `extensions` या
`setupEntry` स्रोत path को वैध नहीं बनाते।

<Tip>
  **वॉकथ्रू खोज रहे हैं?** चरण-दर-चरण guides के लिए [Tool Plugins](/hi/plugins/tool-plugins),
  [Channel Plugins](/hi/plugins/sdk-channel-plugins), या
  [Provider Plugins](/hi/plugins/sdk-provider-plugins) देखें।
</Tip>

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

सरल plugins के लिए जो केवल agent tools जोड़ते हैं। `defineToolPlugin`
authoring source को छोटा रखता है, TypeBox schemas से config और tool parameter types का अनुमान लगाता है, साधारण return values को OpenClaw tool-result format में wrap करता है, और
static metadata expose करता है जिसे `openclaw plugins build` plugin
manifest में लिखता है।

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
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` वैकल्पिक है। छोड़े जाने पर, OpenClaw strict empty object
  schema का उपयोग करता है और generated manifest में फिर भी `configSchema` शामिल होता है।
- `execute` साधारण string या JSON-serializable value लौटाता है। helper
  इसे `details` के साथ text tool result के रूप में wrap करता है।
- Tool names static होते हैं। `openclaw plugins build` घोषित tools से `contracts.tools`
  निकालता है, इसलिए authors को names हाथ से duplicate नहीं करने पड़ते।
- Runtime loading strict रहती है। इंस्टॉल किए गए plugins को अभी भी
  `openclaw.plugin.json` और `package.json` `openclaw.extensions` चाहिए; OpenClaw
  गायब manifest data का अनुमान लगाने के लिए plugin code execute नहीं करता।

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Provider plugins, advanced tool plugins, hook plugins, और ऐसी किसी भी चीज़ के लिए जो
messaging channel **नहीं** है।

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| फ़ील्ड          | प्रकार                                                            | आवश्यक | डिफ़ॉल्ट             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | हाँ      | -                   |
| `name`         | `string`                                                         | हाँ      | -                   |
| `description`  | `string`                                                         | हाँ      | -                   |
| `kind`         | `string`                                                         | नहीं     | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | नहीं     | Empty object schema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | हाँ      | -                   |

- `id` को आपके `openclaw.plugin.json` manifest से मेल खाना चाहिए।
- `kind` exclusive slots के लिए है: `"memory"` या `"context-engine"`।
- `configSchema` lazy evaluation के लिए function हो सकता है।
- OpenClaw पहली access पर उस schema को resolve और memoize करता है, इसलिए महंगे schema
  builders केवल एक बार चलते हैं।

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

`definePluginEntry` को channel-specific wiring के साथ wrap करता है। अपने-आप
`api.registerChannel({ plugin })` call करता है, वैकल्पिक root-help CLI metadata
seam expose करता है, और `registerFull` को registration mode पर gate करता है।

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

| फ़ील्ड                 | प्रकार                                                            | आवश्यक | डिफ़ॉल्ट             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | हाँ      | -                   |
| `name`                | `string`                                                         | हाँ      | -                   |
| `description`         | `string`                                                         | हाँ      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | हाँ      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | नहीं     | Empty object schema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | नहीं     | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | नहीं     | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | नहीं     | -                   |

- `setRuntime` registration के दौरान call किया जाता है ताकि आप runtime reference
  store कर सकें (आमतौर पर `createPluginRuntimeStore` के जरिए)। CLI metadata
  capture के दौरान इसे skip किया जाता है।
- `registerCliMetadata` `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, और
  `api.registrationMode === "full"` के दौरान चलता है।
  इसे channel-owned CLI descriptors के canonical स्थान के रूप में उपयोग करें, ताकि root help
  non-activating रहे, discovery snapshots में static command metadata शामिल हो, और
  normal CLI command registration full plugin loads के साथ compatible रहे।
- Discovery registration non-activating है, import-free नहीं। OpenClaw
  snapshot बनाने के लिए trusted plugin entry और channel plugin module evaluate कर सकता है,
  इसलिए top-level imports को side-effect-free रखें और sockets,
  clients, workers, और services को `"full"`-only paths के पीछे रखें।
- `registerFull` केवल तब चलता है जब `api.registrationMode === "full"`। setup-only loading
  के दौरान इसे skip किया जाता है।
- `definePluginEntry` की तरह, `configSchema` lazy factory हो सकता है और OpenClaw
  पहली access पर resolved schema को memoize करता है।
- Plugin-owned root CLI commands के लिए, जब आप चाहते हैं कि command root CLI parse tree से गायब हुए बिना lazy-loaded रहे, तो `api.registerCli(..., { descriptors: [...] })`
  को प्राथमिकता दें। paired-node feature commands के लिए,
  `api.registerNodeCliFeature(...)` को प्राथमिकता दें ताकि command `openclaw nodes` के नीचे आए।
  अन्य nested plugin commands के लिए, `parentPath` जोड़ें और registrar को दिए गए
  `program` object पर commands register करें; OpenClaw plugin को call करने से पहले इसे
  parent command में resolve करता है। channel plugins के लिए,
  उन descriptors को `registerCliMetadata(...)` से register करना पसंद करें और
  `registerFull(...)` को runtime-only work पर केंद्रित रखें।
- यदि `registerFull(...)` gateway RPC methods भी register करता है, तो उन्हें
  plugin-specific prefix पर रखें। Reserved core admin namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) हमेशा
  `operator.admin` में coerced किए जाते हैं।

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

हल्की `setup-entry.ts` file के लिए। बिना runtime या CLI wiring के केवल `{ plugin }`
लौटाता है।

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

जब कोई channel disabled, unconfigured हो, या deferred loading enabled हो, तब OpenClaw
full entry के बजाय इसे load करता है। यह कब मायने रखता है, इसके लिए
[Setup and Config](/hi/plugins/sdk-setup#setup-entry) देखें।

व्यवहार में, `defineSetupPluginEntry(...)` को संकीर्ण setup helper
families के साथ pair करें:

- runtime-safe setup helpers जैसे
  `createSetupTranslator`, import-safe setup patch adapters, lookup-note output,
  `promptResolvedAllowFrom`, `splitSetupEntries`, और delegated setup proxies के लिए
  `openclaw/plugin-sdk/setup-runtime`
- optional-install setup surfaces के लिए `openclaw/plugin-sdk/channel-setup`
- setup/install CLI/archive/docs helpers के लिए `openclaw/plugin-sdk/setup-tools`

भारी SDKs, CLI registration, और long-lived runtime services को full
entry में रखें।

Bundled workspace channels जो setup और runtime surfaces को split करते हैं, वे इसके बजाय
`openclaw/plugin-sdk/channel-entry-contract` से
`defineBundledChannelSetupEntry(...)` का उपयोग कर सकते हैं। वह contract
setup entry को setup-safe plugin/secrets exports रखने देता है, जबकि फिर भी
runtime setter expose करता है:

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
        /* setup-safe route */
      },
    });
  },
});
```

उस bundled contract का उपयोग केवल तब करें जब setup flows को full channel entry load होने से पहले सचमुच हल्के runtime
setter या setup-safe gateway surface की आवश्यकता हो।
`registerSetupRuntime` केवल `"setup-runtime"` loads के लिए चलता है; इसे
config-only routes या उन methods तक सीमित रखें जिन्हें deferred full activation से पहले मौजूद होना चाहिए।

## Registration mode

`api.registrationMode` आपके plugin को बताता है कि उसे कैसे load किया गया था:

| मोड              | कब                              | क्या रजिस्टर करना है                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | सामान्य Gateway स्टार्टअप            | सब कुछ                                                                                                              |
| `"discovery"`     | रीड-ओनली क्षमता खोज    | चैनल रजिस्ट्रेशन और स्थिर CLI डिस्क्रिप्टर; एंट्री कोड लोड हो सकता है, लेकिन सॉकेट, वर्कर, क्लाइंट और सेवाएं छोड़ें |
| `"setup-only"`    | अक्षम/अकॉन्फ़िगर किया गया चैनल     | केवल चैनल रजिस्ट्रेशन                                                                                               |
| `"setup-runtime"` | रनटाइम उपलब्ध होने वाला सेटअप फ़्लो | चैनल रजिस्ट्रेशन और पूर्ण एंट्री लोड होने से पहले आवश्यक केवल हल्का रनटाइम                               |
| `"cli-metadata"`  | रूट सहायता / CLI मेटाडेटा कैप्चर  | केवल CLI डिस्क्रिप्टर                                                                                                    |

`defineChannelPluginEntry` इस विभाजन को अपने-आप संभालता है। यदि आप किसी चैनल के लिए
सीधे `definePluginEntry` का उपयोग करते हैं, तो मोड खुद जांचें:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

डिस्कवरी मोड एक गैर-सक्रिय रजिस्ट्री स्नैपशॉट बनाता है। यह फिर भी
Plugin एंट्री और चैनल Plugin ऑब्जेक्ट का मूल्यांकन कर सकता है ताकि OpenClaw चैनल
क्षमताएं और स्थिर CLI डिस्क्रिप्टर रजिस्टर कर सके। डिस्कवरी में मॉड्यूल मूल्यांकन को
विश्वसनीय लेकिन हल्का मानें: शीर्ष स्तर पर कोई नेटवर्क क्लाइंट, सबप्रोसेस, लिस्नर, डेटाबेस
कनेक्शन, बैकग्राउंड वर्कर, क्रेडेंशियल रीड या अन्य लाइव रनटाइम साइड
इफ़ेक्ट न हों।

`"setup-runtime"` को वह विंडो मानें जहां सेटअप-ओनली स्टार्टअप सरफ़ेस
पूर्ण बंडल किए गए चैनल रनटाइम में दोबारा प्रवेश किए बिना मौजूद होने चाहिए। अच्छे विकल्प हैं
चैनल रजिस्ट्रेशन, सेटअप-सुरक्षित HTTP रूट, सेटअप-सुरक्षित Gateway मेथड और
डेलीगेट किए गए सेटअप हेल्पर। भारी बैकग्राउंड सेवाएं, CLI रजिस्ट्रार और
प्रोवाइडर/क्लाइंट SDK बूटस्ट्रैप अब भी `"full"` में ही आते हैं।

CLI रजिस्ट्रार के लिए विशेष रूप से:

- जब रजिस्ट्रार एक या अधिक रूट कमांड का स्वामी हो और आप चाहते हों कि
  OpenClaw पहली बार चलाने पर असली CLI मॉड्यूल को लेज़ी-लोड करे, तब `descriptors` का उपयोग करें
- सुनिश्चित करें कि वे डिस्क्रिप्टर रजिस्ट्रार द्वारा उजागर किए गए हर टॉप-लेवल कमांड रूट को कवर करते हों
- डिस्क्रिप्टर कमांड नामों को अक्षरों, संख्याओं, हाइफ़न और अंडरस्कोर तक सीमित रखें,
  और उन्हें किसी अक्षर या संख्या से शुरू करें; OpenClaw इस आकार से बाहर के डिस्क्रिप्टर नामों को अस्वीकार करता है
  और सहायता रेंडर करने से पहले विवरणों से टर्मिनल कंट्रोल सीक्वेंस हटा देता है
- केवल उत्सुक संगतता पाथ के लिए ही `commands` अकेले उपयोग करें

## Plugin आकार

OpenClaw लोड किए गए plugins को उनके रजिस्ट्रेशन व्यवहार के आधार पर वर्गीकृत करता है:

| आकार                 | विवरण                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | एक क्षमता प्रकार (जैसे केवल-प्रोवाइडर)           |
| **hybrid-capability** | कई क्षमता प्रकार (जैसे प्रोवाइडर + स्पीच) |
| **hook-only**         | केवल हुक, कोई क्षमताएं नहीं                        |
| **non-capability**    | टूल/कमांड/सेवाएं, लेकिन कोई क्षमताएं नहीं        |

किसी plugin का आकार देखने के लिए `openclaw plugins inspect <id>` का उपयोग करें।

## संबंधित

- [SDK अवलोकन](/hi/plugins/sdk-overview) - रजिस्ट्रेशन API और सबपाथ संदर्भ
- [रनटाइम हेल्पर](/hi/plugins/sdk-runtime) - `api.runtime` और `createPluginRuntimeStore`
- [सेटअप और कॉन्फ़िग](/hi/plugins/sdk-setup) - मैनिफ़ेस्ट, सेटअप एंट्री, स्थगित लोडिंग
- [चैनल Plugins](/hi/plugins/sdk-channel-plugins) - `ChannelPlugin` ऑब्जेक्ट बनाना
- [प्रोवाइडर Plugins](/hi/plugins/sdk-provider-plugins) - प्रोवाइडर रजिस्ट्रेशन और हुक
