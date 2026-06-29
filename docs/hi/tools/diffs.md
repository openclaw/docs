---
read_when:
    - आप चाहते हैं कि एजेंट कोड या Markdown संपादनों को डिफ़ के रूप में दिखाएँ
    - आपको कैनवास-तैयार व्यूअर URL या रेंडर की गई diff फ़ाइल चाहिए
    - आपको सुरक्षित डिफ़ॉल्ट्स के साथ नियंत्रित, अस्थायी डिफ़ आर्टिफैक्ट्स चाहिए
sidebarTitle: Diffs
summary: एजेंटों के लिए केवल-पठन अंतर दर्शक और फ़ाइल रेंडरर (वैकल्पिक Plugin टूल)
title: अंतर
x-i18n:
    generated_at: "2026-06-29T00:18:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` एक वैकल्पिक Plugin टूल है, जिसमें छोटा अंतर्निहित सिस्टम मार्गदर्शन और एक सहायक Skills होता है, जो परिवर्तन सामग्री को एजेंटों के लिए रीड-ओनली diff आर्टिफैक्ट में बदलता है।

यह इनमें से कोई भी स्वीकार करता है:

- `before` और `after` टेक्स्ट
- एक unified `patch`

यह लौटा सकता है:

- कैनवास प्रस्तुति के लिए Gateway व्यूअर URL
- संदेश डिलीवरी के लिए रेंडर किया गया फ़ाइल पथ (PNG या PDF)
- एक ही कॉल में दोनों आउटपुट

सक्षम होने पर, Plugin सिस्टम-प्रॉम्प्ट स्थान में संक्षिप्त उपयोग मार्गदर्शन जोड़ता है और उन मामलों के लिए एक विस्तृत Skills भी उपलब्ध कराता है जहाँ एजेंट को अधिक पूर्ण निर्देशों की आवश्यकता होती है।

## त्वरित शुरुआत

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        कैनवास-प्रथम फ़्लो: एजेंट `mode: "view"` के साथ `diffs` कॉल करते हैं और `canvas present` के साथ `details.viewerUrl` खोलते हैं।
      </Tab>
      <Tab title="file">
        चैट फ़ाइल डिलीवरी: एजेंट `mode: "file"` के साथ `diffs` कॉल करते हैं और `path` या `filePath` का उपयोग करके `message` के साथ `details.filePath` भेजते हैं।
      </Tab>
      <Tab title="both">
        संयुक्त: एजेंट एक ही कॉल में दोनों आर्टिफैक्ट पाने के लिए `mode: "both"` के साथ `diffs` कॉल करते हैं।
      </Tab>
    </Tabs>
  </Step>
</Steps>

## अंतर्निहित सिस्टम मार्गदर्शन अक्षम करें

यदि आप `diffs` टूल को सक्षम रखना चाहते हैं लेकिन उसका अंतर्निहित सिस्टम-प्रॉम्प्ट मार्गदर्शन अक्षम करना चाहते हैं, तो `plugins.entries.diffs.hooks.allowPromptInjection` को `false` पर सेट करें:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

यह diffs Plugin के `before_prompt_build` हुक को ब्लॉक करता है, जबकि Plugin, टूल और सहायक Skills उपलब्ध रहते हैं।

यदि आप मार्गदर्शन और टूल दोनों को अक्षम करना चाहते हैं, तो इसके बजाय Plugin को अक्षम करें।

## सामान्य एजेंट वर्कफ़्लो

<Steps>
  <Step title="Call diffs">
    एजेंट इनपुट के साथ `diffs` टूल कॉल करता है।
  </Step>
  <Step title="Read details">
    एजेंट प्रतिक्रिया से `details` फ़ील्ड पढ़ता है।
  </Step>
  <Step title="Present">
    एजेंट या तो `canvas present` के साथ `details.viewerUrl` खोलता है, `path` या `filePath` का उपयोग करके `message` के साथ `details.filePath` भेजता है, या दोनों करता है।
  </Step>
