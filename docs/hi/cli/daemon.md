---
read_when:
    - आप अभी भी स्क्रिप्ट में `openclaw daemon ...` का उपयोग करते हैं
    - आपको सेवा जीवनचक्र कमांड (इंस्टॉल/शुरू/रोकें/पुनः शुरू करें/स्थिति) चाहिए
summary: '`openclaw daemon` के लिए CLI संदर्भ (Gateway सेवा प्रबंधन का पुराना उपनाम)'
title: डेमन
x-i18n:
    generated_at: "2026-07-16T13:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway सेवा प्रबंधन के लिए पुराना उपनाम। `openclaw daemon ...` उन्हीं सेवा-नियंत्रण कमांड से मैप होता है जिनसे `openclaw gateway ...` होता है। वर्तमान दस्तावेज़ों और उदाहरणों के लिए [`openclaw gateway`](/hi/cli/gateway) को प्राथमिकता दें।

## उपयोग

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## उपकमांड और विकल्प

| उपकमांड  | विकल्प                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (केवल launchd: अगली बार प्रारंभ होने तक KeepAlive/RunAtLoad को स्थायी रूप से दबाता है) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: सेवा की इंस्टॉलेशन स्थिति (launchd/systemd/schtasks) दिखाता है और Gateway के स्वास्थ्य की जाँच करता है।
- `install`: सेवा इंस्टॉल करता है; `--force` मौजूदा इंस्टॉलेशन को फिर से इंस्टॉल/ओवरराइट करता है।
- `restart --safe`: चालू Gateway से सक्रिय कार्य की प्रारंभिक जाँच करने और कार्य समाप्त होने के बाद एक समेकित रीस्टार्ट शेड्यूल करने को कहता है, जो `gateway.reload.deferralTimeoutMs` तक सीमित है (डिफ़ॉल्ट 300000ms/5 मिनट; अनिश्चित काल तक प्रतीक्षा करने के लिए इसे `0` पर सेट करें)। यह समय-सीमा समाप्त होने पर भी रीस्टार्ट बलपूर्वक किया जाता है। सामान्य `restart` सीधे सेवा प्रबंधक का उपयोग करता है; `--force` तत्काल ओवरराइड है।
- `restart --safe --skip-deferral`: सक्रिय-कार्य स्थगन गेट को बायपास करता है, ताकि अवरोधक रिपोर्ट होने पर भी Gateway तुरंत रीस्टार्ट हो। `--safe` आवश्यक है।

## टिप्पणियाँ

- `status` जहाँ संभव हो, जाँच प्रमाणीकरण के लिए कॉन्फ़िगर किए गए प्रमाणीकरण SecretRefs को हल करता है। यदि कोई आवश्यक SecretRef अनसुलझा है, तो `status --json` `rpc.authWarning` रिपोर्ट करता है; `--token`/`--password` स्पष्ट रूप से प्रदान करें या पहले सीक्रेट स्रोत को हल करें। जाँच अन्यथा सफल होने पर अनसुलझे प्रमाणीकरण की चेतावनियाँ दबा दी जाती हैं।
- `status --deep` अन्य Gateway-जैसी सेवाओं के लिए सर्वोत्तम-प्रयास वाला सिस्टम-स्तरीय स्कैन जोड़ता है (सफ़ाई के संकेत प्रिंट करता है; फिर भी प्रति मशीन एक Gateway की अनुशंसा की जाती है) और Plugin-जागरूक मोड में कॉन्फ़िगरेशन सत्यापन चलाता है, जिससे वे Plugin मैनिफ़ेस्ट चेतावनियाँ सामने आती हैं जिन्हें तेज़ डिफ़ॉल्ट पथ छोड़ देता है।
- Linux systemd इंस्टॉलेशन पर, टोकन-ड्रिफ्ट जाँचें `Environment=` और `EnvironmentFile=` दोनों यूनिट स्रोतों का निरीक्षण करती हैं।
- टोकन-ड्रिफ्ट जाँचें मर्ज किए गए रनटाइम env का उपयोग करके `gateway.auth.token` SecretRefs को हल करती हैं (पहले सेवा कमांड env, फिर प्रक्रिया env)। यदि टोकन प्रमाणीकरण प्रभावी रूप से सक्रिय नहीं है (`password`/`none`/`trusted-proxy` में से `gateway.auth.mode`, या अनसेट हो और पासवर्ड को प्राथमिकता मिल सकती हो), तो कॉन्फ़िगरेशन टोकन रिज़ॉल्यूशन छोड़ दिया जाता है।
- `install` सत्यापित करता है कि SecretRef द्वारा प्रबंधित `gateway.auth.token` हल करने योग्य है, लेकिन हल किए गए मान को सेवा परिवेश मेटाडेटा में कभी सहेजता नहीं है; यदि इसे हल नहीं किया जा सकता, तो इंस्टॉलेशन सुरक्षित रूप से विफल हो जाता है।
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं और `gateway.auth.mode` अनसेट है, तो आपके द्वारा मोड स्पष्ट रूप से सेट किए जाने तक `install` अवरुद्ध रहता है।
- macOS पर, `install` सीक्रेट को `EnvironmentVariables` में एम्बेड करने के बजाय LaunchAgent plists और जनरेट की गई env फ़ाइल/रैपर को केवल स्वामी के लिए सुलभ रखता है (मोड `0600`/`0700`)।
- एक होस्ट पर कई Gateways चलाना: पोर्ट, कॉन्फ़िगरेशन/स्थिति और कार्यस्थानों को अलग रखें। [एकाधिक Gateway](/hi/gateway#multiple-gateways-same-host) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Gateway संचालन-पुस्तिका](/hi/gateway)
