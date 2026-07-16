---
read_when:
    - आप OpenClaw को अपने मुख्य macOS परिवेश से अलग रखना चाहते हैं
    - आप सैंडबॉक्स में iMessage एकीकरण चाहते हैं
    - आप एक रीसेट करने योग्य macOS परिवेश चाहते हैं जिसे आप क्लोन कर सकें
    - आप स्थानीय बनाम होस्ट किए गए macOS VM विकल्पों की तुलना करना चाहते हैं
summary: जब आपको अलगाव या iMessage की आवश्यकता हो, तो OpenClaw को सैंडबॉक्स किए गए macOS VM (स्थानीय या होस्टेड) में चलाएँ
title: macOS वर्चुअल मशीनें
x-i18n:
    generated_at: "2026-07-16T15:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## अनुशंसित डिफ़ॉल्ट (अधिकांश उपयोगकर्ता)

- हमेशा चालू रहने वाले Gateway और कम लागत के लिए **छोटा Linux VPS**। [VPS होस्टिंग](/hi/vps) देखें।
- यदि आप पूर्ण नियंत्रण और ब्राउज़र ऑटोमेशन के लिए **रेज़िडेंशियल IP** चाहते हैं, तो **समर्पित हार्डवेयर** (Mac mini या Linux बॉक्स)। कई साइटें डेटा सेंटर IP को ब्लॉक करती हैं, इसलिए स्थानीय ब्राउज़िंग अक्सर बेहतर काम करती है।
- **हाइब्रिड**: Gateway को सस्ते VPS पर रखें और जब ब्राउज़र/UI ऑटोमेशन की आवश्यकता हो, तब अपने Mac को **Node** के रूप में कनेक्ट करें। [Nodes](/hi/nodes) और [Gateway रिमोट](/hi/gateway/remote) देखें।

macOS VM का उपयोग केवल तभी करें, जब आपको विशेष रूप से iMessage जैसी केवल macOS पर उपलब्ध क्षमताओं की आवश्यकता हो या आप अपने दैनिक उपयोग वाले Mac से सख्त पृथक्करण चाहते हों।

## macOS VM विकल्प

### आपके Apple Silicon Mac पर स्थानीय VM (Lume)

