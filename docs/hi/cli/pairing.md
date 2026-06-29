---
read_when:
    - आप पेयरिंग-मोड निजी संदेशों का उपयोग कर रहे हैं और आपको प्रेषकों को अनुमोदित करना होगा
summary: '`openclaw pairing` के लिए CLI संदर्भ (पेयरिंग अनुरोधों को स्वीकृत/सूचीबद्ध करना)'
title: पेयरिंग
x-i18n:
    generated_at: "2026-06-28T22:51:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

DM पेयरिंग अनुरोधों को स्वीकृत करें या निरीक्षण करें (उन चैनलों के लिए जो पेयरिंग का समर्थन करते हैं)।

संबंधित:

- पेयरिंग प्रवाह: [पेयरिंग](/hi/channels/pairing)

## कमांड

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

एक चैनल के लिए लंबित पेयरिंग अनुरोधों की सूची दिखाएँ।

विकल्प:

- `[channel]`: स्थितिगत चैनल id
- `--channel <channel>`: स्पष्ट चैनल id
- `--account <accountId>`: बहु-अकाउंट चैनलों के लिए अकाउंट id
- `--json`: मशीन-पठनीय आउटपुट

नोट्स:

- यदि कई पेयरिंग-सक्षम चैनल कॉन्फ़िगर किए गए हैं, तो आपको चैनल या तो स्थितिगत रूप से या `--channel` के साथ देना होगा।
- एक्सटेंशन चैनल अनुमत हैं, बशर्ते चैनल id मान्य हो।

## `pairing approve`

लंबित पेयरिंग कोड को स्वीकृत करें और उस प्रेषक को अनुमति दें।

उपयोग:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` जब ठीक एक पेयरिंग-सक्षम चैनल कॉन्फ़िगर किया गया हो

विकल्प:

- `--channel <channel>`: स्पष्ट चैनल id
- `--account <accountId>`: बहु-अकाउंट चैनलों के लिए अकाउंट id
- `--notify`: उसी चैनल पर अनुरोधकर्ता को पुष्टि भेजें

स्वामी बूटस्ट्रैप:

- यदि पेयरिंग कोड स्वीकृत करते समय `commands.ownerAllowFrom` खाली है, तो OpenClaw स्वीकृत प्रेषक को कमांड स्वामी के रूप में भी रिकॉर्ड करता है, `telegram:123456789` जैसी चैनल-स्कोप्ड प्रविष्टि का उपयोग करके।
- यह केवल पहले स्वामी को बूटस्ट्रैप करता है। बाद की पेयरिंग स्वीकृतियाँ `commands.ownerAllowFrom` को प्रतिस्थापित या विस्तारित नहीं करतीं।
- कमांड स्वामी वह मानव ऑपरेटर अकाउंट है जिसे केवल-स्वामी कमांड चलाने और `/diagnostics`, `/export-trajectory`, `/config`, और exec स्वीकृतियों जैसी जोखिमपूर्ण कार्रवाइयों को स्वीकृत करने की अनुमति होती है।

## नोट्स

- चैनल इनपुट: इसे स्थितिगत रूप से (`pairing list telegram`) या `--channel <channel>` के साथ पास करें।
- `pairing list` बहु-अकाउंट चैनलों के लिए `--account <accountId>` का समर्थन करता है।
- `pairing approve` `--account <accountId>` और `--notify` का समर्थन करता है।
- यदि केवल एक पेयरिंग-सक्षम चैनल कॉन्फ़िगर किया गया है, तो `pairing approve <code>` अनुमत है।
- यदि आपने इस बूटस्ट्रैप के मौजूद होने से पहले किसी प्रेषक को स्वीकृत किया था, तो `openclaw doctor` चलाएँ; जब कोई कमांड स्वामी कॉन्फ़िगर नहीं होता, तो यह चेतावनी देता है और इसे ठीक करने के लिए `openclaw config set commands.ownerAllowFrom ...` कमांड दिखाता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [चैनल पेयरिंग](/hi/channels/pairing)
