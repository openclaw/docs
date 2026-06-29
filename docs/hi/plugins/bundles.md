---
read_when:
    - आप Codex, Claude या Cursor-संगत बंडल इंस्टॉल करना चाहते हैं
    - आपको यह समझना होगा कि OpenClaw बंडल सामग्री को नेटिव सुविधाओं में कैसे मैप करता है
    - आप bundle पहचान या अनुपलब्ध क्षमताओं को debug कर रहे हैं
summary: Codex, Claude, और Cursor बंडलों को OpenClaw plugins के रूप में इंस्टॉल और उपयोग करें
title: Plugin बंडल
x-i18n:
    generated_at: "2026-06-28T23:32:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw तीन बाहरी इकोसिस्टम से Plugin इंस्टॉल कर सकता है: **Codex**, **Claude**,
और **Cursor**। इन्हें **बंडल** कहा जाता है — सामग्री और मेटाडेटा पैक जिन्हें
OpenClaw Skills, हुक और MCP टूल जैसी नेटिव सुविधाओं में मैप करता है।

<Info>
  बंडल नेटिव OpenClaw Plugin के समान **नहीं** होते। नेटिव Plugin
  इन-प्रोसेस चलते हैं और कोई भी क्षमता रजिस्टर कर सकते हैं। बंडल सामग्री पैक हैं जिनमें
  चुनिंदा सुविधा मैपिंग और सीमित ट्रस्ट बाउंड्री होती है।
</Info>

## बंडल क्यों मौजूद हैं

कई उपयोगी Plugin Codex, Claude या Cursor फ़ॉर्मैट में प्रकाशित होते हैं। लेखकों से
उन्हें नेटिव OpenClaw Plugin के रूप में दोबारा लिखवाने के बजाय, OpenClaw
इन फ़ॉर्मैट को पहचानता है और उनकी समर्थित सामग्री को नेटिव सुविधा सेट में मैप करता है।
इसका मतलब है कि आप Claude कमांड पैक या Codex Skill बंडल इंस्टॉल कर सकते हैं
और तुरंत उसका उपयोग कर सकते हैं।

## बंडल इंस्टॉल करें

<Steps>
  <Step title="डायरेक्टरी, आर्काइव या मार्केटप्लेस से इंस्टॉल करें">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="पहचान सत्यापित करें">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    बंडल `Format: bundle` के रूप में दिखते हैं, जिनका subtype `codex`, `claude` या `cursor` होता है।

  </Step>

  <Step title="रीस्टार्ट करें और उपयोग करें">
    ```bash
    openclaw gateway restart
    ```

    मैप की गई सुविधाएं (Skills, हुक, MCP टूल, LSP डिफ़ॉल्ट) अगले सेशन में उपलब्ध होती हैं।

  </Step>
</Steps>

## OpenClaw बंडल से क्या मैप करता है

आज OpenClaw में हर बंडल सुविधा नहीं चलती। यहां बताया गया है कि क्या काम करता है और क्या
पहचाना गया है लेकिन अभी वायर नहीं किया गया है।

### अभी समर्थित

| सुविधा       | यह कैसे मैप होती है                                                                                       | इन पर लागू     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skill सामग्री | बंडल Skill रूट सामान्य OpenClaw Skills के रूप में लोड होते हैं                                                 | सभी फ़ॉर्मैट    |
| कमांड      | `commands/` और `.cursor/commands/` को Skill रूट माना जाता है                                        | Claude, Cursor |
| हुक पैक    | OpenClaw-शैली के `HOOK.md` + `handler.ts` लेआउट                                                   | Codex          |
| MCP टूल     | बंडल MCP कॉन्फ़िग को एम्बेडेड OpenClaw सेटिंग्स में मर्ज किया जाता है; समर्थित stdio और HTTP सर्वर लोड होते हैं | सभी फ़ॉर्मैट    |
| LSP सर्वर   | Claude `.lsp.json` और मैनिफ़ेस्ट-घोषित `lspServers` को एम्बेडेड OpenClaw LSP डिफ़ॉल्ट में मर्ज किया जाता है  | Claude         |
| सेटिंग्स      | Claude `settings.json` को एम्बेडेड OpenClaw डिफ़ॉल्ट के रूप में इम्पोर्ट किया जाता है                                     | Claude         |

