---
read_when:
    - आप चाहते हैं कि एजेंट कोड या Markdown में किए गए संपादनों को डिफ़ के रूप में दिखाएँ
    - आप canvas के लिए तैयार viewer URL या rendered diff फ़ाइल चाहते हैं
    - आपको सुरक्षित डिफ़ॉल्ट के साथ नियंत्रित, अस्थायी डिफ़ आर्टिफ़ैक्ट चाहिए
sidebarTitle: Diffs
summary: एजेंटों के लिए केवल-पढ़ने योग्य डिफ़ व्यूअर और फ़ाइल रेंडरर (वैकल्पिक Plugin टूल)
title: अंतर
x-i18n:
    generated_at: "2026-07-16T17:26:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` एक वैकल्पिक बंडल किया गया Plugin टूल है, जो पहले/बाद के टेक्स्ट या एक यूनिफ़ाइड पैच को केवल-पढ़ने योग्य डिफ़ आर्टिफ़ैक्ट में बदलता है। यह सिस्टम प्रॉम्प्ट के आरंभ में एजेंट के लिए संक्षिप्त मार्गदर्शन भी जोड़ता है और अधिक विस्तृत निर्देशों के लिए एक सहायक skill के साथ आता है।

इनपुट: `before` + `after` टेक्स्ट, या एक यूनिफ़ाइड `patch` (परस्पर अपवर्जी)।

आउटपुट: कैनवस प्रस्तुति के लिए Gateway व्यूअर URL, संदेश डिलीवरी के लिए रेंडर की गई PNG/PDF फ़ाइल का पथ, या दोनों।

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
  <Step title="एक मोड चुनें">
    <Tabs>
      <Tab title="view">
        कैनवस-प्रथम प्रवाह: एजेंट `mode: "view"` के साथ `diffs` को कॉल करते हैं और `canvas present` के साथ `details.viewerUrl` खोलते हैं।
      </Tab>
      <Tab title="file">
        चैट फ़ाइल डिलीवरी: एजेंट `mode: "file"` के साथ `diffs` को कॉल करते हैं और `path` या `filePath` का उपयोग करके `message` के साथ `details.filePath` भेजते हैं।
      </Tab>
      <Tab title="both">
        संयुक्त (डिफ़ॉल्ट): एजेंट एक ही कॉल में दोनों आर्टिफ़ैक्ट पाने के लिए `mode: "both"` के साथ `diffs` को कॉल करते हैं।
      </Tab>
    </Tabs>
  </Step>
</Steps>

## अंतर्निहित सिस्टम मार्गदर्शन अक्षम करें

टूल को बनाए रखते हुए आरंभ में जोड़ा गया सिस्टम-प्रॉम्प्ट मार्गदर्शन हटाने के लिए, `plugins.entries.diffs.hooks.allowPromptInjection` को `false` पर सेट करें:

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

इससे टूल और skill उपलब्ध रहते हुए Plugin का `before_prompt_build` हुक अवरुद्ध हो जाता है। मार्गदर्शन और टूल, दोनों को अक्षम करने के लिए इसके बजाय Plugin को अक्षम करें।

## टूल इनपुट संदर्भ

जहाँ उल्लेख न हो, सभी फ़ील्ड वैकल्पिक हैं।

<ParamField path="before" type="string">
  मूल टेक्स्ट। `patch` छोड़े जाने पर `after` के साथ आवश्यक।
</ParamField>
<ParamField path="after" type="string">
  अपडेट किया गया टेक्स्ट। `patch` छोड़े जाने पर `before` के साथ आवश्यक।
</ParamField>
<ParamField path="patch" type="string">
  यूनिफ़ाइड डिफ़ टेक्स्ट। `before` और `after` के साथ परस्पर अपवर्जी।
</ParamField>
<ParamField path="path" type="string">
  पहले/बाद मोड के लिए प्रदर्शित फ़ाइल नाम।
</ParamField>
<ParamField path="lang" type="string">
  पहले/बाद मोड के लिए भाषा ओवरराइड संकेत। अज्ञात मान और डिफ़ॉल्ट व्यूअर सेट से बाहर की भाषाएँ सादे टेक्स्ट पर फ़ॉलबैक करती हैं, जब तक कि Diff Viewer Language Pack Plugin इंस्टॉल न हो।