अपने मौजूदा Apple Silicon Mac पर [Lume](https://cua.ai/docs/lume) का उपयोग करके OpenClaw को सैंडबॉक्स किए गए macOS VM में चलाएँ। इससे आपको मिलता है:

- पृथक पूर्ण macOS परिवेश (आपका होस्ट साफ़ रहता है)
- `imsg` के माध्यम से iMessage समर्थन; डिफ़ॉल्ट स्थानीय पथ Linux/Windows पर संभव नहीं है
- VM को क्लोन करके तुरंत रीसेट
- अतिरिक्त हार्डवेयर या क्लाउड लागत नहीं

### होस्टेड Mac प्रदाता (क्लाउड)

यदि आप क्लाउड में macOS चाहते हैं, तो होस्टेड Mac प्रदाता भी काम करते हैं:

- [MacStadium](https://www.macstadium.com/) (होस्टेड Mac)
- अन्य होस्टेड Mac विक्रेता भी काम करते हैं; उनके VM + SSH दस्तावेज़ों का पालन करें

macOS VM पर SSH एक्सेस मिलने के बाद, नीचे [OpenClaw इंस्टॉल करें](#6-install-openclaw) से आगे बढ़ें।

## त्वरित तरीका (Lume, अनुभवी उपयोगकर्ता)

1. Lume इंस्टॉल करें।
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant पूरा करें, Remote Login (SSH) सक्षम करें।
4. `lume run openclaw --no-display`
5. SSH से कनेक्ट करें, OpenClaw इंस्टॉल करें और चैनल कॉन्फ़िगर करें।
6. पूरा हुआ।

## आपको क्या चाहिए (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- होस्ट पर macOS Sequoia या उसके बाद का संस्करण
- प्रति VM ~60 GB खाली डिस्क स्थान
- ~20 मिनट

## 1) Lume इंस्टॉल करें

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

यदि `~/.local/bin` आपके PATH में नहीं है:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

सत्यापित करें:

```bash
lume --version
```

दस्तावेज़: [Lume इंस्टॉलेशन](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) macOS VM बनाएँ

```bash
lume create openclaw --os macos --ipsw latest
```

यह macOS डाउनलोड करके VM बनाता है। एक VNC विंडो अपने-आप खुलती है।

<Note>
आपके कनेक्शन के आधार पर डाउनलोड में कुछ समय लग सकता है।
</Note>

## 3) Setup Assistant पूरा करें

VNC विंडो में:

1. भाषा और क्षेत्र चुनें।
2. Apple ID छोड़ें (या यदि आप बाद में iMessage चाहते हैं, तो साइन इन करें)।
3. एक उपयोगकर्ता खाता बनाएँ (उपयोगकर्ता नाम और पासवर्ड याद रखें)।
4. सभी वैकल्पिक सुविधाएँ छोड़ें।

सेटअप पूरा होने के बाद:

1. SSH सक्षम करें: System Settings -> General -> Sharing में जाकर "Remote Login" सक्षम करें।
2. हेडलेस VM उपयोग के लिए ऑटो-लॉगिन सक्षम करें: System Settings -> Users & Groups में "Automatically log in as:" चुनें और VM उपयोगकर्ता चुनें।

## 4) VM का IP पता प्राप्त करें

```bash
lume get openclaw
```

IP पता देखें (आमतौर पर `192.168.64.x`)।

## 5) SSH से VM में कनेक्ट करें

```bash
ssh youruser@192.168.64.X
```

`youruser` को अपने बनाए हुए खाते से और IP को अपने VM के IP से बदलें।

## 6) OpenClaw इंस्टॉल करें

VM के अंदर:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

अपना मॉडल प्रदाता (Anthropic, OpenAI आदि) सेट अप करने के लिए ऑनबोर्डिंग संकेतों का पालन करें।

## 7) चैनल कॉन्फ़िगर करें

कॉन्फ़िगरेशन फ़ाइल संपादित करें:

```bash
nano ~/.openclaw/openclaw.json
```

अपने चैनल जोड़ें:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

फिर WhatsApp में लॉग इन करें (QR स्कैन करें):

```bash
openclaw channels login
```

## 8) VM को हेडलेस रूप से चलाएँ

VM रोकें और डिस्प्ले के बिना पुनः आरंभ करें:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM पृष्ठभूमि में चलता है; OpenClaw का डेमन Gateway को चालू रखता है। स्थिति जाँचने के लिए:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## बोनस: iMessage एकीकरण

यह macOS पर चलाने की सबसे प्रभावशाली विशेषता है। OpenClaw में Messages जोड़ने के लिए [iMessage](/hi/channels/imessage) का उपयोग `imsg` के साथ करें।

VM के अंदर:

1. Messages में साइन इन करें।
2. `imsg` इंस्टॉल करें।
3. OpenClaw/`imsg` चलाने वाली प्रक्रिया के लिए Full Disk Access और Automation अनुमति दें।
4. `imsg rpc --help` से RPC समर्थन सत्यापित करें।

अपने OpenClaw कॉन्फ़िगरेशन में जोड़ें:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Gateway पुनः आरंभ करें। अब आपका एजेंट iMessages भेज और प्राप्त कर सकता है। सेटअप का पूरा विवरण: [iMessage चैनल](/hi/channels/imessage)।

## गोल्डन इमेज सहेजें

आगे कस्टमाइज़ करने से पहले अपनी साफ़ स्थिति का स्नैपशॉट लें:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

कभी भी रीसेट करें:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## 24/7 चलाना

VM को चालू रखने के लिए:

- अपने Mac को बिजली से कनेक्ट रखें
- System Settings -> Energy Saver में स्लीप अक्षम करें
- आवश्यक होने पर `caffeinate` का उपयोग करें

वास्तव में हमेशा चालू रहने के लिए समर्पित Mac mini या छोटे VPS पर विचार करें। [VPS होस्टिंग](/hi/vps) देखें।

## समस्या निवारण

| समस्या                   | समाधान                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------- |
| VM में SSH नहीं हो रहा   | जाँचें कि VM की System Settings में "Remote Login" सक्षम है                         |
| VM IP दिखाई नहीं दे रहा | VM के पूरी तरह बूट होने की प्रतीक्षा करें, फिर `lume get openclaw` दोबारा चलाएँ     |
| Lume कमांड नहीं मिला     | `~/.local/bin` को अपने PATH में जोड़ें                                          |
| WhatsApp QR स्कैन नहीं हो रहा | `openclaw channels login` चलाते समय सुनिश्चित करें कि आपने VM में लॉग इन किया है (होस्ट में नहीं) |

## संबंधित दस्तावेज़

- [VPS होस्टिंग](/hi/vps)
- [Nodes](/hi/nodes)
- [Gateway रिमोट](/hi/gateway/remote)
- [iMessage चैनल](/hi/channels/imessage)
- [Lume त्वरित आरंभ](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI संदर्भ](https://cua.ai/docs/lume/reference/cli-reference)
- [अनअटेंडेड VM सेटअप](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (उन्नत)
- [Docker सैंडबॉक्सिंग](/hi/install/docker) (वैकल्पिक पृथक्करण तरीका)
