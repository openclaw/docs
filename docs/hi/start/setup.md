---
read_when:
    - नई मशीन सेट अप करना
    - आप अपने व्यक्तिगत सेटअप को बिगाड़े बिना "नवीनतम + सर्वश्रेष्ठ" चाहते हैं
summary: OpenClaw के लिए उन्नत सेटअप और डेवलपमेंट वर्कफ़्लो
title: सेटअप
x-i18n:
    generated_at: "2026-07-16T17:31:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
यदि आप पहली बार सेटअप कर रहे हैं, तो [शुरू करना](/hi/start/getting-started) से शुरुआत करें।
ऑनबोर्डिंग विवरण के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।
</Note>

## संक्षेप में

आप कितनी बार अपडेट चाहते हैं और क्या Gateway को स्वयं चलाना चाहते हैं, इसके आधार पर सेटअप कार्यप्रवाह चुनें:

- **अनुकूलन रिपॉज़िटरी के बाहर रहता है:** अपना कॉन्फ़िगरेशन और वर्कस्पेस `~/.openclaw/openclaw.json` और `~/.openclaw/workspace/` में रखें, ताकि रिपॉज़िटरी अपडेट उन्हें प्रभावित न करें।
- **स्थिर कार्यप्रवाह (अधिकांश के लिए अनुशंसित):** macOS ऐप इंस्टॉल करें और उसे बंडल किया गया Gateway चलाने दें।
- **अत्याधुनिक कार्यप्रवाह (डेवलपमेंट):** `pnpm gateway:watch` के माध्यम से Gateway स्वयं चलाएँ, फिर macOS ऐप को Local मोड में उससे कनेक्ट होने दें।

## पूर्वापेक्षाएँ (स्रोत से)

- Node 24.15+ अनुशंसित है (Node 22 LTS, वर्तमान में `22.22.3+`, अब भी समर्थित है)
- स्रोत चेकआउट के लिए `pnpm` आवश्यक है। OpenClaw डेवलपमेंट मोड में बंडल किए गए plugins को
  `extensions/*` pnpm वर्कस्पेस पैकेज से लोड करता है, इसलिए रूट `npm install`
  संपूर्ण स्रोत ट्री तैयार नहीं करता।
- Docker (वैकल्पिक; केवल कंटेनर-आधारित सेटअप/e2e के लिए—[Docker](/hi/install/docker) देखें)

## अनुकूलन रणनीति (ताकि अपडेट नुकसान न पहुँचाएँ)

यदि आप "मेरे लिए 100% अनुकूलित" _और_ आसान अपडेट चाहते हैं, तो अपने अनुकूलन यहाँ रखें:

- **कॉन्फ़िगरेशन:** `~/.openclaw/openclaw.json` (JSON/JSON5-जैसा)
- **वर्कस्पेस:** `~/.openclaw/workspace` (skills, प्रॉम्प्ट, स्मृतियाँ; इसे एक निजी git रिपॉज़िटरी बनाएँ)

संपूर्ण ऑनबोर्डिंग विज़ार्ड चलाए बिना, कॉन्फ़िगरेशन/वर्कस्पेस फ़ोल्डर एक बार आरंभ करें:

```bash
openclaw setup --baseline
```

अभी तक वैश्विक इंस्टॉल नहीं किया है? इसके बजाय इसे इस रिपॉज़िटरी से चलाएँ:

```bash
pnpm openclaw setup --baseline
```

(`--baseline` के बिना केवल `openclaw setup`, `openclaw onboard` का उपनाम है और संपूर्ण इंटरैक्टिव विज़ार्ड चलाता है।)

## इस रिपॉज़िटरी से Gateway चलाएँ

`pnpm build` के बाद, आप पैकेज की गई CLI को सीधे चला सकते हैं:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## स्थिर कार्यप्रवाह (पहले macOS ऐप)

