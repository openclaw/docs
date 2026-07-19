---
read_when:
    - आप चाहते हैं कि एजेंट कोड या Markdown के संपादनों को डिफ़ के रूप में दिखाएँ
    - आपको कैनवास के लिए तैयार व्यूअर URL या रेंडर की गई डिफ़ फ़ाइल चाहिए
    - आपको सुरक्षित डिफ़ॉल्ट वाले नियंत्रित, अस्थायी डिफ़ आर्टिफ़ैक्ट चाहिए
sidebarTitle: Diffs
summary: एजेंटों के लिए केवल-पठन डिफ़ दर्शक और फ़ाइल रेंडरर (वैकल्पिक Plugin टूल)
title: अंतर
x-i18n:
    generated_at: "2026-07-19T10:07:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baeb5dd1277120e57178f092e3ae1616edd3389a54721c929d8711301535d302
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` एक वैकल्पिक बंडल किया गया Plugin टूल है, जो पहले/बाद के टेक्स्ट या एकीकृत पैच को केवल-पढ़ने योग्य डिफ़ आर्टिफ़ैक्ट में बदलता है। यह सिस्टम प्रॉम्प्ट की शुरुआत में एजेंट के लिए संक्षिप्त मार्गदर्शन भी जोड़ता है और अधिक विस्तृत निर्देशों के लिए एक सहायक Skill के साथ आता है।

इनपुट: `before` + `after` टेक्स्ट, या एक एकीकृत `patch` (परस्पर अनन्य)।

आउटपुट: कैनवास प्रस्तुति के लिए Gateway व्यूअर URL, संदेश डिलीवरी के लिए रेंडर किए गए PNG/PDF की फ़ाइल पाथ, या दोनों।

## त्वरित शुरुआत

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Plugin सक्षम करें">
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
  <Step title="मोड चुनें">
    <Tabs>
      <Tab title="view">
        कैनवास-प्रथम प्रवाह: एजेंट `mode: "view"` के साथ `diffs` को कॉल करते हैं और `canvas present` के साथ `details.viewerUrl` खोलते हैं।
      </Tab>
      <Tab title="file">
        चैट फ़ाइल डिलीवरी: एजेंट `mode: "file"` के साथ `diffs` को कॉल करते हैं और `path` या `filePath` का उपयोग करके `message` के साथ `details.filePath` भेजते हैं।
      </Tab>
      <Tab title="both">
        संयुक्त (डिफ़ॉल्ट): एजेंट एक ही कॉल में दोनों आर्टिफ़ैक्ट प्राप्त करने के लिए `mode: "both"` के साथ `diffs` को कॉल करते हैं।
      </Tab>
    </Tabs>
  </Step>
</Steps>

## अंतर्निहित सिस्टम मार्गदर्शन अक्षम करें

टूल को बनाए रखते हुए शुरुआत में जोड़े गए सिस्टम-प्रॉम्प्ट मार्गदर्शन को हटाने के लिए, `plugins.entries.diffs.hooks.allowPromptInjection` को `false` पर सेट करें:

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

इससे टूल और Skill उपलब्ध रहते हुए Plugin का `before_prompt_build` हुक ब्लॉक हो जाता है। मार्गदर्शन और टूल दोनों को अक्षम करने के लिए, इसके बजाय Plugin को अक्षम करें।

## टूल इनपुट संदर्भ

जब तक उल्लेख न किया गया हो, सभी फ़ील्ड वैकल्पिक हैं।

<ParamField path="before" type="string">
  मूल टेक्स्ट। `patch` छोड़े जाने पर `after` के साथ आवश्यक।
</ParamField>
<ParamField path="after" type="string">
  अपडेट किया गया टेक्स्ट। `patch` छोड़े जाने पर `before` के साथ आवश्यक।
</ParamField>
<ParamField path="patch" type="string">
  एकीकृत डिफ़ टेक्स्ट। `before` और `after` के साथ परस्पर अनन्य।
</ParamField>
<ParamField path="path" type="string">
  पहले/बाद मोड के लिए प्रदर्शित फ़ाइल नाम।
</ParamField>
<ParamField path="lang" type="string">
  पहले/बाद मोड के लिए भाषा ओवरराइड संकेत। Diff Viewer Language Pack Plugin इंस्टॉल न होने पर अज्ञात मान और डिफ़ॉल्ट व्यूअर सेट से बाहर की भाषाएँ सादे टेक्स्ट पर फ़ॉलबैक करती हैं।
</ParamField>
<ParamField path="title" type="string">
  व्यूअर शीर्षक ओवरराइड।
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  आउटपुट मोड। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.mode` (`both`) उपयोग होता है। अप्रचलित उपनाम: `"image"`, `"file"` के समान व्यवहार करता है।
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  व्यूअर थीम। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.theme` उपयोग होता है।
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  डिफ़ लेआउट। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.layout` उपयोग होता है।
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  पूर्ण संदर्भ उपलब्ध होने पर अपरिवर्तित अनुभाग विस्तृत करें। केवल प्रति-कॉल विकल्प (Plugin की डिफ़ॉल्ट कुंजी नहीं)।
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  रेंडर की गई फ़ाइल का प्रारूप। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.fileFormat` उपयोग होता है।
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF रेंडरिंग के लिए गुणवत्ता प्रीसेट।
</ParamField>
<ParamField path="fileScale" type="number">
  डिवाइस स्केल ओवरराइड (`1`-`4`)।
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS पिक्सेल में अधिकतम रेंडर चौड़ाई (`640`-`2400`)।
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  व्यूअर और स्वतंत्र फ़ाइल आउटपुट के लिए आर्टिफ़ैक्ट TTL, सेकंड में। अधिकतम `21600`।
</ParamField>
<ParamField path="baseUrl" type="string">
  व्यूअर URL मूल ओवरराइड। Plugin के `viewerBaseUrl` को ओवरराइड करता है। `http` या `https` होना आवश्यक है, क्वेरी/हैश के बिना।
</ParamField>

<AccordionGroup>
  <Accordion title="सत्यापन और सीमाएँ">
    - `before`/`after`: प्रत्येक का अधिकतम 512 KiB।
    - `patch`: अधिकतम 2 MiB।
    - `path`: अधिकतम 2048 बाइट।
    - `lang`: अधिकतम 128 बाइट।
    - `title`: अधिकतम 1024 बाइट।
    - पैच जटिलता सीमा: अधिकतम 128 फ़ाइलें और कुल 120000 पंक्तियाँ।
    - `before`/`after` के साथ `patch` अस्वीकार कर दिया जाता है।
    - रेंडर की गई फ़ाइल की सुरक्षा सीमाएँ (PNG और PDF):
      - `fileQuality: "standard"`: अधिकतम 8 MP (8,000,000 रेंडर किए गए पिक्सेल)।
      - `fileQuality: "hq"`: अधिकतम 14 MP।
      - `fileQuality: "print"`: अधिकतम 24 MP।
      - PDF की सीमा भी अधिकतम 50 पृष्ठ है।

  </Accordion>
</AccordionGroup>

## सिंटैक्स हाइलाइटिंग

अंतर्निहित भाषाएँ:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, और `toml`।

सामान्य उपनाम (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, आदि) उन भाषाओं में सामान्यीकृत होते हैं।

अधिक भाषाओं (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff, और अन्य) के लिए Diff Viewer Language Pack Plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

पैक के बिना भी असमर्थित भाषाएँ पठनीय सादे टेक्स्ट के रूप में रेंडर होती हैं। अपस्ट्रीम कैटलॉग के लिए [Diffs Language Pack Plugin](/hi/plugins/reference/diffs-language-pack) और [Shiki भाषाएँ](https://shiki.style/languages) देखें।

## आउटपुट विवरण अनुबंध

सभी सफल परिणामों में `changed` शामिल होता है: समान पहले/बाद इनपुट किसी आर्टिफ़ैक्ट को बनाए बिना `false` लौटाता है; रेंडर किए गए परिणाम `true` लौटाते हैं।

<AccordionGroup>
  <Accordion title="व्यूअर फ़ील्ड (view और both मोड)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (उपलब्ध होने पर `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

  </Accordion>
  <Accordion title="फ़ाइल फ़ील्ड (file और both मोड)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (संदेश टूल संगतता के लिए `filePath` के समान मान)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| मोड     | लौटाता है                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | केवल व्यूअर फ़ील्ड।                                                                             |
