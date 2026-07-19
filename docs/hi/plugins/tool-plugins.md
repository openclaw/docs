---
read_when:
    - आप एक सरल OpenClaw Plugin बनाना चाहते हैं जो केवल एजेंट टूल जोड़ता है
    - आप Plugin मैनिफ़ेस्ट मेटाडेटा को हाथ से लिखने के बजाय defineToolPlugin का उपयोग करना चाहते हैं
    - आपको केवल टूल वाला Plugin स्कैफ़ोल्ड, जनरेट, सत्यापित, परीक्षण या प्रकाशित करना है
sidebarTitle: Tool Plugins
summary: defineToolPlugin और openclaw plugins init/build/validate के साथ सरल टाइप किए गए एजेंट टूल बनाएँ
title: टूल Plugin
x-i18n:
    generated_at: "2026-07-19T09:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6363ccc810e969e1efa2aa0b4208f27244f01db196713fc2dc25cf106b86429
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` एक ऐसा plugin बनाता है जो केवल एजेंट द्वारा कॉल किए जा सकने वाले टूल जोड़ता है: कोई
चैनल, मॉडल प्रदाता, हुक, सेवा या सेटअप बैकएंड नहीं। यह वह
मैनिफ़ेस्ट मेटाडेटा जनरेट करता है जिसकी OpenClaw को plugin
रनटाइम कोड लोड किए बिना टूल खोजने के लिए आवश्यकता होती है।

प्रदाता, चैनल, हुक, सेवा या मिश्रित-क्षमता वाले plugins के लिए, इसके बजाय
[Plugins बनाना](/hi/plugins/building-plugins), [चैनल Plugins](/hi/plugins/sdk-channel-plugins),
या [प्रदाता Plugins](/hi/plugins/sdk-provider-plugins) से शुरू करें।

## आवश्यकताएँ

- Node 22.22.3+, Node 24.15+, या Node 25.9+।
- TypeScript ESM पैकेज आउटपुट।
- `typebox`, `dependencies` में (केवल `devDependencies` में नहीं—जनरेट किया गया
  plugin इसे रनटाइम पर इम्पोर्ट करता है)।
- `openclaw >=2026.5.17`, पहला संस्करण जो
  `openclaw/plugin-sdk/tool-plugin` एक्सपोर्ट करता है।
- एक पैकेज रूट जो `dist/`, `openclaw.plugin.json`, और
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

`plugins init` निम्नलिखित स्कैफ़ोल्ड करता है:

| फ़ाइल                   | उद्देश्य                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | एक `echo` टूल वाली `defineToolPlugin` एंट्री                     |
| `src/index.test.ts`    | टूल सूची की पुष्टि करने वाला मेटाडेटा परीक्षण                             |
| `tsconfig.json`        | `dist/` में NodeNext TypeScript आउटपुट                             |
| `vitest.config.ts`     | `src/**/*.test.ts` के लिए Vitest कॉन्फ़िगरेशन                              |
| `package.json`         | स्क्रिप्ट, रनटाइम निर्भरताएँ, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | प्रारंभिक टूल के लिए जनरेट किया गया मैनिफ़ेस्ट मेटाडेटा                  |

`npm run plugin:build`, `npm run build` (tsc) और फिर
`openclaw plugins build --entry ./dist/index.js` चलाता है। `npm run plugin:validate`
दोबारा बिल्ड करता है और `openclaw plugins validate --entry ./dist/index.js` चलाता है।
सफल सत्यापन यह प्रिंट करता है:

```text
Plugin stock-quotes मान्य है।
```

`openclaw plugins init <id>` विकल्प:

| फ़्लैग                 | डिफ़ॉल्ट            | प्रभाव                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | आउटपुट डायरेक्टरी                       |
| `--name <name>`      | शीर्षक-केस वाला `<id>` | प्रदर्शन नाम                           |
| `--type <type>`      | `tool`             | स्कैफ़ोल्ड प्रकार: `tool` या `provider`    |
| `--force`            | बंद                | मौजूदा आउटपुट डायरेक्टरी को ओवरराइट करें |

## टूल लिखें

`defineToolPlugin` plugin पहचान, एक वैकल्पिक कॉन्फ़िगरेशन स्कीमा और
टूल की एक स्थिर सूची लेता है। पैरामीटर और कॉन्फ़िगरेशन प्रकार
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
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          configured: Type.Boolean(),
          baseUrl: Type.String(),
        },
        { additionalProperties: false },
      ),
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

टूल नाम स्थिर API हैं। ऐसे नाम चुनें जो अद्वितीय, लोअरकेस और
कोर टूल या अन्य plugins के साथ टकराव से बचने के लिए पर्याप्त विशिष्ट हों।

## वैकल्पिक और फ़ैक्टरी टूल

जब उपयोगकर्ताओं को टूल को मॉडल को भेजे जाने से पहले स्पष्ट रूप से अनुमत सूची में जोड़ना चाहिए, तब `optional: true` सेट करें।
`openclaw plugins build` मेल खाती हुई
`toolMetadata.<tool>.optional` मैनिफ़ेस्ट एंट्री लिखता है, ताकि OpenClaw plugin रनटाइम कोड लोड किए बिना
देख सके कि टूल वैकल्पिक है।

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

जब किसी टूल को बनाए जाने से पहले रनटाइम टूल संदर्भ की आवश्यकता हो—किसी विशिष्ट रन से बाहर रहने, सैंडबॉक्स स्थिति जाँचने या
रनटाइम हेल्पर बाँधने के लिए—तब `factory` का उपयोग करें। भले ही वास्तविक टूल
रनटाइम पर बनाया जाता है, मेटाडेटा स्थिर रहता है।

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

फ़ैक्टरियाँ फिर भी पहले से एक निश्चित टूल नाम घोषित करती हैं। जब plugin टूल नाम
गतिशील रूप से गणना करता है या टूल को हुक, सेवाओं, प्रदाताओं या कमांड के साथ जोड़ता है,
तब सीधे `definePluginEntry` का उपयोग करें।

## वापसी मान

`defineToolPlugin` सामान्य वापसी मानों को OpenClaw टूल-परिणाम
प्रारूप में लपेटता है:

- जब मॉडल को वही सटीक टेक्स्ट दिखना चाहिए, तब एक स्ट्रिंग लौटाएँ।
- जब आप चाहते हैं कि मॉडल फ़ॉर्मैट किया हुआ JSON देखे
  और OpenClaw मूल मान को `details` में रखे, तब JSON-संगत मान लौटाएँ।

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

जब आपको कस्टम `AgentToolResult` की आवश्यकता हो या किसी मौजूदा
`api.registerTool` कार्यान्वयन का पुनः उपयोग करना हो, तब फ़ैक्टरी टूल का उपयोग करें।

## आउटपुट अनुबंध

जब कोई टूल स्थिर JSON-संगत डेटा लौटाता है, तब `outputSchema` जोड़ें। यह
`AgentToolResult.details` में संग्रहीत मूल मान का वर्णन करता है, न कि
`content` में फ़ॉर्मैट किए गए टेक्स्ट का:

```typescript
tool({
  name: "shipment_list",
  description: "List shipments.",
  parameters: Type.Object({
    buyer: Type.Optional(Type.String()),
  }),
  outputSchema: Type.Array(
    Type.Object(
      {
        id: Type.String(),
        buyer: Type.String(),
        paid: Type.Boolean(),
        tons: Type.Number(),
      },
      { additionalProperties: false },
    ),
  ),
  execute: ({ buyer }) => listShipments(buyer),
});
```

[कोड मोड](/tools/code-mode) और [टूल खोज](/hi/tools/tool-search) इस
स्कीमा को सीमित TypeScript-शैली के आउटपुट संकेत में बदलते हैं। इससे मॉडल
परिणाम का आकार देखने के लिए एक और मॉडल टर्न खर्च करने के बजाय, एक ही प्रोग्राम में
ज्ञात परिणाम को कॉल और रूपांतरित कर सकता है।

OpenClaw कैटलॉग कॉल निष्पादित करने से पहले स्कीमा को कंपाइल करता है, फिर ब्रिज के माध्यम से
लौटाने से पहले टूल हुक के बाद अंतिम `details` मान को सत्यापित करता है।
अमान्य स्कीमा टूल को चला नहीं सकता; परिणाम का बेमेल होना पूर्ण हुई
कॉल को विफल कर देता है। संरचित त्रुटि प्रकारों सहित, प्रत्येक बिना-थ्रो वाले परिणाम प्रकार को
शामिल करें या परिणाम स्थिर न होने पर स्कीमा छोड़ दें। स्कीमा विवरण में सीक्रेट
या संवेदनशील मान न रखें, क्योंकि विश्वसनीय आउटपुट मेटाडेटा
मॉडल को दिखाई दे सकता है।
जब आप पूर्ण संक्षिप्त आउटपुट संकेत चाहते हैं, तब ऑब्जेक्ट परतों पर `{ additionalProperties: false }` का उपयोग करें;
खुले या संक्षिप्त किए गए स्कीमा `tools.describe(...)` के माध्यम से उपलब्ध रहते हैं,
लेकिन उन्हें पूर्ण त्वरित-इंडेक्स अनुबंधों के रूप में विज्ञापित नहीं किया जाता।

फ़ैक्टरी टूल अपने द्वारा लौटाए गए वास्तविक `AnyAgentTool` पर `outputSchema` घोषित करते हैं।
स्थिर `tool({ factory })` घोषणा अलग आउटपुट स्कीमा स्वीकार नहीं करती,
क्योंकि वह रनटाइम टूल से भटक सकती है।

## कॉन्फ़िगरेशन

`configSchema` वैकल्पिक है। इसे छोड़ दें और OpenClaw एक सख़्त खाली ऑब्जेक्ट
स्कीमा लागू करता है; जनरेट किए गए मैनिफ़ेस्ट में फिर भी `configSchema` शामिल रहता है।

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

`configSchema` के साथ, दूसरा `execute` आर्ग्युमेंट उससे टाइप किया जाता है:

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
स्रोत या दस्तावेज़ उदाहरणों में सीक्रेट हार्ड-कोड न करें; plugin के सुरक्षा मॉडल के अनुसार
कॉन्फ़िगरेशन, पर्यावरण चर या SecretRefs का उपयोग करें।

## जनरेट किया गया मेटाडेटा

OpenClaw को plugin रनटाइम कोड इम्पोर्ट करने से पहले plugin मैनिफ़ेस्ट पढ़ना चाहिए।
`defineToolPlugin` इसके लिए स्थिर मेटाडेटा उजागर करता है, और
`openclaw plugins build` इसे पैकेज में लिखता है। plugin आईडी, नाम, विवरण,
कॉन्फ़िगरेशन स्कीमा, सक्रियण या टूल नाम बदलने के बाद जनरेटर दोबारा चलाएँ:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

एक-टूल वाले plugin के लिए जनरेट किया गया मैनिफ़ेस्ट:

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

`contracts.tools` महत्वपूर्ण खोज अनुबंध है: यह प्रत्येक इंस्टॉल किए गए plugin का रनटाइम
लोड किए बिना OpenClaw को बताता है कि प्रत्येक टूल का स्वामी कौन-सा plugin है।
पुराने मैनिफ़ेस्ट का अर्थ है कि कोई टूल खोज से गायब हो सकता है, या पंजीकरण
त्रुटि के लिए गलत plugin को दोषी ठहराया जा सकता है।

## पैकेज मेटाडेटा

`openclaw plugins build`, `package.json` को चयनित रनटाइम
एंट्री के अनुरूप भी करता है:

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

बिल्ड किया हुआ JavaScript (`./dist/index.js`) वितरित करें, TypeScript स्रोत एंट्री नहीं।
स्रोत एंट्रियाँ केवल वर्कस्पेस-स्थानीय विकास के लिए काम करती हैं।

## CI में सत्यापित करें

जब जनरेट किया गया मेटाडेटा पुराना होता है, तब `plugins build --check` फ़ाइलें दोबारा लिखे बिना
विफल हो जाता है:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` जाँचता है कि:

