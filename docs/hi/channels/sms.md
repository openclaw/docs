---
read_when:
    - आप OpenClaw को Twilio के माध्यम से एसएमएस से जोड़ना चाहते हैं
    - आपको SMS Webhook या allowlist सेटअप की आवश्यकता है
summary: Twilio SMS चैनल सेटअप, एक्सेस नियंत्रण, और Webhook कॉन्फ़िगरेशन
title: SMS
x-i18n:
    generated_at: "2026-06-28T22:40:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw, Twilio फ़ोन नंबर या Messaging Service के ज़रिए SMS प्राप्त और भेज सकता है। Gateway एक इनबाउंड Webhook रूट रजिस्टर करता है, डिफ़ॉल्ट रूप से Twilio अनुरोध सिग्नेचर मान्य करता है, और Twilio के Messages API के ज़रिए जवाब वापस भेजता है।

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    SMS के लिए डिफ़ॉल्ट DM नीति पेयरिंग है।
  </Card>
  <Card title="Gateway सुरक्षा" icon="shield" href="/hi/gateway/security">
    Webhook एक्सपोज़र और प्रेषक एक्सेस नियंत्रणों की समीक्षा करें।
  </Card>
  <Card title="चैनल समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नोस्टिक्स और रिपेयर प्लेबुक।
  </Card>
</CardGroup>

## शुरू करने से पहले

आपको चाहिए:

- `openclaw plugins install @openclaw/sms` के साथ आधिकारिक SMS Plugin इंस्टॉल किया हुआ।
- SMS-सक्षम फ़ोन नंबर वाला Twilio खाता, या Twilio Messaging Service।
- Twilio Account SID और Auth Token।
- एक सार्वजनिक HTTPS URL जो आपके OpenClaw Gateway तक पहुंचता हो।
- प्रेषक नीति विकल्प: निजी उपयोग के लिए `pairing`, पहले से स्वीकृत फ़ोन नंबरों के लिए `allowlist`, या केवल जानबूझकर सार्वजनिक SMS एक्सेस के लिए `open`।

यदि नंबर में दोनों क्षमताएं हैं, तो SMS और Voice Call दोनों के लिए एक ही Twilio नंबर का उपयोग करें। Twilio में SMS Webhook और Voice Webhook को अलग-अलग कॉन्फ़िगर करें; यह पेज केवल SMS Webhook को कवर करता है।

## त्वरित सेटअप

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Twilio प्रेषक बनाएं या चुनें">
    Twilio में, **Phone Numbers > Manage > Active numbers** खोलें और SMS-सक्षम नंबर चुनें। सहेजें:

    - Account SID, उदाहरण के लिए `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - प्रेषक फ़ोन नंबर, उदाहरण के लिए `+15551234567`

    यदि आप किसी निश्चित प्रेषक नंबर के बजाय Messaging Service का उपयोग करते हैं, तो Messaging Service SID सहेजें, उदाहरण के लिए `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`।

  </Step>

  <Step title="SMS चैनल कॉन्फ़िगर करें">

इसे `sms.patch.json5` के रूप में सहेजें और प्लेसहोल्डर बदलें:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

इसे लागू करें:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Twilio को Gateway Webhook पर इंगित करें">
    Twilio फ़ोन नंबर सेटिंग्स में, **Messaging** खोलें और **A message comes in** को इस पर सेट करें:

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` का उपयोग करें। डिफ़ॉल्ट स्थानीय पथ `/webhooks/sms` है; यदि आपको अलग रूट चाहिए तो `channels.sms.webhookPath` बदलें।

  </Step>

  <Step title="सटीक SMS Webhook पथ एक्सपोज़ करें">
    आपके सार्वजनिक URL को SMS पथ को Gateway प्रक्रिया तक रूट करना होगा। यदि आप स्थानीय परीक्षण के लिए Tailscale Funnel का उपयोग करते हैं, तो `/webhooks/sms` को स्पष्ट रूप से एक्सपोज़ करें:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call और SMS अलग Webhook पथों का उपयोग करते हैं। यदि वही Twilio नंबर दोनों को संभालता है, तो Twilio और अपने टनल में दोनों रूट कॉन्फ़िगर रखें।

  </Step>

  <Step title="Gateway शुरू करें और पहले प्रेषक को स्वीकृत करें">

