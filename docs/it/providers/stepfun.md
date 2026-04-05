---
read_when:
    - Vuoi usare i modelli StepFun in OpenClaw
    - Hai bisogno di indicazioni per la configurazione di StepFun
summary: Usa i modelli StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-05T14:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw include un plugin provider StepFun integrato con due id provider:

- `stepfun` per l'endpoint standard
- `stepfun-plan` per l'endpoint Step Plan

I cataloghi integrati attualmente differiscono per superficie:

- Standard: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Panoramica di regione ed endpoint

- Endpoint standard Cina: `https://api.stepfun.com/v1`
- Endpoint standard globale: `https://api.stepfun.ai/v1`
- Endpoint Step Plan Cina: `https://api.stepfun.com/step_plan/v1`
- Endpoint Step Plan globale: `https://api.stepfun.ai/step_plan/v1`
- Variabile env di autenticazione: `STEPFUN_API_KEY`

Usa una chiave Cina con gli endpoint `.com` e una chiave globale con gli
endpoint `.ai`.

## Configurazione CLI

Configurazione interattiva:

```bash
openclaw onboard
```

Scegli una di queste opzioni di autenticazione:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Esempi non interattivi:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Riferimenti ai modelli

- Modello predefinito standard: `stepfun/step-3.5-flash`
- Modello predefinito Step Plan: `stepfun-plan/step-3.5-flash`
- Modello alternativo Step Plan: `stepfun-plan/step-3.5-flash-2603`

## Cataloghi integrati

Standard (`stepfun`):

| Riferimento modello     | Contesto | Output massimo | Note                     |
| ----------------------- | -------- | -------------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536         | Modello standard predefinito |

Step Plan (`stepfun-plan`):

| Riferimento modello                  | Contesto | Output massimo | Note                         |
| ------------------------------------ | -------- | -------------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`        | 262,144 | 65,536         | Modello Step Plan predefinito |
| `stepfun-plan/step-3.5-flash-2603`   | 262,144 | 65,536         | Modello Step Plan aggiuntivo |

## Snippet di configurazione

Provider standard:

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

## Note

- Il provider è integrato in OpenClaw, quindi non esiste un passaggio separato di installazione del plugin.
- `step-3.5-flash-2603` è attualmente esposto solo su `stepfun-plan`.
- Un singolo flusso di autenticazione scrive profili corrispondenti alla regione sia per `stepfun` sia per `stepfun-plan`, così entrambe le superfici possono essere rilevate insieme.
- Usa `openclaw models list` e `openclaw models set <provider/model>` per ispezionare o cambiare modello.
- Per la panoramica più ampia dei provider, vedi [Provider di modelli](/concepts/model-providers).
