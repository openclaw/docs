---
read_when:
    - Vuoi i modelli StepFun in OpenClaw
    - Hai bisogno di indicazioni per la configurazione di StepFun
summary: Usare i modelli StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-24T08:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw include un Plugin provider StepFun integrato con due ID provider:

- `stepfun` per l'endpoint standard
- `stepfun-plan` per l'endpoint Step Plan

<Warning>
Standard e Step Plan sono **provider separati** con endpoint diversi e prefissi di riferimento del modello diversi (`stepfun/...` vs `stepfun-plan/...`). Usa una chiave China con gli endpoint `.com` e una chiave global con gli endpoint `.ai`.
</Warning>

## Panoramica di regioni ed endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variabile env auth: `STEPFUN_API_KEY`

## Catalogo integrato

Standard (`stepfun`):

| Riferimento modello       | Contesto | Output massimo | Note                     |
| ------------------------- | -------- | -------------- | ------------------------ |
| `stepfun/step-3.5-flash`  | 262,144  | 65,536         | Modello standard predefinito |

Step Plan (`stepfun-plan`):

| Riferimento modello                 | Contesto | Output massimo | Note                         |
| ----------------------------------- | -------- | -------------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`       | 262,144  | 65,536         | Modello Step Plan predefinito |
| `stepfun-plan/step-3.5-flash-2603`  | 262,144  | 65,536         | Modello Step Plan aggiuntivo |

## Per iniziare

Scegli la superficie provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Standard">
    **Ideale per:** uso generico tramite l'endpoint StepFun standard.

    <Steps>
      <Step title="Scegli la regione dell'endpoint">
        | Auth choice                      | Endpoint                         | Regione       |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internazionale |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Oppure per l'endpoint China:

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

    ### Riferimenti ai modelli

    - Modello predefinito: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Ideale per:** endpoint di reasoning Step Plan.

    <Steps>
      <Step title="Scegli la regione dell'endpoint">
        | Auth choice                  | Endpoint                                | Regione       |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internazionale |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Oppure per l'endpoint China:

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

    ### Riferimenti ai modelli

    - Modello predefinito: `stepfun-plan/step-3.5-flash`
    - Modello alternativo: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Configurazione completa: provider Standard">
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
    - Il provider è incluso in OpenClaw, quindi non serve un passaggio separato di installazione del Plugin.
    - `step-3.5-flash-2603` è attualmente esposto solo su `stepfun-plan`.
    - Un singolo flusso auth scrive profili con regione corrispondente sia per `stepfun` sia per `stepfun-plan`, così entrambe le superfici possono essere rilevate insieme.
    - Usa `openclaw models list` e `openclaw models set <provider/model>` per ispezionare o cambiare i modelli.

  </Accordion>
</AccordionGroup>

<Note>
Per la panoramica più ampia dei provider, vedi [Provider di modelli](/it/concepts/model-providers).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione per provider, modelli e Plugin.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Gestione della chiave API StepFun e documentazione.
  </Card>
</CardGroup>
