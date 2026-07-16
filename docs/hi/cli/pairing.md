---
read_when:
    - आप पेयरिंग-मोड DMs का उपयोग कर रहे हैं और आपको प्रेषकों को स्वीकृति देनी होगी
summary: '`openclaw pairing` के लिए CLI संदर्भ (पेयरिंग अनुरोधों को स्वीकृत करें/सूचीबद्ध करें)'
title: पेयरिंग
x-i18n:
    generated_at: "2026-07-16T14:11:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

पेयरिंग का समर्थन करने वाले चैनलों के लिए DM पेयरिंग अनुरोधों को स्वीकृत करें या जाँचें (केवल चैट DM - Node/डिवाइस पेयरिंग के लिए `openclaw devices` का उपयोग होता है)।

संबंधित: [पेयरिंग प्रवाह](/hi/channels/pairing)

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

किसी एक चैनल के लंबित पेयरिंग अनुरोध सूचीबद्ध करें।

| विकल्प                  | विवरण                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | स्थितीय चैनल आईडी                 |
| `--channel <channel>`   | स्पष्ट चैनल आईडी                   |
| `--account <accountId>` | बहु-अकाउंट चैनलों के लिए अकाउंट आईडी |
| `--json`                | मशीन-पठनीय आउटपुट               |

यदि पेयरिंग-सक्षम कई चैनल कॉन्फ़िगर किए गए हैं, तो चैनल को स्थितीय रूप से या `--channel` के साथ दें। यदि चैनल आईडी मान्य है, तो एक्सटेंशन चैनल भी काम करते हैं।

## `pairing approve`

किसी लंबित पेयरिंग कोड को स्वीकृत करें और उस प्रेषक को अनुमति दें।

उपयोग:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` जब ठीक एक पेयरिंग-सक्षम चैनल कॉन्फ़िगर किया गया हो

विकल्प: `--channel <channel>`, `--account <accountId>`, `--notify` (उसी चैनल पर अनुरोधकर्ता को पुष्टिकरण वापस भेजें)।

### स्वामी बूटस्ट्रैप

यदि पेयरिंग कोड स्वीकृत करते समय `commands.ownerAllowFrom` खाली है, तो OpenClaw स्वीकृत प्रेषक को कमांड स्वामी के रूप में भी दर्ज करता है और इसके लिए `telegram:123456789` जैसी चैनल-स्कोप वाली प्रविष्टि का उपयोग करता है। यह केवल पहले स्वामी को बूटस्ट्रैप करता है - बाद की पेयरिंग स्वीकृतियाँ कभी भी `commands.ownerAllowFrom` को प्रतिस्थापित या विस्तारित नहीं करतीं।

कमांड स्वामी वह मानव ऑपरेटर अकाउंट है जिसे केवल-स्वामी कमांड चलाने और `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` तथा exec स्वीकृतियों जैसी खतरनाक कार्रवाइयाँ स्वीकृत करने की अनुमति होती है। पेयरिंग केवल किसी प्रेषक को एजेंट से बात करने देती है; इस एकमुश्त बूटस्ट्रैप के अतिरिक्त, यह स्वयं उसे स्वामी विशेषाधिकार प्रदान नहीं करती।

यदि आपने इस बूटस्ट्रैप के अस्तित्व में आने से पहले किसी प्रेषक को स्वीकृत किया था, तो `openclaw doctor` चलाएँ; कोई कमांड स्वामी कॉन्फ़िगर न होने पर यह चेतावनी देता है और इसे ठीक करने के लिए सटीक `openclaw config set commands.ownerAllowFrom ...` कमांड दिखाता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [चैनल पेयरिंग](/hi/channels/pairing)
