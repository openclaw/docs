---
read_when:
    - स्थानीय नियंत्रण API के माध्यम से एजेंट ब्राउज़र की स्क्रिप्टिंग या डीबगिंग करना
    - '`openclaw browser` CLI संदर्भ खोज रहे हैं'
    - स्नैपशॉट और रेफ़ के साथ कस्टम ब्राउज़र ऑटोमेशन जोड़ना
summary: OpenClaw ब्राउज़र नियंत्रण API, CLI संदर्भ और स्क्रिप्टिंग क्रियाएँ
title: ब्राउज़र नियंत्रण API
x-i18n:
    generated_at: "2026-07-16T17:23:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

सेटअप, कॉन्फ़िगरेशन और समस्या निवारण के लिए, [ब्राउज़र](/hi/tools/browser) देखें।
यह पृष्ठ स्थानीय नियंत्रण HTTP API, `openclaw browser`
CLI और स्क्रिप्टिंग पैटर्न (स्नैपशॉट, रेफ़रेंस, प्रतीक्षा, डीबग प्रवाह) का संदर्भ है।

## नियंत्रण API (वैकल्पिक)

केवल स्थानीय एकीकरणों के लिए, Gateway एक छोटा लूपबैक HTTP API उपलब्ध कराता है।
यह स्वतंत्र सर्वर वैकल्पिक है — gateway सेवा परिवेश में पर्यावरण चर
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` सेट करें
और HTTP एंडपॉइंट उपलब्ध होने से पहले gateway पुनः आरंभ करें। इस
चर के बिना ब्राउज़र नियंत्रण रनटाइम CLI और
एजेंट टूल के माध्यम से काम करता रहता है, लेकिन लूपबैक नियंत्रण पोर्ट पर कोई सेवा नहीं सुनती।

- स्थिति/आरंभ/बंद करें: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- प्रोफ़ाइल: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- टैब: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- स्नैपशॉट/स्क्रीनशॉट: `GET /snapshot`, `POST /screenshot`
- क्रियाएँ: `POST /navigate`, `POST /act`
- हुक: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- डाउनलोड: `POST /download`, `POST /wait/download`
- अनुमतियाँ: `POST /permissions/grant`
- डीबगिंग: `GET /console`, `POST /pdf`
- डीबगिंग: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- नेटवर्क: `POST /response/body`
- स्थिति: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- स्थिति: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- सेटिंग्स: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` वह बैच रूप है जिसे CLI आंतरिक रूप से
`browser tab` उपकमांड (`{"action":"new"|"label"|"select"|"close"|"list", ...}`) के लिए उपयोग करता है;
सीधे स्क्रिप्टिंग करते समय ऊपर दिए गए एकल-उद्देश्यीय टैब रूट को प्राथमिकता दें।

सभी एंडपॉइंट `?profile=<name>` स्वीकार करते हैं। `POST /start?headless=true`
स्थायी ब्राउज़र कॉन्फ़िगरेशन बदले बिना स्थानीय प्रबंधित प्रोफ़ाइल के लिए
एकबारगी हेडलेस लॉन्च का अनुरोध करता है; केवल-अटैच, रिमोट CDP और मौजूदा-सत्र प्रोफ़ाइल
उस ओवरराइड को अस्वीकार करती हैं, क्योंकि OpenClaw उन ब्राउज़र प्रक्रियाओं को लॉन्च नहीं करता।

टैब एंडपॉइंट के लिए, `targetId` संगतता फ़ील्ड का नाम है। `GET /tabs` या `POST /tabs/open` से
`suggestedTargetId` पास करना बेहतर है; लेबल और `tabId`
हैंडल, जैसे `t1`, भी स्वीकार किए जाते हैं। अपरिष्कृत CDP लक्ष्य आईडी और अद्वितीय अपरिष्कृत
लक्ष्य-आईडी उपसर्ग अब भी काम करते हैं, लेकिन वे अस्थिर निदान हैंडल हैं।

