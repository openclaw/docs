---
read_when:
    - OpenClaw Gateway को WSL2 में चलाना जबकि Chrome Windows पर चलता है
    - WSL2 और Windows में ओवरलैप होती ब्राउज़र/control-ui त्रुटियाँ दिखना
    - स्प्लिट-होस्ट सेटअप में होस्ट-लोकल Chrome MCP और कच्चे रिमोट CDP के बीच निर्णय लेना
summary: WSL2 Gateway + Windows Chrome दूरस्थ CDP की परत-दर-परत समस्या निवारण करें
title: WSL2 + Windows + रिमोट Chrome CDP समस्या निवारण
x-i18n:
    generated_at: "2026-06-29T00:17:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

सामान्य split-host सेटअप में, OpenClaw Gateway WSL2 के अंदर चलता है, Chrome Windows पर चलता है, और browser control को WSL2 और Windows की सीमा पार करनी पड़ती है। [issue #39369](https://github.com/openclaw/openclaw/issues/39369) से layered failure pattern का अर्थ है कि कई स्वतंत्र समस्याएं एक साथ दिखाई दे सकती हैं, जिससे पहले गलत layer टूटी हुई लगती है।

## पहले सही browser mode चुनें

आपके पास दो मान्य patterns हैं:

### विकल्प 1: WSL2 से Windows तक raw remote CDP

एक remote browser profile का उपयोग करें जो WSL2 से Windows Chrome CDP endpoint की ओर इशारा करता है।

इसे तब चुनें जब:

- Gateway WSL2 के अंदर रहता है
- Chrome Windows पर चलता है
- आपको browser control को WSL2/Windows सीमा पार कराना है

### विकल्प 2: Host-local Chrome MCP

`existing-session` / `user` का उपयोग केवल तब करें जब Gateway स्वयं Chrome के समान host पर चल रहा हो।

इसे तब चुनें जब:

- OpenClaw और Chrome एक ही मशीन पर हों
- आप local signed-in browser state चाहते हों
- आपको cross-host browser transport की आवश्यकता न हो
- आपको `responsebody`, PDF
  export, download interception, या batch actions जैसे advanced managed/raw-CDP-only routes की आवश्यकता न हो

WSL2 Gateway + Windows Chrome के लिए, raw remote CDP को प्राथमिकता दें। Chrome MCP host-local है, WSL2-to-Windows bridge नहीं।

## काम करने वाला architecture

Reference shape:

- WSL2 Gateway को `127.0.0.1:18789` पर चलाता है
- Windows सामान्य browser में Control UI को `http://127.0.0.1:18789/` पर खोलता है
- Windows Chrome port `9222` पर CDP endpoint expose करता है
- WSL2 उस Windows CDP endpoint तक पहुंच सकता है
- OpenClaw browser profile को उस address पर point करता है जो WSL2 से पहुंच योग्य है

## यह setup भ्रमित क्यों करता है

कई failures overlap हो सकते हैं:

- WSL2 Windows CDP endpoint तक नहीं पहुंच सकता
- Control UI non-secure origin से खोला गया है
- `gateway.controlUi.allowedOrigins` page origin से match नहीं करता
- token या pairing missing है
- browser profile गलत address की ओर इशारा करता है

इस वजह से, एक layer ठीक करने के बाद भी कोई अलग error visible रह सकता है।

## Control UI के लिए critical rule

जब UI Windows से खोला जाए, तब Windows localhost का उपयोग करें, जब तक कि आपके पास deliberate HTTPS setup न हो।

उपयोग करें:

`http://127.0.0.1:18789/`

Control UI के लिए LAN IP को default न बनाएं। LAN या tailnet address पर plain HTTP insecure-origin/device-auth behavior trigger कर सकता है, जो CDP से असंबंधित है। [Control UI](/hi/web/control-ui) देखें।

## Layers में validate करें

ऊपर से नीचे काम करें। आगे skip न करें।

### Layer 1: Verify करें कि Chrome Windows पर CDP serve कर रहा है

Windows पर remote debugging enabled करके Chrome start करें:

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows से, पहले Chrome स्वयं verify करें:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

यदि यह Windows पर fail होता है, तो अभी OpenClaw समस्या नहीं है।

### Layer 2: Verify करें कि WSL2 उस Windows endpoint तक पहुंच सकता है

WSL2 से, उस exact address को test करें जिसे आप `cdpUrl` में use करने की योजना बना रहे हैं:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

अच्छा result:

- `/json/version` Browser / Protocol-Version metadata के साथ JSON return करता है
- `/json/list` JSON return करता है (यदि कोई pages open नहीं हैं तो empty array ठीक है)

यदि यह fail होता है:

- Windows अभी port को WSL2 के लिए expose नहीं कर रहा है
- WSL2 side के लिए address गलत है
- firewall / port forwarding / local proxying अभी भी missing है

OpenClaw config छूने से पहले इसे ठीक करें।

### Layer 3: सही browser profile configure करें

Raw remote CDP के लिए, OpenClaw को उस address की ओर point करें जो WSL2 से पहुंच योग्य है:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Notes:

- WSL2-reachable address का उपयोग करें, वह नहीं जो केवल Windows पर काम करता है
- externally managed browsers के लिए `attachOnly: true` रखें
- `cdpUrl` `http://`, `https://`, `ws://`, या `wss://` हो सकता है
- जब आप चाहते हैं कि OpenClaw `/json/version` discover करे, तब HTTP(S) use करें
- WS(S) केवल तब use करें जब browser provider आपको direct DevTools socket URL देता है
- OpenClaw से success की अपेक्षा करने से पहले same URL को `curl` से test करें

### Layer 4: Control UI layer अलग से verify करें

Windows से UI खोलें:

`http://127.0.0.1:18789/`

फिर verify करें:

- page origin वही match करता है जिसकी `gateway.controlUi.allowedOrigins` अपेक्षा करता है
- token auth या pairing सही configured है
- आप Control UI auth problem को browser problem समझकर debug नहीं कर रहे हैं

Helpful page:

- [Control UI](/hi/web/control-ui)

### Layer 5: End-to-end browser control verify करें

WSL2 से:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

अच्छा result:

- tab Windows Chrome में खुलता है
- `openclaw browser tabs` target return करता है
- बाद की actions (`snapshot`, `screenshot`, `navigate`) उसी profile से काम करती हैं

## Common misleading errors

हर message को layer-specific clue की तरह treat करें:

- `control-ui-insecure-auth`
  - UI origin / secure-context problem, CDP transport problem नहीं
- `token_missing`
  - auth configuration problem
- `pairing required`
  - device approval problem
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 configured `cdpUrl` तक नहीं पहुंच सकता
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP endpoint ने answer किया, लेकिन DevTools WebSocket अभी भी open नहीं हो सका
- remote session के बाद stale viewport / dark-mode / locale / offline overrides
  - `openclaw browser stop --browser-profile remote` run करें
  - यह active control session को close करता है और Gateway या external browser restart किए बिना Playwright/CDP emulation state release करता है
- `gateway timeout after 1500ms`
  - अक्सर अभी भी CDP reachability या slow/unreachable remote endpoint होता है
- `No Chrome tabs found for profile="user"`
  - local Chrome MCP profile selected है जहां कोई host-local tabs available नहीं हैं

## Fast triage checklist

1. Windows: क्या `curl http://127.0.0.1:9222/json/version` काम करता है?
2. WSL2: क्या `curl http://WINDOWS_HOST_OR_IP:9222/json/version` काम करता है?
3. OpenClaw config: क्या `browser.profiles.<name>.cdpUrl` वही exact WSL2-reachable address use करता है?
4. Control UI: क्या आप LAN IP के बजाय `http://127.0.0.1:18789/` खोल रहे हैं?
5. क्या आप raw remote CDP के बजाय `existing-session` को WSL2 और Windows के across use करने की कोशिश कर रहे हैं?

## Practical takeaway

Setup आमतौर पर viable है। कठिन हिस्सा यह है कि browser transport, Control UI origin security, और token/pairing प्रत्येक independently fail हो सकते हैं, जबकि user side से वे similar दिखते हैं।

जब संदेह हो:

- पहले Windows Chrome endpoint को locally verify करें
- फिर उसी endpoint को WSL2 से verify करें
- केवल उसके बाद OpenClaw config या Control UI auth debug करें

## Related

- [Browser](/hi/tools/browser)
- [Browser login](/hi/tools/browser-login)
- [Browser Linux troubleshooting](/hi/tools/browser-linux-troubleshooting)
