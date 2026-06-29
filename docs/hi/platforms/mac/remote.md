---
read_when:
    - दूरस्थ Mac नियंत्रण सेट अप करना या डिबग करना
summary: दूरस्थ OpenClaw Gateway को नियंत्रित करने के लिए macOS ऐप प्रवाह
title: रिमोट कंट्रोल
x-i18n:
    generated_at: "2026-06-28T23:29:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

यह फ्लो macOS ऐप को किसी दूसरे होस्ट (डेस्कटॉप/सर्वर) पर चल रहे OpenClaw Gateway के लिए पूर्ण रिमोट कंट्रोल की तरह काम करने देता है। ऐप विश्वसनीय LAN/Tailnet Gateway URL से सीधे जुड़ सकता है या जब दूरस्थ Gateway केवल loopback हो, तब SSH टनल प्रबंधित कर सकता है। स्वास्थ्य जांच, वॉइस वेक अग्रेषण, और वेब चैट _सेटिंग्स → सामान्य_ से वही दूरस्थ कॉन्फ़िगरेशन दोबारा उपयोग करते हैं।

## मोड

- **स्थानीय (यह Mac)**: सब कुछ लैपटॉप पर चलता है। SSH शामिल नहीं है।
- **SSH पर दूरस्थ (डिफ़ॉल्ट)**: OpenClaw कमांड दूरस्थ होस्ट पर चलाए जाते हैं। Mac ऐप `-o BatchMode` के साथ आपकी चुनी हुई पहचान/कुंजी और एक स्थानीय पोर्ट-फ़ॉरवर्ड का उपयोग करके SSH कनेक्शन खोलता है।
- **दूरस्थ डायरेक्ट (ws/wss)**: कोई SSH टनल नहीं। Mac ऐप सीधे Gateway URL से जुड़ता है (उदाहरण के लिए, LAN, Tailscale, Tailscale Serve, या सार्वजनिक HTTPS रिवर्स प्रॉक्सी के माध्यम से)।

## दूरस्थ ट्रांसपोर्ट

दूरस्थ मोड दो ट्रांसपोर्ट का समर्थन करता है:

- **SSH टनल** (डिफ़ॉल्ट): Gateway पोर्ट को localhost पर फ़ॉरवर्ड करने के लिए `ssh -N -L ...` का उपयोग करता है। Gateway नोड का IP `127.0.0.1` के रूप में देखेगा क्योंकि टनल loopback है।
- **डायरेक्ट (ws/wss)**: सीधे Gateway URL से जुड़ता है। Gateway वास्तविक क्लाइंट IP देखता है।

SSH टनल मोड में, खोजे गए LAN/tailnet होस्टनाम
`gateway.remote.sshTarget` के रूप में सहेजे जाते हैं। ऐप `gateway.remote.url` को स्थानीय
टनल एंडपॉइंट पर रखता है, उदाहरण के लिए `ws://127.0.0.1:18789`, ताकि CLI, वेब चैट, और
स्थानीय नोड-होस्ट सेवा सभी समान सुरक्षित loopback ट्रांसपोर्ट का उपयोग करें।
जब खोज raw Tailnet IP और स्थिर होस्टनाम दोनों लौटाती है, तो ऐप
Tailscale MagicDNS या LAN नामों को प्राथमिकता देता है ताकि दूरस्थ कनेक्शन पता
बदलने पर बेहतर टिके रहें।
यदि स्थानीय टनल पोर्ट दूरस्थ Gateway पोर्ट से अलग है, तो
`gateway.remote.remotePort` को दूरस्थ होस्ट के पोर्ट पर सेट करें।

दूरस्थ मोड में ब्राउज़र ऑटोमेशन CLI नोड होस्ट के स्वामित्व में होता है, न कि
नेटिव macOS ऐप नोड के। ऐप संभव होने पर इंस्टॉल की गई नोड होस्ट सेवा शुरू करता है;
यदि आपको उस Mac से ब्राउज़र नियंत्रण चाहिए, तो उसे
`openclaw node install ...` और `openclaw node start` के साथ इंस्टॉल/शुरू करें (या
`openclaw node run ...` को foreground में चलाएं), फिर उस ब्राउज़र-सक्षम
नोड को target करें।

## दूरस्थ होस्ट पर पूर्वापेक्षाएं

1. Node + pnpm इंस्टॉल करें और OpenClaw CLI को build/install करें (`pnpm install && pnpm build && pnpm link --global`)।
2. सुनिश्चित करें कि `openclaw` non-interactive shells के लिए PATH पर है (ज़रूरत हो तो `/usr/local/bin` या `/opt/homebrew/bin` में symlink करें)।
3. केवल SSH ट्रांसपोर्ट के लिए: key auth के साथ SSH खोलें। हम LAN से बाहर स्थिर पहुंच के लिए **Tailscale** IP की सिफ़ारिश करते हैं।

## macOS ऐप सेटअप

welcome flow के बिना ऐप को पहले से कॉन्फ़िगर करने के लिए:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

किसी विश्वसनीय LAN या Tailnet पर पहले से पहुंच योग्य Gateway के लिए, SSH को पूरी तरह छोड़ दें:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

यह दूरस्थ कॉन्फ़िग लिखता है, onboarding को पूर्ण चिह्नित करता है, और ऐप शुरू होने पर
चुने गए ट्रांसपोर्ट को ऐप के स्वामित्व में रखता है।

