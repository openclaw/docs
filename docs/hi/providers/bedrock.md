---
read_when:
    - आप OpenClaw के साथ Amazon Bedrock मॉडल का उपयोग करना चाहते हैं
    - मॉडल कॉल के लिए आपको AWS क्रेडेंशियल/क्षेत्र सेटअप की आवश्यकता है
summary: OpenClaw के साथ Amazon Bedrock (Converse API) मॉडल का उपयोग करें
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-28T23:57:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw अपने **Bedrock Converse** स्ट्रीमिंग प्रदाता के माध्यम से **Amazon Bedrock** मॉडल का उपयोग कर सकता है। Bedrock प्रमाणीकरण **AWS SDK default credential chain** का उपयोग करता है, API key का नहीं।

| गुण | मान                                                       |
| -------- | ----------------------------------------------------------- |
| प्रदाता | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| प्रमाणीकरण     | AWS credentials (env vars, shared config, या instance role) |
| Region   | `AWS_REGION` या `AWS_DEFAULT_REGION` (डिफ़ॉल्ट: `us-east-1`) |

## शुरू करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप चरणों का पालन करें।

<Tabs>
  <Tab title="Access keys / env vars">
    **इनके लिए सर्वोत्तम:** डेवलपर मशीनें, CI, या ऐसे होस्ट जहां आप AWS credentials को सीधे प्रबंधित करते हैं।

    <Steps>
      <Step title="Gateway होस्ट पर AWS credentials सेट करें">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="अपने config में Bedrock प्रदाता और मॉडल जोड़ें">
        कोई `apiKey` आवश्यक नहीं है। प्रदाता को `auth: "aws-sdk"` के साथ कॉन्फ़िगर करें:

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
                    id: "us.anthropic.claude-opus-4-6-v1:0",
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
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
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
    env-marker प्रमाणीकरण (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, या `AWS_BEARER_TOKEN_BEDROCK`) के साथ, OpenClaw अतिरिक्त config के बिना मॉडल खोज के लिए implicit Bedrock प्रदाता को स्वतः सक्षम कर देता है।
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **इनके लिए सर्वोत्तम:** संलग्न IAM role वाले EC2 instances, जो प्रमाणीकरण के लिए instance metadata service का उपयोग करते हैं।

    <Steps>
      <Step title="खोज को स्पष्ट रूप से सक्षम करें">
        IMDS का उपयोग करते समय, OpenClaw केवल env markers से AWS auth का पता नहीं लगा सकता, इसलिए आपको opt in करना होगा:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="auto mode के लिए वैकल्पिक रूप से env marker जोड़ें">
        यदि आप env-marker auto-detection पथ को भी काम कराना चाहते हैं (उदाहरण के लिए, `openclaw status` सतहों के लिए):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        आपको fake API key की आवश्यकता **नहीं** है।
      </Step>
      <Step title="सत्यापित करें कि मॉडल खोजे गए हैं">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    आपके EC2 instance से जुड़े IAM role के पास निम्नलिखित अनुमतियां होनी चाहिए:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (स्वचालित खोज के लिए)
    - `bedrock:ListInferenceProfiles` (inference profile खोज के लिए)

    या managed policy `AmazonBedrockFullAccess` संलग्न करें।
    </Warning>

    <Note>
    आपको `AWS_PROFILE=default` की आवश्यकता केवल तब है जब आप विशेष रूप से auto mode या status सतहों के लिए env marker चाहते हैं। वास्तविक Bedrock runtime auth पथ AWS SDK default chain का उपयोग करता है, इसलिए IMDS instance-role auth env markers के बिना भी काम करता है।
    </Note>

  </Tab>
</Tabs>

## स्वचालित मॉडल खोज

OpenClaw उन Bedrock मॉडलों को स्वचालित रूप से खोज सकता है जो **स्ट्रीमिंग**
और **text output** का समर्थन करते हैं। खोज `bedrock:ListFoundationModels` और
`bedrock:ListInferenceProfiles` का उपयोग करती है, और परिणाम cache किए जाते हैं (डिफ़ॉल्ट: 1 घंटा)।

अंतर्निहित प्रदाता कैसे सक्षम होता है:

- यदि `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` है,
  तो OpenClaw discovery का प्रयास करेगा, भले ही कोई AWS env marker मौजूद न हो।
- यदि `plugins.entries.amazon-bedrock.config.discovery.enabled` सेट नहीं है,
  तो OpenClaw अंतर्निहित Bedrock प्रदाता को केवल तभी अपने-आप जोड़ता है
  जब उसे इनमें से कोई AWS auth marker दिखता है:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, या `AWS_PROFILE`।
- वास्तविक Bedrock runtime auth path अब भी AWS SDK default chain का उपयोग करता है, इसलिए
  shared config, SSO, और IMDS instance-role auth काम कर सकते हैं, भले ही discovery
  को opt in करने के लिए `enabled: true` की आवश्यकता रही हो।

