---
read_when:
    - रिमोट Gateway सेटअप चलाना या उनकी समस्याओं का निवारण करना
summary: Gateway WS, SSH टनल और टेलनेट का उपयोग करके रिमोट एक्सेस
title: दूरस्थ पहुँच
x-i18n:
    generated_at: "2026-07-16T15:07:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw किसी होस्ट पर एक Gateway (मास्टर) चलाता है और प्रत्येक क्लाइंट को उससे जोड़ता है। Gateway सत्रों, प्रमाणीकरण प्रोफ़ाइलों, चैनलों और स्थिति का स्वामी होता है; बाकी सब कुछ क्लाइंट है।

- **ऑपरेटर** (आप या macOS ऐप): Gateway तक पहुँच उपलब्ध होने पर सीधा LAN/Tailnet WebSocket सबसे सरल है; SSH टनलिंग सार्वभौमिक फ़ॉलबैक है।
- **Nodes** (iOS/Android और अन्य डिवाइस): Gateway **WebSocket** (LAN/tailnet या SSH टनल) से कनेक्ट होते हैं।

## मूल विचार

Gateway WebSocket डिफ़ॉल्ट रूप से पोर्ट `18789` (`gateway.port`) पर **लूपबैक** से बाइंड होता है। दूरस्थ उपयोग के लिए, इसे Tailscale Serve / किसी विश्वसनीय LAN-Tailnet बाइंड के माध्यम से उपलब्ध कराएँ, या लूपबैक पोर्ट को SSH पर फ़ॉरवर्ड करें।

## टोपोलॉजी विकल्प

| सेटअप                             | Gateway कहाँ चलता है                                                                                    | किसके लिए सर्वोत्तम                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| आपके tailnet में हमेशा चालू Gateway | स्थायी होस्ट (VPS या होम सर्वर), जिस तक Tailscale या SSH के माध्यम से पहुँचा जाता है                                        | ऐसे लैपटॉप जो अक्सर स्लीप मोड में जाते हैं, लेकिन जिनके लिए एजेंट का हमेशा चालू रहना आवश्यक है। [exe.dev](/hi/install/exe-dev) (आसान VM) या [Hetzner](/hi/install/hetzner) (प्रोडक्शन VPS) देखें। |
| होम डेस्कटॉप                      | डेस्कटॉप; लैपटॉप macOS ऐप के रिमोट मोड (Settings → Connection → OpenClaw runs) के माध्यम से दूरस्थ रूप से कनेक्ट होता है | एजेंट को ऐसे हार्डवेयर पर रखने के लिए जो चालू रहता है। रनबुक: [macOS दूरस्थ एक्सेस](/hi/platforms/mac/remote)।                                       |
| लैपटॉप                            | लैपटॉप, SSH टनल या Tailscale Serve के माध्यम से सुरक्षित रूप से उपलब्ध कराया गया (`gateway.bind: "loopback"` बनाए रखें)                | एकल-मशीन सेटअप। [Tailscale](/hi/gateway/tailscale) और [वेब](/hi/web) देखें।                                                                       |

हमेशा चालू और लैपटॉप सेटअप के लिए, `gateway.bind: "loopback"` बनाए रखना और Control UI के लिए **Tailscale Serve**, या `gateway.remote.transport: "direct"` के साथ किसी विश्वसनीय LAN/Tailnet बाइंड का उपयोग करना बेहतर है। SSH टनल वह फ़ॉलबैक है जो किसी भी मशीन से काम करता है।

## कमांड प्रवाह (क्या कहाँ चलता है)

एक Gateway स्थिति और चैनलों का स्वामी होता है; nodes परिधीय डिवाइस होते हैं। उदाहरण (Telegram संदेश को किसी node टूल पर रूट किया गया):

1. Telegram संदेश **Gateway** पर पहुँचता है।
2. Gateway **एजेंट** चलाता है, जो तय करता है कि किसी node टूल को कॉल करना है या नहीं।
3. Gateway, Gateway WebSocket (`node.invoke` RPC) पर **node** को कॉल करता है।
4. Node परिणाम लौटाता है; Gateway Telegram पर उत्तर देता है।

