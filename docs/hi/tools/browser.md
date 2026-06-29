---
read_when:
    - एजेंट-नियंत्रित ब्राउज़र ऑटोमेशन जोड़ना
    - डीबग करना कि openclaw आपके अपने Chrome में हस्तक्षेप क्यों कर रहा है
    - macOS ऐप में ब्राउज़र सेटिंग्स + जीवनचक्र लागू करना
summary: एकीकृत ब्राउज़र नियंत्रण सेवा + एक्शन कमांड
title: ब्राउज़र (OpenClaw-प्रबंधित)
x-i18n:
    generated_at: "2026-06-29T00:17:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw एक **समर्पित Chrome/Brave/Edge/Chromium प्रोफ़ाइल** चला सकता है जिसे एजेंट नियंत्रित करता है।
यह आपके निजी ब्राउज़र से अलग-थलग होती है और Gateway के अंदर एक छोटी स्थानीय
नियंत्रण सेवा के ज़रिए प्रबंधित होती है (केवल loopback)।

शुरुआती दृष्टि:

- इसे एक **अलग, केवल-एजेंट ब्राउज़र** समझें।
- `openclaw` प्रोफ़ाइल आपकी निजी ब्राउज़र प्रोफ़ाइल को **नहीं** छूती।
- एजेंट सुरक्षित लेन में **टैब खोल सकता है, पेज पढ़ सकता है, क्लिक कर सकता है, और टाइप कर सकता है**।
- अंतर्निहित `user` प्रोफ़ाइल Chrome MCP के ज़रिए आपके वास्तविक साइन-इन Chrome सत्र से जुड़ती है।

## आपको क्या मिलता है

- **openclaw** नाम की एक अलग ब्राउज़र प्रोफ़ाइल (डिफ़ॉल्ट रूप से नारंगी एक्सेंट)।
- नियतात्मक टैब नियंत्रण (सूची/खोलना/फ़ोकस/बंद करना)।
- एजेंट क्रियाएँ (क्लिक/टाइप/ड्रैग/चयन), स्नैपशॉट, स्क्रीनशॉट, PDF।
- एक बंडल की गई `browser-automation` skill जो एजेंटों को स्नैपशॉट,
  स्थिर-टैब, stale-ref, और मैनुअल-ब्लॉकर रिकवरी लूप सिखाती है जब ब्राउज़र
  plugin सक्षम होता है।
- वैकल्पिक मल्टी-प्रोफ़ाइल समर्थन (`openclaw`, `work`, `remote`, ...)।

यह ब्राउज़र आपका **दैनिक उपयोग वाला ब्राउज़र नहीं** है। यह एजेंट ऑटोमेशन और
सत्यापन के लिए एक सुरक्षित, अलग-थलग सतह है।

## त्वरित शुरुआत

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

अगर आपको "Browser disabled" मिलता है, तो इसे कॉन्फ़िग में सक्षम करें (नीचे देखें) और
Gateway को पुनः आरंभ करें।