</ParamField>
<ParamField path="title" type="string">
  व्यूअर शीर्षक ओवरराइड।
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  आउटपुट मोड। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.mode` (`both`)। अप्रचलित उपनाम: `"image"`, `"file"` के समान व्यवहार करता है।
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  व्यूअर थीम। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.theme`।
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  डिफ़ लेआउट। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.layout`।
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  पूर्ण संदर्भ उपलब्ध होने पर अपरिवर्तित अनुभाग विस्तृत करें। केवल प्रति-कॉल विकल्प (Plugin की डिफ़ॉल्ट कुंजी नहीं)।
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  रेंडर की गई फ़ाइल का प्रारूप। डिफ़ॉल्ट रूप से Plugin का डिफ़ॉल्ट `defaults.fileFormat`।
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
  व्यूअर URL मूल का ओवरराइड। Plugin के `viewerBaseUrl` को ओवरराइड करता है। `http` या `https` होना आवश्यक है, कोई क्वेरी/हैश नहीं।
</ParamField>

<AccordionGroup>
  <Accordion title="सत्यापन और सीमाएँ">
    - `before`/`after`: प्रत्येक अधिकतम 512 KiB।
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
      - PDF की सीमा भी 50 पृष्ठ है।

  </Accordion>
</AccordionGroup>

## सिंटैक्स हाइलाइटिंग

अंतर्निहित भाषाएँ:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, और `toml`।

सामान्य उपनाम (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, आदि) उन भाषाओं में सामान्यीकृत हो जाते हैं।

अधिक भाषाओं (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff, और अन्य) के लिए Diff Viewer Language Pack Plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

पैक के बिना भी असमर्थित भाषाएँ पठनीय सादे टेक्स्ट के रूप में रेंडर होती हैं। अपस्ट्रीम कैटलॉग के लिए [Diffs Language Pack Plugin](/hi/plugins/reference/diffs-language-pack) और [Shiki भाषाएँ](https://shiki.style/languages) देखें।

## आउटपुट विवरण अनुबंध

सभी सफल परिणामों में `changed` शामिल होता है: समान पहले/बाद इनपुट आर्टिफ़ैक्ट बनाए बिना `false` लौटाता है; रेंडर किए गए परिणाम `true` लौटाते हैं।

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
    - `path` (`filePath` के समान मान, संदेश टूल संगतता के लिए)
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
| `"both"` | व्यूअर फ़ील्ड के साथ फ़ाइल फ़ील्ड। यदि फ़ाइल रेंडरिंग विफल होती है, तो भी व्यूअर `fileError` के साथ लौटता है। |

### संक्षिप्त किए गए अपरिवर्तित अनुभाग

व्यूअर `N unmodified lines` जैसी पंक्तियाँ दिखाता है। विस्तृत करने के नियंत्रण केवल तभी दिखाई देते हैं जब रेंडर किए गए डिफ़ में विस्तार योग्य संदर्भ डेटा हो (आमतौर पर पहले/बाद इनपुट के लिए)। कई यूनिफ़ाइड पैच अपने हंक में संदर्भ बॉडी छोड़ देते हैं, इसलिए पंक्ति विस्तृत करने के नियंत्रण के बिना दिखाई दे सकती है — यह अपेक्षित है, बग नहीं। `expandUnchanged` केवल तभी लागू होता है जब विस्तार योग्य संदर्भ मौजूद हो।

### बहु-फ़ाइल नेविगेशन

एक से अधिक फ़ाइलों को प्रभावित करने वाले पैच बदली गई फ़ाइलों के सारांश कार्ड से शुरू होते हैं: कुल `+N` / `-N` गणनाएँ, प्रति-फ़ाइल गणनाएँ, जोड़ी गई/हटाई गई/नाम बदली गई बैज, और प्रत्येक फ़ाइल पर जाने वाले एंकर लिंक। रेंडर की गई PNG/PDF फ़ाइलें प्रति-फ़ाइल हेडर गणनाएँ बनाए रखती हैं, लेकिन इंटरैक्टिव दृश्य टॉगल हटा देती हैं, क्योंकि स्थिर फ़ाइल में ये नियंत्रण निष्क्रिय होते हैं।

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

समर्थित `defaults` कुंजियाँ: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`। स्पष्ट टूल कॉल पैरामीटर इन्हें ओवरराइड करते हैं।

### स्थायी व्यूअर URL कॉन्फ़िगरेशन