यदि साझा-सीक्रेट gateway प्रमाणीकरण कॉन्फ़िगर किया गया है, तो ब्राउज़र HTTP रूट को भी प्रमाणीकरण चाहिए:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` या उस पासवर्ड के साथ HTTP बेसिक प्रमाणीकरण

टिप्पणियाँ:

- यह स्वतंत्र लूपबैक ब्राउज़र API विश्वसनीय-प्रॉक्सी या
  Tailscale Serve पहचान हेडर का उपयोग **नहीं** करता।
- यदि `gateway.auth.mode`, `none` या `trusted-proxy` है, तो ये लूपबैक ब्राउज़र
  रूट उन पहचान-युक्त मोड को इनहेरिट नहीं करते; इन्हें केवल लूपबैक तक सीमित रखें।

### `/act` त्रुटि अनुबंध

`POST /act` रूट-स्तरीय सत्यापन और
नीति विफलताओं के लिए संरचित त्रुटि प्रतिक्रिया का उपयोग करता है:

```json
{ "error": "<message>", "code": "ACT_*" }
```

वर्तमान `code` मान:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` अनुपस्थित है या पहचाना नहीं गया।
- `ACT_INVALID_REQUEST` (HTTP 400): क्रिया पेलोड सामान्यीकरण या सत्यापन में विफल रहा।
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` का उपयोग किसी असमर्थित क्रिया प्रकार के साथ किया गया।
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (या `wait --fn`) कॉन्फ़िगरेशन द्वारा अक्षम है।
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): शीर्ष-स्तरीय या बैच किया गया `targetId` अनुरोध लक्ष्य से विरोध करता है।
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): यह क्रिया मौजूदा-सत्र प्रोफ़ाइल के लिए समर्थित नहीं है।

अन्य रनटाइम विफलताएँ अब भी `code` फ़ील्ड के बिना
`{ "error": "<message>" }` लौटा सकती हैं।

### Playwright की आवश्यकता

कुछ सुविधाओं (नेविगेट/क्रिया/AI स्नैपशॉट/भूमिका स्नैपशॉट, एलिमेंट स्क्रीनशॉट,
PDF) के लिए Playwright आवश्यक है। यदि Playwright इंस्टॉल नहीं है, तो वे एंडपॉइंट
स्पष्ट 501 त्रुटि लौटाते हैं।

Playwright के बिना भी क्या काम करता है:

- ARIA स्नैपशॉट
- भूमिका-शैली अभिगम्यता स्नैपशॉट (`--interactive`, `--compact`,
  `--depth`, `--efficient`), जब प्रति-टैब CDP WebSocket उपलब्ध हो। यह
  निरीक्षण और रेफ़रेंस खोज के लिए फ़ॉलबैक है; Playwright मुख्य
  क्रिया इंजन बना रहता है।
- प्रबंधित `openclaw` ब्राउज़र के पृष्ठ स्क्रीनशॉट, जब प्रति-टैब CDP
  WebSocket उपलब्ध हो
- `existing-session` / Chrome MCP प्रोफ़ाइल के पृष्ठ स्क्रीनशॉट
- स्नैपशॉट आउटपुट से `existing-session` रेफ़रेंस-आधारित स्क्रीनशॉट (`--ref`)

किन चीज़ों के लिए अब भी Playwright आवश्यक है:

- `navigate`
- `act`
- AI स्नैपशॉट, जो Playwright के मूल AI स्नैपशॉट प्रारूप पर निर्भर करते हैं
- CSS-सिलेक्टर एलिमेंट स्क्रीनशॉट (`--element`)
- पूर्ण ब्राउज़र PDF निर्यात

एलिमेंट स्क्रीनशॉट `--full-page` को भी अस्वीकार करते हैं; रूट `fullPage is
not supported for element screenshots` लौटाता है।

यदि आपको `Playwright is not available in this gateway build` दिखाई दे, तो पैकेज किए गए
Gateway में मुख्य ब्राउज़र रनटाइम निर्भरता अनुपस्थित है। OpenClaw को पुनः इंस्टॉल या अपडेट करें,
फिर gateway पुनः आरंभ करें। Docker के लिए, नीचे दिखाए अनुसार Chromium
ब्राउज़र बाइनरी भी इंस्टॉल करें।

#### Docker में Playwright इंस्टॉल करना

यदि आपका Gateway Docker में चलता है, तो `npx playwright` से बचें (npm ओवरराइड विरोध)।
कस्टम इमेज के लिए, Chromium को इमेज में शामिल करें:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

मौजूदा इमेज के लिए, इसके बजाय बंडल किए गए CLI के माध्यम से इंस्टॉल करें:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ब्राउज़र डाउनलोड को स्थायी रखने के लिए, `PLAYWRIGHT_BROWSERS_PATH` सेट करें (उदाहरण के लिए,
`/home/node/.cache/ms-playwright`) और सुनिश्चित करें कि `/home/node`, `OPENCLAW_HOME_VOLUME`
या बाइंड माउंट के माध्यम से स्थायी रखा गया है। OpenClaw Linux पर स्थायी
Chromium का स्वतः पता लगाता है। [Docker](/hi/install/docker) देखें।

## यह कैसे काम करता है (आंतरिक)

एक छोटा लूपबैक नियंत्रण सर्वर HTTP अनुरोध स्वीकार करता है और CDP के माध्यम से Chromium-आधारित ब्राउज़र से जुड़ता है। उन्नत क्रियाएँ (क्लिक/टाइप/स्नैपशॉट/PDF) CDP के ऊपर Playwright के माध्यम से होती हैं; Playwright अनुपस्थित होने पर केवल गैर-Playwright संचालन उपलब्ध होते हैं। स्थानीय/रिमोट ब्राउज़र और प्रोफ़ाइल नीचे स्वतंत्र रूप से बदलते रहते हैं, जबकि एजेंट को एक स्थिर इंटरफ़ेस दिखाई देता है।

## CLI त्वरित संदर्भ

किसी विशिष्ट प्रोफ़ाइल को लक्षित करने के लिए सभी कमांड `--browser-profile <name>` और मशीन-पठनीय आउटपुट के लिए `--json` स्वीकार करते हैं।

<AccordionGroup>

<Accordion title="मूल बातें: स्थिति, टैब, खोलना/फ़ोकस करना/बंद करना">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # लाइव स्नैपशॉट जाँच जोड़ें
openclaw browser start
openclaw browser start --headless # एकबारगी स्थानीय प्रबंधित हेडलेस लॉन्च
openclaw browser stop            # केवल-अटैच/रिमोट CDP पर एम्युलेशन भी साफ़ करता है
openclaw browser reset-profile   # प्रोफ़ाइल का ब्राउज़र डेटा Trash में ले जाता है
openclaw browser tabs
openclaw browser tab             # वर्तमान टैब का शॉर्टकट
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="प्रोफ़ाइल: सूचीबद्ध करना, बनाना, हटाना">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="निरीक्षण: स्क्रीनशॉट, स्नैपशॉट, कंसोल, त्रुटियाँ, अनुरोध">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # या भूमिका रेफ़रेंस के लिए --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="क्रियाएँ: नेविगेट करना, क्लिक करना, टाइप करना, खींचना, प्रतीक्षा करना, मूल्यांकन करना">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # या भूमिका रेफ़रेंस के लिए e12
openclaw browser click-coords 120 340        # व्यूपोर्ट निर्देशांक
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="स्थिति: कुकी, स्टोरेज, ऑफ़लाइन, हेडर, भू-स्थान, डिवाइस">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # हटाने के लिए --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

टिप्पणियाँ:

- एजेंट के लिए उपलब्ध `browser` टूल `action=download` (आवश्यक `ref` और
  `path`) तथा `action=waitfordownload` (वैकल्पिक `path`) उपलब्ध कराता है। दोनों सहेजा गया
  डाउनलोड URL, सुझाया गया फ़ाइल नाम और सुरक्षित स्थानीय पथ लौटाते हैं। प्रबंधित Playwright प्रोफ़ाइलों के लिए स्पष्ट डाउनलोड
  इंटरसेप्शन उपलब्ध है; मौजूदा-सत्र
  प्रोफ़ाइलें असमर्थित-ऑपरेशन त्रुटि लौटाती हैं।
- एटॉमिक चूज़र अपलोड को प्राथमिकता दें: अपलोड के साथ ट्रिगर `--ref` पास करें, ताकि OpenClaw एक ही अनुरोध में तैयार होकर क्लिक करे। केवल-पथ वाला `upload` तब भी समर्थित है, जब बाद में ट्रिगर करना जानबूझकर हो। फ़ाइल इनपुट को सीधे सेट करने के लिए `--input-ref` या `--element` का उपयोग करें। `dialog` तैयार करने वाली कॉल है; संवाद ट्रिगर करने वाले क्लिक/की-दबाव से पहले इसे चलाएँ। यदि कोई क्रिया मोडल खोलती है, तो क्रिया की प्रतिक्रिया में `blockedByDialog` और `browserState.dialogs.pending` शामिल होते हैं; सीधे प्रतिक्रिया देने के लिए वह `dialogId` पास करें। OpenClaw के बाहर संभाले गए संवाद `browserState.dialogs.recent` के अंतर्गत दिखाई देते हैं।
- `click`/`type`/आदि के लिए `snapshot` से मिला `ref` आवश्यक है (संख्यात्मक `12`, भूमिका रेफ़रेंस `e12`, या क्रियायोग्य ARIA रेफ़रेंस `ax12`)। क्रियाओं के लिए CSS चयनकर्ता जानबूझकर समर्थित नहीं हैं। जब दृश्य व्यूपोर्ट की स्थिति ही एकमात्र विश्वसनीय लक्ष्य हो, तब `click-coords` का उपयोग करें।
- डाउनलोड और ट्रेस पथ OpenClaw के अस्थायी रूट तक सीमित हैं: `/tmp/openclaw{,/downloads}` (फ़ॉलबैक: `${os.tmpdir()}/openclaw/...`)।
- `upload` OpenClaw के अस्थायी अपलोड रूट और
  OpenClaw द्वारा प्रबंधित इनबाउंड मीडिया से फ़ाइलें स्वीकार करता है। प्रबंधित इनबाउंड मीडिया को
  `media://inbound/<id>`, सैंडबॉक्स-सापेक्ष `media/inbound/<id>`, या प्रबंधित इनबाउंड मीडिया डायरेक्टरी के भीतर स्थित
  निराकृत पथ के रूप में संदर्भित किया जा सकता है। नेस्टेड मीडिया रेफ़रेंस,
  ट्रैवर्सल, सिमलिंक, हार्डलिंक और मनमाने स्थानीय पथ अब भी अस्वीकार किए जाते हैं।
