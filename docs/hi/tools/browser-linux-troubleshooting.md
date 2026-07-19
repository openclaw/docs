---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux पर OpenClaw ब्राउज़र नियंत्रण के लिए Chrome/Brave/Edge/Chromium CDP स्टार्टअप समस्याएँ ठीक करें
title: ब्राउज़र समस्या निवारण
x-i18n:
    generated_at: "2026-07-19T09:47:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## समस्या: पोर्ट 18800 पर Chrome CDP शुरू नहीं हो सका

```json
{ "error": "त्रुटि: प्रोफ़ाइल \"openclaw\" के लिए पोर्ट 18800 पर Chrome CDP शुरू नहीं हो सका।" }
```

### मूल कारण

Ubuntu और अधिकांश Linux डिस्ट्रीब्यूशन पर, `apt install chromium` वास्तविक ब्राउज़र के बजाय एक snap
रैपर इंस्टॉल करता है:

```text
ध्यान दें, 'chromium' के बजाय 'chromium-browser' चुना जा रहा है
chromium-browser पहले से नवीनतम संस्करण (2:1snap1-0ubuntu2) है।
```

Snap का AppArmor परिसीमन OpenClaw द्वारा ब्राउज़र प्रक्रिया शुरू करने और उसकी निगरानी करने के तरीके में
बाधा डालता है।

Linux पर शुरू होने में विफलता के अन्य सामान्य कारण:

- `The profile appears to be in use by another Chromium process`: प्रबंधित प्रोफ़ाइल डायरेक्टरी में पुराने
  `Singleton*` लॉक फ़ाइलें। जब लॉक किसी बंद या
  दूसरे होस्ट की प्रक्रिया की ओर संकेत करता है, तो OpenClaw इन लॉक को हटाकर एक बार पुनः प्रयास करता है।
- `Missing X server or $DISPLAY`: डेस्कटॉप सत्र के बिना किसी होस्ट पर दृश्यमान ब्राउज़र का स्पष्ट रूप से अनुरोध किया गया।
  जब `DISPLAY` और `WAYLAND_DISPLAY` दोनों सेट नहीं होते, तो Linux पर स्थानीय प्रबंधित प्रोफ़ाइल
  हेडलेस मोड पर वापस आ जाती हैं।
  यदि आपने `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false`, या
  `browser.profiles.<name>.headless: false` सेट किया है, तो उस हेडेड ओवरराइड को हटाएँ,
  `OPENCLAW_BROWSER_HEADLESS=1` सेट करें, `Xvfb` शुरू करें, एक बार के प्रबंधित लॉन्च के लिए
  `openclaw browser start --headless` चलाएँ, या OpenClaw को
  वास्तविक डेस्कटॉप सत्र में चलाएँ।

