---
read_when:
    - आप OpenClaw के साथ Qwen का उपयोग करना चाहते हैं
    - आपके पास Alibaba Cloud Token Plan की सदस्यता है
summary: इसके OpenClaw plugin के माध्यम से Qwen Cloud का उपयोग करें
title: Qwen
x-i18n:
    generated_at: "2026-07-19T09:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74f94a35631dcdf8c9afc12e86d7a9d6b51a359411ba36f8820f8b1e7c03a27a
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud एक आधिकारिक बाहरी OpenClaw प्रदाता Plugin है, जिसकी कैननिकल id `qwen` है। यह Qwen Cloud / Alibaba DashScope Standard और Coding Plan एंडपॉइंट को लक्षित करता है, Token Plan को `qwen-token-plan` के रूप में उपलब्ध कराता है, `modelstudio` को संगतता उपनाम के रूप में बनाए रखता है, और Alibaba की प्रलेखित `bailian-token-plan` कस्टम-प्रदाता id का स्वतंत्र रूप से स्वामी है।

| गुण                    | मान                                        |
| ---------------------- | ------------------------------------------ |
| प्रदाता                | `qwen`                                     |
| Token Plan प्रदाता     | `qwen-token-plan`                          |
| पसंदीदा env var        | `QWEN_API_KEY`                             |
| Token Plan env var     | `QWEN_TOKEN_PLAN_API_KEY`                  |
| ये भी स्वीकार्य (संगतता) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API शैली               | OpenAI-संगत                               |

<Tip>
`qwen3.7-plus` और `qwen3.6-plus` Coding Plan तथा Standard एंडपॉइंट के साथ काम करते हैं।
`qwen3.7-max` या `qwen3.6-flash` के लिए, **Standard (उपयोग के अनुसार भुगतान)** एंडपॉइंट का उपयोग करें।
</Tip>

## Plugin इंस्टॉल करें

`qwen` एक आधिकारिक बाहरी Plugin के रूप में उपलब्ध होता है, यह कोर के साथ बंडल नहीं होता। इसे इंस्टॉल करें और Gateway को पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## शुरुआत करना

अपने प्लान का प्रकार चुनें और सेटअप चरणों का पालन करें।

