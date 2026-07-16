---
read_when:
    - आप OpenClaw के साथ Bedrock Mantle पर होस्ट किए गए OSS मॉडल का उपयोग करना चाहते हैं
    - आपको GPT-OSS, Qwen, Kimi या GLM के लिए Mantle का OpenAI-संगत एंडपॉइंट चाहिए
    - आप Amazon Bedrock Mantle के माध्यम से Claude Sonnet 5 या Mythos 5 का उपयोग करना चाहते हैं
summary: OpenClaw के साथ Amazon Bedrock Mantle के OpenAI-संगत और Claude Messages मॉडल का उपयोग करें
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-16T16:34:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw में एक बंडल किया हुआ **Amazon Bedrock Mantle** प्रदाता शामिल है, जो
Mantle के OpenAI-संगत एंडपॉइंट से जुड़ता है। Mantle, Bedrock अवसंरचना द्वारा समर्थित
मानक `/v1/chat/completions` सतह के माध्यम से ओपन-सोर्स और
तृतीय-पक्ष मॉडल (GPT-OSS, Qwen, Kimi, GLM और इसी तरह के मॉडल) होस्ट करता है। Mantle,
Anthropic Messages रूट के माध्यम से Anthropic Claude मॉडल भी उपलब्ध कराता है।

| गुण             | मान                                                                                     |
| --------------- | --------------------------------------------------------------------------------------- |
| प्रदाता ID      | `amazon-bedrock-mantle`                                                                      |
| API             | खोजे गए OSS मॉडल के लिए `openai-completions`, Claude मॉडल के लिए `anthropic-messages`       |
| प्रमाणीकरण      | स्पष्ट `AWS_BEARER_TOKEN_BEDROCK` या IAM क्रेडेंशियल-चेन बेयरर-टोकन जनरेशन                     |
| डिफ़ॉल्ट क्षेत्र | `us-east-1` (`AWS_REGION` या `AWS_DEFAULT_REGION` से ओवरराइड करें)           |

## आरंभ करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप चरणों का पालन करें।

<Tabs>
  <Tab title="स्पष्ट बेयरर टोकन">
    **इनके लिए सर्वोत्तम:** ऐसे परिवेश जहाँ आपके पास पहले से Mantle बेयरर टोकन है।

    <Steps>
      <Step title="Gateway होस्ट पर बेयरर टोकन सेट करें">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        वैकल्पिक रूप से कोई क्षेत्र सेट करें (डिफ़ॉल्ट `us-east-1` है):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल खोजे गए हैं">
        ```bash
        openclaw models list
        ```

        खोजे गए मॉडल `amazon-bedrock-mantle` प्रदाता के अंतर्गत दिखाई देते हैं। जब तक
        आप डिफ़ॉल्ट मानों को ओवरराइड नहीं करना चाहते, किसी अतिरिक्त कॉन्फ़िगरेशन की आवश्यकता नहीं है।
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM क्रेडेंशियल">
    **इनके लिए सर्वोत्तम:** AWS SDK-संगत क्रेडेंशियल (साझा कॉन्फ़िगरेशन, SSO, वेब पहचान, इंस्टेंस या टास्क भूमिकाएँ) का उपयोग।

    <Steps>
      <Step title="Gateway होस्ट पर AWS क्रेडेंशियल कॉन्फ़िगर करें">
        कोई भी AWS SDK-संगत प्रमाणीकरण स्रोत काम करता है:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल खोजे गए हैं">
        ```bash
        openclaw models list
        ```

        OpenClaw क्रेडेंशियल चेन से स्वचालित रूप से Mantle बेयरर टोकन जनरेट करता है।
      </Step>
    </Steps>

    <Tip>
    जब `AWS_BEARER_TOKEN_BEDROCK` सेट नहीं होता, तो OpenClaw आपके लिए AWS डिफ़ॉल्ट क्रेडेंशियल चेन से बेयरर टोकन बनाता है, जिसमें साझा क्रेडेंशियल/कॉन्फ़िगरेशन प्रोफ़ाइल, SSO, वेब पहचान और इंस्टेंस या टास्क भूमिकाएँ शामिल हैं।
    </Tip>

  </Tab>
</Tabs>

## स्वचालित मॉडल खोज

जब `AWS_BEARER_TOKEN_BEDROCK` सेट होता है, तो OpenClaw सीधे उसका उपयोग करता है। अन्यथा,
OpenClaw AWS डिफ़ॉल्ट क्रेडेंशियल चेन से Mantle बेयरर टोकन जनरेट करने का प्रयास
करता है। इसके बाद यह क्षेत्र के `/v1/models` एंडपॉइंट को क्वेरी करके
उपलब्ध Mantle मॉडल खोजता है।

| व्यवहार            | विवरण                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------- |
| खोज कैश            | परिणाम प्रत्येक क्षेत्र के लिए 1 घंटे तक कैश होते हैं; फ़ेच विफल होने पर अंतिम कैश परिणाम लौटता है |
| IAM टोकन रीफ़्रेश  | प्रत्येक 2 घंटे में, प्रत्येक क्षेत्र के लिए कैश किया जाता है                                |

Mantle Plugin को सक्षम रखते हुए स्वचालित खोज और IAM
बेयरर-टोकन जनरेशन रोकने के लिए, Plugin के स्वामित्व वाला खोज टॉगल अक्षम करें:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
बेयरर टोकन वही `AWS_BEARER_TOKEN_BEDROCK` है जिसका उपयोग मानक [Amazon Bedrock](/hi/providers/bedrock) प्रदाता करता है।
</Note>

