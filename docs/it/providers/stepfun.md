---
read_when:
    - Vuoi i modelli StepFun in OpenClaw
    - Ti serve una guida alla configurazione di StepFun
summary: Usa i modelli StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Il Plugin provider StepFun supporta due ID provider:

- `stepfun` per l'endpoint standard
- `stepfun-plan` per l'endpoint Step Plan

<Warning>
Standard e Step Plan sono **provider separati** con endpoint e prefissi dei riferimenti modello diversi (`stepfun/...` rispetto a `stepfun-plan/...`). Usa una chiave per la Cina con gli endpoint `.com` e una chiave globale con gli endpoint `.ai`.
</Warning>

## Installa il Plugin

Installa il Plugin ufficiale, quindi riavvia Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Panoramica di regione ed endpoint

| Endpoint  | Cina (`.com`)                         | Globale (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variabile d'ambiente di autenticazione: `STEPFUN_API_KEY`

## Catalogo integrato

Standard (`stepfun`):

| Riferimento modello      | Contesto | Output massimo | Note                    |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Modello standard predefinito |

Step Plan (`stepfun-plan`):

| Riferimento modello                | Contesto | Output massimo | Note                         |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Modello Step Plan predefinito |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Modello Step Plan aggiuntivo |

## Per iniziare

Scegli la superficie provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Standard">
    **Ideale per:** uso generico tramite l'endpoint StepFun standard.

    <Steps>
      <Step title="Choose your endpoint region">
        | Scelta di autenticazione         | Endpoint                         | Regione       |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internazionale |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Cina          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Oppure per l'endpoint Cina:

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

    ### Riferimenti modello

    - Modello predefinito: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Ideale per:** endpoint di ragionamento Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Scelta di autenticazione     | Endpoint                                | Regione       |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internazionale |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Cina          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Oppure per l'endpoint Cina:

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

    ### Riferimenti modello

    - Modello predefinito: `stepfun-plan/step-3.5-flash`
    - Modello alternativo: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Configurazione avanzata

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
    - Il provider è un pacchetto esterno ufficiale; installalo prima della configurazione.
    - `step-3.5-flash-2603` è attualmente esposto solo su `stepfun-plan`.
    - Un singolo flusso di autenticazione scrive profili corrispondenti alla regione sia per `stepfun` sia per `stepfun-plan`, quindi entrambe le superfici possono essere rilevate insieme.
    - Usa `openclaw models list` e `openclaw models set <provider/model>` per ispezionare o cambiare modelli.

  </Accordion>
</AccordionGroup>

<Note>
Per una panoramica più ampia dei provider, consulta [Provider di modelli](/it/concepts/model-providers).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, dei riferimenti modello e del comportamento di failover.
  </Card>
  <Card title="Configuration reference" href="/it/gateway/configuration-reference" icon="gear">
    Schema di configurazione completo per provider, modelli e Plugin.
  </Card>
  <Card title="Model selection" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Gestione delle chiavi API StepFun e documentazione.
  </Card>
</CardGroup>
