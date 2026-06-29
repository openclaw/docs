---
read_when:
    - आप OpenClaw को IRC चैनलों या सीधे संदेशों से जोड़ना चाहते हैं
    - आप IRC अनुमति-सूचियाँ, समूह नीति, या उल्लेख गेटिंग कॉन्फ़िगर कर रहे हैं
summary: IRC Plugin सेटअप, एक्सेस नियंत्रण, और समस्या निवारण
title: IRC
x-i18n:
    generated_at: "2026-06-28T22:35:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

जब आप OpenClaw को क्लासिक चैनलों (`#room`) और सीधे संदेशों में चाहते हैं, तब IRC का उपयोग करें।
आधिकारिक IRC Plugin इंस्टॉल करें, फिर उसे `channels.irc` के तहत कॉन्फ़िगर करें।

## त्वरित शुरुआत

1. Plugin इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json` में IRC कॉन्फ़िग सक्षम करें।
3. कम से कम यह सेट करें:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

बॉट समन्वय के लिए निजी IRC सर्वर को प्राथमिकता दें। यदि आप जानबूझकर किसी सार्वजनिक IRC नेटवर्क का उपयोग करते हैं, तो सामान्य विकल्पों में Libera.Chat, OFTC, और Snoonet शामिल हैं। बॉट या स्वार्म बैकचैनल ट्रैफ़िक के लिए अनुमान लगाने योग्य सार्वजनिक चैनलों से बचें।

4. Gateway शुरू/पुनः शुरू करें:

```bash
openclaw gateway run
```

## सुरक्षा डिफ़ॉल्ट

- IRC, OpenClaw ऑपरेटर-प्रबंधित फ़ॉरवर्ड प्रॉक्सी रूटिंग के बाहर कच्चे TCP/TLS सॉकेट का उपयोग करता है। जिन डिप्लॉयमेंट में सभी बाहर जाने वाले ट्रैफ़िक को उस फ़ॉरवर्ड प्रॉक्सी से होकर जाना आवश्यक है, वहाँ `channels.irc.enabled=false` सेट करें, जब तक प्रत्यक्ष IRC बाहर जाने वाले ट्रैफ़िक को स्पष्ट रूप से स्वीकृति न मिली हो।
- `channels.irc.dmPolicy` का डिफ़ॉल्ट `"pairing"` है।
- `channels.irc.groupPolicy` का डिफ़ॉल्ट `"allowlist"` है।
- `groupPolicy="allowlist"` के साथ, अनुमत चैनल परिभाषित करने के लिए `channels.irc.groups` सेट करें।
- जब तक आप जानबूझकर प्लेनटेक्स्ट ट्रांसपोर्ट स्वीकार न करें, TLS (`channels.irc.tls=true`) का उपयोग करें।

## पहुँच नियंत्रण

IRC चैनलों के लिए दो अलग-अलग "गेट" हैं:

1. **चैनल पहुँच** (`groupPolicy` + `groups`): क्या बॉट किसी चैनल से संदेश बिल्कुल स्वीकार करता है।
2. **प्रेषक पहुँच** (`groupAllowFrom` / प्रति-चैनल `groups["#channel"].allowFrom`): उस चैनल के भीतर बॉट को ट्रिगर करने की अनुमति किसे है।

कॉन्फ़िग कुंजियाँ:

- DM अनुमत-सूची (DM प्रेषक पहुँच): `channels.irc.allowFrom`
- समूह प्रेषक अनुमत-सूची (चैनल प्रेषक पहुँच): `channels.irc.groupAllowFrom`
- प्रति-चैनल नियंत्रण (चैनल + प्रेषक + उल्लेख नियम): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` अप्रमाणित चैनलों की अनुमति देता है (**फिर भी डिफ़ॉल्ट रूप से उल्लेख-गेटेड**)

अनुमत-सूची प्रविष्टियों में स्थिर प्रेषक पहचान (`nick!user@host`) का उपयोग करना चाहिए।
सिर्फ़ निक से मिलान बदलने योग्य है और केवल तब सक्षम होता है जब `channels.irc.dangerouslyAllowNameMatching: true` हो।

### सामान्य भूल: `allowFrom` DM के लिए है, चैनलों के लिए नहीं

यदि आपको ऐसे लॉग दिखें:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...तो इसका मतलब है कि प्रेषक को **समूह/चैनल** संदेशों के लिए अनुमति नहीं थी। इसे इनमें से किसी तरीके से ठीक करें:

