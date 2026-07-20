---
doc-schema-version: 1
read_when:
    - आप एक नया OpenClaw Plugin बनाना चाहते हैं
    - आपको Plugin डेवलपमेंट के लिए एक त्वरित शुरुआत चाहिए
    - आप चैनल, प्रदाता, CLI बैकएंड, टूल या हुक के दस्तावेज़ों में से चुन रहे हैं
sidebarTitle: Getting Started
summary: मिनटों में अपना पहला OpenClaw Plugin बनाएँ
title: Plugin बनाना
x-i18n:
    generated_at: "2026-07-20T07:17:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b2dbf37b2b1c62dd0079ad1db5f8a09b1572b5a6fcc61ae798a7f053dcc1aff1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins, core को बदले बिना OpenClaw का विस्तार करते हैं। कोई Plugin मैसेजिंग
चैनल, मॉडल प्रदाता, स्थानीय CLI बैकएंड, एजेंट टूल, हुक, मीडिया प्रदाता,
या Plugin के स्वामित्व वाली कोई अन्य क्षमता जोड़ सकता है।

आपको OpenClaw रिपॉज़िटरी में कोई बाहरी Plugin जोड़ने की आवश्यकता नहीं है। पैकेज को
[ClawHub](/hi/clawhub) पर प्रकाशित करें और उपयोगकर्ता इसे इस कमांड से इंस्टॉल करते हैं:

```bash
openclaw plugins install clawhub:<package-name>
```

लॉन्च बदलाव के दौरान साधारण पैकेज विनिर्देश अब भी npm से इंस्टॉल होते हैं। जब आप
ClawHub रिज़ॉल्यूशन चाहते हैं, तब `clawhub:` प्रीफ़िक्स का उपयोग करें।

## आवश्यकताएँ

- Node 22.22.3+, Node 24.15+, या Node 25.9+, और `npm` या `pnpm`।
- TypeScript ESM मॉड्यूल।
- रिपॉज़िटरी में बंडल किए गए Plugin पर काम करने के लिए, रिपॉज़िटरी क्लोन करें और `pnpm install` चलाएँ।
  स्रोत चेकआउट में Plugin विकास केवल pnpm से होता है, क्योंकि OpenClaw
  `extensions/*` वर्कस्पेस पैकेजों से बंडल किए गए Plugins खोजता है।

## Plugin का स्वरूप चुनें

<CardGroup cols={2}>
  <Card title="चैनल Plugin" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    OpenClaw को किसी मैसेजिंग प्लेटफ़ॉर्म से जोड़ें।
  </Card>
  <Card title="प्रदाता Plugin" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    मॉडल, मीडिया, खोज, फ़ेच, वाक् या रीयलटाइम प्रदाता जोड़ें।
  </Card>
  <Card title="CLI बैकएंड Plugin" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    OpenClaw मॉडल फ़ॉलबैक के माध्यम से स्थानीय AI CLI चलाएँ।
  </Card>
  <Card title="टूल Plugin" icon="wrench" href="/hi/plugins/tool-plugins">
    एजेंट टूल पंजीकृत करें।
  </Card>
</CardGroup>

## त्वरित शुरुआत

एक आवश्यक एजेंट टूल पंजीकृत करके न्यूनतम टूल Plugin बनाएँ। यह सबसे छोटा
उपयोगी Plugin स्वरूप है और पैकेज, मैनिफ़ेस्ट, प्रवेश बिंदु और स्थानीय प्रमाण को
समाहित करता है।