<ParamField path="viewerBaseUrl" type="string">
  जब कोई टूल कॉल `baseUrl` पास नहीं करता, तब लौटाए गए व्यूअर लिंक के लिए Plugin-स्वामित्व वाला फ़ॉलबैक। `http` या `https` होना आवश्यक है, कोई क्वेरी/हैश नहीं।
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
  `false`: व्यूअर रूट के लिए नॉन-लूपबैक अनुरोध अस्वीकार किए जाते हैं। `true`: टोकनयुक्त पथ मान्य होने पर दूरस्थ व्यूअर की अनुमति होती है।
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

## आर्टिफ़ैक्ट जीवनचक्र और भंडारण

- आर्टिफ़ैक्ट `$TMPDIR/openclaw-diffs` के अंतर्गत रहते हैं।
- व्यूअर मेटाडेटा में एक यादृच्छिक 20-हेक्स-वर्ण आर्टिफ़ैक्ट ID, एक यादृच्छिक 48-हेक्स-वर्ण टोकन, `createdAt`/`expiresAt`, और संग्रहीत `viewer.html` पथ होता है।
- डिफ़ॉल्ट आर्टिफ़ैक्ट TTL: 30 मिनट। अधिकतम स्वीकृत TTL: 6 घंटे।
- प्रत्येक आर्टिफ़ैक्ट निर्माण कॉल के बाद अवसर मिलने पर सफ़ाई चलती है; समय-सीमा समाप्त आर्टिफ़ैक्ट हटा दिए जाते हैं।
- मेटाडेटा अनुपस्थित होने पर फ़ॉलबैक स्वीप 24 घंटे से पुराने अप्रचलित फ़ोल्डर हटा देता है।

## व्यूअर URL और नेटवर्क व्यवहार

व्यूअर रूट: `/plugins/diffs/view/{artifactId}/{token}`

व्यूअर एसेट:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (केवल जब diff किसी भाषा पैक की भाषा का उपयोग करता है)

व्यूअर दस्तावेज़ इन एसेट को व्यूअर URL के सापेक्ष हल करता है, इसलिए वैकल्पिक `baseUrl` पथ उपसर्ग एसेट अनुरोधों पर भी लागू होता है।

URL समाधान क्रम: टूल-कॉल `baseUrl` (कड़े सत्यापन के बाद) -> Plugin `viewerBaseUrl` -> लूपबैक `127.0.0.1` डिफ़ॉल्ट। यदि Gateway बाइंड मोड `custom` है और `gateway.customBindHost` सेट है, तो लूपबैक के बजाय उस होस्ट का उपयोग किया जाता है।

`baseUrl` नियम: यह `http://` या `https://` होना चाहिए; क्वेरी और हैश अस्वीकार किए जाते हैं; ऑरिजिन के साथ वैकल्पिक आधार पथ की अनुमति है।

## सुरक्षा मॉडल

<AccordionGroup>
  <Accordion title="व्यूअर की सुरक्षा सुदृढ़ीकरण">
    - डिफ़ॉल्ट रूप से केवल लूपबैक।
    - ID और टोकन पैटर्न के कड़े सत्यापन वाले टोकनयुक्त व्यूअर पथ।
    - व्यूअर प्रतिक्रिया CSP: `default-src 'none'`; स्क्रिप्ट/एसेट केवल स्वयं से; कोई आउटबाउंड `connect-src` नहीं।
    - रिमोट एक्सेस सक्षम होने पर रिमोट विफलता थ्रॉटलिंग: 60 सेकंड में 40 विफलताएँ 60 सेकंड का लॉकआउट सक्रिय करती हैं (`429 Too Many Requests`)।

  </Accordion>
  <Accordion title="फ़ाइल रेंडरिंग की सुरक्षा सुदृढ़ीकरण">
    - स्क्रीनशॉट ब्राउज़र अनुरोध रूटिंग डिफ़ॉल्ट रूप से अस्वीकृत है।
    - केवल `http://127.0.0.1/plugins/diffs/assets/*` से स्थानीय व्यूअर एसेट की अनुमति है।
    - बाहरी नेटवर्क अनुरोध अवरुद्ध हैं।

  </Accordion>
</AccordionGroup>

## फ़ाइल मोड के लिए ब्राउज़र आवश्यकताएँ

`mode: "file"` और `mode: "both"` को Chromium-संगत ब्राउज़र की आवश्यकता होती है।

समाधान क्रम:

<Steps>
  <Step title="कॉन्फ़िगरेशन">
    OpenClaw कॉन्फ़िगरेशन में `browser.executablePath`।
  </Step>
  <Step title="पर्यावरण चर">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="प्लेटफ़ॉर्म फ़ॉलबैक">
    Chrome, Chromium, Edge और Brave के लिए सामान्य इंस्टॉलेशन पथ और `PATH` लुकअप।
  </Step>
