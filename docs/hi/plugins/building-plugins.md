---
doc-schema-version: 1
read_when:
    - आप एक नया OpenClaw Plugin बनाना चाहते हैं
    - आपको Plugin विकास के लिए एक त्वरित-आरंभ चाहिए
    - आप चैनल, प्रदाता, CLI बैकएंड, टूल या हुक दस्तावेज़ों में से चुन रहे हैं
sidebarTitle: Getting Started
summary: मिनटों में अपना पहला OpenClaw Plugin बनाएँ
title: Plugin बनाना
x-i18n:
    generated_at: "2026-06-28T23:32:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin कोर बदले बिना OpenClaw का विस्तार करते हैं। कोई Plugin मैसेजिंग
चैनल, मॉडल प्रदाता, स्थानीय CLI बैकएंड, एजेंट टूल, हुक, मीडिया प्रदाता,
या कोई अन्य Plugin-स्वामित्व वाली क्षमता जोड़ सकता है।

आपको OpenClaw repository में बाहरी Plugin जोड़ने की आवश्यकता नहीं है। पैकेज को
[ClawHub](/hi/clawhub) पर प्रकाशित करें और उपयोगकर्ता इसे इससे इंस्टॉल करते हैं:

```bash
openclaw plugins install clawhub:<package-name>
```

लॉन्च कटओवर के दौरान bare package specs अब भी npm से इंस्टॉल होते हैं। जब आप
ClawHub resolution चाहते हों, तो `clawhub:` prefix का उपयोग करें।

## आवश्यकताएँ

- Node 22.19 या नया और `npm` या `pnpm` जैसा package manager उपयोग करें।
- TypeScript ESM modules से परिचित रहें।
- in-repo bundled Plugin कार्य के लिए, repository clone करें और `pnpm install` चलाएँ।
  Source-checkout Plugin development केवल pnpm है क्योंकि OpenClaw bundled
  Plugins को `extensions/*` workspace packages से लोड करता है।

## Plugin आकार चुनें

<CardGroup cols={2}>
  <Card title="Channel Plugin" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    OpenClaw को किसी मैसेजिंग platform से कनेक्ट करें।
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    कोई मॉडल, मीडिया, खोज, fetch, speech, या realtime प्रदाता जोड़ें।
  </Card>
  <Card title="CLI backend Plugin" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    OpenClaw मॉडल fallback के माध्यम से स्थानीय AI CLI चलाएँ।
  </Card>
  <Card title="Tool Plugin" icon="wrench" href="/hi/plugins/tool-plugins">
    एजेंट टूल register करें।
  </Card>
</CardGroup>

## Quickstart

एक required एजेंट टूल register करके न्यूनतम Tool Plugin बनाएँ। यह सबसे
छोटा उपयोगी Plugin आकार है और package, manifest, entry point, और
local proof दिखाता है।

<Steps>
  <Step title="Package metadata बनाएँ">
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

    Published external Plugins को runtime entries को built JavaScript
    files की ओर इंगित करना चाहिए। पूरे entry point contract के लिए
    [SDK entry points](/hi/plugins/sdk-entrypoints) देखें।

    हर Plugin को manifest चाहिए, भले ही उसमें config न हो। Runtime tools
    `contracts.tools` में दिखने चाहिए ताकि OpenClaw हर Plugin runtime को
    eagerly load किए बिना ownership खोज सके। `activation.onStartup`
    जानबूझकर सेट करें। यह उदाहरण Gateway startup पर शुरू होता है।

    Host-trusted Plugin surfaces भी manifest-gated हैं और installed Plugins के लिए explicit
    enablement की आवश्यकता होती है। अगर कोई installed Plugin
    `api.registerAgentToolResultMiddleware(...)` register करता है, तो
    `contracts.agentToolResultMiddleware` में प्रत्येक target runtime declare करें। अगर वह
    `api.registerTrustedToolPolicy(...)` register करता है, तो
    `contracts.trustedToolPolicies` में प्रत्येक policy id declare करें। ये declarations install-time
    inspection और runtime registration को aligned रखते हैं।

    हर manifest field के लिए, [Plugin manifest](/hi/plugins/manifest) देखें।

  </Step>

  <Step title="Tool register करें">
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

    Non-channel Plugins के लिए `definePluginEntry` उपयोग करें। Channel Plugins
    `defineChannelPluginEntry` उपयोग करते हैं।

  </Step>

  <Step title="Runtime test करें">
    Installed या external Plugin के लिए, loaded runtime inspect करें:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    अगर Plugin कोई CLI command register करता है, तो वह command भी चलाएँ। उदाहरण के लिए,
    demo command के पास `openclaw demo-plugin ping` जैसा execution proof होना चाहिए।

    इस repository में bundled Plugin के लिए, OpenClaw `extensions/*` workspace से
    source-checkout Plugin packages खोजता है। सबसे निकट targeted test चलाएँ:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish करें">
    प्रकाशित करने से पहले package validate करें:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Canonical ClawHub snippets `docs/snippets/plugin-publish/` में रहते हैं।

  </Step>

  <Step title="Install करें">
    Published package को ClawHub के माध्यम से install करें:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Tools register करना

Tools required या optional हो सकते हैं। Required tools हमेशा उपलब्ध रहते हैं जब
Plugin enabled होता है। Optional tools को user opt-in की आवश्यकता होती है।

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

