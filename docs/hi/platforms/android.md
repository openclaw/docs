---
read_when:
    - Android Node को पेयर करना या फिर से कनेक्ट करना
    - Android Gateway खोज या प्रमाणीकरण को डीबग करना
    - क्लाइंट्स में चैट इतिहास समानता सत्यापित करना
summary: 'Android ऐप (node): कनेक्शन रनबुक + कनेक्ट/चैट/वॉइस/कैनवास कमांड सतह'
title: Android ऐप
x-i18n:
    generated_at: "2026-06-28T23:27:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
आधिकारिक Android ऐप [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) पर उपलब्ध है। यह एक साथी नोड है और इसके लिए चलता हुआ OpenClaw Gateway आवश्यक है। स्रोत कोड [OpenClaw रिपॉज़िटरी](https://github.com/openclaw/openclaw) में `apps/android` के अंतर्गत भी उपलब्ध है; बिल्ड निर्देशों के लिए [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) देखें।
</Note>

## समर्थन स्नैपशॉट

- भूमिका: साथी नोड ऐप (Android Gateway होस्ट नहीं करता)।
- Gateway आवश्यक: हाँ (इसे macOS, Linux, या WSL2 के माध्यम से Windows पर चलाएँ)।
- इंस्टॉल करें: ऐप के लिए [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN), Gateway के लिए [प्रारंभ करना](/hi/start/getting-started), फिर [पेयरिंग](/hi/channels/pairing)।
- Gateway: [रनबुक](/hi/gateway) + [कॉन्फ़िगरेशन](/hi/gateway/configuration)।
  - प्रोटोकॉल: [Gateway प्रोटोकॉल](/hi/gateway/protocol) (नोड + नियंत्रण प्लेन)।

## सिस्टम नियंत्रण

सिस्टम नियंत्रण (launchd/systemd) Gateway होस्ट पर रहता है। [Gateway](/hi/gateway) देखें।

## कनेक्शन रनबुक

Android नोड ऐप ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android सीधे Gateway WebSocket से जुड़ता है और डिवाइस पेयरिंग (`role: node`) का उपयोग करता है।

Tailscale या सार्वजनिक होस्ट के लिए, Android को सुरक्षित एंडपॉइंट चाहिए:

- प्राथमिकता: Tailscale Serve / Funnel, `https://<magicdns>` / `wss://<magicdns>` के साथ
- समर्थित भी: वास्तविक TLS एंडपॉइंट वाला कोई अन्य `wss://` Gateway URL
- क्लियरटेक्स्ट `ws://` निजी LAN पतों / `.local` होस्टों, साथ ही `localhost`, `127.0.0.1`, और Android एम्युलेटर ब्रिज (`10.0.2.2`) पर समर्थित रहता है

### पूर्वापेक्षाएँ

- आप "मास्टर" मशीन पर Gateway चला सकते हैं।
- Android डिवाइस/एम्युलेटर Gateway WebSocket तक पहुँच सकता है:
  - mDNS/NSD के साथ वही LAN, **या**
  - Wide-Area Bonjour / unicast DNS-SD का उपयोग करके वही Tailscale tailnet (नीचे देखें), **या**
  - मैनुअल Gateway होस्ट/पोर्ट (fallback)
- Tailnet/सार्वजनिक मोबाइल पेयरिंग कच्चे tailnet IP `ws://` एंडपॉइंट का उपयोग **नहीं** करती। इसके बजाय Tailscale Serve या किसी अन्य `wss://` URL का उपयोग करें।
- आप Gateway मशीन पर CLI (`openclaw`) चला सकते हैं (या SSH के माध्यम से)।

### 1) Gateway शुरू करें

```bash
openclaw gateway --port 18789 --verbose
```

लॉग में पुष्टि करें कि आपको कुछ ऐसा दिखता है:

- `listening on ws://0.0.0.0:18789`

Tailscale पर दूरस्थ Android पहुँच के लिए, कच्चे tailnet bind के बजाय Serve/Funnel को प्राथमिकता दें:

```bash
openclaw gateway --tailscale serve
```

यह Android को सुरक्षित `wss://` / `https://` एंडपॉइंट देता है। केवल `gateway.bind: "tailnet"` सेटअप पहली बार दूरस्थ Android पेयरिंग के लिए पर्याप्त नहीं है, जब तक आप अलग से TLS टर्मिनेट न करें।

### 2) डिस्कवरी सत्यापित करें (वैकल्पिक)

Gateway मशीन से:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

अधिक डिबगिंग नोट्स: [Bonjour](/hi/gateway/bonjour)।

यदि आपने wide-area डिस्कवरी डोमेन भी कॉन्फ़िगर किया है, तो इससे तुलना करें:

```bash
openclaw gateway discover --json
```

यह `local.` और कॉन्फ़िगर किए गए wide-area डोमेन को एक ही पास में दिखाता है और TXT-केवल संकेतों के बजाय resolved
सेवा एंडपॉइंट का उपयोग करता है।

#### unicast DNS-SD के माध्यम से Tailnet (Vienna ⇄ London) डिस्कवरी

Android NSD/mDNS डिस्कवरी नेटवर्कों के पार नहीं जाएगी। यदि आपका Android नोड और Gateway अलग-अलग नेटवर्कों पर हैं लेकिन Tailscale के माध्यम से जुड़े हैं, तो इसके बजाय Wide-Area Bonjour / unicast DNS-SD का उपयोग करें।

केवल डिस्कवरी tailnet/सार्वजनिक Android पेयरिंग के लिए पर्याप्त नहीं है। खोजे गए रूट को फिर भी सुरक्षित एंडपॉइंट (`wss://` या Tailscale Serve) चाहिए:

1. Gateway होस्ट पर DNS-SD ज़ोन (उदाहरण `openclaw.internal.`) सेट अप करें और `_openclaw-gw._tcp` रिकॉर्ड प्रकाशित करें।
2. अपने चुने हुए डोमेन के लिए Tailscale split DNS कॉन्फ़िगर करें, जो उस DNS सर्वर की ओर संकेत करे।

विवरण और उदाहरण CoreDNS कॉन्फ़िगरेशन: [Bonjour](/hi/gateway/bonjour)।

### 3) Android से कनेक्ट करें

Android ऐप में:

- ऐप अपनी Gateway कनेक्शन को **फ़ोरग्राउंड सेवा** (स्थायी नोटिफ़िकेशन) के माध्यम से जीवित रखता है।
- **कनेक्ट** टैब खोलें।
- **सेटअप कोड** या **मैनुअल** मोड का उपयोग करें।
- यदि डिस्कवरी अवरुद्ध है, तो **उन्नत नियंत्रण** में मैनुअल होस्ट/पोर्ट का उपयोग करें। निजी LAN होस्टों के लिए, `ws://` अभी भी काम करता है। Tailscale/सार्वजनिक होस्टों के लिए, TLS चालू करें और `wss://` / Tailscale Serve एंडपॉइंट का उपयोग करें।

पहली सफल पेयरिंग के बाद, Android लॉन्च पर अपने-आप फिर से कनेक्ट होता है:

- मैनुअल एंडपॉइंट (यदि सक्षम हो), अन्यथा
- पिछला खोजा गया Gateway (सर्वोत्तम प्रयास)।

### Presence alive बीकन

प्रमाणित नोड सत्र कनेक्ट होने के बाद, और जब ऐप पृष्ठभूमि में चला जाता है जबकि
फ़ोरग्राउंड सेवा अभी भी कनेक्टेड होती है, Android `node.event` को
`event: "node.presence.alive"` के साथ कॉल करता है। Gateway इसे पेयर किए गए नोड/डिवाइस मेटाडेटा पर
`lastSeenAtMs`/`lastSeenReason` के रूप में तभी रिकॉर्ड करता है जब प्रमाणित नोड डिवाइस पहचान ज्ञात हो।

ऐप बीकन को सफलतापूर्वक रिकॉर्ड किया गया तभी मानता है जब Gateway प्रतिक्रिया में
`handled: true` शामिल हो। पुराने Gateways `node.event` को `{ "ok": true }` के साथ स्वीकार कर सकते हैं; वह प्रतिक्रिया
संगत है लेकिन टिकाऊ last-seen अपडेट के रूप में नहीं गिनी जाती।

### 4) पेयरिंग अनुमोदित करें (CLI)

Gateway मशीन पर:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

पेयरिंग विवरण: [पेयरिंग](/hi/channels/pairing)।

वैकल्पिक: यदि Android नोड हमेशा कड़े नियंत्रण वाले subnet से कनेक्ट होता है,
तो आप स्पष्ट CIDR या exact IPs के साथ पहली बार नोड auto-approval में opt in कर सकते हैं:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

यह डिफ़ॉल्ट रूप से अक्षम है। यह केवल नए `role: node` पेयरिंग पर लागू होता है, जहाँ
कोई requested scopes नहीं हैं। Operator/browser पेयरिंग और कोई भी role, scope, metadata, या
public-key बदलाव अब भी मैनुअल approval मांगता है।

### 5) सत्यापित करें कि नोड कनेक्टेड है

- नोड स्थिति के माध्यम से:

  ```bash
  openclaw nodes status
  ```

- Gateway के माध्यम से:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) चैट + इतिहास