```bash
openclaw gateway
```

Twilio नंबर पर टेक्स्ट संदेश भेजें। पहला संदेश एक पेयरिंग अनुरोध बनाता है। इसे स्वीकृत करें:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं।

  </Step>
</Steps>

## कॉन्फ़िगरेशन उदाहरण

### कॉन्फ़िग फ़ाइल

जब आप चैनल परिभाषा को Gateway कॉन्फ़िग के साथ रखना चाहते हैं, तो config-file सेटअप का उपयोग करें:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### पर्यावरण चर

उन single-account डिप्लॉयमेंट के लिए env सेटअप का उपयोग करें जहां सीक्रेट होस्ट वातावरण से आते हैं:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

फिर कॉन्फ़िग में चैनल सक्षम करें:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

`TWILIO_SMS_FROM`, `TWILIO_PHONE_NUMBER` के उपनाम के रूप में स्वीकार किया जाता है। जब Twilio को Messaging Service से प्रेषक चुनना हो, तो फ़ोन-नंबर प्रेषक के बजाय `TWILIO_MESSAGING_SERVICE_SID` का उपयोग करें।

### SecretRef auth token

`authToken` SecretRef हो सकता है। इसका उपयोग तब करें जब Gateway को plaintext कॉन्फ़िग संग्रहीत करने के बजाय OpenClaw secrets runtime से Twilio Auth Token resolve करना चाहिए:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

संदर्भित पर्यावरण चर या secret provider Gateway runtime को दिखाई देना चाहिए। होस्ट पर्यावरण चर बदलने के बाद प्रबंधित Gateway प्रक्रियाओं को रीस्टार्ट करें।

### केवल allowlist वाला निजी नंबर

जब केवल ज्ञात फ़ोन नंबरों को agent से बात करने की अनुमति होनी चाहिए, तो `allowlist` का उपयोग करें:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

### Messaging Service प्रेषक

जब Twilio को Messaging Service के ज़रिए प्रेषक चुनना हो, तो `fromNumber` के बजाय `messagingServiceSid` का उपयोग करें:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

यदि कॉन्फ़िग और env resolution के बाद `fromNumber` और `messagingServiceSid` दोनों मौजूद हैं, तो `fromNumber` का उपयोग किया जाता है।

### डिफ़ॉल्ट आउटबाउंड लक्ष्य

जब automation या agent-initiated delivery को कोई send flow स्पष्ट लक्ष्य छोड़ दे तो डिफ़ॉल्ट गंतव्य चाहिए, तब `defaultTo` सेट करें:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## एक्सेस नियंत्रण

`channels.sms.dmPolicy` सीधे SMS एक्सेस को नियंत्रित करता है:

- `pairing` (डिफ़ॉल्ट)
- `allowlist` (`allowFrom` में कम से कम एक प्रेषक आवश्यक)
- `open` (`allowFrom` में `"*"` शामिल होना आवश्यक)
- `disabled`

`allowFrom` प्रविष्टियां `+15551234567` जैसे E.164 फ़ोन नंबर होने चाहिए। `sms:` prefix स्वीकार किए जाते हैं और सामान्यीकृत किए जाते हैं। निजी सहायक के लिए, स्पष्ट फ़ोन नंबरों के साथ `dmPolicy: "allowlist"` को प्राथमिकता दें।

## SMS भेजना

आउटबाउंड SMS लक्ष्य SMS चैनल चुने जाने पर `sms:` service prefix का उपयोग करते हैं:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

जब चैनल चयन implicit हो, तो `twilio-sms:+15551234567` मौजूदा चैनल-स्वामित्व वाले `sms:` service prefix, जिसका उपयोग iMessage करता है, को अपने कब्ज़े में लिए बिना इस चैनल को चुनता है।

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI को स्पष्ट `--target` चाहिए। `defaultTo` automation और agent-initiated delivery पथों के लिए है जहां लक्ष्य को चैनल कॉन्फ़िग से resolve किया जा सकता है।

इनबाउंड SMS बातचीत से agent के जवाब कॉन्फ़िगर किए गए Twilio प्रेषक के ज़रिए अपने-आप प्रेषक को वापस जाते हैं।

SMS आउटपुट plain text है। OpenClaw markdown हटाता है, fenced code blocks को flatten करता है, readable links संरक्षित करता है, और Twilio के ज़रिए भेजने से पहले लंबे जवाबों को chunk करता है।

