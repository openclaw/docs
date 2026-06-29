---
read_when:
    - आप चाहते हैं कि एक OpenClaw एजेंट Google Meet कॉल में शामिल हो
    - आप चाहते हैं कि एक OpenClaw एजेंट एक नई Google Meet कॉल बनाए
    - आप Chrome, Chrome नोड, या Twilio को Google Meet ट्रांसपोर्ट के रूप में कॉन्फ़िगर कर रहे हैं
summary: 'Google Meet Plugin: Chrome या Twilio के माध्यम से स्पष्ट Meet URL से जुड़ें, एजेंट टॉक-बैक डिफ़ॉल्ट के साथ'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-06-28T23:36:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw के लिए Google Meet प्रतिभागी समर्थन — Plugin जानबूझकर स्पष्ट है:

- यह केवल स्पष्ट `https://meet.google.com/...` URL में शामिल होता है।
- यह Google Meet API के ज़रिए एक नया Meet स्पेस बना सकता है, फिर लौटाए गए
  URL में शामिल हो सकता है।
- `agent` डिफ़ॉल्ट टॉक-बैक मोड है: रियलटाइम ट्रांसक्रिप्शन सुनता है,
  कॉन्फ़िगर किया गया OpenClaw एजेंट जवाब देता है, और नियमित OpenClaw TTS Meet में बोलता है।
- `bidi` fallback सीधे रियलटाइम वॉइस मॉडल मोड के रूप में उपलब्ध रहता है।
- एजेंट `mode` के साथ शामिल होने का व्यवहार चुनते हैं: लाइव
  सुनने/टॉक-बैक के लिए `agent`, सीधे रियलटाइम वॉइस fallback के लिए `bidi`, या टॉक-बैक ब्रिज के बिना
  ब्राउज़र में शामिल/नियंत्रित करने के लिए `transcribe` उपयोग करें।
- Auth व्यक्तिगत Google OAuth या पहले से साइन-इन Chrome प्रोफ़ाइल के रूप में शुरू होता है।
- कोई स्वचालित सहमति घोषणा नहीं है।
- डिफ़ॉल्ट Chrome ऑडियो बैकएंड `BlackHole 2ch` है।
- Chrome स्थानीय रूप से या paired node host पर चल सकता है।
- Twilio डायल-इन नंबर के साथ वैकल्पिक PIN या DTMF sequence स्वीकार करता है; यह
  Meet URL को सीधे डायल नहीं कर सकता।
- CLI कमांड `googlemeet` है; `meet` व्यापक एजेंट
  टेलीकॉन्फ़्रेंस वर्कफ़्लो के लिए आरक्षित है।

## त्वरित शुरुआत

स्थानीय ऑडियो dependencies इंस्टॉल करें और रियलटाइम ट्रांसक्रिप्शन
provider तथा नियमित OpenClaw TTS कॉन्फ़िगर करें। OpenAI डिफ़ॉल्ट ट्रांसक्रिप्शन
provider है; Google Gemini Live अलग `bidi` वॉइस fallback के रूप में भी काम करता है
`realtime.voiceProvider: "google"` के साथ:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` `BlackHole 2ch` वर्चुअल ऑडियो डिवाइस इंस्टॉल करता है। Homebrew के
installer को macOS द्वारा डिवाइस दिखाने से पहले reboot चाहिए:

```bash
sudo reboot
```

Reboot के बाद, दोनों हिस्से सत्यापित करें:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin सक्षम करें:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Setup जांचें:

```bash
openclaw googlemeet setup
```

Setup आउटपुट एजेंट-पठनीय और mode-aware होने के लिए बनाया गया है। यह Chrome
profile, node pinning, और, रियलटाइम Chrome joins के लिए, BlackHole/SoX audio
bridge तथा delayed realtime intro checks रिपोर्ट करता है। Observe-only joins के लिए, वही
transport `--mode transcribe` के साथ जांचें; वह मोड realtime audio prerequisites छोड़ देता है
क्योंकि यह bridge के ज़रिए न सुनता है न बोलता है:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

जब Twilio delegation कॉन्फ़िगर हो, setup यह भी रिपोर्ट करता है कि
`voice-call` Plugin, Twilio credentials, और public Webhook exposure तैयार हैं या नहीं।
Agent को join करने के लिए कहने से पहले किसी भी `ok: false` check को checked transport और mode
के लिए blocker मानें। Scripts या machine-readable output के लिए `openclaw googlemeet setup --json` उपयोग करें।
किसी specific transport को agent द्वारा try करने से पहले preflight करने के लिए `--transport chrome`,
`--transport chrome-node`, या `--transport twilio` उपयोग करें।

Twilio के लिए, जब default transport Chrome हो तो हमेशा transport को स्पष्ट रूप से preflight करें:

```bash
openclaw googlemeet setup --transport twilio
```

यह agent द्वारा meeting dial करने की कोशिश से पहले missing `voice-call` wiring,
Twilio credentials, या unreachable Webhook exposure पकड़ता है।

Meeting में शामिल हों:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

या agent को `google_meet` tool के ज़रिए join करने दें:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Agent-facing `google_meet` tool artifact, calendar, setup, transcribe, Twilio,
और `chrome-node` flows के लिए non-macOS hosts पर उपलब्ध रहता है। Local
Chrome talk-back actions वहाँ blocked हैं क्योंकि bundled Chrome audio path
फ़िलहाल macOS `BlackHole 2ch` पर निर्भर है। Linux पर, Chrome talk-back
participation के लिए `mode: "transcribe"`, Twilio dial-in, या macOS `chrome-node` host उपयोग करें।

नई meeting बनाएँ और उसमें शामिल हों:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API-created rooms के लिए, जब आप room की no-knock policy को Google
account defaults से inherit करने के बजाय स्पष्ट बनाना चाहते हों, Google Meet `SpaceConfig.accessType` उपयोग करें:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` Meet URL वाले किसी भी व्यक्ति को knocking के बिना join करने देता है। `TRUSTED` host
organization के trusted users, invited external users, और dial-in users को
knocking के बिना join करने देता है। `RESTRICTED` no-knock entry को invitees तक सीमित करता है। ये
settings केवल official Google Meet API creation path पर लागू होती हैं, इसलिए OAuth
credentials कॉन्फ़िगर होने चाहिए।

यदि आपने यह option उपलब्ध होने से पहले Google Meet authenticate किया था, तो अपनी Google OAuth consent screen में
`meetings.space.settings` scope जोड़ने के बाद
`openclaw googlemeet auth login --json` फिर से चलाएँ।

केवल URL बनाएँ, join न करें:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` के दो paths हैं:

- API create: जब Google Meet OAuth credentials कॉन्फ़िगर हों तब उपयोग होता है। यह
  सबसे deterministic path है और browser UI state पर निर्भर नहीं करता।
- Browser fallback: जब OAuth credentials अनुपस्थित हों तब उपयोग होता है। OpenClaw
  pinned Chrome node उपयोग करता है, `https://meet.google.com/new` खोलता है, Google द्वारा
  real meeting-code URL पर redirect करने की प्रतीक्षा करता है, फिर वह URL लौटाता है। इस path के लिए
  node पर OpenClaw Chrome profile का Google में पहले से signed in होना आवश्यक है।
  Browser automation Meet के अपने first-run microphone prompt को handle करता है; उस prompt
  को Google login failure नहीं माना जाता।
  Join और create flows नया खोलने से पहले existing Meet tab को reuse करने की भी कोशिश करते हैं।
  Matching `authuser` जैसी harmless URL query strings को ignore करता है, इसलिए
  agent retry को second Chrome tab बनाने के बजाय already-open meeting पर focus करना चाहिए।

Command/tool output में `source` field (`api` या `browser`) शामिल होता है ताकि agents
बता सकें कि कौन सा path उपयोग हुआ। `create` डिफ़ॉल्ट रूप से new meeting join करता है और
`joined: true` plus join session लौटाता है। केवल URL mint करने के लिए, CLI पर
`create --no-join` उपयोग करें या tool को `"join": false` pass करें।

या agent से कहें: "Google Meet बनाएँ, agent talk-back mode के साथ join करें,
और मुझे link भेजें।" Agent को `action: "create"` के साथ `google_meet` call करना चाहिए
और फिर लौटाया गया `meetingUri` share करना चाहिए।

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Observe-only/browser-control join के लिए, `"mode": "transcribe"` set करें। यह
duplex realtime voice bridge start नहीं करता, BlackHole या SoX की आवश्यकता नहीं रखता,
और meeting में talk back नहीं करेगा। इस mode में Chrome joins
OpenClaw के microphone/camera permission grant और Meet **Use
microphone** path से भी बचते हैं। यदि Meet audio-choice interstitial दिखाता है, automation
no-microphone path आज़माता है और अन्यथा local microphone खोलने के बजाय
manual action report करता है। Transcribe mode में, managed Chrome transports
best-effort Meet caption observer भी install करते हैं। `googlemeet status --json` और
`googlemeet doctor` `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
और छोटा `recentTranscript` tail दिखाते हैं ताकि operators बता सकें कि browser
call में शामिल हुआ या नहीं और Meet captions text produce कर रहे हैं या नहीं।
जब आपको yes/no probe चाहिए तो `openclaw googlemeet test-listen <meet-url> --transport chrome-node` उपयोग करें:
यह transcribe mode में join करता है, fresh caption या transcript movement की प्रतीक्षा करता है,
और `listenVerified`, `listenTimedOut`, manual
action fields, तथा latest caption health लौटाता है।

Realtime sessions के दौरान, `google_meet` status में browser और audio bridge
health शामिल होती है जैसे `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, last input/output
timestamps, byte counters, और bridge closed state। यदि safe Meet page prompt
दिखता है, browser automation जब कर सकता है तब उसे handle करता है। Login, host admission, और
browser/OS permission prompts agent द्वारा relay करने के लिए reason और
message सहित manual action के रूप में report होते हैं। Managed Chrome sessions केवल तब intro या
test phrase emit करते हैं जब browser health `inCall: true` report करती है; अन्यथा status
`speechReady: false` report करता है और speech attempt को यह pretend करने के बजाय block कर दिया जाता है
कि agent ने meeting में बोला।