अगर `openclaw browser` पूरी तरह गायब है, या एजेंट कहता है कि ब्राउज़र टूल
उपलब्ध नहीं है, तो [ब्राउज़र कमांड या टूल गायब है](/hi/tools/browser#missing-browser-command-or-tool) पर जाएँ।

## Plugin नियंत्रण

डिफ़ॉल्ट `browser` टूल एक बंडल किया गया plugin है। इसे किसी ऐसे दूसरे plugin से बदलने के लिए अक्षम करें जो वही `browser` टूल नाम रजिस्टर करता है:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

डिफ़ॉल्ट्स को `plugins.entries.browser.enabled` **और** `browser.enabled=true` दोनों चाहिए। केवल plugin को अक्षम करने से `openclaw browser` CLI, `browser.request` gateway मेथड, एजेंट टूल, और नियंत्रण सेवा एक इकाई के रूप में हट जाते हैं; आपका `browser.*` कॉन्फ़िग प्रतिस्थापन के लिए बरकरार रहता है।

ब्राउज़र कॉन्फ़िग बदलावों के लिए Gateway पुनः आरंभ करना आवश्यक है ताकि plugin अपनी सेवा फिर से रजिस्टर कर सके।

## एजेंट मार्गदर्शन

टूल-प्रोफ़ाइल नोट: `tools.profile: "coding"` में `web_search` और
`web_fetch` शामिल हैं, लेकिन इसमें पूरा `browser` टूल शामिल नहीं है। अगर एजेंट या कोई
spawned sub-agent ब्राउज़र ऑटोमेशन इस्तेमाल करे, तो प्रोफ़ाइल
चरण पर browser जोड़ें:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

एकल एजेंट के लिए, `agents.list[].tools.alsoAllow: ["browser"]` का उपयोग करें।
`tools.subagents.tools.allow: ["browser"]` अकेले पर्याप्त नहीं है क्योंकि sub-agent
नीति प्रोफ़ाइल फ़िल्टरिंग के बाद लागू होती है।

ब्राउज़र plugin एजेंट मार्गदर्शन के दो स्तर भेजता है:

- `browser` टूल विवरण में संक्षिप्त हमेशा-सक्रिय अनुबंध होता है: सही
  प्रोफ़ाइल चुनें, refs को उसी टैब पर रखें, टैब
  लक्ष्यीकरण के लिए `tabId`/labels का उपयोग करें, और बहु-चरणीय कार्य के लिए ब्राउज़र skill लोड करें।
- बंडल की गई `browser-automation` skill में लंबा संचालन लूप होता है:
  पहले स्थिति/टैब जाँचें, कार्य टैब को लेबल करें, कार्रवाई से पहले स्नैपशॉट लें, UI बदलावों
  के बाद फिर स्नैपशॉट लें, stale refs को एक बार रिकवर करें, और login/2FA/captcha या
  camera/microphone ब्लॉकर को अनुमान लगाने के बजाय मैनुअल कार्रवाई के रूप में रिपोर्ट करें।

Plugin-बंडल Skills एजेंट की उपलब्ध skills में सूचीबद्ध होती हैं जब
plugin सक्षम होता है। पूरी skill निर्देशावली मांग पर लोड होती है, इसलिए सामान्य
turns पर पूरा टोकन खर्च नहीं आता।

## ब्राउज़र कमांड या टूल गायब है

अगर अपग्रेड के बाद `openclaw browser` अज्ञात है, `browser.request` गायब है, या एजेंट ब्राउज़र टूल को अनुपलब्ध बताता है, तो सामान्य कारण `plugins.allow` सूची है जिसमें `browser` नहीं है और कोई रूट `browser` कॉन्फ़िग ब्लॉक मौजूद नहीं है। इसे जोड़ें:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

एक स्पष्ट रूट `browser` ब्लॉक, उदाहरण के लिए `browser.enabled=true` या `browser.profiles.<name>`, सीमित `plugins.allow` के अंतर्गत भी बंडल किए गए ब्राउज़र plugin को सक्रिय करता है, channel कॉन्फ़िग व्यवहार से मेल खाते हुए। `plugins.entries.browser.enabled=true` और `tools.alsoAllow: ["browser"]` अपने-आप allowlist सदस्यता का विकल्प नहीं बनते। `plugins.allow` को पूरी तरह हटाने से भी डिफ़ॉल्ट पुनर्स्थापित हो जाता है।

## प्रोफ़ाइलें: `openclaw` बनाम `user`

- `openclaw`: प्रबंधित, अलग-थलग ब्राउज़र (कोई extension आवश्यक नहीं)।
- `user`: आपके **वास्तविक साइन-इन Chrome**
  सत्र के लिए अंतर्निहित Chrome MCP attach प्रोफ़ाइल।

एजेंट ब्राउज़र टूल कॉल के लिए:

- डिफ़ॉल्ट: अलग-थलग `openclaw` ब्राउज़र का उपयोग करें।
- जब मौजूदा लॉग-इन सत्र महत्वपूर्ण हों और उपयोगकर्ता किसी attach प्रॉम्प्ट को क्लिक/स्वीकृत करने के लिए
  कंप्यूटर पर हो, तब `profile="user"` को प्राथमिकता दें।
- जब आप कोई विशिष्ट ब्राउज़र मोड चाहते हों, तो `profile` स्पष्ट ओवरराइड है।

अगर आप प्रबंधित मोड को डिफ़ॉल्ट बनाना चाहते हैं, तो `browser.defaultProfile: "openclaw"` सेट करें।

## कॉन्फ़िगरेशन

ब्राउज़र सेटिंग्स `~/.openclaw/openclaw.json` में रहती हैं।

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

### स्क्रीनशॉट विज़न (केवल-टेक्स्ट मॉडल समर्थन)

जब मुख्य मॉडल केवल-टेक्स्ट हो (कोई vision/multimodal समर्थन नहीं), ब्राउज़र
स्क्रीनशॉट ऐसे image blocks लौटाते हैं जिन्हें मॉडल पढ़ नहीं सकता। ब्राउज़र स्क्रीनशॉट
मौजूदा image-understanding कॉन्फ़िगरेशन का फिर से उपयोग करते हैं, इसलिए मीडिया समझ के लिए
कॉन्फ़िगर किया गया image model बिना किसी
ब्राउज़र-विशिष्ट मॉडल सेटिंग के स्क्रीनशॉट को टेक्स्ट के रूप में वर्णित कर सकता है।

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**यह कैसे काम करता है:**

1. एजेंट `browser screenshot` कॉल करता है → छवि हमेशा की तरह डिस्क पर कैप्चर होती है।
2. ब्राउज़र टूल मौजूदा image-understanding runtime से पूछता है कि क्या वह
   कॉन्फ़िगर किए गए media image models, shared media
   models, image-model defaults, या auth-backed image provider का उपयोग करके स्क्रीनशॉट का वर्णन कर सकता है।
3. vision model एक टेक्स्ट विवरण लौटाता है, जिसे
   `wrapExternalContent` (prompt injection guard) के साथ रैप किया जाता है और एजेंट को
   image block के बजाय text block के रूप में लौटाया जाता है।
4. अगर image understanding अनुपलब्ध है, छोड़ी गई है, या विफल होती है, तो ब्राउज़र
   मूल image block लौटाने पर वापस चला जाता है।

मॉडल fallbacks, timeouts, byte limits, profiles, और provider request settings के लिए मौजूदा `tools.media.image` / `tools.media.models` फ़ील्ड का उपयोग करें।

अगर सक्रिय मुख्य मॉडल पहले से vision का समर्थन करता है और कोई स्पष्ट image
understanding model कॉन्फ़िगर नहीं है, तो OpenClaw सामान्य image result रखता है ताकि
मुख्य मॉडल सीधे स्क्रीनशॉट पढ़ सके।

<AccordionGroup>

<Accordion title="पोर्ट और पहुँच-योग्यता">

- नियंत्रण सेवा `gateway.port` से निकाले गए पोर्ट पर loopback से bind होती है (डिफ़ॉल्ट `18791` = gateway + 2)। `gateway.port` या `OPENCLAW_GATEWAY_PORT` को ओवरराइड करने से उसी परिवार में निकाले गए पोर्ट शिफ्ट होते हैं।
- स्थानीय `openclaw` प्रोफ़ाइलें `cdpPort`/`cdpUrl` को अपने-आप असाइन करती हैं; इन्हें केवल
  remote CDP प्रोफ़ाइलों या existing-session endpoint attach के लिए सेट करें। `cdpUrl` unset होने पर
  प्रबंधित स्थानीय CDP पोर्ट पर डिफ़ॉल्ट होता है।
- `remoteCdpTimeoutMs` remote और `attachOnly` CDP HTTP पहुँच-योग्यता
  जाँचों और टैब-खोलने वाले HTTP अनुरोधों पर लागू होता है; `remoteCdpHandshakeTimeoutMs` उनके
  CDP WebSocket handshakes पर लागू होता है।
- `localLaunchTimeoutMs` स्थानीय रूप से लॉन्च की गई प्रबंधित Chrome
  प्रक्रिया के लिए अपना CDP HTTP endpoint उजागर करने का बजट है। `localCdpReadyTimeoutMs`
  प्रक्रिया खोजे जाने के बाद CDP websocket readiness के लिए
  अनुवर्ती बजट है। इन्हें Raspberry Pi, लो-एंड VPS, या पुराने हार्डवेयर पर बढ़ाएँ जहाँ Chromium
  धीरे शुरू होता है। मान `120000` ms तक धनात्मक पूर्णांक होने चाहिए; अमान्य
  कॉन्फ़िग मान अस्वीकार किए जाते हैं।
- बार-बार प्रबंधित Chrome launch/readiness विफलताओं को प्रति
  प्रोफ़ाइल circuit-broken किया जाता है। कई लगातार विफलताओं के बाद, OpenClaw हर ब्राउज़र टूल कॉल पर Chromium
  शुरू करने के बजाय नए launch
  प्रयासों को थोड़ी देर रोकता है। startup समस्या ठीक करें, ब्राउज़र की आवश्यकता न हो तो उसे अक्षम करें, या मरम्मत के बाद
  Gateway को पुनः आरंभ करें।
- `actionTimeoutMs` ब्राउज़र `act` अनुरोधों के लिए डिफ़ॉल्ट बजट है जब caller `timeoutMs` पास नहीं करता। client transport एक छोटी slack window जोड़ता है ताकि लंबे इंतज़ार HTTP boundary पर timeout होने के बजाय पूरे हो सकें।
- `tabCleanup` primary-agent ब्राउज़र सत्रों द्वारा खोले गए टैब के लिए best-effort cleanup है। Subagent, cron, और ACP lifecycle cleanup अभी भी सत्र के अंत में उनके स्पष्ट tracked tabs बंद करता है; primary sessions सक्रिय tabs को पुन: उपयोग योग्य रखते हैं, फिर पृष्ठभूमि में idle या अतिरिक्त tracked tabs बंद करते हैं।

</Accordion>

<Accordion title="SSRF नीति">

- ब्राउज़र नेविगेशन और खुले-टैब को नेविगेशन से पहले SSRF-guarded किया जाता है और बाद में अंतिम `http(s)` URL पर best-effort फिर से जांचा जाता है।
- strict SSRF मोड में, remote CDP endpoint discovery और `/json/version` probes (`cdpUrl`) भी जांचे जाते हैं।
- Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और `NO_PROXY` environment variables OpenClaw-प्रबंधित browser को अपने-आप proxy नहीं करते। Managed Chrome डिफ़ॉल्ट रूप से सीधे launch होता है ताकि provider proxy settings browser SSRF checks को कमजोर न करें।
- OpenClaw-प्रबंधित local CDP readiness probes और DevTools WebSocket connections ठीक launched loopback endpoint के लिए managed network proxy को bypass करते हैं, ताकि `openclaw browser start` तब भी काम करे जब operator proxy loopback egress को block करता हो।
- managed browser को ही proxy करने के लिए, `browser.extraArgs` के माध्यम से स्पष्ट Chrome proxy flags पास करें, जैसे `--proxy-server=...` या `--proxy-pac-url=...`। strict SSRF मोड explicit browser proxy routing को block करता है, जब तक private-network browser access जानबूझकर enable न किया गया हो।
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` डिफ़ॉल्ट रूप से off है; केवल तब enable करें जब private-network browser access को जानबूझकर trusted माना गया हो।
- `browser.ssrfPolicy.allowPrivateNetwork` legacy alias के रूप में supported रहता है।

</Accordion>

<Accordion title="Profile व्यवहार">

- `attachOnly: true` का मतलब है local browser कभी launch न करें; केवल तब attach करें जब कोई पहले से running हो।
- `headless` को globally या प्रति local managed profile set किया जा सकता है। Per-profile values `browser.headless` को override करती हैं, इसलिए एक locally launched profile headless रह सकती है जबकि दूसरी visible रहती है।
- `POST /start?headless=true` और `openclaw browser start --headless` local managed profiles के लिए
  one-shot headless launch request करते हैं, बिना
  `browser.headless` या profile config को rewrite किए। Existing-session, attach-only, और
  remote CDP profiles override को reject करते हैं क्योंकि OpenClaw उन
  browser processes को launch नहीं करता।
- `DISPLAY` या `WAYLAND_DISPLAY` के बिना Linux hosts पर, local managed profiles
  तब अपने-आप headless default करते हैं जब environment या profile/global
  config में से कोई भी explicitly headed mode नहीं चुनता। `openclaw browser status --json`
  `headlessSource` को `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, या `default` के रूप में report करता है।
- `OPENCLAW_BROWSER_HEADLESS=1` current process के लिए local managed launches को headless force करता है।
  `OPENCLAW_BROWSER_HEADLESS=0` ordinary starts के लिए headed mode force करता है
  और display server के बिना Linux hosts पर actionable error return करता है;
  explicit `start --headless` request फिर भी उस एक launch के लिए wins करती है।
- `executablePath` को globally या प्रति local managed profile set किया जा सकता है। Per-profile values `browser.executablePath` को override करती हैं, इसलिए अलग-अलग managed profiles अलग Chromium-based browsers launch कर सकते हैं। दोनों forms आपके OS home directory के लिए `~` accept करते हैं।
- `color` (top-level और per-profile) browser UI को tint करता है ताकि आप देख सकें कि कौन-सी profile active है।
- Default profile `openclaw` (managed standalone) है। signed-in user browser में opt in करने के लिए `defaultProfile: "user"` use करें।
- Auto-detect order: system default browser अगर Chromium-based हो; अन्यथा Chrome → Brave → Edge → Chromium → Chrome Canary।
- `driver: "existing-session"` raw CDP के बजाय Chrome DevTools MCP use करता है। यह Chrome MCP auto-connect के माध्यम से attach कर सकता है, या `cdpUrl` के माध्यम से जब आपके पास running browser के लिए पहले से DevTools endpoint हो।
- `browser.profiles.<name>.userDataDir` set करें जब existing-session profile को non-default Chromium user profile (Brave, Edge, आदि) से attach करना चाहिए। यह path भी आपके OS home directory के लिए `~` accept करता है।

</Accordion>

</AccordionGroup>

## Brave या किसी अन्य Chromium-based browser का उपयोग करें

यदि आपका **system default** browser Chromium-based है (Chrome/Brave/Edge/etc),
OpenClaw इसे अपने-आप use करता है। auto-detection को override करने के लिए `browser.executablePath` set करें।
Top-level और per-profile `executablePath` values आपके OS home directory के लिए `~`
accept करती हैं:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

या इसे config में, प्रति platform set करें:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

Per-profile `executablePath` केवल उन local managed profiles को प्रभावित करता है जिन्हें OpenClaw
launch करता है। `existing-session` profiles इसके बजाय already-running browser से attach करती हैं,
और remote CDP profiles `cdpUrl` के पीछे वाले browser का उपयोग करती हैं।

## Local बनाम remote control

- **Local control (default):** Gateway loopback control service शुरू करता है और local browser launch कर सकता है।
- **Remote control (node host):** उस machine पर node host run करें जिसके पास browser है; Gateway browser actions को उसके पास proxy करता है।
- **Remote CDP:** remote Chromium-based browser से
  attach करने के लिए `browser.profiles.<name>.cdpUrl` (या `browser.cdpUrl`) set करें। इस case में, OpenClaw local browser launch नहीं करेगा।
- loopback पर externally managed CDP services के लिए (उदाहरण के लिए
  Docker में Browserless जो `127.0.0.1` पर published है), `attachOnly: true` भी set करें। Loopback CDP
  बिना `attachOnly` के local OpenClaw-managed browser profile माना जाता है।
- `headless` केवल उन local managed profiles को प्रभावित करता है जिन्हें OpenClaw launch करता है। यह existing-session या remote CDP browsers को restart या change नहीं करता।
- `executablePath` वही local managed profile rule follow करता है। इसे running local managed profile पर बदलने से
  वह profile restart/reconcile के लिए mark हो जाता है ताकि
  next launch new binary use करे।

Stopping behavior profile mode के अनुसार अलग होता है:

- local managed profiles: `openclaw browser stop` उस browser process को stop करता है जिसे
  OpenClaw ने launch किया था
- attach-only और remote CDP profiles: `openclaw browser stop` active
  control session को close करता है और Playwright/CDP emulation overrides (viewport,
  color scheme, locale, timezone, offline mode, और similar state) release करता है, भले ही
  OpenClaw ने कोई browser process launch न किया हो

Remote CDP URLs auth शामिल कर सकते हैं:

- Query tokens (उदाहरण, `https://provider.example?token=<token>`)
- HTTP Basic auth (उदाहरण, `https://user:pass@provider.example`)

OpenClaw `/json/*` endpoints call करते समय और
CDP WebSocket से connect करते समय auth preserve करता है। tokens को config files में commit करने के बजाय
environment variables या secrets managers को prefer करें।

## Node browser proxy (zero-config default)

यदि आप उस machine पर **node host** run करते हैं जिसके पास आपका browser है, तो OpenClaw
बिना किसी extra browser config के browser tool calls को उस node पर
auto-route कर सकता है। यह remote gateways के लिए default path है।

Notes:

- node host अपना local browser control server एक **proxy command** के माध्यम से expose करता है।
- Profiles node के अपने `browser.profiles` config से आती हैं (local के समान)।
- `nodeHost.browserProxy.allowProfiles` optional है। legacy/default behavior के लिए इसे empty छोड़ें: सभी configured profiles proxy के माध्यम से reachable रहती हैं, profile create/delete routes सहित।
- यदि आप `nodeHost.browserProxy.allowProfiles` set करते हैं, OpenClaw इसे least-privilege boundary के रूप में treat करता है: केवल allowlisted profiles target की जा सकती हैं, और persistent profile create/delete routes proxy surface पर blocked होते हैं।
- यदि आप इसे नहीं चाहते तो disable करें:
  - node पर: `nodeHost.browserProxy.enabled=false`
  - gateway पर: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) एक hosted Chromium service है जो
