---
read_when:
    - आप qwen-oauth प्रदाता ID कॉन्फ़िगर करना चाहते हैं
    - आपने पहले Qwen Portal OAuth क्रेडेंशियल्स का उपयोग किया था
    - आपको Qwen Portal एंडपॉइंट या माइग्रेशन मार्गदर्शन की आवश्यकता है
summary: OpenClaw के साथ Qwen Portal प्रदाता आईडी का उपयोग करें
title: Qwen OAuth / पोर्टल
x-i18n:
    generated_at: "2026-07-16T17:01:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` Qwen Portal प्रदाता आईडी है, जिसे Qwen Plugin
(`@openclaw/qwen-provider`) द्वारा पंजीकृत किया गया है। यह
`https://portal.qwen.ai/v1` पर स्थित Qwen Portal एंडपॉइंट को लक्षित करता है और पुराने Qwen OAuth / पोर्टल सेटअपों को
प्रामाणिक `qwen` प्रदाता से अलग एक विशिष्ट प्रदाता आईडी के माध्यम से
उपयोग योग्य बनाए रखता है।

यदि आपके पास पहले से कार्यशील Qwen Portal टोकन है, आप किसी पुराने Qwen OAuth या Qwen CLI कार्यप्रवाह को
माइग्रेट कर रहे हैं, या आपको विशेष रूप से Qwen Portal एंडपॉइंट का परीक्षण करना है, तो
`qwen-oauth` चुनें। नए सेटअपों के लिए Standard ModelStudio एंडपॉइंट वाले
[Qwen](/hi/providers/qwen) को प्राथमिकता दें: यह नए
API-कुंजी सेटअपों, एंडपॉइंट के अधिक विकल्पों, Standard उपयोग के अनुसार भुगतान, Coding Plan
और संपूर्ण Qwen Plugin कैटलॉग को समाहित करता है।

## सेटअप

यदि आपने अभी तक Qwen Plugin इंस्टॉल नहीं किया है, तो इसे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

ऑनबोर्डिंग के माध्यम से अपना पोर्टल टोकन प्रदान करें:

```bash
openclaw onboard --auth-choice qwen-oauth
```

गैर-इंटरैक्टिव रन `--qwen-oauth-token <token>` से टोकन पढ़ते हैं, या इसे सेट करें:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: गुप्त अनुमति-सूची
```

ऑनबोर्डिंग टोकन को `qwen-oauth` प्रमाणीकरण प्रोफ़ाइल के अंतर्गत संग्रहीत करती है, पोर्टल
मॉडल कैटलॉग को आरंभिक डेटा से भरती है और कोई मॉडल कॉन्फ़िगर न होने पर
`qwen-oauth/qwen3.5-plus` को डिफ़ॉल्ट मॉडल के रूप में सेट करती है।

## डिफ़ॉल्ट

- प्रदाता: `qwen-oauth`
- उपनाम: `qwen-portal`, `qwen-cli`
- आधार URL: `https://portal.qwen.ai/v1`
- परिवेश चर: `QWEN_API_KEY`
- API शैली: OpenAI-संगत
- डिफ़ॉल्ट मॉडल: `qwen-oauth/qwen3.5-plus`

## यह Qwen से कैसे अलग है

OpenClaw में Qwen के लिए दो प्रदाता आईडी हैं:

| प्रदाता     | एंडपॉइंट परिवार                                          | इनके लिए सर्वोत्तम                                                                               |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope और Coding Plan एंडपॉइंट | नए API-कुंजी सेटअप, Standard उपयोग के अनुसार भुगतान, Coding Plan, मल्टीमोडल DashScope सुविधाएँ |
| `qwen-oauth` | `portal.qwen.ai/v1` पर Qwen Portal एंडपॉइंट              | मौजूदा Qwen Portal टोकन और पुराने Qwen OAuth / CLI सेटअप                         |

