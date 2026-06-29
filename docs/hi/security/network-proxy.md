---
read_when:
    - आप SSRF और DNS रीबाइंडिंग हमलों के विरुद्ध बहु-स्तरीय सुरक्षा चाहते हैं
    - OpenClaw runtime ट्रैफ़िक के लिए बाहरी forward proxy कॉन्फ़िगर करना
summary: OpenClaw रनटाइम HTTP और WebSocket ट्रैफ़िक को ऑपरेटर-प्रबंधित फ़िल्टरिंग प्रॉक्सी के माध्यम से कैसे रूट करें
title: नेटवर्क प्रॉक्सी
x-i18n:
    generated_at: "2026-06-29T00:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw रनटाइम HTTP और WebSocket ट्रैफ़िक को ऑपरेटर-प्रबंधित फ़ॉरवर्ड प्रॉक्सी के माध्यम से रूट कर सकता है। यह उन डिप्लॉयमेंट के लिए वैकल्पिक रक्षा-गहराई है जो केंद्रीय ईग्रेस नियंत्रण, मजबूत SSRF सुरक्षा, और बेहतर नेटवर्क ऑडिटेबिलिटी चाहते हैं।

OpenClaw कोई प्रॉक्सी शिप, डाउनलोड, शुरू, कॉन्फ़िगर, या प्रमाणित नहीं करता। आप अपने परिवेश के लिए उपयुक्त प्रॉक्सी तकनीक चलाते हैं, और OpenClaw सामान्य प्रक्रिया-स्थानीय HTTP और WebSocket क्लाइंट्स को उसके माध्यम से रूट करता है।

## प्रॉक्सी का उपयोग क्यों करें

प्रॉक्सी ऑपरेटरों को आउटबाउंड HTTP और WebSocket ट्रैफ़िक के लिए एक नेटवर्क नियंत्रण बिंदु देता है। यह SSRF हार्डनिंग के बाहर भी उपयोगी हो सकता है:

- केंद्रीय नीति: हर एप्लिकेशन HTTP कॉल साइट पर नेटवर्क नियमों को सही कराने पर निर्भर रहने के बजाय एक ईग्रेस नीति बनाए रखें।
- कनेक्ट-समय जांचें: DNS रिज़ॉल्यूशन के बाद और प्रॉक्सी द्वारा अपस्ट्रीम कनेक्शन खोलने से ठीक पहले गंतव्य का मूल्यांकन करें।
- DNS रीबाइंडिंग रक्षा: एप्लिकेशन-स्तरीय DNS जांच और वास्तविक आउटबाउंड कनेक्शन के बीच का अंतर घटाएं।
- व्यापक JavaScript कवरेज: सामान्य `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch, और समान क्लाइंट्स को उसी पथ से रूट करें।
- ऑडिटेबिलिटी: ईग्रेस सीमा पर अनुमत और अस्वीकृत गंतव्यों को लॉग करें।
- परिचालन नियंत्रण: OpenClaw को फिर से बनाए बिना गंतव्य नियम, नेटवर्क सेगमेंटेशन, दर सीमाएं, या आउटबाउंड अलाउलिस्ट लागू करें।

प्रॉक्सी रूटिंग सामान्य HTTP और WebSocket ईग्रेस के लिए प्रक्रिया-स्तरीय गार्डरेल है। यह ऑपरेटरों को समर्थित JavaScript HTTP क्लाइंट्स को उनके अपने फ़िल्टरिंग प्रॉक्सी के माध्यम से रूट करने के लिए fail-closed पथ देता है, लेकिन यह OS-स्तरीय नेटवर्क सैंडबॉक्स नहीं है और OpenClaw को प्रॉक्सी की गंतव्य नीति प्रमाणित नहीं कराता।

## OpenClaw ट्रैफ़िक कैसे रूट करता है

जब `proxy.enabled=true` हो और प्रॉक्सी URL कॉन्फ़िगर किया गया हो, तो संरक्षित रनटाइम प्रक्रियाएं जैसे `openclaw gateway run`, `openclaw node run`, और `openclaw agent --local` सामान्य HTTP और WebSocket ईग्रेस को कॉन्फ़िगर किए गए प्रॉक्सी के माध्यम से रूट करती हैं:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

सार्वजनिक अनुबंध रूटिंग व्यवहार है, उसे लागू करने के लिए उपयोग किए गए आंतरिक Node hooks नहीं। OpenClaw Gateway control-plane WebSocket क्लाइंट local loopback Gateway RPC ट्रैफ़िक के लिए एक संकीर्ण प्रत्यक्ष पथ का उपयोग करते हैं जब Gateway URL `localhost` या शाब्दिक लूपबैक IP जैसे `127.0.0.1` या `[::1]` का उपयोग करता है। उस control-plane पथ को loopback Gateways तक पहुंच पाने में सक्षम होना चाहिए, भले ही ऑपरेटर प्रॉक्सी लूपबैक गंतव्यों को ब्लॉक करे। सामान्य रनटाइम HTTP और WebSocket अनुरोध फिर भी कॉन्फ़िगर किए गए प्रॉक्सी का उपयोग करते हैं।

आंतरिक रूप से, OpenClaw इस सुविधा के लिए प्रक्रिया-स्तरीय रूटिंग रनटाइम के रूप में Proxyline इंस्टॉल करता है। Proxyline `fetch`, undici-आधारित क्लाइंट्स, Node core `node:http` / `node:https` callers, सामान्य WebSocket क्लाइंट्स, और helper-created CONNECT tunnels को कवर करता है। Managed proxy mode caller-provided Node HTTP agents को बदल देता है ताकि स्पष्ट agents गलती से ऑपरेटर प्रॉक्सी को bypass न कर दें।

कुछ plugins custom transports के स्वामी होते हैं जिन्हें process-level routing मौजूद होने पर भी explicit proxy wiring की आवश्यकता होती है। उदाहरण के लिए, Telegram का Bot API transport अपना HTTP/1 undici dispatcher उपयोग करता है और इसलिए उस owner-specific transport path में process proxy env के साथ managed `OPENCLAW_PROXY_URL` fallback का सम्मान करता है।

प्रॉक्सी URL स्वयं `http://` या `https://` में से किसी का उपयोग कर सकता है। ये schemes OpenClaw से प्रॉक्सी endpoint तक के कनेक्शन का वर्णन करती हैं:

- `http://proxy.example:3128`: OpenClaw forward proxy के लिए plain TCP connection खोलता है और HTTPS गंतव्यों के लिए `CONNECT` सहित HTTP proxy requests भेजता है।
- `https://proxy.example:8443`: OpenClaw proxy endpoint तक TLS खोलता है, proxy certificate सत्यापित करता है, और फिर उस TLS session के अंदर HTTP proxy requests भेजता है।

Destination HTTPS proxy endpoint TLS से अलग है। HTTPS destination के लिए, OpenClaw अब भी proxy से HTTP `CONNECT` tunnel मांगता है और फिर उस tunnel के माध्यम से destination TLS शुरू करता है।

जब proxy सक्रिय हो, OpenClaw `no_proxy` और `NO_PROXY` साफ़ करता है। वे bypass lists destination-based होती हैं, इसलिए वहां `localhost` या `127.0.0.1` छोड़ने से high-risk SSRF targets filtering proxy को skip कर सकते हैं।

Shutdown पर, OpenClaw पिछला proxy environment restore करता है और cached process routing state reset करता है।

## संबंधित प्रॉक्सी शब्द

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw runtime egress के लिए outbound forward-proxy routing। यह पृष्ठ उस सुविधा का दस्तावेज़ीकरण करता है।
- `gateway.auth.mode: "trusted-proxy"`: Gateway access के लिए inbound identity-aware reverse-proxy authentication। देखें [Trusted proxy auth](/hi/gateway/trusted-proxy-auth)।
- `openclaw proxy`: development और support के लिए local debug proxy और capture inspector। देखें [openclaw proxy](/hi/cli/proxy)।
- `tools.web.fetch.useTrustedEnvProxy`: default strict DNS pinning और hostname policy बनाए रखते हुए `web_fetch` को operator-controlled HTTP(S) env proxy से DNS resolve कराने के लिए opt-in। देखें [Web fetch](/hi/tools/web-fetch#trusted-env-proxy)।
- Channel या provider-specific proxy settings: किसी विशेष transport के लिए owner-specific overrides। जब लक्ष्य runtime भर में central egress control हो, तो managed network proxy को प्राथमिकता दें।

## कॉन्फ़िगरेशन

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

private proxy CA वाले HTTPS proxy endpoint के लिए:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

आप config में `proxy.enabled=true` रखते हुए environment के माध्यम से भी URL दे सकते हैं:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`, `OPENCLAW_PROXY_URL` पर प्राथमिकता लेता है।

### Gateway लूपबैक मोड

Local Gateway control-plane clients आमतौर पर `ws://127.0.0.1:18789` जैसे loopback WebSocket से connect करते हैं। Managed proxy सक्रिय होने पर loopback managed-proxy exceptions कैसे व्यवहार करें यह चुनने के लिए `proxy.loopbackMode` उपयोग करें:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (default): OpenClaw Gateway loopback authority को Proxyline की managed bypass policy में register करता है ताकि local Gateway WebSocket traffic सीधे connect कर सके। Custom loopback Gateway ports काम करते हैं क्योंकि active Gateway URL का host और port registered होते हैं। Bundled browser plugin OpenClaw-launched managed browsers के लिए exact local CDP readiness और DevTools WebSocket endpoints भी register कर सकता है, और bundled Ollama memory embedding provider exact configured host-local loopback embedding origin के लिए अपना narrower guarded direct path उपयोग कर सकता है।
- `proxy`: OpenClaw Gateway या Ollama loopback bypasses register नहीं करता, इसलिए वह loopback traffic managed proxy के माध्यम से भेजा जाता है। यदि proxy remote है, तो उसे OpenClaw host की loopback service के लिए special routing देना होगा, जैसे उसे proxy-reachable hostname, IP, या tunnel पर map करना। Standard remote proxies `127.0.0.1` और `localhost` को proxy host से resolve करते हैं, OpenClaw host से नहीं।
- `block`: OpenClaw socket खोलने से पहले Gateway loopback control-plane connections और guarded Ollama host-local embedding loopback connections को अस्वीकार करता है।

यदि `enabled=true` है लेकिन कोई valid proxy URL configured नहीं है, तो protected commands direct network access पर fallback करने के बजाय startup fail करती हैं।

`openclaw gateway start` से शुरू की गई managed gateway services के लिए, URL को config में store करना बेहतर है:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Environment fallback foreground runs के लिए सबसे उपयुक्त है। यदि आप इसे installed service के साथ उपयोग करते हैं, तो `OPENCLAW_PROXY_URL` को service durable environment में रखें, जैसे `$OPENCLAW_STATE_DIR/.env` या `~/.openclaw/.env`, फिर service को reinstall करें ताकि launchd, systemd, या Scheduled Tasks उस value के साथ gateway शुरू करे।

`openclaw --container ...` commands के लिए, OpenClaw set होने पर `OPENCLAW_PROXY_URL` को container-targeted child CLI में forward करता है। URL container के अंदर से reachable होना चाहिए; `127.0.0.1` host नहीं, container स्वयं को संदर्भित करता है। OpenClaw container-targeted commands के लिए loopback proxy URLs को अस्वीकार करता है, जब तक कि आप उस safety check को explicitly override न करें।

## प्रॉक्सी आवश्यकताएं

प्रॉक्सी नीति ही सुरक्षा सीमा है। OpenClaw यह सत्यापित नहीं कर सकता कि प्रॉक्सी सही targets को block करता है।

प्रॉक्सी को इस तरह कॉन्फ़िगर करें कि वह:

- केवल loopback या private trusted interface से bind करे।
- access को restrict करे ताकि केवल OpenClaw process, host, container, या service account ही उसका उपयोग कर सके।
- destinations को स्वयं resolve करे और DNS resolution के बाद destination IPs को block करे।
- plain HTTP requests और HTTPS `CONNECT` tunnels, दोनों के लिए connect time पर policy लागू करे।
- loopback, private, link-local, metadata, multicast, reserved, या documentation ranges के लिए destination-based bypasses को reject करे।
- hostname allowlists से बचें, जब तक कि आप DNS resolution path पर पूरी तरह trust न करते हों।
- request bodies, authorization headers, cookies, या अन्य secrets को log किए बिना destination, decision, status, और reason log करे।
- proxy policy को version control में रखें और changes की समीक्षा security-sensitive configuration की तरह करें।

## अनुशंसित ब्लॉक किए गए गंतव्य

किसी भी forward proxy, firewall, या egress policy के लिए इस denylist को starting point के रूप में उपयोग करें।

OpenClaw application-level classifier logic `src/infra/net/ssrf.ts` और `packages/net-policy/src/ip.ts` में रहता है। संबंधित parity hooks `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, और NAT64, 6to4, Teredo, ISATAP, और IPv4-mapped forms के लिए embedded IPv4 sentinel handling हैं। External proxy policy maintain करते समय वे files उपयोगी references हैं, लेकिन OpenClaw आपके proxy में उन rules को automatically export या enforce नहीं करता।

| श्रेणी या होस्ट                                                                      | ब्लॉक करने का कारण                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 लूपबैक                                         |
| `::1/128`                                                                            | IPv6 लूपबैक                                         |
| `0.0.0.0/8`, `::/128`                                                                | अनिर्दिष्ट और इस-नेटवर्क पते                        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 निजी नेटवर्क                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | लिंक-लोकल पते और सामान्य क्लाउड मेटाडेटा पथ        |
| `169.254.169.254`, `metadata.google.internal`                                        | क्लाउड मेटाडेटा सेवाएं                              |
| `100.64.0.0/10`                                                                      | कैरियर-ग्रेड NAT साझा पता स्थान                     |
| `198.18.0.0/15`, `2001:2::/48`                                                       | बेंचमार्किंग श्रेणियां                              |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | विशेष-उपयोग और दस्तावेज़ीकरण श्रेणियां              |
| `224.0.0.0/4`, `ff00::/8`                                                            | मल्टीकास्ट                                          |
| `240.0.0.0/4`                                                                        | आरक्षित IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 स्थानीय/निजी श्रेणियां                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6 डिस्कार्ड और ORCHIDv2 श्रेणियां                |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | एम्बेडेड IPv4 वाले NAT64 प्रीफ़िक्स                 |
| `2002::/16`, `2001::/32`                                                             | एम्बेडेड IPv4 वाले 6to4 और Teredo                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-संगत और IPv4-मैप्ड IPv6                        |

यदि आपका क्लाउड प्रदाता या नेटवर्क प्लेटफ़ॉर्म अतिरिक्त मेटाडेटा होस्ट या आरक्षित श्रेणियां दस्तावेज़ित करता है, तो उन्हें भी जोड़ें।

## सत्यापन

प्रॉक्सी को उसी होस्ट, कंटेनर, या सेवा खाते से सत्यापित करें जो OpenClaw चलाता है:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

निजी CA द्वारा हस्ताक्षरित HTTPS प्रॉक्सी एंडपॉइंट के लिए:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

डिफ़ॉल्ट रूप से, जब कोई कस्टम गंतव्य नहीं दिए जाते, कमांड जांचता है कि `https://example.com/` सफल होता है और एक अस्थायी लूपबैक कैनरी शुरू करता है, जिस तक प्रॉक्सी नहीं पहुंचनी चाहिए। डिफ़ॉल्ट अस्वीकृत जांच तब पास होती है जब प्रॉक्सी non-2xx अस्वीकृति प्रतिक्रिया लौटाता है या ट्रांसपोर्ट विफलता के साथ कैनरी को ब्लॉक करता है; यदि सफल प्रतिक्रिया कैनरी तक पहुंचती है तो यह विफल होती है। यदि कोई प्रॉक्सी सक्षम और कॉन्फ़िगर नहीं है, तो सत्यापन कॉन्फ़िग समस्या रिपोर्ट करता है; कॉन्फ़िग बदलने से पहले एकबारगी प्रीफ़्लाइट के लिए `--proxy-url` का उपयोग करें। परिनियोजन-विशिष्ट अपेक्षाओं की जांच के लिए `--allowed-url` और `--denied-url` का उपयोग करें। यह भी सत्यापित करने के लिए `--apns-reachable` जोड़ें कि सीधी APNs HTTP/2 डिलीवरी प्रॉक्सी के माध्यम से CONNECT टनल खोल सकती है और sandbox APNs प्रतिक्रिया प्राप्त कर सकती है; जांच जानबूझकर अमान्य प्रदाता टोकन का उपयोग करती है, इसलिए `403 InvalidProviderToken` अपेक्षित है और पहुंच योग्य माना जाता है। कस्टम अस्वीकृत गंतव्य fail-closed होते हैं: किसी भी HTTP प्रतिक्रिया का अर्थ है कि गंतव्य प्रॉक्सी के माध्यम से पहुंच योग्य था, और किसी भी ट्रांसपोर्ट त्रुटि को अनिर्णायक बताया जाता है क्योंकि OpenClaw यह साबित नहीं कर सकता कि प्रॉक्सी ने किसी पहुंच योग्य origin को ब्लॉक किया। सत्यापन विफल होने पर, कमांड कोड 1 के साथ बाहर निकलता है।

ऑटोमेशन के लिए `--json` का उपयोग करें। JSON आउटपुट में समग्र परिणाम, प्रभावी प्रॉक्सी कॉन्फ़िग स्रोत, कोई भी कॉन्फ़िग त्रुटियां, और प्रत्येक गंतव्य जांच शामिल होती है। प्रॉक्सी URL क्रेडेंशियल टेक्स्ट और JSON आउटपुट में redacted होते हैं:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

आप `curl` के साथ मैन्युअल रूप से भी सत्यापित कर सकते हैं:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

सार्वजनिक अनुरोध सफल होना चाहिए। लूपबैक और मेटाडेटा अनुरोध प्रॉक्सी द्वारा ब्लॉक किए जाने चाहिए। `openclaw proxy validate` के लिए, बिल्ट-इन लूपबैक कैनरी प्रॉक्सी अस्वीकृति को पहुंच योग्य origin से अलग कर सकती है। कस्टम `--denied-url` जांचों में वह कैनरी नहीं होती, इसलिए HTTP प्रतिक्रियाओं और अस्पष्ट ट्रांसपोर्ट विफलताओं, दोनों को सत्यापन विफलता मानें, जब तक कि आपका प्रॉक्सी कोई परिनियोजन-विशिष्ट अस्वीकृति संकेत उजागर नहीं करता जिसे आप अलग से सत्यापित कर सकें।

## प्रॉक्सी CA भरोसा

जब प्रॉक्सी एंडपॉइंट स्वयं निजी CA द्वारा हस्ताक्षरित प्रमाणपत्र का उपयोग करता है, तो प्रबंधित `proxy.tls.caFile` का उपयोग करें:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

उस CA का उपयोग प्रॉक्सी एंडपॉइंट के TLS सत्यापन के लिए किया जाता है। यह गंतव्य MITM भरोसा सेटिंग, क्लाइंट प्रमाणपत्र, या प्रॉक्सी की गंतव्य नीति का प्रतिस्थापन नहीं है।

`NODE_EXTRA_CA_CERTS` का उपयोग केवल तब करें जब पूरे Node प्रोसेस को प्रोसेस startup से अतिरिक्त CA पर भरोसा करना हो, जैसे जब कोई enterprise TLS inspection system प्रोसेस में हर HTTPS क्लाइंट के लिए गंतव्य प्रमाणपत्रों पर फिर से हस्ताक्षर करता है। `NODE_EXTRA_CA_CERTS` प्रोसेस-वैश्विक है और Node शुरू होने से पहले मौजूद होना चाहिए। HTTPS प्रॉक्सी एंडपॉइंट भरोसे के लिए `proxy.tls.caFile` को प्राथमिकता दें क्योंकि यह प्रबंधित प्रॉक्सी रूटिंग तक सीमित होता है।

फिर OpenClaw प्रॉक्सी रूटिंग सक्षम करें:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

या सेट करें:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## सीमाएं

- प्रॉक्सी process-local JavaScript HTTP और WebSocket क्लाइंट के लिए कवरेज सुधारता है, लेकिन यह OS-स्तरीय नेटवर्क sandbox नहीं है।
- Gateway लूपबैक control-plane ट्रैफ़िक डिफ़ॉल्ट रूप से `proxy.loopbackMode: "gateway-only"` के माध्यम से सीधे local bypass पर जाता है। OpenClaw यह bypass Proxyline की managed bypass policy में सक्रिय Gateway लूपबैक authority को पंजीकृत करके लागू करता है। ऑपरेटर Gateway लूपबैक ट्रैफ़िक को प्रबंधित प्रॉक्सी के माध्यम से भेजने के लिए `proxy.loopbackMode: "proxy"` सेट कर सकते हैं, या लूपबैक Gateway कनेक्शन अस्वीकार करने के लिए `proxy.loopbackMode: "block"` सेट कर सकते हैं। remote-proxy caveat के लिए [Gateway लूपबैक मोड](#gateway-loopback-mode) देखें।
- Raw `net`, `tls`, और `http2` sockets, native addons, और गैर-OpenClaw child processes Node-स्तरीय प्रॉक्सी रूटिंग को bypass कर सकते हैं, जब तक वे प्रॉक्सी environment variables inherit और respect नहीं करते। Forked OpenClaw child CLIs प्रबंधित प्रॉक्सी URL और `proxy.loopbackMode` state inherit करते हैं।
- IRC ऑपरेटर-प्रबंधित forward proxy routing के बाहर एक raw TCP/TLS channel है। जिन परिनियोजनों में सभी egress उस forward proxy के माध्यम से जाना आवश्यक है, वहां `channels.irc.enabled=false` सेट करें, जब तक direct IRC egress स्पष्ट रूप से approved न हो।
- local debug proxy diagnostic tooling है और managed proxy mode सक्रिय रहते हुए proxy requests और CONNECT tunnels के लिए उसका direct upstream forwarding डिफ़ॉल्ट रूप से disabled होता है; direct forwarding केवल approved local diagnostics के लिए सक्षम करें।
- उपयोगकर्ता local WebUIs और local model servers को आवश्यकता पड़ने पर operator proxy policy में allowlist किया जाना चाहिए; OpenClaw उनके लिए कोई general local-network bypass उजागर नहीं करता। bundled Ollama memory embedding provider अधिक संकीर्ण है: यह केवल configured `baseUrl` से निकाले गए exact host-local loopback embedding origin के लिए guarded direct path का उपयोग कर सकता है, ताकि managed proxy host loopback तक नहीं पहुंच पाने पर भी host-local embeddings काम करती रहें। LAN, tailnet, private-network, और public Ollama embedding hosts अभी भी managed proxy path का उपयोग करते हैं। `proxy.loopbackMode: "proxy"` इस Ollama loopback traffic को managed proxy के माध्यम से भेजता है, और `proxy.loopbackMode: "block"` connection खोलने से पहले इसे अस्वीकार करता है।
- Gateway control-plane proxy bypass जानबूझकर `localhost` और literal loopback IP URLs तक सीमित है। local direct Gateway control-plane connections के लिए `ws://127.0.0.1:18789`, `ws://[::1]:18789`, या `ws://localhost:18789` का उपयोग करें; अन्य hostnames ordinary hostname-based traffic की तरह route होते हैं।
- OpenClaw आपकी प्रॉक्सी नीति का निरीक्षण, परीक्षण, या प्रमाणन नहीं करता।
- प्रॉक्सी नीति परिवर्तनों को security-sensitive operational changes मानें।

| सतह                                                         | प्रबंधित प्रॉक्सी स्थिति                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, common WebSocket clients | कॉन्फ़िगर होने पर managed proxy hooks के माध्यम से route किया जाता है।                            |
| APNs direct HTTP/2                                           | APNs managed CONNECT helper के माध्यम से route किया जाता है।                                      |
| Gateway control-plane loopback                               | केवल configured local loopback Gateway URL के लिए direct।                                         |
| Debug proxy upstream forwarding                              | managed proxy mode सक्रिय रहते हुए disabled, जब तक local diagnostics के लिए स्पष्ट रूप से enabled न हो। |
| IRC                                                          | Raw TCP/TLS; managed HTTP proxy mode द्वारा proxied नहीं। जब तक direct IRC egress approved न हो, disabled रखें। |
| अन्य raw `net`, `tls`, या `http2` client calls              | landing से पहले raw socket guard द्वारा classified होना चाहिए।                                    |