HTTPS और WebSocket पर CDP connection URLs expose करती है। OpenClaw किसी भी form का उपयोग कर सकता है, लेकिन
remote browser profile के लिए सबसे simple option Browserless' connection docs से direct WebSocket URL है।

Example:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Notes:

- `<BROWSERLESS_API_KEY>` को अपने real Browserless token से replace करें।
- वह region endpoint चुनें जो आपके Browserless account से match करता हो (उनके docs देखें)।
- यदि Browserless आपको HTTPS base URL देता है, तो आप direct CDP connection के लिए इसे
  `wss://` में convert कर सकते हैं या HTTPS URL को keep करके OpenClaw से
  `/json/version` discover करवा सकते हैं।

### उसी host पर Browserless Docker

जब Browserless Docker में self-hosted हो और OpenClaw host पर run करता हो, तो
Browserless को externally managed CDP service के रूप में treat करें:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` में address
OpenClaw process से reachable होना चाहिए। Browserless को matching reachable endpoint advertise भी करना चाहिए;
Browserless `EXTERNAL` को उसी public-to-OpenClaw WebSocket base पर set करें, जैसे
`ws://127.0.0.1:3000`, `ws://browserless:3000`, या stable private Docker
network address। यदि `/json/version` ऐसा `webSocketDebuggerUrl` return करता है जो ऐसे
address की ओर point करता है जिसे OpenClaw reach नहीं कर सकता, तो CDP HTTP healthy दिख सकता है जबकि WebSocket
attach फिर भी fail होता है।

