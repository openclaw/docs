---
read_when:
    - आप OpenClaw को अपने मुख्य macOS परिवेश से अलग रखना चाहते हैं
    - आप सैंडबॉक्स में iMessage एकीकरण चाहते हैं
    - आपको एक रीसेट करने योग्य macOS वातावरण चाहिए जिसे आप क्लोन कर सकें
    - आप स्थानीय बनाम होस्ट किए गए macOS VM विकल्पों की तुलना करना चाहते हैं
summary: जब आपको अलगाव या iMessage की आवश्यकता हो, तो OpenClaw को सैंडबॉक्स किए गए macOS VM (स्थानीय या होस्टेड) में चलाएँ
title: macOS वर्चुअल मशीनें
x-i18n:
    generated_at: "2026-06-28T23:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## अनुशंसित डिफ़ॉल्ट (अधिकांश उपयोगकर्ता)

- हमेशा चालू Gateway और कम लागत के लिए **छोटा Linux VPS**। देखें [VPS होस्टिंग](/hi/vps)।
- यदि आप पूरा नियंत्रण और ब्राउज़र ऑटोमेशन के लिए **रेज़िडेंशियल IP** चाहते हैं, तो **समर्पित हार्डवेयर** (Mac mini या Linux बॉक्स)। कई साइटें डेटा सेंटर IPs को ब्लॉक करती हैं, इसलिए स्थानीय ब्राउज़िंग अक्सर बेहतर काम करती है।
- **हाइब्रिड:** Gateway को सस्ते VPS पर रखें, और जब आपको ब्राउज़र/UI ऑटोमेशन चाहिए तब अपने Mac को **Node** के रूप में कनेक्ट करें। देखें [Nodes](/hi/nodes) और [Gateway रिमोट](/hi/gateway/remote)।

macOS VM का उपयोग तब करें जब आपको विशेष रूप से macOS-only क्षमताओं जैसे iMessage की ज़रूरत हो या आप अपने दैनिक Mac से सख्त अलगाव चाहते हों।

## macOS VM विकल्प

### आपके Apple Silicon Mac पर स्थानीय VM (Lume)

