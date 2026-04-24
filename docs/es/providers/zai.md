---
read_when:
    - Quieres modelos Z.AI / GLM en OpenClaw
    - Necesitas una configuración sencilla de `ZAI_API_KEY`
summary: Usa Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T05:47:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI es la plataforma de API para modelos **GLM**. Proporciona API REST para GLM y usa claves API
para la autenticación. Crea tu clave API en la consola de Z.AI. OpenClaw usa el proveedor `zai`
con una clave API de Z.AI.

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticación Bearer)

## Primeros pasos

<Tabs>
  <Tab title="Detección automática de endpoint">
    **Ideal para:** la mayoría de usuarios. OpenClaw detecta el endpoint de Z.AI correspondiente a partir de la clave y aplica automáticamente la `baseUrl` correcta.

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuarios que quieren forzar una superficie específica del plan Coding o de la API general.

    <Steps>
      <Step title="Elige la opción de incorporación correcta">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Establece un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo incluido

Actualmente, OpenClaw inicializa el proveedor `zai` incluido con:

| Model ref            | Notes               |
| -------------------- | ------------------- |
| `zai/glm-5.1`        | Modelo predeterminado |
| `zai/glm-5`          |                     |
| `zai/glm-5-turbo`    |                     |
| `zai/glm-5v-turbo`   |                     |
| `zai/glm-4.7`        |                     |
| `zai/glm-4.7-flash`  |                     |
| `zai/glm-4.7-flashx` |                     |
| `zai/glm-4.6`        |                     |
| `zai/glm-4.6v`       |                     |
| `zai/glm-4.5`        |                     |
| `zai/glm-4.5-air`    |                     |
| `zai/glm-4.5-flash`  |                     |
| `zai/glm-4.5v`       |                     |

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`). La referencia de modelo incluida predeterminada es `zai/glm-5.1`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución hacia delante de modelos GLM-5 desconocidos">
    Los ID desconocidos `glm-5*` siguen resolviéndose hacia delante en la ruta del proveedor incluido sintetizando metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el id
    coincide con la forma actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Streaming de llamadas a herramientas">
    `tool_stream` está habilitado de forma predeterminada para el streaming de llamadas a herramientas de Z.AI. Para deshabilitarlo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin incluido de Z.AI registra comprensión de imágenes.

    | Property      | Value       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación configurada de Z.AI; no
    se necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI usa autenticación Bearer con tu clave API.
    - La opción de incorporación `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente a partir del prefijo de la clave.
    - Usa las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quieras forzar una superficie específica de la API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Familia de modelos GLM" href="/es/providers/glm" icon="microchip">
    Resumen de la familia de modelos GLM.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
</CardGroup>
