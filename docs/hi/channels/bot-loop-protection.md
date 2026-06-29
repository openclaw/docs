---
read_when:
    - बॉट-लेखित चैनल संदेश कॉन्फ़िगर करना
    - बॉट-से-बॉट लूप सुरक्षा को ट्यून करना
sidebarTitle: Bot loop protection
summary: बॉट-से-बॉट लूप सुरक्षा डिफ़ॉल्ट्स और चैनल ओवरराइड्स
title: बॉट लूप सुरक्षा
x-i18n:
    generated_at: "2026-06-28T22:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# बॉट लूप सुरक्षा

OpenClaw उन चैनलों पर दूसरे बॉट द्वारा लिखे गए संदेश स्वीकार कर सकता है जो `allowBots` का समर्थन करते हैं।
जब वह पथ सक्षम होता है, तो जोड़ी लूप सुरक्षा दो बॉट पहचानों को अनिश्चित काल तक
एक-दूसरे को जवाब देने से रोकती है।

यह गार्ड कोर इनबाउंड उत्तर रनर द्वारा लागू किया जाता है। प्रत्येक समर्थित चैनल
अपने इनबाउंड इवेंट को सामान्य तथ्यों में मैप करता है: खाता या स्कोप, बातचीत id,
भेजने वाले बॉट की id, और प्राप्तकर्ता बॉट की id। फिर कोर दोनों दिशाओं में प्रतिभागी
जोड़ी को ट्रैक करता है, स्लाइडिंग-विंडो बजट लागू करता है, और बजट पार हो जाने के बाद
कूलडाउन के दौरान उस जोड़ी को दबा देता है।

## डिफ़ॉल्ट

जब कोई चैनल बॉट-लिखित संदेशों को डिस्पैच तक पहुंचने देता है, तब जोड़ी लूप सुरक्षा सक्रिय होती है।
बिल्ट-इन डिफ़ॉल्ट हैं:

- `maxEventsPerWindow: 20` - कोई बॉट जोड़ी विंडो के भीतर 20 इवेंट का आदान-प्रदान कर सकती है
- `windowSeconds: 60` - स्लाइडिंग विंडो की लंबाई
- `cooldownSeconds: 60` - जोड़ी द्वारा बजट पार करने के बाद दमन समय

गार्ड सामान्य मानव-लिखित संदेशों, एकल-बॉट डिप्लॉयमेंट,
स्वयं-संदेश फ़िल्टरिंग, या बजट के भीतर रहने वाले एक-बारगी बॉट उत्तरों को प्रभावित नहीं करता।

## साझा डिफ़ॉल्ट कॉन्फ़िगर करें

हर समर्थित चैनल को समान बेसलाइन देने के लिए `channels.defaults.botLoopProtection` को एक बार सेट करें।
चैनल और खाता ओवरराइड अब भी अलग-अलग सतहों को ट्यून कर सकते हैं।

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

`enabled: false` केवल तब सेट करें जब आपकी चैनल नीति जानबूझकर
स्वचालित दमन के बिना बॉट-से-बॉट बातचीत की अनुमति देती हो।

## प्रति चैनल या खाते के लिए ओवरराइड करें

समर्थित चैनल अपनी कॉन्फ़िग को साझा डिफ़ॉल्ट के ऊपर परतबद्ध करते हैं। प्राथमिकता क्रम है:

- `channels.<channel>.<room-or-space>.botLoopProtection`, जब चैनल प्रति-बातचीत ओवरराइड का समर्थन करता है
- `channels.<channel>.accounts.<account>.botLoopProtection`, जब चैनल खातों का समर्थन करता है
- `channels.<channel>.botLoopProtection`, जब चैनल शीर्ष-स्तरीय डिफ़ॉल्ट का समर्थन करता है
- `channels.defaults.botLoopProtection`
- बिल्ट-इन डिफ़ॉल्ट

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## चैनल समर्थन

- Discord: मूल `author.bot` तथ्य, Discord खाते, चैनल, और बॉट जोड़ी द्वारा की किए गए।
- Slack: स्वीकार किए गए बॉट-लिखित संदेशों के लिए मूल `bot_id` तथ्य, Slack खाते, चैनल, और बॉट जोड़ी द्वारा की किए गए।
- Matrix: कॉन्फ़िगर किए गए Matrix बॉट खाते, Matrix खाते, रूम, और कॉन्फ़िगर की गई बॉट जोड़ी द्वारा की किए गए।
- Google Chat: स्वीकार किए गए बॉट-लिखित संदेशों के लिए मूल `sender.type=BOT` तथ्य, खाते, स्पेस, और बॉट जोड़ी द्वारा की किए गए।

वे चैनल जो भरोसेमंद इनबाउंड बॉट पहचान उजागर नहीं करते, अपने
सामान्य स्वयं-संदेश और एक्सेस-नीति फ़िल्टर का उपयोग जारी रखते हैं। उन्हें इस
गार्ड में तब तक ऑप्ट इन नहीं करना चाहिए जब तक वे बॉट जोड़ी में दोनों प्रतिभागियों की पहचान न कर सकें।

Plugin
कार्यान्वयन विवरणों के लिए [SDK रनटाइम](/hi/plugins/sdk-runtime#reusable-runtime-utilities) देखें।