</Steps>

## इनपुट उदाहरण

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## टूल इनपुट संदर्भ

जहाँ उल्लेख न हो, सभी फ़ील्ड वैकल्पिक हैं।

<ParamField path="before" type="string">
  मूल टेक्स्ट। जब `patch` छोड़ा गया हो, तो `after` के साथ आवश्यक।
</ParamField>
<ParamField path="after" type="string">
  अपडेट किया गया टेक्स्ट। जब `patch` छोड़ा गया हो, तो `before` के साथ आवश्यक।
</ParamField>
<ParamField path="patch" type="string">
  Unified diff टेक्स्ट। `before` और `after` के साथ परस्पर अपवर्जित।
</ParamField>
<ParamField path="path" type="string">
  before और after मोड के लिए प्रदर्शित फ़ाइलनाम।
</ParamField>
<ParamField path="lang" type="string">
  before और after मोड के लिए भाषा ओवरराइड संकेत। अज्ञात मान और डिफ़ॉल्ट व्यूअर सेट से बाहर की भाषाएँ plain text पर वापस चली जाती हैं, जब तक कि
  Diff Viewer Language Pack Plugin इंस्टॉल न हो।
</ParamField>

<ParamField path="title" type="string">
  व्यूअर शीर्षक ओवरराइड।
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  आउटपुट मोड। Plugin डिफ़ॉल्ट `defaults.mode` पर डिफ़ॉल्ट होता है। Deprecated alias: `"image"` `"file"` की तरह व्यवहार करता है और backward compatibility के लिए अभी भी स्वीकार किया जाता है।
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  व्यूअर थीम। Plugin डिफ़ॉल्ट `defaults.theme` पर डिफ़ॉल्ट होती है।
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff लेआउट। Plugin डिफ़ॉल्ट `defaults.layout` पर डिफ़ॉल्ट होता है।
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  पूरा संदर्भ उपलब्ध होने पर अपरिवर्तित सेक्शन विस्तार करें। केवल प्रति-कॉल विकल्प (Plugin डिफ़ॉल्ट key नहीं)।
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  रेंडर की गई फ़ाइल का फ़ॉर्मैट। Plugin डिफ़ॉल्ट `defaults.fileFormat` पर डिफ़ॉल्ट होता है।
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG या PDF रेंडरिंग के लिए गुणवत्ता प्रीसेट।
</ParamField>
<ParamField path="fileScale" type="number">
  डिवाइस स्केल ओवरराइड (`1`-`4`)।
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS पिक्सेल में अधिकतम रेंडर चौड़ाई (`640`-`2400`)।
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  व्यूअर और standalone फ़ाइल आउटपुट के लिए सेकंड में आर्टिफैक्ट TTL। अधिकतम 21600।
</ParamField>
<ParamField path="baseUrl" type="string">
  व्यूअर URL origin ओवरराइड। Plugin `viewerBaseUrl` को ओवरराइड करता है। `http` या `https` होना चाहिए, कोई query/hash नहीं।
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    backward compatibility के लिए अभी भी स्वीकार किए जाते हैं:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` और `after` प्रत्येक अधिकतम 512 KiB।
    - `patch` अधिकतम 2 MiB।
    - `path` अधिकतम 2048 bytes।
    - `lang` अधिकतम 128 bytes।
    - `title` अधिकतम 1024 bytes।
    - Patch जटिलता सीमा: अधिकतम 128 फ़ाइलें और कुल 120000 पंक्तियाँ।
    - `patch` और `before` या `after` साथ में अस्वीकार किए जाते हैं।
    - रेंडर की गई फ़ाइल की सुरक्षा सीमाएँ (PNG और PDF पर लागू):
      - `fileQuality: "standard"`: अधिकतम 8 MP (8,000,000 रेंडर किए गए पिक्सेल)।
      - `fileQuality: "hq"`: अधिकतम 14 MP (14,000,000 रेंडर किए गए पिक्सेल)।
      - `fileQuality: "print"`: अधिकतम 24 MP (24,000,000 रेंडर किए गए पिक्सेल)।
      - PDF में अधिकतम 50 पृष्ठों की सीमा भी है।

  </Accordion>
</AccordionGroup>

## सिंटैक्स हाइलाइटिंग

OpenClaw में सामान्य source, config और documentation भाषाओं के लिए सिंटैक्स हाइलाइटिंग शामिल है:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, और `toml`।

`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, और `ps1` जैसे सामान्य aliases उन डिफ़ॉल्ट भाषाओं में normalize किए जाते हैं।

