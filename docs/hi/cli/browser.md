---
read_when:
    - आप `openclaw browser` का उपयोग करते हैं और सामान्य कार्यों के लिए उदाहरण चाहते हैं
    - आप किसी अन्य मशीन पर Node होस्ट के माध्यम से चल रहे ब्राउज़र को नियंत्रित करना चाहते हैं
    - आप Chrome MCP के माध्यम से अपने स्थानीय, साइन-इन किए हुए Chrome से कनेक्ट करना चाहते हैं
summary: '`openclaw browser` के लिए CLI संदर्भ (जीवनचक्र, प्रोफ़ाइल, टैब, क्रियाएँ, स्थिति और डीबगिंग)'
title: ब्राउज़र
x-i18n:
    generated_at: "2026-07-20T07:00:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb233c5060c19120ab24b13e166cbd40035c81e6dd6ef0e70a4877a852f3b9a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw की ब्राउज़र नियंत्रण सतह प्रबंधित करें और ब्राउज़र क्रियाएँ चलाएँ: जीवनचक्र, प्रोफ़ाइल, टैब, स्नैपशॉट, स्क्रीनशॉट, नेविगेशन, इनपुट, स्थिति अनुकरण और डीबगिंग।

संबंधित: [ब्राउज़र टूल](/hi/tools/browser)

## सामान्य फ़्लैग

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (डिफ़ॉल्ट रूप से कॉन्फ़िग से)।
- `--token <token>`: Gateway टोकन (यदि आवश्यक हो)।
- `--timeout <ms>`: अनुरोध टाइमआउट ms में (डिफ़ॉल्ट: `30000`)।
- `--expect-final`: अंतिम Gateway प्रतिक्रिया की प्रतीक्षा करें।
- `--browser-profile <name>`: ब्राउज़र प्रोफ़ाइल चुनें (डिफ़ॉल्ट: `openclaw`, या `browser.defaultProfile`)।
- `--json`: मशीन-पठनीय आउटपुट (जहाँ समर्थित हो)। यह ब्राउज़र-स्तरीय विकल्प है, इसलिए
  स्पष्ट रूप के लिए इसे उपकमांड से पहले रखें, जैसे
  `openclaw browser --json status`। अंत में रखना, जैसे
  `openclaw browser status --json`, तब भी काम करता है जब चयनित चाइल्ड कमांड अपना
  `--json` परिभाषित नहीं करता।

## त्वरित शुरुआत (स्थानीय)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

एजेंट `browser({ action: "doctor" })` के साथ यही तत्परता जाँच चला सकते हैं।

## त्वरित समस्या निवारण

यदि `start`, `not reachable after start` के साथ विफल होता है, तो पहले CDP तत्परता की समस्या का निवारण करें। यदि `start` और `tabs` सफल होते हैं, लेकिन `open` या `navigate` विफल होता है, तो ब्राउज़र नियंत्रण प्लेन स्वस्थ है और विफलता आमतौर पर नेविगेशन SSRF नीति अवरोध होती है।

न्यूनतम क्रम:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

