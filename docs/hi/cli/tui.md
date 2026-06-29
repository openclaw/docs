---
read_when:
    - आप Gateway के लिए एक टर्मिनल UI चाहते हैं (रिमोट-अनुकूल)
    - आप scripts से url/token/session पास करना चाहते हैं
    - आप Gateway के बिना स्थानीय एम्बेडेड मोड में TUI चलाना चाहते हैं
    - आप openclaw chat या openclaw tui --local का उपयोग करना चाहते हैं
summary: '`openclaw tui` के लिए CLI संदर्भ (Gateway-समर्थित या स्थानीय एम्बेडेड टर्मिनल UI)'
title: TUI
x-i18n:
    generated_at: "2026-06-28T22:54:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway से जुड़ा टर्मिनल UI खोलें, या इसे स्थानीय एम्बेडेड
मोड में चलाएँ।

संबंधित:

- TUI गाइड: [TUI](/hi/web/tui)

## विकल्प

| फ़्लैग                 | डिफ़ॉल्ट                                  | विवरण                                                                            |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Gateway के बजाय स्थानीय एम्बेडेड एजेंट रनटाइम के विरुद्ध चलाएँ।                  |
| `--url <url>`         | कॉन्फ़िगरेशन से `gateway.remote.url`       | Gateway WebSocket URL.                                                             |
| `--token <token>`     | (कोई नहीं)                                | आवश्यक होने पर Gateway टोकन।                                                       |
| `--password <pass>`   | (कोई नहीं)                                | आवश्यक होने पर Gateway पासवर्ड।                                                    |
| `--session <key>`     | `main` (या स्कोप ग्लोबल होने पर `global`) | सेशन कुंजी। एजेंट वर्कस्पेस के अंदर, प्रीफ़िक्स न होने पर यह उस एजेंट को अपने-आप चुनता है। |
| `--deliver`           | `false`                                   | कॉन्फ़िगर किए गए चैनलों के माध्यम से असिस्टेंट जवाब डिलीवर करें।                 |
| `--thinking <level>`  | (मॉडल डिफ़ॉल्ट)                           | Thinking स्तर ओवरराइड।                                                            |
| `--message <text>`    | (कोई नहीं)                                | कनेक्ट करने के बाद प्रारंभिक संदेश भेजें।                                         |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | एजेंट टाइमआउट। अमान्य मान चेतावनी लॉग करते हैं और अनदेखा किए जाते हैं।            |
| `--history-limit <n>` | `200`                                     | अटैच करने पर लोड की जाने वाली हिस्ट्री प्रविष्टियाँ।                              |

उपनाम: `openclaw chat` और `openclaw terminal` वही कमांड चलाते हैं, जिसमें `--local` निहित होता है।

नोट्स:

- `chat` और `terminal`, `openclaw tui --local` के उपनाम हैं।
- `--local` को `--url`, `--token`, या `--password` के साथ जोड़ा नहीं जा सकता।
- संभव होने पर `tui`, टोकन/पासवर्ड auth के लिए कॉन्फ़िगर किए गए gateway auth SecretRefs को रिज़ॉल्व करता है (`env`/`file`/`exec` प्रोवाइडर)।
- कॉन्फ़िगर की गई एजेंट वर्कस्पेस डायरेक्टरी के अंदर से लॉन्च होने पर, TUI सेशन कुंजी डिफ़ॉल्ट के लिए उस एजेंट को अपने-आप चुनता है (जब तक `--session` स्पष्ट रूप से `agent:<id>:...` न हो)।
- गैर-स्थानीय URL-समर्थित कनेक्शनों के लिए फुटर में Gateway होस्टनेम दिखाने के लिए, `openclaw config set tui.footer.showRemoteHost true` चलाएँ। होस्ट लेबल डिफ़ॉल्ट रूप से बंद होता है और loopback या एम्बेडेड स्थानीय कनेक्शनों के लिए कभी नहीं दिखता।
- स्थानीय मोड सीधे एम्बेडेड एजेंट रनटाइम का उपयोग करता है। अधिकांश स्थानीय टूल काम करते हैं, लेकिन केवल-Gateway सुविधाएँ उपलब्ध नहीं होतीं।
- स्थानीय मोड TUI कमांड सतह के अंदर `/auth [provider]` जोड़ता है।
- Plugin अनुमोदन गेट स्थानीय मोड में भी लागू रहते हैं। जिन टूल्स को अनुमोदन चाहिए, वे टर्मिनल में निर्णय के लिए संकेत देते हैं; Gateway शामिल नहीं है इसलिए कुछ भी चुपचाप अपने-आप अनुमोदित नहीं होता।
- सेशन [लक्ष्य](/hi/tools/goal) फुटर में दिखाई देते हैं और `/goal` से प्रबंधित किए जा सकते हैं।

## उदाहरण

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## कॉन्फ़िगरेशन रिपेयर लूप

जब वर्तमान कॉन्फ़िगरेशन पहले से वैलिडेट होता हो और आप चाहते हों कि
एम्बेडेड एजेंट उसे जाँचे, docs से उसकी तुलना करे, और उसी टर्मिनल से
उसे रिपेयर करने में मदद करे, तब स्थानीय मोड का उपयोग करें:

यदि `openclaw config validate` पहले से विफल हो रहा है, तो पहले `openclaw configure` या
`openclaw doctor --fix` का उपयोग करें। `openclaw chat` अमान्य-
कॉन्फ़िगरेशन गार्ड को बायपास नहीं करता।

```bash
openclaw chat
```

फिर TUI के अंदर:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` या `openclaw configure` से लक्षित सुधार लागू करें, फिर
`openclaw config validate` दोबारा चलाएँ। [TUI](/hi/web/tui) और [कॉन्फ़िगरेशन](/hi/cli/config) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [TUI](/hi/web/tui)
- [लक्ष्य](/hi/tools/goal)