#### Skill सामग्री

- बंडल Skill रूट सामान्य OpenClaw Skill रूट के रूप में लोड होते हैं
- Claude `commands` रूट को अतिरिक्त Skill रूट माना जाता है
- Cursor `.cursor/commands` रूट को अतिरिक्त Skill रूट माना जाता है

इसका मतलब है कि Claude मार्कडाउन कमांड फ़ाइलें सामान्य OpenClaw Skill
लोडर के ज़रिए काम करती हैं। Cursor कमांड मार्कडाउन भी उसी पथ से काम करता है।

#### हुक पैक

- बंडल हुक रूट **सिर्फ़** तब काम करते हैं जब वे सामान्य OpenClaw हुक-पैक
  लेआउट का उपयोग करते हैं। आज यह मुख्य रूप से Codex-संगत मामला है:
  - `HOOK.md`
  - `handler.ts` या `handler.js`

#### एम्बेडेड OpenClaw के लिए MCP

- सक्षम बंडल MCP सर्वर कॉन्फ़िग दे सकते हैं
- OpenClaw बंडल MCP कॉन्फ़िग को प्रभावी एम्बेडेड OpenClaw सेटिंग्स में
  `mcpServers` के रूप में मर्ज करता है
- OpenClaw एम्बेडेड OpenClaw एजेंट टर्न के दौरान समर्थित बंडल MCP टूल
  stdio सर्वर लॉन्च करके या HTTP सर्वर से कनेक्ट करके उपलब्ध कराता है
- `coding` और `messaging` टूल प्रोफ़ाइल में बंडल MCP टूल डिफ़ॉल्ट रूप से
  शामिल होते हैं; किसी एजेंट या Gateway के लिए बाहर रहने हेतु `tools.deny: ["bundle-mcp"]` का उपयोग करें
- प्रोजेक्ट-local एम्बेडेड एजेंट सेटिंग्स बंडल डिफ़ॉल्ट के बाद भी लागू होती हैं, इसलिए ज़रूरत पड़ने पर workspace
  सेटिंग्स बंडल MCP एंट्री को ओवरराइड कर सकती हैं
- बंडल MCP टूल कैटलॉग रजिस्ट्रेशन से पहले निर्धारक रूप से सॉर्ट किए जाते हैं, इसलिए
  upstream `listTools()` क्रम में बदलाव prompt-cache टूल ब्लॉक को अस्त-व्यस्त नहीं करते

##### ट्रांसपोर्ट

MCP सर्वर stdio या HTTP ट्रांसपोर्ट का उपयोग कर सकते हैं:

