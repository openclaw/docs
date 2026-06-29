---
read_when:
    - Gateway Control UI को localhost के बाहर एक्सपोज़ करना
    - tailnet या सार्वजनिक डैशबोर्ड एक्सेस को स्वचालित करना
summary: Gateway डैशबोर्ड के लिए एकीकृत Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-06-28T23:14:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw Gateway डैशबोर्ड और WebSocket पोर्ट के लिए Tailscale **Serve** (tailnet) या **Funnel** (सार्वजनिक) को ऑटो-कॉन्फ़िगर कर सकता है। इससे Gateway loopback से बंधा रहता है, जबकि
Tailscale HTTPS, रूटिंग, और (Serve के लिए) पहचान हेडर प्रदान करता है।

## मोड

- `serve`: `tailscale serve` के माध्यम से केवल-tailnet Serve। Gateway `127.0.0.1` पर रहता है।
- `funnel`: `tailscale funnel` के माध्यम से सार्वजनिक HTTPS। OpenClaw को साझा पासवर्ड चाहिए।
- `off`: डिफ़ॉल्ट (कोई Tailscale ऑटोमेशन नहीं)।

स्थिति और ऑडिट आउटपुट इस OpenClaw Serve/Funnel मोड के लिए **Tailscale एक्सपोज़र** का उपयोग करते हैं। `off` का अर्थ है कि OpenClaw Serve या Funnel को प्रबंधित नहीं कर रहा है; इसका अर्थ यह नहीं है कि स्थानीय Tailscale daemon बंद है या लॉग आउट है।

## ऑथ

हैंडशेक नियंत्रित करने के लिए `gateway.auth.mode` सेट करें:

- `none` (केवल निजी इनग्रेस)
- `token` (जब `OPENCLAW_GATEWAY_TOKEN` सेट हो तो डिफ़ॉल्ट)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` या कॉन्फ़िग के माध्यम से साझा सीक्रेट)
- `trusted-proxy` (पहचान-जागरूक रिवर्स प्रॉक्सी; देखें [विश्वसनीय प्रॉक्सी ऑथ](/hi/gateway/trusted-proxy-auth))

जब `tailscale.mode = "serve"` और `gateway.auth.allowTailscale` `true` हो,
Control UI/WebSocket ऑथ token/password दिए बिना Tailscale पहचान हेडर
(`tailscale-user-login`) का उपयोग कर सकता है। OpenClaw पहचान को स्वीकार करने से पहले स्थानीय Tailscale daemon (`tailscale whois`) के माध्यम से `x-forwarded-for` पते को resolve करके और उसे हेडर से मिलाकर सत्यापित करता है।
OpenClaw किसी अनुरोध को केवल तब Serve मानता है जब वह loopback से
Tailscale के `x-forwarded-for`, `x-forwarded-proto`, और `x-forwarded-host`
हेडर के साथ आता है।
ब्राउज़र डिवाइस पहचान शामिल करने वाले Control UI ऑपरेटर सत्रों के लिए, यह सत्यापित Serve पथ device-pairing round trip को भी छोड़ देता है। यह ब्राउज़र डिवाइस पहचान को bypass नहीं करता: बिना-डिवाइस वाले clients अब भी अस्वीकार किए जाते हैं, और node-role या गैर-Control UI WebSocket कनेक्शन अब भी सामान्य pairing और auth जांचों का पालन करते हैं।
HTTP API endpoints (उदाहरण के लिए `/v1/*`, `/tools/invoke`, और `/api/channels/*`)
Tailscale पहचान-हेडर ऑथ का उपयोग **नहीं** करते। वे अब भी gateway के सामान्य HTTP ऑथ मोड का पालन करते हैं: डिफ़ॉल्ट रूप से shared-secret ऑथ, या जानबूझकर कॉन्फ़िगर किया गया trusted-proxy / private-ingress `none` सेटअप।
यह tokenless flow मानता है कि gateway host विश्वसनीय है। यदि उसी host पर अविश्वसनीय स्थानीय code चल सकता है, तो `gateway.auth.allowTailscale` अक्षम करें और इसके बजाय token/password ऑथ आवश्यक करें।
स्पष्ट shared-secret credentials आवश्यक करने के लिए, `gateway.auth.allowTailscale: false`
सेट करें और `gateway.auth.mode: "token"` या `"password"` का उपयोग करें।

## कॉन्फ़िग उदाहरण

### केवल-tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

खोलें: `https://<magicdns>/` (या आपका कॉन्फ़िगर किया गया `gateway.controlUi.basePath`)

Control UI को device hostname के बजाय नामित Tailscale Service के माध्यम से expose करने के लिए, `gateway.tailscale.serviceName` को Service नाम पर सेट करें:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

ऊपर दिए गए उदाहरण के साथ, startup device hostname के बजाय Service URL को
`https://openclaw.<tailnet-name>.ts.net/` के रूप में रिपोर्ट करता है।
Tailscale Services के लिए host का आपके tailnet में approved tagged node होना आवश्यक है। इस विकल्प को सक्षम करने से पहले Tailscale में tag कॉन्फ़िगर करें और Service को approve करें, अन्यथा gateway startup के दौरान `tailscale serve --service=...` विफल हो जाएगा।

### केवल-tailnet (Tailnet IP से bind करें)

जब आप चाहते हैं कि Gateway सीधे Tailnet IP पर सुने, तो इसका उपयोग करें (कोई Serve/Funnel नहीं)।

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

दूसरे Tailnet device से कनेक्ट करें:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) इस मोड में काम **नहीं** करेगा।
</Note>

### सार्वजनिक इंटरनेट (Funnel + साझा पासवर्ड)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

पासवर्ड को disk पर commit करने के बजाय `OPENCLAW_GATEWAY_PASSWORD` को प्राथमिकता दें।

## CLI उदाहरण

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## नोट्स

- Tailscale Serve/Funnel के लिए `tailscale` CLI का installed और logged in होना आवश्यक है।
- सार्वजनिक exposure से बचने के लिए `tailscale.mode: "funnel"` तब तक start करने से इनकार करता है जब तक auth mode `password` न हो।
- `gateway.tailscale.serviceName` केवल Serve मोड पर लागू होता है और
  `tailscale serve --service=<name>` को पास किया जाता है। मान को Tailscale के
  `svc:<dns-label>` Service नाम format का उपयोग करना चाहिए, उदाहरण के लिए `svc:openclaw`।
  Tailscale के लिए Service hosts का tagged nodes होना आवश्यक है, और Serve द्वारा उसे publish करने से पहले Service को admin console में approval की आवश्यकता हो सकती है।
- यदि आप चाहते हैं कि OpenClaw shutdown पर `tailscale serve`
  या `tailscale funnel` कॉन्फ़िगरेशन को undo करे, तो `gateway.tailscale.resetOnExit` सेट करें।
- gateway restarts के दौरान externally configured `tailscale funnel` route को alive रखने के लिए `gateway.tailscale.preserveFunnel: true` सेट करें। सक्षम होने पर और gateway के `mode: "serve"` में चलने पर, OpenClaw Serve को फिर से apply करने से पहले `tailscale funnel status` जांचता है और जब कोई Funnel route पहले से gateway port को cover करता है, तो उसे छोड़ देता है। OpenClaw-managed Funnel password-only policy अपरिवर्तित रहती है।
- `gateway.bind: "tailnet"` एक direct Tailnet bind है (कोई HTTPS नहीं, कोई Serve/Funnel नहीं)।
- `gateway.bind: "auto"` loopback को प्राथमिकता देता है; यदि आप केवल-Tailnet चाहते हैं तो `tailnet` का उपयोग करें।
- Serve/Funnel केवल **Gateway control UI + WS** को expose करते हैं। Nodes उसी Gateway WS endpoint पर connect करते हैं, इसलिए Serve node access के लिए काम कर सकता है।

## ब्राउज़र नियंत्रण (remote Gateway + local browser)

यदि आप Gateway को एक machine पर चलाते हैं लेकिन browser को दूसरी machine पर drive करना चाहते हैं,
तो browser machine पर एक **node host** चलाएं और दोनों को उसी tailnet पर रखें।
Gateway browser actions को node तक proxy करेगा; अलग control server या Serve URL की आवश्यकता नहीं है।

browser control के लिए Funnel से बचें; node pairing को operator access जैसा मानें।

## Tailscale पूर्वापेक्षाएं + सीमाएं

- Serve के लिए आपके tailnet के लिए HTTPS enabled होना आवश्यक है; यदि यह अनुपस्थित हो तो CLI prompt करता है।
- Serve Tailscale पहचान हेडर inject करता है; Funnel नहीं करता।
- Funnel के लिए Tailscale v1.38.3+, MagicDNS, HTTPS enabled, और funnel node attribute आवश्यक हैं।
- Funnel TLS पर केवल ports `443`, `8443`, और `10000` का समर्थन करता है।
- macOS पर Funnel के लिए open-source Tailscale app variant आवश्यक है।

## और जानें

- Tailscale Serve overview: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` command: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel overview: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` command: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## संबंधित

- [Remote access](/hi/gateway/remote)
- [Discovery](/hi/gateway/discovery)
- [Authentication](/hi/gateway/authentication)