</Steps>

सामान्य विफलता संदेश: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`। इसे ठीक करने के लिए Chrome, Chromium, Edge या Brave इंस्टॉल करें अथवा ऊपर दिए गए निष्पादन योग्य पथ विकल्पों में से कोई एक सेट करें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="इनपुट सत्यापन त्रुटियाँ">
    - `Provide patch or both before and after text.` -- `before` और `after` दोनों शामिल करें, या `patch` प्रदान करें।
    - `Provide either patch or before/after input, not both.` -- इनपुट मोड को मिश्रित न करें।
    - `Invalid baseUrl: ...` -- वैकल्पिक पथ वाला `http(s)` ऑरिजिन उपयोग करें, क्वेरी/हैश के बिना।
    - `{field} exceeds maximum size (...)` -- पेलोड का आकार घटाएँ।
    - बड़ा पैच अस्वीकार किया गया -- पैच फ़ाइलों की संख्या या कुल पंक्तियाँ घटाएँ।

  </Accordion>
  <Accordion title="व्यूअर की पहुँच">
    - व्यूअर URL डिफ़ॉल्ट रूप से `127.0.0.1` पर हल होता है।
    - रिमोट एक्सेस के लिए, या तो Plugin `viewerBaseUrl` सेट करें, प्रत्येक कॉल में `baseUrl` पास करें, या `gateway.customBindHost` के साथ `gateway.bind=custom` उपयोग करें।
    - यदि `gateway.trustedProxies` में समान-होस्ट प्रॉक्सी (उदाहरण के लिए Tailscale Serve) के लिए लूपबैक शामिल है, तो फ़ॉरवर्ड किए गए क्लाइंट-IP हेडर के बिना सीधे लूपबैक व्यूअर अनुरोध डिज़ाइन के अनुसार बंद होकर विफल होते हैं।
    - उस प्रॉक्सी टोपोलॉजी के लिए, अनुलग्नक हेतु `mode: "file"`/`"both"` को प्राथमिकता दें, या साझा करने योग्य व्यूअर लिंक के लिए जानबूझकर `security.allowRemoteViewer` के साथ Plugin `viewerBaseUrl`/प्रॉक्सी `baseUrl` सक्षम करें।
    - केवल बाहरी व्यूअर एक्सेस अपेक्षित होने पर `security.allowRemoteViewer` सक्षम करें।

  </Accordion>
  <Accordion title="अपरिवर्तित-पंक्तियों की पंक्ति में विस्तार बटन नहीं है">
    ऐसे पैच इनपुट के लिए यह अपेक्षित है जिसमें विस्तार योग्य संदर्भ नहीं है; यह व्यूअर की विफलता नहीं है।
  </Accordion>
  <Accordion title="आर्टिफ़ैक्ट नहीं मिला">
    - TTL के कारण आर्टिफ़ैक्ट की समय-सीमा समाप्त हो गई।
    - टोकन या पथ बदल गया।
    - सफ़ाई ने पुराना डेटा हटा दिया।

  </Accordion>
</AccordionGroup>

## संचालन संबंधी मार्गदर्शन

- कैनवस में स्थानीय इंटरैक्टिव समीक्षाओं के लिए `mode: "view"` को प्राथमिकता दें।
- अनुलग्नक की आवश्यकता वाले आउटबाउंड चैट चैनलों के लिए `mode: "file"` को प्राथमिकता दें।
- जब तक आपके परिनियोजन को रिमोट व्यूअर URL की आवश्यकता न हो, `allowRemoteViewer` को अक्षम रखें।
- संवेदनशील diff के लिए स्पष्ट रूप से छोटा `ttlSeconds` सेट करें।
- आवश्यक न होने पर diff इनपुट में सीक्रेट भेजने से बचें।
- यदि आपका चैनल छवियों को अत्यधिक संपीड़ित करता है (उदाहरण के लिए Telegram या WhatsApp), तो PDF आउटपुट (`fileFormat: "pdf"`) को प्राथमिकता दें।

<Note>
diff रेंडरिंग इंजन [Diffs](https://diffs.com) द्वारा संचालित है।
</Note>

## संबंधित

- [ब्राउज़र](/hi/tools/browser)
- [Plugins](/hi/tools/plugin)
- [टूल का अवलोकन](/hi/tools)