विस्तृत मार्गदर्शन: [ब्राउज़र समस्या निवारण](/hi/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## जीवनचक्र

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` एक लाइव स्नैपशॉट जाँच जोड़ता है: यह तब उपयोगी है जब बुनियादी CDP तत्परता ठीक हो, लेकिन आप प्रमाण चाहते हों कि वर्तमान टैब का निरीक्षण किया जा सकता है।
- चल रही स्थानीय प्रबंधित प्रोफ़ाइल के लिए, `status` और `doctor`, Chrome से कैश किए गए
  ग्राफ़िक्स निदान की रिपोर्ट देते हैं: हार्डवेयर/सॉफ़्टवेयर वर्गीकरण, रेंडरर,
  बैकएंड, डिवाइस/ड्राइवर, फ़ीचर और अक्षम-स्थिति विवरण तथा त्वरित
  वीडियो क्षमताएँ। `openclaw browser --json status` पूरा संरचित पेलोड लौटाता है।
  निष्क्रिय स्थिति केवल इन तथ्यों को एकत्र करने के लिए Chrome को कभी शुरू नहीं करती।
- `stop` सक्रिय नियंत्रण सत्र बंद करता है और अस्थायी अनुकरण ओवरराइड साफ़ करता है, यहाँ तक कि `attachOnly` और दूरस्थ CDP प्रोफ़ाइल के लिए भी, जहाँ OpenClaw ने ब्राउज़र प्रक्रिया स्वयं शुरू नहीं की थी। स्थानीय प्रबंधित प्रोफ़ाइल के लिए, `stop` उत्पन्न की गई ब्राउज़र प्रक्रिया को भी रोकता है।
- `start --headless` केवल उस स्टार्ट अनुरोध पर और केवल तब लागू होता है जब OpenClaw कोई स्थानीय प्रबंधित ब्राउज़र शुरू करता है। यह `browser.headless` या प्रोफ़ाइल कॉन्फ़िग को दोबारा नहीं लिखता और पहले से चल रहे ब्राउज़र पर इसका कोई प्रभाव नहीं पड़ता।
- `DISPLAY` या `WAYLAND_DISPLAY` के बिना Linux होस्ट पर, स्थानीय प्रबंधित प्रोफ़ाइल स्वचालित रूप से हेडलेस चलती हैं, जब तक कि `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false`, या `browser.profiles.<name>.headless=false` स्पष्ट रूप से दृश्यमान ब्राउज़र का अनुरोध न करे।

## यदि कमांड उपलब्ध नहीं है

यदि `openclaw browser` एक अज्ञात कमांड है, तो `~/.openclaw/openclaw.json` में `plugins.allow` जाँचें। जब `plugins.allow` मौजूद हो, तो बंडल किए गए ब्राउज़र Plugin को स्पष्ट रूप से सूचीबद्ध करें, जब तक कि कॉन्फ़िग में पहले से रूट `browser` ब्लॉक न हो:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

एक स्पष्ट रूट `browser` ब्लॉक (उदाहरण के लिए `browser.enabled=true` या `browser.profiles.<name>`) भी प्रतिबंधात्मक Plugin अनुमति-सूची के अंतर्गत बंडल किए गए ब्राउज़र Plugin को सक्रिय करता है।

संबंधित: [ब्राउज़र टूल](/hi/tools/browser#missing-browser-command-or-tool)

## प्रोफ़ाइल

प्रोफ़ाइल नामित ब्राउज़र रूटिंग कॉन्फ़िग हैं:

- `openclaw` (डिफ़ॉल्ट): समर्पित OpenClaw-प्रबंधित Chrome इंस्टेंस शुरू करता है या उससे जुड़ता है (अलग उपयोगकर्ता डेटा निर्देशिका)।
- `user`: Chrome DevTools MCP के माध्यम से आपके मौजूदा साइन-इन किए हुए Chrome सत्र को नियंत्रित करता है।
- कस्टम CDP प्रोफ़ाइल: स्थानीय या दूरस्थ CDP एंडपॉइंट की ओर इंगित करती हैं।

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

किसी भी उपकमांड पर `--browser-profile <name>` के साथ विशिष्ट प्रोफ़ाइल का उपयोग करें, उदाहरण के लिए `openclaw browser --browser-profile work tabs`।

macOS पर, `system-profiles` होस्ट पर उपलब्ध वास्तविक Chrome, Brave, Edge या Chromium प्रोफ़ाइल सूचीबद्ध करता है। `import-profile` एक macOS Keychain/Touch ID सहमति प्रॉम्प्ट के बाद उनकी कुकी डिक्रिप्ट करता है और उन्हें नई OpenClaw-प्रबंधित प्रोफ़ाइल में इंजेक्ट करता है। यह केवल कुकी आयात करता है; लोकल स्टोरेज और IndexedDB अपरिवर्तित रहते हैं। कुछ Google सत्र डिवाइस-बाउंड सत्र क्रेडेंशियल (DBSC) का उपयोग करते हैं और आयात के बाद भी पुनः प्रमाणीकरण की आवश्यकता हो सकती है।

जब macOS ऐप स्थानीय Gateway का उपयोग करता है, तो वह इस आयात की पेशकश एक बार कर सकता है और अलग की गई आयातित प्रोफ़ाइल को एजेंट ब्राउज़िंग के लिए डिफ़ॉल्ट बना सकता है। आयात के लिए हमेशा स्पष्ट क्लिक आवश्यक है; सफल आयात या इसे बंद करना बाद के स्वचालित प्रॉम्प्ट रोक देता है, और **Settings → General → Browser login** पुनः आयात के लिए उपलब्ध रहता है।

सिस्टम-प्रोफ़ाइल आयात डिफ़ॉल्ट रूप से सक्षम है। CLI और एजेंट द्वारा ट्रिगर किए गए दोनों आयात अक्षम करने के लिए `browser.allowSystemProfileImport=false` सेट करें। आयात होस्ट-स्थानीय है और ब्राउज़र Node प्रॉक्सी के माध्यम से नहीं चल सकता।

## टैब

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` पहले `suggestedTargetId`, फिर स्थिर `tabId` (जैसे `t1`), वैकल्पिक लेबल और मूल `targetId` लौटाता है। `suggestedTargetId` को वापस `focus`, `close`, स्नैपशॉट और क्रियाओं में पास करें। `open --label`, `tab new --label`, या `tab label` से लेबल निर्दिष्ट करें; लेबल, टैब आईडी, मूल लक्ष्य आईडी और अद्वितीय लक्ष्य-आईडी उपसर्ग सभी स्वीकार किए जाते हैं। संगतता के लिए अनुरोध फ़ील्ड का नाम अब भी `targetId` है, लेकिन यह इनमें से किसी भी टैब संदर्भ को स्वीकार करता है।

मूल लक्ष्य आईडी अस्थिर निदान हैंडल हैं, स्थायी एजेंट मेमोरी नहीं: जब Chromium नेविगेशन या फ़ॉर्म सबमिट के दौरान अंतर्निहित मूल लक्ष्य को बदलता है, तो मिलान प्रमाणित कर पाने पर OpenClaw स्थिर `tabId`/लेबल को प्रतिस्थापन टैब से जुड़ा रखता है। `suggestedTargetId` को प्राथमिकता दें।

## स्नैपशॉट / स्क्रीनशॉट / क्रियाएँ

स्नैपशॉट:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

स्क्रीनशॉट:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` केवल पेज कैप्चर के लिए है; इसे `--ref` या `--element` के साथ संयोजित नहीं किया जा सकता।
- `existing-session` / `user` प्रोफ़ाइल पेज स्क्रीनशॉट और स्नैपशॉट आउटपुट से `--ref` स्क्रीनशॉट का समर्थन करती हैं, लेकिन CSS `--element` स्क्रीनशॉट का नहीं।
- `--labels` स्क्रीनशॉट पर वर्तमान स्नैपशॉट संदर्भ ओवरले करता है। Playwright-समर्थित प्रोफ़ाइल पर यह `--full-page` (पूर्ण-पेज ओवरले), `--ref` (ARIA संदर्भ द्वारा एलिमेंट-क्लिप ओवरले), और `--element` (CSS चयनकर्ता द्वारा एलिमेंट-क्लिप ओवरले) के साथ काम करता है; एलिमेंट-क्लिप मोड में लेबल एलिमेंट के सापेक्ष प्रक्षेपित किए जाते हैं। प्रतिक्रिया में `annotations` सरणी भी शामिल होती है (खाली होने पर छोड़ दी जाती है), जिसमें प्रत्येक संदर्भ का बाउंडिंग बॉक्स होता है: कैप्चर की गई छवि के निर्देशांक स्थान (व्यूपोर्ट / पूर्णपेज / एलिमेंट-सापेक्ष) में `ref`, `number`, `role`, वैकल्पिक `name`, और `box: {x, y, width, height}`।
  `existing-session` प्रोफ़ाइल पेज स्क्रीनशॉट पर chrome-mcp ओवरले रेंडर करती हैं, लेकिन Playwright प्रोजेक्शन सहायक का उपयोग नहीं करतीं और `annotations` शामिल नहीं करतीं; वहाँ CSS `--element` स्क्रीनशॉट समर्थित नहीं हैं। Playwright या chrome-mcp के बिना, लेबलयुक्त स्क्रीनशॉट उपलब्ध नहीं हैं।
- `snapshot --urls` AI स्नैपशॉट में खोजे गए लिंक गंतव्य जोड़ता है, ताकि एजेंट केवल लिंक टेक्स्ट से अनुमान लगाने के बजाय सीधे नेविगेशन लक्ष्य चुन सकें।

नेविगेट/क्लिक/टाइप (संदर्भ-आधारित UI स्वचालन):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` फ़ंक्शन स्रोत, एक्सप्रेशन या स्टेटमेंट बॉडी स्वीकार करता है। स्टेटमेंट बॉडी को async फ़ंक्शन के रूप में रैप किया जाता है, इसलिए जिस मान को वापस पाना चाहते हैं उसके लिए `return` का उपयोग करें। जब पेज-साइड फ़ंक्शन को डिफ़ॉल्ट मूल्यांकन टाइमआउट से अधिक समय लग सकता है, तब `--timeout-ms` का उपयोग करें। `browser.evaluateEnabled=false` (डिफ़ॉल्ट: `true`) `evaluate` और `wait --fn` दोनों को अक्षम करता है।

जब OpenClaw प्रतिस्थापन टैब को प्रमाणित कर सकता है, तब क्रिया प्रतिक्रियाएँ क्रिया द्वारा ट्रिगर किए गए पेज प्रतिस्थापन के बाद वर्तमान मूल `targetId` लौटाती हैं। लंबे समय तक चलने वाले कार्यप्रवाहों के लिए स्क्रिप्ट को फिर भी `suggestedTargetId`/लेबल संग्रहीत और पास करने चाहिए।

फ़ाइल + डायलॉग सहायक:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

प्रबंधित Chrome प्रोफ़ाइल सामान्य क्लिक-ट्रिगर किए गए डाउनलोड को OpenClaw डाउनलोड निर्देशिका (`/tmp/openclaw/downloads` डिफ़ॉल्ट रूप से, या कॉन्फ़िगर किया गया अस्थायी रूट) में सहेजती हैं। जब एजेंट को किसी विशिष्ट फ़ाइल की प्रतीक्षा करके उसका पथ लौटाना हो, तब `waitfordownload` या `download` का उपयोग करें; वे स्पष्ट प्रतीक्षक अगले डाउनलोड का स्वामित्व लेते हैं। अपलोड OpenClaw के अस्थायी अपलोड रूट और OpenClaw-प्रबंधित इनबाउंड मीडिया की फ़ाइलें स्वीकार करते हैं, जिनमें `media://inbound/<id>` और सैंडबॉक्स-सापेक्ष `media/inbound/<id>` संदर्भ शामिल हैं। नेस्टेड मीडिया संदर्भ, ट्रैवर्सल और मनमाने स्थानीय पथ अस्वीकार किए जाते हैं।

जब कोई क्रिया मोडल डायलॉग खोलती है, तो क्रिया प्रतिक्रिया `browserState.dialogs.pending` के साथ `blockedByDialog` लौटाती है; उसका सीधे उत्तर देने के लिए `--dialog-id` पास करें। OpenClaw के बाहर संभाले गए डायलॉग `browserState.dialogs.recent` के अंतर्गत दिखाई देते हैं।

## स्थिति और स्टोरेज

व्यूपोर्ट + अनुकरण:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

कुकीज़ + स्टोरेज:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## डीबगिंग

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## MCP के माध्यम से मौजूदा Chrome

अंतर्निहित `user` प्रोफ़ाइल का उपयोग करें, या अपनी स्वयं की `existing-session` प्रोफ़ाइल बनाएँ:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

डिफ़ॉल्ट मौजूदा-सत्र पथ केवल होस्ट पर Chrome MCP स्वतः-कनेक्ट है। यदि ब्राउज़र पहले से DevTools एंडपॉइंट के साथ चल रहा है, तो `--cdp-url` पास करें, ताकि Chrome MCP इसके बजाय उस एंडपॉइंट से जुड़ जाए। Docker, Browserless या अन्य रिमोट सेटअप के लिए, जहाँ Chrome MCP व्यवहार की आवश्यकता नहीं है, इसके बजाय CDP प्रोफ़ाइल का उपयोग करें।

मौजूदा-सत्र की वर्तमान सीमाएँ:

- स्नैपशॉट-संचालित क्रियाएँ CSS चयनकर्ताओं के बजाय रेफ़ का उपयोग करती हैं।
- समर्थित `act` अनुरोधों में, कॉलर द्वारा `timeoutMs` न देने पर अंतर्निहित 60000 ms डिफ़ॉल्ट का उपयोग होता है; प्रति-कॉल `timeoutMs` को फिर भी प्राथमिकता मिलती है।
- `click` केवल बाएँ-क्लिक का समर्थन करता है।
- `type`, `slowly=true` का समर्थन नहीं करता।
- `press`, `delayMs` का समर्थन नहीं करता।
- `hover`, `scrollintoview`, `drag`, `select`, और `fill` प्रति-कॉल टाइमआउट ओवरराइड अस्वीकार करते हैं; `evaluate`, `--timeout-ms` स्वीकार करता है।
- `select` केवल एक मान का समर्थन करता है।
- `wait --load networkidle` समर्थित नहीं है (प्रबंधित और रॉ/रिमोट CDP प्रोफ़ाइल पर काम करता है)।
- फ़ाइल अपलोड के लिए `--ref` / `--input-ref` आवश्यक हैं, वे CSS `--element` का समर्थन नहीं करते और एक समय में एक फ़ाइल का समर्थन करते हैं।
- डायलॉग हुक `--timeout` का समर्थन नहीं करते।
- स्क्रीनशॉट पेज कैप्चर और `--ref` का समर्थन करते हैं, लेकिन CSS `--element` का नहीं।
- `responsebody`, डाउनलोड इंटरसेप्शन, PDF निर्यात और बैच क्रियाओं के लिए अब भी प्रबंधित ब्राउज़र या रॉ CDP प्रोफ़ाइल आवश्यक है।

## रिमोट ब्राउज़र नियंत्रण (Node होस्ट प्रॉक्सी)

यदि Gateway ब्राउज़र से अलग मशीन पर चलता है, तो Chrome/Brave/Edge/Chromium वाली मशीन पर एक **Node होस्ट** चलाएँ। Gateway ब्राउज़र क्रियाओं को उस Node पर प्रॉक्सी करता है; अलग ब्राउज़र नियंत्रण सर्वर की आवश्यकता नहीं है।

स्वतः-रूटिंग नियंत्रित करने के लिए `gateway.nodes.browser.mode` और एकाधिक Node कनेक्ट होने पर किसी विशिष्ट Node को पिन करने के लिए `gateway.nodes.browser.node` का उपयोग करें।

सुरक्षा + रिमोट सेटअप: [ब्राउज़र टूल](/hi/tools/browser), [रिमोट एक्सेस](/hi/gateway/remote), [Tailscale](/hi/gateway/tailscale), [सुरक्षा](/hi/gateway/security)

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ब्राउज़र](/hi/tools/browser)
