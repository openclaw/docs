---
read_when:
    - Quieres modelos Z.AI / GLM en OpenClaw
    - Necesitas una configuración sencilla de ZAI_API_KEY
summary: Usar Z.AI (modelos GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T05:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI es la plataforma de API para los modelos **GLM**. Proporciona API REST para GLM y utiliza claves de API
para la autenticación. Crea tu clave de API en la consola de Z.AI. OpenClaw usa el proveedor `zai`
con una clave de API de Z.AI.

- Proveedor: `zai`
- Autenticación: `ZAI_API_KEY`
- API: Chat Completions de Z.AI (autenticación Bearer)

## Primeros pasos

<Tabs>
  <Tab title="Endpoint de detección automática">
    **Ideal para:** la mayoría de los usuarios. OpenClaw detecta el endpoint de Z.AI correspondiente a partir de la clave y aplica automáticamente la URL base correcta.

    <Steps>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Configurar un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Ideal para:** usuarios que quieren forzar un Coding Plan específico o una superficie de API general.

    <Steps>
      <Step title="Elegir la opción de incorporación correcta">
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
      <Step title="Configurar un modelo predeterminado">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Catálogo integrado

OpenClaw actualmente inicializa el proveedor `zai` incluido con:

| Referencia de modelo | Notas                  |
| -------------------- | ---------------------- |
| `zai/glm-5.1`        | Modelo predeterminado  |
| `zai/glm-5`          |                        |
| `zai/glm-5-turbo`    |                        |
| `zai/glm-5v-turbo`   |                        |
| `zai/glm-4.7`        |                        |
| `zai/glm-4.7-flash`  |                        |
| `zai/glm-4.7-flashx` |                        |
| `zai/glm-4.6`        |                        |
| `zai/glm-4.6v`       |                        |
| `zai/glm-4.5`        |                        |
| `zai/glm-4.5-air`    |                        |
| `zai/glm-4.5-flash`  |                        |
| `zai/glm-4.5v`       |                        |

<Tip>
Los modelos GLM están disponibles como `zai/<model>` (ejemplo: `zai/glm-5`). La referencia de modelo incluida de forma predeterminada es `zai/glm-5.1`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Resolución futura de modelos GLM-5 desconocidos">
    Los id `glm-5*` desconocidos aún se resuelven hacia delante en la ruta del proveedor incluido
    sintetizando metadatos propiedad del proveedor a partir de la plantilla `glm-4.7` cuando el id
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

  <Accordion title="Razonamiento y razonamiento conservado">
    El razonamiento de Z.AI sigue los controles `/think` de OpenClaw. Con el razonamiento desactivado,
    OpenClaw envía `thinking: { type: "disabled" }` para evitar respuestas que
    gasten el presupuesto de salida en `reasoning_content` antes del texto visible.

    El razonamiento conservado es opcional porque Z.AI requiere reproducir todo el
    historial de `reasoning_content`, lo que aumenta los tokens del prompt. Habilítalo
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

    Cuando está habilitado y el razonamiento está activado, OpenClaw envía
    `thinking: { type: "enabled", clear_thinking: false }` y reproduce el
    `reasoning_content` previo para la misma transcripción compatible con OpenAI.

    Los usuarios avanzados aún pueden sobrescribir la carga útil exacta del proveedor con
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Comprensión de imágenes">
    El Plugin de Z.AI incluido registra la comprensión de imágenes.

    | Propiedad | Valor      |
    | --------- | ---------- |
    | Modelo    | `glm-4.6v` |

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
    Resumen de la familia de modelos GLM.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
</CardGroup>