Android चैट टैब सत्र चयन का समर्थन करता है (डिफ़ॉल्ट `main`, साथ ही अन्य मौजूदा सत्र):

- इतिहास: `chat.history` (display-normalized; inline directive tags को
  visible text से हटाया जाता है, plain-text tool-call XML payloads (जिसमें
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और
  truncated tool-call blocks शामिल हैं) और leaked ASCII/full-width model control tokens
  हटाए जाते हैं, exact `NO_REPLY` /
  `no_reply` जैसी pure silent-token assistant rows छोड़ी जाती हैं, और oversized rows को placeholders से बदला जा सकता है)
- भेजें: `chat.send`
- Push updates (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + कैमरा

#### Gateway Canvas Host (वेब सामग्री के लिए अनुशंसित)

यदि आप चाहते हैं कि नोड वास्तविक HTML/CSS/JS दिखाए जिसे एजेंट डिस्क पर संपादित कर सके, तो नोड को Gateway canvas host की ओर इंगित करें।

<Note>
नोड Gateway HTTP सर्वर से canvas लोड करते हैं (`gateway.port` जैसा ही पोर्ट, डिफ़ॉल्ट `18789`)।
</Note>

1. Gateway होस्ट पर `~/.openclaw/workspace/canvas/index.html` बनाएँ।

2. नोड को उस पर नेविगेट करें (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (वैकल्पिक): यदि दोनों डिवाइस Tailscale पर हैं, तो `.local` के बजाय MagicDNS नाम या tailnet IP का उपयोग करें, जैसे `http://<gateway-magicdns>:18789/__openclaw__/canvas/`।

यह सर्वर HTML में live-reload client इंजेक्ट करता है और फ़ाइल बदलावों पर reload करता है।
Gateway `/__openclaw__/a2ui/` भी serve करता है, लेकिन Android ऐप remote A2UI pages को render-only मानता है। Action-capable A2UI commands messages लागू करने से पहले bundled app-owned A2UI page का उपयोग करते हैं।

Canvas commands (केवल foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (डिफ़ॉल्ट scaffold पर लौटने के लिए `{"url":""}` या `{"url":"/"}` का उपयोग करें)। `canvas.snapshot` `{ format, base64 }` लौटाता है (डिफ़ॉल्ट `format="jpeg"`)।
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` legacy alias)। ये commands action-capable rendering के लिए bundled app-owned A2UI page का उपयोग करते हैं।

कैमरा commands (केवल foreground; permission-gated):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

पैरामीटर और CLI helpers के लिए [Camera node](/hi/nodes/camera) देखें।

### 8) वॉइस + विस्तृत Android command surface

- वॉइस टैब: Android में दो explicit capture modes हैं। **Mic** एक मैनुअल वॉइस-टैब सत्र है जो प्रत्येक pause को chat turn के रूप में भेजता है और ऐप के foreground छोड़ने या उपयोगकर्ता के वॉइस टैब छोड़ने पर रुक जाता है। **Talk** निरंतर Talk Mode है और toggled off होने या नोड disconnect होने तक सुनता रहता है।
- Talk Mode capture शुरू होने से पहले मौजूदा foreground service को `connectedDevice` से `connectedDevice|microphone` में promote करता है, फिर Talk Mode रुकने पर उसे demote करता है। नोड सेवा `CHANGE_NETWORK_STATE` के साथ `FOREGROUND_SERVICE_CONNECTED_DEVICE` घोषित करती है; Android 14+ को `FOREGROUND_SERVICE_MICROPHONE` घोषणा, `RECORD_AUDIO` runtime grant, और runtime पर microphone service type भी चाहिए।
- डिफ़ॉल्ट रूप से, Android Talk native speech recognition, Gateway chat, और configured gateway Talk provider के माध्यम से `talk.speak` का उपयोग करता है। Local system TTS का उपयोग केवल तब होता है जब `talk.speak` उपलब्ध नहीं होता।
- Android Talk realtime Gateway relay का उपयोग केवल तब करता है जब `talk.realtime.mode` `realtime` हो और `talk.realtime.transport` `gateway-relay` हो।
- वॉइस wake Android UX/runtime में अक्षम रहता है।
- अतिरिक्त Android command families (उपलब्धता डिवाइस, permissions, और user settings पर निर्भर करती है):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` केवल तब जब **Settings > Phone Capabilities > Installed Apps** सक्षम हो; यह डिफ़ॉल्ट रूप से launcher-visible apps सूचीबद्ध करता है।
  - `notifications.list`, `notifications.actions` (नीचे [नोटिफ़िकेशन फ़ॉरवर्डिंग](#notification-forwarding) देखें)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## सहायक entrypoints

Android system assistant trigger (Google
Assistant) से OpenClaw launch करने का समर्थन करता है। कॉन्फ़िगर होने पर, home button दबाए रखना या "Hey Google, ask
OpenClaw..." कहना ऐप खोलता है और prompt को chat composer में सौंप देता है।

यह ऐप manifest में घोषित Android **App Actions** metadata का उपयोग करता है। Gateway side पर कोई
अतिरिक्त configuration आवश्यक नहीं है -- assistant intent पूरी तरह Android ऐप द्वारा
handled होता है और सामान्य chat message के रूप में forward किया जाता है।

<Note>
App Actions availability डिवाइस, Google Play Services version,
और इस बात पर निर्भर करती है कि उपयोगकर्ता ने OpenClaw को default assistant app के रूप में set किया है या नहीं।
</Note>

## नोटिफ़िकेशन फ़ॉरवर्डिंग

Android डिवाइस notifications को events के रूप में Gateway को forward कर सकता है। कई controls आपको scope करने देते हैं कि कौन-से notifications forward हों और कब।

| कुंजी                            | प्रकार         | विवरण                                                                                           |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | केवल इन package names से notifications forward करें। यदि set है, तो अन्य सभी packages ignored होते हैं। |
| `notifications.denyPackages`     | string[]       | इन package names से notifications कभी forward न करें। `allowPackages` के बाद applied होता है। |
| `notifications.quietHours.start` | string (HH:mm) | quiet hours window की शुरुआत (local device time)। इस window के दौरान notifications suppressed होते हैं। |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hours window का अंत।                                                                      |
| `notifications.rateLimit`        | number         | प्रति package प्रति minute अधिकतम forwarded notifications। अतिरिक्त notifications dropped होते हैं। |

notification picker forwarded notification events के लिए safer behavior भी उपयोग करता है, जिससे sensitive system notifications की accidental forwarding रुकती है।

उदाहरण कॉन्फ़िगरेशन:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
सूचना फ़ॉरवर्डिंग के लिए Android Notification Listener अनुमति आवश्यक है। सेटअप के दौरान ऐप इसके लिए संकेत देता है।
</Note>

## संबंधित

- [iOS ऐप](/hi/platforms/ios)
- [नोड्स](/hi/nodes)
- [Android नोड समस्या निवारण](/hi/nodes/troubleshooting)