Loopback Browserless profile के लिए `attachOnly` unset न छोड़ें। `attachOnly` के बिना,
OpenClaw loopback port को local managed browser
profile मानता है और report कर सकता है कि port use में है लेकिन OpenClaw के ownership में नहीं है।

## Direct WebSocket CDP providers

कुछ hosted browser services standard HTTP-based CDP discovery (`/json/version`) के बजाय
**direct WebSocket** endpoint expose करती हैं। OpenClaw तीन
CDP URL shapes accept करता है और सही connection strategy automatically चुनता है:

- **HTTP(S) discovery** - `http://host[:port]` या `https://host[:port]`।
  OpenClaw WebSocket debugger URL discover करने के लिए `/json/version` call करता है, फिर
  connect करता है। कोई WebSocket fallback नहीं।
- **Direct WebSocket endpoints** - `ws://host[:port]/devtools/<kind>/<id>` या
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  path के साथ `wss://...`। OpenClaw WebSocket handshake के माध्यम से सीधे connect करता है और
  `/json/version` को पूरी तरह skip करता है।
- **Bare WebSocket roots** - `ws://host[:port]` या बिना
  `/devtools/...` path के `wss://host[:port]` (जैसे [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com))। OpenClaw पहले HTTP
  `/json/version` discovery try करता है (scheme को `http`/`https` में normalise करते हुए);
  यदि discovery `webSocketDebuggerUrl` return करती है तो उसका उपयोग किया जाता है, अन्यथा OpenClaw
  bare root पर direct WebSocket handshake पर fallback करता है। यदि advertised
  WebSocket endpoint CDP handshake reject करता है लेकिन configured bare root
  उसे accept करता है, तो OpenClaw उस root पर भी fallback करता है। इससे local Chrome की ओर pointed bare `ws://`
  फिर भी connect हो सकता है, क्योंकि Chrome केवल `/json/version` से specific per-target path पर
  WebSocket upgrades accept करता है, जबकि hosted
  providers तब भी अपने root WebSocket endpoint का उपयोग कर सकते हैं जब उनका discovery
  endpoint short-lived URL advertise करता है जो Playwright CDP के लिए suitable नहीं है।