1. **OpenClaw.app** (मेनू बार) इंस्टॉल करके लॉन्च करें।
2. ऑनबोर्डिंग/अनुमतियों की जाँच-सूची (TCC प्रॉम्प्ट) पूरी करें।
3. सुनिश्चित करें कि Gateway **Local** है और चल रहा है (ऐप इसका प्रबंधन करता है)।
4. सेवाएँ लिंक करें (उदाहरण: WhatsApp):

```bash
openclaw channels login
```

5. त्वरित जाँच:

```bash
openclaw health
```

यदि आपके बिल्ड में ऑनबोर्डिंग उपलब्ध नहीं है:

- पहले `openclaw setup`, फिर `openclaw channels login` चलाएँ और उसके बाद Gateway को मैन्युअल रूप से शुरू करें (`openclaw gateway`)।

## अत्याधुनिक कार्यप्रवाह (टर्मिनल में Gateway)

लक्ष्य: TypeScript Gateway पर काम करना, हॉट रीलोड पाना और macOS ऐप UI को कनेक्टेड रखना।

### 0) (वैकल्पिक) macOS ऐप को भी स्रोत से चलाएँ

यदि आप macOS ऐप को भी अत्याधुनिक संस्करण पर रखना चाहते हैं:

```bash
./scripts/restart-mac.sh
```

### 1) डेवलपमेंट Gateway शुरू करें

```bash
pnpm install
# केवल पहली बार (या स्थानीय OpenClaw कॉन्फ़िगरेशन/वर्कस्पेस रीसेट करने के बाद)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` नामित tmux सत्र
(`openclaw-gateway-watch-main`) में Gateway वॉच प्रक्रिया शुरू या पुनः शुरू करता है और इंटरैक्टिव
टर्मिनलों से स्वतः कनेक्ट हो जाता है। गैर-इंटरैक्टिव शेल अलग रहते हैं और
`tmux attach -t openclaw-gateway-watch-main` प्रिंट करते हैं; इंटरैक्टिव रन को
अलग रखने के लिए `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` या अग्रभूमि वॉच मोड के लिए
`pnpm gateway:watch:raw` का उपयोग करें। वॉचर कॉन्फ़िगर किए गए/डिफ़ॉल्ट
पोर्ट का नियंत्रण लेने से पहले सक्रिय प्रोफ़ाइल की इंस्टॉल की गई Gateway सेवा
रोक देता है, जिससे सेवा पर्यवेक्षक स्रोत प्रक्रिया को प्रतिस्थापित नहीं कर पाता।
सेवा इंस्टॉल रहती है; वॉच समाप्त करने पर `pnpm openclaw gateway start`
चलाएँ। स्टार्टअप विफल होने के बाद भी tmux पेन उपलब्ध रहता है,
ताकि कोई अन्य टर्मिनल या एजेंट उससे कनेक्ट हो सके या उसके लॉग कैप्चर कर सके। वॉचर
प्रासंगिक स्रोत, कॉन्फ़िगरेशन और बंडल किए गए plugin के मेटाडेटा में बदलाव होने पर रीलोड
करता है। यदि देखा जा रहा Gateway स्टार्टअप के दौरान बंद हो जाता है, तो
`gateway:watch`, `openclaw doctor --fix --non-interactive` को एक बार चलाकर
पुनः प्रयास करता है; केवल डेवलपमेंट वाले उस सुधार चरण को अक्षम करने के लिए
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` सेट करें।
`pnpm gateway:watch`, `dist/control-ui` को दोबारा बिल्ड नहीं करता, इसलिए `ui/` में बदलाव के बाद `pnpm ui:build` फिर से चलाएँ या Control UI विकसित करते समय `pnpm ui:dev` का उपयोग करें।

### 2) macOS ऐप को अपने चल रहे Gateway की ओर निर्देशित करें

**OpenClaw.app** में:

- Connection Mode: **Local**
  ऐप कॉन्फ़िगर किए गए पोर्ट पर चल रहे Gateway से कनेक्ट हो जाएगा।

### 3) सत्यापित करें

- ऐप के भीतर Gateway स्थिति में **"Using existing gateway …"** दिखना चाहिए
- या CLI के माध्यम से:

```bash
openclaw health
```

### सामान्य गलतियाँ

- **गलत पोर्ट:** Gateway WS का डिफ़ॉल्ट `ws://127.0.0.1:18789` है; ऐप और CLI को समान पोर्ट पर रखें।
- **स्थिति कहाँ रहती है:**
  - चैनल/प्रदाता स्थिति: `~/.openclaw/credentials/`
  - मॉडल प्रमाणीकरण प्रोफ़ाइल: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - सत्र और ट्रांसक्रिप्ट: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - लेगेसी/संग्रहित सत्र आर्टिफ़ैक्ट: `~/.openclaw/agents/<agentId>/sessions/`
  - लॉग: `/tmp/openclaw/`