**Stdio** एक चाइल्ड प्रोसेस लॉन्च करता है:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** डिफ़ॉल्ट रूप से `sse` पर, या अनुरोध किए जाने पर `streamable-http` पर चल रहे MCP सर्वर से कनेक्ट करता है:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` को `"streamable-http"` या `"sse"` पर सेट किया जा सकता है; छोड़े जाने पर, OpenClaw `sse` का उपयोग करता है
- `type: "http"` एक CLI-नेटिव downstream आकार है; OpenClaw कॉन्फ़िग में `transport: "streamable-http"` का उपयोग करें। `openclaw mcp set` और `openclaw doctor --fix` सामान्य alias को normalize करते हैं।
- केवल `http:` और `https:` URL स्कीम की अनुमति है
- `headers` वैल्यू `${ENV_VAR}` interpolation का समर्थन करती हैं
- `command` और `url` दोनों वाली सर्वर एंट्री अस्वीकार कर दी जाती है
- URL क्रेडेंशियल (userinfo और query params) टूल
  विवरण और लॉग से redact किए जाते हैं
- `connectionTimeoutMs` stdio और HTTP दोनों ट्रांसपोर्ट के लिए डिफ़ॉल्ट 30-सेकंड कनेक्शन टाइमआउट को
  ओवरराइड करता है

##### टूल नामकरण

OpenClaw बंडल MCP टूल को provider-safe नामों के साथ
`serverName__toolName` रूप में रजिस्टर करता है। उदाहरण के लिए, `"vigil-harbor"` कुंजी वाला सर्वर जो
`memory_search` टूल उपलब्ध कराता है, `vigil-harbor__memory_search` के रूप में रजिस्टर होता है।

- `A-Za-z0-9_-` से बाहर के वर्णों को `-` से बदला जाता है
- जो फ्रैगमेंट non-letter से शुरू होते, उन्हें letter prefix मिलता है, इसलिए `12306` जैसी numeric
  सर्वर कुंजियां provider-safe टूल prefix बन जाती हैं
- सर्वर prefix 30 वर्णों तक सीमित हैं
- पूरे टूल नाम 64 वर्णों तक सीमित हैं
- खाली सर्वर नाम `mcp` पर fall back करते हैं
- टकराने वाले sanitized नामों को numeric suffix से अलग किया जाता है
- अंतिम exposed टूल क्रम safe name के अनुसार निर्धारक होता है ताकि दोहराए गए embedded-agent
  टर्न cache-stable रहें
- प्रोफ़ाइल फ़िल्टरिंग एक बंडल MCP सर्वर के सभी टूल को `bundle-mcp` द्वारा plugin-owned
  मानती है, इसलिए प्रोफ़ाइल allowlists और deny lists में व्यक्तिगत exposed टूल नाम या
  `bundle-mcp` Plugin कुंजी शामिल हो सकती है

#### एम्बेडेड OpenClaw सेटिंग्स

- बंडल सक्षम होने पर Claude `settings.json` को डिफ़ॉल्ट एम्बेडेड OpenClaw सेटिंग्स के रूप में इम्पोर्ट किया जाता है
- OpenClaw shell override keys लागू करने से पहले उन्हें sanitize करता है

Sanitized keys:

- `shellPath`
- `shellCommandPrefix`

#### एम्बेडेड OpenClaw LSP

- सक्षम Claude बंडल LSP सर्वर कॉन्फ़िग दे सकते हैं
- OpenClaw `.lsp.json` और किसी भी manifest-declared `lspServers` पथ को लोड करता है
- बंडल LSP कॉन्फ़िग को प्रभावी एम्बेडेड OpenClaw LSP डिफ़ॉल्ट में मर्ज किया जाता है
- आज केवल समर्थित stdio-backed LSP सर्वर चलाए जा सकते हैं; unsupported
  ट्रांसपोर्ट फिर भी `openclaw plugins inspect <id>` में दिखते हैं

### पहचाना गया लेकिन चलाया नहीं गया

इन्हें पहचाना जाता है और diagnostics में दिखाया जाता है, लेकिन OpenClaw इन्हें नहीं चलाता:

- Claude `agents`, `hooks.json` automation, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Codex inline/app metadata, capability reporting से परे

## बंडल फ़ॉर्मैट

<AccordionGroup>
  <Accordion title="Codex बंडल">
    मार्कर: `.codex-plugin/plugin.json`

    वैकल्पिक सामग्री: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex बंडल OpenClaw के साथ सबसे अच्छे तब फिट होते हैं जब वे Skill रूट और OpenClaw-शैली
    हुक-पैक डायरेक्टरी (`HOOK.md` + `handler.ts`) का उपयोग करते हैं।

  </Accordion>

  <Accordion title="Claude बंडल">
    दो पहचान मोड:

    - **मैनिफ़ेस्ट-आधारित:** `.claude-plugin/plugin.json`
    - **बिना मैनिफ़ेस्ट:** डिफ़ॉल्ट Claude लेआउट (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude-विशिष्ट व्यवहार:

    - `commands/` को Skill सामग्री माना जाता है
    - `settings.json` को एम्बेडेड OpenClaw सेटिंग्स में इम्पोर्ट किया जाता है (shell override keys sanitize किए जाते हैं)
    - `.mcp.json` समर्थित stdio टूल को एम्बेडेड OpenClaw में उपलब्ध कराता है
    - `.lsp.json` और manifest-declared `lspServers` पथ एम्बेडेड OpenClaw LSP डिफ़ॉल्ट में लोड होते हैं
    - `hooks/hooks.json` पहचाना जाता है लेकिन चलाया नहीं जाता
    - मैनिफ़ेस्ट में custom component paths additive होते हैं (वे डिफ़ॉल्ट बढ़ाते हैं, उन्हें बदलते नहीं)

  </Accordion>

  <Accordion title="Cursor बंडल">
    मार्कर: `.cursor-plugin/plugin.json`

    वैकल्पिक सामग्री: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` को Skill सामग्री माना जाता है
    - `.cursor/rules/`, `.cursor/agents/`, और `.cursor/hooks.json` केवल detect-only हैं

  </Accordion>
