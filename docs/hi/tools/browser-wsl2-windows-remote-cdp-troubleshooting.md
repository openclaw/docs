---
read_when:
    - Windows पर Chrome के रहते हुए WSL2 में OpenClaw Gateway चलाना
    - WSL2 और Windows में एक-दूसरे से मिलती-जुलती browser/control-ui त्रुटियाँ दिखाई देना
    - स्प्लिट-होस्ट सेटअप में होस्ट-लोकल Chrome MCP और रॉ रिमोट CDP के बीच निर्णय लेना
summary: WSL2 Gateway + Windows Chrome रिमोट CDP का चरणबद्ध समस्या निवारण करें
title: WSL2 + Windows + रिमोट Chrome CDP समस्या निवारण
x-i18n:
    generated_at: "2026-07-20T07:27:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 66ec4ed5bfccc66b594a43d56296c69242e8b9cf50b36c6cb3990b1d6ea58faa
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

सामान्य स्प्लिट-होस्ट सेटअप में, OpenClaw Gateway WSL2 के अंदर चलता है, Chrome
Windows पर चलता है, और ब्राउज़र नियंत्रण को WSL2/Windows सीमा पार करनी होती है। कई
स्वतंत्र समस्याएँ एक साथ सामने आ सकती हैं (देखें
[इश्यू #39369](https://github.com/openclaw/openclaw/issues/39369)): CDP
ट्रांसपोर्ट, Control UI ओरिजिन सुरक्षा और टोकन/पेयरिंग में से प्रत्येक
अलग-अलग विफल हो सकता है, जबकि त्रुटियाँ एक जैसी दिखाई दे सकती हैं। किसमें खराबी है,
इसका अनुमान लगाने के बजाय नीचे दी गई परतों पर क्रम से काम करें।

## पहले सही ब्राउज़र मोड चुनें

### विकल्प 1: WSL2 से Windows तक रॉ रिमोट CDP

WSL2 से Windows Chrome CDP एंडपॉइंट की ओर इंगित करने वाली रिमोट ब्राउज़र प्रोफ़ाइल
का उपयोग करें। इसे तब चुनें जब Gateway WSL2 के अंदर रहता हो, Chrome
Windows पर चलता हो, और ब्राउज़र नियंत्रण को WSL2/Windows सीमा पार करनी हो।

### विकल्प 2: होस्ट-लोकल Chrome MCP

`existing-session` ड्राइवर (`user` प्रोफ़ाइल) का उपयोग केवल तभी करें जब Gateway
Chrome वाले उसी होस्ट पर चलता हो, आपको स्थानीय साइन-इन किया हुआ ब्राउज़र स्टेट चाहिए, आपको
क्रॉस-होस्ट ब्राउज़र ट्रांसपोर्ट की आवश्यकता न हो, और आपको `responsebody`,
PDF एक्सपोर्ट, डाउनलोड इंटरसेप्शन या बैच कार्रवाइयों की आवश्यकता न हो (Chrome MCP प्रोफ़ाइल
इनका समर्थन नहीं करतीं)।

WSL2 Gateway + Windows Chrome के लिए रॉ रिमोट CDP का उपयोग करें। Chrome MCP
होस्ट-लोकल है, WSL2-से-Windows ब्रिज नहीं।

## कार्यशील आर्किटेक्चर

- WSL2, Gateway को `127.0.0.1:18789` पर चलाता है
- Windows, Control UI को सामान्य ब्राउज़र में `http://127.0.0.1:18789/` पर खोलता है
- Windows Chrome, पोर्ट `9222` पर CDP एंडपॉइंट उपलब्ध कराता है
- WSL2 उस Windows CDP एंडपॉइंट तक पहुँच सकता है
- OpenClaw ब्राउज़र प्रोफ़ाइल को WSL2 से पहुँच योग्य पते की ओर इंगित करता है

## Control UI के लिए महत्वपूर्ण नियम

जब UI को Windows से खोला जाए, तो जानबूझकर HTTPS सेटअप न होने तक Windows localhost
का उपयोग करें:

```text
http://127.0.0.1:18789/
```

LAN IP को डिफ़ॉल्ट न बनाएँ। LAN या tailnet पते पर साधारण HTTP
CDP से असंबंधित असुरक्षित-ओरिजिन/डिवाइस-प्रमाणीकरण व्यवहार ट्रिगर कर सकता है। देखें
[Control UI](/hi/web/control-ui)।

## परतों में सत्यापन करें

ऊपर से नीचे की ओर काम करें; आगे की परतों को न छोड़ें। एक परत को ठीक करने के बाद भी
नीचे की किसी दूसरी परत की अलग त्रुटि दिखाई दे सकती है।

### परत 1: सत्यापित करें कि Chrome Windows पर CDP उपलब्ध करा रहा है

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 और बाद के संस्करण डिफ़ॉल्ट Chrome डेटा डायरेक्टरी के लिए
रिमोट-डीबगिंग कमांड-लाइन स्विच अनदेखे करते हैं। ऊपर दिखाए अनुसार एक अलग,
गैर-डिफ़ॉल्ट डेटा डायरेक्टरी का उपयोग करें। Chrome का
[रिमोट-डीबगिंग सुरक्षा परिवर्तन](https://developer.chrome.com/blog/remote-debugging-port)
देखें। इससे सामान्य साइन-इन की गई Chrome प्रोफ़ाइल रिमोट रूप से नियंत्रित नहीं हो जाती।

Windows से पहले स्वयं Chrome को सत्यापित करें:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

यदि यह विफल होता है, तो नीचे दिए गए Windows लिसनर का निदान करें। अभी तक समस्या
OpenClaw में नहीं है।

#### portproxy बदलने से पहले IPv4 और IPv6 का निदान करें

Chromium पहले रिमोट डीबगिंग को `127.0.0.1` से बाइंड करने का प्रयास करता है और
IPv4 बाइंड विफल होने पर ही `[::1]` पर फ़ॉलबैक करता है। `127.0.0.1:9222` पर
सुनने वाला स्थायी `v4tov4` नियम Chrome शुरू होने से पहले उस एंडपॉइंट को
अपने अधिकार में ले सकता है। इसके बाद Chrome `[::1]:9222` पर फ़ॉलबैक करता है,
जबकि पुराना नियम IPv4 ट्रैफ़िक को वापस अपने ही लिसनर पर फ़ॉरवर्ड करता है और
खाली उत्तर देता है।

Chrome संस्करण से अनुमान लगाने के बजाय Windows से वास्तविक लिसनर और प्रॉक्सी नियम
जाँचें:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

`netstat` से प्राप्त प्रत्येक PID के लिए `tasklist /fi "PID eq <PID>"` का उपयोग करें।

- यदि `chrome.exe`, `127.0.0.1` पर उत्तर देता है, तो ऐसा कोई भी portproxy नियम हटाएँ जो
  `127.0.0.1:9222` पर भी सुनता हो। केवल WSL2 से पहुँच योग्य Windows अडैप्टर
  पते को `127.0.0.1` पर फ़ॉरवर्ड करें।
- यदि `chrome.exe` केवल `[::1]` पर उत्तर देता है, तो किसी अप्रयुक्त IPv4 पते पर फ़ॉरवर्ड करने के बजाय
  `v4tov6` के साथ WSL2 से पहुँच योग्य लिसनर को `::1` की ओर इंगित करें:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

लिसनर को उस अडैप्टर पते से बाइंड करें जिसकी WSL2 को आवश्यकता है। CDP
पोर्ट को `0.0.0.0`, LAN पते या tailnet पते पर उपलब्ध न कराएँ: CDP
ब्राउज़र सेशन का नियंत्रण प्रदान करता है।

### परत 2: सत्यापित करें कि WSL2 उस Windows एंडपॉइंट तक पहुँच सकता है

WSL2 से उसी सटीक पते का परीक्षण करें जिसका उपयोग आप `cdpUrl` में करने वाले हैं:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

अच्छा परिणाम:

- `/json/version` Browser / Protocol-Version मेटाडेटा वाला JSON लौटाता है
- `/json/list` JSON लौटाता है (यदि कोई पेज खुला न हो तो खाली ऐरे ठीक है)

यदि यह विफल होता है, तो Windows ने अभी पोर्ट को WSL2 के लिए उपलब्ध नहीं कराया है,
पता WSL2 की ओर से गलत है, या फ़ायरवॉल/पोर्ट-फ़ॉरवर्डिंग/प्रॉक्सीइंग अनुपस्थित है।
OpenClaw कॉन्फ़िग को छूने से पहले इसे ठीक करें।

### परत 3: सही ब्राउज़र प्रोफ़ाइल कॉन्फ़िगर करें

OpenClaw को WSL2 से पहुँच योग्य पते की ओर इंगित करें:

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

नोट:

- WSL2 से पहुँच योग्य पते का उपयोग करें, न कि ऐसे पते का जो केवल Windows पर काम करता हो
- बाहरी रूप से प्रबंधित ब्राउज़र के लिए `attachOnly: true` बनाए रखें
- `cdpUrl`, `http://`, `https://`, `ws://` या `wss://` हो सकता है
- जब आप चाहते हों कि OpenClaw `/json/version` खोजे, तब HTTP(S) का उपयोग करें
- WS(S) का उपयोग केवल तभी करें जब ब्राउज़र प्रदाता आपको सीधा DevTools
  सॉकेट URL देता हो
- OpenClaw के सफल होने की अपेक्षा करने से पहले उसी URL को `curl` से जाँचें

### परत 4: Control UI परत का अलग से सत्यापन करें

Windows से `http://127.0.0.1:18789/` खोलें, फिर सत्यापित करें:

- पेज ओरिजिन उससे मेल खाता है जिसकी `gateway.controlUi.allowedOrigins` अपेक्षा करता है
- टोकन प्रमाणीकरण या पेयरिंग सही ढंग से कॉन्फ़िगर है
- आप Control UI प्रमाणीकरण समस्या को ब्राउज़र
  समस्या समझकर डीबग नहीं कर रहे हैं

उपयोगी पेज: [Control UI](/hi/web/control-ui)।

### परत 5: एंड-टू-एंड ब्राउज़र नियंत्रण सत्यापित करें

WSL2 से:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

अच्छा परिणाम:

- टैब Windows Chrome में खुलता है
- `browser tabs` लक्ष्य लौटाता है
- बाद की कार्रवाइयाँ (`snapshot`, `screenshot`, `navigate`) उसी
  प्रोफ़ाइल से काम करती हैं

## सामान्य भ्रामक त्रुटियाँ

| संदेश                                                                                   | अर्थ                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | UI ओरिजिन/सुरक्षित-कॉन्टेक्स्ट समस्या, CDP ट्रांसपोर्ट समस्या नहीं                                                                                                                |
| `token_missing`                                                                         | प्रमाणीकरण कॉन्फ़िगरेशन समस्या                                                                                                                                                    |
| `pairing required`                                                                      | डिवाइस अनुमोदन समस्या                                                                                                                                                             |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 कॉन्फ़िगर किए गए `cdpUrl` तक नहीं पहुँच सकता                                                                                                                               |
| खाली CDP उत्तर / portproxy के माध्यम से `other side closed`                               | Windows लिसनर बेमेल या स्व-लूप; दोनों लूपबैक फ़ैमिली और `netsh interface portproxy show all` की जाँच करें                                                                 |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP एंडपॉइंट ने उत्तर दिया, लेकिन DevTools WebSocket नहीं खोला जा सका                                                                                                           |
| रिमोट सेशन के बाद पुराना व्यूपोर्ट / डार्क-मोड / लोकेल / ऑफ़लाइन ओवरराइड                 | Gateway या बाहरी ब्राउज़र को पुनः शुरू किए बिना सेशन बंद करने और कैश किया हुआ Playwright/CDP कनेक्शन रिलीज़ करने के लिए `openclaw browser --browser-profile remote stop` चलाएँ |
| CDP पहुँच-योग्यता के दौरान टाइमआउट                                                       | आमतौर पर अभी भी CDP पहुँच-योग्यता की समस्या, या धीमा/अगम्य रिमोट एंडपॉइंट                                                                                                         |
| `Playwright page enumeration timed out after 3000ms`                                    | रिमोट CDP कनेक्ट हुआ, लेकिन उसका स्थायी टैब रीड अटक गया                                                                                                                           |
| `No Chrome tabs found for profile="user"`                                               | ऐसी जगह स्थानीय Chrome MCP प्रोफ़ाइल चुनी गई जहाँ कोई होस्ट-लोकल टैब उपलब्ध नहीं है                                                                                               |

## त्वरित ट्राइएज चेकलिस्ट

1. Windows: `127.0.0.1` या `[::1]` में से कौन `/json/version` पर उत्तर देता है, और
   क्या वह लिसनर `chrome.exe` का है?
2. WSL2: क्या `curl http://WINDOWS_HOST_OR_IP:9222/json/version` काम करता है?
3. OpenClaw कॉन्फ़िग: क्या `browser.profiles.<name>.cdpUrl` उसी सटीक
   WSL2 से पहुँच योग्य पते का उपयोग करता है?
4. Control UI: क्या आप LAN IP के बजाय `http://127.0.0.1:18789/` खोल रहे हैं?
5. क्या आप रॉ रिमोट CDP के बजाय WSL2 और Windows के बीच
   `existing-session` का उपयोग करने का प्रयास कर रहे हैं?

पहले Windows Chrome एंडपॉइंट को स्थानीय रूप से सत्यापित करें, फिर उसी एंडपॉइंट को
WSL2 से सत्यापित करें, और उसके बाद ही OpenClaw कॉन्फ़िग या Control UI प्रमाणीकरण
को डीबग करें।

## संबंधित

- [ब्राउज़र](/hi/tools/browser)
- [ब्राउज़र लॉगिन](/hi/tools/browser-login)
- [ब्राउज़र Linux समस्या निवारण](/hi/tools/browser-linux-troubleshooting)
