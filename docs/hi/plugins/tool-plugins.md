---
read_when:
    - आप एक सरल OpenClaw Plugin बनाना चाहते हैं जो केवल एजेंट टूल जोड़ता है
    - आप Plugin मैनिफ़ेस्ट मेटाडेटा हाथ से लिखने के बजाय defineToolPlugin का उपयोग करना चाहते हैं
    - आपको केवल-टूल Plugin को स्कैफोल्ड, जनरेट, वैलिडेट, परीक्षण या प्रकाशित करना है
sidebarTitle: Tool Plugins
summary: defineToolPlugin और openclaw plugins init/build/validate के साथ सरल टाइप्ड एजेंट टूल बनाएं
title: टूल Plugin
x-i18n:
    generated_at: "2026-06-28T23:54:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Tool Plugin, OpenClaw में channel, model provider, hook, service, या setup backend जोड़े बिना agent-callable टूल जोड़ते हैं। `defineToolPlugin` का उपयोग तब करें जब
Plugin टूल की एक निश्चित सूची का स्वामी हो और आप चाहते हों कि OpenClaw वह manifest
metadata जनरेट करे जो runtime code लोड किए बिना उन टूल को खोजने योग्य बनाए रखता है।

अनुशंसित प्रवाह यह है:

1. `openclaw plugins init` के साथ package scaffold करें।
2. `defineToolPlugin` के साथ टूल लिखें।
3. JavaScript build करें।
4. `openclaw plugins build` के साथ `openclaw.plugin.json` और `package.json` metadata
   जनरेट करें।
5. प्रकाशित या इंस्टॉल करने से पहले जनरेट किए गए metadata को validate करें।

provider, channel, hook, service, या mixed-capability Plugins के लिए, इसके बजाय
[Building plugins](/hi/plugins/building-plugins), [Channel Plugins](/hi/plugins/sdk-channel-plugins),
या [Provider Plugins](/hi/plugins/sdk-provider-plugins) से शुरू करें।

## आवश्यकताएँ

- Node >= 22.
- TypeScript ESM package output.
- config और tool parameter schemas के लिए `typebox`.
- `openclaw >=2026.5.17`, पहला OpenClaw version जो
  `openclaw/plugin-sdk/tool-plugin` export करता है।
- ऐसा package root जो `dist/`, `openclaw.plugin.json`, और
  `package.json` ship कर सके।

जनरेट किया गया Plugin runtime पर `typebox` import करता है, इसलिए `typebox` को
सिर्फ `devDependencies` में नहीं, बल्कि `dependencies` में रखें।

## Quickstart

नया Plugin package बनाएँ:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

scaffold बनाता है:

- `src/index.ts`: `echo` tool के साथ एक `defineToolPlugin` entry.
- `src/index.test.ts`: एक छोटा metadata test.
- `tsconfig.json`: `dist/` में NodeNext TypeScript output.
- `package.json`: scripts, runtime dependencies, और
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: शुरुआती tool के लिए जनरेट किया गया manifest metadata.

अपेक्षित validation output:

```text
Plugin stock-quotes is valid.
```

## टूल लिखें

`defineToolPlugin` Plugin identity, एक वैकल्पिक config schema, और
टूल की static सूची लेता है। Parameter और config types TypeBox schemas से infer किए जाते हैं।

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

Tool names स्थिर API हैं। ऐसे names चुनें जो unique, lowercase, और
core tools या दूसरे Plugins से टकराव से बचने के लिए पर्याप्त specific हों।

## वैकल्पिक और factory टूल