<Tabs>
  <Tab title="Coding Plan (सदस्यता)">
    **इनके लिए सर्वोत्तम:** Qwen Coding Plan के माध्यम से सदस्यता-आधारित पहुँच।

    <Steps>
      <Step title="अपनी API कुंजी प्राप्त करें">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) से API कुंजी बनाएँ या कॉपी करें।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        **Global** एंडपॉइंट के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** एंडपॉइंट के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    पुराने `modelstudio-*` auth-choice id और `modelstudio/...` मॉडल रेफ़ अब भी
    संगतता उपनामों के रूप में काम करते हैं, लेकिन नए सेटअप प्रवाहों में कैननिकल
    `qwen-*` auth-choice id और `qwen/...` मॉडल रेफ़ को प्राथमिकता देनी चाहिए। यदि आप किसी अन्य `api` मान के साथ सटीक
    कस्टम `models.providers.modelstudio` प्रविष्टि परिभाषित करते हैं, तो Qwen संगतता
    उपनाम के बजाय वह कस्टम प्रदाता `modelstudio/...` रेफ़ का स्वामी होता है।
    </Note>

  </Tab>

  <Tab title="Standard (उपयोग के अनुसार भुगतान)">
    **इनके लिए सर्वोत्तम:** Standard Model Studio एंडपॉइंट के माध्यम से उपयोग के अनुसार भुगतान वाली पहुँच, जिसमें `qwen3.7-max` और `qwen3.6-flash` शामिल हैं, जो Coding Plan पर उपलब्ध नहीं हैं।

    <Steps>
      <Step title="अपनी API कुंजी प्राप्त करें">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) से API कुंजी बनाएँ या कॉपी करें।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        **Global** एंडपॉइंट के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** एंडपॉइंट के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    पुराने `modelstudio-*` auth-choice id और `modelstudio/...` मॉडल रेफ़ अब भी
    संगतता उपनामों के रूप में काम करते हैं, लेकिन नए सेटअप प्रवाहों में कैननिकल
    `qwen-*` auth-choice id और `qwen/...` मॉडल रेफ़ को प्राथमिकता देनी चाहिए। यदि आप किसी अन्य `api` मान के साथ सटीक
    कस्टम `models.providers.modelstudio` प्रविष्टि परिभाषित करते हैं, तो Qwen संगतता
    उपनाम के बजाय वह कस्टम प्रदाता `modelstudio/...` रेफ़ का स्वामी होता है।
    </Note>

  </Tab>

  <Tab title="Token Plan (टीम संस्करण)">
    **इनके लिए सर्वोत्तम:** Alibaba Cloud Model Studio के माध्यम से Qwen और समर्थित तृतीय-पक्ष मॉडल तक क्रेडिट-आधारित टीम सदस्यता पहुँच।

    <Steps>
      <Step title="अपनी समर्पित कुंजी प्राप्त करें">
        Token Plan सीट आवंटित करें और उसकी समर्पित `sk-sp-...` कुंजी बनाएँ। Token Plan, Coding Plan और उपयोग के अनुसार भुगतान वाली कुंजियाँ परस्पर विनिमेय नहीं हैं। [Global Token Plan अवलोकन](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) या [China Token Plan अवलोकन](https://help.aliyun.com/zh/model-studio/token-plan-overview) देखें।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        सिंगापुर में **Global / International** एंडपॉइंट के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        बीजिंग में **China** एंडपॉइंट के लिए:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="प्रदाता सत्यापित करें">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "उत्तर दें: टोकन प्लान तैयार है"
        ```
      </Step>
    </Steps>

    <Note>
    Alibaba की OpenClaw मार्गदर्शिका मैन्युअल कस्टम
    प्रदाता के लिए `bailian-token-plan` का उपयोग करती है। Plugin उस id को संगतता स्वामी के रूप में पंजीकृत करता है, लेकिन नए
    कॉन्फ़िग में `qwen-token-plan` का उपयोग होना चाहिए। सटीक कस्टम
    `models.providers.bailian-token-plan` प्रविष्टि अपने कॉन्फ़िगर किए गए
    ट्रांसपोर्ट और कैटलॉग का स्वामित्व बनाए रखती है; इसे कभी भी कैननिकल OpenAI कैटलॉग में मर्ज नहीं किया जाता।
    </Note>

    <Warning>
    Token Plan का उपयोग केवल इंटरैक्टिव OpenClaw सत्रों के लिए करें। इसे
    Cron जॉब, बिना निगरानी वाली स्क्रिप्ट या एप्लिकेशन बैकएंड के लिए न चुनें। Alibaba के अनुसार,
    गैर-इंटरैक्टिव उपयोग से सदस्यता निलंबित हो सकती है या उसकी API कुंजी रद्द की जा सकती है।
    </Warning>

  </Tab>

</Tabs>

## प्लान के प्रकार और एंडपॉइंट

| प्लान                      | क्षेत्र | प्रमाणीकरण विकल्प          | एंडपॉइंट                                                         |
| -------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (सदस्यता)      | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (सदस्यता)      | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Standard (उपयोग के अनुसार भुगतान) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (उपयोग के अनुसार भुगतान) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (टीम संस्करण)   | China  | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (टीम संस्करण)   | Global | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

प्रदाता आपके प्रमाणीकरण विकल्प के आधार पर एंडपॉइंट अपने आप चुनता है। कैननिकल
विकल्प `qwen-*` परिवार का उपयोग करते हैं; `modelstudio-*` केवल संगतता के लिए बना हुआ है।
कॉन्फ़िग में कस्टम `baseUrl` से इसे ओवरराइड करें।

<Tip>
**कुंजियाँ प्रबंधित करें:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**दस्तावेज़:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## अंतर्निहित कैटलॉग

OpenClaw इस स्थिर Qwen कैटलॉग के साथ आता है। कैटलॉग एंडपॉइंट-संवेदी है: Coding
Plan कॉन्फ़िग उन मॉडलों को छोड़ देते हैं जो केवल Standard एंडपॉइंट पर काम करते हैं।

| मॉडल रेफ़                  | इनपुट      | कॉन्टेक्स्ट | टिप्पणियाँ              |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | टेक्स्ट, इमेज | 1,000,000 | डिफ़ॉल्ट मॉडल           |
| `qwen/qwen3.6-flash`        | टेक्स्ट, इमेज | 1,000,000 | केवल Standard एंडपॉइंट |
| `qwen/qwen3.6-plus`         | टेक्स्ट, इमेज | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3.7-max`          | टेक्स्ट     | 1,000,000 | केवल Standard एंडपॉइंट |
| `qwen/qwen3.7-plus`         | टेक्स्ट, इमेज | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3-max-2026-01-23` | टेक्स्ट     | 262,144   | Qwen Max शृंखला         |
| `qwen/qwen3-coder-next`     | टेक्स्ट     | 262,144   | कोडिंग                  |
| `qwen/qwen3-coder-plus`     | टेक्स्ट     | 1,000,000 | कोडिंग                  |
| `qwen/MiniMax-M2.5`         | टेक्स्ट     | 1,000,000 | रीजनिंग सक्षम           |
| `qwen/glm-5`                | टेक्स्ट     | 202,752   | GLM                     |
| `qwen/glm-4.7`              | टेक्स्ट     | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | टेक्स्ट, इमेज | 262,144   | Alibaba के माध्यम से Moonshot AI |

<Note>
स्थिर कैटलॉग में मॉडल मौजूद होने पर भी उपलब्धता एंडपॉइंट और बिलिंग प्लान के अनुसार
अलग-अलग हो सकती है।
</Note>

### Token Plan कैटलॉग

Token Plan एक अलग सटीक-स्ट्रिंग अनुमति-सूची का उपयोग करता है। केवल इमेज जनरेशन वाले प्लान
मॉडल यहाँ शामिल नहीं हैं क्योंकि वे अलग API का उपयोग करते हैं।

| मॉडल रेफ़                          | इनपुट      | कॉन्टेक्स्ट |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | टेक्स्ट     | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | टेक्स्ट, इमेज | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | टेक्स्ट, इमेज | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | टेक्स्ट, इमेज | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | टेक्स्ट     | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | टेक्स्ट     | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | टेक्स्ट     | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | टेक्स्ट, इमेज | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | टेक्स्ट, इमेज | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | टेक्स्ट, इमेज | 262,144   |
| `qwen-token-plan/glm-5.2`           | टेक्स्ट     | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | टेक्स्ट     | 202,752   |
| `qwen-token-plan/glm-5`             | टेक्स्ट     | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | टेक्स्ट     | 196,608   |

## थिंकिंग नियंत्रण

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash`, और `qwen3.6-plus`
अंतर्निहित कैटलॉग में रीजनिंग-सक्षम हैं। `qwen`
परिवार के रीजनिंग मॉडलों के लिए, प्रदाता OpenClaw के थिंकिंग स्तरों को DashScope के शीर्ष-स्तरीय
`enable_thinking` अनुरोध फ़्लैग से मैप करता है: अक्षम थिंकिंग में `enable_thinking: false`
भेजा जाता है, जबकि किसी अन्य स्तर पर `enable_thinking: true` भेजा जाता है। कस्टम मॉडल, मॉडल प्रविष्टि पर
`compat.thinkingFormat: "qwen-chat-template"` सेट करके वैकल्पिक चैट-टेम्पलेट थिंकिंग पेलोड अपना सकते हैं।

Token Plan मॉडल भी रीजनिंग-सक्षम चिह्नित हैं। `kimi-k2.7-code` और
`MiniMax-M2.5` केवल थिंकिंग वाले हैं, इसलिए सत्र द्वारा `/think off` का अनुरोध किए जाने पर भी
OpenClaw थिंकिंग को सक्षम रखता है। DeepSeek V4, `minimal` से `high` तक को
सेवा के `high` प्रयास से मैप करता है और `xhigh` या `max` को `max` से मैप करता है। GLM 5.2,
`minimal` से `max` तक की पूरी सीमा स्वीकार करता है; GLM 5.1 और GLM 5
`xhigh` तक स्वीकार करते हैं, और तीनों का डिफ़ॉल्ट `high` है। अन्य हाइब्रिड मॉडल अनुरोधित
चालू/बंद स्थिति का पालन करते हैं।

## मल्टीमोडल ऐड-ऑन

`qwen` Plugin मल्टीमोडल क्षमताएँ केवल **Standard** DashScope
एंडपॉइंट पर उपलब्ध कराता है, Coding Plan एंडपॉइंट पर नहीं:

- **इमेज और वीडियो की समझ** `qwen3.6-plus` के माध्यम से
- **Wan वीडियो जनरेशन** `wan2.6-t2v` (डिफ़ॉल्ट), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` के माध्यम से

मीडिया की समझ कॉन्फ़िगर किए गए Qwen प्रमाणीकरण से अपने आप निर्धारित होती है; किसी अतिरिक्त
कॉन्फ़िग की आवश्यकता नहीं है। मीडिया की समझ के काम करने के लिए सुनिश्चित करें कि आप Standard (उपयोग के अनुसार भुगतान) एंडपॉइंट पर हैं।

Qwen को डिफ़ॉल्ट वीडियो प्रदाता बनाने के लिए:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

वीडियो जनरेशन की सीमाएँ: प्रति अनुरोध 1 आउटपुट वीडियो, अधिकतम 1 इनपुट इमेज
(इमेज-से-वीडियो), अधिकतम 4 इनपुट वीडियो (वीडियो-से-वीडियो), अधिकतम 10 सेकंड की
अवधि। `size`, `aspectRatio`, `resolution`, `audio`, और
`watermark` समर्थित हैं। संदर्भ इमेज/वीडियो इनपुट के लिए दूरस्थ http(s) URL आवश्यक हैं; स्थानीय
फ़ाइल पथ पहले ही अस्वीकार कर दिए जाते हैं, क्योंकि DashScope वीडियो एंडपॉइंट उन संदर्भों के लिए
अपलोड किए गए स्थानीय बफ़र स्वीकार नहीं करता।

<Note>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Qwen 3.6 और 3.7 की उपलब्धता">
    `qwen3.7-plus` और `qwen3.6-plus` Coding Plan तथा Standard एंडपॉइंट पर उपलब्ध हैं। `qwen3.7-max` और `qwen3.6-flash` केवल Standard पर उपलब्ध हैं। Standard (उपयोग के अनुसार भुगतान) एंडपॉइंट ये हैं:

    - चीन: `dashscope.aliyuncs.com/compatible-mode/v1`
    - वैश्विक: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw, Coding Plan कैटलॉग से `qwen3.7-max` और `qwen3.6-flash` को छोड़ देता है।
    यदि कोई Coding Plan एंडपॉइंट इनमें से किसी के लिए "unsupported model" त्रुटि लौटाता है,
    तो संबंधित Standard एंडपॉइंट और कुंजी पर स्विच करें।

  </Accordion>

  <Accordion title="वीडियो जनरेशन क्षेत्र रूटिंग">
    OpenClaw, वीडियो जॉब सबमिट करने से पहले कॉन्फ़िगर किए गए Qwen क्षेत्र को
    संबंधित DashScope AIGC होस्ट से मैप करता है:

    - वैश्विक/अंतरराष्ट्रीय: `https://dashscope-intl.aliyuncs.com`
    - चीन: `https://dashscope.aliyuncs.com`

    Coding Plan या Standard Qwen होस्ट में से किसी की ओर इंगित करने वाला सामान्य
    `models.providers.qwen.baseUrl` भी वीडियो जनरेशन को संबंधित
    क्षेत्रीय DashScope वीडियो एंडपॉइंट पर रूट करता है।

  </Accordion>

  <Accordion title="स्ट्रीमिंग उपयोग संगतता">
    मूल Qwen एंडपॉइंट साझा `openai-completions` ट्रांसपोर्ट पर स्ट्रीमिंग उपयोग संगतता
    घोषित करते हैं, इसलिए उन्हीं मूल होस्ट को लक्षित करने वाली DashScope-संगत कस्टम प्रदाता आईडी,
    विशेष रूप से अंतर्निहित `qwen` प्रदाता आईडी की आवश्यकता के बिना,
    समान व्यवहार प्राप्त करती हैं। यह Coding Plan, Standard और Token Plan एंडपॉइंट पर लागू होता है:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="क्षमता योजना">
    `qwen` Plugin को केवल कोडिंग/टेक्स्ट मॉडल के लिए नहीं, बल्कि संपूर्ण Qwen
    Cloud सतह के विक्रेता केंद्र के रूप में स्थापित किया जा रहा है।

    - **टेक्स्ट/चैट मॉडल:** Plugin के माध्यम से उपलब्ध
    - **टूल कॉलिंग, संरचित आउटपुट, चिंतन:** OpenAI-संगत ट्रांसपोर्ट से प्राप्त
    - **इमेज जनरेशन:** प्रदाता-Plugin परत पर नियोजित
    - **इमेज/वीडियो की समझ:** Standard एंडपॉइंट पर Plugin के माध्यम से उपलब्ध
    - **वाक्/ऑडियो:** प्रदाता-Plugin परत पर नियोजित
    - **मेमोरी एम्बेडिंग/पुनःरैंकिंग:** एम्बेडिंग अडैप्टर सतह के माध्यम से नियोजित
    - **वीडियो जनरेशन:** साझा वीडियो-जनरेशन क्षमता के माध्यम से Plugin में उपलब्ध

  </Accordion>

  <Accordion title="परिवेश और डेमन सेटअप">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि
    `QWEN_API_KEY` या `QWEN_TOKEN_PLAN_API_KEY` उस प्रक्रिया के लिए उपलब्ध हो (उदाहरण के लिए,
    `~/.openclaw/.env` में या `env.shellEnv` के माध्यम से)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Alibaba Model Studio" href="/hi/providers/alibaba" icon="cloud">
    उसी DashScope प्लेटफ़ॉर्म पर बंडल किया गया Wan वीडियो जनरेशन प्रदाता।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