Local Chrome joins signed-in OpenClaw browser profile के ज़रिए होते हैं। Realtime mode को
OpenClaw द्वारा उपयोग किए जाने वाले microphone/speaker path के लिए `BlackHole 2ch` चाहिए। साफ़
duplex audio के लिए, separate virtual devices या Loopback-style graph उपयोग करें; एक
single BlackHole device पहले smoke test के लिए पर्याप्त है लेकिन echo कर सकता है।

### Local gateway + Parallels Chrome

सिर्फ VM को Chrome own कराने के लिए macOS VM के अंदर full OpenClaw Gateway या model API key
की आवश्यकता **नहीं** है। Gateway और agent locally चलाएँ, फिर VM में
node host चलाएँ। VM पर bundled Plugin एक बार enable करें ताकि node
Chrome command advertise करे:

कहाँ क्या चलता है:

- Gateway host: OpenClaw Gateway, agent workspace, model/API keys, realtime
  provider, और Google Meet Plugin config।
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch,
  और Google में signed in Chrome profile।
- VM में आवश्यक नहीं: Gateway service, agent config, OpenAI/GPT key, या model
  provider setup।

VM dependencies इंस्टॉल करें:

```bash
brew install blackhole-2ch sox
```

BlackHole इंस्टॉल करने के बाद VM reboot करें ताकि macOS `BlackHole 2ch` expose करे:

```bash
sudo reboot
```

Reboot के बाद, verify करें कि VM audio device और SoX commands देख सकता है:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM में OpenClaw install या update करें, फिर वहाँ bundled Plugin enable करें:

```bash
openclaw plugins enable google-meet
```

VM में node host start करें:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

यदि `<gateway-host>` LAN IP है और आप TLS use नहीं कर रहे, तो node plaintext WebSocket को refuse करता है
जब तक आप उस trusted private network के लिए opt in न करें:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node को LaunchAgent के रूप में install करते समय वही environment variable उपयोग करें:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` process environment है, कोई
`openclaw.json` setting नहीं। `openclaw node install` इसे LaunchAgent
environment में store करता है जब यह install command पर present होता है।

Gateway host से node approve करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirm करें कि Gateway node देखता है और यह `googlemeet.chrome`
तथा browser capability/`browser.proxy` दोनों advertise करता है:

```bash
openclaw nodes status
```

Gateway host पर Meet को उस node के ज़रिए route करें:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

अब Gateway host से सामान्य रूप से join करें:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

या agent से `transport: "chrome-node"` के साथ `google_meet` tool उपयोग करने को कहें।

एक-command smoke test के लिए जो session create या reuse करता है, known
phrase बोलता है, और session health print करता है:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

रीयलटाइम जॉइन के दौरान, OpenClaw ब्राउज़र ऑटोमेशन अतिथि नाम भरता है, Join/Ask to join पर क्लिक करता है, और वह प्रॉम्प्ट दिखाई देने पर Meet की पहली बार वाली "Use microphone" पसंद स्वीकार करता है। observe-only जॉइन या browser-only मीटिंग निर्माण के दौरान, जब वह विकल्प उपलब्ध होता है, तो यह बिना माइक्रोफ़ोन उसी प्रॉम्प्ट से आगे बढ़ता है। यदि ब्राउज़र प्रोफ़ाइल साइन इन नहीं है, Meet होस्ट अनुमति की प्रतीक्षा कर रहा है, Chrome को रीयलटाइम जॉइन के लिए माइक्रोफ़ोन/कैमरा अनुमति चाहिए, या Meet ऐसे प्रॉम्प्ट पर अटका है जिसे ऑटोमेशन हल नहीं कर सका, तो join/test-speech परिणाम `manualActionRequired: true` को `manualActionReason` और `manualActionMessage` के साथ रिपोर्ट करता है। Agents को जॉइन फिर से आज़माना बंद करना चाहिए, उस सटीक संदेश के साथ वर्तमान `browserUrl`/`browserTitle` रिपोर्ट करना चाहिए, और केवल मैनुअल ब्राउज़र कार्रवाई पूरी होने के बाद फिर से प्रयास करना चाहिए।

यदि `chromeNode.node` छोड़ा गया है, तो OpenClaw केवल तब अपने-आप चयन करता है जब ठीक एक कनेक्टेड नोड `googlemeet.chrome` और ब्राउज़र नियंत्रण दोनों विज्ञापित करता हो। यदि कई सक्षम नोड कनेक्टेड हैं, तो `chromeNode.node` को नोड आईडी, प्रदर्शन नाम, या रिमोट IP पर सेट करें।

सामान्य विफलता जांचें:

- `Configured Google Meet node ... is not usable: offline`: पिन किया गया नोड Gateway को ज्ञात है लेकिन अनुपलब्ध है। Agents को उस नोड को निदान स्थिति मानना चाहिए, उपयोग योग्य Chrome होस्ट नहीं, और किसी अन्य ट्रांसपोर्ट पर वापस जाने के बजाय सेटअप अवरोधक रिपोर्ट करना चाहिए, जब तक कि उपयोगकर्ता ने ऐसा करने को न कहा हो।
- `No connected Google Meet-capable node`: VM में `openclaw node run` शुरू करें, पेयरिंग स्वीकृत करें, और सुनिश्चित करें कि VM में `openclaw plugins enable google-meet` और `openclaw plugins enable browser` चलाए गए थे। यह भी पुष्टि करें कि Gateway होस्ट दोनों नोड कमांड को `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` के साथ अनुमति देता है।
- `BlackHole 2ch audio device not found`: जांचे जा रहे होस्ट पर `blackhole-2ch` इंस्टॉल करें और local Chrome ऑडियो का उपयोग करने से पहले रीबूट करें।
- `BlackHole 2ch audio device not found on the node`: VM में `blackhole-2ch` इंस्टॉल करें और VM को रीबूट करें।
- Chrome खुलता है लेकिन जॉइन नहीं कर सकता: VM के अंदर ब्राउज़र प्रोफ़ाइल में साइन इन करें, या अतिथि जॉइन के लिए `chrome.guestName` सेट रखें। अतिथि auto-join नोड ब्राउज़र प्रॉक्सी के माध्यम से OpenClaw ब्राउज़र ऑटोमेशन का उपयोग करता है; सुनिश्चित करें कि नोड ब्राउज़र कॉन्फ़िग उस प्रोफ़ाइल की ओर इंगित करता है जिसे आप चाहते हैं, उदाहरण के लिए `browser.defaultProfile: "user"` या नामित existing-session प्रोफ़ाइल।
- डुप्लिकेट Meet टैब: `chrome.reuseExistingTab: true` सक्षम छोड़ें। OpenClaw नया टैब खोलने से पहले उसी Meet URL के लिए मौजूदा टैब सक्रिय करता है, और ब्राउज़र मीटिंग निर्माण दूसरा टैब खोलने से पहले प्रगति में मौजूद `https://meet.google.com/new` या Google खाता प्रॉम्प्ट टैब का पुनः उपयोग करता है।
- ऑडियो नहीं: Meet में, माइक्रोफ़ोन/स्पीकर को OpenClaw द्वारा उपयोग किए गए वर्चुअल ऑडियो डिवाइस पथ से रूट करें; साफ़ डुप्लेक्स ऑडियो के लिए अलग वर्चुअल डिवाइस या Loopback-शैली रूटिंग का उपयोग करें।

## इंस्टॉल नोट्स

Chrome talk-back डिफ़ॉल्ट दो बाहरी टूल का उपयोग करता है:

- `sox`: कमांड-लाइन ऑडियो उपयोगिता। Plugin डिफ़ॉल्ट 24 kHz PCM16 ऑडियो ब्रिज के लिए स्पष्ट CoreAudio डिवाइस कमांड का उपयोग करता है।
- `blackhole-2ch`: macOS वर्चुअल ऑडियो ड्राइवर। यह `BlackHole 2ch` ऑडियो डिवाइस बनाता है जिससे Chrome/Meet रूट कर सकते हैं।

