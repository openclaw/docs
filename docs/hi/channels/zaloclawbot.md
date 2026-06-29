---
read_when:
    - आप QR-कोड लॉगिन वाला व्यक्तिगत Zalo सहायक bot चाहते हैं
    - आप openclaw-zaloclawbot चैनल Plugin इंस्टॉल कर रहे हैं या समस्या निवारण कर रहे हैं
summary: बाहरी openclaw-zaloclawbot Plugin के माध्यम से Zalo ClawBot चैनल सेटअप
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-28T22:42:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw catalog-सूचीबद्ध बाहरी
`@zalo-platforms/openclaw-zaloclawbot` plugin के माध्यम से Zalo ClawBot से कनेक्ट होता है। लॉगिन में Zalo Mini App QR
कोड का उपयोग होता है।

## संगतता

| Plugin संस्करण | OpenClaw संस्करण | npm dist-tag | स्थिति        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | सक्रिय / बीटा |

## पूर्वापेक्षाएँ

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) इंस्टॉल होना चाहिए (`openclaw` CLI उपलब्ध)।
- लॉगिन QR कोड स्कैन करने के लिए मोबाइल डिवाइस पर Zalo खाता।

## onboard के साथ इंस्टॉल करें (अनुशंसित)

OpenClaw ऑनबोर्डिंग विज़ार्ड चलाएँ और चैनल मेनू से **Zalo ClawBot** चुनें:

```bash
openclaw onboard
```

विज़ार्ड आधिकारिक catalog से plugin इंस्टॉल करता है (integrity-verified), लॉगिन QR को सीधे टर्मिनल में रेंडर करता है, और Zalo ऐप से उसे स्कैन करने के बाद चैनल पूरा कर देता है। कोई अतिरिक्त कमांड आवश्यक नहीं हैं।

## मैनुअल इंस्टॉलेशन

पहले से ऑनबोर्ड किए गए gateway में चैनल जोड़ने के लिए, इन चरणों का पालन करें:

### 1. plugin इंस्टॉल करें

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

ऊपर दिखाए गए ठीक pinned version का उपयोग करें (यह आधिकारिक catalog entry से मेल खाता है), ताकि OpenClaw इंस्टॉल के दौरान package को catalog integrity hash के विरुद्ध सत्यापित करे।

### 2. config में plugin सक्षम करें

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR कोड जनरेट करें और लॉग इन करें

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Zalo मोबाइल ऐप का उपयोग करके टर्मिनल में रेंडर किया गया QR कोड स्कैन करें, Zalo Mini App के अंदर उपयोग की शर्तें स्वीकार करें, और session को authorize करें।

### 4. gateway रीस्टार्ट करें

```bash
openclaw gateway restart
```

---

## यह कैसे काम करता है

मानक developer Zalo channel के विपरीत, जिसमें आपको अपना Zalo Official Account (OA) रजिस्टर करना और static developer credentials पेस्ट करना पड़ता है, Zalo ClawBot साझा, आधिकारिक infrastructure का उपयोग करते हुए **owner-bound personal assistant** के रूप में काम करता है:

1. **सुरक्षित ऑनबोर्डिंग:** QR कोड एक सुरक्षित Zalo Mini App पर resolve होता है, जो साझा आधिकारिक OA के अंतर्गत नए provisioned, private bot को सीधे आपके Zalo User ID से bind करता है।
2. **Owner-Bound गोपनीयता:** डिज़ाइन के अनुसार, bot को _केवल_ अपने owner के साथ संचार करने तक सीमित रखा गया है। अन्य users के messages platform स्तर पर drop कर दिए जाते हैं, जिससे connection निजी और सुरक्षित रहता है।
3. **आधिकारिक API path:** plugin browser या web-session automation के बजाय
   Zalo Bot Platform APIs का उपयोग करता है।

## आंतरिक विवरण

Zalo ClawBot plugin persistent long-polling message loop के माध्यम से Zalo APIs से संचार करता है। runtime को साफ और lightweight बनाए रखने के लिए:

- Long-poll connections `getUpdates` endpoint का उपयोग करते हैं।
- स्थानीय desktop/terminal gateway runs के लिए Webhook डिफ़ॉल्ट रूप से disabled होते हैं।
- Messages client-side processed होते हैं और सीधे आपके local agent runtime से map किए जाते हैं।

बाहरी plugin OpenClaw state directory के अंतर्गत bot credentials manage करता है।
उस directory को संवेदनशील मानें और इसे अपने बाकी OpenClaw state जैसी ही access-control और
backup policy में शामिल करें।

---

## समस्या निवारण

- **QR लॉगिन टाइमआउट:** login token (`zbsk`) security कारणों से 5 मिनट बाद expire हो जाता है। यदि QR कोड आपके scan करने से पहले expire हो जाता है, तो नया जनरेट करने के लिए login command फिर से चलाएँ।
- **Gateway लोड होने में विफल:** सुनिश्चित करें कि आपका OpenClaw host version `2026.4.10` या उच्चतर है। पुराने versions external npm-plugin installation ledger का समर्थन नहीं करते।
