---
read_when:
    - Bonjour खोज/विज्ञापन को लागू करना या बदलना
    - रिमोट कनेक्शन मोड समायोजित करना (डायरेक्ट बनाम SSH)
    - दूरस्थ नोड्स के लिए नोड खोज + पेयरिंग डिज़ाइन करना
summary: Gateway खोजने के लिए Node खोज और ट्रांसपोर्ट (Bonjour, Tailscale, SSH)
title: खोज और ट्रांसपोर्ट्स
x-i18n:
    generated_at: "2026-06-28T23:08:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw में दो अलग समस्याएं हैं जो सतह पर समान दिखती हैं:

1. **ऑपरेटर रिमोट कंट्रोल**: macOS मेनू बार ऐप कहीं और चल रहे Gateway को नियंत्रित करता है।
2. **Node पेयरिंग**: iOS/Android (और भविष्य के Node) Gateway खोजते हैं और सुरक्षित रूप से पेयर होते हैं।

डिजाइन लक्ष्य सभी नेटवर्क खोज/विज्ञापन को **Node Gateway** (`openclaw gateway`) में रखना और क्लाइंट (mac ऐप, iOS) को उपभोक्ता बनाए रखना है।

## शब्द

- **Gateway**: एक अकेली लंबे समय तक चलने वाली Gateway प्रक्रिया जो स्टेट (सेशन, पेयरिंग, Node रजिस्ट्री) की मालिक होती है और चैनल चलाती है। अधिकांश सेटअप प्रति होस्ट एक का उपयोग करते हैं; पृथक मल्टी-Gateway सेटअप संभव हैं।
- **Gateway WS (कंट्रोल प्लेन)**: डिफॉल्ट रूप से `127.0.0.1:18789` पर WebSocket endpoint; इसे `gateway.bind` के जरिए LAN/tailnet से बांधा जा सकता है।
- **प्रत्यक्ष WS ट्रांसपोर्ट**: LAN/tailnet-सामने वाला Gateway WS endpoint (SSH नहीं)।
- **SSH ट्रांसपोर्ट (fallback)**: SSH पर `127.0.0.1:18789` forward करके रिमोट कंट्रोल।
- **लीगेसी TCP ब्रिज (हटाया गया)**: पुराना Node ट्रांसपोर्ट (देखें
  [ब्रिज प्रोटोकॉल](/hi/gateway/bridge-protocol)); अब खोज के लिए विज्ञापित नहीं किया जाता
  और अब वर्तमान builds का हिस्सा नहीं है।

प्रोटोकॉल विवरण:

- [Gateway प्रोटोकॉल](/hi/gateway/protocol)
- [ब्रिज प्रोटोकॉल (लीगेसी)](/hi/gateway/bridge-protocol)

## हम प्रत्यक्ष और SSH दोनों क्यों रखते हैं

- **प्रत्यक्ष WS** उसी नेटवर्क और tailnet के भीतर सबसे अच्छा UX है:
  - Bonjour के जरिए LAN पर स्वतः-खोज
  - पेयरिंग टोकन + ACLs Gateway के स्वामित्व में
  - shell access आवश्यक नहीं; प्रोटोकॉल सतह सख्त और ऑडिट योग्य रह सकती है
- **SSH** सार्वभौमिक fallback बना रहता है:
  - जहां भी आपके पास SSH access है वहां काम करता है (असंबंधित नेटवर्कों के पार भी)
  - multicast/mDNS समस्याओं में भी काम करता है
  - SSH के अलावा कोई नया inbound port आवश्यक नहीं

## खोज इनपुट (क्लाइंट कैसे सीखते हैं कि Gateway कहां है)

### 1) Bonjour / DNS-SD खोज

Multicast Bonjour best-effort है और नेटवर्कों के पार नहीं जाता। OpenClaw एक configured wide-area DNS-SD domain के जरिए भी उसी Gateway beacon को browse कर सकता है, इसलिए खोज कवर कर सकती है:

- उसी LAN पर `local.`
- cross-network खोज के लिए एक configured unicast DNS-SD domain

लक्ष्य दिशा:

- जब bundled
  `bonjour` plugin enabled हो, तो **Gateway** अपना WS endpoint Bonjour के जरिए advertise करता है। Plugin macOS hosts पर auto-start होता है और
  बाकी जगह opt-in है।
- क्लाइंट browse करते हैं और "Gateway चुनें" सूची दिखाते हैं, फिर चुना हुआ endpoint store करते हैं।

Troubleshooting और beacon विवरण: [Bonjour](/hi/gateway/bonjour).

#### Service beacon विवरण

- Service types:
  - `_openclaw-gw._tcp` (Gateway ट्रांसपोर्ट beacon)
- TXT keys (non-secret):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (ऑपरेटर-configured display name)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (केवल जब TLS enabled हो)
  - `gatewayTlsSha256=<sha256>` (केवल जब TLS enabled हो और fingerprint उपलब्ध हो)
  - `canvasPort=<port>` (canvas host port; वर्तमान में canvas host enabled होने पर `gatewayPort` के समान)
  - `tailnetDns=<magicdns>` (वैकल्पिक hint; Tailscale उपलब्ध होने पर auto-detected)
  - `sshPort=<port>` (केवल mDNS full mode; wide-area DNS-SD इसे छोड़ सकता है, ऐसी स्थिति में SSH defaults `22` पर रहते हैं)
  - `cliPath=<path>` (केवल mDNS full mode; wide-area DNS-SD फिर भी इसे remote-install hint के रूप में लिखता है)