अन्य भाषाओं को हाईलाइट करने के लिए Diff Viewer Language Pack Plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Language Pack उपलब्ध होने पर, OpenClaw कई और भाषाओं को हाईलाइट कर सकता है। यदि पैक इंस्टॉल नहीं है, तो डिफ़ॉल्ट सूची से बाहर की फ़ाइलें फिर भी पठनीय सादे टेक्स्ट के रूप में रेंडर होती हैं। उदाहरणों में Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, और diff फ़ाइलें शामिल हैं।

विवरण के लिए [Diffs Language Pack Plugin](/hi/plugins/reference/diffs-language-pack) और Shiki की अपस्ट्रीम भाषा और alias कैटलॉग के लिए [Shiki languages](https://shiki.style/languages) देखें।

## आउटपुट विवरण अनुबंध

टूल `details` के अंतर्गत संरचित मेटाडेटा लौटाता है।

<AccordionGroup>
  <Accordion title="व्यूअर फ़ील्ड">
    व्यूअर बनाने वाले मोड के लिए साझा फ़ील्ड:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` जब उपलब्ध हो)

  </Accordion>
  <Accordion title="फ़ाइल फ़ील्ड">
    PNG या PDF रेंडर होने पर फ़ाइल फ़ील्ड:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (`filePath` के समान मान, message tool compatibility के लिए)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    मौजूदा callers के लिए भी लौटाए जाते हैं:

    - `format` (`fileFormat` के समान मान)
    - `imagePath` (`filePath` के समान मान)
    - `imageBytes` (`fileBytes` के समान मान)
    - `imageQuality` (`fileQuality` के समान मान)
    - `imageScale` (`fileScale` के समान मान)
    - `imageMaxWidth` (`fileMaxWidth` के समान मान)

  </Accordion>
</AccordionGroup>

मोड व्यवहार सारांश:

| मोड     | क्या लौटाया जाता है                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | केवल व्यूअर फ़ील्ड।                                                                                                    |
| `"file"` | केवल फ़ाइल फ़ील्ड, कोई व्यूअर artifact नहीं।                                                                                  |
| `"both"` | व्यूअर फ़ील्ड और फ़ाइल फ़ील्ड। यदि फ़ाइल रेंडरिंग विफल होती है, तो व्यूअर फिर भी `fileError` और `imageError` alias के साथ लौटता है। |

## संक्षिप्त किए गए अपरिवर्तित सेक्शन

- व्यूअर `N unmodified lines` जैसी पंक्तियाँ दिखा सकता है।
- उन पंक्तियों पर expand controls शर्तों पर निर्भर हैं और हर input kind के लिए गारंटीकृत नहीं हैं।
- Expand controls तब दिखाई देते हैं जब रेंडर किए गए diff में expandable context data होता है, जो before और after input के लिए सामान्य है।
- कई unified patch inputs के लिए, छोड़े गए context bodies parsed patch hunks में उपलब्ध नहीं होते, इसलिए पंक्ति expand controls के बिना दिखाई दे सकती है। यह अपेक्षित व्यवहार है।
- `expandUnchanged` केवल तब लागू होता है जब expandable context मौजूद हो।

## Plugin डिफ़ॉल्ट

Plugin-व्यापी डिफ़ॉल्ट `~/.openclaw/openclaw.json` में सेट करें:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

समर्थित डिफ़ॉल्ट:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

स्पष्ट टूल पैरामीटर इन डिफ़ॉल्ट को override करते हैं।

### स्थायी व्यूअर URL कॉन्फ़िगरेशन

<ParamField path="viewerBaseUrl" type="string">
  जब कोई टूल कॉल `baseUrl` पास नहीं करता, तब लौटाए गए व्यूअर links के लिए Plugin-स्वामित्व वाला fallback। `http` या `https` होना चाहिए, query/hash नहीं।
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## सुरक्षा कॉन्फ़िगरेशन

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: व्यूअर routes के लिए non-loopback requests अस्वीकार किए जाते हैं। `true`: tokenized path मान्य होने पर remote viewers की अनुमति होती है।
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Artifact lifecycle और storage

- आर्टिफैक्ट temp सबफ़ोल्डर के अंतर्गत संग्रहीत होते हैं: `$TMPDIR/openclaw-diffs`.
- व्यूअर आर्टिफैक्ट मेटाडेटा में शामिल है:
  - यादृच्छिक आर्टिफैक्ट आईडी (20 हेक्स वर्ण)
  - यादृच्छिक टोकन (48 हेक्स वर्ण)
  - `createdAt` और `expiresAt`
  - संग्रहीत `viewer.html` पथ
- निर्दिष्ट न होने पर डिफ़ॉल्ट आर्टिफैक्ट TTL 30 मिनट है।
- अधिकतम स्वीकृत व्यूअर TTL 6 घंटे है।
- आर्टिफैक्ट बनाने के बाद क्लीनअप अवसरवादी रूप से चलता है।
- समाप्त हो चुके आर्टिफैक्ट हटाए जाते हैं।
- मेटाडेटा न होने पर fallback क्लीनअप 24 घंटे से पुराने stale फ़ोल्डर हटाता है।

## व्यूअर URL और नेटवर्क व्यवहार

व्यूअर रूट:

- `/plugins/diffs/view/{artifactId}/{token}`

व्यूअर एसेट:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` जब diff, Diff Viewer Language Pack की किसी भाषा का उपयोग करता है

व्यूअर दस्तावेज़ उन एसेट को व्यूअर URL के सापेक्ष resolve करता है, इसलिए वैकल्पिक `baseUrl` पथ prefix दोनों एसेट अनुरोधों के लिए भी सुरक्षित रहता है।

URL निर्माण व्यवहार:

- यदि tool-call `baseUrl` दिया गया है, तो उसे कड़ी validation के बाद उपयोग किया जाता है।
- अन्यथा यदि Plugin `viewerBaseUrl` configured है, तो उसका उपयोग किया जाता है।
- दोनों override न होने पर, व्यूअर URL डिफ़ॉल्ट रूप से loopback `127.0.0.1` होता है।
- यदि gateway bind mode `custom` है और `gateway.customBindHost` सेट है, तो उसी host का उपयोग किया जाता है।

`baseUrl` नियम:

- `http://` या `https://` होना चाहिए।
- Query और hash अस्वीकार किए जाते हैं।
- Origin के साथ वैकल्पिक base path की अनुमति है।

## सुरक्षा मॉडल

<AccordionGroup>
  <Accordion title="व्यूअर hardening">
    - डिफ़ॉल्ट रूप से केवल loopback।
    - कड़ी आईडी और टोकन validation के साथ tokenized व्यूअर पथ।
    - व्यूअर response CSP:
      - `default-src 'none'`
      - script और एसेट केवल self से
      - कोई outbound `connect-src` नहीं
    - remote access enabled होने पर remote miss throttling:
      - 60 सेकंड में 40 विफलताएँ
      - 60 सेकंड lockout (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="फ़ाइल rendering hardening">
    - Screenshot browser request routing डिफ़ॉल्ट रूप से deny है।
    - केवल `http://127.0.0.1/plugins/diffs/assets/*` से local व्यूअर एसेट की अनुमति है।
    - बाहरी नेटवर्क अनुरोध block किए जाते हैं।

  </Accordion>
</AccordionGroup>

## फ़ाइल मोड के लिए browser आवश्यकताएँ

`mode: "file"` और `mode: "both"` को Chromium-compatible browser चाहिए।

Resolution क्रम:

<Steps>
  <Step title="Config">
    OpenClaw config में `browser.executablePath`.
  </Step>
  <Step title="Environment variables">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform fallback">
    Platform command/path discovery fallback.
  </Step>
</Steps>

सामान्य विफलता text:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge, या Brave install करके, या ऊपर दिए गए executable path विकल्पों में से एक सेट करके ठीक करें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="इनपुट validation त्रुटियाँ">
    - `Provide patch or both before and after text.` — `before` और `after` दोनों शामिल करें, या `patch` दें।
    - `Provide either patch or before/after input, not both.` — input modes को mix न करें।
    - `Invalid baseUrl: ...` — वैकल्पिक path के साथ `http(s)` origin उपयोग करें, query/hash नहीं।
    - `{field} exceeds maximum size (...)` — payload आकार घटाएँ।
    - बड़े patch का अस्वीकार होना — patch फ़ाइल count या कुल lines घटाएँ।

  </Accordion>
  <Accordion title="व्यूअर accessibility">
    - व्यूअर URL डिफ़ॉल्ट रूप से `127.0.0.1` पर resolve होता है।
    - remote access scenarios के लिए, इनमें से कोई एक करें:
      - Plugin `viewerBaseUrl` सेट करें, या
      - प्रति tool call `baseUrl` pass करें, या
      - `gateway.bind=custom` और `gateway.customBindHost` उपयोग करें
    - यदि `gateway.trustedProxies` में same-host proxy के लिए loopback शामिल है (उदाहरण के लिए Tailscale Serve), तो forwarded client-IP headers के बिना raw loopback व्यूअर अनुरोध design के अनुसार fail closed होते हैं।
    - उस proxy topology के लिए:
      - जब आपको केवल attachment चाहिए, तो `mode: "file"` या `mode: "both"` को प्राथमिकता दें, या
      - जब आपको shareable व्यूअर URL चाहिए, तो जानबूझकर `security.allowRemoteViewer` enable करें और Plugin `viewerBaseUrl` सेट करें या proxy/public `baseUrl` pass करें
    - `security.allowRemoteViewer` केवल तब enable करें जब आप external व्यूअर access चाहते हों।

  </Accordion>
  <Accordion title="Unmodified-lines row में expand button नहीं है">
    यह patch input के लिए तब हो सकता है जब patch expandable context नहीं रखता। यह expected है और व्यूअर failure का संकेत नहीं देता।
  </Accordion>
  <Accordion title="आर्टिफैक्ट नहीं मिला">
    - TTL के कारण आर्टिफैक्ट expire हो गया।
    - Token या path बदल गया।
    - क्लीनअप ने stale data हटा दिया।

  </Accordion>
</AccordionGroup>

## संचालन मार्गदर्शन

- canvas में local interactive reviews के लिए `mode: "view"` को प्राथमिकता दें।
- attachment की आवश्यकता वाले outbound chat channels के लिए `mode: "file"` को प्राथमिकता दें।
- जब तक आपकी deployment को remote व्यूअर URLs की आवश्यकता न हो, `allowRemoteViewer` disabled रखें।
- sensitive diffs के लिए स्पष्ट छोटे `ttlSeconds` सेट करें।
- आवश्यकता न होने पर diff input में secrets भेजने से बचें।
- यदि आपका channel images को aggressively compress करता है (उदाहरण के लिए Telegram या WhatsApp), तो PDF output (`fileFormat: "pdf"`) को प्राथमिकता दें।

<Note>
Diff rendering engine [Diffs](https://diffs.com) द्वारा powered है।
</Note>

## संबंधित

- [Browser](/hi/tools/browser)
- [Plugins](/hi/tools/plugin)
- [Tools overview](/hi/tools)
