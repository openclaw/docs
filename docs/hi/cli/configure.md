---
read_when:
    - आप credentials, devices, या agent defaults को इंटरैक्टिव रूप से बदलना चाहते हैं
summary: '`openclaw configure` के लिए CLI संदर्भ (इंटरैक्टिव कॉन्फ़िगरेशन प्रॉम्प्ट)'
title: कॉन्फ़िगर करें
x-i18n:
    generated_at: "2026-06-30T22:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

मौजूदा सेटअप में लक्षित बदलावों के लिए इंटरैक्टिव प्रॉम्प्ट: क्रेडेंशियल, डिवाइस, एजेंट डिफॉल्ट, Gateway, चैनल, Plugin, Skills, और स्वास्थ्य जांच।

पूरी निर्देशित पहली-बार चलाने की यात्रा के लिए `openclaw onboard` या `openclaw setup` का उपयोग करें, केवल बेसलाइन कॉन्फिग/वर्कस्पेस के लिए `openclaw setup --baseline` का, और जब आपको केवल चैनल अकाउंट सेटअप चाहिए तो `openclaw channels add` का।

<Note>
**मॉडल** सेक्शन में `agents.defaults.models` अलाउलिस्ट के लिए मल्टी-सिलेक्ट शामिल है (जो `/model` और मॉडल पिकर में दिखता है)। प्रदाता-स्कोप वाले सेटअप विकल्प अपने चुने गए मॉडलों को मौजूदा अलाउलिस्ट में मर्ज करते हैं, कॉन्फिग में पहले से मौजूद असंबंधित प्रदाताओं को बदलते नहीं हैं।

configure से प्रदाता auth फिर से चलाने पर मौजूदा `agents.defaults.model.primary` सुरक्षित रहता है, भले ही प्रदाता का auth चरण अपने सुझाए गए डिफॉल्ट मॉडल के साथ कॉन्फिग पैच लौटाए। इसका मतलब है कि xAI, OpenRouter, या कोई दूसरा प्रदाता जोड़ने या फिर से auth करने से नया मॉडल उपलब्ध हो जाना चाहिए, बिना आपके मौजूदा प्राथमिक मॉडल को अपने नियंत्रण में लिए। जब आप जानबूझकर डिफॉल्ट मॉडल बदलना चाहते हों, तब `openclaw models auth login --provider <id> --set-default` या `openclaw models set <model>` का उपयोग करें।
</Note>

जब configure किसी प्रदाता auth विकल्प से शुरू होता है, तो डिफॉल्ट-मॉडल और अलाउलिस्ट पिकर अपने-आप उस प्रदाता को प्राथमिकता देते हैं। Volcengine और BytePlus जैसे जोड़ीदार प्रदाताओं के लिए, वही प्राथमिकता उनके coding-plan वैरिएंट (`volcengine-plan/*`, `byteplus-plan/*`) से भी मेल खाती है। अगर preferred-provider फ़िल्टर खाली सूची देगा, तो configure खाली पिकर दिखाने के बजाय अनफ़िल्टर्ड कैटलॉग पर वापस चला जाता है।

<Tip>
बिना सबकमांड के `openclaw config` वही विज़ार्ड खोलता है। नॉन-इंटरैक्टिव संपादनों के लिए `openclaw config get|set|unset` का उपयोग करें।
</Tip>

वेब खोज के लिए, `openclaw configure --section web` आपको प्रदाता चुनने
और उसके क्रेडेंशियल कॉन्फिगर करने देता है। कुछ प्रदाता प्रदाता-विशिष्ट
फ़ॉलो-अप प्रॉम्प्ट भी दिखाते हैं:

- **Grok** उसी xAI OAuth प्रोफ़ाइल
  या API कुंजी के साथ वैकल्पिक `x_search` सेटअप दे सकता है और आपको `x_search` मॉडल चुनने दे सकता है।
- **Kimi** Moonshot API क्षेत्र (`api.moonshot.ai` बनाम
  `api.moonshot.cn`) और डिफॉल्ट Kimi वेब-खोज मॉडल पूछ सकता है।

संबंधित:

- Gateway कॉन्फिगरेशन संदर्भ: [कॉन्फिगरेशन](/hi/gateway/configuration)
- कॉन्फिग CLI: [कॉन्फिग](/hi/cli/config)

## विकल्प

- `--section <section>`: दोहराया जा सकने वाला सेक्शन फ़िल्टर

उपलब्ध सेक्शन:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

नोट्स:

- पूरा विज़ार्ड और Gateway-संबंधित सेक्शन पूछते हैं कि Gateway कहाँ चलता है और `gateway.mode` को अपडेट करते हैं। ऐसे सेक्शन फ़िल्टर जिनमें `gateway`, `daemon`, या `health` शामिल नहीं हैं, सीधे अनुरोधित सेटअप पर जाते हैं।
- स्थानीय कॉन्फिग लिखने के बाद, configure चुने गए डाउनलोड योग्य Plugin इंस्टॉल करता है जब चुने गए सेटअप पथ को उनकी आवश्यकता होती है। रिमोट Gateway कॉन्फिग स्थानीय Plugin पैकेज इंस्टॉल नहीं करता।
- चैनल-उन्मुख सेवाएं (Slack/Discord/Matrix/Microsoft Teams) सेटअप के दौरान चैनल/रूम अलाउलिस्ट के लिए प्रॉम्प्ट करती हैं। आप नाम या ID दर्ज कर सकते हैं; संभव होने पर विज़ार्ड नामों को ID में रिज़ॉल्व करता है।
- अगर आप daemon इंस्टॉल चरण चलाते हैं, टोकन auth को टोकन चाहिए, और `gateway.auth.token` SecretRef-प्रबंधित है, तो configure SecretRef को वैलिडेट करता है लेकिन रिज़ॉल्व किए गए प्लेनटेक्स्ट टोकन मानों को supervisor सेवा एनवायरनमेंट मेटाडेटा में स्थायी नहीं करता।
- अगर टोकन auth को टोकन चाहिए और कॉन्फिगर किया गया टोकन SecretRef अनरिज़ॉल्व्ड है, तो configure कार्रवाई योग्य सुधार मार्गदर्शन के साथ daemon इंस्टॉल को ब्लॉक करता है।
- अगर `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फिगर किए गए हैं और `gateway.auth.mode` अनसेट है, तो configure daemon इंस्टॉल को तब तक ब्लॉक करता है जब तक mode स्पष्ट रूप से सेट न हो।

## उदाहरण

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [कॉन्फिगरेशन](/hi/gateway/configuration)