| `"file"` | केवल फ़ाइल फ़ील्ड, कोई व्यूअर आर्टिफ़ैक्ट नहीं।                                                           |
| `"both"` | व्यूअर फ़ील्ड और फ़ाइल फ़ील्ड। यदि फ़ाइल रेंडरिंग विफल होती है, तो व्यूअर फिर भी `fileError` के साथ लौटता है। |

### संक्षिप्त किए गए अपरिवर्तित अनुभाग

व्यूअर `N unmodified lines` जैसी पंक्तियाँ दिखाता है। विस्तृत करने के नियंत्रण केवल तब दिखाई देते हैं, जब रेंडर किए गए डिफ़ में विस्तार योग्य संदर्भ डेटा होता है (पहले/बाद इनपुट के लिए सामान्य)। कई एकीकृत पैच अपने हंक में संदर्भ बॉडी छोड़ देते हैं, इसलिए पंक्ति विस्तार नियंत्रण के बिना दिखाई दे सकती है—यह अपेक्षित है, बग नहीं। `expandUnchanged` केवल तभी लागू होता है, जब विस्तार योग्य संदर्भ मौजूद हो।

### एकाधिक-फ़ाइल नेविगेशन

एक से अधिक फ़ाइलों को प्रभावित करने वाले पैच बदली गई फ़ाइलों के सारांश कार्ड से शुरू होते हैं: कुल `+N` / `-N` संख्याएँ, प्रति-फ़ाइल संख्याएँ, जोड़े गए/हटाए गए/पुनर्नामित बैज और प्रत्येक फ़ाइल पर जाने वाले एंकर लिंक। रेंडर की गई PNG/PDF फ़ाइलें प्रति-फ़ाइल हेडर संख्याएँ बनाए रखती हैं, लेकिन इंटरैक्टिव दृश्य टॉगल हटा देती हैं, क्योंकि स्थिर फ़ाइल में ये निष्क्रिय नियंत्रण होते हैं।

