---
read_when:
    - आप OpenClaw के साथ Amazon Bedrock मॉडल का उपयोग करना चाहते हैं
    - मॉडल कॉल के लिए आपको AWS क्रेडेंशियल/रीजन सेटअप की आवश्यकता है
summary: OpenClaw के साथ Amazon Bedrock (Converse API) मॉडल का उपयोग करें
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-19T09:27:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5d17e929c303c06985889aa68e7081995fd1ef1211d200a767905d73813e11
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw अपने **Bedrock Converse** स्ट्रीमिंग प्रदाता के माध्यम से **Amazon Bedrock**
मॉडल का उपयोग कर सकता है। Bedrock प्रमाणीकरण में API कुंजी नहीं, बल्कि
**AWS SDK डिफ़ॉल्ट क्रेडेंशियल शृंखला** का उपयोग होता है।

| प्रॉपर्टी | मान                                                       |
| -------- | ----------------------------------------------------------- |
| प्रदाता | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| प्रमाणीकरण     | AWS क्रेडेंशियल (परिवेश चर, साझा कॉन्फ़िगरेशन या इंस्टेंस भूमिका) |
| क्षेत्र   | `AWS_REGION` या `AWS_DEFAULT_REGION` (डिफ़ॉल्ट: `us-east-1`) |

## आरंभ करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप के चरणों का पालन करें।

<Tabs>
  <Tab title="एक्सेस कुंजियाँ / परिवेश चर">
    **इनके लिए सर्वोत्तम:** डेवलपर मशीनें, CI या ऐसे होस्ट जहाँ आप AWS क्रेडेंशियल सीधे प्रबंधित करते हैं।

    <Steps>
      <Step title="Gateway होस्ट पर AWS क्रेडेंशियल सेट करें">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # वैकल्पिक:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # वैकल्पिक (Bedrock API कुंजी/बेयरर टोकन):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="अपने कॉन्फ़िगरेशन में Bedrock प्रदाता और मॉडल जोड़ें">
        किसी `apiKey` की आवश्यकता नहीं है। प्रदाता को `auth: "aws-sdk"` के साथ कॉन्फ़िगर करें:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध हैं">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    परिवेश-मार्कर प्रमाणीकरण (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` या `AWS_BEARER_TOKEN_BEDROCK`) के साथ, OpenClaw बिना अतिरिक्त कॉन्फ़िगरेशन के मॉडल खोज के लिए निहित Bedrock प्रदाता को स्वतः सक्षम करता है।
    </Tip>

  </Tab>

  <Tab title="EC2 इंस्टेंस भूमिकाएँ (IMDS)">
    **इनके लिए सर्वोत्तम:** संलग्न IAM भूमिका वाले EC2 इंस्टेंस, जो प्रमाणीकरण के लिए इंस्टेंस मेटाडेटा सेवा का उपयोग करते हैं।

    <Steps>
      <Step title="खोज को स्पष्ट रूप से सक्षम करें">
        IMDS का उपयोग करते समय, OpenClaw केवल परिवेश मार्करों से AWS प्रमाणीकरण का पता नहीं लगा सकता, इसलिए आपको इसे स्पष्ट रूप से सक्षम करना होगा:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="वैकल्पिक रूप से स्वचालित मोड के लिए परिवेश मार्कर जोड़ें">
        यदि आप परिवेश-मार्कर स्वतः-पहचान पथ को भी कार्यशील बनाना चाहते हैं (उदाहरण के लिए, `openclaw status` सतहों हेतु):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        आपको नकली API कुंजी की **आवश्यकता नहीं** है।
      </Step>
      <Step title="सत्यापित करें कि मॉडल खोज लिए गए हैं">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    आपके EC2 इंस्टेंस से संलग्न IAM भूमिका के पास निम्न अनुमतियाँ होनी चाहिए:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (स्वचालित खोज के लिए)
    - `bedrock:ListInferenceProfiles` (इनफ़रेंस प्रोफ़ाइल खोज के लिए)

    या प्रबंधित नीति `AmazonBedrockFullAccess` संलग्न करें।
    </Warning>

    <Note>
    आपको `AWS_PROFILE=default` की आवश्यकता केवल तभी है जब आप विशेष रूप से स्वचालित मोड या स्थिति सतहों के लिए परिवेश मार्कर चाहते हैं। वास्तविक Bedrock रनटाइम प्रमाणीकरण पथ AWS SDK डिफ़ॉल्ट शृंखला का उपयोग करता है, इसलिए परिवेश मार्करों के बिना भी IMDS इंस्टेंस-भूमिका प्रमाणीकरण कार्य करता है।
    </Note>

  </Tab>