जब users को tool model को भेजे जाने से पहले उसे स्पष्ट रूप से allowlist करना चाहिए, तब `optional: true` set करें:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` मेल खाती हुई `toolMetadata.<tool>.optional`
manifest entry लिखता है, ताकि OpenClaw Plugin runtime code लोड किए बिना tool खोज सके।

जब किसी tool को बनने से पहले runtime tool context की आवश्यकता हो, तब `factory` का उपयोग करें। factory metadata को static रखती है और tool को किसी
specific run के लिए opt out करने, sandbox state inspect करने, या runtime helpers bind करने देती है।

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

Factories अब भी fixed tool names के लिए हैं। जब
Plugin tool names को dynamically compute करता है या tools को hooks,
services, providers, commands, या अन्य runtime surfaces के साथ जोड़ता है, तब सीधे `definePluginEntry` का उपयोग करें।

## Return values

`defineToolPlugin` plain return values को OpenClaw tool-result
format में wrap करता है:

- जब model को वही exact text दिखना चाहिए, तब string return करें।
- जब आप चाहते हैं कि model formatted JSON देखे
  और OpenClaw original value को `details` में रखे, तब JSON-compatible value return करें।

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

जब आपको custom `AgentToolResult` return करना हो या मौजूदा
`api.registerTool` implementation reuse करना हो, तब factory tool का उपयोग करें। जब आपको पूरी तरह dynamic tools या mixed Plugin
capabilities की आवश्यकता हो, तब `defineToolPlugin` के बजाय `definePluginEntry` का उपयोग करें।

## Configuration

`configSchema` वैकल्पिक है। यदि आप इसे omit करते हैं, तो OpenClaw strict empty object
schema का उपयोग करता है और जनरेट किए गए manifest में फिर भी `configSchema` शामिल होता है।

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

जब आप `configSchema` शामिल करते हैं, तो दूसरा `execute` argument
schema से type किया जाता है:

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

OpenClaw Plugin config को Gateway config में Plugin entry से पढ़ता है। source या docs examples में secrets hard-code न करें। Plugin के security model के अनुसार config, environment
variables, या SecretRefs का उपयोग करें।

## जनरेट किया गया metadata

OpenClaw installed Plugins को cold metadata से discover करता है। उसे Plugin runtime code import करने से पहले
Plugin manifest पढ़ने में सक्षम होना चाहिए। इसलिए `defineToolPlugin`
static metadata expose करता है, और `openclaw plugins build` उस
metadata को package में लिखता है।

Plugin id, name, description, config schema,
activation, या tool names बदलने के बाद generator चलाएँ:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

एक one-tool Plugin के लिए, जनरेट किया गया manifest ऐसा दिखता है:

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

`contracts.tools` महत्वपूर्ण discovery contract है। यह OpenClaw को बताता है कि हर tool का स्वामी कौन सा
Plugin है, बिना हर installed Plugin runtime को लोड किए। यदि
manifest stale है, तो tool discovery से missing हो सकता है या registration error के लिए गलत Plugin को दोषी माना जा सकता है।

## Package metadata

सरल tool-Plugin workflow के लिए, `openclaw plugins build`
`package.json` को selected single runtime entry के साथ align करता है:

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

installed packages के लिए `./dist/index.js` जैसी built JavaScript का उपयोग करें। Source
entries workspace development में उपयोगी हैं, लेकिन published packages को
TypeScript runtime loading पर निर्भर नहीं होना चाहिए।

## CI में validate करें

जनरेट किया गया metadata stale होने पर files rewrite किए बिना CI fail करने के लिए `plugins build --check` का उपयोग करें:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` जाँचता है कि:

- `openclaw.plugin.json` मौजूद है और normal manifest loader से pass होता है।
- current entry `defineToolPlugin` metadata export करती है।
- जनरेट किए गए manifest fields entry metadata से match करते हैं।
- `contracts.tools` declared tool names से match करता है।
- `package.json` `openclaw.extensions` को selected runtime entry पर point करता है।

## स्थानीय रूप से install और inspect करें

अलग OpenClaw checkout या installed CLI से, package path install करें:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

packaged smoke के लिए, पहले pack करें और tarball install करें:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

installation के बाद, Gateway start या restart करें और agent से
tool का उपयोग करने को कहें। यदि आप tool visibility debug कर रहे हैं, तो code बदलने से पहले Plugin runtime और
effective tool catalog inspect करें।

## Publish

package ready होने पर ClawHub के माध्यम से publish करें:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

explicit ClawHub locator के साथ install करें:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Bare npm package specs launch cutover के दौरान supported रहते हैं, लेकिन ClawHub
OpenClaw Plugins के लिए preferred discovery और distribution surface है।

## Troubleshooting

### `plugin entry not found: ./dist/index.js`

selected entry file मौजूद नहीं है। `npm run build` चलाएँ, फिर
`openclaw plugins build --entry ./dist/index.js` या
`openclaw plugins validate --entry ./dist/index.js` फिर से चलाएँ।

### `plugin entry does not expose defineToolPlugin metadata`

entry ने `defineToolPlugin` द्वारा created value export नहीं की। जाँचें कि
module default export `defineToolPlugin(...)` result है, या `--entry` के साथ सही
entry pass करें।

### `openclaw.plugin.json generated metadata is stale`

manifest अब entry metadata से match नहीं करता। चलाएँ:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` और `package.json` दोनों changes commit करें।

### `package.json openclaw.extensions must include ./dist/index.js`

package metadata किसी अलग runtime entry की ओर point करता है। `openclaw plugins build --entry ./dist/index.js` चलाएँ ताकि generator
package metadata को उस entry के साथ align करे जिसे आप ship करना चाहते हैं।

### `Cannot find package 'typebox'`

built Plugin runtime पर `typebox` import करता है। `typebox` को
`dependencies` में रखें, package dependencies reinstall करें, rebuild करें, और validation फिर से चलाएँ।

### install के बाद tool दिखाई नहीं देता

इन्हें क्रम में जाँचें:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` में expected tool names के साथ `contracts.tools` है।
4. `package.json` में `openclaw.extensions: ["./dist/index.js"]` है।
5. Plugin install करने के बाद Gateway restart या reload किया गया था।

## यह भी देखें

- [Building plugins](/hi/plugins/building-plugins)
- [Plugin entry points](/hi/plugins/sdk-entrypoints)
- [Plugin SDK subpaths](/hi/plugins/sdk-subpaths)
- [Plugin manifest](/hi/plugins/manifest)
- [Plugins CLI](/hi/cli/plugins)
- [ClawHub publishing](/hi/clawhub/publishing)
