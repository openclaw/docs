---
read_when:
    - आप एक सरल OpenClaw Plugin बनाना चाहते हैं जो केवल एजेंट टूल जोड़ता है
    - आप Plugin मैनिफ़ेस्ट मेटाडेटा को हाथ से लिखने के बजाय defineToolPlugin का उपयोग करना चाहते हैं
    - आपको केवल-टूल Plugin का ढाँचा बनाना, उसे जनरेट करना, सत्यापित करना, परीक्षण करना या प्रकाशित करना है
sidebarTitle: Tool Plugins
summary: defineToolPlugin और openclaw plugins init/build/validate के साथ सरल टाइप किए गए एजेंट टूल बनाएँ
title: टूल Plugin
x-i18n:
    generated_at: "2026-07-16T16:47:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` ऐसा plugin बनाता है जो केवल एजेंट द्वारा कॉल किए जा सकने वाले टूल जोड़ता है: कोई
चैनल, मॉडल प्रदाता, हुक, सेवा या सेटअप बैकएंड नहीं। यह वह
मैनिफ़ेस्ट मेटाडेटा जनरेट करता है जिसकी OpenClaw को plugin
रनटाइम कोड लोड किए बिना टूल खोजने के लिए आवश्यकता होती है।

प्रदाता, चैनल, हुक, सेवा या मिश्रित-क्षमता वाले plugins के लिए, इसके बजाय
[Plugins बनाना](/hi/plugins/building-plugins), [चैनल Plugins](/hi/plugins/sdk-channel-plugins),
या [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins) से शुरू करें।

## आवश्यकताएँ

- Node 22.22.3+, Node 24.15+, या Node 25.9+।
- TypeScript ESM पैकेज आउटपुट।
- `typebox` को `dependencies` में रखें (केवल `devDependencies` में नहीं—जनरेट किया गया
  plugin इसे रनटाइम पर इंपोर्ट करता है)।
- `openclaw >=2026.5.17`, पहला संस्करण जो
  `openclaw/plugin-sdk/tool-plugin` एक्सपोर्ट करता है।
- ऐसा पैकेज रूट जो `dist/`, `openclaw.plugin.json`, और
  `package.json` वितरित करता है।

