---
doc-schema-version: 1
read_when:
    - आप एक नया OpenClaw Plugin बनाना चाहते हैं
    - आपको Plugin विकास के लिए एक त्वरित-आरंभ चाहिए
    - आप चैनल, प्रदाता, CLI बैकएंड, टूल, या हुक दस्तावेज़ों में से चुन रहे हैं
sidebarTitle: Getting Started
summary: मिनटों में अपना पहला OpenClaw Plugin बनाएं
title: Plugin बनाना
x-i18n:
    generated_at: "2026-07-04T15:19:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins, core को बदले बिना OpenClaw का विस्तार करते हैं। कोई plugin messaging
channel, model provider, local CLI backend, agent tool, hook, media provider,
या plugin के स्वामित्व वाली कोई अन्य capability जोड़ सकता है।

आपको OpenClaw repository में कोई external plugin जोड़ने की आवश्यकता नहीं है। package को [ClawHub](/hi/clawhub) पर publish
करें और users इसे इसके साथ install करते हैं:

```bash
openclaw plugins install clawhub:<package-name>
```

launch cutover के दौरान bare package specs अभी भी npm से install होते हैं। जब आप
ClawHub resolution चाहते हों, तो `clawhub:` prefix का उपयोग करें।

## आवश्यकताएँ

- Node 22.19+, Node 23.11+, या Node 24+ और `npm` या `pnpm` जैसे package manager का उपयोग करें।
- TypeScript ESM modules से परिचित रहें।
- in-repo bundled plugin work के लिए, repository clone करें और `pnpm install` चलाएँ।
  Source-checkout plugin development केवल pnpm है क्योंकि OpenClaw bundled
  plugins को `extensions/*` workspace packages से load करता है।

## plugin shape चुनें

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    OpenClaw को messaging platform से connect करें।
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    model, media, search, fetch, speech, या realtime provider जोड़ें।
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    OpenClaw model fallback के ज़रिए local AI CLI चलाएँ।
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/hi/plugins/tool-plugins">
    agent tools register करें।
  </Card>
</CardGroup>

## Quickstart

एक required agent tool register करके minimal tool plugin बनाएँ। यह सबसे
छोटा उपयोगी plugin shape है और package, manifest, entry point, और
local proof दिखाता है।