`openclaw browser doctor` runtime attach जैसी ही discovery-first, WebSocket-fallback
logic use करता है, इसलिए सफलतापूर्वक connect होने वाला bare-root URL diagnostics द्वारा
unreachable report नहीं किया जाता।

### Browserbase

[Browserbase](https://www.browserbase.com) cloud platform है जो built-in CAPTCHA solving, stealth mode, और residential
proxies के साथ headless browsers run करने के लिए है।

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

नोट्स:

- [साइन अप करें](https://www.browserbase.com/sign-up) और [ओवरव्यू डैशबोर्ड](https://www.browserbase.com/overview)
  से अपनी **API Key** कॉपी करें।
- `<BROWSERBASE_API_KEY>` को अपनी वास्तविक Browserbase API key से बदलें।
- Browserbase WebSocket कनेक्ट पर अपने-आप एक ब्राउज़र सत्र बनाता है, इसलिए
  मैन्युअल सत्र बनाने के चरण की आवश्यकता नहीं है।
- मुफ़्त टियर एक साथ एक सत्र और प्रति माह एक ब्राउज़र घंटा देता है।
  पेड प्लान सीमाओं के लिए [मूल्य निर्धारण](https://www.browserbase.com/pricing) देखें।
- पूर्ण API संदर्भ, SDK गाइड और इंटीग्रेशन उदाहरणों के लिए
  [Browserbase दस्तावेज़](https://docs.browserbase.com) देखें।

### Notte

[Notte](https://www.notte.cc) बिल्ट-इन स्टेल्थ, रेज़िडेंशियल प्रॉक्सी और CDP-नेटिव
WebSocket Gateway के साथ हेडलेस ब्राउज़र चलाने के लिए एक क्लाउड प्लेटफ़ॉर्म है।

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

नोट्स:

- [साइन अप करें](https://console.notte.cc) और कंसोल सेटिंग्स पेज से अपनी
  **API Key** कॉपी करें।
- `<NOTTE_API_KEY>` को अपनी वास्तविक Notte API key से बदलें।
- Notte WebSocket कनेक्ट पर अपने-आप एक ब्राउज़र सत्र बनाता है, इसलिए मैन्युअल
  सत्र बनाने के चरण की आवश्यकता नहीं है। WebSocket डिस्कनेक्ट होने पर सत्र नष्ट कर दिया जाता है।
- मुफ़्त टियर एक साथ पाँच सत्र और कुल 100 ब्राउज़र घंटे देता है।
  पेड प्लान सीमाओं के लिए [मूल्य निर्धारण](https://www.notte.cc/#pricing) देखें।
- पूर्ण API संदर्भ, SDK गाइड और इंटीग्रेशन उदाहरणों के लिए
  [Notte दस्तावेज़](https://docs.notte.cc) देखें।

## सुरक्षा

मुख्य विचार:

- ब्राउज़र नियंत्रण केवल loopback तक सीमित है; पहुंच Gateway के auth या node pairing से होकर जाती है।
- स्टैंडअलोन loopback ब्राउज़र HTTP API **केवल shared-secret auth** का उपयोग करता है:
  gateway token bearer auth, `x-openclaw-password`, या कॉन्फ़िगर किए गए gateway password के साथ HTTP Basic auth।
- Tailscale Serve identity headers और `gateway.auth.mode: "trusted-proxy"` इस
  स्टैंडअलोन loopback ब्राउज़र API को प्रमाणित **नहीं** करते।
- यदि ब्राउज़र नियंत्रण सक्षम है और कोई shared-secret auth कॉन्फ़िगर नहीं है, तो OpenClaw
  उस स्टार्टअप के लिए केवल रनटाइम gateway token जनरेट करता है। यदि क्लाइंट्स को
  रीस्टार्ट के बीच स्थिर secret चाहिए, तो `gateway.auth.token`, `gateway.auth.password`,
  `OPENCLAW_GATEWAY_TOKEN`, या `OPENCLAW_GATEWAY_PASSWORD` को स्पष्ट रूप से कॉन्फ़िगर करें।
- जब `gateway.auth.mode` पहले से `password`, `none`, या `trusted-proxy` हो, तो OpenClaw
  वह token अपने-आप जनरेट **नहीं** करता।
- Gateway और किसी भी node host को निजी नेटवर्क (Tailscale) पर रखें; सार्वजनिक एक्सपोज़र से बचें।
- रिमोट CDP URLs/tokens को secrets की तरह मानें; env vars या secrets manager को प्राथमिकता दें।

रिमोट CDP सुझाव:

- जहाँ संभव हो, एन्क्रिप्टेड endpoints (HTTPS या WSS) और कम अवधि वाले tokens को प्राथमिकता दें।
- लंबे समय तक चलने वाले tokens को सीधे config फ़ाइलों में एम्बेड करने से बचें।

## प्रोफ़ाइलें (मल्टी-ब्राउज़र)

OpenClaw कई नामित प्रोफ़ाइलों (रूटिंग configs) का समर्थन करता है। प्रोफ़ाइलें हो सकती हैं:

- **openclaw-managed**: अपने user data directory + CDP port के साथ एक समर्पित Chromium-आधारित ब्राउज़र instance
- **remote**: एक स्पष्ट CDP URL (कहीं और चल रहा Chromium-आधारित ब्राउज़र)
- **existing session**: Chrome DevTools MCP auto-connect के ज़रिए आपकी मौजूदा Chrome profile

डिफ़ॉल्ट्स:

- `openclaw` प्रोफ़ाइल गुम होने पर अपने-आप बनाई जाती है।
- `user` प्रोफ़ाइल Chrome MCP existing-session attach के लिए बिल्ट-इन है।
- Existing-session प्रोफ़ाइलें `user` से आगे opt-in हैं; उन्हें `--driver existing-session` के साथ बनाएं।
- स्थानीय CDP ports डिफ़ॉल्ट रूप से **18800-18899** से आवंटित होते हैं।
- किसी प्रोफ़ाइल को हटाने पर उसकी स्थानीय data directory Trash में चली जाती है।

सभी control endpoints `?profile=<name>` स्वीकार करते हैं; CLI `--browser-profile` का उपयोग करता है।

## Chrome DevTools MCP के ज़रिए मौजूदा सत्र

OpenClaw आधिकारिक Chrome DevTools MCP server के ज़रिए चल रही Chromium-आधारित
ब्राउज़र profile से भी attach कर सकता है। यह उस ब्राउज़र profile में पहले से खुले
tabs और login state का पुनः उपयोग करता है।

आधिकारिक पृष्ठभूमि और setup संदर्भ:

- [Chrome for Developers: अपने browser session के साथ Chrome DevTools MCP का उपयोग करें](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

बिल्ट-इन प्रोफ़ाइल:

- `user`

वैकल्पिक: यदि आप अलग नाम, रंग या browser data directory चाहते हैं, तो अपनी कस्टम existing-session profile बनाएं।

डिफ़ॉल्ट व्यवहार:

- बिल्ट-इन `user` प्रोफ़ाइल Chrome MCP auto-connect का उपयोग करती है, जो
  डिफ़ॉल्ट स्थानीय Google Chrome profile को target करता है।

Brave, Edge, Chromium, या non-default Chrome profile के लिए `userDataDir` का उपयोग करें।
`~` आपके OS home directory तक expand होता है:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

फिर मिलते-जुलते ब्राउज़र में:

1. remote debugging के लिए उस ब्राउज़र का inspect page खोलें।
2. remote debugging सक्षम करें।
3. ब्राउज़र चलता रहने दें और OpenClaw के attach होने पर connection prompt को approve करें।

सामान्य inspect pages:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live attach smoke test:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

सफलता कैसी दिखती है:

- `status` दिखाता है `driver: existing-session`
- `status` दिखाता है `transport: chrome-mcp`
- `status` दिखाता है `running: true`
- `tabs` आपके पहले से खुले browser tabs सूचीबद्ध करता है
- `snapshot` चयनित live tab से refs लौटाता है

यदि attach काम नहीं करता, तो क्या जाँचें:

- target Chromium-आधारित ब्राउज़र version `144+` है
- उस ब्राउज़र के inspect page में remote debugging सक्षम है
- ब्राउज़र ने attach consent prompt दिखाया और आपने उसे स्वीकार किया
- यदि Chrome को स्पष्ट `--remote-debugging-port` के साथ शुरू किया गया था, तो
  Chrome MCP auto-connect पर निर्भर रहने के बजाय `browser.profiles.<name>.cdpUrl`
  को उस DevTools endpoint पर सेट करें
- `openclaw doctor` पुराने extension-आधारित browser config को migrate करता है और
  default auto-connect profiles के लिए जाँचता है कि Chrome स्थानीय रूप से installed है,
  लेकिन यह आपकी ओर से browser-side remote debugging सक्षम नहीं कर सकता

Agent उपयोग:

- जब आपको उपयोगकर्ता की logged-in browser state चाहिए, तो `profile="user"` का उपयोग करें।
- यदि आप custom existing-session profile का उपयोग करते हैं, तो वह स्पष्ट profile name pass करें।
- यह mode केवल तब चुनें जब उपयोगकर्ता attach prompt approve करने के लिए कंप्यूटर पर हो।
- Gateway या node host `npx chrome-devtools-mcp@latest --autoConnect` spawn कर सकता है

नोट्स:

- यह path isolated `openclaw` profile से अधिक जोखिम वाला है क्योंकि यह आपके signed-in browser session के अंदर कार्य कर सकता है।
- OpenClaw इस driver के लिए ब्राउज़र launch नहीं करता; यह केवल attach करता है।
- OpenClaw यहाँ आधिकारिक Chrome DevTools MCP `--autoConnect` flow का उपयोग करता है। यदि
  `userDataDir` सेट है, तो उसे उस user data directory को target करने के लिए pass through किया जाता है।
- Existing-session चयनित host पर या connected browser node के ज़रिए attach कर सकता है।
  यदि Chrome कहीं और है और कोई browser node connected नहीं है, तो remote CDP या node host का उपयोग करें।

### कस्टम Chrome MCP launch

जब डिफ़ॉल्ट `npx chrome-devtools-mcp@latest` flow आपकी आवश्यकता का न हो
(offline hosts, pinned versions, vendored binaries), तो प्रति profile spawned Chrome DevTools MCP server override करें:

| फ़ील्ड       | यह क्या करता है                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` के बजाय spawn करने वाला executable। जैसा है वैसा resolve होता है; absolute paths मान्य हैं।                         |
| `mcpArgs`    | `mcpCommand` को verbatim pass की गई argument array। डिफ़ॉल्ट `chrome-devtools-mcp@latest --autoConnect` arguments को बदलती है। |

जब existing-session profile पर `cdpUrl` सेट होता है, OpenClaw
`--autoConnect` छोड़ देता है और endpoint को अपने-आप Chrome MCP को forward करता है:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP discovery endpoint)।
- `ws(s)://...` → `--wsEndpoint <url>` (direct CDP WebSocket)।

Endpoint flags और `userDataDir` को मिलाया नहीं जा सकता: जब `cdpUrl` सेट होता है,
Chrome MCP launch के लिए `userDataDir` ignored होता है, क्योंकि Chrome MCP profile
directory खोलने के बजाय endpoint के पीछे चल रहे ब्राउज़र से attach करता है।

<Accordion title="Existing-session सुविधा सीमाएँ">

managed `openclaw` profile की तुलना में, existing-session drivers अधिक सीमित हैं:

- **स्क्रीनशॉट** - page captures और `--ref` element captures काम करते हैं; CSS `--element` selectors नहीं। `--full-page` को `--ref` या `--element` के साथ नहीं मिलाया जा सकता। page या ref-based element screenshots के लिए Playwright आवश्यक नहीं है।
- **Actions** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, और `select` को snapshot refs चाहिए (CSS selectors नहीं)। `click-coords` visible viewport coordinates पर क्लिक करता है और snapshot ref की आवश्यकता नहीं होती। `click` केवल left-button है। `type` `slowly=true` का समर्थन नहीं करता; `fill` या `press` का उपयोग करें। `press` `delayMs` का समर्थन नहीं करता। `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, और `evaluate` per-call timeouts का समर्थन नहीं करते। `select` एक single value स्वीकार करता है।
- **Wait / upload / dialog** - `wait --url` exact, substring, और glob patterns का समर्थन करता है; `wait --load networkidle` existing-session profiles पर समर्थित नहीं है (यह managed और raw/remote CDP profiles पर काम करता है)। Upload hooks को `ref` या `inputRef` चाहिए, एक बार में एक file, कोई CSS `element` नहीं। Dialog hooks timeout overrides या `dialogId` का समर्थन नहीं करते।
- **Dialog visibility** - Managed browser action responses में `blockedByDialog` और `browserState.dialogs.pending` शामिल होते हैं जब कोई action modal dialog खोलता है; snapshots में भी pending dialog state शामिल होती है। Dialog pending होने पर `browser dialog --accept/--dismiss --dialog-id <id>` से respond करें। OpenClaw के बाहर handle किए गए dialogs `browserState.dialogs.recent` के अंतर्गत दिखाई देते हैं।
- **केवल managed features** - batch actions, PDF export, download interception, और `responsebody` के लिए अभी भी managed browser path चाहिए।

</Accordion>

## Isolation guarantees

- **समर्पित user data dir**: आपकी personal browser profile को कभी नहीं छूता।
- **समर्पित ports**: dev workflows के साथ collisions रोकने के लिए `9222` से बचता है।
- **Deterministic tab control**: `tabs` पहले `suggestedTargetId` लौटाता है, फिर
  stable `tabId` handles जैसे `t1`, optional labels, और raw `targetId`।
  Agents को `suggestedTargetId` का पुनः उपयोग करना चाहिए; raw ids debugging और compatibility के लिए उपलब्ध रहते हैं।

## ब्राउज़र चयन

स्थानीय रूप से launch करते समय, OpenClaw पहले उपलब्ध विकल्प को चुनता है:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

आप `browser.executablePath` से override कर सकते हैं।

प्लेटफ़ॉर्म:

- macOS: `/Applications` और `~/Applications` जाँचता है।
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, और
  `/usr/lib/chromium-browser` के अंतर्गत सामान्य Chrome/Brave/Edge/Chromium locations,
  साथ ही `PLAYWRIGHT_BROWSERS_PATH` या `~/.cache/ms-playwright` के अंतर्गत
  Playwright-managed Chromium जाँचता है।
- Windows: सामान्य install locations जाँचता है।

## Control API (वैकल्पिक)

scripting और debugging के लिए, Gateway एक छोटा **केवल loopback HTTP
control API** और matching `openclaw browser` CLI expose करता है (snapshots, refs, wait
power-ups, JSON output, debug workflows)। पूर्ण reference के लिए
[Browser control API](/hi/tools/browser-control) देखें।

## समस्या निवारण

Linux-विशिष्ट समस्याओं (विशेषकर snap Chromium) के लिए, देखें
[ब्राउज़र समस्या-निवारण](/hi/tools/browser-linux-troubleshooting).

WSL2 Gateway + Windows Chrome split-host सेटअप के लिए, देखें
[WSL2 + Windows + remote Chrome CDP समस्या-निवारण](/hi/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP स्टार्टअप विफलता बनाम नेविगेशन SSRF ब्लॉक

ये अलग-अलग विफलता वर्ग हैं और अलग-अलग कोड पथों की ओर संकेत करते हैं।

- **CDP स्टार्टअप या तत्परता विफलता** का अर्थ है कि OpenClaw यह पुष्टि नहीं कर सकता कि ब्राउज़र नियंत्रण तल स्वस्थ है।
- **नेविगेशन SSRF ब्लॉक** का अर्थ है कि ब्राउज़र नियंत्रण तल स्वस्थ है, लेकिन पेज नेविगेशन लक्ष्य नीति द्वारा अस्वीकार किया गया है।

सामान्य उदाहरण:

- CDP स्टार्टअप या तत्परता विफलता:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` जब कोई
    loopback बाहरी CDP सेवा `attachOnly: true` के बिना कॉन्फ़िगर की जाती है
- नेविगेशन SSRF ब्लॉक:
  - `open`, `navigate`, स्नैपशॉट, या टैब खोलने वाले फ्लो ब्राउज़र/नेटवर्क नीति त्रुटि के साथ विफल होते हैं जबकि `start` और `tabs` फिर भी काम करते हैं

दोनों को अलग करने के लिए इस न्यूनतम क्रम का उपयोग करें:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

परिणामों को कैसे पढ़ें:

- यदि `start` `not reachable after start` के साथ विफल होता है, तो पहले CDP तत्परता का समस्या-निवारण करें।
- यदि `start` सफल होता है लेकिन `tabs` विफल होता है, तो नियंत्रण तल अभी भी अस्वस्थ है। इसे पेज-नेविगेशन समस्या नहीं, बल्कि CDP पहुँचयोग्यता समस्या मानें।
- यदि `start` और `tabs` सफल होते हैं लेकिन `open` या `navigate` विफल होता है, तो ब्राउज़र नियंत्रण तल चालू है और विफलता नेविगेशन नीति या लक्ष्य पेज में है।
- यदि `start`, `tabs`, और `open` सभी सफल होते हैं, तो बुनियादी प्रबंधित-ब्राउज़र नियंत्रण पथ स्वस्थ है।

महत्वपूर्ण व्यवहार विवरण:

- ब्राउज़र कॉन्फ़िग डिफ़ॉल्ट रूप से fail-closed SSRF नीति ऑब्जेक्ट पर रहता है, भले ही आप `browser.ssrfPolicy` कॉन्फ़िगर न करें।
- local loopback `openclaw` प्रबंधित प्रोफ़ाइल के लिए, CDP स्वास्थ्य जाँचें OpenClaw के अपने स्थानीय नियंत्रण तल के लिए ब्राउज़र SSRF पहुँचयोग्यता प्रवर्तन को जानबूझकर छोड़ देती हैं।
- नेविगेशन सुरक्षा अलग है। सफल `start` या `tabs` परिणाम का अर्थ यह नहीं है कि बाद का `open` या `navigate` लक्ष्य अनुमत है।

सुरक्षा मार्गदर्शन:

- डिफ़ॉल्ट रूप से ब्राउज़र SSRF नीति को **शिथिल न करें**।
- व्यापक निजी-नेटवर्क पहुँच की तुलना में `hostnameAllowlist` या `allowedHostnames` जैसे संकीर्ण होस्ट अपवादों को प्राथमिकता दें।
- `dangerouslyAllowPrivateNetwork: true` का उपयोग केवल जानबूझकर विश्वसनीय परिवेशों में करें जहाँ निजी-नेटवर्क ब्राउज़र पहुँच आवश्यक हो और समीक्षा की गई हो।

## एजेंट टूल्स + नियंत्रण कैसे काम करता है

एजेंट को ब्राउज़र ऑटोमेशन के लिए **एक टूल** मिलता है:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

यह कैसे मैप होता है:

- `browser snapshot` एक स्थिर UI ट्री (AI या ARIA) लौटाता है।
- `browser act` क्लिक/टाइप/ड्रैग/सेलेक्ट करने के लिए स्नैपशॉट `ref` ID का उपयोग करता है।
- `browser screenshot` पिक्सेल कैप्चर करता है (पूरा पेज, एलिमेंट, या लेबल किए गए refs)।
- `browser doctor` Gateway, Plugin, प्रोफ़ाइल, ब्राउज़र, और टैब तत्परता की जाँच करता है।
- `browser` स्वीकार करता है:
  - नामित ब्राउज़र प्रोफ़ाइल (openclaw, chrome, या remote CDP) चुनने के लिए `profile`।
  - ब्राउज़र कहाँ रहता है यह चुनने के लिए `target` (`sandbox` | `host` | `node`)।
  - sandboxed सत्रों में, `target: "host"` के लिए `agents.defaults.sandbox.browser.allowHostControl=true` आवश्यक है।
  - यदि `target` छोड़ा गया है: sandboxed सत्र डिफ़ॉल्ट रूप से `sandbox` पर जाते हैं, non-sandbox सत्र डिफ़ॉल्ट रूप से `host` पर जाते हैं।
  - यदि कोई browser-capable node कनेक्टेड है, तो टूल उस पर auto-route कर सकता है जब तक आप `target="host"` या `target="node"` पिन न करें।

यह एजेंट को deterministic रखता है और brittle selectors से बचाता है।

## संबंधित

- [टूल्स ओवरव्यू](/hi/tools) - सभी उपलब्ध एजेंट टूल
- [सैंडबॉक्सिंग](/hi/gateway/sandboxing) - sandboxed परिवेशों में ब्राउज़र नियंत्रण
- [सुरक्षा](/hi/gateway/security) - ब्राउज़र नियंत्रण जोखिम और hardening