OpenClaw इनमें से किसी भी पैकेज को बंडल या पुनर्वितरित नहीं करता। दस्तावेज़ उपयोगकर्ताओं से उन्हें Homebrew के माध्यम से होस्ट निर्भरता के रूप में इंस्टॉल करने को कहते हैं। SoX `LGPL-2.0-only AND GPL-2.0-only` के तहत लाइसेंस प्राप्त है; BlackHole GPL-3.0 है। यदि आप ऐसा इंस्टॉलर या appliance बनाते हैं जो BlackHole को OpenClaw के साथ बंडल करता है, तो BlackHole की upstream लाइसेंसिंग शर्तों की समीक्षा करें या Existential Audio से अलग लाइसेंस प्राप्त करें।

## ट्रांसपोर्ट

### Chrome

Chrome ट्रांसपोर्ट OpenClaw ब्राउज़र नियंत्रण के माध्यम से Meet URL खोलता है और साइन-इन किए गए OpenClaw ब्राउज़र प्रोफ़ाइल के रूप में जॉइन करता है। macOS पर, Plugin लॉन्च से पहले `BlackHole 2ch` की जांच करता है। यदि कॉन्फ़िगर किया गया हो, तो यह Chrome खोलने से पहले ऑडियो ब्रिज health कमांड और startup कमांड भी चलाता है। जब Chrome/ऑडियो Gateway होस्ट पर हों तो `chrome` का उपयोग करें; जब Chrome/ऑडियो किसी paired node जैसे Parallels macOS VM पर हों तो `chrome-node` का उपयोग करें। local Chrome के लिए, `browser.defaultProfile` से प्रोफ़ाइल चुनें; `chrome.browserProfile` को `chrome-node` होस्ट को पास किया जाता है।

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome माइक्रोफ़ोन और स्पीकर ऑडियो को local OpenClaw ऑडियो ब्रिज से रूट करें। यदि `BlackHole 2ch` इंस्टॉल नहीं है, तो जॉइन बिना ऑडियो पथ के चुपचाप जॉइन करने के बजाय सेटअप त्रुटि के साथ विफल होता है।

### Twilio

Twilio ट्रांसपोर्ट Voice Call Plugin को सौंपा गया एक सख्त डायल प्लान है। यह फ़ोन नंबरों के लिए Meet पेजों को पार्स नहीं करता।

जब Chrome भागीदारी उपलब्ध न हो या आप फ़ोन dial-in fallback चाहते हों तो इसका उपयोग करें। Google Meet को मीटिंग के लिए फ़ोन dial-in नंबर और PIN दिखाना होगा; OpenClaw उन्हें Meet पेज से खोजता नहीं है।

Voice Call Plugin को Gateway होस्ट पर सक्षम करें, Chrome नोड पर नहीं:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Twilio क्रेडेंशियल environment या config के माध्यम से प्रदान करें। Environment secrets को `openclaw.json` से बाहर रखता है:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

यदि आपका realtime voice provider वही है, तो इसके बजाय OpenAI provider Plugin और `OPENAI_API_KEY` के साथ `realtime.provider: "openai"` का उपयोग करें।

`voice-call` सक्षम करने के बाद Gateway को restart या reload करें; Plugin config परिवर्तन पहले से चल रहे Gateway process में reload होने तक दिखाई नहीं देते।

फिर सत्यापित करें:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

जब Twilio delegation wired हो, तो `googlemeet setup` में सफल `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, और `twilio-voice-call-webhook` checks शामिल होते हैं।

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

जब मीटिंग को custom sequence चाहिए हो तो `--dtmf-sequence` का उपयोग करें:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth और preflight

Meet लिंक बनाने के लिए OAuth वैकल्पिक है क्योंकि `googlemeet create` browser automation पर fallback कर सकता है। जब आप official API create, space resolution, या Meet Media API preflight checks चाहते हों तो OAuth कॉन्फ़िगर करें।

Google Meet API access user OAuth का उपयोग करता है: Google Cloud OAuth client बनाएं, आवश्यक scopes का अनुरोध करें, Google account को authorize करें, फिर परिणामी refresh token को Google Meet Plugin config में store करें या `OPENCLAW_GOOGLE_MEET_*` environment variables प्रदान करें।

OAuth Chrome join path को replace नहीं करता। Chrome और Chrome-node transports अभी भी signed-in Chrome profile, BlackHole/SoX, और connected node के माध्यम से join करते हैं जब आप browser participation का उपयोग करते हैं। OAuth केवल official Google Meet API path के लिए है: meeting spaces बनाना, spaces resolve करना, और Meet Media API preflight checks चलाना।

### Google credentials बनाएं

Google Cloud Console में:

1. Google Cloud project बनाएं या चुनें।
2. उस project के लिए **Google Meet REST API** सक्षम करें।
3. OAuth consent screen कॉन्फ़िगर करें।
   - Google Workspace organization के लिए **Internal** सबसे सरल है।
   - personal/test setups के लिए **External** काम करता है; जब app Testing में हो, तो app authorize करने वाले हर Google account को test user के रूप में जोड़ें।
4. OpenClaw द्वारा अनुरोधित scopes जोड़ें:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth client ID बनाएं।
   - Application type: **Web application**.
   - Authorized redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID और client secret कॉपी करें।

`meetings.space.created` Google Meet `spaces.create` के लिए आवश्यक है।
`meetings.space.readonly` OpenClaw को Meet URLs/codes को spaces में resolve करने देता है।
`meetings.space.settings` OpenClaw को API room creation के दौरान `accessType` जैसी `SpaceConfig` settings पास करने देता है।
`meetings.conference.media.readonly` Meet Media API preflight और media work के लिए है; actual Media API use के लिए Google Developer Preview enrollment मांग सकता है।
यदि आपको केवल browser-based Chrome joins चाहिए, तो OAuth को पूरी तरह छोड़ दें।

### refresh token बनाएं

`oauth.clientId` और वैकल्पिक रूप से `oauth.clientSecret` कॉन्फ़िगर करें, या उन्हें environment variables के रूप में पास करें, फिर चलाएं:

```bash
openclaw googlemeet auth login --json
```

कमांड refresh token के साथ `oauth` config block प्रिंट करता है। यह PKCE, `http://localhost:8085/oauth2callback` पर localhost callback, और `--manual` के साथ manual copy/paste flow का उपयोग करता है।

उदाहरण:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

जब browser local callback तक नहीं पहुंच सकता, manual mode का उपयोग करें:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON output में शामिल है:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

`oauth` object को Google Meet Plugin config के अंतर्गत store करें:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

जब आप config में refresh token नहीं चाहते, तो environment variables को प्राथमिकता दें। यदि config और environment values दोनों मौजूद हैं, तो Plugin पहले config और फिर environment fallback resolve करता है।

OAuth consent में Meet space creation, Meet space read access, और Meet conference media read access शामिल हैं। यदि आपने meeting creation support मौजूद होने से पहले authenticate किया था, तो `openclaw googlemeet auth login --json` फिर से चलाएं ताकि refresh token के पास `meetings.space.created` scope हो।

### doctor से OAuth सत्यापित करें

जब आप तेज, non-secret health check चाहते हों तो OAuth doctor चलाएं:

```bash
openclaw googlemeet doctor --oauth --json
```

यह Chrome runtime load नहीं करता या connected Chrome node की आवश्यकता नहीं रखता। यह जांचता है कि OAuth config मौजूद है और refresh token access token mint कर सकता है। JSON report में केवल `ok`, `configured`, `tokenSource`, `expiresAt`, और check messages जैसे status fields शामिल हैं; यह access token, refresh token, या client secret प्रिंट नहीं करता।

सामान्य परिणाम:

| जाँच                | अर्थ                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` और `oauth.refreshToken`, या कैश किया गया ऐक्सेस टोकन, मौजूद है।       |
| `oauth-token`        | कैश किया गया ऐक्सेस टोकन अब भी मान्य है, या रिफ्रेश टोकन ने नया ऐक्सेस टोकन बनाया। |
| `meet-spaces-get`    | वैकल्पिक `--meeting` जाँच ने मौजूदा Meet स्पेस हल किया।                             |
| `meet-spaces-create` | वैकल्पिक `--create-space` जाँच ने नया Meet स्पेस बनाया।                               |

Google Meet API सक्षम होने और `spaces.create` स्कोप को भी साबित करने के लिए,
साइड-इफ़ेक्ट वाली create जाँच चलाएँ:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` एक अस्थायी Meet URL बनाता है। इसका उपयोग तब करें जब आपको पुष्टि करनी हो
कि Google Cloud प्रोजेक्ट में Meet API सक्षम है और अधिकृत
खाते के पास `meetings.space.created` स्कोप है।