`api.registerTool(...)` के साथ register किए गए हर tool को Plugin
manifest में भी declare किया जाना चाहिए:

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

Optional tools नियंत्रित करते हैं कि tool model के सामने expose होता है या नहीं। जब कोई tool
या hook model द्वारा चुने जाने के बाद और action चलने से पहले approval माँगना चाहिए, तो
[Plugin permission requests](/hi/plugins/plugin-permission-requests) उपयोग करें।

Side effects, असामान्य binaries, या default रूप से expose न की जाने वाली
capabilities के लिए optional tools उपयोग करें। Tool names core tools से conflict नहीं करने चाहिए;
conflicts skip किए जाते हैं और Plugin diagnostics में reported होते हैं। Malformed
registrations, जिनमें `parameters` के बिना tool descriptors भी शामिल हैं, skip किए जाते हैं और
उसी तरह reported होते हैं। Registered tools typed functions हैं जिन्हें model
policy और allowlist checks pass होने के बाद call कर सकता है।

Tool factories को runtime-supplied context object मिलता है। जब किसी tool को current
turn के active model के अनुसार log, display, या adapt करना हो, तो `ctx.activeModel`
उपयोग करें। Object में `provider`, `modelId`, और `modelRef` शामिल हो सकते हैं। इसे
informational runtime metadata मानें, local operator, installed Plugin code, या modified
OpenClaw runtime के विरुद्ध security boundary नहीं। Sensitive local
tools को अब भी explicit Plugin या operator opt-in की आवश्यकता होनी चाहिए और active-model
metadata missing या unsuitable होने पर fail closed होना चाहिए।

Manifest ownership और discovery declare करता है; execution फिर भी live
registered tool implementation को call करता है। `toolMetadata.<tool>.optional: true`
को `api.registerTool(..., { optional: true })` के साथ aligned रखें ताकि OpenClaw
tool के explicitly allowlisted होने तक उस Plugin runtime को load करने से बच सके।

## Import conventions

Focused SDK subpaths से import करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Deprecated root barrel से import न करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

अपने Plugin package के भीतर, internal imports के लिए `api.ts` और
`runtime-api.ts` जैसी local barrel files उपयोग करें। SDK path के माध्यम से अपने ही Plugin को import न करें।
Provider-specific helpers को provider package में रहना चाहिए जब तक
seam सच में generic न हो।

Custom Gateway RPC methods एक advanced entry point हैं। उन्हें
Plugin-specific prefix पर रखें; `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, और `update.*` जैसे core admin namespaces reserved रहते हैं
और `operator.admin` में resolve होते हैं।
`openclaw/plugin-sdk/gateway-method-runtime` bridge उन Plugin HTTP
routes के लिए reserved है जो `contracts.gatewayMethodDispatch: ["authenticated-request"]` declare करते हैं।

पूरे import map के लिए, [Plugin SDK overview](/hi/plugins/sdk-overview) देखें।

## Pre-submission checklist

<Check>**package.json** में सही `openclaw` metadata है</Check>
<Check>**openclaw.plugin.json** manifest मौजूद और valid है</Check>
<Check>Entry point `defineChannelPluginEntry` या `definePluginEntry` उपयोग करता है</Check>
<Check>सभी imports focused `plugin-sdk/<subpath>` paths उपयोग करते हैं</Check>
<Check>Internal imports local modules उपयोग करते हैं, SDK self-imports नहीं</Check>
<Check>Tests pass होते हैं (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pass होता है (in-repo Plugins)</Check>

## Beta releases के विरुद्ध test करें

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) पर GitHub release tags देखें और `Watch` > `Releases` के माध्यम से subscribe करें। Beta tags `v2026.3.N-beta.1` जैसे दिखते हैं। आप release announcements के लिए official OpenClaw X account [@openclaw](https://x.com/openclaw) की notifications भी चालू कर सकते हैं।
2. Beta tag दिखते ही अपने Plugin को उसके विरुद्ध test करें। Stable से पहले window आमतौर पर केवल कुछ घंटे होती है।
3. Testing के बाद `plugin-forum` Discord channel में अपने Plugin के thread में या तो `all good` या क्या टूटा, post करें। अगर आपके पास अभी thread नहीं है, तो एक बनाएँ।
4. अगर कुछ टूटता है, तो `Beta blocker: <plugin-name> - <summary>` शीर्षक वाला issue खोलें या update करें और `beta-blocker` label apply करें। Issue link अपने thread में डालें।
5. `fix(<plugin-id>): beta blocker - <summary>` शीर्षक से `main` पर PR खोलें और PR तथा अपने Discord thread, दोनों में issue link करें। Contributors PRs label नहीं कर सकते, इसलिए title maintainers और automation के लिए PR-side signal है। PR वाले blockers merge हो जाते हैं; बिना PR वाले blockers फिर भी ship हो सकते हैं। Maintainers beta testing के दौरान इन threads को देखते हैं।
6. Silence का अर्थ green है। अगर आप window miss करते हैं, तो आपका fix likely next cycle में land होगा।

## Next steps

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    Messaging channel Plugin बनाएँ
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    Model provider Plugin बनाएँ
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    Local AI CLI backend register करें
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
    Full manifest schema reference
  </Card>
</CardGroup>

## Related

- [Plugin hooks](/hi/plugins/hooks)
- [Plugin architecture](/hi/plugins/architecture)
