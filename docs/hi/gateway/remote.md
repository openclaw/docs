---
read_when:
    - दूरस्थ Gateway सेटअप चलाना या उनका समस्या निवारण करना
summary: Gateway WS, SSH टनल और tailnets का उपयोग करके दूरस्थ पहुँच
title: दूरस्थ पहुंच
x-i18n:
    generated_at: "2026-07-03T23:33:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

यह रिपो एक समर्पित होस्ट (डेस्कटॉप/सर्वर) पर एकल Gateway (मास्टर) चालू रखकर और क्लाइंटों को उससे जोड़कर रिमोट गेटवे एक्सेस का समर्थन करता है।

- **ऑपरेटरों (आप / macOS ऐप) के लिए**: जब गेटवे पहुंच योग्य हो, तो डायरेक्ट LAN/Tailnet WebSocket सबसे सरल है; SSH टनलिंग सार्वभौमिक फॉलबैक है।
- **नोड्स (iOS/Android और भविष्य के डिवाइस) के लिए**: Gateway **WebSocket** से कनेक्ट करें (ज़रूरत के अनुसार LAN/tailnet या SSH टनल)।

## मुख्य विचार

- Gateway WebSocket आमतौर पर आपके कॉन्फ़िगर किए गए पोर्ट (डिफ़ॉल्ट 18789) पर **loopback** से बाइंड होता है।
- रिमोट उपयोग के लिए, इसे Tailscale Serve या भरोसेमंद LAN/Tailnet बाइंड के ज़रिए एक्सपोज़ करें, या SSH पर loopback पोर्ट फ़ॉरवर्ड करें।

## सामान्य VPN और tailnet सेटअप

**Gateway होस्ट** को वह जगह समझें जहां एजेंट रहता है। यह सेशन, ऑथ प्रोफ़ाइल, चैनल और स्टेट का मालिक होता है। आपका लैपटॉप, डेस्कटॉप और नोड्स उसी होस्ट से कनेक्ट होते हैं।

### आपके tailnet में हमेशा चालू Gateway

Gateway को किसी स्थायी होस्ट (VPS या होम सर्वर) पर चलाएं और **Tailscale** या SSH के ज़रिए उस तक पहुंचें।

- **सर्वश्रेष्ठ UX:** `gateway.bind: "loopback"` रखें और Control UI के लिए **Tailscale Serve** इस्तेमाल करें।
- **भरोसेमंद LAN/Tailnet:** गेटवे को निजी इंटरफ़ेस से बाइंड करें और `gateway.remote.transport: "direct"` के साथ सीधे कनेक्ट करें।
- **फॉलबैक:** loopback रखें और एक्सेस की ज़रूरत वाली किसी भी मशीन से SSH टनल जोड़ें।
- **उदाहरण:** [exe.dev](/hi/install/exe-dev) (आसान VM) या [Hetzner](/hi/install/hetzner) (प्रोडक्शन VPS)।

यह तब आदर्श है जब आपका लैपटॉप अक्सर स्लीप होता है लेकिन आप एजेंट को हमेशा चालू रखना चाहते हैं।

### होम डेस्कटॉप Gateway चलाता है

लैपटॉप एजेंट **नहीं** चलाता। यह रिमोट से कनेक्ट होता है:

- macOS ऐप का रिमोट मोड इस्तेमाल करें (Settings → General → OpenClaw runs)।
- जब गेटवे LAN/Tailnet पर पहुंच योग्य होता है तो ऐप सीधे कनेक्ट करता है, या जब आप SSH चुनते हैं तो SSH टनल खोलता और मैनेज करता है।

रनबुक: [macOS रिमोट एक्सेस](/hi/platforms/mac/remote)।

### लैपटॉप Gateway चलाता है

Gateway को लोकल रखें लेकिन उसे सुरक्षित रूप से एक्सपोज़ करें:

- दूसरी मशीनों से लैपटॉप तक SSH टनल, या
- Control UI को Tailscale Serve करें और Gateway को केवल loopback रखें।

गाइड: [Tailscale](/hi/gateway/tailscale) और [वेब ओवरव्यू](/hi/web)।

## कमांड फ़्लो (क्या कहां चलता है)

