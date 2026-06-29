---
read_when:
    - आप OpenClaw को LiteLLM प्रॉक्सी के ज़रिए रूट करना चाहते हैं
    - आपको LiteLLM के माध्यम से लागत ट्रैकिंग, लॉगिंग या मॉडल रूटिंग की आवश्यकता है
summary: एकीकृत मॉडल एक्सेस और लागत ट्रैकिंग के लिए OpenClaw को LiteLLM Proxy के माध्यम से चलाएँ
title: LiteLLM
x-i18n:
    generated_at: "2026-06-29T00:00:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) एक ओपन-सोर्स LLM Gateway है जो 100+ मॉडल प्रदाताओं के लिए एक एकीकृत API प्रदान करता है। केंद्रीकृत लागत ट्रैकिंग, लॉगिंग, और अपनी OpenClaw config बदले बिना बैकएंड स्विच करने की लचीलापन पाने के लिए OpenClaw को LiteLLM के माध्यम से रूट करें।

<Tip>
**OpenClaw के साथ LiteLLM क्यों उपयोग करें?**

- **लागत ट्रैकिंग** — देखें कि OpenClaw सभी मॉडलों पर ठीक कितना खर्च करता है
- **मॉडल रूटिंग** — config बदलावों के बिना Claude, GPT-4, Gemini, Bedrock के बीच स्विच करें
- **वर्चुअल कुंजियां** — OpenClaw के लिए खर्च सीमाओं वाली कुंजियां बनाएं
- **लॉगिंग** — डीबगिंग के लिए पूरे अनुरोध/प्रतिक्रिया लॉग
- **फॉलबैक** — आपका प्राथमिक प्रदाता बंद होने पर स्वचालित फेलओवर

</Tip>

## त्वरित शुरुआत

<Tabs>
  <Tab title="Onboarding (recommended)">
    **इसके लिए सर्वोत्तम:** काम करने वाले LiteLLM सेटअप तक सबसे तेज रास्ता।

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        किसी रिमोट प्रॉक्सी के साथ गैर-इंटरैक्टिव सेटअप के लिए, प्रॉक्सी URL स्पष्ट रूप से पास करें:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **इसके लिए सर्वोत्तम:** इंस्टॉलेशन और config पर पूरा नियंत्रण।

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        बस इतना ही। OpenClaw अब LiteLLM के माध्यम से रूट करता है।
      </Step>
    </Steps>

  </Tab>
</Tabs>

## कॉन्फ़िगरेशन

### एनवायरनमेंट वेरिएबल

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Config फ़ाइल

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

## उन्नत कॉन्फ़िगरेशन

### इमेज जनरेशन

LiteLLM OpenAI-संगत
`/images/generations` और `/images/edits` रूट के माध्यम से `image_generate` टूल का भी समर्थन कर सकता है। `agents.defaults.imageGenerationModel` के तहत LiteLLM इमेज
मॉडल कॉन्फ़िगर करें:

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

`http://localhost:4000` जैसे Loopback LiteLLM URL किसी वैश्विक
प्राइवेट-नेटवर्क ओवरराइड के बिना काम करते हैं। LAN पर होस्ट किए गए प्रॉक्सी के लिए,
`models.providers.litellm.request.allowPrivateNetwork: true` सेट करें क्योंकि API कुंजी
कॉन्फ़िगर किए गए प्रॉक्सी होस्ट को भेजी जाएगी।

<AccordionGroup>
  <Accordion title="Virtual keys">
    OpenClaw के लिए खर्च सीमाओं वाली एक समर्पित कुंजी बनाएं:

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

  <Accordion title="Model routing">
    LiteLLM मॉडल अनुरोधों को अलग-अलग बैकएंड पर रूट कर सकता है। इसे अपनी LiteLLM `config.yaml` में कॉन्फ़िगर करें:

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

    OpenClaw `claude-opus-4-6` का अनुरोध करता रहता है — LiteLLM रूटिंग संभालता है।

  </Accordion>

  <Accordion title="Viewing usage">
    LiteLLM का डैशबोर्ड या API जांचें:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM डिफ़ॉल्ट रूप से `http://localhost:4000` पर चलता है
    - OpenClaw LiteLLM के प्रॉक्सी-शैली OpenAI-संगत `/v1`
      endpoint के माध्यम से कनेक्ट करता है
    - नेटिव केवल-OpenAI अनुरोध शेपिंग LiteLLM के माध्यम से लागू नहीं होती:
      कोई `service_tier` नहीं, कोई Responses `store` नहीं, कोई prompt-cache संकेत नहीं, और कोई
      OpenAI reasoning-compat payload शेपिंग नहीं
    - छिपे हुए OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
      कस्टम LiteLLM base URLs पर inject नहीं किए जाते
  </Accordion>
</AccordionGroup>

<Note>
सामान्य प्रदाता कॉन्फ़िगरेशन और फेलओवर व्यवहार के लिए, [मॉडल प्रदाता](/hi/concepts/model-providers) देखें।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    आधिकारिक LiteLLM दस्तावेज़ और API संदर्भ।
  </Card>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    सभी प्रदाताओं, मॉडल refs, और फेलओवर व्यवहार का अवलोकन।
  </Card>
  <Card title="Configuration" href="/hi/gateway/configuration" icon="gear">
    पूरा config संदर्भ।
  </Card>
  <Card title="Model selection" href="/hi/concepts/models" icon="brain">
    मॉडल चुनने और कॉन्फ़िगर करने का तरीका।
  </Card>
</CardGroup>
