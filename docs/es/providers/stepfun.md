---
read_when:
    - Quieres modelos de StepFun en OpenClaw
    - Necesitas orientación para configurar StepFun
summary: Usa modelos de StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-30T05:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw incluye un plugin de proveedor StepFun integrado con dos identificadores de proveedor:

- `stepfun` para el endpoint estándar
- `stepfun-plan` para el endpoint Step Plan

<Warning>
Standard y Step Plan son **proveedores separados** con endpoints y prefijos de referencia de modelo diferentes (`stepfun/...` frente a `stepfun-plan/...`). Usa una clave de China con los endpoints `.com` y una clave global con los endpoints `.ai`.
</Warning>

## Resumen de región y endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variable de entorno de autenticación: `STEPFUN_API_KEY`

## Catálogo integrado

Standard (`stepfun`):

| Referencia de modelo     | Contexto | Salida máxima | Notas                     |
| ------------------------ | -------- | ------------- | ------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536        | Modelo estándar predeterminado |

Step Plan (`stepfun-plan`):

| Referencia de modelo               | Contexto | Salida máxima | Notas                             |
| ---------------------------------- | -------- | ------------- | --------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536        | Modelo Step Plan predeterminado   |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536        | Modelo Step Plan adicional        |

## Primeros pasos

Elige tu superficie de proveedor y sigue los pasos de configuración.

<Tabs>
  <Tab title="Standard">
    **Ideal para:** uso de propósito general mediante el endpoint StepFun estándar.

    <Steps>
      <Step title="Elige la región de tu endpoint">
        | Opción de autenticación          | Endpoint                         | Región        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Internacional |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
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
      <Step title="Elige la región de tu endpoint">
        | Opción de autenticación      | Endpoint                                | Región        |
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
    - El proveedor viene integrado con OpenClaw, por lo que no hay un paso separado para instalar plugins.
    - `step-3.5-flash-2603` actualmente solo está expuesto en `stepfun-plan`.
    - Un único flujo de autenticación escribe perfiles que coinciden con la región para `stepfun` y `stepfun-plan`, por lo que ambas superficies pueden descubrirse juntas.
    - Usa `openclaw models list` y `openclaw models set <provider/model>` para inspeccionar o cambiar modelos.

  </Accordion>
</AccordionGroup>

<Note>
Para ver el resumen más amplio de proveedores, consulta [Proveedores de modelos](/es/concepts/model-providers).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo para proveedores, modelos y plugins.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Plataforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Gestión de claves de API y documentación de StepFun.
  </Card>
</CardGroup>