[Lume](https://cua.ai/docs/lume) का उपयोग करके अपने मौजूदा Apple Silicon Mac पर सैंडबॉक्स किए गए macOS VM में OpenClaw चलाएँ।

इससे आपको मिलता है:

- अलगाव में पूरा macOS वातावरण (आपका होस्ट साफ़ रहता है)
- `imsg` के ज़रिए iMessage समर्थन (डिफ़ॉल्ट स्थानीय पथ Linux/Windows पर असंभव है)
- VMs क्लोन करके तुरंत रीसेट
- कोई अतिरिक्त हार्डवेयर या क्लाउड लागत नहीं

### होस्टेड Mac प्रदाता (क्लाउड)

यदि आप क्लाउड में macOS चाहते हैं, तो होस्टेड Mac प्रदाता भी काम करते हैं:

- [MacStadium](https://www.macstadium.com/) (होस्टेड Macs)
- अन्य होस्टेड Mac विक्रेता भी काम करते हैं; उनके VM + SSH दस्तावेज़ों का पालन करें

macOS VM तक SSH पहुँच मिल जाने पर, नीचे चरण 6 पर जारी रखें।

---

## त्वरित पथ (Lume, अनुभवी उपयोगकर्ता)

1. Lume इंस्टॉल करें
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant पूरा करें, Remote Login (SSH) सक्षम करें
4. `lume run openclaw --no-display`
5. SSH से लॉग इन करें, OpenClaw इंस्टॉल करें, channels कॉन्फ़िगर करें
6. पूर्ण

---

## आपको क्या चाहिए (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- होस्ट पर macOS Sequoia या बाद का संस्करण
- प्रति VM ~60 GB खाली डिस्क स्थान
- ~20 मिनट

---

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

---

## 2) macOS VM बनाएँ

```bash
lume create openclaw --os macos --ipsw latest
```

यह macOS डाउनलोड करता है और VM बनाता है। VNC विंडो अपने-आप खुलती है।

<Note>
आपके कनेक्शन के आधार पर डाउनलोड में कुछ समय लग सकता है।
</Note>

---

## 3) Setup Assistant पूरा करें

VNC विंडो में:

1. भाषा और क्षेत्र चुनें
2. Apple ID छोड़ें (या यदि आप बाद में iMessage चाहते हैं तो साइन इन करें)
3. उपयोगकर्ता खाता बनाएँ (उपयोगकर्ता नाम और पासवर्ड याद रखें)
4. सभी वैकल्पिक सुविधाएँ छोड़ें

सेटअप पूरा होने के बाद:

1. SSH सक्षम करें: System Settings -> General -> Sharing खोलें और "Remote Login" सक्षम करें।
2. हेडलेस VM उपयोग के लिए, ऑटो-लॉगिन सक्षम करें: System Settings -> Users & Groups खोलें, "Automatically log in as:" चुनें, और VM उपयोगकर्ता चुनें।

---

## 4) VM IP पता प्राप्त करें

```bash
lume get openclaw
```

IP पता देखें (आमतौर पर `192.168.64.x`)।

---

## 5) VM में SSH करें

```bash
ssh youruser@192.168.64.X
```

`youruser` को आपके बनाए गए खाते से बदलें, और IP को अपने VM के IP से।

---

## 6) OpenClaw इंस्टॉल करें

VM के अंदर:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

अपने मॉडल प्रदाता (Anthropic, OpenAI, आदि) को सेट अप करने के लिए ऑनबोर्डिंग संकेतों का पालन करें।

---

## 7) channels कॉन्फ़िगर करें

कॉन्फ़िग फ़ाइल संपादित करें:

```bash
nano ~/.openclaw/openclaw.json
```

अपने channels जोड़ें:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

फिर WhatsApp में लॉगिन करें (QR स्कैन करें):

```bash
openclaw channels login
```

---

## 8) VM को हेडलेस चलाएँ

VM रोकें और डिस्प्ले के बिना फिर से शुरू करें:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM बैकग्राउंड में चलता है। OpenClaw का daemon gateway को चलाए रखता है।

स्थिति जाँचने के लिए:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## बोनस: iMessage इंटीग्रेशन

यह macOS पर चलाने की सबसे प्रमुख सुविधा है। OpenClaw में Messages जोड़ने के लिए `imsg` के साथ [iMessage](/hi/channels/imessage) का उपयोग करें।

VM के अंदर:

1. Messages में साइन इन करें।
2. `imsg` इंस्टॉल करें।
3. OpenClaw/`imsg` चलाने वाली प्रक्रिया के लिए Full Disk Access और Automation अनुमति दें।
4. `imsg rpc --help` के साथ RPC समर्थन सत्यापित करें।

अपने OpenClaw कॉन्फ़िग में जोड़ें:

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

gateway पुनः शुरू करें। अब आपका agent iMessages भेज और प्राप्त कर सकता है।

पूरा सेटअप विवरण: [iMessage channel](/hi/channels/imessage)

---

## गोल्डन इमेज सहेजें

आगे कस्टमाइज़ करने से पहले, अपनी साफ़ स्थिति का snapshot लें:

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

---

## 24/7 चलाना

VM को चालू रखने के लिए:

- अपने Mac को प्लग इन रखें
- System Settings → Energy Saver में sleep अक्षम करें
- ज़रूरत पड़ने पर `caffeinate` का उपयोग करें

वास्तव में हमेशा चालू रहने के लिए, समर्पित Mac mini या छोटे VPS पर विचार करें। देखें [VPS होस्टिंग](/hi/vps)।

---

## समस्या निवारण

| समस्या                  | समाधान                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM में SSH नहीं हो पा रहा        | जाँचें कि VM की System Settings में "Remote Login" सक्षम है                            |
| VM IP नहीं दिख रहा        | VM के पूरी तरह boot होने तक प्रतीक्षा करें, फिर `lume get openclaw` चलाएँ                           |
| Lume कमांड नहीं मिली   | अपने PATH में `~/.local/bin` जोड़ें                                                    |
| WhatsApp QR स्कैन नहीं हो रहा | `openclaw channels login` चलाते समय सुनिश्चित करें कि आप VM में लॉग इन हैं (होस्ट में नहीं) |

---

## संबंधित दस्तावेज़

- [VPS होस्टिंग](/hi/vps)
- [Nodes](/hi/nodes)
- [Gateway रिमोट](/hi/gateway/remote)
- [iMessage channel](/hi/channels/imessage)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (उन्नत)
- [Docker Sandboxing](/hi/install/docker) (वैकल्पिक अलगाव तरीका)
