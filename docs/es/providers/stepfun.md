---
read_when:
    - Quieres modelos de StepFun en OpenClaw
    - Necesitas una guía de configuración de StepFun
summary: Usar modelos de StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-24T05:46:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw incluye un Plugin de proveedor StepFun con dos ids de proveedor:

- `stepfun` para el endpoint estándar
- `stepfun-plan` para el endpoint de Step Plan

<Warning>
Standard y Step Plan son **proveedores separados** con endpoints y prefijos de referencia de modelo distintos (`stepfun/...` frente a `stepfun-plan/...`). Usa una clave de China con los endpoints `.com` y una clave global con los endpoints `.ai`.
</Warning>

## Resumen de regiones y endpoints

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variable de entorno de autenticación: `STEPFUN_API_KEY`

## Catálogo integrado

Estándar (`stepfun`):

| Referencia de modelo      | Contexto | Salida máx. | Notas                  |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Modelo estándar predeterminado |

Step Plan (`stepfun-plan`):

| Referencia de modelo                | Contexto | Salida máx. | Notas                        |
| ---------------------------------- | ------- | ---------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Modelo predeterminado de Step Plan |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Modelo adicional de Step Plan |

## Primeros pasos

Elige la superficie de proveedor y sigue los pasos de configuración.

<Tabs>
  <Tab title="Standard">
    **Ideal para:** uso general mediante el endpoint estándar de StepFun.

    <Steps>
      <Step title="Elige la región del endpoint">
        | Opción de autenticación            | Endpoint                      | Región        |
        | -------------------------------- | ----------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`   | Internacional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`  | China         |
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        O para el endpoint de China:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Alternativa no interactiva">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Referencias de modelo

    - Modelo predeterminado: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Ideal para:** endpoint de razonamiento Step Plan.

    <Steps>
      <Step title="Elige la región del endpoint">
        | Opción de autenticación          | Endpoint                                | Región        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Internacional |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        O para el endpoint de China:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Alternativa no interactiva">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Referencias de modelo

    - Modelo predeterminado: `stepfun-plan/step-3.5-flash`
    - Modelo alternativo: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Configuración completa: proveedor Standard">
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

  <Accordion title="Configuración completa: proveedor Step Plan">
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

  <Accordion title="Notas">
    - El proveedor está incluido con OpenClaw, por lo que no hay un paso separado de instalación del Plugin.
    - `step-3.5-flash-2603` actualmente solo está expuesto en `stepfun-plan`.
    - Un único flujo de autenticación escribe perfiles coincidentes con la región para `stepfun` y `stepfun-plan`, de modo que ambas superficies puedan descubrirse juntas.
    - Usa `openclaw models list` y `openclaw models set <provider/model>` para inspeccionar o cambiar modelos.
  </Accordion>
</AccordionGroup>

<Note>
Para una visión general más amplia de proveedores, consulta [Proveedores de modelos](/es/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración para proveedores, modelos y Plugins.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Gestión de claves API de StepFun y documentación.
  </Card>
</CardGroup>