</Tabs>

## स्वचालित मॉडल खोज

OpenClaw उन Bedrock मॉडलों को स्वचालित रूप से खोज सकता है जो **स्ट्रीमिंग**
और **टेक्स्ट आउटपुट** का समर्थन करते हैं। खोज में `bedrock:ListFoundationModels` और
`bedrock:ListInferenceProfiles` का उपयोग होता है और परिणाम कैश किए जाते हैं (डिफ़ॉल्ट: 1 घंटा)।

निहित प्रदाता को सक्षम करने का तरीका:

- यदि `plugins.entries.amazon-bedrock.config.discovery.enabled`, `true` है,
  तो AWS परिवेश मार्कर उपस्थित न होने पर भी OpenClaw खोज का प्रयास करेगा।
- यदि `plugins.entries.amazon-bedrock.config.discovery.enabled` सेट नहीं है,
  तो OpenClaw निहित Bedrock प्रदाता को केवल तभी स्वतः जोड़ता है
  जब उसे इनमें से कोई AWS प्रमाणीकरण मार्कर दिखाई देता है:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, या `AWS_PROFILE`।
- वास्तविक Bedrock रनटाइम प्रमाणीकरण पथ अब भी AWS SDK डिफ़ॉल्ट शृंखला का उपयोग करता है, इसलिए
  साझा कॉन्फ़िगरेशन, SSO और IMDS इंस्टेंस-भूमिका प्रमाणीकरण तब भी कार्य कर सकते हैं जब खोज
  को स्पष्ट रूप से सक्षम करने के लिए `enabled: true` की आवश्यकता पड़ी हो।

<Note>
स्पष्ट `models.providers["amazon-bedrock"]` प्रविष्टियों के लिए, OpenClaw पूर्ण रनटाइम प्रमाणीकरण लोडिंग को बाध्य किए बिना `AWS_BEARER_TOKEN_BEDROCK` जैसे AWS परिवेश मार्करों से Bedrock परिवेश-मार्कर प्रमाणीकरण को आरंभ में ही हल कर सकता है। वास्तविक मॉडल-कॉल प्रमाणीकरण पथ अब भी AWS SDK डिफ़ॉल्ट शृंखला का उपयोग करता है।
</Note>

<AccordionGroup>
  <Accordion title="खोज कॉन्फ़िगरेशन विकल्प">
    कॉन्फ़िगरेशन विकल्प `plugins.entries.amazon-bedrock.config.discovery` के अंतर्गत होते हैं:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | विकल्प | डिफ़ॉल्ट | विवरण |
    | ------ | ------- | ----------- |
    | `enabled` | स्वतः | स्वचालित मोड में, OpenClaw निहित Bedrock प्रदाता को केवल तभी सक्षम करता है जब उसे कोई समर्थित AWS परिवेश मार्कर दिखाई देता है। खोज को बाध्य करने के लिए `true` सेट करें। |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | खोज API कॉल के लिए उपयोग किया जाने वाला AWS क्षेत्र। |
    | `providerFilter` | (सभी) | Bedrock प्रदाता नामों से मिलान करता है (उदाहरण के लिए `anthropic`, `amazon`)। |
    | `refreshInterval` | `3600` | सेकंड में कैश अवधि। कैशिंग अक्षम करने के लिए `0` सेट करें। |
    | `defaultContextWindow` | `32000` | अज्ञात टोकन सीमाओं वाले खोजे गए मॉडलों के लिए उपयोग की जाने वाली कॉन्टेक्स्ट विंडो (यदि आपको अपने मॉडल की सीमाएँ पता हैं, तो इसे ओवरराइड करें)। |
    | `defaultMaxTokens` | `4096` | अज्ञात टोकन सीमाओं वाले खोजे गए मॉडलों के लिए उपयोग किए जाने वाले अधिकतम आउटपुट टोकन (यदि आपको अपने मॉडल की सीमाएँ पता हैं, तो इसे ओवरराइड करें)। |

  </Accordion>

  <Accordion title="कॉन्टेक्स्ट विंडो और अधिकतम-टोकन सीमाएँ">
    Bedrock `ListFoundationModels` और `GetFoundationModel` API कोई
    टोकन-सीमा मेटाडेटा नहीं लौटाते, केवल मॉडल ID, नाम, मोडैलिटी और जीवनचक्र
    स्थिति लौटाते हैं। OpenClaw लोकप्रिय Bedrock मॉडलों (Claude, Nova, Llama, Mistral, DeepSeek
    और अन्य) के लिए ज्ञात कॉन्टेक्स्ट विंडो और आउटपुट
    सीमाओं की एक लुकअप तालिका के साथ आता है, ताकि उन मॉडलों के लिए सत्र प्रबंधन, Compaction सीमाएँ और
    कॉन्टेक्स्ट-ओवरफ़्लो पहचान सही ढंग से कार्य करें।

    तालिका में न होने वाले खोजे गए मॉडल `defaultContextWindow`
    और `defaultMaxTokens` पर फ़ॉलबैक करते हैं। यदि आपके द्वारा उपयोग किए जाने वाले मॉडल की सटीक सीमाएँ
    अनुपस्थित हैं, तो इसे एक स्पष्ट
    `models.providers["amazon-bedrock"].models` प्रविष्टि से ओवरराइड करें।

  </Accordion>