किसी मौजूदा मीटिंग स्पेस के लिए पढ़ने की पहुँच साबित करने के लिए:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` और `resolve-space` ऐसे मौजूदा
स्पेस तक पढ़ने की पहुँच साबित करते हैं जिसे अधिकृत Google खाता एक्सेस कर सकता है। इन जाँचों से मिला `403`
आमतौर पर इसका मतलब है कि Google Meet REST API अक्षम है, सहमति वाले रिफ्रेश टोकन में
ज़रूरी स्कोप नहीं है, या Google खाता उस Meet
स्पेस को एक्सेस नहीं कर सकता। रिफ्रेश-टोकन त्रुटि का मतलब है कि `openclaw googlemeet auth login
--json` फिर से चलाएँ और नया `oauth` ब्लॉक संग्रहित करें।

ब्राउज़र फ़ॉलबैक के लिए OAuth क्रेडेंशियल की ज़रूरत नहीं है। उस मोड में, Google
auth चुने गए नोड पर साइन-इन किए Chrome प्रोफ़ाइल से आता है, OpenClaw
कॉन्फ़िगरेशन से नहीं।

इन पर्यावरण चरों को फ़ॉलबैक के रूप में स्वीकार किया जाता है:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` या `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` या `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` या `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` या `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` या
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` या `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` या `GOOGLE_MEET_PREVIEW_ACK`

Meet URL, कोड, या `spaces/{id}` को `spaces.get` के ज़रिए हल करें:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

मीडिया कार्य से पहले प्रीफ़्लाइट चलाएँ:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet द्वारा कॉन्फ़्रेंस रिकॉर्ड बनाए जाने के बाद मीटिंग आर्टिफ़ैक्ट और उपस्थिति सूचीबद्ध करें:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` के साथ, `artifacts` और `attendance` डिफ़ॉल्ट रूप से नवीनतम कॉन्फ़्रेंस रिकॉर्ड
का उपयोग करते हैं। जब आप उस मीटिंग के लिए हर सुरक्षित रखा गया रिकॉर्ड चाहते हों, तो
`--all-conference-records` पास करें।

Calendar लुकअप Meet आर्टिफ़ैक्ट पढ़ने से पहले Google Calendar से मीटिंग URL
हल कर सकता है:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` Google Meet लिंक वाले Calendar ईवेंट के लिए आज के `primary` कैलेंडर में खोजता है।
मिलते-जुलते ईवेंट टेक्स्ट को खोजने के लिए `--event <query>` का उपयोग करें, और
गैर-प्राथमिक कैलेंडर के लिए `--calendar <id>` का उपयोग करें। Calendar लुकअप के लिए ऐसा नया
OAuth लॉगिन चाहिए जिसमें Calendar events readonly स्कोप शामिल हो।
`calendar-events` मेल खाते Meet ईवेंट का पूर्वावलोकन करता है और उस ईवेंट को चिह्नित करता है जिसे
`latest`, `artifacts`, `attendance`, या `export` चुनेगा।

यदि आपको कॉन्फ़्रेंस रिकॉर्ड id पहले से पता है, तो उसे सीधे संबोधित करें:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

जब आप कॉल के बाद कमरे को बंद करना चाहते हों, तो API से बनाए गए स्पेस के लिए सक्रिय कॉन्फ़्रेंस
समाप्त करें:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

यह Google Meet `spaces.endActiveConference` को कॉल करता है और ऐसे स्पेस के लिए
`meetings.space.created` स्कोप वाले OAuth की ज़रूरत होती है जिसे अधिकृत खाता प्रबंधित कर सकता है।
OpenClaw Meet URL, मीटिंग कोड, या `spaces/{id}` इनपुट स्वीकार करता है और सक्रिय कॉन्फ़्रेंस
समाप्त करने से पहले उसे API स्पेस संसाधन में हल करता है।
यह `googlemeet leave` से अलग है: `leave` OpenClaw की local/session
भागीदारी रोकता है, जबकि `end-active-conference` Google Meet से उस स्पेस की सक्रिय
कॉन्फ़्रेंस समाप्त करने का अनुरोध करता है।

पढ़ने योग्य रिपोर्ट लिखें:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

जब Google मीटिंग के लिए इन्हें उजागर करता है, तो `artifacts` कॉन्फ़्रेंस रिकॉर्ड मेटाडेटा के साथ
प्रतिभागी, रिकॉर्डिंग, ट्रांसक्रिप्ट, संरचित ट्रांसक्रिप्ट-एंट्री, और स्मार्ट-नोट संसाधन मेटाडेटा
लौटाता है। बड़ी मीटिंग के लिए एंट्री लुकअप छोड़ने हेतु `--no-transcript-entries` का उपयोग करें।
`attendance` प्रतिभागियों को participant-session पंक्तियों में फैलाता है, जिनमें पहली/आखिरी बार देखे जाने का समय,
कुल सत्र अवधि, देर/जल्दी-छोड़ने के फ़्लैग, और साइन-इन उपयोगकर्ता या डिस्प्ले नाम के आधार पर मर्ज किए गए
डुप्लिकेट प्रतिभागी संसाधन शामिल होते हैं। कच्चे प्रतिभागी संसाधनों को अलग रखने के लिए
`--no-merge-duplicates`, देर का पता लगाने को ट्यून करने के लिए `--late-after-minutes`, और
जल्दी-छोड़ने का पता लगाने को ट्यून करने के लिए `--early-before-minutes` पास करें।

`export` `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, और `manifest.json` वाली फ़ोल्डर लिखता है।
`manifest.json` चुने गए इनपुट, निर्यात विकल्प, कॉन्फ़्रेंस रिकॉर्ड,
आउटपुट फ़ाइलें, गिनतियाँ, टोकन स्रोत, उपयोग किए जाने पर Calendar ईवेंट, और किसी भी
आंशिक प्राप्ति चेतावनी को रिकॉर्ड करता है। फ़ोल्डर के पास एक पोर्टेबल आर्काइव भी लिखने के लिए
`--zip` पास करें। लिंक किए गए ट्रांसक्रिप्ट और
स्मार्ट-नोट Google Docs टेक्स्ट को Google Drive `files.export` के ज़रिए निर्यात करने के लिए `--include-doc-bodies`
पास करें; इसके लिए ऐसा नया OAuth लॉगिन चाहिए जिसमें Drive Meet readonly स्कोप शामिल हो।
`--include-doc-bodies` के बिना, निर्यातों में केवल Meet मेटाडेटा और संरचित ट्रांसक्रिप्ट
एंट्रियाँ शामिल होती हैं। यदि Google कोई आंशिक आर्टिफ़ैक्ट विफलता लौटाता है, जैसे स्मार्ट-नोट
लिस्टिंग, ट्रांसक्रिप्ट-एंट्री, या Drive दस्तावेज़-बॉडी त्रुटि, तो सारांश और
मैनिफ़ेस्ट पूरे निर्यात को विफल करने के बजाय चेतावनी रखते हैं।
वही आर्टिफ़ैक्ट/उपस्थिति डेटा प्राप्त करने और फ़ोल्डर या ZIP बनाए बिना
मैनिफ़ेस्ट JSON प्रिंट करने के लिए `--dry-run` का उपयोग करें। यह बड़ा निर्यात लिखने से पहले
या जब किसी एजेंट को केवल गिनतियाँ, चुने गए रिकॉर्ड, और
चेतावनियाँ चाहिए हों, उपयोगी है।

एजेंट `google_meet` टूल के ज़रिए भी वही बंडल बना सकते हैं:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

केवल निर्यात मैनिफ़ेस्ट लौटाने और फ़ाइल लेखन छोड़ने के लिए `"dryRun": true` सेट करें।

एजेंट स्पष्ट पहुँच नीति के साथ API-समर्थित कमरा भी बना सकते हैं:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

और वे किसी ज्ञात कमरे के लिए सक्रिय कॉन्फ़्रेंस समाप्त कर सकते हैं:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

पहले-सुनने वाले सत्यापन के लिए, एजेंटों को मीटिंग उपयोगी होने का दावा करने से पहले
`test_listen` का उपयोग करना चाहिए:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

वास्तविक सुरक्षित रखी गई मीटिंग के विरुद्ध संरक्षित लाइव स्मोक चलाएँ:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

ऐसी मीटिंग के विरुद्ध लाइव पहले-सुनने वाला ब्राउज़र प्रोब चलाएँ जहाँ कोई
Meet कैप्शन उपलब्ध रहते हुए बोलेगा:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

लाइव स्मोक वातावरण:

- `OPENCLAW_LIVE_TEST=1` संरक्षित लाइव परीक्षण सक्षम करता है।
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` किसी सुरक्षित रखे गए Meet URL, कोड, या
  `spaces/{id}` की ओर इशारा करता है।
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` या `GOOGLE_MEET_CLIENT_ID` OAuth
  क्लाइंट id प्रदान करता है।
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` या `GOOGLE_MEET_REFRESH_TOKEN`
  रिफ्रेश टोकन प्रदान करता है।
- वैकल्पिक: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, और
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` `OPENCLAW_` उपसर्ग के बिना
  वही फ़ॉलबैक नाम उपयोग करते हैं।

बेस आर्टिफ़ैक्ट/उपस्थिति लाइव स्मोक को
`https://www.googleapis.com/auth/meetings.space.readonly` और
`https://www.googleapis.com/auth/meetings.conference.media.readonly` चाहिए। Calendar
लुकअप को `https://www.googleapis.com/auth/calendar.events.readonly` चाहिए। Drive
दस्तावेज़-बॉडी निर्यात को
`https://www.googleapis.com/auth/drive.meet.readonly` चाहिए।

नया Meet स्पेस बनाएँ:

```bash
openclaw googlemeet create
```

कमांड नया `meeting uri`, स्रोत, और जॉइन सत्र प्रिंट करता है। OAuth
क्रेडेंशियल के साथ यह आधिकारिक Google Meet API का उपयोग करता है। OAuth क्रेडेंशियल के बिना यह
पिन किए गए Chrome नोड के साइन-इन ब्राउज़र प्रोफ़ाइल को फ़ॉलबैक के रूप में उपयोग करता है। एजेंट
एक ही चरण में बनाने और जुड़ने के लिए `action: "create"` के साथ `google_meet` टूल का उपयोग कर सकते हैं।
केवल-URL निर्माण के लिए, `"join": false` पास करें।

