---
read_when:
    - Chcesz używać modeli StepFun w OpenClaw
    - Potrzebujesz instrukcji konfiguracji StepFun
summary: Korzystanie z modeli StepFun w OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-30T10:15:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw zawiera wbudowany Plugin dostawcy StepFun z dwoma identyfikatorami dostawcy:

- `stepfun` dla standardowego punktu końcowego
- `stepfun-plan` dla punktu końcowego Step Plan

<Warning>
Standardowy i Step Plan to **oddzielni dostawcy** z różnymi punktami końcowymi i prefiksami odwołań do modeli (`stepfun/...` oraz `stepfun-plan/...`). Użyj klucza chińskiego z punktami końcowymi `.com`, a klucza globalnego z punktami końcowymi `.ai`.
</Warning>

## Omówienie regionów i punktów końcowych

| Punkt końcowy | Chiny (`.com`)                         | Globalny (`.ai`)                     |
| ------------- | -------------------------------------- | ------------------------------------ |
| Standardowy   | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`          |
| Step Plan     | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Zmienna env uwierzytelniania: `STEPFUN_API_KEY`

## Wbudowany katalog

Standardowy (`stepfun`):

| Odwołanie do modelu      | Kontekst | Maks. dane wyjściowe | Uwagi                       |
| ------------------------ | -------- | -------------------- | --------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536               | Domyślny model standardowy  |

Step Plan (`stepfun-plan`):

| Odwołanie do modelu                | Kontekst | Maks. dane wyjściowe | Uwagi                          |
| ---------------------------------- | -------- | -------------------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536               | Domyślny model Step Plan       |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536               | Dodatkowy model Step Plan      |

## Pierwsze kroki

Wybierz powierzchnię dostawcy i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Standardowy">
    **Najlepsze do:** zastosowań ogólnych przez standardowy punkt końcowy StepFun.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania       | Punkt końcowy                   | Region        |
        | ---------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`    | Międzynarodowy |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1`   | Chiny         |
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Albo dla chińskiego punktu końcowego:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternatywa nieinteraktywna">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Odwołania do modeli

    - Model domyślny: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Najlepsze do:** punktu końcowego rozumowania Step Plan.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania     | Punkt końcowy                          | Region        |
        | -------------------------- | -------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1` | Międzynarodowy |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Chiny         |
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Albo dla chińskiego punktu końcowego:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternatywa nieinteraktywna">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Odwołania do modeli

    - Model domyślny: `stepfun-plan/step-3.5-flash`
    - Model alternatywny: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Pełna konfiguracja: dostawca standardowy">
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

  <Accordion title="Pełna konfiguracja: dostawca Step Plan">
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

  <Accordion title="Uwagi">
    - Dostawca jest dołączony do OpenClaw, więc nie ma oddzielnego kroku instalacji Plugin.
    - `step-3.5-flash-2603` jest obecnie udostępniony tylko w `stepfun-plan`.
    - Pojedynczy przepływ uwierzytelniania zapisuje profile dopasowane do regionu zarówno dla `stepfun`, jak i `stepfun-plan`, więc obie powierzchnie można wykrywać razem.
    - Użyj `openclaw models list` i `openclaw models set <provider/model>`, aby sprawdzać lub przełączać modele.

  </Accordion>
</AccordionGroup>

<Note>
Szersze omówienie dostawców znajdziesz w [Dostawcy modeli](/pl/concepts/model-providers).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Informacje o konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dostawców, modeli i plugins.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Platforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Zarządzanie kluczami API StepFun i dokumentacja.
  </Card>
</CardGroup>