## Plugin डिफ़ॉल्ट

`~/.openclaw/openclaw.json` में पूरे Plugin के डिफ़ॉल्ट सेट करें:

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

समर्थित `defaults` कुंजियाँ: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`। स्पष्ट टूल कॉल पैरामीटर इन्हें ओवरराइड करते हैं।

### स्थायी व्यूअर URL कॉन्फ़िगरेशन

<ParamField path="viewerBaseUrl" type="string">
  जब टूल कॉल `baseUrl` पास नहीं करती है, तब लौटाए गए व्यूअर लिंक के लिए Plugin के स्वामित्व वाला फ़ॉलबैक। `http` या `https` होना आवश्यक है, क्वेरी/हैश के बिना।
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
  `false`: व्यूअर रूट के लिए गैर-लूपबैक अनुरोध अस्वीकार किए जाते हैं। `true`: टोकनयुक्त पाथ मान्य होने पर रिमोट व्यूअर की अनुमति होती है।
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

## आर्टिफ़ैक्ट जीवनचक्र और स्टोरेज

- व्यूअर HTML और मेटाडेटा, Diffs Plugin ब्लॉब नेमस्पेस के अंतर्गत साझा `state/openclaw.sqlite` डेटाबेस में रहते हैं। HTML gzip-संपीड़ित होता है; SQLite यादृच्छिक URL टोकन के केवल SHA-256 हैश को संग्रहीत करता है, स्वयं टोकन को नहीं।
- रेंडर की गई PNG/PDF फ़ाइलें `$TMPDIR/openclaw-diffs` के अंतर्गत अस्थायी रूप से साकार रहती हैं, क्योंकि चैनल डिलीवरी के लिए फ़ाइल पथ आवश्यक है। उनकी समाप्ति का मेटाडेटा SQLite के स्वामित्व में है; कोई JSON साइडकार नहीं लिखा जाता।
- डिफ़ॉल्ट आर्टिफ़ैक्ट TTL: 30 मिनट। अधिकतम स्वीकृत TTL: 6 घंटे।
- प्रत्येक आर्टिफ़ैक्ट निर्माण कॉल के बाद अवसर मिलने पर क्लीनअप चलता है। पहले समाप्त हो चुकी SQLite पंक्तियाँ हटाई जाती हैं, फिर उनसे संबंधित कोई भी PNG/PDF डायरेक्टरी।
- एक फ़ॉलबैक स्वीप, बिना पंक्ति वाले 24 घंटे से पुराने अस्थायी फ़ोल्डर हटा देता है। पुराने `meta.json`, `file-meta.json`, और `viewer.html` कैश न तो आयात किए जाते हैं, न पढ़े जाते हैं।

## व्यूअर URL और नेटवर्क व्यवहार

व्यूअर रूट: `/plugins/diffs/view/{artifactId}/{token}`

व्यूअर एसेट:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (केवल तब, जब डिफ़ किसी लैंग्वेज पैक की भाषा का उपयोग करता है)

व्यूअर दस्तावेज़ इन एसेट को व्यूअर URL के सापेक्ष रिज़ॉल्व करता है, इसलिए वैकल्पिक `baseUrl` पथ प्रीफ़िक्स एसेट अनुरोधों में भी लागू होता है।

URL रिज़ॉल्यूशन क्रम: टूल-कॉल `baseUrl` (कड़े सत्यापन के बाद) -> Plugin `viewerBaseUrl` -> लूपबैक `127.0.0.1` डिफ़ॉल्ट। यदि Gateway बाइंड मोड `custom` है और `gateway.customBindHost` सेट है, तो लूपबैक के बजाय उस होस्ट का उपयोग किया जाता है।

`baseUrl` के नियम: यह `http://` या `https://` होना चाहिए; क्वेरी और हैश अस्वीकार किए जाते हैं; ओरिजिन के साथ वैकल्पिक बेस पथ की अनुमति है।

