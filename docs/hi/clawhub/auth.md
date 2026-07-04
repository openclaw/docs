---
read_when:
    - ClawHub में साइन इन करना
    - ClawHub CLI का उपयोग करना
    - 401s की डिबगिंग
summary: ClawHub साइन-इन, API टोकन, CLI लॉगिन, टोकन भंडारण, और निरसन।
x-i18n:
    generated_at: "2026-07-04T10:39:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# प्रमाणीकरण

ClawHub वेब साइन-इन के लिए GitHub का उपयोग करता है। CLI उस साइन-इन किए गए खाते के माध्यम से बनाए गए ClawHub API tokens का उपयोग करता है।

## वेब साइन-इन

[clawhub.ai](https://clawhub.ai) पर साइन इन करने के लिए GitHub का उपयोग करें।

हटाए गए, प्रतिबंधित, या अक्षम खाते सामान्य ClawHub साइन-इन पूरा नहीं कर सकते।
यदि साइन-इन आपको लॉग-आउट स्थिति में वापस ले आता है, तो आपका खाता अच्छी स्थिति में नहीं हो सकता।
यदि आपका खाता प्रतिबंधित या अक्षम किया गया था, और आपको लगता है कि यह गलती है, तो [ClawHub appeal form](https://appeals.openclaw.ai/) का उपयोग करें।

## CLI लॉगिन

डिफ़ॉल्ट CLI लॉगिन प्रवाह आपका ब्राउज़र खोलता है:

```bash
clawhub login
clawhub whoami
```

क्या होता है:

1. CLI `127.0.0.1` पर एक अस्थायी कॉलबैक सर्वर शुरू करता है।
2. आपका ब्राउज़र ClawHub साइन-इन पेज खोलता है।
3. GitHub साइन-इन के बाद, ClawHub एक API token बनाता है।
4. ब्राउज़र वापस स्थानीय कॉलबैक पर रीडायरेक्ट करता है।
5. CLI token को आपकी ClawHub config फ़ाइल में संग्रहीत करता है।

यदि firewall, VPN, या proxy नियमों के कारण आपका ब्राउज़र स्थानीय कॉलबैक तक नहीं पहुँच सकता, तो headless token प्रवाह का उपयोग करें।

## Headless लॉगिन

ClawHub वेब UI में एक token बनाएँ, फिर उसे CLI को पास करें:

```bash
clawhub login --token clh_...
```

इस प्रवाह का उपयोग सर्वर, CI jobs, या केवल-terminal वातावरणों के लिए करें।

ऐसे remote shells के लिए जहाँ आप कहीं और ब्राउज़र खोल सकते हैं, चलाएँ:

```bash
clawhub login --device
```

CLI एक एक-बार का code प्रिंट करता है और प्रतीक्षा करता है जब तक आप उसे `https://clawhub.ai/cli/device` पर authorize नहीं कर देते।

## Token संग्रहण

डिफ़ॉल्ट config paths:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` या `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Path को इसके साथ override करें:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI setup के लिए संग्रहीत token को इसके साथ प्रिंट करें:

```bash
clawhub token
```

## निरस्तीकरण

आप ClawHub वेब UI में API tokens निरस्त कर सकते हैं।

निरस्त, अमान्य, या अनुपस्थित tokens `401 Unauthorized` लौटाते हैं। `clawhub login` के साथ फिर से साइन इन करें या `clawhub login --token` के साथ नया token दें।

हटाए गए, प्रतिबंधित, या अक्षम खाते मौजूदा API tokens का उपयोग जारी नहीं रख सकते।
यदि आपका खाता प्रतिबंधित या अक्षम किया गया था, और आपको लगता है कि यह गलती है, तो [ClawHub appeal form](https://appeals.openclaw.ai/) का उपयोग करें।