ब्राउज़र फ़ॉलबैक से उदाहरण JSON आउटपुट:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

यदि ब्राउज़र फ़ॉलबैक URL बना पाने से पहले Google लॉगिन या Meet अनुमति अवरोध से टकराता है,
तो Gateway विधि विफल प्रतिक्रिया लौटाती है और
`google_meet` टूल सादे स्ट्रिंग के बजाय संरचित विवरण लौटाता है:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

जब कोई एजेंट `manualActionRequired: true` देखता है, तो उसे
`manualActionMessage` के साथ ब्राउज़र नोड/टैब संदर्भ रिपोर्ट करना चाहिए और ऑपरेटर द्वारा ब्राउज़र चरण पूरा करने तक नए
Meet टैब खोलना बंद कर देना चाहिए।

API create से उदाहरण JSON आउटपुट:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Meet बनाना डिफ़ॉल्ट रूप से उसमें शामिल होता है। Chrome या Chrome-node ट्रांसपोर्ट को ब्राउज़र के ज़रिए शामिल होने के लिए अब भी साइन-इन किए हुए Google Chrome प्रोफ़ाइल की ज़रूरत होती है। अगर प्रोफ़ाइल साइन आउट है, तो OpenClaw `manualActionRequired: true` या ब्राउज़र फ़ॉलबैक त्रुटि रिपोर्ट करता है और ऑपरेटर से दोबारा कोशिश करने से पहले Google लॉगिन पूरा करने को कहता है।

`preview.enrollmentAcknowledged: true` केवल यह पुष्टि करने के बाद सेट करें कि आपका Cloud प्रोजेक्ट, OAuth प्रिंसिपल, और मीटिंग प्रतिभागी Meet media APIs के लिए Google Workspace Developer Preview Program में नामांकित हैं।

## कॉन्फ़िगरेशन

सामान्य Chrome एजेंट पाथ को केवल Plugin सक्षम होने, BlackHole, SoX, एक रियलटाइम ट्रांसक्रिप्शन प्रदाता कुंजी, और कॉन्फ़िगर किए हुए OpenClaw TTS प्रदाता की ज़रूरत होती है। OpenAI डिफ़ॉल्ट ट्रांसक्रिप्शन प्रदाता है; डिफ़ॉल्ट एजेंट-मोड ट्रांसक्रिप्शन प्रदाता बदले बिना `bidi` मोड के लिए Google Gemini Live का उपयोग करने हेतु `realtime.voiceProvider` को `"google"` और `realtime.model` को सेट करें:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin कॉन्फ़िगरेशन को `plugins.entries.google-meet.config` के अंतर्गत सेट करें:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

डिफ़ॉल्ट:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` केवल `"agent"` के लिए लेगेसी संगतता उपनाम के रूप में स्वीकार किया जाता है; नए टूल कॉल में `"agent"` कहना चाहिए)
- `chromeNode.node`: `chrome-node` के लिए वैकल्पिक node id/name/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: साइन-आउट Meet अतिथि स्क्रीन पर उपयोग किया गया नाम
- `chrome.autoJoin: true`: `chrome-node` पर OpenClaw ब्राउज़र ऑटोमेशन के ज़रिए सर्वोत्तम-प्रयास अतिथि-नाम भरना और Join Now क्लिक करना
- `chrome.reuseExistingTab: true`: डुप्लिकेट खोलने के बजाय मौजूदा Meet टैब सक्रिय करें
- `chrome.waitForInCallMs: 20000`: talk-back intro ट्रिगर होने से पहले Meet टैब के in-call रिपोर्ट करने की प्रतीक्षा करें
- `chrome.audioFormat: "pcm16-24khz"`: कमांड-पेयर ऑडियो फ़ॉर्मैट। `"g711-ulaw-8khz"` का उपयोग केवल उन लेगेसी/कस्टम कमांड पेयर के लिए करें जो अब भी टेलीफ़ोनी ऑडियो उत्सर्जित करते हैं।
- `chrome.audioBufferBytes: 4096`: जनरेट किए गए Chrome कमांड-पेयर ऑडियो कमांड के लिए SoX प्रोसेसिंग बफ़र। यह SoX के डिफ़ॉल्ट 8192-बाइट बफ़र का आधा है, जिससे डिफ़ॉल्ट पाइप लेटेंसी घटती है और व्यस्त होस्ट पर इसे बढ़ाने की गुंजाइश बचती है। SoX के न्यूनतम से कम मान 17 बाइट पर क्लैंप किए जाते हैं।
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` से पढ़ने और `chrome.audioFormat` में ऑडियो लिखने वाला SoX कमांड
- `chrome.audioOutputCommand`: `chrome.audioFormat` में ऑडियो पढ़ने और CoreAudio `BlackHole 2ch` पर लिखने वाला SoX कमांड
- `chrome.bargeInInputCommand`: वैकल्पिक स्थानीय माइक्रोफ़ोन कमांड जो assistant playback सक्रिय रहने पर मानव barge-in पहचान के लिए signed 16-bit little-endian mono PCM लिखता है। यह अभी Gateway-होस्टेड `chrome` कमांड-पेयर ब्रिज पर लागू होता है।
- `chrome.bargeInRmsThreshold: 650`: RMS स्तर जिसे `chrome.bargeInInputCommand` पर मानवीय व्यवधान माना जाता है
- `chrome.bargeInPeakThreshold: 2500`: पीक स्तर जिसे `chrome.bargeInInputCommand` पर मानवीय व्यवधान माना जाता है
- `chrome.bargeInCooldownMs: 900`: दोहराए गए मानवीय व्यवधान clear के बीच न्यूनतम विलंब
- `mode: "agent"`: डिफ़ॉल्ट talk-back मोड। प्रतिभागी की बोली कॉन्फ़िगर किए गए रियलटाइम ट्रांसक्रिप्शन प्रदाता द्वारा ट्रांसक्राइब की जाती है, प्रति-मीटिंग सब-एजेंट सत्र में कॉन्फ़िगर किए गए OpenClaw एजेंट को भेजी जाती है, और सामान्य OpenClaw TTS runtime के ज़रिए बोली जाती है।
- `mode: "bidi"`: फ़ॉलबैक प्रत्यक्ष द्विदिश रियलटाइम मॉडल मोड। रियलटाइम voice provider प्रतिभागी की बोली का सीधे उत्तर देता है और गहरे/टूल-समर्थित उत्तरों के लिए `openclaw_agent_consult` कॉल कर सकता है।
- `mode: "transcribe"`: talk-back ब्रिज के बिना केवल-अवलोकन मोड।
- `realtime.provider: "openai"`: नीचे दिए गए scoped provider फ़ील्ड unset होने पर उपयोग किया जाने वाला संगतता फ़ॉलबैक।
- `realtime.transcriptionProvider: "openai"`: रियलटाइम ट्रांसक्रिप्शन के लिए `agent` मोड द्वारा उपयोग किया गया provider id।
- `realtime.voiceProvider`: प्रत्यक्ष रियलटाइम आवाज़ के लिए `bidi` मोड द्वारा उपयोग किया गया provider id। agent-mode ट्रांसक्रिप्शन को OpenAI पर रखते हुए Gemini Live का उपयोग करने के लिए इसे `"google"` पर सेट करें।
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: गहरे उत्तरों के लिए `openclaw_agent_consult` के साथ संक्षिप्त बोले गए उत्तर
- `realtime.introMessage`: रियलटाइम ब्रिज कनेक्ट होने पर छोटा बोला गया readiness check; चुपचाप शामिल होने के लिए इसे `""` पर सेट करें
- `realtime.agentId`: `openclaw_agent_consult` के लिए वैकल्पिक OpenClaw agent id; डिफ़ॉल्ट `main`

वैकल्पिक ओवरराइड:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

agent-mode सुनने और बोलने, दोनों के लिए ElevenLabs:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

स्थायी Meet आवाज़ `messages.tts.providers.elevenlabs.speakerVoiceId` से आती है। TTS मॉडल ओवरराइड सक्षम होने पर एजेंट उत्तर प्रति-उत्तर `[[tts:speakerVoiceId=... model=eleven_v3]]` निर्देशों का भी उपयोग कर सकते हैं, लेकिन मीटिंग के लिए कॉन्फ़िगरेशन deterministic डिफ़ॉल्ट है। Join पर, लॉग में `transcriptionProvider=elevenlabs` दिखना चाहिए और हर बोले गए उत्तर में `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` लॉग होना चाहिए।