Nodes, Gateway सेवा नहीं चलाते। प्रत्येक होस्ट पर केवल एक Gateway चलना चाहिए, जब तक कि आप जानबूझकर पृथक प्रोफ़ाइल न चला रहे हों ([एकाधिक gateways](/hi/gateway/multiple-gateways) देखें)। macOS ऐप का "node mode" केवल Gateway WebSocket पर एक node क्लाइंट है।

## SSH टनल (CLI + टूल)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

टनल चालू होने पर, `openclaw health` और `openclaw status --deep`, `ws://127.0.0.1:18789` के माध्यम से दूरस्थ Gateway तक पहुँचते हैं। `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, और `openclaw gateway call` भी `--url` के माध्यम से किसी फ़ॉरवर्ड किए गए URL को लक्षित कर सकते हैं।

<Note>
`18789` को अपने कॉन्फ़िगर किए गए `gateway.port` (या `--port` / `OPENCLAW_GATEWAY_PORT`) से बदलें।
</Note>

<Warning>
`--url` कभी भी कॉन्फ़िगरेशन या एनवायरनमेंट क्रेडेंशियल पर फ़ॉलबैक नहीं करता। `--token` या `--password` स्पष्ट रूप से दें; इनके बिना क्लाइंट कोई क्रेडेंशियल नहीं भेजता और यदि लक्षित Gateway को प्रमाणीकरण चाहिए, तो कनेक्शन विफल हो जाता है।
</Warning>

## CLI के दूरस्थ डिफ़ॉल्ट

किसी दूरस्थ लक्ष्य को स्थायी बनाएँ, ताकि CLI कमांड डिफ़ॉल्ट रूप से उसका उपयोग करें:

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

जब Gateway केवल लूपबैक पर हो, तो URL को `ws://127.0.0.1:18789` पर रखें और पहले SSH टनल खोलें। macOS ऐप के SSH-टनल ट्रांसपोर्ट में, खोजे गए Gateway का होस्टनाम `gateway.remote.sshTarget` (`user@host` या `user@host:port`) में जाता है; `gateway.remote.url` स्थानीय टनल URL बना रहता है। यदि दूरस्थ पोर्ट स्थानीय पोर्ट से अलग है, तो `gateway.remote.remotePort` सेट करें।

होस्ट-कुंजी सत्यापन डिफ़ॉल्ट रूप से सख्त है (`gateway.remote.sshHostKeyPolicy: "strict"`)। इसके बजाय अपने प्रभावी OpenSSH कॉन्फ़िगरेशन को यह कार्य सौंपने के लिए इसे `"openssh"` पर सेट करें; इसे सक्षम करने से पहले अपनी उपयोगकर्ता और सिस्टम SSH सेटिंग्स की समीक्षा करें।

किसी विश्वसनीय LAN या Tailnet पर पहले से उपलब्ध Gateway के लिए, सीधे मोड का उपयोग करें:

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

Gateway क्रेडेंशियल समाधान, कॉल/प्रोब/स्थिति पथों और Discord निष्पादन-अनुमोदन निगरानी में एक साझा अनुबंध का पालन करता है। Node-host एक स्थानीय-मोड अपवाद के साथ उसी अनुबंध का उपयोग करता है (यह `gateway.remote.*` को अनदेखा करता है)।

- स्पष्ट क्रेडेंशियल (`--token`, `--password`, या किसी टूल का `gatewayToken`) उन कॉल पथों पर हमेशा प्राथमिकता लेते हैं जो स्पष्ट प्रमाणीकरण स्वीकार करते हैं।
- URL ओवरराइड सुरक्षा:
  - CLI `--url` कभी भी अंतर्निहित कॉन्फ़िगरेशन/एनवायरनमेंट क्रेडेंशियल का दोबारा उपयोग नहीं करता।
  - एनवायरनमेंट `OPENCLAW_GATEWAY_URL` केवल एनवायरनमेंट क्रेडेंशियल (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) का उपयोग कर सकता है।
- स्थानीय मोड के डिफ़ॉल्ट:
  - टोकन: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (दूरस्थ फ़ॉलबैक केवल तब, जब स्थानीय टोकन सेट न हो)
  - पासवर्ड: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (दूरस्थ फ़ॉलबैक केवल तब, जब स्थानीय पासवर्ड सेट न हो)
