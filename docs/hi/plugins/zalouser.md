---
read_when:
    - आप OpenClaw में Zalo Personal (अनौपचारिक) समर्थन चाहते हैं
    - आप zalouser Plugin को कॉन्फ़िगर या विकसित कर रहे हैं
summary: 'Zalo Personal Plugin: नेटिव zca-js के ज़रिए QR लॉगिन + मैसेजिंग (Plugin इंस्टॉल + चैनल कॉन्फ़िगरेशन + टूल)'
title: Zalo व्यक्तिगत Plugin
x-i18n:
    generated_at: "2026-07-16T16:30:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

OpenClaw के लिए Zalo Personal समर्थन एक ऐसे plugin के माध्यम से उपलब्ध है जो सामान्य Zalo उपयोगकर्ता खाते को
स्वचालित करने के लिए मूल `zca-js` का उपयोग करता है। किसी बाहरी `zca`/`openzca` CLI बाइनरी की
आवश्यकता नहीं है।

<Warning>
अनौपचारिक स्वचालन के कारण खाता निलंबित या प्रतिबंधित हो सकता है। इसका उपयोग अपने जोखिम पर करें।
</Warning>

## नामकरण

चैनल आईडी `zalouser` है, ताकि यह स्पष्ट रहे कि यह एक **व्यक्तिगत Zalo
उपयोगकर्ता खाते** (अनौपचारिक) को स्वचालित करता है। अलग `zalo` चैनल आईडी आधिकारिक,
बंडल किया गया Zalo Bot/webhook एकीकरण है—देखें [Zalo](/hi/channels/zalo)।

## यह कहाँ चलता है

यह plugin **Gateway प्रक्रिया के अंदर** चलता है। रिमोट Gateway के लिए,
इसे उस होस्ट पर इंस्टॉल/कॉन्फ़िगर करें, फिर Gateway को पुनः आरंभ करें।

## इंस्टॉल करना

### npm से

```bash
openclaw plugins install @openclaw/zalouser
```

वर्तमान आधिकारिक रिलीज़ टैग का अनुसरण करने के लिए बिना संस्करण वाला पैकेज उपयोग करें; सटीक
संस्करण केवल तभी पिन करें, जब पुनरुत्पाद्य इंस्टॉल की आवश्यकता हो। इसके बाद Gateway को
पुनः आरंभ करें।

### स्थानीय फ़ोल्डर से (डेवलपमेंट)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

इसके बाद Gateway को पुनः आरंभ करें।

## कॉन्फ़िगरेशन

चैनल कॉन्फ़िगरेशन `channels.zalouser` के अंतर्गत रहता है (`plugins.entries.*` के अंतर्गत नहीं):

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

DM/समूह पहुँच नियंत्रण, एकाधिक-खाता सेटअप, पर्यावरण चर और समस्या निवारण के लिए
[Zalo व्यक्तिगत चैनल कॉन्फ़िगरेशन](/hi/channels/zalouser) देखें।

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "OpenClaw की ओर से नमस्ते"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "नाम"
openclaw directory groups list --channel zalouser --query "नाम"
openclaw directory groups members --channel zalouser --group-id <id>
```

## एजेंट टूल

टूल का नाम: `zalouser`

क्रियाएँ: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

चैनल संदेश क्रियाएँ (एजेंट टूल नहीं) संदेश
प्रतिक्रियाओं के लिए `react` का भी समर्थन करती हैं।

## संबंधित

- [Zalo व्यक्तिगत चैनल कॉन्फ़िगरेशन](/hi/channels/zalouser)
- [Zalo (आधिकारिक Bot/webhook चैनल)](/hi/channels/zalo)
- [plugin बनाना](/hi/plugins/building-plugins)
- [ClawHub](/clawhub)