## सुरक्षा मॉडल

<AccordionGroup>
  <Accordion title="व्यूअर सुदृढ़ीकरण">
    - डिफ़ॉल्ट रूप से केवल लूपबैक।
    - कड़े ID और टोकन पैटर्न सत्यापन वाले टोकनयुक्त व्यूअर पथ।
    - व्यूअर प्रतिक्रिया CSP: `default-src 'none'`; स्क्रिप्ट/एसेट केवल स्वयं से; कोई आउटबाउंड `connect-src` नहीं।
    - दूरस्थ पहुँच सक्षम होने पर दूरस्थ विफलता थ्रॉटलिंग: 60 सेकंड में 40 विफलताएँ, 60 सेकंड का लॉकआउट ट्रिगर करती हैं (`429 Too Many Requests`)।

  </Accordion>
  <Accordion title="फ़ाइल रेंडरिंग सुदृढ़ीकरण">
    - स्क्रीनशॉट ब्राउज़र अनुरोध रूटिंग डिफ़ॉल्ट रूप से निषेधात्मक है।
    - केवल `http://127.0.0.1/plugins/diffs/assets/*` से स्थानीय व्यूअर एसेट की अनुमति है।
    - बाहरी नेटवर्क अनुरोध अवरुद्ध हैं।

  </Accordion>
</AccordionGroup>

## फ़ाइल मोड के लिए ब्राउज़र आवश्यकताएँ

`mode: "file"` और `mode: "both"` के लिए Chromium-संगत ब्राउज़र आवश्यक है।

रिज़ॉल्यूशन क्रम:

<Steps>
  <Step title="कॉन्फ़िगरेशन">
    OpenClaw कॉन्फ़िगरेशन में `browser.executablePath`।
  </Step>
  <Step title="एनवायरनमेंट वेरिएबल">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="प्लेटफ़ॉर्म फ़ॉलबैक">
    Chrome, Chromium, Edge, और Brave के लिए सामान्य इंस्टॉल पथ तथा `PATH` लुकअप।
  </Step>
</Steps>