## त्वरित शुरुआत

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` निम्न फ़ाइलें तैयार करता है:

| फ़ाइल                   | उद्देश्य                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | एक `echo` टूल वाली `defineToolPlugin` एंट्री                     |
| `src/index.test.ts`    | टूल सूची की पुष्टि करने वाला मेटाडेटा परीक्षण                             |
| `tsconfig.json`        | `dist/` में NodeNext TypeScript आउटपुट                             |
| `vitest.config.ts`     | `src/**/*.test.ts` के लिए Vitest कॉन्फ़िगरेशन                              |
| `package.json`         | स्क्रिप्ट, रनटाइम निर्भरताएँ, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | आरंभिक टूल के लिए जनरेट किया गया मैनिफ़ेस्ट मेटाडेटा                  |

`npm run plugin:build`, `npm run build` (tsc) और फिर
`openclaw plugins build --entry ./dist/index.js` चलाता है। `npm run plugin:validate`
दोबारा बिल्ड करता है और `openclaw plugins validate --entry ./dist/index.js` चलाता है।
सफल सत्यापन में यह दिखाई देता है:

```text
Plugin stock-quotes मान्य है।
```

`openclaw plugins init <id>` विकल्प:

| फ़्लैग                 | डिफ़ॉल्ट            | प्रभाव                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | आउटपुट डायरेक्टरी                       |
| `--name <name>`      | शीर्षक-शैली वाला `<id>` | प्रदर्शन नाम                           |
| `--type <type>`      | `tool`             | स्कैफ़ोल्ड प्रकार: `tool` या `provider`    |
| `--force`            | बंद                | मौजूदा आउटपुट डायरेक्टरी को अधिलेखित करें |

## टूल लिखें

`defineToolPlugin` plugin की पहचान, एक वैकल्पिक कॉन्फ़िगरेशन स्कीमा और
टूल की स्थिर सूची लेता है। पैरामीटर और कॉन्फ़िगरेशन प्रकार
TypeBox स्कीमा से अनुमानित किए जाते हैं।

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

टूल के नाम स्थिर API हैं। ऐसे नाम चुनें जो अद्वितीय, लोअरकेस और
इतने विशिष्ट हों कि मुख्य टूल या अन्य plugins के साथ टकराव से बचा जा सके।

## वैकल्पिक और फ़ैक्टरी टूल

जब उपयोगकर्ताओं को मॉडल को टूल भेजे जाने से पहले उसे स्पष्ट रूप से अनुमति-सूची में जोड़ना चाहिए, तब `optional: true` सेट करें।
`openclaw plugins build` उससे मेल खाने वाली
`toolMetadata.<tool>.optional` मैनिफ़ेस्ट एंट्री लिखता है, ताकि OpenClaw
plugin रनटाइम कोड लोड किए बिना देख सके कि टूल वैकल्पिक है।

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

जब किसी टूल को बनाए जाने से पहले रनटाइम टूल संदर्भ की आवश्यकता हो—किसी विशिष्ट रन से बाहर रहने,
सैंडबॉक्स स्थिति की जाँच करने या रनटाइम सहायकों को बाइंड करने के लिए—तब `factory` का उपयोग करें।
भले ही वास्तविक टूल रनटाइम पर बनाया जाए, मेटाडेटा स्थिर रहता है।

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

फ़ैक्टरियाँ फिर भी पहले से एक निश्चित टूल नाम घोषित करती हैं। जब plugin टूल नामों की
गतिशील रूप से गणना करता हो या टूल को हुक, सेवाओं, प्रदाताओं अथवा कमांड के साथ जोड़ता हो, तब सीधे `definePluginEntry`
का उपयोग करें।

## रिटर्न मान

`defineToolPlugin` सामान्य रिटर्न मानों को OpenClaw टूल-परिणाम
प्रारूप में रैप करता है:

- जब मॉडल को ठीक वही टेक्स्ट दिखना चाहिए, तब स्ट्रिंग लौटाएँ।
- जब आप मॉडल को प्रारूपित JSON दिखाना और OpenClaw को मूल मान
  `details` में बनाए रखना चाहते हों, तब JSON-संगत मान लौटाएँ।

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

जब आपको कस्टम `AgentToolResult` की आवश्यकता हो या आप किसी मौजूदा
`api.registerTool` कार्यान्वयन का पुनः उपयोग करना चाहें, तब फ़ैक्टरी टूल का उपयोग करें।

## कॉन्फ़िगरेशन

`configSchema` वैकल्पिक है। इसे छोड़ने पर OpenClaw एक सख्त खाली ऑब्जेक्ट
स्कीमा लागू करता है; जनरेट किए गए मैनिफ़ेस्ट में फिर भी `configSchema` शामिल होता है।

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

`configSchema` के साथ, दूसरे `execute` आर्ग्युमेंट का प्रकार उससे निर्धारित होता है:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw, Gateway कॉन्फ़िगरेशन में plugin की एंट्री से plugin कॉन्फ़िगरेशन पढ़ता है।
स्रोत या दस्तावेज़ उदाहरणों में सीक्रेट हार्ड-कोड न करें; plugin के सुरक्षा मॉडल के अनुसार कॉन्फ़िगरेशन,
पर्यावरण चर या SecretRefs का उपयोग करें।

## जनरेट किया गया मेटाडेटा

OpenClaw को plugin रनटाइम कोड इंपोर्ट करने से पहले plugin मैनिफ़ेस्ट पढ़ना आवश्यक है।
`defineToolPlugin` इसके लिए स्थिर मेटाडेटा उपलब्ध कराता है और
`openclaw plugins build` उसे पैकेज में लिखता है। plugin id, नाम, विवरण,
कॉन्फ़िगरेशन स्कीमा, सक्रियण या टूल नाम बदलने के बाद जनरेटर दोबारा चलाएँ:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

एक टूल वाले plugin के लिए जनरेट किया गया मैनिफ़ेस्ट:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` महत्वपूर्ण खोज अनुबंध है: यह OpenClaw को बताता है कि प्रत्येक
टूल का स्वामी कौन-सा plugin है, बिना हर इंस्टॉल किए गए plugin का रनटाइम लोड किए।
पुराने मैनिफ़ेस्ट के कारण कोई टूल खोज से गायब हो सकता है, या पंजीकरण
त्रुटि का दोष गलत plugin पर लगाया जा सकता है।

## पैकेज मेटाडेटा

`openclaw plugins build`, `package.json` को भी चुनी गई रनटाइम
एंट्री के अनुरूप करता है:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

बिल्ड किया गया JavaScript (`./dist/index.js`) वितरित करें, TypeScript स्रोत एंट्री नहीं।
स्रोत एंट्रियाँ केवल वर्कस्पेस-स्थानीय विकास के लिए काम करती हैं।

## CI में सत्यापन करें

