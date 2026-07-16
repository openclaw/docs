---
read_when:
    - आप OpenClaw को LiteLLM प्रॉक्सी के माध्यम से रूट करना चाहते हैं
    - आपको LiteLLM के माध्यम से लागत ट्रैकिंग, लॉगिंग या मॉडल रूटिंग की आवश्यकता है
summary: एकीकृत मॉडल एक्सेस और लागत ट्रैकिंग के लिए LiteLLM Proxy के माध्यम से OpenClaw चलाएँ
title: LiteLLM
x-i18n:
    generated_at: "2026-07-16T16:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) एक ओपन-सोर्स LLM Gateway है, जो 100+ मॉडल
प्रदाताओं के लिए एक एकीकृत API प्रदान करता है। OpenClaw कॉन्फ़िगरेशन बदले बिना केंद्रीकृत लागत ट्रैकिंग, लॉगिंग, खर्च
सीमाओं वाली वर्चुअल कुंजियों और बैकएंड फ़ेलओवर के लिए OpenClaw को LiteLLM के माध्यम से रूट करें।

## त्वरित शुरुआत

<Tabs>
  <Tab title="ऑनबोर्डिंग (अनुशंसित)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    किसी रिमोट प्रॉक्सी के साथ गैर-इंटरैक्टिव सेटअप के लिए, प्रॉक्सी URL स्पष्ट रूप से दें:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="मैन्युअल सेटअप">
    <Steps>
      <Step title="LiteLLM प्रॉक्सी शुरू करें">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw को LiteLLM से कनेक्ट करें">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## कॉन्फ़िगरेशन

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

ऑनबोर्डिंग द्वारा लिखा जाने वाला डिफ़ॉल्ट मॉडल `litellm/claude-opus-4-6` है।

## इमेज जनरेशन

LiteLLM, OpenAI-संगत `/images/generations` और
`/images/edits` रूट के माध्यम से `image_generate` टूल का बैकएंड बन सकता है। डिफ़ॉल्ट इमेज मॉडल `gpt-image-2` है; किसी अन्य मॉडल को
`agents.defaults.imageGenerationModel` के अंतर्गत कॉन्फ़िगर करें:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

लूपबैक LiteLLM URL (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) किसी वैश्विक
निजी-नेटवर्क ओवरराइड के बिना काम करते हैं। LAN पर होस्ट किए गए प्रॉक्सी के लिए,
`models.providers.litellm.request.allowPrivateNetwork: true` सेट करें, क्योंकि API कुंजी उस होस्ट को भेजी जाती है।

## उन्नत

<AccordionGroup>
  <Accordion title="वर्चुअल कुंजियाँ">
    खर्च सीमाओं के साथ OpenClaw के लिए एक समर्पित कुंजी बनाएँ:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    जनरेट की गई कुंजी को `LITELLM_API_KEY` के रूप में उपयोग करें।

  </Accordion>

  <Accordion title="मॉडल रूटिंग">
    LiteLLM मॉडल अनुरोधों को अलग-अलग बैकएंड पर रूट कर सकता है। अपने LiteLLM `config.yaml` में कॉन्फ़िगर करें:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw, `claude-opus-4-6` का अनुरोध करना जारी रखता है; LiteLLM रूटिंग संभालता है।

  </Accordion>

  <Accordion title="उपयोग देखना">
    ```bash
    # कुंजी की जानकारी
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # खर्च लॉग
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="प्रॉक्सी व्यवहार संबंधी टिप्पणियाँ">
    - LiteLLM डिफ़ॉल्ट रूप से `http://localhost:4000` पर चलता है।
    - OpenClaw, LiteLLM के प्रॉक्सी-शैली वाले OpenAI-संगत `/v1` एंडपॉइंट के माध्यम से कनेक्ट होता है।
    - केवल नेटिव OpenAI के लिए अनुरोध संरचना, कॉन्फ़िगर किए गए LiteLLM बेस URL के माध्यम से लागू नहीं होती:
      न `service_tier`, न Responses `store`, न प्रॉम्प्ट-कैश संकेत, न OpenAI रीजनिंग-एफ़र्ट
      पेलोड संरचना।
    - छिपे हुए OpenClaw एट्रिब्यूशन हेडर (`originator`, `version`, `User-Agent`) केवल
      सत्यापित नेटिव OpenAI एंडपॉइंट को भेजे जाते हैं, इसलिए उन्हें किसी कस्टम LiteLLM बेस URL पर इंजेक्ट नहीं किया जाता।
  </Accordion>
</AccordionGroup>

<Note>
सामान्य प्रदाता कॉन्फ़िगरेशन और फ़ेलओवर व्यवहार के लिए, [मॉडल प्रदाता](/hi/concepts/model-providers) देखें।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="LiteLLM दस्तावेज़" href="https://docs.litellm.ai" icon="book">
    आधिकारिक LiteLLM दस्तावेज़ और API संदर्भ।
  </Card>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    सभी प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का अवलोकन।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    संपूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="मॉडल" href="/hi/concepts/models" icon="brain">
    मॉडल चुनने और कॉन्फ़िगर करने का तरीका।
  </Card>
</CardGroup>
