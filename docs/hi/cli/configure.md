---
read_when:
    - आप प्रमाण-पत्रों, उपकरणों या एजेंट के डिफ़ॉल्ट को इंटरैक्टिव तरीके से बदलना चाहते हैं
summary: '`openclaw configure` के लिए CLI संदर्भ (इंटरैक्टिव कॉन्फ़िगरेशन प्रॉम्प्ट)'
title: कॉन्फ़िगर करें
x-i18n:
    generated_at: "2026-06-28T22:47:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

किसी मौजूदा सेटअप में लक्षित बदलावों के लिए इंटरैक्टिव प्रॉम्प्ट: क्रेडेंशियल, डिवाइस, एजेंट डिफ़ॉल्ट, Gateway, चैनल, plugins, skills, और स्वास्थ्य जांच।

पूरी निर्देशित पहली बार चलाने की यात्रा के लिए `openclaw onboard`, केवल बेसलाइन कॉन्फ़िग/वर्कस्पेस के लिए `openclaw setup`, और जब आपको केवल चैनल खाते का सेटअप चाहिए तब `openclaw channels add` का उपयोग करें।

<Note>
**मॉडल** अनुभाग में `agents.defaults.models` allowlist के लिए एक मल्टी-सिलेक्ट शामिल है (जो `/model` और मॉडल पिकर में दिखाई देता है)। प्रदाता-स्कोप सेटअप विकल्प अपने चुने हुए मॉडलों को मौजूदा allowlist में मर्ज करते हैं, कॉन्फ़िग में पहले से मौजूद असंबंधित प्रदाताओं को बदलते नहीं हैं।

configure से प्रदाता auth दोबारा चलाने पर मौजूदा `agents.defaults.model.primary` सुरक्षित रहता है, भले ही प्रदाता का auth चरण अपने अनुशंसित डिफ़ॉल्ट मॉडल के साथ कॉन्फ़िग पैच लौटाए। इसका मतलब है कि xAI, OpenRouter, या कोई अन्य प्रदाता जोड़ने या फिर से auth करने पर नया मॉडल उपलब्ध होना चाहिए, बिना आपके मौजूदा प्राथमिक मॉडल को अपने कब्ज़े में लिए। जब आप जानबूझकर डिफ़ॉल्ट मॉडल बदलना चाहते हों, तब `openclaw models auth login --provider <id> --set-default` या `openclaw models set <model>` का उपयोग करें।
</Note>

जब configure किसी प्रदाता auth विकल्प से शुरू होता है, तो डिफ़ॉल्ट-मॉडल और allowlist पिकर उस प्रदाता को अपने आप प्राथमिकता देते हैं। Volcengine और BytePlus जैसे जोड़ीदार प्रदाताओं के लिए, यही प्राथमिकता उनके coding-plan वैरिएंट (`volcengine-plan/*`, `byteplus-plan/*`) से भी मेल खाती है। अगर पसंदीदा-प्रदाता फ़िल्टर से खाली सूची बनती है, तो configure खाली पिकर दिखाने के बजाय अनफ़िल्टर्ड कैटलॉग पर वापस चला जाता है।

<Tip>
बिना subcommand के `openclaw config` वही विज़ार्ड खोलता है। गैर-इंटरैक्टिव संपादनों के लिए `openclaw config get|set|unset` का उपयोग करें।
</Tip>

वेब खोज के लिए, `openclaw configure --section web` आपको एक प्रदाता चुनने
और उसके क्रेडेंशियल कॉन्फ़िगर करने देता है। कुछ प्रदाता प्रदाता-विशिष्ट
फ़ॉलो-अप प्रॉम्प्ट भी दिखाते हैं:

- **Grok** उसी xAI OAuth प्रोफ़ाइल या API key के साथ वैकल्पिक `x_search` सेटअप
  पेश कर सकता है और आपको एक `x_search` मॉडल चुनने दे सकता है।
- **Kimi** Moonshot API क्षेत्र (`api.moonshot.ai` बनाम
  `api.moonshot.cn`) और डिफ़ॉल्ट Kimi वेब-खोज मॉडल के लिए पूछ सकता है।

संबंधित:

- Gateway कॉन्फ़िगरेशन संदर्भ: [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- कॉन्फ़िग CLI: [कॉन्फ़िग](/hi/cli/config)

## विकल्प

- `--section <section>`: दोहराया जा सकने वाला अनुभाग फ़िल्टर

उपलब्ध अनुभाग:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

टिप्पणियां:

- पूरा विज़ार्ड और gateway-संबंधित अनुभाग पूछते हैं कि Gateway कहां चलता है और `gateway.mode` अपडेट करते हैं। ऐसे अनुभाग फ़िल्टर जिनमें `gateway`, `daemon`, या `health` शामिल नहीं हैं, सीधे अनुरोधित सेटअप पर जाते हैं।
- स्थानीय कॉन्फ़िग लिखने के बाद, configure चुने हुए डाउनलोड करने योग्य plugins इंस्टॉल करता है जब चयनित सेटअप पथ को उनकी आवश्यकता होती है। रिमोट gateway कॉन्फ़िग स्थानीय plugin पैकेज इंस्टॉल नहीं करता।
- चैनल-उन्मुख सेवाएं (Slack/Discord/Matrix/Microsoft Teams) सेटअप के दौरान चैनल/रूम allowlists के लिए प्रॉम्प्ट करती हैं। आप नाम या IDs दर्ज कर सकते हैं; विज़ार्ड जहां संभव हो, नामों को IDs में resolve करता है।
- अगर आप daemon इंस्टॉल चरण चलाते हैं, token auth को token चाहिए, और `gateway.auth.token` SecretRef-प्रबंधित है, तो configure SecretRef को validate करता है लेकिन resolved plaintext token values को supervisor service environment metadata में persist नहीं करता।
- अगर token auth को token चाहिए और कॉन्फ़िगर किया गया token SecretRef unresolved है, तो configure actionable remediation guidance के साथ daemon install को block करता है।
- अगर `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं और `gateway.auth.mode` unset है, तो configure mode को स्पष्ट रूप से set किए जाने तक daemon install को block करता है।

## उदाहरण

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