</AccordionGroup>

## पहचान प्राथमिकता

OpenClaw पहले नेटिव Plugin फ़ॉर्मैट की जांच करता है:

1. `openclaw.plugin.json` या `openclaw.extensions` वाला वैध `package.json` — **नेटिव Plugin** माना जाता है
2. बंडल मार्कर (`.codex-plugin/`, `.claude-plugin/`, या डिफ़ॉल्ट Claude/Cursor लेआउट) — **बंडल** माना जाता है

यदि किसी डायरेक्टरी में दोनों मौजूद हैं, तो OpenClaw नेटिव पथ का उपयोग करता है। इससे
dual-format पैकेज को आंशिक रूप से बंडल के रूप में इंस्टॉल होने से रोका जाता है।

## Runtime dependencies और cleanup

- Third-party compatible बंडल को startup `npm install` repair नहीं मिलता। उन्हें
  `openclaw plugins install` के ज़रिए इंस्टॉल किया जाना चाहिए और installed Plugin directory में
  अपनी सभी ज़रूरी चीज़ें शिप करनी चाहिए।
- OpenClaw-owned bundled Plugin या तो core में lightweight रूप से शिप किए जाते हैं या
  Plugin installer के ज़रिए डाउनलोड किए जा सकते हैं। Gateway startup उनके लिए कभी
  package manager नहीं चलाता।
- `openclaw doctor --fix` legacy staged dependency directories हटाता है और
  config में reference होने पर local Plugin index से गायब downloadable Plugin को
  recover कर सकता है।

## सुरक्षा

बंडल की trust boundary नेटिव Plugin से सीमित होती है:

- OpenClaw arbitrary bundle runtime modules को in-process लोड **नहीं** करता
- Skills और hook-pack paths को Plugin root के अंदर ही रहना चाहिए (boundary-checked)
- Settings files समान boundary checks के साथ पढ़ी जाती हैं
- समर्थित stdio MCP सर्वर subprocess के रूप में लॉन्च किए जा सकते हैं

इससे बंडल डिफ़ॉल्ट रूप से अधिक सुरक्षित बनते हैं, लेकिन फिर भी आपको third-party
बंडल को उनके द्वारा expose की गई सुविधाओं के लिए trusted content मानना चाहिए।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="बंडल पहचाना गया है लेकिन क्षमताएं नहीं चलतीं">
    `openclaw plugins inspect <id>` चलाएं। यदि कोई क्षमता सूचीबद्ध है लेकिन
    not wired के रूप में चिह्नित है, तो यह product limit है — खराब install नहीं।
  </Accordion>

  <Accordion title="Claude command files दिखाई नहीं देतीं">
    सुनिश्चित करें कि बंडल सक्षम है और markdown files किसी detected
    `commands/` या `skills/` root के अंदर हैं।
  </Accordion>

  <Accordion title="Claude settings लागू नहीं होतीं">
    केवल `settings.json` से एम्बेडेड OpenClaw settings समर्थित हैं। OpenClaw
    बंडल settings को raw config patches नहीं मानता।
  </Accordion>

  <Accordion title="Claude hooks execute नहीं होते">
    `hooks/hooks.json` detect-only है। यदि आपको runnable hooks चाहिए, तो
    OpenClaw hook-pack layout का उपयोग करें या नेटिव Plugin शिप करें।
  </Accordion>
</AccordionGroup>

## संबंधित

- [Plugin इंस्टॉल और कॉन्फ़िगर करें](/hi/tools/plugin)
- [Plugin बनाना](/hi/plugins/building-plugins) — नेटिव Plugin बनाएं
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) — नेटिव मैनिफ़ेस्ट schema
