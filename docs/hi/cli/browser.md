---
read_when:
    - आप `openclaw browser` का उपयोग करते हैं और सामान्य कार्यों के लिए उदाहरण चाहते हैं
    - आप Node होस्ट के माध्यम से किसी दूसरी मशीन पर चल रहे ब्राउज़र को नियंत्रित करना चाहते हैं
    - आप Chrome MCP के माध्यम से अपने स्थानीय साइन-इन किए हुए Chrome से जुड़ना चाहते हैं
summary: CLI संदर्भ `openclaw browser` के लिए (लाइफसाइकल, प्रोफ़ाइल, टैब, कार्रवाइयाँ, स्थिति, और डीबगिंग)
title: ब्राउज़र
x-i18n:
    generated_at: "2026-06-28T22:47:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw की ब्राउज़र नियंत्रण सतह प्रबंधित करें और ब्राउज़र क्रियाएं चलाएं (लाइफ़साइकल, प्रोफ़ाइल, टैब, स्नैपशॉट, स्क्रीनशॉट, नेविगेशन, इनपुट, स्थिति एम्युलेशन, और डिबगिंग).

संबंधित:

- ब्राउज़र टूल + API: [ब्राउज़र टूल](/hi/tools/browser)

## सामान्य फ़्लैग

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (कॉन्फ़िग पर डिफ़ॉल्ट).
- `--token <token>`: Gateway टोकन (यदि आवश्यक हो).
- `--timeout <ms>`: अनुरोध टाइमआउट (ms).
- `--expect-final`: अंतिम Gateway प्रतिक्रिया की प्रतीक्षा करें.
- `--browser-profile <name>`: ब्राउज़र प्रोफ़ाइल चुनें (कॉन्फ़िग से डिफ़ॉल्ट).
- `--json`: मशीन-पठनीय आउटपुट (जहां समर्थित हो).

## त्वरित शुरुआत (लोकल)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

एजेंट वही तैयारी जांच `browser({ action: "doctor" })` से चला सकते हैं.

## त्वरित समस्या-निवारण

यदि `start` `not reachable after start` के साथ विफल होता है, तो पहले CDP तैयारी की समस्या सुलझाएं. यदि `start` और `tabs` सफल होते हैं लेकिन `open` या `navigate` विफल होता है, तो ब्राउज़र नियंत्रण प्लेन स्वस्थ है और विफलता आम तौर पर नेविगेशन SSRF नीति होती है.

न्यूनतम क्रम:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

