---
read_when:
    - Quieres Z.AI / modelos GLM en OpenClaw
    - Necesitas una configuración simple de `ZAI_API_KEY`
summary: Usa Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI es la plataforma de API para modelos **GLM**. Proporciona API REST para GLM y usa claves de API
para la autenticación. Crea tu clave de API en la consola de Z.AI. OpenClaw usa el proveedor `zai`
con una clave de API de Z.AI.

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- API: Z.AI Chat Completions (autenticación Bearer)

## Primeros pasos

<Tabs>
  <Tab title="Detección automática del endpoint">
    **Ideal para:** la mayoría de los usuarios. OpenClaw detecta el endpoint de Z.AI correspondiente a partir de la clave y aplica automáticamente la URL base correcta.

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
    **Ideal para:** usuarios que quieren forzar una superficie de API específica de Coding Plan o general.

    <Steps>
      <Step title="Elige la opción de incorporación correcta">
        ```bash
        # Coding Plan Global (recomendado para usuarios de Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (región de China)
        openclaw onboard --auth-choice zai-coding-cn

        # API general
        openclaw onboard --auth-choice zai-global

        # API general CN (región de China)
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

## Catálogo integrado

OpenClaw actualmente inicializa el proveedor `zai` incluido con:

| Model ref            | Notas               |
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
  <Accordion title="Resolución anticipada de modelos GLM-5 desconocidos">
    Los identificadores `glm-5*` desconocidos siguen resolviéndose anticipadamente en la ruta del proveedor incluido
    sintetizando metadatos propios del proveedor a partir de la plantilla `glm-4.7` cuando el id
    coincide con la forma actual de la familia GLM-5.
  </Accordion>

  <Accordion title="Streaming de llamadas a herramientas">
    `tool_stream` está habilitado de forma predeterminada para el streaming de llamadas a herramientas de Z.AI. Para desactivarlo:

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

  <Accordion title="Pensamiento y pensamiento preservado">
    El pensamiento de Z.AI sigue los controles `/think` de OpenClaw. Con el pensamiento desactivado,
    OpenClaw envía `thinking: { type: "disabled" }` para evitar respuestas que
    gasten el presupuesto de salida en `reasoning_content` antes del texto visible.

    El pensamiento preservado es opcional porque Z.AI requiere que se vuelva a reproducir
    todo el `reasoning_content` histórico, lo que aumenta los tokens del prompt. Actívalo
    por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Cuando está habilitado y el pensamiento está activado, OpenClaw envía
    `thinking: { type: "enabled", clear_thinking: false }` y vuelve a reproducir el
    `reasoning_content` anterior para la misma transcripción compatible con OpenAI.

    Los usuarios avanzados aún pueden sobrescribir la carga útil exacta del proveedor con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI incluido registra la comprensión de imágenes.

    | Property      | Value       |
    | ------------- | ----------- |
    | Modelo        | `glm-4.6v`  |

    La comprensión de imágenes se resuelve automáticamente a partir de la autenticación de Z.AI configurada; no
    se necesita configuración adicional.

  </Accordion>

  <Accordion title="Detalles de autenticación">
    - Z.AI usa autenticación Bearer con tu clave de API.
    - La opción de incorporación `zai-api-key` detecta automáticamente el endpoint de Z.AI correspondiente a partir del prefijo de la clave.
    - Usa las opciones regionales explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) cuando quieras forzar una superficie de API específica.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Familia de modelos GLM" href="/es/providers/glm" icon="microchip">
    Resumen de la familia de modelos para GLM.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