- `upload` भी `--input-ref` या `--element` के माध्यम से फ़ाइल इनपुट सीधे सेट कर सकता है।

जब OpenClaw प्रतिस्थापन टैब को प्रमाणित कर सकता है, तब स्थिर टैब आईडी और लेबल Chromium के रॉ-टार्गेट प्रतिस्थापन के बाद भी बने रहते हैं, जैसे समान URL के लिए एक अद्वितीय पुरानी/नई जोड़ी या फ़ॉर्म सबमिट करने के बाद एक पुराना टैब एक नया टैब बन जाए। अस्पष्ट
डुप्लिकेट-URL प्रतिस्थापनों को नए हैंडल मिलते हैं। रॉ टार्गेट आईडी अब भी
अस्थिर हैं; स्क्रिप्ट में `tabs` से मिले `suggestedTargetId` को प्राथमिकता दें।

स्नैपशॉट फ़्लैग एक नज़र में:

- `--format ai` (Playwright के साथ डिफ़ॉल्ट): संख्यात्मक रेफ़रेंस वाला AI स्नैपशॉट (`aria-ref="<n>"`)।
- `--format aria`: `axN` रेफ़रेंस वाला अभिगम्यता ट्री। Playwright उपलब्ध होने पर, OpenClaw रेफ़रेंस को बैकएंड DOM आईडी के साथ लाइव पेज से बाँधता है, ताकि आगामी क्रियाएँ उनका उपयोग कर सकें; अन्यथा आउटपुट को केवल निरीक्षण के लिए मानें।
- `--efficient` (या `--mode efficient`): कॉम्पैक्ट भूमिका स्नैपशॉट प्रीसेट। इसे डिफ़ॉल्ट बनाने के लिए `browser.snapshotDefaults.mode: "efficient"` सेट करें ([Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration-reference#browser) देखें)।
- `--interactive`, `--compact`, `--depth`, `--selector` `ref=e12` रेफ़रेंस वाले भूमिका स्नैपशॉट को बाध्य करते हैं। `--frame "<iframe>"` भूमिका स्नैपशॉट को किसी iframe तक सीमित करता है।
- Playwright के साथ, `--labels` ओवरले किए गए रेफ़रेंस लेबल वाला स्क्रीनशॉट जोड़ता है
  (`MEDIA:<path>` प्रिंट करता है), साथ ही प्रत्येक रेफ़रेंस के बाउंडिंग
  बॉक्स वाली `annotations` सरणी भी जोड़ता है। `screenshot` पर, Playwright-समर्थित लेबल `--full-page`,
  `--ref`, और `--element` के साथ काम करते हैं; `snapshot` पर, साथ का स्क्रीनशॉट
  केवल व्यूपोर्ट तक सीमित रहता है। मौजूदा-सत्र/chrome-mcp प्रोफ़ाइलें
  पेज स्क्रीनशॉट पर ओवरले लेबल रेंडर करती हैं, लेकिन `annotations` नहीं लौटातीं और Playwright के
  पूर्ण-पृष्ठ/रेफ़रेंस/तत्व प्रोजेक्शन सहायक का उपयोग नहीं करतीं। Playwright या chrome-mcp के बिना,
  लेबल वाले स्क्रीनशॉट उपलब्ध नहीं हैं।
- `--urls` खोजे गए लिंक गंतव्यों को AI स्नैपशॉट में जोड़ता है।

## स्नैपशॉट और रेफ़रेंस

OpenClaw दो प्रकार की "स्नैपशॉट" शैलियों का समर्थन करता है:

- **AI स्नैपशॉट (संख्यात्मक रेफ़रेंस)**: `openclaw browser snapshot` (डिफ़ॉल्ट; `--format ai`)
  - आउटपुट: संख्यात्मक रेफ़रेंस वाला टेक्स्ट स्नैपशॉट।
  - क्रियाएँ: `openclaw browser click 12`, `openclaw browser type 23 "hello"`।
  - आंतरिक रूप से, रेफ़रेंस को Playwright के `aria-ref` के माध्यम से निराकृत किया जाता है।

- **भूमिका स्नैपशॉट (`e12` जैसे भूमिका रेफ़रेंस)**: `openclaw browser snapshot --interactive` (या `--compact`, `--depth`, `--selector`, `--frame`)
  - आउटपुट: `[ref=e12]` (और वैकल्पिक `[nth=1]`) वाली भूमिका-आधारित सूची/ट्री।
  - क्रियाएँ: `openclaw browser click e12`, `openclaw browser highlight e12`।
  - आंतरिक रूप से, रेफ़रेंस को `getByRole(...)` (तथा डुप्लिकेट के लिए `nth()`) के माध्यम से निराकृत किया जाता है।
  - ओवरले किए गए `e12` लेबल वाला स्क्रीनशॉट शामिल करने के लिए `--labels` जोड़ें। Playwright-समर्थित प्रोफ़ाइलों पर
    यह प्रति-रेफ़रेंस बाउंडिंग-बॉक्स मेटाडेटा
    (`annotations[]`) भी लौटाता है।
  - जब लिंक टेक्स्ट अस्पष्ट हो और एजेंट को ठोस
    नेविगेशन लक्ष्य चाहिए हों, तब `--urls` जोड़ें।

- **ARIA स्नैपशॉट (`ax12` जैसे ARIA रेफ़रेंस)**: `openclaw browser snapshot --format aria`
  - आउटपुट: संरचित नोड के रूप में अभिगम्यता ट्री।
  - क्रियाएँ: जब स्नैपशॉट पथ रेफ़रेंस को
    Playwright और Chrome बैकएंड DOM आईडी के माध्यम से बाँध सकता है, तब `openclaw browser click ax12` काम करता है।
- यदि Playwright उपलब्ध नहीं है, तो ARIA स्नैपशॉट फिर भी
  निरीक्षण के लिए उपयोगी हो सकते हैं, लेकिन रेफ़रेंस क्रियायोग्य न हों। क्रिया रेफ़रेंस की आवश्यकता होने पर `--format ai`
  या `--interactive` के साथ फिर से स्नैपशॉट लें।
- रॉ-CDP फ़ॉलबैक पथ के लिए Docker प्रमाण: `pnpm test:docker:browser-cdp-snapshot`
  Chromium को CDP के साथ शुरू करता है, `browser doctor --deep` चलाता है, और सत्यापित करता है कि भूमिका
  स्नैपशॉट में लिंक URL, कर्सर द्वारा क्रियायोग्य बनाए गए तत्व और iframe मेटाडेटा शामिल हैं।

रेफ़रेंस का व्यवहार:

- नेविगेशन के बीच रेफ़रेंस **स्थिर नहीं रहते**; यदि कुछ विफल हो, तो `snapshot` फिर से चलाएँ और नया रेफ़रेंस उपयोग करें।
- जब प्रतिस्थापन टैब को प्रमाणित किया जा सके, तब `/act` क्रिया से ट्रिगर हुए प्रतिस्थापन के बाद वर्तमान रॉ `targetId` लौटाता है।
  आगामी कमांड के लिए स्थिर टैब आईडी/लेबल का उपयोग जारी रखें।
- यदि भूमिका स्नैपशॉट `--frame` के साथ लिया गया था, तो अगले भूमिका स्नैपशॉट तक भूमिका रेफ़रेंस उस iframe तक सीमित रहते हैं।
- अज्ञात या पुराने `axN` रेफ़रेंस Playwright के `aria-ref` चयनकर्ता पर जाने के बजाय
  तुरंत विफल हो जाते हैं। ऐसा होने पर उसी टैब पर
  नया स्नैपशॉट लें।

## प्रतीक्षा की उन्नत क्षमताएँ

आप केवल समय/टेक्स्ट के अतिरिक्त अन्य स्थितियों की भी प्रतीक्षा कर सकते हैं:

- URL की प्रतीक्षा करें (Playwright द्वारा ग्लॉब समर्थित):
  - `openclaw browser wait --url "**/dash"`
- लोड स्थिति की प्रतीक्षा करें:
  - `openclaw browser wait --load networkidle`
  - प्रबंधित `openclaw` और रॉ/रिमोट CDP प्रोफ़ाइलों पर समर्थित। `existing-session` ड्राइवर का उपयोग करने वाली प्रोफ़ाइलें (डिफ़ॉल्ट `user` प्रोफ़ाइल सहित) `networkidle` को अस्वीकार करती हैं; वहाँ `--url`, `--text`, किसी चयनकर्ता, या `--fn` प्रतीक्षा का उपयोग करें।
- JS प्रेडिकेट की प्रतीक्षा करें:
  - `openclaw browser wait --fn "window.ready===true"`
- किसी चयनकर्ता के दृश्यमान होने की प्रतीक्षा करें:
  - `openclaw browser wait "#main"`

इन्हें संयोजित किया जा सकता है:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## डीबग कार्यप्रवाह

जब कोई क्रिया विफल हो (उदा. "दृश्यमान नहीं", "सख्त मोड उल्लंघन", "ढका हुआ"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` का उपयोग करें (इंटरैक्टिव मोड में भूमिका रेफ़रेंस को प्राथमिकता दें)
3. यदि यह फिर भी विफल हो: Playwright किसे लक्ष्य बना रहा है, यह देखने के लिए `openclaw browser highlight <ref>` का उपयोग करें
4. यदि पेज असामान्य व्यवहार करे:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. गहन डीबगिंग के लिए: ट्रेस रिकॉर्ड करें:
   - `openclaw browser trace start`
   - समस्या को पुनरुत्पादित करें
   - `openclaw browser trace stop` (`TRACE:<path>` प्रिंट करता है)

## JSON आउटपुट

`--json` स्क्रिप्टिंग और संरचित टूलिंग के लिए है।

उदाहरण:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

JSON में भूमिका स्नैपशॉट में `refs` तथा एक छोटा `stats` ब्लॉक (पंक्तियाँ/वर्ण/रेफ़रेंस/इंटरैक्टिव) शामिल होता है, ताकि टूल पेलोड के आकार और घनत्व का आकलन कर सकें।

## स्थिति और परिवेश नियंत्रण

ये "साइट को X जैसा व्यवहार कराएँ" कार्यप्रवाहों के लिए उपयोगी हैं:

- कुकीज़: `cookies`, `cookies set`, `cookies clear`
- स्टोरेज: `storage local|session get|set|clear`
- ऑफ़लाइन: `set offline on|off`
- हेडर: `set headers --headers-json '{"X-Debug":"1"}'` (या स्थितीय रूप `set headers '{"X-Debug":"1"}'`)
- HTTP बेसिक प्रमाणीकरण: `set credentials user pass` (या `--clear`)
- भौगोलिक स्थान: `set geo <lat> <lon> --origin "https://example.com"` (या `--clear`)
- मीडिया: `set media dark|light|no-preference|none`
- समय-क्षेत्र / लोकेल: `set timezone ...`, `set locale ...`
- डिवाइस / व्यूपोर्ट:
  - `set device "iPhone 14"` (Playwright डिवाइस प्रीसेट)
  - `set viewport 1280 720`

## सुरक्षा और गोपनीयता

- openclaw ब्राउज़र प्रोफ़ाइल में लॉग-इन सत्र हो सकते हैं; इसे संवेदनशील मानें।
- `browser act kind=evaluate` / `openclaw browser evaluate` और `wait --fn`
  पेज संदर्भ में मनमाना JavaScript निष्पादित करते हैं। प्रॉम्प्ट इंजेक्शन इसे प्रभावित कर सकता है।
  यदि इसकी आवश्यकता न हो, तो `browser.evaluateEnabled=false` के साथ इसे अक्षम करें।
- `openclaw browser evaluate --fn` किसी फ़ंक्शन स्रोत, एक्सप्रेशन या
  स्टेटमेंट बॉडी को स्वीकार करता है। स्टेटमेंट बॉडी को async फ़ंक्शन के रूप में रैप किया जाता है, इसलिए जो मान
  वापस चाहिए उसके लिए `return` का उपयोग करें। यदि पेज-साइड फ़ंक्शन को डिफ़ॉल्ट मूल्यांकन टाइमआउट से अधिक
  समय की आवश्यकता हो सकती है, तो `--timeout-ms <ms>` का उपयोग करें।
- लॉगिन और एंटी-बॉट नोट्स (X/Twitter आदि) के लिए, [ब्राउज़र लॉगिन + X/Twitter पर पोस्ट करना](/hi/tools/browser-login) देखें।
- Gateway/Node होस्ट को निजी रखें (केवल लूपबैक या टेलनेट)।
- रिमोट CDP एंडपॉइंट शक्तिशाली होते हैं; उन्हें टनल करें और सुरक्षित रखें।

सख्त-मोड उदाहरण (डिफ़ॉल्ट रूप से निजी/आंतरिक गंतव्यों को अवरुद्ध करें):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // वैकल्पिक सटीक अनुमति
    },
  },
}
```

## संबंधित

- [ब्राउज़र](/hi/tools/browser) - अवलोकन, कॉन्फ़िगरेशन, प्रोफ़ाइलें, सुरक्षा
- [ब्राउज़र लॉगिन](/hi/tools/browser-login) - साइटों में साइन इन करना
- [ब्राउज़र Linux समस्या-निवारण](/hi/tools/browser-linux-troubleshooting)
- [ब्राउज़र WSL2 समस्या-निवारण](/hi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