<Steps>
  <Step title="package metadata बनाएँ">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Published external plugins को runtime entries को built JavaScript
    files की ओर point करना चाहिए। पूरे entry
    point contract के लिए [SDK entry points](/hi/plugins/sdk-entrypoints) देखें।

    हर plugin को manifest चाहिए, भले ही उसमें कोई config न हो। Runtime tools
    `contracts.tools` में होने चाहिए ताकि OpenClaw हर plugin runtime को eagerly load किए बिना
    ownership discover कर सके। `activation.onStartup` को
    सोच-समझकर set करें। यह example Gateway startup पर start होता है।

    Host-trusted plugin surfaces भी manifest-gated हैं और installed plugins के लिए explicit
    enablement की आवश्यकता होती है। यदि कोई installed plugin
    `api.registerAgentToolResultMiddleware(...)` register करता है, तो
    `contracts.agentToolResultMiddleware` में हर target runtime declare करें। यदि यह
    `api.registerTrustedToolPolicy(...)` register करता है, तो
    `contracts.trustedToolPolicies` में हर policy id declare करें। ये declarations install-time
    inspection और runtime registration को aligned रखते हैं।

    हर manifest field के लिए, [Plugin manifest](/hi/plugins/manifest) देखें।

  </Step>

  <Step title="tool register करें">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    non-channel plugins के लिए `definePluginEntry` का उपयोग करें। Channel plugins
    `defineChannelPluginEntry` का उपयोग करते हैं।

  </Step>

  <Step title="runtime test करें">
    installed या external plugin के लिए, loaded runtime inspect करें:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    यदि plugin कोई CLI command register करता है, तो वह command भी run करें। उदाहरण के लिए,
    demo command के पास `openclaw demo-plugin ping` जैसा execution proof होना चाहिए।

    इस repository में bundled plugin के लिए, OpenClaw source-checkout
    plugin packages को `extensions/*` workspace से discover करता है। सबसे निकट targeted
    test चलाएँ:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="package install test करें">
    package-ready plugin publish करने से पहले, वही install shape test करें जो users
    को मिलेगा। पहले build step जोड़ें, `openclaw.extensions` जैसी runtime entries को
    built JavaScript जैसे `./dist/index.js` की ओर point करें, और सुनिश्चित करें कि
    `npm pack` में वह `dist/` output शामिल हो। TypeScript source entries
    केवल source checkouts और local development paths के लिए हैं।

    फिर plugin pack करें और tarball को `npm-pack:` के साथ install करें:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` OpenClaw के managed per-plugin npm project का उपयोग करता है, इसलिए यह
    runtime dependency mistakes पकड़ता है जिन्हें source checkout testing छिपा सकती है। यह
    package और dependency shape को prove करता है, catalog-linked official trust को नहीं।
    Runtime imports `dependencies` या `optionalDependencies` में होने चाहिए;
    केवल `devDependencies` में छोड़ी गई dependencies managed runtime project के लिए
    install नहीं की जाएँगी।

    official या privileged plugin behavior के final proof के रूप में raw archive/path install का उपयोग न करें।
    Raw sources local debugging के लिए उपयोगी हैं, लेकिन
    वे npm या ClawHub installs जैसा dependency path prove नहीं करते। यदि
    आपका plugin trusted official plugin status पर निर्भर करता है, तो catalog-backed official install
    या official trust record करने वाले published package path के ज़रिए दूसरा proof जोड़ें। install-root और dependency ownership details के लिए
    [Plugin dependency resolution](/hi/plugins/dependency-resolution) देखें।

  </Step>

  <Step title="Publish करें">
    publishing से पहले package validate करें:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    canonical ClawHub snippets `docs/snippets/plugin-publish/` में रहते हैं।

  </Step>

  <Step title="Install करें">
    published package को ClawHub के ज़रिए install करें:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## tools register करना

Tools required या optional हो सकते हैं। Required tools तब हमेशा available होते हैं जब
plugin enabled होता है। Optional tools के लिए user opt-in चाहिए।

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

`api.registerTool(...)` के साथ registered हर tool को plugin manifest में भी declare करना चाहिए:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Users `tools.allow` के साथ opt in करते हैं:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Optional tools control करते हैं कि tool model को expose किया गया है या नहीं। जब कोई tool
या hook model द्वारा select किए जाने के बाद और action चलने से पहले approval माँगना चाहिए, तो
[plugin permission requests](/hi/plugins/plugin-permission-requests) का उपयोग करें।

Optional tools का उपयोग side effects, unusual binaries, या ऐसी capabilities के लिए करें जिन्हें
default रूप से expose नहीं किया जाना चाहिए। Tool names core tools से conflict नहीं करने चाहिए;
conflicts skip किए जाते हैं और plugin diagnostics में report होते हैं। Malformed
registrations, जिसमें `parameters` के बिना tool descriptors शामिल हैं, skip किए जाते हैं और
उसी तरह report होते हैं। Registered tools typed functions हैं जिन्हें model
policy और allowlist checks pass होने के बाद call कर सकता है।

Tool factories को runtime-supplied context object मिलता है। जब किसी tool को current
turn के active model के अनुसार log, display, या adapt करने की आवश्यकता हो, तो `ctx.activeModel` का उपयोग करें।
object में `provider`, `modelId`, और `modelRef` शामिल हो सकते हैं। इसे
informational runtime metadata मानें, local
operator, installed plugin code, या modified OpenClaw runtime के विरुद्ध security boundary नहीं। Sensitive local
tools को फिर भी explicit plugin या operator opt-in की आवश्यकता होनी चाहिए और active-model metadata missing या unsuitable होने पर fail closed होना चाहिए।

manifest ownership और discovery declare करता है; execution फिर भी live
registered tool implementation को call करता है। `toolMetadata.<tool>.optional: true` को
`api.registerTool(..., { optional: true })` के साथ aligned रखें ताकि OpenClaw
plugin runtime को तब तक load करने से बच सके जब तक tool explicitly allowlisted न हो।

## Import conventions

focused SDK subpaths से import करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

deprecated root barrel से import न करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

अपने plugin package के भीतर, internal imports के लिए `api.ts` और
`runtime-api.ts` जैसी local barrel files का उपयोग करें। SDK path के ज़रिए अपने ही plugin को import न करें।
Provider-specific helpers को provider package में ही रहना चाहिए, जब तक
seam वास्तव में generic न हो।

Custom Gateway RPC methods एक advanced entry point हैं। उन्हें
plugin-specific prefix पर रखें; `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, और `update.*` जैसे core admin namespaces reserved रहते हैं
और `operator.admin` पर resolve होते हैं।
`openclaw/plugin-sdk/gateway-method-runtime` bridge उन plugin HTTP
routes के लिए reserved है जो `contracts.gatewayMethodDispatch: ["authenticated-request"]` declare करते हैं।