केवल Twilio कॉन्फ़िगरेशन:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` डिफ़ॉल्ट रूप से `true` होता है; Twilio ट्रांसपोर्ट के साथ यह वास्तविक PSTN कॉल, DTMF, और intro greeting को Voice Call Plugin को सौंपता है। Voice Call रियलटाइम मीडिया स्ट्रीम खोलने से पहले DTMF sequence चलाता है, फिर सहेजे गए intro text को शुरुआती रियलटाइम greeting के रूप में उपयोग करता है। अगर `voice-call` सक्षम नहीं है, तो Google Meet अब भी dial plan को validate और record कर सकता है, लेकिन यह Twilio कॉल नहीं कर सकता।

## टूल

एजेंट `google_meet` टूल का उपयोग कर सकते हैं:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

जब Chrome Gateway host पर चलता हो तो `transport: "chrome"` का उपयोग करें। जब Chrome paired node जैसे Parallels VM पर चलता हो तो `transport: "chrome-node"` का उपयोग करें। दोनों स्थितियों में model providers और `openclaw_agent_consult` Gateway host पर चलते हैं, इसलिए model credentials वहीं रहते हैं। डिफ़ॉल्ट `mode: "agent"` के साथ, रियलटाइम ट्रांसक्रिप्शन प्रदाता सुनने को संभालता है, कॉन्फ़िगर किया गया OpenClaw एजेंट उत्तर बनाता है, और नियमित OpenClaw TTS उसे Meet में बोलता है। जब आप चाहते हैं कि रियलटाइम voice model सीधे उत्तर दे, तो `mode: "bidi"` का उपयोग करें। कच्चा `mode: "realtime"` अब भी `mode: "agent"` के लिए लेगेसी संगतता उपनाम के रूप में स्वीकार किया जाता है, लेकिन यह अब एजेंट टूल schema में विज्ञापित नहीं है। Agent-mode logs में bridge startup पर resolved transcription provider/model और हर synthesized reply के बाद TTS provider, model, voice, output format, और sample rate शामिल होते हैं।

सक्रिय सत्रों की सूची देखने या session ID inspect करने के लिए `action: "status"` का उपयोग करें। realtime agent को तुरंत बोलाने के लिए `sessionId` और `message` के साथ `action: "speak"` का उपयोग करें। session बनाने या पुन: उपयोग करने, known phrase trigger करने, और जब Chrome host इसे report कर सके तो `inCall` health लौटाने के लिए `action: "test_speech"` का उपयोग करें। `test_speech` हमेशा `mode: "agent"` को force करता है और अगर उसे `mode: "transcribe"` में चलाने को कहा जाए तो fail करता है, क्योंकि observe-only sessions जानबूझकर speech emit नहीं कर सकते। इसका `speechOutputVerified` परिणाम इस test call के दौरान realtime audio output bytes बढ़ने पर आधारित है, इसलिए पुराने audio वाला reused session fresh successful speech check के रूप में count नहीं होता। session ended mark करने के लिए `action: "leave"` का उपयोग करें।

उपलब्ध होने पर `status` में Chrome health शामिल होती है:

- `inCall`: Chrome Meet call के अंदर प्रतीत होता है
- `micMuted`: best-effort Meet microphone state
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: speech काम कर सके उससे पहले browser profile को manual login, Meet host admission, permissions, या browser-control repair की ज़रूरत है
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: क्या managed Chrome speech अभी allowed है। `speechReady: false` का मतलब है कि OpenClaw ने intro/test phrase को audio bridge में नहीं भेजा।
- `providerConnected` / `realtimeReady`: realtime voice bridge state
- `lastInputAt` / `lastOutputAt`: bridge से देखा गया या bridge को भेजा गया अंतिम audio
- `audioOutputRouted` / `audioOutputDeviceLabel`: क्या Meet tab का media output bridge द्वारा उपयोग किए गए BlackHole device पर actively routed था
- `lastSuppressedInputAt` / `suppressedInputBytes`: assistant playback सक्रिय रहने पर ignore किया गया loopback input

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## एजेंट और bidi मोड

Chrome `agent` mode "मेरा एजेंट मीटिंग में है" व्यवहार के लिए अनुकूलित है। रियलटाइम ट्रांसक्रिप्शन प्रदाता meeting audio सुनता है, final participant transcripts कॉन्फ़िगर किए गए OpenClaw agent के ज़रिए route किए जाते हैं, और उत्तर सामान्य OpenClaw TTS runtime के ज़रिए बोला जाता है। जब आप चाहते हैं कि realtime voice model सीधे उत्तर दे, तो `mode: "bidi"` सेट करें। consult से पहले आसपास के final transcript fragments को coalesce किया जाता है ताकि एक spoken turn कई stale partial answers न बनाए। Queued assistant audio अब भी चल रहा हो तब realtime input भी suppress किया जाता है, और agent consult से पहले हाल के assistant-जैसे transcript echoes को ignore किया जाता है ताकि BlackHole loopback एजेंट से उसकी अपनी speech का उत्तर न दिलवा दे।

| Mode    | उत्तर कौन तय करता है          | Speech output path                     | कब उपयोग करें                                         |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | कॉन्फ़िगर किया गया OpenClaw agent | सामान्य OpenClaw TTS runtime           | जब आप "मेरा एजेंट मीटिंग में है" व्यवहार चाहते हैं    |
| `bidi`  | realtime voice model          | realtime voice provider audio response | जब आप सबसे कम-लेटेंसी conversational voice loop चाहते हैं |

`bidi` mode में, जब realtime model को गहरे reasoning, current information, या सामान्य OpenClaw tools की ज़रूरत हो, तो यह `openclaw_agent_consult` कॉल कर सकता है।

consult टूल हालिया मीटिंग ट्रांसक्रिप्ट संदर्भ के साथ पृष्ठभूमि में नियमित OpenClaw एजेंट चलाता है और संक्षिप्त बोला जा सकने वाला उत्तर लौटाता है। `agent` मोड में, OpenClaw उस उत्तर को सीधे TTS रनटाइम को भेजता है; `bidi` मोड में, रीयलटाइम आवाज़ मॉडल consult परिणाम को मीटिंग में बोलकर सुना सकता है। यह Voice Call जैसी ही साझा consult मशीनरी का उपयोग करता है।

डिफ़ॉल्ट रूप से, consult `main` एजेंट पर चलते हैं। जब किसी Meet लेन को समर्पित OpenClaw एजेंट वर्कस्पेस, मॉडल डिफ़ॉल्ट, टूल नीति, मेमोरी, और सत्र इतिहास से consult करना हो, तो `realtime.agentId` सेट करें।

एजेंट-मोड consult प्रति-मीटिंग `agent:<id>:subagent:google-meet:<session>` सत्र कुंजी का उपयोग करते हैं ताकि फ़ॉलो-अप प्रश्न कॉन्फ़िगर किए गए एजेंट से सामान्य एजेंट नीति विरासत में लेते हुए मीटिंग संदर्भ बनाए रखें।

`realtime.toolPolicy` consult रन को नियंत्रित करता है:

- `safe-read-only`: consult टूल उपलब्ध कराएं और नियमित एजेंट को `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, और `memory_get` तक सीमित करें।
- `owner`: consult टूल उपलब्ध कराएं और नियमित एजेंट को सामान्य एजेंट टूल नीति का उपयोग करने दें।
- `none`: रीयलटाइम आवाज़ मॉडल को consult टूल उपलब्ध न कराएं।

consult सत्र कुंजी प्रति Meet सत्र सीमित होती है, इसलिए फ़ॉलो-अप consult कॉल उसी मीटिंग के दौरान पिछले consult संदर्भ का फिर से उपयोग कर सकते हैं।

Chrome के कॉल में पूरी तरह शामिल हो जाने के बाद बोली गई तैयारी जांच को बाध्य करने के लिए:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

पूर्ण जॉइन-एंड-स्पीक स्मोक के लिए:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## लाइव परीक्षण चेकलिस्ट

किसी मीटिंग को अनअटेंडेड एजेंट को सौंपने से पहले इस क्रम का उपयोग करें:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

अपेक्षित Chrome-node स्थिति:

- `googlemeet setup` पूरी तरह हरा है।
- जब Chrome-node डिफ़ॉल्ट ट्रांसपोर्ट हो या कोई node पिन किया गया हो, तो `googlemeet setup` में `chrome-node-connected` शामिल होता है।
- `nodes status` चयनित node को कनेक्टेड दिखाता है।
- चयनित node `googlemeet.chrome` और `browser.proxy`, दोनों प्रकाशित करता है।
- Meet टैब कॉल में शामिल होता है और `test-speech` `inCall: true` के साथ Chrome स्वास्थ्य लौटाता है।

Parallels macOS VM जैसे रिमोट Chrome होस्ट के लिए, Gateway या VM अपडेट करने के बाद यह सबसे छोटा सुरक्षित चेक है:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

यह प्रमाणित करता है कि Gateway Plugin लोड है, VM node वर्तमान टोकन के साथ कनेक्टेड है, और एजेंट के वास्तविक मीटिंग टैब खोलने से पहले Meet ऑडियो ब्रिज उपलब्ध है।

Twilio स्मोक के लिए, ऐसी मीटिंग का उपयोग करें जो फ़ोन डायल-इन विवरण दिखाती हो:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

अपेक्षित Twilio स्थिति:

- `googlemeet setup` में हरे `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, और `twilio-voice-call-webhook` चेक शामिल होते हैं।
- Gateway रीलोड के बाद CLI में `voicecall` उपलब्ध है।
- लौटे हुए सत्र में `transport: "twilio"` और `twilio.voiceCallId` होता है।
- `openclaw logs --follow` रीयलटाइम TwiML से पहले DTMF TwiML सर्व होते हुए दिखाता है, फिर प्रारंभिक अभिवादन कतारबद्ध किए हुए रीयलटाइम ब्रिज दिखाता है।
- `googlemeet leave <sessionId>` प्रत्यायोजित voice call को हैंग अप करता है।

## समस्या निवारण

### एजेंट Google Meet टूल नहीं देख सकता

पुष्टि करें कि Plugin Gateway कॉन्फ़िग में सक्षम है और Gateway रीलोड करें:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

अगर आपने अभी `plugins.entries.google-meet` संपादित किया है, तो Gateway को पुनः प्रारंभ या रीलोड करें। चल रहा एजेंट केवल वर्तमान Gateway प्रक्रिया द्वारा पंजीकृत Plugin टूल देखता है।

गैर-macOS Gateway होस्ट पर, एजेंट-फ़ेसिंग `google_meet` टूल दिखाई देता रहता है, लेकिन स्थानीय Chrome talk-back कार्रवाइयां ऑडियो ब्रिज तक पहुंचने से पहले रोक दी जाती हैं। स्थानीय Chrome talk-back ऑडियो फिलहाल macOS `BlackHole 2ch` पर निर्भर है, इसलिए Linux एजेंटों को डिफ़ॉल्ट स्थानीय Chrome एजेंट पथ के बजाय `mode: "transcribe"`, Twilio डायल-इन, या macOS `chrome-node` होस्ट का उपयोग करना चाहिए।

### कोई कनेक्टेड Google Meet-सक्षम node नहीं

node होस्ट पर चलाएं:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway होस्ट पर, node को स्वीकृत करें और कमांड सत्यापित करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node कनेक्टेड होना चाहिए और `googlemeet.chrome` के साथ `browser.proxy` सूचीबद्ध करना चाहिए। Gateway कॉन्फ़िग को उन node कमांड की अनुमति देनी चाहिए:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

अगर `googlemeet setup` `chrome-node-connected` पर विफल होता है या Gateway लॉग `gateway token mismatch` रिपोर्ट करता है, तो वर्तमान Gateway टोकन के साथ node को फिर से इंस्टॉल या पुनः प्रारंभ करें। LAN Gateway के लिए इसका आम तौर पर अर्थ है:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

फिर node सेवा रीलोड करें और फिर से चलाएं:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### ब्राउज़र खुलता है लेकिन एजेंट शामिल नहीं हो सकता

observe-only जॉइन के लिए `googlemeet test-listen` या रीयलटाइम जॉइन के लिए `googlemeet test-speech` चलाएं, फिर लौटे हुए Chrome स्वास्थ्य की जांच करें। अगर कोई भी probe `manualActionRequired: true` रिपोर्ट करता है, तो ऑपरेटर को `manualActionMessage` दिखाएं और ब्राउज़र कार्रवाई पूरी होने तक फिर से प्रयास करना रोक दें।

सामान्य मैनुअल कार्रवाइयां:

- Chrome प्रोफ़ाइल में साइन इन करें।
- Meet होस्ट खाते से अतिथि को प्रवेश दें।
- Chrome का मूल अनुमति prompt दिखाई देने पर Chrome माइक्रोफ़ोन/कैमरा अनुमतियां दें।
- अटके हुए Meet अनुमति डायलॉग को बंद या ठीक करें।

सिर्फ इसलिए "not signed in" रिपोर्ट न करें क्योंकि Meet "Do you want people to hear you in the meeting?" दिखाता है। यह Meet का ऑडियो-चॉइस इंटरस्टिशियल है; उपलब्ध होने पर OpenClaw ब्राउज़र ऑटोमेशन के माध्यम से **Use microphone** क्लिक करता है और वास्तविक मीटिंग स्थिति की प्रतीक्षा जारी रखता है। create-only ब्राउज़र फ़ॉलबैक के लिए, OpenClaw **Continue without microphone** क्लिक कर सकता है क्योंकि URL बनाने के लिए रीयलटाइम ऑडियो पथ की आवश्यकता नहीं होती।

### मीटिंग बनाना विफल होता है

OAuth क्रेडेंशियल कॉन्फ़िगर होने पर `googlemeet create` पहले Google Meet API `spaces.create` endpoint का उपयोग करता है। OAuth क्रेडेंशियल के बिना, यह पिन किए गए Chrome node ब्राउज़र पर फ़ॉलबैक करता है। पुष्टि करें:

- API निर्माण के लिए: `oauth.clientId` और `oauth.refreshToken` कॉन्फ़िगर हैं, या मेल खाते `OPENCLAW_GOOGLE_MEET_*` environment variables मौजूद हैं।
- API निर्माण के लिए: refresh token create समर्थन जोड़े जाने के बाद मिंट किया गया था। पुराने tokens में `meetings.space.created` scope छूटा हो सकता है; `openclaw googlemeet auth login --json` फिर से चलाएं और Plugin कॉन्फ़िग अपडेट करें।
- ब्राउज़र फ़ॉलबैक के लिए: `defaultTransport: "chrome-node"` और `chromeNode.node` ऐसे कनेक्टेड node की ओर इशारा करते हैं जिसमें `browser.proxy` और `googlemeet.chrome` हैं।
- ब्राउज़र फ़ॉलबैक के लिए: उस node पर OpenClaw Chrome प्रोफ़ाइल Google में साइन इन है और `https://meet.google.com/new` खोल सकती है।
- ब्राउज़र फ़ॉलबैक के लिए: पुनः प्रयास नया टैब खोलने से पहले मौजूदा `https://meet.google.com/new` या Google account prompt टैब का फिर से उपयोग करते हैं। अगर एजेंट टाइम आउट हो जाता है, तो मैन्युअल रूप से दूसरा Meet टैब खोलने के बजाय टूल कॉल को फिर से प्रयास करें।
- ब्राउज़र फ़ॉलबैक के लिए: अगर टूल `manualActionRequired: true` लौटाता है, तो ऑपरेटर को मार्गदर्शन देने के लिए लौटे हुए `browser.nodeId`, `browser.targetId`, `browserUrl`, और `manualActionMessage` का उपयोग करें। उस कार्रवाई के पूरा होने तक लूप में फिर से प्रयास न करें।
- ब्राउज़र फ़ॉलबैक के लिए: अगर Meet "Do you want people to hear you in the meeting?" दिखाता है, तो टैब खुला छोड़ दें। OpenClaw को ब्राउज़र ऑटोमेशन के माध्यम से **Use microphone** या, create-only फ़ॉलबैक के लिए, **Continue without microphone** क्लिक करना चाहिए और जनरेट किए गए Meet URL की प्रतीक्षा जारी रखनी चाहिए। अगर वह ऐसा नहीं कर सकता, तो त्रुटि में `google-login-required` नहीं, बल्कि `meet-audio-choice-required` का उल्लेख होना चाहिए।

### एजेंट शामिल होता है लेकिन बोलता नहीं

रीयलटाइम पथ जांचें:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

सामान्य STT -> OpenClaw एजेंट -> TTS talk-back पथ के लिए `mode: "agent"` का उपयोग करें, या सीधे रीयलटाइम आवाज़ फ़ॉलबैक के लिए `mode: "bidi"` का उपयोग करें। `mode: "transcribe"` जानबूझकर talk-back ब्रिज शुरू नहीं करता। observe-only डिबगिंग के लिए, प्रतिभागियों के बोलने के बाद `openclaw googlemeet status --json <session-id>` चलाएं और `captioning`, `transcriptLines`, और `lastCaptionText` जांचें। अगर `inCall` true है लेकिन `transcriptLines` `0` पर रहता है, तो Meet captions अक्षम हो सकते हैं, observer इंस्टॉल होने के बाद कोई बोला नहीं है, Meet UI बदल गया है, या मीटिंग भाषा/खाते के लिए live captions अनुपलब्ध हैं।

`googlemeet test-speech` हमेशा रीयलटाइम पथ जांचता है और रिपोर्ट करता है कि उस invocation के लिए ब्रिज output bytes देखे गए या नहीं। अगर `speechOutputVerified` false है और `speechOutputTimedOut` true है, तो रीयलटाइम provider ने utterance स्वीकार कर लिया होगा लेकिन OpenClaw ने Chrome ऑडियो ब्रिज तक नए output bytes पहुंचते हुए नहीं देखे।

यह भी सत्यापित करें:

- Gateway होस्ट पर रीयलटाइम provider key उपलब्ध है, जैसे `OPENAI_API_KEY` या `GEMINI_API_KEY`।
- Chrome होस्ट पर `BlackHole 2ch` दिखाई देता है।
- Chrome होस्ट पर `sox` मौजूद है।
- Meet माइक्रोफ़ोन और स्पीकर OpenClaw द्वारा उपयोग किए गए virtual audio path से routed हैं। स्थानीय Chrome रीयलटाइम जॉइन के लिए `doctor` को `meet output routed: yes` दिखाना चाहिए।

`googlemeet doctor [session-id]` सत्र, node, in-call स्थिति, manual action कारण, रीयलटाइम provider कनेक्शन, `realtimeReady`, audio input/output activity, आखिरी audio timestamps, byte counters, और browser URL प्रिंट करता है। जब आपको raw JSON चाहिए, तो `googlemeet status [session-id] --json` का उपयोग करें। जब आपको tokens उजागर किए बिना Google Meet OAuth refresh सत्यापित करना हो, तो `googlemeet doctor --oauth` का उपयोग करें; जब आपको Google Meet API proof भी चाहिए, तो `--meeting` या `--create-space` जोड़ें।

