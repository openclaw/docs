---
read_when:
    - Chcesz używać modeli StepFun w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji StepFun
summary: Używaj modeli StepFun z OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:15:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Plugin dostawcy StepFun obsługuje dwa identyfikatory dostawcy:

- `stepfun` dla standardowego punktu końcowego
- `stepfun-plan` dla punktu końcowego Step Plan

<Warning>
Standard i Step Plan to **oddzielni dostawcy** z różnymi punktami końcowymi i prefiksami referencji modeli (`stepfun/...` oraz `stepfun-plan/...`). Użyj klucza chińskiego z punktami końcowymi `.com`, a klucza globalnego z punktami końcowymi `.ai`.
</Warning>

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Omówienie regionów i punktów końcowych

| Punkt końcowy | Chiny (`.com`)                         | Globalny (`.ai`)                      |
| ------------- | -------------------------------------- | ------------------------------------- |
| Standard      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan     | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Zmienna środowiskowa uwierzytelniania: `STEPFUN_API_KEY`

## Wbudowany katalog

Standardowy (`stepfun`):

| Referencja modelu        | Kontekst | Maks. dane wyjściowe | Uwagi                       |
| ------------------------ | -------- | -------------------- | --------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536               | Domyślny model standardowy  |

Step Plan (`stepfun-plan`):

| Referencja modelu                  | Kontekst | Maks. dane wyjściowe | Uwagi                         |
| ---------------------------------- | -------- | -------------------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536               | Domyślny model Step Plan      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536               | Dodatkowy model Step Plan     |

## Pierwsze kroki

Wybierz powierzchnię dostawcy i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Standard">
    **Najlepsze dla:** zastosowań ogólnych przez standardowy punkt końcowy StepFun.

    <Steps>
      <Step title="Choose your endpoint region">
        | Wybór uwierzytelniania          | Punkt końcowy                  | Region        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Międzynarodowy |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Chiny         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Lub dla chińskiego punktu końcowego:

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

    ### Referencje modeli

    - Domyślny model: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Najlepsze dla:** punktu końcowego rozumowania Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Wybór uwierzytelniania      | Punkt końcowy                         | Region        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Międzynarodowy |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Chiny         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Lub dla chińskiego punktu końcowego:

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

    ### Referencje modeli

    - Domyślny model: `stepfun-plan/step-3.5-flash`
    - Alternatywny model: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Konfiguracja zaawansowana

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
    - Dostawca jest oficjalnym pakietem zewnętrznym; zainstaluj go przed konfiguracją.
    - `step-3.5-flash-2603` jest obecnie udostępniany tylko w `stepfun-plan`.
    - Jeden przepływ uwierzytelniania zapisuje profile dopasowane do regionu zarówno dla `stepfun`, jak i `stepfun-plan`, więc obie powierzchnie można wykrywać razem.
    - Użyj `openclaw models list` i `openclaw models set <provider/model>`, aby sprawdzić lub przełączyć modele.

  </Accordion>
</AccordionGroup>

<Note>
Szersze omówienie dostawców znajdziesz w sekcji [Dostawcy modeli](/pl/concepts/model-providers).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dostawców, modeli i Pluginów.
  </Card>
  <Card title="Model selection" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Zarządzanie kluczami API StepFun i dokumentacja.
  </Card>
</CardGroup>
