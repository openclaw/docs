---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Linux पर OpenClaw ब्राउज़र नियंत्रण के लिए Chrome/Brave/Edge/Chromium CDP स्टार्टअप समस्याओं को ठीक करें
title: ब्राउज़र समस्या निवारण
x-i18n:
    generated_at: "2026-06-29T00:16:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## समस्या: "पोर्ट 18800 पर Chrome CDP शुरू करने में विफल"

OpenClaw का ब्राउज़र नियंत्रण सर्वर Chrome/Brave/Edge/Chromium को इस त्रुटि के साथ लॉन्च करने में विफल होता है:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### मूल कारण

Ubuntu (और कई Linux डिस्ट्रो) पर, डिफ़ॉल्ट Chromium इंस्टॉलेशन एक **snap package** होता है। Snap का AppArmor confinement OpenClaw द्वारा ब्राउज़र प्रक्रिया शुरू करने और मॉनिटर करने के तरीके में बाधा डालता है।

`apt install chromium` कमांड एक stub package इंस्टॉल करता है जो snap पर रीडायरेक्ट करता है:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

यह वास्तविक ब्राउज़र नहीं है - यह सिर्फ़ एक wrapper है।

अन्य सामान्य Linux लॉन्च विफलताएं:

- `The profile appears to be in use by another Chromium process` का अर्थ है कि Chrome को
  managed profile डायरेक्टरी में पुराने `Singleton*` lock files मिले। OpenClaw
  उन locks को हटाता है और एक बार फिर कोशिश करता है जब lock किसी मृत या
  अलग-host प्रक्रिया की ओर संकेत करता है।
- `Missing X server or $DISPLAY` का अर्थ है कि desktop session के बिना किसी host पर visible browser स्पष्ट रूप से
  अनुरोधित था। डिफ़ॉल्ट रूप से, local managed
  profiles अब Linux पर headless mode पर fallback करते हैं जब `DISPLAY` और
  `WAYLAND_DISPLAY` दोनों unset हों। यदि आपने `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false`, या `browser.profiles.<name>.headless: false` सेट किया है,
  तो उस headed override को हटाएं, `OPENCLAW_BROWSER_HEADLESS=1` सेट करें, `Xvfb` शुरू करें,
  one-shot managed launch के लिए `openclaw browser start --headless` चलाएं, या
  OpenClaw को वास्तविक desktop session में चलाएं।

### समाधान 1: Google Chrome इंस्टॉल करें (अनुशंसित)

आधिकारिक Google Chrome `.deb` package इंस्टॉल करें, जिसे snap sandbox नहीं करता:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

फिर अपनी OpenClaw config (`~/.openclaw/openclaw.json`) अपडेट करें:

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

### समाधान 2: Attach-Only Mode के साथ Snap Chromium का उपयोग करें

यदि आपको snap Chromium का उपयोग करना ही है, तो manually-started browser से attach करने के लिए OpenClaw को configure करें:

1. config अपडेट करें:

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

2. Chromium को manually शुरू करें:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. वैकल्पिक रूप से Chrome को auto-start करने के लिए systemd user service बनाएं:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

इससे enable करें: `systemctl --user enable --now openclaw-browser.service`

### ब्राउज़र के काम करने की पुष्टि करना

status जांचें:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

browsing का परीक्षण करें:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Config संदर्भ

| विकल्प                           | विवरण                                                          | डिफ़ॉल्ट                                                     |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | browser control सक्षम करें                                               | `true`                                                      |
| `browser.executablePath`         | Chromium-आधारित browser binary (Chrome/Brave/Edge/Chromium) का path | auto-detected (Chromium-आधारित होने पर default browser को प्राथमिकता देता है) |
| `browser.headless`               | GUI के बिना चलाएं                                                      | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | local managed browser headless mode के लिए per-process override         | सेट नहीं                                                       |
| `browser.noSandbox`              | `--no-sandbox` flag जोड़ें (कुछ Linux setups के लिए आवश्यक)               | `false`                                                     |
| `browser.attachOnly`             | browser launch न करें, केवल existing से attach करें                        | `false`                                                     |
| `browser.cdpPort`                | Chrome DevTools Protocol port                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Local managed Chrome discovery timeout                               | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Local managed post-launch CDP readiness timeout                      | `8000`                                                      |

Raspberry Pi, पुराने VPS hosts, या slow storage पर,
`browser.localLaunchTimeoutMs` बढ़ाएं जब Chrome को अपना CDP HTTP
endpoint expose करने के लिए अधिक समय चाहिए। `browser.localCdpReadyTimeoutMs` तब बढ़ाएं जब launch सफल हो लेकिन
`openclaw browser start` फिर भी `not reachable after start` रिपोर्ट करे। मान
`120000` ms तक के positive integers होने चाहिए; invalid config values rejected होते हैं।

### समस्या: "profile=\"user\" के लिए कोई Chrome tabs नहीं मिले"

आप `existing-session` / Chrome MCP profile का उपयोग कर रहे हैं। OpenClaw local Chrome देख सकता है,
लेकिन attach करने के लिए कोई open tabs उपलब्ध नहीं हैं।

Fix विकल्प:

1. **managed browser का उपयोग करें:** `openclaw browser start --browser-profile openclaw`
   (या `browser.defaultProfile: "openclaw"` सेट करें)।
2. **Chrome MCP का उपयोग करें:** सुनिश्चित करें कि local Chrome कम से कम एक open tab के साथ चल रहा है, फिर `--browser-profile user` के साथ फिर कोशिश करें।

Notes:

- `user` host-only है। Linux servers, containers, या remote hosts के लिए, CDP profiles को प्राथमिकता दें।
- `user` / अन्य `existing-session` profiles वर्तमान Chrome MCP limits रखते हैं:
  ref-driven actions, one-file upload hooks, कोई dialog timeout overrides नहीं, कोई
  `wait --load networkidle` नहीं, और कोई `responsebody`, PDF export, download
  interception, या batch actions नहीं।
- Local `openclaw` profiles `cdpPort`/`cdpUrl` auto-assign करते हैं; इन्हें केवल remote CDP के लिए सेट करें।
- Remote CDP profiles `http://`, `https://`, `ws://`, और `wss://` स्वीकार करते हैं।
  `/json/version` discovery के लिए HTTP(S) का उपयोग करें, या WS(S) का उपयोग करें जब आपका browser
  service आपको direct DevTools socket URL देता है।

## संबंधित

- [Browser](/hi/tools/browser)
- [Browser login](/hi/tools/browser-login)
- [Browser WSL2 troubleshooting](/hi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