- `openclaw.plugin.json` मौजूद है और सामान्य मैनिफ़ेस्ट लोडर से पास होता है।
- वर्तमान एंट्री `defineToolPlugin` मेटाडेटा एक्सपोर्ट करती है।
- जनरेट किए गए मैनिफ़ेस्ट फ़ील्ड एंट्री मेटाडेटा से मेल खाते हैं।
- `contracts.tools` घोषित टूल नामों से मेल खाता है।
- `package.json`, `openclaw.extensions` को चयनित रनटाइम एंट्री की ओर इंगित करता है।

## स्थानीय रूप से इंस्टॉल और निरीक्षण करें

किसी अलग OpenClaw चेकआउट या इंस्टॉल किए गए CLI से, पैकेज पथ इंस्टॉल करें:

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

इंस्टॉल करने के बाद, Gateway को पुनः आरंभ या रीलोड करें और एजेंट से इस
टूल का उपयोग करने को कहें। यदि टूल दिखाई नहीं देता है, तो कोड बदलने से पहले Plugin रनटाइम और प्रभावी
टूल कैटलॉग का निरीक्षण करें ([समस्या निवारण](#troubleshooting) देखें)।

## प्रकाशित करना

पैकेज तैयार होने के बाद उसे ClawHub के माध्यम से प्रकाशित करें। `clawhub package publish`
एक स्रोत लेता है: एक स्थानीय फ़ोल्डर, एक GitHub रेपो (`owner/repo[@ref]`), या एक
टारबॉल URL।

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

स्पष्ट ClawHub लोकेटर के साथ इंस्टॉल करें:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

लॉन्च परिवर्तन के दौरान केवल npm पैकेज स्पेक अब भी npm से इंस्टॉल होते हैं, लेकिन
OpenClaw plugins के लिए ClawHub पसंदीदा खोज और वितरण माध्यम है।
स्वामी के दायरे और रिलीज़ समीक्षा के लिए [ClawHub प्रकाशन](/hi/clawhub/publishing) देखें।

## समस्या निवारण

### `plugin entry not found: ./dist/index.js`

चयनित एंट्री फ़ाइल मौजूद नहीं है। `npm run build` चलाएँ, फिर
`openclaw plugins build --entry ./dist/index.js` या
`openclaw plugins validate --entry ./dist/index.js` फिर से चलाएँ।

### `plugin entry does not expose defineToolPlugin metadata`

एंट्री ने `defineToolPlugin` द्वारा बनाया गया मान एक्सपोर्ट नहीं किया। पुष्टि करें कि
मॉड्यूल का डिफ़ॉल्ट एक्सपोर्ट `defineToolPlugin(...)` परिणाम है, या
`--entry` के साथ सही एंट्री प्रदान करें।

### `openclaw.plugin.json generated metadata is stale`

मैनिफ़ेस्ट अब एंट्री मेटाडेटा से मेल नहीं खाता। चलाएँ:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` और `package.json`, दोनों के परिवर्तन कमिट करें।

### `package.json openclaw.extensions must include ./dist/index.js`

पैकेज मेटाडेटा किसी अलग रनटाइम एंट्री की ओर संकेत करता है। `openclaw plugins build --entry ./dist/index.js`
चलाएँ, ताकि जनरेटर पैकेज मेटाडेटा को उस एंट्री के अनुरूप कर सके जिसे आप शिप करना चाहते हैं।

### `Cannot find package 'typebox'`

बिल्ट Plugin रनटाइम पर `typebox` को इम्पोर्ट करता है। इसे `dependencies` में रखें,
फिर से इंस्टॉल करें, दोबारा बिल्ड करें और सत्यापन फिर से चलाएँ।

### इंस्टॉल करने के बाद टूल दिखाई नहीं देता

इनकी इसी क्रम में जाँच करें:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` में अपेक्षित टूल नामों वाला `contracts.tools` है।
4. `package.json` में `openclaw.extensions: ["./dist/index.js"]` है।
5. Plugin इंस्टॉल करने के बाद Gateway को पुनः आरंभ या रीलोड किया गया था।

## यह भी देखें

- [Plugins बनाना](/hi/plugins/building-plugins)
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints)
- [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths)
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest)
- [Plugins CLI](/hi/cli/plugins)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