जनरेट किया गया मेटाडेटा पुराना होने पर `plugins build --check` फ़ाइलें दोबारा लिखे बिना
विफल हो जाता है:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` जाँचता है कि:

- `openclaw.plugin.json` मौजूद है और सामान्य मैनिफ़ेस्ट लोडर से सफलतापूर्वक गुजरता है।
- वर्तमान एंट्री `defineToolPlugin` मेटाडेटा एक्सपोर्ट करती है।
- जनरेट किए गए मैनिफ़ेस्ट फ़ील्ड एंट्री मेटाडेटा से मेल खाते हैं।
- `contracts.tools` घोषित टूल नामों से मेल खाता है।
- `package.json`, `openclaw.extensions` को चुनी गई रनटाइम एंट्री की ओर इंगित करता है।

## स्थानीय रूप से इंस्टॉल और निरीक्षण करें

किसी अलग OpenClaw चेकआउट या इंस्टॉल किए गए CLI से पैकेज पथ इंस्टॉल करें:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

पैकेज्ड स्मोक परीक्षण के लिए, पहले पैक करें और टारबॉल इंस्टॉल करें:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

इंस्टॉल करने के बाद Gateway को पुनः आरंभ या रीलोड करें और एजेंट से
टूल उपयोग करने को कहें। यदि टूल दिखाई नहीं देता, तो कोड बदलने से पहले plugin रनटाइम और प्रभावी
टूल कैटलॉग का निरीक्षण करें ([समस्या निवारण](#troubleshooting) देखें)।

## प्रकाशित करें

पैकेज तैयार होने के बाद ClawHub के माध्यम से प्रकाशित करें। `clawhub package publish`
एक स्रोत लेता है: स्थानीय फ़ोल्डर, GitHub रिपॉज़िटरी (`owner/repo[@ref]`), या
टारबॉल URL।

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

स्पष्ट ClawHub लोकेटर के साथ इंस्टॉल करें:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

लॉन्च बदलाव के दौरान साधारण npm पैकेज विनिर्देश अभी भी npm से इंस्टॉल होते हैं, लेकिन
OpenClaw plugins की खोज और वितरण के लिए ClawHub पसंदीदा माध्यम है।
स्वामी स्कोप और रिलीज़ समीक्षा के लिए [ClawHub प्रकाशन](/hi/clawhub/publishing) देखें।

## समस्या निवारण

### `plugin entry not found: ./dist/index.js`

चुनी गई एंट्री फ़ाइल मौजूद नहीं है। `npm run build` चलाएँ, फिर
`openclaw plugins build --entry ./dist/index.js` या
`openclaw plugins validate --entry ./dist/index.js` दोबारा चलाएँ।

### `plugin entry does not expose defineToolPlugin metadata`

एंट्री ने `defineToolPlugin` द्वारा बनाया गया मान एक्सपोर्ट नहीं किया। पुष्टि करें कि
मॉड्यूल का डिफ़ॉल्ट एक्सपोर्ट `defineToolPlugin(...)` परिणाम है, या
`--entry` के साथ सही एंट्री पास करें।

### `openclaw.plugin.json generated metadata is stale`

मैनिफ़ेस्ट अब एंट्री मेटाडेटा से मेल नहीं खाता। चलाएँ:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` और `package.json`, दोनों के बदलाव कमिट करें।

### `package.json openclaw.extensions must include ./dist/index.js`

पैकेज मेटाडेटा किसी अलग रनटाइम एंट्री की ओर इंगित करता है।
`openclaw plugins build --entry ./dist/index.js` चलाएँ ताकि जनरेटर पैकेज मेटाडेटा को
उस एंट्री के अनुरूप करे जिसे आप वितरित करना चाहते हैं।

### `Cannot find package 'typebox'`

बिल्ड किया गया plugin रनटाइम पर `typebox` इंपोर्ट करता है। इसे `dependencies`
में रखें, दोबारा इंस्टॉल और बिल्ड करें, फिर सत्यापन दोबारा चलाएँ।

### इंस्टॉल करने के बाद टूल दिखाई नहीं देता

इनकी इसी क्रम में जाँच करें:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` में अपेक्षित टूल नामों के साथ `contracts.tools` है।
4. `package.json` में `openclaw.extensions: ["./dist/index.js"]` है।
5. Plugin इंस्टॉल करने के बाद Gateway को पुनः आरंभ या पुनः लोड किया गया था।

## यह भी देखें

- [Plugin बनाना](/hi/plugins/building-plugins)
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints)
- [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths)
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest)
- [Plugin CLI](/hi/cli/plugins)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
