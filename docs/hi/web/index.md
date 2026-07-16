---
read_when:
    - आप Tailscale के माध्यम से Gateway तक पहुँच चाहते हैं
    - आप ब्राउज़र Control UI और कॉन्फ़िगरेशन संपादन चाहते हैं
summary: 'Gateway वेब सतहें: नियंत्रण UI, बाइंड मोड और सुरक्षा'
title: वेब
x-i18n:
    generated_at: "2026-07-16T17:41:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway, Gateway WebSocket वाले उसी पोर्ट से एक छोटा **ब्राउज़र नियंत्रण UI** (Vite + Lit) उपलब्ध कराता है:

- डिफ़ॉल्ट: `http://<host>:18789/`
- `gateway.tls.enabled: true` के साथ: `https://<host>:18789/`
- वैकल्पिक उपसर्ग: `gateway.controlUi.basePath` सेट करें (उदा. `/openclaw`)

क्षमताएँ [नियंत्रण UI](/hi/web/control-ui) में दी गई हैं। यह पृष्ठ बाइंड मोड, सुरक्षा और अन्य वेब-संबंधी सतहों को कवर करता है।

## कॉन्फ़िगरेशन (डिफ़ॉल्ट रूप से चालू)

एसेट मौजूद होने पर नियंत्रण UI **डिफ़ॉल्ट रूप से सक्षम** होता है (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath वैकल्पिक है
  },
}
```

## Webhook

जब `hooks.enabled=true`, तो Gateway उसी HTTP सर्वर पर एक Webhook एंडपॉइंट भी उपलब्ध कराता है। प्रमाणीकरण और पेलोड के लिए [Gateway कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#hooks) में `hooks` देखें।

## व्यवस्थापक HTTP RPC

`POST /api/v1/admin/rpc` चुनिंदा Gateway नियंत्रण-प्लेन विधियों को HTTP पर उपलब्ध कराता है। यह डिफ़ॉल्ट रूप से बंद है; केवल `admin-http-rpc` Plugin सक्षम होने पर पंजीकृत होता है। प्रमाणीकरण मॉडल, अनुमत विधियों और WebSocket API के साथ तुलना के लिए [व्यवस्थापक HTTP RPC](/hi/plugins/admin-http-rpc) देखें।

## Tailscale एक्सेस

<Tabs>
  <Tab title="एकीकृत Serve (अनुशंसित)">
    Gateway को लूपबैक पर रखें और Tailscale Serve को उसका प्रॉक्सी बनने दें:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Gateway शुरू करें:

    ```bash
    openclaw gateway
    ```

    `https://<magicdns>/` (या अपना कॉन्फ़िगर किया हुआ `gateway.controlUi.basePath`) खोलें।

  </Tab>
  <Tab title="Tailnet बाइंड + टोकन">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Gateway शुरू करें (यह गैर-लूपबैक उदाहरण साझा-गुप्त टोकन प्रमाणीकरण का उपयोग करता है):

    ```bash
    openclaw gateway
    ```

    `http://<tailscale-ip>:18789/` (या अपना कॉन्फ़िगर किया हुआ `gateway.controlUi.basePath`) खोलें।

  </Tab>
  <Tab title="सार्वजनिक इंटरनेट (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // या OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` के लिए `gateway.auth.mode: "password"` आवश्यक है; Serve और Funnel दोनों के लिए `gateway.bind: "loopback"` आवश्यक है।

  </Tab>
</Tabs>

## सुरक्षा संबंधी टिप्पणियाँ

- Gateway प्रमाणीकरण डिफ़ॉल्ट रूप से आवश्यक है: टोकन, पासवर्ड, विश्वसनीय-प्रॉक्सी या सक्षम होने पर Tailscale Serve पहचान हेडर।
- गैर-लूपबैक बाइंड के लिए भी Gateway प्रमाणीकरण **आवश्यक** है: टोकन/पासवर्ड प्रमाणीकरण या `gateway.auth.mode: "trusted-proxy"` वाला पहचान-जागरूक रिवर्स प्रॉक्सी।
- ऑनबोर्डिंग विज़ार्ड डिफ़ॉल्ट रूप से साझा-गुप्त प्रमाणीकरण बनाता है और आम तौर पर लूपबैक पर भी Gateway टोकन जनरेट करता है।
- साझा-गुप्त मोड में, UI WebSocket हैंडशेक के दौरान `connect.params.auth.token` या `connect.params.auth.password` भेजता है।
- `gateway.tls.enabled: true` के साथ, स्थानीय डैशबोर्ड/स्थिति सहायक `https://` URL और `wss://` WebSocket URL रेंडर करते हैं।
- पहचान-युक्त मोड (Tailscale Serve, `trusted-proxy`) में, WebSocket प्रमाणीकरण जाँच साझा गुप्त के बजाय अनुरोध हेडर से पूरी होती है।
- सार्वजनिक गैर-लूपबैक नियंत्रण UI परिनियोजनों के लिए, `gateway.controlUi.allowedOrigins` को स्पष्ट रूप से सेट करें (पूर्ण ओरिजिन)। लूपबैक, RFC1918/लिंक-लोकल, `.local`, `.ts.net` और Tailscale CGNAT होस्ट के लिए निजी समान-ओरिजिन लोड इसके बिना स्वीकार किए जाते हैं।
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` Host हेडर ओरिजिन फ़ॉलबैक सक्षम करता है; यह सुरक्षा का एक खतरनाक अवनयन है।
- Serve के साथ, `gateway.auth.allowTailscale: true` होने पर Tailscale पहचान हेडर नियंत्रण UI/WebSocket प्रमाणीकरण को पूरा करते हैं (किसी टोकन/पासवर्ड की आवश्यकता नहीं)। HTTP API एंडपॉइंट Tailscale पहचान हेडर का उपयोग नहीं करते; वे हमेशा Gateway के सामान्य HTTP प्रमाणीकरण मोड का पालन करते हैं। Serve पर भी स्पष्ट क्रेडेंशियल आवश्यक करने के लिए `gateway.auth.allowTailscale: false` सेट करें। यह टोकन-रहित प्रवाह मानता है कि स्वयं Gateway होस्ट विश्वसनीय है। [Tailscale](/hi/gateway/tailscale) और [सुरक्षा](/hi/gateway/security) देखें।

## UI बनाना

Gateway `dist/control-ui` से स्थिर फ़ाइलें उपलब्ध कराता है:

```bash
pnpm ui:build
```