पूरे import map के लिए, [Plugin SDK overview](/hi/plugins/sdk-overview) देखें।

## Pre-submission checklist

<Check>**package.json** में सही `openclaw` metadata है</Check>
<Check>**openclaw.plugin.json** manifest मौजूद और valid है</Check>
<Check>Entry point `defineChannelPluginEntry` या `definePluginEntry` का उपयोग करता है</Check>
<Check>सभी imports focused `plugin-sdk/<subpath>` paths का उपयोग करते हैं</Check>
<Check>Internal imports local modules का उपयोग करते हैं, SDK self-imports का नहीं</Check>
<Check>Tests pass होते हैं (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pass होता है (in-repo plugins)</Check>

## beta releases के विरुद्ध test करें

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) पर GitHub रिलीज़ टैग पर नज़र रखें और `Watch` > `Releases` के ज़रिए सदस्यता लें। बीटा टैग `v2026.3.N-beta.1` जैसे दिखते हैं। आप रिलीज़ घोषणाओं के लिए आधिकारिक OpenClaw X खाते [@openclaw](https://x.com/openclaw) की सूचनाएँ भी चालू कर सकते हैं।
2. बीटा टैग दिखाई देते ही उसके विरुद्ध अपने plugin का परीक्षण करें। स्थिर रिलीज़ से पहले की अवधि आमतौर पर केवल कुछ घंटों की होती है।
3. परीक्षण के बाद `plugin-forum` Discord चैनल में अपने plugin के थ्रेड में या तो `all good` या जो टूटा है, वह पोस्ट करें। यदि आपके पास अभी तक कोई थ्रेड नहीं है, तो एक बनाएँ।
4. यदि कुछ टूटता है, तो `Beta blocker: <plugin-name> - <summary>` शीर्षक वाला issue खोलें या अपडेट करें और `beta-blocker` लेबल लगाएँ। issue लिंक अपने थ्रेड में डालें।
5. `main` पर `fix(<plugin-id>): beta blocker - <summary>` शीर्षक वाला PR खोलें और issue को PR और अपने Discord थ्रेड दोनों में लिंक करें। योगदानकर्ता PRs को लेबल नहीं कर सकते, इसलिए शीर्षक maintainers और automation के लिए PR-पक्ष का संकेत है। PR वाले blockers merge किए जाते हैं; जिन blockers का PR नहीं है, वे फिर भी ship हो सकते हैं। Maintainers बीटा परीक्षण के दौरान इन थ्रेड्स पर नज़र रखते हैं।
6. मौन का अर्थ है हरा। यदि आप समय-सीमा चूक जाते हैं, तो आपका fix संभवतः अगले cycle में शामिल होगा।

## अगले चरण

<CardGroup cols={2}>
  <Card title="चैनल Plugins" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    messaging चैनल plugin बनाएँ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    मॉडल provider plugin बनाएँ
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    local AI CLI backend पंजीकृत करें
  </Card>
  <Card title="SDK अवलोकन" icon="book-open" href="/hi/plugins/sdk-overview">
    Import map और registration API reference
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/hi/plugins/sdk-runtime">
    api.runtime के ज़रिए TTS, खोज, subagent
  </Card>
  <Card title="परीक्षण" icon="test-tubes" href="/hi/plugins/sdk-testing">
    परीक्षण utilities और patterns
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/hi/plugins/manifest">
    पूर्ण manifest schema reference
  </Card>
</CardGroup>

## संबंधित

- [Plugin hooks](/hi/plugins/hooks)
- [Plugin architecture](/hi/plugins/architecture)