- दूरस्थ मोड के डिफ़ॉल्ट:
  - टोकन: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - पासवर्ड: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host स्थानीय-मोड अपवाद: `gateway.remote.token` / `gateway.remote.password` को अनदेखा किया जाता है।
- दूरस्थ प्रोब/स्थिति टोकन जाँच डिफ़ॉल्ट रूप से सख्त होती हैं: दूरस्थ मोड को लक्षित करते समय वे केवल `gateway.remote.token` का उपयोग करती हैं (कोई स्थानीय टोकन फ़ॉलबैक नहीं)।
- Gateway एनवायरनमेंट ओवरराइड केवल `OPENCLAW_GATEWAY_*` का उपयोग करते हैं।

## Chat UI की दूरस्थ पहुँच

WebChat के लिए कोई अलग HTTP पोर्ट नहीं है; SwiftUI चैट UI सीधे Gateway WebSocket से कनेक्ट होता है।

- `18789` को SSH पर फ़ॉरवर्ड करें (ऊपर देखें), फिर क्लाइंट को `ws://127.0.0.1:18789` से कनेक्ट करें।
- LAN/Tailnet सीधे मोड के लिए, क्लाइंट को कॉन्फ़िगर किए गए निजी `ws://` या सुरक्षित `wss://` URL से कनेक्ट करें।
- macOS पर, ऐप का दूरस्थ मोड चुने हुए ट्रांसपोर्ट को स्वचालित रूप से प्रबंधित करता है।

## macOS ऐप का दूरस्थ मोड

macOS मेनू बार ऐप इसी सेटअप को शुरू से अंत तक संचालित करता है: दूरस्थ स्थिति जाँच, WebChat और Voice Wake फ़ॉरवर्डिंग। रनबुक: [macOS दूरस्थ एक्सेस](/hi/platforms/mac/remote)।

## सुरक्षा नियम (दूरस्थ/VPN)

जब तक आपको यह निश्चित न हो कि बाइंड आवश्यक है, Gateway को **केवल लूपबैक** पर रखें।

- **लूपबैक + SSH/Tailscale Serve** सबसे सुरक्षित डिफ़ॉल्ट है (कोई सार्वजनिक एक्सपोज़र नहीं)।
- प्लेनटेक्स्ट `ws://` को लूपबैक, निजी/LAN (RFC 1918), लिंक-लोकल, CGNAT, `.local`, और `.ts.net` होस्ट के लिए स्वीकार किया जाता है। सार्वजनिक दूरस्थ होस्ट को `wss://` का उपयोग करना आवश्यक है।
- **गैर-लूपबैक बाइंड** (`lan`/`tailnet`/`custom`, या लूपबैक उपलब्ध न होने पर `auto`) को Gateway प्रमाणीकरण का उपयोग करना आवश्यक है: टोकन, पासवर्ड, या `gateway.auth.mode: "trusted-proxy"` वाला पहचान-सचेत रिवर्स प्रॉक्सी।
- `gateway.remote.token` / `.password` क्लाइंट क्रेडेंशियल स्रोत हैं; वे स्वयं सर्वर प्रमाणीकरण कॉन्फ़िगर नहीं करते।
- स्थानीय कॉल पथ `gateway.remote.*` को केवल तभी फ़ॉलबैक के रूप में उपयोग कर सकते हैं, जब `gateway.auth.*` सेट न हो।
- यदि `gateway.auth.token` / `gateway.auth.password` को SecretRef के माध्यम से स्पष्ट रूप से कॉन्फ़िगर किया गया है और उसका समाधान नहीं होता, तो समाधान फ़ेल-क्लोज़्ड रहता है (दूरस्थ फ़ॉलबैक इसे छिपाता नहीं है)।
- `gateway.remote.tlsFingerprint`, macOS सीधे मोड सहित, `wss://` के लिए दूरस्थ TLS प्रमाणपत्र को पिन करता है। संग्रहीत पिन के बिना, macOS सामान्य सिस्टम विश्वास जाँच सफल होने के बाद ही प्रथम उपयोग पर पिन करता है; स्व-हस्ताक्षरित या निजी-CA Gateway को स्पष्ट फ़िंगरप्रिंट या SSH पर Remote की आवश्यकता होती है।
- जब `gateway.auth.allowTailscale: true` हो, तब **Tailscale Serve** पहचान हेडर के माध्यम से Control UI/WebSocket ट्रैफ़िक को प्रमाणित कर सकता है। HTTP API एंडपॉइंट उस हेडर प्रमाणीकरण का उपयोग नहीं करते और इसके बजाय Gateway के सामान्य HTTP प्रमाणीकरण मोड का पालन करते हैं। यह टोकन-रहित प्रवाह मानता है कि Gateway होस्ट विश्वसनीय है; हर जगह साझा-गुप्त प्रमाणीकरण के लिए इसे `false` पर सेट करें।
- **विश्वसनीय-प्रॉक्सी** प्रमाणीकरण डिफ़ॉल्ट रूप से किसी गैर-लूपबैक पहचान-सचेत प्रॉक्सी की अपेक्षा करता है। उसी होस्ट के लूपबैक रिवर्स प्रॉक्सी के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है।
- ब्राउज़र नियंत्रण को ऑपरेटर एक्सेस जैसा मानें: केवल tailnet के साथ सुविचारित node पेयरिंग।

