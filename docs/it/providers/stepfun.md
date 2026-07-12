---
read_when:
    - Vuoi i modelli StepFun in OpenClaw
    - Hai bisogno di indicazioni per la configurazione di StepFun
summary: Usa i modelli StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T07:26:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun viene distribuito come plugin ufficiale esterno (`@openclaw/stepfun-provider`) con due ID provider:

- `stepfun` per l'endpoint standard
- `stepfun-plan` per l'endpoint Step Plan

<Warning>
Standard e Step Plan sono **provider separati**, con endpoint e prefissi dei riferimenti ai modelli diversi (`stepfun/...` rispetto a `stepfun-plan/...`). Usa una chiave per la Cina con gli endpoint `.com` e una chiave globale con gli endpoint `.ai`.
</Warning>

## Installare il plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Panoramica di regioni ed endpoint

| Endpoint  | Cina (`.com`)                          | Globale (`.ai`)                       |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variabile d'ambiente per l'autenticazione: `STEPFUN_API_KEY`

## Catalogo integrato

Standard (`stepfun`):

| Riferimento modello       | Contesto | Output massimo | Note                                  |
| ------------------------ | -------- | -------------- | ------------------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536         | Modello standard predefinito          |
| `stepfun/step-3.7-flash` | 262,144  | 262,144        | Supporto per immagini come input multimodale |

Step Plan (`stepfun-plan`):

| Riferimento modello                 | Contesto | Output massimo | Note                                  |
| ---------------------------------- | -------- | -------------- | ------------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536         | Modello Step Plan predefinito         |
| `stepfun-plan/step-3.7-flash`      | 262,144  | 262,144        | Supporto per immagini come input multimodale |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536         | Modello Step Plan aggiuntivo          |

## Guida introduttiva

<Tabs>
  <Tab title="Standard">
    Ideale per un utilizzo generico tramite l'endpoint standard di StepFun.

    <Steps>
      <Step title="Scegli la regione dell'endpoint">
        | Scelta di autenticazione        | Endpoint                     | Regione        |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Internazionale |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | Cina           |
      </Step>
      <Step title="Esegui la configurazione iniziale">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Endpoint per la Cina:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternativa non interattiva">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    Modello predefinito: `stepfun/step-3.5-flash`
    Modello alternativo: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Ideale per l'endpoint di ragionamento Step Plan.

    <Steps>
      <Step title="Scegli la regione dell'endpoint">
        | Scelta di autenticazione     | Endpoint                                | Regione        |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Internazionale |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Cina           |
      </Step>
      <Step title="Esegui la configurazione iniziale">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Endpoint per la Cina:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternativa non interattiva">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    Modello predefinito: `stepfun-plan/step-3.5-flash`
    Modelli alternativi: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Un singolo flusso di autenticazione scrive profili corrispondenti alla regione sia per `stepfun` sia per `stepfun-plan`, quindi entrambe le interfacce vengono rilevate insieme dopo una sola esecuzione della configurazione iniziale.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Configurazione completa: provider standard">
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

  <Accordion title="Configurazione completa: provider Step Plan">
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

  <Accordion title="Note">
    - `step-3.7-flash` accetta testo e immagini come input tramite OpenClaw. L'API di StepFun supporta anche i video, che non costituiscono ancora una modalità di input dei modelli in OpenClaw.
    - Step 3.7 supporta livelli di intensità di ragionamento `low`, `medium` e `high`. Poiché il modello non dispone di una modalità senza ragionamento, `/think off` viene associato a `low`.
    - `step-3.5-flash-2603` è attualmente disponibile solo su `stepfun-plan`.
    - Usa `openclaw models list` e `openclaw models set <provider/model>` per esaminare o cambiare modello.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo per provider, modelli e plugin.
  </Card>
  <Card title="CLI dei modelli" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Piattaforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Gestione delle chiavi API e documentazione di StepFun.
  </Card>
</CardGroup>
