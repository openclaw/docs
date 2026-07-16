---
read_when:
    - Android Node को पेयर करना या फिर से कनेक्ट करना
    - Android Gateway डिस्कवरी या प्रमाणीकरण की डीबगिंग
    - रिमोट Mac से Android डिवाइस को मिरर या नियंत्रित करना
    - क्लाइंटों के बीच चैट इतिहास की समानता सत्यापित करना
summary: 'Android ऐप (Node): कनेक्शन रनबुक + Connect/Chat/Voice/Canvas कमांड सरफ़ेस'
title: Android ऐप
x-i18n:
    generated_at: "2026-07-16T15:41:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
आधिकारिक Android ऐप [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) पर और समर्थित [GitHub Releases](https://github.com/openclaw/openclaw/releases) में हस्ताक्षरित स्वतंत्र APK के रूप में उपलब्ध है। यह एक सहायक Node है और इसके लिए चालू OpenClaw Gateway आवश्यक है। स्रोत: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([बिल्ड निर्देश](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md))।
</Note>

## समर्थन की संक्षिप्त स्थिति

- भूमिका: सहायक Node ऐप (Android Gateway को होस्ट नहीं करता)।
- Gateway आवश्यक: हाँ (इसे macOS, Linux या WSL2 के माध्यम से Windows पर चलाएँ)।
- इंस्टॉल करें: किसी समर्थित [GitHub Release](https://github.com/openclaw/openclaw/releases) से [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) या `OpenClaw-Android.apk`, Gateway के लिए [आरंभ करना](/hi/start/getting-started), फिर [पेयरिंग](/hi/channels/pairing)।
- Gateway: [रनबुक](/hi/gateway) + [कॉन्फ़िगरेशन](/hi/gateway/configuration)।
  - प्रोटोकॉल: [Gateway प्रोटोकॉल](/hi/gateway/protocol) (Node + नियंत्रण तल)।

सिस्टम नियंत्रण (launchd/systemd) Gateway होस्ट पर होता है — [Gateway](/hi/gateway) देखें।

## Google Play के बाहर इंस्टॉल करना

नियमित अंतिम और सुधारात्मक GitHub Releases में एक यूनिवर्सल `OpenClaw-Android.apk` और `OpenClaw-Android-SHA256SUMS.txt` शामिल होते हैं। APK को रिलीज़ टैग से बिल्ड किया जाता है, OpenClaw Android रिलीज़ कुंजी से हस्ताक्षरित किया जाता है और इसमें GitHub Actions की उत्पत्ति-संबंधी पुष्टि होती है।

ऐसी [रिलीज़](https://github.com/openclaw/openclaw/releases) चुनें जिसमें दोनों एसेट सूचीबद्ध हों, फिर साइडलोड करने से पहले ठीक उसी टैग को डाउनलोड और सत्यापित करें:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Google Play और स्वतंत्र APK इंस्टॉलेशन अलग अपडेट चैनलों का उपयोग करते हैं और उनकी हस्ताक्षर पहचान अलग हो सकती है। चैनल बदलने से पहले Android को मौजूदा ऐप अनइंस्टॉल करने की आवश्यकता हो सकती है, जिससे उसका स्थानीय ऐप डेटा हट जाता है। सामान्य अपडेट के लिए एक ही चैनल पर बने रहें।
</Warning>

## दूरस्थ Mac से Android को मिरर और नियंत्रित करना

[scrcpy](https://github.com/Genymobile/scrcpy) Android स्क्रीन को macOS विंडो में मिरर करता है और
Android Debug Bridge (ADB) के माध्यम से कीबोर्ड और पॉइंटर इनपुट अग्रेषित करता है। यह ऑपरेटर-पक्षीय
कार्यप्रवाह है, जो OpenClaw Node कनेक्शन से अलग है। यह तब उपयोगी है जब Android डिवाइस और
Mac अलग-अलग स्थानों पर हों, लेकिन एक निजी Tailscale नेटवर्क साझा करते हों।

### आरंभ करने से पहले

- Android डिवाइस और Mac पर Tailscale इंस्टॉल करें और दोनों को एक ही टेलनेट से कनेक्ट करें।
- Android पर **Developer options** और **USB debugging** सक्षम करें। Android 16 में **Wireless
  debugging**, **Settings > System > Developer options** के अंतर्गत होता है। [Android डेवलपर
  विकल्प](https://developer.android.com/studio/debug/dev-options) देखें।
- Mac पर scrcpy और ADB इंस्टॉल करें:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- पहले कनेक्शन के लिए Android डिवाइस उपलब्ध रखें। उस Mac द्वारा डिवाइस को नियंत्रित किए जाने से पहले Android को प्रत्येक Mac की ADB
  कुंजी स्वीकृत करनी होती है।

### TCP पर ADB सक्षम करना

आरंभिक सेटअप के लिए Android डिवाइस को USB से किसी विश्वसनीय कंप्यूटर से कनेक्ट करें और उसके
डीबगिंग संकेत को स्वीकृत करें। फिर चलाएँ:

```bash
adb devices
adb tcpip 5555
```

अब आप USB डिस्कनेक्ट कर सकते हैं। यदि डिवाइस रीबूट या डीबगिंग रीसेट के बाद पोर्ट 5555 सुनना बंद कर दे,
तो इस स्थानीय सेटअप चरण को दोहराएँ। Android 11 और उसके बाद के संस्करण आरंभिक विश्वास को
**Wireless debugging > Pair device with pairing code** और `adb pair` से भी स्थापित कर सकते हैं।

### केवल नियंत्रक Mac को अनुमति देना

प्रतिबंधात्मक अनुदान वाले टेलनेट को नियंत्रक Mac के लिए Android डिवाइस के TCP पोर्ट 5555 तक पहुँच की
स्पष्ट अनुमति देनी होगी। उदाहरण पतों को दोनों डिवाइस के स्थिर Tailscale IP से बदलते हुए,
टेलनेट नीति में एक सीमित नियम जोड़ें:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

होस्ट उपनामों और अन्य चयनकर्ताओं के लिए [Tailscale अनुदान](https://tailscale.com/docs/reference/syntax/grants) देखें।
इस पोर्ट को सार्वजनिक इंटरनेट की अनुमति न दें और न ही इसे Funnel से उजागर करें: अधिकृत ADB
क्लाइंट के पास डिवाइस का व्यापक नियंत्रण होता है।

### कनेक्ट करना और मिररिंग आरंभ करना

दूरस्थ Mac पर:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

इस Mac से पहला `adb connect` Android पर प्राधिकरण संवाद दिखाता है। डिवाइस अनलॉक करें,
कुंजी फ़िंगरप्रिंट की पुष्टि करें और केवल Mac के विश्वसनीय होने पर **Always allow from this computer** चुनें।
सफल `adb devices` प्रविष्टि का अंत `device` से होता है; `unauthorized` का अर्थ है कि डिवाइस पर संकेत
अभी स्वीकृत नहीं हुआ है।

scrcpy विंडो खुलने के बाद, इसका सीधे उपयोग करें या इसे [Peekaboo](https://peekaboo.sh/) जैसे किसी
macOS स्क्रीन-स्वचालन टूल से लक्षित करें। scrcpy डिस्प्ले और इनपुट पहुँचाता है; Tailscale केवल
निजी नेटवर्क पथ प्रदान करता है।

### समस्या निवारण

- `Connection timed out`: TCP 5555 के लिए टेलनेट अनुदान सत्यापित करें। सफल `tailscale ping`
  समकक्ष तक पहुँच सिद्ध करता है, यह नहीं कि नीति इस TCP पोर्ट को अनुमति देती है। Mac से
  `nc -vz <android-tailnet-ip> 5555` द्वारा परीक्षण करें।
- `unauthorized`: Android अनलॉक करके दूरस्थ Mac की ADB कुंजी स्वीकृत करें, या **Wireless debugging > Paired devices**
  के अंतर्गत पुराने वर्कस्टेशन को हटाकर उसे फिर से पेयर करें।
- `Connection refused`: स्थानीय रूप से फिर कनेक्ट करें और `adb tcpip 5555` दोबारा चलाएँ।
- एक से अधिक डिवाइस सूचीबद्ध हैं: स्पष्ट `--serial <android-tailnet-ip>:5555` आर्ग्युमेंट बनाए रखें।

काम पूरा होने पर scrcpy बंद करें और ADB डिस्कनेक्ट करें:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## कनेक्शन रनबुक

Android Node ऐप ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android सीधे Gateway WebSocket से कनेक्ट होता है और डिवाइस पेयरिंग (`role: node`) का उपयोग करता है।

Tailscale या सार्वजनिक होस्ट के लिए Android को सुरक्षित एंडपॉइंट की आवश्यकता होती है:

- वरीय: `https://<magicdns>` / `wss://<magicdns>` के साथ Tailscale Serve / Funnel
- यह भी समर्थित है: वास्तविक TLS एंडपॉइंट वाला कोई अन्य `wss://` Gateway URL
- क्लियरटेक्स्ट `ws://` निजी LAN पतों / `.local` होस्ट के साथ-साथ `localhost`, `127.0.0.1` और Android एमुलेटर ब्रिज (`10.0.2.2`) पर समर्थित रहता है; नॉन-लूपबैक सेटअप स्वचालित रूप से सीमित ऑपरेटर पहुँच का उपयोग करता है

### पूर्वापेक्षाएँ

- Gateway किसी अन्य मशीन पर चल रहा हो (या SSH के माध्यम से पहुँच योग्य हो)।
- Android डिवाइस/एमुलेटर Gateway WebSocket तक पहुँच सकता हो:
  - mDNS/NSD के साथ समान LAN, **या**
  - Wide-Area Bonjour / यूनिकास्ट DNS-SD का उपयोग करते हुए समान Tailscale टेलनेट (नीचे देखें), **या**
  - मैन्युअल Gateway होस्ट/पोर्ट (फ़ॉलबैक)
- टेलनेट/सार्वजनिक मोबाइल पेयरिंग रॉ टेलनेट IP `ws://` एंडपॉइंट का उपयोग **नहीं** करती। इसके बजाय Tailscale Serve या किसी अन्य `wss://` URL का उपयोग करें।
- पेयरिंग अनुरोध स्वीकृत करने के लिए Gateway मशीन पर (या SSH के माध्यम से) `openclaw` CLI उपलब्ध हो।

### 1. Gateway आरंभ करें

```bash
openclaw gateway --port 18789 --verbose
```

पुष्टि करें कि लॉग में आपको कुछ ऐसा दिखाई देता है:

- `listening on ws://0.0.0.0:18789`

Tailscale पर दूरस्थ Android पहुँच के लिए रॉ टेलनेट बाइंड के बजाय Serve/Funnel को प्राथमिकता दें:

```bash
openclaw gateway --tailscale serve
```

यह Android को सुरक्षित `wss://` / `https://` एंडपॉइंट देता है। जब तक आप अलग से TLS भी समाप्त नहीं करते, केवल `gateway.bind: "tailnet"` सेटअप पहली बार की दूरस्थ Android पेयरिंग के लिए पर्याप्त नहीं है।

### 2. खोज सत्यापित करें (वैकल्पिक)

Gateway मशीन से:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

डीबगिंग संबंधी अधिक टिप्पणियाँ: [Bonjour](/hi/gateway/bonjour)।

यदि आपने वाइड-एरिया खोज डोमेन भी कॉन्फ़िगर किया है, तो इसकी तुलना इससे करें:

```bash
openclaw gateway discover --json
```

यह TXT-केवल संकेतों के बजाय समाधान किए गए सेवा एंडपॉइंट का उपयोग करके एक ही बार में `local.` और कॉन्फ़िगर किया गया वाइड-एरिया डोमेन दिखाता है।

#### यूनिकास्ट DNS-SD के माध्यम से क्रॉस-नेटवर्क खोज

Android NSD/mDNS खोज नेटवर्कों के पार काम नहीं करती। यदि Android Node और Gateway अलग-अलग नेटवर्क पर हैं, लेकिन Tailscale के माध्यम से जुड़े हैं, तो इसके बजाय Wide-Area Bonjour / यूनिकास्ट DNS-SD का उपयोग करें। टेलनेट/सार्वजनिक Android पेयरिंग के लिए केवल खोज पर्याप्त नहीं है — खोजे गए मार्ग को अब भी सुरक्षित एंडपॉइंट (`wss://` या Tailscale Serve) की आवश्यकता होती है:

1. Gateway होस्ट पर DNS-SD ज़ोन (उदाहरण `openclaw.internal.`) सेट अप करें और `_openclaw-gw._tcp` रिकॉर्ड प्रकाशित करें।
2. अपने चुने हुए डोमेन के लिए उस DNS सर्वर की ओर संकेत करने वाला Tailscale स्प्लिट DNS कॉन्फ़िगर करें।

विवरण और उदाहरण CoreDNS कॉन्फ़िगरेशन: [Bonjour](/hi/gateway/bonjour)।

### 3. Android से कनेक्ट करें

Android ऐप में:

- ऐप **foreground service** (स्थायी सूचना) के माध्यम से अपने Gateway कनेक्शन को सक्रिय रखता है।
- **Connect** टैब खोलें।
- **Setup Code** या **Manual** मोड का उपयोग करें।
- यदि खोज अवरुद्ध है, तो **Advanced controls** में मैन्युअल होस्ट/पोर्ट का उपयोग करें। निजी LAN होस्ट के लिए `ws://` अब भी काम करता है। Tailscale/सार्वजनिक होस्ट के लिए TLS चालू करें और `wss://` / Tailscale Serve एंडपॉइंट का उपयोग करें।

पहली सफल पेयरिंग के बाद, ऐप लॉन्च होने पर सक्रिय पेयर किए गए Gateway से Android स्वतः पुनः कनेक्ट होता है (खोजे गए Gateway के लिए यथासंभव, जिन्हें नेटवर्क पर दिखाई देना चाहिए)।

आधिकारिक सेटअप कोड Android को Node के रूप में कनेक्ट करते हैं और `wss://` पर डिफ़ॉल्ट रूप से पूर्ण Gateway ऑपरेटर
पहुँच प्रदान करते हैं। प्लेनटेक्स्ट नॉन-लूपबैक `ws://` सेटअप
बेयरर-टोकन सुरक्षा के लिए स्वचालित रूप से सीमित पहुँच का उपयोग करता है। **Settings → Gateway**
**Full** या **Limited** पहुँच दिखाता है। सीमित कनेक्शन के लिए
`wss://` या Tailscale Serve कॉन्फ़िगर करें, Control UI में या
`openclaw qr` से नया पूर्ण-पहुँच कोड बनाएँ, फिर उस पृष्ठ पर उसे स्कैन या पेस्ट करके पुनः कनेक्ट करें। जो ऑपरेटर
घटी हुई प्रोफ़ाइल चाहते हैं, वे Control UI में **Limited access** चुन सकते हैं या
`openclaw qr --limited` चला सकते हैं।

### एकाधिक Gateway

ऐप अपने साथ पेयर किए गए प्रत्येक Gateway की रजिस्ट्री रखता है, ताकि आप दोबारा पेयर किए बिना उनके बीच स्विच कर सकें:

- **Settings -> Gateways** में पेयर किए गए Gateway सूचीबद्ध होते हैं और सक्रिय Gateway चिह्नित होता है। स्विच करने के लिए किसी प्रविष्टि पर टैप करें; ऐप मौजूदा सत्र समाप्त करके चयनित Gateway से पुनः कनेक्ट होता है।
- एक से अधिक Gateway पेयर होने पर **Connect** टैब एक त्वरित स्विचर दिखाता है।
- क्रेडेंशियल, डिवाइस टोकन, TLS विश्वास, चैट इतिहास और कतारबद्ध ऑफ़लाइन संदेश प्रत्येक Gateway के अनुसार संग्रहीत होते हैं। स्विच करने पर अलग-अलग Gateway की स्थिति कभी मिश्रित नहीं होती और ऑफ़लाइन रहते हुए कतारबद्ध संदेश केवल उसी Gateway को पहुँचाए जाते हैं जिसके लिए वे लिखे गए थे।
- **Forget** किसी Gateway की रजिस्ट्री प्रविष्टि को उसके क्रेडेंशियल, डिवाइस टोकन, TLS पिन और कैश किए गए चैट सहित हटा देता है।

### उपस्थिति सक्रियता बीकन

प्रमाणित Node सत्र कनेक्ट होने के बाद, और foreground service के जुड़े रहने के दौरान ऐप के पृष्ठभूमि में जाने पर, Android `event: "node.presence.alive"` के साथ `node.event` को कॉल करता है। प्रमाणित Node डिवाइस पहचान ज्ञात होने के बाद ही Gateway इसे पेयर किए गए Node/डिवाइस मेटाडेटा पर `lastSeenAtMs`/`lastSeenReason` के रूप में दर्ज करता है।

ऐप बीकन को सफलतापूर्वक दर्ज हुआ तभी मानता है जब Gateway प्रतिक्रिया में `handled: true` शामिल हो। पुराने Gateway `{ "ok": true }` के साथ `node.event` को स्वीकार कर सकते हैं; वह प्रतिक्रिया संगत है, लेकिन टिकाऊ अंतिम-दृश्य अपडेट के रूप में नहीं गिनी जाती।

### 4. पेयरिंग स्वीकृत करें (CLI)

Gateway मशीन पर:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

पेयरिंग विवरण: [पेयरिंग](/hi/channels/pairing)।

वैकल्पिक: यदि Android Node हमेशा कड़े नियंत्रण वाले सबनेट से कनेक्ट होता है, तो आप स्पष्ट CIDR या सटीक IP के साथ पहली बार Node की स्वतः-स्वीकृति चुन सकते हैं:

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

यह डिफ़ॉल्ट रूप से अक्षम है। यह केवल बिना किसी अनुरोधित स्कोप वाली नई `role: node` पेयरिंग पर लागू होता है। ऑपरेटर/ब्राउज़र पेयरिंग और भूमिका, स्कोप, मेटाडेटा या सार्वजनिक कुंजी में किसी भी बदलाव के लिए अब भी मैन्युअल स्वीकृति आवश्यक है।

### 5. सत्यापित करें कि Node कनेक्ट है

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. चैट + इतिहास

Android का Chat टैब सेशन चयन का समर्थन करता है (डिफ़ॉल्ट `main`, साथ ही अन्य मौजूदा सेशन):

- इतिहास: `chat.history` (डिस्प्ले के लिए सामान्यीकृत — इनलाइन डायरेक्टिव टैग, प्लेन-टेक्स्ट टूल-कॉल XML पेलोड (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` और उनके संक्षिप्त वेरिएंट), तथा लीक हुए ASCII/पूर्ण-चौड़ाई मॉडल नियंत्रण टोकन हटा दिए जाते हैं; केवल साइलेंट-टोकन वाली सहायक पंक्तियाँ, जैसे सटीक `NO_REPLY` / `no_reply`, छोड़ दी जाती हैं; अत्यधिक बड़ी पंक्तियों को प्लेसहोल्डर से बदला जा सकता है)
- भेजें: `chat.send`
- टिकाऊ प्रेषण: प्रत्येक प्रेषण (टेक्स्ट, चुनी गई छवियाँ और वॉइस नोट) किसी भी नेटवर्क प्रयास से पहले प्रति-Gateway ऑन-डिवाइस आउटबॉक्स में दर्ज किया जाता है, इसलिए ऐप बंद होने पर सबमिट किया गया इनपुट नष्ट नहीं हो सकता। ऑफ़लाइन रहते हुए कतारबद्ध प्रेषण दोबारा कनेक्ट होने पर स्थिर आइडेम्पोटेंसी कुंजियों के साथ क्रम से डिलीवर होते हैं, और किसी प्रेषण को केवल तभी हटाया जाता है जब टर्न कैनोनिकल `chat.history` में दिखाई देने लगे — केवल अभिस्वीकृति को डिलीवरी का प्रमाण नहीं माना जाता। अस्पष्ट परिणाम (अभिस्वीकृति खोना, प्रेषण के बीच ऐप बंद होना, ट्रांसक्रिप्ट लिखे जाने से पहले Gateway पुनः शुरू होना) स्वतः दोबारा भेजने के बजाय स्पष्ट **पुनः प्रयास करें**/**हटाएँ** विकल्पों वाली दृश्यमान पंक्तियों के रूप में दिखते हैं। स्लैश कमांड दोबारा कनेक्ट होने पर कभी स्वतः रिप्ले नहीं होते; वे स्पष्ट पुनः प्रयास के लिए रुके रहते हैं। कतार सीमित है (प्रति Gateway 50 संदेश और 48 MB अटैचमेंट बाइट), और न भेजी गई पंक्तियाँ 48 घंटे बाद समाप्त हो जाती हैं। कभी सबमिट न किए गए कंपोज़र ड्राफ़्ट प्रोसेस-टिकाऊ नहीं होते।
- पुश अपडेट (सर्वोत्तम प्रयास): `chat.subscribe` -> `event:"chat"`
- सुनें: किसी सहायक संदेश को देर तक दबाएँ और उसे सुनने के लिए **सुनें** चुनें; ऑडियो कॉन्फ़िगर की गई TTS प्रदाता शृंखला के साथ Gateway `tts.speak` के माध्यम से रेंडर होता है, और जब Gateway ऑडियो रेंडर नहीं कर सकता तब ऑन-डिवाइस सिस्टम TTS का उपयोग होता है। सेशन बदलने, नई चैट शुरू करने, ऐप के बैकग्राउंड में जाने या चैट बंद होने पर प्लेबैक रुक जाता है।

### 7. कैनवास + कैमरा

#### Gateway कैनवास होस्ट (वेब सामग्री के लिए अनुशंसित)

Node पर वास्तविक HTML/CSS/JS दिखाने के लिए, जिसे एजेंट डिस्क पर संपादित कर सके, Node को Gateway कैनवास होस्ट की ओर इंगित करें।

<Note>
Node, Gateway HTTP सर्वर से कैनवास लोड करते हैं (`gateway.port` वाला ही पोर्ट, डिफ़ॉल्ट `18789`)।
</Note>

1. Gateway होस्ट पर `~/.openclaw/workspace/canvas/index.html` बनाएँ।
2. Node को वहाँ ले जाएँ (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

टेलनेट (वैकल्पिक): यदि दोनों डिवाइस Tailscale पर हैं, तो `.local` के बजाय MagicDNS नाम या टेलनेट IP का उपयोग करें, जैसे `http://<gateway-magicdns>:18789/__openclaw__/canvas/`।

यह सर्वर HTML में लाइव-रीलोड क्लाइंट इंजेक्ट करता है और फ़ाइल बदलने पर पुनः लोड करता है। Gateway `/__openclaw__/a2ui/` भी सर्व करता है, लेकिन Android ऐप दूरस्थ A2UI पेजों को केवल रेंडरिंग के लिए मानता है। कार्रवाई-सक्षम A2UI कमांड बंडल किए गए, ऐप के स्वामित्व वाले A2UI पेज का उपयोग करते हैं।

कैनवास कमांड (केवल फ़ोरग्राउंड में):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (डिफ़ॉल्ट स्कैफ़ोल्ड पर लौटने के लिए `{"url":""}` या `{"url":"/"}` का उपयोग करें)। `canvas.snapshot`, `{ format, base64 }` लौटाता है (डिफ़ॉल्ट `format="jpeg"`)।
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` लीगेसी उपनाम)। ये कार्रवाई-सक्षम रेंडरिंग के लिए बंडल किए गए, ऐप के स्वामित्व वाले A2UI पेज का उपयोग करते हैं।

कैमरा कमांड (केवल फ़ोरग्राउंड में; अनुमति-नियंत्रित): `camera.snap` (jpg), `camera.clip` (mp4)। पैरामीटर और CLI सहायकों के लिए [कैमरा Node](/hi/nodes/camera) देखें।

### 8. वॉइस + विस्तृत Android कमांड सतह

- Voice टैब: Android में दो स्पष्ट कैप्चर मोड हैं। **Mic** एक मैन्युअल Voice-टैब सेशन है, जो प्रत्येक विराम को चैट टर्न के रूप में भेजता है और ऐप के फ़ोरग्राउंड छोड़ने या उपयोगकर्ता के Voice टैब छोड़ने पर रुक जाता है। **Talk** निरंतर Talk Mode है और बंद किए जाने या Node के डिस्कनेक्ट होने तक सुनता रहता है।
- Talk Mode, कैप्चर शुरू होने से पहले मौजूदा फ़ोरग्राउंड सेवा को `connectedDevice` से `connectedDevice|microphone` में पदोन्नत करता है, फिर Talk Mode रुकने पर उसे पदावनत करता है। Node सेवा `FOREGROUND_SERVICE_CONNECTED_DEVICE` को `CHANGE_NETWORK_STATE` के साथ घोषित करती है; Android 14+ को `FOREGROUND_SERVICE_MICROPHONE` घोषणा, `RECORD_AUDIO` रनटाइम अनुमति और रनटाइम पर माइक्रोफ़ोन सेवा प्रकार भी आवश्यक हैं।
- डिफ़ॉल्ट रूप से, Android Talk नेटिव वाक् पहचान, Gateway चैट और कॉन्फ़िगर किए गए Gateway Talk प्रदाता के माध्यम से `talk.speak` का उपयोग करता है। स्थानीय सिस्टम TTS का उपयोग केवल तब होता है जब `talk.speak` उपलब्ध नहीं होता।
- Android Talk रीयलटाइम Gateway रिले का उपयोग केवल तभी करता है जब `talk.realtime.mode`, `realtime` हो और `talk.realtime.transport`, `gateway-relay` हो।
- Android, `voiceWake` क्षमता का विज्ञापन नहीं करता। वॉइस इनपुट के लिए **Mic** या **Talk** का उपयोग करें।
- अतिरिक्त Android कमांड परिवार (उपलब्धता डिवाइस, अनुमतियों और उपयोगकर्ता सेटिंग्स पर निर्भर करती है):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` केवल तब, जब **Settings > Phone Capabilities > Installed Apps** सक्षम हो; यह डिफ़ॉल्ट रूप से लॉन्चर में दिखाई देने वाले ऐप सूचीबद्ध करता है (पूरी सूची के लिए `includeNonLaunchable` पास करें)।
  - `notifications.list`, `notifications.actions` (नीचे [सूचना अग्रेषण](#notification-forwarding) देखें)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. वर्कस्पेस फ़ाइलें (केवल पढ़ने योग्य)

Home अवलोकन में एक **फ़ाइलें** कार्ड होता है, जो केवल-पढ़ने योग्य `agents.workspace.list` / `agents.workspace.get` Gateway RPC के माध्यम से सक्रिय एजेंट का वर्कस्पेस ब्राउज़ करता है: डायरेक्टरी में क्रमिक प्रवेश, टेक्स्ट और छवि पूर्वावलोकन तथा Android शेयर शीट के माध्यम से निर्यात। कोई लेखन कार्रवाई नहीं होती, और पूर्वावलोकनों का आकार Gateway द्वारा सीमित होता है।

## कमांड स्वीकृतियों की समीक्षा करें

`operator.admin` वाला ऑपरेटर कनेक्शन, या Gateway द्वारा स्पष्ट रूप से लक्षित पेयर किया गया
`operator.approvals` कनेक्शन, **Settings -> Approvals** के अंतर्गत लंबित exec अनुरोधों की समीक्षा कर सकता है। ऐप अपने बटन सक्षम करने से पहले
Gateway का सैनिटाइज़ किया गया स्वीकृति रिकॉर्ड लोड करता है, सुरक्षा संबंधी कोई भी
चेतावनी और उस अनुरोध द्वारा प्रस्तुत सटीक निर्णय दिखाता है, और स्वीकृति ID तथा
स्वामी प्रकार को वापस Gateway में सबमिट करता है।

स्वीकृति स्थिति Control UI और समर्थित चैट सतहों के साथ साझा होती है।
पहला प्रतिबद्ध उत्तर मान्य होता है; किसी अन्य सतह से पहले उत्तर दिए जाने पर भी Android वही कैनोनिकल परिणाम दिखाता है।
यदि समाधान प्रतिक्रिया खो जाती है या Gateway
डिस्कनेक्ट हो जाता है, तो ऐप कार्रवाई को लॉक रखता है और कोई अन्य निर्णय
प्रस्तुत करने से पहले स्वीकृति को दोबारा पढ़ता है।

एकीकृत स्वीकृति विधियों से पुराने Gateway, जारी किए गए
exec-विशिष्ट तरीकों पर फ़ॉलबैक करते हैं। लंबित समीक्षा अब भी काम करती है, लेकिन संरक्षित टर्मिनल स्थिति
और अधिक समृद्ध क्रॉस-सतह परिणाम के लिए अपडेट किया गया Gateway आवश्यक है।

## सहायक प्रवेश बिंदु

Android सिस्टम सहायक ट्रिगर (Google Assistant) से OpenClaw लॉन्च करने का समर्थन करता है। होम बटन दबाए रखने (या किसी अन्य `ACTION_ASSIST` ट्रिगर) पर ऐप खुलता है; "Hey Google, ask OpenClaw `<prompt>`" कहने पर यह ऐप के घोषित App Actions क्वेरी पैटर्न से मेल खाता है और प्रॉम्प्ट को स्वतः भेजे बिना चैट कंपोज़र में डाल देता है।

यह ऐप मेनिफ़ेस्ट में घोषित Android **App Actions** (`shortcuts.xml` क्षमता) का उपयोग करता है। Gateway-साइड कॉन्फ़िगरेशन की आवश्यकता नहीं है — सहायक इंटेंट पूरी तरह Android ऐप द्वारा संभाला जाता है।

<Note>
App Actions की उपलब्धता डिवाइस, Google Play Services संस्करण और इस बात पर निर्भर करती है कि उपयोगकर्ता ने OpenClaw को डिफ़ॉल्ट सहायक ऐप के रूप में सेट किया है या नहीं।
</Note>

## सूचना अग्रेषण

Android डिवाइस सूचनाओं को `node.event` आइटम के रूप में Gateway पर अग्रेषित कर सकता है। इसे ऐप की Settings शीट में **डिवाइस पर** कॉन्फ़िगर किया जाता है — Gateway/`openclaw.json` कॉन्फ़िगरेशन में नहीं।

| सेटिंग                      | विवरण                                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | मुख्य टॉगल। डिफ़ॉल्ट रूप से बंद; पहले Notification Listener Access प्रदान करना आवश्यक है।                                                                                                              |
| Package Filter              | **Allowlist** (केवल सूचीबद्ध पैकेज ID अग्रेषित होते हैं) या **Blocklist** (डिफ़ॉल्ट: सूचीबद्ध ID को छोड़कर सभी पैकेज)। अग्रेषण लूप रोकने के लिए Blocklist मोड में OpenClaw का अपना पैकेज हमेशा बाहर रखा जाता है। |
| Quiet Hours                 | स्थानीय HH:mm आरंभ/समाप्ति विंडो, जो अग्रेषण रोकती है। डिफ़ॉल्ट रूप से अक्षम; सक्षम होने पर डिफ़ॉल्ट `22:00`-`07:00`।                                                              |
| Max Events / Minute         | अग्रेषित सूचनाओं पर प्रति-डिवाइस दर सीमा। डिफ़ॉल्ट 20।                                                                                                                                                   |
| Route Session Key           | वैकल्पिक। अग्रेषित सूचना इवेंट को डिवाइस के डिफ़ॉल्ट सूचना रूट के बजाय किसी विशिष्ट सेशन में पिन करता है।                                                                                                |

<Note>
सूचना अग्रेषण के लिए Android Notification Listener अनुमति आवश्यक है। ऐप सेटअप के दौरान इसके लिए संकेत देता है।
</Note>

WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord और Signal की सूचनाएँ हमेशा बाहर रखी जाती हैं। उनके संदेश पहले से नेटिव OpenClaw चैनल सेशन के स्वामित्व में होते हैं; Android सूचना को अलग Node इवेंट के रूप में अग्रेषित करने से उत्तर गलत बातचीत के माध्यम से रूट हो सकता है।

## संबंधित

- [iOS ऐप](/hi/platforms/ios)
- [Node](/hi/nodes)
- [Android Node समस्या निवारण](/hi/nodes/troubleshooting)