सुरक्षा नोट्स:

- Bonjour/mDNS TXT records **unauthenticated** होते हैं। क्लाइंट को TXT values को केवल UX hints मानना चाहिए।
- Routing (host/port) को TXT द्वारा दिए गए `lanHost`, `tailnetDns`, या `gatewayPort` के बजाय **resolved service endpoint** (SRV + A/AAAA) को प्राथमिकता देनी चाहिए।
- TLS pinning को कभी भी advertised `gatewayTlsSha256` को पहले से stored pin override करने की अनुमति नहीं देनी चाहिए।
- iOS/Android Node को first-time pin store करने से पहले explicit "इस fingerprint पर trust करें" confirmation (out-of-band verification) मांगनी चाहिए, जब भी चुना गया route secure/TLS-based हो।

Enable/disable/override:

- `openclaw plugins enable bonjour` LAN multicast advertising enabled करता है।
- `OPENCLAW_DISABLE_BONJOUR=1` advertising disabled करता है।
- जब Bonjour plugin enabled हो और `OPENCLAW_DISABLE_BONJOUR` unset हो,
  Bonjour सामान्य hosts पर advertise करता है और detected containers के अंदर auto-disable हो जाता है।
  Empty-config macOS Gateway startup plugin को automatically enable करता है; Linux,
  Windows, और containerized deployments को explicit enablement चाहिए।
  `0` केवल host, macvlan, या किसी अन्य mDNS-capable network पर उपयोग करें; force-disable करने के लिए `1` उपयोग करें।
- `~/.openclaw/openclaw.json` में `gateway.bind` Gateway bind mode नियंत्रित करता है।
- `OPENCLAW_SSH_PORT`, `sshPort` emit होने पर advertised SSH port override करता है।
- `OPENCLAW_TAILNET_DNS` एक `tailnetDns` hint (MagicDNS) publish करता है।
- `OPENCLAW_CLI_PATH` advertised CLI path override करता है।

### 2) Tailnet (cross-network)

London/Vienna शैली के setup के लिए, Bonjour मदद नहीं करेगा। अनुशंसित "direct" target है:

- Tailscale MagicDNS नाम (preferred) या stable tailnet IP।

यदि Gateway detect कर सकता है कि वह Tailscale के अंतर्गत चल रहा है, तो वह क्लाइंट के लिए वैकल्पिक hint के रूप में `tailnetDns` publish करता है (wide-area beacons सहित)।

macOS ऐप अब Gateway खोज के लिए raw Tailscale IPs के बजाय MagicDNS names को प्राथमिकता देता है। इससे tailnet IPs बदलने पर reliability बेहतर होती है (उदाहरण के लिए Node restart या CGNAT reassignment के बाद), क्योंकि MagicDNS names automatically current IP पर resolve होते हैं।

mobile Node pairing के लिए, discovery hints tailnet/public routes पर transport security को relax नहीं करते:

- iOS/Android को अब भी secure first-time tailnet/public connect path (`wss://` या Tailscale Serve/Funnel) चाहिए।
- discovered raw tailnet IP routing hint है, plaintext remote `ws://` उपयोग करने की अनुमति नहीं।
- Private LAN direct-connect `ws://` supported रहता है।
- यदि आप mobile nodes के लिए सबसे सरल Tailscale path चाहते हैं, तो Tailscale Serve उपयोग करें ताकि discovery और setup code दोनों उसी secure MagicDNS endpoint पर resolve हों।

### 3) Manual / SSH target

जब कोई direct route नहीं होता (या direct disabled होता है), तो क्लाइंट loopback Gateway port forward करके हमेशा SSH के जरिए connect कर सकते हैं।

देखें [Remote access](/hi/gateway/remote).

## ट्रांसपोर्ट चयन (क्लाइंट नीति)

अनुशंसित क्लाइंट व्यवहार:

1. यदि paired direct endpoint configured और reachable है, तो उसका उपयोग करें।
2. अन्यथा, यदि discovery को `local.` या configured wide-area domain पर Gateway मिलता है, तो one-tap "इस Gateway का उपयोग करें" विकल्प दें और इसे direct endpoint के रूप में save करें।
3. अन्यथा, यदि tailnet DNS/IP configured है, तो direct try करें।
   tailnet/public routes पर mobile nodes के लिए, direct का अर्थ secure endpoint है, plaintext remote `ws://` नहीं।
4. अन्यथा, SSH पर fall back करें।

## Pairing + auth (direct transport)

Gateway Node/client admission के लिए source of truth है।

- Pairing requests Gateway में create/approve/reject होती हैं (देखें [Gateway pairing](/hi/gateway/pairing)).
- Gateway enforce करता है:
  - auth (token / keypair)
  - scopes/ACLs (Gateway हर method के लिए raw proxy नहीं है)
  - rate limits

## component के अनुसार जिम्मेदारियां

- **Gateway**: discovery beacons advertise करता है, pairing decisions का मालिक होता है, और WS endpoint host करता है।
- **macOS ऐप**: Gateway चुनने में मदद करता है, pairing prompts दिखाता है, और SSH का उपयोग केवल fallback के रूप में करता है।
- **iOS/Android Node**: सुविधा के रूप में Bonjour browse करते हैं और paired Gateway WS से connect करते हैं।

## संबंधित

- [Remote access](/hi/gateway/remote)
- [Tailscale](/hi/gateway/tailscale)
- [Bonjour discovery](/hi/gateway/bonjour)