एक गेटवे सर्विस स्टेट + चैनलों की मालिक होती है। नोड्स परिधीय होते हैं।

फ़्लो उदाहरण (Telegram → नोड):

- Telegram संदेश **Gateway** पर आता है।
- Gateway **एजेंट** चलाता है और तय करता है कि नोड टूल को कॉल करना है या नहीं।
- Gateway, Gateway WebSocket (`node.*` RPC) पर **नोड** को कॉल करता है।
- नोड परिणाम लौटाता है; Gateway Telegram को जवाब वापस भेजता है।

नोट्स:

- **नोड्स गेटवे सर्विस नहीं चलाते।** प्रति होस्ट केवल एक गेटवे चलना चाहिए, जब तक कि आप जानबूझकर अलग-थलग प्रोफ़ाइल न चला रहे हों ([Multiple gateways](/hi/gateway/multiple-gateways) देखें)।
- macOS ऐप "नोड मोड" केवल Gateway WebSocket पर एक नोड क्लाइंट है।

## SSH टनल (CLI + टूल्स)

रिमोट Gateway WS तक लोकल टनल बनाएं:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

टनल चालू होने पर:

- `openclaw health` और `openclaw status --deep` अब `ws://127.0.0.1:18789` के ज़रिए रिमोट गेटवे तक पहुंचते हैं।
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, और `openclaw gateway call` ज़रूरत पड़ने पर `--url` के ज़रिए फ़ॉरवर्ड किए गए URL को भी टार्गेट कर सकते हैं।

<Note>
`18789` को अपने कॉन्फ़िगर किए गए `gateway.port` (या `--port` या `OPENCLAW_GATEWAY_PORT`) से बदलें।
</Note>

<Warning>
जब आप `--url` पास करते हैं, CLI कॉन्फ़िग या एनवायरनमेंट क्रेडेंशियल्स पर वापस नहीं जाता। `--token` या `--password` स्पष्ट रूप से शामिल करें। स्पष्ट क्रेडेंशियल्स न होना एक त्रुटि है।
</Warning>

## CLI रिमोट डिफ़ॉल्ट

आप एक रिमोट टार्गेट स्थायी कर सकते हैं ताकि CLI कमांड उसे डिफ़ॉल्ट रूप से इस्तेमाल करें:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

जब गेटवे केवल loopback हो, URL को `ws://127.0.0.1:18789` पर रखें और पहले SSH टनल खोलें।
macOS ऐप के SSH टनल ट्रांसपोर्ट में, खोजे गए गेटवे होस्टनेम
`gateway.remote.sshTarget` में रहते हैं; `gateway.remote.url` लोकल टनल URL ही रहता है।
यदि वे पोर्ट अलग हैं, तो `gateway.remote.remotePort` को SSH होस्ट पर गेटवे पोर्ट पर सेट करें।
होस्ट-की सत्यापन डिफ़ॉल्ट रूप से सख्त है। मैनेज्ड एलियास स्पष्ट रूप से
अपनी प्रभावी OpenSSH ट्रस्ट नीति
`gateway.remote.sshHostKeyPolicy: "openssh"` के साथ इस्तेमाल कर सकते हैं; इसे सक्षम करने से पहले मेल खाने वाली यूज़र और सिस्टम
SSH सेटिंग्स की समीक्षा करें।

भरोसेमंद LAN या Tailnet पर पहले से पहुंच योग्य गेटवे के लिए, डायरेक्ट मोड इस्तेमाल करें:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## क्रेडेंशियल प्राथमिकता

Gateway क्रेडेंशियल रिज़ॉल्यूशन call/probe/status पाथ और Discord exec-approval मॉनिटरिंग में एक साझा कॉन्ट्रैक्ट का पालन करता है। Node-host एक लोकल-मोड अपवाद के साथ वही बेस कॉन्ट्रैक्ट इस्तेमाल करता है (यह जानबूझकर `gateway.remote.*` को अनदेखा करता है):