गहन जानकारी: [सुरक्षा](/hi/gateway/security)।

### macOS: LaunchAgent के माध्यम से स्थायी SSH टनल

macOS क्लाइंट के लिए, सबसे आसान स्थायी सेटअप में SSH `LocalForward` कॉन्फ़िगरेशन प्रविष्टि और एक LaunchAgent का उपयोग होता है, जो रीबूट और क्रैश के दौरान टनल को चालू रखता है।

#### चरण 1: SSH कॉन्फ़िगरेशन जोड़ें

`~/.ssh/config` संपादित करें:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` और `<REMOTE_USER>` को अपने मानों से बदलें।

#### चरण 2: SSH कुंजी कॉपी करें (एक बार)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### चरण 3: Gateway टोकन कॉन्फ़िगर करें

```bash
openclaw config set gateway.remote.token "<your-token>"
```

यदि दूरस्थ Gateway पासवर्ड प्रमाणीकरण का उपयोग करता है, तो इसके बजाय `gateway.remote.password` का उपयोग करें। `OPENCLAW_GATEWAY_TOKEN` अभी भी शेल-स्तरीय ओवरराइड के रूप में मान्य है, लेकिन स्थायी दूरस्थ-क्लाइंट सेटअप `gateway.remote.token` / `gateway.remote.password` है।

#### चरण 4: LaunchAgent बनाएँ

इसे `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` के रूप में सहेजें:

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

टनल लॉगिन पर स्वचालित रूप से शुरू होती है, क्रैश होने पर फिर से शुरू होती है और फ़ॉरवर्ड किए गए पोर्ट को सक्रिय रखती है।

<Note>
यदि आपके पास पुराने सेटअप से बचा हुआ `com.openclaw.ssh-tunnel` LaunchAgent है, तो उसे अनलोड करके हटा दें।
</Note>

#### समस्या निवारण

```bash
# जाँचें कि टनल चल रही है या नहीं
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# टनल पुनः शुरू करें
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# टनल रोकें
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| कॉन्फ़िगरेशन प्रविष्टि                         | यह क्या करती है                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | स्थानीय पोर्ट 18789 को दूरस्थ पोर्ट 18789 पर फ़ॉरवर्ड करती है               |
| `ssh -N`                             | दूरस्थ कमांड निष्पादित किए बिना SSH (केवल पोर्ट फ़ॉरवर्डिंग) |
| `KeepAlive`                          | क्रैश होने पर टनल को स्वचालित रूप से पुनः शुरू करती है              |
| `RunAtLoad`                          | लॉगिन पर LaunchAgent लोड होने पर टनल शुरू करती है        |

## संबंधित

- [Tailscale](/hi/gateway/tailscale)
- [प्रमाणीकरण](/hi/gateway/authentication)
- [रिमोट Gateway सेटअप](/hi/gateway/remote-gateway-readme)