1. _सेटिंग्स → सामान्य_ खोलें।
2. **OpenClaw चलता है** के अंतर्गत, **दूरस्थ** चुनें और सेट करें:
   - **ट्रांसपोर्ट**: **SSH टनल** या **डायरेक्ट (ws/wss)**।
   - **SSH target**: `user@host` (वैकल्पिक `:port`)।
     - यदि Gateway उसी LAN पर है और Bonjour advertise करता है, तो इस फ़ील्ड को अपने-आप भरने के लिए उसे खोजी गई सूची से चुनें।
   - **Gateway URL** (केवल डायरेक्ट): `wss://gateway.example.ts.net` (या स्थानीय/LAN के लिए `ws://...`)।
   - **Identity file** (उन्नत): आपकी कुंजी का path।
   - **Project root** (उन्नत): कमांड के लिए उपयोग किया गया दूरस्थ checkout path।
   - **CLI path** (उन्नत): चलाने योग्य `openclaw` entrypoint/binary का वैकल्पिक path (advertise होने पर अपने-आप भरा जाता है)।
3. **दूरस्थ टेस्ट करें** दबाएं। सफलता बताती है कि दूरस्थ `openclaw status --json` सही तरह चलता है। विफलताएं आमतौर पर PATH/CLI समस्याओं का संकेत देती हैं; exit 127 का अर्थ है कि CLI दूरस्थ रूप से नहीं मिला।
4. स्वास्थ्य जांच और वेब चैट अब चुने गए ट्रांसपोर्ट के माध्यम से अपने-आप चलेंगे।

## वेब चैट

- **SSH टनल**: वेब चैट फ़ॉरवर्ड किए गए WebSocket नियंत्रण पोर्ट (डिफ़ॉल्ट 18789) पर Gateway से जुड़ता है।
- **डायरेक्ट (ws/wss)**: वेब चैट सीधे कॉन्फ़िगर किए गए Gateway URL से जुड़ता है।
- अब कोई अलग WebChat HTTP सर्वर नहीं है।

## अनुमतियां

- दूरस्थ होस्ट को स्थानीय जैसी ही TCC मंज़ूरियां चाहिए (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications)। उन्हें एक बार देने के लिए उस मशीन पर onboarding चलाएं।
- नोड अपनी अनुमति स्थिति `node.list` / `node.describe` के माध्यम से advertise करते हैं ताकि एजेंट जान सकें कि क्या उपलब्ध है।

## सुरक्षा नोट्स

- दूरस्थ होस्ट पर loopback binds को प्राथमिकता दें और SSH, Tailscale Serve, या विश्वसनीय Tailnet/LAN डायरेक्ट URL के माध्यम से जुड़ें।
- SSH टनलिंग strict host-key checking का उपयोग करती है; पहले host key पर भरोसा करें ताकि वह `~/.ssh/known_hosts` में मौजूद हो।
- यदि आप Gateway को non-loopback इंटरफ़ेस से bind करते हैं, तो मान्य Gateway auth आवश्यक करें: token, password, या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware reverse proxy।
- [सुरक्षा](/hi/gateway/security) और [Tailscale](/hi/gateway/tailscale) देखें।

## WhatsApp लॉगिन फ्लो (दूरस्थ)

- दूरस्थ होस्ट पर **`openclaw channels login --verbose`** चलाएं। अपने फ़ोन पर WhatsApp से QR स्कैन करें।
- यदि auth समाप्त हो जाए तो उसी होस्ट पर लॉगिन फिर से चलाएं। स्वास्थ्य जांच link समस्याएं दिखाएगी।

## समस्या निवारण

- **exit 127 / नहीं मिला**: `openclaw` non-login shells के लिए PATH पर नहीं है। इसे `/etc/paths`, अपने shell rc में जोड़ें, या `/usr/local/bin`/`/opt/homebrew/bin` में symlink करें।
- **स्वास्थ्य probe विफल**: SSH पहुंच, PATH, और Baileys के logged in होने की जांच करें (`openclaw status --json`)।
- **वेब चैट अटका हुआ**: पुष्टि करें कि Gateway दूरस्थ होस्ट पर चल रहा है और फ़ॉरवर्ड किया गया पोर्ट Gateway WS पोर्ट से मेल खाता है; UI को स्वस्थ WS कनेक्शन चाहिए।
- **नोड IP 127.0.0.1 दिखाता है**: SSH टनल के साथ यह अपेक्षित है। यदि आप चाहते हैं कि Gateway वास्तविक क्लाइंट IP देखे, तो **ट्रांसपोर्ट** को **डायरेक्ट (ws/wss)** पर बदलें।
- **Dashboard काम करता है लेकिन Mac क्षमताएं offline हैं**: इसका अर्थ है कि ऐप का operator/control कनेक्शन स्वस्थ है, लेकिन companion नोड कनेक्शन जुड़ा नहीं है या उसका command surface मौजूद नहीं है। menu bar device section खोलें और जांचें कि Mac `paired · disconnected` है या नहीं। `wss://*.ts.net` Tailscale Serve endpoints के लिए, ऐप certificate rotation के बाद stale legacy TLS leaf pins का पता लगाता है, macOS द्वारा नए certificate पर भरोसा करने पर stale pin हटाता है, और अपने-आप retry करता है। यदि certificate system-trusted नहीं है या host Tailscale Serve नाम नहीं है, तो `gateway.remote.tlsFingerprint` को अपेक्षित certificate fingerprint पर सेट करें, certificate की समीक्षा करें, या **SSH पर दूरस्थ** पर switch करें।
- **वॉइस वेक**: दूरस्थ मोड में trigger phrases अपने-आप अग्रेषित होते हैं; अलग forwarder की ज़रूरत नहीं है।

## Notification sounds

`openclaw` और `node.invoke` वाली scripts से प्रति notification ध्वनियां चुनें, जैसे:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ऐप में अब कोई global "default sound" toggle नहीं है; callers प्रत्येक request के लिए ध्वनि (या कोई ध्वनि नहीं) चुनते हैं।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [दूरस्थ पहुंच](/hi/gateway/remote)