## क्रेडेंशियल भंडारण मानचित्र

प्रमाणीकरण डीबग करते समय या बैकअप की सामग्री तय करते समय इसका उपयोग करें:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram बॉट टोकन**: कॉन्फ़िगरेशन/पर्यावरण या `channels.telegram.tokenFile` (केवल सामान्य फ़ाइल; सिमलिंक अस्वीकार किए जाते हैं)
- **Discord बॉट टोकन**: कॉन्फ़िगरेशन/पर्यावरण या SecretRef (पर्यावरण/फ़ाइल/exec प्रदाता)
- **Slack टोकन**: कॉन्फ़िगरेशन/पर्यावरण (`channels.slack.*`)
- **पेयरिंग अनुमति-सूचियाँ**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (डिफ़ॉल्ट खाता)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (गैर-डिफ़ॉल्ट खाते)
- **मॉडल प्रमाणीकरण प्रोफ़ाइल**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **फ़ाइल-समर्थित सीक्रेट पेलोड (वैकल्पिक)**: `~/.openclaw/secrets.json`
- **लेगेसी OAuth आयात**: `~/.openclaw/credentials/oauth.json`
  अधिक विवरण: [सुरक्षा](/hi/gateway/security#credential-storage-map)।

## अपडेट करना (आपका सेटअप बिगाड़े बिना)

- `~/.openclaw/workspace` और `~/.openclaw/` को "अपनी सामग्री" के रूप में रखें; व्यक्तिगत प्रॉम्प्ट/कॉन्फ़िगरेशन को `openclaw` रिपॉज़िटरी में न रखें।
- स्रोत अपडेट करना: `git pull` + `pnpm install` + `pnpm gateway:watch` का उपयोग जारी रखें।

## Linux (systemd उपयोगकर्ता सेवा)

Linux इंस्टॉल systemd **उपयोगकर्ता** सेवा का उपयोग करते हैं। डिफ़ॉल्ट रूप से, systemd लॉगआउट/निष्क्रियता पर उपयोगकर्ता
सेवाएँ रोक देता है, जिससे Gateway बंद हो जाता है। ऑनबोर्डिंग आपके लिए
लिंगरिंग सक्षम करने का प्रयास करता है (sudo के लिए संकेत मिल सकता है)। यदि यह अब भी बंद है, तो चलाएँ:

```bash
sudo loginctl enable-linger $USER
```

हमेशा चालू रहने वाले या बहु-उपयोगकर्ता सर्वर के लिए, उपयोगकर्ता सेवा के बजाय
**सिस्टम** सेवा पर विचार करें (लिंगरिंग की आवश्यकता नहीं)। systemd संबंधी टिप्पणियों के लिए [Gateway रनबुक](/hi/gateway) देखें।

## संबंधित दस्तावेज़

- [Gateway रनबुक](/hi/gateway) (फ़्लैग, पर्यवेक्षण, पोर्ट)
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) (कॉन्फ़िगरेशन स्कीमा + उदाहरण)
- [Discord](/hi/channels/discord) और [Telegram](/hi/channels/telegram) (उत्तर टैग + replyToMode सेटिंग)
- [OpenClaw सहायक सेटअप](/hi/start/openclaw)
- [macOS ऐप](/hi/platforms/macos) (Gateway जीवनचक्र)