### समाधान 1: Google Chrome इंस्टॉल करें (अनुशंसित)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # यदि निर्भरता संबंधी त्रुटियाँ हों
```

`~/.openclaw/openclaw.json` अपडेट करें:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### समाधान 2: snap Chromium को केवल-अटैच मोड में उपयोग करें

यदि snap Chromium रखना आवश्यक है, तो OpenClaw को ब्राउज़र लॉन्च करने के बजाय
मैन्युअल रूप से शुरू किए गए ब्राउज़र से अटैच होने के लिए कॉन्फ़िगर करें:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Chromium को मैन्युअल रूप से शुरू करें:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

वैकल्पिक रूप से इसे systemd उपयोगकर्ता सेवा के साथ स्वतः शुरू करें:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw ब्राउज़र (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### सत्यापित करें कि ब्राउज़र काम करता है

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### कॉन्फ़िगरेशन संदर्भ

| विकल्प                           | विवरण                                                          | डिफ़ॉल्ट                                                            |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | ब्राउज़र नियंत्रण सक्षम करें                                               | `true`                                                             |
| `browser.executablePath`         | Chromium-आधारित ब्राउज़र बाइनरी का पथ (Chrome/Brave/Edge/Chromium) | स्वतः पहचाना गया (Chromium-आधारित होने पर OS के डिफ़ॉल्ट ब्राउज़र को प्राथमिकता देता है) |
| `browser.headless`               | GUI के बिना चलाएँ                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | स्थानीय प्रबंधित ब्राउज़र के हेडलेस मोड के लिए प्रति-प्रक्रिया ओवरराइड         | सेट नहीं                                                              |
| `browser.noSandbox`              | `--no-sandbox` फ़्लैग जोड़ें (कुछ Linux सेटअप के लिए आवश्यक)               | `false`                                                            |
| `browser.attachOnly`             | ब्राउज़र लॉन्च न करें; केवल मौजूदा ब्राउज़र से अटैच हों              | `false`                                                            |
| `browser.cdpPortRangeStart`      | स्वतः आवंटित प्रोफ़ाइलों के लिए आरंभिक स्थानीय CDP पोर्ट                   | `18800` (Gateway पोर्ट से व्युत्पन्न)                            |
| `browser.localLaunchTimeoutMs`   | स्थानीय प्रबंधित Chrome खोज टाइमआउट, अधिकतम `120000`               | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | लॉन्च के बाद स्थानीय प्रबंधित CDP की तैयार स्थिति का टाइमआउट, अधिकतम `120000`      | `8000`                                                             |

दोनों टाइमआउट मान `120000` ms तक के धनात्मक पूर्णांक होने चाहिए; अन्य मान
कॉन्फ़िगरेशन लोड करते समय अस्वीकार कर दिए जाते हैं। Raspberry Pi, पुराने VPS होस्ट या धीमे
स्टोरेज पर, जब Chrome को अपना CDP HTTP एंडपॉइंट उपलब्ध कराने के लिए अधिक समय चाहिए, तो
`browser.localLaunchTimeoutMs` बढ़ाएँ। जब लॉन्च सफल हो जाता है, लेकिन
`openclaw browser start` अभी भी `not reachable
after start` रिपोर्ट करता है, तो
`browser.localCdpReadyTimeoutMs` बढ़ाएँ।

### समस्या: profile="user" के लिए कोई Chrome टैब नहीं मिला

आप `user` (`existing-session` / Chrome MCP) प्रोफ़ाइल का उपयोग कर रहे हैं और अटैच होने के लिए
कोई टैब खुला नहीं है।

सुधार के विकल्प:

1. इसके बजाय प्रबंधित ब्राउज़र का उपयोग करें:
   `openclaw browser --browser-profile openclaw start` (या
   `browser.defaultProfile: "openclaw"` सेट करें)।
2. कम-से-कम एक खुला टैब रखते हुए स्थानीय Chrome को चालू रखें, फिर
   `--browser-profile user` के साथ पुनः प्रयास करें।

टिप्पणियाँ:

- `user` केवल होस्ट के लिए है। Linux सर्वर, कंटेनर या दूरस्थ होस्ट पर इसके बजाय
  CDP प्रोफ़ाइल को प्राथमिकता दें।
- `user` और अन्य `existing-session` प्रोफ़ाइल वर्तमान Chrome MCP
  सीमाएँ साझा करती हैं: केवल रेफ़रेंस-संचालित क्रियाएँ, प्रत्येक अपलोड में एक फ़ाइल, डायलॉग के लिए कोई `timeoutMs`
  ओवरराइड नहीं, कोई `wait --load networkidle` नहीं, और कोई `responsebody`, PDF निर्यात,
  डाउनलोड इंटरसेप्शन या बैच क्रियाएँ नहीं।
- स्थानीय `openclaw`-ड्राइवर प्रोफ़ाइल `cdpPort`/`cdpUrl` को स्वतः आवंटित करती हैं; इन्हें केवल
  दूरस्थ CDP के लिए मैन्युअल रूप से सेट करें।
- दूरस्थ CDP प्रोफ़ाइल `http://`, `https://`, `ws://`, और `wss://` स्वीकार करती हैं।
  `/json/version` खोज के लिए HTTP(S) का उपयोग करें, या जब आपकी ब्राउज़र
  सेवा आपको प्रत्यक्ष DevTools सॉकेट URL देती है, तो WS(S) का उपयोग करें।

## संबंधित

- [ब्राउज़र](/hi/tools/browser)
- [ब्राउज़र लॉगिन](/hi/tools/browser-login)
- [ब्राउज़र WSL2 समस्या निवारण](/hi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
