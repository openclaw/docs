---
read_when:
    - आप OpenClaw में StepFun मॉडल चाहते हैं
    - आपको StepFun सेटअप मार्गदर्शन चाहिए
summary: OpenClaw के साथ StepFun मॉडल का उपयोग करें
title: StepFun
x-i18n:
    generated_at: "2026-06-29T00:03:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun प्रदाता Plugin दो प्रदाता ids का समर्थन करता है:

- मानक endpoint के लिए `stepfun`
- Step Plan endpoint के लिए `stepfun-plan`

<Warning>
Standard और Step Plan **अलग-अलग प्रदाता** हैं, जिनके endpoints और model ref prefixes अलग हैं (`stepfun/...` बनाम `stepfun-plan/...`)। `.com` endpoints के साथ China key और `.ai` endpoints के साथ global key का उपयोग करें।
</Warning>

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः प्रारंभ करें:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## क्षेत्र और endpoint का अवलोकन

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth env var: `STEPFUN_API_KEY`

## अंतर्निहित catalog

Standard (`stepfun`):

| Model ref                | Context | Max output | Notes               |
| ------------------------ | ------- | ---------- | ------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | डिफ़ॉल्ट मानक model |

Step Plan (`stepfun-plan`):

| Model ref                          | Context | Max output | Notes                         |
| ---------------------------------- | ------- | ---------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | डिफ़ॉल्ट Step Plan model      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | अतिरिक्त Step Plan model      |

## शुरू करना

अपना प्रदाता surface चुनें और setup steps का पालन करें।

<Tabs>
  <Tab title="Standard">
    **इसके लिए सर्वोत्तम:** मानक StepFun endpoint के माध्यम से सामान्य-उद्देश्य उपयोग।

    <Steps>
      <Step title="Choose your endpoint region">
        | Auth choice                      | Endpoint                         | Region        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        या China endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Model refs

    - डिफ़ॉल्ट model: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **इसके लिए सर्वोत्तम:** Step Plan reasoning endpoint।

    <Steps>
      <Step title="Choose your endpoint region">
        | Auth choice                  | Endpoint                                | Region        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        या China endpoint के लिए:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Model refs

    - डिफ़ॉल्ट model: `stepfun-plan/step-3.5-flash`
    - वैकल्पिक model: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## उन्नत configuration

<AccordionGroup>
  <Accordion title="Full config: Standard provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Full config: Step Plan provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Notes">
    - प्रदाता एक आधिकारिक external package है; setup से पहले इसे इंस्टॉल करें।
    - `step-3.5-flash-2603` वर्तमान में केवल `stepfun-plan` पर उपलब्ध है।
    - एक single auth flow `stepfun` और `stepfun-plan` दोनों के लिए region-matched profiles लिखता है, इसलिए दोनों surfaces को साथ में discover किया जा सकता है।
    - models का निरीक्षण करने या switch करने के लिए `openclaw models list` और `openclaw models set <provider/model>` का उपयोग करें।

  </Accordion>
</AccordionGroup>

<Note>
व्यापक प्रदाता अवलोकन के लिए, [Model प्रदाता](/hi/concepts/model-providers) देखें।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    सभी प्रदाताओं, model refs, और failover behavior का अवलोकन।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    प्रदाताओं, models, और plugins के लिए पूरा config schema।
  </Card>
  <Card title="Model selection" href="/hi/concepts/models" icon="brain">
    models कैसे चुनें और configure करें।
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API key management और documentation।
  </Card>
</CardGroup>
