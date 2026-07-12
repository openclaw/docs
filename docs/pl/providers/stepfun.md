---
read_when:
    - Chcesz korzystać z modeli StepFun w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji StepFun
summary: Korzystanie z modeli StepFun w OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T15:31:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun jest dostarczany jako zewnętrzny oficjalny plugin (`@openclaw/stepfun-provider`) z dwoma identyfikatorami dostawców:

- `stepfun` dla standardowego punktu końcowego
- `stepfun-plan` dla punktu końcowego Step Plan

<Warning>
Standard i Step Plan są **oddzielnymi dostawcami**, korzystającymi z różnych punktów końcowych i prefiksów odwołań do modeli (`stepfun/...` oraz `stepfun-plan/...`). Używaj klucza dla Chin z punktami końcowymi `.com`, a klucza globalnego z punktami końcowymi `.ai`.
</Warning>

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Przegląd regionów i punktów końcowych

| Punkt końcowy | Chiny (`.com`)                          | Globalny (`.ai`)                       |
| ------------- | --------------------------------------- | -------------------------------------- |
| Standard      | `https://api.stepfun.com/v1`            | `https://api.stepfun.ai/v1`            |
| Step Plan     | `https://api.stepfun.com/step_plan/v1`  | `https://api.stepfun.ai/step_plan/v1`  |

Zmienna środowiskowa uwierzytelniania: `STEPFUN_API_KEY`

## Wbudowany katalog

Standard (`stepfun`):

| Odwołanie do modelu      | Kontekst | Maks. wynik | Uwagi                                  |
| ------------------------ | -------- | ----------- | -------------------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536      | Domyślny model standardowy             |
| `stepfun/step-3.7-flash` | 262,144  | 262,144     | Obsługa multimodalnych danych obrazów  |

Step Plan (`stepfun-plan`):

| Odwołanie do modelu                | Kontekst | Maks. wynik | Uwagi                                 |
| ---------------------------------- | -------- | ----------- | ------------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536      | Domyślny model Step Plan              |
| `stepfun-plan/step-3.7-flash`      | 262,144  | 262,144     | Obsługa multimodalnych danych obrazów |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536      | Dodatkowy model Step Plan             |

## Pierwsze kroki

<Tabs>
  <Tab title="Standard">
    Najlepszy do zastosowań ogólnych za pośrednictwem standardowego punktu końcowego StepFun.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania           | Punkt końcowy                | Region         |
        | -------------------------------- | ---------------------------- | -------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`  | Międzynarodowy |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1` | Chiny          |
      </Step>
      <Step title="Uruchom wdrażanie">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Punkt końcowy dla Chin:

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
      <Step title="Sprawdź dostępność modeli">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Model domyślny: `stepfun/step-3.5-flash`
    Model alternatywny: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Najlepszy dla punktu końcowego wnioskowania Step Plan.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania        | Punkt końcowy                           | Region         |
        | ----------------------------- | --------------------------------------- | -------------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`   | Międzynarodowy |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1`  | Chiny          |
      </Step>
      <Step title="Uruchom wdrażanie">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Punkt końcowy dla Chin:

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
      <Step title="Sprawdź dostępność modeli">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Model domyślny: `stepfun-plan/step-3.5-flash`
    Modele alternatywne: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Jeden przepływ uwierzytelniania zapisuje dopasowane do regionu profile zarówno dla `stepfun`, jak i `stepfun-plan`, dzięki czemu oba interfejsy są wykrywane razem po jednym uruchomieniu wdrażania.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Pełna konfiguracja: dostawca Standard">
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

  <Accordion title="Uwagi">
    - `step-3.7-flash` przyjmuje w OpenClaw tekst i obrazy. Interfejs API StepFun obsługuje również wideo, które nie jest jeszcze modalnością danych wejściowych modelu w OpenClaw.
    - Step 3.7 obsługuje poziomy nakładu na wnioskowanie `low`, `medium` i `high`. Ponieważ model nie ma trybu bez wnioskowania, `/think off` jest mapowane na `low`.
    - `step-3.5-flash-2603` jest obecnie udostępniany tylko przez `stepfun-plan`.
    - Użyj poleceń `openclaw models list` i `openclaw models set <provider/model>`, aby przeglądać lub przełączać modele.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, odwołań do modeli i działania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dostawców, modeli i pluginów.
  </Card>
  <Card title="CLI modeli" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Platforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Zarządzanie kluczami API StepFun i dokumentacja.
  </Card>
</CardGroup>