- स्पष्ट क्रेडेंशियल्स (`--token`, `--password`, या टूल `gatewayToken`) हमेशा उन कॉल पाथ पर जीतते हैं जो स्पष्ट ऑथ स्वीकार करते हैं।
- URL ओवरराइड सुरक्षा:
  - CLI URL ओवरराइड (`--url`) कभी भी अंतर्निहित config/env क्रेडेंशियल्स दोबारा इस्तेमाल नहीं करते।
  - Env URL ओवरराइड (`OPENCLAW_GATEWAY_URL`) केवल env क्रेडेंशियल्स (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) इस्तेमाल कर सकते हैं।
- लोकल मोड डिफ़ॉल्ट:
  - टोकन: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (रिमोट फॉलबैक केवल तब लागू होता है जब लोकल ऑथ टोकन इनपुट unset हो)
  - पासवर्ड: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (रिमोट फॉलबैक केवल तब लागू होता है जब लोकल ऑथ पासवर्ड इनपुट unset हो)
- रिमोट मोड डिफ़ॉल्ट:
  - टोकन: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - पासवर्ड: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host लोकल-मोड अपवाद: `gateway.remote.token` / `gateway.remote.password` अनदेखे किए जाते हैं।
- रिमोट probe/status टोकन जांच डिफ़ॉल्ट रूप से सख्त होती हैं: रिमोट मोड को टार्गेट करते समय वे केवल `gateway.remote.token` इस्तेमाल करती हैं (कोई लोकल टोकन फॉलबैक नहीं)।
- Gateway env ओवरराइड केवल `OPENCLAW_GATEWAY_*` इस्तेमाल करते हैं।

## Chat UI रिमोट एक्सेस

WebChat अब अलग HTTP पोर्ट इस्तेमाल नहीं करता। SwiftUI chat UI सीधे Gateway WebSocket से कनेक्ट होता है।

- SSH पर `18789` फ़ॉरवर्ड करें (ऊपर देखें), फिर क्लाइंटों को `ws://127.0.0.1:18789` से कनेक्ट करें।
- LAN/Tailnet डायरेक्ट मोड के लिए, क्लाइंटों को कॉन्फ़िगर किए गए निजी `ws://` या सुरक्षित `wss://` URL से कनेक्ट करें।
- macOS पर, ऐप का रिमोट मोड प्राथमिकता से इस्तेमाल करें, जो चुने गए ट्रांसपोर्ट को अपने-आप मैनेज करता है।

## macOS ऐप रिमोट मोड

macOS मेनू बार ऐप वही सेटअप शुरू से अंत तक चला सकता है (रिमोट स्टेटस जांच, WebChat, और Voice Wake फ़ॉरवर्डिंग)।

रनबुक: [macOS रिमोट एक्सेस](/hi/platforms/mac/remote)।

## सुरक्षा नियम (रिमोट/VPN)

संक्षिप्त संस्करण: जब तक आपको यकीन न हो कि बाइंड की ज़रूरत है, **Gateway को केवल loopback रखें**।

