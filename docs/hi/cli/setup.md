---
read_when:
    - आप पूर्ण CLI ऑनबोर्डिंग के बिना पहली बार का सेटअप कर रहे हैं
    - आप डिफ़ॉल्ट workspace path सेट करना चाहते हैं
    - आपको हर फ़्लैग और यह चाहिए कि सेटअप बेसलाइन और विज़र्ड मोड के बीच कैसे निर्णय करता है
summary: CLI संदर्भ `openclaw setup` के लिए (कॉन्फिग और वर्कस्पेस आरंभ करें, वैकल्पिक रूप से ऑनबोर्डिंग चलाएँ)
title: सेटअप
x-i18n:
    generated_at: "2026-06-28T22:53:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

बेसलाइन कॉन्फिग और एजेंट वर्कस्पेस प्रारंभ करें। कोई भी ऑनबोर्डिंग फ्लैग मौजूद होने पर, विज़ार्ड भी चलता है।

<Note>
`openclaw setup` परिवर्तनशील कॉन्फिग इंस्टॉल के लिए है। Nix मोड (`OPENCLAW_NIX_MODE=1`) में OpenClaw सेटअप लिखने से इंकार करता है, क्योंकि कॉन्फिग फ़ाइल Nix द्वारा प्रबंधित होती है। प्रथम-पक्ष [nix-openclaw त्वरित प्रारंभ](https://github.com/openclaw/nix-openclaw#quick-start) या किसी अन्य Nix पैकेज के लिए समतुल्य स्रोत कॉन्फिग का उपयोग करें।
</Note>

## विकल्प

| फ्लैग                       | विवरण                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | एजेंट वर्कस्पेस निर्देशिका (डिफ़ॉल्ट `~/.openclaw/workspace`; `agents.defaults.workspace` के रूप में संग्रहीत)। |
| `--wizard`                 | इंटरैक्टिव ऑनबोर्डिंग चलाएं।                                                                         |
| `--non-interactive`        | प्रॉम्प्ट के बिना ऑनबोर्डिंग चलाएं।                                                                     |
| `--accept-risk`            | पूरे-सिस्टम एजेंट एक्सेस जोखिम को स्वीकार करें; `--non-interactive` के साथ आवश्यक।                       |
| `--mode <mode>`            | ऑनबोर्डिंग मोड: `local` या `remote`।                                                               |
| `--import-from <provider>` | ऑनबोर्डिंग के दौरान चलाने के लिए माइग्रेशन प्रदाता।                                                        |
| `--import-source <path>`   | `--import-from` के लिए स्रोत एजेंट होम।                                                              |
| `--import-secrets`         | ऑनबोर्डिंग माइग्रेशन के दौरान समर्थित सीक्रेट्स आयात करें।                                               |
| `--remote-url <url>`       | रिमोट Gateway WebSocket URL।                                                                       |
| `--remote-token <token>`   | रिमोट Gateway टोकन (वैकल्पिक)।                                                                    |

### विज़ार्ड ऑटो-ट्रिगर

`openclaw setup` विज़ार्ड चलाता है जब इनमें से कोई भी फ्लैग स्पष्ट रूप से मौजूद हो, भले ही `--wizard` न हो:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## उदाहरण

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## नोट्स

- साधारण `openclaw setup` पूर्ण ऑनबोर्डिंग फ़्लो चलाए बिना कॉन्फिग और वर्कस्पेस प्रारंभ करता है।
- साधारण सेटअप के बाद, पूर्ण निर्देशित यात्रा के लिए `openclaw onboard`, लक्षित बदलावों के लिए `openclaw configure`, या चैनल खाते जोड़ने के लिए `openclaw channels add` चलाएं।
- यदि Hermes स्थिति का पता चलता है, तो इंटरैक्टिव ऑनबोर्डिंग अपने आप माइग्रेशन का प्रस्ताव दे सकती है। इंपोर्ट ऑनबोर्डिंग के लिए नया सेटअप आवश्यक है; ऑनबोर्डिंग के बाहर ड्राई-रन योजनाओं, बैकअप और ओवरराइट मोड के लिए [माइग्रेट करें](/hi/cli/migrate) का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- [शुरुआत करें](/hi/start/getting-started)
- [इंस्टॉल अवलोकन](/hi/install)