दोनों प्रदाता OpenAI-संगत अनुरोध संरचनाओं का उपयोग करते हैं, लेकिन उनकी प्रमाणीकरण
सतहें अलग हैं। `qwen-oauth` के लिए संग्रहीत टोकन को DashScope
या ModelStudio कुंजी नहीं माना जाना चाहिए और नई DashScope कुंजी के लिए इसके बजाय प्रामाणिक
`qwen` प्रदाता का उपयोग किया जाना चाहिए।

## मॉडल

Qwen Plugin, Qwen Portal एंडपॉइंट के लिए इस स्थिर कैटलॉग को आरंभिक डेटा से भरता है। सभी
प्रविष्टियाँ अधिकतम 65,536-टोकन आउटपुट का उपयोग करती हैं; उपलब्धता वर्तमान Qwen
Portal खाते और टोकन पर निर्भर करती है।

| मॉडल संदर्भ                         | इनपुट       | संदर्भ   | टिप्पणियाँ         |
| --------------------------------- | ----------- | --------- | ------------- |
| `qwen-oauth/qwen3.5-plus`         | टेक्स्ट, इमेज | 1,000,000 | डिफ़ॉल्ट मॉडल |
| `qwen-oauth/qwen3.6-plus`         | टेक्स्ट, इमेज | 1,000,000 |               |
| `qwen-oauth/qwen3-max-2026-01-23` | टेक्स्ट        | 262,144   |               |
| `qwen-oauth/qwen3-coder-next`     | टेक्स्ट        | 262,144   |               |
| `qwen-oauth/qwen3-coder-plus`     | टेक्स्ट        | 1,000,000 |               |
| `qwen-oauth/MiniMax-M2.5`         | टेक्स्ट        | 1,000,000 | तर्क-विचार     |
| `qwen-oauth/glm-5`                | टेक्स्ट        | 202,752   |               |
| `qwen-oauth/glm-4.7`              | टेक्स्ट        | 202,752   |               |
| `qwen-oauth/kimi-k2.5`            | टेक्स्ट, इमेज | 262,144   |               |

यदि आपका खाता इसके बजाय ModelStudio / DashScope API कुंजियों का उपयोग करता है, तो
प्रामाणिक `qwen` प्रदाता कॉन्फ़िगर करें:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## माइग्रेशन

पुरानी Qwen Portal OAuth प्रोफ़ाइलें रीफ़्रेश नहीं की जा सकतीं; `openclaw doctor` उन्हें
चिह्नित करता है। यदि कोई पोर्टल प्रोफ़ाइल काम करना बंद कर देती है, तो मौजूदा टोकन के साथ
ऑनबोर्डिंग फिर से चलाएँ या Standard Qwen प्रदाता पर स्विच करें:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard वैश्विक ModelStudio इसका उपयोग करता है:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## समस्या निवारण

- पोर्टल OAuth रीफ़्रेश विफलताएँ: पुरानी Qwen Portal OAuth प्रोफ़ाइलें
  रीफ़्रेश नहीं की जा सकतीं। मौजूदा टोकन के साथ ऑनबोर्डिंग फिर से चलाएँ।
- गलत एंडपॉइंट त्रुटियाँ: पोर्टल टोकन का उपयोग करते समय पुष्टि करें कि मॉडल संदर्भ
  `qwen-oauth/` से शुरू होता है। केवल प्रामाणिक Qwen प्रदाता के लिए `qwen/` संदर्भों का उपयोग करें।
- `QWEN_API_KEY` संबंधी भ्रम: Qwen के दोनों पृष्ठ इस परिवेश चर का उल्लेख करते हैं, लेकिन ऑनबोर्डिंग
  चयनित प्रदाता आईडी के अंतर्गत क्रेडेंशियल संग्रहीत करती है। जब आप एक ही मशीन पर
  `qwen` और `qwen-oauth` दोनों उपलब्ध रखते हैं, तो ऑनबोर्डिंग को प्राथमिकता दें।

## संबंधित

- [Qwen](/hi/providers/qwen)
- [Alibaba Model Studio](/hi/providers/alibaba)
- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [सभी प्रदाता](/hi/providers/index)
