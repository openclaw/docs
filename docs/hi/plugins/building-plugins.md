---
doc-schema-version: 1
read_when:
    - आप एक नया OpenClaw plugin बनाना चाहते हैं
    - आपको Plugin विकास के लिए त्वरित प्रारंभ चाहिए
    - आप channel, provider, CLI backend, tool, या hook दस्तावेज़ों में से चुन रहे हैं
sidebarTitle: Getting Started
summary: मिनटों में अपना पहला OpenClaw Plugin बनाएं
title: Plugin बनाना
x-i18n:
    generated_at: "2026-07-04T08:46:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins core बदले बिना OpenClaw का विस्तार करते हैं। कोई Plugin मैसेजिंग
चैनल, मॉडल प्रदाता, स्थानीय CLI बैकएंड, एजेंट टूल, hook, मीडिया प्रदाता,
या कोई अन्य Plugin-स्वामित्व वाली क्षमता जोड़ सकता है।

आपको OpenClaw repository में बाहरी Plugin जोड़ने की आवश्यकता नहीं है। package को [ClawHub](/hi/clawhub) पर प्रकाशित करें और उपयोगकर्ता इसे इस तरह इंस्टॉल करते हैं:

```bash
openclaw plugins install clawhub:<package-name>
```

launch cutover के दौरान bare package specs अब भी npm से इंस्टॉल होते हैं। जब आप ClawHub resolution चाहते हैं, तो
`clawhub:` prefix का उपयोग करें।

## आवश्यकताएँ

- Node 22.19+, Node 23.11+, या Node 24+ और `npm` या `pnpm` जैसे package manager का उपयोग करें।
- TypeScript ESM modules से परिचित रहें।
- in-repo bundled Plugin कार्य के लिए, repository clone करें और `pnpm install` चलाएँ।
  source-checkout Plugin development केवल pnpm है क्योंकि OpenClaw bundled
  plugins को `extensions/*` workspace packages से load करता है।

## Plugin का आकार चुनें

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    OpenClaw को किसी मैसेजिंग platform से जोड़ें।
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    कोई model, media, search, fetch, speech, या realtime provider जोड़ें।
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    OpenClaw model fallback के माध्यम से स्थानीय AI CLI चलाएँ।
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/hi/plugins/tool-plugins">
    agent tools register करें।
  </Card>
</CardGroup>

## Quickstart

एक आवश्यक agent tool register करके minimal tool Plugin बनाएँ। यह सबसे
छोटा उपयोगी Plugin shape है और package, manifest, entry point, और
local proof दिखाता है।

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
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

    प्रकाशित बाहरी plugins को runtime entries को built JavaScript
    files की ओर point करना चाहिए। पूरे entry
    point contract के लिए [SDK entry points](/hi/plugins/sdk-entrypoints) देखें।

    हर Plugin को manifest चाहिए, तब भी जब उसमें कोई config न हो। Runtime tools
    `contracts.tools` में दिखने चाहिए ताकि OpenClaw हर Plugin runtime को
    eager load किए बिना ownership discover कर सके। `activation.onStartup`
    को सोच-समझकर set करें। यह example Gateway startup पर start होता है।

    Host-trusted Plugin surfaces भी manifest-gated हैं और installed plugins के लिए explicit
    enablement की आवश्यकता होती है। यदि installed Plugin
    `api.registerAgentToolResultMiddleware(...)` register करता है, तो हर target runtime को
    `contracts.agentToolResultMiddleware` में declare करें। यदि वह
    `api.registerTrustedToolPolicy(...)` register करता है, तो हर policy id को
    `contracts.trustedToolPolicies` में declare करें। ये declarations install-time
    inspection और runtime registration को aligned रखते हैं।

    हर manifest field के लिए, [Plugin manifest](/hi/plugins/manifest) देखें।

  </Step>

  <Step title="Register the tool">
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

  <Step title="Test the runtime">
    installed या external Plugin के लिए, loaded runtime inspect करें:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    यदि Plugin कोई CLI command register करता है, तो वह command भी चलाएँ। उदाहरण के लिए,
    demo command के पास `openclaw demo-plugin ping` जैसा execution proof होना चाहिए।

    इस repository में bundled Plugin के लिए, OpenClaw `extensions/*` workspace से source-checkout
    Plugin packages discover करता है। सबसे निकट targeted
    test चलाएँ:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    publish करने से पहले package validate करें:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    canonical ClawHub snippets `docs/snippets/plugin-publish/` में रहते हैं।

  </Step>

  <Step title="Install">
    प्रकाशित package को ClawHub के माध्यम से install करें:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## tools register करना

Tools required या optional हो सकते हैं। Required tools हमेशा उपलब्ध होते हैं जब
Plugin enabled होता है। Optional tools के लिए user opt-in आवश्यक है।

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