अगर एजेंट टाइम आउट हो गया है और आपको Meet टैब पहले से खुला दिखता है, तो दूसरा टैब खोले बिना उस टैब की जांच करें:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

समतुल्य टूल कार्रवाई `recover_current_tab` है। यह चयनित transport के लिए मौजूदा Meet टैब को focus और inspect करती है। `chrome` के साथ, यह Gateway के माध्यम से स्थानीय browser control का उपयोग करती है; `chrome-node` के साथ, यह कॉन्फ़िगर किए गए Chrome node का उपयोग करती है। यह नया टैब नहीं खोलती या नया सत्र नहीं बनाती; यह वर्तमान blocker रिपोर्ट करती है, जैसे login, admission, permissions, या audio-choice स्थिति। CLI कमांड कॉन्फ़िगर किए गए Gateway से बात करता है, इसलिए Gateway चल रहा होना चाहिए; `chrome-node` के लिए Chrome node का कनेक्टेड होना भी आवश्यक है।

### Twilio setup checks विफल होते हैं

जब `voice-call` अनुमत या सक्षम नहीं होता, तो `twilio-voice-call-plugin` विफल होता है। इसे `plugins.allow` में जोड़ें, `plugins.entries.voice-call` सक्षम करें, और Gateway रीलोड करें।

जब Twilio backend में account SID, auth token, या caller number नहीं होता, तो `twilio-voice-call-credentials` विफल होता है। इन्हें Gateway होस्ट पर सेट करें:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

जब `voice-call` के पास कोई public Webhook exposure नहीं होता, या जब `publicUrl` loopback या private network space की ओर इशारा करता है, तो `twilio-voice-call-webhook` विफल होता है। `plugins.entries.voice-call.config.publicUrl` को public provider URL पर सेट करें या `voice-call` tunnel/Tailscale exposure कॉन्फ़िगर करें।

Loopback और private URLs carrier callbacks के लिए मान्य नहीं हैं। `publicUrl` के रूप में `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, या `fd00::/8` का उपयोग न करें।

स्थिर public URL के लिए:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

स्थानीय विकास के लिए, निजी होस्ट URL के बजाय टनल या Tailscale एक्सपोजर का उपयोग करें:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

फिर Gateway को रीस्टार्ट या रीलोड करें और चलाएं:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` डिफ़ॉल्ट रूप से केवल तैयारी जांच के लिए है। किसी विशिष्ट नंबर का ड्राई-रन करने के लिए:

```bash
openclaw voicecall smoke --to "+15555550123"
```

`--yes` केवल तब जोड़ें जब आप जानबूझकर लाइव आउटबाउंड सूचना कॉल करना चाहते हों:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio कॉल शुरू होती है लेकिन मीटिंग में कभी प्रवेश नहीं करती

पुष्टि करें कि Meet इवेंट फोन डायल-इन विवरण दिखाता है। सटीक डायल-इन नंबर और PIN या कस्टम DTMF अनुक्रम पास करें:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

अगर प्रदाता को PIN दर्ज करने से पहले विराम चाहिए, तो `--dtmf-sequence` में शुरुआत में `w` या कॉमा का उपयोग करें।

अगर फोन कॉल बन जाती है लेकिन Meet रोस्टर में डायल-इन प्रतिभागी कभी दिखाई नहीं देता:

- प्रत्यायोजित Twilio कॉल ID, DTMF कतारबद्ध हुआ या नहीं, और परिचय अभिवादन का अनुरोध किया गया या नहीं, इसकी पुष्टि करने के लिए `openclaw googlemeet doctor <session-id>` चलाएं।
- `openclaw voicecall status --call-id <id>` चलाएं और पुष्टि करें कि कॉल अब भी सक्रिय है।
- `openclaw voicecall tail` चलाएं और जांचें कि Twilio webhooks Gateway पर आ रहे हैं।
- `openclaw logs --follow` चलाएं और Twilio Meet अनुक्रम देखें: Google Meet join को प्रत्यायोजित करता है, Voice Call प्री-कनेक्ट DTMF TwiML को संग्रहित और सर्व करता है, Voice Call Twilio कॉल के लिए रीयलटाइम TwiML सर्व करता है, फिर Google Meet `voicecall.speak` के साथ परिचय भाषण का अनुरोध करता है।
- `openclaw googlemeet setup --transport twilio` दोबारा चलाएं; हरी setup जांच आवश्यक है लेकिन यह साबित नहीं करती कि मीटिंग PIN अनुक्रम सही है।
- पुष्टि करें कि डायल-इन नंबर उसी Meet आमंत्रण और क्षेत्र से संबंधित है जिससे PIN संबंधित है।
- अगर Meet धीरे जवाब देता है या कॉल ट्रांसक्रिप्ट अब भी प्री-कनेक्ट DTMF भेजे जाने के बाद PIN मांगने वाला प्रॉम्प्ट दिखाता है, तो `voiceCall.dtmfDelayMs` को 12-सेकंड डिफ़ॉल्ट से बढ़ाएं।
- अगर प्रतिभागी जुड़ जाता है लेकिन आपको अभिवादन सुनाई नहीं देता, तो पोस्ट-DTMF `voicecall.speak` अनुरोध और media-stream TTS प्लेबैक या Twilio `<Say>` fallback के लिए `openclaw logs --follow` जांचें। अगर कॉल ट्रांसक्रिप्ट में अब भी "enter the meeting PIN" है, तो फोन लेग अभी Meet रूम में शामिल नहीं हुआ है, इसलिए मीटिंग प्रतिभागी भाषण नहीं सुनेंगे।

अगर webhooks नहीं आते, तो पहले Voice Call plugin को debug करें: प्रदाता को `plugins.entries.voice-call.config.publicUrl` या कॉन्फ़िगर किए गए टनल तक पहुंचना चाहिए। [Voice call समस्या निवारण](/hi/plugins/voice-call#troubleshooting) देखें।

## नोट्स

Google Meet का आधिकारिक मीडिया API receive-oriented है, इसलिए Meet कॉल में बोलने के लिए अब भी एक प्रतिभागी पथ चाहिए। यह plugin उस सीमा को स्पष्ट रखता है: Chrome ब्राउज़र भागीदारी और स्थानीय ऑडियो रूटिंग संभालता है; Twilio फोन डायल-इन भागीदारी संभालता है।

Chrome talk-back मोड के लिए `BlackHole 2ch` और इनमें से एक चाहिए:

- `chrome.audioInputCommand` और `chrome.audioOutputCommand`: OpenClaw ब्रिज का स्वामी होता है और उन commands और चयनित प्रदाता के बीच `chrome.audioFormat` में ऑडियो पाइप करता है। एजेंट मोड रीयलटाइम transcription और नियमित TTS का उपयोग करता है; bidi मोड रीयलटाइम voice प्रदाता का उपयोग करता है। डिफ़ॉल्ट Chrome पथ `chrome.audioBufferBytes: 4096` के साथ 24 kHz PCM16 है; 8 kHz G.711 mu-law legacy command pairs के लिए उपलब्ध रहता है।
- `chrome.audioBridgeCommand`: एक बाहरी ब्रिज command पूरे स्थानीय ऑडियो पथ का स्वामी होता है और अपने daemon को शुरू या validate करने के बाद exit करना चाहिए। यह केवल `bidi` के लिए valid है क्योंकि `agent` मोड को TTS के लिए direct command-pair access चाहिए।

जब कोई एजेंट agent मोड में `google_meet` tool को call करता है, तो meeting consultant session participant speech का उत्तर देने से पहले caller के current transcript को fork करता है। Meet session फिर भी अलग रहता है (`agent:<agentId>:subagent:google-meet:<sessionId>`) ताकि meeting follow-ups caller transcript को सीधे mutate न करें।

स्वच्छ duplex audio के लिए, Meet output और Meet microphone को अलग-अलग virtual devices या Loopback-style virtual device graph के माध्यम से route करें। एक single shared BlackHole device दूसरे participants को वापस call में echo कर सकता है।

command-pair Chrome bridge के साथ, `chrome.bargeInInputCommand` एक अलग local microphone को सुन सकता है और जब human बोलना शुरू करता है तो assistant playback clear कर सकता है। इससे human speech assistant output से आगे रहती है, भले ही shared BlackHole loopback input assistant playback के दौरान अस्थायी रूप से suppressed हो। `chrome.audioInputCommand` और `chrome.audioOutputCommand` की तरह, यह operator-configured local command है। एक explicit trusted command path या argument list का उपयोग करें, और इसे untrusted locations की scripts पर point न करें।

`googlemeet speak` Chrome session के लिए active talk-back audio bridge trigger करता है। `googlemeet leave` उस bridge को रोकता है। Voice Call plugin के माध्यम से delegated Twilio sessions के लिए, `leave` underlying voice call को भी hang up करता है। जब आप API-managed space के लिए active Google Meet conference को भी close करना चाहते हों, तो `googlemeet end-active-conference` का उपयोग करें।

## संबंधित

- [Voice call plugin](/hi/plugins/voice-call)
- [Talk mode](/hi/nodes/talk)
- [Plugins बनाना](/hi/plugins/building-plugins)