सामान्य विफलता टेक्स्ट: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`। इसे ठीक करने के लिए Chrome, Chromium, Edge, या Brave इंस्टॉल करें, अथवा ऊपर दिए गए निष्पादन-योग्य पथ विकल्पों में से कोई एक सेट करें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="इनपुट सत्यापन त्रुटियाँ">
    - `Provide patch or both before and after text.` -- `before` और `after` दोनों शामिल करें, या `patch` प्रदान करें।
    - `Provide either patch or before/after input, not both.` -- इनपुट मोड को मिश्रित न करें।
    - `Invalid baseUrl: ...` -- वैकल्पिक पथ वाला `http(s)` ओरिजिन उपयोग करें, बिना क्वेरी/हैश के।
    - `{field} exceeds maximum size (...)` -- पेलोड का आकार कम करें।
    - बड़े पैच का अस्वीकरण -- पैच फ़ाइलों की संख्या या कुल पंक्तियाँ कम करें।

  </Accordion>
  <Accordion title="व्यूअर अभिगम्यता">
    - डिफ़ॉल्ट रूप से व्यूअर URL `127.0.0.1` पर रिज़ॉल्व होता है।
    - दूरस्थ पहुँच के लिए या तो Plugin `viewerBaseUrl` सेट करें, प्रति कॉल `baseUrl` पास करें, या `gateway.customBindHost` के साथ `gateway.bind=custom` का उपयोग करें।
    - यदि `gateway.trustedProxies` में समान-होस्ट प्रॉक्सी (उदाहरण के लिए Tailscale Serve) के लिए लूपबैक शामिल है, तो फ़ॉरवर्ड किए गए क्लाइंट-IP हेडर के बिना सीधे लूपबैक व्यूअर अनुरोध डिज़ाइन के अनुसार सुरक्षित रूप से विफल होते हैं।
    - उस प्रॉक्सी टोपोलॉजी में, अटैचमेंट के लिए `mode: "file"`/`"both"` को प्राथमिकता दें, या साझा करने योग्य व्यूअर लिंक के लिए जानबूझकर `security.allowRemoteViewer` के साथ Plugin `viewerBaseUrl`/प्रॉक्सी `baseUrl` सक्षम करें।
    - केवल तभी `security.allowRemoteViewer` सक्षम करें, जब बाहरी व्यूअर पहुँच अभिप्रेत हो।

  </Accordion>
  <Accordion title="अपरिवर्तित-पंक्तियों की पंक्ति में विस्तृत करने का बटन नहीं है">
    विस्तार योग्य संदर्भ से रहित पैच इनपुट के लिए यह अपेक्षित है; यह व्यूअर की विफलता नहीं है।
  </Accordion>
  <Accordion title="आर्टिफ़ैक्ट नहीं मिला">
    - TTL के कारण आर्टिफ़ैक्ट की समय-सीमा समाप्त हो गई।
    - टोकन या पथ बदल गया।
    - क्लीनअप ने पुराना डेटा हटा दिया।

  </Accordion>
</AccordionGroup>

## संचालन संबंधी मार्गदर्शन

- कैनवास में स्थानीय इंटरैक्टिव समीक्षाओं के लिए `mode: "view"` को प्राथमिकता दें।
- अटैचमेंट की आवश्यकता वाले आउटबाउंड चैट चैनलों के लिए `mode: "file"` को प्राथमिकता दें।
- जब तक आपके परिनियोजन को दूरस्थ व्यूअर URL की आवश्यकता न हो, `allowRemoteViewer` को अक्षम रखें।
- संवेदनशील डिफ़ के लिए स्पष्ट रूप से छोटा `ttlSeconds` सेट करें।
- आवश्यक न होने पर डिफ़ इनपुट में सीक्रेट भेजने से बचें।
- यदि आपका चैनल छवियों को बहुत अधिक संपीड़ित करता है (उदाहरण के लिए Telegram या WhatsApp), तो PDF आउटपुट (`fileFormat: "pdf"`) को प्राथमिकता दें।

<Note>
डिफ़ रेंडरिंग इंजन [Diffs](https://diffs.com) द्वारा संचालित है।
</Note>

## संबंधित

- [ब्राउज़र](/hi/tools/browser)
- [Plugins](/hi/tools/plugin)
- [टूल का अवलोकन](/hi/tools)