<Note>
स्पष्ट `models.providers["amazon-bedrock"]` entries के लिए, OpenClaw अब भी `AWS_BEARER_TOKEN_BEDROCK` जैसे AWS env markers से Bedrock env-marker auth को जल्दी resolve कर सकता है, बिना full runtime auth loading को force किए। वास्तविक model-call auth path अब भी AWS SDK default chain का उपयोग करता है।
</Note>

<AccordionGroup>
  <Accordion title="Discovery config विकल्प">
    Config options `plugins.entries.amazon-bedrock.config.discovery` के अंतर्गत रहते हैं:

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

    | विकल्प | Default | विवरण |
    | ------ | ------- | ----------- |
    | `enabled` | auto | Auto mode में, OpenClaw अंतर्निहित Bedrock प्रदाता को केवल तब सक्षम करता है जब उसे कोई समर्थित AWS env marker दिखता है। Discovery को force करने के लिए `true` सेट करें। |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Discovery API calls के लिए उपयोग किया गया AWS region। |
    | `providerFilter` | (सभी) | Bedrock provider names से match करता है (उदाहरण के लिए `anthropic`, `amazon`)। |
    | `refreshInterval` | `3600` | Cache अवधि seconds में। Caching बंद करने के लिए `0` सेट करें। |
    | `defaultContextWindow` | `32000` | Discovered models के लिए उपयोग की गई context window (यदि आपको अपने model limits पता हैं, तो override करें)। |
    | `defaultMaxTokens` | `4096` | Discovered models के लिए उपयोग किए गए max output tokens (यदि आपको अपने model limits पता हैं, तो override करें)। |

  </Accordion>
</AccordionGroup>

## त्वरित setup (AWS path)

यह walkthrough एक IAM role बनाता है, Bedrock permissions attach करता है, instance profile associate करता है,
और EC2 host पर OpenClaw discovery सक्षम करता है।