<Steps>
  <Step title="पैकेज मेटाडेटा बनाएँ">
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

    प्रकाशित बाहरी Plugins को रनटाइम प्रविष्टियाँ निर्मित JavaScript
    फ़ाइलों की ओर निर्देशित करनी चाहिए। प्रवेश बिंदु के पूर्ण अनुबंध के लिए
    [SDK प्रवेश बिंदु](/hi/plugins/sdk-entrypoints) देखें।

    प्रत्येक Plugin को मैनिफ़ेस्ट चाहिए, भले ही कोई कॉन्फ़िगरेशन न हो। रनटाइम टूल
    `contracts.tools` में होने चाहिए, ताकि OpenClaw प्रत्येक Plugin रनटाइम को
    उत्सुकतापूर्वक लोड किए बिना स्वामित्व खोज सके। `activation.onStartup`
    सोच-समझकर सेट करें; यह उदाहरण Gateway के प्रारंभ होने पर लोड होता है।

    होस्ट-विश्वसनीय Plugin सतहें भी मैनिफ़ेस्ट-गेटेड होती हैं और इंस्टॉल किए गए
    Plugins के लिए स्पष्ट घोषणा आवश्यक होती है: `api.registerAgentToolResultMiddleware(...)`
    को प्रत्येक लक्ष्य रनटाइम `contracts.agentToolResultMiddleware` में सूचीबद्ध चाहिए,
    और `api.registerTrustedToolPolicy(...)` को प्रत्येक नीति आईडी
    `contracts.trustedToolPolicies` में चाहिए। ये घोषणाएँ इंस्टॉल-समय के
    निरीक्षण और रनटाइम पंजीकरण को समन्वित रखती हैं।

    प्रत्येक मैनिफ़ेस्ट फ़ील्ड के लिए [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) देखें।

  </Step>

  <Step title="टूल पंजीकृत करें">
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
          outputSchema: Type.Object(
            { input: Type.String() },
            { additionalProperties: false },
          ),
          async execute(_id, params) {
            const details = { input: params.input };
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
              details,
            };
          },
        });
      },
    });
    ```

    गैर-चैनल Plugins के लिए `definePluginEntry` का उपयोग करें। इसके बजाय चैनल Plugins
    `openclaw/plugin-sdk/core` से `defineChannelPluginEntry` का उपयोग करते हैं।

  </Step>

  <Step title="रनटाइम का परीक्षण करें">
    इंस्टॉल किए गए या बाहरी Plugin के लिए, लोड किए गए रनटाइम का निरीक्षण करें:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    यदि Plugin कोई CLI कमांड पंजीकृत करता है, तो वह कमांड भी चलाएँ और आउटपुट
    की पुष्टि करें, उदाहरण के लिए `openclaw demo-plugin ping`।

    इस रिपॉज़िटरी में बंडल किए गए Plugin के लिए, OpenClaw `extensions/*`
    वर्कस्पेस से स्रोत-चेकआउट Plugin पैकेज खोजता है। निकटतम लक्षित
    परीक्षण चलाएँ:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="पैकेज इंस्टॉल का परीक्षण करें">
    पैकेज के रूप में तैयार Plugin प्रकाशित करने से पहले, उसी इंस्टॉल स्वरूप का परीक्षण करें
    जो उपयोगकर्ताओं को मिलेगा। पहले एक बिल्ड चरण जोड़ें, `openclaw.extensions`
    जैसी रनटाइम प्रविष्टियों को `./dist/index.js` जैसे निर्मित JavaScript की ओर निर्देशित करें, और
    सुनिश्चित करें कि `npm pack` में वह `dist/` आउटपुट शामिल है। TypeScript स्रोत प्रविष्टियाँ
    केवल स्रोत चेकआउट और स्थानीय विकास पथों के लिए हैं।

    फिर Plugin पैक करें और `npm-pack:` के साथ टारबॉल इंस्टॉल करें:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` OpenClaw के प्रबंधित प्रति-Plugin npm प्रोजेक्ट का उपयोग करता है, इसलिए यह
    रनटाइम निर्भरता की उन गलतियों को पकड़ता है जिन्हें स्रोत चेकआउट परीक्षण छिपा सकता है। यह
    पैकेज और निर्भरता के स्वरूप को प्रमाणित करता है, कैटलॉग से जुड़ा आधिकारिक विश्वास नहीं।
    रनटाइम इम्पोर्ट `dependencies` या `optionalDependencies` में होने चाहिए;
    केवल `devDependencies` में छोड़ी गई निर्भरताएँ प्रबंधित रनटाइम
    प्रोजेक्ट के लिए इंस्टॉल नहीं होंगी।

    आधिकारिक या विशेषाधिकार-प्राप्त Plugin व्यवहार के अंतिम प्रमाण के रूप में कच्चे
    आर्काइव/पथ इंस्टॉल का उपयोग न करें। कच्चे स्रोत स्थानीय डीबगिंग के लिए उपयोगी हैं, लेकिन
    वे npm या ClawHub इंस्टॉल के समान निर्भरता पथ प्रमाणित नहीं करते। यदि
    आपका Plugin विश्वसनीय आधिकारिक Plugin स्थिति पर निर्भर करता है, तो कैटलॉग-समर्थित
    आधिकारिक इंस्टॉल या आधिकारिक विश्वास दर्ज करने वाले प्रकाशित पैकेज पथ के माध्यम से
    दूसरा प्रमाण जोड़ें। इंस्टॉल-रूट और निर्भरता स्वामित्व के विवरण के लिए
    [Plugin निर्भरता रिज़ॉल्यूशन](/hi/plugins/dependency-resolution) देखें।

  </Step>

  <Step title="प्रकाशित करें">
    प्रकाशित करने से पहले पैकेज को सत्यापित करें:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    प्रामाणिक ClawHub पैकेज स्निपेट `docs/snippets/plugin-publish/` में रहते हैं।

  </Step>

  <Step title="इंस्टॉल करें">
    प्रकाशित पैकेज को ClawHub के माध्यम से इंस्टॉल करें:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## टूल पंजीकृत करना

टूल आवश्यक या वैकल्पिक हो सकते हैं। Plugin सक्षम होने पर आवश्यक टूल हमेशा
उपलब्ध रहते हैं। OpenClaw द्वारा स्वामी Plugin रनटाइम लोड किए जाने से पहले
वैकल्पिक टूल के लिए उपयोगकर्ता की स्पष्ट सहमति आवश्यक होती है।

टूल फ़ैक्टरियों को विश्वसनीय रनटाइम संदर्भ मिलता है, जिसमें `deliveryContext`,
उपलब्ध होने पर सक्रिय प्लेटफ़ॉर्म वार्तालाप के लिए `nativeChannelId`, और
`requesterSenderId` शामिल हैं।

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      outputSchema: Type.Object(
        { pipeline: Type.String() },
        { additionalProperties: false },
      ),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: params.pipeline }],
          details: { pipeline: params.pipeline },
        };
      },
    },
    { optional: true },
  );
}
```

`outputSchema` वैकल्पिक है। यह [कोड मोड](/hi/tools/code-mode) और
[टूल खोज](/hi/tools/tool-search) द्वारा उपयोग किए जाने वाले संरचित `details` मान का वर्णन करता है। कैटलॉग
कॉल निष्पादन से पहले अमान्य स्कीमा अस्वीकार करते हैं और टूल हुक के बाद अंतिम मान
को सत्यापित करते हैं। स्थिर JSON परिणाम के बिना टूल के लिए इसे छोड़ दें। पूर्ण अनुबंध के लिए
[टूल Plugins](/hi/plugins/tool-plugins#output-contracts) देखें।

`api.registerTool(...)` के साथ पंजीकृत प्रत्येक टूल को Plugin मैनिफ़ेस्ट में भी
घोषित करना आवश्यक है:

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

उपयोगकर्ता `tools.allow` के साथ सहमति देते हैं:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

वैकल्पिक टूल नियंत्रित करते हैं कि कोई टूल मॉडल के समक्ष प्रस्तुत किया जाए या नहीं। जब मॉडल द्वारा टूल
या हुक चुने जाने के बाद और कार्रवाई चलने से पहले अनुमोदन माँगा जाना चाहिए, तब
[Plugin अनुमति अनुरोधों](/hi/plugins/plugin-permission-requests) का उपयोग करें।

साइड इफ़ेक्ट, असामान्य बाइनरी या ऐसी क्षमताओं के लिए वैकल्पिक टूल का उपयोग करें
जिन्हें डिफ़ॉल्ट रूप से प्रस्तुत नहीं किया जाना चाहिए। टूल नाम core टूल नामों से
टकराने नहीं चाहिए; टकराव छोड़ दिए जाते हैं और Plugin डायग्नोस्टिक्स में रिपोर्ट होते हैं। विकृत
पंजीकरण भी इसी तरह छोड़ दिए और रिपोर्ट किए जाते हैं: अनुपस्थित गैर-रिक्त
`name`, गैर-फ़ंक्शन `execute`, या `parameters`
ऑब्जेक्ट के बिना टूल डिस्क्रिप्टर।

टूल फ़ैक्टरियों को रनटाइम द्वारा दिया गया संदर्भ ऑब्जेक्ट मिलता है। जब किसी टूल को वर्तमान
टर्न के सक्रिय मॉडल के अनुसार लॉग, प्रदर्शन या अनुकूलन करना हो, तब `ctx.activeModel`
का उपयोग करें; इसमें `provider`, `modelId`, और `modelRef` शामिल हो सकते हैं। इसे
सूचनात्मक रनटाइम मेटाडेटा मानें, स्थानीय ऑपरेटर, इंस्टॉल किए गए Plugin कोड या
संशोधित OpenClaw रनटाइम के विरुद्ध सुरक्षा सीमा नहीं। संवेदनशील स्थानीय टूल के लिए
अब भी स्पष्ट Plugin या ऑपरेटर सहमति आवश्यक होनी चाहिए और सक्रिय-मॉडल मेटाडेटा
अनुपस्थित या अनुपयुक्त होने पर उन्हें सुरक्षित रूप से विफल होना चाहिए।

मैनिफ़ेस्ट स्वामित्व और खोज घोषित करता है; निष्पादन फिर भी लाइव पंजीकृत टूल
कार्यान्वयन को कॉल करता है। `toolMetadata.<tool>.optional: true` को
`api.registerTool(..., { optional: true })` के साथ समन्वित रखें, ताकि OpenClaw उस Plugin रनटाइम को
तब तक लोड न करे जब तक टूल को स्पष्ट रूप से अनुमत सूची में न जोड़ा जाए।

## इम्पोर्ट परंपराएँ

केंद्रित SDK उपपथों से इम्पोर्ट करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

अपने Plugin पैकेज के भीतर, आंतरिक इम्पोर्ट के लिए `api.ts` और
`runtime-api.ts` जैसी स्थानीय बैरल फ़ाइलों का उपयोग करें। अपने ही Plugin को किसी
SDK पथ के माध्यम से इम्पोर्ट न करें। प्रदाता-विशिष्ट सहायक प्रदाता पैकेज में ही रहने चाहिए,
जब तक कि सीमा वास्तव में सामान्य न हो।

कस्टम Gateway RPC विधियाँ एक उन्नत प्रवेश बिंदु हैं। उन्हें
Plugin-विशिष्ट प्रीफ़िक्स पर रखें; `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, और `update.*` जैसे core व्यवस्थापक नेमस्पेस आरक्षित
रहते हैं और `operator.admin` में रिज़ॉल्व होते हैं।
`openclaw/plugin-sdk/gateway-method-runtime` ब्रिज उन Plugin HTTP
रूट के लिए आरक्षित है जो `contracts.gatewayMethodDispatch: ["authenticated-request"]` घोषित करते हैं।

पूर्ण इम्पोर्ट मैप के लिए [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) देखें।

## प्रस्तुति-पूर्व जाँच-सूची

<Check>**package.json** में सही `openclaw` मेटाडेटा है</Check>
<Check>**openclaw.plugin.json** मैनिफ़ेस्ट मौजूद और मान्य है</Check>
<Check>प्रवेश बिंदु `defineChannelPluginEntry` या `definePluginEntry` का उपयोग करता है</Check>
<Check>सभी इम्पोर्ट केंद्रित `plugin-sdk/<subpath>` पथों का उपयोग करते हैं</Check>
<Check>आंतरिक इम्पोर्ट स्थानीय मॉड्यूल का उपयोग करते हैं, SDK स्व-इम्पोर्ट का नहीं</Check>
<Check>परीक्षण सफल हैं (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` सफल है (रिपॉज़िटरी के भीतर के Plugins)</Check>

## बीटा रिलीज़ के विरुद्ध परीक्षण करें

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) रिलीज़ पर नज़र रखें (`Watch` > `Releases`)। बीटा टैग `v2026.3.N-beta.1` जैसे दिखते हैं। रिलीज़ घोषणाओं के लिए आप X पर [@openclaw](https://x.com/openclaw) को भी फ़ॉलो कर सकते हैं।
2. बीटा टैग दिखाई देते ही अपने Plugin का उसके विरुद्ध परीक्षण करें। स्थिर रिलीज़ से पहले की अवधि आम तौर पर केवल कुछ घंटों की होती है।
3. परीक्षण के बाद `plugin-forum` Discord चैनल ([discord.gg/clawd](https://discord.gg/clawd)) में अपने Plugin के थ्रेड में `all good` या जो भी खराब हुआ, उसे पोस्ट करें। यदि अभी तक आपका कोई थ्रेड नहीं है, तो एक बनाएँ।
4. यदि कुछ खराब होता है, तो `Beta blocker: <plugin-name> - <summary>` शीर्षक वाला इश्यू खोलें या अपडेट करें और `beta-blocker` लेबल लगाएँ। अपने थ्रेड में इश्यू का लिंक दें।
5. `main` पर `fix(<plugin-id>): beta blocker - <summary>` शीर्षक वाला PR खोलें और PR तथा अपने Discord थ्रेड, दोनों में इश्यू का लिंक दें। योगदानकर्ता PR पर लेबल नहीं लगा सकते, इसलिए शीर्षक अनुरक्षकों और स्वचालन के लिए PR की ओर से संकेत है। PR वाले अवरोधक मर्ज किए जाते हैं; बिना PR वाले अवरोधकों के बावजूद रिलीज़ जारी हो सकती है।
6. मौन का अर्थ है कि सब ठीक है। समयावधि चूकने का आम तौर पर अर्थ है कि आपका सुधार अगले चक्र में शामिल होगा।

## अगले चरण

<CardGroup cols={2}>
  <Card title="चैनल Plugin" icon="messages-square" href="/hi/plugins/sdk-channel-plugins">
    मैसेजिंग चैनल Plugin बनाएँ
  </Card>
  <Card title="प्रोवाइडर Plugin" icon="cpu" href="/hi/plugins/sdk-provider-plugins">
    मॉडल प्रोवाइडर Plugin बनाएँ
  </Card>
  <Card title="CLI बैकएंड Plugin" icon="terminal" href="/hi/plugins/cli-backend-plugins">
    स्थानीय AI CLI बैकएंड पंजीकृत करें
  </Card>
  <Card title="SDK अवलोकन" icon="book-open" href="/hi/plugins/sdk-overview">
    इम्पोर्ट मैप और पंजीकरण API संदर्भ
  </Card>
  <Card title="रनटाइम सहायक" icon="settings" href="/hi/plugins/sdk-runtime">
    api.runtime के माध्यम से TTS, खोज और सबएजेंट
  </Card>
  <Card title="परीक्षण" icon="test-tubes" href="/hi/plugins/sdk-testing">
    परीक्षण उपयोगिताएँ और पैटर्न
  </Card>
  <Card title="Plugin मैनिफ़ेस्ट" icon="file-json" href="/hi/plugins/manifest">
    पूर्ण मैनिफ़ेस्ट स्कीमा संदर्भ
  </Card>
</CardGroup>

## संबंधित

- [Plugin हुक](/hi/plugins/hooks)
- [Plugin आर्किटेक्चर](/hi/plugins/architecture)