</AccordionGroup>

## त्वरित सेटअप (AWS पथ)

यह चरण-दर-चरण प्रक्रिया एक IAM भूमिका बनाती है, Bedrock अनुमतियाँ संलग्न करती है, इंस्टेंस प्रोफ़ाइल संबद्ध करती है
और EC2 होस्ट पर OpenClaw खोज सक्षम करती है।

```bash
# 1. IAM भूमिका और इंस्टेंस प्रोफ़ाइल बनाएँ
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. अपने EC2 इंस्टेंस से संलग्न करें
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. EC2 इंस्टेंस पर खोज को स्पष्ट रूप से सक्षम करें
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. वैकल्पिक: यदि स्पष्ट सक्षमकरण के बिना स्वचालित मोड चाहिए, तो परिवेश मार्कर जोड़ें
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. सत्यापित करें कि मॉडल खोज लिए गए हैं
openclaw models list
```

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="इनफ़रेंस प्रोफ़ाइल">
    OpenClaw फ़ाउंडेशन मॉडलों के साथ-साथ **क्षेत्रीय और वैश्विक इनफ़रेंस प्रोफ़ाइल**
    खोजता है। जब कोई प्रोफ़ाइल किसी ज्ञात फ़ाउंडेशन मॉडल से मैप होती है, तो
    प्रोफ़ाइल उस मॉडल की क्षमताएँ (कॉन्टेक्स्ट विंडो, अधिकतम टोकन,
    रीजनिंग, विज़न) प्राप्त करती है और सही Bedrock अनुरोध क्षेत्र
    स्वचालित रूप से इंजेक्ट किया जाता है। इसका अर्थ है कि क्रॉस-रीजन Claude प्रोफ़ाइल मैन्युअल
    प्रदाता ओवरराइड के बिना कार्य करती हैं। वैश्विक क्रॉस-रीजन प्रोफ़ाइल (`global.*`) को `openclaw models list` में
    पहले सूचीबद्ध किया जाता है, क्योंकि वे सामान्यतः बेहतर क्षमता
    और स्वचालित फ़ेलओवर प्रदान करती हैं।

    इनफ़रेंस प्रोफ़ाइल ID `us.anthropic.claude-opus-4-6-v1` (क्षेत्रीय)
    या `anthropic.claude-opus-4-6-v1` (वैश्विक) जैसी दिखती हैं। यदि आधारभूत मॉडल पहले से
    खोज परिणामों में है, तो प्रोफ़ाइल उसकी संपूर्ण क्षमता-शृंखला प्राप्त करती है;
    अन्यथा सुरक्षित डिफ़ॉल्ट लागू होते हैं।

    किसी अतिरिक्त कॉन्फ़िगरेशन की आवश्यकता नहीं है। जब तक खोज सक्षम है और IAM
    प्रिंसिपल के पास `bedrock:ListInferenceProfiles` है, प्रोफ़ाइल
    `openclaw models list` में फ़ाउंडेशन मॉडलों के साथ दिखाई देती हैं।

  </Accordion>

  <Accordion title="सेवा स्तर">
    कुछ Bedrock मॉडल लागत या विलंबता को अनुकूलित करने के लिए `service_tier` पैरामीटर का समर्थन करते हैं।
    निम्न स्तर उपलब्ध हैं:

    | स्तर | विवरण |
    |------|-------------|
    | `default` | मानक Bedrock स्तर |
    | `flex` | अधिक विलंबता सहन कर सकने वाले वर्कलोड के लिए रियायती प्रोसेसिंग |
    | `priority` | विलंबता-संवेदनशील वर्कलोड के लिए प्राथमिकता-प्राप्त प्रोसेसिंग |
    | `reserved` | स्थिर-अवस्था वर्कलोड के लिए आरक्षित क्षमता |

    Bedrock मॉडल अनुरोधों के लिए `agents.defaults.params` के माध्यम से `serviceTier` (या `service_tier`) सेट करें,
    या प्रति-मॉडल
    `agents.defaults.models["<model-key>"].params` में:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // सभी मॉडलों पर लागू होता है
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // प्रति-मॉडल ओवरराइड
              },
            },
          },
        },
      },
    }
    ```

    मान्य मान `default`, `flex`, `priority`, और `reserved` हैं। Claude
    Fable 5 और Sonnet 5 केवल `default` स्तर का समर्थन करते हैं; उन मॉडल के लिए अनुरोधित
    `flex`, `priority`, या `reserved` को OpenClaw चेतावनी देकर
    अनदेखा कर देता है। अन्य मॉडल के लिए, प्रत्येक मॉडल हर स्तर का समर्थन नहीं करता है -- असमर्थित स्तर
    Bedrock सत्यापन त्रुटि लौटाता है, और त्रुटि संदेश
    भ्रामक हो सकता है (उदाहरण के लिए, समस्या के रूप में स्तर का नाम बताने के बजाय
    "The provided model identifier is invalid")। यदि यह त्रुटि दिखाई देती है, तो जाँचें
    कि मॉडल अनुरोधित स्तर का समर्थन करता है या नहीं।

  </Accordion>

  <Accordion title="Claude Opus 4.7 और 4.8 का तापमान">
    Bedrock, Claude Opus 4.7 और Opus
    4.8 के लिए `temperature` पैरामीटर को अस्वीकार करता है। OpenClaw किसी भी मेल खाने वाले Bedrock
    संदर्भ के लिए `temperature` को स्वचालित रूप से छोड़ देता है, जिसमें फ़ाउंडेशन मॉडल आईडी, नामित अनुमान प्रोफ़ाइल, ऐसी एप्लिकेशन
    अनुमान प्रोफ़ाइल जिनका अंतर्निहित मॉडल `bedrock:GetInferenceProfile` के माध्यम से Opus 4.7/4.8 के रूप में
    निर्धारित होता है, और वैकल्पिक क्षेत्र उपसर्गों वाले बिंदुयुक्त `opus-4.7`/`opus-4.8` प्रकार
    (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) शामिल हैं। किसी कॉन्फ़िग विकल्प की आवश्यकता नहीं है, और यह विलोपन अनुरोध
    विकल्प ऑब्जेक्ट तथा `inferenceConfig` पेलोड फ़ील्ड, दोनों पर लागू होता है।
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` में `amazon-bedrock/anthropic.claude-fable-5` का उपयोग करें, या
    `us.anthropic.claude-fable-5` जैसे क्षेत्रीय अनुमान आईडी का उपयोग करें।
    OpenClaw, Fable की 1M संदर्भ विंडो, 128K आउटपुट सीमा, हमेशा सक्रिय
    अनुकूली चिंतन और समर्थित प्रयास मैपिंग लागू करता है। `/think off` और
    `/think minimal`, `low` पर मैप होते हैं; तापमान और बाध्य टूल चयन नियंत्रण
    छोड़ दिए जाते हैं, जो Opus 4.7/4.8 रूट के अनुरूप है। स्ट्रीमिंग आउटपुट को तब तक रोका
    जाता है, जब तक Bedrock अंतिम स्थिति नहीं लौटाता, ताकि स्ट्रीम के बीच होने वाले अस्वीकरण
    आंशिक टेक्स्ट उजागर न करें।

    Fable उपलब्ध होने से पहले AWS को स्पष्ट `provider_data_share` डेटा-प्रतिधारण सहमति की आवश्यकता होती है।
    प्रॉम्प्ट और पूर्णताएँ Anthropic के साथ साझा की जाती हैं और
    विश्वास एवं सुरक्षा के लिए अधिकतम 30 दिनों तक रखी जाती हैं। मॉडल सक्षम करने से पहले
    [Bedrock डेटा प्रतिधारण](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    की समीक्षा और कॉन्फ़िगरेशन करें।

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5, Bedrock के माध्यम से केवल उन खातों के लिए उपलब्ध है जिनके पास
    आवश्यक सीमित-पहुँच स्वीकृति है। OpenClaw, फ़ाउंडेशन मॉडल
    `anthropic.claude-mythos-5` और `us.anthropic.claude-mythos-5` जैसी क्षेत्रीय या वैश्विक अनुमान प्रोफ़ाइल
    को पहचानता है।

    OpenClaw 1,000,000-टोकन संदर्भ विंडो, 128,000-टोकन आउटपुट
    सीमा, इमेज इनपुट, प्रॉम्प्ट कैशिंग, अस्वीकरण-सुरक्षित स्ट्रीमिंग और मूल
    प्रयास स्तर लागू करता है। अनुकूली चिंतन हमेशा सक्षम रहता है: `/think off` और
    `/think minimal`, `low` पर मैप होते हैं, जबकि `xhigh` और `max` उपलब्ध रहते हैं।
    कस्टम सैंपलिंग और बाध्य टूल चयन मान छोड़ दिए जाते हैं।

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS, Sonnet 5 को
    [`bedrock-runtime` और `bedrock-mantle` एंडपॉइंट](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    दोनों के लिए प्रलेखित करता है।
    OpenClaw, Bedrock फ़ाउंडेशन मॉडल
    `anthropic.claude-sonnet-5` और `us.anthropic.claude-sonnet-5` जैसी क्षेत्रीय या वैश्विक अनुमान प्रोफ़ाइल
    को पहचानता है। यह 1,000,000-टोकन संदर्भ
    विंडो, 128,000-टोकन आउटपुट सीमा, इमेज इनपुट, मूल प्रयास स्तर,
    प्रॉम्प्ट कैशिंग और अस्वीकरण-सुरक्षित स्ट्रीमिंग लागू करता है।

    Bedrock, Sonnet 5 के लिए अनुकूली चिंतन सक्षम रखता है। OpenClaw का डिफ़ॉल्ट
    `high` है; `/think off` और `/think minimal`, `low` पर मैप होते हैं क्योंकि यह रूट
    चिंतन अक्षम नहीं कर सकता। अनुकूली चिंतन सक्रिय रहने पर कस्टम तापमान और बाध्य टूल चयन मान
    छोड़ दिए जाते हैं।

  </Accordion>

  <Accordion title="गार्डरेल">
    `amazon-bedrock` Plugin कॉन्फ़िग में `guardrail` ऑब्जेक्ट जोड़कर
    सभी Bedrock मॉडल आह्वानों पर [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    लागू किए जा सकते हैं। गार्डरेल के माध्यम से सामग्री फ़िल्टरिंग,
    विषय निषेध, शब्द फ़िल्टर, संवेदनशील जानकारी फ़िल्टर और प्रासंगिक
    आधार-जाँच लागू की जा सकती हैं।

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // गार्डरेल आईडी या पूर्ण ARN
                guardrailVersion: "1", // संस्करण संख्या या "DRAFT"
                streamProcessingMode: "sync", // वैकल्पिक: "sync" या "async"
                trace: "enabled", // वैकल्पिक: "enabled", "disabled", या "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` और `guardrailVersion` आवश्यक हैं।

    | विकल्प | विवरण |
    | ------ | ----------- |
    | `guardrailIdentifier` | गार्डरेल आईडी (जैसे `abc123`) या पूर्ण ARN (जैसे `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`)। |
    | `guardrailVersion` | प्रकाशित संस्करण संख्या, या कार्यशील ड्राफ़्ट के लिए `"DRAFT"`। |
    | `streamProcessingMode` | स्ट्रीमिंग के दौरान गार्डरेल मूल्यांकन के लिए `"sync"` या `"async"`। छोड़ने पर Bedrock अपने डिफ़ॉल्ट का उपयोग करता है। |
    | `trace` | डीबगिंग के लिए `"enabled"` या `"enabled_full"`; प्रोडक्शन के लिए इसे छोड़ें या `"disabled"` पर सेट करें। |

    <Warning>
    Gateway द्वारा उपयोग किए जाने वाले IAM प्रिंसिपल के पास मानक आह्वान अनुमतियों के अतिरिक्त `bedrock:ApplyGuardrail` अनुमति होनी आवश्यक है।
    </Warning>

  </Accordion>

  <Accordion title="मेमोरी खोज के लिए एम्बेडिंग">
    Bedrock,
    [मेमोरी खोज](/hi/concepts/memory-search) के लिए एम्बेडिंग प्रदाता के रूप में भी काम कर सकता है। इसे
    अनुमान प्रदाता से अलग कॉन्फ़िगर किया जाता है -- `agents.defaults.memorySearch.provider` को `"bedrock"` पर सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // डिफ़ॉल्ट
          },
        },
      },
    }
    ```

    Bedrock एम्बेडिंग, अनुमान के समान AWS SDK क्रेडेंशियल शृंखला का उपयोग करती हैं (इंस्टेंस
    भूमिकाएँ, SSO, एक्सेस कुंजियाँ, साझा कॉन्फ़िग और वेब पहचान)। किसी API कुंजी की
    आवश्यकता नहीं है।

    समर्थित एम्बेडिंग मॉडल में Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4), और TwelveLabs Marengo शामिल हैं। संपूर्ण मॉडल सूची और आयाम विकल्पों के लिए
    [मेमोरी कॉन्फ़िगरेशन संदर्भ -- Bedrock](/hi/reference/memory-config#bedrock-embedding-config)
    देखें।

  </Accordion>

  <Accordion title="टिप्पणियाँ और सावधानियाँ">
    - Bedrock के लिए आपके AWS खाते/क्षेत्र में **मॉडल पहुँच** सक्षम होना आवश्यक है।
    - स्वचालित खोज के लिए `bedrock:ListFoundationModels` और
      `bedrock:ListInferenceProfiles` अनुमतियाँ आवश्यक हैं।
    - यदि आप स्वचालित मोड पर निर्भर हैं, तो Gateway होस्ट पर समर्थित AWS प्रमाणीकरण एन्वायरनमेंट मार्कर में से
      कोई एक सेट करें। यदि एन्वायरनमेंट मार्कर के बिना IMDS/साझा-कॉन्फ़िग प्रमाणीकरण वांछित है, तो
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` सेट करें।
    - OpenClaw क्रेडेंशियल स्रोत को इस क्रम में प्रदर्शित करता है: `AWS_BEARER_TOKEN_BEDROCK`,
      फिर `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, फिर `AWS_PROFILE`, और फिर
      डिफ़ॉल्ट AWS SDK शृंखला।
    - रीज़निंग समर्थन मॉडल पर निर्भर करता है; वर्तमान क्षमताओं के लिए Bedrock मॉडल कार्ड
      देखें।
    - यदि प्रबंधित कुंजी प्रवाह वांछित है, तो Bedrock के आगे OpenAI-संगत
      प्रॉक्सी भी रखी जा सकती है और इसके बजाय उसे OpenAI प्रदाता के रूप में कॉन्फ़िगर किया जा सकता है।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल संदर्भ और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="मेमोरी खोज" href="/hi/concepts/memory-search" icon="magnifying-glass">
    मेमोरी खोज कॉन्फ़िगरेशन के लिए Bedrock एम्बेडिंग।
  </Card>
  <Card title="मेमोरी कॉन्फ़िग संदर्भ" href="/hi/reference/memory-config#bedrock-embedding-config" icon="database">
    Bedrock एम्बेडिंग मॉडल की संपूर्ण सूची और आयाम विकल्प।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
