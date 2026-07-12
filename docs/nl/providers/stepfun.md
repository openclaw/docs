---
read_when:
    - U wilt StepFun-modellen in OpenClaw
    - Je hebt hulp nodig bij het instellen van StepFun
summary: StepFun-modellen gebruiken met OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T09:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun wordt geleverd als een externe officiële plugin (`@openclaw/stepfun-provider`) met twee aanbieder-id's:

- `stepfun` voor het standaardendpoint
- `stepfun-plan` voor het Step Plan-endpoint

<Warning>
Standaard en Step Plan zijn **afzonderlijke aanbieders** met verschillende endpoints en modelreferentievoorvoegsels (`stepfun/...` tegenover `stepfun-plan/...`). Gebruik een sleutel voor China met de `.com`-endpoints en een globale sleutel met de `.ai`-endpoints.
</Warning>

## Plugin installeren

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Overzicht van regio's en endpoints

| Endpoint  | China (`.com`)                         | Globaal (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standaard | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Omgevingsvariabele voor authenticatie: `STEPFUN_API_KEY`

## Ingebouwde catalogus

Standaard (`stepfun`):

| Modelreferentie          | Context | Maximale uitvoer | Opmerkingen                         |
| ------------------------ | ------- | ---------------- | ----------------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536           | Standaardmodel                      |
| `stepfun/step-3.7-flash` | 262,144 | 262,144          | Ondersteunt multimodale afbeeldingsinvoer |

Step Plan (`stepfun-plan`):

| Modelreferentie                    | Context | Maximale uitvoer | Opmerkingen                              |
| ---------------------------------- | ------- | ---------------- | ---------------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536           | Standaardmodel voor Step Plan            |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144          | Ondersteunt multimodale afbeeldingsinvoer |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536           | Aanvullend Step Plan-model               |

## Aan de slag

<Tabs>
  <Tab title="Standard">
    Het meest geschikt voor algemeen gebruik via het standaardendpoint van StepFun.

    <Steps>
      <Step title="Choose your endpoint region">
        | Authenticatiekeuze             | Endpoint                     | Regio         |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Internationaal |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | China          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Endpoint voor China:

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

    Standaardmodel: `stepfun/step-3.5-flash`
    Alternatief model: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Het meest geschikt voor het redeneerendpoint van Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Authenticatiekeuze          | Endpoint                                | Regio         |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Internationaal |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | China          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Endpoint voor China:

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

    Standaardmodel: `stepfun-plan/step-3.5-flash`
    Alternatieve modellen: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Eén authenticatiestroom schrijft profielen die met de regio overeenkomen voor zowel `stepfun` als `stepfun-plan`, zodat beide oppervlakken samen worden gedetecteerd na één onboardinguitvoering.

## Geavanceerde configuratie

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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
    - `step-3.7-flash` accepteert tekst- en afbeeldingsinvoer via OpenClaw. De API van StepFun ondersteunt ook video, maar dat is nog geen modaliteit voor modelinvoer in OpenClaw.
    - Step 3.7 ondersteunt de redeneerinspanningen `low`, `medium` en `high`. Omdat het model geen modus zonder redeneren heeft, wordt `/think off` toegewezen aan `low`.
    - `step-3.5-flash-2603` is momenteel alleen beschikbaar via `stepfun-plan`.
    - Gebruik `openclaw models list` en `openclaw models set <provider/model>` om modellen te bekijken of van model te wisselen.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model providers" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle aanbieders, modelreferenties en failovergedrag.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema voor aanbieders, modellen en plugins.
  </Card>
  <Card title="Models CLI" href="/nl/concepts/models" icon="brain">
    Modellen kiezen en configureren.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Beheer en documentatie van StepFun API-sleutels.
  </Card>
</CardGroup>