- **Loopback + SSH/Tailscale Serve** सबसे सुरक्षित डिफ़ॉल्ट है (कोई सार्वजनिक एक्सपोज़र नहीं)।
- प्लेनटेक्स्ट `ws://` loopback, LAN, link-local, `.local`, `.ts.net`, और Tailscale CGNAT होस्ट के लिए स्वीकार है। सार्वजनिक रिमोट होस्टों को `wss://` इस्तेमाल करना होगा।
- **Non-loopback बाइंड** (`lan`/`tailnet`/`custom`, या `auto` जब loopback उपलब्ध न हो) को गेटवे ऑथ इस्तेमाल करना होगा: टोकन, पासवर्ड, या `gateway.auth.mode: "trusted-proxy"` वाला identity-aware रिवर्स प्रॉक्सी।
- `gateway.remote.token` / `.password` क्लाइंट क्रेडेंशियल स्रोत हैं। वे अपने-आप सर्वर ऑथ कॉन्फ़िगर **नहीं** करते।
- लोकल कॉल पाथ `gateway.auth.*` unset होने पर ही `gateway.remote.*` को फॉलबैक के रूप में इस्तेमाल कर सकते हैं।
- यदि `gateway.auth.token` / `gateway.auth.password` SecretRef के ज़रिए स्पष्ट रूप से कॉन्फ़िगर है और रिज़ॉल्व नहीं होता, तो रिज़ॉल्यूशन बंद अवस्था में विफल होता है (कोई रिमोट फॉलबैक मास्किंग नहीं)।
- `gateway.remote.tlsFingerprint`, `wss://` इस्तेमाल करते समय रिमोट TLS cert को पिन करता है, जिसमें macOS डायरेक्ट मोड भी शामिल है। कॉन्फ़िगर किए गए या पहले से स्टोर किए गए पिन के बिना, macOS सामान्य सिस्टम ट्रस्ट पास होने के बाद ही first-use सर्टिफ़िकेट पिन करता है; self-signed या private-CA गेटवे जिन्हें macOS पहले से ट्रस्ट नहीं करता, उन्हें स्पष्ट फ़िंगरप्रिंट या Remote over SSH चाहिए।
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` होने पर identity
  हेडर्स के ज़रिए Control UI/WebSocket ट्रैफ़िक को ऑथेंटिकेट कर सकता है; HTTP API एंडपॉइंट्स उस Tailscale हेडर ऑथ का
  उपयोग नहीं करते और इसके बजाय गेटवे के सामान्य HTTP
  ऑथ मोड का पालन करते हैं। यह tokenless फ़्लो मानता है कि गेटवे होस्ट भरोसेमंद है। यदि आप हर जगह shared-secret ऑथ चाहते हैं, तो इसे
  `false` पर सेट करें।
- **Trusted-proxy** ऑथ डिफ़ॉल्ट रूप से non-loopback identity-aware प्रॉक्सी सेटअप की अपेक्षा करता है।
  Same-host loopback रिवर्स प्रॉक्सी के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` चाहिए।
- ब्राउज़र कंट्रोल को ऑपरेटर एक्सेस जैसा मानें: केवल-tailnet + विचारपूर्वक नोड पेयरिंग।

विस्तार से: [सुरक्षा](/hi/gateway/security)।

### macOS: LaunchAgent के ज़रिए स्थायी SSH टनल

रिमोट गेटवे से कनेक्ट होने वाले macOS क्लाइंटों के लिए, सबसे आसान स्थायी सेटअप SSH `LocalForward` config एंट्री और LaunchAgent का उपयोग करता है ताकि रीबूट और क्रैश के बाद भी टनल जीवित रहे।

#### चरण 1: SSH config जोड़ें

`~/.ssh/config` संपादित करें:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` और `<REMOTE_USER>` को अपने मानों से बदलें।

#### चरण 2: SSH key कॉपी करें (एक बार)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### चरण 3: गेटवे टोकन कॉन्फ़िगर करें

टोकन को config में स्टोर करें ताकि यह रीस्टार्ट के बाद भी बना रहे:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### चरण 4: LaunchAgent बनाएं

इसे `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` के रूप में सेव करें:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### चरण 5: LaunchAgent लोड करें

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

टनल लॉगिन पर अपने-आप शुरू होगी, क्रैश होने पर रीस्टार्ट होगी, और फ़ॉरवर्ड किए गए पोर्ट को लाइव रखेगी।

<Note>
यदि आपके पास पुराने सेटअप से बचा हुआ `com.openclaw.ssh-tunnel` LaunchAgent है, तो उसे unload करें और delete करें।
</Note>

#### समस्या निवारण

जांचें कि टनल चल रही है या नहीं:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

टनल रीस्टार्ट करें:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

टनल रोकें:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config entry                         | यह क्या करता है                                             |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | लोकल पोर्ट 18789 को रिमोट पोर्ट 18789 पर फ़ॉरवर्ड करता है   |
| `ssh -N`                             | रिमोट कमांड चलाए बिना SSH (केवल port-forwarding)            |
| `KeepAlive`                          | टनल क्रैश होने पर उसे अपने-आप रीस्टार्ट करता है             |
| `RunAtLoad`                          | लॉगिन पर LaunchAgent लोड होने पर टनल शुरू करता है           |

## संबंधित

- [Tailscale](/hi/gateway/tailscale)
- [Authentication](/hi/gateway/authentication)
- [Remote gateway setup](/hi/gateway/remote-gateway-readme)
