---
read_when:
    - Quieres modelos StepFun en OpenClaw
    - Necesitas orientación para configurar StepFun
summary: Usar modelos de StepFun con OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-05T11:38:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 172b7ad5c2cf7cac9a99e391d0454efa4611acedd378d92b2b7ca47511bc0e5e
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun se distribuye como un Plugin oficial externo (`@openclaw/stepfun-provider`) con dos ids de proveedor:

- `stepfun` para el endpoint estándar
- `stepfun-plan` para el endpoint Step Plan

<Warning>
Estándar y Step Plan son **proveedores separados** con endpoints y prefijos de referencia de modelo distintos (`stepfun/...` frente a `stepfun-plan/...`). Usa una clave de China con los endpoints `.com` y una clave global con los endpoints `.ai`.
</Warning>

## Instalar Plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Resumen de región y endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Estándar  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Variable de entorno de autenticación: `STEPFUN_API_KEY`

## Catálogo integrado

Estándar (`stepfun`):

| Referencia de modelo     | Contexto | Salida máxima | Notas                    |
| ------------------------ | -------- | ------------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144  | 65,536        | Modelo estándar predeterminado |

Step Plan (`stepfun-plan`):

| Referencia de modelo               | Contexto | Salida máxima | Notas                         |
| ---------------------------------- | -------- | ------------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536        | Modelo Step Plan predeterminado |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536        | Modelo Step Plan adicional    |

## Primeros pasos

<Tabs>
  <Tab title="Estándar">
    Ideal para uso de propósito general mediante el endpoint estándar de StepFun.

    <Steps>
      <Step title="Elige la región de tu endpoint">
        | Opción de autenticación        | Endpoint                     | Región        |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Internacional |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | China          |
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Endpoint de China:

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

    Modelo predeterminado: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    Ideal para el endpoint de razonamiento Step Plan.

    <Steps>
      <Step title="Elige la región de tu endpoint">
        | Opción de autenticación     | Endpoint                                | Región        |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Internacional |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | China          |
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Endpoint de China:

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

    Modelo predeterminado: `stepfun-plan/step-3.5-flash`
    Modelo alternativo: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Un único flujo de autenticación escribe perfiles que coinciden con la región tanto para `stepfun` como para `stepfun-plan`, de modo que ambas superficies se descubren juntas después de una ejecución de incorporación.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Configuración completa: proveedor estándar">
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
    - `step-3.5-flash-2603` actualmente solo se expone en `stepfun-plan`.
    - Usa `openclaw models list` y `openclaw models set <provider/model>` para inspeccionar o cambiar modelos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo para proveedores, modelos y plugins.
  </Card>
  <Card title="CLI de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Plataforma StepFun" href="https://platform.stepfun.com" icon="globe">
    Gestión de claves de API de StepFun y documentación.
  </Card>
</CardGroup>
