---
read_when:
    - आप OpenClaw के साथ Bedrock Mantle द्वारा होस्ट किए गए OSS मॉडल का उपयोग करना चाहते हैं
    - आपको GPT-OSS, Qwen, Kimi, या GLM के लिए Mantle OpenAI-compatible एंडपॉइंट चाहिए
summary: OpenClaw के साथ Amazon Bedrock Mantle (OpenAI-संगत) मॉडल का उपयोग करें
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-28T23:56:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw में बंडल किया गया **Amazon Bedrock Mantle** प्रदाता शामिल है, जो
Mantle OpenAI-संगत endpoint से कनेक्ट करता है। Mantle open-source और
third-party मॉडल (GPT-OSS, Qwen, Kimi, GLM, और समान) को Bedrock infrastructure द्वारा समर्थित मानक
`/v1/chat/completions` सतह के माध्यम से होस्ट करता है।

| गुण            | मान                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------- |
| प्रदाता ID     | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI-संगत) या `anthropic-messages` (Anthropic Messages route)       |
| प्रमाणीकरण     | स्पष्ट `AWS_BEARER_TOKEN_BEDROCK` या IAM credential-chain bearer-token generation           |
| डिफ़ॉल्ट region | `us-east-1` (`AWS_REGION` या `AWS_DEFAULT_REGION` से override करें)                         |

## शुरू करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और setup चरणों का पालन करें।

<Tabs>
  <Tab title="Explicit bearer token">
    **इसके लिए सर्वोत्तम:** वे environment जहाँ आपके पास पहले से Mantle bearer token है।

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        वैकल्पिक रूप से region set करें (डिफ़ॉल्ट `us-east-1` है):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Opt in to provider data sharing for Claude Fable 5">
        Claude Fable 5 और Claude Mythos-class Bedrock मॉडल को invocation से पहले Mantle Data Retention API mode `provider_data_share` की आवश्यकता होती है। यह opt-in Bedrock को prompts और completions Anthropic के साथ साझा करने और trust तथा safety review के लिए उन्हें 30 दिनों तक retain करने की अनुमति देता है।

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        यदि आप उस retention mode को स्वीकार नहीं कर सकते, तो config में कोई अन्य Bedrock मॉडल उपयोग करें।
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        खोजे गए मॉडल `amazon-bedrock-mantle` प्रदाता के अंतर्गत दिखाई देते हैं। जब तक आप defaults को override नहीं करना चाहते,
        कोई अतिरिक्त config आवश्यक नहीं है।
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **इसके लिए सर्वोत्तम:** AWS SDK-संगत credentials (shared config, SSO, web identity, instance या task roles) का उपयोग करना।

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        कोई भी AWS SDK-संगत auth source काम करता है:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw credential chain से Mantle bearer token अपने आप generate करता है।
      </Step>
    </Steps>

    <Tip>
    जब `AWS_BEARER_TOKEN_BEDROCK` set नहीं होता, तो OpenClaw आपके लिए AWS default credential chain से bearer token mint करता है, जिसमें shared credentials/config profiles, SSO, web identity, और instance या task roles शामिल हैं।
    </Tip>

  </Tab>
</Tabs>

## स्वचालित मॉडल खोज

जब `AWS_BEARER_TOKEN_BEDROCK` set होता है, OpenClaw उसे सीधे उपयोग करता है। अन्यथा,
OpenClaw AWS default credential chain से Mantle bearer token generate करने का प्रयास करता है।
फिर यह region के `/v1/models` endpoint को query करके उपलब्ध Mantle models खोजता है।

| व्यवहार           | विवरण                     |
| ----------------- | ------------------------- |
| Discovery cache   | परिणाम 1 घंटे के लिए cached |
| IAM token refresh | प्रति घंटा                |

Mantle Plugin को enabled रखते हुए automatic discovery और IAM
bearer-token generation को suppress करने के लिए, Plugin-owned discovery toggle disable करें:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
bearer token वही `AWS_BEARER_TOKEN_BEDROCK` है, जिसका उपयोग standard [Amazon Bedrock](/hi/providers/bedrock) प्रदाता करता है।
</Note>

### समर्थित regions

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Manual configuration

यदि आप auto-discovery के बजाय explicit config पसंद करते हैं:

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

## Advanced configuration

<AccordionGroup>
  <Accordion title="Reasoning support">
    Reasoning support को उन model IDs से infer किया जाता है जिनमें
    `thinking`, `reasoner`, या `gpt-oss-120b` जैसे patterns होते हैं। OpenClaw discovery के दौरान matching models के लिए `reasoning: true`
    अपने आप set करता है।
  </Accordion>

  <Accordion title="Endpoint unavailability">
    यदि Mantle endpoint unavailable है या कोई model return नहीं करता, तो प्रदाता को
    चुपचाप skip कर दिया जाता है। OpenClaw error नहीं देता; अन्य configured providers
    सामान्य रूप से काम करते रहते हैं।
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle एक Anthropic Messages route भी expose करता है, जो Claude models को उसी bearer-authenticated streaming path से ले जाता है। Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) इस route के माध्यम से provider-owned streaming के साथ callable है, इसलिए AWS bearer tokens को Anthropic API keys की तरह treat नहीं किया जाता।

    जब आप Mantle provider पर Anthropic Messages model pin करते हैं, तो OpenClaw उस model के लिए `openai-completions` के बजाय `anthropic-messages` API surface उपयोग करता है। Auth अब भी `AWS_BEARER_TOKEN_BEDROCK` (या minted IAM bearer token) से आता है।

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle standard
    [Amazon Bedrock](/hi/providers/bedrock) प्रदाता से अलग प्रदाता है। Mantle
    OpenAI-संगत `/v1` surface उपयोग करता है, जबकि standard Bedrock provider
    native Bedrock API उपयोग करता है।

    मौजूद होने पर दोनों प्रदाता समान `AWS_BEARER_TOKEN_BEDROCK` credential साझा करते हैं।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/hi/providers/bedrock" icon="cloud">
    Anthropic Claude, Titan, और अन्य models के लिए native Bedrock provider।
  </Card>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="OAuth and auth" href="/hi/gateway/authentication" icon="key">
    Auth details और credential reuse rules।
  </Card>
  <Card title="Troubleshooting" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और उन्हें हल करने का तरीका।
  </Card>
</CardGroup>
