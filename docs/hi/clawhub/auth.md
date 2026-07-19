---
read_when:
    - ClawHub में साइन इन करना
    - ClawHub CLI का उपयोग करना
    - 401 त्रुटियों की डिबगिंग
summary: ClawHub साइन-इन, API टोकन, CLI लॉगिन, टोकन संग्रहण और निरसन।
x-i18n:
    generated_at: "2026-07-19T08:16:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# प्रमाणीकरण

ClawHub वेब साइन-इन के लिए GitHub का उपयोग करता है। CLI उस साइन-इन किए गए खाते के माध्यम से बनाए गए ClawHub API टोकन का उपयोग करता है।

## वेब साइन-इन

[clawhub.ai](https://clawhub.ai) पर साइन इन करने के लिए GitHub का उपयोग करें।

हटाए गए, प्रतिबंधित या अक्षम खाते सामान्य ClawHub साइन-इन पूरा नहीं कर सकते।
यदि साइन-इन के बाद आप फिर से लॉग-आउट स्थिति में पहुँच जाते हैं, तो हो सकता है कि आपका खाता अच्छी स्थिति में न हो।
यदि आपका खाता प्रतिबंधित या अक्षम कर दिया गया था और आपको लगता है कि यह एक गलती है, तो
[ClawHub अपील फ़ॉर्म](https://appeals.openclaw.ai/) का उपयोग करें।

## CLI लॉगिन

डिफ़ॉल्ट CLI लॉगिन प्रवाह आपका ब्राउज़र खोलता है:

```bash
clawhub login
clawhub whoami
```

क्या होता है:

1. CLI `127.0.0.1` पर एक अस्थायी कॉलबैक सर्वर शुरू करता है।
2. आपका ब्राउज़र ClawHub साइन-इन पृष्ठ खोलता है।
3. GitHub साइन-इन के बाद, ClawHub एक API टोकन बनाता है।
4. ब्राउज़र वापस स्थानीय कॉलबैक पर रीडायरेक्ट करता है।
5. CLI टोकन को आपकी ClawHub कॉन्फ़िग फ़ाइल में संग्रहीत करता है।

यदि फ़ायरवॉल, VPN या प्रॉक्सी नियमों के कारण आपका ब्राउज़र स्थानीय कॉलबैक तक नहीं पहुँच सकता, तो
हेडलेस टोकन प्रवाह का उपयोग करें।

## हेडलेस लॉगिन

ClawHub वेब UI में एक टोकन बनाएँ, फिर उसे CLI को दें:

```bash
clawhub login --token clh_...
```

सर्वर, CI जॉब या केवल-टर्मिनल परिवेशों के लिए इस प्रवाह का उपयोग करें।

ऐसे रिमोट शेल के लिए, जहाँ आप किसी अन्य स्थान पर ब्राउज़र खोल सकते हैं, चलाएँ:

```bash
clawhub login --device
```

CLI एक बार उपयोग होने वाला कोड प्रिंट करता है और आपके द्वारा
`https://clawhub.ai/cli/device` पर उसे अधिकृत किए जाने तक प्रतीक्षा करता है।

## टोकन संग्रहण

डिफ़ॉल्ट कॉन्फ़िग पथ:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

इससे पथ ओवरराइड करें:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI सेटअप के लिए संग्रहीत टोकन प्रिंट करने हेतु चलाएँ:

```bash
clawhub token
```

## निरस्तीकरण

आप ClawHub वेब UI में API टोकन निरस्त कर सकते हैं।

निरस्त, अमान्य या अनुपलब्ध टोकन `401 Unauthorized` लौटाते हैं। `clawhub login` से फिर से साइन इन करें
या `clawhub login --token` से नया टोकन प्रदान करें।

हटाए गए, प्रतिबंधित या अक्षम खाते मौजूदा API टोकन का उपयोग जारी नहीं रख सकते।
यदि आपका खाता प्रतिबंधित या अक्षम कर दिया गया था और आपको लगता है कि यह एक गलती है, तो
[ClawHub अपील फ़ॉर्म](https://appeals.openclaw.ai/) का उपयोग करें।