विस्तृत मार्गदर्शन: [ब्राउज़र समस्या-निवारण](/hi/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## लाइफ़साइकल

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

नोट:

- `doctor --deep` एक लाइव स्नैपशॉट जांच जोड़ता है. यह तब उपयोगी है जब मूल CDP
  तैयारी हरी हो लेकिन आप प्रमाण चाहते हों कि वर्तमान टैब का निरीक्षण किया जा सकता है.
- `attachOnly` और रिमोट CDP प्रोफ़ाइलों के लिए, `openclaw browser stop`
  सक्रिय नियंत्रण सत्र बंद करता है और अस्थायी एम्युलेशन ओवरराइड साफ़ करता है, तब भी जब
  OpenClaw ने ब्राउज़र प्रक्रिया स्वयं लॉन्च नहीं की हो.
- लोकल प्रबंधित प्रोफ़ाइलों के लिए, `openclaw browser stop` स्पॉन की गई ब्राउज़र
  प्रक्रिया रोकता है.
- `openclaw browser start --headless` केवल उसी स्टार्ट अनुरोध पर लागू होता है और
  केवल तब जब OpenClaw एक लोकल प्रबंधित ब्राउज़र लॉन्च करता है. यह
  `browser.headless` या प्रोफ़ाइल कॉन्फ़िग को फिर से नहीं लिखता, और पहले से चल रहे
  ब्राउज़र के लिए यह कोई कार्रवाई नहीं करता.
- Linux होस्ट पर `DISPLAY` या `WAYLAND_DISPLAY` के बिना, लोकल प्रबंधित प्रोफ़ाइल
  अपने आप हेडलेस चलती हैं जब तक `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false`, या `browser.profiles.<name>.headless=false`
  स्पष्ट रूप से दृश्य ब्राउज़र का अनुरोध न करे.

## यदि कमांड अनुपलब्ध है

यदि `openclaw browser` अज्ञात कमांड है, तो
`~/.openclaw/openclaw.json` में `plugins.allow` जांचें.

जब `plugins.allow` मौजूद हो, तो बंडल किए गए ब्राउज़र Plugin को स्पष्ट रूप से सूचीबद्ध करें
जब तक कॉन्फ़िग में पहले से रूट `browser` ब्लॉक न हो:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

एक स्पष्ट रूट `browser` ब्लॉक, उदाहरण के लिए `browser.enabled=true` या
`browser.profiles.<name>`, प्रतिबंधात्मक Plugin allowlist के तहत भी बंडल किए गए
ब्राउज़र Plugin को सक्रिय करता है.

संबंधित: [ब्राउज़र टूल](/hi/tools/browser#missing-browser-command-or-tool)

## प्रोफ़ाइल

प्रोफ़ाइल नामित ब्राउज़र रूटिंग कॉन्फ़िग हैं. व्यवहार में:

- `openclaw`: समर्पित OpenClaw-प्रबंधित Chrome इंस्टेंस लॉन्च करता है या उससे जुड़ता है (अलग user data dir).
- `user`: Chrome DevTools MCP के माध्यम से आपके मौजूदा साइन-इन Chrome सत्र को नियंत्रित करता है.
- कस्टम CDP प्रोफ़ाइल: लोकल या रिमोट CDP एंडपॉइंट की ओर संकेत करती हैं.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

किसी विशिष्ट प्रोफ़ाइल का उपयोग करें:

```bash
openclaw browser --browser-profile work tabs
```

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

`tabs` पहले `suggestedTargetId` लौटाता है, फिर स्थिर `tabId` जैसे `t1`,
वैकल्पिक लेबल, और कच्चा `targetId`. एजेंट को
`suggestedTargetId` को `focus`, `close`, स्नैपशॉट, और क्रियाओं में वापस पास करना चाहिए. आप
`open --label`, `tab new --label`, या `tab label` से लेबल असाइन कर सकते हैं; लेबल,
टैब आईडी, कच्ची टारगेट आईडी, और अद्वितीय टारगेट-आईडी प्रीफ़िक्स सभी स्वीकार किए जाते हैं.
अनुकूलता के लिए अनुरोध फ़ील्ड का नाम अब भी `targetId` है, लेकिन यह
इन टैब संदर्भों को स्वीकार करता है. कच्ची टारगेट आईडी को निदान हैंडल मानें, स्थायी
एजेंट मेमोरी नहीं.
जब Chromium नेविगेशन या फ़ॉर्म सबमिट के दौरान अंतर्निहित कच्चे टारगेट को बदलता है,
OpenClaw स्थिर `tabId`/लेबल को बदले गए टैब से जोड़े रखता है
जब वह मिलान प्रमाणित कर सके. कच्ची टारगेट आईडी अस्थिर रहती हैं; `suggestedTargetId`
को प्राथमिकता दें.

## स्नैपशॉट / स्क्रीनशॉट / क्रियाएं

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

नोट:

- `--full-page` केवल पेज कैप्चर के लिए है; इसे `--ref`
  या `--element` के साथ संयोजित नहीं किया जा सकता.
- `existing-session` / `user` प्रोफ़ाइल पेज स्क्रीनशॉट और स्नैपशॉट आउटपुट से `--ref`
  स्क्रीनशॉट का समर्थन करती हैं, लेकिन CSS `--element` स्क्रीनशॉट का नहीं.
- `--labels` स्क्रीनशॉट पर वर्तमान स्नैपशॉट refs ओवरले करता है. 
  Playwright-समर्थित प्रोफ़ाइलों पर, यह `--full-page` (पूर्ण-पृष्ठ लेबल
  ओवरले), `--ref` (ARIA ref द्वारा एलिमेंट-क्लिप लेबल ओवरले), और `--element`
  (CSS चयनकर्ता द्वारा एलिमेंट-क्लिप लेबल ओवरले) के साथ काम करता है; एलिमेंट-क्लिप मोड में, लेबल
  एलिमेंट के सापेक्ष प्रोजेक्ट किए जाते हैं. प्रतिक्रिया में प्रत्येक ref के बाउंडिंग बॉक्स के साथ
  एक `annotations` ऐरे भी शामिल होता है. प्रत्येक आइटम में `ref`,
  `number`, `role`, वैकल्पिक `name`, और `box: {x, y, width, height}` होता है;
  निर्देशांक कैप्चर की गई छवि के स्पेस में होते हैं (viewport / fullpage /
  element-relative). खाली होने पर फ़ील्ड छोड़ दिया जाता है.
  `existing-session` प्रोफ़ाइल पेज स्क्रीनशॉट पर chrome-mcp ओवरले रेंडर करती हैं
  लेकिन Playwright प्रोजेक्शन हेल्पर का उपयोग नहीं करतीं और
  `annotations` शामिल नहीं करतीं; वहां CSS `--element` स्क्रीनशॉट समर्थित नहीं हैं. Playwright
  या chrome-mcp के बिना, लेबल वाले स्क्रीनशॉट उपलब्ध नहीं हैं. पिछले
  रिलीज़ ने लेबल वाले Playwright स्क्रीनशॉट पर `--full-page`, `--ref`, और `--element`
  को अनदेखा किया और हमेशा viewport कैप्चर लौटाया; लेबल वाले
  स्क्रीनशॉट अब उन स्कोप का पालन करते हैं.
- `snapshot --urls` खोजे गए लिंक गंतव्यों को AI स्नैपशॉट में जोड़ता है ताकि
  एजेंट केवल लिंक टेक्स्ट से अनुमान लगाने के बजाय सीधे नेविगेशन लक्ष्य चुन सकें.

नेविगेट/क्लिक/टाइप (ref-आधारित UI ऑटोमेशन):

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

`evaluate --fn` एक फ़ंक्शन स्रोत, एक expression, या एक statement body स्वीकार करता है.
Statement bodies को async functions के रूप में wrap किया जाता है, इसलिए जिस मान को
आप वापस चाहते हैं उसके लिए `return` का उपयोग करें. जब पेज-साइड फ़ंक्शन को
डिफ़ॉल्ट evaluate timeout से अधिक समय लग सकता है, तो `evaluate --timeout-ms <ms>` का उपयोग करें.

क्रिया प्रतिक्रियाएं क्रिया-ट्रिगर पेज
बदलाव के बाद वर्तमान कच्चा `targetId` लौटाती हैं जब OpenClaw बदले गए टैब को प्रमाणित कर सके.
लंबे समय तक चलने वाले वर्कफ़्लो के लिए स्क्रिप्ट को फिर भी
`suggestedTargetId`/लेबल संग्रहित और पास करने चाहिए.

फ़ाइल + डायलॉग हेल्पर:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

प्रबंधित Chrome प्रोफ़ाइल सामान्य क्लिक-ट्रिगर डाउनलोड को OpenClaw
डाउनलोड डायरेक्टरी में सहेजती हैं (डिफ़ॉल्ट रूप से `/tmp/openclaw/downloads`, या कॉन्फ़िगर किया गया temp
root). जब एजेंट को किसी विशिष्ट फ़ाइल की प्रतीक्षा करनी हो और उसका पथ लौटाना हो, तो `waitfordownload` या `download` का उपयोग करें; ये स्पष्ट प्रतीक्षक अगले डाउनलोड के स्वामी होते हैं.
अपलोड OpenClaw temp uploads root और OpenClaw-प्रबंधित
inbound media से फ़ाइलें स्वीकार करते हैं, जिनमें `media://inbound/<id>` और sandbox-relative
`media/inbound/<id>` संदर्भ शामिल हैं. नेस्टेड media refs, traversal, और मनमाने
लोकल पथ अस्वीकार ही रहते हैं.
जब कोई क्रिया modal dialog खोलती है, तो क्रिया प्रतिक्रिया
`browserState.dialogs.pending` के साथ `blockedByDialog` लौटाती है; उसे सीधे
उत्तर देने के लिए `--dialog-id` पास करें. OpenClaw के बाहर संभाले गए डायलॉग
`browserState.dialogs.recent` के अंतर्गत दिखाई देते हैं.

## स्थिति और स्टोरेज

Viewport + एम्युलेशन:

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

## डिबगिंग

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

बिल्ट-इन `user` प्रोफ़ाइल का उपयोग करें, या अपनी `existing-session` प्रोफ़ाइल बनाएं:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

डिफ़ॉल्ट existing-session पथ host-only Chrome MCP auto-connect है. यदि ब्राउज़र पहले से
DevTools एंडपॉइंट के साथ चल रहा है, तो `--cdp-url` पास करें ताकि Chrome MCP उस एंडपॉइंट से जुड़ जाए.
Docker, Browserless, या अन्य रिमोट सेटअप के लिए जहां Chrome MCP semantics की आवश्यकता नहीं है,
CDP प्रोफ़ाइल का उपयोग करें.

वर्तमान existing-session सीमाएं:

- स्नैपशॉट-चालित क्रियाएँ CSS चयनकर्ताओं के बजाय refs का उपयोग करती हैं
- `browser.actionTimeoutMs` समर्थित `act` अनुरोधों के लिए डिफ़ॉल्ट रूप से 60000 ms होता है जब
  कॉलर `timeoutMs` छोड़ देते हैं; प्रति-कॉल `timeoutMs` फिर भी प्राथमिकता लेता है।
- `click` केवल लेफ़्ट-क्लिक है
- `type` `slowly=true` का समर्थन नहीं करता
- `press` `delayMs` का समर्थन नहीं करता
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, और `evaluate`
  प्रति-कॉल टाइमआउट ओवरराइड अस्वीकार करते हैं
- `select` केवल एक मान का समर्थन करता है
- मौजूदा-सत्र प्रोफ़ाइलों पर `wait --load networkidle` समर्थित नहीं है (प्रबंधित और raw/remote CDP पर काम करता है)
- फ़ाइल अपलोड के लिए `--ref` / `--input-ref` आवश्यक है, CSS
  `--element` का समर्थन नहीं करते, और अभी एक बार में एक फ़ाइल का समर्थन करते हैं
- डायलॉग हुक `--timeout` का समर्थन नहीं करते
- स्क्रीनशॉट पेज कैप्चर और `--ref` का समर्थन करते हैं, लेकिन CSS `--element` का नहीं
- `responsebody`, डाउनलोड इंटरसेप्शन, PDF निर्यात, और बैच क्रियाओं के लिए अब भी
  प्रबंधित ब्राउज़र या raw CDP प्रोफ़ाइल आवश्यक है

## रिमोट ब्राउज़र नियंत्रण (node होस्ट प्रॉक्सी)

यदि Gateway ब्राउज़र से अलग मशीन पर चलता है, तो उस मशीन पर एक **node होस्ट** चलाएँ जिसमें Chrome/Brave/Edge/Chromium है। Gateway ब्राउज़र क्रियाओं को उस node पर प्रॉक्सी करेगा (अलग ब्राउज़र नियंत्रण सर्वर की आवश्यकता नहीं है)।

ऑटो-रूटिंग नियंत्रित करने के लिए `gateway.nodes.browser.mode` का उपयोग करें और यदि कई node जुड़े हैं तो किसी विशिष्ट node को पिन करने के लिए `gateway.nodes.browser.node` का उपयोग करें।

सुरक्षा + रिमोट सेटअप: [ब्राउज़र टूल](/hi/tools/browser), [रिमोट एक्सेस](/hi/gateway/remote), [Tailscale](/hi/gateway/tailscale), [सुरक्षा](/hi/gateway/security)

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ब्राउज़र](/hi/tools/browser)