## सेटअप सत्यापित करें

Gateway शुरू होने के बाद:

1. पुष्टि करें कि Gateway log SMS Webhook रूट दिखाता है।
2. Twilio-side probe चलाएं:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. अपने फ़ोन से Twilio नंबर पर SMS भेजें।
4. `openclaw pairing list sms` चलाएं।
5. `openclaw pairing approve sms <CODE>` के साथ पेयरिंग कोड स्वीकृत करें।
6. एक और SMS भेजें और पुष्टि करें कि agent जवाब देता है।

केवल आउटबाउंड परीक्षण के लिए, उपयोग करें:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS iMessage/SMS से end-to-end परीक्षण

Messages के ज़रिए carrier SMS भेज सकने वाले Mac पर, आप अपने फ़ोन को छुए बिना sender side चलाने के लिए `imsg` का उपयोग कर सकते हैं:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

पहला संदेश एक पेयरिंग अनुरोध बनाना चाहिए। दूसरे संदेश को Twilio के ज़रिए agent का जवाब प्राप्त होना चाहिए।

## Webhook सुरक्षा

डिफ़ॉल्ट रूप से, OpenClaw `publicWebhookUrl` और `authToken` का उपयोग करके `X-Twilio-Signature` को मान्य करता है। `publicWebhookUrl` को Twilio में कॉन्फ़िगर किए गए URL के साथ byte-for-byte संरेखित रखें, जिसमें scheme, host, path, और query string शामिल हैं।

केवल स्थानीय टनल परीक्षण के लिए, आप सेट कर सकते हैं:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

सार्वजनिक Gateway पर disabled signature validation का उपयोग न करें।

## Multi-account कॉन्फ़िग

जब आप एक से अधिक Twilio नंबर संचालित करते हैं, तो `accounts` का उपयोग करें:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

प्रत्येक खाते को अलग `webhookPath` का उपयोग करना चाहिए।

## समस्या निवारण

### Twilio 403 लौटाता है या OpenClaw Webhook को अस्वीकार करता है

जांचें कि `publicWebhookUrl` Twilio में कॉन्फ़िगर किए गए URL से ठीक-ठीक मेल खाता है, जिसमें scheme, host, path, और query string शामिल हैं। Twilio सार्वजनिक URL string पर हस्ताक्षर करता है, इसलिए proxy rewrites और alternate hostnames signature validation तोड़ सकते हैं।

### कोई पेयरिंग अनुरोध दिखाई नहीं देता

Twilio नंबर की **Messaging** Webhook URL और method जांचें। यह SMS Webhook URL की ओर इंगित होना चाहिए और `POST` का उपयोग करना चाहिए। यह भी पुष्टि करें कि Gateway सार्वजनिक इंटरनेट से या आपके टनल के ज़रिए पहुंच योग्य है।

यदि Twilio message log error `11200` दिखाता है, तो Twilio ने inbound SMS स्वीकार किया लेकिन आपके Webhook तक नहीं पहुंच सका। जांचें:

- Twilio **Messaging > A message comes in** `publicWebhookUrl` की ओर इंगित करता है।
- method `POST` है।
- टनल या reverse proxy सटीक `webhookPath` एक्सपोज़ करता है; Tailscale Funnel के लिए, `tailscale funnel status` चलाएं और पुष्टि करें कि `/webhooks/sms` सूचीबद्ध है।
- `publicWebhookUrl` वही scheme, host, path, और query string उपयोग करता है जो Twilio भेजता है, ताकि signature validation signed URL को पुनः बना सके।

### आउटबाउंड sends विफल होते हैं

पुष्टि करें कि `accountSid`, `authToken`, और `fromNumber` या `messagingServiceSid` में से कोई एक resolve हो रहा है। यदि आप trial Twilio account उपयोग करते हैं, तो outbound SMS भेजने से पहले destination number को Twilio में verified करना पड़ सकता है।

### संदेश आते हैं लेकिन agent जवाब नहीं देता

`dmPolicy` और `allowFrom` जाँचें। डिफ़ॉल्ट `pairing` नीति के साथ, सामान्य एजेंट टर्न प्रोसेस होने से पहले प्रेषक को स्वीकृत होना चाहिए।
