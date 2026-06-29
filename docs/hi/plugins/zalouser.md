---
read_when:
    - आप OpenClaw में Zalo Personal (अनौपचारिक) समर्थन चाहते हैं
    - आप zalouser Plugin को कॉन्फ़िगर या विकसित कर रहे हैं
summary: 'Zalo Personal Plugin: QR लॉगिन + नेटिव zca-js के माध्यम से मैसेजिंग (Plugin इंस्टॉल + चैनल कॉन्फ़िगरेशन + टूल)'
title: Zalo व्यक्तिगत Plugin
x-i18n:
    generated_at: "2026-06-28T23:55:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
---

OpenClaw के लिए Zalo Personal समर्थन, एक Plugin के माध्यम से, सामान्य Zalo उपयोगकर्ता खाते को स्वचालित करने के लिए नेटिव `zca-js` का उपयोग करते हुए.

<Warning>
अनौपचारिक ऑटोमेशन से खाता निलंबन या प्रतिबंध हो सकता है। अपने जोखिम पर उपयोग करें।
</Warning>

## नामकरण

Channel id `zalouser` है ताकि यह स्पष्ट रहे कि यह एक **व्यक्तिगत Zalo उपयोगकर्ता खाते** को स्वचालित करता है (अनौपचारिक)। हम संभावित भविष्य के आधिकारिक Zalo API एकीकरण के लिए `zalo` को आरक्षित रखते हैं।

## यह कहाँ चलता है

यह Plugin **Gateway प्रक्रिया के अंदर** चलता है।

यदि आप रिमोट Gateway का उपयोग करते हैं, तो इसे **Gateway चलाने वाली मशीन** पर इंस्टॉल/कॉन्फ़िगर करें, फिर Gateway को पुनः आरंभ करें।

किसी बाहरी `zca`/`openzca` CLI बाइनरी की आवश्यकता नहीं है।

## इंस्टॉल करें

### विकल्प A: npm से इंस्टॉल करें

```bash
openclaw plugins install @openclaw/zalouser
```

वर्तमान आधिकारिक रिलीज़ टैग का पालन करने के लिए बेयर पैकेज का उपयोग करें। सटीक
संस्करण केवल तब पिन करें जब आपको पुनरुत्पाद्य इंस्टॉल की आवश्यकता हो।

इसके बाद Gateway को पुनः आरंभ करें।

### विकल्प B: स्थानीय फ़ोल्डर से इंस्टॉल करें (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

इसके बाद Gateway को पुनः आरंभ करें।

## कॉन्फ़िगरेशन

Channel कॉन्फ़िगरेशन `channels.zalouser` के अंतर्गत रहता है (`plugins.entries.*` नहीं):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent टूल

टूल नाम: `zalouser`

क्रियाएँ: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Channel संदेश क्रियाएँ संदेश प्रतिक्रियाओं के लिए `react` का भी समर्थन करती हैं।

## संबंधित

- [Plugins बनाना](/hi/plugins/building-plugins)
- [ClawHub](/hi/clawhub)