- `channels.irc.groupAllowFrom` सेट करके (सभी चैनलों के लिए वैश्विक), या
- प्रति-चैनल प्रेषक अनुमत-सूचियाँ सेट करके: `channels.irc.groups["#channel"].allowFrom`

उदाहरण (`#tuirc-dev` में किसी को भी बॉट से बात करने की अनुमति दें):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## उत्तर ट्रिगर करना (उल्लेख)

भले ही कोई चैनल अनुमत हो (`groupPolicy` + `groups` के माध्यम से) और प्रेषक को अनुमति हो, OpenClaw समूह संदर्भों में डिफ़ॉल्ट रूप से **उल्लेख-गेटिंग** करता है।

इसका मतलब है कि जब तक संदेश में बॉट से मेल खाने वाला उल्लेख पैटर्न शामिल न हो, आपको `drop channel … (missing-mention)` जैसे लॉग दिख सकते हैं।

किसी IRC चैनल में बॉट को **उल्लेख की आवश्यकता के बिना** उत्तर देने देने के लिए, उस चैनल के लिए उल्लेख गेटिंग अक्षम करें:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

या **सभी** IRC चैनलों को अनुमति देने के लिए (कोई प्रति-चैनल अनुमत-सूची नहीं) और फिर भी बिना उल्लेखों के उत्तर देने के लिए:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## सुरक्षा नोट (सार्वजनिक चैनलों के लिए अनुशंसित)

यदि आप किसी सार्वजनिक चैनल में `allowFrom: ["*"]` की अनुमति देते हैं, तो कोई भी बॉट को प्रॉम्प्ट कर सकता है।
जोखिम कम करने के लिए, उस चैनल के लिए टूल प्रतिबंधित करें।

### चैनल में सभी के लिए समान टूल

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### प्रति प्रेषक अलग टूल (स्वामी को अधिक शक्ति मिलती है)

`"*"` पर कड़ी नीति और अपने निक पर ढीली नीति लागू करने के लिए `toolsBySender` का उपयोग करें:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

नोट:

- `toolsBySender` कुंजियों को IRC प्रेषक पहचान मानों के लिए `id:` का उपयोग करना चाहिए:
  मज़बूत मिलान के लिए `id:eigen` या `id:eigen!~eigen@174.127.248.171`।
- पुराने बिना-प्रीफ़िक्स वाली कुंजियाँ अभी भी स्वीकार की जाती हैं और केवल `id:` के रूप में मिलाई जाती हैं।
- पहली मेल खाने वाली प्रेषक नीति लागू होती है; `"*"` वाइल्डकार्ड फ़ॉलबैक है।

समूह पहुँच बनाम उल्लेख-गेटिंग (और वे कैसे परस्पर काम करते हैं) के बारे में अधिक जानकारी के लिए देखें: [/channels/groups](/hi/channels/groups).

## NickServ

कनेक्ट होने के बाद NickServ से पहचान कराने के लिए:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

कनेक्ट पर वैकल्पिक एक-बार पंजीकरण:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

बार-बार REGISTER प्रयासों से बचने के लिए निक पंजीकृत हो जाने के बाद `register` अक्षम करें।

## पर्यावरण चर

डिफ़ॉल्ट खाता समर्थन करता है:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (कॉमा-सेपरेटेड)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` को किसी वर्कस्पेस `.env` से सेट नहीं किया जा सकता; देखें [वर्कस्पेस `.env` फ़ाइलें](/hi/gateway/security).

## समस्या निवारण

- यदि बॉट कनेक्ट होता है लेकिन चैनलों में कभी उत्तर नहीं देता, तो `channels.irc.groups` **और** यह सत्यापित करें कि क्या उल्लेख-गेटिंग संदेशों को ड्रॉप कर रही है (`missing-mention`)। यदि आप चाहते हैं कि यह पिंग के बिना उत्तर दे, तो चैनल के लिए `requireMention:false` सेट करें।
- यदि लॉगिन विफल हो, तो निक उपलब्धता और सर्वर पासवर्ड सत्यापित करें।
- यदि कस्टम नेटवर्क पर TLS विफल हो, तो होस्ट/पोर्ट और प्रमाणपत्र सेटअप सत्यापित करें।

## संबंधित

- [चैनल अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — पहुँच मॉडल और हार्डनिंग