### समर्थित क्षेत्र

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`।

## मैन्युअल कॉन्फ़िगरेशन

यदि आप स्वतः खोज के बजाय स्पष्ट कॉन्फ़िगरेशन पसंद करते हैं:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

एक स्पष्ट गैर-रिक्त `models` सूची प्रामाणिक होती है और नीचे दी गई
Claude पंक्तियों सहित प्रत्येक खोजी गई पंक्ति को प्रतिस्थापित करती है। स्वचालित
Mantle कैटलॉग बनाए रखने के लिए `models` को छोड़ दें, या उन सभी Claude
मॉडल प्रविष्टियों को शामिल करें जिनका आप उपयोग करना चाहते हैं।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="रीज़निंग समर्थन">
    रीज़निंग समर्थन का अनुमान उन मॉडल ID से लगाया जाता है जिनमें
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b`, या
    `gpt-oss-safeguard-120b` जैसे पैटर्न होते हैं। खोज के दौरान OpenClaw मेल खाने वाले
    मॉडल के लिए `reasoning: true` स्वचालित रूप से सेट करता है।
  </Accordion>

  <Accordion title="एंडपॉइंट की अनुपलब्धता">
    यदि Mantle एंडपॉइंट अनुपलब्ध है, कोई मॉडल नहीं लौटाता, या बेयरर-टोकन
    समाधान विफल हो जाता है, तो खोज एक रिक्त परिणाम लौटाती है और अंतर्निहित
    प्रदाता को छोड़ दिया जाता है। OpenClaw त्रुटि नहीं देता; अन्य कॉन्फ़िगर किए गए प्रदाता
    सामान्य रूप से काम करते रहते हैं।
  </Accordion>

  <Accordion title="Anthropic Messages रूट के माध्यम से Claude">
    जब स्वचालित खोज मॉडल सूची की स्वामी होती है, तो सफल लुकअप के बाद OpenClaw चार Claude
    मॉडल जोड़ता है, चाहे `/v1/models` कुछ भी लौटाए:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7), और
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), साथ ही
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview)। वे `anthropic-messages` API सतह का उपयोग करते हैं और उसी बेयरर-प्रमाणीकृत
    Anthropic-संगत एंडपॉइंट
    (`<mantle-base>/anthropic`) के माध्यम से स्ट्रीम करते हैं, इसलिए AWS बेयरर टोकन को
    Anthropic API कुंजी की तरह नहीं माना जाता।

    Claude Sonnet 5 हमेशा अनुकूली चिंतन का उपयोग करता है और डिफ़ॉल्ट रूप से `high`
    प्रयास का उपयोग करता है। `/think off` और `/think minimal` को `low` पर मैप किया जाता है, क्योंकि Mantle
    रूट चिंतन को अक्षम नहीं कर सकता। OpenClaw, Sonnet 5 अनुरोधों के लिए
    कस्टम तापमान भी छोड़ देता है।

    Claude Mythos 5 की पहुँच सीमित है। यह 1,000,000-टोकन की संदर्भ
    विंडो और 128,000-टोकन की आउटपुट सीमा प्रकाशित करता है, हमेशा अनुकूली चिंतन का उपयोग करता है,
    `/think off` और `/think minimal` को `low` पर मैप करता है, और कॉलर द्वारा चुने गए
    सैंपलिंग पैरामीटर छोड़ देता है।

    Claude Mythos Preview हमेशा रीज़निंग का अनुरोध करता है और जब कोई `/think`
    स्तर सेट नहीं होता, तो डिफ़ॉल्ट रूप से `high` प्रयास का उपयोग करता है (`xhigh`/`max` से
    नीचे `high` पर और `minimal` से ऊपर `low` पर मैप किया जाता है)। Mantle पर Opus 4.7,
    मॉडल द्वारा प्रदान की गई रीज़निंग के बिना स्ट्रीम करता है, और OpenClaw उसका `temperature` पैरामीटर
    छोड़ देता है, क्योंकि Opus 4.7 इस रूट पर सैंपलिंग ओवरराइड स्वीकार नहीं करता; Mythos
    Preview सामान्य रूप से `temperature` ओवरराइड स्वीकार करता है।

    एक गैर-रिक्त स्पष्ट `models.providers["amazon-bedrock-mantle"].models`
    सूची संपूर्ण खोजे गए कैटलॉग को प्रतिस्थापित करती है। जब आप इन अंतर्निहित Claude
    पंक्तियों का उपयोग करना चाहते हैं, तो उस सूची को छोड़ दें।

  </Accordion>

  <Accordion title="Amazon Bedrock प्रदाता से संबंध">
    Bedrock Mantle, मानक
    [Amazon Bedrock](/hi/providers/bedrock) प्रदाता से अलग प्रदाता है। Mantle अपने OSS कैटलॉग के लिए
    OpenAI-संगत `/v1` सतह का उपयोग करता है, जबकि मानक
    Bedrock प्रदाता मूल Bedrock Converse API का उपयोग करता है।

    मौजूद होने पर दोनों प्रदाता समान `AWS_BEARER_TOKEN_BEDROCK` क्रेडेंशियल साझा करते हैं।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/hi/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan और अन्य मॉडल के लिए मूल Bedrock प्रदाता।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="OAuth और प्रमाणीकरण" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और क्रेडेंशियल के पुनः उपयोग के नियम।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और उन्हें हल करने के तरीके।
  </Card>
</CardGroup>