```bash
# 1. Create IAM role and instance profile
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

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## उन्नत configuration

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw foundation models के साथ-साथ **regional और global inference profiles** discover करता है।
    जब कोई profile किसी ज्ञात foundation model से map होती है, तो
    profile उस model की capabilities (context window, max tokens,
    reasoning, vision) inherit करती है और सही Bedrock request region
    अपने-आप inject हो जाता है। इसका मतलब है कि cross-region Claude profiles manual
    provider overrides के बिना काम करते हैं।

    Inference profile IDs `us.anthropic.claude-opus-4-6-v1:0` (regional)
    या `anthropic.claude-opus-4-6-v1:0` (global) जैसे दिखते हैं। यदि backing model पहले से
    discovery results में है, तो profile उसका पूरा capability set inherit करती है;
    अन्यथा सुरक्षित defaults लागू होते हैं।

    कोई अतिरिक्त configuration आवश्यक नहीं है। जब तक discovery enabled है और IAM
    principal के पास `bedrock:ListInferenceProfiles` है, profiles
    `openclaw models list` में foundation models के साथ दिखाई देते हैं।

  </Accordion>

  <Accordion title="Service tier">
    कुछ Bedrock models cost या latency के लिए optimize करने हेतु `service_tier` parameter support करते हैं।
    निम्न tiers उपलब्ध हैं:

    | Tier | विवरण |
    |------|-------------|
    | `default` | Standard Bedrock tier |
    | `flex` | उन workloads के लिए discounted processing जो अधिक latency सहन कर सकते हैं |
    | `priority` | Latency-sensitive workloads के लिए prioritized processing |
    | `reserved` | Steady-state workloads के लिए reserved capacity |

    Bedrock model requests के लिए `agents.defaults.params` के माध्यम से
    `serviceTier` (या `service_tier`) सेट करें, या per-model
    `agents.defaults.models["<model-key>"].params` में सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    मान्य values `default`, `flex`, `priority`, और `reserved` हैं। सभी
    models सभी tiers support नहीं करते — यदि unsupported tier request किया जाता है, तो Bedrock
    validation error लौटाएगा। Note: error message कुछ misleading है;
    यह unsupported service tier बताने के बजाय "The provided model identifier is invalid" कह सकता है।
    यदि आपको यह error दिखे, तो जांचें कि model requested tier
    support करता है या नहीं।

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock Claude Opus 4.7 के लिए `temperature` parameter reject करता है। OpenClaw
    किसी भी Opus 4.7 Bedrock ref के लिए `temperature` को अपने-आप omit करता है, जिसमें
    foundation model ids, named inference profiles, application inference
    profiles जिनका underlying model `bedrock:GetInferenceProfile` के माध्यम से Opus 4.7 में resolve होता है,
    और optional region prefixes (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`) वाले dotted `opus-4.7` variants शामिल हैं। किसी config knob की आवश्यकता नहीं है,
    और omission request options object तथा `inferenceConfig` payload field दोनों पर लागू होता है।
  </Accordion>

  <Accordion title="Claude Fable 5">
    `us-east-1` में `amazon-bedrock/anthropic.claude-fable-5`, या
    `us.anthropic.claude-fable-5` जैसे क्षेत्रीय inference ids का उपयोग करें।
    OpenClaw Fable की 1M context window, 128K आउटपुट सीमा, हमेशा चालू
    adaptive thinking, और समर्थित effort mapping लागू करता है। `/think off` और
    `/think minimal` `low` पर मैप होते हैं; असमर्थित temperature और forced tool
    choice controls छोड़ दिए जाते हैं। Streaming output को तब तक रोका जाता है जब तक Bedrock
    terminal status वापस नहीं करता, ताकि mid-stream refusals आंशिक टेक्स्ट उजागर न करें।
    Fable केवल standard service tier का समर्थन करता है; OpenClaw इस मॉडल के लिए कॉन्फ़िगर किए गए
    `flex`, `priority`, और `reserved` tiers को अनदेखा करता है।

    AWS को Fable उपलब्ध होने से पहले स्पष्ट `provider_data_share` data-retention opt-in चाहिए।
    Prompts और completions Anthropic के साथ साझा किए जाते हैं और
    trust and safety के लिए 30 दिनों तक रखे जाते हैं। मॉडल सक्षम करने से पहले
    [Bedrock data retention](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    की समीक्षा और कॉन्फ़िगरेशन करें।

  </Accordion>

  <Accordion title="Guardrails">
    `amazon-bedrock` Plugin config में `guardrail` object जोड़कर आप सभी Bedrock model invocations पर
    [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    लागू कर सकते हैं। Guardrails आपको content filtering,
    topic denial, word filters, sensitive information filters, और contextual
    grounding checks लागू करने देते हैं।

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | विकल्प | आवश्यक | विवरण |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | हाँ | Guardrail ID (जैसे `abc123`) या पूरा ARN (जैसे `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`)। |
    | `guardrailVersion` | हाँ | प्रकाशित version number, या working draft के लिए `"DRAFT"`। |
    | `streamProcessingMode` | नहीं | streaming के दौरान guardrail evaluation के लिए `"sync"` या `"async"`। यदि छोड़ा जाए, तो Bedrock अपना default उपयोग करता है। |
    | `trace` | नहीं | debugging के लिए `"enabled"` या `"enabled_full"`; production के लिए छोड़ दें या `"disabled"` सेट करें। |

    <Warning>
    Gateway द्वारा उपयोग किए गए IAM principal के पास standard invoke permissions के अतिरिक्त `bedrock:ApplyGuardrail` permission होना चाहिए।
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock
    [मेमरी खोज](/hi/concepts/memory-search) के लिए embedding provider के रूप में भी काम कर सकता है। इसे
    inference provider से अलग कॉन्फ़िगर किया जाता है -- `agents.defaults.memorySearch.provider` को `"bedrock"` पर सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Bedrock embeddings inference जैसी ही AWS SDK credential chain का उपयोग करते हैं (instance
    roles, SSO, access keys, shared config, और web identity)। कोई API key
    आवश्यक नहीं है। Bedrock embeddings का उपयोग करने के लिए `memorySearch.provider: "bedrock"` स्पष्ट रूप से सेट करें।

    समर्थित embedding models में Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4), और TwelveLabs Marengo शामिल हैं। पूरी model list और dimension options के लिए
    [Memory configuration reference -- Bedrock](/hi/reference/memory-config#bedrock-embedding-config)
    देखें।

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock के लिए आपके AWS account/region में **model access** सक्षम होना आवश्यक है।
    - Automatic discovery के लिए `bedrock:ListFoundationModels` और
      `bedrock:ListInferenceProfiles` permissions चाहिए।
    - यदि आप auto mode पर निर्भर हैं, तो gateway host पर समर्थित AWS auth env markers में से एक सेट करें। यदि आप env markers के बिना IMDS/shared-config auth पसंद करते हैं, तो
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` सेट करें।
    - OpenClaw credential source को इस क्रम में दिखाता है: `AWS_BEARER_TOKEN_BEDROCK`,
      फिर `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, फिर `AWS_PROFILE`, फिर
      default AWS SDK chain।
    - Reasoning support model पर निर्भर करता है; वर्तमान क्षमताओं के लिए Bedrock model card देखें।
    - यदि आप managed key flow पसंद करते हैं, तो आप Bedrock के सामने OpenAI-compatible
      proxy भी रख सकते हैं और इसके बजाय उसे OpenAI provider के रूप में कॉन्फ़िगर कर सकते हैं।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Memory search" href="/hi/concepts/memory-search" icon="magnifying-glass">
    मेमरी खोज कॉन्फ़िगरेशन के लिए Bedrock embeddings।
  </Card>
  <Card title="Memory config reference" href="/hi/reference/memory-config#bedrock-embedding-config" icon="database">
    पूरी Bedrock embedding model list और dimension options।
  </Card>
  <Card title="Troubleshooting" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य troubleshooting और FAQ।
  </Card>
</CardGroup>