`api.registerTool(...)` के साथ registered हर tool को Plugin manifest में भी declare करना होगा:

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

Optional tools यह control करते हैं कि tool model को expose होता है या नहीं। जब कोई tool
या hook model द्वारा चुने जाने के बाद और action चलने से पहले approval माँगना चाहिए, तो
[Plugin permission requests](/hi/plugins/plugin-permission-requests) का उपयोग करें।

Side effects, unusual binaries, या उन capabilities के लिए optional tools का उपयोग करें
जो default रूप से expose नहीं होनी चाहिए। Tool names core tools से conflict नहीं करने चाहिए;
conflicts को skip किया जाता है और Plugin diagnostics में report किया जाता है। Malformed
registrations, जिसमें `parameters` के बिना tool descriptors शामिल हैं, skip किए जाते हैं और
उसी तरह report होते हैं। Registered tools typed functions हैं जिन्हें model
policy और allowlist checks pass होने के बाद call कर सकता है।

Tool factories runtime-supplied context object receive करती हैं। जब किसी tool को current
turn के active model के लिए log, display, या adapt करना हो, तो `ctx.activeModel`
का उपयोग करें। object में `provider`, `modelId`, और `modelRef` शामिल हो सकते हैं। इसे
informational runtime metadata मानें, local operator, installed Plugin code, या modified OpenClaw runtime के विरुद्ध security boundary नहीं। Sensitive local
tools को फिर भी explicit Plugin या operator opt-in require करना चाहिए और active-model metadata missing या unsuitable होने पर fail closed होना चाहिए।

Manifest ownership और discovery declare करता है; execution फिर भी live
registered tool implementation को call करता है। `toolMetadata.<tool>.optional: true`
को `api.registerTool(..., { optional: true })` के साथ aligned रखें ताकि OpenClaw
tool को explicitly allowlist किए जाने तक उस Plugin runtime को load करने से बच सके।

## Import conventions

Focused SDK subpaths से import करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

deprecated root barrel से import न करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

अपने Plugin package के भीतर, internal imports के लिए `api.ts` और
`runtime-api.ts` जैसी local barrel files का उपयोग करें। अपने ही Plugin को SDK path के माध्यम से import न करें। Provider-specific helpers provider package में ही रहने चाहिए, जब तक
seam सचमुच generic न हो।

Custom Gateway RPC methods एक advanced entry point हैं। उन्हें
Plugin-specific prefix पर रखें; `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, और `update.*` जैसे core admin namespaces reserved रहते हैं
और `operator.admin` पर resolve होते हैं।
`openclaw/plugin-sdk/gateway-method-runtime` bridge उन Plugin HTTP
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

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) पर GitHub release tags देखें और `Watch` > `Releases` के माध्यम से subscribe करें। Beta tags `v2026.3.N-beta.1` जैसे दिखते हैं। आप release announcements के लिए official OpenClaw X account [@openclaw](https://x.com/openclaw) की notifications भी on कर सकते हैं।
2. Beta tag आते ही अपने Plugin को उसके विरुद्ध test करें। stable से पहले की window आमतौर पर केवल कुछ घंटों की होती है।
3. testing के बाद `plugin-forum` Discord channel में अपने Plugin के thread में `all good` या क्या टूटा, यह post करें। यदि आपके पास अभी thread नहीं है, तो एक बनाएँ।
4. यदि कुछ टूटता है, तो `Beta blocker: <plugin-name> - <summary>` title वाला issue open या update करें और `beta-blocker` label apply करें। issue link अपने thread में डालें।
5. `main` पर `fix(<plugin-id>): beta blocker - <summary>` title वाला PR open करें और issue को PR और अपने Discord thread दोनों में link करें। Contributors PRs को label नहीं कर सकते, इसलिए title maintainers और automation के लिए PR-side signal है। PR वाले blockers merge होते हैं; जिनके पास PR नहीं है वे फिर भी ship हो सकते हैं। Maintainers beta testing के दौरान इन threads को देखते हैं।
6. Silence का अर्थ green है। यदि आप window miss करते हैं, तो आपका fix संभवतः अगले cycle में land होगा।

## अगले कदम

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    मैसेजिंग channel Plugin बनाएँ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    model provider Plugin बनाएँ
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    स्थानीय AI CLI backend register करें
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/hi/plugins/sdk-overview">
    Import map और registration API reference
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/hi/plugins/sdk-runtime">
    TTS, search, subagent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/hi/plugins/sdk-testing">
    Test utilities और patterns
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/hi/plugins/manifest">
    पूरा manifest schema reference
  </Card>
</CardGroup>

## संबंधित

- [Plugin hooks](/hi/plugins/hooks)
- [Plugin architecture](/hi/plugins/architecture)
