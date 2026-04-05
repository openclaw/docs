---
read_when:
    - Chcesz używać modeli StepFun w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji StepFun
summary: Używanie modeli StepFun z OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-05T14:03:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw zawiera dołączony plugin providera StepFun z dwoma identyfikatorami providerów:

- `stepfun` dla standardowego endpointu
- `stepfun-plan` dla endpointu Step Plan

Wbudowane katalogi obecnie różnią się powierzchnią:

- Standard: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Przegląd regionów i endpointów

- Chiński standardowy endpoint: `https://api.stepfun.com/v1`
- Globalny standardowy endpoint: `https://api.stepfun.ai/v1`
- Chiński endpoint Step Plan: `https://api.stepfun.com/step_plan/v1`
- Globalny endpoint Step Plan: `https://api.stepfun.ai/step_plan/v1`
- Zmienna env auth: `STEPFUN_API_KEY`

Używaj chińskiego klucza z endpointami `.com`, a globalnego klucza z
endpointami `.ai`.

## Konfiguracja przez CLI

Konfiguracja interaktywna:

```bash
openclaw onboard
```

Wybierz jedną z tych opcji auth:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Przykłady nieinteraktywne:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Referencje modeli

- Standardowy model domyślny: `stepfun/step-3.5-flash`
- Domyślny model Step Plan: `stepfun-plan/step-3.5-flash`
- Alternatywny model Step Plan: `stepfun-plan/step-3.5-flash-2603`

## Wbudowane katalogi

Standard (`stepfun`):

| Referencja modelu        | Kontekst | Maks. wyjście | Uwagi                      |
| ------------------------ | -------- | ------------- | -------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536        | Domyślny model standardowy |

Step Plan (`stepfun-plan`):

| Referencja modelu                  | Kontekst | Maks. wyjście | Uwagi                        |
| ---------------------------------- | -------- | ------------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536        | Domyślny model Step Plan     |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536        | Dodatkowy model Step Plan    |

## Fragmenty konfiguracji

Provider standardowy:

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

Provider Step Plan:

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

## Uwagi

- Provider jest dołączony do OpenClaw, więc nie ma osobnego kroku instalacji pluginu.
- `step-3.5-flash-2603` jest obecnie udostępniany tylko w `stepfun-plan`.
- Jeden przepływ auth zapisuje profile dopasowane do regionu zarówno dla `stepfun`, jak i `stepfun-plan`, dzięki czemu obie powierzchnie mogą być wykrywane razem.
- Użyj `openclaw models list` oraz `openclaw models set <provider/model>`, aby sprawdzić lub przełączyć modele.
- Szerszy przegląd providerów znajdziesz w [Model providers](/concepts/model-providers).
