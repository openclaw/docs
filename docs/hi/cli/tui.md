---
read_when:
    - आप Gateway के लिए एक टर्मिनल UI चाहते हैं (रिमोट-अनुकूल)
    - आप स्क्रिप्ट से url/token/session पास करना चाहते हैं
    - आप TUI को Gateway के बिना स्थानीय एम्बेडेड मोड में चलाना चाहते हैं
    - आप `openclaw chat` या `openclaw tui --local` का उपयोग करना चाहते हैं
summary: '`openclaw tui` के लिए CLI संदर्भ (Gateway-समर्थित या स्थानीय एम्बेडेड टर्मिनल UI)'
title: TUI
x-i18n:
    generated_at: "2026-07-16T14:19:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway से जुड़ा टर्मिनल UI खोलें, या इसे स्थानीय एम्बेडेड
मोड में चलाएँ।

संबंधित मार्गदर्शिका: [TUI](/hi/web/tui)

## विकल्प

| फ़्लैग                         | डिफ़ॉल्ट                                   | विवरण                                                                        |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Gateway के बजाय स्थानीय एम्बेडेड एजेंट रनटाइम पर चलाएँ।                 |
| `--url <url>`                | कॉन्फ़िगरेशन से `gateway.remote.url`          | Gateway WebSocket URL।                                                             |
| `--token <token>`            | (कोई नहीं)                                    | आवश्यकता होने पर Gateway टोकन।                                                         |
| `--password <pass>`          | (कोई नहीं)                                    | आवश्यकता होने पर Gateway पासवर्ड।                                                      |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | पिन किए गए `wss://` Gateway के लिए अपेक्षित TLS प्रमाणपत्र फ़िंगरप्रिंट।                |
| `--session <key>`            | `main` (या स्कोप वैश्विक होने पर `global`) | सत्र कुंजी। एजेंट कार्यक्षेत्र के भीतर, प्रीफ़िक्स न होने पर यह उस एजेंट को स्वतः चुनती है। |
| `--deliver`                  | `false`                                   | कॉन्फ़िगर किए गए चैनलों के माध्यम से सहायक के उत्तर वितरित करें।                             |
| `--thinking <level>`         | (मॉडल डिफ़ॉल्ट)                           | चिंतन स्तर ओवरराइड।                                                           |
| `--message <text>`           | (कोई नहीं)                                    | कनेक्ट होने के बाद एक आरंभिक संदेश भेजें।                                          |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | एजेंट टाइमआउट। अमान्य मान चेतावनी लॉग करते हैं और अनदेखे किए जाते हैं।                       |
| `--history-limit <n>`        | `200`                                     | अटैच करते समय लोड की जाने वाली इतिहास प्रविष्टियाँ।                                                 |

उपनाम: `openclaw chat` और `openclaw terminal` इस कमांड को
`--local` निहित मानकर चलाते हैं।

## टिप्पणियाँ

- `--local` को `--url`, `--token`, `--password`, या `--tls-fingerprint` के साथ संयोजित नहीं किया जा सकता।
- जब संभव हो, `tui` टोकन/पासवर्ड प्रमाणीकरण के लिए कॉन्फ़िगर किए गए Gateway प्रमाणीकरण SecretRefs को हल करता है
  (`env`/`file`/`exec` प्रदाता)।
- कोई स्पष्ट URL या पोर्ट न होने पर, `tui` चालू Gateway द्वारा
  दर्ज सक्रिय स्थानीय Gateway पोर्ट का अनुसरण करता है। स्पष्ट `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT`, और दूरस्थ Gateway कॉन्फ़िगरेशन की प्राथमिकता बनी रहती है।
- कॉन्फ़िगर की गई एजेंट कार्यक्षेत्र डायरेक्टरी के भीतर से लॉन्च करने पर, TUI
  सत्र कुंजी के डिफ़ॉल्ट के लिए उस एजेंट को स्वतः चुनता है (जब तक `--session` को स्पष्ट रूप से
  `agent:<id>:...` न किया गया हो)।
- गैर-स्थानीय URL-आधारित कनेक्शनों के फ़ुटर में Gateway होस्टनाम दिखाने के लिए,
  `openclaw config set tui.footer.showRemoteHost true` चलाएँ। यह डिफ़ॉल्ट रूप से
  बंद रहता है; लूपबैक या एम्बेडेड स्थानीय कनेक्शनों के लिए कभी नहीं दिखाया जाता।
- स्थानीय मोड सीधे एम्बेडेड एजेंट रनटाइम का उपयोग करता है। अधिकांश स्थानीय टूल काम करते हैं,
  लेकिन केवल-Gateway सुविधाएँ उपलब्ध नहीं होतीं।
- स्थानीय मोड TUI कमांड सतह में `/auth [provider]` जोड़ता है।
- स्थानीय मोड में भी Plugin अनुमोदन गेट लागू रहते हैं: अनुमोदन की आवश्यकता वाले टूल
  टर्मिनल में निर्णय माँगते हैं; किसी भी चीज़ को चुपचाप स्वतः अनुमोदित नहीं किया जाता।
- सत्र [लक्ष्य](/hi/tools/goal) फ़ुटर में दिखाई देते हैं और उन्हें
  `/goal` से प्रबंधित किया जा सकता है।

## उदाहरण

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "मेरे कॉन्फ़िगरेशन की दस्तावेज़ों से तुलना करें और बताएँ कि क्या ठीक करना है"
# एजेंट कार्यक्षेत्र के भीतर चलाने पर, उस एजेंट का स्वतः अनुमान लगाया जाता है
openclaw tui --session bugfix
```

## कॉन्फ़िगरेशन सुधार लूप

एम्बेडेड एजेंट से वर्तमान कॉन्फ़िगरेशन का निरीक्षण करवाने, उसकी
दस्तावेज़ों से तुलना करने और उसी टर्मिनल से उसे सुधारने में सहायता पाने के लिए स्थानीय मोड का उपयोग करें।

यदि `openclaw config validate` पहले से विफल हो रहा है, तो पहले `openclaw configure` या
`openclaw doctor --fix` चलाएँ; `openclaw chat`
अमान्य-कॉन्फ़िगरेशन गार्ड को बायपास नहीं करता।

```bash
openclaw chat
```

फिर TUI के भीतर:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` या `openclaw configure` से लक्षित सुधार लागू करें, फिर
`openclaw config validate` दोबारा चलाएँ। [TUI](/hi/web/tui) और
[कॉन्फ़िगरेशन](/hi/cli/config) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [TUI](/hi/web/tui)
- [लक्ष्य](/hi/tools/goal)
